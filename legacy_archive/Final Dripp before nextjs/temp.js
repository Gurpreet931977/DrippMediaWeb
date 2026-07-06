
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

    