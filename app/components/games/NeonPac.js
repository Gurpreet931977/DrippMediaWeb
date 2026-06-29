export default class NeonPac {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    this.player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 14,
      vx: 0,
      vy: 0,
      speed: 4.5,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2,
      color: '#00ffcc', // Cyber ring color
      angle: 0
    };
    
    this.trail = [];
    this.dots = [];
    this.ghosts = [];
    this.particles = [];
    
    this.powerMode = 0; // > 0 means powered up
    this.shake = 0;
    this.level = 1;

    this.spawnDots();
    // Initial 3 ghosts
    for (let i = 0; i < 3; i++) {
      this.spawnGhost();
    }
  }

  spawnDots() {
    // Spawn dots
    for (let i = 0; i < 50; i++) {
      this.dots.push({
        x: Math.random() * (this.canvas.width - 40) + 20,
        y: Math.random() * (this.canvas.height - 40) + 20,
        radius: 3,
        isPower: Math.random() < 0.05,
        color: '#ffffff'
      });
    }
  }

  spawnGhost() {
    const types = ['chaser', 'ambusher', 'speedy', 'erratic'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let color, speed;
    if (type === 'chaser') { color = '#ff0055'; speed = 2.5; }
    else if (type === 'ambusher') { color = '#ff00ff'; speed = 2.2; }
    else if (type === 'speedy') { color = '#ffcc00'; speed = 3.5; }
    else { color = '#00eeff'; speed = 2.8; } // erratic
    
    this.ghosts.push({
      x: Math.random() < 0.5 ? -20 : this.canvas.width + 20, // Spawn just outside
      y: Math.random() < 0.5 ? -20 : this.canvas.height + 20,
      radius: 14,
      speed: speed,
      baseSpeed: speed,
      color: color,
      type: type,
      vx: 0,
      vy: 0,
      changeTimer: 0
    });
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.player.targetX = (e.clientX || e.touches[0].clientX) - rect.left;
    this.player.targetY = (e.clientY || e.touches[0].clientY) - rect.top;
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.player.targetX = (e.clientX || e.touches[0].clientX) - rect.left;
    this.player.targetY = (e.clientY || e.touches[0].clientY) - rect.top;
  }

  handlePointerUp() {}

  createExplosion(x, y, color) {
    this.shake = 10;
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
  }

  update() {
    if (this.shake > 0) this.shake--;
    if (this.powerMode > 0) {
      this.powerMode--;
      this.player.speed = 6.5;
      this.player.color = '#ffffff';
    } else {
      this.player.speed = 4.5;
      this.player.color = '#00ffcc';
    }

    // Player movement
    const dx = this.player.targetX - this.player.x;
    const dy = this.player.targetY - this.player.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > this.player.speed) {
      this.player.vx = (dx / dist) * this.player.speed;
      this.player.vy = (dy / dist) * this.player.speed;
      this.player.x += this.player.vx;
      this.player.y += this.player.vy;
      this.player.angle = Math.atan2(this.player.vy, this.player.vx);
      
      // Exhaust particles
      if (Math.random() < 0.3) {
         this.particles.push({
            x: this.player.x - Math.cos(this.player.angle)*15,
            y: this.player.y - Math.sin(this.player.angle)*15,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5 + Math.random()*0.5,
            color: this.player.color
         });
      }
    }

    // Trail
    this.trail.push({ x: this.player.x, y: this.player.y, life: 1 });
    if (this.trail.length > 20) this.trail.shift();
    this.trail.forEach(t => t.life -= 0.05);

    // Collisions with dots
    for (let i = this.dots.length - 1; i >= 0; i--) {
      const d = this.dots[i];
      if (Math.hypot(this.player.x - d.x, this.player.y - d.y) < this.player.radius + (d.isPower ? 8 : d.radius)) {
        if (d.isPower) {
          this.powerMode = 300; // 5 seconds of power mode
          this.createExplosion(d.x, d.y, '#ffffff');
          this.callbacks.playSound('laser');
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 50);
        } else {
          this.callbacks.playSound('coin');
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 10);
        }
        this.dots.splice(i, 1);
        
        // Next Wave if dots are clear
        if (this.dots.length === 0) {
          this.level++;
          this.spawnDots();
          this.spawnGhost(); // Add a new ghost every wave!
          this.callbacks.triggerGsapMilestone(this.player.x, this.player.y);
        }
      }
    }

    // Ghosts update
    this.ghosts.forEach((g, i) => {
      const isFleeing = this.powerMode > 0;
      const gDir = isFleeing ? -1 : 1;
      
      // Speed scales up with level
      const speedMultiplier = 1 + (this.level * 0.05);
      const currentSpeed = isFleeing ? g.baseSpeed * 0.6 : g.baseSpeed * speedMultiplier;

      let targetX = this.player.x;
      let targetY = this.player.y;

      if (!isFleeing) {
          if (g.type === 'ambusher') {
              // Try to cut off player based on their velocity
              targetX = this.player.x + (this.player.vx * 20);
              targetY = this.player.y + (this.player.vy * 20);
          } else if (g.type === 'erratic') {
              g.changeTimer--;
              if (g.changeTimer <= 0) {
                  g.changeTimer = 30 + Math.random() * 60;
                  g.erraticTarget = {
                      x: this.player.x + (Math.random() - 0.5) * 200,
                      y: this.player.y + (Math.random() - 0.5) * 200
                  };
              }
              targetX = g.erraticTarget ? g.erraticTarget.x : this.player.x;
              targetY = g.erraticTarget ? g.erraticTarget.y : this.player.y;
          } else if (g.type === 'speedy') {
              // Speedy drifts wide
              targetX = this.player.x;
              targetY = this.player.y;
          }
      }

      const gdx = targetX - g.x;
      const gdy = targetY - g.y;
      const gdist = Math.hypot(gdx, gdy);
      
      if (gdist > 0) {
        let nvx = (gdx / gdist) * currentSpeed * gDir;
        let nvy = (gdy / gdist) * currentSpeed * gDir;
        
        if (g.type === 'speedy' && !isFleeing) {
            // Wider turning radius, inertia
            g.vx = g.vx * 0.95 + nvx * 0.05;
            g.vy = g.vy * 0.95 + nvy * 0.05;
        } else {
            g.vx = nvx;
            g.vy = nvy;
        }
      }

      g.x += g.vx;
      g.y += g.vy;

      // Keep ghosts in bounds
      if (g.x < 0) { g.x = 0; g.vx *= -1; }
      if (g.x > this.canvas.width) { g.x = this.canvas.width; g.vx *= -1; }
      if (g.y < 0) { g.y = 0; g.vy *= -1; }
      if (g.y > this.canvas.height) { g.y = this.canvas.height; g.vy *= -1; }

      // Separation force to prevent overlapping
      for (let j = 0; j < this.ghosts.length; j++) {
         if (i === j) continue;
         const other = this.ghosts[j];
         const ddx = g.x - other.x;
         const ddy = g.y - other.y;
         const ddist = Math.hypot(ddx, ddy);
         const minDist = g.radius + other.radius + 2;
         if (ddist > 0 && ddist < minDist) {
            const force = (minDist - ddist) / minDist;
            g.x += (ddx / ddist) * force * 1.5;
            g.y += (ddy / ddist) * force * 1.5;
         }
      }

      // Player collision
      const pDist = Math.hypot(this.player.x - g.x, this.player.y - g.y);
      if (pDist < this.player.radius + g.radius - 4) { // slight leniency
        if (this.powerMode > 0) {
          // Eat ghost
          this.createExplosion(g.x, g.y, g.color);
          this.callbacks.playSound('blip');
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 200);
          this.ghosts.splice(i, 1);
          setTimeout(() => this.spawnGhost(), 3000); // Respawns later
        } else {
          // Death
          this.createExplosion(this.player.x, this.player.y, '#ff0000');
          this.callbacks.playSound('hurt');
          this.callbacks.setGameState("failed");
        }
      }
    });

    // Particles update
    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  draw() {
    const ctx = this.ctx;
    
    // Background with shake
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    
    ctx.fillStyle = "rgba(5, 5, 10, 0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < this.canvas.width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); }
    for (let y = 0; y < this.canvas.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); }
    ctx.stroke();

    // Draw dots
    this.dots.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.isPower ? 8 : d.radius, 0, Math.PI * 2);
      ctx.fillStyle = d.isPower ? '#ffffff' : '#00ffff';
      ctx.shadowBlur = d.isPower ? 15 : 5;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
    });

    // Draw player trail
    this.trail.forEach(t => {
      if (t.life > 0) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.player.radius * t.life, 0, Math.PI * 2);
        ctx.fillStyle = this.powerMode > 0 ? `rgba(255,255,255,${t.life * 0.2})` : `rgba(0,255,204,${t.life * 0.2})`;
        ctx.fill();
      }
    });

    // Draw particles
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Draw ghosts
    this.ghosts.forEach(g => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, Math.PI, 0);
      ctx.lineTo(g.x + g.radius, g.y + g.radius);
      ctx.lineTo(g.x + g.radius * 0.5, g.y + g.radius * 0.5);
      ctx.lineTo(g.x, g.y + g.radius);
      ctx.lineTo(g.x - g.radius * 0.5, g.y + g.radius * 0.5);
      ctx.lineTo(g.x - g.radius, g.y + g.radius);
      ctx.closePath();
      
      const ghostColor = this.powerMode > 0 ? (Math.random() > 0.5 ? '#0000ff' : '#ffffff') : g.color;
      ctx.fillStyle = ghostColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = ghostColor;
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(g.x - 4, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(g.x + 4, g.y - 2, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(g.x - 4 + (g.vx > 0 ? 1 : -1), g.y - 2 + (g.vy > 0 ? 1 : -1), 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(g.x + 4 + (g.vx > 0 ? 1 : -1), g.y - 2 + (g.vy > 0 ? 1 : -1), 1.5, 0, Math.PI*2); ctx.fill();
    });

    // Draw Modern Redesigned Player (Solid Pacman Shape)
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    ctx.rotate(this.player.angle);

    const mouthOpen = Math.abs(Math.sin(Date.now() / 80)) * 0.6 + 0.1; // dynamic mouth open

    ctx.beginPath();
    ctx.arc(0, 0, this.player.radius, mouthOpen, Math.PI * 2 - mouthOpen);
    ctx.lineTo(0, 0); // connect back to center for wedge
    ctx.closePath();
    ctx.fillStyle = this.player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.player.color;
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(0, -this.player.radius * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0a';
    ctx.shadowBlur = 0;
    ctx.fill();

    ctx.restore();

    ctx.shadowBlur = 0;
    
    // UI Overlay for Level
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`WAVE: ${this.level}`, 20, 30);
    
    ctx.restore();
  }

  destroy() {}
}
