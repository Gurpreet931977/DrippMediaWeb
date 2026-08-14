'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled to ensure complete client-side compatibility in Next.js
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// 1. Golden Vector Checkmark Lottie Data (Smooth 60fps stroke draw + bounce bloom)
export const checkmarkLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 40,
  w: 100,
  h: 100,
  nm: "GoldCheck",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Checkmark",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [40, 40, 100] },
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 22, s: [115, 115, 100] },
            { t: 36, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ind: 0,
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0]],
                  v: [[-18, 0], [-6, 12], [18, -12]],
                  c: false
                }
              },
              nm: "Path"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.92, 0.84, 0.25, 1] }, // #ebd73f
              o: { a: 0, k: 100 },
              w: { a: 0, k: 7.5 },
              lc: 2,
              lj: 2,
              nm: "Stroke"
            },
            {
              ty: "tm",
              s: { a: 0, k: 0 },
              e: {
                a: 1,
                k: [
                  { i: { x: [0.2], y: [1] }, o: { x: [0.3], y: [0] }, t: 6, s: [0] },
                  { t: 28, s: [100] }
                ]
              },
              o: { a: 0, k: 0 },
              m: 1,
              nm: "Trim"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "CheckGroup"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Ring",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { i: { x: [0.2], y: [1] }, o: { x: [0.3], y: [0] }, t: 0, s: [0] },
            { i: { x: [0.2], y: [1] }, o: { x: [0.3], y: [0] }, t: 10, s: [100] },
            { t: 36, s: [100] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [60, 60, 100] },
            { t: 30, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [76, 76] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.18] }, // Transparent gold fill
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.8] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 4 },
              nm: "Stroke"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "RingGroup"
        }
      ]
    }
  ]
};

// 2. Pulse / Live Radar Wave Lottie Data
export const pulseRadarLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 90,
  w: 60,
  h: 60,
  nm: "RadarPulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "CoreDot",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 0, s: [85, 85, 100] },
            { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 45, s: [115, 115, 100] },
            { t: 90, s: [85, 85, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [14, 14] },
              p: { a: 0, k: [0, 0] },
              nm: "Dot"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "DotGroup"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Wave1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 0, s: [80] },
            { t: 90, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [30, 30, 100] },
            { t: 90, s: [190, 190, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [24, 24] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.8] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 2.5 },
              nm: "Stroke"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "WaveGroup"
        }
      ]
    }
  ]
};

// 3. Sparkle / AI Twinkle Lottie Data
export const sparklesLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 60,
  h: 60,
  nm: "Sparkles",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "StarBig",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 0, s: [0] },
            { t: 60, s: [90] }
          ]
        },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [40, 40, 100] },
            { i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 30, s: [115, 115, 100] },
            { t: 60, s: [40, 40, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 4 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 16 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "StarGroup"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "StarSmall",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 0, s: [90] },
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 30, s: [30] },
            { t: 60, s: [90] }
          ]
        },
        r: {
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 0, s: [45] },
            { t: 60, s: [-45] }
          ]
        },
        p: { a: 0, k: [46, 16, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [100, 100, 100] },
            { i: { x: [0.2, 0.2, 0.2], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 30, s: [30, 30, 100] },
            { t: 60, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 4 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 2 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 8 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [1, 1, 1, 0.9] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "SmallStarGroup"
        }
      ]
    }
  ]
};

// 4. Star Favorite Burst Lottie Data
export const starBurstLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 35,
  w: 60,
  h: 60,
  nm: "StarBurst",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "MainStar",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { i: { x: [0.2], y: [1] }, o: { x: [0.2], y: [0] }, t: 0, s: [-25] },
            { t: 25, s: [0] }
          ]
        },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 0, s: [20, 20, 100] },
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 18, s: [130, 130, 100] },
            { t: 32, s: [100, 100, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sr",
              sy: 1,
              d: 1,
              pt: { a: 0, k: 5 },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 0 },
              ir: { a: 0, k: 7 },
              is: { a: 0, k: 0 },
              or: { a: 0, k: 17 },
              os: { a: 0, k: 0 },
              nm: "Star"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "MainStarGroup"
        }
      ]
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "BurstRays",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.2], y: [0] }, t: 8, s: [100] },
            { t: 30, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { i: { x: [0.16, 0.16, 0.16], y: [1, 1, 1] }, o: { x: [0.3, 0.3, 0.3], y: [0, 0, 0] }, t: 6, s: [30, 30, 100] },
            { t: 30, s: [150, 150, 100] }
          ]
        }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [4, 4] },
              p: { a: 0, k: [0, -19] },
              nm: "DotTop"
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [4, 4] },
              p: { a: 0, k: [18, -6] },
              nm: "DotRight"
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [4, 4] },
              p: { a: 0, k: [-18, -6] },
              nm: "DotLeft"
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [4, 4] },
              p: { a: 0, k: [11, 15] },
              nm: "DotBottomRight"
            },
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [4, 4] },
              p: { a: 0, k: [-11, 15] },
              nm: "DotBottomLeft"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.9] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "BurstGroup"
        }
      ]
    }
  ]
};

