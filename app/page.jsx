"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ComingSoon() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);

  useEffect(() => {
    // Add loaded class to body as required by globals.css
    document.body.classList.add('loaded');
    
    // Custom cursor functionality
    const cursor = document.querySelector('.cursor');
    
    const moveCursor = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (cursor) {
        gsap.to(cursor, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: "power2.out"
        });
      }
    };
    
    window.addEventListener("mousemove", moveCursor);

    // --- GAME LOGIC ---
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let drops = [];
    let splashes = [];
    let lastDropTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Drop {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.speed = 3 + Math.random() * 4;
        this.radius = 3 + Math.random() * 3;
        this.markedForDeletion = false;
        this.color = 'rgba(235, 215, 63, 0.9)'; // var(--brand-yellow)
        this.wobble = Math.random() * Math.PI * 2;
      }
      update() {
        this.y += this.speed;
        this.x += Math.sin(this.wobble) * 1;
        this.wobble += 0.05;

        if (this.y > canvas.height + 20) {
          this.markedForDeletion = true;
          // Reset score if missed to make it a bit challenging? No, let's keep it chill.
        }
        
        // Collision with mouse
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use a larger hit radius if cursor is active (hovering links) or just default 30
        const hitRadius = cursorActiveRef.current ? 40 : 25;

        if (distance < this.radius + hitRadius) {
          this.markedForDeletion = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          splashes.push(new Splash(this.x, this.y));
        }
      }
      draw(ctx) {
        ctx.beginPath();
        // Draw teardrop shape roughly
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
        ctx.lineTo(this.x, this.y - this.radius * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(235, 215, 63, 0.5)';
      }
    }

    class Splash {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 30 + Math.random() * 20;
        this.alpha = 1;
        this.markedForDeletion = false;
      }
      update() {
        this.radius += 2;
        this.alpha -= 0.04;
        if (this.alpha <= 0) {
          this.markedForDeletion = true;
        }
      }
      draw(ctx) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(235, 215, 63, ${this.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }
    }

    const animate = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Spawn rate based on score (gets slightly faster)
      const spawnRate = Math.max(300, 1000 - scoreRef.current * 10);

      if (timestamp - lastDropTime > spawnRate) {
        drops.push(new Drop());
        lastDropTime = timestamp;
      }
      
      drops.forEach(drop => {
        drop.update();
        drop.draw(ctx);
      });
      drops = drops.filter(drop => !drop.markedForDeletion);
      
      splashes.forEach(splash => {
        splash.update();
        splash.draw(ctx);
      });
      splashes = splashes.filter(splash => !splash.markedForDeletion);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate(0);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
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
      overflow: 'hidden'
    }}>
      <div className="cursor"></div>

      {/* Canvas for Game */}
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1, 
          pointerEvents: 'none' 
        }}
      />

      {/* Game UI */}
      <div className="game-ui" style={{
        position: 'absolute',
        top: '40px',
        right: '40px',
        zIndex: 2,
        fontFamily: "'Clash Display', sans-serif",
        color: 'var(--pure-white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end'
      }}>
        <div style={{ fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.5, textTransform: 'uppercase' }}>
          Dripps Caught
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 600, color: 'var(--brand-yellow)', lineHeight: 1 }}>
          {score}
        </div>
        {score >= 50 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--brand-yellow)', marginTop: '5px', letterSpacing: '1px' }}>
            Maximum Dripp Achieved!
          </div>
        )}
      </div>

      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 60%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(60px)',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      {/* Main Title */}
      <h1 style={{
        fontFamily: "'Panchang', sans-serif",
        fontSize: 'clamp(3rem, 10vw, 8rem)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '-2px',
        display: 'flex',
        gap: '5px',
        margin: 0,
        zIndex: 2,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {titleChars.map((char, index) => (
          <span key={index} className="char" style={{ 
            display: 'inline-block',
            color: index < 5 ? 'var(--pure-white)' : 'var(--brand-yellow)',
            textShadow: index >= 5 ? '0 0 30px var(--brand-glow)' : 'none'
          }}>
            {char}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <div style={{ overflow: 'hidden', marginTop: '2rem', pointerEvents: 'none' }}>
        <p className="subtitle" style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.5rem)',
          color: 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '5px',
          textTransform: 'uppercase',
          zIndex: 2,
          textAlign: 'center',
          margin: 0
        }}>
          Coming Soon
        </p>
      </div>

      {/* Social Links */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '4rem',
        zIndex: 2
      }}>
        {['Instagram', 'Twitter', 'Contact'].map((item) => (
          <a key={item} href="#" className="social-link" style={{
            color: 'var(--pure-white)',
            textDecoration: 'none',
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.9rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: '1px solid transparent',
            transition: 'border-color 0.3s ease, color 0.3s ease',
            paddingBottom: '5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--brand-yellow)';
            e.target.style.color = 'var(--brand-yellow)';
            const cursor = document.querySelector('.cursor');
            if(cursor) {
              cursor.classList.add('active');
              cursorActiveRef.current = true;
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.color = 'var(--pure-white)';
            const cursor = document.querySelector('.cursor');
            if(cursor) {
              cursor.classList.remove('active');
              cursorActiveRef.current = false;
            }
          }}
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  );
}
