'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, Edit2, Trash2, ArrowUp, ArrowDown, Rocket, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import styles from '../admin.module.css';

const CATEGORIES = [
  'Sales & Psychology',
  'Pricing & Money',
  'Content & Attention',
  'Business & Growth',
  'Life & Focus',
  'Trust & Design',
  'Client Service',
  'Clear Thinking',
  'Daily Habits',
  'Personal Growth',
  'Relationships & Karma',
  'Brand Positioning',
  'Decisions & Speed',
  'Creative Craft'
];

export default function DailyTipsManager() {
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [dayNumber, setDayNumber] = useState(1);
  const [currentTip, setCurrentTip] = useState(null);
  const [launchDate, setLaunchDate] = useState('');
  const [hoursLeft, setHoursLeft] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formExplanation, setFormExplanation] = useState('');
  const [formFormula, setFormFormula] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/daily-tips');
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
        setDayNumber(data.dayNumber || 1);
        setCurrentTip(data.currentTip || null);
        setLaunchDate(data.launchDate || '');
        setHoursLeft(data.hoursLeft || 0);
        setMinutesLeft(data.minutesLeft || 0);
      }
    } catch (err) {
      console.error('Error fetching tips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTips();
  }, []);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingTip(null);
    setFormCategory(CATEGORIES[0]);
    setFormTitle('');
    setFormExplanation('');
    setFormFormula('');
    setShowModal(true);
  };

  const handleOpenEdit = (tip) => {
    setEditingTip(tip);
    setFormCategory(tip.category || CATEGORIES[0]);
    setFormTitle(tip.title || '');
    setFormExplanation(tip.explanation || '');
    setFormFormula(tip.formula || '');
    setShowModal(true);
  };

  const handleSaveTip = async (e) => {
    e.preventDefault();
    if (!formTitle.trim() || !formExplanation.trim() || !formFormula.trim()) {
      notify('Please fill out all fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const action = editingTip ? 'update_tip' : 'add_tip';
      const payload = {
        action,
        id: editingTip ? editingTip.id : undefined,
        category: formCategory,
        title: formTitle,
        explanation: formExplanation,
        formula: formFormula
      };
      const res = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips);
        setCurrentTip(data.currentTip);
        setShowModal(false);
        notify(editingTip ? 'Tip updated successfully!' : 'New tip published!');
      } else {
        notify('Failed to save tip', 'error');
      }
    } catch (err) {
      notify('Error saving tip', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTip = async (id) => {
    if (!confirm('Are you sure you want to delete this tip?')) return;
    try {
      const res = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_tip', id })
      });
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips);
        setCurrentTip(data.currentTip);
        notify('Tip deleted');
      } else {
        notify('Failed to delete tip', 'error');
      }
    } catch (err) {
      notify('Error deleting tip', 'error');
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tips.length) return;
    const reordered = [...tips];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    setTips(reordered);
    try {
      const res = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder_tips', tips: reordered })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentTip(data.currentTip);
        notify('Order updated');
      }
    } catch (err) {
      notify('Failed to save reorder', 'error');
      fetchTips(); // Revert on failure
    }
  };

  const handleResetLaunch = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/daily-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_launch' })
      });
      if (res.ok) {
        const data = await res.json();
        setDayNumber(data.dayNumber);
        setCurrentTip(data.currentTip);
        setLaunchDate(data.launchDate);
        setShowResetModal(false);
        notify('🚀 Day counter successfully reset to Day #1!');
      } else {
        notify('Failed to reset day counter', 'error');
      }
    } catch (err) {
      notify('Error resetting launch day', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className={styles.adminMain} style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: notification.type === 'error' ? '#e53e3e' : '#ebd73f',
          color: notification.type === 'error' ? '#fff' : '#000',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: "'Clash Display', sans-serif",
          fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
        }}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(235, 215, 63, 0.1)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              color: '#ebd73f',
              fontSize: '0.72rem',
              fontFamily: "'Panchang', sans-serif",
              fontWeight: 700,
              letterSpacing: '1px'
            }}>
              <Sparkles size={12} />
              LIVE ON HOMEPAGE
            </span>
          </div>
          <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '0.5px' }}>
            DAILY TIPS & <span style={{ color: '#ebd73f' }}>WISDOM</span>
          </h1>
          <p style={{ fontFamily: "'Clash Display', sans-serif", color: '#888', fontSize: '0.95rem', margin: 0, maxWidth: '600px' }}>
            Manage everyday formulas, write and publish new quotes, reorder presets, and reset the launch day counter.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontFamily: "'Panchang', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              transition: 'all 0.2s'
            }}
          >
            <Rocket size={15} color="#ebd73f" />
            RESTART DAY COUNTER (#1)
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '12px',
              background: '#ebd73f',
              border: 'none',
              color: '#000',
              fontFamily: "'Panchang', sans-serif",
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 20px rgba(235, 215, 63, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={16} strokeWidth={3} />
            WRITE NEW TIP
          </button>
        </div>
      </div>

      {/* Live Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#888', fontSize: '0.72rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
            CURRENT LIVE DAY
          </div>
          <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#ebd73f' }}>
            Day #{dayNumber}
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', fontFamily: "'Clash Display', sans-serif", marginTop: '4px' }}>
            {launchDate ? `Launched: ${new Date(launchDate).toLocaleDateString()}` : 'Default Launch Date'}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#888', fontSize: '0.72rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
            NEXT ROTATION IN
          </div>
          <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {hoursLeft}h {minutesLeft}m
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', fontFamily: "'Clash Display', sans-serif", marginTop: '4px' }}>
            Updates automatically at 00:00 UTC
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ color: '#888', fontSize: '0.72rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>
            TOTAL PRESETS IN POOL
          </div>
          <div style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
            {tips.length} Tips
          </div>
          <div style={{ color: '#666', fontSize: '0.78rem', fontFamily: "'Clash Display', sans-serif", marginTop: '4px' }}>
            Cycle repeats every {tips.length} days
          </div>
        </div>
      </div>

      {/* Live Featured Tip Preview */}
      {currentTip && (
        <div style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(235, 215, 63, 0.08) 0%, rgba(18, 18, 22, 0.95) 60%, rgba(12, 12, 14, 0.98) 100%)',
          border: '1px solid rgba(235, 215, 63, 0.3)',
          borderRadius: '20px',
          padding: '24px 28px',
          marginBottom: '36px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: '#ebd73f',
              color: '#000',
              fontFamily: "'Panchang', sans-serif",
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '1px'
            }}>
              ★ LIVE TODAY ON SITE (DAY #{dayNumber})
            </span>
            <span style={{ fontFamily: "'Clash Display', sans-serif", color: '#888', fontSize: '0.8rem' }}>
              Category: <strong style={{ color: '#fff' }}>{currentTip.category}</strong>
            </span>
          </div>
          <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            "{currentTip.title}"
          </h2>
          <p style={{ fontFamily: "'Clash Display', sans-serif", color: '#ccc', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 14px' }}>
            {currentTip.explanation}
          </p>
          <div style={{
            background: 'rgba(235, 215, 63, 0.08)',
            border: '1px solid rgba(235, 215, 63, 0.25)',
            borderRadius: '10px',
            padding: '10px 16px',
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.88rem',
            color: '#ebd73f',
            fontWeight: 600
          }}>
            ✦ The Formula: <span style={{ color: '#fff' }}>{currentTip.formula}</span>
          </div>
        </div>
      )}

      {/* Preset Quotes List Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          PRESET ROTATION QUEUE ({tips.length})
        </h2>
        <span style={{ fontFamily: "'Clash Display', sans-serif", color: '#888', fontSize: '0.8rem' }}>
          Use the arrows to rearrange which tip appears on which day
        </span>
      </div>

      {/* Tips List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tips.map((tip, index) => {
          const isLiveToday = currentTip && currentTip.id === tip.id;
          return (
            <div
              key={tip.id || index}
              style={{
                background: isLiveToday ? 'rgba(235, 215, 63, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: isLiveToday ? '1px solid rgba(235, 215, 63, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '280px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isLiveToday ? '#ebd73f' : 'rgba(255, 255, 255, 0.06)',
                  color: isLiveToday ? '#000' : '#888',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ebd73f',
                      fontFamily: "'Clash Display', sans-serif",
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {tip.category}
                    </span>
                    {isLiveToday && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(235, 215, 63, 0.2)',
                        color: '#ebd73f',
                        fontFamily: "'Panchang', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 800
                      }}>
                        ACTIVE TODAY
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                    "{tip.title}"
                  </h3>
                  <p style={{ fontFamily: "'Clash Display', sans-serif", color: '#aaa', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 8px' }}>
                    {tip.explanation}
                  </p>
                  <div style={{ fontFamily: "'Clash Display', sans-serif", fontSize: '0.8rem', color: '#ebd73f', fontWeight: 600 }}>
                    ✦ The Formula: <span style={{ color: '#eee' }}>{tip.formula}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  title="Move Up"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: index === 0 ? '#444' : '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ArrowUp size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === tips.length - 1}
                  title="Move Down"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: index === tips.length - 1 ? '#444' : '#fff',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: index === tips.length - 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ArrowDown size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(tip)}
                  title="Edit Tip"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ebd73f',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Edit2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTip(tip.id)}
                  title="Delete Tip"
                  style={{
                    background: 'rgba(235, 87, 87, 0.1)',
                    border: '1px solid rgba(235, 87, 87, 0.25)',
                    color: '#ff5c5c',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#121216',
            border: '1px solid rgba(235, 215, 63, 0.3)',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              {editingTip ? 'EDIT DAILY TIP' : 'WRITE & PUBLISH NEW TIP'}
            </h2>
            <p style={{ fontFamily: "'Clash Display', sans-serif", color: '#888', fontSize: '0.85rem', margin: '0 0 24px' }}>
              Write clear, practical formulas in plain, easy language.
            </p>

            <form onSubmit={handleSaveTip} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, marginBottom: '6px' }}>
                  CATEGORY
                </label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.9rem'
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ background: '#18181e', color: '#fff' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, marginBottom: '6px' }}>
                  TIP HEADLINE
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Don't sell to people. Make them want to buy."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, marginBottom: '6px' }}>
                  THE REALITY / EXPLANATION (EASY WORDS, 2-3 SENTENCES)
                </label>
                <textarea
                  rows={4}
                  value={formExplanation}
                  onChange={e => setFormExplanation(e.target.value)}
                  placeholder="Explain why this happens in real life, speaking casually and clearly..."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#fff',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', fontFamily: "'Panchang', sans-serif", fontWeight: 700, marginBottom: '6px' }}>
                  ✦ THE FORMULA (THE 1-SENTENCE ACTIONABLE RULE)
                </label>
                <input
                  type="text"
                  value={formFormula}
                  onChange={e => setFormFormula(e.target.value)}
                  placeholder="e.g. Stop pitching yourself. Show your work so well that reaching out feels like their own idea."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(235, 215, 63, 0.3)',
                    color: '#ebd73f',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    color: '#aaa',
                    fontFamily: "'Clash Display', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    background: '#ebd73f',
                    border: 'none',
                    color: '#000',
                    fontFamily: "'Panchang', sans-serif",
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'SAVING...' : editingTip ? 'UPDATE TIP' : 'PUBLISH TIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Launch Day Reset Confirmation Modal */}
      {showResetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#141418',
            border: '1px solid rgba(235, 215, 63, 0.4)',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(235, 215, 63, 0.15)',
              color: '#ebd73f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px'
            }}>
              <Rocket size={28} />
            </div>

            <h2 style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
              RESTART DAY COUNTER TO DAY #1?
            </h2>

            <p style={{ fontFamily: "'Clash Display', sans-serif", color: '#aaa', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 24px' }}>
              This will set today as the official <strong>Launch Day</strong>. The day counter on the website will restart from <strong>Day #1</strong>, and today will show <strong>Tip #1</strong> from your presets queue.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ccc',
                  fontFamily: "'Clash Display', sans-serif",
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResetLaunch}
                disabled={resetting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: '#ebd73f',
                  border: 'none',
                  color: '#000',
                  fontFamily: "'Panchang', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(235, 215, 63, 0.3)'
                }}
              >
                {resetting ? 'RESTARTING...' : 'YES, START FROM DAY #1'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
