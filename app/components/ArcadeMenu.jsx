"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import gsap from 'gsap';

const GAMES = [
  { id: 'dripp', title: 'DRIPP DROP', color: '#ebd73f', desc: 'Catch elements, avoid bombs. High score wins.', category: 'ACTION' },
  { id: 'breaker', title: 'NEON BREAKER', color: '#33ccff', desc: 'Smash glowing capsules in this cyberpunk brick breaker.', category: 'ARCADE' },
  { id: 'scope', title: 'SCOPE CREEP', color: '#ff3366', desc: 'Defend the core from endless waves of neon enemies.', category: 'SHOOTER' },
  { id: 'snake', title: 'CYBER SNAKE', color: '#33ff33', desc: 'Grow the neon trail and avoid the digital walls.', category: 'CLASSIC' },
  { id: 'pong', title: 'RETRO PONG', color: '#ff00ff', desc: 'Beat the AI in the ultimate paddle showdown.', category: 'SPORTS' },
  { id: 'runner', title: 'VOID RUNNER', color: '#ff9900', desc: 'Endless neon run through the cyberspace tunnel.', category: 'ENDLESS' },
  { id: 'invaders', title: 'INVADERS', color: '#cc33ff', desc: 'Shoot the digital bugs descending from the grid.', category: 'SHOOTER' },
  { id: 'simon', title: 'NEON SIMON', color: '#ffffff', desc: 'Match the complex light pattern to survive.', category: 'PUZZLE' },
];

