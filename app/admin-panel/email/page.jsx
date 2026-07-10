'use client';

import { useState } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import styles from '../admin.module.css';

export default function EmailCampaignsPage() {
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [specificEmail, setSpecificEmail] = useState('');
  const [templateType, setTemplateType] = useState('announcement');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

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

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Email Campaigns</h1>
        <p className={styles.subtitle}>Send branded emails to your users directly from the dashboard.</p>
      </div>

      <div className={styles.card} style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Target Audience */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Target Audience</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setIsBroadcast(false)}
                className={!isBroadcast ? styles.btnPrimary : styles.btnSecondary}
                style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Mail size={18} />
                Specific User
              </button>
              <button
                type="button"
                onClick={() => setIsBroadcast(true)}
                className={isBroadcast ? styles.btnDanger : styles.btnSecondary}
                style={{ flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Users size={18} />
                Broadcast to All
              </button>
            </div>
            {isBroadcast && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <AlertCircle size={16} />
                Warning: This will send an email to every registered user in your database.
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
              />
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label className={styles.label}>Email Template</label>
            <select 
              className={styles.input} 
              value={templateType} 
              onChange={(e) => setTemplateType(e.target.value)}
            >
              <option value="announcement">Announcement (Dark & Sleek)</option>
              <option value="promo">Promo Code (Green Accent)</option>
              <option value="newsletter">Newsletter (Blue Accent)</option>
            </select>
          </div>

          {/* Email Content */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <label className={styles.label}>Email Subject (Seen in Inbox)</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Exciting news from DrippMedia!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ marginBottom: '1.5rem' }}
            />

            <label className={styles.label}>Template Title (Main Header inside Email)</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Big Update 🎉"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: '1.5rem' }}
            />

            <label className={styles.label}>Message Body</label>
            <textarea
              required
              className={styles.input}
              placeholder="Type your message here... Line breaks will be preserved."
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Status Messages */}
          {status.msg && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
              color: status.type === 'error' ? '#ef4444' : '#22c55e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              {status.msg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={styles.btnPrimary} 
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }}
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send size={18} />
                {isBroadcast ? 'Send Broadcast to All Users' : 'Send Email'}
              </>
            )}
          </button>
        </form>
      </div>

      <div className={styles.card} style={{ maxWidth: '800px', marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ color: '#3b82f6', marginTop: '0.25rem' }}><Info size={24} /></div>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>How it works</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Emails are sent via Resend using your verified <strong>hello@drippmedia.com</strong> domain. 
            When broadcasting to all users, emails are processed in batches to ensure maximum deliverability and avoid hitting rate limits.
            Please test your campaigns on a specific email before broadcasting.
          </p>
        </div>
      </div>
    </div>
  );
}
