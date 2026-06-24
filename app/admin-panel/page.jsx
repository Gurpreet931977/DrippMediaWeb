'use client';

import Link from 'next/link';
import { FileText, PackagePlus, Users, TrendingUp } from 'lucide-react';
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
          <div className={styles.card}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#ebd73f" /> Quick Invoice
            </h3>
            <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
              Generate a professional, branded invoice in seconds and export to PDF.
            </p>
            <Link href="/admin-panel/invoice" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', color: '#000', fontWeight: '500' }}>
              Create Invoice
            </Link>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.card}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PackagePlus size={20} color="#ebd73f" /> Quote Maker
            </h3>
            <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
              Build project proposals, quotations, and customized package offerings.
            </p>
            <Link href="/admin-panel/quote" className={styles.btnPrimary} style={{ textDecoration: 'none', display: 'inline-block', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', color: '#000', fontWeight: '500' }}>
              Create Quote
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           System Status
        </h3>
        <p className={styles.subtitle}>
          Local storage is active. Your invoices and quotes are securely saved to your browser.
        </p>
      </div>
    </div>
  );
}
