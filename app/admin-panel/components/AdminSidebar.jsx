'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PackagePlus, LogOut } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/admin-panel', icon: LayoutDashboard },
    { name: 'Invoice Maker', path: '/admin-panel/invoice', icon: FileText },
    { name: 'Quote/Package Maker', path: '/admin-panel/quote', icon: PackagePlus },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>DRIPP<br/>ADMIN.</div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.name} 
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
           Exit to Site
        </Link>
      </div>
    </div>
  );
}
