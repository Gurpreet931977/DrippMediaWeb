'use client';

import React, { useState, useEffect } from 'react';

const DAILY_LEARNINGS = [
  {
    id: 1,
    tag: '01 // VALUE ASYMMETRY',
    category: 'Business & Pricing Power',
    title: 'Price on Value Delivered, Never on Hours Logged.',
    insight: 'When you bill by the hour, you are financially penalized for working quickly and mastering your craft. When you price based on the commercial outcome you unlock, your speed becomes an asset. High-margin organizations monetize asymmetric leverage, not chair time.',
    actionable: 'Package your services into fixed-scope high-impact drops with clear business outcomes. Eliminate hourly billing from your vocabulary.',
    tagline: 'LEVERAGE > EFFORT',
    principle: 'Outcome Monopolization'
  },
  {
    id: 2,
    tag: '02 // ATTENTION DYNAMICS',
    category: 'Consumer Psychology & Hooks',
    title: 'The First 1500 Milliseconds Decide If You Exist.',
    insight: 'In an infinite feed, nobody owes you their attention. If your opening 3 seconds fail to arrest scroll inertia through extreme visual contrast, motion, or narrative tension, your masterpiece remains completely invisible. Creativity without distribution leverage is silence.',
    actionable: 'Dedicate 50% of your creative energy to the opening 3 seconds—sound design, typographic punch, and pattern interruption.',
    tagline: 'HOOK OR PERISH',
    principle: 'Inertia Interruption'
  },
  {
    id: 3,
    tag: '03 // CLIENT COMPOUNDING',
    category: 'Agency Scale & Retention',
    title: 'Acquisition is Loud. Retention is Wealth.',
    insight: 'Amateur agencies burn cash chasing 10 new clients every month because they allow existing clients to churn in silence. True commercial velocity occurs when lifetime value exceeds customer acquisition costs by 5x. Delivering an unmistakable 10/10 execution is your most lucrative marketing campaign.',
    actionable: 'Treat existing clients like anchor equity partners. Proactively send progress updates, sprint drops, and value adds before they ever ask.',
    tagline: 'RETENTION COMPOUNDS',
    principle: 'Asymmetric LTV'
  },
  {
    id: 4,
    tag: '04 // HIGH AGENCY',
    category: 'Execution Velocity',
    title: 'Speed of Iteration Beats Quality of Hypothesis.',
    insight: 'The market ignores what you theorize in internal pitch decks; it only responds to what is deployed live in production. The builder who deploys five imperfect iterations in a single week will consistently lap the perfectionist who spends half a year polishing one untested concept.',
    actionable: 'Compress your feedback loops to under 24 hours. Ship the prototype today, gather market signals tomorrow, and deploy adjustments by Friday.',
    tagline: 'VELOCITY IS THE MOAT',
    principle: 'Rapid Signal Capture'
  },
  {
    id: 5,
    tag: '05 // RADICAL FOCUS',
    category: 'Strategy & Resource Allocation',
    title: "Saying 'No' to the Good is How You Build the Extraordinary.",
    insight: 'The biggest threat to building a category-defining brand is not failure—it is the seductive distraction of mediocre, comfortable opportunities. Agreeing to low-leverage requests dilutes creative clarity and consumes the mental bandwidth needed for flagship assets.',
    actionable: 'Apply the ultimate heuristic: If an opportunity is not an undeniable HELL YES, it is an immediate, respectful NO.',
    tagline: 'RELENTLESS STANDARDS',
    principle: 'Cognitive Protection'
  },
  {
    id: 6,
    tag: '06 // BRAND ENGINEERING',
    category: 'Perceived Value & Aesthetics',
    title: 'Aesthetic Standard is the Shortcut to Instant Trust.',
    insight: 'People perceive technical competence through visual polish long before they read your copy. A brand with mediocre design must burn 3x more energy convincing buyers than a brand that looks undeniably high-tier from the millisecond the page loads.',
    actionable: 'Set your visual baseline to the global top 1%. Elevate typographic scale, micro-animations, and contrast until your work commands the room.',
    tagline: 'DESIGN COMMANDS PRICE',
    principle: 'Visual Authority'
  },
  {
    id: 7,
    tag: '07 // UNCOPYABLE MOATS',
    category: 'Differentiation & Positioning',
    title: "Never Compete on Price. Compete on Being Uncopyable.",
    insight: 'Competing on price is a race to the bottom where someone else is always willing to lose money faster than you. When you fuse distinct cultural taste, rapid execution speed, and proprietary visual alchemy, you remove yourself from the commodity bucket entirely.',
    actionable: 'Stack two distinct, rare capabilities—such as cinema-grade storytelling paired with conversion-driven code architecture.',
    tagline: 'MONOPOLIZE YOUR TASTE',
    principle: 'Skill Convergence'
  }
];

