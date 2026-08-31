'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCw, RotateCcw, Move, 
  Maximize2, Check, X, ArrowUp, AlignCenter, ArrowDown,
  Sparkles, Layers, Image as ImageIcon, RefreshCw
} from 'lucide-react';

export default function ImageCropperModal({ 
  isOpen, 
  imageSrc, 
  onClose, 
  onSave, 
  projectTitle = 'Web Project',
  category = 'Enterprise Digital Platform',
  tagline = '',
  displayUrl = '',
  techStack = [],
  indexNum = '01',
  aspectRatio = 16 / 10 // Exact 1600x1000 ratio matching main page chassis
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewTab, setPreviewTab] = useState('crop'); // 'crop' | 'preview'
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Reset positioning whenever a new image source is loaded
  useEffect(() => {
    if (imageSrc) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setImageLoaded(false);
    }
  }, [imageSrc]);

  // Handle Drag / Pan within Cropper Box
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale(prev => Math.max(0.4, Math.min(4.0, prev + zoomDelta)));
  };

  // Alignment Presets
  const alignTop = () => {
    if (!imageRef.current || !containerRef.current) return;
    setPosition(prev => ({ ...prev, y: 0 }));
  };

  const alignCenter = () => {
    setPosition({ x: 0, y: 0 });
  };

  const alignBottom = () => {
    if (!imageRef.current || !containerRef.current) return;
    const imgHeight = imageRef.current.offsetHeight * scale;
    const containerHeight = containerRef.current.offsetHeight;
    const diff = Math.max(0, imgHeight - containerHeight);
    setPosition(prev => ({ ...prev, y: -diff }));
  };

  const resetAll = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Render high-res cropped export
  const handleExportCropped = () => {
    const img = imageRef.current;
    const cropBox = containerRef.current;
    if (!img || !cropBox) return;

    const outputWidth = 1600;
    const outputHeight = 1000;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    // Fill dark background
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    const boxRect = cropBox.getBoundingClientRect();
    const scaleFactor = outputWidth / boxRect.width;

    ctx.save();
    // Center of canvas
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let renderW = boxRect.width;
    let renderH = boxRect.width / imgAspect;

    if (renderH < boxRect.height) {
      renderH = boxRect.height;
      renderW = boxRect.height * imgAspect;
    }

    const scaledRenderW = renderW * scaleFactor;
    const scaledRenderH = renderH * scaleFactor;
    const scaledPosX = position.x * scaleFactor;
    const scaledPosY = position.y * scaleFactor;

    ctx.drawImage(
      img,
      scaledPosX - scaledRenderW / 2,
      scaledPosY - scaledRenderH / 2,
      scaledRenderW,
      scaledRenderH
    );
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSave(croppedDataUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4, 4, 8, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: '#0d0d12',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 0 1px rgba(235, 215, 63, 0.15)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(18, 18, 24, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(235, 215, 63, 0.15)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ebd73f'
            }}>
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'Panchang, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.5px'
              }}>
                Frame & Crop Screenshot
              </h3>
              <p style={{
                fontFamily: 'Clash Display, sans-serif',
                fontSize: '0.78rem',
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '2px 0 0 0'
              }}>
                Fixed 16:10 main page aspect ratio • Drag to pan & reposition
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '3px',
              display: 'flex',
              gap: '4px'
            }}>
              <button
                onClick={() => setPreviewTab('crop')}
                style={{
                  background: previewTab === 'crop' ? '#ebd73f' : 'transparent',
                  color: previewTab === 'crop' ? '#050505' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  fontFamily: 'Panchang, sans-serif',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Crop & Adjust
              </button>
              <button
                onClick={() => setPreviewTab('preview')}
                style={{
                  background: previewTab === 'preview' ? '#ebd73f' : 'transparent',
                  color: previewTab === 'preview' ? '#050505' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  fontFamily: 'Panchang, sans-serif',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Card Simulation
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {previewTab === 'crop' ? (
            <>
              {/* Cropping Work Area */}
              <div 
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                style={{
                  width: '100%',
                  maxWidth: '780px',
                  aspectRatio: '16 / 10',
                  borderRadius: '16px',
                  background: '#050508',
                  border: '2px solid #ebd73f',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  boxShadow: '0 15px 45px rgba(0,0,0,0.8), 0 0 30px rgba(235, 215, 63, 0.15)',
                  userSelect: 'none',
                  touchAction: 'none'
                }}
              >
                {/* Image to Crop */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}>
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="crop target"
                    onLoad={() => setImageLoaded(true)}
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      userSelect: 'none'
                    }}
                  />
                </div>

                {/* Rule of Thirds Crop Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gridTemplateRows: '1fr 1fr 1fr',
                  border: '1px solid rgba(235, 215, 63, 0.4)'
                }}>
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)', borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)', borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)', borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)', borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.3)' }} />
                  <div />
                </div>

                {/* Crop Badge Info */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(10, 10, 15, 0.85)',
                  border: '1px solid rgba(235, 215, 63, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontFamily: 'Panchang, sans-serif',
                  fontSize: '0.62rem',
                  color: '#ebd73f',
                  fontWeight: 700,
                  pointerEvents: 'none'
                }}>
                  16:10 CHASSIS FRAME
                </div>
              </div>

              {/* Toolbar Controls */}
              <div style={{
                width: '100%',
                maxWidth: '780px',
                background: 'rgba(18, 18, 24, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '18px',
                padding: '16px 20px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}>
                {/* Zoom Control */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Panchang, sans-serif' }}>
                    ZOOM
                  </span>
                  <button
                    type="button"
                    onClick={() => setScale(prev => Math.max(0.4, prev - 0.15))}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '6px',
                      cursor: 'pointer'
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="3.5"
                    step="0.05"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#ebd73f' }}
                  />
                  <button
                    type="button"
                    onClick={() => setScale(prev => Math.min(3.5, prev + 0.15))}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '6px',
                      cursor: 'pointer'
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <span style={{ fontSize: '0.75rem', color: '#ebd73f', fontFamily: 'Clash Display, sans-serif', minWidth: '40px' }}>
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                {/* Alignment Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={alignTop}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 12px',
                      fontSize: '0.72rem',
                      fontFamily: 'Clash Display, sans-serif',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Align Top (Header Banner)"
                  >
                    <ArrowUp size={14} /> Top
                  </button>
                  <button
                    type="button"
                    onClick={alignCenter}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 12px',
                      fontSize: '0.72rem',
                      fontFamily: 'Clash Display, sans-serif',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Center Hero"
                  >
                    <AlignCenter size={14} /> Center
                  </button>
                  <button
                    type="button"
                    onClick={alignBottom}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 12px',
                      fontSize: '0.72rem',
                      fontFamily: 'Clash Display, sans-serif',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="Align Bottom"
                  >
                    <ArrowDown size={14} /> Bottom
                  </button>

                  <button
                    type="button"
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '7px 10px',
                      cursor: 'pointer'
                    }}
                    title="Rotate 90°"
                  >
                    <RotateCw size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={resetAll}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#aaa',
                      padding: '7px 10px',
                      cursor: 'pointer'
                    }}
                    title="Reset Alignment"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Main Page Card Simulation Preview (1:1 with /web-portfolio) */
            <div style={{ width: '100%', maxWidth: '780px' }}>
              {(() => {
                const cleanDomain = (displayUrl || 'live-preview.online')
                  .replace(/^https?:\/\//, '')
                  .replace(/\/$/, '');
                const formattedTechStack = Array.isArray(techStack) 
                  ? techStack 
                  : (typeof techStack === 'string' ? techStack.split(',').map(s => s.trim()).filter(Boolean) : ['Next.js', 'Tailwind CSS', 'Framer Motion']);

                return (
                  <div style={{
                    borderRadius: '24px',
                    background: '#08080c',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.95), 0 0 35px rgba(235, 215, 63, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    {/* Cyber Corner Brackets */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', width: '14px', height: '14px', borderTop: '2px solid #ebd73f', borderLeft: '2px solid #ebd73f', zIndex: 20 }} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', width: '14px', height: '14px', borderTop: '2px solid #ebd73f', borderRight: '2px solid #ebd73f', zIndex: 20 }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '14px', height: '14px', borderBottom: '2px solid #ebd73f', borderLeft: '2px solid #ebd73f', zIndex: 20 }} />
                    <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '14px', height: '14px', borderBottom: '2px solid #ebd73f', borderRight: '2px solid #ebd73f', zIndex: 20 }} />

                    {/* Floating Top Cyber-HUD */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      zIndex: 15,
                      background: 'linear-gradient(to bottom, rgba(6, 6, 10, 0.85) 0%, transparent 100%)'
                    }}>
                      <div style={{
                        background: 'rgba(12, 12, 18, 0.75)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontFamily: 'Panchang, sans-serif',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.9)',
                        letterSpacing: '1px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ color: '#ebd73f' }}>✦</span> {indexNum || '01'} // ARCHIVE
                      </div>

                      <div style={{
                        background: 'rgba(14, 14, 20, 0.8)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(235, 215, 63, 0.3)',
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontFamily: 'Clash Display, sans-serif',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', height: '10px' }}>
                          <span style={{ width: '2px', height: '100%', background: '#ebd73f', borderRadius: '1px', display: 'inline-block' }} />
                          <span style={{ width: '2px', height: '60%', background: '#ebd73f', borderRadius: '1px', display: 'inline-block' }} />
                          <span style={{ width: '2px', height: '80%', background: '#ebd73f', borderRadius: '1px', display: 'inline-block' }} />
                        </div>
                        <span>{cleanDomain}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </div>
                    </div>

                    {/* Card Body Simulation */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16 / 10',
                      overflow: 'hidden',
                      background: '#050508'
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                        transformOrigin: 'center center'
                      }}>
                        <img
                          src={imageSrc}
                          alt="simulation"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Gradient Overlay & Metadata Simulation */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(8, 8, 12, 0.98) 0%, rgba(8, 8, 12, 0.9) 60%, rgba(8, 8, 12, 0.4) 85%, transparent 100%)',
                        padding: '20px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        gap: '16px'
                      }}>
                        <div style={{ maxWidth: '65%' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(235, 215, 63, 0.12)',
                            color: '#ebd73f',
                            border: '1px solid rgba(235, 215, 63, 0.3)',
                            borderRadius: '20px',
                            padding: '3px 12px',
                            fontFamily: 'Panchang, sans-serif',
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            marginBottom: '8px'
                          }}>
                            ✦ {category || 'ENTERPRISE DIGITAL PLATFORM'}
                          </div>
                          <h4 style={{
                            fontFamily: 'Panchang, sans-serif',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            margin: '0 0 4px 0',
                            textTransform: 'uppercase',
                            lineHeight: 1.1,
                            letterSpacing: '-0.5px'
                          }}>
                            {projectTitle || 'Live Project'}
                          </h4>
                          {tagline && (
                            <div style={{
                              fontFamily: 'Clash Display, sans-serif',
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.75)',
                              lineHeight: 1.35,
                              marginBottom: '10px'
                            }}>
                              {tagline}
                            </div>
                          )}
                          {formattedTechStack.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {formattedTechStack.map((tech, tIdx) => (
                                <span 
                                  key={tIdx} 
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '6px',
                                    padding: '2px 8px',
                                    fontSize: '0.65rem',
                                    fontFamily: 'Clash Display, sans-serif',
                                    fontWeight: 500
                                  }}
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.18)',
                            borderRadius: '30px',
                            padding: '8px 14px',
                            fontFamily: 'Panchang, sans-serif',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backdropFilter: 'blur(12px)'
                          }}>
                            <span style={{ color: '#ebd73f' }}>✦</span> Case Study
                          </div>

                          <div style={{
                            background: '#ebd73f',
                            color: '#050505',
                            border: '1px solid #ebd73f',
                            borderRadius: '30px',
                            padding: '8px 16px',
                            fontFamily: 'Panchang, sans-serif',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            letterSpacing: '1.2px',
                            textTransform: 'uppercase',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>Launch Live</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7"></line>
                              <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '18px 28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(18, 18, 24, 0.8)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '10px 20px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Clash Display, sans-serif',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExportCropped}
            style={{
              background: '#ebd73f',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              color: '#050505',
              fontFamily: 'Panchang, sans-serif',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(235, 215, 63, 0.4)'
            }}
          >
            <Check size={18} /> Apply Cropped Frame (16:10)
          </button>
        </div>
      </div>
    </div>
  );
}
