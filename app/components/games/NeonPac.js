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
      radius: 12,
      vx: 0,
      vy: 0,
      speed: 4,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2,
      color: '#ffcc00'
    };
    
    this.trail = [];
    this.dots = [];
    this.ghosts = [];
    this.particles = [];
    
    this.powerMode = 0; // > 0 means powered up
    this.shake = 0;

    this.initLevel();
  }

  initLevel() {
    this.dots = [];
    this.ghosts = [];
    
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

    // Spawn ghosts
    for (let i = 0; i < 3; i++) {
      this.spawnGhost();
    }
  }

  spawnGhost() {
    this.ghosts.push({
      x: Math.random() < 0.5 ? 20 : this.canvas.width - 20,
      y: Math.random() < 0.5 ? 20 : this.canvas.height - 20,
      radius: 14,
      speed: 2 + Math.random(),
      color: ['#ff0055', '#00eeff', '#ff8800', '#ff00ff'][Math.floor(Math.random() * 4)],
      vx: 0,
      vy: 0
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
      this.player.speed = 6;
      this.player.color = '#ffffff';
    } else {
      this.player.speed = 4;
      this.player.color = '#ffcc00';
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
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 50);
        } else {
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 10);
        }
        this.dots.splice(i, 1);
        
        // Spawn more dots if low
        if (this.dots.length < 10) {
          this.initLevel();
          this.callbacks.triggerGsapMilestone(this.player.x, this.player.y);
        }
      }
    }

    // Ghosts update
    this.ghosts.forEach((g, i) => {
      const gdx = this.player.x - g.x;
      const gdy = this.player.y - g.y;
      const gdist = Math.hypot(gdx, gdy);
      
      const isFleeing = this.powerMode > 0;
      const gDir = isFleeing ? -1 : 1;
      const currentSpeed = isFleeing ? g.speed * 0.6 : g.speed + (this.callbacks.getScoreRef() / 1000);

      if (gdist > 0) {
        g.vx = (gdx / gdist) * currentSpeed * gDir;
        g.vy = (gdy / gdist) * currentSpeed * gDir;
      }

      g.x += g.vx;
      g.y += g.vy;

      // Keep ghosts in bounds
      if (g.x < 0) g.x = 0;
      if (g.x > this.canvas.width) g.x = this.canvas.width;
      if (g.y < 0) g.y = 0;
      if (g.y > this.canvas.height) g.y = this.canvas.height;

      // Player collision
      if (gdist < this.player.radius + g.radius) {
        if (this.powerMode > 0) {
          // Eat ghost
          this.createExplosion(g.x, g.y, g.color);
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 200);
          this.ghosts.splice(i, 1);
          setTimeout(() => this.spawnGhost(), 2000);
        } else {
          // Death
          this.createExplosion(this.player.x, this.player.y, '#ff0000');
          this.callbacks.setGameState("failed");
        }
      }
    });

    // Particles
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

    // Draw trail
    this.trail.forEach(t => {
      if (t.life > 0) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.player.radius * t.life, 0, Math.PI * 2);
        ctx.fillStyle = this.powerMode > 0 ? `rgba(255,255,255,${t.life * 0.5})` : `rgba(255,204,0,${t.life * 0.5})`;
        ctx.fill();
      }
    });

    // Draw player
    ctx.beginPath();
    
    // Pacman mouth angle
    const angle = Math.atan2(this.player.vy, this.player.vx);
    const mouthOpen = Math.abs(Math.sin(Date.now() / 100)) * 0.8;
    ctx.arc(this.player.x, this.player.y, this.player.radius, angle + mouthOpen, angle + Math.PI * 2 - mouthOpen);
    ctx.lineTo(this.player.x, this.player.y);
    ctx.fillStyle = this.player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.player.color;
    ctx.fill();

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

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  destroy() {}
}
