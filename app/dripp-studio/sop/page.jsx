'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGenz } from '../../contexts/GenzContext';
import { 
  Book, ChevronRight, FileText, AlertCircle, Search, Sparkles, 
  Clock, CheckCircle2, Copy, Check, ExternalLink, ShieldCheck, 
  Zap, Layers, Video, FolderCheck, ArrowUpRight, X, UserCheck, 
  Send, SlidersHorizontal, Flame, Eye, RefreshCw
} from 'lucide-react';
import styles from '../admin.module.css';

export default function SOPPage() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeModalSOP, setActiveModalSOP] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const categories = [
    { id: 'all', label: isGenz ? 'all ops' : 'All Procedures' },
    { id: 'onboarding', label: isGenz ? 'intake' : 'Client Onboarding' },
    { id: 'creative', label: isGenz ? 'cook room' : 'Creative & Motion' },
    { id: 'review', label: isGenz ? 'qa / roast' : 'Review & Revisions' },
    { id: 'delivery', label: isGenz ? 'bag drop' : 'Delivery & Handover' },
    { id: 'urgent', label: isGenz ? 'code red' : 'Rush & Hotfixes' }
  ];

  const sops = [
    {
      id: 'sop-01',
      category: 'onboarding',
      categoryLabel: 'Client Ops',
      badge: 'Day 1 Standard',
      badgeColor: '#ebd73f',
      title: isGenz ? 'client intake & vibe check' : 'Client Onboarding & Intake Protocol',
      tagline: 'Standard procedure for onboarding new agency clients, syncing assets, and locking timelines.',
      description: 'Establishes a high-trust operational foundation within the first 24 hours of client sign-on. Covers brand kit ingestion, dedicated VIP Slack setup, Google Drive / Frame.io structure provisioning, and timeline alignment.',
      sla: '24 Hours Max',
      responsibleRole: 'Lead Account Manager & Creative Director',
      phases: [
        { title: 'Intake Dossier Dispatch', desc: 'Send automated client intake form to capture brand guidelines, high-res logos, typography licenses, and preferred tone-of-voice.' },
        { title: 'VIP Channel Initialization', desc: 'Create private Slack / WhatsApp VIP channel with key stakeholders and introduce production leads.' },
        { title: 'Cloud Hub Provisioning', desc: 'Set up standardized Google Drive & Frame.io folders (01_RAW_ASSETS, 02_WIP_EDITS, 03_FINAL_MASTERS).' },
        { title: 'Kickoff Alignment Call', desc: 'Conduct a 20-minute rapid kickoff call to confirm first sprint deliverables, content hooks, and publishing deadlines.' }
      ],
      checklist: [
        'Client intake questionnaire completed and reviewed',
        'Brand kit (vector logos, brand fonts, color hexes) synced to studio assets',
        'Frame.io client workspace created with reviewer permissions set',
        'Invoice deposit and signed master service agreement confirmed',
        'Dedicated VIP Slack/WhatsApp group active with welcome message'
      ],
      clientTemplate: `Hey [Client Name]! Welcome to Dripp Media. 🚀\n\nYour studio workspace is officially initialized. Here are your key access links:\n• Shared Asset Drive: [Drive Link]\n• Frame.io Review Portal: [Frame.io Link]\n• VIP Slack Channel: [Slack Link]\n\nNext Step: Our creative team is reviewing your brand assets. First sprint drafts will be uploaded by [Date] for your review!`,
      lastUpdated: '2026-08-10'
    },
    {
      id: 'sop-02',
      category: 'creative',
      categoryLabel: 'Pre-Production',
      badge: 'Hook Engineering',
      badgeColor: '#a78bfa',
      title: isGenz ? 'hook cooking & ideation' : 'Creative Kickoff & Hook Strategy',
      tagline: 'Formulating high-converting viral hooks, script architectures, and visual pacing blueprints.',
      description: 'Transforms raw ideas into structured creative assets designed for maximum retention on TikTok, Instagram Reels, and YouTube. Focuses on the crucial first 3-second visual and audio disruption.',
      sla: '48 Hours Pre-Sprint',
      responsibleRole: 'Head of Content Strategy & Lead Copywriter',
      phases: [
        { title: 'Competitor & Trend Audit', desc: 'Analyze niche top-performing creatives to identify proven retention formats and audio trends.' },
        { title: '3-Hook Variant Engine', desc: 'Draft 3 distinct hook variations (Curiosity Gap, High-Stakes Controversy, Visual Pattern Interrupt) per concept.' },
        { title: 'Kinetic Script Structuring', desc: 'Time script to sub-60s with clear beats: Hook (0-3s), Problem Agitation (3-15s), Solution/Payload (15-45s), Call to Action (45-60s).' },
        { title: 'Audio & Asset Greenlight', desc: 'Select high-energy soundbed, SFX cues, and graphic references before handing off to editing.' }
      ],
      checklist: [
        'At least 3 distinct hook variations written per video',
        'Script timed and paced under 60 seconds (or exact target format)',
        'Visual B-roll cue list mapped to exact timestamps',
        'Sound design references and audio stems pre-selected',
        'Client creative lead sign-off received on core angle'
      ],
      clientTemplate: `Hey team! Here are the 3 hook concepts developed for the upcoming creative sprint:\n\n1. Concept A (Visual Disruption): [Hook description]\n2. Concept B (Curiosity Gap): [Hook description]\n3. Concept C (Direct Challenge): [Hook description]\n\nLet us know your favorite angle by [Time/Date] so post-production can commence!`,
      lastUpdated: '2026-08-05'
    },
    {
      id: 'sop-03',
      category: 'creative',
      categoryLabel: 'Post-Production',
      badge: 'Production Sprint',
      badgeColor: '#38bdf8',
      title: isGenz ? 'post-production & sauce sprint' : 'Motion Design & Editing Workflow',
      tagline: 'High-octane video editing, kinetic typography, 3D graphics, color grading, and SFX mastering.',
      description: 'The core Dripp Media post-production engine. Ensures every video boasts hyper-dynamic pacing, brand typography, custom motion graphics, color depth, and immersive soundscapes.',
      sla: '3 - 5 Day Turnaround',
      responsibleRole: 'Senior Video Editor & Motion Graphics Artist',
      phases: [
        { title: 'Assembly & Dead-Air Cut', desc: 'Import footage into Premiere Pro, cut breaths, pauses, and filler words. Create punchy rhythm with dynamic zoom cuts.' },
        { title: 'B-Roll & 3D Motion Layering', desc: 'Composite high-fidelity B-roll, custom 3D UI mockups, and After Effects kinetic title animations.' },
        { title: 'Brand Typography & Subtitles', desc: 'Apply bespoke Clash Display / Panchang captions with animated pop-in and glowing highlight keywords.' },
        { title: 'Color Grade & Audio Master', desc: 'Apply cinematic LUT grade. Master audio tracks: normalize dialogue (-14 LUFS), layer multi-track SFX (whooshes, risers, bass impacts).' }
      ],
      checklist: [
        'Zero dead air or sluggish pauses in dialogue cut',
        'Strict brand fonts applied (Clash Display / Panchang)',
        'Motion graphics rendered in native 4K 60fps',
        'Audio normalized to industry social broadcast standard (-14 LUFS)',
        'Frame.io timecoded review link exported in 1080x1920 (9:16) and 4K'
      ],
      clientTemplate: `Draft V1 is now ready for your review on Frame.io! 🎬\n\nLink: [Frame.io Draft URL]\n\nPlease leave timestamped comments directly on the video player for any tweaks. Looking forward to your thoughts!`,
      lastUpdated: '2026-08-12'
    },
    {
      id: 'sop-04',
      category: 'review',
      categoryLabel: 'QA & Review',
      badge: 'Strict Policy',
      badgeColor: '#f97316',
      title: isGenz ? 'review laws & feedback loop' : 'Frame.io Review & Revision Protocol',
      tagline: 'Structured client revision policy to eliminate scope creep and deliver lightning-fast iterations.',
      description: 'Governs the feedback and revision cycles between the client and studio. Protects project timelines by requiring consolidated, timestamped feedback and strictly enforcing the 2-round revision limit.',
      sla: '72h Feedback Window',
      responsibleRole: 'Lead Account Manager & Quality Lead',
      phases: [
        { title: 'Draft Staging Release', desc: 'Post draft link exclusively inside Frame.io with watermarked V1 tag.' },
        { title: 'Consolidated Client Review', desc: 'Client provides single round of consolidated timestamped notes within 72 hours.' },
        { title: 'Rapid Iteration Sprint', desc: 'Studio executes approved revisions within 24 business hours and posts V2.' },
        { title: 'Final Polish Sign-Off', desc: 'Minor tweaks locked; client approves final master for export packaging.' }
      ],
      checklist: [
        'All feedback requested through timestamped Frame.io comments',
        'Client notified of 72-hour review turnaround threshold',
        'Scope changes vs minor revisions clearly categorized',
        'Revision Round 1 executed within 24 hours of receipt',
        'Written client approval logged before final rendering'
      ],
      clientTemplate: `Hey [Client Name], we received your revision notes for Draft V1. ✍️\n\nOur team is implementing these updates right now. You can expect Draft V2 uploaded to Frame.io within 24 hours for final sign-off!`,
      lastUpdated: '2026-08-14'
    },
    {
      id: 'sop-05',
      category: 'delivery',
      categoryLabel: 'Delivery & QA',
      badge: 'Master Handoff',
      badgeColor: '#4ade80',
      title: isGenz ? 'final bag delivery & handover' : 'Master Packaging & Asset Handover',
      tagline: 'Flawless packaging of production masters, multi-aspect exports, raw archives, and sign-offs.',
      description: 'The final quality gate before asset deployment. Covers export verification, uncompressed ProRes archiving, SRT caption file generation, and clean cloud handoff to the client.',
      sla: '24 Hours Post-Approval',
      responsibleRole: 'Studio Production Lead',
      phases: [
        { title: 'Master 4K & Multi-Format Render', desc: 'Export master uncompressed ProRes 422 HQ and high-bitrate H.264 MP4s for all required aspect ratios (9:16 vertical, 16:9 widescreen, 1:1 feed).' },
        { title: 'Closed Caption Generation', desc: 'Export embedded burned-in captions + separate .SRT file for multi-language ad accessibility.' },
        { title: 'Client Delivery Hub Sync', desc: 'Upload to organized client Final_Masters folder on Google Drive.' },
        { title: 'Invoice Settlement & Sign-Off', desc: 'Trigger final project handover receipt and archive local project files to 60-day cold storage.' }
      ],
      checklist: [
        'All watermarks removed from final masters',
        'Both clean (no text) and captioned versions rendered',
        'Aspect ratios tested for mobile UI overlay safe zones (TikTok/Reels overlay clearance)',
        'Client Google Drive permissions granted with download access',
        'Project archive backed up to redundant cloud cold storage'
      ],
      clientTemplate: `🎉 All approved masters for [Project Name] are packaged and live in your final delivery drive!\n\n📁 Download Final Masters: [Google Drive Final Link]\n\nIncludes:\n• 4K 60fps Vertical (9:16) Master\n• Clean No-Text Version\n• Raw .SRT Subtitle File\n\nIt was a blast creating this campaign with you! Let us know when you're ready for the next sprint!`,
      lastUpdated: '2026-08-15'
    },
    {
      id: 'sop-06',
      category: 'urgent',
      categoryLabel: 'Emergency Ops',
      badge: '12h Escalation',
      badgeColor: '#f43f5e',
      title: isGenz ? 'code red & same-day rush' : 'Rush Turnarounds & Hotfix Protocol',
      tagline: 'Emergency rapid-response protocol for breaking social trends, live event cuts, and urgent hotfixes.',
      description: 'Activated when a client requires same-day turnaround (< 12 hours) or urgent creative modifications for time-sensitive launches, live events, or trending viral audio.',
      sla: 'Sub 12 Hours',
      responsibleRole: 'Lead On-Call Editor & Managing Partner',
      phases: [
        { title: 'Emergency Tag Authorization', desc: 'Client flags emergency in VIP channel; account lead approves rush bandwidth and applies +35% rush dispatch billing.' },
        { title: 'Immediate Pipeline Allocation', desc: 'Assign dedicated senior editor to jump queue and begin immediate assembly.' },
        { title: 'Live Async Review', desc: 'Deliver rough cut within 4-6 hours directly in VIP channel for instant approval.' },
        { title: 'Rapid Master Dispatch', desc: 'Export high-speed master directly to cloud drive with zero delay.' }
      ],
      checklist: [
        'Rush priority rate authorized and confirmed in writing',
        'Dedicated senior editor assigned with dedicated render station',
        'Initial cut rendered within 6 hours of raw footage receipt',
        'Real-time communication active in VIP channel',
        'Master delivered directly to client within 12 hours'
      ],
      clientTemplate: `🚨 Rush request received and confirmed! Our dedicated editor is working on this immediately.\n\nYou will have your first preview cut in this channel within 4-6 hours. Standing by!`,
      lastUpdated: '2026-08-15'
    }
  ];

  const filteredSOPs = useMemo(() => {
    return sops.filter(sop => {
      const matchesCategory = selectedCategory === 'all' || sop.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        sop.title.toLowerCase().includes(q) || 
        sop.description.toLowerCase().includes(q) || 
        sop.tagline.toLowerCase().includes(q) ||
        sop.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [sops, selectedCategory, searchQuery]);

  const handleCopyTemplate = (sop) => {
    if (!sop?.clientTemplate) return;
    navigator.clipboard.writeText(sop.clientTemplate);
    setCopiedId(sop.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleCheckItem = (sopId, index) => {
    const key = `${sopId}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.container} style={{ padding: '2.5rem 2rem', maxWidth: '1320px', margin: '0 auto', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>
      
      {/* Header Bar */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(235, 215, 63, 0.12)', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            <Sparkles size={12} />
            {isGenz ? 'dripp production playbook' : 'Dripp Studio Operating System'}
          </div>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2.4rem', fontWeight: 800, margin: '0 0 0.6rem 0', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            {isGenz ? 'standard operating procedures.' : 'Standard Operating Procedures'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: '1.5', margin: 0 }}>
            {isGenz ? 'bulletproof workflows, quality standards, and master delivery rules for dripp media creatives.' : 'Battle-tested production protocols, quality benchmarks, and delivery workflows for Dripp Media creatives and studio leads.'}
          </p>
        </div>

        {/* Action Controls Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link 
            href="/dripp-studio/sop/revision-rules"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.16) 0%, rgba(235, 215, 63, 0.05) 100%)',
              border: '1px solid rgba(235, 215, 63, 0.35)',
              color: '#ebd73f',
              padding: '12px 22px',
              borderRadius: '14px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 8px 25px rgba(235, 215, 63, 0.12)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(235, 215, 63, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 215, 63, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
            }}
          >
            <AlertCircle size={18} color="#ebd73f" />
            <span>{isGenz ? 'Revision Rules' : 'Revision Rules'}</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </header>

      {/* Filter & Search Bar Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '2rem', padding: '16px', background: 'rgba(20, 20, 26, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '18px' }}>
        
        {/* Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="notion-font"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isActive ? '1px solid rgba(235, 215, 63, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ebd73f' : '#bbb',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  fontFamily: "'Clash Display', sans-serif"
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = '#bbb';
                  }
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Omnibox */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1', maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input 
            type="text"
            placeholder={isGenz ? "search ops, checklists..." : "Search procedures, steps, tags..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="notion-font"
            style={{
              width: '100%',
              padding: '10px 36px 10px 38px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.84rem',
              outline: 'none',
              fontFamily: "'Clash Display', sans-serif",
              transition: 'all 0.2s ease'
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(235, 215, 63, 0.4)';
              e.target.style.background = 'rgba(235, 215, 63, 0.05)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.target.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* SOP Cards Grid */}
      {filteredSOPs.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <FileText size={36} color="#555" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#eee', marginBottom: '6px' }}>No procedures found matching your query</h3>
          <p style={{ color: '#777', fontSize: '0.9rem', margin: 0 }}>Try adjusting your search terms or filter category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '22px' }}>
          {filteredSOPs.map((sop) => (
            <div 
              key={sop.id}
              onClick={() => setActiveModalSOP(sop)}
              style={{
                background: 'linear-gradient(145deg, rgba(24, 24, 30, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '28px',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.45)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.35)';
                e.currentTarget.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 25px rgba(235, 215, 63, 0.08)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.45)';
              }}
            >
              <div>
                {/* Card Top Meta Badges */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 700, 
                      letterSpacing: '0.8px', 
                      textTransform: 'uppercase',
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#bbb',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {sop.categoryLabel}
                    </span>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 700, 
                      padding: '3px 8px', 
                      borderRadius: '6px', 
                      background: 'rgba(235, 215, 63, 0.12)',
                      color: sop.badgeColor || '#ebd73f',
                      border: `1px solid ${sop.badgeColor || 'rgba(235, 215, 63, 0.3)'}40`
                    }}>
                      {sop.badge}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>
                    <Clock size={12} color="#aaa" />
                    <span>{sop.sla}</span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '1.28rem', 
                  fontWeight: 700, 
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  fontFamily: "'Panchang', sans-serif"
                }}>
                  {sop.title}
                </h3>
                <p style={{ color: '#aaa', fontSize: '0.86rem', lineHeight: '1.5', marginBottom: '20px' }}>
                  {sop.tagline}
                </p>

                {/* 4-Step Process Micro-Timeline */}
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '8px' }}>
                    Standard Workflow
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sop.phases.slice(0, 3).map((phase, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: '#ccc' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.15)', color: '#ebd73f', fontSize: '0.62rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {pIdx + 1}
                        </span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {phase.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: 500 }}>
                  Updated: {sop.lastUpdated}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ebd73f', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span>Inspect SOP</span>
                  <ArrowUpRight size={15} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Full SOP Inspection Modal */}
      {activeModalSOP && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100050,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setActiveModalSOP(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, rgba(22, 22, 28, 0.98) 0%, rgba(12, 12, 16, 0.99) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderTop: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '24px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '36px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(235, 215, 63, 0.12)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              fontFamily: "'Clash Display', sans-serif"
            }}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalSOP(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#aaa',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(235, 215, 63, 0.15)', color: '#ebd73f', border: '1px solid rgba(235, 215, 63, 0.35)', textTransform: 'uppercase' }}>
                  {activeModalSOP.categoryLabel}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: '#bbb' }}>
                  SLA: {activeModalSOP.sla}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#777' }}>
                  Lead: {activeModalSOP.responsibleRole}
                </span>
              </div>
              <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#fff' }}>
                {activeModalSOP.title}
              </h2>
              <p style={{ color: '#ccc', fontSize: '0.94rem', lineHeight: '1.6', margin: 0 }}>
                {activeModalSOP.description}
              </p>
            </div>

            {/* Step-by-Step Production Roadmap */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} /> Production Phases & Milestones
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                {activeModalSOP.phases.map((phase, i) => (
                  <div 
                    key={i} 
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(235, 215, 63, 0.15)',
                      border: '1px solid rgba(235, 215, 63, 0.3)',
                      color: '#ebd73f',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        {phase.title}
                      </h4>
                      <p style={{ margin: 0, color: '#aaa', fontSize: '0.84rem', lineHeight: '1.5' }}>
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Quality Checklist */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> Studio Quality Gate Checklist
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeModalSOP.checklist.map((item, idx) => {
                  const itemKey = `${activeModalSOP.id}-${idx}`;
                  const isChecked = !!checkedItems[itemKey];
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleCheckItem(activeModalSOP.id, idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        padding: '6px 0'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: isChecked ? '#ebd73f' : 'rgba(255, 255, 255, 0.08)',
                        border: isChecked ? '1px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}>
                        {isChecked && <Check size={13} color="#000" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.86rem', color: isChecked ? '#888' : '#ddd', textDecoration: isChecked ? 'line-through' : 'none', transition: 'all 0.2s' }}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Copyable Client Message Template */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} /> Ready Client Message Template
                </div>
                <button
                  onClick={() => handleCopyTemplate(activeModalSOP)}
                  style={{
                    background: copiedId === activeModalSOP.id ? 'rgba(74, 222, 128, 0.15)' : 'rgba(235, 215, 63, 0.15)',
                    border: copiedId === activeModalSOP.id ? '1px solid #4ade80' : '1px solid rgba(235, 215, 63, 0.35)',
                    color: copiedId === activeModalSOP.id ? '#4ade80' : '#ebd73f',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedId === activeModalSOP.id ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedId === activeModalSOP.id ? 'Copied to Clipboard!' : 'Copy Template'}</span>
                </button>
              </div>
              <pre style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '0.82rem',
                color: '#a3f08c',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: "'Clash Display', sans-serif",
                margin: 0
              }}>
                {activeModalSOP.clientTemplate}
              </pre>
            </div>

            {/* Modal Actions Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', {
                    detail: {
                      text: `Can you help me adapt the "${activeModalSOP.title}" SOP for a new client project?`
                    }
                  }));
                  setActiveModalSOP(null);
                }}
                style={{
                  background: 'rgba(235, 215, 63, 0.12)',
                  border: '1px solid rgba(235, 215, 63, 0.3)',
                  color: '#ebd73f',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} /> Ask Orlo to adapt this SOP
              </button>
              <button
                onClick={() => setActiveModalSOP(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
