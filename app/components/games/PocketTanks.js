export default class PocketTanks {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.state = "menu"; // menu, player_turn, player_shoot, ai_turn, ai_shoot, game_over
    this.difficulty = "beginner";
    
    this.gravity = 0.15;
    this.wind = (Math.random() - 0.5) * 0.05;
    
    this.terrain = [];
    this.generateTerrain();
    
    this.weaponTypes = {
       'standard': { name: 'STANDARD', damage: 30, radius: 35, color: '#ffffff' },
       'nuke': { name: 'NUKE', damage: 70, radius: 80, color: '#ff0000' },
       'scattery': { name: 'SCATTERY', damage: 15, radius: 25, color: '#00ffcc' },
       'dirtmover': { name: 'DIRT MOVER', damage: 20, radius: 45, color: '#ffcc00' },
       'cluster': { name: 'CLUSTER', damage: 15, radius: 30, color: '#ff00ff' }
    };
    
    this.player = {
       x: 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#00ffff", 
       angle: -Math.PI/4, power: 15, mp: 50, maxMp: 50,
       inventory: this.generateInventory(),
       selectedWeaponIdx: 0,
       dir: 1 // facing right
    };
    
    this.ai = {
       x: this.canvas.width - 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#ff0055", 
       angle: -Math.PI*0.75, power: 15, mp: 50, maxMp: 50,
       inventory: this.generateInventory(),
       selectedWeaponIdx: 0,
       dir: -1 // facing left
    };
    
    this.placeTanks();
    
    this.projectiles = [];
    this.particles = [];
    
    this.dragStart = null;
    this.dragCurrent = null;
    this.isAiming = false;
    
    this.screenShake = 0;
    this.flashAlpha = 0;
    this.frame = 0;
    this.aiWaitTimer = 0;
    
    // UI Layout config
    this.uiH = 90;
    this.uiY = this.canvas.height - this.uiH;
  }

  generateInventory() {
     return [
        { id: 'standard', count: 99 },
        { id: 'nuke', count: Math.floor(Math.random() * 2) + 1 }, // 1-2
        { id: 'scattery', count: Math.floor(Math.random() * 3) + 2 }, // 2-4
        { id: 'dirtmover', count: Math.floor(Math.random() * 3) + 2 }, // 2-4
        { id: 'cluster', count: Math.floor(Math.random() * 3) + 2 }, // 2-4
     ];
  }

  generateTerrain() {
    this.terrain = new Array(this.canvas.width);
    const baseHeight = this.canvas.height * 0.55;
    const noise1 = Math.random() * 100;
    const noise2 = Math.random() * 100;
    
    for (let x = 0; x < this.canvas.width; x++) {
       let h = Math.sin(x * 0.004 + noise1) * 100 + Math.sin(x * 0.015 + noise2) * 40;
       this.terrain[x] = baseHeight + h;
    }
  }

  placeTanks() {
    this.player.y = this.terrain[Math.floor(this.player.x)] - this.player.r;
    this.ai.y = this.terrain[Math.floor(this.ai.x)] - this.ai.r;
  }

  moveTank(tank, dx) {
     if (tank.mp <= 0) return;
     let nx = tank.x + dx;
     if (nx < 10 || nx > this.canvas.width - 10) return;
     
     // Prevent climbing absolute vertical walls easily
     let ny = this.terrain[Math.floor(nx)];
     let slope = ny - this.terrain[Math.floor(tank.x)];
     if (slope < -5) return; // Too steep to climb
     
     tank.x = nx;
     tank.y = ny - tank.r;
     tank.mp -= Math.abs(dx);
     if (tank.mp < 0) tank.mp = 0;
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    if (this.state === "menu") {
       const w = this.canvas.width;
       const h = this.canvas.height;
       if (cy > h/2 && cy < h/2 + 40) {
          if (cx > w/2 - 200 && cx < w/2 - 80) { this.difficulty = "beginner"; this.startMatch(); }
          else if (cx > w/2 - 60 && cx < w/2 + 60) { this.difficulty = "intermediate"; this.startMatch(); }
          else if (cx > w/2 + 80 && cx < w/2 + 200) { this.difficulty = "hard"; this.startMatch(); }
       }
       return;
    }

    if (this.state === "player_turn") {
       // Check UI clicks
       if (cy >= this.uiY) {
          this.handleUIClick(cx, cy);
          return;
       }
       
       // Start Aiming
       this.isAiming = true;
       this.dragStart = { x: cx, y: cy };
       this.dragCurrent = { x: cx, y: cy };
    }
  }
  
  startMatch() {
     this.state = "player_turn";
     this.player.mp = this.player.maxMp;
     this.ai.mp = this.ai.maxMp;
  }

  handleUIClick(cx, cy) {
     const w = this.canvas.width;
     
     // Left btn (move left)
     if (cx > 20 && cx < 70 && cy > this.uiY + 10 && cy < this.uiY + 50) {
        this.moveTank(this.player, -3);
     }
     // Right btn (move right)
     else if (cx > 80 && cx < 130 && cy > this.uiY + 10 && cy < this.uiY + 50) {
        this.moveTank(this.player, 3);
     }
     // Prev Weapon
     else if (cx > w/2 - 120 && cx < w/2 - 80 && cy > this.uiY + 20 && cy < this.uiY + 60) {
        this.player.selectedWeaponIdx--;
        if (this.player.selectedWeaponIdx < 0) this.player.selectedWeaponIdx = this.player.inventory.length - 1;
     }
     // Next Weapon
     else if (cx > w/2 + 80 && cx < w/2 + 120 && cy > this.uiY + 20 && cy < this.uiY + 60) {
        this.player.selectedWeaponIdx++;
        if (this.player.selectedWeaponIdx >= this.player.inventory.length) this.player.selectedWeaponIdx = 0;
     }
     // Fire Button
     else if (cx > w - 120 && cx < w - 20 && cy > this.uiY + 15 && cy < this.uiY + 65) {
        this.executeFire(this.player);
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
    
    if (Math.hypot(dx, dy) > 5) {
       this.player.angle = Math.atan2(dy, dx);
       this.player.power = Math.min(25, Math.hypot(dx, dy) * 0.15);
       if (Math.cos(this.player.angle) >= 0) this.player.dir = 1; else this.player.dir = -1;
    }
  }

  handlePointerUp() {
    if (this.isAiming) {
       this.isAiming = false;
       this.dragStart = null;
    }
  }

  executeFire(tank) {
     const invItem = tank.inventory[tank.selectedWeaponIdx];
     if (invItem.count <= 0) return; // Out of ammo
     
     if (invItem.id !== 'standard') invItem.count--;
     
     const typeData = this.weaponTypes[invItem.id];
     
     this.projectiles.push({
        x: tank.x,
        y: tank.y - tank.r,
        vx: Math.cos(tank.angle) * tank.power,
        vy: Math.sin(tank.angle) * tank.power,
        type: invItem.id,
        damage: typeData.damage,
        radius: typeData.radius,
        color: typeData.color,
        trail: [],
        life: 0,
        bounces: 0
     });
     
     this.screenShake = 5;
     
     if (tank === this.player) {
        this.state = "player_shoot";
     } else {
        this.state = "ai_shoot";
     }
  }

  calculateAITurn() {
     // AI chooses weapon
     let available = this.ai.inventory.filter(i => i.count > 0);
     this.ai.selectedWeaponIdx = this.ai.inventory.indexOf(available[Math.floor(Math.random() * available.length)]);
     
     // AI calculates angle and power
     let bestAngle = -Math.PI/2;
     let bestPower = 15;
     let minError = Infinity;
     
     for (let p = 8; p <= 25; p += 1) {
        for (let a = -Math.PI; a <= 0; a += 0.05) {
           let simX = this.ai.x;
           let simY = this.ai.y - this.ai.r;
           let vx = Math.cos(a) * p;
           let vy = Math.sin(a) * p;
           let error = Infinity;
           
           for(let t=0; t<300; t++) {
              simX += vx;
              vy += this.gravity;
              vx += this.wind;
              simY += vy;
              
              const tx = Math.floor(simX);
              if (tx < 0 || tx >= this.canvas.width) break;
              if (simY >= this.terrain[tx]) {
                 error = Math.hypot(simX - this.player.x, simY - this.player.y);
                 break;
              }
              if (Math.hypot(simX - this.player.x, simY - this.player.y) < this.player.r + 5) {
                 error = 0; break;
              }
           }
           
           if (error < minError) {
              minError = error; bestAngle = a; bestPower = p;
           }
        }
     }
     
     let varianceAngle = 0, variancePower = 0;
     if (this.difficulty === "beginner") {
        varianceAngle = (Math.random() - 0.5) * 0.5;
        variancePower = (Math.random() - 0.5) * 5;
     } else if (this.difficulty === "intermediate") {
        varianceAngle = (Math.random() - 0.5) * 0.15;
        variancePower = (Math.random() - 0.5) * 1.5;
     } else if (this.difficulty === "hard") {
        varianceAngle = (Math.random() - 0.5) * 0.02;
        variancePower = (Math.random() - 0.5) * 0.2;
     }
     
     this.ai.angle = bestAngle + varianceAngle;
     this.ai.power = Math.max(5, Math.min(25, bestPower + variancePower));
     if (Math.cos(this.ai.angle) >= 0) this.ai.dir = 1; else this.ai.dir = -1;
     
     this.executeFire(this.ai);
  }

  destroyTerrain(cx, cy, radius) {
     for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if (x >= 0 && x < this.canvas.width) {
           const dx = x - cx;
           const dy = Math.sqrt(radius*radius - dx*dx);
           if (this.terrain[x] < cy + dy) {
               this.terrain[x] = Math.max(this.terrain[x], cy + dy);
           }
        }
     }
  }
  
  createExplosion(x, y, radius, color, damage) {
     this.screenShake = Math.min(20, radius / 4);
     this.flashAlpha = 0.4;
     this.destroyTerrain(x, y, radius);
     
     for(let i=0; i < radius; i++) {
        this.particles.push({
           x: x, y: y,
           vx: (Math.random()-0.5)*(radius/4), vy: (Math.random()-0.5)*(radius/4),
           life: Math.random() * 40 + 20, color: color
        });
     }
     
     // Damage tanks
     const dToP = Math.hypot(x - this.player.x, y - this.player.y);
     if (dToP < radius + 15) {
        let mult = 1 - (dToP / (radius + 15));
        this.player.hp -= damage * mult;
     }
     
     const dToA = Math.hypot(x - this.ai.x, y - this.ai.y);
     if (dToA < radius + 15) {
        let mult = 1 - (dToA / (radius + 15));
        this.ai.hp -= damage * mult;
     }
  }

  update() {
    this.frame++;
    
    // Gravity for tanks
    const py = this.terrain[Math.floor(this.player.x)];
    if (this.player.y + this.player.r < py) this.player.y += 3;
    const ay = this.terrain[Math.floor(this.ai.x)];
    if (this.ai.y + this.ai.r < ay) this.ai.y += 3;
    
    if (this.state === "ai_turn") {
       this.aiWaitTimer--;
       if (this.aiWaitTimer <= 0) {
          this.calculateAITurn();
       }
    }
    
    if (this.projectiles.length > 0) {
       for (let i = this.projectiles.length - 1; i >= 0; i--) {
          let p = this.projectiles[i];
          p.life++;
          p.vy += this.gravity;
          p.vx += this.wind;
          p.x += p.vx;
          p.y += p.vy;
          
          if (this.frame % 2 === 0) p.trail.push({x: p.x, y: p.y, life: 30});
          
          let hit = false;
          let detonate = false;
          
          // Scattery logic: split mid-air
          if (p.type === 'scattery' && p.vy > 0 && p.life > 20) {
             detonate = true;
             // Spawn 4 smaller shells
             for (let j=0; j<4; j++) {
                this.projectiles.push({
                   x: p.x, y: p.y,
                   vx: p.vx + (Math.random()-0.5)*4, vy: p.vy + (Math.random()-0.5)*4,
                   type: 'standard', damage: 15, radius: 20, color: '#00ffcc', trail: [], life: 0, bounces: 0
                });
             }
          }
          
          // Out of bounds
          if (p.x < -100 || p.x > this.canvas.width + 100 || p.y > this.canvas.height + 100) {
             detonate = true; hit = false;
          }
          
          // Collision
          const tx = Math.floor(p.x);
          if (tx >= 0 && tx < this.canvas.width && p.y >= this.terrain[tx]) {
             hit = true;
          }
          if (Math.hypot(p.x - this.player.x, p.y - this.player.y) < this.player.r + 5 || 
              Math.hypot(p.x - this.ai.x, p.y - this.ai.y) < this.ai.r + 5) {
             hit = true;
          }
          
          if (hit) {
             if (p.type === 'dirtmover') {
                // Burrowing logic: reduce velocity, carve tiny hole, but don't detonate yet
                p.vx *= 0.8; p.vy *= 0.8;
                this.destroyTerrain(p.x, p.y, 10);
                if (Math.hypot(p.vx, p.vy) < 2) detonate = true;
             } else if (p.type === 'cluster' && p.bounces === 0) {
                p.vy *= -0.5; p.y -= 5; p.bounces++;
                // Drop mini bomb
                this.projectiles.push({
                   x: p.x, y: p.y, vx: (Math.random()-0.5)*2, vy: -3,
                   type: 'standard', damage: 15, radius: 25, color: '#ff00ff', trail: [], life: 0, bounces: 0
                });
             } else {
                detonate = true;
             }
          }
          
          if (detonate) {
             if (hit || p.type === 'dirtmover') {
                this.createExplosion(p.x, p.y, p.radius, p.color, p.damage);
             }
             this.projectiles.splice(i, 1);
          }
       }
       
       if (this.projectiles.length === 0) {
          // Check win/loss
          if (this.player.hp <= 0 || this.ai.hp <= 0) {
             this.state = "game_over";
             setTimeout(() => {
                this.callbacks.setGameState(this.player.hp > 0 ? "victory" : "failed");
             }, 2000);
          } else {
             // Change turn
             if (this.state === "player_shoot") {
                this.state = "ai_turn";
                this.aiWaitTimer = 60;
                this.ai.mp = this.ai.maxMp;
             } else {
                this.state = "player_turn";
                this.player.mp = this.player.maxMp;
             }
             // Change wind
             this.wind = (Math.random() - 0.5) * 0.08;
          }
       }
    }
    
    // Update trails and particles
    this.projectiles.forEach(p => {
       p.trail.forEach(t => t.life--);
       p.trail = p.trail.filter(t => t.life > 0);
    });
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
       ctx.fillText("NEON TANKS", this.canvas.width/2, this.canvas.height/2 - 80);
       ctx.font = "bold 16px 'Panchang', sans-serif";
       ctx.fillStyle = "#00ffcc";
       ctx.fillText("SELECT DIFFICULTY", this.canvas.width/2, this.canvas.height/2 - 40);
       
       const drawBtn = (x, w, text, color) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.fillStyle = `rgba(0,0,0,0.5)`;
          ctx.beginPath(); ctx.roundRect(x, this.canvas.height/2, w, 40, 8);
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
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    const windVal = this.wind * 100;
    const windText = windVal < 0 ? `<< ${Math.abs(windVal).toFixed(1)}` : `${windVal.toFixed(1)} >>`;
    ctx.fillText(`WIND: ${windText}`, this.canvas.width/2, 30);
    
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
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffcc";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Tanks (Modern Cyberpunk Style)
    const drawTank = (tank, label) => {
       ctx.save();
       ctx.translate(tank.x, tank.y);
       
       // Turret Barrel
       ctx.save();
       ctx.rotate(tank.angle);
       ctx.strokeStyle = tank.color;
       ctx.lineWidth = 6;
       ctx.lineCap = "round";
       ctx.beginPath();
       ctx.moveTo(0, 0);
       ctx.lineTo(25, 0);
       ctx.stroke();
       ctx.restore();
       
       // Angular Chassis
       ctx.fillStyle = "#111";
       ctx.strokeStyle = tank.color;
       ctx.lineWidth = 2;
       ctx.shadowBlur = 15;
       ctx.shadowColor = tank.color;
       ctx.beginPath();
       ctx.moveTo(-15, 5);
       ctx.lineTo(-10, -5);
       ctx.lineTo(10, -5);
       ctx.lineTo(15, 5);
       ctx.lineTo(10, 12);
       ctx.lineTo(-10, 12);
       ctx.closePath();
       ctx.fill();
       ctx.stroke();
       
       // Treads
       ctx.fillStyle = tank.color;
       ctx.globalAlpha = 0.8;
       ctx.fillRect(-12, 12, 24, 4);
       ctx.globalAlpha = 1;
       ctx.shadowBlur = 0;
       
       ctx.restore();
       
       // HP Bar
       ctx.fillStyle = "rgba(0,0,0,0.5)";
       ctx.fillRect(tank.x - 20, tank.y - 25, 40, 6);
       ctx.fillStyle = tank.color;
       ctx.fillRect(tank.x - 20, tank.y - 25, 40 * Math.max(0, tank.hp / tank.maxHp), 6);
       ctx.strokeStyle = "#fff";
       ctx.lineWidth = 1;
       ctx.strokeRect(tank.x - 20, tank.y - 25, 40, 6);
       
       ctx.fillStyle = "#fff";
       ctx.font = "9px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText(label, tank.x, tank.y - 30);
    };
    
    drawTank(this.player, "YOU");
    drawTank(this.ai, "AI");

    // Aiming Guide
    if (this.isAiming && this.state === "player_turn") {
       ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
       ctx.setLineDash([5, 5]);
       ctx.lineWidth = 2;
       ctx.beginPath();
       let ax = this.player.x;
       let ay = this.player.y - 5;
       let vx = Math.cos(this.player.angle) * this.player.power;
       let vy = Math.sin(this.player.angle) * this.player.power;
       ctx.moveTo(ax, ay);
       for(let i=0; i<15; i++) {
          ax += vx; vy += this.gravity; vx += this.wind; ay += vy;
          ctx.lineTo(ax, ay);
       }
       ctx.stroke();
       ctx.setLineDash([]);
       ctx.fillStyle = "#fff";
       ctx.font = "10px 'Panchang', sans-serif";
       ctx.fillText(`PWR: ${Math.floor((this.player.power/25)*100)}%`, this.player.x, this.player.y - 45);
    }

    // Draw Projectiles
    this.projectiles.forEach(p => {
       ctx.shadowBlur = 15;
       ctx.shadowColor = p.color;
       ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
       ctx.shadowBlur = 0;
       
       if (p.trail.length > 0) {
          ctx.beginPath();
          p.trail.forEach((t, i) => {
             if (i===0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
          });
          ctx.strokeStyle = `rgba(255,255,255,0.4)`;
          ctx.lineWidth = 2;
          ctx.stroke();
       }
    });

    // Particles
    this.particles.forEach(p => {
       ctx.globalAlpha = Math.max(0, p.life / 50);
       ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05;
    }
    
    // Status Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    if (this.state === "player_turn") {
       ctx.fillText("YOUR TURN", this.canvas.width/2, 60);
       ctx.font = "12px sans-serif";
       ctx.fillText("Move, Aim, then Fire", this.canvas.width/2, 80);
    } else if (this.state === "ai_turn") {
       ctx.fillText("AI IS AIMING...", this.canvas.width/2, 60);
    } else if (this.state === "game_over") {
       ctx.fillStyle = this.player.hp > 0 ? "#00ffcc" : "#ff0055";
       ctx.fillText(this.player.hp > 0 ? "VICTORY!" : "DEFEAT!", this.canvas.width/2, 60);
    }

    // Bottom UI Panel (Only during player turn)
    if (this.state === "player_turn" || this.state === "player_shoot") {
       const w = this.canvas.width;
       
       // Glassy UI background
       ctx.fillStyle = "rgba(0, 5, 10, 0.85)";
       ctx.strokeStyle = "#00ffcc";
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.rect(0, this.uiY, w, this.uiH);
       ctx.fill();
       ctx.stroke();
       
       // Movement Controls (Left side)
       ctx.fillStyle = "rgba(0, 255, 204, 0.2)";
       ctx.strokeStyle = "#00ffcc";
       ctx.lineWidth = 1;
       ctx.beginPath(); ctx.roundRect(20, this.uiY + 15, 50, 40, 5); ctx.fill(); ctx.stroke();
       ctx.beginPath(); ctx.roundRect(80, this.uiY + 15, 50, 40, 5); ctx.fill(); ctx.stroke();
       
       ctx.fillStyle = "#00ffcc";
       ctx.font = "bold 16px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText("<", 45, this.uiY + 40);
       ctx.fillText(">", 105, this.uiY + 40);
       
       ctx.font = "10px 'Panchang', sans-serif";
       ctx.fillText(`MP: ${Math.floor(this.player.mp)}`, 75, this.uiY + 75);
       
       // Weapon Selector (Center)
       const invItem = this.player.inventory[this.player.selectedWeaponIdx];
       const wpnData = this.weaponTypes[invItem.id];
       
       ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
       ctx.strokeStyle = "#fff";
       ctx.beginPath(); ctx.roundRect(w/2 - 120, this.uiY + 25, 40, 30, 5); ctx.fill(); ctx.stroke();
       ctx.beginPath(); ctx.roundRect(w/2 + 80, this.uiY + 25, 40, 30, 5); ctx.fill(); ctx.stroke();
       
       ctx.fillStyle = "#fff";
       ctx.fillText("<", w/2 - 100, this.uiY + 45);
       ctx.fillText(">", w/2 + 100, this.uiY + 45);
       
       ctx.fillStyle = wpnData.color;
       ctx.font = "bold 14px 'Panchang', sans-serif";
       ctx.fillText(wpnData.name, w/2, this.uiY + 35);
       ctx.fillStyle = "#fff";
       ctx.font = "10px sans-serif";
       ctx.fillText(`Ammo: ${invItem.count > 50 ? '∞' : invItem.count}`, w/2, this.uiY + 55);
       
       // Fire Button (Right side)
       const canFire = this.state === "player_turn" && invItem.count > 0;
       ctx.fillStyle = canFire ? "rgba(255, 0, 85, 0.4)" : "rgba(100, 100, 100, 0.4)";
       ctx.strokeStyle = canFire ? "#ff0055" : "#666";
       ctx.shadowBlur = canFire ? 15 : 0;
       ctx.shadowColor = "#ff0055";
       ctx.beginPath(); ctx.roundRect(w - 120, this.uiY + 15, 100, 50, 8); ctx.fill(); ctx.stroke();
       ctx.shadowBlur = 0;
       
       ctx.fillStyle = canFire ? "#fff" : "#888";
       ctx.font = "bold 16px 'Panchang', sans-serif";
       ctx.fillText("FIRE", w - 70, this.uiY + 45);
    }

    ctx.restore();
  }

  destroy() {}
}
