'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import styles from './admin.module.css';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Device Check
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    // 2. Server-side Auth Check via /api/admin/verify
    //    This replaces the old localStorage-based check which could be bypassed
    //    trivially by setting dripp_user in DevTools. The server now validates an
    //    HMAC-signed HttpOnly cookie — no client-side data is trusted.
    const checkAuth = async () => {
      try {
        // First, try verifying the existing admin session cookie (GET)
        const verifyRes = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include', // send the HttpOnly cookie
        });

        if (verifyRes.ok) {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        // No valid session cookie — try issuing one using the logged-in user's email.
        // We look at the dripp_user object from localStorage ONLY to get the email
        // to present to the server; the server does the actual authorization check.
        let email = null;

        // Try Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          email = session.user.email;
        }

        // Fallback: dripp_user email from AuthModal (custom auth)
        if (!email) {
          try {
            const raw = localStorage.getItem('dripp_user');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.email) email = parsed.email;
            }
          } catch {
            // Ignore malformed localStorage data
          }
        }

        if (!email) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // Ask the server to issue an admin session cookie for this email.
        // The server checks against the ADMIN_EMAILS env var (server-side only).
        const issueRes = await fetch('/api/admin/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        setIsAuthorized(issueRes.ok);
      } catch (error) {
        // Never expose auth errors to the console in production
        if (process.env.NODE_ENV === 'development') {
          console.error('[AdminLayout] Auth check error:', error);
        }
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Ensure body is visible and cursor is normal for admin panel
    document.body.classList.add('loaded');
    document.body.style.opacity = '1';
    document.body.style.cursor = 'auto';

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div style={{ cursor: 'auto', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white' }}>Verifying Access...</div>;
  }

  // TEMPORARILY DISABLED MOBILE BLOCK SO USER CAN ACCESS ADMIN PANEL
  // if (!isDesktop) {
  //   return (
  //     <div style={{ cursor: 'auto', display: 'flex', height: '100vh', padding: '20px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
  //       <h2 style={{ color: '#ebd73f', marginBottom: '10px' }}>Desktop Only</h2>
  //       <p>The Dripp Admin Panel is restricted to desktop devices for security and usability.</p>
  //       <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Return to Site</button>
  //     </div>
  //   );
  // }

  if (!isAuthorized) {
    return (
      <div style={{ cursor: 'auto', display: 'flex', height: '100vh', padding: '20px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
        <h2 style={{ color: '#ff4d4d', marginBottom: '10px' }}>Access Denied</h2>
        <p>You do not have permission to view this page. Please log in with an authorized administrator account.</p>
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
