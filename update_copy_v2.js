const fs = require('fs');
const path = require('path');

const updates = [
    // app/developermodeon/page.jsx
    { old: 'The Plot', new: 'lore', files: ['app/developermodeon/page.jsx', 'app/video-portfolio/short-form/page.jsx'] },
    { old: 'The Aesthetic', new: 'vibes', files: ['app/developermodeon/page.jsx'] },
    { old: 'Spill', new: 'tea', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Syndicate', new: 'the fam', files: ['app/developermodeon/page.jsx'] },
    { old: 'Tap In', new: 'slide in', files: ['app/developermodeon/page.jsx', 'app/web-portfolio/page.jsx'] },
    { old: 'The Feed', new: 'doomscroll', files: ['app/developermodeon/page.jsx'] },
    { old: 'We curate the simulation', new: 'we build the timeline', files: ['app/developermodeon/page.jsx'] },
    { old: 'Ethereal', new: 'god tier', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Formula', new: 'the sauce', files: ['app/developermodeon/page.jsx'] },
    { old: 'Cyber Space', new: 'the matrix', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Architecture', new: 'the source', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Blueprint', new: 'our meta', files: ['app/developermodeon/page.jsx'] },
    { old: 'Craft Your Build', new: 'build your loadout', files: ['app/developermodeon/page.jsx'] },
    { old: 'Bag Size', new: 'est. loot', files: ['app/developermodeon/page.jsx'] },
    { old: 'The Architect.', new: 'final boss.', files: ['app/developermodeon/page.jsx'] },
    { old: 'Enter the Syndicate', new: 'join the cult', files: ['app/developermodeon/page.jsx'] },
    { old: 'INITIATE SEQUENCE', new: "let's cook", files: ['app/developermodeon/page.jsx'] },

    // app/dripp-studio/components/AdminSidebar.jsx
    { old: 'Command Center', new: 'main base', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'The Mind Palace', new: 'brain dump', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'The Treasury', new: 'get paid', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'The Laboratory', new: 'cook a pitch', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: "Architect's Desk", new: 'masterplans', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'The Archives', new: 'the showcase', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Signal Emitter', new: 'email blasts', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Anomaly Detection', new: 'glitches', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },
    { old: 'Core System', new: 'the engine', files: ['app/dripp-studio/components/AdminSidebar.jsx', 'app/dripp-studio/page.jsx'] },
    { old: 'Exit Simulation', new: 'bounce to site', files: ['app/dripp-studio/components/AdminSidebar.jsx'] },

    // app/dripp-studio/errors/page.jsx
    { old: 'VIBE CHECK FAILED', new: 'glitch', files: ['app/dripp-studio/errors/page.jsx'] },
    { old: 'ANOMALY DETECTED', new: 'radar', files: ['app/dripp-studio/errors/page.jsx'] },
    { old: 'An anomaly has disrupted the simulation.', new: 'catching every vibe kill in the system.', files: ['app/dripp-studio/errors/page.jsx'] },

    // app/dripp-studio/invoice/page.jsx
    { old: 'THE BAG', new: 'gen-z', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Secure the bag. Automated transactions for the modern creator.', new: 'drop receipts and get that bread.', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Neural Link', new: 'ai brain dump', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Brainstorm here. The AI will decrypt and structure your thoughts.', new: 'yap about your project here. ai will organize it.', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Secured', new: 'w', files: ['app/dripp-studio/invoice/page.jsx'] },
    { old: 'Mint Invoice', new: 'cook invoice', files: ['app/dripp-studio/invoice/page.jsx'] },

    // app/dripp-studio/page.jsx (Others mapped above)
    { old: 'Neural Hub', new: 'brain dump', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Anomaly Logs', new: 'the fixer', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Protagonist Status', new: 'main character energy', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Aura: Impeccable', new: 'vibe check: passed', files: ['app/dripp-studio/page.jsx'] },
    { old: 'Side Quests', new: 'action items to crush', files: ['app/dripp-studio/page.jsx'] },

    // app/graphic-portfolio/page.jsx
    { old: 'The Scroll', new: 'feed view', files: ['app/graphic-portfolio/page.jsx'] },
    { old: 'Focus Mode', new: 'enhance', files: ['app/graphic-portfolio/page.jsx'] },
    { old: 'Drift to Explore', new: 'swipe / scroll to explore', files: ['app/graphic-portfolio/page.jsx'] },
    // Manifest is tricky, skipping here and fixing it manually

    // app/video-portfolio/page.jsx & subpages
    { old: 'Cinematic Universe', new: 'lore', files: ['app/video-portfolio/page.jsx'] },
    { old: 'Brain Rot', new: 'doomscroll', files: ['app/video-portfolio/page.jsx'] },
    { old: 'The Vision', new: 'the aesthetic', files: ['app/video-portfolio/short-form/page.jsx'] },

    // app/web-portfolio/page.jsx
    { old: 'Digital Real Estate', new: 'web builds', files: ['app/web-portfolio/page.jsx'] },
    { old: 'Cyber Worlds', new: 'digital footprint', files: ['app/web-portfolio/page.jsx'] },
    { old: 'Hover to manifest / Swipe ', new: 'hover to peep / swipe ', files: ['app/web-portfolio/page.jsx'] },

    // app/page.jsx
    { old: 'HOW TO SURVIVE', new: 'how to cook', files: ['app/page.jsx'] },
    { old: 'clout', new: 'aura', files: ['app/page.jsx'] },
    { old: 'Materializing...', new: 'cooking...', files: ['app/page.jsx'] },
    { old: 'ASCENDED!', new: 'cooked!', files: ['app/page.jsx'] },
    { old: 'Reality collapsed.', new: 'you fumbled.', files: ['app/page.jsx'] },
    { old: 'Respawn', new: 'run it back', files: ['app/page.jsx'] },
    { old: 'THE PANTHEON', new: 'goat status', files: ['app/page.jsx'] },
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
