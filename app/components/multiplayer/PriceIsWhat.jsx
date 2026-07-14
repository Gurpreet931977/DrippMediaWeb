"use client";

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trophy, Clock, DollarSign, ArrowRight, Gavel, Play } from 'lucide-react';

const ITEMS = [
  { name: '1962 Ferrari 250 GTO', price: 48400000, emoji: '🏎️', hint: 'The holy grail of classic cars.' },
  { name: 'A Single Strand of Elvis\' Hair', price: 115000, emoji: '🎸', hint: 'Sold at auction in 2002.' },
  { name: 'Solid Gold Toilet', price: 1250000, emoji: '🚽', hint: '18-karat gold, fully functional.' },
  { name: 'First Apple Computer (Apple I)', price: 905000, emoji: '💻', hint: 'Built by Wozniak in 1976.' },
  { name: 'Bluefin Tuna (278kg)', price: 3100000, emoji: '🐟', hint: 'Sold in Tokyo, 2019.' },
  { name: 'Action Comics #1 (Superman Debut)', price: 3250000, emoji: '🦸‍♂️', hint: 'A pristine copy sold in 2021.' },
  { name: 'A Perfect Watermelon (Densuke)', price: 6100, emoji: '🍉', hint: 'A rare black watermelon from Japan.' },
  { name: 'Parking Spot in Manhattan', price: 1000000, emoji: '🅿️', hint: 'A single spot in a luxury condo.' },
  { name: 'Crystal Piano (Heintzman)', price: 3200000, emoji: '🎹', hint: 'Played at the Beijing Olympics.' },
  { name: '5-Min Trip to Space (Blue Origin)', price: 28000000, emoji: '🚀', hint: 'The first auctioned passenger seat.' },
  { name: 'Charles & Diana\'s Wedding Cake Slice', price: 2565, emoji: '🍰', hint: '40 years old.' },
  { name: 'Diamond Panther Bracelet', price: 7000000, emoji: '🐆', hint: 'Owned by Wallis Simpson.' },
  { name: 'Domain Name: Business.com', price: 34500000, emoji: '🌐', hint: 'Sold in 2007.' },
  { name: 'T-Rex Skeleton (Stan)', price: 31800000, emoji: '🦖', hint: 'Sold at Christie\'s in 2020.' },
  { name: 'Pigeon (New Kim)', price: 1900000, emoji: '🕊️', hint: 'A Belgian racing pigeon.' },
];

const MAX_ROUNDS = 5;
const BID_TIME = 20;

