"use client";

import React, { useState, useEffect, useRef } from 'react';
import { PenTool, Keyboard, Eye, ChevronRight, CheckCircle2 } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

export default function BrokenBrief({ channel, isHost, players, playerName, playerAvatars }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, writing, drawing, guessing, reveal, gameover
    roundIndex: 0,
    timer: 0,
    chains: {}, // { 'player1': [{ author: 'p1', type: 'text', content: 'hello' }] }
    currentAssignments: {}, // { 'player2': 'player1' } -> p2 is working on p1's chain
    readyPlayers: [], 
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
    const sub = channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
      setGameState(payload);
    });

    if (isHost) {
      channel.on('broadcast', { event: 'submit_page' }, ({ payload }) => {
         const { player, content, type, chainId } = payload;
         
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
                  newAssignments[nextP] = prev.currentAssignments[currentP];
               }

               const nextRound = prev.roundIndex + 1;
               let nextStatus = 'drawing';
               if (nextRound % 2 === 0) nextStatus = 'guessing';
               if (nextRound >= players.length) nextStatus = 'reveal';

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

    return () => { channel.removeChannel(sub); }
  }, [channel, isHost, players.length]);

  // Host Timer
  useEffect(() => {
    let interval;
    if (isHost && (gameState.status === 'writing' || gameState.status === 'drawing' || gameState.status === 'guessing')) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
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
        ctx.fillStyle = '#0a0a0a';
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
    if (gameState.readyPlayers.includes(playerName)) return;
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
      ctx.strokeStyle = '#33ccff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#33ccff';
      ctx.stroke();
    }
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => { isDrawingRef.current = false; };

  const isReady = gameState.readyPlayers.includes(playerName);
  const myChainId = gameState.currentAssignments[playerName];
  const myChain = gameState.chains[myChainId];
  const previousPage = myChain ? myChain[myChain.length - 1] : null;

  if (gameState.status === 'starting') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: "'Panchang', sans-serif" }}>BINDING THE BRIEFS...</div>;
  }

  return (
    <div style={styles.background}>
      
      {/* GLOBAL HEADER */}
      {gameState.status !== 'reveal' && (
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h1 style={{ margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#33ccff', letterSpacing: '2px' }}>THE BROKEN BRIEF</h1>
            <span style={{ opacity: 0.5 }}>ROUND {gameState.roundIndex + 1}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: gameState.timer <= 10 ? '#ff3333' : '#ebd73f', fontFamily: "'Panchang', sans-serif" }}>
            <Eye size={20} />
            <span style={{ fontSize: '1.2rem' }}>{Math.max(0, gameState.timer)}s</span>
          </div>
        </div>
      )}

      {/* WAITING SCREEN */}
      {isReady && gameState.status !== 'reveal' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={80} color="#33ff33" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#fff', fontFamily: "'Panchang', sans-serif", fontSize: '2rem' }}>LOCKED IN</h2>
          <p style={{ opacity: 0.7, fontSize: '1.2rem', marginTop: '10px' }}>Waiting for {players.length - gameState.readyPlayers.length} agents...</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
            {players.map(p => (
              <div key={p} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <CustomAvatar config={playerAvatars && playerAvatars[p]} size={32} />
                <div style={{ width: '40px', height: '4px', background: gameState.readyPlayers.includes(p) ? '#33ff33' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
              </div>
            ))}
          </div>
        </div>
      ) : 

      /* WRITING PHASE */
      gameState.status === 'writing' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ ...styles.glassPanel, width: '100%', maxWidth: '700px', padding: '50px', textAlign: 'center' }}>
            <Keyboard size={48} color="#33ccff" style={{ margin: '0 auto 20px auto' }} />
            <h2 style={{ color: '#33ccff', fontFamily: "'Panchang', sans-serif", fontSize: '2rem', marginBottom: '10px' }}>THE CLIENT BRIEF</h2>
            <p style={{ opacity: 0.7, marginBottom: '40px', fontSize: '1.2rem' }}>Write a crazy, detailed prompt for the next player to draw.</p>
            
            <form onSubmit={submitText} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input 
                type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                placeholder="e.g. A neon cat eating pizza in space..." autoFocus
                style={{ padding: '25px', borderRadius: '16px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(51, 204, 255, 0.3)', color: '#fff', outline: 'none', textAlign: 'center', fontFamily: "'Clash Display', sans-serif" }}
              />
              <button type="submit" style={{ ...styles.btn, background: '#ebd73f', color: '#000' }}>SUBMIT BRIEF <ChevronRight size={20} /></button>
            </form>
          </div>
        </div>
      ) : 

      /* DRAWING PHASE */
      gameState.status === 'drawing' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', paddingTop: '100px' }}>
          <div style={{ ...styles.glassPanel, width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            <div style={{ padding: '20px 30px', background: 'rgba(51, 204, 255, 0.1)', borderBottom: '1px solid rgba(51, 204, 255, 0.2)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <PenTool color="#33ccff" />
              <div style={{ flex: 1 }}>
                <span style={{ opacity: 0.7, fontSize: '0.9rem', letterSpacing: '2px' }}>DRAW THIS EXACTLY:</span>
                <h2 style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '1.5rem' }}>"{previousPage?.content}"</h2>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', cursor: 'crosshair' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
                onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing}
              />
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={submitDrawing} style={{ ...styles.btn, background: '#33ccff', color: '#000' }}>DONE DRAWING</button>
            </div>
          </div>
        </div>
      ) : 

      /* GUESSING PHASE */
      gameState.status === 'guessing' ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', paddingTop: '100px' }}>
          <div style={{ ...styles.glassPanel, width: '100%', maxWidth: '800px', padding: '40px', textAlign: 'center' }}>
            <h2 style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem', marginBottom: '20px' }}>WHAT IN THE WORLD IS THIS?!</h2>
            
            <div style={{ margin: '0 auto 30px auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden', height: '400px', background: '#0a0a0a', boxShadow: '0 0 30px rgba(255,255,255,0.05)' }}>
               <img src={previousPage?.content} alt="Drawing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            <form onSubmit={submitText} style={{ display: 'flex', gap: '15px' }}>
              <input 
                type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                placeholder="Describe this masterpiece..." autoFocus
                style={{ flex: 1, padding: '20px', borderRadius: '12px', fontSize: '1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#fff', outline: 'none' }}
              />
              <button type="submit" style={{ ...styles.btn, background: '#ebd73f', color: '#000' }}>SUBMIT GUESS</button>
            </form>
          </div>
        </div>
      ) : 

      /* REVEAL PHASE */
      gameState.status === 'reveal' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1 style={{ color: '#33ccff', fontFamily: "'Panchang', sans-serif", fontSize: '3.5rem', textShadow: '0 0 40px rgba(51, 204, 255, 0.5)' }}>THE SHOWCASE</h1>
            <p style={{ opacity: 0.7, fontSize: '1.2rem' }}>See how badly the briefs got broken.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '60px', maxWidth: '1000px', margin: '0 auto' }}>
             {Object.keys(gameState.chains).map(owner => (
                <div key={owner} style={{ ...styles.glassPanel, padding: '40px' }}>
                   <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '30px' }}>
                      <h3 style={{ color: '#ebd73f', margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem' }}>{owner}'s Original Brief</h3>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      {gameState.chains[owner].map((page, idx) => (
                         <div key={idx} style={{ 
                            background: page.type === 'text' ? 'rgba(51, 204, 255, 0.05)' : 'rgba(0,0,0,0.5)', 
                            border: `1px solid ${page.type === 'text' ? 'rgba(51,204,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                            padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center'
                         }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <CustomAvatar config={playerAvatars && playerAvatars[page.author]} size={24} />
                              {page.author} {page.type === 'text' ? 'WROTE' : 'DREW'}
                            </div>
                            
                            {page.type === 'text' ? (
                               <h2 style={{ margin: 0, fontSize: '1.8rem', textAlign: 'center', color: idx === 0 ? '#fff' : '#ff33ff' }}>"{page.content}"</h2>
                            ) : (
                               <img src={page.content} alt="Drawing" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px' }} />
                            )}
                         </div>
                      ))}
                   </div>
                </div>
             ))}
          </div>

          {isHost && (
             <div style={{ textAlign: 'center', marginTop: '60px' }}>
               <button onClick={() => {
                  const initialChains = {}; const initialAssignments = {};
                  players.forEach(p => { initialChains[p] = []; initialAssignments[p] = p; });
                  const newState = { status: 'writing', roundIndex: 0, timer: 45, chains: initialChains, currentAssignments: initialAssignments, readyPlayers: [], revealIndex: 0 };
                  channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
                  setGameState(newState);
               }} style={{ ...styles.btn, background: '#33ccff', color: '#000', padding: '20px 60px', fontSize: '1.2rem' }}>
                 PLAY AGAIN
               </button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  background: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: '#050505', 
    backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(51, 204, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(235, 215, 63, 0.08) 0%, transparent 50%)',
    fontFamily: "'Clash Display', sans-serif",
    color: '#fff',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column'
  },
  header: {
    position: 'absolute', top: 30, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '90%', maxWidth: '1200px', background: 'rgba(20,20,20,0.8)', padding: '15px 30px',
    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)', zIndex: 10
  },
  glassPanel: {
    background: 'rgba(20, 20, 20, 0.65)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden'
  },
  btn: {
    padding: '15px 30px', border: 'none', borderRadius: '12px', 
    fontFamily: "'Panchang', sans-serif", fontSize: '1rem', fontWeight: 'bold', 
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    transition: 'all 0.3s', boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
  }
};
