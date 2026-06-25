export default class BulletHell {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 100, r: 8, speed: 6 };
    this.boss = { x: canvas.width / 2, y: 150, r: 40, hp: 1000, maxHp: 1000, phase: 0 };
    
    this.bullets = [];
    this.particles = [];
    this.frame = 0;
    this.score = 0;
    this.state = "playing";
    this.targetPos = { x: this.player.x, y: this.player.y };
    
    // JUICE properties
    this.hype = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.bossHitTimer = 0;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    this.updateTarget(e);
    
    // Super Move Check
    if (this.hype >= 100) {
       this.unleashSuperMove();
    }
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
  
  unleashSuperMove() {
     this.hype = 0;
     this.screenShake = 30;
     this.flashAlpha = 1.0;
     
     // Clear bullets and spawn particles
     this.bullets.forEach(b => {
        this.particles.push({
           x: b.x, y: b.y,
           vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
           life: 30, color: "#00ffff"
        });
     });
     this.bullets = [];
     
     // Damage boss
     this.boss.hp -= 150;
     this.bossHitTimer = 15;
     this.score += 500;
     
     for(let p=0; p<60; p++) {
       this.particles.push({
         x: this.player.x, y: this.player.y,
         vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40,
         life: 80, color: "#ffffff"
       });
     }
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
    // Boss moves wildly side to side
    this.boss.x = this.canvas.width / 2 + Math.sin(this.frame * 0.03) * (this.canvas.width/2 - 100);
    this.boss.y = 150 + Math.sin(this.frame * 0.02) * 80;
    
    // Cycle phases faster
    const phase = Math.floor(this.frame / 400) % 4;
    
    if (phase === 0) {
      // Dense double spiral
      if (this.frame % 3 === 0) {
        const angle = this.frame * 0.15;
        this.fireBullet(this.boss.x, this.boss.y, angle, 4.5, 'normal');
        this.fireBullet(this.boss.x, this.boss.y, angle + Math.PI, 4.5, 'normal');
        this.fireBullet(this.boss.x, this.boss.y, -angle, 3, 'normal');
      }
    } else if (phase === 1) {
      // Rapid rings
      if (this.frame % 40 === 0) {
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2 + (this.frame * 0.01);
          this.fireBullet(this.boss.x, this.boss.y, angle, 2, 'large');
          this.fireBullet(this.boss.x, this.boss.y, angle + 0.1, 4, 'normal');
        }
      }
    } else if (phase === 2) {
      // Sweeping lasers (dense lines)
      if (this.frame % 5 === 0) {
         const sweep = Math.sin(this.frame * 0.05) * Math.PI * 0.5;
         const base = Math.PI / 2; // downwards
         this.fireBullet(this.boss.x, this.boss.y, base + sweep, 7, 'normal');
         this.fireBullet(this.boss.x, this.boss.y, base - sweep, 7, 'normal');
      }
    } else if (phase === 3) {
      // Aimed shotgun burst
      if (this.frame % 30 === 0) {
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const baseAngle = Math.atan2(dy, dx);
        for(let i=-4; i<=4; i++) {
           this.fireBullet(this.boss.x, this.boss.y, baseAngle + i * 0.1, 5 + Math.abs(i)*0.5, 'large');
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

    // Boss death
    if (this.boss.hp <= 0) {
       this.state = "victory";
       this.screenShake = 50;
       this.flashAlpha = 1.0;
       for(let p=0; p<100; p++) {
          this.particles.push({
             x: this.boss.x, y: this.boss.y,
             vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
             life: 120, color: Math.random() > 0.5 ? "#ff0000" : "#ffaa00"
          });
       }
       this.bullets = [];
       // Award massive score for winning
       this.score += 5000;
       this.callbacks.setScoreRef(Math.floor(this.score / 10));
       this.callbacks.setScore(Math.floor(this.score / 10));
       return;
    }

    // Move player towards target
    this.playerDx = this.targetPos.x - this.player.x;
    this.playerDy = this.targetPos.y - this.player.y;
    const dist = Math.hypot(this.playerDx, this.playerDy);
    
    if (this.bossHitTimer > 0) this.bossHitTimer--;
    
    // Hype slowly decays but doesn't instantly vanish
    if (this.hype > 0 && this.frame % 2 === 0) this.hype -= 0.1;
    
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

    this.bossPattern();

    // Update bullets (Optimized without shadowBlur later in draw)
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let b = this.bullets[i];
      
      // Accelerating bullets logic? Some bullets can speed up.
      if (b.type === 'normal') {
         b.x += b.vx;
         b.y += b.vy;
      } else if (b.type === 'large') {
         // Accelerate slightly
         b.vx *= 1.01;
         b.vy *= 1.01;
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
      } else if (bulletDist < b.r + this.player.r + 20) {
         // JUICE: Graze mechanic!
         this.score += 10;
         this.hype += 0.5; // Gain hype fast
         if (this.hype > 100) this.hype = 100;
         
         if (Math.random() > 0.8) {
           this.particles.push({
             x: this.player.x + (b.x - this.player.x) * 0.5,
             y: this.player.y + (b.y - this.player.y) * 0.5,
             vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
             life: 10, color: "#00ffff"
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
    
    // Screen Flash (Super Move)
    if (this.flashAlpha > 0) {
       ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
       ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
       this.flashAlpha -= 0.05;
    }
    
    // Hype bar / pulse
    if (this.hype >= 100) {
       ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(this.frame*0.5)*0.1})`;
       ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
       
       ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
       ctx.font = "bold 40px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText("SUPER READY - CLICK!", this.canvas.width/2, this.canvas.height - 30);
    }

    // Draw Boss
    if (this.state !== "victory") {
      ctx.shadowBlur = this.bossHitTimer > 0 ? 0 : 20;
      ctx.shadowColor = "#ff0000";
      ctx.fillStyle = this.bossHitTimer > 0 ? "#ffffff" : "#220000";
      ctx.strokeStyle = this.bossHitTimer > 0 ? "#ffffff" : "#ff0000";
      ctx.lineWidth = 4;
      
      ctx.save();
      ctx.translate(this.boss.x, this.boss.y);
      ctx.rotate(this.frame * 0.05);
      ctx.beginPath();
      for (let i=0; i<6; i++) {
         const a = (i/6) * Math.PI*2;
         const x = Math.cos(a) * this.boss.r;
         const y = Math.sin(a) * this.boss.r;
         if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Core
      ctx.fillStyle = this.bossHitTimer > 0 ? "#ffffff" : "#ff0000";
      ctx.beginPath();
      ctx.arc(0, 0, 15 + Math.sin(this.frame*0.2)*5, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      
      ctx.shadowBlur = 0;
      
      // Boss HP Bar
      ctx.fillStyle = "#330000";
      ctx.fillRect(this.boss.x - 50, this.boss.y - 70, 100, 10);
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(this.boss.x - 50, this.boss.y - 70, 100 * (this.boss.hp / this.boss.maxHp), 10);
    }

    // Draw Bullets - OPTIMIZED: No shadowBlur. Use composite operation.
    ctx.globalCompositeOperation = "lighter";
    this.bullets.forEach(b => {
      ctx.fillStyle = b.type === 'large' ? "rgba(255,0,255,0.7)" : "rgba(0,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI*2); // Outer glow
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.6, 0, Math.PI*2); // Inner core
      ctx.fill();
    });

    // Draw Player
    if (this.state === "playing" || this.state === "victory") {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate((this.playerDx || 0) * 0.02);

      // Player Glow
      ctx.fillStyle = this.hype >= 100 ? "rgba(0, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(0, 0, this.player.r + 6, 0, Math.PI*2);
      ctx.fill();

      // Player Core
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, this.player.r, 0, Math.PI*2);
      ctx.fill();
      
      // Hitbox center
      ctx.fillStyle = "#ff00ff";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = p.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    });
    
    // UI: Hype Meter
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(20, this.canvas.height - 40, 200, 20);
    ctx.fillStyle = this.hype >= 100 ? "#00ffff" : "#aaaaaa";
    ctx.fillRect(20, this.canvas.height - 40, 200 * (this.hype / 100), 20);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20, this.canvas.height - 40, 200, 20);
    ctx.font = "12px 'Panchang', sans-serif";
    ctx.fillText("HYPE (GRAZE)", 20, this.canvas.height - 45);

    ctx.restore();
  }

  destroy() {}
}
