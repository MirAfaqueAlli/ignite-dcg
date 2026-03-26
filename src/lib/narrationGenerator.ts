import { Slide } from '@/types/slide';

/**
 * Generate narration for a slide.
 * Priority: explicit `speech` from edithScript.json → template fallback
 */
export function generateNarration(slide: Slide): string {
  // Always prefer the explicit EDITH script injected from edithScript.json
  if (slide.speech && slide.speech.trim().length > 0) {
    return slide.speech.trim();
  }

  const title = slide.title || '';

  switch (slide.type) {
    case 'intro':
      return `Welcome, everyone. ${title}. ${slide.subtitle ?? ''} ${slide.tagline ?? ''}`.trim();

    case 'ceremony':
      return `We now begin the ${title}. ${slide.subtitle ?? ''}`.trim();

    case 'speaker': {
      const name = slide.speaker?.name || slide.speakerName || 'our distinguished guest';
      const role = slide.speaker?.role || slide.speakerRole || '';
      return `I now invite ${name}${role ? `, ${role},` : ''} to address the gathering. Please welcome them to the stage.`;
    }

    case 'reveal':
      return `Ladies and gentlemen — it is time for the ${title}. ${slide.subtitle ?? ''}`.trim();

    case 'content': {
      const left  = slide.leftColumn?.points?.slice(0, 3).join('. ') ?? '';
      const right = slide.rightColumn?.points?.slice(0, 3).join('. ') ?? '';
      return `Let us now look at ${title}. ${left} ${right}`.trim();
    }

    case 'team':
      return `Allow me to introduce the founding team of the guild. ${slide.subtitle ?? ''}`.trim();

    case 'outro':
      return (slide.closingLines?.join(' ') ?? `Thank you. ${title}`).trim();

    default:
      return title;
  }
}
