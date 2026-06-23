const fs = require('fs');
let content = fs.readFileSync('app/developermodeon/page.jsx', 'utf8');

// 1. Add imports
content = content.replace(
  "import { useEffect } from 'react';",
  "import { useEffect, useState } from 'react';\nimport ArcadeEngine from '../components/ArcadeEngine';"
);

// 2. Add state
content = content.replace(
  "export default function Page() {",
  "export default function Page() {\n  const [isArcadeOpen, setIsArcadeOpen] = useState(false);\n"
);

// 3. Add to end of JSX (before </>)
const arcadeJSX = `
            {isArcadeOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, backgroundColor: '#050505' }}>
                   <ArcadeEngine onClose={() => setIsArcadeOpen(false)} />
                </div>
            )}
            
            <div 
                onClick={() => setIsArcadeOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    zIndex: 9999,
                    backgroundColor: 'rgba(235, 215, 63, 0.1)',
                    border: '1px solid rgba(235, 215, 63, 0.5)',
                    color: '#ebd73f',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontFamily: "'Clash Display', sans-serif",
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    boxShadow: '0 0 15px rgba(235, 215, 63, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(235, 215, 63, 0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(235, 215, 63, 0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
                    <line x1="6" y1="12" x2="10" y2="12"></line>
                    <line x1="8" y1="10" x2="8" y2="14"></line>
                    <line x1="15" y1="13" x2="15.01" y2="13"></line>
                    <line x1="18" y1="11" x2="18.01" y2="11"></line>
                </svg>
                Arcade Mode
            </div>
    </>
`;

content = content.replace("    </>\n  );\n}", arcadeJSX + "\n  );\n}");

fs.writeFileSync('app/developermodeon/page.jsx', content);
console.log("Safe modification applied.");
