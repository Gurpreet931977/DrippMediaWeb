'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGenz } from '../../../contexts/GenzContext';
import { 
  ChevronLeft, AlertTriangle, CheckCircle2, XCircle, Copy, Check, 
  Sparkles, ShieldCheck, Scale, Clock, MessageSquare, AlertCircle, FileCheck 
} from 'lucide-react';
import styles from '../../admin.module.css';

export default function RevisionRulesPage() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [copiedClause, setCopiedClause] = useState(false);

  const clientClauseText = `Dripp Media Revision Policy:
• Free Revisions: 2 rounds of minor consolidated revisions included per creative asset (typography tweaks, minor pacing trims, subtitle corrections, color adjust).
• Feedback Window: All feedback must be consolidated in Frame.io within 72 hours of draft delivery.
• Scope Expansions: Major narrative pivots, re-scripting after approval, or new footage requests constitute a Scope Expansion (+35% to +50% sprint fee).`;

  const handleCopyClause = () => {
    navigator.clipboard.writeText(clientClauseText);
    setCopiedClause(true);
    setTimeout(() => setCopiedClause(false), 2500);
  };

  const categories = [
    {
      title: 'Included in Free Revisions (Rounds 1 & 2)',
      subtitle: 'Covered under standard project retainers and one-off sprints.',
      type: 'free',
      items: [
        'Typographic adjustments, caption corrections, and font styling tweaks',
        'Pacing trims, micro-timing changes, and dead-air fine tuning (under 3s cuts)',
        'B-roll replacements from existing shared asset bin',
        'Audio balance, voiceover EQ, and sound effect volume balancing',
        'Color grading saturation and contrast adjustments'
      ]
    },
    {
      title: 'Classified as Scope Expansion (Billed Additionally)',
      subtitle: 'Triggers a supplemental quote and requires timeline extension.',
      type: 'paid',
      items: [
        'Fundamental re-scripting or concept change after script approval (+40% fee)',
        'New raw footage ingestion requiring full structural re-edit (+35% fee)',
        'Custom 3D CGI or complex VFX requested that was not in original brief',
        'Format aspect ratio changes not agreed in advance (e.g. converting 16:9 to 9:16 post-cut)',
        'Excessive revision rounds beyond Round 2 ($75/hr or flat $150/round)'
      ]
    }
  ];

  const coreRules = [
    {
      id: 'rule-01',
      title: 'Strict 2-Round Free Limit',
      badge: 'Core Protocol',
      badgeColor: '#4ade80',
      description: 'Standard contracts include up to two (2) comprehensive rounds of revisions per asset. This maintains rapid delivery velocity and keeps team focus razor-sharp.',
      type: 'success'
    },
    {
      id: 'rule-02',
      title: 'Consolidated Single-Source Feedback',
      badge: 'Zero Drip-Feed',
      badgeColor: '#38bdf8',
      description: 'All stakeholder feedback must be aggregated into a single review round in Frame.io. Fragmented feedback sent across multiple emails/chats will be billed as separate rounds.',
      type: 'info'
    },
    {
      id: 'rule-03',
      title: '72-Hour Review Threshold',
      badge: 'Auto-Approval Rule',
      badgeColor: '#f97316',
      description: 'Clients have 72 hours from draft upload to provide review notes. After 72 hours without response, the asset is considered auto-approved and queued for final master packaging.',
      type: 'warning'
    },
    {
      id: 'rule-04',
      title: 'Script Lock Gate',
      badge: 'Pre-Edit Gate',
      badgeColor: '#f43f5e',
      description: 'Once a voiceover or dialogue script is approved in writing, any subsequent dialogue changes require new recording sessions and will incur voiceover re-recording and re-sync fees.',
      type: 'strict'
    }
  ];

  return (
    <div className={styles.container} style={{ padding: '2.5rem 2rem', maxWidth: '1180px', margin: '0 auto', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>
      
      {/* Header Bar */}
      <header style={{ marginBottom: '2.5rem' }}>
        <Link 
          href="/dripp-studio/sop"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#888',
            textDecoration: 'none',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '1.2rem',
            transition: 'color 0.2s',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; }}
        >
          <ChevronLeft size={16} />
          {isGenz ? 'back to production playbook' : 'Back to SOP Dashboard'}
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(235, 215, 63, 0.12)', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
              <Scale size={12} />
              {isGenz ? 'scope protection laws' : 'Quality Assurance & Scope Governance'}
            </div>
            <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>
              {isGenz ? 'revision laws.' : 'Revision Rules & Scope Policy'}
            </h1>
            <p style={{ color: '#aaa', fontSize: '1rem', margin: 0, maxWidth: '680px', lineHeight: '1.5' }}>
              {isGenz ? 'how to protect studio margins, keep iterations lightning-fast, and handle client requests with clarity.' : 'Official guidelines for managing client feedback loops, scope boundaries, and revision turnaround times.'}
            </p>
          </div>

          <button
            onClick={handleCopyClause}
            style={{
              background: copiedClause ? 'rgba(74, 222, 128, 0.15)' : 'linear-gradient(135deg, rgba(235, 215, 63, 0.16) 0%, rgba(235, 215, 63, 0.05) 100%)',
              border: copiedClause ? '1px solid #4ade80' : '1px solid rgba(235, 215, 63, 0.35)',
              color: copiedClause ? '#4ade80' : '#ebd73f',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 15px rgba(235, 215, 63, 0.1)'
            }}
          >
            {copiedClause ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedClause ? 'Clause Copied to Clipboard!' : 'Copy Client Policy Clause'}</span>
          </button>
        </div>
      </header>

      {/* Core Rules 4-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '2.5rem' }}>
        {coreRules.map((rule) => (
          <div
            key={rule.id}
            style={{
              background: 'linear-gradient(145deg, rgba(24, 24, 30, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: `${rule.badgeColor}20`, color: rule.badgeColor, border: `1px solid ${rule.badgeColor}40` }}>
                  {rule.badge}
                </span>
                <Clock size={14} color="#777" />
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', fontWeight: 700, fontFamily: "'Panchang', sans-serif", color: '#fff' }}>
                {rule.title}
              </h3>
              <p style={{ color: '#aaa', fontSize: '0.84rem', lineHeight: '1.5', margin: 0 }}>
                {rule.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Free vs Paid Scope Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px', marginBottom: '2.5rem' }}>
        {categories.map((cat, idx) => {
          const isFree = cat.type === 'free';
          return (
            <div
              key={idx}
              style={{
                background: isFree ? 'rgba(74, 222, 128, 0.03)' : 'rgba(244, 63, 94, 0.03)',
                border: isFree ? '1px solid rgba(74, 222, 128, 0.25)' : '1px solid rgba(244, 63, 94, 0.25)',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.45)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: isFree ? 'rgba(74, 222, 128, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: isFree ? '#4ade80' : '#f43f5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isFree ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 700, color: isFree ? '#4ade80' : '#f43f5e' }}>
                    {cat.title}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#888' }}>
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                {cat.items.map((item, itemIdx) => (
                  <div key={itemIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.86rem', color: '#ccc', lineHeight: '1.4' }}>
                    <span style={{ color: isFree ? '#4ade80' : '#f43f5e', marginTop: '2px', flexShrink: 0 }}>
                      {isFree ? '✓' : '✕'}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copyable Client Policy Box */}
      <div style={{ background: 'rgba(20, 20, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={16} color="#ebd73f" />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              Standard Quote & Invoice Revision Clause
            </h4>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#888' }}>
            Ready to paste into quotes, client scopes, and kickoff onboarding emails
          </span>
        </div>
        <pre style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '0.82rem',
          color: '#a3f08c',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: "'Clash Display', sans-serif",
          margin: 0
        }}>
          {clientClauseText}
        </pre>
      </div>

    </div>
  );
}

