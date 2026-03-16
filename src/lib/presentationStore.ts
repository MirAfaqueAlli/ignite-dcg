import { create } from 'zustand';
import { PresentationState, PresentationStatus, Slide, EventData } from '@/types/slide';

export const usePresentationStore = create<PresentationState>((set, get) => ({
  currentSlideIndex: 0,
  status: 'idle',
  isPlaying: false,
  isMuted: false,
  slides: [],
  eventData: null,

  setSlides: (slides: Slide[]) => set({ slides }),

  setEventData: (data: EventData) =>
    set({ eventData: data, slides: data.slides }),

  setStatus: (status: PresentationStatus) => set({ status }),

  nextSlide: () => {
    const { currentSlideIndex, slides } = get();
    if (currentSlideIndex < slides.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1 });
    }
  },

  prevSlide: () => {
    const { currentSlideIndex } = get();
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1 });
    }
  },

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  setPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setCurrentSlide: (index: number) => set({ currentSlideIndex: index }),
}));
