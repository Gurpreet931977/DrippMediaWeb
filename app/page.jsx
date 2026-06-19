"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function ComingSoon() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    // Add loaded class to body as required by globals.css
    document.body.classList.add('loaded');
    
    // Custom cursor functionality
    const cursor = document.querySelector('.cursor');
    
    const moveCursor = (e) => {
      if (cursor) {
        gsap.to(cursor, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          ease: "power2.out"
        });
      }
    };
    
    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(".char", 
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.05, ease: "power4.out" }
    )
    .fromTo(".subtitle", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      "-=0.5"
    )
    .fromTo(".social-link", 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" },
      "-=0.5"
    );
  }, { scope: containerRef });

  const titleChars = "DRIPPMEDIA".split("");

  return (
    <div ref={containerRef} style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--deep-black)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="cursor"></div>

      {/* Background Glow */}
      <div style={{
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 60%)',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(60px)',
        opacity: 0.5,
        pointerEvents: 'none'
      }}></div>

      {/* Main Title */}
      <h1 style={{
        fontFamily: "'Panchang', sans-serif",
        fontSize: 'clamp(3rem, 10vw, 8rem)',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '-2px',
        display: 'flex',
        gap: '5px',
        margin: 0,
        zIndex: 2,
        overflow: 'hidden'
      }}>
        {titleChars.map((char, index) => (
          <span key={index} className="char" style={{ 
            display: 'inline-block',
            color: index < 5 ? 'var(--pure-white)' : 'var(--brand-yellow)',
            textShadow: index >= 5 ? '0 0 30px var(--brand-glow)' : 'none'
          }}>
            {char}
          </span>
        ))}
      </h1>

      {/* Subtitle */}
      <div style={{ overflow: 'hidden', marginTop: '2rem' }}>
        <p className="subtitle" style={{
          fontFamily: "'Clash Display', sans-serif",
          fontSize: 'clamp(1rem, 2vw, 1.5rem)',
          color: 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '5px',
          textTransform: 'uppercase',
          zIndex: 2,
          textAlign: 'center',
          margin: 0
        }}>
          Coming Soon
        </p>
      </div>

      {/* Social Links */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginTop: '4rem',
        zIndex: 2
      }}>
        {['Instagram', 'Twitter', 'Contact'].map((item) => (
          <a key={item} href="#" className="social-link" style={{
            color: 'var(--pure-white)',
            textDecoration: 'none',
            fontFamily: "'Clash Display', sans-serif",
            fontSize: '0.9rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            borderBottom: '1px solid transparent',
            transition: 'border-color 0.3s ease, color 0.3s ease',
            paddingBottom: '5px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--brand-yellow)';
            e.target.style.color = 'var(--brand-yellow)';
            const cursor = document.querySelector('.cursor');
            if(cursor) cursor.classList.add('active');
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.color = 'var(--pure-white)';
            const cursor = document.querySelector('.cursor');
            if(cursor) cursor.classList.remove('active');
          }}
          >
            {item}
          </a>
        ))}
      </div>
      

    </div>
  );
}
