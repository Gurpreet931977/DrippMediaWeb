const fs = require('fs');
let content = fs.readFileSync('app/components/ArcadeEngine.jsx', 'utf8');

// 1. Add 'scope' to the activeGame state
content = content.replace(
  "const [activeGame, setActiveGame] = useState('dripp'); // 'dripp', 'breaker', 'none'",
  "const [activeGame, setActiveGame] = useState('scope'); // 'dripp', 'breaker', 'scope', 'none'"
);

// 2. Add Scope Creep state variables
content = content.replace(
  "const [breakerLevel, setBreakerLevel] = useState(1);",
  "const [breakerLevel, setBreakerLevel] = useState(1);\n  const [scopeScore, setScopeScore] = useState(0);\n  const scopeScoreRef = useRef(0);"
);

// 3. Add to sync effect
content = content.replace(
  "} else if (activeGame === 'dripp') {",
  "} else if (activeGame === 'scope') {\n      scopeScoreRef.current = 0;\n      setScopeScore(0);\n      setGameState('playing');\n      setIsPaused(false);\n      if (window.initScopeGame) window.initScopeGame();\n    } else if (activeGame === 'dripp') {"
);

// 4. Add Scope game arrays
content = content.replace(
  "// Breaker Game Arrays",
  "// Scope Game Arrays\n    let scopeDrops = [];\n    let scopePaddle = null;\n\n    // Breaker Game Arrays"
);

// 5. Add Scope Classes (Before the triggerMilestoneAnimation)
const scopeClasses = `
    class ScopePaddle {
      constructor() {
        this.w = 120;
        this.h = 15;
        this.x = canvas.width / 2;
        this.y = canvas.height - 80;
        this.vx = 0;
        this.speedMultiplier = 1;
        this.speedTimer = 0;
        this.reversed = false;
        this.reverseTimer = 0;
      }
      update() {
        if (this.speedTimer > 0) {
          this.speedTimer -= 16;
          if (this.speedTimer <= 0) this.speedMultiplier = 1;
        }
        if (this.reverseTimer > 0) {
          this.reverseTimer -= 16;
          if (this.reverseTimer <= 0) this.reversed = false;
        }

        const targetX = mouseRef.current.x;
        const dx = targetX - this.x;
        
        let move = dx * 0.15 * this.speedMultiplier;
        if (this.reversed) move = -move;

        this.x += move;

        if (this.x - this.w/2 < 0) this.x = this.w/2;
        if (this.x + this.w/2 > canvas.width) this.x = canvas.width - this.w/2;
      }
      draw(ctx) {
        ctx.fillStyle = this.reversed ? '#ff3333' : '#ebd73f';
        ctx.beginPath();
        ctx.roundRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h, 5);
        ctx.fill();
        
        // Fake glow
        ctx.beginPath();
        ctx.roundRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h, 5);
        ctx.strokeStyle = this.reversed ? 'rgba(255, 51, 51, 0.4)' : 'rgba(235, 215, 63, 0.4)';
        ctx.lineWidth = 10;
        ctx.stroke();
      }
    }

    class ScopeDrop {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = -50;
        const rand = Math.random();
        if (rand < 0.15) this.type = 'creep'; // Bad (Red)
        else if (rand < 0.25) this.type = 'burnout'; // Bad (Shrinks paddle)
        else if (rand < 0.35) this.type = 'feedback'; // Bad (Reverses controls)
        else if (rand < 0.45) this.type = 'coffee'; // Good (Speed up paddle)
        else this.type = 'idea'; // Good (Points)
        
        this.vy = 3 + Math.random() * 4 + (scopeScoreRef.current / 500);
        this.radius = 12;
        this.markedForDeletion = false;
      }
      update(paddle) {
        this.y += this.vy;
        if (this.y > canvas.height + 20) {
           this.markedForDeletion = true;
           if (this.type === 'idea' || this.type === 'coffee') {
              // Missed a good one!
              scopeScoreRef.current = Math.max(0, scopeScoreRef.current - 10);
              setScopeScore(scopeScoreRef.current);
           }
        }

        // Collision with paddle
        if (
          this.y + this.radius >= paddle.y - paddle.h/2 &&
          this.y - this.radius <= paddle.y + paddle.h/2 &&
          this.x >= paddle.x - paddle.w/2 &&
          this.x <= paddle.x + paddle.w/2
        ) {
          this.markedForDeletion = true;
          if (this.type === 'creep') {
             setGameState('failed');
             for(let i=0; i<30; i++) fireworks.push(new FireworkParticle(this.x, this.y, '#ff3333'));
          } else if (this.type === 'burnout') {
             paddle.w = Math.max(40, paddle.w - 30);
             fireworks.push(new Shockwave(this.x, this.y, '#ff3333'));
          } else if (this.type === 'feedback') {
             paddle.reversed = true;
             paddle.reverseTimer = 5000;
             fireworks.push(new Shockwave(this.x, this.y, '#ff00ff'));
          } else if (this.type === 'coffee') {
             paddle.speedMultiplier = 2;
             paddle.speedTimer = 5000;
             scopeScoreRef.current += 20;
             setScopeScore(scopeScoreRef.current);
             fireworks.push(new Shockwave(this.x, this.y, '#33ff33'));
          } else {
             scopeScoreRef.current += 10;
             setScopeScore(scopeScoreRef.current);
             for(let i=0; i<5; i++) miniParticles.push(new MiniParticle(this.x, this.y, false));
          }
        }
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        if (this.type === 'creep') ctx.fillStyle = '#ff3333';
        else if (this.type === 'burnout') ctx.fillStyle = '#ff8800';
        else if (this.type === 'feedback') ctx.fillStyle = '#ff00ff';
        else if (this.type === 'coffee') ctx.fillStyle = '#33ff33';
        else ctx.fillStyle = '#ebd73f';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI*2);
        ctx.fillStyle = ctx.fillStyle.replace(')', ', 0.3)').replace('rgb', 'rgba');
        if(ctx.fillStyle.startsWith('#')) {
            if (this.type === 'creep') ctx.fillStyle = 'rgba(255, 51, 51, 0.3)';
            else if (this.type === 'burnout') ctx.fillStyle = 'rgba(255, 136, 0, 0.3)';
            else if (this.type === 'feedback') ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
            else if (this.type === 'coffee') ctx.fillStyle = 'rgba(51, 255, 51, 0.3)';
            else ctx.fillStyle = 'rgba(235, 215, 63, 0.3)';
        }
        ctx.fill();
      }
    }
`;

