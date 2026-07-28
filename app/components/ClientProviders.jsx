"use client";

import React, { useEffect, useState } from 'react';
import { GenzProvider, useGenz } from '../contexts/GenzContext';

function GlobalGenzToggle() {
  const { isGenz, setIsGenz, isLoaded } = useGenz();
  
  if (!isLoaded) return null; // Prevent hydration mismatch

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 99999 }}>
      <button 
          onClick={() => setIsGenz(!isGenz)}
          style={{
              background: isGenz ? 'var(--brand-yellow)' : 'rgba(0,0,0,0.8)',
              color: isGenz ? '#000' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${isGenz ? 'var(--brand-yellow)' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '30px',
              padding: '8px 16px',
              fontFamily: "'Clash Display', sans-serif",
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              boxShadow: isGenz ? '0 0 20px rgba(235, 215, 63, 0.4)' : '0 4px 15px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
             if (!isGenz) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.8)';
          }}
          onMouseLeave={(e) => {
             if (!isGenz) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
          }}
      >
          {isGenz ? 'Genz Mode: ON 💅' : 'I am Genz'}
      </button>
    </div>
  );
}

export default function ClientProviders({ children }) {
  return (
    <GenzProvider>
      {children}
      <GlobalGenzToggle />
    </GenzProvider>
  );
}
