'use client';

import React from 'react';
import Link from 'next/link';
import { useGenz } from '../../../contexts/GenzContext';
import { Book, ChevronRight, FileText, AlertCircle } from 'lucide-react';
import styles from '../../admin.module.css';

export default function SOPPage() {
  const { isGenz } = useGenz() || { isGenz: false };

  const sops = [
    {
      title: 'Client Onboarding',
      description: 'Standard procedure for onboarding new clients into the system.',
      lastUpdated: '2025-01-15'
    },
    {
      title: 'Project Kickoff',
      description: 'Steps required to kick off a new creative project or campaign.',
      lastUpdated: '2025-02-01'
    },
    {
      title: 'Final Delivery & Handover',
      description: 'Process for packaging and delivering final assets to the client.',
      lastUpdated: '2025-03-10'
    }
  ];

  return (
    <div className={styles.container} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2rem', marginBottom: '0.5rem' }}>
            {isGenz ? 'the manual.' : 'Standard Operating Procedures'}
          </h1>
          <p style={{ color: '#aaa' }}>
            {isGenz ? 'how we run this joint' : 'Official guidelines and processes for studio operations.'}
          </p>
        </div>
        <Link 
          href="/dripp-studio/sop/revision-rules"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(235, 215, 63, 0.05) 100%)',
            border: '1px solid rgba(235, 215, 63, 0.3)',
            color: '#ebd73f',
            padding: '10px 20px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 15px rgba(235, 215, 63, 0.1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(235, 215, 63, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(235, 215, 63, 0.1)';
          }}
        >
          <AlertCircle size={18} />
          {isGenz ? 'revision laws' : 'Revision Rules'}
          <ChevronRight size={18} />
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {sops.map((sop, index) => (
          <div 
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileText size={20} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{sop.title}</h3>
            </div>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
              {sop.description}
            </p>
            <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Last Updated: {sop.lastUpdated}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
