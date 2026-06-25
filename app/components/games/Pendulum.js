export default class PendulumGame {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    // Slower initial speed
    this.player = { x: canvas.width * 0.2, y: canvas.height / 2, vx: 3, vy: 0, r: 12 };
    this.grapple = null;
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];
    this.gravity = 0.35; // Slightly lower gravity for more control
    this.score = 0;
    this.frame = 0;
    this.state = "playing";
    this.hitstop = 0;
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.speedMultiplier = 1;
    this.bgOffset = 0;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    
    this.spawnObstacle(canvas.width);
  }

  spawnObstacle(x) {
    const isTop = Math.random() > 0.5;
    const height = 150 + Math.random() * 200;
    const isMoving = Math.random() > 0.6;
    
    this.obstacles.push({
      x: x,
      y: isTop ? 0 : this.canvas.height - height,
      w: 40,
      h: height,
      passed: false,
      isTop: isTop,
      isMoving: isMoving,
      vy: isMoving ? (Math.random() > 0.5 ? 1.5 : -1.5) : 0
    });
    
    // 30% chance to spawn a collectible orb near this obstacle
    if (Math.random() > 0.7) {
      this.collectibles.push({
         x: x + 80 + Math.random() * 100,
         y: Math.random() * (this.canvas.height - 100) + 50,
         r: 15,
         wobble: Math.random() * Math.PI * 2
      });
    }
  }

  handlePointerDown(e) {
    if (this.state !== "playing") return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    // Grapple exactly where the user clicked horizontally, always on the ceiling
    this.grapple = {
      x: cx,
      y: 0,
      length: Math.hypot(cx - this.player.x, this.player.y) * 0.9 // 0.9 so it pulls them up slightly
    };
    
    // JUICE: Screenshake & Particles on grapple
    this.screenShake = 4;
    for(let i=0; i<10; i++) {
      this.particles.push({
        x: this.player.x, y: this.player.y,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
        life: 20, color: "#ffffff"
      });
    }
  }

  handlePointerUp() {
    this.grapple = null;
  }

  update() {
    if (this.state === "failed") return;
    
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    
    this.frame++;
    // Slower speed scaling
    this.speedMultiplier += 0.0001; 

    const spawnRate = Math.max(40, Math.floor(100 / this.speedMultiplier));
    if (this.frame % spawnRate === 0) {
      this.spawnObstacle(this.canvas.width + 100);
    }

    if (this.grapple) {
      const dx = this.player.x - this.grapple.x;
      const dy = this.player.y - this.grapple.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      if (distance > this.grapple.length) {
        const force = (distance - this.grapple.length) * 0.12;
        this.player.vx -= (dx / distance) * force;
        this.player.vy -= (dy / distance) * force;
      }
      
      if (Math.random() > 0.5) {
        this.particles.push({
          x: this.player.x + Math.random() * dx,
          y: this.player.y + Math.random() * dy,
          vx: Math.random() * 2 - 1,
          vy: Math.random() * 2 - 1,
          life: 20, color: "#ff3366"
        });
      }
    }
    
    this.player.vy += this.gravity * this.speedMultiplier;
    
    // Only apply friction if not grappling, so momentum is conserved during swings
    if (!this.grapple) {
      this.player.vx *= 0.99;
      this.player.vy *= 0.99;
    }
    
    if (this.player.vx < 3 * this.speedMultiplier) this.player.vx += 0.1 * this.speedMultiplier; 
    // Reduced max speed
    const maxSpeed = 16 * this.speedMultiplier; 
    if (this.player.vx > maxSpeed) this.player.vx = maxSpeed;

    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    const targetX = this.canvas.width * 0.2;
    const diffX = this.player.x - targetX;
    this.player.x -= diffX;
    if (this.grapple) this.grapple.x -= diffX;
    
    // Background parallax scrolling
    this.bgOffset = (this.bgOffset + diffX * 0.5) % 100;
    
    this.score += diffX / 100;
    this.callbacks.setScoreRef(Math.floor(this.score));
    if (this.frame % 10 === 0) this.callbacks.setScore(Math.floor(this.score));

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      let obs = this.obstacles[i];
      obs.x -= diffX;
      
      if (obs.isMoving) {
         obs.y += obs.vy;
         if (obs.isTop && obs.y > 0) obs.vy *= -1;
         if (obs.isTop && obs.y < -obs.h + 50) obs.vy *= -1;
         if (!obs.isTop && obs.y < this.canvas.height - obs.h - 100) obs.vy *= -1;
         if (!obs.isTop && obs.y > this.canvas.height - 50) obs.vy *= -1;
      }
      
      if (this.player.x + this.player.r > obs.x && this.player.x - this.player.r < obs.x + obs.w &&
          this.player.y + this.player.r > obs.y && this.player.y - this.player.r < obs.y + obs.h) {
        this.state = "failed";
        this.callbacks.setGameState("failed");
        
        for(let p=0; p<40; p++) {
          this.particles.push({
            x: this.player.x, y: this.player.y,
            vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
            life: 60, color: "#ffffff"
          });
        }
      }
      
      if (obs.x < -obs.w) this.obstacles.splice(i, 1);
    }
    
    // Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      let col = this.collectibles[i];
      col.x -= diffX;
      col.wobble += 0.1;
      
      const dist = Math.hypot(this.player.x - col.x, this.player.y - (col.y + Math.sin(col.wobble)*10));
      if (dist < this.player.r + col.r) {
         // Collect
         this.score += 50;
         this.hitstop = 3;
         this.screenShake = 10;
         this.flashAlpha = 0.5;
         
         for(let p=0; p<25; p++) {
            this.particles.push({
               x: col.x, y: col.y,
               vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
               life: 40, color: "#00ffff"
            });
         }
         this.collectibles.splice(i, 1);
      } else if (col.x < -50) {
         this.collectibles.splice(i, 1);
      }
    }

    if (this.player.y > this.canvas.height + 50 || this.player.y < -50) {
       this.state = "failed";
       this.callbacks.setGameState("failed");
    }

    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
    
    if (this.flashAlpha > 0) this.flashAlpha -= 0.05;
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    // Dynamic Hue based on speed
    const baseHue = (this.speedMultiplier - 1) * 300;
    const obsColor = `hsl(${baseHue}, 100%, 60%)`;
    
    // JUICE: Screenshake
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
      this.screenShake *= 0.8;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Fully clear screen to prevent "stretching" effect caused by motion blur on obstacles
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Parallax Grid Background
    ctx.strokeStyle = "rgba(0, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let x = -this.bgOffset; x < this.canvas.width; x += 100) {
      ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height);
    }
    for(let y = 0; y < this.canvas.height; y += 100) {
      ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();

    if (this.state === "playing") {
      this.particles.push({ x: this.player.x, y: this.player.y, vx: 0, vy: 0, life: 15, isTrail: true, color: obsColor });
    }

    ctx.globalCompositeOperation = "lighter";
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / (p.isTrail ? 15 : 60);
      ctx.fillStyle = p.color || "#ffffff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isTrail ? this.player.r * 0.8 : 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (this.grapple && this.state === "playing") {
      // Flickering electric grapple line
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.random()*0.5})`;
      ctx.lineWidth = 2 + Math.random();
      ctx.beginPath();
      ctx.moveTo(this.player.x, this.player.y);
      ctx.lineTo(this.grapple.x, this.grapple.y);
      ctx.stroke();
      
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ffff";
      ctx.beginPath();
      ctx.arc(this.grapple.x, this.grapple.y, 5, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Collectibles
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "#00ffff";
    this.collectibles.forEach(col => {
       ctx.beginPath();
       ctx.arc(col.x, col.y + Math.sin(col.wobble)*10, col.r * (0.8 + Math.sin(this.frame*0.2)*0.2), 0, Math.PI*2);
       ctx.fill();
       // Inner white core
       ctx.fillStyle = "#ffffff";
       ctx.beginPath();
       ctx.arc(col.x, col.y + Math.sin(col.wobble)*10, col.r * 0.4, 0, Math.PI*2);
       ctx.fill();
       ctx.fillStyle = "#00ffff";
    });
    ctx.shadowBlur = 0;

    // Creative Glowing Pillars for Obstacles
    this.obstacles.forEach(obs => {
      // Outer dim glow box
      ctx.fillStyle = "rgba(10, 10, 10, 0.8)";
      ctx.shadowBlur = 15;
      ctx.shadowColor = obsColor;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      
      // Electric edges
      ctx.strokeStyle = obsColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      
      // Glowing core line inside
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.fillRect(obs.x + obs.w/2 - 2, obs.y + 5, 4, obs.h - 10);
      ctx.shadowBlur = 0;
    });

    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 20;
      ctx.shadowColor = obsColor;
      ctx.beginPath();
      // Cap the elastic stretch so it doesn't look completely warped
      const stretch = Math.min(this.player.r * 1.5, this.player.vx * 0.15);
      ctx.ellipse(this.player.x, this.player.y, this.player.r + stretch, this.player.r, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    ctx.restore();
  }

  destroy() {
  }
}
