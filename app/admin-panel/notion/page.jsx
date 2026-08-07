'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, 
  FileText, Database, CheckSquare, Sparkles, Info, LayoutList, Plus, Maximize2, Minimize2, Star,
  List, ListOrdered, Type, Heading1, Heading2, Heading3, Quote, Code, ToggleLeft,
  Home, Command, Activity, CheckCircle2, AlertCircle, Trash2, Undo2, Redo2
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';

function FocusSafeDropdown({ label, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="notion-font"
        onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        style={{
          background: isOpen ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)' : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.3)',
          borderLeft: '1px solid rgba(255,255,255,0.15)',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 2px 8px rgba(0,0,0,0.15)',
          color: '#fff',
          borderRadius: '8px',
          padding: '6px 28px 6px 12px',
          fontSize: '0.8rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '100%'
        }}
        onMouseOver={e => !isOpen && (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)')}
        onMouseOut={e => !isOpen && (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)')}
      >
        {label}
        <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: '#888', fontSize: '0.55rem', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(30px) saturate(140%)',
          WebkitBackdropFilter: 'blur(30px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderLeft: '1px solid rgba(255,255,255,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '6px',
          minWidth: '160px',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}>
          {options.map((opt, i) => (
            <div
              key={i}
              className="notion-font"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsOpen(false);
                if (opt.value !== undefined) onChange(opt.value);
              }}
              style={{
                padding: '8px 12px',
                color: opt.color || '#eee',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'translateX(4px)';
                if (opt.hoverClass) e.currentTarget.classList.add(opt.hoverClass);
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
                if (opt.hoverClass) e.currentTarget.classList.remove(opt.hoverClass);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const savedRangeRef = useRef(null);

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
    const range = savedRangeRef.current;
    
    if (typeof presetName === 'string' && range) {
      applyDesignerPreset(presetName, range);
      
      const blockId = toolbarRef.current?.dataset.blockId;
      const blockType = toolbarRef.current?.dataset.blockType;
      
      if (blockId && blockType) {
        const blockEl = document.querySelector(`#block-${blockId} [contenteditable="true"]`);
        if (blockEl) {
          const richTextArray = parseHTMLToNotion(blockEl);
          const plainText = richTextArray.map(r => r.text.content).join('');
          fetch('/api/admin/notion/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blockId, type: blockType, content: plainText, richTextArray })
          });
        }
      }

      if (toolbarRef.current) {
        toolbarRef.current.style.opacity = '0';
        toolbarRef.current.style.transform = 'scale(0.95) translateY(5px)';
        toolbarRef.current.style.pointerEvents = 'none';
      }
    }
  };

  const handleTurnInto = async (e) => {
    const newType = e.target.value;
    if (!newType) return;
    
    const blockId = toolbarRef.current?.dataset.blockId;
    const currentType = toolbarRef.current?.dataset.blockType;
    if (!blockId || !currentType || !selectedItem?.id) return;

    if (toolbarRef.current) {
      toolbarRef.current.style.opacity = '0';
      toolbarRef.current.style.pointerEvents = 'none';
    }

    try {
      let richTextArray = [];
      const blockEl = document.querySelector(`#block-${blockId} [contenteditable="true"]`);
      if (blockEl) {
        richTextArray = parseHTMLToNotion(blockEl);
      } else {
        const block = docContent?.blocks?.find(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
        richTextArray = block?.[currentType]?.rich_text || [];
      }

      const appendRes = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: selectedItem.id,
          type: newType,
          afterBlockId: blockId,
          richTextArray
        })
      });
      
      const appendData = await appendRes.json();
      const newBlockId = appendData.response?.results?.[0]?.id || appendData.response?.id;

      if (appendRes.ok) {
        await fetch('/api/admin/notion/update', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockId })
        });
      }

      fetchPageContent(selectedItem.id);
    } catch(err) {
      console.error(err);
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

  const handleDeleteBlock = async (blockId) => {
    // Optimistic UI update
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== blockId)
      };
    });
    try {
      await fetch('/api/admin/notion/update', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInsertBlockAfter = async (currentBlockId, type = 'paragraph') => {
    if (!selectedItem?.id) return;
    
    // Optimistic UI update to feel instant
    const tempId = `temp-${Date.now()}`;
    const newBlock = { id: tempId, type, [type]: { rich_text: [] } };
    
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const index = prev.blocks.findIndex(b => b.id === currentBlockId);
      if (index === -1) return prev;
      
      const newBlocks = [...prev.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return { ...prev, blocks: newBlocks };
    });

    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockId: selectedItem.id, 
          type, 
          afterBlockId: currentBlockId 
        })
      });
      if (res.ok) {
        await fetchPageContent(selectedItem.id);
        // Auto-focus the new block after it loads
        setTimeout(() => {
          const blocks = document.querySelectorAll('.block-enter [contenteditable="true"]');
          let found = false;
          for (let i = 0; i < blocks.length; i++) {
            if (blocks[i].closest(`[id="block-${currentBlockId}"]`)) {
              if (blocks[i+1]) {
                blocks[i+1].focus();
                found = true;
              }
              break;
            }
          }
        }, 300);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        if (toolbarRef.current) {
          toolbarRef.current.style.opacity = '0';
          toolbarRef.current.style.transform = 'scale(0.95) translateY(5px)';
          toolbarRef.current.style.pointerEvents = 'none';
        }
        return;
      }
      
      const text = selection.toString().trim();
      if (!text) {
        if (toolbarRef.current) {
          toolbarRef.current.style.opacity = '0';
          toolbarRef.current.style.transform = 'scale(0.95) translateY(5px)';
          toolbarRef.current.style.pointerEvents = 'none';
        }
        return;
      }

      if (contentRef.current && contentRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        savedRangeRef.current = range.cloneRange();
        const rect = range.getBoundingClientRect();
        
        let blockId = '';
        let blockType = '';
        const blockElement = selection.anchorNode?.parentElement?.closest('[id^="block-"]');
        if (blockElement) {
          blockId = blockElement.id.replace('block-', '');
          blockType = blockElement.getAttribute('data-block-type') || '';
        }

        if (toolbarRef.current) {
          // Temporarily make visible to get accurate dimensions if it was 0
          const wasPointerEvents = toolbarRef.current.style.pointerEvents;
          
          const toolbarWidth = toolbarRef.current.offsetWidth || 600;
          const toolbarHeight = toolbarRef.current.offsetHeight || 70;
          
          let top = rect.top - toolbarHeight - 15; // 15px gap above
          let left = rect.left + (rect.width / 2) - (toolbarWidth / 2); // Center horizontally
          
          // Vertically flip to bottom if too high
          if (top < 10) top = rect.bottom + 15;
          
          // Horizontally clamp to screen edges
          if (left < 10) {
            left = 10;
          } else if (left + toolbarWidth > window.innerWidth - 10) {
            left = window.innerWidth - toolbarWidth - 10;
          }
          
          toolbarRef.current.style.top = `${top}px`;
          toolbarRef.current.style.left = `${left}px`;
          toolbarRef.current.style.opacity = '1';
          toolbarRef.current.style.transform = 'scale(1) translateY(0)';
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
      if (parentId) {
        const cleanParentId = String(parentId).replace(/-/g, '');
        if (items.some(i => i && i.id && String(i.id).replace(/-/g, '') === cleanParentId)) {
          return false;
        }
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
        const found = items.find(i => i && typeof i.id === 'string' && i.id.replace(/-/g, '') === parentIdClean);
        if (found) {
          current = found;
        } else {
          // If parent is not loaded in items, add a generic parent so user can still navigate up
          current = {
            id: parentId,
            title: 'Parent Page',
            object: current.parent?.type === 'database_id' ? 'database' : 'page',
            parent: null
          };
        }
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
        ::selection {
          background: rgba(235, 215, 63, 0.4); /* Yellow highlight */
          color: #fff;
        }
        ::-moz-selection {
          background: rgba(235, 215, 63, 0.4);
          color: #fff;
        }
        
        .notion-font {
          font-family: 'Clash Display', 'Panchang', sans-serif !important;
        }

        .empty-block:empty::before,
        .empty-block:has(br:only-child)::before {
          content: attr(data-placeholder);
          color: rgba(255, 255, 255, 0.2);
          pointer-events: none;
          cursor: text;
        }
        
        .empty-block:focus::before {
          color: rgba(255, 255, 255, 0.4);
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
        .preset-glass-morphic {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 2px 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .preset-glass-morphic:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.2);
        }

        .preset-neon-pulse {
          color: #00e5ff;
          font-weight: 700;
          text-shadow: 0 0 5px rgba(0, 229, 255, 0.3), 0 0 10px rgba(0, 229, 255, 0.2);
          animation: neonPulse 3s infinite alternate cubic-bezier(0.4, 0, 0.6, 1);
          padding: 0 4px;
        }
        @keyframes neonPulse {
          0% { text-shadow: 0 0 4px rgba(0, 229, 255, 0.4), 0 0 8px rgba(0, 229, 255, 0.2); opacity: 0.8; }
          100% { text-shadow: 0 0 8px rgba(0, 229, 255, 0.8), 0 0 16px rgba(0, 229, 255, 0.5), 0 0 24px rgba(0, 229, 255, 0.3); opacity: 1; }
        }

        .preset-iridescent {
          background: linear-gradient(124deg, #ff2400, #e81d1d, #e8b71d, #e3e81d, #1de840, #1ddde8, #2b1de8, #dd00f3, #dd00f3);
          background-size: 1800% 1800%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          animation: iridescentFade 8s ease infinite;
        }
        @keyframes iridescentFade { 
          0%{background-position:0% 82%}
          50%{background-position:100% 19%}
          100%{background-position:0% 82%}
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
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(30px) saturate(140%)',
          WebkitBackdropFilter: 'blur(30px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderLeft: '1px solid rgba(255,255,255,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '8px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10000,
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 2px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(0,0,0,0.5)',
          opacity: 0,
          transform: 'scale(0.95) translateY(5px)',
          pointerEvents: 'none',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: 'calc(100vw - 20px)'
        }}>

          {/* Turn Into */}
          <FocusSafeDropdown 
            label="Turn Into"
            options={[
              { label: 'Turn Into', value: '' },
              { label: 'Heading 1', value: 'heading_1' },
              { label: 'Heading 2', value: 'heading_2' },
              { label: 'Heading 3', value: 'heading_3' },
              { label: 'Paragraph', value: 'paragraph' }
            ]}
            onChange={(val) => handleTurnInto({ target: { value: val } })}
          />

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />

          {/* Undo / Redo */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('undo'); }}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('redo'); }}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>

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

          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 4px' }} />

          {/* Designer Presets */}
          <FocusSafeDropdown 
            label="Default"
            options={[
              { label: 'Default', value: '' },
              { label: 'Glass Text', value: 'glass', hoverClass: 'preset-glass-morphic' },
              { label: 'Neon Pulse', value: 'neon', color: '#00e5ff', hoverClass: 'preset-neon-pulse' },
              { label: 'Iridescent', value: 'iridescent', hoverClass: 'preset-iridescent' },
              { label: 'Liquid Gradient', value: 'liquid', color: '#9400d3', hoverClass: 'preset-liquid-gradient' },
              { label: 'Gold Shimmer', value: 'highlight', color: '#ebd73f', hoverClass: 'shimmer' },
              { label: 'Classified', value: 'code' }
            ]}
            onChange={(val) => handleApplyPreset({ target: { value: val } })}
          />

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
                <Star size={14} fill={filterType === 'favorites' ? '#ebd73f' : 'transparent'} strokeWidth={2.5} style={{ display: 'block', margin: '2px 0' }} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 
                      className="notion-font" 
                      contentEditable
                      suppressContentEditableWarning
                      style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', outline: 'none' }}
                      onBlur={async (e) => {
                        const newTitle = e.target.innerText.trim();
                        if (newTitle && newTitle !== (docContent?.page?.title || selectedItem.title)) {
                          // Optimistic update
                          setSelectedItem(prev => ({ ...prev, title: newTitle }));
                          setItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? { ...item, title: newTitle } : item));
                          if (docContent?.page) setDocContent(prev => ({ ...prev, page: { ...prev.page, title: newTitle } }));
                          
                          // API call
                          fetch('/api/admin/notion/update', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ blockId: selectedItem.id, type: selectedItem.object || 'page', content: newTitle })
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.target.blur();
                        }
                      }}
                    >
                      {docContent?.page?.title || selectedItem.title}
                    </h1>
                    <button 
                      onClick={(e) => toggleFavorite(e, selectedItem.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        cursor: 'pointer', 
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Star 
                        size={24} 
                        fill={favorites.includes(selectedItem.id) ? '#ebd73f' : 'transparent'} 
                        color={favorites.includes(selectedItem.id) ? '#ebd73f' : '#888'} 
                      />
                    </button>
                  </div>
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
                      <NotionBlockRenderer block={block} setSelectedItem={setSelectedItem} onDeleteBlock={handleDeleteBlock} onInsertBlockAfter={handleInsertBlockAfter} />
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
      if (tag === 'div' || tag === 'p') {
        if (richTextArray.length > 0 && richTextArray[richTextArray.length-1].text.content !== '\n') {
          richTextArray.push({ type: 'text', text: { content: '\n' }, annotations: { ...currentAnnotations } });
        }
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
function applyDesignerPreset(presetName, range) {
  if (!range) return;
  if (range.collapsed) return;
  
  let fragment = range.extractContents();
  
  // Clean up any existing preset spans from the selection to prevent stacking
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(fragment);
  const spans = tempDiv.querySelectorAll('span[data-notion-color], span[class^="preset-"]');
  spans.forEach(span => {
      while (span.firstChild) {
          span.parentNode.insertBefore(span.firstChild, span);
      }
      span.parentNode.removeChild(span);
  });
  
  fragment = document.createDocumentFragment();
  while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
  }

  // If Default (empty string), just insert the cleaned fragment without wrapping
  if (!presetName) {
      range.insertNode(fragment);
      return;
  }
  
  const span = document.createElement('span');
  
  if (presetName === 'glass') {
    span.setAttribute('data-notion-color', 'gray_background');
    span.className = 'preset-glass-morphic';
    span.appendChild(fragment);
    range.insertNode(span);
    return;
  } else if (presetName === 'neon') {
    span.setAttribute('data-notion-color', 'blue_background');
    span.className = 'preset-neon-pulse';
    span.appendChild(fragment);
    range.insertNode(span);
    return;
  } else if (presetName === 'iridescent') {
    span.setAttribute('data-notion-color', 'purple_background');
    span.className = 'preset-iridescent';
    span.appendChild(fragment);
    range.insertNode(span);
    return;
  } else if (presetName === 'success') {
    span.setAttribute('data-notion-color', 'green_background');
    span.style.color = '#52c41a';
    span.style.backgroundColor = 'rgba(82, 196, 26, 0.2)';
    const b = document.createElement('b');
    b.appendChild(fragment);
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
    code.appendChild(fragment);
    span.appendChild(code);
    range.insertNode(span);
    return;
  } else if (presetName === 'liquid') {
    span.setAttribute('data-notion-color', 'purple_background');
    span.className = 'preset-liquid-gradient';
  }
  
  span.appendChild(fragment);
  range.insertNode(span);
}

// --- Inline Editing Components ---
function EditableTextBlock({ blockId, type, initialRichTextArr, renderRichText, tagName, className, style, emptyPlaceholder, onDeleteBlock, onInsertBlockAfter }) {
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const tagRef = useRef(null);

  useEffect(() => {
    // Immediately convert React-managed children to an HTML string on mount.
    // This prevents React from crashing if we manually mutate the DOM later via applyDesignerPreset.
    if (tagRef.current && localText === null) {
      setLocalText(tagRef.current.innerHTML);
    }
  }, []);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleBlur(e);
      if (onInsertBlockAfter) {
        onInsertBlockAfter(blockId, 'paragraph');
      }
    }
    if (e.key === 'Backspace' && e.target.innerText.trim() === '') {
      e.preventDefault();
      if (onDeleteBlock) {
        onDeleteBlock(blockId);
      }
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
          onKeyDown={handleKeyDown}
          className={`${className} empty-block`}
          data-placeholder={emptyPlaceholder}
          style={{ ...style, outline: 'none', cursor: 'text' }}
          dangerouslySetInnerHTML={{ __html: localText }}
        />
      ) : (
        <Tag
          ref={tagRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`${className} empty-block`}
          data-placeholder={emptyPlaceholder}
          style={{ ...style, outline: 'none', cursor: 'text' }}
        >
           {(initialRichTextArr && initialRichTextArr.length > 0) ? renderRichText(initialRichTextArr) : null}
        </Tag>
      )}
      {isSaving && <span style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#ebd73f', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>Saving</span>}
    </div>
  );
}

