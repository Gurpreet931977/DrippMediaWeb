'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PackagePlus, LogOut, Mail, Settings, Video, AlertTriangle, BookOpen, ChevronLeft, Menu, X, Sparkles, ClipboardList, Layers } from 'lucide-react';
import styles from '../admin.module.css';
import { useGenz } from '../../contexts/GenzContext';
import { useState, useEffect } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isGenz } = useGenz() || { isGenz: false };
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('admin_sidebar_collapsed');
    if (savedState === 'true') setIsCollapsed(true);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('admin_sidebar_collapsed', newState.toString());
  };

  const navItems = [
    { name: isGenz ? 'main base' : 'Dashboard', path: '/dripp-studio', icon: LayoutDashboard },
    { name: isGenz ? 'the menu' : 'Services & Cloud', path: '/dripp-studio/services', icon: Layers },
    { name: isGenz ? 'brain dump' : 'Notes & Planning', path: '/dripp-studio/notes-and-planning', icon: BookOpen },
    { name: isGenz ? 'the manual' : 'SOPs & Rules', path: '/dripp-studio/sop', icon: ClipboardList },
    { name: isGenz ? 'get paid' : 'Invoice Maker', path: '/dripp-studio/invoice', icon: FileText },
    { name: isGenz ? 'cook a pitch' : 'Quotes & Packages', path: '/dripp-studio/quote', icon: PackagePlus },
    { name: isGenz ? "masterplans" : 'PMP Maker', path: '/dripp-studio/package', icon: PackagePlus },
    { name: isGenz ? 'the showcase' : 'Portfolio Manager', path: '/dripp-studio/portfolio', icon: Video },
    { name: isGenz ? 'daily tips' : 'Daily Tips', path: '/dripp-studio/daily-tips', icon: Sparkles },
    { name: isGenz ? 'email blasts' : 'Email Campaigns', path: '/dripp-studio/email', icon: Mail },
    { name: isGenz ? 'glitches' : 'Error Logs', path: '/dripp-studio/errors', icon: AlertTriangle },
    { name: isGenz ? 'the engine' : 'System', path: '/dripp-studio/system', icon: Settings },
  ];

  const currentNav = navItems.find(item => item.path === pathname) || { name: 'Studio' };

  return (
    <>
      {/* Mobile Top Header (Visible only <= 1024px) */}
      <header className={styles.mobileAdminHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Navigation Menu"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation'
            }}
          >
            <Menu size={20} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.95rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
              DRIPP <span style={{ color: '#ebd73f' }}>STUDIO</span>
            </span>
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>
              {currentNav.name}
            </span>
          </div>
        </div>

        <Link
          href="/dripp-studio/notes-and-planning"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: pathname === '/dripp-studio/notes-and-planning' ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255,255,255,0.04)',
            border: pathname === '/dripp-studio/notes-and-planning' ? '1px solid rgba(235, 215, 63, 0.3)' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            color: pathname === '/dripp-studio/notes-and-planning' ? '#ebd73f' : '#ccc',
            textDecoration: 'none',
            fontSize: '0.75rem',
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600
          }}
        >
          <BookOpen size={14} />
          <span>Notes</span>
        </Link>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      <div 
        className={`${styles.sidebarOverlay} ${mobileOpen ? styles.active : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar (Desktop fixed / Mobile slide-out drawer) */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          marginBottom: '2.5rem',
          minHeight: '48px',
          position: 'relative',
          gap: '12px'
        }}>
          {!isCollapsed && (
            <div className={styles.logo} style={{ marginBottom: 0, fontSize: '1.4rem', fontFamily: "'Panchang', sans-serif" }}>
              {isGenz ? 'dripp\nboss.' : 'DRIPP\nSTUDIO.'}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Desktop collapse toggle */}
            <button 
              onClick={toggleSidebar}
              style={{
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff', 
                borderRadius: '10px', 
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.3)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile close button inside drawer */}
            <button
              onClick={() => setMobileOpen(false)}
              className="mobile-close-btn"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaa',
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <style jsx>{`
          @media (max-width: 1024px) {
            .mobile-close-btn {
              display: flex !important;
            }
          }
        `}</style>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto', flex: 1, paddingRight: isCollapsed ? '0' : '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                title={isCollapsed ? item.name : undefined}
                onClick={() => setMobileOpen(false)}
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span className={styles.navText} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" className={styles.navLink} style={{ color: '#ef4444', fontFamily: "'Clash Display', sans-serif" }} title={isCollapsed ? (isGenz ? 'bounce to site' : 'Exit to Site') : undefined}>
             <LogOut size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
             {!isCollapsed && <span className={styles.navText} style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{isGenz ? 'bounce to site' : 'Exit to Site'}</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}

