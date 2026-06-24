const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

// 1. Add variables
content = content.replace('let snake = [], snakeDir = {x: 1, y: 0}, snakeFood = null, snakeFrame = 0, snakeReverseTimer = 0;', 
`let snake = [], snakeDir = {x: 1, y: 0}, snakeFood = null, snakeFrame = 0, snakeReverseTimer = 0;
  let pongBall = {x:0, y:0, vx:0, vy:0, r:8}, pongAI = 0, pongTrails = [];`);

// 2. Add initPong
const initPongStr = `  // ── Pong Init ────────────────────────────────────────────────────────────────
  function initPong() {
    setScoreRef(0); setScore(0);
    pongBall = {x: canvas.width/2, y: canvas.height/2, vx: -6, vy: rnd(-4, 4), r: 8};
    pongAI = canvas.height/2 - 40;
    pongTrails = [];
  }
  window.initPongGame = initPong;

  // ── Snake Init`;

content = content.replace('  // ── Snake Init', initPongStr);

// 3. Add to game routing
content = content.replace('else if (ag === "snake" && lastActive !== "snake") initSnake();',
`else if (ag === "snake" && lastActive !== "snake") initSnake();
      else if (ag === "pong" && lastActive !== "pong") initPong();`);

// 4. Add Pong Loop
const pongLoopStr = `    // Pong logic
    if (ag === "pong") {
      ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const my = getMouseRef().y;
      const py = clamp(my - 40, 0, canvas.height - 80);
      
      // AI
      const aiSpeed = 3 + getScoreRef() * 0.5;
      if (pongAI + 40 < pongBall.y) pongAI += aiSpeed;
      if (pongAI + 40 > pongBall.y) pongAI -= aiSpeed;
      pongAI = clamp(pongAI, 0, canvas.height - 80);

      pongBall.x += pongBall.vx;
      pongBall.y += pongBall.vy;
      
      pongTrails.push({x: pongBall.x, y: pongBall.y, alpha: 1});
      
      // Bounce top/bottom
      if (pongBall.y < 0 || pongBall.y > canvas.height) pongBall.vy *= -1;
      
      // Hit Player (Left)
      if (pongBall.x < 40 && pongBall.x > 20 && pongBall.y > py && pongBall.y < py + 80) {
        pongBall.vx *= -1.1; // Speed up
        pongBall.vy += (pongBall.y - (py + 40)) * 0.1;
        pongBall.x = 40;
        setScoreRef(getScoreRef() + 1); setScore(getScoreRef());
        triggerGsapMilestone(pongBall.x, pongBall.y);
      }
      
      // Hit AI (Right)
      if (pongBall.x > canvas.width - 40 && pongBall.x < canvas.width - 20 && pongBall.y > pongAI && pongBall.y < pongAI + 80) {
        pongBall.vx *= -1;
        pongBall.x = canvas.width - 40;
      }
      
      // Missed
      if (pongBall.x < 0) {
         setGameState("failed");
      } else if (pongBall.x > canvas.width) {
         // AI missed? Unlikely but possible.
         pongBall.x = canvas.width/2; pongBall.vx = -6;
      }
      
      // Draw Trails
      ctx.fillStyle = '#ff00ff';
      pongTrails.forEach((t, i) => {
         t.alpha -= 0.05;
         ctx.globalAlpha = Math.max(0, t.alpha);
         ctx.beginPath(); ctx.arc(t.x, t.y, pongBall.r * t.alpha, 0, Math.PI*2); ctx.fill();
      });
      pongTrails = pongTrails.filter(t => t.alpha > 0);
      ctx.globalAlpha = 1;
      
      // Draw Paddles & Ball
      ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
      ctx.fillRect(20, py, 10, 80); // Player
      ctx.fillRect(canvas.width - 30, pongAI, 10, 80); // AI
      
      ctx.beginPath(); ctx.arc(pongBall.x, pongBall.y, pongBall.r, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Breaker logic`;

content = content.replace('    // Breaker logic', pongLoopStr);

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("Injected Pong logic");
