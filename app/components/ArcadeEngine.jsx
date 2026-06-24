"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// ─── MODULE-LEVEL HELPERS (immune to minification TDZ) ────────────────────────
// These live at module scope so the minifier handles them safely.

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rnd(min, max) { return min + Math.random() * (max - min); }

// ─── GAME ENGINE FACTORY ──────────────────────────────────────────────────────
// Returns an object with start/destroy/setGame/etc.
// All game-object classes are INSIDE this factory function so they share canvas/ctx/refs.
// Using `function` declarations (NOT class declarations) so they are properly hoisted
// and immune to Turbopack's minification TDZ.

function createGameEngine(canvas, callbacks) {
  const ctx = canvas.getContext("2d");
  const {
    getMouseRef, getCursorActiveRef, getActiveGameRef, getGameStateRef,
    getIsPausedRef,
    getScoreRef, setScoreRef,
    getBreakScoreRef, setBreakScoreRef,
    getBreakLevelRef, setBreakLevelRef,
    getScopeScoreRef, setScopeScoreRef,
    getLastMilestoneRef,
    setScore, setBreakScore, setBreakLevel, setScopeScore, setGameState,
    triggerGsapMilestone,
  } = callbacks;

  let isMobile = window.innerWidth <= 768;

  // Arrays
  let drops = [], splashes = [], miniParticles = [], fireworks = [];
  let scopeDrops = [], scopePaddle = null;
  let bricks = [], balls = [], powerUps = [], paddle = null;
  let snake = [], snakeDir = {x: 1, y: 0}, snakeFood = null, snakeFrame = 0, snakeReverseTimer = 0;
  let pongBall = {x:0, y:0, vx:0, vy:0, r:8}, pongAI = 0, pongTrails = [];
  let runnerState = {y:0, vy:0, frame:0}, runnerObs = [];
  let invPlayer = {x: 0, w: 40, h: 20}, invLasers = [], invaders = [], invFrame = 0, invKeys = {};
  
  // ── Invaders Init ────────────────────────────────────────────────────────────
  function initInvaders() {
    setScoreRef(0); setScore(0);
    invPlayer = {x: canvas.width/2 - 20, w: 40, h: 20};
    invLasers = []; invaders = []; invFrame = 0; invKeys = {};
  }
  window.initInvadersGame = initInvaders;

  // ── Simon Init ───────────────────────────────────────────────────────────────
  function initSimon() {
    setScoreRef(0); setScore(0);
  }
  window.initSimonGame = initSimon;
  
  let piercingTimer = 0;
  let animId;
  let lastActive = "none";

  // ── Resize ──────────────────────────────────────────────────────────────────
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    isMobile = window.innerWidth <= 768;
  }
  window.addEventListener("resize", resize);
  resize();

  // ── Dripp Drop Element ───────────────────────────────────────────────────────
  function Drop() {
    this.x = Math.random() * canvas.width;
    this.y = -20;
    this.vy = 3 + Math.random() * 4;
    this.radius = 5 + Math.random() * 5;
    this.isBomb = Math.random() < 0.1;
    this.markedForDeletion = false;
    this.color = this.isBomb ? "#ff0000" : "#ebd73f";
  }
  Drop.prototype.update = function () {
    this.y += this.vy;
    if (this.y > canvas.height) { this.markedForDeletion = true; return; }
    
    const mx = getMouseRef().x, my = getMouseRef().y;
    const dist = Math.hypot(mx - this.x, my - this.y);
    if (dist < 50) {
      this.markedForDeletion = true;
      if (this.isBomb) {
        setGameState("failed");
      } else {
        setScoreRef(getScoreRef() + 1);
        setScore(getScoreRef());
      }
    }
  };
  Drop.prototype.draw = function (ctx) {
    if (this.isBomb) {
      // Bomb: Red circle
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#eb3f3f"; // Exact Dripp red
      ctx.fill();
      
      // Bomb fuse/stem
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.quadraticCurveTo(this.x + 2, this.y - this.radius - 4, this.x + 4, this.y - this.radius - 6);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Little spark
      ctx.beginPath();
      ctx.arc(this.x + 4, this.y - this.radius - 6, 1, 0, Math.PI*2);
      ctx.fillStyle = "#ebd73f";
      ctx.fill();
    } else {
      // Teardrop shape
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius * 1.5);
      ctx.quadraticCurveTo(this.x + this.radius, this.y - this.radius * 0.2, this.x + this.radius, this.y);
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
      ctx.quadraticCurveTo(this.x - this.radius, this.y - this.radius * 0.2, this.x, this.y - this.radius * 1.5);
      ctx.fillStyle = this.color;
      ctx.fill();
      
      // Optional inner glow/highlight
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.3, this.y + this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fill();
    }
  };

  // ── Shockwave ────────────────────────────────────────────────────────────────
  function Shockwave(x, y, color) {
    this.x = x; this.y = y; this.radius = 5; this.alpha = 1; this.color = color; this.markedForDeletion = false;
  }
  Shockwave.prototype.update = function () { this.radius += 8; this.alpha -= 0.05; if (this.alpha <= 0) this.markedForDeletion = true; };
  Shockwave.prototype.draw = function (ctx) {
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color; ctx.lineWidth = 2 + this.alpha * 3; ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // ── Paddle (Breaker) ─────────────────────────────────────────────────────────
  function BreakerPaddle() {
    this.baseW = 120; this.w = 120; this.h = 10;
    this.x = canvas.width / 2; this.y = canvas.height - 100;
    this.vx = 0; this.tilt = 0; this.widthModifier = 1; this.modifierTimer = 0;
  }
  BreakerPaddle.prototype.update = function () {
    if (this.modifierTimer > 0) { this.modifierTimer -= 16; if (this.modifierTimer <= 0) this.widthModifier = 1; }
    const tw = this.baseW * this.widthModifier;
    this.w += (tw - this.w) * 0.1;
    const dx = getMouseRef().x - this.x;
    this.vx = dx * 0.2; this.x += this.vx;
    const tt = (this.vx / 30) * (Math.PI / 8); this.tilt += (tt - this.tilt) * 0.3;
    if (this.x - this.w / 2 < 0) this.x = this.w / 2;
    if (this.x + this.w / 2 > canvas.width) this.x = canvas.width - this.w / 2;
  };
  BreakerPaddle.prototype.draw = function (ctx) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.tilt);
    ctx.beginPath(); ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, this.h / 2);
    ctx.fillStyle = "rgba(235,215,63,.15)"; ctx.lineWidth = 15; ctx.strokeStyle = "rgba(235,215,63,.1)"; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, this.h / 2);
    ctx.fillStyle = "#fff"; ctx.fill(); ctx.restore();
  };

  // ── Ball ─────────────────────────────────────────────────────────────────────
  function Ball(x, y, vx, vy) {
    this.radius = 6; this.x = x || canvas.width / 2; this.y = y || canvas.height - 140;
    this.vx = vx || 6 * (Math.random() > 0.5 ? 1 : -1); this.vy = vy || -7;
    this.trail = []; this.markedForDeletion = false; this.speedLimit = 12;
  }
  Ball.prototype.update = function (paddle, targets) {
    this.trail.push({ x: this.x, y: this.y }); if (this.trail.length > 10) this.trail.shift();
    this.x += this.vx; this.y += this.vy;
    if (this.x - this.radius <= 0) { this.x = this.radius; this.vx *= -1; }
    if (this.x + this.radius >= canvas.width) { this.x = canvas.width - this.radius; this.vx *= -1; }
    if (this.y - this.radius <= 0) { this.y = this.radius; this.vy *= -1; }
    if (this.y > canvas.height + 20) { this.markedForDeletion = true; return; }
    const cos = Math.cos(-paddle.tilt), sin = Math.sin(-paddle.tilt);
    const dx = this.x - paddle.x, dy = this.y - paddle.y;
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    if (lx > -paddle.w / 2 && lx < paddle.w / 2 && Math.abs(ly) < paddle.h / 2 + this.radius && this.vy > 0) {
      const nx = Math.sin(paddle.tilt), ny = -Math.cos(paddle.tilt);
      const dot = this.vx * nx + this.vy * ny;
      this.vx -= 2 * dot * nx; this.vy -= 2 * dot * ny; this.vx += paddle.vx * 0.2;
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (spd > this.speedLimit) { this.vx = (this.vx / spd) * this.speedLimit; this.vy = (this.vy / spd) * this.speedLimit; }
      if (this.vy > -3) this.vy = -5; this.y -= 5;
      fireworks.push(new Shockwave(this.x, this.y, "#fff"));
    }
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (!t.markedForDeletion) {
        const d = Math.hypot(this.x - t.x, this.y - t.y);
        if (d < this.radius + t.radius) {
          t.hit();
          if (piercingTimer <= 0) { const nx = (this.x - t.x) / d, ny = (this.y - t.y) / d, dot = this.vx * nx + this.vy * ny; this.vx -= 2 * dot * nx; this.vy -= 2 * dot * ny; }
          const sc = getBreakScoreRef() + 10; setBreakScoreRef(sc); setBreakScore(sc);
          const ch = Math.max(0.1, 0.25 - (getBreakLevelRef() * 0.01));
          if (Math.random() < ch) powerUps.push(new PowerUp(t.x, t.y, getBreakLevelRef()));
          if (piercingTimer <= 0) break;
        }
      }
    }
  };
  Ball.prototype.draw = function (ctx) {
    if (piercingTimer > 0) { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2); ctx.fillStyle = "rgba(235,63,63,.3)"; ctx.fill(); }
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i], r = i / this.trail.length;
      ctx.globalAlpha = r * 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, this.radius * (0.5 + r * 0.5), 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fill();
  };

  // ── TargetRing ────────────────────────────────────────────────────────────────
  function TargetRing(x, y) {
    this.x = x; this.y = y; this.baseRadius = 15 + Math.random() * 10;
    this.radius = this.baseRadius; this.markedForDeletion = false;
    this.color = Math.random() > 0.5 ? "#ebd73f" : "#fff"; this.phase = Math.random() * Math.PI * 2; this.health = 1;
  }
  TargetRing.prototype.update = function () {
    this.phase += 0.05; this.radius = this.baseRadius + Math.sin(this.phase) * 3;
    if (this.health >= 3) this.color = "#f0f"; else if (this.health === 2) this.color = "#3cf";
    else if (this.health === 1 && (this.color === "#3cf" || this.color === "#f0f")) this.color = Math.random() > 0.5 ? "#ebd73f" : "#fff";
  };
  TargetRing.prototype.hit = function () {
    this.health -= 1; fireworks.push(new Shockwave(this.x, this.y, this.color));
    if (this.health <= 0) { this.markedForDeletion = true; } else { this.color = Math.random() > 0.5 ? "#ebd73f" : "#fff"; }
  };
  TargetRing.prototype.draw = function (ctx) {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.color; ctx.lineWidth = this.health > 1 ? 4 : 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
  };

  // ── PowerUp ──────────────────────────────────────────────────────────────────
  function PowerUp(x, y, level) {
    this.x = x; this.y = y; this.vy = 2.5 + Math.random() * 1.5; this.radius = 6;
    const bc = Math.min(0.8, 0.3 + ((level || 1) * 0.05));
    const r = Math.random();
    if (r < bc) { this.type = Math.random() < 0.5 ? "shrink_paddle" : "shield_targets"; }
    else { const g = Math.random(); if (g < 0.25) this.type = "multiball"; else if (g < 0.5) this.type = "points"; else if (g < 0.75) this.type = "wide_paddle"; else this.type = "piercing"; }
    this.markedForDeletion = false;
  }
  PowerUp.prototype.getColor = function () {
    const m = { multiball: "#f0f", points: "#0fc", wide_paddle: "#3f3", piercing: "#ebd73f", shrink_paddle: "#f33", shield_targets: "#3cf" };
    return m[this.type] || "#fff";
  };
  PowerUp.prototype.update = function (pad, targets) {
    this.y += this.vy; if (this.y > canvas.height + 20) { this.markedForDeletion = true; return; }
    if (this.y + this.radius >= pad.y - pad.h && this.y - this.radius <= pad.y + pad.h && this.x >= pad.x - pad.w / 2 && this.x <= pad.x + pad.w / 2) {
      this.markedForDeletion = true;
      if (this.type === "multiball") { balls.push(new Ball(pad.x, pad.y - 20, -4, -6)); balls.push(new Ball(pad.x, pad.y - 20, 4, -6)); }
      else if (this.type === "points") { const s = getBreakScoreRef() + 50; setBreakScoreRef(s); setBreakScore(s); }
      else if (this.type === "wide_paddle") { pad.widthModifier = 1.5; pad.modifierTimer = 10000; }
      else if (this.type === "shrink_paddle") { pad.widthModifier = 0.6; pad.modifierTimer = 5000; }
      else if (this.type === "piercing") { piercingTimer = 5000; }
      else if (this.type === "shield_targets") {
        const un = targets.filter(t => t.health === 1);
        for (let i = 0; i < 3 && un.length > 0; i++) { const idx = Math.floor(Math.random() * un.length); un[idx].health = 2; un.splice(idx, 1); }
      }
      fireworks.push(new Shockwave(this.x, this.y, this.getColor()));
    }
  };
  PowerUp.prototype.draw = function (ctx) {
    const c = this.getColor();
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2); ctx.globalAlpha = 0.2; ctx.fillStyle = c; ctx.fill(); ctx.globalAlpha = 1;
  };

  // ── MiniParticle ─────────────────────────────────────────────────────────────
  function MiniP(x, y, isRed, oc) {
    this.x = x; this.y = y;
    const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6;
    this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
    this.radius = 1 + Math.random() * 2.5;
    this.color = oc || (isRed ? "rgba(235,63,63,1)" : "rgba(235,215,63,1)");
    this.alpha = 1; this.friction = 0.9; this.markedForDeletion = false;
  }
  MiniP.prototype.update = function () {
    this.vx *= this.friction; this.vy *= this.friction; this.x += this.vx; this.y += this.vy;
    this.alpha = Math.max(0, this.alpha - 0.04); if (this.alpha === 0) this.markedForDeletion = true;
  };
  MiniP.prototype.draw = function (ctx) {
    ctx.globalAlpha = this.alpha; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color; ctx.fill(); ctx.globalAlpha = 1;
  };

  // ── Splash ───────────────────────────────────────────────────────────────────
  function Splash(x, y, isRed, isWhite) {
    this.x = x; this.y = y; this.radius = 2; this.alpha = 1;
    this.isRed = isRed; this.isWhite = isWhite; this.markedForDeletion = false; this.expSpeed = 8;
  }
  Splash.prototype.update = function () {
    this.radius += this.expSpeed; this.expSpeed *= 0.88; this.alpha = Math.max(0, this.alpha - 0.04);
    if (this.alpha === 0) this.markedForDeletion = true;
  };
  Splash.prototype.draw = function (ctx) {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = this.isWhite ? `rgba(255,255,255,${this.alpha})` : this.isRed ? `rgba(235,63,63,${this.alpha})` : `rgba(235,215,63,${this.alpha})`;
    ctx.lineWidth = Math.max(0.1, 3 * this.alpha); ctx.stroke(); ctx.closePath();
  };

  // ── FireworkParticle ─────────────────────────────────────────────────────────
  function FWParticle(x, y, oc, playful) {
    this.x = x; this.y = y;
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 15;
    this.speedX = Math.cos(a) * v; this.speedY = Math.sin(a) * v;
    this.radius = 1.5 + Math.random() * 4;
    this.color = oc || (Math.random() > 0.5 ? "#ebd73f" : "#fff");
    this.alpha = 1; this.friction = 0.95; this.gravity = 0.2; this.markedForDeletion = false;
    this.playful = playful;
    if (playful) {
      const e = ["💥","💀","😵","🧨","💣","💨"]; this.emoji = e[Math.floor(Math.random() * e.length)];
      this.radius = 15 + Math.random() * 25; this.rotation = Math.random() * Math.PI * 2; this.rotSpeed = (Math.random() - 0.5) * 0.4;
    }
  }
  FWParticle.prototype.update = function () {
    this.speedX *= this.friction; this.speedY *= this.friction; this.speedY += this.gravity;
    this.x += this.speedX; this.y += this.speedY;
    if (this.playful) this.rotation += this.rotSpeed;
    this.alpha = Math.max(0, this.alpha - 0.02); if (this.alpha === 0) this.markedForDeletion = true;
  };
  FWParticle.prototype.draw = function (ctx) {
    ctx.globalAlpha = this.alpha;
    if (this.playful) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
      ctx.font = `${this.radius}px Arial`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(this.emoji, 0, 0); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  // ── ScopePaddle ──────────────────────────────────────────────────────────────
  function ScopePaddle() {
    this.w = 120; this.h = 15; this.x = canvas.width / 2; this.y = canvas.height - 80;
    this.speedMult = 1; this.speedTimer = 0; this.reversed = false; this.reverseTimer = 0;
  }
  ScopePaddle.prototype.update = function () {
    if (this.speedTimer > 0) { this.speedTimer -= 16; if (this.speedTimer <= 0) this.speedMult = 1; }
    if (this.reverseTimer > 0) { this.reverseTimer -= 16; if (this.reverseTimer <= 0) this.reversed = false; }
    const tx = getMouseRef().x, dx = tx - this.x;
    let move = dx * 0.15 * this.speedMult;
    if (this.reversed) move = -move;
    this.x += move;
    this.x = clamp(this.x, this.w / 2, canvas.width - this.w / 2);
  };
  ScopePaddle.prototype.draw = function (ctx) {
    const c = this.reversed ? "#f33" : "#ebd73f";
    ctx.beginPath(); ctx.roundRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, 5); ctx.fillStyle = c; ctx.fill();
    ctx.beginPath(); ctx.roundRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h, 5);
    ctx.strokeStyle = this.reversed ? "rgba(255,51,51,.4)" : "rgba(235,215,63,.4)"; ctx.lineWidth = 10; ctx.stroke();
  };

  // ── ScopeDrop ────────────────────────────────────────────────────────────────
  function ScopeDrop() {
    this.x = Math.random() * canvas.width; this.y = -50;
    const r = Math.random();
    if (r < 0.15) this.type = "creep"; else if (r < 0.25) this.type = "burnout";
    else if (r < 0.35) this.type = "feedback"; else if (r < 0.45) this.type = "coffee";
    else this.type = "idea";
    this.vy = 3 + Math.random() * 4 + (getScopeScoreRef() / 500);
    this.radius = 12; this.markedForDeletion = false;
  }
  ScopeDrop.prototype.update = function (pad) {
    this.y += this.vy;
    if (this.y > canvas.height + 20) {
      this.markedForDeletion = true;
      if (this.type === "idea" || this.type === "coffee") {
        const ns = Math.max(0, getScopeScoreRef() - 10); setScopeScoreRef(ns); setScopeScore(ns);
      }
      return;
    }
    if (this.y + this.radius >= pad.y - pad.h / 2 && this.y - this.radius <= pad.y + pad.h / 2 && this.x >= pad.x - pad.w / 2 && this.x <= pad.x + pad.w / 2) {
      this.markedForDeletion = true;
      if (this.type === "creep") { setGameState("failed"); for (let i = 0; i < 30; i++) fireworks.push(new FWParticle(this.x, this.y, "#f33")); }
      else if (this.type === "burnout") { pad.w = Math.max(40, pad.w - 30); fireworks.push(new Shockwave(this.x, this.y, "#f80")); }
      else if (this.type === "feedback") { pad.reversed = true; pad.reverseTimer = 5000; fireworks.push(new Shockwave(this.x, this.y, "#f0f")); }
      else if (this.type === "coffee") {
        pad.speedMult = 2; pad.speedTimer = 5000;
        const ns = getScopeScoreRef() + 20; setScopeScoreRef(ns); setScopeScore(ns);
        fireworks.push(new Shockwave(this.x, this.y, "#3f3"));
      } else {
        const ns = getScopeScoreRef() + 10; setScopeScoreRef(ns); setScopeScore(ns);
        for (let i = 0; i < 5; i++) miniParticles.push(new MiniP(this.x, this.y, false));
      }
    }
  };
  ScopeDrop.prototype.draw = function (ctx) {
    const cs = { creep: "#f33", burnout: "#f80", feedback: "#f0f", coffee: "#3f3", idea: "#ebd73f" };
    const c = cs[this.type] || "#ebd73f";
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
  };

  // ── Breaker init patterns (20 levels) ────────────────────────────────────────
  function initBreaker(level) {
    bricks = []; balls = [new Ball()]; powerUps = []; paddle = new BreakerPaddle(); piercingTimer = 0;
    const pat = level % 20, sx = 60, sy = 50, ox = canvas.width / 2, oy = 120;
    function ab(r, c, h) { const br = new TargetRing(ox + c * sx, oy + r * sy); br.health = h || 1; bricks.push(br); }
    if (pat === 1) { for (let r = 0; r < 3; r++) for (let c = -2; c <= 2; c++) ab(r, c); }
    else if (pat === 2) { for (let r = 0; r < 5; r++) for (let c = -r; c <= r; c++) ab(r, c); }
    else if (pat === 3) { for (let r = 0; r < 5; r++) for (let c = -3; c <= 3; c++) if (r === 0 || r === 4 || c === -3 || c === 3) ab(r, c); }
    else if (pat === 4) { for (let r = 0; r < 6; r++) for (let c = -4; c <= 4; c++) if ((r + c) % 2 === 0) ab(r, c); }
    else if (pat === 5) { for (let r = 0; r < 7; r++) for (let c = -3; c <= 3; c++) if (c === r - 3 || c === -(r - 3)) ab(r, c, 2); }
    else if (pat === 6) { for (let r = 0; r < 6; r++) for (let c = -4; c <= 4; c++) if (c === -3 || c === -2 || c === 2 || c === 3) ab(r, c); }
    else if (pat === 7) { for (let r = 0; r < 7; r++) { const w = 3 - Math.abs(3 - r); for (let c = -w; c <= w; c++) ab(r, c, w === 0 ? 2 : 1); } }
    else if (pat === 8) { for (let r = 0; r < 6; r++) { ab(r, -(5 - r)); ab(r, 5 - r); } }
    else if (pat === 9) { [[-2, 0], [2, 0], [-2, 1], [2, 1], [-3, 3], [3, 3], [-2, 4], [-1, 4], [0, 4], [1, 4], [2, 4]].forEach(([c, r]) => ab(r, c)); }
    else if (pat === 10) { for (let r = 0; r < 5; r++) for (let c = -4; c <= 4; c++) ab(r, c, r === 0 ? 3 : (r === 1 ? 2 : 1)); }
    else { for (let r = 0; r < 5; r++) for (let c = -4; c <= 4; c++) ab(r, c, 1); }
    const sm = 1 + Math.floor((level - 1) / 20) * 0.2;
    balls[0].vx *= sm; balls[0].vy *= sm;
  }

  function initScope() { scopeDrops = []; scopePaddle = new ScopePaddle(); fireworks = []; miniParticles = []; }
  function initDripp() { drops = []; splashes = []; miniParticles = []; fireworks = []; }

  // Expose init functions
  window.initBreakerGame = initBreaker;
  window.initScopeGame = initScope;
  window.initDrippGame = initDripp;

  // ── Milestone animation ──────────────────────────────────────────────────────
  function milestone(x, y) {
    for (let i = 0; i < 80; i++) fireworks.push(new FWParticle(x, y));
    triggerGsapMilestone(x, y);
    gsap.fromTo(canvas, { x: -15 }, { x: 15, duration: 0.05, yoyo: true, repeat: 7, ease: "none", onComplete: () => gsap.set(canvas, { x: 0 }) });
  }

  // ── Main animate loop ────────────────────────────────────────────────────────
  function animate() {
    const ag = getActiveGameRef();
    if (ag === "none") { ctx.clearRect(0, 0, canvas.width, canvas.height); animId = requestAnimationFrame(animate); return; }
    if (getIsPausedRef()) { animId = requestAnimationFrame(animate); return; }

    const gs = getGameStateRef();
    if (gs === "failed" || gs === "level-complete") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (ag === "dripp") { drops.forEach(d => d.draw(ctx)); splashes.forEach(s => s.draw(ctx)); }
      else if (ag === "scope") { if (scopePaddle) scopePaddle.draw(ctx); scopeDrops.forEach(d => d.draw(ctx)); }
      else if (ag === "breaker") { if (paddle) paddle.draw(ctx); balls.forEach(b => b.draw(ctx)); bricks.forEach(b => b.draw(ctx)); powerUps.forEach(p => p.draw(ctx)); }
      miniParticles.forEach(p => { p.update(); p.draw(ctx); }); miniParticles = miniParticles.filter(p => !p.markedForDeletion);
      fireworks.forEach(f => { f.update(); f.draw(ctx); }); fireworks = fireworks.filter(f => !f.markedForDeletion);
      animId = requestAnimationFrame(animate); return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (ag !== lastActive) {
      if (ag === "breaker" && lastActive !== "breaker") initBreaker(getBreakLevelRef());
      else if (ag === "scope" && lastActive !== "scope") initScope();
      else if (ag === "dripp" && lastActive !== "dripp") { drops = []; splashes = []; }
      else if (ag === "snake" && lastActive !== "snake") initSnake();
      else if (ag === "pong" && lastActive !== "pong") initPong();
      else if (ag === "runner" && lastActive !== "runner") initRunner();
      else if (ag === "invaders" && lastActive !== "invaders") initInvaders();
      else if (ag === "simon" && lastActive !== "simon") initSimon();
      lastActive = ag;
    }

    // Dripp logic
    if (ag === "dripp") {
      // Dripp logic exactly as in arcade.html
      if (Math.random() < 0.1) {
        drops.push(new Drop());
      }
      
      // Draw plain background instead of trails
      ctx.fillStyle = "#050505";
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
      ctx.stroke();
    }

    // Scope logic
    if (ag === "scope") {
      ctx.fillStyle = "rgba(5,5,5,0.3)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (Math.random() < 0.03 + getScopeScoreRef() / 10000) scopeDrops.push(new ScopeDrop());
      if (scopePaddle) { scopePaddle.update(); scopePaddle.draw(ctx); }
      scopeDrops.forEach(d => { d.update(scopePaddle); d.draw(ctx); });
      scopeDrops = scopeDrops.filter(d => !d.markedForDeletion);
    }

    // Snake logic
    if (ag === "snake") {
      ctx.fillStyle = "rgba(5,5,5,0.4)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      if (snakeReverseTimer > 0) {
        snakeReverseTimer -= 16;
        ctx.fillStyle = "rgba(255,0,0,0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (++snakeFrame > Math.max(2, 6 - Math.floor(getScoreRef() / 50))) {
        snakeFrame = 0;
        let head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
        
        const gridX = Math.floor(canvas.width / 25);
        const gridY = Math.floor(canvas.height / 25);
        
        // Screen wrap
        if(head.x < 0) head.x = gridX - 1;
        if(head.x >= gridX) head.x = 0;
        if(head.y < 0) head.y = gridY - 1;
        if(head.y >= gridY) head.y = 0;
        
        // Self collision check
        for(let i=0; i<snake.length; i++) {
          if (head.x === snake[i].x && head.y === snake[i].y) {
             setGameState("failed");
          }
        }
        
        snake.unshift(head);
        
        if (snakeFood && head.x === snakeFood.x && head.y === snakeFood.y) {
            if (snakeFood.isPowerdown) {
                snakeReverseTimer = 5000;
                setScoreRef(Math.max(0, getScoreRef() - 5));
                triggerGsapMilestone(head.x*25, head.y*25); // re-use milestone anim as hit effect
            } else {
                setScoreRef(getScoreRef() + 10);
            }
            setScore(getScoreRef());
            spawnSnakeFood();
        } else {
            snake.pop();
        }
      }

      if (snakeFood) {
        ctx.fillStyle = snakeFood.isPowerdown ? '#ff3333' : '#ebd73f';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(snakeFood.x * 25, snakeFood.y * 25, 23, 23);
        ctx.shadowBlur = 0;
      }
      
      ctx.fillStyle = '#33ff33';
      ctx.shadowColor = '#33ff33';
      for(let i=0; i<snake.length; i++) {
          ctx.globalAlpha = 1 - (i/snake.length)*0.5;
          ctx.shadowBlur = i === 0 ? 15 : 5;
          ctx.fillRect(snake[i].x * 25, snake[i].y * 25, 23, 23);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    // Pong logic
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

    // Runner logic
    if (ag === "runner") {
      ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const ground = canvas.height - 100;

      // Update runner
      runnerState.vy += 0.8; // Gravity
      runnerState.y += runnerState.vy;
      if (runnerState.y >= ground) {
        runnerState.y = ground;
        runnerState.vy = 0;
      }

      // Jump Input
      if (runnerState.y === ground && getCursorActiveRef()) {
        runnerState.vy = -16;
        getCursorActiveRef().current = false; // consume jump
      }

      // Spawning
      runnerState.frame++;
      if (runnerState.frame % 60 === 0 && Math.random() < (0.5 + getScoreRef() * 0.01)) {
        runnerObs.push({x: canvas.width, y: ground, w: 20, h: rnd(30, 80), speed: 6 + getScoreRef()*0.1});
      }

      // Draw Ground
      ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, ground + 20); ctx.lineTo(canvas.width, ground + 20); ctx.stroke();

      // Draw Player
      ctx.fillStyle = '#ebd73f'; ctx.shadowBlur = 15; ctx.shadowColor = '#ebd73f';
      ctx.beginPath(); ctx.arc(100, runnerState.y, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

      // Update & Draw Obstacles
      ctx.fillStyle = '#ff3333';
      for (let i = runnerObs.length - 1; i >= 0; i--) {
        let o = runnerObs[i];
        o.x -= o.speed;
        ctx.fillRect(o.x, o.y - o.h + 20, o.w, o.h);

        // Collision Check
        if (Math.abs(100 - o.x) < 20 && Math.abs(runnerState.y - (o.y - o.h/2 + 10)) < (20 + o.h/2)) {
          setGameState("failed");
        }

        if (o.x < -50) {
          runnerObs.splice(i, 1);
          setScoreRef(getScoreRef() + 1); setScore(getScoreRef());
          if (getScoreRef() % 10 === 0) triggerGsapMilestone(100, runnerState.y);
        }
      }
    }

    // Invaders logic
    if (ag === "invaders") {
      ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Move Player
      if (invKeys['ArrowLeft']) invPlayer.x -= 8;
      if (invKeys['ArrowRight']) invPlayer.x += 8;
      invPlayer.x = clamp(invPlayer.x, 0, canvas.width - invPlayer.w);

      // Auto Fire
      invFrame++;
      if (invKeys[' '] && invFrame % 10 === 0) {
        invLasers.push({x: invPlayer.x + invPlayer.w/2, y: canvas.height - 80, vy: -15});
      }

      // Spawning Invaders
      if (invFrame % Math.max(20, 60 - Math.floor(getScoreRef()/10)) === 0) {
        invaders.push({x: rnd(20, canvas.width - 40), y: -30, w: 30, h: 30, vy: 2 + getScoreRef()*0.05, hp: 1});
      }

      // Draw Player
      ctx.fillStyle = '#ebd73f'; ctx.shadowBlur = 10; ctx.shadowColor = '#ebd73f';
      ctx.fillRect(invPlayer.x, canvas.height - 70, invPlayer.w, invPlayer.h);
      ctx.shadowBlur = 0;

      // Update Lasers
      ctx.fillStyle = '#fff';
      for (let i = invLasers.length - 1; i >= 0; i--) {
        let l = invLasers[i];
        l.y += l.vy;
        ctx.fillRect(l.x - 2, l.y, 4, 15);
        if (l.y < -20) invLasers.splice(i, 1);
      }

      // Update Invaders
      ctx.fillStyle = '#eb3f3f'; ctx.shadowBlur = 10; ctx.shadowColor = '#eb3f3f';
      for (let i = invaders.length - 1; i >= 0; i--) {
        let inv = invaders[i];
        inv.y += inv.vy;
        ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
        
        if (inv.y > canvas.height) {
           setGameState("failed");
        }

        // Collision with Lasers
        for (let j = invLasers.length - 1; j >= 0; j--) {
           let l = invLasers[j];
           if (l.x > inv.x && l.x < inv.x + inv.w && l.y < inv.y + inv.h && l.y > inv.y) {
               invLasers.splice(j, 1);
               invaders.splice(i, 1);
               setScoreRef(getScoreRef() + 1); setScore(getScoreRef());
               triggerGsapMilestone(inv.x, inv.y);
               break;
           }
        }
      }
      ctx.shadowBlur = 0;
    }

    // Simon logic
    if (ag === "simon") {
      ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = "30px 'Panchang', sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText("NEON SIMON", canvas.width/2, canvas.height/2 - 20);
      ctx.font = "16px 'Clash Display', sans-serif";
      ctx.fillStyle = "#ebd73f";
      ctx.fillText("COMING SOON...", canvas.width/2, canvas.height/2 + 20);
    }

    // Breaker logic
    if (ag === "breaker") {
      ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (piercingTimer > 0) piercingTimer -= 16;
      if (paddle) { paddle.update(); paddle.draw(ctx); }
      balls.forEach(b => { b.update(paddle, bricks); b.draw(ctx); });
      balls = balls.filter(b => !b.markedForDeletion);
      bricks.forEach(b => { b.update(); b.draw(ctx); }); bricks = bricks.filter(b => !b.markedForDeletion);
      powerUps.forEach(p => { p.update(paddle, bricks); p.draw(ctx); }); powerUps = powerUps.filter(p => !p.markedForDeletion);
      if (balls.length === 0 && bricks.length > 0) setGameState("failed");
      if (bricks.length === 0 && balls.length > 0) {
        const nl = getBreakLevelRef() + 1; setBreakLevelRef(nl); setBreakLevel(nl);
        setGameState("level-complete");
        setTimeout(() => { initBreaker(nl); setGameState("playing"); }, 2000);
      }
    }

    // Common particles
    miniParticles.forEach(p => { p.update(); p.draw(ctx); }); miniParticles = miniParticles.filter(p => !p.markedForDeletion);
    fireworks.forEach(f => { f.update(); f.draw(ctx); }); fireworks = fireworks.filter(f => !f.markedForDeletion);

    animId = requestAnimationFrame(animate);
  }

  animate();

  function handleKeyDown(e) {
    const ag = getActiveGameRef();
    if (ag === "snake") {
      const isReversed = snakeReverseTimer > 0;
      const up = isReversed ? 'ArrowDown' : 'ArrowUp';
      const down = isReversed ? 'ArrowUp' : 'ArrowDown';
      const left = isReversed ? 'ArrowRight' : 'ArrowLeft';
      const right = isReversed ? 'ArrowLeft' : 'ArrowRight';

      if (e.key === up && snakeDir.y === 0) snakeDir = {x: 0, y: -1};
      if (e.key === down && snakeDir.y === 0) snakeDir = {x: 0, y: 1};
      if (e.key === left && snakeDir.x === 0) snakeDir = {x: -1, y: 0};
      if (e.key === right && snakeDir.x === 0) snakeDir = {x: 1, y: 0};
    } else if (ag === "runner") {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        if (runnerState.y >= canvas.height - 100) runnerState.vy = -16;
      }
    } else if (ag === "invaders") {
      invKeys[e.key] = true;
    }
  }

  function handleKeyUp(e) {
    const ag = getActiveGameRef();
    if (ag === "invaders") {
      invKeys[e.key] = false;
    }
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return {
    destroy() {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    },
    milestone,
  };
}

