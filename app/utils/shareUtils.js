export const generateScoreImage = async (score, gameName = null, isTopRecord = false) => {
    // Wait for fonts to load first just in case
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.ready;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    
    // Base Background - very dark
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add dynamic glowing orbs for that "modern crazy" feel
    const createGlow = (x, y, r, color) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    
    createGlow(canvas.width, 0, 800, 'rgba(235, 215, 63, 0.2)'); // top right yellow glow
    createGlow(0, canvas.height, 1000, 'rgba(235, 63, 63, 0.15)');  // bottom left red glow
    
    // Cool overlay grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 80) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 80) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Add some random techy dashes for an "arcade" feel
    ctx.fillStyle = 'rgba(235, 215, 63, 0.4)';
    for(let i=0; i<40; i++) {
       ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, Math.random()*8, Math.random()*25);
    }

    // Brand Header
    ctx.fillStyle = '#ebd73f'; 
    ctx.font = '800 95px "Panchang", sans-serif'; 
    ctx.textAlign = 'center';
    ctx.fillText('DRIPP MEDIA', canvas.width / 2, 320);
    
    // Sub-header (paired font)
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 35px "Clash Display", sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '8px';
    const subText = isTopRecord ? 'GLOBAL #1 RECORD' : (gameName ? `${gameName.toUpperCase()} RECORD` : 'CERTIFIED ARCADE FLEX');
    ctx.fillText(subText, canvas.width / 2, 380);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    // Decorative glassmorphism box around the score
    const boxY = 460;
    const boxH = 750;
    const boxW = 850;
    const boxX = (canvas.width - boxW) / 2;
    
    ctx.strokeStyle = 'rgba(235, 215, 63, 0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 40);
    ctx.stroke();
    
    // Inner glow for box
    ctx.fillStyle = 'rgba(235, 215, 63, 0.05)';
    ctx.fill();

    // High Score Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '600 45px "Panchang", sans-serif';
    ctx.fillText(isTopRecord ? 'TOP OF THE LEADERBOARD' : 'STATS JUST DROPPED', canvas.width / 2, boxY + 120);

    // Score Value - Massive and stylized
    ctx.fillStyle = '#ebd73f';
    ctx.font = '800 240px "Panchang", sans-serif';
    
    // Drop shadow for the score to make it pop
    ctx.shadowColor = 'rgba(235, 215, 63, 0.5)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    ctx.fillText(score.toString(), canvas.width / 2, boxY + 400);
    
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
    if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
    ctx.fillText(playerName, canvas.width / 2, boxY + 600);
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
    ctx.font = '700 35px "Panchang", sans-serif';
    ctx.fillText(getTaunt(score), canvas.width / 2, boxY + 680);

    // Call to Action Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '500 40px "Clash Display", sans-serif';
    ctx.fillText("BET YOU CAN'T BEAT THIS LIL BRO", canvas.width / 2, 1600);

    // Link styling
    ctx.fillStyle = '#ebd73f';
    ctx.font = '600 45px "Panchang", sans-serif';
    ctx.fillText('PLAY.DRIPPMEDIA.COM', canvas.width / 2, 1680);

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
