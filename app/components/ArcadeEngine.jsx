"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { shareScoreImage } from '../utils/shareUtils';

import PendulumGame from "./games/Pendulum";
import GravityFlip from "./games/GravityFlip";
import MandalaMaker from "./games/MandalaMaker";
import SlingshotNinja from "./games/SlingshotNinja";
import LiquidSandbox from "./games/LiquidSandbox";
import BulletHell from "./games/BulletHell";
import NodeWeaver from "./games/NodeWeaver";
import HarmonicLooper from "./games/HarmonicLooper";
import BeatMaker from "./games/BeatMaker";
import PocketTanks from "./games/PocketTanks";
import NeonPac from "./games/NeonPac";
import BomberCrazy from "./games/BomberCrazy";
import NeonDevil from "./games/NeonDevil";
import RetroAudio from "./games/RetroAudio";

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
  
  // High DPI Support Proxy
  const logicalCanvas = new Proxy(canvas, {
    get(target, prop) {
      if (prop === 'width') return window.innerWidth;
      if (prop === 'height') return window.innerHeight;
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    }
  });

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
  let simonSeq = [], simonPlayerSeq = [], simonState = "showing", simonTimer = 0, simonActiveBtn = -1;
  
  // ── Invaders Init ────────────────────────────────────────────────────────────
  function initInvaders() {
    setScoreRef(0); setScore(0);
    invPlayer = { x: canvas.width / 2, y: canvas.height - 50, w: 40, h: 20, vx: 0 };
    invLasers = []; invaders = []; invFrame = 0; invKeys = {};
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 8; c++) {
        invaders.push({ x: 50 + c * 60, y: 50 + r * 40, w: 30, h: 20, vx: 2, type: r % 2 });
      }
    }
  }
  window.initInvadersGame = initInvaders;

  // ── Simon Init ───────────────────────────────────────────────────────────────
  function initSimon() {
    setScoreRef(0); setScore(0);
    simonSeq = []; simonPlayerSeq = [];
    simonState = "showing"; simonTimer = 60; simonActiveBtn = -1;
    simonSeq.push(Math.floor(Math.random() * 4));
  }
  window.initSimonGame = initSimon;

  // ── Snake Init ───────────────────────────────────────────────────────────────
  function spawnSnakeFood() {
    const gridX = Math.floor(canvas.width / 25);
    const gridY = Math.floor(canvas.height / 25);
    snakeFood = {
      x: Math.floor(Math.random() * gridX),
      y: Math.floor(Math.random() * gridY),
      isPowerdown: Math.random() < 0.2
    };
  }

  function initSnake() {
    setScoreRef(0); setScore(0);
    snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
    snakeDir = {x: 1, y: 0};
    snakeFrame = 0;
    snakeReverseTimer = 0;
    spawnSnakeFood();
  }
  window.initSnakeGame = initSnake;

  // ── Pong Init ────────────────────────────────────────────────────────────────
  function initPong() {
    setScoreRef(0); setScore(0);
    pongBall = {x: canvas.width/2, y: canvas.height/2, vx: -6, vy: (Math.random() * 8) - 4, r: 8};
    pongAI = canvas.height/2 - 40;
    pongTrails = [];
  }
  window.initPongGame = initPong;

  // ── Runner Init ──────────────────────────────────────────────────────────────
  function initRunner() {
    setScoreRef(0); setScore(0);
    runnerState = {y: canvas.height - 100, vy: 0, frame: 0};
    runnerObs = [];
  }
  window.initRunnerGame = initRunner;
  
  let piercingTimer = 0;
  let animId;
  let lastActive = "none";
  let activeModule = null;

  // ── Resize ──────────────────────────────────────────────────────────────────
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (window.innerWidth || document.documentElement.clientWidth || 800) * dpr;
    canvas.height = (window.innerHeight || document.documentElement.clientHeight || 800) * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    isMobile = window.innerWidth <= 768;
  }
  window.addEventListener("resize", resize);
  resize();

  // ── Dripp Drop Element ───────────────────────────────────────────────────────
  function Drop(isRed = false) {
    this.x = Math.random() * canvas.width;
    this.y = -50 - Math.random() * 100;
    this.isWhite = !isRed && Math.random() < 0.05;
    this.isBomb = Math.random() < 0.15;
    this.isRed = !this.isBomb && isRed;
    
    let speedMult = isMobile ? (1 + Math.log10(1 + getScoreRef() / 300) * 0.4) : (1.5 + Math.log10(1 + getScoreRef() / 150) * 0.6);
    const mobileSpeedMult = isMobile ? 0.9 : 1.0;
    
    this.vy = (1.0 + Math.random() * 3.5) * speedMult * mobileSpeedMult; 
    this.gravity = (0.005 + Math.random() * 0.02) * speedMult * mobileSpeedMult; 
    
    this.radius = 2 + Math.random() * 2; 
    this.length = this.vy * 3;
    this.markedForDeletion = false;
    
    if (this.isBomb) {
       this.color = '#333333';
       this.radius = 4;
    } else if (this.isWhite) {
       this.color = '#ffffff';
    } else {
       this.color = this.isRed ? 'rgba(235, 63, 63, 0.9)' : 'rgba(235, 215, 63, 0.9)'; 
    }
    
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = (0.02 + Math.random() * 0.04) * (1 + Math.min(getScoreRef(), 1000) * 0.005);
  }
  Drop.prototype.update = function () {
    this.vy += this.gravity;
    this.y += this.vy;
    this.x += Math.sin(this.wobble) * 1.2; 
    this.wobble += this.wobbleSpeed;
    this.length = this.vy * 2;

    if (this.y > canvas.height + this.length) {
      this.markedForDeletion = true;
    }
    
    const mx = getMouseRef().x, my = getMouseRef().y;
    const distance = Math.sqrt((mx - this.x) ** 2 + (my - this.y) ** 2);
    
    const hitRadius = getCursorActiveRef() ? 40 : (isMobile ? 60 : 35);

    if (distance < hitRadius) {
      this.markedForDeletion = true;
      
      if (this.isBomb) {
         setGameState("failed");
         for(let i=0; i<30; i++) fireworks.push(new FWParticle(this.x, this.y, null, true));
         return;
      } else if (this.isWhite) {
         setScoreRef(getScoreRef() + 69);
         for(let i=0; i<40; i++) fireworks.push(new FWParticle(this.x, this.y, '#ffffff'));
      } else if (this.isRed) {
         setScoreRef(getScoreRef() + 5); 
      } else {
         setScoreRef(getScoreRef() + 1);
      }
      
      // setScore throttled in animate loop
      
      if (getScoreRef() > 50 && getScoreRef() % 50 === 0 && getScoreRef() !== getLastMilestoneRef().current) {
        getLastMilestoneRef().current = getScoreRef();
        triggerGsapMilestone(this.x, this.y);
      }

      splashes.push(new Splash(this.x, this.y, this.isRed, this.isWhite));
      for (let i = 0; i < 6; i++) {
        miniParticles.push(new MiniP(this.x, this.y, this.isRed, this.isWhite ? '#ffffff' : null));
      }
    }
  };
  Drop.prototype.draw = function (ctx) {
    ctx.beginPath();
    if (this.isBomb) {
       ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
       ctx.fillStyle = '#111';
       ctx.fill();
       ctx.strokeStyle = '#ff0000';
       ctx.lineWidth = 1.5;
       ctx.stroke();
       ctx.beginPath();
       ctx.moveTo(this.x, this.y - this.radius * 1.5);
       ctx.lineTo(this.x + 3, this.y - this.radius * 2.5);
       ctx.strokeStyle = '#fff';
       ctx.stroke();
    } else {
       const stretch = Math.min(this.vy * 1.2, this.radius * 5);
       ctx.arc(this.x, this.y, this.radius, 0, Math.PI);
       ctx.lineTo(this.x, this.y - stretch);
       ctx.fillStyle = this.color;
       ctx.fill();
    }
    ctx.closePath();
    
    // Fake Glow
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
    if (this.isWhite) ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    else if (this.isBomb) ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    else ctx.fillStyle = this.isRed ? 'rgba(235, 63, 63, 0.15)' : 'rgba(235, 215, 63, 0.15)';
    ctx.fill();
    ctx.closePath();
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
        const ns = Math.max(0, getScopeScoreRef() - 10); setScopeScoreRef(ns);
      }
      return;
    }
    if (this.y + this.radius >= pad.y - pad.h / 2 && this.y - this.radius <= pad.y + pad.h / 2 && this.x >= pad.x - pad.w / 2 && this.x <= pad.x + pad.w / 2) {
      this.markedForDeletion = true;
      if (this.type === "creep") { setGameState("failed"); setScopeScore(getScopeScoreRef()); for (let i = 0; i < 30; i++) fireworks.push(new FWParticle(this.x, this.y, "#f33")); }
      else if (this.type === "burnout") { pad.w = Math.max(40, pad.w - 30); fireworks.push(new Shockwave(this.x, this.y, "#f80")); }
      else if (this.type === "feedback") { pad.reversed = true; pad.reverseTimer = 5000; fireworks.push(new Shockwave(this.x, this.y, "#f0f")); }
      else if (this.type === "coffee") {
        pad.speedMult = 2; pad.speedTimer = 5000;
        const ns = getScopeScoreRef() + 20; setScopeScoreRef(ns);
        fireworks.push(new Shockwave(this.x, this.y, "#3f3"));
      } else {
        const ns = getScopeScoreRef() + 10; setScopeScoreRef(ns);
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
  let lastScoreRenderTime = 0;
  let lastRenderedScore = -1;
  let lastRenderedScopeScore = -1;

  function animate() {
    const ag = getActiveGameRef();
    const now = Date.now();
    if (now - lastScoreRenderTime > 200) {
       const cs = getScoreRef();
       const css = getScopeScoreRef();
       if (cs !== lastRenderedScore) { setScore(cs); lastRenderedScore = cs; }
       if (css !== lastRenderedScopeScore) { setScopeScore(css); lastRenderedScopeScore = css; }
       lastScoreRenderTime = now;
    }
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

    // Dynamic Module Routing
    let justSwitched = false;
    if (ag !== lastActive) {
      if (activeModule) {
        activeModule.destroy();
        activeModule = null;
      }
      
      if (ag === 'pendulum') activeModule = new PendulumGame(logicalCanvas, callbacks);
      else if (ag === 'gravity') activeModule = new GravityFlip(logicalCanvas, callbacks);
      else if (ag === 'mandala') activeModule = new MandalaMaker(logicalCanvas, callbacks);
      else if (ag === 'slingshot') activeModule = new SlingshotNinja(logicalCanvas, callbacks);
      else if (ag === 'sandbox') activeModule = new LiquidSandbox(logicalCanvas, callbacks);
      else if (ag === 'bullethell') activeModule = new BulletHell(logicalCanvas, callbacks);
      else if (ag === 'tanks') activeModule = new PocketTanks(logicalCanvas, callbacks);
      else if (ag === 'nodeweaver') activeModule = new NodeWeaver(logicalCanvas, callbacks);
      else if (ag === 'looper') activeModule = new HarmonicLooper(logicalCanvas, callbacks);
      else if (ag === 'beats') activeModule = new BeatMaker(logicalCanvas, callbacks);
      else if (ag === 'neonpac') activeModule = new NeonPac(logicalCanvas, callbacks);
      else if (ag === 'bombercrazy') activeModule = new BomberCrazy(logicalCanvas, callbacks);
      else if (ag === 'neondevil') activeModule = new NeonDevil(logicalCanvas, callbacks);
      
      lastActive = ag;
      justSwitched = true;
    }

    if (activeModule) {
      activeModule.update();
      activeModule.draw();
    } else {
        // ---- ORIGINAL HARDCODED GAMES ----
      if (ag === "breaker" && justSwitched) initBreaker(getBreakLevelRef());
      else if (ag === "scope" && justSwitched) initScope();
      else if (ag === "dripp" && justSwitched) { drops = []; splashes = []; }
      else if (ag === "snake" && justSwitched) { if(window.initSnakeGame) window.initSnakeGame(); }
      else if (ag === "pong" && justSwitched) { if(window.initPongGame) window.initPongGame(); }
      else if (ag === "runner" && justSwitched) { if(window.initRunnerGame) window.initRunnerGame(); }
      else if (ag === "invaders" && justSwitched) initInvaders();
      else if (ag === "simon" && justSwitched) initSimon();

      // Dripp logic
      if (ag === "dripp") {
        let baseIntensity = 0.025; 
        let scaling = Math.log10(1 + getScoreRef() / 300) * 0.1;
        
        if (!isMobile) {
           baseIntensity = 0.04;
           scaling = Math.log10(1 + getScoreRef() / 150) * 0.15;
        }
        
        const rainIntensity = Math.min(0.25, baseIntensity + scaling);
        const spawnAttempts = 1; 
        
        for (let i = 0; i < spawnAttempts; i++) {
           if (Math.random() < rainIntensity) drops.push(new Drop(Math.random() < 0.15));
           if (Math.random() < rainIntensity * 0.15) drops.push(new Drop(Math.random() < 0.15));
        }

        if (drops.length === 0 && getGameStateRef() === 'playing' && !getIsPausedRef()) {
           drops.push(new Drop(Math.random() < 0.15));
        }
        
        const glowGrad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/1.5);
        glowGrad.addColorStop(0, 'rgba(235, 215, 63, 0.05)');
        glowGrad.addColorStop(1, 'transparent');
        
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        drops.forEach(o => o.update());
        drops.forEach(o => o.draw(ctx));
        drops = drops.filter(o => !o.markedForDeletion);
        
        splashes.forEach(s => s.update());
        splashes.forEach(s => s.draw(ctx));
        splashes = splashes.filter(s => !s.markedForDeletion);
        
        const mx = getMouseRef().x, my = getMouseRef().y;
        const hitRadius = getCursorActiveRef() ? 40 : (isMobile ? 60 : 35);
        
        ctx.beginPath(); ctx.arc(mx, my, hitRadius * 0.6, 0, Math.PI*2);
        ctx.fillStyle = '#ebd73f';
        ctx.fill();
        
        ctx.beginPath(); ctx.arc(mx, my, hitRadius, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(235, 215, 63, 0.15)';
        ctx.fill();
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
          
          if(head.x < 0) head.x = gridX - 1;
          if(head.x >= gridX) head.x = 0;
          if(head.y < 0) head.y = gridY - 1;
          if(head.y >= gridY) head.y = 0;
          
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
                  triggerGsapMilestone(head.x*25, head.y*25);
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
        
        const aiSpeed = 3 + getScoreRef() * 0.5;
        if (pongAI + 40 < pongBall.y) pongAI += aiSpeed;
        if (pongAI + 40 > pongBall.y) pongAI -= aiSpeed;
        pongAI = clamp(pongAI, 0, canvas.height - 80);

        pongBall.x += pongBall.vx;
        pongBall.y += pongBall.vy;
        
        pongTrails.push({x: pongBall.x, y: pongBall.y, alpha: 1});
        
        if (pongBall.y < 0 || pongBall.y > canvas.height) pongBall.vy *= -1;
        
        if (pongBall.x < 40 && pongBall.x > 20 && pongBall.y > py && pongBall.y < py + 80) {
          pongBall.vx *= -1.1; 
          pongBall.vy += (pongBall.y - (py + 40)) * 0.1;
          pongBall.x = 40;
          setScoreRef(getScoreRef() + 1); setScore(getScoreRef());
          triggerGsapMilestone(pongBall.x, pongBall.y);
        }
        
        if (pongBall.x > canvas.width - 40 && pongBall.x < canvas.width - 20 && pongBall.y > pongAI && pongBall.y < pongAI + 80) {
          pongBall.vx *= -1;
          pongBall.x = canvas.width - 40;
        }
        
        if (pongBall.x < 0) {
           setGameState("failed");
        } else if (pongBall.x > canvas.width) {
           pongBall.x = canvas.width/2; pongBall.vx = -6;
        }
        
        ctx.fillStyle = '#ff00ff';
        pongTrails.forEach((t, i) => {
           t.alpha -= 0.05;
           ctx.globalAlpha = Math.max(0, t.alpha);
           if (t.alpha > 0) {
              ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(0.1, pongBall.r * t.alpha), 0, Math.PI*2); ctx.fill();
           }
        });
        pongTrails = pongTrails.filter(t => t.alpha > 0);
        ctx.globalAlpha = 1;
        
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff00ff';
        ctx.fillRect(20, py, 10, 80); 
        ctx.fillRect(canvas.width - 30, pongAI, 10, 80);
        
        ctx.beginPath(); ctx.arc(pongBall.x, pongBall.y, pongBall.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Coming Soon placeholders
      if (ag === "cyber_racer" || ag === "neon_blocks") {
        ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ebd73f";
        ctx.font = "bold 40px 'Panchang', sans-serif";
        ctx.textAlign = "center";
        ctx.shadowBlur = 20; ctx.shadowColor = "#ebd73f";
        ctx.fillText("COMING SOON", canvas.width/2, canvas.height/2);
        ctx.shadowBlur = 0;
      }

      // Runner logic
      if (ag === "runner") {
        ctx.fillStyle = "rgba(5,5,5,0.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const ground = canvas.height - 100;

        runnerState.vy += 0.8;
        runnerState.y += runnerState.vy;
        if (runnerState.y >= ground) {
          runnerState.y = ground;
          runnerState.vy = 0;
        }

        if (runnerState.y === ground && getCursorActiveRef()) {
          runnerState.vy = -16;
          callbacks.setCursorActiveRef(false);
        }

        runnerState.frame++;
        if (runnerState.frame % 60 === 0 && Math.random() < (0.5 + getScoreRef() * 0.01)) {
          runnerObs.push({x: canvas.width, y: ground, w: 20, h: rnd(30, 80), speed: 6 + getScoreRef()*0.1});
        }

        ctx.strokeStyle = '#ff9900'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, ground + 20); ctx.lineTo(canvas.width, ground + 20); ctx.stroke();

        ctx.fillStyle = '#ebd73f'; ctx.shadowBlur = 15; ctx.shadowColor = '#ebd73f';
        ctx.beginPath(); ctx.arc(100, runnerState.y, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = '#ff3333';
        for (let i = runnerObs.length - 1; i >= 0; i--) {
          let o = runnerObs[i];
          o.x -= o.speed;
          ctx.fillRect(o.x, o.y - o.h + 20, o.w, o.h);

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
        
        if (invKeys['ArrowLeft']) invPlayer.x -= 8;
        if (invKeys['ArrowRight']) invPlayer.x += 8;
        invPlayer.x = clamp(invPlayer.x, 0, canvas.width - invPlayer.w);

        invFrame++;
        if (invKeys[' '] && invFrame % 10 === 0) {
          invLasers.push({x: invPlayer.x + invPlayer.w/2, y: canvas.height - 80, vy: -15});
        }

        if (invFrame % Math.max(20, 60 - Math.floor(getScoreRef()/10)) === 0) {
          invaders.push({x: rnd(20, canvas.width - 40), y: -30, w: 30, h: 30, vy: 2 + getScoreRef()*0.05, hp: 1});
        }

        ctx.fillStyle = '#ebd73f'; ctx.shadowBlur = 10; ctx.shadowColor = '#ebd73f';
        ctx.fillRect(invPlayer.x, canvas.height - 70, invPlayer.w, invPlayer.h);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        for (let i = invLasers.length - 1; i >= 0; i--) {
          let l = invLasers[i];
          l.y += l.vy;
          ctx.fillRect(l.x - 2, l.y, 4, 15);
          if (l.y < -20) invLasers.splice(i, 1);
        }

        ctx.fillStyle = '#eb3f3f'; ctx.shadowBlur = 10; ctx.shadowColor = '#eb3f3f';
        for (let i = invaders.length - 1; i >= 0; i--) {
          let inv = invaders[i];
          inv.y += inv.vy;
          ctx.fillRect(inv.x, inv.y, inv.w, inv.h);
          
          if (inv.y > canvas.height) {
             setGameState("failed");
          }

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
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        const colors = ['#ff3366', '#33ccff', '#ebd73f', '#33ff33'];
        const pads = [
           {x: 0, y: 0, w: cx, h: cy},
           {x: cx, y: 0, w: cx, h: cy},
           {x: 0, y: cy, w: cx, h: cy},
           {x: cx, y: cy, w: cx, h: cy}
        ];
        
        if (simonState === "showing") {
           simonTimer--;
           if (simonTimer <= 0) {
              simonActiveBtn = simonSeq[simonPlayerSeq.length];
              simonTimer = 40;
              simonPlayerSeq.push(-1); 
           } else if (simonTimer === 10) {
              simonActiveBtn = -1;
           }
           
           if (simonPlayerSeq.length > simonSeq.length) {
              simonState = "waiting";
              simonPlayerSeq = [];
              simonActiveBtn = -1;
           }
        } else if (simonState === "success") {
           simonTimer--;
           if (simonTimer <= 0) {
              simonSeq.push(Math.floor(Math.random() * 4));
              simonState = "showing";
              simonPlayerSeq = [];
              simonTimer = 60;
           }
        }
        
        pads.forEach((p, i) => {
           const isActive = simonActiveBtn === i || (simonState === "success" && simonTimer % 20 > 10);
           ctx.fillStyle = isActive ? colors[i] : 'transparent';
           ctx.fillRect(p.x, p.y, p.w, p.h);
           
           ctx.strokeStyle = isActive ? '#fff' : colors[i];
           ctx.lineWidth = isActive ? 5 : 2;
           ctx.globalAlpha = isActive ? 1 : 0.3;
           ctx.strokeRect(p.x + 10, p.y + 10, p.w - 20, p.h - 20);
           ctx.globalAlpha = 1;
        });
        
        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px 'Panchang', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(simonState === "showing" ? "WATCH" : simonState === "waiting" ? "REPEAT" : "NICE!", cx, cy);
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
        // ---- END ORIGINAL HARDCODED GAMES ----
    }

    // Common particles
    miniParticles.forEach(p => { p.update(); p.draw(ctx); }); miniParticles = miniParticles.filter(p => !p.markedForDeletion);
    fireworks.forEach(f => { f.update(); f.draw(ctx); }); fireworks = fireworks.filter(f => !f.markedForDeletion);

    animId = requestAnimationFrame(animate);
  }

  animate();

  function handleKeyDown(e) {
    if (activeModule && activeModule.handleKeyDown) {
      activeModule.handleKeyDown(e);
      return;
    }
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
    if (activeModule && activeModule.handleKeyUp) {
      activeModule.handleKeyUp(e);
      return;
    }
    const ag = getActiveGameRef();
    if (ag === "invaders") {
      invKeys[e.key] = false;
    }
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function handlePointerDown(e) {
    if (activeModule && activeModule.handlePointerDown) {
      activeModule.handlePointerDown(e);
      return;
    }
    callbacks.setCursorActiveRef(true);
    const ag = getActiveGameRef();
    if (ag === "simon" && simonState === "waiting") {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      if (clientX == null || clientY == null) return;
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const cx = canvas.width/2;
      const cy = canvas.height/2;
      
      let btn = -1;
      if (x < cx && y < cy) btn = 0; // Top-Left
      if (x >= cx && y < cy) btn = 1; // Top-Right
      if (x < cx && y >= cy) btn = 2; // Bottom-Left
      if (x >= cx && y >= cy) btn = 3; // Bottom-Right
      
      if (btn !== -1) {
        simonActiveBtn = btn;
        simonPlayerSeq.push(btn);
        
        if (simonPlayerSeq[simonPlayerSeq.length - 1] !== simonSeq[simonPlayerSeq.length - 1]) {
           simonState = "failed";
           setGameState("failed");
        } else if (simonPlayerSeq.length === simonSeq.length) {
           simonState = "success";
           simonTimer = 60;
           setScoreRef(simonSeq.length); setScore(simonSeq.length);
        }
        
        setTimeout(() => { if (simonState === "waiting") simonActiveBtn = -1; }, 200);
      }
    }
  }
  function handlePointerUp(e) {
    if (activeModule && activeModule.handlePointerUp) {
      activeModule.handlePointerUp(e);
    }
  }

  function handlePointerMove(e) {
    if (activeModule && activeModule.handlePointerMove) {
      activeModule.handlePointerMove(e);
    }
  }

  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointermove', handlePointerMove);

  return {
    destroy() {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handlePointerMove);
    },
    restart() {
      lastActive = null;
    },
    handlePointerDown,
    milestone,
  };
}

// ─── HELP TEXT PROVIDER ────────────────────────────────────────────────────────

const HelpBrief = ({ controls, howToPlay, scoreSystem, powerups }) => (
  <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }}>
    <div>
      <h4 style={{ color: '#ebd73f', margin: '0 0 4px 0', fontSize: '0.85rem', fontFamily: "'Panchang', sans-serif", letterSpacing: '1px' }}>CONTROLS</h4>
      <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{controls}</p>
    </div>
    <div>
      <h4 style={{ color: '#ebd73f', margin: '0 0 4px 0', fontSize: '0.85rem', fontFamily: "'Panchang', sans-serif", letterSpacing: '1px' }}>HOW TO PLAY</h4>
      <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{howToPlay}</p>
    </div>
    {scoreSystem && (
    <div>
      <h4 style={{ color: '#ebd73f', margin: '0 0 4px 0', fontSize: '0.85rem', fontFamily: "'Panchang', sans-serif", letterSpacing: '1px' }}>SCORE SYSTEM</h4>
      <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{scoreSystem}</p>
    </div>
    )}
    {powerups && (
    <div>
      <h4 style={{ color: '#ebd73f', margin: '0 0 4px 0', fontSize: '0.85rem', fontFamily: "'Panchang', sans-serif", letterSpacing: '1px' }}>POWERUPS & HAZARDS</h4>
      <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{powerups}</p>
    </div>
    )}
  </div>
);

const getHelpText = (game) => {
  switch (game) {
    case 'dripp':
      return <HelpBrief 
        controls="Move your mouse or drag your finger across the screen to guide the golden catcher ring." 
        howToPlay="Intercept the falling liquid drops before they pass the bottom of the screen. The rain gets heavier and faster the longer you survive. Missing drops doesn't hurt, but you want that high score!" 
        scoreSystem="Red Drops = +5 Points. Rare White Drops = +69 Points. Normal Drops = +1 Point." 
        powerups="Black Bombs (Hazard): Hitting a black spiked bomb causes instant death. Dodge them!"
      />;
    case 'breaker':
      return <HelpBrief 
        controls="Move your mouse horizontally to control the paddle." 
        howToPlay="Keep the bouncing ball in play and smash all the neon target rings to advance levels. The game speeds up as you progress." 
        scoreSystem="Breaking bricks awards points based on the current level speed multiplier." 
        powerups="Blue Pills: Expands your paddle width. Yellow Pills: Spawns an extra ball (Multiball). Red Pills (Hazard): Shrinks your paddle or speeds up the ball dangerously."
      />;
    case 'scope':
      return <HelpBrief 
        controls="Move your mouse to slide your horizontal paddle." 
        howToPlay="Fast-moving targets will rain from the sky. You must intercept every single one. Missing even one target results in game over." 
        scoreSystem="Each intercepted drop awards points. Game speed scales infinitely over time." 
        powerups="No powerups available. Pure reaction and speed required."
      />;
    case 'snake':
      return <HelpBrief 
        controls="Move your mouse in any direction to guide the snake's head." 
        howToPlay="Navigate the grid to eat glowing food orbs and grow longer. Do not hit the edges of the screen or collide with your own tail." 
        scoreSystem="Eating food increases your length and score. Surviving longer yields multiplier points." 
        powerups="Glowing Orbs: Growth and points. Red Orbs (Hazard): Temporarily inverts your mouse controls—causing massive confusion!"
      />;
    case 'pong':
      return <HelpBrief 
        controls="Move your mouse vertically to maneuver your paddle." 
        howToPlay="Defend your side of the screen against the relentless AI opponent. The ball speed increases dramatically with every volley. Sneak the ball past the AI to score." 
        scoreSystem="The first to miss a volley loses. High scores are based on your consecutive wins." 
        powerups="No powerups. A true test of precision and endurance."
      />;
    case 'runner':
      return <HelpBrief 
        controls="Click or tap anywhere to Jump. Click again while in mid-air to Double Jump." 
        howToPlay="Your character automatically runs forward. Time your jumps perfectly to dodge incoming geometric obstacles, clear tall walls, and avoid falling into gaps." 
        scoreSystem="Score increases automatically based on your total distance traveled." 
        powerups="No powerups. Focus on perfectly timing your double jumps."
      />;
    case 'invaders':
      return <HelpBrief 
        controls="Move mouse to pilot your ship. Click or tap to shoot upward lasers." 
        howToPlay="Defend the bottom of the screen from descending alien grids. Shoot them down before they breach your defenses. They move faster as their numbers thin." 
        scoreSystem="Destroying aliens grants points. Clearing waves increases the difficulty and your score multiplier." 
        powerups="No powerups. Classic arcade survival rules."
      />;
    case 'simon':
      return <HelpBrief 
        controls="Click or tap the colored quadrants." 
        howToPlay="Observe and memorize the sequence of flashing colors and sounds, then repeat it back perfectly. The sequence gets one step longer every round." 
        scoreSystem="Your score equals the number of total rounds successfully completed." 
        powerups="No powerups. Relies entirely on your memory."
      />;
    case 'pendulum':
      return <HelpBrief 
        controls="Click and hold anywhere to shoot a grapple line to the ceiling. Release to let go." 
        howToPlay="Swing using momentum to navigate through moving vertical neon pillars. Avoid hitting the solid structures." 
        scoreSystem="Distance traveled continuously grants points." 
        powerups="Cyan Neon Orbs: Grants a massive +50 point boost when collected."
      />;
    case 'gravity':
      return <HelpBrief 
        controls="Click or tap anywhere to instantly reverse gravity (flip between ceiling and floor)." 
        howToPlay="Navigate the high-speed tunnel by flipping gravity to dodge the dynamic rotating and oscillating neon blocks in your path." 
        scoreSystem="Distance tracked in meters (and kilometers) based on survival time." 
        powerups="No powerups. Fast-paced visual progression with shifting neon colors as you go further."
      />;
    case 'looper':
      return <HelpBrief 
        controls="Click or drag anywhere on the canvas." 
        howToPlay="Spawn ripples and bouncing dots that interact with the borders to create harmonic ambient visuals." 
        scoreSystem="No score. Just relax and watch the loops." 
        powerups="None. A pure meditative audio-visual experience."
      />;
    case 'beats':
      return <HelpBrief 
        controls="Click any cell on the grid to toggle a note. Use the UI buttons to Play, Pause, or Clear." 
        howToPlay="Create your own drum beats and synth melodies using the 16-step sequencer. The playhead moves left to right, triggering active cells." 
        scoreSystem="No score. Express your musical creativity." 
        powerups="None. You are the DJ."
      />;
    case 'slingshot':
      return <HelpBrief 
        controls="Click, drag backwards, and release to slingshot your cyber-ninja across the screen." 
        howToPlay="Slice through cyan targets to survive. You must defend the bottom glowing red line! If any target crosses it, game over. Bouncing off walls breaks your combo." 
        scoreSystem="Slicing targets grants points. Chaining multiple kills without hitting walls builds a massive score multiplier." 
        powerups="Cyan 'S' Sphere: Triggers extreme Bullet-Time Slowmo. Red 'N' Sphere: Detonates a screen-clearing nuke. Dark Red Spiked Bombs (Hazard): Instant Death upon touch!"
      />;
    case 'bullethell':
      return <HelpBrief 
        controls="Move your mouse or finger to pilot your neon core. Your movement is 1:1 with zero latency." 
        howToPlay="Dodge massive, overwhelming waves of intricate laser patterns. You must directly smash your core into the Boss to deal damage and deplete its jelly health bar." 
        scoreSystem="None. Pure Boss Rush survival. Defeat bosses to advance to harder phases." 
        powerups="Blue 'S' (Shield): Deflects lasers back at the boss for massive damage. Orange 'F' (Frenzy): 3x damage at blazing speeds. Red 'N' (Nuke): Clears all lasers instantly."
      />;
    case 'tanks':
      return <HelpBrief 
        controls="Use the bottom left controls to fine-tune your angle and power, or just click and drag the tank directly. Click the huge FIRE orb or press SPACEBAR to shoot. Use the carousel to swap weapons!" 
        howToPlay="Turn-based artillery combat! Destroy the opponent before they destroy you. The terrain is completely destructible." 
        scoreSystem="Each match is a 1v1 fight to the death. No points, just glory." 
        powerups="You spawn with a random arsenal of crazy weapons (Sniper, Boomerang, Black Hole, Volcanic, and more!). Choose wisely."
      />;
    case 'neonpac':
      return <HelpBrief 
        controls="Move your mouse or drag your finger anywhere. The cyber-entity will follow your cursor smoothly." 
        howToPlay="Navigate the neon grid to collect all the data dots. Avoid the swarming virus ghosts. The game infinitely scales in difficulty with new waves of dots and smarter ghosts." 
        scoreSystem="Small dots grant points. Eating large power nodes grants massive points and allows you to eat ghosts for huge bonuses." 
        powerups="Glowing White Nodes (Power Pellet): Grants temporary invincibility and speed, allowing you to consume ghosts for 200 points each."
      />;
    case 'bombercrazy':
      return <HelpBrief 
        controls="Use Arrow Keys or W,A,S,D to move and Spacebar to drop bombs. On mobile, tap the screen edges to move and center to drop bombs." 
        howToPlay="Trap the chasing enemy programs by strategically placing bombs in their path. Bombs explode in a cross pattern after a short fuse." 
        scoreSystem="Destroying enemies grants points. Higher levels increase enemy speed and spawn rates." 
        powerups="Bombs can trigger chain reactions if their blast radii overlap. Use this to clear massive areas of the board at once!"
      />;
    case 'neondevil':
      return <HelpBrief 
        controls="Use W,A,S,D or Arrow Keys to move and jump. On mobile, use the on-screen glowing touch zones." 
        howToPlay="A brutal 'endless' troll platformer. Reach the green glowing portal to win. Nothing is as it seems. Floors will drop, ceilings will crush you, and spikes will move. Good luck finding the 'final' level." 
        powerups="None. Trust nothing. Memorize the traps to survive."
      />;
    case 'mandala':
      return <HelpBrief 
        controls="Click and drag to draw." 
        howToPlay="A relaxing Zen mode. Your cursor acts as a mirrored brush that creates beautiful, symmetrical neon mandalas. Release to reset the brush hue." 
      />;
    case 'liquid':
      return <HelpBrief 
        controls="Click and drag through the particles." 
        howToPlay="A relaxing Zen mode. Interact with thousands of fluid particles. Stir them around, create vortexes, and watch the fluid dynamics." 
      />;
    case 'nodeweaver':
      return <HelpBrief 
        controls="Move your cursor near the nodes." 
        howToPlay="A relaxing Zen mode. Guide floating orbs to connect them into intricate webs of light. Watch them pulse with energy." 
      />;
    case 'looper':
      return <HelpBrief 
        controls="Click the concentric rings." 
        howToPlay="A relaxing Zen mode. Tap different rings to trigger expanding visual ripples and create your own ambient harmonic soundscape." 
      />;
    default:
      return <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Move your cursor or tap to interact. Try to score as many points as possible without losing!</p>;
  }
};

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
  const [isMuted, setIsMuted] = useState(false);
  const isPausedRef = useRef(false);
  const [bgmVolume, setBgmVolume] = useState(1.0);
  const [sfxVolume, setSfxVolume] = useState(1.0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [showRetryTooltip, setShowRetryTooltip] = useState(false);

  // Sandbox UI state
  const [sandboxBrush, setSandboxBrush] = useState(1);
  const [sandboxAuto, setSandboxAuto] = useState(true);
  const [showGameOverHelp, setShowGameOverHelp] = useState(false);

  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorActiveRef = useRef(false);
  const lastMilestoneRef = useRef(0);
  const isMountedRef = useRef(false); // Skip first-render effect execution
  const audioRef = useRef(null);

  const checkIsHighScore = () => {
    let currentScore = score;
    if (activeGame === "breaker") currentScore = breakerScore;
    if (activeGame === "scope") currentScore = scopeScore;

    if (activeGame === 'dripp') {
      const globalBest = parseInt(localStorage.getItem('dripp_highScore') || '0', 10);
      return currentScore >= globalBest && currentScore > 0;
    }
    const localBest = parseInt(localStorage.getItem(`dripp_${activeGame}_highScore`) || '0', 10);
    return currentScore >= localBest && currentScore > 0;
  };

  const handleBrag = async () => {
    let bragScore = score;
    if (activeGame === "breaker") bragScore = breakerScore;
    if (activeGame === "scope") bragScore = scopeScore;
    
    const gameNamesMap = {
      breaker: "NEON BREAKER", scope: "SCOPE CREEP", pendulum: "NEON PENDULUM", gravity: "GRAVITY FLIP", slingshot: "SLINGSHOT NINJA", bullethell: "BULLET HELL", tanks: "POCKET TANKS", sandbox: "LIQUID LIGHT", liquid: "LIQUID LIGHT", mandala: "MANDALA MAKER", nodeweaver: "ZEN NODE WEAVER", looper: "HARMONIC LOOPER", beats: "NEON BEATS", neondevil: "NEON DEVIL", snake: "NEON SNAKE", pong: "NEON PONG", runner: "CYBER RUNNER", invaders: "SPACE INVADERS", simon: "NEON SIMON", bombercrazy: "BOMBER CRAZY", dripp: "DRIPP DROP"
    };
    const prettyName = gameNamesMap[activeGame] || activeGame.toUpperCase();

    const isTopRecord = checkIsHighScore();
    if (isTopRecord && activeGame !== 'dripp') {
      localStorage.setItem(`dripp_${activeGame}_highScore`, bragScore.toString());
    }

    await shareScoreImage(bragScore, prettyName, isTopRecord);
  };

  useEffect(() => {
     audioRef.current = new RetroAudio();
     return () => audioRef.current.stopBGM();
  }, []);

  const initAudio = () => {
     if (audioRef.current) audioRef.current.init();
  };

  // Sync refs
  useEffect(() => { activeGameRef.current = activeGame; }, [activeGame]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  useEffect(() => {
    if (activeGame !== "none") {
      setIsHelpOpen(true);
      setIsPaused(true);
      
      initAudio();
      if (['looper', 'beats', 'liquid', 'mandala', 'nodeweaver'].includes(activeGame)) {
         audioRef.current.playBGM('zen');
      } else if (['bullethell'].includes(activeGame)) {
         audioRef.current.playBGM('boss');
      } else if (activeGame === 'neondevil') {
         audioRef.current.playBGM('devil');
      } else if (activeGame === 'bombercrazy') {
         audioRef.current.playBGM('bomber');
      } else if (activeGame === 'pockettanks') {
         audioRef.current.playBGM('tanks');
      } else {
         audioRef.current.playBGM('arcade');
      }
    } else {
      if (audioRef.current) audioRef.current.stopBGM();
    }
  }, [activeGame]);

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

    const moveCursor = (e) => {
      if (e.clientX !== undefined) mouseRef.current = { x: e.clientX, y: e.clientY };
      if (e.touches && e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        const cursorElem = document.querySelector(".cursor");
        if (cursorElem) cursorElem.style.display = "none";
      }
      const cursorElem = document.querySelector(".cursor");
      if (cursorElem && cursorElem.style.display !== "none") {
        gsap.to(cursorElem, { x: mouseRef.current.x, y: mouseRef.current.y, xPercent: -50, yPercent: -50, duration: 0.05, ease: "power3.out" });
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
      setCursorActiveRef: (v) => { cursorActiveRef.current = v; },
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
      playSound: (type) => { if (audioRef.current) audioRef.current.playSFX(type); },
      playBGM: (type) => { if (audioRef.current) audioRef.current.playBGM(type); },
      stopBGM: () => { if (audioRef.current) audioRef.current.stopBGM(); },
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

  const handleSandboxBrush = (brushId) => {
     setSandboxBrush(brushId);
     setSandboxAuto(false);
     if (window.sandboxModule) {
         window.sandboxModule.currentElement = brushId;
         window.sandboxModule.autoSwitch = false;
     }
  };

  const handleSandboxAuto = () => {
     const next = !sandboxAuto;
     setSandboxAuto(next);
     if (window.sandboxModule) {
         window.sandboxModule.autoSwitch = next;
     }
  };

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

  const gameNamesMap = {
    breaker: "NEON BREAKER",
    scope: "SCOPE CREEP",
    pendulum: "NEON PENDULUM",
    gravity: "GRAVITY FLIP",
    slingshot: "SLINGSHOT NINJA",
    bullethell: "BULLET HELL",
    tanks: "POCKET TANKS",
    sandbox: "LIQUID LIGHT",
    liquid: "LIQUID LIGHT",
    mandala: "MANDALA MAKER",
    nodeweaver: "ZEN NODE WEAVER",
    looper: "HARMONIC LOOPER",
    beats: "NEON BEATS",
    neondevil: "NEON DEVIL",
    snake: "NEON SNAKE",
    pong: "NEON PONG",
    runner: "CYBER RUNNER",
    invaders: "SPACE INVADERS",
    simon: "NEON SIMON",
    bombercrazy: "BOMBER CRAZY",
    dripp: "DRIPP DROP"
  };
  const gameName = gameNamesMap[activeGame] || "DRIPP DROP";
  const isCreativeGame = ['sandbox', 'mandala', 'nodeweaver', 'looper', 'beats'].includes(activeGame);

  return (
    <div ref={containerRef} style={{ width: "100vw", height: "100vh", position: "relative", overflow: "hidden", background: "#050505", fontFamily: "'Clash Display', sans-serif" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Top Left: Pause & Help Buttons */}
      <div style={{ position: "absolute", top: "30px", left: "30px", display: "flex", gap: "10px", zIndex: 100 }}>
        <button onClick={() => setIsPaused(p => !p)} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          {isPaused ? "▶" : "||"}
        </button>
        <button onClick={() => { setIsHelpOpen(true); setIsPaused(true); }} style={{ height: "40px", borderRadius: "20px", padding: "0 15px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "white", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", fontFamily: "'Clash Display', sans-serif", letterSpacing: "1px", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>?</span> HOW TO PLAY
        </button>
      </div>

      {/* Bottom Right: Exact Score HUD */}
      {activeGame !== "none" && activeGame !== "cyber_racer" && activeGame !== "neon_blocks" && activeGame !== "bullethell" && activeGame !== "tanks" && !isCreativeGame && (
        <div style={{ position: "absolute", bottom: "30px", right: "30px", textAlign: "right", pointerEvents: "none", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "5px" }}>
             {activeGame === "simon" ? "ROUND" : (activeGame === "snake" || activeGame === "slingshot") ? "SCORE" : activeGame === "gravity" ? "DISTANCE" : "SCORE"}
          </div>
          <div className="score-counter-element" style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--brand-yellow)", lineHeight: 1, textShadow: "0 0 20px rgba(235,215,63,.4)" }}>
             {activeGame === "scope" ? scopeScore : activeGame === "breaker" ? breakerScore : (activeGame === "gravity" ? (score > 999 ? (score / 1000).toFixed(1) + "km" : score + "m") : score)}
          </div>
          {activeGame === "dripp" && (
            <div style={{ fontSize: "0.6rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginTop: "15px", whiteSpace: "pre-line" }}>
              KEEP SCORING TO LEVEL UP{"\n"}
              <span style={{ color: "#eb3f3f" }}>CAUTION: AVOID BOMBS</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Left: Controls */}
      <div style={{ position: "absolute", bottom: "30px", left: "30px", display: "flex", gap: "15px", alignItems: "center", zIndex: 100 }}>
        {/* Gamepad Icon (Return to Menu) */}
        <button onClick={() => { setActiveGame("none"); if (onClose) onClose(); }} style={{ width: "45px", height: "45px", borderRadius: "50%", background: "transparent", border: "1px solid rgba(235,215,63,0.5)", color: "#ebd73f", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.transform = "scale(1.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "scale(1)"; }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
          </svg>
        </button>
      </div>

      {/* Sandbox Toolbar (Vertical Left) */}
      {activeGame === "sandbox" && (
        <div style={{
          position: "absolute", top: "50%", left: "30px", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: "10px", alignItems: "center", zIndex: 100,
          background: "rgba(10, 10, 10, 0.4)", backdropFilter: "blur(10px)",
          padding: "20px 15px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
        }}>
          <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", marginBottom: "5px", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>TOOLS</div>
          
          {[
            { id: 1, name: "SAND", color: "#ebd73f", desc: "Classic falling sand. Piles up naturally." },
            { id: 2, name: "WATER", color: "#00d2ff", desc: "Flowing liquid. Puts out fire and cools lava." },
            { id: 3, name: "WALL", color: "#b366ff", desc: "Indestructible solid barrier." },
            { id: 4, name: "CLOUD", color: "#e0f7fa", desc: "Floats upwards. Condenses into rain." },
            { id: 5, name: "GRASS", color: "#39ff14", desc: "Organically grows upwards. Highly flammable." },
            { id: 6, name: "WOOD", color: "#8b5a2b", desc: "Solid structure. Burns slowly when exposed to fire." },
            { id: 7, name: "FIRE", color: "#ff5722", desc: "Intense heat. Burns wood/grass and boils water." },
            { id: 8, name: "LAVA", color: "#ff0000", desc: "Heavy glowing liquid. Sets things on fire." },
            { id: 9, name: "STEAM", color: "#cccccc", desc: "Floats up rapidly and dissipates into the air." },
            { id: 10, name: "STONE", color: "#555555", desc: "Heavy solid mass. Formed by mixing lava and water." }
          ].map(brush => (
            <div key={brush.id} style={{ position: "relative" }}>
              <button onClick={() => handleSandboxBrush(brush.id)}
                style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: brush.color, 
                  border: (!sandboxAuto && sandboxBrush === brush.id) ? "3px solid #fff" : "2px solid transparent",
                  cursor: "pointer", transition: "all 0.2s ease",
                  boxShadow: (!sandboxAuto && sandboxBrush === brush.id) ? `0 0 15px ${brush.color}` : "none",
                  opacity: (!sandboxAuto && sandboxBrush !== brush.id) ? 0.4 : 1
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.transform = "scale(1.2)";
                  const tooltip = e.currentTarget.nextElementSibling;
                  if(tooltip) { tooltip.style.opacity = "1"; tooltip.style.visibility = "visible"; tooltip.style.transform = "translateY(-50%) translateX(0)"; }
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.transform = "scale(1)";
                  const tooltip = e.currentTarget.nextElementSibling;
                  if(tooltip) { tooltip.style.opacity = "0"; tooltip.style.visibility = "hidden"; tooltip.style.transform = "translateY(-50%) translateX(-10px)"; }
                }}
              />
              <div style={{
                position: "absolute", left: "45px", top: "50%", transform: "translateY(-50%) translateX(-10px)",
                background: "rgba(15,15,15,0.9)", backdropFilter: "blur(10px)",
                border: `1px solid ${brush.color}40`,
                padding: "10px 15px", borderRadius: "10px", width: "200px",
                opacity: 0, visibility: "hidden", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                pointerEvents: "none", zIndex: 1000
              }}>
                <div style={{ color: brush.color, fontFamily: "'Panchang', sans-serif", fontSize: "0.8rem", marginBottom: "5px" }}>{brush.name}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.75rem", lineHeight: 1.4 }}>{brush.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ width: "24px", height: "1px", background: "rgba(255,255,255,0.2)", margin: "5px 0" }} />
          
          <button onClick={handleSandboxAuto} style={{
             padding: "10px", borderRadius: "50%",
             background: sandboxAuto ? "rgba(235, 215, 63, 0.15)" : "transparent",
             border: `1px solid ${sandboxAuto ? "rgba(235,215,63,0.5)" : "rgba(255,255,255,0.2)"}`,
             color: sandboxAuto ? "#ebd73f" : "rgba(255,255,255,0.5)",
             cursor: "pointer", transition: "all 0.3s",
             display: "flex", alignItems: "center", justifyContent: "center"
          }}
          title={`Auto-Switch: ${sandboxAuto ? "ON" : "OFF"}`}
          onMouseEnter={e => { if(!sandboxAuto) e.currentTarget.style.background = "rgba(255,255,255,0.05)" }}
          onMouseLeave={e => { if(!sandboxAuto) e.currentTarget.style.background = "transparent" }}
          >
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
             </svg>
          </button>
        </div>
      )}

      {/* Paused Overlay */}
      {isPaused && gameState === "playing" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "radial-gradient(circle, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.9) 100%)", zIndex: 90, gap: "30px", backdropFilter: "blur(2px)" }}>
          <div style={{ fontSize: "clamp(3rem,8vw,5rem)", fontFamily: "'Panchang',sans-serif", color: "#fff", letterSpacing: "4px" }}>PAUSED</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
            <button onClick={() => setIsPaused(false)} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid #ebd73f", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235,215,63,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
              RESUME GAME
            </button>
            <button onClick={() => { 
              if (engineRef.current && engineRef.current.restart) engineRef.current.restart();
              setGameState("playing"); 
              setIsPaused(false);
              if (activeGame === "dripp") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "snake") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "pong") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "runner") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "invaders") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "simon") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "scope") { scopeScoreRef.current = 0; setScopeScore(0); } 
              else if (activeGame === "breaker") { breakerScoreRef.current = 0; setBreakerScore(0); breakerLevelRef.current = 1; setBreakerLevel(1); } 
            }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              RESTART GAME
            </button>
            <button onClick={() => {
              const newMutedState = !isMuted;
              setIsMuted(newMutedState);
              if (audioRef.current) {
                audioRef.current.setMute(newMutedState);
              }
            }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              {isMuted ? "UNMUTE AUDIO" : "MUTE AUDIO"}
            </button>
            {!isCreativeGame && (
              <button onClick={handleBrag} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                {checkIsHighScore() ? "SHARE #1 LEADERBOARD SCORE" : "BRAG YOUR SCORE"}
              </button>
            )}
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px", marginTop: "15px" }}>
              <label style={{ color: "#fff", fontFamily: "'Clash Display', sans-serif", fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                MUSIC VOL
                <span style={{color: "var(--brand-yellow)"}}>{Math.round(bgmVolume * 100)}%</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={bgmVolume} onChange={(e) => {
                const v = parseFloat(e.target.value);
                setBgmVolume(v);
                if (audioRef.current) audioRef.current.setBGMVolume(v);
              }} style={{ accentColor: "#ebd73f", cursor: "pointer" }} />

              <label style={{ color: "#fff", fontFamily: "'Clash Display', sans-serif", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                SFX VOL
                <span style={{color: "var(--brand-yellow)"}}>{Math.round(sfxVolume * 100)}%</span>
              </label>
              <input type="range" min="0" max="1" step="0.05" value={sfxVolume} onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSfxVolume(v);
                if (audioRef.current) audioRef.current.setSFXVolume(v);
              }} style={{ accentColor: "#ebd73f", cursor: "pointer" }} />
            </div>
            
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "failed" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(5,5,5,0.85)", zIndex: 110, gap: "20px" }}>
          <div style={{ fontSize: "clamp(3rem,8vw,5rem)", fontFamily: "'Panchang',sans-serif", color: "#eb3f3f", textShadow: "0 0 40px rgba(235,63,63,.5)" }}>GAME OVER</div>
          {!isCreativeGame && (
            <div style={{ color: "rgba(255,255,255,.6)", fontFamily: "'Clash Display',sans-serif", fontSize: "1.2rem", letterSpacing: "2px" }}>
              FINAL SCORE: <strong style={{ color: "var(--brand-yellow)", fontSize: "1.5rem" }}>{activeGame === "scope" ? scopeScore : activeGame === "breaker" ? breakerScore : score}</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
            <button onClick={() => { 
              if (engineRef.current && engineRef.current.restart) engineRef.current.restart();
              setGameState("playing"); 
              if (activeGame === "dripp") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "snake") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "pong") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "runner") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "invaders") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "simon") { scoreRef.current = 0; setScore(0); } 
              else if (activeGame === "scope") { scopeScoreRef.current = 0; setScopeScore(0); } 
              else if (activeGame === "breaker") { breakerScoreRef.current = 0; setBreakerScore(0); breakerLevelRef.current = 1; setBreakerLevel(1); } 
            }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid #ebd73f", color: "#ebd73f", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(235,215,63,0.1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235,215,63,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
              PLAY AGAIN
            </button>
            {!isCreativeGame && (
              <button onClick={handleBrag} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                {checkIsHighScore() ? "SHARE #1 LEADERBOARD SCORE" : "BRAG YOUR SCORE"}
              </button>
            )}
            <button onClick={() => { setActiveGame("none"); if (onClose) onClose(); }} style={{ padding: "12px 32px", borderRadius: "30px", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "2px", cursor: "pointer", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              MENU
            </button>
            <div 
               onMouseEnter={() => setShowGameOverHelp(true)}
               onMouseLeave={() => setShowGameOverHelp(false)}
               style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'help', color: 'rgba(255,255,255,0.7)', transition: 'all 0.3s',
                  position: 'relative'
               }}
               onMouseEnterCapture={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
               onMouseLeaveCapture={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
            >
               <span style={{ fontFamily: "'Panchang', sans-serif", fontSize: '1.2rem', fontWeight: 'bold' }}>?</span>
               {showGameOverHelp && (
                 <div style={{
                    position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
                    width: '320px', maxHeight: '60vh', overflowY: 'auto', background: 'rgba(15,15,15,0.95)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '15px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)', zIndex: 200, textAlign: 'left',
                    color: 'rgba(255,255,255,0.9)', cursor: 'default'
                 }}>
                   {getHelpText(activeGame)}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpOpen && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 120 }}>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: "16px", padding: "40px", maxWidth: "500px", width: "90%", fontFamily: "'Clash Display',sans-serif", textAlign: "center" }}>
            <h2 style={{ color: "var(--brand-yellow)", marginBottom: "20px", fontFamily: "'Panchang',sans-serif", fontSize: "2rem" }}>{gameName}</h2>
            
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", marginBottom: "25px" }}>
              {activeGame === "dripp" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {activeGame === "breaker" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>LEVEL: {breakerLevel} | SCORE: {breakerScore}</div>}
              {activeGame === "scope" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {scopeScore}</div>}
              {activeGame === "snake" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>LENGTH: {score}</div>}
              {activeGame === "pong" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {activeGame === "runner" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>DISTANCE: {score}</div>}
              {activeGame === "invaders" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {activeGame === "simon" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>ROUND: {score}</div>}
              {activeGame === "pendulum" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {activeGame === "gravity" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>DISTANCE: {score}</div>}
              {activeGame === "slingshot" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {activeGame === "bullethell" && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>SCORE: {score}</div>}
              {isCreativeGame && <div style={{ fontSize: "1.2rem", color: "#ebd73f", fontFamily: "'Panchang',sans-serif" }}>ZEN MODE</div>}
            </div>

            {getHelpText(activeGame)}
            <div style={{ marginTop: "30px" }}>
              <button onClick={() => { setIsHelpOpen(false); setIsPaused(false); }} style={{ padding: "12px 32px", borderRadius: "30px", background: "#ebd73f", border: "none", color: "#111", fontFamily: "'Panchang', sans-serif", cursor: "pointer", transition: "all 0.3s", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "bold" }} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(235, 215, 63, 0.4)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}>READY TO PLAY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
