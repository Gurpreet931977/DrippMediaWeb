export default class HarmonicLooper {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.dots = [];
    this.ripples = [];
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    this.colors = ["#ff3366", "#33ccff", "#ebd73f", "#33ff33", "#b366ff"];
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    // Spawn a dot that moves in a random cardinal direction
    const angle = Math.floor(Math.random() * 4) * (Math.PI / 2);
    this.dots.push({
       x: cx, y: cy,
       vx: Math.cos(angle) * 3,
       vy: Math.sin(angle) * 3,
       color: this.colors[Math.floor(Math.random() * this.colors.length)]
    });
    
    this.ripples.push({x: cx, y: cy, r: 0, color: "#ffffff", alpha: 1});
  }

  handlePointerMove(e) {}
  handlePointerUp() {}

  update() {
    // Update dots
    this.dots.forEach(d => {
       d.x += d.vx;
       d.y += d.vy;
       
       let hit = false;
       if (d.x < 0) { d.x = 0; d.vx *= -1; hit = true; }
       if (d.x > this.canvas.width) { d.x = this.canvas.width; d.vx *= -1; hit = true; }
       if (d.y < 0) { d.y = 0; d.vy *= -1; hit = true; }
       if (d.y > this.canvas.height) { d.y = this.canvas.height; d.vy *= -1; hit = true; }
       
       if (hit) {
          this.ripples.push({x: d.x, y: d.y, r: 0, color: d.color, alpha: 1});
          // In a real app we'd play a synth note here
       }
    });

    // Update ripples
    this.ripples.forEach(r => {
       r.r += 2;
       r.alpha -= 0.02;
    });
    this.ripples = this.ripples.filter(r => r.alpha > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(10,5,15,0.3)"; // Trail effect
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ripples
    this.ripples.forEach(r => {
       ctx.strokeStyle = r.color;
       ctx.globalAlpha = r.alpha;
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
       ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Draw dots
    this.dots.forEach(d => {
       ctx.fillStyle = d.color;
       ctx.shadowBlur = 10;
       ctx.shadowColor = d.color;
       ctx.beginPath();
       ctx.arc(d.x, d.y, 4, 0, Math.PI*2);
       ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  destroy() {}
}
