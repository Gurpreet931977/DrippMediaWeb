"use client";

import React, { useState } from 'react';
import ArcadeMenu from '../components/ArcadeMenu';
import ArcadeEngine from '../components/ArcadeEngine';
import MultiplayerEngine from '../components/MultiplayerEngine';
import { ChevronLeft } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function ArcadePage() {
  const router = useRouter();
  const [activeGame, setActiveGame] = useState("none");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('dripp_auth_token');
    const user = localStorage.getItem('dripp_user');
    
    if (!token || !user) {
      router.replace('/?login=true');
    } else {
      setIsAuthenticated(true);
      document.body.classList.add('loaded');
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@import url('https://api.fontshare.com/v2/css?f[]=panchang@200,500,700,800&display=swap');`}</style>
        <span style={{ color: '#ebd73f', fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', letterSpacing: '2px', animation: 'pulse 1.5s infinite' }}>
          AUTHENTICATING...
        </span>
      </div>
    );
  }

  return (
    <div className="arcade-body-marker" style={{ position: 'fixed', inset: 0, width: '100vw', height: '100svh', backgroundColor: '#050505', overflow: activeGame === 'none' ? 'hidden' : 'auto', touchAction: activeGame === 'none' ? 'none' : 'auto' }}>
      
      {/* Global Exit Button for all active games */}
      {activeGame !== "none" && (
        <button
          onClick={() => setActiveGame("none")}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 99999,
            background: 'rgba(20, 20, 20, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '30px',
            fontFamily: "'Panchang', sans-serif",
            fontSize: '0.7rem',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 51, 255, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 51, 255, 0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(20, 20, 20, 0.65)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
        >
          <ChevronLeft size={16} /> BACK
        </button>
      )}

      {activeGame === "none" ? (
        <div key="menu3d" style={{ width: '100%', height: '100%' }}>
          <ArcadeMenu onStartGame={(gameId) => setActiveGame(gameId)} />
        </div>
      ) : ['brokenbrief', 'worddrop', 'undercover', 'dumbdoodles', 'priceiswhat', 'coopescape', 'neonbusiness'].includes(activeGame) ? (
        <div key="multiplayer" style={{ width: '100%', height: '100%' }}>
          <MultiplayerEngine 
            activeGame={activeGame} 
            onBack={() => setActiveGame("none")} 
          />
        </div>
      ) : (
        <div key="engine2d" style={{ width: '100%', height: '100%' }}>
          <ArcadeEngine 
            forcedGame={activeGame} 
            onClose={() => setActiveGame("none")} 
          />
        </div>
      )}
    </div>
  );
}
