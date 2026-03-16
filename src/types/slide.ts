export type SlideType = 'intro' | 'content' | 'speaker' | 'outro';

export interface Slide {
  id?: string;
  type: SlideType;
  title: string;
  content?: string;
  image?: string;
  speech?: string;
  pause?: boolean;
  speakerName?: string;
  speakerRole?: string;
  bulletPoints?: string[];
  accentColor?: string;
}

export interface EventData {
  eventTitle: string;
  eventSubtitle?: string;
  date?: string;
  venue?: string;
  slides: Slide[];
}

export type PresentationStatus = 'idle' | 'speaking' | 'paused' | 'waiting' | 'finished';

export interface PresentationState {
  currentSlideIndex: number;
  status: PresentationStatus;
  isPlaying: boolean;
  isMuted: boolean;
  slides: Slide[];
  eventData: EventData | null;
  setSlides: (slides: Slide[]) => void;
  setEventData: (data: EventData) => void;
  setStatus: (status: PresentationStatus) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  toggleMute: () => void;
  setPlaying: (playing: boolean) => void;
  setCurrentSlide: (index: number) => void;
}
