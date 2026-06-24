"use client";

import React, { useState } from 'react';
import ArcadeMenu from '../components/ArcadeMenu';
import ArcadeEngine from '../components/ArcadeEngine';

export default function ArcadePage() {
  const [activeGame, setActiveGame] = useState("none");

  React.useEffect(() => {
    document.body.classList.add('loaded');
  }, []);

  return (
    <div className="arcade-body-marker" style={{ width: '100vw', height: '100vh', backgroundColor: '#050505', overflow: 'hidden' }}>
      {activeGame === "none" ? (
        <div key="menu3d" style={{ width: '100%', height: '100%' }}>
          <ArcadeMenu onStartGame={(gameId) => setActiveGame(gameId)} />
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
