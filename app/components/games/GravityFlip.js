export default class GravityFlip {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    // Play corridor variables (360px height corridor centered vertically)
    const playHeight = 360;
    this.ceilY = Math.max(50, (this.canvas.height - playHeight) / 2);
    this.floorY = this.ceilY + playHeight;

    this.player = { 
      x: canvas.width * 0.2, 
      y: this.ceilY + playHeight / 2, 
      size: 24, 
      vy: 0, 
      gravity: 0.85,
      rotation: 0,
      targetRotation: 0,
      squishX: 1,
      squishY: 1
    };
    
    this.speed = 7; // Starts easier
    this.obstacles = [];
    this.particles = [];
    this.score = 0;
    this.frame = 0;
    this.state = "playing";
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.hue = 120; // Starts green
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    
    // Initial safe zone
    for (let i=0; i<3; i++) {
      this.spawnObstacle(this.canvas.width + i * 400);
    }
  }

  spawnObstacle(x) {
    const isTop = Math.random() > 0.5;
    // As score goes up, obstacles get crazier
    const crazyFactor = Math.min(1.0, this.score / 2000); 
    
    const isMoving = Math.random() > (0.8 - crazyFactor * 0.4);
    const isOscillating = crazyFactor > 0.3 && Math.random() < crazyFactor * 0.5;
    
    const h = 40 + Math.random() * (80 + crazyFactor * 40);
    
    this.obstacles.push({
      x: x,
      y: isTop ? this.ceilY : this.floorY - h,
      w: 40,
      h: h,
      isTop: isTop,
      isMoving: isMoving,
      isOscillating: isOscillating,
      baseY: isTop ? this.ceilY : this.floorY - h,
      oscTime: Math.random() * Math.PI * 2,
      oscSpeed: 0.05 + Math.random() * 0.1 * crazyFactor,
      vy: isMoving ? (Math.random() > 0.5 ? (2.5 + crazyFactor * 2) : -(2.5 + crazyFactor * 2)) : 0
    });
  }

  handlePointerDown() {
    if (this.state !== "playing") return;
    
    // Reverse gravity
    this.player.gravity *= -1;
    
    // Snappy flip: instantly set high velocity towards the new direction of gravity
    this.player.vy = this.player.gravity * 9.5; 
    
    // Crazy flip animation
    this.player.targetRotation = this.player.gravity > 0 ? 0 : Math.PI;
    this.player.squishX = 1.6;
    this.player.squishY = 0.4;
    
    // JUICE: Screenshake and Flash
    this.screenShake = 8 + Math.min(10, this.speed * 0.2);
    this.flashAlpha = 0.3;

    // Spawn burst particles
    for(let i=0; i<15; i++) {
       this.particles.push({
         x: this.player.x, y: this.player.y + (this.player.gravity > 0 ? -10 : 10),
         vx: (Math.random() - 0.5) * 10 - this.speed * 0.5,
         vy: (Math.random() - 0.5) * 10,
         life: 25 + Math.random() * 15
       });
    }
  }

  handlePointerUp() {}

  update() {
    if (this.state === "failed") return;
    this.frame++;
    
    if (this.flashAlpha > 0) this.flashAlpha -= 0.05;
    
    // Speed dynamically scales with distance
    this.speed = 7 + (this.score / 150); 
    if (this.speed > 25) this.speed = 25; // Max crazy speed

    // Hue shift makes it feel crazier
    this.hue = (120 + this.score * 0.2) % 360;

    // Spacing adapts to speed to remain passable, but gets tighter as craziness increases
    const crazyTightness = Math.min(0.8, this.score / 3000);
    const spawnRate = Math.max(25, Math.floor((110 - this.speed * 2.5) * (1 - crazyTightness * 0.3)));
    if (this.frame % spawnRate === 0) {
      this.spawnObstacle(this.canvas.width + 100);
    }

    // Player physics
    this.player.vy += this.player.gravity;
    // Terminal velocity
    if (this.player.vy > 22) this.player.vy = 22;
    if (this.player.vy < -22) this.player.vy = -22;
    
    this.player.y += this.player.vy;
    
    // Smooth out animations
    this.player.rotation += (this.player.targetRotation - this.player.rotation) * 0.2;
    this.player.squishX += (1 - this.player.squishX) * 0.15;
    this.player.squishY += (1 - this.player.squishY) * 0.15;
    
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
         if (obs.y < this.ceilY) {
            obs.y = this.ceilY;
            obs.vy *= -1;
         }
         if (obs.y + obs.h > this.floorY) {
            obs.y = this.floorY - obs.h;
            obs.vy *= -1;
         }
      } else if (obs.isOscillating) {
         obs.oscTime += obs.oscSpeed;
         // Oscillate height
         const stretch = Math.sin(obs.oscTime) * 30;
         obs.h = Math.max(20, 60 + stretch);
         if (!obs.isTop) {
            obs.y = this.floorY - obs.h;
         }
      }
      
      // Collision check with hit tolerance
      const hitTolerance = 6;
      if (this.player.x + this.player.size/2 - hitTolerance > obs.x && this.player.x - this.player.size/2 + hitTolerance < obs.x + obs.w &&
          this.player.y + this.player.size/2 - hitTolerance > obs.y && this.player.y - this.player.size/2 + hitTolerance < obs.y + obs.h) {
        this.state = "failed";
        this.callbacks.setGameState("failed");
        
        for(let p=0; p<60; p++) {
          this.particles.push({
            x: this.player.x, y: this.player.y,
            vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 0.5) * 25,
            life: 80
          });
        }
      }
      
      if (obs.x < -obs.w) this.obstacles.splice(i, 1);
    }

    // Crazy speed trails
    if (this.speed > 12 && this.frame % 2 === 0) {
       this.particles.push({
         x: this.player.x, y: this.player.y,
         vx: -this.speed * 0.5, vy: 0,
         life: 15,
         isTrail: true
       });
    }

    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    const themeColor = `hsl(${this.hue}, 100%, 50%)`;
    const themeShadow = `hsla(${this.hue}, 100%, 50%, 0.5)`;
    
    // JUICE: Screenshake
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
      this.screenShake *= 0.8;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    ctx.fillStyle = "rgba(5, 5, 10, 0.6)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Crazy motion lines in background
    if (this.speed > 10) {
       ctx.strokeStyle = `hsla(${this.hue}, 100%, 50%, 0.1)`;
       ctx.lineWidth = 1;
       ctx.beginPath();
       for(let i=0; i<5; i++) {
          const yPos = this.ceilY + Math.random() * (this.floorY - this.ceilY);
          ctx.moveTo(0, yPos);
          ctx.lineTo(this.canvas.width, yPos);
       }
       ctx.stroke();
    }

    // JUICE: Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw Floor & Ceil
    ctx.fillStyle = themeColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = themeColor;
    ctx.fillRect(0, this.ceilY - 5, this.canvas.width, 5);
    ctx.fillRect(0, this.floorY, this.canvas.width, 5);
    ctx.shadowBlur = 0;

    // Draw Particles
    ctx.globalCompositeOperation = "lighter";
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life / (p.isTrail ? 15 : 60);
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isTrail ? this.player.size * 0.4 : 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // Draw Obstacles
    ctx.fillStyle = "rgba(10, 10, 15, 0.9)";
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = themeShadow;
    this.obstacles.forEach(obs => {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      
      // Inner tech line
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(obs.x + obs.w/2 - 1, obs.y + 5, 2, obs.h - 10);
      ctx.fillStyle = "rgba(10, 10, 15, 0.9)";
    });
    ctx.shadowBlur = 0;

    // Draw Player
    if (this.state === "playing") {
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 25;
      ctx.shadowColor = themeColor;
      
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      
      // Dynamic flip rotation!
      ctx.rotate(this.player.rotation);
      
      // Dynamic squash and stretch based on velocity and click
      const vStretch = 1 + Math.abs(this.player.vy) * 0.03;
      ctx.scale(this.player.squishX / vStretch, this.player.squishY * vStretch);
      
      // Draw a cooler sci-fi shape instead of just a circle
      ctx.beginPath();
      ctx.moveTo(0, -this.player.size/2);
      ctx.lineTo(this.player.size/2, 0);
      ctx.lineTo(0, this.player.size/2);
      ctx.lineTo(-this.player.size/2, 0);
      ctx.closePath();
      ctx.fill();
      
      // Inner eye
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI*2);
      ctx.fill();

      ctx.restore();
      
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }

  destroy() {}
}
