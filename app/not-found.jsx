"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function NotFound() {
  const containerRef = useRef(null);

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
           color: 'var(--brand-yellow)', fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem',
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
