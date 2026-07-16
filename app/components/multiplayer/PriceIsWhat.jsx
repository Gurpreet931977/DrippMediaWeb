"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Clock, DollarSign, Bomb, Zap, Play, Car, Music, Gem, Monitor, Fish, Book, Apple, MapPin, Rocket, Cake, Diamond, Globe, Bone, Bird, Lock, HelpCircle, Skull, Crown, Fingerprint } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

const ITEMS = [
  { name: '1962 Ferrari 250 GTO', price: 48400000, icon: 'Car', hint: 'The holy grail of classic cars.' },
  { name: "A Single Strand of Elvis' Hair", price: 115000, icon: 'Music', hint: 'Sold at auction in 2002.' },
  { name: 'Solid Gold Toilet', price: 1250000, icon: 'Gem', hint: '18-karat gold, fully functional.' },
  { name: 'First Apple Computer (Apple I)', price: 905000, icon: 'Monitor', hint: 'Built by Wozniak in 1976.' },
  { name: 'Bluefin Tuna (278kg)', price: 3100000, icon: 'Fish', hint: 'Sold in Tokyo, 2019.' },
  { name: 'Action Comics #1 (Superman Debut)', price: 3250000, icon: 'Book', hint: 'A pristine copy sold in 2021.' },
  { name: 'A Perfect Watermelon (Densuke)', price: 6100, icon: 'Apple', hint: 'A rare black watermelon from Japan.' },
  { name: 'Parking Spot in Manhattan', price: 1000000, icon: 'MapPin', hint: 'A single spot in a luxury condo.' },
  { name: 'Crystal Piano (Heintzman)', price: 3200000, icon: 'Music', hint: 'Played at the Beijing Olympics.' },
  { name: '5-Min Trip to Space (Blue Origin)', price: 28000000, icon: 'Rocket', hint: 'The first auctioned passenger seat.' },
  { name: "Charles & Diana's Wedding Cake Slice", price: 2565, icon: 'Cake', hint: '40 years old.' },
  { name: 'Diamond Panther Bracelet', price: 7000000, icon: 'Diamond', hint: 'Owned by Wallis Simpson.' },
  { name: 'Domain Name: Business.com', price: 34500000, icon: 'Globe', hint: 'Sold in 2007.' },
  { name: 'T-Rex Skeleton (Stan)', price: 31800000, icon: 'Bone', hint: "Sold at Christie's in 2020." },
  { name: 'Pigeon (New Kim)', price: 1900000, icon: 'Bird', hint: 'A Belgian racing pigeon.' },
];

const renderIcon = (name, props = {}) => {
  switch (name) {
    case 'Car': return <Car {...props} />;
    case 'Music': return <Music {...props} />;
    case 'Gem': return <Gem {...props} />;
    case 'Monitor': return <Monitor {...props} />;
    case 'Fish': return <Fish {...props} />;
    case 'Book': return <Book {...props} />;
    case 'Apple': return <Apple {...props} />;
    case 'MapPin': return <MapPin {...props} />;
    case 'Rocket': return <Rocket {...props} />;
    case 'Cake': return <Cake {...props} />;
    case 'Diamond': return <Diamond {...props} />;
    case 'Globe': return <Globe {...props} />;
    case 'Bone': return <Bone {...props} />;
    case 'Bird': return <Bird {...props} />;
    default: return <DollarSign {...props} />;
  }
};

const MAX_ROUNDS = 5;
const BID_TIME = 15; // Fast paced!

