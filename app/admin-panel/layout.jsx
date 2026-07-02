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

    // 2. Auth Check
    const checkAuth = async () => {
      try {
        let isAuth = false;
        
        // Check Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'gurpreet@drippmedia.com,admin@drippmedia.com,gs335860@gmail.com').split(',');

        if (session && session.user && session.user.email) {
           if (adminEmails.includes(session.user.email)) {
              isAuth = true;
           }
        }

        // Fallback: Check custom dripp_user in localStorage (used by AuthModal)
        if (!isAuth) {
           const localUser = localStorage.getItem('dripp_user');
           if (localUser) {
              try {
                const parsedUser = JSON.parse(localUser);
                if (parsedUser && parsedUser.email && adminEmails.includes(parsedUser.email)) {
                   isAuth = true;
                }
              } catch (e) {
                 console.error("Failed to parse dripp_user from localStorage");
              }
           }
        }
        
        setIsAuthorized(isAuth);
      } catch (error) {
        console.error("Auth check error:", error);
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

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        checkAuth();
      }
    );

    return () => {
      window.removeEventListener('resize', checkDevice);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div style={{ cursor: 'auto', display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white' }}>Verifying Access...</div>;
  }

  if (!isDesktop) {
    return (
      <div style={{ cursor: 'auto', display: 'flex', height: '100vh', padding: '20px', textAlign: 'center', justifyContent: 'center', alignItems: 'center', background: '#0a0a0a', color: 'white', flexDirection: 'column' }}>
        <h2 style={{ color: '#ebd73f', marginBottom: '10px' }}>Desktop Only</h2>
        <p>The Dripp Admin Panel is restricted to desktop devices for security and usability.</p>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Return to Site</button>
      </div>
    );
  }

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
