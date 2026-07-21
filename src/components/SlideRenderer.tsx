'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Slide } from '@/types/slide';

interface SlideRendererProps { slide: Slide; slideIndex: number; }

/* ── transitions ── */
const enter = { opacity: 0, x: 48, scale: 0.97 };
const center = { opacity: 1, x: 0, scale: 1 };
const exit_ = { opacity: 0, x: -48, scale: 0.97 };
const spring = { type: 'spring' as const, stiffness: 280, damping: 28 };

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
const up = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 22 } } };
const pop = { hidden: { opacity: 0, scale: 0.7 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } };
const fade = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.55 } } };

/* ── tokens ── */
const M = 'var(--maroon)';
const MD = 'var(--maroon-dark)';
const G = 'var(--gold)';
const GD = 'var(--gold-dark)';

/* ══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════ */
const Orb = ({ style }: { style?: React.CSSProperties }) => (
  <div className="absolute rounded-full pointer-events-none" style={{
    background: 'radial-gradient(circle, rgba(200,145,42,0.18) 0%, transparent 70%)',
    filter: 'blur(40px)',
    ...style,
  }} />
);

const PillBadge = ({ label, gold }: { label: string; gold?: boolean }) => (
  <motion.span variants={pop}
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 font-bold uppercase tracking-widest"
    style={{ fontSize: 10, background: gold ? `linear-gradient(135deg,${G},${GD})` : `linear-gradient(135deg,${M},var(--maroon-light))`, color: '#fff', letterSpacing: '0.1em' }}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
    {label}
  </motion.span>
);

