'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, EyeOff, GripVertical, AlertCircle, CheckCircle2, Smartphone, MonitorPlay, Image as ImageIcon, PlusCircle, UploadCloud, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../admin.module.css';

const TABS = {
  REELS: 'reels',
  LONG_FORM: 'long-form',
  GRAPHICS: 'graphics'
};

export default function PortfolioManager() {
  const [activeTab, setActiveTab] = useState(TABS.REELS);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Form State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    musicText: '',
    channel: '',
    duration: '',
    video_id: ''
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/portfolio/manage/${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
      }
    } catch (err) {
      showNotification('error', 'Failed to fetch items');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    setSelectedFile(null);
    setFormData({ title: '', description: '', musicText: '', channel: '', duration: '', video_id: '' });
  }, [activeTab]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    
    // Validate
    if (activeTab === TABS.LONG_FORM && !formData.video_id) {
        showNotification('error', 'YouTube Video ID is required');
        return;
    }
    if ((activeTab === TABS.REELS || activeTab === TABS.GRAPHICS) && !selectedFile) {
        showNotification('error', 'Please select a file to upload');
        return;
    }

    setUploading(true);
    setUploadProgress(10);
    let publicUrl = '';

    try {
      // Step 1: Upload to R2 if a file is selected (Reels / Graphics / or custom Long Form thumbnail)
      if (selectedFile) {
        setUploadProgress(30);
        
        // Get Presigned URL
        const presignRes = await fetch('/api/admin/portfolio/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            contentType: selectedFile.type,
            folder: activeTab === TABS.GRAPHICS ? 'Graphics' : 'Reels'
          })
        });

        if (!presignRes.ok) throw new Error('Failed to get upload URL');
        const { presignedUrl, publicUrl: generatedUrl } = await presignRes.json();
        publicUrl = generatedUrl;

        setUploadProgress(50);

        // Upload to Cloudflare R2 using XHR for accurate, real-time progress tracking
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignedUrl, true);
          xhr.setRequestHeader('Content-Type', selectedFile.type);
          
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              // We map the 0-100% file upload to the 10-90% range of the overall visual progress bar
              const percentComplete = 10 + Math.round((e.loaded / e.total) * 80);
              setUploadProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error('Upload to R2 failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          
          xhr.send(selectedFile);
        });

        setUploadProgress(90);
      }

      // Step 2: Save to Supabase
      let payload = {};
      
      if (activeTab === TABS.REELS) {
        payload = {
          videoSrc: publicUrl,
          description: formData.description,
          musicText: formData.musicText || 'Original Audio - Dripp Media',
          sort_order: items.length > 0 ? items[0].sort_order + 1 : 1
        };
      } else if (activeTab === TABS.GRAPHICS) {
        payload = {
          image_url: publicUrl,
          sort_order: items.length > 0 ? items[0].sort_order + 1 : 1
        };
      } else if (activeTab === TABS.LONG_FORM) {
        // Extract YouTube ID if a full link was provided
        let finalVideoId = formData.video_id;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = finalVideoId.match(regExp);
        if (match && match[2].length === 11) {
            finalVideoId = match[2];
        }

        payload = {
          video_id: finalVideoId,
          title: formData.title,
          channel: formData.channel || 'Dripp Media',
          duration: formData.duration || '10:00',
          thumbnail_url: publicUrl || `https://img.youtube.com/vi/${finalVideoId}/maxresdefault.jpg`,
          sort_order: items.length > 0 ? items[0].sort_order + 1 : 1
        };
      }

      const dbRes = await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!dbRes.ok) throw new Error('Database insertion failed');
      
      setUploadProgress(100);
      showNotification('success', 'Successfully added to portfolio!');
      
      // Reset Form
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFormData({ title: '', description: '', musicText: '', channel: '', duration: '', video_id: '' });
      
      // Refresh list
      fetchItems();

    } catch (err) {
      console.error(err);
      showNotification('error', err.message || 'An error occurred during upload');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const toggleVisibility = async (id, currentVis) => {
    try {
      const res = await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_visible: !currentVis })
      });
      if (res.ok) fetchItems();
    } catch (e) {
      showNotification('error', 'Failed to update visibility');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this item?')) return;
    try {
      const res = await fetch(`/api/admin/portfolio/manage/${activeTab}?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showNotification('success', 'Item deleted');
        fetchItems();
      }
    } catch (e) {
      showNotification('error', 'Failed to delete item');
    }
  };

  // Reordering Logic (Move Up/Down instead of Drag to keep it simple for now)
  const moveItem = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const item1 = newItems[index];
    const item2 = newItems[direction === 'up' ? index - 1 : index + 1];

    // Swap sort_orders
    const tempOrder = item1.sort_order;
    item1.sort_order = item2.sort_order;
    item2.sort_order = tempOrder;

    // Optimistic UI update
    newItems.sort((a, b) => b.sort_order - a.sort_order);
    setItems(newItems);

    // Persist to DB
    try {
        await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item1.id, sort_order: item1.sort_order })
        });
        await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item2.id, sort_order: item2.sort_order })
        });
    } catch (e) {
        showNotification('error', 'Failed to reorder. Refreshing...');
        fetchItems();
    }
  };

  return (
    <div className={styles.mainContent}>
      <style>{`
        .portfolio-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 50px;
            position: relative;
        }
        .portfolio-header::after {
            content: '';
            position: absolute;
            width: 300px;
            height: 100px;
            background: rgba(235, 215, 63, 0.15);
            filter: blur(80px);
            z-index: -1;
            top: -20px;
            left: 0;
            border-radius: 50%;
            pointer-events: none;
        }
        .tabs {
            display: flex;
            gap: 12px;
            background: rgba(10, 10, 10, 0.4);
            backdrop-filter: blur(20px);
            padding: 8px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: inset 0 2px 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.3);
        }
        .tab-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            background: transparent;
            border: none;
            color: #777;
            border-radius: 14px;
            font-family: 'Clash Display', sans-serif;
            font-weight: 500;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .tab-btn::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
            opacity: 0;
            transition: opacity 0.4s ease;
        }
        .tab-btn:hover {
            color: #eee;
            transform: translateY(-2px);
        }
        .tab-btn:hover::before {
            opacity: 1;
        }
        .tab-btn.active {
            background: linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(235, 215, 63, 0.05) 100%);
            color: var(--brand-yellow, #ebd73f);
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(235, 215, 63, 0.2), inset 0 1px 1px rgba(255,255,255,0.1);
            border: 1px solid rgba(235, 215, 63, 0.3);
            transform: translateY(-2px);
        }
        .upload-card-wrapper {
            position: relative;
            margin-bottom: 70px;
        }
        .upload-card-wrapper::before {
            content: '';
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 80%; height: 80%;
            background: radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, transparent 70%);
            filter: blur(60px);
            z-index: -1;
            animation: pulseGlow 4s infinite alternate ease-in-out;
            pointer-events: none;
        }
        @keyframes pulseGlow {
            0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
        }
        .upload-card {
            background: linear-gradient(145deg, rgba(25, 25, 25, 0.7) 0%, rgba(10, 10, 10, 0.9) 100%);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 28px;
            padding: 45px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 20px rgba(255,255,255,0.02);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .upload-card:hover {
            box-shadow: 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 20px rgba(255,255,255,0.03);
            border-color: rgba(235, 215, 63, 0.15);
        }
        .file-drop-area {
            border: 2px dashed rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 60px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 30px;
            background: rgba(0, 0, 0, 0.3);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .file-drop-area:hover {
            background: rgba(235, 215, 63, 0.05);
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 15px 40px rgba(235, 215, 63, 0.08);
            border-color: rgba(235, 215, 63, 0.4);
        }
        .file-drop-area:hover .upload-icon {
            transform: translateY(-10px) scale(1.1);
            filter: drop-shadow(0 0 20px rgba(235,215,63,0.8));
        }
        .upload-icon {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .file-drop-area input[type="file"] {
            display: none;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 25px;
        }
        .input-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .input-group label {
            font-size: 0.9rem;
            color: #aaa;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        .input-group input, .input-group textarea {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 16px 20px;
            border-radius: 14px;
            color: white;
            outline: none;
            font-family: inherit;
            font-size: 1.05rem;
            transition: all 0.4s ease;
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
        }
        .input-group input:focus, .input-group textarea:focus {
            border-color: rgba(235, 215, 63, 0.6);
            background: rgba(10, 10, 10, 0.8);
            box-shadow: 0 0 0 4px rgba(235, 215, 63, 0.1), inset 0 2px 8px rgba(0,0,0,0.4);
            transform: translateY(-2px);
        }
        .submit-btn {
            background: linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%);
            color: #000;
            border: none;
            padding: 18px 36px;
            border-radius: 14px;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 15px 30px rgba(235, 215, 63, 0.25);
            position: relative;
            overflow: hidden;
        }
        .submit-btn::after {
            content: '';
            position: absolute;
            top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            transform: skewX(-20deg);
            transition: all 0.6s ease;
        }
        .submit-btn:hover:not(:disabled)::after {
            left: 150%;
        }
        .submit-btn:hover:not(:disabled) {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 40px rgba(235, 215, 63, 0.4);
            filter: brightness(1.1);
        }
        .submit-btn:active:not(:disabled) {
            transform: translateY(2px) scale(0.97);
            box-shadow: 0 5px 15px rgba(235, 215, 63, 0.3);
        }
        .submit-btn:disabled {
            background: #222;
            color: #555;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }
        .progress-bar-container {
            height: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            margin-top: 30px;
            overflow: hidden;
            box-shadow: inset 0 2px 5px rgba(0,0,0,0.6);
            border: 1px solid rgba(255,255,255,0.05);
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #d4bc1c, #ebd73f, #fff7a1);
            background-size: 200% 100%;
            box-shadow: 0 0 15px rgba(235, 215, 63, 0.6);
            transition: width 0.1s linear;
            animation: shimmerBar 2s infinite linear;
        }
        @keyframes shimmerBar {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
        }
        .item-list {
            display: flex;
            flex-direction: column;
            gap: 18px;
            position: relative;
        }
        .item-list::before {
            content: '';
            position: absolute;
            top: 20%; left: 50%;
            transform: translate(-50%, -50%);
            width: 60%; height: 60%;
            background: radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, transparent 70%);
            filter: blur(80px);
            z-index: -1;
            pointer-events: none;
        }
        .item-row {
            display: flex;
            align-items: center;
            background: rgba(30, 30, 30, 0.5);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 18px 24px;
            border-radius: 20px;
            gap: 24px;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .item-row:hover {
            border-color: rgba(235, 215, 63, 0.4);
            background: rgba(40, 40, 40, 0.7);
            transform: translateX(8px) scale(1.02);
            box-shadow: -10px 15px 30px rgba(0,0,0,0.4), inset 0 1px 15px rgba(255,255,255,0.03);
            z-index: 10;
        }
        .item-thumbnail {
            width: 120px;
            height: 70px;
            background: #050505;
            border-radius: 12px;
            object-fit: cover;
            border: 1px solid rgba(255,255,255,0.08);
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .item-row:hover .item-thumbnail {
            transform: scale(1.08) rotate(1deg);
            border-color: rgba(235, 215, 63, 0.6);
            box-shadow: 0 10px 25px rgba(235, 215, 63, 0.3);
        }
        .item-info {
            flex: 1;
        }
        .item-title {
            font-weight: 600;
            font-size: 1.2rem;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 340px;
            color: #fff;
            transition: all 0.4s ease;
        }
        .item-row:hover .item-title {
            color: #ebd73f;
            text-shadow: 0 0 15px rgba(235,215,63,0.4);
        }
        .item-meta {
            font-size: 0.9rem;
            color: #777;
            font-weight: 400;
        }
        .item-actions {
            display: flex;
            gap: 14px;
            align-items: center;
        }
        .action-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #aaa;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .action-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            transform: translateY(-4px) rotate(8deg);
            box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            border-color: rgba(255,255,255,0.2);
        }
        .action-btn:active {
            transform: scale(0.85) rotate(-5deg);
        }
        .action-btn.delete:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.5);
            color: #ef4444;
            transform: translateY(-4px) scale(1.15) rotate(-5deg);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }
        .action-btn.move {
            cursor: ns-resize;
        }
        .action-btn.move:hover {
            background: rgba(235, 215, 63, 0.1);
            border-color: rgba(235, 215, 63, 0.5);
            color: #ebd73f;
            transform: translateY(-4px) scale(1.1);
            box-shadow: 0 8px 25px rgba(235, 215, 63, 0.2);
        }
        .notification {
            position: fixed;
            bottom: 40px;
            right: 40px;
            padding: 20px 35px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
            animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(20px);
        }
        .notification.success { background: linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9)); }
        .notification.error { background: linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9)); }
        @keyframes slideUp {
            0% { transform: translateY(80px) scale(0.9); opacity: 0; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {notification && (
          <div className={`notification ${notification.type}`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {notification.message}
          </div>
      )}

      <div className="portfolio-header">
        <h1 className={styles.pageTitle} style={{ zIndex: 10, position: 'relative' }}>Portfolio Manager</h1>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === TABS.REELS ? 'active' : ''}`} onClick={() => setActiveTab(TABS.REELS)}>
             <Smartphone size={18} /> Short Form
          </button>
          <button className={`tab-btn ${activeTab === TABS.LONG_FORM ? 'active' : ''}`} onClick={() => setActiveTab(TABS.LONG_FORM)}>
             <MonitorPlay size={18} /> Long Form
          </button>
          <button className={`tab-btn ${activeTab === TABS.GRAPHICS ? 'active' : ''}`} onClick={() => setActiveTab(TABS.GRAPHICS)}>
             <ImageIcon size={18} /> Graphics
          </button>
        </div>
      </div>

      <div className="upload-card-wrapper">
        <div className="upload-card">
        <h2 style={{ marginBottom: '35px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', letterSpacing: '0.5px' }}>
            <PlusCircle size={26} color="#ebd73f" /> Add New Item
        </h2>
        
        <form onSubmit={handleUploadAndSave}>
            {(activeTab === TABS.REELS || activeTab === TABS.GRAPHICS) && (
                <div className="file-drop-area" onClick={() => fileInputRef.current?.click()}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept={activeTab === TABS.REELS ? "video/mp4,video/quicktime" : "image/*"} 
                    />
                    <UploadCloud size={56} color="#ebd73f" className="upload-icon" style={{ marginBottom: '20px' }} />
                    <p style={{ fontWeight: '600', fontSize: '1.1rem', color: '#fff', marginBottom: '8px' }}>
                        {selectedFile ? selectedFile.name : 'Click to browse or drag file here'}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                        Direct upload to Cloudflare R2 - Bypasses Vercel Limits
                    </p>
                </div>
            )}

            {activeTab === TABS.LONG_FORM && (
                <>
                <div className="form-grid">
                    <div className="input-group">
                        <label>YouTube Link or Video ID</label>
                        <input type="text" placeholder="e.g. https://youtu.be/..." value={formData.video_id} onChange={(e) => setFormData({...formData, video_id: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label>Title</label>
                        <input type="text" placeholder="Video Title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label>Channel Name</label>
                        <input type="text" placeholder="Dripp Media Original" value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value})} />
                    </div>
                    <div className="input-group">
                        <label>Duration (Optional)</label>
                        <input type="text" placeholder="10:00" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                    </div>
                </div>
                {/* Optional Custom Thumbnail for Long form */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#aaa', display: 'block', marginBottom: '8px' }}>Custom Thumbnail (Optional - defaults to YouTube)</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ color: 'white' }} />
                </div>
                </>
            )}

            {activeTab === TABS.REELS && (
                <div className="form-grid">
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Description</label>
                        <textarea placeholder="Write a catchy caption..." rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Music Text</label>
                        <input type="text" placeholder="Original Audio - Dripp Media" value={formData.musicText} onChange={(e) => setFormData({...formData, musicText: e.target.value})} />
                    </div>
                </div>
            )}

            <button type="submit" className="submit-btn" disabled={uploading}>
                {uploading ? `Uploading & Saving (${uploadProgress}%)...` : 'Upload & Save to Portfolio'}
            </button>
            {uploading && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
        </form>
        </div>
      </div>

      <div>
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Manage Portfolio</h2>
        
        {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading database...</div>
        ) : items.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                No items found in {activeTab}. Add one above!
            </div>
        ) : (
            <div className="item-list">
                {items.map((item, index) => (
                    <div key={item.id} className="item-row">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="action-btn move" onClick={() => moveItem(index, 'up')} disabled={index === 0}><ArrowUp size={18} /></button>
                            <button className="action-btn move" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}><ArrowDown size={18} /></button>
                        </div>
                        
                        {activeTab === TABS.REELS && (
                            <video className="item-thumbnail" src={item.videoSrc} muted />
                        )}
                        {activeTab === TABS.GRAPHICS && (
                            <img className="item-thumbnail" src={item.image_url} alt="graphic" />
                        )}
                        {activeTab === TABS.LONG_FORM && (
                            <img className="item-thumbnail" src={item.thumbnail_url} alt="thumbnail" />
                        )}

                        <div className="item-info">
                            <div className="item-title">
                                {activeTab === TABS.REELS ? item.description || 'Reel Video' : ''}
                                {activeTab === TABS.GRAPHICS ? 'Graphic Design' : ''}
                                {activeTab === TABS.LONG_FORM ? item.title : ''}
                            </div>
                            <div className="item-meta">
                                Added {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="item-actions">
                            <button className="action-btn" title="Toggle Visibility" onClick={() => toggleVisibility(item.id, item.is_visible)}>
                                {item.is_visible ? <Eye size={18} /> : <EyeOff size={18} color="#ef4444" />}
                            </button>
                            <button className="action-btn delete" title="Delete" onClick={() => deleteItem(item.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
  );
}
