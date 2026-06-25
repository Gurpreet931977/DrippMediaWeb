export default class BeatMaker {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    // Use a compressor to avoid clipping with many overlapping instruments
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioCtx.currentTime);
    this.compressor.attack.setValueAtTime(0, this.audioCtx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);
    
    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.audioCtx.destination);
    this.masterGain.gain.value = 0.5;
    
    this.buildCatalog();
    
    this.cols = 16;
    this.channels = [
       { ...this.catalog[0] }, // Kick
       { ...this.catalog[2] }, // Snare
       { ...this.catalog[4] }, // Hi-hat
       { ...this.catalog[6] }  // Pluck
    ];
    this.rows = this.channels.length;
    
    this.grid = Array.from({length: this.cols}, () => new Array(this.rows).fill(false));
    
    // Pre-fill beat
    this.grid[0][0] = true; this.grid[4][0] = true; this.grid[8][0] = true; this.grid[12][0] = true;
    this.grid[4][1] = true; this.grid[12][1] = true;
    this.grid[0][2] = true; this.grid[2][2] = true; this.grid[4][2] = true; this.grid[6][2] = true;
    this.grid[8][2] = true; this.grid[10][2] = true; this.grid[12][2] = true; this.grid[14][2] = true;
    
    this.isPlaying = false;
    this.bpm = 120;
    this.currentStep = 0;
    this.lastStepTime = 0;
    
    this.ripples = [];
    this.columnFlashes = new Array(this.cols).fill(0);
    this.isModalOpen = false;
    
    this.updateLayout();
  }

  buildCatalog() {
     this.catalog = [
        { name: "KICK", color: "#ff0055", synth: () => this.playKick() },
        { name: "808 BASS", color: "#cc0044", synth: () => this.play808() },
        { name: "SNARE", color: "#33ccff", synth: () => this.playSnare() },
        { name: "CLAP", color: "#00ffff", synth: () => this.playClap() },
        { name: "HI-HAT", color: "#ebd73f", synth: () => this.playHat(0.05) },
        { name: "OPEN HAT", color: "#ffcc00", synth: () => this.playHat(0.3) },
        { name: "PLUCK", color: "#33ff33", synth: () => this.playPluck() },
        { name: "FM LEAD", color: "#ff00ff", synth: () => this.playFM() },
        { name: "LOFI KEYS", color: "#b366ff", synth: () => this.playLoFi() }
     ];
  }

  updateLayout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Dynamic sizing based on number of rows
    const availableHeight = h - 250; // Leave room for UI and Title
    this.cellH = Math.min(50, availableHeight / Math.max(1, this.rows));
    this.cellW = Math.min(60, (w - 150) / this.cols); // leave space for labels
    
    this.gridX = (w - (this.cellW * this.cols)) / 2 + 30; // shift right for labels
    this.gridY = 80;
    
    this.uiY = h - 80;
  }

  // --- AUDIO SYNTHESIZERS ---

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

  play808() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const dist = this.audioCtx.createWaveShaper();
    
    // Simple distortion curve
    const curve = new Float32Array(400);
    for(let i=0; i<400; ++i) {
       const x = i * 2 / 400 - 1;
       curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
    }
    dist.curve = curve;
    dist.oversample = '4x';
    
    osc.connect(dist);
    dist.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(55, now); // A1
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
    
    gain.gain.setValueAtTime(1.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    
    osc.start(now);
    osc.stop(now + 1.2);
  }

  playSnare() {
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.2; 
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

  playClap() {
    const now = this.audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
           if (this.audioCtx.state === 'closed') return;
           const noise = this.audioCtx.createBufferSource();
           const bufferSize = this.audioCtx.sampleRate * 0.1; 
           const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
           const output = buffer.getChannelData(0);
           for (let j = 0; j < bufferSize; j++) output[j] = Math.random() * 2 - 1;
           noise.buffer = buffer;

           const filter = this.audioCtx.createBiquadFilter();
           filter.type = 'bandpass';
           filter.frequency.value = 1500;
           
           const gain = this.audioCtx.createGain();
           gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

           noise.connect(filter);
           filter.connect(gain);
           gain.connect(this.masterGain);
           
           noise.start(this.audioCtx.currentTime);
        }, i * 15);
    }
  }

  playHat(decay) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "square";
    osc.frequency.value = 400; 
    filter.type = "bandpass";
    filter.frequency.value = 10000;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + decay);
    
    osc.start(now);
    osc.stop(now + decay);
  }

  playPluck() {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "square";
    osc.frequency.value = 440; // A4
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5000, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }
  
  playFM() {
    const carrier = this.audioCtx.createOscillator();
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    const outGain = this.audioCtx.createGain();
    
    const now = this.audioCtx.currentTime;
    
    modulator.type = "sine";
    modulator.frequency.value = 220; // 1/2 of carrier
    modGain.gain.setValueAtTime(600, now); // FM depth
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.3);
    
    carrier.type = "sine";
    carrier.frequency.value = 440; // A4
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); // Modulate carrier frequency
    carrier.connect(outGain);
    outGain.connect(this.masterGain);
    
    outGain.gain.setValueAtTime(0, now);
    outGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    outGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.4);
    carrier.stop(now + 0.4);
  }

  playLoFi() {
    const osc = this.audioCtx.createOscillator();
    const lfo = this.audioCtx.createOscillator();
    const lfoGain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    
    const now = this.audioCtx.currentTime;
    
    lfo.type = "sine";
    lfo.frequency.value = 4; // 4Hz vibrato
    lfoGain.gain.value = 10; // Pitch variation
    
    osc.type = "sine";
    osc.frequency.value = 329.63; // E4
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    filter.type = "lowpass";
    filter.frequency.value = 800; // Muffled tone
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 1.0);
    osc.stop(now + 1.0);
  }

  // --- LOGIC & UI ---

  addChannel(instrumentIndex) {
     this.channels.push({ ...this.catalog[instrumentIndex] });
     this.rows = this.channels.length;
     for (let c = 0; c < this.cols; c++) {
        this.grid[c].push(false);
     }
     this.isModalOpen = false;
     this.updateLayout();
  }

  deleteChannel(rowIndex) {
     this.channels.splice(rowIndex, 1);
     this.rows = this.channels.length;
     for (let c = 0; c < this.cols; c++) {
        this.grid[c].splice(rowIndex, 1);
     }
     this.updateLayout();
  }

  handlePointerDown(e) {
    if (this.audioCtx.state === 'suspended') {
       this.audioCtx.resume();
    }
    
    const rect = this.canvas.getBoundingClientRect();
    const cx = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const cy = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Modal clicks
    if (this.isModalOpen) {
       // Close modal if click outside center box
       const mw = Math.min(600, w - 40);
       const mh = Math.min(400, h - 40);
       const mx = (w - mw)/2;
       const my = (h - mh)/2;
       
       if (cx < mx || cx > mx+mw || cy < my || cy > my+mh) {
          this.isModalOpen = false;
          return;
       }
       
       // Clicked an instrument
       const itemsPerRow = 3;
       const itemW = (mw - 40) / itemsPerRow;
       const itemH = 50;
       
       for (let i = 0; i < this.catalog.length; i++) {
          let ix = mx + 20 + (i % itemsPerRow) * itemW;
          let iy = my + 60 + Math.floor(i / itemsPerRow) * itemH;
          if (cx > ix + 5 && cx < ix + itemW - 5 && cy > iy + 5 && cy < iy + itemH - 5) {
             this.addChannel(i);
             return;
          }
       }
       return;
    }
    
    // Grid Cells
    if (cx >= this.gridX && cx <= this.gridX + this.cols * this.cellW &&
        cy >= this.gridY && cy <= this.gridY + this.rows * this.cellH) {
       
       const col = Math.floor((cx - this.gridX) / this.cellW);
       const row = Math.floor((cy - this.gridY) / this.cellH);
       this.grid[col][row] = !this.grid[col][row];
       
       if (this.grid[col][row]) this.channels[row].synth();
       return;
    }
    
    // Row Delete Buttons
    if (cx > this.gridX - 35 && cx < this.gridX - 15) {
       for (let r = 0; r < this.rows; r++) {
          const y = this.gridY + r * this.cellH + this.cellH/2;
          if (cy > y - 10 && cy < y + 10) {
             this.deleteChannel(r);
             return;
          }
       }
    }
    
    // Bottom UI
    // BPM [-]
    if (cx > w/2 - 200 && cx < w/2 - 160 && cy > this.uiY - 15 && cy < this.uiY + 25) {
       this.bpm = Math.max(60, this.bpm - 5);
       return;
    }
    // BPM [+]
    if (cx > w/2 - 100 && cx < w/2 - 60 && cy > this.uiY - 15 && cy < this.uiY + 25) {
       this.bpm = Math.min(240, this.bpm + 5);
       return;
    }
    // Play/Pause
    if (cx > w/2 - 40 && cx < w/2 + 60 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       this.isPlaying = !this.isPlaying;
       if (this.isPlaying) this.lastStepTime = performance.now();
       return;
    }
    // Add Track
    if (cx > w/2 + 80 && cx < w/2 + 200 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       this.isModalOpen = true;
       return;
    }
  }

  handlePointerMove(e) {}
  handlePointerUp() {}

  update() {
    this.updateLayout();
    
    if (this.isPlaying) {
       const now = performance.now();
       const stepDuration = (60 / this.bpm) * 1000 / 4; 
       
       if (now - this.lastStepTime >= stepDuration) {
          this.lastStepTime = now;
          this.currentStep = (this.currentStep + 1) % this.cols;
          this.columnFlashes[this.currentStep] = 1.0;
          
          for (let r = 0; r < this.rows; r++) {
             if (this.grid[this.currentStep][r]) {
                this.channels[r].synth();
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
    
    for (let i = 0; i < this.cols; i++) {
       if (this.columnFlashes[i] > 0) this.columnFlashes[i] -= 0.05;
    }
    
    this.ripples.forEach(r => { r.r += 2; r.alpha -= 0.05; });
    this.ripples = this.ripples.filter(r => r.alpha > 0);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("NEON BEATS", w/2, 40);
    
    // Draw Grid
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    for (let r = 0; r < this.rows; r++) {
       const ry = this.gridY + r * this.cellH + this.cellH/2;
       
       // Label
       ctx.fillStyle = this.channels[r].color;
       ctx.fillText(this.channels[r].name, this.gridX - 45, ry);
       
       // Delete Button [X]
       ctx.fillStyle = "rgba(255,50,50,0.4)";
       ctx.beginPath(); ctx.roundRect(this.gridX - 35, ry - 10, 20, 20, 4); ctx.fill();
       ctx.fillStyle = "#fff";
       ctx.textAlign = "center";
       ctx.fillText("✕", this.gridX - 25, ry + 1);
       ctx.textAlign = "right";
    }
    
    for (let c = 0; c < this.cols; c++) {
       if (this.columnFlashes[c] > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${this.columnFlashes[c] * 0.15})`;
          ctx.fillRect(this.gridX + c * this.cellW, this.gridY, this.cellW, this.rows * this.cellH);
       }
       if (c % 4 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(this.gridX + c * this.cellW, this.gridY, this.cellW, this.rows * this.cellH);
       }
    }

    const padding = 2;
    for (let c = 0; c < this.cols; c++) {
       for (let r = 0; r < this.rows; r++) {
          const x = this.gridX + c * this.cellW;
          const y = this.gridY + r * this.cellH;
          
          if (this.grid[c][r]) {
             ctx.fillStyle = this.channels[r].color;
             ctx.shadowBlur = 10;
             ctx.shadowColor = this.channels[r].color;
             ctx.beginPath(); ctx.roundRect(x + padding, y + padding, this.cellW - padding*2, this.cellH - padding*2, 4); ctx.fill();
             ctx.shadowBlur = 0;
          } else {
             ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
             ctx.lineWidth = 1;
             ctx.beginPath(); ctx.roundRect(x + padding, y + padding, this.cellW - padding*2, this.cellH - padding*2, 4); ctx.stroke();
          }
       }
    }
    
    if (this.isPlaying || this.currentStep > 0) {
       const phX = this.gridX + this.currentStep * this.cellW;
       ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
       ctx.fillRect(phX, this.gridY - 10, this.cellW, 4);
       ctx.fillRect(phX, this.gridY + this.rows * this.cellH + 6, this.cellW, 4);
    }
    
    this.ripples.forEach(r => {
       ctx.strokeStyle = r.color;
       ctx.globalAlpha = Math.max(0, r.alpha);
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    
    // Draw UI
    ctx.textAlign = "center";
    
    // BPM
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath(); ctx.roundRect(w/2 - 200, this.uiY - 15, 40, 40, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w/2 - 100, this.uiY - 15, 40, 40, 4); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "18px sans-serif";
    ctx.fillText("-", w/2 - 180, this.uiY + 10);
    ctx.fillText("+", w/2 - 80, this.uiY + 10);
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.fillText(`BPM: ${this.bpm}`, w/2 - 130, this.uiY + 10);

    // Play
    ctx.fillStyle = this.isPlaying ? "rgba(255, 50, 50, 0.2)" : "rgba(50, 255, 100, 0.2)";
    ctx.strokeStyle = this.isPlaying ? "#ff3333" : "#33ff66";
    ctx.beginPath(); ctx.roundRect(w/2 - 40, this.uiY - 20, 100, 50, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.isPlaying ? "#ff3333" : "#33ff66";
    ctx.fillText(this.isPlaying ? "PAUSE" : "PLAY", w/2 + 10, this.uiY + 10);
    
    // Add Track
    ctx.fillStyle = "rgba(0, 255, 255, 0.2)";
    ctx.strokeStyle = "#00ffff";
    ctx.beginPath(); ctx.roundRect(w/2 + 80, this.uiY - 20, 120, 50, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#00ffff";
    ctx.fillText("+ TRACK", w/2 + 140, this.uiY + 10);
    
    // Modal
    if (this.isModalOpen) {
       ctx.fillStyle = "rgba(0,0,0,0.8)";
       ctx.fillRect(0,0,w,h);
       
       const mw = Math.min(600, w - 40);
       const mh = Math.min(400, h - 40);
       const mx = (w - mw)/2;
       const my = (h - mh)/2;
       
       ctx.fillStyle = "#111";
       ctx.strokeStyle = "#fff";
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 10); ctx.fill(); ctx.stroke();
       
       ctx.fillStyle = "#fff";
       ctx.font = "bold 20px 'Panchang', sans-serif";
       ctx.fillText("ADD INSTRUMENT", w/2, my + 35);
       
       const itemsPerRow = 3;
       const itemW = (mw - 40) / itemsPerRow;
       const itemH = 50;
       
       for (let i = 0; i < this.catalog.length; i++) {
          let ix = mx + 20 + (i % itemsPerRow) * itemW;
          let iy = my + 60 + Math.floor(i / itemsPerRow) * itemH;
          
          ctx.fillStyle = "rgba(255,255,255,0.05)";
          ctx.strokeStyle = this.catalog[i].color;
          ctx.beginPath(); ctx.roundRect(ix + 5, iy + 5, itemW - 10, itemH - 10, 5);
          ctx.fill(); ctx.stroke();
          
          ctx.fillStyle = this.catalog[i].color;
          ctx.font = "bold 12px sans-serif";
          ctx.fillText(this.catalog[i].name, ix + itemW/2, iy + itemH/2 + 4);
       }
       
       ctx.fillStyle = "#888";
       ctx.font = "12px sans-serif";
       ctx.fillText("Click outside to close", w/2, my + mh - 20);
    }
  }

  destroy() {
     if (this.audioCtx) this.audioCtx.close();
  }
}
