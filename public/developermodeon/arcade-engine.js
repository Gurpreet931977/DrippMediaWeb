window.ArcadeEngine = (function() {
    let canvas, ctx;
    let animationFrameId;
    let currentGame = null;
    let score = 0;
    
    // Mouse/Touch Tracking
    let mouse = { x: -100, y: -100 };
    let isMouseDown = false;

    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, {passive: false});
    window.addEventListener('mousedown', () => isMouseDown = true);
    window.addEventListener('mouseup', () => isMouseDown = false);
    window.addEventListener('touchstart', () => isMouseDown = true);
    window.addEventListener('touchend', () => isMouseDown = false);

    function updateScoreUI(val, label = "Score") {
        document.getElementById('score-val').innerText = val;
        document.getElementById('score-label').innerText = label;
    }

    function init() {
        canvas = document.getElementById('game-canvas');
        ctx = canvas.getContext('2d');
        resize();
        window.addEventListener('resize', resize);
    }

    function resize() {
        if(canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    // --- GAME MODULES ---
    
    const PongGame = {
        player: null, ai: null, ball: null,
        init() {
            score = { p1: 0, p2: 0 };
            updateScoreUI(`${score.p1} - ${score.p2}`, "P1  -  AI");
            
            this.player = { x: 50, y: canvas.height/2 - 60, w: 15, h: 120 };
            this.ai = { x: canvas.width - 65, y: canvas.height/2 - 60, w: 15, h: 120 };
            this.ball = { x: canvas.width/2, y: canvas.height/2, vx: 10, vy: 5, r: 12, trail: [] };
        },
        update() {
            // Player follows mouse
            this.player.y += (mouse.y - this.player.h/2 - this.player.y) * 0.2;
            
            // AI follows ball
            this.ai.y += (this.ball.y - this.ai.h/2 - this.ai.y) * 0.08;
            
            // Ball movement
            this.ball.trail.push({x: this.ball.x, y: this.ball.y});
            if (this.ball.trail.length > 15) this.ball.trail.shift();
            
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            
            // Walls
            if(this.ball.y < this.ball.r || this.ball.y > canvas.height - this.ball.r) this.ball.vy *= -1;
            
            // Paddle Collisions
            const hitPaddle = (p, isLeft) => {
                if (this.ball.x - this.ball.r < p.x + p.w && this.ball.x + this.ball.r > p.x &&
                    this.ball.y + this.ball.r > p.y && this.ball.y - this.ball.r < p.y + p.h) {
                    this.ball.vx = isLeft ? Math.abs(this.ball.vx) + 0.5 : -Math.abs(this.ball.vx) - 0.5;
                    this.ball.vy += (this.ball.y - (p.y + p.h/2)) * 0.1;
                }
            };
            hitPaddle(this.player, true);
            hitPaddle(this.ai, false);
            
            // Score
            if(this.ball.x < 0) { score.p2++; this.resetBall(); }
            if(this.ball.x > canvas.width) { score.p1++; this.resetBall(); }
        },
        resetBall() {
            this.ball.x = canvas.width/2; this.ball.y = canvas.height/2;
            this.ball.vx = (Math.random() > 0.5 ? 10 : -10);
            this.ball.vy = (Math.random() - 0.5) * 10;
            this.ball.trail = [];
            updateScoreUI(`${score.p1} - ${score.p2}`, "P1  -  AI");
        },
        draw() {
            ctx.fillStyle = '#00ffcc'; ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
            ctx.fillStyle = '#ff00ff'; ctx.fillRect(this.ai.x, this.ai.y, this.ai.w, this.ai.h);
            
            ctx.fillStyle = '#ebd73f';
            for (let i=0; i<this.ball.trail.length; i++) {
                ctx.globalAlpha = i / this.ball.trail.length * 0.5;
                ctx.beginPath(); ctx.arc(this.ball.trail[i].x, this.ball.trail[i].y, this.ball.r * (i/15), 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
        }
    };

    const SnakeGame = {
        grid: 25, snake: [], dir: {x:1, y:0}, food: {},
        frameCount: 0,
        init() {
            score = 0; updateScoreUI(score);
            this.snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
            this.dir = {x:1, y:0};
            this.spawnFood();
            
            window.addEventListener('keydown', this.handleInput);
        },
        cleanup() { window.removeEventListener('keydown', this.handleInput); },
        handleInput(e) {
            if (e.key === 'ArrowUp' && SnakeGame.dir.y === 0) SnakeGame.dir = {x:0, y:-1};
            if (e.key === 'ArrowDown' && SnakeGame.dir.y === 0) SnakeGame.dir = {x:0, y:1};
            if (e.key === 'ArrowLeft' && SnakeGame.dir.x === 0) SnakeGame.dir = {x:-1, y:0};
            if (e.key === 'ArrowRight' && SnakeGame.dir.x === 0) SnakeGame.dir = {x:1, y:0};
        },
        spawnFood() {
            this.food = {
                x: Math.floor(Math.random() * (canvas.width / this.grid)),
                y: Math.floor(Math.random() * (canvas.height / this.grid))
            };
        },
        update() {
            if (++this.frameCount < 5) return; // Control speed
            this.frameCount = 0;
            
            let head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
            
            // Screen wrap
            if(head.x < 0) head.x = Math.floor(canvas.width/this.grid)-1;
            if(head.x >= Math.floor(canvas.width/this.grid)) head.x = 0;
            if(head.y < 0) head.y = Math.floor(canvas.height/this.grid)-1;
            if(head.y >= Math.floor(canvas.height/this.grid)) head.y = 0;
            
            this.snake.unshift(head);
            
            if (head.x === this.food.x && head.y === this.food.y) {
                score += 10; updateScoreUI(score);
                this.spawnFood();
            } else {
                this.snake.pop();
            }
        },
        draw() {
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(this.food.x * this.grid, this.food.y * this.grid, this.grid-2, this.grid-2);
            
            ctx.fillStyle = '#33ff33';
            for(let i=0; i<this.snake.length; i++) {
                ctx.globalAlpha = 1 - (i/this.snake.length)*0.5;
                ctx.fillRect(this.snake[i].x * this.grid, this.snake[i].y * this.grid, this.grid-2, this.grid-2);
            }
            ctx.globalAlpha = 1;
        }
    };
    
    // Simplistic versions of Dripp and Breaker for the HTML engine
    // (In a full app, these would be the full class structures)
    const DrippGame = {
        drops: [],
        init() { score = 0; updateScoreUI(score); this.drops = []; },
        update() {
            if(Math.random() < 0.1) this.drops.push({ x: Math.random() * canvas.width, y: -20, vy: 3 + Math.random()*4, r: 5 + Math.random()*5, isBomb: Math.random()<0.1 });
            
            for(let i=this.drops.length-1; i>=0; i--) {
                let d = this.drops[i];
                d.y += d.vy;
                
                const dist = Math.hypot(mouse.x - d.x, mouse.y - d.y);
                if (dist < 50) {
                    if(d.isBomb) { score = 0; } else { score += 1; }
                    updateScoreUI(score);
                    this.drops.splice(i, 1);
                } else if (d.y > canvas.height) {
                    this.drops.splice(i, 1);
                }
            }
        },
        draw() {
            // Draw catcher zone at mouse
            ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 50, 0, Math.PI*2);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
            
            this.drops.forEach(d => {
                ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
                ctx.fillStyle = d.isBomb ? '#ff0000' : '#ebd73f'; ctx.fill();
            });
        }
    };

    const BreakerGame = {
        ball: null, paddle: null, bricks: [],
        init() {
            score = 0; updateScoreUI(score, "Level");
            this.paddle = { x: canvas.width/2, y: canvas.height - 100, w: 150, h: 15 };
            this.ball = { x: canvas.width/2, y: canvas.height/2, vx: 6, vy: -6, r: 8 };
            this.spawnBricks();
        },
        spawnBricks() {
            this.bricks = [];
            for(let r=0; r<5; r++) {
                for(let c=0; c<10; c++) {
                    this.bricks.push({ x: canvas.width/2 - 400 + c*80, y: 100 + r*50, r: 20, active: true });
                }
            }
        },
        update() {
            this.paddle.x += (mouse.x - this.paddle.x) * 0.2;
            this.ball.x += this.ball.vx; this.ball.y += this.ball.vy;
            
            if(this.ball.x < 0 || this.ball.x > canvas.width) this.ball.vx *= -1;
            if(this.ball.y < 0) this.ball.vy *= -1;
            if(this.ball.y > canvas.height) this.init(); // Reset
            
            // Paddle hit
            if (this.ball.y + this.ball.r > this.paddle.y && this.ball.y - this.ball.r < this.paddle.y + this.paddle.h &&
                this.ball.x > this.paddle.x - this.paddle.w/2 && this.ball.x < this.paddle.x + this.paddle.w/2) {
                this.ball.vy *= -1;
            }
            
            // Brick hit
            let hit = false;
            this.bricks.forEach(b => {
                if(b.active && !hit && Math.hypot(this.ball.x - b.x, this.ball.y - b.y) < this.ball.r + b.r) {
                    b.active = false; hit = true; this.ball.vy *= -1;
                    score++; updateScoreUI(score, "Bricks Hit");
                }
            });
        },
        draw() {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.paddle.x - this.paddle.w/2, this.paddle.y, this.paddle.w, this.paddle.h);
            
            ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#33ccff'; ctx.lineWidth = 3;
            this.bricks.forEach(b => {
                if(b.active) {
                    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke();
                }
            });
        }
    };

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (currentGame === 'pong') { PongGame.update(); PongGame.draw(); }
        if (currentGame === 'snake') { SnakeGame.update(); SnakeGame.draw(); }
        if (currentGame === 'dripp') { DrippGame.update(); DrippGame.draw(); }
        if (currentGame === 'breaker') { BreakerGame.update(); BreakerGame.draw(); }
        
        animationFrameId = requestAnimationFrame(loop);
    }

    return {
        startGame: function(gameId) {
            if (!canvas) init();
            currentGame = gameId;
            if(currentGame === 'pong') PongGame.init();
            if(currentGame === 'snake') SnakeGame.init();
            if(currentGame === 'dripp') DrippGame.init();
            if(currentGame === 'breaker') BreakerGame.init();
            cancelAnimationFrame(animationFrameId);
            loop();
        },
        stopGame: function() {
            currentGame = null;
            cancelAnimationFrame(animationFrameId);
            if(SnakeGame.cleanup) SnakeGame.cleanup();
        }
    };
})();
