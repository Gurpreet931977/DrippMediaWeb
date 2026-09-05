'use client';
import { customAlert } from './utils/customAlert';
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Link from "next/link";
import Preloader from "./components/Preloader";
import DailyLearningSection from "./components/DailyLearningSection";
import { DEFAULT_SERVICES_CATEGORIES } from './lib/servicesData';
import { validateCustomService } from './utils/serviceValidator';

export default function Page() {
  const [servicesCategories, setServicesCategories] = useState(DEFAULT_SERVICES_CATEGORIES);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          const list = data?.data || data?.categories || (Array.isArray(data) ? data : null);
          if (list && Array.isArray(list) && list.length > 0) {
            setServicesCategories(list);
          }
        }
      } catch (err) {
        console.error('Error loading services:', err);
      }
    };

    fetchServices();

    let bc;
    try {
      bc = new BroadcastChannel('dripp_services_channel');
      bc.onmessage = (e) => {
        if (e.data?.type === 'SERVICES_UPDATED') {
          fetchServices();
        }
      };
    } catch (err) {}

    const handleStorage = (e) => {
      if (e.key === 'dripp_services_updated') {
        fetchServices();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window.__initCloudPhysics === 'function') {
        window.__initCloudPhysics();
      }
      const activeTab = document.querySelector('.builder-tab.active') || document.querySelector('.builder-tab');
      if (activeTab && typeof window.__updateGlider === 'function') {
        window.__updateGlider(activeTab);
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [servicesCategories]);
  useEffect(() => {
    // Register GSAP

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

    // --- LENIS SMOOTH SCROLL OPTIMIZATION ---
    const lenis = new Lenis({
        autoRaf: false, // We will use GSAP's ticker
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // --- INIT ---
        document.fonts.ready.then(function () {
            document.body.classList.add('loaded');
            
            // Reset and fade in body to handle page transitions properly (bfcache/SPA)
            gsap.fromTo('body', 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.8, ease: 'power2.out', clearProps: 'opacity,transform' }
            );

            // --- PORTFOLIO PAGE TRANSITION LOGIC ---
            const portfolioLinks = document.querySelectorAll('.card-wrapper .btn-primary');
            portfolioLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    const href = link.getAttribute('href');
                    if (href && href !== '#') {
                        e.preventDefault();

                        // Exit Animation
                        gsap.to('body', {
                            opacity: 0,
                            duration: 0.6,
                            ease: 'power2.inOut',
                            onComplete: () => {
                                window.location.href = href;
                            }
                        });
                    }
                });
            });

            // --- ATTRACT BUTTON & COMMUNITY PARTICLES (ORIGINAL STYLE, ZERO-LAG) ---
            const attractBtns = document.querySelectorAll('.attract-btn');
            attractBtns.forEach(btn => {
                // --- MORPH WIDTH INIT ---
                const morphWord = btn.querySelector('.morph-word');
                const morphFront = btn.querySelector('.morph-front');
                const morphBack = btn.querySelector('.morph-back');

                if (morphWord && morphFront) {
                    morphWord.style.width = morphFront.offsetWidth + 'px';
                }

                const isMobileDevice = window.innerWidth < 900;
                // Original dot count: crisp, elegant distribution around the card
                const particleCount = isMobileDevice ? 35 : 75;
                const existingContainer = btn.querySelector('.attract-particles-container');
                if (existingContainer) existingContainer.remove();
                if (btn._particleTick) {
                    gsap.ticker.remove(btn._particleTick);
                    btn._particleTick = null;
                }
                const container = document.createElement('div');
                container.className = 'attract-particles-container';
                btn.appendChild(container);

                const particles = [];
                let isAttracting = false;

                for (let i = 0; i < particleCount; i++) {
                    const p = document.createElement('div');
                    p.className = 'attract-particle';

                    // Spread randomly across the section around the card, but not directly covering the button
                    let startX, startY;
                    do {
                        startX = (Math.random() - 0.5) * Math.min(window.innerWidth * 0.9, 1100);
                        startY = (Math.random() - 0.5) * 600;
                    } while (Math.abs(startX) < 160 && Math.abs(startY) < 65);

                    const scaleStart = Math.random() * 0.8 + 0.6; // Crisp 0.6 to 1.4 scale
                    const opacityStart = Math.random() * 0.5 + 0.45; // 0.45 to 0.95 opacity
                    const attractAngle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                    const attractDistX = 145 + Math.random() * 85;
                    const attractDistY = 44 + Math.random() * 55;
                    const attractSpeed = (Math.random() * 0.01 + 0.005) * (i % 2 === 0 ? 1 : -1);

                    gsap.set(p, { x: startX, y: startY, opacity: opacityStart, scale: scaleStart, force3D: true });

                    container.appendChild(p);

                    particles.push({
                        element: p,
                        startX: startX,
                        startY: startY,
                        currentX: startX,
                        currentY: startY,
                        targetX: startX,
                        targetY: startY,
                        repelX: 0,
                        repelY: 0,
                        wanderAngle: Math.random() * Math.PI * 2,
                        wanderSpeed: (Math.random() - 0.5) * 0.012,
                        wanderRadius: Math.random() * 35 + 15,
                        scaleStart: scaleStart,
                        opacityStart: opacityStart,
                        attractAngle: attractAngle,
                        attractDistX: attractDistX,
                        attractDistY: attractDistY,
                        attractSpeed: attractSpeed,
                        attractScale: Math.min(1.8, scaleStart * 1.15),
                        attractOpacity: Math.min(1, opacityStart + 0.25),
                        setX: gsap.quickSetter(p, "x", "px"),
                        setY: gsap.quickSetter(p, "y", "px"),
                        setScale: gsap.quickSetter(p, "scale"),
                        setOpacity: gsap.quickSetter(p, "opacity")
                    });
                }

                // Zero-lag mouse tracking: cache button position and only record coordinates on mousemove
                const section = btn.closest('.join-community-section');
                let mouseX = -9999;
                let mouseY = -9999;
                let isMouseOver = false;
                let cachedBtnRect = null;

                const updateBtnRect = () => {
                    cachedBtnRect = btn.getBoundingClientRect();
                };

                if (section) {
                    section.addEventListener('mouseenter', updateBtnRect, { passive: true });
                    window.addEventListener('resize', updateBtnRect, { passive: true });
                    window.addEventListener('scroll', updateBtnRect, { passive: true });

                    section.addEventListener('mousemove', (e) => {
                        if (!cachedBtnRect) updateBtnRect();
                        mouseX = e.clientX - (cachedBtnRect.left + cachedBtnRect.width / 2);
                        mouseY = e.clientY - (cachedBtnRect.top + cachedBtnRect.height / 2);
                        isMouseOver = true;
                    }, { passive: true });

                    section.addEventListener('mouseleave', () => {
                        isMouseOver = false;
                        mouseX = -9999;
                        mouseY = -9999;
                    }, { passive: true });

                    section.addEventListener('touchmove', (e) => {
                        if (e.touches.length > 0) {
                            if (!cachedBtnRect) updateBtnRect();
                            mouseX = e.touches[0].clientX - (cachedBtnRect.left + cachedBtnRect.width / 2);
                            mouseY = e.touches[0].clientY - (cachedBtnRect.top + cachedBtnRect.height / 2);
                            isMouseOver = true;
                        }
                    }, { passive: true });

                    section.addEventListener('touchend', () => {
                        isMouseOver = false;
                        mouseX = -9999;
                        mouseY = -9999;
                    }, { passive: true });
                }

                // High-performance RAF animation ticker (zero allocations, 60fps/120fps smooth)
                const repelRadius = 140;
                const repelRadiusSq = repelRadius * repelRadius;
                let isSectionInView = true;

                if (typeof IntersectionObserver !== 'undefined' && section) {
                    const secObs = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            isSectionInView = entry.isIntersecting;
                        });
                    }, { threshold: 0.05 });
                    secObs.observe(section);
                }

                const tick = () => {
                    if (!isSectionInView) return;

                    const numP = particles.length;
                    for (let i = 0; i < numP; i++) {
                        const p = particles[i];

                        if (isAttracting) {
                            // Orbit / gather smoothly around the glowing button capsule - never disappear!
                            p.attractAngle += p.attractSpeed;
                            const targetX = Math.cos(p.attractAngle) * p.attractDistX;
                            const targetY = Math.sin(p.attractAngle) * p.attractDistY;

                            p.currentX += (targetX - p.currentX) * 0.12;
                            p.currentY += (targetY - p.currentY) * 0.12;
                            p.setX(p.currentX.toFixed(1));
                            p.setY(p.currentY.toFixed(1));
                            p.setScale(p.attractScale);
                            p.setOpacity(p.attractOpacity);
                        } else {
                            // Gentle organic wander
                            p.wanderAngle += p.wanderSpeed;
                            const idleX = p.startX + Math.cos(p.wanderAngle) * p.wanderRadius;
                            const idleY = p.startY + Math.sin(p.wanderAngle) * p.wanderRadius;

                            // Smooth damping back of release or repel impulse
                            p.repelX *= 0.90;
                            p.repelY *= 0.90;

                            // Gentle cursor repulsion without tween thrashing
                            if (isMouseOver) {
                                const dx = p.currentX - mouseX;
                                const dy = p.currentY - mouseY;
                                const distSq = dx * dx + dy * dy;

                                if (distSq < repelRadiusSq && distSq > 0.01) {
                                    const dist = Math.sqrt(distSq);
                                    const force = (repelRadius - dist) / repelRadius;
                                    p.repelX += (dx / dist) * force * 3.8;
                                    p.repelY += (dy / dist) * force * 3.8;
                                }
                            }

                            p.targetX = idleX + p.repelX;
                            p.targetY = idleY + p.repelY;

                            p.currentX += (p.targetX - p.currentX) * 0.08;
                            p.currentY += (p.targetY - p.currentY) * 0.08;

                            p.setX(p.currentX.toFixed(1));
                            p.setY(p.currentY.toFixed(1));
                            p.setScale(p.scaleStart);
                            p.setOpacity(p.opacityStart);
                        }
                    }
                };

                btn._particleTick = tick;
                gsap.ticker.add(tick);

                const attractIn = () => {
                    isAttracting = true;
                    const curBack = btn.querySelector('.morph-back');
                    if (morphWord && curBack) {
                        morphWord.style.width = curBack.offsetWidth + 'px';
                    }
                    btn.classList.add('is-powered');
                    gsap.to(btn, { scale: 1.04, duration: 0.25, ease: "power2.out" });
                };

                const attractOut = () => {
                    const curFront = btn.querySelector('.morph-front');
                    if (morphWord && curFront) {
                        morphWord.style.width = curFront.offsetWidth + 'px';
                    }
                    btn.classList.remove('is-powered');
                    gsap.to(btn, { scale: 1, duration: 0.35, ease: "power2.out" });

                    if (isAttracting) {
                        isAttracting = false;
                        // Smooth radial outward release burst back into the community
                        particles.forEach(p => {
                            const dist = Math.hypot(p.currentX, p.currentY) || 1;
                            p.repelX = (p.currentX / dist) * 28;
                            p.repelY = (p.currentY / dist) * 28;
                        });
                    }
                };

                btn.addEventListener('mouseenter', attractIn);
                btn.addEventListener('mouseleave', attractOut);
                btn.addEventListener('touchstart', attractIn, { passive: true });
                btn.addEventListener('touchend', attractOut, { passive: true });
            });

            // --- PRELOADER ANIMATION ---
            const tlPreloader = gsap.timeline();

            // 1. Text entrance (snappier)
            tlPreloader.to('.pl-word', {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.05,
                ease: "power4.out"
            })
                // 2. Fake loading progress (smoother scaleX)
                .to('.pl-progress', {
                    scaleX: 1,
                    duration: 0.7,
                    ease: "power3.inOut"
                }, "-=0.3")
                // 3. Text exit (modern blur dissolve)
                .to('.preloader-title', {
                    scale: 1.05,
                    filter: "blur(8px)",
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.inOut"
                }, "+=0.1")
                .to('.pl-progress-bar', {
                    opacity: 0,
                    duration: 0.3
                }, "-=0.6")
                // 4. Lift the preloader lid (faster expo)
                .to('.preloader', {
                    yPercent: -100,
                    duration: 1.0,
                    ease: "expo.inOut",
                    onComplete: () => {
                        document.querySelector('.preloader').style.display = 'none';
                    }
                }, "-=0.2")
                // 5. Fire Hero Animation Right After
                .fromTo('.brand-name .word',
                    { y: 60, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1.6, stagger: 0.1, ease: "power3.out" },
                    "-=0.8"
                )
                .fromTo(".hero-sub",
                    { opacity: 0, y: 15, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power3.out" },
                    "<0.6"
                )
                .fromTo(".hero-cta-group, .hero-trust-bar",
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out" },
                    "<0.2"
                )
                // 6. Smooth Navbar Entrance
                .fromTo('.nav-logo',
                    { opacity: 0, x: -20 },
                    { opacity: 1, x: 0, duration: 1, ease: "power3.out" },
                    "<0.2"
                )
                .fromTo('.nav-links li',
                    { opacity: 0, y: -10 },
                    {
                        opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
                    },
                    "<0.2"
                )
                .add(() => {
                    initHeroScroll();
                    ScrollTrigger.refresh();
                }, "+=0.2");
        });

        const cursor = document.querySelector('.cursor');
        const velocityFill = document.querySelector('.velocity-fill');

        gsap.set(cursor, { xPercent: -50, yPercent: -50 });

        const xTo = gsap.quickTo(cursor, "x", { duration: 0.1, ease: "power3" });
        const yTo = gsap.quickTo(cursor, "y", { duration: 0.1, ease: "power3" });

        // --- GLOBAL MOUSE TRACKING (WITH SCROLL OFFSET) ---
        let globalMouseX = window.innerWidth / 2;
        let globalMouseY = window.innerHeight / 2;

        window.addEventListener('mousemove', (e) => {
            // clientX/Y tracks relative to screen. xTo/yTo on position:fixed cursor need this.
            xTo(e.clientX);
            yTo(e.clientY);

            // pageX/Y tracks absolute position on doc. Useful if cursor was absolute.
            globalMouseX = e.clientX;
            globalMouseY = e.clientY;
        });

        // Global delegation for interactive hover states
        window.addEventListener('mouseover', (e) => {
            if (e.target && e.target.closest && e.target.closest('button, a, .btn, .modal-close, .modal-submit, .service-card, .selected-svc-badge, .social-link, .nav-link, [role="button"], input[type="submit"]')) {
                cursor?.classList.add('active');
            }
        });
        window.addEventListener('mouseout', (e) => {
            if (e.target && e.target.closest && e.target.closest('button, a, .btn, .modal-close, .modal-submit, .service-card, .selected-svc-badge, .social-link, .nav-link, [role="button"], input[type="submit"]')) {
                cursor?.classList.remove('active');
            }
        });

        // --- SMOOTH CURSOR TRAIL ---
        class SmoothTrail {
            constructor() {
                this.canvas = document.getElementById('trail-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.points = [];
                this.mouseX = window.innerWidth / 2;
                this.mouseY = window.innerHeight / 2;
                this.currentX = this.mouseX;
                this.currentY = this.mouseY;

                this.resize();
                window.addEventListener('resize', () => this.resize());
                window.addEventListener('mousemove', e => {
                    this.mouseX = e.clientX;
                    this.mouseY = e.clientY;
                });
                // Ensure trail continues drawing smoothly during scroll
                window.addEventListener('scroll', () => {
                    this.mouseY = globalMouseY;
                }, { passive: true });
                this.render();
            }
            resize() {
                const dpr = window.devicePixelRatio || 1;
                this.canvas.width = window.innerWidth * dpr;
                this.canvas.height = window.innerHeight * dpr;
                this.ctx.scale(dpr, dpr);
            }
            lerp(start, end, factor) { return start + (end - start) * factor; }
            render() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.currentX = this.lerp(this.currentX, this.mouseX, 0.25);
                this.currentY = this.lerp(this.currentY, this.mouseY, 0.25);
                this.points.push({ x: this.currentX, y: this.currentY });
                if (this.points.length > 35) this.points.shift();

                if (this.points.length > 1) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.points[0].x, this.points[0].y);
                    for (let i = 1; i < this.points.length - 1; i++) {
                        const xc = (this.points[i].x + this.points[i + 1].x) / 2;
                        const yc = (this.points[i].y + this.points[i + 1].y) / 2;
                        this.ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
                    }
                    this.ctx.lineTo(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y);
                    this.ctx.lineCap = 'round';
                    this.ctx.lineWidth = 1.5;

                    if (document.body.classList.contains('light-theme')) {
                        // Darker amber for contrast against white background
                        this.ctx.strokeStyle = '#d4ac0d';
                        this.ctx.shadowBlur = 8; // Less blurry shadow
                        this.ctx.shadowColor = 'rgba(212, 172, 13, 0.5)';
                    } else {
                        // Original bright yellow for dark theme
                        this.ctx.strokeStyle = '#ebd73f';
                        this.ctx.shadowBlur = 15;
                        this.ctx.shadowColor = '#ebd73f';
                    }

                    this.ctx.stroke();
                }
                requestAnimationFrame(() => this.render());
            }
        }
        // Only create cursor trail on desktop (no cursor on mobile)
        if (window.innerWidth > 900) {
            new SmoothTrail();
        }

        // --- MAZE ANIMATION ---
        class MazeGame {
            constructor() {
                this.canvas = document.getElementById('maze-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.isMobile = window.innerWidth <= 900;
                this.cellSize = this.isMobile ? 60 : 40;
                this.frameCount = 0;
                this.wallWidth = 2;
                this.cols = 0;
                this.rows = 0;
                this.grid = [];
                this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

                this.lastWidth = window.innerWidth;
                this.resize();
                window.addEventListener('resize', () => {
                    const currentlyMobile = window.innerWidth <= 900;
                    if (currentlyMobile) {
                        if (window.innerWidth !== this.lastWidth) {
                            this.lastWidth = window.innerWidth;
                            this.resize();
                        }
                    } else {
                        this.resize();
                    }
                });
                window.addEventListener('mousemove', (e) => {
                    this.mouse.x = e.clientX;
                    this.mouse.y = e.clientY;
                });
                this.isVisible = true;
                this.isAnimating = true;
                this.animate();
            }

            resize() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.cols = Math.ceil(this.canvas.width / this.cellSize);
                this.rows = Math.ceil(this.canvas.height / this.cellSize);
                this.initMaze();
            }

            initMaze() {
                this.grid = [];
                for (let r = 0; r < this.rows; r++) {
                    let row = [];
                    for (let c = 0; c < this.cols; c++) {
                        row.push({ x: c, y: r, walls: [true, true, true, true], visited: false });
                    }
                    this.grid.push(row);
                }
                let startCell = this.grid[0][0];
                startCell.visited = true;
                this.stack = [startCell];

                while (this.stack.length > 0) {
                    let current = this.stack[this.stack.length - 1];
                    let next = this.checkNeighbors(current);
                    if (next) {
                        next.visited = true;
                        this.stack.push(next);
                        this.removeWalls(current, next);
                    } else {
                        this.stack.pop();
                    }
                }
            }

            checkNeighbors(cell) {
                let neighbors = [];
                let { x, y } = cell;
                if (y > 0 && !this.grid[y - 1][x].visited) neighbors.push(this.grid[y - 1][x]);
                if (x < this.cols - 1 && !this.grid[y][x + 1].visited) neighbors.push(this.grid[y][x + 1]);
                if (y < this.rows - 1 && !this.grid[y + 1][x].visited) neighbors.push(this.grid[y + 1][x]);
                if (x > 0 && !this.grid[y][x - 1].visited) neighbors.push(this.grid[y][x - 1]);

                if (neighbors.length > 0) return neighbors[Math.floor(Math.random() * neighbors.length)];
                return undefined;
            }

            removeWalls(a, b) {
                let x = a.x - b.x;
                if (x === 1) { a.walls[3] = false; b.walls[1] = false; }
                else if (x === -1) { a.walls[1] = false; b.walls[3] = false; }
                let y = a.y - b.y;
                if (y === 1) { a.walls[0] = false; b.walls[2] = false; }
                else if (y === -1) { a.walls[2] = false; b.walls[0] = false; }
            }

            draw() {
                // Smoothly lerp the theme value between 0 (dark) and 1 (light)
                this.themeVal = this.themeVal || 0;
                const targetTheme = document.body.classList.contains('light-theme') ? 1 : 0;
                this.themeVal += (targetTheme - this.themeVal) * 0.05; // 0.05 speed for a smooth ~0.8s transition at 60fps

                // Interpolate Background
                const bgVal = Math.round(5 + this.themeVal * 250);
                this.ctx.fillStyle = `rgb(${bgVal}, ${bgVal}, ${bgVal})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Interpolate Lines
                const time = Date.now() * 0.001;
                const alpha = 0.1 + Math.abs(Math.sin(time)) * 0.1;
                const lineVal = Math.round(34 + this.themeVal * 186);
                this.ctx.strokeStyle = `rgba(${lineVal}, ${lineVal}, ${lineVal}, ${0.5 + alpha})`;
                this.ctx.lineWidth = this.wallWidth;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();

                for (let r = 0; r < this.rows; r++) {
                    for (let c = 0; c < this.cols; c++) {
                        let cell = this.grid[r][c];
                        let x = c * this.cellSize;
                        let y = r * this.cellSize;

                        if (cell.walls[0]) { this.ctx.moveTo(x, y); this.ctx.lineTo(x + this.cellSize, y); }
                        if (cell.walls[1]) { this.ctx.moveTo(x + this.cellSize, y); this.ctx.lineTo(x + this.cellSize, y + this.cellSize); }
                        if (cell.walls[2]) { this.ctx.moveTo(x + this.cellSize, y + this.cellSize); this.ctx.lineTo(x, y + this.cellSize); }
                        if (cell.walls[3]) { this.ctx.moveTo(x, y + this.cellSize); this.ctx.lineTo(x, y); }
                    }
                }
                this.ctx.stroke();

                // Interpolate Fog Gradient
                let gradient = this.ctx.createRadialGradient(
                    this.mouse.x, this.mouse.y, 50,
                    this.mouse.x, this.mouse.y, 700
                );
                
                const fogVal = Math.round(5 + this.themeVal * 250);
                gradient.addColorStop(0, `rgba(${fogVal}, ${fogVal}, ${fogVal}, 0)`);
                gradient.addColorStop(0.2, `rgba(${fogVal}, ${fogVal}, ${fogVal}, ${0.05 - this.themeVal * 0.05})`);
                gradient.addColorStop(0.5, `rgba(${fogVal}, ${fogVal}, ${fogVal}, ${0.7 - this.themeVal * 0.1})`);
                gradient.addColorStop(1, `rgba(${fogVal}, ${fogVal}, ${fogVal}, ${1 - this.themeVal * 0.05})`);

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            animate() {
                if (!this.isVisible) {
                    this.isAnimating = false;
                    return; // Stop loop completely once faded out
                }
                
                this.frameCount++;
                // Throttle to ~30fps on mobile (skip every other frame)
                if (this.isMobile && this.frameCount % 2 !== 0) {
                    requestAnimationFrame(() => this.animate());
                    return;
                }
                this.draw();
                requestAnimationFrame(() => this.animate());
            }
        }
        window.mazeGameInstance = new MazeGame();

        // --- HERO SCROLL ANIMATION ---
        function initHeroScroll() {
            const isMobileHero = window.innerWidth < 900;
            
            // Set initial filter to explicitly tell GSAP how to interpolate the blur
            gsap.set("#word1, #word2", { filter: "blur(0px)" });

            const heroTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".hero",
                    start: "top top",
                    end: "bottom center",
                    scrub: 1,
                    invalidateOnRefresh: true
                }
            });
            const heroParallaxX = isMobileHero ? 80 : 300;
            const heroParallaxY = isMobileHero ? 50 : 100;

            if (!isMobileHero) {
                heroTl.to("#word1", { x: -heroParallaxX, y: -heroParallaxY, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to("#word2", { x: heroParallaxX, y: heroParallaxY, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to(".hero-sub, .hero-cta-group, .hero-trust-bar, .scroll-prompt", { opacity: 0, y: 50 }, 0);
            } else {
                heroTl.to("#word1", { x: -150, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to("#word2", { x: 150, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to(".hero-cta-group, .hero-trust-bar, .scroll-prompt", { opacity: 0, y: 50 }, 0);
            }
        }

        // --- CARD LOGIC ---
        const cards = document.querySelectorAll('.card-wrapper');
        const card1 = document.querySelector('#card1');
        const card2 = document.querySelector('#card2');
        const card3 = document.querySelector('#card3');

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            if (window.innerWidth >= 900) {
                xTo(mouseX);
                yTo(mouseY);
            }
        });

        const resetAllFlips = () => {
            cards.forEach(card => {
                const inner = card.querySelector('.card-inner');
                gsap.to(inner, { rotationY: 0, rotationX: 0, z: 0, scale: 1, ease: "power3.inOut", duration: 0.8 });
                card.classList.add('locked');
            });
        };

        const enableInteraction = () => { cards.forEach(card => card.classList.remove('locked')); }

        let interactionEnabled = false;

        let mm = gsap.matchMedia();

        // --- MOBILE: Skip pinning entirely, use static card layout ---
        mm.add("(max-width: 899px)", () => {
            cards.forEach(card => {
                gsap.set(card, { clearProps: 'all' });
                const inner = card.querySelector('.card-inner');
                if (inner) gsap.set(inner, { clearProps: 'all' });
                card.classList.remove('locked');
            });
            gsap.set(card1, { clearProps: 'all' });
            gsap.set(card2, { clearProps: 'all' });
            gsap.set(card3, { clearProps: 'all' });

            interactionEnabled = true;

            // Tap a card to flip it: toggle .flipped class
            const handleClick = (e) => {
                const card = e.currentTarget;
                const clickedLink = e.target.closest('a, button');
                if (clickedLink && card.classList.contains('flipped')) {
                    return; // Allow link navigation on the back face
                }

                // Toggle flip
                const isFlipped = card.classList.toggle('flipped');
                gsap.to(card.querySelector('.card-inner'), {
                    rotationY: isFlipped ? 180 : 0,
                    duration: 0.6,
                    ease: "power2.inOut",
                    overwrite: "auto"
                });

                // Vibrate on flip
                if (navigator.vibrate) navigator.vibrate([40]);
            };

            cards.forEach((card) => {
                card.addEventListener('click', handleClick);
            });

            return () => {
                cards.forEach((card) => {
                    card.removeEventListener('click', handleClick);
                    card.classList.remove('flipped');
                });
            };
        });

        // --- DESKTOP: Original pinning + spread animation ---
        mm.add("(min-width: 900px)", () => {
            const spreadDistance = 400;
            const vSpread = 450;
            
            gsap.set(cards, { xPercent: -50, yPercent: -50, left: "50%", top: "50%", position: "absolute" });
            gsap.set(card1, { zIndex: 1, x: -30, y: 15, rotation: -12, scale: 0.8, filter: "blur(4px) brightness(0.6)" });
            gsap.set(card2, { zIndex: 3, x: 0, y: 0, rotation: 0, scale: 0.85, filter: "blur(0px) brightness(1)" });
            gsap.set(card3, { zIndex: 2, x: 30, y: 15, rotation: 12, scale: 0.9, filter: "blur(4px) brightness(0.6)" });

            const stackTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".portfolio",
                    start: "top top",
                    end: "+=100%",
                    pin: true,
                    scrub: 1,
                    onUpdate: (self) => {
                        const shouldEnable = self.progress >= 0.2;
                        if (shouldEnable !== interactionEnabled) {
                            interactionEnabled = shouldEnable;
                            if (interactionEnabled) enableInteraction();
                            else resetAllFlips();
                        }
                        const v = Math.abs(self.getVelocity());
                        const normalizedV = Math.min(v / 3000, 1);
                        gsap.to(velocityFill, { height: `${normalizedV * 100}%`, duration: 0.1 });
                    }
                }
            });

            stackTl
                .to(card1, { xPercent: -50, x: -spreadDistance, rotation: 0, scale: 1, filter: "blur(0px) brightness(1)", duration: 1 }, 0)
                .to(card2, { xPercent: -50, x: 0, rotation: 0, scale: 1, duration: 1 }, 0)
                .to(card3, { xPercent: -50, x: spreadDistance, rotation: 0, scale: 1, filter: "blur(0px) brightness(1)", duration: 1 }, 0);

            // --- CLICK TO SCATTER / OPEN CARDS (SMOOTH CARD DEAL ANIMATION) ---
            // --- CLICK TO SCATTER / OPEN CARDS (SMOOTH SCATTER SYNCED WITH SCROLLTRIGGER) ---
            const handleCardClick = (e) => {
                // If user clicked an action link/button inside card back, allow standard navigation
                if (e.target.closest('a, button')) return;

                const st = stackTl.scrollTrigger;
                if (!st) return;

                if (navigator.vibrate) navigator.vibrate([40]);

                // If cards are currently scattered (progress > 0.35), smoothly collapse back to stacked deck
                if (st.progress > 0.35) {
                    resetAllFlips();
                    if (lenis && typeof lenis.scrollTo === 'function') {
                        lenis.scrollTo(st.start, {
                            duration: 0.9,
                            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
                        });
                    } else {
                        window.scrollTo({ top: st.start, behavior: 'smooth' });
                    }
                } else {
                    // Otherwise smoothly scatter cards open to full display
                    if (lenis && typeof lenis.scrollTo === 'function') {
                        lenis.scrollTo(st.end, {
                            duration: 0.9,
                            easing: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
                        });
                    } else {
                        window.scrollTo({ top: st.end, behavior: 'smooth' });
                    }
                }
            };

            // --- CARD INTERACTION & GLOW TRACKING ---
            const handleMouseEnter = (e) => {
                const card = e.currentTarget;
                const inner = card.querySelector('.card-inner');
                if (interactionEnabled) {
                    cursor.classList.add('active');
                    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
                }
                card._isHovering = true;

                gsap.to(card, { filter: "blur(0px) brightness(1)", duration: 0.3, overwrite: "auto" });

                if (!interactionEnabled) {
                    gsap.to(inner, { scale: 1.05, duration: 0.5, ease: "power3.out" });
                    return;
                }

                gsap.to(inner, {
                    rotationY: 180, z: 60, scale: 1.15,
                    ease: "back.out(1.5)", duration: 0.8, overwrite: true
                });
            };

            const handleTouchStart = () => {
                if (interactionEnabled && navigator.vibrate) navigator.vibrate([80]);
            };

            const handleMouseLeave = (e) => {
                const card = e.currentTarget;
                const inner = card.querySelector('.card-inner');
                cursor.classList.remove('active');
                card._isHovering = false;

                gsap.to(inner, {
                    rotationY: 0, rotationX: 0, z: 0, scale: 1,
                    ease: "power3.inOut", duration: 0.6, overwrite: true
                });
            };

            const handleMouseMove = (e) => {
                const card = e.currentTarget;
                const inner = card.querySelector('.card-inner');
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                if (!card._isHovering || !interactionEnabled) return;

                const xPct = (x / rect.width - 0.5);
                const yPct = (y / rect.height - 0.5);

                gsap.to(inner, {
                    rotationY: 180 + (xPct * 30),
                    rotationX: -yPct * 30,
                    duration: 0.2,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            };

            cards.forEach((card) => {
                card.addEventListener('mouseenter', handleMouseEnter);
                card.addEventListener('touchstart', handleTouchStart, { passive: true });
                card.addEventListener('mouseleave', handleMouseLeave);
                card.addEventListener('mousemove', handleMouseMove);
                card.addEventListener('click', handleCardClick);
            });

            return () => {
                interactionEnabled = false;
                cards.forEach((card) => {
                    card.removeEventListener('mouseenter', handleMouseEnter);
                    card.removeEventListener('touchstart', handleTouchStart);
                    card.removeEventListener('mouseleave', handleMouseLeave);
                    card.removeEventListener('mousemove', handleMouseMove);
                    card.removeEventListener('click', handleCardClick);
                    gsap.set(card, { clearProps: 'all' });
                    const inner = card.querySelector('.card-inner');
                    if (inner) gsap.set(inner, { clearProps: 'all' });
                });
            };
        });

        const isMobile = window.innerWidth < 900;

        if (isMobile) {
            // Tooltip: tap to toggle on "We are a creative agency" button
            const heroSub = document.querySelector('.hero-sub');
            if (heroSub) {
                heroSub.addEventListener('click', (e) => {
                    e.stopPropagation();
                    heroSub.classList.toggle('tooltip-open');
                });

                // Close tooltip when tapping elsewhere
                document.addEventListener('click', (e) => {
                    if (!heroSub.contains(e.target)) {
                        heroSub.classList.remove('tooltip-open');
                    }
                });
            }
        }

        // --- TITLE 3D INTERACTION ---
        const titleElement = document.querySelector('.cards-title');

        window.addEventListener('mousemove', (e) => {
            if (!titleElement || isMobile) return;
            const tRect = titleElement.getBoundingClientRect();
            if (tRect.bottom < 0 || tRect.top > window.innerHeight) return;

            // Calculate x and y percentage based on window space
            const xPct = (e.clientX / window.innerWidth - 0.5);
            const yPct = (e.clientY / window.innerHeight - 0.5);

            // subtle 3D tilt
            gsap.to(titleElement, {
                rotationY: xPct * 20,
                rotationX: -yPct * 20,
                duration: 0.5,
                ease: "power2.out",
                overwrite: "auto"
            });
        });

        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => cursor.classList.add('active'));
            btn.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });

        // --- MAGNETIC BUTTON ---
        const magneticBtns = document.querySelectorAll('.mega-project-btn, .btn-primary, .btn-outline, .attract-btn');
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                if (window.innerWidth <= 900) return; // Disable magnetic effect on mobile
                
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                // Move the whole button slightly for general magnetic effect
                gsap.to(btn, {
                    x: x * 0.2,
                    y: y * 0.2,
                    duration: 0.6,
                    ease: "power3.out",
                    overwrite: "auto"
                });

                // Specific parallax logic for the mega button's dual text
                const solidText = btn.querySelector('.mega-text.solid');
                const outlineText = btn.querySelector('.mega-text.outline');
                
                if (solidText) {
                    gsap.to(solidText, { x: x * 0.15, y: y * 0.15, duration: 0.6, ease: "power3.out", overwrite: "auto" });
                }
                if (outlineText) {
                    gsap.to(outlineText, { x: `calc(-50% + ${x * 0.05}px)`, y: y * 0.05, duration: 0.6, ease: "power3.out", overwrite: "auto" });
                }
            });

            btn.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 900) return;
                
                gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)",
                    overwrite: "auto"
                });

                const solidText = btn.querySelector('.mega-text.solid');
                const outlineText = btn.querySelector('.mega-text.outline');
                
                if (solidText) {
                    gsap.to(solidText, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
                }
                if (outlineText) {
                    gsap.to(outlineText, { x: "-50%", y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
                }
            });

            // Touch reactive scaling for mobile
            btn.addEventListener('touchstart', () => {
                if (window.innerWidth <= 900) {
                    gsap.to(btn, { scale: 0.95, duration: 0.2, overwrite: "auto" });
                }
            }, {passive: true});

            btn.addEventListener('touchend', () => {
                if (window.innerWidth <= 900) {
                    gsap.to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
                }
            }, {passive: true});
        });

        // const textSections = document.querySelectorAll('.join-community-section, .client-connection-section, .services-section');
        // textSections.forEach(sec => {
        //     gsap.fromTo(sec.children,
        //         { y: 50, opacity: 0 },
        //         {
        //             y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.2,
        //             scrollTrigger: { trigger: sec, start: "top 75%" }
        //         }
        //     );
        // });

        // gsap.from(".mega-project-btn, .client-footer-content", {
        //     scrollTrigger: { trigger: ".client-connection-section", start: "top 75%" },
        //     y: 30, opacity: 0, duration: 1, stagger: 0.2, ease: "power3.out"
        // });

        // gsap.from(".sub-footer", {
        //     scrollTrigger: { trigger: ".sub-footer", start: "top 95%" },
        //     y: 20, opacity: 0, duration: 0.8, ease: "power2.out"
        // });

        const hamburger = document.getElementById('hamburger');
        const navLinks = document.querySelector('.nav-links');
        const allNavClickables = document.querySelectorAll('.nav-link, .c-nav-btn');

        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                hamburger.children[0].style.transform = "translateY(5px) rotate(45deg)";
                hamburger.children[2].style.transform = "translateY(-5px) rotate(-45deg)";
            } else {
                hamburger.children[0].style.transform = "none";
                hamburger.children[2].style.transform = "none";
            }
        });

        allNavClickables.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.children[0].style.transform = "none";
                hamburger.children[2].style.transform = "none";
            });
        });

        let lastScroll = 0;
        const navbar = document.getElementById('navbar');

        if (navbar) {
            navbar.style.background = '';
            navbar.style.boxShadow = '';
            navbar.classList.toggle('scrolled', window.pageYOffset > 10);
        }

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (navbar) {
                navbar.classList.toggle('scrolled', currentScroll > 10);
                if (currentScroll > lastScroll && currentScroll > 100) navbar.style.transform = "translateY(-100%)";
                else navbar.style.transform = "translateY(0)";
            }
            lastScroll = currentScroll;
        }, { passive: true });

        // --- THEME TOGGLE LOGIC ---
        // Keep light version by default on mobile
        const themeBtn = document.getElementById('theme-switch');

        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(40);

                const toggleTheme = () => {
                    const isLight = document.body.classList.toggle('light-theme');
                    if (isLight) {
                        document.body.dataset.manualTheme = 'light';
                    } else {
                        delete document.body.dataset.manualTheme;
                    }
                    if (navbar) {
                        navbar.style.background = '';
                        navbar.style.boxShadow = '';
                    }
                };

                if (!document.startViewTransition) {
                    toggleTheme();
                    return;
                }

                // Get coordinates of the switch button for the start of the "spill"
                const rect = themeBtn.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                const transition = document.startViewTransition(toggleTheme);

                transition.ready.then(() => {
                    const right = window.innerWidth - x;
                    const bottom = window.innerHeight - y;
                    const maxRadius = Math.hypot(Math.max(x, right), Math.max(y, bottom));

                    document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${maxRadius}px at ${x}px ${y}px)`
                            ]
                        },
                        {
                            duration: 1000,
                            easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
                            pseudoElement: "::view-transition-new(root)",
                        }
                    );
                });
            });
            themeBtn.addEventListener('mouseenter', () => cursor.classList.add('active'));
            themeBtn.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        }

        // --- LIVE CLOCK LOGIC (IP-BASED TIMEZONE) ---
        const clockHours = document.getElementById('clock-hours');
        const clockMins = document.getElementById('clock-minutes');
        const dialProgress = document.getElementById('dial-progress');
        const secTens = document.getElementById('sec-tens');
        const secOnes = document.getElementById('sec-ones');
        // Default: use the browser's own timezone (accurate fallback)
        let visitorTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        if (secTens && secOnes) {
            let tensHTML = '';
            for (let i = 0; i <= 5; i++) tensHTML += `<div class="digit-val">${i}</div>`;
            secTens.innerHTML = `<div class="digit-col">${tensHTML}</div>`;

            let onesHTML = '';
            for (let i = 0; i <= 9; i++) onesHTML += `<div class="digit-val">${i}</div>`;
            onesHTML += `<div class="digit-val">0</div>`;
            secOnes.innerHTML = `<div class="digit-col">${onesHTML}</div>`;
        }

        function getTimeParts(timezone) {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(new Date());
            const get = (type) => parts.find(p => p.type === type)?.value ?? '00';
            let h = get('hour');
            // '24' can appear for midnight in some locales - normalize to '00'
            if (h === '24') h = '00';
            return {
                h: h.padStart(2, '0'),
                m: get('minute').padStart(2, '0'),
                s: parseInt(get('second'), 10)
            };
        }

        function updateLiveClock() {
            if (!clockHours || !clockMins) return;
            const { h, m, s } = getTimeParts(visitorTimezone);

            if (clockHours.innerText !== h) clockHours.innerText = h;
            if (clockMins.innerText !== m) clockMins.innerText = m;

            const totalDash = 339.292;
            if (s === 0) {
                dialProgress.style.transition = 'none';
                dialProgress.style.strokeDashoffset = totalDash;
                void dialProgress.offsetWidth;
                dialProgress.style.transition = 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            }
            dialProgress.style.strokeDashoffset = totalDash - (totalDash * (s / 60));

            const t = Math.floor(s / 10);
            const o = s % 10;

            const tCol = secTens.querySelector('.digit-col');
            const oCol = secOnes.querySelector('.digit-col');

            if (!tCol || !oCol) return;

            if (s === 0) {
                tCol.style.transform = `translateY(0%)`;
                oCol.style.transform = `translateY(-${(10 * 100) / 11}%)`;

                setTimeout(() => {
                    if (getTimeParts(visitorTimezone).s === 0) {
                        oCol.style.transition = 'none';
                        oCol.style.transform = `translateY(0%)`;
                        void oCol.offsetWidth;
                        oCol.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
                    }
                }, 500);
            } else {
                tCol.style.transform = `translateY(-${t * (100 / 6)}%)`;
                oCol.style.transform = `translateY(-${o * (100 / 11)}%)`;
            }
        }

        // Fetch visitor timezone from IP geolocation (silent - no visible label)
        async function fetchIPTimezone() {
            try {
                const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
                if (!res.ok) throw new Error('API error');
                const data = await res.json();
                if (data.timezone) visitorTimezone = data.timezone;
            } catch (e) {
                // Fallback: browser timezone already set as default
            }
        }

        if (document.getElementById('clock-hours')) {
            updateLiveClock();
            setInterval(updateLiveClock, 1000);
            fetchIPTimezone(); // Async - updates timezone label once resolved

            // gsap.fromTo(".live-clock-section",
            //     { opacity: 0, scale: 0.95, y: 50 },
            //     { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".live-clock-section", start: "top 85%" } }
            // );
        }

        // --- CUSTOM PACKAGE BUILDER (RECEIPT LOGIC) STATE ---
        const selectedServices = new Map();
        const customServicesSet = new Set();
        if (typeof window !== 'undefined') {
            window.__selectedServices = selectedServices;
            window.__customServicesSet = customServicesSet;
        }

        // --- FLOATING SERVICES CLOUD ---
        const cloudContainer = document.getElementById('floating-cloud');

        if (cloudContainer) {

            // --- Zero-Gravity Physics State ---
            const pillState = [];
            let physicsInitialized = false;
            let containerW = cloudContainer.offsetWidth || window.innerWidth;
            let containerH = cloudContainer.offsetHeight || 550;
            let isCloudInView = true;
            let visibilityObserver = null;

            // Use IntersectionObserver to cull physics when offscreen without layout thrashing
            if (typeof IntersectionObserver !== 'undefined') {
                visibilityObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isCloudInView = entry.isIntersecting;
                    });
                }, { threshold: 0.01, rootMargin: '150px 0px' });
                visibilityObserver.observe(cloudContainer);
            }

            function initPhysics() {
                pillState.length = 0;
                const currentPills = document.querySelectorAll('.f-pill');
                if (!currentPills || currentPills.length === 0) return;

                currentPills.forEach((pill, i) => {
                    // Reset any GSAP inline transforms
                    gsap.set(pill, { clearProps: 'all' });
                    pill.style.position = 'absolute';
                    pill.style.left = '50%';
                    pill.style.top = '50%';
                    pill.style.touchAction = 'pan-y'; /* Allow vertical scrolling even if pill is touched */
                    pill.style.cursor = 'grab';
                    pill.style.userSelect = 'none';

                    // --- Depth: random layer between 0.55 and 1.1 ---
                    const depth = 0.55 + Math.random() * 0.55;
                    const pillScale = 0.70 + depth * 0.45; // 0.95 to 1.20
                    const pillOpacity = 0.35 + depth * 0.55; // 0.65 to 0.95
                    const pillZIndex = Math.floor(depth * 10);

                    pill.style.opacity = Math.min(pillOpacity, 1);
                    pill.style.zIndex = pillZIndex;
                    pill.style.fontSize = `${(0.78 + depth * 0.22).toFixed(2)}rem`;

                    // Expansive scatter across the container to prevent any central clumping
                    const px = (Math.random() - 0.5) * containerW * 0.88;
                    const py = (Math.random() - 0.5) * containerH * 0.82;

                    // Randomized natural velocity per pill
                    const baseSpeed = 0.3 + Math.random() * 0.5; // gentle, elegant cruising speed
                    const angle = Math.random() * Math.PI * 2;

                    // Per-pill physics personality
                    const pillMaxSpeed = 1.1 + Math.random() * 0.9;     // 1.1 – 2.0 (normal cruise ceiling)
                    const pillNudgeChance = 0.015 + Math.random() * 0.035; // gentle zero-g tumbles
                    const pillNudgeForce = 0.08 + Math.random() * 0.12;

                    const hw = pill.offsetWidth ? pill.offsetWidth / 2 : 60;
                    const hh = pill.offsetHeight ? pill.offsetHeight / 2 : 20;

                    const shouldHide = (window.innerWidth <= 900) && ((i % 3) !== 0);
                    pill.style.display = shouldHide ? 'none' : 'inline-flex';

                    pillState.push({
                        el: pill,
                        isActive: !shouldHide,
                        x: px,
                        y: py,
                        vx: Math.cos(angle) * baseSpeed,
                        vy: Math.sin(angle) * baseSpeed,
                        baseSpeed: baseSpeed,
                        minSpeed: 0.25,
                        scale: pillScale,
                        baseOpacity: pillOpacity,
                        baseZIndex: pillZIndex,
                        maxSpeed: pillMaxSpeed,
                        nudgeChance: pillNudgeChance,
                        nudgeForce: pillNudgeForce,
                        hw: hw,
                        hh: hh,
                        isDragging: false,
                        lastClickTime: 0,
                        startPX: 0,
                        startPY: 0,
                        startEX: 0,
                        startEY: 0,
                        prevPX: 0,
                        prevPY: 0,
                        dragVX: 0,
                        dragVY: 0
                    });

                    const st = pillState[i];
                    _applyTransform(pill, st);
                    _attachDragListeners(pill, st);

                    // Re-apply selected class if already in cart
                    const svc = pill.textContent.replace(' ✓', '').trim();
                    if (typeof window !== 'undefined' && window.__selectedServices && window.__selectedServices.has(svc)) {
                        pill.classList.add('selected');
                        pill.style.zIndex = 100;
                    }
                });

                // Start the physics loop via GSAP ticker for maximum stability
                if (!physicsInitialized) {
                    gsap.ticker.add(_physicsTick);
                    physicsInitialized = true;
                }
            }
            window.__initCloudPhysics = initPhysics;

            // High-precision sub-pixel translation for ultra-smooth GPU composition
            function _applyTransform(el, s) {
                el.style.transform = `translate3d(calc(-50% + ${s.x.toFixed(2)}px), calc(-50% + ${s.y.toFixed(2)}px), 0) scale(${s.scale})`;
            }

            function _physicsTick(time, deltaTime) {
                // Viewport culling without layout thrashing
                if (!isCloudInView) return;

                // Delta time normalization: 16.667ms = 1.0 (60fps reference)
                const rawDt = (deltaTime || 16.667) / 16.667;
                const dt = Math.min(Math.max(rawDt, 0.2), 2.0);

                for (let i = 0; i < pillState.length; i++) {
                    const s = pillState[i];
                    if (!s.isActive || s.isDragging) continue;

                    const curSpeed = Math.hypot(s.vx, s.vy);

                    if (curSpeed > s.maxSpeed) {
                        // When thrown or pushed: smoothly glide in the flow, gradually coasting down
                        const throwDamping = Math.pow(0.986, dt);
                        s.vx *= throwDamping;
                        s.vy *= throwDamping;
                    } else {
                        // Gentle zero-gravity cosmic drift & tumbles
                        if (Math.random() < s.nudgeChance * dt) {
                            s.vx += (Math.random() - 0.5) * s.nudgeForce;
                            s.vy += (Math.random() - 0.5) * s.nudgeForce;
                        }

                        // Gentle cruising damping
                        const cruiseDamping = Math.pow(0.998, dt);
                        s.vx *= cruiseDamping;
                        s.vy *= cruiseDamping;

                        // Ensure pills maintain a gentle baseline drift and never stall
                        if (curSpeed < s.minSpeed && curSpeed > 0.0001) {
                            const boost = s.minSpeed / curSpeed;
                            s.vx *= boost;
                            s.vy *= boost;
                        }
                    }

                    // Delta-time scaled position integration
                    s.x += s.vx * dt;
                    s.y += s.vy * dt;

                    // Boundary: Seamless infinite loop wrap across full outer limits
                    const wrapLimitX = containerW / 2 + s.hw + 30;
                    const wrapLimitY = containerH / 2 + s.hh + 30;

                    if (s.x > wrapLimitX) s.x = -wrapLimitX;
                    else if (s.x < -wrapLimitX) s.x = wrapLimitX;

                    if (s.y > wrapLimitY) s.y = -wrapLimitY;
                    else if (s.y < -wrapLimitY) s.y = wrapLimitY;

                    // Dynamic fade near the edges of the container
                    const distX = Math.abs(s.x) / (containerW / 2);
                    const distY = Math.abs(s.y) / (containerH / 2);
                    const maxDist = Math.max(distX, distY);

                    const fadeStart = 0.80;
                    let targetOpacity = s.baseOpacity;
                    let targetPE = 'auto';

                    if (maxDist > fadeStart && !s.el.classList.contains('selected')) {
                        const fadeFactor = Math.max(0, 1 - ((maxDist - fadeStart) / (1 - fadeStart)));
                        targetOpacity = s.baseOpacity * fadeFactor * fadeFactor;
                        targetPE = fadeFactor < 0.08 ? 'none' : 'auto';
                    } else if (s.el.classList.contains('selected')) {
                        targetOpacity = 1;
                        targetPE = 'auto';
                    }

                    // Only update DOM styles if values meaningfully changed to eliminate layout thrashing
                    if (s._curOpacity === undefined || Math.abs(s._curOpacity - targetOpacity) > 0.02) {
                        s.el.style.opacity = targetOpacity.toFixed(2);
                        s._curOpacity = targetOpacity;
                    }
                    if (s._curPE !== targetPE) {
                        s.el.style.pointerEvents = targetPE;
                        s._curPE = targetPE;
                    }

                    _applyTransform(s.el, s);
                }
            }

            function _attachDragListeners(pill, s) {
                let lastClickTime = 0;

                pill.addEventListener('pointerdown', (e) => {
                    e.stopPropagation();
                    s.isDragging = true;
                    s.startPX = e.clientX;
                    s.startPY = e.clientY;
                    s.startEX = s.x;
                    s.startEY = s.y;
                    s.prevPX = e.clientX;
                    s.prevPY = e.clientY;
                    s.dragVX = 0;
                    s.dragVY = 0;
                    try { pill.setPointerCapture(e.pointerId); } catch (_) {}
                    pill.style.cursor = 'grabbing';
                    pill.style.zIndex = 2000;
                });

                pill.addEventListener('pointermove', (e) => {
                    if (!s.isDragging) return;
                    const dx = e.clientX - s.startPX;
                    const dy = e.clientY - s.startPY;
                    // Responsive velocity tracking with smooth moving average
                    const instVX = e.clientX - s.prevPX;
                    const instVY = e.clientY - s.prevPY;
                    s.dragVX = instVX * 0.7 + s.dragVX * 0.3;
                    s.dragVY = instVY * 0.7 + s.dragVY * 0.3;
                    s.prevPX = e.clientX;
                    s.prevPY = e.clientY;
                    s.x = s.startEX + dx;
                    s.y = s.startEY + dy;
                    _applyTransform(pill, s);
                });

                const onPointerRelease = (e) => {
                    if (!s.isDragging) return;
                    s.isDragging = false;
                    try { pill.releasePointerCapture(e.pointerId); } catch (_) {}
                    pill.style.cursor = 'grab';

                    // Restore z-index logic: if selected, keep at 100, else return to baseZIndex
                    if (!pill.classList.contains('selected')) {
                        pill.style.zIndex = s.baseZIndex;
                    } else {
                        pill.style.zIndex = 100;
                    }

                    // Throw with drag velocity - flows immediately in the direction pushed!
                    const flingSpeed = Math.hypot(s.dragVX, s.dragVY);
                    if (flingSpeed > 0.4) {
                        // Allow generous throw speed (up to 9.0 px/frame) so flicks feel lively and flow smoothly
                        const factor = 0.45;
                        const throwSpeed = flingSpeed * factor;
                        const maxThrow = 9.0;
                        const scale = throwSpeed > maxThrow ? maxThrow / throwSpeed : 1.0;
                        s.vx = s.dragVX * factor * scale;
                        s.vy = s.dragVY * factor * scale;
                    }

                    const totalMoved = Math.hypot(e.clientX - s.startPX, e.clientY - s.startPY);

                    // Tap logic: single tap unselects, double tap selects
                    if (totalMoved < 10) {
                        // If already selected, single tap to unselect immediately
                        if (pill.classList.contains('selected')) {
                            if (typeof window.handlePillAction === 'function') window.handlePillAction(e, pill);
                        } else {
                            // Not selected: double-tap to add
                            const now = Date.now();
                            if (now - lastClickTime < 350) {
                                lastClickTime = 0;
                                if (typeof window.handlePillAction === 'function') window.handlePillAction(e, pill);
                            } else {
                                lastClickTime = now;
                                // Single tap visual hint - gentle brightness pulse
                                gsap.fromTo(pill,
                                    { filter: 'brightness(1.5)' },
                                    { filter: 'brightness(1)', duration: 0.4, ease: 'power2.out' }
                                );
                            }
                        }
                    }
                };

                pill.addEventListener('pointerup', onPointerRelease);
                pill.addEventListener('pointercancel', onPointerRelease);
            }

            // Explicitly observe layout dimensions to handle responsive resizes cleanly
            const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.target === cloudContainer) {
                        const newW = entry.contentRect.width || cloudContainer.offsetWidth;
                        const newH = entry.contentRect.height || cloudContainer.offsetHeight;

                        if (newW > 0 && newH > 0) {
                            containerW = newW;
                            containerH = newH;

                            // Initialize once layout guarantees space
                            if (!physicsInitialized) {
                                initPhysics();
                            } else {
                                // Safely handle responsive window resizing without destroying pill positions
                                document.querySelectorAll('.f-pill').forEach((pill, i) => {
                                    const shouldHide = (window.innerWidth <= 900) && ((i % 3) !== 0);
                                    if (pillState[i]) {
                                        pillState[i].isActive = !shouldHide;
                                        pill.style.display = shouldHide ? 'none' : 'inline-flex';
                                        pillState[i].hw = pill.offsetWidth ? pill.offsetWidth / 2 : 60;
                                        pillState[i].hh = pill.offsetHeight ? pill.offsetHeight / 2 : 20;
                                    }
                                });
                            }
                        }
                    }
                }
            });
            ro.observe(cloudContainer);
            // Kickstart immediately even if ResizeObserver hasn't fired
            initPhysics();
        }

        // --- CUSTOM PACKAGE BUILDER (RECEIPT LOGIC) ---
        window.__updateGlider = updateGlider;
        window.__switchTabTo = switchTabTo;
        let hasAutoScrolledToCart = false; // Tracks if we've shown the auto-scroll tour
        const customQuoteBtn = document.getElementById('custom-quote-btn');
        const receiptItemsContainer = document.getElementById('receipt-items');

        window.clearCart = function() {
            if (selectedServices.size > 0) {
                selectedServices.clear();
                customServicesSet.clear();
                renderCustomChips();
                
                // Deselect all floating pills
                document.querySelectorAll('.f-pill').forEach(pill => {
                    pill.classList.remove('selected');
                });
                
                // Deselect all custom chips
                document.querySelectorAll('.custom-chip:not(.custom-chip-action)').forEach(chip => {
                    chip.classList.remove('selected');
                });
                
                updateReceipt();
            }
        };

        function renderCustomChips() {
            const container = document.getElementById('custom-services-added-list');
            if (!container) return;

            const activeCustom = Array.from(customServicesSet).filter(svc => selectedServices.has(svc));
            if (activeCustom.length === 0) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }

            container.style.display = 'flex';
            container.innerHTML = '';
            activeCustom.forEach(svc => {
                const qty = selectedServices.get(svc) || 1;
                const chip = document.createElement('div');
                chip.className = 'custom-user-chip';
                chip.dataset.service = svc;
                chip.innerHTML = `
                    <span class="custom-user-badge">CUSTOM</span>
                    <span class="custom-user-title">${svc}</span>
                    <span class="custom-user-qty">x${qty}</span>
                    <button type="button" class="custom-user-del" data-service="${svc}" title="Remove Service">×</button>
                `;
                container.appendChild(chip);
            });

            container.querySelectorAll('.custom-user-del').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const svc = btn.dataset.service;
                    selectedServices.delete(svc);
                    customServicesSet.delete(svc);
                    renderCustomChips();
                    updateReceipt();
                });
            });
        }

        function updateReceipt() {
            if (!receiptItemsContainer) return;
            receiptItemsContainer.innerHTML = '';

            if (selectedServices.size === 0) {
                receiptItemsContainer.innerHTML = '<div class="empty-receipt">No services selected...</div>';
                if (customQuoteBtn) customQuoteBtn.href = 'mailto:hello@dripmedia.com';
                const clearBtn = document.getElementById('clear-cart-btn');
                if (clearBtn) clearBtn.style.display = 'none';
                renderCustomChips();
                return;
            } else {
                const clearBtn = document.getElementById('clear-cart-btn');
                if (clearBtn) clearBtn.style.display = 'block';
            }

            let list = [];
            let i = 1;
            selectedServices.forEach((qty, svc) => {
                const isCustom = customServicesSet.has(svc);
                const item = document.createElement('div');
                item.className = 'receipt-item';
                item.style.animationDelay = `${(i - 1) * 0.05}s`;
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                        <span class="item-name" style="font-family:'Clash Display', sans-serif;">[${String(i).padStart(2, '0')}] ${svc}</span> 
                        ${isCustom ? '<span class="receipt-custom-tag">CUSTOM</span>' : ''}
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                        <div class="qty-controls">
                            <button class="qty-btn minus-btn" data-service="${svc}" style="${qty <= 1 ? 'opacity: 0.3; cursor: not-allowed; pointer-events: none;' : ''}">-</button>
                            <span class="qty-val">${qty}</span>
                            <button class="qty-btn plus-btn" data-service="${svc}">+</button>
                        </div>
                        <button class="del-service-btn" data-service="${svc}" title="Remove Service">×</button>
                    </div>
                `;
                receiptItemsContainer.appendChild(item);
                list.push(`${qty}x ${svc}${isCustom ? ' (Custom)' : ''}`);
                i++;
            });

            // Attach event listeners to delete buttons
            document.querySelectorAll('.del-service-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const svc = btn.dataset.service;
                    if (selectedServices.has(svc)) {
                        selectedServices.delete(svc);
                        if (customServicesSet.has(svc)) {
                            customServicesSet.delete(svc);
                            renderCustomChips();
                        }

                        // Deselect corresponding floating pill
                        document.querySelectorAll('.f-pill').forEach(pill => {
                            if (pill.textContent.replace(' ✓', '').trim() === svc) {
                                pill.classList.remove('selected');
                            }
                        });

                        // Deselect corresponding builder chip
                        document.querySelectorAll('.custom-chip').forEach(chip => {
                            if (chip.dataset.service === svc) {
                                chip.classList.remove('selected');
                            }
                        });

                        updateReceipt();
                    }
                });
            });

            // Attach event listeners to quantity buttons
            document.querySelectorAll('.minus-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const svc = btn.dataset.service;
                    const qty = selectedServices.get(svc);
                    if (qty > 1) {
                        selectedServices.set(svc, qty - 1);
                        renderCustomChips();
                        updateReceipt();
                    }
                });
            });

            document.querySelectorAll('.plus-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const svc = btn.dataset.service;
                    const qty = selectedServices.get(svc);
                    if (qty < 99) {
                        selectedServices.set(svc, qty + 1);
                        renderCustomChips();
                        updateReceipt();
                    }
                });
            });

            if (customQuoteBtn) {
                const subj = encodeURIComponent('Custom Package Enquiry');
                const body = encodeURIComponent(`Hi Dripp Media,\n\nI'd like a quote for:\n${list.join(', ')}\n\nPlease get back to me with pricing and availability.\n\nThanks`);
                customQuoteBtn.href = `mailto:hello@dripmedia.com?subject=${subj}&body=${body}`;
            }
        }

        // --- CUSTOM SERVICE CREATOR (USER WRITE-IN) ---
        const customServiceInput = document.getElementById('custom-service-input');
        const customServiceAddBtn = document.getElementById('custom-service-add-btn');
        const customServiceError = document.getElementById('custom-service-error');
        const customServiceErrorText = document.getElementById('custom-service-error-text');
        let customServiceErrorTimeout = null;

        function showCustomServiceError(msg) {
            if (!customServiceInput) return;
            customServiceInput.classList.add('shake-warning');
            setTimeout(() => customServiceInput.classList.remove('shake-warning'), 500);

            if (customServiceError && customServiceErrorText) {
                customServiceErrorText.textContent = msg;
                customServiceError.style.display = 'inline-flex';
                clearTimeout(customServiceErrorTimeout);
                customServiceErrorTimeout = setTimeout(() => {
                    hideCustomServiceError();
                }, 4000);
            }
            customServiceInput.focus();
        }

        function hideCustomServiceError() {
            if (customServiceError) {
                customServiceError.style.display = 'none';
            }
        }

        function handleAddCustomService(e) {
            if (!customServiceInput) return;
            const val = customServiceInput.value.trim();

            if (!val) {
                showCustomServiceError('masti mat karo yaar.');
                return;
            }

            const validation = validateCustomService(val);
            if (!validation.isValid) {
                showCustomServiceError(validation.error || 'masti mat karo yaar.');
                return;
            }

            hideCustomServiceError();

            const cleanName = val.length > 1 ? val.charAt(0).toUpperCase() + val.slice(1) : val.toUpperCase();

            customServicesSet.add(cleanName);
            const currentQty = selectedServices.get(cleanName) || 0;
            selectedServices.set(cleanName, Math.min(99, currentQty + 1));

            if (customServiceAddBtn) {
                createSparkles(e || { clientX: 0, clientY: 0 }, customServiceAddBtn);
            }

            customServiceInput.value = '';
            customServiceInput.focus();

            renderCustomChips();
            updateReceipt();

            setTimeout(() => {
                if (receiptItemsContainer) {
                    receiptItemsContainer.scrollTop = receiptItemsContainer.scrollHeight;
                }
            }, 50);
        }

        if (customServiceAddBtn) {
            customServiceAddBtn.addEventListener('click', handleAddCustomService);
        }

        if (customServiceInput) {
            customServiceInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomService(e);
                }
            });
            customServiceInput.addEventListener('input', () => {
                hideCustomServiceError();
            });
        }

        renderCustomChips();

        // Tab switching mechanics (glider and morph)
        function updateGlider(tab) {
            const glider = document.getElementById('tab-glider');
            if (!glider || !tab) return;
            glider.style.width = tab.offsetWidth + 'px';
            glider.style.height = tab.offsetHeight + 'px';
            glider.style.transform = `translate(${tab.offsetLeft}px, ${tab.offsetTop}px)`;
        }

        // Tab switching logic with Morph Transition
        function switchTabTo(panelId) {
            const tab = document.querySelector(`.builder-tab[data-tab="${panelId}"]`);
            if (!tab || tab.classList.contains('active')) return;

            const targetPanel = document.querySelector(`.chip-panel[data-panel="${panelId}"]`);
            const currentPanel = document.querySelector('.chip-panel.active') || document.querySelector('.chip-panel[style*="display: flex"]');
            const panelsContainer = document.querySelector('.chip-panels');

            if (!targetPanel || !currentPanel || targetPanel === currentPanel) return;

            // Immediately update visual tab states
            document.querySelectorAll('.builder-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateGlider(tab);

            // Nuke any stranded ghost panels from interrupted rapid-clicking
            document.querySelectorAll('.chip-panel').forEach(p => {
                if (p !== currentPanel && p !== targetPanel) {
                    gsap.killTweensOf(p);
                    p.classList.remove('active');
                    p.style.cssText = '';
                }
            });

            // 1. Lock the container height
            const startHeight = panelsContainer.offsetHeight;
            panelsContainer.style.height = startHeight + 'px';

            // 2. Prepare target panel for measuring & crossfading
            targetPanel.style.display = 'flex';
            targetPanel.style.position = 'absolute';
            targetPanel.style.top = '0';
            targetPanel.style.left = '0';
            targetPanel.style.width = '100%';

            const endHeight = targetPanel.offsetHeight;

            // 3. Clear existing tweens and prep new panel
            gsap.killTweensOf([panelsContainer, currentPanel, targetPanel]);
            gsap.set(targetPanel, { opacity: 0, scale: 0.95, y: 15 });

            // 4. Animate container height morph
            gsap.to(panelsContainer, {
                height: endHeight,
                duration: 0.45,
                ease: 'power3.inOut',
                onComplete: () => {
                    panelsContainer.style.height = ''; // Let it auto-size again
                }
            });

            // 5. Morph out current panel
            gsap.to(currentPanel, {
                opacity: 0,
                scale: 0.95,
                y: -15,
                duration: 0.25,
                ease: 'power2.in',
                onComplete: () => {
                    currentPanel.classList.remove('active');
                    currentPanel.style.display = '';
                    currentPanel.style.opacity = '';
                    currentPanel.style.transform = '';

                    // Make target normal flow
                    targetPanel.style.position = '';
                    targetPanel.style.top = '';
                    targetPanel.style.left = '';
                    targetPanel.style.width = '';
                    targetPanel.classList.add('active');
                }
            });

            // 6. Morph in target panel
            gsap.to(targetPanel, {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.4,
                delay: 0.15,
                ease: 'back.out(1.5)',
                clearProps: 'transform' // clean up GSAP inline styles
            });
        }

        const builderTabsContainer = document.getElementById('builder-tabs');
        if (builderTabsContainer) {
            builderTabsContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.builder-tab');
                if (tab && tab.dataset.tab) {
                    switchTabTo(tab.dataset.tab);
                }
            });
        }

        // Initialize glider pos, waits briefly for fonts/layout
        setTimeout(() => {
            const activeTab = document.querySelector('.builder-tab.active');
            if (activeTab) updateGlider(activeTab);
        }, 150);

        // Responsive active tab glider
        window.addEventListener('resize', () => {
            const activeTab = document.querySelector('.builder-tab.active');
            if (activeTab) updateGlider(activeTab);
        });

        function createSparkles(e, chip) {
            const rect = chip.getBoundingClientRect();
            const cx = e.clientX || rect.left + rect.width / 2;
            const cy = e.clientY || rect.top + rect.height / 2;
            const colors = ['#EBD73F', '#FFFFFF', '#FFE877', '#FFC700', '#FFD93F'];
            const _isMobileSpark = window.innerWidth <= 900;

            // Reduce particle counts on mobile for performance
            const dotCount = _isMobileSpark ? 8 : 20;
            const starCount = _isMobileSpark ? 3 : 8;
            const streakCount = _isMobileSpark ? 2 : 5;

            // --- Wave 1: Dot particles ---
            for (let i = 0; i < dotCount; i++) {
                const p = document.createElement('div');
                const size = 4 + Math.random() * 7;
                p.style.cssText = `
                    position:fixed; left:${cx}px; top:${cy}px;
                    width:${size}px; height:${size}px;
                    background:${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius:50%; pointer-events:none; z-index:9999;
                    transform:translate(-50%,-50%);
                `;
                document.body.appendChild(p);
                const angle = Math.random() * Math.PI * 2;
                const dist = 40 + Math.random() * 80;
                gsap.to(p, {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist - (Math.random() * 30),
                    opacity: 0,
                    scale: 0.2 + Math.random() * 0.8,
                    duration: 0.5 + Math.random() * 0.5,
                    delay: Math.random() * 0.08,
                    ease: 'power3.out',
                    onComplete: () => p.remove()
                });
            }

            // --- Wave 2: Star / cross shapes ---
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.textContent = ['✦', '✧', '★', '✸', '✺'][Math.floor(Math.random() * 5)];
                const sz = 10 + Math.random() * 14;
                star.style.cssText = `
                    position:fixed; left:${cx}px; top:${cy}px;
                    font-size:${sz}px; line-height:1;
                    color:${colors[Math.floor(Math.random() * colors.length)]};
                    pointer-events:none; z-index:10000;
                    transform:translate(-50%,-50%);
                `;
                document.body.appendChild(star);
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 70;
                gsap.to(star, {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist - (20 + Math.random() * 30),
                    opacity: 0,
                    rotation: (Math.random() - 0.5) * 360,
                    scale: 0,
                    duration: 0.6 + Math.random() * 0.4,
                    delay: 0.04 + Math.random() * 0.1,
                    ease: 'power2.out',
                    onComplete: () => star.remove()
                });
            }

            // --- Wave 3: Shockwave ring ---
            const ring = document.createElement('div');
            ring.style.cssText = `
                position:fixed; left:${cx}px; top:${cy}px;
                width:10px; height:10px;
                border:2px solid #EBD73F;
                border-radius:50%; pointer-events:none; z-index:9998;
                transform:translate(-50%,-50%);
            `;
            document.body.appendChild(ring);
            gsap.to(ring, {
                width: 100, height: 100,
                opacity: 0,
                left: cx - 45, top: cy - 45,
                duration: 0.55,
                ease: 'power1.out',
                onComplete: () => ring.remove()
            });

            // --- Wave 4: Trailing streaks ---
            for (let i = 0; i < streakCount; i++) {
                const streak = document.createElement('div');
                const angle = Math.random() * Math.PI * 2;
                streak.style.cssText = `
                    position:fixed; left:${cx}px; top:${cy}px;
                    width:2px; height:${12 + Math.random() * 14}px;
                    background: linear-gradient(to bottom, #EBD73F, transparent);
                    pointer-events:none; z-index:9997;
                    transform-origin: top center;
                    transform: translate(-50%,-50%) rotate(${(angle * 180) / Math.PI}deg);
                `;
                document.body.appendChild(streak);
                const dist = 30 + Math.random() * 60;
                gsap.to(streak, {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    duration: 0.35 + Math.random() * 0.3,
                    ease: 'power2.out',
                    onComplete: () => streak.remove()
                });
            }
        }

        const chipPanelsContainer = document.querySelector('.chip-panels');
        if (chipPanelsContainer) {
            chipPanelsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.custom-chip-action')) return;
                const chip = e.target.closest('.custom-chip');
                if (!chip) return;
                const svc = chip.dataset.service;
                if (!svc) return;

                if (selectedServices.has(svc)) {
                    // --- DE-SELECT: Smooth Jelly Shake-off ---
                    gsap.killTweensOf(chip);
                    gsap.timeline()
                        .fromTo(chip,
                            { scaleX: 0.95, scaleY: 0.95 },
                            { scaleX: 1.2, scaleY: 0.8, duration: 0.12, ease: 'power2.out', force3D: true }
                        )
                        .to(chip, { scaleX: 0.85, scaleY: 1.15, duration: 0.12, ease: 'power2.inOut' })
                        .to(chip, { scaleX: 1.05, scaleY: 0.95, duration: 0.12, ease: 'power2.inOut' })
                        .to(chip, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });

                    selectedServices.delete(svc);
                    chip.classList.remove('selected');
                    document.querySelectorAll('.f-pill').forEach(p => {
                        if (p.textContent.replace(' ✓', '').trim() === svc) p.classList.remove('selected');
                    });
                } else {
                    // --- SELECT: Premium Lottie Jelly Bloop ---
                    createSparkles(e, chip);
                    chip.classList.add('selected');

                    gsap.killTweensOf(chip);
                    gsap.timeline()
                        .fromTo(chip,
                            { scaleX: 0.92, scaleY: 0.92 }, // Catch the button right as mouse un-clicks
                            { scaleX: 0.7, scaleY: 1.35, duration: 0.12, ease: 'power2.out', force3D: true }
                        )
                        .to(chip, { scaleX: 1.35, scaleY: 0.7, duration: 0.15, ease: 'power2.inOut' })
                        .to(chip, { scaleX: 0.85, scaleY: 1.15, duration: 0.12, ease: 'power2.inOut' })
                        .to(chip, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.5, 0.3)' });

                    selectedServices.set(svc, 1);
                    document.querySelectorAll('.f-pill').forEach(p => {
                        if (p.textContent.replace(' ✓', '').trim() === svc) p.classList.add('selected');
                    });
                }
                updateReceipt();
            });
        }

        // Wire floating pills directly using global dual action handler
        window.handlePillAction = function (e, pill) {
            const svc = pill.textContent.replace(' ✓', '').trim();
            if (selectedServices.has(svc)) {
                // --- DE-SELECT: Smooth Jelly Shake-off ---
                gsap.killTweensOf(pill);
                gsap.timeline()
                    .fromTo(pill,
                        { scaleX: 0.95, scaleY: 0.95 },
                        { scaleX: 1.2, scaleY: 0.8, duration: 0.12, ease: 'power2.out', force3D: true }
                    )
                    .to(pill, { scaleX: 0.85, scaleY: 1.15, duration: 0.12, ease: 'power2.inOut' })
                    .to(pill, { scaleX: 1.05, scaleY: 0.95, duration: 0.12, ease: 'power2.inOut' })
                    .to(pill, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });

                selectedServices.delete(svc);
                pill.classList.remove('selected');
                // Also deselect matching builder chip
                document.querySelectorAll('.custom-chip').forEach(c => {
                    if (c.dataset.service === svc) c.classList.remove('selected');
                });
            } else {
                // --- SELECT: Premium Lottie Jelly Bloop ---
                createSparkles(e, pill);
                pill.classList.add('selected');

                gsap.killTweensOf(pill);
                gsap.timeline()
                    .fromTo(pill,
                        { scaleX: 0.92, scaleY: 0.92 },
                        { scaleX: 0.7, scaleY: 1.35, duration: 0.12, ease: 'power2.out', force3D: true }
                    )
                    .to(pill, { scaleX: 1.35, scaleY: 0.7, duration: 0.15, ease: 'power2.inOut' })
                    .to(pill, { scaleX: 0.85, scaleY: 1.15, duration: 0.12, ease: 'power2.inOut' })
                    .to(pill, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.5, 0.3)' });

                selectedServices.set(svc, 1);
                // Also select matching builder chip and switch to its tab
                document.querySelectorAll('.custom-chip').forEach(c => {
                    if (c.dataset.service === svc) {
                        c.classList.add('selected');
                        // Activate the parent tab with smooth morph
                        const panel = c.closest('.chip-panel');
                        if (panel) {
                            switchTabTo(panel.dataset.panel);
                        }
                    }
                });
                // First-time "Tour" smooth scroll to cart and back
                const builder = document.getElementById('custom-builder');
                const cloud = document.getElementById('floating-cloud');

                if (builder && !hasAutoScrolledToCart) {
                    hasAutoScrolledToCart = true;
                    setTimeout(() => {
                        const target = window.innerWidth <= 900 ? document.querySelector('.builder-right') : builder;
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }

                        // Return to cloud after 0.5s pause (800ms total allows for downward scroll)
                        setTimeout(() => {
                            if (cloud) cloud.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 1000);
                    }, 200);
                }
            }
            updateReceipt();
        };

        // Initialize receipt date
        const receiptDate = document.getElementById('receipt-date');
        if (receiptDate) {
            const today = new Date();
            receiptDate.innerText = today.toISOString().split('T')[0];
        }
        // --- MODAL & API LOGIC ---
        const API_URL = 'http://localhost:5001/api';

        // Elements
        const contactModal = document.getElementById('contact-modal');
        const communityModal = document.getElementById('community-modal');
        const contactForm = document.getElementById('contact-form');
        const communityForm = document.getElementById('community-form');
        const contactSubmit = document.getElementById('contact-submit');
        const communitySubmit = document.getElementById('community-submit');
        const contactServicesList = document.getElementById('contact-services-list');

        window.openContactModal = function (e, fromCart = false) {
            if (e) e.preventDefault();
            contactModal.classList.add('active');

            // Populate services from cart if applicable
            contactServicesList.innerHTML = '';
            contactForm.services.value = '{}'; // reset hidden field

            if (fromCart && selectedServices.size > 0) {
                const servicesObj = Object.fromEntries(selectedServices);
                contactForm.services.value = JSON.stringify(servicesObj);

                selectedServices.forEach((qty, name) => {
                    const isCustom = customServicesSet.has(name);
                    const badge = document.createElement('div');
                    badge.className = 'selected-svc-badge';
                    badge.innerText = `${name}${isCustom ? ' [Custom]' : ''} (x${qty})`;
                    contactServicesList.appendChild(badge);
                });
            }
        }

        window.closeContactModal = function () {
            contactModal.classList.remove('active');
            const dropdownWrap = document.getElementById('scope-dropdown-wrap');
            if (dropdownWrap) dropdownWrap.classList.remove('open');
            // reset form out of view
            setTimeout(() => contactForm.reset(), 400);
        }

        window.openCommunityModal = function (e) {
            if (e) e.preventDefault();
            communityModal.classList.add('active');
        }

        window.closeCommunityModal = function () {
            communityModal.classList.remove('active');
            setTimeout(() => communityForm.reset(), 400);
        }

        // Close on escape or outside click
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeContactModal();
                closeCommunityModal();
                const dropdownWrap = document.getElementById('scope-dropdown-wrap');
                if (dropdownWrap) dropdownWrap.classList.remove('open');
            }
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', (e) => {
            const dropdownWrap = document.getElementById('scope-dropdown-wrap');
            if (dropdownWrap && !dropdownWrap.contains(e.target)) {
                dropdownWrap.classList.remove('open');
            }
        });

        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeContactModal();
                    closeCommunityModal();
                }
            });
        });

        // Submit Logic
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            contactSubmit.classList.add('loading');

            const payload = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                message: contactForm.message.value,
                services: JSON.parse(contactForm.services.value || '{}')
            };

            try {
                const res = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    contactSubmit.innerText = 'Sent ✓';
                    contactSubmit.style.background = '#4CAF50';
                    contactSubmit.style.color = '#fff';
                    setTimeout(() => {
                        closeContactModal();
                        setTimeout(() => {
                            contactSubmit.innerText = 'Send Message';
                            contactSubmit.style = '';
                            contactSubmit.classList.remove('loading');
                        }, 500);
                    }, 1500);
                } else {
                    customAlert("Something went wrong. Please try again.");
                    contactSubmit.classList.remove('loading');
                }
            } catch (err) {
                customAlert("Failed to connect to the server.");
                contactSubmit.classList.remove('loading');
            }
        });

        communityForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = communityForm.email.value.trim();
            const whatsapp = communityForm.whatsapp ? communityForm.whatsapp.value.trim() : '';
            const expertise = communityForm.expertise ? communityForm.expertise.value.trim() : '';

            if (!email) return;

            const btnText = communitySubmit.querySelector('.modal-btn-text');
            const sparkle = communitySubmit.querySelector('.modal-sparkle');
            if (btnText) btnText.innerText = 'Securing Your Invite...';
            if (sparkle) sparkle.style.display = 'none';
            communitySubmit.style.background = 'linear-gradient(135deg, #ebd73f 0%, #d4af37 100%)';
            communitySubmit.disabled = true;

            try {
                // Post to API route
                await fetch('/api/community', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, whatsapp, expertise })
                }).catch(() => {});
            } catch (err) {}

            if (btnText) btnText.innerText = 'Invite Confirmed ✓';
            communitySubmit.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
            communitySubmit.style.color = '#fff';

            setTimeout(() => {
                closeCommunityModal();
                setTimeout(() => {
                    if (btnText) btnText.innerText = 'Request Access & Join';
                    if (sparkle) sparkle.style.display = '';
                    communitySubmit.style.background = '';
                    communitySubmit.style.color = '';
                    communitySubmit.disabled = false;
                }, 500);
                window.location.href = 'https://chat.whatsapp.com/CEyxprdFx99E8eNrFoIIxP';
            }, 900);
        });
        // --- FOUNDER SEQUENCE CANVAS LOGIC ---
        // --- FOUNDER SEQUENCE LOGIC ---
        const fCard = document.getElementById("founder-3d-card");
        const fWrap = document.getElementById("founder-card-wrap");

        if (fCard && fWrap) {
            // Dynamic Scroll Theming (Smooth, responsive Light Mode transition)
            ScrollTrigger.create({
                trigger: ".founder-sequence-section",
                start: "top 50%",
                end: "bottom 50%",
                onEnter: () => {
                    document.body.classList.add('light-theme');
                    if (navbar) {
                        navbar.style.background = '';
                        navbar.style.boxShadow = '';
                    }
                },
                onLeave: () => {
                    if (document.body.dataset.manualTheme !== 'light') {
                        document.body.classList.remove('light-theme');
                    }
                    if (navbar) {
                        navbar.style.background = '';
                        navbar.style.boxShadow = '';
                    }
                },
                onEnterBack: () => {
                    document.body.classList.add('light-theme');
                    if (navbar) {
                        navbar.style.background = '';
                        navbar.style.boxShadow = '';
                    }
                },
                onLeaveBack: () => {
                    if (document.body.dataset.manualTheme !== 'light') {
                        document.body.classList.remove('light-theme');
                    }
                    if (navbar) {
                        navbar.style.background = '';
                        navbar.style.boxShadow = '';
                    }
                }
            });

            // Kinetic Text Splitting
            const bios = document.querySelectorAll('.founder-bio');
            const allWords = [];
            bios.forEach(bio => {
                const words = bio.innerText.trim().split(/\s+/);
                bio.innerHTML = ''; // Clear existing
                words.forEach(word => {
                    const span = document.createElement('span');
                    span.innerText = word + ' ';
                    bio.appendChild(span);
                    allWords.push(span);
                });
            });

            // Entry Animation
            gsap.fromTo(".founder-label, .founder-accent, .founder-heading",
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".founder-sequence-section", start: "top 70%" } }
            );

            gsap.to(fWrap, {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                ease: "expo.out",
                scrollTrigger: { trigger: ".founder-sequence-section", start: "top 70%" }
            });

            // Kinetic Typography Reveal tied to scroll
            gsap.to(allWords, {
                opacity: 1,
                stagger: 0.05,
                scrollTrigger: {
                    trigger: ".founder-sequence-section",
                    start: "top 60%",
                    end: "center center",
                    scrub: 1
                }
            });

            // META Parallax
            gsap.to("#founder-meta-bg", {
                x: "-150vw", // Scroll to left faster
                ease: "none",
                scrollTrigger: {
                    trigger: ".founder-sequence-section",
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true
                }
            });

            // 3D Interactivity / Parallax Tilt
            fWrap.addEventListener('mousemove', (e) => {
                const rect = fWrap.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Calculate rotation based on cursor position (-20 to 20 degrees)
                const xRotation = ((y / rect.height) - 0.5) * -40;
                const yRotation = ((x / rect.width) - 0.5) * 40;

                fCard.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            fWrap.addEventListener('mouseleave', () => {
                fCard.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
        }

        // MAZE GAME FADE OUT AFTER LIVE CLOCK
        ScrollTrigger.create({
            trigger: ".services-section",
            start: "top bottom",
            onEnter: () => {
                gsap.to("#maze-canvas", { opacity: 0, duration: 0.8 });
                if (window.mazeGameInstance) window.mazeGameInstance.isVisible = false;
            },
            onLeaveBack: () => {
                gsap.to("#maze-canvas", { opacity: 1, duration: 0.8 });
                if (window.mazeGameInstance) {
                    window.mazeGameInstance.isVisible = true;
                    if (!window.mazeGameInstance.isAnimating) {
                        window.mazeGameInstance.isAnimating = true;
                        window.mazeGameInstance.animate();
                    }
                }
            }
        });


    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>

      <div>
  {/* --- PRELOADER --- */}
  <Preloader />
  {/* --- NAVBAR --- */}
  <nav className="navbar" id="navbar">
    <div className="nav-logo">
      <a href="#">DRIPP</a>
    </div>
    <ul className="nav-links">
      <li><a href="#work" className="nav-link">Work</a></li>
      <li><a href="#services" className="nav-link">Services</a></li>
      <li><a href="#founder-pin-section" className="nav-link">About</a></li>
      <li style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div className="c-nav-group">
          <a href="#community" className="c-nav-btn c-community" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `document.getElementById('community').scrollIntoView({behavior: 'smooth'})`, target: event.currentTarget, originalEvent: event } }))}>
            <span className="c-txt-wrap"><span className="c-txt" data-text="Community">Community</span></span>
          </a>
          <a href="#contact" className="c-nav-btn c-talk" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `document.getElementById('contact').scrollIntoView({behavior: 'smooth'})`, target: event.currentTarget, originalEvent: event } }))}>
            <span className="c-btn-shimmer" />
            <span className="c-txt-wrap"><span className="c-txt" data-text="Let's Talk">Let's Talk</span></span>
            <span className="c-action-disc">
              <svg className="c-arrow-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H8M17 7V16" />
              </svg>
            </span>
          </a>
        </div>
        
        <div className="theme-switch-wrapper">
          <button id="theme-switch" className="theme-switch-btn" aria-label="Toggle Theme">
            <div className="ts-inner">
              <svg className="ts-icon ts-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx={12} cy={12} r={4} />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            </div>
          </button>
        </div>
        
        <div>
          <ProfileWidget onLoginClick={() => setShowAuthModal(true)} hideShareScore={true} />
        </div>
      </li>
    </ul>
    <div className="hamburger" id="hamburger">
      <div className="line1" />
      <div className="line2" />
      <div className="line3" />
    </div>
  </nav>
  <div className="cursor" />
  <canvas id="trail-canvas" />
  <div className="velocity-gauge">
    <div className="gauge-label">SYS.VEL</div>
    <div className="velocity-fill" />
  </div>
  <div className="scroll-prompt">
    <div className="scroll-text">Keep Scrolling</div>
    <div className="scroll-line" />
  </div>
  <canvas id="maze-canvas" />
  <section className="hero" id="home">
    <div className="hero-center-column">
      <h1 className="brand-name">
        <span className="word" id="word1">DRIPP</span>
        <span className="word" id="word2">MEDIA</span>
      </h1>
      <div className="hero-sub tooltip-container">
        We are a creative agency
        <div className="creative-tooltip">
          <div className="tooltip-sparkle s1" />
          <div className="tooltip-sparkle s2" />
          <div className="tooltip-sparkle s3" />
          Think of us as a team of artists, builders, and storytellers who make cool things for the internet and
          beyond!
        </div>
      </div>

      {/* HERO DUAL CTAs */}
      <div className="hero-cta-group">
        <a 
          href="#services" 
          className="hero-btn hero-btn-primary" 
          onClick={(e) => { 
            e.preventDefault(); 
            document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); 
          }}
        >
          <span className="btn-shimmer" />
          <span className="btn-label-group">
            <span className="btn-sparkle">✦</span>
            <span className="btn-main-text">Get Instant Quote</span>
          </span>
          <span className="btn-icon-capsule">
            <svg className="btn-arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H8M17 7V16" />
            </svg>
          </span>
        </a>

        <a 
          href="#work" 
          className="hero-btn hero-btn-secondary" 
          onClick={(e) => { 
            e.preventDefault(); 
            document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); 
          }}
        >
          <span className="sec-btn-shimmer" />
          <div className="studio-deck-glyph">
            <span className="deck-layer l1" />
            <span className="deck-layer l2" />
            <span className="deck-layer l3">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
              </svg>
            </span>
          </div>
          <span className="btn-main-text">Explore Portfolio</span>
          <span className="btn-disciplines-badge">Video · Art · Web</span>
        </a>
      </div>
    </div>

    {/* METRIC TRUST BAR */}
    <div className="hero-trust-bar">
      <div className="trust-item">
        <span className="trust-num">50M+</span>
        <span className="trust-label">Organic Views</span>
      </div>
      <span className="trust-divider">✦</span>
      <div className="trust-item">
        <span className="trust-num">100+</span>
        <span className="trust-label">Brands Scaled</span>
      </div>
      <span className="trust-divider">✦</span>
      <div className="trust-item">
        <span className="trust-num">2-3 Wks</span>
        <span className="trust-label">Rapid Delivery</span>
      </div>
      <span className="trust-divider">✦</span>
      <div className="trust-item">
        <span className="trust-num">Top 1%</span>
        <span className="trust-label">Design Standard</span>
      </div>
    </div>
  </section>
  {/* --- MODERN CREATIVE CARDS SECTION --- */}
  <section className="portfolio" id="work">
    <div className="portfolio-title-container">
      <h2 className="cards-title">The <span>Aces</span> Your Brand Needs to Play.</h2>
    </div>
    <div className="cards-container">
      {/* CARD 1 */}
      <div className="card-wrapper locked" id="card1">
        <div className="card-inner">
          <div className="face face-front">
            <div className="face-bg">
              <div className="card-grid" />
              <div className="card-ambient-glow glow-video" />
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 01 / EDIT &amp; SHOOT
                </span>
              </div>

              {/* Client-First Cinema Master Mockup */}
              <div className="card-mockup card-mockup-cinema">
                <div className="cinema-hud-top">
                  <div className="rec-status">
                    <span className="rec-dot-pulse" />
                    <span className="rec-label">4K MASTER</span>
                  </div>
                  <span className="rec-timecode">0:24 / 0:30</span>
                </div>
                <div className="cinema-center-preview">
                  <div className="cinema-play-disc">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </div>
                  <div className="cinema-retention-pill">
                    <span className="retention-label">RETENTION RATE</span>
                    <span className="retention-val">98.4%</span>
                  </div>
                </div>
                <div className="cinema-timeline-clean">
                  <div className="clean-track">
                    <div className="clean-fill" />
                  </div>
                  <div className="cinema-funnel-steps">
                    <span>HOOK</span>
                    <span className="step-sep">✦</span>
                    <span>STORY</span>
                    <span className="step-sep">✦</span>
                    <span>CONVERT</span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <h2>Video<br /><span>Production</span></h2>
                <p className="front-desc">High-end video editing and professional shooting to capture your brand's essence.</p>
                <div className="card-trust-row">
                  <span className="trust-pill">High Retention</span>
                  <span className="trust-pill">Viral Ad Hooks</span>
                  <span className="trust-pill">Cinema 4K</span>
                </div>
              </div>
            </div>
          </div>
          <div className="face face-back">
            <div className="face-bg">
              <div className="back-pattern" />
              <div className="large-number">01</div>
            </div>
            <div className="back-content">
              <div className="back-header">
                <div className="back-title">The Cut</div>
              </div>
              <p className="back-text">We handle the entire production pipeline to engineer captivating visual dopamine.</p>
              <div className="card-back-highlights">
                <span className="highlight-chip">4K Cinema</span>
                <span className="highlight-chip">Sound FX</span>
                <span className="highlight-chip">Viral Hooks</span>
              </div>
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/video-portfolio" className="card-launch-btn">
                  <span className="card-btn-shimmer" />
                  <span className="card-btn-icon">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </span>
                  <span className="card-btn-text">View Video Reel</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* CARD 2 */}
      <div className="card-wrapper locked" id="card2">
        <div className="card-inner">
          <div className="face face-front">
            <div className="face-bg">
              <div className="card-grid" />
              <div className="card-ambient-glow glow-graphics" />
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 02 / GRAPHICS
                </span>
              </div>

              {/* Client-First Brand Identity Mockup */}
              <div className="card-mockup card-mockup-graphics">
                <div className="brand-canvas-top">
                  <span className="brand-suite-label">BRAND IDENTITY</span>
                  <div className="brand-palette-dots">
                    <span className="palette-dot dot-gold" />
                    <span className="palette-dot dot-white" />
                    <span className="palette-dot dot-dark" />
                  </div>
                </div>
                <div className="brand-preview-frame">
                  <div className="brand-showcase-card">
                    <div className="showcase-top">
                      <span className="showcase-badge">SIGNATURE SUITE</span>
                      <span className="showcase-star">✦</span>
                    </div>
                    <div className="showcase-title">STAND OUT.</div>
                    <div className="showcase-sub">BESPOKE · PREMIUM · UNIQUE</div>
                  </div>
                  <div className="brand-status-chip">
                    <span className="chip-dot" />
                    <span>FEED READY</span>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <h2>Graphic<br /><span style={{fontSize: '1.55rem'}}>Designing</span></h2>
                <p className="front-desc">Visual identities that melt faces. Bold typography &amp; surreal art.
                </p>
                <div className="card-trust-row">
                  <span className="trust-pill">Brand Identity</span>
                  <span className="trust-pill">Ad Creatives</span>
                  <span className="trust-pill">Social Media Kits</span>
                </div>
              </div>
            </div>
          </div>
          <div className="face face-back">
            <div className="face-bg">
              <div className="back-pattern" />
              <div className="large-number">02</div>
            </div>
            <div className="back-content">
              <div className="back-header">
                <div className="back-title">The Aesthetic</div>
              </div>
              <p className="back-text">Scalable design systems that work seamlessly from Instagram stories to billboards.</p>
              <div className="card-back-highlights">
                <span className="highlight-chip">Brand Identity</span>
                <span className="highlight-chip">3D Posters</span>
                <span className="highlight-chip">Social Kits</span>
              </div>
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/graphic-portfolio" className="card-launch-btn">
                  <span className="card-btn-shimmer" />
                  <span className="card-btn-icon">✦</span>
                  <span className="card-btn-text">View Design Gallery</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* CARD 3 */}
      <div className="card-wrapper locked" id="card3">
        <div className="card-inner">
          <div className="face face-front">
            <div className="face-bg">
              <div className="card-grid" />
              <div className="card-ambient-glow glow-web" />
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 03 / WEB DEV
                </span>
              </div>

              {/* Client-First High-Converting Web Mockup */}
              <div className="card-mockup card-mockup-web">
                <div className="browser-window-bar">
                  <div className="browser-dots">
                    <span className="b-dot b-red" />
                    <span className="b-dot b-yellow" />
                    <span className="b-dot b-green" />
                  </div>
                  <div className="browser-url-pill">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4}}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>yourbrand.com</span>
                  </div>
                </div>
                <div className="web-preview-canvas">
                  <div className="web-mini-preview">
                    <div className="web-hero-stripe" />
                    <div className="web-cta-pill">
                      <span>GET STARTED</span>
                      <span className="cta-arr">→</span>
                    </div>
                  </div>
                  <div className="perf-meter-badge">
                    <div className="perf-ring-circle">
                      <svg width="26" height="26" viewBox="0 0 36 36">
                        <path className="perf-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(74, 222, 128, 0.2)" strokeWidth="3" />
                        <path className="perf-ring-fill" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4ade80" strokeWidth="3" />
                      </svg>
                      <span className="perf-score">100</span>
                    </div>
                    <div className="perf-labels">
                      <span className="perf-status">BLAZING FAST</span>
                      <span className="perf-metric">0.3s LOAD · 60 FPS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <h2>Website<br /><span>Development</span></h2>
                <p className="front-desc">Immersive, high-performance websites optimized for the algorithm.
                </p>
                <div className="card-trust-row">
                  <span className="trust-pill">Blazing Fast</span>
                  <span className="trust-pill">Mobile Responsive</span>
                  <span className="trust-pill">Built to Convert</span>
                </div>
              </div>
            </div>
          </div>
          <div className="face face-back">
            <div className="face-bg">
              <div className="back-pattern" />
              <div className="large-number">03</div>
            </div>
            <div className="back-content">
              <div className="back-header">
                <div className="back-title">The Code</div>
              </div>
              <p className="back-text">From robust architecture to surreal animations, we build digital homes.
              </p>
              <div className="card-back-highlights">
                <span className="highlight-chip">Next.js</span>
                <span className="highlight-chip">GSAP Motion</span>
                <span className="highlight-chip">99+ Perf</span>
              </div>
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/web-portfolio" className="card-launch-btn">
                  <span className="card-btn-shimmer" />
                  <span className="card-btn-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="7 8 3 12 7 16" />
                      <polyline points="17 8 21 12 17 16" />
                      <line x1="14" y1="4" x2="10" y2="20" />
                    </svg>
                  </span>
                  <span className="card-btn-text">Explore Web Builds</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* --- LIVE CLOCK --- */}
  <section className="live-clock-section">
    <div className="clock-content">
      <div className="clock-wrapper">
        <div className="clock-time">
          <span id="clock-hours" className="clock-num">00</span>
          <span className="clock-colon">:</span>
          <span id="clock-minutes" className="clock-num">00</span>
        </div>
        <div className="clock-dial">
          <svg viewBox="0 0 120 120">
            <circle className="dial-bg" cx={60} cy={60} r={54} />
            <circle className="dial-progress" id="dial-progress" cx={60} cy={60} r={54} />
          </svg>
          <div className="dial-seconds">
            <div id="sec-tens" className="digit-col" />
            <div id="sec-ones" className="digit-col" />
          </div>
        </div>
      </div>
      <span className="clock-label">Art takes time. We make it count.</span>
    </div>
  </section>
  {/* --- SERVICES --- */}
  <section id="services" className="services-section">
    <div className="services-container">
      <div className="service-header">
        <span className="section-label">03.5 / SERVICES</span>
        <h2 className="section-title">What We Do</h2>
        <p className="service-intro">Click any service that interests you - it'll be added to your quote below.</p>
      </div>
      {/* Floating Services Cloud */}
      <div className="floating-services-cloud" id="floating-cloud">
        {servicesCategories.flatMap(cat =>
          (cat.services || []).map(svc => {
            const name = typeof svc === 'string' ? svc : svc.name;
            const key = (typeof svc === 'object' && svc.id) ? svc.id : `${cat.id}-${name}`;
            return (
              <span key={key} className="f-pill" style={{ fontFamily: "'Clash Display', sans-serif" }}>
                {name}
              </span>
            );
          })
        )}
      </div>
      <p className="cloud-hint">↑ Drag to play &amp; sort. Double-tap to add.</p>
      {/* Custom Package Builder (Receipt Builder) */}
      <div className="builder-container" id="custom-builder">
        <div className="builder-left">
          <div>
            <span className="section-label">BUILD YOUR OWN</span>
            <h3 className="builder-title">Customise Your Package</h3>
            <p className="builder-sub">Browse by category and select the exact services you need. Your quote
              builds automatically.</p>
          </div>
          {/* Category Tabs */}
          <div className="builder-tabs" id="builder-tabs">
            <div className="tab-glider" id="tab-glider" />
            {servicesCategories.map((cat, idx) => (
              <button 
                key={cat.id} 
                className={`builder-tab ${idx === 0 ? 'active' : ''}`} 
                data-tab={cat.id}
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                {cat.name}
              </button>
            ))}
          </div>
          {/* Chip Panels */}
          <div className="chip-scroll">
            <div className="chip-panels">
              {servicesCategories.map((cat, idx) => (
                <div 
                  key={cat.id} 
                  className={`chip-panel ${idx === 0 ? 'active' : ''}`} 
                  data-panel={cat.id}
                >
                  {(cat.services || []).map(svc => {
                    const name = typeof svc === 'string' ? svc : svc.name;
                    const key = (typeof svc === 'object' && svc.id) ? svc.id : `${cat.id}-${name}`;
                    return (
                      <div 
                        key={key} 
                        className="custom-chip" 
                        data-service={name}
                        style={{ fontFamily: "'Clash Display', sans-serif" }}
                      >
                        {name}
                      </div>
                    );
                  })}
                  <div 
                    className="custom-chip custom-chip-action" 
                    data-action="write-custom"
                    style={{ fontFamily: "'Clash Display', sans-serif" }}
                    onClick={() => {
                      const input = document.getElementById('custom-service-input');
                      if (input) {
                        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        input.focus();
                        input.classList.add('pulse-glow');
                        setTimeout(() => input.classList.remove('pulse-glow'), 1200);
                      }
                    }}
                  >
                    ✦ Write Custom Service
                  </div>
                </div>
              ))}
            </div>{/* /chip-panels */}
          </div>{/* /chip-scroll */}
          {/* Custom Service Creator */}
          <div className="custom-service-creator">
            <div className="custom-service-creator-top">
              <span className="custom-service-sparkle">✦</span>
              <span className="custom-service-creator-label">Can't find your service?</span>
              <span className="custom-service-creator-hint">Write any custom service &amp; add to cart</span>
            </div>
            <div className="custom-service-input-row">
              <div className="custom-service-input-wrap">
                <input 
                  type="text" 
                  id="custom-service-input" 
                  className="custom-service-input" 
                  placeholder="e.g. Drone Cinematography, 3D Billboard, Multilingual Subtitles..." 
                  maxLength={70}
                  autoComplete="off"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                />
              </div>
              <button 
                type="button" 
                id="custom-service-add-btn" 
                className="custom-service-add-btn"
                style={{ fontFamily: "'Panchang', sans-serif" }}
              >
                <span>+ Add to Cart</span>
              </button>
            </div>
            <div 
              id="custom-service-error" 
              className="custom-service-error" 
              style={{ display: 'none' }}
            >
              <span className="custom-service-creative-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drip-mascot-svg">
                  <defs>
                    <linearGradient id="dripErrorGradOrig" x1="5" y1="2" x2="19" y2="23" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ff3366" />
                      <stop offset="100%" stopColor="#ff6b8b" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.5C12 2.5 5.5 10.5 5.5 15.5C5.5 19.366 8.41 22.5 12 22.5C15.59 22.5 18.5 19.366 18.5 15.5C18.5 10.5 12 2.5 12 2.5Z" fill="url(#dripErrorGradOrig)" />
                  <path d="M8.2 12.5C8.2 10.2 9.6 8.2 10.8 7.2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="9.6" cy="14.8" r="1.1" fill="#FFFFFF" />
                  <path d="M13.2 15C13.8 14.1 15.2 14.1 15.8 15" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" fill="none" className="drip-wink-eye" />
                  <path d="M11 17.6C11.8 18.4 13.2 18.4 14 17.6" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              <span id="custom-service-error-text" className="custom-service-error-text" style={{ fontFamily: "'Clash Display', sans-serif" }}>masti mat karo yaar.</span>
            </div>
            <div id="custom-services-added-list" className="custom-services-added-list" style={{ display: 'none' }}></div>
          </div>
        </div>
        <div className="builder-right">
          <div className="receipt-header">
            <div className="receipt-title">Est. Cart</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button id="clear-cart-btn" style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255, 60, 60, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'none', fontFamily: "'Clash Display', sans-serif" }} onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `clearCart()`, target: event.currentTarget, originalEvent: event } }))}>Clear All</button>
              <div className="receipt-date" id="receipt-date">YYYY-MM-DD</div>
            </div>
          </div>
          <div className="receipt-items" id="receipt-items">
            <div className="empty-receipt">No services selected...</div>
          </div>
          <div className="receipt-footer">
            <a href="#" className="custom-quote-btn" id="custom-quote-btn" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `openContactModal(event, true)`, target: event.currentTarget, originalEvent: event } }))}>
              <span className="quote-btn-shimmer" />
              <div className="quote-btn-label">
                <span className="quote-sparkle">✦</span>
                <span className="quote-btn-text">Request Custom Quote</span>
              </div>
              <div className="quote-action-disc">
                <svg className="quote-arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </a>
            <a href="#" className="whatsapp-scope-btn" id="whatsapp-scope-btn" onClick={(e) => {
              e.preventDefault();
              const services = Array.from(window.__selectedServices ? window.__selectedServices.entries() : []).map(([name, qty]) => {
                const isCustom = window.__customServicesSet && window.__customServicesSet.has(name);
                return `${name}${isCustom ? ' (Custom)' : ''}${qty > 1 ? ` (x${qty})` : ''}`;
              });
              const text = services.length > 0
                ? `Hey Dripp Media! I selected these services on your builder: ${services.join(', ')}. Can you share scope and pricing?`
                : `Hey Dripp Media! I want to discuss a new creative project with your team.`;
              window.open(`https://wa.me/917300595147?text=${encodeURIComponent(text)}`, '_blank');
            }}>
              <span className="wa-shimmer-sweep" />
              <div className="wa-beacon-pod">
                <span className="wa-radar-ring" />
                <span className="wa-live-dot" />
                <svg className="wa-glyph" width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </div>
              <div className="wa-content-stack">
                <span className="wa-title">Instant WhatsApp Scope</span>
                <span className="wa-sub-badge">
                  <span className="wa-sub-ping" />
                  Fast 1-On-1 Connect · 5-Min Reply
                </span>
              </div>
              <div className="wa-action-disc">
                <svg className="wa-arrow-glyph" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
  {/* FOUNDER SEQUENCE SECTION (outside info-container to prevent z-index overlap) */}
  {/* FOUNDER SEQUENCE SECTION */}
  <section className="founder-sequence-section" id="founder-pin-section">
    <div className="founder-bg-text-meta" id="founder-meta-bg">META</div>
    <div className="founder-wrapper">
      <div className="founder-text-block" id="founder-text-block">
        <span className="founder-label">04 / THE VISION</span>
        <div className="founder-accent" />
        <h2 className="founder-heading">Meet the<span>Founder.</span></h2>
        <p className="founder-bio">
          I am Gurpreet, often known as Meta Gurpreet. At 18, I stepped away from formal education to learn
          and build something that actually dictates digital culture rather than just participating in it.
          While my title is Founder and CEO of Dripp Media, my foundation is behind the screen. I am, at my
          core, a visual artist, a video editor, web designer and graphic designer obsessed with the
          mechanics of attention.
        </p>
        <p className="founder-bio">
          I built this agency because I understood that premium aesthetics are entirely useless if they do not
          drive retention and conversion. I do not just oversee operations, I set the visual standard. I took
          the unconventional path so Dripp Media could deliver unconventional, high impact results. We don't
          do ordinary. We engineer content that commands the room.
        </p>
        <div className="founder-badges-group">
          <div className="founder-badge-pill">
            <span className="founder-pill-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </span>
            <span className="founder-pill-text">Hands-On Creative Director</span>
          </div>
          <div className="founder-badge-pill">
            <span className="founder-pill-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
              </svg>
            </span>
            <span className="founder-pill-text">Direct Founder Line</span>
          </div>
          <div className="founder-badge-pill">
            <span className="founder-pill-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </span>
            <span className="founder-pill-text">100% Quality Standard</span>
          </div>
        </div>
        <div>
          <a 
            href="https://wa.me/917818995147?text=Hey%20Gurpreet!%20I'm%20reaching%20out%20from%20the%20website%20to%20discuss%20a%20flagship%20project." 
            target="_blank" 
            rel="noopener noreferrer" 
            className="founder-direct-btn"
          >
            <span className="founder-btn-shimmer" />
            <div className="founder-btn-label">
              <span className="founder-sparkle">✦</span>
              <span className="founder-btn-text">Talk to Gurpreet on WhatsApp</span>
            </div>
            <div className="founder-action-disc">
              <svg className="founder-arrow-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H8M17 7V16" />
              </svg>
            </div>
          </a>
        </div>
      </div>
      <div className="founder-card-wrap" id="founder-card-wrap">
        <div className="founder-3d-card" id="founder-3d-card">
          <div className="core-glow" />
          <div className="god-rays" />
          <img id="founder-image" src="/Founder Image/Founder image transparent.png" alt="Meta Gurpreet - Founder" />
        </div>
      </div>
    </div>
  </section>

  {/* --- FREQUENTLY ASKED QUESTIONS --- */}
  <section className="faq-section" id="faq">
    <div className="faq-glow-backdrop" />
    <div className="faq-container">
      <div className="faq-header">
        <span className="section-label">05 / CLARITY &amp; PROCESS</span>
        <h2 className="faq-title">Frequently Asked <span>Questions.</span></h2>
        <p className="faq-sub">Everything you need to know about our workflow, turnaround speed, revisions, and execution standards.</p>
      </div>

      <div className="faq-list">
        {[
          {
            id: '01',
            tag: 'Delivery Timelines',
            q: 'How fast is your turnaround time?',
            a: 'Full custom web platforms are typically delivered within 2–3 weeks. Video editing sprints and graphic design packages range from 24 to 72 hours per asset with live staging previews.',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            metric: '24–72h Sprints · 2–3 Wk Flagship Drops'
          },
          {
            id: '02',
            tag: 'Revision Guarantee',
            q: 'What is your revision guarantee?',
            a: 'We iterate with you until you are 100% satisfied. We provide private review links with frame-by-frame and pixel-accurate feedback tools so changes happen in hours, not days.',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            ),
            metric: '100% Standard · Frame-Accurate Feedback'
          },
          {
            id: '03',
            tag: 'Direct Communication',
            q: 'How does day-to-day communication work?',
            a: 'You get a dedicated, private Slack or WhatsApp war room with direct access to our core creative and engineering team, ensuring zero middlemen, instant voice notes, and rapid replies.',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
            metric: 'Private Slack / WhatsApp War Room'
          },
          {
            id: '04',
            tag: 'End-To-End Execution',
            q: 'Do you handle end-to-end production?',
            a: 'Yes. From initial storyboarding, scripting, 3D rendering, and 4K cinema color-grading to full-stack Next.js web deployment and performance optimization—everything is crafted under one roof.',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
              </svg>
            ),
            metric: '3D Render → Next.js Web Deployment'
          },
          {
            id: '05',
            tag: 'Modern Tech Stack',
            q: 'What technologies power your web builds?',
            a: 'For web: Next.js, React, GSAP Motion, Three.js, Tailwind CSS, Supabase & WebGL. For video & design: Adobe Premiere Pro, After Effects, DaVinci Resolve, Figma, and Blender 3D for unmatched visual fidelity.',
            icon: (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            ),
            metric: 'Next.js · GSAP · Three.js · Blender 3D'
          }
        ].map((item, idx) => (
          <div 
            key={idx} 
            className={`faq-item ${idx === 0 ? 'active' : ''}`}
            onClick={(e) => {
              const current = e.currentTarget;
              const isAlreadyActive = current.classList.contains('active');
              // Only 1 open at a time (accordion logic)
              document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
              if (!isAlreadyActive) {
                current.classList.add('active');
              }
            }}
          >
            <div className="faq-question-wrap">
              <div className="faq-question-left">
                <span className="faq-index-tag">
                  <span className="faq-num-val">{item.id}</span>
                  <span className="faq-num-sparkle">✦</span>
                </span>
                <span className="faq-category-badge">{item.tag}</span>
                <h3 className="faq-question-text">{item.q}</h3>
              </div>
              <div className="faq-action-disc">
                <svg className="faq-icon-cross" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
            <div className="faq-answer-grid">
              <div className="faq-answer-inner">
                <div className="faq-answer-body">
                  <p className="faq-answer-text">{item.a}</p>
                  <span className="faq-metric-tag">
                    <span className="faq-metric-icon">{item.icon}</span>
                    <span>{item.metric}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Studio Hotline Card */}
      <div className="faq-hotline-card">
        <div className="faq-hotline-glow" />
        <div className="faq-hotline-content">
          <div className="faq-hotline-left">
            <span className="faq-hotline-badge">
              <span className="faq-hotline-signal">
                <span className="hotline-pulse-ring" />
                <span className="hotline-sparkle-core">✦</span>
              </span>
              <span>FOUNDER &amp; TEAM DIRECT LINE</span>
            </span>
            <h3 className="faq-hotline-title">Have a custom inquiry or special scope?</h3>
            <p className="faq-hotline-desc">Skip the wait and speak directly with Gurpreet or our core creative team. Real-time scope breakdown in under 5 minutes.</p>
          </div>
          <div className="faq-hotline-right">
            <a 
              href="https://wa.me/917818995147?text=Hey%20Gurpreet%20and%20Team!%20I'm%20on%20the%20FAQ%20section%20and%20had%20a%20specific%20question%20about%20a%20project." 
              target="_blank" 
              rel="noopener noreferrer" 
              className="faq-direct-btn"
            >
              <span className="faq-btn-shimmer" />
              <div className="faq-btn-label">
                <span className="faq-sparkle">✦</span>
                <span className="faq-btn-text">Ask Gurpreet or Team</span>
              </div>
              <div className="faq-action-disc">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* --- LEARNING OF THE DAY / DAILY INTEL SECTION --- */}
  <DailyLearningSection isGenz={false} />

  <div className="info-container" id="about">
    {/* JOIN COMMUNITY SECTION */}
    <section className="join-community-section" id="community">
      {/* Background Text Wave */}
      <div className="bg-community-container">
        <div className="bg-community-wave">
          <span>PURE CREATIVE CHAOS &nbsp;&nbsp;&nbsp; ELEVATE YOUR CRAFT &nbsp;&nbsp;&nbsp; JOIN THE
            COLLECTIVE &nbsp;&nbsp;&nbsp; ARCHITECT TOMORROW &nbsp;&nbsp;&nbsp; </span>
          <span>PURE CREATIVE CHAOS &nbsp;&nbsp;&nbsp; ELEVATE YOUR CRAFT &nbsp;&nbsp;&nbsp; JOIN THE
            COLLECTIVE &nbsp;&nbsp;&nbsp; ARCHITECT TOMORROW &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-community-wave" style={{marginLeft: '-5vw'}}>
          <span>BREAK THE ALGORITHM &nbsp;&nbsp;&nbsp; UNLOCK PREMIUM ASSETS &nbsp;&nbsp;&nbsp; COLLABORATE
            WITH ELITES &nbsp;&nbsp;&nbsp; TOP-TIER DIGITAL ALCHEMY &nbsp;&nbsp;&nbsp; </span>
          <span>BREAK THE ALGORITHM &nbsp;&nbsp;&nbsp; UNLOCK PREMIUM ASSETS &nbsp;&nbsp;&nbsp; COLLABORATE
            WITH ELITES &nbsp;&nbsp;&nbsp; TOP-TIER DIGITAL ALCHEMY &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-community-wave">
          <span>SHAPE THE DIGITAL LANDSCAPE &nbsp;&nbsp;&nbsp; BUILD SURREAL REALITIES &nbsp;&nbsp;&nbsp;
            BEYOND ORDINARY &nbsp;&nbsp;&nbsp; NO LIMITS &nbsp;&nbsp;&nbsp; </span>
          <span>SHAPE THE DIGITAL LANDSCAPE &nbsp;&nbsp;&nbsp; BUILD SURREAL REALITIES &nbsp;&nbsp;&nbsp;
            BEYOND ORDINARY &nbsp;&nbsp;&nbsp; NO LIMITS &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-community-wave" style={{marginLeft: '-8vw'}}>
          <span>PURE CREATIVE CHAOS &nbsp;&nbsp;&nbsp; ELEVATE YOUR CRAFT &nbsp;&nbsp;&nbsp; JOIN THE
            COLLECTIVE &nbsp;&nbsp;&nbsp; ARCHITECT TOMORROW &nbsp;&nbsp;&nbsp; </span>
          <span>PURE CREATIVE CHAOS &nbsp;&nbsp;&nbsp; ELEVATE YOUR CRAFT &nbsp;&nbsp;&nbsp; JOIN THE
            COLLECTIVE &nbsp;&nbsp;&nbsp; ARCHITECT TOMORROW &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-community-wave">
          <span>BREAK THE ALGORITHM &nbsp;&nbsp;&nbsp; UNLOCK PREMIUM ASSETS &nbsp;&nbsp;&nbsp; COLLABORATE
            WITH ELITES &nbsp;&nbsp;&nbsp; TOP-TIER DIGITAL ALCHEMY &nbsp;&nbsp;&nbsp; </span>
          <span>BREAK THE ALGORITHM &nbsp;&nbsp;&nbsp; UNLOCK PREMIUM ASSETS &nbsp;&nbsp;&nbsp; COLLABORATE
            WITH ELITES &nbsp;&nbsp;&nbsp; TOP-TIER DIGITAL ALCHEMY &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-community-wave" style={{marginLeft: '-3vw'}}>
          <span>SHAPE THE DIGITAL LANDSCAPE &nbsp;&nbsp;&nbsp; BUILD SURREAL REALITIES &nbsp;&nbsp;&nbsp;
            BEYOND ORDINARY &nbsp;&nbsp;&nbsp; NO LIMITS &nbsp;&nbsp;&nbsp; </span>
          <span>SHAPE THE DIGITAL LANDSCAPE &nbsp;&nbsp;&nbsp; BUILD SURREAL REALITIES &nbsp;&nbsp;&nbsp;
            BEYOND ORDINARY &nbsp;&nbsp;&nbsp; NO LIMITS &nbsp;&nbsp;&nbsp; </span>
        </div>
      </div>
      <div className="community-guideline mobile-only">
        <span className="guideline-quote">"Don't touch the <span className="highlight-text">bubbles(people)</span> - they will go away"</span>
      </div>
      <div className="community-wrapper">
        <div className="community-badge">
          <span className="community-badge-dot" aria-hidden="true"></span>
          <span>05 / THE COLLECTIVE</span>
        </div>
        <h2 className="section-title">Join the Creative Community</h2>
        <p className="section-desc">
          Step into an exclusive realm of top-tier designers, editors, and digital alchemists. Elevate your
          craft, gain access to premium assets, and collaborate with the minds shaping tomorrow's digital
          landscape. Pure creative chaos awaits.
        </p>
        <div style={{marginTop: 40}}>
          <button className="attract-btn" data-default-text="Join Dripp Community" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `openCommunityModal(event)`, target: event.currentTarget, originalEvent: event } }))}>
            <span className="attract-btn-content">
              <span className="btn-text" style={{position: 'relative', zIndex: 2}}>Join Dripp <span className="morph-word"><span className="morph-word-inner"><span className="morph-front">Community</span><span className="morph-back">Family</span></span></span></span>
            </span>
          </button>
        </div>
      </div>
    </section>
    {/* CLIENT CONNECTION SECTION (ACTING AS FOOTER) */}
    <footer className="client-connection-section" id="contact">
      {/* Background Text Wave */}
      <div className="bg-talk-container">
        <div className="bg-talk-wave">
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-talk-wave" style={{marginLeft: '-5vw'}}>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-talk-wave">
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-talk-wave" style={{marginLeft: '-8vw'}}>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-talk-wave">
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
        <div className="bg-talk-wave" style={{marginLeft: '-3vw'}}>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
          <span>LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp;
            LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; LET'S
            TALK &nbsp;&nbsp;&nbsp; LET'S TALK &nbsp;&nbsp;&nbsp; </span>
        </div>
      </div>
      {/* Top Marquee */}
      <div className="marquee-wrapper top-marquee">
        <div className="marquee-content">
          <span>LET'S WORK TOGETHER</span>
          <span>BRING IDEAS TO LIFE</span>
          <span>BUILD SOMETHING GREAT</span>
          <span>CRAFT SOMETHING REAL</span>
          <span>LET'S WORK TOGETHER</span>
          <span>BRING IDEAS TO LIFE</span>
          <span>BUILD SOMETHING GREAT</span>
          <span>CRAFT SOMETHING REAL</span>
        </div>
      </div>
      <div className="client-center">
        <span className="section-label">06 / LET'S COLLABORATE</span>
        <a href="#" className="mega-project-btn" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `openContactModal(event)`, target: event.currentTarget, originalEvent: event } }))}>
          <div className="mega-text-wrapper">
            <h2 className="mega-text outline">LET'S TALK</h2>
            <h2 className="mega-text solid">LET'S TALK</h2>
          </div>
        </a>
        <div className="client-footer-content">
          <p style={{fontSize: '1.2rem', marginBottom: 10, fontWeight: 500, textAlign: 'center'}}>Ready to
            create something surreal?</p>
          <a href="#" className="footer-email" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `openContactModal(event)`, target: event.currentTarget, originalEvent: event } }))}>mediadripp@gmail.com</a>
          <a href="tel:+917818995147" className="footer-phone">+91 78189 95147</a>
        </div>
      </div>
      {/* Bottom Marquee (Reverse) */}
      <div className="marquee-wrapper bottom-marquee">
        <div className="marquee-content reverse">
          <span>STAND OUT ONLINE</span>
          <span>TURN VISION INTO REALITY</span>
          <span>CREATE WITH US</span>
          <span>MAKE AN IMPACT</span>
          <span>STAND OUT ONLINE</span>
          <span>TURN VISION INTO REALITY</span>
          <span>CREATE WITH US</span>
          <span>MAKE AN IMPACT</span>
        </div>
      </div>
    </footer>
  </div>
  {/* SUB FOOTER */}
  <footer className="sub-footer">
    <div className="social-links">
      <a href="#">Instagram</a>
      <a href="#">Twitter</a>
      <a href="#">LinkedIn</a>
    </div>
    <div className="copyright">
      © 2026 Dripp Media. All rights reserved.
    </div>
  </footer>
  {/* Extra space pushed down logically */}
  <div className="spacer" style={{height: '0vh'}} />
  {/* --- MODALS --- */}
  <div className="modal-overlay" id="contact-modal">
    <div className="modal-container contact-modal-box">
      <button className="modal-close-disc" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `closeContactModal()`, target: event.currentTarget, originalEvent: event } }))} aria-label="Close modal">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="contact-modal-grid">
        {/* Left Sidebar: Studio Context, Navigation Tabs & Trust Guarantees */}
        <div className="contact-modal-sidebar">
          <div className="modal-header-block">
            <div className="modal-live-badge">
              <span className="live-status-ping" />
              <span>DIRECT STUDIO INTAKE · FAST 24H RESPONSE</span>
            </div>
            <h3 className="modal-title">Let's Talk.</h3>
            <p className="modal-desc">Tell us about your project scope or book a 15-minute discovery call directly.</p>
          </div>
          
          {/* Stacked Interactive Mode Tabs */}
          <div className="modal-tabs contact-tabs-stacked">
            <button 
              type="button"
              className="modal-tab-btn active" 
              id="tab-btn-brief"
              onClick={() => {
                document.getElementById('tab-btn-brief')?.classList.add('active');
                document.getElementById('tab-btn-call')?.classList.remove('active');
                const fBrief = document.getElementById('contact-form');
                const fCall = document.getElementById('contact-form-call');
                if (fBrief) fBrief.style.display = 'flex';
                if (fCall) fCall.style.display = 'none';
              }}
            >
              <div className="tab-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="tab-text-group">
                <span className="tab-title">Project Brief</span>
                <span className="tab-sub">Scope, timeline & goals</span>
              </div>
            </button>
            <button 
              type="button"
              className="modal-tab-btn" 
              id="tab-btn-call"
              onClick={() => {
                document.getElementById('tab-btn-call')?.classList.add('active');
                document.getElementById('tab-btn-brief')?.classList.remove('active');
                const fBrief = document.getElementById('contact-form');
                const fCall = document.getElementById('contact-form-call');
                if (fBrief) fBrief.style.display = 'none';
                if (fCall) fCall.style.display = 'flex';
              }}
            >
              <div className="tab-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="tab-text-group">
                <span className="tab-title">Book Strategy Call</span>
                <span className="tab-sub">15-min video discovery</span>
              </div>
            </button>
          </div>

          {/* Studio Guarantees */}
          <div className="contact-sidebar-guarantees">
            <div className="sidebar-guarantee-item">
              <span className="guarantee-sparkle">✦</span>
              <span>24h Initial Response</span>
            </div>
            <div className="sidebar-guarantee-item">
              <span className="guarantee-sparkle">✦</span>
              <span>Direct Senior Creative Lead</span>
            </div>
            <div className="sidebar-guarantee-item">
              <span className="guarantee-sparkle">✦</span>
              <span>Strict NDA & Privacy Protected</span>
            </div>
          </div>
        </div>

        {/* Right Main Form Area */}
        <div className="contact-modal-main">
          {/* BRIEF FORM */}
          <form className="modal-form" id="contact-form" style={{ display: 'flex' }}>
            <input type="hidden" name="services" defaultValue="{}" />
            <div id="contact-services-list" />

            {/* Multi-Select Project Scope Dropdown Menu */}
            <div className="form-group">
              <div className="field-label-row">
                <label>Project Scope</label>
                <span className="field-label-hint">Select all that apply</span>
              </div>
              
              <div className="scope-dropdown-wrap" id="scope-dropdown-wrap">
                <button
                  type="button"
                  className="scope-dropdown-trigger"
                  id="scope-dropdown-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    const wrap = document.getElementById('scope-dropdown-wrap');
                    wrap?.classList.toggle('open');
                  }}
                  aria-haspopup="listbox"
                >
                  <div className="scope-trigger-text" id="scope-trigger-text">
                    Select project scopes...
                  </div>
                  <svg className="scope-dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <div className="scope-dropdown-menu" id="scope-dropdown-menu" role="listbox">
                  {[
                    { id: 'video', label: 'Video & Motion Editing' },
                    { id: 'cinema', label: 'Cinematography / Videography / Photography' },
                    { id: 'web', label: 'Website Development' },
                    { id: 'app', label: 'App Development' },
                    { id: 'smm', label: 'Social Media Management' },
                    { id: 'graphics', label: 'Graphic Design & Identity' },
                    { id: '3d', label: '3D Animation & VFX' },
                    { id: 'retainer', label: 'Full Creative Retainer' }
                  ].map((option) => (
                    <div
                      key={option.id}
                      className="scope-dropdown-item"
                      data-scope-id={option.id}
                      data-scope-label={option.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        const item = e.currentTarget;
                        item.classList.toggle('selected');
                        
                        const selectedItems = Array.from(document.querySelectorAll('#scope-dropdown-menu .scope-dropdown-item.selected'))
                          .map(el => el.getAttribute('data-scope-label') || el.textContent.trim());
                        
                        // Update trigger label
                        const triggerText = document.getElementById('scope-trigger-text');
                        const tagsRow = document.getElementById('scope-selected-tags-row');
                        
                        if (selectedItems.length === 0) {
                          if (triggerText) {
                            triggerText.innerHTML = 'Select project scopes...';
                            triggerText.classList.remove('has-value');
                          }
                          if (tagsRow) tagsRow.innerHTML = '';
                        } else {
                          if (triggerText) {
                            triggerText.innerHTML = `<span class="scope-trigger-badge">${selectedItems.length}</span>${selectedItems.join(', ')}`;
                            triggerText.classList.add('has-value');
                          }
                          if (tagsRow) {
                            tagsRow.innerHTML = selectedItems.map(lbl => `
                              <span class="scope-selected-tag">
                                <span>${lbl}</span>
                                <span class="scope-tag-remove" data-remove-label="${lbl}">&times;</span>
                              </span>
                            `).join('');
                            // Attach remove click listener
                            tagsRow.querySelectorAll('.scope-tag-remove').forEach(rm => {
                              rm.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                const toRm = rm.getAttribute('data-remove-label');
                                const targetItem = Array.from(document.querySelectorAll('#scope-dropdown-menu .scope-dropdown-item')).find(i => i.getAttribute('data-scope-label') === toRm);
                                if (targetItem) targetItem.click();
                              });
                            });
                          }
                        }
                        
                        // Sync into message field
                        const msgBox = document.querySelector('#contact-form textarea[name="message"]');
                        if (msgBox) {
                          const currentVal = msgBox.value.replace(/^Scope: .*\n\n?/, '').trim();
                          if (selectedItems.length > 0) {
                            msgBox.value = `Scope: ${selectedItems.join(' · ')}\n\n${currentVal}`;
                          } else {
                            msgBox.value = currentVal;
                          }
                        }
                      }}
                    >
                      <div className="scope-item-left">
                        <span className="scope-item-sparkle">✦</span>
                        <span>{option.label}</span>
                      </div>
                      <div className="scope-item-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Removable Tag Badges */}
              <div className="scope-selected-tags-row" id="scope-selected-tags-row" />
            </div>

            {/* 2-Column Responsive Name & Email */}
            <div className="form-row-dual">
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Alex Morgan" required />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input type="email" name="email" className="form-input" placeholder="hello@company.com" required />
              </div>
            </div>

            <div className="form-group">
              <label>WhatsApp Number</label>
              <input type="tel" name="whatsapp" className="form-input" placeholder="+1 234 567 8900 / +91 98765 43210" required />
            </div>

            <div className="form-group">
              <label>Project Scope / Message</label>
              <textarea name="message" className="form-input" placeholder="Tell us what you're building, your target launch date, or reference links..." defaultValue={""} rows={2} />
            </div>

            {/* 3D Capsule Action Button */}
            <button type="submit" className="modal-submit-capsule" id="contact-submit">
              <span className="modal-btn-shimmer" />
              <div className="modal-btn-label">
                <span className="modal-sparkle">✦</span>
                <span className="modal-btn-text">Send Project Brief</span>
              </div>
              <div className="modal-action-disc">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </button>
          </form>

          {/* STRATEGY CALL FORM */}
          <form className="modal-form" id="contact-form-call" style={{ display: 'none' }} onSubmit={(e) => {
            e.preventDefault();
            const callSubmit = document.getElementById('call-submit');
            if (callSubmit) {
              callSubmit.querySelector('.modal-btn-text').innerText = 'Call Confirmed';
              callSubmit.style.background = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
              callSubmit.style.color = '#fff';
            }
            const target = e.currentTarget;
            const waNum = (target.elements && target.elements.namedItem('call_whatsapp')) ? target.elements.namedItem('call_whatsapp').value : '';
            const selectedSlot = document.querySelector('.slot-chip.active')?.textContent || 'Tomorrow at 3:00 PM';
            setTimeout(() => {
              window.open(`https://wa.me/917300595147?text=${encodeURIComponent(`Hey Dripp Media! I booked a 15-min strategy call for ${selectedSlot}. My WhatsApp is ${waNum}. Looking forward to connecting!`)}`, '_blank');
              if (typeof window.closeContactModal === 'function') window.closeContactModal();
            }, 1200);
          }}>
            <div className="call-meta-badge">
              <span className="live-status-ping" />
              <span>15-Min Strategy Session · Google Meet / Zoom</span>
            </div>
            <div className="slot-picker-label">Select Preferred Slot</div>
            <div className="slot-grid">
              {['Tomorrow 3:00 PM', 'Tomorrow 5:30 PM', 'Thu 2:00 PM', 'Thu 4:30 PM', 'Fri 11:00 AM', 'Fri 6:00 PM'].map((slot, idx) => (
                <div 
                  key={slot} 
                  className={`slot-chip ${idx === 0 ? 'active' : ''}`}
                  onClick={(e) => {
                    document.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                  }}
                >
                  {slot}
                </div>
              ))}
            </div>
            <div className="form-row-dual">
              <div className="form-group">
                <label>Your Name</label>
                <input type="text" name="call_name" className="form-input" placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input type="email" name="call_email" className="form-input" placeholder="hello@company.com" required />
              </div>
            </div>
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input type="tel" name="call_whatsapp" className="form-input" placeholder="+1 234 567 8900 / +91 98765 43210" required />
            </div>
            <button type="submit" className="modal-submit-capsule" id="call-submit">
              <span className="modal-btn-shimmer" />
              <div className="modal-btn-label">
                <span className="modal-sparkle">✦</span>
                <span className="modal-btn-text">Confirm Strategy Call</span>
              </div>
              <div className="modal-action-disc">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H8M17 7V16" />
                </svg>
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  <div className="modal-overlay" id="community-modal">
    <div className="modal-container contact-modal-box community-modal-box">
      <button 
        className="modal-close-disc" 
        onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `closeCommunityModal()`, target: event.currentTarget, originalEvent: event } }))} 
        aria-label="Close modal"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="modal-header-block">
        <div className="modal-live-badge">
          <span className="live-status-ping" />
          <span>CREATOR NETWORK · PRIVATE ACCESS</span>
        </div>
        <h3 className="modal-title">The Collective</h3>
        <p className="modal-desc">Join our private network of creators, designers, and engineers. Zero spam, high-signal drops.</p>
      </div>

      <form className="modal-form" id="community-form">
        <div className="form-group">
          <label>Email Address</label>
          <div className="community-input-wrap">
            <svg className="community-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <input type="email" name="email" className="form-input community-glass-input" placeholder="Enter your best email" required />
          </div>
        </div>

        <div className="form-group">
          <div className="field-label-row">
            <label>WhatsApp Number</label>
            <span className="field-label-hint">For War Room invite</span>
          </div>
          <div className="community-input-wrap">
            <svg className="community-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <input type="tel" name="whatsapp" className="form-input community-glass-input" placeholder="+1 234 567 8900 / +91 98765 43210" required />
          </div>
        </div>

        <div className="form-group">
          <div className="field-label-row">
            <label>Your Expertise</label>
            <span className="field-label-hint">Tap to select or type</span>
          </div>
          
          <div className="scope-chip-grid community-chips-grid">
            {[
              { id: 'video', label: 'Video Editing' },
              { id: 'web', label: 'Web & Fullstack' },
              { id: 'graphics', label: 'Graphic & Branding' },
              { id: '3d', label: '3D & Motion' },
              { id: 'director', label: 'Creative Director' },
              { id: 'content', label: 'Copy & Script' }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className="scope-chip community-chip"
                onClick={(e) => {
                  const btn = e.currentTarget;
                  btn.classList.toggle('active');
                  const activeChips = Array.from(document.querySelectorAll('.community-chip.active'))
                    .map(c => c.querySelector('.chip-text')?.textContent || c.textContent.replace('✦', '').trim());
                  const input = document.getElementById('community-expertise-input');
                  if (input) {
                    input.value = activeChips.join(', ');
                  }
                }}
              >
                <span className="scope-chip-indicator">✦</span>
                <span className="chip-text">{chip.label}</span>
              </button>
            ))}
          </div>

          <div className="community-input-wrap" style={{ marginTop: '8px' }}>
            <svg className="community-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <input 
              type="text" 
              name="expertise" 
              id="community-expertise-input" 
              className="form-input community-glass-input" 
              placeholder="e.g. Designer, Editor, 3D Artist, Developer" 
              required 
            />
          </div>
        </div>

        <button type="submit" className="modal-submit-capsule" id="community-submit">
          <span className="modal-btn-shimmer" />
          <div className="modal-btn-label">
            <span className="modal-sparkle">✦</span>
            <span className="modal-btn-text">Request Access & Join</span>
          </div>
          <div className="modal-action-disc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H8M17 7V16" />
            </svg>
          </div>
        </button>

        <div className="community-perks-row">
          <span className="community-perk-item">
            <span className="perk-bullet">✦</span> Instant WhatsApp War Room
          </span>
          <span className="community-perk-item">
            <span className="perk-bullet">✦</span> Zero Spam Guarantee
          </span>
          <span className="community-perk-item">
            <span className="perk-bullet">✦</span> Direct Collabs
          </span>
        </div>
      </form>
    </div>
  </div>
</div>


    </>
  );
}
