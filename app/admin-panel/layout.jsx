'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import styles from './admin.module.css';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isDesktop, setIsDesktop]         = useState(true);
  const [isAuthorized, setIsAuthorized]   = useState(false);
  const [loading, setLoading]             = useState(true);
  const [showLogin, setShowLogin]         = useState(false);
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError]       = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);
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
      <div style={{ cursor: 'auto', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
        <div style={{ background: '#111', border: '1px solid rgba(235,215,63,0.2)', borderRadius: '16px', padding: '40px 48px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          <h2 style={{ color: '#ebd73f', marginBottom: '8px', fontFamily: "'Panchang', sans-serif", fontSize: '1.4rem', letterSpacing: '1px' }}>ADMIN ACCESS</h2>
          <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '28px', letterSpacing: '1px', textTransform: 'uppercase' }}>Dripp Media Control Panel</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                autoFocus
                placeholder="admin@example.com"
                style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {loginError && (
              <p style={{ color: '#ff4d4d', fontSize: '0.8rem', margin: 0 }}>{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{ padding: '12px', background: loginLoading ? '#333' : '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', fontFamily: "'Clash Display', sans-serif", fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '1px', cursor: loginLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginTop: '4px' }}
            >
              {loginLoading ? 'VERIFYING...' : 'ENTER PANEL'}
            </button>
          </form>
        </div>

        <button onClick={() => router.push('/')} style={{ marginTop: '24px', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '1px' }}>
          ← Return to Site
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div style={{ cursor: 'auto', display: 'flex', height: '100vh', padding: '20px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
        <h2 style={{ color: '#ff4d4d', marginBottom: '10px' }}>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Return to Site</button>
      </div>
    );
  }

  return (
    <div className={`${styles.adminContainer} admin-body-marker`} style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex' }}>
      <AdminSidebar />
      <main className={styles.mainContent} style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
