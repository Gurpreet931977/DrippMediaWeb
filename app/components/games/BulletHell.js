export default class BulletHell {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 100, r: 8, speed: 6 };
    this.boss = { x: canvas.width / 2, y: 150, r: 40, hp: 100, maxHp: 100, phase: 0 };
    
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
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
  }

  handlePointerDown(e) {
    this.updateTarget(e);
  }

  handlePointerMove(e) {
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
    // Boss moves slowly side to side
    this.boss.x = this.canvas.width / 2 + Math.sin(this.frame * 0.02) * 200;
    this.boss.y = 150 + Math.sin(this.frame * 0.01) * 50;
    
    const phase = Math.floor(this.frame / 600) % 3;
    
    if (phase === 0) {
      // Spiral pattern
      if (this.frame % 5 === 0) {
        const angle = this.frame * 0.1;
        this.fireBullet(this.boss.x, this.boss.y, angle, 4, 'normal');
        this.fireBullet(this.boss.x, this.boss.y, angle + Math.PI, 4, 'normal');
      }
    } else if (phase === 1) {
      // Rings
      if (this.frame % 60 === 0) {
        for (let i = 0; i < 20; i++) {
          const angle = (i / 20) * Math.PI * 2 + (this.frame * 0.01);
          this.fireBullet(this.boss.x, this.boss.y, angle, 3, 'normal');
        }
      }
    } else if (phase === 2) {
      // Aimed spread
      if (this.frame % 40 === 0) {
        const dx = this.player.x - this.boss.x;
        const dy = this.player.y - this.boss.y;
        const baseAngle = Math.atan2(dy, dx);
        for(let i=-2; i<=2; i++) {
           this.fireBullet(this.boss.x, this.boss.y, baseAngle + i * 0.15, 6, 'large');
        }
      }
    }
  }

  update() {
    if (this.state === "failed") return;
    this.frame++;
    
    this.score += 1;
    this.callbacks.setScoreRef(Math.floor(this.score / 10));
    if (this.frame % 10 === 0) this.callbacks.setScore(Math.floor(this.score / 10));

    // Move player towards target
    this.playerDx = this.targetPos.x - this.player.x;
    this.playerDy = this.targetPos.y - this.player.y;
    const dist = Math.hypot(this.playerDx, this.playerDy);
    
    // Hype decay
    if (this.hype > 0) this.hype *= 0.95;
    
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

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      let b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      
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
      } else if (bulletDist < b.r + this.player.r + 15) {
         // JUICE: Graze mechanic!
         this.score += 5;
         this.hype += 5;
         if (this.hype > 100) this.hype = 100;
         
         if (Math.random() > 0.5) {
           this.particles.push({
             x: this.player.x + (b.x - this.player.x) * 0.5,
             y: this.player.y + (b.y - this.player.y) * 0.5,
             vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
             life: 15, color: "#00ffff"
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
    
    // Hype flash
    if (this.hype > 50) {
       ctx.fillStyle = `rgba(0, 255, 255, ${(this.hype - 50) / 200})`;
       ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw Boss
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0000";
    ctx.fillStyle = "#220000";
    ctx.strokeStyle = "#ff0000";
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
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(0, 0, 15 + Math.sin(this.frame*0.2)*5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    
    ctx.shadowBlur = 0;

    // Draw Bullets
    ctx.shadowBlur = 10;
    this.bullets.forEach(b => {
      ctx.shadowColor = b.type === 'large' ? "#ff00ff" : "#00ffff";
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = ctx.shadowColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Player
    if (this.state === "playing") {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      // JUICE: Tilt player based on horizontal movement
      ctx.rotate((this.playerDx || 0) * 0.02);

      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      if (this.hype > 80) ctx.shadowColor = "#00ffff"; // Hype glow

      ctx.beginPath();
      ctx.arc(0, 0, this.player.r, 0, Math.PI*2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
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
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  destroy() {}
}
