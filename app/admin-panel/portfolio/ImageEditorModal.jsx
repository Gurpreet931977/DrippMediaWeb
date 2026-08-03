import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Save, RotateCcw, Crop as CropIcon, Sliders, Sparkles, FlipHorizontal, FlipVertical } from 'lucide-react';

export default function ImageEditorModal({ isOpen, onClose, imageUrl, onSave }) {
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [aspect, setAspect] = useState(undefined);
    const [currentTab, setCurrentTab] = useState('crop');

    const defaultFilters = {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        rotate: 0,
        hue: 0,
        sepia: 0,
        blur: 0,
        invert: 0,
        flipX: 1,
        flipY: 1
    };
    
    const [filters, setFilters] = useState(defaultFilters);

    useEffect(() => {
        if (isOpen) {
            setCrop(undefined);
            setCompletedCrop(null);
            setFilters(defaultFilters);
            setAspect(undefined);
            setCurrentTab('crop');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const applyPreset = (preset) => {
        switch(preset) {
            case 'cyberpunk':
                setFilters({...defaultFilters, contrast: 120, saturate: 150, hue: 30, brightness: 110});
                break;
            case 'vintage':
                setFilters({...defaultFilters, sepia: 80, contrast: 90, brightness: 110, saturate: 80});
                break;
            case 'cinematic':
                setFilters({...defaultFilters, contrast: 130, saturate: 80, brightness: 90});
                break;
            case 'grayscale':
                setFilters({...defaultFilters, saturate: 0, contrast: 110});
                break;
            case 'midnight':
                setFilters({...defaultFilters, brightness: 80, contrast: 120, saturate: 110, hue: 200});
                break;
            default:
                setFilters(defaultFilters);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const canvas = document.createElement('canvas');
            const image = imgRef.current;
            
            const cropConfig = completedCrop?.width ? completedCrop : {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            };

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            canvas.width = cropConfig.width * scaleX;
            canvas.height = cropConfig.height * scaleY;

            const ctx = canvas.getContext('2d');
            
            // Transformations
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((filters.rotate * Math.PI) / 180);
            ctx.scale(filters.flipX, filters.flipY);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // Filters
            ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hue}deg) sepia(${filters.sepia}%) blur(${filters.blur}px) invert(${filters.invert}%)`;

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
                blob.name = 'edited-graphic.jpg';
                await onSave(blob);
                setIsSaving(false);
                onClose();
            }, 'image/jpeg', 0.95);

        } catch (e) {
            console.error(e);
            setIsSaving(false);
            alert('Failed to save image');
        }
    };

    const tabStyle = (tab) => ({
        flex: 1, padding: '12px', background: currentTab === tab ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
        borderBottom: `2px solid ${currentTab === tab ? '#ebd73f' : 'transparent'}`,
        color: currentTab === tab ? '#ebd73f' : '#888',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer',
        fontFamily: 'Clash Display, sans-serif', fontSize: '0.9rem', transition: 'all 0.2s ease'
    });

    const renderCropTab = () => (
        <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 15px 0', fontFamily: 'Clash Display, sans-serif' }}>Aspect Ratio</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                <button onClick={() => setAspect(undefined)} style={{ padding: '10px', background: aspect === undefined ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === undefined ? '#ebd73f' : '#fff', border: `1px solid ${aspect === undefined ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>Freeform</button>
                <button onClick={() => setAspect(1)} style={{ padding: '10px', background: aspect === 1 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 1 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 1 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>Square (1:1)</button>
                <button onClick={() => setAspect(4/5)} style={{ padding: '10px', background: aspect === 4/5 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 4/5 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 4/5 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>Instagram (4:5)</button>
                <button onClick={() => setAspect(9/16)} style={{ padding: '10px', background: aspect === 9/16 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 9/16 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 9/16 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif' }}>Story (9:16)</button>
                <button onClick={() => setAspect(16/9)} style={{ padding: '10px', background: aspect === 16/9 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: aspect === 16/9 ? '#ebd73f' : '#fff', border: `1px solid ${aspect === 16/9 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif', gridColumn: 'span 2' }}>YouTube / Web (16:9)</button>
            </div>

            <h4 style={{ color: '#fff', margin: '0 0 15px 0', fontFamily: 'Clash Display, sans-serif' }}>Transform</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setFilters({...filters, flipX: filters.flipX === 1 ? -1 : 1})} style={{ padding: '10px', background: filters.flipX === -1 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: filters.flipX === -1 ? '#ebd73f' : '#fff', border: `1px solid ${filters.flipX === -1 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Clash Display, sans-serif' }}>
                    <FlipHorizontal size={16} /> Flip H
                </button>
                <button onClick={() => setFilters({...filters, flipY: filters.flipY === 1 ? -1 : 1})} style={{ padding: '10px', background: filters.flipY === -1 ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', color: filters.flipY === -1 ? '#ebd73f' : '#fff', border: `1px solid ${filters.flipY === -1 ? '#ebd73f' : 'transparent'}`, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Clash Display, sans-serif' }}>
                    <FlipVertical size={16} /> Flip V
                </button>
            </div>
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px', fontFamily: 'Clash Display, sans-serif' }}>
                    <span>Rotation</span>
                    <span>{filters.rotate}°</span>
                </div>
                <input type="range" min="-180" max="180" value={filters.rotate} onChange={(e) => setFilters({...filters, rotate: parseInt(e.target.value)})} style={{ width: '100%', accentColor: '#ebd73f' }} />
            </div>
        </div>
    );

    const SliderControl = ({ label, min, max, valKey, unit = '%' }) => (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: '8px', fontFamily: 'Clash Display, sans-serif' }}>
                <span>{label}</span>
                <span>{filters[valKey]}{unit}</span>
            </div>
            <input type="range" min={min} max={max} value={filters[valKey]} onChange={(e) => setFilters({...filters, [valKey]: parseInt(e.target.value)})} style={{ width: '100%', accentColor: '#ebd73f' }} />
        </div>
    );

    const renderAdjustTab = () => (
        <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 15px 0', fontFamily: 'Clash Display, sans-serif' }}>Color & Light</h4>
            <SliderControl label="Brightness" min="0" max="200" valKey="brightness" />
            <SliderControl label="Contrast" min="0" max="200" valKey="contrast" />
            <SliderControl label="Saturation" min="0" max="200" valKey="saturate" />
            <SliderControl label="Hue" min="0" max="360" valKey="hue" unit="°" />
            
            <h4 style={{ color: '#fff', margin: '20px 0 15px 0', fontFamily: 'Clash Display, sans-serif' }}>Effects</h4>
            <SliderControl label="Sepia" min="0" max="100" valKey="sepia" />
            <SliderControl label="Invert" min="0" max="100" valKey="invert" />
            <SliderControl label="Blur" min="0" max="20" valKey="blur" unit="px" />
        </div>
    );

    const renderFiltersTab = () => (
        <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#fff', margin: '0 0 15px 0', fontFamily: 'Clash Display, sans-serif' }}>Smart Presets</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Cyberpunk', 'Vintage', 'Cinematic', 'Grayscale', 'Midnight'].map(preset => (
                    <button 
                        key={preset}
                        onClick={() => applyPreset(preset.toLowerCase())}
                        style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontFamily: 'Clash Display, sans-serif', fontSize: '1rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'; e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.5)'; e.currentTarget.style.color = '#ebd73f'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                    >
                        {preset}
                        <Sparkles size={16} />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
            <div style={{ background: '#111', width: '95%', maxWidth: '1200px', height: '90vh', borderRadius: '24px', display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
                
                {/* Left: Workspace */}
                <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', background: '#050505', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ color: '#ebd73f', margin: 0, fontFamily: 'Panchang, sans-serif', fontSize: '1.2rem', textTransform: 'uppercase' }}>Advanced Editor</h3>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ReactCrop 
                            crop={crop} 
                            onChange={(_, percentCrop) => setCrop(percentCrop)} 
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={aspect}
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        >
                            <img 
                                ref={imgRef}
                                src={imageUrl} 
                                alt="Editing source" 
                                crossOrigin="anonymous"
                                style={{ 
                                    maxHeight: '75vh',
                                    maxWidth: '100%',
                                    filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hue}deg) sepia(${filters.sepia}%) blur(${filters.blur}px) invert(${filters.invert}%)`,
                                    transform: `rotate(${filters.rotate}deg) scale(${filters.flipX}, ${filters.flipY})`,
                                    transition: 'filter 0.1s ease, transform 0.1s ease'
                                }} 
                            />
                        </ReactCrop>
                    </div>
                </div>

                {/* Right: Controls Panel */}
                <div style={{ width: '360px', background: '#161616', display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                    
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div onClick={() => setCurrentTab('crop')} style={tabStyle('crop')}><CropIcon size={16}/> Crop</div>
                        <div onClick={() => setCurrentTab('adjust')} style={tabStyle('adjust')}><Sliders size={16}/> Adjust</div>
                        <div onClick={() => setCurrentTab('filters')} style={tabStyle('filters')}><Sparkles size={16}/> Filters</div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {currentTab === 'crop' && renderCropTab()}
                        {currentTab === 'adjust' && renderAdjustTab()}
                        {currentTab === 'filters' && renderFiltersTab()}
                    </div>

                    {/* Footer Actions */}
                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: '#111' }}>
                        <button 
                            onClick={() => { setFilters(defaultFilters); setAspect(undefined); }}
                            style={{ width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', fontFamily: 'Clash Display, sans-serif', transition: 'all 0.2s ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <RotateCcw size={16} /> Reset All
                        </button>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{ 
                                width: '100%', background: '#ebd73f', color: '#000', border: 'none', padding: '16px', borderRadius: '12px', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'Clash Display, sans-serif', fontWeight: '600', fontSize: '1.05rem', opacity: isSaving ? 0.7 : 1, transition: 'all 0.2s ease', boxShadow: '0 4px 15px rgba(235, 215, 63, 0.3)'
                            }}
                            onMouseEnter={e => { if(!isSaving) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => { if(!isSaving) e.currentTarget.style.transform = 'translateY(0)' }}
                        >
                            {isSaving ? 'Processing...' : <><Save size={20} /> Export & Save</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
