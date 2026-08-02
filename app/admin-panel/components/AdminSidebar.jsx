'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PackagePlus, LogOut, Mail, Settings, Video } from 'lucide-react';
import styles from '../admin.module.css';
import { useGenz } from '../../contexts/GenzContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isGenz } = useGenz() || { isGenz: false };

  const navItems = [
    { name: isGenz ? 'Main Base' : 'Dashboard', path: '/admin-panel', icon: LayoutDashboard },
    { name: isGenz ? 'Bag Securer' : 'Invoice Maker', path: '/admin-panel/invoice', icon: FileText },
    { name: isGenz ? 'Pitch Cooker' : 'Quotes & Packages', path: '/admin-panel/quote', icon: PackagePlus },
    { name: isGenz ? 'Masterplan Maker' : 'PMP Maker', path: '/admin-panel/package', icon: PackagePlus },
    { name: isGenz ? 'The Showcase' : 'Portfolio Manager', path: '/admin-panel/portfolio', icon: Video },
    { name: isGenz ? 'Mail Blaster' : 'Email Campaigns', path: '/admin-panel/email', icon: Mail },
    { name: isGenz ? 'The Engine' : 'System', path: '/admin-panel/system', icon: Settings },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>{isGenz ? 'DRIPP\nBOSS.' : 'DRIPP\nADMIN.'}</div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" className={styles.navLink} style={{ color: '#ef4444' }}>
           <LogOut size={20} />
           {isGenz ? 'Bounce to Site' : 'Exit to Site'}
        </Link>
      </div>
    </div>
  );
}
