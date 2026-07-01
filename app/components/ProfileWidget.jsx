'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Upload, Image as ImageIcon, X, Check, Share2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { shareScoreImage } from '../utils/shareUtils';

export default function ProfileWidget({ showScore, onLoginClick }) {
  const [user, setUser] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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
      localStorage.removeItem('dripp_highScore');
      localStorage.removeItem('dripp_playCount');
      setUser(null);
      setDropdownOpen(false);
      window.location.reload();
    }
  };

  const handleShareScore = async () => {
    const scoreToShare = highScore > 0 ? highScore : parseInt(localStorage.getItem('dripp_highScore') || '0', 10);
    if (scoreToShare === 0) {
      alert("Play a game first to get a high score!");
      return;
    }
    
    await shareScoreImage(scoreToShare);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result);
        setDropdownOpen(false); // Close dropdown while cropping
      };
      reader.readAsDataURL(file);
    }
    // reset input so same file can be selected again
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImage = await getCroppedImg(
        cropImageSrc,
        croppedAreaPixels
      );
      
      const updatedUser = { ...user, profileImage: croppedImage };
      setUser(updatedUser);
      localStorage.setItem('dripp_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('dripp_profile_updated'));
      
      setCropImageSrc(null); // Close cropper modal
    } catch (e) {
      console.error(e);
    }
  }, [cropImageSrc, croppedAreaPixels, user]);

  const globalStyles = (
    <style>{`
      .auth-btn-icon { display: none; }
      @keyframes dropdownFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      
      .profile-dropdown-menu {
        position: absolute; top: 55px; right: 0;
        background: rgba(20,20,20,0.95); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 15px; width: 220px; display: flex; flex-direction: column; gap: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: dropdownFade 0.2s ease forwards;
        transform-origin: top right;
      }
      
      @media (max-width: 768px) {
        .auth-btn-text { display: none !important; }
        .auth-btn-icon { display: block !important; }
        .desktop-only-btn { display: none !important; }
        .mobile-icon-btn { padding: 10px !important; border-radius: 50% !important; width: 42px; height: 42px; display: flex !important; justify-content: center; align-items: center; }
        
        .profile-name, .profile-arrow { display: none !important; }
        .profile-pill { 
          padding: 0 !important; 
          border-radius: 50% !important; 
          width: 42px !important; 
          height: 42px !important; 
          display: flex !important; 
          justify-content: center !important; 
          align-items: center !important; 
          background: var(--brand-yellow) !important;
          border: none !important;
          box-shadow: 0 4px 15px rgba(235, 215, 63, 0.2) !important;
          gap: 0 !important;
        }
        .profile-pill:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(235, 215, 63, 0.4) !important;
        }
        .profile-icon-container { 
          background: transparent !important; 
          border: none !important; 
          box-shadow: none !important; 
          color: var(--deep-black) !important; 
          width: 100% !important; 
          height: 100% !important; 
        }
        .profile-icon-container svg {
          color: var(--deep-black) !important;
        }
        .profile-score-display { display: none !important; }
        
        .profile-dropdown-menu {
          right: auto !important;
          left: 0 !important;
          transform-origin: top left !important;
        }
      }
    `}</style>
  );

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: '10px', zIndex: 9999 }}>
        {globalStyles}
        <button 
          className="desktop-only-btn"
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
          className="mobile-icon-btn desktop-only-btn"
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

  return (
    <div style={{ position: 'relative', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '15px' }}>
      {/* Score moved to page.jsx */}

      {cropImageSrc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.95)', zIndex: 99999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ position: 'relative', width: '100%', height: '60vh', background: '#111' }}>
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div style={{ padding: '30px 20px', display: 'flex', gap: '25px', width: '100%', maxWidth: '400px', flexDirection: 'column' }}>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--brand-yellow)' }}
            />
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={() => { setCropImageSrc(null); setDropdownOpen(true); }}
                style={{
                  padding: '12px 24px', borderRadius: '30px', background: 'rgba(255,255,255,0.1)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                  fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem'
                }}
              >
                <X size={18} /> Cancel
              </button>
              <button 
                onClick={showCroppedImage}
                style={{
                  padding: '12px 24px', borderRadius: '30px', background: 'var(--brand-yellow)', color: 'var(--deep-black)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                  fontFamily: "'Clash Display', sans-serif", fontWeight: 600, fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(235, 215, 63, 0.3)'
                }}
              >
                <Check size={18} /> Save Picture
              </button>
            </div>
          </div>
        </div>
      )}
      
      
      <div 
        className="profile-pill"
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
        <div 
          className="profile-icon-container"
          style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: user?.profileImage ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          color: 'var(--pure-white)', overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.3s ease'
        }}>
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={18} strokeWidth={2.5} />
          )}
        </div>
        <span className="profile-name" style={{ color: 'var(--pure-white)', fontFamily: "'Clash Display', sans-serif", fontSize: '0.95rem', fontWeight: 500 }}>
          {user.name}
        </span>
        <svg className="profile-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.5)', transition: 'transform 0.3s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
           <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {dropdownOpen && (
        <div className="profile-dropdown-menu">
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
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          <button 
             onClick={() => {
               fileInputRef.current?.click();
             }}
             style={{
                background: 'transparent', border: 'none', color: 'var(--pure-white)', textAlign: 'left',
                padding: '5px 0', fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem',
                cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
             }}
             onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
             onMouseLeave={e => e.currentTarget.style.color = 'var(--pure-white)'}
          >
             <Upload size={14} />
             Upload Picture
          </button>
          
          <button 
             onClick={handleShareScore}
             style={{
                background: 'transparent', border: 'none', color: 'var(--pure-white)', textAlign: 'left',
                padding: '5px 0', fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem',
                cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
             }}
             onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-yellow)'}
             onMouseLeave={e => e.currentTarget.style.color = 'var(--pure-white)'}
          >
             <Share2 size={14} />
             Share High Score
          </button>
          
          <button 
             onClick={handleLogout}
             style={{
                background: 'transparent', border: 'none', color: '#ff6b6b', textAlign: 'left',
                padding: '5px 0', fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem',
                cursor: 'pointer', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                marginTop: '4px'
             }}
             onMouseEnter={e => e.currentTarget.style.color = '#ff4f4f'}
             onMouseLeave={e => e.currentTarget.style.color = '#ff6b6b'}
          >
             Log Out
          </button>
        </div>
      )}
      {globalStyles}
    </div>
  );
}
