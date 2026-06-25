export default class BeatMaker {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-15, this.audioCtx.currentTime);
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
       { ...this.catalog[0], pitchOffset: 0 }, // Kick
       { ...this.catalog[2], pitchOffset: 0 }, // Snare
       { ...this.catalog[4], pitchOffset: 0 }, // Hi-hat
       { ...this.catalog[6], pitchOffset: 0 }  // Pluck
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
    
    this.clickAnims = {}; 
    
    this.updateLayout();
  }

  getPitchMod(offset) {
     return Math.pow(2, offset / 12);
  }

  buildCatalog() {
     this.catalog = [
        { name: "KICK", color: "#ff0055", synth: (p) => this.playKick(p) },
        { name: "808 SUB", color: "#cc0044", synth: (p) => this.play808(p) },
        { name: "DRILL 808", color: "#ff3300", synth: (p) => this.playDrill808(p) },
        { name: "SNARE", color: "#33ccff", synth: (p) => this.playSnare(p) },
        { name: "CLAP", color: "#00ffff", synth: (p) => this.playClap(p) },
        { name: "HI-HAT", color: "#ebd73f", synth: (p) => this.playHat(0.05, p) },
        { name: "OPEN HAT", color: "#ffcc00", synth: (p) => this.playHat(0.3, p) },
        { name: "PLUCK", color: "#33ff33", synth: (p) => this.playPluck(p) },
        { name: "GUITAR", color: "#00ffcc", synth: (p) => this.playGuitar(p) },
        { name: "FM LEAD", color: "#ff00ff", synth: (p) => this.playFM(p) },
        { name: "FUTURE BASS", color: "#ff66ff", synth: (p) => this.playFutureBass(p) },
        { name: "LOFI KEYS", color: "#b366ff", synth: (p) => this.playLoFi(p) },
        { name: "LOFI PAD", color: "#9933ff", synth: (p) => this.playPad(p) },
        { name: "PHONK COWBELL", color: "#ff00cc", synth: (p) => this.playCowbell(p) },
        { name: "SLAP BASS", color: "#00ff99", synth: (p) => this.playSlapBass(p) },
        { name: "HYPERPOP GLITCH", color: "#ff00ff", synth: (p) => this.playHyperGlitch(p) },
        { name: "VAPORWAVE PAD", color: "#00ccff", synth: (p) => this.playVaporwave(p) },
        { name: "CHIPTUNE ARP", color: "#ffcc00", synth: (p) => this.playChiptune(p) },
        { name: "CYBER WUB", color: "#66ff33", synth: (p) => this.playCyberWub(p) },
        { name: "NEON BELL", color: "#ffffff", synth: (p) => this.playNeonBell(p) },
        { name: "ACID LEAD", color: "#ffff00", synth: (p) => this.playAcidLead(p) }
     ];
  }

  playCyberWub(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65 * this.getPitchMod(pitch), this.audioCtx.currentTime);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, this.audioCtx.currentTime + 0.2);
    filter.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.4);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, this.audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.6);
    osc.start(this.audioCtx.currentTime); osc.stop(this.audioCtx.currentTime + 0.6);
  }
  
  playNeonBell(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880 * this.getPitchMod(pitch), this.audioCtx.currentTime);
    osc.connect(gain); gain.connect(this.masterGain);
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 1.0);
    osc.start(this.audioCtx.currentTime); osc.stop(this.audioCtx.currentTime + 1.0);
  }
  
  playAcidLead(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    osc.type = "square";
    osc.frequency.setValueAtTime(220 * this.getPitchMod(pitch), this.audioCtx.currentTime);
    filter.type = "bandpass";
    filter.Q.value = 10;
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(4000, this.audioCtx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.3);
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0.6, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    osc.start(this.audioCtx.currentTime); osc.stop(this.audioCtx.currentTime + 0.3);
  }

  updateLayout() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    const availableHeight = h - 250; 
    this.cellH = Math.min(50, availableHeight / Math.max(1, this.rows));
    this.cellW = Math.min(60, (w - 200) / this.cols); 
    
    this.gridX = Math.max(180, (w - (this.cellW * this.cols)) / 2 + 50); 
    this.gridY = 100;
    
    this.uiY = h - 80;
  }

  // --- AUDIO SYNTHESIZERS ---

  playKick(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(150 * this.getPitchMod(pitch), now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    gain.gain.setValueAtTime(1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.start(now); osc.stop(now + 0.5);
  }

  play808(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(55 * this.getPitchMod(pitch), now); 
    osc.frequency.exponentialRampToValueAtTime(40 * this.getPitchMod(pitch), now + 0.8);
    
    gain.gain.setValueAtTime(1.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
    
    osc.start(now); osc.stop(now + 1.2);
  }

  playDrill808(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const dist = this.audioCtx.createWaveShaper();
    
    const curve = new Float32Array(400);
    for(let i=0; i<400; ++i) {
       const x = i * 2 / 400 - 1;
       curve[i] = Math.max(-0.8, Math.min(0.8, x * 5)); // Hard clipping
    }
    dist.curve = curve;
    dist.oversample = '4x';
    
    osc.connect(dist); dist.connect(gain); gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    const baseFreq = 55 * this.getPitchMod(pitch);
    // Glide up then down
    osc.frequency.setValueAtTime(baseFreq * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.3);
    
    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    
    osc.start(now); osc.stop(now + 1.5);
  }

  playSnare(pitch) {
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.2; 
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const noiseFilter = this.audioCtx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000 * this.getPitchMod(pitch);
    noise.connect(noiseFilter);

    const noiseGain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    noiseFilter.connect(noiseGain); noiseGain.connect(this.masterGain);
    
    const osc = this.audioCtx.createOscillator();
    const oscGain = this.audioCtx.createGain();
    osc.type = "triangle";
    osc.connect(oscGain); oscGain.connect(this.masterGain);
    osc.frequency.setValueAtTime(250 * this.getPitchMod(pitch), now);
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.start(now); osc.start(now); osc.stop(now + 0.2);
  }

  playClap(pitch) {
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
           filter.frequency.value = 1500 * this.getPitchMod(pitch);
           
           const gain = this.audioCtx.createGain();
           gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
           gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

           noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
           noise.start(this.audioCtx.currentTime);
        }, i * 15);
    }
  }

  playHat(decay, pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "square";
    osc.frequency.value = 400 * this.getPitchMod(pitch); 
    filter.type = "bandpass";
    filter.frequency.value = 10000 * this.getPitchMod(pitch);
    
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + decay);
    
    osc.start(now); osc.stop(now + decay);
  }

  playPluck(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    osc.type = "square";
    osc.frequency.value = 440 * this.getPitchMod(pitch);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(5000, this.audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, this.audioCtx.currentTime + 0.1);
    
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now); osc.stop(now + 0.3);
  }
  
  playGuitar(pitch) {
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    const dist = this.audioCtx.createWaveShaper();
    
    const curve = new Float32Array(400);
    for(let i=0; i<400; ++i) {
       const x = i * 2 / 400 - 1;
       curve[i] = (3 + 20) * x * 20 * (Math.PI / 180) / (Math.PI + 20 * Math.abs(x));
    }
    dist.curve = curve;
    dist.oversample = '4x';
    
    osc1.type = "sawtooth";
    osc2.type = "triangle";
    osc1.frequency.value = 220 * this.getPitchMod(pitch);
    osc2.frequency.value = 220 * this.getPitchMod(pitch) * 1.01; // slight detune
    
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    
    osc1.connect(filter); osc2.connect(filter);
    filter.connect(dist); dist.connect(gain); gain.connect(this.masterGain);
    
    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.8); osc2.stop(now + 0.8);
  }

  playFM(pitch) {
    const carrier = this.audioCtx.createOscillator();
    const modulator = this.audioCtx.createOscillator();
    const modGain = this.audioCtx.createGain();
    const outGain = this.audioCtx.createGain();
    
    const now = this.audioCtx.currentTime;
    
    modulator.type = "sine";
    modulator.frequency.value = 220 * this.getPitchMod(pitch); 
    modGain.gain.setValueAtTime(600, now); 
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.3);
    
    carrier.type = "sine";
    carrier.frequency.value = 440 * this.getPitchMod(pitch); 
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency); 
    carrier.connect(outGain);
    outGain.connect(this.masterGain);
    
    outGain.gain.setValueAtTime(0, now);
    outGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    outGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    modulator.start(now); carrier.start(now);
    modulator.stop(now + 0.4); carrier.stop(now + 0.4);
  }

  playFutureBass(pitch) {
    const now = this.audioCtx.currentTime;
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    
    for(let i=0; i<3; i++) {
       const osc = this.audioCtx.createOscillator();
       osc.type = "sawtooth";
       // Detune -1%, 0%, +1%
       osc.frequency.value = (440 * this.getPitchMod(pitch)) * (1 + (i-1)*0.01);
       osc.connect(filter);
       osc.start(now); osc.stop(now + 0.5);
    }
    
    filter.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  }

  playLoFi(pitch) {
    const osc = this.audioCtx.createOscillator();
    const lfo = this.audioCtx.createOscillator();
    const lfoGain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    
    const now = this.audioCtx.currentTime;
    
    lfo.type = "sine"; lfo.frequency.value = 4; lfoGain.gain.value = 10; 
    osc.type = "sine"; osc.frequency.value = 329.63 * this.getPitchMod(pitch); 
    
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    
    filter.type = "lowpass"; filter.frequency.value = 800; 
    
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 1.0);
    
    lfo.start(now); osc.start(now);
    lfo.stop(now + 1.0); osc.stop(now + 1.0);
  }
  
  playPad(pitch) {
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    
    const now = this.audioCtx.currentTime;
    
    osc1.type = "sine"; osc1.frequency.value = 220 * this.getPitchMod(pitch);
    osc2.type = "triangle"; osc2.frequency.value = 220 * this.getPitchMod(pitch) * 1.005;
    
    filter.type = "lowpass"; filter.frequency.value = 1200;
    
    osc1.connect(filter); osc2.connect(filter);
    filter.connect(gain); gain.connect(this.masterGain);
    
    // Slow attack, slow release
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + 1.5);
    
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 1.5); osc2.stop(now + 1.5);
  }

  playCowbell(pitch) {
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    
    osc1.type = "square"; osc1.frequency.value = 540 * this.getPitchMod(pitch);
    osc2.type = "square"; osc2.frequency.value = 800 * this.getPitchMod(pitch);
    
    osc1.connect(gain); osc2.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 0.3); osc2.stop(now + 0.3);
  }

  playSlapBass(pitch) {
    const osc = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    
    osc.type = "triangle";
    osc.frequency.value = 55 * this.getPitchMod(pitch);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    
    osc.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now); osc.stop(now + 0.3);
  }

  playHyperGlitch(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1000 * this.getPitchMod(pitch), now);
    osc.frequency.setValueAtTime(300 * this.getPitchMod(pitch), now + 0.05);
    osc.frequency.setValueAtTime(2000 * this.getPitchMod(pitch), now + 0.1);
    
    osc.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gain.gain.setValueAtTime(0, now + 0.05);
    gain.gain.setValueAtTime(0.4, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.start(now); osc.stop(now + 0.2);
  }

  playVaporwave(pitch) {
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const filter = this.audioCtx.createBiquadFilter();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    
    osc1.type = "sine"; osc1.frequency.value = 220 * this.getPitchMod(pitch);
    osc2.type = "triangle"; osc2.frequency.value = 110 * this.getPitchMod(pitch);
    
    osc1.detune.setValueAtTime(15, now);
    osc2.detune.setValueAtTime(-15, now);
    
    filter.type = "lowpass"; filter.frequency.value = 600;
    
    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 1.2);
    
    osc1.start(now); osc2.start(now);
    osc1.stop(now + 1.2); osc2.stop(now + 1.2);
  }

  playChiptune(pitch) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;
    
    osc.type = "square";
    let baseFreq = 440 * this.getPitchMod(pitch);
    
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.setValueAtTime(baseFreq * 1.25, now + 0.05);
    osc.frequency.setValueAtTime(baseFreq * 1.5, now + 0.1);
    osc.frequency.setValueAtTime(baseFreq * 2, now + 0.15);
    
    osc.connect(gain); gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.start(now); osc.stop(now + 0.3);
  }

  // --- LOGIC & UI ---
  triggerAnim(id) {
     this.clickAnims[id] = 1.0;
  }

  addChannel(instrumentIndex) {
     this.channels.push({ ...this.catalog[instrumentIndex], pitchOffset: 0 });
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

  moveChannel(rowIndex, dir) {
     const target = rowIndex + dir;
     if (target < 0 || target >= this.rows) return;
     
     const tempCh = this.channels[rowIndex];
     this.channels[rowIndex] = this.channels[target];
     this.channels[target] = tempCh;
     
     for (let c = 0; c < this.cols; c++) {
        const tempG = this.grid[c][rowIndex];
        this.grid[c][rowIndex] = this.grid[c][target];
        this.grid[c][target] = tempG;
     }
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
    
    if (this.isModalOpen) {
       const mw = Math.min(800, w - 40);
       const mh = Math.min(550, h - 40);
       const mx = (w - mw)/2;
       const my = (h - mh)/2;
       
       if (cx < mx || cx > mx+mw || cy < my || cy > my+mh) {
          this.isModalOpen = false;
          return;
       }
       
       const itemsPerRow = 3;
       const itemW = (mw - 40) / itemsPerRow;
       const itemH = 55;
       
       for (let i = 0; i < this.catalog.length; i++) {
          let ix = mx + 20 + (i % itemsPerRow) * itemW;
          let iy = my + 85 + Math.floor(i / itemsPerRow) * (itemH + 15);
          if (cx > ix + 8 && cx < ix + itemW - 8 && cy > iy + 5 && cy < iy + itemH - 5) {
             this.triggerAnim(`modal_${i}`);
             setTimeout(() => this.addChannel(i), 150);
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
       
       this.triggerAnim(`grid_${col}_${row}`);
       if (this.grid[col][row]) this.channels[row].synth(this.channels[row].pitchOffset);
       return;
    }
    
    // Track Left Controls
    for (let r = 0; r < this.rows; r++) {
       const ry = this.gridY + r * this.cellH + this.cellH/2;
       
       const panelX = this.gridX - 170;
       
       // Move Up
       if (cx > panelX && cx < panelX + 20 && cy > ry - 18 && cy < ry) {
          this.triggerAnim(`moveU_${r}`);
          setTimeout(() => this.moveChannel(r, -1), 100);
          return;
       }
       // Move Down
       if (cx > panelX && cx < panelX + 20 && cy > ry && cy < ry + 18) {
          this.triggerAnim(`moveD_${r}`);
          setTimeout(() => this.moveChannel(r, 1), 100);
          return;
       }
       // Pitch Down (-)
       if (cx > panelX + 95 && cx < panelX + 115 && cy > ry - 10 && cy < ry + 15) {
          this.channels[r].pitchOffset--;
          this.triggerAnim(`pitchD_${r}`);
          return;
       }
       // Pitch Up (+)
       if (cx > panelX + 115 && cx < panelX + 135 && cy > ry - 10 && cy < ry + 15) {
          this.channels[r].pitchOffset++;
          this.triggerAnim(`pitchU_${r}`);
          return;
       }
       // Delete
       if (cx > panelX + 135 && cx < panelX + 160 && cy > ry - 15 && cy < ry + 15) {
          this.triggerAnim(`del_${r}`);
          setTimeout(() => this.deleteChannel(r), 100);
          return;
       }
    }
    
    // Bottom UI
    if (cx > w/2 - 240 && cx < w/2 - 200 && cy > this.uiY - 15 && cy < this.uiY + 25) {
       this.bpm = Math.max(60, this.bpm - 5); this.triggerAnim('bpmD'); return;
    }
    if (cx > w/2 - 100 && cx < w/2 - 60 && cy > this.uiY - 15 && cy < this.uiY + 25) {
       this.bpm = Math.min(240, this.bpm + 5); this.triggerAnim('bpmU'); return;
    }
    if (cx > w/2 - 30 && cx < w/2 + 70 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       this.isPlaying = !this.isPlaying;
       if (this.isPlaying) this.lastStepTime = performance.now();
       this.triggerAnim('play'); return;
    }
    if (cx > w/2 + 100 && cx < w/2 + 220 && cy > this.uiY - 20 && cy < this.uiY + 30) {
       this.triggerAnim('addTrk');
       setTimeout(() => { this.isModalOpen = true; }, 100);
       return;
    }
  }

  handlePointerMove(e) {
     const rect = this.canvas.getBoundingClientRect();
     this.mouseX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
     this.mouseY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
  }
  handlePointerUp() {}

  update() {
    this.updateLayout();
    
    Object.keys(this.clickAnims).forEach(k => {
       if (this.clickAnims[k] > 0) this.clickAnims[k] -= 0.15;
       if (this.clickAnims[k] < 0) this.clickAnims[k] = 0;
    });
    
    if (this.isPlaying) {
       const now = performance.now();
       const stepDuration = (60 / this.bpm) * 1000 / 4; 
       
       if (now - this.lastStepTime >= stepDuration) {
          this.lastStepTime = now;
          this.currentStep = (this.currentStep + 1) % this.cols;
          this.columnFlashes[this.currentStep] = 1.0;
          
          for (let r = 0; r < this.rows; r++) {
             if (this.grid[this.currentStep][r]) {
                this.channels[r].synth(this.channels[r].pitchOffset);
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
       if (this.columnFlashes[i] > 0) this.columnFlashes[i] -= 0.08;
    }
    
    this.ripples.forEach(r => { r.r += 2; r.alpha -= 0.05; });
    this.ripples = this.ripples.filter(r => r.alpha > 0);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, "#080512");
    bgGrad.addColorStop(1, "#020105");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffffff";
    ctx.fillText("NEON BEATS", w/2, 50);
    ctx.shadowBlur = 0;
    
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    for (let r = 0; r < this.rows; r++) {
       const ry = this.gridY + r * this.cellH + this.cellH/2;
       
       // Modern Track Panel
       const panelW = 160;
       const panelX = this.gridX - panelW - 10;
       const panelH = this.cellH - 4;
       const panelY = ry - panelH/2;
       
       let isPanelHovered = false;
       if (!this.isModalOpen && this.mouseX > panelX && this.mouseX < panelX + panelW && this.mouseY > panelY && this.mouseY < panelY + panelH) {
          isPanelHovered = true;
       }
       
       ctx.fillStyle = isPanelHovered ? "rgba(30, 20, 40, 0.9)" : "rgba(15, 10, 20, 0.7)";
       ctx.strokeStyle = isPanelHovered ? this.channels[r].color : "rgba(255, 255, 255, 0.1)";
       ctx.lineWidth = 1;
       ctx.beginPath(); ctx.roundRect(panelX, panelY, panelW, panelH, 8); ctx.fill(); ctx.stroke();
       
       // Reorder Up/Down
       ctx.fillStyle = "rgba(255,255,255,0.3)";
       ctx.font = "10px sans-serif";
       ctx.textAlign = "center";
       const sUp = (this.clickAnims[`moveU_${r}`] || 0) * 2;
       ctx.fillText("▲", panelX + 12, ry - 6 + sUp);
       const sDn = (this.clickAnims[`moveD_${r}`] || 0) * 2;
       ctx.fillText("▼", panelX + 12, ry + 10 + sDn);
       
       // Label
       ctx.textAlign = "left";
       ctx.fillStyle = this.channels[r].color;
       ctx.font = "bold 11px 'Panchang', sans-serif";
       ctx.fillText(this.channels[r].name.substring(0, 10), panelX + 25, ry - 3);
       
       // Pitch Display
       ctx.fillStyle = "rgba(255,255,255,0.5)";
       ctx.font = "10px sans-serif";
       const po = this.channels[r].pitchOffset;
       ctx.fillText(`PITCH: ${po > 0 ? '+'+po : po}`, panelX + 25, ry + 12);
       
       // Pitch Controls (+ / -)
       ctx.textAlign = "center";
       ctx.font = "bold 14px sans-serif";
       const pM = (this.clickAnims[`pitchD_${r}`] || 0) * 2;
       ctx.fillStyle = "rgba(255,255,255,0.4)";
       ctx.fillText("-", panelX + 105, ry + 5 + pM);
       
       const pP = (this.clickAnims[`pitchU_${r}`] || 0) * 2;
       ctx.fillText("+", panelX + 125, ry + 5 + pP);
       
       // Delete
       const sX = (this.clickAnims[`del_${r}`] || 0) * 2;
       ctx.fillStyle = "rgba(255, 50, 50, 0.5)";
       ctx.beginPath(); ctx.roundRect(panelX + 138 + sX, ry - 10 + sX, 16 - sX*2, 20 - sX*2, 4); ctx.fill();
       ctx.fillStyle = "#fff";
       ctx.font = "10px sans-serif";
       ctx.fillText("✕", panelX + 146, ry + 4);
    }
    
    // Column Backgrounds
    for (let c = 0; c < this.cols; c++) {
       if (c % 4 === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
          ctx.beginPath(); ctx.roundRect(this.gridX + c * this.cellW, this.gridY, this.cellW, this.rows * this.cellH, 10); ctx.fill();
       }
    }

    // Grid Cells (Pill/Capsule shape)
    const padding = 4;
    for (let c = 0; c < this.cols; c++) {
       for (let r = 0; r < this.rows; r++) {
          const x = this.gridX + c * this.cellW;
          const y = this.gridY + r * this.cellH;
          const s = (this.clickAnims[`grid_${c}_${r}`] || 0) * 3;
          
          const cw = this.cellW - padding*2;
          const ch = this.cellH - padding*2;
          const rad = ch / 2; // Full pill rounding
          
          let isHovered = false;
          if (!this.isModalOpen && this.mouseX > x + padding && this.mouseX < x + cw && this.mouseY > y + padding && this.mouseY < y + ch) {
             isHovered = true;
          }
          
          if (this.grid[c][r]) {
             const grad = ctx.createLinearGradient(x, y, x, y + ch);
             grad.addColorStop(0, "rgba(255,255,255,0.6)");
             grad.addColorStop(0.4, this.channels[r].color);
             grad.addColorStop(1, this.channels[r].color);
             
             ctx.fillStyle = grad;
             ctx.shadowBlur = isHovered ? 25 : 12;
             ctx.shadowColor = this.channels[r].color;
             ctx.beginPath(); ctx.roundRect(x + padding + s, y + padding + s, cw - s*2, ch - s*2, rad); ctx.fill();
             ctx.shadowBlur = 0;
          } else {
             ctx.fillStyle = isHovered ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.05)";
             ctx.beginPath(); ctx.roundRect(x + padding + s, y + padding + s, cw - s*2, ch - s*2, rad); ctx.fill();
             ctx.strokeStyle = isHovered ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)";
             ctx.lineWidth = 1;
             ctx.stroke();
          }
       }
    }
    
    // Glowing Vertical Playhead Beam
    if (this.isPlaying || this.currentStep > 0) {
       const phX = this.gridX + this.currentStep * this.cellW;
       const beamGrad = ctx.createLinearGradient(0, this.gridY, 0, this.gridY + this.rows * this.cellH);
       beamGrad.addColorStop(0, "rgba(255,255,255,0)");
       beamGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
       beamGrad.addColorStop(1, "rgba(255,255,255,0)");
       
       ctx.fillStyle = beamGrad;
       ctx.fillRect(phX, this.gridY - 20, this.cellW, this.rows * this.cellH + 40);
       
       ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
       ctx.shadowBlur = 20;
       ctx.shadowColor = "#fff";
       ctx.beginPath(); ctx.roundRect(phX, this.gridY - 10, this.cellW, 6, 3); ctx.fill();
       ctx.beginPath(); ctx.roundRect(phX, this.gridY + this.rows * this.cellH + 4, this.cellW, 6, 3); ctx.fill();
       ctx.shadowBlur = 0;
    }
    
    this.ripples.forEach(r => {
       ctx.strokeStyle = r.color;
       ctx.globalAlpha = Math.max(0, r.alpha);
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
    });
    ctx.globalAlpha = 1;
    
    // Bottom UI
    ctx.textAlign = "center";
    
    const drawAnimBtn = (x, y, bw, bh, text, animKey, col, filled) => {
          const s = (this.clickAnims[animKey] || 0) * 3; 
          ctx.fillStyle = filled ? col : `rgba(${col}, 0.1)`;
          ctx.strokeStyle = filled ? col : `rgba(255,255,255,0.3)`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x + s, y + s, bw - s*2, bh - s*2, bh/2); 
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = filled ? "#000" : "#fff";
          ctx.font = "bold 14px 'Panchang', sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x + bw/2, y + bh/2 + 1);
          ctx.textBaseline = "alphabetic";
    };

    // BPM
    drawAnimBtn(w/2 - 240, this.uiY - 15, 40, 40, "-", "bpmD", "255,255,255", false);
    drawAnimBtn(w/2 - 100, this.uiY - 15, 40, 40, "+", "bpmU", "255,255,255", false);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px 'Panchang', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`BPM: ${this.bpm}`, w/2 - 150, this.uiY + 10);

    // Play
    const playCol = this.isPlaying ? "#ff3366" : "#00ffcc";
    drawAnimBtn(w/2 - 30, this.uiY - 20, 100, 50, this.isPlaying ? "PAUSE" : "PLAY", "play", playCol, true);
    
    // Add Track
    drawAnimBtn(w/2 + 100, this.uiY - 20, 120, 50, "+ TRACK", "addTrk", "#b366ff", true);
    
    // Modal
    if (this.isModalOpen) {
       ctx.fillStyle = "rgba(0,0,0,0.6)";
       ctx.fillRect(0,0,w,h);
       
       const mw = Math.min(800, w - 40);
       const mh = Math.min(550, h - 40);
       const mx = (w - mw)/2;
       const my = (h - mh)/2;
       
       // GenZ Glassy Modal
       ctx.shadowBlur = 40;
       ctx.shadowColor = "rgba(255, 0, 255, 0.2)";
       ctx.fillStyle = "rgba(10, 5, 20, 0.9)";
       ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
       ctx.lineWidth = 2;
       ctx.beginPath(); ctx.roundRect(mx, my, mw, mh, 25); ctx.fill(); ctx.stroke();
       ctx.shadowBlur = 0;
       
       ctx.fillStyle = "#fff";
       ctx.font = "bold 28px 'Panchang', sans-serif";
       ctx.fillText("INSTRUMENT LIBRARY", w/2, my + 50);
       
       const itemsPerRow = 3;
       const itemW = (mw - 40) / itemsPerRow;
       const itemH = 55;
       
       for (let i = 0; i < this.catalog.length; i++) {
          let ix = mx + 20 + (i % itemsPerRow) * itemW;
          let iy = my + 85 + Math.floor(i / itemsPerRow) * (itemH + 15);
          
          const s = (this.clickAnims[`modal_${i}`] || 0) * 4;
          
          let isHovered = false;
          if (this.mouseX > ix + 8 && this.mouseX < ix + itemW - 8 && this.mouseY > iy + 5 && this.mouseY < iy + itemH - 5) {
             isHovered = true;
          }
          
          // Outer glow
          if (isHovered) {
             ctx.shadowBlur = 15;
             ctx.shadowColor = this.catalog[i].color;
          }
          
          ctx.fillStyle = isHovered ? this.catalog[i].color : `rgba(255, 255, 255, 0.03)`;
          ctx.strokeStyle = this.catalog[i].color;
          ctx.lineWidth = isHovered ? 2 : 1;
          
          ctx.beginPath(); 
          ctx.roundRect(ix + 8 + s, iy + 5 + s, itemW - 16 - s*2, itemH - s*2, itemH/2);
          ctx.fill(); ctx.stroke();
          ctx.shadowBlur = 0;
          
          ctx.fillStyle = isHovered ? "#000" : this.catalog[i].color;
          ctx.font = "bold 13px 'Panchang', sans-serif";
          ctx.fillText(this.catalog[i].name, ix + itemW/2, iy + itemH/2 + 5);
       }
       
       ctx.fillStyle = "rgba(255,255,255,0.5)";
       ctx.font = "12px sans-serif";
       ctx.fillText("Click outside to close", w/2, my + mh - 20);
    }
  }

  destroy() {
     if (this.audioCtx) this.audioCtx.close();
  }
}