export default function DailyLearningSection({ isGenz = false }) {
  // Deterministic 24-hour cycle based on UTC date
  const get24HourIndex = () => {
    if (typeof window === 'undefined') return 0;
    const now = new Date();
    // Unique day of year
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now - startOfYear;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % DAILY_LEARNINGS.length;
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dayNumber, setDayNumber] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const defaultIdx = get24HourIndex();
    // Also randomize slightly on page refresh so user sees fresh wisdom immediately
    const randomOffset = Math.floor(Math.random() * DAILY_LEARNINGS.length);
    const chosenIdx = (defaultIdx + randomOffset) % DAILY_LEARNINGS.length;
    setCurrentIndex(chosenIdx);

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    setDayNumber(dayOfYear > 0 ? dayOfYear : 1);
  }, []);

  const learning = DAILY_LEARNINGS[currentIndex];

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % DAILY_LEARNINGS.length);
      setIsTransitioning(false);
    }, 220);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + DAILY_LEARNINGS.length) % DAILY_LEARNINGS.length);
      setIsTransitioning(false);
    }, 220);
  };

  const handleCopy = () => {
    const textToCopy = `"${learning.title}"\n\n${learning.insight}\n\n✦ Directive: ${learning.actionable}\n\n— Curated by Meta Gurpreet @ Dripp Media`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <section className="daily-intel-section" id="daily-learning">
      {/* Radial Ambient Glow */}
      <div className="intel-glow-aura" />

      <div className="daily-intel-container">
        {/* Section Header */}
        <div className="daily-intel-header">
          <div className="intel-live-badge">
            <span className="intel-beacon" />
            <span className="intel-badge-text">
              {isGenz ? '24h drop · day #' + dayNumber : '24-Hour Protocol · Day #' + dayNumber}
            </span>
          </div>
          <h2 className="daily-intel-title">
            {isGenz ? 'the daily ' : 'Learning of the '}
            <span>{isGenz ? 'drop.' : 'Day.'}</span>
          </h2>
          <p className="daily-intel-sub">
            {isGenz 
              ? 'unfiltered game on business, attention economics, and creative leverage.' 
              : 'High-signal frameworks, business blueprints, and mental models from the frontlines of digital culture.'}
          </p>
        </div>

        {/* The Cyber-Editorial Wisdom Console */}
        <div className="daily-intel-console">
          {/* Holographic Top Bar */}
          <div className="console-top-bar">
            <div className="console-category-pill">
              <span className="cat-sparkle">✦</span>
              <span className="cat-label">{learning.category}</span>
            </div>

            <div className="console-controls">
              <span className="console-tagline">{learning.tagline}</span>
              <button 
                type="button" 
                onClick={handlePrev} 
                className="console-cycle-btn" 
                title="Previous Insight"
                aria-label="Previous Insight"
              >
                ←
              </button>
              <button 
                type="button" 
                onClick={handleNext} 
                className="console-cycle-btn cycle-primary" 
                title="Shuffle Next Learning"
                aria-label="Next Insight"
              >
                <span>Cycle Intel</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Animated Main Content Body */}
          <div className={`console-body ${isTransitioning ? 'transitioning' : ''}`}>
            <div className="console-tag-row">
              <span className="console-id-tag">{learning.tag}</span>
              <span className="console-principle-badge">{learning.principle}</span>
            </div>

            <h3 className="console-headline">
              <span className="headline-quote-mark">“</span>
              {learning.title}
            </h3>

            <p className="console-insight-text">
              {learning.insight}
            </p>

            {/* Actionable Directive Capsule */}
            <div className="console-action-capsule">
              <div className="action-capsule-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>ACTIONABLE DIRECTIVE</span>
              </div>
              <p className="action-capsule-desc">
                {learning.actionable}
              </p>
            </div>
          </div>

          {/* Console Footer Meta Bar */}
          <div className="console-footer-bar">
            <div className="console-curator-wrap">
              <div className="curator-avatar-dot">
                <span className="curator-ping" />
              </div>
              <div className="curator-info">
                <span className="curator-title">{isGenz ? 'curated by meta' : 'Curated by Meta Gurpreet'}</span>
                <span className="curator-role">{isGenz ? 'founder · dripp media' : 'Founder & CEO, Dripp Media'}</span>
              </div>
            </div>

            <div className="console-footer-actions">
              <div className="console-dots-track">
                {DAILY_LEARNINGS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (i === currentIndex || isTransitioning) return;
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentIndex(i);
                        setIsTransitioning(false);
                      }, 200);
                    }}
                    className={`console-dot ${i === currentIndex ? 'active' : ''}`}
                    aria-label={`Jump to learning ${i + 1}`}
                  />
                ))}
              </div>

              <button 
                type="button" 
                onClick={handleCopy} 
                className="console-copy-btn"
                title="Copy Insight to Clipboard"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>COPIED TO CLIPBOARD</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>COPY INSIGHT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
