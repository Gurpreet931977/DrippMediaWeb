'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Search, RefreshCw, ExternalLink, ChevronRight, ChevronDown, 
  FileText, Database, CheckSquare, Sparkles, AlertCircle, Info, LayerGroup
} from 'lucide-react';
import { useGenz } from '../../contexts/GenzContext';

export default function NotionHubPage() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch shared Notion items
  const fetchNotionItems = useCallback(async (query = '') => {
    setLoading(true);
    setError('');
    try {
      const url = query.trim() 
        ? `/api/admin/notion?action=search&query=${encodeURIComponent(query.trim())}`
        : `/api/admin/notion?action=list`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Notion documents');
      }

      setItems(data.items || []);
      
      // Auto-select first item if available and none selected
      if (data.items && data.items.length > 0 && !selectedItem) {
        setSelectedItem(data.items[0]);
      }
    } catch (err) {
      console.error('Fetch Notion Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedItem]);

  // Fetch content blocks for selected page
  const fetchPageContent = useCallback(async (pageId) => {
    if (!pageId) return;
    setContentLoading(true);
    try {
      const res = await fetch(`/api/admin/notion?action=blocks&pageId=${pageId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setDocContent(data);
      } else {
        setDocContent(null);
      }
    } catch (err) {
      console.error('Fetch Page Content Error:', err);
      setDocContent(null);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotionItems(searchQuery);
  };

  return (
    <div style={{ 
      fontFamily: "'Clash Display', 'Panchang', sans-serif", 
      color: '#fff', 
      minHeight: '100vh', 
      background: '#050507',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <style>{`
        .notion-font {
          font-family: 'Clash Display', 'Panchang', sans-serif !important;
        }
        .notion-glass-card {
          background: rgba(18, 18, 22, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
        }
        .notion-item-active {
          background: rgba(235, 215, 63, 0.12) !important;
          border-color: rgba(235, 215, 63, 0.4) !important;
        }
        .notion-item-hover:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .notion-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      {/* Top Header */}
      <header style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'rgba(10, 10, 14, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ebd73f 0%, #d4b810 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            boxShadow: '0 8px 20px rgba(235, 215, 63, 0.25)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="notion-font" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              {isGenz ? 'BRAIN VAULT.' : 'NOTION HUB & STRATEGY.'}
            </h1>
            <p className="notion-font" style={{ fontSize: '0.82rem', color: '#888', margin: '4px 0 0 0' }}>
              {isGenz ? 'Live synced notes & masterplans from Notion' : 'Real-time sync of Dripp Media notes, databases & business plans'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#777' }} />
            <input
              type="text"
              className="notion-font"
              placeholder="Search Notion docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </form>

          <button
            onClick={() => fetchNotionItems(searchQuery)}
            disabled={loading}
            className="notion-font"
            style={{
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} className={loading ? 'notion-pulse' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div style={{
          margin: '20px 32px 0 32px',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          color: '#f87171',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertCircle size={20} />
          <span className="notion-font">{error}</span>
        </div>
      )}

      {/* Main Workspace split into List (Left) and Block Viewer (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        padding: '24px 32px',
        flex: 1
      }}>
        {/* Left Panel: Shared Documents Catalog */}
        <div className="notion-glass-card" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 170px)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span className="notion-font" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Connected Notes ({items.length})
            </span>
            <Sparkles size={16} style={{ color: '#ebd73f' }} />
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#777' }} className="notion-font">
                Loading Notion Workspace...
              </div>
            ) : items.length === 0 ? (
              <div style={{
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.1)'
              }}>
                <Info size={28} style={{ color: '#ebd73f', marginBottom: '12px' }} />
                <h4 className="notion-font" style={{ margin: '0 0 8px 0', fontSize: '0.9rem' }}>No Shared Pages Found</h4>
                <p className="notion-font" style={{ fontSize: '0.78rem', color: '#888', lineHeight: 1.5 }}>
                  Share pages from your Notion App by clicking <strong>...</strong> → <strong>Add connections</strong> → select <strong>Dripp Media Admin</strong>.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`notion-font notion-item-hover ${isSelected ? 'notion-item-active' : ''}`}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                      {item.icon || (item.object === 'database' ? <Database size={18} style={{ color: '#ebd73f' }} /> : <FileText size={18} style={{ color: '#aaa' }} />)}
                    </span>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        color: isSelected ? '#ebd73f' : '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#666', marginTop: '2px' }}>
                        {item.lastEditedTime ? new Date(item.lastEditedTime).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: isSelected ? '#ebd73f' : '#444' }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Page Header & Rendered Notion Content */}
        <div className="notion-glass-card" style={{
          padding: '32px',
          height: 'calc(100vh - 170px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedItem ? (
            <div>
              {/* Document Banner & Cover Image if present */}
              {docContent?.page?.cover && (
                <div style={{
                  height: '140px',
                  width: '100%',
                  borderRadius: '12px',
                  backgroundImage: `url(${docContent.page.cover})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  marginBottom: '24px'
                }} />
              )}

              {/* Header Info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '2.4rem' }}>
                    {docContent?.page?.icon || selectedItem.icon || '📄'}
                  </span>
                  <div>
                    <h2 className="notion-font" style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#ebd73f' }}>
                      {docContent?.page?.title || selectedItem.title}
                    </h2>
                    <p className="notion-font" style={{ fontSize: '0.78rem', color: '#777', margin: '4px 0 0 0' }}>
                      Last updated: {selectedItem.lastEditedTime ? new Date(selectedItem.lastEditedTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notion-font"
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(235, 215, 63, 0.1)',
                    border: '1px solid rgba(235, 215, 63, 0.3)',
                    borderRadius: '8px',
                    color: '#ebd73f',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Open in Notion <ExternalLink size={14} />
                </a>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '24px 0' }} />

              {/* Rendered Document Content Blocks */}
              {contentLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#888' }} className="notion-font">
                  Fetching live content from Notion...
                </div>
              ) : docContent?.blocks?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {docContent.blocks.map((block) => (
                    <NotionBlockRenderer key={block.id} block={block} />
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }} className="notion-font">
                  This document has no content blocks yet.
                </div>
              )}
            </div>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#777', maxWidth: '400px' }}>
              <BookOpen size={48} style={{ color: '#ebd73f', marginBottom: '16px', opacity: 0.8 }} />
              <h3 className="notion-font" style={{ fontSize: '1.2rem', margin: '0 0 8px 0', color: '#fff' }}>Select a Notion Document</h3>
              <p className="notion-font" style={{ fontSize: '0.85rem', color: '#888', lineHeight: 1.6 }}>
                Choose any note or business plan from the catalog on the left to read its live contents directly inside your Admin Panel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component to render Notion blocks cleanly using brand typography
function NotionBlockRenderer({ block }) {
  const [toggleOpen, setToggleOpen] = useState(false);

  const renderRichText = (richTextArr) => {
    if (!richTextArr || richTextArr.length === 0) return null;
    return richTextArr.map((t, idx) => {
      let style = {};
      if (t.annotations?.bold) style.fontWeight = '700';
      if (t.annotations?.italic) style.fontStyle = 'italic';
      if (t.annotations?.strikethrough) style.textDecoration = 'line-through';
      if (t.annotations?.underline) style.textDecoration = 'underline';
      if (t.annotations?.color && t.annotations.color !== 'default') style.color = t.annotations.color;

      if (t.href) {
        return (
          <a
            key={idx}
            href={t.href}
            target="_blank"
            rel="noopener noreferrer"
            className="notion-font"
            style={{ ...style, color: '#ebd73f', textDecoration: 'underline' }}
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
        <h1 className="notion-font" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '16px 0 8px 0', color: '#ebd73f' }}>
          {renderRichText(block.heading_1?.rich_text)}
        </h1>
      );

    case 'heading_2':
      return (
        <h2 className="notion-font" style={{ fontSize: '1.25rem', fontWeight: 700, margin: '14px 0 6px 0', color: '#fff' }}>
          {renderRichText(block.heading_2?.rich_text)}
        </h2>
      );

    case 'heading_3':
      return (
        <h3 className="notion-font" style={{ fontSize: '1.05rem', fontWeight: 600, margin: '12px 0 4px 0', color: '#ddd' }}>
          {renderRichText(block.heading_3?.rich_text)}
        </h3>
      );

    case 'paragraph':
      const text = renderRichText(block.paragraph?.rich_text);
      if (!text) return <div style={{ height: '8px' }} />;
      return (
        <p className="notion-font" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#ccc', margin: 0 }}>
          {text}
        </p>
      );

    case 'bulleted_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingLeft: '8px' }}>
          <span style={{ color: '#ebd73f', fontSize: '1rem', lineHeight: '1.5rem' }}>•</span>
          <div className="notion-font" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#ccc' }}>
            {renderRichText(block.bulleted_list_item?.rich_text)}
          </div>
        </div>
      );

    case 'numbered_list_item':
      return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingLeft: '8px' }}>
          <span className="notion-font" style={{ color: '#ebd73f', fontSize: '0.88rem', fontWeight: 600 }}>1.</span>
          <div className="notion-font" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#ccc' }}>
            {renderRichText(block.numbered_list_item?.rich_text)}
          </div>
        </div>
      );

    case 'to_do':
      const isChecked = block.to_do?.checked;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '4px' }}>
          <span style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: isChecked ? '1px solid #ebd73f' : '1px solid #555',
            background: isChecked ? 'rgba(235, 215, 63, 0.2)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ebd73f'
          }}>
            {isChecked && <CheckSquare size={12} />}
          </span>
          <div className="notion-font" style={{
            fontSize: '0.9rem',
            color: isChecked ? '#777' : '#ccc',
            textDecoration: isChecked ? 'line-through' : 'none'
          }}>
            {renderRichText(block.to_do?.rich_text)}
          </div>
        </div>
      );

    case 'callout':
      return (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(235, 215, 63, 0.06)',
          border: '1px solid rgba(235, 215, 63, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>{block.callout?.icon?.emoji || '💡'}</span>
          <div className="notion-font" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#eee' }}>
            {renderRichText(block.callout?.rich_text)}
          </div>
        </div>
      );

    case 'toggle':
      return (
        <div style={{ borderLeft: '2px solid rgba(235, 215, 63, 0.3)', paddingLeft: '12px', margin: '4px 0' }}>
          <button
            onClick={() => setToggleOpen(!toggleOpen)}
            className="notion-font"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            {toggleOpen ? <ChevronDown size={16} style={{ color: '#ebd73f' }} /> : <ChevronRight size={16} style={{ color: '#888' }} />}
            {renderRichText(block.toggle?.rich_text)}
          </button>

          {toggleOpen && block.children && (
            <div style={{ marginTop: '10px', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {block.children.map((child) => (
                <NotionBlockRenderer key={child.id} block={child} />
              ))}
            </div>
          )}
        </div>
      );

    case 'quote':
      return (
        <blockquote style={{
          borderLeft: '3px solid #ebd73f',
          margin: '8px 0',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0 8px 8px 0',
          fontSize: '0.92rem',
          fontStyle: 'italic',
          color: '#ddd'
        }} className="notion-font">
          {renderRichText(block.quote?.rich_text)}
        </blockquote>
      );

    case 'code':
      return (
        <div style={{
          background: '#0d0d12',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '14px',
          fontSize: '0.85rem',
          color: '#ebd73f',
          overflowX: 'auto'
        }} className="notion-font">
          <pre style={{ margin: 0 }}>
            {block.code?.rich_text?.map(t => t.plain_text).join('')}
          </pre>
        </div>
      );

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />;

    default:
      return null;
  }
}
