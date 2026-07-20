export type SlideType = 'intro' | 'ceremony' | 'speaker' | 'reveal' | 'content' | 'team' | 'outro';

export interface TeamMember {
  name: string;
  role: string;
}

export interface TeamGroup {
  heading: string;
  members: TeamMember[];
}

export interface TwoColumn {
  heading: string;
  points: string[];
}

export interface Slide {
  id?: string;
  segment?: string | number;
  type: SlideType;
  title: string;
  subtitle?: string;
  tagline?: string;
  content?: string;
  image?: string;
  speech?: string;        // injected from edithScript.json
  pause?: boolean;

  /* intro */
  details?: string[];

  /* ceremony */
  leftColumn?: TwoColumn;
  rightColumn?: TwoColumn;

  /* speaker */
  speaker?: { name: string; role: string; guildRole?: string; photo?: string };
  speakers?: { name: string; role: string }[];
  speakerName?: string;
  speakerRole?: string;
  agenda?: string[];
  highlights?: string[];
  acknowledgements?: string[];

  /* reveal */
  countdown?: string[];
  points?: string[];
  revealLine?: string;

  /* content */
  bulletPoints?: string[];
  banner?: string;

  /* team */
  facultyMentors?: TeamGroup;
  teachingAssistants?: TeamGroup;
  executiveBoard?: TeamGroup;
  coreTeam?: TeamGroup;
  domainLeads?: TeamGroup;

  /* outro */
  closingLines?: string[];
  footer?: string;

  accentColor?: string;
}

export interface EventData {
  eventTitle: string;
  eventSubtitle?: string;
  tagline?: string;
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
