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
    color: '#ebd73f',
    stats: [
      { label: 'Page Load Time', value: '0.40s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+280%' }
    ],
    techStack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Framer Motion'],
    challenge: 'Building a modern, credible online presence for growing businesses that loads instantly and stands out from standard templates.',
    solution: 'We designed a custom, fast website with smooth animations, high-converting layouts, and effortless mobile browsing.'
  },
  {
    id: 'pinaka',
    title: 'Pinaka Care Clinic',
    tagline: 'Skin, Laser & Dermatology Clinic in South Bopal, Ahmedabad',
    category: 'Healthcare & Clinical Web',
    badge: 'Healthcare',
    desc: 'A modern medical clinic website built to help patients easily discover treatments, view doctor profiles, and book appointments online.',
    url: 'https://www.pinakacareclinic.com/',
    displayUrl: 'pinakacareclinic.com',
    image: '/images/web-portfolio/pinakacare.jpg',
    color: '#ebd73f',
    stats: [
      { label: 'Page Load Time', value: '0.28s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+340%' }
    ],
    techStack: ['Next.js', 'React 18', 'Tailwind CSS', 'Framer Motion', 'Cloudflare Edge'],
    challenge: 'Traditional clinic websites are often cluttered and confusing, making it difficult for patients to quickly book an appointment.',
    solution: 'We built a soothing, high-trust website where patients can explore treatments and book a doctor consultation in just a few taps.'
  },
  {
    id: 'goatsociety',
    title: 'Goat Society',
    tagline: 'Authentic Decanted Fragrances & Lifestyle E-Commerce',
    category: 'Luxury Fragrance & Commerce',
    badge: 'Luxury E-Com',
    desc: 'An online fragrance store featuring authentic luxury perfumes, easy size selection, and smooth mobile checkout.',
    url: 'https://goatsociety.in/',
    displayUrl: 'goatsociety.in',
    image: '/images/web-portfolio/goatsociety.jpg',
    color: '#ebd73f',
    stats: [
      { label: 'Page Load Time', value: '0.35s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+220%' }
    ],
    techStack: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'E-Commerce Core', 'Cloudflare CDN'],
    challenge: 'Showcasing luxury perfumes with clear bottle size options without slowing down the shopping experience on phones.',
    solution: 'We designed an elegant storefront with crisp product photos, 1-tap size pickers, and a fast, friction-free checkout.'
  },
  {
    id: 'rasmlai',
    title: 'Rasmlai AI',
    tagline: 'A Safe Space to Express Every Emotion • AI Companion for Wellness',
    category: 'AI Companion & Product Web',
    badge: 'AI Application',
    desc: 'A private, voice-first AI companion website designed to help people express feelings, talk through ideas, and feel supported.',
    url: 'https://rasmlai.vercel.app/',
    displayUrl: 'rasmlai.vercel.app',
    image: '/images/web-portfolio/rasmlai.jpg',
    color: '#ebd73f',
    stats: [
      { label: 'Page Load Time', value: '0.32s' },
      { label: 'SEO Score', value: '100%' },
      { label: 'Conversion Growth', value: '+310%' }
    ],
    techStack: ['Next.js 15', 'React 19', 'OpenAI API', 'Vercel AI SDK', 'Tailwind CSS'],
    challenge: 'Creating a warm, peaceful space where anyone feels safe and comfortable talking with an AI companion.',
    solution: 'We built a minimalist, soothing interface with natural voice prompts, fluid transitions, and zero complicated setup steps.'
  }
];

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState(null);
  const [caseStudyTab, setCaseStudyTab] = useState('blueprint'); // 'blueprint' | 'metrics' | 'stack'
  const [copiedLink, setCopiedLink] = useState(false);

  const audioCtxRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const hudRef = useRef(null);
  const dotsTrackRef = useRef(null);
  const isDotsDraggingRef = useRef(false);

  const handleCopyLink = (proj) => {
    playSound('click');
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(proj?.url || window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

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

  // Cinematic Hollywood Cyber Terminal & Hacking SFX Engine
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

      if (type === 'click') {
        // Hollywood Tactical Cyber Keystroke (Mechanical noise transient + resonant saw chirp)
        // 1. Noise transient for mechanical microswitch leaf contact
        const noiseSize = Math.floor(ctx.sampleRate * 0.015);
        const noiseBuf = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseSize; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseSize * 0.3));
        }
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuf;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3200, now);
        noiseFilter.Q.setValueAtTime(4, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.09, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseNode.start(now);

        // 2. Resonant Cyber Stutter Pulse
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.032);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1900, now);
        filter.Q.setValueAtTime(6, now);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.042);
      } else if (type === 'slide') {
        // High-Speed Fiber Optical Data Stream / Packet Shifter (FM Modulated)
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const carrierGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        modulator.type = 'sawtooth';
        modulator.frequency.setValueAtTime(180, now);
        modulator.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        modGain.gain.setValueAtTime(600, now);
        modGain.gain.exponentialRampToValueAtTime(50, now + 0.08);

        carrier.type = 'triangle';
        carrier.frequency.setValueAtTime(950, now);
        carrier.frequency.exponentialRampToValueAtTime(2200, now + 0.04);
        carrier.frequency.exponentialRampToValueAtTime(520, now + 0.09);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.Q.setValueAtTime(5, now);

        carrierGain.gain.setValueAtTime(0.08, now);
        carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(filter);
        filter.connect(carrierGain);
        carrierGain.connect(ctx.destination);

        modulator.start(now);
        carrier.start(now);
        modulator.stop(now + 0.1);
        carrier.stop(now + 0.1);
      } else if (type === 'open') {
        // Hollywood Mainframe Terminal Decrypt & Access Granted Sequence
        // 1. Rapid 3-burst micro-scan telemetry
        const freqs = [1100, 1650, 2400];
        freqs.forEach((freq, idx) => {
          const t = now + idx * 0.022;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, t);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.2, t + 0.015);
          gain.gain.setValueAtTime(0.04, t);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.022);
        });

        // 2. High-Tech Authorization Chime (Dual harmonic sine burst)
        const tChime = now + 0.075;
        const oscChime1 = ctx.createOscillator();
        const oscChime2 = ctx.createOscillator();
        const gainChime = ctx.createGain();

        oscChime1.type = 'sine';
        oscChime1.frequency.setValueAtTime(1760, tChime);
        oscChime1.frequency.exponentialRampToValueAtTime(1980, tChime + 0.18);

        oscChime2.type = 'triangle';
        oscChime2.frequency.setValueAtTime(3520, tChime);
        oscChime2.frequency.exponentialRampToValueAtTime(3960, tChime + 0.18);

        gainChime.gain.setValueAtTime(0.08, tChime);
        gainChime.gain.exponentialRampToValueAtTime(0.0001, tChime + 0.22);

        oscChime1.connect(gainChime);
        oscChime2.connect(gainChime);
        gainChime.connect(ctx.destination);

        oscChime1.start(tChime);
        oscChime2.start(tChime);
        oscChime1.stop(tChime + 0.23);
        oscChime2.stop(tChime + 0.23);
      } else if (type === 'copy') {
        // Holographic Data Injection / Telemetry Buffer Sync Pulse
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(2800, now + 0.06);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2400, now);
        osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.07);

        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.11);
        osc2.stop(now + 0.11);
      } else if (type === 'hover') {
        // Cyber Radar Lock-on Target Acquisition Ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2800, now);
        osc.frequency.exponentialRampToValueAtTime(3400, now + 0.02);

        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.03);
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

        /* Dynamic Live Transmission Waveform / Equalizer */
        .domain-signal-wave {
          display: inline-flex;
          align-items: flex-end;
          gap: 2.5px;
          height: 12px;
          padding-bottom: 1px;
        }

        .signal-bar {
          width: 2.5px;
          border-radius: 2px;
          background: var(--brand-yellow);
          box-shadow: 0 0 8px rgba(235, 215, 63, 0.7);
          animation: signalHarmonic 1.2s infinite ease-in-out;
        }

        .signal-bar:nth-child(1) {
          height: 4px;
          animation-delay: 0s;
        }

        .signal-bar:nth-child(2) {
          height: 11px;
          animation-delay: 0.22s;
        }

        .signal-bar:nth-child(3) {
          height: 6px;
          animation-delay: 0.44s;
        }

        @keyframes signalHarmonic {
          0%, 100% { transform: scaleY(0.45); opacity: 0.7; }
          50% { transform: scaleY(1.3); opacity: 1; filter: drop-shadow(0 0 6px var(--brand-yellow)); }
        }

        .hud-domain-capsule:hover .signal-bar {
          animation-duration: 0.55s;
          box-shadow: 0 0 10px rgba(235, 215, 63, 0.95);
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

        .screenshot-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.6s ease;
          will-change: transform;
          display: block;
        }

        .screenshot-video {
          pointer-events: none;
          background: #050508;
        }

        .web-card-chassis:hover .screenshot-media {
          transform: scale(1.04) translateY(-6px);
          filter: brightness(1.06) contrast(1.02);
        }

        /* High-End Cyber Target Hover Beacon */
        .hover-beacon-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(8, 8, 14, 0.35) 0%, rgba(5, 5, 8, 0.75) 100%);
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          z-index: 8;
        }

        .web-card-chassis:hover .hover-beacon-overlay {
          opacity: 1;
        }

        /* Sci-Fi Target Reticle Bracket Wrapper */
        .beacon-target-rig {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(22px) scale(0.9);
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .web-card-chassis:hover .beacon-target-rig {
          transform: translateY(0) scale(1);
        }

        /* Radar Lock-on Brackets around the button */
        .beacon-reticle {
          position: absolute;
          width: calc(100% + 28px);
          height: calc(100% + 24px);
          pointer-events: none;
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          opacity: 0;
          transform: scale(1.18);
        }

        .web-card-chassis:hover .beacon-reticle {
          opacity: 1;
          transform: scale(1);
        }

        .reticle-corner {
          position: absolute;
          width: 9px;
          height: 9px;
          border-color: var(--brand-yellow);
          border-style: solid;
          opacity: 0.85;
          transition: border-color 0.3s ease;
        }
        .reticle-tl { top: 0; left: 0; border-width: 1.5px 0 0 1.5px; }
        .reticle-tr { top: 0; right: 0; border-width: 1.5px 1.5px 0 0; }
        .reticle-bl { bottom: 0; left: 0; border-width: 0 0 1.5px 1.5px; }
        .reticle-br { bottom: 0; right: 0; border-width: 0 1.5px 1.5px 0; }

        /* The Core Beacon Button Capsule */
        .hover-launch-badge {
          position: relative;
          background: linear-gradient(135deg, rgba(16, 16, 24, 0.95) 0%, rgba(8, 8, 12, 0.98) 100%);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(235, 215, 63, 0.55);
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
          gap: 12px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.9), 0 0 35px rgba(235, 215, 63, 0.28), inset 0 1px 1px rgba(255, 255, 255, 0.2);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Continuous Holographic Light Sweep */
        .beacon-shimmer {
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(235, 215, 63, 0.28), transparent);
          transform: skewX(-25deg);
          animation: beaconSweep 3s infinite ease-in-out;
        }

        @keyframes beaconSweep {
          0% { left: -150%; }
          50%, 100% { left: 150%; }
        }

        /* Spinning 4-Point Blueprint Star */
        .beacon-spark-icon {
          color: var(--brand-yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
          animation: beaconPulseStar 2.5s infinite ease-in-out;
        }

        @keyframes beaconPulseStar {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 4px var(--brand-yellow)); }
          50% { transform: scale(1.25) rotate(45deg); filter: drop-shadow(0 0 10px rgba(235, 215, 63, 0.9)); }
        }

        /* Dynamic Arrow Sub-Capsule */
        .beacon-arrow-bubble {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(235, 215, 63, 0.15);
          border: 1px solid rgba(235, 215, 63, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-yellow);
          transition: all 0.3s ease;
        }

        .web-card-chassis:hover .hover-launch-badge {
          border-color: var(--brand-yellow);
          background: linear-gradient(135deg, rgba(24, 24, 36, 0.98) 0%, rgba(12, 12, 18, 1) 100%);
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.95), 0 0 45px rgba(235, 215, 63, 0.45);
        }

        .web-card-chassis:hover .beacon-arrow-bubble {
          background: var(--brand-yellow);
          color: #050505;
          transform: translate(2px, -2px);
          box-shadow: 0 0 12px rgba(235, 215, 63, 0.8);
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

        /* High-End Cyber-Monograph Case Study Drawer */
        .case-study-drawer {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(4, 4, 8, 0.88);
          backdrop-filter: blur(35px);
          -webkit-backdrop-filter: blur(35px);
          display: flex;
          justify-content: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .case-study-drawer.open {
          opacity: 1;
          pointer-events: auto;
        }

        /* High-End Luxury Animated Client Acquisition Station */
        .drawer-conversion-hub {
          position: absolute;
          left: 3.5vw;
          top: 50%;
          transform: translateY(-46%) scale(0.96);
          width: clamp(310px, 27vw, 380px);
          background: linear-gradient(165deg, rgba(22, 22, 32, 0.92) 0%, rgba(8, 8, 14, 0.96) 100%);
          backdrop-filter: blur(35px);
          -webkit-backdrop-filter: blur(35px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 22px;
          padding: 28px 26px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(235, 215, 63, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.18);
          opacity: 0;
          pointer-events: none;
          z-index: 2010;
          overflow: hidden;
          transition: opacity 0.45s 0.1s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s 0.1s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hub-top-beam {
          position: absolute;
          top: 0;
          left: -60%;
          width: 60%;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--brand-yellow), transparent);
          animation: hubBeamSweep 3.5s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes hubBeamSweep {
          0% { left: -60%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }

        .case-study-drawer.open .drawer-conversion-hub {
          opacity: 1;
          transform: translateY(-50%) scale(1);
          pointer-events: auto;
          animation: hubFloatingLevitate 5s ease-in-out infinite, hubAmbientGlow 4s ease-in-out infinite alternate;
        }

        @keyframes hubFloatingLevitate {
          0%, 100% {
            transform: translateY(-50%) scale(1);
          }
          50% {
            transform: translateY(-52.5%) scale(1.008);
          }
        }

        @keyframes hubAmbientGlow {
          0% {
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 25px rgba(235, 215, 63, 0.08);
          }
          50% {
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.95), 0 0 45px rgba(235, 215, 63, 0.22);
          }
          100% {
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.95), 0 0 25px rgba(235, 215, 63, 0.08);
          }
        }

        .hub-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(235, 215, 63, 0.1);
          border: 1px solid rgba(235, 215, 63, 0.35);
          border-radius: 20px;
          padding: 5px 14px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          color: var(--brand-yellow);
          letter-spacing: 0.8px;
          margin-bottom: 14px;
        }

        .eyebrow-signal-bars {
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
          height: 9px;
        }
        .signal-mini-bar {
          width: 2px;
          height: 100%;
          background: var(--brand-yellow);
          border-radius: 1px;
          animation: miniEqualizer 1.2s ease-in-out infinite;
        }
        .signal-mini-bar:nth-child(1) { animation-delay: 0s; }
        .signal-mini-bar:nth-child(2) { animation-delay: 0.3s; height: 60%; }
        .signal-mini-bar:nth-child(3) { animation-delay: 0.6s; height: 80%; }

        @keyframes miniEqualizer {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }

        .hub-pulse-star {
          animation: beaconPulseStar 2.5s infinite ease-in-out;
          color: var(--brand-yellow);
        }

        .hub-title {
          font-family: 'Clash Display', sans-serif;
          font-size: 1.32rem;
          font-weight: 600;
          color: #ffffff;
          line-height: 1.28;
          margin: 0 0 12px 0;
          letter-spacing: -0.4px;
        }

        .hub-desc {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.88rem;
          font-weight: 400;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 20px 0;
        }

        .hub-perks-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
          padding: 14px 16px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.07);
        }

        .hub-perk-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.84rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
        }

        .hub-perk-item .perk-bullet {
          color: var(--brand-yellow);
          font-size: 0.75rem;
          display: inline-block;
          animation: perkSparkGlow 3s ease-in-out infinite;
        }
        .hub-perk-item:nth-child(2) .perk-bullet { animation-delay: 0.8s; }
        .hub-perk-item:nth-child(3) .perk-bullet { animation-delay: 1.6s; }

        @keyframes perkSparkGlow {
          0%, 100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0px transparent); }
          50% { transform: scale(1.3) rotate(45deg); filter: drop-shadow(0 0 6px var(--brand-yellow)); }
        }

        /* High-Impact Animated Interactive CTA Button */
        .hub-cta-button {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: var(--brand-yellow);
          color: #050505;
          padding: 13px 20px;
          border-radius: 30px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          text-decoration: none;
          overflow: hidden;
          white-space: nowrap;
          box-shadow: 0 8px 25px rgba(235, 215, 63, 0.35), 0 0 15px rgba(235, 215, 63, 0.2);
          animation: ctaAmbientPulse 3s ease-in-out infinite alternate;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        @keyframes ctaAmbientPulse {
          0% { box-shadow: 0 8px 25px rgba(235, 215, 63, 0.3), 0 0 15px rgba(235, 215, 63, 0.15); }
          100% { box-shadow: 0 12px 35px rgba(235, 215, 63, 0.55), 0 0 25px rgba(235, 215, 63, 0.35); }
        }

        .hub-cta-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 16px 45px rgba(235, 215, 63, 0.6), 0 0 30px rgba(235, 215, 63, 0.9);
          background: #ffe347;
          color: #000;
        }

        .hub-cta-button:active {
          transform: translateY(-1px) scale(0.98);
        }

        .hub-cta-shimmer {
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          transform: skewX(-25deg);
          animation: beaconSweep 2.6s infinite ease-in-out;
        }

        .hub-cta-star {
          font-size: 0.82rem;
          transition: transform 0.3s ease;
        }
        .hub-cta-button:hover .hub-cta-star {
          transform: rotate(45deg) scale(1.2);
        }

        .hub-cta-arrow {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #050505;
          color: var(--brand-yellow);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hub-cta-button:hover .hub-cta-arrow {
          transform: translate(2px, -2px) scale(1.1);
        }

        .hub-telemetry-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .hub-telemetry-point {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'Clash Display', sans-serif;
          font-size: 0.76rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.72);
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        .telemetry-live-dot {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-yellow);
          box-shadow: 0 0 8px var(--brand-yellow);
          display: inline-block;
          flex-shrink: 0;
        }

        .telemetry-live-dot::after {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 1px solid var(--brand-yellow);
          animation: radarRingPulse 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
        }

        @keyframes radarRingPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @media (max-width: 1024px) {
          .drawer-conversion-hub {
            display: none;
          }
          .drawer-content {
            width: 100vw;
            max-width: 100vw;
            padding: 24px 20px;
          }
        }

        .drawer-content {
          width: clamp(620px, 66vw, 920px);
          max-width: 920px;
          min-width: 360px;
          height: 100%;
          background: #08080c;
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -20px 0 60px rgba(0, 0, 0, 0.95);
          padding: 32px 38px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transform: translateX(100%);
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .case-study-drawer.open .drawer-content {
          transform: translateX(0);
        }

        .drawer-hero-banner {
          position: relative;
          width: 100%;
          height: 170px;
          border-radius: 16px;
          overflow: hidden;
          background: #050508;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 20px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
        }

        .drawer-hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          filter: brightness(0.65) contrast(1.05);
          transition: transform 0.8s ease;
        }
        .drawer-hero-banner:hover .drawer-hero-img {
          transform: scale(1.03);
        }

        .drawer-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(8, 8, 12, 0.95) 0%, rgba(8, 8, 12, 0.35) 60%, transparent 100%);
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding: 18px 22px;
        }

        .drawer-header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        /* High-End Cyber Animated Close Button */
        .drawer-close-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(18, 18, 24, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          padding: 7px 16px;
          border-radius: 30px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        .drawer-close-btn:hover {
          background: var(--brand-yellow);
          color: #050505;
          border-color: var(--brand-yellow);
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 0 25px rgba(235, 215, 63, 0.5), 0 8px 20px rgba(0, 0, 0, 0.6);
        }

        .drawer-close-btn:active {
          transform: translateY(0) scale(0.97);
        }

        .close-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, color 0.3s ease;
        }

        .drawer-close-btn:hover .close-icon-wrap {
          transform: rotate(90deg) scale(1.15);
          background: #050505;
          color: var(--brand-yellow);
        }

        .close-btn-shimmer {
          position: absolute;
          top: 0;
          left: -150%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transform: skewX(-25deg);
          transition: left 0.6s ease;
        }

        .drawer-close-btn:hover .close-btn-shimmer {
          left: 150%;
        }

        /* Interactive Case Study Tab Navigation */
        .case-study-tab-bar {
          display: flex;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 4px;
          margin-bottom: 22px;
        }

        .case-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          border-radius: 10px;
          padding: 9px 14px;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'Panchang', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .case-tab-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }

        .case-tab-btn.active {
          background: var(--brand-yellow);
          color: #050505;
          box-shadow: 0 2px 14px rgba(235, 215, 63, 0.3);
        }

        /* High-Tech Editorial Monograph Cards */
        .blueprint-card {
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 20px 24px;
          margin-bottom: 14px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .blueprint-card:hover {
          border-color: rgba(235, 215, 63, 0.3);
          background: rgba(255, 255, 255, 0.035);
        }

        .blueprint-card.highlight {
          background: linear-gradient(135deg, rgba(235, 215, 63, 0.04) 0%, rgba(255, 255, 255, 0.025) 100%);
          border-color: rgba(235, 215, 63, 0.25);
        }

        /* Modern Monograph Badge */
        .monograph-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          padding: 3px 10px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.54rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .monograph-badge.highlight {
          background: rgba(235, 215, 63, 0.09);
          border-color: rgba(235, 215, 63, 0.3);
          color: var(--brand-yellow);
        }

        .monograph-badge .badge-spark {
          color: var(--brand-yellow);
          font-size: 0.6rem;
        }

        .monograph-badge .badge-index {
          font-size: 0.52rem;
          padding: 1px 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: var(--brand-yellow);
          margin-left: 2px;
        }

        .blueprint-quote-text {
          font-family: 'Clash Display', sans-serif;
          font-size: 1.02rem;
          line-height: 1.65;
          color: #ffffff;
          margin: 0;
          font-weight: 500;
          letter-spacing: -0.2px;
        }

        /* Interactive Stats Matrix */
        .stats-matrix-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-metric-box {
          background: rgba(14, 14, 20, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 22px;
          position: relative;
          transition: all 0.3s ease;
        }
        .stat-metric-box:hover {
          border-color: var(--brand-yellow);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(235, 215, 63, 0.15);
        }

        .stat-metric-value {
          font-family: 'Panchang', sans-serif;
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--brand-yellow);
          line-height: 1.1;
          margin-bottom: 6px;
          text-shadow: 0 0 18px rgba(235, 215, 63, 0.3);
        }

        .stat-metric-label {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.75);
        }

        /* Pillars 3-Column Grid */
        .pillars-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
          margin-top: 20px;
        }

        .pillar-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }

        .pillar-card:hover {
          border-color: var(--brand-yellow);
          background: rgba(235, 215, 63, 0.06);
          transform: translateY(-2px);
        }

        .pillar-title {
          font-family: 'Panchang', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--brand-yellow);
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .pillar-desc {
          font-family: 'Clash Display', sans-serif;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }

        .btn-copy-blueprint {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 30px;
          padding: 10px 18px;
          font-family: 'Panchang', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .btn-copy-blueprint:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: #ffffff;
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

        /* Gen-Z Mode: High-Legibility Clash Display Typography */
        .genz-mode,
        .genz-mode * {
          text-transform: lowercase !important;
        }

        /* In Gen-Z mode, switch all display elements to Clash Display for razor-sharp lowercase readability */
        .genz-mode .header-title,
        .genz-mode .header-kicker,
        .genz-mode .header-sub,
        .genz-mode .card-headline,
        .genz-mode .card-category-badge,
        .genz-mode .card-index-tag,
        .genz-mode .btn-case-study,
        .genz-mode .btn-launch-pill,
        .genz-mode .hover-launch-badge,
        .genz-mode .hud-kicker,
        .genz-mode .hud-archive-text,
        .genz-mode .hud-domain-capsule,
        .genz-mode .domain-text,
        .genz-mode .drawer-close-btn,
        .genz-mode .case-tab-btn,
        .genz-mode .monograph-badge,
        .genz-mode .pillar-title,
        .genz-mode .stat-metric-value,
        .genz-mode .hub-eyebrow,
        .genz-mode .hub-cta-button,
        .genz-mode .hub-title,
        .genz-mode .hud-index-num {
          font-family: 'Clash Display', sans-serif !important;
        }

        /* Specific sizing, weights and tracking for Gen-Z elements */
        .genz-mode .header-title {
          font-weight: 700 !important;
          font-size: clamp(2.4rem, 4.5vw, 3.6rem) !important;
          letter-spacing: -0.04em !important;
          line-height: 1.05 !important;
        }

        .genz-mode .header-kicker {
          font-weight: 600 !important;
          font-size: 0.85rem !important;
          letter-spacing: 0.5px !important;
          color: rgba(255, 255, 255, 0.7) !important;
        }

        .genz-mode .header-sub {
          font-weight: 600 !important;
          font-size: 0.92rem !important;
          letter-spacing: 0.3px !important;
          color: var(--brand-yellow) !important;
        }

        .genz-mode .card-headline {
          font-weight: 700 !important;
          font-size: clamp(1.8rem, 3.2vw, 2.5rem) !important;
          letter-spacing: -0.03em !important;
          line-height: 1.1 !important;
        }

        .genz-mode .card-tagline,
        .genz-mode .card-desc,
        .genz-mode .hub-desc,
        .genz-mode .blueprint-quote-text,
        .genz-mode .pillar-desc {
          font-family: 'Clash Display', sans-serif !important;
          font-weight: 450 !important;
          letter-spacing: -0.01em !important;
          line-height: 1.55 !important;
        }

        .genz-mode .card-category-badge,
        .genz-mode .card-index-tag,
        .genz-mode .monograph-badge,
        .genz-mode .hub-eyebrow {
          font-weight: 600 !important;
          font-size: 0.72rem !important;
          letter-spacing: 0.4px !important;
        }

        .genz-mode .btn-case-study,
        .genz-mode .btn-launch-pill,
        .genz-mode .hover-launch-badge {
          font-weight: 600 !important;
          font-size: 0.82rem !important;
          letter-spacing: 0.2px !important;
        }

        .genz-mode .hud-kicker,
        .genz-mode .hud-archive-text {
          font-weight: 550 !important;
          letter-spacing: 0.3px !important;
        }

        .genz-mode .case-tab-btn {
          font-weight: 600 !important;
          font-size: 0.8rem !important;
          letter-spacing: 0.2px !important;
        }

        .genz-mode .stat-metric-value {
          font-weight: 700 !important;
          letter-spacing: -0.03em !important;
        }

        .genz-mode .stat-metric-label {
          font-family: 'Clash Display', sans-serif !important;
          font-weight: 450 !important;
          letter-spacing: 0px !important;
        }

        .genz-mode .pillar-title {
          font-weight: 650 !important;
          letter-spacing: 0.2px !important;
        }

        .genz-mode .hub-title {
          font-weight: 650 !important;
          font-size: 1.35rem !important;
          letter-spacing: -0.03em !important;
          line-height: 1.25 !important;
        }

        .genz-mode .hub-cta-button {
          font-weight: 700 !important;
          font-size: 0.8rem !important;
          letter-spacing: 0.4px !important;
        }

        .genz-mode .drawer-close-btn {
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          letter-spacing: 0.3px !important;
        }
      `}} />

      <div className={`web-portfolio-wrapper ${isGenz ? 'genz-mode' : ''}`}>
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
          <div className="header-kicker">{isGenz ? '// flagship web drops' : '// Bespoke Production'}</div>
          <h1>{isGenz ? 'web portfolio' : 'Web Portfolio'}</h1>
          <p>{isGenz ? 'zero mid websites • engineered to convert' : 'Interactive Experiences'}</p>
        </div>

        {/* Floating Minimal Side Arrows */}
        <button 
          className="slider-nav-btn nav-prev-btn" 
          onClick={prevCard} 
          onMouseEnter={() => playSound('hover')}
          title="Previous Web Build (←)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button 
          className="slider-nav-btn nav-next-btn" 
          onClick={nextCard} 
          onMouseEnter={() => playSound('hover')}
          title="Next Web Build (→)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        {/* Unified Single Bottom Minimal HUD */}
        <div className="slider-bottom-hud" ref={hudRef}>
          <span className="hud-archive-badge">{isGenz ? '✦ curated archive' : '✦ CURATED ARCHIVE'}</span>
          <span className="hud-archive-text">{isGenz ? 'hand-picked fire builds' : 'Hand-picked public builds'}</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="hud-index-badge">
                      <span className="hud-sparkle">✦</span>
                      <span>{isGenz ? `0${idx + 1} // dropped build` : `${String(idx + 1).padStart(2, '0')} // ARCHIVE`}</span>
                    </div>
                    {(proj.video || proj.video_url) && (
                      <div style={{
                        background: 'rgba(235, 215, 63, 0.15)',
                        border: '1px solid rgba(235, 215, 63, 0.35)',
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontFamily: 'Panchang, sans-serif',
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        color: 'var(--brand-yellow)',
                        letterSpacing: '1px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{isGenz ? 'video loop' : 'VIDEO LOOP'}</span>
                      </div>
                    )}
                  </div>

                  <div 
                    className="hud-domain-capsule"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(proj.url, '_blank', 'noopener,noreferrer');
                    }}
                    title={`Launch https://${proj.displayUrl}`}
                  >
                    <div className="domain-signal-wave" title="Live Edge Transmission">
                      <span className="signal-bar" />
                      <span className="signal-bar" />
                      <span className="signal-bar" />
                    </div>
                    <span className="domain-text">{proj.displayUrl}</span>
                    <svg className="domain-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7"></line>
                      <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Viewport Body with Real Website Screenshot or Looping Screen Recording */}
                <div className="card-viewport-body">
                  <div className="screenshot-viewport">
                    {proj.video || proj.video_url ? (
                      <video 
                        src={proj.video || proj.video_url}
                        poster={proj.image || proj.image_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="screenshot-media screenshot-video"
                      />
                    ) : (
                      <img 
                        src={proj.image || proj.image_url} 
                        alt={`${proj.title} Website Screenshot`} 
                        className="screenshot-media screenshot-img"
                        loading="lazy"
                      />
                    )}
                    
                    {/* High-End Cyber Target Hover Beacon */}
                    <div className="hover-beacon-overlay">
                      <div className="beacon-target-rig">
                        {/* Holographic Radar Lock-on Reticle */}
                        <div className="beacon-reticle">
                          <span className="reticle-corner reticle-tl" />
                          <span className="reticle-corner reticle-tr" />
                          <span className="reticle-corner reticle-bl" />
                          <span className="reticle-corner reticle-br" />
                        </div>

                        {/* Core Launch Badge Capsule */}
                        <div 
                          className="hover-launch-badge"
                          onMouseEnter={() => playSound('hover')}
                        >
                          <div className="beacon-shimmer" />
                          <span className="beacon-spark-icon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z"></path>
                            </svg>
                          </span>
                          <span>{isGenz ? 'explore live site' : 'EXPLORE LIVE BUILD'}</span>
                          <div className="beacon-arrow-bubble">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="7" y1="17" x2="17" y2="7"></line>
                              <polyline points="7 7 17 7 17 17"></polyline>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Meta & Action Footer */}
                  <div className="card-footer-info">
                    <div className="card-main-meta">
                      <div className="card-category-badge">
                        <span>✦</span>
                        <span>{isGenz ? proj.category.toLowerCase() : proj.category}</span>
                      </div>
                      <div className="card-headline">{proj.title}</div>
                      <div className="card-tagline">{proj.tagline}</div>
                      <div className="card-tech-pills">
                        {proj.techStack.map((tech, tIdx) => (
                          <span key={tIdx} className="tech-pill">{isGenz ? tech.toLowerCase() : tech}</span>
                        ))}
                      </div>
                    </div>

                    <div className="card-action-group">
                      <button 
                        className="btn-case-study case-study-prevent" 
                        onMouseEnter={() => playSound('hover')}
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
                        <span>{isGenz ? 'case study' : 'Case Study'}</span>
                      </button>

                      <div className="btn-launch-pill">
                        <span>{isGenz ? 'launch site' : 'Launch Live'}</span>
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
          {/* Left Side High-End Luxury Animated Client Acquisition Station */}
          <div 
            className="drawer-conversion-hub" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Top Light Beam */}
            <div className="hub-top-beam" />

            {/* Clean Status Chip with Wave */}
            <div className="hub-eyebrow">
              <span className="hub-pulse-star">✦</span>
              <span>{isGenz ? 'ready for your own website?' : 'READY FOR YOUR OWN WEBSITE?'}</span>
              <div className="eyebrow-signal-bars">
                <span className="signal-mini-bar" />
                <span className="signal-mini-bar" />
                <span className="signal-mini-bar" />
              </div>
            </div>

            {/* High-Impact Benefit Title */}
            <h3 className="hub-title">
              {isGenz ? 'let’s build something incredible for you' : 'LET’S BUILD SOMETHING EXTRAORDINARY'}
            </h3>

            {/* Clear Value Prop */}
            <p className="hub-desc">
              {isGenz
                ? 'we build custom websites that make your brand look top tier and actually convert visitors into paying clients.'
                : 'We design custom websites that elevate your brand and turn daily visitors into high-paying clients.'}
            </p>

            {/* Client-Focused Benefits List */}
            <div className="hub-perks-list">
              <div className="hub-perk-item">
                <span className="perk-bullet">✦</span>
                <span>{isGenz ? '100% custom design built for your brand' : '100% Custom Design Built For Your Brand'}</span>
              </div>
              <div className="hub-perk-item">
                <span className="perk-bullet">✦</span>
                <span>{isGenz ? 'fast & flawless on all phones & laptops' : 'Fast & Flawless on Phones & Laptops'}</span>
              </div>
              <div className="hub-perk-item">
                <span className="perk-bullet">✦</span>
                <span>{isGenz ? 'done & launched for you in 2–3 weeks' : 'Done & Launched For You in 2–3 Weeks'}</span>
              </div>
            </div>

            {/* Primary High-Impact CTA Button */}
            <a
              href="mailto:contact@drippmedia.com?subject=Project Inquiry: Custom Website Build"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click');
              }}
              className="hub-cta-button"
              title="Start your custom website project"
            >
              <div className="hub-cta-shimmer" />
              <span className="hub-cta-star">✦</span>
              <span>{isGenz ? 'get your website started' : 'GET YOUR WEBSITE STARTED'}</span>
              <div className="hub-cta-arrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </div>
            </a>

            {/* 2-Point Guarantee Bar */}
            <div className="hub-telemetry-row">
              <div className="hub-telemetry-point">
                <span className="telemetry-live-dot" />
                <span>{isGenz ? 'fast 24-hr response' : 'Fast 24-Hr Response'}</span>
              </div>
              <div className="hub-telemetry-point">
                <span style={{ color: 'var(--brand-yellow)', fontSize: '0.7rem', display: 'inline-block' }}>✦</span>
                <span>{isGenz ? 'free consultation' : 'Free Consultation'}</span>
              </div>
            </div>
          </div>

          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            {selectedCaseStudy && (
              <>
                <div>
                  {/* Header Action Bar */}
                  <div className="drawer-header-actions">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="card-category-badge" style={{ margin: 0 }}>✦ {isGenz ? selectedCaseStudy.category.toLowerCase() : selectedCaseStudy.category}</div>
                    </div>

                    <button 
                      className="drawer-close-btn" 
                      onClick={() => {
                        playSound('click');
                        setSelectedCaseStudy(null);
                      }}
                      title="Close Case Study (Esc)"
                    >
                      <div className="close-btn-shimmer" />
                      <span>{isGenz ? 'close' : 'CLOSE'}</span>
                      <div className="close-icon-wrap">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Hero Visual Preview Banner */}
                  <div className="drawer-hero-banner">
                    <img 
                      src={selectedCaseStudy.image} 
                      alt={selectedCaseStudy.title}
                      className="drawer-hero-img"
                    />
                    <div className="drawer-hero-overlay">
                      <div>
                        <h2 style={{
                          fontFamily: 'Panchang, sans-serif',
                          fontSize: '2rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          textTransform: isGenz ? 'lowercase' : 'uppercase',
                          lineHeight: 1.05,
                          margin: '0 0 6px 0',
                          letterSpacing: '-0.5px'
                        }}>
                          {selectedCaseStudy.title}
                        </h2>
                        <div style={{
                          fontFamily: 'Clash Display, sans-serif',
                          fontSize: '0.92rem',
                          color: 'var(--brand-yellow)',
                          fontWeight: 600
                        }}>
                          {selectedCaseStudy.tagline}
                        </div>
                      </div>

                      <a 
                        href={selectedCaseStudy.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hud-domain-capsule"
                        style={{ textDecoration: 'none' }}
                      >
                        <div className="domain-signal-wave" title="Live Edge Transmission">
                          <span className="signal-bar" />
                          <span className="signal-bar" />
                          <span className="signal-bar" />
                        </div>
                        <span className="domain-text">{selectedCaseStudy.displayUrl}</span>
                        <svg className="domain-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Interactive Case Study Tab Switcher */}
                  <div className="case-study-tab-bar">
                    <button 
                      className={`case-tab-btn ${caseStudyTab === 'blueprint' ? 'active' : ''}`}
                      onClick={() => { playSound('click'); setCaseStudyTab('blueprint'); }}
                    >
                      <span>{isGenz ? 'story & solution' : 'Story & Solution'}</span>
                    </button>
                    <button 
                      className={`case-tab-btn ${caseStudyTab === 'metrics' ? 'active' : ''}`}
                      onClick={() => { playSound('click'); setCaseStudyTab('metrics'); }}
                    >
                      <span>{isGenz ? 'speed & results' : 'Speed & Results'}</span>
                    </button>
                    <button 
                      className={`case-tab-btn ${caseStudyTab === 'stack' ? 'active' : ''}`}
                      onClick={() => { playSound('click'); setCaseStudyTab('stack'); }}
                    >
                      <span>{isGenz ? 'tools & tech' : 'Tools & Technologies'}</span>
                    </button>
                  </div>

                  {/* TAB 1: STORY & SOLUTION */}
                  {caseStudyTab === 'blueprint' && (
                    <div>
                      {/* The Strategic Challenge Card */}
                      <div className="blueprint-card">
                        <div className="monograph-badge">
                          <span className="badge-spark">✦</span>
                          <span className="badge-label">{isGenz ? "the client's goal" : "THE CLIENT'S GOAL"}</span>
                        </div>
                        <p className="blueprint-quote-text">
                          "{selectedCaseStudy.challenge}"
                        </p>
                      </div>

                      {/* The Architectural Solution Card */}
                      <div className="blueprint-card highlight">
                        <div className="monograph-badge highlight">
                          <span className="badge-spark">✦</span>
                          <span className="badge-label">{isGenz ? 'how we built it' : 'HOW WE BUILT IT'}</span>
                        </div>
                        <p className="blueprint-quote-text" style={{ marginBottom: '16px', color: 'rgba(255, 255, 255, 0.95)' }}>
                          {selectedCaseStudy.solution}
                        </p>

                        {/* 3 Pillars Grid */}
                        <div className="pillars-grid">
                          {Array.isArray(selectedCaseStudy.pillars) && selectedCaseStudy.pillars.length > 0 ? (
                            selectedCaseStudy.pillars.map((pillar, pIdx) => (
                              <div key={pIdx} className="pillar-card">
                                <div className="pillar-title">{pillar.title || `0${pIdx + 1} / FEATURE`}</div>
                                <div className="pillar-desc">{pillar.desc || pillar.description || ''}</div>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="pillar-card">
                                <div className="pillar-title">{isGenz ? '01 / instant load speed' : '01 / INSTANT LOAD SPEED'}</div>
                                <div className="pillar-desc">{isGenz ? 'opens in the blink of an eye with zero waiting or lag.' : 'Pages open immediately with zero waiting or lag.'}</div>
                              </div>
                              <div className="pillar-card">
                                <div className="pillar-title">{isGenz ? '02 / smooth visuals' : '02 / SMOOTH ANIMATIONS'}</div>
                                <div className="pillar-desc">{isGenz ? 'clean interactive motion that keeps visitors engaged.' : 'Fluid interactive motion that keeps visitors engaged.'}</div>
                              </div>
                              <div className="pillar-card">
                                <div className="pillar-title">{isGenz ? '03 / built to grow' : '03 / BUILT TO GROW'}</div>
                                <div className="pillar-desc">{isGenz ? 'cloud setup ready to handle huge traffic spikes effortlessly.' : 'Reliable cloud setup ready to handle huge traffic spikes effortlessly.'}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPEED & RESULTS */}
                  {caseStudyTab === 'metrics' && (
                    <div>
                      <div className="stats-matrix-grid">
                        {Array.isArray(selectedCaseStudy.stats) && selectedCaseStudy.stats.length > 0 ? (
                          selectedCaseStudy.stats.map((st, sIdx) => (
                            <div key={sIdx} className="stat-metric-box">
                              <div className="stat-metric-value">
                                {st.value}
                              </div>
                              <div className="stat-metric-label">{isGenz ? st.label.toLowerCase() : st.label}</div>
                            </div>
                          ))
                        ) : (
                          <>
                            <div className="stat-metric-box">
                              <div className="stat-metric-value">99/100</div>
                              <div className="stat-metric-label">{isGenz ? 'overall quality score' : 'Overall Quality Score'}</div>
                            </div>
                            <div className="stat-metric-box">
                              <div className="stat-metric-value" style={{ color: '#ffffff' }}>0.35s</div>
                              <div className="stat-metric-label">{isGenz ? 'instant load speed' : 'Instant Load Speed'}</div>
                            </div>
                            <div className="stat-metric-box">
                              <div className="stat-metric-value">100%</div>
                              <div className="stat-metric-label">{isGenz ? 'mobile & search ready' : 'Mobile & Search Ready'}</div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="blueprint-card">
                        <div className="monograph-badge">
                          <span className="badge-spark">✦</span>
                          <span className="badge-label">{isGenz ? 'speed & reliability' : 'SPEED & RELIABILITY'}</span>
                        </div>
                        <p className="blueprint-quote-text" style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          {isGenz
                            ? 'tested and optimized to open in under half a second on any device, with smooth scrolling and 24/7 reliability.'
                            : 'Tested and optimized to load in less than half a second anywhere in the world, with smooth scrolling on all phones and laptops.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TOOLS & TECHNOLOGIES */}
                  {caseStudyTab === 'stack' && (
                    <div>
                      <div className="blueprint-card">
                        <div className="monograph-badge highlight">
                          <span className="badge-spark">✦</span>
                          <span className="badge-label">{isGenz ? 'modern web tools' : 'MODERN WEB TOOLS'}</span>
                        </div>
                        <p className="blueprint-quote-text" style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '18px' }}>
                          {isGenz ? 'crafted using the best modern web tools for maximum speed, security, and design:' : 'Crafted using the world’s leading modern web tools for maximum speed, security, and design:'}
                        </p>
                        <div className="card-tech-pills" style={{ gap: '10px' }}>
                          {selectedCaseStudy.techStack.map((tech, i) => (
                            <div 
                              key={i} 
                              style={{
                                background: 'rgba(235, 215, 63, 0.1)',
                                border: '1px solid rgba(235, 215, 63, 0.35)',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                fontFamily: 'Clash Display, sans-serif',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span style={{ color: 'var(--brand-yellow)' }}>✦</span>
                              <span>{isGenz ? tech.toLowerCase() : tech}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Fixed Portal Deck */}
                <div style={{
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <button
                    className="btn-copy-blueprint"
                    onClick={() => handleCopyLink(selectedCaseStudy)}
                    title="Copy Live Project Link"
                  >
                    <span>{copiedLink ? (isGenz ? '✓ copied link' : '✓ Copied Link') : (isGenz ? 'copy link' : 'Copy Link')}</span>
                  </button>

                  <a 
                    href={selectedCaseStudy.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-launch-pill"
                    onClick={() => playSound('click')}
                    style={{ textDecoration: 'none' }}
                  >
                    <span>{isGenz ? 'visit live website' : 'Visit Live Website'}</span>
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
      </div>
    </>
  );
}
