'use client';

import dynamic from 'next/dynamic';
import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import SlideRenderer from '@/components/SlideRenderer';
import { usePresentationStore } from '@/lib/presentationStore';
import { speechController }     from '@/lib/speechController';
import { slideEngine }          from '@/lib/slideEngine';
import eventData                from '@/data/event.json';
import { EventData, PresentationStatus } from '@/types/slide';

const Avatar = dynamic(() => import('@/components/Avatar'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

/* ─── tiny icon helpers ─── */
const IcoPause = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);
const IcoPlay = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);
const IcoMute = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);
const IcoVol = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 014 12a5 5 0 014.464 3.536" />
  </svg>
);
const IcoFS = ({ on }: { on: boolean }) => on ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const statusColors: Record<PresentationStatus, string> = {
  idle: '#94a3b8', speaking: '#22c55e', paused: '#f59e0b',
  waiting: '#a855f7', finished: '#ef4444',
};

export default function PresentationPage() {
  const {
    currentSlideIndex, status, isMuted, slides, eventData: stored,
    setEventData, setStatus, nextSlide, prevSlide, setCurrentSlide, toggleMute,
  } = usePresentationStore();

  const nav = useRef(false);
  const [isFS, setIsFS] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Init ── */
  useEffect(() => {
    const data = eventData as EventData;
    setEventData(data);
    slideEngine.load(data);
    speechController.init({
      rate: 0.90, pitch: 1.35,
      onStart: () => setStatus('speaking'),
      onEnd:   () => setStatus('idle'),
      onPause: () => setStatus('paused'),
      onResume:() => setStatus('speaking'),
      onError: () => setStatus('idle'),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Narrate on slide change ── */
  useEffect(() => {
    if (!hasStarted) return;
    if (!slides.length) return;
    const slide = slides[currentSlideIndex];
    if (!slide) return;
    speechController.stop();
    const text = slideEngine.getNarration(slide);
    if (!isMuted && text) {
      const t = setTimeout(() => {
        speechController.updateOptions({
          onEnd: () => {
            setStatus('idle');
            nav.current = false;
            if (slide.pause) { setStatus('waiting'); return; }
            const a = setTimeout(() => {
              const nxt = currentSlideIndex + 1;
              if (nxt < slides.length) setCurrentSlide(nxt);
              else setStatus('finished');
            }, 1400);
            return () => clearTimeout(a);
          },
        });
        speechController.speak(text, slide.id || `slide-${currentSlideIndex + 1}`);
      }, 450);
      return () => clearTimeout(t);
    } else if (slide.pause) {
      setStatus('waiting');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlideIndex, slides, isMuted, hasStarted]);

  /* ── Fullscreen ── */
  const toggleFS = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  /* ── Auto-hide UI after 4 s of no input ── */
  const bumpUI = useCallback(() => {
    setShowUI(true);
    if (hideT.current) clearTimeout(hideT.current);
    hideT.current = setTimeout(() => setShowUI(false), 4000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', bumpUI);
    window.addEventListener('keydown',   bumpUI);
    bumpUI();
    return () => {
      window.removeEventListener('mousemove', bumpUI);
      window.removeEventListener('keydown',   bumpUI);
      if (hideT.current) clearTimeout(hideT.current);
    };
  }, [bumpUI]);

  /* ── Keyboard ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); handleNext(); }
      if (k === 'ArrowLeft'  || k === 'PageUp')   { e.preventDefault(); handlePrev(); }
      if (k === ' ')  { 
        e.preventDefault(); 
        if (!hasStarted) setHasStarted(true);
        else handleSpace(); 
      }
      if (k === 'f' || k === 'F') toggleFS();
      if (k === 'm' || k === 'M') handleMute();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isMuted]);

  const handleNext = useCallback(() => {
    if (nav.current) return;
    nav.current = true;
    speechController.stop();
    nextSlide();
    setTimeout(() => { nav.current = false; }, 300);
  }, [nextSlide]);

  const handlePrev = useCallback(() => {
    if (nav.current) return;
    nav.current = true;
    speechController.stop();
    prevSlide();
    setTimeout(() => { nav.current = false; }, 300);
  }, [prevSlide]);

  const handleSpace = useCallback(() => {
    if (status === 'speaking') speechController.pause();
    else if (status === 'paused') speechController.resume();
  }, [status]);

  const handleMute = useCallback(() => {
    if (!isMuted) { speechController.stop(); setStatus('idle'); }
    toggleMute();
  }, [isMuted, toggleMute, setStatus]);

  const handleRestart = useCallback(() => {
    speechController.stop(); setCurrentSlide(0); setStatus('idle');
  }, [setCurrentSlide, setStatus]);

  const currentSlide = slides[currentSlideIndex];
  const isSpeaking   = status === 'speaking';
  const isPaused     = status === 'paused';
  const isWaiting    = status === 'waiting';
  const isFinished   = status === 'finished';

  return (
    /* ══════════════ ROOT — true full screen ══════════════ */
    <div
      className="app-bg w-screen h-screen overflow-hidden relative"
      onMouseMove={bumpUI}
    >

      {/* ════ SLIDE — bounded by left side and avatar ════ */}
      <div
        className="absolute inset-0"
        style={{
          paddingLeft: '5vw',
          paddingRight: 'clamp(280px, 34%, 500px)'
        }}
      >
        {currentSlide
          ? <SlideRenderer slide={currentSlide} slideIndex={currentSlideIndex} />
          : <div className="h-full flex items-center justify-center text-[#A08060]">Loading…</div>
        }
      </div>



      {/* ════ VRM CHARACTER — floats right, full height, transparent ════ */}
      {/* 
        Width 34% of screen, full height.  
        Sits on top of slide (z-10). No background → slide shows through.
        pointer-events-none so the slide and buttons remain clickable.
      */}
      <div
        className="absolute top-0 right-0 bottom-0 z-10 pointer-events-none"
        style={{ width: '34%', minWidth: 280, maxWidth: 500 }}
      >
        <Avatar isSpeaking={isSpeaking} />
      </div>

      {/* ════ FLOATING UI (auto-hides) ════ */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {/* ── TOP-LEFT: event info ── */}
            <div
              className="absolute top-4 left-5 pointer-events-auto
                         flex items-center gap-2.5 px-3 py-2 rounded-xl
                         border shadow-sm"
              style={{ background: 'rgba(255,252,248,0.85)', borderColor: 'var(--card-border)', backdropFilter: 'blur(10px)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm text-white"
                style={{ background: 'var(--maroon)' }}
              >J</div>
              <div>
                <div className="text-xs font-bold leading-none" style={{ color: 'var(--maroon)' }}>
                  {stored?.eventTitle ?? 'Coding Club Inauguration'}
                </div>
                <div className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--muted-text)' }}>
                  {stored?.date}
                </div>
              </div>
            </div>

            {/* ── TOP-RIGHT: fullscreen + status dot ── */}
            <div className="absolute top-4 right-4 pointer-events-auto flex items-center gap-2">
              {/* AI status pill */}
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm"
                style={{ background: 'rgba(255,252,248,0.85)', borderColor: 'var(--card-border)', backdropFilter: 'blur(10px)' }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: statusColors[status],
                    boxShadow: isSpeaking ? `0 0 6px ${statusColors[status]}` : 'none',
                    animation: isSpeaking || isWaiting ? 'pulse 1.2s infinite' : 'none',
                  }}
                />
                <span style={{ color: 'var(--maroon)' }}>
                  {isSpeaking ? 'Speaking' : isPaused ? 'Paused' : isWaiting ? 'Waiting…' : isFinished ? 'Done' : 'Ready'}
                </span>
              </div>

              {/* Fullscreen button */}
              <button
                onClick={toggleFS}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold
                           border shadow-sm cursor-pointer transition hover:opacity-80"
                style={{ background: 'rgba(255,252,248,0.85)', borderColor: 'var(--card-border)', backdropFilter: 'blur(10px)', color: 'var(--maroon)' }}
              >
                <IcoFS on={isFS} />
                {isFS ? 'Exit' : 'Fullscreen'}
              </button>
            </div>

            {/* ── SLIDE DOTS — center top ── */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-1.5">
              {slides.map((s, i) => (
                <motion.button
                  key={i}
                  onClick={() => { speechController.stop(); setCurrentSlide(i); }}
                  whileTap={{ scale: 0.8 }}
                  title={s.title}
                  className="rounded-full cursor-pointer transition-all duration-200"
                  style={{
                    width:  i === currentSlideIndex ? 20 : 8,
                    height: 8,
                    background: i === currentSlideIndex ? 'var(--maroon)' : 'rgba(122,26,26,0.25)',
                  }}
                />
              ))}
            </div>



            {/* ── BOTTOM CONTROL BAR ── */}
            <div
              className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto
                         flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg"
              style={{
                background: 'rgba(255,252,248,0.92)',
                borderColor: 'var(--card-border)',
                backdropFilter: 'blur(14px)',
              }}
            >
              {/* Slide counter */}
              <span
                className="text-sm font-mono font-bold tracking-wider px-2 py-1 rounded-lg"
                style={{ background: 'var(--cream-dark)', color: 'var(--maroon)' }}
              >
                {String(currentSlideIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>

              {/* Progress bar */}
              <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cream-dark)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--maroon), var(--gold))' }}
                  animate={{ width: `${slides.length > 1 ? (currentSlideIndex / (slides.length - 1)) * 100 : 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Pause / Resume */}
              {isSpeaking && (
                <button
                  onClick={() => speechController.pause()}
                  className="btn btn-ghost px-3 py-1.5 text-xs gap-1 cursor-pointer"
                  style={{ color: 'var(--maroon)' }}
                >
                  <IcoPause /> Pause
                </button>
              )}
              {isPaused && (
                <button
                  onClick={() => speechController.resume()}
                  className="btn btn-gold px-3 py-1.5 text-xs gap-1 cursor-pointer"
                >
                  <IcoPlay /> Resume
                </button>
              )}
              {isFinished && (
                <button
                  onClick={handleRestart}
                  className="btn btn-primary px-3 py-1.5 text-xs cursor-pointer"
                >
                  Restart
                </button>
              )}

              {/* Mute */}
              <button
                onClick={handleMute}
                title={`${isMuted ? 'Unmute' : 'Mute'} (M)`}
                className="p-2 rounded-xl border cursor-pointer transition hover:opacity-70"
                style={{
                  background: isMuted ? 'var(--maroon)' : 'transparent',
                  color:      isMuted ? 'white' : 'var(--maroon)',
                  borderColor:'var(--card-border)',
                }}
              >
                {isMuted ? <IcoMute /> : <IcoVol />}
              </button>
            </div>

            {/* ── Keyboard hint (faint) ── */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] tracking-widest"
              style={{ color: 'rgba(90,50,30,0.35)' }}>
              ← → navigate &nbsp;·&nbsp; Space pause &nbsp;·&nbsp; F fullscreen &nbsp;·&nbsp; M mute
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
