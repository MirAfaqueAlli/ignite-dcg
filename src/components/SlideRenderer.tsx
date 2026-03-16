'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Slide } from '@/types/slide';

interface SlideRendererProps {
  slide: Slide;
  slideIndex: number;
}

const enter  = { opacity: 0, x: 50 };
const center = { opacity: 1, x: 0  };
const exit   = { opacity: 0, x: -50 };
const transition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

/* shared stagger container */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.45 } },
};

/* ── SLIDE TYPES ─────────────────────────────── */

function IntroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16 gap-6">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center gap-5">
        <motion.span variants={item} className="badge badge-maroon tracking-widest">
          {slide.type || 'Welcome'}
        </motion.span>

        <motion.h1
          variants={item}
          className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-[#5C0F0F]"
        >
          {slide.title}
        </motion.h1>

        <motion.div variants={item} className="gold-line w-40" />

        {slide.content && (
          <motion.p variants={item} className="text-xl text-[#7A5A4A] max-w-2xl leading-relaxed font-medium">
            {slide.content}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function ContentSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col h-full px-14 py-10 gap-6 justify-center">
      {/* Title */}
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex items-center gap-3 mb-1">
          <span className="badge badge-maroon">{slide.type}</span>
        </motion.div>
        <motion.h2 variants={item} className="text-4xl md:text-5xl font-bold text-[#5C0F0F] leading-tight mb-3">
          {slide.title}
        </motion.h2>
        <motion.div variants={item} className="gold-line w-24" />
      </motion.div>

      {/* Body */}
      <motion.div
        variants={container} initial="hidden" animate="show"
        className="flex gap-10 min-h-0"
      >
        <div className="flex flex-col gap-5">
          {slide.content && (
            <motion.p variants={item} className="text-lg text-[#5A3A2A] leading-relaxed">
              {slide.content}
            </motion.p>
          )}

          {slide.bulletPoints && slide.bulletPoints.length > 0 && (
            <motion.ul variants={container} className="flex flex-col gap-3">
              {slide.bulletPoints.map((point, i) => (
                <motion.li
                  key={i}
                  variants={item}
                  className="flex items-start gap-3"
                >
                  {/* gold bullet dot */}
                  <span
                    className="mt-2 w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: 'var(--gold)' }}
                  />
                  <span className="text-[#3D1F1F] text-base leading-snug font-medium">{point}</span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SpeakerSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-14 gap-7">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center gap-5">
        {/* Avatar circle */}
        <motion.div
          variants={item}
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{ background: 'var(--maroon)', boxShadow: '0 8px 30px rgba(122,26,26,0.3)' }}
        >
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </motion.div>

        <motion.span variants={item} className="badge badge-gold">Now Speaking</motion.span>

        <motion.h2 variants={item} className="text-5xl font-bold text-[#5C0F0F]">
          {slide.speakerName || 'Guest Speaker'}
        </motion.h2>

        {slide.speakerRole && (
          <motion.p variants={item} className="text-lg text-[#7A5A4A] font-medium">
            {slide.speakerRole}
          </motion.p>
        )}

        {slide.pause && (
          <motion.div
            variants={item}
            className="mt-2 px-6 py-3 rounded-xl border-2 border-dashed"
            style={{ borderColor: 'var(--gold)', background: 'rgba(200,145,42,0.08)' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--gold-dark)' }}>
              ⏸  Presentation paused — press Next when ready
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function OutroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-16 gap-6">
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col items-center gap-5">
        <motion.div variants={item} className="text-8xl select-none">🎓</motion.div>

        <motion.h2 variants={item} className="text-5xl md:text-6xl font-extrabold text-[#5C0F0F] leading-tight">
          {slide.title}
        </motion.h2>

        <motion.div variants={item} className="gold-line w-40" />

        {slide.content && (
          <motion.p variants={item} className="text-xl text-[#7A5A4A] max-w-2xl leading-relaxed">
            {slide.content}
          </motion.p>
        )}

        <motion.div variants={item} className="flex gap-3 flex-wrap justify-center mt-2">
          {['Innovation', 'Collaboration', 'Excellence'].map((w) => (
            <span key={w} className="badge badge-outline">{w}</span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Root export ─────────────────────────────── */
export default function SlideRenderer({ slide, slideIndex }: SlideRendererProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slideIndex}
        initial={enter}
        animate={center}
        exit={exit}
        transition={transition}
        className="h-full w-full"
      >
        {slide.type === 'intro'   && <IntroSlide   slide={slide} />}
        {slide.type === 'content' && <ContentSlide slide={slide} />}
        {slide.type === 'speaker' && <SpeakerSlide slide={slide} />}
        {slide.type === 'outro'   && <OutroSlide   slide={slide} />}
      </motion.div>
    </AnimatePresence>
  );
}
