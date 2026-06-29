export default class RetroAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.bgmVolume = 1.0;
    this.sfxVolume = 1.0;
    this.isPlayingBGM = false;
    this.bgmTimer = null;
    this.bgmNodes = [];
    this.activeOscillators = [];
    this.bgmLoopId = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
      
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.bgmVolume;
      this.bgmGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
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
        gain.connect(this.sfxGain);

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
     this.bgmLoopId = Math.random();
     const currentLoopId = this.bgmLoopId;
     
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
     let vol = 0.08;
     if (type === 'devil') { seq = seqDevil; wType = 'sawtooth'; vol = 0.12; }
     if (type === 'bomber') { seq = seqBomber; wType = 'square'; vol = 0.08; }
     if (type === 'tanks') { seq = seqTanks; wType = 'triangle'; vol = 0.15; }
     if (type === 'zen') { seq = seqZen; wType = 'sine'; vol = 0.08; }
     if (type === 'boss') { seq = seqDevil; wType = 'sawtooth'; vol = 0.12; }
     
     // Cinematic Effect Chain
     const filter = this.ctx.createBiquadFilter();
     filter.type = 'lowpass';
     filter.Q.value = 3;
     
     const delay = this.ctx.createDelay();
     delay.delayTime.value = 0.3; 
     const feedback = this.ctx.createGain();
     feedback.gain.value = 0.35; 
     
     filter.connect(this.bgmGain);
     filter.connect(delay);
     delay.connect(feedback);
     feedback.connect(delay);
     delay.connect(this.bgmGain);
     
     if (!this.bgmNodes) this.bgmNodes = [];
     this.bgmNodes.push(filter, delay, feedback);
     
     this.activeOscillators = []; // Track to stop instantly on glitch/stop
     let step = 0;
     let nextNoteTime = this.ctx.currentTime + 0.1;
     const lookahead = 0.1; // 100ms
     
     const scheduleNotes = () => {
        if (!this.isPlayingBGM || this.bgmLoopId !== currentLoopId) return;
        
        while (nextNoteTime < this.ctx.currentTime + lookahead) {
            const note = seq[step % seq.length];
            
            if (note.f !== null) {
               try {
                   // Clean up finished oscillators to prevent memory leaks
                   this.activeOscillators = this.activeOscillators.filter(o => o.endTime > this.ctx.currentTime);
                   
                   // Dynamic filter sweep
                   filter.frequency.setValueAtTime(400, nextNoteTime);
                   filter.frequency.exponentialRampToValueAtTime(3000, nextNoteTime + note.d * 0.2);
                   filter.frequency.exponentialRampToValueAtTime(400, nextNoteTime + note.d);
                   
                   const osc1 = this.ctx.createOscillator();
                   const osc2 = this.ctx.createOscillator();
                   const oscSub = this.ctx.createOscillator();
                   const gain = this.ctx.createGain();
                   
                   osc1.connect(gain);
                   osc2.connect(gain);
                   oscSub.connect(gain);
                   gain.connect(filter);
                   
                   osc1.type = wType;
                   osc2.type = wType;
                   oscSub.type = (wType === 'sine') ? 'sine' : 'square';
                   
                   osc1.frequency.value = note.f;
                   osc2.frequency.value = note.f;
                   osc2.detune.value = 12; // Rich chorus
                   oscSub.frequency.value = note.f / 2; // Deep bass layer
                   
                   // Smooth ADSR envelope to remove harsh clipping/clicks
                   gain.gain.setValueAtTime(0, nextNoteTime);
                   if (wType === 'sine') {
                      gain.gain.linearRampToValueAtTime(vol, nextNoteTime + note.d * 0.4);
                      gain.gain.linearRampToValueAtTime(0.01, nextNoteTime + note.d * 0.9);
                   } else {
                      gain.gain.linearRampToValueAtTime(vol, nextNoteTime + 0.05); // fast attack
                      gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + note.d * 0.9); // smooth decay
                   }
                   
                   osc1.start(nextNoteTime); osc2.start(nextNoteTime); oscSub.start(nextNoteTime);
                   osc1.stop(nextNoteTime + note.d); osc2.stop(nextNoteTime + note.d); oscSub.stop(nextNoteTime + note.d);
                   
                   // Track for manual stopping
                   osc1.endTime = nextNoteTime + note.d;
                   this.activeOscillators.push(osc1, osc2, oscSub);
               } catch (e) {}
            }
            
            nextNoteTime += note.d;
            step++;
        }
        
        this.bgmTimer = setTimeout(scheduleNotes, 50); // Polling interval
     };
     
     scheduleNotes();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    this.bgmLoopId = 0;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
    
    if (this.activeOscillators && this.activeOscillators.length > 0) {
       this.activeOscillators.forEach(o => { try { o.stop(); } catch(e){} });
       this.activeOscillators = [];
    }
    
    if (this.bgmNodes && this.bgmNodes.length > 0) {
       this.bgmNodes.forEach(n => { try { n.disconnect(); } catch(e){} });
       this.bgmNodes = [];
    }
  }

  setBGMVolume(vol) {
    this.bgmVolume = vol;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(vol, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = vol;
    if (this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(vol, this.ctx ? this.ctx.currentTime : 0);
    }
  }
}