// 5. Empty Document / Notes Float Lottie Data
export const emptyDocLottieData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 120,
  w: 120,
  h: 120,
  nm: "EmptyDoc",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "DocCard",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: {
          a: 1,
          k: [
            { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 0, s: [60, 58, 0] },
            { i: { x: [0.4, 0.4, 0.4], y: [1, 1, 1] }, o: { x: [0.2, 0.2, 0.2], y: [0, 0, 0] }, t: 60, s: [60, 52, 0] },
            { t: 120, s: [60, 58, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [56, 72] },
              p: { a: 0, k: [0, 0] },
              r: { a: 0, k: 10 },
              nm: "CardRect"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.1, 0.1, 0.12, 0.95] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.4] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 2 },
              nm: "Stroke"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "CardGroup"
        },
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [32, 4] },
              p: { a: 0, k: [-4, -16] },
              r: { a: 0, k: 2 },
              nm: "Line1"
            },
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [36, 4] },
              p: { a: 0, k: [-2, -4] },
              r: { a: 0, k: 2 },
              nm: "Line2"
            },
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [24, 4] },
              p: { a: 0, k: [-8, 8] },
              r: { a: 0, k: 2 },
              nm: "Line3"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.92, 0.84, 0.25, 0.7] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "LinesGroup"
        }
      ]
    }
  ]
};

// ----------------------------------------------------
// Reusable Micro-Animation Components
// ----------------------------------------------------

/**
 * Lottie-powered Checkbox
 */
export function LottieCheck({ checked, onToggle, size = 22, disabled = false }) {
  const lottieRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lottieRef.current) {
      if (checked) {
        lottieRef.current.goToAndPlay(0, true);
      }
    }
  }, [checked]);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onToggle) onToggle();
      }}
      style={{
        width: `${Math.max(size + 16, 44)}px`, // minimum 44px touch ergonomics on mobile
        height: `${Math.max(size + 16, 44)}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        padding: 0,
        margin: '-8px -4px -8px -8px',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        outline: 'none'
      }}
      title={checked ? "Mark as uncompleted" : "Mark as completed"}
    >
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '6px',
        border: checked ? 'none' : '2px solid rgba(255, 255, 255, 0.25)',
        background: checked ? 'transparent' : 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: checked ? '0 0 14px rgba(235, 215, 63, 0.3)' : 'none',
        position: 'relative'
      }}>
        {checked && mounted ? (
          <div style={{ width: `${size + 4}px`, height: `${size + 4}px`, position: 'absolute', pointerEvents: 'none' }}>
            <Lottie
              lottieRef={lottieRef}
              animationData={checkmarkLottieData}
              loop={false}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ) : null}
      </div>
    </button>
  );
}

/**
 * Lottie-powered Workspace Live Status Pulse
 */
export function LottiePulse({ status = 'synced', size = 18 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const colorMap = {
    synced: '#27c93f',
    pending: '#ebd73f',
    syncing: '#3b82f6',
    ready: '#888888'
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      {mounted ? (
        <Lottie
          animationData={pulseRadarLottieData}
          loop={true}
          autoplay={true}
          style={{ width: `${size * 1.5}px`, height: `${size * 1.5}px` }}
        />
      ) : (
        <div style={{ width: `${size * 0.5}px`, height: `${size * 0.5}px`, borderRadius: '50%', background: colorMap[status] || '#ebd73f' }} />
      )}
    </div>
  );
}

/**
 * Lottie-powered Sparkles for AI & Actions
 */
export function LottieSparkles({ size = 18, loop = true }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <span style={{ display: 'inline-block', width: size, height: size }}>✨</span>;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
      <Lottie
        animationData={sparklesLottieData}
        loop={loop}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

/**
 * Lottie-powered Star Favorite Button
 */
export function LottieStar({ isFavorite, onToggle, size = 20 }) {
  const [mounted, setMounted] = useState(false);
  const lottieRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onToggle) onToggle(e);
        if (lottieRef.current && !isFavorite) {
          lottieRef.current.goToAndPlay(0, true);
        }
      }}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        transition: 'background 0.2s',
        outline: 'none',
        touchAction: 'manipulation',
        minWidth: '40px',
        minHeight: '40px'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorite && mounted ? (
        <div style={{ width: `${size + 4}px`, height: `${size + 4}px`, pointerEvents: 'none' }}>
          <Lottie
            lottieRef={lottieRef}
            animationData={starBurstLottieData}
            loop={false}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
    </button>
  );
}

/**
 * Lottie Empty State Illustration
 */
export function LottieEmptyState({ title = "No Documents Found", subtitle = "Try adjusting your search filters or create a new note.", actionLabel, onAction }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '80px', height: '80px', marginBottom: '16px' }}>
        {mounted && (
          <Lottie
            animationData={emptyDocLottieData}
            loop={true}
            autoplay={true}
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#fff', fontFamily: "'Panchang', sans-serif", letterSpacing: '0.5px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#888', maxWidth: '300px', lineHeight: 1.6, margin: '0 0 20px 0', fontFamily: "'Clash Display', sans-serif" }}>
        {subtitle}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #ebd73f 0%, #d4bc1c 100%)',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(235, 215, 63, 0.2)'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
