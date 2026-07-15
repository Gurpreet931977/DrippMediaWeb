"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Heart, Skull } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

// Common words simple dictionary for validation (in a real app this would be a large JSON or API call)
const DICTIONARY = ['APPLE', 'BANANA', 'CHEESE', 'DOG', 'CAT', 'STAR', 'TABLE', 'CHAIR', 'HOUSE', 'CAR', 'COMPUTER', 'MOUSE', 'KEYBOARD', 'SCREEN'];

export default function WordDrop({ channel, isHost, players, playerName, playerAvatars }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, playing, gameover
    currentTurnIndex: 0,
    currentPrompt: 'STA',
    timer: 15, // seconds
    lives: {} // { 'Player1': 3, 'Player2': 3 }
  });

  const [inputWord, setInputWord] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Host initializes the game state
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const initialLives = {};
      players.forEach(p => initialLives[p] = 3);
      
      const initialState = {
        status: 'playing',
        currentTurnIndex: 0,
        currentPrompt: generatePrompt(),
        timer: 15,
        lives: initialLives,
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
    const prompts = ['STA', 'CHE', 'TIO', 'ING', 'CON', 'PRO', 'COM', 'ENT'];
    return prompts[Math.floor(Math.random() * prompts.length)];
  };

  const isMyTurn = players[gameState.currentTurnIndex] === playerName;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMyTurn) return;

    const word = inputWord.toUpperCase();
    
    // Validate
    if (!word.includes(gameState.currentPrompt)) {
      setErrorMsg(`Word must contain ${gameState.currentPrompt}`);
      return;
    }
    
    // Basic dictionary check (mocked)
    // In a real app we'd use a comprehensive list or API
    if (word.length < 3) {
      setErrorMsg('Word too short');
      return;
    }

    // Success! Pass the turn (send update to host/everyone)
    setErrorMsg('');
    setInputWord('');

    let nextIndex = (gameState.currentTurnIndex + 1) % players.length;
    while (gameState.lives[players[nextIndex]] <= 0) {
        nextIndex = (nextIndex + 1) % players.length;
    }

    const newState = {
      ...gameState,
      currentTurnIndex: nextIndex,
      currentPrompt: generatePrompt(),
      timer: Math.max(5, 15 - Math.floor(15 - gameState.timer) * 0.5) // gets faster!
    };

    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState); // Optimistic update
  };

  if (gameState.status === 'starting') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Initializing Game...</div>;
  }

  if (gameState.status === 'gameover') {
    const winner = Object.keys(gameState.lives).find(p => gameState.lives[p] > 0) || 'Nobody';
    return (
      <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: "'Panchang', sans-serif" }}>
        <h1 style={{ color: '#ff3333', fontSize: '4rem' }}>GAME OVER</h1>
        <h2>WINNER: <span style={{ color: '#ebd73f' }}>{winner}</span></h2>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#111', color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100
    }}>
      
      {/* Player List / Lives */}
      <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif" }}>PLAYERS</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {players.map((p, i) => (
            <li key={i} style={{ 
              color: i === gameState.currentTurnIndex ? '#ebd73f' : (gameState.lives[p] <= 0 ? '#555' : '#fff'),
              fontWeight: i === gameState.currentTurnIndex ? 'bold' : 'normal',
              marginBottom: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>
                {p === playerName ? '> ' : ''}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <CustomAvatar config={playerAvatars && playerAvatars[p]} size={24} />
                  {p}
                </div>
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: gameState.lives[p] || 0 }).map((_, idx) => <Heart key={`h-${idx}`} size={16} color="#ff3333" fill="#ff3333" />)}
                {Array.from({ length: 3 - (gameState.lives[p] || 0) }).map((_, idx) => <Skull key={`s-${idx}`} size={16} color="#555" />)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* The Bomb / Timer */}
      <div style={{
        width: '200px', height: '200px', borderRadius: '50%', background: '#ff3333',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 ${40 + (15 - gameState.timer) * 5}px #ff3333`,
        animation: gameState.timer < 5 ? 'pulse 0.5s infinite' : 'none',
        marginBottom: '40px', position: 'relative'
      }}>
         <h1 style={{ fontSize: '5rem', margin: 0, fontFamily: 'monospace' }}>{Math.ceil(gameState.timer)}</h1>
      </div>
      
      <h2 style={{ opacity: 0.5 }}>Type a word containing:</h2>
      <h1 style={{ fontSize: '4rem', letterSpacing: '10px', color: '#ebd73f', margin: '0 0 40px 0', fontFamily: "'Panchang', sans-serif" }}>
        {gameState.currentPrompt}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input 
          type="text" 
          value={inputWord}
          onChange={(e) => setInputWord(e.target.value)}
          disabled={!isMyTurn}
          placeholder={isMyTurn ? "TYPE WORD HERE" : "WAITING FOR TURN..."}
          style={{
            padding: '20px', fontSize: '1.5rem', borderRadius: '12px', border: 'none',
            textAlign: 'center', textTransform: 'uppercase', width: '300px',
            background: isMyTurn ? '#fff' : '#333',
            color: isMyTurn ? '#000' : '#888',
            fontFamily: "'Panchang', sans-serif"
          }}
          autoFocus
        />
        {errorMsg && <p style={{ color: '#ff3333', marginTop: '10px', fontWeight: 'bold' }}>{errorMsg}</p>}
        {isMyTurn && <button type="submit" style={{ display: 'none' }}>Submit</button>}
      </form>
    </div>
  );
}
