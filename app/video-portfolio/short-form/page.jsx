'use client';
import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGenz } from '../../contexts/GenzContext';

export default function Page() {
  const { isGenz } = useGenz() || { isGenz: false };
  const [isContracted, setIsContracted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
        setIsContracted(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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

    
        // Global mute state
        let isGlobalMuted = true;

        // Custom Cursor Logic
        const cursor = document.getElementById('cursor');
        if (cursor) {
            gsap.set(cursor, { xPercent: -50, yPercent: -50 });
            window.addEventListener('mousemove', (e) => {
                gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0.1, ease: "power2.out" });
                
                // Add creative trail during loading
                const loader = document.getElementById('initialLoader');
                if (loader) {
                    const trail = document.createElement('div');
                    trail.className = 'cursor-trail-particle';
                    trail.style.left = e.clientX + 'px';
                    trail.style.top = e.clientY + 'px';
                    document.body.appendChild(trail);
                    
                    gsap.to(trail, {
                        opacity: 0,
                        scale: 0.2,
                        x: "+=" + (Math.random() * 60 - 30),
                        y: "+=" + (Math.random() * 60 - 30),
                        duration: 0.8 + Math.random() * 0.5,
                        ease: "power2.out",
                        onComplete: () => trail.remove()
                    });
                }
            });
        }

        function attachCursorEvents(element) {
            if (!cursor) return;
            const clickables = element.querySelectorAll('button, a, .video-interact-layer, .sound-toggle, .comment-text-placeholder');
            clickables.forEach(el => {
                el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 1.5, backgroundColor: 'rgba(235, 215, 63, 0.2)', duration: 0.2 }));
                el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, backgroundColor: 'transparent', duration: 0.2 }));
            });
        }

        attachCursorEvents(document);

        // Mute/Unmute Logic
        const muteIconSVG = `<svg class="action-icon" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
        const unmuteIconSVG = `<svg class="action-icon" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

        function updateVolumeUI() {
            const allVideos = document.querySelectorAll('.reel-video');
            const allToggles = document.querySelectorAll('.sound-toggle');

            allVideos.forEach(v => v.muted = isGlobalMuted);
            allToggles.forEach(toggle => {
                toggle.innerHTML = isGlobalMuted ? muteIconSVG : unmuteIconSVG;
                if (!isGlobalMuted) {
                    toggle.style.borderColor = 'var(--brand-yellow)';
                    toggle.style.color = 'var(--brand-yellow)';
                } else {
                    toggle.style.borderColor = '';
                    toggle.style.color = '';
                }
            });
        }

        window.toggleMuteGlobal = function (element) {
            isGlobalMuted = !isGlobalMuted;
            updateVolumeUI();
            
            // If they interact with the sound button, ensure the video starts playing if it was paused by browser policy!
            const container = element.closest('.reel-content');
            if (container) {
                const vid = container.querySelector('.reel-video');
                const ambVid = container.parentElement.querySelector('.reel-ambient-bg');
                if (vid && vid.paused) {
                    vid.play().catch(()=>{});
                    if (ambVid) ambVid.play().catch(()=>{});
                    
                    // Also hide the play indicator since it's playing now
                    const indicator = container.querySelector('.center-indicator');
                    if (indicator) {
                        const icon = indicator.querySelector('.indicator-icon');
                        icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                        indicator.classList.remove('show');
                        void indicator.offsetWidth;
                        indicator.classList.add('show');
                        setTimeout(() => indicator.classList.remove('show'), 800);
                    }
                }
            }
        };

        // Case Study Sheet Logic (Mobile)
        window.openComments = function (btn) {
            const reelContent = btn.closest('.reel-content');
            const sheet = reelContent.querySelector('.case-study-sheet');
            sheet.classList.add('open');
        };

        window.closeComments = function (btn) {
            const sheet = btn.closest('.case-study-sheet');
            sheet.classList.remove('open');
        };

        // Intersection Observer to Auto-play videos when in view
        const reelsContainer = document.getElementById('reelsContainer');
        const observerOptions = {
            root: reelsContainer,
            rootMargin: '0px',
            threshold: 0.6 // Video needs to be 60% visible to play
        };

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const mainVid = entry.target.querySelector('.reel-video');
                const ambVid = entry.target.querySelector('.reel-ambient-bg');

                if (entry.isIntersecting) {
                    entry.target.classList.add('active'); // Triggers side-panel 3D animations

                    if (mainVid) mainVid.currentTime = 0;
                    if (ambVid) ambVid.currentTime = 0;

                    if (mainVid) {
                        const playPromise = mainVid.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => { 
                                console.log('Autoplay prevented', error); 
                                // If autoplay is blocked, the video is paused at 0s. 
                                // Cinematic videos often start with a black frame. 
                                // Let's check if there's a poster (thumbnail), if not, seek to 0.5s
                                setTimeout(() => {
                                    if (mainVid.paused && !mainVid.hasAttribute('poster')) {
                                        mainVid.currentTime = 0.5;
                                        if (ambVid) ambVid.currentTime = 0.5;
                                    }
                                }, 100);
                            });
                        }
                    }
                    if (ambVid) ambVid.play().catch(e => { });

                } else {
                    entry.target.classList.remove('active'); // Resets side-panel animations

                    if (mainVid) mainVid.pause();
                    if (ambVid) ambVid.pause();

                    const sheet = entry.target.querySelector('.comments-sheet');
                    if (sheet && sheet.classList.contains('open')) {
                        sheet.classList.remove('open');
                    }
                }
            });
        }, observerOptions);

        // Click to play/pause functionality & Double tap to Like
        window.togglePlay = function (event, layer) {
            const container = layer.parentElement;

            // Handle double tap to like
            if (layer.dataset.lastTap) {
                const now = new Date().getTime();
                const diff = now - parseInt(layer.dataset.lastTap);
                if (diff < 300) { // Double tap threshold
                    layer.dataset.lastTap = ""; // Reset
                    handleLike(container, true, event.clientX, event.clientY);
                    return; // Prevent play/pause on double tap
                }
            }
            layer.dataset.lastTap = new Date().getTime();

            // Normal Play/pause
            setTimeout(() => {
                if (layer.dataset.lastTap) { // Only play/pause if not double tapped
                    layer.dataset.lastTap = "";
                    const vid = container.querySelector('.reel-video');
                    const ambVid = container.parentElement.querySelector('.reel-ambient-bg');
                    const indicator = container.querySelector('.center-indicator');
                    const icon = indicator.querySelector('.indicator-icon');

                    if (vid.paused) {
                        vid.play();
                        if (ambVid) ambVid.play();
                        icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
                    } else {
                        vid.pause();
                        if (ambVid) ambVid.pause();
                        icon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                    }

                    indicator.classList.remove('show');
                    void indicator.offsetWidth;
                    indicator.classList.add('show');

                    setTimeout(() => {
                        indicator.classList.remove('show');
                    }, 800);
                }
            }, 300);
        };

        // Like Functionality
        window.toggleLike = function (btn) {
            const container = btn.closest('.reel-content');
            handleLike(container, false);
        };

        function handleLike(container, showBurst, x = window.innerWidth / 2, y = window.innerHeight / 2) {
            const heartBtn = container.querySelector('.icon-heart');
            const bg = heartBtn.closest('.action-icon-bg');

            // Toggle active state
            const isLiked = heartBtn.classList.toggle('liked');

            if (isLiked) {
                heartBtn.style.fill = 'var(--brand-yellow)';
                heartBtn.style.stroke = 'var(--brand-yellow)';
                bg.style.borderColor = 'var(--brand-yellow)';
                // re-trigger animation
                heartBtn.style.animation = 'none';
                void heartBtn.offsetWidth;
                heartBtn.style.animation = 'heartbeat 0.8s ease-in-out forwards';
            } else {
                heartBtn.style.fill = 'none';
                heartBtn.style.stroke = 'currentColor';
                bg.style.borderColor = '';
                heartBtn.style.animation = 'none';
            }

            if (showBurst) {
                const burst = document.createElement('div');
                burst.className = 'like-burst-container';

                const rect = container.getBoundingClientRect();
                burst.style.position = 'absolute';
                burst.style.left = (x - rect.left) + 'px';
                burst.style.top = (y - rect.top) + 'px';
                burst.style.transform = 'translate(-50%, -50%)';

                if (isLiked) {
                    // Heart SVG (Softer, rounded bottom)
                    const heartSvg = '<svg class="like-burst-heart active" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
                    let starsHTML = '';
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const tx = Math.cos(angle) * 70;
                        const ty = Math.sin(angle) * 70;
                        starsHTML += '<div class="pop-star active" style="--tx: ' + tx + 'px; --ty: ' + ty + 'px;"></div>';
                    }
                    burst.innerHTML = heartSvg + starsHTML;
                } else {
                    // Minimal fade out animation
                    const heartSvg = '<svg class="like-burst-heart unlike" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';
                    burst.innerHTML = heartSvg;
                }

                container.appendChild(burst);

                // Cleanup
                setTimeout(() => { burst.remove(); }, 1000);
            }
        }

        // Share functionality custom sheet
        window.openShare = function (btn) {
            const reelContent = btn.closest('.reel-content');
            const sheet = reelContent.querySelector('.share-sheet');
            sheet.classList.add('open');

            // Set link dynamically to exact reel ID
            const videoId = reelContent.dataset.id || '';
            const generateLink = window.location.origin + window.location.pathname + '?reel=' + videoId;
            const linkText = sheet.querySelector('.share-link-text');
            linkText.innerText = generateLink;
            linkText.dataset.link = generateLink;
        };

        window.closeShare = function (btn) {
            const sheet = btn.closest('.share-sheet');
            sheet.classList.remove('open');
        };

        window.copyShareLink = function (btn) {
            const link = btn.previousElementSibling.dataset.link;
            navigator.clipboard.writeText(link);
            const origText = "COPY";
            btn.innerText = "COPIED!";
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerText = origText;
                btn.classList.remove('copied');
            }, 2000);
        };

        // Fullscreen Functionality
        window.toggleFullscreen = function (btn) {
            const container = btn.closest ? btn.closest('.reel-content') : btn;
            if (container) {
                container.classList.toggle('clean-mode');
                document.body.classList.toggle('clean-mode-active');
            }
        };

        // Self-Healing Interceptor: Auto-Report Broken Video & Advance Feed
        window.handleVideoLoadError = function (videoEl, reelId, src) {
            console.warn('Video failed to load for reel:', reelId, src);
            
            // Auto-report to backend to hold for review
            if (reelId) {
                try {
                    fetch('/api/admin/portfolio/report-broken', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: reelId,
                            type: 'reels',
                            reason: 'Client playback error: Media source unreachable (404/Media Error)',
                            url: src
                        })
                    }).catch(() => {});
                } catch(e) {}
            }

            // Remove from active list
            if (portfolioVideosList && portfolioVideosList.length > 0) {
                portfolioVideosList = portfolioVideosList.filter(item => (item.id !== reelId && item.videoSrc !== src));
            }

            // Smoothly remove broken reel and advance to next valid reel
            const reelItem = videoEl.closest('.reel-item');
            if (reelItem) {
                const nextItem = reelItem.nextElementSibling;
                if (nextItem) {
                    nextItem.scrollIntoView({ behavior: 'smooth' });
                } else if (portfolioVideosList.length > 0) {
                    createReelHTML(portfolioVideosList[currentVideoIndex]);
                    currentVideoIndex = (currentVideoIndex + 1) % portfolioVideosList.length;
                    const newNext = reelItem.nextElementSibling;
                    if (newNext) newNext.scrollIntoView({ behavior: 'smooth' });
                }
                setTimeout(() => {
                    if (reelItem && reelItem.parentNode) {
                        reelItem.remove();
                    }
                }, 400);
            }
        };

        // --- Truly Infinite Scroll Logic - Sequential Array Loop ---
        let isAppending = false;

        const DEFAULT_REELS = [
            {
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                musicText: "Original Audio - Dripp Media Mix • Trending",
                description: "High-energy teaser for the latest urban lifestyle collection. Shot in 4K, 120fps with custom speed ramps."
            },
            {
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                musicText: "Synthwave Beats - Cyber City • Viral",
                description: "Cyberpunk inspired promotional reel for an upcoming tech launch. Emphasizing dynamic lighting."
            },
            {
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                musicText: "EDM Anthem - Soundscape • Top 50",
                description: "Recap montage capturing the raw energy of summer music festivals. Dynamic handheld shots."
            },
            {
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
                musicText: "Cinematic Score - Dripp Original",
                description: "Exclusive drop preview. Striking contrast, vibrant highlights, and unparalleled visual fidelity."
            },
            {
                videoSrc: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
                musicText: "Hip Hop Instrumental - LoFi Chills",
                description: "A slow-paced, mood-setting sequence designed to highlight individual product textures."
            }
        ];

        let portfolioVideosList = [...DEFAULT_REELS];
        let currentVideoIndex = 0; // The tracker

        const CTA_OPTIONS = [
            { title: "Let's work together", text: "We love teaming up with brands that want to stand out. Sound like you? Let's chat about your next project.", button: "Say hello" },
            { title: "Got an idea?", text: "The best videos start with a simple conversation. Tell us what you're thinking, and we'll help bring it to life.", button: "Let's talk" },
            { title: "Your story matters", text: "People connect with real stories. We can help you tell yours in a way that feels natural and looks amazing.", button: "Get in touch" },
            { title: "Need a fresh look?", text: "If your brand's visuals are feeling a bit tired, we'd love to help you give them a serious upgrade.", button: "Drop us a line" },
            { title: "Let's get creative", text: "We're always looking for fun, new challenges. Have something cool in mind? Let's brainstorm together.", button: "Start a conversation" },
            { title: "Ready to grow?", text: "Good videos don't just look pretty—they help your business grow. We can show you how.", button: "Contact us" },
            { title: "Stand out online", text: "It's hard to get noticed these days. We make content that stops the scroll and gets people watching.", button: "Reach out" },
            { title: "Behind the camera", text: "We're just a small team of creatives who love making cool stuff for good people. Want to be next?", button: "Message us" },
            { title: "Let's make some magic", text: "From the first idea to the final edit, we handle it all. You just sit back and watch it come together.", button: "Let's connect" },
            { title: "Curious how we work?", text: "We keep things simple, friendly, and stress-free. Reach out to see if we're a good fit for your brand.", button: "Say hi today" }
        ];

        const CREATIVE_QUOTES = [
            "Cinematography is infinite in its possibilities... much more so than music or language.",
            "A film is – or should be – more like music than like fiction. It should be a progression of moods and feelings.",
            "There are no rules in filmmaking. Only sins. And the cardinal sin is dullness.",
            "Photography is truth. The cinema is truth twenty-four times per second.",
            "The eye should learn to listen before it looks.",
            "We are artists. We are storytellers. We are the keepers of the narrative.",
            "Light is the language of the lens; shadow is its vocabulary.",
            "A great video doesn't just show you what happened; it makes you feel what it was like to be there.",
            "Every frame is a canvas. Every cut is a heartbeat.",
            "We don't capture reality. We create a reality that people want to escape into."
        ];

        // Create HTML for a single reel instance
        function createReelHTML(videoData) {
            if (!reelsContainer || !videoData) return;
            const src = videoData.videoSrc || videoData.video_src || videoData.video_url || videoData.url || videoData.src || '';
            const desc = videoData.description || videoData.desc || videoData.caption || '';
            const music = videoData.musicText || videoData.music_text || videoData.music || videoData.audio || videoData.title || 'Original Audio - Dripp Media';
            const caseStudy = videoData.caseStudy || videoData.case_study || desc || '';
            const posterUrl = videoData.thumbnail_url || '';
            
            if (!src) return;
            
            const randomCTA = CTA_OPTIONS[Math.floor(Math.random() * CTA_OPTIONS.length)];
            const randomQuote = CREATIVE_QUOTES[Math.floor(Math.random() * CREATIVE_QUOTES.length)];

            const newReel = document.createElement('div');
            newReel.className = 'reel-item';

            newReel.innerHTML = `
                <div class="desktop-side-panel case-study-panel">
                    <div class="panel-glow"></div>
                    <div class="panel-header">
                        <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        <h4>${isGenz ? 'lore' : 'Case Study'}</h4>
                    </div>
                    <p style="font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.85);">${caseStudy.replace(/\n/g, '<br>')}</p>
                </div>
                
                <div class="desktop-side-panel cta-panel">
                    <div class="panel-glow-yellow"></div>
                    <div class="panel-header">
                        <svg class="panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        <h4>${randomCTA.title}</h4>
                    </div>
                    <p>${randomCTA.text}</p>
                    <button class="cta-panel-btn" onclick="window.open('https://drippmedia.com/contact', '_blank')">${randomCTA.button} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>
                </div>

                <video class="reel-ambient-bg" src="${src}" muted loop playsinline preload="metadata" oncontextmenu="return false;"></video>
                <div class="reel-ambient-blur"></div>
                <div class="reel-content" data-id="${videoData.id || ''}">
                    <video class="reel-video" src="${src}" ${posterUrl ? `poster="${posterUrl}"` : ''} muted loop playsinline preload="auto" autoplay oncontextmenu="return false;" onerror="window.handleVideoLoadError(this, '${videoData.id || ''}', '${src}')"></video>
                    <div class="video-interact-layer" onclick="togglePlay(event, this)"></div>
                    <div class="reel-overlay-top"></div>
                    <div class="reel-overlay"></div>
                    
                    <div class="sound-toggle" onclick="toggleMuteGlobal(this)">
                        ${isGlobalMuted ? muteIconSVG : unmuteIconSVG}
                    </div>
                    
                    <div class="center-indicator"><svg class="indicator-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                    
                    <div class="reel-info">
                        <div class="reel-user-profile">
                            <img src="/images/dripp-logo-yellow.png" alt="Dripp Media" class="reel-avatar" onclick="window.open('https://www.instagram.com/drippmedia_', '_blank');" style="cursor:pointer;" />
                            <h3 class="reel-username"><span onclick="window.open('https://www.instagram.com/drippmedia_', '_blank');" style="cursor:pointer;">drippmedia_</span> <span class="username-dot">•</span> <button class="reel-follow-btn" onclick="window.open('https://www.instagram.com/drippmedia_', '_blank');">Follow</button></h3>
                        </div>
                        <p class="reel-desc">${desc}</p>
                        <div class="reel-music">
                            <svg class="music-icon action-icon" width="16" height="16" viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" d="M9 18V5l12-2v13"></path><circle fill="none" stroke="currentColor" stroke-width="2" cx="6" cy="18" r="3"></circle><circle fill="none" stroke="currentColor" stroke-width="2" cx="18" cy="16" r="3"></circle></svg>
                            <div class="music-text"><span class="music-marquee">${music}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${music}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div>
                        </div>
                    </div>
                    
                    <div class="reel-actions">
                        <!-- Soft Heart Icon -->
                        <button class="action-btn" onclick="toggleLike(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-heart" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg></div>
                        </button>
                        <!-- Comments Button (Visible on PC) -->
                        <button class="action-btn comment-btn-desktop" onclick="openComments(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-message-circle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg></div>
                        </button>
                        <!-- Info Icon (Case Study Mobile) -->
                        <button class="action-btn case-study-btn-mobile" onclick="openComments(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-case-study" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg></div>
                        </button>
                        <!-- Soft Share Icon -->
                        <button class="action-btn" onclick="openShare(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-share" viewBox="0 0 24 24"><polyline points="15 17 20 12 15 7"></polyline><path d="M4 18v-2a4 4 0 0 1 4-4h12"></path></svg></div>
                        </button>
                        <!-- Full Screen Button (Enter) -->
                        <button class="action-btn btn-enter-fullscreen" onclick="toggleFullscreen(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-expand" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></div>
                        </button>
                        <!-- Full Screen Button (Exit) -->
                        <button class="action-btn exit-fullscreen-btn" onclick="toggleFullscreen(this)">
                            <div class="action-icon-bg"><svg class="action-icon icon-collapse" viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></div>
                        </button>
                    </div>

                    <div class="case-study-sheet comments-sheet">
                        <div class="comments-header">
                            <h3 class="sheet-title-mobile">${isGenz ? 'lore' : 'Case Study'}</h3>
                            <h3 class="sheet-title-pc">${isGenz ? 'the aesthetic' : 'Creative Vision'}</h3>
                            <button class="close-comments" onclick="closeComments(this)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div class="comments-body">
                            <div class="case-study-text-mobile premium-case-study">
                                ${caseStudy.replace(/\n/g, '<br>')}
                            </div>
                            <div class="creative-vision-text-pc">
                                <div class="quote-icon-bg">"</div>
                                <p class="quote-text">"${randomQuote}"</p>
                                <div class="quote-author">— The Dripp Vision</div>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Share Sheet -->
                    <div class="share-sheet">
                        <div class="comments-header">
                            <h3>${isGenz ? 'plug it' : 'Share'}</h3>
                            <button class="close-comments" onclick="closeShare(this)">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <div class="share-link-box">
                            <div class="share-link-text" data-link="">${isGenz ? 'cooking link...' : 'Generating link...'}</div>
                            <button class="copy-link-btn" onclick="copyShareLink(this)">${isGenz ? 'copied' : 'Copy'}</button>
                        </div>
                        <div class="share-options">
                            <a href="#" class="share-option-btn" onclick="event.preventDefault(); window.open('https://wa.me/?text=Check out this awesome Dripp Media video! ' + encodeURIComponent(this.closest('.share-sheet').querySelector('.share-link-text').dataset.link));">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                WhatsApp
                            </a>
                            <a href="#" class="share-option-btn" onclick="event.preventDefault(); alert('Instagram sharing is native. Use the app or copy link!');">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                Instagram
                            </a>
                            <a href="#" class="share-option-btn" onclick="event.preventDefault(); window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(this.closest('.share-sheet').querySelector('.share-link-text').dataset.link) + '&text=Check out this reel from Dripp Media');">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                                X / Twitter
                            </a>
                        </div>
                    </div>
                    
                    <!-- Premium Scrub Bar -->
                    <div class="premium-scrub-bar-container">
                        <div class="premium-scrub-bar">
                            <div class="premium-scrub-progress"></div>
                            <div class="premium-scrub-thumb"></div>
                        </div>
                    </div>
                </div>
            `;

            reelsContainer.appendChild(newReel);

            videoObserver.observe(newReel);
            attachCursorEvents(newReel);

            if (!isGlobalMuted) {
                const toggle = newReel.querySelector('.sound-toggle');
                if (toggle) {
                    toggle.style.borderColor = 'var(--brand-yellow)';
                    toggle.style.color = 'var(--brand-yellow)';
                }
            }
            const vid = newReel.querySelector('.reel-video');
            if (vid) {
                vid.muted = isGlobalMuted;
                
                // Scrub Bar Logic
                const barContainer = newReel.querySelector('.premium-scrub-bar-container');
                const progressBar = newReel.querySelector('.premium-scrub-progress');
                const progressThumb = newReel.querySelector('.premium-scrub-thumb');
                
                if (barContainer && progressBar && progressThumb) {
                    let isDragging = false;
                    let rAF;
                    let lastVideoTime = 0;
                    let lastPerfTime = 0;
                    
                    const updateScrubUI = (now) => {
                        if (!isDragging && vid.duration) {
                            let simulatedTime = vid.currentTime;
                            
                            if (vid.currentTime === lastVideoTime && !vid.paused) {
                                // Interpolate time for 60fps smoothness between browser updates
                                const elapsed = (now - lastPerfTime) / 1000;
                                if (elapsed > 0 && elapsed < 0.5) {
                                    simulatedTime = lastVideoTime + elapsed;
                                }
                            } else {
                                // Sync baseline when browser updates currentTime
                                lastVideoTime = vid.currentTime;
                                lastPerfTime = now;
                            }
                            
                            // Cap it just in case
                            if (simulatedTime > vid.duration) simulatedTime = vid.duration;
                            
                            const percent = (simulatedTime / vid.duration) * 100;
                            progressBar.style.width = percent + '%';
                            progressThumb.style.left = percent + '%';
                        }
                        if (!vid.paused) {
                            rAF = requestAnimationFrame(updateScrubUI);
                        }
                    };
                    
                    vid.addEventListener('play', () => {
                        lastVideoTime = vid.currentTime;
                        lastPerfTime = performance.now();
                        rAF = requestAnimationFrame(updateScrubUI);
                    });
                    
                    vid.addEventListener('pause', () => {
                        cancelAnimationFrame(rAF);
                        if (vid.duration) {
                            const percent = (vid.currentTime / vid.duration) * 100;
                            progressBar.style.width = percent + '%';
                            progressThumb.style.left = percent + '%';
                        }
                    });
                    
                    // Initial update when metadata loads
                    vid.addEventListener('loadedmetadata', () => {
                        if (vid.duration) {
                            const percent = (vid.currentTime / vid.duration) * 100;
                            progressBar.style.width = percent + '%';
                            progressThumb.style.left = percent + '%';
                        }
                    });
                    
                    const updateSeek = (e, finalize = false) => {
                        const rect = barContainer.getBoundingClientRect();
                        let clientX = e.clientX;
                        if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
                        if (clientX === undefined) return;
                        
                        let x = clientX - rect.left;
                        if (x < 0) x = 0;
                        if (x > rect.width) x = rect.width;
                        const percent = x / rect.width;
                        
                        progressBar.style.width = (percent * 100) + '%';
                        progressThumb.style.left = (percent * 100) + '%';
                        
                        if (finalize) {
                            vid.currentTime = percent * vid.duration;
                        }
                    };

                    const onGlobalMove = (e) => {
                        if (isDragging) {
                            // Don't stop propagation globally, just prevent default if touch
                            if (e.cancelable && e.type === 'touchmove') e.preventDefault();
                            updateSeek(e, false);
                        }
                    };
                    
                    const onGlobalUp = (e) => {
                        if (isDragging) {
                            updateSeek(e, true);
                            isDragging = false;
                            window.removeEventListener('mousemove', onGlobalMove);
                            window.removeEventListener('mouseup', onGlobalUp);
                            window.removeEventListener('touchmove', onGlobalMove);
                            window.removeEventListener('touchend', onGlobalUp);
                            window.removeEventListener('touchcancel', onGlobalUp);
                        }
                    };

                    barContainer.addEventListener('mousedown', (e) => {
                        isDragging = true;
                        e.stopPropagation();
                        updateSeek(e, false);
                        window.addEventListener('mousemove', onGlobalMove, { passive: false });
                        window.addEventListener('mouseup', onGlobalUp);
                    });

                    barContainer.addEventListener('touchstart', (e) => {
                        isDragging = true;
                        e.stopPropagation();
                        updateSeek(e, false);
                        window.addEventListener('touchmove', onGlobalMove, { passive: false });
                        window.addEventListener('touchend', onGlobalUp);
                        window.addEventListener('touchcancel', onGlobalUp);
                    }, { passive: false });
                }
            }
        }
        
        // --- Initial Load Setup ---
        // Fetch from Supabase and load the first 2 reels
        async function fetchAndInitializeFeed() {
            const urlParams = new URLSearchParams(window.location.search);
            const category = urlParams.get('category') || 'Both';
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s max wait time for API
                const res = await fetch('/api/reels?category=' + encodeURIComponent(category), { signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        portfolioVideosList = data;
                    }
                }
            } catch (err) {
                console.warn('API fetch took too long or failed. Falling back to local data.', err);
            }

            if (reelsContainer) {
                reelsContainer.innerHTML = '';
            }

            // Shuffle the array so the sequence is random every time a user opens the page
            if (portfolioVideosList && portfolioVideosList.length > 0) {
                for (let i = portfolioVideosList.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [portfolioVideosList[i], portfolioVideosList[j]] = [portfolioVideosList[j], portfolioVideosList[i]];
                }
            }

            currentVideoIndex = 0;
            
            // Handle Deep Linking / Shared Reel
            const targetReelId = urlParams.get('reel');
            if (targetReelId && portfolioVideosList.length > 0) {
                const targetIndex = portfolioVideosList.findIndex(v => v.id === targetReelId);
                if (targetIndex !== -1) {
                    currentVideoIndex = targetIndex;
                }
            }

            const initialCount = portfolioVideosList.length === 0 ? 0 : 2; // Always render at least 2 to allow infinite scroll
            for (let i = 0; i < initialCount; i++) {
                if (portfolioVideosList.length > 0) {
                    createReelHTML(portfolioVideosList[currentVideoIndex]);
                    currentVideoIndex = (currentVideoIndex + 1) % portfolioVideosList.length;
                }
            }
            updateVolumeUI();
            
            // Highlight active category
            document.querySelectorAll('.sf-cat-btn').forEach(btn => {
                if (btn.dataset.cat === (new URLSearchParams(window.location.search).get('category') || 'Both')) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Handle smooth loading screen transition
            const loader = document.getElementById('initialLoader');
            if (loader) {
                const firstVideo = reelsContainer ? reelsContainer.querySelector('.reel-video') : null;
                const hideLoader = () => {
                    if (loader.dataset.hidden) return;
                    loader.dataset.hidden = 'true';
                    
                    const spinner = loader.querySelector('.premium-spinner');
                    const text = loader.querySelector('.premium-pulse-text');
                    
                    const tl = gsap.timeline({ onComplete: () => {
                        if (loader && loader.parentNode) loader.remove();
                    } });
                    
                    // Hard fallback in case GSAP animation fails or gets stuck
                    setTimeout(() => {
                        if (loader && loader.parentNode) loader.remove();
                    }, 1500);
                    
                    
                    if (spinner && text) {
                        tl.to([spinner, text], { 
                            y: -20, 
                            opacity: 0, 
                            scale: 0.9,
                            duration: 0.6, 
                            ease: 'power3.inOut',
                            stagger: 0.1
                        });
                    }
                    
                    tl.to(loader, { 
                        yPercent: -100, 
                        borderBottomLeftRadius: '50px',
                        borderBottomRightRadius: '50px',
                        duration: 1.2, 
                        ease: 'expo.inOut' 
                    }, "-=0.2");
                };
                
                if (firstVideo) {
                    if (firstVideo.readyState >= 1) {
                        hideLoader();
                    } else {
                        firstVideo.addEventListener('loadeddata', hideLoader, { once: true });
                        firstVideo.addEventListener('error', hideLoader, { once: true });
                        setTimeout(hideLoader, 2000); // reduced from 5000 for faster perceived load
                    }
                } else {
                    hideLoader();
                }
            }
        }
        
        window.changeCategory = function (cat) {
            window.location.href = '?category=' + encodeURIComponent(cat);
        };

        // Initialize early volume state & setup reels
        fetchAndInitializeFeed();

        if (reelsContainer) {
            reelsContainer.addEventListener('scroll', () => {
                // Append exactly 1 entry effortlessly right before bottom hit.
                if (reelsContainer.scrollTop + reelsContainer.clientHeight >= reelsContainer.scrollHeight - 10) {
                    if (!isAppending && portfolioVideosList.length > 0) {
                        isAppending = true;

                        // Fetch next sequential video from array
                        const nextVideoData = portfolioVideosList[currentVideoIndex];

                        // Increment and Loop sequentially
                        currentVideoIndex = (currentVideoIndex + 1) % portfolioVideosList.length;

                        // Add it
                        createReelHTML(nextVideoData);

                        setTimeout(() => {
                            isAppending = false;
                        }, 100);
                    }
                }
            });
        }

        setTimeout(() => {
            const firstVid = document.querySelector('.reel-video');
            if (firstVid && firstVid.paused) {
                firstVid.play().catch(e => console.log(e));
            }
        }, 300);

        // Exit full screen (clean mode) when pressing on the black background
        document.addEventListener('click', (e) => {
            const activeCleanMode = document.querySelector('.clean-mode');
            if (activeCleanMode && !activeCleanMode.contains(e.target)) {
                // If they clicked an element that is outside the clean-mode video (the black sides)
                activeCleanMode.classList.remove('clean-mode');
                document.body.classList.remove('clean-mode-active');
            }
        });

    

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --brand-yellow: #ebd73f;
            --deep-black: #050505;
            --pure-white: #ffffff;
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
            --glass-blur: blur(12px);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            cursor: none;
            user-select: none;
        }

        body,
        html {
            background-color: var(--deep-black);
            color: var(--pure-white);
            font-family: 'Clash Display', sans-serif;
            overflow: hidden;
            width: 100vw;
            height: 100dvh;
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
            z-index: 10000;
        }

        /* Short Form Category Switcher */
        .short-form-category-switcher {
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
            width: min(350px, 92vw);
            height: 44px;
            padding: 5px;
        }

        .sf-cat-btn-container {
            display: flex;
            gap: 5px;
            transition: opacity 0.3s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
            width: 100%;
            justify-content: center;
        }

        .short-form-category-switcher.contracted {
            width: 50px;
            height: 6px;
            border-radius: 3px;
            padding: 0;
            background: rgba(255, 255, 255, 0.6);
            border: none;
            opacity: 0.2;
            cursor: pointer;
            box-shadow: none;
        }
        
        .short-form-category-switcher.contracted .sf-cat-btn-container {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.85);
        }

        .short-form-category-switcher.contracted:hover {
            width: min(350px, 92vw);
            height: 44px;
            border-radius: 20px;
            padding: 5px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            opacity: 1;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .short-form-category-switcher.contracted:hover .sf-cat-btn-container {
            opacity: 1;
            pointer-events: all;
            transform: scale(1);
            transition-delay: 0.15s;
        }
        body.clean-mode-active .short-form-category-switcher,
        body.clean-mode-active .nav-back {
            opacity: 0;
            pointer-events: none;
            transform: translateY(-20px) translateX(var(--nav-x, -50%));
        }

        .sf-cat-btn {
            background: transparent;
            color: #888;
            border: none;
            padding: 8px 18px;
            border-radius: 15px;
            font-family: inherit;
            font-weight: 600;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sf-cat-btn.active {
            background: rgba(235, 215, 63, 0.2);
            color: #ebd73f;
            box-shadow: 0 4px 15px rgba(235, 215, 63, 0.1);
        }
        
        .sf-cat-btn:hover:not(.active) {
            color: #fff;
            background: rgba(255,255,255,0.1);
        }
        
        @media (max-width: 768px) {
            .short-form-category-switcher {
                top: 20px;
                transform: translateX(-50%) scale(0.9);
            }
        }

        /* Reels Container */
        .reels-container {
            width: 100vw;
            height: 100dvh;
            overflow-y: scroll;
            scroll-snap-type: y mandatory;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
            will-change: transform;
            -webkit-overflow-scrolling: touch;
        }

        .reels-container::-webkit-scrollbar {
            display: none;
        }

        /* Individual Reel Snapshot */
        .reel-item {
            width: 100vw;
            height: 100dvh;
            scroll-snap-align: start;
            scroll-snap-stop: always;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }

        /* The actual 9:16 Video Player Card */
        .reel-content {
            position: relative;
            height: 90dvh;
            /* 90% of screen height to leave room for scrolling feel */
            aspect-ratio: 9/16;
            background-color: var(--deep-black);
            border-radius: 20px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
            /* Smooth transitions for entering/exiting clean mode */
            transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
            will-change: transform;
        }

        .reel-content:hover {
            border-color: rgba(235, 215, 63, 0.3);
        }

        /* Desktop Side Panels (Case Study & CTA) */
        .desktop-side-panel {
            position: absolute;
            top: 50%;
            width: 320px;
            max-height: 80%;
            background: rgba(10, 10, 10, 0.4);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            padding: 30px 24px;
            color: #fff;
            z-index: 20;
            overflow-y: auto;
            opacity: 0;
            pointer-events: none;
            transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.2);
            box-shadow: 0 30px 60px rgba(0,0,0,0.5);
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .desktop-side-panel::-webkit-scrollbar { display: none; }

        .case-study-panel {
            left: max(20px, calc(50% - ((90dvh * 9) / 16) / 2 - 340px));
            border-left: 3px solid var(--brand-yellow);
            transform: translateY(-50%) perspective(1000px) rotateY(15deg) translateX(-30px);
        }

        .cta-panel {
            right: max(20px, calc(50% - ((90dvh * 9) / 16) / 2 - 340px));
            border-right: 3px solid var(--brand-yellow);
            transform: translateY(-50%) perspective(1000px) rotateY(-15deg) translateX(30px);
        }

        .reel-item.active .case-study-panel {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(-50%) perspective(1000px) rotateY(0deg) translateX(0);
        }

        .reel-item.active .cta-panel {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(-50%) perspective(1000px) rotateY(0deg) translateX(0);
            transition-delay: 0.1s;
        }

        .panel-glow {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 60%);
            pointer-events: none;
        }

        .panel-glow-yellow {
            position: absolute;
            top: 0; right: 0; width: 100%; height: 100%;
            background: radial-gradient(circle at top right, rgba(235, 215, 63, 0.1), transparent 60%);
            pointer-events: none;
        }

        .panel-header {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .panel-icon {
            width: 20px;
            height: 20px;
            color: var(--brand-yellow);
        }

        .desktop-side-panel h4 {
            font-family: 'Panchang', sans-serif;
            font-size: 1.1rem;
            color: var(--brand-yellow);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.2;
        }

        .desktop-side-panel p {
            font-family: 'Clash Display', sans-serif;
            font-size: 0.95rem;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.85);
            margin: 0;
        }
        
        .cta-panel-btn {
            margin-top: 10px;
            background: linear-gradient(135deg, rgba(235, 215, 63, 0.15), rgba(212, 188, 28, 0.05));
            border: 1px solid rgba(235, 215, 63, 0.4);
            color: #ebd73f;
            padding: 14px 20px;
            border-radius: 12px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
        }
        
        .cta-panel-btn:hover {
            background: var(--brand-yellow);
            color: #000;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(235, 215, 63, 0.2);
        }

        /* Hide elements on specific screens */
        .case-study-btn-mobile { display: none; }
        .comment-btn-desktop { display: flex; }

        @media (max-width: 900px) {
            .desktop-side-panel { display: none !important; }
            .case-study-btn-mobile { display: flex !important; }
            .comment-btn-desktop { display: none !important; }
        }

        @media (max-width: 1000px) {
            .case-study-panel {
                display: none !important;
            }
        }
        @media (min-width: 1001px) {
            .case-study-btn-mobile {
                display: none !important;
            }
        }
        .reel-ambient-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            /* REMOVED filter: blur(80px) brightness(0.3) due to Chromium bug */
            z-index: -1;
            opacity: 0.6;
        }

        .reel-ambient-blur {
            position: absolute;
            inset: 0;
            backdrop-filter: blur(80px);
            background: linear-gradient(to bottom, var(--deep-black) 0%, rgba(5, 5, 5, 0.6) 15%, rgba(5, 5, 5, 0.6) 85%, var(--deep-black) 100%);
            z-index: -1;
        }

        .reel-video {
            width: 100%;
            height: 100%;
            object-fit: contain;
            transform: translateZ(0); /* force dedicated GPU layer */
        }

        /* Interactive overlay for toggling mute/play & liking */
        .video-interact-layer {
            position: absolute;
            inset: 0;
            z-index: 5;
            cursor: pointer;
        }

        /* Reduced Bottom Shadows for Text Legibility */
        .reel-overlay {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40%;
            /* Lowered from 60% */
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%);
            /* Lighter fade */
            z-index: 10;
            pointer-events: none;
        }

        /* Reduced Top Shadows */
        .reel-overlay-top {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 15%;
            /* Lowered from 20% */
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
            /* Lighter fade */
            z-index: 10;
            pointer-events: none;
        }

        /* Dripp Media Logo Top Left - Minimal */
        .reel-brand {
            position: absolute;
            top: 35px;
            left: 20px;
            z-index: 50;
            font-family: 'Panchang', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            letter-spacing: 3px;
            color: rgba(255, 255, 255, 0.95);
            text-shadow: 0 1px 8px rgba(0,0,0,0.8);
            pointer-events: none;
        }

        /* Info Section (Bottom Left) */
        .reel-info {
            position: absolute;
            bottom: 30px;
            left: 20px;
            right: 80px;
            z-index: 20;
            pointer-events: none;
        }

        .reel-user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
        }

        .reel-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .reel-username {
            display: flex;
            align-items: center;
            font-family: 'Clash Display', sans-serif;
            font-size: 1.05rem;
            font-weight: 600;
            color: var(--pure-white);
            letter-spacing: 0.5px;
            text-shadow: none;
            margin: 0;
        }

        .username-dot {
            margin: 0 8px;
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.5);
        }

        .reel-follow-btn {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: var(--pure-white);
            padding: 4px 14px;
            border-radius: 20px;
            font-family: 'Clash Display', sans-serif;
            font-size: 0.85rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            pointer-events: auto;
        }

        .reel-follow-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s ease;
        }

        .reel-follow-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }

        .reel-follow-btn:hover::before {
            left: 100%;
        }

        .reel-follow-btn.following {
            background: rgba(235, 215, 63, 0.15);
            border-color: var(--brand-yellow);
            color: var(--brand-yellow);
        }

        .reel-desc {
            font-size: 0.9rem;
            line-height: 1.4;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 12px;
            font-weight: 400;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        }

        /* Music Ticker */
        .reel-music {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--glass-bg);
            backdrop-filter: var(--glass-blur);
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid var(--glass-border);
            font-size: 0.75rem;
            font-weight: 500;
            color: var(--pure-white);
            max-width: 200px;
            pointer-events: auto;
            transition: all 0.3s ease;
        }

        .reel-music:hover {
            border-color: rgba(235, 215, 63, 0.4);
            background: rgba(235, 215, 63, 0.05);
        }

        /* Minimal animation */
        @keyframes subtleBounce {

            0%,
            100% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-2px);
            }
        }

        .music-icon {
            animation: subtleBounce 2s ease-in-out infinite;
        }

        .music-text {
            white-space: nowrap;
            overflow: hidden;
            display: inline-block;
            width: 100%;
        }

        .music-marquee {
            display: inline-block;
            animation: marquee 8s linear infinite;
        }

        @keyframes marquee {
            0% {
                transform: translateX(0%);
            }

            100% {
                transform: translateX(-50%);
            }
        }

        /* Action Buttons (Bottom Right) */
        .reel-actions {
            position: absolute;
            bottom: 30px;
            right: 15px;
            z-index: 20;
            display: flex;
            flex-direction: column;
            gap: 20px;
            align-items: center;
        }

        .action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            background: transparent;
            border: none;
            color: var(--pure-white);
            outline: none;
            position: relative;
        }

        .action-icon-bg {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: var(--glass-bg);
            backdrop-filter: var(--glass-blur);
            border: 1px solid var(--glass-border);
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .action-icon {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: all 0.3s ease;
        }

        /* Modern Hover & Animation for Icons */
        @keyframes heartbeat {
            0% {
                transform: scale(1);
            }

            14% {
                transform: scale(1.3);
                stroke: var(--brand-yellow);
                fill: rgba(235, 215, 63, 0.4);
            }

            28% {
                transform: scale(1);
            }

            42% {
                transform: scale(1.3);
                stroke: var(--brand-yellow);
                fill: rgba(235, 215, 63, 0.4);
            }

            70%,
            100% {
                transform: scale(1);
                stroke: var(--brand-yellow);
                fill: rgba(235, 215, 63, 0.4);
            }
        }

        @keyframes bounceComment {
            0% {
                transform: translateY(0);
            }

            50% {
                transform: translateY(-6px);
                stroke: var(--brand-yellow);
            }

            100% {
                transform: translateY(0);
                stroke: var(--brand-yellow);
            }
        }

        @keyframes swoopShare {
            0% {
                transform: translate(0, 0) rotate(0);
            }

            50% {
                transform: translate(4px, -4px) rotate(15deg);
                stroke: var(--brand-yellow);
            }

            100% {
                transform: translate(0, 0) rotate(0);
                stroke: var(--brand-yellow);
            }
        }

        .action-btn:hover .action-icon-bg {
            background: rgba(235, 215, 63, 0.15);
            border-color: var(--brand-yellow);
            transform: scale(1.1);
        }

        /* Forwards keeps the final state/color after the single animation cycle */
        .action-btn:hover .icon-heart {
            animation: heartbeat 0.8s ease-in-out forwards;
        }

        .action-btn:hover .icon-comment {
            animation: bounceComment 0.5s ease forwards;
        }

        .action-btn:hover .icon-share {
            animation: swoopShare 0.5s ease forwards;
        }

        .action-text {
            display: none;
        }

        /* Play/Pause & Mute Indicators */
        /* Updated Center Indicator for Like Burst */
        .center-indicator {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.5);
            width: 80px;
            height: 80px;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 15;
            opacity: 0;
            pointer-events: none;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
        }

        .center-indicator.show {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        /* The Animated Heart Burst Container */
        .like-burst-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 25;
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .like-burst-heart {
            width: 100px;
            height: 100px;
            fill: var(--brand-yellow);
            opacity: 0;
            transform: scale(0);
        }

        /* Little pop stars surrounding the heart */
        .pop-star {
            position: absolute;
            width: 8px;
            height: 8px;
            background: var(--brand-yellow);
            border-radius: 50%;
            opacity: 0;
        }

        @keyframes hugePop {
            0% {
                transform: scale(0);
                opacity: 0;
            }

            15% {
                transform: scale(1.4) rotate(-10deg);
                opacity: 1;
            }

            30% {
                transform: scale(1) rotate(5deg);
                opacity: 1;
            }

            80% {
                transform: scale(1) rotate(0);
                opacity: 1;
            }

            100% {
                transform: scale(0.5) translateY(-50px);
                opacity: 0;
            }
        }

        .like-burst-heart.active {
            animation: hugePop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes starShoot {
            0% {
                transform: translate(0, 0) scale(0);
                opacity: 1;
            }

            50% {
                opacity: 1;
                transform: translate(var(--tx), var(--ty)) scale(1);
            }

            100% {
                transform: translate(calc(var(--tx) * 1.5), calc(var(--ty) * 1.5)) scale(0);
                opacity: 0;
            }
        }

        @keyframes hugePop {
            0% {
                transform: scale(0);
                opacity: 0;
            }

            15% {
                transform: scale(1.4) rotate(-10deg);
                opacity: 1;
            }

            30% {
                transform: scale(1) rotate(5deg);
                opacity: 1;
            }

            80% {
                transform: scale(1) rotate(0);
                opacity: 1;
            }

            100% {
                transform: scale(0.5) translateY(-50px);
                opacity: 0;
            }
        }

        .like-burst-heart.active {
            animation: hugePop 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes starShoot {
            0% {
                transform: translate(0, 0) scale(0);
                opacity: 1;
            }

            50% {
                opacity: 1;
                transform: translate(var(--tx), var(--ty)) scale(1);
            }

            100% {
                transform: translate(calc(var(--tx) * 1.5), calc(var(--ty) * 1.5)) scale(0);
                opacity: 0;
            }
        }

        .pop-star.active {
            animation: starShoot 0.7s ease-out forwards;
        }

        /* Minimal Unlike Animation */
        @keyframes unlikeFade {
            0% {
                transform: scale(1);
                opacity: 0.8;
            }

            50% {
                transform: scale(0.8);
                opacity: 0.4;
            }

            100% {
                transform: scale(0.5);
                opacity: 0;
            }
        }

        .like-burst-heart.unlike {
            animation: unlikeFade 0.4s ease-out forwards;
            fill: rgba(255, 255, 255, 0.4) !important;
            stroke: none !important;
        }

        .indicator-icon {
            width: 32px;
            height: 32px;
            fill: var(--pure-white);
            stroke: none;
        }

        /* Sound Toggle Badge */

        .sound-toggle {
            position: absolute;
            top: 25px;
            right: 20px;
            z-index: 20;
            background: var(--glass-bg);
            backdrop-filter: var(--glass-blur);
            border: 1px solid var(--glass-border);
            padding: 8px 12px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: var(--pure-white);
            transition: all 0.3s ease;
        }

        .sound-toggle:hover {
            border-color: var(--brand-yellow);
            color: var(--brand-yellow);
        }

        /* Slide-up Comments Sheet Overlay - Premium */
        .comments-sheet {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0;
            background: linear-gradient(180deg, rgba(20, 20, 20, 0.85) 0%, rgba(5, 5, 5, 0.98) 100%);
            backdrop-filter: blur(24px) saturate(1.2);
            border-top: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(235, 215, 63, 0.15);
            border-top-left-radius: 28px;
            border-top-right-radius: 28px;
            z-index: 30;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: height 0.5s cubic-bezier(0.32, 0.72, 0, 1);
        }
        
        .comments-sheet::before {
            content: '';
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 4px;
            background: rgba(255, 255, 255, 0.25);
            border-radius: 2px;
            z-index: 31;
        }
        
        .comments-sheet::after {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, rgba(235,215,63,0.15) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
        }
        
        .premium-case-study {
            padding: 10px 24px 40px;
            color: rgba(255, 255, 255, 0.9);
            font-family: 'Clash Display', sans-serif;
            font-size: 1.05rem;
            line-height: 1.7;
            font-weight: 400;
            position: relative;
            z-index: 2;
            overflow-y: auto;
            text-align: left;
        }
        
        .premium-case-study::first-letter {
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--brand-yellow);
            float: left;
            margin-right: 8px;
            line-height: 1.1;
            font-family: 'Panchang', sans-serif;
            text-shadow: 0 0 10px rgba(235, 215, 63, 0.4);
        }

        .comments-sheet.open {
            height: 50%;
        }

        .comments-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30px 24px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
            z-index: 2;
        }

        .comments-header h3 {
            font-family: 'Panchang', sans-serif;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            background: linear-gradient(135deg, #fff, #ebd73f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            position: relative;
            z-index: 2;
        }

        .close-comments {
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            padding: 5px;
            outline: none;
        }

        .close-comments:hover {
            color: var(--brand-yellow);
        }

        .comments-body {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        /* Pure minimal text for comment box placeholder - no button shapes */
        .reel-comment-box {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 90%;
            max-width: 400px;
        }

        .comment-text-placeholder {
            color: rgba(255, 255, 255, 0.5);
            font-family: 'Clash Display', sans-serif;
            font-size: 1rem;
            font-weight: 400;
            transition: color 0.3s ease;
        }

        .reel-comment-box:hover .comment-text-placeholder {
            color: rgba(255, 255, 255, 0.8);
        }

        /* Share Sheet */
        .share-sheet {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 0;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            z-index: 35;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: height 0.4s cubic-bezier(0.19, 1, 0.22, 1);
        }

        .share-sheet.open {
            height: 60%;
        }

        .share-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
        }

        .share-option-btn {
            display: flex;
            align-items: center;
            gap: 15px;
            background: var(--glass-bg);
            border: 1px solid var(--glass-border);
            padding: 12px 20px;
            border-radius: 15px;
            color: var(--pure-white);
            font-family: 'Clash Display', sans-serif;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }

        .share-option-btn:hover {
            border-color: var(--brand-yellow);
            background: rgba(235, 215, 63, 0.1);
            color: var(--brand-yellow);
        }

        .share-link-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid var(--glass-border);
            padding: 10px 15px;
            border-radius: 10px;
            margin: 0 20px 10px 20px;
        }

        .share-link-text {
            font-size: 0.8rem;
            color: rgba(255, 255, 255, 0.6);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 75%;
        }

        .copy-link-btn {
            background: var(--brand-yellow);
            color: var(--deep-black);
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: 'Panchang', sans-serif;
            font-size: 0.6rem;
            text-transform: uppercase;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .copy-link-btn.copied {
            background: var(--pure-white);
        }

        /* Clean Mode (Pseudo-Fullscreen) Base (Mobile defaults) */
        .reel-content.clean-mode {
            height: 100dvh !important;
            width: 100vw !important;
            max-width: 100vw !important;
            aspect-ratio: auto !important;
            border-radius: 0 !important;
            margin: 0 !important;
            background: #000;
            z-index: 100;
            /* Ensure it stays above everything */
            overflow: hidden;
            box-shadow: none;
        }

        /* Desktop Clean Mode (Theater Style) */
        @media (min-width: 769px) {
            .reel-content.clean-mode {
                height: 92dvh !important;
                width: 96vw !important;
                max-width: 1600px !important;
                border-radius: 24px !important;
                margin: 4dvh auto !important;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 100px rgba(0,0,0,0.5);
            }
        }

        .reel-content.clean-mode .pop-star {
            display: none !important;
        }

        .reel-content.clean-mode .reel-video {
            object-fit: contain !important;
        }

        /* Ensure UI elements fade out instead of snapping */
        .reel-overlay,
        .reel-overlay-top,
        .sound-toggle,
        .reel-brand,
        .reel-info,
        .reel-actions,
        .sharesheet,
        .comments-sheet,
        .like-burst-container,
        .center-indicator,
        .action-btn {
            transition: opacity 0.4s ease, transform 0.4s ease !important;
        }

        /* Hide all UI elements entirely when in clean mode */
        .reel-content.clean-mode .reel-overlay,
        .reel-content.clean-mode .reel-overlay-top,
        .reel-content.clean-mode .sound-toggle,
        .reel-content.clean-mode .reel-brand,
        .reel-content.clean-mode .reel-info,
        .reel-content.clean-mode .sharesheet,
        .reel-content.clean-mode .comments-sheet,
        .reel-content.clean-mode .like-burst-container,
        .reel-content.clean-mode .center-indicator,
        .reel-content.clean-mode .action-btn:not(.exit-fullscreen-btn) {
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* Keep ambient background hidden to assure pure black pillars */
        .reel-item:has(.clean-mode) .reel-ambient-bg {
            display: none !important;
        }

        /* Keep the interact layer active to allow double tap to like/play/pause */
        .reel-content.clean-mode .video-interact-layer {
            cursor: pointer;
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) {
            * {
                cursor: auto;
            }

            .cursor {
                display: none;
            }

            .reel-content {
                height: 100dvh;
                width: 100vw;
                border-radius: 0;
                border: none;
            }

            .nav-back {
                top: 30px;
                left: 20px;
            }

            .sound-toggle {
                top: 25px;
                right: 20px;
                left: auto;
            }

            .comments-sheet.open {
                height: 60%;
            }
        }
    
        .exit-fullscreen-btn {
            display: none;
        }

        .reel-content.clean-mode .exit-fullscreen-btn {
            display: flex;
        }

        /* Swap PC and Mobile Content for Comments Sheet */
        @media (max-width: 768px) {
            .sheet-title-pc { display: none !important; }
            .sheet-title-mobile { display: block !important; }
            .creative-vision-text-pc { display: none !important; }
            .case-study-text-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
            .sheet-title-pc { display: block !important; }
            .sheet-title-mobile { display: none !important; }
            .creative-vision-text-pc { display: block !important; }
            .case-study-text-mobile { display: none !important; }
        }

        /* Premium Scrub Bar */
        .premium-scrub-bar-container {
            position: absolute;
            bottom: 0; 
            left: 0;
            width: 100%;
            height: 24px; /* Hit area */
            display: flex;
            align-items: flex-end; /* Align the line to the bottom of the hit area */
            padding-bottom: 6px; /* Lift the bar up 6px to give the thumb clearance from overflow hidden! */
            cursor: pointer;
            z-index: 60;
            opacity: 0.9;
            transition: opacity 0.3s ease;
        }
        .premium-scrub-bar-container:hover {
            opacity: 1;
        }
        .premium-scrub-bar {
            width: 100%;
            height: 2px; /* Ultra thin */
            background: rgba(255, 255, 255, 0.2);
            position: relative;
            transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 4px;
        }
        .premium-scrub-bar-container:hover .premium-scrub-bar {
            height: 4px; /* Subtle thickening on hover */
        }
        .premium-scrub-progress {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            width: 0%;
            pointer-events: none;
            border-radius: 4px;
        }
        .premium-scrub-thumb {
            position: absolute;
            top: 50%;
            left: 0%;
            width: 8px; /* Very small dot */
            height: 8px;
            background: var(--pure-white);
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0); /* Hidden by default for minimalism */
            pointer-events: none;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
        }
        .premium-scrub-bar-container:hover .premium-scrub-thumb {
            transform: translate(-50%, -50%) scale(1); /* Reveal on hover */
        }
        .premium-scrub-bar-container:active .premium-scrub-thumb {
            transform: translate(-50%, -50%) scale(1.3);
        }

        /* Premium Creative Vision Quote */
        .creative-vision-text-pc {
            position: relative;
            padding: 50px 40px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 280px;
            overflow: hidden;
            background: linear-gradient(180deg, rgba(235, 215, 63, 0.02) 0%, transparent 100%);
            border-radius: 12px;
            margin: 10px;
            border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .quote-icon-bg {
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 240px;
            font-family: 'Panchang', sans-serif;
            color: rgba(235, 215, 63, 0.04);
            z-index: 0;
            line-height: 1;
            pointer-events: none;
            user-select: none;
        }
        .quote-text {
            font-family: 'Clash Display', sans-serif;
            font-weight: 300;
            font-style: italic;
            font-size: 1.5rem;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.95);
            z-index: 1;
            position: relative;
            text-shadow: 0 4px 15px rgba(0,0,0,0.8);
            margin-bottom: 24px;
        }
        .quote-author {
            font-family: 'Panchang', sans-serif;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 4px;
            color: var(--brand-yellow);
            z-index: 1;
            position: relative;
            opacity: 0.9;
        }

    ` }} />

      <div>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dripp Media | Short Form Portfolio</title>
  {/* Fonts */}
  <link href="https://api.fontshare.com/v2/css?f[]=panchang@200,300,400,500,600,700,800&f[]=clash-display@200,300,400,500,600,700&display=swap" rel="stylesheet" />
  {/* GSAP */}
  <a href="/video-portfolio" className="nav-back"><i className="uil uil-arrow-left" /></a>
  
  <div className={`short-form-category-switcher ${isContracted ? 'contracted' : ''}`}>
     <div className="sf-cat-btn-container">
         <button className="sf-cat-btn" data-cat="Videography" onClick={(e) => window.changeCategory('Videography')}>{isGenz ? 'pov' : 'Videography'}</button>
         <button className="sf-cat-btn" data-cat="Editing" onClick={(e) => window.changeCategory('Editing')}>{isGenz ? 'the edits' : 'Editing'}</button>
         <button className="sf-cat-btn" data-cat="Both" onClick={(e) => window.changeCategory('Both')}>{isGenz ? 'full send' : 'Both'}</button>
     </div>
  </div>

  <div className="cursor" id="cursor" />
  <div id="initialLoader" style={{ 
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999,
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      background: 'radial-gradient(circle at center, #15140b 0%, var(--deep-black) 60%)',
      gap: '24px' 
  }}>
      <style dangerouslySetInnerHTML={{ __html: `
          .premium-spinner {
              width: 50px;
              height: 50px;
              border-radius: 50%;
              border: 2px solid rgba(255, 255, 255, 0.05);
              border-top-color: var(--brand-yellow);
              border-right-color: transparent;
              animation: premium-spin 1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
              box-shadow: 0 0 30px rgba(235, 215, 63, 0.15);
          }
          .premium-pulse-text {
              font-family: 'Panchang', sans-serif;
              letter-spacing: 5px;
              font-size: 0.8rem;
              font-weight: 500;
              color: var(--pure-white);
              text-transform: uppercase;
              animation: premium-pulse 2s ease-in-out infinite;
          }
          @keyframes premium-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
          }
          @keyframes premium-pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
          }
          .cursor-trail-particle {
              position: fixed;
              width: 10px;
              height: 10px;
              background: var(--brand-yellow);
              border-radius: 50%;
              pointer-events: none;
              z-index: 999999;
              transform: translate(-50%, -50%);
              box-shadow: 0 0 12px rgba(235, 215, 63, 0.8), 0 0 20px rgba(255, 255, 255, 0.4);
              mix-blend-mode: screen;
          }
      ` }} />
      <div className="premium-spinner"></div>
      <span className="premium-pulse-text">{isGenz ? 'cooking' : 'Loading'}</span>
  </div>

  <div className="reels-container" id="reelsContainer">
  </div>
</div>


    </>
  );
}
