const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

// 1. Revert Drop constructor
const oldDropConstructor = `  // ── Dripp Drop Element ───────────────────────────────────────────────────────
  function Drop(isRed) {
    this.x = Math.random() * canvas.width;
    this.y = -50 - Math.random() * 100;
    this.isWhite = !isRed && Math.random() < 0.05;
    this.isBomb = Math.random() < 0.15;
    this.isRed = !this.isBomb && !!isRed;
    const sc = getScoreRef();
    const sp = isMobile
      ? 1 + Math.log10(1 + sc / 300) * 0.4
      : 1.5 + Math.log10(1 + sc / 150) * 0.6;
    const mm = isMobile ? 0.9 : 1.0;
    this.vy = rnd(1.0, 4.5) * sp * mm;
    this.gravity = rnd(0.005, 0.025) * sp * mm;
    this.radius = rnd(2, 4);
    this.length = this.vy * 3;
    this.markedForDeletion = false;
    this.color = this.isBomb ? "#333" : this.isWhite ? "#fff" : (this.isRed ? "rgba(235,63,63,.9)" : "rgba(235,215,63,.9)");
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = rnd(0.02, 0.06) * (1 + sc * 0.005);
  }`;

const newDropConstructor = `  // ── Dripp Drop Element ───────────────────────────────────────────────────────
  function Drop() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.vy = 3 + Math.random() * 4;
    this.radius = 5 + Math.random() * 5;
    this.isBomb = Math.random() < 0.1;
    this.markedForDeletion = false;
    this.color = this.isBomb ? "#ff0000" : "#ebd73f";
  }`;

content = content.replace(oldDropConstructor, newDropConstructor);

// 2. Revert Drop update
const oldDropUpdateStart = `  Drop.prototype.update = function () {`;
const oldDropUpdateEnd = `  };`; // Wait, need precise replace
// Let's just regex the whole update and draw

// Using regex to replace the rest of Drop prototype
const dropRegex = /Drop\.prototype\.update = function \(\) \{[\s\S]*?Drop\.prototype\.draw = function \(ctx\) \{[\s\S]*?\};\n/m;
const newDropLogic = `Drop.prototype.update = function () {
    this.y += this.vy;
    if (this.y > canvas.height) { this.markedForDeletion = true; return; }
    
    const mx = getMouseRef().x, my = getMouseRef().y;
    const dist = Math.hypot(mx - this.x, my - this.y);
    if (dist < 50) {
      this.markedForDeletion = true;
      if (this.isBomb) {
        setScoreRef(0);
        setScore(0);
      } else {
        setScoreRef(getScoreRef() + 1);
        setScore(getScoreRef());
      }
    }
  };
  Drop.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  };
`;

content = content.replace(dropRegex, newDropLogic);

// 3. Update the Dripp animate loop
// Currently it has drops.push(new Drop(Math.random() < 0.2));
// and fireworks, splashes etc.
const animLoopOld = `      // Dripp logic
      if (Math.random() < 0.05 + Math.min(getScoreRef() * 0.0005, 0.1)) {
        drops.push(new Drop(Math.random() < 0.2));
      }
      // Trail and Catcher Ring
      ctx.fillStyle = "rgba(5,5,5,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const mx = getMouseRef().x, my = getMouseRef().y;
      ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      [...drops, ...splashes, ...fireworks, ...shockwaves].forEach(o => o.update());
      [...drops, ...splashes, ...fireworks, ...shockwaves].forEach(o => o.draw(ctx));
      drops = drops.filter(o => !o.markedForDeletion);
      splashes = splashes.filter(o => !o.markedForDeletion);
      fireworks = fireworks.filter(o => !o.markedForDeletion);
      shockwaves = shockwaves.filter(o => !o.markedForDeletion);`;

const animLoopNew = `      // Dripp logic exactly as in arcade.html
      if (Math.random() < 0.1) {
        drops.push(new Drop());
      }
      
      // Draw plain background instead of trails
      ctx.fillStyle = "var(--deep-black)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Update and Draw Drops
      drops.forEach(o => o.update());
      drops.forEach(o => o.draw(ctx));
      drops = drops.filter(o => !o.markedForDeletion);
      
      // Draw catcher zone at mouse
      const mx = getMouseRef().x, my = getMouseRef().y;
      ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();`;

content = content.replace(animLoopOld, animLoopNew);

// Since we are clearing the screen solidly with var(--deep-black), we need to ensure the variable is resolved or use its value #050505. Let's use #050505.
content = content.replace('ctx.fillStyle = "var(--deep-black)";', 'ctx.fillStyle = "#050505";');

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("Reverted Dripp Drop to exact coming soon page logic");
