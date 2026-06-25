export default class BeatMaker {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    // Audio Context Setup
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioCtx.destination);
    
    // Grid Setup
    this.cols = 16;
    this.channels = [
      { name: "KICK", color: "#ff0055", synth: this.playKick.bind(this) },
      { name: "SNARE", color: "#33ccff", synth: this.playSnare.bind(this) },
      { name: "HI-HAT", color: "#ebd73f", synth: this.playHat.bind(this) },
      { name: "SYNTH Low", color: "#33ff33", synth: () => this.playSynth(261.63) }, // C4
      { name: "SYNTH Mid", color: "#b366ff", synth: () => this.playSynth(329.63) }, // E4
      { name: "SYNTH High", color: "#00ffcc", synth: () => this.playSynth(392.00) }, // G4
    ];
    this.rows = this.channels.length;
    
    // 2D array [col][row] boolean
    this.grid = Array.from({length: this.cols}, () => new Array(this.rows).fill(false));
    
    // Pre-fill a basic beat
    this.grid[0][0] = true; this.grid[4][0] = true; this.grid[8][0] = true; this.grid[12][0] = true;
    this.grid[4][1] = true; this.grid[12][1] = true;
    this.grid[0][2] = true; this.grid[2][2] = true; this.grid[4][2] = true; this.grid[6][2] = true;
    this.grid[8][2] = true; this.grid[10][2] = true; this.grid[12][2] = true; this.grid[14][2] = true;
    
    // Sequencer State
    this.isPlaying = false;
    this.bpm = 120;
    this.currentStep = 0;
    this.lastStepTime = 0;
    
    // Visuals
    this.particles = [];
    this.ripples = [];
    this.columnFlashes = new Array(this.cols).fill(0);
    
    // Layout
    this.updateLayout();
  }

  updateLayout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    this.cellW = Math.min(60, (w - 100) / this.cols);
    this.cellH = Math.min(50, (h - 200) / this.rows);
    
    this.gridX = (w - (this.cellW * this.cols)) / 2;
    this.gridY = (h - (this.cellH * this.rows)) / 2 + 30;
    
    this.uiY = h - 60;
  }

  // ---- Audio Synthesizers ----

  playKick() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playSnare() {
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.2; // 0.2s
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);

    const noiseGain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    // Add small click tone
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = "triangle";
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.frequency.setValueAtTime(250, now);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.start(now);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playHat() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "square";
    osc.frequency.value = 400; // Doesn't matter much for hihat
    filter.type = "bandpass";
    filter.frequency.value = 10000;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playSynth(freq) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "sine";
    osc.frequency.value = freq;
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, this.audioCtx.currentTime + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // ---- Logic ----

  handlePointerDown(e) {
    // Unlock Audio Context on first click
    if (this.audioCtx.state === 'suspended') {
       this.audioCtx.resume();
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    // Check Grid Clicks
    if (cx >= this.gridX && cx <= this.gridX + this.cols * this.cellW &&
        cy >= this.gridY && cy <= this.gridY + this.rows * this.cellH) {
       
       const col = Math.floor((cx - this.gridX) / this.cellW);
       const row = Math.floor((cy - this.gridY) / this.cellH);
       this.grid[col][row] = !this.grid[col][row];
       
       // Play sound on click for preview
       if (this.grid[col][row]) this.channels[row].synth();
       return;
    }
    
    // Check UI Clicks
    const w = this.canvas.width;
    
    // Play/Pause
    if (cx > w/2 - 150 && cx < w/2 - 50 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       this.isPlaying = !this.isPlaying;
       if (this.isPlaying) this.lastStepTime = performance.now();
    }
    
    // Clear
    if (cx > w/2 + 50 && cx < w/2 + 150 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       for (let c = 0; c < this.cols; c++) {
          for (let r = 0; r < this.rows; r++) {
             this.grid[c][r] = false;
          }
       }
    }
  }

  handlePointerMove(e) {}
  handlePointerUp() {}

  update() {
    this.updateLayout(); // handle resizes dynamically
    
    if (this.isPlaying) {
       const now = performance.now();
       const stepDuration = (60 / this.bpm) * 1000 / 4; // 16th notes
       
       if (now - this.lastStepTime >= stepDuration) {
          this.lastStepTime = now;
          this.currentStep = (this.currentStep + 1) % this.cols;
          this.columnFlashes[this.currentStep] = 1.0;
          
          // Play active sounds
          for (let r = 0; r < this.rows; r++) {
             if (this.grid[this.currentStep][r]) {
                this.channels[r].synth();
                
                // Spawn ripple effect on active cell
                this.ripples.push({
                   x: this.gridX + this.currentStep * this.cellW + this.cellW/2,
                   y: this.gridY + r * this.cellH + this.cellH/2,
                   r: this.cellW/2,
                   color: this.channels[r].color,
                   alpha: 1.0
                });
             }
          }
       }
    }
    
    // Visual decays
    for (let i = 0; i < this.cols; i++) {
       if (this.columnFlashes[i] > 0) this.columnFlashes[i] -= 0.05;
    }
    
    this.ripples.forEach(r => {
       r.r += 2;
       r.alpha -= 0.05;
    });
    this.ripples = this.ripples.filter(r => r.alpha > 0);
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NEON BEATS", this.canvas.width/2, 50);
    
    // Draw Labels
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "right";
    for (let r = 0; r < this.rows; r++) {
       ctx.fillStyle = this.channels[r].color;
       ctx.fillText(this.channels[r].name, this.gridX - 15, this.gridY + r * this.cellH + this.cellH/2 + 4);
    }
    
    // Draw Grid Columns (background highlights)
    for (let c = 0; c < this.cols; c++) {
       if (this.columnFlashes[c] > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${this.columnFlashes[c] * 0.15})`;
          ctx.fillRect(this.gridX + c * this.cellW, this.gridY, this.cellW, this.rows * this.cellH);
       }
       if (c % 4 === 0) {
          // Beat separator
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(this.gridX + c * this.cellW, this.gridY, this.cellW, this.rows * this.cellH);
       }
    }

    // Draw Grid Cells
    for (let c = 0; c < this.cols; c++) {
       for (let r = 0; r < this.rows; r++) {
          const x = this.gridX + c * this.cellW;
          const y = this.gridY + r * this.cellH;
          const padding = 2;
          
          if (this.grid[c][r]) {
             ctx.fillStyle = this.channels[r].color;
             ctx.shadowBlur = 15;
             ctx.shadowColor = this.channels[r].color;
             ctx.beginPath();
             ctx.roundRect(x + padding, y + padding, this.cellW - padding*2, this.cellH - padding*2, 4);
             ctx.fill();
             ctx.shadowBlur = 0;
          } else {
             ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
             ctx.lineWidth = 1;
             ctx.beginPath();
             ctx.roundRect(x + padding, y + padding, this.cellW - padding*2, this.cellH - padding*2, 4);
             ctx.stroke();
          }
       }
    }
    
    // Draw Playhead
    if (this.isPlaying || this.currentStep > 0) {
       const phX = this.gridX + this.currentStep * this.cellW;
       ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
       ctx.fillRect(phX, this.gridY - 10, this.cellW, 4);
       ctx.fillRect(phX, this.gridY + this.rows * this.cellH + 6, this.cellW, 4);
    }
    
    // Draw Ripples
    this.ripples.forEach(r => {
       ctx.strokeStyle = r.color;
       ctx.globalAlpha = Math.max(0, r.alpha);
       ctx.lineWidth = 2;
       ctx.beginPath();
       ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
       ctx.stroke();
    });
    ctx.globalAlpha = 1;
    
    // Draw UI
    const w = this.canvas.width;
    
    // Play/Pause Btn
    ctx.fillStyle = this.isPlaying ? "rgba(255, 50, 50, 0.2)" : "rgba(50, 255, 100, 0.2)";
    ctx.strokeStyle = this.isPlaying ? "#ff3333" : "#33ff66";
    ctx.beginPath(); ctx.roundRect(w/2 - 150, this.uiY - 20, 100, 50, 8); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = this.isPlaying ? "#ff3333" : "#33ff66";
    ctx.font = "bold 16px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.isPlaying ? "PAUSE" : "PLAY", w/2 - 100, this.uiY + 10);
    
    // Clear Btn
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath(); ctx.roundRect(w/2 + 50, this.uiY - 20, 100, 50, 8); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = "#ffffff";
    ctx.fillText("CLEAR", w/2 + 100, this.uiY + 10);
    
    // Context warning if suspended
    if (this.audioCtx.state === 'suspended') {
       ctx.fillStyle = "#ffcc00";
       ctx.font = "12px sans-serif";
       ctx.fillText("CLICK ANYWHERE TO ENABLE AUDIO", w/2, this.uiY + 60);
    }
  }

  destroy() {
     if (this.audioCtx) {
        this.audioCtx.close();
     }
  }
}
