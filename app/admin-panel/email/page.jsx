'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles, LayoutTemplate, PenTool } from 'lucide-react';
import styles from '../admin.module.css';
import gsap from 'gsap';

export default function EmailCampaignsPage() {
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [specificEmail, setSpecificEmail] = useState('');
  const [templateType, setTemplateType] = useState('announcement');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const containerRef = useRef(null);

  // Initial enter animation
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children, 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

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

  const handleAiGenerate = () => {
    if (generating) return;
    setGenerating(true);
    
    // Premium placeholder text to simulate AI generating copy
    const aiDrafts = {
      announcement: {
        subject: "Introducing the Next Era of Dripp Media ✨",
        title: "A New Chapter Begins",
        body: "We are thrilled to unveil our latest features designed exclusively for our elite members.\n\nExperience unprecedented speed, enhanced analytics, and a community built for winners. Dive in today and see what the hype is all about."
      },
      promo: {
        subject: "Unlock Premium Access: 50% Off 🚀",
        title: "Exclusive Partner Offer",
        body: "Because you're one of our top users, we're giving you an exclusive opportunity to upgrade your experience.\n\nClaim this limited-time offer to supercharge your workflow and dominate your goals."
      },
      newsletter: {
        subject: "Your Weekly Dripp Media Digest 🗞️",
        title: "What's Trending This Week",
        body: "Stay ahead of the curve. This week we explore the latest trends in digital strategy, highlight top creators, and share actionable tips to scale your brand.\n\nRead the full breakdown inside."
      }
    };

    const draft = aiDrafts[templateType];
    
    // Simulated typing effect
    setSubject('');
    setTitle('');
    setBody('');
    
    let charIndex = 0;
    const fullText = draft.body;
    
    setSubject(draft.subject);
    setTitle(draft.title);

    const typeInterval = setInterval(() => {
      setBody(prev => prev + fullText.charAt(charIndex));
      charIndex++;
      if (charIndex >= fullText.length) {
        clearInterval(typeInterval);
        setGenerating(false);
      }
    }, 15);
  };

  return (
    <div ref={containerRef} style={{ paddingBottom: '4rem' }}>
      <div className={styles.header} style={{ marginBottom: '3rem' }}>
        <h1 className={styles.title} style={{ fontSize: '2.5rem', background: 'linear-gradient(90deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Email Studio
        </h1>
        <p className={styles.subtitle}>Craft and launch premium email experiences to your audience.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Main Form */}
        <div className={styles.card} style={{ 
          background: 'rgba(255,255,255,0.02)', 
          backdropFilter: 'blur(12px)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          padding: '2.5rem'
        }}>
          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Target Audience */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '600', color: '#e4e4e7' }}>
                <Users size={18} /> Target Audience
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsBroadcast(false)}
                  style={{
                    flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    backgroundColor: !isBroadcast ? '#ffffff' : 'rgba(255,255,255,0.05)',
                    color: !isBroadcast ? '#000000' : '#a1a1aa',
                    border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Mail size={18} />
                  Specific User
                </button>
                <button
                  type="button"
                  onClick={() => setIsBroadcast(true)}
                  style={{
                    flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    backgroundColor: isBroadcast ? '#ef4444' : 'rgba(255,255,255,0.05)',
                    color: isBroadcast ? '#ffffff' : '#a1a1aa',
                    border: 'none', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Users size={18} />
                  Broadcast to All
                </button>
              </div>
              {isBroadcast && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Proceed with caution</strong>
                    This will dispatch the email to every registered user. Ensure your copy is perfect before sending.
                  </div>
                </div>
              )}
            </div>

            {!isBroadcast && (
              <div>
                <label className={styles.label}>Recipient Email</label>
                <input
                  type="email"
                  required
                  className={styles.input}
                  placeholder="user@example.com"
                  value={specificEmail}
                  onChange={(e) => setSpecificEmail(e.target.value)}
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                />
              </div>
            )}

            {/* Content Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: '#e4e4e7', margin: 0 }}>
                  <PenTool size={18} /> Message Content
                </label>
                
                {/* AI Generate Button */}
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={generating}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                    border: 'none',
                    borderRadius: '2rem',
                    padding: '0.5rem 1rem',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.7 : 1,
                    transition: 'transform 0.2s',
                    boxShadow: '0 4px 14px rgba(168, 85, 247, 0.4)'
                  }}
                  onMouseOver={(e) => { if(!generating) e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseOut={(e) => { if(!generating) e.currentTarget.style.transform = 'scale(1)' }}
                >
                  <Sparkles size={16} className={generating ? "animate-spin" : ""} />
                  {generating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <label className={styles.label} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Subject</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="Subject line for the inbox"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  />
                </div>

                <div>
                  <label className={styles.label} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Template Title</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="Large header inside the email"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  />
                </div>

                <div>
                  <label className={styles.label} style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message Body</label>
                  <textarea
                    required
                    className={styles.input}
                    placeholder="Type your message here..."
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    style={{ resize: 'vertical', backgroundColor: 'rgba(0,0,0,0.5)', lineHeight: '1.6' }}
                  />
                </div>
              </div>
            </div>

            {/* Status Messages */}
            {status.msg && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                color: status.type === 'error' ? '#ef4444' : '#22c55e',
                border: \`1px solid \${status.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}\`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
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
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '0.5rem', 
                fontSize: '1.1rem',
                backgroundColor: '#fff',
                color: '#000',
                border: 'none',
                marginTop: '1rem'
              }}
            >
              {loading ? (
                'Dispatching Campaign...'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Theme Selector */}
          <div className={styles.card} style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: '600', color: '#e4e4e7' }}>
              <LayoutTemplate size={18} /> Visual Theme
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setTemplateType('announcement')}
                style={{ 
                  padding: '1rem', textAlign: 'left', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: templateType === 'announcement' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: templateType === 'announcement' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Announcement</div>
                <div style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Sleek, dark aesthetic. Perfect for major updates.</div>
              </button>
              <button 
                type="button"
                onClick={() => setTemplateType('promo')}
                style={{ 
                  padding: '1rem', textAlign: 'left', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: templateType === 'promo' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                  border: templateType === 'promo' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#4ade80' }}>Promo Offer</div>
                <div style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Vibrant green accents designed to drive conversions.</div>
              </button>
              <button 
                type="button"
                onClick={() => setTemplateType('newsletter')}
                style={{ 
                  padding: '1rem', textAlign: 'left', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: templateType === 'newsletter' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: templateType === 'newsletter' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                  color: '#fff'
                }}
              >
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#60a5fa' }}>Newsletter</div>
                <div style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Clean blue aesthetics for recurring content updates.</div>
              </button>
            </div>
          </div>

          {/* AI Info */}
          <div className={styles.card} style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} /> AI Copywriter
            </h4>
            <p style={{ margin: 0, color: '#a1a1aa', lineHeight: '1.6', fontSize: '0.875rem' }}>
              The AI magic button instantly generates premium, high-converting copy tailored to your selected theme. 
              <br/><br/>
              <em>(Note: Currently utilizing simulated drafts. Connect your OpenAI API key to enable dynamic, prompt-driven generation.)</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
