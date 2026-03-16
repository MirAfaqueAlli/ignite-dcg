import { Slide } from '@/types/slide';

/**
 * Generate narration for slides that don't have explicit speech text
 * Uses template-based logic — no external APIs required
 */

const INTRO_TEMPLATES = [
  "Let me introduce this topic: {content}",
  "Allow me to present: {content}",
  "Here is an important point — {content}",
];

const CONTENT_TEMPLATES = [
  "On this slide, we will explore {title}. {content}",
  "Let us take a closer look at {title}. {content}",
  "Next, I would like to highlight {title}. {content}",
];

const BULLET_INTRO_TEMPLATES = [
  "Key highlights include: ",
  "The main points to note are: ",
  "Here are the core elements: ",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '');
}

export function generateNarration(slide: Slide): string {
  // If explicit speech is provided, use it
  if (slide.speech && slide.speech.trim().length > 0) {
    return slide.speech;
  }

  const title = slide.title || '';
  const content = slide.content || '';

  let narration = '';

  switch (slide.type) {
    case 'intro': {
      const template = pickRandom(INTRO_TEMPLATES);
      narration = interpolate(template, { title, content });
      break;
    }

    case 'content': {
      const template = pickRandom(CONTENT_TEMPLATES);
      narration = interpolate(template, { title, content });

      if (slide.bulletPoints && slide.bulletPoints.length > 0) {
        const bulletIntro = pickRandom(BULLET_INTRO_TEMPLATES);
        // Strip emoji and clean bullet text for speech
        const cleanBullets = slide.bulletPoints.map(b =>
          b.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[✅🤖🌐🔒📱🎮🏆🎓💼🚀🌟]/g, '').trim()
        );
        narration += ' ' + bulletIntro + cleanBullets.join(', ') + '.';
      }
      break;
    }

    case 'speaker': {
      const speakerName = slide.speakerName || 'our guest speaker';
      const speakerRole = slide.speakerRole ? `, ${slide.speakerRole}` : '';
      narration = `I would like to invite ${speakerName}${speakerRole} to address the audience. Please welcome them to the stage.`;
      break;
    }

    case 'outro': {
      narration = content
        ? `In closing — ${content}`
        : `Thank you for joining us today. This concludes the presentation.`;
      break;
    }

    default: {
      narration = content || title || 'Please proceed to the next slide.';
    }
  }

  return narration.trim();
}
