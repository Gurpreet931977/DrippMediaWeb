export default class RetroAudio {
  constructor() {
    this.ctx = null;
    this.bgmTimer = null;
    this.isPlayingBGM = false;
    this.masterGain = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Default volume
    }
    // Resume context if suspended (browser autoplay policies)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.3;
    }
  }

  playSFX(type) {
    if (!this.ctx || this.isMuted) return;
    try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        
        if (type === 'coin') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.setValueAtTime(600, now + 0.1);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        } else if (type === 'jump') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'explosion') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
        } else if (type === 'laser') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === 'hurt') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
          gain.gain.setValueAtTime(0.5, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'blip') {
          osc.type = 'square';
          osc.frequency.setValueAtTime(600, now);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          osc.start(now);
          osc.stop(now + 0.05);
        }
    } catch (e) {
        // Ignore audio errors
    }
  }

  playBGM(type) {
     if (!this.ctx || this.isMuted) return;
     this.stopBGM();
     this.isPlayingBGM = true;
     
     const seqArcade = [
       {f: 440, d: 0.15}, {f: null, d: 0.15}, {f: 523.25, d: 0.15}, {f: 587.33, d: 0.15},
       {f: 659.25, d: 0.15}, {f: 587.33, d: 0.15}, {f: 523.25, d: 0.15}, {f: null, d: 0.15},
       {f: 440, d: 0.15}, {f: 440, d: 0.15}, {f: 523.25, d: 0.15}, {f: 659.25, d: 0.15},
       {f: 783.99, d: 0.3}, {f: 659.25, d: 0.3}
     ];

     const seqDevil = [
       {f: 110, d: 0.12}, {f: 110, d: 0.12}, {f: 130.81, d: 0.12}, {f: 110, d: 0.12},
       {f: 146.83, d: 0.12}, {f: 110, d: 0.12}, {f: 164.81, d: 0.12}, {f: 146.83, d: 0.12},
       {f: 110, d: 0.12}, {f: 110, d: 0.12}, {f: 98.00, d: 0.12}, {f: 110, d: 0.12},
       {f: 82.41, d: 0.12}, {f: 110, d: 0.12}, {f: 98.00, d: 0.12}, {f: 130.81, d: 0.12}
     ];

     const seqBomber = [
       {f: 196.00, d: 0.15}, {f: 196.00, d: 0.15}, {f: 392.00, d: 0.3},
       {f: 196.00, d: 0.15}, {f: 349.23, d: 0.3}, {f: 196.00, d: 0.15},
       {f: 311.13, d: 0.3}, {f: 196.00, d: 0.15}, {f: 293.66, d: 0.3},
       {f: null, d: 0.3}
     ];

     const seqTanks = [
       {f: 65.41, d: 0.6}, {f: null, d: 0.15}, {f: 98.00, d: 0.6}, {f: null, d: 0.15},
       {f: 73.42, d: 0.6}, {f: null, d: 0.15}, {f: 82.41, d: 0.6}, {f: null, d: 0.15}
     ];

     const seqZen = [
       {f: 261.63, d: 1.5}, {f: null, d: 0.5}, {f: 329.63, d: 1.5}, {f: null, d: 0.5},
       {f: 392.00, d: 1.5}, {f: null, d: 0.5}, {f: 523.25, d: 2.0}, {f: null, d: 1.0}
     ];

     let seq = seqArcade;
     let wType = 'square';
     let vol = 0.1;
     if (type === 'devil') { seq = seqDevil; wType = 'sawtooth'; vol = 0.15; }
     if (type === 'bomber') { seq = seqBomber; wType = 'square'; vol = 0.1; }
     if (type === 'tanks') { seq = seqTanks; wType = 'triangle'; vol = 0.2; }
     if (type === 'zen') { seq = seqZen; wType = 'sine'; vol = 0.1; }
     if (type === 'boss') { seq = seqDevil; wType = 'sawtooth'; vol = 0.15; }
     
     let step = 0;
     
     const playNote = () => {
        if (!this.isPlayingBGM) return;
        try {
            const note = seq[step % seq.length];
            if (note.f !== null) {
               const osc = this.ctx.createOscillator();
               const gain = this.ctx.createGain();
               osc.connect(gain);
               gain.connect(this.masterGain);
               
               const now = this.ctx.currentTime;
               osc.type = wType;
               osc.frequency.value = note.f;
               
               if (wType === 'sine') {
                  gain.gain.setValueAtTime(0, now);
                  gain.gain.linearRampToValueAtTime(vol, now + note.d * 0.3);
                  gain.gain.linearRampToValueAtTime(0, now + note.d);
               } else {
                  gain.gain.setValueAtTime(vol, now);
                  gain.gain.exponentialRampToValueAtTime(0.01, now + note.d * 0.8);
               }
               
               osc.start(now);
               osc.stop(now + note.d);
            }
            step++;
            this.bgmTimer = setTimeout(playNote, note.d * 1000);
        } catch (e) {}
     };
     
     playNote();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }
}