function EditableTodoBlock({ block, renderRichText, onDeleteBlock, onInsertBlockAfter }) {
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleBlur(e);
      if (onInsertBlockAfter) {
        onInsertBlockAfter(block.id, 'to_do');
      }
    }
    if (e.key === 'Backspace' && e.target.innerText.trim() === '') {
      e.preventDefault();
      if (onDeleteBlock) {
        onDeleteBlock(block.id);
      }
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
        onKeyDown={handleKeyDown}
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
function NotionBlockRenderer({ block, setSelectedItem, onDeleteBlock, onInsertBlockAfter }) {
  const [toggleOpen, setToggleOpen] = useState(false);

  const renderRichText = (richTextArr) => {
    if (!richTextArr || richTextArr.length === 0) return null;
    return richTextArr.map((t, idx) => {
      let className = "notion-font";
      let customStyle = {};
      if (t.annotations?.bold) customStyle.fontWeight = '800';
      if (t.annotations?.italic) customStyle.fontStyle = 'italic';
      if (t.annotations?.strikethrough) customStyle.textDecoration = 'line-through';
      if (t.annotations?.underline) customStyle.textDecoration = 'underline';
      
      if (t.annotations?.color && t.annotations.color !== 'default') {
        if (t.annotations.color === 'red_background') {
          className += " preset-cyber-glitch";
        } else if (t.annotations.color === 'green_background') {
          customStyle.color = '#52c41a';
          customStyle.backgroundColor = 'rgba(82, 196, 26, 0.2)';
        } else if (t.annotations.color === 'yellow_background') {
          className += " preset-gold-shimmer";
        } else if (t.annotations.color === 'purple_background') {
          className += " preset-liquid-gradient";
        } else if (t.annotations.color === 'gray_background') {
          className += " preset-redacted";
        } else {
          // Map standard Notion colors to dark theme equivalents roughly
          customStyle.color = t.annotations.color.replace('_background', ''); 
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
            style={{ ...customStyle, color: '#ebd73f', textDecoration: 'underline', textUnderlineOffset: '4px' }}
          >
            {t.plain_text}
          </a>
        );
      }
      return (
        <span key={idx} className={className} style={customStyle} data-notion-color={t.annotations?.color}>
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
          onDeleteBlock={onDeleteBlock}
          onInsertBlockAfter={onInsertBlockAfter}
        />
      );

    case 'heading_2':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_2" initialRichTextArr={block.heading_2?.rich_text} renderRichText={renderRichText}
          tagName="h2" className="notion-font" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 10px 0', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}
          emptyPlaceholder="Untitled Heading 2"
          onDeleteBlock={onDeleteBlock}
          onInsertBlockAfter={onInsertBlockAfter}
        />
      );

    case 'heading_3':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_3" initialRichTextArr={block.heading_3?.rich_text} renderRichText={renderRichText}
          tagName="h3" className="notion-font" style={{ fontSize: '1.15rem', fontWeight: 600, margin: '16px 0 8px 0', color: '#ddd' }}
          emptyPlaceholder="Untitled Heading 3"
          onDeleteBlock={onDeleteBlock}
          onInsertBlockAfter={onInsertBlockAfter}
        />
      );

    case 'paragraph':
      return (
        <EditableTextBlock
          blockId={block.id} type="paragraph" initialRichTextArr={block.paragraph?.rich_text} renderRichText={renderRichText}
          tagName="p" className="notion-font" style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#f0f0f0', margin: '4px 0 16px 0', letterSpacing: '0.01em' }}
          emptyPlaceholder="Type something..."
          onDeleteBlock={onDeleteBlock}
          onInsertBlockAfter={onInsertBlockAfter}
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
      return <EditableTodoBlock block={block} renderRichText={renderRichText} onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} />;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (setSelectedItem) {
                setSelectedItem({ id: block.id, object: isDb ? 'database' : 'page', title: childTitle || 'Untitled' });
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px',
              background: 'rgba(235, 215, 63, 0.05)',
              border: '1px solid rgba(235, 215, 63, 0.2)',
              borderRadius: '10px', color: '#ebd73f',
              textDecoration: 'none', transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(235, 215, 63, 0.05)',
              cursor: 'pointer', flex: 1, textAlign: 'left'
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
          
          {onDeleteBlock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm(`Are you sure you want to delete "${childTitle || 'Untitled'}"? This will archive the page in Notion.`)) {
                  onDeleteBlock(block.id);
                }
              }}
              style={{
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid rgba(255, 77, 79, 0.2)',
                color: '#ff4d4f',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 79, 0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`Delete ${isDb ? 'Database' : 'Page'}`}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
}
