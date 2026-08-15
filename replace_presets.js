const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/dripp-studio/notes-and-planning/page.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the CSS
const cssStart = `/* 10X Modern Creative Designer Presets with GPU hardware layer isolation */`;
const cssEnd = `/* 18. Kinetic Wave: Undulating Radiant Wave Underline */`;
const cssNextSection = `.shimmer {`;

const cssStartIndex = content.indexOf(cssStart);
const cssEndIndex = content.indexOf(cssNextSection);

if (cssStartIndex === -1 || cssEndIndex === -1) {
  console.error('Could not find CSS boundaries.');
  process.exit(1);
}

const newCss = `/* Elite Creative Designer Presets */
        .preset-dripp-signature,
        .preset-glass-pill,
        .preset-brutalism,
        .preset-retro-vhs,
        .preset-redacted,
        .preset-liquid-chrome,
        .preset-neon-sign,
        .preset-ransom-note,
        .preset-hologram-float,
        .preset-marker-draw,
        .preset-3d-extruded,
        .preset-gold-emboss,
        .preset-kinetic-wave {
          display: inline-block !important;
          vertical-align: baseline;
          transform: translate3d(0, 0, 0);
          -webkit-transform: translate3d(0, 0, 0);
          will-change: background-position, transform, filter;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          isolation: isolate;
          animation-play-state: running !important;
        }

        /* 1. Dripp Signature */
        .preset-dripp-signature {
          background: #050505;
          color: #ebd73f;
          padding: 3px 12px;
          border-radius: 20px;
          font-weight: 800;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.8);
          border: 1px solid rgba(235, 215, 63, 0.4);
          position: relative;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* 2. Glassmorphic Pill */
        .preset-glass-pill {
          background: rgba(255,255,255,0.1);
          color: #fff;
          padding: 2px 10px;
          border-radius: 50px;
          font-weight: 600;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }

        /* 3. Brutalism Block */
        .preset-brutalism {
          background: #ffffff;
          color: #000000 !important;
          padding: 2px 6px;
          font-weight: 900;
          border: 3px solid #000000;
          box-shadow: 4px 4px 0px #000000;
          text-transform: uppercase;
        }

        /* 4. Retro VHS */
        .preset-retro-vhs {
          background: repeating-linear-gradient(0deg, #111, #111 2px, #222 2px, #222 4px);
          color: #fff;
          padding: 2px 8px;
          font-weight: 800;
          transform: skewX(-10deg);
          text-shadow: 2px 0px #ff00ea, -2px 0px #00f0ff;
          letter-spacing: 1px;
        }

        /* 5. CIA Redacted */
        .preset-redacted {
          background: #000;
          color: #000 !important;
          padding: 0px 4px;
          font-weight: 700;
          transition: all 0.3s ease;
          border-radius: 2px;
          cursor: pointer;
        }
        .preset-redacted:hover {
          color: #fff !important;
          background: #333;
        }

        /* 6. Liquid Chrome */
        .preset-liquid-chrome {
          background: linear-gradient(180deg, #fff 0%, #aaa 45%, #555 50%, #ddd 55%, #fff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        }

        /* 7. Neon Sign */
        .preset-neon-sign {
          color: #fff;
          font-weight: 800;
          -webkit-text-stroke: 1px #ff00ea;
          text-shadow: 0 0 5px #ff00ea, 0 0 15px #ff00ea, 0 0 30px #ff00ea;
          padding: 2px 6px;
          border: 2px solid #ff00ea;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(255,0,234,0.4), inset 0 0 10px rgba(255,0,234,0.4);
          animation: neonFlicker 3s infinite alternate;
        }
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; }
          20%, 24%, 55% { opacity: 0.4; }
        }

        /* 8. Ransom Note */
        .preset-ransom-note {
          background: #f4f1ea;
          color: #000 !important;
          padding: 2px 8px;
          font-weight: 800;
          transform: rotate(-3deg);
          box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
          clip-path: polygon(2% 4%, 98% 0%, 96% 95%, 0% 100%);
          font-family: monospace;
        }

        /* 9. Hologram Projection */
        .preset-hologram-float {
          color: #00ffff;
          font-weight: 700;
          opacity: 0.8;
          text-shadow: 0 0 8px #00ffff;
          animation: hologramBob 4s ease-in-out infinite;
          background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,255,0.1) 1px, rgba(0,255,255,0.1) 2px);
          padding: 0 4px;
        }
        @keyframes hologramBob {
          0%, 100% { transform: translateY(0px) translate3d(0,0,0); }
          50% { transform: translateY(-4px) translate3d(0,0,0); }
        }

        /* 10. Marker Draw */
        .preset-marker-draw {
          color: #000 !important;
          font-weight: 800;
          background-image: linear-gradient(#ffe600, #ffe600);
          background-size: 0% 100%;
          background-repeat: no-repeat;
          background-position: left center;
          padding: 0 4px;
          transition: background-size 0.5s ease-in-out;
        }
        .preset-marker-draw:hover {
          background-size: 100% 100%;
        }
        /* Fallback if not hovered, show full */
        .preset-marker-draw:not(:hover) {
          background-size: 100% 100%;
        }

        /* 11. 3D Extruded */
        .preset-3d-extruded {
          color: #fff;
          font-weight: 900;
          text-shadow: 1px 1px 0 #ff4500, 2px 2px 0 #ff4500, 3px 3px 0 #ff4500, 4px 4px 0 #ff4500, 5px 5px 0 #ff4500;
          letter-spacing: 2px;
          margin-right: 5px; /* space for shadow */
        }

        /* 12. Gold Foil Emboss */
        .preset-gold-emboss {
          background: #1e2124;
          color: #ebd73f;
          padding: 3px 10px;
          border-radius: 4px;
          font-weight: 700;
          box-shadow: inset 0 3px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.1);
          text-shadow: 0 1px 1px rgba(255,255,255,0.2);
        }

        /* 13. Kinetic Wave */
        .preset-kinetic-wave {
          color: #ffffff;
          font-weight: 700;
          text-decoration: underline wavy #ebd73f;
          text-underline-offset: 5px;
          text-decoration-thickness: 2px;
          filter: drop-shadow(0 2px 6px rgba(235, 215, 63, 0.6));
          padding: 0 3px;
        }

        `;

content = content.substring(0, cssStartIndex) + newCss + content.substring(cssEndIndex);

fs.writeFileSync(filePath, content);
console.log('Replaced CSS successfully!');
