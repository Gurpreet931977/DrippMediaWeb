"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Coins, Map, Dice1, Play, AlertTriangle } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

const BOARD_SIZE = 24;
const STARTING_CASH = 1500;
const PASS_GO_MONEY = 200;

const TILES = [
  { id: 0, type: 'corner', name: 'GO', desc: 'Collect $200', color: '#fff' },
  { id: 1, type: 'property', name: 'Neon Alley', group: 'brown', price: 60, rent: 2, color: '#8b4513' },
  { id: 2, type: 'property', name: 'Cyber Lane', group: 'brown', price: 60, rent: 4, color: '#8b4513' },
  { id: 3, type: 'chance', name: 'CHANCE', color: '#ebd73f' },
  { id: 4, type: 'property', name: 'Data Stream', group: 'lightblue', price: 100, rent: 6, color: '#87ceeb' },
  { id: 5, type: 'property', name: 'Synthwave St', group: 'lightblue', price: 120, rent: 8, color: '#87ceeb' },
  { id: 6, type: 'corner', name: 'JAIL', desc: 'Just Visiting', color: '#ff3333' },
  { id: 7, type: 'property', name: 'Grid Plaza', group: 'pink', price: 140, rent: 10, color: '#ff1493' },
  { id: 8, type: 'property', name: 'Chrome Ave', group: 'pink', price: 160, rent: 12, color: '#ff1493' },
  { id: 9, type: 'chance', name: 'CHANCE', color: '#ebd73f' },
  { id: 10, type: 'property', name: 'Neon Strip', group: 'orange', price: 180, rent: 14, color: '#ffa500' },
  { id: 11, type: 'property', name: 'Hologram Blvd', group: 'orange', price: 200, rent: 16, color: '#ffa500' },
  { id: 12, type: 'corner', name: 'FREE PARKING', desc: 'Rest up', color: '#33ff33' },
  { id: 13, type: 'property', name: 'Silicon Valley', group: 'red', price: 220, rent: 18, color: '#ff0000' },
  { id: 14, type: 'property', name: 'Quantum Drive', group: 'red', price: 240, rent: 20, color: '#ff0000' },
  { id: 15, type: 'chance', name: 'CHANCE', color: '#ebd73f' },
  { id: 16, type: 'property', name: 'Crypto Exchange', group: 'yellow', price: 260, rent: 22, color: '#ffff00' },
  { id: 17, type: 'property', name: 'Blockchain Way', group: 'yellow', price: 280, rent: 24, color: '#ffff00' },
  { id: 18, type: 'corner', name: 'GO TO JAIL', desc: 'Busted', color: '#ff3333' },
  { id: 19, type: 'property', name: 'Orbit Ring', group: 'green', price: 300, rent: 26, color: '#008000' },
  { id: 20, type: 'property', name: 'Satellite Row', group: 'green', price: 320, rent: 28, color: '#008000' },
  { id: 21, type: 'chance', name: 'CHANCE', color: '#ebd73f' },
  { id: 22, type: 'property', name: 'Hyperloop', group: 'darkblue', price: 350, rent: 35, color: '#00008b' },
  { id: 23, type: 'property', name: 'The Core', group: 'darkblue', price: 400, rent: 50, color: '#00008b' }
];

