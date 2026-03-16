/**
 * Speech Controller — uses /api/tts (Microsoft Aria Neural, free)
 * Falls back to Web Speech API if the server route fails.
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

  /* ─── Init ─── */
  init(options: SpeechControllerOptions = {}) {
    this.options       = options;
    this.isInitialized = true;
  }

  /* ─── Speak ─── */
  async speak(text: string, slideId?: string) {
    if (typeof window === 'undefined') return;
    this.stop();

    const currentSpeakId = ++this.speakCounter;
    this.isPausedFlag   = false;

    try {
      /* 1) Try checking for local MP3 file matching the slide (e.g. ElevenLabs audio) */
      let useLocalAudio = false;
      let localUrl = '';

      if (slideId) {
        localUrl = `/audio/${slideId}.mp3`;
        try {
          // Check if file exists, HEAD request to avoid downloading full file immediately
          const checkRes = await fetch(localUrl, { method: 'HEAD' });
          if (checkRes.ok) {
            useLocalAudio = true;
          }
        } catch {
          // fetch failed, ignore
        }
      }

      if (useLocalAudio) {
        if (currentSpeakId !== this.speakCounter) return;
        this.audio = new Audio(localUrl);
        this.currentUrl = localUrl;
      } else {
        /* 2) Fallback to server-side TTS route (Microsoft Aria Neural) */
        let res = await fetch('/api/tts', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text }),
        });

        if (!res.ok) {
          console.warn('[TTS] Retrying API after error..');
          res = await fetch('/api/tts', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ text }),
          });
        }

        if (!res.ok) throw new Error(`TTS API: ${res.status}`);
        if (currentSpeakId !== this.speakCounter) return;

        const blob = await res.blob();
        if (currentSpeakId !== this.speakCounter) return;
        const url  = URL.createObjectURL(blob);

        this.audio      = new Audio(url);
        this.currentUrl = url;
      }

    } catch (apiErr) {
      console.warn('[TTS] Both Local MP3 and API failed, cannot generate audio:', apiErr);
      throw apiErr; // Fall through to robotic native speech
    }

    try {
      if (!this.audio) throw new Error('Audio not initialized');

      this.audio.volume = this.options.volume ?? 1;

      this.audio.onended = () => {
        this.isSpeakingFlag = false;
        this.isPausedFlag   = false;
        this._cleanup();
        this.options.onEnd?.();
      };

      this.audio.onerror = () => {
        this.isSpeakingFlag = false;
        this._cleanup();
        console.warn(`[TTS] Local audio fallback failed to load.`);
        this._fallbackSpeak(text);
      };

      if (currentSpeakId !== this.speakCounter) return;
      this.isSpeakingFlag = true;
      this.options.onStart?.();
      await this.audio.play();

    } catch (err) {
      if (currentSpeakId !== this.speakCounter) return;
      console.warn('[TTS] failed completely, falling back to robotic native speech:', err);
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
  }

  /* ─── Resume ─── */
  resume() {
    if (this.audio && this.isPausedFlag) {
      this.audio.play();
      this.isPausedFlag = false;
      this.options.onResume?.();
    }
  }

  /* ─── Stop ─── */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.onerror = null;
      this.audio = null;
      this._cleanup();
    }
    /* Also cancel any fallback Web Speech */
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();

    this.isSpeakingFlag = false;
    this.isPausedFlag   = false;
    this.speakCounter++; // invalidate any currently loading async speeches
  }

  /* ─── Update callbacks ─── */
  updateOptions(opts: Partial<SpeechControllerOptions>) {
    this.options = { ...this.options, ...opts };
  }

  /* ─── Getters ─── */
  get speaking() { return this.isSpeakingFlag; }
  get paused()   { return this.isPausedFlag;   }

  /* ─── Private helpers ─── */
  private _cleanup() {
    this.currentUrl = null;
  }

  /** Fallback: native Web Speech with best available female voice */
  private _fallbackSpeak(text: string) {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utt   = new SpeechSynthesisUtterance(text);
    utt.rate    = 0.90;
    utt.pitch   = 1.35;
    utt.volume  = this.options.volume ?? 1;

    /* Pick best female voice */
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

    utt.onend   = () => { this.isSpeakingFlag = false; this.options.onEnd?.();   };
    utt.onerror = () => { this.isSpeakingFlag = false; this.options.onError?.('web speech error'); };
    
    this.isSpeakingFlag = true;
    this.options.onStart?.();
    synth.speak(utt);
  }
}

export const speechController = new SpeechController();
