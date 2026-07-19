"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Eraser, Users, Clock, Trophy, PartyPopper, Settings, Bot, Undo2, Redo2, Trash2, Flame, MessageSquare, X, PaintBucket, Pen } from 'lucide-react';
import CustomAvatar from './CustomAvatar';
import dynamic from 'next/dynamic';
import confettiData from '../../../public/lottie/confetti.json';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const BRUSH_COLORS = [
  '#ff3333', '#ff9933', '#ebd73f', '#33ff33', '#33ffff', '#3333ff', '#ff33ff',
  '#ffb3ba', '#ffdba4', '#ffffba', '#baffc9', '#bae1ff', '#e8baff', '#ffb3e6',
  '#8b4513', '#a0522d', '#cd853f', '#ffffff', '#aaaaaa', '#555555', '#0a0a0a'
];

const DEFAULT_WORDS = [
  "ROLLERCOASTER", "TORNADO", "VAMPIRE", "PIRATE SHIP", "SNOWMAN", "TREASURE MAP", "SPACESHIP", "GHOST", "MERMAID", "NINJA",
  "CASTLE", "DINOSAUR", "WIZARD", "VOLCANO", "ZOMBIE", "UNICORN", "ALIEN", "SUPERHERO", "DETECTIVE", "ROCKET",
  "CACTUS", "MAGNET", "ANCHOR", "BOOMERANG", "DIAMOND", "MAGIC WAND", "PARACHUTE", "SCARECROW", "IGLOO", "COMPASS",
  "MUMMY", "WEREWOLF", "FRANKENSTEIN", "UFO", "BLACK HOLE", "AQUARIUM", "HURRICANE", "EARTHQUAKE", "TSUNAMI", "AVALANCHE",
  "PYRAMID", "EIFFEL TOWER", "STATUE OF LIBERTY", "FERRIS WHEEL", "CAROUSEL", "HOT AIR BALLOON", "SUBMARINE", "HELICOPTER", "MOTORCYCLE", "TRUCK",
  "BRIDGE", "TUNNEL", "LIGHTHOUSE", "WINDMILL", "WATERFALL", "CANYON", "OASIS", "GLACIER", "JUNGLE", "DESERT"
];

const ANIMAL_WORDS = [
  "FLAMINGO", "KANGAROO", "PENGUIN", "CHAMELEON", "PEACOCK", "SLOTH", "OCTOPUS", "PLATYPUS", "WALRUS", "OSTRICH",
  "IGUANA", "HEDGEHOG", "LLAMA", "RHINOCEROS", "HIPPO", "NARWHAL", "JELLYFISH", "ARMADILLO", "SQUIRREL", "RACCOON",
  "KOALA", "PANDA", "GIRAFFE", "ELEPHANT", "LION", "TIGER", "CHEETAH", "LEOPARD", "GORILLA", "CHIMPANZEE",
  "DOLPHIN", "WHALE", "SHARK", "SEAHORSE", "STARFISH", "CRAB", "LOBSTER", "TURTLE", "CROCODILE", "ALLIGATOR",
  "SNAKE", "FROG", "TOAD", "SALAMANDER", "BAT", "OWL", "EAGLE", "HAWK", "FALCON", "PELICAN",
  "WOODPECKER", "PARROT", "BULL", "COW", "SHEEP", "GOAT", "PIG", "HORSE", "DONKEY", "CAMEL"
];

const TECH_WORDS = [
  "TIME MACHINE", "JETPACK", "HOVERBOARD", "CYBORG", "VR HEADSET", "MICROSCOPE", "TELESCOPE", "SUBMARINE",
  "SATELLITE", "METAL DETECTOR", "ARCADE CABINET", "LASER BEAM", "FLOPPY DISK", "GRAMOPHONE", "MECH SUIT", "CHAINSAW",
  "SMARTPHONE", "LAPTOP", "TABLET", "SMARTWATCH", "DRONE", "3D PRINTER", "ROBOT", "SUPERCOMPUTER", "ROUTER", "WEBCAM",
  "MICROPHONE", "HEADPHONES", "SPEAKER", "PROJECTOR", "TELEVISION", "RADIO", "CALCULATOR", "TYPEWRITER", "PAGER", "WALKIE TALKIE",
  "BATTERY", "CHARGER", "USB DRIVE", "HARD DRIVE", "MOTHERBOARD", "GRAPHICS CARD", "KEYBOARD", "MOUSE", "MONITOR", "CONTROLLER",
  "JOYSTICK", "WIFI ROUTER", "SATELLITE DISH", "SOLAR PANEL", "WIND TURBINE", "ELECTRIC CAR", "CHARGING STATION", "ESCALATOR", "ELEVATOR", "VENDING MACHINE"
];

const FOOD_WORDS = [
  "COTTON CANDY", "SUSHI", "PINEAPPLE", "SPAGHETTI", "WAFFLE", "CHILI PEPPER", "GUMMY BEAR", "MARSHMALLOW",
  "CROISSANT", "PRETZEL", "AVOCADO", "PANCAKES", "POPCORN", "CUPCAKE", "HOT SAUCE", "FORTUNE COOKIE",
  "PIZZA", "HAMBURGER", "HOT DOG", "FRENCH FRIES", "ONION RINGS", "CHICKEN NUGGETS", "TACO", "BURRITO", "NACHOS", "QUESADILLA",
  "STEAK", "RIBS", "MEATBALLS", "SAUSAGE", "BACON", "EGG", "OMELETTE", "SANDWICH", "WRAP", "BAGEL",
  "DONUT", "MUFFIN", "BROWNIE", "COOKIE", "CAKE", "PIE", "ICE CREAM", "POPSICLE", "MILKSHAKE", "SMOOTHIE",
  "APPLE", "BANANA", "ORANGE", "GRAPES", "STRAWBERRY", "WATERMELON", "LEMON", "CARROT", "BROCCOLI", "MUSHROOM"
];

