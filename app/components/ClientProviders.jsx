"use client";

import React, { useEffect, useState } from 'react';
import { GenzProvider, useGenz } from '../contexts/GenzContext';

function GlobalGenzToggle() {
  const { isGenz, setIsGenz, isLoaded } = useGenz();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animType, setAnimType] = useState('on');

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0 });
  const dragStartCoords = React.useRef({ x: 0, y: 0 });
  const hasMovedRef = React.useRef(false);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartCoords.current = { x: e.clientX, y: e.clientY };
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    const touch = e.touches[0];
    dragStartCoords.current = { x: touch.clientX, y: touch.clientY };
    dragRef.current.startX = touch.clientX - position.x;
    dragRef.current.startY = touch.clientY - position.y;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const nextX = e.clientX - dragRef.current.startX;
      const nextY = e.clientY - dragRef.current.startY;
      
      const dist = Math.hypot(e.clientX - dragStartCoords.current.x, e.clientY - dragStartCoords.current.y);
      if (dist > 5) {
        hasMovedRef.current = true;
      }
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const nextX = touch.clientX - dragRef.current.startX;
      const nextY = touch.clientY - dragRef.current.startY;
      
      const dist = Math.hypot(touch.clientX - dragStartCoords.current.x, touch.clientY - dragStartCoords.current.y);
      if (dist > 5) {
        hasMovedRef.current = true;
      }
      setPosition({ x: nextX, y: nextY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);
  
  if (!isLoaded) return null; // Prevent hydration mismatch

  const handleToggle = () => {
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    if (isAnimating) return;
    const turningOn = !isGenz;
    setIsAnimating(true);
    setAnimType(turningOn ? 'on' : 'off');
    
    // Switch state precisely when the screen is fully covered by the flash
    setTimeout(() => {
      setIsGenz(turningOn);
    }, 400);

    // End animation and cleanup
    setTimeout(() => {
      setIsAnimating(false);
    }, 1200);
  };

  return (
    <>
      {isAnimating && (
        <div style={{
           position: 'fixed',
           top: '30px',
           left: '50%',
           transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
           zIndex: 99998,
           pointerEvents: 'none'
        }}>
           {/* Expanding Shockwave Ring */}
           <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '100px', height: '100px',
              marginLeft: '-50px', marginTop: '-50px',
              borderRadius: '50%',
              border: animType === 'on' ? '2px solid var(--brand-yellow)' : '2px solid #111',
              animation: animType === 'on' ? 'magicRing 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'magicRingOff 1s cubic-bezier(0.16, 1, 0.3, 1) forwards'
           }} />
           {/* Core Screen-filling Flash */}
           <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '50px', height: '50px',
              marginLeft: '-25px', marginTop: '-25px',
              borderRadius: '50%',
              background: animType === 'on' ? 'var(--brand-yellow)' : '#050505',
              animation: animType === 'on' ? 'magicFill 1.2s cubic-bezier(0.7, 0, 0.2, 1) forwards' : 'magicFillOff 1.2s cubic-bezier(0.7, 0, 0.2, 1) forwards'
           }} />
           <style>{`
               @keyframes magicRing {
                  0% { transform: scale(0.1); opacity: 1; border-width: 30px; }
                  100% { transform: scale(60); opacity: 0; border-width: 1px; }
               }
               @keyframes magicFill {
                  0% { transform: scale(0.1); opacity: 0; }
                  30% { transform: scale(5); opacity: 1; }
                  60% { transform: scale(150); opacity: 1; }
                  100% { transform: scale(150); opacity: 0; }
               }
               @keyframes magicRingOff {
                  0% { transform: scale(0.1); opacity: 1; border-width: 30px; }
                  100% { transform: scale(60); opacity: 0; border-width: 1px; }
               }
               @keyframes magicFillOff {
                  0% { transform: scale(0.1); opacity: 0; }
                  30% { transform: scale(5); opacity: 1; }
                  60% { transform: scale(150); opacity: 1; }
                  100% { transform: scale(150); opacity: 0; }
               }
            `}</style>
        </div>
      )}

      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)`,
          zIndex: 99999,
          touchAction: 'none'
        }}
      >
        <button 
            onClick={handleToggle}
            style={{
                background: isGenz ? 'var(--brand-yellow)' : 'rgba(255, 255, 255, 0.03)',
                color: isGenz ? '#000' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${isGenz ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '30px',
                padding: '6px 14px',
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.65rem',
                fontWeight: 500,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                whiteSpace: 'nowrap',
                boxShadow: isGenz ? '0 0 20px rgba(235, 215, 63, 0.4), inset 0 0 8px rgba(255,255,255,0.4)' : '0 4px 15px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                userSelect: 'none'
            }}
            onMouseEnter={(e) => {
               if (!isDragging) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  if (!isGenz) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = 'var(--pure-white)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
               }
            }}
            onMouseLeave={(e) => {
               if (!isDragging) {
                  e.currentTarget.style.transform = 'scale(1)';
                  if (!isGenz) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }
               }
            }}
        >
            <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isGenz ? '#000' : 'rgba(255,255,255,0.3)',
                boxShadow: isGenz ? '0 0 5px rgba(0,0,0,0.5)' : 'none',
                transition: 'all 0.5s ease'
            }} />
            GEN-Z
        </button>
      </div>
    </>
  );
}

import { ErrorLogProvider } from '../contexts/ErrorLogContext';

export default function ClientProviders({ children }) {
  return (
    <ErrorLogProvider>
      <GenzProvider>
        {children}
        <GlobalGenzToggle />
      </GenzProvider>
    </ErrorLogProvider>
  );
}
