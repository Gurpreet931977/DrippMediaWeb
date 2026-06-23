"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function GlobalError({ error, reset }) {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ".error-glitch",
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.1 }
    );
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
        `}</style>
      </head>
      <body>
        <div 
          ref={containerRef}
          style={{
            width: '100vw', height: '100vh', 
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: '#050505', color: '#fff',
            position: 'relative', overflow: 'hidden', cursor: 'auto'
          }}
        >
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
                   color: '#eb3f3f', fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem',
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