const HARDCORE_WORDS = [
  "ASTRONAUT", "LUMBERJACK", "CHANDELIER", "METRONOME", "TREADMILL", 
  "ZEPPELIN", "MICROSCOPE", "ORCHESTRA", "PHARAOH", "SYRINGE",
  "PLATYPUS", "SPHINX", "THERMOMETER", "ACCORDION", "SUBMARINE",
  "HELICOPTER", "WHEELCHAIR", "ESCALATOR", "THERMOSTAT", "STETHOSCOPE", "KALEIDOSCOPE", "BOOMERANG", "XYLOPHONE", "CHIMPANZEE",
  "RHINOCEROS", "HIPPOPOTAMUS", "CHAMELEON", "PORCUPINE", "WOODPECKER", "SCARECROW", "WHEELBARROW", "LAWNMOWER", "CHAINSAW", "BULLDOZER",
  "EXCAVATOR", "TRACTOR", "MOTORCYCLE", "AMBULANCE", "FIRETRUCK", "POLICE CAR", "GARBAGE TRUCK", "SCHOOL BUS",
  "STATUE OF LIBERTY", "EIFFEL TOWER", "PYRAMID", "COLOSSEUM", "TAJ MAHAL", "GREAT WALL", "STONEHENGE", "MOUNT EVEREST", "GRAND CANYON", "NIAGARA FALLS"
];

const SPORTS_WORDS = [
  "BASKETBALL", "TENNIS RACKET", "SOCCER BALL", "BASEBALL BAT", "GOLF CLUB", "SWIMMING", "BOXING GLOVES", "VOLLEYBALL",
  "RUGBY", "CRICKET", "SURFBOARD", "SNOWBOARD", "SKATEBOARD", "BOWLING PIN", "GYMNASTICS", "KARATE",
  "ICE SKATING", "ROLLER SKATING", "CYCLING", "MOUNTAIN BIKING", "ARCHERY", "FENCING", "WRESTLING", "WEIGHTLIFTING", "MARATHON", "SPRINT",
  "HIGH JUMP", "LONG JUMP", "POLE VAULT", "JAVELIN", "DISCUS", "SHOT PUT", "HURDLES", "RELAY RACE", "TRIATHLON", "DECATHLON",
  "SKIING", "ICE HOCKEY", "FIGURE SKATING", "BOBSLEIGH", "CURLING", "SNOWMOBILING", "WATER POLO", "DIVING", "SYNCHRONIZED SWIMMING", "ROWING",
  "CANOEING", "KAYAKING", "SAILING", "WINDSURFING", "KITE SURFING", "WAKEBOARDING", "WATER SKIING", "SCUBA DIVING", "SNORKELING", "FISHING"
];

const FANTASY_WORDS = [
  "DRAGON", "WAND", "FAIRY", "GOBLIN", "GRIFFIN", "TROLL", "ELIXIR", "SPELLBOOK", "POTION", 
  "CROWN", "SHIELD", "ARMOR", "GIANT", "PEGASUS", "ORC", "PHOENIX",
  "MERMAID", "CENTAUR", "MINOTAUR", "CYCLOPS", "KRAKEN", "WEREWOLF", "VAMPIRE", "ZOMBIE", "GHOST", "BANSHEE",
  "WIZARD", "WITCH", "WARLOCK", "SORCERER", "NECROMANCER", "PALADIN", "KNIGHT", "ROGUE", "THIEF", "ASSASSIN",
  "CASTLE", "DUNGEON", "TOWER", "TAVERN", "VILLAGE", "FOREST", "CAVE", "MOUNTAIN", "SWAMP", "ISLAND",
  "SWORD", "AXE", "BOW", "ARROW", "DAGGER", "SPEAR", "MACE", "HAMMER", "STAFF", "AMULET"
];

const ACTION_WORDS = [
  "DANCING", "RUNNING", "JUMPING", "SLEEPING", "EATING", "READING", "SINGING", "CRYING",
  "LAUGHING", "FIGHTING", "SWIMMING", "CLIMBING", "FLYING", "DRIVING", "COOKING", "FALLING",
  "WALKING", "CRAWLING", "SKIPPING", "HOPPING", "SNEAKING", "HIDING", "SEARCHING", "FINDING", "LOSING", "WINNING",
  "CHEERING", "BOOING", "CLAPPING", "WAVING", "POINTING", "THROWING", "CATCHING", "KICKING", "PUNCHING", "BLOCKING",
  "DODGING", "DUCKING", "SLIDING", "ROLLING", "SPINNING", "TURNING", "TWISTING", "BENDING", "STRETCHING", "YAWNING",
  "SNEEZING", "COUGHING", "BURPING", "HICCUPING", "BLINKING", "WINKING", "STARING", "GLARING", "SMILING", "FROWNING"
];

