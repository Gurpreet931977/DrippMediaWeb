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
  const bgColor = AVATAR_COLORS[c.color] || AVATAR_COLORS[0];
  const eyesType = AVATAR_EYES[c.eyes] || 'Normal';
  const mouthType = AVATAR_MOUTHS[c.mouth] || 'Neutral';
  const headgearType = AVATAR_HEADGEAR[c.headgear] || 'None';

  // Base SVG wrapper
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      
      {/* Head / Body Base */}
      <rect x="20" y="30" width="60" height="60" rx="20" fill={bgColor} stroke="#000" strokeWidth="4" />
      {/* Shoulders */}
      <path d="M 20 90 Q 50 70 80 90 L 90 100 L 10 100 Z" fill={bgColor} stroke="#000" strokeWidth="4" />

      {/* Eyes Layer */}
      <g transform="translate(0, 5)">
        {eyesType === 'Normal' && (
          <g>
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
          </g>
        )}
        {eyesType === 'Angry' && (
          <g>
            <circle cx="35" cy="45" r="4" fill="#000" />
            <circle cx="65" cy="45" r="4" fill="#000" />
            <line x1="25" y1="38" x2="40" y2="42" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="38" x2="60" y2="42" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {eyesType === 'Happy' && (
          <g fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round">
            <path d="M 30 47 Q 35 40 40 47" />
            <path d="M 60 47 Q 65 40 70 47" />
          </g>
        )}
        {eyesType === 'Surprised' && (
          <g fill="none" stroke="#000" strokeWidth="3">
            <circle cx="35" cy="45" r="5" />
            <circle cx="65" cy="45" r="5" />
          </g>
        )}
        {eyesType === 'Cool' && (
          <g>
            <rect x="25" y="40" width="22" height="10" rx="3" fill="#000" />
            <rect x="53" y="40" width="22" height="10" rx="3" fill="#000" />
            <line x1="47" y1="42" x2="53" y2="42" stroke="#000" strokeWidth="3" />
          </g>
        )}
        {eyesType === 'Cyclops' && (
          <g>
            <circle cx="50" cy="45" r="10" fill="#fff" stroke="#000" strokeWidth="3" />
            <circle cx="50" cy="45" r="3" fill="#000" />
          </g>
        )}
      </g>

      {/* Mouth Layer */}
      <g transform="translate(0, 10)">
        {mouthType === 'Neutral' && (
          <line x1="42" y1="65" x2="58" y2="65" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        )}
        {mouthType === 'Smile' && (
          <path d="M 38 62 Q 50 72 62 62" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        )}
        {mouthType === 'Frown' && (
          <path d="M 40 68 Q 50 60 60 68" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
        )}
        {mouthType === 'Open' && (
          <ellipse cx="50" cy="65" rx="5" ry="8" fill="#000" />
        )}
        {mouthType === 'Teeth' && (
          <g>
            <rect x="38" y="60" width="24" height="8" rx="2" fill="#fff" stroke="#000" strokeWidth="2" />
            <line x1="44" y1="60" x2="44" y2="68" stroke="#000" strokeWidth="1" />
            <line x1="50" y1="60" x2="50" y2="68" stroke="#000" strokeWidth="1" />
            <line x1="56" y1="60" x2="56" y2="68" stroke="#000" strokeWidth="1" />
          </g>
        )}
        {mouthType === 'Tongue' && (
          <g>
            <path d="M 38 62 Q 50 72 62 62" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
            <path d="M 45 66 C 45 75, 55 75, 55 66 Z" fill="#ff6699" stroke="#000" strokeWidth="2" />
          </g>
        )}
      </g>

      {/* Headgear Layer */}
      <g transform="translate(0, 0)">
        {headgearType === 'Crown' && (
          <path d="M 25 35 L 20 15 L 35 25 L 50 10 L 65 25 L 80 15 L 75 35 Z" fill="#ebd73f" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        )}
        {headgearType === 'Beanie' && (
          <g>
            <path d="M 20 35 C 20 10, 80 10, 80 35 Z" fill="#ff3333" stroke="#000" strokeWidth="3" />
            <circle cx="50" cy="12" r="6" fill="#fff" stroke="#000" strokeWidth="2" />
          </g>
        )}
        {headgearType === 'Halo' && (
          <ellipse cx="50" cy="15" rx="25" ry="8" fill="none" stroke="#ebd73f" strokeWidth="4" />
        )}
        {headgearType === 'Horns' && (
          <g fill="#ff3333" stroke="#000" strokeWidth="3">
            <path d="M 30 30 Q 20 10 35 15 Q 35 25 30 30" />
            <path d="M 70 30 Q 80 10 65 15 Q 65 25 70 30" />
          </g>
        )}
      </g>

    </svg>
  );
}
