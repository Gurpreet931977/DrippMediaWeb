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
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.15,
                ease: "power2.out"
            });
        });

        // Hover effect for the cursor
        const interactables = document.querySelectorAll('a, button, .card-overlay');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('active'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });

        const fsButtons = document.querySelectorAll('.fs-btn');
        fsButtons.forEach(btn => {
            btn.addEventListener('mouseenter', () => cursor.classList.add('active'));
            btn.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });

        // Horizontal Scroll via Mouse Wheel & Trackpad
        const pinContainer = document.getElementById('pin-container');
        const handleWheel = (e) => {
            // Use deltaY if available, otherwise deltaX (supports both vertical wheels and trackpad horizontal swipes)
            const delta = Math.abs(e.deltaY) > 0 ? e.deltaY : e.deltaX;
            if (Math.abs(delta) > 0) {
                e.preventDefault();
                gsap.to(pinContainer, {
                    scrollLeft: pinContainer.scrollLeft + delta * 3.5, // 3.5x multiplier for good speed
                    duration: 0.6,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            }
        };
        pinContainer.addEventListener('wheel', handleWheel, { passive: false });

        // Premium Drag-to-Scroll Functionality with Momentum
        let isDown = false;
        let startX;
        let scrollLeftPos;
        let isDragging = false;
        let velocity = 0;
        let lastX = 0;

        pinContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            startX = e.pageX - pinContainer.offsetLeft;
            scrollLeftPos = pinContainer.scrollLeft;
            lastX = e.pageX;
            gsap.killTweensOf(pinContainer); // Stop any ongoing scroll animation
            cursor.classList.add('active'); // Indicate grabbing
        });

        const beginMomentum = () => {
            if (isDown) {
                isDown = false;
                cursor.classList.remove('active');
                
                // If there's enough velocity, smoothly glide it to a stop
                if (Math.abs(velocity) > 1) {
                    gsap.to(pinContainer, {
                        scrollLeft: pinContainer.scrollLeft - (velocity * 12),
                        duration: 0.8,
                        ease: "power2.out",
                        overwrite: "auto"
                    });
                }
            }
        };

        pinContainer.addEventListener('mouseleave', beginMomentum);
        pinContainer.addEventListener('mouseup', beginMomentum);

        pinContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - pinContainer.offsetLeft;
            const walk = (x - startX) * 1.3; // 1.3x feels much smoother and more 1:1 than 2x
            if (Math.abs(walk) > 5) isDragging = true;
            
            velocity = e.pageX - lastX;
            lastX = e.pageX;

            pinContainer.scrollLeft = scrollLeftPos - walk;
        });

        // Prevent accidental link clicks when dragging
        pinContainer.addEventListener('click', (e) => {
            if (isDragging) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { capture: true });


        // Full Screen Functionality (In-Browser window maximization)
        const fsBtns = document.querySelectorAll('.fs-btn');
        const fsModal = document.getElementById('fs-modal');
        const fsCloseBtn = document.getElementById('fs-close-btn');
        let currentFullscreenCard = null;

        // Hover effect for the modal close button
        fsCloseBtn.addEventListener('mouseenter', () => cursor.classList.add('active'));
        fsCloseBtn.addEventListener('mouseleave', () => cursor.classList.remove('active'));

        fsBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('ext-btn')) return; // Allow normal link click
                
                e.preventDefault();
                currentFullscreenCard = btn.closest('.web-card');
                const iframe = currentFullscreenCard.querySelector('.web-iframe');

                // Move iframe directly into the modal container to detach it from 3D scaling
                fsModal.appendChild(iframe);

                // Expose and fade in modal
                fsModal.style.display = 'block';
                // Trigger reflow to guarantee CSS transition
                void fsModal.offsetWidth;
                fsModal.classList.add('active');
            });
        });

        // Close logic
        fsCloseBtn.addEventListener('click', () => {
            if (currentFullscreenCard) {
                const iframe = fsModal.querySelector('.web-iframe');
                // Move the actual iframe back exactly where it was before the overlay to preserve state
                const overlay = currentFullscreenCard.querySelector('.card-overlay');
                currentFullscreenCard.insertBefore(iframe, overlay);
            }

            // Fade out
            fsModal.classList.remove('active');
            setTimeout(() => {
                fsModal.style.display = 'none';
                currentFullscreenCard = null;
            }, 400); // Waits for the opacity transition
        });

        // Fix cursor when entering the iframe
        const webCards = document.querySelectorAll('.web-card');
        webCards.forEach(card => {
            const overlay = card.querySelector('.card-overlay');

            card.addEventListener('mouseenter', () => {
                overlay.addEventListener('mouseleave', () => {
                    cursor.classList.add('hidden');
                }, { once: true });
            });

            card.addEventListener('mouseleave', () => {
                cursor.classList.remove('hidden');
                overlay.addEventListener('mouseleave', () => {
                    cursor.classList.add('hidden');
                }, { once: true });
            });
        });

    return () => {
        pinContainer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-scroll-guide { display: none; }

        :root {
            --deep-black: #050505;
            --pure-white: #ffffff;
            --brand-yellow: #ebd73f;
            --glass-bg: rgba(255, 255, 255, 0.03);
            --glass-border: rgba(255, 255, 255, 0.08);
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
            overflow: hidden; /* Prevent all scroll on body, pin-container handles it */
            overscroll-behavior: none;
            width: 100vw;
            height: 100dvh;
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
            transition: width 0.3s, height 0.3s, background-color 0.3s, border-color 0.3s;
        }

        .cursor.active {
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.1);
            border-color: transparent;
            backdrop-filter: blur(2px);
        }

        .cursor.hidden {
            opacity: 0;
        }

        /* Navigation */
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

        /* Header Info */
        .portfolio-header {
            position: fixed;
            top: 40px;
            right: 50px;
            z-index: 100;
            text-align: right;
            pointer-events: none;
            mix-blend-mode: difference;
        }

        .portfolio-header h1 {
            font-family: 'Panchang', sans-serif;
            font-weight: 800;
            font-size: 2rem;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--pure-white);
        }

        .portfolio-header p {
            font-size: 0.8rem;
            color: var(--brand-yellow);
            letter-spacing: 4px;
            text-transform: uppercase;
            margin-top: 5px;
            font-weight: 600;
        }

        /* Main Sliding Wrapper */
        #pin-container {
            height: 100dvh;
            width: 100vw;
            overflow-x: auto;
            overflow-y: hidden;
            /* scroll-behavior: smooth; removed to prevent conflict with GSAP */
        }

        .slider-wrap {
            width: max-content;
            height: 100dvh;
            display: flex;
            align-items: center;
            padding: 0 10vw;
        }

        /* Creative Card Design */
        .web-card {
            position: relative;
            width: 70vw;
            height: 70dvh;
            border-radius: 20px;
            margin-right: 10vw;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            overflow: hidden;
            flex-shrink: 0;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8);
            transform-style: preserve-3d;
            perspective: 1500px;
            transition: border-color 0.5s ease, box-shadow 0.5s ease;
        }

        .web-card:hover {
            border-color: rgba(235, 215, 63, 0.5);
            box-shadow: 0 40px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(235, 215, 63, 0.15);
        }

        /* Iframe styling */
        .web-iframe {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
            z-index: 1;
            border-radius: 20px;
        }

        /* Mobile Image Fallback (Hidden on Desktop) */
        .web-image-fallback {
            display: none;
        }

        .visit-btn {
            display: none;
        }

        /* Initial Overlay blocks interactions and shows info */
        .card-overlay {
            position: absolute;
            inset: 0;
            z-index: 10;
            background: linear-gradient(to top, rgba(5, 5, 5, 1) 0%, rgba(5, 5, 5, 0.4) 50%, transparent 100%);
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 50px;
            transition: opacity 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
        }

        .web-card:hover .card-overlay {
            opacity: 0;
            pointer-events: none;
        }

        /* Card Content Text */
        .card-meta {
            transform: translateY(30px);
            transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .web-card:hover .card-meta {
            transform: translateY(0);
        }

        .card-badge {
            align-self: flex-start;
            background: rgba(235, 215, 63, 0.1);
            color: var(--brand-yellow);
            padding: 8px 16px;
            border-radius: 30px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.65rem;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            border: 1px solid rgba(235, 215, 63, 0.3);
            margin-bottom: 20px;
            display: inline-block;
        }

        .card-title {
            font-family: 'Panchang', sans-serif;
            font-weight: 800;
            font-size: 3rem;
            color: var(--pure-white);
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: -1px;
            text-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
            line-height: 1.1;
        }

        .card-desc {
            font-size: 1.1rem;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.7);
            max-width: 60%;
        }

        /* Full Screen Button */
        .fs-btn {
            position: absolute;
            top: 25px;
            right: 25px;
            width: 55px;
            height: 55px;
            background: rgba(5, 5, 5, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--pure-white);
            font-size: 1.5rem;
            z-index: 20;
            opacity: 0;
            transform: scale(0.8) translateY(-10px);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: none;
        }

        .web-card:hover .fs-btn {
            opacity: 1;
            transform: scale(1) translateY(0);
            pointer-events: auto;
        }

        .fs-btn:hover {
            background: var(--brand-yellow);
            color: var(--deep-black);
            border-color: var(--brand-yellow);
            transform: scale(1.1) translateY(0) !important;
        }

        /* Scroll instruction */
        .scroll-instruction {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Panchang', sans-serif;
            font-size: 0.65rem;
            letter-spacing: 4px;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.4);
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            z-index: 50;
            white-space: nowrap;
            text-align: center;
        }

        .scroll-line {
            width: 1px;
            height: 30px;
            background: linear-gradient(to bottom, var(--brand-yellow), transparent);
            animation: scrolldown 2s infinite;
        }

        @keyframes scrolldown {
            0% {
                transform: scaleY(0);
                transform-origin: top;
            }

            50% {
                transform: scaleY(1);
                transform-origin: top;
            }

            51% {
                transform: scaleY(1);
                transform-origin: bottom;
            }

            100% {
                transform: scaleY(0);
                transform-origin: bottom;
            }
        }

        /* Background grid effect for the page */
        .bg-grid {
            position: fixed;
            inset: 0;
            background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 5vw 5vw;
            z-index: -1;
            pointer-events: none;
            mask-image: linear-gradient(to bottom, transparent, black, transparent);
            -webkit-mask-image: linear-gradient(to bottom, transparent, black, transparent);
        }

        /* In-Browser Fullscreen Modal */
        #fs-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: var(--deep-black);
            display: none;
            opacity: 0;
            transition: opacity 0.4s ease;
        }

        #fs-modal.active {
            display: block;
            opacity: 1;
        }

        #fs-modal iframe {
            width: 100vw;
            height: 100dvh;
            border: none;
        }

        .fs-close-btn {
            position: absolute;
            top: 30px;
            right: 40px;
            z-index: 100000;
            background: rgba(5, 5, 5, 0.8);
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            width: 50px;
            height: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--pure-white);
            font-size: 1.5rem;
            transition: all 0.3s ease;
            pointer-events: auto;
        }

        .fs-close-btn:hover {
            background: var(--brand-yellow);
            color: var(--deep-black);
            border-color: var(--brand-yellow);
            transform: scale(1.1);
        }

        @media screen and (max-width: 1000px) {

            .mobile-scroll-guide {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.4);
                font-family: 'Panchang', sans-serif;
                font-size: 0.55rem;
                letter-spacing: 3px;
                text-transform: uppercase;
                z-index: 999;
                pointer-events: none;
                animation: gentlePulse 3s ease-in-out infinite;
                text-align: center;
                display: block;
            }

            @keyframes gentlePulse {
                0%, 100% { opacity: 0.3; transform: translate(-50%, 0); }
                50% { opacity: 0.8; transform: translate(-50%, -5px); }
            }

            body {
                overflow: hidden;
                overscroll-behavior: none;
                height: 100dvh;
                margin: 0;
                position: fixed;
                width: 100vw;
            }
            #pin-container {
                height: 100dvh;
                width: 100vw;
                overflow-x: auto;
                overflow-y: hidden;
                scroll-snap-type: x mandatory;
                -webkit-overflow-scrolling: touch;
            }
            .slider-wrap {
                width: max-content;
                height: 100dvh;
                display: flex;
                flex-direction: row;
                padding: 0 10vw;
                gap: 5vw;
                align-items: center;
            }
            .web-card {
                width: 80vw;
                height: 70dvh;
                margin-right: 0;
                border-radius: 20px;
                border: 1px solid var(--glass-border);
                scroll-snap-align: center;
                flex: 0 0 80vw;
                position: relative;
                overflow: hidden;
            }

            /* Hide Desktop Elements */
            .web-iframe, .fs-btn {
                display: none !important;
            }

            /* Show & Style Mobile Static Images */
            .web-image-fallback {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
                z-index: 1;
                position: absolute;
                inset: 0;
            }

            .card-overlay {
                opacity: 1 !important; /* Always visible on mobile */
                pointer-events: auto !important;
                background: linear-gradient(to top, rgba(5, 5, 5, 0.95) 0%, rgba(5, 5, 5, 0.6) 40%, transparent 100%);
                padding: 40px 20px 80px 20px;
                justify-content: flex-end;
                z-index: 10;
            }

            .card-meta {
                transform: none !important; /* No hover lift needed */
            }

            .card-title {
                font-size: 2.2rem;
                margin-bottom: 8px;
            }

            .card-desc {
                max-width: 100%;
                font-size: 1rem;
                line-height: 1.4;
                margin-bottom: 20px;
            }

            .visit-btn {
                display: inline-block;
                padding: 14px 28px;
                background: var(--pure-white);
                color: var(--deep-black);
                font-family: 'Panchang', sans-serif;
                font-size: 0.8rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-decoration: none;
                border-radius: 30px;
                transition: transform 0.2s ease, background 0.3s ease;
                pointer-events: auto; /* allow clicking */
            }
            .visit-btn:active {
                transform: scale(0.95);
            }
            .visit-btn i {
                margin-left: 6px;
                font-size: 1rem;
                vertical-align: middle;
            }

            .scroll-instruction {
                display: none !important;
            }

            .features-list {
                display: none !important;
            }

            .portfolio-header {
                display: none !important;
            }

            .desktop-text { display: none !important; }
            .mobile-text { display: inline !important; }
        }

        .mobile-text { display: none; }
    ` }} />

      <div>
  <div className="mobile-scroll-guide">
    <i className="uil uil-angle-up" /> Scroll
  </div>
  {/* Target Frame for Full Screen Mode */}
  <div id="fs-modal">
    <button className="fs-close-btn" id="fs-close-btn"><i className="uil uil-times" /></button>
    {/* iframe injected via JS */}
  </div>
  {/* Ambient Background */}
  <div className="bg-grid" />
  <div className="cursor" id="cursor" />
  <a href="/" className="nav-back"><i className="uil uil-arrow-left" /></a>
  <div className="portfolio-header">
    <h1>Web Portfolio</h1>
    <p>Interactive Experiences</p>
  </div>
  {/* ScrollTrigger Pin Wrapper */}
  <div id="pin-container">
    {/* Horizontal Slider */}
    <div className="slider-wrap" id="slider-wrap">
      {/* Card 1 */}
      <div className="web-card">
        <button className="fs-btn" title="Fullscreen"><i className="uil uil-expand-arrows" /></button>
        <iframe className="web-iframe" src="https://www.bharatup.online" title="BharatUp" loading="lazy" />
        <img className="web-image-fallback" src="https://picsum.photos/seed/bharatup/800/1600" alt="BharatUp Mockup" />
        <div className="card-overlay">
          <div>
            <div className="card-badge">E-Learning Platform</div>
          </div>
          <div className="card-meta">
            <div className="card-title">BharatUp</div>
            <div className="card-desc">Online educational platform bridging the gap between students and knowledge.</div>
            <a href="https://www.bharatup.online" target="_blank" className="visit-btn">Experience <i className="uil uil-arrow-up-right" /></a>
          </div>
        </div>
      </div>
      {/* Card 3 (Now 2) */}
      <div className="web-card">
        <button className="fs-btn" title="Fullscreen"><i className="uil uil-expand-arrows" /></button>
        <iframe className="web-iframe" src="https://www.pinakacareclinic.com" title="Pinaka Care Clinic" loading="lazy" />
        <img className="web-image-fallback" src="https://picsum.photos/seed/pinaka/800/1600" alt="Pinaka Care Clinic Mockup" />
        <div className="card-overlay">
          <div>
            <div className="card-badge">Healthcare</div>
          </div>
          <div className="card-meta">
            <div className="card-title">Pinaka Care Clinic</div>
            <div className="card-desc">Professional healthcare and medical clinic website providing a seamless patient experience.</div>
            <a href="https://www.pinakacareclinic.com" target="_blank" className="visit-btn">Experience <i className="uil uil-arrow-up-right" /></a>
          </div>
        </div>
      </div>
      {/* Card 4 (Now 3) */}
      <div className="web-card">
        <button className="fs-btn" title="Fullscreen"><i className="uil uil-expand-arrows" /></button>
        <iframe className="web-iframe" src="https://www.goatsociety.in" title="Goat Society" loading="lazy" />
        <img className="web-image-fallback" src="https://picsum.photos/seed/goatsociety/800/1600" alt="Goat Society Mockup" />
        <div className="card-overlay">
          <div>
            <div className="card-badge">Community Web</div>
          </div>
          <div className="card-meta">
            <div className="card-title">Goat Society</div>
            <div className="card-desc">Exclusive community and lifestyle brand platform.</div>
            <a href="https://www.goatsociety.in" target="_blank" className="visit-btn">Experience <i className="uil uil-arrow-up-right" /></a>
          </div>
        </div>
      </div>

      {/* Card 2 (Moved to Last) */}
      <div className="web-card">
        <button className="fs-btn" title="Fullscreen"><i className="uil uil-expand-arrows" /></button>
        <iframe className="web-iframe" src="https://rasmlai.vercel.app" title="Rasmlai AI" loading="lazy" />
        <img className="web-image-fallback" src="https://picsum.photos/seed/rasmlai/800/1600" alt="Rasmlai Mockup" />
        <div className="card-overlay">
          <div>
            <div className="card-badge">AI Application</div>
          </div>
          <div className="card-meta">
            <div className="card-title">Rasmlai AI</div>
            <div className="card-desc">Next-generation artificial intelligence interface built with modern web technologies.</div>
            <a href="https://rasmlai.vercel.app" target="_blank" className="visit-btn">Experience <i className="uil uil-arrow-up-right" /></a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div className="scroll-instruction">
    <span>Hover cards to experience / Slide <span style={{ fontSize: '0.75em', opacity: 0.7 }}>(Click & Drag)</span> to explore</span>
    <div className="scroll-line" />
  </div>
</div>


    </>
  );
}
