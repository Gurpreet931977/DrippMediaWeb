'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, 
  FileText, Database, CheckSquare, Sparkles, Info, LayoutList, Plus, Maximize2, Minimize2
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';

export default function NotionHubPage() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'page', 'database'
  const [selectedItem, setSelectedItem] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Scroll progress for the viewer
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);

  // Zenith Mode State
  const [isZenithMode, setIsZenithMode] = useState(false);

  // Floating Toolbar State
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  // Subpage Creation State
  const [showSubpageInput, setShowSubpageInput] = useState(false);
  const [subpageTitle, setSubpageTitle] = useState('');
  const [isCreatingSubpage, setIsCreatingSubpage] = useState(false);

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
  }, []);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenithMode]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionRect(null);
        setSelectedText('');
        setSelectedBlockId(null);
        return;
      }
      
      const text = selection.toString().trim();
      if (!text) {
        setSelectionRect(null);
        setSelectedText('');
        setSelectedBlockId(null);
        return;
      }

      if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        let blockId = null;
        const blockElement = selection.anchorNode?.parentElement?.closest('[id^="block-"]');
        if (blockElement) {
          blockId = blockElement.id.replace('block-', '');
        }

        setSelectionRect({
          top: rect.top,
          left: rect.left + rect.width / 2,
        });
        setSelectedText(text);
        setSelectedBlockId(blockId);
      } else {
        setSelectionRect(null);
        setSelectedText('');
        setSelectedBlockId(null);
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
    if (filterType === 'all') return true;
    return item.object === filterType;
  });

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
      `}</style>

      {/* Top Header */}
      <header style={{
        padding: '24px 40px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'rgba(5, 5, 8, 0.7)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #ebd73f 0%, #b8a623 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 10px 25px rgba(235, 215, 63, 0.3)'
          }}>
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="notion-font" style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {isGenz ? 'BRAIN VAULT.' : 'STRATEGY HUB.'}
            </h1>
            <p className="notion-font" style={{ fontSize: '0.85rem', color: '#777', margin: '4px 0 0 0', fontWeight: 500 }}>
              Live synchronized strategy workspace
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ebd73f' }} />
            <input
              type="text"
              className="notion-font"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(235, 215, 63, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 15px rgba(235, 215, 63, 0.05)',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(235, 215, 63, 0.15)'}
              onBlur={(e) => e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 15px rgba(235, 215, 63, 0.05)'}
            />
          </form>

          <button
            onClick={() => fetchNotionItems(searchQuery)}
            disabled={loading}
            className="notion-font"
            style={{
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              fontWeight: 600
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = '#ebd73f'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
          >
            <RefreshCw size={16} className={loading ? 'notion-pulse' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            Refresh
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
        {selectionRect && (
          <div style={{
            position: 'fixed',
            top: selectionRect.top - 50,
            left: selectionRect.left,
            transform: 'translateX(-50%)',
            background: 'rgba(12, 12, 16, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '6px 8px',
            display: 'flex',
            gap: '8px',
            zIndex: 10000,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            animation: 'slideUpFade 0.2s ease-out'
          }}>
            <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                  detail: { text: `Please explain this Notion text: "${selectedText}"`, blockId: selectedBlockId, intent: 'notion_edit' }
                }));
              }}
            >
              <Sparkles size={14} style={{ display: 'inline', marginRight: '4px', color: '#ebd73f' }} /> Ask AI
            </button>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                  detail: { text: `Please summarize this Notion text: "${selectedText}"`, blockId: selectedBlockId, intent: 'notion_edit' }
                }));
              }}
            >
              Summarize
            </button>
            <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, fontStyle: 'italic' }}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                  detail: { text: `Fix the spelling/grammar in this block.`, blockId: selectedBlockId, intent: 'notion_edit' }
                }));
              }}
            >
              Fix Spelling
            </button>
          </div>
        )}
        
        {/* LEFT PANEL: Document Catalog */}
        <div className="notion-glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 180px)',
          overflow: 'hidden'
        }}>
          {/* Filters */}
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="notion-font" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Catalog ({filteredItems.length})
              </span>
              <Sparkles size={16} style={{ color: '#ebd73f' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
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
                    <ChevronRight size={16} style={{ color: isSelected ? '#ebd73f' : '#444', transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER PANEL: Main Reader */}
        <div className="notion-glass-card" style={{
          height: 'calc(100vh - 180px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          gap: '20px', 
          height: isZenithMode ? '100vh' : 'calc(100vh - 120px)',
          position: isZenithMode ? 'fixed' : 'relative',
          top: isZenithMode ? 0 : 'auto',
          left: isZenithMode ? 0 : 'auto',
          width: isZenithMode ? '100vw' : 'auto',
          zIndex: isZenithMode ? 9999 : 1,
          background: isZenithMode ? '#020203' : 'transparent',
          padding: isZenithMode ? '40px' : '0'
        }}>
          {selectedItem ? (
            <div 
              className="notion-glass-card" 
              ref={contentRef}
              onScroll={handleScroll}
              style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflowY: 'auto',
                position: 'relative',
                scrollBehavior: 'smooth',
                border: isZenithMode ? 'none' : undefined,
                background: isZenithMode ? 'transparent' : undefined,
                boxShadow: isZenithMode ? 'none' : undefined,
                maxWidth: isZenithMode ? '900px' : '100%',
                margin: isZenithMode ? '0 auto' : '0'
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
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))' }}>
                    {docContent?.page?.icon || selectedItem.icon || '📄'}
                  </span>
                  <div>
                    <h2 className="notion-font" style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 8px 0', color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                      {docContent?.page?.title || selectedItem.title}
                    </h2>
                    <p className="notion-font" style={{ fontSize: '0.85rem', color: '#777', margin: 0, fontWeight: 500 }}>
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
                      background: 'rgba(235, 215, 63, 0.1)',
                      border: '1px solid rgba(235, 215, 63, 0.3)',
                      borderRadius: '10px',
                      color: '#ebd73f',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(235, 215, 63, 0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
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
                    <div key={block.id} id={`block-${block.id}`} className="block-enter" style={{ animationDelay: `${Math.min(i * 0.03, 1)}s` }}>
                      <NotionBlockRenderer block={block} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: '#555', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.05)' }} className="notion-font">
                  <Database size={48} style={{ color: '#444', marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '1.2rem', color: '#888', margin: '0 0 10px 0' }}>Empty Document</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>This page has no content blocks or could not be fully read.</p>
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
            height: 'calc(100vh - 180px)',
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

// --- Inline Editing Components ---
function EditableTextBlock({ blockId, type, initialRichTextArr, renderRichText, tagName, className, style, emptyPlaceholder }) {
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const rawText = initialRichTextArr?.map(t => t.plain_text).join('') || '';

  const handleBlur = async (e) => {
    const newText = e.target.innerText;
    if (newText === (localText || rawText)) return;
    
    setIsSaving(true);
    setLocalText(newText);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, type, content: newText })
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
function NotionBlockRenderer({ block }) {
  const [toggleOpen, setToggleOpen] = useState(false);

  const renderRichText = (richTextArr) => {
    if (!richTextArr || richTextArr.length === 0) return null;
    return richTextArr.map((t, idx) => {
      let style = {};
      if (t.annotations?.bold) style.fontWeight = '800';
      if (t.annotations?.italic) style.fontStyle = 'italic';
      if (t.annotations?.strikethrough) style.textDecoration = 'line-through';
      if (t.annotations?.underline) style.textDecoration = 'underline';
      if (t.annotations?.color && t.annotations.color !== 'default') {
        // Map Notion colors to dark theme equivalents roughly
        style.color = t.annotations.color.replace('_background', ''); 
      }

      if (t.href) {
        return (
          <a
            key={idx}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="notion-font"
            style={{ ...style, color: '#ebd73f', textDecoration: 'underline', textUnderlineOffset: '4px' }}
          >
            {t.plain_text}
          </a>
        );
      }
      return (
        <span key={idx} className="notion-font" style={style}>
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
                <NotionBlockRenderer key={child.id} block={child} />
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
      return (
        <a 
          href={`https://notion.so/${block.id.replace(/-/g, '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', margin: '8px 0',
            background: 'rgba(235, 215, 63, 0.05)',
            border: '1px solid rgba(235, 215, 63, 0.2)',
            borderRadius: '10px', color: '#ebd73f',
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(235, 215, 63, 0.05)',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.05)'}
        >
          <FileText size={18} />
          <span className="notion-font" style={{ fontWeight: 600, fontSize: '1rem' }}>
            {block.child_page?.title || 'Untitled Page'}
          </span>
          <ExternalLink size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
        </a>
      );

    default:
      return null;
  }
}
