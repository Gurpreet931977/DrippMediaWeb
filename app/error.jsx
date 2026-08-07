"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Copy, Check } from "lucide-react";

export default function Error({ error, reset }) {
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    const promptText = `Please fix this error:

--- ERROR ---
Message: ${error?.message || "Unknown error"}
Name: ${error?.name || "Error"}
Stack Trace:
${error?.stack || "No stack trace available"}
----------------`;

    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  useEffect(() => {
    // Smart Error Logging
    console.error("%c🚨 FATAL DRIPP ERROR DETECTED", "color: #eb3f3f; font-size: 20px; font-weight: bold; background: #220000; padding: 4px 8px; border-radius: 4px;");
    console.error(`%cError Name:%c ${error.name}`, "color: #ffaa00; font-weight: bold;", "color: white;");
    console.error(`%cError Message:%c ${error.message}`, "color: #ffaa00; font-weight: bold;", "color: white;");
    console.groupCollapsed("%cView Stack Trace", "color: #00aaff; cursor: pointer;");
    console.error(error.stack);
    console.groupEnd();

    gsap.fromTo(
      ".error-glitch",
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)", stagger: 0.1 }
    );
  }, [error]);

  return (
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
          FATAL DRIPP
        </h1>
        <h2 className="error-glitch" style={{
           fontFamily: "'Clash Display', sans-serif", fontSize: 'clamp(1.2rem, 3vw, 2rem)',
           fontWeight: 600, marginTop: '20px', letterSpacing: '2px', textTransform: 'uppercase'
        }}>
          Something went horribly wrong
        </h2>
        <p className="error-glitch" style={{
           fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem', color: 'rgba(255,255,255,0.5)',
           maxWidth: '600px', margin: '20px auto 40px auto', lineHeight: 1.6
        }}>
          An unexpected glitch occurred in the canvas. 
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
              Try Again
            </button>
            
            <button className="error-glitch" onClick={() => window.location.href = '/'} style={{
               padding: '15px 40px', borderRadius: '30px',
               background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)',
               color: 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem',
               textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
               transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
               e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
               e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}>
              Go Home
            </button>
            
            <button className="error-glitch" onClick={handleCopyPrompt} style={{
               padding: '15px 40px', borderRadius: '30px',
               background: copied ? 'rgba(82, 196, 26, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
               border: `1px solid ${copied ? 'rgba(82, 196, 26, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
               color: copied ? '#52c41a' : 'white', fontFamily: "'Clash Display', sans-serif", fontSize: '1.1rem',
               textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
               transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px'
            }}
            onMouseEnter={(e) => {
               if (!copied) e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
               if (!copied) e.target.style.background = 'rgba(255, 255, 255, 0.05)';
            }}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied Prompt' : 'Copy Prompt'}
            </button>
        </div>
      </div>
    </div>
  );
}
