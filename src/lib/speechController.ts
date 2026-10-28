/**
 * Speech Controller — plays studio-recorded audio for each slide
 * (/audio/${slideId}.mp3), and gracefully falls back to native Web Speech
 * synthesis with lipsync support.
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
   * Unlock AudioContext on direct user gesture (touch, click, keydown)
   * Prevents browsers from muting audio due to autoplay restrictions.
   */
  unlock() {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audio) {
        this.audio = new Audio();
      }

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
        } catch (e) {
          console.debug('[SpeechController] Web Audio source hook note:', e);
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch (e) {
      console.debug('[SpeechController] unlock note:', e);
    }
  }

  /* ─── Speak ─── */
  async speak(text: string, slideId?: string) {
    if (typeof window === 'undefined') return;
    this.stop();

    const currentSpeakId = ++this.speakCounter;
    this.isPausedFlag   = false;

    // Wake up Web Audio Context immediately
    this.unlock();

    if (!slideId) {
      this._fallbackSpeak(text);
      return;
    }

    const url = `/audio/${slideId}.mp3`;

    try {
      if (!this.audio) {
        this.audio = new Audio();
      }

      this.audio.src = url;
      this.currentUrl = url;
      this.audio.volume = this.options.volume ?? 1;

      this.audio.onended = () => {
        this.isSpeakingFlag = false;
        this.isPausedFlag   = false;
        this._cleanup();
        this.options.onEnd?.();
      };

      this.audio.onerror = (e) => {
        console.warn(`[SpeechController] Audio file ${url} failed or missing, using speech fallback.`, e);
        this.isSpeakingFlag = false;
        this._cleanup();
        this._fallbackSpeak(text);
      };

      if (currentSpeakId !== this.speakCounter) return;
      this.isSpeakingFlag = true;
      this.options.onStart?.();

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      if (currentSpeakId !== this.speakCounter) return;
      console.warn('[SpeechController] audio.play() failed, using fallback:', err);
      this._fallbackSpeak(text);
    }
  }

  /* ─── Pause ─── */
  pause() {
    if (this.audio && this.isSpeakingFlag && !this.isPausedFlag) {
      this.audio.pause();
      this.isPausedFlag = true;
      this.options.onPause?.();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  /* ─── Resume ─── */
  resume() {
    if (this.audio && this.isPausedFlag) {
      this.audio.play();
      this.isPausedFlag = false;
      this.options.onResume?.();
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  /* ─── Stop ─── */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio.currentTime = 0;
    }
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }

    this.currentUtterance = null;
    this.isSpeakingFlag = false;
    this.isPausedFlag   = false;
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
    if (!this.analyser || !this.dataArray || !this.isSpeakingFlag || this.isPausedFlag) {
      // Natural mouth synthesis while fallback speech is active
      if (this.isSpeakingFlag && !this.isPausedFlag) {
        return 0.35 + Math.sin(Date.now() * 0.015) * 0.25;
      }
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);
    
    // Lower-mid vocal frequencies
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
   * Fallback: Native Web Speech API split into sentences to avoid
   * Chromium's 15-second speech truncation bug and garbage collection pauses.
   */
  private _fallbackSpeak(text: string) {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) {
      this.options.onEnd?.();
      return;
    }

    try {
      synth.cancel();
    } catch {}

    const sentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [text];
    let sentenceIndex = 0;

    const speakNext = () => {
      if (sentenceIndex >= sentences.length) {
        this.isSpeakingFlag = false;
        this.currentUtterance = null;
        this.options.onEnd?.();
        return;
      }

      const sentence = sentences[sentenceIndex++].trim();
      if (!sentence) {
        speakNext();
        return;
      }

      const utt = new SpeechSynthesisUtterance(sentence);
      this.currentUtterance = utt; // Prevents Chrome garbage collector from destroying utterance
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

      utt.onend = () => {
        speakNext();
      };

      utt.onerror = () => {
        this.isSpeakingFlag = false;
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
