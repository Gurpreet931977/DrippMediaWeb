'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, 
  FileText, Database, CheckSquare, Sparkles, Info, LayoutList, Plus, Maximize2, Minimize2, Star,
  List, ListOrdered, Type, Heading1, Heading2, Heading3, Quote, Code, ToggleLeft,
  Home, Command, Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';

export default function NotionHubPage() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('favorites'); // 'favorites', 'all', 'page', 'database'
  const [favorites, setFavorites] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Scroll progress for the viewer
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);

  // Zenith Mode State
  const [isZenithMode, setIsZenithMode] = useState(false);

  // Floating Toolbar Ref (Used instead of state to prevent selection loss on re-render)
  const toolbarRef = useRef(null);

  // Subpage Creation State
  const [showSubpageInput, setShowSubpageInput] = useState(false);
  const [subpageTitle, setSubpageTitle] = useState('');
  const [isCreatingSubpage, setIsCreatingSubpage] = useState(false);

  // New Root Page State
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [isCreatingNewPage, setIsCreatingNewPage] = useState(false);

  // Block Insertion State
  const [isAppendingBlock, setIsAppendingBlock] = useState(false);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);

  // Fetch shared Notion items
  const fetchNotionItems = useCallback(async (query = '') => {
    const isSearch = query.trim() !== '';
    const cacheKey = isSearch ? `notion_search_${query.trim()}` : 'notion_list';
    
    // 1. Optimistic Cache Load
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setItems(parsed.items || []);
        if (parsed.items && parsed.items.length > 0 && !selectedItem && !isSearch) {
          setSelectedItem(parsed.items[0]);
        }
        // Don't set loading true if we have cache, just fetch quietly
      } catch(e) {}
    } else {
      setLoading(true);
    }
    
    setError('');
    try {
      const url = isSearch
        ? `/api/admin/notion?action=search&query=${encodeURIComponent(query.trim())}`
        : `/api/admin/notion?action=list`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Notion documents');
      }

      // 2. Update state and cache with fresh data
      setItems(data.items || []);
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      if (data.items && data.items.length > 0 && !selectedItem && !isSearch) {
        setSelectedItem(data.items[0]);
      }
    } catch (err) {
      if (!cachedData) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedItem]);

  // Fetch content blocks for selected page
  const fetchPageContent = useCallback(async (pageId) => {
    if (!pageId) return;
    setScrollProgress(0);
    
    const cacheKey = `notion_page_${pageId}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        setDocContent(JSON.parse(cachedData));
      } catch(e) {}
    } else {
      setContentLoading(true);
      setDocContent(null);
    }

    try {
      const res = await fetch(`/api/admin/notion?action=blocks&pageId=${pageId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setDocContent(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } else {
        if (!cachedData) setDocContent(null);
      }
    } catch (err) {
      console.error('Fetch Page Content Error:', err);
      if (!cachedData) setDocContent(null);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotionItems();
    
    // Load favorites from local storage
    const savedFavs = localStorage.getItem('notion_favorites');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch(e) {}
    }
  }, []);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('notion_favorites', JSON.stringify(newFavs));
  };

  useEffect(() => {
    if (selectedItem?.id) {
      fetchPageContent(selectedItem.id);
    }
  }, [selectedItem, fetchPageContent]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isZenithMode) {
        setIsZenithMode(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenithMode]);

  const handleApplyPreset = (e) => {
    const presetName = e.target.value;
    const text = window.getSelection().toString().trim();
    if (presetName && text) {
      applyDesignerPreset(presetName);
      if (toolbarRef.current) {
        toolbarRef.current.style.opacity = '0';
        toolbarRef.current.style.pointerEvents = 'none';
      }
    }
  };

  const handleAppendBlock = async (type) => {
    if (!selectedItem?.id) return;
    setIsAppendingBlock(true);
    setShowAddBlockMenu(false);
    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: selectedItem.id, type })
      });
      if (res.ok) {
        await fetchPageContent(selectedItem.id);
        if (contentRef.current) {
           setTimeout(() => {
             contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
           }, 300);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAppendingBlock(false);
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (toolbarRef.current) {
          toolbarRef.current.style.opacity = '0';
          toolbarRef.current.style.pointerEvents = 'none';
        }
        return;
      }
      
      const text = selection.toString().trim();
      if (!text) {
        if (toolbarRef.current) {
          toolbarRef.current.style.opacity = '0';
          toolbarRef.current.style.pointerEvents = 'none';
        }
        return;
      }

      if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        let blockId = '';
        let blockType = '';
        const blockElement = selection.anchorNode?.parentElement?.closest('[id^="block-"]');
        if (blockElement) {
          blockId = blockElement.id.replace('block-', '');
          blockType = blockElement.getAttribute('data-block-type') || '';
        }

        if (toolbarRef.current) {
          let top = rect.top - 55;
          let left = rect.left + rect.width / 2;
          
          if (top < 10) top = rect.bottom + 10;
          
          const toolbarWidth = toolbarRef.current.offsetWidth || 350;
          const halfWidth = toolbarWidth / 2;
          
          if (left - halfWidth < 10) {
            left = halfWidth + 10;
          } else if (left + halfWidth > window.innerWidth - 10) {
            left = window.innerWidth - halfWidth - 10;
          }
          
          toolbarRef.current.style.top = `${top}px`;
          toolbarRef.current.style.left = `${left}px`;
          toolbarRef.current.style.opacity = '1';
          toolbarRef.current.style.pointerEvents = 'auto';
          toolbarRef.current.dataset.blockId = blockId;
          toolbarRef.current.dataset.blockType = blockType;
        }
      } else {
        if (toolbarRef.current) {
          toolbarRef.current.style.opacity = '0';
          toolbarRef.current.style.pointerEvents = 'none';
        }
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotionItems(searchQuery);
  };

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const windowHeight = scrollHeight - clientHeight;
    const progress = windowHeight > 0 ? (scrollTop / windowHeight) * 100 : 0;
    setScrollProgress(progress);
  };

  // Extract Table of Contents
  const tocItems = docContent?.blocks?.filter(b => b.type.startsWith('heading_'))?.map((block, i) => {
    const text = block[block.type]?.rich_text?.map(t => t.plain_text).join('') || 'Untitled';
    return { id: block.id, type: block.type, text, index: i };
  }) || [];

  // Filter Items
  const filteredItems = items.filter(item => {
    if (filterType === 'favorites') {
      return favorites.includes(item.id);
    }
    
    if (filterType === 'all') {
      // Hide subpages: if the item's parent is also in the items list, it's a subpage.
      const parentId = item.parent?.page_id || item.parent?.database_id;
      // If the parent is a page/database that we fetched, it's a subpage.
      if (parentId && typeof parentId === 'string' && items.some(i => i && typeof i.id === 'string' && i.id.replace(/-/g, '') === parentId.replace(/-/g, ''))) {
        return false;
      }
      return true;
    }
    
    return item.object === filterType;
  });

  const getBreadcrumbs = (item) => {
    if (!item) return [];
    const crumbs = [];
    let current = item;
    const visited = new Set();
    
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      crumbs.unshift(current);
      
      const parentId = current.parent?.page_id || current.parent?.database_id;
      if (parentId && typeof parentId === 'string') {
        const parentIdClean = parentId.replace(/-/g, '');
        current = items.find(i => i && typeof i.id === 'string' && i.id.replace(/-/g, '') === parentIdClean);
      } else {
        current = null;
      }
    }
    return crumbs;
  };

  return (
    <div style={{ 
      fontFamily: "'Clash Display', 'Panchang', sans-serif", 
      color: '#fff', 
      minHeight: '100vh', 
      background: '#030305',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        .notion-font {
          font-family: 'Clash Display', 'Panchang', sans-serif !important;
        }
        
        /* Custom Scrollbars */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(235, 215, 63, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(235, 215, 63, 0.5); }

        .notion-glass-card {
          background: rgba(12, 12, 16, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
        }
        
        .notion-item-btn {
          width: 100%;
          text-align: left;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          display: flex;
          alignItems: center;
          gap: 14px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
        }
        .notion-item-active {
          background: rgba(235, 215, 63, 0.08) !important;
          border-color: rgba(235, 215, 63, 0.2) !important;
          box-shadow: 0 8px 24px rgba(235, 215, 63, 0.05);
        }
        .notion-item-btn:hover:not(.notion-item-active) {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .filter-chip {
          padding: 6px 14px;
          border-radius: 30px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: #888;
        }
        .filter-chip.active {
          background: rgba(235, 215, 63, 0.15);
          border-color: rgba(235, 215, 63, 0.4);
          color: #ebd73f;
        }
        .filter-chip:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .block-enter {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .toc-link {
          display: block;
          padding: 6px 12px;
          color: #666;
          text-decoration: none;
          font-size: 0.8rem;
          border-left: 2px solid transparent;
          transition: all 0.2s;
          cursor: pointer;
        }
        .toc-link:hover {
          color: #ebd73f;
          border-left-color: #ebd73f;
          background: rgba(235, 215, 63, 0.05);
        }
        
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* 10X Designer Presets */
        .preset-cyber-glitch {
          color: #ff4d4f;
          font-weight: bold;
          position: relative;
          display: inline-block;
          transition: all 0.2s;
        }
        .preset-cyber-glitch:hover {
          animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
          text-shadow: 2px 0 #0ff, -2px 0 #f0f;
          background: rgba(255, 77, 79, 0.1);
        }
        @keyframes glitch {
          0% { transform: translate(0) }
          20% { transform: translate(-2px, 2px) }
          40% { transform: translate(-2px, -2px) }
          60% { transform: translate(2px, 2px) }
          80% { transform: translate(2px, -2px) }
          100% { transform: translate(0) }
        }

        .preset-liquid-gradient {
          font-weight: bold;
          color: #fff;
          background: linear-gradient(270deg, #8a2be2, #4b0082, #9400d3, #8a2be2);
          background-size: 400% 400%;
          animation: liquid 4s ease infinite;
          padding: 2px 6px;
          border-radius: 6px;
          box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);
        }
        @keyframes liquid {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }

        .preset-gold-shimmer {
          color: #ebd73f;
          font-weight: bold;
          background: linear-gradient(90deg, rgba(235,215,63,0) 0%, rgba(235,215,63,0.3) 50%, rgba(235,215,63,0) 100%);
          background-size: 200% auto;
          animation: goldShimmer 2s linear infinite;
          padding: 2px 6px;
          border-radius: 6px;
        }
        @keyframes goldShimmer {
          to { background-position: 200% center; }
        }

        .preset-redacted {
          background: #222;
          color: transparent;
          user-select: none;
          transition: all 0.3s ease;
          border-radius: 4px;
        }
        .preset-redacted:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          user-select: auto;
        }
      `}</style>

      {/* Top Header */}
      <header style={{
        padding: '16px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'rgba(5, 5, 8, 0.7)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Dynamic Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setSelectedItem(null)}
            className="notion-font"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: selectedItem ? '#888' : '#ebd73f', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = '#ebd73f'}
            onMouseOut={e => e.currentTarget.style.color = selectedItem ? '#888' : '#ebd73f'}
          >
            <Home size={14} /> Catalog
          </button>
          
          {selectedItem && getBreadcrumbs(selectedItem).map((crumb, idx, arr) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} style={{ color: '#555' }} />
              {idx === arr.length - 1 ? (
                <span className="notion-font" style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {crumb.object === 'database' ? <Database size={14} style={{ color: '#ebd73f' }} /> : <FileText size={14} style={{ color: '#ebd73f' }} />}
                  {crumb.title}
                </span>
              ) : (
                <button 
                  onClick={() => setSelectedItem(crumb)}
                  className="notion-font"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s', padding: 0 }}
                  onMouseOver={e => e.currentTarget.style.color = '#ebd73f'}
                  onMouseOut={e => e.currentTarget.style.color = '#888'}
                >
                  {crumb.object === 'database' ? <Database size={14} style={{ color: '#888' }} /> : <FileText size={14} style={{ color: '#888' }} />}
                  {crumb.title}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Omnibar & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Workspace Pulse */}
          {selectedItem && (
            <div className="notion-font" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
              {(() => {
                const pending = docContent?.blocks?.filter(b => b.type === 'to_do' && b.to_do?.checked === false).length || 0;
                if (pending > 0) {
                  return <><AlertCircle size={14} style={{ color: '#ffbd2e' }} /> <span style={{ color: '#ffbd2e' }}>{pending} Pending Tasks</span></>;
                } else if (docContent?.blocks?.length > 0) {
                  return <><CheckCircle2 size={14} style={{ color: '#27c93f' }} /> <span style={{ color: '#27c93f' }}>Synced</span></>;
                } else {
                  return <><Activity size={14} style={{ color: '#888' }} /> <span style={{ color: '#888' }}>Ready</span></>;
                }
              })()}
            </div>
          )}

          {/* Orlo Omnibar */}
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#999', zIndex: 2 }} />
            <input
              ref={searchInputRef}
              type="text"
              className="notion-font"
              placeholder="Search or type a command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 48px 10px 42px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={(e) => { 
                e.target.style.background = 'rgba(235, 215, 63, 0.05)'; 
                e.target.style.borderColor = 'rgba(235, 215, 63, 0.3)'; 
                e.target.style.width = '380px';
              }}
              onBlur={(e) => { 
                e.target.style.background = 'rgba(255, 255, 255, 0.03)'; 
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'; 
                e.target.style.width = '100%';
              }}
            />
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '2px', pointerEvents: 'none' }}>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.65rem', color: '#aaa', fontFamily: 'monospace' }}>⌘</kbd>
              <kbd style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.65rem', color: '#aaa', fontFamily: 'monospace' }}>K</kbd>
            </div>
          </form>

          <button
            onClick={() => fetchNotionItems(searchQuery)}
            disabled={loading}
            className="notion-font"
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
          >
            <RefreshCw size={16} className={loading ? 'notion-pulse' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout (Left: Nav, Center: Content, Right: TOC) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: tocItems.length > 0 ? '340px 1fr 280px' : '340px 1fr',
        gap: '24px',
        padding: '32px 40px',
        flex: 1,
        maxWidth: '1800px',
        margin: '0 auto',
        width: '100%'
      }}>
        
        {/* Floating Toolbar */}
        <div ref={toolbarRef} style={{
          position: 'fixed',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 15, 18, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '6px 8px',
          display: 'flex',
          gap: '6px',
          zIndex: 10000,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease-out',
          maxWidth: 'calc(100vw - 20px)'
        }}>
          {/* Designer Presets */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select 
              className="notion-font"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                paddingRight: '28px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onChange={(e) => {
                if(e.target.value) {
                  handleApplyPreset(e);
                  e.target.value = ""; // Reset
                }
              }}
            >
              <option value="" style={{ background: '#111' }}>10X Presets</option>
              <option value="critical" style={{ background: '#111', color: '#ff4d4f' }}>Cyber Glitch</option>
              <option value="liquid" style={{ background: '#111', color: '#9400d3' }}>Liquid Gradient</option>
              <option value="highlight" style={{ background: '#111', color: '#ebd73f' }}>Gold Shimmer</option>
              <option value="code" style={{ background: '#111' }}>Classified</option>
            </select>
            <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: '#aaa', fontSize: '0.7rem' }}>▼</div>
          </div>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />

          {/* Formatting Tools */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800, transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
            title="Bold"
          >
            B
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'serif', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
            title="Italic"
          >
            I
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.9rem', textDecoration: 'line-through', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('strikeThrough'); }}
            title="Strikethrough"
          >
            S
          </button>

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />

          {/* AI Tools */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.15)'; e.currentTarget.style.color = '#ebd73f'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
            onClick={() => {
              const text = window.getSelection().toString().trim();
              const blockId = toolbarRef.current?.dataset.blockId;
              const blockType = toolbarRef.current?.dataset.blockType;
              window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                detail: { text: `Please explain this Notion text: "${text}"`, blockId, blockType, intent: 'notion_edit' }
              }));
            }}
          >
            <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} /> Ask Orlo
          </button>
          
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
            onClick={() => {
              const text = window.getSelection().toString().trim();
              const blockId = toolbarRef.current?.dataset.blockId;
              const blockType = toolbarRef.current?.dataset.blockType;
              window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                detail: { text: `Please summarize this Notion text: "${text}"`, blockId, blockType, intent: 'notion_edit' }
              }));
            }}
          >
            Summarize
          </button>
          
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, fontStyle: 'italic', transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
            onClick={() => {
              const text = window.getSelection().toString().trim();
              const blockId = toolbarRef.current?.dataset.blockId;
              const blockType = toolbarRef.current?.dataset.blockType;
              window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                detail: { text: `Fix the spelling/grammar in this block.`, blockId, blockType, intent: 'notion_edit' }
              }));
            }}
          >
            Fix Spelling
          </button>
        </div>
        
        {/* LEFT PANEL: Document Catalog */}
        <div className="notion-glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="notion-font" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Catalog ({filteredItems.length})
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`notion-font filter-chip ${filterType === 'favorites' ? 'active' : ''}`}
                onClick={() => setFilterType('favorites')}
              >
                ⭐ Favorites
              </button>
              {['all', 'page', 'database'].map((type) => (
                <button
                  key={type}
                  className={`notion-font filter-chip ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loading && items.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: '64px', borderRadius: '14px', marginBottom: '8px' }} />
              ))
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Info size={32} style={{ color: '#ebd73f', margin: '0 auto 16px auto', opacity: 0.8 }} />
                <h4 className="notion-font" style={{ margin: '0 0 10px 0', fontSize: '0.95rem' }}>No Documents Found</h4>
                <p className="notion-font" style={{ fontSize: '0.8rem', color: '#777', lineHeight: 1.6 }}>
                  Adjust your filters or ensure pages are shared with the integration.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`notion-font notion-item-btn ${isSelected ? 'notion-item-active' : ''}`}
                  >
                    <span style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.7 }}>
                      {item.icon || (item.object === 'database' ? '🗃️' : '📄')}
                    </span>
                    <div style={{ overflow: 'hidden', flex: 1, textAlign: 'left' }}>
                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: isSelected ? '#ebd73f' : '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#666', fontWeight: 500, letterSpacing: '0.02em' }}>
                        {item.lastEditedTime ? new Date(item.lastEditedTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'} 
                        {' • '} <span style={{ textTransform: 'capitalize' }}>{item.object}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => toggleFavorite(e, item.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <Star 
                        size={16} 
                        fill={favorites.includes(item.id) ? '#ebd73f' : 'transparent'} 
                        color={favorites.includes(item.id) ? '#ebd73f' : '#666'} 
                        style={{ opacity: isSelected || favorites.includes(item.id) ? 1 : 0.4 }}
                      />
                    </button>
                    <ChevronRight size={16} style={{ color: isSelected ? '#ebd73f' : '#444', transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER PANEL: Main Reader */}
        <div className={isZenithMode ? "" : "notion-glass-card"} style={isZenithMode ? {
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#020203',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'hidden'
        } : {
          height: 'calc(100vh - 120px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: isZenithMode ? '100vh' : 'calc(100vh - 120px)',
          width: isZenithMode ? '100vw' : '100%',
          maxWidth: isZenithMode ? '900px' : '100%',
          padding: isZenithMode ? '60px 0 0 0' : '0'
        }}>
          {selectedItem ? (
              <div 
              className={isZenithMode ? "" : "notion-glass-card"} 
              ref={contentRef}
              onScroll={handleScroll}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflowY: 'auto',
                position: 'relative',
                scrollBehavior: 'smooth',
                width: '100%',
                overflowWrap: 'break-word',
                wordWrap: 'break-word',
                padding: '40px'
              }}
            >
              {/* Reading Progress Bar */}
              {selectedItem && (
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                  <div style={{ width: `${scrollProgress}%`, height: '100%', background: '#ebd73f', transition: 'width 0.1s ease-out', boxShadow: '0 0 10px #ebd73f' }} />
                </div>
              )}

              {/* Cover Image */}
              {docContent?.page?.cover && (
                <div style={{
                  height: '180px',
                  width: '100%',
                  borderRadius: '16px',
                  backgroundImage: `url(${docContent.page.cover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '32px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }} />
              )}

              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <span style={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>
                    {docContent?.page?.icon || selectedItem.icon || '📄'}
                  </span>
                  <div>
                    <h2 className="notion-font" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                      {docContent?.page?.title || selectedItem.title}
                    </h2>
                    <p className="notion-font" style={{ fontSize: '0.9rem', color: '#777', margin: 0, fontWeight: 500 }}>
                      Last updated: <span style={{ color: '#aaa' }}>{selectedItem.lastEditedTime ? new Date(selectedItem.lastEditedTime).toLocaleString() : 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {showSubpageInput ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <input 
                        type="text" 
                        autoFocus
                        placeholder="Subpage name..."
                        value={subpageTitle}
                        onChange={e => setSubpageTitle(e.target.value)}
                        disabled={isCreatingSubpage}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && subpageTitle.trim()) {
                            setIsCreatingSubpage(true);
                            try {
                              const res = await fetch('/api/admin/notion/create', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ parentId: selectedItem.id, parentType: selectedItem.object, title: subpageTitle.trim() })
                              });
                              if (res.ok) {
                                setShowSubpageInput(false);
                                setSubpageTitle('');
                                fetchPageContent(selectedItem.id); // Reload content
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsCreatingSubpage(false);
                            }
                          } else if (e.key === 'Escape') {
                            setShowSubpageInput(false);
                            setSubpageTitle('');
                          }
                        }}
                        className="notion-font"
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '4px 8px', outline: 'none', width: '150px', fontSize: '0.85rem' }}
                      />
                      {isCreatingSubpage && <RefreshCw size={14} className="spin" style={{ color: '#ebd73f', marginRight: '8px' }} />}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSubpageInput(true)}
                      className="notion-font"
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    >
                      <Plus size={16} /> Subpage
                    </button>
                  )}

                  <button
                    onClick={() => setIsZenithMode(!isZenithMode)}
                    title={isZenithMode ? "Exit Focus Mode (Esc)" : "Enter Zenith Focus Mode"}
                    className="notion-font"
                    style={{
                      padding: '10px 14px',
                      background: isZenithMode ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderColor: isZenithMode ? 'rgba(235, 215, 63, 0.3)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      color: isZenithMode ? '#ebd73f' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = isZenithMode ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = isZenithMode ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                  >
                    {isZenithMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>

                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="notion-font"
                    style={{
                      padding: '10px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Open Document <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Rendered Content */}
              {contentLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '40px' }}>
                  <div className="shimmer block-enter" style={{ height: '40px', width: '60%', borderRadius: '8px' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '100%', borderRadius: '4px', animationDelay: '0.1s' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '90%', borderRadius: '4px', animationDelay: '0.2s' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '95%', borderRadius: '4px', animationDelay: '0.3s' }} />
                  <div className="shimmer block-enter" style={{ height: '100px', width: '100%', borderRadius: '12px', marginTop: '20px', animationDelay: '0.4s' }} />
                </div>
              ) : docContent?.blocks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '60px' }}>
                  {docContent.blocks.map((block, i) => (
                    <div key={block.id} id={`block-${block.id}`} data-block-type={block.type} className="block-enter" style={{ position: 'relative', animationDelay: `${Math.min(i * 0.03, 1)}s` }}>
                      <NotionBlockRenderer block={block} setSelectedItem={setSelectedItem} />
                    </div>
                  ))}
                  
                  {/* + Add Block UI */}
                  <div style={{ position: 'relative', marginTop: '16px' }}>
                    {showAddBlockMenu ? (
                      <div className="notion-glass-card block-enter" style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', border: '1px solid rgba(235, 215, 63, 0.3)' }}>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span className="notion-font" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase' }}>Insert Block</span>
                          <button onClick={() => setShowAddBlockMenu(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>×</button>
                        </div>
                        {[
                          { type: 'paragraph', icon: <Type size={14}/>, label: 'Text' },
                          { type: 'to_do', icon: <CheckSquare size={14}/>, label: 'To-Do List' },
                          { type: 'toggle', icon: <ToggleLeft size={14}/>, label: 'Toggle List' },
                          { type: 'bulleted_list_item', icon: <List size={14}/>, label: 'Bulleted List' },
                          { type: 'numbered_list_item', icon: <ListOrdered size={14}/>, label: 'Numbered List' },
                          { type: 'heading_1', icon: <Heading1 size={14}/>, label: 'Heading 1' },
                          { type: 'heading_2', icon: <Heading2 size={14}/>, label: 'Heading 2' },
                          { type: 'heading_3', icon: <Heading3 size={14}/>, label: 'Heading 3' },
                          { type: 'quote', icon: <Quote size={14}/>, label: 'Quote' },
                          { type: 'code', icon: <Code size={14}/>, label: 'Code' },
                        ].map(opt => (
                          <button
                            key={opt.type}
                            disabled={isAppendingBlock}
                            onClick={() => handleAppendBlock(opt.type)}
                            className="notion-font"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            <span style={{ color: '#ebd73f' }}>{opt.icon}</span>
                            <span style={{ fontSize: '0.85rem' }}>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowAddBlockMenu(true)}
                        className="notion-font block-enter"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '8px', color: '#888', cursor: 'pointer', width: '100%', transition: 'all 0.2s', marginTop: '8px' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                      >
                        <Plus size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Add a block</span>
                        {isAppendingBlock && <RefreshCw size={14} className="spin" style={{ marginLeft: 'auto' }} />}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: '#555', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }} className="notion-font">
                  <Database size={48} style={{ color: '#444', marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.2rem', color: '#888', margin: '0 0 10px 0' }}>Empty Document</h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem' }}>This page has no content blocks or could not be fully read.</p>
                  
                  {/* + Add Block for empty docs */}
                  {showAddBlockMenu ? (
                    <div className="notion-glass-card block-enter" style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', border: '1px solid rgba(235, 215, 63, 0.3)', textAlign: 'left' }}>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="notion-font" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase' }}>Insert Block</span>
                        <button onClick={() => setShowAddBlockMenu(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>×</button>
                      </div>
                      {[
                        { type: 'paragraph', icon: <Type size={14}/>, label: 'Text' },
                        { type: 'to_do', icon: <CheckSquare size={14}/>, label: 'To-Do List' },
                        { type: 'toggle', icon: <ToggleLeft size={14}/>, label: 'Toggle List' },
                        { type: 'bulleted_list_item', icon: <List size={14}/>, label: 'Bulleted List' },
                        { type: 'numbered_list_item', icon: <ListOrdered size={14}/>, label: 'Numbered List' },
                        { type: 'heading_1', icon: <Heading1 size={14}/>, label: 'Heading 1' },
                        { type: 'heading_2', icon: <Heading2 size={14}/>, label: 'Heading 2' },
                        { type: 'heading_3', icon: <Heading3 size={14}/>, label: 'Heading 3' },
                        { type: 'quote', icon: <Quote size={14}/>, label: 'Quote' },
                        { type: 'code', icon: <Code size={14}/>, label: 'Code' },
                      ].map(opt => (
                        <button
                          key={opt.type}
                          disabled={isAppendingBlock}
                          onClick={() => handleAppendBlock(opt.type)}
                          className="notion-font"
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                          <span style={{ color: '#ebd73f' }}>{opt.icon}</span>
                          <span style={{ fontSize: '0.85rem' }}>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowAddBlockMenu(true)}
                      className="notion-font"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '8px', color: '#ebd73f', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
                    >
                      <Plus size={16} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Create First Block</span>
                      {isAppendingBlock && <RefreshCw size={14} className="spin" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#777', maxWidth: '420px', padding: '40px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(235, 215, 63, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                <BookOpen size={40} style={{ color: '#ebd73f' }} />
              </div>
              <h3 className="notion-font" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 12px 0', color: '#fff' }}>Select a Document</h3>
              <p className="notion-font" style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.6 }}>
                Choose any note, database, or business plan from the catalog on the left to read its live contents with a premium viewing experience.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Table of Contents (Only visible if doc has headings) */}
        {tocItems.length > 0 && (
          <div className="notion-glass-card" style={{
            padding: '24px',
            height: 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <LayoutList size={18} style={{ color: '#ebd73f' }} />
              <span className="notion-font" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                On this page
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tocItems.map((item) => {
                let indent = 0;
                if (item.type === 'heading_2') indent = 12;
                if (item.type === 'heading_3') indent = 24;
                
                return (
                  <div
                    key={item.id}
                    className="notion-font toc-link"
                    style={{ marginLeft: `${indent}px` }}
                    onClick={() => {
                      const el = document.getElementById(`block-${item.id}`);
                      if (el && contentRef.current) {
                        contentRef.current.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
                      }
                    }}
                  >
                    {item.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- Utility: Parse HTML to Notion Rich Text ---
function parseHTMLToNotion(htmlNode) {
  const richTextArray = [];
  
  function traverse(node, currentAnnotations) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent;
      if (text !== '') {
        richTextArray.push({
          type: 'text',
          text: { content: text },
          annotations: { ...currentAnnotations }
        });
      }
      return;
    }

    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const annotations = { ...currentAnnotations };
      const tag = node.tagName.toLowerCase();

      if (tag === 'b' || tag === 'strong') annotations.bold = true;
      if (tag === 'i' || tag === 'em') annotations.italic = true;
      if (tag === 'u') annotations.underline = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') annotations.strikethrough = true;
      if (tag === 'code') annotations.code = true;

      // Handle color via data-notion-color attribute
      if (node.hasAttribute && node.hasAttribute('data-notion-color')) {
        annotations.color = node.getAttribute('data-notion-color');
      } else if (node.style && node.style.color) {
        // Very basic mapping, Notion API expects specific color strings like 'red', 'blue', etc.
        // For advanced, you'd map hex to these. We'll stick to basic standard colors if provided.
      }

      // If it's a block level element like DIV or BR that causes a newline, we could inject \n
      if (tag === 'br') {
        richTextArray.push({ type: 'text', text: { content: '\n' }, annotations: { ...currentAnnotations } });
        return;
      }

      for (const child of node.childNodes) {
        traverse(child, annotations);
      }
    }
  }

  traverse(htmlNode, {
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    code: false,
    color: 'default'
  });
  
  return richTextArray.length > 0 ? richTextArray : [{ text: { content: '' } }];
}

// --- Utility: Apply Designer Preset ---
function applyDesignerPreset(presetName) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  
  const span = document.createElement('span');
  
  if (presetName === 'critical') {
    span.setAttribute('data-notion-color', 'red_background');
    span.className = 'preset-cyber-glitch';
    const b = document.createElement('b');
    b.appendChild(range.extractContents());
    span.appendChild(b);
    range.insertNode(span);
    return;
  } else if (presetName === 'success') {
    span.setAttribute('data-notion-color', 'green_background');
    span.style.color = '#52c41a';
    span.style.backgroundColor = 'rgba(82, 196, 26, 0.2)';
    const b = document.createElement('b');
    b.appendChild(range.extractContents());
    span.appendChild(b);
    range.insertNode(span);
    return;
  } else if (presetName === 'highlight') {
    span.setAttribute('data-notion-color', 'yellow_background');
    span.className = 'preset-gold-shimmer';
  } else if (presetName === 'code') {
    span.setAttribute('data-notion-color', 'gray_background');
    span.className = 'preset-redacted';
    const code = document.createElement('code');
    code.appendChild(range.extractContents());
    span.appendChild(code);
    range.insertNode(span);
    return;
  } else if (presetName === 'liquid') {
    span.setAttribute('data-notion-color', 'purple_background');
    span.className = 'preset-liquid-gradient';
  }
  
  span.appendChild(range.extractContents());
  range.insertNode(span);
}

// --- Inline Editing Components ---
function EditableTextBlock({ blockId, type, initialRichTextArr, renderRichText, tagName, className, style, emptyPlaceholder }) {
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawText = initialRichTextArr?.map(t => t.plain_text).join('') || '';

  const handleBlur = async (e) => {
    const rawHTML = e.target.innerHTML;
    // We parse the DOM node itself
    const richTextArray = parseHTMLToNotion(e.target);
    const plainText = richTextArray.map(r => r.text.content).join('');
    
    if (plainText === rawText && !rawHTML.includes('<')) return; // Simple diff
    
    setIsSaving(true);
    setLocalText(rawHTML);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, type, content: plainText, richTextArray })
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const Tag = tagName;
  
  return (
    <div style={{ position: 'relative', width: '100%', group: 'true' }} title="Click to edit">
      {localText !== null ? (
        <Tag
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); } }}
          className={className}
          style={{ ...style, outline: 'none', cursor: 'text' }}
          dangerouslySetInnerHTML={{ __html: localText || emptyPlaceholder || '' }}
        />
      ) : (
        <Tag
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); } }}
          className={className}
          style={{ ...style, outline: 'none', cursor: 'text' }}
        >
           {(initialRichTextArr && initialRichTextArr.length > 0) ? renderRichText(initialRichTextArr) : emptyPlaceholder}
        </Tag>
      )}
      {isSaving && <span style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#ebd73f', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>Saving</span>}
    </div>
  );
}

function EditableTodoBlock({ block, renderRichText }) {
  const [isChecked, setIsChecked] = useState(block.to_do?.checked);
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawText = block.to_do?.rich_text?.map(t => t.plain_text).join('') || '';

  const toggleCheck = async () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    setIsSaving(true);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.id, type: 'to_do', checked: newChecked })
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = async (e) => {
    const newText = e.target.innerText;
    if (newText === (localText || rawText)) return;
    
    setIsSaving(true);
    setLocalText(newText);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.id, type: 'to_do', content: newText })
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '4px', marginBottom: '8px', background: isChecked ? 'rgba(255,255,255,0.02)' : 'transparent', padding: '6px', borderRadius: '8px', position: 'relative' }}>
      <span 
        onClick={toggleCheck}
        style={{
          width: '20px', height: '20px', borderRadius: '6px',
          border: isChecked ? '2px solid #ebd73f' : '2px solid #555',
          background: isChecked ? 'rgba(235, 215, 63, 0.15)' : 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ebd73f', marginTop: '2px', flexShrink: 0, cursor: 'pointer'
        }}
      >
        {isChecked && <CheckSquare size={14} strokeWidth={3} />}
      </span>
      <div 
        className="notion-font"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); } }}
        style={{
          fontSize: '1rem', lineHeight: 1.6,
          color: isChecked ? '#666' : '#eee',
          textDecoration: isChecked ? 'line-through' : 'none',
          transition: 'color 0.2s', outline: 'none', cursor: 'text', flex: 1
        }}
      >
        {localText !== null ? localText : renderRichText(block.to_do?.rich_text)}
      </div>
      {isSaving && <span style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#ebd73f', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>Saving</span>}
    </div>
  );
}

// Block Renderer Sub-component
function NotionBlockRenderer({ block, setSelectedItem }) {
  const [toggleOpen, setToggleOpen] = useState(false);

  const renderRichText = (richTextArr) => {
    if (!richTextArr || richTextArr.length === 0) return null;
    return richTextArr.map((t, idx) => {
      let className = "notion-font";
      let style = {};
      if (t.annotations?.bold) style.fontWeight = '800';
      if (t.annotations?.italic) style.fontStyle = 'italic';
      if (t.annotations?.strikethrough) style.textDecoration = 'line-through';
      if (t.annotations?.underline) style.textDecoration = 'underline';
      
      if (t.annotations?.color && t.annotations.color !== 'default') {
        if (t.annotations.color === 'red_background') {
          className += " preset-cyber-glitch";
        } else if (t.annotations.color === 'green_background') {
          style.color = '#52c41a';
          style.backgroundColor = 'rgba(82, 196, 26, 0.2)';
        } else if (t.annotations.color === 'yellow_background') {
          className += " preset-gold-shimmer";
        } else if (t.annotations.color === 'purple_background') {
          className += " preset-liquid-gradient";
        } else if (t.annotations.color === 'gray_background') {
          className += " preset-redacted";
        } else {
          // Map standard Notion colors to dark theme equivalents roughly
          style.color = t.annotations.color.replace('_background', ''); 
        }
      }

      if (t.href) {
        return (
          <a
            key={idx}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            style={{ ...style, color: '#ebd73f', textDecoration: 'underline', textUnderlineOffset: '4px' }}
          >
            {t.plain_text}
          </a>
        );
      }
      return (
        <span key={idx} className={className} style={style} data-notion-color={t.annotations?.color}>
          {t.plain_text}
        </span>
      );
    });
  };

  switch (block.type) {
    case 'heading_1':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_1" initialRichTextArr={block.heading_1?.rich_text} renderRichText={renderRichText}
          tagName="h1" className="notion-font" style={{ fontSize: '1.8rem', fontWeight: 800, margin: '32px 0 12px 0', color: '#ebd73f', letterSpacing: '-0.02em' }}
          emptyPlaceholder="Untitled Heading 1"
        />
      );

    case 'heading_2':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_2" initialRichTextArr={block.heading_2?.rich_text} renderRichText={renderRichText}
          tagName="h2" className="notion-font" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 10px 0', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
          emptyPlaceholder="Untitled Heading 2"
        />
      );

    case 'heading_3':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_3" initialRichTextArr={block.heading_3?.rich_text} renderRichText={renderRichText}
          tagName="h3" className="notion-font" style={{ fontSize: '1.15rem', fontWeight: 600, margin: '16px 0 8px 0', color: '#ddd' }}
          emptyPlaceholder="Untitled Heading 3"
        />
      );

    case 'paragraph':
      if (!block.paragraph?.rich_text || block.paragraph.rich_text.length === 0) return <div style={{ height: '12px' }} />;
      return (
        <EditableTextBlock
          blockId={block.id} type="paragraph" initialRichTextArr={block.paragraph.rich_text} renderRichText={renderRichText}
          tagName="p" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.7, color: '#b3b3b3', margin: '4px 0 12px 0' }}
          emptyPlaceholder=" "
        />
      );

    case 'bulleted_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '8px', marginBottom: '8px' }}>
          <span style={{ color: '#ebd73f', fontSize: '1.2rem', lineHeight: '1.5rem', userSelect: 'none' }}>•</span>
          <div className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.7, color: '#b3b3b3' }}>
            {renderRichText(block.bulleted_list_item?.rich_text)}
          </div>
        </div>
      );

    case 'numbered_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '8px', marginBottom: '8px' }}>
          <span className="notion-font" style={{ color: '#ebd73f', fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', userSelect: 'none' }}>#</span>
          <div className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.7, color: '#b3b3b3' }}>
            {renderRichText(block.numbered_list_item?.rich_text)}
          </div>
        </div>
      );

    case 'to_do':
      return <EditableTodoBlock block={block} renderRichText={renderRichText} />;

    case 'callout':
      return (
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(145deg, rgba(235, 215, 63, 0.08) 0%, rgba(235, 215, 63, 0.02) 100%)',
          border: '1px solid rgba(235, 215, 63, 0.2)',
          borderLeft: '4px solid #ebd73f',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          margin: '16px 0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '1.6rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{block.callout?.icon?.emoji || '💡'}</span>
          <div className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.7, color: '#fff', fontWeight: 500 }}>
            {renderRichText(block.callout?.rich_text)}
          </div>
        </div>
      );

    case 'toggle':
      return (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: '12px',
          margin: '8px 0',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setToggleOpen(!toggleOpen)}
            className="notion-font"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              fontSize: '1rem',
              fontWeight: 600,
              textAlign: 'left'
            }}
          >
            <ChevronRight size={18} style={{ color: toggleOpen ? '#ebd73f' : '#888', transform: toggleOpen ? 'rotate(90deg)' : 'none', transition: 'all 0.2s' }} />
            {renderRichText(block.toggle?.rich_text)}
          </button>

          <div style={{
            maxHeight: toggleOpen ? '2000px' : '0',
            opacity: toggleOpen ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: toggleOpen ? '0 16px 16px 44px' : '0 16px 0 44px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '16px' }}>
              {block.children?.map((child) => (
                <NotionBlockRenderer key={child.id} block={child} setSelectedItem={setSelectedItem} />
              ))}
            </div>
          </div>
        </div>
      );

    case 'quote':
      return (
        <blockquote style={{
          borderLeft: '4px solid #ebd73f',
          margin: '16px 0',
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '0 12px 12px 0',
          fontSize: '1.1rem',
          fontStyle: 'italic',
          color: '#e0e0e0',
          lineHeight: 1.8
        }} className="notion-font">
          {renderRichText(block.quote?.rich_text)}
        </blockquote>
      );

    case 'code':
      return (
        <div style={{
          background: '#08080a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px 20px',
          margin: '16px 0',
          fontSize: '0.9rem',
          color: '#a3f08c', // Terminal green accent
          overflowX: 'auto',
          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.5)'
        }} className="notion-font">
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
            {block.code?.rich_text?.map(t => t.plain_text).join('')}
          </pre>
        </div>
      );

    case 'divider':
      return (
        <div style={{ 
          height: '1px', 
          background: 'linear-gradient(90deg, transparent, rgba(235, 215, 63, 0.3), transparent)', 
          margin: '32px 0' 
        }} />
      );

    case 'child_page':
    case 'child_database':
      const isDb = block.type === 'child_database';
      const childTitle = isDb ? block.child_database?.title : block.child_page?.title;
      return (
        <button 
          onClick={(e) => {
            e.preventDefault();
            if (setSelectedItem) {
              setSelectedItem({ id: block.id, object: isDb ? 'database' : 'page', title: childTitle || 'Untitled' });
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', margin: '8px 0',
            background: 'rgba(235, 215, 63, 0.05)',
            border: '1px solid rgba(235, 215, 63, 0.2)',
            borderRadius: '10px', color: '#ebd73f',
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(235, 215, 63, 0.05)',
            cursor: 'pointer', width: '100%', textAlign: 'left'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.05)'}
        >
          {isDb ? <Database size={18} /> : <FileText size={18} />}
          <span className="notion-font" style={{ fontWeight: 600, fontSize: '1rem', flex: 1 }}>
            {childTitle || 'Untitled'}
          </span>
          <ChevronRight size={14} style={{ opacity: 0.7 }} />
        </button>
      );

    default:
      return null;
  }
}
