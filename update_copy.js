const fs = require('fs');
const path = require('path');

const updates = [
    // app/developermodeon/page.jsx
    { old: 'Lore', new: 'The Plot', files: ['app/developermodeon/page.jsx'] },
    { old: 'Vibes', new: 'The Aesthetic', files: ['app/developermodeon/page.jsx'] },
    { old: 'Tea', new: 'Spill', files: ['app/developermodeon/page.jsx'] },
    { old: 'Family', new: 'The Syndicate', files: ['app/developermodeon/page.jsx'] },
    { old: 'Plug It', new: 'Tap In', files: ['app/developermodeon/page.jsx'] },
    { old: 'Doomscroll', new: 'The Feed', files: ['app/developermodeon/page.jsx'] },
    { old: 'We build the timeline', new: 'We curate the simulation', files: ['app/developermodeon/page.jsx'] },
    { old: 'God Tier', new: 'Ethereal', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Sauce', new: 'The Formula', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Matrix', new: 'Cyber Space', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Source', new: 'The Architecture', files: ['app/developermodeon/page.jsx'] },
    { old: 'Our Meta', new: 'The Blueprint', files: ['app/developermodeon/page.jsx'] },
    { old: 'Build Your Loadout', new: 'Craft Your Build', files: ['app/developermodeon/page.jsx'] },
    { old: 'Est. Loot', new: 'Bag Size', files: ['app/developermodeon/page.jsx'] },
    { old: 'Final Boss.', new: 'The Architect.', files: ['app/developermodeon/page.jsx'] },
    { old: 'Join the Cult', new: 'Enter the Syndicate', files: ['app/developermodeon/page.jsx'] },
    { old: "LET'S COOK", new: 'INITIATE SEQUENCE', files: ['app/developermodeon/page.jsx'] },

    // app/dripp-studio/components/AdminSidebar.jsx
    { old: 'Main Base', new: 'Command Center', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'Brain Vault', new: 'The Mind Palace', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'Bag Securer', new: 'The Treasury', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Pitch Cooker', new: 'The Laboratory', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Masterplan Maker', new: "Architect's Desk", files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'The Showcase', new: 'The Archives', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Mail Blaster', new: 'Signal Emitter', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Glitch Radar', new: 'Anomaly Detection', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'The Engine', new: 'Core System', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Bounce to Site', new: 'Exit Simulation', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },

    // app/dripp-studio/errors/page.jsx
    { old: 'GLITCH', new: 'VIBE CHECK FAILED', files: ['app/dripp-studio/errors/page.jsx'] },
    { old: 'RADAR', new: 'ANOMALY DETECTED', files: ['app/dripp-studio/errors/page.jsx'] },
    { old: 'Catching every vibe kill in the system.', new: 'An anomaly has disrupted the simulation.', files: ['app/dripp-studio/errors/page.jsx'] },

    // app/dripp-studio/invoice/page.jsx
    { old: 'GEN-Z', new: 'THE BAG', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Drop receipts with payment links so you can get that bread.', new: 'Secure the bag. Automated transactions for the modern creator.', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'AI Brain dump', new: 'Neural Link', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Yap about your project here. AI will clutch up and organize the lore.', new: 'Brainstorm here. The AI will decrypt and structure your thoughts.', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'W', new: 'Secured', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Cook Invoice', new: 'Mint Invoice', files: ['app/dripp-studio/invoice/page.jsx'] },

    // app/dripp-studio/page.jsx (Others mapped above)
    { old: 'Brain Dump', new: 'Neural Hub', files: ['app/dripp-studio/page.jsx'] },
    { old: 'The Fixer', new: 'Anomaly Logs', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Main Character Energy', new: 'Protagonist Status', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Vibe Check: Passed', new: 'Aura: Impeccable', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Action Items to Crush', new: 'Side Quests', files: ['app/dripp-studio/page.jsx'] },

    // app/graphic-portfolio/page.jsx
    { old: 'Feed View', new: 'The Scroll', files: ['app/graphic-portfolio/page.jsx'] },
    { old: 'Enhance', new: 'Focus Mode', files: ['app/graphic-portfolio/page.jsx'] },
    { old: 'Swipe / Scroll to Explore', new: 'Drift to Explore', files: ['app/graphic-portfolio/page.jsx'] },
    { old: '2x Click', new: 'Manifest', files: ['app/graphic-portfolio/page.jsx'] },
    { old: '2x Tap', new: 'Manifest', files: ['app/graphic-portfolio/page.jsx'] },

    // app/video-portfolio/page.jsx & subpages
    { old: 'Lore', new: 'Cinematic Universe', files: ['app/video-portfolio/page.jsx'] },
    { old: 'Doomscroll', new: 'Brain Rot', files: ['app/video-portfolio/page.jsx'] },
    { old: 'The Lore', new: 'The Plot', files: ['app/video-portfolio/short-form/page.jsx'] },
    { old: 'The Aesthetic', new: 'The Vision', files: ['app/video-portfolio/short-form/page.jsx'] },

    // app/web-portfolio/page.jsx
    { old: 'Web Builds', new: 'Digital Real Estate', files: ['app/web-portfolio/page.jsx'] },
    { old: 'Digital Footprint', new: 'Cyber Worlds', files: ['app/web-portfolio/page.jsx'] },
    { old: 'Visit', new: 'Tap In', files: ['app/web-portfolio/page.jsx'] },
    { old: 'Hover to peep / Swipe ', new: 'Hover to manifest / Swipe ', files: ['app/web-portfolio/page.jsx'] },

    // app/page.jsx
    { old: 'HOW TO COOK', new: 'HOW TO SURVIVE', files: ['app/page.jsx'] },
    { old: 'aura', new: 'clout', files: ['app/page.jsx'] },
    { old: 'Cooking...', new: 'Materializing...', files: ['app/page.jsx'] },
    { old: 'COOKED!', new: 'ASCENDED!', files: ['app/page.jsx'] },
    { old: 'You fumbled.', new: 'Reality collapsed.', files: ['app/page.jsx'] },
    { old: 'Run it back', new: 'Respawn', files: ['app/page.jsx'] },
    { old: 'GOAT STATUS', new: 'THE PANTHEON', files: ['app/page.jsx'] },
];

const basePath = path.join(__dirname);

updates.forEach(update => {
    update.files.forEach(file => {
        const fullPath = path.join(basePath, file);
        if (fs.existsSync(fullPath)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replaces isGenz ? 'old' with isGenz ? 'new' and isGenz ? "old" with isGenz ? "new"
            const regexSingle = new RegExp(`isGenz\\s*\\?\\s*'${update.old.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&')}'`, 'g');
            const regexDouble = new RegExp(`isGenz\\s*\\?\\s*"${update.old.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g, '\\$&')}"`, 'g');
            
            content = content.replace(regexSingle, `isGenz ? '${update.new}'`);
            content = content.replace(regexDouble, `isGenz ? "${update.new}"`);
            
            fs.writeFileSync(fullPath, content);
            console.log(`Updated ${file}: ${update.old} -> ${update.new}`);
        } else {
            console.warn(`File not found: ${fullPath}`);
        }
    });
});
