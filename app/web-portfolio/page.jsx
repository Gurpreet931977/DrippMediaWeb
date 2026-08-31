'use client';
import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGenz } from '../contexts/GenzContext';

const DEFAULT_PROJECTS = [
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

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);

  const audioCtxRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const hudRef = useRef(null);
  const dotsTrackRef = useRef(null);
  const isDotsDraggingRef = useRef(false);

  // Synchronize live web projects with database API
  useEffect(() => {
    fetch('/api/web')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
        }
      })
      .catch(() => {});
  }, []);

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
        duration: 0.6,
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
          duration: 0.12,
          ease: "power2.out"
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    const pinContainer = document.getElementById('pin-container');
    const dotsTrackElement = dotsTrackRef.current;

    // Custom wheel / trackpad horizontal scrolling
    const handleWheel = (e) => {
      const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
      if (Math.abs(delta) > 0 && pinContainer) {
        e.preventDefault();
        gsap.to(pinContainer, {
          scrollLeft: pinContainer.scrollLeft + delta * 2.5,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    };
    if (pinContainer) {
      pinContainer.addEventListener('wheel', handleWheel, { passive: false });
    }

    // Magnetic snap helper
    const snapToNearestCard = () => {
      if (!pinContainer) return;
      const cards = document.querySelectorAll('.web-card-chassis');
      if (!cards.length) return;
      const containerCenter = pinContainer.scrollLeft + pinContainer.clientWidth / 2;
      let closestIdx = 0;
      let minDiff = Infinity;
      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.clientWidth / 2;
        const diff = Math.abs(containerCenter - cardCenter);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      scrollToCard(closestIdx);
    };

    // 1. Full-scene hold-and-drag physics
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let lastMoveX = 0;
    let velocity = 0;
    let totalMoved = 0;

    const onPointerDown = (e) => {
      if (!pinContainer) return;
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.slider-bottom-hud')) return;
      isDown = true;
      hasDraggedRef.current = false;
      totalMoved = 0;
      startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      lastMoveX = startX;
      scrollStart = pinContainer.scrollLeft;
      velocity = 0;
      gsap.killTweensOf(pinContainer);
      if (cursor) cursor.classList.add('grabbing');
    };

    const onPointerMove = (e) => {
      if (!isDown || !pinContainer) return;
      const currentX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const deltaX = currentX - lastMoveX;
      totalMoved += Math.abs(currentX - startX);
      if (totalMoved > 8) {
        hasDraggedRef.current = true;
      }
      velocity = deltaX;
      lastMoveX = currentX;
      pinContainer.scrollLeft = scrollStart - (currentX - startX);
    };

    const onPointerUp = () => {
      if (isDown && pinContainer) {
        isDown = false;
        if (cursor) cursor.classList.remove('grabbing');
        if (Math.abs(velocity) > 6) {
          if (velocity < 0) {
            nextCard();
          } else {
            prevCard();
          }
        } else {
          snapToNearestCard();
        }
      }
    };

    // 2. Dots Track Scrubbing Physics (Scoped exclusively to the dots track)
    let isDotsDown = false;
    let lastScrubbedIdx = -1;

    const scrubToDotFromPointer = (clientX) => {
      if (!dotsTrackElement || !projects.length) return;
      const rect = dotsTrackElement.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetIdx = Math.max(0, Math.min(projects.length - 1, Math.floor(progress * projects.length)));
      if (targetIdx !== lastScrubbedIdx) {
        lastScrubbedIdx = targetIdx;
        scrollToCard(targetIdx);
      }
    };

    const onDotsDown = (e) => {
      e.stopPropagation();
      isDotsDown = true;
      isDotsDraggingRef.current = true;
      dotsTrackElement?.classList.add('dots-scrubbing');
      if (cursor) cursor.classList.add('grabbing');
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      scrubToDotFromPointer(clientX);
    };

    const onDotsMove = (e) => {
      if (!isDotsDown) return;
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      scrubToDotFromPointer(clientX);
    };

    const onDotsUp = () => {
      if (isDotsDown) {
        isDotsDown = false;
        isDotsDraggingRef.current = false;
        dotsTrackElement?.classList.remove('dots-scrubbing');
        if (cursor) cursor.classList.remove('grabbing');
        lastScrubbedIdx = -1;
      }
    };

    // Event listeners
    if (pinContainer) {
      pinContainer.addEventListener('mousedown', onPointerDown);
      pinContainer.addEventListener('touchstart', onPointerDown, { passive: true });
    }
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    if (dotsTrackElement) {
      dotsTrackElement.addEventListener('mousedown', onDotsDown);
      dotsTrackElement.addEventListener('touchstart', onDotsDown, { passive: true });
    }
    window.addEventListener('mousemove', onDotsMove);
    window.addEventListener('touchmove', onDotsMove, { passive: false });
    window.addEventListener('mouseup', onDotsUp);
    window.addEventListener('touchend', onDotsUp);

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
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('mousemove', onDotsMove);
      window.removeEventListener('touchmove', onDotsMove);
      window.removeEventListener('mouseup', onDotsUp);
      window.removeEventListener('touchend', onDotsUp);
      window.removeEventListener('keydown', handleKeyDown);

      if (pinContainer) {
        pinContainer.removeEventListener('wheel', handleWheel);
        pinContainer.removeEventListener('mousedown', onPointerDown);
        pinContainer.removeEventListener('touchstart', onPointerDown);
        pinContainer.removeEventListener('scroll', handleScroll);
      }
      if (dotsTrackElement) {
        dotsTrackElement.removeEventListener('mousedown', onDotsDown);
        dotsTrackElement.removeEventListener('touchstart', onDotsDown);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [projects]);

  const handleCardClick = (proj, e) => {
    // If a drag took place, suppress link redirect
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
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

        .cursor.grabbing {
          width: 52px;
          height: 52px;
          background-color: rgba(235, 215, 63, 0.25);
          backdrop-filter: blur(4px);
          border-color: var(--brand-yellow);
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.4);
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
          padding: 0 11vw;
          gap: 5vw;
          height: 100%;
          width: max-content;
        }

        /* High-End Futuristic Monolithic Cyber-Canvas Card */
        .web-card-chassis {
          position: relative;
          width: 78vw;
          max-width: 1220px;
          height: 68dvh;
          max-height: 630px;
          min-height: 480px;
          margin-top: 15px;
          border-radius: 24px;
          background: #08080c;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease, box-shadow 0.4s ease;
          flex-shrink: 0;
        }

        .web-card-chassis:hover {
          border-color: rgba(235, 215, 63, 0.6);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.95), 0 0 45px rgba(235, 215, 63, 0.2);
          transform: translateY(-8px) scale(1.015);
        }

        /* Cyber Corner Holographic Hairline Brackets */
        .corner-bracket {
          position: absolute;
          width: 16px;
          height: 16px;
          pointer-events: none;
          z-index: 25;
          opacity: 0.35;
          transition: all 0.35s ease;
        }
        .bracket-tl { top: 14px; left: 14px; border-top: 2px solid #ffffff; border-left: 2px solid #ffffff; }
        .bracket-tr { top: 14px; right: 14px; border-top: 2px solid #ffffff; border-right: 2px solid #ffffff; }
        .bracket-bl { bottom: 14px; left: 14px; border-bottom: 2px solid #ffffff; border-left: 2px solid #ffffff; }
        .bracket-br { bottom: 14px; right: 14px; border-bottom: 2px solid #ffffff; border-right: 2px solid #ffffff; }

        .web-card-chassis:hover .corner-bracket {
          opacity: 1;
          border-color: var(--brand-yellow);
          filter: drop-shadow(0 0 6px rgba(235, 215, 63, 0.8));
        }

        /* Floating Top Cyber-HUD Header */
        .card-top-hud {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
          pointer-events: none;
          background: linear-gradient(to bottom, rgba(6, 6, 10, 0.85) 0%, rgba(6, 6, 10, 0.4) 60%, transparent 100%);
        }

        .hud-index-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(12, 12, 18, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 30px;
          padding: 6px 14px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          letter-spacing: 1.5px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }

        .hud-sparkle {
          color: var(--brand-yellow);
          font-size: 0.7rem;
        }

        .hud-domain-capsule {
          pointer-events: auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(14, 14, 20, 0.75);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 30px;
          padding: 6px 16px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .domain-live-pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--brand-yellow);
          box-shadow: 0 0 10px var(--brand-yellow);
          animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.4); opacity: 1; filter: drop-shadow(0 0 6px var(--brand-yellow)); }
        }

        .web-card-chassis:hover .hud-domain-capsule {
          border-color: var(--brand-yellow);
          background: rgba(235, 215, 63, 0.16);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(235, 215, 63, 0.3);
        }

        .domain-arrow {
          transition: transform 0.3s ease;
          color: var(--brand-yellow);
        }

        .web-card-chassis:hover .domain-arrow {
          transform: translate(2px, -2px);
        }

        /* Viewport Showcase Body (Edge-to-edge frameless) */
        .card-viewport-body {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #050508;
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
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease;
          will-change: transform;
        }

        .web-card-chassis:hover .screenshot-img {
          transform: scale(1.04) translateY(-6px);
          filter: brightness(1.06) contrast(1.02);
        }

        /* Floating Center Telemetry Crosshair / Explore Beacon */
        .hover-beacon-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(5, 5, 8, 0.25) 0%, rgba(5, 5, 8, 0.55) 80%);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 8;
        }

        .web-card-chassis:hover .hover-beacon-overlay {
          opacity: 1;
        }

        .hover-launch-badge {
          background: rgba(10, 10, 15, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--brand-yellow);
          color: #ffffff;
          padding: 12px 26px;
          border-radius: 40px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(235, 215, 63, 0.35);
          transform: translateY(20px) scale(0.92);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .web-card-chassis:hover .hover-launch-badge {
          transform: translateY(0) scale(1);
        }

        /* Bottom Project Info Overlay & Tech Stack */
        .card-footer-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(8, 8, 12, 0.98) 0%, rgba(8, 8, 12, 0.9) 60%, rgba(8, 8, 12, 0.4) 85%, transparent 100%);
          padding: 22px 30px;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          border-top: none;
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
          gap: 8px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .btn-case-study .case-study-icon {
          color: var(--brand-yellow);
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.35s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-case-study:hover {
          background: rgba(235, 215, 63, 0.18);
          border-color: var(--brand-yellow);
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(235, 215, 63, 0.25);
        }

        .btn-case-study:hover .case-study-icon {
          transform: rotate(90deg) scale(1.3);
          filter: drop-shadow(0 0 8px rgba(235, 215, 63, 0.9));
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

        /* Minimalist Side Floating Arrows */
        .slider-nav-btn {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(14, 14, 18, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .slider-nav-btn:hover {
          background: rgba(235, 215, 63, 0.15);
          color: var(--brand-yellow);
          border-color: rgba(235, 215, 63, 0.5);
          transform: translateY(-50%) scale(1.14);
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.25);
        }
        .nav-prev-btn { left: 24px; }
        .nav-next-btn { right: 24px; }

        /* Unified Single Bottom Minimal HUD (Hold and Draggable Scrubber) */
        .slider-bottom-hud {
          position: fixed;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 100;
          background: rgba(14, 14, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 8px 22px;
          border-radius: 30px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          white-space: nowrap;
          cursor: grab;
          user-select: none;
          touch-action: none;
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .slider-bottom-hud:hover {
          border-color: rgba(235, 215, 63, 0.35);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(235, 215, 63, 0.12);
        }
        .slider-bottom-hud.hud-dragging {
          cursor: grabbing !important;
          border-color: rgba(235, 215, 63, 0.6) !important;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.9), 0 0 30px rgba(235, 215, 63, 0.25) !important;
          transform: translateX(-50%) scale(1.02) !important;
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
          gap: 10px;
          align-items: center;
          padding: 6px 10px;
          cursor: pointer;
          user-select: none;
          touch-action: none;
        }

        .hud-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          position: relative;
          display: inline-block;
        }

        /* Generous invisible hit target around each dot for effortless clicking */
        .hud-dot::before {
          content: '';
          position: absolute;
          inset: -12px -8px;
          cursor: pointer;
        }

        .hud-dot:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: scale(1.35);
        }

        .hud-dot.active {
          width: 28px;
          border-radius: 12px;
          background: var(--brand-yellow);
          box-shadow: 0 0 14px rgba(235, 215, 63, 0.7);
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

      {/* Floating Minimal Side Arrows */}
      <button className="slider-nav-btn nav-prev-btn" onClick={prevCard} title="Previous Web Build (←)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <button className="slider-nav-btn nav-next-btn" onClick={nextCard} title="Next Web Build (→)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      {/* Unified Single Bottom Minimal HUD */}
      <div className="slider-bottom-hud" ref={hudRef}>
        <span className="hud-archive-badge">✦ CURATED ARCHIVE</span>
        <span className="hud-archive-text">Hand-picked public builds</span>
        <div className="hud-divider" />
        <div className="hud-dots" ref={dotsTrackRef} title="Click any dot to jump">
          {projects.map((_, i) => (
            <div 
              key={i} 
              className={`hud-dot ${activeProjectIdx === i ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                scrollToCard(i);
              }}
              title={`Jump to build 0${i + 1}`}
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
              {/* Corner Cyber Brackets */}
              <div className="corner-bracket bracket-tl" />
              <div className="corner-bracket bracket-tr" />
              <div className="corner-bracket bracket-bl" />
              <div className="corner-bracket bracket-br" />

              {/* Floating Cyber Telemetry Header */}
              <div className="card-top-hud">
                <div className="hud-index-badge">
                  <span className="hud-sparkle">✦</span>
                  <span>{String(idx + 1).padStart(2, '0')} // ARCHIVE</span>
                </div>

                <div 
                  className="hud-domain-capsule"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(proj.url, '_blank', 'noopener,noreferrer');
                  }}
                  title={`Launch https://${proj.displayUrl}`}
                >
                  <span className="domain-live-pulse" />
                  <span className="domain-text">{proj.displayUrl}</span>
                  <svg className="domain-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>
              </div>

              {/* Viewport Body with Real Website Screenshot & Kinetic Hover */}
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
                      <span>✦ EXPLORE BUILD</span>
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
                      <span>✦</span>
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
                      title={`Open ${proj.title} Architectural Case Study`}
                    >
                      <span className="case-study-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"></path>
                        </svg>
                      </span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div className="card-category-badge" style={{ margin: 0 }}>{selectedCaseStudy.category}</div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(235, 215, 63, 0.1)',
                      border: '1px solid rgba(235, 215, 63, 0.25)',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontFamily: 'Panchang, sans-serif',
                      fontSize: '0.58rem',
                      color: 'var(--brand-yellow)',
                      fontWeight: 700,
                      letterSpacing: '1px'
                    }}>
                      ✦ ORLO AI ARCHITECTURAL BLUEPRINT
                    </div>
                  </div>
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
