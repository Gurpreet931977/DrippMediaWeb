"use client";

import React, { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, Gamepad2 } from 'lucide-react';
import gsap from 'gsap';

const ARCADE_GAMES = [
  { id: 'dripp', title: 'DRIPP DROP', color: '#ebd73f', desc: 'Catch elements, avoid bombs. High score wins.', category: 'ACTION' },
  { id: 'breaker', title: 'NEON BREAKER', color: '#33ccff', desc: 'Smash glowing capsules in this cyberpunk brick breaker.', category: 'ARCADE' },
  { id: 'pendulum', title: 'NEON PENDULUM', color: '#ff3366', desc: 'Swing through the void with physics-based grappling.', category: 'PHYSICS' },
  { id: 'gravity', title: 'GRAVITY FLIP', color: '#33ff33', desc: 'Invert gravity to survive the high-speed neon maze.', category: 'RUNNER' },
  { id: 'slingshot', title: 'SLINGSHOT NINJA', color: '#ff00ff', desc: 'Bullet-time dash attacks. Slice through the grid.', category: 'ACTION' },
  { id: 'bullethell', title: 'BULLET HELL', color: '#ff0000', desc: 'Dodge an overwhelming barrage of neon lasers.', category: 'BOSS' },
];

const CREATIVE_GAMES = [
  { id: 'sandbox', title: 'LIQUID LIGHT', color: '#00d2ff', desc: 'A soothing falling sand and fluid physics sandbox.', category: 'ZEN' },
  { id: 'mandala', title: 'MANDALA MAKER', color: '#b366ff', desc: 'Draw breathtaking geometric light patterns instantly.', category: 'CREATIVE' },
  { id: 'nodeweaver', title: 'ZEN NODE WEAVER', color: '#33ffcc', desc: 'Connect floating orbs to weave relaxing string art.', category: 'CHILL' },
  { id: 'looper', title: 'HARMONIC LOOPER', color: '#ff9933', desc: 'Generate expanding ripples and visual beats.', category: 'AUDIO' },
];

