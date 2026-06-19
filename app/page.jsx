"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ComingSoon() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Game States
  const [activeGame, setActiveGame] = useState('dripp'); // 'dripp', 'breaker', 'none'
  const activeGameRef = useRef('dripp');
  
  const [score, setScore] = useState(0); // Dripp starts at 0
  const scoreRef = useRef(0);
  
  const [breakerScore, setBreakerScore] = useState(50); // Breaker starts at 50
  const breakerScoreRef = useRef(50);
  
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  
  const [gameState, setGameState] = useState('playing'); // 'playing', 'failed'
  const gameStateRef = useRef('playing');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);
  const lastMilestoneRef = useRef(0);

  // Sync state to ref for the animation loop
  useEffect(() => {
    activeGameRef.current = activeGame;
    // Reset scores when switching
    if (activeGame === 'breaker') {
      breakerScoreRef.current = 50;
      setBreakerScore(50);
      setGameState('playing');
      setIsPaused(false);
      if (window.initBreakerGame) window.initBreakerGame(); 
    } else if (activeGame === 'dripp') {
      scoreRef.current = 0;
      setScore(0);
      setGameState('playing');
      setIsPaused(false);
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
    document.body.classList.add('loaded');
    
    // Custom cursor functionality
    const cursor = document.querySelector('.cursor');
    
    const moveCursor = (e) => {
      // Allow cursor to update coordinates always, so UI is clickable while paused
      // Desktop
      if (e.clientX) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
      // Mobile Touch
      if (e.touches && e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (cursor) cursor.style.display = 'none'; // Hide cursor on touch
      }
      
      if (cursor && cursor.style.display !== 'none') {
        gsap.to(cursor, {
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          duration: 0.1,
          ease: "power2.out"
        });
      }
    };
    
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("touchmove", moveCursor, { passive: true });
    window.addEventListener("touchstart", moveCursor, { passive: true });

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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Drop {
      constructor(isRed = false) {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        this.isWhite = !isRed && Math.random() < 0.05; // 5% chance of white drop
        this.isBomb = Math.random() < 0.04; // 4% chance of bomb
        this.isRed = !this.isBomb && isRed;
        
        // Slower progression: speed increases gradually every 30 points
        const speedMult = 1 + (scoreRef.current * 0.008); 
        
        this.vy = (0.5 + Math.random() * 1) * speedMult; 
        this.gravity = (0.02 + Math.random() * 0.01) * speedMult; 
        
        this.radius = 2 + Math.random() * 2; 
        this.length = this.vy * 2; 
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
        this.wobbleSpeed = (0.02 + Math.random() * 0.02) * (1 + scoreRef.current * 0.005);
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
        
        const hitRadius = cursorActiveRef.current ? 40 : 35;

        if (distance < hitRadius) {
          this.markedForDeletion = true;
          
          const cursor = document.querySelector('.cursor');
          if (cursor) {
             cursor.classList.add('eating');
             setTimeout(() => cursor.classList.remove('eating'), 150);
          }
          
          if (this.isBomb) {
             setGameState('failed');
             for(let i=0; i<50; i++) fireworks.push(new FireworkParticle(this.x, this.y, '#ff0000'));
             return;
          } else if (this.isWhite) {
             scoreRef.current += 69;
             for(let i=0; i<40; i++) fireworks.push(new FireworkParticle(this.x, this.y, '#ffffff'));
          } else if (this.isRed) {
             scoreRef.current += 5; 
          } else {
             scoreRef.current += 1;
          }
          setScore(scoreRef.current);
          
          if (scoreRef.current > 50 && scoreRef.current % 50 === 0 && scoreRef.current !== lastMilestoneRef.current) {
            lastMilestoneRef.current = scoreRef.current;
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
        this.w = 120;
        this.h = 10;
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.vx = 0;
        this.tilt = 0;
      }
      update() {
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
                 
                 // Reflect vector
                 const nx = (this.x - t.x) / dist;
                 const ny = (this.y - t.y) / dist;
                 const dot = this.vx * nx + this.vy * ny;
                 this.vx = this.vx - 2 * dot * nx;
                 this.vy = this.vy - 2 * dot * ny;
                 
                 breakerScoreRef.current += 10;
                 setBreakerScore(breakerScoreRef.current);
                 
                 if (Math.random() < 0.2) powerUps.push(new PowerUp(t.x, t.y));
                 
                 break; // Hit one target per frame max
              }
           }
        }
      }
      draw(ctx) {
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
         this.baseRadius = 15 + Math.random() * 10;
         this.radius = this.baseRadius;
         this.markedForDeletion = false;
         this.color = Math.random() > 0.5 ? '#ebd73f' : '#ffffff';
         this.phase = Math.random() * Math.PI * 2;
       }
       update() {
         this.phase += 0.05;
         this.radius = this.baseRadius + Math.sin(this.phase) * 3;
       }
       hit() {
         this.markedForDeletion = true;
         fireworks.push(new Shockwave(this.x, this.y, this.color));
       }
       draw(ctx) {
         ctx.beginPath();
         ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
         ctx.strokeStyle = this.color;
         ctx.lineWidth = 2;
         ctx.stroke();
         
         // Inner dot
         ctx.beginPath();
         ctx.arc(this.x, this.y, 2, 0, Math.PI*2);
         ctx.fillStyle = this.color;
         ctx.fill();
       }
    }

    class PowerUp {
       constructor(x, y) {
          this.x = x; this.y = y;
          this.vy = 3;
          this.radius = 5;
          this.type = Math.random() < 0.3 ? 'multiball' : 'points';
          this.markedForDeletion = false;
       }
       update(paddle) {
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
             } else {
                 breakerScoreRef.current += 50; 
                 setBreakerScore(breakerScoreRef.current);
             }
             
             const particleColor = this.type === 'multiball' ? '#ff00ff' : '#00ffcc';
             fireworks.push(new Shockwave(this.x, this.y, particleColor));
          }
       }
       draw(ctx) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
          ctx.fillStyle = this.type === 'multiball' ? '#ff00ff' : '#00ffcc';
          ctx.fill();
          
          // Fake glow
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI*2);
          ctx.fillStyle = this.type === 'multiball' ? 'rgba(255,0,255,0.2)' : 'rgba(0,255,204,0.2)';
          ctx.fill();
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
      constructor(x, y, overrideColor = null) {
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
      }
      update() {
        this.speedX *= this.friction;
        this.speedY *= this.friction;
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha = Math.max(0, this.alpha - 0.02); 
        if (this.alpha === 0) this.markedForDeletion = true;
      }
      draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
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

    window.initBreakerGame = () => {
      bricks = []; // storing TargetRings here for compatibility
      balls = [new Ball()];
      powerUps = [];
      paddle = new Paddle();
      
      const cols = 7;
      const rows = 5;
      const spacingX = 60;
      const spacingY = 50;
      
      const offsetX = canvas.width / 2;
      const offsetY = 120;
      
      for(let r=0; r<rows; r++) {
         const itemsInRow = cols - Math.abs(2 - r);
         const rowOffsetX = offsetX - ((itemsInRow - 1) * spacingX) / 2;
         
         for(let c=0; c<itemsInRow; c++) {
            bricks.push(new TargetRing(rowOffsetX + c * spacingX, offsetY + r * spacingY));
         }
      }
    };

    let lastActiveGame = 'dripp';

    const animate = () => {
      // Bypassing logic for none state
      if (activeGameRef.current === 'none') {
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         animationFrameId = requestAnimationFrame(animate);
         return;
      }
      
      // Pause/Fail logic stops physics but keeps rendering the frozen frame
      if (isPausedRef.current || gameStateRef.current === 'failed') {
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
        // Smooth and slower spawn rate increase
        const rainIntensity = Math.min(0.6, 0.02 + (scoreRef.current * 0.0015));
        
        if (Math.random() < rainIntensity) drops.push(new Drop(Math.random() < 0.15));
        if (Math.random() < rainIntensity * 0.2) drops.push(new Drop(Math.random() < 0.15));
        
        drops.forEach(drop => { drop.update(); drop.draw(ctx); });
        drops = drops.filter(drop => !drop.markedForDeletion);
        
        splashes.forEach(splash => { splash.update(); splash.draw(ctx); });
        splashes = splashes.filter(splash => !splash.markedForDeletion);
        
      } else if (activeGameRef.current === 'breaker') {
        if (paddle) { paddle.update(); paddle.draw(ctx); }
        balls.forEach(ball => { ball.update(paddle, bricks); ball.draw(ctx); });
        balls = balls.filter(b => !b.markedForDeletion);
        
        // Breaker Penalty Logic
        if (balls.length === 0 && gameStateRef.current === 'playing') {
           breakerScoreRef.current -= 20;
           if (breakerScoreRef.current <= 0) {
              breakerScoreRef.current = 0;
              setGameState('failed');
           } else {
              balls.push(new Ball(canvas.width / 2, canvas.height - 120, 5, -6));
           }
           setBreakerScore(breakerScoreRef.current);
        }
        
        bricks.forEach(brick => { brick.update(); brick.draw(ctx); });
        bricks = bricks.filter(b => !b.markedForDeletion);
        if (bricks.length === 0 && balls.length > 0) window.initBreakerGame();
        
        powerUps.forEach(pu => { pu.update(paddle); pu.draw(ctx); });
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

  const handleShare = async () => {
    try {
      setIsPaused(true); 
      setIsCapturing(true);
      const html2canvas = (await import('html2canvas')).default;
      const cursor = document.querySelector('.cursor');
      if (cursor) cursor.style.opacity = '0';

      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#050505',
        scale: 2,
        ignoreElements: (element) => element.classList.contains('cursor') || element.classList.contains('easter-egg') || element.classList.contains('ui-overlay') || element.classList.contains('game-free-btn')
      });
      
      if (cursor) cursor.style.opacity = '1';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const currentScore = activeGame === 'dripp' ? score : breakerScore;
      link.download = `DrippMedia-Score-${currentScore}.png`;
      link.href = dataUrl;
      link.click();
      
      setIsCapturing(false);
    } catch (error) {
      console.error("Screenshot failed:", error);
      setIsCapturing(false);
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
          cursorActiveRef.current = false;
        }
      }}
    >
      {children}
    </button>
  );

  return (
    <div ref={containerRef} style={{
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
      <style>{`
        .cursor {
           width: 60px !important;
           height: 60px !important;
           border: 1px solid rgba(255,255,255,0.3) !important;
           background: rgba(0,0,0,0.2) !important;
           backdrop-filter: blur(4px) !important;
           border-radius: 50% !important;
           display: flex !important;
           justify-content: center !important;
           align-items: center !important;
           transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), border-color 0.15s, background 0.15s, width 0.2s, height 0.2s !important;
           z-index: 100000 !important;
        }
        .cursor::after {
           content: '';
           width: 14px;
           height: 14px;
           background: var(--brand-yellow);
           border-radius: 4px;
           transform: rotate(45deg);
           transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
           box-shadow: 0 0 15px var(--brand-yellow);
        }
        .cursor.eating {
           transform: scale(1.3) !important;
           border-color: var(--brand-yellow) !important;
           background: rgba(235, 215, 63, 0.15) !important;
        }
        .cursor.eating::after {
           width: 4px;
           height: 4px;
           background: #ffffff;
           box-shadow: 0 0 30px #ffffff;
           transform: rotate(225deg) scale(0.3);
        }
        .cursor.active {
           width: 80px !important;
           height: 80px !important;
           border-color: rgba(255,255,255,0.8) !important;
           background: rgba(255,255,255,0.1) !important;
        }
        .cursor.active::after {
           transform: rotate(90deg) scale(0.8);
           background: #ffffff;
           box-shadow: 0 0 20px #ffffff;
        }
      `}</style>
      <div className="cursor"></div>

      {/* Control Buttons (Top Left) */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', zIndex: 4, display: 'flex', gap: '15px' }}>
        {activeGame !== 'none' && gameState === 'playing' && !isPaused && (
          <PrimaryButton onClick={() => setIsPaused(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
            Pause
          </PrimaryButton>
        )}
        <div 
          onClick={() => setIsHelpOpen(true)}
          style={{
            width: '40px', height: '40px', marginTop: activeGame !== 'none' && gameState === 'playing' && !isPaused ? '15px' : '0',
            borderRadius: '50%', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', 
            border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.2rem', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          title="How to play"
        >?</div>
      </div>

      {/* Guidelines Overlay */}
      {isHelpOpen && (
        <div className="ui-overlay" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20
        }}>
           <h2 style={{ fontFamily: "'Panchang', sans-serif", color: 'var(--brand-yellow)', fontSize: '2.5rem', margin: 0 }}>HOW TO PLAY</h2>
           
           <div style={{ maxWidth: '600px', textAlign: 'center', marginTop: '20px', fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', lineHeight: 1.6 }}>
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
                 <p>Catch falling <span style={{color: '#00ffcc'}}>Cyan Drops</span> for +50 points.</p>
                 <p>Catch falling <span style={{color: '#ff00ff'}}>Magenta Drops</span> to trigger MULTI-BALL chaos!</p>
                 <br/>
                 <p>If you drop the ball, you lose 20 points. Hit 0 and you fail!</p>
               </>
             ) : (
               <p>The game is currently disabled. Toggle the Easter Egg icon in the bottom left to play!</p>
             )}
           </div>
           <PrimaryButton onClick={() => setIsHelpOpen(false)}>Close Guidelines</PrimaryButton>
        </div>
      )}

      {/* Bottom Left Buttons */}
      <div style={{ position: 'absolute', bottom: '25px', left: '25px', zIndex: 10, display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div 
          className="easter-egg"
          onClick={() => setActiveGame(prev => prev === 'breaker' ? 'dripp' : 'breaker')}
          style={{
            width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.1)', cursor: 'pointer',
            border: '1px solid rgba(235, 215, 63, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            transition: 'all 0.3s ease', boxShadow: '0 0 10px rgba(235, 215, 63, 0.2)'
          }}
          title="Play Jardinains!"
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(235, 215, 63, 0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
            <line x1="6" y1="12" x2="10" y2="12"></line>
            <line x1="8" y1="10" x2="8" y2="14"></line>
            <line x1="15" y1="13" x2="15.01" y2="13"></line>
            <line x1="18" y1="11" x2="18.01" y2="11"></line>
          </svg>
        </div>

        <div 
          className="game-free-btn"
          onClick={() => setActiveGame('none')}
          style={{
            height: '40px', padding: '0 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'rgba(255,255,255,0.5)', fontFamily: "'Clash Display', sans-serif", fontSize: '0.8rem', textTransform: 'uppercase',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          Disable Game
        </div>
      </div>

      {/* Pause Overlay */}
      {isPaused && gameState === 'playing' && activeGame !== 'none' && !isHelpOpen && (
        <div className="ui-overlay" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <h2 style={{ fontFamily: "'Panchang', sans-serif", color: 'var(--pure-white)', fontSize: '3rem', margin: 0 }}>PAUSED</h2>
           <PrimaryButton onClick={() => setIsPaused(false)}>Resume Game</PrimaryButton>
           <PrimaryButton onClick={handleShare} disabled={isCapturing}>
             {isCapturing ? "Capturing..." : "Brag your score"}
           </PrimaryButton>
        </div>
      )}

      {/* Game Over / Pause Overlays */}
      {gameState === 'failed' && !isHelpOpen && (
        <div className="ui-overlay" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'radial-gradient(circle at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)', 
           backdropFilter: 'blur(15px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <div style={{
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
             <p style={{ marginTop: '20px', fontSize: '1.2rem', color: 'rgba(255,255,255,0.7)', textAlign: 'center', letterSpacing: '1px' }}>
               {activeGame === 'dripp' ? 'You caught a bomb! Game Over.' : 'Your breaker health reached 0!'}
             </p>
             <div style={{ marginTop: '40px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
               <PrimaryButton onClick={() => {
                  scoreRef.current = 0;
                  setScore(0);
                  breakerScoreRef.current = 50;
                  setBreakerScore(50);
                  setGameState('playing');
                  setIsPaused(false);
                  if(activeGame === 'breaker') window.initBreakerGame();
               }}>Play Again</PrimaryButton>
               <PrimaryButton onClick={handleShare} disabled={isCapturing}>
                 {isCapturing ? 'Capturing...' : 'Share Score'}
               </PrimaryButton>
             </div>
           </div>
        </div>
      )}

      {/* Canvas for Games */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none', display: activeGame === 'none' ? 'none' : 'block' }} />

      {/* Game UI Score */}
      {activeGame !== 'none' && (
        <div className="game-ui" style={{
          position: 'absolute', top: '5%', right: '5%', zIndex: 2,
          fontFamily: "'Clash Display', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 'clamp(0.6rem, 2vw, 0.8rem)', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              {activeGame === 'dripp' ? 'Score' : 'Breaker Health'}
            </div>
            <div style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 600, color: gameState === 'failed' ? '#eb3f3f' : 'var(--brand-yellow)', lineHeight: 1, textShadow: gameState === 'failed' ? '0 0 20px rgba(235, 63, 63, 0.4)' : '0 0 20px rgba(235, 215, 63, 0.4)' }}>
              {activeGame === 'dripp' ? score : breakerScore}
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 60%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(60px)', opacity: 0.5, pointerEvents: 'none', zIndex: 0
      }}></div>

      <h1 style={{
        fontFamily: "'Panchang', sans-serif", fontSize: 'clamp(2rem, 10vw, 8rem)', fontWeight: 800, textTransform: 'uppercase',
        letterSpacing: '-2px', display: 'flex', gap: 'clamp(2px, 1vw, 5px)', margin: 0, zIndex: 2, overflow: 'visible', pointerEvents: 'none'
      }}>
        {titleChars.map((char, index) => (
          <span key={index} className="char" style={{ 
            display: 'inline-block', color: index < 5 ? 'var(--pure-white)' : 'var(--brand-yellow)', textShadow: index >= 5 ? '0 0 30px var(--brand-glow)' : 'none'
          }}>
            {char}
          </span>
        ))}
      </h1>

      <div style={{ overflow: 'hidden', marginTop: '2rem', pointerEvents: 'none' }}>
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
  );
}
