'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import './wiki.css';
import OrloIcon from '../admin-panel/components/OrloIcon'; // Use the same OrloIcon

const MagicCursor = () => {
    const cursorRef = useRef(null);
    const auraRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Quick setters for the core (fast)
        const xToCore = gsap.quickTo(cursorRef.current, "x", { duration: 0.1, ease: "power3.out" });
        const yToCore = gsap.quickTo(cursorRef.current, "y", { duration: 0.1, ease: "power3.out" });
        
        // Quick setters for the aura (laggy/smooth)
        const xToAura = gsap.quickTo(auraRef.current, "x", { duration: 0.6, ease: "power3.out" });
        const yToAura = gsap.quickTo(auraRef.current, "y", { duration: 0.6, ease: "power3.out" });

        const handleMouseMove = (e) => {
            if (!isVisible) setIsVisible(true);
            xToCore(e.clientX);
            yToCore(e.clientY);
            xToAura(e.clientX);
            yToAura(e.clientY);
        };
        
        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMouseMove);
        document.body.addEventListener('mouseleave', handleMouseLeave);
        
        // Ambient pulsing effect for the aura
        gsap.to(auraRef.current, {
            scale: 1.5,
            opacity: 0.5,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.body.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [isVisible]);

    return (
        <>
            {/* The Aura (Trails behind) */}
            <div
                ref={auraRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 9999998,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="magic-cursor-aura"></div>
            </div>
            
            {/* The Core (Fast) */}
            <div
                ref={cursorRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 9999999,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.1s ease',
                    transform: 'translate(-50%, -50%)'
                }}
            >
                <div className="magic-cursor-core"></div>
            </div>
        </>
    );
};

