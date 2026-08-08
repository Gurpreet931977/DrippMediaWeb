'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PackagePlus, LogOut, Mail, Settings, Video, AlertTriangle, BookOpen, ChevronLeft, Menu } from 'lucide-react';
import styles from '../admin.module.css';
import { useGenz } from '../../contexts/GenzContext';
import { useState, useEffect } from 'react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isGenz } = useGenz() || { isGenz: false };
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem('admin_sidebar_collapsed');
    if (savedState === 'true') setIsCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('admin_sidebar_collapsed', newState.toString());
  };

  const navItems = [
    { name: isGenz ? 'Main Base' : 'Dashboard', path: '/dripp-studio', icon: LayoutDashboard },
    { name: isGenz ? 'Brain Vault' : 'Notes & Planning', path: '/dripp-studio/notes-and-planning', icon: BookOpen },
    { name: isGenz ? 'Bag Securer' : 'Invoice Maker', path: '/dripp-studio/invoice', icon: FileText },
    { name: isGenz ? 'Pitch Cooker' : 'Quotes & Packages', path: '/dripp-studio/quote', icon: PackagePlus },
    { name: isGenz ? 'Masterplan Maker' : 'PMP Maker', path: '/dripp-studio/package', icon: PackagePlus },
    { name: isGenz ? 'The Showcase' : 'Portfolio Manager', path: '/dripp-studio/portfolio', icon: Video },
    { name: isGenz ? 'Mail Blaster' : 'Email Campaigns', path: '/dripp-studio/email', icon: Mail },
    { name: isGenz ? 'Glitch Radar' : 'Error Logs', path: '/dripp-studio/errors', icon: AlertTriangle },
    { name: isGenz ? 'The Engine' : 'System', path: '/dripp-studio/system', icon: Settings },
  ];

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
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
          <div className={styles.logo} style={{ marginBottom: 0, fontSize: '1.4rem' }}>
            {isGenz ? 'DRIPP\nBOSS.' : 'DRIPP\nSTUDIO.'}
          </div>
        )}
        
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
      </div>
      
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
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0 }} />
              {!isCollapsed && <span className={styles.navText} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" className={styles.navLink} style={{ color: '#ef4444' }} title={isCollapsed ? (isGenz ? 'Bounce to Site' : 'Exit to Site') : undefined}>
           <LogOut size={20} strokeWidth={2} style={{ flexShrink: 0 }} />
           {!isCollapsed && <span className={styles.navText} style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{isGenz ? 'Bounce to Site' : 'Exit to Site'}</span>}
        </Link>
      </div>
    </div>
  );
}
