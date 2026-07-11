'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles, LayoutTemplate, PenTool, RefreshCw, Clock, Calendar, Edit2, Trash2 } from 'lucide-react';
import DrippDatePicker from '../components/DrippDatePicker';
import OrloIcon from '../components/OrloIcon';
import RefreshIcon from '../components/RefreshIcon';
import styles from '../admin.module.css';
import gsap from 'gsap';

export default function EmailCampaignsPage() {
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [specificEmail, setSpecificEmail] = useState('');
  const [templateType, setTemplateType] = useState('announcement');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [generatingMode, setGeneratingMode] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceIntervalDays, setRecurrenceIntervalDays] = useState(1);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [showClearAfterSend, setShowClearAfterSend] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [hoveredScheduleId, setHoveredScheduleId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [scheduledList, setScheduledList] = useState([]);

  // Fetch campaigns from Supabase
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/email/campaigns');
      const data = await res.json();
      if (res.ok && data.campaigns) {
        // Map database fields to frontend fields
        setScheduledList(data.campaigns.map(c => ({
          id: c.id,
          title: c.title,
          subject: c.subject,
          body: c.body,
          templateType: c.template_type,
          isBroadcast: c.is_broadcast,
          specificEmail: c.specific_email,
          scheduledAt: c.scheduled_at,
          isRecurring: c.is_recurring,
          recurrenceIntervalDays: c.recurrence_interval_days,
          hasEndDate: !!c.recurrence_end_date,
          recurrenceEndDate: c.recurrence_end_date
        })));
      }
    } catch (err) {
      console.error('Failed to fetch campaigns', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const containerRef = useRef(null);
  const aiBtnRef = useRef(null);

  // Initial enter animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { y: 40, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power4.out' }
      );
    }
  }, []);

  // Listen for AI Copilot commands
  useEffect(() => {
    const handleCopilotAction = (e) => {
      const data = e.detail;
      if (data && data.intent === 'email' && data.payload) {
        if (data.payload.subject) setSubject(data.payload.subject);
        if (data.payload.title) setTitle(data.payload.title);
        if (data.payload.body) setBody(data.payload.body);
        if (data.payload.templateType) setTemplateType(data.payload.templateType);
        if (typeof data.payload.isScheduled === 'boolean') setIsScheduled(data.payload.isScheduled);
        if (data.payload.scheduleTime) setScheduleTime(data.payload.scheduleTime);
        if (typeof data.payload.isRecurring === 'boolean') setIsRecurring(data.payload.isRecurring);
        if (data.payload.recurrenceIntervalDays) setRecurrenceIntervalDays(data.payload.recurrenceIntervalDays);
        if (typeof data.payload.hasEndDate === 'boolean') setHasEndDate(data.payload.hasEndDate);
        if (data.payload.recurrenceEndDate) setRecurrenceEndDate(data.payload.recurrenceEndDate);
        
        setStatus({ type: 'success', msg: 'Orlo has updated your email template.' });
      }
    };
    
    window.addEventListener('copilot-action', handleCopilotAction);
    return () => window.removeEventListener('copilot-action', handleCopilotAction);
  }, []);

  // Expose current context to Copilot
  useEffect(() => {
    window._drippEmailContext = { subject, title, body, templateType, isBroadcast, isScheduled, scheduleTime, isRecurring, recurrenceIntervalDays, hasEndDate, recurrenceEndDate };
  }, [subject, title, body, templateType, isBroadcast, isScheduled, scheduleTime, isRecurring, recurrenceIntervalDays, hasEndDate, recurrenceEndDate]);

  // Magnetic hover effect for AI button
  const handleAiMouseMove = (e) => {
    if (!aiBtnRef.current || generating) return;
    const rect = aiBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    gsap.to(aiBtnRef.current, {
      x: x * 0.3,
      y: y * 0.3,
      duration: 0.4,
      ease: 'power3.out'
    });
  };

  const handleAiMouseLeave = () => {
    if (!aiBtnRef.current || generating) return;
    gsap.to(aiBtnRef.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      if (editingScheduleId) {
        const res = await fetch('/api/admin/email/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingScheduleId,
            isBroadcast,
            specificEmail,
            subject,
            title,
            body,
            templateType,
            scheduledAt: isScheduled && scheduleTime ? new Date(scheduleTime).toISOString() : null,
            isRecurring,
            recurrenceIntervalDays,
            recurrenceEndDate: isRecurring && hasEndDate && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update campaign');

        setStatus({ type: 'success', msg: 'Scheduled campaign updated successfully!' });
        setEditingScheduleId(null);
        setShowClearAfterSend(true);
        fetchCampaigns();
      } else {
        const endpoint = isScheduled ? '/api/admin/email/campaigns' : '/api/admin/email/send';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isBroadcast,
            specificEmail,
            subject,
            title,
            body,
            templateType,
            scheduledAt: isScheduled && scheduleTime ? new Date(scheduleTime).toISOString() : null,
            isRecurring,
            recurrenceIntervalDays,
            recurrenceEndDate: isRecurring && hasEndDate && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send');

        setStatus({ type: 'success', msg: isScheduled ? 'Campaign scheduled successfully!' : data.message });
        setShowClearAfterSend(true);
        
        if (isScheduled) {
          fetchCampaigns();
        }
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async (mode = 'all') => {
    if (generating) return;
    setGenerating(true);
    setGeneratingMode(mode);
    setStatus({ type: '', msg: '' });
    if (aiBtnRef.current) gsap.to(aiBtnRef.current, { x: 0, y: 0, scale: 0.95, duration: 0.2 });
    
    try {
      const payload = { templateType };
      if (mode === 'subject') {
        payload.currentTitle = title;
        payload.currentBody = body;
      } else if (mode === 'title') {
        payload.currentSubject = subject;
        payload.currentBody = body;
      } else if (mode === 'body') {
        payload.currentSubject = subject;
        payload.currentTitle = title;
      }

      const res = await fetch('/api/admin/email/magic-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate copy');
      
      if (mode === 'all' || mode === 'subject') setSubject(data.subject || '');
      if (mode === 'all' || mode === 'title') setTitle(data.title || '');
      
      if (mode === 'all' || mode === 'body') {
        setBody('');
        
        let currentText = '';
        let charIndex = 0;
        const fullText = data.body || '';

        const typeInterval = setInterval(() => {
          if (charIndex < fullText.length) {
            currentText += fullText.charAt(charIndex);
            setBody(currentText);
            charIndex++;
          }
          if (charIndex >= fullText.length) {
            clearInterval(typeInterval);
            setGenerating(false);
            setGeneratingMode('');
            if (aiBtnRef.current) gsap.to(aiBtnRef.current, { scale: 1, duration: 0.4, ease: 'back.out(1.5)' });
          }
        }, 15);
      } else {
        setGenerating(false);
        setGeneratingMode('');
        if (aiBtnRef.current) gsap.to(aiBtnRef.current, { scale: 1, duration: 0.4, ease: 'back.out(1.5)' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
      setGenerating(false);
      setGeneratingMode('');
      if (aiBtnRef.current) gsap.to(aiBtnRef.current, { scale: 1, duration: 0.4, ease: 'back.out(1.5)' });
    }
  };

  return (
    <div ref={containerRef} style={{ paddingBottom: '4rem' }}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Email <span style={{ color: '#ebd73f' }}>Campaigns</span>
        </h1>
        <p className={styles.subtitle}>Craft and launch premium email experiences to your audience.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Main Form */}
        <div className={styles.interactiveCard} style={{ padding: '2.5rem' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Target Audience */}
            <div>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#ebd73f' }}>
                <Users size={18} /> Target Audience
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBroadcast(false)}
                  className={!isBroadcast ? styles.btnPrimary : styles.btn}
                  style={{ flex: 1, padding: '1.25rem' }}
                >
                  <Mail size={18} />
                  Specific Users
                </button>
                <button
                  type="button"
                  onClick={() => setIsBroadcast(true)}
                  className={isBroadcast ? styles.btnPrimary : styles.btn}
                  style={{ flex: 1, padding: '1.25rem' }}
                >
                  <Users size={18} />
                  Broadcast to All
                </button>
              </div>
              {isBroadcast && (
                <div style={{ marginTop: '1rem', padding: '1.25rem', backgroundColor: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)', color: '#ebd73f', borderRadius: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Proceed with caution</strong>
                    This will dispatch the email to every registered user. Ensure your copy is perfect before sending.
                  </div>
                </div>
              )}
            </div>

            {!isBroadcast && (
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>Recipient Emails (comma-separated)</label>
                <input
                  type="email"
                  multiple
                  required
                  className={styles.input}
                  placeholder="user@example.com, another@example.com"
                  value={specificEmail}
                  onChange={(e) => setSpecificEmail(e.target.value)}
                />
              </div>
            )}

            {/* Content Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ebd73f', margin: 0, marginTop: '0.5rem' }}>
                  <PenTool size={18} /> Message Content
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  {/* AI Generate Button */}
                  <button
                    ref={aiBtnRef}
                    type="button"
                    onClick={() => handleAiGenerate('all')}
                    onMouseMove={handleAiMouseMove}
                    onMouseLeave={handleAiMouseLeave}
                    disabled={generating}
                    style={{
                      background: 'linear-gradient(135deg, #ebd73f, #d4c235)',
                      border: 'none',
                      borderRadius: '2rem',
                      padding: '0.6rem 1.25rem',
                      color: '#000',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: generating ? 'not-allowed' : 'pointer',
                      opacity: generating ? 0.7 : 1,
                      boxShadow: '0 4px 20px rgba(235, 215, 63, 0.4)'
                    }}
                  >
                  <div style={{ position: 'relative', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshIcon size={16} className={generating ? "animate-spin" : ""} />
                  </div>
                    {generating ? 'Generating...' : 'Magic Generate'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setSubject(''); setTitle(''); setBody(''); }}
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.75rem', cursor: 'pointer', padding: '0 0.5rem', transition: 'color 0.2s' }}
                    onMouseOver={(e) => e.target.style.color = '#ebd73f'}
                    onMouseOut={(e) => e.target.style.color = '#888'}
                  >
                    Clear all content
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Email Subject</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      className={styles.input}
                      placeholder="Subject line for the inbox"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ paddingRight: '3rem' }}
                    />
                    <button type="button" onClick={() => handleAiGenerate('subject')} disabled={generating} title="Regenerate Subject" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(235, 215, 63, 0.15)', border: '1px solid rgba(235, 215, 63, 0.4)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ebd73f', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(235, 215, 63, 0.15)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.25)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(235, 215, 63, 0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.15)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(235, 215, 63, 0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                      <RefreshIcon size={16} className={generatingMode === 'subject' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Template Title</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      className={styles.input}
                      placeholder="Large header inside the email"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ paddingRight: '3rem' }}
                    />
                    <button type="button" onClick={() => handleAiGenerate('title')} disabled={generating} title="Regenerate Title" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(235, 215, 63, 0.15)', border: '1px solid rgba(235, 215, 63, 0.4)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ebd73f', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(235, 215, 63, 0.15)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.25)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(235, 215, 63, 0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.15)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(235, 215, 63, 0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                      <RefreshIcon size={16} className={generatingMode === 'title' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className={styles.label} style={{ marginBottom: '0.5rem', display: 'block' }}>Message Body</label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      required
                      className={styles.input}
                      placeholder="Type your message here..."
                      rows={8}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      style={{ resize: 'vertical', lineHeight: '1.6', paddingRight: '3rem' }}
                    />
                    <button type="button" onClick={() => handleAiGenerate('body')} disabled={generating} title="Regenerate Body" style={{ position: 'absolute', right: '12px', top: '12px', background: 'rgba(235, 215, 63, 0.15)', border: '1px solid rgba(235, 215, 63, 0.4)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ebd73f', cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px rgba(235, 215, 63, 0.15)' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.25)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(235, 215, 63, 0.3)'; e.currentTarget.style.transform = 'scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(235, 215, 63, 0.15)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(235, 215, 63, 0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                      <RefreshIcon size={16} className={generatingMode === 'body' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scheduling Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ebd73f', margin: 0 }}>
                  <Clock size={18} /> Dispatch Timing
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsScheduled(false)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: !isScheduled ? '1px solid rgba(235, 215, 63, 0.6)' : '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: !isScheduled ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: !isScheduled ? '#ebd73f' : '#fff' }}>Live Now</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>Send immediately upon dispatch.</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduled(true)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    border: isScheduled ? '1px solid rgba(235, 215, 63, 0.6)' : '1px solid rgba(255,255,255,0.05)',
                    backgroundColor: isScheduled ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: isScheduled ? '#ebd73f' : '#fff' }}>Schedule for Later</div>
                  <div style={{ fontSize: '0.85rem', color: '#888' }}>Lock in a future delivery time.</div>
                </button>
              </div>

              {isScheduled && (
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <DrippDatePicker 
                    value={scheduleTime}
                    onChange={(val) => setScheduleTime(val)}
                  />
                  
                  <div style={{ padding: '1.25rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isRecurring ? '1rem' : 0 }}>
                      <span style={{ color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: '500' }} onClick={() => setIsRecurring(!isRecurring)}>Make this a recurring campaign</span>
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={isRecurring} 
                          onChange={(e) => setIsRecurring(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
                        />
                        <span style={{
                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: isRecurring ? '#ebd73f' : 'rgba(255,255,255,0.1)', transition: '.4s', borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute', height: '18px', width: '18px',
                            left: isRecurring ? '23px' : '3px', bottom: '3px', backgroundColor: isRecurring ? '#000' : '#888',
                            transition: '.4s', borderRadius: '50%'
                          }} />
                        </span>
                      </label>
                    </div>
                    {isRecurring && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Repeat every</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="365" 
                          value={recurrenceIntervalDays} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setRecurrenceIntervalDays('');
                            } else {
                              const parsed = parseInt(val, 10);
                              if (!isNaN(parsed)) setRecurrenceIntervalDays(parsed);
                            }
                          }}
                          onBlur={() => {
                            if (recurrenceIntervalDays === '' || recurrenceIntervalDays < 1) {
                              setRecurrenceIntervalDays(1);
                            }
                          }}
                          className={styles.input}
                          style={{ width: '80px', padding: '0.5rem', textAlign: 'center' }}
                        />
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>days</span>
                      </div>
                    )}

                    {isRecurring && (
                      <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasEndDate ? '1rem' : 0 }}>
                          <span style={{ color: '#fff', fontSize: '1rem', cursor: 'pointer', fontWeight: '500' }} onClick={() => setHasEndDate(!hasEndDate)}>Set an end date</span>
                          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={hasEndDate} 
                              onChange={(e) => setHasEndDate(e.target.checked)}
                              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} 
                            />
                            <span style={{
                              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                              backgroundColor: hasEndDate ? '#ebd73f' : 'rgba(255,255,255,0.1)', transition: '.4s', borderRadius: '24px'
                            }}>
                              <span style={{
                                position: 'absolute', height: '18px', width: '18px',
                                left: hasEndDate ? '23px' : '3px', bottom: '3px', backgroundColor: hasEndDate ? '#000' : '#888',
                                transition: '.4s', borderRadius: '50%'
                              }} />
                            </span>
                          </label>
                        </div>
                        {hasEndDate && (
                          <DrippDatePicker 
                            value={recurrenceEndDate}
                            onChange={(val) => setRecurrenceEndDate(val)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {status.msg && (
              <div style={{ 
                padding: '1.25rem', 
                borderRadius: '0.75rem', 
                backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(235, 215, 63, 0.1)',
                color: status.type === 'error' ? '#ef4444' : '#ebd73f',
                border: `1px solid ${status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(235, 215, 63, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: '500'
              }}>
                {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                {status.msg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="submit" 
                disabled={loading || generating}
                className={styles.btnPrimary} 
                style={{ 
                  padding: '1.25rem', 
                  fontSize: '1.1rem',
                  flex: 1
                }}
              >
                {loading ? (
                  'Dispatching...'
                ) : (
                  <>
                    <Send size={20} />
                    {editingScheduleId ? 'Save Changes' : (isBroadcast ? 'Launch Broadcast Sequence' : 'Dispatch Test Email')}
                  </>
                )}
              </button>

              {showClearAfterSend && (
                <button 
                  type="button" 
                  onClick={() => {
                    if (!isBroadcast) setSpecificEmail('');
                    setSubject('');
                    setTitle('');
                    setBody('');
                    setIsScheduled(false);
                    setScheduleTime('');
                    setIsRecurring(false);
                    setRecurrenceIntervalDays(1);
                    setHasEndDate(false);
                    setRecurrenceEndDate('');
                    setShowClearAfterSend(false);
                    setEditingScheduleId(null);
                    setStatus({ type: '', msg: '' });
                  }}
                  className={styles.btn} 
                  style={{ 
                    padding: '1.25rem', 
                    fontSize: '1.1rem',
                    flex: '0 0 auto'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Theme Selector */}
          <div className={styles.interactiveCard} style={{ padding: '2rem' }}>
            <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ebd73f' }}>
              <LayoutTemplate size={18} /> Visual Theme
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* Announcement */}
              <button 
                type="button"
                onClick={() => setTemplateType('announcement')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: templateType === 'announcement' ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                  border: templateType === 'announcement' ? '1px solid rgba(235, 215, 63, 0.6)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'announcement' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: templateType === 'announcement' ? '#ebd73f' : '#fff', fontSize: '1.05rem' }}>Announcement</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>Sleek, centered focus. Perfect for major updates.</div>
              </button>

              {/* Primary Inbox */}
              <button 
                type="button"
                onClick={() => setTemplateType('primary')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: templateType === 'primary' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  border: templateType === 'primary' ? '1px solid rgba(255, 255, 255, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'primary' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: '#fff', fontSize: '1.05rem' }}>Primary Inbox (Plain Text)</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>Zero styling, personal feel. Bypasses the promotions tab.</div>
              </button>
              
              {/* Promo */}
              <button 
                type="button"
                onClick={() => setTemplateType('promo')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: templateType === 'promo' ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                  border: templateType === 'promo' ? '2px dashed rgba(235, 215, 63, 0.6)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'promo' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: templateType === 'promo' ? '#ebd73f' : '#fff', fontSize: '1.05rem' }}>Promo Offer</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>Heavy gold block accents designed to drive conversions.</div>
              </button>

              {/* Newsletter */}
              <button 
                type="button"
                onClick={() => setTemplateType('newsletter')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: templateType === 'newsletter' ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                  border: templateType === 'newsletter' ? '1px solid rgba(235, 215, 63, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                  borderLeft: templateType === 'newsletter' ? '4px solid #ebd73f' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'newsletter' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: templateType === 'newsletter' ? '#ebd73f' : '#fff', fontSize: '1.05rem' }}>Newsletter</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>Editorial left-aligned layout for rich content drops.</div>
              </button>

              {/* Invitation */}
              <button 
                type="button"
                onClick={() => setTemplateType('invitation')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: templateType === 'invitation' ? 'rgba(235, 215, 63, 0.1)' : 'transparent',
                  border: templateType === 'invitation' ? '3px double rgba(235, 215, 63, 0.8)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'invitation' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: templateType === 'invitation' ? '#ebd73f' : '#fff', fontSize: '1.05rem' }}>VIP Invitation</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>Elegant bordered design for exclusive access limits.</div>
              </button>

              {/* Alert */}
              <button 
                type="button"
                onClick={() => setTemplateType('alert')}
                style={{ 
                  padding: '1.25rem', textAlign: 'left', borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: templateType === 'alert' ? 'repeating-linear-gradient(45deg, rgba(235, 215, 63, 0.1), rgba(235, 215, 63, 0.1) 10px, transparent 10px, transparent 20px)' : 'transparent',
                  border: templateType === 'alert' ? '1px solid rgba(235, 215, 63, 0.8)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff',
                  transform: templateType === 'alert' ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.35rem', color: templateType === 'alert' ? '#ebd73f' : '#fff', fontSize: '1.05rem' }}>Urgent Alert</div>
                <div style={{ fontSize: '0.85rem', color: '#888', lineHeight: '1.4' }}>High contrast hazard block for time-sensitive actions.</div>
              </button>
            </div>
          </div>

          {/* AI Info */}
          <div className={styles.smartPasteCard}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', color: '#ebd73f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <OrloIcon size={18} /> Orlo (Dripp AI Copilot)
            </h4>
            <p style={{ margin: 0, color: '#aaa', lineHeight: '1.6', fontSize: '0.875rem' }}>
              The magic button instantly generates premium, Dripp-oriented copy tailored to your selected theme. 
              <br/><br/>
              <em>(Note: Powered by advanced AI models to maximize your media presence and aesthetic.)</em>
            </p>
          </div>

          {/* Scheduled Emails List */}
          <div className={styles.interactiveCard} style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#ebd73f" /> Scheduled Campaigns
            </h4>
            
            {scheduledList.length === 0 ? (
              <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>No campaigns currently scheduled.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {scheduledList.map(item => (
                  <div key={item.id} 
                       onMouseEnter={() => setHoveredScheduleId(item.id)}
                       onMouseLeave={() => setHoveredScheduleId(null)}
                       style={{ position: 'relative', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    {hoveredScheduleId === item.id && (
                      <div style={{
                         position: 'absolute',
                         right: '110%',
                         bottom: '0',
                         width: '320px',
                         backgroundColor: '#111',
                         border: '1px solid #ebd73f',
                         borderRadius: '0.75rem',
                         padding: '1.25rem',
                         zIndex: 10,
                         boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                         color: '#fff',
                         fontSize: '0.85rem'
                      }}>
                         <div style={{ fontWeight: '600', color: '#ebd73f', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Info size={16}/> Campaign Details</div>
                         <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Scheduled:</strong> <span>{mounted ? new Date(item.scheduledAt).toLocaleString() : ''}</span></div>
                         <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Template:</strong> <span style={{textTransform: 'capitalize'}}>{item.templateType}</span></div>
                         <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Audience:</strong> <span>{item.isBroadcast ? 'All Users' : item.specificEmail}</span></div>
                         <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Subject:</strong> <span>{item.subject}</span></div>
                         {item.isRecurring && (
                           <>
                             <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Recurs:</strong> <span style={{ color: '#ebd73f' }}>Every {item.recurrenceIntervalDays} days</span></div>
                             {item.hasEndDate && (
                               <div style={{ marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between' }}><strong style={{color: '#888'}}>Until:</strong> <span style={{ color: '#ef4444' }}>{mounted ? new Date(item.recurrenceEndDate).toLocaleDateString() : ''}</span></div>
                             )}
                           </>
                         )}
                         <div style={{ marginTop: '1rem', color: '#ccc', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                           &quot;{item.body.substring(0, 150)}{item.body.length > 150 ? '...' : ''}&quot;
                         </div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#ebd73f' }}>{mounted ? new Date(item.scheduledAt).toLocaleString() : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          setTitle(item.title);
                          setSubject(item.subject);
                          setBody(item.body);
                          setTemplateType(item.templateType);
                          setIsBroadcast(item.isBroadcast);
                          setSpecificEmail(item.specificEmail || '');
                          setIsScheduled(true);
                          setScheduleTime(new Date(item.scheduledAt).toISOString().slice(0, 16));
                          setIsRecurring(item.isRecurring || false);
                          setRecurrenceIntervalDays(item.recurrenceIntervalDays || 1);
                          setHasEndDate(item.hasEndDate || false);
                          setRecurrenceEndDate(item.recurrenceEndDate ? new Date(item.recurrenceEndDate).toISOString().slice(0, 16) : '');
                          setEditingScheduleId(item.id);
                          setShowClearAfterSend(true);
                        }}
                        style={{ background: 'rgba(235, 215, 63, 0.1)', border: 'none', color: '#ebd73f', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Edit Campaign"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button"
                        onClick={async () => {
                          if (confirm('Are you sure you want to cancel this scheduled campaign?')) {
                            try {
                              const res = await fetch(`/api/admin/email/campaigns?id=${item.id}`, { method: 'DELETE' });
                              if (res.ok) fetchCampaigns();
                            } catch (err) {
                              console.error('Failed to delete campaign', err);
                            }
                          }
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Cancel Campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
