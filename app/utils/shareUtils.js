export const generateScoreImage = async (score, gameName = null, isTopRecord = false) => {
    // Wait for fonts to load first just in case
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Background gradient (darker, cleaner)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0d0d0d');
    bgGradient.addColorStop(1, '#050505');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Faint grid for tech feel, but very minimal
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 60) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Add minimal subtle glowing orbs
    const createSubtleGlow = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    
    createSubtleGlow(canvas.width, 0, 800, 'rgba(235, 215, 63, 0.08)'); 
    createSubtleGlow(0, canvas.height, 900, 'rgba(235, 63, 63, 0.05)');  
    createSubtleGlow(canvas.width / 2, canvas.height / 2 - 50, 600, 'rgba(235, 215, 63, 0.05)'); // center glow

    // Few minimal dashes
    ctx.fillStyle = 'rgba(235, 215, 63, 0.15)';
    for(let i=0; i<15; i++) {
       ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random()*5, Math.random()*15);
    }

    // --- HEADER ---
    ctx.fillStyle = '#ebd73f'; // Brand Yellow
    ctx.font = '800 85px "Panchang", sans-serif'; 
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
    ctx.fillText('DRIPP MEDIA', canvas.width / 2, 280);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    
    // Sub-header 
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '500 32px "Clash Display", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '10px';
    const subText = isTopRecord ? 'GLOBAL #1 RECORD' : (gameName ? `${gameName.toUpperCase()} RECORD` : 'CERTIFIED ARCADE FLEX');
    ctx.fillText(subText, canvas.width / 2, 350);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // --- MAIN BOX ---
    const boxY = 460;
    const boxH = 750;
    const boxW = 850;
    const boxX = (canvas.width - boxW) / 2;
    
    // Thin yellow rounded border
    ctx.strokeStyle = 'rgba(235, 215, 63, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 30); // 30px border radius
    ctx.stroke();
    
    // Inner box glow / fill (very subtle)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Slightly darken inside
    ctx.fill();

    // Box top text: "STATS JUST DROPPED"
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 45px "Panchang", sans-serif'; // More bold and wide font inside
    ctx.fillText(isTopRecord ? 'TOP OF THE LEADERBOARD' : 'STATS JUST DROPPED', canvas.width / 2, boxY + 120);

    // Score Value - Massive, centered, beautiful typography
    ctx.fillStyle = '#ebd73f';
    
    let fontSize = 280;
    const scoreStr = score.toString();
    ctx.font = `800 ${fontSize}px "Panchang", sans-serif`;
    
    // Scale down font size if score text is too wide to fit in the box
    while (ctx.measureText(scoreStr).width > 750 && fontSize > 60) {
      fontSize -= 10;
      ctx.font = `800 ${fontSize}px "Panchang", sans-serif`;
    }
    
    ctx.shadowColor = 'rgba(235, 215, 63, 0.4)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    // Adjusted Y coordinate for better vertical centering in the box
    ctx.fillText(scoreStr, canvas.width / 2, boxY + 410);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;
    
    // Player tag
    let playerName = 'NPC_01';
    if (typeof window !== 'undefined') {
       const storedUser = localStorage.getItem('dripp_user');
       if(storedUser) {
          try { playerName = JSON.parse(storedUser).name.toUpperCase(); } catch(e) {}
       }
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 45px "Clash Display", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
    ctx.fillText(playerName, canvas.width / 2, boxY + 580);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // Engaging Content / Dynamic Taunt
    const getTaunt = (s) => {
       if (isTopRecord) return "UNDEFEATED CHAMPION 👑";
       if (s > 10000) return "LITERALLY HIM 👑";
       if (s > 5000) return "ABSOLUTE CINEMA 🍿";
       if (s > 2000) return "ATE & LEFT NO CRUMBS 🍽️";
       if (s > 500) return "W RIZZ, KEEP GOING 👀";
       return "SKILL ISSUE DETECTED 💀";
    };

    ctx.fillStyle = '#ebd73f';
    ctx.font = '600 35px "Panchang", sans-serif';
    ctx.fillText(getTaunt(score), canvas.width / 2, boxY + 670);

    // --- FOOTER ---
    const footerView = 1600;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '400 35px "Clash Display", sans-serif';
    ctx.fillText("SET YOUR OWN RECORD AT", canvas.width / 2, footerView);

    // Link styling
    ctx.fillStyle = '#ebd73f';
    ctx.font = '700 45px "Panchang", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
    ctx.fillText('WWW.DRIPPMEDIA.COM', canvas.width / 2, footerView + 70);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
};

export const shareScoreImage = async (score, gameName = null, isTopRecord = false) => {
    try {
      const blob = await generateScoreImage(score, gameName, isTopRecord);
      const file = new File([blob], 'dripp-score.jpg', { type: 'image/jpeg' });
      const text = isTopRecord 
        ? `YAY! I am officially top of the leaderboard in ${gameName || 'Dripp Media Arcade'}! 🏆🔥 Can anyone beat my score of ${score}? Play now at https://drippmedia.com`
        : (gameName 
          ? `I just scored ${score} in ${gameName} on Dripp Media Arcade! Can you beat it? 🕹️🔥 Play now at https://drippmedia.com`
          : `I just set a new high score on Dripp Media Arcade! Can you beat it? 🕹️🔥 Play now at https://drippmedia.com`);

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Dripp Media High Score',
          text: text
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dripp-highscore.jpg';
        a.click();
        URL.revokeObjectURL(url);
        alert('Score image downloaded! You can now share it.');
      }
    } catch (err) {
      console.error('Share failed', err);
      const text = isTopRecord 
        ? `YAY! I am officially top of the leaderboard in ${gameName || 'Dripp Media Arcade'}! 🏆🔥 Can anyone beat my score of ${score}? Play now at https://drippmedia.com`
        : (gameName 
          ? `I just scored ${score} in ${gameName} on Dripp Media Arcade! Play now at https://drippmedia.com`
          : `I just scored ${score} on the Dripp Media Arcade! Play now at https://drippmedia.com`);
      navigator.clipboard.writeText(text);
      alert('Score text copied to clipboard! Paste it to share.');
    }
};
