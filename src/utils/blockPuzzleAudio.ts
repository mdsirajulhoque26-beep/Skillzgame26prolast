// Block Puzzle Web Audio & Haptic Sound Engine
// Safe, fast, zero latency, runs smoothly on any mobile browser / WebView

class BlockSoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public isHapticEnabled: boolean = true;

  constructor() {
    // Check saved settings
    try {
      this.isMuted = localStorage.getItem('bp_sound_muted') === 'true';
      this.isHapticEnabled = localStorage.getItem('bp_haptic_enabled') !== 'false';
    } catch {
      this.isMuted = false;
      this.isHapticEnabled = true;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('bp_sound_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public toggleHaptic(): boolean {
    this.isHapticEnabled = !this.isHapticEnabled;
    try {
      localStorage.setItem('bp_haptic_enabled', String(this.isHapticEnabled));
    } catch {}
    return this.isHapticEnabled;
  }

  public triggerHaptic(pattern: number | number[] = 15) {
    if (this.isHapticEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  // Play crisp place sound
  public playPlace() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
      this.triggerHaptic(10);
    } catch {}
  }

  // Play line clear chord with ascending pitch for combos
  public playLineClear(comboCount: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const baseFreq = 440 * Math.pow(1.15, Math.min(comboCount - 1, 6));
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.03);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.03 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.03);
        osc.stop(this.ctx.currentTime + idx * 0.03 + 0.25);
      });

      this.triggerHaptic([20, 30, 40]);
    } catch {}
  }

  // Special block sounds
  public playBomb() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
      this.triggerHaptic([40, 30, 50]);
    } catch {}
  }

  public playLightning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
      this.triggerHaptic([15, 20, 30]);
    } catch {}
  }

  public playWin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, High C
      notes.forEach((note, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, this.ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + i * 0.12);
        osc.stop(this.ctx.currentTime + i * 0.12 + 0.35);
      });
      this.triggerHaptic([30, 40, 50, 60]);
    } catch {}
  }

  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
      this.triggerHaptic(5);
    } catch {}
  }
}

export const blockAudio = new BlockSoundManager();
