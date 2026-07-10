'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles, LayoutTemplate, PenTool, RefreshCw } from 'lucide-react';
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
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBroadcast,
          specificEmail,
          subject,
          title,
          body,
          templateType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setStatus({ type: 'success', msg: data.message });
      // Reset form if successful
      if (!isBroadcast) setSpecificEmail('');
      setSubject('');
      setTitle('');
      setBody('');
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ebd73f', margin: 0 }}>
                  <PenTool size={18} /> Message Content
                </label>
                
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
                  <Sparkles size={16} className={generating ? "animate-spin" : ""} />
                  {generating ? 'Generating...' : 'Magic Generate'}
                </button>
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
                      <Sparkles size={16} className={generatingMode === 'subject' ? "animate-spin" : ""} />
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
                      <Sparkles size={16} className={generatingMode === 'title' ? "animate-spin" : ""} />
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
                      <Sparkles size={16} className={generatingMode === 'body' ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>
              </div>
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

            <button 
              type="submit" 
              disabled={loading || generating}
              className={styles.btnPrimary} 
              style={{ 
                padding: '1.25rem', 
                fontSize: '1.1rem',
                marginTop: '1rem',
                width: '100%'
              }}
            >
              {loading ? (
                'Dispatching...'
              ) : (
                <>
                  <Send size={20} />
                  {isBroadcast ? 'Launch Broadcast Sequence' : 'Dispatch Test Email'}
                </>
              )}
            </button>
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
              <Sparkles size={18} /> AI Copywriter
            </h4>
            <p style={{ margin: 0, color: '#aaa', lineHeight: '1.6', fontSize: '0.875rem' }}>
              The magic button instantly generates premium, high-converting copy tailored to your selected theme. 
              <br/><br/>
              <em>(Note: Currently utilizing simulated drafts. Ready to be hooked into OpenAI.)</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
