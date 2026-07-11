'use client';
import { useState } from 'react';
import OrloIcon from '../admin-panel/components/OrloIcon';
import Link from 'next/link';

export default function OrloExport() {
  const [emotion, setEmotion] = useState('idle');
  const emotions = ['idle', 'excited', 'sad', 'greeting', 'listening', 'thinking', 'success', 'disappointed', 'waiting', 'sleeping'];
  const [hideUI, setHideUI] = useState(false);

  return (
    <div style={{ backgroundColor: '#00ff00', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Orlo Container */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', width: '600px' }}>
        <OrloIcon size={500} emotion={emotion} color="#000000" />
      </div>

      {/* Controls */}
      {!hideUI && (
        <div style={{ position: 'absolute', bottom: '40px', backgroundColor: 'rgba(0,0,0,0.85)', padding: '20px', borderRadius: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '800px', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10 }}>
          <div style={{ width: '100%', textAlign: 'center', marginBottom: '15px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#ebd73f', margin: '0 0 5px 0' }}>Orlo Green Screen Export</h2>
            <p style={{ color: '#ccc', margin: '0', fontSize: '14px' }}>
              1. Select an emotion.<br/>
              2. Click "Hide UI" and screen-record this window.<br/>
              3. Import the recording into your video editor (Premiere, Resolve, After Effects).<br/>
              4. Apply the "Ultra Key" or "Chroma Key" effect and select the green background to make it transparent!
            </p>
          </div>

          {emotions.map(e => (
            <button 
              key={e} 
              onClick={() => setEmotion(e)}
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                border: 'none', 
                backgroundColor: emotion === e ? '#ebd73f' : '#333', 
                color: emotion === e ? '#000' : '#fff', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
          
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '15px', gap: '15px' }}>
            <button 
                onClick={() => setHideUI(true)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
            >
                Hide UI for Recording
            </button>
            <Link href="/" style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid white', backgroundColor: 'transparent', color: '#fff', textDecoration: 'none' }}>
                Back to Site
            </Link>
          </div>
        </div>
      )}

      {/* Hidden UI Reveal Hint */}
      {hideUI && (
         <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'rgba(0,0,0,0.3)', fontFamily: 'sans-serif', fontSize: '12px' }}>
            Refresh page to show UI
         </div>
      )}
    </div>
  );
}
