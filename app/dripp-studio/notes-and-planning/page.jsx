'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, ChevronLeft,
  FileText, Database, CheckSquare, Sparkles, Info, LayoutList, Plus, Maximize2, Minimize2, Star,
  List, ListOrdered, Type, Heading1, Heading2, Heading3, Quote, Code, ToggleLeft,
  Home, Command, Activity, CheckCircle2, AlertCircle, Trash2, Undo2, Redo2, Copy, MoreHorizontal, Layers
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';
import { 
  LottieCheck, 
  LottiePulse, 
  LottieSparkles, 
  LottieStar, 
  LottieEmptyState 
} from '../components/LottieMicroAnimations';

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
          height: '100%',
          fontFamily: "'Clash Display', sans-serif"
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
          background: 'linear-gradient(135deg, rgba(24, 24, 28, 0.98) 0%, rgba(12, 12, 16, 0.98) 100%)',
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
          WebkitUserSelect: 'none',
          fontFamily: "'Clash Display', sans-serif"
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
                justifyContent: 'space-between',
                fontFamily: "'Clash Display', sans-serif"
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

  // Mobile View Navigation State: 'catalog' | 'reader'
  const [mobileView, setMobileView] = useState('catalog');
  
  // Scroll progress for the viewer
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef(null);
  const searchInputRef = useRef(null);
  const latestPageIdRef = useRef(null);
  const savedRangeRef = useRef(null);

  // Zenith Mode State
  const [isZenithMode, setIsZenithMode] = useState(false);

  // Floating Toolbar Ref
  const toolbarRef = useRef(null);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  // Subpage Creation State
  const [showSubpageInput, setShowSubpageInput] = useState(false);
  const [subpageTitle, setSubpageTitle] = useState('');
  const [isCreatingSubpage, setIsCreatingSubpage] = useState(false);

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
              setMobileView('reader');
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
    const cachedRaw = localStorage.getItem(cacheKey);
    let cachedData = null;
    
    if (cachedRaw) {
      try {
        const parsed = JSON.parse(cachedRaw);
        if (parsed && parsed.blocks && parsed.blocks.length > 0) {
          cachedData = parsed;
          setDocContent(parsed);
        }
      } catch(e) {}
    }
    
    if (!cachedData) {
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
    if (selectedItem?.id) {
      fetchPageContent(selectedItem.id);
    }
  }, [selectedItem, fetchPageContent]);

  useEffect(() => {
    fetchNotionItems();
    
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
        setMobileView('reader');
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
    if (e && e.stopPropagation) e.stopPropagation();
    const newFavs = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('notion_favorites', JSON.stringify(newFavs));
  };

  const handleUpdateBlock = useCallback((blockId, type, content, richTextArray, checked) => {
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      
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
          const plainText = richTextArray.map(r => r.plain_text || r.text?.content || '').join('');
          
          blockEl.innerHTML = '';
          handleUpdateBlock(blockId, blockType, plainText, richTextArray);

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

    let richTextArray = [];
    const blockEl = document.querySelector(`#block-${blockId} [contenteditable="true"]`);
    if (blockEl) {
      richTextArray = parseHTMLToNotion(blockEl);
      blockEl.innerHTML = '';
    } else {
      const block = docContent?.blocks?.find(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
      richTextArray = block?.[currentType]?.rich_text || [];
    }

    const nowIso = new Date().toISOString();
    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const index = prev.blocks.findIndex(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
      if (index === -1) return prev;
      const updated = [...prev.blocks];
      updated[index] = {
        ...updated[index],
        type: newType,
        last_edited_time: nowIso,
        [newType]: newType === 'to_do' ? { rich_text: richTextArray, checked: false } : { rich_text: richTextArray }
      };
      return { ...prev, blocks: updated };
    });

    try {
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
        if (newBlockId) {
          setDocContent(prev => {
            if (!prev || !prev.blocks) return prev;
            const updated = prev.blocks.map(b => (b.id === blockId ? { ...b, id: newBlockId } : b));
            return { ...prev, blocks: updated };
          });
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleAppendBlock = async (type) => {
    if (!selectedItem?.id) return;
    setIsAppendingBlock(true);
    setShowAddBlockMenu(false);

    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;
    const stableKey = `stable-${Date.now()}-${Math.random()}`;
    const newBlock = { id: tempId, _key: stableKey, type, last_edited_time: nowIso, created_time: nowIso, [type]: { rich_text: [] } };

    setDocContent(prev => {
      if (!prev) return { blocks: [newBlock] };
      return { ...prev, blocks: [...(prev.blocks || []), newBlock] };
    });

    if (contentRef.current) {
      setTimeout(() => {
        contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    }

    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: selectedItem.id, type })
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsAppendingBlock(false);
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
    const richTextArray = JSON.parse(JSON.stringify(targetBlock[type]?.rich_text || []));
    
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

    if (docContent) undoStackRef.current.push(docContent);

    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const idx = prev.blocks.findIndex(b => b.id === targetBlock.id);
      if (idx === -1) return prev;
      const updated = [...prev.blocks];
      updated.splice(idx + 1, 0, duplicateBlock);
      return { ...prev, blocks: updated };
    });

    if (toolbarRef.current) {
      toolbarRef.current.style.opacity = '0';
      toolbarRef.current.style.pointerEvents = 'none';
    }

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

  const handleDeleteBlock = async (blockId) => {
    if (docContent) {
      undoStackRef.current.push(JSON.parse(JSON.stringify(docContent)));
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      redoStackRef.current = [];
    }

    let prevBlockId = null;
    if (docContent?.blocks) {
      const idx = docContent.blocks.findIndex(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
      if (idx > 0) {
        prevBlockId = docContent.blocks[idx - 1].id;
      }
    }

    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      return {
        ...prev,
        blocks: prev.blocks.filter(b => b.id !== blockId && b.id.replace(/-/g, '') !== blockId.replace(/-/g, ''))
      };
    });

    if (prevBlockId) {
      setTimeout(() => {
        const prevEl = document.querySelector(`[data-block-id="${prevBlockId}"]`) || document.querySelector(`#block-${prevBlockId} [contenteditable]`);
        if (prevEl) {
          prevEl.focus();
          try {
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(prevEl);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          } catch(err) {}
        }
      }, 50);
    }

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
    if (!selectedItem?.id) return;
    const richTextArray = [{ type: 'text', text: { content: textContent }, plain_text: textContent }];
    const nowIso = new Date().toISOString();

    setDocContent(prev => {
      if (!prev || !prev.blocks) return prev;
      const index = prev.blocks.findIndex(b => b.id === blockId || b.id.replace(/-/g, '') === blockId.replace(/-/g, ''));
      if (index === -1) return prev;
      const newBlocks = [...prev.blocks];
      newBlocks[index] = {
        ...newBlocks[index],
        type: targetType,
        last_edited_time: nowIso,
        [targetType]: targetType === 'to_do' ? { rich_text: richTextArray, checked: false } : { rich_text: richTextArray }
      };
      return { ...prev, blocks: newBlocks };
    });

    try {
      const res = await fetch('/api/admin/notion/append', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockId: selectedItem.id, 
          type: targetType, 
          afterBlockId: blockId, 
          richTextArray 
        })
      });
      if (res.ok) {
        const data = await res.json();
        const createdId = data.response?.results?.[0]?.id;
        await fetch('/api/admin/notion/update', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockId })
        });
        if (createdId) {
          setDocContent(prev => {
            if (!prev || !prev.blocks) return prev;
            const newBlocks = prev.blocks.map(b => (b.id === blockId ? { ...b, id: createdId } : b));
            return { ...prev, blocks: newBlocks };
          });
        }
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleCopilotAction = async (e) => {
      const data = e.detail;
      if (data.intent === 'notion_task' && data.payload && docContent?.blocks) {
        const { action, taskText } = data.payload;
        if (action && taskText) {
          const target = taskText.toLowerCase().trim();
          let bestMatch = null;
          
          for (const block of docContent.blocks) {
            if (block.type === 'to_do') {
              const text = (block.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').toLowerCase();
              if (text.includes(target) || target.includes(text)) {
                bestMatch = block;
                break;
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
          const isMobile = window.innerWidth <= 1024;
          
          if (isMobile) {
            // On mobile, position docked above keyboard or at bottom
            toolbarRef.current.style.top = 'auto';
            toolbarRef.current.style.bottom = '20px';
            toolbarRef.current.style.left = '8px';
            toolbarRef.current.style.right = '8px';
            toolbarRef.current.style.width = 'auto';
          } else {
            const toolbarWidth = toolbarRef.current.offsetWidth || 600;
            const toolbarHeight = toolbarRef.current.offsetHeight || 70;
            
            let top = rect.top - toolbarHeight - 15;
            let left = rect.left + (rect.width / 2) - (toolbarWidth / 2);
            
            if (top < 10) top = rect.bottom + 15;
            if (left < 10) {
              left = 10;
            } else if (left + toolbarWidth > window.innerWidth - 10) {
              left = window.innerWidth - toolbarWidth - 10;
            }
            
            toolbarRef.current.style.top = `${top}px`;
            toolbarRef.current.style.bottom = 'auto';
            toolbarRef.current.style.left = `${left}px`;
            toolbarRef.current.style.right = 'auto';
          }

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
          if (block[block.type]?.rich_text) return block[block.type].rich_text.map(t => t.plain_text || t.text?.content || '').join('');
          return '';
        };
        return getText(a).localeCompare(getText(b));
      });
      return separateChecked(sorted);
    }
    
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
          background: rgba(235, 215, 63, 0.4);
          color: #fff;
        }
        ::-moz-selection {
          background: rgba(235, 215, 63, 0.4);
          color: #fff;
        }
        
        .notion-font {
          font-family: 'Clash Display', sans-serif !important;
        }

        .notion-font-heading {
          font-family: 'Panchang', sans-serif !important;
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
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(235, 215, 63, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(235, 215, 63, 0.5); }

        .notion-glass-card {
          background: rgba(12, 12, 16, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
          align-items: center;
          gap: 14px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          touch-action: manipulation;
        }
        .notion-item-btn:active {
          transform: scale(0.98);
        }
        .notion-item-active {
          background: rgba(235, 215, 63, 0.08) !important;
          border-color: rgba(235, 215, 63, 0.25) !important;
          box-shadow: 0 8px 24px rgba(235, 215, 63, 0.06);
        }
        .notion-item-btn:hover:not(.notion-item-active) {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
          transform: translateX(4px);
        }

        .filter-chip {
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: #888;
          white-space: nowrap;
          touch-action: manipulation;
          font-family: 'Clash Display', sans-serif;
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
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(10px); }
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

        /* Desktop & Mobile Responsive Styles */
        .notes-workspace-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          padding: 24px 32px;
          flex: 1;
          max-width: 1800px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .mobile-tab-bar {
          display: none;
        }

        @media (max-width: 1024px) {
          .notes-workspace-grid {
            grid-template-columns: 1fr !important;
            padding: 8px 6px !important;
            gap: 12px !important;
          }

          .notes-header-top {
            padding: 12px 14px !important;
            gap: 10px !important;
          }

          .notes-catalog-column.mobile-col-hidden,
          .notes-reader-column.mobile-col-hidden {
            display: none !important;
          }

          .notes-catalog-column.mobile-col-active,
          .notes-reader-column.mobile-col-active {
            display: flex !important;
            height: calc(100vh - 135px) !important;
          }

          .mobile-tab-bar {
            display: flex;
            align-items: center;
            background: rgba(16, 16, 20, 0.9);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 4px;
            margin: 6px 8px;
            gap: 4px;
          }

          .mobile-tab-btn {
            flex: 1;
            padding: 8px 12px;
            border-radius: 10px;
            background: transparent;
            border: none;
            color: #888;
            font-size: 0.8rem;
            font-weight: 600;
            font-family: 'Clash Display', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .mobile-tab-btn.active {
            background: rgba(235, 215, 63, 0.15);
            color: #ebd73f;
            border: 1px solid rgba(235, 215, 63, 0.3);
          }

          .notes-reader-pad {
            padding: 20px 16px !important;
          }

          .mobile-editor-topbar {
            display: flex !important;
          }

          .notes-floating-toolbar {
            max-width: 92vw !important;
            overflow-x: auto !important;
            scrollbar-width: none !important;
          }
        }

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

        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* Top Header */}
      <header className="notes-header-top" style={{
        padding: '14px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Dynamic Breadcrumbs & Mobile Back Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
          {mobileView === 'reader' && (
            <button
              onClick={() => setMobileView('catalog')}
              className="notion-font"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'rgba(235, 215, 63, 0.12)',
                border: '1px solid rgba(235, 215, 63, 0.25)',
                borderRadius: '8px',
                color: '#ebd73f',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginRight: '4px'
              }}
            >
              <ChevronLeft size={16} /> Catalog
            </button>
          )}

          <button 
            onClick={() => { setSelectedItem(null); setMobileView('catalog'); }}
            className="notion-font"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: selectedItem ? '#888' : '#ebd73f', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, transition: 'color 0.2s', whiteSpace: 'nowrap' }}
            onMouseOver={e => e.currentTarget.style.color = '#ebd73f'}
            onMouseOut={e => e.currentTarget.style.color = selectedItem ? '#888' : '#ebd73f'}
          >
            <Home size={14} /> Catalog
          </button>
          
          {selectedItem && getBreadcrumbs(selectedItem).slice(-2).map((crumb, idx, arr) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} style={{ color: '#555', flexShrink: 0 }} />
              {idx === arr.length - 1 ? (
                <span className="notion-font" style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {crumb.object === 'database' ? <Database size={14} style={{ color: '#ebd73f', flexShrink: 0 }} /> : <FileText size={14} style={{ color: '#ebd73f', flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{crumb.title}</span>
                </span>
              ) : (
                <button 
                  onClick={() => { setSelectedItem(crumb); setMobileView('reader'); }}
                  className="notion-font"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, transition: 'color 0.2s', padding: 0, whiteSpace: 'nowrap' }}
                  onMouseOver={e => e.currentTarget.style.color = '#ebd73f'}
                  onMouseOut={e => e.currentTarget.style.color = '#888'}
                >
                  {crumb.title}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Omnibar & Status Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Workspace Pulse Indicator */}
          {selectedItem && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#aaa' }}>
              {(() => {
                const pendingBlocks = docContent?.blocks?.filter(b => {
                  if (b.type !== 'to_do' || b.to_do?.checked) return false;
                  const text = (b.to_do?.rich_text?.map(t => t.plain_text || t.text?.content || '').join('') || '').trim();
                  return text.length > 0;
                }) || [];
                const pending = pendingBlocks.length;
                if (pending > 0) {
                  return <><LottiePulse status="pending" size={14} /><span style={{ color: '#ebd73f' }}>{pending} Pending</span></>;
                } else if (docContent?.blocks?.length > 0) {
                  return <><LottiePulse status="synced" size={14} /><span style={{ color: '#27c93f' }}>Synced</span></>;
                } else {
                  return <><LottiePulse status="ready" size={14} /><span>Ready</span></>;
                }
              })()}
            </div>
          )}

          {/* Quick Refresh */}
          <button
            onClick={() => fetchNotionItems(searchQuery)}
            disabled={loading}
            className="notion-font"
            style={{
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              touchAction: 'manipulation'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
            title="Refresh Notes"
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </button>
        </div>
      </header>

      {/* Mobile Segmented Control Tab Bar (Visible on <= 1024px) */}
      <div className="mobile-tab-bar">
        <button
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`mobile-tab-btn ${mobileView === 'catalog' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          <span>Catalog ({filteredItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedItem) setMobileView('reader');
          }}
          disabled={!selectedItem}
          className={`mobile-tab-btn ${mobileView === 'reader' ? 'active' : ''}`}
          style={{ opacity: selectedItem ? 1 : 0.4 }}
        >
          <FileText size={16} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedItem?.title || 'Note Editor'}
          </span>
        </button>
      </div>

      {/* Main Workspace Layout (Desktop: 2-Col Grid / Mobile: Tabbed Switcher) */}
      <div className="notes-workspace-grid">
        
        {/* Floating Selection Toolbar */}
        <div ref={toolbarRef} className="notes-floating-toolbar" style={{
          position: 'fixed',
          background: 'linear-gradient(135deg, rgba(26, 26, 32, 0.96) 0%, rgba(12, 12, 16, 0.98) 100%)',
          backdropFilter: 'blur(30px) saturate(140%)',
          WebkitBackdropFilter: 'blur(30px) saturate(140%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '16px',
          padding: '8px 12px',
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10000,
          boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 20px 40px rgba(0,0,0,0.7)',
          opacity: 0,
          transform: 'scale(0.95) translateY(5px)',
          pointerEvents: 'none',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: 'calc(100vw - 20px)',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}>

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

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          {/* Undo / Redo / Duplicate */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
            onMouseDown={(e) => { e.preventDefault(); handleUndo(); }}
            title="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
            onMouseDown={(e) => { e.preventDefault(); handleRedo(); }}
            title="Redo"
          >
            <Redo2 size={16} />
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onMouseDown={(e) => { e.preventDefault(); handleDuplicateBlock(); }}
            title="Duplicate Block"
          >
            <Copy size={14} />
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          {/* Formatting */}
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800 }}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
            title="Bold"
          >
            B
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'serif' }}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
            title="Italic"
          >
            I
          </button>
          <button className="notion-font" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', borderRadius: '8px', fontSize: '0.9rem', textDecoration: 'line-through' }}
            onMouseDown={(e) => { e.preventDefault(); document.execCommand('strikeThrough'); }}
            title="Strikethrough"
          >
            S
          </button>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          {/* AI Tools */}
          <button className="notion-font" style={{ background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.25)', color: '#ebd73f', cursor: 'pointer', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => {
              const text = window.getSelection().toString().trim();
              const blockId = toolbarRef.current?.dataset.blockId;
              const blockType = toolbarRef.current?.dataset.blockType;
              window.dispatchEvent(new CustomEvent('ORLO_QUICK_ACTION', { 
                detail: { text: `Please explain this text: "${text}"`, blockId, blockType, intent: 'notion_edit' }
              }));
            }}
          >
            <LottieSparkles size={14} /> Ask Orlo
          </button>

          <FocusSafeDropdown 
            label="Presets"
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
        <div className={`notion-glass-card notes-catalog-column ${mobileView === 'catalog' ? 'mobile-col-active' : 'mobile-col-hidden'}`} style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          overflow: 'hidden'
        }}>
          {/* Catalog Search & Filters Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
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

            {/* Responsive Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', marginBottom: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', zIndex: 2 }} />
              <input
                ref={searchInputRef}
                type="text"
                className="notion-font"
                placeholder="Search notes or plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Clash Display', sans-serif"
                }}
              />
            </form>
            
            {/* Horizontal Momentum Filter Chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
              <button
                className={`notion-font filter-chip ${filterType === 'favorites' ? 'active' : ''}`}
                onClick={() => setFilterType('favorites')}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Star size={14} fill={filterType === 'favorites' ? '#ebd73f' : 'transparent'} strokeWidth={2.5} />
                <span>Favs</span>
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

          {/* Catalog Document List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {loading && items.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="shimmer" style={{ height: '64px', borderRadius: '14px', marginBottom: '8px' }} />
              ))
            ) : filteredItems.length === 0 ? (
              <LottieEmptyState 
                title="No Notes Found" 
                subtitle="Try adjusting your filter or create a new page."
              />
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setMobileView('reader');
                    }}
                    className={`notion-font notion-item-btn ${isSelected ? 'notion-item-active' : ''}`}
                  >
                    <span style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', opacity: isSelected ? 1 : 0.75, flexShrink: 0 }}>
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
                        marginBottom: '3px',
                        fontFamily: "'Clash Display', sans-serif"
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#777', fontWeight: 500 }}>
                        {item.lastEditedTime ? new Date(item.lastEditedTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent'} 
                        {' • '} <span style={{ textTransform: 'capitalize' }}>{item.object}</span>
                      </div>
                    </div>

                    <LottieStar
                      isFavorite={favorites.includes(item.id)}
                      onToggle={(e) => toggleFavorite(e, item.id)}
                      size={18}
                    />

                    <ChevronRight size={16} style={{ color: isSelected ? '#ebd73f' : '#444', transform: isSelected ? 'translateX(2px)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER/RIGHT PANEL: Main Reader & Editor */}
        <div className={`notes-reader-column ${isZenithMode ? "" : "notion-glass-card"} ${mobileView === 'reader' ? 'mobile-col-active' : 'mobile-col-hidden'}`} style={isZenithMode ? {
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
          padding: isZenithMode ? '40px 0 0 0' : '0'
        }}>
          {selectedItem ? (
            <div 
              className={`notes-reader-pad ${isZenithMode ? "" : "notion-glass-card"}`} 
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
                padding: '36px 40px',
                boxSizing: 'border-box'
              }}
            >
              {/* Reading Progress Bar */}
              {selectedItem && (
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
                  <div style={{ width: `${scrollProgress}%`, height: '100%', background: '#ebd73f', transition: 'width 0.1s ease-out', boxShadow: '0 0 10px #ebd73f' }} />
                </div>
              )}

              {/* Mobile Dedicated Back & Quick Action Topbar */}
              <div className="mobile-editor-topbar" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  onClick={() => setMobileView('catalog')}
                  className="notion-font"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(235, 215, 63, 0.12)',
                    border: '1px solid rgba(235, 215, 63, 0.3)',
                    borderRadius: '10px',
                    color: '#ebd73f',
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  <ChevronLeft size={18} />
                  <span>All Notes</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddBlockMenu(!showAddBlockMenu)}
                    className="notion-font"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: showAddBlockMenu ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      border: `1px solid ${showAddBlockMenu ? '#ebd73f' : 'rgba(255, 255, 255, 0.12)'}`,
                      borderRadius: '10px',
                      color: showAddBlockMenu ? '#ebd73f' : '#fff',
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} /> Block
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              {docContent?.page?.cover && (
                <div style={{
                  height: '160px',
                  width: '100%',
                  borderRadius: '16px',
                  backgroundImage: `url(${docContent.page.cover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '24px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }} />
              )}

              {/* Document Header Info & Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))', flexShrink: 0 }}>
                    {docContent?.page?.icon || selectedItem.icon || '📄'}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h1 
                        className="notion-font" 
                        contentEditable
                        suppressContentEditableWarning
                        style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', outline: 'none', fontFamily: "'Panchang', sans-serif" }}
                        onBlur={async (e) => {
                          const newTitle = e.target.innerText.trim();
                          if (newTitle && newTitle !== (docContent?.page?.title || selectedItem.title)) {
                            setSelectedItem(prev => ({ ...prev, title: newTitle }));
                            setItems(prevItems => prevItems.map(item => item.id === selectedItem.id ? { ...item, title: newTitle } : item));
                            if (docContent?.page) setDocContent(prev => ({ ...prev, page: { ...prev.page, title: newTitle } }));
                            
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

                      <LottieStar
                        isFavorite={favorites.includes(selectedItem.id)}
                        onToggle={(e) => toggleFavorite(e, selectedItem.id)}
                        size={22}
                      />
                    </div>
                    <p className="notion-font" style={{ fontSize: '0.82rem', color: '#777', margin: '4px 0 0 0', fontWeight: 500 }}>
                      Updated: <span style={{ color: '#aaa' }}>{selectedItem.lastEditedTime ? new Date(selectedItem.lastEditedTime).toLocaleDateString() : 'Recent'}</span>
                    </p>
                  </div>
                </div>

                {/* Toolbar Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                                fetchNotionItems();
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
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '4px 8px', outline: 'none', width: '130px', fontSize: '0.85rem' }}
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
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} /> Subpage
                    </button>
                  )}

                  <button
                    onClick={() => setIsZenithMode(!isZenithMode)}
                    title={isZenithMode ? "Exit Focus Mode (Esc)" : "Zenith Focus Mode"}
                    className="notion-font"
                    style={{
                      padding: '8px 12px',
                      background: isZenithMode ? 'rgba(235, 215, 63, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderColor: isZenithMode ? 'rgba(235, 215, 63, 0.3)' : 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: isZenithMode ? '#ebd73f' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isZenithMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>

                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="notion-font"
                    title="Open in Notion"
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>

              {/* Rendered Content Blocks */}
              {contentLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                  <div className="shimmer block-enter" style={{ height: '36px', width: '50%', borderRadius: '8px' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '100%', borderRadius: '4px' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '85%', borderRadius: '4px' }} />
                  <div className="shimmer block-enter" style={{ height: '20px', width: '92%', borderRadius: '4px' }} />
                </div>
              ) : docContent?.blocks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '60px' }}>
                  {sortedBlocks.map((block, i) => (
                    <div key={block._key || block.id} id={`block-${block.id}`} data-block-type={block.type} className="block-enter" style={{ position: 'relative', animationDelay: `${Math.min(i * 0.02, 0.5)}s` }}>
                      <NotionBlockRenderer 
                        block={block} 
                        setSelectedItem={(item) => {
                          setSelectedItem(item);
                          setMobileView('reader');
                        }}
                        onDeleteBlock={handleDeleteBlock} 
                        onInsertBlockAfter={handleInsertBlockAfter}
                        onUpdateBlock={handleUpdateBlock} 
                        onConvertBlock={handleConvertBlock}
                      />
                    </div>
                  ))}
                  
                  {/* Insert Block Trigger */}
                  <div style={{ position: 'relative', marginTop: '16px' }}>
                    {showAddBlockMenu ? (
                      <div className="notion-glass-card block-enter" style={{ padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', border: '1px solid rgba(235, 215, 63, 0.3)' }}>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <span className="notion-font" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase' }}>Insert Block</span>
                          <button onClick={() => setShowAddBlockMenu(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
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
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', touchAction: 'manipulation' }}
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', color: '#888', cursor: 'pointer', width: '100%', transition: 'all 0.2s', marginTop: '8px', touchAction: 'manipulation' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                      >
                        <Plus size={16} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Add a block</span>
                        {isAppendingBlock && <RefreshCw size={14} className="spin" style={{ marginLeft: 'auto' }} />}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <LottieEmptyState 
                  title="Empty Document" 
                  subtitle="This document has no content blocks yet. Create your first block below."
                  actionLabel="+ Create First Block"
                  onAction={() => handleAppendBlock('paragraph')}
                />
              )}
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#777', maxWidth: '420px', padding: '40px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(235, 215, 63, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                <BookOpen size={40} style={{ color: '#ebd73f' }} />
              </div>
              <h3 className="notion-font" style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 12px 0', color: '#fff', fontFamily: "'Panchang', sans-serif" }}>Select a Document</h3>
              <p className="notion-font" style={{ fontSize: '0.9rem', color: '#888', lineHeight: 1.6, fontFamily: "'Clash Display', sans-serif" }}>
                Choose any note, database, or plan from the catalog to read and edit live blocks.
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
    if (node.nodeType === 3) {
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

    if (node.nodeType === 1) {
      const annotations = { ...currentAnnotations };
      const tag = node.tagName.toLowerCase();

      if (node !== htmlNode) {
        if (tag === 'b' || tag === 'strong') annotations.bold = true;
        if (tag === 'i' || tag === 'em') annotations.italic = true;
        if (tag === 'u') annotations.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del') annotations.strikethrough = true;
        if (tag === 'code') annotations.code = true;

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
        }
      }

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
  
  let fragment = range.extractContents();
  
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

// --- Utility: Render Notion Rich Text to HTML String ---
function renderRichTextToHTML(richTextArr) {
  if (!richTextArr || richTextArr.length === 0) return '';
  return richTextArr.map((t) => {
    if (!t || typeof t !== 'object') return '';
    let className = "notion-font";
    let styleStr = "";
    if (t.annotations?.bold) styleStr += "font-weight:800;";
    if (t.annotations?.italic) styleStr += "font-style:italic;";
    if (t.annotations?.strikethrough) styleStr += "text-decoration:line-through;";
    if (t.annotations?.underline) styleStr += "text-decoration:underline;";
    
    if (t.annotations?.color && t.annotations.color !== 'default') {
      if (t.annotations.color === 'red_background') {
        styleStr += "color:#ff4d4d;background:rgba(255,77,77,0.15);padding:2px 4px;border-radius:4px;";
      } else if (t.annotations.color === 'green_background') {
        styleStr += "color:#52c41a;background-color:rgba(82, 196, 26, 0.2);";
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
      } else if (typeof t.annotations.color === 'string') {
        styleStr += `color:${t.annotations.color.replace('_background', '')};`;
      }
    }

    const textContent = t.plain_text || t.text?.content || '';
    const escapedText = String(textContent)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const colorAttr = t.annotations?.color ? ` data-notion-color="${t.annotations.color}"` : '';

    if (t.href) {
      return `<a href="${t.href}" target="_blank" rel="noopener noreferrer" class="${className}" style="${styleStr}color:#ebd73f;text-decoration:underline;text-underline-offset:4px;">${escapedText}</a>`;
    }
    return `<span class="${className}" style="${styleStr}"${colorAttr}>${escapedText}</span>`;
  }).join('');
}

// --- Inline Editing Text Block ---
function EditableTextBlock({ blockId, type, initialRichTextArr, tagName, className, style, emptyPlaceholder, onDeleteBlock, onInsertBlockAfter, onUpdateBlock, onConvertBlock }) {
  const [localText, setLocalText] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const tagRef = useRef(null);
  const isFocusedRef = useRef(false);
  const [slashMenu, setSlashMenu] = useState({ isOpen: false, filter: '', selectedIndex: 0 });
  const [showMobileActions, setShowMobileActions] = useState(false);

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
    setLocalText(null);
  }, [initialRichTextArr]);

  const rawText = initialRichTextArr?.map(t => t.plain_text || t.text?.content || '').join('') || '';

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    const el = tagRef.current || e?.currentTarget;
    if (el) {
      el.dataset.focusHtml = el.innerHTML;
    }
  };

  const handleBlur = async (targetNode) => {
    isFocusedRef.current = false;
    const el = (targetNode && targetNode.nodeType === 1 ? targetNode : null) || tagRef.current;
    if (!el) return;
    const rawHTML = el.innerHTML;
    const focusHtml = el.dataset.focusHtml;
    
    const richTextArray = parseHTMLToNotion(el);
    const plainText = richTextArray.map(r => r.plain_text || r.text?.content || '').join('');
    
    if (focusHtml === rawHTML) return;

    setIsSaving(true);
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

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
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
  const htmlContent = renderRichTextToHTML(initialRichTextArr);
  
  return (
    <div 
      className="blockHoverGroup"
      style={{ position: 'relative', width: '100%' }} 
      title="Tap to edit"
    >
      <Tag
        ref={tagRef}
        data-block-id={blockId}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={() => handleBlur(tagRef.current)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        className={`${className} empty-block`}
        data-placeholder={emptyPlaceholder}
        style={{ ...style, outline: 'none', cursor: 'text', fontFamily: tagName.startsWith('h') ? "'Panchang', sans-serif" : "'Clash Display', sans-serif" }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      
      {/* Desktop Hover Delete */}
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
          <div style={{ fontSize: '0.75rem', color: '#888', padding: '4px 8px', marginBottom: '4px', borderBottom: '1px solid #333', fontFamily: "'Clash Display', sans-serif" }}>
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
                transition: 'background 0.1s',
                fontFamily: "'Clash Display', sans-serif"
              }}
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

// --- Inline Editing To-Do Block with Lottie ---
function EditableTodoBlock({ block, onDeleteBlock, onInsertBlockAfter, onUpdateBlock }) {
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
    setIsChecked(block.to_do?.checked || false);
  }, [block.to_do?.checked]);

  useEffect(() => {
    setLocalText(null);
  }, [block.to_do?.rich_text]);

  const handleFocus = (e) => {
    isFocusedRef.current = true;
    const el = tagRef.current || e?.currentTarget;
    if (el) {
      el.dataset.focusHtml = el.innerHTML;
    }
  };

  const handleBlur = async (targetNode) => {
    isFocusedRef.current = false;
    const el = (targetNode && targetNode.nodeType === 1 ? targetNode : null) || tagRef.current;
    if (!el) return;
    const rawHTML = el.innerHTML;
    const focusHtml = el.dataset.focusHtml;
    const richTextArray = parseHTMLToNotion(el);
    const plainText = richTextArray.map(r => r.plain_text || r.text?.content || '').join('');
    
    if (focusHtml === rawHTML) return;

    setIsSaving(true);
    if (onUpdateBlock) onUpdateBlock(block.id, 'to_do', plainText, richTextArray, isChecked);
    try {
      await fetch('/api/admin/notion/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId: block.id, type: 'to_do', content: plainText, richTextArray, checked: isChecked })
      });
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    const el = tagRef.current;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      toggleCheck();
      return;
    }
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

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div 
      className="blockHoverGroup"
      style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', paddingLeft: '4px', marginBottom: '8px', background: isChecked ? 'rgba(255,255,255,0.02)' : 'transparent', padding: '6px 8px', borderRadius: '10px', position: 'relative' }}
    >
      <LottieCheck
        checked={isChecked}
        onToggle={toggleCheck}
        size={22}
      />
      
      <div 
        ref={tagRef}
        data-block-id={block.id}
        className="notion-font"
        contentEditable
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={() => handleBlur(tagRef.current)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{
          fontSize: '0.98rem', lineHeight: 1.6,
          color: isChecked ? '#777' : '#eee',
          textDecoration: isChecked ? 'line-through' : 'none',
          transition: 'all 0.2s', outline: 'none', cursor: 'text', flex: 1,
          fontFamily: "'Clash Display', sans-serif"
        }}
        dangerouslySetInnerHTML={{ __html: renderRichTextToHTML(block.to_do?.rich_text) }}
      />

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

// Block Renderer
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
          customStyle.color = '#ff4d4d';
          customStyle.backgroundColor = 'rgba(255, 77, 77, 0.15)';
          customStyle.padding = '2px 6px';
          customStyle.borderRadius = '4px';
        } else if (t.annotations.color === 'green_background') {
          customStyle.color = '#52c41a';
          customStyle.backgroundColor = 'rgba(82, 196, 26, 0.2)';
          customStyle.padding = '2px 6px';
          customStyle.borderRadius = '4px';
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
            style={{ ...customStyle, color: '#ebd73f', textDecoration: 'underline', textUnderlineOffset: '4px', fontFamily: "'Clash Display', sans-serif" }}
          >
            {textContent}
          </a>
        );
      }
      return (
        <span key={idx} className={className} style={{ ...customStyle, fontFamily: "'Clash Display', sans-serif" }} data-notion-color={t.annotations?.color}>
          {textContent}
        </span>
      );
    });
  };

  switch (block.type) {
    case 'heading_1':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_1" initialRichTextArr={block.heading_1?.rich_text}
          tagName="h1" className="notion-font" style={{ fontSize: '1.75rem', fontWeight: 800, margin: '28px 0 10px 0', color: '#ebd73f', letterSpacing: '-0.02em', fontFamily: "'Panchang', sans-serif" }}
          emptyPlaceholder="Untitled Heading 1"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'heading_2':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_2" initialRichTextArr={block.heading_2?.rich_text}
          tagName="h2" className="notion-font" style={{ fontSize: '1.45rem', fontWeight: 700, margin: '24px 0 8px 0', color: '#eee', fontFamily: "'Panchang', sans-serif" }}
          emptyPlaceholder="Untitled Heading 2"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'heading_3':
      return (
        <EditableTextBlock
          blockId={block.id} type="heading_3" initialRichTextArr={block.heading_3?.rich_text}
          tagName="h3" className="notion-font" style={{ fontSize: '1.2rem', fontWeight: 600, margin: '20px 0 6px 0', color: '#ccc', fontFamily: "'Panchang', sans-serif" }}
          emptyPlaceholder="Untitled Heading 3"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'paragraph':
      return (
        <EditableTextBlock
          blockId={block.id} type="paragraph" initialRichTextArr={block.paragraph?.rich_text}
          tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', margin: '4px 0', minHeight: '1.6rem', fontFamily: "'Clash Display', sans-serif" }}
          emptyPlaceholder="Type '/' for commands"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock} onConvertBlock={onConvertBlock}
        />
      );

    case 'quote':
      return (
        <EditableTextBlock
          blockId={block.id} type="quote" initialRichTextArr={block.quote?.rich_text}
          tagName="blockquote" className="notion-font" 
          style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#ebd73f', margin: '14px 0', padding: '12px 18px', borderLeft: '3px solid #ebd73f', background: 'rgba(235, 215, 63, 0.05)', borderRadius: '0 8px 8px 0', fontFamily: "'Clash Display', sans-serif" }}
          emptyPlaceholder="Empty quote"
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'code':
      return (
        <EditableTextBlock
          blockId={block.id} type="code" initialRichTextArr={block.code?.rich_text}
          tagName="pre" className="notion-font" 
          style={{ fontSize: '0.9rem', color: '#a3f08c', margin: '14px 0', padding: '16px', background: '#0a0a0e', borderRadius: '10px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Clash Display', monospace" }}
          emptyPlaceholder="Code snippet..."
          onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock}
        />
      );

    case 'bulleted_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#ebd73f', marginTop: '4px', fontSize: '1.2rem', lineHeight: 1 }}>•</span>
          <EditableTextBlock
            blockId={block.id} type="bulleted_list_item" initialRichTextArr={block.bulleted_list_item?.rich_text}
            tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', flex: 1, fontFamily: "'Clash Display', sans-serif" }}
            emptyPlaceholder="List item"
            onDeleteBlock={onDeleteBlock} onInsertBlockAfter={(id) => onInsertBlockAfter(id, 'bulleted_list_item')} onUpdateBlock={onUpdateBlock}
          />
        </div>
      );

    case 'numbered_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
          <span style={{ color: '#ebd73f', marginTop: '2px', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Panchang', sans-serif" }}>1.</span>
          <EditableTextBlock
            blockId={block.id} type="numbered_list_item" initialRichTextArr={block.numbered_list_item?.rich_text}
            tagName="div" className="notion-font" style={{ fontSize: '1rem', lineHeight: 1.6, color: '#eee', flex: 1, fontFamily: "'Clash Display', sans-serif" }}
            emptyPlaceholder="Numbered item"
            onDeleteBlock={onDeleteBlock} onInsertBlockAfter={(id) => onInsertBlockAfter(id, 'numbered_list_item')} onUpdateBlock={onUpdateBlock}
          />
        </div>
      );

    case 'to_do':
      return <EditableTodoBlock block={block} onDeleteBlock={onDeleteBlock} onInsertBlockAfter={onInsertBlockAfter} onUpdateBlock={onUpdateBlock} />;

    case 'callout':
      return (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(145deg, rgba(235, 215, 63, 0.08) 0%, rgba(235, 215, 63, 0.02) 100%)',
          border: '1px solid rgba(235, 215, 63, 0.2)',
          borderLeft: '4px solid #ebd73f',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          margin: '14px 0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>{block.callout?.icon?.emoji || '💡'}</span>
          <div className="notion-font" style={{ fontSize: '0.98rem', lineHeight: 1.7, color: '#fff', fontWeight: 500, fontFamily: "'Clash Display', sans-serif" }}>
            {renderRichText(block.callout?.rich_text)}
          </div>
        </div>
      );

    case 'toggle':
      return (
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.06)', 
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
              fontSize: '0.98rem',
              fontWeight: 600,
              textAlign: 'left',
              fontFamily: "'Clash Display', sans-serif"
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
            padding: toggleOpen ? '0 16px 16px 40px' : '0 16px 0 40px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '14px' }}>
              {block.children?.map((child) => (
                <NotionBlockRenderer key={child.id} block={child} setSelectedItem={setSelectedItem} />
              ))}
            </div>
          </div>
        </div>
      );

    case 'divider':
      return (
        <div style={{ 
          height: '1px', 
          background: 'linear-gradient(90deg, transparent, rgba(235, 215, 63, 0.3), transparent)', 
          margin: '24px 0' 
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
              cursor: 'pointer', flex: 1, textAlign: 'left',
              fontFamily: "'Clash Display', sans-serif"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.05)'}
          >
            {isDb ? <Database size={18} /> : <FileText size={18} />}
            <span className="notion-font" style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1, fontFamily: "'Clash Display', sans-serif" }}>
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
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.color = '#888';
              }}
              title={`Delete ${isDb ? 'Database' : 'Page'}`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
}
