'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Plus, Trash2, Edit3, Check, X, ArrowUp, ArrowDown, 
  Search, Save, RefreshCw, Sparkles, FolderPlus, ArrowRightLeft, 
  HelpCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import styles from '../admin.module.css';

export default function ServicesManager() {
  const [categories, setCategories] = useState([]);
  const [activeCatId, setActiveCatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inline editing states
  const [newServiceName, setNewServiceName] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editingServiceName, setEditingServiceName] = useState('');
  
  // Category management modal / inline
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  
  // Notifications / Dialog
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch services on load
  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
        if (data.data.length > 0 && !activeCatId) {
          setActiveCatId(data.data[0].id);
        }
      } else {
        notify('Failed to load services data', 'error');
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      notify('Connection error loading services', 'error');
    } finally {
      setLoading(false);
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const activeCategory = categories.find(c => c.id === activeCatId) || categories[0];

  // Save changes to API
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: categories })
      });
      const data = await res.json();
      if (data.success) {
        setHasUnsavedChanges(false);
        notify('Services saved successfully! Floating Cloud & Package Builder updated.');

        // Broadcast to other tabs/windows for live real-time sync
        if (typeof window !== 'undefined') {
          try {
            const bc = new BroadcastChannel('dripp_services_channel');
            bc.postMessage({ type: 'SERVICES_UPDATED', timestamp: Date.now() });
            bc.close();
          } catch (e) {}
          try {
            localStorage.setItem('dripp_services_updated', Date.now().toString());
          } catch (e) {}
        }
      } else {
        notify(data.error || 'Failed to save changes', 'error');
      }
    } catch (err) {
      console.error('Error saving services:', err);
      notify('Error saving changes to server', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add new service
  const handleAddService = (e) => {
    if (e) e.preventDefault();
    const trimmed = newServiceName.trim();
    if (!trimmed) return;
    if (!activeCategory) return;

    const newSvc = {
      id: `svc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: trimmed
    };

    const updated = categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return {
          ...cat,
          services: [...cat.services, newSvc]
        };
      }
      return cat;
    });

    setCategories(updated);
    setNewServiceName('');
    setHasUnsavedChanges(true);
    notify(`Added "${trimmed}" to ${activeCategory.name}`);
  };

  // Delete service
  const handleDeleteService = (svcId, svcName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Service?',
      message: `Are you sure you want to remove "${svcName}" from the package builder and floating cloud?`,
      onConfirm: () => {
        const updated = categories.map(cat => {
          if (cat.id === activeCategory.id) {
            return {
              ...cat,
              services: cat.services.filter(s => s.id !== svcId)
            };
          }
          return cat;
        });
        setCategories(updated);
        setHasUnsavedChanges(true);
        setConfirmDialog({ isOpen: false });
        notify(`Removed "${svcName}"`);
      }
    });
  };

  // Start editing service
  const startEditService = (s) => {
    setEditingServiceId(s.id);
    setEditingServiceName(s.name);
  };

  // Save edit service
  const saveEditService = (svcId) => {
    const trimmed = editingServiceName.trim();
    if (!trimmed) return;

    const updated = categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return {
          ...cat,
          services: cat.services.map(s => s.id === svcId ? { ...s, name: trimmed } : s)
        };
      }
      return cat;
    });

    setCategories(updated);
    setEditingServiceId(null);
    setHasUnsavedChanges(true);
  };

  // Move service Up
  const moveServiceUp = (index) => {
    if (index === 0 || !activeCategory) return;
    const svcs = [...activeCategory.services];
    const temp = svcs[index - 1];
    svcs[index - 1] = svcs[index];
    svcs[index] = temp;

    const updated = categories.map(cat => cat.id === activeCategory.id ? { ...cat, services: svcs } : cat);
    setCategories(updated);
    setHasUnsavedChanges(true);
  };

  // Move service Down
  const moveServiceDown = (index) => {
    if (!activeCategory || index >= activeCategory.services.length - 1) return;
    const svcs = [...activeCategory.services];
    const temp = svcs[index + 1];
    svcs[index + 1] = svcs[index];
    svcs[index] = temp;

    const updated = categories.map(cat => cat.id === activeCategory.id ? { ...cat, services: svcs } : cat);
    setCategories(updated);
    setHasUnsavedChanges(true);
  };

  // Move service to a different category
  const handleTransferCategory = (svcId, targetCatId) => {
    if (!targetCatId || targetCatId === activeCategory.id) return;
    const svcToMove = activeCategory.services.find(s => s.id === svcId);
    if (!svcToMove) return;

    const updated = categories.map(cat => {
      if (cat.id === activeCategory.id) {
        return {
          ...cat,
          services: cat.services.filter(s => s.id !== svcId)
        };
      }
      if (cat.id === targetCatId) {
        return {
          ...cat,
          services: [...cat.services, svcToMove]
        };
      }
      return cat;
    });

    setCategories(updated);
    setHasUnsavedChanges(true);
    const targetCat = categories.find(c => c.id === targetCatId);
    notify(`Transferred "${svcToMove.name}" to ${targetCat?.name || 'new category'}`);
  };

  // Add new Category
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const catId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (categories.some(c => c.id === catId)) {
      notify('Category already exists', 'error');
      return;
    }

    const newCat = {
      id: catId,
      name: trimmed,
      services: []
    };

    setCategories([...categories, newCat]);
    setActiveCatId(catId);
    setNewCategoryName('');
    setIsAddingCategory(false);
    setHasUnsavedChanges(true);
    notify(`Created category "${trimmed}"`);
  };

  // Rename Category
  const handleSaveRenameCategory = (catId) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) return;

    const updated = categories.map(c => c.id === catId ? { ...c, name: trimmed } : c);
    setCategories(updated);
    setEditingCatId(null);
    setHasUnsavedChanges(true);
    notify(`Renamed category to "${trimmed}"`);
  };

  // Delete Category
  const handleDeleteCategory = (catId, catName) => {
    if (categories.length <= 1) {
      notify('Cannot delete the only remaining category', 'error');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category?',
      message: `Are you sure you want to delete "${catName}" and all its services?`,
      onConfirm: () => {
        const updated = categories.filter(c => c.id !== catId);
        setCategories(updated);
        if (activeCatId === catId) {
          setActiveCatId(updated[0].id);
        }
        setHasUnsavedChanges(true);
        setConfirmDialog({ isOpen: false });
        notify(`Deleted category "${catName}"`);
      }
    });
  };

  // Total services across all categories
  const totalServicesCount = categories.reduce((sum, c) => sum + (c.services?.length || 0), 0);

  // Filtered services in the active category
  const filteredServices = (activeCategory?.services || []).filter(s => 
    !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#0d0d11', padding: '32px 36px 120px', position: 'relative' }}>
      
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.25)', borderRadius: 999, color: '#ebd73f', fontSize: '0.72rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, letterSpacing: '1px', marginBottom: 10 }}>
            <Sparkles size={12} />
            <span>SERVICES &amp; CLOUD ARCHITECT</span>
          </div>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
            Services <span style={{ color: '#ebd73f' }}>Manager</span>
          </h1>
          <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.88rem', color: '#888', marginTop: 6, maxWidth: 650, lineHeight: 1.5 }}>
            Rearrange, edit, add, or delete services category-wise. Every modification instantly updates both the <strong>Floating Services Cloud</strong> and the <strong>Customise Your Package</strong> builder on the main site.
          </p>
        </div>

        {/* Global Save Button & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '10px 18px' }}>
            <div>
              <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#ebd73f' }}>{totalServicesCount}</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Services</div>
            </div>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.08)' }} />
            <div>
              <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{categories.length}</div>
              <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.7rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categories</div>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving || !hasUnsavedChanges}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 12,
              background: hasUnsavedChanges ? '#ebd73f' : 'rgba(255,255,255,0.05)',
              color: hasUnsavedChanges ? '#000' : 'rgba(255,255,255,0.35)',
              border: hasUnsavedChanges ? 'none' : '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'Panchang', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              cursor: hasUnsavedChanges && !saving ? 'pointer' : 'not-allowed',
              boxShadow: hasUnsavedChanges ? '0 0 25px rgba(235, 215, 63, 0.4)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <Save size={15} />
            <span>{saving ? 'SAVING...' : hasUnsavedChanges ? 'SAVE CHANGES' : 'SAVED'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs Strip */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: '#777', letterSpacing: '1px', textTransform: 'uppercase' }}>
            SELECT CATEGORY
          </span>
          {!isAddingCategory && (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: 'none',
                color: '#ebd73f',
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <FolderPlus size={14} />
              <span>+ Add Category</span>
            </button>
          )}
        </div>

        {/* New Category Input Row */}
        {isAddingCategory && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(235,215,63,0.06)', border: '1px solid rgba(235,215,63,0.3)', padding: '10px 14px', borderRadius: 12, marginBottom: 14, maxWidth: 450 }}>
            <input
              type="text"
              placeholder="Category Name (e.g. AI & Virtual Production)..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') setIsAddingCategory(false); }}
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.85rem'
              }}
            />
            <button
              onClick={handleAddCategory}
              style={{ padding: '6px 12px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: 8, fontFamily: "'Panchang', sans-serif", fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Create
            </button>
            <button
              onClick={() => setIsAddingCategory(false)}
              style={{ padding: '6px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
          {categories.map((cat) => {
            const isActive = cat.id === activeCatId;
            return (
              <div
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: isActive ? '#ebd73f' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.7)',
                  border: isActive ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.08)',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 20px rgba(235, 215, 63, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <span>{cat.name}</span>
                <span style={{
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#000' : '#ebd73f',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}>
                  {cat.services?.length || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Services Panel */}
      {activeCategory && (
        <div style={{ background: 'rgba(18, 18, 23, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: '24px 26px', backdropFilter: 'blur(20px)' }}>
          
          {/* Active Category Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {editingCatId === activeCategory.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={e => setEditingCatName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveRenameCategory(activeCategory.id); if (e.key === 'Escape') setEditingCatId(null); }}
                    autoFocus
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid #ebd73f',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontFamily: "'Panchang', sans-serif",
                      fontSize: '1rem',
                      fontWeight: 800
                    }}
                  />
                  <button
                    onClick={() => handleSaveRenameCategory(activeCategory.id)}
                    style={{ padding: '6px 12px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'Panchang', sans-serif", fontSize: '0.68rem', fontWeight: 800 }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingCatId(null)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {activeCategory.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => { setEditingCatId(activeCategory.id); setEditingCatName(activeCategory.name); }}
                    title="Rename Category"
                    style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(activeCategory.id, activeCategory.name)}
                    title="Delete Category"
                    style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.6, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 14px', width: 'min(300px, 100%)' }}>
              <Search size={14} color="#777" />
              <input
                type="text"
                placeholder={`Search ${activeCategory.name}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.8rem',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Add Service Bar */}
          <form onSubmit={handleAddService} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder={`Add new service to ${activeCategory.name} (e.g. 4K Drone Cinematic Reel)...`}
                value={newServiceName}
                onChange={e => setNewServiceName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#fff',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.88rem',
                  outline: 'none',
                  transition: 'border 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(235, 215, 63, 0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
            <button
              type="submit"
              disabled={!newServiceName.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 12,
                background: newServiceName.trim() ? '#ebd73f' : 'rgba(255,255,255,0.06)',
                color: newServiceName.trim() ? '#000' : '#666',
                border: 'none',
                fontFamily: "'Panchang', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: newServiceName.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={16} />
              <span>ADD SERVICE</span>
            </button>
          </form>

          {/* Services List with Reorder, Edit, Delete, Category Move */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredServices.map((service, index) => {
              const isEditing = editingServiceId === service.id;
              return (
                <div
                  key={service.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    transition: 'all 0.18s ease',
                    gap: 12
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  {/* Left: Position Number & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '0.68rem', fontWeight: 700, color: 'rgba(235, 215, 63, 0.7)', minWidth: 28 }}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <input
                          type="text"
                          value={editingServiceName}
                          onChange={e => setEditingServiceName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEditService(service.id); if (e.key === 'Escape') setEditingServiceId(null); }}
                          autoFocus
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid #ebd73f',
                            borderRadius: 8,
                            padding: '6px 12px',
                            color: '#fff',
                            fontFamily: "'Clash Display', sans-serif",
                            fontSize: '0.86rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => saveEditService(service.id)}
                          style={{ padding: '6px 12px', background: '#ebd73f', color: '#000', border: 'none', borderRadius: 8, fontFamily: "'Panchang', sans-serif", fontSize: '0.65rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingServiceId(null)}
                          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span 
                        style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.9rem', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {service.name}
                      </span>
                    )}
                  </div>

                  {/* Right Actions: Reorder, Move Category, Edit, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    
                    {/* Transfer to another category */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        value={activeCategory.id}
                        onChange={e => handleTransferCategory(service.id, e.target.value)}
                        title="Move to another category"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#aaa',
                          borderRadius: 8,
                          padding: '5px 8px',
                          fontSize: '0.72rem',
                          fontFamily: "'Clash Display', sans-serif",
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>Move to...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id} style={{ background: '#111', color: '#fff' }}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Move Up Button */}
                    <button
                      type="button"
                      onClick={() => moveServiceUp(index)}
                      disabled={index === 0}
                      title="Move Up"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: index === 0 ? 'rgba(255,255,255,0.15)' : '#ccc',
                        padding: '6px 8px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>

                    {/* Move Down Button */}
                    <button
                      type="button"
                      onClick={() => moveServiceDown(index)}
                      disabled={index === activeCategory.services.length - 1}
                      title="Move Down"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: index === activeCategory.services.length - 1 ? 'rgba(255,255,255,0.15)' : '#ccc',
                        padding: '6px 8px',
                        cursor: index === activeCategory.services.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>

                    {/* Edit Name Button */}
                    <button
                      type="button"
                      onClick={() => startEditService(service)}
                      title="Rename Service"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        color: '#ccc',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteService(service.id, service.name)}
                      title="Delete Service"
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 8,
                        color: '#f87171',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredServices.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', fontFamily: "'Clash Display', sans-serif" }}>
                {searchQuery ? `No services found matching "${searchQuery}"` : `No services in this category yet. Add one above!`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Save Prompt Bar (When unsaved changes exist) */}
      {hasUnsavedChanges && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 36,
          left: 320,
          background: 'rgba(20, 20, 26, 0.95)',
          border: '1px solid rgba(235, 215, 63, 0.4)',
          borderRadius: 16,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(235, 215, 63, 0.2)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ebd73f', boxShadow: '0 0 8px #ebd73f' }} />
            <span style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.88rem', color: '#fff', fontWeight: 500 }}>
              You have unsaved changes to services &amp; categories.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={loadServices}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#aaa',
                padding: '8px 16px',
                borderRadius: 10,
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                background: '#ebd73f',
                color: '#000',
                border: 'none',
                padding: '8px 20px',
                borderRadius: 10,
                fontFamily: "'Panchang', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(235, 215, 63, 0.4)'
              }}
            >
              {saving ? 'SAVING...' : 'SAVE & PUBLISH LIVE'}
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 36,
          zIndex: 2000,
          background: notification.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(20, 20, 26, 0.95)',
          border: notification.type === 'error' ? '1px solid #ef4444' : '1px solid rgba(235, 215, 63, 0.5)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 12,
          fontFamily: "'Clash Display', sans-serif",
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backdropFilter: 'blur(20px)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} color="#ebd73f" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmDialog.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: 20
        }}>
          <div style={{
            background: '#121218',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20,
            padding: '26px 28px',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.85rem', color: '#999', margin: '0 0 22px', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmDialog({ isOpen: false })}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ccc',
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 18px',
                  borderRadius: 10,
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
