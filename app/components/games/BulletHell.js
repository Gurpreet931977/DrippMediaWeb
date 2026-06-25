export default class BulletHell {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 100, r: 8, speed: 7 };
    this.level = 1;
    this.boss = { 
      x: canvas.width / 2, 
      y: 150, 
      r: 35, 
      hp: 100, 
      maxHp: 100, 
      phase: 0,
      color: "#ff0055"
    };
    
    this.bullets = [];
    this.particles = [];
    this.frame = 0;
    this.score = 0;
    this.state = "playing";
    this.targetPos = { x: this.player.x, y: this.player.y };
    
    // JUICE properties
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.bossHitTimer = 0;
    this.bossDamageCooldown = 0;
    this.levelUpTimer = 0;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    this.updateTarget(e);
  }

  handlePointerMove(e) {
    if (this.state !== "playing") return;
    this.updateTarget(e);
  }
  
  handlePointerUp(e) {}

  updateTarget(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.targetPos = {
      x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    };
  }

  fireBullet(x, y, angle, speed, type) {
    this.bullets.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: type === 'large' ? 12 : 5,
      type
    });
  }

  bossPattern() {
    // Boss moves wildly side to side, speed increases with level
    const speedMult = 1 + (this.level - 1) * 0.12;
    this.boss.x = this.canvas.width / 2 + Math.sin(this.frame * 0.03 * speedMult) * (this.canvas.width/2 - 100);
    this.boss.y = 150 + Math.sin(this.frame * 0.02 * speedMult) * 80;
    
    // Scale patterns based on level
    const phase = Math.floor(this.frame / 350) % 4;
    
    // Level 1 has simplified patterns and slower bullets
    const bulletSpeedFactor = Math.min(2.0, 0.7 + (this.level - 1) * 0.25);
    const fireIntervalFactor = Math.max(0.4, 1.2 - (this.level - 1) * 0.15);

    if (phase === 0) {
      // Dense double spiral
      const interval = Math.round(4 * fireIntervalFactor);
      if (this.frame % Math.max(1, interval) === 0) {
        const angle = this.frame * 0.15;
        this.fireBullet(this.boss.x, this.boss.y, angle, 4.5 * bulletSpeedFactor, 'normal');
        this.fireBullet(this.boss.x, this.boss.y, angle + Math.PI, 4.5 * bulletSpeedFactor, 'normal');
        if (this.level > 1) {
          this.fireBullet(this.boss.x, this.boss.y, -angle, 3 * bulletSpeedFactor, 'normal');
        }
      }
    } else if (phase === 1) {
      // Rapid rings
      const interval = Math.round(50 * fireIntervalFactor);
      if (this.frame % Math.max(10, interval) === 0) {
        const ringCount = Math.min(32, 12 + this.level * 4);
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * Math.PI * 2 + (this.frame * 0.01);
          this.fireBullet(this.boss.x, this.boss.y, angle, 2 * bulletSpeedFactor, 'large');
          if (this.level > 2) {
            this.fireBullet(this.boss.x, this.boss.y, angle + 0.1, 4 * bulletSpeedFactor, 'normal');
          }
        }
      }
    } else if (phase === 2) {
      // Sweeping lasers
      const interval = Math.round(7 * fireIntervalFactor);
      if (this.frame % Math.max(1, interval) === 0) {
         const sweep = Math.sin(this.frame * 0.05) * Math.PI * 0.5;
         const base = Math.PI / 2; // downwards
         this.fireBullet(this.boss.x, this.boss.y, base + sweep, 6 * bulletSpeedFactor, 'normal');
         this.fireBullet(this.boss.x, this.boss.y, base - sweep, 6 * bulletSpeedFactor, 'normal');
      }
    } else if (phase === 3) {
      // Aimed shotgun burst
      const interval = Math.round(35 * fireIntervalFactor);
      if (this.frame % Math.max(10, interval) === 0) {
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const baseAngle = Math.atan2(dy, dx);
        const burstSpread = Math.min(6, 2 + this.level);
        for(let i = -burstSpread; i <= burstSpread; i++) {
           this.fireBullet(this.boss.x, this.boss.y, baseAngle + i * 0.12, (4 + Math.abs(i) * 0.5) * bulletSpeedFactor, 'large');
        }
      }
    }
  }

  update() {
    if (this.state === "failed" || this.state === "victory") return;
    this.frame++;
    
    this.score += 1;
    this.callbacks.setScoreRef(Math.floor(this.score / 10));
    if (this.frame % 10 === 0) this.callbacks.setScore(Math.floor(this.score / 10));

    if (this.levelUpTimer > 0) {
      this.levelUpTimer--;
    }

    // Boss death & level up
    if (this.boss.hp <= 0) {
       this.screenShake = 30;
       this.flashAlpha = 0.8;
       for(let p=0; p<40; p++) {
          this.particles.push({
             x: this.boss.x, y: this.boss.y,
             vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
             life: 80, color: this.boss.color
          });
       }
       this.bullets = [];
       
       // Advance Level
       this.level++;
       this.levelUpTimer = 90; // Show LEVEL UP screen text
       this.score += 1000 * this.level;
       this.callbacks.setScoreRef(Math.floor(this.score / 10));
       this.callbacks.setScore(Math.floor(this.score / 10));

       // Next Greater Boss stats
       const bossColors = ["#ff0055", "#00ffcc", "#e100ff", "#ffcc00", "#ff3300", "#ffffff"];
       const chosenColor = bossColors[(this.level - 1) % bossColors.length];
       
       const nextMaxHp = 100 + (this.level - 1) * 120;
       const nextRadius = Math.min(65, 35 + (this.level - 1) * 5);
       
       this.boss = {
         x: this.canvas.width / 2,
         y: 150,
         r: nextRadius,
         hp: nextMaxHp,
         maxHp: nextMaxHp,
         phase: 0,
         color: chosenColor
       };
    }

    // Move player towards target
    this.playerDx = this.targetPos.x - this.player.x;
    this.playerDy = this.targetPos.y - this.player.y;
    const dist = Math.hypot(this.playerDx, this.playerDy);
    
    if (this.bossHitTimer > 0) this.bossHitTimer--;
    if (this.bossDamageCooldown > 0) this.bossDamageCooldown--;

    if (dist > this.player.speed) {
      this.player.x += (this.playerDx / dist) * this.player.speed;
      this.player.y += (this.playerDy / dist) * this.player.speed;
    } else {
      this.player.x = this.targetPos.x;
      this.player.y = this.targetPos.y;
    }

    // Keep player in bounds
    this.player.x = Math.max(this.player.r, Math.min(this.canvas.width - this.player.r, this.player.x));
    this.player.y = Math.max(this.player.r, Math.min(this.canvas.height - this.player.r, this.player.y));

    // Collision Check: Cursor/Player hits the Boss
    const distToBoss = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
    if (distToBoss < this.player.r + this.boss.r) {
      if (this.bossDamageCooldown <= 0) {
        this.boss.hp -= 5;
        this.bossDamageCooldown = 8; // 8 frames between hits
        this.bossHitTimer = 5;
        this.score += 20;
        this.screenShake = 6;
        
        // Spawn damage sparks
        for (let i = 0; i < 6; i++) {
          this.particles.push({
            x: this.player.x,
            y: this.player.y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            life: 25,
            color: this.boss.color
          });
        }
      }
    }

    this.bossPattern();

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let b = this.bullets[i];
      
      if (b.type === 'normal') {
         b.x += b.vx;
         b.y += b.vy;
      } else if (b.type === 'large') {
         b.vx *= 1.008;
         b.vy *= 1.008;
         b.x += b.vx;
         b.y += b.vy;
      }
      
      // Collision with player
      const bulletDist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (bulletDist < b.r + this.player.r - 2) {
         this.state = "failed";
         this.callbacks.setGameState("failed");
         this.screenShake = 20;
         for(let p=0; p<40; p++) {
            this.particles.push({
               x: this.player.x, y: this.player.y,
               vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
               life: 60, color: "#ffffff"
            });
         }
      }
      
      if (b.x < -50 || b.x > this.canvas.width + 50 || b.y < -50 || b.y > this.canvas.height + 50) {
        this.bullets.splice(i, 1);
      }
    }

    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    // Screenshake
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
      this.screenShake *= 0.8;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    ctx.fillStyle = "rgba(5,5,5,0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Screen Flash
    if (this.flashAlpha > 0) {
       ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
       ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
       this.flashAlpha -= 0.05;
    }
    
    // LEVEL UP screen splash text
    if (this.levelUpTimer > 0) {
       ctx.fillStyle = `rgba(0, 255, 200, ${Math.min(1.0, this.levelUpTimer / 30)})`;
       ctx.font = "bold 32px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText(`LEVEL ${this.level} - NEW BOSS!`, this.canvas.width/2, this.canvas.height / 2 - 50);
    }

    // Draw Boss
    if (this.state !== "victory") {
      ctx.shadowBlur = this.bossHitTimer > 0 ? 0 : 25;
      ctx.shadowColor = this.boss.color;
      ctx.fillStyle = this.bossHitTimer > 0 ? "#ffffff" : "#1a0005";
      ctx.strokeStyle = this.bossHitTimer > 0 ? "#ffffff" : this.boss.color;
      ctx.lineWidth = 4;
      
      ctx.save();
      ctx.translate(this.boss.x, this.boss.y);
      ctx.rotate(this.frame * 0.04);
      ctx.beginPath();
      // Boss shape changes slightly with level
      const sides = 5 + (this.level % 4); 
      for (let i=0; i<sides; i++) {
         const a = (i/sides) * Math.PI*2;
         const x = Math.cos(a) * this.boss.r;
         const y = Math.sin(a) * this.boss.r;
         if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Core
      ctx.fillStyle = this.bossHitTimer > 0 ? "#ffffff" : this.boss.color;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + Math.sin(this.frame*0.2)*4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      
      ctx.shadowBlur = 0;
      
      // Boss HP Bar
      ctx.fillStyle = "rgba(40, 0, 10, 0.6)";
      ctx.fillRect(this.boss.x - 60, this.boss.y - this.boss.r - 25, 120, 8);
      ctx.fillStyle = this.boss.color;
      ctx.fillRect(this.boss.x - 60, this.boss.y - this.boss.r - 25, 120 * Math.max(0, this.boss.hp / this.boss.maxHp), 8);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(this.boss.x - 60, this.boss.y - this.boss.r - 25, 120, 8);
    }

    // Draw Bullets
    ctx.globalCompositeOperation = "lighter";
    this.bullets.forEach(b => {
      ctx.fillStyle = b.type === 'large' ? "rgba(255,0,180,0.75)" : "rgba(0,255,230,0.75)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI*2);
      ctx.fill();
    });

    // Draw Player
    if (this.state === "playing") {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate((this.playerDx || 0) * 0.02);

      // Player Glow
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, this.player.r + 6, 0, Math.PI*2);
      ctx.fill();

      // Player Core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.player.r, 0, Math.PI*2);
      ctx.fill();
      
      // Hitbox center
      ctx.fillStyle = "#00ffcc";
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = p.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI*2);
      ctx.fill();
    });
    
    // UI: Level Indicator (Replaced Hype Meter)
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(20, this.canvas.height - 45, 180, 25);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, this.canvas.height - 45, 180, 25);
    
    ctx.font = "bold 11px 'Panchang', sans-serif";
    ctx.fillStyle = "#00ffcc";
    ctx.textAlign = "left";
    ctx.fillText(`LEVEL ${this.level}`, 30, this.canvas.height - 28);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "9px 'Panchang', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`HP: ${Math.max(0, this.boss.hp)}/${this.boss.maxHp}`, 190, this.canvas.height - 29);

    ctx.restore();
  }

  destroy() {}
}