const INDIAN_WORDS = [
  "RICKSHAW", "CHAI GLASS", "SAREE", "SAMOSA", "CRICKET STUMPS", "AUTO RICKSHAW", "LUDO BOARD", "JALEBI", "BIRYANI", "DIYA",
  "KITE", "BANGLE", "TIFFIN BOX", "PANI PURI", "MONSOON", "YOGA MAT", "TEMPLE", "COCONUT", "LADDOO", "PEACOCK FEATHER",
  "TAJ MAHAL", "TUK TUK", "DOSA", "IDLI", "VADA", "NAAN", "BUTTER CHICKEN", "PALAK PANEER", "GULAB JAMUN", "RASGULLA",
  "KURTA", "DHOTI", "TURBAN", "BINDI", "MEHNDI", "RANGOLI", "MARIGOLD", "LOTUS", "BANYAN TREE", "MANGO",
  "TIGER", "ELEPHANT", "COW", "MONKEY", "SNAKE CHARMER", "SITAR", "TABLA", "FLUTE", "DHOLAK", "HARMONIUM",
  "BOLLYWOOD", "FILM REEL", "DANDIYA", "GARBA", "BHANGRA", "KABADDI", "KHO KHO", "CARROM BOARD", "CHESS", "SNAKES AND LADDERS",
  "PRESSURE COOKER", "ROLLING PIN", "TONGS", "EARTHEN POT", "BROOM", "BUCKET", "MATCHBOX", "INCENSE STICKS", "PARLE G", "MAGGI NOODLES",
  "ROTI", "PARATHA", "PAV BHAJI", "CHHOLE BHATURE", "RASMALAI", "KAJU KATLI", "BARFI", "FALOODA", "LASSI", "SUGARCANE JUICE",
  "BHUTTA", "MOMOS", "KATHI ROLL", "PAPAD", "CHUTNEY", "PICKLE JAR", "TURMERIC", "MORTAR PESTLE", "KADHAI", "TAWA",
  "LOCAL TRAIN", "SLEEPER COACH", "SCOOTER", "BULLET BIKE", "CYCLE RICKSHAW", "TRACTOR", "JEEP", "SPINNING TOP", "MARBLES", "CARROM COINS",
  "PIGEON", "STREET DOG", "KOLHAPURI CHAPPAL", "GHUNGROO", "PAYAL", "MANGALSUTRA", "SHERWANI", "CHUNNI", "LUNGI", "GAMCHA",
  "HENNA TUBE", "SWEET SHOP", "PAN SHOP", "VEGETABLE CART", "FRUIT BASKET", "CEILING FAN", "DESERT COOLER", "MOSQUITO COIL", "TUBE LIGHT", "STABILIZER",
  "OLD TV", "CASSETTE TAPE", "RADIO", "SEWING MACHINE", "UMBRELLA", "POST BOX", "RUPEE COIN", "CURRENCY NOTE", "PASSPORT", "AADHAAR CARD",
  "BANANA LEAF", "TULSI PLANT", "NEEM LEAF", "BAMBOO", "SUGARCANE", "DIWALI ROCKET", "FIRECRACKER", "SPARKLER", "WATER BALLOON", "PICHKARI",
  "HOLI COLORS", "KITE STRING", "LOHRI FIRE", "CHRISTMAS STAR", "TEMPLE BELL", "TRISHUL", "OM SYMBOL", "SWASTIK", "CALENDAR ART", "ELEPHANT RIDE",
  "CAMEL RIDE", "INDIA GATE", "RED FORT", "GATEWAY OF INDIA", "QUTUB MINAR", "TRAFFIC POLICE", "MILKMAN", "COBBLER", "POSTMAN", "BARBER",
  "LUNCH BOX", "STEEL THALI", "WATER FILTER", "THERMOS FLASK", "TIFFIN CARRIER", "MOSQUITO NET", "CHARPOY", "SWING", "COTTON MATTRESS", "PILLOW",
  "BLANKET", "FLOWER RANGOLI", "MARIGOLD GARLAND", "WEDDING TENT", "BARAAT", "HORSE RIDING", "DRUM", "SHEHNAI", "NAGADA", "GUJIYA"
];

const WORD_PACKS = {
  'Default': DEFAULT_WORDS,
  'Indian / Desi': INDIAN_WORDS,
  'Animals': ANIMAL_WORDS,
  'Technology': TECH_WORDS,
  'Food': FOOD_WORDS,
  'Sports': SPORTS_WORDS,
  'Fantasy': FANTASY_WORDS,
  'Actions': ACTION_WORDS,
  'Hardcore': HARDCORE_WORDS
};

const hexToRgba = (hex) => {
  let c = hex.substring(1).split('');
  if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  c = '0x' + c.join('');
  return [(c>>16)&255, (c>>8)&255, c&255, 255];
};

const colorMatch = (data, pos, targetR, targetG, targetB, targetA, tolerance) => {
  const r = data[pos], g = data[pos+1], b = data[pos+2], a = data[pos+3];
  return Math.abs(r - targetR) <= tolerance &&
         Math.abs(g - targetG) <= tolerance &&
         Math.abs(b - targetB) <= tolerance &&
         Math.abs(a - targetA) <= tolerance;
};

