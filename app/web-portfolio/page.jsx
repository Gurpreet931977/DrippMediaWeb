'use client';
import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGenz } from '../contexts/GenzContext';

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);
  const [deviceMode, setDeviceMode] = useState({}); // { [idx]: 'desktop' | 'mobile' }
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState('');
  const [fullscreenTitle, setFullscreenTitle] = useState('');

  const audioCtxRef = useRef(null);

  const projects = [
    {
      id: 'bharatup',
      title: 'BharatUp',
      tagline: 'Bridging Ambitious Students with Industry Knowledge',
      category: 'E-Learning & EdTech Platform',
      badge: 'Education Tech',
      desc: 'An ultra-fast, student-first digital educational platform engineered for high concurrency, seamless video course streaming, interactive quiz modules, and frictionless checkout.',
      url: 'https://www.bharatup.online',
      displayUrl: 'bharatup.online',
      status: 'Live & Scaling',
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      stats: [
        { label: 'Lighthouse Score', value: '99/100' },
        { label: 'Active Learners', value: '25K+' },
        { label: 'Page Load Speed', value: '0.4s' }
      ],
      techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Razorpay', 'Framer Motion'],
      challenge: 'Traditional e-learning platforms in India suffer from slow load times on low-bandwidth mobile networks and clunky navigation.',
      solution: 'We architected a lightweight, server-rendered Next.js application with edge caching, sub-second search, and an intuitive dark/light UI tailored for high retention.',
      previewTheme: 'elearning'
    },
    {
      id: 'pinaka',
      title: 'Pinaka Care Clinic',
      tagline: 'Modern Healthcare & Telemedicine Ecosystem',
      category: 'Healthcare & Clinical SaaS',
      badge: 'Healthcare',
      desc: 'A clinical healthcare web platform built to streamline patient appointment scheduling, digital medical consultation records, doctor profiles, and emergency triage access.',
      url: 'https://www.pinakacareclinic.com',
      displayUrl: 'pinakacareclinic.com',
      status: 'Live & Certified',
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
      stats: [
        { label: 'Booking Conversion', value: '+340%' },
        { label: 'Mobile Readiness', value: '100%' },
        { label: 'TTFB Server Latency', value: '0.28s' }
      ],
      techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge', 'Resend API'],
      challenge: 'Medical clinics often struggle with high bounce rates due to confusing form layouts and anxiety-inducing legacy hospital designs.',
      solution: 'Designed a soothing, high-trust visual language with instant slot booking, automated WhatsApp confirmations, and a HIPAA-compliant digital intake flow.',
      previewTheme: 'healthcare'
    },
    {
      id: 'goatsociety',
      title: 'Goat Society',
      tagline: 'Exclusive Lifestyle & High-Octane Digital Community',
      category: 'Luxury Lifestyle & Web3 Platform',
      badge: 'Brand Community',
      desc: 'A digital cultural hub and exclusive streetwear/lifestyle brand platform featuring immersive motion physics, kinetic typography, and high-impact visual storytelling.',
      url: 'https://goatsociety.in',
      displayUrl: 'goatsociety.in',
      status: 'Live & Exclusive',
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #78350f 0%, #18181b 100%)',
      stats: [
        { label: 'Frame Rate', value: '60 FPS' },
        { label: 'User Engagement', value: '4.8m' },
        { label: 'Visual Experience', value: 'Bespoke' }
      ],
      techStack: ['Next.js', 'GSAP', 'WebGL / Canvas', 'Tailwind CSS', 'Web Audio API', 'Cloudflare R2'],
      challenge: 'Creating a web presence that feels raw, premium, and distinct without compromising mobile performance or loading speed.',
      solution: 'Crafted GPU-composited parallax layers, custom micro-interactions, and dark brutalist aesthetics that establish instant brand dominance.',
      previewTheme: 'streetwear'
    },
    {
      id: 'rasmlai',
      title: 'Rasmlai AI',
      tagline: 'Next-Generation Generative Intelligence Studio',
      category: 'AI Interface & Product Engineering',
      badge: 'AI Application',
      desc: 'An AI workspace engineered for generative intelligence, streaming LLM reasoning, code synthesis, and multi-modal creative workflows in a minimalist dark interface.',
      url: 'https://rasmlai.vercel.app',
      displayUrl: 'rasmlai.vercel.app',
      status: 'Live on Vercel',
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #09090b 100%)',
      stats: [
        { label: 'Stream Latency', value: '12ms' },
        { label: 'Architecture', value: 'Edge AI' },
        { label: 'Lighthouse Score', value: '100/100' }
      ],
      techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS', 'Lucide'],
      challenge: 'AI web apps frequently suffer from sluggish streaming token rendering and complicated settings menus.',
      solution: 'Engineered a hyper-clean, keyboard-driven UI with real-time markdown token rendering, smart prompt caching, and zero visual clutter.',
      previewTheme: 'ai'
    }
  ];

  // Synthesize rich Web Audio acoustic feedback
  const playSound = (type = 'click') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'slide') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'open') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.23);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {}
  };

  const scrollToCard = (index) => {
    const pinContainer = document.getElementById('pin-container');
    const cards = document.querySelectorAll('.web-card-chassis');
    if (pinContainer && cards[index]) {
      playSound('slide');
      setActiveProjectIdx(index);
      const card = cards[index];
      const targetScroll = card.offsetLeft - (pinContainer.clientWidth - card.clientWidth) / 2;
      gsap.to(pinContainer, {
        scrollLeft: Math.max(0, targetScroll),
        duration: 0.75,
        ease: "power3.out"
      });
    }
  };

  const nextCard = () => {
    const nextIdx = (activeProjectIdx + 1) % projects.length;
    scrollToCard(nextIdx);
  };

  const prevCard = () => {
    const prevIdx = (activeProjectIdx - 1 + projects.length) % projects.length;
    scrollToCard(prevIdx);
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set('body', { opacity: 1, y: 0 });

    const cursor = document.getElementById('cursor');
    const handleMouseMove = (e) => {
      if (cursor) {
        gsap.to(cursor, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.15,
          ease: "power2.out"
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Custom wheel / trackpad horizontal scrolling
    const pinContainer = document.getElementById('pin-container');
    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      if (Math.abs(delta) > 0 && pinContainer) {
        e.preventDefault();
        gsap.to(pinContainer, {
          scrollLeft: pinContainer.scrollLeft + delta * 2.8,
          duration: 0.45,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    };
    if (pinContainer) {
      pinContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Drag-to-scroll momentum
    let isDown = false;
    let startX = 0;
    let scrollLeftPos = 0;
    let isDragging = false;
    let velocity = 0;
    let lastX = 0;

    const onMouseDown = (e) => {
      if (!pinContainer) return;
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.interactive-bar')) return;
      isDown = true;
      isDragging = false;
      startX = e.pageX - pinContainer.offsetLeft;
      scrollLeftPos = pinContainer.scrollLeft;
      lastX = e.pageX;
      gsap.killTweensOf(pinContainer);
      if (cursor) cursor.classList.add('active');
    };

    const onMouseLeaveUp = () => {
      if (isDown && pinContainer) {
        isDown = false;
        if (cursor) cursor.classList.remove('active');
        if (Math.abs(velocity) > 1.5) {
          gsap.to(pinContainer, {
            scrollLeft: pinContainer.scrollLeft - (velocity * 10),
            duration: 0.7,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
      }
    };

    const onMouseMoveDrag = (e) => {
      if (!isDown || !pinContainer) return;
      e.preventDefault();
      const x = e.pageX - pinContainer.offsetLeft;
      const walk = (x - startX) * 1.2;
      if (Math.abs(walk) > 5) isDragging = true;
      velocity = e.pageX - lastX;
      lastX = e.pageX;
      pinContainer.scrollLeft = scrollLeftPos - walk;
    };

    if (pinContainer) {
      pinContainer.addEventListener('mousedown', onMouseDown);
      pinContainer.addEventListener('mouseleave', onMouseLeaveUp);
      pinContainer.addEventListener('mouseup', onMouseLeaveUp);
      pinContainer.addEventListener('mousemove', onMouseMoveDrag);
    }

    // Keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
      if (e.key === 'Escape') {
        setSelectedCaseStudy(null);
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Track active card via scroll position
    const handleScroll = () => {
      if (!pinContainer) return;
      const cards = document.querySelectorAll('.web-card-chassis');
      const containerCenter = pinContainer.scrollLeft + pinContainer.clientWidth / 2;
      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        if (Math.abs(containerCenter - cardCenter) < card.clientWidth * 0.45) {
          setActiveProjectIdx(idx);
        }
      });
    };
    if (pinContainer) {
      pinContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (pinContainer) {
        pinContainer.removeEventListener('wheel', handleWheel);
        pinContainer.removeEventListener('mousedown', onMouseDown);
        pinContainer.removeEventListener('mouseleave', onMouseLeaveUp);
        pinContainer.removeEventListener('mouseup', onMouseLeaveUp);
        pinContainer.removeEventListener('mousemove', onMouseMoveDrag);
        pinContainer.removeEventListener('scroll', handleScroll);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [activeProjectIdx]);

  const toggleDeviceMode = (idx, mode, e) => {
    if (e) e.stopPropagation();
    playSound('click');
    setDeviceMode(prev => ({
      ...prev,
      [idx]: mode
    }));
  };

  const openFullscreen = (proj, e) => {
    if (e) e.stopPropagation();
    playSound('open');
    setFullscreenUrl(proj.url);
    setFullscreenTitle(proj.title);
    setIsFullscreen(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --deep-black: #050505;
          --pure-white: #ffffff;
          --brand-yellow: #ebd73f;
          --glass-bg: rgba(14, 14, 18, 0.7);
          --glass-border: rgba(255, 255, 255, 0.1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          cursor: none;
        }

        body {
          background-color: var(--deep-black);
          color: var(--pure-white);
          font-family: 'Clash Display', sans-serif;
          overflow: hidden;
          overscroll-behavior: none;
          width: 100vw;
          height: 100dvh;
        }

        /* Custom Kinetic Cursor */
        .cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border: 2px solid var(--brand-yellow);
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999;
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s, background-color 0.3s, border-color 0.3s;
        }

        .cursor.active {
          width: 55px;
          height: 55px;
          background-color: rgba(235, 215, 63, 0.15);
          backdrop-filter: blur(4px);
          border-color: var(--brand-yellow);
        }

        @media (pointer: coarse) {
          .cursor { display: none !important; }
          * { cursor: auto !important; }
        }

        /* Navigation Back Button */
        .nav-back {
          position: fixed;
          top: 30px;
          left: 35px;
          z-index: 900;
          color: var(--deep-black) !important;
          background-color: var(--brand-yellow);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(235, 215, 63, 0.4);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease;
        }

        .nav-back:hover {
          transform: scale(1.12);
          background-color: #ffffff;
        }

        /* Modernized Header */
        .portfolio-header {
          position: fixed;
          top: 32px;
          right: 45px;
          z-index: 900;
          text-align: right;
          pointer-events: none;
        }

        .portfolio-header h1 {
          font-family: 'Panchang', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--pure-white);
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .portfolio-header h1 .live-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 12px #10b981;
          animation: livePulse 2s infinite;
        }

        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.5; }
        }

        .portfolio-header p {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.75rem;
          color: var(--brand-yellow);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 4px;
          font-weight: 600;
        }

        /* Ambient Background Grid & Radial Glow */
        .bg-grid {
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 4vw 4vw;
          z-index: 0;
          pointer-events: none;
        }

        .ambient-glow-top {
          position: fixed;
          top: -10vw;
          left: 30vw;
          width: 40vw;
          height: 40vw;
          background: radial-gradient(circle, rgba(235, 215, 63, 0.06) 0%, transparent 70%);
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }

        /* Main Horizontal Sliding Track */
        #pin-container {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100dvh;
          overflow-x: auto;
          overflow-y: hidden;
          z-index: 10;
          display: flex;
          align-items: center;
          scrollbar-width: none;
        }
        #pin-container::-webkit-scrollbar { display: none; }

        .slider-wrap {
          display: flex;
          align-items: center;
          padding: 0 12vw;
          gap: 6vw;
          height: 100%;
          width: max-content;
        }

        /* High-End Glassmorphic Browser Chassis Card */
        .web-card-chassis {
          position: relative;
          width: 72vw;
          max-width: 1100px;
          height: 72dvh;
          min-height: 520px;
          border-radius: 20px;
          background: rgba(12, 12, 16, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease;
          flex-shrink: 0;
        }

        .web-card-chassis:hover {
          border-color: rgba(235, 215, 63, 0.4);
          box-shadow: 0 35px 80px rgba(0, 0, 0, 0.9), 0 0 35px rgba(235, 215, 63, 0.12);
          transform: translateY(-4px);
        }

        /* macOS Window Header Toolbar */
        .browser-toolbar {
          height: 48px;
          background: rgba(20, 20, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
          user-select: none;
          z-index: 20;
        }

        .traffic-lights {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .traffic-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }
        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        .browser-url-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(5, 5, 5, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 5px 16px;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.75);
          font-family: 'Clash Display', sans-serif;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
          text-decoration: none;
        }

        .browser-url-pill:hover {
          border-color: var(--brand-yellow);
          color: #ffffff;
          background: rgba(235, 215, 63, 0.08);
        }

        .browser-url-pill svg {
          width: 13px;
          height: 13px;
          color: #10b981;
        }

        .browser-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-toggle-btn {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          padding: 4px 8px;
          font-size: 0.7rem;
          font-family: 'Panchang', sans-serif;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
        }

        .device-toggle-btn.active, .device-toggle-btn:hover {
          background: rgba(235, 215, 63, 0.18);
          color: var(--brand-yellow);
          border-color: rgba(235, 215, 63, 0.5);
        }

        .icon-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .icon-btn:hover {
          background: var(--brand-yellow);
          color: #050505;
          border-color: var(--brand-yellow);
        }

        /* Viewport Showcase Body */
        .card-viewport-body {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #09090c;
        }

        /* Inner Web Mockup Frame */
        .mockup-stage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .mockup-mobile-frame {
          width: 320px;
          height: 94%;
          border-radius: 36px;
          border: 10px solid #1c1c24;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1);
          overflow: hidden;
          position: relative;
          background: #000;
        }

        /* Bespoke Interactive Vector UI Mockups */
        .bespoke-ui-canvas {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* Hero Banner inside the Mockup */
        .mockup-hero-banner {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px;
          position: relative;
          background-size: cover;
          background-position: center;
        }

        .mockup-brand-glow {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 60%;
          height: 80%;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.25;
          pointer-events: none;
        }

        /* Floating Interactive UI Elements */
        .mockup-floating-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 20px;
          z-index: 5;
        }

        .mockup-stat-card {
          background: rgba(18, 18, 24, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 18px;
          backdrop-filter: blur(15px);
        }

        .mockup-stat-card .val {
          font-family: 'Panchang', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #ffffff;
        }

        .mockup-stat-card .lbl {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Bottom Project Info Overlay & Tech Stack */
        .card-footer-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(8, 8, 12, 0.98) 0%, rgba(8, 8, 12, 0.85) 65%, transparent 100%);
          padding: 30px 40px;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-main-meta {
          max-width: 65%;
        }

        .card-category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(235, 215, 63, 0.12);
          color: var(--brand-yellow);
          border: 1px solid rgba(235, 215, 63, 0.3);
          border-radius: 20px;
          padding: 4px 14px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .card-headline {
          font-family: 'Panchang', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .card-tagline {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
          margin-bottom: 16px;
        }

        .card-tech-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-pill {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.85);
          border-radius: 6px;
          padding: 3px 10px;
          font-size: 0.72rem;
          font-family: 'Clash Display', sans-serif;
          font-weight: 500;
        }

        /* Action Buttons CTA */
        .card-action-group {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-shrink: 0;
        }

        .btn-inspect {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 30px;
          padding: 12px 22px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-inspect:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: #ffffff;
          transform: translateY(-2px);
        }

        .btn-launch {
          background: var(--brand-yellow);
          color: #050505;
          border: 1px solid var(--brand-yellow);
          border-radius: 30px;
          padding: 12px 24px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(235, 215, 63, 0.35);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-launch:hover {
          background: #ffffff;
          border-color: #ffffff;
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
          transform: translateY(-2px) scale(1.03);
        }

        /* Floating Nav Arrows */
        .slider-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: rgba(18, 18, 22, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slider-nav-btn:hover {
          background: var(--brand-yellow);
          color: #050505;
          border-color: var(--brand-yellow);
          transform: translateY(-50%) scale(1.1);
        }
        .nav-prev-btn { left: 35px; }
        .nav-next-btn { right: 35px; }

        /* Bottom Minimal Progress Bar & Indicators */
        .slider-bottom-hud {
          position: fixed;
          bottom: 25px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 20px;
          z-index: 100;
          background: rgba(14, 14, 18, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 20px;
          border-radius: 30px;
          backdrop-filter: blur(15px);
        }

        .hud-dots {
          display: flex;
          gap: 8px;
        }

        .hud-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .hud-dot.active {
          width: 28px;
          border-radius: 10px;
          background: var(--brand-yellow);
          box-shadow: 0 0 10px rgba(235, 215, 63, 0.5);
        }

        .hud-counter {
          font-family: 'Panchang', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--brand-yellow);
          letter-spacing: 2px;
        }

        /* Case Study Slide-out Modal / Drawer */
        .case-study-drawer {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(5, 5, 8, 0.85);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex;
          justify-content: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease;
        }

        .case-study-drawer.open {
          opacity: 1;
          pointer-events: auto;
        }

        .drawer-content {
          width: 55vw;
          max-width: 780px;
          height: 100%;
          background: #0d0d12;
          border-left: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.9);
          padding: 50px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .case-study-drawer.open .drawer-content {
          transform: translateX(0);
        }

        .drawer-close-btn {
          align-self: flex-end;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .drawer-close-btn:hover {
          background: var(--brand-yellow);
          color: #050505;
          transform: scale(1.1);
        }

        /* Fullscreen Live Modal */
        .fs-live-modal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #050505;
          display: flex;
          flex-direction: column;
        }

        .fs-live-bar {
          height: 52px;
          background: #111116;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .fs-live-frame {
          flex: 1;
          width: 100%;
          height: 100%;
          border: none;
          background: #ffffff;
        }

        /* Mobile Responsive Adjustments */
        @media screen and (max-width: 900px) {
          .web-card-chassis {
            width: 88vw;
            height: 76dvh;
          }
          .slider-wrap {
            padding: 0 6vw;
            gap: 5vw;
          }
          .portfolio-header h1 {
            font-size: 1.2rem;
          }
          .card-headline {
            font-size: 1.5rem;
          }
          .card-footer-info {
            padding: 20px;
            flex-direction: column;
            align-items: flex-start;
          }
          .card-main-meta {
            max-width: 100%;
          }
          .card-action-group {
            width: 100%;
            justify-content: space-between;
          }
          .slider-nav-btn {
            display: none;
          }
          .drawer-content {
            width: 100vw;
            padding: 30px 20px;
          }
          .mockup-floating-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}} />

      {/* Custom Cursor */}
      <div className="cursor" id="cursor" />

      {/* Ambient Visual Grid & Glow */}
      <div className="bg-grid" />
      <div className="ambient-glow-top" />

      {/* Navigation Back to Home */}
      <a href="/" className="nav-back" title="Back to Headquarters">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </a>

      {/* Header Info */}
      <div className="portfolio-header">
        <h1>
          <span>{isGenz ? 'digital builds' : 'Web Portfolio'}</span>
          <span className="live-dot" title="Systems Active" />
        </h1>
        <p>{isGenz ? 'interactive flagship code' : 'Bespoke Digital Experiences'}</p>
      </div>

      {/* Floating Prev & Next Arrow Buttons */}
      <button className="slider-nav-btn nav-prev-btn" onClick={prevCard} title="Previous Web Build (←)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button className="slider-nav-btn nav-next-btn" onClick={nextCard} title="Next Web Build (→)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      {/* Bottom Minimal HUD Status */}
      <div className="slider-bottom-hud">
        <div className="hud-dots">
          {projects.map((_, i) => (
            <div 
              key={i} 
              className={`hud-dot ${activeProjectIdx === i ? 'active' : ''}`}
              onClick={() => scrollToCard(i)}
            />
          ))}
        </div>
        <div className="hud-counter">
          {(activeProjectIdx + 1).toString().padStart(2, '0')} / {projects.length.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div id="pin-container">
        <div className="slider-wrap">
          {projects.map((proj, idx) => {
            const currentMode = deviceMode[idx] || 'desktop';
            const isMobileView = currentMode === 'mobile';

            return (
              <div key={proj.id} className="web-card-chassis">
                {/* macOS Style Browser Header */}
                <div className="browser-toolbar">
                  <div className="traffic-lights">
                    <div className="traffic-dot dot-red" />
                    <div className="traffic-dot dot-yellow" />
                    <div className="traffic-dot dot-green" />
                  </div>

                  <a 
                    href={proj.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="browser-url-pill"
                    onClick={() => playSound('click')}
                    title={`Open ${proj.displayUrl} in New Tab`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>https://{proj.displayUrl}</span>
                  </a>

                  <div className="browser-actions">
                    <button 
                      className={`device-toggle-btn ${!isMobileView ? 'active' : ''}`}
                      onClick={(e) => toggleDeviceMode(idx, 'desktop', e)}
                      title="Desktop View"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </button>
                    <button 
                      className={`device-toggle-btn ${isMobileView ? 'active' : ''}`}
                      onClick={(e) => toggleDeviceMode(idx, 'mobile', e)}
                      title="Mobile View"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                    </button>
                    <button 
                      className="icon-btn" 
                      onClick={(e) => openFullscreen(proj, e)}
                      title="Maximize Fullscreen Experience"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Viewport Body with Bespoke Vector Showcase & Smart Fallback */}
                <div className="card-viewport-body">
                  <div className={`mockup-stage ${isMobileView ? 'mockup-mobile-frame' : ''}`}>
                    <div className="bespoke-ui-canvas" style={{ background: proj.gradient }}>
                      <div className="mockup-brand-glow" style={{ background: proj.color }} />

                      <div className="mockup-hero-banner">
                        <div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            padding: '6px 14px',
                            borderRadius: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontFamily: 'Panchang, sans-serif',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            marginBottom: '16px'
                          }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color }} />
                            {proj.status}
                          </div>

                          <h3 style={{
                            fontFamily: 'Panchang, sans-serif',
                            fontSize: isMobileView ? '1.4rem' : '2.4rem',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.5px',
                            textTransform: 'uppercase',
                            maxWidth: '700px',
                            lineHeight: 1.15
                          }}>
                            {proj.title}
                          </h3>
                        </div>

                        {/* Interactive UI Metric Grid */}
                        <div className="mockup-floating-grid">
                          {proj.stats.map((st, sIdx) => (
                            <div key={sIdx} className="mockup-stat-card">
                              <div className="val" style={{ color: proj.color }}>{st.value}</div>
                              <div className="lbl">{st.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Meta & Action Footer */}
                  <div className="card-footer-info">
                    <div className="card-main-meta">
                      <div className="card-category-badge">
                        <span>●</span>
                        <span>{proj.category}</span>
                      </div>
                      <div className="card-headline">{proj.title}</div>
                      <div className="card-tagline">{proj.tagline}</div>
                      <div className="card-tech-pills">
                        {proj.techStack.map((tech, tIdx) => (
                          <span key={tIdx} className="tech-pill">{tech}</span>
                        ))}
                      </div>
                    </div>

                    <div className="card-action-group">
                      <button 
                        className="btn-inspect" 
                        onClick={() => {
                          playSound('open');
                          setSelectedCaseStudy(proj);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>Case Study</span>
                      </button>

                      <a 
                        href={proj.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-launch"
                        onClick={() => playSound('click')}
                      >
                        <span>Experience</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Case Study Slide-out Drawer */}
      <div 
        className={`case-study-drawer ${selectedCaseStudy ? 'open' : ''}`}
        onClick={() => setSelectedCaseStudy(null)}
      >
        <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
          {selectedCaseStudy && (
            <>
              <div>
                <button 
                  className="drawer-close-btn" 
                  onClick={() => setSelectedCaseStudy(null)}
                  title="Close Case Study (Esc)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <div style={{ marginTop: '20px' }}>
                  <div className="card-category-badge">{selectedCaseStudy.category}</div>
                  <h2 style={{
                    fontFamily: 'Panchang, sans-serif',
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                    marginBottom: '12px'
                  }}>
                    {selectedCaseStudy.title}
                  </h2>
                  <p style={{
                    fontSize: '1.1rem',
                    color: 'var(--brand-yellow)',
                    marginBottom: '35px',
                    lineHeight: 1.4
                  }}>
                    {selectedCaseStudy.tagline}
                  </p>

                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{
                      fontFamily: 'Panchang, sans-serif',
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '10px'
                    }}>THE CHALLENGE</h4>
                    <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.85)' }}>
                      {selectedCaseStudy.challenge}
                    </p>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{
                      fontFamily: 'Panchang, sans-serif',
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '10px'
                    }}>THE SOLUTION & ARCHITECTURE</h4>
                    <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.85)' }}>
                      {selectedCaseStudy.solution}
                    </p>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <h4 style={{
                      fontFamily: 'Panchang, sans-serif',
                      fontSize: '0.8rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>CORE TECHNOLOGIES</h4>
                    <div className="card-tech-pills">
                      {selectedCaseStudy.techStack.map((tech, i) => (
                        <span key={i} className="tech-pill" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>{tech}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                paddingTop: '25px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.75rem', color: '#10b981' }}>
                  ● PRODUCTION DEPLOYED
                </div>
                <a 
                  href={selectedCaseStudy.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-launch"
                  onClick={() => playSound('click')}
                >
                  <span>Launch Live Platform</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen Live Modal */}
      {isFullscreen && (
        <div className="fs-live-modal">
          <div className="fs-live-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="traffic-lights">
                <div className="traffic-dot dot-red" />
                <div className="traffic-dot dot-yellow" />
                <div className="traffic-dot dot-green" />
              </div>
              <span style={{ fontFamily: 'Panchang, sans-serif', fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                {fullscreenTitle}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a 
                href={fullscreenUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-inspect" 
                style={{ padding: '6px 14px', fontSize: '0.65rem' }}
              >
                Open in External Tab ↗
              </a>
              <button 
                className="drawer-close-btn" 
                style={{ width: 34, height: 34 }} 
                onClick={() => setIsFullscreen(false)}
                title="Close Fullscreen"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe 
            src={fullscreenUrl} 
            className="fs-live-frame" 
            title={fullscreenTitle}
            allow="fullscreen"
          />
        </div>
      )}
    </>
  );
}
