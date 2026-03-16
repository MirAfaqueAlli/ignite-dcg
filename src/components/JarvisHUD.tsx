'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface JarvisHUDProps {
  isSpeaking: boolean;
  currentTime?: string;
  systemLabel?: string;
}

function ScanlineEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Scanline */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-linear-to-r from-transparent via-cyan-400/20 to-transparent"
        animate={{ top: ['0%', '100%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />
      {/* Corner decorations */}
      {[
        'top-0 left-0 border-t border-l',
        'top-0 right-0 border-t border-r',
        'bottom-0 left-0 border-b border-l',
        'bottom-0 right-0 border-b border-r',
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-4 h-4 border-cyan-400/40 ${cls}`}
        />
      ))}
    </div>
  );
}

function AudioWaveform({ isActive }: { isActive: boolean }) {
  const bars = 20;
  return (
    <div className="flex items-center gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-cyan-400 rounded-full"
          animate={isActive ? {
            height: [
              `${8 + Math.random() * 20}px`,
              `${4 + Math.random() * 28}px`,
              `${6 + Math.random() * 18}px`,
            ],
          } : { height: '4px' }}
          transition={{
            repeat: Infinity,
            duration: 0.3 + (i % 5) * 0.1,
            ease: 'linear',
            delay: i * 0.04,
          }}
          style={{ opacity: isActive ? 0.7 + (i % 3) * 0.1 : 0.3 }}
        />
      ))}
    </div>
  );
}

function ClockDisplay() {
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const update = () => {
      if (timeRef.current) {
        timeRef.current.textContent = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      ref={timeRef}
      className="font-mono text-cyan-400/70 text-xs tracking-widest"
    />
  );
}

export default function JarvisHUD({ isSpeaking, systemLabel = 'JARVIS v2.0' }: JarvisHUDProps) {
  return (
    <div className="relative w-full h-full">
      <ScanlineEffect />

      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 border-b border-cyan-400/10">
        {/* System label */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <span className="text-xs font-mono text-cyan-400/60 tracking-widest">{systemLabel}</span>
        </div>

        {/* Clock */}
        <ClockDisplay />

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-slate-500">
            {isSpeaking ? 'ACTIVE' : 'STANDBY'}
          </span>
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-cyan-400' : 'bg-slate-600'}`}
            animate={isSpeaking ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </div>
      </div>

      {/* Bottom waveform */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-2 pt-2 border-t border-cyan-400/10">
        <AudioWaveform isActive={isSpeaking} />
      </div>

      {/* Side decorations */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-0.5 h-3 bg-cyan-400/20 rounded-full"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
          />
        ))}
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-0.5 h-3 bg-cyan-400/20 rounded-full"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}