const executeFloodFill = (ctx, startX, startY, fillColorHex) => {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  startX = Math.floor(startX);
  startY = Math.floor(startY);
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  const [fillR, fillG, fillB, fillA] = hexToRgba(fillColorHex);

  if (Math.abs(startR - fillR) <= 5 && Math.abs(startG - fillG) <= 5 && Math.abs(startB - fillB) <= 5) {
     return; // Already filled
  }

  const pixelStack = [[startX, startY]];
  const tolerance = 60; // Fairly high tolerance for anti-aliased brushes
  
  while(pixelStack.length) {
    let newPos, x, y, pixelPos, reachLeft, reachRight;
    newPos = pixelStack.pop();
    x = newPos[0];
    y = newPos[1];
    
    pixelPos = (y * width + x) * 4;
    
    // Go up as long as color matches
    while(y-- >= 0 && colorMatch(data, pixelPos, startR, startG, startB, startA, tolerance)) {
      pixelPos -= width * 4;
    }
    pixelPos += width * 4;
    ++y;
    
    reachLeft = false;
    reachRight = false;
    
    while(y++ < height - 1 && colorMatch(data, pixelPos, startR, startG, startB, startA, tolerance)) {
      // Color the pixel
      data[pixelPos] = fillR;
      data[pixelPos + 1] = fillG;
      data[pixelPos + 2] = fillB;
      data[pixelPos + 3] = fillA;
      
      if (x > 0) {
        if (colorMatch(data, pixelPos - 4, startR, startG, startB, startA, tolerance)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, y]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }
      
      if (x < width - 1) {
        if (colorMatch(data, pixelPos + 4, startR, startG, startB, startA, tolerance)) {
          if (!reachRight) {
            pixelStack.push([x + 1, y]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }
      
      pixelPos += width * 4;
    }
  }
  
  ctx.putImageData(imgData, 0, 0);
};

const renderLineEvent = (ctx, line) => {
  if (line.isFill) {
    executeFloodFill(ctx, line.x, line.y, line.color);
    return;
  }
  
  ctx.beginPath();
  ctx.moveTo(line.x0, line.y0);
  ctx.lineTo(line.x1, line.y1);
  ctx.strokeStyle = line.color || '#ff33ff';
  ctx.lineWidth = line.size || 6;
  ctx.lineCap = line.style === 'Marker' ? 'square' : 'round';
  ctx.lineJoin = 'round';
  
  if (line.style === 'Dotted') {
      ctx.setLineDash([ctx.lineWidth * 1.5, ctx.lineWidth * 2]);
  } else {
      ctx.setLineDash([]);
  }
  
  if (line.style === 'Solid' || line.style === 'Dotted' || line.style === 'Rainbow') {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  } else if (line.style === 'Marker') {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.5;
  } else if (line.style === 'Crayon') {
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3;
  } else if (line.style === 'Airbrush') {
    ctx.shadowBlur = ctx.lineWidth * 2;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = ctx.lineWidth * 2;
  } else if (line.style === 'Glow') {
    ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 25;
    ctx.globalAlpha = 1;
  } else {
    ctx.shadowBlur = line.color === '#0a0a0a' ? 0 : 10;
    ctx.globalAlpha = 1;
  }
  
  if (line.style !== 'Crayon' && line.style !== 'Airbrush') {
     ctx.shadowColor = line.color === '#0a0a0a' ? 'transparent' : (line.color || '#ff33ff');
     ctx.stroke();
  } else if (line.style === 'Airbrush') {
     ctx.shadowColor = line.color === '#0a0a0a' ? 'transparent' : (line.color || '#ff33ff');
     ctx.stroke();
     ctx.stroke();
  } else {
     ctx.shadowColor = 'transparent';
     const origWidth = ctx.lineWidth;
     ctx.lineWidth = origWidth * 1.5; ctx.stroke();
     ctx.lineWidth = origWidth * 0.9; ctx.stroke();
     ctx.lineWidth = origWidth * 0.4; ctx.stroke();
     ctx.lineWidth = origWidth;
  }
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
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
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [activeTool, setActiveTool] = useState('Brush');
  const [brushSize, setBrushSize] = useState(6);
  const [brushStyle, setBrushStyle] = useState('Solid');
  
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isMobileLeaderboardOpen, setIsMobileLeaderboardOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [latestMobileMessage, setLatestMobileMessage] = useState(null);

  useEffect(() => {
    if (gameState.guessedPlayers?.includes(playerName) && gameState.status === 'playing') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState.guessedPlayers, playerName, gameState.status]);

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
        if (isMobile && !isMobileChatOpen) {
          setLatestMobileMessage(payload);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setLatestMobileMessage(null);
          }, 3000);
        }
      })
      .on('broadcast', { event: 'draw_batch' }, ({ payload }) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        payload.forEach(line => {
          renderLineEvent(ctx, line);
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
             renderLineEvent(ctx, line);
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

  // Clear canvas on new round
  useEffect(() => {
    if (gameState.status === 'choosing_word') {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      allLinesRef.current = [];
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
    
    const pos = getMousePos(e);
    
    if (activeTool === 'Fill') {
       const fillEvent = {
          isFill: true,
          x: pos.x,
          y: pos.y,
          color: brushColor
       };
       const ctx = ctxRef.current;
       if (ctx) renderLineEvent(ctx, fillEvent);
       
       currentStrokeRef.current = [fillEvent];
       allLinesRef.current.push([...currentStrokeRef.current]);
       pendingDrawEventsRef.current.push(fillEvent);
       currentStrokeRef.current = [];
       redoStackRef.current = [];
       return;
    }
    
    isDrawingRef.current = true;
    lastPosRef.current = pos;
    lastPosRef.current.x -= 0.1; // Offset slightly so a dot is drawn even on tap
    currentStrokeRef.current = [];
    redoStackRef.current = [];
    draw(e);
  };

  const draw = (e) => {
    if (!isMyTurn || !isDrawingRef.current || gameState.status !== 'playing') return;
    
    const rawPos = getMousePos(e);
    // Apply 5% smoothing interpolation to the drawing brush
    const currentPos = {
      x: lastPosRef.current.x * 0.05 + rawPos.x * 0.95,
      y: lastPosRef.current.y * 0.05 + rawPos.y * 0.95
    };
    const ctx = ctxRef.current;
    
    if (ctx) {
      let effectiveColor = brushColor;
      let effectiveSize = brushSize;
      
      if (brushStyle === 'Rainbow') {
         effectiveColor = `hsl(${(Date.now() / 5) % 360}, 100%, 50%)`;
      }
      
      const lineEvent = {
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: currentPos.x, y1: currentPos.y,
        color: effectiveColor, size: effectiveSize, style: brushStyle
      };
      
      renderLineEvent(ctx, lineEvent);
      
      const lineEvent = {
        x0: lastPosRef.current.x, y0: lastPosRef.current.y,
        x1: currentPos.x, y1: currentPos.y,
        color: effectiveColor, size: effectiveSize, style: brushStyle
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
          renderLineEvent(ctx, line);
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
    if (isHost && channel) {
      channel.on('broadcast', { event: 'select_word' }, ({ payload }) => {
        setGameState(prev => {
          if (prev.status === 'choosing_word') {
            const actualDrawTime = prev.config.gameMode === 'No Mercy' ? Math.min(30, prev.config.drawTime) : prev.config.drawTime;
            const newState = {
              ...prev,
              status: 'playing',
              currentWord: payload,
              timer: actualDrawTime,
              revealedIndices: []
            };
            channel.send({ type: 'broadcast', event: 'sync_state', payload: newState });
            return newState;
          }
          return prev;
        });
      });
    }
  }, [isHost, channel]);


  // Chat Handlers
  const handleGuess = (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    const msg = guess.toUpperCase().trim();
    
    if (gameState.status !== 'playing') {
      const chatMsg = { sender: playerName, text: guess, type: 'normal' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: chatMsg });
      setChat(prev => [...prev, chatMsg].slice(-30));
      setGuess('');
      return;
    }

    const hasGuessed = gameState.guessedPlayers.includes(playerName);

    if (hasGuessed && msg === gameState.currentWord) {
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

    if (!isMyTurn && msg === gameState.currentWord && !hasGuessed) {
      if (isHost) {
         const sysMsg = { sender: 'SYSTEM', text: `${playerName} guessed the word!`, type: 'success' };
         channel.send({ type: 'broadcast', event: 'chat_msg', payload: sysMsg });
         setChat(prev => [...prev, sysMsg].slice(-30));
         
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
      const chatMsg = { sender: playerName, text: guess, type: hasGuessed ? 'success' : 'normal' };
      channel.send({ type: 'broadcast', event: 'chat_msg', payload: chatMsg });
      setChat(prev => [...prev, chatMsg].slice(-30));
      
      // No Mercy penalty
      if (gameState.config.gameMode === 'No Mercy' && !isMyTurn && !hasGuessed) {
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
    if (isHost && channel) {
      channel.on('broadcast', { event: 'correct_guess' }, ({ payload: playerWhoGuessed }) => {
        setGameState(prev => {
          if (prev.guessedPlayers.includes(playerWhoGuessed)) return prev;

          const sysMsg = { sender: 'SYSTEM', text: `${playerWhoGuessed} guessed the word!`, type: 'success' };
          channel.send({ type: 'broadcast', event: 'chat_msg', payload: sysMsg });
          setChat(chatPrev => [...chatPrev, sysMsg].slice(-30));

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
      <div className="no-global-scale" style={{...styles.background, display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-start' : 'center', overflow: 'hidden' }}>
        <div style={{...styles.glassPanel, maxWidth: isMobile ? '100vw' : '900px', width: '100%', height: isMobile ? '100dvh' : 'auto', maxHeight: isMobile ? 'none' : '100vh', display: 'flex', flexDirection: 'column', padding: isMobile ? '35px 15px 20px' : '50px 40px 40px', boxSizing: 'border-box', boxShadow: '0 0 50px rgba(255,51,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)', margin: 0, borderRadius: isMobile ? 0 : '24px' }}>
          <h1 style={{ marginTop: '10px', fontFamily: "'Panchang', sans-serif", color: '#ff33ff', textAlign: 'center', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', textShadow: '0 0 20px rgba(255,51,255,0.5)', marginBottom: isMobile ? '15px' : '25px', wordBreak: 'break-word', overflowWrap: 'break-word', flexShrink: 0 }}>
            DUMB DOODLES
          </h1>
          
          {isHost ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '15px', overflowY: 'auto', flex: 1, paddingRight: '5px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px' }}>
                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}><Users size={14}/> Players</label>
                  <select value={gameState.config.maxPlayers} onChange={(e) => updateConfig('maxPlayers', parseInt(e.target.value))} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {[2, 3, 4, 5, 6, 7, 8, 10, 12, 16].map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Language</label>
                  <select value={gameState.config.language} onChange={(e) => updateConfig('language', e.target.value)} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {['English'].map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}><Clock size={14}/> Drawtime</label>
                  <select value={gameState.config.drawTime} onChange={(e) => updateConfig('drawTime', parseInt(e.target.value))} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {[30, 45, 60, 80, 100, 120].map(t => <option key={t} value={t} style={{background:'#000'}}>{t}s</option>)}
                  </select>
                </div>
                
                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}><Settings size={14}/> Rounds</label>
                  <select value={gameState.config.rounds} onChange={(e) => updateConfig('rounds', parseInt(e.target.value))} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {[1, 2, 3, 4, 5, 10].map(r => <option key={r} value={r} style={{background:'#000'}}>{r}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Game Mode</label>
                  <select value={gameState.config.gameMode} onChange={(e) => updateConfig('gameMode', e.target.value)} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {['Normal', 'No Mercy'].map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Word Count</label>
                  <select value={gameState.config.wordCount} onChange={(e) => updateConfig('wordCount', parseInt(e.target.value))} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {[2, 3, 4, 5].map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Hints</label>
                  <select value={gameState.config.hints} onChange={(e) => updateConfig('hints', parseInt(e.target.value))} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {[0, 1, 2, 3].map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'column', alignItems: 'flex-start', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Word Pack</label>
                  <select value={gameState.config.wordPack} onChange={(e) => updateConfig('wordPack', e.target.value)} style={{...styles.configInput, width: '100%', padding: '6px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}>
                    {Object.keys(WORD_PACKS).map(v => <option key={v} value={v} style={{background:'#000'}}>{v}</option>)}
                  </select>
                </div>

                <div style={{...styles.configRow, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', gap: '8px'}}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Fading Ink</label>
                  <input type="checkbox" checked={gameState.config.fadingInk} onChange={(e) => updateConfig('fadingInk', e.target.checked)} style={{ transform: 'scale(1.2)', accentColor: '#ff33ff', cursor: 'pointer' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{...styles.configLabel, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)'}}>Custom words</label>
                  <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                    Only custom words
                    <input type="checkbox" checked={gameState.config.customWordsOnly} onChange={(e) => updateConfig('customWordsOnly', e.target.checked)} style={{ transform: 'scale(1.1)', accentColor: '#ff33ff' }} />
                  </label>
                </div>
                <textarea 
                  value={gameState.config.customWords}
                  onChange={(e) => updateConfig('customWords', e.target.value)}
                  style={{...styles.configInput, height: '60px', resize: 'none', width: '100%', boxSizing: 'border-box', padding: '8px 12px', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)'}}
                  placeholder="e.g. GEMINI, ANTIGRAVITY, REACT"
                />
              </div>

              <button 
                onClick={() => startRound()}
                className="lobby-start-btn"
                style={{
                  padding: '16px', background: 'linear-gradient(90deg, #ff33ff 0%, #ff66ff 100%)', color: '#000', border: 'none', borderRadius: '12px',
                  fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', cursor: 'pointer', marginTop: '10px', flexShrink: 0,
                  boxShadow: '0 0 30px rgba(255,51,255,0.4)', transition: 'all 0.3s ease', letterSpacing: '2px', fontWeight: 'bold'
                }}
              >
                START GAME
              </button>
              <style>{`
                .lobby-start-btn:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(255,51,255,0.6) !important; }
                .lobby-start-btn:active { transform: translateY(1px); }
              `}</style>
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
        <div style={{...styles.glassPanel, maxWidth: '800px', margin: isMobile ? '20px 10px' : '60px auto', padding: isMobile ? '20px' : '40px', textAlign: 'center'}}>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", color: '#fff', fontSize: isMobile ? '1.8rem' : '2.5rem', marginBottom: isMobile ? '20px' : '40px', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>LEADERBOARD</h1>
          
          {/* PODIUM */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: isMobile ? '5px' : '15px', height: isMobile ? '200px' : '320px', marginBottom: isMobile ? '20px' : '40px' }}>
            
            {/* 2nd Place */}
            {top3[1] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '80px' : '120px' }}>
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[1]]} size={isMobile ? 40 : 64} /></div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#c0c0c0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[1]}</div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#c0c0c0', marginBottom: '10px' }}>{gameState.scores[top3[1]] || 0} pts</div>
                <div style={{ width: '100%', height: isMobile ? '90px' : '120px', background: 'linear-gradient(180deg, #c0c0c0 0%, rgba(192,192,192,0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px' }}>
                  <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#fff' }}>2</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '100px' : '140px' }}>
                <Trophy size={isMobile ? 24 : 40} color="#ebd73f" style={{ marginBottom: '10px', filter: 'drop-shadow(0 0 10px #ebd73f)' }} />
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[0]]} size={isMobile ? 50 : 80} /></div>
                <div style={{ fontSize: isMobile ? '0.8rem' : '1.1rem', fontWeight: 'bold', marginBottom: '5px', color: '#ebd73f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[0]}</div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', color: '#ebd73f', marginBottom: '10px' }}>{gameState.scores[top3[0]] || 0} pts</div>
                <div style={{ width: '100%', height: isMobile ? '120px' : '160px', background: 'linear-gradient(180deg, #ebd73f 0%, rgba(235, 215, 63, 0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px', boxShadow: '0 0 30px rgba(235, 215, 63, 0.3)' }}>
                  <span style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 'bold', color: '#000' }}>1</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isMobile ? '80px' : '120px' }}>
                <div style={{ marginBottom: '10px' }}><CustomAvatar config={playerAvatars[top3[2]]} size={isMobile ? 40 : 64} /></div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', fontWeight: 'bold', marginBottom: '5px', color: '#cd7f32', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{top3[2]}</div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#cd7f32', marginBottom: '10px' }}>{gameState.scores[top3[2]] || 0} pts</div>
                <div style={{ width: '100%', height: isMobile ? '70px' : '90px', background: 'linear-gradient(180deg, #cd7f32 0%, rgba(205, 127, 50, 0.2) 100%)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'center', paddingTop: '15px' }}>
                  <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', color: '#fff' }}>3</span>
                </div>
              </div>
            )}
            
          </div>
          
          {/* Others */}
          {others.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: isMobile ? '10px' : '20px' }}>
              {others.map((p, i) => (
                <div key={p} style={{ 
                  display: 'flex', justifyContent: 'space-between', padding: isMobile ? '10px 15px' : '15px 20px', 
                  background: 'rgba(255,255,255,0.05)', borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)' }}>#{i+4}</span>
                    <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontFamily: "'Panchang', sans-serif" }}>{p}</span>
                  </div>
                  <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 'bold' }}>{gameState.scores[p] || 0} pts</span>
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
                padding: isMobile ? '15px' : '20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '12px',
                fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1rem' : '1.2rem', cursor: 'pointer', marginTop: isMobile ? '20px' : '40px', width: '100%'
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
        {(!isMobile || isMobileLeaderboardOpen) && (
          <div style={{ 
            ...styles.glassPanel, 
            ...(isMobile ? {
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
              borderRadius: 0, overflowY: 'auto'
            } : {
              order: 1, width: '280px'
            }),
            display: 'flex', flexDirection: 'column', minHeight: 0 
          }}>
            {isMobile && (
               <button onClick={() => setIsMobileLeaderboardOpen(false)} style={{position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', zIndex: 10, borderRadius: '50%', width: 36, height: 36, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                 <X size={20} />
               </button>
            )}
            <div style={{ padding: isMobile ? '70px 20px 20px 20px' : '30px 20px', background: 'linear-gradient(180deg, rgba(255,51,255,0.1) 0%, transparent 100%)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
              <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#ff33ff', margin: 0, textShadow: '0 0 20px rgba(255,51,255,0.5)' }}>
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
          
          <div style={{ padding: '20px', flex: isMobile ? 'none' : 1, overflowY: isMobile ? 'hidden' : 'auto', display: isMobile ? 'flex' : 'block', gap: '10px', overflowX: isMobile ? 'auto' : 'hidden', minHeight: 0 }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', opacity: 0.6 }}>
                <Users size={14} />
                <span style={{ fontSize: '0.8rem', letterSpacing: '2px', fontWeight: '600' }}>PLAYERS</span>
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '10px', minWidth: 'max-content', paddingBottom: isMobile ? '5px' : '0' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CustomAvatar config={playerAvatars[p]} size={40} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: isActive ? 'bold' : 'normal', color: hasGuessed ? '#33ff33' : (isActive ? '#ff33ff' : '#fff'), fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p} {isMe && <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>(You)</span>}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', color: '#ebd73f', flexShrink: 0, marginLeft: '10px' }}>
                      {gameState.scores[p] || 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {/* CENTER PANEL: Canvas / Overlays */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', order: isMobile ? 1 : 2, minWidth: 0, minHeight: 0 }}>
          <div style={{ ...styles.glassPanel, padding: isMobile ? '10px 15px' : '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: isMobile ? '5px' : '10px' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? '0.8rem' : '1rem', display: 'flex', alignItems: 'center', gap: isMobile ? '5px' : '10px', letterSpacing: '1px', flexWrap: 'wrap' }}>
              {gameState.status === 'choosing_word' ? (
                <>WAITING FOR <span style={{ color: '#ff33ff' }}>{players[gameState.currentTurnIndex]}</span> TO CHOOSE...</>
              ) : gameState.status === 'round_over' ? (
                <>ROUND OVER! THE WORD WAS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1rem' : '1.2rem' }}>{gameState.currentWord}</span></>
              ) : isMyTurn ? (
                <>DRAW THIS: <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1rem' : '1.2rem', background: 'rgba(235, 215, 63, 0.1)', padding: isMobile ? '2px 8px' : '5px 10px', borderRadius: '8px' }}>{gameState.currentWord}</span></>
              ) : (
                <>
                  <span style={{ color: '#ff33ff' }}>{players[gameState.currentTurnIndex]}</span> is drawing! 
                  <span style={{ fontFamily: 'monospace', fontSize: isMobile ? '1rem' : '1.2rem', letterSpacing: isMobile ? '1px' : '2px', marginLeft: isMobile ? '5px' : '10px', background: 'rgba(255,255,255,0.1)', padding: isMobile ? '2px 8px' : '5px 10px', borderRadius: '8px' }}>
                    {getMaskedWord(gameState.currentWord, gameState.revealedIndices)}
                  </span>
                </>
              )}
            </h2>
            {isMobile && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '30px' }}>
                  <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>RND</span>
                  <span style={{ fontFamily: "'Panchang', sans-serif", color: '#fff', fontSize: '0.7rem' }}>{gameState.currentRound}/{gameState.config.rounds}</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: '30px', border: gameState.timer <= 10 ? '1px solid #ff3333' : '1px solid rgba(255,255,255,0.1)' }}>
                  <Clock size={12} color={gameState.timer <= 10 ? '#ff3333' : '#ebd73f'} />
                  <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.7rem', color: gameState.timer <= 10 ? '#ff3333' : '#fff' }}>
                    {Math.max(0, gameState.timer)}s
                  </span>
                </div>
              </div>
            )}
            

          </div>
          
          <div style={{ 
              ...styles.glassPanel, 
              flex: isMobile ? 'none' : 1, 
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              width: '100%',
              aspectRatio: isMobile ? '4/3' : 'auto',
              position: 'relative',
              overflow: 'hidden',
              background: '#0a0a0a',
              cursor: isMyTurn && gameState.status === 'playing' ? 'crosshair' : 'default',
              boxShadow: isMyTurn && gameState.status === 'playing' ? '0 0 40px rgba(255,51,255,0.1) inset' : 'none',
          }}>
            
            {/* OVERLAYS */}
            {gameState.status === 'choosing_word' && (
              <div style={styles.overlay}>
                {isMyTurn ? (
                  <>
                    <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: isMobile ? '1.2rem' : '2rem', marginBottom: isMobile ? '15px' : '30px' }}>CHOOSE A WORD</h2>
                    <div style={{ display: 'flex', gap: isMobile ? '10px' : '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {gameState.wordChoices.map(w => (
                        <button key={w} onClick={() => handleSelectWord(w)} style={{ ...styles.wordChoiceBtn, padding: isMobile ? '12px 20px' : '20px 40px', fontSize: isMobile ? '1rem' : '1.5rem' }}>
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
            
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', minHeight: 0, padding: isMobile ? '0' : '10px', boxSizing: 'border-box' }}>
              {showConfetti && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Lottie animationData={confettiData} loop={false} style={{ width: '100%', height: '100%' }} />
                </div>
              )}
              <canvas 
                ref={canvasRef}
                width={800}
                height={600}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  aspectRatio: '4/3', 
                  display: 'block', 
                  touchAction: 'none',
                  background: '#0a0a0a',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderRadius: isMobile ? '0' : '12px',
                  boxShadow: '0 0 30px rgba(0,0,0,0.8)'
                }}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
              />
            </div>
          </div>
          
          {/* BRUSH CONTROLS */}
          {(
            <div style={{ 
              ...styles.glassPanel, 
              padding: isMobile ? '12px' : '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              background: 'linear-gradient(180deg, rgba(30,30,30,0.8) 0%, rgba(10,10,10,0.95) 100%)',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              position: 'relative',
              opacity: (isMyTurn && gameState.status === 'playing') ? 1 : 0.4,
              pointerEvents: (isMyTurn && gameState.status === 'playing') ? 'auto' : 'none'
            }}>
              
              {/* Top Row: Tools & Brush Styles */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                
                {/* Tools (Brush / Fill) */}
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <button
                    onClick={() => setActiveTool('Brush')}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: activeTool === 'Brush' ? 'linear-gradient(135deg, #ff33ff 0%, #ebd73f 100%)' : 'transparent',
                      border: 'none', color: activeTool === 'Brush' ? '#000' : '#fff', cursor: 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s',
                      boxShadow: activeTool === 'Brush' ? '0 0 15px rgba(255,51,255,0.4)' : 'none'
                    }}
                  ><Pen size={20} /></button>
                  <button
                    onClick={() => setActiveTool('Fill')}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: activeTool === 'Fill' ? 'linear-gradient(135deg, #ff33ff 0%, #ebd73f 100%)' : 'transparent',
                      border: 'none', color: activeTool === 'Fill' ? '#000' : '#fff', cursor: 'pointer',
                      display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s',
                      boxShadow: activeTool === 'Fill' ? '0 0 15px rgba(255,51,255,0.4)' : 'none'
                    }}
                  ><PaintBucket size={20} /></button>
                </div>

                {/* Brush Styles */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '10px', margin: '-10px', scrollbarWidth: 'none' }}>
                  {['Neon', 'Solid', 'Marker', 'Glow', 'Crayon', 'Airbrush', 'Rainbow', 'Dotted'].map(st => {
                    const isActive = brushStyle === st;
                    return (
                      <button 
                        key={st} onClick={() => setBrushStyle(st)}
                        style={{
                          padding: '8px 16px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: isActive ? 'bold' : 'normal',
                          background: isActive ? 'linear-gradient(135deg, #ff33ff 0%, #ebd73f 100%)' : 'rgba(255,255,255,0.05)',
                          border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                          cursor: 'pointer', color: isActive ? '#000' : '#fff',
                          boxShadow: isActive ? '0 0 20px rgba(255,51,255,0.4)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: isActive ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                        onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'scale(1)'; } }}
                      >
                        {st}
                      </button>
                    )
                  })}
                </div>

                {/* Actions (Undo, Redo, Clear) */}
                <div style={{ display: 'flex', gap: isMobile ? '20px' : '12px', background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={undo} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'}} onMouseLeave={e => {e.currentTarget.style.opacity = 0.7; e.currentTarget.style.transform = 'scale(1)'}}><Undo2 size={24} /></button>
                  <button onClick={redo} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1)'}} onMouseLeave={e => {e.currentTarget.style.opacity = 0.7; e.currentTarget.style.transform = 'scale(1)'}}><Redo2 size={24} /></button>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <button onClick={clearCanvas} style={{ background: 'transparent', border: 'none', color: '#ff3333', cursor: 'pointer', opacity: 0.8, transition: 'all 0.2s' }} onMouseEnter={e => {e.currentTarget.style.opacity = 1; e.currentTarget.style.transform = 'scale(1.1); filter: drop-shadow(0 0 8px #ff3333)'}} onMouseLeave={e => {e.currentTarget.style.opacity = 0.8; e.currentTarget.style.transform = 'scale(1); filter: none'}}><Trash2 size={24} /></button>
                </div>
              </div>

              {/* Bottom Row: Colors & Sizes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                
                {/* Color Ribbon */}
                <div style={{ 
                  display: 'flex', gap: '12px', overflowX: 'auto', padding: '15px 10px', margin: '-10px 0',
                  scrollbarWidth: 'none', flex: 1, maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' 
                }}>
                  <div style={{ width: '5px', flexShrink: 0 }} /> {/* spacer */}
                  {BRUSH_COLORS.map(c => {
                    const isActive = brushColor === c;
                    const isEraser = c === '#0a0a0a';
                    return (
                      <button 
                        key={c}
                        onClick={() => setBrushColor(c)}
                        style={{
                          width: isActive ? '36px' : '30px', height: isActive ? '36px' : '30px', 
                          borderRadius: '50%', background: c,
                          border: isActive ? '3px solid #fff' : (isEraser ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.2)'),
                          cursor: 'pointer', flexShrink: 0,
                          boxShadow: !isEraser && isActive ? `0 0 20px ${c}` : (isEraser ? 'inset 0 0 10px rgba(255,255,255,0.2)' : '0 4px 6px rgba(0,0,0,0.3)'),
                          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          transform: isActive ? 'translateY(-4px)' : 'translateY(0)',
                          display: 'flex', justifyContent: 'center', alignItems: 'center'
                        }}
                        title={isEraser ? 'Eraser' : 'Color'}
                        onMouseEnter={e => { if(!isActive) e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={e => { if(!isActive) e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        {isEraser && <Eraser size={14} color="#fff" opacity={0.7} />}
                      </button>
                    )
                  })}
                  <div style={{ width: '5px', flexShrink: 0 }} /> {/* spacer */}
                </div>

                {/* Brush Sizes */}
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {[2, 6, 12, 24].map(s => {
                    const isActive = brushSize === s;
                    return (
                      <button 
                        key={s} onClick={() => setBrushSize(s)}
                        style={{
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                          border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent', cursor: 'pointer',
                          display: 'flex', justifyContent: 'center', alignItems: 'center',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={e => { if(!isActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ 
                          width: s, height: s, background: isActive ? '#fff' : 'rgba(255,255,255,0.5)', 
                          borderRadius: '50%', transition: 'all 0.2s', boxShadow: isActive ? '0 0 10px rgba(255,255,255,0.5)' : 'none' 
                        }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Chat */}
        {(!isMobile || isMobileChatOpen) && (
          <div style={{ 
            ...styles.glassPanel, 
            ...(isMobile ? {
              position: 'fixed', top: 'auto', left: 0, right: 0, bottom: 0, height: '60vh', zIndex: 1000,
              borderRadius: '24px 24px 0 0', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(255,51,255,0.2)', border: '1px solid rgba(255,51,255,0.4)', background: 'rgba(10,10,10,0.95)', borderBottom: 'none'
            } : {
              order: 3, width: '320px'
            }),
            display: 'flex', flexDirection: 'column', minHeight: 0
          }}>
            {isMobile && (
               <button onClick={() => setIsMobileChatOpen(false)} style={{position: 'absolute', top: 15, right: 15, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', zIndex: 10, borderRadius: '50%', width: 36, height: 36, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                 <X size={20} />
               </button>
            )}
            <div style={{ padding: isMobile ? '25px 20px 15px 20px' : '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '1px', fontFamily: "'Panchang', sans-serif", textAlign: isMobile ? 'center' : 'left' }}>LIVE CHAT</h3>
            </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
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
                placeholder={gameState.status !== 'playing' ? "Chat..." : (gameState.guessedPlayers.includes(playerName) ? "Chat (You guessed it!)..." : (isMyTurn ? "Chat (don't cheat!)..." : "Guess here..."))}
                style={{
                  flex: 1, padding: '12px 15px', background: 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
                  borderRadius: '12px', outline: 'none', transition: 'all 0.3s',
                  fontFamily: "'Clash Display', sans-serif"
                }}
              />
              <button 
                type="submit"
                disabled={!guess.trim()}
                style={{
                  padding: '0 15px', background: '#ff33ff', color: '#000',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
        )}

        {/* MOBILE OVERLAYS & FABs */}
        {isMobile && (
          <>
            <button 
              onClick={() => setIsMobileLeaderboardOpen(true)}
              style={{ position: 'fixed', top: '15px', right: '15px', zIndex: 90, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ebd73f', backdropFilter: 'blur(10px)' }}
            >
              <Trophy size={20} />
            </button>

            <div style={{ position: 'fixed', bottom: (isMyTurn && gameState.status === 'playing') ? '140px' : '15px', right: '15px', zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', transition: 'bottom 0.3s' }}>
              {latestMobileMessage && !isMobileChatOpen && (
                <div style={{ background: 'rgba(255,51,255,0.9)', color: '#000', padding: '10px 15px', borderRadius: '15px 15px 0 15px', maxWidth: '200px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(255,51,255,0.4)', animation: 'fadeInUp 0.3s ease-out', wordBreak: 'break-word' }}>
                  <span style={{opacity: 0.6, fontSize: '0.6rem', display: 'block'}}>{latestMobileMessage.sender}</span>
                  {latestMobileMessage.text}
                </div>
              )}
              <button 
                onClick={() => setIsMobileChatOpen(true)}
                style={{ background: '#ff33ff', border: 'none', borderRadius: '50%', width: '55px', height: '55px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#000', boxShadow: '0 5px 20px rgba(255,51,255,0.4)' }}
              >
                <MessageSquare size={24} />
              </button>
            </div>
            <style>{`
              @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </>
        )}

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
    gap: '15px',
    padding: '10px',
    height: '100%',
    minHeight: '100vh',
    boxSizing: 'border-box',
    maxWidth: '1600px',
    margin: '0 auto',
    paddingTop: '60px' // Leave room for mobile back button at top left
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
