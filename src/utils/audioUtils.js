// src/utils/audioUtils.js
// Centralized audio manager for the app. Handles creation and cleanup of all WebAudio nodes
// so screens can safely call audioManager.stopAll() without crashing in browsers that block
// autoplay until a user gesture.

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.activeOscillators = new Set();  // currently playing oscillators
    this.activeGains = new Set();
    this._ensureContext();
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

  // Some browsers start in "suspended" state until there is a user gesture.
  resume() {
    const ctx = this._ensureContext();
    if (ctx && ctx.state === 'suspended') {
      try { return ctx.resume(); } catch { /* noop */ }
    }
    return Promise.resolve();
  }

  // Low level tone helper used by the UI sound effects.
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

    // Track to allow global stop
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
    // little rising triad
    this.playTone(523.25, 0.12, 'sine', 0.18); // C5
    setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.18), 110); // E5
    setTimeout(() => this.playTone(783.99, 0.16, 'sine', 0.18), 220); // G5
  }

  playWrongSound() {
    this.playTone(330, 0.12, 'triangle', 0.16);   // E4
    setTimeout(() => this.playTone(294, 0.12, 'triangle', 0.16), 90); // D4
    setTimeout(() => this.playTone(262, 0.18, 'triangle', 0.16), 180); // C4
  }

  playButtonClick() {
    this.playTone(700, 0.06, 'square', 0.12);
    setTimeout(() => this.playTone(500, 0.05, 'square', 0.10), 50);
  }

  playCompleteSound() {
    this.playTone(523.25, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 150);
    setTimeout(() => this.playTone(783.99, 0.25, 'sine', 0.2), 300);
  }

  // Stop and cleanup ----------------------------------------------------------

  stopAll() {
    // Gracefully stop any active oscillators.
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