content = content.replace(
  "const triggerMilestoneAnimation = (x, y) => {",
  scopeClasses + "\n    const triggerMilestoneAnimation = (x, y) => {"
);

// 6. Init Scope Game
const initScope = `
    window.initScopeGame = () => {
      scopeDrops = [];
      scopePaddle = new ScopePaddle();
      fireworks = [];
      miniParticles = [];
    };
`;
content = content.replace(
  "window.initBreakerGame = (level = 1) => {",
  initScope + "\n    window.initBreakerGame = (level = 1) => {"
);

// 7. Add to animate loop
const scopeAnimate = `
      } else if (activeGameRef.current === 'scope') {
         ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         if (Math.random() < 0.03 + (scopeScoreRef.current / 10000)) {
            scopeDrops.push(new ScopeDrop());
         }
         
         if (scopePaddle) {
            scopePaddle.update();
            scopePaddle.draw(ctx);
         }
         
         scopeDrops.forEach(drop => {
            drop.update(scopePaddle);
            drop.draw(ctx);
         });
         scopeDrops = scopeDrops.filter(d => !d.markedForDeletion);
`;
content = content.replace(
  "} else if (activeGameRef.current === 'breaker') {",
  scopeAnimate + "\n      } else if (activeGameRef.current === 'breaker') {"
);

// 8. Add to render freeze loop
content = content.replace(
  "} else if (activeGameRef.current === 'breaker') {",
  "} else if (activeGameRef.current === 'scope') {\n             if (scopePaddle) scopePaddle.draw(ctx);\n             scopeDrops.forEach(d => d.draw(ctx));\n          } else if (activeGameRef.current === 'breaker') {"
);

// 9. Add "Scope Creep" to UI buttons
content = content.replace(
  "onClick={() => setActiveGame(prev => prev === 'breaker' ? 'dripp' : 'breaker')}",
  "onClick={() => setActiveGame(prev => prev === 'breaker' ? 'scope' : prev === 'scope' ? 'dripp' : 'breaker')}"
);

// 10. Update Help Text for Scope
content = content.replace(
  "<h2>{activeGame === 'breaker' ? 'NEON BREAKER' : 'DRIPP DROP'}</h2>",
  "<h2>{activeGame === 'breaker' ? 'NEON BREAKER' : activeGame === 'scope' ? 'SCOPE CREEP' : 'DRIPP DROP'}</h2>"
);

content = content.replace(
  "{activeGame === 'breaker' ? (",
  "{activeGame === 'scope' ? (\n               <>\n                 <p>Catch <span style={{color: '#ebd73f'}}>Good Ideas</span> and <span style={{color: '#33ff33'}}>Coffee</span>!</p>\n                 <p>Avoid <span style={{color: '#ff3333'}}>Scope Creep</span>, <span style={{color: '#ff8800'}}>Burnout</span>, and <span style={{color: '#ff00ff'}}>Feedback Loops</span>!</p>\n               </>\n             ) : activeGame === 'breaker' ? ("
);

// 11. Add UI Score Display for Scope
content = content.replace(
  "{activeGame === 'breaker' ? (",
  "{activeGame === 'scope' ? (\n              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>\n                 <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Score</div>\n                 <div className=\"score-counter-element\" style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--brand-yellow)', lineHeight: '1', textShadow: '0 0 20px rgba(235, 215, 63, 0.4)' }}>\n                   {scopeScore}\n                 </div>\n              </div>\n            ) : activeGame === 'breaker' ? ("
);

// 12. Add Close Button to ArcadeEngine
content = content.replace(
  "export default function ArcadeEngine({ onClose }) {",
  "export default function ArcadeEngine({ onClose }) {\n  useEffect(() => { if (activeGame === 'none' && onClose) { onClose(); } }, [activeGame, onClose]);"
);

fs.writeFileSync('app/components/ArcadeEngine.jsx', content);
console.log("ArcadeEngine modified successfully.");