export default function PriceIsWhat({ channel, isHost, players, playerName }) {
  const [gameState, setGameState] = useState({
    phase: 'lobby', // lobby, bidding, reveal, leaderboard
    round: 1,
    currentItem: null,
    guesses: {}, // { playerName: guessAmount }
    scores: {}, // { playerName: score }
    timeLeft: BID_TIME,
    roundWinners: [] // names of players who won the round
  });

  const [myGuess, setMyGuess] = useState('');
  const [lockedIn, setLockedIn] = useState(false);
  const timerRef = useRef(null);

  // Initialize scores
  useEffect(() => {
    if (isHost && gameState.phase === 'lobby') {
      const initialScores = {};
      players.forEach(p => { initialScores[p] = 0; });
      updateState({ scores: initialScores });
    }
  }, [players]);

  // Sync incoming state
  useEffect(() => {
    const sub = channel.on('broadcast', { event: 'game_sync' }, ({ payload }) => {
      setGameState(prev => ({ ...prev, ...payload }));
      
      // Reset local inputs on new round
      if (payload.phase === 'bidding' && payload.round !== gameState.round) {
        setMyGuess('');
        setLockedIn(false);
      }
    }).subscribe();

    return () => { channel.removeChannel(sub); };
  }, [channel, gameState.round]);

  const updateState = (newState) => {
    if (isHost) {
      setGameState(prev => {
        const next = { ...prev, ...newState };
        channel.send({ type: 'broadcast', event: 'game_sync', payload: next });
        return next;
      });
    }
  };

  // Host Timer Logic
  useEffect(() => {
    if (isHost && gameState.phase === 'bidding') {
      if (timerRef.current) clearInterval(timerRef.current);
      
      let currentLeft = gameState.timeLeft;
      timerRef.current = setInterval(() => {
        currentLeft -= 1;
        updateState({ timeLeft: currentLeft });
        
        // Auto end round if time is up, or if everyone guessed
        if (currentLeft <= 0) {
          clearInterval(timerRef.current);
          handleRevealPhase();
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isHost, gameState.phase, gameState.timeLeft]);

  // Listen for guesses from clients
  useEffect(() => {
    if (!isHost) return;
    
    const sub = channel.on('broadcast', { event: 'submit_guess' }, ({ payload }) => {
      const { player, amount } = payload;
      setGameState(prev => {
        const newGuesses = { ...prev.guesses, [player]: amount };
        
        // If all players guessed, jump to reveal
        const allGuessed = players.every(p => newGuesses[p] !== undefined);
        
        const nextState = { ...prev, guesses: newGuesses };
        channel.send({ type: 'broadcast', event: 'game_sync', payload: nextState });
        
        if (allGuessed && prev.phase === 'bidding') {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => handleRevealPhase(newGuesses), 500);
        }
        return nextState;
      });
    }).subscribe();

    return () => { channel.removeChannel(sub); };
  }, [isHost, channel, players]);

  // Game flow controllers (Host Only)
  const startNextRound = (currentRound = 0) => {
    const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    // In a real app, remove item from list so it doesn't repeat, but random is fine for now
    updateState({
      phase: 'bidding',
      round: currentRound + 1,
      currentItem: randomItem,
      guesses: {},
      timeLeft: BID_TIME,
      roundWinners: []
    });
  };

  const handleRevealPhase = (latestGuesses = gameState.guesses) => {
    updateState({ phase: 'reveal' });
    
    // Calculate winner
    setTimeout(() => {
      setGameState(prev => {
        const actualPrice = prev.currentItem.price;
        let closestDiff = Infinity;
        let winners = [];
        
        // Find closest
        players.forEach(p => {
          const guess = latestGuesses[p];
          if (guess !== undefined) {
            const diff = Math.abs(guess - actualPrice);
            if (diff < closestDiff) {
              closestDiff = diff;
              winners = [p];
            } else if (diff === closestDiff) {
              winners.push(p);
            }
          }
        });

        // Update scores
        const newScores = { ...prev.scores };
        winners.forEach(w => {
          newScores[w] = (newScores[w] || 0) + 1000;
        });

        const nextState = { ...prev, scores: newScores, roundWinners: winners };
        channel.send({ type: 'broadcast', event: 'game_sync', payload: nextState });
        
        // Wait then go to next round or leaderboard
        setTimeout(() => {
          if (prev.round >= MAX_ROUNDS) {
            updateState({ phase: 'leaderboard' });
          } else {
            startNextRound(prev.round);
          }
        }, 6000);
        
        return nextState;
      });
    }, 2000); // 2 second suspense delay before showing winner
  };

  // Client Actions
  const submitGuess = (e) => {
    e.preventDefault();
    if (!myGuess || isNaN(myGuess)) return;
    
    const amount = parseInt(myGuess);
    setLockedIn(true);
    
    if (isHost) {
      setGameState(prev => {
        const newGuesses = { ...prev.guesses, [playerName]: amount };
        const allGuessed = players.every(p => newGuesses[p] !== undefined);
        
        const nextState = { ...prev, guesses: newGuesses };
        channel.send({ type: 'broadcast', event: 'game_sync', payload: nextState });
        
        if (allGuessed && prev.phase === 'bidding') {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => handleRevealPhase(newGuesses), 500);
        }
        return nextState;
      });
    } else {
      channel.send({ type: 'broadcast', event: 'submit_guess', payload: { player: playerName, amount } });
    }
  };

  // Render Helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  };

  // -----------------------------------------------------
  // RENDER: LOBBY
  // -----------------------------------------------------
  if (gameState.phase === 'lobby') {
    return (
      <div style={styles.container}>
        <div style={styles.glassPanel}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <DollarSign size={64} color="#33ff33" />
          </div>
          <h1 style={{ ...styles.title, color: '#33ff33' }}>THE PRICE IS WHAT?!</h1>
          <p style={styles.subtitle}>Guess the insane price of bizarre items. Closest guess wins!</p>
          
          <div style={styles.playerList}>
            {players.map((p, i) => (
              <div key={i} style={styles.playerTag}>{p}</div>
            ))}
          </div>
          
          {isHost ? (
            <button onClick={() => startNextRound(0)} style={{ ...styles.primaryBtn, background: '#33ff33' }}>
              START BIDDING
            </button>
          ) : (
            <p style={{ opacity: 0.5 }}>Waiting for host...</p>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER: BIDDING
  // -----------------------------------------------------
  if (gameState.phase === 'bidding') {
    return (
      <div style={styles.container}>
        <div style={styles.headerBar}>
          <div>ROUND {gameState.round}/{MAX_ROUNDS}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: gameState.timeLeft <= 5 ? '#ff3366' : '#fff' }}>
            <Clock size={20} /> {gameState.timeLeft}s
          </div>
        </div>

        <div style={{ ...styles.glassPanel, padding: '50px 30px' }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>{gameState.currentItem?.emoji}</div>
          <h2 style={{ ...styles.title, fontSize: '2rem' }}>{gameState.currentItem?.name}</h2>
          <p style={{ opacity: 0.6, fontStyle: 'italic', marginBottom: '40px' }}>"{gameState.currentItem?.hint}"</p>

          {!lockedIn ? (
            <form onSubmit={submitGuess} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.5rem', color: '#33ff33', fontWeight: 'bold' }}>$</span>
                <input 
                  type="number"
                  value={myGuess}
                  onChange={(e) => setMyGuess(e.target.value)}
                  placeholder="0"
                  style={styles.currencyInput}
                  autoFocus
                />
              </div>
              <button type="submit" style={{ ...styles.primaryBtn, background: '#33ff33' }}>LOCK IN</button>
            </form>
          ) : (
            <div style={{ padding: '30px', background: 'rgba(51, 255, 51, 0.1)', borderRadius: '16px', border: '1px solid rgba(51, 255, 51, 0.3)' }}>
              <h3 style={{ margin: 0, color: '#33ff33' }}>BID LOCKED: {formatCurrency(parseInt(myGuess))}</h3>
              <p style={{ opacity: 0.5, margin: '10px 0 0 0' }}>Waiting for others...</p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          {players.map(p => (
            <div key={p} style={{ ...styles.playerTag, opacity: gameState.guesses[p] !== undefined ? 1 : 0.4 }}>
              {p} {gameState.guesses[p] !== undefined ? '🔒' : '🤔'}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER: REVEAL
  // -----------------------------------------------------
  if (gameState.phase === 'reveal') {
    const actualPrice = gameState.currentItem?.price;
    const isWinnerAnnounced = gameState.roundWinners.length > 0;

    return (
      <div style={styles.container}>
        <div style={{ ...styles.glassPanel, transform: isWinnerAnnounced ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', borderColor: isWinnerAnnounced ? '#33ff33' : 'rgba(255,255,255,0.1)' }}>
          <h2 style={{ opacity: 0.6, fontSize: '1.2rem', letterSpacing: '4px' }}>ACTUAL PRICE</h2>
          
          <div style={{ 
            fontSize: '4rem', 
            fontFamily: "'Panchang', sans-serif", 
            color: '#33ff33', 
            margin: '20px 0',
            textShadow: '0 0 30px rgba(51, 255, 51, 0.5)'
          }}>
            {formatCurrency(actualPrice)}
          </div>
          
          <h3 style={{ fontSize: '1.5rem', marginBottom: '30px' }}>{gameState.currentItem?.name} {gameState.currentItem?.emoji}</h3>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }} />

          {isWinnerAnnounced ? (
            <div>
              <h3 style={{ color: '#ebd73f', letterSpacing: '2px' }}>WINNER: {gameState.roundWinners.join(', ')}!</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                {players.sort((a, b) => Math.abs((gameState.guesses[a] || 0) - actualPrice) - Math.abs((gameState.guesses[b] || 0) - actualPrice)).map((p, idx) => {
                  const guess = gameState.guesses[p] || 0;
                  const diff = guess - actualPrice;
                  const isWin = gameState.roundWinners.includes(p);
                  return (
                    <div key={p} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '300px', padding: '10px', background: isWin ? 'rgba(51, 255, 51, 0.1)' : 'transparent', borderRadius: '8px' }}>
                      <span style={{ fontWeight: isWin ? 'bold' : 'normal', color: isWin ? '#33ff33' : '#fff' }}>{p}</span>
                      <span style={{ opacity: 0.8 }}>
                        {formatCurrency(guess)}
                        <span style={{ fontSize: '0.8rem', opacity: 0.5, marginLeft: '10px', color: diff > 0 ? '#ff3366' : (diff < 0 ? '#33ccff' : '#33ff33') }}>
                          ({diff > 0 ? '+' : ''}{formatCurrency(diff)})
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p style={{ opacity: 0.5, fontStyle: 'italic', animation: 'pulse 1s infinite' }}>Calculating results...</p>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // RENDER: LEADERBOARD
  // -----------------------------------------------------
  if (gameState.phase === 'leaderboard') {
    const sortedPlayers = [...players].sort((a, b) => (gameState.scores[b] || 0) - (gameState.scores[a] || 0));
    
    return (
      <div style={styles.container}>
        <div style={styles.glassPanel}>
          <Trophy size={64} color="#ebd73f" style={{ margin: '0 auto 20px auto' }} />
          <h1 style={{ ...styles.title, color: '#ebd73f' }}>FINAL STANDINGS</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', marginTop: '30px' }}>
            {sortedPlayers.map((p, i) => (
              <div key={p} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '20px', 
                background: i === 0 ? 'rgba(235, 215, 63, 0.1)' : 'rgba(255,255,255,0.05)', 
                borderRadius: '16px', border: i === 0 ? '1px solid rgba(235, 215, 63, 0.3)' : '1px solid transparent',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: i === 0 ? '#ebd73f' : 'rgba(255,255,255,0.5)' }}>#{i+1}</span>
                  <span style={{ fontSize: '1.2rem', fontFamily: "'Panchang', sans-serif" }}>{p}</span>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{gameState.scores[p] || 0} pts</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button onClick={() => startNextRound(0)} style={{ ...styles.primaryBtn, background: '#ebd73f', marginTop: '40px' }}>
              PLAY AGAIN
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(51, 255, 51, 0.05) 0%, transparent 60%)'
  },
  glassPanel: {
    background: 'rgba(20,20,20,0.6)', padding: '50px', borderRadius: '24px', 
    width: '90%', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.8)', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  title: {
    fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', margin: '0 0 10px 0', textTransform: 'uppercase'
  },
  subtitle: {
    opacity: 0.7, fontSize: '1.1rem', marginBottom: '30px', letterSpacing: '1px'
  },
  playerList: {
    display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '40px'
  },
  playerTag: {
    padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', 
    border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.9rem', letterSpacing: '1px'
  },
  primaryBtn: {
    padding: '18px 50px', color: '#000', border: 'none', borderRadius: '40px', 
    fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Panchang', sans-serif",
    boxShadow: '0 10px 20px rgba(0,0,0,0.3)', transition: 'transform 0.2s'
  },
  headerBar: {
    position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', justifyContent: 'space-between', width: '90%', maxWidth: '800px',
    background: 'rgba(255,255,255,0.05)', padding: '15px 30px', borderRadius: '20px',
    fontFamily: "'Panchang', sans-serif", backdropFilter: 'blur(10px)'
  },
  currencyInput: {
    width: '100%', padding: '20px 20px 20px 50px', fontSize: '2rem', 
    background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(51, 255, 51, 0.3)', 
    borderRadius: '16px', color: '#fff', outline: 'none', fontFamily: "'Panchang', sans-serif",
    textAlign: 'center'
  }
};
