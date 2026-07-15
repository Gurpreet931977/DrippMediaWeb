"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Eraser, Users, Clock, Trophy, PartyPopper, Settings, Bot, Undo2, Redo2, Trash2 } from 'lucide-react';
import CustomAvatar from './CustomAvatar';

const DEFAULT_WORDS = [
  "SUN", "MOON", "STAR", "TREE", "CAR", "HOUSE", "APPLE", "BALL", "BOOK", "SHOE",
  "CHAIR", "TABLE", "DOOR", "CUP", "PEN", "CLOCK", "BED", "HAT", "RING", "KEYS"
];

const ANIMAL_WORDS = [
  "CAT", "DOG", "FISH", "BIRD", "BEAR", "LION", "TIGER", "PIG", "COW", "HORSE",
  "MOUSE", "DUCK", "FROG", "SNAKE", "MONKEY", "ELEPHANT", "ZEBRA", "RABBIT", "DEER"
];

const TECH_WORDS = [
  "PHONE", "COMPUTER", "LAPTOP", "MOUSE", "KEYBOARD", "SCREEN", "ROBOT", "BATTERY",
  "HEADPHONES", "CAMERA", "TV", "WATCH", "DRONE", "SPEAKER", "RADIO", "WIFI"
];

const FOOD_WORDS = [
  "PIZZA", "BURGER", "FRIES", "TACO", "CAKE", "ICE CREAM", "COOKIE", "DONUT",
  "APPLE", "BANANA", "GRAPES", "CHEESE", "BREAD", "EGG", "SOUP", "SALAD"
];

const HARDCORE_WORDS = [
  "ASTRONAUT", "LUMBERJACK", "CHANDELIER", "METRONOME", "TREADMILL", 
  "ZEPPELIN", "MICROSCOPE", "ORCHESTRA", "PHARAOH", "SYRINGE",
  "PLATYPUS", "SPHINX", "THERMOMETER", "ACCORDION", "SUBMARINE"
];

const WORD_PACKS = {
  'Default': DEFAULT_WORDS,
  'Animals': ANIMAL_WORDS,
  'Technology': TECH_WORDS,
  'Food': FOOD_WORDS
};

