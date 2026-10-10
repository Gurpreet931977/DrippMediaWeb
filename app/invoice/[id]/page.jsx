'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Lock, FileText, CheckCircle2, Globe, Mail, AtSign, Printer, ArrowLeft } from 'lucide-react';

export default function SharedInvoice() {
  const params = useParams();
  const [pin, setPin] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [quoteData, setQuoteData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dedicated refs for 4 PIN boxes
  const pin0Ref = useRef(null);
  const pin1Ref = useRef(null);
  const pin2Ref = useRef(null);
  const pin3Ref = useRef(null);
  const pinRefs = [pin0Ref, pin1Ref, pin2Ref, pin3Ref];

  const handlePinChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setPassword(newPin.join(''));
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const handlePinPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = text.split('');
    while (newPin.length < 4) newPin.push('');
    setPin(newPin);
    setPassword(newPin.join(''));
    pinRefs[Math.min(text.length, 3)].current?.focus();
    e.preventDefault();
  };

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      document.body.classList.add('loaded');
      document.body.style.opacity = '1';
    }

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const pwdParam = urlParams.get('pwd') || urlParams.get('pin');
      if (pwdParam && params?.id) {
        setPassword(pwdParam);
        const digits = pwdParam.slice(0, 4).split('');
        while (digits.length < 4) digits.push('');
        setPin(digits);

        setLoading(true);
        fetch(`/api/quote/${params.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwdParam })
        })
        .then(res => {
          if (res.ok) {
            return res.json().then(data => {
              setQuoteData(data.quote || null);
              setIsLocked(false);
            });
          } else {
            setError('Incorrect password or invoice not found.');
          }
        })
        .catch(() => setError('Unable to decrypt invoice. Please check your network and try again.'))
        .finally(() => setLoading(false));
      }
    }
  }, [params?.id]);

  const handleUnlock = async (e) => {
    e?.preventDefault();
    if (!params?.id) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/quote/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        const data = await res.json();
        setQuoteData(data.quote || null);
        setIsLocked(false);
      } else {
        setError('Incorrect PIN. Please check the code and try again.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div style={{ height: '100vh', background: '#050505', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ebd73f', fontFamily: "'Clash Display', sans-serif" }}>
        Loading secure invoice...
      </div>
    );
  }

  if (isLocked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#050505', color: '#ffffff', position: 'relative', overflow: 'hidden', padding: '20px' }}>
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.06) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.04) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

        <form onSubmit={handleUnlock} style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.02)', padding: 'clamp(35px, 6vw, 55px) clamp(20px, 5vw, 40px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.07)', borderTop: '2px solid #ebd73f', textAlign: 'center', maxWidth: '440px', width: '100%', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.85)' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '76px', height: '76px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.1)', marginBottom: '22px', boxShadow: '0 0 30px rgba(235, 215, 63, 0.25)' }}>
            <Lock size={36} color="#ebd73f" />
          </div>
          
          <h2 style={{ marginBottom: '8px', fontSize: 'clamp(1.5rem, 5vw, 1.85rem)', fontFamily: "'Panchang', sans-serif", letterSpacing: '0.02em', color: '#ffffff' }}>Secure Invoice</h2>
          <p style={{ color: '#888888', marginBottom: '32px', fontSize: 'clamp(0.85rem, 3vw, 0.92rem)', lineHeight: '1.6', fontFamily: "'Clash Display', sans-serif" }}>
            Enter the 4-digit PIN provided by Dripp Media to access your official invoice.
          </p>
          
          {/* PIN Input Boxes */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '22px' }}>
            {pin.map((digit, index) => (
              <div key={index} style={{
                width: 'clamp(56px, 14vw, 68px)',
                height: 'clamp(66px, 16vw, 78px)',
                background: focusedIndex === index ? 'rgba(235, 215, 63, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                border: `2px solid ${focusedIndex === index ? '#ebd73f' : (digit ? 'rgba(235, 215, 63, 0.55)' : 'rgba(255, 255, 255, 0.1)')}`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: focusedIndex === index ? '0 0 25px rgba(235, 215, 63, 0.25), inset 0 0 10px rgba(235, 215, 63, 0.1)' : (digit ? '0 0 15px rgba(235, 215, 63, 0.12)' : 'inset 0 2px 8px rgba(0,0,0,0.3)'),
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                transform: focusedIndex === index ? 'scale(1.04)' : 'scale(1)'
              }}>
                <input
                  ref={pinRefs[index]}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={handlePinPaste}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(-1)}
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    textAlign: 'center',
                    fontSize: 'clamp(1.7rem, 5vw, 2.3rem)',
                    fontWeight: '700',
                    color: '#ebd73f',
                    caretColor: '#ebd73f',
                    letterSpacing: '0',
                    fontFamily: "'Panchang', sans-serif"
                  }}
                />
                {(!digit && focusedIndex !== index) && (
                  <span style={{ position: 'absolute', width: '20px', height: '3px', background: 'rgba(255,255,255,0.18)', borderRadius: '3px', pointerEvents: 'none', transition: 'all 0.2s ease' }} />
                )}
              </div>
            ))}
          </div>

          {error && (
            <p style={{ color: '#ff5c5c', fontSize: '0.85rem', marginBottom: '20px', padding: '10px 14px', background: 'rgba(255, 92, 92, 0.08)', borderRadius: '10px', border: '1px solid rgba(255, 92, 92, 0.25)', fontFamily: "'Clash Display', sans-serif" }}>
              {error}
            </p>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
              width: '100%', 
              padding: '16px', 
              background: '#ebd73f', 
              color: '#09090b', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '0.96rem', 
              fontWeight: '700', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontFamily: "'Clash Display', sans-serif", 
              letterSpacing: '0.04em', 
              textTransform: 'uppercase', 
              boxShadow: '0 8px 24px -5px rgba(235, 215, 63, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
            onMouseEnter={(e) => { 
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'; 
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(235, 215, 63, 0.45)'; 
              }
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'translateY(0)'; 
              e.currentTarget.style.boxShadow = '0 8px 24px -5px rgba(235, 215, 63, 0.35)'; 
            }}
          >
            {loading ? 'Decrypting Invoice...' : 'View Invoice'}
          </button>
        </form>
      </div>
    );
  }

  // Safe Fallback if data is missing
  if (!quoteData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', fontFamily: "'Clash Display', sans-serif" }}>
        <p style={{ color: '#ebd73f', fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Panchang', sans-serif" }}>Invoice Data Unavailable</p>
        <p style={{ color: '#888888', maxWidth: '420px', marginBottom: '24px' }}>Unable to display this invoice record. Please verify the link or contact Dripp Media.</p>
        <button onClick={() => setIsLocked(true)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontFamily: "'Clash Display', sans-serif" }}>
          Re-enter PIN
        </button>
      </div>
    );
  }

  const isInvoice = quoteData.type === 'invoice';
  const details = isInvoice ? (quoteData.invoiceDetails || {}) : (quoteData.quoteDetails || {});
  const items = Array.isArray(quoteData.items) ? quoteData.items : [];
  const currency = details?.currency || '₹';
  const client = quoteData.clientDetails || {};
  const selectedBank = quoteData.selectedBank || null;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#ffffff', padding: 'clamp(20px, 5vw, 60px) clamp(15px, 4vw, 20px)', fontFamily: "'Clash Display', sans-serif", position: 'relative', overflowX: 'hidden' }}>
      {/* Background Ambient Glows */}
      <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: 'clamp(400px, 80vw, 800px)', height: 'clamp(400px, 80vw, 800px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-15%', left: '-10%', width: 'clamp(300px, 60vw, 600px)', height: 'clamp(300px, 60vw, 600px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <style>{`
        .invoice-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
        }
        .invoice-header {
          text-align: center;
          padding: clamp(24px, 6vw, 48px) 0;
          border-bottom: 1px solid rgba(235, 215, 63, 0.2);
          margin-bottom: 20px;
          position: relative;
        }
        .invoice-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .invoice-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 950px) {
          .invoice-grid {
            grid-template-columns: 1fr 1.35fr;
            align-items: flex-start;
            gap: 40px;
          }
          .invoice-header {
            grid-column: 1 / -1;
            padding: 36px 0;
          }
          .invoice-left {
            position: sticky;
            top: 40px;
          }
        }
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="invoice-grid">
        
        {/* Cover Header Section */}
        <div className="invoice-header">
          {/* Action buttons on desktop */}
          <div className="no-print" style={{ position: 'absolute', right: 0, top: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'rgba(235, 215, 63, 0.1)',
                border: '1px solid rgba(235, 215, 63, 0.35)',
                borderRadius: '10px',
                color: '#ebd73f',
                fontSize: '0.84rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: "'Clash Display', sans-serif",
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(235, 215, 63, 0.1)'}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>

          <h1 style={{ fontSize: 'clamp(2.4rem, 9vw, 3.8rem)', color: '#ebd73f', margin: '0 0 8px 0', letterSpacing: '-0.02em', fontWeight: '900', fontFamily: "'Panchang', sans-serif", textShadow: '0 0 25px rgba(235, 215, 63, 0.35)', wordBreak: 'break-word' }}>
            DRIPP MEDIA
          </h1>
          <p style={{ fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)', color: '#a1a1aa', margin: 0, textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '600' }}>
            {isInvoice ? 'TAX INVOICE' : 'Proposal & Investment Overview'}
          </p>
        </div>

        {/* LEFT PANEL */}
        <div className="invoice-left">
          {/* Client Details */}
          <div style={{ background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.07)', padding: 'clamp(20px, 5vw, 36px)', borderRadius: '22px', backdropFilter: 'blur(10px)', width: '100%', boxSizing: 'border-box' }}>
            <p style={{ fontSize: '0.75rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px', fontWeight: '600' }}>Billed To</p>
            <h2 style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', color: '#ffffff', margin: '0 0 8px 0', fontFamily: "'Panchang', sans-serif", wordBreak: 'break-word' }}>
              {client.brandName || client.name || 'Client'}
            </h2>
            {client.brandName && client.name && (
              <p style={{ fontSize: '0.98rem', color: '#cccccc', margin: '0 0 6px 0' }}>{client.name}</p>
            )}
            {client.email && (
              <p style={{ fontSize: '0.88rem', color: '#888888', margin: '0 0 6px 0', wordBreak: 'break-all' }}>{client.email}</p>
            )}
            {client.phone && (
              <p style={{ fontSize: '0.88rem', color: '#888888', margin: '0 0 6px 0' }}>{client.phone}</p>
            )}
            {client.gst && (
              <p style={{ fontSize: '0.86rem', color: '#ebd73f', margin: '4px 0 16px 0', fontWeight: '500' }}>GSTIN: {client.gst}</p>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px', textAlign: 'left', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                 <div style={{ flex: '1 1 auto' }}>
                    <p style={{ fontSize: '0.72rem', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice Date</p>
                    <p style={{ fontSize: '0.92rem', color: '#e4e4e7', margin: 0, fontWeight: '500' }}>{details?.date || client?.date || 'N/A'}</p>
                 </div>
                 {details?.dueDate && (
                   <div style={{ flex: '1 1 auto' }}>
                      <p style={{ fontSize: '0.72rem', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Due Date</p>
                      <p style={{ fontSize: '0.92rem', color: '#e4e4e7', margin: 0, fontWeight: '500' }}>{details.dueDate}</p>
                   </div>
                 )}
                 <div style={{ textAlign: 'right', flex: '1 1 auto' }}>
                    <p style={{ fontSize: '0.72rem', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice #</p>
                    <p style={{ fontSize: '0.95rem', color: '#ebd73f', margin: 0, fontWeight: '700' }}>{details?.number || '001'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Notes / Message Section */}
          {details?.notes && (
            <div style={{ background: 'rgba(235, 215, 63, 0.03)', padding: '24px', borderRadius: '20px', borderLeft: '3px solid #ebd73f', border: '1px solid rgba(235, 215, 63, 0.12)' }}>
              <p style={{ fontSize: '0.72rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: '600' }}>Notes</p>
              <p style={{ margin: 0, lineHeight: '1.6', color: '#d4d4d8', fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>{details.notes}</p>
            </div>
          )}
          
          {/* Bank / Payment Details Section */}
          {selectedBank && (
            <div style={{ background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.07)', padding: 'clamp(20px, 5vw, 36px)', borderRadius: '22px', backdropFilter: 'blur(10px)', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ fontSize: '0.75rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', fontWeight: '600' }}>Payment Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {selectedBank.details && !selectedBank.bankName ? (
                        <div style={{ color: '#ffffff', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {selectedBank.details}
                        </div>
                    ) : (
                        <>
                            {selectedBank.bankName && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>Bank Name</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.bankName}</p>
                                </div>
                            )}
                            {selectedBank.accountName && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>Beneficiary / Account Name</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.accountName}</p>
                                </div>
                            )}
                            {selectedBank.accountNumber && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>Account Number</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ebd73f', margin: 0, fontWeight: '700', letterSpacing: '0.05em' }}>{selectedBank.accountNumber}</p>
                                </div>
                            )}
                            {selectedBank.ifsc && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>IFSC / Routing</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.ifsc}</p>
                                </div>
                            )}
                            {selectedBank.swift && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>SWIFT Code</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.swift}</p>
                                </div>
                            )}
                            {selectedBank.upi && (
                                <div>
                                    <p style={{ fontSize: '0.72rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px 0' }}>UPI ID</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ebd73f', margin: 0, fontWeight: '600' }}>{selectedBank.upi}</p>
                                </div>
                            )}
                        </>
                    )}
                    
                    {selectedBank.qrCode && (
                        <div style={{ marginTop: '12px', textAlign: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <p style={{ fontSize: '0.72rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Scan to Pay with UPI</p>
                            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '14px', display: 'inline-block', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                <img src={selectedBank.qrCode} alt="Payment QR Code" style={{ width: '140px', height: '140px', objectFit: 'contain', display: 'block' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="invoice-right">
          {/* Services / Line Items Section */}
          <div>
            <h3 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', color: '#ebd73f', margin: '0 0 18px 0', fontFamily: "'Panchang', sans-serif", textAlign: 'left' }}>
              {isInvoice ? 'Billed Items' : 'Proposed Services'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, i) => {
                const qty = parseFloat(item.qty || 0);
                const rate = parseFloat(item.rate || 0);
                const rowTotal = qty * rate;
                return (
                  <div key={i} style={{ background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(235, 215, 63, 0.16)', borderRadius: '16px', padding: 'clamp(16px, 3vw, 22px)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ flex: '1 1 220px' }}>
                        <h4 style={{ fontSize: 'clamp(0.98rem, 3.5vw, 1.15rem)', color: '#ffffff', margin: '0 0 6px 0', fontFamily: "'Panchang', sans-serif" }}>
                          {item.desc || 'Service Item'}
                        </h4>
                        {item.details && (
                          <p style={{ fontSize: '0.88rem', color: '#a1a1aa', margin: '0 0 8px 0', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {item.details}
                          </p>
                        )}
                        <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>
                          Qty: {item.qty} &nbsp;|&nbsp; Rate: {currency}{rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                     </div>
                     <div style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: '700', color: '#ebd73f', textShadow: '0 0 10px rgba(235, 215, 63, 0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#71717a', fontSize: '0.9rem', fontWeight: 'normal' }}>=</span> 
                        {currency}{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Due Section */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ background: 'rgba(235, 215, 63, 0.05)', border: '1px solid rgba(235, 215, 63, 0.3)', borderRadius: '22px', padding: 'clamp(36px, 5vw, 50px) clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', width: '100%', boxSizing: 'border-box' }}>
                <p style={{ fontSize: '0.85rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0', textAlign: 'center', fontWeight: '600' }}>
                  {isInvoice ? 'Total Due' : 'Total Investment'}
                </p>
                
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', textShadow: '0 0 25px rgba(235, 215, 63, 0.45)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                    <span style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: '#ebd73f', fontWeight: '600' }}>{currency}</span>
                    <span style={{ fontSize: 'clamp(2.2rem, 7vw, 3.6rem)', color: '#ebd73f', fontWeight: '900', fontFamily: "'Panchang', sans-serif", letterSpacing: '-0.02em', wordBreak: 'break-word', textAlign: 'center' }}>
                      {parseFloat(quoteData.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '18px', width: '100%', maxWidth: '340px' }}>
                    <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 4px 0' }}>Thank you for your business.</p>
                    <p style={{ color: '#71717a', fontSize: '0.78rem', margin: 0 }}>Dripp Media | Creative & Digital Agency</p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="no-print" style={{ gridColumn: '1 / -1', marginTop: '30px', paddingTop: '36px', paddingBottom: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
            
            <div style={{ background: 'rgba(235, 215, 63, 0.05)', padding: '16px clamp(24px, 5vw, 48px)', borderRadius: '100px', border: '1px solid rgba(235, 215, 63, 0.2)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'clamp(16px, 4vw, 36px)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <a href="https://www.drippmedia.com" target="_blank" rel="noopener noreferrer" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Globe size={16} color="#ebd73f" /> www.drippmedia.com
                </a>
                <a href="mailto:gurpreet@drippmedia.com" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Mail size={16} color="#ebd73f" /> gurpreet@drippmedia.com
                </a>
                <a href="https://instagram.com/drippmedia_" target="_blank" rel="noopener noreferrer" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <AtSign size={16} color="#ebd73f" /> instagram.com/drippmedia_
                </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(90deg, rgba(235, 215, 63, 0) 0%, rgba(235, 215, 63, 0.3) 50%, rgba(235, 215, 63, 0) 100%)', width: '220px', height: '2px' }} />
              <p style={{ margin: 0, color: '#888888', fontSize: '0.82rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Founded by <span style={{ color: '#ebd73f', fontWeight: 'bold' }}>Gurpreet Singh</span></p>
            </div>
            
            <p style={{ fontSize: '0.74rem', color: '#52525b', margin: 0, letterSpacing: '1.5px' }}>© {new Date().getFullYear()} DRIPP MEDIA. ALL RIGHTS RESERVED.</p>
        </div>

      </div>
    </div>
  );
}
