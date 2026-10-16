// Web Audio API visualizer helper for real and simulated audio waveforms

export class AudioVisualizerService {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isListeningMic = false;
  private isSimulatingSpeech = false;
  private simulatedCadenceTime = 0;
  private currentLevel = 0;
  private frequencyData: Uint8Array = new Uint8Array(32);
  private listeners: Set<(level: number, freq: Uint8Array) => void> = new Set();

  public subscribe(listener: (level: number, freq: Uint8Array) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  /**
   * Start listening to candidate microphone for live volume analysis
   */
  public async startMicrophoneCapture(): Promise<boolean> {
    try {
      if (this.source) {
        this.stop();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      this.isListeningMic = true;
      this.isSimulatingSpeech = false;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

      this.runLoop();
      return true;
    } catch (err) {
      console.warn('Microphone audio capture not available, falling back to simulated levels:', err);
      return false;
    }
  }

  /**
   * Start simulated speech cadence when AI is speaking (approximate speech rhythm)
   */
  public startSpeechSimulation(): void {
    this.isSimulatingSpeech = true;
    this.isListeningMic = false;
    this.simulatedCadenceTime = Date.now();
    this.runLoop();
  }

  public stop(): void {
    this.isListeningMic = false;
    this.isSimulatingSpeech = false;
    this.currentLevel = 0;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close();
      } catch (e) {
        // ignore
      }
      this.audioCtx = null;
    }

    // Broadcast zero level
    this.frequencyData.fill(0);
    this.notify(0, this.frequencyData);
  }

  private runLoop = (): void => {
    if (!this.isListeningMic && !this.isSimulatingSpeech) {
      return;
    }

    if (this.isListeningMic && this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData as any);
      // Compute RMS volume
      let sum = 0;
      for (let i = 0; i < this.frequencyData.length; i++) {
        sum += this.frequencyData[i];
      }
      const avg = sum / this.frequencyData.length;
      // Normalize 0 - 255 to 0.0 - 1.0 with subtle gain
      this.currentLevel = Math.min(1.0, (avg / 128) * 1.2);
    } else if (this.isSimulatingSpeech) {
      // Procedural natural speech waveform: combination of fast syllables + slower phrase envelope
      const elapsed = (Date.now() - this.simulatedCadenceTime) / 1000;
      const syllableWave = Math.sin(elapsed * 12) * 0.4 + Math.sin(elapsed * 7) * 0.3;
      const pauseWave = Math.max(0, Math.sin(elapsed * 1.8)); // intermittent breath pauses
      
      const raw = (Math.abs(syllableWave) * 0.8 + 0.15) * (pauseWave > 0.15 ? 1 : 0.1);
      this.currentLevel = Math.max(0.05, Math.min(0.95, raw));

      // Synthesize fake frequency bin data for the circular equalizer
      for (let i = 0; i < this.frequencyData.length; i++) {
        const binSpread = Math.sin(elapsed * 8 + i * 0.3) * 0.5 + 0.5;
        this.frequencyData[i] = Math.round(this.currentLevel * binSpread * 255);
      }
    }

    this.notify(this.currentLevel, this.frequencyData);
    this.animFrameId = requestAnimationFrame(this.runLoop);
  };

  private notify(level: number, freq: Uint8Array): void {
    this.listeners.forEach(cb => cb(level, freq));
  }
}

export const audioVisualizerService = new AudioVisualizerService();
