"use client";

import React, { useState, useEffect } from 'react';
import { Target, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

const LOCATIONS = [
  "HOSPITAL", "SUBMARINE", "SPACE STATION", "POLICE STATION", 
  "BANK", "SCHOOL", "AIRPORT", "PIRATE SHIP", "CASINO", "RESTAURANT",
  "SUPERMARKET", "ZOO", "MUSEUM", "LIBRARY", "GYM"
];

// Emojis for avatars
const AVATARS = ['🕵️', '🥷', '🕴️', '👩‍🎤', '🧑‍🚀', '👨‍✈️', '👮‍♀️', '🧛‍♂️', '🧟‍♀️', '🦸‍♂️'];

export default function UndercoverSpy({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, interrogation, voting, gameover
    spyPlayer: '',
    location: '',
    currentTurnIndex: 0,
    wordsSubmitted: [], 
    votes: {}, // { 'Player1': 2 }
    voters: [], // ['Player2', 'Player3']
    winner: '', // 'agents' or 'spy'
    avatars: {}
  });

  const [inputWord, setInputWord] = useState('');

  // Host initializes the game
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const spy = players[Math.floor(Math.random() * players.length)];
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      
      const initialVotes = {};
      const initialAvatars = {};
      players.forEach(p => {
        initialVotes[p] = 0;
        initialAvatars[p] = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      });

      const initialState = {
        status: 'interrogation',
        spyPlayer: spy,
        location: loc,
        currentTurnIndex: 0,
        wordsSubmitted: [],
        votes: initialVotes,
        voters: [],
        winner: '',
        avatars: initialAvatars
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  // Listen for syncs
  useEffect(() => {
    if (!channel) return;
    const sub = channel.on('broadcast', { event: 'sync_state' }, ({ payload }) => {
      setGameState(payload);
    }).subscribe();

    return () => { channel.removeChannel(sub); }
  }, [channel]);

  // Derived state
  const isMyTurn = players[gameState.currentTurnIndex] === playerName;
  const amISpy = gameState.spyPlayer === playerName;

  const submitWord = (e) => {
    e.preventDefault();
    if (!isMyTurn || !inputWord.trim()) return;

    const newWords = [...gameState.wordsSubmitted, { player: playerName, word: inputWord.trim().toUpperCase() }];
    
    // Check if interrogation is over (everyone went twice)
    const isInterrogationOver = newWords.length >= players.length * 2;
    
    const newState = {
      ...gameState,
      wordsSubmitted: newWords,
      currentTurnIndex: isInterrogationOver ? gameState.currentTurnIndex : (gameState.currentTurnIndex + 1) % players.length,
      status: isInterrogationOver ? 'voting' : 'interrogation'
    };

    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState);
    setInputWord('');
  };

  const castVote = (targetPlayer) => {
    if (gameState.voters.includes(playerName)) return; // already voted

    const newVoters = [...gameState.voters, playerName];
    const newVotes = { ...gameState.votes };
    newVotes[targetPlayer] = (newVotes[targetPlayer] || 0) + 1;

    let newState = {
      ...gameState,
      voters: newVoters,
      votes: newVotes
    };

    // If everyone voted, evaluate winner
    if (newVoters.length === players.length && isHost) {
      let maxVotes = -1;
      let eliminatedPlayer = '';
      let isTie = false;

      for (const [p, count] of Object.entries(newVotes)) {
        if (count > maxVotes) {
          maxVotes = count;
          eliminatedPlayer = p;
          isTie = false;
        } else if (count === maxVotes) {
          isTie = true;
        }
      }

      newState.status = 'gameover';
      if (isTie) {
         newState.winner = 'spy'; // Tie goes to the spy
      } else if (eliminatedPlayer === gameState.spyPlayer) {
         newState.winner = 'agents';
      } else {
         newState.winner = 'spy';
      }
    }

    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState);
  };

  if (gameState.status === 'starting') {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px', fontFamily: "'Panchang', sans-serif" }}>DISTRIBUTING BRIEFCASES...</div>;
  }

  return (
    <div style={styles.background}>
      <div style={styles.dashboard}>

        {/* TOP BANNER: Role Reveal */}
        <div style={{ ...styles.glassPanel, width: '100%', padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${amISpy ? 'rgba(255, 51, 51, 0.5)' : 'rgba(51, 204, 255, 0.5)'}`, boxShadow: `0 0 40px ${amISpy ? 'rgba(255, 51, 51, 0.2)' : 'rgba(51, 204, 255, 0.1)'}` }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', opacity: 0.6, fontSize: '0.9rem', letterSpacing: '4px', textTransform: 'uppercase' }}>YOUR IDENTITY</h2>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontFamily: "'Panchang', sans-serif", color: amISpy ? '#ff3333' : '#33ccff', textShadow: `0 0 20px ${amISpy ? 'rgba(255,51,51,0.5)' : 'rgba(51,204,255,0.5)'}` }}>
              {amISpy ? 'THE SPY' : 'AGENT'}
            </h1>
          </div>
          
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {amISpy ? <ShieldAlert size={40} color="#ff3333" /> : <Target size={40} color="#33ccff" />}
            <div>
              {amISpy ? (
                <>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>OBJECTIVE</p>
                  <p style={{ margin: 0, color: '#ffcc00', fontWeight: 'bold' }}>Blend in. Do not get caught.</p>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>CURRENT LOCATION</p>
                  <p style={{ margin: 0, color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '2px' }}>{gameState.location}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MAIN GAME AREA */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, marginTop: '20px' }}>
          
          {/* PLAYERS LIST (LEFT) */}
          <div style={{ ...styles.glassPanel, width: '300px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.1rem', letterSpacing: '1px' }}>SUSPECTS</h3>
            </div>
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.map((p, i) => {
                const isActive = gameState.status === 'interrogation' && i === gameState.currentTurnIndex;
                const isMe = p === playerName;
                return (
                  <div key={i} style={{
                    padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.05)' : 'none',
                    transition: 'all 0.3s'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>{gameState.avatars[p] || '👤'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: '#fff' }}>
                        {p} {isMe && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>(You)</span>}
                      </span>
                      {isActive && <span style={{ fontSize: '0.7rem', color: '#ebd73f', letterSpacing: '1px' }}>SPEAKING...</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ACTION PANEL (RIGHT) */}
          <div style={{ ...styles.glassPanel, flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* 1. INTERROGATION PHASE */}
            {gameState.status === 'interrogation' && (
              <>
                <div style={{ padding: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <h2 style={{ margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", color: isMyTurn ? '#ebd73f' : '#fff' }}>
                    {isMyTurn ? "IT'S YOUR TURN" : `WAITING FOR ${players[gameState.currentTurnIndex]}...`}
                  </h2>
                  <p style={{ margin: 0, opacity: 0.6 }}>Give a one-word clue about the location.</p>
                </div>
                
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {gameState.wordsSubmitted.map((item, i) => (
                      <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>{item.player} said:</span>
                        <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: '#fff' }}>"{item.word}"</span>
                      </div>
                    ))}
                    {gameState.wordsSubmitted.length === 0 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', opacity: 0.4, padding: '40px' }}>
                        <FileText size={48} style={{ margin: '0 auto 20px auto' }} />
                        <p>The dossier is empty. Awaiting first clue.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: '30px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <form onSubmit={submitWord} style={{ display: 'flex', gap: '15px' }}>
                    <input 
                      type="text" 
                      value={inputWord}
                      onChange={e => setInputWord(e.target.value)}
                      disabled={!isMyTurn}
                      placeholder={isMyTurn ? "Type your clue here..." : "Wait for your turn..."}
                      maxLength={20}
                      style={{
                        flex: 1, padding: '20px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                        borderRadius: '16px', fontSize: '1.2rem', outline: 'none', transition: 'all 0.3s',
                        fontFamily: "'Clash Display', sans-serif"
                      }}
                    />
                    <button 
                      type="submit"
                      disabled={!isMyTurn || !inputWord.trim()}
                      style={{
                        padding: '0 40px', background: isMyTurn ? '#ebd73f' : 'rgba(255,255,255,0.1)', color: isMyTurn ? '#000' : 'rgba(255,255,255,0.3)',
                        border: 'none', borderRadius: '16px', fontFamily: "'Panchang', sans-serif", fontSize: '1rem', cursor: isMyTurn ? 'pointer' : 'default',
                        transition: 'all 0.3s'
                      }}
                    >
                      SUBMIT
                    </button>
                  </form>
                </div>
              </>
            )}

            {/* 2. VOTING PHASE */}
            {gameState.status === 'voting' && (
              <div style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <h2 style={{ margin: '0 0 10px 0', fontFamily: "'Panchang', sans-serif", color: '#ff3333', fontSize: '2.5rem' }}>VOTING PHASE</h2>
                <p style={{ margin: '0 0 40px 0', opacity: 0.7, fontSize: '1.2rem' }}>Who is the Spy? Cast your vote.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', width: '100%', maxWidth: '800px' }}>
                  {players.map(p => {
                    const hasVoted = gameState.voters.includes(playerName);
                    return (
                      <button 
                        key={p}
                        onClick={() => castVote(p)}
                        disabled={hasVoted}
                        style={{
                          padding: '25px', background: hasVoted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                          borderRadius: '16px', cursor: hasVoted ? 'default' : 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                          transition: 'all 0.3s'
                        }}
                      >
                        <span style={{ fontSize: '3rem' }}>{gameState.avatars[p] || '👤'}</span>
                        <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem' }}>{p} {p === playerName ? '(YOU)' : ''}</span>
                        
                        {hasVoted ? (
                           <div style={{ padding: '8px 16px', background: 'rgba(235, 215, 63, 0.1)', color: '#ebd73f', borderRadius: '30px', fontWeight: 'bold' }}>
                             {gameState.votes[p] || 0} Votes
                           </div>
                        ) : (
                           <div style={{ opacity: 0.5, fontSize: '0.9rem' }}>Click to Vote</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 3. GAMEOVER PHASE */}
            {gameState.status === 'gameover' && (
              <div style={{ padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                <h1 style={{ 
                  margin: '0 0 20px 0', fontSize: '4rem', fontFamily: "'Panchang', sans-serif", 
                  color: gameState.winner === 'spy' ? '#ff3333' : '#33ccff',
                  textShadow: `0 0 40px ${gameState.winner === 'spy' ? 'rgba(255,51,51,0.5)' : 'rgba(51,204,255,0.5)'}`
                }}>
                  {gameState.winner === 'spy' ? 'THE SPY ESCAPED!' : 'THE SPY IS CAUGHT!'}
                </h1>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                  <div style={{ padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', minWidth: '250px' }}>
                    <p style={{ margin: '0 0 10px 0', opacity: 0.5, letterSpacing: '2px' }}>LOCATION WAS</p>
                    <p style={{ margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem', color: '#fff' }}>{gameState.location}</p>
                  </div>
                  <div style={{ padding: '30px', background: 'rgba(255,51,51,0.1)', borderRadius: '24px', border: '1px solid rgba(255,51,51,0.3)', textAlign: 'center', minWidth: '250px' }}>
                    <p style={{ margin: '0 0 10px 0', opacity: 0.8, letterSpacing: '2px', color: '#ff3333' }}>THE SPY WAS</p>
                    <p style={{ margin: 0, fontFamily: "'Panchang', sans-serif", fontSize: '1.5rem', color: '#fff' }}>{gameState.spyPlayer}</p>
                  </div>
                </div>

                {isHost && (
                  <button 
                    onClick={() => {
                      const spy = players[Math.floor(Math.random() * players.length)];
                      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
                      const initialVotes = {};
                      players.forEach(p => initialVotes[p] = 0);
                      const initialState = {
                        status: 'interrogation', spyPlayer: spy, location: loc,
                        currentTurnIndex: 0, wordsSubmitted: [], votes: initialVotes,
                        voters: [], winner: '', avatars: gameState.avatars
                      };
                      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
                      setGameState(initialState);
                    }}
                    style={{
                      padding: '20px 60px', background: '#ebd73f', color: '#000',
                      border: 'none', borderRadius: '40px', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', cursor: 'pointer',
                      transition: 'transform 0.2s', boxShadow: '0 10px 30px rgba(235, 215, 63, 0.3)'
                    }}
                  >
                    PLAY AGAIN
                  </button>
                )}
              </div>
            )}
            
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
    backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(255, 51, 51, 0.1) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(51, 204, 255, 0.05) 0%, transparent 50%)',
    fontFamily: "'Clash Display', sans-serif",
    color: '#fff',
    overflow: 'hidden'
  },
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '30px',
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
  }
};
