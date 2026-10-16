/**
 * Sound Effects Service
 * 
 * Uses the Web Audio API to generate crisp UI audio feedback without requiring
 * any external audio files. All sounds are procedurally synthesized.
 */

type SoundName =
  | 'question_start'
  | 'answer_submitted'
  | 'interview_complete'
  | 'mic_start'
  | 'mic_stop'
  | 'button_click'
  | 'achievement'
  | 'warning'
  | 'timer_critical';

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(val: boolean) {
    this.enabled = val;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gain = 0.15,
    startTime = 0
  ) {
    const ctx = this.getContext();
    if (!ctx || !this.enabled) return;

    try {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    } catch {
      // ignore
    }
  }

  play(name: SoundName) {
    if (!this.enabled) return;
    switch (name) {
      case 'question_start':
        // Ascending two-tone chime: professional and clean
        this.playTone(523, 0.15, 'sine', 0.12, 0);     // C5
        this.playTone(659, 0.2, 'sine', 0.10, 0.12);   // E5
        break;

      case 'answer_submitted':
        // Satisfying confirmation ding
        this.playTone(880, 0.1, 'sine', 0.12, 0);      // A5
        this.playTone(1046, 0.25, 'sine', 0.09, 0.08); // C6
        break;

      case 'interview_complete':
        // Triumphant flourish
        this.playTone(523, 0.15, 'sine', 0.15, 0);
        this.playTone(659, 0.15, 'sine', 0.13, 0.15);
        this.playTone(784, 0.15, 'sine', 0.13, 0.30);
        this.playTone(1046, 0.4, 'sine', 0.12, 0.45);
        break;

      case 'mic_start':
        // Low ascending beep — recording started
        this.playTone(440, 0.1, 'sine', 0.1, 0);
        this.playTone(554, 0.12, 'sine', 0.08, 0.10);
        break;

      case 'mic_stop':
        // Descending beep — recording stopped
        this.playTone(554, 0.1, 'sine', 0.1, 0);
        this.playTone(440, 0.12, 'sine', 0.08, 0.10);
        break;

      case 'button_click':
        this.playTone(600, 0.06, 'square', 0.04, 0);
        break;

      case 'achievement':
        this.playTone(698, 0.12, 'sine', 0.14, 0);
        this.playTone(880, 0.12, 'sine', 0.12, 0.10);
        this.playTone(1047, 0.12, 'sine', 0.12, 0.20);
        this.playTone(1397, 0.3, 'sine', 0.10, 0.30);
        break;

      case 'warning':
        this.playTone(370, 0.15, 'sawtooth', 0.08, 0);
        this.playTone(294, 0.25, 'sawtooth', 0.07, 0.15);
        break;

      case 'timer_critical':
        this.playTone(440, 0.08, 'square', 0.06, 0);
        break;
    }
  }
}

export const soundService = new SoundEffectsService();
