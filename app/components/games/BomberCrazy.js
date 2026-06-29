export default class BomberCrazy {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    this.cols = 15;
    this.rows = 11;
    this.cellSize = Math.floor(Math.min(canvas.width / this.cols, (canvas.height - 40) / this.rows));
    this.offsetX = (canvas.width - this.cols * this.cellSize) / 2;
    this.offsetY = (canvas.height - this.rows * this.cellSize) / 2;

    this.map = [];
    this.powerups = [];
    this.bombs = [];
    this.explosions = [];
    this.enemies = [];
    this.particles = [];
    
    this.keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

    this.player = {
      c: 0, r: 0,
      targetC: 0, targetR: 0,
      x: 0, y: 0,
      speed: 0.1,
      power: 2,
      maxBombs: 3,
      color: '#00ffff'
    };

    this.isDead = false;
    this.deathTimer = 0;

    this.shake = 0;
    this.initLevel();
  }

  initLevel() {
    // Generate map: 0 = empty, 1 = solid, 2 = soft block
    this.map = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (r % 2 !== 0 && c % 2 !== 0) {
          this.map[r][c] = 1; // Indestructible
        } else if (Math.random() < 0.6) {
          // Keep top-left corner clear
          if (!(r === 0 && c === 0) && !(r === 0 && c === 1) && !(r === 1 && c === 0)) {
            this.map[r][c] = 2; // Destructible
          }
        }
      }
    }

    this.player.c = 0;
    this.player.r = 0;
    this.player.targetC = 0;
    this.player.targetR = 0;
    this.player.x = this.offsetX + this.cellSize / 2;
    this.player.y = this.offsetY + this.cellSize / 2;

    this.enemies = [];
    // Spawn 3 enemies
    for (let i = 0; i < 3; i++) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    let c = Math.floor(Math.random() * this.cols);
    let r = Math.floor(Math.random() * this.rows);
    // Ensure it spawns in empty space and far from player
    while (this.map[r][c] !== 0 || (c < 3 && r < 3)) {
      c = Math.floor(Math.random() * this.cols);
      r = Math.floor(Math.random() * this.rows);
    }
    
    this.enemies.push({
      c, r,
      targetC: c, targetR: r,
      x: this.offsetX + c * this.cellSize + this.cellSize / 2,
      y: this.offsetY + r * this.cellSize + this.cellSize / 2,
      speed: 0.04 + Math.random() * 0.02,
      color: '#ff3366',
      dir: Math.floor(Math.random() * 4) // 0: up, 1: right, 2: down, 3: left
    });
  }

  handleKeyDown(e) {
    if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Enter') this.placeBomb();
  }

  handleKeyUp(e) {
    if (this.keys.hasOwnProperty(e.key)) this.keys[e.key] = false;
  }
  
  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = (e.clientX || e.touches[0].clientX) - rect.left;
    const py = (e.clientY || e.touches[0].clientY) - rect.top;
    
    // Virtual D-pad logic (simple: click to move relative to player, or just touch controls)
    if (py < this.player.y - 20) this.keys.w = true;
    else if (py > this.player.y + 20) this.keys.s = true;
    else if (px < this.player.x - 20) this.keys.a = true;
    else if (px > this.player.x + 20) this.keys.d = true;
    else this.placeBomb(); // click on self places bomb
  }

  handlePointerUp(e) {
    this.keys.w = false; this.keys.a = false; this.keys.s = false; this.keys.d = false;
  }

  handlePointerMove(e) {}

  placeBomb() {
    if (this.isDead) return;
    if (this.bombs.filter(b => b.owner === 'player').length < this.player.maxBombs) {
      // Check if bomb already on cell
      if (this.bombs.some(b => b.c === this.player.c && b.r === this.player.r)) return;
      
      this.bombs.push({
        c: this.player.c,
        r: this.player.r,
        timer: 120, // 2 seconds
        owner: 'player',
        power: this.player.power
      });
      this.callbacks.playSound('blip');
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 60; // 1 second at 60fps
    this.shake = 20;
    this.callbacks.playSound('hurt');
    
    for (let i = 0; i < 40; i++) {
       const a = Math.random() * Math.PI * 2;
       const s = Math.random() * 6;
       this.particles.push({
         x: this.player.x, y: this.player.y,
         vx: Math.cos(a) * s, vy: Math.sin(a) * s,
         life: 1.5, color: '#00ffff'
       });
    }
  }

  isWalkable(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    if (this.map[r][c] !== 0) return false;
    if (this.bombs.some(b => b.c === c && b.r === r)) return false;
    return true;
  }

  createExplosion(c, r, power) {
    this.shake = 10;
    this.callbacks.playSound('explosion');
    
    const addExplosion = (ec, er) => {
      this.explosions.push({ c: ec, r: er, life: 1 });
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 5;
        this.particles.push({
          x: this.offsetX + ec * this.cellSize + this.cellSize/2,
          y: this.offsetY + er * this.cellSize + this.cellSize/2,
          vx: Math.cos(a)*s, vy: Math.sin(a)*s,
          life: 1, color: '#ffcc00'
        });
      }
    };

    addExplosion(c, r);
    
    // 4 directions
    const dirs = [[0,-1], [1,0], [0,1], [-1,0]];
    dirs.forEach(d => {
      for (let i = 1; i <= power; i++) {
        let nc = c + d[0] * i;
        let nr = r + d[1] * i;
        if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) break;
        if (this.map[nr][nc] === 1) break; // Solid wall blocks blast
        
        if (this.map[nr][nc] === 2) {
          // Soft block destroyed, stops blast
          this.map[nr][nc] = 0;
          addExplosion(nc, nr);
          
          // Random powerup chance
          if (Math.random() < 0.5) {
            this.powerups.push({ c: nc, r: nr, type: ['power', 'bomb', 'speed'][Math.floor(Math.random()*3)] });
          }
          this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 10);
          break;
        }
        
        addExplosion(nc, nr);
        
        // Trigger other bombs in path
        this.bombs.forEach(b => {
           if (b.c === nc && b.r === nr && b.timer > 2) b.timer = 2;
        });
      }
    });
  }

  update() {
    if (this.shake > 0) this.shake--;

    if (this.isDead) {
       this.deathTimer--;
       if (this.deathTimer <= 0) {
          this.callbacks.setGameState("failed");
       }
       // Particles
       this.particles.forEach((p, i) => {
         p.x += p.vx; p.y += p.vy; p.life -= 0.05;
         if (p.life <= 0) this.particles.splice(i, 1);
       });
       return;
    }

    // Player movement
    if (this.player.c === this.player.targetC && this.player.r === this.player.targetR) {
       // At target, check keys
       if ((this.keys.w || this.keys.ArrowUp) && this.isWalkable(this.player.c, this.player.r - 1)) this.player.targetR--;
       else if ((this.keys.s || this.keys.ArrowDown) && this.isWalkable(this.player.c, this.player.r + 1)) this.player.targetR++;
       else if ((this.keys.a || this.keys.ArrowLeft) && this.isWalkable(this.player.c - 1, this.player.r)) this.player.targetC--;
       else if ((this.keys.d || this.keys.ArrowRight) && this.isWalkable(this.player.c + 1, this.player.r)) this.player.targetC++;
    } else {
       // Move towards target
       if (this.player.targetC > this.player.c) { this.player.c += this.player.speed; if (this.player.c >= this.player.targetC) this.player.c = this.player.targetC; }
       if (this.player.targetC < this.player.c) { this.player.c -= this.player.speed; if (this.player.c <= this.player.targetC) this.player.c = this.player.targetC; }
       if (this.player.targetR > this.player.r) { this.player.r += this.player.speed; if (this.player.r >= this.player.targetR) this.player.r = this.player.targetR; }
       if (this.player.targetR < this.player.r) { this.player.r -= this.player.speed; if (this.player.r <= this.player.targetR) this.player.r = this.player.targetR; }
    }
    this.player.x = this.offsetX + this.player.c * this.cellSize + this.cellSize / 2;
    this.player.y = this.offsetY + this.player.r * this.cellSize + this.cellSize / 2;

    // Powerup collision
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      // Close enough to center of cell
      if (Math.abs(this.player.c - p.c) < 0.5 && Math.abs(this.player.r - p.r) < 0.5) {
        if (p.type === 'power') this.player.power++;
        if (p.type === 'bomb') this.player.maxBombs++;
        if (p.type === 'speed') this.player.speed = Math.min(0.2, this.player.speed + 0.02);
        this.callbacks.playSound('coin');
        this.powerups.splice(i, 1);
        this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 50);
      }
    }

    // Bombs update
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer--;
      
      // Fuse particles
      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.offsetX + b.c * this.cellSize + this.cellSize/2 + (Math.random()-0.5)*10,
          y: this.offsetY + b.r * this.cellSize + this.cellSize/2 - 10,
          vx: (Math.random()-0.5)*1, vy: -1 - Math.random(),
          life: 1, color: '#ff9900'
        });
      }

      if (b.timer <= 0) {
        this.createExplosion(b.c, b.r, b.power);
        this.bombs.splice(i, 1);
      }
    }

    // Enemies movement
    this.enemies.forEach((e, i) => {
      if (e.c === e.targetC && e.r === e.targetR) {
        const dirs = [[0,-1], [1,0], [0,1], [-1,0]]; // UP, RIGHT, DOWN, LEFT
        
        // Try to keep moving in same dir, or turn randomly
        let validDirs = [];
        dirs.forEach((d, idx) => {
           if (this.isWalkable(e.c + d[0], e.r + d[1])) validDirs.push(idx);
        });

        if (validDirs.length > 0) {
           if (validDirs.includes(e.dir) && Math.random() < 0.7) {
              // keep going
           } else {
              e.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
           }
           e.targetC += dirs[e.dir][0];
           e.targetR += dirs[e.dir][1];
        }
      } else {
         if (e.targetC > e.c) { e.c += e.speed; if (e.c >= e.targetC) e.c = e.targetC; }
         if (e.targetC < e.c) { e.c -= e.speed; if (e.c <= e.targetC) e.c = e.targetC; }
         if (e.targetR > e.r) { e.r += e.speed; if (e.r >= e.targetR) e.r = e.targetR; }
         if (e.targetR < e.r) { e.r -= e.speed; if (e.r <= e.targetR) e.r = e.targetR; }
      }
      e.x = this.offsetX + e.c * this.cellSize + this.cellSize / 2;
      e.y = this.offsetY + e.r * this.cellSize + this.cellSize / 2;
      
      // Player collision
      const dist = Math.hypot(this.player.x - e.x, this.player.y - e.y);
      if (dist < this.cellSize * 0.7) {
        this.die();
      }
    });

    // Explosions logic
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.life -= 0.05;
      
      const exX = this.offsetX + ex.c * this.cellSize + this.cellSize/2;
      const exY = this.offsetY + ex.r * this.cellSize + this.cellSize/2;
      
      // Hit Player
      if (ex.life > 0.5) {
         if (Math.abs(this.player.x - exX) < this.cellSize/2 && Math.abs(this.player.y - exY) < this.cellSize/2) {
            this.die();
         }
         
         // Hit Enemy
         for (let j = this.enemies.length - 1; j >= 0; j--) {
            const e = this.enemies[j];
            if (Math.abs(e.x - exX) < this.cellSize/2 && Math.abs(e.y - exY) < this.cellSize/2) {
               
               // Enemy death explosion
               for(let k=0; k<15; k++){
                  const a = Math.random() * Math.PI * 2;
                  const s = Math.random() * 4;
                  this.particles.push({
                    x: e.x, y: e.y,
                    vx: Math.cos(a)*s, vy: Math.sin(a)*s,
                    life: 1, color: e.color
                  });
               }
               
               this.enemies.splice(j, 1);
               this.callbacks.playSound('hit');
               this.callbacks.setScoreRef(this.callbacks.getScoreRef() + 100);
               
               // Spawn new enemy to keep up pressure
               setTimeout(() => { 
                 if (this.enemies.length < 8) {
                   this.spawnEnemy(); 
                   if(Math.random() < 0.5) this.spawnEnemy(); // Sometimes spawn two!
                 }
               }, 1000);
            }
         }
      }

      if (ex.life <= 0) this.explosions.splice(i, 1);
    }

    // Particles
    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    
    // Background
    ctx.fillStyle = "rgba(5, 10, 15, 0.4)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Map
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;
        const s = this.cellSize;
        
        ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
        ctx.strokeRect(x, y, s, s);

        if (this.map[r][c] === 1) {
           // Solid
           ctx.fillStyle = "#112233";
           ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
           ctx.strokeStyle = "#00ffff";
           ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        } else if (this.map[r][c] === 2) {
           // Soft
           ctx.fillStyle = "#331122";
           ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
           ctx.strokeStyle = "#ff0055";
           ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        }
      }
    }

    // Powerups
    const time = Date.now() / 150;
    this.powerups.forEach(p => {
       const x = this.offsetX + p.c * this.cellSize + this.cellSize/2;
       // Floating animation
       const y = this.offsetY + p.r * this.cellSize + this.cellSize/2 + Math.sin(time + p.c + p.r) * 3;
       
       ctx.save();
       ctx.translate(x, y);
       
       ctx.fillStyle = p.type === 'power' ? '#ff3366' : p.type === 'bomb' ? '#00ffff' : '#ffcc00';
       ctx.shadowBlur = 15; ctx.shadowColor = ctx.fillStyle;
       
       // Draw hexagonal container
       ctx.beginPath();
       for(let i=0; i<6; i++) {
         ctx.lineTo(Math.cos(i * Math.PI/3) * (this.cellSize/3), Math.sin(i * Math.PI/3) * (this.cellSize/3));
       }
       ctx.closePath();
       ctx.fill();
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 1.5;
       ctx.stroke();
       ctx.shadowBlur = 0;
       
       // Draw inner icon
       ctx.fillStyle = '#111';
       ctx.font = 'bold 12px sans-serif';
       ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
       const icon = p.type === 'power' ? '🔥' : p.type === 'bomb' ? '💣' : '⚡';
       ctx.fillText(icon, 0, 1);
       
       ctx.restore();
    });

    // Bombs
    this.bombs.forEach(b => {
       const x = this.offsetX + b.c * this.cellSize + this.cellSize/2;
       const y = this.offsetY + b.r * this.cellSize + this.cellSize/2;
       const scale = 1 + Math.sin(b.timer * 0.2) * 0.1;
       ctx.fillStyle = '#222';
       ctx.beginPath(); ctx.arc(x, y, (this.cellSize/2.5) * scale, 0, Math.PI*2); ctx.fill();
       ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.stroke();
       
       // Pulse
       ctx.fillStyle = `rgba(0, 255, 255, ${Math.abs(Math.sin(b.timer * 0.1))})`;
       ctx.beginPath(); ctx.arc(x, y, (this.cellSize/3) * scale, 0, Math.PI*2); ctx.fill();
    });

    // Explosions
    this.explosions.forEach(ex => {
       const x = this.offsetX + ex.c * this.cellSize;
       const y = this.offsetY + ex.r * this.cellSize;
       ctx.fillStyle = `rgba(255, 200, 0, ${ex.life})`;
       ctx.fillRect(x, y, this.cellSize, this.cellSize);
       ctx.fillStyle = `rgba(255, 50, 0, ${ex.life})`;
       ctx.fillRect(x + 5, y + 5, this.cellSize - 10, this.cellSize - 10);
    });

    // Enemies
    this.enemies.forEach(e => {
       ctx.fillStyle = e.color;
       ctx.shadowBlur = 15; ctx.shadowColor = e.color;
       ctx.beginPath(); ctx.arc(e.x, e.y, this.cellSize/2.5, 0, Math.PI*2); ctx.fill();
       ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
       ctx.beginPath(); ctx.arc(e.x - 4, e.y - 4, 3, 0, Math.PI*2); ctx.fill();
       ctx.beginPath(); ctx.arc(e.x + 4, e.y - 4, 3, 0, Math.PI*2); ctx.fill();
    });

    // Player
    if (!this.isDead) {
       ctx.save();
       ctx.translate(this.player.x, this.player.y);
       
       // Hover effect
       const pTime = Date.now() / 150;
       ctx.translate(0, Math.sin(pTime) * 2);

       // Jetpack exhaust
       if (this.keys.w || this.keys.ArrowUp || this.keys.s || this.keys.ArrowDown || this.keys.a || this.keys.ArrowLeft || this.keys.d || this.keys.ArrowRight) {
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(0, this.cellSize/2.5, 4 + Math.random()*2, 0, Math.PI*2);
          ctx.fill();
       }

       // Helmet
       ctx.fillStyle = '#222';
       ctx.beginPath(); 
       ctx.arc(0, 0, this.cellSize/2.5, 0, Math.PI*2); 
       ctx.fill();
       
       // Helmet glowing trim
       ctx.strokeStyle = this.player.color;
       ctx.lineWidth = 2;
       ctx.shadowBlur = 10; ctx.shadowColor = this.player.color;
       ctx.stroke();
       ctx.shadowBlur = 0;

       // Visor screen
       ctx.fillStyle = '#111';
       ctx.beginPath();
       ctx.roundRect(-8, -6, 16, 10, 3);
       ctx.fill();
       
       // Looking dir based on key
       let lx = 0, ly = 0;
       if (this.keys.w || this.keys.ArrowUp) ly = -2;
       else if (this.keys.s || this.keys.ArrowDown) ly = 2;
       if (this.keys.a || this.keys.ArrowLeft) lx = -2;
       else if (this.keys.d || this.keys.ArrowRight) lx = 2;
       
       // Cyber eyes
       ctx.fillStyle = '#00ffcc';
       ctx.shadowBlur = 5; ctx.shadowColor = '#00ffcc';
       ctx.fillRect(-5 + lx, -3 + ly, 4, 4);
       ctx.fillRect(1 + lx, -3 + ly, 4, 4);
       ctx.shadowBlur = 0;

       ctx.restore();
    }

    // Particles
    this.particles.forEach(p => {
       ctx.fillStyle = p.color;
       ctx.globalAlpha = p.life;
       ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
       ctx.globalAlpha = 1;
    });

    ctx.restore();
  }

  destroy() {}
}
