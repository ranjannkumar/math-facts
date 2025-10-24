// src/utils/audioUtils.js
// Centralized audio manager for the app. Handles creation and cleanup of all WebAudio nodes

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.activeOscillators = new Set();
    this.activeGains = new Set();
    this.audioBuffers = {}; // Store loaded audio buffers
    this._ensureContext();
    this._loadAllAudio(); // Load all audio files on initialization

     
    document.addEventListener('click', this.resume.bind(this), { once: true });
    document.addEventListener('keydown', this.resume.bind(this), { once: true });
  }

  _ensureContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.audioContext = null;
      }
    }
    return this.audioContext;
  }
  
  // New method to load audio files
  async _loadAudio(name, path) {
    const ctx = this._ensureContext();
    if (!ctx) return;
    
    try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.audioBuffers[name] = audioBuffer;
    } catch (e) {
        console.error(`Error loading audio file ${path}:`, e);
    }
  }

  _loadAllAudio() {
      // Assuming 'flash_sound.mp3' and 'start+next.mp3' are in the public folder
      this._loadAudio('flash', '/flash_sound.mp3');
      this._loadAudio('startNext', '/start+next.mp3');
      this._loadAudio('wrong', '/wrong_sound.mp3');
      this._loadAudio('green', '/green_tick_sound.mp3');
      this._loadAudio('animation', '/animation_sound.mp3');
      // this._loadAudio('3_streak', '/3_streak_sound.mp3');
      // this._loadAudio('5_streak', '/5_streak_sound.mp3');
      // this._loadAudio('10_streak', '/10_streak_sound.mp3');
      this._loadAudio('15_streak', '/15_streak_sound.mp3');
      this._loadAudio('20_streak', '/20_streak_sound.mp3');
      // this._loadAudio('3_lightning_streak', '/3_streak_sound.mp3');
      // this._loadAudio('5_lightning_streak', '/5_streak_sound.mp3');
      // this._loadAudio('10_lightning_streak', '/10_streak_sound.mp3');
      this._loadAudio('15_lightning_streak', '/15_streak_sound.mp3');
      this._loadAudio('20_lightning_streak', '/20_streak_sound.mp3');
  }

  // New method to play an audio buffer
  _playBuffer(name, volume = 0.15) {
    const ctx = this._ensureContext();
    const buffer = this.audioBuffers[name];
    if (!ctx || !buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    // Playback and cleanup
    const stop = () => {
      try { source.stop(); } catch { /* already stopped */ }
      try { source.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
    };

    source.onended = stop;
    try { source.start(); } catch {}
  }
  
  // Some browsers start in "suspended" state until there is a user gesture.
  resume() {
    const ctx = this._ensureContext();
    if (ctx && ctx.state === 'suspended') {
      try { return ctx.resume(); } catch { /* noop */ }
    }
    return Promise.resolve();
  }

  // Low level tone helper (kept just in case, but no longer used for new sounds)
  playTone(frequency = 440, duration = 0.2, type = 'sine', volume = 0.15) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = volume;

    osc.type = type;
    osc.frequency.value = frequency;

    osc.connect(gain);
    gain.connect(ctx.destination);

    this.activeOscillators.add(osc);
    this.activeGains.add(gain);

    const stop = () => {
      try { osc.stop(); } catch { /* already stopped */ }
      try { osc.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
      this.activeOscillators.delete(osc);
      this.activeGains.delete(gain);
    };

    osc.onended = stop;

    try { osc.start(); } catch {}
    setTimeout(stop, Math.max(10, duration * 1000));
  }

  // Sound effects -------------------------------------------------------------

  playCorrectSound() {
    this.playTone(523.25, 0.12, 'sine', 0.18); // C5
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.18), 80); // E5
    // setTimeout(() => this.playTone(783.99, 0.16, 'sine', 0.18), 50); // G5
  }


  playWrongSound() {
    // Play a different sound for wrong answers - lower pitch with different waveform
    this.playTone(330, 0.2, 'triangle', 0.12); // E4
    setTimeout(() => this.playTone(294, 0.2, 'triangle', 0.12), 80); // D4
    // setTimeout(() => this.playTone(262, 0.3, 'triangle', 0.12), 200); // C4
  }
  
  // Used for wrong answers and as a general quick "next" sound
  playSoftClick() {
     this._playBuffer('wrong', 0.5); // Use wrong.mp3 as the generic "tick" or soft sound
  }

  // Used for button clicks like Next/Start
  playButtonClick() {
    this._playBuffer('startNext', 0.8); 
  }

  // General quiz complete sound (can keep as tone or use an MP3 if available)
  playCompleteSound() {
    this.playTone(523.25, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 50);
    // setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.2), 300);
  }
  
  // Sounds for specific correct symbols
  playLightningSound() {
      // flash_sound.mp3
      this._playBuffer('flash', 0.9); 
  }
  
  playStarSound() {
      // Using flash_sound.mp3 for green tick
      this._playBuffer('flash', 0.7); 
  }
  
  playCheckSound() {
      // Using start+next.mp3 for simple tick
      this._playBuffer('green', 0.6); 
  }

  playAnimationSound() {
      // Using start+next.mp3 for simple tick
      this._playBuffer('animation', 0.6); 
  }

  playStreakSound(streakCount) {
    if (streakCount === 3) {
      this._playBuffer('15_streak', 0.8);
    } else if (streakCount === 5) {
      this._playBuffer('15_streak', 0.8);
    } else if (streakCount === 10) {
      this._playBuffer('15_streak', 0.8);
    } else if (streakCount === 15) {
      this._playBuffer('15_streak', 0.8);
    } else if (streakCount === 20) {
      this._playBuffer('15_streak', 0.8);
    }
  }

  playLightningStreakSound(streakCount) {
    if (streakCount === 3) {
      this._playBuffer('20_lightning_streak', 0.8);
    } else if (streakCount === 5) {
      this._playBuffer('20_lightning_streak', 0.8);
    } else if (streakCount === 10) {
      this._playBuffer('20_lightning_streak', 0.8);
    } else if (streakCount === 15) {
      this._playBuffer('20_lightning_streak', 0.8);
    } else if (streakCount === 20) {
      this._playBuffer('20_lightning_streak', 0.8);
    }
  }

  // Stop and cleanup ----------------------------------------------------------

  stopAll() {
    // Gracefully stop any active oscillators (if tones are still used).
    for (const osc of Array.from(this.activeOscillators)) {
      try { osc.stop(); } catch {}
      try { osc.disconnect(); } catch {}
      this.activeOscillators.delete(osc);
    }
    for (const g of Array.from(this.activeGains)) {
      try { g.disconnect(); } catch {}
      this.activeGains.delete(g);
    }
  }
}

// Singleton
const audioManager = new AudioManager();
export default audioManager;
