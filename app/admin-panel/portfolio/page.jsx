'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Eye, EyeOff, GripVertical, AlertCircle, CheckCircle2, Smartphone, MonitorPlay, Image as ImageIcon, PlusCircle, UploadCloud, ArrowUp, ArrowDown, Sparkles, Edit2, BookOpen, Info, Crop } from 'lucide-react';
import styles from '../admin.module.css';
import ImageEditorModal from './ImageEditorModal';

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
  const [isDragging, setIsDragging] = useState(false);
  
  // Form State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    musicText: '',
    duration: '',
    video_id: '',
    thumbnail_url: '',
    category: 'Both',
    case_study: ''
  });

  const [notification, setNotification] = useState(null);
  const [uploadPopup, setUploadPopup] = useState({ show: false, type: '', message: '' });
  const [editPopup, setEditPopup] = useState({ show: false, id: null, field: '', value: '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false });
  const [fileSizes, setFileSizes] = useState({});
  const [showCustomGraphicCategory, setShowCustomGraphicCategory] = useState(false);
  const [editorConfig, setEditorConfig] = useState({ show: false, item: null });
  const graphicCategories = Array.from(new Set(items.filter(i => i.category).map(i => i.category)));
  if (graphicCategories.length === 0) graphicCategories.push('Logo Design', 'Poster Design', 'Thumbnail Design');

  const generateFilmstrip = async (videoUrl) => {
    setEditPopup(prev => ({ ...prev, generatingFilmstrip: true, filmstrip: [] }));
    const metaVideo = document.createElement('video');
    metaVideo.crossOrigin = 'anonymous';
    metaVideo.preload = 'auto';
    metaVideo.src = videoUrl + (videoUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    metaVideo.muted = true;
    metaVideo.playsInline = true;
    
    await new Promise(r => { metaVideo.onloadedmetadata = r; metaVideo.onerror = r; });
    if (!metaVideo.duration || !isFinite(metaVideo.duration)) {
        setEditPopup(prev => ({ ...prev, generatingFilmstrip: false }));
        return;
    }

    const frames = [];
    const numFrames = 5;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    for (let i = 0; i < numFrames; i++) {
        const time = (metaVideo.duration / numFrames) * i + (metaVideo.duration / numFrames / 2);
        metaVideo.currentTime = time;
        await new Promise(r => { metaVideo.onseeked = r; metaVideo.onerror = r; });
        if (i === 0) {
            canvas.width = metaVideo.videoWidth / 4;
            canvas.height = metaVideo.videoHeight / 4;
        }
        ctx.drawImage(metaVideo, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.5));
    }
    
    setEditPopup(prev => ({ ...prev, filmstrip: frames, generatingFilmstrip: false }));
  };

  useEffect(() => {
      if (editPopup.show && editPopup.field === 'extract_frame' && editPopup.value && (!editPopup.filmstrip || editPopup.filmstrip.length === 0) && !editPopup.generatingFilmstrip) {
          generateFilmstrip(editPopup.value);
      }
  }, [editPopup.show, editPopup.field, editPopup.value, editPopup.filmstrip, editPopup.generatingFilmstrip]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const closeUploadPopup = () => setUploadPopup({ show: false, type: '', message: '' });

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
    // Fetch file sizes for newly loaded items
    items.forEach(async (item) => {
        if (fileSizes[item.id]) return; // Already fetched
        const url = item.videoSrc || item.image_url;
        // Only fetch sizes for direct R2 urls to avoid CORS issues with YouTube etc.
        if (url && (url.includes('r2.dev') || url.includes('cloudflare'))) {
            try {
                const res = await fetch(url, { method: 'HEAD' });
                const size = res.headers.get('content-length');
                if (size) {
                    setFileSizes(prev => ({ ...prev, [item.id]: parseInt(size, 10) }));
                }
            } catch (err) {
                // Ignore errors
            }
        }
    });
  }, [items]);

  useEffect(() => {
    fetchItems();
    setSelectedFile(null);
    setFormData({ title: '', description: '', musicText: '', duration: '', video_id: '', thumbnail_url: '', category: 'Both', case_study: '' });
  }, [activeTab]);

  useEffect(() => {
    window.portfolioFile = selectedFile;
    window.portfolioFormData = formData;
  }, [selectedFile, formData]);

  useEffect(() => {
    const handleUpdate = (e) => {
      const { detail } = e;
      if (detail) {
        setFormData(prev => ({ ...prev, ...detail }));
        showNotification('success', 'Orlo has filled the form for you!');
      }
    };
    window.addEventListener('UPDATE_PORTFOLIO_FORM', handleUpdate);
    return () => window.removeEventListener('UPDATE_PORTFOLIO_FORM', handleUpdate);
  }, []);
  
  useEffect(() => {
    const handleAnalysisComplete = (e) => {
      const aiData = e.detail;
      if (aiData) {
          setEditPopup(prev => {
              if (!prev.show || !prev.field) return prev;
              if (prev.field === 'case_study' && aiData.case_study) {
                  showNotification('success', 'Orlo wrote a new Case Study!');
                  return { ...prev, value: aiData.case_study };
              }
              if (prev.field === 'title' && aiData.title) {
                  showNotification('success', 'Orlo wrote a new Title!');
                  return { ...prev, value: aiData.title };
              }
              if (prev.field === 'description' && aiData.description) {
                  showNotification('success', 'Orlo wrote a new Caption!');
                  return { ...prev, value: aiData.description };
              }
              return prev;
          });
      }
    };
    window.addEventListener('UPDATE_PORTFOLIO_FORM', handleAnalysisComplete);
    return () => window.removeEventListener('UPDATE_PORTFOLIO_FORM', handleAnalysisComplete);
  }, []);

  const handleYoutubeBlur = async () => {
    let url = formData.video_id;
    if (!url) return;
    
    // Check if it's a valid link or ID
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        if (url.length === 11) {
            url = `https://www.youtube.com/watch?v=${url}`;
        } else {
            return; // Not a valid youtube string
        }
    }

    showNotification('success', 'Extracting YouTube details...');
    try {
        const res = await fetch(`/api/admin/portfolio/youtube-info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const data = await res.json();
            setFormData(prev => ({
                ...prev,
                title: prev.title || data.title,
                description: prev.description || data.description,
                duration: data.duration !== '0:00' ? data.duration : prev.duration,
                thumbnail_url: data.thumbnail || prev.thumbnail_url
            }));
            showNotification('success', 'YouTube details extracted!');
        } else {
            showNotification('error', 'Failed to extract YouTube info');
        }
    } catch (err) {
        console.error(err);
        showNotification('error', 'Failed to fetch YouTube info');
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

    // Helper to upload a Blob to R2 and return the URL
    const uploadBlobToR2 = async (blob, folder) => {
        // Get Presigned URL
        const presignRes = await fetch('/api/admin/portfolio/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: blob.name,
            contentType: blob.type,
            folder: folder
          })
        });

        if (!presignRes.ok) throw new Error('Failed to get upload URL');
        const { presignedUrl, publicUrl } = await presignRes.json();

        // Upload to Cloudflare R2
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignedUrl, true);
          xhr.setRequestHeader('Content-Type', blob.type);
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error('Upload to R2 failed'));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(blob);
        });

        return publicUrl;
    };

    const handleSaveEditedImage = async (blob) => {
        if (!editorConfig.item) return;
        setUploadPopup({ show: true, type: 'uploading', message: 'Saving cropped image...' });
        try {
            const publicUrl = await uploadBlobToR2(blob, 'Graphics');
            
            const res = await fetch('/api/admin/portfolio/manage/graphics', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editorConfig.item.id, image_url: publicUrl })
            });

            if (!res.ok) throw new Error('Failed to update image in database');
            
            // Refresh
            fetchItems();
            setUploadPopup({ show: true, type: 'success', message: 'Image updated successfully!' });
        } catch (err) {
            console.error('Save edited image failed:', err);
            setUploadPopup({ show: true, type: 'error', message: err.message });
        } finally {
            setTimeout(() => setUploadPopup({ show: false, type: '', message: '' }), 3000);
            setEditorConfig({ show: false, item: null });
        }
    };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const optimizeVideo = async (file) => {
    showNotification('success', 'Loading Optimizer Engine...');
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    
    // Listen for FFmpeg optimization progress to update the progress bar (from 15% to 30%)
    ffmpeg.on('progress', ({ progress, time }) => {
        // progress is a value from 0 to 1
        setUploadProgress(15 + Math.round(progress * 15));
    });

    const baseURL = '/ffmpeg';
    
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    showNotification('success', 'Optimizing video format (0% quality loss)...');
    const inputName = 'input' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
    const outputName = 'output.mp4';

    await ffmpeg.writeFile(inputName, await fetchFile(file));
    
    // -vcodec libx264 forces H.264 encoding (most compatible)
    // -pix_fmt yuv420p ensures 8-bit color space (fixes blank screens from 10-bit exports in Chrome)
    // -preset ultrafast ensures the browser WASM doesn't freeze or take too long
    // -crf 28 compresses it slightly for web delivery
    // -movflags +faststart moves the MOOV atom to the start so it plays instantly
    showNotification('success', 'Optimizing codec for Web Compatibility (may take a minute)...');
    await ffmpeg.exec([
        '-i', inputName, 
        '-vcodec', 'libx264', 
        '-pix_fmt', 'yuv420p', 
        '-preset', 'ultrafast', 
        '-crf', '26', 
        '-acodec', 'aac', 
        '-movflags', '+faststart', 
        outputName
    ]);
    
    const data = await ffmpeg.readFile(outputName);
    // CRITICAL: Must use [data] instead of [data.buffer] to prevent WASM heap padding
    // from corrupting the MP4 container for strict browsers like Chrome!
    const newBlob = new Blob([data], { type: 'video/mp4' });
    
    showNotification('success', 'Optimization complete! Uploading...');
    return new File([newBlob], file.name.replace(/\.[^/.]+$/, "") + "_web.mp4", { type: 'video/mp4' });
  };

  const handleUploadAndSave = async (e) => {
    e.preventDefault();
    
    // Validate
    if (activeTab === TABS.LONG_FORM && !formData.video_id) {
        setUploadPopup({ show: true, type: 'error', message: 'YouTube Video ID is required' });
        return;
    }
    if ((activeTab === TABS.REELS || activeTab === TABS.GRAPHICS) && !selectedFile) {
        setUploadPopup({ show: true, type: 'error', message: 'Please select a file to upload' });
        return;
    }

    setUploading(true);
    setUploadProgress(10);
    let publicUrl = '';

    try {
      // Step 1: Upload to R2 if a file is selected (Reels / Graphics / or custom Long Form thumbnail)
      if (selectedFile) {
        let fileToUpload = selectedFile;
        setUploadProgress(15);
        
        // ALWAYS optimize Reels/Short Form to ensure +faststart (moov atom at beginning)
        // Otherwise, raw MP4s from Premiere will show a blank screen until fully downloaded
        if (activeTab === TABS.REELS) {
            try {
                fileToUpload = await optimizeVideo(selectedFile);
            } catch (err) {
                console.error("Video optimization failed:", err);
                showNotification('error', 'Optimization failed, falling back to original file.');
                // fallback to original file
            }
        }

        setUploadProgress(30);
        
        // Get Presigned URL
        const presignRes = await fetch('/api/admin/portfolio/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: fileToUpload.name,
            contentType: fileToUpload.type,
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
          xhr.setRequestHeader('Content-Type', fileToUpload.type);
          
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
          
          xhr.send(fileToUpload);
        });

        setUploadProgress(90);
      }

      // Step 2: Save to Supabase
      let payload = {};
      
      if (activeTab === TABS.REELS) {
        payload = {
          videoSrc: publicUrl,
          description: formData.title || formData.description, // For backwards compatibility we map title to description for reels
          musicText: formData.musicText || 'Original Audio - Dripp Media',
          category: formData.category,
          case_study: formData.case_study,
          sort_order: items.length > 0 ? items[0].sort_order + 1 : 1
        };
      } else if (activeTab === TABS.GRAPHICS) {
        payload = {
          image_url: publicUrl,
          category: formData.category || graphicCategories[0],
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
          description: formData.description || '',
          duration: formData.duration || '0:00',
          thumbnail_url: publicUrl || formData.thumbnail_url || `https://img.youtube.com/vi/${finalVideoId}/maxresdefault.jpg`,
          category: formData.category,
          sort_order: items.length > 0 ? items[0].sort_order + 1 : 1
        };
      }

      const dbRes = await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!dbRes.ok) {
        const errData = await dbRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Database insertion failed');
      }
      
      setUploadProgress(100);
      setUploadPopup({ show: true, type: 'success', message: 'Successfully added to portfolio! It is now visible in the list below.' });
      
      // Reset Form
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setFormData({ title: '', description: '', musicText: '', duration: '', video_id: '', thumbnail_url: '', category: 'Both', case_study: '' });
      
      // Refresh list
      fetchItems();

    } catch (err) {
      console.error(err);
      let errorMsg = err.message || 'An error occurred during upload';
      if (errorMsg === 'Network error during upload' || errorMsg === 'Upload to R2 failed') {
        errorMsg += '. This is usually caused by missing CORS configuration on your Cloudflare R2 bucket.';
      }
      setUploadPopup({ show: true, type: 'error', message: errorMsg });
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

  const openEditPopup = (id, field, currentVal) => {
    setEditPopup({ show: true, id, field, value: currentVal || '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false });
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

        .hover-pop-btn:hover {
            transform: scale(1.05);
            background: rgba(235, 215, 63, 0.2) !important;
            border-color: rgba(235, 215, 63, 0.5) !important;
        }
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
        .upload-card {
            background: linear-gradient(145deg, rgba(25, 25, 25, 0.7) 0%, rgba(10, 10, 10, 0.9) 100%);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 28px;
            padding: 45px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 20px rgba(255,255,255,0.02), 0 0 100px rgba(235, 215, 63, 0.12);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            transform: translateZ(0); /* Fixes blocky backdrop-filter clipping bug in Chromium */
            will-change: transform;
            overflow: visible;
        }
        .upload-card:hover {
            box-shadow: 0 40px 80px rgba(0,0,0,0.7), inset 0 1px 20px rgba(255,255,255,0.03);
            border-color: rgba(235, 215, 63, 0.15);
        }
        .file-drop-area {
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 50px 20px;
            text-align: center;
            background: rgba(255, 255, 255, 0.02);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .file-drop-area:hover, .file-drop-area.drag-active {
            border-color: #ebd73f;
            background: rgba(235, 215, 63, 0.05);
            transform: translateY(-2px);
        }
        .file-drop-area.drag-active {
            background: rgba(235, 215, 63, 0.15);
            transform: scale(1.02);
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
            font-family: 'Clash Display', sans-serif;
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
            font-family: 'Clash Display', sans-serif;
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
            font-family: 'Clash Display', sans-serif;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            width: 100%;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 40px rgba(235, 215, 63, 0.25);
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
            box-shadow: 0 0 50px rgba(235, 215, 63, 0.4);
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
            width: 100%; height: 100%;
            background: radial-gradient(circle at center, rgba(235, 215, 63, 0.05) 0%, transparent 60%);
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
        .item-thumbnail.reel-ratio {
            width: 50.6px;
            height: 90px;
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
            font-family: 'Clash Display', sans-serif;
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
            font-family: 'Clash Display', sans-serif;
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
            top: 40px;
            left: 50%;
            padding: 20px 35px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 25px 50px rgba(0,0,0,0.6);
            animation: slideDown 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(20px);
        }
        .notification.success { background: linear-gradient(135deg, rgba(34,197,94,0.9), rgba(22,163,74,0.9)); }
        .notification.error { background: linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.9)); }
        @keyframes slideDown {
            0% { transform: translate(-50%, -40px) scale(0.9); opacity: 0; }
            100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        .upload-popup-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(35px);
            -webkit-backdrop-filter: blur(35px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.4s ease;
        }
        .upload-popup {
            background: linear-gradient(145deg, rgba(25, 25, 25, 0.8) 0%, rgba(8, 8, 8, 0.98) 100%);
            backdrop-filter: blur(50px);
            -webkit-backdrop-filter: blur(50px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            border-left: 1px solid rgba(255, 255, 255, 0.12);
            padding: 50px 45px;
            border-radius: 36px;
            text-align: center;
            max-width: 460px;
            width: 90%;
            box-shadow: 0 40px 100px rgba(0,0,0,0.9), inset 0 2px 20px rgba(255,255,255,0.04);
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            font-family: 'Clash Display', sans-serif;
            position: relative;
            overflow: hidden;
            transform: translateZ(0); /* Hardware acceleration */
        }
        .upload-popup::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 100%;
            background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
            pointer-events: none;
        }
        .upload-popup.success {
            box-shadow: 0 50px 100px rgba(0,0,0,0.9), inset 0 0 60px rgba(34,197,94,0.06), 0 0 120px rgba(34,197,94,0.15);
            border-color: rgba(34,197,94,0.35);
            border-top-color: rgba(34,197,94,0.6);
        }
        .upload-popup.error {
            box-shadow: 0 50px 100px rgba(0,0,0,0.9), inset 0 0 60px rgba(239,68,68,0.06), 0 0 120px rgba(239,68,68,0.15);
            border-color: rgba(239,68,68,0.35);
            border-top-color: rgba(239,68,68,0.6);
        }
        .upload-popup .popup-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 96px; height: 96px;
            border-radius: 50%;
            margin-bottom: 28px;
        }
        .upload-popup.success .popup-icon {
            background: linear-gradient(145deg, rgba(34,197,94,0.2), rgba(22,163,74,0.05));
            color: #4ade80;
            box-shadow: 0 0 50px rgba(34,197,94,0.25), inset 0 2px 15px rgba(255,255,255,0.15);
        }
        .upload-popup.error .popup-icon {
            background: linear-gradient(145deg, rgba(239,68,68,0.2), rgba(220,38,38,0.05));
            color: #f87171;
            box-shadow: 0 0 50px rgba(239,68,68,0.25), inset 0 2px 15px rgba(255,255,255,0.15);
        }
        .upload-popup h3 {
            font-family: 'Panchang', sans-serif;
            font-size: 1.6rem;
            margin-bottom: 14px;
            color: #fff;
            letter-spacing: 1px;
            text-transform: uppercase;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        .upload-popup p {
            color: #b0b0b0;
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 35px;
            font-weight: 500;
        }
        .upload-popup .popup-btn {
            background: rgba(235, 215, 63, 0.15);
            border: 1px solid rgba(235, 215, 63, 0.4);
            color: #ebd73f;
            padding: 16px 32px;
            border-radius: 16px;
            font-family: 'Clash Display', sans-serif;
            font-size: 1.15rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            width: 100%;
            position: relative;
            z-index: 1;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .upload-popup.success .popup-btn {
            background: linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.05) 100%);
            color: #4ade80;
            border-color: rgba(34,197,94,0.4);
            box-shadow: 0 10px 30px rgba(34,197,94,0.15);
        }
        .upload-popup.error .popup-btn {
            background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.05) 100%);
            color: #f87171;
            border-color: rgba(239,68,68,0.4);
            box-shadow: 0 10px 30px rgba(239,68,68,0.15);
        }
        .upload-popup .popup-btn:hover {
            transform: translateY(-4px) scale(1.02);
            filter: brightness(1.2);
        }
        .upload-popup.success .popup-btn:hover {
            box-shadow: 0 15px 40px rgba(34,197,94,0.3);
            border-color: rgba(34,197,94,0.6);
        }
        .upload-popup.error .popup-btn:hover {
            box-shadow: 0 15px 40px rgba(239,68,68,0.3);
            border-color: rgba(239,68,68,0.6);
        }
        @keyframes popIn {
            0% { transform: scale(0.8) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .custom-file-input {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 16px;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.4s ease;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .custom-file-input:hover {
            border-color: rgba(235, 215, 63, 0.5);
            background: rgba(10, 10, 10, 0.6);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(235, 215, 63, 0.1), inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .file-icon-wrapper {
            background: rgba(235, 215, 63, 0.1);
            border-radius: 10px;
            padding: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .browse-btn {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            padding: 8px 16px;
            border-radius: 10px;
            font-family: 'Clash Display', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .custom-file-input:hover .browse-btn {
            background: #ebd73f;
            color: #000;
        }
        
        .info-tooltip-wrapper {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #888;
            transition: color 0.3s;
            margin-left: 5px;
        }
        .info-tooltip-wrapper:hover {
            color: #ebd73f;
        }
        .info-tooltip-content {
            position: absolute;
            bottom: 150%;
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            opacity: 0;
            visibility: hidden;
            background: linear-gradient(145deg, rgba(20,20,20,0.95), rgba(5,5,5,0.98));
            border: 1px solid rgba(235, 215, 63, 0.3);
            box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(235, 215, 63, 0.1);
            color: #fff;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 0.8rem;
            white-space: nowrap;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 100;
            backdrop-filter: blur(10px);
            pointer-events: none;
        }
        .info-tooltip-content::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -6px;
            border-width: 6px;
            border-style: solid;
            border-color: rgba(235, 215, 63, 0.3) transparent transparent transparent;
        }
        .info-tooltip-wrapper:hover .info-tooltip-content {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }
      `}</style>

      {notification && (
          <div className={`notification ${notification.type}`}>
              {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              {notification.message}
          </div>
      )}

      {editPopup.show && (
          <div className="upload-popup-overlay" onClick={() => setEditPopup({ show: false, id: null, field: '', value: '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false })}>
              <div className="upload-popup" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', background: 'linear-gradient(180deg, rgba(15,15,15,0.95) 0%, rgba(5,5,5,0.95) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(235, 215, 63, 0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)' }}>
                  {editPopup.field !== 'extract_frame' && (
                      <div className="popup-icon" style={{ background: 'linear-gradient(145deg, rgba(235, 215, 63, 0.2), rgba(212, 188, 28, 0.05))', color: '#ebd73f', boxShadow: '0 0 50px rgba(235, 215, 63, 0.25), inset 0 2px 15px rgba(255,255,255,0.15)', margin: '0 auto 28px auto' }}>
                          <Edit2 size={42} />
                      </div>
                  )}
                  <h3 style={{ textAlign: 'center' }}>
                      {editPopup.field === 'extract_frame' ? 'CHOOSE THUMBNAIL' : (
                          <>
                              Edit {
                                  editPopup.field === 'description' ? 'Caption' : 
                                  editPopup.field === 'case_study' ? 'Case Study' : 
                                  editPopup.field === 'category' ? 'Category' : 
                                  editPopup.field === 'details' ? 'Details' :
                                  (editPopup.field === 'videoSrc' || editPopup.field === 'image_url' || editPopup.field === 'thumbnail_url') ? 'Media URL' : 'Title'
                              }
                          </>
                      )}
                  </h3>
                  {editPopup.field !== 'extract_frame' && (
                      <p style={{ textAlign: 'center' }}>Update the value below and save your changes to apply them live.</p>
                  )}
                  

                  {editPopup.field === 'details' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '35px' }}>
                          {activeTab !== TABS.GRAPHICS && (
                              <div>
                                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>{activeTab === TABS.LONG_FORM ? 'Title' : 'Description / Caption'}</label>
                                  <input 
                                    type="text" 
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Clash Display, sans-serif' }}
                                    value={editPopup.value.title || ''} 
                                    onChange={e => setEditPopup({...editPopup, value: {...editPopup.value, title: e.target.value}})} 
                                  />
                              </div>
                          )}
                          
                          {(activeTab === TABS.REELS || activeTab === TABS.LONG_FORM) && (
                              <div>
                                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>Category</label>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                      {['Videography', 'Editing', 'Both'].map((cat) => {
                                          const isActive = editPopup.value.category === cat;
                                          return (
                                              <button
                                                  type="button"
                                                  key={cat}
                                                  onClick={() => setEditPopup({...editPopup, value: {...editPopup.value, category: cat}})}
                                                  style={{
                                                      width: '100%', padding: '10px 0', borderRadius: '8px',
                                                      background: isActive ? 'rgba(235, 215, 63, 0.15)' : 'transparent',
                                                      border: `1px solid ${isActive ? 'rgba(235, 215, 63, 0.3)' : 'transparent'}`,
                                                      color: isActive ? '#ebd73f' : '#888', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif', fontSize: '0.9rem'
                                                  }}
                                              >
                                                  {cat}
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          )}

                          {activeTab === TABS.GRAPHICS && (
                              <div>
                                  <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '0.9rem' }}>Category</label>
                                  <input 
                                    type="text" 
                                    placeholder="e.g. Logo Design"
                                    style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Clash Display, sans-serif' }}
                                    value={editPopup.value.category || ''} 
                                    onChange={e => setEditPopup({...editPopup, value: {...editPopup.value, category: e.target.value}})} 
                                  />
                              </div>
                          )}

                          {activeTab === TABS.REELS && (
                              <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <label style={{ color: '#888', fontSize: '0.9rem', margin: 0 }}>Case Study</label>
                                      <button 
                                        type="button" 
                                        style={{ 
                                          background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15), rgba(212, 188, 28, 0.05))', 
                                          border: '1px solid rgba(235, 215, 63, 0.4)', 
                                          color: '#ebd73f', 
                                          padding: '4px 10px', 
                                          borderRadius: '12px', 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          gap: '6px',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}
                                        className="hover-pop-btn"
                                        onClick={() => {
                                            const currentItem = items.find(i => i.id === editPopup.id);
                                            if (currentItem) {
                                                const videoSrc = currentItem.videoSrc || currentItem.video_url;
                                                if (videoSrc) {
                                                    window.dispatchEvent(new CustomEvent('ORLO_VIDEO_ANALYZE', { detail: { videoUrl: videoSrc } }));
                                                } else {
                                                    showNotification('error', 'No video found for this item to analyze.');
                                                }
                                            }
                                        }}
                                      >
                                          <Sparkles size={12} /> Ask Orlo to Fill
                                      </button>
                                  </div>
                                  <textarea 
                                      style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Clash Display, sans-serif', minHeight: '120px' }}
                                      value={editPopup.value.case_study || ''}
                                      onChange={e => setEditPopup({...editPopup, value: {...editPopup.value, case_study: e.target.value}})}
                                      placeholder="Discuss cinematography, editing, pacing, or transformation..."
                                  />
                              </div>
                          )}
                      </div>
                  ) : editPopup.field === 'category' ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '35px', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {['Videography', 'Editing', 'Both'].map((cat) => {
                              const isActive = editPopup.value === cat;
                              return (
                                  <button
                                      type="button"
                                      key={cat}
                                      onClick={() => setEditPopup({...editPopup, value: cat})}
                                      style={{
                                          width: '100%', padding: '12px 0', borderRadius: '14px',
                                          background: isActive ? 'rgba(235, 215, 63, 0.15)' : 'transparent',
                                          border: `1px solid ${isActive ? 'rgba(235, 215, 63, 0.3)' : 'transparent'}`,
                                          color: isActive ? '#ebd73f' : '#888', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif'
                                      }}
                                  >
                                      {cat}
                                  </button>
                              );
                          })}
                      </div>
                  ) : editPopup.field === 'case_study' ? (
                      <textarea 
                          style={{ width: '100%', padding: '18px 24px', borderRadius: '16px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', marginBottom: '35px', fontSize: '1rem', outline: 'none', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Clash Display, sans-serif', minHeight: '150px' }}
                          value={editPopup.value}
                          onChange={e => setEditPopup({...editPopup, value: e.target.value})}
                          autoFocus
                      />
                  ) : editPopup.field === 'extract_frame' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
                          <div style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(235, 215, 63, 0.4)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', background: '#000', marginBottom: '20px' }}>
                              <video 
                                  id="frame-extractor-video"
                                  src={editPopup.value ? (editPopup.value + (editPopup.value.includes('?') ? '&' : '?') + 'cors=1') : ''} 
                                  crossOrigin="anonymous" 
                                  controls={false}
                                  preload="auto"
                                  muted
                                  playsInline
                                  style={{ width: '100%', maxWidth: '240px', margin: '0 auto', display: 'block', aspectRatio: '9/16', objectFit: 'cover', borderRadius: '8px' }}
                                  onTimeUpdate={(e) => {
                                      if (e.target.duration && !editPopup.isScrubbing) {
                                          setEditPopup(prev => ({ ...prev, scrubPercent: (e.target.currentTime / e.target.duration) * 100 }));
                                      }
                                  }}
                              />
                          </div>
                          <div style={{ position: 'relative', width: '100%', height: '60px', display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#111' }}>
                              {editPopup.generatingFilmstrip ? (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.8rem', fontFamily: 'Clash Display, sans-serif' }}>
                                      <div style={{ animation: 'pulse 1.5s infinite' }}>Generating frames...</div>
                                  </div>
                              ) : editPopup.filmstrip && editPopup.filmstrip.length > 0 ? (
                                  <>
                                      {editPopup.filmstrip.map((frame, i) => (
                                          <img key={i} src={frame} style={{ flex: 1, objectFit: 'cover', height: '100%', opacity: 0.8 }} alt={`frame-${i}`} />
                                      ))}
                                      
                                      {/* Scrubber Thumb Border */}
                                      <div style={{ 
                                          position: 'absolute', 
                                          top: 0, 
                                          left: `calc(${editPopup.scrubPercent}% - ${editPopup.scrubPercent === 100 ? 40 : editPopup.scrubPercent === 0 ? 0 : 20}px)`, 
                                          width: '40px', 
                                          height: '100%', 
                                          border: '3px solid #ebd73f', 
                                          borderRadius: '6px', 
                                          pointerEvents: 'none',
                                          boxShadow: '0 0 15px rgba(235, 215, 63, 0.4), inset 0 0 10px rgba(235, 215, 63, 0.2)',
                                          background: 'rgba(255,255,255,0.1)',
                                          transition: editPopup.isScrubbing ? 'none' : 'left 0.1s linear'
                                      }}></div>
                                      
                                      {/* Invisible Range Input */}
                                      <input 
                                          type="range" 
                                          min="0" 
                                          max="100" 
                                          step="0.1" 
                                          value={editPopup.scrubPercent || 0}
                                          onMouseDown={() => setEditPopup(prev => ({ ...prev, isScrubbing: true }))}
                                          onMouseUp={() => setEditPopup(prev => ({ ...prev, isScrubbing: false }))}
                                          onTouchStart={() => setEditPopup(prev => ({ ...prev, isScrubbing: true }))}
                                          onTouchEnd={() => setEditPopup(prev => ({ ...prev, isScrubbing: false }))}
                                          onChange={(e) => {
                                              const percent = parseFloat(e.target.value);
                                              setEditPopup(prev => ({ ...prev, scrubPercent: percent }));
                                              const videoEl = document.getElementById('frame-extractor-video');
                                              if (videoEl && videoEl.duration) {
                                                  videoEl.currentTime = (percent / 100) * videoEl.duration;
                                              }
                                          }}
                                          style={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              opacity: 0,
                                              cursor: 'ew-resize'
                                          }}
                                      />
                                  </>
                              ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '0.8rem', fontFamily: 'Clash Display, sans-serif' }}>
                                      No frames available
                                  </div>
                              )}
                          </div>
                          {editPopup.isUploading && (
                              <div style={{ width: '100%', marginTop: '24px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: '#ebd73f', fontWeight: '500' }}>
                                      <span>Extracting & Saving...</span>
                                      <span>{editPopup.progress}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                      <div style={{ width: `${editPopup.progress}%`, height: '100%', background: 'linear-gradient(90deg, rgba(212, 188, 28, 1), rgba(235, 215, 63, 1))', borderRadius: '10px', transition: 'width 0.3s ease', boxShadow: '0 0 10px rgba(235, 215, 63, 0.5)' }}></div>
                                  </div>
                              </div>
                          )}
                      </div>
                  ) : (
                      <input 
                        type="text" 
                        style={{ width: '100%', padding: '18px 24px', borderRadius: '16px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', marginBottom: '35px', fontSize: '1.1rem', outline: 'none', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Clash Display, sans-serif' }}
                        value={editPopup.value} 
                        onChange={e => setEditPopup({...editPopup, value: e.target.value})} 
                        autoFocus
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                document.getElementById('saveEditBtn').click();
                            }
                        }}
                      />
                  )}
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="popup-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none', padding: '10px 16px', fontSize: '0.85rem' }} onClick={() => setEditPopup({ show: false, id: null, field: '', value: '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false })}>
                        CANCEL
                    </button>
                    <button id="saveEditBtn" type="button" className="popup-btn" style={{ background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(212, 188, 28, 0.05) 100%)', color: '#ebd73f', borderColor: 'rgba(235, 215, 63, 0.4)', padding: '10px 24px', fontSize: '0.85rem' }} disabled={editPopup.isUploading} onClick={async () => {
                        if (editPopup.field === 'extract_frame') {
                            setEditPopup(prev => ({ ...prev, isUploading: true, progress: 10 }));
                            try {
                                const videoEl = document.getElementById('frame-extractor-video');
                                if (!videoEl) throw new Error("Video element not found");
                                
                                const canvas = document.createElement('canvas');
                                const MAX_WIDTH = 300;
                                let width = videoEl.videoWidth || 1080;
                                let height = videoEl.videoHeight || 1920;
                                
                                if (width > MAX_WIDTH) {
                                    height = Math.floor((MAX_WIDTH / width) * height);
                                    width = MAX_WIDTH;
                                }
                                
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                                
                                setEditPopup(prev => ({ ...prev, progress: 30 }));
                                
                                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.5));
                                const fileToUpload = new File([blob], `thumbnail_${Date.now()}.jpg`, { type: 'image/jpeg' });
                                
                                const presignRes = await fetch('/api/admin/portfolio/upload-url', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        fileName: fileToUpload.name,
                                        contentType: fileToUpload.type,
                                        folder: 'Reels'
                                    })
                                });
                                
                                if (!presignRes.ok) throw new Error('Failed to get upload URL');
                                const { presignedUrl, publicUrl } = await presignRes.json();
                                
                                setEditPopup(prev => ({ ...prev, progress: 50 }));
                                
                                await new Promise((resolve, reject) => {
                                    const xhr = new XMLHttpRequest();
                                    xhr.open('PUT', presignedUrl, true);
                                    xhr.setRequestHeader('Content-Type', fileToUpload.type);
                                    xhr.upload.onprogress = (e) => {
                                        if (e.lengthComputable) {
                                            const percentComplete = 50 + Math.round((e.loaded / e.total) * 40);
                                            setEditPopup(prev => ({ ...prev, progress: percentComplete }));
                                        }
                                    };
                                    xhr.onload = () => {
                                        if (xhr.status >= 200 && xhr.status < 300) resolve();
                                        else reject(new Error('Upload to R2 failed'));
                                    };
                                    xhr.onerror = () => reject(new Error('Network error during upload'));
                                    xhr.send(fileToUpload);
                                });
                                
                                setEditPopup(prev => ({ ...prev, progress: 95 }));
                                
                                const res = await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: editPopup.id, thumbnail_url: publicUrl })
                                });
                                if (res.ok) {
                                    showNotification('success', 'Thumbnail extracted and saved successfully');
                                    fetchItems();
                                    setEditPopup({ show: false, id: null, field: '', value: '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false });
                                } else {
                                    throw new Error('Update failed');
                                }
                            } catch (err) {
                                console.error(err);
                                showNotification('error', err.message || 'Failed to extract frame');
                                setEditPopup(prev => ({ ...prev, isUploading: false }));
                            }
                            return;
                        }

                        try {
                          let updateBody = { id: editPopup.id };
                          if (editPopup.field === 'details') {
                             if (activeTab === TABS.LONG_FORM) {
                                 updateBody.title = editPopup.value.title.trim();
                             } else if (activeTab === TABS.REELS) {
                                 updateBody.description = editPopup.value.title.trim();
                             }
                             if (activeTab === TABS.REELS || activeTab === TABS.LONG_FORM || activeTab === TABS.GRAPHICS) {
                                 updateBody.category = editPopup.value.category;
                             }
                             if (activeTab === TABS.REELS) {
                                 updateBody.case_study = editPopup.value.case_study.trim();
                             }
                          } else {
                             updateBody[editPopup.field] = typeof editPopup.value === 'string' ? editPopup.value.trim() : editPopup.value;
                          }

                          const res = await fetch(`/api/admin/portfolio/manage/${activeTab}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateBody)
                          });
                          if (res.ok) {
                            showNotification('success', 'Updated successfully');
                            fetchItems();
                            setEditPopup({ show: false, id: null, field: '', value: '', isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false });
                          } else {
                            throw new Error('Update failed');
                          }
                        } catch (e) {
                          showNotification('error', 'Failed to update');
                        }
                    }}>
                        {editPopup.field === 'extract_frame' ? (editPopup.isUploading ? `Uploading (${editPopup.progress}%)...` : 'SAVE') : 'Save Changes'}
                    </button>
                  </div>
              </div>
          </div>
      )}

      {uploadPopup.show && (
          <div className="upload-popup-overlay">
              <div className={`upload-popup ${uploadPopup.type}`}>
                  <div className="popup-icon">
                      {uploadPopup.type === 'success' ? <CheckCircle2 size={42} /> : <AlertCircle size={42} />}
                  </div>
                  <h3>{uploadPopup.type === 'success' ? 'Upload Successful!' : 'Upload Failed'}</h3>
                  <p>{uploadPopup.message}</p>
                  <button type="button" className="popup-btn" onClick={closeUploadPopup}>
                      {uploadPopup.type === 'success' ? 'Awesome' : 'Try Again'}
                  </button>
              </div>
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
            {(activeTab === TABS.REELS || activeTab === TABS.LONG_FORM) && (
                <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Category <span style={{ color: '#ebd73f', opacity: 0.8 }}>(Video Type)</span>
                    </label>
                    <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '8px', 
                        background: 'rgba(0,0,0,0.5)', 
                        padding: '8px', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
                    }}>
                        {['Videography', 'Editing', 'Both'].map((cat) => {
                            const isActive = formData.category === cat;
                            return (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => setFormData({...formData, category: cat})}
                                    style={{
                                        width: '100%',
                                        position: 'relative',
                                        padding: '14px 0',
                                        borderRadius: '16px',
                                        background: isActive ? 'linear-gradient(145deg, rgba(235, 215, 63, 0.15) 0%, rgba(212, 188, 28, 0.05) 100%)' : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(235, 215, 63, 0.3)' : 'transparent'}`,
                                        color: isActive ? '#ebd73f' : '#666',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        fontFamily: 'Clash Display, sans-serif',
                                        fontWeight: isActive ? '600' : '500',
                                        fontSize: '1rem',
                                        letterSpacing: '0.5px',
                                        overflow: 'hidden',
                                        boxShadow: isActive ? '0 8px 25px rgba(235, 215, 63, 0.15)' : 'none'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.color = '#aaa';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#666';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.currentTarget.style.transform = 'scale(0.96)';
                                    }}
                                    onMouseUp={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        } else {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                >
                                    {isActive && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'radial-gradient(circle at 50% -20%, rgba(235, 215, 63, 0.4), transparent 60%)',
                                            pointerEvents: 'none',
                                            opacity: 0.8
                                        }} />
                                    )}
                                    <span style={{ 
                                        position: 'relative', 
                                        zIndex: 1, 
                                        textShadow: isActive ? '0 2px 10px rgba(235, 215, 63, 0.3)' : 'none'
                                    }}>
                                        {cat === 'Both' ? 'Both (Everything)' : cat}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeTab === TABS.GRAPHICS && (
                <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Category <span style={{ color: '#ebd73f', opacity: 0.8 }}>(Graphic Type)</span>
                    </label>
                    <div style={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px', 
                        background: 'rgba(0,0,0,0.5)', 
                        padding: '8px', 
                        borderRadius: '20px', 
                        border: '1px solid rgba(255,255,255,0.04)',
                        boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.8)'
                    }}>
                        {graphicCategories.map((cat) => {
                            const isActive = formData.category === cat || (!formData.category && graphicCategories[0] === cat);
                            return (
                                <button
                                    type="button"
                                    key={cat}
                                    onClick={() => { setFormData({...formData, category: cat}); setShowCustomGraphicCategory(false); }}
                                    style={{
                                        flex: '1 1 auto',
                                        position: 'relative',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        background: isActive ? 'linear-gradient(145deg, rgba(235, 215, 63, 0.15) 0%, rgba(212, 188, 28, 0.05) 100%)' : 'transparent',
                                        border: `1px solid ${isActive ? 'rgba(235, 215, 63, 0.3)' : 'transparent'}`,
                                        color: isActive ? '#ebd73f' : '#666',
                                        cursor: 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        fontFamily: 'Clash Display, sans-serif',
                                        fontWeight: isActive ? '600' : '500',
                                        fontSize: '0.95rem',
                                        letterSpacing: '0.5px'
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setShowCustomGraphicCategory(true)}
                            style={{
                                flex: '1 1 auto',
                                padding: '12px 16px',
                                borderRadius: '16px',
                                background: showCustomGraphicCategory ? 'rgba(255,255,255,0.05)' : 'transparent',
                                border: '1px dashed rgba(255,255,255,0.2)',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontFamily: 'Clash Display, sans-serif',
                                fontSize: '0.95rem'
                            }}
                        >
                            + Add Custom
                        </button>
                    </div>
                    {showCustomGraphicCategory && (
                        <input 
                            type="text"
                            placeholder="Type new category..."
                            value={formData.category && !graphicCategories.includes(formData.category) ? formData.category : ''}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            style={{ marginTop: '12px', width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.3)', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'Clash Display, sans-serif' }}
                            autoFocus
                        />
                    )}
                </div>
            )}
            
            {(activeTab === TABS.REELS || activeTab === TABS.LONG_FORM) && (
                 <div className="input-group" style={{ marginBottom: '24px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ margin: 0 }}>Title / Caption</label>
                        <button type="button" onClick={() => {
                            if (window.dispatchEvent) {
                                window.dispatchEvent(new CustomEvent('ORLO_VIDEO_ANALYZE'));
                            }
                        }} style={{ 
                            background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(212, 188, 28, 0.05) 100%)', 
                            border: '1px solid rgba(235, 215, 63, 0.4)', 
                            borderRadius: '24px', 
                            padding: '6px 14px', 
                            fontFamily: 'Clash Display, sans-serif',
                            fontSize: '0.85rem', 
                            fontWeight: '600', 
                            color: '#ebd73f', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(235, 215, 63, 0.15)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(235, 215, 63, 0.25)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(235, 215, 63, 0.25) 0%, rgba(212, 188, 28, 0.1) 100%)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(235, 215, 63, 0.15)';
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(235, 215, 63, 0.15) 0%, rgba(212, 188, 28, 0.05) 100%)';
                        }}
                        >
                            <Sparkles size={16} /> Ask Orlo
                        </button>
                     </div>
                     <input type="text" placeholder="Video Title..." value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required={activeTab === TABS.LONG_FORM} />
                 </div>
            )}
            
            {activeTab === TABS.REELS && (
                 <div className="input-group" style={{ marginBottom: '24px' }}>
                     <label style={{ fontFamily: 'Clash Display, sans-serif' }}>Premium Case Study</label>
                     <textarea placeholder="Discuss cinematography, editing, pacing, or transformation..." rows="4" value={formData.case_study} onChange={(e) => setFormData({...formData, case_study: e.target.value})} style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', color: '#fff', fontFamily: 'inherit', resize: 'vertical' }}></textarea>
                 </div>
            )}

            {activeTab === TABS.LONG_FORM && (
                 <div className="input-group" style={{ marginBottom: '20px' }}>
                     <label style={{ fontFamily: 'Clash Display, sans-serif' }}>Description</label>
                     <textarea placeholder="Write a description or caption..." rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                 </div>
            )}

            {(activeTab === TABS.REELS || activeTab === TABS.GRAPHICS) && (
                <div 
                    className={`file-drop-area ${isDragging ? 'drag-active' : ''}`} 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        accept={activeTab === TABS.REELS ? "video/mp4,video/quicktime" : "image/*"} 
                        style={{ display: 'none' }}
                    />
                    <UploadCloud size={56} color={isDragging ? '#ebd73f' : 'rgba(235, 215, 63, 0.8)'} className="upload-icon" style={{ marginBottom: '20px', transition: 'all 0.3s ease', transform: isDragging ? 'scale(1.2) translateY(-10px)' : 'none' }} />
                    <p style={{ fontWeight: '600', fontSize: '1.1rem', color: isDragging ? '#ebd73f' : '#fff', marginBottom: '8px', transition: 'color 0.3s ease' }}>
                        {selectedFile ? selectedFile.name : (isDragging ? 'Drop it here!' : 'Click to browse or drag file here')}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                        Direct upload to Cloudflare R2 - Bypasses Vercel Limits
                    </p>
                </div>
            )}

            {activeTab === TABS.LONG_FORM && (
                <>
                <div className="form-grid">
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>YouTube Link or Video ID (Paste & Click Outside to Auto-Fetch)</label>
                        <input type="text" placeholder="e.g. https://youtu.be/..." value={formData.video_id} onChange={(e) => setFormData({...formData, video_id: e.target.value})} onBlur={handleYoutubeBlur} required />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Duration (Auto-Detected)</label>
                        <input type="text" placeholder="Auto-detected" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                    </div>
                </div>
                {/* Optional Custom Thumbnail for Long form */}
                <div style={{ marginBottom: '25px' }}>
                    <label style={{ fontSize: '0.9rem', color: '#aaa', display: 'block', marginBottom: '10px', fontWeight: '500', letterSpacing: '0.5px' }}>
                        Custom Thumbnail (Optional - defaults to YouTube)
                    </label>
                    <div className="custom-file-input" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{ display: 'none' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                            <div className="file-icon-wrapper">
                                <ImageIcon size={20} color="#ebd73f" />
                            </div>
                            <span style={{ color: selectedFile ? '#ebd73f' : '#888', fontWeight: selectedFile ? '600' : '400', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedFile ? selectedFile.name : 'Choose a custom thumbnail...'}
                            </span>
                        </div>
                        <div className="browse-btn">Browse</div>
                    </div>
                </div>
                </>
            )}

            {activeTab === TABS.REELS && (
                <div className="form-grid">
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontFamily: 'Clash Display, sans-serif' }}>Music Text</label>
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
                            item.thumbnail_url ? 
                                <img className="item-thumbnail reel-ratio" src={item.thumbnail_url} alt="thumbnail" style={{ objectFit: 'cover' }} /> :
                                <video className="item-thumbnail reel-ratio" src={item.videoSrc} muted preload="metadata" />
                        )}
                        {activeTab === TABS.GRAPHICS && (
                            <img className="item-thumbnail" src={item.image_url} alt="graphic" />
                        )}
                        {activeTab === TABS.LONG_FORM && (
                            <img className="item-thumbnail" src={item.thumbnail_url} alt="thumbnail" />
                        )}

                        <div className="item-info">
                            <div className="item-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'visible' }}>
                                <span 
                                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '250px' }}
                                >
                                    {activeTab === TABS.REELS ? item.description || 'Reel Video' : ''}
                                    {activeTab === TABS.GRAPHICS ? (item.category ? `Graphic: ${item.category}` : 'Graphic Design') : ''}
                                    {activeTab === TABS.LONG_FORM ? item.title : ''}
                                </span>
                                
                                {(activeTab === TABS.LONG_FORM || activeTab === TABS.REELS || activeTab === TABS.GRAPHICS) && (
                                    <>
                                        <button 
                                            onClick={() => openEditPopup(item.id, 'details', {
                                                title: activeTab === TABS.LONG_FORM ? (item.title || '') : (item.description || ''),
                                                category: item.category || (activeTab === TABS.GRAPHICS ? graphicCategories[0] : 'Both'),
                                                case_study: item.case_study || ''
                                            })}
                                            style={{ background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '8px', cursor: 'pointer', color: '#ebd73f', padding: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}
                                            title="Edit Details"
                                            className="hover-pop-btn"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        
                                        {activeTab === TABS.GRAPHICS && (
                                            <button 
                                                onClick={() => setEditorConfig({ show: true, item: item })}
                                                style={{ background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '8px', cursor: 'pointer', color: '#ebd73f', padding: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}
                                                title="Crop & Edit Image"
                                                className="hover-pop-btn"
                                            >
                                                <Crop size={16} />
                                            </button>
                                        )}

                                        {activeTab === TABS.REELS && (
                                            <button 
                                                onClick={() => {
                                                    setEditPopup({ show: true, id: item.id, field: 'extract_frame', value: item.videoSrc, isUploading: false, progress: 0, filmstrip: [], scrubPercent: 0, generatingFilmstrip: false });
                                                }}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#fff', padding: '8px', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s ease' }}
                                                title="Edit Thumbnail from Video Frames"
                                                className="hover-pop-btn"
                                            >
                                                <ImageIcon size={16} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="item-meta">
                                {(() => {
                                    const d = new Date(item.created_at);
                                    const pad = n => n.toString().padStart(2, '0');
                                    const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                                    
                                    // Use local time instead of UTC to show accurate timing
                                    let hours = d.getHours();
                                    const minutes = pad(d.getMinutes());
                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                    hours = hours % 12;
                                    hours = hours ? hours : 12; // the hour '0' should be '12'
                                    const timeStr = `${pad(hours)}:${minutes} ${ampm}`;
                                    
                                    const sizeBytes = item.file_size || fileSizes[item.id];

                                    // Extract filename from URL
                                    let url = '';
                                    if (activeTab === TABS.REELS) url = item.videoSrc;
                                    else if (activeTab === TABS.GRAPHICS) url = item.image_url;
                                    else if (activeTab === TABS.LONG_FORM) url = item.thumbnail_url;
                                    
                                    let rawName = '';
                                    if (url && url.includes('r2.dev/')) {
                                        rawName = url.split('/').pop();
                                        rawName = rawName.replace(/^\d{13}_/, ''); // Remove the Date.now()_ prefix
                                        try { rawName = decodeURIComponent(rawName); } catch(e) {}
                                    }

                                    const detailsText = `Added ${dateStr} at ${timeStr}`;
                                    const titleText = activeTab === TABS.REELS ? (item.description || 'Reel Video') : activeTab === TABS.GRAPHICS ? 'Graphic Design' : item.title;
                                    
                                    return (
                                        <div className="info-tooltip-wrapper">
                                            <Info size={16} />
                                            <div className="info-tooltip-content" style={{ whiteSpace: 'normal', minWidth: '220px', textAlign: 'left', lineHeight: '1.4' }}>
                                                <strong style={{ display: 'block', marginBottom: '6px', color: '#ebd73f', fontSize: '0.9rem' }}>{titleText}</strong>
                                                <span style={{ color: '#ccc', display: 'block' }}>{detailsText}</span>
                                                {rawName && (
                                                    <span style={{ color: '#ccc', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                                                        {rawName}
                                                    </span>
                                                )}
                                                {sizeBytes ? (
                                                    <span style={{ color: '#aaa', display: 'block', marginTop: '4px', fontSize: '0.8rem' }}>
                                                        Size: {(sizeBytes / (1024*1024)).toFixed(2)} MB
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })()}
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
            {/* Image Editor Modal */}
            <ImageEditorModal 
                isOpen={editorConfig.show} 
                onClose={() => setEditorConfig({ show: false, item: null })} 
                imageUrl={editorConfig.item?.image_url} 
                onSave={handleSaveEditedImage} 
            />
            
      </div>

    </div>
  );
}
