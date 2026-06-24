export default class GravityFlip {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width * 0.2, y: canvas.height / 2, size: 24, vy: 0, gravity: 0.8 };
    this.speed = 8;
    this.obstacles = [];
    this.particles = [];
    this.score = 0;
    this.frame = 0;
    this.state = "playing";
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    
    this.floorY = this.canvas.height - 100;
    this.ceilY = 100;
    
    // Initial safe zone
    for (let i=0; i<3; i++) {
      this.spawnObstacle(this.canvas.width + i * 400);
    }
  }

  spawnObstacle(x) {
    const isTop = Math.random() > 0.5;
    const isMoving = Math.random() > 0.8;
    
    this.obstacles.push({
      x: x,
      y: isTop ? this.ceilY : this.floorY - 60,
      w: 40,
      h: 60,
      isTop: isTop,
      isMoving: isMoving,
      vy: isMoving ? (Math.random() > 0.5 ? 2 : -2) : 0
    });
  }

  handlePointerDown() {
    if (this.state !== "playing") return;
    
    // Reverse gravity
    this.player.gravity *= -1;
    this.player.vy = 0; // Cancel current vertical momentum for instant snap feel
    
    // Spawn burst
    for(let i=0; i<10; i++) {
       this.particles.push({
         x: this.player.x, y: this.player.y,
         vx: (Math.random() - 0.5) * 5 - this.speed * 0.5,
         vy: (Math.random() - 0.5) * 5,
         life: 20
       });
    }
  }

  handlePointerUp() {}

  update() {
    if (this.state === "failed") return;
    this.frame++;
    
    this.speed += 0.002; // Gradually increase speed

    if (this.frame % Math.max(20, Math.floor(100 - this.speed*2)) === 0) {
      this.spawnObstacle(this.canvas.width + 100);
    }

    // Player physics
    this.player.vy += this.player.gravity;
    this.player.y += this.player.vy;
    
    // Floor/Ceil collision
    if (this.player.y + this.player.size / 2 > this.floorY) {
      this.player.y = this.floorY - this.player.size / 2;
      this.player.vy = 0;
    }
    if (this.player.y - this.player.size / 2 < this.ceilY) {
      this.player.y = this.ceilY + this.player.size / 2;
      this.player.vy = 0;
    }

    this.score += this.speed * 0.1;
    this.callbacks.setScoreRef(Math.floor(this.score));
    if (this.frame % 10 === 0) this.callbacks.setScore(Math.floor(this.score));

    // Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= this.speed;
      
      if (obs.isMoving) {
         obs.y += obs.vy;
         if (obs.y < this.ceilY || obs.y + obs.h > this.floorY) obs.vy *= -1;
      }
      
      // Collision
      if (this.player.x + this.player.size/2 > obs.x && this.player.x - this.player.size/2 < obs.x + obs.w &&
          this.player.y + this.player.size/2 > obs.y && this.player.y - this.player.size/2 < obs.y + obs.h) {
        this.state = "failed";
        this.callbacks.setGameState("failed");
        
        for(let p=0; p<40; p++) {
          this.particles.push({
            x: this.player.x, y: this.player.y,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
            life: 60
          });
        }
      }
      
      if (obs.x < -obs.w) this.obstacles.splice(i, 1);
    }

    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(10,15,10,0.5)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Floor & Ceil
    ctx.fillStyle = "#33ff33";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#33ff33";
    ctx.fillRect(0, this.ceilY - 5, this.canvas.width, 5);
    ctx.fillRect(0, this.floorY, this.canvas.width, 5);
    ctx.shadowBlur = 0;

    // Draw Particles
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / 60;
      ctx.fillStyle = "#33ff33";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Draw Obstacles
    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#33ff33";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#33ff33";
    this.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });
    ctx.shadowBlur = 0;

    // Draw Player
    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#33ff33";
      
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      // squish effect based on vertical velocity
      const squishY = 1 + Math.abs(this.player.vy) * 0.05;
      const squishX = 1 / squishY;
      ctx.scale(squishX, squishY);
      
      ctx.beginPath();
      ctx.arc(0, 0, this.player.size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      
      ctx.shadowBlur = 0;
    }
  }

  destroy() {}
}
