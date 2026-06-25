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
    this.maps = [
       { id: 'neon', name: 'NEON CITY', stroke: '#00ffcc', gradStart: 'rgba(0, 255, 200, 0.15)', gradEnd: 'rgba(0, 50, 100, 0.4)', bg: 'rgba(5, 10, 15, 0.8)', frequency1: 0.004, amp1: 100, frequency2: 0.015, amp2: 40 },
       { id: 'desert', name: 'CYBER DESERT', stroke: '#ffaa00', gradStart: 'rgba(255, 170, 0, 0.15)', gradEnd: 'rgba(100, 30, 0, 0.4)', bg: 'rgba(20, 10, 5, 0.8)', frequency1: 0.002, amp1: 60, frequency2: 0.03, amp2: 20 },
       { id: 'ice', name: 'ICE MOON', stroke: '#00ffff', gradStart: 'rgba(0, 255, 255, 0.15)', gradEnd: 'rgba(0, 50, 150, 0.4)', bg: 'rgba(5, 15, 25, 0.8)', frequency1: 0.008, amp1: 120, frequency2: 0.01, amp2: 50 },
       { id: 'toxic', name: 'TOXIC WASTELAND', stroke: '#33ff33', gradStart: 'rgba(50, 255, 50, 0.15)', gradEnd: 'rgba(0, 80, 0, 0.4)', bg: 'rgba(10, 15, 10, 0.8)', frequency1: 0.006, amp1: 80, frequency2: 0.02, amp2: 60 }
    ];
    this.selectedMapIdx = 0;
    
    this.player = {
       x: 100, y: 0, r: 12, hp: 100, maxHp: 100, color: "#00ffff", 
       angle: -Math.PI/4, power: 15, mp: 50, maxMp: 50,
       inventory: this.generateInventory(),
       selectedWeaponIdx: 0,
       dir: 1,
       jumps: 4,
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
       jumps: 4,
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
    
    this.clickAnims = { moveL: 0, moveR: 0, angU: 0, angD: 0, pwrU: 0, pwrD: 0, fire: 0, jumpL: 0, jumpR: 0 };
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
    const map = this.maps[this.selectedMapIdx] || this.maps[0];
    
    for (let x = 0; x < this.canvas.width; x++) {
       let h = Math.sin(x * map.frequency1 + noise1) * map.amp1 + Math.sin(x * map.frequency2 + noise2) * map.amp2;
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
  
  jumpTank(tank, dir) {
     if (tank.jumps > 0 && tank.vy === undefined) {
         tank.vy = -4.5;
         tank.targetX = tank.x + (dir * 80);
         tank.jumps--;
     }
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    if (this.state === "game_over") {
       const w = this.canvas.width;
       const rW = 160, rH = 45;
       const rX = w/2 - rW/2;
       const rY = 100;
       const mY = 160;
       
       if (cx > rX && cx < rX + rW && cy > rY && cy < rY + rH) {
          this.restart();
          return;
       }
       if (cx > rX && cx < rX + rW && cy > mY && cy < mY + rH) {
          this.state = "menu";
          return;
       }
    }

    if (this.state === "menu") {
       const w = this.canvas.width;
       const h = this.canvas.height;
       const btnW = 160; const btnH = 50; const gap = 30;
       const totalW = btnW * 3 + gap * 2;
       const startX = w/2 - totalW/2;
       const y = h/2 + 20;
       
       if (cy > y && cy < y + btnH) {
          if (cx > startX && cx < startX + btnW) { this.difficulty = "beginner"; this.state = "map_select"; }
          else if (cx > startX + btnW + gap && cx < startX + btnW * 2 + gap) { this.difficulty = "intermediate"; this.state = "map_select"; }
          else if (cx > startX + (btnW + gap)*2 && cx < startX + btnW * 3 + gap * 2) { this.difficulty = "hard"; this.state = "map_select"; }
       }
       return;
    }

    if (this.state === "map_select") {
       const w = this.canvas.width;
       const h = this.canvas.height;
       
       const cW = 180, cH = 220;
       const gapX = 30;
       const totalW = (cW * 4) + (gapX * 3);
       const startX = w/2 - totalW/2;
       const cY = h/2 - 60;
       
       for (let i = 0; i < this.maps.length; i++) {
          const cX = startX + i * (cW + gapX);
          if (cx > cX && cx < cX + cW && cy > cY && cy < cY + cH) {
             this.selectedMapIdx = i;
             this.startMatch();
             return;
          }
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

  restart() {
     this.projectiles = [];
     this.particles = [];
     this.terrain = [];
     this.generateTerrain();
     this.player.hp = this.player.maxHp;
     this.player.inventory = this.generateInventory();
     this.player.jumps = 4;
     this.player.mp = this.player.maxMp;
     this.player.power = 15;
     this.player.angle = -Math.PI/4;
     this.ai.hp = this.ai.maxHp;
     this.ai.inventory = this.generateInventory();
     this.ai.jumps = 4;
     this.ai.mp = this.ai.maxMp;
     this.ai.power = 15;
     this.ai.angle = -Math.PI*0.75;
     this.placeTanks();
     this.startMatch();
  }

  handleUIClick(cx, cy) {
     const w = this.canvas.width;
     const cY = this.uiY + 50;
     
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
     // Jump Buttons
     else if (cx > 420 && cx < 460 && cy > cY && cy < cY + 35) {
        this.jumpTank(this.player, -1);
        this.clickAnims.jumpL = 1;
     }
     else if (cx > 465 && cx < 505 && cy > cY && cy < cY + 35) {
        this.jumpTank(this.player, 1);
        this.clickAnims.jumpR = 1;
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
     const dy = cy - (this.uiY + 60);
     if (Math.hypot(dx, dy) < 40) {
        this.executeFire(this.player);
        this.clickAnims.fire = 1;
     }
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    this.mouseX = cx;
    this.mouseY = cy;
    
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
          else tank.y += (ty - tank.r - tank.y) * 0.3;
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
             if (this.state !== "game_over") {
                this.state = "game_over";
                const deadTank = this.player.hp <= 0 ? this.player : this.ai;
                this.createExplosion(deadTank.x, deadTank.y, 60, '#ff5500', 0);
             }
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
    
    const map = this.maps[this.selectedMapIdx] || this.maps[0];
    ctx.fillStyle = map.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.state === "menu" || this.state === "map_select") {
       const w = this.canvas.width;
       const h = this.canvas.height;
       
       ctx.fillStyle = "#ffffff";
       ctx.font = "bold 48px 'Panchang', sans-serif";
       ctx.textAlign = "center";
       ctx.shadowBlur = 20; ctx.shadowColor = "#00ffcc";
       ctx.fillText("NEON TANKS", w/2, h/2 - 120);
       ctx.shadowBlur = 0;
       
       if (this.state === "menu") {
           ctx.font = "bold 16px 'Panchang', sans-serif";
           ctx.fillStyle = "#00ffcc";
           ctx.fillText("SELECT DIFFICULTY", w/2, h/2 - 50);
           
           const btnW = 160; const btnH = 50; const gap = 30;
           const totalW = btnW * 3 + gap * 2;
           const startX = w/2 - totalW/2;
           const y = h/2 + 20;
           
           const drawBtn = (idx, text, color) => {
              const x = startX + idx * (btnW + gap);
              const hover = this.mouseX > x && this.mouseX < x + btnW && this.mouseY > y && this.mouseY < y + btnH;
              
              ctx.strokeStyle = color;
              ctx.lineWidth = hover ? 3 : 2;
              ctx.fillStyle = hover ? `rgba(255,255,255,0.15)` : `rgba(0,0,0,0.6)`;
              if (hover) { ctx.shadowBlur = 15; ctx.shadowColor = color; }
              ctx.beginPath(); ctx.roundRect(x, y, btnW, btnH, 12);
              ctx.fill(); ctx.stroke();
              ctx.shadowBlur = 0;
              
              ctx.fillStyle = hover ? "#fff" : color;
              ctx.font = "bold 16px 'Panchang', sans-serif";
              ctx.textBaseline = "middle";
              ctx.fillText(text, x + btnW/2, y + btnH/2);
              ctx.textBaseline = "alphabetic";
           };
           
           drawBtn(0, "BEGINNER", "#00ffcc");
           drawBtn(1, "NORMAL", "#ffcc00");
           drawBtn(2, "HARD", "#ff0055");
       } else if (this.state === "map_select") {
           ctx.font = "bold 16px 'Panchang', sans-serif";
           ctx.fillStyle = "#ffaa00";
           ctx.fillText("SELECT DEPLOYMENT ZONE", w/2, h/2 - 60);
           
           const cW = 180, cH = 220;
           const gapX = 30;
           const totalW = (cW * this.maps.length) + (gapX * (this.maps.length - 1));
           const startX = w/2 - totalW/2;
           const cY = h/2 - 20;
           
           for (let i = 0; i < this.maps.length; i++) {
              const map = this.maps[i];
              const cX = startX + i * (cW + gapX);
              const hover = this.mouseX > cX && this.mouseX < cX + cW && this.mouseY > cY && this.mouseY < cY + cH;
              
              if (hover && this.selectedMapIdx !== i) {
                  this.selectedMapIdx = i;
                  this.generateTerrain(); // Preview background!
              }
              
              ctx.strokeStyle = map.stroke;
              ctx.lineWidth = hover ? 4 : 2;
              ctx.fillStyle = hover ? `rgba(255,255,255,0.1)` : `rgba(0,0,0,0.7)`;
              if (hover) { ctx.shadowBlur = 25; ctx.shadowColor = map.stroke; }
              ctx.beginPath(); ctx.roundRect(cX, cY, cW, cH, 16);
              ctx.fill(); ctx.stroke();
              ctx.shadowBlur = 0;
              
              // Preview Box
              ctx.fillStyle = map.bg;
              ctx.beginPath(); ctx.roundRect(cX + 10, cY + 10, cW - 20, cH - 80, 8); ctx.fill();
              const grad = ctx.createLinearGradient(0, cY+10, 0, cY+cH-70);
              grad.addColorStop(0, map.gradStart); grad.addColorStop(1, map.gradEnd);
              ctx.fillStyle = grad;
              ctx.beginPath(); ctx.roundRect(cX + 10, cY + 10, cW - 20, cH - 80, 8); ctx.fill();
              
              ctx.fillStyle = "#fff";
              ctx.font = "bold 14px 'Panchang', sans-serif";
              ctx.textBaseline = "middle";
              ctx.fillText(map.name, cX + cW/2, cY + cH - 30);
              ctx.textBaseline = "alphabetic";
           }
       }
       
       ctx.restore();
       return;
    }

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    const windVal = this.wind * 100;
    const windText = windVal < 0 ? `<< ${Math.abs(windVal).toFixed(1)}` : `${windVal.toFixed(1)} >>`;
    ctx.fillText(`WIND: ${windText}`, this.canvas.width/2, 30);
    
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height);
    for (let x = 0; x < this.canvas.width; x++) {
       ctx.lineTo(x, this.terrain[x]);
    }
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, this.canvas.height/2, 0, this.canvas.height);
    grad.addColorStop(0, map.gradStart);
    grad.addColorStop(1, map.gradEnd);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = map.stroke;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffcc";
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawTank = (tank, label) => {
       if (tank.hp <= 0 && this.state === "game_over") return;
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
    
    drawTank(this.player, "HUMAN");
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
       ctx.fillText("HUMAN TURN", this.canvas.width/2, 60);
       ctx.font = "12px sans-serif";
       ctx.fillText("Move, Aim, then Fire (Spacebar)", this.canvas.width/2, 85);
    } else if (this.state === "ai_turn") {
       ctx.fillText("AI IS AIMING...", this.canvas.width/2, 60);
    } else if (this.state === "game_over") {
       ctx.fillStyle = this.player.hp > 0 ? "#00ffcc" : "#ff0055";
       ctx.fillText(this.player.hp > 0 ? "VICTORY!" : "DEFEAT!", this.canvas.width/2, 60);
       
       const w = this.canvas.width;
       const rW = 160, rH = 45;
       const rX = w/2 - rW/2;
       const rY = 100;
       
       const hoverR = this.mouseX > rX && this.mouseX < rX + rW && this.mouseY > rY && this.mouseY < rY + rH;
       ctx.fillStyle = hoverR ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)";
       ctx.strokeStyle = hoverR ? "#fff" : "rgba(255,255,255,0.5)";
       ctx.beginPath(); ctx.roundRect(rX, rY, rW, rH, 25); ctx.fill(); ctx.stroke();
       ctx.fillStyle = "#fff";
       ctx.font = "bold 14px 'Panchang', sans-serif";
       ctx.textBaseline = "middle";
       ctx.fillText("REPLAY", w/2, rY + rH/2 + 2);
       
       const mY = 160;
       const hoverM = this.mouseX > rX && this.mouseX < rX + rW && this.mouseY > mY && this.mouseY < mY + rH;
       ctx.fillStyle = hoverM ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)";
       ctx.strokeStyle = hoverM ? "#fff" : "rgba(255,255,255,0.5)";
       ctx.beginPath(); ctx.roundRect(rX, mY, rW, rH, 25); ctx.fill(); ctx.stroke();
       ctx.fillStyle = "#fff";
       ctx.fillText("MAIN MENU", w/2, mY + rH/2 + 2);
       
       ctx.textBaseline = "alphabetic";
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
          
          let fillCol = `rgba(0, 255, 204, ${0.1 + s*0.2})`;
          if (col === "#ff3366") fillCol = `rgba(255, 51, 102, ${0.1 + s*0.2})`;
          
          ctx.fillStyle = isDim ? "rgba(100,100,100,0.2)" : fillCol;
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
       
       const cY = this.uiY + 40; // Moved down
       const btnColor = "#00ffcc";
       
       // Group 1: MOVE
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`MOVE (MP: ${Math.floor(this.player.mp)})`, 162, cY - 10);
       drawAnimBtn(120, cY, 40, 35, "<", "moveL", btnColor, this.player.mp <= 0);
       drawAnimBtn(165, cY, 40, 35, ">", "moveR", btnColor, this.player.mp <= 0);

       // Group 2: ANGLE
       let angDeg = Math.floor(Math.abs(this.player.angle * 180 / Math.PI));
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`ANG: ${angDeg}°`, 262, cY - 10);
       drawAnimBtn(220, cY, 40, 35, "-", "angD", btnColor, false);
       drawAnimBtn(265, cY, 40, 35, "+", "angU", btnColor, false);
       
       // Group 3: POWER
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`PWR: ${Math.floor((this.player.power/40)*100)}%`, 362, cY - 10);
       drawAnimBtn(320, cY, 40, 35, "-", "pwrD", btnColor, false);
       drawAnimBtn(365, cY, 40, 35, "+", "pwrU", btnColor, false);
       
       // Jump Buttons
       ctx.fillStyle = "#fff"; ctx.font = "10px 'Panchang', sans-serif"; ctx.textAlign = "center";
       ctx.fillText(`JUMP: ${this.player.jumps}`, 462, cY - 10);
       drawAnimBtn(420, cY, 40, 35, "↖", "jumpL", "#ff3366", this.player.jumps <= 0);
       drawAnimBtn(465, cY, 40, 35, "↗", "jumpR", "#ff3366", this.player.jumps <= 0);
       
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
       const orbY = this.uiY + 60;
       
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
