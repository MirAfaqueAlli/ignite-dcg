'use client';

import { motion } from 'framer-motion';
import { PresentationStatus } from '@/types/slide';

interface StatusBarProps {
  status: PresentationStatus;
  currentSlide: number;
  totalSlides: number;
  eventTitle: string;
}

const statusLabel: Record<PresentationStatus, string> = {
  idle:     'Ready',
  speaking: 'Speaking',
  paused:   'Paused',
  waiting:  'Waiting for speaker',
  finished: 'Finished',
};

const statusDot: Record<PresentationStatus, string> = {
  idle:     'bg-slate-400',
  speaking: 'bg-emerald-500',
  paused:   'bg-amber-500',
  waiting:  'bg-purple-500',
  finished: 'bg-rose-500',
};

export default function StatusBar({ status, currentSlide, totalSlides, eventTitle }: StatusBarProps) {
  const progress = totalSlides > 1 ? (currentSlide / (totalSlides - 1)) * 100 : 100;

  return (
    <div className="flex items-center gap-4">
      {/* Progress bar */}
      <div className="flex-1 h-1.5 rounded-full bg-[#E8D5B0] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, var(--maroon), var(--gold))' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* AI Status pill */}
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <div className="relative flex items-center">
          <span className={`w-2 h-2 rounded-full ${statusDot[status]}`} />
          {(status === 'speaking' || status === 'waiting') && (
            <span className={`absolute w-2 h-2 rounded-full ${statusDot[status]} animate-ping opacity-70`} />
          )}
        </div>
        <span className="text-xs font-semibold text-[#5C0F0F] whitespace-nowrap">
          {statusLabel[status]}
        </span>
      </motion.div>

      {/* Event title */}
      <span className="hidden md:block text-xs text-[#7A5A4A] font-medium truncate max-w-[180px]">
        {eventTitle}
      </span>

      {/* Keyboard hints */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#A08060]">
        <kbd className="px-1.5 py-0.5 rounded border border-[#E0C89A] bg-[#FBF4E6]">←→</kbd>
        <span>nav</span>
        <kbd className="px-1.5 py-0.5 rounded border border-[#E0C89A] bg-[#FBF4E6]">Space</kbd>
        <span>pause</span>
      </div>
    </div>
  );
}