export default function ArcadeMenu({ onStartGame }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredGameId, setHoveredGameId] = useState(null);
  
  const activeColor = GAMES[activeIndex].color;

  useEffect(() => {
    // Animate background color change
    gsap.to('.arcade-bg-glow', {
      background: `radial-gradient(circle at 50% 50%, ${activeColor}25 0%, transparent 60%)`,
      duration: 1,
      ease: 'power2.out'
    });
  }, [activeIndex, activeColor]);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % GAMES.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + GAMES.length) % GAMES.length);
  };

  return (
    <div className="arcade-menu-wrapper" style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#030303',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Clash Display', sans-serif"
    }}>
      {/* Dynamic Ambient Background */}
      <div className="arcade-bg-glow" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '150vw',
        height: '150vh',
        zIndex: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at 50% 50%, ${activeColor}25 0%, transparent 60%)`
      }} />

      {/* Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        backgroundPosition: 'center center',
        zIndex: 1,
        pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 10%, transparent 80%)'
      }} />

      {/* Top Navigation / Header */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        padding: '40px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Gamepad2 size={24} color={activeColor} style={{ filter: `drop-shadow(0 0 10px ${activeColor})`, transition: 'all 0.5s ease' }} />
            <span style={{ fontSize: '13px', letterSpacing: '4px', color: activeColor, fontWeight: 600, transition: 'all 0.5s ease' }}>SYSTEM.ONLINE</span>
          </div>
          <h1 style={{
            fontFamily: "'Panchang', sans-serif",
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            fontWeight: 800,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: 1,
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            ARCADE MODE
          </h1>
        </div>
        
        <div style={{
          textAlign: 'right',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '1px',
          lineHeight: '1.8'
        }}>
          <div>DATABANK: {GAMES.length} CARTRIDGES</div>
          <div>STATUS: AWAITING INPUT</div>
          <div>ROOT: /SYSTEM/GAMES/</div>
        </div>
      </div>

      {/* Main Carousel Area */}
      <div style={{
        flex: 1,
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1500px'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '500px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transformStyle: 'preserve-3d'
        }}>
          {GAMES.map((game, index) => {
            const offset = index - activeIndex;
            const isActive = index === activeIndex;
            
            // Adjust calculation to support an endless feel or just smooth scrolling
            let translateX = offset * 280;
            let translateZ = Math.abs(offset) * -150;
            let rotateY = offset * -25;
            let scale = isActive ? 1.1 : 0.9;
            let opacity = isActive ? 1 : Math.max(1 - Math.abs(offset) * 0.4, 0);
            let zIndex = 100 - Math.abs(offset);

            if (Math.abs(offset) > 3) {
              opacity = 0;
              pointerEvents: 'none'
            }

            return (
              <div
                key={game.id}
                onClick={() => {
                  if (isActive) {
                    onStartGame(game.id);
                  } else {
                    setActiveIndex(index);
                  }
                }}
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
                style={{
                  position: 'absolute',
                  width: '320px',
                  height: '460px',
                  borderRadius: '24px',
                  background: isActive ? 'rgba(15,15,15,0.85)' : 'rgba(20,20,20,0.4)',
                  border: `1px solid ${isActive ? game.color : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isActive ? `0 30px 60px rgba(0,0,0,0.8), inset 0 0 20px ${game.color}20` : '0 10px 30px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
                  zIndex: zIndex,
                  opacity: opacity,
                  cursor: isActive ? 'default' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '35px',
                  pointerEvents: opacity === 0 ? 'none' : 'auto'
                }}
              >
                {/* Top of Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'auto' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    letterSpacing: '2px', 
                    padding: '6px 14px', 
                    background: isActive ? `${game.color}15` : 'rgba(255,255,255,0.05)',
                    color: isActive ? game.color : 'rgba(255,255,255,0.5)',
                    borderRadius: '30px',
                    border: `1px solid ${isActive ? `${game.color}40` : 'transparent'}`,
                    fontWeight: 600,
                    transition: 'all 0.5s ease'
                  }}>
                    {game.category}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                    v1.0.{index}
                  </span>
                </div>

                {/* Center of Card */}
                <div style={{ textAlign: 'center', margin: 'auto 0', transform: isActive ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 25px auto',
                    borderRadius: '50%',
                    background: `radial-gradient(circle at center, ${game.color}30 0%, transparent 70%)`,
                    border: `1px solid ${game.color}50`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? `0 0 30px ${game.color}30` : 'none',
                    transition: 'all 0.5s ease'
                  }}>
                    <Play size={32} color={game.color} fill={isActive ? game.color : 'none'} style={{ marginLeft: '4px', opacity: isActive ? 1 : 0.6, transition: 'all 0.5s ease' }} />
                  </div>
                  <h2 style={{
                    fontFamily: "'Panchang', sans-serif",
                    fontSize: '1.8rem',
                    margin: '0 0 15px 0',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'color 0.5s ease'
                  }}>
                    {game.title}
                  </h2>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.6,
                    margin: 0,
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    height: isActive ? 'auto' : 0,
                    overflow: 'hidden'
                  }}>
                    {game.desc}
                  </p>
                </div>

                {/* Bottom of Card */}
                <div style={{
                  marginTop: 'auto',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'all 0.5s ease'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isActive) onStartGame(game.id);
                    }}
                    style={{
                      width: '100%',
                      padding: '18px',
                      background: game.color,
                      color: '#000',
                      border: 'none',
                      borderRadius: '12px',
                      fontFamily: "'Panchang', sans-serif",
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      boxShadow: `0 10px 20px ${game.color}30`,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = `0 15px 25px ${game.color}50`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = `0 10px 20px ${game.color}30`;
                    }}
                  >
                    Play Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Controls */}
      <div style={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        zIndex: 20
      }}>
        <button 
          onClick={handlePrev}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.color = activeColor;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: '15px', 
          letterSpacing: '6px',
          color: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ color: '#fff', fontWeight: 'bold' }}>{String(activeIndex + 1).padStart(2, '0')}</span> 
          <span style={{ opacity: 0.3 }}>/</span> 
          <span style={{ opacity: 0.5 }}>{String(GAMES.length).padStart(2, '0')}</span>
        </div>

        <button 
          onClick={handleNext}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            e.currentTarget.style.borderColor = activeColor;
            e.currentTarget.style.color = activeColor;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = '#fff';
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Footer / Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '3%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        pointerEvents: 'none'
      }}>
         <p style={{ 
          color: "rgba(255,255,255,0.2)", 
          fontFamily: "'Clash Display', sans-serif", 
          letterSpacing: "4px",
          fontSize: '0.75rem',
          textTransform: 'uppercase'
        }}>
          Use arrows to navigate • Select to initialize
        </p>
      </div>
    </div>
  );
}
