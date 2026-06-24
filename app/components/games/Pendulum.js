export default class PendulumGame {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.player = { x: canvas.width * 0.2, y: canvas.height / 2, vx: 5, vy: 0, r: 12 };
    this.grapple = null;
    this.obstacles = [];
    this.particles = [];
    this.gravity = 0.4;
    this.score = 0;
    this.frame = 0;
    this.state = "playing";
    this.hitstop = 0;
    this.screenShake = 0;
    this.speedMultiplier = 1;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    
    this.spawnObstacle(canvas.width);
  }

  spawnObstacle(x) {
    const isTop = Math.random() > 0.5;
    const height = 150 + Math.random() * 200;
    this.obstacles.push({
      x: x,
      y: isTop ? 0 : this.canvas.height - height,
      w: 40,
      h: height,
      passed: false
    });
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    this.grapple = {
      x: this.player.x + 200,
      y: 0,
      length: Math.sqrt(200*200 + this.player.y * this.player.y)
    };
    
    // JUICE: Hitstop & Screenshake & Particles on grapple
    this.hitstop = 4;
    this.screenShake = 12;
    for(let i=0; i<15; i++) {
      this.particles.push({
        x: this.player.x, y: this.player.y,
        vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
        life: 25
      });
    }
  }

  handlePointerUp() {
    this.grapple = null;
  }

  update() {
    if (this.state === "failed") return;
    
    // JUICE: Hitstop freeze
    if (this.hitstop > 0) {
      this.hitstop--;
      return; 
    }
    
    this.frame++;
    this.speedMultiplier += 0.0002; // Gradually increase speed

    // Spawn obstacles more frequently as speed increases
    const spawnRate = Math.max(40, Math.floor(100 / this.speedMultiplier));
    if (this.frame % spawnRate === 0) {
      this.spawnObstacle(this.canvas.width + 100);
    }

    if (this.grapple) {
      const dx = this.player.x - this.grapple.x;
      const dy = this.player.y - this.grapple.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance > this.grapple.length) {
        const force = (distance - this.grapple.length) * 0.1;
        this.player.vx -= (dx / distance) * force;
        this.player.vy -= (dy / distance) * force;
      }
      
      if (Math.random() > 0.5) {
        this.particles.push({
          x: this.player.x + Math.random() * dx,
          y: this.player.y + Math.random() * dy,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          life: 20
        });
      }
    }
    
    this.player.vy += this.gravity * this.speedMultiplier;
    this.player.vx *= 0.99;
    this.player.vy *= 0.99;
    
    if (this.player.vx < 4 * this.speedMultiplier) this.player.vx += 0.2 * this.speedMultiplier;
    const maxSpeed = 15 * this.speedMultiplier;
    if (this.player.vx > maxSpeed) this.player.vx = maxSpeed;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    const targetX = this.canvas.width * 0.2;
    const diffX = this.player.x - targetX;
    this.player.x -= diffX;
    if (this.grapple) this.grapple.x -= diffX;
    
    this.score += diffX / 100;
    this.callbacks.setScoreRef(Math.floor(this.score));
    if (this.frame % 10 === 0) this.callbacks.setScore(Math.floor(this.score));

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= diffX;
      
      if (this.player.x + this.player.r > obs.x && this.player.x - this.player.r < obs.x + obs.w &&
          this.player.y + this.player.r > obs.y && this.player.y - this.player.r < obs.y + obs.h) {
        this.state = "failed";
        this.callbacks.setGameState("failed");
        
        for(let p=0; p<30; p++) {
          this.particles.push({
            x: this.player.x, y: this.player.y,
            vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
            life: 60
          });
        }
      }
      
      if (obs.x < -obs.w) this.obstacles.splice(i, 1);
    }

    if (this.player.y > this.canvas.height + 50 || this.player.y < -50) {
       this.state = "failed";
       this.callbacks.setGameState("failed");
    }

    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
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

    ctx.fillStyle = "rgba(5,5,5,0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === "playing") {
      this.particles.push({ x: this.player.x, y: this.player.y, vx: 0, vy: 0, life: 15, isTrail: true });
    }

    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / (p.isTrail ? 15 : 60);
      ctx.fillStyle = p.isTrail ? "#ff3366" : "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isTrail ? this.player.r * 0.8 : 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (this.grapple && this.state === "playing") {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.grapple.x, this.grapple.y);
      ctx.stroke();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.grapple.x, this.grapple.y, 5, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle = "#111";
    ctx.strokeStyle = "#ff3366";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff3366";
    this.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    });
    ctx.shadowBlur = 0;

    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff3366";
      ctx.beginPath();
      // Elastic stretch based on velocity
      ctx.ellipse(this.player.x, this.player.y, this.player.r + (this.player.vx * 0.2), this.player.r, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }

  destroy() {
  }
}
