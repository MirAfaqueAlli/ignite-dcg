'use client';

import { motion } from 'framer-motion';
import { PresentationStatus } from '@/types/slide';

interface ControlPanelProps {
  status: PresentationStatus;
  currentSlide: number;
  totalSlides: number;
  isMuted: boolean;
  onNext: () => void;
  onPrev: () => void;
  onPause: () => void;
  onResume: () => void;
  onToggleMute: () => void;
  onRestart: () => void;
}

export default function ControlPanel({
  status, currentSlide, totalSlides, isMuted,
  onNext, onPrev, onPause, onResume, onToggleMute, onRestart,
}: ControlPanelProps) {
  const isSpeaking = status === 'speaking';
  const isPaused   = status === 'paused';
  const isFinished = status === 'finished';

  return (
    <div className="flex items-center justify-between gap-4">

      {/* ── Prev ── */}
      <motion.button
        onClick={onPrev}
        disabled={currentSlide === 0}
        whileTap={{ scale: 0.94 }}
        className="btn btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </motion.button>

      {/* ── Centre controls ── */}
      <div className="flex items-center gap-3">
        {/* Mute */}
        <motion.button
          onClick={onToggleMute}
          whileTap={{ scale: 0.93 }}
          title={isMuted ? 'Unmute' : 'Mute AI voice'}
          className="btn btn-ghost gap-1.5 px-3"
        >
          {isMuted ? (
            <svg className="w-4 h-4 text-[#7A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 
                   12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#7A1A1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536A5 5 0 014 12a5 5 0 014.464 3.536" />
            </svg>
          )}
          <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
        </motion.button>

        {/* Pause / Resume */}
        {isSpeaking && (
          <motion.button onClick={onPause} whileTap={{ scale: 0.93 }}
            className="btn bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            Pause
          </motion.button>
        )}
        {isPaused && (
          <motion.button onClick={onResume} whileTap={{ scale: 0.93 }} className="btn btn-gold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Resume
          </motion.button>
        )}
        {isFinished && (
          <motion.button onClick={onRestart} whileTap={{ scale: 0.93 }} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 
                   8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart
          </motion.button>
        )}

        {/* Slide counter */}
        <div
          className="px-4 py-2 rounded-xl text-sm font-bold tracking-wide"
          style={{ background: 'var(--cream-dark)', color: 'var(--maroon)' }}
        >
          {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </div>
      </div>

      {/* ── Next ── */}
      <motion.button
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1 && !isFinished}
        whileTap={{ scale: 0.94 }}
        className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

    </div>
  );
}
