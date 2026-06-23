'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, PackagePlus, Settings } from 'lucide-react';
import styles from '../admin.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/admin-panel', icon: LayoutDashboard },
    { name: 'Invoice Maker', path: '/admin-panel/invoice', icon: FileText },
    { name: 'Quote/Package Maker', path: '/admin-panel/quote', icon: PackagePlus },
    // Future tools can go here
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>Dripp Admin</div>
      
      <nav>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <Link href="/" className={styles.navLink} style={{ color: '#ef4444' }}>
           Return to Site
        </Link>
      </div>
    </div>
  );
}
