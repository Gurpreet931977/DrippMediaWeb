'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import OrloChat from './components/OrloChat';
import styles from './admin.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, X, RefreshCw, Sparkles } from 'lucide-react';
import { useErrorLog } from '../contexts/ErrorLogContext';

export default function AdminLayout({ children }) {
  const [isDesktop, setIsDesktop]         = useState(true);
  const [isAuthorized, setIsAuthorized]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [showLogin, setShowLogin]         = useState(false);
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError]       = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const { logs } = useErrorLog();
  const [dismissedErrorCount, setDismissedErrorCount] = useState(0);
  
  const unreadErrorsCount = Math.max(0, logs.length - dismissedErrorCount);

  // Auto-dismiss the popup after 3 seconds
  useEffect(() => {
    if (unreadErrorsCount > 0) {
      const timer = setTimeout(() => {
        setDismissedErrorCount(logs.length);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [unreadErrorsCount, logs.length]);

  useEffect(() => {
    const checkDevice = () => setIsDesktop(window.innerWidth >= 1024);
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // Check if there's already a valid admin session cookie (GET)
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          setIsAuthorized(true);
        } else {
          // No valid session - show the login form
          setShowLogin(true);
        }
      } catch {
        setShowLogin(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
    document.body.style.cursor = 'auto';

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim().toLowerCase(), password: loginPassword }),
      });
      if (res.ok) {
        setIsAuthorized(true);
        setShowLogin(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error || 'Invalid credentials. Try again.');
      }
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ cursor: 'auto', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white' }}>
        Verifying Access...
      </div>
    );
  }

  if (showLogin && !isAuthorized) {
    return (
      <div className="admin-layout-root" style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#050505', color: 'white', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          .admin-layout-root, .admin-layout-root * {
            cursor: auto !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .glass-panel {
            background: rgba(20, 20, 20, 0.6);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 48px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            position: relative;
            z-index: 10;
          }
          .bg-glow {
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, rgba(0,0,0,0) 70%);
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 0;
            pointer-events: none;
          }
          .input-group {
            position: relative;
            margin-bottom: 20px;
          }
          .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
            transition: color 0.3s;
            pointer-events: none;
            z-index: 2;
          }
          .premium-input {
            width: 100%;
            padding: 14px 16px 14px 48px;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            color: white;
            font-size: 0.95rem;
            outline: none;
            box-sizing: border-box;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          .premium-input:focus {
            border-color: rgba(235, 215, 63, 0.5);
            background: rgba(0, 0, 0, 0.6);
            box-shadow: 0 0 0 4px rgba(235, 215, 63, 0.1);
          }
          .premium-input:focus + .input-icon {
            color: #ebd73f;
          }
          .premium-button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%);
            color: #000;
            border: none;
            border-radius: 12px;
            font-family: 'Clash Display', sans-serif;
            font-weight: 600;
            font-size: 1rem;
            letter-spacing: 1px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 12px;
            box-shadow: 0 4px 15px rgba(235, 215, 63, 0.2);
          }
          .premium-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(235, 215, 63, 0.3);
          }
          .premium-button:disabled {
            background: #333;
            color: #666;
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
          }
          @media (max-width: 1024px) {
            .glass-panel {
              padding: 32px 20px !important;
              width: 90vw !important;
              max-width: 92vw !important;
              border-radius: 20px !important;
              margin: 0 16px !important;
            }
            .login-hero-title {
              font-size: clamp(1.35rem, 5.5vw, 2rem) !important;
              letter-spacing: 1px !important;
            }
            .premium-input {
              padding: 14px 14px 14px 44px !important;
              font-size: 0.9rem !important;
            }
            .premium-button {
              padding: 15px !important;
              min-height: 48px !important;
            }
            .bg-glow {
              width: 320px !important;
              height: 320px !important;
            }
          }
        `}</style>
        
        <div className="bg-glow"></div>
        
        <div className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              background: 'rgba(235, 215, 63, 0.1)',
              border: '1px solid rgba(235, 215, 63, 0.25)',
              marginBottom: '16px',
              color: '#ebd73f',
              boxShadow: '0 0 20px rgba(235, 215, 63, 0.15)'
            }}>
              <Sparkles size={24} />
            </div>
            <h2 className="login-hero-title" style={{ color: '#fff', marginBottom: '8px', fontFamily: "'Panchang', sans-serif", fontSize: '2rem', letterSpacing: '1.5px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              DRIPP <span style={{ color: '#ebd73f' }}>STUDIO</span>
            </h2>
            <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', margin: 0, fontFamily: "'Clash Display', sans-serif", fontWeight: 500 }}>CREATIVE MANAGEMENT SUITE</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginLeft: '4px', fontFamily: "'Clash Display', sans-serif" }}>STUDIO EMAIL</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="admin@example.com"
                  className="premium-input"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>
            
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 600, marginLeft: '4px', fontFamily: "'Clash Display', sans-serif" }}>STUDIO PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="premium-input"
                  style={{ paddingRight: '48px', fontFamily: "'Clash Display', sans-serif" }}
                />
                <Lock size={18} className="input-icon" />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0, display: 'flex', zIndex: 2 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ minHeight: '24px', margin: '4px 0 12px 4px' }}>
              {loginError && (
                <p style={{ color: '#ff4d4d', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'Clash Display', sans-serif" }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#ff4d4d' }}></span>
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="premium-button"
              style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.9rem', letterSpacing: '2px' }}
            >
              {loginLoading ? 'VERIFYING...' : 'ENTER STUDIO'}
            </button>
          </form>
        </div>

        <button onClick={() => router.push('/')} style={{ marginTop: '32px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s', zIndex: 10 }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#666'}>
          <span style={{ fontSize: '1.2rem' }}>←</span> Return to Site
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="admin-layout-root" style={{ display: 'flex', height: '100vh', padding: '20px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
        <style>{`
          .admin-layout-root, .admin-layout-root * {
            cursor: auto !important;
          }
        `}</style>
        <h2 style={{ color: '#ff4d4d', marginBottom: '10px' }}>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Return to Site</button>
      </div>
    );
  }

  return (
    <div className={`${styles.adminContainer} admin-body-marker admin-layout-root`} style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex' }}>
      <style>{`
        .admin-layout-root, .admin-layout-root * {
          cursor: auto !important;
        }
      `}</style>
      <AdminSidebar />
      <main 
        key={pathname} 
        className={pathname?.startsWith('/dripp-studio/notes-and-planning') ? undefined : styles.mainContent} 
        style={
          pathname?.startsWith('/dripp-studio/notes-and-planning')
            ? { flex: 1, height: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', padding: 0 }
            : { flex: 1, overflowY: 'auto', position: 'relative' }
        }
      >
        {children}
        
        {unreadErrorsCount > 0 && pathname !== '/dripp-studio/errors' && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: 'rgba(20, 10, 10, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 77, 77, 0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 40px rgba(255, 50, 50, 0.2)',
            zIndex: 9999,
            animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <style>{`
              @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div style={{ padding: '10px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '50%' }}>
              <AlertTriangle size={24} color="#ff4d4d" />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1rem', fontFamily: 'Panchang, sans-serif' }}>
                System Errors Detected
              </h4>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>
                {unreadErrorsCount} new error{unreadErrorsCount > 1 ? 's' : ''} logged in the background.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  onClick={() => router.push('/dripp-studio/errors')}
                  style={{
                    background: 'none', border: 'none', color: '#ebd73f', padding: 0,
                    fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  View Error Radar
                </button>
                <button 
                  onClick={() => {
                    sessionStorage.removeItem('dripp_session_started'); // Force a fresh session
                    window.location.reload();
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#888', padding: 0,
                    fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                >
                  <RefreshCw size={12} /> Refresh System
                </button>
              </div>
            </div>
            <button 
              onClick={() => setDismissedErrorCount(logs.length)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#666'}
            >
              <X size={20} />
            </button>
          </div>
        )}
      </main>
      <OrloChat />
    </div>
  );

}