export default function ArcadeMenu({ onStartGame }) {
  const [activeMode, setActiveMode] = useState('arcade'); // 'arcade' or 'creative'
  const activeGameList = activeMode === 'arcade' ? ARCADE_GAMES : CREATIVE_GAMES;
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredGameId, setHoveredGameId] = useState(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  // Developer Access State
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pendingGameId, setPendingGameId] = useState(null);
  
  const activeColor = activeGameList[activeIndex]?.color || '#ffffff';

  // Reset index when mode changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeMode]);

  useEffect(() => {
    // Animate background color change
    gsap.to('.arcade-bg-glow', {
      background: `radial-gradient(circle at 50% 50%, ${activeColor}25 0%, transparent 60%)`,
      duration: 1,
      ease: 'power2.out'
    });
  }, [activeIndex, activeColor]);

  // Playful Gamified Sparks on Click
  useEffect(() => {
    if (activeMode !== 'arcade') return;
    const handleGlobalClick = (e) => {
      // Create 4-6 sparks
      const sparkCount = Math.floor(Math.random() * 3) + 4;
      const colors = ['#ff3366', '#33ccff', '#ebd73f', '#33ff33', '#ff00ff'];
      for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('div');
        spark.style.position = 'fixed';
        spark.style.left = e.clientX + 'px';
        spark.style.top = e.clientY + 'px';
        spark.style.width = Math.random() > 0.5 ? '6px' : '10px';
        spark.style.height = spark.style.width;
        spark.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        spark.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        spark.style.pointerEvents = 'none';
        spark.style.zIndex = 9999;
        spark.style.boxShadow = `0 0 10px ${spark.style.backgroundColor}`;
        document.body.appendChild(spark);
        
        gsap.to(spark, {
          x: (Math.random() - 0.5) * 140,
          y: (Math.random() - 0.5) * 140,
          rotation: Math.random() * 360,
          scale: 0,
          opacity: 0,
          duration: 0.4 + Math.random() * 0.4,
          ease: "power2.out",
          onComplete: () => spark.remove()
        });
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [activeMode]);

  const triggerElasticBounce = (e) => {
    if (activeMode !== 'arcade' || !e || !e.currentTarget) return;
    const el = e.currentTarget;
    gsap.killTweensOf(el);
    gsap.fromTo(el, 
      { scale: 0.85 }, 
      { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.3)" }
    );
  };

  const triggerGameStartWarp = (gameId) => {
    if (activeMode !== 'arcade') {
      onStartGame(gameId);
      return;
    }
    const wrapper = document.querySelector('.arcade-menu-wrapper');
    gsap.to(wrapper, {
      scale: 1.5,
      opacity: 0,
      filter: 'blur(20px)',
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        onStartGame(gameId);
        // Reset for when we come back
        gsap.set(wrapper, { scale: 1, opacity: 1, filter: 'blur(0px)' });
      }
    });
  };

  const handleNext = (e) => {
    if (e && e.currentTarget) triggerElasticBounce(e);
    setActiveIndex((prev) => (prev + 1) % activeGameList.length);
  };

  const handlePrev = (e) => {
    if (e && e.currentTarget) triggerElasticBounce(e);
    setActiveIndex((prev) => (prev - 1 + activeGameList.length) % activeGameList.length);
  };

  // Pointer event handlers for dragging
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX || e.touches?.[0]?.clientX || 0);
    setDragOffset(0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || e.touches?.[0]?.clientX || 0;
    setDragOffset(currentX - startX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Swipe threshold
    if (dragOffset > 100) {
      handlePrev();
    } else if (dragOffset < -100) {
      handleNext();
    }
    setDragOffset(0);
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
      <style>{`
        @keyframes floatActive {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .gamified-float {
          animation: floatActive 2.5s ease-in-out infinite;
        }
      `}</style>
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
        padding: '30px 60px 10px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Gamepad2 size={24} color={activeColor} style={{ filter: `drop-shadow(0 0 10px ${activeColor})`, transition: 'all 0.5s ease' }} />
            <span style={{ fontSize: '13px', letterSpacing: '4px', color: activeColor, fontWeight: 600, transition: 'all 0.5s ease' }}>SYSTEM.ONLINE</span>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <h1 
              onClick={(e) => { triggerElasticBounce(e); setActiveMode('arcade'); }}
              style={{
                fontFamily: "'Panchang', sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 800,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                lineHeight: 1,
                cursor: 'pointer',
                color: activeMode === 'arcade' ? '#fff' : 'rgba(255,255,255,0.3)',
                textShadow: activeMode === 'arcade' ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                transition: 'color 0.3s'
              }}>
              ARCADE
            </h1>
            <h1 
              onClick={(e) => { triggerElasticBounce(e); setActiveMode('creative'); }}
              style={{
                fontFamily: "'Panchang', sans-serif",
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 800,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                lineHeight: 1,
                cursor: 'pointer',
                color: activeMode === 'creative' ? '#fff' : 'rgba(255,255,255,0.3)',
                textShadow: activeMode === 'creative' ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                transition: 'color 0.3s'
              }}>
              CREATIVE
            </h1>
          </div>
        </div>
        
        <div style={{
          textAlign: 'right',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '1px',
          lineHeight: '1.8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          <div>
            <div>DATABANK: {activeGameList.length} CARTRIDGES</div>
            <div>STATUS: {isDeveloper ? 'DEV_MODE_ACTIVE' : 'AWAITING INPUT'}</div>
            <div>ROOT: /SYSTEM/{activeMode === 'arcade' ? 'GAMES' : 'CREATIVE'}/</div>
          </div>
          {!isDeveloper && (
            <button 
              onClick={() => setShowPasswordModal(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.8)',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
            >
              [ GET DEVELOPER ACCESS ]
            </button>
          )}
        </div>
      </div>

      {/* Main Carousel Area */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: '1500px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none' // Prevent pull-to-refresh and swiping on mobile
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '420px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          transformStyle: 'preserve-3d',
          pointerEvents: 'none' // Let the container handle the drag events mostly
        }}>
          {activeGameList.map((game, index) => {
            const offset = index - activeIndex;
            const isActive = index === activeIndex;
            
            // Apply drag offset to the base offset for fluid dragging
            const activeOffsetRaw = offset - (isDragging ? dragOffset / 300 : 0);
            
            let translateX = activeOffsetRaw * 280;
            let translateZ = Math.abs(activeOffsetRaw) * -150;
            let rotateY = activeOffsetRaw * -25;
            
            // Scaling logic
            let scale = 0.9;
            if (Math.abs(activeOffsetRaw) < 1) {
              scale = 0.9 + (0.2 * (1 - Math.abs(activeOffsetRaw))); // peaks at 1.1 when activeOffsetRaw is 0
            }

            let opacity = Math.max(1 - Math.abs(activeOffsetRaw) * 0.4, 0);
            let zIndex = 100 - Math.round(Math.abs(activeOffsetRaw) * 10);

            if (Math.abs(activeOffsetRaw) > 3) {
              opacity = 0;
            }

            // ultra smooth bouncy transition when not dragging
            const baseTransition = isDragging 
              ? 'none' 
              : 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';

            return (
              <div
                key={game.id}
                onClick={(e) => {
                  // Prevent click if we were dragging
                  if (Math.abs(dragOffset) > 10) { e.preventDefault(); e.stopPropagation(); return; }
                  
                  if (isActive) {
                    triggerElasticBounce(e);
                    const isOriginalGame = game.id === 'dripp' || game.id === 'breaker' || game.id === 'scope';
                    if (!isOriginalGame && !isDeveloper) {
                      setPendingGameId(game.id);
                      setShowPasswordModal(true);
                    } else {
                      triggerGameStartWarp(game.id);
                    }
                  } else {
                    setActiveIndex(index);
                  }
                }}
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
                style={{
                  position: 'absolute',
                  width: '320px',
                  height: '340px',
                  borderRadius: '24px',
                  background: isActive ? 'rgba(15,15,15,0.85)' : 'rgba(20,20,20,0.4)',
                  border: `1px solid ${isActive ? game.color : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isActive ? `0 30px 60px rgba(0,0,0,0.8), inset 0 0 20px ${game.color}20` : '0 10px 30px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transition: `${baseTransition}, background 0.5s ease, border 0.5s ease, box-shadow 0.5s ease`,
                  zIndex: zIndex,
                  opacity: opacity,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '0',
                  pointerEvents: opacity === 0 ? 'none' : 'auto'
                }}
              >
                <div className={(isActive && activeMode === 'arcade') ? 'gamified-float' : ''} style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '30px',
                  boxSizing: 'border-box'
                }}>
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
                      if (isActive) {
                        triggerElasticBounce(e);
                        const isOriginalGame = game.id === 'dripp' || game.id === 'breaker' || game.id === 'scope';
                        if (!isOriginalGame && !isDeveloper) {
                          setPendingGameId(game.id);
                          setShowPasswordModal(true);
                        } else {
                          triggerGameStartWarp(game.id);
                        }
                      }
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
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Carousel Controls (Moved below carousel with standard flow layout) */}
      <div style={{
        padding: '0px 0 60px 0',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        justifyContent: 'center',
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
          <span style={{ opacity: 0.5 }}>{String(activeGameList.length).padStart(2, '0')}</span>
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
        bottom: '20px',
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
          Use arrows or drag to navigate • Select to initialize
        </p>
      </div>
      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <div style={{
            background: '#111',
            border: `1px solid ${passwordError ? '#ff3333' : '#333'}`,
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            minWidth: '300px',
            boxShadow: passwordError ? '0 0 30px rgba(255,51,51,0.2)' : '0 20px 50px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', letterSpacing: '2px', color: '#fff' }}>DEVELOPER ACCESS</h2>
            <input
              autoFocus
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (passwordError) setPasswordError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (passwordInput === 'Drippies') {
                    setIsDeveloper(true);
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    if (pendingGameId) {
                      onStartGame(pendingGameId);
                      setPendingGameId(null);
                    }
                  } else {
                    setPasswordError(true);
                  }
                } else if (e.key === 'Escape') {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError(false);
                  setPendingGameId(null);
                }
              }}
              placeholder={passwordError ? "ACCESS DENIED" : "ENTER PASSWORD"}
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${passwordError ? '#ff3333' : 'rgba(255,255,255,0.1)'}`,
                color: passwordError ? '#ff3333' : '#fff',
                fontFamily: 'monospace',
                fontSize: '1rem',
                textAlign: 'center',
                outline: 'none',
                borderRadius: '8px',
                letterSpacing: '2px'
              }}
            />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
               <button onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                  setPasswordError(false);
                  setPendingGameId(null);
               }} style={{
                 padding: '8px 16px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer'
               }}>CANCEL</button>
               <button onClick={() => {
                  if (passwordInput === 'Drippies') {
                    setIsDeveloper(true);
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    if (pendingGameId) {
                      onStartGame(pendingGameId);
                      setPendingGameId(null);
                    }
                  } else {
                    setPasswordError(true);
                  }
               }} style={{
                 padding: '8px 16px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
               }}>SUBMIT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
