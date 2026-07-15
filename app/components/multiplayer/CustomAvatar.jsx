import React from 'react';

export const AVATAR_COLORS = [
  '#ff33ff', '#ff3333', '#ff9933', '#ebd73f', '#33ff33', '#33ccff', '#3333ff', '#9933ff', '#ffffff', '#808080'
];

export const AVATAR_EYES = [
  'Normal', 'Angry', 'Happy', 'Surprised', 'Cool', 'Cyclops'
];

export const AVATAR_MOUTHS = [
  'Neutral', 'Smile', 'Frown', 'Open', 'Teeth', 'Tongue'
];

export const AVATAR_HEADGEAR = [
  'None', 'Crown', 'Beanie', 'Halo', 'Horns'
];

export default function CustomAvatar({ config, size = 64 }) {
  const c = config || { color: 0, eyes: 0, mouth: 0, headgear: 0 };
  const baseColor = AVATAR_COLORS[c.color] || AVATAR_COLORS[0];
  const eyesType = AVATAR_EYES[c.eyes] || 'Normal';
  const mouthType = AVATAR_MOUTHS[c.mouth] || 'Neutral';
  const headgearType = AVATAR_HEADGEAR[c.headgear] || 'None';

  const idSuffix = `${c.color}-${c.eyes}-${c.mouth}-${c.headgear}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', filter: 'drop-shadow(0px 8px 10px rgba(0,0,0,0.3))' }} className="avatar-svg">
      <style>{`
        .avatar-svg {
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .avatar-svg:hover {
          transform: scale(1.1) translateY(-5px);
        }
        .avatar-eye {
          transform-origin: 50% 45%;
          animation: blink 4s infinite;
        }
        @keyframes blink {
          0%, 96%, 98%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        .avatar-float {
          animation: floatBody 3s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes floatBody {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
      
      <defs>
        <radialGradient id={`bodyGrad-${idSuffix}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="30%" stopColor={baseColor} stopOpacity="1" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`shadeGrad-${idSuffix}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </linearGradient>
      </defs>

      <g className="avatar-float">
        {/* Shadow */}
        <ellipse cx="50" cy="95" rx="30" ry="5" fill="rgba(0,0,0,0.2)" />

        {/* Head / Body Base - Cute Squishy Blob */}
        <path d="M 15 55 Q 15 15 50 15 Q 85 15 85 55 Q 85 90 50 90 Q 15 90 15 55 Z" fill={`url(#bodyGrad-${idSuffix})`} />
        {/* Shading overlay */}
        <path d="M 15 55 Q 15 15 50 15 Q 85 15 85 55 Q 85 90 50 90 Q 15 90 15 55 Z" fill={`url(#shadeGrad-${idSuffix})`} />
        
        {/* Border / Outline */}
        <path d="M 15 55 Q 15 15 50 15 Q 85 15 85 55 Q 85 90 50 90 Q 15 90 15 55 Z" fill="none" stroke="#111" strokeWidth="4" />
        
        {/* Eyes Layer */}
        <g className="avatar-eye" transform="translate(0, 5)">
          {eyesType === 'Normal' && (
            <g>
              <ellipse cx="35" cy="45" rx="4" ry="6" fill="#111" />
              <ellipse cx="65" cy="45" rx="4" ry="6" fill="#111" />
              <circle cx="33" cy="43" r="1.5" fill="#fff" />
              <circle cx="63" cy="43" r="1.5" fill="#fff" />
            </g>
          )}
          {eyesType === 'Angry' && (
            <g>
              <circle cx="35" cy="46" r="4" fill="#111" />
              <circle cx="65" cy="46" r="4" fill="#111" />
              <path d="M 25 38 L 42 43" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <path d="M 75 38 L 58 43" stroke="#111" strokeWidth="4" strokeLinecap="round" />
            </g>
          )}
          {eyesType === 'Happy' && (
            <g fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round">
              <path d="M 28 47 Q 35 38 42 47" />
              <path d="M 58 47 Q 65 38 72 47" />
            </g>
          )}
          {eyesType === 'Surprised' && (
            <g fill="none" stroke="#111" strokeWidth="3.5">
              <circle cx="35" cy="45" r="5" />
              <circle cx="65" cy="45" r="5" />
            </g>
          )}
          {eyesType === 'Cool' && (
            <g>
              <rect x="23" y="40" width="24" height="12" rx="4" fill="#111" />
              <rect x="53" y="40" width="24" height="12" rx="4" fill="#111" />
              <line x1="47" y1="44" x2="53" y2="44" stroke="#111" strokeWidth="4" />
              <path d="M 26 42 L 40 42" stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
            </g>
          )}
          {eyesType === 'Cyclops' && (
            <g>
              <circle cx="50" cy="45" r="12" fill="#fff" stroke="#111" strokeWidth="4" />
              <circle cx="50" cy="45" r="4" fill="#111" />
              <circle cx="48" cy="43" r="1.5" fill="#fff" />
            </g>
          )}
        </g>

        {/* Mouth Layer */}
        <g transform="translate(0, 8)">
          {mouthType === 'Neutral' && (
            <line x1="43" y1="65" x2="57" y2="65" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          )}
          {mouthType === 'Smile' && (
            <path d="M 38 62 Q 50 74 62 62" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          )}
          {mouthType === 'Frown' && (
            <path d="M 40 68 Q 50 58 60 68" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
          )}
          {mouthType === 'Open' && (
            <ellipse cx="50" cy="65" rx="6" ry="9" fill="#111" />
          )}
          {mouthType === 'Teeth' && (
            <g>
              <rect x="36" y="60" width="28" height="10" rx="3" fill="#fff" stroke="#111" strokeWidth="3" />
              <line x1="43" y1="60" x2="43" y2="70" stroke="#111" strokeWidth="2" />
              <line x1="50" y1="60" x2="50" y2="70" stroke="#111" strokeWidth="2" />
              <line x1="57" y1="60" x2="57" y2="70" stroke="#111" strokeWidth="2" />
            </g>
          )}
          {mouthType === 'Tongue' && (
            <g>
              <path d="M 38 62 Q 50 74 62 62" fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" />
              <path d="M 45 67 C 45 78, 55 78, 55 67 Z" fill="#ff6699" stroke="#111" strokeWidth="3" />
            </g>
          )}
        </g>

        {/* Headgear Layer */}
        <g transform="translate(0, 0)">
          {headgearType === 'Crown' && (
            <path d="M 28 25 L 22 5 L 35 15 L 50 0 L 65 15 L 78 5 L 72 25 Z" fill="#ebd73f" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
          )}
          {headgearType === 'Beanie' && (
            <g>
              <path d="M 22 25 C 22 -5, 78 -5, 78 25 Z" fill="#ff3333" stroke="#111" strokeWidth="3" />
              <path d="M 18 25 L 82 25 L 80 32 L 20 32 Z" fill="#cc0000" stroke="#111" strokeWidth="3" />
              <circle cx="50" cy="0" r="7" fill="#fff" stroke="#111" strokeWidth="3" />
            </g>
          )}
          {headgearType === 'Halo' && (
            <g>
              <ellipse cx="50" cy="-2" rx="22" ry="7" fill="none" stroke="#ebd73f" strokeWidth="4" />
              <line x1="50" y1="5" x2="50" y2="15" stroke="#ebd73f" strokeWidth="2" opacity="0.5" />
            </g>
          )}
          {headgearType === 'Horns' && (
            <g fill="#ff3333" stroke="#111" strokeWidth="3">
              <path d="M 30 18 Q 15 -5 32 0 Q 35 10 38 15 Z" />
              <path d="M 70 18 Q 85 -5 68 0 Q 65 10 62 15 Z" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
