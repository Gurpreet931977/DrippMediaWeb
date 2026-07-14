"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Eraser, Users, Clock, Trophy } from 'lucide-react';

const WORDS = [
  "ALIEN", "SPACESHIP", "PIZZA", "PIRATE", "GHOST", "GUITAR", 
  "COMPUTER", "MONKEY", "DRAGON", "ROBOT", "CASTLE", "OCEAN",
  "AGENCY", "BRANDING", "DESIGN", "CODE", "NEON", "CYBERPUNK"
];

// Emojis for avatars
const AVATARS = ['👽', '👻', '👾', '🤖', '🤡', '🤠', '🦊', '🐯', '🦄', '🦖'];

export default function DumbDoodles({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, playing, gameover
    currentTurnIndex: 0,
    currentWord: '',
    timer: 60,
    scores: {},
    avatars: {}
  });

  const [chat, setChat] = useState([]);
  const [guess, setGuess] = useState('');
  
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const ctxRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pendingDrawEventsRef = useRef([]);
  const chatEndRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Initialize Game
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialScores = {};
      const initialAvatars = {};
      players.forEach(p => {
        initialScores[p] = 0;
        initialAvatars[p] = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      });
      
      const initialState = {
        status: 'playing',
        currentTurnIndex: 0,
        currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
        timer: 60,
        scores: initialScores,
        avatars: initialAvatars
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  // Handle Incoming Broadcasts
  useEffect(() => {
    if (!channel) return;

    const sub = channel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        setGameState(payload);
      })
      .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
        setChat(prev => [...prev, payload].slice(-30));
      })
      .on('broadcast', { event: 'draw_batch' }, ({ payload }) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        payload.forEach(line => {
          ctx.beginPath();
          ctx.moveTo(line.x0, line.y0);
          ctx.lineTo(line.x1, line.y1);
          ctx.strokeStyle = line.color || '#ff33ff';
          ctx.lineWidth = line.size || 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
          
          // Add a subtle glow to the drawn lines for premium feel
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff33ff';
        });
      })
      .on('broadcast', { event: 'clear_canvas' }, () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
      
    sub.subscribe();
    return () => { channel.removeChannel(sub); }
  }, [channel]);

  // Timer Logic (Host Only)
  useEffect(() => {
    let interval;
    if (isHost && gameState.status === 'playing') {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
            const nextIndex = (prev.currentTurnIndex + 1) % players.length;
            const newState = {
              ...prev,
              currentTurnIndex: nextIndex,
              currentWord: WORDS[Math.floor(Math.random() * WORDS.length)],
              timer: 60
            };
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
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
    }
  }, [gameState.status]); // re-init when status changes from starting to playing

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
    }, 40); // 25fps for smoother drawing
    return () => clearInterval(interval);
  }, [channel]);

  const isMyTurn = players[gameState.currentTurnIndex] === playerName;

  // Drawing Handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
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
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff33ff';
      ctx.stroke();
      
      pendingDrawEventsRef.current.push({
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: currentPos.x, y1: currentPos.y,
        color: '#ff33ff', size: 6
      });
    }
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => { isDrawingRef.current = false; };

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
    
    if (!isMyTurn && msg === gameState.currentWord) {
      const sysMsg = { sender: 'SYSTEM', text: `${playerName} guessed the word!`, type: 'success' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: sysMsg });
      setChat(prev => [...prev, sysMsg].slice(-30));
      
      if (isHost) {
         setGameState(prev => {
            const newScores = { ...prev.scores };
            newScores[playerName] = (newScores[playerName] || 0) + 100;
            newScores[players[prev.currentTurnIndex]] = (newScores[players[prev.currentTurnIndex]] || 0) + 50;
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
      }
    } else {
      const chatMsg = { sender: playerName, text: guess, type: 'normal' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: chatMsg });
      setChat(prev => [...prev, chatMsg].slice(-30));
    }
    setGuess('');
  };

  if (gameState.status === 'starting') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: "'Panchang', sans-serif" }}>INITIALIZING CANVAS...</div>;
  }

  return (
    <div style={styles.background}>
      <div style={styles.dashboard}>
        
        {/* LEFT PANEL: Game State & Players */}
        <div style={{ ...styles.glassPanel, width: '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '30px 20px', background: 'linear-gradient(180deg, rgba(255,51,255,0.1) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem', color: '#ff33ff', margin: '0 0 10px 0', textShadow: '0 0 20px rgba(255,51,255,0.5)' }}>DUMB DOODLES</h1>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', border: gameState.timer <= 10 ? '1px solid #ff3333' : '1px solid rgba(255,255,255,0.1)' }}>
              <Clock size={18} color={gameState.timer <= 10 ? '#ff3333' : '#ebd73f'} />
              <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: gameState.timer <= 10 ? '#ff3333' : '#fff' }}>
                {Math.max(0, gameState.timer)}s
              </span>
            </div>
          </div>
          
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', opacity: 0.6 }}>
              <Users size={14} />
              <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '600' }}>PLAYERS</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, i) => {
                const isActive = i === gameState.currentTurnIndex;
                const isMe = p === playerName;
                return (
                  <div key={i} style={{ 
                    ...styles.playerCard, 
                    background: isActive ? 'rgba(255,51,255,0.15)' : 'rgba(255,255,255,0.03)',
                    borderColor: isActive ? 'rgba(255,51,255,0.5)' : 'transparent',
                    boxShadow: isActive ? '0 0 15px rgba(255,51,255,0.2)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '1.5rem' }}>{gameState.avatars[p] || '👤'}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#ff33ff' : '#fff' }}>
                          {p} {isMe && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(You)</span>}
                        </span>
                        {isActive && <span style={{ fontSize: '0.7rem', color: '#ff33ff', letterSpacing: '1px' }}>DRAWING...</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1rem', color: '#ebd73f' }}>
                      {gameState.scores[p] || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ ...styles.glassPanel, padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
              {isMyTurn ? (
                <>DRAW THIS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem', background: 'rgba(235, 215, 63, 0.1)', padding: '5px 15px', borderRadius: '8px' }}>{gameState.currentWord}</span></>
              ) : (
                <>
                  <span style={{ color: '#ff33ff' }}>{players[gameState.currentTurnIndex]}</span> is drawing! 
                  <span style={{ opacity: 0.5, marginLeft: '10px' }}>({gameState.currentWord.length} letters)</span>
                </>
              )}
            </h2>
            
            {isMyTurn && (
               <button onClick={clearCanvas} style={styles.iconBtn}>
                 <Eraser size={18} /> CLEAR
               </button>
            )}
          </div>
          
          <div style={{ 
              ...styles.glassPanel, 
              flex: 1, 
              position: 'relative',
              background: '#0a0a0a',
              cursor: isMyTurn ? 'crosshair' : 'default',
              boxShadow: isMyTurn ? '0 0 40px rgba(255,51,255,0.1) inset' : 'none'
          }}>
            {!isMyTurn && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} />} {/* Block clicks if not turn */}
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

        {/* RIGHT PANEL: Chat */}
        <div style={{ ...styles.glassPanel, width: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '1px', fontFamily: "'Panchang', sans-serif" }}>LIVE CHAT</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chat.map((msg, i) => {
              if (msg.type === 'success') {
                return (
                  <div key={i} style={{ padding: '10px 15px', background: 'rgba(51, 255, 51, 0.1)', borderLeft: '3px solid #33ff33', borderRadius: '4px', color: '#33ff33', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    🎉 {msg.text}
                  </div>
                );
              }
              
              const isMyMessage = msg.sender === playerName;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', marginLeft: '5px' }}>{msg.sender}</span>
                  <div style={{ 
                    padding: '10px 15px', 
                    background: isMyMessage ? '#ff33ff' : 'rgba(255,255,255,0.1)', 
                    color: isMyMessage ? '#000' : '#fff',
                    borderRadius: isMyMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '0.95rem'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleGuess} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <input 
                type="text" 
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={isMyTurn}
                placeholder={isMyTurn ? "You are drawing..." : "Guess here..."}
                style={{
                  flex: 1, padding: '15px 20px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                  borderRadius: '12px', outline: 'none', transition: 'all 0.3s',
                  fontFamily: "'Clash Display', sans-serif"
                }}
              />
              <button 
                type="submit"
                disabled={isMyTurn || !guess.trim()}
                style={{
                  padding: '0 20px', background: isMyTurn ? 'rgba(255,255,255,0.1)' : '#ff33ff', color: isMyTurn ? 'rgba(255,255,255,0.3)' : '#000',
                  border: 'none', borderRadius: '12px', cursor: isMyTurn ? 'default' : 'pointer',
                  transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  background: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: '#050505', 
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 51, 255, 0.1) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(235, 215, 63, 0.05) 0%, transparent 50%)',
    fontFamily: "'Clash Display', sans-serif",
    color: '#fff',
    overflow: 'hidden'
  },
  dashboard: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    height: '100%',
    boxSizing: 'border-box',
    maxWidth: '1600px',
    margin: '0 auto'
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
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '16px',
    border: '1px solid transparent',
    transition: 'all 0.3s ease'
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', background: 'rgba(255, 51, 51, 0.1)', color: '#ff3333',
    border: '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '12px', cursor: 'pointer',
    fontFamily: "'Panchang', sans-serif", fontSize: '0.8rem', transition: 'all 0.2s'
  }
};
