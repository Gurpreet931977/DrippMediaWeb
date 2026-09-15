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
  const [pendingTasksDocId, setPendingTasksDocId] = useState(null);
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
      console.error('Failed to complete task in dashboard:', err);
      setCompletingIds(prev => prev.filter(id => id !== task.id));
    }
  };

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    setCurrentDate(date);

    const getPendingTasksTargetItems = (itemList = []) => {
      // 1. Strictly look for the "Pending Tasks" document / folder first
      const exactMatch = itemList.filter(item => {
        const t = (item.title || '').toLowerCase().trim();
        return t === 'pending tasks' || t.startsWith('pending task');
      });
      if (exactMatch.length > 0) return exactMatch;

      // 2. Fallback to any dedicated task documents (strictly excluding client or other folders)
      return itemList.filter(item => {
        const t = (item.title || '').toLowerCase().trim();
        if (t.includes('client') || t.includes('plan') || t.includes('talk') || t.includes('idea') || t.includes('tool')) return false;
        return t.includes('task') || t === 'to-do list' || t === 'todo list' || t === 'to-dos';
      });
    };

    async function loadPendingTasks() {
      try {
        // 1. Fast sync from cache
        const cachedListStr = localStorage.getItem('notion_list');
        if (cachedListStr) {
          try {
            const cachedList = JSON.parse(cachedListStr).items || [];
            const targetItems = getPendingTasksTargetItems(cachedList);
            if (targetItems[0]?.id) {
              setPendingTasksDocId(targetItems[0].id);
            }
            let fastPending = [];
            for (const item of targetItems) {
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
        
        const targetItems = getPendingTasksTargetItems(items);
        if (targetItems[0]?.id) {
          setPendingTasksDocId(targetItems[0].id);
        }
        
        if (targetItems.length === 0) {
          setPendingTasks([]);
          setPendingCount(0);
          return;
        }

        let allPending = [];
        for (const item of targetItems) {
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
        setPendingTasks([...allPending]);
        setPendingCount(allPending.length);
      } catch(err) {
        console.error('Failed to load pending tasks in dashboard:', err);
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
        .dashboard-hero-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 2.25rem;
          margin-bottom: 2.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
        }

        .dashboard-hero-left {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          max-width: 780px;
        }

        .dashboard-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          padding: 4px 12px;
          background: rgba(235, 215, 63, 0.08);
          border: 1px solid rgba(235, 215, 63, 0.22);
          border-radius: 100px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1.2px;
          color: #ebd73f;
          text-transform: uppercase;
        }

        .eyebrow-sparkle {
          font-size: 0.75rem;
          color: #ebd73f;
          animation: pulseGlow 2.5s infinite;
        }

        .dashboard-hero-title {
          font-family: 'Panchang', sans-serif;
          font-size: clamp(1.85rem, 4.5vw, 2.75rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0.3rem 0 0.25rem;
          background: linear-gradient(135deg, #FFFFFF 20%, rgba(255, 255, 255, 0.75) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.15;
        }

        .dashboard-hero-sub {
          font-family: 'Clash Display', sans-serif;
          font-size: clamp(0.92rem, 2vw, 1.08rem);
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
          line-height: 1.5;
        }

        .dashboard-hero-badges {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .telemetry-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 100px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 1px;
          color: #4ade80;
          text-transform: uppercase;
        }

        .telemetry-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .admin-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 16px;
          background: rgba(235, 215, 63, 0.1);
          border: 1px solid rgba(235, 215, 63, 0.35);
          border-radius: 100px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #ebd73f;
          text-transform: uppercase;
          box-shadow: 0 4px 16px rgba(235, 215, 63, 0.12);
        }

        .level-sparkle {
          font-size: 0.75rem;
          color: #ebd73f;
        }

        /* --- STATS GRID --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 2.75rem;
        }

        .stat-glass-tile {
          background: linear-gradient(145deg, rgba(20, 20, 28, 0.7) 0%, rgba(12, 12, 16, 0.88) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.25rem 1.35rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          gap: 1.15rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .stat-glass-tile:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.18);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .stat-glass-tile.interactive-tile {
          border-color: rgba(235, 215, 63, 0.32);
          background: linear-gradient(145deg, rgba(235, 215, 63, 0.08) 0%, rgba(18, 18, 24, 0.88) 100%);
          cursor: pointer;
        }

        .stat-glass-tile.interactive-tile:hover {
          border-color: rgba(235, 215, 63, 0.6);
          background: linear-gradient(145deg, rgba(235, 215, 63, 0.14) 0%, rgba(22, 22, 30, 0.95) 100%);
          box-shadow: 0 16px 40px rgba(235, 215, 63, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .stat-tile-icon-box {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        .stat-tile-icon-box.security {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.28);
          color: #22c55e;
        }

        .stat-tile-icon-box.storage {
          background: rgba(235, 215, 63, 0.12);
          border: 1px solid rgba(235, 215, 63, 0.28);
          color: #ebd73f;
        }

        .stat-tile-icon-box.ai {
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.28);
          color: #38bdf8;
        }

        .stat-tile-icon-box.tasks {
          background: rgba(235, 215, 63, 0.16);
          border: 1px solid rgba(235, 215, 63, 0.42);
          color: #ebd73f;
        }

        .stat-glass-tile:hover .stat-tile-icon-box {
          transform: scale(1.05);
        }

        .stat-tile-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }

        .stat-tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3px;
        }

        .stat-tile-label {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
        }

        .stat-tile-label.highlight {
          color: #ebd73f;
        }

        .tile-arrow-icon {
          font-family: 'Panchang', sans-serif;
          font-size: 0.8rem;
          color: #ebd73f;
          opacity: 0.7;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .stat-glass-tile.interactive-tile:hover .tile-arrow-icon {
          transform: translate(2px, -2px);
          opacity: 1;
        }

        .stat-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .stat-status-dot.security {
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }

        .stat-status-dot.storage {
          background: #ebd73f;
          box-shadow: 0 0 6px #ebd73f;
        }

        .stat-status-dot.ai {
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }

        .stat-tile-value {
          font-family: 'Panchang', sans-serif;
          font-size: 1.22rem;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.3px;
          margin: 0;
          line-height: 1.25;
        }

        .stat-tile-value.highlight {
          color: #FFFFFF;
        }

        .stat-tile-meta {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.45);
          margin-top: 3px;
        }

        .stat-tile-meta.highlight {
          color: rgba(235, 215, 63, 0.8);
        }

        /* --- PENDING TASKS HUB --- */
        .tasks-hub-card {
          margin-bottom: 3.5rem;
          padding: 2rem 2.25rem;
          background: linear-gradient(180deg, rgba(18, 18, 24, 0.88) 0%, rgba(10, 10, 14, 0.98) 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 22px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
        }

        .tasks-hub-glow {
          position: absolute;
          top: -80px;
          left: -80px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(235, 215, 63, 0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .tasks-hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          flex-wrap: wrap;
          gap: 14px;
          position: relative;
          z-index: 1;
        }

        .tasks-hub-title-block {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .tasks-status-capsule {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(235, 215, 63, 0.12);
          border: 1px solid rgba(235, 215, 63, 0.4);
          border-radius: 30px;
          color: #ebd73f;
          font-size: 0.74rem;
          font-weight: 800;
          font-family: 'Panchang', sans-serif;
          letter-spacing: 1px;
        }

        .tasks-live-ping {
          position: relative;
          display: flex;
          height: 7px;
          width: 7px;
        }

        .tasks-ping-ring {
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          position: absolute;
          display: inline-flex;
          height: 100%;
          width: 100%;
          border-radius: 50%;
          background: #ebd73f;
          opacity: 0.75;
        }

        .tasks-ping-core {
          position: relative;
          display: inline-flex;
          border-radius: 50%;
          height: 7px;
          width: 7px;
          background: #ebd73f;
          box-shadow: 0 0 8px #ebd73f;
        }

        .tasks-hub-heading {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: #FFFFFF;
          font-family: 'Panchang', sans-serif;
          letter-spacing: -0.2px;
        }

        .tasks-workspace-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #ebd73f;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          font-family: 'Clash Display', sans-serif;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .tasks-workspace-btn:hover {
          background: rgba(235, 215, 63, 0.12);
          border-color: rgba(235, 215, 63, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(235, 215, 63, 0.15);
        }

        .workspace-chevron {
          transition: transform 0.2s ease;
        }

        .tasks-workspace-btn:hover .workspace-chevron {
          transform: translateX(3px);
        }

        .tasks-empty-state {
          padding: 2.5rem 1rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .empty-sparkle {
          font-size: 1.8rem;
          color: #ebd73f;
          margin-bottom: 8px;
        }

        .empty-title {
          margin: 0 0 4px 0;
          color: #FFFFFF;
          font-size: 1.05rem;
          font-family: 'Panchang', sans-serif;
          font-weight: 700;
        }

        .empty-desc {
          margin: 0;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          font-family: 'Clash Display', sans-serif;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
          position: relative;
          z-index: 1;
        }

        .task-card-modern {
          padding: 1.35rem 1.4rem;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          position: relative;
        }

        .task-card-modern:hover {
          background: rgba(255, 255, 255, 0.045);
          border-color: rgba(235, 215, 63, 0.35);
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45), 0 0 20px rgba(235, 215, 63, 0.06);
        }

        .task-card-modern.completing {
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.4);
          transform: scale(0.98);
          opacity: 0.7;
        }

        .task-card-main {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .task-checkbox-btn {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 2px solid rgba(235, 215, 63, 0.6);
          background: rgba(235, 215, 63, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          padding: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }

        .task-checkbox-btn:hover {
          border-color: #ebd73f;
          background: rgba(235, 215, 63, 0.2);
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(235, 215, 63, 0.35);
        }

        .task-checkbox-btn.checked {
          background: #22c55e;
          border-color: #22c55e;
        }

        .checkbox-inner-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ebd73f;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .task-checkbox-btn:hover .checkbox-inner-dot {
          opacity: 0.8;
        }

        .task-text-content {
          margin: 0;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.94rem;
          font-weight: 600;
          line-height: 1.55;
          color: #FFFFFF;
          transition: all 0.25s ease;
        }

        .task-text-content.strikethrough {
          color: rgba(255, 255, 255, 0.35);
          text-decoration: line-through;
        }

        .task-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          gap: 8px;
        }

        .task-doc-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.6);
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-icon {
          font-size: 0.75rem;
        }

        .doc-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .task-jump-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #ebd73f;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-decoration: none;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .task-jump-link:hover {
          color: #fff;
          transform: translateX(2px);
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

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .dashboard-hero-wrap {
            flex-direction: column;
            align-items: flex-start;
            gap: 1.25rem;
          }
          .tasks-hub-card {
            padding: 1.5rem;
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

        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .tasks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Hero Header */}
      <div className="dashboard-hero-wrap">
        <div className="dashboard-hero-left">
          <div className="dashboard-eyebrow">
            <span className="eyebrow-sparkle">✦</span>
            <span>{isGenz ? 'DRIPP STUDIO OS · COMMAND SUITE' : 'DRIPP STUDIO OS · CENTRAL COMMAND'}</span>
          </div>
          <h1 className="dashboard-hero-title">
            {isGenz ? 'main character energy' : 'Dashboard Overview'}
          </h1>
          <p className="dashboard-hero-sub">
            {isGenz 
              ? `welcome back, boss. today is ${currentDate}.` 
              : `Welcome to the Admin Hub. Today is ${currentDate}.`}
          </p>
        </div>

        <div className="dashboard-hero-badges">
          <div className="telemetry-pill">
            <span className="telemetry-dot" />
            <span>LIVE SYNC</span>
          </div>
          <div className="admin-level-badge">
            <span className="level-sparkle">✦</span>
            <span>{isGenz ? 'VIBE: PEAK' : 'ADMIN: SUPER'}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-grid">
        {/* Security Tile */}
        <div className="stat-glass-tile">
          <div className="stat-tile-icon-box security">
            <ShieldCheck size={22} color="#22c55e" strokeWidth={2.2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">SECURITY</span>
              <span className="stat-status-dot security" title="256-Bit Encrypted" />
            </div>
            <p className="stat-tile-value">Secured</p>
            <span className="stat-tile-meta">Encrypted &amp; Active</span>
          </div>
        </div>

        {/* Storage Tile */}
        <div className="stat-glass-tile">
          <div className="stat-tile-icon-box storage">
            <HardDrive size={22} color="#ebd73f" strokeWidth={2.2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">STORAGE</span>
              <span className="stat-status-dot storage" title="Cloud Synced" />
            </div>
            <p className="stat-tile-value">Active</p>
            <span className="stat-tile-meta">S3 &amp; Supabase Linked</span>
          </div>
        </div>

        {/* Orlo AI Tile */}
        <div className="stat-glass-tile">
          <div className="stat-tile-icon-box ai">
            <Activity size={22} color="#38bdf8" strokeWidth={2.2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">ORLO AI</span>
              <span className="stat-status-dot ai" title="Model Online" />
            </div>
            <p className="stat-tile-value">Online</p>
            <span className="stat-tile-meta">v2.4 Inference Ready</span>
          </div>
        </div>

        {/* Pending Tasks Tile (Interactive) */}
        <Link 
          href={pendingTasksDocId ? `/dripp-studio/notes-and-planning?docId=${pendingTasksDocId}` : '/dripp-studio/notes-and-planning'} 
          className="stat-glass-tile interactive-tile"
        >
          <div className="stat-tile-icon-box tasks">
            <CheckSquare size={22} color="#ebd73f" strokeWidth={2.2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label highlight">ACTION QUEUE</span>
              <span className="tile-arrow-icon">↗</span>
            </div>
            <p className="stat-tile-value highlight">
              {pendingCount === null ? 'Syncing...' : `${pendingCount} Tasks`}
            </p>
            <span className="stat-tile-meta highlight">Review in Workspace</span>
          </div>
        </Link>
      </div>

      {/* Pending Tasks Interactive Section */}
      <div className="tasks-hub-card">
        {/* Subtle Ambient Glow */}
        <div className="tasks-hub-glow" />

        {/* Section Header */}
        <div className="tasks-hub-header">
          <div className="tasks-hub-title-block">
            <div className="tasks-status-capsule">
              <span className="tasks-live-ping">
                <span className="tasks-ping-ring" />
                <span className="tasks-ping-core" />
              </span>
              <span>{pendingCount === null ? 'SYNCING' : `${pendingCount} PENDING`}</span>
            </div>
            <h2 className="tasks-hub-heading">
              {isGenz ? 'Action Items To Crush' : 'Pending Tasks'}
            </h2>
          </div>

          <Link 
            href={pendingTasksDocId ? `/dripp-studio/notes-and-planning?docId=${pendingTasksDocId}` : '/dripp-studio/notes-and-planning'} 
            className="tasks-workspace-btn"
          >
            <span>Open in Workspace</span>
            <ChevronRight size={14} className="workspace-chevron" />
          </Link>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="tasks-empty-state">
            <div className="empty-sparkle">✦</div>
            <h4 className="empty-title">All Caught Up!</h4>
            <p className="empty-desc">No pending to-do items found across your studio documents.</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {pendingTasks.map((task) => {
              const isDone = completingIds.includes(task.id);
              return (
                <div 
                  key={task.id} 
                  className={`task-card-modern ${isDone ? 'completing' : ''}`}
                >
                  <div className="task-card-main">
                    <button
                      type="button"
                      onClick={(e) => handleToggleTask(e, task)}
                      className={`task-checkbox-btn ${isDone ? 'checked' : ''}`}
                      title={isDone ? 'Completed' : 'Mark as completed'}
                    >
                      {isDone ? (
                        <Check size={13} color="#000" strokeWidth={3} />
                      ) : (
                        <span className="checkbox-inner-dot" />
                      )}
                    </button>
                    
                    <p className={`task-text-content ${isDone ? 'strikethrough' : ''}`}>
                      {task.text}
                    </p>
                  </div>

                  <div className="task-card-footer">
                    <span className="task-doc-pill" title={`Source: ${task.docTitle}`}>
                      <span className="doc-icon">📄</span>
                      <span className="doc-name">{task.docTitle}</span>
                    </span>

                    <Link 
                      href={`/dripp-studio/notes-and-planning?docId=${task.docId}&blockId=${task.id}`}
                      className="task-jump-link"
                    >
                      <span>Jump to Doc</span>
                      <ChevronRight size={12} />
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
