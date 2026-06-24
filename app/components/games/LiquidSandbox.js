export default class LiquidSandbox {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d', { alpha: false });
    
    // High Res mode
    this.scale = 2; // RESTORED TO HIGH RES
    this.cols = Math.floor(canvas.width / this.scale);
    this.rows = Math.floor(canvas.height / this.scale);
    
    this.glowCanvas = document.createElement('canvas');
    this.glowCanvas.width = canvas.width;
    this.glowCanvas.height = canvas.height;
    this.glowCtx = this.glowCanvas.getContext('2d', { alpha: true });
    
    this.grid = new Uint8Array(this.cols * this.rows);
    this.nextGrid = new Uint8Array(this.cols * this.rows);
    
    // Elements: 0=Empty, 1=Sand, 2=Water, 3=Wall, 4=Cloud, 5=Grass, 6=Wood, 7=Fire, 8=Lava, 9=Steam, 10=Stone
    this.colors = [
      "#000000", // 0: Empty (Black background)
      "#ebd73f", // 1: Sand (Yellow)
      "#00d2ff", // 2: Water (Cyan)
      "#b366ff", // 3: Wall (Purple)
      "#e0f7fa", // 4: Cloud (White/Cyan)
      "#39ff14", // 5: Grass (Neon Green)
      "#8b5a2b", // 6: Wood (Brown)
      "#ff5722", // 7: Fire (Orange)
      "#ff0000", // 8: Lava (Red)
      "#cccccc", // 9: Steam (Light Grey)
      "#555555"  // 10: Stone (Dark Grey)
    ];
    
    this.currentElement = 1; 
    this.isDrawing = false;
    this.pointerX = -1;
    this.pointerY = -1;
    this.frame = 0;
    this.autoSwitch = false; 
    
    window.sandboxModule = this;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");
  }

  getIndex(x, y) {
    return x + y * this.cols;
  }

  handlePointerDown(e) {
    this.isDrawing = true;
    this.updatePointer(e);
  }

  handlePointerMove(e) {
    this.updatePointer(e);
  }

  handlePointerUp() {
    this.isDrawing = false;
  }

  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    this.pointerX = Math.floor(cx / this.scale);
    this.pointerY = Math.floor(cy / this.scale);
  }

  update() {
    this.frame++;

    if (this.isDrawing && this.pointerX >= 0 && this.pointerX < this.cols && this.pointerY >= 0 && this.pointerY < this.rows) {
      const brushSize = 8;
      for (let i = -brushSize; i <= brushSize; i++) {
        for (let j = -brushSize; j <= brushSize; j++) {
          if (i*i + j*j > brushSize*brushSize) continue;
          
          const isSolid = this.currentElement === 3 || this.currentElement === 6 || this.currentElement === 10;
          if (!isSolid && Math.random() > 0.3) continue; 
          
          const col = this.pointerX + i;
          const row = this.pointerY + j;
          if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[this.getIndex(col, row)] = this.currentElement;
          }
        }
      }
    }

    this.nextGrid.set(this.grid);

    for (let y = this.rows - 1; y >= 0; y--) {
      const dir = Math.random() > 0.5 ? 1 : -1;
      const startX = dir === 1 ? 0 : this.cols - 1;
      const endX = dir === 1 ? this.cols : -1;
      
      for (let x = startX; x !== endX; x += dir) {
        const i = this.getIndex(x, y);
        const state = this.grid[i];
        
        if (state === 0 || state === 3 || state === 6 || state === 10) {
           if (state === 10) { // Stone falls heavily
             const below = y < this.rows - 1 ? this.getIndex(x, y + 1) : -1;
             if (below !== -1 && (this.grid[below] === 0 || this.grid[below] === 2 || this.grid[below] === 8 || this.grid[below] === 9)) {
                 this.nextGrid[below] = 10;
                 this.nextGrid[i] = this.grid[below];
             }
           }
           continue; 
        }

        const below = y < this.rows - 1 ? this.getIndex(x, y + 1) : -1;
        const above = y > 0 ? this.getIndex(x, y - 1) : -1;
        const left = x > 0 ? this.getIndex(x - 1, y) : -1;
        const right = x < this.cols - 1 ? this.getIndex(x + 1, y) : -1;
        const belowLeft = (y < this.rows - 1 && x > 0) ? this.getIndex(x - 1, y + 1) : -1;
        const belowRight = (y < this.rows - 1 && x < this.cols - 1) ? this.getIndex(x + 1, y + 1) : -1;
        const aboveLeft = (y > 0 && x > 0) ? this.getIndex(x - 1, y - 1) : -1;
        const aboveRight = (y > 0 && x < this.cols - 1) ? this.getIndex(x + 1, y - 1) : -1;

        if (state === 1) { // SAND
          if (below !== -1 && (this.grid[below] === 0 || this.grid[below] === 2 || this.grid[below] === 9)) {
            this.nextGrid[below] = 1; this.nextGrid[i] = this.grid[below];
          } else {
            if (dir === 1) {
              if (belowLeft !== -1 && (this.grid[belowLeft] === 0 || this.grid[belowLeft] === 2) && this.nextGrid[belowLeft] === this.grid[belowLeft]) {
                this.nextGrid[belowLeft] = 1; this.nextGrid[i] = this.grid[belowLeft];
              } else if (belowRight !== -1 && (this.grid[belowRight] === 0 || this.grid[belowRight] === 2) && this.nextGrid[belowRight] === this.grid[belowRight]) {
                this.nextGrid[belowRight] = 1; this.nextGrid[i] = this.grid[belowRight];
              }
            } else {
              if (belowRight !== -1 && (this.grid[belowRight] === 0 || this.grid[belowRight] === 2) && this.nextGrid[belowRight] === this.grid[belowRight]) {
                this.nextGrid[belowRight] = 1; this.nextGrid[i] = this.grid[belowRight];
              } else if (belowLeft !== -1 && (this.grid[belowLeft] === 0 || this.grid[belowLeft] === 2) && this.nextGrid[belowLeft] === this.grid[belowLeft]) {
                this.nextGrid[belowLeft] = 1; this.nextGrid[i] = this.grid[belowLeft];
              }
            }
          }
        }
        else if (state === 2) { // WATER
          if (below !== -1 && (this.grid[below] === 0 || this.grid[below] === 9)) {
             this.nextGrid[below] = 2; this.nextGrid[i] = this.grid[below];
          } else {
             if (dir === 1) {
               if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) { this.nextGrid[left] = 2; this.nextGrid[i] = 0; }
               else if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) { this.nextGrid[right] = 2; this.nextGrid[i] = 0; }
             } else {
               if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) { this.nextGrid[right] = 2; this.nextGrid[i] = 0; }
               else if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) { this.nextGrid[left] = 2; this.nextGrid[i] = 0; }
             }
          }
        }
        else if (state === 8) { // LAVA
          const neighbors = [below, above, left, right];
          let turnedToStone = false;
          for(let n of neighbors) {
            if (n === -1) continue;
            if (this.grid[n] === 2) {
              this.nextGrid[i] = 10; 
              this.nextGrid[n] = 9;  
              turnedToStone = true;
              break;
            }
            if (this.grid[n] === 5 || this.grid[n] === 6) {
              if (Math.random() < 0.1) this.nextGrid[n] = 7;
            }
          }
          if (turnedToStone) continue;

          if (below !== -1 && (this.grid[below] === 0 || this.grid[below] === 9 || this.grid[below] === 7)) {
             this.nextGrid[below] = 8; this.nextGrid[i] = this.grid[below];
          } else if (Math.random() < 0.5) {
             if (dir === 1) {
               if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) { this.nextGrid[left] = 8; this.nextGrid[i] = 0; }
               else if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) { this.nextGrid[right] = 8; this.nextGrid[i] = 0; }
             } else {
               if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) { this.nextGrid[right] = 8; this.nextGrid[i] = 0; }
               else if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) { this.nextGrid[left] = 8; this.nextGrid[i] = 0; }
             }
          }
        }
        else if (state === 7) { // FIRE
          const neighbors = [above, left, right, below, aboveLeft, aboveRight];
          for(let n of neighbors) {
            if (n === -1) continue;
            if (this.grid[n] === 2) {
               this.nextGrid[i] = 0; 
               this.nextGrid[n] = 9;
            } else if (this.grid[n] === 5 || this.grid[n] === 6) {
               if (Math.random() < 0.05) this.nextGrid[n] = 7;
            }
          }

          if (Math.random() < 0.2) {
             this.nextGrid[i] = 0;
          } else if (above !== -1 && (this.grid[above] === 0 || this.grid[above] === 9)) {
             this.nextGrid[above] = 7; this.nextGrid[i] = 0;
          } else if (Math.random() < 0.5) {
             const upLeft = dir === 1 ? aboveLeft : aboveRight;
             const upRight = dir === 1 ? aboveRight : aboveLeft;
             if (upLeft !== -1 && this.grid[upLeft] === 0) { this.nextGrid[upLeft] = 7; this.nextGrid[i] = 0; }
             else if (upRight !== -1 && this.grid[upRight] === 0) { this.nextGrid[upRight] = 7; this.nextGrid[i] = 0; }
          }
        }
        else if (state === 9) { // STEAM
           if (Math.random() < 0.05) { this.nextGrid[i] = 0; continue; }
           
           if (above !== -1 && this.grid[above] === 0) {
              this.nextGrid[above] = 9; this.nextGrid[i] = 0;
           } else {
             const sLeft = dir === 1 ? left : right;
             const sRight = dir === 1 ? right : left;
             if (sLeft !== -1 && this.grid[sLeft] === 0) { this.nextGrid[sLeft] = 9; this.nextGrid[i] = 0; }
             else if (sRight !== -1 && this.grid[sRight] === 0) { this.nextGrid[sRight] = 9; this.nextGrid[i] = 0; }
           }
        }
        else if (state === 4) { // CLOUD
          if (Math.random() < 0.001) {
             this.nextGrid[i] = 2;
             continue;
          }
          if (above !== -1 && this.grid[above] === 0 && this.nextGrid[above] === 0) {
             this.nextGrid[above] = 4; this.nextGrid[i] = 0;
          } else {
             const sLeft = dir === 1 ? left : right;
             const sRight = dir === 1 ? right : left;
             if (sLeft !== -1 && this.grid[sLeft] === 0 && this.nextGrid[sLeft] === 0) { this.nextGrid[sLeft] = 4; this.nextGrid[i] = 0; }
             else if (sRight !== -1 && this.grid[sRight] === 0 && this.nextGrid[sRight] === 0) { this.nextGrid[sRight] = 4; this.nextGrid[i] = 0; }
          }
        }
        else if (state === 5) { // GRASS
           if (Math.random() < 0.01) {
             if (above !== -1 && this.grid[above] === 0 && this.nextGrid[above] === 0) {
                let depth = 0;
                for(let dy=y; dy<this.rows; dy++) {
                  if (this.grid[this.getIndex(x, dy)] === 5) depth++;
                  else break;
                }
                if (depth < 6) this.nextGrid[above] = 5;
             }
           }
        }
      }
    }

    let temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;
    
    if (this.autoSwitch && this.frame % 300 === 0) {
      this.currentElement++;
      if (this.currentElement > 10) this.currentElement = 1;
    }
  }

  draw() {
    const ctx = this.ctx;
    const gCtx = this.glowCtx;
    
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(5,5,10,1)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear offscreen glow cache
    gCtx.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);

    for (let i = 0; i < this.grid.length; i++) {
      const state = this.grid[i];
      if (state > 0) {
        const x = i % this.cols;
        const y = Math.floor(i / this.cols);
        
        if (state === 7 || state === 8) { 
           // Draw fire/lava flat onto the glow cache
           gCtx.fillStyle = this.colors[state];
           gCtx.fillRect(x * this.scale, y * this.scale, this.scale + 0.5, this.scale + 0.5);
        } else {
           // Draw regular elements
           ctx.fillStyle = this.colors[state];
           ctx.fillRect(x * this.scale, y * this.scale, this.scale + 0.5, this.scale + 0.5);
        }
      }
    }
    
    // Apply hardware-accelerated global bloom (1 calculation instead of 10,000)
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(8px) brightness(1.2)";
    ctx.drawImage(this.glowCanvas, 0, 0); // The glowing aura
    ctx.filter = "none";
    ctx.drawImage(this.glowCanvas, 0, 0); // The crisp hot core
    
    ctx.globalCompositeOperation = "source-over";
  }

  destroy() {}
}
