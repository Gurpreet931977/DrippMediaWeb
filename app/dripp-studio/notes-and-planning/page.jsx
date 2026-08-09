'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, 
  FileText, Database, CheckSquare, Sparkles, Info, LayoutList, Plus, Maximize2, Minimize2, Star,
  List, ListOrdered, Type, Heading1, Heading2, Heading3, Quote, Code, ToggleLeft,
  Home, Command, Activity, CheckCircle2, AlertCircle, Trash2, Undo2, Redo2, Copy
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';

function FocusSafeDropdown({ label, options, onChange, align = 'left' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
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

  const toggleOpen = (e) => {
    e.preventDefault();
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 250);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="notion-font"
        onMouseDown={toggleOpen}
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
        <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: '#888', fontSize: '0.55rem', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', transform: isOpen ? (openUpwards ? 'rotate(0deg)' : 'rotate(180deg)') : (openUpwards ? 'rotate(180deg)' : 'rotate(0deg)') }}>
          {openUpwards ? '▲' : '▼'}
        </div>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: openUpwards ? 'auto' : '100%',
          bottom: openUpwards ? '100%' : 'auto',
          left: align === 'left' ? 0 : 'auto',
          right: align === 'right' ? 0 : 'auto',
          marginTop: openUpwards ? '0px' : '8px',
          marginBottom: openUpwards ? '8px' : '0px',
          background: 'linear-gradient(135deg, rgba(24, 24, 28, 0.95) 0%, rgba(12, 12, 16, 0.98) 100%)',
          backdropFilter: 'blur(30px) saturate(140%)',
          WebkitBackdropFilter: 'blur(30px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: openUpwards ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.4)',
          borderBottom: openUpwards ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.15)',
          borderRadius: '14px',
          padding: '6px',
          minWidth: '165px',
          maxHeight: '220px',
          overflowY: 'auto',
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 20px 50px rgba(0,0,0,0.8)',
          zIndex: 100050,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          animation: openUpwards ? 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' : 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
          userSelect: 'none',
          WebkitUserSelect: 'none'
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
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(235, 215, 63, 0.15)';
                e.currentTarget.style.color = '#ebd73f';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = opt.color || '#eee';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span>{opt.label}</span>
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
  const [filterType, setFilterType] = useState('main'); // 'favorites', 'main', 'page', 'database'
  const [sortBy, setSortBy] = useState('date');
  const [blockSortBy, setBlockSortBy] = useState('manual');
  const [favorites, setFavorites] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Scroll progress for the viewer
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);
  const latestPageIdRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Zenith Mode State
  const [isZenithMode, setIsZenithMode] = useState(false);

  // Floating Toolbar Ref (Used instead of state to prevent selection loss on re-render)
  const toolbarRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

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
        throw new Error(data.error || 'Failed to fetch documents');
      }

      // 2. Update state and cache with fresh data
      const sortedItems = (data.items || []).sort((a, b) => new Date(b.lastEditedTime || b.createdTime || 0) - new Date(a.lastEditedTime || a.createdTime || 0));
      setItems(sortedItems);
      localStorage.setItem(cacheKey, JSON.stringify({ ...data, items: sortedItems }));
      
      if (sortedItems.length > 0 && !selectedItem && !isSearch) {
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const targetDocId = params.get('docId');
          if (targetDocId) {
            const found = sortedItems.find(i => i.id === targetDocId || i.id.replace(/-/g, '') === targetDocId.replace(/-/g, ''));
            if (found) {
              setSelectedItem(found);
              return;
            }
          }
        }
        setSelectedItem(sortedItems[0]);
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
      latestPageIdRef.current = pageId;
      const res = await fetch(`/api/admin/notion?action=blocks&pageId=${pageId}`);
      const data = await res.json();

      // Only update if this is still the active page
      if (latestPageIdRef.current === pageId) {
        if (res.ok && data.success) {
          setDocContent(data);
          window._notionContext = data;
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          if (!cachedData) setDocContent(null);
        }
      }
    } catch (err) {
      console.error('Fetch Page Content Error:', err);
      if (latestPageIdRef.current === pageId && !cachedData) setDocContent(null);
    } finally {
      if (latestPageIdRef.current === pageId) {
        setContentLoading(false);
      }
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

  // Auto-scroll to target block if blockId URL parameter is provided
  useEffect(() => {
    if (typeof window !== 'undefined' && docContent?.blocks) {
      const params = new URLSearchParams(window.location.search);
      const targetBlockId = params.get('blockId');
      if (targetBlockId) {
        setTimeout(() => {
          const el = document.getElementById(`block-${targetBlockId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.borderRadius = '12px';
            el.style.boxShadow = '0 0 35px rgba(235, 215, 63, 0.7)';
            el.style.outline = '2px solid #ebd73f';
            setTimeout(() => {
              el.style.boxShadow = 'none';
              el.style.outline = 'none';
            }, 3500);
          }
        }, 500);
      }
    }
  }, [docContent]);

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
          
          // Trigger optimistic update in state
          if (onUpdateBlock) onUpdateBlock(blockId, blockType, plainText, richTextArray);

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
  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length > 0) {
      const prevDoc = undoStackRef.current.pop();
      setDocContent(current => {
        if (current) redoStackRef.current.push(JSON.parse(JSON.stringify(current)));
        if (selectedItem?.id) localStorage.setItem(`notion_page_${selectedItem.id}`, JSON.stringify(prevDoc));
        return prevDoc;
      });
    } else {
      try { document.execCommand('undo'); } catch(e) {}
    }
  }, [selectedItem]);

  const handleRedo = useCallback(() => {
    if (redoStackRef.current.length > 0) {
      const nextDoc = redoStackRef.current.pop();
      setDocContent(current => {
        if (current) undoStackRef.current.push(JSON.parse(JSON.stringify(current)));
        if (selectedItem?.id) localStorage.setItem(`notion_page_${selectedItem.id}`, JSON.stringify(nextDoc));
        return nextDoc;
      });
    } else {
      try { document.execCommand('redo'); } catch(e) {}
    }
  }, [selectedItem]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isZenithMode) {
        setIsZenithMode(false);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key?.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      // Cmd+Z (Undo) and Cmd+Shift+Z / Cmd+Y (Redo)
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isZ = e.key?.toLowerCase() === 'z' || e.code === 'KeyZ';
      const isY = e.key?.toLowerCase() === 'y' || e.code === 'KeyY';

      if (isCmdOrCtrl && isZ) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCmdOrCtrl && isY) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenithMode, handleUndo, handleRedo]);

  const handleDuplicateBlock = async () => {
    const blockId = toolbarRef.current?.dataset.blockId;
    if (!blockId || !selectedItem?.id || !docContent?.blocks) return;

    const targetBlock = docContent.blocks.find(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
    if (!targetBlock) return;
    const type = targetBlock.type;
    // Clone target block's rich_text array directly from state to preserve clean Notion rich text & presets
    const richTextArray = JSON.parse(JSON.stringify(targetBlock[type]?.rich_text || []));
    
    // Create optimistic duplicate block with stable _key
    const tempId = `temp-${Date.now()}`;
    const stableKey = `stable-${Date.now()}-${Math.random()}`;
    const duplicateBlock = {
      id: tempId,
      _key: stableKey,
      type,
      [type]: {
        rich_text: JSON.parse(JSON.stringify(richTextArray)),
        ...(type === 'to_do' ? { checked: targetBlock.to_do?.checked || false } : {})
      }
    };

    // Save history before modifying
    if (docContent) undoStackRef.current.push(docContent);

    // Insert duplicate immediately after targetBlock in local state
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const idx = prev.blocks.findIndex(b => b.id === targetBlock.id);
      if (idx === -1) return prev;
      const updated = [...prev.blocks];
      updated.splice(idx + 1, 0, duplicateBlock);
      return { ...prev, blocks: updated };
    });

    // Hide toolbar
    if (toolbarRef.current) {
      toolbarRef.current.style.opacity = '0';
      toolbarRef.current.style.pointerEvents = 'none';
    }

    // Call API to persist duplicate to Notion
    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: selectedItem.id,
          type,
          afterBlockId: targetBlock.id,
          richTextArray
        })
      });
      if (res.ok) {
        const data = await res.json();
        const createdId = data.response?.results?.[0]?.id;
        if (createdId) {
          setDocContent(prev => {
            if (!prev || !prev.blocks) return prev;
            const updated = prev.blocks.map(b => b.id === tempId ? { ...b, id: createdId } : b);
            return { ...prev, blocks: updated };
          });
        }
      }
    } catch(err) {
      console.error('Failed to duplicate block:', err);
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
    if (docContent) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(docContent)));
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];
    }
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
    
    if (docContent) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(docContent)));
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];
    }

    // Optimistic UI update to feel instant with stable _key
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const stableKey = `stable-${Date.now()}-${Math.random()}`;
    const newBlock = { id: tempId, _key: stableKey, type, last_edited_time: nowIso, created_time: nowIso, [type]: { rich_text: [] } };
    
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const index = prev.blocks.findIndex(b => b.id === currentBlockId || b.id.replace(/-/g, '') === currentBlockId.replace(/-/g, ''));
      if (index === -1) return prev;
      
      const newBlocks = [...prev.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return { ...prev, blocks: newBlocks };
    });

    // Auto-focus the newly created block element
    setTimeout(() => {
      const newEl = document.querySelector(`[data-block-id="${tempId}"]`) || document.querySelector(`#block-${tempId} [contenteditable]`);
      if (newEl) {
        newEl.focus();
        try {
          const sel = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(newEl);
          range.collapse(true);
          sel?.removeAllRanges();
          sel?.addRange(range);
        } catch(err) {}
      }
    }, 60);

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
        const data = await res.json();
        const createdId = data.response?.results?.[0]?.id;
        if (createdId) {
          // Swap tempId with the actual Notion block ID without re-fetching page (preserving typed text)
          setDocContent(prev => {
            if (!prev || !prev.blocks) return prev;
            const newBlocks = prev.blocks.map(b => {
              if (b.id === tempId) {
                return { ...b, id: createdId };
              }
              return b;
            });
            return { ...prev, blocks: newBlocks };
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertBlock = async (blockId, targetType, textContent) => {
    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockId: selectedItem.id, 
          type: targetType, 
          afterBlockId: blockId, 
          richTextArray: [{ text: { content: textContent } }] 
        })
      });
      if (res.ok) {
        await fetch('/api/admin/notion/update', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockId })
        });
        fetchPageContent(selectedItem.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleUpdateBlock = useCallback((blockId, type, content, richTextArray, checked) => {
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      
      // Save history snapshot before modifying
      undoStackRef.current.push(JSON.parse(JSON.stringify(prev)));
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];

      const nowIso = new Date().toISOString();
      const newBlocks = prev.blocks.map(b => {
        if (b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, '')) {
          const updatedBlock = { ...b, last_edited_time: nowIso };
          if (type === 'to_do') {
            updatedBlock.to_do = { ...b.to_do, checked: checked !== undefined ? checked : b.to_do?.checked };
            if (richTextArray) updatedBlock.to_do.rich_text = richTextArray;
            else if (content !== undefined) updatedBlock.to_do.rich_text = [{ text: { content } }];
          } else if (type && updatedBlock[type]) {
            updatedBlock[type] = { ...updatedBlock[type], rich_text: richTextArray || [{ text: { content } }] };
          }
          return updatedBlock;
        }
        return b;
      });
      const newData = { ...prev, blocks: newBlocks };
      if (selectedItem?.id) localStorage.setItem(`notion_page_${selectedItem.id}`, JSON.stringify(newData));
      return newData;
    });
  }, [selectedItem]);

  useEffect(() => {
    const handleCopilotAction = async (e) => {
      const data = e.detail;
      if (data.intent === 'notion_task' && data.payload && docContent?.blocks) {
        const { action, taskText } = data.payload;
        if (action && taskText) {
          // Find the best matching to_do block
          const target = taskText.toLowerCase().trim();
          let bestMatch = null;
          
          for (const block of docContent.blocks) {
            if (block.type === 'to_do') {
              const text = (block.to_do?.rich_text?.map(t => t.plain_text).join('') || '').toLowerCase();
              if (text.includes(target) || target.includes(text)) {
                bestMatch = block;
                break; // exact or substring match
              }
            }
          }

          if (bestMatch) {
            const checked = action === 'check';
            handleUpdateBlock(bestMatch.id, 'to_do', undefined, undefined, checked);
            try {
              await fetch('/api/admin/notion/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockId: bestMatch.id, type: 'to_do', checked })
              });
            } catch(err) {
              console.error('Failed to update task via copilot:', err);
            }
          }
        }
      }
    };
    
    window.addEventListener('copilot-action', handleCopilotAction);
    return () => window.removeEventListener('copilot-action', handleCopilotAction);
  }, [docContent, handleUpdateBlock]);

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


  // Filter Items
  const filteredItems = items.filter(item => {
    if (filterType === 'favorites') {
      return favorites.includes(item.id);
    }
    
    if (filterType === 'main') {
      // Main Pages ONLY (exclude subpages whose parent exists in items)
      const parentId = item.parent?.page_id || item.parent?.database_id;
      if (parentId) {
        const cleanParentId = String(parentId).replace(/-/g, '');
        if (items.some(i => i && i.id && String(i.id).replace(/-/g, '') === cleanParentId)) {
          return false;
        }
      }
      return true;
    }

    if (filterType === 'page') {
      // All Pages (including subpages)
      return item.object === 'page';
    }

    if (filterType === 'database') {
      return item.object === 'database';
    }
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return new Date(b.lastEditedTime || 0) - new Date(a.lastEditedTime || 0);
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

  const sortedBlocks = React.useMemo(() => {
    if (!docContent?.blocks) return [];
    
    // Create a copy to sort
    const blocks = [...docContent.blocks];

    const separateChecked = (list) => {
      const unchecked = [];
      const checked = [];
      for (const b of list) {
        if (b.type === 'to_do' && b.to_do?.checked) {
          checked.push(b);
        } else {
          unchecked.push(b);
        }
      }
      return [...unchecked, ...checked];
    };
    
    if (blockSortBy === 'date') {
      const sorted = blocks.sort((a, b) => new Date(b.last_edited_time || b.created_time || 0) - new Date(a.last_edited_time || a.created_time || 0));
      return separateChecked(sorted);
    } else if (blockSortBy === 'name') {
      const sorted = blocks.sort((a, b) => {
        const getText = (block) => {
          if (block.type === 'child_page') return block.child_page?.title || '';
          if (block.type === 'child_database') return block.child_database?.title || '';
          if (block[block.type]?.rich_text) return block[block.type].rich_text.map(t => t.plain_text).join('');
          return '';
        };
        return getText(a).localeCompare(getText(b));
      });
      return separateChecked(sorted);
    }
    // Default / Manual: group contiguous to-do items and sort them (unchecked first, checked last)
    const result = [];
    let currentToDoGroup = [];

    const flushToDoGroup = () => {
      if (currentToDoGroup.length > 0) {
        currentToDoGroup.sort((a, b) => {
          const aChecked = a.to_do?.checked || false;
          const bChecked = b.to_do?.checked || false;
          if (aChecked === bChecked) return 0;
          return aChecked ? 1 : -1;
        });
        result.push(...currentToDoGroup);
        currentToDoGroup = [];
      }
    };

    for (const block of blocks) {
      if (block.type === 'to_do') {
        currentToDoGroup.push(block);
      } else {
        flushToDoGroup();
        result.push(block);
      }
    }
    flushToDoGroup();
    
    return result;
  }, [docContent?.blocks, blockSortBy]);

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
        
        .blockHoverGroup .blockDeleteBtn {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        .blockHoverGroup:hover .blockDeleteBtn {
          opacity: 1;
          pointer-events: auto;
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
            <button 
              className="notion-font" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onClick={() => {
                const firstPending = docContent?.blocks?.find(b => {
                  if (b.type !== 'to_do' || b.to_do?.checked) return false;
                  const text = (b.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').trim();
                  return text.length > 0;
                });
                if (firstPending) {
                  const el = document.getElementById(`block-${firstPending.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.borderRadius = '12px';
                    el.style.boxShadow = '0 0 35px rgba(235, 215, 63, 0.7)';
                    el.style.outline = '2px solid #ebd73f';
                    setTimeout(() => {
                      el.style.boxShadow = 'none';
                      el.style.outline = 'none';
                    }, 3500);
                  }
                }
              }}
            >
              {(() => {
                const pendingBlocks = docContent?.blocks?.filter(b => {
                  if (b.type !== 'to_do' || b.to_do?.checked) return false;
                  const text = (b.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').trim();
                  return text.length > 0;
                }) || [];
                const pending = pendingBlocks.length;
                if (pending > 0) {
                  return <><AlertCircle size={14} style={{ color: '#ffbd2e' }} /> <span style={{ color: '#ffbd2e' }}>{pending} {pending === 1 ? 'Pending Task' : 'Pending Tasks'}</span></>;
                } else if (docContent?.blocks?.length > 0) {
                  return <><CheckCircle2 size={14} style={{ color: '#27c93f' }} /> <span style={{ color: '#27c93f' }}>Synced</span></>;
                } else {
                  return <><Activity size={14} style={{ color: '#888' }} /> <span style={{ color: '#888' }}>Ready</span></>;
                }
              })()}
            </button>
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

      {/* Main Workspace Layout (Left: Nav, Center: Content) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
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
          maxWidth: 'calc(100vw - 20px)',
          userSelect: 'none',
          WebkitUserSelect: 'none'
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

          {/* Undo / Redo / Duplicate */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); handleUndo(); }}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); handleRedo(); }}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            onMouseDown={(e) => { e.preventDefault(); handleDuplicateBlock(); }}
            title="Duplicate Block"
          >
            <Copy size={14} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Duplicate</span>
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
                detail: { text: `Please explain this text: "${text}"`, blockId, blockType, intent: 'notion_edit' }
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
                detail: { text: `Please summarize this text: "${text}"`, blockId, blockType, intent: 'notion_edit' }
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
              { label: 'Glass Text', value: 'glass' },
              { label: 'Neon Pulse', value: 'neon' },
              { label: 'Iridescent', value: 'iridescent' },
              { label: 'Liquid Gradient', value: 'liquid' },
              { label: 'Gold Shimmer', value: 'highlight' },
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
              <FocusSafeDropdown 
                align="right"
                label={`Sort: ${sortBy === 'name' ? 'Name' : 'Date'}`}
                options={[
                  { label: 'Date (Last Updated)', value: 'date' },
                  { label: 'Name (A-Z)', value: 'name' }
                ]}
                onChange={(val) => setSortBy(val)}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`notion-font filter-chip ${filterType === 'favorites' ? 'active' : ''}`}
                onClick={() => setFilterType('favorites')}
              >
                <Star size={14} fill={filterType === 'favorites' ? '#ebd73f' : 'transparent'} strokeWidth={2.5} style={{ display: 'block', margin: '2px 0' }} />
              </button>
              {[
                { id: 'main', label: 'Main Pages' },
                { id: 'page', label: 'All Pages' },
                { id: 'database', label: 'Databases' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`notion-font filter-chip ${filterType === tab.id ? 'active' : ''}`}
                  onClick={() => setFilterType(tab.id)}
                >
                  {tab.label}
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
                  <FocusSafeDropdown 
                    label={`Sort: ${blockSortBy === 'name' ? 'Name' : blockSortBy === 'date' ? 'Date' : 'Manual'}`}
                    options={[
                      { label: 'Manual (Default)', value: 'manual' },
                      { label: 'Date (Last Updated)', value: 'date' },
                      { label: 'Name (A-Z)', value: 'name' }
                    ]}
                    onChange={(val) => setBlockSortBy(val)}
                  />

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
                                fetchPageContent(selectedItem.id);
                                fetchNotionItems(); // Refresh catalog to see new subpage at top
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
                      {!isCreatingSubpage ? (
                        <button 
                          onClick={async () => {
                            if (!subpageTitle.trim()) return;
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
                                fetchPageContent(selectedItem.id);
                                fetchNotionItems();
                              }
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsCreatingSubpage(false);
                            }
                          }}
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                          <ChevronRight size={14} />
                        </button>
                      ) : (
                        <RefreshCw size={14} className="spin" style={{ color: '#ebd73f', marginRight: '4px' }} />
                      )}
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
                    title="Open Document"
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    <ExternalLink size={16} />
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
                  {sortedBlocks.map((block, i) => (
                    <div key={block._key || block.id} id={`block-${block.id}`} data-block-type={block.type} className="block-enter" style={{ position: 'relative', animationDelay: `${Math.min(i * 0.03, 1)}s` }}>
                      <NotionBlockRenderer 
                        block={block} 
                        setSelectedItem={setSelectedItem} 
                        onDeleteBlock={handleDeleteBlock} 
                        onInsertBlockAfter={handleInsertBlockAfter}
                        onUpdateBlock={handleUpdateBlock} 
                        onConvertBlock={handleConvertBlock}
                      />
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



      </div>
    </div>
  );
}

// --- Utility: Parse HTML to Notion Rich Text ---
function parseHTMLToNotion(htmlNode) {
  if (!htmlNode) return [];
  const richTextArray = [];
  
  function traverse(node, currentAnnotations) {
    if (node.nodeType === 3) { // Node.TEXT_NODE
      const text = node.textContent;
      if (text !== '') {
        richTextArray.push({
          type: 'text',
          text: { content: text },
          plain_text: text,
          annotations: { ...currentAnnotations }
        });
      }
      return;
    }

    if (node.nodeType === 1) { // Node.ELEMENT_NODE
      const annotations = { ...currentAnnotations };
      const tag = node.tagName.toLowerCase();

      // Only extract formatting from inline elements, NOT the root wrapper node
      if (node !== htmlNode) {
        if (tag === 'b' || tag === 'strong') annotations.bold = true;
        if (tag === 'i' || tag === 'em') annotations.italic = true;
        if (tag === 'u') annotations.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del') annotations.strikethrough = true;
        if (tag === 'code') annotations.code = true;

        // Handle color via data-notion-color attribute or preset class names
        if (node.hasAttribute && node.hasAttribute('data-notion-color')) {
          const colorAttr = node.getAttribute('data-notion-color');
          if (colorAttr && colorAttr !== 'default') annotations.color = colorAttr;
        } else if (node.className && typeof node.className === 'string') {
          if (node.className.includes('preset-gold-shimmer')) annotations.color = 'yellow_background';
          else if (node.className.includes('preset-neon-pulse')) annotations.color = 'blue_background';
          else if (node.className.includes('preset-liquid-gradient')) annotations.color = 'purple_background';
          else if (node.className.includes('preset-glass-morphic')) annotations.color = 'brown_background';
          else if (node.className.includes('preset-iridescent')) annotations.color = 'pink_background';
          else if (node.className.includes('preset-redacted')) annotations.color = 'gray_background';
          else if (node.className.includes('preset-cyber-glitch')) annotations.color = 'red_background';
        }
      }

      // If it's a block level element like DIV or BR that causes a newline, we could inject \n
      if (tag === 'br') {
        richTextArray.push({ type: 'text', text: { content: '\n' }, plain_text: '\n', annotations: { ...currentAnnotations } });
        return;
      }
      if (tag === 'div' || tag === 'p') {
        if (richTextArray.length > 0 && richTextArray[richTextArray.length-1].text.content !== '\n') {
          richTextArray.push({ type: 'text', text: { content: '\n' }, plain_text: '\n', annotations: { ...currentAnnotations } });
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
  
  return richTextArray.length > 0 ? richTextArray : [{ text: { content: '' }, plain_text: '' }];
}

// --- Utility: Apply Designer Preset ---
function applyDesignerPreset(presetName, range) {
  if (!range) return;
  if (range.collapsed) return;
  
  // If the selection is purely inside a text node that belongs to a preset span or code block,
  // we must expand the range to encompass the entire wrapper so it can be extracted and cleaned.
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) parent = parent.parentNode;
  const presetSpan = parent.closest('span[data-notion-color], span[class*="preset-"], code');
  
  if (presetSpan) {
    range.selectNode(presetSpan);
  }
  
  let fragment = range.extractContents();
  
  // Clean up any existing preset spans or code elements from the selection to prevent stacking
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(fragment);
  const elementsToClean = tempDiv.querySelectorAll('span[data-notion-color], span[class*="preset-"], code');
  elementsToClean.forEach(el => {
      while (el.firstChild) {
          el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
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
    span.setAttribute('data-notion-color', 'brown_background');
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
    span.setAttribute('data-notion-color', 'pink_background');
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
function EditableTextBlock({ blockId, type, initialRichTextArr, renderRichText, tagName, className, style, emptyPlaceholder, onDeleteBlock, onInsertBlockAfter, onUpdateBlock, onConvertBlock }) {
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const tagRef = useRef(null);
  const isFocusedRef = useRef(false);
  const [slashMenu, setSlashMenu] = useState({ isOpen: false, filter: '', selectedIndex: 0 });

  const MENU_OPTIONS = [
    { type: 'heading_1', label: 'Heading 1', icon: <Heading1 size={16} /> },
    { type: 'heading_2', label: 'Heading 2', icon: <Heading2 size={16} /> },
    { type: 'heading_3', label: 'Heading 3', icon: <Heading3 size={16} /> },
    { type: 'to_do', label: 'To-do List', icon: <CheckSquare size={16} /> },
    { type: 'bulleted_list_item', label: 'Bulleted List', icon: <List size={16} /> },
    { type: 'numbered_list_item', label: 'Numbered List', icon: <ListOrdered size={16} /> },
    { type: 'quote', label: 'Quote', icon: <Quote size={16} /> },
    { type: 'code', label: 'Code', icon: <Code size={16} /> }
  ];

  const filteredOptions = MENU_OPTIONS.filter(o => o.label.toLowerCase().includes(slashMenu.filter) || o.type.includes(slashMenu.filter));

  useEffect(() => {
    // Only reset localText when not focused to avoid disrupting active editing
    if (!isFocusedRef.current) {
      setLocalText(null);
    }
  }, [initialRichTextArr]);

  const rawText = initialRichTextArr?.map(t => t.plain_text || t.text?.content || '').join('') || '';

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = async (targetNode) => {
    isFocusedRef.current = false;
    const el = (targetNode && targetNode.nodeType === 1 ? targetNode : null) || tagRef.current;
    if (!el) return;
    const rawHTML = el.innerHTML;
    // We parse the DOM node itself
    const richTextArray = parseHTMLToNotion(el);
    const plainText = richTextArray.map(r => r.plain_text || r.text?.content || '').join('');
    
    if (plainText === rawText && !rawHTML.includes('<')) return; // Simple diff
    
    setIsSaving(true);
    setLocalText(null);
    if (onUpdateBlock) onUpdateBlock(blockId, type, plainText, richTextArray);
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
    const el = tagRef.current || e?.currentTarget;
    if (slashMenu.isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % filteredOptions.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenu(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + filteredOptions.length) % filteredOptions.length }));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredOptions[slashMenu.selectedIndex];
        if (selected && onConvertBlock) {
          const textWithoutSlash = (el?.innerText || '').replace(/^\/[a-zA-Z]*/, '').trim();
          onConvertBlock(blockId, selected.type, textWithoutSlash);
        }
        setSlashMenu({ isOpen: false, filter: '', selectedIndex: 0 });
        return;
      }
      if (e.key === 'Escape') {
        setSlashMenu(prev => ({ ...prev, isOpen: false }));
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      if (tagRef.current) handleBlur(tagRef.current);
      if (onInsertBlockAfter) {
        onInsertBlockAfter(blockId, 'paragraph');
      }
    }
    if (e.key === 'Backspace' && el && el.innerText.trim() === '') {
      e.preventDefault();
      if (onDeleteBlock) {
        onDeleteBlock(blockId);
      }
    }
  };

  const handleKeyUp = (e) => {
    const el = tagRef.current || e?.currentTarget;
    if (!el) return;
    const text = el.innerText;
    const match = text.match(/^\/([a-zA-Z]*)$/);
    if (match) {
      setSlashMenu(prev => ({ ...prev, isOpen: true, filter: match[1].toLowerCase() }));
    } else {
      setSlashMenu(prev => ({ ...prev, isOpen: false }));
    }
  };

  const Tag = tagName;
  
  return (
    <div 
      className="blockHoverGroup"
      style={{ position: 'relative', width: '100%' }} 
      title="Click to edit"
    >
      {localText !== null ? (
        <Tag
          ref={tagRef}
          data-block-id={blockId}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={() => handleBlur(tagRef.current)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className={`${className} empty-block`}
          data-placeholder={emptyPlaceholder}
          style={{ ...style, outline: 'none', cursor: 'text' }}
          dangerouslySetInnerHTML={{ __html: localText }}
        />
      ) : (
        <Tag
          ref={tagRef}
          data-block-id={blockId}
          contentEditable
          suppressContentEditableWarning
          onFocus={handleFocus}
          onBlur={() => handleBlur(tagRef.current)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className={`${className} empty-block`}
          data-placeholder={emptyPlaceholder}
          style={{ ...style, outline: 'none', cursor: 'text' }}
        >
           {(initialRichTextArr && initialRichTextArr.length > 0) ? renderRichText(initialRichTextArr) : null}
        </Tag>
      )}
      {onDeleteBlock && (
        <button 
          className="blockDeleteBtn"
          onClick={() => onDeleteBlock(blockId)}
          style={{ position: 'absolute', right: '-28px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 8px 8px 16px', display: 'flex', alignItems: 'center' }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          title="Delete Block"
        >
          <Trash2 size={16} />
        </button>
      )}
      {onConvertBlock && type !== 'to_do' && (
        <button 
          className="blockConvertBtn"
          onClick={() => onConvertBlock(blockId, 'to_do', rawText)}
          style={{ position: 'absolute', right: '-60px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 8px 8px 16px', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color = '#ebd73f'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          title="Turn into Checkbox"
        >
          <CheckSquare size={16} />
        </button>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .blockHoverGroup:hover .blockConvertBtn { opacity: 1 !important; }
      `}} />
      {isSaving && <span style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#ebd73f', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>Saving</span>}
      
      {slashMenu.isOpen && filteredOptions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '8px',
          minWidth: '220px',
          zIndex: 50,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginTop: '4px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#888', padding: '4px 8px', marginBottom: '4px', borderBottom: '1px solid #333' }}>
            Basic blocks
          </div>
          {filteredOptions.map((opt, idx) => (
            <div 
              key={opt.type}
              onClick={() => {
                if (onConvertBlock) {
                  const textWithoutSlash = (tagRef.current?.innerText || localText || '').replace(/^\/[a-zA-Z]*/, '').trim();
                  onConvertBlock(blockId, opt.type, textWithoutSlash);
                }
                setSlashMenu({ isOpen: false, filter: '', selectedIndex: 0 });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: idx === slashMenu.selectedIndex ? 'rgba(235, 215, 63, 0.15)' : 'transparent',
                color: idx === slashMenu.selectedIndex ? '#ebd73f' : '#eee',
                transition: 'background 0.1s'
              }}
              onMouseEnter={() => setSlashMenu(prev => ({ ...prev, selectedIndex: idx }))}
            >
              <div style={{ color: idx === slashMenu.selectedIndex ? '#ebd73f' : '#888' }}>{opt.icon}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{opt.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableTodoBlock({ block, renderRichText, onDeleteBlock, onInsertBlockAfter, onUpdateBlock }) {
  const [isChecked, setIsChecked] = useState(block.to_do?.checked);
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const tagRef = useRef(null);
  const isFocusedRef = useRef(false);

  const rawText = block.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '';

  const toggleCheck = async () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    setIsSaving(true);
    if (onUpdateBlock) onUpdateBlock(block.id, 'to_do', undefined, undefined, newChecked);
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

  useEffect(() => {
    // Only reset localText when element is not focused
    if (!isFocusedRef.current) {
      setLocalText(null);
    }
  }, [block.to_do?.rich_text]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = async (targetNode) => {
    isFocusedRef.current = false;
    const el = (targetNode && targetNode.nodeType === 1 ? targetNode : null) || tagRef.current;
    if (!el) return;
    const rawHTML = el.innerHTML;
    const richTextArray = parseHTMLToNotion(el);
    const plainText = richTextArray.map(r => r.plain_text || r.text?.content || '').join('');
    
    if (plainText === rawText && !rawHTML.includes('data-notion-color') && !rawHTML.includes('preset-')) return;
    
    setIsSaving(true);
    setLocalText(null);
    if (onUpdateBlock) onUpdateBlock(block.id, 'to_do', plainText, richTextArray, isChecked);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.id, type: 'to_do', content: plainText, richTextArray })
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    const el = tagRef.current;
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      if (el) handleBlur(el);
      if (onInsertBlockAfter) {
        onInsertBlockAfter(block.id, 'to_do');
      }
    }
    if (e.key === 'Backspace' && el && el.innerText.trim() === '') {
      e.preventDefault();
      if (onDeleteBlock) {
        onDeleteBlock(block.id);
      }
    }
  };

  return (
    <div 
      className="blockHoverGroup"
      style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '4px', marginBottom: '8px', background: isChecked ? 'rgba(255,255,255,0.02)' : 'transparent', padding: '6px', borderRadius: '8px', position: 'relative' }}
    >
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
        ref={tagRef}
        data-block-id={block.id}
        className="notion-font"
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={() => handleBlur(tagRef.current)}
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
      {onDeleteBlock && (
        <button 
          className="blockDeleteBtn"
          onClick={() => onDeleteBlock(block.id)}
          style={{ position: 'absolute', right: '-28px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px 8px 8px 16px', display: 'flex', alignItems: 'center' }}
          onMouseOver={e => e.currentTarget.style.color = '#fff'}
          onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          title="Delete Block"
        >
          <Trash2 size={16} />
        </button>
      )}
      {isSaving && <span style={{ position: 'absolute', right: '-40px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: '#ebd73f', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '10px' }}>Saving</span>}
    </div>
  );
}

// Block Renderer Sub-component
function NotionBlockRenderer({ block, setSelectedItem, onDeleteBlock, onInsertBlockAfter, onUpdateBlock, onConvertBlock }) {
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
        } else if (t.annotations.color === 'blue_background') {
          className += " preset-neon-pulse";
        } else if (t.annotations.color === 'pink_background') {
          className += " preset-iridescent";
        } else if (t.annotations.color === 'brown_background') {
          className += " preset-glass-morphic";
        } else {
          // Map standard Notion colors to dark theme equivalents roughly
          customStyle.color = t.annotations.color.replace('_background', ''); 
        }
      }

      const textContent = t.plain_text || t.text?.content || '';

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
            {textContent}
          </a>
        );
      }
      return (
        <span key={idx} className={className} style={customStyle} data-notion-color={t.annotations?.color}>
          {textContent}
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
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'heading_2':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_2" initialRichTextArr={block.heading_2?.rich_text} renderRichText={renderRichText}
          tagName="h2" className="notion-font" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '28px 0 10px 0', color: '#eee' }}
          emptyPlaceholder="Untitled Heading 2"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'heading_3':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_3" initialRichTextArr={block.heading_3?.rich_text} renderRichText={renderRichText}
          tagName="h3" className="notion-font" style={{ fontSize: '1.25rem', fontWeight: 600, margin: '24px 0 8px 0', color: '#ccc' }}
          emptyPlaceholder="Untitled Heading 3"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'paragraph':
      return (
        <EditableTextBlock
          blockId={block.id} type="paragraph" initialRichTextArr={block.paragraph?.rich_text} renderRichText={renderRichText}
          tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', margin: '4px 0', minHeight: '1.6rem' }}
          emptyPlaceholder="Type '/' for commands"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock} onConvertBlock={onConvertBlock}
        />
      );

    case 'quote':
      return (
        <EditableTextBlock
          blockId={block.id} type="quote" initialRichTextArr={block.quote?.rich_text} renderRichText={renderRichText}
          tagName="blockquote" className="notion-font" 
          style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#ebd73f', margin: '16px 0', padding: '12px 20px', borderLeft: '3px solid #ebd73f', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '0 8px 8px 0' }}
          emptyPlaceholder="Empty quote"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'code':
      return (
        <EditableTextBlock
          blockId={block.id} type="code" initialRichTextArr={block.code?.rich_text} renderRichText={renderRichText}
          tagName="pre" className="notion-font" 
          style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#eee', margin: '16px 0', padding: '16px', background: '#111', borderRadius: '8px', overflowX: 'auto', border: '1px solid #333' }}
          emptyPlaceholder="Code snippet..."
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'bulleted_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#ebd73f', marginTop: '4px', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
          <EditableTextBlock
            blockId={block.id} type="bulleted_list_item" initialRichTextArr={block.bulleted_list_item?.rich_text} renderRichText={renderRichText}
            tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', flex: 1 }}
            emptyPlaceholder="List item"
            onDeleteBlock={onDeleteBlock} onInsertBlockAfter={(id) => onInsertBlockAfter(id, 'bulleted_list_item')} onUpdateBlock={onUpdateBlock}
          />
        </div>
      );

    case 'numbered_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#ebd73f', marginTop: '2px', fontSize: '0.9rem', fontWeight: 600 }}>1.</span>
          <EditableTextBlock
            blockId={block.id} type="numbered_list_item" initialRichTextArr={block.numbered_list_item?.rich_text} renderRichText={renderRichText}
            tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', flex: 1 }}
            emptyPlaceholder="Numbered item"
            onDeleteBlock={onDeleteBlock} onInsertBlockAfter={(id) => onInsertBlockAfter(id, 'numbered_list_item')} onUpdateBlock={onUpdateBlock}
          />
        </div>
      );

    case 'to_do':
      return <EditableTodoBlock block={block} renderRichText={renderRichText} onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock} />;

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
                if (window.confirm(`Are you sure you want to delete "${childTitle || 'Untitled'}"? This will archive the page in your workspace.`)) {
                  onDeleteBlock(block.id);
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#888',
                borderRadius: '10px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = '#888';
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
