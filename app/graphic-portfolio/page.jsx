'use client';
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGenz } from '../contexts/GenzContext';

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [graphics, setGraphics] = useState([]);
  const [isListViewActive, setIsListViewActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    // Register GSAP

    // Ensure body is visible
    gsap.set('body', { opacity: 1, y: 0 });

    if (!window.__inlineClickBound) {
        window.__inlineClickBound = true;
        window.addEventListener('inline-click', (e) => {
            const { action, target, originalEvent } = e.detail;
            const event = originalEvent;
            try {
                eval(action.replace(/this/g, 'target'));
            } catch(err) { 
                console.error('Inline click error:', err); 
            }
        });
    }
    
    gsap.registerPlugin(ScrollTrigger);

    
        // Custom Cursor Logic
        const cursor = document.getElementById('cursor');
        window.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
        });
        window.addEventListener('mousedown', () => cursor.classList.add('active'));
        window.addEventListener('mouseup', () => cursor.classList.remove('active'));

        // Make variables global so animation loop has access to velocity
        let globalVelX = 0;
        let globalVelY = 0;

        // --- GTA V CINEMATIC AUDIO SYNTHESIZER (Pure Web Audio API - Zero Asset Latency) ---
        let audioCtx = null;
        let cachedNoiseBuffer = null;

        function getAudioContext() {
            if (!audioCtx && typeof window !== 'undefined') {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                }
            }
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        function getNoiseBuffer(ctx) {
            if (!cachedNoiseBuffer || cachedNoiseBuffer.sampleRate !== ctx.sampleRate) {
                const bufferSize = Math.floor(ctx.sampleRate * 0.9);
                cachedNoiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const output = cachedNoiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = Math.random() * 2 - 1;
                }
            }
            return cachedNoiseBuffer;
        }

        function playGTAZoomSound(direction) {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;

                if (direction === 'in') {
                    // Dive-bomb sound: rushing descending wind + Doppler tone + tactical lock-on blip + sub-bass landing thud
                    
                    // 1. Synthesize rushing wind noise with bandpass sweep (using pre-cached buffer)
                    const whiteNoise = ctx.createBufferSource();
                    whiteNoise.buffer = getNoiseBuffer(ctx);

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(2800, now);
                    filter.frequency.exponentialRampToValueAtTime(320, now + 0.7);
                    filter.Q.setValueAtTime(3.0, now);

                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.01, now);
                    noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.15);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

                    whiteNoise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(ctx.destination);
                    whiteNoise.start(now);
                    whiteNoise.stop(now + 0.8);

                    // 2. Descending tone Doppler pitch
                    const osc = ctx.createOscillator();
                    const oscGain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.exponentialRampToValueAtTime(65, now + 0.65);

                    oscGain.gain.setValueAtTime(0.01, now);
                    oscGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

                    osc.connect(oscGain);
                    oscGain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.7);

                    // 3. Sub-bass landing impact thud at t = 0.58s
                    const subOsc = ctx.createOscillator();
                    const subGain = ctx.createGain();
                    subOsc.type = 'sine';
                    subOsc.frequency.setValueAtTime(140, now + 0.58);
                    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.95);

                    subGain.gain.setValueAtTime(0.0, now);
                    subGain.gain.setValueAtTime(0.4, now + 0.58);
                    subGain.exponentialRampToValueAtTime(0.001, now + 0.95);

                    subOsc.connect(subGain);
                    subGain.connect(ctx.destination);
                    subOsc.start(now + 0.58);
                    subOsc.stop(now + 1.0);

                    // 4. Tactical high-pitch beep/chirp
                    const chirp = ctx.createOscillator();
                    const chirpGain = ctx.createGain();
                    chirp.type = 'sine';
                    chirp.frequency.setValueAtTime(1850, now + 0.55);
                    chirpGain.gain.setValueAtTime(0.08, now + 0.55);
                    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
                    chirp.connect(chirpGain);
                    chirpGain.connect(ctx.destination);
                    chirp.start(now + 0.55);
                    chirp.stop(now + 0.68);

                } else {
                    // Zoom Out: Pulling up to stratosphere whoosh + ascending pitch + satellite radio pulse
                    
                    // 1. Ascending wind noise (using pre-cached buffer)
                    const whiteNoise = ctx.createBufferSource();
                    whiteNoise.buffer = getNoiseBuffer(ctx);

                    const filter = ctx.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(300, now);
                    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.7);
                    filter.Q.setValueAtTime(2.5, now);

                    const noiseGain = ctx.createGain();
                    noiseGain.gain.setValueAtTime(0.01, now);
                    noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.2);
                    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

                    whiteNoise.connect(filter);
                    filter.connect(noiseGain);
                    noiseGain.connect(ctx.destination);
                    whiteNoise.start(now);
                    whiteNoise.stop(now + 0.85);

                    // 2. Ascending tone oscillator
                    const osc = ctx.createOscillator();
                    const oscGain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(80, now);
                    osc.frequency.exponentialRampToValueAtTime(750, now + 0.7);

                    oscGain.gain.setValueAtTime(0.01, now);
                    oscGain.gain.linearRampToValueAtTime(0.14, now + 0.2);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

                    osc.connect(oscGain);
                    oscGain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.8);

                    // 3. Satellite telemetry blip
                    const blip = ctx.createOscillator();
                    const blipGain = ctx.createGain();
                    blip.type = 'sine';
                    blip.frequency.setValueAtTime(2200, now + 0.05);
                    blipGain.gain.setValueAtTime(0.07, now + 0.05);
                    blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    blip.connect(blipGain);
                    blipGain.connect(ctx.destination);
                    blip.start(now + 0.05);
                    blip.stop(now + 0.22);
                }
            } catch (e) {
                // AudioContext error safeguard
            }
        }

        function playTripToggleSound(isGoingTripp) {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;

                if (isGoingTripp) {
                    // Shimmering cosmic resonance chime + ascending resonance sweep
                    const osc = ctx.createOscillator();
                    const oscGain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

                    oscGain.gain.setValueAtTime(0.01, now);
                    oscGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

                    osc.connect(oscGain);
                    oscGain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.7);

                    // Ambient harmonic crystal chime
                    const chime = ctx.createOscillator();
                    const chimeGain = ctx.createGain();
                    chime.type = 'triangle';
                    chime.frequency.setValueAtTime(1320, now + 0.08);
                    chimeGain.gain.setValueAtTime(0.08, now + 0.08);
                    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
                    chime.connect(chimeGain);
                    chimeGain.connect(ctx.destination);
                    chime.start(now + 0.08);
                    chime.stop(now + 0.6);
                } else {
                    // Gravitational implosion / settle
                    const osc = ctx.createOscillator();
                    const oscGain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);

                    oscGain.gain.setValueAtTime(0.01, now);
                    oscGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

                    osc.connect(oscGain);
                    oscGain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.55);
                }
            } catch (e) {}
        }

        function playSlideSound(direction = 1) {
            try {
                const ctx = getAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;

                const osc = ctx.createOscillator();
                const oscGain = ctx.createGain();
                osc.type = 'sine';

                if (direction > 0) {
                    osc.frequency.setValueAtTime(520, now);
                    osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
                } else {
                    osc.frequency.setValueAtTime(780, now);
                    osc.frequency.exponentialRampToValueAtTime(520, now + 0.1);
                }

                oscGain.gain.setValueAtTime(0.01, now);
                oscGain.gain.linearRampToValueAtTime(0.09, now + 0.02);
                oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

                osc.connect(oscGain);
                oscGain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.13);
            } catch (e) {}
        }

        // --- SPECIFIC VIEW SEQUENTIAL MODAL MANAGER ---
        let currentSpecificList = [];
        let currentSpecificIndex = 0;
        let isSlidingSpecific = false;

        function renderSpecificModalContent(item) {
            if (!item) return;

            const dummyTitles = ['Neon Brand Identity', 'Event Poster Vibe', 'Tech Startup Logo', 'Creative Thumbnail', 'Web Redesign'];
            const dummyCaseStudies = [
              "This project focused on creating a bold, eye-catching aesthetic. We used high-contrast colors and custom typography to make the brand instantly recognizable.",
              "The goal was to design something clean and modern. By stripping away unnecessary elements, we created a minimalist design that speaks volumes.",
              "This was built for maximum engagement. We used vibrant gradients and dynamic layouts to capture attention in less than a second.",
              "Designed specifically to resonate with a younger demographic. It blends modern aesthetics with retro elements to create a nostalgic yet fresh vibe.",
              "A complete visual overhaul. We maintained the core identity but modernized the geometry and color palette for a premium feel."
            ];

            const imgEl = document.getElementById('specific-img');
            const titleEl = document.getElementById('specific-title');
            const catEl = document.getElementById('specific-category');
            const csEl = document.getElementById('specific-case-study');
            const countEl = document.getElementById('specific-counter');

            if (imgEl) {
                imgEl.src = item.image_url || item.img_src || item.imgSrc || item.url || (item.imgEl ? item.imgEl.src : '') || '';
                imgEl.style.transform = 'scale(1)';
                imgEl.style.transformOrigin = 'center center';
                imgEl.style.filter = '';
                imgEl.style.opacity = '1';
                gsap.set(imgEl, { xPercent: 0, scale: 1 });
            }
            if (titleEl) titleEl.innerText = item.title || (item.el ? item.el.dataset.title : '') || dummyTitles[currentSpecificIndex % dummyTitles.length];
            if (catEl) catEl.innerText = item.category || (item.el ? item.el.dataset.category : '') || 'Graphic Design';
            if (csEl) csEl.innerText = item.case_study || (item.el ? item.el.dataset.case_study : '') || dummyCaseStudies[currentSpecificIndex % dummyCaseStudies.length];
            if (countEl && currentSpecificList && currentSpecificList.length > 0) {
                countEl.innerText = `${(currentSpecificIndex + 1).toString().padStart(2, '0')} / ${currentSpecificList.length.toString().padStart(2, '0')}`;
            }

            const slider = document.getElementById('magnify-slider');
            if (slider) slider.value = 1.5;
        }

        function openSpecificModal(itemData, list = null) {
            if (list && list.length > 0) {
                currentSpecificList = list;
            } else if (window.canvasEngine && window.canvasEngine.customItems && window.canvasEngine.customItems.length > 0) {
                currentSpecificList = window.canvasEngine.customItems;
            }

            if (typeof itemData === 'number') {
                currentSpecificIndex = itemData;
            } else if (itemData) {
                const targetSrc = itemData.image_url || itemData.img_src || itemData.imgSrc || itemData.url || (itemData.imgEl ? itemData.imgEl.src : '') || (itemData.el ? (itemData.el.querySelector('img') ? itemData.el.querySelector('img').src : '') : '');
                const targetTitle = itemData.title || (itemData.el ? itemData.el.dataset.title : '');
                
                let foundIdx = currentSpecificList.findIndex(x => {
                    const xSrc = x.image_url || x.img_src || x.imgSrc || x.url || '';
                    return (xSrc && targetSrc && (xSrc === targetSrc || targetSrc.includes(xSrc) || xSrc.includes(targetSrc))) || (x.title && targetTitle && x.title === targetTitle);
                });

                currentSpecificIndex = foundIdx >= 0 ? foundIdx : 0;
            }

            renderSpecificModalContent(currentSpecificList[currentSpecificIndex]);
            const modal = document.getElementById('specific-view');
            if (modal) modal.classList.add('active');
        }

        function navigateSpecificModal(direction, withTransition = true) {
            if (!currentSpecificList || currentSpecificList.length <= 1) return;
            if (isSlidingSpecific) return; // Prevent overlapping animation glitches

            const len = currentSpecificList.length;
            currentSpecificIndex = (currentSpecificIndex + direction + len) % len;
            const targetItem = currentSpecificList[currentSpecificIndex];

            // Play tactile acoustic feedback
            playSlideSound(direction);

            // Button micro-pulse feedback
            const activeBtn = direction > 0 ? document.getElementById('specific-next-btn') : document.getElementById('specific-prev-btn');
            if (activeBtn) {
                gsap.fromTo(activeBtn, { scale: 0.82 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
            }

            if (withTransition) {
                isSlidingSpecific = true;
                const container = document.querySelector('.specific-view-img-container');
                const currImg = document.getElementById('specific-img');
                const titleEl = document.getElementById('specific-title');
                const catEl = document.getElementById('specific-category');
                const csEl = document.getElementById('specific-case-study');
                const countEl = document.getElementById('specific-counter');

                // Animate text elements with kinetic spring motion
                if (titleEl) {
                    gsap.fromTo(titleEl, 
                        { opacity: 0, x: direction * 35, filter: 'blur(6px)' }, 
                        { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.45, ease: "power3.out" }
                    );
                }
                if (catEl) {
                    gsap.fromTo(catEl, 
                        { opacity: 0, y: -10 }, 
                        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" }
                    );
                }
                if (csEl) {
                    gsap.fromTo(csEl, 
                        { opacity: 0, y: 16, filter: 'blur(4px)' }, 
                        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.48, delay: 0.04, ease: "power3.out" }
                    );
                }
                if (countEl) {
                    gsap.fromTo(countEl, 
                        { scale: 0.75, opacity: 0 }, 
                        { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2)" }
                    );
                }

                // Update text content
                const dummyTitles = ['Neon Brand Identity', 'Event Poster Vibe', 'Tech Startup Logo', 'Creative Thumbnail', 'Web Redesign'];
                const dummyCaseStudies = [
                  "This project focused on creating a bold, eye-catching aesthetic. We used high-contrast colors and custom typography to make the brand instantly recognizable.",
                  "The goal was to design something clean and modern. By stripping away unnecessary elements, we created a minimalist design that speaks volumes.",
                  "This was built for maximum engagement. We used vibrant gradients and dynamic layouts to capture attention in less than a second.",
                  "Designed specifically to resonate with a younger demographic. It blends modern aesthetics with retro elements to create a nostalgic yet fresh vibe.",
                  "A complete visual overhaul. We maintained the core identity but modernized the geometry and color palette for a premium feel."
                ];
                if (titleEl) titleEl.innerText = targetItem.title || (targetItem.el ? targetItem.el.dataset.title : '') || dummyTitles[currentSpecificIndex % dummyTitles.length];
                if (catEl) catEl.innerText = targetItem.category || (targetItem.el ? targetItem.el.dataset.category : '') || 'Graphic Design';
                if (csEl) csEl.innerText = targetItem.case_study || (targetItem.el ? targetItem.el.dataset.case_study : '') || dummyCaseStudies[currentSpecificIndex % dummyCaseStudies.length];
                if (countEl) countEl.innerText = `${(currentSpecificIndex + 1).toString().padStart(2, '0')} / ${len.toString().padStart(2, '0')}`;

                const nextSrc = targetItem.image_url || targetItem.img_src || targetItem.imgSrc || targetItem.url || (targetItem.imgEl ? targetItem.imgEl.src : '') || '';

                if (container && currImg) {
                    // Create new incoming image element for true dual-layer sliding stage
                    const nextImg = document.createElement('img');
                    nextImg.src = nextSrc;
                    nextImg.className = 'specific-view-img';
                    nextImg.alt = 'Specific View';
                    nextImg.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; max-width: 100%; max-height: 100%; display: block; will-change: transform, opacity, filter;';
                    nextImg.onerror = () => {
                        nextImg.onerror = null;
                        nextImg.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Crect width='800' height='800' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Clash Display' font-size='40' fill='%23ebd73f'%3EImage Not Found%3C/text%3E%3C/svg%3E`;
                    };

                    container.appendChild(nextImg);

                    // Set initial position of incoming image
                    gsap.set(nextImg, {
                        xPercent: direction * 100,
                        scale: 0.92,
                        opacity: 0,
                        filter: 'brightness(0.6) blur(6px)'
                    });

                    // Micro-elastic bounce on container
                    gsap.to(container, {
                        scale: 0.985,
                        duration: 0.18,
                        ease: "power2.out",
                        yoyo: true,
                        repeat: 1
                    });

                    const tl = gsap.timeline({
                        onComplete: () => {
                            if (currImg.parentNode === container) {
                                container.removeChild(currImg);
                            }
                            nextImg.id = 'specific-img';
                            nextImg.style.position = 'relative';
                            nextImg.style.filter = '';
                            nextImg.style.transform = 'scale(1)';
                            nextImg.style.transformOrigin = 'center center';
                            isSlidingSpecific = false;
                        }
                    });

                    // Slide out current image
                    tl.to(currImg, {
                        xPercent: -direction * 100,
                        scale: 0.88,
                        opacity: 0,
                        filter: 'brightness(0.5) blur(8px)',
                        duration: 0.46,
                        ease: "power3.inOut"
                    }, 0);

                    // Slide in next image
                    tl.to(nextImg, {
                        xPercent: 0,
                        scale: 1,
                        opacity: 1,
                        filter: 'brightness(1) blur(0px)',
                        duration: 0.46,
                        ease: "power3.inOut"
                    }, 0);
                } else {
                    renderSpecificModalContent(targetItem);
                    isSlidingSpecific = false;
                }
            } else {
                renderSpecificModalContent(targetItem);
            }
        }

        // Expose to window for global access from React components
        window.openSpecificModal = openSpecificModal;
        window.navigateSpecificModal = navigateSpecificModal;

        // --- INFINITE CANVAS ENGINE (GPU-Accelerated Composite Architecture) ---
        class InfiniteCanvas {
            constructor(containerId, options = {}) {
                this.container = document.getElementById(containerId);
                if (!this.container) return;

                // Clear container to prevent duplicate elements on re-renders/Strict Mode
                this.container.innerHTML = '';

                this.imageSize = parseFloat(options.imageSize) || 20;
                this.gap = parseFloat(options.gap) || 0.5;
                this.customItems = options.customItems || [];

                this.items = [];

                this.state = {
                    x: 0,
                    y: 0,
                    targetX: 0,
                    targetY: 0,
                    velX: 0,
                    velY: 0,
                    zoom: 1,
                    targetZoom: 1,
                    isDragging: false,
                    lastPointer: { x: 0, y: 0 }
                };

                // Responsive device grid sizing (Mobile: 6x6=36, Tablet: 8x6=48, Desktop: 12x8=96)
                this.calcResponsiveGrid();
                this.updateMetrics();
                this.init();

                // Cache bound function to cleanly add/remove from GSAP ticker
                this.renderBound = this.render.bind(this);

                this.bindEvents();

                // 60-120fps hardware ticker binding
                gsap.ticker.add(this.renderBound);
                
                this.resizeBound = () => {
                    const prevCols = this.cols;
                    const prevRows = this.rows;
                    this.calcResponsiveGrid();
                    if (prevCols !== this.cols || prevRows !== this.rows) {
                        this.updateMetrics();
                        this.init();
                    } else {
                        this.updateMetrics();
                        this.recalcBaseDimensions();
                    }
                };
                window.addEventListener('resize', this.resizeBound);
            }

            calcResponsiveGrid() {
                const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
                const isMobile = w <= 768;
                const isTablet = w > 768 && w <= 1024;
                this.cols = isMobile ? 6 : (isTablet ? 8 : 12);
                this.rows = isMobile ? 6 : (isTablet ? 6 : 8);
                this.totalItems = this.cols * this.rows;
            }

            getMinZoom() {
                const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                const appliedSize = isMobile ? this.imageSize * 2 : this.imageSize;
                const appliedGap = isMobile ? this.gap * 1.5 : this.gap;
                const currentAspectRatio = this.maxAspectRatio || 1.45;

                const stepX = appliedSize + appliedGap;
                const stepY = (appliedSize * currentAspectRatio) + appliedGap;

                const totalGridWidthVw = this.cols * stepX;
                const totalGridHeightVw = this.rows * stepY;

                const vhInVw = typeof window !== 'undefined' ? (window.innerHeight / window.innerWidth) * 100 : 56.25;

                // Minimum zoom required so that the grid ALWAYS spans >= 105vw and >= 105vh
                const minZoomX = 105 / totalGridWidthVw;
                const minZoomY = (vhInVw * 1.05) / totalGridHeightVw;

                return Math.max(minZoomX, minZoomY);
            }

            updateMetrics() {
                const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                const appliedSize = isMobile ? this.imageSize * 2 : this.imageSize;
                const appliedGap = isMobile ? this.gap * 1.5 : this.gap;

                const vw = (typeof window !== 'undefined' ? window.innerWidth : 1440) / 100;
                this.baseItemSizePx = appliedSize * vw;
                this.baseGapPx = appliedGap * vw;

                // Smart aspect ratio caching for tall portrait poster cards (1:1.45)
                const currentAspectRatio = this.maxAspectRatio || 1.45;
                this.baseMaxItemHeightPx = this.baseItemSizePx * currentAspectRatio;

                this.baseStepX = this.baseItemSizePx + this.baseGapPx;
                this.baseStepY = this.baseMaxItemHeightPx + this.baseGapPx;

                this.baseGridWidth = this.cols * this.baseStepX;
                this.baseGridHeight = this.rows * this.baseStepY;
            }

            init() {
                this.container.innerHTML = '';
                this.items = [];

                for (let i = 0; i < this.totalItems; i++) {
                    const el = document.createElement('div');
                    el.className = 'canvas-item is-loading';

                    const img = document.createElement('img');
                    img.decoding = 'async';
                    
                    // Add loaded class when image successfully loads
                    img.onload = () => {
                        el.classList.remove('is-loading');
                        img.classList.add('loaded');
                        this.recalcAspectRatios();
                    };

                    const itemIndex = this.customItems && this.customItems.length > 0 
                        ? (i % this.customItems.length) 
                        : 0;

                    if (this.customItems && this.customItems.length > 0) {
                        const sourceItem = this.customItems[itemIndex];
                        img.src = sourceItem.image_url || sourceItem.img_src || sourceItem.imgSrc || sourceItem.url || sourceItem.src || '';
                        if (sourceItem.category) {
                            el.dataset.category = sourceItem.category;
                            
                            const catLabel = document.createElement('div');
                            catLabel.className = 'infinite-cat-label';
                            catLabel.innerText = sourceItem.category;
                            el.appendChild(catLabel);
                        }

                        el.dataset.title = sourceItem.title || 'Graphic Project';
                        el.dataset.case_study = sourceItem.case_study || 'Custom graphic design project crafted by Dripp.';
                    }

                    // Fallback to verified image on error
                    img.onerror = () => {
                        el.classList.remove('is-loading');
                        img.onerror = null;
                        img.src = 'https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Graphics/1785782739074_3.png'; 
                        this.recalcAspectRatios();
                    };

                    el.appendChild(img);
                    this.container.appendChild(el);

                    // Symmetrical fixed size factor
                    const chosenFactor = 0.9;

                    img.style.width = `${this.baseItemSizePx * chosenFactor}px`;
                    img.style.height = 'auto';
                    img.style.maxWidth = 'none';
                    img.style.maxHeight = 'none';
                    img.style.display = 'block';

                    el.style.width = 'max-content';
                    // Seed randomized zero-gravity physical parameters for each card
                    const seed = i + 1;
                    const randVal = (Math.sin(seed * 9999) + 1) * 0.5;
                    const randVal2 = (Math.cos(seed * 7777) + 1) * 0.5;
                    const randVal3 = (Math.sin(seed * 3333) + 1) * 0.5;

                    const itemObj = {
                        el: el,
                        imgEl: img,
                        index: i,
                        sizeFactor: chosenFactor,
                        isVisible: true,
                        // Zero Gravity Physical State (Front-facing 2D only)
                        floatX: 0,
                        floatY: 0,
                        rotZ: 0,
                        vx: 0,
                        vy: 0,
                        vRot: 0,
                        mass: 0.75 + randVal * 0.5,
                        wanderSpeed: 0.25 + randVal3 * 0.45,
                        wanderFreq: 0.0006 + randVal * 0.0008,
                        targetRotZ: (randVal - 0.5) * 18, // Unique natural resting tilt (-9 to +9 deg)
                        phaseX: randVal * Math.PI * 2,
                        phaseY: randVal2 * Math.PI * 2
                    };

                    // Mobile fast double-tap detection + desktop dblclick fallback
                    let lastTap = 0;
                    let tapStartX = 0;
                    let tapStartY = 0;

                    el.addEventListener('pointerdown', (ev) => {
                        tapStartX = ev.clientX;
                        tapStartY = ev.clientY;
                    });

                    el.addEventListener('pointerup', (ev) => {
                        const dist = Math.hypot(ev.clientX - tapStartX, ev.clientY - tapStartY);
                        if (dist > 15) return; // Ignore if user was dragging/panning

                        const now = Date.now();
                        const timesince = now - lastTap;
                        if (timesince < 350 && timesince > 0) {
                            this.openSpecificView(itemObj);
                            lastTap = 0;
                        } else {
                            lastTap = now;
                        }
                    });

                    el.addEventListener('dblclick', () => {
                        this.openSpecificView(itemObj);
                    });

                    this.items.push(itemObj);
                }
            }

            recalcAspectRatios() {
                let maxAspectRatio = 1.45;
                for (let i = 0; i < this.items.length; i++) {
                    const img = this.items[i].imgEl;
                    if (img && img.naturalWidth && img.naturalHeight) {
                        const ratio = img.naturalHeight / img.naturalWidth;
                        if (ratio > maxAspectRatio) maxAspectRatio = ratio;
                    }
                }
                if (Math.abs(maxAspectRatio - (this.maxAspectRatio || 1.45)) > 0.02) {
                    this.maxAspectRatio = maxAspectRatio;
                    this.updateMetrics();
                }
            }

            recalcBaseDimensions() {
                for (let i = 0; i < this.items.length; i++) {
                    const item = this.items[i];
                    if (item.imgEl) {
                        item.imgEl.style.width = `${this.baseItemSizePx * item.sizeFactor}px`;
                    }
                }
            }

            bindEvents() {
                this.activePointers = new Map();
                this.initialPinchDistance = 0;
                this.initialPinchZoom = 1;

                // Bind to window instead of container so dragging on blank margin space still pans the canvas
                window.addEventListener('pointerdown', (e) => {
                    // Ignore clicks if list view or specific view is open
                    if (this.isListView || document.getElementById('specific-view').classList.contains('active')) return;

                    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

                    if (this.activePointers.size === 1) {
                        this.state.isDragging = true;
                        this.state.lastPointer.x = e.clientX;
                        this.state.lastPointer.y = e.clientY;
                        this.state.velX = 0;
                        this.state.velY = 0;
                        gsap.killTweensOf(this.state);
                        const c = document.getElementById('cursor');
                        if (c) c.classList.add('active');
                    } else if (this.activePointers.size === 2) {
                        // Two-finger pinch gesture start
                        const pts = Array.from(this.activePointers.values());
                        this.initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                        this.initialPinchZoom = this.state.zoom;
                        if (this.zoomTween) this.zoomTween.kill();
                    }
                });

                window.addEventListener('pointermove', (e) => {
                    if (!this.activePointers.has(e.pointerId)) return;
                    this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

                    if (this.activePointers.size === 2 && this.initialPinchDistance > 10) {
                        // Real-time 2-finger pinch to zoom for mobile users
                        const pts = Array.from(this.activePointers.values());
                        const curDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                        const factor = curDist / this.initialPinchDistance;
                        const minZoom = Math.max(0.38, Number(this.getMinZoom().toFixed(2)));
                        const maxZoom = 2.80;
                        const targetZ = Math.min(maxZoom, Math.max(minZoom, this.initialPinchZoom * factor));
                        this.state.targetZoom = targetZ;
                        this.state.zoom = targetZ;
                    } else if (this.state.isDragging && this.activePointers.size === 1) {
                        const dx = e.clientX - this.state.lastPointer.x;
                        const dy = e.clientY - this.state.lastPointer.y;

                        this.state.targetX += dx;
                        this.state.targetY += dy;

                        this.state.velX = dx;
                        this.state.velY = dy;

                        this.state.lastPointer.x = e.clientX;
                        this.state.lastPointer.y = e.clientY;
                    }
                });

                const handlePointerEnd = (e) => {
                    this.activePointers.delete(e.pointerId);
                    if (this.activePointers.size === 0) {
                        this.state.isDragging = false;
                        const c = document.getElementById('cursor');
                        if (c) c.classList.remove('active');
                    } else if (this.activePointers.size === 1) {
                        const remaining = Array.from(this.activePointers.values())[0];
                        this.state.lastPointer.x = remaining.x;
                        this.state.lastPointer.y = remaining.y;
                    }
                };

                window.addEventListener('pointerup', handlePointerEnd);
                window.addEventListener('pointercancel', handlePointerEnd);

                // Bind wheel to window instead of container so it catches scrolls anywhere on empty screen
                window.addEventListener('wheel', (e) => {
                    if (this.isListView) return; // Disable canvas scroll math in list mode
                    this.state.targetX -= e.deltaX * 1.5;
                    this.state.targetY -= e.deltaY * 1.5;
                    this.state.velX = -e.deltaX * 0.5;
                    this.state.velY = -e.deltaY * 0.5;
                }, { passive: true });

                // Top-Right Interactive Pill Buttons
                const listViewBtn = document.getElementById('list-view-helper');
                if (listViewBtn) {
                    listViewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleListView();
                    });
                }

                const specificViewBtn = document.getElementById('specific-view-helper');
                if (specificViewBtn) {
                    specificViewBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.openSpecificView();
                    });
                }
                
                // GTA V Zoom Controls
                const zoomInBtn = document.getElementById('zoom-in-btn');
                const zoomOutBtn = document.getElementById('zoom-out-btn');
                if (zoomInBtn) {
                    zoomInBtn.addEventListener('click', (e) => { 
                        e.stopPropagation();
                        this.triggerGTAZoom('in');
                    });
                }
                if (zoomOutBtn) {
                    zoomOutBtn.addEventListener('click', (e) => { 
                        e.stopPropagation();
                        this.triggerGTAZoom('out');
                    });
                }

                // Previous / Next Modal Arrows
                const prevBtn = document.getElementById('specific-prev-btn');
                const nextBtn = document.getElementById('specific-next-btn');
                if (prevBtn) {
                    prevBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateSpecificModal(-1);
                    });
                }
                if (nextBtn) {
                    nextBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateSpecificModal(1);
                    });
                }

                // Click to close via "X" button
                document.getElementById('close-specific').addEventListener('click', () => {
                    document.getElementById('specific-view').classList.remove('active');
                });

                // Click to close via clicking anywhere on the blank background overlay
                document.getElementById('specific-view').addEventListener('click', (e) => {
                    const isContent = e.target.closest('.specific-view-img-container') || 
                                      e.target.closest('.specific-view-info') || 
                                      e.target.closest('#magnify-slider') ||
                                      e.target.closest('.specific-nav-btn') ||
                                      e.target.closest('.close-specific-view');
                    if (!isContent) {
                        document.getElementById('specific-view').classList.remove('active');
                    }
                });

                // Touch swipe gestures inside specific view modal
                let touchStartX = 0;
                let touchStartY = 0;
                const specificOverlay = document.getElementById('specific-view');
                if (specificOverlay) {
                    specificOverlay.addEventListener('touchstart', (e) => {
                        if (e.touches.length === 1) {
                            touchStartX = e.touches[0].clientX;
                            touchStartY = e.touches[0].clientY;
                        }
                    }, { passive: true });

                    specificOverlay.addEventListener('touchend', (e) => {
                        if (e.changedTouches.length === 1 && specificOverlay.classList.contains('active')) {
                            const touchEndX = e.changedTouches[0].clientX;
                            const touchEndY = e.changedTouches[0].clientY;
                            const dx = touchEndX - touchStartX;
                            const dy = touchEndY - touchStartY;

                            // Horizontal swipe detection (> 45px delta and horizontal gesture)
                            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
                                if (dx < 0) {
                                    // Swiped Left -> Go Next
                                    navigateSpecificModal(1);
                                } else {
                                    // Swiped Right -> Go Prev
                                    navigateSpecificModal(-1);
                                }
                            }
                        }
                    }, { passive: true });
                }

                // Keyboard interactions (Space to Reset, Enter to Toggle List, M to toggle Space, +/- to GTA Zoom, Left/Right for Specific View)
                this.isListView = false;

                // Tap on Reset UI
                const resetHelper = document.getElementById('reset-helper');
                if (resetHelper) {
                    resetHelper.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (!this.isListView && !document.getElementById('specific-view').classList.contains('active')) {
                            gsap.to(this.state, {
                                targetX: 0,
                                targetY: 0,
                                x: 0,
                                y: 0,
                                velX: 0,
                                velY: 0,
                                duration: 1.5,
                                ease: "power3.inOut"
                            });
                        }
                    });
                }

                window.addEventListener('keydown', (e) => {
                    // Escape: Close Specific View
                    if (e.code === 'Escape') {
                        const sv = document.getElementById('specific-view');
                        if (sv && sv.classList.contains('active')) {
                            sv.classList.remove('active');
                        }
                    }

                    // Arrow Keys: Navigate through images when in Specific View
                    const sv = document.getElementById('specific-view');
                    if (sv && sv.classList.contains('active')) {
                        if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            navigateSpecificModal(-1);
                            return;
                        }
                        if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            navigateSpecificModal(1);
                            return;
                        }
                    }

                    // GTA V Zoom Keybindings (+ / = to zoom in, - / _ to zoom out)
                    if ((e.code === 'Equal' || e.key === '+' || e.key === '=') && !this.isListView && !document.getElementById('specific-view').classList.contains('active')) {
                        e.preventDefault();
                        this.triggerGTAZoom('in');
                    }
                    if ((e.code === 'Minus' || e.key === '-' || e.key === '_') && !this.isListView && !document.getElementById('specific-view').classList.contains('active')) {
                        e.preventDefault();
                        this.triggerGTAZoom('out');
                    }

                    // M: Toggle Space Mode
                    if (e.code === 'KeyM') {
                        e.preventDefault();
                        if (!this.isListView) toggleSpaceMode(); // Block Space Mode in List View
                    }

                    // Spacebar: Reset coordinates back to absolute zero origin
                    if (e.code === 'Space' && !this.isListView && !document.getElementById('specific-view').classList.contains('active')) {
                        e.preventDefault();
                        gsap.to(this.state, {
                            targetX: 0,
                            targetY: 0,
                            x: 0,
                            y: 0,
                            velX: 0,
                            velY: 0,
                            duration: 1.5,
                            ease: "power3.inOut"
                        });
                    }

                    // Enter: Toggle between Infinite 2D Grid and 1D List View
                    if (e.code === 'Enter') {
                        e.preventDefault();
                        this.toggleListView();
                    }
                });

                // Cache bound function to cleanly add/remove from GSAP ticker
                this.renderBound = this.render.bind(this);
            }

            openSpecificView(targetItem) {
                if (this.isListView) return;
                
                let item = targetItem;
                if (!item && this.items && this.items.length > 0) {
                    // Intelligently find the item closest to center of the viewport
                    let minDistance = Infinity;
                    const zoom = this.state.zoom;
                    const stepX = this.baseStepX * zoom;
                    const stepY = this.baseStepY * zoom;
                    const gridWidth = this.cols * stepX;
                    const gridHeight = this.rows * stepY;
                    const limitX = gridWidth * 0.5;
                    const limitY = gridHeight * 0.5;

                    for (let i = 0; i < this.items.length; i++) {
                        const cur = this.items[i];
                        const col = cur.index % this.cols;
                        const row = Math.floor(cur.index / this.cols);
                        const staggerY = (col % 2 === 1) ? (stepY * 0.5) : 0;
                        const homeX = (col * stepX) - limitX + (stepX * 0.5);
                        const homeY = (row * stepY) - limitY + (stepY * 0.5) + staggerY;
                        const absX = homeX + this.state.x;
                        const absY = homeY + this.state.y;
                        const wx = this.wrap(absX, -limitX, limitX);
                        const wy = this.wrap(absY, -limitY, limitY);
                        const dist = Math.hypot(wx, wy);
                        if (dist < minDistance) {
                            minDistance = dist;
                            item = cur;
                        }
                    }
                }

                if (!item) return;
                openSpecificModal(item, this.customItems);
            }

            toggleListView() {
                // Safety requirement: Transition out of TRIPP mode if active before going to List View
                if (spaceModeActive) {
                    toggleSpaceMode(); // Instantly toggles the space states back to normal
                }

                this.isListView = !this.isListView;
                const showcase = document.getElementById('portfolio-showcase');
                const dragMsg = document.getElementById('drag-msg');

                const spWrapper = document.querySelector('.sp-wrapper');
                const listViewHelperText = document.querySelector('#list-view-helper span:first-child');

                if (this.isListView) {
                    showcase.classList.add('list-view-mode');
                    showcase.style.overflowY = 'auto'; // Enable native v-scroll
                    if (dragMsg) dragMsg.classList.add('hidden'); // Hide Drag msg completely in list
                    const resetHelperNode = document.getElementById('reset-helper');
                    if (resetHelperNode) resetHelperNode.classList.add('hidden'); // Hide Spc helper
                    if (spWrapper) spWrapper.style.display = 'none';
                    if (listViewHelperText) listViewHelperText.innerText = 'Infinite View';

                    gsap.ticker.remove(this.renderBound); // stop render loop

                    // Tell React to show the category folder view
                    setIsListViewActive(true);
                    setActiveCategory(null);
                } else {
                    showcase.classList.remove('list-view-mode');
                    showcase.style.overflowY = 'hidden';
                    if (dragMsg) dragMsg.classList.remove('hidden'); // Show Drag msg again
                    const resetHelperNode2 = document.getElementById('reset-helper');
                    if (resetHelperNode2) resetHelperNode2.classList.remove('hidden');
                    if (spWrapper) spWrapper.style.display = 'block';
                    if (listViewHelperText) listViewHelperText.innerText = 'List View';

                    setIsListViewActive(false);

                    // Snap to original state before turning renderer back on to prevent jumping
                    this.state.x = 0;
                    this.state.y = 0;
                    this.state.targetX = 0;
                    this.state.targetY = 0;

                    gsap.ticker.add(this.renderBound); // restart loop
                }
            }

            // --- GTA V DYNAMIC ZOOM ENGINE ---
            triggerGTAZoom(direction) {
                if (this.isListView) return;
                const specificView = document.getElementById('specific-view');
                if (specificView && specificView.classList.contains('active')) return;

                const minZoom = Math.max(0.38, Number(this.getMinZoom().toFixed(2)));
                const maxZoom = 2.80;

                // Rich, gapless variable zoom ladder guaranteed to never reveal black screen borders
                const rawSteps = [
                    minZoom,
                    Number((minZoom + 0.14).toFixed(2)),
                    Number((minZoom + 0.30).toFixed(2)),
                    Number((minZoom + 0.48).toFixed(2)),
                    1.00,
                    1.28,
                    1.65,
                    2.15,
                    maxZoom
                ];
                const zoomSteps = rawSteps.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);

                let targetZoom = this.state.targetZoom;
                const current = this.state.targetZoom;

                if (direction === 'in') {
                    const nextTier = zoomSteps.find(z => z > current + 0.04);
                    targetZoom = nextTier !== undefined ? nextTier : zoomSteps[zoomSteps.length - 1];
                } else {
                    const prevTier = [...zoomSteps].reverse().find(z => z < current - 0.04);
                    targetZoom = prevTier !== undefined ? prevTier : zoomSteps[0];
                }

                // Play synthesized zero-latency GTA sound
                playGTAZoomSound(direction);

                // Trigger space warp in tripp mode
                if (typeof window.__triggerSpaceWarp === 'function' && spaceModeActive) {
                    window.__triggerSpaceWarp(direction);
                }

                // Execute GTA transition
                this.executeGTAZoomAnimation(targetZoom, direction);
            }

            executeGTAZoomAnimation(targetZoom, direction) {
                this.state.targetZoom = targetZoom;

                if (this.zoomTween) this.zoomTween.kill();

                const isDiveIn = direction === 'in';
                const duration = isDiveIn ? 0.65 : 0.55;
                const ease = isDiveIn ? "power3.inOut" : "power2.out";

                // Camera Kinetic Zoom Tween (smoothly interpolates zoom; render() handles GPU transforms)
                this.zoomTween = gsap.to(this.state, {
                    zoom: targetZoom,
                    duration: duration,
                    ease: ease
                });

                // Subtle hardware-accelerated camera recoil settle on the viewport
                const showcase = document.getElementById('portfolio-showcase');
                if (showcase) {
                    if (isDiveIn) {
                        gsap.fromTo(showcase, 
                            { scale: 0.99 },
                            { scale: 1, duration: 0.45, ease: "power2.out", clearProps: "scale" }
                        );
                    } else {
                        gsap.fromTo(showcase, 
                            { scale: 1.01 },
                            { scale: 1, duration: 0.45, ease: "power2.out", clearProps: "scale" }
                        );
                    }
                }
            }

            wrap(value, min, max) {
                const range = max - min;
                return ((((value - min) % range) + range) % range) + min;
            }

            render() {
                // Return immediately if list view is active to block dragging parallax overlay limits
                if (this.isListView) return;

                // Apply power3.out style smooth friction easing on release
                if (!this.state.isDragging) {
                    this.state.velX *= 0.92;
                    this.state.velY *= 0.92;
                    this.state.targetX += this.state.velX;
                    this.state.targetY += this.state.velY;
                }

                // Export velocity for space bg interactivity
                globalVelX = this.state.velX;
                globalVelY = this.state.velY;

                // Smooth interpolation for dragging tightness
                this.state.x += (this.state.targetX - this.state.x) * 0.2;
                this.state.y += (this.state.targetY - this.state.y) * 0.2;

                if (!this.zoomTween || !this.zoomTween.isActive()) {
                    if (Math.abs(this.state.targetZoom - this.state.zoom) > 0.001) {
                        this.state.zoom += (this.state.targetZoom - this.state.zoom) * 0.15;
                    }
                }

                const zoom = this.state.zoom;
                const stepX = this.baseStepX * zoom;
                const stepY = this.baseStepY * zoom;
                const gridWidth = this.cols * stepX;
                const gridHeight = this.rows * stepY;
                const limitX = gridWidth * 0.5;
                const limitY = gridHeight * 0.5;

                const halfVW = (typeof window !== 'undefined' ? window.innerWidth : 1440) * 0.5;
                const halfVH = (typeof window !== 'undefined' ? window.innerHeight : 900) * 0.5;
                const cullingMargin = (this.baseItemSizePx * zoom) + 120;

                const time = performance.now();
                const isTripp = typeof spaceModeActive !== 'undefined' && spaceModeActive;

                for (let i = 0; i < this.items.length; i++) {
                    const item = this.items[i];

                    const col = i % this.cols;
                    const row = Math.floor(i / this.cols);
                    const staggerY = (col % 2 === 1) ? (stepY * 0.5) : 0;
                    const homeX = (col * stepX) - limitX + (stepX * 0.5);
                    const homeY = (row * stepY) - limitY + (stepY * 0.5) + staggerY;

                    const absoluteX = homeX + this.state.x;
                    const absoluteY = homeY + this.state.y;

                    const wrappedX = this.wrap(absoluteX, -limitX, limitX);
                    const wrappedY = this.wrap(absoluteY, -limitY, limitY);

                    // --- REAL ZERO GRAVITY 2D FRONT-FACING CARD PHYSICS ---
                    if (isTripp) {
                        // 1. Organic multi-frequency harmonic turbulence
                        const t = time * item.wanderFreq;
                        const harmonicForceX = Math.sin(t + item.phaseX) * 0.09 + Math.cos(t * 1.6 + item.phaseY) * 0.045;
                        const harmonicForceY = Math.cos(t + item.phaseY) * 0.09 + Math.sin(t * 1.4 + item.phaseX) * 0.045;
                        
                        item.vx += (harmonicForceX * item.wanderSpeed) / item.mass;
                        item.vy += (harmonicForceY * item.wanderSpeed) / item.mass;

                        // 2. Drag momentum inertia (canvas panning pushes floating cards in 2D space)
                        if (Math.abs(globalVelX) > 0.01 || Math.abs(globalVelY) > 0.01) {
                            item.vx += (globalVelX * 0.04) / item.mass;
                            item.vy += (globalVelY * 0.04) / item.mass;
                            item.vRot += ((-globalVelX + globalVelY) * 0.007) / item.mass;
                        }

                        // 3. Ultra-soft tether spring to prevent cards drifting off into infinity
                        const spring = 0.0005;
                        item.vx -= item.floatX * spring;
                        item.vy -= item.floatY * spring;

                        // 4. Low zero-g space vacuum damping (high momentum retention)
                        item.vx *= 0.985;
                        item.vy *= 0.985;

                        item.floatX += item.vx * (zoom * 0.8 + 0.2);
                        item.floatY += item.vy * (zoom * 0.8 + 0.2);

                        // 5. Pure 2D Angular Momentum (Front-Facing Z-rotation only, no 3D tilt)
                        const rotSpring = 0.0012;
                        item.vRot -= (item.rotZ - item.targetRotZ) * rotSpring;
                        item.vRot += Math.sin(t * 0.9 + item.phaseX) * 0.012; // gentle organic wobble
                        item.vRot *= 0.98;
                        item.rotZ += item.vRot;

                        // Max 2D tilt clamp for clean aesthetics
                        item.rotZ = Math.max(-26, Math.min(26, item.rotZ));
                    } else {
                        // Smoothly lerp back to 0 & damp velocities on exit
                        item.vx *= 0.85;
                        item.vy *= 0.85;
                        item.vRot *= 0.85;
                        item.floatX += (0 - item.floatX) * 0.12;
                        item.floatY += (0 - item.floatY) * 0.12;
                        item.rotZ += (0 - item.rotZ) * 0.12;
                    }

                    const finalX = wrappedX + item.floatX;
                    const finalY = wrappedY + item.floatY;

                    // Frustum Culling Check (accounting for floating margin)
                    const isOffscreen = Math.abs(finalX) > (halfVW + cullingMargin) || Math.abs(finalY) > (halfVH + cullingMargin);

                    if (isOffscreen) {
                        if (item.isVisible) {
                            item.el.style.visibility = 'hidden';
                            item.isVisible = false;
                        }
                    } else {
                        if (!item.isVisible) {
                            item.el.style.visibility = 'visible';
                            item.isVisible = true;
                        }
                        if (isTripp || Math.abs(item.rotZ) > 0.02 || Math.abs(item.floatX) > 0.1 || Math.abs(item.floatY) > 0.1) {
                            item.el.style.transform = `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${zoom.toFixed(4)}) rotate(${item.rotZ.toFixed(2)}deg)`;
                        } else {
                            item.el.style.transform = `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0) translate(-50%, -50%) scale(${zoom.toFixed(4)})`;
                        }
                    }
                }
            }

            // Proper context cleanup method mapping
            destroy() {
                if (this.zoomTween) this.zoomTween.kill();
                gsap.ticker.remove(this.renderBound);
                window.removeEventListener('resize', this.resizeBound);
                if (this.container) {
                    this.container.innerHTML = '';
                }
            }
        }

        // --- DEPLOY INSTANCE ---
        async function fetchGraphicsAndInit() {
            let fetchedItems = [];

            try {
                const res = await fetch('/api/graphics');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        fetchedItems = data;
                        setGraphics(data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch graphics from Supabase", err);
            }

            // Fallback to verified image if no items exist in database
            if (fetchedItems.length === 0) {
                fetchedItems = [{
                    image_url: 'https://pub-72c28e7d3884434bac75ca152fdf30bb.r2.dev/Graphics/1785782739074_3.png',
                    category: 'Event Poster',
                    title: 'The Paddle Party Poster Design',
                    case_study: 'A playful and high-contrast summer sports event poster designed for tournament promotion.'
                }];
                setGraphics(fetchedItems);
            }

            const graphicCanvas = new InfiniteCanvas('canvas-container', {
                imageSize: '20',       // 20vw sizing base
                gap: '1.5',            // Clean 1.5vw gap so cards never touch or overlap
                customItems: fetchedItems // Strictly real uploaded graphics
            });
            window.canvasEngine = graphicCanvas;
        }
        
        fetchGraphicsAndInit();

        // --- SPACE MODE 3D ENGINE ---
        let spaceModeActive = false;
        const spaceCanvas = document.getElementById('space-canvas');
        const ctx = spaceCanvas.getContext('2d');
        let stars = [];
        const numStars = window.innerWidth <= 768 ? 250 : 800; // Less particles on mobile
        let spaceAnimationId;
        const warpState = { speed: 0, direction: 'in' };

        window.__triggerSpaceWarp = (direction) => {
            warpState.direction = direction;
            gsap.killTweensOf(warpState);
            gsap.timeline()
                .to(warpState, { speed: direction === 'in' ? 55 : 35, duration: 0.35, ease: "power2.in" })
                .to(warpState, { speed: 0, duration: 0.65, ease: "power3.out" });
        };

        function resizeSpace() {
            spaceCanvas.width = window.innerWidth;
            spaceCanvas.height = window.innerHeight;
        }

        function initSpace() {
            resizeSpace();
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * spaceCanvas.width,
                    y: Math.random() * spaceCanvas.height,
                    z: Math.random() * spaceCanvas.width, // Depth
                    size: Math.random() * 1.5,
                    opacity: Math.random()
                });
            }
        }

        function animateSpace() {
            ctx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);

            // Center origin
            const cx = spaceCanvas.width / 2;
            const cy = spaceCanvas.height / 2;
            const currentWarp = warpState.speed;
            const isWarping = currentWarp > 0.1;

            stars.forEach(star => {
                const prevZ = star.z;
                const prevK = 128.0 / Math.max(1, prevZ);
                const prevPx = (star.x - cx) * prevK + cx;
                const prevPy = (star.y - cy) * prevK + cy;

                if (isWarping) {
                    if (warpState.direction === 'in') {
                        star.z -= (0.5 + currentWarp);
                    } else {
                        star.z += (currentWarp * 0.8);
                        star.y += (currentWarp * 0.5);
                    }
                } else {
                    // Move stars towards viewer natively, but dramatically react to user pan velocity 
                    star.z -= 0.5;
                }

                // Allow stars to pan left/right/up/down based on canvas drag
                star.x -= globalVelX * 0.2;
                star.y -= globalVelY * 0.2;

                // Wrap horizontal/vertical star space
                if (star.x < 0) star.x = spaceCanvas.width;
                if (star.x > spaceCanvas.width) star.x = 0;
                if (star.y < 0) star.y = spaceCanvas.height;
                if (star.y > spaceCanvas.height) star.y = 0;

                // Wrap Z depth
                if (star.z <= 0) {
                    star.z = spaceCanvas.width;
                    star.x = Math.random() * spaceCanvas.width;
                    star.y = Math.random() * spaceCanvas.height;
                } else if (star.z > spaceCanvas.width * 1.5) {
                    star.z = 10;
                    star.x = Math.random() * spaceCanvas.width;
                    star.y = Math.random() * spaceCanvas.height;
                }

                // Calculate 3D projection
                const k = 128.0 / Math.max(1, star.z);
                const px = (star.x - cx) * k + cx;
                const py = (star.y - cy) * k + cy;
                const size = Math.max(0.1, star.size * k);

                // Draw warp trail if in hyperdrive speed
                if (isWarping && currentWarp > 1.5) {
                    ctx.beginPath();
                    ctx.moveTo(prevPx, prevPy);
                    ctx.lineTo(px, py);
                    const trailAlpha = Math.min(0.9, star.opacity * (currentWarp / 25));
                    ctx.strokeStyle = `rgba(235, 215, 63, ${trailAlpha})`;
                    ctx.lineWidth = Math.min(3.5, size * 1.5);
                    ctx.stroke();
                }

                // Draw star
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();
            });

            if (spaceModeActive) {
                spaceAnimationId = requestAnimationFrame(animateSpace);
            }
        }

        function toggleSpaceMode() {
            // Safety block: prevent enabling Tripp from List View
            const showcase = document.getElementById('portfolio-showcase');
            if (showcase && showcase.classList.contains('list-view-mode') && !spaceModeActive) {
                return;
            }

            const btn = document.getElementById('tripp-toggle-btn');
            const btnText = document.getElementById('tripp-btn-text');
            if (!btn) return;

            const btnRect = btn.getBoundingClientRect();
            const originX = btnRect.left + btnRect.width / 2;
            const originY = btnRect.top + btnRect.height / 2;

            const isGoingTripp = !spaceModeActive;
            playTripToggleSound(isGoingTripp);

            // Compute maximum distance to screen corners for 100% solid whole-page coverage
            const maxDist = Math.hypot(
                Math.max(originX, window.innerWidth - originX),
                Math.max(originY, window.innerHeight - originY)
            ) * 1.5;

            btn.style.pointerEvents = 'none';

            // Solid Full-Page Cosmic Veil
            const solidCurtain = document.createElement('div');
            solidCurtain.className = 'tripp-solid-curtain';
            solidCurtain.style.cssText = `
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 120;
                background: #070709;
                clip-path: circle(0px at ${originX}px ${originY}px);
                -webkit-clip-path: circle(0px at ${originX}px ${originY}px);
            `;

            // Radiant golden shockwave leading edge
            const shockwave = document.createElement('div');
            shockwave.className = 'tripp-shockwave-ring';
            shockwave.style.cssText = `
                position: fixed;
                left: ${originX}px;
                top: ${originY}px;
                width: 0px;
                height: 0px;
                border-radius: 50%;
                border: 3px solid rgba(235, 215, 63, 0.95);
                box-shadow: 0 0 50px rgba(235, 215, 63, 0.8), inset 0 0 25px rgba(235, 215, 63, 0.5);
                transform: translate(-50%, -50%);
                pointer-events: none;
                z-index: 125;
            `;

            document.body.appendChild(solidCurtain);
            document.body.appendChild(shockwave);

            const tl = gsap.timeline({
                onComplete: () => {
                    solidCurtain.remove();
                    shockwave.remove();
                    btn.style.pointerEvents = 'auto';
                }
            });

            // 1. Expanding Golden Shockwave
            tl.to(shockwave, {
                width: maxDist * 2,
                height: maxDist * 2,
                opacity: 0,
                duration: 0.85,
                ease: "power2.out"
            }, 0);

            // 2. Solid Curtain Sweeps and Engulfs 100% of the entire page
            const clipPathObj = { r: 0 };
            tl.to(clipPathObj, {
                r: maxDist,
                duration: 0.45,
                ease: "power2.inOut",
                onUpdate: () => {
                    const val = `circle(${clipPathObj.r}px at ${originX}px ${originY}px)`;
                    solidCurtain.style.clipPath = val;
                    solidCurtain.style.webkitClipPath = val;
                }
            }, 0);

            // 3. Switch states at full 100% solid coverage (seamless, zero flicker)
            tl.add(() => {
                spaceModeActive = !spaceModeActive;
                document.body.classList.toggle('space-mode-active');

                if (spaceModeActive) {
                    btn.classList.add('active-tripp');
                    if (btnText) btnText.innerText = 'TRIPPING';
                    initSpace();
                    animateSpace();
                    window.addEventListener('resize', resizeSpace);

                    // Cosmic Zero-Gravity Lift-Off wave with randomized physics impulse
                    if (window.canvasEngine && window.canvasEngine.items) {
                        window.canvasEngine.items.forEach((item, idx) => {
                            const angle = Math.random() * Math.PI * 2;
                            const impulse = (0.8 + Math.random() * 1.5) / item.mass;
                            item.vx = Math.cos(angle) * impulse;
                            item.vy = Math.sin(angle) * impulse;
                            item.vRot = ((Math.random() - 0.5) * 0.45) / item.mass;
                            item.targetRotZ = (Math.random() - 0.5) * 20;

                            const delay = (idx % 8) * 0.02;
                            gsap.fromTo(item.el, 
                                { scale: 0.94 },
                                { scale: 1, duration: 0.75, delay: delay, ease: "back.out(1.4)" }
                            );
                        });
                    }
                } else {
                    btn.classList.remove('active-tripp');
                    if (btnText) btnText.innerText = 'TRIPP';
                    cancelAnimationFrame(spaceAnimationId);
                    window.removeEventListener('resize', resizeSpace);
                }
            }, 0.45);

            // 4. Smooth curtain dissolve revealing the new world across the entire screen
            tl.to(solidCurtain, {
                opacity: 0,
                duration: 0.40,
                ease: "power2.out"
            }, 0.45);
        }

        // Bind click to the new UI button
        document.getElementById('tripp-toggle-btn').addEventListener('click', toggleSpaceMode);

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      if (window.canvasEngine) {
        window.canvasEngine.destroy();
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --deep-black: #050505;
            --pure-white: #ffffff;
            --brand-yellow: #ebd73f;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            cursor: none;
            user-select: none;
        }

        body {
            background-color: var(--deep-black);
            color: var(--pure-white);
            font-family: 'Clash Display', sans-serif;
            overflow: hidden;
            width: 100vw;
            height: 100vh;
        }

        /* Nav back button */
        .nav-back {
    position: fixed;
    top: 30px;
    left: 30px;
    z-index: 9999;
    color: var(--deep-black, #050505) !important;
    background-color: var(--brand-yellow, #ebd73f);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-size: 1.5rem;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(235, 215, 63, 0.4);
    transition: transform 0.3s ease, background-color 0.3s ease;
}

.nav-back:hover {
    transform: scale(1.1);
    background-color: #fff;
    color: #000 !important;
}

        /* Custom Cursor */
        .cursor {
            position: fixed;
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            border: 2px solid var(--brand-yellow);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s, background-color 0.3s;
        }

        .cursor.active {
            width: 50px;
            height: 50px;
            background-color: rgba(235, 215, 63, 0.1);
            backdrop-filter: blur(2px);
        }

        /* Wrapper matching React props specification */
        #portfolio-showcase {
            width: 100vw;
            height: 100vh;
            background-color: #0a0a0a;
            overflow: hidden;
            position: relative;
        }

        .infinite-canvas {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            opacity: 0.9;
            transition: opacity 0.5s ease;
            transform-style: flat;
            pointer-events: none;
        }

        #portfolio-showcase:hover .infinite-canvas {
            opacity: 1;
        }

        .canvas-item {
            position: absolute;
            top: 0;
            left: 0;
            background-color: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            will-change: transform;
            contain: layout style paint;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            transform-origin: center center;
            transform-style: flat;
            pointer-events: auto;
            transition: box-shadow 0.4s ease, border-color 0.4s ease, background-color 0.4s ease;
        }

        /* Creative Geometric Morphing Loader */
        .canvas-item.is-loading {
            background-color: #0a0a0a;
        }

        .canvas-item.is-loading::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            border: 1px solid rgba(255, 255, 255, 0.15);
            transform: translate(-50%, -50%);
            animation: creativeMorph 2.4s cubic-bezier(0.77, 0, 0.175, 1) infinite;
            z-index: 1;
        }

        .canvas-item.is-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6px;
            height: 6px;
            background: var(--brand-yellow);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: pulseDot 2.4s ease-in-out infinite;
            z-index: 2;
        }

        @keyframes creativeMorph {
            0% {
                border-radius: 0%;
                transform: translate(-50%, -50%) rotate(0deg) scale(1);
                border-color: rgba(255, 255, 255, 0.15);
                border-width: 1px;
            }
            50% {
                border-radius: 50%;
                transform: translate(-50%, -50%) rotate(180deg) scale(1.4);
                border-color: rgba(235, 215, 63, 0.6);
                border-width: 2px;
            }
            100% {
                border-radius: 0%;
                transform: translate(-50%, -50%) rotate(360deg) scale(1);
                border-color: rgba(255, 255, 255, 0.15);
                border-width: 1px;
            }
        }

        @keyframes pulseDot {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
            50% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        }

        .canvas-item img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            pointer-events: none;
            transition: transform 0.5s ease, opacity 0.5s ease;
            opacity: 0;
        }

        .canvas-item img.loaded {
            opacity: 1;
        }

        .canvas-item:hover img {
            transform: scale(1.05);
        }

        .canvas-item::after {
            content: '';
            position: absolute;
            inset: 0;
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            pointer-events: none;
        }

        .drag-instruction {
            position: fixed;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.6rem;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            z-index: 10;
            mix-blend-mode: difference;
            transition: opacity 0.5s ease;
        }

        .drag-instruction.hidden {
            opacity: 0 !important;
        }

        body:has(#specific-view.active) .features-list,
        body:has(#portfolio-showcase.list-view-mode) .features-list,
        .features-list.hidden {
            opacity: 0 !important;
            pointer-events: none !important;
            visibility: hidden !important;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .features-list {
            position: fixed;
            top: 30px;
            right: 35px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
            font-family: 'Clash Display', sans-serif;
            font-size: 0.75rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            pointer-events: none;
        }

        .feature-item {
            display: inline-flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            width: fit-content;
            pointer-events: auto;
            cursor: pointer;
            background: rgba(12, 12, 14, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 5px 6px 5px 14px;
            border-radius: 30px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            color: #ffffff;
            font-weight: 500;
            user-select: none;
        }

        .feature-item:hover {
            background: rgba(24, 24, 30, 0.95);
            border-color: rgba(235, 215, 63, 0.6);
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 18px rgba(235, 215, 63, 0.25);
        }

        .feature-item:active {
            transform: translateY(0px) scale(0.96);
            background: rgba(235, 215, 63, 0.15);
            border-color: var(--brand-yellow);
        }

        .feature-item > span:first-child {
            color: rgba(255, 255, 255, 0.95);
            font-weight: 600;
            letter-spacing: 1.2px;
            font-size: 0.72rem;
            white-space: nowrap;
        }

        .feature-item.hidden {
            opacity: 0 !important;
            pointer-events: none;
            transform: translateY(-10px);
        }

        .feature-key {
            background: linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%);
            color: #000000 !important;
            padding: 5px 12px;
            border-radius: 20px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.62rem;
            font-weight: 700;
            letter-spacing: 1px;
            box-shadow: 0 2px 10px rgba(235, 215, 63, 0.3);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
        }

        .feature-key span {
            color: #000000 !important;
        }

        /* Tripp Sparkle Button (Uiverse JkHuger style via Dripp Brand Colors) */
        .sp-wrapper {
            position: fixed;
            bottom: 40px;
            left: 50px;
            z-index: 100;
        }

        .sparkle-button {
            --transition: 0.3s;
            --spark: 1.8s;
            --cut: 0.1em;
            --active: 0;
            --bg: radial-gradient(40% 50% at center 100%,
                    hsl(53 calc(var(--active) * 97%) 72% / var(--active)),
                    transparent),
                radial-gradient(80% 100% at center 120%,
                    hsl(53 calc(var(--active) * 97%) 70% / var(--active)),
                    transparent),
                hsl(53 calc(var(--active) * 97%) calc((var(--active) * 44%) + 12%));
            background: var(--bg);
            font-size: 0.75rem;
            font-family: 'Panchang', sans-serif;
            letter-spacing: 2px;
            font-weight: 800;
            border: 0;
            cursor: pointer;
            padding: 0.6em 1.25em;
            display: flex;
            align-items: center;
            gap: 0.4em;
            white-space: nowrap;
            border-radius: 100px;
            position: relative;
            box-shadow: 0 0 calc(var(--active) * 3em) calc(var(--active) * 1em) hsl(53 97% 61% / 0.5),
                0 0em 0 0 hsl(53 calc(var(--active) * 97%) calc((var(--active) * 50%) + 30%)) inset,
                0 -0.05em 0 0 hsl(53 calc(var(--active) * 97%) calc(var(--active) * 60%)) inset;
            transition: box-shadow var(--transition), scale var(--transition), background var(--transition);
            scale: calc(1 + (var(--active) * 0.05));
        }

        .sparkle-button:active {
            scale: 1;
            transition: .3s;
        }

        .sparkle path {
            color: hsl(0 0% calc((var(--active, 0) * 70%) + var(--base)));
            transform-box: fill-box;
            transform-origin: center;
            fill: currentColor;
            stroke: currentColor;
            animation-delay: calc((var(--transition) * 1.5) + (var(--delay) * 1s));
            animation-duration: 0.6s;
            transition: color var(--transition);
        }

        .sparkle-button:is(:hover, :focus-visible, .active-tripp) path {
            animation-name: bounce;
        }

        @keyframes bounce {

            35%,
            65% {
                scale: var(--scale);
            }
        }

        .sparkle path:nth-of-type(1) {
            --scale: 0.5;
            --delay: 0.1;
            --base: 40%;
        }

        .sparkle path:nth-of-type(2) {
            --scale: 1.5;
            --delay: 0.2;
            --base: 20%;
        }

        .sparkle path:nth-of-type(3) {
            --scale: 2.5;
            --delay: 0.35;
            --base: 30%;
        }

        .sparkle-button:before {
            content: "";
            position: absolute;
            inset: -0.2em;
            z-index: -1;
            border: 0.25em solid hsl(53 97% 50% / 0.5);
            border-radius: 100px;
            opacity: var(--active, 0);
            transition: opacity var(--transition);
        }

        .spark {
            position: absolute;
            inset: 0;
            border-radius: 100px;
            rotate: 0deg;
            overflow: hidden;
            mask: linear-gradient(white, transparent 50%);
            -webkit-mask: linear-gradient(white, transparent 50%);
            animation: flip calc(var(--spark) * 2) infinite steps(2, end);
        }

        @keyframes flip {
            to {
                rotate: 360deg;
            }
        }

        .spark:before {
            content: "";
            position: absolute;
            width: 200%;
            aspect-ratio: 1;
            top: 0%;
            left: 50%;
            z-index: -1;
            translate: -50% -15%;
            rotate: 0;
            transform: rotate(-90deg);
            opacity: calc((var(--active)) + 0.4);
            background: conic-gradient(from 0deg,
                    transparent 0 340deg,
                    white 360deg);
            transition: opacity var(--transition);
            animation: rotate var(--spark) linear infinite both;
        }

        .spark:after {
            content: "";
            position: absolute;
            inset: var(--cut);
            border-radius: 100px;
        }

        .backdrop {
            position: absolute;
            inset: var(--cut);
            background: var(--bg);
            border-radius: 100px;
            transition: background var(--transition);
        }

        @keyframes rotate {
            to {
                transform: rotate(90deg);
            }
        }

        .sparkle-button:is(:hover, :focus-visible, .active-tripp)~.particle-pen {
            --active: 1;
            --play-state: running;
        }

        .sparkle-button:is(:hover, :focus-visible, .active-tripp) {
            --active: 1;
            --play-state: running;
        }

        .particle-pen {
            position: absolute;
            width: 200%;
            aspect-ratio: 1;
            top: 50%;
            left: 50%;
            translate: -50% -50%;
            mask: radial-gradient(white, transparent 65%);
            -webkit-mask: radial-gradient(white, transparent 65%);
            z-index: -1;
            opacity: var(--active, 0);
            transition: opacity var(--transition);
            pointer-events: none;
        }

        .particle {
            fill: white;
            width: calc(var(--size, 0.25) * 1rem);
            aspect-ratio: 1;
            position: absolute;
            top: calc(var(--y) * 1%);
            left: calc(var(--x) * 1%);
            opacity: var(--alpha, 1);
            animation: float-out calc(var(--duration, 1) * 1s) calc(var(--delay) * -1s) infinite linear;
            transform-origin: var(--origin-x, 1000%) var(--origin-y, 1000%);
            z-index: -1;
            animation-play-state: var(--play-state, paused);
        }

        .particle path {
            fill: hsl(53 90% 70%);
            stroke: none;
        }

        .particle:nth-of-type(even) {
            animation-direction: reverse;
        }

        @keyframes float-out {
            to {
                rotate: 360deg;
            }
        }

        .text {
            translate: 2% -6%;
            color: var(--brand-yellow);
            transition: color var(--transition);
            position: relative;
            z-index: 2;
        }

        .sparkle-button:is(:hover, :focus-visible, .active-tripp) .text {
            color: var(--deep-black);
        }

        .sparkle-button svg.particle {
            inline-size: 1.25em;
            translate: -25% -5%;
            position: relative;
            z-index: 2;
        }

        /* 1D List View Mode transition class */
        .list-view-mode .canvas-item {
            position: relative;
            transform: none !important;
            margin: 0 0 20px 0;
            width: 100% !important;
            height: auto !important;
            max-width: none;
            border-radius: 4px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.05);
            display: inline-block;
        }

        /* Remove creative staggers to let native columns flow neatly */
        .list-view-mode .canvas-item:nth-child(even),
        .list-view-mode .canvas-item:nth-child(odd) {
            transform: none !important;
        }

        .list-view-mode .canvas-item img {
            width: 100%;
            height: auto;
            position: relative;
            object-fit: cover;
            border-radius: 4px;
            filter: none;
            transition: transform 0.5s ease;
            display: block;
        }

        .list-view-mode .canvas-item:hover img {
            transform: scale(1.02);
        }

        .list-view-mode .infinite-canvas {
            position: relative;
            top: 0;
            left: 0;
            transform: none !important;
            overflow-y: auto;
            height: 100vh;
            padding: 120px 5vw;
            display: block;
            column-count: 3;
            column-gap: 20px;
            touch-action: pan-y;
        }

        @media (max-width: 900px) {
            .list-view-mode .infinite-canvas {
                column-count: 2;
                padding: 90px 4vw;
            }
        }

        @media (max-width: 550px) {
            .list-view-mode .infinite-canvas {
                column-count: 1;
                padding: 80px 16px;
            }
        }

        /* Mobile specific adjustments for guidelines */
        @media (max-width: 768px) {
            .nav-back {
                top: max(16px, env(safe-area-inset-top));
                left: 16px;
                width: 44px;
                height: 44px;
                font-size: 1.25rem;
            }
            .drag-instruction {
                bottom: max(75px, env(safe-area-inset-bottom) + 55px);
                font-size: 0.52rem;
                letter-spacing: 2px;
                color: rgba(255, 255, 255, 0.45);
                white-space: nowrap;
            }
            .features-list {
                top: max(16px, env(safe-area-inset-top));
                right: 16px;
                gap: 8px;
            }
            .feature-item {
                padding: 4px 6px 4px 10px;
                border-radius: 20px;
                gap: 6px;
            }
            .feature-item > span:first-child {
                font-size: 0.62rem;
                letter-spacing: 0.8px;
            }
            .feature-key {
                padding: 3px 8px;
                font-size: 0.54rem;
                border-radius: 12px;
            }
            .desktop-text {
                display: none !important;
            }
            .mobile-text {
                display: inline !important;
            }
            .sp-wrapper {
                bottom: max(20px, env(safe-area-inset-bottom));
                left: 16px;
                transform: scale(0.88);
                transform-origin: bottom left;
            }
            .infinite-zoom-controls {
                bottom: max(20px, env(safe-area-inset-bottom));
                right: 16px;
                padding: 4px 6px;
                gap: 6px;
            }
            .zoom-btn {
                width: 40px;
                height: 40px;
                font-size: 1.2rem;
            }
        }

        @media (pointer: coarse), (hover: none) {
            .cursor {
                display: none !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
            * {
                cursor: auto !important;
            }
        }

        .mobile-text {
            display: none;
        }

        /* Specific View overlay for Double Click / 2x Tap */
        .specific-view-overlay {
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, rgba(10, 10, 10, 0.6) 0%, rgba(0, 0, 0, 0.95) 100%);
            z-index: 9000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            backdrop-filter: blur(25px);
            cursor: zoom-out;
        }

        .specific-view-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        .specific-view-content-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 90vw;
            height: 90vh;
            gap: 40px;
            max-width: 1400px;
        }

        .specific-view-img-container {
            flex: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }

        .specific-view-img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 16px;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.95), 0 0 60px rgba(235, 215, 63, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: box-shadow 0.4s ease, border-color 0.4s ease;
        }

        .specific-view-overlay:not(.active) .specific-view-img {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
        }

        .specific-view-overlay.active .specific-view-img {
            opacity: 1;
        }
        
        .specific-view-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            opacity: 0;
            transform: translateX(40px);
            transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
            max-width: 450px;
            background: linear-gradient(135deg, rgba(25, 25, 25, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%);
            backdrop-filter: blur(30px);
            border-radius: 24px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 20px rgba(255,255,255,0.02);
            position: relative;
            overflow: hidden;
            max-height: 80vh;
            margin-right: 90px;
        }

        .specific-view-scroll-area {
            height: 100%;
            width: 100%;
            padding: 45px 40px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(235, 215, 63, 0.3) rgba(255, 255, 255, 0.02);
            position: relative;
            z-index: 5;
            -webkit-mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
            mask-image: linear-gradient(to bottom, black 90%, transparent 100%);
        }

        .specific-view-scroll-area::-webkit-scrollbar {
            width: 5px;
        }
        .specific-view-scroll-area::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 10px;
            margin: 20px 0;
        }
        .specific-view-scroll-area::-webkit-scrollbar-thumb {
            background: rgba(235, 215, 63, 0.3);
            border-radius: 10px;
        }
        .specific-view-scroll-area::-webkit-scrollbar-thumb:hover {
            background: rgba(235, 215, 63, 0.6);
        }
        
        /* The dynamic interactive glowing border */
        .specific-view-info::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 24px; 
            padding: 1px; /* Border thickness */
            background: radial-gradient(
                400px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), 
                rgba(235, 215, 63, 0.6), 
                rgba(255, 255, 255, 0.05) 40%
            );
            -webkit-mask: 
                linear-gradient(#fff 0 0) content-box, 
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            z-index: 2;
            pointer-events: none;
            transition: background 0.3s ease;
        }

        /* The glowing orb behind the content */
        .specific-view-info::after {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(235, 215, 63, 0.12) 0%, rgba(212, 188, 28, 0.05) 40%, transparent 70%);
            top: -50px;
            left: -50px;
            z-index: -1;
            animation: floatOrb 8s infinite alternate ease-in-out;
            pointer-events: none;
            filter: blur(40px);
        }

        @keyframes floatOrb {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(60px, 120px) scale(1.3); }
            100% { transform: translate(-40px, 80px) scale(0.8); }
        }

        /* Spotlight that reveals the text brightness when hovered */
        .text-spotlight {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                450px circle at var(--mouse-x, -500px) var(--mouse-y, -500px), 
                rgba(235, 215, 63, 0.15), 
                transparent 50%
            );
            pointer-events: none;
            z-index: 10;
            mix-blend-mode: color-dodge;
            transition: background 0.1s ease;
        }

        /* Subtle noise texture for premium frosted glass feel */
        .text-spotlight::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.05;
            pointer-events: none;
            mix-blend-mode: overlay;
        }

        .specific-view-overlay.active .specific-view-info {
            opacity: 1;
            transform: translateX(0);
        }

        .specific-category {
            color: var(--brand-yellow);
            font-family: 'Panchang', sans-serif;
            font-size: 0.75rem;
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .specific-category::before {
            content: '';
            display: block;
            width: 30px;
            height: 1px;
            background: var(--brand-yellow);
        }
        
        .specific-title {
            color: #ffffff;
            font-family: 'Panchang', sans-serif;
            font-size: 2.2rem;
            margin: 0 0 25px 0;
            line-height: 1.1;
            text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        
        .specific-case-study {
            color: rgba(255, 255, 255, 0.55);
            font-family: 'Clash Display', sans-serif;
            font-size: 1.15rem;
            line-height: 1.8;
            font-weight: 400;
            margin-top: 15px;
            position: relative;
            z-index: 2;
        }
        
        .specific-case-study::first-line {
            color: rgba(235, 215, 63, 0.9);
            font-weight: 500;
            letter-spacing: 0.5px;
        }

        .specific-case-study-heading {
            color: #ebd73f;
            font-family: 'Clash Display', sans-serif;
            font-size: 0.9rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 30px 0 10px 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .specific-case-study-heading::before {
            content: '';
            display: inline-block;
            width: 30px;
            height: 1px;
            background: #ebd73f;
        }
        
        @media (max-width: 900px) {
            .specific-view-overlay {
                padding: max(16px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom)) 16px;
                cursor: default;
            }
            .specific-view-content-wrapper {
                flex-direction: column;
                width: 100%;
                height: 100%;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: 55px 0 30px 0;
                gap: 20px;
            }
            .close-specific-view {
                top: max(16px, env(safe-area-inset-top));
                right: 16px;
                width: 42px;
                height: 42px;
            }
            .specific-view-img-container {
                height: auto;
                max-height: 48vh;
                width: 100%;
                flex: none;
            }
            .specific-view-info {
                max-width: 100%;
                max-height: none;
                height: auto;
                flex: none;
                overflow: visible;
                margin-right: 0;
                border-radius: 20px;
            }
            .specific-view-scroll-area {
                padding: 26px 20px;
                height: auto;
                overflow: visible;
                -webkit-mask-image: none;
                mask-image: none;
            }
            .specific-title {
                font-size: 1.5rem;
                margin-bottom: 15px;
            }
            .specific-case-study {
                font-size: 0.95rem;
                line-height: 1.65;
            }
        }
        
        .infinite-cat-label {
            position: absolute;
            bottom: 25px;
            left: 25px;
            background: linear-gradient(135deg, rgba(20, 20, 20, 0.85) 0%, rgba(5, 5, 5, 0.95) 100%);
            backdrop-filter: blur(15px);
            color: #fff;
            padding: 10px 20px;
            border-radius: 40px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.7rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            opacity: 0;
            transform: translateY(15px) scale(0.95);
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 15px rgba(235, 215, 63, 0.05);
        }
        
        .canvas-item:hover .infinite-cat-label {
            opacity: 1;
            transform: translateY(0) scale(1);
        }

        .infinite-zoom-controls {
            position: fixed;
            bottom: 50px;
            right: 50px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 100;
            transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            background: rgba(15, 15, 18, 0.75);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            padding: 6px 10px;
            border-radius: 40px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 50px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .zoom-btn {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #ffffff;
            font-size: 1.4rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            font-family: 'Panchang', sans-serif;
            outline: none;
            user-select: none;
        }

        .zoom-btn:hover {
            background: rgba(235, 215, 63, 0.2);
            color: var(--brand-yellow);
            border-color: rgba(235, 215, 63, 0.5);
            transform: scale(1.08);
            box-shadow: 0 0 20px rgba(235, 215, 63, 0.3);
        }

        .zoom-btn:active {
            transform: scale(0.92);
            background: var(--brand-yellow);
            color: #000;
        }

        .close-specific-view {
            position: absolute;
            top: 40px;
            right: 50px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--pure-white);
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            background: rgba(20, 20, 20, 0.4);
            border-radius: 50%;
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .close-specific-view:hover {
            color: var(--brand-yellow);
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(235, 215, 63, 0.4);
            transform: scale(1.08) rotate(90deg);
            box-shadow: 0 4px 25px rgba(235, 215, 63, 0.15);
        }

        .specific-nav-btn {
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: rgba(18, 18, 22, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.12);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 9200;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            outline: none;
            user-select: none;
        }

        .specific-nav-btn:hover {
            background: rgba(235, 215, 63, 0.2);
            color: var(--brand-yellow);
            border-color: rgba(235, 215, 63, 0.6);
            transform: translateY(-50%) scale(1.12);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(235, 215, 63, 0.3);
        }

        .specific-nav-btn:active {
            transform: translateY(-50%) scale(0.92);
            background: var(--brand-yellow);
            color: #000;
        }

        .specific-nav-prev {
            left: 35px;
        }

        .specific-nav-next {
            right: 35px;
        }

        @media (max-width: 900px) {
            .specific-nav-btn {
                width: 42px;
                height: 42px;
                background: rgba(14, 14, 18, 0.85);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.8);
            }
            .specific-nav-prev {
                left: 10px;
            }
            .specific-nav-next {
                right: 10px;
            }
        }

        /* Space Background Canvas */
        #space-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
            pointer-events: none;
            opacity: 0;
            transition: opacity 1s ease;
        }

        /* Space Mode active state */
        .space-mode-active #space-canvas {
            opacity: 1;
        }

        .space-mode-active #portfolio-showcase {
            background-color: transparent;
            /* Show space behind */
        }

        .space-mode-active .canvas-item {
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(235, 215, 63, 0.14);
            border: 1px solid rgba(235, 215, 63, 0.2);
            background-color: rgba(18, 18, 22, 0.9);
            /* Ethereal glow in space */
        }

        @keyframes ambientFloat1 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(80px, 60px) scale(1.2); }
            100% { transform: translate(-40px, 100px) scale(0.9); }
        }

        @keyframes ambientFloat2 {
            0% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-100px, -80px) scale(1.3); }
            100% { transform: translate(50px, -40px) scale(0.85); }
        }

        .react-list-view-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow-y: auto;
            padding: 30px 5vw 60px 5vw;
            z-index: 10;
            background: #070708;
            touch-action: pan-y;
        }

        .list-view-inner-content {
            position: relative;
            z-index: 1;
            padding-left: 60px;
        }

        .collections-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 35px;
        }

        .archive-masonry-grid {
            column-count: 3;
            column-gap: 20px;
        }

        .magnify-slider-container {
            position: absolute;
            bottom: 0px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 15px;
            background: rgba(15,15,15,0.85);
            padding: 10px 25px;
            border-radius: 40px;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(235, 215, 63, 0.2);
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            z-index: 10;
        }

        @media (max-width: 900px) {
            .list-view-inner-content {
                padding-left: 0px !important;
            }
            .react-list-view-container {
                padding: max(75px, env(safe-area-inset-top) + 60px) 16px 80px 16px !important;
            }
            .collections-grid {
                grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)) !important;
                gap: 20px !important;
            }
            .archive-masonry-grid {
                column-count: 2 !important;
                column-gap: 16px !important;
            }
            .magnify-slider-container {
                position: relative;
                bottom: auto;
                left: auto;
                transform: none;
                margin: 12px auto 0 auto;
                padding: 6px 16px;
                gap: 10px;
            }
        }

        @media (max-width: 550px) {
            .archive-masonry-grid {
                column-count: 1 !important;
            }
        }
    ` }} />

      <div>
  {/* 3D Space Background */}
  <canvas id="space-canvas" />
    <button 
      onClick={() => {
        if (activeCategory) {
            setActiveCategory(null);
        } else if (isListViewActive) {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
        } else {
            window.location.href = '/';
        }
      }} 
      className="nav-back" 
      style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <i className="uil uil-arrow-left" />
    </button>
  <div className="sp-wrapper">
    <button className="sparkle-button" id="tripp-toggle-btn">
      <span className="spark" />
      <span className="backdrop" />
      <span className="text" id="tripp-btn-text">TRIPP</span>
    </button>
    <div className="particle-pen">
      <svg className="particle" style={{'--': 20, '--': 30, '--': '1.5', '--': '0.2', '--': '0.8', '--': '0.4'}}>
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
      <svg className="particle" style={{'--': 80, '--': 20, '--': 2, '--': '0.5', '--': '0.5', '--': '0.3'}}>
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
      <svg className="particle" style={{'--': 50, '--': 80, '--': '1.2', '--': '0.8', '--': '0.9', '--': '0.5'}}>
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
      <svg className="particle" style={{'--': 10, '--': 90, '--': '1.8', '--': '1.2', '--': '0.6', '--': '0.2'}}>
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
      <svg className="particle" style={{'--': 90, '--': 70, '--': '1.4', '--': '0.4', '--': '0.7', '--': '0.35'}}>
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
      </svg>
    </div>
  </div>
  <div className={`features-list ${isListViewActive ? 'hidden' : ''}`}>
    <div 
      className="feature-item" 
      id="list-view-helper"
      role="button"
      tabIndex={0}
      title="Switch to Feed/List View (Enter / Tap)"
    >
      <span>{isGenz ? 'feed view' : 'List View'}</span>
      <span className="feature-key">
        <span className="desktop-text">Enter</span>
        <span className="mobile-text">Tap</span>
      </span>
    </div>
    <div 
      className="feature-item" 
      id="specific-view-helper"
      role="button"
      tabIndex={0}
      title="Inspect Center Project Case Study (Double Click / 2x Tap)"
    >
      <span>{isGenz ? 'enhance' : 'Specific View'}</span>
      <span className="feature-key">
        <span className="desktop-text">{isGenz ? '2x click' : 'Double Click'}</span>
        <span className="mobile-text">{isGenz ? '2x tap' : 'Double Tap'}</span>
      </span>
    </div>
  </div>
  <div className="cursor" id="cursor" />
  <div className="drag-instruction" id="drag-msg">{isGenz ? 'swipe / scroll to explore' : 'Drag / Scroll to Explore'}</div>

  <div className="infinite-zoom-controls" id="infinite-zoom-controls" style={{ opacity: isListViewActive ? 0 : 1, pointerEvents: isListViewActive ? 'none' : 'auto' }}>
      <button className="zoom-btn" id="zoom-out-btn" title="Zoom Out">−</button>
      <button className="zoom-btn" id="zoom-in-btn" title="Zoom In">+</button>
  </div>

  <div className="specific-view-overlay" id="specific-view">
    <div className="close-specific-view" id="close-specific" title="Close (Esc)">
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>

    {/* Previous Arrow Button */}
    <button 
      className="specific-nav-btn specific-nav-prev" 
      id="specific-prev-btn" 
      title="Previous Image (← Left Arrow / Swipe Right)" 
      aria-label="Previous Graphic"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    {/* Next Arrow Button */}
    <button 
      className="specific-nav-btn specific-nav-next" 
      id="specific-next-btn" 
      title="Next Image (Right Arrow → / Swipe Left)" 
      aria-label="Next Graphic"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>

    <div className="specific-view-content-wrapper">
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
          <div 
            className="specific-view-img-container"
            style={{ 
              flex: 'none',
              position: 'relative',
              overflow: 'hidden', 
              cursor: 'zoom-in', 
              borderRadius: '16px', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
              display: 'inline-flex',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            onMouseMove={(e) => {
                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - left) / width;
                const y = (e.clientY - top) / height;
                const img = e.currentTarget.querySelector('img');
                const slider = document.getElementById('magnify-slider');
                const zoomLevel = slider ? slider.value : 1.5;
                if(img) {
                    img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
                    img.style.transform = `scale(${zoomLevel})`;
                }
            }}
            onMouseLeave={(e) => {
                const img = e.currentTarget.querySelector('img');
                if(img) {
                    img.style.transform = 'scale(1)';
                    setTimeout(() => {
                        if (img.style.transform === 'scale(1)') {
                            img.style.transformOrigin = 'center center';
                        }
                    }, 400);
                }
            }}
          >
            <img 
              src="" 
              className="specific-view-img" 
              id="specific-img" 
              alt="Specific View" 
              style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '100%', maxHeight: '100%', display: 'block' }}
              onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Crect width='800' height='800' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Clash Display' font-size='40' fill='%23ebd73f'%3EImage Not Found%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>
          
          <div className="magnify-slider-container">
            <span style={{ color: '#ebd73f', fontSize: '0.75rem', fontFamily: 'Panchang, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>Zoom Power</span>
            <input 
              type="range" 
              id="magnify-slider"
              min="1.2" 
              max="4.0" 
              step="0.1" 
              defaultValue="1.5"
              style={{ width: '120px', cursor: 'pointer', accentColor: '#ebd73f' }}
            />
          </div>
        </div>
        <div className="specific-view-info"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
            e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.setProperty('--mouse-x', `-500px`);
            e.currentTarget.style.setProperty('--mouse-y', `-500px`);
          }}
        >
          {/* Spotlight text glow effect */}
          <div className="text-spotlight"></div>
          <div className="specific-view-scroll-area">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="specific-category" id="specific-category">Category</div>
              <div id="specific-counter" style={{
                fontFamily: 'Panchang, sans-serif',
                fontSize: '0.75rem',
                color: '#ebd73f',
                letterSpacing: '2px',
                fontWeight: 700,
                background: 'rgba(235, 215, 63, 0.1)',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(235, 215, 63, 0.25)',
                whiteSpace: 'nowrap'
              }}>01 / 01</div>
            </div>
            <h2 className="specific-title" id="specific-title">Project Title</h2>
            <h3 className="specific-case-study-heading">THE VISION</h3>
            <div className="specific-case-study" id="specific-case-study">Case study details...</div>
          </div>
        </div>
    </div>
  </div>
  {/* Drop-in wrapper mimicking user's React implementation */}
  <div id="portfolio-showcase">
    <div className="infinite-canvas" id="canvas-container" style={{ display: isListViewActive ? 'none' : 'block' }}>
      {/* Items injected by JS */}
    </div>
    
    {isListViewActive && (
      <div className="react-list-view-container"
      onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--list-mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--list-mouse-y', `${y}px`);
      }}
      >
          {/* Architectural Subtle Grid Pattern */}
          <div style={{
              position: 'fixed',
              inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
              `,
              backgroundSize: '65px 65px',
              pointerEvents: 'none',
              zIndex: 0
          }}></div>

          {/* Dynamic Interactive Mouse Light Glow */}
          <div style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(650px circle at var(--list-mouse-x, 50%) var(--list-mouse-y, 30%), rgba(235, 215, 63, 0.07), transparent 75%)',
              pointerEvents: 'none',
              zIndex: 0,
              transition: 'background 0.15s ease-out'
          }}></div>

          {/* Floating Ambient Glowing Light Orbs */}
          <div style={{
              position: 'fixed',
              top: '5%',
              left: '10%',
              width: '550px',
              height: '550px',
              background: 'radial-gradient(circle, rgba(235, 215, 63, 0.09) 0%, rgba(212, 188, 28, 0.02) 50%, transparent 70%)',
              filter: 'blur(110px)',
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'ambientFloat1 16s ease-in-out infinite alternate'
          }}></div>

          <div style={{
              position: 'fixed',
              bottom: '5%',
              right: '8%',
              width: '650px',
              height: '650px',
              background: 'radial-gradient(circle, rgba(255, 200, 50, 0.06) 0%, rgba(80, 60, 10, 0.02) 50%, transparent 70%)',
              filter: 'blur(130px)',
              pointerEvents: 'none',
              zIndex: 0,
              animation: 'ambientFloat2 20s ease-in-out infinite alternate'
          }}></div>

          {activeCategory === null ? (
              <div className="list-view-inner-content">
                  {/* Category Section Header */}
                  <div style={{ marginBottom: '30px' }}>
                      <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          color: '#ebd73f', 
                          fontFamily: 'Clash Display, sans-serif', 
                          fontSize: '0.8rem', 
                          letterSpacing: '3px', 
                          textTransform: 'uppercase',
                          marginBottom: '12px',
                          fontWeight: 500
                      }}>
                          <span style={{ width: '24px', height: '1px', background: '#ebd73f' }}></span>
                          01 / ARCHIVES & CATEGORIES
                      </div>
                      <h1 style={{ 
                          fontFamily: 'Panchang, sans-serif', 
                          fontSize: '2.4rem', 
                          color: '#ffffff', 
                          margin: 0, 
                          letterSpacing: '2px', 
                          textTransform: 'uppercase',
                          lineHeight: '1.2' 
                      }}>
                          EXPLORE COLLECTIONS
                      </h1>
                  </div>

                  <div className="collections-grid">
                  {Array.from(new Set(graphics.flatMap(g => (g.category || 'Uncategorized').split(',').map(c => c.trim()).filter(Boolean)))).map((cat, idx) => {
                      const count = graphics.filter(g => (g.category || 'Uncategorized').split(',').map(c => c.trim()).filter(Boolean).includes(cat)).length;
                      return (
                      <div key={cat} onClick={() => setActiveCategory(cat)} className="category-folder group" style={{
                          position: 'relative',
                          overflow: 'hidden',
                          background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.95) 100%)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '24px',
                          padding: '35px',
                          cursor: 'pointer',
                          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '380px',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 10px rgba(255,255,255,0.03)',
                      }}
                      onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-10px)';
                          e.currentTarget.style.borderColor = 'rgba(235, 215, 63, 0.3)';
                          e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.8), 0 0 30px rgba(235, 215, 63, 0.1), inset 0 1px 10px rgba(255,255,255,0.08)';
                          const bgText = e.currentTarget.querySelector('.bg-text');
                          if(bgText) {
                              bgText.style.transform = 'scale(1.05) rotate(-2deg)';
                              bgText.style.color = 'rgba(235, 215, 63, 0.05)';
                          }
                          const arrow = e.currentTarget.querySelector('.hover-arrow');
                          if(arrow) {
                              arrow.style.transform = 'translateX(0)';
                              arrow.style.opacity = '1';
                              arrow.style.color = '#ebd73f';
                          }
                      }}
                      onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                          e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 10px rgba(255,255,255,0.03)';
                          const bgText = e.currentTarget.querySelector('.bg-text');
                          if(bgText) {
                              bgText.style.transform = 'scale(1) rotate(0deg)';
                              bgText.style.color = 'rgba(255,255,255,0.02)';
                          }
                          const arrow = e.currentTarget.querySelector('.hover-arrow');
                          if(arrow) {
                              arrow.style.transform = 'translateX(-15px)';
                              arrow.style.opacity = '0';
                              arrow.style.color = '#fff';
                          }
                      }}
                      >
                          {/* Giant Background Text / Watermark */}
                          <div className="bg-text" style={{
                              position: 'absolute',
                              top: '20px',
                              right: '-20px',
                              fontSize: '110px',
                              fontFamily: 'Panchang, sans-serif',
                              fontWeight: 800,
                              color: 'rgba(255,255,255,0.02)',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                              pointerEvents: 'none',
                              zIndex: 0,
                              lineHeight: 0.8,
                              transformOrigin: 'top right'
                          }}>
                              {cat.split(' ')[0]}
                          </div>
                          
                          {/* Top Row: Minimal Icon + Folder Sequential Index */}
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                              <div style={{ color: 'rgba(255,255,255,0.3)', width: '32px', height: '32px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                              </div>
                              <div style={{ 
                                  fontSize: '0.85rem', 
                                  fontFamily: 'Panchang, sans-serif', 
                                  color: '#ebd73f', 
                                  letterSpacing: '2px', 
                                  border: '1px solid rgba(235, 215, 63, 0.3)',
                                  padding: '6px 14px',
                                  borderRadius: '40px',
                                  background: 'rgba(235, 215, 63, 0.08)',
                                  fontWeight: 700
                              }}>
                                  {(idx + 1).toString().padStart(2, '0')}
                              </div>
                          </div>

                          {/* Bottom Row: Title + Project Count + Arrow */}
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div>
                                  <div style={{ fontSize: '0.7rem', color: '#ebd73f', letterSpacing: '2px', fontFamily: 'Clash Display, sans-serif', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 600 }}>
                                      {count} {count === 1 ? 'PROJECT' : 'PROJECTS'}
                                  </div>
                                  <h3 style={{ 
                                      fontSize: '2rem', 
                                      margin: 0, 
                                      color: '#ffffff', 
                                      letterSpacing: '1.5px', 
                                      textTransform: 'uppercase', 
                                      fontFamily: 'Panchang, sans-serif',
                                      lineHeight: '1.15',
                                      textShadow: '0 4px 20px rgba(0,0,0,0.8)'
                                  }}>
                                      {cat}
                                  </h3>
                              </div>
                              
                              {/* Sleek Arrow */}
                              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                  <div className="hover-arrow" style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '12px',
                                      color: '#fff',
                                      fontFamily: 'Clash Display, sans-serif',
                                      fontSize: '0.85rem',
                                      letterSpacing: '4px',
                                      textTransform: 'uppercase',
                                      transform: 'translateX(-15px)',
                                      opacity: 0,
                                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                      fontWeight: 600
                                  }}>
                                      <span>Explore</span>
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                  </div>
                              </div>
                          </div>
                      </div>
                      );
                  })}
              </div>
          </div>
      ) : (
              <div className="list-view-inner-content">
                  <div style={{ marginBottom: '20px' }}>
                      <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '12px', 
                          color: '#ebd73f', 
                          fontFamily: 'Clash Display, sans-serif', 
                          fontSize: '0.8rem', 
                          letterSpacing: '3px', 
                          textTransform: 'uppercase',
                          marginBottom: '8px',
                          fontWeight: 500
                      }}>
                          <span style={{ width: '24px', height: '1px', background: '#ebd73f' }}></span>
                          CATEGORY ARCHIVE
                      </div>
                      <h2 style={{ margin: 0, fontSize: '2.2rem', color: '#ffffff', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'Panchang, sans-serif' }}>{activeCategory}</h2>
                  </div>  
                  <div className="archive-masonry-grid">
                      {graphics.filter(g => (g.category || 'Uncategorized').split(',').map(c => c.trim()).filter(Boolean).includes(activeCategory)).map((item, idx) => (
                          <div key={idx} style={{ marginBottom: '20px', breakInside: 'avoid', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: '#111', cursor: 'zoom-in', transition: 'transform 0.3s ease' }}
                          onClick={() => {
                              const activeList = graphics.filter(g => (g.category || 'Uncategorized').split(',').map(c => c.trim()).filter(Boolean).includes(activeCategory));
                              if (typeof window !== 'undefined' && typeof window.openSpecificModal === 'function') {
                                  window.openSpecificModal(idx, activeList);
                              }
                          }}
                          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                              <img 
                                src={item.image_url} 
                                alt="graphic" 
                                style={{ width: '100%', display: 'block', objectFit: 'contain' }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Crect width='800' height='800' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Clash Display' font-size='40' fill='%23ebd73f'%3EImage Not Found%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    )}
  </div>
</div>


    </>
  );
}
