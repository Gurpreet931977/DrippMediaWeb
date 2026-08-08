'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function DrippDatePicker({ value, onChange }) {
  const dateObj = value ? new Date(value) : (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  })();

  const [currentDate, setCurrentDate] = useState(dateObj);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!value) {
      onChange(currentDate.toISOString());
    }
  }, []);

  useEffect(() => {
    if (value) {
      const newD = new Date(value);
      if (newD.getTime() !== currentDate.getTime()) {
        setCurrentDate(newD);
      }
    }
  }, [value, currentDate]);

  const getLocalDatetimeString = (date) => {
    const tzoffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  };

  const next14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const handleDateSelect = (d) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    setCurrentDate(newDate);
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type, val) => {
    const newDate = new Date(currentDate);
    let h = newDate.getHours();
    const isPM = h >= 12;

    if (type === 'hour') {
      let num = parseInt(val, 10);
      if (isPM && num !== 12) num += 12;
      if (!isPM && num === 12) num = 0;
      newDate.setHours(num);
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(val, 10));
    } else if (type === 'ampm') {
      if (val === 'PM' && !isPM) newDate.setHours(h + 12);
      if (val === 'AM' && isPM) newDate.setHours(h - 12);
    }
    
    setCurrentDate(newDate);
    onChange(newDate.toISOString());
  };

  const currentHour12 = currentDate.getHours() % 12 || 12;
  const currentMin = currentDate.getMinutes().toString().padStart(2, '0');
  const currentAmPm = currentDate.getHours() >= 12 ? 'PM' : 'AM';

  return (
    <div style={{
      background: 'rgba(20,20,20,0.6)',
      border: '1px solid rgba(235, 215, 63, 0.3)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      marginTop: '1rem',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Date Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#ebd73f', fontWeight: '600' }}>
        <Calendar size={18} /> Select Date
      </div>
      <div 
        ref={scrollRef}
        style={{
          display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px', 
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(235,215,63,0.3) transparent'
        }}
      >
        {next14Days.map((d, i) => {
          const isSelected = d.toDateString() === currentDate.toDateString();
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          const dateNum = d.getDate();
          const monthName = d.toLocaleDateString('en-US', { month: 'short' });
          
          return (
            <div 
              key={i} 
              onClick={() => handleDateSelect(d)}
              style={{
                flexShrink: 0,
                width: '70px',
                height: '80px',
                borderRadius: '12px',
                background: isSelected ? 'linear-gradient(135deg, #ebd73f, #d4c235)' : 'rgba(255,255,255,0.05)',
                color: isSelected ? '#000' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isSelected ? '0 4px 15px rgba(235,215,63,0.3)' : 'none'
              }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8 }}>{dayName}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: '800' }}>{dateNum}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{monthName}</span>
            </div>
          );
        })}
      </div>

      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }}></div>

      {/* Time Picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#ebd73f', fontWeight: '600' }}>
        <Clock size={18} /> Select Time
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select 
          value={currentHour12} 
          onChange={(e) => handleTimeChange('hour', e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(235,215,63,0.4)', borderRadius: '8px', 
            color: '#fff', padding: '12px', fontSize: '1.2rem', outline: 'none', cursor: 'pointer', width: '80px', textAlign: 'center'
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        
        <span style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>:</span>
        
        <select 
          value={currentMin} 
          onChange={(e) => handleTimeChange('minute', e.target.value)}
          style={{
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(235,215,63,0.4)', borderRadius: '8px', 
            color: '#fff', padding: '12px', fontSize: '1.2rem', outline: 'none', cursor: 'pointer', width: '80px', textAlign: 'center'
          }}
        >
          {['00', '15', '30', '45'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(235,215,63,0.4)' }}>
          {['AM', 'PM'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleTimeChange('ampm', m)}
              style={{
                padding: '12px 16px',
                background: currentAmPm === m ? '#ebd73f' : 'transparent',
                color: currentAmPm === m ? '#000' : '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' }}></div>
      
      {/* Manual Entry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#ebd73f', fontWeight: '600' }}>
        Manual Typing
      </div>
      <input 
        type="datetime-local"
        value={getLocalDatetimeString(currentDate)}
        onChange={(e) => {
          if (e.target.value) {
            const newDate = new Date(e.target.value);
            setCurrentDate(newDate);
            onChange(newDate.toISOString());
          }
        }}
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(235,215,63,0.4)',
          borderRadius: '8px',
          color: '#fff',
          padding: '12px',
          fontSize: '1rem',
          outline: 'none',
          width: '100%',
          fontFamily: 'inherit',
          colorScheme: 'dark'
        }}
      />
    </div>
  );
}
