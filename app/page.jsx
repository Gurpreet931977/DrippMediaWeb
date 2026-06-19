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
  
  const [score, setScore] = useState(50); // Dripp starts at 50
  const scoreRef = useRef(50);
  
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
      scoreRef.current = 50;
      setScore(50);
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
        this.isGold = !isRed && Math.random() < 0.05; // 5% chance of golden drop
        this.isRed = isRed;
        
        const level = Math.floor(scoreRef.current / 10);
        const speedMult = 1 + (level * 0.4); 
        
        this.vy = (0.5 + Math.random() * 1) * speedMult; 
        this.gravity = (0.02 + Math.random() * 0.01) * speedMult; 
        
        this.radius = 2 + Math.random() * 2; 
        this.length = this.vy * 2; 
        this.markedForDeletion = false;
        
        if (this.isGold) {
           this.color = '#ffd700'; // Gold
        } else {
           this.color = isRed ? 'rgba(235, 63, 63, 0.9)' : 'rgba(235, 215, 63, 0.9)'; 
        }
        
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = (0.02 + Math.random() * 0.02) * (1 + level * 0.2);
      }
      update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.x += Math.sin(this.wobble) * 1.2; 
        this.wobble += this.wobbleSpeed;
        this.length = this.vy * 2;

        if (this.y > canvas.height + this.length) {
          this.markedForDeletion = true;
          
          if (this.isGold) {
             // Missed gold drop doesn't penalize heavily, maybe just -1
             scoreRef.current -= 1;
          } else if (this.isRed) {
             scoreRef.current -= 5;
          } else {
             scoreRef.current -= 1; 
          }
          
          if (scoreRef.current <= 0) {
            scoreRef.current = 0;
            setGameState('failed');
          }
          setScore(scoreRef.current);
        }
        
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const hitRadius = cursorActiveRef.current ? 40 : 25;

        if (distance < hitRadius) {
          this.markedForDeletion = true;
          
          if (this.isGold) {
             scoreRef.current += 20;
             for(let i=0; i<40; i++) fireworks.push(new FireworkParticle(this.x, this.y, '#ffd700'));
          } else if (!this.isRed) {
             scoreRef.current += 1;
          } else {
             scoreRef.current += 2; 
          }
          setScore(scoreRef.current);
          
          if (scoreRef.current > 50 && scoreRef.current % 50 === 0 && scoreRef.current !== lastMilestoneRef.current) {
            lastMilestoneRef.current = scoreRef.current;
            triggerMilestoneAnimation(this.x, this.y);
          }

          splashes.push(new Splash(this.x, this.y, this.isRed, this.isGold));
          for (let i = 0; i < 6; i++) {
            miniParticles.push(new MiniParticle(this.x, this.y, this.isRed, this.isGold ? '#ffd700' : null));
          }
        }
      }
      draw(ctx) {
        ctx.beginPath();
        const stretch = Math.min(this.vy * 1.2, this.radius * 5);
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
        ctx.lineTo(this.x, this.y - stretch);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 15;
        if (this.isGold) ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
        else ctx.shadowColor = this.isRed ? 'rgba(235, 63, 63, 0.6)' : 'rgba(235, 215, 63, 0.5)';
      }
    }

    class Paddle {
      constructor() {
        this.w = 140;
        this.h = 16;
        this.x = canvas.width / 2 - this.w / 2;
        this.y = canvas.height - 80;
      }
      update() {
        this.x += (mouseRef.current.x - this.w / 2 - this.x) * 0.2;
        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;
      }
      draw(ctx) {
        let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y);
        grad.addColorStop(0, '#050505');
        grad.addColorStop(0.5, 'var(--pure-white)');
        grad.addColorStop(1, '#050505');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, this.h/2);
        ctx.fill();
        
        ctx.strokeStyle = 'var(--brand-yellow)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    class Ball {
      constructor(x, y, vx, vy) {
        this.radius = 8;
        this.x = x || canvas.width / 2;
        this.y = y || canvas.height - 120;
        this.vx = vx || 5 * (Math.random() > 0.5 ? 1 : -1);
        this.vy = vy || -6;
        this.trail = [];
        this.markedForDeletion = false;
      }
      update(paddle, bricks) {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) this.vx *= -1;
        if (this.y - this.radius <= 0) this.vy *= -1;
        
        // Floor drop
        if (this.y > canvas.height + 20) {
           this.markedForDeletion = true;
        }
        
        if (
          this.y + this.radius >= paddle.y &&
          this.y - this.radius <= paddle.y + paddle.h &&
          this.x >= paddle.x &&
          this.x <= paddle.x + paddle.w &&
          this.vy > 0
        ) {
          this.vy *= -1.02; 
          let hitPoint = this.x - (paddle.x + paddle.w / 2);
          this.vx = hitPoint * 0.15;
          for(let i=0; i<3; i++) miniParticles.push(new MiniParticle(this.x, this.y, false));
        }
        
        for(let b of bricks) {
           if (!b.markedForDeletion) {
              if (
                 this.x + this.radius > b.x && this.x - this.radius < b.x + b.w &&
                 this.y + this.radius > b.y && this.y - this.radius < b.y + b.h
              ) {
                 b.markedForDeletion = true;
                 this.vy *= -1;
                 breakerScoreRef.current += 10;
                 setBreakerScore(breakerScoreRef.current);
                 
                 if (Math.random() < 0.25) {
                    powerUps.push(new PowerUp(b.x + b.w/2, b.y + b.h/2));
                 }
                 for(let i=0; i<5; i++) miniParticles.push(new MiniParticle(this.x, this.y, false));
                 break; 
              }
           }
        }
      }
      draw(ctx) {
        ctx.beginPath();
        if (this.trail.length > 0) {
           ctx.moveTo(this.trail[0].x, this.trail[0].y);
           for(let i=1; i<this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
           ctx.strokeStyle = `rgba(235, 215, 63, 0.4)`;
           ctx.lineWidth = this.radius * 1.5;
           ctx.lineCap = 'round';
           ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'var(--brand-yellow)';
        ctx.shadowBlur = 0;
      }
    }

    class Brick {
       constructor(x, y, w, h, row) {
         this.x = x; this.y = y; this.w = w; this.h = h;
         this.markedForDeletion = false;
         const colors = ['#ff3333', '#ebd73f', '#33ff33', '#3333ff', '#ff33ff'];
         this.color = colors[row % colors.length];
       }
       draw(ctx) {
         ctx.fillStyle = this.color;
         ctx.shadowBlur = 10;
         ctx.shadowColor = this.color;
         ctx.beginPath();
         ctx.roundRect(this.x, this.y, this.w, this.h, this.h / 2); // Pill shape
         ctx.fill();
         // Gloss highlight
         ctx.fillStyle = 'rgba(255,255,255,0.3)';
         ctx.beginPath();
         ctx.roundRect(this.x + 5, this.y + 2, this.w - 10, this.h / 4, this.h / 8);
         ctx.fill();
         ctx.shadowBlur = 0;
       }
    }

    class PowerUp {
       constructor(x, y) {
          this.x = x; this.y = y;
          this.vy = 2.5;
          this.radius = 6;
          this.type = Math.random() < 0.3 ? 'multiball' : 'points';
          this.markedForDeletion = false;
       }
       update(paddle) {
          this.y += this.vy;
          if (this.y > canvas.height + 20) this.markedForDeletion = true;
          
          if (
            this.y + this.radius >= paddle.y &&
            this.y - this.radius <= paddle.y + paddle.h &&
            this.x >= paddle.x &&
            this.x <= paddle.x + paddle.w
          ) {
             this.markedForDeletion = true;
             
             if (this.type === 'multiball') {
                 balls.push(new Ball(paddle.x + paddle.w/2, paddle.y - 10, -4, -6));
                 balls.push(new Ball(paddle.x + paddle.w/2, paddle.y - 10, 4, -6));
             } else {
                 breakerScoreRef.current += 50; 
                 setBreakerScore(breakerScoreRef.current);
             }
             
             const particleColor = this.type === 'multiball' ? '#ff00ff' : '#00ffcc';
             for(let i=0; i<8; i++) miniParticles.push(new MiniParticle(this.x, this.y, false, particleColor));
          }
       }
       draw(ctx) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
          ctx.fillStyle = this.type === 'multiball' ? '#ff00ff' : '#00ffcc';
          ctx.fill();
          ctx.shadowBlur = 15;
          ctx.shadowColor = this.type === 'multiball' ? '#ff00ff' : '#00ffcc';
          ctx.shadowBlur = 0;
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
      constructor(x, y, isRed, isGold = false) {
        this.x = x; this.y = y;
        this.radius = 2;
        this.alpha = 1;
        this.isRed = isRed;
        this.isGold = isGold;
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
        if (this.isGold) ctx.strokeStyle = `rgba(255, 215, 0, ${this.alpha})`;
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
      bricks = [];
      balls = [new Ball()];
      powerUps = [];
      paddle = new Paddle();
      
      const rows = 5;
      const w = Math.min(70, canvas.width / 6); 
      const padding = 15;
      const cols = Math.floor(canvas.width / (w + padding));
      const offsetX = (canvas.width - (cols * (w + padding))) / 2;
      
      for(let r=0; r<rows; r++) {
         for(let c=0; c<cols; c++) {
            let h = 25;
            bricks.push(new Brick(offsetX + c*(w+padding), 80 + r*(h + padding), w, 25, r));
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
        const level = Math.floor(scoreRef.current / 10);
        const rainIntensity = Math.min(1.0, 0.02 + (level * 0.015));
        
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
        
        bricks.forEach(brick => brick.draw(ctx));
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
                 <p>Catch <span style={{color: '#eb3f3f'}}>Red Drops</span> for +2 points.</p>
                 <p>Catch rare <span style={{color: '#ffd700'}}>Golden Drops</span> for +20 points!</p>
                 <br/>
                 <p>Missing a yellow drop subtracts 1 point. Missing a red drop subtracts 5. If your score hits 0, you fail!</p>
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
          onClick={() => setActiveGame(prev => prev === 'dripp' ? 'breaker' : 'dripp')}
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

      {/* Game Over Overlay */}
      {gameState === 'failed' && activeGame !== 'none' && !isHelpOpen && (
        <div className="ui-overlay" style={{
           position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
           background: 'rgba(235, 63, 63, 0.15)', backdropFilter: 'blur(10px)',
           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 10
        }}>
           <h2 style={{ fontFamily: "'Panchang', sans-serif", color: '#eb3f3f', fontSize: 'clamp(3rem, 8vw, 5rem)', margin: 0, textShadow: '0 0 30px rgba(235, 63, 63, 0.5)' }}>
             DRIPPED OUT!
           </h2>
           <p style={{ fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', marginTop: '10px' }}>
             You let too many slip away.
           </p>
           <div style={{ marginTop: '30px', display: 'flex', gap: '20px' }}>
             <PrimaryButton onClick={() => {
                scoreRef.current = 50;
                setScore(50);
                breakerScoreRef.current = 50;
                setBreakerScore(50);
                setGameState('playing');
                setIsPaused(false);
                if(activeGame === 'breaker') window.initBreakerGame();
             }}>Play Again</PrimaryButton>
             <PrimaryButton onClick={handleShare} disabled={isCapturing}>
               {isCapturing ? "Capturing..." : "Brag your score"}
             </PrimaryButton>
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
              {activeGame === 'dripp' ? 'Dripp Health' : 'Breaker Health'}
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
