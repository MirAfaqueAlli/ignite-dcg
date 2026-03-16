import { Slide, EventData } from '@/types/slide';
import { generateNarration } from './narrationGenerator';

export interface SlideEngineCallbacks {
  onSlideChange?: (slide: Slide, index: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onPauseRequired?: (slide: Slide) => void;
  onPresentationEnd?: () => void;
}

class SlideEngine {
  private slides: Slide[] = [];
  private currentIndex = 0;
  private callbacks: SlideEngineCallbacks = {};

  load(eventData: EventData) {
    this.slides = eventData.slides.map((slide, i) => ({
      ...slide,
      id: slide.id || `slide-${i + 1}`,
    }));
    this.currentIndex = 0;
  }

  setCallbacks(callbacks: SlideEngineCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getCurrentSlide(): Slide | null {
    return this.slides[this.currentIndex] ?? null;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalSlides(): number {
    return this.slides.length;
  }

  getAllSlides(): Slide[] {
    return this.slides;
  }

  goToSlide(index: number): Slide | null {
    if (index < 0 || index >= this.slides.length) return null;
    this.currentIndex = index;
    const slide = this.slides[index];
    this.callbacks.onSlideChange?.(slide, index);
    return slide;
  }

  next(): Slide | null {
    if (this.currentIndex >= this.slides.length - 1) {
      this.callbacks.onPresentationEnd?.();
      return null;
    }
    return this.goToSlide(this.currentIndex + 1);
  }

  prev(): Slide | null {
    if (this.currentIndex <= 0) return null;
    return this.goToSlide(this.currentIndex - 1);
  }

  getNarration(slide?: Slide): string {
    const target = slide || this.getCurrentSlide();
    if (!target) return '';
    return generateNarration(target);
  }

  isPauseSlide(slide?: Slide): boolean {
    const target = slide || this.getCurrentSlide();
    return target?.pause === true;
  }
}

export const slideEngine = new SlideEngine();
