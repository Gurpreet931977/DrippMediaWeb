'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

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
          // No valid session — show the login form
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
        `}</style>
        
        <div className="bg-glow"></div>
        
        <div className="glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ color: '#fff', marginBottom: '8px', fontFamily: "'Panchang', sans-serif", fontSize: '1.8rem', letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              ADMIN <span style={{ color: '#ebd73f' }}>ACCESS</span>
            </h2>
            <p style={{ color: '#888', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Dripp Media Control Panel</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500, marginLeft: '4px' }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="admin@example.com"
                  className="premium-input"
                />
                <Mail size={18} className="input-icon" />
              </div>
            </div>
            
            <div className="input-group">
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500, marginLeft: '4px' }}>Admin Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="premium-input"
                  style={{ paddingRight: '48px' }}
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
                <p style={{ color: '#ff4d4d', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', background: '#ff4d4d' }}></span>
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="premium-button"
            >
              {loginLoading ? 'VERIFYING...' : 'ENTER PANEL'}
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
      <main className={styles.mainContent} style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );

}
