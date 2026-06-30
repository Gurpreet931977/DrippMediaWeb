'use client';

import React, { useState, useEffect } from 'react';

export default function ProfileWidget({ showScore, onLoginClick }) {
  const [user, setUser] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('dripp_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch(e) {
          console.error('Error parsing user data', e);
        }
      }
      
      if (showScore) {
        const storedScore = parseInt(localStorage.getItem('dripp_highScore') || '0', 10);
        setHighScore(storedScore);
        
        // Listen for high score updates across the app
        const handleScoreUpdate = () => {
           const newScore = parseInt(localStorage.getItem('dripp_highScore') || '0', 10);
           setHighScore(newScore);
        };
        window.addEventListener('storage', handleScoreUpdate);
        window.addEventListener('dripp_score_updated', handleScoreUpdate);
        return () => {
           window.removeEventListener('storage', handleScoreUpdate);
           window.removeEventListener('dripp_score_updated', handleScoreUpdate);
        };
      }
    }
  }, [showScore]);

  // We also want to listen for login updates locally without refreshing
  useEffect(() => {
    const handleLoginUpdate = () => {
       const storedUser = localStorage.getItem('dripp_user');
       if (storedUser) {
         try { setUser(JSON.parse(storedUser)); } catch(e) {}
       } else {
         setUser(null);
       }
    };
    window.addEventListener('dripp_login_success', handleLoginUpdate);
    return () => window.removeEventListener('dripp_login_success', handleLoginUpdate);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dripp_user');
      setUser(null);
      setDropdownOpen(false);
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '10px', zIndex: 9999 }}>
        <style>{`
          .auth-btn-icon { display: none; }
          @media (max-width: 768px) {
            .auth-btn-text { display: none !important; }
            .auth-btn-icon { display: block !important; }
            .auth-btn { padding: 10px !important; border-radius: 50% !important; width: 42px; height: 42px; display: flex !important; justify-content: center; align-items: center; }
          }
        `}</style>
        <button 
          className="auth-btn"
          onClick={() => onLoginClick('login')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)', color: 'var(--pure-white)',
            padding: '10px 20px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)',
            fontFamily: "'Panchang', sans-serif", fontSize: '0.8rem',
            cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span className="auth-btn-text">Log In</span>
          <svg className="auth-btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
        </button>
        <button 
          className="auth-btn"
          onClick={() => onLoginClick('signup')}
          style={{
            background: 'var(--brand-yellow)', color: 'var(--deep-black)',
            padding: '10px 20px', borderRadius: '14px', border: 'none',
            fontFamily: "'Panchang', sans-serif", fontSize: '0.8rem',
            cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(235, 215, 63, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(235, 215, 63, 0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(235, 215, 63, 0.2)'; }}
        >
          <span className="auth-btn-text">Sign Up</span>
          <svg className="auth-btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
             <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>
    );
  }

  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : 'US';

  return (
    <div style={{ position: 'relative', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '15px' }}>
      {showScore && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          marginRight: '10px'
        }}>
          <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>High Score</span>
          <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', color: 'var(--brand-yellow)', lineHeight: 1 }}>{highScore}</span>
        </div>
      )}
      
      <div 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
          padding: '6px 16px 6px 6px', borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)', cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-yellow), #d4c23b)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'var(--deep-black)', fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem',
          boxShadow: '0 4px 15px rgba(235, 215, 63, 0.3)'
        }}>
          {initials}
        </div>
        <span style={{ color: 'var(--pure-white)', fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem', fontWeight: 500 }}>
          {user.name}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.5)', transition: 'transform 0.3s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
           <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {dropdownOpen && (
        <div style={{
          position: 'absolute', bottom: '55px', right: '0',
          background: 'rgba(20,20,20,0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
          padding: '15px', width: '220px', display: 'flex', flexDirection: 'column', gap: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'dropdownFade 0.2s ease forwards',
          transformOrigin: 'bottom right'
        }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginBottom: '5px' }}>
             <h4 style={{ margin: 0, fontFamily: "'Clash Display', sans-serif", color: 'white', fontSize: '1.1rem' }}>{user.name}</h4>
             <p style={{ margin: '5px 0 0 0', fontFamily: "'Clash Display', sans-serif", color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{user.email}</p>
             {user.nature && (
                <span style={{ 
                  display: 'inline-block', marginTop: '8px', padding: '3px 8px', 
                  background: 'rgba(235, 215, 63, 0.1)', color: 'var(--brand-yellow)', 
                  borderRadius: '10px', fontSize: '0.7rem', fontFamily: "'Panchang', sans-serif"
                }}>
                  {user.nature}
                </span>
             )}
          </div>
          
          <button 
             onClick={handleLogout}
             style={{
                background: 'transparent', border: 'none', color: '#ff6b6b', textAlign: 'left',
                padding: '5px 0', fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem',
                cursor: 'pointer', transition: 'color 0.2s'
             }}
             onMouseEnter={e => e.currentTarget.style.color = '#ff4f4f'}
             onMouseLeave={e => e.currentTarget.style.color = '#ff6b6b'}
          >
             Log Out
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dropdownFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
