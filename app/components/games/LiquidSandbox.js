export default class LiquidSandbox {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    // Scale down resolution for cellular automata performance (High Res mode)
    this.scale = 4;
    this.cols = Math.floor(canvas.width / this.scale);
    this.rows = Math.floor(canvas.height / this.scale);
    
    this.grid = new Array(this.cols * this.rows).fill(0);
    this.nextGrid = new Array(this.cols * this.rows).fill(0);
    
    // Elements: 0=Empty, 1=Sand, 2=Water, 3=Wall, 4=Cloud, 5=Grass
    this.colors = [
      "transparent",
      "#ebd73f", // Sand
      "#00d2ff", // Water
      "#b366ff", // Wall
      "#e0f7fa", // Cloud
      "#39ff14"  // Grass
    ];
    
    this.currentElement = 1; // Start with Sand
    this.isDrawing = false;
    this.pointerX = -1;
    this.pointerY = -1;
    this.frame = 0;
    this.autoSwitch = true;
    
    // Expose for React UI
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

  // Swap elements by clicking near the top of the screen or just randomly cycle for now
  // For a real game we'd want a UI, but let's just cycle elements every time they lift and press
  updatePointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    this.pointerX = Math.floor(cx / this.scale);
    this.pointerY = Math.floor(cy / this.scale);
  }

  update() {
    this.frame++;

    // Draw brush
    if (this.isDrawing && this.pointerX >= 0 && this.pointerX < this.cols && this.pointerY >= 0 && this.pointerY < this.rows) {
      const brushSize = 5;
      for (let i = -brushSize; i <= brushSize; i++) {
        for (let j = -brushSize; j <= brushSize; j++) {
          if (i*i + j*j > brushSize*brushSize) continue; // Circular brush
          if (this.currentElement !== 3 && Math.random() > 0.4) continue; // Spray effect for non-walls
          const col = this.pointerX + i;
          const row = this.pointerY + j;
          if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.grid[this.getIndex(col, row)] = this.currentElement;
          }
        }
      }
    }

    // Cellular Automata Physics
    // Copy current state to next state initially
    for (let i = 0; i < this.grid.length; i++) {
      this.nextGrid[i] = this.grid[i];
    }

    // Process from bottom to top to handle gravity correctly
    for (let y = this.rows - 2; y >= 0; y--) { // Skip bottom row
      // Randomize x iteration for natural falling
      const dir = Math.random() > 0.5 ? 1 : -1;
      const startX = dir === 1 ? 0 : this.cols - 1;
      const endX = dir === 1 ? this.cols : -1;
      
      for (let x = startX; x !== endX; x += dir) {
        const i = this.getIndex(x, y);
        const state = this.grid[i];
        
        if (state === 0 || state === 3) continue; // Empty or Wall

        const below = this.getIndex(x, y + 1);
        const belowState = this.grid[below];

        // SAND PHYSICS
        if (state === 1) {
          if (belowState === 0 || belowState === 2) {
             // Fall straight down (swap with water/empty)
             this.nextGrid[below] = 1;
             this.nextGrid[i] = belowState;
          } else {
             // Fall diagonally
             const left = x > 0 ? this.getIndex(x - 1, y + 1) : -1;
             const right = x < this.cols - 1 ? this.getIndex(x + 1, y + 1) : -1;
             
             let moved = false;
             if (dir === 1) {
               if (left !== -1 && (this.grid[left] === 0 || this.grid[left] === 2) && this.nextGrid[left] === this.grid[left]) {
                 this.nextGrid[left] = 1; this.nextGrid[i] = this.grid[left]; moved = true;
               } else if (right !== -1 && (this.grid[right] === 0 || this.grid[right] === 2) && this.nextGrid[right] === this.grid[right]) {
                 this.nextGrid[right] = 1; this.nextGrid[i] = this.grid[right]; moved = true;
               }
             } else {
               if (right !== -1 && (this.grid[right] === 0 || this.grid[right] === 2) && this.nextGrid[right] === this.grid[right]) {
                 this.nextGrid[right] = 1; this.nextGrid[i] = this.grid[right]; moved = true;
               } else if (left !== -1 && (this.grid[left] === 0 || this.grid[left] === 2) && this.nextGrid[left] === this.grid[left]) {
                 this.nextGrid[left] = 1; this.nextGrid[i] = this.grid[left]; moved = true;
               }
             }
          }
        }
        
        // WATER PHYSICS
        else if (state === 2) {
          if (belowState === 0) {
             this.nextGrid[below] = 2;
             this.nextGrid[i] = 0;
          } else {
             // Spread horizontally
             const left = x > 0 ? this.getIndex(x - 1, y) : -1;
             const right = x < this.cols - 1 ? this.getIndex(x + 1, y) : -1;
             
             let moved = false;
             if (dir === 1) {
               if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) {
                 this.nextGrid[left] = 2; this.nextGrid[i] = 0; moved = true;
               } else if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) {
                 this.nextGrid[right] = 2; this.nextGrid[i] = 0; moved = true;
               }
             } else {
               if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) {
                 this.nextGrid[right] = 2; this.nextGrid[i] = 0; moved = true;
               } else if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) {
                 this.nextGrid[left] = 2; this.nextGrid[i] = 0; moved = true;
               }
             }
          }
        }
        
        // CLOUD PHYSICS
        else if (state === 4) {
          if (Math.random() < 0.002) {
             // Condense into water rain
             this.nextGrid[i] = 2;
             continue;
          }
          const above = y > 0 ? this.getIndex(x, y - 1) : -1;
          if (above !== -1) {
            const aboveState = this.grid[above];
            if (aboveState === 0 && this.nextGrid[above] === 0) {
               this.nextGrid[above] = 4;
               this.nextGrid[i] = 0;
            } else {
               // Spread horizontally
               const left = x > 0 ? this.getIndex(x - 1, y) : -1;
               const right = x < this.cols - 1 ? this.getIndex(x + 1, y) : -1;
               if (dir === 1) {
                 if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) {
                   this.nextGrid[left] = 4; this.nextGrid[i] = 0;
                 } else if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) {
                   this.nextGrid[right] = 4; this.nextGrid[i] = 0;
                 }
               } else {
                 if (right !== -1 && this.grid[right] === 0 && this.nextGrid[right] === 0) {
                   this.nextGrid[right] = 4; this.nextGrid[i] = 0;
                 } else if (left !== -1 && this.grid[left] === 0 && this.nextGrid[left] === 0) {
                   this.nextGrid[left] = 4; this.nextGrid[i] = 0;
                 }
               }
            }
          }
        }
        
        // GRASS PHYSICS
        else if (state === 5) {
           if (Math.random() < 0.02) {
             const above = y > 0 ? this.getIndex(x, y - 1) : -1;
             if (above !== -1 && this.grid[above] === 0 && this.nextGrid[above] === 0) {
                let depth = 0;
                for(let dy=y; dy<this.rows; dy++) {
                  if (this.grid[this.getIndex(x, dy)] === 5) depth++;
                  else break;
                }
                // Grow grass up to 5 blocks high
                if (depth < 5) { 
                  this.nextGrid[above] = 5;
                }
             }
           }
        }
      }
    }

    // Swap buffers
    let temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;
    
    // Auto-switch mode
    if (this.autoSwitch) {
      if (this.frame % 300 === 0) {
        this.currentElement++;
        if (this.currentElement > 5) this.currentElement = 1;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(5,5,10,1)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const state = this.grid[this.getIndex(x, y)];
        if (state > 0) {
          ctx.fillStyle = this.colors[state];
          // Use slightly larger fillRect for overlap smoothing without extreme performance hit
          ctx.fillRect(x * this.scale, y * this.scale, this.scale + 0.5, this.scale + 0.5);
        }
      }
    }
  }

  destroy() {}
}
