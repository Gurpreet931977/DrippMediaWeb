'use client';

import React from 'react';
import Link from 'next/link';
import { useGenz } from '../../../../contexts/GenzContext';
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import styles from '../../../admin.module.css';

export default function RevisionRulesPage() {
  const { isGenz } = useGenz() || { isGenz: false };

  const rules = [
    {
      title: 'Free Revisions Limit',
      description: 'Standard packages include up to 2 rounds of minor revisions for free.',
      type: 'info'
    },
    {
      title: 'Major Changes',
      description: 'Fundamental changes to the brief or structure after initial approval constitute a new scope of work and will be billed additionally.',
      type: 'warning'
    },
    {
      title: 'Turnaround Time',
      description: 'Revision requests must be submitted within 72 hours of receiving the draft. After this period, the project is considered approved.',
      type: 'strict'
    },
    {
      title: 'Consolidated Feedback',
      description: 'All feedback for a revision round must be consolidated and sent in a single communication. Drip-fed feedback will count as multiple rounds.',
      type: 'info'
    }
  ];

  const getIconForType = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={24} color="#ff9800" />;
      case 'strict': return <XCircle size={24} color="#ff4d4d" />;
      default: return <CheckCircle2 size={24} color="#4caf50" />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case 'warning': return 'rgba(255, 152, 0, 0.1)';
      case 'strict': return 'rgba(255, 77, 77, 0.1)';
      default: return 'rgba(76, 175, 80, 0.1)';
    }
  };

  const getBorderForType = (type) => {
    switch (type) {
      case 'warning': return '1px solid rgba(255, 152, 0, 0.3)';
      case 'strict': return '1px solid rgba(255, 77, 77, 0.3)';
      default: return '1px solid rgba(76, 175, 80, 0.3)';
    }
  };

  return (
    <div className={styles.container} style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>
      <header style={{ marginBottom: '2.5rem' }}>
        <Link 
          href="/dripp-studio/sop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#888',
            textDecoration: 'none',
            fontSize: '0.9rem',
            marginBottom: '1rem',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#888'}
        >
          <ChevronLeft size={16} />
          {isGenz ? 'back to manual' : 'Back to SOPs'}
        </Link>
        <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {isGenz ? 'revision laws.' : 'Revision Rules'}
        </h1>
        <p style={{ color: '#aaa', fontSize: '1.1rem' }}>
          {isGenz ? 'how to tell clients no without sounding mean.' : 'Standard policies for client revisions and feedback loops.'}
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {rules.map((rule, index) => (
          <div 
            key={index}
            style={{
              background: getColorForType(rule.type),
              border: getBorderForType(rule.type),
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              gap: '20px',
              alignItems: 'flex-start'
            }}
          >
            <div style={{ 
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '50%',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {getIconForType(rule.type)}
            </div>
            <div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', fontWeight: 600 }}>
                {rule.title}
              </h3>
              <p style={{ margin: 0, color: '#ccc', lineHeight: '1.6', fontSize: '1rem' }}>
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
