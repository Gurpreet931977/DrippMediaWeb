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
    
    this.timeScale = 1.0;
    this.score = 0;
    this.frame = 0;
    this.state = "playing";
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
  }

  spawnEnemy() {
    this.enemies.push({
      x: 50 + Math.random() * (this.canvas.width - 100),
      y: -50,
      vx: (Math.random() - 0.5) * 2,
      vy: 1 + Math.random() * 2,
      r: 20
    });
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    this.isAiming = true;
    this.dragStart = { x: cx, y: cy };
    this.dragCurrent = { x: cx, y: cy };
    this.timeScale = 0.1; // Bullet time
  }

  handlePointerMove(e) {
    if (!this.isAiming) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dragCurrent = {
      x: (e.clientX || e.touches[0].clientX) - rect.left,
      y: (e.clientY || e.touches[0].clientY) - rect.top
    };
  }

  handlePointerUp() {
    if (!this.isAiming) return;
    this.isAiming = false;
    this.timeScale = 1.0;
    
    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    
    // Launch player (extreme speed)
    this.player.vx = dx * 0.25;
    this.player.vy = dy * 0.25;
    
    this.dragStart = null;
    this.dragCurrent = null;
  }

  update() {
    if (this.state === "failed") return;
    
    // JUICE: Hitstop
    if (this.hitstop > 0) {
      this.hitstop -= this.timeScale;
      return;
    }
    
    // We use actual frame counting scaled by timeScale
    this.frame += this.timeScale;
    
    // Spawn enemies
    if (Math.random() < 0.02 * this.timeScale) {
      this.spawnEnemy();
    }

    // Apply friction to player
    this.player.vx *= 0.98;
    this.player.vy *= 0.98;

    // Bounce player off walls
    if (this.player.x - this.player.r < 0 || this.player.x + this.player.r > this.canvas.width) {
       this.player.vx *= -1;
       this.player.x = Math.max(this.player.r, Math.min(this.canvas.width - this.player.r, this.player.x));
    }
    if (this.player.y - this.player.r < 0 || this.player.y + this.player.r > this.canvas.height) {
       this.player.vy *= -1;
       this.player.y = Math.max(this.player.r, Math.min(this.canvas.height - this.player.r, this.player.y));
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
      en.x += en.vx * this.timeScale;
      en.y += en.vy * this.timeScale;
      
      // Slicing collision (Player hitting enemy)
      const dist = Math.hypot(this.player.x - en.x, this.player.y - en.y);
      if (dist < this.player.r + en.r) {
        if (speed > 10) {
          // JUICE: Hitstop and Flash on slice
          this.hitstop = 3;
          this.flashAlpha = 0.5;
          this.player.vx *= 1.05;
          this.player.vy *= 1.05;
          
          // Slice kill
          this.enemies.splice(i, 1);
          this.score += 10;
          this.callbacks.setScoreRef(this.score);
          this.callbacks.setScore(this.score);
          
          for(let p=0; p<20; p++) {
            this.particles.push({
              x: en.x, y: en.y,
              vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
              life: 30
            });
          }
        } else {
          // Player dies
          this.state = "failed";
          this.callbacks.setGameState("failed");
          for(let p=0; p<40; p++) {
            this.particles.push({
              x: this.player.x, y: this.player.y,
              vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
              life: 60,
              isRed: true
            });
          }
        }
      }
      
      if (en.y > this.canvas.height + 50) this.enemies.splice(i, 1);
    }

    // Particles and trails
    this.particles.forEach(p => { p.x += p.vx * this.timeScale; p.y += p.vy * this.timeScale; p.life -= this.timeScale; });
    this.particles = this.particles.filter(p => p.life > 0);
    
    this.trails.forEach(t => { t.life -= this.timeScale; });
    this.trails = this.trails.filter(t => t.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    
    // Background with time warp effect
    if (this.timeScale < 1.0) {
       ctx.fillStyle = "rgba(15,0,15,0.2)";
    } else {
       ctx.fillStyle = "rgba(5,5,5,0.4)";
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
    ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
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
      ctx.lineTo(this.player.x + dx * 2, this.player.y + dy * 2); // Predictive line
      ctx.stroke();
    }

    // Draw Enemies
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffcc";
    this.enemies.forEach(en => {
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.r, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = p.isRed ? "#ff3333" : "#00ffcc";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Player
    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff00ff";
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // JUICE: Flash effect
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05 * this.timeScale;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  destroy() {}
}
