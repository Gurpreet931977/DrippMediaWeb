"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Heart, Skull, Zap, Bomb, AlertTriangle, Flame, ShieldAlert } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

export default function WordDrop({ channel, isHost, players, playerName, playerAvatars }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, playing, gameover
    currentTurnIndex: 0,
    currentPrompt: 'STA',
    timer: 15, // seconds
    lives: {}, // { 'Player1': 3, 'Player2': 3 }
    scores: {}, // { 'Player1': 0, 'Player2': 0 }
    usedWords: [] // ['START', 'STAR', ...]
  });

  const [inputWord, setInputWord] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [uiState, setUiState] = useState('idle'); // idle, success, error
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Host initializes the game state
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialLives = {};
      const initialScores = {};
      players.forEach(p => {
        initialLives[p] = 3;
        initialScores[p] = 0;
      });
      
      const initialState = {
        status: 'playing',
        currentTurnIndex: 0,
        currentPrompt: generatePrompt(),
        timer: 15,
        lives: initialLives,
        scores: initialScores,
        usedWords: []
      };

      channel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: initialState
      });

      setGameState(initialState);
    }
  }, [isHost, players]);

  // Listen for state syncs from the host or other players
  useEffect(() => {
    if (channel) {
      channel.on('broadcast', { event: 'sync_state' }, (payload) => {
        setGameState(payload.payload);
      });
    }
  }, [channel]);

  // Timer logic (only Host controls the timer to prevent desync)
  useEffect(() => {
    let interval;
    if (isHost && gameState.status === 'playing') {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
            // Bomb explodes! Player loses a life.
            const currentPlayer = players[prev.currentTurnIndex];
            const newLives = { ...prev.lives };
            newLives[currentPlayer] = Math.max(0, newLives[currentPlayer] - 1);
            
            // Check if game over
            const alivePlayers = Object.keys(newLives).filter(p => newLives[p] > 0);
            if (alivePlayers.length <= 1) {
              const finalState = { ...prev, status: 'gameover', lives: newLives };
              channel.send({ type: 'broadcast', event: 'sync_state', payload: finalState });
              return finalState;
            }

            // Next turn
            let nextIndex = (prev.currentTurnIndex + 1) % players.length;
            while (newLives[players[nextIndex]] <= 0) {
                nextIndex = (nextIndex + 1) % players.length;
            }

            const newState = {
              ...prev,
              lives: newLives,
              currentTurnIndex: nextIndex,
              currentPrompt: generatePrompt(),
              timer: 15
            };

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

  const generatePrompt = () => {
    const prompts = ['STA', 'CHE', 'TIO', 'ING', 'CON', 'PRO', 'COM', 'ENT', 'VER', 'TER', 'ATE', 'ION', 'OUS', 'BLE', 'ANT', 'EST'];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const isMyTurn = players[gameState.currentTurnIndex] === playerName;

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setUiState('error');
    setTimeout(() => setUiState('idle'), 500);
  };

  const triggerSuccess = () => {
    setUiState('success');
    setTimeout(() => setUiState('idle'), 500);
  };

  const applyPenalty = () => {
    // Penalty: -50 points, -3 seconds
    const currentPlayer = players[gameState.currentTurnIndex];
    const newScores = { ...gameState.scores };
    newScores[currentPlayer] -= 50;

    const newTimer = Math.max(1, gameState.timer - 3); // minimum 1 second left so they can panic

    const newState = {
      ...gameState,
      scores: newScores,
      timer: newTimer
    };

    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isMyTurn || isVerifying) return;

    const word = inputWord.toUpperCase().trim();
    
    if (word.length < 3) {
      triggerError('WORD TOO SHORT');
      return;
    }

    if (!word.includes(gameState.currentPrompt)) {
      triggerError(`MUST CONTAIN "${gameState.currentPrompt}"`);
      return;
    }

    if (gameState.usedWords.includes(word)) {
      triggerError('ALREADY USED! -50 PTS & -3 SEC!');
      applyPenalty();
      setInputWord('');
      return;
    }

    setIsVerifying(true);
    
    try {
      // Validate with Dictionary API
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      
      if (!response.ok) {
        // Word not found
        triggerError('FAKE WORD! -50 PTS & -3 SEC!');
        applyPenalty();
        setInputWord('');
        setIsVerifying(false);
        return;
      }

      // Success!
      triggerSuccess();
      setErrorMsg('');
      setInputWord('');

      const currentPlayer = players[gameState.currentTurnIndex];
      const newScores = { ...gameState.scores };
      // Base points + length multiplier + speed bonus
      const pointsEarned = 10 + (word.length * 5) + Math.floor(gameState.timer * 2);
      newScores[currentPlayer] += pointsEarned;

      let nextIndex = (gameState.currentTurnIndex + 1) % players.length;
      while (gameState.lives[players[nextIndex]] <= 0) {
          nextIndex = (nextIndex + 1) % players.length;
      }

      const newState = {
        ...gameState,
        scores: newScores,
        usedWords: [...gameState.usedWords, word],
        currentTurnIndex: nextIndex,
        currentPrompt: generatePrompt(),
        timer: Math.max(4, 15 - Math.floor(15 - gameState.timer) * 0.5) // gets faster, minimum 4s
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
      setGameState(newState);
      
    } catch (err) {
      console.error(err);
      // Fallback if API fails: accept it so game doesn't break
      triggerSuccess();
      setErrorMsg('');
      setInputWord('');
      
      let nextIndex = (gameState.currentTurnIndex + 1) % players.length;
      while (gameState.lives[players[nextIndex]] <= 0) {
          nextIndex = (nextIndex + 1) % players.length;
      }
      
      const newState = {
        ...gameState,
        usedWords: [...gameState.usedWords, word],
        currentTurnIndex: nextIndex,
        currentPrompt: generatePrompt(),
        timer: 15
      };
      channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
      setGameState(newState);
    }

    setIsVerifying(false);
  };

  if (gameState.status === 'starting') {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050505' }}>
        <h1 style={{ color: '#fff', fontFamily: "'Panchang', sans-serif", textShadow: '0 0 20px rgba(255,153,0,0.5)' }}>INITIALIZING SYSTEM...</h1>
      </div>
    );
  }

  if (gameState.status === 'gameover') {
    const sortedPlayers = Object.keys(gameState.scores).sort((a, b) => {
      if (gameState.lives[b] !== gameState.lives[a]) {
        return gameState.lives[b] - gameState.lives[a];
      }
      return gameState.scores[b] - gameState.scores[a];
    });
    const winner = sortedPlayers[0];

    return (
      <div style={{ 
        height: '100%', width: '100%', backgroundColor: '#050505', color: 'white', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
        fontFamily: "'Clash Display', sans-serif", backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 153, 0, 0.15) 0%, transparent 70%)'
      }}>
        <h1 style={{ color: '#ff3333', fontSize: isMobile ? '3rem' : '5rem', fontFamily: "'Panchang', sans-serif", margin: '0 0 10px 0', textShadow: '0 0 40px rgba(255,51,51,0.5)' }}>GAME OVER</h1>
        <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', marginBottom: '40px' }}>WINNER: <span style={{ color: '#ebd73f' }}>{winner}</span></h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '400px' }}>
          {sortedPlayers.map((p, i) => (
            <div key={i} style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px', borderRadius: '16px', background: i === 0 ? 'rgba(235, 215, 63, 0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${i === 0 ? 'rgba(235, 215, 63, 0.3)' : 'rgba(255,255,255,0.1)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontFamily: "'Panchang', sans-serif", color: i === 0 ? '#ebd73f' : '#888' }}>#{i+1}</span>
                <CustomAvatar config={playerAvatars && playerAvatars[p]} size={32} />
                <span style={{ fontWeight: 'bold' }}>{p}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#ff9900' }}>{gameState.scores[p]} PTS</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isShake = uiState === 'error';
  const glowColor = uiState === 'error' ? '#ff3333' : (uiState === 'success' ? '#33ff33' : '#ff9900');
  const currentPlayerName = players[gameState.currentTurnIndex];

  return (
    <div className="no-global-scale" style={{
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      height: '100%', width: '100%', backgroundColor: '#050505', color: '#fff', 
      fontFamily: "'Clash Display', sans-serif", overflow: 'hidden',
      backgroundImage: `radial-gradient(circle at 50% 50%, ${glowColor}10 0%, transparent 60%)`,
      transition: 'background-image 0.3s ease'
    }}>
      
      {/* Side Panel: Leaderboard & Lives */}
      <div style={{ 
        width: isMobile ? '100%' : '300px', 
        height: isMobile ? 'auto' : '100%', 
        background: 'rgba(15,15,15,0.8)',
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
        borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none',
        padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '15px',
        backdropFilter: 'blur(20px)',
        zIndex: 10
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#ff9900', textShadow: '0 0 15px rgba(255,153,0,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={20} /> TICK TOCK
        </h2>
        
        <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', overflowX: isMobile ? 'auto' : 'visible' }}>
          {players.map((p, i) => {
            const isTurn = i === gameState.currentTurnIndex;
            const isDead = gameState.lives[p] <= 0;
            return (
              <div key={i} style={{ 
                background: isTurn ? 'rgba(255,153,0,0.15)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isTurn ? 'rgba(255,153,0,0.3)' : 'rgba(255,255,255,0.05)'}`,
                padding: '12px 15px', borderRadius: '12px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                opacity: isDead ? 0.5 : 1,
                minWidth: isMobile ? '140px' : 'auto',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CustomAvatar config={playerAvatars && playerAvatars[p]} size={24} />
                    <span style={{ fontWeight: isTurn ? 'bold' : 'normal', color: isTurn ? '#fff' : '#aaa', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                      {p === playerName && isMobile ? 'YOU' : p}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <Heart key={idx} size={14} color={idx < gameState.lives[p] ? "#ff3333" : "#333"} fill={idx < gameState.lives[p] ? "#ff3333" : "transparent"} style={{ filter: idx < gameState.lives[p] ? 'drop-shadow(0 0 5px rgba(255,51,51,0.5))' : 'none' }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'monospace', color: '#ff9900', fontWeight: 'bold' }}>{gameState.scores[p] || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Center Panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '20px' : '40px', position: 'relative',
        transform: isShake ? 'translate(5px, 5px)' : 'none',
        transition: isShake ? 'none' : 'transform 0.1s ease',
        animation: isShake ? 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both' : 'none'
      }}>
        
        {/* The Bomb */}
        <div style={{
          width: isMobile ? '160px' : '240px', height: isMobile ? '160px' : '240px', 
          borderRadius: '50%', background: 'rgba(20,20,20,0.8)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 ${20 + (15 - gameState.timer) * 4}px ${glowColor}40, inset 0 0 30px rgba(0,0,0,0.8)`,
          border: `2px solid ${glowColor}50`,
          marginBottom: isMobile ? '30px' : '50px', position: 'relative',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Tick indicator */}
          <div style={{ 
            position: 'absolute', top: '-10px', right: '20px', 
            opacity: gameState.timer % 1 > 0.5 ? 1 : 0.2, transition: 'opacity 0.1s' 
          }}>
             <Zap size={32} color={glowColor} fill={glowColor} style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }} />
          </div>

          <span style={{ fontSize: '1rem', color: '#888', letterSpacing: '2px', marginBottom: '-5px' }}>TIME</span>
          <h1 style={{ 
            fontSize: isMobile ? '4rem' : '6rem', margin: 0, fontFamily: 'monospace', 
            color: gameState.timer <= 3 ? '#ff3333' : '#fff',
            textShadow: `0 0 20px ${gameState.timer <= 3 ? '#ff3333' : 'rgba(255,255,255,0.5)'}`,
            animation: gameState.timer <= 3 ? 'pulse 0.5s infinite' : 'none'
          }}>
            {Math.ceil(gameState.timer)}
          </h1>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <p style={{ opacity: 0.6, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.9rem', marginBottom: '10px' }}>
            {isMyTurn ? "Your turn! Type a word containing:" : `${currentPlayerName} is typing a word containing:`}
          </p>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.1)', 
            padding: '15px 40px', borderRadius: '16px', display: 'inline-block',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
          }}>
            <h1 style={{ fontSize: isMobile ? '3rem' : '4.5rem', letterSpacing: '8px', color: '#ff9900', margin: 0, fontFamily: "'Panchang', sans-serif", textShadow: '0 0 20px rgba(255,153,0,0.4)' }}>
              {gameState.currentPrompt}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value.replace(/[^A-Za-z]/g, ''))} // only letters
              disabled={!isMyTurn || isVerifying}
              placeholder={isMyTurn ? "ENTER WORD..." : "WAITING..."}
              style={{
                width: '100%', padding: isMobile ? '20px' : '25px', fontSize: isMobile ? '1.5rem' : '2rem', 
                borderRadius: '16px', border: `2px solid ${uiState === 'error' ? '#ff3333' : (uiState === 'success' ? '#33ff33' : (isMyTurn ? '#ff9900' : '#333'))}`,
                textAlign: 'center', textTransform: 'uppercase', 
                background: isMyTurn ? 'rgba(0,0,0,0.5)' : 'rgba(20,20,20,0.5)',
                color: uiState === 'error' ? '#ff3333' : (uiState === 'success' ? '#33ff33' : '#fff'),
                fontFamily: "'Panchang', sans-serif",
                boxShadow: isMyTurn ? `0 0 30px ${uiState === 'error' ? 'rgba(255,51,51,0.2)' : 'rgba(255,153,0,0.1)'}` : 'none',
                transition: 'all 0.3s ease',
                outline: 'none',
                opacity: isVerifying ? 0.5 : 1
              }}
              autoFocus
              autoComplete="off"
            />
            {isVerifying && (
              <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }}>
                <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#ff9900', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          </div>
          
          <div style={{ height: '30px', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {errorMsg && (
              <p style={{ color: '#ff3333', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', animation: 'fadeInUp 0.3s ease forwards' }}>
                <ShieldAlert size={20} /> {errorMsg}
              </p>
            )}
          </div>
          {isMyTurn && <button type="submit" style={{ display: 'none' }}>Submit</button>}
        </form>

      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-2px, 0, 0); }
          20%, 80% { transform: translate3d(4px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-8px, 0, 0); }
          40%, 60% { transform: translate3d(8px, 0, 0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
