const fs = require('fs');
const path = './app/admin-panel/components/CopilotChat.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Update imports
content = content.replace(
  /import \{ X, Send \} from 'lucide-react';/,
  "import { X, Send, ChevronLeft, Grid, Bookmark, MoreHorizontal, ArrowLeft } from 'lucide-react';"
);

// 2. Add showProfile state
content = content.replace(
  /const \[isOpen, setIsOpen\] = useState\(false\);/,
  "const [isOpen, setIsOpen] = useState(false);\n  const [showProfile, setShowProfile] = useState(false);"
);

// 3. Add CSS for profile modal
const profileCss = `
        .profile-modal {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 15, 15, 0.98);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          z-index: 10;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .profile-modal::-webkit-scrollbar {
          width: 0px;
        }
        
        .profile-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          background: rgba(15, 15, 15, 0.9);
          backdrop-filter: blur(10px);
          z-index: 11;
        }

        .profile-stats-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        
        .stat-value {
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        .stat-label {
          color: #888;
          font-size: 0.75rem;
        }

        .profile-bio {
          padding: 0 20px 20px 20px;
          font-size: 0.85rem;
          color: #ddd;
          line-height: 1.5;
        }

        .profile-actions {
          display: flex;
          gap: 10px;
          padding: 0 20px 20px 20px;
        }

        .btn-follow {
          flex: 1;
          background: #ebd73f;
          color: #000;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .btn-follow:hover { opacity: 0.9; }

        .btn-message {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .btn-message:hover { background: rgba(255, 255, 255, 0.15); }

        .profile-grid-tabs {
          display: flex;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .grid-tab {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 12px 0;
          border-bottom: 2px solid #ebd73f;
          color: #ebd73f;
        }
        
        .grid-tab-inactive {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 12px 0;
          color: #666;
          border-bottom: 2px solid transparent;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2px;
          padding-bottom: 20px;
        }
        
        .grid-item {
          aspect-ratio: 1 / 1;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .grid-item:hover { transform: scale(0.98); }`;

content = content.replace(
  /\.chat-container \{/,
  `${profileCss}\n        .chat-container {`
);

// 4. Update the chat view rendering
content = content.replace(
  /<div className="chat-header">/,
  '<div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>\n          <div className="chat-header">'
);
content = content.replace(
  /<\/form>\n        <\/div>\n      \)\}/,
  '</form>\n          </div>'
);

// 5. Add the profile modal HTML and close the chat-container
const profileHtml = `
          {/* Profile View overlay */}
          <div 
            className="profile-modal" 
            style={{ 
              transform: showProfile ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.2)'
            }}
          >
            <div className="profile-header-bar">
              <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                <ArrowLeft size={24} />
              </button>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#fff' }}>orlo.ai</h2>
              <button style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>
                <MoreHorizontal size={24} />
              </button>
            </div>
            
            <div className="profile-stats-row">
              <div style={{ width: '84px', height: '84px', borderRadius: '50%', position: 'relative', border: '2px solid #ebd73f', padding: '3px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', position: 'relative', overflow: 'hidden', background: '#000' }}>
                   {/* Background Layer */}
                   <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                     <rect width="100" height="100" fill="url(#skyGrad)" />
                     <circle cx="20" cy="25" r="12" fill="#fff9c4" opacity="0.9" />
                     <circle cx="20" cy="25" r="18" fill="#fff9c4" opacity="0.3" />
                     <path d="M 45 35 Q 55 25 65 35 Q 75 30 80 40 L 45 40 Z" fill="#fff" opacity="0.7" />
                     <path d="M 5 45 Q 15 35 25 45 Q 35 40 40 50 L 5 50 Z" fill="#fff" opacity="0.5" />
                     <path d="M -20 100 L 30 45 L 70 85 L 100 55 L 130 100 Z" fill="url(#mountBack)" />
                   </svg>
                   {/* Orlo */}
                   <div style={{ position: 'absolute', bottom: '15%', left: '20%', zIndex: 1, width: '60%', height: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <OrloIcon size={46} color="#FFFFFF" emotion="success" />
                   </div>
                   {/* Foreground Layer */}
                   <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
                     <path d="M -10 100 Q 50 65 110 100 Z" fill="url(#mountFrontGrad)" />
                     <g transform="translate(60, 72)">
                       <path d="M 5 15 L 15 0 L 25 15 Z" fill="#ffb74d" />
                       <path d="M 15 0 L 25 15 L 15 15 Z" fill="#f57c00" />
                       <path d="M 12 15 L 15 8 L 18 15 Z" fill="#3e2723" />
                     </g>
                     <path d="M 10 100 Q 15 85 20 100 Z" fill="#33691e" opacity="0.4" />
                     <path d="M 85 100 Q 90 90 95 100 Z" fill="#33691e" opacity="0.4" />
                     <path d="M 45 100 Q 50 93 55 100 Z" fill="#33691e" opacity="0.4" />
                   </svg>
                </div>
              </div>
              
              <div className="stat-box">
                <span className="stat-value">1,204</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">98.2K</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">1</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            <div className="profile-bio">
              <strong style={{ color: '#fff', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>Orlo 💧</strong>
              <span style={{ color: '#aaa' }}>Dripp AI Copilot</span><br/>
              Crafting premium, high-converting emails. 🚀<br/>
              Ready to scale your media presence.<br/>
              <a href="#" style={{ color: '#ebd73f', textDecoration: 'none', fontWeight: '500' }}>dripp.com/orlo</a>
            </div>

            <div className="profile-actions">
              <button className="btn-follow">Following</button>
              <button className="btn-message" onClick={() => setShowProfile(false)}>Message</button>
            </div>

            <div className="profile-grid-tabs">
              <div className="grid-tab"><Grid size={22} /></div>
              <div className="grid-tab-inactive"><Bookmark size={22} /></div>
            </div>

            <div className="profile-grid">
              {['Welcome Flow', 'Sale Alert', 'Newsletter', 'Upsell', 'Win-back', 'VIP Invite', 'Product Drop', 'Survey', 'Thank You'].map((post, idx) => (
                <div key={idx} className="grid-item">
                  <div style={{ position: 'absolute', inset: 0, background: \`linear-gradient(\${135 + idx * 40}deg, rgba(235, 215, 63, 0.2), rgba(0,0,0,0.8))\` }} />
                  <div style={{ zIndex: 1, textAlign: 'center', padding: '10px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#ebd73f', fontWeight: 'bold', marginBottom: '4px' }}>{post}</div>
                    <div style={{ fontSize: '0.6rem', color: '#aaa' }}>{Math.floor(Math.random() * 40 + 20)}% Open Rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}`;

content = content.replace(
  /<\/form>\n          <\/div>/,
  `</form>\n          </div>\n${profileHtml}\n      )}`
);

// 6. Make Orlo's avatar clickable in the chat header
content = content.replace(
  /<div style=\{\{ width: '36px', height: '36px', borderRadius: '50%', position: 'relative', overflow: 'hidden' \}\}>/,
  `<div 
                style={{ width: '36px', height: '36px', borderRadius: '50%', position: 'relative', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(235, 215, 63, 0.5)' }}
                onClick={() => setShowProfile(true)}
                title="View Orlo's Profile"
              >`
);

// 7. Make Orlo's name clickable
content = content.replace(
  /<h3 style=\{\{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '600' \}\}>Orlo<\/h3>/,
  `<h3 
                  style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                  onClick={() => setShowProfile(true)}
                  title="View Orlo's Profile"
                >Orlo</h3>`
);

fs.writeFileSync(path, content);
