export default class SlingshotNinja {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width / 2, y: canvas.height - 100, vx: 0, vy: 0, r: 15 };
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
  }

  spawnEnemy() {
    const isBomb = Math.random() > 0.8;
    this.enemies.push({
      x: 50 + Math.random() * (this.canvas.width - 100),
      y: -50,
      vx: (Math.random() - 0.5) * 4,
      vy: 1 + Math.random() * 3,
      r: isBomb ? 25 : 20,
      isBomb: isBomb,
      wobble: 0
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
    this.timeScale = 0.05; // Extreme bullet time
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
    this.player.vx = dx * 0.3;
    this.player.vy = dy * 0.3;
    
    this.dragStart = null;
    this.dragCurrent = null;
    
    // Slight launch pulse
    this.screenShake = 5;
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
       this.screenShake = 3;
       for(let p=0; p<5; p++) {
         this.particles.push({
           x: this.player.x, y: this.player.y,
           vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
           life: 15, color: "#ffffff"
         });
       }
    }

    this.player.x += this.player.vx * this.timeScale;
    this.player.y += this.player.vy * this.timeScale;
    
    // Trails
    const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
    if (speed > 5) {
      this.trails.push({x: this.player.x, y: this.player.y, life: 20});
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let en = this.enemies[i];
      en.wobble += 0.1 * this.timeScale;
      en.x += (en.vx + Math.sin(en.wobble) * 2) * this.timeScale;
      en.y += en.vy * this.timeScale;
      
      // Slicing collision (Player hitting enemy)
      const dist = Math.hypot(this.player.x - en.x, this.player.y - en.y);
      if (dist < this.player.r + en.r) {
        if (en.isBomb) {
           // Hitting a bomb always kills you
           this.state = "failed";
           this.callbacks.setGameState("failed");
           this.screenShake = 30;
           for(let p=0; p<50; p++) {
             this.particles.push({
               x: this.player.x, y: this.player.y,
               vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
               life: 80, color: "#ff0000"
             });
           }
           break;
        } else if (speed > 8) {
          // JUICE: Hitstop and Flash on slice
          this.hitstop = Math.min(10, 3 + this.combo); // more hitstop for higher combo
          this.flashAlpha = 0.5;
          this.screenShake = 10 + this.combo * 2;
          this.player.vx *= 1.1; // speed up slightly on slice
          this.player.vy *= 1.1;
          
          this.combo++;
          this.comboTimer = 100; // 100 frames to hit next target
          
          // Slice kill
          this.enemies.splice(i, 1);
          this.score += 10 * this.combo;
          this.callbacks.setScoreRef(this.score);
          this.callbacks.setScore(this.score);
          
          for(let p=0; p<25; p++) {
            this.particles.push({
              x: en.x, y: en.y,
              vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
              life: 40, color: "#00ffcc"
            });
          }
        } else {
          // Player dies from moving too slow
          this.state = "failed";
          this.callbacks.setGameState("failed");
          this.screenShake = 20;
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
    
    // Background with time warp effect
    if (this.timeScale < 1.0) {
       ctx.fillStyle = "rgba(15,0,15,0.2)";
    } else {
       // Combo background pulse
       const pulse = this.combo > 1 ? Math.sin(this.frame * 0.1) * 0.05 * Math.min(this.combo, 10) : 0;
       ctx.fillStyle = `rgba(${5 + pulse*200}, 5, ${5 + pulse*200}, 0.4)`;
    }
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw trails
    ctx.beginPath();
    for(let i=0; i<this.trails.length; i++) {
       const t = this.trails[i];
       if(i===0) ctx.moveTo(t.x, t.y);
       else ctx.lineTo(t.x, t.y);
    }
    ctx.lineTo(this.player.x, this.player.y);
    ctx.strokeStyle = `rgba(${255}, ${255 - Math.min(this.combo*20, 255)}, ${255}, 0.5)`;
    ctx.lineWidth = this.player.r;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Draw Aiming Line
    if (this.isAiming && this.dragStart && this.dragCurrent) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.player.x + dx * 2.5, this.player.y + dy * 2.5); // Predictive line
      ctx.stroke();
    }

    // Draw Enemies
    ctx.lineWidth = 3;
    this.enemies.forEach(en => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = en.isBomb ? "#ff0000" : "#00ffcc";
      ctx.fillStyle = en.isBomb ? "#330000" : "#111";
      ctx.strokeStyle = en.isBomb ? "#ff0000" : "#00ffcc";
      
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.r, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
      
      if (en.isBomb) {
         ctx.fillStyle = "#ff0000";
         ctx.beginPath();
         ctx.arc(en.x, en.y, en.r * 0.4 + Math.sin(this.frame * 0.2)*3, 0, Math.PI*2);
         ctx.fill();
      }
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    ctx.globalCompositeOperation = "lighter";
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 80;
      ctx.fillStyle = p.color || "#00ffcc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 + (p.life/20), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Draw Player
    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.combo > 1 ? "#ff00ff" : "#ffffff";
      ctx.beginPath();
      
      const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(Math.atan2(this.player.vy, this.player.vx));
      // Stretch based on speed
      const stretch = 1 + speed * 0.02;
      ctx.ellipse(0, 0, this.player.r * stretch, this.player.r / stretch, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      
      ctx.shadowBlur = 0;
    }
    
    // Draw Combo text
    if (this.combo > 1 && this.state === "playing") {
       ctx.fillStyle = `rgba(255, 0, 255, ${this.comboTimer / 100})`;
       ctx.font = `bold ${30 + this.combo * 2}px 'Panchang', sans-serif`;
       ctx.textAlign = "center";
       ctx.fillText(`x${this.combo}`, this.player.x, this.player.y - 40);
    }

    // JUICE: Flash effect
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05 * this.timeScale;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
    
    ctx.restore();
  }

  destroy() {}
}
