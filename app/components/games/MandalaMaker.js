export default class MandalaMaker {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.lines = [];
    this.currentLine = null;
    this.symmetry = 8;
    this.hue = 0;
    this.isDrawing = false;
    this.state = "playing"; // Never fails
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    this.isDrawing = true;
    this.currentLine = {
      color: `hsl(${this.hue}, 100%, 60%)`,
      points: [{x: cx, y: cy}]
    };
    this.lines.push(this.currentLine);
    this.hue = (this.hue + 45) % 360;
  }

  handlePointerMove(e) {
    if (!this.isDrawing || !this.currentLine) return;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    this.currentLine.points.push({x: cx, y: cy});
  }

  handlePointerUp() {
    this.isDrawing = false;
    this.currentLine = null;
  }

  update() {
    // Fade lines over time slowly for a zen effect, or keep them?
    // Let's keep them and maybe add a slow rotation to the whole canvas in draw()
    this.frame = (this.frame || 0) + 1;
    
    // Auto-clear if there's too many lines to save performance
    if (this.lines.length > 50) {
      this.lines.shift();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.1)"; // Slight trail effect
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    // Slow rotation
    ctx.rotate(this.frame * 0.002);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    this.lines.forEach(line => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = line.color;
      
      for (let i = 0; i < this.symmetry; i++) {
        ctx.rotate((Math.PI * 2) / this.symmetry);
        
        ctx.beginPath();
        for (let j = 0; j < line.points.length; j++) {
          const pt = line.points[j];
          // Relocate point relative to center before drawing
          const rx = pt.x - centerX;
          const ry = pt.y - centerY;
          if (j === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  destroy() {}
}
