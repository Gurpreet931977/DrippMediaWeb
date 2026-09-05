"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NotFound() {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".error-glitch",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power4.out", stagger: 0.1 }
    );
    gsap.fromTo(
      ".error-desc",
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 0.5, ease: "power2.out" }
    );

    // Custom Brand Cursor Tracking
    const cursor = cursorRef.current;
    if (cursor) {
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(cursor, "x", { duration: 0.08, ease: "power3" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.08, ease: "power3" });

      const moveCursor = (e) => {
        cursor.style.display = 'block';
        xTo(e.clientX);
        yTo(e.clientY);
      };

      const handleMouseOver = (e) => {
        if (e.target && e.target.closest && e.target.closest('button, a, .btn, [role="button"]')) {
          cursor.classList.add('active');
        }
      };

      const handleMouseOut = (e) => {
        if (e.target && e.target.closest && e.target.closest('button, a, .btn, [role="button"]')) {
          cursor.classList.remove('active');
        }
      };

      window.addEventListener("mousemove", moveCursor);
      window.addEventListener('mouseover', handleMouseOver);
      window.addEventListener('mouseout', handleMouseOut);

      return () => {
        window.removeEventListener("mousemove", moveCursor);
        window.removeEventListener('mouseover', handleMouseOver);
        window.removeEventListener('mouseout', handleMouseOut);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100vw', height: '100vh', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        background: '#050505', color: '#fff',
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div className="cursor custom-404-cursor" ref={cursorRef} />

      <style jsx global>{`
        .custom-404-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 22px;
          height: 22px;
          border: 2px solid var(--brand-yellow);
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999999;
          box-shadow: 0 0 14px rgba(235, 215, 63, 0.55);
          transition: width 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), 
                      height 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), 
                      background-color 0.2s ease, 
                      border-color 0.2s ease,
                      box-shadow 0.2s ease;
          display: none;
        }
        .custom-404-cursor.active {
          width: 54px;
          height: 54px;
          background-color: rgba(235, 215, 63, 0.18);
          border-color: var(--brand-yellow);
          box-shadow: 0 0 28px rgba(235, 215, 63, 0.8);
          backdrop-filter: blur(2px);
        }
        @media (pointer: coarse) {
          .custom-404-cursor {
            display: none !important;
          }
        }
      `}</style>

      <div 
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(235, 215, 63, 0.08) 0%, rgba(5, 5, 5, 0) 70%)',
          zIndex: 0
        }}
      />
      
      <div style={{ zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
        <h1 className="error-glitch" style={{
           fontFamily: "'Panchang', sans-serif", fontSize: 'clamp(6rem, 15vw, 15rem)',
           color: 'var(--brand-yellow)', margin: 0, lineHeight: 1,
           textShadow: '0 0 60px rgba(235, 215, 63, 0.5)'
        }}>
          404
        </h1>
        <h2 className="error-glitch" style={{
           fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
           fontWeight: 600, marginTop: '20px', letterSpacing: '3px', textTransform: 'uppercase'
        }}>
          Lost in the sauce
        </h2>
        <p className="error-desc" style={{
           fontFamily: "'Clash Display', sans-serif", fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)',
           maxWidth: '500px', margin: '20px auto 40px auto', lineHeight: 1.6
        }}>
          The page you're looking for has dripped completely out of existence. It might have been moved, deleted, or never existed in the first place.
        </p>
        
        <Link href="/" className="error-desc" style={{
           display: 'inline-flex', padding: '15px 40px', borderRadius: '30px',
           background: 'rgba(235, 215, 63, 0.1)', border: '1px solid rgba(235, 215, 63, 0.3)',
           color: 'var(--brand-yellow)', fontFamily: "'Panchang', sans-serif", fontSize: '0.95rem',
           textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px',
           transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
           e.target.style.background = 'rgba(235, 215, 63, 0.2)';
           e.target.style.boxShadow = '0 0 20px rgba(235, 215, 63, 0.4)';
        }}
        onMouseLeave={(e) => {
           e.target.style.background = 'rgba(235, 215, 63, 0.1)';
           e.target.style.boxShadow = 'none';
        }}
        >
          Return to Canvas
        </Link>
      </div>
    </div>
  );
}
