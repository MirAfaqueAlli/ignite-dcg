/**
 * Speech Controller — plays studio-recorded audio for each slide
 * (/audio/${slideId}.mp3), and gracefully falls back to native Web Speech
 * synthesis with lipsync support.
 *
 * Key design: prevents dual-voice race conditions by fully killing audio
 * elements before triggering fallback speech, and vice versa.
 */

export interface SpeechControllerOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: string) => void;
  onBoundary?: (charIndex: number) => void;
}

class SpeechController {
  private options: SpeechControllerOptions = {};
  private audio: HTMLAudioElement | null   = null;
  private currentUrl: string | null        = null;
  private isSpeakingFlag = false;
  private isPausedFlag   = false;
  private isInitialized  = false;
  private speakCounter   = 0;
  private usingFallback  = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  /* ─── Realtime Lipsync (AudioContext) ─── */
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;

  /* ─── Init ─── */
  init(options: SpeechControllerOptions = {}) {
    this.options       = options;
    this.isInitialized = true;
  }

  /**
   * Unlock AudioContext on direct user gesture (touch, click, keydown).
   * Must be called synchronously inside a user-initiated event handler.
   */
  unlock() {
    if (typeof window === 'undefined') return;
    try {
      // Create audio element early
      if (!this.audio) {
        this.audio = new Audio();
      }

      // Create and resume AudioContext
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.5;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
        } catch {
          // source already connected
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch {}
  }

  /* ─── Speak ─── */
  async speak(text: string, slideId?: string) {
    if (typeof window === 'undefined') return;
    this.stop(); // kills any previous audio AND fallback speech

    const currentSpeakId = ++this.speakCounter;
    this.isPausedFlag   = false;
    this.usingFallback  = false;

    // Wake up Web Audio Context
    this.unlock();

    if (!slideId) {
      this._fallbackSpeak(text);
      return;
    }

    // Cache-bust query param ensures browser never serves stale cached audio
    const url = `/audio/${slideId}.mp3?v=${Date.now()}`;

    try {
      if (!this.audio) {
        this.audio = new Audio();
      }

      // Wait for the audio to be ready before playing
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) { reject(new Error('No audio')); return; }

        // Abort if speak() was called again while we wait
        const checkAbort = () => currentSpeakId !== this.speakCounter;

        this.audio.oncanplaythrough = () => {
          if (checkAbort()) return;
          resolve();
        };

        this.audio.onerror = () => {
          reject(new Error(`Audio file ${url} failed to load`));
        };

        this.audio.src = url;
        this.audio.load();
      });

      // Double-check we haven't been superseded
      if (currentSpeakId !== this.speakCounter) return;

      this.audio!.volume = this.options.volume ?? 1;

      this.audio!.onended = () => {
        this.isSpeakingFlag = false;
        this.isPausedFlag   = false;
        this._cleanup();
        this.options.onEnd?.();
      };

      this.audio!.onerror = null; // clear the load error handler

      this.isSpeakingFlag = true;
      this.options.onStart?.();

