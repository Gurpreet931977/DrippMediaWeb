"use client";

import React, { useState, useEffect } from 'react';

const LOCATIONS = [
  "HOSPITAL", "SUBMARINE", "SPACE STATION", "POLICE STATION", 
  "BANK", "SCHOOL", "AIRPORT", "PIRATE SHIP", "CASINO", "RESTAURANT",
  "SUPERMARKET", "ZOO", "MUSEUM", "LIBRARY", "GYM"
];

export default function UndercoverSpy({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    status: 'starting', // starting, interrogation, voting, gameover
    spyPlayer: '',
    location: '',
    currentTurnIndex: 0,
    wordsSubmitted: [], 
    votes: {}, // { 'Player1': 2 }
    voters: [], // ['Player2', 'Player3']
    winner: '' // 'agents' or 'spy'
  });

  const [inputWord, setInputWord] = useState('');

  // Host initializes the game
  useEffect(() => {
    if (isHost && gameState.status === 'starting') {
      const spy = players[Math.floor(Math.random() * players.length)];
      const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      
      const initialVotes = {};
      players.forEach(p => initialVotes[p] = 0);

      const initialState = {
        status: 'interrogation',
        spyPlayer: spy,
        location: loc,
        currentTurnIndex: 0,
        wordsSubmitted: [],
        votes: initialVotes,
        voters: [],
        winner: ''
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  // Listen for syncs
  useEffect(() => {
    if (!channel) return;
    channel.on('broadcast', { event: 'sync_state' }, (payload) => {
      setGameState(payload.payload);
    });
  }, [channel]);

  // Derived state
  const isMyTurn = players[gameState.currentTurnIndex] === playerName;
  const amISpy = gameState.spyPlayer === playerName;

  const submitWord = (e) => {
    e.preventDefault();
    if (!isMyTurn || !inputWord.trim()) return;

    const newWords = [...gameState.wordsSubmitted, { player: playerName, word: inputWord.trim().toUpperCase() }];
    
    // Check if interrogation is over (everyone went twice)
    // If not, pass turn to next player
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
         // Tie goes to the spy
         newState.winner = 'spy';
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
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Distributing Briefcases...</div>;
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
      padding: '40px'
    }}>
      
      {/* Top Banner: Role & Secret */}
      <div style={{ 
          background: amISpy ? 'rgba(255, 51, 51, 0.1)' : 'rgba(51, 204, 255, 0.1)',
          border: `1px solid ${amISpy ? '#ff3333' : '#33ccff'}`,
          padding: '20px 40px', borderRadius: '12px', textAlign: 'center',
          boxShadow: `0 0 30px ${amISpy ? 'rgba(255,51,51,0.2)' : 'rgba(51,204,255,0.2)'}`,
          marginBottom: '40px', width: '100%', maxWidth: '600px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', opacity: 0.7, letterSpacing: '2px' }}>YOUR ROLE</h2>
        <h1 style={{ margin: 0, color: amISpy ? '#ff3333' : '#33ccff', fontFamily: "'Panchang', sans-serif" }}>
          {amISpy ? 'THE SPY' : 'AGENT'}
        </h1>
        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
          {amISpy ? (
             <p style={{ margin: 0, color: '#ffcc00' }}>You do not know the location. Blend in and don't get caught!</p>
          ) : (
             <p style={{ margin: 0 }}>Location: <strong style={{ color: '#ebd73f', fontSize: '1.2rem', letterSpacing: '2px' }}>{gameState.location}</strong></p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {gameState.status === 'interrogation' && (
        <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          
          <h3 style={{ textAlign: 'center', color: '#ebd73f', fontFamily: "'Panchang', sans-serif", marginBottom: '20px' }}>
            {isMyTurn ? "IT'S YOUR TURN" : `WAITING FOR ${players[gameState.currentTurnIndex]}...`}
          </h3>

          <div style={{ 
             flex: 1, overflowY: 'auto', background: 'rgba(255,255,255,0.02)', 
             borderRadius: '12px', padding: '20px', marginBottom: '20px',
             border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {gameState.wordsSubmitted.map((item, i) => (
              <div key={i} style={{ 
                  padding: '10px 15px', background: 'rgba(255,255,255,0.05)', 
                  marginBottom: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ opacity: 0.7 }}>{item.player}</span>
                <span style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{item.word}</span>
              </div>
            ))}
            {gameState.wordsSubmitted.length === 0 && (
               <p style={{ textAlign: 'center', opacity: 0.5 }}>No words submitted yet.</p>
            )}
          </div>

          <form onSubmit={submitWord} style={{ display: 'flex' }}>
            <input 
              type="text" 
              value={inputWord}
              onChange={e => setInputWord(e.target.value)}
              disabled={!isMyTurn}
              placeholder={isMyTurn ? "Type a descriptive word..." : "Waiting..."}
              maxLength={20}
              style={{
                flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
                borderRadius: '8px 0 0 8px', fontSize: '1.1rem', outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={!isMyTurn}
              style={{
                padding: '0 30px', background: isMyTurn ? '#ebd73f' : '#333', color: '#000',
                border: 'none', borderRadius: '0 8px 8px 0', fontWeight: 'bold', cursor: isMyTurn ? 'pointer' : 'default'
              }}
            >
              SUBMIT
            </button>
          </form>
        </div>
      )}

      {gameState.status === 'voting' && (
        <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <h2 style={{ color: '#ff3333', fontFamily: "'Panchang', sans-serif" }}>VOTING PHASE</h2>
          <p style={{ opacity: 0.7, marginBottom: '30px' }}>Who is the Spy? Cast your vote.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {players.map(p => (
               <button 
                 key={p}
                 onClick={() => castVote(p)}
                 disabled={gameState.voters.includes(playerName)}
                 style={{
                    padding: '15px 20px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                    borderRadius: '8px', fontSize: '1.1rem', cursor: gameState.voters.includes(playerName) ? 'default' : 'pointer',
                    display: 'flex', justifyContent: 'space-between'
                 }}
               >
                 <span>{p} {p === playerName ? '(You)' : ''}</span>
                 {gameState.voters.includes(playerName) && (
                    <span style={{ color: '#ebd73f' }}>{gameState.votes[p] || 0} Votes</span>
                 )}
               </button>
            ))}
          </div>
        </div>
      )}

      {gameState.status === 'gameover' && (
        <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', fontFamily: "'Panchang', sans-serif", color: gameState.winner === 'spy' ? '#ff3333' : '#33ccff' }}>
            {gameState.winner === 'spy' ? 'THE SPY WINS!' : 'AGENTS WIN!'}
          </h1>
          <div style={{ margin: '30px 0', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>The location was: <strong style={{ color: '#ebd73f' }}>{gameState.location}</strong></p>
            <p style={{ fontSize: '1.2rem' }}>The Spy was: <strong style={{ color: '#ff3333' }}>{gameState.spyPlayer}</strong></p>
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
                    voters: [], winner: ''
                  };
                  channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
                  setGameState(initialState);
               }}
               style={{
                  padding: '15px 40px', background: '#ebd73f', color: '#000',
                  border: 'none', borderRadius: '30px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer'
               }}
             >
               PLAY AGAIN
             </button>
          )}
        </div>
      )}

    </div>
  );
}