export default function NeonBusiness({ roomCode, playerName, players, isHost, channel, playerAvatars }) {
  const [gameState, setGameState] = useState({
    status: 'lobby', // lobby, playing, game_over
    turnIndex: 0,
    playerStates: {},
    properties: {}, // map of tileId -> ownerName
    log: [],
    currentAction: null, // null or { type: 'buy', tile: 1 } etc.
    winner: null,
    diceResult: null
  });

  const [chat, setChat] = useState([]);
  const [guess, setGuess] = useState(''); // using for chat

  useEffect(() => {
    if (!channel) return;

    channel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        setGameState(payload);
      })
      .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
        setChat(prev => [...prev, payload].slice(-30));
      });
  }, [channel]);

  // Host Initial Setup
  useEffect(() => {
    if (isHost && gameState.status === 'lobby' && Object.keys(gameState.playerStates).length === 0) {
      const initialPlayerStates = {};
      players.forEach(p => {
        initialPlayerStates[p] = { cash: STARTING_CASH, position: 0, inJail: false, bankrupt: false };
      });
      const newState = {
        ...gameState,
        playerStates: initialPlayerStates
      };
      setGameState(newState);
      channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    }
  }, [isHost, gameState.status, players, channel]);

  const addLog = (msg, newState) => {
    newState.log = [...newState.log, msg].slice(-10);
  };

  const startGame = () => {
    if (!isHost) return;
    if (players.length < 2) {
      alert("At least 2 players are required to play this game!");
      return;
    }
    const newState = {
      ...gameState,
      status: 'playing',
      turnIndex: 0,
      log: ['Game started!']
    };
    setGameState(newState);
    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
  };

  const rollDice = () => {
    if (players[gameState.turnIndex] !== playerName) return;
    if (gameState.currentAction) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const total = d1 + d2;
    
    channel.send({ type: 'broadcast', event: 'player_action', payload: { action: 'roll', d1, d2 } });
  };

  useEffect(() => {
    if (isHost && channel) {
      channel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
        handleAction(payload);
      });
    }
  }, [isHost, channel, gameState]);

  const handleAction = (payload) => {
    if (!isHost) return;
    const { action } = payload;
    
    if (action === 'roll') {
      const { d1, d2 } = payload;
      const total = d1 + d2;
      const currentPlayer = players[gameState.turnIndex];
      const newState = { ...gameState, diceResult: [d1, d2] };
      const pState = { ...newState.playerStates[currentPlayer] };

      if (pState.inJail) {
        if (d1 === d2) {
          pState.inJail = false;
          addLog(`${currentPlayer} rolled doubles and escaped jail!`, newState);
        } else {
          addLog(`${currentPlayer} failed to escape jail.`, newState);
          pState.inJail = false; // Give them a pass next turn
          pState.cash -= 50; // Fine
          addLog(`${currentPlayer} paid $50 fine.`, newState);
          if (pState.cash < 0) {
              pState.bankrupt = true;
              pState.cash = 0;
              addLog(`${currentPlayer} went bankrupt!`, newState);
          }
          newState.playerStates[currentPlayer] = pState;
          endTurn(newState);
          return;
        }
      }

      const oldPos = pState.position;
      let newPos = (oldPos + total) % BOARD_SIZE;
      
      if (newPos < oldPos) {
        pState.cash += PASS_GO_MONEY;
        addLog(`${currentPlayer} passed GO, collected $200.`, newState);
      }
      pState.position = newPos;
      newState.playerStates[currentPlayer] = pState;
      
      addLog(`${currentPlayer} rolled a ${total}.`, newState);

      const tile = TILES[newPos];
      if (tile.type === 'property') {
        const owner = newState.properties[tile.id];
        if (!owner) {
          newState.currentAction = { type: 'buy', tile: tile.id, player: currentPlayer };
        } else if (owner !== currentPlayer) {
          // Pay rent
          const ownerState = { ...newState.playerStates[owner] };
          if (ownerState && !ownerState.bankrupt && !ownerState.inJail) {
              let amount = tile.rent;
              // Check for syndicate (owns both properties in group)
              const ownsAll = TILES.filter(t => t.group === tile.group).every(t => newState.properties[t.id] === owner);
              if (ownsAll) amount *= 2;
              
              if (pState.cash < amount) {
                 addLog(`${currentPlayer} went bankrupt to ${owner}!`, newState);
                 pState.bankrupt = true;
                 pState.cash = 0;
                 // Transfer properties
                 Object.keys(newState.properties).forEach(k => {
                   if (newState.properties[k] === currentPlayer) newState.properties[k] = owner;
                 });
                 endTurn(newState);
                 return;
              } else {
                 pState.cash -= amount;
                 ownerState.cash += amount;
                 newState.playerStates[owner] = ownerState;
                 addLog(`${currentPlayer} paid $${amount} rent to ${owner}.`, newState);
                 endTurn(newState);
                 return;
              }
          } else {
             endTurn(newState);
             return;
          }
        } else {
          endTurn(newState);
          return;
        }
      } else if (tile.type === 'chance') {
        const effects = [
          { msg: 'Bank error in your favor. Collect $200', val: 200 },
          { msg: 'Doctor fee. Pay $50', val: -50 },
          { msg: 'Won a hackathon! Collect $100', val: 100 },
          { msg: 'Crypto crashed. Lose $100', val: -100 }
        ];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        pState.cash += effect.val;
        addLog(`CHANCE: ${effect.msg}`, newState);
        if (pState.cash < 0) {
           pState.bankrupt = true;
           pState.cash = 0;
           addLog(`${currentPlayer} went bankrupt!`, newState);
           // Transfer properties to bank
           Object.keys(newState.properties).forEach(k => {
             if (newState.properties[k] === currentPlayer) delete newState.properties[k];
           });
        }
        newState.playerStates[currentPlayer] = pState;
        endTurn(newState);
        return;
      } else if (tile.id === 18) { // Go to Jail
        pState.position = 6;
        pState.inJail = true;
        addLog(`${currentPlayer} went to JAIL!`, newState);
        newState.playerStates[currentPlayer] = pState;
        endTurn(newState);
        return;
      } else {
        endTurn(newState);
        return;
      }
      
      setGameState(newState);
      channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    } else if (action === 'buy') {
      const { player, tileId, decision } = payload;
      const newState = { ...gameState };
      const pState = { ...newState.playerStates[player] };
      const tile = TILES.find(t => t.id === tileId);
      
      if (decision === 'yes' && pState.cash >= tile.price) {
        pState.cash -= tile.price;
        newState.properties[tileId] = player;
        addLog(`${player} bought ${tile.name}!`, newState);
      } else {
        addLog(`${player} passed on ${tile.name}.`, newState);
      }
      newState.playerStates[player] = pState;
      newState.currentAction = null;
      endTurn(newState);
    }
  };

  const endTurn = (state) => {
    state.diceResult = null;
    let nextIdx = (state.turnIndex + 1) % players.length;
    let iterations = 0;
    while (state.playerStates[players[nextIdx]]?.bankrupt && iterations < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      iterations++;
    }
    
    // Check win condition
    const activePlayers = players.filter(p => !state.playerStates[p]?.bankrupt);
    if (activePlayers.length === 1) {
       state.status = 'game_over';
       state.winner = activePlayers[0];
       addLog(`${state.winner} WINS THE GAME!`, state);
    } else {
       state.turnIndex = nextIdx;
    }
    
    setGameState(state);
    channel.send({ type: 'broadcast', event: 'sync_state', payload: state });
  };

  const handleBuyDecision = (decision) => {
    if (gameState.currentAction?.player !== playerName) return;
    channel.send({ type: 'broadcast', event: 'player_action', payload: { action: 'buy', player: playerName, tileId: gameState.currentAction.tile, decision } });
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    const msg = { sender: playerName, text: guess };
    channel.send({ type: 'broadcast', event: 'chat_msg', payload: msg });
    setChat(prev => [...prev, msg].slice(-30));
    setGuess('');
  };

  const isMyTurn = players[gameState.turnIndex] === playerName;

  // Render Grid
  // Grid maps to positions: Top row (0-6), Right col (6-12), Bottom row (12-18), Left col (18-23,0)
  const getGridArea = (id) => {
    if (id >= 0 && id <= 6) return `1 / ${id + 1} / 2 / ${id + 2}`; // Top
    if (id >= 7 && id <= 12) return `${id - 5} / 7 / ${id - 4} / 8`; // Right
    if (id >= 13 && id <= 18) return `7 / ${19 - id} / 8 / ${20 - id}`; // Bottom
    if (id >= 19 && id <= 23) return `${25 - id} / 1 / ${26 - id} / 2`; // Left
    return '1 / 1 / 2 / 2';
  };

  if (gameState.status === 'lobby') {
    return (
      <div style={styles.background}>
        <div style={{...styles.glassPanel, maxWidth: '600px', margin: '60px auto', padding: '40px'}}>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", color: '#ebd73f', textAlign: 'center', fontSize: '2rem', textShadow: '0 0 20px rgba(235,215,63,0.5)', marginBottom: '30px' }}>
            NEON BUSINESS
          </h1>
          {isHost ? (
            <button onClick={startGame} style={styles.startBtn}>
              <Play size={20} /> START GAME
            </button>
          ) : (
            <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.2rem', padding: '20px' }}>
              WAITING FOR HOST...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.background}>
      <div style={{ display: 'flex', gap: '20px', padding: '20px', height: '100vh', overflow: 'hidden' }}>
        
        {/* LEFT BAR: Log & Chat */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{...styles.glassPanel, flex: 1, display: 'flex', flexDirection: 'column'}}>
             <h3 style={styles.panelTitle}><Map size={16}/> ACTION LOG</h3>
             <div style={{flex: 1, overflowY: 'auto', padding: '10px', fontSize: '0.8rem', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '5px'}}>
               {gameState.log.map((l, i) => (
                 <div key={i} style={{ padding: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{l}</div>
               ))}
             </div>
          </div>
          <div style={{...styles.glassPanel, height: '300px', display: 'flex', flexDirection: 'column'}}>
            <h3 style={styles.panelTitle}>CHAT</h3>
            <div style={{flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {chat.map((msg, i) => (
                <div key={i} style={{ fontSize: '0.85rem' }}>
                  <span style={{ color: '#ebd73f', fontWeight: 'bold' }}>{msg.sender}: </span>
                  <span style={{ color: '#fff' }}>{msg.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} style={{ display: 'flex', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <input value={guess} onChange={e => setGuess(e.target.value)} placeholder="Chat..." style={styles.chatInput} />
            </form>
          </div>
        </div>

        {/* MIDDLE: Board */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gridTemplateRows: 'repeat(7, 1fr)', 
            gap: '5px',
            width: 'min(70vh, 70vw)',
            height: 'min(70vh, 70vw)',
            padding: '10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '16px',
            boxShadow: '0 0 50px rgba(0,0,0,0.8)'
          }}>
             {TILES.map(tile => (
               <div key={tile.id} style={{
                 gridArea: getGridArea(tile.id),
                 background: 'rgba(255,255,255,0.03)',
                 border: `2px solid ${tile.color}`,
                 borderRadius: '8px',
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 padding: '5px',
                 position: 'relative',
                 textAlign: 'center',
                 boxShadow: `inset 0 0 10px ${tile.color}40`,
                 opacity: gameState.properties[tile.id] ? 1 : 0.7
               }}>
                 {tile.type === 'property' && (
                   <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10px', background: tile.color, opacity: 0.5 }} />
                 )}
                 <div style={{ fontSize: '0.5rem', color: '#fff', fontWeight: 'bold', zIndex: 2 }}>{tile.name}</div>
                 {tile.price && <div style={{ fontSize: '0.6rem', color: '#ebd73f', zIndex: 2 }}>${tile.price}</div>}
                 
                 {/* Players on this tile */}
                 <div style={{ position: 'absolute', bottom: '2px', display: 'flex', gap: '2px', zIndex: 5 }}>
                   {players.map(p => {
                     if (gameState.playerStates[p] && gameState.playerStates[p].position === tile.id && !gameState.playerStates[p].bankrupt) {
                       return <div key={p} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 5px #fff' }} title={p} />;
                     }
                     return null;
                   })}
                 </div>
                 
                 {/* Ownership indicator */}
                 {gameState.properties[tile.id] && (
                   <div style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.4rem', background: '#33ff33', padding: '1px 3px', borderRadius: '4px', color: '#000', fontWeight: 'bold', zIndex: 5 }}>
                     {gameState.properties[tile.id].substring(0, 3)}
                   </div>
                 )}
               </div>
             ))}

             {/* Center Panel (Info & Actions) */}
             <div style={{ gridArea: '2 / 2 / 7 / 7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <h2 style={{ fontFamily: "'Panchang', sans-serif", color: '#ebd73f', fontSize: '2rem', letterSpacing: '2px', margin: '0 0 20px 0', textShadow: '0 0 10px rgba(235,215,63,0.5)' }}>NEON BUSINESS</h2>
                
                {gameState.status === 'game_over' ? (
                  <div style={{ textAlign: 'center', color: '#33ff33', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {gameState.winner} HAS WON THE GAME!
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px' }}>
                      <span style={{ color: isMyTurn ? '#33ff33' : '#ff33ff' }}>{players[gameState.turnIndex]}</span>'s Turn
                    </div>
                    
                    {gameState.currentAction && gameState.currentAction.type === 'buy' ? (
                      <div style={{ background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid #ebd73f', textAlign: 'center' }}>
                         <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Unowned Property</h4>
                         <p style={{ margin: '0 0 20px 0', color: '#ebd73f' }}>{TILES.find(t => t.id === gameState.currentAction.tile).name} - ${TILES.find(t => t.id === gameState.currentAction.tile).price}</p>
                         {gameState.currentAction.player === playerName ? (
                           <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                             <button onClick={() => handleBuyDecision('yes')} style={{ padding: '8px 20px', background: '#33ff33', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>BUY</button>
                             <button onClick={() => handleBuyDecision('no')} style={{ padding: '8px 20px', background: '#ff3333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>PASS</button>
                           </div>
                         ) : (
                           <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Waiting for {gameState.currentAction.player} to decide...</div>
                         )}
                      </div>
                    ) : (
                      isMyTurn && (
                        <button onClick={rollDice} style={{ padding: '15px 40px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '30px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 0 20px rgba(235,215,63,0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                          <Dice1 size={24} /> ROLL DICE
                        </button>
                      )
                    )}

                    {gameState.diceResult && (
                      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState.diceResult[0]}</div>
                        <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold', fontSize: '1.2rem' }}>{gameState.diceResult[1]}</div>
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>
        </div>

        {/* RIGHT BAR: Players */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
           {players.map((p, i) => {
             const state = gameState.playerStates[p];
             if (!state) return null;
             const isActive = i === gameState.turnIndex;
             const ownedProps = Object.keys(gameState.properties).filter(k => gameState.properties[k] === p);
             
             return (
               <div key={p} style={{
                 ...styles.glassPanel,
                 padding: '15px',
                 border: isActive ? '2px solid #ebd73f' : '1px solid rgba(255,255,255,0.05)',
                 background: state.bankrupt ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.03)',
                 opacity: state.bankrupt ? 0.5 : 1
               }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <CustomAvatar config={playerAvatars[p]} size={36} />
                    <div>
                      <div style={{ color: isActive ? '#ebd73f' : '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{p}</div>
                      {state.bankrupt && <div style={{ color: '#ff3333', fontSize: '0.7rem', fontWeight: 'bold' }}>BANKRUPT</div>}
                    </div>
                  </div>
                  {!state.bankrupt && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#33ff33', fontSize: '1.2rem', fontFamily: "'Panchang', sans-serif" }}>
                        <Coins size={16} /> ${state.cash}
                      </div>
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {ownedProps.map(id => (
                          <div key={id} style={{ width: '12px', height: '12px', background: TILES.find(t => t.id === parseInt(id)).color, borderRadius: '2px' }} title={TILES.find(t => t.id === parseInt(id)).name} />
                        ))}
                      </div>
                    </>
                  )}
               </div>
             );
           })}
        </div>

      </div>
    </div>
  );
}

const styles = {
  background: {
    minHeight: '100vh',
    backgroundColor: '#050505',
    backgroundImage: `
      linear-gradient(rgba(235, 215, 63, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(235, 215, 63, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    color: '#fff',
    fontFamily: "'Clash Display', sans-serif"
  },
  glassPanel: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
  },
  startBtn: {
    width: '100%',
    padding: '20px',
    background: '#ebd73f',
    color: '#000',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1.2rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'transform 0.2s',
    boxShadow: '0 0 20px rgba(235, 215, 63, 0.3)'
  },
  panelTitle: {
    margin: 0,
    padding: '15px',
    fontSize: '0.8rem',
    letterSpacing: '2px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0.7
  },
  chatInput: {
    flex: 1,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#fff',
    outline: 'none'
  }
};