const AccentBar = () => (
  <motion.div variants={fade}
    className="shrink-0 rounded-full"
    style={{ height: 3, width: 64, background: `linear-gradient(90deg, ${M}, ${G}, ${M})`, backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}
  />
);

/* ══════════════════════════════════════════════════════════════
   SLIDE 1 — INTRO  (Cinematic centered stage)
══════════════════════════════════════════════════════════════ */
function IntroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-8 overflow-hidden">
      {/* Background orbs */}
      <Orb style={{ width: 400, height: 400, top: '-10%', left: '-5%' }} />
      <Orb style={{ width: 300, height: 300, bottom: '-5%', right: '5%', background: 'radial-gradient(circle,rgba(122,26,26,0.12) 0%,transparent 70%)' }} />

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="relative z-10 flex flex-col items-center gap-4 max-w-3xl w-full"
      >
        {/* Top badge */}
        <motion.div variants={pop}><PillBadge label="Expansion Ceremony" /></motion.div>

        {/* Main title with decorative side lines */}
        <div className="flex items-center gap-4 w-full justify-center">
          <motion.div variants={fade} className="flex-1 h-px max-w-[80px]"
            style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
          <motion.h1 variants={up}
            className="font-black tracking-tighter"
            style={{ fontSize: 'clamp(2.4rem,5vw,4.5rem)', color: MD, lineHeight: 1.05 }}
          >
            {slide.title}
          </motion.h1>
          <motion.div variants={fade} className="flex-1 h-px max-w-[80px]"
            style={{ background: `linear-gradient(90deg, ${G}, transparent)` }} />
        </div>

        {slide.subtitle && (
          <motion.p variants={up} className="font-bold tracking-wide" style={{ fontSize: 'clamp(1rem,1.8vw,1.35rem)', color: M }}>
            {slide.subtitle}
          </motion.p>
        )}

        <AccentBar />

        {slide.tagline && (
          <motion.p variants={up} className="font-extrabold gold-shimmer uppercase tracking-[0.18em]"
            style={{ fontSize: 'clamp(1rem,1.8vw,1.5rem)' }}>
            {slide.tagline}
          </motion.p>
        )}

        {slide.details && (
          <motion.div variants={stagger} className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {slide.details.map((d, i) => (
              <motion.div key={i} variants={up}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border shadow-lg"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  borderColor: i % 2 === 0 ? 'rgba(122,26,26,0.2)' : 'rgba(200,145,42,0.35)',
                  boxShadow: `0 4px 20px ${i % 2 === 0 ? 'rgba(122,26,26,0.08)' : 'rgba(200,145,42,0.1)'}`,
                  fontSize: 13, fontWeight: 600, color: MD,
                }}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i % 2 === 0 ? M : G }} />
                {d}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <style>{`@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SLIDE 2 — CEREMONY  (Split accent + cards)
══════════════════════════════════════════════════════════════ */
function CeremonySlide({ slide }: { slide: Slide }) {
  const leftPts = slide.leftColumn?.points ?? [];
  const rightPts = slide.rightColumn?.points ?? [];

  const ColumnCard = ({ heading, points, accent }: { heading: string; points: string[]; accent: boolean }) => (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className="flex-1 rounded-3xl flex flex-col gap-1 min-h-0"
      style={{
        background: 'rgba(255,255,255,0.7)',
        boxShadow: accent ? `0 8px 32px rgba(122,26,26,0.12), inset 0 0 0 1.5px rgba(122,26,26,0.15)` : `0 8px 32px rgba(200,145,42,0.10), inset 0 0 0 1.5px rgba(200,145,42,0.25)`,
        backdropFilter: 'blur(12px)',
        overflow: 'visible',
      }}
    >
      {/* Card header bar */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-2 border-b"
        style={{ borderColor: accent ? 'rgba(122,26,26,0.1)' : 'rgba(200,145,42,0.18)' }}
      >
        <div className="w-1.5 rounded-full" style={{ height: 20, background: accent ? `linear-gradient(to bottom,${M},${G})` : `linear-gradient(to bottom,${G},${M})` }} />
        <span className="font-black uppercase tracking-widest bg-clip-text text-transparent"
          style={{ fontSize: 11, backgroundImage: `linear-gradient(90deg,${MD},${M})` }}>
          {heading}
        </span>
      </div>

      {/* Bullets */}
      <ul className="flex flex-col gap-1 px-3 py-1 flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {points.map((p, i) => (
          <motion.li key={i} variants={up}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: i % 2 === 0 ? 'rgba(122,26,26,0.04)' : 'rgba(200,145,42,0.05)' }}
          >
            <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm font-bold"
              style={{ background: `linear-gradient(135deg,${i % 2 === 0 ? M : G},${i % 2 === 0 ? 'var(--maroon-light)' : '#FFE4B0'})`, fontSize: 10, minWidth: 24 }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: MD, lineHeight: 1.3 }}>{p}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );

  return (
    <div className="relative flex flex-col h-full px-8 py-3 gap-3">
      <Orb style={{ width: 350, height: 350, top: '-20%', right: '-10%' }} />

      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <PillBadge label="Ceremony" />
        </div>
        <motion.h2 variants={up} className="font-black leading-tight"
          style={{ fontSize: 'clamp(1.1rem,2vw,1.7rem)', color: MD }}>
          {slide.title}
        </motion.h2>
        {slide.subtitle && (
          <motion.p variants={fade} style={{ fontSize: 11, color: 'var(--muted-text)', fontWeight: 500 }}>
            {slide.subtitle}
          </motion.p>
        )}
        <AccentBar />
      </motion.div>

      {/* Two columns */}
      <div className="flex gap-3 flex-1 min-h-0 overflow-visible">
        {slide.leftColumn && <ColumnCard heading={slide.leftColumn.heading} points={leftPts} accent={true} />}
        {slide.rightColumn && <ColumnCard heading={slide.rightColumn.heading} points={rightPts} accent={false} />}
      </div>

      {slide.pause && <PausedBanner />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SPEAKER SLIDE  (Dramatic portrait + list)
══════════════════════════════════════════════════════════════ */
function SpeakerSlide({ slide }: { slide: Slide }) {
  const name = slide.speaker?.name || slide.speakerName || 'Guest Speaker';
  const role = slide.speaker?.role || slide.speakerRole || '';
  const gRole = slide.speaker?.guildRole;
  const photo = slide.speaker?.photo;
  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const listItems = slide.agenda || slide.highlights || slide.acknowledgements || [];

  return (
    <div className="relative flex flex-col h-full px-6 py-2 gap-2 overflow-hidden">
      <Orb style={{ width: 280, height: 280, top: '10%', left: '-8%' }} />

      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="shrink-0 flex flex-col gap-0.5">
        <PillBadge label={slide.title} />
        {slide.subtitle && <motion.p variants={fade} style={{ fontSize: 11, color: 'var(--muted-text)', fontWeight: 500 }}>{slide.subtitle}</motion.p>}
        <AccentBar />
      </motion.div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Speaker portrait card */}
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden shrink-0 relative py-2"
          style={{
            width: 180,
            background: `linear-gradient(160deg, rgba(122,26,26,0.95) 0%, rgba(80,10,10,0.98) 100%)`,
            boxShadow: '0 12px 40px rgba(80,10,10,0.4)',
          }}
        >
          {/* Top decorative line */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${G}, transparent)` }} />

          {/* Avatar ring */}
          <motion.div variants={pop} className="relative flex items-center justify-center mt-2">
            {/* Outer glow ring */}
            <div className="absolute rounded-full"
              style={{ width: 88, height: 88, border: `2px solid rgba(200,145,42,0.4)`, animation: 'ringPulse 2.5s ease-in-out infinite' }} />
            <div className="absolute rounded-full"
              style={{ width: 98, height: 98, border: `1px solid rgba(200,145,42,0.2)` }} />
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center font-black text-white relative overflow-hidden bg-white/10"
              style={{ background: photo ? '#000' : `linear-gradient(135deg, rgba(200,145,42,0.7), rgba(200,145,42,0.3))`, fontSize: 24 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt={name} className="w-full h-full object-cover object-top" />
              ) : (
                <>
                  <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.05)' }} />
                  {initials}
                </>
              )}
            </div>
          </motion.div>

          {/* "Now Speaking" pill */}
          <motion.div variants={pop}
            className="px-2.5 py-0.5 rounded-full font-bold tracking-widest"
            style={{ background: `linear-gradient(135deg,${G},${GD})`, color: '#3D1F1F', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            🎙 Now Speaking
          </motion.div>

          {/* Name / role */}
          <motion.div variants={up} className="text-center px-3 mb-1">
            <p className="font-extrabold leading-tight" style={{ fontSize: 14, color: '#FFF8F0', lineHeight: 1.2 }}>{name}</p>
            {role && <p className="mt-1 font-medium" style={{ fontSize: 9.5, color: 'rgba(255,248,240,0.6)', lineHeight: 1.3 }}>{role}</p>}
            {gRole && (
              <p className="mt-1.5 pt-1.5 font-bold uppercase tracking-widest border-t"
                style={{ fontSize: 8.5, color: G, borderColor: 'rgba(200,145,42,0.3)', letterSpacing: '0.1em' }}>
                {gRole}
              </p>
            )}
          </motion.div>

          {slide.pause && (
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed mx-4 mb-3 w-full justify-center"
              style={{ borderColor: 'rgba(200,145,42,0.4)', background: 'rgba(200,145,42,0.04)' }}>
              <span style={{ fontSize: 10 }}>⏸</span>
              <span className="font-bold uppercase tracking-widest" style={{ fontSize: 9, color: G }}>Presenter Live</span>
            </motion.div>
          )}

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, transparent, ${G}, transparent)` }} />
        </motion.div>

        {/* List */}
        {listItems.length > 0 && (
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="flex-1 flex flex-col rounded-2xl p-4 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 8px 32px rgba(122,26,26,0.08), inset 0 0 0 1.5px rgba(122,26,26,0.1)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center gap-2 shrink-0 pb-2 border-b" style={{ borderColor: 'rgba(122,26,26,0.1)' }}>
              <div className="w-1 rounded-full" style={{ height: 14, background: `linear-gradient(to bottom,${M},${G})` }} />
              <span className="font-black uppercase tracking-widest" style={{ fontSize: 10, color: MD }}>
                {slide.agenda ? 'Agenda' : slide.acknowledgements ? 'Acknowledgements' : 'Highlights'}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 py-1.5 flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {listItems.map((p, i) => (
                <motion.li key={i} variants={up}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
                  style={{
                    background: i % 2 === 0 ? 'rgba(122,26,26,0.04)' : 'rgba(200,145,42,0.05)',
                    border: `1px solid ${i % 2 === 0 ? 'rgba(122,26,26,0.08)' : 'rgba(200,145,42,0.15)'}`,
                  }}
                >
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 font-bold shadow"
                    style={{ background: `linear-gradient(135deg, ${i % 2 === 0 ? M : G}, ${i % 2 === 0 ? 'var(--maroon-light)' : '#FFE4B0'})`, fontSize: 10, minWidth: 24 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: MD, lineHeight: 1.3 }}>{p}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes ringPulse{0%,100%{opacity:0.4;transform:scale(1)}50%{opacity:1;transform:scale(1.05)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   REVEAL SLIDE  (Dramatic dark stage)
══════════════════════════════════════════════════════════════ */
function RevealSlide({ slide }: { slide: Slide }) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Dramatic dark gradient backdrop */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'linear-gradient(160deg,rgba(80,10,10,0.08) 0%,rgba(200,145,42,0.06) 100%)', border: '1.5px solid rgba(200,145,42,0.2)' }} />
      <Orb style={{ width: 500, height: 500, left: '20%', top: '-30%', opacity: 0.6 }} />

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="relative z-10 flex flex-col items-center justify-center h-full text-center gap-4 px-10"
      >
        <PillBadge label="Unveiling" gold />

        <motion.h2 variants={up}
          className="font-black leading-tight tracking-tighter"
          style={{ fontSize: 'clamp(2rem,4.5vw,3.8rem)', color: MD }}
        >
          {slide.title}
        </motion.h2>

        {slide.subtitle && (
          <motion.p variants={fade} style={{ fontSize: 14, color: 'var(--muted-text)', fontWeight: 500 }}>
            {slide.subtitle}
          </motion.p>
        )}

        {/* Decorative line + diamond */}
        <motion.div variants={fade} className="flex items-center gap-3 w-full max-w-xs">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
          <div className="w-2.5 h-2.5 rotate-45 shrink-0" style={{ background: G }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${G}, transparent)` }} />
        </motion.div>

        {/* Points — horizontal pill row */}
        {slide.points && slide.points.length > 0 && (
          <motion.div variants={stagger} className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            {slide.points.map((p, i) => (
              <motion.div key={i} variants={pop}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl border"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  borderColor: i % 2 === 0 ? 'rgba(122,26,26,0.18)' : 'rgba(200,145,42,0.3)',
                  boxShadow: `0 4px 16px ${i % 2 === 0 ? 'rgba(122,26,26,0.07)' : 'rgba(200,145,42,0.08)'}`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded shrink-0" style={{ background: i % 2 === 0 ? M : G, transform: 'rotate(45deg)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: MD }}>{p}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Countdown — large dramatic numbers */}
        {slide.countdown && slide.countdown.length > 0 && (
          <motion.div variants={stagger} className="flex items-center justify-center gap-4">
            {slide.countdown.map((c, i) => {
              const isLast = i === slide.countdown!.length - 1;
              return (
                <motion.div key={i} variants={pop}
                  whileHover={{ scale: 1.2, y: -4 }}
                  className="flex items-center justify-center font-black text-white rounded-2xl shadow-2xl"
                  style={{
                    width: 64, height: 64, fontSize: 28,
                    background: isLast
                      ? `linear-gradient(135deg, ${G}, ${GD})`
                      : `linear-gradient(135deg, ${M}, var(--maroon-light))`,
                    boxShadow: isLast
                      ? `0 8px 32px rgba(200,145,42,0.5)`
                      : `0 8px 32px rgba(122,26,26,0.4)`,
                  }}
                >
                  {c}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {slide.revealLine && (
          <motion.div variants={up}
            className="px-8 py-3 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, rgba(122,26,26,0.08), rgba(200,145,42,0.08))`,
              border: `1px solid rgba(200,145,42,0.3)`,
            }}
          >
            <p className="font-bold uppercase tracking-widest bg-clip-text text-transparent"
              style={{ fontSize: 'clamp(0.65rem,1.1vw,0.9rem)', backgroundImage: `linear-gradient(90deg, ${MD}, ${M}, ${GD})` }}>
              {slide.revealLine}
            </p>
          </motion.div>
        )}

        {slide.pause && <PausedBanner />}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONTENT SLIDE
══════════════════════════════════════════════════════════════ */
function ContentSlide({ slide }: { slide: Slide }) {
  const speakers = slide.speakers || (slide.speaker ? [slide.speaker] : []);

  const Col = ({ col, accent }: { col: { heading: string; points: string[] }; accent: boolean }) => (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className="flex-1 flex flex-col rounded-[20px] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.68)',
        boxShadow: accent ? `0 8px 32px rgba(122,26,26,0.10), inset 0 0 0 1.5px rgba(122,26,26,0.12)` : `0 8px 32px rgba(200,145,42,0.09), inset 0 0 0 1.5px rgba(200,145,42,0.22)`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3 px-5 pt-3.5 pb-2 border-b"
        style={{ borderColor: accent ? 'rgba(122,26,26,0.1)' : 'rgba(200,145,42,0.18)' }}>
        <div className="w-1 rounded-full" style={{ height: 16, background: accent ? `linear-gradient(to bottom,${M},${G})` : `linear-gradient(to bottom,${G},${M})` }} />
        <span className="font-black uppercase tracking-widest" style={{ fontSize: 10, color: MD }}>{col.heading}</span>
      </div>
      <ul className="flex flex-col gap-2 px-4 py-3">
        {col.points.map((p, i) => (
          <motion.li key={i} variants={up}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl"
            style={{ background: i % 2 === 0 ? 'rgba(122,26,26,0.035)' : 'rgba(200,145,42,0.04)' }}
          >
            <div className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm font-bold"
              style={{ background: `linear-gradient(135deg,${i % 2 === 0 ? M : G},${i % 2 === 0 ? 'var(--maroon-light)' : '#FFE4B0'})`, fontSize: 10, minWidth: 24 }}>
              {i + 1}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: MD, lineHeight: 1.3 }}>{p}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );

  return (
    <div className="relative flex flex-col h-full px-8 py-3 gap-2 overflow-hidden">
      <Orb style={{ width: 320, height: 320, bottom: '-10%', right: '-5%' }} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <PillBadge label="Presentation" />
          {speakers.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1 font-bold px-3 py-1 rounded-full border"
              style={{ fontSize: 9, borderColor: G, color: GD, background: 'rgba(200,145,42,0.07)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🎙 {s.name}
            </span>
          ))}
        </div>
        <motion.h2 variants={up} className="font-black leading-tight"
          style={{ fontSize: 'clamp(1.3rem,2.4vw,2rem)', color: MD }}>
          {slide.title}
        </motion.h2>
        {slide.subtitle && (
          <motion.p variants={fade} style={{ fontSize: 11, color: 'var(--muted-text)', fontWeight: 500 }}>{slide.subtitle}</motion.p>
        )}
        <AccentBar />
      </motion.div>

      <div className="flex gap-4 flex-1 min-h-0 pb-1">
        {slide.leftColumn && <Col col={slide.leftColumn} accent={true} />}
        {slide.rightColumn && <Col col={slide.rightColumn} accent={false} />}
      </div>

      {slide.banner && (
        <motion.div variants={up} initial="hidden" animate="show"
          className="shrink-0 flex items-center justify-center gap-2 px-5 py-2 rounded-xl"
          style={{ background: `linear-gradient(135deg,rgba(122,26,26,0.06),rgba(200,145,42,0.08))`, border: `1px solid rgba(200,145,42,0.25)` }}
        >
          <span style={{ fontSize: 16, opacity: 0.3 }}>❝</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: MD }}>{slide.banner}</span>
          <span style={{ fontSize: 16, opacity: 0.3 }}>❞</span>
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TEAM SLIDE  (Compact grid with colored sections)
══════════════════════════════════════════════════════════════ */
function TeamSlide({ slide }: { slide: Slide }) {
  const Pill = ({ name, role, accent }: { name: string; role: string; accent: boolean }) => {
    const ini = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <motion.div variants={pop}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-white"
        style={{
          borderColor: accent ? 'rgba(122,26,26,0.1)' : 'rgba(200,145,42,0.18)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
        }}
      >
        <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white shrink-0"
          style={{ background: `linear-gradient(135deg,${accent ? M : G},${accent ? 'var(--maroon-light)' : '#FFE4B0'})`, minWidth: 20 }}>
          {ini}
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: 10.5, fontWeight: 700, color: MD, lineHeight: 1.2 }} className="leading-tight break-words">{name}</p>
          <p style={{ fontSize: 7.5, fontWeight: 700, color: accent ? M : GD, textTransform: 'uppercase', letterSpacing: '0.04em' }} className="truncate">{role}</p>
        </div>
      </motion.div>
    );
  };

  const Section = ({ heading, children, className = '' }: { heading: string; children: React.ReactNode; className?: string }) => (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className={`rounded-xl flex flex-col ${className}`}
      style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 4px 15px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(122,26,26,0.08)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 border-b" style={{ borderColor: 'rgba(122,26,26,0.08)' }}>
        <div className="w-1 rounded-full" style={{ height: 10, background: `linear-gradient(to bottom,${M},${G})` }} />
        <span className="font-black uppercase tracking-widest" style={{ fontSize: 8.5, color: MD }}>{heading}</span>
      </div>
      <div className="p-1.5 flex-1 flex flex-col justify-center">{children}</div>
    </motion.div>
  );

  return (
    <div className="relative flex flex-col h-full px-8 py-2 gap-1.5 overflow-hidden">
      <Orb style={{ width: 300, height: 300, top: '-15%', right: '-5%' }} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="shrink-0 flex flex-col gap-0.5">
        <PillBadge label="Founding Team" />
        <motion.h2 variants={up} className="font-black leading-tight"
          style={{ fontSize: 'clamp(1.2rem,2.2vw,1.8rem)', color: MD }}>
          {slide.title}
        </motion.h2>
        {slide.subtitle && <motion.p variants={fade} style={{ fontSize: 11, color: 'var(--muted-text)', fontWeight: 500 }}>{slide.subtitle}</motion.p>}
        <AccentBar />
      </motion.div>

      <div className="flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden pb-1">
        <div className="grid grid-cols-[1fr_1fr_2fr] gap-1.5 shrink-0">
          {slide.facultyMentors && (
            <Section heading={slide.facultyMentors.heading}>
              <div className="grid grid-cols-1 gap-1 py-0.5">
                {slide.facultyMentors.members.map((m, i) => <Pill key={i} name={m.name} role={m.role} accent={false} />)}
              </div>
            </Section>
          )}
          {slide.teachingAssistants && (
            <Section heading={slide.teachingAssistants.heading}>
              <div className="grid grid-cols-1 gap-1 py-0.5">
                {slide.teachingAssistants.members.map((m, i) => <Pill key={i} name={m.name} role={m.role} accent={false} />)}
              </div>
            </Section>
          )}
          {slide.executiveBoard && (
            <Section heading={slide.executiveBoard.heading}>
              <div className="grid grid-cols-3 gap-1 py-0.5">
                {slide.executiveBoard.members.map((m, i) => <Pill key={i} name={m.name} role={m.role} accent={true} />)}
              </div>
            </Section>
          )}
        </div>

        {slide.coreTeam && (
          <Section heading={slide.coreTeam.heading} className="flex-1">
            <div className="grid grid-cols-3 gap-1 py-0.5">
              {slide.coreTeam.members.map((m, i) => <Pill key={i} name={m.name} role={m.role} accent={i % 2 === 0} />)}
            </div>
          </Section>
        )}

        {slide.domainLeads && (
          <Section heading={slide.domainLeads.heading} className="shrink-0">
            <div className="grid grid-cols-3 gap-1 py-0.5">
              {slide.domainLeads.members.map((m, i) => <Pill key={i} name={m.name} role={m.role} accent={i % 2 !== 0} />)}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   OUTRO SLIDE
══════════════════════════════════════════════════════════════ */
function OutroSlide({ slide }: { slide: Slide }) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full text-center px-8 gap-4 overflow-hidden">
      <Orb style={{ width: 500, height: 500, top: '-15%', left: '10%', opacity: 0.8 }} />
      <Orb style={{ width: 350, height: 350, bottom: '-10%', right: '0%', background: 'radial-gradient(circle,rgba(122,26,26,0.12) 0%,transparent 70%)' }} />

      <motion.div variants={stagger} initial="hidden" animate="show"
        className="relative z-10 flex flex-col items-center gap-4 max-w-xl"
      >
        <motion.div variants={pop} className="text-6xl select-none float-anim">🚀</motion.div>

        <motion.h2 variants={up} className="font-extrabold leading-tight"
          style={{ fontSize: 'clamp(1.8rem,3.5vw,3rem)', color: MD }}>
          {slide.title}
        </motion.h2>

        {slide.subtitle && (
          <motion.p variants={fade} style={{ fontSize: 14, fontWeight: 600, color: M }}>{slide.subtitle}</motion.p>
        )}

        {/* Decorative divider */}
        <motion.div variants={fade} className="flex items-center gap-3 w-full max-w-[200px]">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${G})` }} />
          <div className="w-2.5 h-2.5 rotate-45 shrink-0" style={{ background: G }} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${G}, transparent)` }} />
        </motion.div>

        {slide.tagline && (
          <motion.p variants={up} className="font-black gold-shimmer" style={{ fontSize: 'clamp(1rem,2vw,1.5rem)' }}>
            {slide.tagline}
          </motion.p>
        )}

        {slide.closingLines && (
          <motion.div variants={stagger} className="flex flex-col gap-1.5 w-full rounded-2xl px-6 py-4"
            style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(122,26,26,0.1)', backdropFilter: 'blur(12px)' }}>
            {slide.closingLines.map((l, i) => (
              <motion.p key={i} variants={up} className="italic font-medium"
                style={{ fontSize: 13, color: i % 2 === 0 ? 'var(--brown-text)' : 'var(--muted-text)' }}>
                {l}
              </motion.p>
            ))}
          </motion.div>
        )}

        <motion.div variants={stagger} className="flex gap-2 flex-wrap justify-center">
          {['Code', 'Create', 'Collab'].map((w) => (
            <motion.span key={w} variants={pop}
              className="px-4 py-1.5 rounded-full border font-bold tracking-widest"
              style={{ fontSize: 11, borderColor: M, color: M, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {w}
            </motion.span>
          ))}
        </motion.div>

        {slide.footer && (
          <motion.p variants={fade} style={{ fontSize: 9, color: 'rgba(90,50,30,0.4)', letterSpacing: '0.12em' }}>
            {slide.footer}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

/* ── Shared pause banner ── */
function PausedBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: [0.7, 1, 0.7], y: 0 }}
      transition={{ opacity: { repeat: Infinity, duration: 2 }, y: { duration: 0.3 } }}
      className="shrink-0 flex items-center justify-center gap-2 px-4 py-1 rounded-lg border border-dashed my-0.5"
      style={{ borderColor: G, background: 'rgba(200,145,42,0.05)', color: GD, fontSize: 11, fontWeight: 600 }}
    >
      ⏸ Presentation paused — press <strong>Next →</strong> when ready
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════════════════════════ */
export default function SlideRenderer({ slide, slideIndex }: SlideRendererProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slideIndex}
        initial={enter}
        animate={center}
        exit={exit_}
        transition={spring}
        className="h-full w-full overflow-hidden"
      >
        {slide.type === 'intro' && <IntroSlide slide={slide} />}
        {slide.type === 'ceremony' && <CeremonySlide slide={slide} />}
        {slide.type === 'speaker' && <SpeakerSlide slide={slide} />}
        {slide.type === 'reveal' && <RevealSlide slide={slide} />}
        {slide.type === 'content' && <ContentSlide slide={slide} />}
        {slide.type === 'team' && <TeamSlide slide={slide} />}
        {slide.type === 'outro' && <OutroSlide slide={slide} />}
      </motion.div>
    </AnimatePresence>
  );
}
