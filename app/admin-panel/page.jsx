'use client';

import Link from 'next/link';
import { FileText, PackagePlus, Users, TrendingUp, ShieldCheck } from 'lucide-react';
import styles from './admin.module.css';

export default function AdminDashboard() {
  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Overview</h1>
        <p className={styles.subtitle}>Welcome to the Dripp Media Admin Hub.</p>
      </div>

      <div className={styles.row}>
        <div className={styles.col}>
          <div className={styles.interactiveCard}>
            <div style={{ background: 'rgba(235, 215, 63, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
               <FileText size={24} color="#ebd73f" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>
               Quick Invoice
            </h3>
            <p className={styles.subtitle} style={{ marginBottom: '2rem', flex: 1, lineHeight: '1.6' }}>
              Generate a professional, branded invoice in seconds. Seamlessly export to PDF and send directly to clients.
            </p>
            <Link href="/admin-panel/invoice" className={styles.btnPrimary} style={{ textDecoration: 'none', width: '100%', textAlign: 'center', padding: '1rem', borderRadius: '0.75rem', fontSize: '1rem' }}>
              Create New Invoice
            </Link>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.interactiveCard}>
             <div style={{ background: 'rgba(235, 215, 63, 0.1)', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
               <PackagePlus size={24} color="#ebd73f" />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>
               Quote Maker Pro
            </h3>
            <p className={styles.subtitle} style={{ marginBottom: '2rem', flex: 1, lineHeight: '1.6' }}>
              Build dynamic project proposals, detailed quotations, and customized premium package offerings with AI Smart Paste.
            </p>
            <Link href="/admin-panel/quote" className={styles.btnPrimary} style={{ textDecoration: 'none', width: '100%', textAlign: 'center', padding: '1rem', borderRadius: '0.75rem', fontSize: '1rem' }}>
              Create New Quote
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem', borderRadius: '50%' }}>
           <ShieldCheck size={32} color="#22c55e" />
        </div>
        <div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
             System Secure & Active
          </h3>
          <p className={styles.subtitle} style={{ margin: 0 }}>
            Local storage is active. Your invoices, quotes, and packages are securely saved directly to your browser session.
          </p>
        </div>
      </div>
    </div>
  );
}
