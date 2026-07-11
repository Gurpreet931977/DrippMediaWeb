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

  const inputStyle = { width: '45px', padding: '4px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#222', color: '#fff', fontSize: '12px', textAlign: 'center' };
  const labelStyle = { fontSize: '10px', color: '#aaa', display: 'block', textAlign: 'center', marginTop: '2px' };

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong style={{ color: '#fff', fontSize: '14px' }}>{label}</strong>
        <input type="color" value={colorHex} onChange={(e) => onChangeHex(e.target.value)} style={{ cursor: 'pointer', background: 'none', border: 'none', width: '30px', height: '30px' }} />
      </div>

      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {/* HEX */}
        <div>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
             <input type="text" value={colorHex} onChange={handleHexChange} style={{ ...inputStyle, width: '70px', textAlign: 'left' }} />
             <span style={labelStyle}>HEX</span>
           </div>
        </div>

        {/* RGB */}
        <div style={{ display: 'flex', gap: '5px' }}>
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
        <div style={{ display: 'flex', gap: '5px' }}>
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

export default function OrloExport() {
  const [emotion, setEmotion] = useState('idle'); // idle is the breathing mode
  const [hideUI, setHideUI] = useState(false);
  const [orloColor, setOrloColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#00FF00');

  const emotions = ['idle', 'excited', 'sad', 'greeting', 'listening', 'thinking', 'success', 'disappointed', 'waiting', 'sleeping'];

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
      
      {/* Orlo Container */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px', width: '600px', transition: 'all 0.5s ease', transform: hideUI ? 'scale(1.2)' : 'translateX(-150px) scale(1)' }}>
        <OrloIcon size={500} emotion={emotion} color={orloColor} />
      </div>

      {/* Sliding Control Panel */}
      <div 
        style={{ 
          position: 'absolute', 
          right: hideUI ? '-400px' : '20px', 
          top: '20px', 
          bottom: '20px', 
          width: '380px',
          backgroundColor: 'rgba(0,0,0,0.85)', 
          padding: '20px', 
          borderRadius: '15px', 
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', 
          zIndex: 10,
          transition: 'right 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflowY: 'auto'
        }}
      >
        <div style={{ width: '100%', textAlign: 'center', marginBottom: '15px', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#ebd73f', margin: '0 0 5px 0' }}>Orlo Export Studio</h2>
          <p style={{ color: '#ccc', margin: '0', fontSize: '13px', lineHeight: '1.4' }}>
            Set colors, select an animation, and hide this panel to screen-record freely.
          </p>
        </div>

        {/* Color Pickers */}
        <AdvancedColorPicker label="Orlo Fill Color" colorHex={orloColor} onChangeHex={setOrloColor} />
        <AdvancedColorPicker label="Background (Green Screen)" colorHex={bgColor} onChangeHex={setBgColor} />

        {/* Animations List */}
        <h3 style={{ color: '#fff', fontSize: '14px', margin: '10px 0', fontFamily: 'sans-serif' }}>Animations (Breathing is 'Idle')</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
          {emotions.map(e => (
            <button 
              key={e} 
              onClick={() => setEmotion(e)}
              style={{ 
                padding: '12px 15px', 
                borderRadius: '8px', 
                border: 'none', 
                backgroundColor: emotion === e ? '#ebd73f' : '#2a2a2a', 
                color: emotion === e ? '#000' : '#fff', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)} {emotion === e && '●'}
            </button>
          ))}
        </div>
        
        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', marginTop: '20px', gap: '10px' }}>
          <button 
              onClick={() => setHideUI(true)}
              style={{ padding: '15px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
          >
              Hide Panel for Recording ➔
          </button>
          <Link href="/orloai" style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid white', backgroundColor: 'transparent', color: '#fff', textDecoration: 'none', textAlign: 'center', fontFamily: 'sans-serif' }}>
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
              fontFamily: 'sans-serif', 
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