      await this.audio!.play();

    } catch (err) {
      if (currentSpeakId !== this.speakCounter) return;
      console.warn('[SpeechController] MP3 unavailable, using browser speech:', err);

      // CRITICAL: Kill the audio element's source so it can never auto-play later
      if (this.audio) {
        this.audio.oncanplaythrough = null;
        this.audio.onerror = null;
        this.audio.onended = null;
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load(); // resets the element
      }

      this._fallbackSpeak(text);
    }
  }

  /* ─── Pause ─── */
  pause() {
    if (this.isSpeakingFlag && !this.isPausedFlag) {
      if (this.usingFallback) {
        window.speechSynthesis?.pause();
      } else if (this.audio) {
        this.audio.pause();
      }
      this.isPausedFlag = true;
      this.options.onPause?.();
    }
  }

  /* ─── Resume ─── */
  resume() {
    if (this.isPausedFlag) {
      if (this.usingFallback) {
        window.speechSynthesis?.resume();
      } else if (this.audio) {
        this.audio.play();
      }
      this.isPausedFlag = false;
      this.options.onResume?.();
    }
  }

  /* ─── Stop ─── */
  stop() {
    // Stop MP3 audio
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.oncanplaythrough = null;
      this.audio.currentTime = 0;
    }

    // Stop fallback Web Speech
    if (typeof window !== 'undefined') {
      try { window.speechSynthesis?.cancel(); } catch {}
    }

    this.currentUtterance = null;
    this.isSpeakingFlag = false;
    this.isPausedFlag   = false;
    this.usingFallback  = false;
    this.speakCounter++;
  }

  /* ─── Update callbacks ─── */
  updateOptions(opts: Partial<SpeechControllerOptions>) {
    this.options = { ...this.options, ...opts };
  }

  /* ─── Getters ─── */
  get speaking() { return this.isSpeakingFlag; }
  get paused()   { return this.isPausedFlag;   }

  /* ─── Realtime Volume for Lip Sync ─── */
  getVolume(): number {
    // Fallback speech: simulate mouth movement
    if (this.usingFallback && this.isSpeakingFlag && !this.isPausedFlag) {
      return 0.35 + Math.sin(Date.now() * 0.015) * 0.25;
    }

    if (!this.analyser || !this.dataArray || !this.isSpeakingFlag || this.isPausedFlag) return 0;

    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    let sum = 0;
    for (let i = 3; i < 15; i++) {
      sum += this.dataArray[i];
    }
    
    const avg = sum / 12; 
    let vol = avg / 255;
    vol = vol > 0.05 ? vol * 2.5 : 0; 
    return Math.min(1.0, vol);
  }

  /* ─── Private helpers ─── */
  private _cleanup() {
    this.currentUrl = null;
  }

  /**
   * Fallback: Native Web Speech API, split into sentences to avoid
   * Chromium's 15-second speech truncation bug.
   * Stores utterance on `this` to prevent garbage collection.
   */
  private _fallbackSpeak(text: string) {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) {
      this.options.onEnd?.();
      return;
    }

    try { synth.cancel(); } catch {}

    this.usingFallback = true;

    // Split by sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let sentenceIndex = 0;

    const speakNext = () => {
      if (sentenceIndex >= sentences.length) {
        this.isSpeakingFlag = false;
        this.usingFallback  = false;
        this.currentUtterance = null;
        this.options.onEnd?.();
        return;
      }

      const sentence = sentences[sentenceIndex++].trim();
      if (!sentence) { speakNext(); return; }

      const utt = new SpeechSynthesisUtterance(sentence);
      this.currentUtterance = utt; // prevent GC
      utt.rate = 0.92;
      utt.pitch = 1.25;
      utt.volume = this.options.volume ?? 1;

      const voices = synth.getVoices();
      const priorityNames = [
        'Microsoft Aria Online (Natural) - English (United States)',
        'Microsoft Jenny Online (Natural) - English (United States)',
        'Microsoft Zira Desktop - English (United States)',
        'Google UK English Female',
        'Samantha',
      ];
      const pick = priorityNames
        .map(n => voices.find(v => v.name === n))
        .find(Boolean)
        ?? voices.find(v => {
          const ln = v.name.toLowerCase();
          return ln.includes('zira') || ln.includes('female') || ln.includes('samantha') || ln.includes('hazel');
        })
        ?? voices.find(v => v.lang.startsWith('en'));

      if (pick) utt.voice = pick;

      utt.onend = () => speakNext();
      utt.onerror = () => {
        this.isSpeakingFlag = false;
        this.usingFallback  = false;
        this.currentUtterance = null;
        this.options.onError?.('web speech error');
      };

      synth.speak(utt);
    };

    this.isSpeakingFlag = true;
    this.options.onStart?.();
    speakNext();
  }
}

export const speechController = new SpeechController();
if (typeof window !== 'undefined') {
  (window as any).speechController = speechController;
}
