"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import WordDrop from './multiplayer/WordDrop';

export default function MultiplayerEngine({ activeGame, onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'playing'
  const [players, setPlayers] = useState([]);
  const [channel, setChannel] = useState(null);
  
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    // Try to get user name from local storage
    const userStr = localStorage.getItem('dripp_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setPlayerName(user.name || 'Player_' + Math.floor(Math.random() * 1000));
      } catch (e) {
        setPlayerName('Player_' + Math.floor(Math.random() * 1000));
      }
    } else {
      setPlayerName('Player_' + Math.floor(Math.random() * 1000));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [channel]);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    joinRealtimeChannel(code, true);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinInput || joinInput.length !== 4) {
      alert('Please enter a valid 4-character room code.');
      return;
    }
    const code = joinInput.toUpperCase();
    setRoomCode(code);
    setIsHost(false);
    joinRealtimeChannel(code, false);
  };

  const joinRealtimeChannel = (code, host) => {
    // Note: Supabase Broadcast relies on presence to track users
    const roomChannel = supabase.channel(`room:${code}`, {
      config: {
        presence: {
          key: playerName,
        },
        broadcast: { ack: true }
      },
    });

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState();
        const playerList = [];
        for (const [key, presences] of Object.entries(state)) {
            playerList.push(key);
        }
        setPlayers(playerList);
      })
      .on('broadcast', { event: 'game_start' }, (payload) => {
        setGameState('playing');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({ name: playerName, isHost: host });
          setGameState('lobby');
        }
      });

    setChannel(roomChannel);
  };

  const startGame = () => {
    if (isHost && channel) {
      channel.send({
        type: 'broadcast',
        event: 'game_start',
        payload: { startedAt: Date.now() },
      });
      setGameState('playing');
    }
  };

  // -----------------------------------------------------
  // UI RENDERS
  // -----------------------------------------------------

  if (gameState === 'playing') {
    // Render the selected game
    switch (activeGame) {
      case 'worddrop':
        return <WordDrop channel={channel} isHost={isHost} players={players} playerName={playerName} />;
      default:
        return (
          <div style={{ color: 'white', textAlign: 'center', paddingTop: '100px' }}>
            <h1>{activeGame} is under construction.</h1>
            <button onClick={() => setGameState('menu')}>Back</button>
          </div>
        );
    }
  }

  if (gameState === 'lobby') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: '#111', color: '#fff', fontFamily: "'Panchang', sans-serif",
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100
      }}>
        <h1 style={{ color: '#ebd73f', fontSize: '3rem', margin: '0 0 10px 0' }}>ROOM: {roomCode}</h1>
        <p style={{ letterSpacing: '4px', opacity: 0.7, marginBottom: '40px' }}>WAITING FOR PLAYERS</p>

        <div style={{ 
          background: 'rgba(255,255,255,0.05)', padding: '30px', borderRadius: '16px', 
          width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
            PLAYERS ({players.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, minHeight: '100px' }}>
            {players.map((p, i) => (
              <li key={i} style={{ 
                padding: '10px', background: 'rgba(255,255,255,0.1)', marginBottom: '8px', 
                borderRadius: '8px', display: 'flex', justifyContent: 'space-between' 
              }}>
                {p} {isHost && p === playerName ? <span style={{color: '#3f3'}}>[HOST]</span> : ''}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <button 
            onClick={startGame}
            style={{ 
              marginTop: '40px', padding: '15px 40px', background: '#ebd73f', color: '#000', 
              border: 'none', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' 
            }}
          >
            START GAME
          </button>
        ) : (
          <p style={{ marginTop: '40px', opacity: 0.5 }}>Waiting for host to start...</p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100
    }}>
      <div style={{ 
        background: 'rgba(20,20,20,0.8)', padding: '50px', borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', marginBottom: '10px' }}>MULTIPLAYER</h1>
        <p style={{ opacity: 0.7, marginBottom: '40px' }}>Join a friend's room or create your own.</p>

        <button 
          onClick={createRoom}
          style={{ 
            width: '100%', padding: '15px', background: '#33ccff', color: '#000', 
            border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', 
            marginBottom: '20px', cursor: 'pointer', fontFamily: "'Panchang', sans-serif"
          }}
        >
          CREATE ROOM
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', opacity: 0.5 }}>
          <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
          <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
        </div>

        <form onSubmit={joinRoom} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="4-DIGIT CODE" 
            maxLength={4}
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            style={{ 
              flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', 
              fontSize: '1.2rem', textAlign: 'center', textTransform: 'uppercase', fontFamily: 'monospace'
            }}
          />
          <button 
            type="submit"
            style={{ 
              padding: '0 25px', background: '#ebd73f', color: '#000', border: 'none', 
              borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            JOIN
          </button>
        </form>
      </div>
      <button onClick={onBack} style={{ marginTop: '20px', background: 'transparent', border: 'none', color: '#fff', opacity: 0.5, cursor: 'pointer' }}>Cancel</button>
    </div>
  );
}
