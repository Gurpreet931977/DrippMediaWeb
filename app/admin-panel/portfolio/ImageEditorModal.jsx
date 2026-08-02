import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';

export default function ImageEditorModal({ isOpen, onClose, imageUrl, onSave }) {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [aspect, setAspect] = useState(undefined);

    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturate: 100,
        rotate: 0
    });

    useEffect(() => {
        if (isOpen) {
            setCrop(undefined);
            setCompletedCrop(null);
            setFilters({ brightness: 100, contrast: 100, saturate: 100, rotate: 0 });
            setAspect(undefined);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const canvas = document.createElement('canvas');
            const image = imgRef.current;
            
            // If no crop is selected, use full image
            const cropConfig = completedCrop?.width ? completedCrop : {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            };

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Output canvas size
            canvas.width = cropConfig.width * scaleX;
            canvas.height = cropConfig.height * scaleY;

            const ctx = canvas.getContext('2d');
            
            // Center rotation
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((filters.rotate * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // Apply filters
            ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;

            // Draw image
            ctx.drawImage(
                image,
                cropConfig.x * scaleX,
                cropConfig.y * scaleY,
                cropConfig.width * scaleX,
                cropConfig.height * scaleY,
                0,
                0,
                cropConfig.width * scaleX,
                cropConfig.height * scaleY
            );

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Canvas is empty');
                // Give it a file name
                blob.name = 'edited-graphic.jpg';
                await onSave(blob);
                setIsSaving(false);
                onClose();
            }, 'image/jpeg', 0.95);

        } catch (e) {
            console.error(e);
            setIsSaving(false);
            alert('Failed to crop image');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ background: '#111', width: '90%', maxWidth: '1000px', height: '85vh', borderRadius: '24px', display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                
                {/* Left: Workspace */}
                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', background: '#050505', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ color: '#ebd73f', margin: 0, fontFamily: 'Panchang, sans-serif', fontSize: '1.2rem', textTransform: 'uppercase' }}>Image Editor</h3>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
                        <ReactCrop 
                            crop={crop} 
                            onChange={(_, percentCrop) => setCrop(percentCrop)} 
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            style={{ maxHeight: '100%' }}
                        >
                            <img 
                                ref={imgRef}
                                src={imageUrl} 
                                alt="Editing source" 
                                crossOrigin="anonymous"
                                style={{ 
                                    maxHeight: '60vh',
                                    maxWidth: '100%',
                                    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`,
                                    transform: `rotate(${filters.rotate}deg)`,
                                    transition: 'filter 0.1s ease'
                                }} 
                            />
                        </ReactCrop>
                    </div>
                </div>

                {/* Right: Controls */}
                <div style={{ width: '320px', background: '#161616', padding: '30px 24px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}>
                    <h4 style={{ color: '#fff', margin: '0 0 20px 0', fontFamily: 'Clash Display, sans-serif' }}>Basic Crop</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                        <button onClick={() => setAspect(undefined)} style={{ padding: '8px', background: aspect === undefined ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === undefined ? '#ebd73f' : '#fff', border: `1px solid ${aspect === undefined ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>Free</button>
                        <button onClick={() => setAspect(1)} style={{ padding: '8px', background: aspect === 1 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 1 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 1 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>1:1</button>
                        <button onClick={() => setAspect(16/9)} style={{ padding: '8px', background: aspect === 16/9 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 16/9 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 16/9 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>16:9</button>
                        <button onClick={() => setAspect(9/16)} style={{ padding: '8px', background: aspect === 9/16 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 9/16 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 9/16 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>9:16</button>
                    </div>

                    <h4 style={{ color: '#fff', margin: '0 0 20px 0', fontFamily: 'Clash Display, sans-serif' }}>Advanced Filters</h4>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px' }}>
                            <span>Brightness</span>
                            <span>{filters.brightness}%</span>
                        </div>
                        <input type="range" min="0" max="200" value={filters.brightness} onChange={(e) => setFilters({...filters, brightness: e.target.value})} style={{ width: '100%', accentColor: '#ebd73f' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px' }}>
                            <span>Contrast</span>
                            <span>{filters.contrast}%</span>
                        </div>
                        <input type="range" min="0" max="200" value={filters.contrast} onChange={(e) => setFilters({...filters, contrast: e.target.value})} style={{ width: '100%', accentColor: '#ebd73f' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px' }}>
                            <span>Saturation</span>
                            <span>{filters.saturate}%</span>
                        </div>
                        <input type="range" min="0" max="200" value={filters.saturate} onChange={(e) => setFilters({...filters, saturate: e.target.value})} style={{ width: '100%', accentColor: '#ebd73f' }} />
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px' }}>
                            <span>Rotation</span>
                            <span>{filters.rotate}°</span>
                        </div>
                        <input type="range" min="-180" max="180" value={filters.rotate} onChange={(e) => setFilters({...filters, rotate: e.target.value})} style={{ width: '100%', accentColor: '#ebd73f' }} />
                    </div>

                    <button 
                        onClick={() => setFilters({ brightness: 100, contrast: 100, saturate: 100, rotate: 0 })}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: 'auto', fontFamily: 'Clash Display, sans-serif' }}
                    >
                        <RotateCcw size={16} /> Reset Filters
                    </button>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ 
                            background: '#ebd73f', color: '#000', border: 'none', padding: '14px', borderRadius: '12px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Clash Display, sans-serif', fontWeight: '600', fontSize: '1rem', marginTop: '20px', opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        {isSaving ? 'Saving...' : <><Save size={18} /> Apply Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
