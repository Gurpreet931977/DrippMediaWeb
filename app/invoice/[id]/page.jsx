'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  Lock, 
  FileText, 
  CheckCircle2, 
  Globe, 
  Mail, 
  AtSign, 
  Printer, 
  Image as ImageIcon, 
  Loader2, 
  Copy, 
  Check, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import gsap from 'gsap';

// Safe module resolution supporting both ES default and CJS exports
const safeQRCode = (QRCode && (QRCode.toCanvas || QRCode.toDataURL)) ? QRCode : (QRCode?.default || QRCode);
const safeHtml2Canvas = html2canvas?.default || html2canvas;
const safeJsPDF = jsPDF?.default || jsPDF;

// Expose modules on global window immediately so any automated test, CDP script, or browser evaluation has access
if (typeof window !== 'undefined') {
  window.QRCode = safeQRCode;
  window.html2canvas = safeHtml2Canvas;
  window.jsPDF = safeJsPDF;
}

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const invoiceDocRef = useRef(null);
  const qrCanvasRef = useRef(null);
  const cursorRef = useRef(null);

  // Dedicated refs for 4 PIN boxes
  const pin0Ref = useRef(null);
  const pin1Ref = useRef(null);
  const pin2Ref = useRef(null);
  const pin3Ref = useRef(null);
  const pinRefs = [pin0Ref, pin1Ref, pin2Ref, pin3Ref];

  // Helper to cleanly separate integer rupees from grey paisa (.00)
  const formatCurrencyParts = (amount) => {
    const num = parseFloat(amount || 0);
    const formatted = num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const parts = formatted.split('.');
    return {
      whole: parts[0] || '0',
      decimal: parts[1] || '00'
    };
  };

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

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Custom Cursor Movement & Interaction
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const isTouch = window.matchMedia && (
      window.matchMedia('(pointer: coarse)').matches || 
      window.matchMedia('(hover: none)').matches
    );
    if (isTouch) return;

    const cursor = cursorRef.current || document.getElementById('invoice-custom-cursor');
    if (!cursor) return;

    gsap.set(cursor, { xPercent: -50, yPercent: -50, opacity: 0 });
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.12, ease: "power2.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.12, ease: "power2.out" });

    let isVisible = false;

    const onMouseMove = (e) => {
      if (!isVisible) {
        gsap.to(cursor, { opacity: 1, duration: 0.2 });
        isVisible = true;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const onMouseOver = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest('button, a, input, [role="button"], .copy-action-btn, .interactive-cell')) {
        cursor.classList.add('active');
      }
    };

    const onMouseOut = (e) => {
      const target = e.target;
      if (!target || !target.closest) return;
      if (target.closest('button, a, input, [role="button"], .copy-action-btn, .interactive-cell')) {
        cursor.classList.remove('active');
      }
    };

    const onMouseLeave = () => {
      gsap.to(cursor, { opacity: 0, duration: 0.2 });
      isVisible = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [mounted, isLocked]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      window.QRCode = safeQRCode;
      window.html2canvas = safeHtml2Canvas;
      window.jsPDF = safeJsPDF;
    }
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

  // Dedicated renderer for in-memory & live DOM QR Canvas
  const renderQrCanvas = useCallback(() => {
    const liveCvs = qrCanvasRef.current || (typeof document !== 'undefined' ? document.getElementById('invoice-qr-canvas') : null);
    if (!liveCvs) return;

    const bank = quoteData?.selectedBank || (quoteData?.type === 'invoice' ? {
      bankName: 'HDFC Bank',
      accountName: 'Dripp Media',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      upi: 'drippmedia@okhdfcbank'
    } : null);

    if (!bank) return;

    if (bank.qrCode && bank.qrCode.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        const ctx = liveCvs.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, liveCvs.width, liveCvs.height);
          ctx.drawImage(img, 0, 0, liveCvs.width, liveCvs.height);
        }
      };
      img.src = bank.qrCode;
    } else if (bank.upi) {
      const upiString = bank.upi.includes('://') 
        ? bank.upi 
        : `upi://pay?pa=${bank.upi}&pn=Dripp%20Media&cu=INR`;
      const qrRenderer = safeQRCode || (typeof window !== 'undefined' ? window.QRCode : null);
      if (qrRenderer && qrRenderer.toCanvas) {
        qrRenderer.toCanvas(liveCvs, upiString, { 
          margin: 1, 
          width: 280,
          color: { dark: '#000000', light: '#ffffff' } 
        }).catch(err => console.error('Canvas QR render error:', err));
      }
    }
  }, [quoteData]);

  // Automatically render QR canvas and generate high-res data URL
  useEffect(() => {
    renderQrCanvas();

    const bank = quoteData?.selectedBank || (quoteData?.type === 'invoice' ? {
      bankName: 'HDFC Bank',
      accountName: 'Dripp Media',
      accountNumber: '50200012345678',
      ifsc: 'HDFC0001234',
      upi: 'drippmedia@okhdfcbank'
    } : null);

    if (bank) {
      if (bank.qrCode && bank.qrCode.startsWith('data:image')) {
        setQrDataUrl(bank.qrCode);
      } else if (bank.upi) {
        const upiString = bank.upi.includes('://') 
          ? bank.upi 
          : `upi://pay?pa=${bank.upi}&pn=Dripp%20Media&cu=INR`;
        const qrRenderer = safeQRCode || (typeof window !== 'undefined' ? window.QRCode : null);
        if (qrRenderer && qrRenderer.toDataURL) {
          qrRenderer.toDataURL(upiString, { 
            margin: 1, 
            width: 320,
            color: { dark: '#000000', light: '#ffffff' } 
          })
            .then(url => setQrDataUrl(url))
            .catch(err => {
              console.error('QR generation error:', err);
              if (bank.qrCode) setQrDataUrl(bank.qrCode);
            });
        } else if (bank.qrCode) {
          setQrDataUrl(bank.qrCode);
        }
      } else if (bank.qrCode) {
        setQrDataUrl(bank.qrCode);
      }
    }
  }, [quoteData, renderQrCanvas]);

  const handleDownloadPdf = async () => {
    if (!invoiceDocRef.current || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setDownloadSuccess(null);
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      const element = invoiceDocRef.current;
      let qrCoords = null;
      const h2c = safeHtml2Canvas || (typeof window !== 'undefined' ? window.html2canvas : null);
      if (!h2c) throw new Error('html2canvas is not available');
      const canvas = await h2c(element, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedGrid = clonedDoc.querySelector('.invoice-grid');
          if (clonedGrid) {
            clonedGrid.style.width = '1200px';
            clonedGrid.style.maxWidth = '1200px';
            clonedGrid.style.padding = '36px';
            clonedGrid.style.background = '#050505';
            clonedGrid.style.borderRadius = '24px';
            clonedGrid.style.display = 'grid';
            clonedGrid.style.gridTemplateColumns = '1fr 1.35fr';
            clonedGrid.style.gap = '40px';
          }
          const clonedLeft = clonedDoc.querySelector('.invoice-left');
          if (clonedLeft) clonedLeft.style.display = 'flex';
          const clonedRight = clonedDoc.querySelector('.invoice-right');
          if (clonedRight) clonedRight.style.display = 'flex';
          const clonedCursor = clonedDoc.getElementById('invoice-custom-cursor');
          if (clonedCursor) clonedCursor.remove();

          // Sync live canvas bitmap to cloned canvas
          const liveQr = qrCanvasRef.current || document.getElementById('invoice-qr-canvas');
          const clonedQrCvs = clonedDoc.getElementById('invoice-qr-canvas');
          if (liveQr && clonedQrCvs) {
            try {
              clonedQrCvs.width = liveQr.width;
              clonedQrCvs.height = liveQr.height;
              const clCtx = clonedQrCvs.getContext('2d');
              clCtx.drawImage(liveQr, 0, 0);
            } catch (e) {
              console.warn('Canvas sync error in clone:', e);
            }
          }

          // Calculate exact position of QR code relative to invoice-grid
          const clonedBox = clonedDoc.querySelector('.invoice-qr-box');
          if (clonedBox && clonedGrid) {
            const boxRect = clonedBox.getBoundingClientRect();
            const gridRect = clonedGrid.getBoundingClientRect();
            const pad = 12;
            qrCoords = {
              x: (boxRect.left - gridRect.left) + pad,
              y: (boxRect.top - gridRect.top) + pad,
              w: Math.max(120, boxRect.width - (pad * 2)),
              h: Math.max(120, boxRect.height - (pad * 2)),
              gridW: gridRect.width || 1200
            };
          } else if (clonedQrCvs && clonedGrid) {
            const targetRect = clonedQrCvs.getBoundingClientRect();
            const gridRect = clonedGrid.getBoundingClientRect();
            qrCoords = {
              x: targetRect.left - gridRect.left,
              y: targetRect.top - gridRect.top,
              w: targetRect.width || 140,
              h: targetRect.height || 140,
              gridW: gridRect.width || 1200
            };
          }
        }
      });

      // Post-Render Direct Canvas Stamping: 100% guarantee QR code is drawn onto output canvas
      if (qrCoords) {
        try {
          let sourceCanvas = qrCanvasRef.current || document.getElementById('invoice-qr-canvas');
          if (!sourceCanvas) {
            sourceCanvas = document.createElement('canvas');
            const upiStr = quoteData?.selectedBank?.upi?.includes('://')
              ? quoteData.selectedBank.upi
              : `upi://pay?pa=${quoteData?.selectedBank?.upi || 'drippmedia@okhdfcbank'}&pn=Dripp%20Media&cu=INR`;
            const qrRenderer = safeQRCode || (typeof window !== 'undefined' ? window.QRCode : null);
            if (qrRenderer && qrRenderer.toCanvas) {
              await qrRenderer.toCanvas(sourceCanvas, upiStr, {
                width: 320,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' }
              });
            }
          }

          if (sourceCanvas && sourceCanvas.width > 0) {
            const scale = canvas.width / (qrCoords.gridW || 1200);
            const ctx = canvas.getContext('2d');
            ctx.resetTransform();
            const destX = Math.round(qrCoords.x * scale);
            const destY = Math.round(qrCoords.y * scale);
            const destW = Math.round(qrCoords.w * scale);
            const destH = Math.round(qrCoords.h * scale);
            
            // Clean white background first
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(destX, destY, destW, destH);
            // Draw QR code with crisp pixels directly from active rasterized canvas
            ctx.drawImage(sourceCanvas, destX, destY, destW, destH);
          }
        } catch (stampErr) {
          console.warn('Direct QR stamping error in PDF:', stampErr);
        }
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth, imgHeight]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      const invNum = quoteData?.invoiceDetails?.number || quoteData?.quoteDetails?.number || 'INV';
      const brandStr = quoteData?.clientDetails?.brandName 
        ? `_${quoteData.clientDetails.brandName.replace(/\s+/g, '_')}` 
        : (quoteData?.clientDetails?.name ? `_${quoteData.clientDetails.name.replace(/\s+/g, '_')}` : '');
      pdf.save(`Dripp_Media_Invoice${brandStr}_${invNum}.pdf`);
      setDownloadSuccess('pdf');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!invoiceDocRef.current || isDownloadingImage) return;
    setIsDownloadingImage(true);
    setDownloadSuccess(null);
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      const element = invoiceDocRef.current;
      let qrCoords = null;
      const h2c = safeHtml2Canvas || (typeof window !== 'undefined' ? window.html2canvas : null);
      if (!h2c) throw new Error('html2canvas is not available');
      const canvas = await h2c(element, {
        scale: 2,
        backgroundColor: '#050505',
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedGrid = clonedDoc.querySelector('.invoice-grid');
          if (clonedGrid) {
            clonedGrid.style.width = '1200px';
            clonedGrid.style.maxWidth = '1200px';
            clonedGrid.style.padding = '36px';
            clonedGrid.style.background = '#050505';
            clonedGrid.style.borderRadius = '24px';
            clonedGrid.style.display = 'grid';
            clonedGrid.style.gridTemplateColumns = '1fr 1.35fr';
            clonedGrid.style.gap = '40px';
          }
          const clonedLeft = clonedDoc.querySelector('.invoice-left');
          if (clonedLeft) clonedLeft.style.display = 'flex';
          const clonedRight = clonedDoc.querySelector('.invoice-right');
          if (clonedRight) clonedRight.style.display = 'flex';
          const clonedCursor = clonedDoc.getElementById('invoice-custom-cursor');
          if (clonedCursor) clonedCursor.remove();

          // Sync live canvas bitmap to cloned canvas
          const liveQr = qrCanvasRef.current || document.getElementById('invoice-qr-canvas');
          const clonedQrCvs = clonedDoc.getElementById('invoice-qr-canvas');
          if (liveQr && clonedQrCvs) {
            try {
              clonedQrCvs.width = liveQr.width;
              clonedQrCvs.height = liveQr.height;
              const clCtx = clonedQrCvs.getContext('2d');
              clCtx.drawImage(liveQr, 0, 0);
            } catch (e) {
              console.warn('Canvas sync error in clone:', e);
            }
          }

          // Calculate exact position of QR code relative to invoice-grid
          const clonedBox = clonedDoc.querySelector('.invoice-qr-box');
          if (clonedBox && clonedGrid) {
            const boxRect = clonedBox.getBoundingClientRect();
            const gridRect = clonedGrid.getBoundingClientRect();
            const pad = 12;
            qrCoords = {
              x: (boxRect.left - gridRect.left) + pad,
              y: (boxRect.top - gridRect.top) + pad,
              w: Math.max(120, boxRect.width - (pad * 2)),
              h: Math.max(120, boxRect.height - (pad * 2)),
              gridW: gridRect.width || 1200
            };
          } else if (clonedQrCvs && clonedGrid) {
            const targetRect = clonedQrCvs.getBoundingClientRect();
            const gridRect = clonedGrid.getBoundingClientRect();
            qrCoords = {
              x: targetRect.left - gridRect.left,
              y: targetRect.top - gridRect.top,
              w: targetRect.width || 140,
              h: targetRect.height || 140,
              gridW: gridRect.width || 1200
            };
          }
        }
      });

      // Post-Render Direct Canvas Stamping: 100% guarantee QR code is drawn onto output canvas
      if (qrCoords) {
        try {
          let sourceCanvas = qrCanvasRef.current || document.getElementById('invoice-qr-canvas');
          if (!sourceCanvas) {
            sourceCanvas = document.createElement('canvas');
            const upiStr = quoteData?.selectedBank?.upi?.includes('://')
              ? quoteData.selectedBank.upi
              : `upi://pay?pa=${quoteData?.selectedBank?.upi || 'drippmedia@okhdfcbank'}&pn=Dripp%20Media&cu=INR`;
            const qrRenderer = safeQRCode || (typeof window !== 'undefined' ? window.QRCode : null);
            if (qrRenderer && qrRenderer.toCanvas) {
              await qrRenderer.toCanvas(sourceCanvas, upiStr, {
                width: 320,
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' }
              });
            }
          }

          if (sourceCanvas && sourceCanvas.width > 0) {
            const scale = canvas.width / (qrCoords.gridW || 1200);
            const ctx = canvas.getContext('2d');
            ctx.resetTransform();
            const destX = Math.round(qrCoords.x * scale);
            const destY = Math.round(qrCoords.y * scale);
            const destW = Math.round(qrCoords.w * scale);
            const destH = Math.round(qrCoords.h * scale);
            
            // Clean white background first
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(destX, destY, destW, destH);
            // Draw QR code with crisp pixels directly from active rasterized canvas
            ctx.drawImage(sourceCanvas, destX, destY, destW, destH);
          }
        } catch (stampErr) {
          console.warn('Direct QR stamping error in Image:', stampErr);
        }
      }

      const imgData = canvas.toDataURL('image/png');
      const invNum = quoteData?.invoiceDetails?.number || quoteData?.quoteDetails?.number || 'INV';
      const brandStr = quoteData?.clientDetails?.brandName 
        ? `_${quoteData.clientDetails.brandName.replace(/\s+/g, '_')}` 
        : (quoteData?.clientDetails?.name ? `_${quoteData.clientDetails.name.replace(/\s+/g, '_')}` : '');
      const link = document.createElement('a');
      link.download = `Dripp_Media_Invoice${brandStr}_${invNum}.png`;
      link.href = imgData;
      link.click();
      setDownloadSuccess('image');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Error generating image:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  if (!mounted) {
    return (
      <div style={{ height: '100vh', background: '#050505', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#ebd73f', fontFamily: "'Clash Display', sans-serif" }}>
        Loading secure invoice...
      </div>
    );
  }

  // LOCKED STATE: Secure PIN Screen
  if (isLocked) {
    return (
      <div className="invoice-page-wrap" style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: '#050505', color: '#ffffff', position: 'relative', overflow: 'visible', padding: '20px', fontFamily: "'Clash Display', sans-serif" }}>
        {/* Custom Kinetic Cursor */}
        <div id="invoice-custom-cursor" ref={cursorRef} className="cursor" />

        {/* Ambient Glows Layer - Clipped within container */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.06) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.04) 0%, rgba(5, 5, 5, 0) 70%)', borderRadius: '50%' }} />
        </div>

        <form onSubmit={handleUnlock} style={{ position: 'relative', zIndex: 1, background: 'rgba(255, 255, 255, 0.02)', padding: 'clamp(32px, 6vw, 55px) clamp(20px, 5vw, 40px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.07)', borderTop: '2px solid #ebd73f', textAlign: 'center', maxWidth: '440px', width: '100%', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.85)' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(235, 215, 63, 0.1)', marginBottom: '20px', boxShadow: '0 0 30px rgba(235, 215, 63, 0.25)' }}>
            <Lock size={34} color="#ebd73f" />
          </div>
          
          <h2 style={{ marginBottom: '8px', fontSize: 'clamp(1.4rem, 5vw, 1.85rem)', fontFamily: "'Panchang', sans-serif", letterSpacing: '0.02em', color: '#ffffff' }}>Secure Invoice</h2>
          <p style={{ color: '#888888', marginBottom: '28px', fontSize: 'clamp(0.85rem, 3vw, 0.92rem)', lineHeight: '1.6', fontFamily: "'Clash Display', sans-serif" }}>
            Enter the 4-digit PIN provided by Dripp Media to access your official invoice.
          </p>
          
          {/* PIN Input Boxes */}
          <div style={{ display: 'flex', gap: 'clamp(8px, 2.8vw, 14px)', justifyContent: 'center', marginBottom: '22px' }}>
            {pin.map((digit, index) => (
              <div key={index} style={{
                width: 'clamp(54px, 14vw, 68px)',
                height: 'clamp(64px, 16vw, 78px)',
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
                  pattern="[0-9]*"
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
                    fontSize: 'clamp(1.6rem, 5vw, 2.3rem)',
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
              fontFamily: "'Clash Display', sans-serif", 
              letterSpacing: '0.04em', 
              textTransform: 'uppercase', 
              boxShadow: '0 8px 24px -5px rgba(235, 215, 63, 0.35)',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' 
            }}
          >
            {loading ? 'Decrypting Invoice...' : 'View Invoice'}
          </button>
        </form>

        <style>{`
          .cursor {
            position: fixed;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            border: 2px solid #ebd73f;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999999;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 14px rgba(235, 215, 63, 0.45);
            transition: width 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), 
                        height 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), 
                        background-color 0.25s ease, 
                        border-color 0.25s ease,
                        box-shadow 0.25s ease,
                        opacity 0.25s ease;
          }
          .cursor.active {
            width: 55px;
            height: 55px;
            background-color: rgba(235, 215, 63, 0.16);
            border-color: #ebd73f;
            box-shadow: 0 0 25px rgba(235, 215, 63, 0.6);
            backdrop-filter: blur(2px);
          }
          @media (pointer: fine) and (hover: hover) {
            .invoice-page-wrap,
            .invoice-page-wrap * {
              cursor: none !important;
            }
          }
          @media (pointer: coarse), (hover: none) {
            .cursor { display: none !important; }
            * { cursor: auto !important; }
          }
        `}</style>
      </div>
    );
  }

  // Safe Fallback if data is missing
  if (!quoteData) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', textAlign: 'center', fontFamily: "'Clash Display', sans-serif" }}>
        <p style={{ color: '#ebd73f', fontSize: '1.2rem', marginBottom: '16px', fontFamily: "'Panchang', sans-serif" }}>Invoice Data Unavailable</p>
        <p style={{ color: '#888888', maxWidth: '420px', marginBottom: '24px' }}>Unable to display this invoice record. Please verify the link or contact Dripp Media.</p>
        <button onClick={() => setIsLocked(true)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', borderRadius: '10px', fontFamily: "'Clash Display', sans-serif" }}>
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
  const selectedBank = quoteData.selectedBank || (isInvoice ? {
    bankName: 'HDFC Bank',
    accountName: 'Dripp Media',
    accountNumber: '50200012345678',
    ifsc: 'HDFC0001234',
    upi: 'drippmedia@okhdfcbank'
  } : null);

  return (
    <div className="invoice-page-wrap" style={{ 
      minHeight: '100vh', 
      background: '#050505', 
      color: '#ffffff', 
      padding: 'clamp(14px, 4vw, 48px) clamp(12px, 3.5vw, 24px)', 
      fontFamily: "'Clash Display', sans-serif", 
      position: 'relative', 
      overflow: 'visible',
      width: '100%'
    }}>
      
      {/* Custom Kinetic Cursor */}
      <div id="invoice-custom-cursor" ref={cursorRef} className="cursor" />

      {/* Ambient Glows Layer - Clipped cleanly to prevent document scroll height inflation */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 'clamp(350px, 70vw, 800px)', height: 'clamp(350px, 70vw, 800px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 'clamp(300px, 60vw, 600px)', height: 'clamp(300px, 60vw, 600px)', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.05) 0%, rgba(5, 5, 5, 0) 60%)', borderRadius: '50%' }} />
      </div>

      <style>{`
        /* Global & Document Scroll Normalization (Fixes scroll locking & provides smooth native momentum) */
        html, body {
          width: 100%;
          min-height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          overscroll-behavior-y: auto;
        }

        /* --- CUSTOM CURSOR --- */
        .cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border: 2px solid #ebd73f;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999999;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 14px rgba(235, 215, 63, 0.45);
          transition: width 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), 
                      height 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), 
                      background-color 0.25s ease, 
                      border-color 0.25s ease,
                      box-shadow 0.25s ease,
                      opacity 0.25s ease;
        }

        .cursor.active {
          width: 55px;
          height: 55px;
          background-color: rgba(235, 215, 63, 0.16);
          border-color: #ebd73f;
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.6);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        /* Desktop cursor concealment for kinetic custom cursor */
        @media (pointer: fine) and (hover: hover) {
          .invoice-page-wrap,
          .invoice-page-wrap button,
          .invoice-page-wrap a,
          .invoice-page-wrap input {
            cursor: none !important;
          }
        }

        /* Touch / Mobile: completely disable custom cursor and restore native pointer behavior */
        @media (pointer: coarse), (hover: none) {
          .cursor {
            display: none !important;
          }
          * {
            cursor: auto !important;
          }
        }

        /* Base Grid Structure */
        .invoice-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .invoice-header {
          text-align: center;
          padding: clamp(20px, 4vw, 44px) 0 20px 0;
          border-bottom: 1px solid rgba(235, 215, 63, 0.2);
          margin-bottom: 12px;
          position: relative;
          width: 100%;
        }

        /* --- DESKTOP (>= 950px) --- */
        @media screen and (min-width: 950px) {
          .invoice-grid {
            grid-template-columns: 1fr 1.35fr;
            align-items: flex-start;
            gap: 40px;
          }
          .invoice-header {
            grid-column: 1 / -1;
            padding: 36px 0;
          }
          /* Natural Document Flow: No position:sticky to eliminate scroll locking & cutoff bugs */
          .invoice-left {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .invoice-right {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          .desktop-only-action {
            display: inline-flex !important;
          }
        }

        /* --- MOBILE & TABLET (< 950px) OPTIMIZATION & PLACEMENTS --- */
        @media screen and (max-width: 949px) {
          .invoice-grid {
            display: flex;
            flex-direction: column;
            gap: 18px;
            width: 100%;
          }
          .invoice-header {
            order: 1;
            padding: 16px 0 16px 0;
            margin-bottom: 4px;
          }
          
          /* Dissolve desktop column wrappers so children flow sequentially */
          .invoice-left {
            display: contents;
          }
          .invoice-right {
            display: contents;
          }

          /* Optimized Mobile Structural Hierarchy (Placements) */
          .card-billed-to {
            order: 2;
          }
          .card-billed-items {
            order: 3;
          }
          .card-total-due {
            order: 4;
          }
          .card-payment-details {
            order: 5;
          }
          .card-notes {
            order: 6;
          }
          .invoice-footer {
            order: 7;
          }

          /* Mobile Action Bar */
          .action-bar-container {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 14px 16px !important;
            gap: 12px !important;
            border-radius: 18px !important;
          }
          .action-bar-top-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          .action-bar-btns-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            width: 100%;
          }
          .action-bar-btns-row button {
            justify-content: center;
            padding: 12px 14px !important;
            font-size: 0.85rem !important;
            min-height: 44px;
          }
          .desktop-only-action {
            display: none !important;
          }

          /* Mobile Line Items */
          .invoice-item-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .invoice-item-bottom-bar {
            display: flex !important;
            width: 100% !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding-top: 10px !important;
            border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
          }

          /* Mobile Billed To Info Strip */
          .billed-info-strip {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .billed-info-cell-invnum {
            grid-column: span 2 !important;
            text-align: left !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
          }

          /* Mobile Footer Card */
          .footer-pill {
            border-radius: 20px !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 14px !important;
            padding: 18px 20px !important;
            width: 100% !important;
            max-width: 420px !important;
          }
        }

        @media screen and (min-width: 950px) {
          .mobile-only-gpay-wrap {
            display: none !important;
          }
        }

        /* --- PRINT SYSTEM DESIGN: EXACT MATCH TO LUXURY DARK PDF --- */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* Hide interactive screen UI and action bars */
          .no-print,
          #invoice-custom-cursor,
          .cursor,
          .action-bar-container,
          .desktop-only-action,
          .copy-action-btn,
          button {
            display: none !important;
          }

          /* Force browser print engine to reproduce deep obsidian black background */
          html, body {
            background-color: #050505 !important;
            background: #050505 !important;
            color: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Clash Display', sans-serif !important;
          }

          .invoice-page-wrap {
            background-color: #050505 !important;
            background: #050505 !important;
            color: #ffffff !important;
            padding: 24px 28px !important;
            margin: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            min-height: 100vh !important;
            overflow: visible !important;
          }

          /* Hide ambient decorative glow orbs */
          .invoice-page-wrap > div:first-of-type {
            display: none !important;
          }

          /* High-Luxury 2-Column Print Grid matching PDF */
          .invoice-grid {
            display: grid !important;
            grid-template-columns: 1fr 1.35fr !important;
            gap: 24px !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Print Header at Top with Gold Panchang Typography */
          .invoice-header {
            grid-column: 1 / -1 !important;
            order: -1 !important;
            text-align: center !important;
            padding: 4px 0 14px 0 !important;
            margin-bottom: 8px !important;
            border-bottom: 1px solid rgba(235, 215, 63, 0.25) !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-header h1 {
            color: #ebd73f !important;
            font-size: 2.3rem !important;
            font-weight: 900 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 4px 0 !important;
            text-shadow: 0 0 20px rgba(235, 215, 63, 0.35) !important;
            font-family: 'Panchang', sans-serif !important;
          }

          .invoice-header p {
            color: #a1a1aa !important;
            font-size: 0.82rem !important;
            letter-spacing: 3.5px !important;
            text-transform: uppercase !important;
            font-weight: 600 !important;
            margin: 0 !important;
            font-family: 'Clash Display', sans-serif !important;
          }

          .invoice-left {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            order: 1 !important;
          }

          .invoice-right {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            order: 2 !important;
          }

          /* Dark Glassmorphism Print Cards matching PDF */
          .card-billed-to,
          .card-payment-details,
          .card-notes,
          .card-billed-items {
            background: rgba(255, 255, 255, 0.025) !important;
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            border-radius: 18px !important;
            padding: 16px 20px !important;
            color: #ffffff !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            order: unset !important;
          }

          .card-billed-to h2 {
            color: #ffffff !important;
            font-size: 1.55rem !important;
            font-family: 'Panchang', sans-serif !important;
            margin: 0 0 4px 0 !important;
          }

          .card-billed-to p,
          .card-notes p,
          .card-payment-details p {
            color: #cccccc !important;
            font-family: 'Clash Display', sans-serif !important;
          }

          .card-billed-to p[style*="uppercase"],
          .card-payment-details p[style*="uppercase"] {
            color: #ebd73f !important;
            font-weight: 600 !important;
            font-size: 0.72rem !important;
            letter-spacing: 2px !important;
          }

          /* Billed To Info Strip */
          .billed-info-strip {
            display: flex !important;
            gap: 10px !important;
          }

          .billed-info-strip .interactive-cell,
          .billed-info-cell-invnum {
            background: rgba(255, 255, 255, 0.02) !important;
            border: 1px solid rgba(255, 255, 255, 0.05) !important;
            border-radius: 10px !important;
            padding: 8px 12px !important;
            flex: 1 1 auto !important;
          }

          .billed-info-cell-invnum {
            background: rgba(235, 215, 63, 0.04) !important;
            border: 1px solid rgba(235, 215, 63, 0.18) !important;
          }

          .billed-info-strip p {
            color: #e4e4e7 !important;
            font-family: 'Clash Display', sans-serif !important;
          }

          .billed-info-strip p:first-child {
            color: #71717a !important;
            font-size: 0.7rem !important;
          }

          .billed-info-cell-invnum p:last-child {
            color: #ebd73f !important;
            font-family: 'Panchang', sans-serif !important;
            font-weight: 700 !important;
          }

          /* Payment Details Card */
          .card-payment-details > div > div {
            background: rgba(255, 255, 255, 0.02) !important;
            border: 1px solid rgba(255, 255, 255, 0.04) !important;
            border-radius: 10px !important;
            padding: 8px 12px !important;
          }

          .card-qr-section {
            margin-top: 6px !important;
            text-align: center !important;
            padding-top: 12px !important;
            border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          }

          .card-qr-section p {
            color: #a1a1aa !important;
            font-family: 'Clash Display', sans-serif !important;
            font-size: 0.72rem !important;
            letter-spacing: 1.2px !important;
            text-transform: uppercase !important;
          }

          .invoice-qr-box {
            background: #ffffff !important;
            padding: 10px !important;
            border-radius: 14px !important;
            display: inline-block !important;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5) !important;
          }

          .invoice-qr-box img,
          .invoice-qr-box canvas {
            width: 125px !important;
            height: 125px !important;
            display: block !important;
          }

          /* Notes & Terms Card */
          .card-notes {
            background: rgba(235, 215, 63, 0.03) !important;
            border: 1px solid rgba(235, 215, 63, 0.16) !important;
            border-left: 3px solid #ebd73f !important;
            border-radius: 16px !important;
            padding: 14px 18px !important;
          }

          .card-notes p:first-child {
            color: #ebd73f !important;
            font-family: 'Clash Display', sans-serif !important;
            font-weight: 600 !important;
            font-size: 0.72rem !important;
            letter-spacing: 1.5px !important;
          }

          .card-notes p:last-child {
            color: #d4d4d8 !important;
            font-family: 'Clash Display', sans-serif !important;
            font-size: 0.88rem !important;
          }

          /* Billed Items Card */
          .card-billed-items h3 {
            color: #ebd73f !important;
            font-size: 1.25rem !important;
            margin-bottom: 12px !important;
            font-family: 'Panchang', sans-serif !important;
          }

          .invoice-item-row {
            background: rgba(255, 255, 255, 0.025) !important;
            border: 1px solid rgba(235, 215, 63, 0.18) !important;
            border-radius: 16px !important;
            padding: 14px 18px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 14px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-item-row h4 {
            color: #ffffff !important;
            font-family: 'Panchang', sans-serif !important;
            font-size: 1.05rem !important;
            margin: 0 0 4px 0 !important;
          }

          .invoice-item-bottom-bar {
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
          }

          .invoice-item-bottom-bar > div:first-child {
            background: rgba(255, 255, 255, 0.03) !important;
            border: 1px solid rgba(255, 255, 255, 0.06) !important;
            color: #888888 !important;
            font-family: 'Clash Display', sans-serif !important;
            border-radius: 6px !important;
            padding: 4px 8px !important;
          }

          .invoice-item-bottom-bar > div:first-child strong {
            color: #ffffff !important;
          }

          .invoice-item-bottom-bar > div:last-child {
            font-family: 'Panchang', sans-serif !important;
            color: #ebd73f !important;
          }

          /* Total Due Card matching PDF */
          .card-total-due {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            order: unset !important;
            margin-top: 4px !important;
          }

          .card-total-due > div {
            background: linear-gradient(180deg, rgba(235, 215, 63, 0.08) 0%, rgba(235, 215, 63, 0.02) 100%) !important;
            border: 1px solid rgba(235, 215, 63, 0.35) !important;
            border-radius: 20px !important;
            padding: 24px 20px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            box-shadow: none !important;
          }

          .card-total-due > div > div:first-child {
            background: rgba(235, 215, 63, 0.1) !important;
            border: 1px solid rgba(235, 215, 63, 0.25) !important;
            border-radius: 100px !important;
            padding: 4px 12px !important;
            margin-bottom: 12px !important;
            color: #ebd73f !important;
            font-family: 'Clash Display', sans-serif !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 2px !important;
            font-size: 0.74rem !important;
          }

          .card-total-due span:nth-child(1) {
            color: #ebd73f !important;
            font-size: 1.8rem !important;
            font-weight: 600 !important;
            font-family: 'Clash Display', sans-serif !important;
          }

          .card-total-due span:nth-child(2) {
            color: #ebd73f !important;
            font-size: 3rem !important;
            font-family: 'Panchang', sans-serif !important;
            font-weight: 900 !important;
            text-shadow: 0 0 25px rgba(235, 215, 63, 0.4) !important;
          }

          .card-total-due span:nth-child(3) {
            color: #71717a !important;
            font-size: 1.35rem !important;
            font-family: 'Clash Display', sans-serif !important;
            font-weight: 600 !important;
            margin-left: 2px !important;
          }

          .card-total-due p {
            font-family: 'Clash Display', sans-serif !important;
          }

          /* Hide Web Footer in Print for Clean 1-Page PDF Fit */
          .invoice-footer {
            display: none !important;
          }
        }
      `}</style>

      {/* Modern, Minimal & Mobile-Optimized Client Action Bar */}
      <div className="no-print action-bar-container" style={{
        maxWidth: '1200px',
        margin: '0 auto 20px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 20px',
        background: 'rgba(18, 18, 22, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Document Badge */}
        <div className="action-bar-top-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: 'rgba(235, 215, 63, 0.12)',
              border: '1px solid rgba(235, 215, 63, 0.3)',
              flexShrink: 0
            }}>
              <FileText size={14} color="#ebd73f" />
            </div>
            <span style={{
              fontFamily: "'Panchang', sans-serif",
              fontSize: 'clamp(0.76rem, 2.8vw, 0.82rem)',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.4px'
            }}>
              {isInvoice ? 'Official Invoice' : 'Official Proposal'}
            </span>
          </div>

          <span style={{
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.82rem',
            color: '#ebd73f',
            background: 'rgba(235, 215, 63, 0.08)',
            border: '1px solid rgba(235, 215, 63, 0.28)',
            padding: '3px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            letterSpacing: '0.5px'
          }}>
            #{details?.number || '001'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="action-bar-btns-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Download PDF button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 18px',
              background: downloadSuccess === 'pdf' ? 'rgba(235, 215, 63, 0.22)' : 'rgba(235, 215, 63, 0.12)',
              border: `1px solid ${downloadSuccess === 'pdf' ? 'rgba(235, 215, 63, 0.6)' : 'rgba(235, 215, 63, 0.35)'}`,
              borderRadius: '10px',
              color: '#ebd73f',
              fontSize: '0.84rem',
              fontWeight: '600',
              fontFamily: "'Clash Display', sans-serif",
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={e => {
              if (!isDownloadingPdf && downloadSuccess !== 'pdf') {
                e.currentTarget.style.background = '#ebd73f';
                e.currentTarget.style.color = '#000000';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (!isDownloadingPdf && downloadSuccess !== 'pdf') {
                e.currentTarget.style.background = 'rgba(235, 215, 63, 0.12)';
                e.currentTarget.style.color = '#ebd73f';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating...</span>
              </>
            ) : downloadSuccess === 'pdf' ? (
              <>
                <CheckCircle2 size={14} color="#ebd73f" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span>Download PDF</span>
              </>
            )}
          </button>

          {/* Download Image button */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isDownloadingImage}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '9px 18px',
              background: downloadSuccess === 'image' ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${downloadSuccess === 'image' ? 'rgba(235, 215, 63, 0.5)' : 'rgba(255, 255, 255, 0.14)'}`,
              borderRadius: '10px',
              color: downloadSuccess === 'image' ? '#ebd73f' : '#ffffff',
              fontSize: '0.84rem',
              fontWeight: '600',
              fontFamily: "'Clash Display', sans-serif",
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              if (!isDownloadingImage && downloadSuccess !== 'image') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.4)';
                e.currentTarget.style.color = '#ebd73f';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={e => {
              if (!isDownloadingImage && downloadSuccess !== 'image') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'none';
              }
            }}
          >
            {isDownloadingImage ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving Image...</span>
              </>
            ) : downloadSuccess === 'image' ? (
              <>
                <CheckCircle2 size={14} color="#ebd73f" />
                <span>Saved Image!</span>
              </>
            ) : (
              <>
                <ImageIcon size={14} />
                <span>Download Image</span>
              </>
            )}
          </button>

          {/* Print button (desktop only) */}
          <button
            type="button"
            className="desktop-only-action"
            onClick={() => window.print()}
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '9px 15px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#888888',
              fontSize: '0.84rem',
              fontWeight: '500',
              fontFamily: "'Clash Display', sans-serif",
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#888888';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div ref={invoiceDocRef} className="invoice-grid">
        
        {/* Cover Header Section */}
        <div className="invoice-header">
          <h1 style={{ 
            fontSize: 'clamp(2.1rem, 8vw, 3.8rem)', 
            color: '#ebd73f', 
            margin: '0 0 8px 0', 
            letterSpacing: '-0.02em', 
            fontWeight: '900', 
            fontFamily: "'Panchang', sans-serif", 
            textShadow: '0 0 25px rgba(235, 215, 63, 0.35)', 
            wordBreak: 'break-word',
            lineHeight: '1.15'
          }}>
            DRIPP MEDIA
          </h1>
          <p style={{ 
            fontSize: 'clamp(0.8rem, 3.2vw, 1.05rem)', 
            color: '#a1a1aa', 
            margin: 0, 
            textTransform: 'uppercase', 
            letterSpacing: 'clamp(2px, 0.8vw, 3.5px)', 
            fontWeight: '600',
            fontFamily: "'Clash Display', sans-serif"
          }}>
            {isInvoice ? 'TAX INVOICE' : 'Proposal & Investment Overview'}
          </p>
        </div>

        {/* LEFT PANEL (On mobile dissolved via display:contents so children reorder logically) */}
        <div className="invoice-left">
          
          {/* Card: Client Details / Billed To */}
          <div className="card-billed-to" style={{ 
            background: 'rgba(255, 255, 255, 0.025)', 
            border: '1px solid rgba(255, 255, 255, 0.07)', 
            padding: 'clamp(20px, 4.5vw, 34px)', 
            borderRadius: '22px', 
            backdropFilter: 'blur(10px)', 
            width: '100%', 
            boxSizing: 'border-box' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '0.74rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>
                Billed To
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#71717a' }}>
                <ShieldCheck size={13} color="#ebd73f" /> Verified Client
              </span>
            </div>

            <h2 style={{ 
              fontSize: 'clamp(1.5rem, 5.5vw, 2.2rem)', 
              color: '#ffffff', 
              margin: '0 0 6px 0', 
              fontFamily: "'Panchang', sans-serif", 
              wordBreak: 'break-word',
              lineHeight: '1.25'
            }}>
              {client.brandName || client.name || 'Client'}
            </h2>

            {client.brandName && client.name && (
              <p style={{ fontSize: '0.98rem', color: '#cccccc', margin: '0 0 6px 0', fontFamily: "'Clash Display', sans-serif" }}>
                {client.name}
              </p>
            )}
            {client.email && (
              <p style={{ fontSize: '0.88rem', color: '#888888', margin: '0 0 6px 0', wordBreak: 'break-all', fontFamily: "'Clash Display', sans-serif" }}>
                {client.email}
              </p>
            )}
            {client.phone && (
              <p style={{ fontSize: '0.88rem', color: '#888888', margin: '0 0 6px 0', fontFamily: "'Clash Display', sans-serif" }}>
                {client.phone}
              </p>
            )}
            {client.gst && (
              <p style={{ fontSize: '0.86rem', color: '#ebd73f', margin: '4px 0 12px 0', fontWeight: '500', fontFamily: "'Clash Display', sans-serif" }}>
                GSTIN: {client.gst}
              </p>
            )}
            
            {/* Meta Information Strip */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '14px' }}>
              <div className="billed-info-strip" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                 <div className="interactive-cell" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', flex: '1 1 auto' }}>
                    <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice Date</p>
                    <p style={{ fontSize: '0.92rem', color: '#e4e4e7', margin: 0, fontWeight: '500' }}>{details?.date || client?.date || 'N/A'}</p>
                 </div>
                 {details?.dueDate && (
                   <div className="interactive-cell" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', flex: '1 1 auto' }}>
                      <p style={{ fontSize: '0.7rem', color: '#71717a', margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Due Date</p>
                      {details.dueDate.toLowerCase().includes('receipt') || details.dueDate.toLowerCase().includes('urgent') ? (
                        <span style={{
                          display: 'inline-block',
                          color: '#ebd73f',
                          background: 'rgba(235, 215, 63, 0.1)',
                          border: '1px solid rgba(235, 215, 63, 0.3)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: '700',
                          letterSpacing: '0.3px',
                          fontFamily: "'Clash Display', sans-serif"
                        }}>
                          {details.dueDate}
                        </span>
                      ) : (
                        <p style={{ fontSize: '0.92rem', color: '#e4e4e7', margin: 0, fontWeight: '500' }}>{details.dueDate}</p>
                      )}
                   </div>
                 )}
                 <div className="billed-info-cell-invnum interactive-cell" style={{ background: 'rgba(235, 215, 63, 0.04)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.16)', textAlign: 'right', flex: '1 1 auto' }}>
                    <p style={{ fontSize: '0.7rem', color: '#a1a1aa', margin: '0 0 3px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice #</p>
                    <p style={{ fontSize: '0.95rem', color: '#ebd73f', margin: 0, fontWeight: '700', fontFamily: "'Panchang', sans-serif" }}>{details?.number || '001'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Card: Bank / Payment Details */}
          {selectedBank && (
            <div className="card-payment-details" style={{ 
              background: 'rgba(255, 255, 255, 0.025)', 
              border: '1px solid rgba(255, 255, 255, 0.07)', 
              padding: 'clamp(20px, 4.5vw, 34px)', 
              borderRadius: '22px', 
              backdropFilter: 'blur(10px)', 
              width: '100%', 
              boxSizing: 'border-box' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.74rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '2px', margin: 0, fontWeight: '600' }}>
                    Payment Details
                  </p>
                  <span style={{ fontSize: '0.72rem', color: '#888888' }}>Direct Wire & UPI</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {selectedBank.details && !selectedBank.bankName ? (
                        <div style={{ color: '#ffffff', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {selectedBank.details}
                        </div>
                    ) : (
                        <>
                            {selectedBank.bankName && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                    <p style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>Bank Name</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.bankName}</p>
                                </div>
                            )}
                            {selectedBank.accountName && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                    <p style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>Beneficiary / Account Name</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.accountName}</p>
                                </div>
                            )}
                            {selectedBank.accountNumber && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <p style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>Account Number</p>
                                      <p style={{ fontSize: '0.98rem', color: '#ebd73f', margin: 0, fontWeight: '700', letterSpacing: '0.05em' }}>{selectedBank.accountNumber}</p>
                                    </div>
                                    <button
                                      type="button"
                                      className="copy-action-btn"
                                      onClick={() => handleCopy(selectedBank.accountNumber, 'acc')}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: copiedField === 'acc' ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                        border: `1px solid ${copiedField === 'acc' ? 'rgba(235, 215, 63, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                                        color: copiedField === 'acc' ? '#ebd73f' : '#cccccc',
                                        fontSize: '0.75rem',
                                        fontFamily: "'Clash Display', sans-serif",
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {copiedField === 'acc' ? <Check size={12} color="#ebd73f" /> : <Copy size={12} />}
                                      <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            )}
                            {selectedBank.ifsc && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <p style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>IFSC / Routing</p>
                                      <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.ifsc}</p>
                                    </div>
                                    <button
                                      type="button"
                                      className="copy-action-btn"
                                      onClick={() => handleCopy(selectedBank.ifsc, 'ifsc')}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: copiedField === 'ifsc' ? 'rgba(235, 215, 63, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                        border: `1px solid ${copiedField === 'ifsc' ? 'rgba(235, 215, 63, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                                        color: copiedField === 'ifsc' ? '#ebd73f' : '#cccccc',
                                        fontSize: '0.75rem',
                                        fontFamily: "'Clash Display', sans-serif",
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {copiedField === 'ifsc' ? <Check size={12} color="#ebd73f" /> : <Copy size={12} />}
                                      <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            )}
                            {selectedBank.swift && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                    <p style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>SWIFT Code</p>
                                    <p style={{ fontSize: '0.95rem', color: '#ffffff', margin: 0, fontWeight: '600' }}>{selectedBank.swift}</p>
                                </div>
                            )}
                            {selectedBank.upi && (
                                <div style={{ background: 'rgba(235, 215, 63, 0.04)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(235, 215, 63, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <p style={{ fontSize: '0.7rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 2px 0' }}>UPI ID</p>
                                      <p style={{ fontSize: '0.98rem', color: '#ebd73f', margin: 0, fontWeight: '600' }}>{selectedBank.upi}</p>
                                    </div>
                                    <button
                                      type="button"
                                      className="copy-action-btn"
                                      onClick={() => handleCopy(selectedBank.upi, 'upi')}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        background: copiedField === 'upi' ? 'rgba(235, 215, 63, 0.3)' : '#ebd73f',
                                        border: 'none',
                                        color: '#050505',
                                        fontSize: '0.78rem',
                                        fontWeight: '700',
                                        fontFamily: "'Clash Display', sans-serif",
                                        boxShadow: '0 2px 10px rgba(235, 215, 63, 0.25)',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      {copiedField === 'upi' ? <Check size={12} color="#050505" /> : <Copy size={12} />}
                                      <span>{copiedField === 'upi' ? 'Copied' : 'Copy UPI'}</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                    
                    {/* Mobile Direct Google Pay / UPI Intent Button */}
                    {selectedBank?.upi && (
                      <div className="mobile-only-gpay-wrap no-print" style={{ margin: '14px 0 10px 0', width: '100%' }}>
                        <a
                          href={`upi://pay?pa=${encodeURIComponent(selectedBank.upi)}&pn=${encodeURIComponent(selectedBank.accountName || 'Dripp Media')}&am=${encodeURIComponent(quoteData?.total || '')}&cu=INR&tn=${encodeURIComponent('Invoice ' + (details?.number || ''))}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: '14px',
                            background: '#ffffff',
                            color: '#000000',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '0.92rem',
                            fontFamily: "'Clash Display', sans-serif",
                            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.12)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                          </svg>
                          <span style={{ whiteSpace: 'nowrap', fontFamily: "'Clash Display', sans-serif" }}>Pay with Google Pay</span>
                          <span style={{ fontSize: '0.82rem', color: '#555555', fontWeight: '600', whiteSpace: 'nowrap', fontFamily: "'Clash Display', sans-serif" }}>• {currency}{quoteData?.total?.toLocaleString()}</span>
                        </a>
                      </div>
                    )}
                    
                    {(qrDataUrl || selectedBank.qrCode || selectedBank.upi) && (
                        <div className="card-qr-section" style={{ marginTop: '8px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <p style={{ fontSize: '0.72rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 12px 0', fontFamily: "'Clash Display', sans-serif" }}>
                              Scan to Pay with Any UPI App
                            </p>
                            <div className="invoice-qr-box" style={{ background: '#ffffff', padding: '12px', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
                                <canvas 
                                  ref={(el) => { 
                                    qrCanvasRef.current = el; 
                                    if (el) renderQrCanvas(); 
                                  }}
                                  id="invoice-qr-canvas"
                                  width="280"
                                  height="280"
                                  style={{ width: '140px', height: '140px', display: 'block', borderRadius: '8px' }}
                                />
                                <img 
                                  id="invoice-qr-img"
                                  crossOrigin={(qrDataUrl || selectedBank.qrCode)?.startsWith('data:') ? undefined : 'anonymous'}
                                  src={qrDataUrl || selectedBank.qrCode} 
                                  alt="Payment QR Code" 
                                  style={{ display: 'none' }} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* Card: Notes / Payment Terms */}
          {details?.notes && (
            <div className="card-notes" style={{ 
              background: 'rgba(235, 215, 63, 0.03)', 
              padding: 'clamp(18px, 4vw, 24px)', 
              borderRadius: '20px', 
              borderLeft: '3px solid #ebd73f', 
              border: '1px solid rgba(235, 215, 63, 0.14)',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <p style={{ fontSize: '0.72rem', color: '#ebd73f', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: '600' }}>
                Notes & Terms
              </p>
              <p style={{ margin: 0, lineHeight: '1.6', color: '#d4d4d8', fontSize: '0.92rem', whiteSpace: 'pre-wrap' }}>
                {details.notes}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL (Services & Total) */}
        <div className="invoice-right">
          
          {/* Card: Billed Items / Services */}
          <div className="card-billed-items" style={{ width: '100%' }}>
            <h3 style={{ 
              fontSize: 'clamp(1.15rem, 3.8vw, 1.45rem)', 
              color: '#ebd73f', 
              margin: '0 0 16px 0', 
              fontFamily: "'Panchang', sans-serif", 
              textAlign: 'left',
              letterSpacing: '0.3px'
            }}>
              {isInvoice ? 'Billed Items' : 'Proposed Services'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
              {items.map((item, i) => {
                const qty = parseFloat(item.qty || 0);
                const rate = parseFloat(item.rate || 0);
                const rowTotal = qty * rate;
                const { whole: rateWhole, decimal: rateDecimal } = formatCurrencyParts(rate);
                const { whole: rowWhole, decimal: rowDecimal } = formatCurrencyParts(rowTotal);
                return (
                  <div key={i} className="invoice-item-row" style={{ 
                    background: 'rgba(255, 255, 255, 0.025)', 
                    border: '1px solid rgba(235, 215, 63, 0.16)', 
                    borderRadius: '18px', 
                    padding: 'clamp(16px, 3.5vw, 22px)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                     <div style={{ flex: '1 1 auto', width: '100%' }}>
                        <h4 style={{ 
                          fontSize: 'clamp(0.96rem, 3.5vw, 1.15rem)', 
                          color: '#ffffff', 
                          margin: '0 0 6px 0', 
                          fontFamily: "'Panchang', sans-serif",
                          lineHeight: '1.35'
                        }}>
                          {item.desc || 'Service Item'}
                        </h4>
                        {item.details && (
                          <p style={{ 
                            fontSize: '0.88rem', 
                            color: '#a1a1aa', 
                            margin: '0 0 8px 0', 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: '1.5' 
                          }}>
                            {item.details}
                          </p>
                        )}
                     </div>

                     <div className="invoice-item-bottom-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                        <div style={{
                          fontSize: 'clamp(0.78rem, 2.6vw, 0.82rem)',
                          color: '#888888',
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>Qty: <strong style={{ color: '#ffffff' }}>{item.qty}</strong></span>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                          <span>
                            Rate: <strong style={{ color: '#ffffff' }}>{currency}{rateWhole}</strong>
                            <span style={{ color: '#71717a', fontSize: '0.86em', fontWeight: '500' }}>.{rateDecimal}</span>
                          </span>
                        </div>

                        <div style={{ 
                          fontSize: 'clamp(1.1rem, 3.8vw, 1.35rem)', 
                          fontWeight: '700', 
                          color: '#ebd73f', 
                          display: 'inline-flex', 
                          alignItems: 'baseline', 
                          gap: '2px',
                          fontFamily: "'Panchang', sans-serif",
                          flexShrink: 0
                        }}>
                          <span style={{ color: '#71717a', fontSize: '0.88rem', fontWeight: 'normal', fontFamily: "'Clash Display', sans-serif", marginRight: '3px' }}>=</span> 
                          <span style={{ color: '#ebd73f', textShadow: '0 0 12px rgba(235, 215, 63, 0.3)' }}>{currency}{rowWhole}</span>
                          <span style={{ color: '#71717a', fontSize: '0.68em', fontWeight: '600', fontFamily: "'Clash Display', sans-serif", letterSpacing: '0.5px' }}>.{rowDecimal}</span>
                        </div>
                     </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card: Total Due / Investment */}
          <div className="card-total-due" style={{ width: '100%', marginTop: '6px' }}>
            <div style={{ 
              background: 'linear-gradient(180deg, rgba(235, 215, 63, 0.08) 0%, rgba(235, 215, 63, 0.02) 100%)', 
              border: '1px solid rgba(235, 215, 63, 0.35)', 
              borderRadius: '24px', 
              padding: 'clamp(32px, 6vw, 48px) clamp(20px, 4vw, 36px)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 16px 45px rgba(0,0,0,0.7), 0 0 30px rgba(235, 215, 63, 0.08)', 
              width: '100%', 
              boxSizing: 'border-box',
              position: 'relative'
            }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(235, 215, 63, 0.1)', 
                  border: '1px solid rgba(235, 215, 63, 0.25)', 
                  padding: '4px 12px', 
                  borderRadius: '100px', 
                  marginBottom: '14px' 
                }}>
                  <Sparkles size={12} color="#ebd73f" />
                  <span style={{ 
                    fontSize: '0.76rem', 
                    color: '#ebd73f', 
                    textTransform: 'uppercase', 
                    letterSpacing: '2px', 
                    fontWeight: '700' 
                  }}>
                    {isInvoice ? 'Total Due' : 'Total Investment'}
                  </span>
                </div>
                
                {(() => {
                  const { whole: totalWhole, decimal: totalDecimal } = formatCurrencyParts(quoteData.total);
                  return (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'baseline', 
                      gap: '4px', 
                      flexWrap: 'wrap', 
                      justifyContent: 'center', 
                      width: '100%',
                      lineHeight: '1.1'
                    }}>
                        <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', color: '#ebd73f', fontWeight: '600', textShadow: '0 0 25px rgba(235, 215, 63, 0.45)' }}>{currency}</span>
                        <span style={{ 
                          fontSize: 'clamp(2.2rem, 7.5vw, 3.6rem)', 
                          color: '#ebd73f', 
                          fontWeight: '900', 
                          fontFamily: "'Panchang', sans-serif", 
                          letterSpacing: '-0.02em', 
                          wordBreak: 'break-word', 
                          textAlign: 'center',
                          textShadow: '0 0 30px rgba(235, 215, 63, 0.5)'
                        }}>
                          {totalWhole}
                        </span>
                        <span style={{ 
                          fontSize: 'clamp(1rem, 3vw, 1.55rem)', 
                          color: '#71717a', 
                          fontWeight: '600', 
                          fontFamily: "'Clash Display', sans-serif", 
                          letterSpacing: '0.5px',
                          marginLeft: '2px',
                          textShadow: 'none'
                        }}>
                          .{totalDecimal}
                        </span>
                    </div>
                  );
                })()}

                <div style={{ marginTop: '26px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '18px', width: '100%', maxWidth: '340px' }}>
                    <p style={{ color: '#d4d4d8', fontSize: '0.88rem', margin: '0 0 4px 0', fontWeight: '500' }}>Thank you for your business.</p>
                    <p style={{ color: '#71717a', fontSize: '0.78rem', margin: 0 }}>Dripp Media | Creative & Digital Agency</p>
                </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="no-print invoice-footer" style={{ 
          gridColumn: '1 / -1', 
          marginTop: '24px', 
          paddingTop: '28px', 
          paddingBottom: '20px', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px', 
          alignItems: 'center',
          width: '100%'
        }}>
            
            <div className="footer-pill" style={{ 
              background: 'rgba(235, 215, 63, 0.05)', 
              padding: '14px clamp(20px, 4vw, 40px)', 
              borderRadius: '100px', 
              border: '1px solid rgba(235, 215, 63, 0.2)', 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: 'clamp(14px, 3.5vw, 32px)', 
              backdropFilter: 'blur(10px)', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
            }}>
                <a href="https://www.drippmedia.com" target="_blank" rel="noopener noreferrer" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Globe size={15} color="#ebd73f" /> www.drippmedia.com
                </a>
                <a href="mailto:gurpreet@drippmedia.com" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <Mail size={15} color="#ebd73f" /> gurpreet@drippmedia.com
                </a>
                <a href="https://instagram.com/drippmedia_" target="_blank" rel="noopener noreferrer" style={{ color: '#aaaaaa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', transition: 'all 0.25s ease' }} onMouseEnter={e => { e.currentTarget.style.color = '#ebd73f'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaaaaa'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                   <AtSign size={15} color="#ebd73f" /> instagram.com/drippmedia_
                </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(90deg, rgba(235, 215, 63, 0) 0%, rgba(235, 215, 63, 0.3) 50%, rgba(235, 215, 63, 0) 100%)', width: '200px', height: '2px' }} />
              <p style={{ margin: 0, color: '#888888', fontSize: '0.82rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Founded by <span style={{ color: '#ebd73f', fontWeight: 'bold' }}>Gurpreet Singh</span></p>
            </div>
            
            <p style={{ fontSize: '0.74rem', color: '#52525b', margin: 0, letterSpacing: '1.5px' }}>© {new Date().getFullYear()} DRIPP MEDIA. ALL RIGHTS RESERVED.</p>
        </div>

      </div>
    </div>
  );
}
