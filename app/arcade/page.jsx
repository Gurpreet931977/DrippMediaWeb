"use client";

import React, { useState } from 'react';
import ArcadeMenu from '../components/ArcadeMenu';
import ArcadeEngine from '../components/ArcadeEngine';
import MultiplayerEngine from '../components/MultiplayerEngine';

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
    <div className="arcade-body-marker" style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', overflow: 'hidden' }}>
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