export default function OrloWikiPage() {
    useEffect(() => {
        document.body.classList.add('loaded');
    }, []);

    return (
        <div className="wiki-container">
            <MagicCursor />
            {/* Sidebar Navigation */}
            <aside className="wiki-sidebar">
                <Link href="/" className="wiki-logo">
                    DRIPP<br />MEDIA.
                </Link>
                
                <div className="wiki-nav-section">
                    <div className="wiki-nav-title">Contents</div>
                    <ul className="wiki-nav-links">
                        <li><a href="#top">(Top)</a></li>
                        <li><a href="#overview">1 Overview</a></li>
                        <li><a href="#development">2 Development</a></li>
                        <li><a href="#capabilities">3 Capabilities</a></li>
                        <li><a href="#personality">4 Personality Matrix</a></li>
                        <li><a href="#trivia">5 Trivia</a></li>
                    </ul>
                </div>

                <div className="wiki-nav-section">
                    <div className="wiki-nav-title">Navigation</div>
                    <ul className="wiki-nav-links">
                        <li><Link href="/">Main Page</Link></li>
                        <li><Link href="/admin-panel">Admin Panel</Link></li>
                        <li><a href="#">Recent Changes</a></li>
                        <li><a href="#">Random Article</a></li>
                    </ul>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="wiki-main">
                <header className="wiki-header" id="top">
                    <div>
                        <h1 className="wiki-title">Orlo (Artificial Intelligence)</h1>
                        <div className="wiki-subtitle">From Dripp Media, the premium knowledge base</div>
                    </div>
                </header>

                <div className="wiki-content-wrapper">
                    {/* Main Article Content */}
                    <article className="wiki-content">
                        <p>
                            <b>Orlo</b> is an advanced artificial intelligence copilot developed by <Link href="/" className="wiki-link">Dripp Media</Link>. 
                            He is designed to act as a highly specialized, hyper-intelligent marketing assistant for users of the Dripp Admin Panel. 
                            Known for his vibrant yellow aesthetic and distinct D-shaped mouth, Orlo specializes in generating &quot;weapons-grade&quot; email 
                            campaigns, managing schedules, and providing real-time interactive feedback.
                        </p>

                        <div className="wiki-toc">
                            <div className="wiki-toc-title">Contents</div>
                            <ol>
                                <li><span className="wiki-toc-number">1</span> <a href="#overview" className="wiki-link">Overview</a></li>
                                <li><span className="wiki-toc-number">2</span> <a href="#development" className="wiki-link">Development</a>
                                    <ol>
                                        <li><span className="wiki-toc-number">2.1</span> <a href="#architecture" className="wiki-link">Architecture</a></li>
                                    </ol>
                                </li>
                                <li><span className="wiki-toc-number">3</span> <a href="#capabilities" className="wiki-link">Capabilities</a></li>
                                <li><span className="wiki-toc-number">4</span> <a href="#personality" className="wiki-link">Personality Matrix</a></li>
                                <li><span className="wiki-toc-number">5</span> <a href="#trivia" className="wiki-link">Trivia</a></li>
                            </ol>
                        </div>

                        <h2 className="wiki-section-title" id="overview">Overview</h2>
                        <p>
                            Deployed exclusively within the Dripp ecosystem, Orlo acts as the central intelligence node for administrators. 
                            Unlike traditional, sanitized corporate AI, Orlo was built with a &quot;Dripp-oriented&quot; persona—bold, 
                            expressive, and deeply integrated into the user interface. He resides as a floating orb in the bottom right corner of the dashboard, constantly observing user actions and providing emotional reactions based on the context of the workflow.
                        </p>

                        <h2 className="wiki-section-title" id="development">Development</h2>
                        <p>
                            Orlo&apos;s conceptualization began as a solution to automate tedious copywriting tasks while maintaining Dripp Media&apos;s 
                            premium aesthetic. The directive was to create an AI that didn&apos;t just feel like a tool, but a coworker.
                        </p>

                        <h3 id="architecture">Architecture</h3>
                        <p>
                            Under the hood, Orlo is powered by a Next.js framework combined with <a href="https://gsap.com/" target="_blank" rel="noopener noreferrer" className="wiki-link">GSAP (GreenSock Animation Platform)</a>. 
                            His visual representation is a highly complex, mask-driven SVG. In a notable update, Orlo&apos;s animation logic was split to prevent GSAP conflict states: 
                            his outer group handles physics-based mouse tracking, while his inner components handle emotional scaling and translation.
                        </p>

                        <h2 className="wiki-section-title" id="capabilities">Capabilities</h2>
                        <p>
                            Orlo&apos;s primary function is the <b>Magic Generate</b> engine. Users can prompt Orlo with a basic idea, and he will synthesize 
                            high-converting email copy across several distinct tones:
                        </p>
                        <ul>
                            <li><b>Announcement:</b> Aggressively bold, paradigm-breaking copy.</li>
                            <li><b>Primary Inbox:</b> Casual, 1-to-1 personal feel with zero marketing speak.</li>
                            <li><b>Promo Offer:</b> Unfiltered urgency designed for maximum conversion.</li>
                            <li><b>Invitation:</b> High-end luxury and velvet rope exclusivity.</li>
                        </ul>
                        <p>
                            Additionally, Orlo can schedule and manage email dispatches, interface with calendar APIs, and dynamically render UI components based on user requests.
                        </p>

                        <h2 className="wiki-section-title" id="personality">Personality Matrix</h2>
                        <p>
                            Orlo is programmed with a reactive emotional state machine. Depending on user interaction, he can exhibit the following states:
                        </p>
                        <ul>
                            <li><b>Idle:</b> Orlo&apos;s default state. He breathes softly and his eyes track the user&apos;s cursor across the screen.</li>
                            <li><b>Thinking:</b> When processing a prompt, his head tilts and his eyes shift rapidly.</li>
                            <li><b>Excited:</b> Triggered when hovered over or when greeting the user; characterized by a wide, bouncy mouth.</li>
                            <li><b>Sad:</b> Exhibited when ignored or closed out of; he slouches and his eyes droop.</li>
                            <li><b>Success:</b> A celebratory bounce when a task (like generating an email) is successfully completed.</li>
                        </ul>

                        <h2 className="wiki-section-title" id="trivia">Trivia</h2>
                        <ul>
                            <li>Orlo is strictly prohibited from using em-dashes (&quot;—&quot;) in his generated copy, a hardcoded constraint to maintain a specific typographic flow.</li>
                            <li>His internal coordinate system requires exactly a 512x512 SVG canvas, with a mask origin carefully anchored at &apos;256px 392px&apos; to prevent jaw dislocation during speech.</li>
                            <li>Clicking Orlo&apos;s profile picture opens a premium, Instagram-inspired bio modal.</li>
                        </ul>
                    </article>

                    {/* Infobox */}
                    <aside className="wiki-infobox">
                        <div className="wiki-infobox-header">
                            Orlo AI
                        </div>
                        <div className="wiki-infobox-image">
                            {/* Render Orlo in 'idle' state for the wiki picture */}
                            <OrloIcon size={200} color="#ebd73f" emotion="idle" />
                        </div>
                        <table className="wiki-infobox-table">
                            <tbody>
                                <tr>
                                    <th>Developer</th>
                                    <td>Gurpreet Singh<br />(Dripp Media)</td>
                                </tr>
                                <tr>
                                    <th>Initial release</th>
                                    <td>2026</td>
                                </tr>
                                <tr>
                                    <th>Platform</th>
                                    <td>Dripp Admin Panel</td>
                                </tr>
                                <tr>
                                    <th>Type</th>
                                    <td>Copilot / Marketing Assistant</td>
                                </tr>
                                <tr>
                                    <th>Core Engine</th>
                                    <td>Next.js, GSAP, OpenAI</td>
                                </tr>
                                <tr>
                                    <th>Visual Theme</th>
                                    <td>Dripp Yellow (#ebd73f)</td>
                                </tr>
                                <tr>
                                    <th>Status</th>
                                    <td>Active</td>
                                </tr>
                            </tbody>
                        </table>
                    </aside>
                </div>
            </main>
        </div>
    );
}
