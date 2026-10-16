export interface SpeechSynthesisOptions {
  voiceURI?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  lang?: string;
}

export type TTSPlaybackState = 'stopped' | 'speaking' | 'paused';

class SpeechSynthesisService {
  private synth: globalThis.SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private state: TTSPlaybackState = 'stopped';
  private lastSpokenText = '';
  private lastOptions: SpeechSynthesisOptions = {};
  private stateListeners: Set<(state: TTSPlaybackState) => void> = new Set();
  private keepAliveTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      // Auto-unlock on first user interaction anywhere on the page
      const unlock = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
    }
  }

  public isSupported(): boolean {
    return !!this.synth;
  }

  public getState(): TTSPlaybackState {
    return this.state;
  }

  public onStateChange(listener: (state: TTSPlaybackState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(newState: TTSPlaybackState): void {
    this.state = newState;
    this.stateListeners.forEach(listener => listener(newState));
  }

  /**
   * Resumes and unfreezes the SpeechSynthesis engine if paused by browser autoplay policy.
   */
  public unlockAudio(): void {
    if (!this.synth) return;
    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
    } catch {
      // ignore
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) return [];
    let voices = this.synth.getVoices();
    if (voices.length > 0) return voices;

    return new Promise(resolve => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve(this.synth?.getVoices() || []);
        }
      };

      if (this.synth) {
        this.synth.onvoiceschanged = done;
      }
      setTimeout(done, 1200);
    });
  }

  public speak(
    text: string,
    options: SpeechSynthesisOptions = {},
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: any) => void;
      onPause?: () => void;
      onResume?: () => void;
      onBoundary?: (charIndex: number, charLength?: number) => void;
    }
  ): void {
    if (!this.synth) {
      callbacks?.onEnd?.();
      return;
    }

    // Cancel existing speech and unfreeze paused state
    this.cancel();
    if (this.synth.paused) {
      this.synth.resume();
    }

    // Clean markdown, symbols, code blocks, and math for natural pronunciation
    const cleanText = text
      .replace(/[*_~`#\[\]]/g, '')
      .replace(/\{[^\}]+\}/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      this.setState('stopped');
      callbacks?.onEnd?.();
      return;
    }

    this.lastSpokenText = cleanText;
    this.lastOptions = options;

    const voices = this.synth.getVoices();
    // If voices haven't loaded yet, load them first and then speak
    if (voices.length === 0) {
      this.loadVoices().then(() => {
        this.speak(text, options, callbacks);
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.pitch = Math.max(0.6, Math.min(1.8, options.pitch ?? 1.0));
    utterance.rate = Math.max(0.7, Math.min(1.5, options.rate ?? 1.0));
    utterance.volume = Math.max(0.1, Math.min(1.0, options.volume ?? 1.0));

    // Multi-tier voice selection to guarantee every question is spoken
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (options.voiceURI) {
      selectedVoice = voices.find(v => v.voiceURI === options.voiceURI);
    }

    const targetLang = (options.lang || 'en').toLowerCase();
    const langPrefix = targetLang.slice(0, 2);

    if (!selectedVoice) {
      // Tier 1: Exact language match (e.g., 'en-IN', 'hi-IN') with high quality names
      selectedVoice = voices.find(v => 
        v.lang.toLowerCase() === targetLang &&
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online') || v.name.includes('Neural'))
      );
    }

    if (!selectedVoice) {
      // Tier 2: Any voice matching exact language code
      selectedVoice = voices.find(v => v.lang.toLowerCase() === targetLang);
    }

    if (!selectedVoice) {
      // Tier 3: Language prefix match (e.g. 'en', 'hi', 'te')
      selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
    }

    if (!selectedVoice) {
      // Tier 4: Natural or Google English fallback voice (guarantees voice output on all laptops)
      selectedVoice = voices.find(v => 
        v.lang.toLowerCase().startsWith('en') && 
        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online') || v.name.includes('Neural') || v.name.includes('David') || v.name.includes('Zira'))
      ) || voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      // Critical fix: If fallback voice is in a different language than options.lang,
      // align utterance.lang with voice.lang so Windows SAPI speech driver accepts it!
      if (!selectedVoice.lang.toLowerCase().startsWith(langPrefix)) {
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = options.lang || selectedVoice.lang;
      }
    } else if (options.lang) {
      utterance.lang = options.lang;
    }

    // Pin utterance to window to protect against Chromium V8 garbage collection bug
    (window as any).__aiSpeechUtterance = utterance;

    // Clear previous keep-alive timer
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    utterance.onstart = () => {
      this.setState('speaking');
      callbacks?.onStart?.();

      // Chromium 15-second speech synthesis freeze watchdog
      this.keepAliveTimer = setInterval(() => {
        if (!this.synth || this.state !== 'speaking') {
          if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
          return;
        }
        try {
          this.synth.pause();
          this.synth.resume();
        } catch {
          // ignore
        }
      }, 10000);
    };

    utterance.onpause = () => {
      this.setState('paused');
      callbacks?.onPause?.();
    };

    utterance.onresume = () => {
      this.setState('speaking');
      callbacks?.onResume?.();
    };

    const cleanup = () => {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      this.currentUtterance = null;
      (window as any).__aiSpeechUtterance = null;
      this.setState('stopped');
    };

    utterance.onend = () => {
      cleanup();
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      cleanup();
      // Ignore normal user cancellation or interrupted errors
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('[SpeechSynthesis] Utterance error:', e.error);
      callbacks?.onError?.(e);
    };

    utterance.onboundary = (e: SpeechSynthesisEvent) => {
      callbacks?.onBoundary?.(e.charIndex, (e as any).charLength);
    };

    this.currentUtterance = utterance;

    // Small delay prevents Chromium race condition where cancel() kills immediate speak()
    setTimeout(() => {
      try {
        if (this.synth) {
          if (this.synth.paused) {
            this.synth.resume();
          }
          this.synth.speak(utterance);
        }
      } catch (err) {
        console.warn('[SpeechSynthesis] speak invocation failed:', err);
        cleanup();
        callbacks?.onError?.(err);
      }
    }, 40);
  }

  public pause(): void {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      try {
        this.synth.pause();
        this.setState('paused');
      } catch (err) {
        console.warn('Speech pause error', err);
      }
    }
  }

  public resume(): void {
    if (this.synth && this.synth.paused) {
      try {
        this.synth.resume();
        this.setState('speaking');
      } catch (err) {
        console.warn('Speech resume error', err);
      }
    }
  }

  public cancel(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
      this.currentUtterance = null;
      (window as any).__aiSpeechUtterance = null;
      this.setState('stopped');
    }
  }

  public stop(): void {
    this.cancel();
  }

  public repeat(): void {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, this.lastOptions);
    }
  }

  public isSpeaking(): boolean {
    return !!this.synth && (this.synth.speaking || this.state === 'speaking');
  }

  public isPaused(): boolean {
    return !!this.synth && (this.synth.paused || this.state === 'paused');
  }

  public getCapabilities() {
    const isSupported = this.isSupported();
    const voices = this.getVoices();
    return {
      supported: isSupported,
      voicesCount: voices.length,
      hasVoices: voices.length > 0
    };
  }
}

export const ttsService = new SpeechSynthesisService();