export default function PriceIsWhat({ channel, isHost, players, playerName, playerAvatars }) {
  const [gameState, setGameState] = useState({
    phase: 'lobby', 
    round: 1,
    currentItem: null,
    guesses: {}, 
    scores: {}, 
    timeLeft: BID_TIME,
    roundWinners: [] 
  });

  const [myPrice, setMyPrice] = useState(0);
  const [isPumping, setIsPumping] = useState(false);
  const [lockedIn, setLockedIn] = useState(false);
  const [busted, setBusted] = useState(false);
  
  const timerRef = useRef(null);
  const pumpStartRef = useRef(null);
  const rafRef = useRef(null);
  const priceRef = useRef(0);

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
    channel.on('broadcast', { event: 'game_sync' }, ({ payload }) => {
      setGameState(prev => ({ ...prev, ...payload }));
      
      // Reset local inputs on new round
      if (payload.phase === 'bidding' && payload.round !== gameState.round) {
        setMyPrice(0);
        priceRef.current = 0;
        setLockedIn(false);
        setBusted(false);
        setIsPumping(false);
      }
    });
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
        
        // Auto end round if time is up
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
    
    channel.on('broadcast', { event: 'submit_guess' }, ({ payload }) => {
      const { player, amount, busted } = payload;
      setGameState(prev => {
        const newGuesses = { ...prev.guesses, [player]: { amount, busted } };
        const allGuessed = players.every(p => newGuesses[p] !== undefined);
        const nextState = { ...prev, guesses: newGuesses };
        channel.send({ type: 'broadcast', event: 'game_sync', payload: nextState });
        
        if (allGuessed && prev.phase === 'bidding') {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => handleRevealPhase(newGuesses), 500);
        }
        return nextState;
      });
    });
  }, [isHost, channel, players]);

  // Game flow controllers (Host Only)
  const startNextRound = (currentRound = 0) => {
    const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
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
        let highestValid = -1;
        let winners = [];
        
        // Find highest without busting
        players.forEach(p => {
          const guessData = latestGuesses[p];
          if (guessData && !guessData.busted) {
             const amt = guessData.amount;
             if (amt <= actualPrice) {
                 if (amt > highestValid) {
                     highestValid = amt;
                     winners = [p];
                 } else if (amt === highestValid) {
                     winners.push(p);
                 }
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
    }, 2500); // Cinematic suspense delay
  };

  // --- CLIENT PUMP LOGIC ---
  const startPump = (e) => {
    if (e.type === 'touchstart') e.preventDefault(); 
    if (lockedIn || busted || gameState.phase !== 'bidding') return;
    setIsPumping(true);
    pumpStartRef.current = Date.now();
    rafRef.current = requestAnimationFrame(pumpLoop);
  };

  const stopPump = (e) => {
    if (e?.type === 'touchend') e.preventDefault();
    if (isPumping && !busted && !lockedIn) {
       setIsPumping(false);
       setLockedIn(true);
       pumpStartRef.current = null;
       cancelAnimationFrame(rafRef.current);
       submitGuess(priceRef.current, false);
    }
  };

  const pumpLoop = () => {
    if (!pumpStartRef.current) return;
    
    const elapsed = (Date.now() - pumpStartRef.current) / 1000; // in seconds
    const actualPrice = gameState.currentItem?.price || Infinity;
    
    // Extremely smooth exponential curve
    const increment = Math.max(1, Math.pow(elapsed * 2, 4.5)) * 6; 
    let next = priceRef.current + increment;
    
    if (next > actualPrice) {
       next = actualPrice + (increment * 2); // Show them they blew past it
       priceRef.current = next;
       setMyPrice(next);
       handleBust();
       return; 
    }
    
    priceRef.current = next;
    setMyPrice(next);
    rafRef.current = requestAnimationFrame(pumpLoop);
  };

  const handleBust = () => {
     setIsPumping(false);
     setBusted(true);
     setLockedIn(true); 
     pumpStartRef.current = null;
     cancelAnimationFrame(rafRef.current);
     submitGuess(0, true);
  };

  const submitGuess = (amount, isBust) => {
    if (isHost) {
      setGameState(prev => {
        const newGuesses = { ...prev.guesses, [playerName]: { amount, busted: isBust } };
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
      channel.send({ type: 'broadcast', event: 'submit_guess', payload: { player: playerName, amount, busted: isBust } });
    }
  };

  useEffect(() => {
     return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
     }
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  };

  // -----------------------------------------------------
  // RENDER: LOBBY
  // -----------------------------------------------------
  if (gameState.phase === 'lobby') {
    return (
      <div className="no-global-scale" style={styles.container}>
        <div style={styles.premiumPanel}>
          <div style={{ ...styles.iconGlowBox, color: '#e0c05c', boxShadow: '0 0 50px rgba(224, 192, 92, 0.3)' }}>
            <Crown size={64} />
          </div>
          <h1 style={{ ...styles.title, color: '#e0c05c', marginTop: '20px' }}>PRICE PUMP</h1>
          <p style={styles.subtitle}>Welcome to the high-roller auction. Hold the button to pump your price. Release before you exceed the actual value, or you <strong style={{color:'#ff3366'}}>BUST</strong>.</p>
          
          <div style={styles.playerList}>
            {players.map((p, i) => (
              <div key={i} style={styles.playerTag}>
                <CustomAvatar config={playerAvatars && playerAvatars[p]} size={24} />
                <span style={{ fontWeight: 500 }}>{p}</span>
              </div>
            ))}
          </div>
          
          {isHost ? (
            <button onClick={() => startNextRound(0)} style={styles.primaryBtn}>
              ENTER AUCTION
            </button>
          ) : (
            <p style={{ opacity: 0.5, fontStyle: 'italic', letterSpacing: '2px' }}>Awaiting Host...</p>
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
      <div className="no-global-scale" style={{...styles.container, background: busted ? '#1a0000' : (isPumping ? '#0d120a' : '#050505'), transition: 'background 0.3s ease'}}>
        
        {/* Top Header */}
        <div style={styles.headerBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
             <span style={{ opacity: 0.5, letterSpacing: '3px', fontSize: '0.9rem' }}>AUCTION</span>
             <span style={{ fontWeight: 'bold', color: '#e0c05c' }}>{gameState.round} / {MAX_ROUNDS}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: gameState.timeLeft <= 5 ? '#ff3366' : '#fff', opacity: gameState.timeLeft <= 5 ? 1 : 0.8 }}>
            <Clock size={20} /> <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 'bold' }}>00:{gameState.timeLeft.toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Center Stage */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, width: '100%', padding: '20px' }}>
            
            <div style={{ ...styles.iconGlowBox, color: '#e0c05c', transform: 'scale(0.8)', marginBottom: '10px' }}>
               {gameState.currentItem?.icon && renderIcon(gameState.currentItem.icon, { size: 40 })}
            </div>
            <h2 style={{ ...styles.title, fontSize: '2rem', textAlign: 'center', color: '#fff', letterSpacing: '2px' }}>{gameState.currentItem?.name}</h2>
            <p style={{ opacity: 0.5, fontStyle: 'italic', marginBottom: '40px', textAlign: 'center', fontSize: '1.1rem' }}>"{gameState.currentItem?.hint}"</p>

            {/* The Counter */}
            <div style={{
               background: busted ? 'rgba(255, 51, 102, 0.1)' : (lockedIn ? 'rgba(51, 255, 153, 0.1)' : 'rgba(255, 255, 255, 0.02)'),
               border: `1px solid ${busted ? 'rgba(255, 51, 102, 0.4)' : (lockedIn ? 'rgba(51, 255, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)')}`,
               borderRadius: '30px', padding: '20px 50px', marginBottom: '50px',
               boxShadow: isPumping ? '0 30px 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(224, 192, 92, 0.1)' : '0 20px 40px rgba(0,0,0,0.5)',
               transform: isPumping ? 'scale(1.02) translateY(-5px)' : (busted ? 'scale(0.95)' : 'scale(1)'),
               transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
               backdropFilter: 'blur(10px)'
            }}>
               <h1 style={{ 
                  margin: 0, fontSize: '4.5rem', fontFamily: "'Panchang', sans-serif", 
                  color: busted ? '#ff3366' : (lockedIn ? '#33ff99' : '#e0c05c'),
                  textShadow: busted ? '0 0 30px rgba(255, 51, 102, 0.5)' : (lockedIn ? '0 0 30px rgba(51, 255, 153, 0.5)' : (isPumping ? '0 0 20px rgba(224, 192, 92, 0.4)' : 'none')),
                  filter: (isPumping && !busted) ? 'blur(0.5px)' : 'none'
               }}>
                  {busted ? 'BUSTED' : formatCurrency(myPrice)}
               </h1>
            </div>

            {/* The Button */}
            <button 
               onMouseDown={startPump}
               onMouseUp={stopPump}
               onMouseLeave={stopPump}
               onTouchStart={startPump}
               onTouchEnd={stopPump}
               disabled={lockedIn || busted}
               style={{
                  ...styles.pumpBtn,
                  background: busted ? '#1a0d0d' : (lockedIn ? '#0d1a12' : (isPumping ? 'linear-gradient(135deg, #e0c05c, #d4af37)' : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)')),
                  color: busted ? '#ff3366' : (lockedIn ? '#33ff99' : (isPumping ? '#000' : '#e0c05c')),
                  border: `1px solid ${busted ? '#ff3366' : (lockedIn ? '#33ff99' : (isPumping ? 'transparent' : 'rgba(224, 192, 92, 0.3)'))}`,
                  boxShadow: (isPumping && !busted) ? '0 0 80px rgba(224, 192, 92, 0.5), inset 0 0 20px rgba(255,255,255,0.8)' : '0 20px 40px rgba(0,0,0,0.4)',
                  transform: isPumping ? 'scale(0.95)' : 'scale(1)',
                  cursor: (lockedIn || busted) ? 'not-allowed' : 'pointer'
               }}
            >
               {busted ? <Skull size={40} /> : (lockedIn ? <Lock size={40} /> : (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                   <Fingerprint size={32} /> <span>{isPumping ? 'PUMPING...' : 'HOLD'}</span>
                 </div>
               ))}
            </button>
        </div>
        
        {/* Opponent Status Bar */}
        <div style={{ display: 'flex', gap: '15px', padding: '30px 20px', width: '100%', justifyContent: 'center', flexWrap: 'wrap', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
          {players.map(p => {
             const g = gameState.guesses[p];
             let statusColor = 'rgba(255,255,255,0.3)';
             let statusBg = 'transparent';
             let statusIcon = <HelpCircle size={16} />;
             if (g) {
                if (g.busted) { statusColor = '#ff3366'; statusBg = 'rgba(255, 51, 102, 0.1)'; statusIcon = <Skull size={16} />; }
                else { statusColor = '#33ff99'; statusBg = 'rgba(51, 255, 153, 0.1)'; statusIcon = <Lock size={16} />; }
             }
             return (
               <div key={p} style={{ ...styles.playerTag, borderColor: statusColor, background: statusBg, display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <CustomAvatar config={playerAvatars && playerAvatars[p]} size={24} />
                 <span style={{ color: statusColor, fontWeight: g ? 'bold' : 'normal', opacity: g ? 1 : 0.7 }}>{p}</span>
                 <span style={{ color: statusColor }}>{statusIcon}</span>
               </div>
             )
          })}
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
      <div className="no-global-scale" style={styles.container}>
        <div style={{ 
          ...styles.premiumPanel, 
          width: '100%', maxWidth: '800px', 
          transform: isWinnerAnnounced ? 'scale(1.02)' : 'scale(1)', 
          transition: 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)', 
          borderColor: isWinnerAnnounced ? 'rgba(224, 192, 92, 0.4)' : 'rgba(255,255,255,0.05)',
          boxShadow: isWinnerAnnounced ? '0 40px 100px rgba(224, 192, 92, 0.15)' : '0 30px 60px rgba(0,0,0,0.8)'
        }}>
          
          <h2 style={{ opacity: 0.4, fontSize: '1rem', letterSpacing: '6px', textTransform: 'uppercase' }}>APPRAISED VALUE</h2>
          
          <div style={{ 
            fontSize: '5rem', 
            fontFamily: "'Panchang', sans-serif", 
            color: '#fff', 
            margin: '20px 0',
            textShadow: '0 0 40px rgba(255,255,255,0.3)',
            background: 'linear-gradient(to bottom, #ffffff, #aaaaaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {formatCurrency(actualPrice)}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', opacity: 0.7, marginBottom: '30px' }}>
            {gameState.currentItem?.icon && renderIcon(gameState.currentItem.icon, { size: 20 })}
            <span style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>{gameState.currentItem?.name}</span>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', margin: '30px 0' }} />

          {isWinnerAnnounced ? (
            <div style={{ width: '100%', animation: 'fadeInUp 0.5s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                {gameState.roundWinners.length > 0 ? (
                  <div style={{ background: 'linear-gradient(90deg, rgba(224, 192, 92, 0), rgba(224, 192, 92, 0.1), rgba(224, 192, 92, 0))', padding: '10px 40px', color: '#e0c05c', letterSpacing: '4px', fontWeight: 'bold' }}>
                    WINNER: {gameState.roundWinners.join(', ')}
                  </div>
                ) : (
                  <div style={{ background: 'linear-gradient(90deg, rgba(255, 51, 102, 0), rgba(255, 51, 102, 0.1), rgba(255, 51, 102, 0))', padding: '10px 40px', color: '#ff3366', letterSpacing: '4px', fontWeight: 'bold' }}>
                    EVERYONE BUSTED
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', alignItems: 'center', width: '100%' }}>
                {players.sort((a, b) => {
                   const gA = gameState.guesses[a];
                   const gB = gameState.guesses[b];
                   if (!gA && !gB) return 0;
                   if (!gA) return 1;
                   if (!gB) return -1;
                   if (gA.busted && !gB.busted) return 1;
                   if (!gA.busted && gB.busted) return -1;
                   return gB.amount - gA.amount;
                }).map((p) => {
                  const guess = gameState.guesses[p];
                  if (!guess) return null;
                  
                  const isWin = gameState.roundWinners.includes(p);
                  const isBust = guess.busted;

                  return (
                    <div key={p} style={{ 
                       display: 'flex', justifyContent: 'space-between', padding: '15px 25px', width: '100%', maxWidth: '500px',
                       background: isWin ? 'rgba(224, 192, 92, 0.1)' : (isBust ? 'rgba(255, 51, 102, 0.05)' : 'rgba(255,255,255,0.02)'), 
                       borderRadius: '16px', alignItems: 'center',
                       border: `1px solid ${isWin ? 'rgba(224, 192, 92, 0.3)' : (isBust ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255,255,255,0.05)')}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CustomAvatar config={playerAvatars && playerAvatars[p]} size={32} />
                        <span style={{ fontWeight: isWin ? 'bold' : 'normal', color: isWin ? '#e0c05c' : (isBust ? '#ff3366' : '#fff'), fontSize: '1.1rem' }}>
                          {p}
                        </span>
                      </div>
                      <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: isBust ? '#ff3366' : '#fff' }}>
                        {isBust ? 'BUSTED 💥' : formatCurrency(guess.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p style={{ opacity: 0.3, fontStyle: 'italic', animation: 'pulse 1.5s infinite', letterSpacing: '2px' }}>Computing valuations...</p>
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
      <div className="no-global-scale" style={styles.container}>
        <div style={styles.premiumPanel}>
          <div style={{ ...styles.iconGlowBox, color: '#e0c05c', boxShadow: '0 0 50px rgba(224, 192, 92, 0.3)', marginBottom: '30px' }}>
            <Trophy size={64} />
          </div>
          <h1 style={{ ...styles.title, color: '#e0c05c' }}>AUCTION RESULTS</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', marginTop: '40px' }}>
            {sortedPlayers.map((p, i) => (
              <div key={p} style={{ 
                display: 'flex', justifyContent: 'space-between', padding: '25px', 
                background: i === 0 ? 'linear-gradient(to right, rgba(224, 192, 92, 0.1), rgba(224, 192, 92, 0.02))' : 'rgba(255,255,255,0.02)', 
                borderRadius: '20px', border: i === 0 ? '1px solid rgba(224, 192, 92, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: i === 0 ? '#e0c05c' : 'rgba(255,255,255,0.2)', width: '30px' }}>#{i+1}</span>
                  <CustomAvatar config={playerAvatars && playerAvatars[p]} size={40} />
                  <span style={{ fontSize: '1.3rem', fontFamily: "'Panchang', sans-serif" }}>{p}</span>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{formatCurrency(gameState.scores[p] || 0)}</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button onClick={() => startNextRound(0)} style={{ ...styles.primaryBtn, marginTop: '50px' }}>
              NEW AUCTION
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
    height: '100%', width: '100%', backgroundColor: '#050505', color: '#fff', fontFamily: "'Clash Display', sans-serif",
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(224, 192, 92, 0.08) 0%, transparent 70%)',
    overflow: 'hidden'
  },
  premiumPanel: {
    background: 'rgba(10, 10, 10, 0.7)', padding: '60px', borderRadius: '32px', 
    width: '90%', maxWidth: '700px', border: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
  },
  iconGlowBox: {
    width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(224, 192, 92, 0.2), rgba(0,0,0,0))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(224, 192, 92, 0.3)'
  },
  title: {
    fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', margin: '0 0 15px 0', letterSpacing: '2px'
  },
  subtitle: {
    opacity: 0.6, fontSize: '1.1rem', marginBottom: '40px', letterSpacing: '1px', lineHeight: '1.6'
  },
  playerList: {
    display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '50px'
  },
  playerTag: {
    padding: '10px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '30px', 
    border: '1px solid rgba(255,255,255,0.08)', fontSize: '1rem', letterSpacing: '1px',
    display: 'flex', alignItems: 'center', gap: '10px'
  },
  primaryBtn: {
    padding: '20px 60px', color: '#000', border: 'none', borderRadius: '50px', 
    fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Panchang', sans-serif",
    background: 'linear-gradient(135deg, #e0c05c, #d4af37)',
    boxShadow: '0 15px 30px rgba(224, 192, 92, 0.2), inset 0 2px 0 rgba(255,255,255,0.4)',
    transition: 'all 0.2s', letterSpacing: '2px'
  },
  pumpBtn: {
    padding: '30px 80px', borderRadius: '80px', border: 'none',
    fontSize: '2.5rem', fontFamily: "'Panchang', sans-serif", fontWeight: 'bold',
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    letterSpacing: '3px'
  },
  headerBar: {
    position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', justifyContent: 'space-between', width: '90%', maxWidth: '1000px',
    background: 'rgba(10,10,10,0.6)', padding: '15px 40px', borderRadius: '30px',
    fontFamily: "'Panchang', sans-serif", backdropFilter: 'blur(20px)', zIndex: 10,
    border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
  }
};
