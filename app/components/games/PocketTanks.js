export default class PocketTanks {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.state = "menu"; // menu, player_turn, player_shoot, ai_turn, ai_shoot, game_over
    this.difficulty = "beginner"; // beginner, intermediate, hard
    
    this.gravity = 0.15;
    this.wind = (Math.random() - 0.5) * 0.05; // slight wind
    
    this.terrain = [];
    this.generateTerrain();
    
    this.player = {
       x: 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#00ffff", angle: -Math.PI/4, power: 10
    };
    this.ai = {
       x: this.canvas.width - 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#ff0055", angle: -Math.PI*0.75, power: 10
    };
    
    this.placeTanks();
    
    this.projectile = null;
    this.particles = [];
    
    this.dragStart = null;
    this.dragCurrent = null;
    this.isAiming = false;
    
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.frame = 0;
    this.aiWaitTimer = 0;
  }

  generateTerrain() {
    this.terrain = new Array(this.canvas.width);
    const baseHeight = this.canvas.height * 0.6;
    
    const noise1 = Math.random() * 100;
    const noise2 = Math.random() * 100;
    
    for (let x = 0; x < this.canvas.width; x++) {
       // Super simple 1D terrain using sine waves
       let h = Math.sin(x * 0.005 + noise1) * 80 + Math.sin(x * 0.015 + noise2) * 40;
       this.terrain[x] = baseHeight + h;
    }
  }

  placeTanks() {
    // Player on left, AI on right
    this.player.y = this.terrain[Math.floor(this.player.x)] - this.player.r;
    this.ai.y = this.terrain[Math.floor(this.ai.x)] - this.ai.r;
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    if (this.state === "menu") {
       // Difficulty selection buttons are at centers
       const w = this.canvas.width;
       const h = this.canvas.height;
       
       if (cy > h/2 && cy < h/2 + 40) {
          if (cx > w/2 - 200 && cx < w/2 - 80) {
             this.difficulty = "beginner";
             this.state = "player_turn";
          } else if (cx > w/2 - 60 && cx < w/2 + 60) {
             this.difficulty = "intermediate";
             this.state = "player_turn";
          } else if (cx > w/2 + 80 && cx < w/2 + 200) {
             this.difficulty = "hard";
             this.state = "player_turn";
          }
       }
       return;
    }

    if (this.state === "player_turn") {
       this.isAiming = true;
       this.dragStart = { x: cx, y: cy };
       this.dragCurrent = { x: cx, y: cy };
    }
  }

  handlePointerMove(e) {
    if (!this.isAiming) return;
    const rect = this.canvas.getBoundingClientRect();
    this.dragCurrent = {
      x: (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left,
      y: (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top
    };
    
    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    
    // Slingshot mechanic
    if (Math.hypot(dx, dy) > 5) {
       this.player.angle = Math.atan2(dy, dx);
       this.player.power = Math.min(25, Math.hypot(dx, dy) * 0.15);
    }
  }

  handlePointerUp() {
    if (this.isAiming && this.state === "player_turn") {
       this.isAiming = false;
       this.fireProjectile(this.player, this.player.color);
       this.state = "player_shoot";
       this.dragStart = null;
    }
  }

  fireProjectile(tank, color) {
     this.projectile = {
        x: tank.x,
        y: tank.y - tank.r,
        vx: Math.cos(tank.angle) * tank.power,
        vy: Math.sin(tank.angle) * tank.power,
        color: color,
        trail: []
     };
     this.screenShake = 5;
  }

  calculateAITurn() {
     // AI calculates an angle and power to hit player
     const dx = this.player.x - this.ai.x;
     
     // Randomly pick a high arc or low arc
     const highArc = Math.random() > 0.5;
     
     // Find a good angle by simulation
     let bestAngle = -Math.PI/2 - 0.5; // Aim leftwards mostly
     let bestPower = 15;
     let minError = Infinity;
     
     for (let p = 8; p <= 22; p += 1) {
        for (let a = -Math.PI; a <= -Math.PI/2; a += 0.05) {
           let simX = this.ai.x;
           let simY = this.ai.y - this.ai.r;
           let vx = Math.cos(a) * p;
           let vy = Math.sin(a) * p;
           let hit = false;
           let error = Infinity;
           
           for(let t=0; t<300; t++) {
              simX += vx;
              vy += this.gravity;
              vx += this.wind;
              simY += vy;
              
              const tx = Math.floor(simX);
              if (tx < 0 || tx >= this.canvas.width) break;
              
              if (simY >= this.terrain[tx]) {
                 // Hit ground
                 error = Math.hypot(simX - this.player.x, simY - this.player.y);
                 break;
              }
              if (Math.hypot(simX - this.player.x, simY - this.player.y) < this.player.r + 5) {
                 // Direct hit!
                 error = 0;
                 break;
              }
           }
           
           if (error < minError) {
              minError = error;
              bestAngle = a;
              bestPower = p;
           }
        }
     }
     
     // Apply difficulty variance
     let varianceAngle = 0;
     let variancePower = 0;
     
     if (this.difficulty === "beginner") {
        varianceAngle = (Math.random() - 0.5) * 0.4;
        variancePower = (Math.random() - 0.5) * 4;
     } else if (this.difficulty === "intermediate") {
        varianceAngle = (Math.random() - 0.5) * 0.15;
        variancePower = (Math.random() - 0.5) * 1.5;
     } else if (this.difficulty === "hard") {
        // Almost perfect, slight chance of tiny error
        varianceAngle = (Math.random() - 0.5) * 0.02;
        variancePower = (Math.random() - 0.5) * 0.3;
     }
     
     this.ai.angle = bestAngle + varianceAngle;
     this.ai.power = Math.max(5, Math.min(25, bestPower + variancePower));
     
     this.fireProjectile(this.ai, this.ai.color);
     this.state = "ai_shoot";
  }

  destroyTerrain(cx, cy, radius) {
     for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if (x >= 0 && x < this.canvas.width) {
           // Create crater
           const dx = x - cx;
           const dy = Math.sqrt(radius*radius - dx*dx);
           
           if (this.terrain[x] < cy + dy) {
               // If terrain is above the bottom of the circle, push it down
               this.terrain[x] = Math.max(this.terrain[x], cy + dy);
           }
        }
     }
  }

  update() {
    this.frame++;
    
    // Fall tanks if terrain under them is destroyed
    const py = this.terrain[Math.floor(this.player.x)];
    if (this.player.y + this.player.r < py) {
       this.player.y += 2;
    }
    const ay = this.terrain[Math.floor(this.ai.x)];
    if (this.ai.y + this.ai.r < ay) {
       this.ai.y += 2;
    }
    
    if (this.state === "ai_turn") {
       this.aiWaitTimer--;
       if (this.aiWaitTimer <= 0) {
          this.calculateAITurn();
       }
    }
    
    if (this.projectile) {
       let p = this.projectile;
       p.vy += this.gravity;
       p.vx += this.wind;
       p.x += p.vx;
       p.y += p.vy;
       
       if (this.frame % 2 === 0) {
          p.trail.push({x: p.x, y: p.y, life: 30});
       }
       
       let hit = false;
       let target = null;
       
       // Out of bounds
       if (p.x < -100 || p.x > this.canvas.width + 100 || p.y > this.canvas.height + 100) {
          hit = true;
       }
       
       // Terrain collision
       const tx = Math.floor(p.x);
       if (tx >= 0 && tx < this.canvas.width && p.y >= this.terrain[tx]) {
          hit = true;
       }
       
       // Tank collision
       if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < this.player.r + 5) {
          hit = true;
          target = this.player;
       }
       if (Math.hypot(p.x - this.ai.x, p.y - this.ai.y) < this.ai.r + 5) {
          hit = true;
          target = this.ai;
       }
       
       if (hit) {
          this.screenShake = 15;
          this.flashAlpha = 0.5;
          this.destroyTerrain(p.x, p.y, 35);
          
          // Explosion particles
          for(let i=0; i<40; i++) {
             this.particles.push({
                x: p.x, y: p.y,
                vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12,
                life: 50, color: p.color
             });
          }
          
          // Damage logic
          const distToPlayer = Math.hypot(p.x - this.player.x, p.y - this.player.y);
          if (distToPlayer < 45) {
             this.player.hp -= Math.max(0, 45 - distToPlayer);
          }
          const distToAI = Math.hypot(p.x - this.ai.x, p.y - this.ai.y);
          if (distToAI < 45) {
             this.ai.hp -= Math.max(0, 45 - distToAI);
          }
          
          this.projectile = null;
          
          // Check win/loss
          if (this.player.hp <= 0 || this.ai.hp <= 0) {
             this.state = "game_over";
             setTimeout(() => {
                this.callbacks.setGameState(this.player.hp > 0 ? "victory" : "failed");
             }, 2000);
          } else {
             // Next Turn
             if (this.state === "player_shoot") {
                this.state = "ai_turn";
                this.aiWaitTimer = 60; // wait 1 sec
             } else {
                this.state = "player_turn";
             }
          }
       }
    }
    
    // Update trails and particles
    if (this.projectile) {
       this.projectile.trail.forEach(t => t.life--);
       this.projectile.trail = this.projectile.trail.filter(t => t.life > 0);
    }
    this.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    if (this.screenShake > 0) {
      ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
      this.screenShake *= 0.8;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }
    
    // Background
    ctx.fillStyle = "rgba(5, 10, 15, 0.8)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.state === "menu") {
       ctx.fillStyle = "#ffffff";
       ctx.font = "bold 32px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText("SELECT DIFFICULTY", this.canvas.width/2, this.canvas.height/2 - 50);
       
       const drawBtn = (x, w, text, color) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.fillStyle = `rgba(0,0,0,0.5)`;
          ctx.beginPath();
          ctx.roundRect(x, this.canvas.height/2, w, 40, 8);
          ctx.fill(); ctx.stroke();
          
          ctx.fillStyle = color;
          ctx.font = "bold 14px 'Panchang', sans-serif";
          ctx.fillText(text, x + w/2, this.canvas.height/2 + 25);
       };
       
       drawBtn(this.canvas.width/2 - 200, 120, "BEGINNER", "#00ffcc");
       drawBtn(this.canvas.width/2 - 60, 120, "NORMAL", "#ffcc00");
       drawBtn(this.canvas.width/2 + 80, 120, "HARD", "#ff0055");
       
       ctx.restore();
       return;
    }

    // Wind indicator
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`WIND: ${(this.wind * 100).toFixed(1)}`, this.canvas.width/2, 30);
    
    // Draw Terrain
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height);
    for (let x = 0; x < this.canvas.width; x++) {
       ctx.lineTo(x, this.terrain[x]);
    }
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, this.canvas.height/2, 0, this.canvas.height);
    grad.addColorStop(0, "rgba(0, 255, 200, 0.15)");
    grad.addColorStop(1, "rgba(0, 50, 100, 0.4)");
    ctx.fillStyle = grad;
    ctx.fill();
    
    ctx.strokeStyle = "#00ffcc";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffcc";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Tanks
    const drawTank = (tank, label) => {
       ctx.save();
       ctx.translate(tank.x, tank.y);
       
       // Turret
       ctx.rotate(tank.angle);
       ctx.strokeStyle = tank.color;
       ctx.lineWidth = 4;
       ctx.beginPath();
       ctx.moveTo(0, 0);
       ctx.lineTo(20, 0);
       ctx.stroke();
       ctx.rotate(-tank.angle);
       
       // Body
       ctx.fillStyle = "#111";
       ctx.strokeStyle = tank.color;
       ctx.shadowBlur = 10;
       ctx.shadowColor = tank.color;
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.arc(0, 0, tank.r, Math.PI, 0);
       ctx.lineTo(tank.r, tank.r*0.5);
       ctx.lineTo(-tank.r, tank.r*0.5);
       ctx.closePath();
       ctx.fill();
       ctx.stroke();
       ctx.shadowBlur = 0;
       
       ctx.restore();
       
       // HP Bar
       ctx.fillStyle = "rgba(0,0,0,0.5)";
       ctx.fillRect(tank.x - 20, tank.y - tank.r - 20, 40, 6);
       ctx.fillStyle = tank.color;
       ctx.fillRect(tank.x - 20, tank.y - tank.r - 20, 40 * Math.max(0, tank.hp / tank.maxHp), 6);
       ctx.strokeStyle = "#fff";
       ctx.lineWidth = 1;
       ctx.strokeRect(tank.x - 20, tank.y - tank.r - 20, 40, 6);
       
       // Label
       ctx.fillStyle = "#fff";
       ctx.font = "9px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText(label, tank.x, tank.y - tank.r - 25);
    };
    
    drawTank(this.player, "YOU");
    drawTank(this.ai, "AI");

    // Draw Aiming Guide
    if (this.isAiming && this.state === "player_turn") {
       ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
       ctx.setLineDash([5, 5]);
       ctx.lineWidth = 2;
       ctx.beginPath();
       let ax = this.player.x;
       let ay = this.player.y - this.player.r;
       let vx = Math.cos(this.player.angle) * this.player.power;
       let vy = Math.sin(this.player.angle) * this.player.power;
       ctx.moveTo(ax, ay);
       // Show short trajectory prediction
       for(let i=0; i<20; i++) {
          ax += vx; vy += this.gravity; vx += this.wind; ay += vy;
          ctx.lineTo(ax, ay);
       }
       ctx.stroke();
       ctx.setLineDash([]);
       
       // Power text
       ctx.fillStyle = "#fff";
       ctx.fillText(`PWR: ${Math.floor((this.player.power/25)*100)}%`, this.player.x, this.player.y - 50);
    }

    // Draw Projectile
    if (this.projectile) {
       let p = this.projectile;
       ctx.shadowBlur = 10;
       ctx.shadowColor = p.color;
       ctx.fillStyle = p.color;
       ctx.beginPath();
       ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
       ctx.fill();
       ctx.shadowBlur = 0;
       
       // Trail
       if (p.trail.length > 0) {
          ctx.beginPath();
          p.trail.forEach((t, i) => {
             if (i===0) ctx.moveTo(t.x, t.y);
             else ctx.lineTo(t.x, t.y);
          });
          ctx.strokeStyle = `rgba(255,255,255,0.4)`;
          ctx.lineWidth = 2;
          ctx.stroke();
       }
    }

    // Particles
    this.particles.forEach(p => {
       ctx.globalAlpha = p.life / 50;
       ctx.fillStyle = p.color;
       ctx.beginPath();
       ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
       ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05;
    }
    
    // Status text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    if (this.state === "player_turn") {
       ctx.fillText("YOUR TURN", this.canvas.width/2, 60);
    } else if (this.state === "ai_turn") {
       ctx.fillText("AI IS AIMING...", this.canvas.width/2, 60);
    } else if (this.state === "game_over") {
       ctx.fillStyle = this.player.hp > 0 ? "#00ffcc" : "#ff0055";
       ctx.fillText(this.player.hp > 0 ? "VICTORY!" : "DEFEAT!", this.canvas.width/2, 60);
    }

    ctx.restore();
  }

  destroy() {}
}
