'use client';
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Link from "next/link";
import Preloader from "../components/Preloader";
import ProfileWidget from "../components/ProfileWidget";
import AuthModal from "../components/AuthModal";

export default function Page() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  
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

            // --- COMMUNITY CARD SHIMMER LOGIC ---
            const communityWrapper = document.querySelector('.community-wrapper');
            if (communityWrapper) {
                communityWrapper.addEventListener('mouseenter', () => {
                    // Only shimmer randomly (50% chance) and when not currently shimmering
                    if (!communityWrapper.classList.contains('is-shimmering') && Math.random() > 0.5) {
                        communityWrapper.classList.add('is-shimmering');
                    }
                });

                // Remove the class when the animation finishes so it can trigger again on future hovers
                communityWrapper.addEventListener('animationend', (e) => {
                    if (e.animationName === 'cardShimmer') {
                        communityWrapper.classList.remove('is-shimmering');
                    }
                });
            }

            // --- ATTRACT BUTTON LOGIC ---
            const attractBtns = document.querySelectorAll('.attract-btn');
            attractBtns.forEach(btn => {
                // --- MORPH WIDTH INIT ---
                const morphWord = btn.querySelector('.morph-word');
                const morphFront = btn.querySelector('.morph-front');
                const morphBack = btn.querySelector('.morph-back');
                let widthFront = 0;
                let widthBack = 0;

                if (morphWord && morphFront && morphBack) {
                    widthFront = morphFront.offsetWidth;
                    widthBack = morphBack.offsetWidth;
                    morphWord.style.width = widthFront + 'px';
                }

                const isMobileDevice = window.innerWidth < 900;
                const particleCount = isMobileDevice ? 100 : 150; 
                const container = document.createElement('div');
                container.className = 'attract-particles-container';
                btn.appendChild(container);

                const particles = [];
                let isAttracting = false;

                for (let i = 0; i < particleCount; i++) {
                    const p = document.createElement('div');
                    p.className = 'attract-particle';

                    // Spread randomly across the section, but NOT over the button (center)
                    let startX, startY;
                    do {
                        startX = (Math.random() - 0.5) * window.innerWidth * 0.9;
                        startY = (Math.random() - 0.5) * 800;
                        // Button is approx 250px wide, 70px high. Give it a safe buffer zone of 150px X and 70px Y from center
                    } while (Math.abs(startX) < 150 && Math.abs(startY) < 70);

                    const delayStart = Math.random() * 2;
                    const scaleStart = Math.random() * 1.2 + 0.5;
                    const opacityStart = Math.random() * 0.6 + 0.4;

                    gsap.set(p, { x: startX, y: startY, opacity: opacityStart, scale: scaleStart });

                    // Idle drift animation (people moving around)
                    gsap.to(p, {
                        x: startX + (Math.random() - 0.5) * 60,
                        y: startY + (Math.random() - 0.5) * 60,
                        duration: 4 + Math.random() * 3,
                        repeat: -1,
                        yoyo: true,
                        ease: "sine.inOut",
                        delay: delayStart
                    });

                    container.appendChild(p);
                    particles.push({
                        element: p,
                        startX: startX,
                        startY: startY,
                        opacityStart: opacityStart,
                        scaleStart: scaleStart,
                        currentX: startX,
                        currentY: startY
                    });
                }

                // Interactive Repulsion Logic when mouse is over the section
                const section = btn.closest('.join-community-section');
                let lastInteractionTime = 0;
                
                if (section) {
                    const handleRepulsion = (clientX, clientY) => {
                        if (isAttracting) return; // Don't repel while they are actively being sucked into the button
                        
                        const now = Date.now();
                        if (now - lastInteractionTime < 100) return; // Throttle to 10fps for ultimate low-end performance
                        lastInteractionTime = now;

                        // Calculate interaction position relative to the center of the button
                        const rect = btn.getBoundingClientRect();
                        const interactX = clientX - (rect.left + rect.width / 2);
                        const interactY = clientY - (rect.top + rect.height / 2);

                        particles.forEach(p => {
                            // Get particle's current animated position via GSAP's internal cache
                            const px = gsap.getProperty(p.element, "x");
                            const py = gsap.getProperty(p.element, "y");

                            const dx = px - interactX;
                            const dy = py - interactY;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            const repelRadius = 150;

                            if (distance < repelRadius) {
                                // Push apart proportionately
                                const force = (repelRadius - distance) / repelRadius;
                                const pushX = (dx / distance) * force * 50;
                                const pushY = (dy / distance) * force * 50;

                                // We use a relative tween so we don't break the absolute idle drift tween immediately
                                gsap.to(p.element, {
                                    x: px + pushX,
                                    y: py + pushY,
                                    duration: 0.3,
                                    ease: "power2.out",
                                    overwrite: "auto",
                                    onComplete: () => {
                                        if (!isAttracting) {
                                            // Resume drift from new position
                                            gsap.to(p.element, {
                                                x: p.startX + (Math.random() - 0.5) * 60,
                                                y: p.startY + (Math.random() - 0.5) * 60,
                                                duration: 4 + Math.random() * 3,
                                                repeat: -1,
                                                yoyo: true,
                                                ease: "sine.inOut"
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    };

                    // Desktop tracking
                    section.addEventListener('mousemove', (e) => {
                        if (isMobileDevice) return; 
                        handleRepulsion(e.clientX, e.clientY);
                    });

                    // Mobile tracking (Tap and drag to scatter!)
                    section.addEventListener('touchstart', (e) => {
                        if (e.touches.length > 0) handleRepulsion(e.touches[0].clientX, e.touches[0].clientY);
                    }, { passive: true });
                    
                    section.addEventListener('touchmove', (e) => {
                        if (e.touches.length > 0) handleRepulsion(e.touches[0].clientX, e.touches[0].clientY);
                    }, { passive: true });
                }

                const attractIn = () => {
                    isAttracting = true;
                    if (morphWord) morphWord.style.width = widthBack + 'px';
                    // Button Power-up Glow
                    gsap.to(btn, {
                        boxShadow: "inset 0 0 40px rgba(235, 215, 63, 0.6), 0 0 100px rgba(235, 215, 63, 0.8)",
                        scale: 1.05,
                        duration: 0.3,
                        ease: "power2.out"
                    });

                    particles.forEach((p, index) => {
                        gsap.killTweensOf(p.element);

                        // People gather into the button and merge FASTER
                        gsap.to(p.element, {
                            x: 0,
                            y: 0,
                            scale: 1.5,
                            opacity: 0,
                            duration: 0.3 + Math.random() * 0.2, // Faster
                            ease: "power3.in",
                            delay: Math.random() * 0.05 // Faster
                        });
                    });
                };

                const attractOut = () => {
                    if (morphWord) morphWord.style.width = widthFront + 'px';
                    // Remove power-up glow
                    gsap.to(btn, {
                        boxShadow: "inset 0 0 10px rgba(235, 215, 63, 0.1), 0 0 20px rgba(235, 215, 63, 0.1)",
                        scale: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });

                    particles.forEach((p, index) => {
                        gsap.killTweensOf(p.element);

                        // People explode back out to the community
                        gsap.to(p.element, {
                            x: p.startX,
                            y: p.startY,
                            scale: p.scaleStart,
                            opacity: p.opacityStart,
                            duration: 0.6 + Math.random() * 0.3, // Faster
                            ease: "expo.out",
                            delay: Math.random() * 0.05, // Faster
                            onComplete: () => {
                                isAttracting = false;
                                // Resume drift
                                gsap.to(p.element, {
                                    x: p.startX + (Math.random() - 0.5) * 60,
                                    y: p.startY + (Math.random() - 0.5) * 60,
                                    duration: 4 + Math.random() * 3,
                                    repeat: -1,
                                    yoyo: true,
                                    ease: "sine.inOut"
                                });
                            }
                        });
                    });
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
                heroTl.to(".hero-sub, .scroll-prompt", { opacity: 0, y: 50 }, 0);
            } else {
                heroTl.to("#word1", { x: -150, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to("#word2", { x: 150, opacity: 0, filter: "blur(20px)" }, 0);
                heroTl.to(".scroll-prompt", { opacity: 0, y: 50 }, 0);
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
            });

            return () => {
                interactionEnabled = false;
                cards.forEach((card) => {
                    card.removeEventListener('mouseenter', handleMouseEnter);
                    card.removeEventListener('touchstart', handleTouchStart);
                    card.removeEventListener('mouseleave', handleMouseLeave);
                    card.removeEventListener('mousemove', handleMouseMove);
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

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                navbar.style.boxShadow = "none";
                navbar.style.background = document.body.classList.contains('light-theme') ? "rgba(255, 255, 255, 0.6)" : "rgba(5, 5, 5, 0.4)";
            } else {
                navbar.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.5)";
                navbar.style.background = document.body.classList.contains('light-theme') ? "rgba(255, 255, 255, 0.9)" : "rgba(5, 5, 5, 0.85)";
            }
            if (currentScroll > lastScroll && currentScroll > 100) navbar.style.transform = "translateY(-100%)";
            else navbar.style.transform = "translateY(0)";
            lastScroll = currentScroll;
        });

        // --- THEME TOGGLE LOGIC ---
        // Keep light version by default on mobile
        const themeBtn = document.getElementById('theme-switch');

        if (themeBtn) {
            themeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(40);

                const toggleTheme = () => {
                    document.body.classList.toggle('light-theme');
                    const currentScroll = window.pageYOffset;
                    if (currentScroll <= 0) {
                        navbar.style.background = document.body.classList.contains('light-theme') ? "rgba(255, 255, 255, 0.6)" : "rgba(5, 5, 5, 0.4)";
                    } else {
                        navbar.style.background = document.body.classList.contains('light-theme') ? "rgba(255, 255, 255, 0.9)" : "rgba(5, 5, 5, 0.85)";
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

        // gsap.to(".hero-sub", { opacity: 1, duration: 2, delay: 0.5 }); // Handled in preloader timeline

        // --- FLOATING SERVICES CLOUD ---
        const fPills = document.querySelectorAll('.f-pill');
        const cloudContainer = document.getElementById('floating-cloud');

        if (fPills.length > 0 && cloudContainer) {

            // --- Zero-Gravity Physics State ---
            const pillState = [];
            let physicsInitialized = false;
            let containerW = cloudContainer.offsetWidth || window.innerWidth;
            let containerH = cloudContainer.offsetHeight || 550;

            function initPhysics() {
                // Scatter pills across the container on init
                fPills.forEach((pill, i) => {
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
                    const pillScale = 0.7 + depth * 0.45; // 0.95 to 1.2
                    const pillOpacity = 0.35 + depth * 0.55; // 0.65 to 0.96
                    const pillZIndex = Math.floor(depth * 10);

                    pill.style.opacity = Math.min(pillOpacity, 1);
                    pill.style.zIndex = pillZIndex;
                    pill.style.fontSize = `${(0.78 + depth * 0.22).toFixed(2)}rem`;

                    // Scatter pills across the container on init
                    const px = (Math.random() - 0.5) * containerW * 0.85;
                    const py = (Math.random() - 0.5) * containerH * 0.80;

                    // Randomized velocity per pill
                    const baseSpeed = 0.4 + Math.random() * 1.0; // Slightly faster base
                    const angle = Math.random() * Math.PI * 2;

                    // Per-pill physics personality
                    const pillMaxSpeed = 1.2 + Math.random() * 1.8;
                    const pillNudgeChance = 0.03 + Math.random() * 0.07; // 3% – 10%
                    const pillNudgeForce = 0.12 + Math.random() * 0.18;

                    const shouldHide = (window.innerWidth <= 900) && ((i % 3) !== 0);
                    pill.style.display = shouldHide ? 'none' : 'inline-flex';

                    pillState.push({
                        el: pill,
                        isActive: !shouldHide,
                        x: px, y: py,
                        vx: Math.cos(angle) * baseSpeed,
                        vy: Math.sin(angle) * baseSpeed,
                        scale: pillScale,
                        baseOpacity: pillOpacity,
                        baseZIndex: pillZIndex,
                        maxSpeed: pillMaxSpeed,
                        nudgeChance: pillNudgeChance,
                        nudgeForce: pillNudgeForce,
                        isDragging: false,
                        lastClickTime: 0,
                        startPX: 0, startPY: 0,
                        startEX: 0, startEY: 0,
                        prevPX: 0, prevPY: 0,
                        dragVX: 0, dragVY: 0,
                        hw: pill.offsetWidth / 2 || 60,
                        hh: pill.offsetHeight / 2 || 20
                    });

                    const st = pillState[i];
                    _applyTransform(pill, st);
                    _attachDragListeners(pill, st);
                });

                // Start the physics loop via GSAP ticker for maximum stability
                gsap.ticker.add(_physicsTick);
                physicsInitialized = true;
            }

            function _applyTransform(el, s) {
                el.style.transform = `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${s.scale})`;
            }

            // Mobile: throttle physics to ~30fps
            let _physicsFrameCount = 0;
            const _isMobilePhysics = window.innerWidth <= 900;

            function _physicsTick() {
                pillState.forEach(s => {
                    if (!s.isActive || s.isDragging) return;

                    // Per-pill random nudge (zero-gravity tumble)
                    if (Math.random() < s.nudgeChance) {
                        s.vx += (Math.random() - 0.5) * s.nudgeForce;
                        s.vy += (Math.random() - 0.5) * s.nudgeForce;
                    }

                    // Ambient persistent drift - ensures they NEVER stop fully
                    s.vx += (Math.random() - 0.5) * 0.01;
                    s.vy += (Math.random() - 0.5) * 0.01;

                    // Per-pill speed cap
                    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
                    if (speed > s.maxSpeed) {
                        s.vx = (s.vx / speed) * s.maxSpeed;
                        s.vy = (s.vy / speed) * s.maxSpeed;
                    }

                    s.x += s.vx;
                    s.y += s.vy;

                    // Boundary: Infinite loop teleportation with edge fade
                    const hw = s.hw;
                    const hh = s.hh;
                    const wrapLimitX = containerW / 2 + hw + 20;
                    const wrapLimitY = containerH / 2 + hh + 20;

                    if (s.x > wrapLimitX) s.x = -wrapLimitX;
                    else if (s.x < -wrapLimitX) s.x = wrapLimitX;

                    if (s.y > wrapLimitY) s.y = -wrapLimitY;
                    else if (s.y < -wrapLimitY) s.y = wrapLimitY;

                    // Dynamic fade near the edges of the container
                    const distX = Math.abs(s.x) / (containerW / 2);
                    const distY = Math.abs(s.y) / (containerH / 2);
                    const maxDist = Math.max(distX, distY);

                    const fadeStart = 0.8;
                    if (maxDist > fadeStart && !s.el.classList.contains('selected')) {
                        const fadeFactor = Math.max(0, 1 - ((maxDist - fadeStart) / (1 - fadeStart)));
                        s.el.style.opacity = s.baseOpacity * fadeFactor * fadeFactor;
                        s.el.style.pointerEvents = fadeFactor < 0.1 ? 'none' : 'auto';
                    } else if (s.el.classList.contains('selected')) {
                        s.el.style.opacity = 1;
                        s.el.style.pointerEvents = 'auto';
                    } else {
                        s.el.style.opacity = s.baseOpacity;
                        s.el.style.pointerEvents = 'auto';
                    }

                    // Very light damping
                    s.vx *= 0.998;
                    s.vy *= 0.998;

                    _applyTransform(s.el, s);
                });
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
                    pill.setPointerCapture(e.pointerId);
                    pill.style.cursor = 'grabbing';
                    // Bring to absolute front during drag
                    pill.style.zIndex = 2000;
                });

                pill.addEventListener('pointermove', (e) => {
                    if (!s.isDragging) return;
                    const dx = e.clientX - s.startPX;
                    const dy = e.clientY - s.startPY;
                    s.dragVX = e.clientX - s.prevPX;
                    s.dragVY = e.clientY - s.prevPY;
                    s.prevPX = e.clientX;
                    s.prevPY = e.clientY;
                    s.x = s.startEX + dx;
                    s.y = s.startEY + dy;
                    _applyTransform(pill, s);
                });

                pill.addEventListener('pointerup', (e) => {
                    if (!s.isDragging) return;
                    s.isDragging = false;
                    pill.releasePointerCapture(e.pointerId);
                    pill.style.cursor = 'grab';

                    // Restore z-index logic: if selected, keep at 100, else return to baseZIndex
                    if (!pill.classList.contains('selected')) {
                        pill.style.zIndex = s.baseZIndex;
                    } else {
                        pill.style.zIndex = 100;
                    }

                    // Throw with drag velocity
                    s.vx = s.dragVX * 0.4;
                    s.vy = s.dragVY * 0.4;

                    const totalMoved = Math.sqrt(
                        Math.pow(e.clientX - s.startPX, 2) +
                        Math.pow(e.clientY - s.startPY, 2)
                    );

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
                });
            }

            // Instead of rigid setTimeout that can capture height=0 before fonts/layout are ready, 
            // use a ResizeObserver to explicitly wait for true valid dimensions to initialize physics.
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
                                // Update dimensions for wrapping
                                containerW = newW;
                                containerH = newH;
                                // Safely handle responsive window resizing without destroying pill x/y
                                fPills.forEach((pill, i) => {
                                    const shouldHide = (window.innerWidth <= 900) && ((i % 3) !== 0);
                                    if (pillState[i]) {
                                        pillState[i].isActive = !shouldHide;
                                        pill.style.display = shouldHide ? 'none' : 'inline-flex';
                                        pillState[i].hw = pill.offsetWidth / 2 || 60;
                                        pillState[i].hh = pill.offsetHeight / 2 || 20;
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
        const selectedServices = new Map();
        let hasAutoScrolledToCart = false; // Tracks if we've shown the auto-scroll tour
        const customQuoteBtn = document.getElementById('custom-quote-btn');
        const receiptItemsContainer = document.getElementById('receipt-items');

        function updateReceipt() {
            if (!receiptItemsContainer) return;
            receiptItemsContainer.innerHTML = '';

            if (selectedServices.size === 0) {
                receiptItemsContainer.innerHTML = '<div class="empty-receipt">No services selected...</div>';
                if (customQuoteBtn) customQuoteBtn.href = 'mailto:hello@dripmedia.com';
                return;
            }

            let list = [];
            let i = 1;
            selectedServices.forEach((qty, svc) => {
                const item = document.createElement('div');
                item.className = 'receipt-item';
                item.style.animationDelay = `${(i - 1) * 0.05}s`;
                item.innerHTML = `
                    <span>[${String(i).padStart(2, '0')}] ${svc}</span> 
                    <div style="display:flex; align-items:center; gap:8px;">
                        <div class="qty-controls">
                            <button class="qty-btn minus-btn" data-service="${svc}" style="${qty <= 1 ? 'opacity: 0.3; cursor: not-allowed; pointer-events: none;' : ''}">-</button>
                            <span class="qty-val">${qty}</span>
                            <button class="qty-btn plus-btn" data-service="${svc}">+</button>
                        </div>
                        <button class="del-service-btn" data-service="${svc}" title="Remove Service">×</button>
                    </div>
                `;
                receiptItemsContainer.appendChild(item);
                list.push(`${qty}x ${svc}`);
                i++;
            });

            // Attach event listeners to delete buttons
            document.querySelectorAll('.del-service-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const svc = btn.dataset.service;
                    if (selectedServices.has(svc)) {
                        selectedServices.delete(svc);

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

        document.querySelectorAll('.builder-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchTabTo(tab.dataset.tab);
            });
        });

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

        document.querySelectorAll('.custom-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const svc = chip.dataset.service;

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
        });

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
                    const badge = document.createElement('div');
                    badge.className = 'selected-svc-badge';
                    badge.innerText = `${name} (x${qty})`;
                    contactServicesList.appendChild(badge);
                });
            }
        }

        window.closeContactModal = function () {
            contactModal.classList.remove('active');
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
                    alert("Something went wrong. Please try again.");
                    contactSubmit.classList.remove('loading');
                }
            } catch (err) {
                alert("Failed to connect to the server.");
                contactSubmit.classList.remove('loading');
            }
        });

        communityForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = communityForm.email.value.trim();
            const expertise = communityForm.expertise ? communityForm.expertise.value.trim() : '';

            if (!email) return;

            communitySubmit.innerText = 'Routing to WhatsApp...';
            communitySubmit.style.background = '#4CAF50';
            communitySubmit.style.color = '#fff';
            communitySubmit.disabled = true;

            setTimeout(() => {
                closeCommunityModal();
                window.location.href = 'https://chat.whatsapp.com/CEyxprdFx99E8eNrFoIIxP';
            }, 1000);
        });
        // --- FOUNDER SEQUENCE CANVAS LOGIC ---
        // --- FOUNDER SEQUENCE LOGIC ---
        const fCard = document.getElementById("founder-3d-card");
        const fWrap = document.getElementById("founder-card-wrap");

        if (fCard && fWrap) {
            // Dynamic Scroll Theming (Light Mode toggle)
            ScrollTrigger.create({
                trigger: ".founder-sequence-section",
                start: "top 50%",
                end: "bottom 50%",
                onEnter: () => document.body.classList.toggle('light-theme'),
                onLeaveBack: () => document.body.classList.toggle('light-theme')
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
      <li>
        <div className="c-nav-group">
          <a href="#community" className="c-nav-btn c-community" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `document.getElementById('community').scrollIntoView({behavior: 'smooth'})`, target: event.currentTarget, originalEvent: event } }))}>
            <span className="c-txt-wrap"><span className="c-txt" data-text="Community">Community</span></span>
          </a>
          <a href="#contact" className="c-nav-btn c-talk" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `document.getElementById('contact').scrollIntoView({behavior: 'smooth'})`, target: event.currentTarget, originalEvent: event } }))}>
            <span className="c-txt-wrap"><span className="c-txt" data-text="Let's Talk">Let's Talk</span></span>
            <svg className="c-arrow" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </li>
      <li style={{ marginLeft: '15px' }}>
         <ProfileWidget onLoginClick={() => setShowAuthModal(true)} />
      </li>
      <li className="theme-switch-wrapper">
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
      </li>
    </ul>
    <div className="hamburger" id="hamburger">
      <div className="line1" />
      <div className="line2" />
      <div className="line3" />
    </div>
  </nav>

  <AuthModal 
      isOpen={showAuthModal} 
      onClose={() => setShowAuthModal(false)}
      onLoginSuccess={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('dripp_login_success'));
        }
      }}
  />
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
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 01 / EDIT &amp; SHOOT
                </span>
              </div>
              <div className="card-body">
                <h2>Video<br /><span>Production</span></h2>
                <p className="front-desc">High-end video editing and professional shooting to capture your
                  brand's essence.</p>
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
              <p className="back-text">We handle the entire production pipeline to engineer captivating visual
                dopamine.</p>
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/video-portfolio" className="btn btn-primary" style={{display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: '100%', borderRadius: 8, padding: 12, fontSize: '0.8rem'}}>
                  <span style={{position: 'relative', zIndex: 2}}>View Video Portfolio</span>
                  <div className="btn-fill" />
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
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 02 / GRAPHICS
                </span>
              </div>
              <div className="card-body">
                <h2>Graphic<br /><span style={{fontSize: '1.55rem'}}>Designing</span></h2>
                <p className="front-desc">Visual identities that melt faces. Bold typography &amp; surreal art.
                </p>
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
              <p className="back-text">Scalable design systems that work seamlessly from Instagram stories to
                billboards.</p>
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/graphic-portfolio" className="btn btn-primary" style={{display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: '100%', borderRadius: 8, padding: 12, fontSize: '0.8rem'}}>
                  <span style={{position: 'relative', zIndex: 2}}>View Graphics Portfolio</span>
                  <div className="btn-fill" />
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
            </div>
            <div className="card-content">
              <div className="card-header">
                <span className="glass-label">
                  <span className="status-dot" /> 03 / WEB DEV
                </span>
              </div>
              <div className="card-body">
                <h2>Website<br /><span>Development</span></h2>
                <p className="front-desc">Immersive, high-performance websites optimized for the algorithm.
                </p>
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
              <div style={{marginTop: 'auto', position: 'relative', zIndex: 10, transformStyle: 'preserve-3d'}}>
                <a href="/web-portfolio" className="btn btn-primary" style={{display: 'inline-block', textDecoration: 'none', textAlign: 'center', width: '100%', borderRadius: 8, padding: 12, fontSize: '0.8rem'}}>
                  <span style={{position: 'relative', zIndex: 2}}>View Web Portfolio</span>
                  <div className="btn-fill" />
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
        {/* Video Production */}
        <span className="f-pill">Podcast Editing</span>
        <span className="f-pill">Documentary Editing</span>
        <span className="f-pill">School Videography</span>
        <span className="f-pill">Drone Footage</span>
        <span className="f-pill">Music Videos</span>
        <span className="f-pill">Corporate Videos</span>
        <span className="f-pill">Commercial Videos</span>
        <span className="f-pill">Testimonial Videos</span>
        <span className="f-pill">Real Estate Videography</span>
        <span className="f-pill">Event Coverage</span>
        <span className="f-pill">YouTube Videos</span>
        <span className="f-pill">Instagram Reels</span>
        <span className="f-pill">TikTok Videos</span>
        <span className="f-pill">YouTube Shorts</span>
        <span className="f-pill">Explainer Videos</span>
        <span className="f-pill">Product Videos</span>
        <span className="f-pill">Training Videos</span>
        <span className="f-pill">Live Stream Setup</span>
        <span className="f-pill">Sports Videography</span>
        <span className="f-pill">Fashion Videos</span>
        <span className="f-pill">Short Film Production</span>
        {/* Photography */}
        <span className="f-pill">Concert Photography</span>
        <span className="f-pill">Corporate Headshots</span>
        <span className="f-pill">Product Photography</span>
        <span className="f-pill">Event Photography</span>
        <span className="f-pill">Behind the Scenes</span>
        <span className="f-pill">Real Estate Photography</span>
        <span className="f-pill">Fashion Photography</span>
        <span className="f-pill">Food Photography</span>
        <span className="f-pill">Sports Photography</span>
        {/* Post-Production */}
        <span className="f-pill">Video Color Grading</span>
        <span className="f-pill">Subtitles &amp; Captions</span>
        <span className="f-pill">Motion Graphics</span>
        <span className="f-pill">VFX &amp; Green Screen</span>
        <span className="f-pill">Sound Mixing</span>
        <span className="f-pill">Thumbnail Design</span>
        <span className="f-pill">Video Ads</span>
        <span className="f-pill">YouTube Chapters</span>
        <span className="f-pill">Podcast Chapters</span>
        {/* Graphic & Brand Design */}
        <span className="f-pill">Logo Design</span>
        <span className="f-pill">Brand Identity</span>
        <span className="f-pill">Poster Design</span>
        <span className="f-pill">T-Shirt &amp; Merch Design</span>
        <span className="f-pill">Social Media Graphics</span>
        <span className="f-pill">Album Artwork</span>
        <span className="f-pill">Flyer Design</span>
        <span className="f-pill">Business Cards</span>
        <span className="f-pill">Banner &amp; Signage</span>
        <span className="f-pill">Pitch Deck Design</span>
        <span className="f-pill">Presentation Design</span>
        <span className="f-pill">Mascot Design</span>
        <span className="f-pill">Packaging Design</span>
        <span className="f-pill">Menu Design</span>
        <span className="f-pill">Event Branding</span>
        <span className="f-pill">Streetwear Lookbooks</span>
        {/* Web & Digital */}
        <span className="f-pill">Website Design</span>
        <span className="f-pill">3D Website Design</span>
        <span className="f-pill">eCommerce Website</span>
        <span className="f-pill">Shopify Store</span>
        <span className="f-pill">UI/UX Design</span>
        <span className="f-pill">Landing Pages</span>
        <span className="f-pill">SEO Optimization</span>
        <span className="f-pill">App UI Design</span>
        <span className="f-pill">Social Media Strategy</span>
        {/* Animation & 3D */}
        <span className="f-pill">2D Animation</span>
        <span className="f-pill">3D Animation</span>
        <span className="f-pill">3D Product Renders</span>
        <span className="f-pill">Animated Logo</span>
        <span className="f-pill">Whiteboard Animation</span>
        <span className="f-pill">Virtual Reality (VR)</span>
        <span className="f-pill">Augmented Reality (AR)</span>
        {/* Social Media */}
        <span className="f-pill">Meta Management</span>
        <span className="f-pill">YouTube Management</span>
        <span className="f-pill">Ads Management</span>
        <span className="f-pill">Google Business Profile</span>
        <span className="f-pill">Social Media Strategy</span>
        <span className="f-pill">Content Scheduling</span>
        <span className="f-pill">Community Management</span>
        <span className="f-pill">Influencer Outreach</span>
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
            <button className="builder-tab active" data-tab="video">Video</button>
            <button className="builder-tab" data-tab="photo">Photography</button>
            <button className="builder-tab" data-tab="post">Post-Production</button>
            <button className="builder-tab" data-tab="design">Design</button>
            <button className="builder-tab" data-tab="web">Web &amp; Digital</button>
            <button className="builder-tab" data-tab="animation">Animation &amp; 3D</button>
            <button className="builder-tab" data-tab="social">Social Media</button>
          </div>
          {/* Chip Panels */}
          <div className="chip-scroll">
            <div className="chip-panels">
              <div className="chip-panel active" data-panel="video">
                {/* Only on-location / production services */}
                <div className="custom-chip" data-service="Music Video Shoot">Music Video Shoot</div>
                <div className="custom-chip" data-service="Corporate Video Shoot">Corporate Video Shoot
                </div>
                <div className="custom-chip" data-service="Commercial Shoot">Commercial Shoot</div>
                <div className="custom-chip" data-service="Event Coverage">Event Coverage</div>
                <div className="custom-chip" data-service="School Videography">School Videography</div>
                <div className="custom-chip" data-service="Drone Footage">Drone Footage</div>
                <div className="custom-chip" data-service="Real Estate Videography">Real Estate Videography
                </div>
                <div className="custom-chip" data-service="Sports Videography">Sports Videography</div>
                <div className="custom-chip" data-service="Fashion Video Shoot">Fashion Video Shoot</div>
                <div className="custom-chip" data-service="Short Film Production">Short Film Production
                </div>
                <div className="custom-chip" data-service="Testimonial Shoot">Testimonial Shoot</div>
                <div className="custom-chip" data-service="Live Stream Setup">Live Stream Setup</div>
                <div className="custom-chip" data-service="Behind the Scenes">Behind the Scenes</div>
              </div>
              <div className="chip-panel" data-panel="photo">
                <div className="custom-chip" data-service="Concert Photography">Concert Photography</div>
                <div className="custom-chip" data-service="Corporate Headshots">Corporate Headshots</div>
                <div className="custom-chip" data-service="Product Photography">Product Photography</div>
                <div className="custom-chip" data-service="Event Photography">Event Photography</div>
                <div className="custom-chip" data-service="Real Estate Photography">Real Estate Photography
                </div>
                <div className="custom-chip" data-service="Fashion Photography">Fashion Photography</div>
                <div className="custom-chip" data-service="Food Photography">Food Photography</div>
                <div className="custom-chip" data-service="Sports Photography">Sports Photography</div>
              </div>
              <div className="chip-panel" data-panel="post">
                {/* All editing, delivery-format, mixing, and post services */}
                <div className="custom-chip" data-service="Podcast Editing">Podcast Editing</div>
                <div className="custom-chip" data-service="Documentary Editing">Documentary Editing</div>
                <div className="custom-chip" data-service="YouTube Video Editing">YouTube Video Editing
                </div>
                <div className="custom-chip" data-service="Instagram Reels Editing">Instagram Reels Editing
                </div>
                <div className="custom-chip" data-service="TikTok Video Editing">TikTok Video Editing</div>
                <div className="custom-chip" data-service="YouTube Shorts Editing">YouTube Shorts Editing
                </div>
                <div className="custom-chip" data-service="Explainer Video Editing">Explainer Video Editing
                </div>
                <div className="custom-chip" data-service="Product Video Editing">Product Video Editing
                </div>
                <div className="custom-chip" data-service="Training Video Editing">Training Video Editing
                </div>
                <div className="custom-chip" data-service="Video Color Grading">Video Color Grading</div>
                <div className="custom-chip" data-service="Subtitles & Captions">Subtitles &amp; Captions</div>
                <div className="custom-chip" data-service="Motion Graphics">Motion Graphics</div>
                <div className="custom-chip" data-service="VFX & Green Screen">VFX &amp; Green Screen</div>
                <div className="custom-chip" data-service="Sound Mixing">Sound Mixing</div>
                <div className="custom-chip" data-service="Thumbnail Design">Thumbnail Design</div>
                <div className="custom-chip" data-service="Video Ads">Video Ads</div>
                <div className="custom-chip" data-service="YouTube Chapters">YouTube Chapters</div>
                <div className="custom-chip" data-service="Podcast Chapters">Podcast Chapters</div>
              </div>
              <div className="chip-panel" data-panel="design">
                <div className="custom-chip" data-service="Logo Design">Logo Design</div>
                <div className="custom-chip" data-service="Brand Identity">Brand Identity</div>
                <div className="custom-chip" data-service="Poster Design">Poster Design</div>
                <div className="custom-chip" data-service="T-Shirt & Merch Design">T-Shirt &amp; Merch Design
                </div>
                <div className="custom-chip" data-service="Social Media Graphics">Social Media Graphics
                </div>
                <div className="custom-chip" data-service="Album Artwork">Album Artwork</div>
                <div className="custom-chip" data-service="Flyer Design">Flyer Design</div>
                <div className="custom-chip" data-service="Business Cards">Business Cards</div>
                <div className="custom-chip" data-service="Banner & Signage">Banner &amp; Signage</div>
                <div className="custom-chip" data-service="Pitch Deck Design">Pitch Deck Design</div>
                <div className="custom-chip" data-service="Presentation Design">Presentation Design</div>
                <div className="custom-chip" data-service="Mascot Design">Mascot Design</div>
                <div className="custom-chip" data-service="Packaging Design">Packaging Design</div>
                <div className="custom-chip" data-service="Menu Design">Menu Design</div>
                <div className="custom-chip" data-service="Event Branding">Event Branding</div>
                <div className="custom-chip" data-service="Streetwear Lookbooks">Streetwear Lookbooks</div>
              </div>
              <div className="chip-panel" data-panel="web">
                <div className="custom-chip" data-service="Website Design">Website Design</div>
                <div className="custom-chip" data-service="3D Website Design">3D Website Design</div>
                <div className="custom-chip" data-service="eCommerce Website">eCommerce Website</div>
                <div className="custom-chip" data-service="Shopify Store">Shopify Store</div>
                <div className="custom-chip" data-service="UI/UX Design">UI/UX Design</div>
                <div className="custom-chip" data-service="Landing Pages">Landing Pages</div>
                <div className="custom-chip" data-service="SEO Optimization">SEO Optimization</div>
                <div className="custom-chip" data-service="App UI Design">App UI Design</div>
                <div className="custom-chip" data-service="Social Media Strategy">Social Media Strategy
                </div>
                <div className="custom-chip" data-service="App Development">App Development</div>
                <div className="custom-chip" data-service="UX Research">UX Research</div>
                <div className="custom-chip" data-service="B2B Proposals">B2B Proposals</div>
              </div>
              <div className="chip-panel" data-panel="animation">
                <div className="custom-chip" data-service="2D Animation">2D Animation</div>
                <div className="custom-chip" data-service="3D Animation">3D Animation</div>
                <div className="custom-chip" data-service="3D Product Renders">3D Product Renders</div>
                <div className="custom-chip" data-service="Animated Logo">Animated Logo</div>
                <div className="custom-chip" data-service="Whiteboard Animation">Whiteboard Animation</div>
                <div className="custom-chip" data-service="Virtual Reality (VR)">Virtual Reality (VR)</div>
                <div className="custom-chip" data-service="Augmented Reality (AR)">Augmented Reality (AR)
                </div>
              </div>
              <div className="chip-panel" data-panel="social">
                <div className="custom-chip" data-service="Meta Management">Meta Management</div>
                <div className="custom-chip" data-service="YouTube Management">YouTube Management</div>
                <div className="custom-chip" data-service="Ads Management">Ads Management</div>
                <div className="custom-chip" data-service="Google Business Profile">Google Business Profile
                </div>
                <div className="custom-chip" data-service="Social Media Strategy">Social Media Strategy
                </div>
                <div className="custom-chip" data-service="Content Scheduling">Content Scheduling</div>
                <div className="custom-chip" data-service="Community Management">Community Management</div>
                <div className="custom-chip" data-service="Influencer Outreach">Influencer Outreach</div>
              </div>
            </div>{/* /chip-panels */}
          </div>{/* /chip-scroll */}
        </div>
        <div className="builder-right">
          <div className="receipt-header">
            <div className="receipt-title">Est. Cart</div>
            <div className="receipt-date" id="receipt-date">YYYY-MM-DD</div>
          </div>
          <div className="receipt-items" id="receipt-items">
            <div className="empty-receipt">No services selected...</div>
          </div>
          <div className="receipt-footer">
            <a href="#" className="custom-quote-btn" id="custom-quote-btn" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `openContactModal(event, true)`, target: event.currentTarget, originalEvent: event } }))}>
              Request Quote
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
        <span className="section-label">05 / THE COLLECTIVE</span>
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
    <div className="modal-container">
      <button className="modal-close" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `closeContactModal()`, target: event.currentTarget, originalEvent: event } }))}>×</button>
      <h3 className="modal-title">Let's Talk</h3>
      <p className="modal-desc">Tell us about your project or enquiry. We'll get back to you with some magic.</p>
      <form className="modal-form" id="contact-form">
        <input type="hidden" name="services" defaultValue="{}" />
        <div id="contact-services-list" />
        <div className="form-group">
          <label>Name</label>
          <input type="text" name="name" className="form-input" placeholder="Your name" required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" className="form-input" placeholder="hello@example.com" required />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea name="message" className="form-input" placeholder="Tell us what you're building..." defaultValue={""} />
        </div>
        <button type="submit" className="modal-submit" id="contact-submit">Send Message</button>
      </form>
    </div>
  </div>
  <div className="modal-overlay" id="community-modal">
    <div className="modal-container">
      <button className="modal-close" onClick={(event) => window.dispatchEvent(new CustomEvent('inline-click', { detail: { action: `closeCommunityModal()`, target: event.currentTarget, originalEvent: event } }))}>×</button>
      <h3 className="modal-title">The Collective</h3>
      <p className="modal-desc">Join our private network of creators. No spam, just pure signal.</p>
      <form className="modal-form" id="community-form">
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" name="email" className="form-input" placeholder="Enter your best email" required />
        </div>
        <div className="form-group">
          <label>Your Expertise</label>
          <input type="text" name="expertise" className="form-input" placeholder="e.g. Designer, Editor, Developer" required />
        </div>
        <button type="submit" className="modal-submit" id="community-submit">Join Now</button>
      </form>
    </div>
  </div>
</div>




            
            <a 
                href="/arcade"
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 9999,
                    backgroundColor: 'rgba(235, 215, 63, 0.1)',
                    border: '1px solid rgba(235, 215, 63, 0.5)',
                    color: '#ebd73f',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontFamily: "'Clash Display', sans-serif",
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    boxShadow: '0 0 15px rgba(235, 215, 63, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(235, 215, 63, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(235, 215, 63, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                    <line x1="6" y1="12" x2="10" y2="12"></line>
                    <line x1="8" y1="10" x2="8" y2="14"></line>
                    <line x1="15" y1="13" x2="15.01" y2="13"></line>
                    <line x1="18" y1="11" x2="18.01" y2="11"></line>
                </svg>
                Arcade Mode
            </a>

            <a
                href="/admin-panel"
                style={{
                    position: 'fixed',
                    bottom: '85px',
                    right: '30px',
                    zIndex: 9999,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontFamily: "'Clash Display', sans-serif",
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Admin Panel
            </a>
    </>

  );
}
