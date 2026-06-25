export default class SlingshotNinja {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 150, vx: 0, vy: 0, r: 18 };
    this.enemies = [];
    this.particles = [];
    this.trails = [];
    this.dragStart = null;
    this.dragCurrent = null;
    this.isAiming = false;
    
    this.flashAlpha = 0;
    this.hitstop = 0;
    this.screenShake = 0;
    
    this.timeScale = 1.0;
    this.score = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.frame = 0;
    this.state = "playing";
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    
    // PRE-SPAWN ENEMIES SO THE GAME DOES NOT LOOK EMPTY
    for (let i = 0; i < 6; i++) {
       this.spawnEnemy(true);
    }
  }

  spawnEnemy(onScreen = false) {
    // 20% chance to be a bomb, except when pre-spawning (don't spawn bombs instantly on top of player)
    const isBomb = !onScreen && Math.random() > 0.8;
    this.enemies.push({
      x: 50 + Math.random() * (this.canvas.width - 100),
      y: onScreen ? 100 + Math.random() * (this.canvas.height * 0.5) : -60,
      vx: (Math.random() - 0.5) * 4,
      vy: 1 + Math.random() * 3,
      r: isBomb ? 28 : 24,
      isBomb: isBomb,
      wobble: Math.random() * Math.PI * 2,
      hue: Math.random() * 360, // Individual coloring for targets
      rotation: Math.random() * Math.PI
    });
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    this.isAiming = true;
    this.dragStart = { x: cx, y: cy };
    this.dragCurrent = { x: cx, y: cy };
    this.timeScale = 0.04; // Extreme bullet time
  }

  handlePointerMove(e) {
    if (!this.isAiming) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dragCurrent = {
      x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    };
  }

  handlePointerUp() {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.timeScale = 1.0;
    
    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    
    // Launch player (extreme speed)
    this.player.vx = dx * 0.35;
    this.player.vy = dy * 0.35;
    
    this.dragStart = null;
    this.dragCurrent = null;
    
    // Slight launch pulse
    this.screenShake = 6;
  }

  update() {
    if (this.state === "failed") return;
    
    // JUICE: Hitstop
    if (this.hitstop > 0) {
      this.hitstop -= this.timeScale;
      return;
    }
    
    this.frame += this.timeScale;
    
    if (this.comboTimer > 0) {
       this.comboTimer -= this.timeScale;
       if (this.comboTimer <= 0) this.combo = 1; // Combo drops
    }
    
    // Spawn enemies
    const spawnChance = Math.min(0.08, 0.02 + (this.score * 0.0001));
    if (Math.random() < spawnChance * this.timeScale) {
      this.spawnEnemy();
    }

    // Apply friction to player
    this.player.vx *= 0.985;
    this.player.vy *= 0.985;

    // Bounce player off walls
    let hitWall = false;
    if (this.player.x - this.player.r < 0 || this.player.x + this.player.r > this.canvas.width) {
       this.player.vx *= -1;
       this.player.x = Math.max(this.player.r, Math.min(this.canvas.width - this.player.r, this.player.x));
       hitWall = true;
    }
    if (this.player.y - this.player.r < 0 || this.player.y + this.player.r > this.canvas.height) {
       this.player.vy *= -1;
       this.player.y = Math.max(this.player.r, Math.min(this.canvas.height - this.player.r, this.player.y));
       hitWall = true;
    }
    
    if (hitWall) {
       this.combo = 1; // Wall bounce breaks combo
       this.comboTimer = 0;
       this.screenShake = 4;
       for(let p=0; p<8; p++) {
         this.particles.push({
           x: this.player.x, y: this.player.y,
           vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
           life: 20, color: "#ffffff"
         });
       }
    }

    this.player.x += this.player.vx * this.timeScale;
    this.player.y += this.player.vy * this.timeScale;
    
    // Trails
    const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
    if (speed > 5) {
      this.trails.push({x: this.player.x, y: this.player.y, life: 25});
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let en = this.enemies[i];
      en.wobble += 0.1 * this.timeScale;
      en.rotation += (en.isBomb ? 0.05 : 0.02) * this.timeScale;
      en.x += (en.vx + Math.sin(en.wobble) * 2) * this.timeScale;
      en.y += en.vy * this.timeScale;
      
      // Slicing collision (Player hitting enemy)
      const dist = Math.hypot(this.player.x - en.x, this.player.y - en.y);
      if (dist < this.player.r + en.r) {
        if (en.isBomb) {
           // Hitting a bomb always kills you
           this.state = "failed";
           this.callbacks.setGameState("failed");
           this.screenShake = 40;
           for(let p=0; p<60; p++) {
             this.particles.push({
               x: this.player.x, y: this.player.y,
               vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 0.5) * 25,
               life: 100, color: "#ff0044"
             });
           }
           break;
        } else if (speed > 7) {
          // JUICE: Hitstop and Flash on slice
          this.hitstop = Math.min(12, 3 + this.combo); // more hitstop for higher combo
          this.flashAlpha = 0.6;
          this.screenShake = 12 + this.combo * 2;
          this.player.vx *= 1.15; // speed up slightly on slice
          this.player.vy *= 1.15;
          
          this.combo++;
          this.comboTimer = 120; // 120 frames to hit next target
          
          // Slice kill
          this.enemies.splice(i, 1);
          this.score += 10 * this.combo;
          this.callbacks.setScoreRef(this.score);
          this.callbacks.setScore(this.score);
          
          for(let p=0; p<30; p++) {
            this.particles.push({
              x: en.x, y: en.y,
              vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18,
              life: 45, color: `hsl(${en.hue}, 100%, 60%)`
            });
          }
        } else {
          // Player dies from moving too slow
          this.state = "failed";
          this.callbacks.setGameState("failed");
          this.screenShake = 25;
          for(let p=0; p<40; p++) {
            this.particles.push({
              x: this.player.x, y: this.player.y,
              vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
              life: 60, color: "#ff3333"
            });
          }
        }
      }
      
      if (en.y > this.canvas.height + 50 || en.x < -50 || en.x > this.canvas.width + 50) {
         this.enemies.splice(i, 1);
         if (!en.isBomb && en.y > this.canvas.height) {
            // Missing a target breaks combo
            this.combo = 1;
            this.comboTimer = 0;
         }
      }
    }

    // Particles and trails
    this.particles.forEach(p => { p.x += p.vx * this.timeScale; p.y += p.vy * this.timeScale; p.life -= this.timeScale; });
    this.particles = this.particles.filter(p => p.life > 0);
    
    this.trails.forEach(t => { t.life -= this.timeScale; });
    this.trails = this.trails.filter(t => t.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    // JUICE: Screenshake
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
      this.screenShake *= 0.8;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    
    // Gen Z Aesthetic: Dynamic background
    if (this.timeScale < 1.0) {
       // Deep synthwave purple during bullet time
       ctx.fillStyle = "rgba(10, 0, 20, 0.5)";
    } else {
       // Cool cyber pulse when comboing
       const pulse = this.combo > 1 ? Math.sin(this.frame * 0.15) * 0.05 * Math.min(this.combo, 15) : 0;
       ctx.fillStyle = `rgba(${10 + pulse*100}, 10, ${20 + pulse*200}, 0.6)`;
    }
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dynamic grid overlay for that high-tech modern aesthetic
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridOffset = (this.frame * 2) % 100;
    for(let y = gridOffset; y < this.canvas.height; y += 100) {
       ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();

    // Draw trails
    if (this.trails.length > 0) {
      ctx.beginPath();
      for(let i=0; i<this.trails.length; i++) {
         const t = this.trails[i];
         if(i===0) ctx.moveTo(t.x, t.y);
         else ctx.lineTo(t.x, t.y);
      }
      ctx.lineTo(this.player.x, this.player.y);
      ctx.strokeStyle = `rgba(${255}, ${255 - Math.min(this.combo*25, 255)}, ${255}, 0.7)`;
      ctx.lineWidth = this.player.r * 1.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Aiming Line (Cyber Sniper Aesthetic)
    if (this.isAiming && this.dragStart && this.dragCurrent) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;
      
      // Dashed line
      ctx.strokeStyle = "rgba(0, 255, 255, 0.6)";
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + dx * 3, this.player.y + dy * 3); // Predictive aim
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Target reticle at the end
      ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(this.player.x + dx * 3, this.player.y + dy * 3, 5, 0, Math.PI*2);
      ctx.fill();
    }

    // Draw Enemies
    this.enemies.forEach(en => {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.rotate(en.rotation);
      
      if (en.isBomb) {
         // Spiky red danger bomb
         ctx.shadowBlur = 20;
         ctx.shadowColor = "#ff0044";
         ctx.fillStyle = "#220000";
         ctx.strokeStyle = "#ff0044";
         ctx.lineWidth = 4;
         
         ctx.beginPath();
         for(let i=0; i<8; i++) {
           const a = (i/8) * Math.PI*2;
           const outR = en.r + (Math.sin(this.frame*0.5 + i)*5);
           ctx.lineTo(Math.cos(a)*outR, Math.sin(a)*outR);
         }
         ctx.closePath();
         ctx.fill();
         ctx.stroke();
         
         // Inner danger core
         ctx.fillStyle = "#ff0044";
         ctx.beginPath();
         ctx.arc(0, 0, en.r * 0.4, 0, Math.PI*2);
         ctx.fill();
      } else {
         // High-res Y2K Cyber Target
         const color = `hsl(${en.hue}, 100%, 60%)`;
         ctx.shadowBlur = 15;
         ctx.shadowColor = color;
         ctx.strokeStyle = color;
         ctx.lineWidth = 4;
         
         // Outer Ring
         ctx.beginPath();
         ctx.arc(0, 0, en.r, 0, Math.PI*2);
         ctx.stroke();
         
         // Inner Crosshair
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.moveTo(-en.r + 5, 0); ctx.lineTo(en.r - 5, 0);
         ctx.moveTo(0, -en.r + 5); ctx.lineTo(0, en.r - 5);
         ctx.stroke();
         
         // Inner Dot
         ctx.fillStyle = "#ffffff";
         ctx.beginPath();
         ctx.arc(0, 0, 4, 0, Math.PI*2);
         ctx.fill();
      }
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    ctx.globalCompositeOperation = "lighter";
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 80;
      ctx.fillStyle = p.color || "#00ffcc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + (p.life/15), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Draw Player
    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 25;
      ctx.shadowColor = this.combo > 1 ? "#ff00ff" : "#00ffff";
      
      const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      
      if (speed > 1) {
         ctx.rotate(Math.atan2(this.player.vy, this.player.vx));
      }
      
      // Modern Gen Z Arrowhead/Diamond shape
      ctx.beginPath();
      const stretch = 1 + speed * 0.03;
      ctx.scale(stretch, 1 / stretch);
      
      ctx.moveTo(this.player.r, 0); // nose
      ctx.lineTo(-this.player.r * 0.5, this.player.r * 0.8); // bottom wing
      ctx.lineTo(-this.player.r * 0.2, 0); // tail indent
      ctx.lineTo(-this.player.r * 0.5, -this.player.r * 0.8); // top wing
      ctx.closePath();
      
      ctx.fill();
      
      // Inner glowing eye
      ctx.fillStyle = this.combo > 1 ? "#ff00ff" : "#00ffff";
      ctx.beginPath();
      ctx.arc(this.player.r * 0.2, 0, 4, 0, Math.PI*2);
      ctx.fill();
      
      ctx.restore();
      ctx.shadowBlur = 0;
    }
    
    // Draw Combo text (Gen Z styled)
    if (this.combo > 1 && this.state === "playing") {
       ctx.save();
       ctx.translate(this.player.x, this.player.y - 50);
       const pop = Math.sin(this.comboTimer * 0.2) * 5;
       ctx.scale(1 + pop/50, 1 + pop/50);
       
       ctx.fillStyle = `rgba(255, 0, 255, ${this.comboTimer / 100})`;
       ctx.shadowBlur = 10;
       ctx.shadowColor = "#ff00ff";
       ctx.font = `italic 900 ${28 + this.combo * 2}px 'Clash Display', sans-serif`;
       ctx.textAlign = "center";
       ctx.fillText(`x${this.combo}`, 0, 0);
       ctx.restore();
    }

    // JUICE: Flash effect
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05 * this.timeScale;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
    
    ctx.restore();
  }

  destroy() {}
}
