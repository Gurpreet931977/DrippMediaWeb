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
          boxShadow: '0 30px 60px rgba(0,0,0,0.8)', filter: 'url(#scribble)'
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
              transition: 'transform 0.2s, box-shadow 0.2s', filter: 'url(#scribble)'
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
      height: '100vh', width: '100vw',
      backgroundColor: '#050505',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(51, 204, 255, 0.15), transparent 60%), radial-gradient(circle at 50% 100%, rgba(235, 215, 63, 0.1), transparent 60%)',
      color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Animated Grid Background */}
      <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.7, animation: 'panBackground 60s linear infinite', pointerEvents: 'none' }} />

      {/* Global Scribble SVG Filter */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="scribble">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" seed="1">
            <animate attributeName="seed" values="1;2;3;4;5" calcMode="discrete" dur="0.4s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </svg>

      <style>{`
        @keyframes panBackground {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-25%, -25%); }
        }
        @keyframes floatModal {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
      `}</style>

      <div style={{ 
        background: 'rgba(15, 15, 20, 0.65)', padding: '50px', borderRadius: '32px', 
        border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
        backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
        width: '420px', boxSizing: 'border-box', position: 'relative', zIndex: 2,
        animation: 'floatModal 6s ease-in-out infinite',
        filter: 'url(#scribble)'
      }}>
        <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', margin: '0 0 5px 0', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>MULTIPLAYER</h1>
        <p style={{ opacity: 0.6, marginBottom: '25px', fontSize: '0.9rem', letterSpacing: '1px' }}>Customize your agent and deploy.</p>

        {/* Avatar Customizer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', padding: '25px 20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)', filter: 'url(#scribble)' }}>
          <div style={{ position: 'relative', width: '110px', height: '110px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}>
            <CustomAvatar config={avatarConfig} size={110} />
            <button onClick={() => {
              setAvatarConfig({
                color: Math.floor(Math.random() * AVATAR_COLORS.length),
                eyes: Math.floor(Math.random() * AVATAR_EYES.length),
                mouth: Math.floor(Math.random() * AVATAR_MOUTHS.length),
                headgear: Math.floor(Math.random() * AVATAR_HEADGEAR.length)
              });
            }} 
            style={{ position: 'absolute', top: -5, right: -15, background: 'linear-gradient(135deg, #33ccff 0%, #0099cc 100%)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 5px 15px rgba(51, 204, 255, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              <Dices size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '25px' }}>
            {[
              { label: 'COLOR', key: 'color', max: AVATAR_COLORS.length },
              { label: 'EYES', key: 'eyes', max: AVATAR_EYES.length },
              { label: 'MOUTH', key: 'mouth', max: AVATAR_MOUTHS.length },
              { label: 'GEAR', key: 'headgear', max: AVATAR_HEADGEAR.length }
            ].map(setting => (
              <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '5px 15px', borderRadius: '12px' }}>
                <button type="button" onClick={() => setAvatarConfig(p => ({ ...p, [setting.key]: (p[setting.key] - 1 + setting.max) % setting.max }))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s', padding: '5px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                  <ChevronLeft size={20} />
                </button>
                <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.75rem', letterSpacing: '2px', color: '#ccc' }}>{setting.label}</span>
                <button type="button" onClick={() => setAvatarConfig(p => ({ ...p, [setting.key]: (p[setting.key] + 1) % setting.max }))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.2s', padding: '5px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={createRoom}
          style={{ 
            width: '100%', padding: '18px', background: 'linear-gradient(90deg, #33ccff 0%, #0099cc 100%)', color: '#fff', 
            border: 'none', borderRadius: '16px', fontSize: '1.2rem', fontWeight: 'bold', 
            marginBottom: '25px', cursor: 'pointer', fontFamily: "'Panchang', sans-serif",
            boxShadow: '0 10px 25px rgba(51, 204, 255, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            filter: 'url(#scribble)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(51, 204, 255, 0.5), inset 0 2px 0 rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(51, 204, 255, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)'; }}
        >
          CREATE ROOM
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', opacity: 0.3 }}>
          <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
          <span style={{ padding: '0 15px', fontSize: '0.8rem', letterSpacing: '2px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#fff' }}></div>
        </div>

        <form onSubmit={joinRoom} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            placeholder="ROOM NAME" 
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
            style={{ 
              flex: 1, padding: '15px 20px', background: 'rgba(0,0,0,0.4)', 
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '16px', 
              fontSize: '1.1rem', textAlign: 'center', textTransform: 'uppercase', fontFamily: "'Clash Display', sans-serif",
              outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', minWidth: 0,
              filter: 'url(#scribble)'
            }}
            onFocus={e => e.currentTarget.style.borderColor = '#ebd73f'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button 
            type="submit"
            style={{ 
              padding: '0 30px', background: 'linear-gradient(135deg, #ebd73f 0%, #d4a017 100%)', color: '#000', border: 'none', 
              borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer',
              fontFamily: "'Panchang', sans-serif", boxShadow: '0 8px 20px rgba(235, 215, 63, 0.3)',
              transition: 'transform 0.2s', boxSizing: 'border-box',
              filter: 'url(#scribble)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            JOIN
          </button>
        </form>
      </div>
      <button onClick={onBack} style={{ marginTop: '30px', background: 'transparent', border: 'none', color: '#fff', opacity: 0.4, cursor: 'pointer', fontSize: '1rem', transition: 'opacity 0.2s', zIndex: 2 }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
        Return to Arcade
      </button>
    </div>
  );
}
