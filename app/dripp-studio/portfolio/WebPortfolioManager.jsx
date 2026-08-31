'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Globe, PlusCircle, Sparkles, Camera, ArrowUp, ArrowDown, 
  Edit2, Trash2, Eye, EyeOff, ExternalLink, Check, X, 
  AlertCircle, CheckCircle2, RefreshCw, Layers, Cpu, BarChart3,
  FileText, ShieldCheck, UploadCloud, Crop, Maximize2, Image as ImageIcon,
  Video, Film, Play
} from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

const DEFAULT_WEB_CATEGORIES = [
  'Enterprise Digital Platform',
  'Healthcare & Clinical Web',
  'Luxury Fragrance & Commerce',
  'AI Companion & Product Web',
  'SaaS & B2B Web App',
  'E-Learning & EdTech Platform',
  'Web3 & Digital Culture',
  'Portfolio & Creative Studio',
  'Fintech & Payment Systems',
  'Hospitality & Real Estate'
];

const POPULAR_TECH_STACKS = [
  'Next.js 15', 'Next.js 14', 'React 19', 'React 18', 'TypeScript', 
  'Tailwind CSS', 'Framer Motion', 'GSAP', 'WebGL Three.js', 
  'Supabase', 'PostgreSQL', 'OpenAI API', 'Vercel AI SDK', 'Razorpay', 'Cloudflare Edge'
];