export default function DumbDoodles({ channel, isHost, players, playerName, playerAvatars = {} }) {
  const [gameState, setGameState] = useState({
    status: 'lobby', // lobby, choosing_word, playing, round_over, gameover
    currentTurnIndex: 0,
    currentRound: 1,
    currentWord: '',
    wordChoices: [],
    timer: 60,
    scores: {},
    config: { 
      maxPlayers: 8,
      language: 'English',
      rounds: 3, 
      drawTime: 60, 
      gameMode: 'Normal',
      wordCount: 3,
      hints: 0,
      customWordsOnly: false,
      wordPack: 'Default',
      customWords: '',
      fadingInk: false
    },
    guessedPlayers: [],
    revealedIndices: []
  });

  const [chat, setChat] = useState([]);
  const [guess, setGuess] = useState('');
  const [brushColor, setBrushColor] = useState('#ff33ff');
  const [brushSize, setBrushSize] = useState(6);
  const [brushStyle, setBrushStyle] = useState('Neon');
  
  const [isMobile, setIsMobile] = useState(false);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const ctxRef = useRef(null);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const pendingDrawEventsRef = useRef([]);
  const allLinesRef = useRef([]);
  const redoStackRef = useRef([]);
  const currentStrokeRef = useRef([]);
  const chatEndRef = useRef(null);
  const timerRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 800);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  // Handle Incoming Broadcasts
  useEffect(() => {
    if (!channel) return;

    channel
      .on('broadcast', { event: 'sync_state' }, ({ payload }) => {
        setGameState(payload);
      })
      .on('broadcast', { event: 'chat_msg' }, ({ payload }) => {
        setChat(prev => [...prev, payload].slice(-30));
      })
      .on('broadcast', { event: 'draw_batch' }, ({ payload }) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        payload.forEach(line => {
          ctx.beginPath();
          ctx.moveTo(line.x0, line.y0);
          ctx.lineTo(line.x1, line.y1);
          ctx.strokeStyle = line.color || '#ff33ff';
          ctx.lineWidth = line.size || 6;
          ctx.lineCap = line.style === 'Marker' ? 'square' : 'round';
          ctx.lineJoin = 'round';
          
          if (line.style === 'Solid') {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          } else if (line.style === 'Marker') {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.5;
          } else if (line.style === 'Crayon') {
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.globalAlpha = 0.8;
          } else if (line.style === 'Glow') {
            ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 25;
            ctx.globalAlpha = 1;
          } else { // Neon
            ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 10;
            ctx.globalAlpha = 1;
          }
          if (line.style !== 'Crayon') {
             ctx.shadowColor = line.color === '#0a0a0a' ? 'transparent' : (line.color || '#ff33ff');
          }
          
          ctx.stroke();
          ctx.globalAlpha = 1; // reset
        });
      })
      .on('broadcast', { event: 'sync_history' }, ({ payload }) => {
         allLinesRef.current = payload;
         const ctx = ctxRef.current;
         const canvas = canvasRef.current;
         if (!ctx || !canvas) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         payload.forEach(stroke => {
           stroke.forEach(line => {
             ctx.beginPath();
             ctx.moveTo(line.x0, line.y0);
             ctx.lineTo(line.x1, line.y1);
             ctx.strokeStyle = line.color || '#ff33ff';
             ctx.lineWidth = line.size || 6;
             ctx.lineCap = line.style === 'Marker' ? 'square' : 'round';
             ctx.lineJoin = 'round';
             
             if (line.style === 'Solid') {
               ctx.shadowBlur = 0;
               ctx.globalAlpha = 1;
             } else if (line.style === 'Marker') {
               ctx.shadowBlur = 0;
               ctx.globalAlpha = 0.5;
             } else if (line.style === 'Crayon') {
               ctx.shadowBlur = 2;
               ctx.shadowColor = 'rgba(0,0,0,0.5)';
               ctx.globalAlpha = 0.8;
             } else if (line.style === 'Glow') {
               ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 25;
               ctx.globalAlpha = 1;
             } else {
               ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 10;
               ctx.globalAlpha = 1;
             }
             if (line.style !== 'Crayon') {
                ctx.shadowColor = line.color === '#0a0a0a' ? 'transparent' : (line.color || '#ff33ff');
             }
             ctx.stroke();
             ctx.globalAlpha = 1;
           });
         });
      })
      .on('broadcast', { event: 'clear_canvas' }, () => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
        allLinesRef.current = [];
      });
  }, [channel]);

  // Host Initial Setup (Scores & Avatars)
  useEffect(() => {
    if (isHost && gameState.status === 'lobby' && Object.keys(gameState.scores).length === 0) {
      const initialScores = {};
      players.forEach(p => {
        initialScores[p] = 0;
      });
      
      const initialState = {
        ...gameState,
        scores: initialScores
      };

      channel.send({ type: 'broadcast', event: 'sync_state', payload: initialState });
      setGameState(initialState);
    }
  }, [isHost, players]);

  const updateConfig = (key, value) => {
    if (!isHost) return;
    const newState = {
      ...gameState,
      config: {
        ...gameState.config,
        [key]: value
      }
    };
    setGameState(newState);
    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
  };

  const getWordPool = (config) => {
    const custom = config.customWords.split(',').map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
    if (config.customWordsOnly) {
      return custom.length >= config.wordCount ? custom : (custom.length > 0 ? custom : WORD_PACKS['Default']);
    }
    if (config.gameMode === 'No Mercy') {
      return [...custom, ...HARDCORE_WORDS];
    }
    const pack = WORD_PACKS[config.wordPack] || WORD_PACKS['Default'];
    return [...custom, ...pack];
  };

  const generateWordChoices = (config) => {
    const pool = getWordPool(config);
    const choices = [];
    while(choices.length < config.wordCount && choices.length < pool.length) {
      const w = pool[Math.floor(Math.random() * pool.length)];
      if(!choices.includes(w)) choices.push(w);
    }
    if (choices.length === 0) choices.push("DEFAULT");
    return choices;
  };

  const startRound = (config = gameState.config, currentRound = 1, currentTurnIndex = 0, scores = gameState.scores) => {
    const choices = generateWordChoices(config);
    const newState = {
      ...gameState,
      status: 'choosing_word',
      config,
      currentRound,
      currentTurnIndex,
      wordChoices: choices,
      currentWord: '',
      guessedPlayers: [],
      revealedIndices: [],
      timer: 15, // 15s to choose a word
      scores
    };
    channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState);
  };

  // Timer Logic (Host Only)
  useEffect(() => {
    if (!isHost) return;

    if (timerRef.current) clearInterval(timerRef.current);

    if (gameState.status === 'choosing_word' || gameState.status === 'playing' || gameState.status === 'round_over') {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          const newTimer = prev.timer - 1;
          
          if (newTimer <= 0) {
            // Time is up for current phase
            if (prev.status === 'choosing_word') {
              // Auto-pick a word
              const autoWord = prev.wordChoices[0];
              const actualDrawTime = prev.config.gameMode === 'No Mercy' ? Math.min(30, prev.config.drawTime) : prev.config.drawTime;
              const newState = {
                ...prev,
                status: 'playing',
                currentWord: autoWord,
                timer: actualDrawTime,
                revealedIndices: []
              };
              channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
              return newState;
            } 
            else if (prev.status === 'playing') {
              // End turn
              const newState = {
                ...prev,
                status: 'round_over',
                timer: 5 // 5 seconds to show the word and scores
              };
              channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
              return newState;
            }
            else if (prev.status === 'round_over') {
              // Move to next player or next round
              let nextTurnIndex = prev.currentTurnIndex + 1;
              let nextRound = prev.currentRound;
              let nextStatus = 'choosing_word';
              
              if (nextTurnIndex >= players.length) {
                nextTurnIndex = 0;
                nextRound += 1;
                if (nextRound > prev.config.rounds) {
                  nextStatus = 'gameover';
                }
              }

              if (nextStatus === 'gameover') {
                const newState = { ...prev, status: 'gameover' };
                channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
                return newState;
              } else {
                const choices = generateWordChoices(prev.config);
                const newState = {
                  ...prev,
                  status: 'choosing_word',
                  currentRound: nextRound,
                  currentTurnIndex: nextTurnIndex,
                  wordChoices: choices,
                  currentWord: '',
                  guessedPlayers: [],
                  revealedIndices: [],
                  timer: 15
                };
                channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
                channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
                return newState;
              }
            }
          }
          
          let newRevealedIndices = [...prev.revealedIndices];
          if (prev.status === 'playing' && prev.config.hints > 0) {
            const actualDrawTime = prev.config.gameMode === 'No Mercy' ? Math.min(30, prev.config.drawTime) : prev.config.drawTime;
            const timePassed = actualDrawTime - newTimer;
            const hintInterval = Math.floor(actualDrawTime / (prev.config.hints + 1));
            const expectedHints = Math.min(prev.config.hints, Math.floor(timePassed / hintInterval));
            
            if (expectedHints > prev.revealedIndices.length) {
                 let availableIndices = [];
                 for(let i=0; i<prev.currentWord.length; i++) {
                   if (prev.currentWord[i] !== ' ' && !prev.revealedIndices.includes(i)) availableIndices.push(i);
                 }
                 if (availableIndices.length > 0) {
                    const randomIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                    newRevealedIndices.push(randomIdx);
                 }
            }
          }
          
          const newState = { ...prev, timer: newTimer, revealedIndices: newRevealedIndices };
          channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
          return newState;
        });
      }, 1000);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isHost, gameState.status, players, channel]);

  // Check if all players guessed correctly
  useEffect(() => {
    if (isHost && gameState.status === 'playing') {
      const nonDrawers = players.length - 1;
      if (gameState.guessedPlayers.length >= nonDrawers && nonDrawers > 0) {
        // Everyone guessed! End the round early.
        const newState = {
          ...gameState,
          status: 'round_over',
          timer: 5
        };
        channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
        setGameState(newState);
      }
    }
  }, [isHost, gameState.guessedPlayers, gameState.status, players]);


  // Canvas Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
    }
  }, [gameState.status]);

  // Broadcast Draw Batching Loop (throttled)
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingDrawEventsRef.current.length > 0) {
        channel.send({ 
          type: 'broadcast', 
          event: 'draw_batch', 
          payload: pendingDrawEventsRef.current 
        });
        pendingDrawEventsRef.current = [];
      }
    }, 40);
    return () => clearInterval(interval);
  }, [channel]);

  // Fading Ink Effect
  useEffect(() => {
    if (gameState.status !== 'playing' || !gameState.config.fadingInk) return;
    
    const fadeInterval = setInterval(() => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, 150);

    return () => clearInterval(fadeInterval);
  }, [gameState.status, gameState.config.fadingInk]);

  const isMyTurn = players[gameState.currentTurnIndex] === playerName;

  // Drawing Handlers
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!isMyTurn || gameState.status !== 'playing') return;
    isDrawingRef.current = true;
    lastPosRef.current = getMousePos(e);
    currentStrokeRef.current = [];
    redoStackRef.current = [];
  };

  const draw = (e) => {
    if (!isMyTurn || !isDrawingRef.current || gameState.status !== 'playing') return;
    
    const currentPos = getMousePos(e);
    const ctx = ctxRef.current;
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = brushStyle === 'Marker' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      
      if (brushStyle === 'Solid') {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      } else if (brushStyle === 'Marker') {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
      } else if (brushStyle === 'Crayon') {
        ctx.shadowBlur = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.globalAlpha = 0.8;
      } else if (brushStyle === 'Glow') {
        ctx.shadowBlur = brushColor === '#0a0a0a' ? 0 : 25;
        ctx.globalAlpha = 1;
      } else { // Neon
        ctx.shadowBlur = brushColor === '#0a0a0a' ? 0 : 10;
        ctx.globalAlpha = 1;
      }
      if (brushStyle !== 'Crayon') {
         ctx.shadowColor = brushColor === '#0a0a0a' ? 'transparent' : brushColor;
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1; // reset
      
      const lineEvent = {
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: currentPos.x, y1: currentPos.y,
        color: brushColor, size: brushSize, style: brushStyle
      };
      pendingDrawEventsRef.current.push(lineEvent);
      currentStrokeRef.current.push(lineEvent);
    }
    lastPosRef.current = currentPos;
  };

  const stopDrawing = () => { 
    isDrawingRef.current = false; 
    if (currentStrokeRef.current.length > 0) {
      allLinesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
    }
  };

  const redrawCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    allLinesRef.current.forEach(stroke => {
      stroke.forEach(line => {
          ctx.beginPath();
          ctx.moveTo(line.x0, line.y0);
          ctx.lineTo(line.x1, line.y1);
          ctx.strokeStyle = line.color || '#ff33ff';
          ctx.lineWidth = line.size || 6;
          ctx.lineCap = line.style === 'Marker' ? 'square' : 'round';
          ctx.lineJoin = 'round';
          
          if (line.style === 'Solid') {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
          } else if (line.style === 'Marker') {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.5;
          } else if (line.style === 'Crayon') {
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.globalAlpha = 0.8;
          } else if (line.style === 'Glow') {
            ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 25;
            ctx.globalAlpha = 1;
          } else {
            ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 10;
            ctx.globalAlpha = 1;
          }
          if (line.style !== 'Crayon') {
             ctx.shadowColor = line.color === '#0a0a0a' ? 'transparent' : (line.color || '#ff33ff');
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
      });
    });
  };

  const undo = () => {
    if (!isMyTurn || allLinesRef.current.length === 0) return;
    redoStackRef.current.push(allLinesRef.current.pop());
    redrawCanvas();
    channel.send({ type: 'broadcast', event: 'sync_history', payload: allLinesRef.current });
  };

  const redo = () => {
    if (!isMyTurn || redoStackRef.current.length === 0) return;
    allLinesRef.current.push(redoStackRef.current.pop());
    redrawCanvas();
    channel.send({ type: 'broadcast', event: 'sync_history', payload: allLinesRef.current });
  };

  const clearCanvas = () => {
    if (!isMyTurn) return;
    allLinesRef.current = [];
    redoStackRef.current = [];
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        channel.send({ type: 'broadcast', event: 'clear_canvas', payload: {} });
    }
  }

  // Word Selection
  const handleSelectWord = (word) => {
    if (!isMyTurn || !isHost) {
      channel.send({ type: 'broadcast', event: 'select_word', payload: word });
      return;
    }
    // Host selection logic
    const actualDrawTime = gameState.config.gameMode === 'No Mercy' ? Math.min(30, gameState.config.drawTime) : gameState.config.drawTime;
    const newState = {
      ...gameState,
      status: 'playing',
      currentWord: word,
      timer: actualDrawTime,
      revealedIndices: []
    };
    channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
    setGameState(newState);
  };

  useEffect(() => {
    if (isHost) {
      channel.on('broadcast', { event: 'select_word' }, ({ payload }) => {
        if (gameState.status === 'choosing_word') {
          const actualDrawTime = gameState.config.gameMode === 'No Mercy' ? Math.min(30, gameState.config.drawTime) : gameState.config.drawTime;
          const newState = {
            ...gameState,
            status: 'playing',
            currentWord: payload,
            timer: actualDrawTime,
            revealedIndices: []
          };
          channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
          setGameState(newState);
        }
      });
    }
  }, [isHost, channel, gameState]);


  // Chat Handlers
  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim() || gameState.status !== 'playing') return;
    const msg = guess.toUpperCase();
    
    // Check if player already guessed correctly
    if (gameState.guessedPlayers.includes(playerName)) {
      setGuess('');
      return;
    }

    const isDrawerCheat = isMyTurn && msg.includes(gameState.currentWord);
    const isBegging = !isMyTurn && (msg.includes('WHAT IS') || msg.includes("WHAT'S") || msg.includes('TELL ME') || msg.includes('WHATS THE WORD') || msg.includes('PLZ TELL'));

    if (isDrawerCheat) {
      const drawerMessages = [
        "Nice try, drawer! Draw it, don't say it!",
        "Caught in 4K trying to type the word.",
        "Don't cheat you dumb drawer!",
        "Silence! A true artist speaks only in lines.",
        "Bro really thought they could just type the answer 💀"
      ];
      const randomMsg = drawerMessages[Math.floor(Math.random() * drawerMessages.length)];
      const botMsg = { sender: 'Orlo', text: randomMsg, type: 'error' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: botMsg });
      setChat(prev => [...prev, botMsg].slice(-30));
      setGuess('');
      return;
    }

    if (isBegging) {
      const beggingMessages = [
        "No begging allowed! Figure it out yourself.",
        "Begging for the word? That's a yikes from me.",
        "Use your brain, not your keyboard!",
        "Stop asking and start guessing!",
        "I'm not telling you the word, try actually looking at the drawing."
      ];
      const randomMsg = beggingMessages[Math.floor(Math.random() * beggingMessages.length)];
      const botMsg = { sender: 'Orlo', text: randomMsg, type: 'error' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: botMsg });
      setChat(prev => [...prev, botMsg].slice(-30));
      setGuess('');
      return;
    }

    if (!isMyTurn && msg === gameState.currentWord) {
      const sysMsg = { sender: 'SYSTEM', text: `${playerName} guessed the word!`, type: 'success' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: sysMsg });
      setChat(prev => [...prev, sysMsg].slice(-30));
      
      if (isHost) {
         setGameState(prev => {
            const newScores = { ...prev.scores };
            // Score based on how fast they guessed
            const actualDrawTime = prev.config.gameMode === 'No Mercy' ? Math.min(30, prev.config.drawTime) : prev.config.drawTime;
            const timeBonus = Math.floor((prev.timer / actualDrawTime) * 200);
            newScores[playerName] = (newScores[playerName] || 0) + 100 + timeBonus;
            
            // Drawer gets points for each person who guesses
            const drawer = players[prev.currentTurnIndex];
            newScores[drawer] = (newScores[drawer] || 0) + 50;

            const newGuessedPlayers = [...prev.guessedPlayers, playerName];
            
            const newState = {
              ...prev,
              scores: newScores,
              guessedPlayers: newGuessedPlayers
            };
            channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
            return newState;
         });
      } else {
        channel.send({ type: 'broadcast', event: 'correct_guess', payload: playerName });
      }
    } else {
      const chatMsg = { sender: playerName, text: guess, type: 'normal' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: chatMsg });
      setChat(prev => [...prev, chatMsg].slice(-30));
      
      // No Mercy penalty
      if (gameState.config.gameMode === 'No Mercy' && !isMyTurn) {
         if (isHost) {
           setGameState(prev => {
              const newScores = { ...prev.scores };
              newScores[playerName] = (newScores[playerName] || 0) - 10;
              const newState = { ...prev, scores: newScores };
              channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
              return newState;
           });
         } else {
           channel.send({ type: 'broadcast', event: 'incorrect_guess', payload: playerName });
         }
      }
    }
    setGuess('');
  };

  // Handle client correct guesses
  useEffect(() => {
    if (isHost) {
      channel.on('broadcast', { event: 'correct_guess' }, ({ payload: playerWhoGuessed }) => {
        setGameState(prev => {
          if (prev.guessedPlayers.includes(playerWhoGuessed)) return prev;

          const newScores = { ...prev.scores };
          const actualDrawTime = prev.config.gameMode === 'No Mercy' ? Math.min(30, prev.config.drawTime) : prev.config.drawTime;
          const timeBonus = Math.floor((prev.timer / actualDrawTime) * 200);
          newScores[playerWhoGuessed] = (newScores[playerWhoGuessed] || 0) + 100 + timeBonus;
          
          const drawer = players[prev.currentTurnIndex];
          newScores[drawer] = (newScores[drawer] || 0) + 50;

          const newGuessedPlayers = [...prev.guessedPlayers, playerWhoGuessed];
          
          const newState = {
            ...prev,
            scores: newScores,
            guessedPlayers: newGuessedPlayers
          };
          channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
          return newState;
        });
      });

      channel.on('broadcast', { event: 'incorrect_guess' }, ({ payload: playerWhoGuessed }) => {
        setGameState(prev => {
          if (prev.config.gameMode !== 'No Mercy') return prev;
          if (prev.guessedPlayers.includes(playerWhoGuessed)) return prev;

          const newScores = { ...prev.scores };
          newScores[playerWhoGuessed] = (newScores[playerWhoGuessed] || 0) - 10;
          
          const newState = {
            ...prev,
            scores: newScores
          };
          channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
          return newState;
        });
      });
    }
  }, [isHost, channel]);

  const getMaskedWord = (word, revealedIndices) => {
    if (!word) return '';
    return word.split('').map((char, index) => {
      if (char === ' ') return '\u00A0\u00A0'; // Spaces get wider gap
      if (revealedIndices.includes(index)) return char;
      return '_';
    }).join(' ');
  };


  // -------------------------
  // RENDER: LOBBY
  // -------------------------
  if (gameState.status === 'lobby') {
    return (
      <div style={styles.background}>
        <div style={{...styles.glassPanel, maxWidth: '600px', margin: '60px auto', padding: '40px'}}>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", color: '#ff33ff', textAlign: 'center', fontSize: '2rem', textShadow: '0 0 20px rgba(255,51,255,0.5)', marginBottom: '30px' }}>
            DUMB DOODLES
          </h1>
          
          {isHost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={styles.configRow}>
                <label style={styles.configLabel}><Users size={16}/> Players</label>
                <select value={gameState.config.maxPlayers} onChange={(e) => updateConfig('maxPlayers', parseInt(e.target.value))} style={styles.configInput}>
                  {[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}>Language</label>
                <select value={gameState.config.language} onChange={(e) => updateConfig('language', e.target.value)} style={styles.configInput}>
                  {['English'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}><Clock size={16}/> Drawtime</label>
                <select value={gameState.config.drawTime} onChange={(e) => updateConfig('drawTime', parseInt(e.target.value))} style={styles.configInput}>
                  {[30, 45, 60, 80, 100, 120].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              
              <div style={styles.configRow}>
                <label style={styles.configLabel}><Settings size={16}/> Rounds</label>
                <select value={gameState.config.rounds} onChange={(e) => updateConfig('rounds', parseInt(e.target.value))} style={styles.configInput}>
                  {[1, 2, 3, 4, 5, 10].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}>Game Mode</label>
                <select value={gameState.config.gameMode} onChange={(e) => updateConfig('gameMode', e.target.value)} style={styles.configInput}>
                  {['Normal', 'No Mercy'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}>Word Count</label>
                <select value={gameState.config.wordCount} onChange={(e) => updateConfig('wordCount', parseInt(e.target.value))} style={styles.configInput}>
                  {[2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}>Hints</label>
                <select value={gameState.config.hints} onChange={(e) => updateConfig('hints', parseInt(e.target.value))} style={styles.configInput}>
                  {[0, 1, 2, 3].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={styles.configRow}>
                <label style={styles.configLabel}>Word Template</label>
                <select value={gameState.config.wordPack} onChange={(e) => updateConfig('wordPack', e.target.value)} style={styles.configInput}>
                  {Object.keys(WORD_PACKS).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.configLabel}>Fading Ink</label>
                  <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={gameState.config.fadingInk} onChange={(e) => updateConfig('fadingInk', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '15px 20px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={styles.configLabel}>Custom words</label>
                  <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    Use custom words only
                    <input type="checkbox" checked={gameState.config.customWordsOnly} onChange={(e) => updateConfig('customWordsOnly', e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                  </label>
                </div>
                <textarea 
                  value={gameState.config.customWords}
                  onChange={(e) => updateConfig('customWords', e.target.value)}
                  style={{...styles.configInput, height: '80px', resize: 'none', width: '100%', boxSizing: 'border-box'}}
                  placeholder="e.g. GEMINI, ANTIGRAVITY, REACT"
                />
              </div>

              <button 
                onClick={() => startRound()}
                style={{
                  padding: '20px', background: '#ff33ff', color: '#000', border: 'none', borderRadius: '12px',
                  fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px',
                  boxShadow: '0 0 20px rgba(255,51,255,0.3)'
                }}
              >
                START GAME
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.7 }}>
              <Clock size={48} style={{ margin: '0 auto 20px auto', display: 'block' }} />
              <h2>Waiting for host to configure game...</h2>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------
  // RENDER: GAMEOVER
  // -------------------------
  if (gameState.status === 'gameover') {
    const sortedPlayers = [...players].sort((a, b) => (gameState.scores[b] || 0) - (gameState.scores[a] || 0));
    const top3 = sortedPlayers.slice(0, 3);
    const others = sortedPlayers.slice(3);
    
    return (
      <div style={styles.background}>
        <div style={{...styles.glassPanel, maxWidth: '800px', margin: '60px auto', padding: '40px', textAlign: 'center'}}>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", color: '#fff', fontSize: '2.5rem', marginBottom: '40px', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>LEADERBOARD</h1>
          
          {/* PODIUM */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '15px', height: '250px', marginBottom: '40px' }}>
            
            {/* 2nd Place */}
            {top3[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[1]]} size={64} /></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#c0c0c0' }}>{top3[1]}</div>
                <div style={{ fontSize: '0.8rem', color: '#c0c0c0', marginBottom: '10px' }}>{gameState.scores[top3[1]] || 0} pts</div>
                <div style={{ width: '100%', height: '120px', background: 'linear-gradient(180deg, #c0c0c0 0%, rgba(192,192,192,0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>2</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '140px' }}>
                <Trophy size={40} color="#ebd73f" style={{ marginBottom: '10px', filter: 'drop-shadow(0 0 10px #ebd73f)' }} />
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[0]]} size={80} /></div>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '5px', color: '#ebd73f' }}>{top3[0]}</div>
                <div style={{ fontSize: '0.9rem', color: '#ebd73f', marginBottom: '10px' }}>{gameState.scores[top3[0]] || 0} pts</div>
                <div style={{ width: '100%', height: '160px', background: 'linear-gradient(180deg, #ebd73f 0%, rgba(235, 215, 63, 0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px', boxShadow: '0 0 30px rgba(235, 215, 63, 0.3)' }}>
                  <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#000' }}>1</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '120px' }}>
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[2]]} size={64} /></div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#cd7f32' }}>{top3[2]}</div>
                <div style={{ fontSize: '0.8rem', color: '#cd7f32', marginBottom: '10px' }}>{gameState.scores[top3[2]] || 0} pts</div>
                <div style={{ width: '100%', height: '90px', background: 'linear-gradient(180deg, #cd7f32 0%, rgba(205, 127, 50, 0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>3</span>
                </div>
              </div>
            )}
            
          </div>
          
          {/* Others */}
          {others.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {others.map((p, i) => (
                <div key={p} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: '15px 20px', 
                  background: 'rgba(255,255,255,0.05)', borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)' }}>#{i+4}</span>
                    <span style={{ fontSize: '1rem', fontFamily: "'Panchang', sans-serif" }}>{p}</span>
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{gameState.scores[p] || 0} pts</span>
                </div>
              ))}
            </div>
          )}

          {isHost && (
            <button 
              onClick={() => {
                const newState = { ...gameState, status: 'lobby', currentRound: 1, currentTurnIndex: 0 };
                channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
                setGameState(newState);
              }}
              style={{
                padding: '20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '12px',
                fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', cursor: 'pointer', marginTop: '40px', width: '100%'
              }}
            >
              BACK TO LOBBY
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate layout direction
  const dashboardStyle = {
    ...styles.dashboard,
    flexDirection: isMobile ? 'column' : 'row'
  };

  return (
    <div className="no-global-scale" style={styles.background}>
      <div style={dashboardStyle}>
        
        {/* LEFT PANEL: Game State & Players */}
        <div style={{ ...styles.glassPanel, order: isMobile ? 2 : 1, width: isMobile ? '100%' : '280px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: isMobile ? '15px' : '30px 20px', background: 'linear-gradient(180deg, rgba(255,51,255,0.1) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: isMobile ? 'flex' : 'block', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1rem' : '1.5rem', color: '#ff33ff', margin: isMobile ? '0' : '0 0 10px 0', textShadow: '0 0 20px rgba(255,51,255,0.5)' }}>
              DUMB DOODLES
            </h1>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              {gameState.config.gameMode === 'No Mercy' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,0,0,0.5)', padding: '5px 15px', borderRadius: '30px' }}>
                  <Flame size={14} color="#fff" />
                  <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.7rem', color: '#fff' }}>NO MERCY</span>
                </div>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '30px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>RND</span>
                <span style={{ fontFamily: "'Panchang', sans-serif", color: '#fff' }}>{gameState.currentRound}/{gameState.config.rounds}</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '30px', border: gameState.timer <= 10 ? '1px solid #ff3333' : '1px solid rgba(255,255,255,0.1)' }}>
                <Clock size={16} color={gameState.timer <= 10 ? '#ff3333' : '#ebd73f'} />
                <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1rem', color: gameState.timer <= 10 ? '#ff3333' : '#fff' }}>
                  {Math.max(0, gameState.timer)}s
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ padding: '20px', flex: isMobile ? 'none' : 1, overflowY: isMobile ? 'hidden' : 'auto', display: isMobile ? 'flex' : 'block', gap: '10px', overflowX: isMobile ? 'auto' : 'hidden' }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', opacity: 0.6 }}>
                <Users size={14} />
                <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '600' }}>PLAYERS</span>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', minWidth: isMobile ? 'max-content' : 'auto' }}>
              {players.map((p, i) => {
                const isActive = i === gameState.currentTurnIndex;
                const isMe = p === playerName;
                const hasGuessed = gameState.guessedPlayers.includes(p);
                return (
                  <div key={i} style={{ 
                    ...styles.playerCard, 
                    background: hasGuessed ? 'rgba(51,255,51,0.15)' : (isActive ? 'rgba(255,51,255,0.15)' : 'rgba(255,255,255,0.03)'),
                    borderColor: hasGuessed ? 'rgba(51,255,51,0.5)' : (isActive ? 'rgba(255,51,255,0.5)' : 'transparent'),
                    boxShadow: isActive ? '0 0 15px rgba(255,51,255,0.2)' : 'none',
                    minWidth: isMobile ? '150px' : 'auto'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CustomAvatar config={playerAvatars[p]} size={40} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: hasGuessed ? '#33ff33' : (isActive ? '#ff33ff' : '#fff'), fontSize: '0.9rem' }}>
                          {p} {isMe && <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>(You)</span>}
                        </span>
                        {isActive && <span style={{ fontSize: '0.6rem', color: '#ff33ff', letterSpacing: '1px' }}>DRAWING</span>}
                        {hasGuessed && <span style={{ fontSize: '0.6rem', color: '#33ff33', letterSpacing: '1px' }}>GUESSED</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', color: '#ebd73f' }}>
                      {gameState.scores[p] || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Canvas / Overlays */}
        <div style={{ flex: 1, order: isMobile ? 1 : 2, display: 'flex', flexDirection: 'column', gap: '20px', minHeight: isMobile ? 'auto' : 'auto' }}>
          
          <div style={{ ...styles.glassPanel, padding: isMobile ? '15px' : '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px' }}>
              {gameState.status === 'choosing_word' ? (
                <>WAITING FOR <span style={{ color: '#ff33ff' }}>{players[gameState.currentTurnIndex]}</span> TO CHOOSE...</>
              ) : gameState.status === 'round_over' ? (
                <>ROUND OVER! THE WORD WAS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem' }}>{gameState.currentWord}</span></>
              ) : isMyTurn ? (
                <>DRAW THIS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', background: 'rgba(235, 215, 63, 0.1)', padding: '5px 10px', borderRadius: '8px' }}>{gameState.currentWord}</span></>
              ) : (
                <>
                  <span style={{ color: '#ff33ff' }}>{players[gameState.currentTurnIndex]}</span> is drawing! 
                  <span style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px', marginLeft: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                    {getMaskedWord(gameState.currentWord, gameState.revealedIndices)}
                  </span>
                </>
              )}
            </h2>
            
            {isMyTurn && gameState.status === 'playing' && (
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '20px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                  {['#ff33ff', '#33ff33', '#33ccff', '#ebd73f', '#ff3333', '#ff8c00', '#8a2be2', '#00ff7f', '#ffffff', '#0a0a0a'].map(c => (
                    <button key={c} onClick={() => setBrushColor(c)} style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: c,
                      border: brushColor === c ? '3px solid white' : '2px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: brushColor === c ? `0 0 15px ${c}` : 'none',
                      transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s, border 0.2s',
                      transform: brushColor === c ? 'scale(1.2)' : 'scale(1)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = brushColor === c ? 'scale(1.2)' : 'scale(1)'}
                    >
                      {c === '#0a0a0a' && <Eraser size={14} color="rgba(255,255,255,0.5)" />}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '20px', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                   {[2, 6, 12, 24].map(s => (
                     <button key={s} onClick={() => setBrushSize(s)} style={{
                       width: '28px', height: '28px', borderRadius: '50%', background: brushSize === s ? 'rgba(255,255,255,0.15)' : 'transparent',
                       border: brushSize === s ? '2px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                       cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                       transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                       transform: brushSize === s ? 'scale(1.15)' : 'scale(1)'
                     }}
                     onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                     onMouseLeave={e => { e.currentTarget.style.background = brushSize === s ? 'rgba(255,255,255,0.15)' : 'transparent'; e.currentTarget.style.transform = brushSize === s ? 'scale(1.15)' : 'scale(1)'; }}
                     >
                       <div style={{ width: s, height: s, borderRadius: '50%', background: brushColor === '#0a0a0a' ? '#555' : (brushColor || '#fff'), boxShadow: brushColor !== '#0a0a0a' ? `0 0 5px ${brushColor}` : 'none', transition: 'all 0.2s' }} />
                     </button>
                   ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '8px', borderRadius: '20px', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)' }}>
                   {['Solid', 'Neon', 'Glow', 'Marker', 'Crayon'].map(style => (
                     <button key={style} onClick={() => setBrushStyle(style)} style={{
                       padding: '6px 12px', borderRadius: '14px', 
                       background: brushStyle === style ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)' : 'transparent',
                       border: brushStyle === style ? '1px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                       color: brushStyle === style ? '#fff' : 'rgba(255,255,255,0.4)',
                       cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px',
                       transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                       boxShadow: brushStyle === style ? '0 5px 15px rgba(0,0,0,0.5)' : 'none',
                       transform: brushStyle === style ? 'scale(1.05)' : 'scale(1)'
                     }}
                     onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.color = '#fff'; }}
                     onMouseLeave={e => { e.currentTarget.style.transform = brushStyle === style ? 'scale(1.05)' : 'scale(1)'; e.currentTarget.style.color = brushStyle === style ? '#fff' : 'rgba(255,255,255,0.4)'; }}
                     >
                       {style.toUpperCase()}
                     </button>
                   ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={undo} title="Undo" style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Undo2 size={16} />
                  </button>
                  <button onClick={redo} title="Redo" style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Redo2 size={16} />
                  </button>
                  <button onClick={clearCanvas} title="Clear Canvas" style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,51,51,0.1)', border: '1px solid rgba(255,51,51,0.3)',
                      color: '#ff3333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,51,51,0.2)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,51,51,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ 
              ...styles.glassPanel, 
              flex: 1, 
              position: 'relative',
              background: '#0a0a0a',
              cursor: isMyTurn && gameState.status === 'playing' ? 'crosshair' : 'default',
              boxShadow: isMyTurn && gameState.status === 'playing' ? '0 0 40px rgba(255,51,255,0.1) inset' : 'none'
          }}>
            
            {/* OVERLAYS */}
            {gameState.status === 'choosing_word' && (
              <div style={styles.overlay}>
                {isMyTurn ? (
                  <>
                    <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2rem', marginBottom: '30px' }}>CHOOSE A WORD</h2>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {gameState.wordChoices.map(w => (
                        <button key={w} onClick={() => handleSelectWord(w)} style={styles.wordChoiceBtn}>
                          {w}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <h2 style={{ opacity: 0.6 }}>{players[gameState.currentTurnIndex]} is choosing a word...</h2>
                )}
              </div>
            )}

            {gameState.status === 'round_over' && (
              <div style={styles.overlay}>
                <h2 style={{ opacity: 0.8, letterSpacing: '2px' }}>THE WORD WAS</h2>
                <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '3rem', color: '#ebd73f', margin: '10px 0 30px 0' }}>{gameState.currentWord}</h1>
                <p style={{ opacity: 0.5 }}>Next turn starting soon...</p>
              </div>
            )}

            {(!isMyTurn || gameState.status !== 'playing') && <div style={{ position: 'absolute', inset: 0, zIndex: 10 }} />} {/* Block clicks */}
            
            <canvas 
              ref={canvasRef}
              width={800}
              height={600}
              style={{ width: '100%', height: isMobile ? 'auto' : '100%', aspectRatio: isMobile ? '4/3' : 'auto', display: 'block', touchAction: 'none' }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>
        </div>

        {/* RIGHT PANEL: Chat */}
        <div style={{ ...styles.glassPanel, order: 3, width: isMobile ? '100%' : '320px', display: 'flex', flexDirection: 'column', height: isMobile ? '300px' : 'auto' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '1px', fontFamily: "'Panchang', sans-serif" }}>LIVE CHAT</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {chat.map((msg, i) => {
              if (msg.type === 'success') {
                return (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(51, 255, 51, 0.1)', borderLeft: '3px solid #33ff33', borderRadius: '4px', color: '#33ff33', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PartyPopper size={14} /> {msg.text}
                  </div>
                );
              }
              
              if (msg.type === 'error' && msg.sender === 'Orlo') {
                return (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(255, 51, 51, 0.1)', borderLeft: '3px solid #ff3333', borderRadius: '4px', color: '#ff3333', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bot size={14} /> {msg.sender}: {msg.text}
                  </div>
                );
              }
              
              const isMyMessage = msg.sender === playerName;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px', marginLeft: '5px' }}>{msg.sender}</span>
                  <div style={{ 
                    padding: '8px 12px', 
                    background: isMyMessage ? '#ff33ff' : 'rgba(255,255,255,0.1)', 
                    color: isMyMessage ? '#000' : '#fff',
                    borderRadius: isMyMessage ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    fontSize: '0.9rem'
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          
          <div style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleGuess} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
              <input 
                type="text" 
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                disabled={isMyTurn || gameState.status !== 'playing' || gameState.guessedPlayers.includes(playerName)}
                placeholder={isMyTurn ? "You are drawing..." : (gameState.status !== 'playing' ? "Waiting..." : (gameState.guessedPlayers.includes(playerName) ? "You Guessed It!" : "Guess here..."))}
                style={{
                  flex: 1, padding: '12px 15px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                  borderRadius: '12px', outline: 'none', transition: 'all 0.3s',
                  fontFamily: "'Clash Display', sans-serif"
                }}
              />
              <button 
                type="submit"
                disabled={isMyTurn || !guess.trim() || gameState.status !== 'playing' || gameState.guessedPlayers.includes(playerName)}
                style={{
                  padding: '0 15px', background: isMyTurn ? 'rgba(255,255,255,0.1)' : '#ff33ff', color: isMyTurn ? 'rgba(255,255,255,0.3)' : '#000',
                  border: 'none', borderRadius: '12px', cursor: isMyTurn ? 'default' : 'pointer',
                  transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </form>
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
    backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255, 51, 255, 0.1) 0%, transparent 70%), radial-gradient(circle at 100% 100%, rgba(235, 215, 63, 0.05) 0%, transparent 50%)',
    fontFamily: "'Clash Display', sans-serif",
    color: '#fff',
    overflowY: 'auto',
    overflowX: 'hidden'
  },
  dashboard: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    height: '100%',
    minHeight: '100vh',
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
  },
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '16px',
    border: '1px solid transparent',
    transition: 'all 0.3s ease'
  },
  iconBtn: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '8px 15px', background: 'rgba(255, 51, 51, 0.1)', color: '#ff3333',
    border: '1px solid rgba(255, 51, 51, 0.3)', borderRadius: '12px', cursor: 'pointer',
    fontFamily: "'Panchang', sans-serif", fontSize: '0.7rem', transition: 'all 0.2s'
  },
  configRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '12px'
  },
  configLabel: {
    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem'
  },
  configInput: {
    padding: '8px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', borderRadius: '8px', fontSize: '1rem', outline: 'none'
  },
  overlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(10px)', textAlign: 'center', padding: '20px'
  },
  wordChoiceBtn: {
    padding: '20px 40px', background: 'rgba(255, 51, 255, 0.1)', border: '2px solid rgba(255, 51, 255, 0.5)',
    color: '#fff', borderRadius: '16px', fontSize: '1.5rem', fontFamily: "'Panchang', sans-serif",
    cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 20px rgba(255,51,255,0.1)'
  }
};
