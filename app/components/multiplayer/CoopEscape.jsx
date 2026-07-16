"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Unlock, XCircle, Clock, Scissors, Power, KeyRound } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

const COLORS = ['#ff3333', '#33ccff', '#33ff33', '#ebd73f'];
const COLOR_NAMES = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

export default function CoopEscape({ channel, isHost, players, playerName, playerAvatars }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, playing, gameover, victory
    level: 1, // 1, 2, 3
    timer: 90,
    mistakes: 0,
    maxMistakes: 3,
    
    // Level 1: Keypad
    keypadCode: '',
    keypadHints: {}, // { 'player1': 'Digit 1 is 5' }
    keypadInput: '',

    // Level 2: Wires
    wireColors: [],
    targetWire: '',
    manualPlayer: '', // Player who sees the hint
    
    // Level 3: Switches
    targetSwitches: [], // [true, false, true, false]
    switchHints: {},
    currentSwitches: [false, false, false, false]
  });

  const timerRef = useRef(null);

  // Host initializes the game
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialState = generateNewGame(players);
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
  }, [channel]);

  // Host Timer Logic
  useEffect(() => {
    if (isHost && gameState.status === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      
      let currentLeft = gameState.timer;
      timerRef.current = setInterval(() => {
        currentLeft -= 1;
        setGameState(prev => {
           const next = { ...prev, timer: currentLeft };
           if (currentLeft <= 0) {
             next.status = 'gameover';
             clearInterval(timerRef.current);
           }
           channel.send({ type: 'broadcast', event: 'sync_state', payload: next });
           return next;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, gameState.status]);

  const generateNewGame = (playerList) => {
    // Level 1 Gen
    const code = Array.from({length: 4}, () => Math.floor(Math.random() * 10)).join('');
    const keypadHints = {};
    for (let i = 0; i < 4; i++) {
       const p = playerList[i % playerList.length];
       keypadHints[p] = (keypadHints[p] ? keypadHints[p] + ' | ' : '') + `Digit ${i+1} is ${code[i]}`;
    }

    // Level 2 Gen
    const shuffledColors = [...COLOR_NAMES].sort(() => Math.random() - 0.5);
    const targetWire = shuffledColors[Math.floor(Math.random() * shuffledColors.length)];
    const manualPlayer = playerList[Math.floor(Math.random() * playerList.length)];

    // Level 3 Gen
    const targets = Array.from({length: 4}, () => Math.random() > 0.5);
    const switchHints = {};
    for (let i = 0; i < 4; i++) {
       const p = playerList[i % playerList.length];
       switchHints[p] = (switchHints[p] ? switchHints[p] + ' | ' : '') + `Switch ${i+1} must be ${targets[i] ? 'ON' : 'OFF'}`;
    }

    return {
      status: 'playing',
      level: 1,
      timer: 90,
      mistakes: 0,
      maxMistakes: 3,
      keypadCode: code,
      keypadHints,
      keypadInput: '',
      wireColors: shuffledColors,
      targetWire,
      manualPlayer,
      targetSwitches: targets,
      switchHints,
      currentSwitches: [false, false, false, false]
    };
  };

  const handleMistake = (stateObj) => {
    stateObj.mistakes += 1;
    if (stateObj.mistakes >= stateObj.maxMistakes) {
       stateObj.status = 'gameover';
    }
    return stateObj;
  };

  const broadcastAction = (action) => {
    if (isHost) {
      setGameState(prev => {
        const next = action({ ...prev });
        channel.send({ type: 'broadcast', event: 'sync_state', payload: next });
        return next;
      });
    } else {
      channel.send({ type: 'broadcast', event: 'player_action', payload: action.toString() }); // Simplified for this demo
    }
  };

  // Host listens for player actions
  useEffect(() => {
    if (!isHost) return;
    const sub = channel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
       // Using eval for simplified state modification broadcast
       try {
         const actionFn = new Function('return ' + payload)();
         setGameState(prev => {
            const next = actionFn({ ...prev });
            channel.send({ type: 'broadcast', event: 'sync_state', payload: next });
            return next;
         });
       } catch(e) { console.error(e); }
    });
  }, [isHost, channel]);

  const handleKeypadPress = (num) => {
     broadcastAction((state) => {
        if (state.keypadInput.length < 4) {
           state.keypadInput += num;
        }
        return state;
     });
  };

  const submitKeypad = () => {
     broadcastAction((state) => {
        if (state.keypadInput === state.keypadCode) {
           state.level = 2;
        } else {
           state = handleMistake(state);
           state.keypadInput = ''; // reset on mistake
        }
        return state;
     });
  };
  
  const clearKeypad = () => {
      broadcastAction((state) => { state.keypadInput = ''; return state; });
  }

  const cutWire = (color) => {
     broadcastAction((state) => {
        if (color === state.targetWire) {
           state.level = 3;
        } else {
           state = handleMistake(state);
        }
        return state;
     });
  };

  const toggleSwitch = (index) => {
     broadcastAction((state) => {
        state.currentSwitches[index] = !state.currentSwitches[index];
        return state;
     });
  };

  const submitSwitches = () => {
     broadcastAction((state) => {
        const isCorrect = state.currentSwitches.every((val, i) => val === state.targetSwitches[i]);
        if (isCorrect) {
           state.status = 'victory';
        } else {
           state = handleMistake(state);
        }
        return state;
     });
  };

  const restartGame = () => {
      broadcastAction((state) => generateNewGame(players));
  };


  // -------------- RENDERERS --------------

  if (gameState.status === 'starting') {
    return <div style={styles.fullscreen}>INITIALIZING ESCAPE SEQUENCE...</div>;
  }

  return (
    <div className="no-global-scale" style={styles.fullscreen}>
       
       {/* HEADER BAR */}
       <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
             <ShieldAlert size={32} color="#ebd73f" />
             <div>
                <h1 style={{ margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#ebd73f' }}>PROJECT: NEON VAULT</h1>
                <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, letterSpacing: '2px' }}>LEVEL {gameState.level} OF 3</p>
             </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>ERRORS:</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                   {Array.from({length: gameState.maxMistakes}).map((_, i) => (
                      <XCircle key={i} size={24} color={i < gameState.mistakes ? '#ff3333' : 'rgba(255,255,255,0.2)'} />
                   ))}
                </div>
             </div>
             
             <div style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', 
                background: gameState.timer <= 15 ? 'rgba(255, 51, 51, 0.2)' : 'rgba(255,255,255,0.05)',
                padding: '10px 20px', borderRadius: '30px', border: `1px solid ${gameState.timer <= 15 ? '#ff3333' : 'rgba(255,255,255,0.1)'}`,
                color: gameState.timer <= 15 ? '#ff3333' : '#fff',
                animation: gameState.timer <= 15 ? 'pulse 0.5s infinite' : 'none'
             }}>
                <Clock size={24} />
                <span style={{ fontSize: '1.5rem', fontFamily: "'Panchang', sans-serif" }}>00:{gameState.timer.toString().padStart(2, '0')}</span>
             </div>
          </div>
       </div>

       {/* MAIN CONTENT */}
       <div style={{ display: 'flex', flex: 1, padding: '15px 30px', gap: '30px', maxWidth: '1400px', margin: '0 auto', width: '100%', minHeight: 0 }}>
          
          {/* LEFT: PLAYERS LIST */}
          <div style={{ ...styles.glassPanel, width: '300px', padding: '20px' }}>
             <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', fontFamily: "'Panchang', sans-serif", fontSize: '1rem' }}>SQUAD</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {players.map(p => (
                   <div key={p} style={{ 
                      display: 'flex', alignItems: 'center', gap: '15px', padding: '10px',
                      background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)'
                   }}>
                      <CustomAvatar config={playerAvatars && playerAvatars[p]} size={32} />
                      <span style={{ fontSize: '1.1rem' }}>{p} {p === playerName ? '(You)' : ''}</span>
                   </div>
                ))}
             </div>
          </div>

          {/* RIGHT: PUZZLE AREA */}
          <div style={{ ...styles.glassPanel, flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
             
             {gameState.status === 'gameover' && (
                <div style={{ textAlign: 'center' }}>
                   <AlertTriangle size={80} color="#ff3333" style={{ margin: '0 auto 20px auto' }} />
                   <h1 style={{ color: '#ff3333', fontFamily: "'Panchang', sans-serif", fontSize: '4rem', margin: '0 0 20px 0' }}>SYSTEM LOCKED</h1>
                   <p style={{ opacity: 0.7, fontSize: '1.2rem', marginBottom: '40px' }}>You failed to escape the vault.</p>
                   {isHost && <button onClick={restartGame} style={styles.primaryBtn}>REBOOT PROTOCOL</button>}
                </div>
             )}

             {gameState.status === 'victory' && (
                <div style={{ textAlign: 'center' }}>
                   <CheckCircle2 size={80} color="#33ff33" style={{ margin: '0 auto 20px auto' }} />
                   <h1 style={{ color: '#33ff33', fontFamily: "'Panchang', sans-serif", fontSize: '4rem', margin: '0 0 20px 0' }}>VAULT BREACHED</h1>
                   <p style={{ opacity: 0.7, fontSize: '1.2rem', marginBottom: '40px' }}>Your squad successfully escaped with {gameState.timer} seconds remaining!</p>
                   {isHost && <button onClick={restartGame} style={{...styles.primaryBtn, background: '#33ff33'}}>PLAY AGAIN</button>}
                </div>
             )}

             {gameState.status === 'playing' && (
                <>
                   {/* DEDICATED HINT BOX */}
                   <div style={{ 
                      width: '100%', padding: '15px', background: 'rgba(51, 204, 255, 0.1)', 
                      border: '1px solid rgba(51, 204, 255, 0.3)', borderRadius: '16px', marginBottom: '20px',
                      display: 'flex', alignItems: 'center', gap: '15px'
                   }}>
                      <div style={{ background: 'rgba(51, 204, 255, 0.2)', padding: '15px', borderRadius: '50%' }}>
                         <KeyRound color="#33ccff" size={24} />
                      </div>
                      <div>
                         <p style={{ margin: '0 0 5px 0', opacity: 0.6, fontSize: '0.9rem', letterSpacing: '2px', color: '#33ccff' }}>YOUR CLASSIFIED INTEL</p>
                         <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {gameState.level === 1 ? (gameState.keypadHints[playerName] || 'No intel available.') : ''}
                            {gameState.level === 2 ? (gameState.manualPlayer === playerName ? `CUT THE ${gameState.targetWire} WIRE!` : 'You do not have the defusal manual.') : ''}
                            {gameState.level === 3 ? (gameState.switchHints[playerName] || 'No intel available.') : ''}
                         </p>
                      </div>
                   </div>

                   {/* PUZZLE CONTENT */}
                   
                   {/* LEVEL 1: KEYPAD */}
                   {gameState.level === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <div style={{ 
                            background: '#0a0a0a', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '16px', 
                            padding: '15px', width: '300px', marginBottom: '20px', textAlign: 'center',
                            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.5)'
                         }}>
                            <span style={{ fontSize: '3rem', fontFamily: 'monospace', letterSpacing: '15px', color: '#33ff33' }}>
                               {(gameState.keypadInput || '').padEnd(4, '_')}
                            </span>
                         </div>

                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLR', 0, 'ENT'].map(btn => (
                               <button 
                                  key={btn}
                                  onClick={() => {
                                     if (btn === 'CLR') clearKeypad();
                                     else if (btn === 'ENT') submitKeypad();
                                     else handleKeypadPress(btn);
                                  }}
                                  style={{
                                     padding: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                     borderRadius: '12px', fontSize: '1.5rem', fontFamily: "'Panchang', sans-serif", color: '#fff',
                                     cursor: 'pointer', transition: 'all 0.2s',
                                     ...(btn === 'ENT' ? { background: '#33ccff', color: '#000' } : {}),
                                     ...(btn === 'CLR' ? { background: '#ff3333', color: '#fff' } : {})
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                               >
                                  {btn}
                               </button>
                            ))}
                         </div>
                      </div>
                   )}

                   {/* LEVEL 2: WIRES */}
                   {gameState.level === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                         {gameState.manualPlayer === playerName ? (
                            <div style={{ textAlign: 'center', padding: '50px' }}>
                               <Lock size={64} color="#ff3333" style={{ margin: '0 auto 20px auto' }} />
                               <h2>You hold the manual.</h2>
                               <p style={{ opacity: 0.6 }}>Tell your team which wire to cut.</p>
                            </div>
                         ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%', maxWidth: '500px' }}>
                               {gameState.wireColors.map(colorName => {
                                  let actualColor = '';
                                  if(colorName === 'RED') actualColor = '#ff3333';
                                  if(colorName === 'BLUE') actualColor = '#33ccff';
                                  if(colorName === 'GREEN') actualColor = '#33ff33';
                                  if(colorName === 'YELLOW') actualColor = '#ebd73f';

                                  return (
                                     <div key={colorName} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ height: '20px', flex: 1, background: actualColor, borderRadius: '10px', boxShadow: `0 0 20px ${actualColor}80` }} />
                                        <button 
                                           onClick={() => cutWire(colorName)}
                                           style={{ ...styles.btn, background: 'rgba(255,255,255,0.1)' }}
                                        >
                                           <Scissors size={20} /> CUT
                                        </button>
                                     </div>
                                  )
                               })}
                            </div>
                         )}
                      </div>
                   )}

                   {/* LEVEL 3: SWITCHES */}
                   {gameState.level === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                         <div style={{ display: 'flex', gap: '40px', marginBottom: '60px' }}>
                            {gameState.currentSwitches.map((isOn, idx) => (
                               <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                  <span style={{ opacity: 0.5, fontFamily: "'Panchang', sans-serif" }}>SW-{idx+1}</span>
                                  <button 
                                     onClick={() => toggleSwitch(idx)}
                                     style={{ 
                                        width: '80px', height: '140px', borderRadius: '40px',
                                        background: isOn ? 'rgba(51, 255, 51, 0.2)' : 'rgba(255, 51, 51, 0.2)',
                                        border: `2px solid ${isOn ? '#33ff33' : '#ff3333'}`,
                                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                                     }}
                                  >
                                     <div style={{
                                        position: 'absolute', top: isOn ? '10px' : '70px', left: '10px', right: '10px', height: '60px',
                                        background: isOn ? '#33ff33' : '#ff3333', borderRadius: '30px', transition: 'all 0.3s',
                                        boxShadow: `0 0 20px ${isOn ? '#33ff33' : '#ff3333'}`
                                     }} />
                                  </button>
                                  <span style={{ fontWeight: 'bold', color: isOn ? '#33ff33' : '#ff3333' }}>{isOn ? 'ON' : 'OFF'}</span>
                               </div>
                            ))}
                         </div>
                         <button onClick={submitSwitches} style={{...styles.primaryBtn, background: '#ebd73f'}}>
                            <Power size={24} /> INITIALIZE UNLOCK
                         </button>
                      </div>
                   )}
                </>
             )}
          </div>
       </div>
    </div>
  );
}

const styles = {
  fullscreen: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundColor: '#050505', 
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    fontFamily: "'Clash Display', sans-serif", color: '#fff',
    display: 'flex', flexDirection: 'column'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 40px', background: 'rgba(20,20,20,0.8)', borderBottom: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)'
  },
  glassPanel: {
    background: 'rgba(20, 20, 20, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  btn: {
    padding: '15px 20px', border: 'none', borderRadius: '12px', 
    fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', color: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '10px'
  },
  primaryBtn: {
    padding: '20px 50px', background: '#33ccff', color: '#000', border: 'none', borderRadius: '40px', 
    fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Panchang', sans-serif",
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '15px'
  }
};
