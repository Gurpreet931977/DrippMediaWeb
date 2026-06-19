"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ComingSoon() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const scoreRef = useRef(0);
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);
  const lastMilestoneRef = useRef(0);

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
    let miniParticles = [];
    let fireworks = [];
    let lastDropTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Drop {
      constructor(isRed = false) {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.vy = 0.5 + Math.random() * 0.8; // Slower initial fall velocity
        this.gravity = 0.05 + Math.random() * 0.04; // Gentler acceleration
        this.radius = 3 + Math.random() * 3;
        this.markedForDeletion = false;
        this.isRed = isRed;
        this.color = isRed ? 'rgba(235, 63, 63, 0.9)' : 'rgba(235, 215, 63, 0.9)'; // Red or Yellow
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 0.03 + Math.random() * 0.03;
      }
      update() {
        this.vy += this.gravity;
        this.y += this.vy;
        this.x += Math.sin(this.wobble) * 1.5;
        this.wobble += this.wobbleSpeed;

        if (this.y > canvas.height + 50) {
          this.markedForDeletion = true;
          // Missing a red drop decreases points
          if (this.isRed) {
            scoreRef.current = Math.max(0, scoreRef.current - 5);
            setScore(scoreRef.current);
          }
        }
        
        // Collision with mouse
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use a larger hit radius if cursor is active
        const hitRadius = cursorActiveRef.current ? 40 : 25;

        if (distance < this.radius + hitRadius) {
          this.markedForDeletion = true;
          
          if (!this.isRed) {
            scoreRef.current += 1;
          }
          // Catching a red drop does not decrease points now, you successfully avoided the penalty
          
          setScore(scoreRef.current);
          
          // Check milestone every 50 points
          if (scoreRef.current > 0 && scoreRef.current % 50 === 0 && scoreRef.current !== lastMilestoneRef.current) {
            lastMilestoneRef.current = scoreRef.current;
            triggerMilestoneAnimation(this.x, this.y);
          }

          // Poppy Burst Effect
          splashes.push(new Splash(this.x, this.y, this.isRed));
          for (let i = 0; i < 8; i++) {
            miniParticles.push(new MiniParticle(this.x, this.y, this.isRed));
          }
        }
      }
      draw(ctx) {
        ctx.beginPath();
        // Dynamic teardrop shape stretching with speed
        const stretch = Math.min(this.vy * 1.2, this.radius * 4);
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
        ctx.lineTo(this.x, this.y - stretch);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isRed ? 'rgba(235, 63, 63, 0.6)' : 'rgba(235, 215, 63, 0.5)';
      }
    }

    class MiniParticle {
      constructor(x, y, isRed) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 1 + Math.random() * 2.5;
        this.color = isRed ? 'rgba(235, 63, 63, 1)' : 'rgba(235, 215, 63, 1)';
        this.alpha = 1;
        this.friction = 0.90;
        this.markedForDeletion = false;
      }
      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.03;
        if (this.alpha <= 0) this.markedForDeletion = true;
      }
      draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    class Splash {
      constructor(x, y, isRed) {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.alpha = 1;
        this.isRed = isRed;
        this.markedForDeletion = false;
        this.expansionSpeed = 10;
      }
      update() {
        this.radius += this.expansionSpeed;
        this.expansionSpeed *= 0.85; // Fast expansion slowing down (poppy)
        this.alpha -= 0.05;
        if (this.alpha <= 0) {
          this.markedForDeletion = true;
        }
      }
      draw(ctx) {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.isRed ? `rgba(235, 63, 63, ${this.alpha})` : `rgba(235, 215, 63, ${this.alpha})`;
        ctx.lineWidth = 3 * this.alpha;
        ctx.stroke();
        ctx.closePath();
      }
    }

    class FireworkParticle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 15;
        this.speedX = Math.cos(angle) * velocity;
        this.speedY = Math.sin(angle) * velocity;
        this.radius = 1.5 + Math.random() * 4;
        this.color = Math.random() > 0.5 ? '#ebd73f' : '#ffffff';
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
        this.alpha -= 0.015;
        if (this.alpha <= 0) this.markedForDeletion = true;
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
      // 1. Canvas Fireworks at the point of the milestone drop
      for(let i = 0; i < 80; i++) {
        fireworks.push(new FireworkParticle(x, y));
      }
      
      // 2. GSAP Poppy Text Animation
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
      
      // 3. Screen shake
      gsap.fromTo(canvas, 
        { x: -15 }, 
        { x: 15, duration: 0.05, yoyo: true, repeat: 7, ease: "none", onComplete: () => gsap.set(canvas, {x: 0}) }
      );
    };

    const animate = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Spawn rate: Drops spawn more frequently now
      const spawnRate = Math.max(100, 350 - scoreRef.current * 4);

      if (timestamp - lastDropTime > spawnRate) {
        // 15% chance for a red (minus) drop
        const isRed = Math.random() < 0.15;
        drops.push(new Drop(isRed));
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

      miniParticles.forEach(mp => {
        mp.update();
        mp.draw(ctx);
      });
      miniParticles = miniParticles.filter(mp => !mp.markedForDeletion);
      
      fireworks.forEach(fw => {
        fw.update();
        fw.draw(ctx);
      });
      fireworks = fireworks.filter(fw => !fw.markedForDeletion);
      
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

  const handleShare = async () => {
    try {
      setIsCapturing(true);
      
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Temporarily hide cursor if visible
      const cursor = document.querySelector('.cursor');
      if (cursor) cursor.style.opacity = '0';

      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#050505',
        scale: 2,
        ignoreElements: (element) => element.classList.contains('cursor')
      });
      
      if (cursor) cursor.style.opacity = '1';

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `DrippMedia-Score-${score}.png`;
      link.href = dataUrl;
      link.click();
      
      setIsCapturing(false);
    } catch (error) {
      console.error("Screenshot failed:", error);
      setIsCapturing(false);
    }
  };

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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
            Dripps Caught
          </div>
          <div style={{ fontSize: '3.5rem', fontWeight: 600, color: 'var(--brand-yellow)', lineHeight: 1, textShadow: '0 0 20px rgba(235, 215, 63, 0.4)' }}>
            {score}
          </div>
        </div>

        {/* Share Button - Shows only when score >= 50 and hides during capture */}
        <button 
          onClick={handleShare}
          disabled={isCapturing}
          style={{
            opacity: (score >= 50 && !isCapturing) ? 1 : 0,
            pointerEvents: (score >= 50 && !isCapturing) ? 'auto' : 'none',
            transform: (score >= 50 && !isCapturing) ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(235, 215, 63, 0.3)',
            color: 'var(--pure-white)',
            padding: '8px 16px',
            borderRadius: '30px',
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(10px)',
            marginTop: '10px',
            cursor: 'none'
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
          {isCapturing ? (
            "Capturing..."
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Brag your score
            </>
          )}
        </button>
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
        overflow: 'visible',
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
        {[
          { label: 'Instagram', url: 'https://www.instagram.com/drippmedia_', target: '_blank' },
          { label: 'WhatsApp', url: 'https://wa.me/917300595147', target: '_blank' },
          { label: '+91 78189 95147', url: 'tel:+917818995147', target: '_self' }
        ].map((item) => (
          <a key={item.label} href={item.url} target={item.target} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} className="social-link" style={{
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
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
