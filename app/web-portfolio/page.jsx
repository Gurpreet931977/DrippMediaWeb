'use client';
import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGenz } from '../contexts/GenzContext';

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);

  const audioCtxRef = useRef(null);

  const projects = [
    {
      id: 'bharatup',
      title: 'BharatUp',
      tagline: 'A Home for Businesses Building What Comes Next',
      category: 'Enterprise Digital Platform',
      badge: 'Business Tech',
      desc: 'A high-performance digital presence engineered for business growth, high concurrency, and seamless client engagement.',
      url: 'https://www.bharatup.online/',
      displayUrl: 'bharatup.online',
      image: '/images/web-portfolio/bharatup.jpg',
      color: '#3b82f6',
      stats: [
        { label: 'Lighthouse Score', value: '99/100' },
        { label: 'Active Reach', value: '25K+' },
        { label: 'Page Load Speed', value: '0.4s' }
      ],
      techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
      challenge: 'Creating a high-credibility digital gateway that communicates modern business acceleration with sub-second performance.',
      solution: 'We architected a lightweight, server-rendered Next.js application with edge caching, dark aesthetic, and frictionless responsiveness.'
    },
    {
      id: 'pinaka',
      title: 'Pinaka Care Clinic',
      tagline: 'Skin, Laser & Dermatology Clinic in South Bopal, Ahmedabad',
      category: 'Healthcare & Clinical Web',
      badge: 'Healthcare',
      desc: 'A clinical healthcare platform built to streamline patient consultation bookings, doctor profiles, and multi-specialty dermatology services.',
      url: 'https://www.pinakacareclinic.com/',
      displayUrl: 'pinakacareclinic.com',
      image: '/images/web-portfolio/pinakacare.jpg',
      color: '#10b981',
      stats: [
        { label: 'Booking Conversion', value: '+340%' },
        { label: 'Mobile Readiness', value: '100%' },
        { label: 'TTFB Server Latency', value: '0.28s' }
      ],
      techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
      challenge: 'Medical clinics often suffer from confusing appointment layouts and outdated interfaces that reduce patient trust.',
      solution: 'Designed a soothing, high-trust visual language with instant slot booking, clean treatment catalog, and fast mobile intake.'
    },
    {
      id: 'goatsociety',
      title: 'Goat Society',
      tagline: 'Authentic Decanted Fragrances & Lifestyle E-Commerce',
      category: 'Luxury Fragrance & Commerce',
      badge: 'Luxury E-Com',
      desc: 'An exclusive e-commerce boutique featuring 100% authentic decanted fragrances, sterile extraction standards, and sleek catalog navigation.',
      url: 'https://goatsociety.in/',
      displayUrl: 'goatsociety.in',
      image: '/images/web-portfolio/goatsociety.jpg',
      color: '#f59e0b',
      stats: [
        { label: 'Catalog Performance', value: '60 FPS' },
        { label: 'User Retention', value: '+220%' },
        { label: 'Checkout Speed', value: '< 2s' }
      ],
      techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
      challenge: 'Creating a high-end luxury aesthetic that showcases perfume notes and sizes clearly without slowing down mobile catalog scrolling.',
      solution: 'Crafted minimal typography, high-res visual product cards, and instant decant size selectors for maximum checkout efficiency.'
    },
    {
      id: 'rasmlai',
      title: 'Rasmlai AI',
      tagline: 'A Safe Space to Express Every Emotion • AI Companion for Wellness',
      category: 'AI Companion & Product Web',
      badge: 'AI Application',
      desc: 'A voice-first AI companion workspace engineered to help users process feelings, express emotions, and engage in reflective dialogue.',
      url: 'https://rasmlai.vercel.app/',
      displayUrl: 'rasmlai.vercel.app',
      image: '/images/web-portfolio/rasmlai.jpg',
      color: '#8b5cf6',
      stats: [
        { label: 'AI Response Latency', value: '12ms' },
        { label: 'Architecture', value: 'Edge AI' },
        { label: 'Lighthouse Score', value: '100/100' }
      ],
      techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
      challenge: 'Creating a calming, intimate digital environment where users feel secure expressing deep emotions.',
      solution: 'Engineered an ultra-clean, minimal interface with fluid animations, intuitive voice prompts, and zero friction onboarding.'
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
      if (e.target.closest('button') || e.target.closest('a')) return;
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

  const handleCardClick = (proj, e) => {
    // If user clicked inside the Case Study button, don't redirect to external site
    if (e.target.closest('.btn-case-study') || e.target.closest('.case-study-prevent')) {
      return;
    }
    playSound('click');
    window.open(proj.url, '_blank', 'noopener,noreferrer');
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
          top: 25px;
          left: 30px;
          z-index: 900;
          color: var(--deep-black) !important;
          background-color: var(--brand-yellow);
          width: 44px;
          height: 44px;
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

        /* High-End Editorial Header */
        .portfolio-header {
          position: fixed;
          top: 24px;
          right: 35px;
          z-index: 900;
          text-align: right;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .header-kicker {
          font-family: 'Panchang', sans-serif;
          font-size: 0.58rem;
          font-weight: 700;
          letter-spacing: 3px;
          color: rgba(255, 255, 255, 0.45);
          text-transform: uppercase;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .header-kicker::before {
          content: '//';
          color: var(--brand-yellow);
          font-weight: 800;
        }

        .portfolio-header h1 {
          font-family: 'Panchang', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--pure-white);
          line-height: 1.1;
          text-shadow: 0 4px 25px rgba(0, 0, 0, 0.9);
        }

        .portfolio-header p {
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          color: var(--brand-yellow);
          letter-spacing: 3.5px;
          text-transform: uppercase;
          margin-top: 5px;
          font-weight: 700;
          opacity: 0.95;
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
          padding: 0 14vw;
          gap: 6vw;
          height: 100%;
          width: max-content;
        }

        /* High-End Glassmorphic Browser Chassis Card with Guaranteed Clearance */
        .web-card-chassis {
          position: relative;
          width: 70vw;
          max-width: 1020px;
          height: 60dvh;
          max-height: 520px;
          min-height: 400px;
          margin-top: 25px;
          border-radius: 18px;
          background: rgba(12, 12, 16, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease;
          flex-shrink: 0;
        }

        .web-card-chassis:hover {
          border-color: rgba(235, 215, 63, 0.5);
          box-shadow: 0 35px 85px rgba(0, 0, 0, 0.95), 0 0 35px rgba(235, 215, 63, 0.16);
          transform: translateY(-6px) scale(1.01);
        }

        /* macOS Window Header Toolbar (Clean without extra badges) */
        .browser-toolbar {
          height: 44px;
          background: rgba(20, 20, 26, 0.98);
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
          gap: 7px;
          align-items: center;
          width: 80px;
        }

        .traffic-dot {
          width: 11px;
          height: 11px;
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 4px 16px;
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.85);
          font-family: 'Clash Display', sans-serif;
          letter-spacing: 0.5px;
          transition: all 0.25s ease;
        }

        .web-card-chassis:hover .browser-url-pill {
          border-color: var(--brand-yellow);
          color: #ffffff;
          background: rgba(235, 215, 63, 0.12);
        }

        .browser-url-pill svg {
          width: 12px;
          height: 12px;
          color: #10b981;
        }

        .toolbar-spacer {
          width: 80px;
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

        /* Real Screenshot Container with Kinetic Hover-Parallax */
        .screenshot-viewport {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .screenshot-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease;
          will-change: transform;
        }

        .web-card-chassis:hover .screenshot-img {
          transform: scale(1.03) translateY(-8px);
          filter: brightness(1.05);
        }

        /* Floating Click-to-Redirect Center Beacon Badge */
        .hover-beacon-overlay {
          position: absolute;
          inset: 0;
          background: rgba(5, 5, 8, 0.35);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.35s ease;
          pointer-events: none;
          z-index: 8;
        }

        .web-card-chassis:hover .hover-beacon-overlay {
          opacity: 1;
        }

        .hover-launch-badge {
          background: rgba(14, 14, 20, 0.9);
          border: 1px solid var(--brand-yellow);
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 40px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(235, 215, 63, 0.3);
          transform: translateY(15px);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .web-card-chassis:hover .hover-launch-badge {
          transform: translateY(0);
        }

        /* Bottom Project Info Overlay & Tech Stack */
        .card-footer-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(8, 8, 12, 0.98) 0%, rgba(8, 8, 12, 0.88) 65%, transparent 100%);
          padding: 20px 30px;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          pointer-events: auto;
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
          padding: 3px 12px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .card-headline {
          font-family: 'Panchang', sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.1;
          letter-spacing: -0.5px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .card-tagline {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.35;
          margin-bottom: 12px;
        }

        .card-tech-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tech-pill {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.9);
          border-radius: 6px;
          padding: 3px 9px;
          font-size: 0.7rem;
          font-family: 'Clash Display', sans-serif;
          font-weight: 500;
        }

        /* Action Buttons CTA */
        .card-action-group {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-shrink: 0;
        }

        .btn-case-study {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 30px;
          padding: 10px 18px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-case-study:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffffff;
          transform: translateY(-2px);
        }

        .btn-launch-pill {
          background: var(--brand-yellow);
          color: #050505;
          border: 1px solid var(--brand-yellow);
          border-radius: 30px;
          padding: 10px 20px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(235, 215, 63, 0.35);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .web-card-chassis:hover .btn-launch-pill {
          background: #ffffff;
          border-color: #ffffff;
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
          transform: translateY(-2px) scale(1.04);
        }

        /* Floating Nav Arrows */
        .slider-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
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
        .nav-prev-btn { left: 30px; }
        .nav-next-btn { right: 30px; }

        /* Unified Single Bottom Minimal HUD (Zero Overlap Guaranteed) */
        .slider-bottom-hud {
          position: fixed;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 100;
          background: rgba(14, 14, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 8px 22px;
          border-radius: 30px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          white-space: nowrap;
        }

        .hud-archive-badge {
          font-family: 'Panchang', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          color: var(--brand-yellow);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .hud-archive-text {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.3px;
        }

        .hud-divider {
          width: 1px;
          height: 14px;
          background: rgba(255, 255, 255, 0.15);
        }

        .hud-dots {
          display: flex;
          gap: 7px;
          align-items: center;
        }

        .hud-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          transition: all 0.3s ease;
        }

        .hud-dot.active {
          width: 24px;
          border-radius: 10px;
          background: var(--brand-yellow);
          box-shadow: 0 0 10px rgba(235, 215, 63, 0.5);
        }

        .hud-counter {
          font-family: 'Panchang', sans-serif;
          font-size: 0.68rem;
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
          padding: 45px;
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
          width: 42px;
          height: 42px;
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

        /* Mobile Responsive Adjustments */
        @media screen and (max-width: 900px) {
          .web-card-chassis {
            width: 88vw;
            height: 68dvh;
            margin-top: 35px;
          }
          .slider-wrap {
            padding: 0 6vw;
            gap: 5vw;
          }
          .portfolio-header h1 {
            font-size: 1.15rem;
          }
          .card-headline {
            font-size: 1.4rem;
          }
          .card-footer-info {
            padding: 16px;
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
          .hud-archive-text {
            display: none;
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

      {/* High-End Editorial Header Info (Generous space from cards) */}
      <div className="portfolio-header">
        <div className="header-kicker">{isGenz ? 'flagship production' : 'Bespoke Production'}</div>
        <h1>{isGenz ? 'web builds' : 'Web Portfolio'}</h1>
        <p>{isGenz ? 'interactive digital experiences' : 'Interactive Experiences'}</p>
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

      {/* Unified Single Bottom Minimal HUD with Integrated Curated Notice */}
      <div className="slider-bottom-hud">
        <span className="hud-archive-badge">✦ CURATED ARCHIVE</span>
        <span className="hud-archive-text">Hand-picked public builds</span>
        <div className="hud-divider" />
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
          {projects.map((proj, idx) => (
            <div 
              key={proj.id} 
              className="web-card-chassis"
              onClick={(e) => handleCardClick(proj, e)}
              title={`Click to open ${proj.displayUrl} live site`}
            >
              {/* macOS Style Browser Header (Clean with no LIVE SITE text) */}
              <div className="browser-toolbar">
                <div className="traffic-lights">
                  <div className="traffic-dot dot-red" />
                  <div className="traffic-dot dot-yellow" />
                  <div className="traffic-dot dot-green" />
                </div>

                <div className="browser-url-pill">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>https://{proj.displayUrl}</span>
                </div>

                <div className="toolbar-spacer" />
              </div>

              {/* Viewport Body with Real Website Screenshot & Hover Reveal */}
              <div className="card-viewport-body">
                <div className="screenshot-viewport">
                  <img 
                    src={proj.image} 
                    alt={`${proj.title} Website Screenshot`} 
                    className="screenshot-img"
                    loading="lazy"
                  />
                  
                  {/* Hover Floating Launch Beacon */}
                  <div className="hover-beacon-overlay">
                    <div className="hover-launch-badge">
                      <span>Visit Live Website</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
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
                      className="btn-case-study case-study-prevent" 
                      onClick={(e) => {
                        e.stopPropagation();
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

                    <div className="btn-launch-pill">
                      <span>Launch Live</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                  className="btn-launch-pill"
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
    </>
  );
}
