'use client';

import React from 'react';

/**
 * CreativeSpark - Modern, bespoke creative AI icon component for Dripp Media.
 * Replaces the generic clip-art Sparkles with precision-engineered cyber geometry.
 * 
 * Variants:
 * - 'prismatic' (Default): Razor-sharp luxury 4-point hypocycloid star with diamond refraction core and satellite micro-prism.
 * - 'quantum': Intersecting dual-orbit gyroscopic rings with glowing central intelligence core.
 * - 'crystal': 3D faceted isometric prism shard with refractive internal wireframes.
 * - 'minimal': High-speed razor-cut 4-point diamond needle burst.
 */
export default function CreativeSpark({ 
  size = 16, 
  color = 'currentColor', 
  strokeWidth = 1.8, 
  className = '', 
  style = {},
  variant = 'prismatic',
  fillOpacity = 0.16,
  ...props 
}) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    style: { 
      display: 'inline-block', 
      verticalAlign: 'middle', 
      flexShrink: 0,
      ...style 
    },
    ...props
  };

  if (variant === 'quantum') {
    return (
      <svg {...commonProps}>
        <ellipse 
          cx="12" 
          cy="12" 
          rx="9.5" 
          ry="4.5" 
          transform="rotate(-28 12 12)" 
          stroke={color} 
          strokeWidth={strokeWidth} 
        />
        <ellipse 
          cx="12" 
          cy="12" 
          rx="9.5" 
          ry="4.5" 
          transform="rotate(34 12 12)" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeDasharray="18 3"
        />
        <circle cx="12" cy="12" r="2.5" fill={color} />
        <circle cx="19.5" cy="7.5" r="1.3" fill={color} />
      </svg>
    );
  }

  if (variant === 'crystal') {
    return (
      <svg {...commonProps}>
        <path 
          d="M12 2L20 8L12 22L4 8L12 2Z" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round"
          fill={color}
          fillOpacity={fillOpacity}
        />
        <line x1="4" y1="8" x2="20" y2="8" stroke={color} strokeWidth={strokeWidth * 0.8} />
        <line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth * 0.8} />
        <polygon points="12,2 16,8 12,14 8,8" fill={color} opacity="0.35" />
      </svg>
    );
  }

  if (variant === 'minimal') {
    return (
      <svg {...commonProps}>
        <path 
          d="M12 1.5L13.6 10.4L22.5 12L13.6 13.6L12 22.5L10.4 13.6L1.5 12L10.4 10.4L12 1.5Z" 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeLinejoin="round"
          fill={color}
          fillOpacity={fillOpacity}
        />
        <circle cx="12" cy="12" r="1.3" fill="#050508" />
      </svg>
    );
  }

  // Default: 'prismatic' (Dripp signature ✦ cyber star with diamond refraction core)
  return (
    <svg {...commonProps}>
      {/* Precision Astroid / Hypocycloid Star Body */}
      <path 
        d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill={color}
        fillOpacity={fillOpacity}
      />
      {/* Central Diamond Refraction Core */}
      <path 
        d="M12 7.5L15.5 12L12 16.5L8.5 12Z" 
        fill={color} 
        stroke="none"
        opacity="0.85"
      />
      {/* Focal Cyber Core Aperture */}
      <circle 
        cx="12" 
        cy="12" 
        r="1.2" 
        fill="#050508" 
        stroke="none"
      />
      {/* Satellite Micro Prism Spark */}
      <path 
        d="M19.5 2.5C19.5 4 20.2 4.6 21.5 4.6C20.2 4.6 19.5 5.2 19.5 6.7C19.5 5.2 18.8 4.6 17.5 4.6C18.8 4.6 19.5 4 19.5 2.5Z" 
        fill={color} 
        stroke="none"
        opacity="0.9"
      />
    </svg>
  );
}

// Named alias export for seamless drop-in compatibility
export { CreativeSpark as Sparkles };
