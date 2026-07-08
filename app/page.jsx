"use client";
import { customAlert } from './utils/customAlert';

import { useEffect, useRef, useState, memo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { createScoreGuard } from "./lib/scoreGuard";
import AuthModal from './components/AuthModal';
import ProfileWidget from './components/ProfileWidget';
import { generateScoreImage } from './utils/shareUtils';

const CustomCursor = memo(() => {
  return <div className="cursor"></div>;
});

export default function ComingSoon() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  

  // Game States
  const [activeGame, setActiveGame] = useState('dripp'); // 'dripp', 'breaker', 'none'
  const activeGameRef = useRef('dripp');
  
  const [score, setScore] = useState(0); // Dripp starts at 0
  const scoreRef = useRef(0);
  
  const [breakerScore, setBreakerScore] = useState(0); 
  const breakerScoreRef = useRef(0);
  
  const [breakerLevel, setBreakerLevel] = useState(1);
  const breakerLevelRef = useRef(1);
  
  const [hideHero, setHideHero] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState('signup');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'failed'
  const [isCapturing, setIsCapturing] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [pregeneratedShareUrl, setPregeneratedShareUrl] = useState(null);
  const [showRetryTooltip, setShowRetryTooltip] = useState(false);

  // Trial Gate States
  const [playCount, setPlayCount] = useState(0);
  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const highScoreRef = useRef(0);
  // displayHighScore drives the UI — highScoreRef is used for comparison in game logic.
  // We need both: ref for synchronous in-frame access, state to trigger re-renders.
  const [displayHighScore, setDisplayHighScore] = useState(0);

  useEffect(() => {
    try {
      const storedCount = localStorage.getItem('dripp_playCount');
      if (storedCount) setPlayCount(parseInt(storedCount, 10));
      
      const userStr = localStorage.getItem('dripp_user');
      let userObj = null;
      if (userStr) {
          const authToken = localStorage.getItem('dripp_auth_token');
          if (!authToken) {
              localStorage.removeItem('dripp_user');
              setHasSignedUp(false);
          } else {
              setHasSignedUp(true);
              try { userObj = JSON.parse(userStr); } catch(e) {}
          }
      }

      // Load high score from DB only (never trust localStorage as source of truth for DB)
      if (userObj && userObj.email) {
          const authToken = localStorage.getItem('dripp_auth_token') || '';
          fetch('/api/arcade/highscore', {
             headers: { 'Authorization': `Bearer ${authToken}` }
          })
          .then(res => res.json())
          .then(data => {
              if (data && data.highscore !== undefined) {
                  const dbHigh = data.highscore || 0;
                  // Always use DB value as the source of truth
                  highScoreRef.current = dbHigh;
                  setDisplayHighScore(dbHigh);
                  localStorage.setItem('dripp_highScore', dbHigh.toString());
              }
          }).catch(e => console.error("Error fetching highscore", e));
      } else {
          // Guest: just read localStorage (won't be synced to DB)
          const cachedHighScore = localStorage.getItem('dripp_highScore');
          if (cachedHighScore) {
              const val = parseInt(cachedHighScore, 10);
              highScoreRef.current = val;
              setDisplayHighScore(val);
          }
      }
    } catch(e) {}
  }, []);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(false);
    // NOTE: We intentionally do NOT sync localStorage → DB here anymore.
    // All score saves go through /api/submit-score (server-side validated).
    try {
      const res = await fetch('/api/arcade/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      
      if (data && data.leaderboard) {
        setLeaderboardData(data.leaderboard);
      } else {
        setLeaderboardError(true);
      }
    } catch (e) {
       console.error("Leaderboard catch error:", e);
       setLeaderboardError(true);
    }
    setLeaderboardLoading(false);
  };

  useEffect(() => {
     if (showLeaderboard) {
        fetchLeaderboard();
     }
  }, [showLeaderboard]);

  useEffect(() => {
    if (gameState === 'failed' && !hasSignedUp) {
      setPlayCount(prev => {
        const newCount = prev + 1;
        if (typeof window !== 'undefined') {
          localStorage.setItem('dripp_playCount', newCount.toString());
        }
        if (newCount > 0 && newCount % 2 === 0) {
          setShowSignupModal(true);
        }
        return newCount;
      });
    }

    // High Score tracking – route through secure server API (no direct DB writes)
    if (gameState === 'failed' && activeGame === 'dripp') {
       if (score > highScoreRef.current) {
          highScoreRef.current = score;
          setDisplayHighScore(score);
          localStorage.setItem('dripp_highScore', score.toString());
          const userStr = localStorage.getItem('dripp_user');
          if (userStr) {
             (async () => {
               try {
                  const userObj = JSON.parse(userStr);
                  if (userObj.email && scoreGuardRef.current && !scoreGuardRef.current.isCheated()) {
                     // Step 1: Request a server-signed score-commit HMAC.
                     // This cryptographically binds the exact score to this session,
                     // so the server can reject any forged or replayed score values.
                     const committed = await scoreGuardRef.current.commitScore(userObj.email);
                     if (!committed) {
                        console.warn('Score guard: could not obtain score-commit – not submitting.');
                        return;
                     }

                     // Step 2: Build payload (now includes scoreCommit)
                     const payload = scoreGuardRef.current.getSubmissionPayload(userObj.email);
                     if (payload && !scoreGuardRef.current.isCheated()) {
                        // Step 3: Submit to server
                        const authToken = localStorage.getItem('dripp_auth_token') || '';
                        fetch('/api/submit-score', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                          },
                          body: JSON.stringify(payload),
                        }).then(r => r.json()).then(data => {
                          if (data.ok) console.log('Score saved securely:', data.highscore);
                          else console.warn('Score rejected by server:', data.error);
                        }).catch(e => console.error('Score submit error:', e));
                     } else {
                        console.warn('Score guard flagged cheated session – not submitting.');
                     }
                  }
               } catch (e) {
                  console.error("Error submitting score:", e);
               }
             })();
          }
       }
    }
  }, [gameState, hasSignedUp, activeGame, score]);
  
  const isPausedRef = useRef(false);
  
  const gameStateRef = useRef('playing');
  
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);
  const lastMilestoneRef = useRef(0);

  // Anti-cheat score guard — lives in a closure, never exposed to React state
  const scoreGuardRef = useRef(createScoreGuard());
  const [cheatedSession, setCheatedSession] = useState(false);

  // Sync state to ref for the animation loop
  useEffect(() => {
    activeGameRef.current = activeGame;
    // Reset scores when switching
    if (activeGame === 'breaker') {
      breakerScoreRef.current = 0;
      setBreakerScore(0);
      breakerLevelRef.current = 1;
      setBreakerLevel(1);
      setGameState('playing');
      setIsPaused(false);
      if (window.initBreakerGame) window.initBreakerGame(1); 
    } else if (activeGame === 'dripp') {
      scoreRef.current = 0;
      setScore(0);
      scoreGuardRef.current.reset();
      setCheatedSession(false);
      setGameState('playing');
      setIsPaused(false);
      // Init a new signed session token for this game session
      try {
        const userStr = localStorage.getItem('dripp_user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj.email) scoreGuardRef.current.initSession(userObj.email);
        }
      } catch(e) {}
    }
  }, [activeGame]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game Engine
  useEffect(() => {
    setIsTouch(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
    document.body.classList.add('loaded');
    
    let lastTouchTime = 0;

    const moveCursor = (e) => {
      // Allow cursor to update coordinates always, so UI is clickable while paused
      if (e.type.startsWith('touch')) {
        lastTouchTime = Date.now();
        if (e.touches && e.touches.length > 0) {
          if (activeGameRef.current !== 'none' && gameStateRef.current === 'playing' && !isPausedRef.current) {
            const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
            if (tag === 'canvas' || tag === 'body' || (e.target.classList && e.target.classList.contains('hero'))) {
               e.preventDefault(); // Stop mobile scrolling/refreshing while playing on canvas
            }
          }
          mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          const cursorElem = document.querySelector('.cursor');
          if (cursorElem) cursorElem.style.display = 'none'; // Hide cursor on touch
        }
      } else {
        // Ignore synthetic mouse events fired right after touch end
        if (Date.now() - lastTouchTime < 500) return;
        if (e.clientX !== undefined) {
          mouseRef.current = { x: e.clientX, y: e.clientY };
          const cursorElem = document.querySelector('.cursor');
          if (cursorElem && cursorElem.style.display === 'none') {
             cursorElem.style.display = 'flex'; // Restore cursor on mouse move
          }
        }
      }
      
      const cursorElem = document.querySelector('.cursor');
      if (cursorElem && cursorElem.style.display !== 'none') {
        gsap.to(cursorElem, {
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          xPercent: -50,
          yPercent: -50,
          duration: 0.05,
          ease: "power3.out"
        });
      }
    };

    const handleTouchEnd = (e) => {
       lastTouchTime = Date.now();
       if (e.touches.length === 0) {
         mouseRef.current = { x: -100, y: -100 };
       }
    };
    
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("touchmove", moveCursor, { passive: false });
    window.addEventListener("touchstart", moveCursor, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    // --- GAME LOGIC ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    // Dripp Game Arrays
    let drops = [];
    let splashes = [];
    let miniParticles = [];
    let fireworks = [];
    
    // Breaker Game Arrays
    let bricks = [];
    let balls = [];
    let powerUps = [];
    let paddle = null;

    let isMobileCanvas = typeof window !== 'undefined' && window.innerWidth <= 768;

    const resize = () => {
      canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
      canvas.height = window.innerHeight || document.documentElement.clientHeight || 800;
      isMobileCanvas = window.innerWidth <= 768;
    };
    window.addEventListener('resize', resize);
    resize();

    class Drop {
      constructor(isRed = false) {
        this.x = Math.random() * canvas.width;
        this.y = -50 - Math.random() * 100; // Randomise start Y position slightly
        this.isWhite = !isRed && Math.random() < 0.05; // 5% chance of white drop
        this.isBomb = Math.random() < 0.15; // 15% chance of bomb
        this.isRed = !this.isBomb && isRed;
        
        // Logarithmic difficulty scaling prevents sudden spikes when catching 69-point White drops
        let speedMult;
        if (!isMobileCanvas) {
           // PC version: slower speed to make game more manageable
           speedMult = 1.1 + Math.log10(1 + scoreRef.current / 200) * 0.45; 
        } else {
           speedMult = 1 + Math.log10(1 + scoreRef.current / 300) * 0.4; 
        }
        const mobileSpeedMult = isMobileCanvas ? 0.9 : 1.0;
        
        // Randomise speed and gravity more broadly
        this.vy = (1.0 + Math.random() * 3.5) * speedMult * mobileSpeedMult; 
        this.gravity = (0.005 + Math.random() * 0.02) * speedMult * mobileSpeedMult; 
        
        this.radius = 2 + Math.random() * 2; 
        this.length = this.vy * 3; // Make trail slightly longer
        this.markedForDeletion = false;
        
        if (this.isBomb) {
           this.color = '#333333'; // Bomb color
           this.radius = 4;
        } else if (this.isWhite) {
           this.color = '#ffffff'; // White
        } else {
           this.color = this.isRed ? 'rgba(235, 63, 63, 0.9)' : 'rgba(235, 215, 63, 0.9)'; 
        }
        
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = (0.02 + Math.random() * 0.04) * (1 + scoreRef.current * 0.005);
      }
      update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.x += Math.sin(this.wobble) * 1.2; 
        this.wobble += this.wobbleSpeed;
        this.length = this.vy * 2;

        if (this.y > canvas.height + this.length) {
          this.markedForDeletion = true;
        }
        
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const hitRadius = cursorActiveRef.current ? 40 : (isMobileCanvas ? 60 : 35);

        if (distance < hitRadius) {
          this.markedForDeletion = true;
          
          const cursor = document.querySelector('.cursor');
          if (cursor) {
             cursor.classList.add('eating');
             if (window.cursorEatingTimeout) clearTimeout(window.cursorEatingTimeout);
             window.cursorEatingTimeout = setTimeout(() => {
                if (cursor) cursor.classList.remove('eating');
             }, 150);
          }
          
          if (this.isBomb) {
             setGameState('failed');
             for(let i=0; i<30; i++) fireworks.push(new FireworkParticle(this.x, this.y, null, true));
             
             // Playful Screen Shake Effect
             const canvasEl = document.querySelector('canvas');
             if (canvasEl) {
                canvasEl.style.transition = 'none';
                let shakes = 15;
                const shakeInterval = setInterval(() => {
                   const offsetX = (Math.random() - 0.5) * 40;
                   const offsetY = (Math.random() - 0.5) * 40;
                   canvasEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                   shakes--;
                   if (shakes <= 0) {
                      clearInterval(shakeInterval);
                      canvasEl.style.transform = `translate(0px, 0px) translateZ(0)`;
                      canvasEl.style.transition = 'opacity 0.5s ease';
                   }
                }, 40);
             }
             return;
          } else if (this.isWhite) {
              const result = scoreGuardRef.current.tryAddScore(69);
              if (result.ok) {
                scoreRef.current = result.score;
                setScore(result.score);
              } else if (result.cheated) {
                setCheatedSession(true);
              }
              for(let i=0; i<40; i++) fireworks.push(new FireworkParticle(this.x, this.y, '#ffffff'));
           } else if (this.isRed) {
              const result = scoreGuardRef.current.tryAddScore(5);
              if (result.ok) {
                scoreRef.current = result.score;
                setScore(result.score);
              } else if (result.cheated) {
                setCheatedSession(true);
              }
           } else {
              const result = scoreGuardRef.current.tryAddScore(1);
              if (result.ok) {
                scoreRef.current = result.score;
                setScore(result.score);
              } else if (result.cheated) {
                setCheatedSession(true);
              }
           }
           
           const curScore = scoreRef.current;
           const addedDelta = this.isWhite ? 69 : (this.isRed ? 5 : 1);
           const preMilestoneScore = curScore - addedDelta;
           
           if (Math.floor(curScore / 100) > Math.floor(preMilestoneScore / 100)) {
             const scoreCounter = document.querySelector('.score-counter-element');
             if (scoreCounter) {
                gsap.fromTo(scoreCounter, { scale: 1.5, color: '#ffffff', textShadow: '0 0 30px #ffffff' }, { scale: 1, color: 'var(--brand-yellow)', textShadow: '0 0 20px rgba(235, 215, 63, 0.4)', duration: 0.8, ease: 'elastic.out(1, 0.4)' });
             }
           }
           
           if (curScore > 50 && curScore % 50 === 0 && curScore !== lastMilestoneRef.current) {
            lastMilestoneRef.current = curScore;
            triggerMilestoneAnimation(this.x, this.y);
           }

          splashes.push(new Splash(this.x, this.y, this.isRed, this.isWhite));
          for (let i = 0; i < 6; i++) {
            miniParticles.push(new MiniParticle(this.x, this.y, this.isRed, this.isWhite ? '#ffffff' : null));
          }
        }
      }
      draw(ctx) {
        ctx.beginPath();
        if (this.isBomb) {
           ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
           ctx.fillStyle = '#111';
           ctx.fill();
           ctx.strokeStyle = '#ff0000';
           ctx.lineWidth = 1.5;
           ctx.stroke();
           ctx.beginPath();
           ctx.moveTo(this.x, this.y - this.radius * 1.5);
           ctx.lineTo(this.x + 3, this.y - this.radius * 2.5);
           ctx.strokeStyle = '#fff';
           ctx.stroke();
        } else {
           const stretch = Math.min(this.vy * 1.2, this.radius * 5);
           ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
           ctx.lineTo(this.x, this.y - stretch);
           ctx.fillStyle = this.color;
           ctx.fill();
        }
        ctx.closePath();
        
        // Fake Glow (Performance optimized)
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        if (this.isWhite) ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        else if (this.isBomb) ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
        else ctx.fillStyle = this.isRed ? 'rgba(235, 63, 63, 0.15)' : 'rgba(235, 215, 63, 0.15)';
        ctx.fill();
        ctx.closePath();
      }
    }

    class Shockwave {
      constructor(x, y, color) {
         this.x = x; this.y = y;
         this.radius = 5;
         this.alpha = 1;
         this.color = color;
         this.markedForDeletion = false;
      }
      update() {
         this.radius += 8;
         this.alpha -= 0.05;
         if (this.alpha <= 0) this.markedForDeletion = true;
      }
      draw(ctx) {
         ctx.globalAlpha = Math.max(0, this.alpha);
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
         ctx.strokeStyle = this.color;
         ctx.lineWidth = 2 + (this.alpha * 3);
         ctx.stroke();
         ctx.globalAlpha = 1;
      }
    }

    class Paddle {
      constructor() {
        this.baseW = Math.max(60, Math.min(120, canvas.width / 3));
        this.w = this.baseW;
        this.h = 10;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.tilt = 0;
        this.widthModifier = 1;
        this.modifierTimer = 0;
      }
      update() {
        if (this.modifierTimer > 0) {
           this.modifierTimer -= 16; // approx 16ms per frame
           if (this.modifierTimer <= 0) this.widthModifier = 1;
        }
        
        // Smoothly interpolate current width to target width
        const targetW = this.baseW * this.widthModifier;
        this.w += (targetW - this.w) * 0.1;
        const targetX = mouseRef.current.x;
        const dx = targetX - this.x;
        this.vx = dx * 0.2; 
        this.x += this.vx;
        
        // Tilt physics based on velocity
        const targetTilt = (this.vx / 30) * (Math.PI / 8); // Max tilt ~22.5 deg
        this.tilt += (targetTilt - this.tilt) * 0.3;
        
        // Clamp to screen
        if (this.x - this.w/2 < 0) this.x = this.w/2;
        if (this.x + this.w/2 > canvas.width) this.x = canvas.width - this.w/2;
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);
        
        // Fake Glow
        ctx.beginPath();
        ctx.roundRect(-this.w/2, -this.h/2, this.w, this.h, this.h/2);
        ctx.fillStyle = 'rgba(235, 215, 63, 0.15)';
        ctx.lineWidth = 15;
        ctx.strokeStyle = 'rgba(235, 215, 63, 0.1)';
        ctx.stroke();
        
        // Core Line
        ctx.beginPath();
        ctx.roundRect(-this.w/2, -this.h/2, this.w, this.h, this.h/2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.restore();
      }
    }

    class Ball {
      constructor(x, y, vx, vy) {
        this.radius = 6;
        this.x = x || canvas.width / 2;
        this.y = y || canvas.height - 140;
        this.vx = vx || 6 * (Math.random() > 0.5 ? 1 : -1);
        this.vy = vy || -7;
        this.trail = [];
        this.markedForDeletion = false;
        this.speedLimit = 12;
      }
      update(paddle, targets) {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        
        // Wall Bounces
        if (this.x - this.radius <= 0) { this.x = this.radius; this.vx *= -1; }
        if (this.x + this.radius >= canvas.width) { this.x = canvas.width - this.radius; this.vx *= -1; }
        if (this.y - this.radius <= 0) { this.y = this.radius; this.vy *= -1; }
        
        // Floor drop
        if (this.y > canvas.height + 20) {
           this.markedForDeletion = true;
        }
        
        // Paddle Collision (Physics based on Tilt)
        // Simple bounding circle vs rotated line approximation
        const dx = this.x - paddle.x;
        const dy = this.y - paddle.y;
        
        // Rotate ball position backwards by paddle tilt to do AABB logic
        const cos = Math.cos(-paddle.tilt);
        const sin = Math.sin(-paddle.tilt);
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        if (
          localX > -paddle.w/2 && localX < paddle.w/2 &&
          Math.abs(localY) < paddle.h/2 + this.radius &&
          this.vy > 0
        ) {
          // Reflect velocity based on paddle tilt
          // Normal of the paddle is (sin(tilt), -cos(tilt))
          const nx = Math.sin(paddle.tilt);
          const ny = -Math.cos(paddle.tilt);
          
          const dot = this.vx * nx + this.vy * ny;
          this.vx = this.vx - 2 * dot * nx;
          this.vy = this.vy - 2 * dot * ny;
          
          // Add some of paddle's horizontal velocity to ball
          this.vx += paddle.vx * 0.2;
          
          // Clamp speed
          const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
          if (speed > this.speedLimit) {
             this.vx = (this.vx / speed) * this.speedLimit;
             this.vy = (this.vy / speed) * this.speedLimit;
          }
          
          // Force ball slightly upwards to prevent getting stuck
          if (this.vy > -3) this.vy = -5;
          this.y -= 5; 
          
          // Small shockwave
          fireworks.push(new Shockwave(this.x, this.y, '#ffffff'));
        }
        
        // Target Collision
        for(let t of targets) {
           if (!t.markedForDeletion) {
              const dist = Math.hypot(this.x - t.x, this.y - t.y);
              if (dist < this.radius + t.radius) {
                 t.hit();
                 
                 if (piercingTimer <= 0) {
                   // Reflect vector
                   const nx = (this.x - t.x) / dist;
                   const ny = (this.y - t.y) / dist;
                   const dot = this.vx * nx + this.vy * ny;
                   this.vx = this.vx - 2 * dot * nx;
                   this.vy = this.vy - 2 * dot * ny;
                 }
                 
                 breakerScoreRef.current += 10;
                 setBreakerScore(breakerScoreRef.current);
                 
                 // Drop chance starts at 25% and drops by 1% per level, floor at 10%
                 const dropChance = Math.max(0.1, 0.25 - (breakerLevelRef.current * 0.01));
                 if (Math.random() < dropChance) powerUps.push(new PowerUp(t.x, t.y, breakerLevelRef.current));
                 
                 if (piercingTimer <= 0) break; // If piercing, can hit multiple in one frame!
              }
           }
        }
      }
      draw(ctx) {
        // Piercing Fireball effect
        if (piercingTimer > 0) {
           ctx.beginPath();
           ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI*2);
           ctx.fillStyle = 'rgba(235, 63, 63, 0.3)';
           ctx.fill();
        }
        // High Performance Fading Trail
        for (let i = 0; i < this.trail.length; i++) {
           const point = this.trail[i];
           const ratio = i / this.trail.length;
           ctx.globalAlpha = ratio * 0.5;
           ctx.beginPath();
           ctx.arc(point.x, point.y, this.radius * (0.5 + ratio * 0.5), 0, Math.PI*2);
           ctx.fillStyle = '#ffffff';
           ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Main Ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Fake Glow
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      }
    }

    class TargetRing {
       constructor(x, y) {
         this.x = x; 
         this.y = y; 
         const scale = Math.min(canvas.width / 800, 1);
         this.baseRadius = (15 + Math.random() * 10) * Math.max(0.6, scale);
         this.radius = this.baseRadius;
         this.markedForDeletion = false;
         this.color = Math.random() > 0.5 ? '#ebd73f' : '#ffffff';
         this.phase = Math.random() * Math.PI * 2;
         this.health = 1;
       }
       update() {
         this.phase += 0.05;
         this.radius = this.baseRadius + Math.sin(this.phase) * 3;
         if (this.health >= 3) {
            this.color = '#ff00ff'; // Magenta for very high health
         } else if (this.health === 2) {
            this.color = '#33ccff'; // Shield color
         } else if (this.health === 1 && (this.color === '#33ccff' || this.color === '#ff00ff')) {
            this.color = Math.random() > 0.5 ? '#ebd73f' : '#ffffff'; // Revert back when shield breaks
         }
       }
       hit() {
         this.health -= 1;
         fireworks.push(new Shockwave(this.x, this.y, this.color));
         if (this.health <= 0) {
            this.markedForDeletion = true;
         } else {
            // Revert color when shield broken
            this.color = Math.random() > 0.5 ? '#ebd73f' : '#ffffff';
         }
       }
       draw(ctx) {
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
         ctx.strokeStyle = this.color;
         ctx.lineWidth = this.health > 1 ? 4 : 2;
         ctx.stroke();
         
         // Inner dot
         ctx.beginPath();
         ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
         ctx.fillStyle = this.color;
         ctx.fill();
       }
    }

    class PowerUp {
       constructor(x, y, level = 1) {
          this.x = x; this.y = y;
          this.vy = 2.5 + Math.random() * 1.5;
          this.radius = 6;
          
          // Difficulty scaling for powerups
          // Base bad chance is 30%. Increases by 5% per level up to max 80%.
          const badChance = Math.min(0.8, 0.3 + (level * 0.05)); 
          
          const rand = Math.random();
          
          if (rand < badChance) {
             // Split bad drops evenly between shrink and shield
             this.type = Math.random() < 0.5 ? 'shrink_paddle' : 'shield_targets';
          } else {
             // Split good drops among the remaining probability pool
             const goodRand = Math.random();
             if (goodRand < 0.25) this.type = 'multiball';
             else if (goodRand < 0.5) this.type = 'points';
             else if (goodRand < 0.75) this.type = 'wide_paddle';
             else this.type = 'piercing';
          }
          
          this.markedForDeletion = false;
       }
       
       getColor() {
          switch(this.type) {
             case 'multiball': return '#ff00ff';
             case 'points': return '#00ffcc';
             case 'wide_paddle': return '#33ff33';
             case 'piercing': return '#ebd73f';
             case 'shrink_paddle': return '#ff3333';
             case 'shield_targets': return '#33ccff';
             default: return '#ffffff';
          }
       }
       
       update(paddle, targets) {
          this.y += this.vy;
          if (this.y > canvas.height + 20) this.markedForDeletion = true;
          
          if (
            this.y + this.radius >= paddle.y - paddle.h &&
            this.y - this.radius <= paddle.y + paddle.h &&
            this.x >= paddle.x - paddle.w/2 &&
            this.x <= paddle.x + paddle.w/2
          ) {
             this.markedForDeletion = true;
             
             if (this.type === 'multiball') {
                 balls.push(new Ball(paddle.x, paddle.y - 20, -4, -6));
                 balls.push(new Ball(paddle.x, paddle.y - 20, 4, -6));
             } else if (this.type === 'points') {
                 breakerScoreRef.current += 50; 
                 setBreakerScore(breakerScoreRef.current);
             } else if (this.type === 'wide_paddle') {
                 paddle.widthModifier = 1.5;
                 paddle.modifierTimer = 10000; // 10 seconds
             } else if (this.type === 'shrink_paddle') {
                 paddle.widthModifier = 0.6;
                 paddle.modifierTimer = 5000; // 5 seconds
             } else if (this.type === 'piercing') {
                 piercingTimer = 5000; // 5 seconds
             } else if (this.type === 'shield_targets') {
                 // Add shield to 3 random targets
                 const unshielded = targets.filter(t => t.health === 1);
                 for (let i = 0; i < 3 && unshielded.length > 0; i++) {
                    const idx = Math.floor(Math.random() * unshielded.length);
                    unshielded[idx].health = 2;
                    unshielded.splice(idx, 1);
                 }
             }
             
             const color = this.getColor();
             fireworks.push(new Shockwave(this.x, this.y, color));
          }
       }
       draw(ctx) {
          const color = this.getColor();
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Fake glow
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI*2);
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = 1;
       }
    }

    class MiniParticle {
      constructor(x, y, isRed, overrideColor = null) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 1 + Math.random() * 2.5;
        this.color = overrideColor ? overrideColor : (isRed ? 'rgba(235, 63, 63, 1)' : 'rgba(235, 215, 63, 1)');
        this.alpha = 1;
        this.friction = 0.90;
        this.markedForDeletion = false;
      }
      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha = Math.max(0, this.alpha - 0.04); 
        if (this.alpha === 0) this.markedForDeletion = true;
      }
      draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Splash {
      constructor(x, y, isRed, isWhite = false) {
        this.x = x; this.y = y;
        this.radius = 2;
        this.alpha = 1;
        this.isRed = isRed;
        this.isWhite = isWhite;
        this.markedForDeletion = false;
        this.expansionSpeed = 8;
      }
      update() {
        this.radius += this.expansionSpeed;
        this.expansionSpeed *= 0.88; 
        this.alpha = Math.max(0, this.alpha - 0.04); 
        if (this.alpha === 0) {
          this.markedForDeletion = true;
        }
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.isWhite) ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        else ctx.strokeStyle = this.isRed ? `rgba(235, 63, 63, ${this.alpha})` : `rgba(235, 215, 63, ${this.alpha})`;
        ctx.lineWidth = Math.max(0.1, 3 * this.alpha);
        ctx.stroke();
        ctx.closePath();
      }
    }

    class FireworkParticle {
      constructor(x, y, overrideColor = null, isPlayful = false) {
        this.x = x; this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 15;
        this.speedX = Math.cos(angle) * velocity;
        this.speedY = Math.sin(angle) * velocity;
        this.radius = 1.5 + Math.random() * 4;
        this.color = overrideColor ? overrideColor : (Math.random() > 0.5 ? '#ebd73f' : '#ffffff');
        this.alpha = 1;
        this.friction = 0.95;
        this.gravity = 0.2;
        this.markedForDeletion = false;
        
        this.isPlayful = isPlayful;
        if (this.isPlayful) {
           const emojis = ['💥', '💀', '😵', '🧨', '💣', '💨'];
           this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
           this.radius = 15 + Math.random() * 25; // Size of emoji
           this.rotation = Math.random() * Math.PI * 2;
           this.rotSpeed = (Math.random() - 0.5) * 0.4;
        }
      }
      update() {
        this.speedX *= this.friction;
        this.speedY *= this.friction;
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.isPlayful) this.rotation += this.rotSpeed;
        this.alpha = Math.max(0, this.alpha - 0.02); 
        if (this.alpha === 0) this.markedForDeletion = true;
      }
      draw(ctx) {
        ctx.globalAlpha = this.alpha;
        if (this.isPlayful) {
           ctx.save();
           ctx.translate(this.x, this.y);
           ctx.rotate(this.rotation);
           ctx.font = `${this.radius}px Arial`;
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(this.emoji, 0, 0);
           ctx.restore();
        } else {
           ctx.beginPath();
           ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
           ctx.fillStyle = this.color;
           ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }
    }

    const triggerMilestoneAnimation = (x, y) => {
      for(let i = 0; i < 80; i++) fireworks.push(new FireworkParticle(x, y));
      
      gsap.to(".char", {
        scale: 1.35,
        color: "#ffffff",
        textShadow: "0 0 50px rgba(255,255,255,0.9)",
        duration: 0.1,
        yoyo: true,
        repeat: 3,
        stagger: 0.02,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(".char", {
            scale: 1,
            color: (i) => i < 5 ? 'var(--pure-white)' : 'var(--brand-yellow)',
            textShadow: (i) => i >= 5 ? '0 0 30px var(--brand-glow)' : 'none',
            duration: 0.5,
            ease: "power2.out"
          });
        }
      });
      
      gsap.fromTo(canvas, 
        { x: -15 }, 
        { x: 15, duration: 0.05, yoyo: true, repeat: 7, ease: "none", onComplete: () => gsap.set(canvas, {x: 0}) }
      );
    };

    let piercingTimer = 0;

    window.initBreakerGame = (level = 1) => {
      bricks = []; // storing TargetRings here for compatibility
      
      const initialSpeedMult = 1 + (level * 0.08); // Speed increases with each level
      const initialVx = (6 * Math.min(initialSpeedMult, 2)) * (Math.random() > 0.5 ? 1 : -1);
      const initialVy = -7 * Math.min(initialSpeedMult, 2);
      
      balls = [new Ball(canvas.width / 2, canvas.height - 140, initialVx, initialVy)];
      if (balls[0]) {
         balls[0].speedLimit = 12 * Math.max(1, initialSpeedMult * 0.8);
      }
      
      powerUps = [];
      paddle = new Paddle();
      piercingTimer = 0;
      
      const pattern = level % 20;
      const spacingX = Math.min(60, canvas.width / 10);
      const spacingY = Math.min(50, canvas.width / 12);
      const offsetX = canvas.width / 2;
      const offsetY = 120;
      
      const addBrick = (r, c, health = 1) => {
         const br = new TargetRing(offsetX + c * spacingX, offsetY + r * spacingY);
         br.health = health;
         bricks.push(br);
      };

      if (pattern === 1) {
         // Level 1: Standard 5x3
         for(let r=0; r<3; r++) {
            for(let c=-2; c<=2; c++) addBrick(r, c);
         }
      } else if (pattern === 2) {
         // Triangle
         for(let r=0; r<5; r++) {
            for(let c=-r; c<=r; c++) addBrick(r, c);
         }
      } else if (pattern === 3) {
         // Hollow Box
         for(let r=0; r<5; r++) {
            for(let c=-3; c<=3; c++) {
               if (r === 0 || r === 4 || c === -3 || c === 3) addBrick(r, c);
            }
         }
      } else if (pattern === 4) {
         // Checkerboard
         for(let r=0; r<6; r++) {
            for(let c=-4; c<=4; c++) {
               if ((r + c) % 2 === 0) addBrick(r, c);
            }
         }
      } else if (pattern === 5) {
         // X Shape
         for(let r=0; r<7; r++) {
            for(let c=-3; c<=3; c++) {
               if (c === r - 3 || c === -(r - 3)) addBrick(r, c, 2);
            }
         }
      } else if (pattern === 6) {
         // Two Pillars
         for(let r=0; r<6; r++) {
            for(let c=-4; c<=4; c++) {
               if (c === -3 || c === -2 || c === 2 || c === 3) addBrick(r, c);
            }
         }
      } else if (pattern === 7) {
         // Diamond
         for(let r=0; r<7; r++) {
            const width = 3 - Math.abs(3 - r);
            for(let c=-width; c<=width; c++) addBrick(r, c, width === 0 ? 2 : 1);
         }
      } else if (pattern === 8) {
         // V Shape
         for(let r=0; r<6; r++) {
            addBrick(r, -(5 - r));
            addBrick(r, 5 - r);
         }
      } else if (pattern === 9) {
         // Smiley Face
         addBrick(0, -2); addBrick(0, 2);
         addBrick(1, -2); addBrick(1, 2);
         addBrick(3, -3); addBrick(3, 3);
         addBrick(4, -2); addBrick(4, -1); addBrick(4, 0); addBrick(4, 1); addBrick(4, 2);
      } else if (pattern === 10) {
         // Level 10 (Mini-Boss Wall)
         for(let r=0; r<5; r++) {
            for(let c=-4; c<=4; c++) addBrick(r, c, r === 0 ? 3 : (r === 1 ? 2 : 1));
         }
      } else if (pattern === 11) {
         // Arrow Up
         addBrick(0, 0, 2);
         addBrick(1, -1); addBrick(1, 0, 2); addBrick(1, 1);
         addBrick(2, -2); addBrick(2, 0, 2); addBrick(2, 2);
         addBrick(3, -3); addBrick(3, 0, 2); addBrick(3, 3);
         addBrick(4, 0, 2); addBrick(5, 0, 2); addBrick(6, 0, 2);
      } else if (pattern === 12) {
         // Hourglass
         for(let r=0; r<7; r++) {
            const width = Math.abs(3 - r);
            for(let c=-width; c<=width; c++) addBrick(r, c, width === 0 ? 3 : 1);
         }
      } else if (pattern === 13) {
         // Space Invader
         addBrick(0, -2); addBrick(0, 2);
         addBrick(1, -3); addBrick(1, -2); addBrick(1, -1); addBrick(1, 0); addBrick(1, 1); addBrick(1, 2); addBrick(1, 3);
         addBrick(2, -4); addBrick(2, -3); addBrick(2, -1); addBrick(2, 0); addBrick(2, 1); addBrick(2, 3); addBrick(2, 4);
         addBrick(3, -4); addBrick(3, -3); addBrick(3, -2); addBrick(3, -1); addBrick(3, 0); addBrick(3, 1); addBrick(3, 2); addBrick(3, 3); addBrick(3, 4);
         addBrick(4, -2); addBrick(4, 2);
         addBrick(5, -3); addBrick(5, -1); addBrick(5, 1); addBrick(5, 3);
      } else if (pattern === 14) {
         // Cross
         for(let r=0; r<7; r++) {
            for(let c=-3; c<=3; c++) {
               if (r >= 2 && r <= 4) addBrick(r, c, 2);
               else if (c >= -1 && c <= 1) addBrick(r, c, 2);
            }
         }
      } else if (pattern === 15) {
         // Double Diamonds
         for(let r=0; r<5; r++) {
            const width = 2 - Math.abs(2 - r);
            for(let c=-width; c<=width; c++) {
               addBrick(r, c - 2);
               addBrick(r, c + 2);
            }
         }
      } else if (pattern === 16) {
         // Stairs
         for(let r=0; r<6; r++) {
            for(let c=-4; c<=(r - 2); c++) addBrick(r, c);
         }
      } else if (pattern === 17) {
         // "S" Shape / Spiral
         for(let c=-2; c<=2; c++) { addBrick(0, c); addBrick(3, c); addBrick(6, c); }
         addBrick(1, -2); addBrick(2, -2);
         addBrick(4, 2); addBrick(5, 2);
      } else if (pattern === 18) {
         // Fortress
         for(let r=0; r<7; r++) {
            for(let c=-4; c<=4; c++) {
               if (r === 0 || r === 6 || c === -4 || c === 4) addBrick(r, c, 3);
               else if (r === 3 && c === 0) addBrick(r, c, 5); // The king
            }
         }
      } else if (pattern === 19) {
         // DNA Twist
         for(let r=0; r<8; r++) {
            const offset = Math.round(Math.sin(r) * 3);
            addBrick(r, offset, 2);
            addBrick(r, -offset, 2);
         }
      } else if (pattern === 0) {
         // Ultimate Boss (Level 20)
         for(let r=0; r<6; r++) {
            for(let c=-4; c<=4; c++) {
               const dist = Math.max(Math.abs(3 - r), Math.abs(c));
               addBrick(r, c, 5 - dist); // Center has 5 health
            }
         }
      }

      // Ball speed scaling based on level cycles (every 20 levels it gets slightly faster)
      const speedMult = 1 + Math.floor((level - 1) / 20) * 0.2;
      balls[0].vx *= speedMult;
      balls[0].vy *= speedMult;
    };
    
    window.initDrippGame = () => {
      drops = [];
      splashes = [];
      miniParticles = [];
      fireworks = [];
    };

    let lastActiveGame = 'dripp';

    const animate = () => {
      // Bypassing logic for none state
      if (activeGameRef.current === 'none') {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         animationFrameId = requestAnimationFrame(animate);
         return;
      }
      
      // Pause logic stops entirely
      if (isPausedRef.current) {
          animationFrameId = requestAnimationFrame(animate);
          return;
      }
      
      // Fail/LevelComplete logic stops physics but keeps rendering the frozen frame + animates particles
      if (gameStateRef.current === 'failed' || gameStateRef.current === 'level-complete') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (activeGameRef.current === 'dripp') {
             drops.forEach(drop => drop.draw(ctx));
             splashes.forEach(splash => splash.draw(ctx));
          } else if (activeGameRef.current === 'breaker') {
             if (paddle) paddle.draw(ctx);
             balls.forEach(ball => ball.draw(ctx));
             bricks.forEach(brick => brick.draw(ctx));
             powerUps.forEach(pu => pu.draw(ctx));
          }
          
          miniParticles.forEach(mp => { mp.update(); mp.draw(ctx); });
          miniParticles = miniParticles.filter(mp => !mp.markedForDeletion);
          fireworks.forEach(fw => { fw.update(); fw.draw(ctx); });
          fireworks = fireworks.filter(fw => !fw.markedForDeletion);
          
          animationFrameId = requestAnimationFrame(animate);
          return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (activeGameRef.current !== lastActiveGame) {
         if (activeGameRef.current === 'breaker') {
            window.initBreakerGame();
         } else {
            drops = [];
            splashes = [];
         }
         lastActiveGame = activeGameRef.current;
      }
      
      if (activeGameRef.current === 'dripp') {
        // Logarithmic intensity curve so it scales gently over time
        let baseIntensity = 0.025; 
        let scaling = Math.log10(1 + scoreRef.current / 300) * 0.1;
        
        if (!isMobileCanvas) {
           baseIntensity = 0.04;
           scaling = Math.log10(1 + scoreRef.current / 150) * 0.15;
        }
        
        const rainIntensity = Math.min(0.25, baseIntensity + scaling);
        
        const spawnAttempts = 1; // Standard spawn rate to prevent lag on mobile
        
        for (let i = 0; i < spawnAttempts; i++) {
           if (Math.random() < rainIntensity) drops.push(new Drop(Math.random() < 0.15));
           if (Math.random() < rainIntensity * 0.15) drops.push(new Drop(Math.random() < 0.15));
        }
        
        // Safety net: ensure there's always at least one drop on screen to prevent "blank screen" perception
        if (drops.length === 0 && gameStateRef.current === 'playing' && !isPausedRef.current) {
           drops.push(new Drop(Math.random() < 0.15));
        }
        
        drops.forEach(drop => { drop.update(); drop.draw(ctx); });
        drops = drops.filter(drop => !drop.markedForDeletion);
        
        splashes.forEach(splash => { splash.update(); splash.draw(ctx); });
        splashes = splashes.filter(splash => !splash.markedForDeletion);
        
      } else if (activeGameRef.current === 'breaker') {
        if (paddle) { paddle.update(); paddle.draw(ctx); }
        balls.forEach(ball => { ball.update(paddle, bricks); ball.draw(ctx); });
        balls = balls.filter(b => !b.markedForDeletion);
        
        // Breaker Penalty Logic - Dropping ball fails instantly
        if (balls.length === 0 && gameStateRef.current === 'playing') {
           setGameState('failed');
        }
        
        if (piercingTimer > 0) piercingTimer -= 16;
        
        bricks.forEach(brick => { brick.update(); brick.draw(ctx); });
        bricks = bricks.filter(b => !b.markedForDeletion);
        if (bricks.length === 0 && balls.length > 0 && gameStateRef.current === 'playing') {
           setGameState('level-complete');
        }
        
        powerUps.forEach(pu => { pu.update(paddle, bricks); pu.draw(ctx); });
        powerUps = powerUps.filter(pu => !pu.markedForDeletion);
      }

      miniParticles.forEach(mp => { mp.update(); mp.draw(ctx); });
      miniParticles = miniParticles.filter(mp => !mp.markedForDeletion);
      fireworks.forEach(fw => { fw.update(); fw.draw(ctx); });
      fireworks = fireworks.filter(fw => !fw.markedForDeletion);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("touchmove", moveCursor);
      window.removeEventListener("touchstart", moveCursor);
      window.removeEventListener("touchend", () => {});
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(".char", 
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.05, ease: "power4.out" }
    )
    .fromTo(".subtitle", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(".social-link", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(".game-ui",
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: "power2.out" },
      "-=0.5"
    );
  }, { scope: containerRef });

  const titleChars = "DRIPPMEDIA".split("");

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  };

  const prepareShare = async () => {
    try {
      setShowShareOptions(true);
      setIsCapturing(true);

      const currentScore = activeGame === 'dripp' ? score : breakerScore;
      const gameName = activeGame === 'dripp' ? 'Dripp' : 'Breaker';
      const blob = await generateScoreImage(currentScore, gameName, false);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPregeneratedShareUrl(reader.result);
        setIsCapturing(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Score image generation failed:", error);
      setIsCapturing(false);
    }
  };

  const handleShare = async (action) => {
    if (!pregeneratedShareUrl) return;
    try {
      const currentScore = activeGame === 'dripp' ? score : breakerScore;
      
      if (action === 'download') {
         const link = document.createElement('a');
         link.download = `DrippMedia-Score-${currentScore}.png`;
         link.href = pregeneratedShareUrl;
         link.click();
      } else if (action === 'instagram') {
         const blob = dataURItoBlob(pregeneratedShareUrl);
         const file = new File([blob], `DrippMedia-Score-${currentScore}.png`, { type: 'image/png' });
         
         if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
             await navigator.share({
                 files: [file],
                 title: 'My Dripp Media Score',
                 text: `I just scored ${currentScore} points! Can you beat me?`
             });
         } else {
             const link = document.createElement('a');
             link.download = `DrippMedia-Score-${currentScore}.png`;
             link.href = pregeneratedShareUrl;
             link.click();
             customAlert("Instagram sharing via browser is unsupported on this device. The image has been downloaded so you can share it manually!");
         }
      }
      
      setShowShareOptions(false);
      setPregeneratedShareUrl(null);
    } catch (error) {
      console.error("Sharing failed:", error);
    }
  };

  const PrimaryButton = ({ onClick, children, disabled = false }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(235, 215, 63, 0.3)',
        color: 'var(--pure-white)',
        padding: '10px 24px',
        borderRadius: '30px',
        fontFamily: "'Clash Display', sans-serif",
        fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '15px'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(235, 215, 63, 0.15)';
        e.target.style.borderColor = 'var(--brand-yellow)';
        e.target.style.boxShadow = '0 0 15px rgba(235, 215, 63, 0.3)';
        const cursor = document.querySelector('.cursor');
        if(cursor) {
          cursor.classList.add('active');
          cursorActiveRef.current = true;
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
        e.target.style.borderColor = 'rgba(235, 215, 63, 0.3)';
        e.target.style.boxShadow = 'none';
        const cursor = document.querySelector('.cursor');
        if(cursor) {
          cursor.classList.remove('active');
        }
      }}
    >
      {children}
    </button>
  );

  return (
    <main ref={containerRef} style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--deep-black)',
      position: 'relative',
      overflow: 'hidden',
      touchAction: 'none' 
    }}>
      {/* SEO Visually Hidden Text */}
      <div style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
        <h1>Dripp Media - Premium Digital Branding and Creative Agency</h1>
        <p>
          Dripp Media is a top-tier digital branding and creative agency based in India, specializing in building immersive digital experiences, high-performance web development, premium video production, and interactive design. Whether you search for Drip Media, DrippMedia, or the best creative website agency, Dripp Media delivers cutting-edge digital solutions. We are proud to serve clients across India (Dehradun, Delhi, Mumbai, Bangalore, Jaipur) and provide premier offshore outsourcing and digital agency services globally to clients in the USA, UK, United Arab Emirates, Australia, Canada, Singapore, the Middle East, and across the EU and Scandinavia.
        </p>
      </div>

      {/* Profile Widget moved to control-buttons-wrapper */}

      <AuthModal 
        isOpen={showSignupModal}
        initialTab={authModalInitialTab}
        onClose={() => {
           setShowSignupModal(false);
           // Let them keep playing if they skip
           setPlayCount(0);
           setGameState('playing'); 
           setIsPaused(false); 
           setShowShareOptions(false);
           if (typeof window !== 'undefined' && window.initDrippGame) window.initDrippGame();
        }}
        onLoginSuccess={() => {
           setHasSignedUp(true);
           setPlayCount(0);
           setGameState('playing'); setIsPaused(false); setShowShareOptions(false);
           if (typeof window !== 'undefined' && window.initDrippGame) window.initDrippGame();

           // Fetch the real DB highscore — don't trust localStorage since
           // this might be a new device or cleared browser.
           const authToken = localStorage.getItem('dripp_auth_token') || '';
           if (authToken) {
             fetch('/api/arcade/highscore', {
               headers: { 'Authorization': `Bearer ${authToken}` }
             })
             .then(res => res.json())
             .then(data => {
               if (data && data.highscore !== undefined) {
                 const dbHigh = data.highscore || 0;
                 highScoreRef.current = dbHigh;
                 setDisplayHighScore(dbHigh);
                 localStorage.setItem('dripp_highScore', dbHigh.toString());
               }
             })
             .catch(() => {
               // Fallback to localStorage if DB fetch fails
               const cached = localStorage.getItem('dripp_highScore');
               if (cached) {
                 const val = parseInt(cached, 10);
                 highScoreRef.current = val;
                 setDisplayHighScore(val);
               }
             });
           }

           // Dispatch event for other components listening
           if (typeof window !== 'undefined') {
             window.dispatchEvent(new Event('dripp_login_success'));
           }
        }}
      />
      <style>{`
        @keyframes modalFadeIn {
          0% { opacity: 0; backdrop-filter: blur(0px); }
          100% { opacity: 1; backdrop-filter: blur(15px); }
        }
        @keyframes modalScaleUp {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.1); }
          50% { box-shadow: 0 0 40px rgba(235, 215, 63, 0.4); }
          100% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.1); }
        }
        .modern-input {
          transition: all 0.3s ease;
        }
        .modern-input:-webkit-autofill,
        .modern-input:-webkit-autofill:hover, 
        .modern-input:-webkit-autofill:focus, 
        .modern-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #1e1e1e inset !important;
            -webkit-text-fill-color: white !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        .modern-input:focus {
          border-color: var(--brand-yellow) !important;
          box-shadow: 0 0 15px rgba(235, 63, 63, 0.15) !important;
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .modern-btn {
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modern-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 25px rgba(235, 215, 63, 0.3);
        }
        .modern-btn:active:not(:disabled) {
          transform: translateY(1px) scale(0.98);
        }
        .cursor {
           position: fixed !important;
           top: 0; left: 0;
           width: 50px !important;
           height: 50px !important;
           background: var(--brand-yellow) !important;
           border: 0px solid transparent !important;
           border-radius: 50% !important;
           display: flex !important;
           justify-content: center !important;
           align-items: center !important;
           transition: background 0.1s ease, border 0.1s ease, width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease !important;
           z-index: 9999999 !important;
           pointer-events: none !important;
           box-shadow: 0 0 20px rgba(235, 215, 63, 0.5) !important;
        }
        .cursor.eating {
           background: transparent !important;
           border: 8px solid var(--pure-white) !important;
           width: 70px !important;
           height: 70px !important;
           box-shadow: 0 0 30px rgba(255, 255, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3) !important;
        }
        .cursor.active {
           background: rgba(235, 215, 63, 0.1) !important;
           border: 2px solid var(--brand-yellow) !important;
           width: 80px !important;
           height: 80px !important;
           box-shadow: 0 0 15px rgba(235, 215, 63, 0.3) !important;
        }
      `}</style>
      {!isTouch && <CustomCursor />}

      <style>{`
        @media (max-width: 768px) {
           .control-buttons-wrapper {
              top: 2% !important;
              left: 4% !important;
           }
           .control-buttons-wrapper > div {
              margin-top: 5px !important;
           }
           .desktop-profile-wrapper {
              position: relative !important;
              top: 0 !important;
              right: auto !important;
              margin-top: 5px !important;
           }
           .desktop-game-ui { display: none !important; }
           .dripp-game-ui {
              top: 2% !important;
              bottom: auto !important;
              right: 4% !important;
              gap: 0 !important;
           }
           .leaderboard-block {
              order: 2;
              margin-bottom: 0 !important;
              margin-top: 0px !important;
           }
           .score-block {
              order: 1;
           }
           .highest-score-text, .highest-score-value, .dripp-guidelines {
              display: none !important;
           }
        }
        @media (min-width: 769px) {
           .mobile-game-ui { display: none !important; }
        }
      `}</style>

      {/* Control Buttons (Top Left on desktop, Top Left grouped on mobile) */}
      <div className="control-buttons-wrapper" style={{ position: 'absolute', top: '20px', left: '30px', zIndex: 9999, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div className="desktop-profile-wrapper" style={{ position: 'fixed', top: '20px', right: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ProfileWidget 
            onLoginClick={(tab = 'signup') => {
               setAuthModalInitialTab(tab);
               setShowSignupModal(true);
            }} 
          />
          {activeGame === 'breaker' && (
            <div className="desktop-game-ui" style={{
              fontFamily: "'Clash Display', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
              opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.5s ease', marginTop: '10px'
            }}>
              <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                {activeGame === 'dripp' ? 'Score' : `Level ${breakerLevel}`}
              </div>
              {activeGame === 'breaker' && (
                <div style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', letterSpacing: '1px', color: 'var(--brand-yellow)', textTransform: 'uppercase', opacity: 0.8, marginBottom: '5px' }}>
                  {(() => {
                     switch(breakerLevel % 20) {
                        case 1: return "The Cluster"; case 2: return "Triangle"; case 3: return "Hollow Box";
                        case 4: return "Checkerboard"; case 5: return "The X"; case 6: return "Twin Pillars";
                        case 7: return "Diamond"; case 8: return "The V"; case 9: return "Smiley";
                        case 10: return "Mini-Boss Wall"; case 11: return "Arrow Up"; case 12: return "Hourglass";
                        case 13: return "Invader"; case 14: return "The Cross"; case 15: return "Double Diamonds";
                        case 16: return "Stairway"; case 17: return "The Spiral"; case 18: return "Fortress";
                        case 19: return "DNA Twist"; case 0: return "Ultimate Boss"; default: return "";
                     }
                  })()}
                </div>
              )}
                <div className="score-counter-element" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: gameState === 'failed' ? '#eb3f3f' : 'var(--brand-yellow)', lineHeight: 1, textShadow: gameState === 'failed' ? '0 0 20px rgba(235, 63, 63, 0.4)' : '0 0 20px rgba(235, 215, 63, 0.4)', display: 'inline-block' }}>
                  {breakerScore}
                </div>
            </div>
          )}
        </div>
        {activeGame !== 'none' && gameState === 'playing' && !isPaused && (
          <button 
            onClick={() => setIsPaused(true)}
            aria-label="Pause Game"
            style={{
              width: '40px', height: '40px',
              borderRadius: '50%', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', 
              border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', transition: 'all 0.3s ease', padding: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            title="Pause"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          </button>
        )}
        <button 
          onClick={() => setIsHelpOpen(true)}
          aria-label="How to play"
          style={{
            width: '40px', height: '40px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', 
            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.2rem', transition: 'all 0.3s ease', padding: 0
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          title="How to play"
        >?</button>
      </div>

      {/* Guidelines Overlay */}
      {isHelpOpen && (
        <div className="ui-overlay" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20
        }}>
           <h2 style={{ fontFamily: "'Panchang', sans-serif", color: 'var(--brand-yellow)', fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', margin: 0, textAlign: 'center' }}>HOW TO PLAY</h2>
           
           <div style={{ width: '90%', maxWidth: '600px', textAlign: 'center', marginTop: '20px', fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.8)', fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', lineHeight: 1.6, overflowY: 'auto', maxHeight: '60vh' }}>
             {activeGame === 'dripp' ? (
               <>
                 <p>Catch <span style={{color: 'var(--brand-yellow)'}}>Yellow Drops</span> for +1 point.</p>
                 <p>Catch <span style={{color: '#eb3f3f'}}>Red Drops</span> for +5 points.</p>
                 <p>Catch rare <span style={{color: '#ffffff'}}>White Drops</span> for +69 points!</p>
                 <br/>
                 <p>Avoid the <span style={{color: '#777'}}>Bombs</span>! Catching a bomb will instantly fail the game.</p>
               </>
             ) : activeGame === 'breaker' ? (
               <>
                 <p>Smash the glowing capsules with your magnetic paddle.</p>
                 <p>Catch <span style={{color: '#00ffcc'}}>Cyan</span> for Points, <span style={{color: '#ff00ff'}}>Magenta</span> for Multi-Ball.</p>
                 <p>Catch <span style={{color: '#33ff33'}}>Green</span> for Wider Paddle, <span style={{color: '#ebd73f'}}>Yellow</span> for Piercing Fireball!</p>
                 <br/>
                 <p>Avoid <span style={{color: '#ff3333'}}>Red</span> (Shrinks Paddle) and <span style={{color: '#33ccff'}}>Blue</span> (Shields Targets).</p>
                 <p>If you drop the ball once, you fail instantly!</p>
               </>
             ) : (
               <p>The game is currently disabled. Toggle the Easter Egg icon in the bottom left to play!</p>
             )}
           </div>
           <PrimaryButton onClick={() => setIsHelpOpen(false)}>Close Guidelines</PrimaryButton>
        </div>
      )}

      {/* Bottom Left Buttons */}
      <div className="bottom-controls">
        <button 
          className="easter-egg"
          onClick={() => setActiveGame(prev => prev === 'breaker' ? 'dripp' : 'breaker')}
          aria-label="Toggle game"
          style={{
            width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', background: 'rgba(235, 215, 63, 0.1)', cursor: 'pointer',
            border: '1px solid rgba(235, 215, 63, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            transition: 'all 0.3s ease', boxShadow: '0 0 10px rgba(235, 215, 63, 0.2)', padding: 0
          }}
          title="Play Jardinains!"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(235, 215, 63, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
            <line x1="6" y1="12" x2="10" y2="12"></line>
            <line x1="8" y1="10" x2="8" y2="14"></line>
            <line x1="15" y1="13" x2="15.01" y2="13"></line>
            <line x1="18" y1="11" x2="18.01" y2="11"></line>
          </svg>
        </button>

        <button 
          className="game-free-btn"
          aria-label={activeGame === 'none' ? 'Ignite Canvas' : 'Disable Game'}
          onClick={() => {
             if (activeGame !== 'none') {
                 // Trigger fade out
                 setIsFadingOut(true);
                 setTimeout(() => {
                    setActiveGame('none');
                    setHideHero(false); // Automatically enable intro when game disabled
                    setIsFadingOut(false);
                 }, 500); // 500ms fade out
             } else {
                 setActiveGame('dripp');
             }
          }}
          style={{
             height: '40px', padding: '0 15px', flexShrink: 0, borderRadius: '20px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
             border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center',
             color: activeGame === 'none' ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.5)', fontFamily: "'Clash Display', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase',
             transition: 'all 0.3s ease', whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = activeGame === 'none' ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          {activeGame === 'none' ? 'Ignite Canvas' : 'Disable Game'}
        </button>
        
        <button 
          onClick={() => {
             if (activeGame !== 'none') setHideHero(prev => !prev);
          }}
          aria-label={hideHero ? 'Show Intro' : 'Hide Intro'}
          style={{
             height: '40px', padding: '0 15px', flexShrink: 0, borderRadius: '20px', background: 'rgba(255,255,255,0.05)', 
             cursor: activeGame === 'none' ? 'not-allowed' : 'pointer',
             border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center',
             color: 'rgba(255,255,255,0.5)', fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', textTransform: 'uppercase',
             transition: 'all 0.3s ease', whiteSpace: 'nowrap',
             opacity: activeGame === 'none' ? 0.3 : 1
          }}
          onMouseEnter={(e) => { 
             if (activeGame !== 'none') {
                e.currentTarget.style.color = 'white'; 
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; 
             }
          }}
          onMouseLeave={(e) => { 
             if (activeGame !== 'none') {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; 
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; 
             }
          }}
        >
          {hideHero ? 'Show Intro' : 'Hide Intro'}
        </button>
      </div>

      {/* Pause Overlay */}
      {isPaused && gameState === 'playing' && activeGame !== 'none' && !isHelpOpen && (
        <div className="ui-overlay ui-overlay-fade" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <div className="ui-popup-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <h2 style={{ fontFamily: "'Panchang', sans-serif", color: 'var(--pure-white)', fontSize: '3rem', margin: 0, marginBottom: '20px' }}>PAUSED</h2>
             <div className="action-buttons-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <PrimaryButton onClick={() => {
                   gsap.to('.ui-overlay', { opacity: 0, duration: 0.2, onComplete: () => {
                       setIsPaused(false);
                       gsap.set('.ui-overlay', { opacity: 1 });
                   }});
               }}>Resume Game</PrimaryButton>
               {!showShareOptions ? (
                 <PrimaryButton onClick={prepareShare}>
                   Brag your score
                 </PrimaryButton>
               ) : (
                 <div className="share-container" style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                   <PrimaryButton onClick={() => handleShare('download')} disabled={isCapturing}>
                     {isCapturing ? "Preparing..." : "Download"}
                   </PrimaryButton>
                   <PrimaryButton onClick={() => handleShare('instagram')} disabled={isCapturing}>
                     {isCapturing ? "Preparing..." : "IG Story"}
                   </PrimaryButton>
                 </div>
               )}
             </div>
           </div>
        </div>
      )}

      {/* Game Over / Pause Overlays */}
      {gameState === 'failed' && !isHelpOpen && (
        <div className="ui-overlay ui-overlay-fade" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)', 
           backdropFilter: 'blur(15px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <div className="ui-popup-enter" style={{
              background: 'linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(5,5,5,0.95) 100%)',
              border: '1px solid rgba(235, 63, 63, 0.3)',
              borderRadius: '24px',
              padding: '50px 80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(235, 63, 63, 0.1)'
           }}>
             <h2 style={{ fontFamily: "'Panchang', sans-serif", color: '#eb3f3f', fontSize: 'clamp(3rem, 6vw, 5rem)', margin: 0, textShadow: '0 0 20px rgba(235, 63, 63, 0.6), 0 0 40px rgba(235, 63, 63, 0.4)', textAlign: 'center', letterSpacing: '2px' }}>
               DRIPPED OUT!
             </h2>
             <p style={{ marginTop: '10px', fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: '1px' }}>
               {activeGame === 'dripp' ? 'You caught a bomb! Game Over.' : 'You dropped the ball! Game Over.'}
             </p>
             
             <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
               <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>Final Score</span>
               <span style={{ fontSize: '3.5rem', fontWeight: 600, color: 'var(--brand-yellow)', textShadow: '0 0 20px rgba(235, 215, 63, 0.4)', lineHeight: 1, marginTop: '5px', filter: cheatedSession && activeGame === 'dripp' ? 'blur(6px)' : 'none', userSelect: 'none' }}>
                  {activeGame === 'dripp' ? score : breakerScore}
               </span>
               {cheatedSession && activeGame === 'dripp' && (
                 <div style={{
                   position: 'absolute', top: '50%', left: '50%',
                   transform: 'translate(-50%, -50%) rotate(-8deg)',
                   background: 'rgba(235, 63, 63, 0.15)',
                   border: '2px solid rgba(235, 63, 63, 0.8)',
                   borderRadius: '6px',
                   padding: '4px 12px',
                   color: '#eb3f3f',
                   fontFamily: "'Panchang', sans-serif",
                   fontSize: '1rem',
                   fontWeight: 700,
                   letterSpacing: '3px',
                   textTransform: 'uppercase',
                   pointerEvents: 'none',
                   whiteSpace: 'nowrap',
                   textShadow: '0 0 10px rgba(235,63,63,0.6)',
                   boxShadow: '0 0 15px rgba(235,63,63,0.3)'
                 }}>
                   ⚠ Tampered
                 </div>
               )}
             </div>

             <div className="action-buttons-container" style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
               {activeGame === 'breaker' ? (
                 <>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <PrimaryButton onClick={() => {
                        if (playCount >= 2 && !hasSignedUp) {
                            setShowSignupModal(true);
                            return;
                        }
                        gsap.to('.ui-overlay', { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.inOut', onComplete: () => {
                            breakerScoreRef.current = 0;
                            setBreakerScore(0);
                            setGameState('playing');
                            setIsPaused(false);
                            setShowShareOptions(false);
                            window.initBreakerGame(breakerLevelRef.current);
                            gsap.set('.ui-overlay', { opacity: 1, scale: 1 });
                        }});
                     }}>Retry Level</PrimaryButton>
                     <div 
                        style={{ position: 'relative' }}
                        onMouseEnter={(e) => {
                           e.currentTarget.querySelector('.tooltip-trigger').style.background = 'rgba(255,255,255,0.1)';
                           e.currentTarget.querySelector('.tooltip-trigger').style.color = 'white';
                           e.currentTarget.querySelector('.tooltip-trigger').style.borderColor = 'white';
                           setShowRetryTooltip(true);
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.querySelector('.tooltip-trigger').style.background = 'transparent';
                           e.currentTarget.querySelector('.tooltip-trigger').style.color = 'rgba(255,255,255,0.7)';
                           e.currentTarget.querySelector('.tooltip-trigger').style.borderColor = 'rgba(255,255,255,0.3)';
                           setShowRetryTooltip(false);
                        }}
                     >
                       <button 
                          className="tooltip-trigger"
                          aria-label="Retry information"
                          onClick={() => setShowRetryTooltip(!showRetryTooltip)}
                          style={{
                             width: '28px', height: '28px', borderRadius: '50%', 
                             border: '1px solid rgba(255,255,255,0.3)',
                             display: 'flex', justifyContent: 'center', alignItems: 'center', 
                             color: 'rgba(255,255,255,0.7)', cursor: 'help', 
                             fontSize: '0.9rem', marginTop: '15px',
                             transition: 'all 0.3s ease', background: 'transparent', padding: 0
                          }}
                       >
                         ?
                       </button>
                       
                       {showRetryTooltip && (
                          <div style={{
                             position: 'absolute',
                             bottom: '100%',
                             left: '50%',
                             transform: 'translateX(-50%)',
                             marginBottom: '8px',
                             background: 'var(--deep-black)',
                             border: '1px solid rgba(255,255,255,0.2)',
                             borderRadius: '8px',
                             padding: '8px 12px',
                             width: 'max-content',
                             maxWidth: '200px',
                             color: 'rgba(255,255,255,0.9)',
                             fontSize: '0.75rem',
                             textAlign: 'center',
                             boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                             zIndex: 100,
                             pointerEvents: 'none'
                          }}>
                             *Your score will reset if you retry this level.
                          </div>
                       )}
                     </div>
                   </div>
                   {breakerLevelRef.current > 1 && (
                     <PrimaryButton onClick={() => {
                        if (playCount >= 2 && !hasSignedUp) {
                            setShowSignupModal(true);
                            return;
                        }
                        gsap.to('.ui-overlay', { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.inOut', onComplete: () => {
                            breakerScoreRef.current = 0;
                            setBreakerScore(0);
                            breakerLevelRef.current = 1;
                            setBreakerLevel(1);
                            setGameState('playing');
                            setIsPaused(false);
                            setShowShareOptions(false);
                            window.initBreakerGame(1);
                            gsap.set('.ui-overlay', { opacity: 1, scale: 1 });
                        }});
                     }}>Start Level 1</PrimaryButton>
                   )}
                 </>
               ) : (
                 <PrimaryButton onClick={() => {
                    if (playCount >= 2 && !hasSignedUp) {
                        setShowSignupModal(true);
                        return;
                    }
                    gsap.to('.ui-overlay', { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.inOut', onComplete: () => {
                        scoreRef.current = 0;
                        setScore(0);
                        scoreGuardRef.current.reset();
                        setCheatedSession(false);
                        setGameState('playing');
                        setIsPaused(false);
                        setShowShareOptions(false);
                        try {
                          const userStr = localStorage.getItem('dripp_user');
                          if (userStr) {
                            const userObj = JSON.parse(userStr);
                            if (userObj.email) scoreGuardRef.current.initSession(userObj.email);
                          }
                        } catch(e) {}
                        window.initDrippGame();
                        gsap.set('.ui-overlay', { opacity: 1, scale: 1 });
                    }});
                 }}>Play Again</PrimaryButton>
               )}
               
               {!showShareOptions ? (
                 cheatedSession && activeGame === 'dripp' ? (
                   <div style={{
                     padding: '10px 20px', borderRadius: '30px',
                     border: '1px solid rgba(235,63,63,0.5)',
                     background: 'rgba(235,63,63,0.08)',
                     color: 'rgba(235,63,63,0.8)',
                     fontFamily: "'Clash Display', sans-serif",
                     fontSize: '0.75rem', letterSpacing: '1.5px',
                     textTransform: 'uppercase', cursor: 'not-allowed'
                   }}>
                     ✕ Score Invalid
                   </div>
                 ) : (
                   <PrimaryButton onClick={prepareShare}>
                     Share Score
                   </PrimaryButton>
                 )
               ) : (
                 <div className="share-container" style={{ display: 'flex', gap: '10px' }}>
                   <PrimaryButton onClick={() => handleShare('download')} disabled={isCapturing}>
                     {isCapturing ? "Preparing..." : "Download"}
                   </PrimaryButton>
                   <PrimaryButton onClick={() => handleShare('instagram')} disabled={isCapturing}>
                     {isCapturing ? "Preparing..." : "IG Story"}
                   </PrimaryButton>
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
      {/* Level Complete Overlay */}
      {gameState === 'level-complete' && !isHelpOpen && (
        <div className="ui-overlay ui-overlay-fade" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)', 
           backdropFilter: 'blur(15px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <div className="ui-popup-enter" style={{
              background: 'linear-gradient(145deg, rgba(20,20,20,0.9) 0%, rgba(5,5,5,0.95) 100%)',
              border: '1px solid rgba(51, 255, 51, 0.3)',
              borderRadius: '24px',
              padding: '50px 80px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 30px rgba(51, 255, 51, 0.1)'
           }}>
             <h2 style={{ fontFamily: "'Panchang', sans-serif", color: '#33ff33', fontSize: 'clamp(3rem, 6vw, 5rem)', margin: 0, textShadow: '0 0 20px rgba(51, 255, 51, 0.6), 0 0 40px rgba(51, 255, 51, 0.4)', textAlign: 'center', letterSpacing: '2px' }}>
               LEVEL CLEARED!
             </h2>
             <p style={{ marginTop: '10px', fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: '1px' }}>
               You destroyed the layout. Get ready for the next one.
             </p>
             
             <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Score</span>
               <span style={{ fontSize: '3.5rem', fontWeight: 600, color: 'var(--brand-yellow)', textShadow: '0 0 20px rgba(235, 215, 63, 0.4)', lineHeight: 1, marginTop: '5px' }}>
                  {breakerScore}
               </span>
             </div>

             <div className="action-buttons-container" style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
               <PrimaryButton onClick={() => {
                  gsap.to('.ui-overlay', { opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.inOut', onComplete: () => {
                      breakerLevelRef.current += 1;
                      setBreakerLevel(breakerLevelRef.current);
                      setGameState('playing');
                      window.initBreakerGame(breakerLevelRef.current);
                      gsap.set('.ui-overlay', { opacity: 1, scale: 1 });
                  }});
               }}>Next Level</PrimaryButton>
             </div>
           </div>
        </div>
      )}

      {/* Canvas for Games */}
      <canvas 
        key="homepage-old-arcade-canvas"
        ref={canvasRef} 
        style={{ 
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', 
           display: activeGame === 'none' ? 'none' : 'block',
           opacity: isFadingOut ? 0 : 1,
           transition: 'opacity 0.5s ease'
        }} 
      />

      {/* Breaker Mobile Game UI Score */}
      {activeGame === 'breaker' && (
        <div className="game-ui mobile-game-ui" style={{
          position: 'absolute', top: '5%', right: '5%', zIndex: 2,
          fontFamily: "'Clash Display', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}>
          <div className="score-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Level {breakerLevel}
            </div>
            {activeGame === 'breaker' && (
              <div style={{ fontSize: 'clamp(0.5rem, 1.5vw, 0.65rem)', letterSpacing: '1px', color: 'var(--brand-yellow)', textTransform: 'uppercase', opacity: 0.8, marginBottom: '5px' }}>
                {(() => {
                   switch(breakerLevel % 20) {
                      case 1: return "The Cluster";
                      case 2: return "Triangle";
                      case 3: return "Hollow Box";
                      case 4: return "Checkerboard";
                      case 5: return "The X";
                      case 6: return "Twin Pillars";
                      case 7: return "Diamond";
                      case 8: return "The V";
                      case 9: return "Smiley";
                      case 10: return "Mini-Boss Wall";
                      case 11: return "Arrow Up";
                      case 12: return "Hourglass";
                      case 13: return "Invader";
                      case 14: return "The Cross";
                      case 15: return "Double Diamonds";
                      case 16: return "Stairway";
                      case 17: return "The Spiral";
                      case 18: return "Fortress";
                      case 19: return "DNA Twist";
                      case 0: return "Ultimate Boss";
                      default: return "";
                   }
                })()}
              </div>
            )}
            <div className="score-counter-element" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: gameState === 'failed' ? '#eb3f3f' : 'var(--brand-yellow)', lineHeight: 1, textShadow: gameState === 'failed' ? '0 0 20px rgba(235, 63, 63, 0.4)' : '0 0 20px rgba(235, 215, 63, 0.4)', display: 'inline-block' }}>
              {activeGame === 'dripp' ? score : breakerScore}
            </div>
            {activeGame === 'dripp' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '5px' }}>
                <div style={{ fontSize: 'clamp(0.4rem, 1vw, 0.6rem)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Keep scoring to level up</div>
                <div style={{ fontSize: 'clamp(0.4rem, 1vw, 0.6rem)', color: '#eb3f3f', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Caution: Avoid bombs</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dripp Unified Game UI Score (Bottom Right) */}
      {activeGame === 'dripp' && (
        <div className="game-ui dripp-game-ui" style={{
          position: 'absolute', bottom: '30px', right: '30px', zIndex: 2,
          fontFamily: "'Clash Display', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.5s ease'
        }}>
          {/* High Score / Leaderboard Display */}
          <div className="leaderboard-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '10px' }}>
             <span className="highest-score-text" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Highest Score</span>
             <span className="highest-score-value" style={{ fontSize: '1.4rem', color: 'var(--brand-yellow)', fontWeight: 'bold' }}>{displayHighScore}</span>
             <button 
                onClick={() => setShowLeaderboard(true)}
                style={{
                   marginTop: '5px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                   color: 'var(--brand-yellow)', padding: '4px 10px', borderRadius: '8px',
                   fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'uppercase'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
             >
                View Leaderboard
             </button>
          </div>

          <div className="score-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Score
            </div>
            <div className="score-counter-element" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: gameState === 'failed' ? '#eb3f3f' : 'var(--brand-yellow)', lineHeight: 1, textShadow: gameState === 'failed' ? '0 0 20px rgba(235, 63, 63, 0.4)' : '0 0 20px rgba(235, 215, 63, 0.4)', display: 'inline-block' }}>
              {score}
            </div>
            <div className="dripp-guidelines" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginTop: '5px' }}>
              <div style={{ fontSize: 'clamp(0.4rem, 1vw, 0.6rem)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Keep scoring to level up</div>
              <div style={{ fontSize: 'clamp(0.4rem, 1vw, 0.6rem)', color: '#eb3f3f', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Caution: Avoid bombs</div>
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div style={{
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999,
           display: 'flex', justifyContent: 'center', alignItems: 'center',
           background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(16px)',
           WebkitBackdropFilter: 'blur(16px)',
           animation: 'modalFadeIn 0.3s forwards', padding: '20px'
        }}>
           <style>{`
             @keyframes slideUpFade {
               from { opacity: 0; transform: translateY(30px); }
               to { opacity: 1; transform: translateY(0); }
             }
             @keyframes pulseGlow {
               0% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.15), inset 0 0 10px rgba(235, 215, 63, 0.05); }
               50% { box-shadow: 0 0 40px rgba(235, 215, 63, 0.4), inset 0 0 20px rgba(235, 215, 63, 0.15); }
               100% { box-shadow: 0 0 20px rgba(235, 215, 63, 0.15), inset 0 0 10px rgba(235, 215, 63, 0.05); }
             }
             @keyframes shine {
               0% { left: -100%; }
               20% { left: 200%; }
               100% { left: 200%; }
             }
             .lb-item {
               animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
               opacity: 0;
               transform-origin: center;
             }
             .lb-item:hover {
               transform: translateY(-3px) scale(1.02);
               background: rgba(255,255,255,0.06) !important;
               border-color: rgba(255,255,255,0.15) !important;
             }
             .lb-first {
               animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards, pulseGlow 3s infinite ease-in-out;
               opacity: 0;
               transform-origin: center;
             }
             .lb-first:hover {
               transform: translateY(-4px) scale(1.03);
             }
           `}</style>
           <div style={{
              background: 'linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(5,5,5,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '28px',
              padding: '40px 30px', width: '100%', maxWidth: '420px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              boxShadow: '0 40px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.1)'
           }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 10px rgba(235, 215, 63, 0.5))' }}>
                   <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                   <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                   <path d="M4 22h16"></path>
                   <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                   <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                   <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
                <h2 style={{ color: '#fff', fontFamily: "'Panchang', sans-serif", fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                   HALL OF FAME
                </h2>
              </div>
               <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {leaderboardLoading ? (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Clash Display', sans-serif", textAlign: 'center', padding: '30px 0' }}>
                       Loading champions...
                    </div>
                 ) : leaderboardError ? (
                    <div style={{ color: '#eb3f3f', fontFamily: "'Clash Display', sans-serif", textAlign: 'center', fontSize: '0.85rem', padding: '30px 0' }}>
                       Failed to load scores.<br/>(Database connection issue)
                    </div>
                 ) : leaderboardData.length > 0 ? leaderboardData.map((player, index) => {
                    const isFirst = index === 0;
                    return (
                    <div key={index} className={isFirst ? "lb-first" : "lb-item"} style={{
                       display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                       padding: isFirst ? '20px 24px' : '16px 20px', 
                       background: isFirst ? 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(235, 215, 63, 0.02) 100%)' : 'rgba(255,255,255,0.03)', 
                       borderRadius: '16px',
                       border: isFirst ? '1px solid rgba(235, 215, 63, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                       marginBottom: isFirst ? '12px' : '4px',
                       transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                       animationDelay: `${index * 0.1}s`,
                       position: 'relative',
                       overflow: 'hidden',
                       cursor: 'default'
                    }}>
                       {isFirst && (
                          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', transform: 'skewX(-25deg)', animation: 'shine 4s infinite' }} />
                       )}
                       <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                          {isFirst ? (
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--brand-yellow)', borderRadius: '50%', color: '#000', boxShadow: '0 0 20px rgba(235, 215, 63, 0.6)' }}>
                                <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '-1px', marginLeft: '-2px' }}>#1</span>
                             </div>
                          ) : (
                             <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Panchang', sans-serif", fontSize: '1rem', width: '36px', textAlign: 'center', letterSpacing: '1px' }}>
                                #{index + 1}
                             </span>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: isFirst ? '#fff' : 'rgba(255,255,255,0.85)', fontFamily: "'Clash Display', sans-serif", fontSize: isFirst ? '1.25rem' : '1.1rem', fontWeight: isFirst ? 600 : 500, letterSpacing: '0.5px' }}>
                               {player.name}
                            </span>
                            {isFirst && (
                              <span style={{ fontSize: '0.65rem', color: 'var(--brand-yellow)', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px', fontWeight: 600, filter: 'drop-shadow(0 0 5px rgba(235,215,63,0.5))' }}>Undisputed Champ</span>
                            )}
                          </div>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 1 }}>
                          <span style={{ color: isFirst ? 'var(--brand-yellow)' : '#fff', fontFamily: "'Panchang', sans-serif", fontSize: isFirst ? '1.4rem' : '1.2rem', fontWeight: 600, textShadow: isFirst ? '0 0 15px rgba(235,215,63,0.6)' : 'none' }}>
                             {player.highscore}
                          </span>
                          {!isFirst && leaderboardData[0] && (
                             <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                               {Math.abs(Number(leaderboardData[0].highscore) - Number(player.highscore))} pts to #1
                             </span>
                          )}
                       </div>
                    </div>
                 )}) : (
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Clash Display', sans-serif", textAlign: 'center', padding: '30px 0' }}>
                       No scores found. Be the first!
                    </div>
                 )}
              </div>
              <button 
                 onClick={() => setShowLeaderboard(false)}
                 style={{
                    marginTop: '32px', padding: '14px 20px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px',
                    cursor: 'pointer', fontFamily: "'Clash Display', sans-serif", width: '100%',
                    fontSize: '1rem', letterSpacing: '1px', transition: 'all 0.3s ease'
                 }}
                 onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                 }}
                 onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                 }}
              >
                 CLOSE
              </button>
           </div>
        </div>
      )}

      <div style={{
        position: 'absolute', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 60%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.5, pointerEvents: 'none', zIndex: 0
      }}></div>

      <div style={{ opacity: hideHero ? 0 : 1, pointerEvents: hideHero ? 'none' : 'auto', transition: 'opacity 0.5s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', willChange: 'opacity', transform: 'translateZ(0)' }}>
        <h1 className="hero-title-container" style={{
          fontFamily: "'Panchang', sans-serif", fontSize: 'clamp(2.5rem, 10vw, 8rem)', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '-2px', display: 'flex', gap: 'clamp(0px, 1vw, 20px)', margin: 0, zIndex: 2, overflow: 'visible', pointerEvents: 'none',
          justifyContent: 'center', alignItems: 'center', lineHeight: 0.8
        }}>
          <div style={{ display: 'flex', gap: 'clamp(2px, 1vw, 5px)' }}>
            {"DRIPP".split('').map((char, index) => (
              <span key={`d-${index}`} className="char" style={{ 
                display: 'inline-block', color: 'var(--pure-white)'
              }}>
                {char}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'clamp(2px, 1vw, 5px)' }}>
            {"MEDIA".split('').map((char, index) => (
              <span key={`m-${index}`} className="char" style={{ 
                display: 'inline-block', color: 'var(--brand-yellow)', textShadow: '0 0 30px var(--brand-glow)'
              }}>
                {char}
              </span>
            ))}
          </div>
        </h1>

        <div style={{ overflow: 'hidden', marginTop: 'clamp(0px, 1vh, 0.5rem)', pointerEvents: 'none' }}>
          <p className="subtitle" style={{
            fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(0.8rem, 2vw, 1.5rem)', color: 'rgba(255, 255, 255, 0.7)',
            letterSpacing: 'clamp(2px, 1vw, 5px)', textTransform: 'uppercase', zIndex: 2, textAlign: 'center', margin: 0
          }}>
            Coming Soon
          </p>
        </div>

        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(1rem, 3vw, 2rem)', marginTop: '4rem', zIndex: 2
        }}>
        {[
          { label: 'Instagram', url: 'https://www.instagram.com/drippmedia_', target: '_blank' },
          { label: 'WhatsApp', url: 'https://wa.me/917300595147', target: '_blank' },
          { label: '+91 78189 95147', url: 'tel:+917818995147', target: '_self' }
        ].map((item) => (
          <a key={item.label} href={item.url} target={item.target} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} className="social-link" style={{
            color: 'var(--pure-white)', textDecoration: 'none', fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
            letterSpacing: '2px', textTransform: 'uppercase', borderBottom: '1px solid transparent', transition: 'border-color 0.3s ease, color 0.3s ease', paddingBottom: '5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--brand-yellow)';
            e.target.style.color = 'var(--brand-yellow)';
            const cursor = document.querySelector('.cursor');
            if(cursor) { cursor.classList.add('active'); cursorActiveRef.current = true; }
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.color = 'var(--pure-white)';
            const cursor = document.querySelector('.cursor');
            if(cursor) { cursor.classList.remove('active'); cursorActiveRef.current = false; }
          }}
          >
            {item.label}
          </a>
        ))}
        </div>
      </div>
    </main>
  );
}
