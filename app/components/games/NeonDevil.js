export default class NeonDevil {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    this.keys = { left: false, right: false, up: false, down: false };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mobile controls state
    this.touches = [];

    this.currentLevelIdx = 0;
    this.deaths = 0;
    this.shake = 0;
    this.particles = [];
    this.glitchTimer = 0;

    // Tile configuration
    this.cols = 24;
    this.rows = 14;
    this.tileSize = Math.min(this.canvas.width / this.cols, this.canvas.height / this.rows);
    this.offsetX = (this.canvas.width - (this.cols * this.tileSize)) / 2;
    this.offsetY = (this.canvas.height - (this.rows * this.tileSize)) / 2;

    this.generateLevels();
    this.loadLevel(this.currentLevelIdx);
  }

  generateLevels() {
    // Basic floor string
    const floor = "########################";
    const empty = "........................";
    
    this.LEVELS = [
      // Level 1: Simple disappearing floor
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          "#######.#######..#######",
          empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 2}, actions: [{type: 'hide', x: 15, y: 11}, {type: 'hide', x: 16, y: 11}] }
        ]
      },
      // Level 2: Falling spike from ceiling
      {
        grid: [
          empty, empty, empty, empty, empty,
          "..........v.............",
          empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 4}, actions: [{type: 'move', x: 10, y: 5, dx: 0, dy: 5, speed: 0.5}] }
        ]
      },
      // Level 3: Goal runs away
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.....................G.",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 18, w: 3}, actions: [{type: 'move', x: 22, y: 10, dx: -18, dy: -6, speed: 0.2}] }
        ]
      },
      // Level 4: Fake wall
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty,
          "............#...........",
          "............#...........",
          "S...........#..........G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 2}, actions: [{type: 'hide', x: 12, y: 8}, {type: 'hide', x: 12, y: 9}, {type: 'hide', x: 12, y: 10}] }
        ]
      },
      // Level 5: Invisible spikes
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 2}, actions: [{type: 'showSpike', x: 14, y: 10, dir: '^'}] }
        ]
      },
      // Level 6: Controls invert
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 8}, actions: [{type: 'invertControls'}], continuous: true }
        ]
      },
      // Level 7: Gravity flip
      {
        grid: [
          empty, empty,
          ".......................G",
          "##########....##########",
          empty, empty, empty, empty, empty, empty,
          "S.......................",
          "##########....##########",
          empty, empty
        ],
        triggers: [
          { zone: {x: 7, w: 4}, actions: [{type: 'flipGravity'}], once: true }
        ]
      },
      // Level 8: Floor becomes spikes
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 12, w: 2}, actions: [
            {type: 'hide', x: 14, y: 11}, {type: 'showSpike', x: 14, y: 11, dir: '^'},
            {type: 'hide', x: 15, y: 11}, {type: 'showSpike', x: 15, y: 11, dir: '^'}
          ]}
        ]
      },
      // Level 9: Fake goal
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......G..............G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 6, w: 2}, actions: [{type: 'hide', x: 8, y: 10}, {type: 'showSpike', x: 8, y: 10, dir: '^'}] }
        ]
      },
      // Level 10: Jump ceiling smash
      {
        grid: [
          empty, empty, empty, empty, empty, empty,
          "...............######...",
          empty, empty, empty,
          "S.......####...........G",
          "#######......###########",
          empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 4}, actions: [{type: 'move', x: 15, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 16, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 17, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 18, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 19, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 20, y: 6, dx: 0, dy: 3, speed: 0.5}] }
        ]
      },
      // Level 11: Floor falls away
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 3, w: 15}, actions: [{type: 'hideAllFloor', from: 4, to: 20}] }
        ]
      },
      // Level 12: Moving spikes on floor
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S..........^...........G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 5}, actions: [{type: 'move', x: 11, y: 10, dx: -5, dy: 0, speed: 0.3}] }
        ]
      },
      // Level 13: Goal is behind start
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "G.S....................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 20, w: 2}, actions: [{type: 'hide', x: 23, y: 10}, {type: 'showSpike', x: 23, y: 10, dir: '^'}] }
        ]
      },
      // Level 14: Trampoline trap
      {
        grid: [
          empty, empty, empty, empty,
          "............vvv.........",
          empty, empty, empty, empty, empty,
          "S...........###........G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 5}, actions: [{type: 'bounce', strength: -15}] }
        ]
      },
      // Level 15: Darkness (Render handles this if level === 14)
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......^........^.....G",
          floor, empty, empty
        ],
        triggers: [],
        darkness: true
      },
      // Level 16: Wall chasing you
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S#.....................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 3, w: 20}, actions: [{type: 'move', x: 1, y: 10, dx: 22, dy: 0, speed: 0.15}] }
        ]
      },
      // Level 17: Jump disabled
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 10}, actions: [{type: 'disableJump'}], continuous: true }
        ]
      },
      // Level 18: Fake death message
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 2}, actions: [{type: 'fakeDeath'}], once: true }
        ]
      },
      // Level 19: Infinite loop until walk backwards
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          floor, empty, empty
        ],
        triggers: [
          { zone: {x: 20, w: 2}, actions: [{type: 'teleport', tx: 2, ty: 10}] }, // Reaching end loops you
          { zone: {x: 0, w: 1}, actions: [{type: 'teleport', tx: 21, ty: 10}] } // Walking backward sends you to goal
        ]
      },
      // Level 20: The Gauntlet
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "..................v.....",
          "S.......#...............",
          "###..####..##..###.....G",
          empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 2}, actions: [{type: 'hide', x: 5, y: 11}, {type: 'hide', x: 6, y: 11}] },
          { zone: {x: 10, w: 2}, actions: [{type: 'move', x: 18, y: 9, dx: -6, dy: 0, speed: 0.3}] },
          { zone: {x: 14, w: 2}, actions: [{type: 'flipGravity'}], once: true }
        ]
      }
    ];
  }

  loadLevel(idx) {
    if (idx >= this.LEVELS.length) {
      this.callbacks.setGameState("level-complete");
      return;
    }
    const levelData = this.LEVELS[idx];
    this.tiles = [];
    this.triggers = JSON.parse(JSON.stringify(levelData.triggers || []));
    this.darkness = levelData.darkness || false;
    this.gravity = 0.5;
    this.invertedControls = false;
    this.jumpDisabled = false;
    this.fakeDeath = false;
    
    this.player = {
      x: 0, y: 0, vx: 0, vy: 0,
      width: this.tileSize * 0.6,
      height: this.tileSize * 0.8,
      speed: 4,
      jumpPower: -10,
      grounded: false,
      color: '#00ffff'
    };

    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const char = levelData.grid[r] && levelData.grid[r][c] ? levelData.grid[r][c] : '.';
        let tile = { char, type: 'empty', solid: false, x: c * this.tileSize, y: r * this.tileSize, dx: 0, dy: 0, targetX: null, targetY: null, moveSpeed: 0 };
        
        if (char === '#') { tile.type = 'block'; tile.solid = true; }
        else if (char === 'G') { tile.type = 'goal'; }
        else if (char === 'S') {
          tile.type = 'empty';
          this.player.x = c * this.tileSize + (this.tileSize - this.player.width) / 2;
          this.player.y = r * this.tileSize + this.tileSize - this.player.height;
        }
        else if (['^', 'v', '<', '>'].includes(char)) {
          tile.type = 'spike';
          tile.dir = char;
        }
        
        this.tiles[r][c] = tile;
      }
    }
    
    this.callbacks.setScoreRef(idx + 1);
    this.callbacks.setScore(idx + 1);
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.keys.up = true;
    if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = true;
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') this.keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
  }

  handlePointerDown(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.touches.push({ id: e.changedTouches[i].identifier, x: e.changedTouches[i].clientX, y: e.changedTouches[i].clientY });
    }
    if (!e.changedTouches) {
      this.touches.push({ id: 'mouse', x: e.clientX, y: e.clientY });
    }
    this.updateMobileControls();
  }

  handlePointerMove(e) {
    e.preventDefault();
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = this.touches.find(t => t.id === e.changedTouches[i].identifier);
        if (t) { t.x = e.changedTouches[i].clientX; t.y = e.changedTouches[i].clientY; }
      }
    } else {
      const t = this.touches.find(t => t.id === 'mouse');
      if (t) { t.x = e.clientX; t.y = e.clientY; }
    }
    this.updateMobileControls();
  }

  handlePointerUp(e) {
    e.preventDefault();
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.touches = this.touches.filter(t => t.id !== e.changedTouches[i].identifier);
      }
    } else {
      this.touches = this.touches.filter(t => t.id !== 'mouse');
    }
    this.updateMobileControls();
  }

  updateMobileControls() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    
    this.touches.forEach(t => {
      if (t.x < this.canvas.width / 3) this.keys.left = true;
      else if (t.x > (this.canvas.width / 3) * 2) this.keys.right = true;
      else this.keys.up = true;
    });
  }

  die() {
    this.deaths++;
    this.shake = 20;
    this.glitchTimer = 30;
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.player.x + this.player.width/2,
        y: this.player.y + this.player.height/2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: '#ff0000'
      });
    }
    setTimeout(() => {
      this.loadLevel(this.currentLevelIdx);
    }, 500);
  }

  winLevel() {
    this.callbacks.triggerGsapMilestone(this.player.x, this.player.y);
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.player.x + this.player.width/2,
        y: this.player.y + this.player.height/2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        color: '#00ffcc'
      });
    }
    this.currentLevelIdx++;
    this.loadLevel(this.currentLevelIdx);
  }

  executeAction(action) {
    if (action.type === 'hide') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
        this.tiles[action.y][action.x].type = 'empty';
        this.tiles[action.y][action.x].solid = false;
        this.createGlitch(action.x, action.y);
      }
    }
    else if (action.type === 'hideAllFloor') {
      for (let c = action.from; c <= action.to; c++) {
        if (this.tiles[11] && this.tiles[11][c]) {
           this.tiles[11][c].type = 'empty';
           this.tiles[11][c].solid = false;
        }
      }
    }
    else if (action.type === 'showSpike') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
        this.tiles[action.y][action.x].type = 'spike';
        this.tiles[action.y][action.x].dir = action.dir;
        this.createGlitch(action.x, action.y);
      }
    }
    else if (action.type === 'move') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
        const tile = this.tiles[action.y][action.x];
        tile.targetX = tile.x + (action.dx * this.tileSize);
        tile.targetY = tile.y + (action.dy * this.tileSize);
        tile.moveSpeed = action.speed * this.tileSize;
      }
    }
    else if (action.type === 'invertControls') {
      this.invertedControls = true;
    }
    else if (action.type === 'flipGravity') {
      this.gravity = -0.5;
      this.player.jumpPower = 10;
    }
    else if (action.type === 'bounce') {
      this.player.vy = action.strength;
    }
    else if (action.type === 'disableJump') {
      this.jumpDisabled = true;
    }
    else if (action.type === 'fakeDeath') {
      this.fakeDeath = true;
    }
    else if (action.type === 'teleport') {
      this.player.x = action.tx * this.tileSize;
      this.player.y = action.ty * this.tileSize;
    }
  }

  createGlitch(tx, ty) {
    this.glitchTimer = 10;
    this.shake = 5;
  }

  getAABBCollision(px, py, pw, ph, tx, ty, tw, th) {
    return px < tx + tw && px + pw > tx && py < ty + th && py + ph > ty;
  }

  update() {
    if (this.shake > 0) this.shake--;
    if (this.glitchTimer > 0) this.glitchTimer--;

    // Process Triggers
    const pCol = Math.floor(this.player.x / this.tileSize);
    const pRow = Math.floor(this.player.y / this.tileSize);
    
    // Reset continuous states
    this.invertedControls = false;
    this.jumpDisabled = false;

    this.triggers.forEach(tr => {
      if (tr.done) return;
      const z = tr.zone;
      const h = z.h || this.rows;
      const y = z.y || 0;
      
      if (pCol >= z.x && pCol < z.x + z.w && pRow >= y && pRow < y + h) {
        tr.actions.forEach(a => this.executeAction(a));
        if (!tr.continuous) {
          tr.done = true;
        }
      }
    });

    // Player Physics
    let left = this.keys.left;
    let right = this.keys.right;
    
    if (this.invertedControls) {
      let temp = left;
      left = right;
      right = temp;
      this.player.color = '#ff00ff';
    } else {
      this.player.color = '#00ffff';
    }

    if (left) this.player.vx -= 1;
    if (right) this.player.vx += 1;
    
    this.player.vx *= 0.8; // friction
    
    if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    
    this.player.vy += this.gravity;

    // Cap fall speed
    if (this.player.vy > 12) this.player.vy = 12;
    if (this.player.vy < -12) this.player.vy = -12;

    if (this.keys.up && this.player.grounded && !this.jumpDisabled) {
      this.player.vy = this.player.jumpPower;
      this.player.grounded = false;
    }

    // Moving tiles update
    let movingTiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        if (t.targetX !== null) {
          const dx = t.targetX - t.x;
          if (Math.abs(dx) > t.moveSpeed) t.x += Math.sign(dx) * t.moveSpeed;
          else t.x = t.targetX;
        }
        if (t.targetY !== null) {
          const dy = t.targetY - t.y;
          if (Math.abs(dy) > t.moveSpeed) t.y += Math.sign(dy) * t.moveSpeed;
          else t.y = t.targetY;
        }
        if (t.type !== 'empty') movingTiles.push(t);
      }
    }

    // X Collision
    this.player.x += this.player.vx;
    for (let t of movingTiles) {
      if (t.solid && this.getAABBCollision(this.player.x, this.player.y, this.player.width, this.player.height, t.x, t.y, this.tileSize, this.tileSize)) {
        if (this.player.vx > 0) this.player.x = t.x - this.player.width;
        else if (this.player.vx < 0) this.player.x = t.x + this.tileSize;
        this.player.vx = 0;
      }
    }

    // Y Collision
    this.player.y += this.player.vy;
    this.player.grounded = false;
    for (let t of movingTiles) {
      if (t.solid && this.getAABBCollision(this.player.x, this.player.y, this.player.width, this.player.height, t.x, t.y, this.tileSize, this.tileSize)) {
        if (this.player.vy > 0) {
          this.player.y = t.y - this.player.height;
          this.player.grounded = (this.gravity > 0);
        } else if (this.player.vy < 0) {
          this.player.y = t.y + this.tileSize;
          this.player.grounded = (this.gravity < 0);
        }
        this.player.vy = 0;
      }
      
      // Spikes & Goal Check
      if (this.getAABBCollision(this.player.x, this.player.y, this.player.width, this.player.height, t.x, t.y, this.tileSize, this.tileSize)) {
        if (t.type === 'spike') {
          // Shrink spike hitbox slightly to be fair
          const shrink = this.tileSize * 0.2;
          if (this.getAABBCollision(this.player.x, this.player.y, this.player.width, this.player.height, t.x + shrink, t.y + shrink, this.tileSize - shrink*2, this.tileSize - shrink*2)) {
            this.die();
          }
        }
        if (t.type === 'goal') {
          this.winLevel();
        }
      }
    }

    // Boundaries
    if (this.player.y > this.rows * this.tileSize + 100 || this.player.y < -100) {
      this.die();
    }

    // Particles
    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  draw() {
    const ctx = this.ctx;
    
    ctx.save();
    
    // Scale and center the grid to fit the canvas perfectly
    const scaleX = this.canvas.width / (this.cols * this.tileSize);
    const scaleY = this.canvas.height / (this.rows * this.tileSize);
    const scale = Math.min(scaleX, scaleY);
    
    // Center it
    const tx = (this.canvas.width - (this.cols * this.tileSize * scale)) / 2;
    const ty = (this.canvas.height - (this.rows * this.tileSize * scale)) / 2;
    
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);

    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    }
    
    // Background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

    // Glitch effect
    if (this.glitchTimer > 0) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 0, 100, 0.2)' : 'rgba(0, 255, 255, 0.2)';
      ctx.fillRect(0, Math.random() * (this.rows * this.tileSize), this.cols * this.tileSize, 20);
    }

    // Darkness effect
    if (this.darkness) {
      const grad = ctx.createRadialGradient(
        this.player.x + this.player.width/2, this.player.y + this.player.height/2, 0,
        this.player.x + this.player.width/2, this.player.y + this.player.height/2, this.tileSize * 3
      );
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);
    }

    // Draw tiles
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tiles[r][c];
        
        if (t.type === 'block') {
          ctx.fillStyle = '#111';
          ctx.fillRect(t.x, t.y, this.tileSize, this.tileSize);
          ctx.strokeStyle = '#bd00ff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#bd00ff';
          ctx.strokeRect(t.x + 2, t.y + 2, this.tileSize - 4, this.tileSize - 4);
          ctx.shadowBlur = 0;
        }
        else if (t.type === 'goal') {
          ctx.fillStyle = '#00ffcc';
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00ffcc';
          ctx.fillRect(t.x + 4, t.y + 4, this.tileSize - 8, this.tileSize - 8);
          ctx.shadowBlur = 0;
        }
        else if (t.type === 'spike') {
          ctx.fillStyle = '#ff0055';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff0055';
          ctx.beginPath();
          if (t.dir === '^') {
            ctx.moveTo(t.x, t.y + this.tileSize);
            ctx.lineTo(t.x + this.tileSize/2, t.y);
            ctx.lineTo(t.x + this.tileSize, t.y + this.tileSize);
          } else if (t.dir === 'v') {
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.x + this.tileSize/2, t.y + this.tileSize);
            ctx.lineTo(t.x + this.tileSize, t.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw player
    ctx.fillStyle = this.player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.player.color;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    ctx.shadowBlur = 0;

    // Draw particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (this.fakeDeath) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);
      ctx.fillStyle = '#ff0055';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText("YOU DIED", (this.cols * this.tileSize) / 2, (this.rows * this.tileSize) / 2);
    }

    ctx.restore();

    // Draw on-screen mobile controls if touch device
    if (window.innerWidth <= 768) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      
      // Left Zone
      ctx.fillRect(0, this.canvas.height - 100, this.canvas.width / 3, 100);
      ctx.strokeRect(0, this.canvas.height - 100, this.canvas.width / 3, 100);
      
      // Center (Jump) Zone
      ctx.fillRect(this.canvas.width / 3, this.canvas.height - 100, this.canvas.width / 3, 100);
      ctx.strokeRect(this.canvas.width / 3, this.canvas.height - 100, this.canvas.width / 3, 100);
      
      // Right Zone
      ctx.fillRect((this.canvas.width / 3) * 2, this.canvas.height - 100, this.canvas.width / 3, 100);
      ctx.strokeRect((this.canvas.width / 3) * 2, this.canvas.height - 100, this.canvas.width / 3, 100);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("<", this.canvas.width / 6, this.canvas.height - 40);
      ctx.fillText("JUMP", this.canvas.width / 2, this.canvas.height - 40);
      ctx.fillText(">", (this.canvas.width / 6) * 5, this.canvas.height - 40);
    }

    // Death counter UI
    ctx.fillStyle = '#ff0055';
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DEATHS: ${this.deaths}`, 20, 40);
    ctx.fillStyle = '#00ffcc';
    ctx.fillText(`LEVEL: ${this.currentLevelIdx + 1}/20`, 20, 70);
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
