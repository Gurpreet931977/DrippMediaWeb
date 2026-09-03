'use client';

import React, { useState, useEffect } from 'react';

const FALLBACK_TIPS = [
  {
    id: 1,
    category: 'Sales & Psychology',
    title: "Don't sell to people. Make them want to buy.",
    explanation: "Nobody wakes up wanting to be pitched. The second someone feels like you're trying to sell them something, their guard immediately goes up. Instead of trying to convince people you're great, just share what you build, show the real process, and be honest about the results. When people understand who you are and what you stand for, they will come to you and choose to buy on their own terms.",
    formula: "Stop pitching yourself. Show your work so well that reaching out feels like their own idea."
  },
  {
    id: 2,
    category: 'Pricing & Money',
    title: 'Never charge for your time. Charge for the problem you fix.',
    explanation: "When you bill by the hour, getting faster and better at your craft actually loses you money. Clients don't care if a project took you 2 hours or 20 hours—they only care that their headache is gone. If you fix a $10,000 problem in 30 minutes, you earned that money through years of practice, not 30 minutes of sitting in a chair.",
    formula: "Set your prices based on how much time, money, or stress you save the client, never on hours clocked."
  },
  {
    id: 3,
    category: 'Content & Attention',
    title: "If you don't hook them in 3 seconds, your video doesn't exist.",
    explanation: "People scroll fast. You could have the most life-changing advice in the world, but if the opening seconds are slow, nobody will ever hear it. Never start with 'Hey guys' or a long logo animation. Jump straight into the action, drop a surprising fact, or show the end result first.",
    formula: "Put your most exciting visual or question right at second one. Give them a reason not to swipe away."
  },
  {
    id: 4,
    category: 'Business & Growth',
    title: 'A simple version launched today beats a perfect plan next month.',
    explanation: "Sitting in your room planning feels like hard work, but you learn nothing until real people touch what you make. The fastest way to succeed is to launch a simple, working version quickly, see what people actually do with it, and improve it as you go. Speed of learning is the real unfair advantage.",
    formula: "Build the simplest version that works, put it out there, and fix it based on real feedback."
  }
];

export default function DailyLearningSection({ isGenz = false }) {
  const [currentTip, setCurrentTip] = useState(FALLBACK_TIPS[0]);
  const [dayNumber, setDayNumber] = useState(1);
  const [countdownText, setCountdownText] = useState('NEXT TIP IN 12 HOURS');
  const [copied, setCopied] = useState(false);

  // Helper to compute local countdown
  const updateCountdown = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilNext = Math.max(0, nextMidnight.getTime() - now.getTime());
    const hoursLeft = Math.floor(msUntilNext / (1000 * 60 * 60));
    const minutesLeft = Math.floor((msUntilNext % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 1) {
      setCountdownText(isGenz ? `next drop in ${hoursLeft} hours` : `NEXT TIP IN ${hoursLeft} HOURS`);
    } else if (hoursLeft === 1) {
      setCountdownText(isGenz ? 'next drop in 1 hour' : 'NEXT TIP IN 1 HOUR');
    } else {
      const mins = Math.max(1, minutesLeft);
      setCountdownText(isGenz ? `next drop in ${mins} mins` : `NEXT TIP IN ${mins} MINS`);
    }
  };

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 60_000);

    // Fetch live daily tips from API
    fetch('/api/daily-tips')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.currentTip) {
          setCurrentTip(data.currentTip);
          if (data.dayNumber) setDayNumber(data.dayNumber);
          if (data.hoursLeft !== undefined) {
            if (data.hoursLeft > 1) {
              setCountdownText(isGenz ? `next drop in ${data.hoursLeft} hours` : `NEXT TIP IN ${data.hoursLeft} HOURS`);
            } else if (data.hoursLeft === 1) {
              setCountdownText(isGenz ? 'next drop in 1 hour' : 'NEXT TIP IN 1 HOUR');
            } else {
              setCountdownText(isGenz ? `next drop in ${data.minutesLeft || 30} mins` : `NEXT TIP IN ${data.minutesLeft || 30} MINS`);
            }
          }
        }
      })
      .catch(() => {
        // Fallback already in state
      });

    return () => clearInterval(interval);
  }, [isGenz]);

  const handleCopy = () => {
    const textToCopy = `"${currentTip.title}"\n\n${currentTip.explanation}\n\n✦ The Formula: ${currentTip.formula}\n\n— Daily Tip by Meta Gurpreet @ Dripp Media`;
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
              {countdownText} · DAY #{dayNumber}
            </span>
          </div>
          <h2 className="daily-intel-title">
            {isGenz ? 'the daily ' : "Today's "}
            <span>{isGenz ? 'tip.' : 'Tip.'}</span>
          </h2>
          <p className="daily-intel-sub">
            {isGenz 
              ? 'one practical formula for your business and life. updates every 24 hours.' 
              : 'One practical formula for your business and life. Updated every 24 hours.'}
          </p>
        </div>

        {/* The Clean Daily Tip Card (Non-slideable, Single Daily Tip) */}
        <div className="daily-intel-console">
          {/* Top Bar */}
          <div className="console-top-bar">
            <div className="console-category-pill">
              <span className="cat-sparkle">✦</span>
              <span className="cat-label">{currentTip.category}</span>
            </div>

            <div className="console-status-pill">
              <span className="status-live-text">
                {countdownText}
              </span>
            </div>
          </div>

          {/* Main Tip Body */}
          <div className="console-body">
            <div className="console-tag-row">
              <span className="console-id-tag">
                {isGenz ? `tip #${currentTip.id} · day #${dayNumber}` : `TIP #${currentTip.id} · DAY #${dayNumber}`}
              </span>
            </div>

            <h3 className="console-headline">
              <span className="headline-quote-mark">“</span>
              {currentTip.title}
            </h3>

            <p className="console-insight-text">
              {currentTip.explanation}
            </p>

            {/* The Formula Capsule */}
            <div className="console-action-capsule">
              <div className="action-capsule-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>THE FORMULA</span>
              </div>
              <p className="action-capsule-desc">
                {currentTip.formula}
              </p>
            </div>
          </div>

          {/* Card Footer Bar */}
          <div className="console-footer-bar">
            <div className="console-curator-wrap">
              <div className="curator-avatar-dot">
                <span className="curator-ping" />
              </div>
              <div className="curator-info">
                <span className="curator-title">
                  {isGenz ? 'shared by meta gurpreet' : 'Shared by Meta Gurpreet'}
                </span>
                <span className="curator-role">
                  {isGenz ? 'founder · dripp media' : 'Founder, Dripp Media'}
                </span>
              </div>
            </div>

            <div className="console-footer-actions">
              <button 
                type="button" 
                onClick={handleCopy} 
                className="console-copy-btn"
                title="Copy Tip to Clipboard"
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
                    <span>COPY TIP</span>
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
