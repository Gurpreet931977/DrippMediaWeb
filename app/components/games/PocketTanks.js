export default class PocketTanks {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.state = "menu";
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
       'cluster': { name: 'CLUSTER', damage: 15, radius: 30, color: '#ff00ff' },
       'laser': { name: 'LASER BEAM', damage: 40, radius: 20, color: '#33ff33' },
       'roller': { name: 'GROUND ROLLER', damage: 25, radius: 40, color: '#ff9900' },
       'bouncer': { name: 'BOUNCER', damage: 30, radius: 40, color: '#00aaff' },
       'volcanic': { name: 'VOLCANIC', damage: 10, radius: 20, color: '#ff5500' },
       'sniper': { name: 'SNIPER', damage: 50, radius: 15, color: '#ffff00' },
       'blackhole': { name: 'BLACK HOLE', damage: 80, radius: 60, color: '#9900ff' },
       'boomerang': { name: 'BOOMERANG', damage: 35, radius: 30, color: '#33ccff' },
       'teleporter': { name: 'TELEPORTER', damage: 0, radius: 10, color: '#00ffff' },
       'meteor': { name: 'METEOR', damage: 60, radius: 65, color: '#ff3300' },
       'drill': { name: 'EARTH DRILL', damage: 40, radius: 40, color: '#aaaaaa' }
    };
    
    this.player = {
       x: 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#00ffff", 
       angle: -Math.PI/4, power: 15, mp: 50, maxMp: 50,
       inventory: this.generateInventory(),
       selectedWeaponIdx: 0,
       dir: 1,
       jumps: 1,
       secondJumpUnlocked: false,
       targetX: undefined,
       vy: undefined
    };
    
    this.ai = {
       x: this.canvas.width - 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#ff0055", 
       angle: -Math.PI*0.75, power: 15, mp: 50, maxMp: 50,
       inventory: this.generateInventory(),
       selectedWeaponIdx: 0,
       dir: -1,
       jumps: 1,
       secondJumpUnlocked: false,
       targetX: undefined,
       vy: undefined
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
    
    this.matchTimer = 8 * 60 * 60; // 8 minutes at 60fps
    
    this.uiH = 110;
    this.uiY = this.canvas.height - this.uiH;
    
    this.clickAnims = { moveL: 0, moveR: 0, angU: 0, angD: 0, pwrU: 0, pwrD: 0, fire: 0, jump: 0 };
    this.currentWeaponScroll = 0;

    this.handleKeyDown = (e) => {
       if (e.code === 'Space' && this.state === 'player_turn') {
          e.preventDefault();
          this.executeFire(this.player);
          this.clickAnims.fire = 1;
       }
    };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  generateInventory() {
     return [
        { id: 'standard', count: 99 },
        { id: 'nuke', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'scattery', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'dirtmover', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'cluster', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'laser', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'roller', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'bouncer', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'volcanic', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'sniper', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'blackhole', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'boomerang', count: Math.floor(Math.random() * 3) + 1 },
        { id: 'teleporter', count: Math.floor(Math.random() * 2) + 1 },
        { id: 'meteor', count: Math.floor(Math.random() * 2) + 1 },
        { id: 'drill', count: Math.floor(Math.random() * 2) + 1 }
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
     let tx = tank.targetX !== undefined ? tank.targetX : tank.x;
     let nx = tx + dx;
     if (nx < 10 || nx > this.canvas.width - 10) return;
     
     let ny = this.terrain[Math.floor(nx)];
     let slope = ny - this.terrain[Math.floor(tx)];
     if (slope < -15) return; 
     
     tank.targetX = nx;
     tank.mp -= 1; 
     if (tank.mp < 0) tank.mp = 0;
  }
  
  jumpTank(tank) {
     if (tank.jumps > 0 && tank.vy === undefined) {
         tank.vy = -4.5;
         tank.jumps--;
     }
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
       if (cy >= this.uiY) {
          this.handleUIClick(cx, cy);
          return;
       }
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
     
     // Move controls (Shifted to x=100+)
     const cY = this.uiY + 45; // Move manual controls below
     
     if (cx > 120 && cx < 160 && cy > cY && cy < cY + 35) {
        this.moveTank(this.player, -10);
        this.clickAnims.moveL = 1;
     }
     else if (cx > 165 && cx < 205 && cy > cY && cy < cY + 35) {
        this.moveTank(this.player, 10);
        this.clickAnims.moveR = 1;
     }
     // Angle controls
     else if (cx > 220 && cx < 260 && cy > cY && cy < cY + 35) {
        this.player.angle -= 0.05;
        this.clickAnims.angD = 1;
     }
     else if (cx > 265 && cx < 305 && cy > cY && cy < cY + 35) {
        this.player.angle += 0.05;
        this.clickAnims.angU = 1;
     }
     // Power controls
     else if (cx > 320 && cx < 360 && cy > cY && cy < cY + 35) {
        this.player.power = Math.max(5, this.player.power - 1);
        this.clickAnims.pwrD = 1;
     }
     else if (cx > 365 && cx < 405 && cy > cY && cy < cY + 35) {
        this.player.power = Math.min(40, this.player.power + 1);
        this.clickAnims.pwrU = 1;
     }
     // Jump Button
     else if (cx > 120 && cx < 405 && cy > this.uiY + 8 && cy < this.uiY + 28) {
        this.jumpTank(this.player);
        this.clickAnims.jump = 1;
     }
     
     // Cover Flow Weapon Selector
     // Left zone click
     if (cx > w/2 - 150 && cx < w/2 - 60 && cy > this.uiY + 15 && cy < this.uiY + 75) {
        this.player.selectedWeaponIdx--;
        if (this.player.selectedWeaponIdx < 0) this.player.selectedWeaponIdx = this.player.inventory.length - 1;
     }
     // Right zone click
     else if (cx > w/2 + 60 && cx < w/2 + 150 && cy > this.uiY + 15 && cy < this.uiY + 75) {
        this.player.selectedWeaponIdx++;
        if (this.player.selectedWeaponIdx >= this.player.inventory.length) this.player.selectedWeaponIdx = 0;
     }
     
     // Fire button (Glowing Orb at right)
     const dx = cx - (w - 70);
     const dy = cy - (this.uiY + 45);
     if (Math.hypot(dx, dy) < 40) {
        this.executeFire(this.player);
        this.clickAnims.fire = 1;
     }
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    // Hide custom cursor over UI
    const customCursor = document.querySelector(".cursor");
    if (cy >= this.uiY) {
       if (customCursor) customCursor.style.opacity = '0';
       this.canvas.style.cursor = 'pointer';
    } else {
       if (customCursor) customCursor.style.opacity = '1';
       this.canvas.style.cursor = 'none'; // custom crosshair
    }

    if (!this.isAiming) return;
    this.dragCurrent = { x: cx, y: cy };
    
    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    
    if (Math.hypot(dx, dy) > 5) {
       this.player.angle = Math.atan2(dy, dx);
       this.player.power = Math.min(40, Math.hypot(dx, dy) * 0.15);
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
     if (invItem.count <= 0) return;
     
     if (invItem.id !== 'standard') invItem.count--;
     
     const typeData = this.weaponTypes[invItem.id];
     
     let firePower = tank.power;
     let fireAngle = tank.angle;
     if (invItem.id === 'laser' || invItem.id === 'sniper') {
         firePower = 50; 
     } else if (invItem.id === 'meteor') {
         firePower = Math.min(tank.power, 10);
     }

     const ownerTag = tank === this.player ? 'player' : 'ai';
     
     const startX = tank.x + Math.cos(fireAngle) * 45;
     const startY = tank.y - 6 + Math.sin(fireAngle) * 45;

     this.projectiles.push({
        x: startX,
        y: startY,
        vx: Math.cos(fireAngle) * firePower,
        vy: Math.sin(fireAngle) * firePower,
        type: invItem.id,
        damage: typeData.damage,
        radius: typeData.radius,
        color: typeData.color,
        trail: [],
        life: 0,
        bounces: 0,
        owner: ownerTag
     });
     
     this.screenShake = 5;
     
     if (tank === this.player) {
        this.state = "player_shoot";
     } else {
        this.state = "ai_shoot";
     }
  }

  calculateAITurn() {
     let available = this.ai.inventory.filter(i => i.count > 0);
     this.ai.selectedWeaponIdx = this.ai.inventory.indexOf(available[Math.floor(Math.random() * available.length)]);
     
     let bestAngle = -Math.PI/2;
     let bestPower = 15;
     let minError = Infinity;
     
     for (let p = 8; p <= 40; p += 1) {
        for (let a = -Math.PI; a <= 0; a += 0.05) {
           let simX = this.ai.x;
           let simY = this.ai.y - 6;
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
     this.ai.power = Math.max(5, Math.min(40, bestPower + variancePower));
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
     
     const dToP = Math.hypot(x - this.player.x, y - this.player.y);
     if (dToP < radius + 20) {
        let mult = 1 - (dToP / (radius + 20));
        this.player.hp -= damage * mult;
     }
     
     const dToA = Math.hypot(x - this.ai.x, y - this.ai.y);
     if (dToA < radius + 20) {
        let mult = 1 - (dToA / (radius + 20));
        this.ai.hp -= damage * mult;
     }
  }

  update() {
    this.frame++;
    
    // Decay click anims
    Object.keys(this.clickAnims).forEach(k => {
       if (this.clickAnims[k] > 0) this.clickAnims[k] -= 0.1;
       if (this.clickAnims[k] < 0) this.clickAnims[k] = 0;
    });
    
    // Smooth Cover Flow Weapon Scroll Easing
    const targetScroll = -this.player.selectedWeaponIdx * 120;
    this.currentWeaponScroll += (targetScroll - this.currentWeaponScroll) * 0.15;
    
    const py = this.terrain[Math.floor(this.player.x)];
    
    const updateTankPhysics = (tank) => {
       if (tank.targetX !== undefined) {
          if (Math.abs(tank.targetX - tank.x) > 0.5) tank.x += (tank.targetX - tank.x) * 0.15;
          else { tank.x = tank.targetX; tank.targetX = undefined; }
       }
       if (tank.vy !== undefined) {
          tank.vy += this.gravity;
          tank.y += tank.vy;
          const ty = this.terrain[Math.floor(tank.x)];
          if (tank.y + tank.r >= ty) {
             tank.y = ty - tank.r;
             tank.vy = undefined;
          }
       } else {
          const ty = this.terrain[Math.floor(tank.x)];
          if (tank.y + tank.r < ty) tank.y += 3;
          else tank.y = ty - tank.r;
       }
    };
    updateTankPhysics(this.player);
    updateTankPhysics(this.ai);
    
    if (this.state !== "menu" && this.state !== "game_over") {
       if (this.matchTimer > 0) {
          this.matchTimer--;
          if (this.matchTimer <= 4 * 60 * 60 && !this.player.secondJumpUnlocked) {
             this.player.secondJumpUnlocked = true;
             this.player.jumps++;
             this.ai.jumps++;
          }
       }
    }
    
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
          
          let hit = false;
          let detonate = false;

          if (p.type === 'laser' || p.type === 'sniper') {
             p.vy = 0; 
             p.vx *= 1.05;
          } else if (p.type === 'boomerang') {
             p.vx -= Math.sign(p.vx) * 0.25; // Accelerate backwards
             p.vy += this.gravity * 0.5; // lower gravity for cooler arc
          } else if (p.type === 'blackhole') {
             p.vy = 0;
             p.vx *= 0.98;
             // Suck particles
             this.particles.forEach(part => {
                const dx = p.x - part.x;
                const dy = p.y - part.y;
                if(Math.hypot(dx,dy) < 150) {
                   part.vx += dx * 0.05;
                   part.vy += dy * 0.05;
                }
             });
             // Suck terrain slowly
             this.destroyTerrain(p.x, p.y + 20, 5);
             if (p.life > 100) hit = true;
          } else if (p.type === 'meteor') {
             p.vy += this.gravity * 1.5;
             p.vx *= 0.99;
          } else {
             p.vy += this.gravity;
             p.vx += this.wind;
          }
          
          // Sub-step movement to prevent clipping
          const steps = Math.ceil(Math.hypot(p.vx, p.vy) / 2);
          const stx = p.vx / steps;
          const sty = p.vy / steps;
          
          for (let s = 0; s < steps; s++) {
             p.x += stx;
             p.y += sty;
             
             if (p.x < -100 || p.x > this.canvas.width + 100 || p.y > this.canvas.height + 100) {
                detonate = true; hit = false; break;
             }
             
             if (p.type !== 'blackhole') {
                 const tx = Math.floor(p.x);
                 if (tx >= 0 && tx < this.canvas.width && p.y >= this.terrain[tx]) {
                    hit = true; break;
                 }
             }
             
             if (p.owner !== 'player' && Math.hypot(p.x - this.player.x, p.y - this.player.y) < this.player.r + 5) { hit = true; break; }
             if (p.owner !== 'ai' && Math.hypot(p.x - this.ai.x, p.y - this.ai.y) < this.ai.r + 5) { hit = true; break; }
          }
          
          if (this.frame % 2 === 0) p.trail.push({x: p.x, y: p.y, life: 30});
          
          if (p.type === 'scattery' && p.vy > 0 && p.life > 20) {
             detonate = true;
             for (let j=0; j<4; j++) {
                this.projectiles.push({
                   x: p.x, y: p.y,
                   vx: p.vx + (Math.random()-0.5)*4, vy: p.vy + (Math.random()-0.5)*4,
                   type: 'standard', damage: 15, radius: 20, color: '#00ffcc', trail: [], life: 0, bounces: 0, owner: p.owner
                });
             }
          }
          
          if (hit) {
             const tx = Math.floor(p.x);
             if (p.type === 'dirtmover') {
                p.vx *= 0.8; p.vy *= 0.8;
                this.destroyTerrain(p.x, p.y, 10);
                if (Math.hypot(p.vx, p.vy) < 2) detonate = true;
             } else if (p.type === 'cluster' && p.bounces === 0) {
                p.vy *= -0.5; p.y -= 5; p.bounces++;
                this.projectiles.push({
                   x: p.x, y: p.y, vx: (Math.random()-0.5)*2, vy: -3,
                   type: 'standard', damage: 15, radius: 25, color: '#ff00ff', trail: [], life: 0, bounces: 0, owner: p.owner
                });
             } else if (p.type === 'roller') {
                p.vx *= 0.95;
                p.vy = 0;
                if (tx >= 0 && tx < this.canvas.width) p.y = this.terrain[tx] - 5;
                p.bounces++;
                if (Math.abs(p.vx) < 0.5) detonate = true;
             } else if (p.type === 'bouncer') {
                p.vy *= -0.8; p.y -= 2;
                p.bounces++;
                if (p.bounces > 5) detonate = true;
             } else if (p.type === 'volcanic') {
                detonate = true;
                for (let j=0; j<8; j++) {
                   this.projectiles.push({
                      x: p.x, y: p.y - 10,
                      vx: (Math.random()-0.5)*8, vy: -Math.random()*8 - 2,
                      type: 'standard', damage: 5, radius: 15, color: '#ff5500', trail: [], life: 0, bounces: 0, owner: p.owner
                   });
                }
             } else {
                detonate = true;
             }
          }
          
          if (p.type === 'drill' && hit) {
             p.vy = 2; p.vx = 0;
             p.life += 10;
             this.destroyTerrain(p.x, p.y, 8);
             if (p.life > 150) detonate = true; else { hit = false; detonate = false; }
          }
          
          if (detonate) {
             if (p.type === 'teleporter') {
                this.createExplosion(p.x, p.y, 20, '#00ffff', 0);
                let targetX = Math.max(10, Math.min(this.canvas.width - 10, p.x));
                if (p.owner === 'player') { this.player.x = targetX; this.player.y = p.y - 20; this.player.targetX = undefined; }
                else { this.ai.x = targetX; this.ai.y = p.y - 20; this.ai.targetX = undefined; }
             } else if (hit || p.type === 'dirtmover' || p.type === 'roller' || p.type === 'blackhole') {
                this.createExplosion(p.x, p.y, p.radius, p.color, p.damage);
             }
             this.projectiles.splice(i, 1);
          }
       }
       
       if (this.projectiles.length === 0) {
          if (this.player.hp <= 0 || this.ai.hp <= 0) {
             this.state = "game_over";
             setTimeout(() => {
                this.callbacks.setGameState(this.player.hp > 0 ? "victory" : "failed");
             }, 2000);
          } else {
             if (this.state === "player_shoot") {
                this.state = "ai_turn";
                this.aiWaitTimer = 60;
                this.ai.mp = this.ai.maxMp;
             } else {
                this.state = "player_turn";
                this.player.mp = this.player.maxMp;
             }
             this.wind = (Math.random() - 0.5) * 0.08;
          }
       }
    }
    
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

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    const windVal = this.wind * 100;
    const windText = windVal < 0 ? `<< ${Math.abs(windVal).toFixed(1)}` : `${windVal.toFixed(1)} >>`;
    ctx.fillText(`WIND: ${windText}`, this.canvas.width/2, 30);
    
    // Match Timer
    if (this.state !== "menu") {
       const m = Math.floor(Math.matchTimer ? this.matchTimer : Math.max(0, this.matchTimer) / 3600);
       const s = Math.floor((Math.max(0, this.matchTimer) % 3600) / 60);
       ctx.fillStyle = this.matchTimer <= 60 * 60 ? "#ff0055" : "#00ffcc";
       ctx.font = "bold 24px 'Panchang', sans-serif";
       ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, this.canvas.width/2, 60);
    }
    
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

    const drawTank = (tank, label) => {
       ctx.save();
       ctx.translate(tank.x, tank.y);
       
       // Turret Barrel (thick, with muzzle)
       ctx.save();
       ctx.rotate(tank.angle);
       ctx.strokeStyle = tank.color;
       ctx.lineWidth = 6;
       ctx.lineCap = "round";
       ctx.beginPath();
       ctx.moveTo(0, -6);
       ctx.lineTo(45, -6); // Longer Barrel
       ctx.stroke();
       ctx.lineWidth = 10;
       ctx.beginPath(); ctx.moveTo(35, -6); ctx.lineTo(45, -6); ctx.stroke();
       ctx.restore();
       
       // Dome
       ctx.fillStyle = "#111";
       ctx.strokeStyle = tank.color;
       ctx.lineWidth = 2;
       ctx.shadowBlur = 10;
       ctx.shadowColor = tank.color;
       ctx.beginPath();
       ctx.arc(0, -6, 10, Math.PI, 0);
       ctx.closePath();
       ctx.fill(); ctx.stroke();
       
       // Chassis
       ctx.fillStyle = "#222";
       ctx.beginPath();
       ctx.moveTo(-16, -6);
       ctx.lineTo(16, -6);
       ctx.lineTo(24, 6);
       ctx.lineTo(-24, 6);
       ctx.closePath();
       ctx.fill(); ctx.stroke();
       
       // Treads
       ctx.fillStyle = "#050505";
       ctx.beginPath();
       ctx.roundRect(-26, 6, 52, 10, 4);
       ctx.fill(); ctx.stroke();
       
       // Wheels
       ctx.fillStyle = tank.color;
       ctx.shadowBlur = 0;
       for(let wx = -20; wx <= 20; wx+= 10) {
          ctx.beginPath(); ctx.arc(wx, 11, 3, 0, Math.PI*2); ctx.fill();
       }
       
       ctx.restore();
       
       // HP Bar
       ctx.fillStyle = "rgba(0,0,0,0.5)";
       ctx.fillRect(tank.x - 20, tank.y - 35, 40, 6);
       ctx.fillStyle = tank.color;
       ctx.fillRect(tank.x - 20, tank.y - 35, 40 * Math.max(0, tank.hp / tank.maxHp), 6);
       ctx.strokeStyle = "#fff";
       ctx.lineWidth = 1;
       ctx.strokeRect(tank.x - 20, tank.y - 35, 40, 6);
       
       ctx.fillStyle = "#fff";
       ctx.font = "9px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.fillText(label, tank.x, tank.y - 40);
    };
    
    drawTank(this.player, "YOU");
    drawTank(this.ai, "AI");

    if (this.state === "player_turn") {
       ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
       ctx.setLineDash([5, 5]);
       ctx.lineWidth = 2;
       ctx.beginPath();
       let ax = this.player.x + Math.cos(this.player.angle) * 45;
       let ay = this.player.y - 6 + Math.sin(this.player.angle) * 45;
       let vx = Math.cos(this.player.angle) * this.player.power;
       let vy = Math.sin(this.player.angle) * this.player.power;
       
       const invItem = this.player.inventory[this.player.selectedWeaponIdx];
       if (invItem.id === 'laser' || invItem.id === 'sniper') {
          vx = Math.cos(this.player.angle) * 50;
          vy = Math.sin(this.player.angle) * 50;
       } else if (invItem.id === 'boomerang') {
          // Can't easily predict boomerang, draw initial straight arc
       }

       ctx.moveTo(ax, ay);
       for(let i=0; i<15; i++) {
          if (invItem.id === 'laser' || invItem.id === 'sniper') {
             ax += vx; ay += vy;
          } else if (invItem.id === 'blackhole') {
             ax += vx; ay += vy; vx *= 0.98;
          } else if (invItem.id === 'boomerang') {
             vx -= Math.sign(vx) * 0.25; vy += this.gravity * 0.5; ax += vx; ay += vy;
          } else {
             ax += vx; vy += this.gravity; vx += this.wind; ay += vy;
          }
          ctx.lineTo(ax, ay);
       }
       ctx.stroke();
       ctx.setLineDash([]);
    }

    this.projectiles.forEach(p => {
       ctx.shadowBlur = 15;
       ctx.shadowColor = p.color;
       ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, p.type==='blackhole'?10:4, 0, Math.PI*2); ctx.fill();
       ctx.shadowBlur = 0;
       
       if (p.trail.length > 0) {
          ctx.beginPath();
          p.trail.forEach((t, i) => {
             if (i===0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
          });
          ctx.strokeStyle = `rgba(255,255,255,0.4)`;
          ctx.lineWidth = p.type==='blackhole'?4:2;
          ctx.stroke();
       }
    });

    this.particles.forEach(p => {
       ctx.globalAlpha = Math.max(0, p.life / 50);
       ctx.fillStyle = p.color;
       ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashAlpha -= 0.05;
    }
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    if (this.state === "player_turn") {
       ctx.fillText("YOUR TURN", this.canvas.width/2, 90);
       ctx.font = "12px sans-serif";
       ctx.fillText("Move, Aim, then Fire (Spacebar)", this.canvas.width/2, 110);
    } else if (this.state === "ai_turn") {
       ctx.fillText("AI IS AIMING...", this.canvas.width/2, 90);
    } else if (this.state === "game_over") {
       ctx.fillStyle = this.player.hp > 0 ? "#00ffcc" : "#ff0055";
       ctx.fillText(this.player.hp > 0 ? "VICTORY!" : "DEFEAT!", this.canvas.width/2, 90);
    }

    if (this.state === "player_turn" || this.state === "player_shoot") {
       const w = this.canvas.width;
       
       // Glassy UI background
       ctx.fillStyle = "rgba(5, 10, 20, 0.85)";
       ctx.strokeStyle = "#00ffcc";
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.rect(0, this.uiY, w, this.uiH);
       ctx.fill();
       ctx.stroke();
       
       const drawAnimBtn = (x, y, bw, bh, text, animKey, col, isDim) => {
          const s = this.clickAnims[animKey] * 2; // scale effect
          ctx.fillStyle = isDim ? "rgba(100,100,100,0.2)" : `rgba(0, 255, 204, ${0.1 + s*0.2})`;
          ctx.strokeStyle = isDim ? "#666" : col;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x + s, y + s, bw - s*2, bh - s*2, 5); ctx.fill(); ctx.stroke();
          ctx.fillStyle = isDim ? "#666" : col;
          ctx.font = "bold 14px 'Panchang', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x + bw/2, y + bh/2);
          ctx.textBaseline = "alphabetic"; // reset
       };
       
       const cY = this.uiY + 45; // Moved down
       
       // Jump Button
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`JUMPS: ${this.player.jumps}`, 262, this.uiY + 18);
       drawAnimBtn(120, this.uiY + 8, 285, 20, "JUMP", "jump", "#ff00ff", this.player.jumps <= 0);
       
       // Group 1: MOVE
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`MOVE (MP: ${Math.floor(this.player.mp)})`, 162, cY - 8);
       drawAnimBtn(120, cY, 40, 35, "<", "moveL", "#00ffcc", this.player.mp <= 0);
       drawAnimBtn(165, cY, 40, 35, ">", "moveR", "#00ffcc", this.player.mp <= 0);

       // Group 2: ANGLE
       let angDeg = Math.floor(Math.abs(this.player.angle * 180 / Math.PI));
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`ANG: ${angDeg}°`, 262, cY - 8);
       drawAnimBtn(220, cY, 40, 35, "-", "angD", "#ebd73f", false);
       drawAnimBtn(265, cY, 40, 35, "+", "angU", "#ebd73f", false);
       
       // Group 3: POWER
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`PWR: ${Math.floor((this.player.power/40)*100)}%`, 362, cY - 8);
       drawAnimBtn(320, cY, 40, 35, "-", "pwrD", "#ff3366", false);
       drawAnimBtn(365, cY, 40, 35, "+", "pwrU", "#ff3366", false);
       
       // Cover Flow Weapon Selector (Center)
       ctx.save();
       ctx.beginPath();
       ctx.rect(w/2 - 180, this.uiY + 5, 360, 80);
       ctx.clip();

       for (let i=0; i<this.player.inventory.length; i++) {
          let item = this.player.inventory[i];
          let typeData = this.weaponTypes[item.id];
          
          let ix = w/2 + (i * 120) + this.currentWeaponScroll;
          let dist = Math.abs(ix - w/2);
          
          let scale = Math.max(0.6, 1 - (dist / 300));
          let alpha = Math.max(0.2, 1 - (dist / 150));
          
          if (dist > 250) continue; // optimize render
          
          ctx.save();
          ctx.translate(ix, this.uiY + 45);
          ctx.scale(scale, scale);
          
          ctx.fillStyle = `rgba(0,0,0,${0.8 * alpha})`;
          ctx.beginPath(); ctx.roundRect(-55, -25, 110, 50, 12); ctx.fill();
          
          if (i === this.player.selectedWeaponIdx) {
             ctx.strokeStyle = typeData.color;
             ctx.lineWidth = 2;
             ctx.shadowBlur = 15;
             ctx.shadowColor = typeData.color;
             ctx.stroke();
             ctx.shadowBlur = 0;
          }
          
          ctx.fillStyle = typeData.color;
          ctx.globalAlpha = alpha;
          ctx.font = "bold 11px 'Panchang', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(typeData.name, 0, -2, 100);
          
          ctx.fillStyle = "#aaa";
          ctx.font = "10px sans-serif";
          ctx.fillText(`x${item.count > 50 ? '∞' : item.count}`, 0, 15);
          
          ctx.restore();
       }
       ctx.restore();
       
       // Fire button (Glowing Orb Right Side)
       const canFire = this.state === "player_turn" && this.player.inventory[this.player.selectedWeaponIdx].count > 0;
       const sF = this.clickAnims.fire * 5;
       const orbX = w - 70;
       const orbY = this.uiY + 45;
       
       ctx.shadowBlur = canFire ? 20 + Math.sin(this.frame * 0.1) * 10 : 0;
       ctx.shadowColor = "#ff0055";
       ctx.fillStyle = canFire ? "#ff0055" : "#333";
       ctx.beginPath(); ctx.arc(orbX, orbY, 35 - sF, 0, Math.PI*2); ctx.fill();
       ctx.shadowBlur = 0;
       
       ctx.fillStyle = "#fff";
       ctx.font = "bold 16px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.textBaseline = "middle";
       ctx.fillText("FIRE", orbX, orbY + 2);
       ctx.textBaseline = "alphabetic";
       
       // Instruction
       ctx.fillStyle = "rgba(255,255,255,0.4)";
       ctx.font = "10px sans-serif";
       ctx.fillText("CLICK TO FIRE", orbX, orbY - 45);
    }

    ctx.restore();
  }

  destroy() {
     window.removeEventListener('keydown', this.handleKeyDown);
     // Re-enable custom cursor when exiting game
     this.callbacks.setCursorActiveRef(true);
     this.canvas.style.cursor = 'none';
     const customCursor = document.querySelector(".cursor");
     if (customCursor) customCursor.style.opacity = '1';
  }
}
