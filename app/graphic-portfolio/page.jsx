'use client';
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Page() {
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

        // --- INFINITE CANVAS ENGINE ---
        class InfiniteCanvas {
            constructor(containerId, options = {}) {
                this.container = document.getElementById(containerId);
                this.imageSize = parseFloat(options.imageSize) || 20; // vw
                this.gap = parseFloat(options.gap) || 8; // vw
                this.numberOfImages = options.numberOfImages || 20;
                this.imageRootPath = options.imageRootPath || 'images/custom';

                this.items = [];

                this.state = {
                    x: 0,
                    y: 0,
                    targetX: 0,
                    targetY: 0,
                    velX: 0,
                    velY: 0,
                    isDragging: false,
                    lastPointer: { x: 0, y: 0 }
                };

                this.cols = Math.ceil(Math.sqrt(this.numberOfImages));
                this.rows = Math.ceil(this.numberOfImages / this.cols);

                this.updateMetrics();
                this.init();

                // Cache bound function to cleanly add/remove from GSAP ticker
                this.renderBound = this.render.bind(this);

                this.bindEvents();

                // 60fps binding for position updates 
                gsap.ticker.add(this.renderBound);
                window.addEventListener('resize', () => {
                    this.updateMetrics();
                    this.recalcPositions();
                });
            }

            updateMetrics() {
                // Determine responsive sizing. Boost size on mobile so it doesn't look empty
                const isMobile = window.innerWidth <= 768;
                const appliedSize = isMobile ? this.imageSize * 2 : this.imageSize;
                const appliedGap = isMobile ? this.gap * 1.5 : this.gap;

                const vw = window.innerWidth / 100;
                this.itemSizePx = appliedSize * vw;
                this.gapPx = appliedGap * vw;
                this.stepX = this.itemSizePx + this.gapPx;
                this.stepY = this.itemSizePx + this.gapPx;

                this.gridWidth = this.cols * this.stepX;
                this.gridHeight = this.rows * this.stepY;
            }

            init() {
                for (let i = 0; i < this.numberOfImages; i++) {
                    const el = document.createElement('div');
                    el.className = 'canvas-item is-loading';

                    const img = document.createElement('img');
                    
                    // Add loaded class when image successfully loads
                    img.onload = () => {
                        el.classList.remove('is-loading');
                        img.classList.add('loaded');
                    };

                    // Map to sequentially numbered images as requested
                    img.src = `${this.imageRootPath}/img${i + 1}.jpg`;

                    // Smart Fallback placeholder while user organizes their local photos
                    img.onerror = () => {
                        img.onerror = null; // Prevent infinite loop
                        img.src = `https://picsum.photos/seed/${i + 15}/400/400`; // Fast lightweight load
                    };

                    el.appendChild(img);
                    this.container.appendChild(el);

                    // Symmetrical fixed size factor so every item is exactly the identical size and uniform gaps hold
                    const chosenFactor = 0.9;
                    const randDriftX = (Math.random() - 0.5) * 1.5;
                    const randDriftY = (Math.random() - 0.5) * 1.5;

                    this.items.push({
                        el: el,
                        basex: 0,
                        basey: 0,
                        index: i,
                        sizeFactor: chosenFactor,
                        // Random base drift momentum for "real" zero gravity 
                        baseDriftX: randDriftX,
                        baseDriftY: randDriftY,
                        driftX: randDriftX,
                        driftY: randDriftY,
                        // Persistent smooth 3D rotation states
                        rotX: 0,
                        rotY: 0
                    });
                }
                this.recalcPositions();
            }

            recalcPositions() {
                for (let i = 0; i < this.items.length; i++) {
                    const item = this.items[i];
                    item.el.style.width = `${this.itemSizePx * item.sizeFactor}px`;
                    item.el.style.height = `${this.itemSizePx * item.sizeFactor}px`;

                    const col = i % this.cols;
                    const row = Math.floor(i / this.cols);

                    // Symmetrical Diagonal Grid Layout
                    // Push every column down by exactly half its Y height sequentially to create perfect diagonal steps
                    const diagonalStagger = col * (this.stepY / 2);

                    // Compute final base coordinates symmetrically spread from center origin
                    item.basex = (col * this.stepX) - (this.gridWidth / 2) + (this.stepX / 2);
                    item.basey = (row * this.stepY) - (this.gridHeight / 2) + (this.stepY / 2) + diagonalStagger;
                }
            }

            bindEvents() {
                // Bind to window instead of container so dragging on blank margin space still pans the canvas
                window.addEventListener('pointerdown', (e) => {
                    // Ignore clicks if list view or specific view is open
                    if (this.isListView || document.getElementById('specific-view').classList.contains('active')) return;

                    this.state.isDragging = true;
                    this.state.lastPointer.x = e.clientX;
                    this.state.lastPointer.y = e.clientY;
                    this.state.velX = 0;
                    this.state.velY = 0;
                    gsap.killTweensOf(this.state);
                    cursor.classList.add('active');
                });

                window.addEventListener('pointermove', (e) => {
                    if (!this.state.isDragging) return;

                    const dx = e.clientX - this.state.lastPointer.x;
                    const dy = e.clientY - this.state.lastPointer.y;

                    this.state.targetX += dx;
                    this.state.targetY += dy;

                    this.state.velX = dx;
                    this.state.velY = dy;

                    this.state.lastPointer.x = e.clientX;
                    this.state.lastPointer.y = e.clientY;
                });

                window.addEventListener('pointerup', () => {
                    this.state.isDragging = false;
                    cursor.classList.remove('active');
                });

                // Bind wheel to window instead of container so it catches scrolls anywhere on empty screen
                window.addEventListener('wheel', (e) => {
                    if (this.isListView) return; // Disable canvas scroll math in list mode
                    this.state.targetX -= e.deltaX * 1.5;
                    this.state.targetY -= e.deltaY * 1.5;
                    this.state.velX = -e.deltaX * 0.5;
                    this.state.velY = -e.deltaY * 0.5;
                }, { passive: true });

                // Specific View (Double Click + Click to close) logic
                this.items.forEach(item => {
                    item.el.addEventListener('dblclick', () => {
                        if (this.isListView) return;
                        const src = item.el.querySelector('img').src;
                        document.getElementById('specific-img').src = src;
                        document.getElementById('specific-view').classList.add('active');
                    });
                });

                // Click to close via "X" button
                document.getElementById('close-specific').addEventListener('click', () => {
                    document.getElementById('specific-view').classList.remove('active');
                });

                // Click to close via clicking anywhere on the blurred background overlay
                document.getElementById('specific-view').addEventListener('click', (e) => {
                    if (e.target.id === 'specific-view') {
                        document.getElementById('specific-view').classList.remove('active');
                    }
                });

                // Keyboard interactions (Space to Reset, Enter to Toggle List, M to toggle Space)
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

                            // Remove inline transform translations used for 2D parallax
                            this.items.forEach(item => {
                                gsap.set(item.el, { clearProps: "transform,x,y,rotationX,rotationY" });
                            });
                        } else {
                            showcase.classList.remove('list-view-mode');
                            showcase.style.overflowY = 'hidden';
                            if (dragMsg) dragMsg.classList.remove('hidden'); // Show Drag msg again
                            const resetHelperNode2 = document.getElementById('reset-helper');
                            if (resetHelperNode2) resetHelperNode2.classList.remove('hidden');
                            if (spWrapper) spWrapper.style.display = 'block';
                            if (listViewHelperText) listViewHelperText.innerText = 'List View';

                            // Snap to original state before turning renderer back on to prevent jumping
                            this.state.x = 0;
                            this.state.y = 0;
                            this.state.targetX = 0;
                            this.state.targetY = 0;

                            gsap.ticker.add(this.renderBound); // restart loop
                        }
                    }
                });

                // Cache bound function to cleanly add/remove from GSAP ticker
                this.renderBound = this.render.bind(this);
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

                const limitX = this.gridWidth / 2;
                const limitY = this.gridHeight / 2;

                // Real-time zero gravity baseline calculation
                const time = Date.now() * 0.001;

                for (let i = 0; i < this.items.length; i++) {
                    const item = this.items[i];

                    // REAL Zero Gravity: Un-anchor from the grid and continuously drift through space
                    if (spaceModeActive) {
                        // Absorb pan inertia (drag/scroll) to physically scatter the photos in zero gravity
                        item.driftX += globalVelX * 0.02 * item.sizeFactor;
                        item.driftY += globalVelY * 0.02 * item.sizeFactor;

                        // Smoothly dissipate the absorbed inertia back to the base resting drift speed
                        item.driftX += (item.baseDriftX - item.driftX) * 0.08;
                        item.driftY += (item.baseDriftY - item.driftY) * 0.08;

                        item.basex += item.driftX;
                        item.basey += item.driftY;

                        // Slowly slowly wrap the basex/basey within massive bounds so they never totally vanish
                        item.basex = this.wrap(item.basex, -this.gridWidth, this.gridWidth);
                        item.basey = this.wrap(item.basey, -this.gridHeight, this.gridHeight);
                    } else {
                        // Return slowly back to their home grid slots
                        const col = i % this.cols;
                        const row = Math.floor(i / this.cols);
                        const diagonalStagger = col * (this.stepY / 2);
                        const homeX = (col * this.stepX) - (this.gridWidth / 2) + (this.stepX / 2);
                        const homeY = (row * this.stepY) - (this.gridHeight / 2) + (this.stepY / 2) + diagonalStagger;

                        item.basex += (homeX - item.basex) * 0.05;
                        item.basey += (homeY - item.basey) * 0.05;
                    }

                    let absoluteX = item.basex + this.state.x;
                    let absoluteY = item.basey + this.state.y;

                    // Infinite wrapping magic boundaries
                    let wrappedX = this.wrap(absoluteX, -limitX, limitX);
                    let wrappedY = this.wrap(absoluteY, -limitY, limitY);

                    // Add trippy zero-gravity float and 3D velocity rotation effect if space mode is active
                    let floatX = 0;
                    let floatY = 0;

                    if (spaceModeActive) {
                        floatX = Math.sin(time + item.index) * 15;
                        floatY = Math.cos(time + item.index) * 15;

                        // Smooth fluid 3D Physics: Calculate target rotation based on reduced pan velocity (0.5 instead of 1.5)
                        let targetRotY = -globalVelX * 0.5;
                        let targetRotX = globalVelY * 0.5;

                        // Cap target rotation mathematically to prevent complete flipping
                        targetRotY = Math.max(-30, Math.min(30, targetRotY));
                        targetRotX = Math.max(-30, Math.min(30, targetRotX));

                        // Lerp the item's persistent rotation towards the target slowly for a water-like smooth bend
                        item.rotX += (targetRotX - item.rotX) * 0.1;
                        item.rotY += (targetRotY - item.rotY) * 0.1;
                    } else {
                        // Smoothly reset rotations to zero when turning TRIPP mode off
                        item.rotX += (0 - item.rotX) * 0.1;
                        item.rotY += (0 - item.rotY) * 0.1;
                    }

                    // Use fast set for 60fps 
                    gsap.set(item.el, {
                        x: wrappedX + floatX,
                        y: wrappedY + floatY,
                        rotationX: item.rotX,
                        rotationY: item.rotY
                    });
                }
            }

            // Proper context cleanup method mapping
            destroy() {
                gsap.ticker.remove(this.renderBound);
                window.removeEventListener('resize', this.updateMetrics);
            }
        }

        // --- DEPLOY INSTANCE ---
        const graphicCanvas = new InfiniteCanvas('canvas-container', {
            imageSize: '20',       // 20vw sizing base
            numberOfImages: 400,   // Massive grid of 400 elements to cover all empty bounds
            imageRootPath: 'images/custom', // Exact path matching the user request
            gap: '0.5'             // Minimal 0.5vw gap so images are nearly touching
        });

        // --- SPACE MODE 3D ENGINE ---
        let spaceModeActive = false;
        const spaceCanvas = document.getElementById('space-canvas');
        const ctx = spaceCanvas.getContext('2d');
        let stars = [];
        const numStars = 800;
        let spaceAnimationId;

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

            // Subtle center drift
            const cx = spaceCanvas.width / 2;
            const cy = spaceCanvas.height / 2;

            stars.forEach(star => {
                // Move stars towards viewer natively, but dramatically react to user pan velocity 
                star.z -= 0.5;

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
                }

                // Calculate 3D projection
                const k = 128.0 / star.z;
                const px = (star.x - cx) * k + cx;
                const py = (star.y - cy) * k + cy;
                const size = Math.max(0.1, star.size * k);

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
            if (showcase.classList.contains('list-view-mode') && !spaceModeActive) {
                return;
            }

            const btn = document.getElementById('tripp-toggle-btn');
            const btnText = document.getElementById('tripp-btn-text');
            const showcaseCanvas = document.querySelector('.infinite-canvas');

            // Find origin position from the button
            const btnRect = btn.getBoundingClientRect();
            const originX = btnRect.left + btnRect.width / 2;
            const originY = btnRect.top + btnRect.height / 2;

            const isGoingTripp = !spaceModeActive;
            const liquidColor = isGoingTripp ? 'var(--brand-yellow)' : 'var(--deep-black)';
            const _isMobileEffect = window.innerWidth <= 900;

            // Create container for spill animation
            const spillContainer = document.createElement('div');
            spillContainer.style.position = 'fixed';
            spillContainer.style.zIndex = '50';
            spillContainer.style.pointerEvents = 'none';

            if (!_isMobileEffect) {
                // Add SVG filter for gooey drips if not present (Desktop only - heavy on mobile)
                if (!document.getElementById('goo-filter-svg')) {
                    const svgNS = "http://www.w3.org/2000/svg";
                    const svg = document.createElementNS(svgNS, "svg");
                    svg.id = "goo-filter-svg";
                    svg.style.position = "absolute";
                    svg.style.width = "0";
                    svg.style.height = "0";
                    svg.style.visibility = "hidden";
                    svg.innerHTML = `
                        <defs>
                            <filter id="goo">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
                                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -15" result="goo" />
                                <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
                            </filter>
                        </defs>
                    `;
                    document.body.appendChild(svg);
                }
                spillContainer.style.inset = '-300px'; // Generous overflow for splatters
                spillContainer.style.filter = 'url(#goo)';
                spillContainer.style.WebkitFilter = 'url(#goo)';
            } else {
                spillContainer.style.inset = '-150px'; // Increased inset for mobile to fix bottom gap
            }
            document.body.appendChild(spillContainer);

            // Helper to create liquid blobs
            const createBlob = () => {
                const drop = document.createElement('div');
                drop.style.position = 'absolute';
                // Offset origin by the inset of the container
                const insetOffset = _isMobileEffect ? 150 : 300;
                drop.style.left = (originX + insetOffset) + 'px';
                drop.style.top = (originY + insetOffset) + 'px';
                drop.style.width = '0px';
                drop.style.height = '0px';
                drop.style.borderRadius = '50%';
                drop.style.background = liquidColor;
                spillContainer.appendChild(drop);

                // GSAP transforms for perfect centering
                gsap.set(drop, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
                return drop;
            };

            const mainBlob = createBlob();
            // Splash droplets (12 for desktop, 0 on mobile to prevent lag)
            const droplets = _isMobileEffect ? [] : Array.from({ length: 12 }).map(() => createBlob());

            const maxDist = Math.hypot(
                Math.max(originX, window.innerWidth - originX),
                Math.max(originY, window.innerHeight - originY)
            );
            // Overshoot target size to cover screen completely despite goo erosion
            const targetSize = maxDist * (_isMobileEffect ? 4.5 : 2.8);

            btn.style.pointerEvents = 'none';

            // High velocity timeline
            const tl = gsap.timeline({
                onComplete: () => {
                    // Toggle exactly when screen is fully covered by liquid
                    spaceModeActive = !spaceModeActive;
                    document.body.classList.toggle('space-mode-active');

                    if (spaceModeActive) {
                        btn.classList.add('active-tripp');
                        btnText.innerText = 'TRIPPING';
                        initSpace();
                        animateSpace();
                        window.addEventListener('resize', resizeSpace);

                        // Modern, sharp, super smooth entry
                        gsap.set(showcaseCanvas, { scale: 1.15, opacity: 0 });
                        gsap.to(showcaseCanvas, { scale: 1, opacity: 0.9, duration: 1.2, ease: "power3.out" });
                    } else {
                        btn.classList.remove('active-tripp');
                        btnText.innerText = 'TRIPP';
                        cancelAnimationFrame(spaceAnimationId);
                        window.removeEventListener('resize', resizeSpace);

                        // Gentle settle back
                        gsap.set(showcaseCanvas, { scale: 0.9, opacity: 0 });
                        gsap.to(showcaseCanvas, { scale: 1, opacity: 0.9, duration: 1.2, ease: "power3.out" });
                    }

                    // Morphing fade out
                    gsap.to(spillContainer, {
                        opacity: 0,
                        duration: 0.4,
                        ease: "power2.inOut",
                        onComplete: () => {
                            spillContainer.remove();
                            btn.style.pointerEvents = 'auto';
                        }
                    });
                }
            });

            // Fast, punchy animations
            // 1. Splatter out droplets violently
            droplets.forEach((drop, i) => {
                const angle = (i / droplets.length) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
                const dist = 60 + Math.random() * (window.innerWidth * 0.35);
                const size = 30 + Math.random() * 80;

                // Shoot out fast
                tl.to(drop, {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    width: size,
                    height: size,
                    duration: 0.4 + Math.random() * 0.2,
                    ease: "power3.out"
                }, 0);

                // Merge back into main blob expanding
                tl.to(drop, {
                    width: targetSize * 0.6,
                    height: targetSize * 0.6,
                    duration: 0.5,
                    ease: "expo.in"
                }, 0.2);
            });

            // 2. Main blob expands radically
            tl.to(mainBlob, {
                width: targetSize,
                height: targetSize,
                duration: 0.6,
                ease: "expo.inOut"
            }, 0.1);
        }

        // Bind click to the new UI button
        document.getElementById('tripp-toggle-btn').addEventListener('click', toggleSpaceMode);

    

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
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
            transform-style: preserve-3d;
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
            transform: translate(-50%, -50%);
            will-change: transform;
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
            object-fit: cover;
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

        .features-list {
            position: fixed;
            top: 40px;
            right: 50px;
            z-index: 100;
            display: flex;
            flex-direction: column;
            gap: 15px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.6rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.6);
            mix-blend-mode: difference;
            text-align: right;
            pointer-events: none;
        }

        .feature-item {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            pointer-events: auto;
            cursor: pointer;
            transition: opacity 0.5s ease;
        }

        .feature-item.hidden {
            opacity: 0 !important;
            pointer-events: none;
        }

        .feature-key {
            background: rgba(255, 255, 255, 0.1);
            color: var(--brand-yellow);
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid rgba(235, 215, 63, 0.3);
            font-weight: 600;
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
            /* Crucial for CSS column masonry */
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
            /* Keeps image structurally sound without squeezing */
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
        }

        @media (max-width: 900px) {
            .list-view-mode .infinite-canvas {
                column-count: 2;
            }
        }

        @media (max-width: 500px) {
            .list-view-mode .infinite-canvas {
                column-count: 1;
            }
        }

        /* Mobile specific adjustments for guidelines */
        @media (max-width: 900px) {
            .drag-instruction {
                bottom: 100px;
                white-space: nowrap;
            }
            .features-list {
                font-size: 0.5rem;
                top: 80px;
                right: 20px;
                gap: 10px;
            }
            #list-view-helper {
                display: none !important;
            }
            .desktop-text {
                display: none !important;
            }
            .mobile-text {
                display: inline !important;
            }
        }

        .mobile-text {
            display: none;
        }

        /* Specific View overlay for Double Click */
        .specific-view-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            /* Lighter background for visibility */
            z-index: 9000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
            backdrop-filter: blur(8px);
            /* Lighter blur to see the space/grid behind it */
            cursor: pointer;
            /* Indicate it's clickable to close */
        }

        .specific-view-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .specific-view-img {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            transform: scale(0.9);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .specific-view-overlay.active .specific-view-img {
            transform: scale(1);
        }

        .close-specific-view {
            position: absolute;
            top: 40px;
            right: 50px;
            color: var(--pure-white);
            font-family: 'Panchang', sans-serif;
            font-size: 0.8rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            cursor: pointer;
            pointer-events: auto;
            transition: color 0.3s ease;
        }

        .close-specific-view:hover {
            color: var(--brand-yellow);
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
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.1);
            /* Ethereal glow in space */
        }
    ` }} />

      <div>
  {/* 3D Space Background */}
  <canvas id="space-canvas" />
  <a href="/" className="nav-back"><i className="uil uil-arrow-left" /></a>
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
  <div className="features-list">
    <div className="feature-item" id="list-view-helper"><span>List View</span><span className="feature-key"><span className="desktop-text">Enter</span><span className="mobile-text">Tap</span></span>
    </div>
    <div className="feature-item"><span>Specific View</span><span className="feature-key"><span className="desktop-text">Double Click</span><span className="mobile-text">Double Tap</span></span></div>
  </div>
  <div className="cursor" id="cursor" />
  <div className="drag-instruction" id="drag-msg">Drag / Scroll to Explore</div>
  {/* Specific View Overlay Container */}
  <div className="specific-view-overlay" id="specific-view">
    <div className="close-specific-view" id="close-specific">Close ×</div>
    <img src className="specific-view-img" id="specific-img" alt="Specific View" />
  </div>
  {/* Drop-in wrapper mimicking user's React implementation */}
  <div id="portfolio-showcase">
    <div className="infinite-canvas" id="canvas-container">
      {/* Items injected by JS */}
    </div>
  </div>
</div>


    </>
  );
}
