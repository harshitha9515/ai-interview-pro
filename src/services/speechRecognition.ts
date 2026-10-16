// Speech Recognition service supporting Web Speech API with microphone permission handling,
// audio track cleanup, live interim transcription, and external STT provider interface.

import { MicPermissionState, RecordingState } from '../types/interview';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionCallbacks {
  onInterim?: (interimText: string) => void;
  onFinal?: (finalText: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onStateChange?: (state: RecordingState) => void;
}

export interface ExternalSTTProvider {
  name: string;
  transcribeAudioBlob(blob: Blob, lang?: string): Promise<string>;
}

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening = false;
  private recordingState: RecordingState = 'inactive';
  private currentLanguage = 'en-US';
  private activeMediaStream: MediaStream | null = null;
  private externalProvider: ExternalSTTProvider | null = null;
  private callbacks: SpeechRecognitionCallbacks = {};
  private autoRestart = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public getRecordingState(): RecordingState {
    return this.recordingState;
  }

  private setRecordingState(state: RecordingState): void {
    this.recordingState = state;
    this.callbacks.onStateChange?.(state);
  }

  /**
   * Check microphone permission state without triggering prompt if possible
   */
  public async checkPermission(): Promise<MicPermissionState> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return 'unsupported';
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'microphone' as any });
        return status.state as MicPermissionState;
      }
    } catch (e) {
      // Some browsers (e.g. Firefox) do not support 'microphone' in permissions.query
    }

    return 'prompt';
  }

  /**
   * Prompt candidate explicitly for microphone access
   */
  public async requestPermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return { granted: false, error: 'Audio recording is not supported in this browser environment.' };
    }

    try {
      this.setRecordingState('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      // Immediately stop temporary test tracks to respect candidate privacy
      stream.getTracks().forEach(track => track.stop());
      this.setRecordingState('inactive');
      return { granted: true };
    } catch (err: any) {
      this.setRecordingState('error');
      let msg = 'Microphone permission was denied. You can still type your answers directly.';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone device was detected on your computer.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone access was denied. Please allow microphone permissions in your browser URL bar or type your answers.';
      }
      return { granted: false, error: msg };
    }
  }

  /**
   * Start speech recognition and capture candidate spoken response
   */
  public async start(callbacks: SpeechRecognitionCallbacks, lang: string = 'en-US'): Promise<void> {
    this.callbacks = callbacks;

    if (!this.recognition) {
      this.setRecordingState('error');
      callbacks.onError?.('Web Speech Recognition is not available in this browser. Please use Chrome/Edge or type your answers.');
      return;
    }

    // Stop existing session cleanly
    if (this.isListening) {
      this.stop();
    }

    this.currentLanguage = lang;
    this.recognition.lang = lang;
    this.autoRestart = true;

    // Acquire mic stream for hardware activity indicator and visualizer
    try {
      this.setRecordingState('requesting');
      this.activeMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (permErr: any) {
      this.setRecordingState('error');
      const errorMsg = permErr.name === 'NotAllowedError' 
        ? 'Microphone permission denied. Please allow microphone access or type your answers.' 
        : 'Microphone hardware unavailable.';
      callbacks.onError?.(errorMsg);
      return;
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      this.setRecordingState('recording');
      callbacks.onStart?.();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        callbacks.onFinal?.(finalTranscript.trim());
      }
      if (interimTranscript) {
        callbacks.onInterim?.(interimTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error event:', event.error);

      if (event.error === 'no-speech') {
        // Natural pause in candidate speech, keep listening without erroring
        return;
      }

      if (event.error === 'aborted') {
        this.setRecordingState('inactive');
        return;
      }

      let message = 'Speech recognition encountered an issue.';
      if (event.error === 'not-allowed') {
        message = 'Microphone permission was not allowed.';
        this.autoRestart = false;
      } else if (event.error === 'audio-capture') {
        message = 'No microphone device was detected.';
        this.autoRestart = false;
      } else if (event.error === 'network') {
        message = 'Network connectivity issue with speech recognition service. You can type your response.';
      }

      this.setRecordingState('error');
      callbacks.onError?.(message);
    };

    this.recognition.onend = () => {
      // If candidate is still supposed to be recording (e.g. browser speech engine timed out on silence), auto-resume
      if (this.autoRestart && this.isListening) {
        try {
          this.recognition.start();
          return;
        } catch (e) {
          // Fall through to cleanup
        }
      }

      this.isListening = false;
      this.releaseMediaStream();
      this.setRecordingState('inactive');
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start call error', err);
      this.setRecordingState('error');
      callbacks.onError?.('Could not activate speech recognition.');
    }
  }

  /**
   * Stop recording and release all audio tracks
   */
  public stop(): void {
    this.autoRestart = false;
    this.isListening = false;

    if (this.recognition) {
      try {
        this.setRecordingState('processing');
        this.recognition.stop();
      } catch (err) {
        // ignore
      }
    }

    this.releaseMediaStream();
    setTimeout(() => {
      if (this.recordingState === 'processing') {
        this.setRecordingState('inactive');
      }
    }, 400);
  }

  /**
   * Abort immediately without waiting for final tokens
   */
  public abort(): void {
    this.autoRestart = false;
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (err) {
        // ignore
      }
    }

    this.releaseMediaStream();
    this.setRecordingState('inactive');
  }

  /**
   * Cleanly stop all MediaStream hardware tracks so the browser recording dot disappears
   */
  private releaseMediaStream(): void {
    if (this.activeMediaStream) {
      try {
        this.activeMediaStream.getTracks().forEach(track => {
          track.stop();
        });
      } catch (e) {
        // ignore
      }
      this.activeMediaStream = null;
    }
  }

  public getStatus(): boolean {
    return this.isListening;
  }

  /**
   * Configure alternative cloud STT provider (e.g. OpenAI Whisper or Google Cloud Speech)
   */
  public setExternalProvider(provider: ExternalSTTProvider | null): void {
    this.externalProvider = provider;
  }

  public getExternalProvider(): ExternalSTTProvider | null {
    return this.externalProvider;
  }

  /**
   * Return comprehensive browser speech capability details
   */
  public getCapabilities() {
    const isSupported = this.isSupported();
    let engine = 'None';
    let requiresInternet = false;

    if (typeof window !== 'undefined') {
      if (window.SpeechRecognition) {
        engine = 'Standard W3C SpeechRecognition';
      } else if (window.webkitSpeechRecognition) {
        engine = 'WebKit SpeechRecognition (Chromium / Google Speech Engine)';
        requiresInternet = true;
      }
    }

    return {
      isSupported,
      engine,
      requiresInternet,
      description: isSupported 
        ? `${engine} detected. Continuous transcription is enabled.`
        : 'Speech recognition is not natively supported in this browser. You can type answers directly or configure a cloud STT provider.'
    };
  }
}

export const sttService = new SpeechRecognitionService();
