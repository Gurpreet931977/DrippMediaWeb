"use client";

import React, { useState, useEffect, useRef } from 'react';

// Phase 1: Write Initial Brief
// Phase 2: Draw the Brief
// Phase 3: Guess the Drawing (Write Brief)
// Loop Phase 2 & 3 until chains reach original owners
// Phase 4: Reveal Chains

export default function BrokenBrief({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, writing, drawing, guessing, reveal, gameover
    roundIndex: 0,
    timer: 0,
    chains: {}, // { 'player1': [{ author: 'p1', type: 'text', content: 'hello' }] }
    currentAssignments: {}, // { 'player2': 'player1' } -> p2 is working on p1's chain
    readyPlayers: [], // who has submitted this round
    revealIndex: 0
  });

  const [inputText, setInputText] = useState('');
  
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Initialize Game (Host)
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialChains = {};
      const initialAssignments = {};
      players.forEach(p => {
         initialChains[p] = [];
         initialAssignments[p] = p; // Everyone starts with their own chain
      });

      const initialState = {
        status: 'writing',
        roundIndex: 0,
        timer: 45, // 45 seconds to write initial prompt
        chains: initialChains,
        currentAssignments: initialAssignments,
        readyPlayers: [],
        revealIndex: 0
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  // Sync state
  useEffect(() => {
    if (!channel) return;
    channel.on('broadcast', { event: 'sync_state' }, (payload) => {
      setGameState(payload.payload);
    });

    // Host listens for submissions
    if (isHost) {
      channel.on('broadcast', { event: 'submit_page' }, (payload) => {
         const { player, content, type, chainId } = payload.payload;
         
         setGameState(prev => {
            const newChains = { ...prev.chains };
            newChains[chainId] = [...newChains[chainId], { author: player, type, content }];
            
            const newReady = [...prev.readyPlayers, player];
            
            // If everyone submitted
            if (newReady.length === players.length) {
               // Shift assignments
               const newAssignments = {};
               const playerKeys = Object.keys(prev.currentAssignments);
               for (let i = 0; i < playerKeys.length; i++) {
                  const currentP = playerKeys[i];
                  const nextP = playerKeys[(i + 1) % playerKeys.length];
                  newAssignments[nextP] = prev.currentAssignments[currentP]; // Pass chain to right
               }

               const nextRound = prev.roundIndex + 1;
               let nextStatus = 'drawing';
               if (nextRound % 2 === 0) nextStatus = 'guessing'; // even rounds (2, 4...) are guessing
               if (nextRound >= players.length) nextStatus = 'reveal'; // everyone went

               const timer = nextStatus === 'drawing' ? 60 : (nextStatus === 'guessing' ? 30 : 0);

               const newState = {
                 ...prev,
                 chains: newChains,
                 currentAssignments: newAssignments,
                 readyPlayers: [],
                 roundIndex: nextRound,
                 status: nextStatus,
                 timer
               };
               channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
               return newState;
            }

            const newState = { ...prev, chains: newChains, readyPlayers: newReady };
            channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
            return newState;
         });
      });
    }
  }, [channel, isHost, players.length]);

  // Host Timer
  useEffect(() => {
    let interval;
    if (isHost && (gameState.status === 'writing' || gameState.status === 'drawing' || gameState.status === 'guessing')) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
            // Force submit for those who haven't
            const unready = players.filter(p => !prev.readyPlayers.includes(p));
            unready.forEach(p => {
               // In a real robust system, host forces them. Here, we'll let clients self-submit on 0.
               // We just send a sync to 0 to trigger client auto-submit.
            });
            const newState = { ...prev, timer: 0 };
            channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
            return newState;
          }
          const newState = { ...prev, timer: prev.timer - 1 };
          channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
          return newState;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHost, gameState.status]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (gameState.timer === 0 && !gameState.readyPlayers.includes(playerName)) {
       if (gameState.status === 'writing' || gameState.status === 'guessing') {
           submitText();
       } else if (gameState.status === 'drawing') {
           submitDrawing();
       }
    }
  }, [gameState.timer]);

  // Canvas Setup
  useEffect(() => {
    if (gameState.status === 'drawing') {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111'; // background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctxRef.current = ctx;
      }
    }
  }, [gameState.status]);

  const submitText = (e) => {
    if (e) e.preventDefault();
    if (gameState.readyPlayers.includes(playerName)) return;
    
    const chainId = gameState.currentAssignments[playerName];
    const text = inputText.trim() || 'No answer';
    
    channel.send({
      type: 'broadcast', event: 'submit_page',
      payload: { player: playerName, content: text, type: 'text', chainId }
    });
    
    setInputText('');
  };

  const submitDrawing = () => {
    if (gameState.readyPlayers.includes(playerName)) return;
    
    const chainId = gameState.currentAssignments[playerName];
    const canvas = canvasRef.current;
    
    // Compress heavily to avoid Supabase limits
    const dataUrl = canvas ? canvas.toDataURL('image/jpeg', 0.5) : ''; 

    channel.send({
      type: 'broadcast', event: 'submit_page',
      payload: { player: playerName, content: dataUrl, type: 'image', chainId }
    });
  };

  // Drawing Handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    isDrawingRef.current = true;
    lastPosRef.current = getMousePos(e);
  };

  const draw = (e) => {
    if (!isDrawingRef.current || gameState.readyPlayers.includes(playerName)) return;
    const currentPos = getMousePos(e);
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => { isDrawingRef.current = false; };

  // --- RENDERS ---

  if (gameState.status === 'starting') return <div style={{color:'white', textAlign:'center', marginTop:'100px'}}>Binding the Briefs...</div>;

  const isReady = gameState.readyPlayers.includes(playerName);
  const myChainId = gameState.currentAssignments[playerName];
  const myChain = gameState.chains[myChainId];
  const previousPage = myChain ? myChain[myChain.length - 1] : null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      padding: '20px'
    }}>
      
      <div style={{ position: 'absolute', top: 20, right: 20, fontSize: '2rem', fontFamily: 'monospace' }}>
        ⏳ {Math.max(0, gameState.timer)}
      </div>

      {isReady && gameState.status !== 'reveal' ? (
        <div style={{ margin: 'auto', textAlign: 'center' }}>
          <h2 style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif" }}>WAITING FOR OTHERS</h2>
          <p>{gameState.readyPlayers.length} / {players.length} ready</p>
        </div>
      ) : gameState.status === 'writing' ? (
        <div style={{ margin: 'auto', textAlign: 'center', width: '100%', maxWidth: '600px' }}>
          <h2 style={{ color: '#33ccff', fontFamily: "'Panchang', sans-serif" }}>THE CLIENT BRIEF</h2>
          <p style={{ opacity: 0.7, marginBottom: '30px' }}>Write a crazy prompt for the next player to draw.</p>
          <form onSubmit={submitText} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="e.g. A neon cat eating pizza in space..." autoFocus
              style={{ padding: '20px', borderRadius: '12px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '15px', borderRadius: '12px', background: '#ebd73f', color: '#000', fontWeight: 'bold', fontSize: '1.1rem' }}>SUBMIT</button>
          </form>
        </div>
      ) : gameState.status === 'drawing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
          <h2 style={{ margin: '10px 0', fontFamily: "'Panchang', sans-serif" }}>DRAW THIS:</h2>
          <h1 style={{ color: '#ff33ff', marginBottom: '20px' }}>{previousPage?.content}</h1>
          <div style={{ 
            flex: 1, width: '100%', maxWidth: '800px', background: '#111', 
            borderRadius: '12px', border: '2px solid rgba(255,255,255,0.1)' 
          }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'crosshair' }}
              onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
            />
          </div>
          <button onClick={submitDrawing} style={{ marginTop: '20px', padding: '15px 40px', background: '#ebd73f', color: '#000', borderRadius: '12px', fontWeight: 'bold' }}>DONE DRAWING</button>
        </div>
      ) : gameState.status === 'guessing' ? (
        <div style={{ margin: 'auto', textAlign: 'center', width: '100%', maxWidth: '800px' }}>
          <h2 style={{ color: '#33ff33', fontFamily: "'Panchang', sans-serif" }}>WHAT IS THIS?!</h2>
          <div style={{ margin: '20px auto', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', height: '400px' }}>
             <img src={previousPage?.content} alt="Drawing" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }} />
          </div>
          <form onSubmit={submitText} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input 
              type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="Describe what you see..." autoFocus
              style={{ padding: '20px', borderRadius: '12px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '15px', borderRadius: '12px', background: '#ebd73f', color: '#000', fontWeight: 'bold', fontSize: '1.1rem' }}>SUBMIT GUESS</button>
          </form>
        </div>
      ) : gameState.status === 'reveal' && (
        <div style={{ width: '100%', maxWidth: '800px', margin: 'auto', textAlign: 'center' }}>
          <h1 style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", marginBottom: '40px' }}>THE REVEAL</h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
             {/* Simple reveal UI: just list all chains for players to scroll through */}
             {Object.keys(gameState.chains).map(owner => (
                <div key={owner} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', marginBottom: '40px' }}>
                   <h3 style={{ color: '#33ccff' }}>{owner}'s Brief</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                      {gameState.chains[owner].map((page, idx) => (
                         <div key={idx} style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px' }}>
                            <p style={{ opacity: 0.5, margin: '0 0 10px 0' }}>{page.author} {page.type === 'text' ? 'wrote:' : 'drew:'}</p>
                            {page.type === 'text' ? (
                               <h2 style={{ margin: 0 }}>{page.content}</h2>
                            ) : (
                               <img src={page.content} alt="Drawing" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                            )}
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>

          {isHost && (
             <button onClick={() => {
                const initialChains = {}; const initialAssignments = {};
                players.forEach(p => { initialChains[p] = []; initialAssignments[p] = p; });
                const newState = { status: 'writing', roundIndex: 0, timer: 45, chains: initialChains, currentAssignments: initialAssignments, readyPlayers: [], revealIndex: 0 };
                channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
                setGameState(newState);
             }} style={{ padding: '15px 40px', background: '#ebd73f', color: '#000', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '40px' }}>PLAY AGAIN</button>
          )}
        </div>
      )}

    </div>
  );
}
