"use client";
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function PongGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [gameState, setGameState] = useState('playing'); // playing, paused, gameover
  
  const scoreRef = useRef({ player: 0, ai: 0 });
  const mouseRef = useRef(300);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const moveCursor = (e) => {
      mouseRef.current = e.touches ? e.touches[0].clientY : e.clientY;
    };
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("touchmove", moveCursor, { passive: false });

    class Paddle {
       constructor(isLeft) {
          this.w = 15;
          this.h = 120;
          this.x = isLeft ? 50 : canvas.width - 50 - this.w;
          this.y = canvas.height / 2 - this.h / 2;
          this.isLeft = isLeft;
          this.vy = 0;
       }
       update(ballY) {
          if (this.isLeft) {
             // Player follows mouse
             const targetY = mouseRef.current - this.h / 2;
             this.y += (targetY - this.y) * 0.2;
          } else {
             // AI follows ball loosely
             const targetY = ballY - this.h / 2;
             this.y += (targetY - this.y) * 0.08; 
          }
          
          // Clamp
          if (this.y < 20) this.y = 20;
          if (this.y + this.h > canvas.height - 20) this.y = canvas.height - 20 - this.h;
       }
       draw(ctx) {
          ctx.beginPath();
          ctx.roundRect(this.x, this.y, this.w, this.h, 5);
          ctx.fillStyle = this.isLeft ? '#00ffcc' : '#ff00ff';
          ctx.fill();
          
          // Glow
          ctx.beginPath();
          ctx.roundRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10, 5);
          ctx.fillStyle = this.isLeft ? 'rgba(0, 255, 204, 0.2)' : 'rgba(255, 0, 255, 0.2)';
          ctx.fill();
       }
    }

    class Ball {
       constructor() {
          this.radius = 12;
          this.reset();
          this.trail = [];
       }
       reset() {
          this.x = canvas.width / 2;
          this.y = canvas.height / 2;
          const dir = Math.random() > 0.5 ? 1 : -1;
          this.vx = (8 + Math.random() * 4) * dir;
          this.vy = (Math.random() - 0.5) * 10;
          this.speedLimit = 20;
       }
       update(p1, p2) {
          this.trail.push({x: this.x, y: this.y});
          if (this.trail.length > 15) this.trail.shift();

          this.x += this.vx;
          this.y += this.vy;

          // Wall bounce (top/bottom)
          if (this.y - this.radius <= 0) { this.y = this.radius; this.vy *= -1; }
          if (this.y + this.radius >= canvas.height) { this.y = canvas.height - this.radius; this.vy *= -1; }

          // Paddle collision
          const checkPaddle = (p) => {
             if (this.x - this.radius < p.x + p.w && this.x + this.radius > p.x &&
                 this.y + this.radius > p.y && this.y - this.radius < p.y + p.h) {
                
                // Determine bounce angle based on where it hits the paddle
                const relativeIntersectY = (p.y + (p.h/2)) - this.y;
                const normalizedIntersectY = (relativeIntersectY / (p.h/2));
                const bounceAngle = normalizedIntersectY * (Math.PI / 3); // Max 60 degree bounce
                
                const speed = Math.min(this.speedLimit, Math.sqrt(this.vx*this.vx + this.vy*this.vy) + 0.5);
                
                const direction = this.x < canvas.width / 2 ? 1 : -1;
                this.vx = direction * speed * Math.cos(bounceAngle);
                this.vy = speed * -Math.sin(bounceAngle);
                
                // Prevent sticking
                this.x = p.isLeft ? p.x + p.w + this.radius : p.x - this.radius;
             }
          };

          checkPaddle(p1);
          checkPaddle(p2);

          // Scoring
          if (this.x < 0) {
             scoreRef.current.ai += 1;
             setScore({...scoreRef.current});
             this.reset();
          } else if (this.x > canvas.width) {
             scoreRef.current.player += 1;
             setScore({...scoreRef.current});
             this.reset();
          }
       }
       draw(ctx) {
          // Trail
          for (let i = 0; i < this.trail.length; i++) {
             const point = this.trail[i];
             const ratio = i / this.trail.length;
             ctx.globalAlpha = ratio * 0.5;
             ctx.beginPath();
             ctx.arc(point.x, point.y, this.radius * ratio, 0, Math.PI*2);
             ctx.fillStyle = '#ebd73f';
             ctx.fill();
          }
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(235, 215, 63, 0.3)';
          ctx.fill();
       }
    }

    const player = new Paddle(true);
    const ai = new Paddle(false);
    const ball = new Ball();

    const animate = () => {
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       
       // Draw middle net
       ctx.setLineDash([15, 15]);
       ctx.beginPath();
       ctx.moveTo(canvas.width/2, 0);
       ctx.lineTo(canvas.width/2, canvas.height);
       ctx.strokeStyle = 'rgba(255,255,255,0.1)';
       ctx.lineWidth = 4;
       ctx.stroke();
       ctx.setLineDash([]);

       player.update(ball.y);
       ai.update(ball.y);
       ball.update(player, ai);

       player.draw(ctx);
       ai.draw(ctx);
       ball.draw(ctx);

       animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
       window.removeEventListener('resize', resize);
       window.removeEventListener('mousemove', moveCursor);
       window.removeEventListener('touchmove', moveCursor);
       cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
       <div style={{ position: 'absolute', top: '40px', width: '100%', display: 'flex', justifyContent: 'space-around', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ fontSize: '4rem', fontFamily: 'Panchang, sans-serif', color: '#00ffcc', textShadow: '0 0 20px rgba(0, 255, 204, 0.5)' }}>{score.player}</div>
          <div style={{ fontSize: '4rem', fontFamily: 'Panchang, sans-serif', color: '#ff00ff', textShadow: '0 0 20px rgba(255, 0, 255, 0.5)' }}>{score.ai}</div>
       </div>
       <canvas ref={canvasRef} style={{ display: 'block', background: 'var(--deep-black)' }} />
    </div>
  );
}