// ─── REACT COMPONENT ──────────────────────────────────────────────────────────

export default function ArcadeEngine({ onClose, forcedGame }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);

  const [activeGame, setActiveGame] = useState(forcedGame || "none");
  const activeGameRef = useRef("none");
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [breakerScore, setBreakerScore] = useState(0);
  const breakerScoreRef = useRef(0);
  const [breakerLevel, setBreakerLevel] = useState(1);
  const breakerLevelRef = useRef(1);
  const [scopeScore, setScopeScore] = useState(0);
  const scopeScoreRef = useRef(0);
  const [gameState, setGameState] = useState("playing");
  const gameStateRef = useRef("playing");
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [hideHero, setHideHero] = useState(false);
  const [showRetryTooltip, setShowRetryTooltip] = useState(false);

  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);
  const lastMilestoneRef = useRef(0);
  const isMountedRef = useRef(false); // Skip first-render effect execution

  // Sync refs
  useEffect(() => { activeGameRef.current = activeGame; }, [activeGame]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // Handle game switch logic (reset scores etc.)
  useEffect(() => {
    if (activeGame === "none") return;
    
    if (activeGame === "breaker") {
      breakerScoreRef.current = 0; setBreakerScore(0);
      breakerLevelRef.current = 1; setBreakerLevel(1);
      setGameState("playing"); setIsPaused(false);
      if (window.initBreakerGame) window.initBreakerGame(1);
    } else if (activeGame === "scope") {
      scopeScoreRef.current = 0; setScopeScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initScopeGame) window.initScopeGame();
    } else if (activeGame === "dripp") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
    } else if (activeGame === "snake") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initSnakeGame) window.initSnakeGame();
    } else if (activeGame === "pong") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initPongGame) window.initPongGame();
    } else if (activeGame === "runner") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initRunnerGame) window.initRunnerGame();
    } else if (activeGame === "invaders") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initInvadersGame) window.initInvadersGame();
    } else if (activeGame === "simon") {
      scoreRef.current = 0; setScore(0);
      setGameState("playing"); setIsPaused(false);
      if (window.initSimonGame) window.initSimonGame();
    }
    // Note: 'none' state is handled by the close buttons directly calling onClose
  }, [activeGame]);

  // Mount cursor + engine
  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    document.body.classList.add("loaded");

    const cursor = document.querySelector(".cursor");
    const moveCursor = (e) => {
      if (e.clientX !== undefined) mouseRef.current = { x: e.clientX, y: e.clientY };
      if (e.touches && e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (cursor) cursor.style.display = "none";
      }
      if (cursor && cursor.style.display !== "none") {
        gsap.to(cursor, { x: mouseRef.current.x, y: mouseRef.current.y, xPercent: -50, yPercent: -50, duration: 0.05, ease: "power3.out" });
      }
    };
    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("touchmove", moveCursor, { passive: false });
    window.addEventListener("touchstart", moveCursor, { passive: false });

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pass a clean shared state object to the engine
    const engineCallbacks = {
      getMouseRef: () => mouseRef.current,
      getCursorActiveRef: () => cursorActiveRef.current,
      getActiveGameRef: () => activeGameRef.current,
      getGameStateRef: () => gameStateRef.current,
      getIsPausedRef: () => isPausedRef.current,
      getScoreRef: () => scoreRef.current,
      setScoreRef: (v) => { scoreRef.current = v; },
      getBreakScoreRef: () => breakerScoreRef.current,
      setBreakScoreRef: (v) => { breakerScoreRef.current = v; },
      getBreakLevelRef: () => breakerLevelRef.current,
      setBreakLevelRef: (v) => { breakerLevelRef.current = v; },
      getScopeScoreRef: () => scopeScoreRef.current,
      setScopeScoreRef: (v) => { scopeScoreRef.current = v; },
      getLastMilestoneRef: () => lastMilestoneRef,
      setScore: (v) => { scoreRef.current = v; setScore(v); },
      setBreakScore: (v) => { breakerScoreRef.current = v; setBreakerScore(v); },
      setBreakLevel: (v) => { breakerLevelRef.current = v; setBreakerLevel(v); },
      setScopeScore: (v) => { scopeScoreRef.current = v; setScopeScore(v); },
      setGameState: (v) => { gameStateRef.current = v; setGameState(v); },
      triggerGsapMilestone: (x, y) => {
        gsap.to(".char", {
          scale: 1.35, color: "#fff", textShadow: "0 0 50px rgba(255,255,255,0.9)", duration: 0.1, yoyo: true, repeat: 3, stagger: 0.02, ease: "power2.out",
          onComplete: () => gsap.to(".char", { scale: 1, color: (i) => i < 5 ? "var(--pure-white)" : "var(--brand-yellow)", textShadow: (i) => i >= 5 ? "0 0 30px var(--brand-glow)" : "none", duration: 0.5, ease: "power2.out" })
        });
      },
    };

    const engine = createGameEngine(canvas, engineCallbacks);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("touchmove", moveCursor);
      window.removeEventListener("touchstart", moveCursor);
    };
  }, []);

  const PrimaryButton = ({ onClick, children, style }) => (
    <button onClick={onClick} style={{
      padding: "12px 28px", border: "1px solid rgba(235,215,63,0.3)", borderRadius: "30px",
      background: "rgba(235,215,63,0.1)", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif",
      fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer",
      transition: "all 0.3s ease", ...style
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.2)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235,215,63,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
    >{children}</button>
  );

  const gameName = activeGame === "breaker" ? "NEON BREAKER" : activeGame === "scope" ? "SCOPE CREEP" : "DRIPP DROP";

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#050505", fontFamily: "'Clash Display', sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Top Left: Pause & Help Buttons */}
      <div style={{ position: "absolute", top: "30px", left: "30px", display: "flex", gap: "10px", zIndex: 100 }}>
        <button onClick={() => setIsPaused(p => !p)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          {isPaused ? "▶" : "||"}
        </button>
        <button onClick={() => setIsHelpOpen(h => !h)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          ?
        </button>
      </div>

      {/* Top Right: Exact Score HUD */}
      <div style={{ position: "absolute", top: "30px", right: "30px", textAlign: "right", pointerEvents: "none", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>Score</div>
        <div className="score-counter-element" style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--brand-yellow)", lineHeight: 1, textShadow: "0 0 20px rgba(235,215,63,.4)" }}>{activeGame === "scope" ? scopeScore : activeGame === "breaker" ? breakerScore : score}</div>
        <div style={{ fontSize: "0.6rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginTop: "15px", whiteSpace: "pre-line" }}>
          KEEP SCORING TO LEVEL UP{"\n"}
          <span style={{ color: "#eb3f3f" }}>CAUTION: AVOID BOMBS</span>
        </div>
      </div>

      {/* Bottom Left: Controls */}
      <div style={{ position: "absolute", bottom: "30px", left: "30px", display: "flex", gap: "15px", alignItems: "center", zIndex: 100 }}>
        {/* Gamepad Icon (Return to Menu) */}
        <button onClick={() => { setActiveGame("none"); if (onClose) onClose(); }} style={{ width: "45px", height: "45px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(235,215,63,0.5)", color: "#ebd73f", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
          </svg>
        </button>
        {/* Disable Game */}
        <button onClick={() => { setActiveGame("none"); if (onClose) onClose(); }} style={{ padding: "8px 20px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
          Disable Game
        </button>
        {/* Show Intro */}
        <button onClick={() => setIsHelpOpen(true)} style={{ padding: "8px 20px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
          Show Intro
        </button>
      </div>

      {/* Paused Overlay */}
      {isPaused && gameState === "playing" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.9) 100%)", zIndex: 90, gap: "30px", backdropFilter: "blur(2px)" }}>
          <div style={{ fontSize: "clamp(3rem,8vw,5rem)", fontFamily: "'Panchang',sans-serif", color: "#fff", letterSpacing: "4px" }}>PAUSED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
            <button onClick={() => setIsPaused(false)} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid #ebd73f", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235,215,63,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
              RESUME GAME
            </button>
            <button style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              BRAG YOUR SCORE
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "failed" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(5,5,5,0.85)", zIndex: 110, gap: "20px" }}>
          <div style={{ fontSize: "clamp(3rem,8vw,5rem)", fontFamily: "'Panchang',sans-serif", color: "#eb3f3f", textShadow: "0 0 40px rgba(235,63,63,.5)" }}>GAME OVER</div>
          <div style={{ color: "rgba(255,255,255,.6)", fontFamily: "'Clash Display',sans-serif", fontSize: "1.2rem", letterSpacing: "2px" }}>
            FINAL SCORE: <strong style={{ color: "var(--brand-yellow)", fontSize: "1.5rem" }}>{activeGame === "scope" ? scopeScore : activeGame === "breaker" ? breakerScore : score}</strong>
          </div>
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button onClick={() => { 
              setGameState("playing"); 
              if (activeGame === "dripp") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "snake") { scoreRef.current = 0; setScore(0); if (window.initSnakeGame) window.initSnakeGame(); } 
              else if (activeGame === "pong") { scoreRef.current = 0; setScore(0); if (window.initPongGame) window.initPongGame(); } 
              else if (activeGame === "runner") { scoreRef.current = 0; setScore(0); if (window.initRunnerGame) window.initRunnerGame(); } 
              else if (activeGame === "invaders") { scoreRef.current = 0; setScore(0); if (window.initInvadersGame) window.initInvadersGame(); } 
              else if (activeGame === "simon") { scoreRef.current = 0; setScore(0); if (window.initSimonGame) window.initSimonGame(); } 
              else if (activeGame === "scope") { scopeScoreRef.current = 0; setScopeScore(0); if (window.initScopeGame) window.initScopeGame(); } 
              else if (activeGame === "breaker") { breakerScoreRef.current = 0; setBreakerScore(0); breakerLevelRef.current = 1; setBreakerLevel(1); if (window.initBreakerGame) window.initBreakerGame(1); } 
            }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid #ebd73f", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235,215,63,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
              PLAY AGAIN
            </button>
            <button onClick={() => { setActiveGame("none"); if (onClose) onClose(); }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              MENU
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 120 }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "16px", padding: "40px", maxWidth: "500px", width: "90%", fontFamily: "'Clash Display',sans-serif", textAlign: "center" }}>
            <h2 style={{ color: "var(--brand-yellow)", marginBottom: "20px", fontFamily: "'Panchang',sans-serif", fontSize: "2rem" }}>{gameName}</h2>
            {activeGame === "dripp" && <><p style={{ color: "rgba(255,255,255,.7)", marginBottom: "10px", lineHeight: "1.5" }}>Move your cursor to catch falling <span style={{ color: "#ebd73f" }}>Yellow</span> drops.</p><p style={{ color: "rgba(255,255,255,.7)", lineHeight: "1.5" }}>Avoid the <span style={{ color: "#eb3f3f" }}>Red Bombs</span> to stay alive.</p></>}
            {activeGame !== "dripp" && <p style={{ color: "rgba(255,255,255,.7)", marginBottom: "10px", lineHeight: "1.5" }}>Follow the on-screen rules to survive and get the highest score!</p>}
            <div style={{ marginTop: "30px" }}>
              <button onClick={() => setIsHelpOpen(false)} style={{ padding: "10px 24px", borderRadius: "30px", background: "transparent", border: "1px solid #ebd73f", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif", cursor: "pointer", transition: "all 0.3s", textTransform: "uppercase", letterSpacing: "1px" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
