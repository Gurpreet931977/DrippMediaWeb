const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

const targetStr = `  // ── MAIN LOOP ────────────────────────────────────────────────────────────────
  function animate() {`;

const injectionStr = `  // ── Snake Init ───────────────────────────────────────────────────────────────
  function initSnake() {
    setScoreRef(0);
    setScore(0);
    snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
    snakeDir = {x: 1, y: 0};
    snakeFrame = 0;
    snakeReverseTimer = 0;
    spawnSnakeFood();
  }
  window.initSnakeGame = initSnake;
  
  function spawnSnakeFood() {
    const gridX = Math.floor(canvas.width / 25);
    const gridY = Math.floor(canvas.height / 25);
    snakeFood = {
      x: Math.floor(Math.random() * gridX),
      y: Math.floor(Math.random() * gridY),
      isPowerdown: Math.random() < 0.2
    };
  }

  // ── MAIN LOOP ────────────────────────────────────────────────────────────────
  function animate() {`;

content = content.replace(targetStr, injectionStr);

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("Injected snake init functions");
