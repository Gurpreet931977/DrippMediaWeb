'use client';
import React, { useState, useEffect, useRef } from 'react';
import OrloIcon from '../admin-panel/components/OrloIcon';
import Link from 'next/link';

// --- Color Conversion Helpers ---
const hexToRgb = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return { r, g, b };
};

const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

const rgbToCmyk = (r, g, b) => {
  let c = 0, m = 0, y = 0, k = 0;
  r = r / 255;
  g = g / 255;
  b = b / 255;
  k = 1 - Math.max(r, g, b);
  if (k !== 1) {
    c = (1 - r - k) / (1 - k);
    m = (1 - g - k) / (1 - k);
    y = (1 - b - k) / (1 - k);
  }
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
};

const cmykToRgb = (c, m, y, k) => {
  c = c / 100;
  m = m / 100;
  y = y / 100;
  k = k / 100;
  let r = Math.round(255 * (1 - c) * (1 - k));
  let g = Math.round(255 * (1 - m) * (1 - k));
  let b = Math.round(255 * (1 - y) * (1 - k));
  return { r, g, b };
};

// --- Custom Color Picker Component ---
const AdvancedColorPicker = ({ label, colorHex, onChangeHex }) => {
  const rgb = hexToRgb(colorHex);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  const handleHexChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val;
    onChangeHex(val);
  };

  const handleRgbChange = (channel, val) => {
    const newRgb = { ...rgb, [channel]: Math.min(255, Math.max(0, parseInt(val) || 0)) };
    onChangeHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleCmykChange = (channel, val) => {
    const newCmyk = { ...cmyk, [channel]: Math.min(100, Math.max(0, parseInt(val) || 0)) };
    const newRgb = cmykToRgb(newCmyk.c, newCmyk.m, newCmyk.y, newCmyk.k);
    onChangeHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const inputStyle = { 
    width: '45px', padding: '8px 4px', borderRadius: '8px', 
    border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', 
    color: '#fff', fontSize: '13px', textAlign: 'center', fontFamily: "'Clash Display', sans-serif",
    outline: 'none', transition: 'border-color 0.2s'
  };
  const labelStyle = { fontSize: '11px', color: '#888', display: 'block', textAlign: 'center', marginTop: '6px', fontWeight: '500' };

  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.02)', 
      padding: '20px', 
      borderRadius: '16px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      marginBottom: '15px',
      boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <strong style={{ color: '#fff', fontSize: '14px', letterSpacing: '0.5px' }}>{label}</strong>
        <div style={{ position: 'relative', width: '34px', height: '34px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          <input type="color" value={colorHex} onChange={(e) => onChangeHex(e.target.value)} style={{ cursor: 'pointer', background: 'none', border: 'none', width: '50px', height: '50px', position: 'absolute', top: '-8px', left: '-8px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {/* HEX */}
        <div>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <input type="text" value={colorHex} onChange={handleHexChange} style={{ ...inputStyle, width: '75px', textAlign: 'left', paddingLeft: '10px' }} />
             <span style={labelStyle}>HEX</span>
           </div>
        </div>

        {/* RGB */}
        <div style={{ display: 'flex', gap: '6px' }}>
           <div>
             <input type="number" value={rgb.r} onChange={(e) => handleRgbChange('r', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>R</span>
           </div>
           <div>
             <input type="number" value={rgb.g} onChange={(e) => handleRgbChange('g', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>G</span>
           </div>
           <div>
             <input type="number" value={rgb.b} onChange={(e) => handleRgbChange('b', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>B</span>
           </div>
        </div>

        {/* CMYK */}
        <div style={{ display: 'flex', gap: '6px' }}>
           <div>
             <input type="number" value={cmyk.c} onChange={(e) => handleCmykChange('c', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>C%</span>
           </div>
           <div>
             <input type="number" value={cmyk.m} onChange={(e) => handleCmykChange('m', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>M%</span>
           </div>
           <div>
             <input type="number" value={cmyk.y} onChange={(e) => handleCmykChange('y', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>Y%</span>
           </div>
           <div>
             <input type="number" value={cmyk.k} onChange={(e) => handleCmykChange('k', e.target.value)} style={inputStyle} />
             <span style={labelStyle}>K%</span>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Toggle Switch Component ---
const ToggleSwitch = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
    <span style={{ color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: '500', letterSpacing: '0.5px' }} onClick={() => onChange(!checked)}>{label}</span>
    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
      <input 
        type="checkbox" 
        checked={checked} 
        onChange={e => onChange(e.target.checked)} 
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
      />
      <span style={{
        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: checked ? '#ebd73f' : 'rgba(255,255,255,0.1)', transition: '.4s', borderRadius: '24px'
      }}>
        <span style={{
          position: 'absolute', content: '""', height: '18px', width: '18px',
          left: checked ? '23px' : '3px', bottom: '3px', backgroundColor: checked ? '#000' : '#888',
          transition: '.4s', borderRadius: '50%'
        }} />
      </span>
    </label>
  </div>
);

// --- Joypad Component ---
const Joypad = ({ onChange }) => {
  const padRef = useRef(null);
  const [active, setActive] = useState(false);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });

  const [intensity, setIntensity] = useState(1);

  const updatePos = (e) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Restrict thumb completely inside the outer circle (80px outer, 28px inner)
    const maxDist = (rect.width - 28) / 2; 

    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    setThumbPos({ x: dx, y: dy });
    // Normalize to -1 to 1 based on the full allowed movement distance
    onChange({ x: (dx / maxDist) * intensity, y: (dy / maxDist) * intensity });
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (active) updatePos(e);
    };
    const handleUp = () => {
      setActive(false);
      setThumbPos({ x: 0, y: 0 });
      onChange(null); // Reset offset
    };
    if (active) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
    }
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [active, intensity, onChange]);

  return (
    <div style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.02)', 
      padding: '20px', 
      borderRadius: '16px', 
      border: '1px solid rgba(255, 255, 255, 0.05)', 
      marginBottom: '15px',
      boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <strong style={{ color: '#fff', fontSize: '13px', fontWeight: '500', letterSpacing: '0.5px' }}>Manual Eye Joypad</strong>
        <span style={{ 
          backgroundColor: active ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255,255,255,0.05)', 
          color: active ? '#ebd73f' : '#888',
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '10px', 
          textTransform: 'uppercase',
          transition: 'all 0.3s ease'
        }}>
          {active ? 'Tracking' : 'Idle'}
        </span>
      </div>
      
      <div 
        ref={padRef}
        onPointerDown={(e) => { setActive(true); updatePos(e); e.preventDefault(); }}
        style={{
          width: '90px', height: '90px', 
          borderRadius: '50%', 
          backgroundColor: '#0a0a0a', 
          border: '1px solid rgba(255,255,255,0.05)', 
          margin: '10px auto 25px', 
          position: 'relative', 
          touchAction: 'none', 
          cursor: active ? 'grabbing' : 'grab',
          boxShadow: 'inset 0 10px 25px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Center dot marker */}
        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        
        {/* The Thumb */}
        <div style={{
          width: '28px', height: '28px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #ebd73f, #c4b01e)', 
          position: 'absolute', 
          top: '50%', left: '50%',
          transform: `translate(calc(-50% + ${thumbPos.x}px), calc(-50% + ${thumbPos.y}px))`, 
          transition: active ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', 
          boxShadow: active 
            ? '0 0 20px rgba(235, 215, 63, 0.6), inset 0 2px 4px rgba(255,255,255,0.5)' 
            : '0 4px 10px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Thumb grip dot */}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)' }} />
        </div>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '12px', marginBottom: '8px' }}>
          <span>Eye Intensity</span>
          <span style={{ color: '#ebd73f', fontWeight: '500' }}>{intensity.toFixed(1)}x</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="10" 
          step="0.1" 
          value={intensity} 
          onChange={(e) => setIntensity(parseFloat(e.target.value))}
          style={{ width: '100%', cursor: 'pointer', accentColor: '#ebd73f' }}
        />
      </div>
    </div>
  );
};


export default function OrloExport() {
  const [emotion, setEmotion] = useState('idle'); // idle is the breathing mode
  const [hideUI, setHideUI] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const [eyesFollowCursor, setEyesFollowCursor] = useState(true);
  const [orloColor, setOrloColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#00FF00');
  const [lookOffset, setLookOffset] = useState(null);

  const emotions = ['idle', 'wink', 'surprised', 'laughing', 'confused', 'excited', 'sad', 'greeting', 'listening', 'thinking', 'success', 'disappointed', 'waiting', 'sleeping'];

  // Prevent scroll when sliding list is present
  useEffect(() => {
    if (!hideUI) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => document.body.style.overflow = 'auto';
  }, [hideUI]);

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{__html: `
        body { opacity: 1 !important; }
        ${!hideCursor ? `
        body, body *, .orlo-export-page, .orlo-export-page * { 
          cursor: auto; 
        }
        ` : ''}
      `}} />
      
      {/* Green Screen Overlay for reliable cursor hiding */}
      {hideCursor && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, cursor: 'none' }} />
      )}

      {/* Orlo Container */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', width: '600px', transition: 'all 0.5s ease', transform: hideUI ? 'scale(1.2)' : 'translateX(-150px) scale(1)', zIndex: 1, pointerEvents: 'none' }}>
        <OrloIcon size={500} emotion={emotion} color={orloColor} lookOffset={lookOffset} disableCursorFollow={!eyesFollowCursor} />
      </div>

      {/* Sliding Control Panel */}
      <div 
        style={{ 
          position: 'absolute', 
          right: hideUI ? '-420px' : '20px', 
          top: '20px', 
          bottom: '20px', 
          width: '400px',
          backgroundColor: 'rgba(0,0,0,0.85)', 
          padding: '20px', 
          borderRadius: '15px', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', 
          zIndex: 10,
          transition: 'right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflowY: 'auto',
          cursor: 'default'
        }}
      >
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '15px', fontFamily: "'Clash Display', sans-serif" }}>
          <h2 style={{ color: '#ebd73f', margin: '0 0 5px 0' }}>Orlo Export Studio</h2>
          <p style={{ color: '#ccc', margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
            Set colors, select an animation, and hide this panel to screen-record freely.
          </p>
        </div>

        {/* Settings Controls */}
        <div style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.02)', 
          padding: '20px', 
          borderRadius: '16px', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          marginBottom: '15px',
          boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.5)'
        }}>
           <ToggleSwitch 
             label="Hide cursor over green screen" 
             checked={hideCursor} 
             onChange={setHideCursor} 
           />
           <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '12px 0' }} />
           <ToggleSwitch 
             label="Eyes follow cursor" 
             checked={eyesFollowCursor} 
             onChange={setEyesFollowCursor} 
           />
        </div>

        {/* Joypad Control */}
        <Joypad onChange={setLookOffset} />

        {/* Color Pickers */}
        <AdvancedColorPicker label="Orlo Fill Color" colorHex={orloColor} onChangeHex={setOrloColor} />
        <AdvancedColorPicker label="Background (Green Screen)" colorHex={bgColor} onChangeHex={setBgColor} />

        {/* Animations List */}
        <h3 style={{ color: '#fff', fontSize: '14px', margin: '10px 0 15px 0', fontFamily: "'Clash Display', sans-serif", fontWeight: '600', letterSpacing: '0.5px' }}>
          Animations <span style={{color: '#888', fontWeight: 'normal', fontSize: '12px'}}>(Idle = Breathing)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', flexShrink: 0, marginBottom: '25px' }}>
          {emotions.map(e => (
            <button 
              key={e} 
              onClick={() => setEmotion(e)}
              style={{ 
                padding: '12px', 
                borderRadius: '10px', 
                border: emotion === e ? '1px solid rgba(235, 215, 63, 0.5)' : '1px solid rgba(255,255,255,0.05)', 
                backgroundColor: emotion === e ? 'rgba(235, 215, 63, 0.1)' : 'rgba(0,0,0,0.3)', 
                color: emotion === e ? '#ebd73f' : '#aaa', 
                cursor: 'pointer', 
                fontWeight: emotion === e ? '600' : '500',
                textAlign: 'center',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontSize: '13px',
                transform: emotion === e ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
          <button 
              onClick={() => setHideUI(true)}
              style={{ padding: '16px 20px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)', transition: 'all 0.2s', letterSpacing: '0.5px' }}
          >
              Hide Panel for Recording ➔
          </button>
          <Link href="/orloai" style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#fff', textDecoration: 'none', textAlign: 'center', fontFamily: "'Clash Display', sans-serif", fontWeight: '500', transition: 'all 0.2s', letterSpacing: '0.5px' }}>
              Back to Wiki
          </Link>
        </div>
      </div>

      {/* Hidden UI Reveal Hint */}
      {hideUI && (
         <div 
            style={{ 
              position: 'absolute', 
              bottom: '20px', 
              right: '20px', 
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white', 
              fontFamily: "'Clash Display', sans-serif", 
              fontSize: '14px',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 100
            }}
            onClick={() => setHideUI(false)}
         >
            Show Panel ⬅
         </div>
      )}
    </div>
  );
}
