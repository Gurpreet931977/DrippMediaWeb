'use client';

import Link from 'next/link';
import { FileText, PackagePlus, ShieldCheck, Video, Mail, Settings, Activity, HardDrive, Database, AlertTriangle, CheckSquare, Check, ChevronRight } from 'lucide-react';
import CreativeSpark from './components/CreativeSpark';
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
      color: '#ebd73f'
    },
    {
      id: 'invoice',
      title: isGenz ? 'get paid' : 'Quick Invoice',
      desc: isGenz ? 'generate a professional invoice in seconds. drop the pdf and secure the bag.' : 'Generate a professional, branded invoice in seconds. Seamlessly export to PDF.',
      icon: FileText,
      link: '/dripp-studio/invoice',
      btnText: isGenz ? 'drop invoice' : 'Create Invoice',
      color: '#ebd73f'
    },
    {
      id: 'package',
      title: isGenz ? "masterplans" : 'PMP Maker',
      desc: isGenz ? 'build masterplans and package generation. big moves only.' : 'Generate comprehensive masterplans and package offerings for clients.',
      icon: CreativeSpark,
      link: '/dripp-studio/package',
      btnText: isGenz ? 'build pmp' : 'Open PMP Maker',
      color: '#ebd73f'
    },
    {
      id: 'email',
      title: isGenz ? 'email blasts' : 'Email Campaigns',
      desc: isGenz ? 'blast out the newsletters. let them know what\'s good.' : 'Administer marketing campaigns and send mass emails to your clients.',
      icon: Mail,
      link: '/dripp-studio/email',
      btnText: isGenz ? 'send blast' : 'Open Campaigns',
      color: '#ebd73f'
    },
    {
      id: 'system',
      title: isGenz ? 'the engine' : 'System Settings',
      desc: isGenz ? 'configure the vibes. toggle genz mode and check storage.' : 'Configure local storage, DB settings, security, and application modes.',
      icon: Settings,
      link: '/dripp-studio/system',
      btnText: isGenz ? 'pop hood' : 'System Hub',
      color: '#ebd73f'
    },
    {
      id: 'notion',
      title: isGenz ? 'brain dump' : 'Document Hub',
      desc: isGenz ? 'syncs with your workspace. edit blocks, drop presets, stay organized.' : 'Direct integration with your workspace. View, edit, and manage documents natively.',
      icon: Database,
      link: '/dripp-studio/notes-and-planning',
      btnText: isGenz ? 'enter hub' : 'Open Hub',
      color: '#ebd73f'
    },
    {
      id: 'errors',
      title: isGenz ? 'the fixer' : 'Error Logs',
      desc: isGenz ? 'see what\'s broken and fix it before anyone notices.' : 'Monitor application health, track system errors, and view detailed logs.',
      icon: AlertTriangle,
      link: '/dripp-studio/errors',
      btnText: isGenz ? 'check logs' : 'View Errors',
      color: '#ebd73f'
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <style>{`
        /* --- DASHBOARD HERO --- */
        .dashboard-hero-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 2rem;
          margin-bottom: 2.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
          padding: 5px 12px;
          background: rgba(235, 215, 63, 0.05);
          border: 1px solid rgba(235, 215, 63, 0.2);
          border-radius: 6px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: #ebd73f;
          text-transform: uppercase;
        }

        .eyebrow-sparkle {
          font-size: 0.65rem;
          color: #ebd73f;
        }

        .dashboard-hero-title {
          font-family: 'Panchang', sans-serif;
          font-size: clamp(1.6rem, 2.8vw, 2.25rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0.5rem 0 0.35rem;
          color: #FFFFFF;
          line-height: 1.2;
        }

        .dashboard-hero-sub {
          font-family: 'Clash Display', sans-serif;
          font-size: clamp(0.88rem, 1.4vw, 0.98rem);
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          line-height: 1.5;
          font-weight: 400;
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
          padding: 6px 14px;
          background: rgba(235, 215, 63, 0.05);
          border: 1px solid rgba(235, 215, 63, 0.2);
          border-radius: 6px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: #ebd73f;
          text-transform: uppercase;
        }

        .telemetry-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ebd73f;
          box-shadow: 0 0 8px rgba(235, 215, 63, 0.6);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .admin-level-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 1.2px;
          color: rgba(255, 255, 255, 0.75);
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .admin-level-badge:hover {
          border-color: rgba(235, 215, 63, 0.3);
          color: #ebd73f;
        }

        .level-sparkle {
          font-size: 0.65rem;
          color: #ebd73f;
        }

        /* --- STATS GRID --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2.5rem;
        }

        .stat-glass-tile {
          background: #08080a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.15rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
          position: relative;
          overflow: hidden;
        }

        .stat-glass-tile:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(235, 215, 63, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .stat-glass-tile.interactive-tile {
          border-color: rgba(235, 215, 63, 0.18);
          background: rgba(235, 215, 63, 0.02);
          cursor: pointer;
        }

        .stat-glass-tile.interactive-tile:hover {
          border-color: rgba(235, 215, 63, 0.45);
          background: rgba(235, 215, 63, 0.05);
          box-shadow: 0 8px 24px rgba(235, 215, 63, 0.12);
        }

        .stat-tile-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: rgba(235, 215, 63, 0.06);
          border: 1px solid rgba(235, 215, 63, 0.18);
          color: #ebd73f;
          transition: all 0.25s ease;
        }

        .stat-glass-tile:hover .stat-tile-icon-box {
          background: rgba(235, 215, 63, 0.1);
          border-color: rgba(235, 215, 63, 0.35);
          transform: scale(1.04);
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
          margin-bottom: 2px;
        }

        .stat-tile-label {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.66rem;
          font-weight: 600;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
        }

        .stat-tile-label.highlight {
          color: #ebd73f;
        }

        .tile-arrow-icon {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #ebd73f;
          opacity: 0.75;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .stat-glass-tile.interactive-tile:hover .tile-arrow-icon {
          transform: translate(2px, -2px);
          opacity: 1;
        }

        .stat-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ebd73f;
          box-shadow: 0 0 6px rgba(235, 215, 63, 0.6);
        }

        .stat-tile-value {
          font-family: 'Clash Display', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #FFFFFF;
          letter-spacing: -0.2px;
          margin: 2px 0;
          line-height: 1.25;
        }

        .stat-tile-value.highlight {
          color: #FFFFFF;
        }

        .stat-tile-meta {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 2px;
        }

        .stat-tile-meta.highlight {
          color: rgba(235, 215, 63, 0.85);
        }

        /* --- PENDING TASKS HUB --- */
        .tasks-hub-card {
          margin-bottom: 3.5rem;
          padding: 1.5rem 1.75rem;
          background: #08080a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .tasks-hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .tasks-hub-title-block {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tasks-status-capsule {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px;
          background: rgba(235, 215, 63, 0.06);
          border: 1px solid rgba(235, 215, 63, 0.22);
          border-radius: 6px;
          color: #ebd73f;
          font-size: 0.68rem;
          font-weight: 600;
          font-family: 'Clash Display', sans-serif;
          letter-spacing: 1px;
        }

        .tasks-live-ping {
          position: relative;
          display: flex;
          height: 6px;
          width: 6px;
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
          height: 6px;
          width: 6px;
          background: #ebd73f;
          box-shadow: 0 0 6px #ebd73f;
        }

        .tasks-hub-heading {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #FFFFFF;
          font-family: 'Panchang', sans-serif;
          letter-spacing: -0.2px;
        }

        .tasks-workspace-btn,
        a.tasks-workspace-btn,
        a.tasks-workspace-btn:link,
        a.tasks-workspace-btn:visited,
        a.tasks-workspace-btn:active {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(235, 215, 63, 0.05);
          border: 1px solid rgba(235, 215, 63, 0.25);
          border-radius: 6px;
          color: #ebd73f !important;
          font-size: 0.76rem;
          font-weight: 600;
          text-decoration: none !important;
          font-family: 'Clash Display', sans-serif !important;
          transition: all 0.2s ease;
        }

        .tasks-workspace-btn:hover,
        a.tasks-workspace-btn:hover {
          background: rgba(235, 215, 63, 0.12) !important;
          border-color: rgba(235, 215, 63, 0.45) !important;
          color: #ffffff !important;
        }

        .workspace-chevron {
          transition: transform 0.2s ease;
          color: #ebd73f;
        }

        .tasks-workspace-btn:hover .workspace-chevron,
        a.tasks-workspace-btn:hover .workspace-chevron {
          transform: translateX(3px);
          color: #ffffff !important;
        }

        .tasks-empty-state {
          padding: 2.5rem 1rem;
          text-align: center;
          background: rgba(255, 255, 255, 0.015);
          border-radius: 8px;
          border: 1px dashed rgba(255, 255, 255, 0.08);
        }

        .empty-sparkle {
          font-size: 1.5rem;
          color: #ebd73f;
          margin-bottom: 8px;
        }

        .empty-title {
          margin: 0 0 4px 0;
          color: #FFFFFF;
          font-size: 1rem;
          font-family: 'Panchang', sans-serif;
          font-weight: 700;
        }

        .empty-desc {
          margin: 0;
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.82rem;
          font-family: 'Clash Display', sans-serif;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .task-card-modern {
          padding: 1.05rem 1.15rem;
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .task-card-modern:hover {
          background: rgba(255, 255, 255, 0.025);
          border-color: rgba(235, 215, 63, 0.25);
          transform: translateY(-1px);
        }

        .task-card-modern.completing {
          background: rgba(235, 215, 63, 0.04);
          border-color: rgba(235, 215, 63, 0.25);
          transform: scale(0.99);
          opacity: 0.5;
        }

        .task-card-main {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .task-checkbox-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid rgba(235, 215, 63, 0.4);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
          padding: 0;
          transition: all 0.15s ease;
          outline: none;
        }

        .task-checkbox-btn:hover {
          border-color: #ebd73f;
          background: rgba(235, 215, 63, 0.12);
        }

        .task-checkbox-btn.checked {
          background: #ebd73f;
          border-color: #ebd73f;
          color: #050505;
        }

        .checkbox-inner-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ebd73f;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .task-checkbox-btn:hover .checkbox-inner-dot {
          opacity: 0.8;
        }

        .task-text-content {
          margin: 0;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          line-height: 1.5;
          color: #FFFFFF;
          transition: all 0.2s ease;
        }

        .task-text-content.strikethrough {
          color: rgba(255, 255, 255, 0.3);
          text-decoration: line-through;
        }

        .task-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          gap: 8px;
        }

        .task-doc-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.4);
          max-width: 170px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .doc-icon {
          font-size: 0.72rem;
        }

        .doc-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .task-jump-link,
        a.task-jump-link,
        a.task-jump-link:link,
        a.task-jump-link:visited,
        a.task-jump-link:active {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          color: #ebd73f !important;
          font-family: 'Clash Display', sans-serif !important;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-decoration: none !important;
          opacity: 0.85;
          transition: opacity 0.2s, transform 0.2s, color 0.2s;
        }

        .task-jump-link:hover,
        a.task-jump-link:hover {
          opacity: 1;
          color: #ffffff !important;
          transform: translateX(2px);
        }

        /* --- CORE TOOLS --- */
        .core-tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.15rem;
        }

        .tool-card {
          background: #08080a;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 1.6rem;
          display: flex;
          flex-direction: column;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .tool-card:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(235, 215, 63, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
        }

        .tool-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          background: rgba(235, 215, 63, 0.06);
          border: 1px solid rgba(235, 215, 63, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          color: #ebd73f;
          transition: all 0.2s ease;
        }

        .tool-card:hover .tool-icon-box {
          background: rgba(235, 215, 63, 0.12);
          border-color: rgba(235, 215, 63, 0.35);
          transform: scale(1.04);
        }

        .tool-card-title {
          font-family: 'Panchang', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.2px;
          margin: 0 0 0.5rem 0;
        }

        .tool-card-desc {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
          flex: 1;
        }

        .tool-card-btn,
        a.tool-card-btn,
        a.tool-card-btn:link,
        a.tool-card-btn:visited,
        a.tool-card-btn:active {
          display: block;
          width: 100%;
          text-align: center;
          padding: 0.7rem 1rem;
          border-radius: 8px;
          font-family: 'Clash Display', sans-serif !important;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-decoration: none !important;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85) !important;
          transition: all 0.2s ease;
        }

        .tool-card-btn:hover,
        a.tool-card-btn:hover {
          background: #ebd73f !important;
          border-color: #ebd73f !important;
          color: #050505 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(235, 215, 63, 0.25);
        }

        /* --- CAPABILITIES --- */
        .capabilities-card {
          margin-top: 3.5rem;
          padding: 2.25rem 2.5rem;
          background: #08080a;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          overflow: hidden;
        }

        .capabilities-glow {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(235, 215, 63, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }

        .capabilities-title {
          font-size: 1.25rem;
          font-weight: 700;
          font-family: 'Panchang', sans-serif;
          margin: 0 0 0.6rem 0;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: -0.2px;
        }

        .capabilities-desc {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.65;
          max-width: 700px;
          margin: 0 0 2rem 0;
        }

        .capabilities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }

        .cap-item {
          padding: 1.15rem;
          background: rgba(255, 255, 255, 0.015);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          transition: all 0.2s ease;
        }

        .cap-item:hover {
          background: rgba(255, 255, 255, 0.025);
          border-color: rgba(235, 215, 63, 0.3);
          transform: translateY(-2px);
        }

        .cap-icon-box {
          background: rgba(235, 215, 63, 0.06);
          border: 1px solid rgba(235, 215, 63, 0.18);
          padding: 10px;
          border-radius: 8px;
          color: #ebd73f;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cap-title {
          color: #FFFFFF;
          font-size: 0.92rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
          font-family: 'Panchang', sans-serif;
          letter-spacing: -0.2px;
        }

        .cap-desc {
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.8rem;
          margin: 0;
          line-height: 1.45;
          font-family: 'Clash Display', sans-serif;
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
            padding: 1.25rem;
          }
          .core-tools-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .capabilities-card {
            margin-top: 2rem;
            padding: 1.5rem !important;
            border-radius: 12px;
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
          <div className="stat-tile-icon-box">
            <ShieldCheck size={20} color="#ebd73f" strokeWidth={2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">SECURITY</span>
              <span className="stat-status-dot" title="256-Bit Encrypted & Active" />
            </div>
            <p className="stat-tile-value">Secured</p>
            <span className="stat-tile-meta">Encrypted &amp; Active</span>
          </div>
        </div>

        {/* Storage Tile */}
        <div className="stat-glass-tile">
          <div className="stat-tile-icon-box">
            <HardDrive size={20} color="#ebd73f" strokeWidth={2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">STORAGE</span>
              <span className="stat-status-dot" title="Cloud Synced" />
            </div>
            <p className="stat-tile-value">Active</p>
            <span className="stat-tile-meta">S3 &amp; Supabase Linked</span>
          </div>
        </div>

        {/* Orlo AI Tile */}
        <div className="stat-glass-tile">
          <div className="stat-tile-icon-box">
            <Activity size={20} color="#ebd73f" strokeWidth={2} />
          </div>
          <div className="stat-tile-content">
            <div className="stat-tile-top">
              <span className="stat-tile-label">ORLO AI</span>
              <span className="stat-status-dot" title="Model Online" />
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
          <div className="stat-tile-icon-box">
            <CheckSquare size={20} color="#ebd73f" strokeWidth={2} />
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
            style={{
              color: '#ebd73f',
              textDecoration: 'none',
              fontFamily: "'Clash Display', sans-serif"
            }}
          >
            <span style={{ color: 'inherit', fontFamily: "'Clash Display', sans-serif" }}>Open in Workspace</span>
            <ChevronRight size={14} className="workspace-chevron" color="#ebd73f" />
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
                        <Check size={11} color="#050505" strokeWidth={3} />
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
                      style={{
                        color: '#ebd73f',
                        textDecoration: 'none',
                        fontFamily: "'Clash Display', sans-serif"
                      }}
                    >
                      <span style={{ color: 'inherit', fontFamily: "'Clash Display', sans-serif" }}>Jump to Doc</span>
                      <ChevronRight size={12} color="#ebd73f" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }}></div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#fff', fontFamily: "'Panchang', sans-serif" }}>
          {isGenz ? 'the toolkit' : 'Core Tools'}
        </h2>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.06)' }}></div>
      </div>

      {/* Main Grid */}
      <div className="core-tools-grid">
        {featureCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="tool-card">
              <div className="tool-icon-box">
                <Icon size={22} color="#ebd73f" strokeWidth={2} />
              </div>
              <h3 className="tool-card-title">
                {card.title}
              </h3>
              <p className="tool-card-desc">
                {card.desc}
              </p>
              <Link href={card.link} className="tool-card-btn">
                {card.btnText}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Admin Panel Capabilities Section */}
      <div className="capabilities-card">
        <div className="capabilities-glow" />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="capabilities-title">
            {isGenz ? 'the command center' : 'System Capabilities'}
          </h2>
          <p className="capabilities-desc">
            {isGenz ? "this isn't just a dashboard, it's the whole operating system. From dropping invoices to blasting emails, managing the portfolio, and cooking up quotes with AI. Everything you need to run the empire is right here." 
              : 'The Admin Panel is a centralized hub designed to streamline operations. It provides powerful tools for content management, financial operations, marketing campaigns, and system administration, all seamlessly integrated into one unified interface.'}
          </p>
          
          <div className="capabilities-grid">
            {[
              { title: 'Operations', desc: 'Invoices, Quotes & Packages', icon: FileText },
              { title: 'Marketing', desc: 'Email Campaigns & Audience', icon: Mail },
              { title: 'Content', desc: 'Portfolio & Document Integration', icon: Video },
              { title: 'System', desc: 'Error Logs & Settings', icon: Settings }
            ].map((cap, i) => (
              <div key={i} className="cap-item">
                <div className="cap-icon-box">
                  <cap.icon size={20} strokeWidth={2} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="cap-title">{cap.title}</h4>
                  <p className="cap-desc">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
