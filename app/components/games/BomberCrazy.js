export default class BomberCrazy {
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
      speed: 5,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2,
      color: '#00ffff'
    };
    
    this.bombs = [];
    this.explosions = [];
    this.enemies = [];
    this.particles = [];
    
    this.shake = 0;
    this.spawnTimer = 0;
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    // Plant a bomb
    if (this.bombs.length < 5) {
      this.bombs.push({
        x: this.player.x,
        y: this.player.y,
        radius: 10,
        timer: 120, // 2 seconds at 60fps
        color: '#ff0055'
      });
      
      // Pulse effect on place
      this.createShockwave(this.player.x, this.player.y, '#ff0055');
    }
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.player.targetX = (e.clientX || e.touches[0].clientX) - rect.left;
    this.player.targetY = (e.clientY || e.touches[0].clientY) - rect.top;
  }

  handlePointerUp() {}

  createShockwave(x, y, color) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color
      });
    }
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * this.canvas.width; y = -20; }
    else if (side === 1) { x = this.canvas.width + 20; y = Math.random() * this.canvas.height; }
    else if (side === 2) { x = Math.random() * this.canvas.width; y = this.canvas.height + 20; }
    else { x = -20; y = Math.random() * this.canvas.height; }
    
    this.enemies.push({
      x, y,
      radius: 12,
      vx: 0,
      vy: 0,
      speed: 1.5 + Math.random() + (this.callbacks.getScoreRef() / 1000),
      color: '#ffaa00'
    });
  }

  update() {
    if (this.shake > 0) this.shake--;

    // Player movement
    const dx = this.player.targetX - this.player.x;
    const dy = this.player.targetY - this.player.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > this.player.speed) {
      this.player.vx = (dx / dist) * this.player.speed;
      this.player.vy = (dy / dist) * this.player.speed;
      this.player.x += this.player.vx;
      this.player.y += this.player.vy;
    } else {
      this.player.x = this.player.targetX;
      this.player.y = this.player.targetY;
    }

    // Spawn enemies
    this.spawnTimer--;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(20, 100 - this.callbacks.getScoreRef() / 10);
    }

    // Enemies movement & collision with player
    this.enemies.forEach(e => {
      const edx = this.player.x - e.x;
      const edy = this.player.y - e.y;
      const edist = Math.hypot(edx, edy);
      if (edist > 0) {
        e.vx = (edx / edist) * e.speed;
        e.vy = (edy / edist) * e.speed;
      }
      e.x += e.vx;
      e.y += e.vy;

      if (edist < this.player.radius + e.radius) {
        this.shake = 20;
        this.createShockwave(this.player.x, this.player.y, '#ff0000');
        this.callbacks.setGameState("failed");
      }
    });

    // Bombs update
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer--;
      
      // Wobble effect
      b.radius = 10 + Math.sin(b.timer * 0.5) * 2;

      if (b.timer <= 0) {
        this.shake = 15;
        this.explosions.push({
          x: b.x,
          y: b.y,
          life: 1, // Full life
          color: b.color,
          radius: 200 // length of cross beam
        });
        
        // Massive explosion particles
        for(let j=0; j<40; j++) {
           const a = Math.random() * Math.PI * 2;
           const s = 5 + Math.random() * 10;
           this.particles.push({
              x: b.x, y: b.y,
              vx: Math.cos(a)*s, vy: Math.sin(a)*s,
              life: 1, color: b.color
           });
        }
        
        this.bombs.splice(i, 1);
        this.callbacks.triggerGsapMilestone(b.x, b.y);
      }
    }

    // Explosions update & collision
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= 0.03;
      
      const beamWidth = 20 * ex.life;
      const beamLength = ex.radius;

      // Check enemy collisions
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        // Cross collision detection
        const inHoriz = Math.abs(e.y - ex.y) < beamWidth && Math.abs(e.x - ex.x) < beamLength;
        const inVert = Math.abs(e.x - ex.x) < beamWidth && Math.abs(e.y - ex.y) < beamLength;
        
        if (inHoriz || inVert) {
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 50);
          this.createShockwave(e.x, e.y, e.color);
          this.enemies.splice(j, 1);
        }
      }

      // Check player collision
      if (ex.life > 0.5) { // Only dangerous initially
        const pInHoriz = Math.abs(this.player.y - ex.y) < beamWidth && Math.abs(this.player.x - ex.x) < beamLength;
        const pInVert = Math.abs(this.player.x - ex.x) < beamWidth && Math.abs(this.player.y - ex.y) < beamLength;
        if (pInHoriz || pInVert) {
          this.shake = 20;
          this.callbacks.setGameState("failed");
        }
      }

      if (ex.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    // Particles update
    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.vx *= 0.9;
      p.vy *= 0.9;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    
    // Trail effect background
    ctx.fillStyle = "rgba(10, 5, 5, 0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw explosions
    this.explosions.forEach(ex => {
      ctx.fillStyle = ex.color;
      ctx.shadowBlur = 30;
      ctx.shadowColor = ex.color;
      ctx.globalAlpha = ex.life;
      
      const width = 20 * ex.life;
      // Horiz
      ctx.fillRect(ex.x - ex.radius, ex.y - width/2, ex.radius * 2, width);
      // Vert
      ctx.fillRect(ex.x - width/2, ex.y - ex.radius, width, ex.radius * 2);
      
      // Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, width, 0, Math.PI*2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Draw grid overlay after explosions
    ctx.strokeStyle = "rgba(255, 0, 85, 0.05)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < this.canvas.width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height); }
    for (let y = 0; y < this.canvas.height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y); }
    ctx.stroke();

    // Draw Bombs
    this.bombs.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#111111';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = b.color;
      ctx.shadowBlur = 15 + Math.sin(b.timer * 0.5) * 5;
      ctx.shadowColor = b.color;
      ctx.stroke();
      
      // Spark
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, b.y - b.radius, 3, 0, Math.PI*2);
      ctx.fill();
    });

    // Draw player
    ctx.beginPath();
    ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.player.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw enemies
    this.enemies.forEach(e => {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.radius);
      ctx.lineTo(e.x + e.radius, e.y + e.radius);
      ctx.lineTo(e.x - e.radius, e.y + e.radius);
      ctx.closePath();
      
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = e.color;
      ctx.stroke();
    });

    // Draw particles
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
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