export default function WebPortfolioManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Custom categories state
  const [customCategories, setCustomCategories] = useState([]);
  const [newCustomCatInput, setNewCustomCatInput] = useState('');
  const [showCustomCatInput, setShowCustomCatInput] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    tagline: '',
    category: 'Enterprise Digital Platform',
    url: '',
    display_url: '',
    image_url: '',
    video_url: '',
    tech_stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS'],
    stats: [
      { label: 'Page Load Time', value: '0.35s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+300%' }
    ],
    pillars: [
      { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant delivery across global nodes.' },
      { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion.' },
      { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation.' }
    ],
    case_study_challenge: '',
    case_study_solution: '',
    orlo_notes: ''
  });

  const [newTechInput, setNewTechInput] = useState('');
  const [editItemModal, setEditItemModal] = useState({ show: false, item: null });
  
  // Cropper Modal State
  const [cropperModal, setCropperModal] = useState({
    isOpen: false,
    imageSrc: '',
    target: 'create', // 'create' | 'edit'
    projectTitle: ''
  });

  const fileInputCreateRef = useRef(null);
  const fileInputEditRef = useRef(null);
  const fileInputVideoCreateRef = useRef(null);
  const fileInputVideoEditRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchWebItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/portfolio/manage/web');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
      } else {
        // Fallback to public api
        const pubRes = await fetch('/api/web');
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setItems(pubData || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch web portfolio items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebItems();
  }, []);

  // Image Upload Handler (triggers Cropper)
  const handleFileUpload = (e, target = 'create') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCropperModal({
        isOpen: true,
        imageSrc: dataUrl,
        target,
        projectTitle: target === 'create' ? formData.title : (editItemModal.item?.title || '')
      });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Video Upload Handler (.mp4, .webm, .mov)
  const handleVideoUpload = (e, target = 'create') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showNotification('error', 'Please select a valid video file (MP4, WebM, MOV)');
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      showNotification('error', 'Video file is too large (max 80MB). Please compress before uploading.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      if (target === 'create') {
        setFormData(prev => ({ ...prev, video_url: dataUrl }));
      } else {
        setEditItemModal(prev => ({
          ...prev,
          item: { ...prev.item, video_url: dataUrl, video: dataUrl }
        }));
      }
      showNotification('success', '🎬 Video / Screen Recording attached successfully!');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  // Remove Video
  const handleRemoveVideo = (target = 'create') => {
    if (target === 'create') {
      setFormData(prev => ({ ...prev, video_url: '' }));
    } else {
      setEditItemModal(prev => ({
        ...prev,
        item: { ...prev.item, video_url: '', video: '' }
      }));
    }
    showNotification('success', 'Video recording removed');
  };

  // Open Cropper on existing image
  const handleOpenCropper = (imageSrc, target = 'create', title = '') => {
    if (!imageSrc) {
      showNotification('error', 'No image selected to crop. Please upload an image or enter a URL first.');
      return;
    }
    setCropperModal({
      isOpen: true,
      imageSrc,
      target,
      projectTitle: title || (target === 'create' ? formData.title : (editItemModal.item?.title || ''))
    });
  };

  // Save Cropped Image from Cropper Modal
  const handleSaveCroppedImage = (croppedDataUrl) => {
    if (cropperModal.target === 'create') {
      setFormData(prev => ({ ...prev, image_url: croppedDataUrl }));
    } else if (cropperModal.target === 'edit') {
      setEditItemModal(prev => ({
        ...prev,
        item: {
          ...prev.item,
          image_url: croppedDataUrl,
          image: croppedDataUrl
        }
      }));
    }
    showNotification('success', '✦ Screenshot cropped and framed to 16:10 successfully!');
  };

  // Remove Thumbnail
  const handleRemoveImage = (target = 'create') => {
    if (target === 'create') {
      setFormData(prev => ({ ...prev, image_url: '' }));
    } else {
      setEditItemModal(prev => ({
        ...prev,
        item: { ...prev.item, image_url: '', image: '' }
      }));
    }
    showNotification('success', 'Screenshot removed');
  };

  // Orlo AI Case Study Generator
  const handleGenerateOrloCaseStudy = async (targetFormData, setTargetForm) => {
    if (!targetFormData.title && !targetFormData.url) {
      showNotification('error', 'Please enter a Website Title or URL first');
      return;
    }

    setIsGeneratingAI(true);
    showNotification('success', '✦ Orlo AI is analyzing website architecture & generating case study...');

    try {
      const res = await fetch('/api/admin/portfolio/generate-case-study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetFormData.title,
          url: targetFormData.url,
          category: targetFormData.category,
          notes: targetFormData.orlo_notes
        })
      });

      if (res.ok) {
        const aiData = await res.json();
        setTargetForm(prev => ({
          ...prev,
          tagline: aiData.tagline || prev.tagline,
          category: aiData.category || prev.category,
          case_study_challenge: aiData.challenge || prev.case_study_challenge,
          case_study_solution: aiData.solution || prev.case_study_solution,
          pillars: Array.isArray(aiData.pillars) && aiData.pillars.length > 0 ? aiData.pillars : prev.pillars,
          tech_stack: Array.isArray(aiData.techStack) && aiData.techStack.length > 0 ? aiData.techStack : prev.tech_stack,
          stats: Array.isArray(aiData.stats) && aiData.stats.length > 0 ? aiData.stats : prev.stats
        }));
        showNotification('success', 'Orlo AI Case Study synthesized successfully');
      } else {
        throw new Error('AI generation failed');
      }
    } catch (e) {
      showNotification('error', 'Orlo AI generation failed: ' + e.message);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Stats helpers
  const handleStatChange = (idx, field, val, isEdit = false) => {
    if (isEdit) {
      const updated = [...(editItemModal.item.stats || [])];
      updated[idx] = { ...updated[idx], [field]: val };
      setEditItemModal(prev => ({ ...prev, item: { ...prev.item, stats: updated } }));
    } else {
      const updated = [...formData.stats];
      updated[idx] = { ...updated[idx], [field]: val };
      setFormData(prev => ({ ...prev, stats: updated }));
    }
  };

  const handleAddStat = (isEdit = false) => {
    if (isEdit) {
      setEditItemModal(prev => ({
        ...prev,
        item: {
          ...prev.item,
          stats: [...(prev.item.stats || []), { label: 'Metric Name', value: '100%' }]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        stats: [...prev.stats, { label: 'Metric Name', value: '100%' }]
      }));
    }
  };

  const handleRemoveStat = (idx, isEdit = false) => {
    if (isEdit) {
      setEditItemModal(prev => ({
        ...prev,
        item: {
          ...prev.item,
          stats: prev.item.stats.filter((_, i) => i !== idx)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        stats: prev.stats.filter((_, i) => i !== idx)
      }));
    }
  };

  // Pillar helpers
  const handlePillarChange = (idx, field, val, isEdit = false) => {
    if (isEdit) {
      const currentPillars = Array.isArray(editItemModal.item.pillars) && editItemModal.item.pillars.length > 0
        ? [...editItemModal.item.pillars]
        : [
            { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant delivery across global nodes.' },
            { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion.' },
            { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation.' }
          ];
      currentPillars[idx] = { ...currentPillars[idx], [field]: val };
      setEditItemModal(prev => ({ ...prev, item: { ...prev.item, pillars: currentPillars } }));
    } else {
      const updated = [...formData.pillars];
      updated[idx] = { ...updated[idx], [field]: val };
      setFormData(prev => ({ ...prev, pillars: updated }));
    }
  };

  // Auto-capture screenshot and prompt cropper
  const handleAutoCapture = async (targetFormData, setTargetForm) => {
    if (!targetFormData.url) {
      showNotification('error', 'Please enter a Live Website URL to capture');
      return;
    }

    setIsCapturingScreenshot(true);
    showNotification('success', 'Capturing high-resolution screenshot from live website...');

    try {
      const res = await fetch('/api/admin/portfolio/capture-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetFormData.url,
          title: targetFormData.title
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          setTargetForm(prev => ({ ...prev, image_url: data.image_url }));
          showNotification('success', 'Live screenshot captured! Opening Cropper to adjust frame...');
          setCropperModal({
            isOpen: true,
            imageSrc: data.image_url,
            target: targetFormData === formData ? 'create' : 'edit',
            projectTitle: targetFormData.title
          });
        }
      } else {
        throw new Error('Capture failed');
      }
    } catch (e) {
      showNotification('error', 'Screenshot capture error: ' + e.message);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Add / Remove Tech Stack tags
  const addTechTag = (tag, isEdit = false) => {
    const clean = tag.trim();
    if (!clean) return;
    if (isEdit) {
      if (!editItemModal.item.tech_stack.includes(clean)) {
        setEditItemModal(prev => ({
          ...prev,
          item: { ...prev.item, tech_stack: [...prev.item.tech_stack, clean] }
        }));
      }
    } else {
      if (!formData.tech_stack.includes(clean)) {
        setFormData(prev => ({ ...prev, tech_stack: [...prev.tech_stack, clean] }));
      }
    }
    setNewTechInput('');
  };

  const removeTechTag = (tag, isEdit = false) => {
    if (isEdit) {
      setEditItemModal(prev => ({
        ...prev,
        item: { ...prev.item, tech_stack: prev.item.tech_stack.filter(t => t !== tag) }
      }));
    } else {
      setFormData(prev => ({ ...prev, tech_stack: prev.tech_stack.filter(t => t !== tag) }));
    }
  };

  // Submit New Web Project
  const handleSaveNewProject = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      showNotification('error', 'Project Title and Live URL are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        tagline: formData.tagline || 'High-Performance Web Experience',
        category: formData.category || 'Enterprise Digital Platform',
        url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
        display_url: formData.display_url || formData.url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        image_url: formData.image_url || '/images/web-portfolio/bharatup.jpg',
        video_url: formData.video_url || '',
        video: formData.video_url || '',
        tech_stack: formData.tech_stack,
        stats: formData.stats,
        pillars: formData.pillars,
        case_study_challenge: formData.case_study_challenge || '',
        case_study_solution: formData.case_study_solution || '',
        is_visible: true,
        sort_order: items.length > 0 ? (items[0].sort_order || 0) + 1 : 1
      };

      const res = await fetch('/api/admin/portfolio/manage/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save to database');
      }

      showNotification('success', '✨ Web Portfolio project added successfully!');
      
      // Reset form
      setFormData({
        title: '',
        tagline: '',
        category: 'Enterprise Digital Platform',
        url: '',
        display_url: '',
        image_url: '',
        tech_stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS'],
        stats: [
          { label: 'Lighthouse Score', value: '99/100' },
          { label: 'Active Reach', value: '25K+' },
          { label: 'Page Load Speed', value: '0.4s' }
        ],
        case_study_challenge: '',
        case_study_solution: '',
        orlo_notes: ''
      });

      fetchWebItems();
    } catch (e) {
      showNotification('error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Visibility
  const toggleVisibility = async (id, currentVis) => {
    try {
      const res = await fetch('/api/admin/portfolio/manage/web', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_visible: !currentVis })
      });
      if (res.ok) {
        showNotification('success', `Visibility ${!currentVis ? 'enabled' : 'hidden'}`);
        fetchWebItems();
      }
    } catch (e) {
      showNotification('error', 'Failed to toggle visibility');
    }
  };

  // Move up/down
  const moveItem = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const item1 = newItems[index];
    const item2 = newItems[direction === 'up' ? index - 1 : index + 1];

    const tempOrder = item1.sort_order;
    item1.sort_order = item2.sort_order;
    item2.sort_order = tempOrder;

    newItems.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    setItems(newItems);

    try {
      await fetch('/api/admin/portfolio/manage/web', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item1.id, sort_order: item1.sort_order })
      });
      await fetch('/api/admin/portfolio/manage/web', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item2.id, sort_order: item2.sort_order })
      });
    } catch (e) {
      fetchWebItems();
    }
  };

  // Delete project
  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this web portfolio project?')) return;
    try {
      const res = await fetch(`/api/admin/portfolio/manage/web?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showNotification('success', 'Web project deleted');
        fetchWebItems();
      }
    } catch (e) {
      showNotification('error', 'Failed to delete web project');
    }
  };

  // Save Edit Modal Changes
  const handleSaveEdit = async () => {
    if (!editItemModal.item) return;
    try {
      const res = await fetch('/api/admin/portfolio/manage/web', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editItemModal.item)
      });
      if (res.ok) {
        showNotification('success', 'Web project updated successfully!');
        setEditItemModal({ show: false, item: null });
        fetchWebItems();
      } else {
        throw new Error('Update failed');
      }
    } catch (e) {
      showNotification('error', e.message);
    }
  };

  const allCategories = Array.from(new Set([...DEFAULT_WEB_CATEGORIES, ...customCategories]));

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          zIndex: 9999,
          background: notification.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'Clash Display, sans-serif',
          fontWeight: '600',
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Upload / Create Web Project Card */}
      <div className="upload-card-wrapper" style={{ marginBottom: '40px' }}>
        <div className="upload-card" style={{
          background: 'rgba(15, 15, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '35px',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', margin: 0, fontFamily: 'Panchang, sans-serif' }}>
              <Globe size={24} color="#ebd73f" /> Add New Web Build
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(235, 215, 63, 0.12)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              borderRadius: '20px',
              padding: '6px 16px',
              color: '#ebd73f',
              fontSize: '0.75rem',
              fontFamily: 'Panchang, sans-serif',
              fontWeight: 700
            }}>
              <Sparkles size={14} /> ORLO AI CASE STUDY INTEGRATED
            </div>
          </div>

          <form onSubmit={handleSaveNewProject}>
            {/* Row 1: Title & Live URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '22px' }}>
              <div className="input-group">
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontFamily: 'Clash Display, sans-serif' }}>
                  Project Name / Title *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. BharatUp, Pinaka Care, Goat Society..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div className="input-group">
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontFamily: 'Clash Display, sans-serif' }}>
                  Live Website URL *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    placeholder="https://www.example.com/"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#fff',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoCapture(formData, setFormData)}
                    disabled={isCapturingScreenshot}
                    style={{
                      background: 'rgba(235, 215, 63, 0.15)',
                      border: '1px solid rgba(235, 215, 63, 0.3)',
                      borderRadius: '12px',
                      padding: '0 16px',
                      color: '#ebd73f',
                      fontFamily: 'Panchang, sans-serif',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap'
                    }}
                    title="Auto-capture screenshot from live URL"
                  >
                    <Camera size={16} />
                    {isCapturingScreenshot ? 'Capturing...' : 'Auto-Capture'}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Tagline & Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '22px' }}>
              <div className="input-group">
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontFamily: 'Clash Display, sans-serif' }}>
                  Hook Tagline
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. A Home for Businesses Building What Comes Next"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="input-group">
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontFamily: 'Clash Display, sans-serif' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#111116',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                >
                  {allCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Screenshot & Visual Cropper Manager */}
            <div style={{
              marginBottom: '28px',
              background: 'rgba(20, 20, 28, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <label style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'Panchang, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={16} color="#ebd73f" /> Project Thumbnail & Preview
                  </label>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.74rem' }}>
                    Standard main page format: 16:10 chassis crop (1600 × 1000px)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputCreateRef}
                    onChange={(e) => handleFileUpload(e, 'create')}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputCreateRef.current?.click()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontFamily: 'Clash Display, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <UploadCloud size={14} /> Upload & Crop
                  </button>

                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropper(formData.image_url, 'create', formData.title)}
                      style={{
                        background: 'rgba(235, 215, 63, 0.15)',
                        border: '1px solid rgba(235, 215, 63, 0.4)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        color: '#ebd73f',
                        fontSize: '0.75rem',
                        fontFamily: 'Clash Display, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Crop size={14} /> ✦ Open Cropper (16:10)
                    </button>
                  )}

                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('create')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {formData.image_url ? (
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px', alignItems: 'center' }}>
                  <div 
                    onClick={() => handleOpenCropper(formData.image_url, 'create', formData.title)}
                    style={{
                      width: '180px',
                      aspectRatio: '16 / 10',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid rgba(235, 215, 63, 0.4)',
                      background: '#050508',
                      position: 'relative',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                    }}
                    title="Click to re-crop/adjust"
                  >
                    <img src={formData.image_url} alt="thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.75)',
                      padding: '4px',
                      textAlign: 'center',
                      fontSize: '0.62rem',
                      fontFamily: 'Panchang, sans-serif',
                      color: '#ebd73f'
                    }}>
                      CLICK TO CROP
                    </div>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      placeholder="/images/web-portfolio/my-site.jpg or https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        marginBottom: '6px'
                      }}
                    />
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
                      Tip: You can also paste an image link or local path directly.
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputCreateRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '25px',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UploadCloud size={28} color="#ebd73f" style={{ margin: '0 auto 8px' }} />
                  <div style={{ color: '#fff', fontSize: '0.85rem', fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}>
                    Click to Upload Screenshot & Frame to 16:10
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '4px' }}>
                    Or use "Auto-Capture" with your live website URL above
                  </div>
                </div>
              )}
            </div>

            {/* Screen Recording / Looping Video Showcase Section */}
            <div style={{
              marginBottom: '28px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '22px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <label style={{ color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontFamily: 'Panchang, sans-serif', fontWeight: 700 }}>
                    <Video size={16} color="#ebd73f" /> Screen Recording / Video Showcase (Looping)
                  </label>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.74rem' }}>
                    Plays silently in continuous 60fps loop with instant screenshot fallback.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputVideoCreateRef}
                    onChange={(e) => handleVideoUpload(e, 'create')}
                    accept="video/mp4,video/webm,video/quicktime"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputVideoCreateRef.current?.click()}
                    style={{
                      background: 'rgba(235, 215, 63, 0.15)',
                      border: '1px solid rgba(235, 215, 63, 0.4)',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: '#ebd73f',
                      fontSize: '0.75rem',
                      fontFamily: 'Clash Display, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <UploadCloud size={14} /> Upload Video (.mp4 / .webm)
                  </button>

                  {formData.video_url && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo('create')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                      title="Remove video"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {formData.video_url ? (
                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '220px',
                    aspectRatio: '16 / 10',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(235, 215, 63, 0.4)',
                    background: '#050508',
                    position: 'relative',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
                  }}>
                    <video
                      src={formData.video_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.8)',
                      padding: '4px',
                      textAlign: 'center',
                      fontSize: '0.6rem',
                      fontFamily: 'Panchang, sans-serif',
                      color: '#ebd73f',
                      letterSpacing: '1px'
                    }}>
                      ▶ LIVE LOOP PREVIEW
                    </div>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      placeholder="/videos/portfolio/my-demo.mp4 or https://..."
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#fff',
                        fontSize: '0.82rem',
                        fontFamily: 'inherit',
                        marginBottom: '6px'
                      }}
                    />
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>
                      Attached video will auto-loop silently with zero buffer lag.
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputVideoCreateRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Film size={24} color="#ebd73f" style={{ margin: '0 auto 6px' }} />
                  <div style={{ color: '#fff', fontSize: '0.82rem', fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}>
                    Upload Screen Recording Video (Optional)
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', marginTop: '2px' }}>
                    Supports .mp4, .webm, .mov — automatically turns the portfolio card into a looping cinematic demo
                  </div>
                </div>
              )}
            </div>

            {/* Tech Stack Tags Manager */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '8px', display: 'block', fontFamily: 'Clash Display, sans-serif' }}>
                Tech Stack Badges
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {formData.tech_stack.map((tech, idx) => (
                  <span 
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {tech}
                    <button 
                      type="button" 
                      onClick={() => removeTechTag(tech)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text"
                  placeholder="Add custom technology (e.g. Docker, Redis, GSAP)..."
                  value={newTechInput}
                  onChange={(e) => setNewTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTechTag(newTechInput); }}}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '0.85rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTechTag(newTechInput)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  + Add
                </button>
              </div>

              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#777', marginRight: '4px' }}>Quick Add:</span>
                {POPULAR_TECH_STACKS.slice(0, 8).map((tech, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => addTechTag(tech)}
                    style={{
                      background: 'none',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                  >
                    + {tech}
                  </button>
                ))}
              </div>
            </div>

            {/* ORLO AI CASE STUDY SYNTHESIZER BOX */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(15, 15, 22, 0.8) 100%)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              borderRadius: '16px',
              padding: '22px',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#ebd73f" />
                  <span style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.85rem', fontWeight: 800, color: '#ebd73f' }}>
                    ORLO AI CASE STUDY SYNTHESIZER
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateOrloCaseStudy(formData, setFormData)}
                  disabled={isGeneratingAI}
                  style={{
                    background: 'var(--brand-yellow, #ebd73f)',
                    color: '#050505',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    fontFamily: 'Panchang, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 20px rgba(235, 215, 63, 0.3)'
                  }}
                >
                  <Sparkles size={14} />
                  {isGeneratingAI ? 'Synthesizing...' : '✦ Generate Case Study with Orlo AI'}
                </button>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '14px', lineHeight: 1.4 }}>
                Enter the project name & URL above, add any brief notes below, and Orlo AI will automatically generate The Challenge, The Solution & Architecture, and Impact Metrics.
              </p>

              <input 
                type="text"
                placeholder="Optional notes for Orlo AI (e.g. 'Patient booking engine with sub-second response, dark brutalist aesthetic, Next.js 15 app router')..."
                value={formData.orlo_notes}
                onChange={(e) => setFormData({ ...formData, orlo_notes: e.target.value })}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '6px' }}>
                    THE CHALLENGE
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="The client problem or legacy limitation..."
                    value={formData.case_study_challenge}
                    onChange={(e) => setFormData({ ...formData, case_study_challenge: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '6px' }}>
                    THE SOLUTION & ARCHITECTURE
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="The architecture, engineering, and UX delivered..."
                    value={formData.case_study_solution}
                    onChange={(e) => setFormData({ ...formData, case_study_solution: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      padding: '10px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              {/* 3 Architectural Execution Pillars */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '8px' }}>
                  ✦ 3 ARCHITECTURAL EXECUTION PILLARS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {(formData.pillars || []).map((pillar, pIdx) => (
                    <div key={pIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px' }}>
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => handlePillarChange(pIdx, 'title', e.target.value, false)}
                        placeholder={`0${pIdx + 1} / TITLE`}
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '6px', padding: '6px 8px', color: '#ebd73f', fontSize: '0.72rem', fontFamily: 'Panchang, sans-serif', fontWeight: 700, marginBottom: '6px' }}
                      />
                      <textarea
                        rows="2"
                        value={pillar.desc}
                        onChange={(e) => handlePillarChange(pIdx, 'desc', e.target.value, false)}
                        placeholder="Pillar description..."
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 8px', color: '#fff', fontSize: '0.75rem', resize: 'vertical' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance & Vitals Matrix (Stats) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontFamily: 'Panchang, sans-serif' }}>
                    ✦ PERFORMANCE & VITALS MATRIX
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddStat(false)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '4px 10px', color: '#fff', fontSize: '0.72rem', cursor: 'pointer' }}
                  >
                    + Add Metric
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {(formData.stats || []).map((st, sIdx) => (
                    <div key={sIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px' }}>
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => handleStatChange(sIdx, 'value', e.target.value, false)}
                        placeholder="99/100 or 0.4s"
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(235, 215, 63, 0.4)', borderRadius: '6px', padding: '6px 8px', color: '#ebd73f', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'Panchang, sans-serif', marginBottom: '6px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => handleStatChange(sIdx, 'label', e.target.value, false)}
                          placeholder="Metric Label"
                          style={{ flex: 1, background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 8px', color: '#fff', fontSize: '0.75rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStat(sIdx, false)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Delete metric"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#ebd73f',
                  color: '#050505',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '14px 35px',
                  fontFamily: 'Panchang, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 25px rgba(235, 215, 63, 0.4)'
                }}
              >
                <PlusCircle size={18} />
                {isSubmitting ? 'Saving to Web Portfolio...' : 'Publish Web Build'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Web Projects List */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Panchang, sans-serif', fontSize: '1.2rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="#ebd73f" /> Live Web Builds ({items.length})
          </h3>
          <button 
            onClick={fetchWebItems}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '6px 14px',
              color: '#fff',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} /> Refresh List
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading web portfolio items...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(15,15,20,0.5)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)', color: '#888' }}>
            No web portfolio items yet. Add your first build above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {items.map((item, index) => {
              const isVisible = item.is_visible !== false;
              const techList = Array.isArray(item.tech_stack) 
                ? item.tech_stack 
                : (typeof item.tech_stack === 'string' ? item.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : []);

              return (
                <div 
                  key={item.id || index}
                  style={{
                    background: 'rgba(18, 18, 24, 0.85)',
                    border: `1px solid ${isVisible ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '16px',
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    transition: 'all 0.2s ease',
                    opacity: isVisible ? 1 : 0.6
                  }}
                >
                  {/* Reorder Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      style={{ background: 'none', border: 'none', color: index === 0 ? '#444' : '#ebd73f', cursor: index === 0 ? 'default' : 'pointer', padding: '2px' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      style={{ background: 'none', border: 'none', color: index === items.length - 1 ? '#444' : '#ebd73f', cursor: index === items.length - 1 ? 'default' : 'pointer', padding: '2px' }}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>

                  {/* Screenshot Thumbnail */}
                  <div style={{
                    width: '120px',
                    height: '75px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: '#000',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    <img 
                      src={item.image_url || item.image || '/images/web-portfolio/bharatup.jpg'} 
                      alt={item.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>

                  {/* Project Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'Panchang, sans-serif', fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                        {item.title}
                      </span>
                      <span style={{
                        background: 'rgba(235, 215, 63, 0.12)',
                        color: '#ebd73f',
                        border: '1px solid rgba(235, 215, 63, 0.3)',
                        borderRadius: '12px',
                        padding: '2px 8px',
                        fontSize: '0.65rem',
                        fontFamily: 'Panchang, sans-serif',
                        fontWeight: 700
                      }}>
                        {item.category}
                      </span>
                      {item.case_study_challenge && (
                        <span style={{ fontSize: '0.68rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> Case Study Ready
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.tagline || item.url}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          color: '#ebd73f',
                          fontSize: '0.78rem',
                          textDecoration: 'none'
                        }}
                      >
                        <span>{item.display_url || item.url}</span>
                        <ExternalLink size={12} />
                      </a>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        {techList.slice(0, 4).map((tech, tIdx) => (
                          <span 
                            key={tIdx} 
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              fontSize: '0.68rem',
                              color: 'rgba(255,255,255,0.8)'
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const techList = Array.isArray(item.tech_stack) ? item.tech_stack : (Array.isArray(item.techStack) ? item.techStack : []);
                        const statsList = Array.isArray(item.stats) && item.stats.length > 0 ? item.stats : [
                          { label: 'Lighthouse Score', value: '99/100' },
                          { label: 'Active Reach', value: '25K+' },
                          { label: 'Page Load Speed', value: '0.4s' }
                        ];
                        const pillarsList = Array.isArray(item.pillars) && item.pillars.length > 0 ? item.pillars : [
                          { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant delivery across global nodes.' },
                          { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion.' },
                          { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation.' }
                        ];
                        setEditItemModal({
                          show: true,
                          item: {
                            ...item,
                            tech_stack: techList,
                            stats: statsList,
                            pillars: pillarsList,
                            display_url: item.display_url || item.displayUrl || (item.url ? item.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '')
                          }
                        });
                      }}
                      style={{
                        background: 'rgba(235, 215, 63, 0.1)',
                        border: '1px solid rgba(235, 215, 63, 0.3)',
                        borderRadius: '8px',
                        color: '#ebd73f',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                      title="Edit Project"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => toggleVisibility(item.id, isVisible)}
                      style={{
                        background: isVisible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${isVisible ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                        color: isVisible ? '#10b981' : '#ef4444',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                      title={isVisible ? 'Hide from public portfolio' : 'Make live'}
                    >
                      {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Web Project Modal (Full Capabilities) */}
      {editItemModal.show && editItemModal.item && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(15px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0d0d12',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontFamily: 'Panchang, sans-serif', fontSize: '1.25rem', color: '#fff', margin: '0 0 4px 0' }}>
                  Edit Web Build: {editItemModal.item.title}
                </h3>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  Modify core metadata, media assets, Orlo AI case study blueprint, pillars, and metrics.
                </span>
              </div>
              <button 
                onClick={() => setEditItemModal({ show: false, item: null })}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Row 1: Name & URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>Project Name *</label>
                <input 
                  type="text" 
                  value={editItemModal.item.title || ''} 
                  onChange={(e) => setEditItemModal({
                    ...editItemModal,
                    item: { ...editItemModal.item, title: e.target.value }
                  })}
                  style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>Live Website URL *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    value={editItemModal.item.url || ''} 
                    onChange={(e) => setEditItemModal({
                      ...editItemModal,
                      item: { ...editItemModal.item, url: e.target.value }
                    })}
                    style={{ flex: 1, background: '#181820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoCapture(editItemModal.item, (updater) => {
                      const updated = typeof updater === 'function' ? updater(editItemModal.item) : updater;
                      setEditItemModal({ ...editItemModal, item: updated });
                    })}
                    disabled={isCapturingScreenshot}
                    style={{
                      background: 'rgba(235, 215, 63, 0.15)',
                      border: '1px solid rgba(235, 215, 63, 0.3)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      color: '#ebd73f',
                      fontSize: '0.72rem',
                      cursor: 'pointer'
                    }}
                    title="Auto-capture screenshot"
                  >
                    <Camera size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Tagline, Category, Display URL Capsule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 0.9fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>Tagline</label>
                <input 
                  type="text" 
                  value={editItemModal.item.tagline || ''} 
                  onChange={(e) => setEditItemModal({
                    ...editItemModal,
                    item: { ...editItemModal.item, tagline: e.target.value }
                  })}
                  style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>Category</label>
                <select
                  value={editItemModal.item.category || allCategories[0]}
                  onChange={(e) => setEditItemModal({
                    ...editItemModal,
                    item: { ...editItemModal.item, category: e.target.value }
                  })}
                  style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                >
                  {allCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>Display URL Capsule</label>
                <input 
                  type="text" 
                  placeholder="e.g. bharatup.online"
                  value={editItemModal.item.display_url || editItemModal.item.displayUrl || ''} 
                  onChange={(e) => setEditItemModal({
                    ...editItemModal,
                    item: { ...editItemModal.item, display_url: e.target.value, displayUrl: e.target.value }
                  })}
                  style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Screenshot Image Section in Edit Modal */}
            <div style={{
              marginBottom: '16px',
              background: '#14141c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', color: '#fff', fontFamily: 'Panchang, sans-serif', fontWeight: 700 }}>
                  Project Thumbnail (16:10 Chassis Frame)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputEditRef}
                    onChange={(e) => handleFileUpload(e, 'edit')}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputEditRef.current?.click()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <UploadCloud size={13} /> Upload & Crop
                  </button>

                  {(editItemModal.item.image_url || editItemModal.item.image) && (
                    <button
                      type="button"
                      onClick={() => handleOpenCropper(editItemModal.item.image_url || editItemModal.item.image, 'edit', editItemModal.item.title)}
                      style={{
                        background: 'rgba(235, 215, 63, 0.15)',
                        border: '1px solid rgba(235, 215, 63, 0.4)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#ebd73f',
                        fontSize: '0.72rem',
                        fontFamily: 'Panchang, sans-serif',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Crop size={13} /> Open Cropper
                    </button>
                  )}

                  {(editItemModal.item.image_url || editItemModal.item.image) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('edit')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '12px', alignItems: 'center' }}>
                <div 
                  onClick={() => handleOpenCropper(editItemModal.item.image_url || editItemModal.item.image, 'edit', editItemModal.item.title)}
                  style={{
                    width: '130px',
                    aspectRatio: '16 / 10',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(235, 215, 63, 0.3)',
                    background: '#050508',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title="Click to crop"
                >
                  <img 
                    src={editItemModal.item.image_url || editItemModal.item.image || '/images/web-portfolio/bharatup.jpg'} 
                    alt="thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.7)',
                    padding: '2px',
                    textAlign: 'center',
                    fontSize: '0.55rem',
                    fontFamily: 'Panchang, sans-serif',
                    color: '#ebd73f'
                  }}>
                    CROP
                  </div>
                </div>
                <input 
                  type="text" 
                  value={editItemModal.item.image_url || editItemModal.item.image || ''} 
                  onChange={(e) => setEditItemModal({
                    ...editItemModal,
                    item: { ...editItemModal.item, image_url: e.target.value, image: e.target.value }
                  })}
                  placeholder="/images/web-portfolio/... or https://..."
                  style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Video / Screen Recording Section in Edit Modal */}
            <div style={{
              marginBottom: '16px',
              background: '#14141c',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', color: '#fff', fontFamily: 'Panchang, sans-serif', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={14} color="#ebd73f" /> Screen Recording Video (Looping)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={fileInputVideoEditRef}
                    onChange={(e) => handleVideoUpload(e, 'edit')}
                    accept="video/mp4,video/webm,video/quicktime"
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputVideoEditRef.current?.click()}
                    style={{
                      background: 'rgba(235, 215, 63, 0.15)',
                      border: '1px solid rgba(235, 215, 63, 0.4)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#ebd73f',
                      fontSize: '0.72rem',
                      fontFamily: 'Clash Display, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <UploadCloud size={13} /> Upload Video
                  </button>

                  {(editItemModal.item.video_url || editItemModal.item.video) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo('edit')}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Remove video"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {(editItemModal.item.video_url || editItemModal.item.video) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '150px',
                    aspectRatio: '16 / 10',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid rgba(235, 215, 63, 0.3)',
                    background: '#050508',
                    position: 'relative'
                  }}>
                    <video
                      src={editItemModal.item.video_url || editItemModal.item.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.8)',
                      padding: '2px',
                      textAlign: 'center',
                      fontSize: '0.52rem',
                      fontFamily: 'Panchang, sans-serif',
                      color: '#ebd73f'
                    }}>
                      LOOPING
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={editItemModal.item.video_url || editItemModal.item.video || ''} 
                    onChange={(e) => setEditItemModal({
                      ...editItemModal,
                      item: { ...editItemModal.item, video_url: e.target.value, video: e.target.value }
                    })}
                    placeholder="/videos/portfolio/... or https://..."
                    style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.8rem' }}
                  />
                </div>
              ) : (
                <div 
                  onClick={() => fileInputVideoEditRef.current?.click()}
                  style={{
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ color: '#ebd73f', fontSize: '0.75rem', fontFamily: 'Clash Display, sans-serif' }}>
                    + Upload .mp4 / .webm video recording
                  </span>
                </div>
              )}
            </div>

            {/* Tech Stack Tags Manager in Edit Modal */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '6px', fontFamily: 'Clash Display, sans-serif' }}>
                Tech Stack Badges
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {(editItemModal.item.tech_stack || []).map((tech, idx) => (
                  <span 
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '16px',
                      padding: '3px 10px',
                      color: '#fff',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {tech}
                    <button 
                      type="button" 
                      onClick={() => removeTechTag(tech, true)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text"
                  placeholder="Add technology..."
                  value={newTechInput}
                  onChange={(e) => setNewTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTechTag(newTechInput, true); }}}
                  style={{
                    flex: 1,
                    background: '#181820',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTechTag(newTechInput, true)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '6px 12px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* ORLO AI CASE STUDY SYNTHESIZER IN EDIT MODAL */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(235, 215, 63, 0.08) 0%, rgba(15, 15, 22, 0.8) 100%)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#ebd73f" />
                  <span style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.8rem', fontWeight: 800, color: '#ebd73f' }}>
                    ORLO AI CASE STUDY SYNTHESIZER
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateOrloCaseStudy(editItemModal.item, (updater) => {
                    const updated = typeof updater === 'function' ? updater(editItemModal.item) : updater;
                    setEditItemModal({ ...editItemModal, item: updated });
                  })}
                  disabled={isGeneratingAI}
                  style={{
                    background: 'var(--brand-yellow, #ebd73f)',
                    color: '#050505',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '6px 14px',
                    fontFamily: 'Panchang, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={12} /> {isGeneratingAI ? 'Synthesizing...' : 'Regenerate with Orlo AI'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#ebd73f', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '4px' }}>
                    THE CHALLENGE
                  </label>
                  <textarea 
                    rows="3" 
                    placeholder="The Challenge..."
                    value={editItemModal.item.case_study_challenge || editItemModal.item.challenge || ''} 
                    onChange={(e) => setEditItemModal({
                      ...editItemModal,
                      item: { ...editItemModal.item, case_study_challenge: e.target.value, challenge: e.target.value }
                    })}
                    style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#ebd73f', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '4px' }}>
                    THE ARCHITECTURAL SOLUTION
                  </label>
                  <textarea 
                    rows="3" 
                    placeholder="The Solution & Architecture..."
                    value={editItemModal.item.case_study_solution || editItemModal.item.solution || ''} 
                    onChange={(e) => setEditItemModal({
                      ...editItemModal,
                      item: { ...editItemModal.item, case_study_solution: e.target.value, solution: e.target.value }
                    })}
                    style={{ width: '100%', background: '#181820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.82rem', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* 3 Architectural Execution Pillars in Edit Modal */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', fontFamily: 'Panchang, sans-serif', display: 'block', marginBottom: '8px' }}>
                  ✦ 3 ARCHITECTURAL EXECUTION PILLARS
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {(editItemModal.item.pillars || [
                    { title: '01 / SUB-SECOND TTFB', desc: 'Edge-rendered architecture ensuring instant delivery across global nodes.' },
                    { title: '02 / KINETIC MOTION', desc: '60 FPS physics-based micro-interactions tailored for high conversion.' },
                    { title: '03 / SCALABLE EDGE', desc: 'Zero cold-start compute with automated cloud cache invalidation.' }
                  ]).map((pillar, pIdx) => (
                    <div key={pIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px' }}>
                      <input
                        type="text"
                        value={pillar.title}
                        onChange={(e) => handlePillarChange(pIdx, 'title', e.target.value, true)}
                        placeholder={`0${pIdx + 1} / TITLE`}
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '6px', padding: '5px 8px', color: '#ebd73f', fontSize: '0.7rem', fontFamily: 'Panchang, sans-serif', fontWeight: 700, marginBottom: '6px' }}
                      />
                      <textarea
                        rows="2"
                        value={pillar.desc}
                        onChange={(e) => handlePillarChange(pIdx, 'desc', e.target.value, true)}
                        placeholder="Pillar description..."
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 8px', color: '#fff', fontSize: '0.72rem', resize: 'vertical' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance & Vitals Matrix (Stats) in Edit Modal */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', fontFamily: 'Panchang, sans-serif' }}>
                    ✦ PERFORMANCE & VITALS MATRIX
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddStat(true)}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '3px 8px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    + Add Metric
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                  {(editItemModal.item.stats || []).map((st, sIdx) => (
                    <div key={sIdx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '8px' }}>
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => handleStatChange(sIdx, 'value', e.target.value, true)}
                        placeholder="99/100 or 0.4s"
                        style={{ width: '100%', background: '#111116', border: '1px solid rgba(235, 215, 63, 0.4)', borderRadius: '6px', padding: '5px 8px', color: '#ebd73f', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'Panchang, sans-serif', marginBottom: '5px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) => handleStatChange(sIdx, 'label', e.target.value, true)}
                          placeholder="Metric Label"
                          style={{ flex: 1, background: '#111116', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '4px 6px', color: '#fff', fontSize: '0.72rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStat(sIdx, true)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                          title="Delete metric"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setEditItemModal({ show: false, item: null })}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '20px', padding: '10px 20px', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                style={{ background: '#ebd73f', border: 'none', borderRadius: '20px', padding: '10px 24px', color: '#050505', fontWeight: 800, cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Screenshot Cropper & Framing Modal */}
      <ImageCropperModal
        isOpen={cropperModal.isOpen}
        imageSrc={cropperModal.imageSrc}
        onClose={() => setCropperModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveCroppedImage}
        projectTitle={cropperModal.projectTitle}
      />
    </div>
  );
}
