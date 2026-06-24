export default class NodeWeaver {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.nodes = [];
    this.connections = [];
    this.draggingNode = null;
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    // Spawn initial nodes
    for(let i=0; i<30; i++) {
       this.nodes.push({
          x: 50 + Math.random() * (this.canvas.width - 100),
          y: 50 + Math.random() * (this.canvas.height - 100),
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          id: i
       });
    }
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || e.touches[0].clientX) - rect.left;
    const cy = (e.clientY || e.touches[0].clientY) - rect.top;
    
    let closest = null;
    let minDist = 30;
    
    this.nodes.forEach(n => {
       const d = Math.hypot(n.x - cx, n.y - cy);
       if (d < minDist) {
          minDist = d;
          closest = n;
       }
    });
    
    if (closest) {
       this.draggingNode = closest;
    }
  }

  handlePointerMove(e) {
    if (this.draggingNode) {
       const rect = this.canvas.getBoundingClientRect();
       this.draggingNode.x = (e.clientX || e.touches[0].clientX) - rect.left;
       this.draggingNode.y = (e.clientY || e.touches[0].clientY) - rect.top;
    }
  }

  handlePointerUp() {
    this.draggingNode = null;
  }

  update() {
    // Distance based auto connections
    this.connections = [];
    
    for (let i = 0; i < this.nodes.length; i++) {
       const n1 = this.nodes[i];
       
       if (n1 !== this.draggingNode) {
          n1.x += n1.vx;
          n1.y += n1.vy;
          
          if (n1.x < 0 || n1.x > this.canvas.width) n1.vx *= -1;
          if (n1.y < 0 || n1.y > this.canvas.height) n1.vy *= -1;
       }
       
       for (let j = i + 1; j < this.nodes.length; j++) {
          const n2 = this.nodes[j];
          const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          
          if (dist < 150) {
             this.connections.push({ n1, n2, dist });
          }
       }
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(5,10,15,1)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections
    this.connections.forEach(c => {
       const alpha = 1 - (c.dist / 150);
       ctx.strokeStyle = `rgba(0, 210, 255, ${alpha * 0.5})`;
       ctx.lineWidth = 1;
       ctx.beginPath();
       ctx.moveTo(c.n1.x, c.n1.y);
       ctx.lineTo(c.n2.x, c.n2.y);
       ctx.stroke();
    });

    // Draw nodes
    this.nodes.forEach(n => {
       ctx.fillStyle = n === this.draggingNode ? "#ffffff" : "#00d2ff";
       ctx.shadowBlur = n === this.draggingNode ? 15 : 5;
       ctx.shadowColor = "#00d2ff";
       ctx.beginPath();
       ctx.arc(n.x, n.y, n === this.draggingNode ? 6 : 3, 0, Math.PI*2);
       ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  destroy() {}
}
