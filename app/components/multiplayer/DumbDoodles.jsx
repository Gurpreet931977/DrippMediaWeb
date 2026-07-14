"use client";

import React, { useState, useEffect, useRef } from 'react';

const WORDS = [
  "ALIEN", "SPACESHIP", "PIZZA", "PIRATE", "GHOST", "GUITAR", 
  "COMPUTER", "MONKEY", "DRAGON", "ROBOT", "CASTLE", "OCEAN",
  "AGENCY", "BRANDING", "DESIGN", "CODE", "NEON", "CYBERPUNK"
];

export default function DumbDoodles({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, playing, gameover
    currentTurnIndex: 0,
    currentWord: '',
    timer: 60,
    scores: {}
  });

  const [chat, setChat] = useState([]);
  const [guess, setGuess] = useState('');
  
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const ctxRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pendingDrawEventsRef = useRef([]);

  // Initialize Game
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialScores = {};
      players.forEach(p => initialScores[p] = 0);
      
      const initialState = {
        status: 'playing',
        currentTurnIndex: 0,
        currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
        timer: 60,
        scores: initialScores,
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  // Handle Incoming Broadcasts
  useEffect(() => {
    if (!channel) return;

    channel
      .on('broadcast', { event: 'sync_state' }, (payload) => {
        setGameState(payload.payload);
      })
      .on('broadcast', { event: 'chat_msg' }, (payload) => {
        setChat(prev => [...prev, payload.payload].slice(-20)); // Keep last 20 msgs
      })
      .on('broadcast', { event: 'draw_batch' }, (payload) => {
        // Draw the points from other players
        const ctx = ctxRef.current;
        if (!ctx) return;
        payload.payload.forEach(line => {
          ctx.beginPath();
          ctx.moveTo(line.x0, line.y0);
          ctx.lineTo(line.x1, line.y1);
          ctx.strokeStyle = line.color || '#ff33ff';
          ctx.lineWidth = line.size || 5;
          ctx.lineCap = 'round';
          ctx.stroke();
        });
      })
      .on('broadcast', { event: 'clear_canvas' }, () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
  }, [channel]);

  // Timer Logic (Host Only)
  useEffect(() => {
    let interval;
    if (isHost && gameState.status === 'playing') {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
            // Turn over
            const nextIndex = (prev.currentTurnIndex + 1) % players.length;
            const newState = {
              ...prev,
              currentTurnIndex: nextIndex,
              currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
              timer: 60
            };
            
            // Clear canvas for everyone
            channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
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
  }, [isHost, gameState.status, players, channel]);

  // Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set actual size in memory (scaled to account for CSS sizing)
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
    }
  }, []);

  // Broadcast Draw Batching Loop (throttled)
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingDrawEventsRef.current.length > 0) {
        channel.send({ 
          type: 'broadcast', 
          event: 'draw_batch', 
          payload: pendingDrawEventsRef.current 
        });
        pendingDrawEventsRef.current = [];
      }
    }, 50); // Send 20 times a second
    return () => clearInterval(interval);
  }, [channel]);

  const isMyTurn = players[gameState.currentTurnIndex] === playerName;

  // Drawing Handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (!isMyTurn) return;
    isDrawingRef.current = true;
    lastPosRef.current = getMousePos(e);
  };

  const draw = (e) => {
    if (!isMyTurn || !isDrawingRef.current) return;
    
    const currentPos = getMousePos(e);
    const ctx = ctxRef.current;
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = '#ff33ff';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Queue for broadcast
      pendingDrawEventsRef.current.push({
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: currentPos.x, y1: currentPos.y,
        color: '#ff33ff', size: 5
      });
    }
    
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    if (!isMyTurn) return;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
    }
  }

  // Chat Handlers
  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;

    const msg = guess.toUpperCase();
    
    // Check if correct
    if (!isMyTurn && msg === gameState.currentWord) {
      const sysMsg = { sender: 'SYSTEM', text: `${playerName} guessed the word!`, color: '#33ff33' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: sysMsg });
      setChat(prev => [...prev, sysMsg].slice(-20));
      
      // Add points
      if (isHost) {
         setGameState(prev => {
            const newScores = { ...prev.scores };
            newScores[playerName] += 100; // Guesser points
            newScores[players[prev.currentTurnIndex]] += 50; // Drawer points
            
            const nextIndex = (prev.currentTurnIndex + 1) % players.length;
            const newState = {
              ...prev,
              scores: newScores,
              currentTurnIndex: nextIndex,
              currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
              timer: 60
            };
            channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
            channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
            return newState;
         });
      } else {
         // Tell host someone guessed it (in a real robust app, host handles verification, 
         // but for peer-to-peer trust model here, anyone can trigger the next round)
      }
    } else {
      const chatMsg = { sender: playerName, text: guess, color: '#fff' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: chatMsg });
      setChat(prev => [...prev, chatMsg].slice(-20));
    }
    setGuess('');
  };

  if (gameState.status === 'starting') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Initializing Canvas...</div>;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'row', height: '100vh', 
      backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100
    }}>
      
      {/* Left Sidebar: Players & Scores */}
      <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
        <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#ff33ff' }}>DUMB DOODLES</h2>
        <div style={{ margin: '20px 0', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'monospace' }}>{Math.max(0, gameState.timer)}s</div>
        </div>
        
        <h3 style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '30px' }}>PLAYERS</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {players.map((p, i) => (
            <li key={i} style={{ 
              padding: '10px', background: i === gameState.currentTurnIndex ? 'rgba(255,51,255,0.2)' : 'transparent',
              borderRadius: '8px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between',
              border: i === gameState.currentTurnIndex ? '1px solid #ff33ff' : 'none'
            }}>
              <span>{p === playerName ? '> ' : ''}{p} {i === gameState.currentTurnIndex ? '✏️' : ''}</span>
              <span style={{ fontWeight: 'bold' }}>{gameState.scores[p] || 0}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Center: Canvas Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ letterSpacing: '2px' }}>
            {isMyTurn ? (
               <span>DRAW THIS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif" }}>{gameState.currentWord}</span></span>
            ) : (
               <span>GUESS THE WORD! ({gameState.currentWord.length} letters)</span>
            )}
          </h2>
          {isMyTurn && (
             <button onClick={clearCanvas} style={{ padding: '8px 16px', background: '#ff3333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>CLEAR</button>
          )}
        </div>
        
        <div style={{ 
            flex: 1, width: '100%', maxWidth: '800px', 
            background: '#111', borderRadius: '16px', overflow: 'hidden',
            border: '2px solid rgba(255,51,255,0.3)', boxShadow: '0 0 30px rgba(255,51,255,0.1)',
            cursor: isMyTurn ? 'crosshair' : 'default'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
      </div>

      {/* Right Sidebar: Chat & Guessing */}
      <div style={{ width: '300px', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: 0, opacity: 0.5 }}>CHAT / GUESS</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chat.map((msg, i) => (
            <div key={i} style={{ color: msg.color || '#fff' }}>
              <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{msg.sender}: </span>
              <span style={{ fontWeight: msg.sender === 'SYSTEM' ? 'bold' : 'normal' }}>{msg.text}</span>
            </div>
          ))}
        </div>
        
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <form onSubmit={handleGuess} style={{ display: 'flex' }}>
            <input 
              type="text" 
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              disabled={isMyTurn}
              placeholder={isMyTurn ? "You are drawing!" : "Type guess..."}
              style={{
                flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff', 
                borderRadius: '8px 0 0 8px', outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={isMyTurn}
              style={{
                padding: '0 15px', background: isMyTurn ? '#333' : '#ebd73f', color: '#000',
                border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 'bold', cursor: isMyTurn ? 'default' : 'pointer'
              }}
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
