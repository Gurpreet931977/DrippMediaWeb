"use client";

import React, { useEffect, useState } from 'react';
import { GenzProvider, useGenz } from '../contexts/GenzContext';

function GlobalGenzToggle() {
  const { isGenz, setIsGenz, isLoaded } = useGenz();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animType, setAnimType] = useState('on');

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapped, setIsSnapped] = useState(false);
  const [snapCorner, setSnapCorner] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = React.useRef({ startX: 0, startY: 0 });
  const dragStartCoords = React.useRef({ x: 0, y: 0 });
  const hasMovedRef = React.useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  const isPointerDownRef = React.useRef(false);
  const isDragActiveRef = React.useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && !hasMovedRef.current) {
            let targetY = isMobile ? window.innerHeight - 80 : -20;
            let targetX = 0;
            setPosition({ x: targetX, y: targetY });
            setIsSnapped(true);
            setSnapCorner(isMobile ? 'bottom' : 'top');
        }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    isDragActiveRef.current = false;
    hasMovedRef.current = false;
    dragStartCoords.current = { x: e.clientX, y: e.clientY };
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      if (!isPointerDownRef.current) return;
      const dx = moveEvent.clientX - dragStartCoords.current.x;
      const dy = moveEvent.clientY - dragStartCoords.current.y;
      const dist = Math.hypot(dx, dy);

      if (!isDragActiveRef.current) {
        if (dist > 5) {
          isDragActiveRef.current = true;
          hasMovedRef.current = true;
          setIsDragging(true);
          setIsSnapped(false);
          setSnapCorner(null);
        } else {
          return;
        }
      }

      const nextX = moveEvent.clientX - dragRef.current.startX;
      const nextY = moveEvent.clientY - dragRef.current.startY;
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      const wasDragging = isDragActiveRef.current;
      isDragActiveRef.current = false;
      setIsDragging(false);

      if (wasDragging && typeof window !== 'undefined') {
        setPosition(prev => {
          const centerX = window.innerWidth / 2 + prev.x;
          const centerY = 20 + prev.y;
          
          const distLeft = centerX;
          const distRight = window.innerWidth - centerX;
          const distTop = centerY;
          const distBottom = window.innerHeight - centerY;

          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          let targetX = prev.x;
          let targetY = prev.y;
          let edge = '';

          if (minDist === distLeft) {
            targetX = 3 - window.innerWidth / 2;
            targetY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            edge = 'left';
          } else if (minDist === distRight) {
            targetX = (window.innerWidth - 3) - window.innerWidth / 2;
            targetY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            edge = 'right';
          } else if (minDist === distTop) {
            targetY = -20; 
            targetX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            edge = 'top';
          } else {
            targetY = window.innerHeight - 26;
            targetX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            edge = 'bottom';
          }
          
          setIsSnapped(true);
          setSnapCorner(edge);
          return { x: targetX, y: targetY };
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    isPointerDownRef.current = true;
    isDragActiveRef.current = false;
    hasMovedRef.current = false;
    const touch = e.touches[0];
    dragStartCoords.current = { x: touch.clientX, y: touch.clientY };
    dragRef.current.startX = touch.clientX - position.x;
    dragRef.current.startY = touch.clientY - position.y;

    const handleTouchMove = (moveEvent) => {
      if (!isPointerDownRef.current) return;
      if (moveEvent.touches.length !== 1) return;
      const t = moveEvent.touches[0];
      const dx = t.clientX - dragStartCoords.current.x;
      const dy = t.clientY - dragStartCoords.current.y;
      const dist = Math.hypot(dx, dy);

      if (!isDragActiveRef.current) {
        if (dist > 5) {
          isDragActiveRef.current = true;
          hasMovedRef.current = true;
          setIsDragging(true);
          setIsSnapped(false);
          setSnapCorner(null);
        } else {
          return;
        }
      }

      const nextX = t.clientX - dragRef.current.startX;
      const nextY = t.clientY - dragRef.current.startY;
      setPosition({ x: nextX, y: nextY });
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      const wasDragging = isDragActiveRef.current;
      isDragActiveRef.current = false;
      setIsDragging(false);

      if (wasDragging && typeof window !== 'undefined') {
        setPosition(prev => {
          const centerX = window.innerWidth / 2 + prev.x;
          const centerY = 20 + prev.y;
          
          const distLeft = centerX;
          const distRight = window.innerWidth - centerX;
          const distTop = centerY;
          const distBottom = window.innerHeight - centerY;

          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          let targetX = prev.x;
          let targetY = prev.y;
          let edge = '';

          if (minDist === distLeft) {
            targetX = 3 - window.innerWidth / 2;
            targetY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            edge = 'left';
          } else if (minDist === distRight) {
            targetX = (window.innerWidth - 3) - window.innerWidth / 2;
            targetY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            edge = 'right';
          } else if (minDist === distTop) {
            targetY = -20; 
            targetX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            edge = 'top';
          } else {
            targetY = window.innerHeight - 26;
            targetX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            edge = 'bottom';
          }
          
          setIsSnapped(true);
          setSnapCorner(edge);
          return { x: targetX, y: targetY };
        });
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };
  
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      
      setPosition(prev => {
          let newX = prev.x;
          let newY = prev.y;

          if (isSnapped) {
            if (snapCorner === 'left') {
                newX = 3 - window.innerWidth / 2;
                newY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            } else if (snapCorner === 'right') {
                newX = (window.innerWidth - 3) - window.innerWidth / 2;
                newY = Math.max(7, Math.min(prev.y, window.innerHeight - 53));
            } else if (snapCorner === 'top') {
                newY = -20;
                newX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            } else if (snapCorner === 'bottom') {
                newY = window.innerHeight - 26;
                newX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            }
          } else {
            newX = Math.max(30 - window.innerWidth / 2, Math.min(prev.x, window.innerWidth / 2 - 30));
            newY = Math.max(-20, Math.min(prev.y, window.innerHeight - 40)); 
          }
          
          return (newX !== prev.x || newY !== prev.y) ? { x: newX, y: newY } : prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSnapped, snapCorner]);

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

  const getButtonTransform = () => {
    if (isDragging) return 'none';
    if (!isSnapped) {
      return isHovered ? 'scale(1.06)' : 'scale(1)';
    }
    // Snapped (sleeping mode)
    if (!isHovered) {
      if (['left', 'right'].includes(snapCorner)) {
        return 'rotate(90deg) scale(0.95)';
      }
      return 'rotate(0deg) scale(0.95)';
    }
    // Snapped & Hovered (waking smoothly)
    if (snapCorner === 'top') {
      return 'translateY(10px) scale(1.04)';
    }
    if (snapCorner === 'bottom') {
      return 'translateY(-10px) scale(1.04)';
    }
    if (snapCorner === 'left') {
      return 'translateX(10px) scale(1.04)';
    }
    if (snapCorner === 'right') {
      return 'translateX(-10px) scale(1.04)';
    }
    return 'scale(1.04)';
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
        onMouseDown={isMobile ? undefined : handleMouseDown}
        onTouchStart={isMobile ? undefined : handleTouchStart}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isPointerDownRef.current) {
            setIsHovered(false);
          }
        }}
        style={isMobile ? {
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
        } : {
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: `translateX(-50%) translate(${position.x}px, ${position.y}px)`,
          zIndex: 99999,
          touchAction: 'none',
          padding: isSnapped ? '14px 18px' : '0px',
          margin: isSnapped ? '-14px -18px' : '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: isDragging ? 'none' : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <button 
            onClick={handleToggle}
            className={`genz-floating-btn ${isSnapped && !isHovered ? 'state-snapped' : (isGenz ? 'state-genz' : 'state-default')}`}
            style={isMobile ? {
                borderRadius: '30px',
                padding: '10px 20px',
                width: 'auto',
                height: 'auto',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '1px',
            } : {
                borderRadius: (isSnapped && !isHovered) ? '4px' : '30px',
                padding: (isSnapped && !isHovered) ? '0px' : '6px 14px',
                width: (isSnapped && !isHovered) ? '56px' : '96px',
                height: (isSnapped && !isHovered) ? '6px' : '28px',
                transform: getButtonTransform(),
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: isDragging ? 'grabbing' : 'pointer',
                transition: isDragging ? 'none' : 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        >
            <div 
              className="genz-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                opacity: (isSnapped && !isHovered && !isMobile) ? 0 : 1,
                transform: (isSnapped && !isHovered && !isMobile) ? 'scale(0.2)' : 'scale(1)',
                flexShrink: 0
              }} 
            />
            <span style={{ 
              opacity: (isSnapped && !isHovered && !isMobile) ? 0 : 1, 
              transform: (isSnapped && !isHovered && !isMobile) ? 'scale(0.8)' : 'scale(1)',
              transition: 'opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
            }}>
              GEN-Z
            </span>
        </button>
      </div>
    </>
  );
}

import { ErrorLogProvider } from '../contexts/ErrorLogContext';
import CustomValidationHandler from './CustomValidationHandler';
import ErrorBoundary from './ErrorBoundary';

export default function ClientProviders({ children }) {
  return (
    <ErrorLogProvider>
      <ErrorBoundary>
        <GenzProvider>
          {children}
          <GlobalGenzToggle />
          <CustomValidationHandler />
        </GenzProvider>
      </ErrorBoundary>
    </ErrorLogProvider>
  );
}

