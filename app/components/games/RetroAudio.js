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
     
     const scale = [220, 261.63, 293.66, 329.63, 392.00, 440];
     let step = 0;
     
     const playNote = () => {
        if (!this.isPlayingBGM) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            const now = this.ctx.currentTime;
            
            if (type === 'arcade') {
               osc.type = 'square';
               osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];
               gain.gain.setValueAtTime(0.1, now);
               gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
               osc.start(now);
               osc.stop(now + 0.2);
               this.bgmTimer = setTimeout(playNote, 200);
            } else if (type === 'zen') {
               osc.type = 'sine';
               osc.frequency.value = scale[Math.floor(Math.random() * 3)] / 2; // lower
               gain.gain.setValueAtTime(0, now);
               gain.gain.linearRampToValueAtTime(0.15, now + 1);
               gain.gain.linearRampToValueAtTime(0, now + 3);
               osc.start(now);
               osc.stop(now + 3);
               this.bgmTimer = setTimeout(playNote, 2500);
            } else if (type === 'boss' || type === 'devil') {
               osc.type = 'sawtooth';
               osc.frequency.value = (step % 4 === 0) ? 110 : 164.81; // intense bass
               gain.gain.setValueAtTime(0.2, now);
               gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
               osc.start(now);
               osc.stop(now + 0.15);
               step++;
               this.bgmTimer = setTimeout(playNote, 150);
            }
        } catch (e) {}
     };
     
     playNote();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) clearTimeout(this.bgmTimer);
  }
}
