"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GlobalError({ error, reset }) {
  const containerRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    // 1. Report to Admin Error Radar
    if (typeof window !== 'undefined' && typeof window.__dripp_report_error === 'function') {
      window.__dripp_report_error({
        level: 'fatal',
        message: error?.message || 'Global Engine Crash',
        source: window.location.href,
        details: `${error?.name || 'Error'}: ${error?.message || ''}\n\nStack Trace:\n${error?.stack || 'No stack trace'}`
      });
    }

    console.error("%c🚨 CRITICAL SYSTEM FAILURE", "color: #eb3f3f; font-size: 20px; font-weight: bold; background: #220000; padding: 4px 8px; border-radius: 4px;");
    console.error(`%cError Name:%c ${error?.name || 'Error'}`, "color: #ffaa00; font-weight: bold;", "color: white;");
    console.error(`%cError Message:%c ${error?.message || ''}`, "color: #ffaa00; font-weight: bold;", "color: white;");
    console.groupCollapsed("%cView Stack Trace", "color: #00aaff; cursor: pointer;");
    console.error(error?.stack);
    console.groupEnd();

    gsap.fromTo(
      ".error-glitch",
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.1 }
    );

    // Custom cursor tracking
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
  }, [error]);

  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,400,500,600,700&f[]=panchang@200,300,400,500,600,700,800&display=swap" rel="stylesheet" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: #050505;
          }
          .custom-global-error-cursor {
            position: fixed;
            top: 0;
            left: 0;
            width: 22px;
            height: 22px;
            border: 2px solid #eb3f3f;
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999999;
            box-shadow: 0 0 16px rgba(235, 63, 63, 0.7);
            transition: width 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), 
                        height 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), 
                        background-color 0.2s ease, 
                        border-color 0.2s ease,
                        box-shadow 0.2s ease;
            display: none;
          }
          .custom-global-error-cursor.active {
            width: 54px;
            height: 54px;
            background-color: rgba(235, 63, 63, 0.18);
            border-color: #eb3f3f;
            box-shadow: 0 0 30px rgba(235, 63, 63, 0.9);
            backdrop-filter: blur(2px);
          }
          @media (pointer: coarse) {
            .custom-global-error-cursor {
              display: none !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div 
          ref={containerRef}
          style={{
            width: '100vw', height: '100vh', 
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: '#050505', color: '#fff',
            position: 'relative', overflow: 'hidden'
          }}
        >
          <div className="cursor custom-global-error-cursor" ref={cursorRef} />

          <div 
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(235, 63, 63, 0.1) 0%, rgba(5, 5, 5, 0) 70%)',
              zIndex: 0
            }}
          />
          
          <div style={{ zIndex: 1, textAlign: 'center', padding: '0 20px' }}>
            <h1 className="error-glitch" style={{
               fontFamily: "'Panchang', sans-serif", fontSize: 'clamp(3rem, 8vw, 6rem)',
               color: '#eb3f3f', margin: 0, lineHeight: 1.1,
               textShadow: '0 0 40px rgba(235, 63, 63, 0.5)'
            }}>
              SYSTEM FAILURE
            </h1>
            <h2 className="error-glitch" style={{
               fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.2rem, 3vw, 2rem)',
               fontWeight: 600, marginTop: '20px', letterSpacing: '2px', textTransform: 'uppercase'
            }}>
              Core Dripp Engine Malfunction
            </h2>
            <p className="error-glitch" style={{
               fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)',
               maxWidth: '600px', margin: '20px auto 40px auto', lineHeight: 1.6
            }}>
              A critical error occurred preventing the website from loading entirely. 
              {error?.message ? ` Details: ${error.message}` : ''}
            </p>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <button className="error-glitch" onClick={() => reset()} style={{
                   padding: '15px 40px', borderRadius: '30px',
                   background: 'rgba(235, 63, 63, 0.1)', border: '1px solid rgba(235, 63, 63, 0.3)',
                   color: '#eb3f3f', fontFamily: "'Panchang', sans-serif", fontSize: '0.95rem',
                   textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
                   transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                   e.target.style.background = 'rgba(235, 63, 63, 0.2)';
                   e.target.style.boxShadow = '0 0 20px rgba(235, 63, 63, 0.4)';
                }}
                onMouseLeave={(e) => {
                   e.target.style.background = 'rgba(235, 63, 63, 0.1)';
                   e.target.style.boxShadow = 'none';
                }}>
                  Reboot System
                </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
