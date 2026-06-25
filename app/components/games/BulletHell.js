export default class BulletHell {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 100, r: 8 };
    this.level = 1;
    this.levelNames = [
      "THE AWAKENING", 
      "NEON FURY", 
      "CYBER JUDGEMENT", 
      "ABYSSAL RECKONING", 
      "FINAL DESTINATION",
      "GOD MODE"
    ];

    this.boss = { 
      x: canvas.width / 2, 
      y: 180, 
      r: 35, 
      hp: 150, 
      maxHp: 150, 
      phase: 0,
      color: "#ff0055"
    };
    
    this.bullets = [];
    this.particles = [];
    this.powerups = [];
    this.frame = 0;
    this.state = "playing";
    this.targetPos = { x: this.player.x, y: this.player.y };
    
    // JUICE properties
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.bossHitTimer = 0;
    this.bossDamageCooldown = 0;
    this.levelUpTimer = 0;
    
    // Powerup state
    this.activePowerup = null;
    this.powerupTimer = 0;
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

  spawnPowerup() {
    const types = ["shield", "nuke", "frenzy"];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      x: 50 + Math.random() * (this.canvas.width - 100),
      y: -20,
      vy: 1.5 + Math.random() * 1.5,
      r: 14,
      type: type,
      wobble: Math.random() * Math.PI * 2
    });
  }

  bossPattern() {
    // Boss moves wildly side to side, speed increases with level
    const speedMult = 1 + (this.level - 1) * 0.12;
    this.boss.x = this.canvas.width / 2 + Math.sin(this.frame * 0.03 * speedMult) * (this.canvas.width/2 - 80);
    this.boss.y = 150 + Math.sin(this.frame * 0.02 * speedMult) * 60;
    
    // Scale patterns based on level
    const phase = Math.floor(this.frame / 350) % 4;
    
    // Level 1 has simplified patterns and slower bullets
    const bulletSpeedFactor = Math.min(2.5, 0.7 + (this.level - 1) * 0.3);
    const fireIntervalFactor = Math.max(0.3, 1.2 - (this.level - 1) * 0.2);

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
        const ringCount = Math.min(36, 12 + this.level * 4);
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
        const burstSpread = Math.min(8, 2 + this.level * 2);
        for(let i = -burstSpread; i <= burstSpread; i++) {
           this.fireBullet(this.boss.x, this.boss.y, baseAngle + i * 0.12, (4 + Math.abs(i) * 0.5) * bulletSpeedFactor, 'large');
        }
      }
    }
  }

  update() {
    if (this.state === "failed" || this.state === "victory") return;
    this.frame++;
    
    if (this.levelUpTimer > 0) this.levelUpTimer--;
    if (this.powerupTimer > 0) {
       this.powerupTimer--;
       if (this.powerupTimer <= 0) this.activePowerup = null;
    }

    // Boss death & level up
    if (this.boss.hp <= 0) {
       this.screenShake = 30;
       this.flashAlpha = 0.8;
       for(let p=0; p<60; p++) {
          this.particles.push({
             x: this.boss.x, y: this.boss.y,
             vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 0.5) * 25,
             life: 80, color: this.boss.color
          });
       }
       this.bullets = [];
       this.powerups = [];
       
       // Advance Level
       this.level++;
       this.levelUpTimer = 90; // Show LEVEL UP screen text

       // Next Greater Boss stats
       const bossColors = ["#ff0055", "#00ffcc", "#e100ff", "#ffcc00", "#ff3300", "#ffffff"];
       const chosenColor = bossColors[(this.level - 1) % bossColors.length];
       
       const nextMaxHp = 150 + (this.level - 1) * 150;
       const nextRadius = Math.min(75, 35 + (this.level - 1) * 6);
       
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

    // Instant Player Movement (Zero Latency)
    this.player.x = this.targetPos.x;
    this.player.y = this.targetPos.y;
    
    // Keep player in bounds
    this.player.x = Math.max(this.player.r, Math.min(this.canvas.width - this.player.r, this.player.x));
    this.player.y = Math.max(this.player.r, Math.min(this.canvas.height - this.player.r, this.player.y));

    if (this.bossHitTimer > 0) this.bossHitTimer--;
    if (this.bossDamageCooldown > 0) this.bossDamageCooldown--;

    // Collision Check: Cursor/Player hits the Boss
    const distToBoss = Math.hypot(this.player.x - this.boss.x, this.player.y - this.boss.y);
    if (distToBoss < this.player.r + this.boss.r) {
      if (this.bossDamageCooldown <= 0) {
        const damage = this.activePowerup === 'frenzy' ? 15 : 4;
        this.boss.hp -= damage;
        this.bossDamageCooldown = this.activePowerup === 'frenzy' ? 4 : 8; // Faster hitting if frenzied
        this.bossHitTimer = 5;
        this.screenShake = this.activePowerup === 'frenzy' ? 10 : 5;
        
        // Spawn damage sparks
        for (let i = 0; i < (this.activePowerup === 'frenzy' ? 12 : 6); i++) {
          this.particles.push({
            x: this.player.x,
            y: this.player.y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 25,
            color: this.boss.color
          });
        }
      }
    }

    // Powerup Spawning
    if (this.frame % 350 === 0 && Math.random() > 0.2) {
       this.spawnPowerup();
    }

    // Powerup Logic
    for (let i = this.powerups.length - 1; i >= 0; i--) {
       let p = this.powerups[i];
       p.y += p.vy;
       p.wobble += 0.1;
       p.x += Math.sin(p.wobble) * 2;

       // Player collects powerup
       if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < p.r + this.player.r) {
          this.activePowerup = p.type;
          this.powerupTimer = p.type === 'nuke' ? 0 : 300; // 5 seconds duration
          this.flashAlpha = 0.5;
          this.screenShake = 10;
          
          if (p.type === 'nuke') {
             this.bullets = []; // Clear all bullets
             for(let k=0; k<40; k++) {
                this.particles.push({
                   x: this.canvas.width/2, y: this.canvas.height/2,
                   vx: (Math.random()-0.5)*35, vy: (Math.random()-0.5)*35,
                   life: 60, color: "#ffffff"
                });
             }
          }
          this.powerups.splice(i, 1);
       } else if (p.y > this.canvas.height + 20) {
          this.powerups.splice(i, 1);
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
      } else if (b.type === 'deflected') {
         b.x += b.vx;
         b.y += b.vy;
      }
      
      // Collision with player
      if (b.type !== 'deflected') {
         const bulletDist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
         if (bulletDist < b.r + this.player.r - 2) {
            if (this.activePowerup === 'shield') {
               // Deflect bullet!
               b.vx *= -2;
               b.vy *= -2;
               b.type = 'deflected';
               this.screenShake = 2;
               for(let p=0; p<3; p++) {
                  this.particles.push({
                     x: b.x, y: b.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 15, color: "#00aaff"
                  });
               }
            } else {
               // Game Over
               this.state = "failed";
               this.callbacks.setGameState("failed");
               this.screenShake = 30;
               for(let p=0; p<50; p++) {
                  this.particles.push({
                     x: this.player.x, y: this.player.y,
                     vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                     life: 80, color: "#ffffff"
                  });
               }
            }
         }
      }
      
      // Hit Boss with deflected bullet
      if (b.type === 'deflected' && Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < b.r + this.boss.r) {
         this.boss.hp -= 20; // Big damage!
         this.bullets.splice(i, 1);
         this.screenShake = 8;
         for(let p=0; p<10; p++) {
            this.particles.push({
               x: b.x, y: b.y, vx: (Math.random()-0.5)*15, vy: (Math.random()-0.5)*15, life: 25, color: this.boss.color
            });
         }
         continue;
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
       const lvlName = this.levelNames[Math.min(this.level - 1, this.levelNames.length - 1)];
       ctx.fillText(`LEVEL ${this.level}: ${lvlName}`, this.canvas.width/2, this.canvas.height / 2 - 50);
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
    }

    // Draw Powerups
    this.powerups.forEach(p => {
       ctx.shadowBlur = 15;
       if (p.type === 'shield') {
          ctx.fillStyle = "#00aaff";
          ctx.shadowColor = "#00aaff";
       } else if (p.type === 'nuke') {
          ctx.fillStyle = "#ff0000";
          ctx.shadowColor = "#ff0000";
       } else if (p.type === 'frenzy') {
          ctx.fillStyle = "#ffaa00";
          ctx.shadowColor = "#ffaa00";
       }
       
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
       ctx.fill();
       
       ctx.fillStyle = "#ffffff";
       ctx.beginPath();
       ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI*2);
       ctx.fill();
       ctx.shadowBlur = 0;
    });

    // Draw Bullets
    ctx.globalCompositeOperation = "lighter";
    this.bullets.forEach(b => {
      if (b.type === 'deflected') {
         ctx.fillStyle = "rgba(0, 170, 255, 0.9)";
      } else {
         ctx.fillStyle = b.type === 'large' ? "rgba(255,0,180,0.75)" : "rgba(0,255,230,0.75)";
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI*2);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";

    // Draw Player
    if (this.state === "playing") {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Powerup Aura
      if (this.activePowerup === 'shield') {
         ctx.strokeStyle = "#00aaff";
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.arc(0, 0, this.player.r + 12 + Math.sin(this.frame*0.2)*4, 0, Math.PI*2);
         ctx.stroke();
      } else if (this.activePowerup === 'frenzy') {
         ctx.fillStyle = "rgba(255, 170, 0, 0.4)";
         ctx.beginPath();
         ctx.arc(0, 0, this.player.r + 12 + Math.sin(this.frame*0.4)*6, 0, Math.PI*2);
         ctx.fill();
      }

      // Player Outer Targeting Ring
      ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Orbiting arc
      ctx.arc(0, 0, this.player.r + 8, this.frame * 0.05, this.frame * 0.05 + Math.PI*1.5);
      ctx.stroke();

      // Cyber Diamond base
      ctx.fillStyle = "rgba(10, 20, 30, 0.8)";
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.player.r - 2);
      ctx.lineTo(this.player.r + 2, 0);
      ctx.lineTo(0, this.player.r + 2);
      ctx.lineTo(-this.player.r - 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core Hitbox (Critical for bullet hell!)
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
    ctx.globalAlpha = 1;
    
    // UI: Tekken Style Health Bar
    const barWidth = this.canvas.width - 60;
    const barX = 30;
    const barY = 20;
    const barHeight = 20;

    // Background Bar
    ctx.fillStyle = "rgba(40, 0, 10, 0.6)";
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Boss HP filling
    const hpRatio = Math.max(0, this.boss.hp / this.boss.maxHp);
    ctx.fillStyle = this.boss.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.boss.color;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Level System at Top Right (below health bar)
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "right";
    const currentLvlName = this.levelNames[Math.min(this.level - 1, this.levelNames.length - 1)];
    ctx.fillText(`LEVEL ${this.level}: ${currentLvlName}`, this.canvas.width - 30, barY + barHeight + 25);
    
    // Boss Name Top Left
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`BOSS`, 30, barY + barHeight + 25);
    
    // Active Powerup text
    if (this.activePowerup && this.powerupTimer > 0) {
       ctx.fillStyle = this.activePowerup === 'shield' ? "#00aaff" : "#ffaa00";
       ctx.textAlign = "center";
       ctx.font = "bold 16px 'Panchang', sans-serif";
       ctx.fillText(`${this.activePowerup.toUpperCase()} ACTIVE`, this.canvas.width/2, this.canvas.height - 30);
    }

    ctx.restore();
  }

  destroy() {}
}
