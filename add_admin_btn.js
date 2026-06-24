const fs = require('fs');
let content = fs.readFileSync('app/developermodeon/page.jsx', 'utf8');

const adminBtn = `
            <a
                href="/admin-panel"
                style={{
                    position: 'fixed',
                    bottom: '85px',
                    right: '30px',
                    zIndex: 9999,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    fontFamily: "'Clash Display', sans-serif",
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    textDecoration: 'none'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Admin Panel
            </a>`;

// Find the closing fragment and insert before it
const target = "    </>\n\n  );\n}";
const replacement = adminBtn + "\n    </>\n\n  );\n}";

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('app/developermodeon/page.jsx', content);
    console.log("Admin button added successfully.");
} else {
    console.log("Target not found. Trying alternate approach.");
    // Find alternate
    const alt = "    </>\n  );\n}";
    if (content.includes(alt)) {
        content = content.replace(alt, adminBtn + "\n    </>\n  );\n}");
        fs.writeFileSync('app/developermodeon/page.jsx', content);
        console.log("Admin button added with alternate match.");
    } else {
        console.log("Neither target found.");
        // Print the last 200 chars
        console.log("End of file:", JSON.stringify(content.slice(-200)));
    }
}
