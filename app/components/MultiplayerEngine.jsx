"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ChevronLeft, ChevronRight, Dices } from 'lucide-react';
import CustomAvatar, { AVATAR_COLORS, AVATAR_EYES, AVATAR_MOUTHS, AVATAR_HEADGEAR } from './multiplayer/CustomAvatar';
import WordDrop from './multiplayer/WordDrop';
import DumbDoodles from './multiplayer/DumbDoodles';
import UndercoverSpy from './multiplayer/UndercoverSpy';
import BrokenBrief from './multiplayer/BrokenBrief';
import PriceIsWhat from './multiplayer/PriceIsWhat';

export default function MultiplayerEngine({ activeGame, onBack }) {
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [gameState, setGameState] = useState('menu'); // 'menu', 'lobby', 'playing'
  const [players, setPlayers] = useState([]);
  const [channel, setChannel] = useState(null);
  
  const [playerName, setPlayerName] = useState('');
  const [avatarConfig, setAvatarConfig] = useState({ color: 0, eyes: 0, mouth: 0, headgear: 0 });
  const [playerAvatars, setPlayerAvatars] = useState({});

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
    const adjs = ['DANK', 'SIGMA', 'BASED', 'CHAD', 'SUS', 'CRINGE', 'SWAG', 'GOATED', 'BUSSIN', 'SALTY', 'SNEAKY', 'SPICY'];
    const nouns = ['DOGE', 'PEPE', 'CHUNGUS', 'MONKE', 'RIZZ', 'GIGACHAD', 'BOOMER', 'ZOOMER', 'WOJAK', 'GLIZZY', 'GOBLIN', 'CHEF'];
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj}-${noun}`;
  };

  const createRoom = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsHost(true);
    joinRealtimeChannel(code, true);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinInput || joinInput.length < 3) {
      alert('Please enter a valid room name.');
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
        const avatars = {};
        for (const [key, presences] of Object.entries(state)) {
            playerList.push(key);
            if (presences.length > 0 && presences[0].avatar) {
              avatars[key] = presences[0].avatar;
            }
        }
        setPlayers(playerList);
        setPlayerAvatars(avatars);
      })
      .on('broadcast', { event: 'game_start' }, (payload) => {
        setGameState('playing');
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          try {
             await roomChannel.track({ name: playerName, isHost: host, avatar: avatarConfig });
          } catch(e) { console.error(e); }
          setGameState('lobby');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error', err);
          alert('Failed to connect to multiplayer server. Please try again.');
        }
      });

    // Optimistic UI update to prevent button from feeling dead
    setGameState('lobby');
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
        return <WordDrop channel={channel} isHost={isHost} players={players} playerName={playerName} playerAvatars={playerAvatars} />;
      case 'dumbdoodles':
        return <DumbDoodles channel={channel} isHost={isHost} players={players} playerName={playerName} playerAvatars={playerAvatars} />;
      case 'undercover':
        return <UndercoverSpy channel={channel} isHost={isHost} players={players} playerName={playerName} playerAvatars={playerAvatars} />;
      case 'brokenbrief':
        return <BrokenBrief channel={channel} isHost={isHost} players={players} playerName={playerName} playerAvatars={playerAvatars} />;
      case 'priceiswhat':
        return <PriceIsWhat channel={channel} isHost={isHost} players={players} playerName={playerName} playerAvatars={playerAvatars} />;
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
        height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80vw', height: '80vh', background: 'radial-gradient(circle at center, rgba(235, 215, 63, 0.15), transparent 70%)',
          pointerEvents: 'none', filter: 'blur(60px)'
        }} />
        <h1 style={{ color: '#ebd73f', fontSize: '4rem', margin: '0 0 15px 0', fontFamily: "'Panchang', sans-serif", textShadow: '0 0 30px rgba(235,215,63,0.5)' }}>ROOM: {roomCode}</h1>
        <p style={{ letterSpacing: '6px', opacity: 0.8, marginBottom: '50px', fontSize: '1.2rem', textTransform: 'uppercase' }}>WAITING FOR AGENTS</p>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', 
          width: '100%', maxWidth: '500px', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)'
        }}>
          <h3 style={{ margin: '0 0 25px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#fff' }}>
            CONNECTED ({players.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {players.map((p, i) => (
              <li key={i} style={{ 
                padding: '15px 20px', background: 'rgba(255,255,255,0.05)', 
                borderRadius: '12px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', fontSize: '1.1rem', letterSpacing: '1px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CustomAvatar config={playerAvatars[p]} size={32} />
                  {p}
                </div>
                {isHost && p === playerName ? <span style={{color: '#ebd73f', fontSize: '0.9rem', fontFamily: "'Panchang', sans-serif"}}>HOST</span> : ''}
              </li>
            ))}
            {players.length === 0 && <p style={{ opacity: 0.5, textAlign: 'center', fontStyle: 'italic' }}>Connecting...</p>}
          </ul>
        </div>

        {isHost ? (
          <button 
            onClick={startGame}
            style={{ 
              marginTop: '50px', padding: '20px 60px', background: '#ebd73f', color: '#000', 
              border: 'none', borderRadius: '40px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer',
              fontFamily: "'Panchang', sans-serif", boxShadow: '0 10px 30px rgba(235, 215, 63, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(235, 215, 63, 0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(235, 215, 63, 0.4)'; }}
          >
            START PROTOCOL
          </button>
        ) : (
          <p style={{ marginTop: '50px', opacity: 0.5, fontSize: '1.2rem', letterSpacing: '2px' }}>Awaiting host initialization...</p>
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
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: '400px'
      }}>
        <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', marginBottom: '10px' }}>MULTIPLAYER</h1>
        <p style={{ opacity: 0.7, marginBottom: '20px' }}>Customize your agent and join a room.</p>

        {/* Avatar Customizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
          <div style={{ position: 'relative' }}>
            <CustomAvatar config={avatarConfig} size={100} />
            <button onClick={() => {
              setAvatarConfig({
                color: Math.floor(Math.random() * AVATAR_COLORS.length),
                eyes: Math.floor(Math.random() * AVATAR_EYES.length),
                mouth: Math.floor(Math.random() * AVATAR_MOUTHS.length),
                headgear: Math.floor(Math.random() * AVATAR_HEADGEAR.length)
              });
            }} style={{ position: 'absolute', top: -10, right: -10, background: '#33ccff', color: '#000', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(51, 204, 255, 0.5)' }}>
              <Dices size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '20px' }}>
            {[
              { label: 'COLOR', key: 'color', max: AVATAR_COLORS.length },
              { label: 'EYES', key: 'eyes', max: AVATAR_EYES.length },
              { label: 'MOUTH', key: 'mouth', max: AVATAR_MOUTHS.length },
              { label: 'GEAR', key: 'headgear', max: AVATAR_HEADGEAR.length }
            ].map(setting => (
              <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => setAvatarConfig(p => ({ ...p, [setting.key]: (p[setting.key] - 1 + setting.max) % setting.max }))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}>
                  <ChevronLeft size={24} />
                </button>
                <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.8rem', letterSpacing: '1px' }}>{setting.label}</span>
                <button type="button" onClick={() => setAvatarConfig(p => ({ ...p, [setting.key]: (p[setting.key] + 1) % setting.max }))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7 }}>
                  <ChevronRight size={24} />
                </button>
              </div>
            ))}
          </div>
        </div>

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
            placeholder="ROOM NAME (e.g. DANK-DOGE)" 
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
