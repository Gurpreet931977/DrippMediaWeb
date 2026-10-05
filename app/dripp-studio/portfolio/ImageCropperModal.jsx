'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  ZoomIn, ZoomOut, RotateCw, Check, X, ArrowUp, AlignCenter, ArrowDown,
  Image as ImageIcon, RefreshCw
} from 'lucide-react';
import CreativeSpark from '../components/CreativeSpark';

function FrameThumbnail({ url, alt, isSelected }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div style={{
      width: '54px',
      height: '34px',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#12121a',
      border: isSelected ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: isSelected ? '0 0 12px rgba(235, 215, 63, 0.25)' : 'inset 0 1px 3px rgba(0,0,0,0.5)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {url && !hasError ? (
        <img
          src={url}
          alt={alt || 'Frame preview'}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: isSelected ? '#ebd73f' : 'rgba(255, 255, 255, 0.35)'
        }}>
          <ImageIcon size={14} />
        </div>
      )}
    </div>
  );
}

export default function ImageCropperModal({ 
  isOpen, 
  imageSrc, 
  frameOptions = [], // [{ id: 'preloader', label: '01 • PRELOADER', sublabel: 'Initial Splash / Intro Logo', image_url: '...' }, ...]
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
  const [mounted, setMounted] = useState(false);
  const [activeImageSrc, setActiveImageSrc] = useState(imageSrc);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewTab, setPreviewTab] = useState('crop'); // 'crop' | 'preview'
  const [imageLoaded, setImageLoaded] = useState(false);
  // 3 Frame Presets: 'preloader' | 'hero' | 'middle' | 'top' | 'center' | 'bottom' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState('hero');
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    setActiveImageSrc(imageSrc);
    if (frameOptions && frameOptions.length > 0) {
      const match = frameOptions.find(o => o.image_url === imageSrc);
      setSelectedPreset(match ? match.id : (frameOptions.find(o => o.id === 'hero')?.id || frameOptions[0].id));
    }
  }, [imageSrc, frameOptions]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Calculate 3 frame preset offsets based on image & 16:10 frame geometry
  const handleSelectPreset = useCallback((preset) => {
    setSelectedPreset(preset);
    const img = imageRef.current;
    const box = containerRef.current;
    
    setScale(1);
    setRotation(0);

    let boxW = 740;
    let boxH = 462.5; // 16:10
    if (box && box.offsetWidth > 0 && box.offsetHeight > 0) {
      boxW = box.offsetWidth;
      boxH = box.offsetHeight;
    }

    if (!img || !img.naturalWidth || !img.naturalHeight) {
      if (preset === 'top') setPosition({ x: 0, y: 50 });
      else if (preset === 'bottom') setPosition({ x: 0, y: -50 });
      else setPosition({ x: 0, y: 0 });
      return;
    }

    const imgAspect = img.naturalWidth / img.naturalHeight;
    const boxAspect = boxW / boxH;

    if (imgAspect < boxAspect) {
      // Tall screenshot (e.g. desktop full-page scroll)
      const renderH = boxW / imgAspect;
      const excessY = (renderH - boxH) / 2;
      
      if (preset === 'top') {
        // Frame 01: Top Hero Fold (Showcase primary header and headline)
        setPosition({ x: 0, y: Math.max(0, excessY) });
      } else if (preset === 'center') {
        // Frame 02: Exact Center Fold
        setPosition({ x: 0, y: 0 });
      } else if (preset === 'bottom') {
        // Frame 03: Lower Section Fold
        setPosition({ x: 0, y: -Math.max(0, excessY) });
      }
    } else {
      // Wide screenshot: Horizontal adjustments
      const renderW = boxH * imgAspect;
      const excessX = (renderW - boxW) / 2;
      
      if (preset === 'top') {
        setPosition({ x: Math.max(0, excessX), y: 0 });
      } else if (preset === 'center') {
        setPosition({ x: 0, y: 0 });
      } else if (preset === 'bottom') {
        setPosition({ x: -Math.max(0, excessX), y: 0 });
      }
    }
  }, []);

  // Reset positioning whenever a new image source is loaded
  useEffect(() => {
    if (imageSrc) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setImageLoaded(false);
      setSelectedPreset('top');
    }
  }, [imageSrc]);

  // When image loads natural dimensions, auto-align to top Hero Frame
  const handleImageLoad = () => {
    setImageLoaded(true);
    handleSelectPreset('top');
  };

  // Handle Drag / Pan within Cropper Box
  const handlePointerDown = (e) => {
    setIsDragging(true);
    setSelectedPreset('custom');
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
    setSelectedPreset('custom');
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale(prev => Math.max(0.4, Math.min(4.0, prev + zoomDelta)));
  };

  const resetAll = () => {
    handleSelectPreset('top');
  };

  // Render high-res cropped export (1600x1000 16:10 chassis frame)
  const handleExportCropped = () => {
    setIsExporting(true);
    try {
      const img = imageRef.current;
      const cropBox = containerRef.current;

      const outputWidth = 1600;
      const outputHeight = 1000;

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      // Fill rich dark background
      ctx.fillStyle = '#0a0a0e';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      let boxWidth = 740;
      let boxHeight = 462.5;
      if (cropBox) {
        const rect = cropBox.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          boxWidth = rect.width;
          boxHeight = rect.height;
        }
      }

      const scaleFactor = outputWidth / boxWidth;

      if (img && img.naturalWidth && img.naturalHeight) {
        ctx.save();
        // Center of canvas
        ctx.translate(outputWidth / 2, outputHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;
        const imgAspect = naturalW / naturalH;
        let renderW = boxWidth;
        let renderH = boxWidth / imgAspect;

        if (renderH < boxHeight) {
          renderH = boxHeight;
          renderW = boxHeight * imgAspect;
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
      }

      const currentImg = activeImageSrc || imageSrc;
      let croppedDataUrl = null;
      try {
        croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      } catch (taintErr) {
        console.warn('Canvas export tainted by cross-origin, fallback to original image source:', taintErr);
        croppedDataUrl = currentImg;
      }

      onSave(croppedDataUrl || currentImg);
      onClose();
    } catch (err) {
      console.error('Cropper export exception, falling back to original image:', err);
      const currentImg = activeImageSrc || imageSrc;
      onSave(currentImg);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted || !isOpen || !imageSrc) return null;

  const modalContent = (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(4, 4, 8, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100010,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          margin: 'auto 0',
          background: '#0a0a0f',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: '1px solid rgba(235, 215, 63, 0.4)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '960px',
          maxHeight: 'calc(100vh - 36px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.95), 0 0 35px rgba(235, 215, 63, 0.1)',
          boxSizing: 'border-box'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '14px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(16, 16, 22, 0.95)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(235, 215, 63, 0.15)',
              border: '1px solid rgba(235, 215, 63, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ebd73f'
            }}>
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Panchang', sans-serif",
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '0.5px'
              }}>
                Frame & Crop Screenshot
              </h3>
              <p style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.74rem',
                color: 'rgba(255, 255, 255, 0.55)',
                margin: '2px 0 0 0'
              }}>
                Fixed 16:10 chassis frame • Select captured fold or pan & zoom to customize
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
                type="button"
                onClick={() => setPreviewTab('crop')}
                style={{
                  background: previewTab === 'crop' ? '#ebd73f' : 'transparent',
                  color: previewTab === 'crop' ? '#050505' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '5px 13px',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Crop & Adjust
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                style={{
                  background: previewTab === 'preview' ? '#ebd73f' : 'transparent',
                  color: previewTab === 'preview' ? '#050505' : 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '5px 13px',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Card Simulation
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer'
              }}
              title="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 22px',
          boxSizing: 'border-box',
          minHeight: 0
        }}>
          {/* TAB 1: Cropper & Work Area (Kept mounted for ref tracking) */}
          <div style={{
            display: previewTab === 'crop' ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            width: '100%'
          }}>
            {/* 3 Interactive Frame Options Bar */}
            <div style={{
              width: '100%',
              maxWidth: '740px',
              background: 'rgba(15, 15, 22, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '10px 14px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '0.6px'
                }}>
                  <CreativeSpark size={13} color="#ebd73f" /> 
                  {frameOptions && frameOptions.length > 0 
                    ? 'CHOOSE CAPTURED FRAME (3 SITE OPTIONS)' 
                    : 'CHOOSE FRAME OPTION (3 PRESETS)'}
                </div>
                <span style={{
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.65rem',
                  color: '#ebd73f',
                  fontWeight: 600
                }}>
                  {frameOptions && frameOptions.length > 0 
                    ? '• Live Website Snapshots' 
                    : (selectedPreset === 'custom' ? '• Custom Drag / Zoom Frame' : '• 1-Click Frame Presets')}
                </span>
              </div>

              {frameOptions && frameOptions.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {frameOptions.map((opt, idx) => {
                    const isSelected = selectedPreset ? (selectedPreset === opt.id) : (activeImageSrc === opt.image_url);
                    return (
                      <button
                        key={opt.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(opt.id);
                          setActiveImageSrc(opt.image_url);
                          setScale(1);
                          setPosition({ x: 0, y: 0 });
                          setRotation(0);
                        }}
                        style={{
                          background: isSelected ? 'rgba(235, 215, 63, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '12px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 0 16px rgba(235, 215, 63, 0.22)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <FrameThumbnail url={opt.image_url} alt={opt.label} isSelected={isSelected} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{
                              fontFamily: "'Panchang', sans-serif",
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              color: isSelected ? '#ebd73f' : '#ffffff',
                              letterSpacing: '0.4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {opt.label}
                            </span>
                            {isSelected && <Check size={11} color="#ebd73f" />}
                          </div>
                          <div style={{
                            fontFamily: "'Clash Display', sans-serif",
                            fontSize: '0.64rem',
                            color: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.45)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {opt.sublabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px'
                }}>
                  {/* Frame Option 1 */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('top')}
                    style={{
                      background: selectedPreset === 'top' ? 'rgba(235, 215, 63, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedPreset === 'top' ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedPreset === 'top' ? '0 0 14px rgba(235, 215, 63, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{
                        fontFamily: "'Panchang', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: selectedPreset === 'top' ? '#ebd73f' : '#ffffff',
                        letterSpacing: '0.4px'
                      }}>
                        01 • HERO FOLD
                      </span>
                      <ArrowUp size={12} color={selectedPreset === 'top' ? '#ebd73f' : 'rgba(255,255,255,0.4)'} />
                    </div>
                    <div style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: '0.65rem',
                      color: selectedPreset === 'top' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.45)'
                    }}>
                      Header & Main Visual
                    </div>
                  </button>

                  {/* Frame Option 2 */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('center')}
                    style={{
                      background: selectedPreset === 'center' ? 'rgba(235, 215, 63, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedPreset === 'center' ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedPreset === 'center' ? '0 0 14px rgba(235, 215, 63, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{
                        fontFamily: "'Panchang', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: selectedPreset === 'center' ? '#ebd73f' : '#ffffff',
                        letterSpacing: '0.4px'
                      }}>
                        02 • CENTER FOCUS
                      </span>
                      <AlignCenter size={12} color={selectedPreset === 'center' ? '#ebd73f' : 'rgba(255,255,255,0.4)'} />
                    </div>
                    <div style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: '0.65rem',
                      color: selectedPreset === 'center' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.45)'
                    }}>
                      Balanced Central View
                    </div>
                  </button>

                  {/* Frame Option 3 */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('bottom')}
                    style={{
                      background: selectedPreset === 'bottom' ? 'rgba(235, 215, 63, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: selectedPreset === 'bottom' ? '1.5px solid #ebd73f' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedPreset === 'bottom' ? '0 0 14px rgba(235, 215, 63, 0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{
                        fontFamily: "'Panchang', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        color: selectedPreset === 'bottom' ? '#ebd73f' : '#ffffff',
                        letterSpacing: '0.4px'
                      }}>
                        03 • LOWER FOLD
                      </span>
                      <ArrowDown size={12} color={selectedPreset === 'bottom' ? '#ebd73f' : 'rgba(255,255,255,0.4)'} />
                    </div>
                    <div style={{
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: '0.65rem',
                      color: selectedPreset === 'bottom' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.45)'
                    }}>
                      Features & UI Depth
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Cropping Work Area with Studio Chassis Frame */}
            <div 
              ref={containerRef}
              onWheel={handleWheel}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
              style={{
                width: '100%',
                maxWidth: '740px',
                aspectRatio: '16 / 10',
                maxHeight: 'min(42vh, 440px)',
                borderRadius: '18px',
                background: '#060609',
                border: '1.5px solid rgba(235, 215, 63, 0.85)',
                position: 'relative',
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(235, 215, 63, 0.12)',
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
                  src={activeImageSrc || imageSrc}
                  alt="crop target"
                  onLoad={handleImageLoad}
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

              {/* 4 Professional Studio Corner Crop Brackets */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', borderTop: '2.5px solid #ebd73f', borderLeft: '2.5px solid #ebd73f', pointerEvents: 'none', borderRadius: '3px 0 0 0' }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderTop: '2.5px solid #ebd73f', borderRight: '2.5px solid #ebd73f', pointerEvents: 'none', borderRadius: '0 3px 0 0' }} />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '16px', height: '16px', borderBottom: '2.5px solid #ebd73f', borderLeft: '2.5px solid #ebd73f', pointerEvents: 'none', borderRadius: '0 0 0 3px' }} />
              <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '16px', height: '16px', borderBottom: '2.5px solid #ebd73f', borderRight: '2.5px solid #ebd73f', pointerEvents: 'none', borderRadius: '0 0 3px 0' }} />

              {/* Rule of Thirds Crop Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr'
              }}>
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)', borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)', borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)', borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)', borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderBottom: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div style={{ borderRight: '1px dashed rgba(235, 215, 63, 0.22)' }} />
                <div />
              </div>

              {/* Crop Badge Info (Top Left) */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(8, 8, 12, 0.82)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(235, 215, 63, 0.35)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontFamily: "'Panchang', sans-serif",
                fontSize: '0.58rem',
                color: '#ebd73f',
                fontWeight: 800,
                letterSpacing: '0.5px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ebd73f' }} />
                <span>16:10 CHASSIS FRAME</span>
              </div>

              {/* Drag / Pan Hint (Bottom Center) */}
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(8, 8, 12, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '3px 10px',
                borderRadius: '12px',
                fontFamily: "'Clash Display', sans-serif",
                fontSize: '0.62rem',
                color: 'rgba(255, 255, 255, 0.65)',
                fontWeight: 500,
                pointerEvents: 'none'
              }}>
                Drag to reposition • Scroll to zoom
              </div>
            </div>

            {/* Compact Integrated Studio Toolbar */}
            <div style={{
              width: '100%',
              maxWidth: '740px',
              background: 'rgba(14, 14, 20, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxSizing: 'border-box'
            }}>
              {/* Zoom Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 200px' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Panchang', sans-serif", fontWeight: 700, letterSpacing: '0.5px' }}>
                  ZOOM
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom');
                    setScale(prev => Math.max(0.4, prev - 0.15));
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => {
                    setSelectedPreset('custom');
                    setScale(parseFloat(e.target.value));
                  }}
                  style={{ flex: 1, accentColor: '#ebd73f', height: '4px', cursor: 'pointer' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom');
                    setScale(prev => Math.min(3.5, prev + 0.15));
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: '#fff',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <span style={{ fontSize: '0.68rem', color: '#ebd73f', fontFamily: "'Panchang', sans-serif", minWidth: '38px', fontWeight: 800 }}>
                  {Math.round(scale * 100)}%
                </span>
              </div>

              {/* Vertical divider */}
              <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)' }} />

              {/* Presets Quick Align */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('top')}
                  style={{
                    background: selectedPreset === 'top' ? 'rgba(235, 215, 63, 0.18)' : 'rgba(255,255,255,0.05)',
                    border: selectedPreset === 'top' ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: selectedPreset === 'top' ? '#ebd73f' : 'rgba(255,255,255,0.8)',
                    padding: '5px 10px',
                    fontSize: '0.65rem',
                    fontFamily: "'Clash Display', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Align Top (Header Banner)"
                >
                  <ArrowUp size={12} /> Top
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('center')}
                  style={{
                    background: selectedPreset === 'center' ? 'rgba(235, 215, 63, 0.18)' : 'rgba(255,255,255,0.05)',
                    border: selectedPreset === 'center' ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: selectedPreset === 'center' ? '#ebd73f' : 'rgba(255,255,255,0.8)',
                    padding: '5px 10px',
                    fontSize: '0.65rem',
                    fontFamily: "'Clash Display', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Center Hero"
                >
                  <AlignCenter size={12} /> Center
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('bottom')}
                  style={{
                    background: selectedPreset === 'bottom' ? 'rgba(235, 215, 63, 0.18)' : 'rgba(255,255,255,0.05)',
                    border: selectedPreset === 'bottom' ? '1px solid #ebd73f' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: selectedPreset === 'bottom' ? '#ebd73f' : 'rgba(255,255,255,0.8)',
                    padding: '5px 10px',
                    fontSize: '0.65rem',
                    fontFamily: "'Clash Display', sans-serif",
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Align Bottom"
                >
                  <ArrowDown size={12} /> Bottom
                </button>
              </div>

              {/* Vertical divider */}
              <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.1)' }} />

              {/* Transform & Reset */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset('custom');
                    setRotation(prev => (prev + 90) % 360);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.8)',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.65rem',
                    fontFamily: "'Clash Display', sans-serif"
                  }}
                  title="Rotate 90°"
                >
                  <RotateCw size={12} /> 90°
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: 'rgba(255,255,255,0.5)',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Reset to Top Hero Frame"
                >
                  <RefreshCw size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* TAB 2: Main Page Card Simulation Preview (1:1 with /web-portfolio) */}
          <div style={{
            display: previewTab === 'preview' ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '780px',
            margin: '0 auto',
            gap: '16px'
          }}>
            {/* Quick 3-Frame Preset Switcher inside Card Simulation */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 15, 22, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              padding: '8px 14px'
            }}>
              <span style={{
                fontFamily: "'Panchang', sans-serif",
                fontSize: '0.64rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.7)',
                letterSpacing: '0.5px'
              }}>
                TEST FRAME PRESET:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('top')}
                  style={{
                    background: selectedPreset === 'top' ? '#ebd73f' : 'rgba(255,255,255,0.06)',
                    color: selectedPreset === 'top' ? '#050505' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  01 Hero Fold
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('center')}
                  style={{
                    background: selectedPreset === 'center' ? '#ebd73f' : 'rgba(255,255,255,0.06)',
                    color: selectedPreset === 'center' ? '#050505' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  02 Center Focus
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('bottom')}
                  style={{
                    background: selectedPreset === 'bottom' ? '#ebd73f' : 'rgba(255,255,255,0.06)',
                    color: selectedPreset === 'bottom' ? '#050505' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  03 Lower Fold
                </button>
              </div>
            </div>

            {/* Simulated Live Card */}
            {(() => {
              const cleanDomain = (displayUrl || 'live-preview.online')
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '');
              const formattedTechStack = Array.isArray(techStack) 
                ? techStack 
                : (typeof techStack === 'string' ? techStack.split(',').map(s => s.trim()).filter(Boolean) : ['Next.js', 'Tailwind CSS', 'Framer Motion']);

              return (
                <div style={{
                  width: '100%',
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
                      fontFamily: "'Panchang', sans-serif",
                      fontSize: '0.58rem',
                      fontWeight: 800,
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
                      fontFamily: "'Clash Display', sans-serif",
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
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out'
                    }}>
                      <img
                        src={activeImageSrc || imageSrc}
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
                          fontFamily: "'Panchang', sans-serif",
                          fontSize: '0.58rem',
                          fontWeight: 800,
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          marginBottom: '8px'
                        }}>
                          ✦ {category || 'ENTERPRISE DIGITAL PLATFORM'}
                        </div>
                        <h4 style={{
                          fontFamily: "'Panchang', sans-serif",
                          fontSize: '1.4rem',
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
                            fontFamily: "'Clash Display', sans-serif",
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
                                  fontFamily: "'Clash Display', sans-serif",
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
                          fontFamily: "'Panchang', sans-serif",
                          fontSize: '0.62rem',
                          fontWeight: 800,
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
                          fontFamily: "'Panchang', sans-serif",
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
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(18, 18, 24, 0.9)',
          flexShrink: 0
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
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCropped}
            style={{
              background: '#ebd73f',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 28px',
              color: '#050505',
              fontFamily: "'Panchang', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '1px',
              cursor: isExporting ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(235, 215, 63, 0.4)',
              opacity: isExporting ? 0.75 : 1
            }}
          >
            {isExporting ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Applying Frame...</span>
              </>
            ) : (
              <>
                <Check size={18} /> Apply Cropped Frame (16:10)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
