'use client';

import Link from 'next/link';
import { FileText, PackagePlus, ShieldCheck, Video, Mail, Settings, Activity, HardDrive, Sparkles, Database, AlertTriangle, CheckSquare, Check, ChevronRight } from 'lucide-react';
import styles from './admin.module.css';
import { useGenz } from '../contexts/GenzContext';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [currentDate, setCurrentDate] = useState('');
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingCount, setPendingCount] = useState(null);
  const [completingIds, setCompletingIds] = useState([]);

  const handleToggleTask = async (e, task) => {
    e.preventDefault();
    e.stopPropagation();
    
    setCompletingIds(prev => [...prev, task.id]);
    
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: task.id, type: 'to_do', checked: true })
      });
      
      const cacheKey = `notion_page_${task.docId}`;
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        try {
          const cachedData = JSON.parse(cachedStr);
          const updatedBlocks = cachedData.blocks?.map(b => 
            (b.id === task.id || b.id.replace(/-/g, '') === task.id.replace(/-/g, ''))
              ? { ...b, to_do: { ...b.to_do, checked: true } }
              : b
          );
          localStorage.setItem(cacheKey, JSON.stringify({ ...cachedData, blocks: updatedBlocks }));
        } catch(e) {}
      }

      setTimeout(() => {
        setPendingTasks(prev => prev.filter(t => t.id !== task.id));
        setPendingCount(prev => Math.max(0, (prev || 1) - 1));
        setCompletingIds(prev => prev.filter(id => id !== task.id));
      }, 400);
    } catch(err) {
      console.error(err);
      setCompletingIds(prev => prev.filter(id => id !== task.id));
    }
  };

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    setCurrentDate(date);

    async function loadPendingTasks() {
      try {
        // 1. Fast sync from cache
        const cachedListStr = localStorage.getItem('notion_list');
        if (cachedListStr) {
          try {
            const cachedList = JSON.parse(cachedListStr).items || [];
            let fastPending = [];
            for (const item of cachedList) {
              const cachedPageStr = localStorage.getItem(`notion_page_${item.id}`);
              if (cachedPageStr) {
                const pageBlocks = JSON.parse(cachedPageStr).blocks || [];
                const pagePending = pageBlocks
                  .filter(b => {
                    if (b.type !== 'to_do' || b.to_do?.checked) return false;
                    const text = (b.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').trim();
                    return text.length > 0;
                  })
                  .map(b => ({
                    id: b.id, docId: item.id, docTitle: item.title || 'Untitled Document',
                    text: b.to_do?.rich_text?.map(t => t.plain_text).join('') || 'Untitled Task'
                  }));
                fastPending.push(...pagePending);
              }
            }
            setPendingTasks(fastPending);
            setPendingCount(fastPending.length);
          } catch(e) {}
        }

        // 2. Fetch fresh list from network
        const res = await fetch('/api/admin/notion?action=list');
        const data = await res.json();
        const items = data.items || [];
        localStorage.setItem('notion_list', JSON.stringify({ ...data, items }));
        
        let allPending = [];
        for (const item of items) {
          const cacheKey = `notion_page_${item.id}`;
          const cached = localStorage.getItem(cacheKey);
          let pageBlocks = [];
          if (cached) {
            try { pageBlocks = JSON.parse(cached).blocks || []; } catch(e){}
          }
          if (pageBlocks.length === 0) {
            try {
              const bRes = await fetch(`/api/admin/notion?action=blocks&pageId=${item.id}`);
              const bData = await bRes.json();
              pageBlocks = bData.blocks || [];
              if (pageBlocks.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify(bData));
              }
            } catch(e) {}
          }
          
          const pagePending = pageBlocks
            .filter(b => {
              if (b.type !== 'to_do' || b.to_do?.checked) return false;
              const text = (b.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').trim();
              return text.length > 0;
            })
            .map(b => ({
              id: b.id,
              docId: item.id,
              docTitle: item.title || 'Untitled Document',
              text: b.to_do?.rich_text?.map(t => t.plain_text).join('') || 'Untitled Task'
            }));
          allPending.push(...pagePending);
          
          // Progressive update so it doesn't stay 'Syncing...' or stale for 10 seconds
          setPendingTasks([...allPending]);
          setPendingCount(allPending.length);
        }
      } catch(err) {
        console.error(err);
        setPendingCount(prev => prev === null ? 0 : prev);
      }
    }
    loadPendingTasks();
  }, []);

  const featureCards = [
    {
      id: 'portfolio',
      title: isGenz ? 'the showcase' : 'Portfolio Manager',
      desc: isGenz ? 'upload videos & graphics straight to the cloud. keep the feed drippy.' : 'Manage videos, graphics, and case studies. Upload directly to Cloudflare R2.',
      icon: Video,
      link: '/dripp-studio/portfolio',
      btnText: isGenz ? 'manage portfolio' : 'Open Portfolio',
      color: '#ebd73f'
    },
    {
      id: 'quote',
      title: isGenz ? 'cook a pitch' : 'Quotes & Packages',
      desc: isGenz ? 'build proposals and custom quotes with ai. basically a cheat code for pitching.' : 'Build dynamic project proposals, detailed quotations, and customized premium packages.',
      icon: PackagePlus,
      link: '/dripp-studio/quote',
      btnText: isGenz ? 'drop quote' : 'Create New Quote',
      color: '#3b82f6'
    },
    {
      id: 'invoice',
      title: isGenz ? 'get paid' : 'Quick Invoice',
      desc: isGenz ? 'generate a professional invoice in seconds. drop the pdf and secure the bag.' : 'Generate a professional, branded invoice in seconds. Seamlessly export to PDF.',
      icon: FileText,
      link: '/dripp-studio/invoice',
      btnText: isGenz ? 'drop invoice' : 'Create Invoice',
      color: '#10b981'
    },
    {
      id: 'package',
      title: isGenz ? "masterplans" : 'PMP Maker',
      desc: isGenz ? 'build masterplans and package generation. big moves only.' : 'Generate comprehensive masterplans and package offerings for clients.',
      icon: Sparkles,
      link: '/dripp-studio/package',
      btnText: isGenz ? 'build pmp' : 'Open PMP Maker',
      color: '#a855f7'
    },
    {
      id: 'email',
      title: isGenz ? 'email blasts' : 'Email Campaigns',
      desc: isGenz ? 'blast out the newsletters. let them know what\'s good.' : 'Administer marketing campaigns and send mass emails to your clients.',
      icon: Mail,
      link: '/dripp-studio/email',
      btnText: isGenz ? 'send blast' : 'Open Campaigns',
      color: '#f43f5e'
    },
    {
      id: 'system',
      title: isGenz ? 'the engine' : 'System Settings',
      desc: isGenz ? 'configure the vibes. toggle genz mode and check storage.' : 'Configure local storage, DB settings, security, and application modes.',
      icon: Settings,
      link: '/dripp-studio/system',
      btnText: isGenz ? 'pop hood' : 'System Hub',
      color: '#8b5cf6'
    },
    {
      id: 'notion',
      title: isGenz ? 'brain dump' : 'Document Hub',
      desc: isGenz ? 'syncs with your workspace. edit blocks, drop presets, stay organized.' : 'Direct integration with your workspace. View, edit, and manage documents natively.',
      icon: Database,
      link: '/dripp-studio/notes-and-planning',
      btnText: isGenz ? 'enter hub' : 'Open Hub',
      color: '#f97316'
    },
    {
      id: 'errors',
      title: isGenz ? 'the fixer' : 'Error Logs',
      desc: isGenz ? 'see what\'s broken and fix it before anyone notices.' : 'Monitor application health, track system errors, and view detailed logs.',
      icon: AlertTriangle,
      link: '/dripp-studio/errors',
      btnText: isGenz ? 'check logs' : 'View Errors',
      color: '#ef4444'
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <style jsx>{`
        .dashboard-header {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          align-items: flex-end;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 2rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        .core-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }
        .capabilities-card {
          margin-top: 4rem;
          padding: 3.5rem;
          background: rgba(255,255,255,0.02);
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 1024px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            padding-bottom: 1.25rem;
            gap: 0.75rem;
          }
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .core-tools-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .capabilities-card {
            margin-top: 2rem;
            padding: 1.5rem !important;
            border-radius: 16px;
          }
        }
      `}</style>
      {/* Hero Header */}
      <div className="dashboard-header">
        <div>
          <h1 className={styles.title} style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', marginBottom: '0.5rem', fontFamily: "'Panchang', sans-serif" }}>{isGenz ? 'main character energy' : 'Dashboard Overview'}</h1>
          <p className={styles.subtitle} style={{ fontSize: 'clamp(0.9rem, 3vw, 1.15rem)', fontFamily: "'Clash Display', sans-serif" }}>{isGenz ? `welcome back, boss. today is ${currentDate}.` : `Welcome to the Admin Hub. Today is ${currentDate}.`}</p>
        </div>
        <div style={{ padding: '0.65rem 1.1rem', background: 'rgba(235, 215, 63, 0.1)', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Panchang', sans-serif" }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ebd73f', boxShadow: '0 0 10px #ebd73f' }}></div>
          {isGenz ? 'vibe check: passed' : 'Admin Level: Super'}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-grid">
        
        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <ShieldCheck size={32} color="#22c55e" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Security</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Secured</p>
          </div>
        </div>

        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(235, 215, 63, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <HardDrive size={32} color="#ebd73f" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Storage</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Active</p>
          </div>
        </div>

        <div className={styles.card} style={{ margin: 0, padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1.25rem', borderRadius: '50%' }}>
            <Activity size={32} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Orlo AI</h3>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>Online</p>
          </div>
        </div>

        <Link href="/dripp-studio/notes-and-planning" style={{ textDecoration: 'none' }}>
          <div className={styles.card} style={{ 
            margin: 0, 
            padding: '1.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem', 
            cursor: 'pointer', 
            border: '1px solid rgba(235, 215, 63, 0.35)', 
            background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.12) 0%, rgba(20, 20, 26, 0.85) 100%)',
            boxShadow: '0 8px 30px rgba(235, 215, 63, 0.08)'
          }}>
            <div style={{ background: 'rgba(235, 215, 63, 0.18)', padding: '1.25rem', borderRadius: '50%', border: '1px solid rgba(235, 215, 63, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={30} color="#ebd73f" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.85rem', color: '#ebd73f', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700', fontFamily: "'Clash Display', sans-serif" }}>Pending Tasks</h3>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#fff', fontFamily: "'Clash Display', sans-serif" }}>{pendingCount === null ? 'Syncing...' : `${pendingCount} Tasks`}</p>
            </div>
          </div>
        </Link>

      </div>

      {/* Pending Tasks Interactive Section */}
      <div style={{ 
        marginBottom: '3rem', 
        padding: '2rem 2.25rem', 
        background: 'linear-gradient(180deg, rgba(24, 24, 30, 0.85) 0%, rgba(12, 12, 16, 0.95) 100%)', 
        borderRadius: '24px', 
        border: '1px solid rgba(235, 215, 63, 0.25)', 
        boxShadow: '0 20px 45px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 14px', 
              background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.18) 0%, rgba(235, 215, 63, 0.06) 100%)', 
              border: '1px solid rgba(235, 215, 63, 0.45)', 
              borderRadius: '30px', 
              color: '#ebd73f', 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              fontFamily: "'Clash Display', sans-serif", 
              letterSpacing: '1px' 
            }}>
              <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
                <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#ebd73f', opacity: 0.75 }}></span>
                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', background: '#ebd73f', boxShadow: '0 0 8px #ebd73f' }}></span>
              </span>
              {pendingCount === null ? 'SYNCING...' : `${pendingCount} PENDING`}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: "'Panchang', sans-serif", textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isGenz ? 'action items to crush' : 'Pending Tasks'}
            </h2>
          </div>
          <Link 
            href="/dripp-studio/notes-and-planning" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '8px 16px', 
              background: 'rgba(235, 215, 63, 0.08)', 
              border: '1px solid rgba(235, 215, 63, 0.25)', 
              borderRadius: '10px', 
              color: '#ebd73f', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              textDecoration: 'none', 
              fontFamily: "'Clash Display', sans-serif", 
              transition: 'all 0.2s ease' 
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(235, 215, 63, 0.16)';
              e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.5)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(235, 215, 63, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.25)';
            }}
          >
            <span>Open in Workspace</span>
            <ChevronRight size={15} />
          </Link>
        </div>

        {pendingTasks.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '1.1rem', fontFamily: "'Clash Display', sans-serif", fontWeight: 700 }}>All Caught Up!</h4>
            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem', fontFamily: "'Clash Display', sans-serif" }}>No pending to-do items found across your studio documents.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {pendingTasks.map((task) => {
              const isDone = completingIds.includes(task.id);
              return (
                <div 
                  key={task.id} 
                  style={{ 
                    padding: '1.25rem', 
                    background: isDone ? 'rgba(39, 201, 63, 0.08)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(20, 20, 26, 0.7) 100%)', 
                    border: `1px solid ${isDone ? 'rgba(39, 201, 63, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`, 
                    borderRadius: '16px', 
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseOver={e => {
                    if (!isDone) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(25, 25, 32, 0.85) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(235, 215, 63, 0.12)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isDone) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(20, 20, 26, 0.7) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(e, task)}
                      title="Mark as completed"
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        border: `2px solid ${isDone ? '#27c93f' : '#ebd73f'}`,
                        background: isDone ? '#27c93f' : 'rgba(235, 215, 63, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        marginTop: '2px',
                        padding: 0,
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {isDone && <Check size={14} color="#000" strokeWidth={3} />}
                    </button>
                    <span style={{ 
                      fontSize: '0.96rem', 
                      color: isDone ? '#777' : '#fff', 
                      fontWeight: 600, 
                      lineHeight: 1.5, 
                      fontFamily: "'Clash Display', sans-serif",
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      {task.text}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: '#999', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontFamily: "'Clash Display', sans-serif",
                      background: 'rgba(255,255,255,0.04)',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      📄 {task.docTitle}
                    </span>
                    <Link 
                      href={`/dripp-studio/notes-and-planning?docId=${task.docId}&blockId=${task.id}`}
                      style={{ 
                        fontSize: '0.75rem', 
                        color: '#ebd73f', 
                        fontWeight: 700, 
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                        fontFamily: "'Clash Display', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Jump to Doc</span>
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ height: '2px', flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.05), transparent)' }}></div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff', fontFamily: 'Panchang, sans-serif' }}>
          {isGenz ? 'the toolkit' : 'Core Tools'}
        </h2>
        <div style={{ height: '2px', flex: 1, background: 'linear-gradient(270deg, rgba(255,255,255,0.05), transparent)' }}></div>
      </div>

      {/* Main Grid */}
      <div className="core-tools-grid">
        {featureCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.id} className={styles.interactiveCard} style={{ padding: '2.5rem' }}>
              <div style={{ background: `rgba(255,255,255,0.03)`, width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.75rem', border: `1px solid ${card.color}50`, boxShadow: `0 8px 20px ${card.color}15` }}>
                 <Icon size={28} color={card.color} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: '700', fontFamily: 'Panchang, sans-serif', letterSpacing: '0.5px' }}>
                 {card.title}
              </h3>
              <p className={styles.subtitle} style={{ marginBottom: '2.5rem', flex: 1, lineHeight: '1.7', fontSize: '1.05rem', color: '#999' }}>
                {card.desc}
              </p>
              <Link href={card.link} className={styles.btnPrimary} style={{ 
                  textDecoration: 'none', 
                  width: '100%', 
                  textAlign: 'center', 
                  padding: '1.1rem', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  background: card.color === '#ebd73f' ? 'linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%)' : 'rgba(255,255,255,0.05)', 
                  color: card.color === '#ebd73f' ? '#000' : '#fff', 
                  border: card.color !== '#ebd73f' ? '1px solid rgba(255,255,255,0.1)' : 'none', 
                  fontWeight: '600', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: card.color === '#ebd73f' ? '0 8px 25px rgba(235, 215, 63, 0.25)' : 'none'
                }} 
                 onMouseOver={(e) => { 
                   if(card.color !== '#ebd73f') {
                     e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                     e.currentTarget.style.borderColor = card.color;
                     e.currentTarget.style.color = card.color;
                     e.currentTarget.style.transform = 'translateY(-3px)';
                     e.currentTarget.style.boxShadow = `0 10px 25px ${card.color}25`;
                   } else {
                     e.currentTarget.style.transform = 'translateY(-3px)';
                     e.currentTarget.style.boxShadow = '0 12px 30px rgba(235, 215, 63, 0.4)';
                   }
                 }}
                 onMouseOut={(e) => { 
                   if(card.color !== '#ebd73f') {
                     e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                     e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                     e.currentTarget.style.color = '#fff';
                     e.currentTarget.style.transform = 'none';
                     e.currentTarget.style.boxShadow = 'none';
                   } else {
                     e.currentTarget.style.transform = 'none';
                     e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 215, 63, 0.25)';
                   }
                 }}
              >
                {card.btnText}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Admin Panel Capabilities Section */}
      <div className="capabilities-card">
        <div style={{ position: 'absolute', top: 0, right: 0, width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, transparent 70%)', transform: 'translate(30%, -30%)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)', transform: 'translate(-30%, 30%)', pointerEvents: 'none' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '700', fontFamily: 'Panchang, sans-serif', marginBottom: '1.5rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {isGenz ? 'the command center' : 'System Capabilities'}
          </h2>
          <p style={{ fontSize: '1.15rem', color: '#aaa', lineHeight: '1.8', maxWidth: '800px', marginBottom: '3rem' }}>
            {isGenz ? 'this isn\'t just a dashboard, it\'s the whole operating system. From dropping invoices to blasting emails, managing the portfolio, and cooking up quotes with AI. Everything you need to run the empire is right here.' 
              : 'The Admin Panel is a centralized hub designed to streamline operations. It provides powerful tools for content management, financial operations, marketing campaigns, and system administration, all seamlessly integrated into one unified interface.'}
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Operations', desc: 'Invoices, Quotes & Packages', icon: FileText, color: '#3b82f6' },
              { title: 'Marketing', desc: 'Email Campaigns & Audience', icon: Mail, color: '#f43f5e' },
              { title: 'Content', desc: 'Portfolio & Document Integration', icon: Video, color: '#ebd73f' },
              { title: 'System', desc: 'Error Logs & Settings', icon: Settings, color: '#8b5cf6' }
            ].map((cap, i) => (
               <div key={i} className={styles.interactiveCard} style={{ padding: '1.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: '1.25rem', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = `rgba(255,255,255,0.1)`;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
               >
                  <div style={{ background: `${cap.color}15`, padding: '14px', borderRadius: '14px', color: cap.color, border: `1px solid ${cap.color}30` }}>
                    <cap.icon size={26} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: '700', marginBottom: '0.4rem', fontFamily: 'Panchang, sans-serif' }}>{cap.title}</h4>
                    <p style={{ color: '#888', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>{cap.desc}</p>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
