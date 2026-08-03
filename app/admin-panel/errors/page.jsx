'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, Info, AlertCircle, XCircle, Trash2, Clock, MapPin, Search, CheckCircle2 } from 'lucide-react';
import styles from '../admin.module.css';
import { useGenz } from '../../contexts/GenzContext';
import { useErrorLog } from '../../contexts/ErrorLogContext';

export default function ErrorLogsPage() {
  const { logs, clearLogs } = useErrorLog();
  const { isGenz } = useGenz() || { isGenz: false };
  
  const [filterLevel, setFilterLevel] = useState('all'); // all, error, warn, fatal
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchLevel = filterLevel === 'all' || log.level === filterLevel;
      const searchStr = `${log.message} ${log.source} ${log.details}`.toLowerCase();
      const matchSearch = searchStr.includes(searchQuery.toLowerCase());
      return matchLevel && matchSearch;
    });
  }, [logs, filterLevel, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      fatal: logs.filter(l => l.level === 'fatal').length,
      error: logs.filter(l => l.level === 'error').length,
      warn: logs.filter(l => l.level === 'warn').length,
    };
  }, [logs]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'fatal': return '#ff3333';
      case 'error': return '#ff8800';
      case 'warn': return '#ebd73f';
      default: return '#3b82f6';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'fatal': return <XCircle size={16} color="#ff3333" />;
      case 'error': return <AlertCircle size={16} color="#ff8800" />;
      case 'warn': return <AlertTriangle size={16} color="#ebd73f" />;
      default: return <Info size={16} color="#3b82f6" />;
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>{isGenz ? 'GLITCH' : 'ERROR'} <span style={{ color: '#ff4d4d' }}>{isGenz ? 'RADAR' : 'LOGS'}</span></h1>
        <p className={styles.subtitle}>{isGenz ? 'Catching every vibe kill in the system.' : 'Global interceptor for critical and minor application failures.'}</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '20px', borderTop: '2px solid #333' }}>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Panchang, sans-serif', color: '#fff', marginBottom: '5px' }}>{stats.total}</div>
          <div style={{ color: '#888', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Captured</div>
        </div>
        <div className={styles.card} style={{ textAlign: 'center', padding: '20px', borderTop: '2px solid #ff3333' }}>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Panchang, sans-serif', color: '#ff3333', marginBottom: '5px' }}>{stats.fatal}</div>
          <div style={{ color: '#ff3333', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Fatal Crashes</div>
        </div>
        <div className={styles.card} style={{ textAlign: 'center', padding: '20px', borderTop: '2px solid #ff8800' }}>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Panchang, sans-serif', color: '#ff8800', marginBottom: '5px' }}>{stats.error}</div>
          <div style={{ color: '#ff8800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Standard Errors</div>
        </div>
        <div className={styles.card} style={{ textAlign: 'center', padding: '20px', borderTop: '2px solid #ebd73f' }}>
          <div style={{ fontSize: '2.5rem', fontFamily: 'Panchang, sans-serif', color: '#ebd73f', marginBottom: '5px' }}>{stats.warn}</div>
          <div style={{ color: '#ebd73f', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Warnings</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['all', 'fatal', 'error', 'warn'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={styles.btn}
              style={{
                background: filterLevel === level ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: filterLevel === level ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: filterLevel === level ? '#fff' : '#888',
                padding: '8px 16px',
                borderRadius: '8px',
                textTransform: 'capitalize'
              }}
            >
              {level}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '15px', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
            <Search size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.inputField}
              style={{ paddingLeft: '38px', margin: 0 }}
            />
          </div>
          
          {logs.length > 0 && (
            <button 
              onClick={() => {
                if(confirm('Are you sure you want to clear all error logs?')) clearLogs();
              }}
              className={styles.btn} 
              style={{ color: '#ff4d4d', borderColor: 'rgba(255, 77, 77, 0.2)' }}
            >
              <Trash2 size={16} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredLogs.length === 0 ? (
          <div className={styles.card} style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
            <div style={{ display: 'inline-flex', padding: '20px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.05)', marginBottom: '20px' }}>
              <CheckCircle2 size={40} color="#ebd73f" />
            </div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>System is Clean</h3>
            <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto' }}>No errors have been caught in this session matching your filters.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div 
              key={log.id} 
              className={styles.card} 
              style={{ 
                padding: '0', 
                overflow: 'hidden', 
                borderLeft: \`4px solid \${getLevelColor(log.level)}\`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
            >
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  {getLevelIcon(log.level)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.message}
                    </span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      background: \`\${getLevelColor(log.level)}22\`, 
                      color: getLevelColor(log.level),
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {log.level}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#888', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <MapPin size={12} />
                      {log.source.split('/').pop() || log.source}
                    </span>
                  </div>
                </div>
              </div>

              {expandedLogId === log.id && (
                <div style={{ padding: '0 20px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ paddingTop: '20px' }}>
                    <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Full Source URL</label>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#ebd73f', fontSize: '0.9rem', wordBreak: 'break-all', marginBottom: '20px' }}>
                      {log.source}
                    </div>

                    <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Details / Stack Trace</label>
                    <pre style={{ 
                      padding: '16px', 
                      background: '#050505', 
                      borderRadius: '8px', 
                      color: '#ddd', 
                      fontSize: '0.85rem', 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontFamily: 'monospace',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      margin: 0
                    }}>
                      {log.details || 'No additional details provided.'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
