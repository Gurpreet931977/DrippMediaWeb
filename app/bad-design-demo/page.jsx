"use client";

import React, { useState, useEffect } from "react";
import styles from "./demo.module.css";
import { 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Play, 
  Activity, 
  Eye, 
  EyeOff, 
  Zap, 
  Code, 
  Video, 
  Palette, 
  Share2,
  ChevronDown,
  Info,
  Maximize2
} from "lucide-react";

export default function BadDesignDemoPage() {
  // Mode: 'bad' (Bad Fundamentals / Over-designed) | 'good' (Good Design / Clean Hierarchy)
  const [mode, setMode] = useState("bad");
  const [showFlaws, setShowFlaws] = useState(false);
  const [activeFlawIndex, setActiveFlawIndex] = useState(null);
  const [hideToolbar, setHideToolbar] = useState(false);

  // Keyboard shortcuts for seamless screen recording
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "1") setMode("bad");
      if (e.key === "2") setMode("good");
      if (e.key === "a" || e.key === "A") setShowFlaws((prev) => !prev);
      if (e.key === "h" || e.key === "H") setHideToolbar((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Flaws database for educational annotations during the shoot
  const flaws = {
    nav: {
      id: 1,
      title: "Confusing & Overloaded Nav",
      desc: "9 cryptic menu labels and 2 competing CTAs in the header alone. The visitor is overwhelmed before reading the first sentence."
    },
    hierarchy: {
      id: 2,
      title: "Broken Visual Hierarchy",
      desc: "The primary H1 and secondary headline fight for identical visual weight and size. 4 highlighted words create visual chaos."
    },
    ctas: {
      id: 3,
      title: "CTA Decision Paralysis",
      desc: "5 competing buttons in the hero with different shapes, fills, and colors. The visitor has no primary action path."
    },
    jargon: {
      id: 4,
      title: "Zero Value Proposition",
      desc: "Buzzword-heavy poetry ('Hyper-Surreal Brand Momentum') without explaining what service or outcome the agency actually provides."
    },
    distraction: {
      id: 5,
      title: "Meaningless Decorative Noise",
      desc: "Live soundbars without audio, fake GPS coordinates, and floating widgets that look cool but steal cognitive focus."
    },
    motion: {
      id: 6,
      title: "Excessive Motion",
      desc: "Dual marquee tickers running in opposing directions at high speed cause instant visual fatigue."
    },
    services: {
      id: 7,
      title: "Cryptic Content Cards",
      desc: "Abstract names ('Kinetic Synapse', 'Spatial Hypertext') force clients to guess what services they are paying for."
    }
  };

  const renderFlawPin = (flawKey) => {
    if (!showFlaws || mode !== "bad") return null;
    const flaw = flaws[flawKey];
    if (!flaw) return null;

    const isActive = activeFlawIndex === flaw.id;

    return (
      <div 
        className={styles.flawPin}
        onClick={(e) => {
          e.stopPropagation();
          setActiveFlawIndex(isActive ? null : flaw.id);
        }}
        onMouseEnter={() => setActiveFlawIndex(flaw.id)}
        onMouseLeave={() => setActiveFlawIndex(null)}
        title={flaw.title}
        aria-label={flaw.title}
      >
        {flaw.id}
        {isActive && (
          <div className={styles.flawCardTooltip}>
            <div className={styles.flawCardTitle}>
              <Zap size={14} color="#ff5555" />
              Flaw #{flaw.id}: {flaw.title}
            </div>
            <div className={styles.flawCardDesc}>{flaw.desc}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.pageContainer}>
      {/* ─────────────────────────────────────────────────────────────
          FLOATING SHOOT CONTROLLER
          (Can be minimized or toggled via keyboard keys: 1, 2, A, H)
          ───────────────────────────────────────────────────────────── */}
      {!hideToolbar ? (
        <div className={styles.shootController}>
          <div className={styles.controllerLabel}>
            <span className={styles.controllerDot}></span>
            Shoot Mode
          </div>

          <div className={styles.modeToggleGroup}>
            <button
              className={`${styles.modeButton} ${mode === "bad" ? styles.modeButtonActiveBad : ""}`}
              onClick={() => setMode("bad")}
            >
              ⚡ Bad Fundamentals
            </button>
            <button
              className={`${styles.modeButton} ${mode === "good" ? styles.modeButtonActiveGood : ""}`}
              onClick={() => setMode("good")}
            >
              ✨ Good Design
            </button>
          </div>

          {mode === "bad" && (
            <button
              className={`${styles.toolButton} ${showFlaws ? styles.toolButtonActive : ""}`}
              onClick={() => setShowFlaws(!showFlaws)}
              title="Toggle flaw markers on/off (Key: A)"
            >
              <Info size={14} />
              {showFlaws ? "Hide Annotations" : "Inspect Flaws (7)"}
            </button>
          )}

          <button
            className={styles.toolButton}
            onClick={() => setHideToolbar(true)}
            title="Hide controller for clean recording (Press 'H' to show again)"
          >
            <EyeOff size={14} />
            Hide
          </button>
        </div>
      ) : (
        <button
          onClick={() => setHideToolbar(false)}
          style={{
            position: "fixed",
            top: "14px",
            right: "20px",
            zIndex: 99999,
            background: "rgba(10,10,10,0.85)",
            border: "1px solid rgba(235, 215, 63, 0.4)",
            borderRadius: "999px",
            padding: "8px 14px",
            color: "#ebd73f",
            fontFamily: "'Clash Display', sans-serif",
            fontSize: "0.75rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 0 20px rgba(0,0,0,0.8)"
          }}
        >
          <Eye size={14} />
          Show Menu (H)
        </button>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 1: "BAD FUNDAMENTALS" (OVER-DESIGNED & CHAOTIC)
          Looks visually gorgeous at first glance, but broken underneath!
          ───────────────────────────────────────────────────────────── */}
      {mode === "bad" && (
        <div style={{ position: "relative", width: "100%" }}>
          {/* Over-engineered Cluttered Navbar */}
          <nav className={styles.badNavbar}>
            <div className={styles.brandGroup}>
              <div className={styles.brandLogoText}>
                <span>DRIPP</span>
                <span className={styles.brandLogoYellow}>MEDIA</span>
              </div>
              <span className={styles.navSystemBadge}>SYS_v4.8</span>
            </div>

            {/* Flaw Pin #1: Nav */}
            <div className={styles.flawWrapper} style={{ position: "relative" }}>
              {renderFlawPin("nav")}
              <ul className={styles.badNavLinks}>
                <li className={styles.badNavLink}>01 // WORK</li>
                <li className={styles.badNavLink}>02 // THE LAB</li>
                <li className={styles.badNavLink}>03 // VISUAL CORE</li>
                <li className={styles.badNavLink}>04 // DISRUPT</li>
                <li className={styles.badNavLink}>05 // ECOSYSTEM</li>
                <li className={styles.badNavLink}>06 // PLAYGROUND</li>
                <li className={styles.badNavLink}>07 // META ARCHIVE</li>
                <li className={styles.badNavLink}>08 // SPRINT</li>
                <li className={styles.badNavLink}>
                  MORE <ChevronDown size={12} style={{ display: "inline", verticalAlign: "middle" }} />
                </li>
              </ul>
            </div>

            <div className={styles.badNavActions}>
              <button 
                className={styles.badNavCtaPrimary}
                onClick={() => alert("Button clicked: Launch Vault")}
              >
                Launch Vault ⚡
              </button>
              <button 
                className={styles.badNavCtaSecondary}
                onClick={() => alert("Button clicked: Book Call")}
              >
                Book Call
              </button>
            </div>
          </nav>

          {/* Overloaded Hero Section */}
          <section className={styles.badHero}>
            {/* Cyber Grid Background */}
            <div className={styles.heroGridBg}></div>
            <div className={styles.glowCenter}></div>
            <div className={styles.glowTopRight}></div>

            {/* Left Decorative Coordinates (Distraction) */}
            <div className={styles.techCoordsLeft}>
              <div className={styles.techCoordItem}>LAT 30.3165° N // LON 78.0322° E</div>
              <div className={styles.techCoordItem}>PIPELINE: SYNTHESIS_ACTIVE</div>
              <div className={styles.techCoordItem}>RENDER CYCLE: 120 FPS</div>
            </div>

            {/* Right Decorative Widget (Distraction) */}
            <div className={styles.flawWrapper} style={{ position: "absolute", top: "100px", right: "40px", zIndex: 20 }}>
              {renderFlawPin("distraction")}
              <div className={styles.techWidgetRight}>
                <div className={styles.widgetHeader}>
                  <span>AUDIO FREQ</span>
                  <span>48.0 kHz</span>
                </div>
                <div className={styles.soundBars}>
                  <div className={styles.soundBar} style={{ animationDelay: "0s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.2s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.4s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.1s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.5s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.3s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.6s" }}></div>
                  <div className={styles.soundBar} style={{ animationDelay: "0.25s" }}></div>
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", fontFamily: "'Clash Display', sans-serif" }}>
                  CORE VELOCITY: 99.8%
                </div>
                <div className={styles.liveChartFake}>
                  <div className={styles.chartColumn} style={{ height: "40%" }}></div>
                  <div className={styles.chartColumn} style={{ height: "75%" }}></div>
                  <div className={styles.chartColumn} style={{ height: "55%" }}></div>
                  <div className={styles.chartColumn} style={{ height: "90%" }}></div>
                  <div className={styles.chartColumn} style={{ height: "65%" }}></div>
                  <div className={styles.chartColumn} style={{ height: "80%" }}></div>
                </div>
              </div>
            </div>

            {/* Eyebrow cluster (3 competing badges!) */}
            <div className={styles.heroBadgesCluster}>
              <span className={`${styles.heroBadge} ${styles.heroBadgeYellow}`}>
                <Zap size={14} />
                Gen-4 Creative Agility Protocol
              </span>
              <span className={`${styles.heroBadge} ${styles.heroBadgeWhite}`}>
                <Activity size={14} />
                Active Vector: 1,842 Nodes
              </span>
              <span className={`${styles.heroBadge} ${styles.heroBadgeOrange}`}>
                <Sparkles size={14} />
                Award Candidate 2026
              </span>
            </div>

            {/* Competing Headlines Group */}
            <div className={styles.heroContentBox}>
              <div className={styles.flawWrapper} style={{ width: "100%" }}>
                {renderFlawPin("hierarchy")}
                {/* Massive Primary Headline */}
                <h1 className={styles.primaryLoudHeadline}>
                  ARCHITECTING <span className={styles.headlineHighlight}>HYPER-SURREAL</span> BRAND{" "}
                  <span className={styles.headlineHollow}>MOMENTUM</span>
                </h1>

                {/* Secondary Headline (almost identical volume!) */}
                <h2 className={styles.secondaryLoudHeadline}>
                  ENGINEERING <span className={styles.secondaryHighlight}>DIGITAL CONVERGENCE</span> THROUGH HIGH-IMPACT EXPERIENCES
                </h2>
              </div>

              {/* Vague Buzzword Salad */}
              <div className={styles.flawWrapper} style={{ width: "100%" }}>
                {renderFlawPin("jargon")}
                <p className={styles.buzzwordParagraph}>
                  We deploy multi-vector narrative synthesis and tactile visual dopamine to disrupt legacy brand perception across boundless digital horizons. Where kinetic aesthetics merge into pure brand sovereignty.
                </p>
              </div>

              {/* The CTA War (5 Buttons Competing) */}
              <div className={styles.flawWrapper} style={{ display: "inline-block" }}>
                {renderFlawPin("ctas")}
                <div className={styles.ctaArmyContainer}>
                  <button 
                    className={styles.ctaBtn1}
                    onClick={() => alert("CTA 1 Triggered: Explore The Matrix")}
                  >
                    Explore The Matrix <ArrowUpRight size={16} />
                  </button>

                  <button 
                    className={styles.ctaBtn2}
                    onClick={() => alert("CTA 2 Triggered: Start Your Project")}
                  >
                    Start Your Project
                  </button>

                  <button 
                    className={styles.ctaBtn3}
                    onClick={() => alert("CTA 3 Triggered: View Portfolio")}
                  >
                    View Portfolio // 2026
                  </button>

                  <button 
                    className={styles.ctaBtn4}
                    onClick={() => alert("CTA 4 Triggered: Instant Quote")}
                  >
                    Get Instant Quote ⚡
                  </button>

                  <button 
                    className={styles.ctaBtn5}
                    onClick={() => alert("CTA 5 Triggered: Interactive Lab")}
                  >
                    <Play size={14} /> Play Arcade Lab
                  </button>
                </div>
              </div>

              {/* Redundant Micro Metrics */}
              <div className={styles.heroMicroMetrics}>
                <div className={styles.microMetricItem}>
                  <span className={styles.microMetricVal}>0.35s</span>
                  <span className={styles.microMetricLabel}>Quantum Latency</span>
                </div>
                <div className={styles.microMetricItem}>
                  <span className={styles.microMetricVal}>99.9%</span>
                  <span className={styles.microMetricLabel}>Aura Retention</span>
                </div>
                <div className={styles.microMetricItem}>
                  <span className={styles.microMetricVal}>10x</span>
                  <span className={styles.microMetricLabel}>Cognitive Velocity</span>
                </div>
                <div className={styles.microMetricItem}>
                  <span className={styles.microMetricVal}>4K</span>
                  <span className={styles.microMetricLabel}>Visual Fidelity</span>
                </div>
              </div>
            </div>
          </section>

          {/* Excessive Dual Counter-Scrolling Marquee Tickers */}
          <div className={styles.flawWrapper} style={{ width: "100%" }}>
            {renderFlawPin("motion")}
            <div className={styles.dualMarqueeSection}>
              <div className={styles.marqueeTrackFast}>
                <span>
                  DRIPP MEDIA ★ BRAND ASCENSION ★ TACTILE DESIGN ★ HYPER VELOCITY ★ AESTHETIC SUPREMACY ★ DRIPP MEDIA ★ BRAND ASCENSION ★ TACTILE DESIGN ★ HYPER VELOCITY ★ AESTHETIC SUPREMACY ★
                </span>
                <span>
                  DRIPP MEDIA ★ BRAND ASCENSION ★ TACTILE DESIGN ★ HYPER VELOCITY ★ AESTHETIC SUPREMACY ★ DRIPP MEDIA ★ BRAND ASCENSION ★ TACTILE DESIGN ★ HYPER VELOCITY ★ AESTHETIC SUPREMACY ★
                </span>
              </div>
              <div className={styles.marqueeTrackReverse}>
                <span>
                  // VIDEO PRODUCTION // WEB SYSTEMS // CREATIVE DIRECTION // 3D WORLDS // DIGITAL STRATEGY // VIDEO PRODUCTION // WEB SYSTEMS // CREATIVE DIRECTION // 3D WORLDS // DIGITAL STRATEGY //
                </span>
                <span>
                  // VIDEO PRODUCTION // WEB SYSTEMS // CREATIVE DIRECTION // 3D WORLDS // DIGITAL STRATEGY // VIDEO PRODUCTION // WEB SYSTEMS // CREATIVE DIRECTION // 3D WORLDS // DIGITAL STRATEGY //
                </span>
              </div>
            </div>
          </div>

          {/* Cryptic Services Grid (Poor Content Clarity) */}
          <section className={styles.badServicesSection}>
            <div className={styles.badServicesHeader}>
              <div className={styles.badSectionEyebrow}>Ecosystem Matrix</div>
              <h3 className={styles.badSectionTitle}>The Aces Your Brand Needs to Play</h3>
            </div>

            <div className={styles.flawWrapper} style={{ width: "100%" }}>
              {renderFlawPin("services")}
              <div className={styles.badCardsGrid}>
                {/* Card 1 */}
                <div className={styles.badServiceCard}>
                  <div className={styles.cardTopMeta}>
                    <span className={styles.cardNumberBadge}>01</span>
                    <span className={styles.cardCrypticTag}>KINETIC CORE</span>
                  </div>
                  <h4 className={styles.badCardTitle}>Kinetic Synapse</h4>
                  <p className={styles.badCardDesc}>
                    Engineering post-retinal optical stimuli that rewire viewer expectations across high-density temporal formats.
                  </p>
                  <div className={styles.badCardButtonRow}>
                    <button className={styles.miniCardBtn}>Preview</button>
                    <button className={styles.miniCardBtn}>Inquire</button>
                    <button className={styles.miniCardBtn}>Specs</button>
                  </div>
                </div>

                {/* Card 2 */}
                <div className={styles.badServiceCard}>
                  <div className={styles.cardTopMeta}>
                    <span className={styles.cardNumberBadge}>02</span>
                    <span className={styles.cardCrypticTag}>SPATIAL RUNTIME</span>
                  </div>
                  <h4 className={styles.badCardTitle}>Spatial Hypertext</h4>
                  <p className={styles.badCardDesc}>
                    Compiling multi-threaded digital architecture designed to maximize user resonance through fluid interaction vectors.
                  </p>
                  <div className={styles.badCardButtonRow}>
                    <button className={styles.miniCardBtn}>Inspect</button>
                    <button className={styles.miniCardBtn}>Deploy</button>
                    <button className={styles.miniCardBtn}>Docs</button>
                  </div>
                </div>

                {/* Card 3 */}
                <div className={styles.badServiceCard}>
                  <div className={styles.cardTopMeta}>
                    <span className={styles.cardNumberBadge}>03</span>
                    <span className={styles.cardCrypticTag}>TACTILE AURA</span>
                  </div>
                  <h4 className={styles.badCardTitle}>Tactile Identity</h4>
                  <p className={styles.badCardDesc}>
                    Synthesizing emotional typography and chromatic frequency systems that command immediate sub-conscious trust.
                  </p>
                  <div className={styles.badCardButtonRow}>
                    <button className={styles.miniCardBtn}>View Work</button>
                    <button className={styles.miniCardBtn}>Case Study</button>
                    <button className={styles.miniCardBtn}>Book</button>
                  </div>
                </div>

                {/* Card 4 */}
                <div className={styles.badServiceCard}>
                  <div className={styles.cardTopMeta}>
                    <span className={styles.cardNumberBadge}>04</span>
                    <span className={styles.cardCrypticTag}>SOCIAL RESONANCE</span>
                  </div>
                  <h4 className={styles.badCardTitle}>Algorithmic Aura</h4>
                  <p className={styles.badCardDesc}>
                    Amplifying organic dissemination velocity through synchronized cultural hooks and psychographic curation.
                  </p>
                  <div className={styles.badCardButtonRow}>
                    <button className={styles.miniCardBtn}>Audit</button>
                    <button className={styles.miniCardBtn}>Growth</button>
                    <button className={styles.miniCardBtn}>Scale</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 2: "GOOD DESIGN" (THE CLEAN COMPARISON STATE)
          Same Dripp DNA, same colors & fonts, but clean fundamentals!
          ───────────────────────────────────────────────────────────── */}
      {mode === "good" && (
        <div style={{ position: "relative", width: "100%" }}>
          {/* Clean, Focused Navbar */}
          <nav className={styles.goodNavbar}>
            <div className={styles.brandGroup}>
              <div className={styles.brandLogoText}>
                <span>DRIPP</span>
                <span className={styles.brandLogoYellow}>MEDIA</span>
              </div>
            </div>

            <ul className={styles.goodNavLinks}>
              <li className={styles.goodNavLink}>Work</li>
              <li className={styles.goodNavLink}>Services</li>
              <li className={styles.goodNavLink}>About</li>
              <li className={styles.goodNavLink}>Contact</li>
            </ul>

            <button 
              className={styles.goodNavCta}
              onClick={() => alert("Primary action clicked: Start a Project")}
            >
              Start a Project
            </button>
          </nav>

          {/* Masterful, High-Clarity Hero Section */}
          <section className={styles.goodHero}>
            <div className={styles.goodHeroTag}>
              <Sparkles size={14} />
              Digital Branding & Creative Agency
            </div>

            {/* Single Dominant H1 Headline */}
            <h1 className={styles.goodHeroTitle}>
              We Build Websites & Content That <span style={{ color: "#ebd73f" }}>Command Attention.</span>
            </h1>

            {/* Clear, Actionable Value Proposition */}
            <p className={styles.goodHeroDesc}>
              Dripp Media is a modern creative agency partnering with ambitious brands. From high-speed custom web development to viral video production, we turn casual visitors into paying clients.
            </p>

            {/* Focused 2-Button Action Pair */}
            <div className={styles.goodCtaRow}>
              <button 
                className={styles.goodPrimaryBtn}
                onClick={() => alert("Primary CTA clicked: Start a Project")}
              >
                Start a Project <ArrowUpRight size={16} />
              </button>

              <button 
                className={styles.goodSecondaryBtn}
                onClick={() => alert("Secondary CTA clicked: Explore Selected Work")}
              >
                Explore Selected Work ↓
              </button>
            </div>
          </section>

          {/* Clear, Unambiguous Services Grid */}
          <section className={styles.goodServicesGrid}>
            <div className={styles.goodServiceCard}>
              <div className={styles.goodServiceIcon}>
                <Code size={22} />
              </div>
              <h3 className={styles.goodServiceTitle}>Web Development</h3>
              <p className={styles.goodServiceDesc}>
                Custom, ultra-fast Next.js websites built with smooth animations, high SEO scores, and effortless mobile checkouts.
              </p>
            </div>

            <div className={styles.goodServiceCard}>
              <div className={styles.goodServiceIcon}>
                <Video size={22} />
              </div>
              <h3 className={styles.goodServiceTitle}>Video Production</h3>
              <p className={styles.goodServiceDesc}>
                High-converting short-form reels, commercial editing, and cinematic brand films engineered to capture attention.
              </p>
            </div>

            <div className={styles.goodServiceCard}>
              <div className={styles.goodServiceIcon}>
                <Palette size={22} />
              </div>
              <h3 className={styles.goodServiceTitle}>Brand Identity</h3>
              <p className={styles.goodServiceDesc}>
                Distinctive logos, typography guidelines, and complete visual identity systems that give your company instant credibility.
              </p>
            </div>

            <div className={styles.goodServiceCard}>
              <div className={styles.goodServiceIcon}>
                <Share2 size={22} />
              </div>
              <h3 className={styles.goodServiceTitle}>Social Management</h3>
              <p className={styles.goodServiceDesc}>
                End-to-end social media growth, content strategy, and community curation that builds an authentic, loyal audience.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
