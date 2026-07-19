'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

/* ════════════════════════════════════════════════════════════════
   TYPE
════════════════════════════════════════════════════════════════ */
export type RevealType = 'opening' | 'logo' | 'poster' | 'website' | null;

interface CurtainRevealOverlayProps {
  revealType: RevealType;
  onDone: () => void; // called when user presses ArrowRight after reveal
}

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS (ported from the curtain_reveal_component.md)
════════════════════════════════════════════════════════════════ */

type ConfettiProps = {
  id: number;
  startX: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle' | 'star';
  delay: number;
};

function ConfettiPiece({ startX, color, size, shape, delay }: Omit<ConfettiProps, 'id'>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const drift = (Math.random() - 0.5) * 260;
    const spin  = (Math.random() - 0.5) * 720;
    gsap.fromTo(el,
      { y: -60, x: 0, rotation: 0, opacity: 1, scale: 1 },
      { y: window.innerHeight + 80, x: drift, rotation: spin, opacity: 0, scale: 0.4,
        duration: 2.8 + Math.random() * 1.8, delay, ease: 'power1.in' }
    );
  }, [delay]);

  const starPath = 'M12,2 L14.4,9.5 L22,9.5 L16,14.2 L18.2,21.8 L12,17 L5.8,21.8 L8,14.2 L2,9.5 L9.6,9.5 Z';
  return (
    <div ref={ref} style={{ position: 'absolute', left: startX, top: 0, pointerEvents: 'none', zIndex: 9998 }}>
      {shape === 'star' ? (
        <svg width={size * 1.4} height={size * 1.4} viewBox="0 0 24 24">
          <path d={starPath} fill={color} opacity={0.9} />
        </svg>
      ) : (
        <div style={{
          width: shape === 'rect' ? size * 0.5 : size,
          height: shape === 'rect' ? size * 1.6 : size,
          borderRadius: shape === 'circle' ? '50%' : 3,
          background: color,
          boxShadow: `0 0 ${size}px ${color}55`,
        }} />
      )}
    </div>
  );
}

function Spark({ x, y, delay, angle, dist }: { x: number; y: number; delay: number; angle: number; dist: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    gsap.fromTo(ref.current,
      { x: 0, y: 0, opacity: 1, scaleX: 1 },
      { x: dx, y: dy, opacity: 0, scaleX: 0, duration: 0.7 + Math.random() * 0.5, delay, ease: 'power2.out' }
    );
  }, [angle, delay, dist]);

  return (
    <div ref={ref} style={{
      position: 'absolute', left: x, top: y,
      width: 14 + Math.random() * 12, height: 2, borderRadius: 2,
      background: `hsl(${40 + Math.random() * 25}, 95%, ${70 + Math.random() * 20}%)`,
      transformOrigin: 'left center',
      transform: `rotate(${(angle * 180) / Math.PI}deg)`,
      pointerEvents: 'none', zIndex: 9997,
      boxShadow: '0 0 6px rgba(255,220,80,0.9)',
    }} />
  );
}

function BloomFlash({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 2.5, duration: 0.45, ease: 'power2.out',
        onComplete: () => { gsap.to(ref.current, { opacity: 0, duration: 0.7, ease: 'power2.in' }); }
      }
    );
  }, [active]);
  return (
    <div ref={ref} style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9996, opacity: 0,
      background: 'radial-gradient(ellipse at 50% 50%, rgba(255,220,80,0.32) 0%, rgba(201,162,39,0.12) 40%, transparent 70%)',
      borderRadius: '50%',
    }} />
  );
}

function FoldEdge({ position }: { position: 'top' | 'bottom' }) {
  const pts = [
    { x: 0, amp: 14 }, { x: 120, amp: 22 }, { x: 280, amp: 9 }, { x: 400, amp: 18 },
    { x: 560, amp: 7 }, { x: 720, amp: 20 }, { x: 860, amp: 12 }, { x: 1000, amp: 24 },
    { x: 1150, amp: 8 }, { x: 1300, amp: 17 }, { x: 1440, amp: 10 },
  ];
  const d = `M0,0 ` + pts.slice(1).map((p, i) => {
    const prev = pts[i];
    const cpx = (prev.x + p.x) / 2;
    return `C${cpx},${prev.amp} ${cpx},${p.amp} ${p.x},${p.amp}`;
  }).join(' ') + ` L1440,40 L0,40 Z`;

  return (
    <svg viewBox="0 0 1440 40" preserveAspectRatio="none" style={{
      position: 'absolute',
      [position === 'top' ? 'bottom' : 'top']: -1,
      left: 0, width: '100%', height: 44,
      transform: position === 'bottom' ? 'scaleY(-1)' : 'none',
    }}>
      <path d={d} fill={position === 'top' ? '#1A0A02' : '#0D0300'} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   WEBSITE EMBED REVEAL — flashy iframe reveal panel
════════════════════════════════════════════════════════════════ */
function WebsiteRevealPanel({ onNext, zIndex = 8990 }: { onNext: () => void; zIndex?: number }) {
  const panelRef  = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [clicked, setClicked]   = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  /* entrance: panel bg is immediate, only inner content animates */
  useEffect(() => {
    if (!panelRef.current) return;
    // Animate only the inner content div child
    const inner = panelRef.current.querySelector('[data-website-inner]') as HTMLDivElement | null;
    if (!inner) return;
    gsap.fromTo(inner,
      { opacity: 0, scale: 0.85, y: 60 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.4)', delay: 0.9 }
    );
  }, []);

  /* keyboard → next */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') onNext();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onNext]);

  const handleLinkClick = useCallback(() => {
    if (clicked) return;
    setClicked(true);
    setFlashing(true);
    setTimeout(() => { setFlashing(false); setShowIframe(true); }, 900);
  }, [clicked]);

  return (
    <>
      {/* Full-screen flash */}
      {flashing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,220,60,0.95) 0%, rgba(201,162,39,0.7) 40%, rgba(0,0,0,0.85) 100%)',
          animation: 'websiteFlash 0.9s ease-out forwards',
        }} />
      )}

      {/* Fullscreen iframe */}
      {showIframe && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000, background: '#000',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 18px',
            background: 'linear-gradient(90deg, #1A0800, #3A1200)',
            borderBottom: '2px solid #C9A227',
          }}>
            <div style={{
              display: 'flex', gap: 8,
              fontSize: 13, fontWeight: 800, letterSpacing: '0.1em',
              color: '#F0DC7A',
            }}>
              🌐 psddriems.vercel.app
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={onNext}
              style={{
                background: 'linear-gradient(135deg, #C9A227, #8B6914)',
                color: '#1C0A00', fontWeight: 800, fontSize: 12,
                padding: '6px 18px', borderRadius: 999, border: 'none',
                cursor: 'pointer', letterSpacing: '0.08em',
              }}
            >
              → Next Slide
            </button>
          </div>
          <iframe
            ref={iframeRef}
            src="https://psddriems.vercel.app"
            style={{ flex: 1, border: 'none', width: '100%' }}
            title="DRIEMS Coders Guild Website"
          />
        </div>
      )}

      {/* Card panel — immediately opaque background */}
      {!showIframe && (
        <div ref={panelRef} style={{
          position: 'fixed', inset: 0, zIndex,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at 50% 50%, #080200 0%, #020100 100%)',
          backdropFilter: 'none',
        }}>
          {/* Glow orb */}
          <div style={{
            position: 'absolute', width: 500, height: 500,
            borderRadius: '50%', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'radial-gradient(circle, rgba(201,162,39,0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div data-website-inner style={{ position: 'relative', textAlign: 'center', maxWidth: 600 }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #C9A227, #8B6914)',
              color: '#1C0A00', fontWeight: 800, fontSize: 11, letterSpacing: '0.15em',
              padding: '6px 18px', borderRadius: 999, marginBottom: 28,
              textTransform: 'uppercase',
            }}>
              <span>🌐</span> Website Live
            </div>

            <h2 style={{
              fontFamily: 'serif', fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              background: 'linear-gradient(140deg, #A87010 0%, #E8C547 35%, #FFF0A0 50%, #E8C547 65%, #C9A227 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(201,162,39,0.5))',
              margin: '0 0 12px',
            }}>
              psddriems.vercel.app
            </h2>

            <p style={{
              color: 'rgba(240,220,120,0.65)', fontSize: 15, fontWeight: 500,
              letterSpacing: '0.05em', marginBottom: 40,
            }}>
              The official digital home of DRIEMS Coders Guild — now live.
            </p>

            {/* The glowing reveal button */}
            <div
              onClick={handleLinkClick}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '18px 48px', borderRadius: 12,
                background: 'linear-gradient(180deg, #E0B53A 0%, #C9A227 22%, #A87818 50%, #C9A227 78%, #E0B53A 100%)',
                boxShadow: '0 6px 40px rgba(201,162,39,0.65), 0 0 80px rgba(201,162,39,0.2)',
                cursor: 'pointer', userSelect: 'none',
                fontSize: 18, fontWeight: 800, color: '#1C0A00',
                letterSpacing: '0.08em',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.06)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 60px rgba(201,162,39,0.9), 0 0 120px rgba(201,162,39,0.35)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 40px rgba(201,162,39,0.65), 0 0 80px rgba(201,162,39,0.2)';
              }}
            >
              {/* Shine sweep */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                animation: 'rshine 2.5s ease-in-out infinite',
              }} />
              🚀 &nbsp;Visit Website
            </div>

            {/* hint */}
            <p style={{
              marginTop: 24, fontSize: 11, letterSpacing: '0.2em',
              color: 'rgba(201,162,39,0.45)', textTransform: 'uppercase',
            }}>
              Press → to continue to next slide
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes websiteFlash {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes rshine {
          0%   { background-position: -120% 0; }
          55%  { background-position: 220% 0; }
          100% { background-position: 220% 0; }
        }
      `}</style>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   REVEALED IMAGE PANEL  (shown after curtain opens for logo/poster)
════════════════════════════════════════════════════════════════ */
function RevealedImagePanel({ revealType, onNext, zIndex = 8990 }: { revealType: 'logo' | 'poster'; onNext: () => void; zIndex?: number }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);

  const src = revealType === 'logo' ? '/reveals/logoDCG.png' : '/reveals/poster.png';
  const label = revealType === 'logo' ? 'Official Logo' : 'Official Poster';

  useEffect(() => {
    if (!imgRef.current) return;
    // Panel background is instantly visible — only animate the image in
    gsap.fromTo(imgRef.current,
      { scale: 0.65, opacity: 0, rotationY: -20 },
      { scale: 1, opacity: 1, rotationY: 0, duration: 1.3, delay: 0.9, ease: 'back.out(1.4)' }
    );
  }, []);

  /* keyboard → next */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') onNext();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onNext]);

  return (
    <div ref={panelRef} style={{
      position: 'fixed', inset: 0, zIndex,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      /* Immediately opaque black background — no fade-in, eliminates flash of underlying slide */
      background: 'radial-gradient(ellipse at 50% 60%, #1E0800 0%, #060100 100%)',
    }}>
      {/* Radial glow behind image */}
      <div style={{
        position: 'absolute', width: '60vw', height: '60vh', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(201,162,39,0.22) 0%, transparent 70%)',
        filter: 'blur(30px)', pointerEvents: 'none',
      }} />

      {/* Gold badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #C9A227, #8B6914)',
        color: '#1C0A00', fontWeight: 800, fontSize: 11, letterSpacing: '0.15em',
        padding: '6px 20px', borderRadius: 999, marginBottom: 32,
        textTransform: 'uppercase', position: 'relative',
      }}>
        ✦ {label} Revealed ✦
      </div>

      {/* The image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={label}
        style={{
          maxWidth: revealType === 'logo' ? '38vw' : '55vw',
          maxHeight: revealType === 'logo' ? '65vh' : '72vh',
          objectFit: 'contain',
          borderRadius: revealType === 'logo' ? 24 : 12,
          boxShadow: '0 0 80px rgba(201,162,39,0.5), 0 20px 60px rgba(0,0,0,0.8)',
          position: 'relative',
        }}
      />

      {/* Press arrow hint */}
      <p style={{
        marginTop: 32, fontSize: 12, letterSpacing: '0.2em',
        color: 'rgba(201,162,39,0.5)', textTransform: 'uppercase',
        animation: 'arrowPulse 1.5s ease-in-out infinite',
      }}>
        Press → to continue
      </p>

      <style>{`
        @keyframes arrowPulse {
          0%, 100% { opacity: 0.4; transform: translateX(0); }
          50%       { opacity: 1;   transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN CURTAIN REVEAL OVERLAY
════════════════════════════════════════════════════════════════ */
export default function CurtainRevealOverlay({ revealType, onDone }: CurtainRevealOverlayProps) {
  const curtainRef     = useRef<HTMLDivElement>(null);
  const topPanelRef    = useRef<HTMLDivElement>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const ribbonRef      = useRef<HTMLDivElement>(null);
  const scissorRef     = useRef<HTMLDivElement>(null);
  const cutLineRef     = useRef<HTMLDivElement>(null);
  const promptRef      = useRef<HTMLDivElement>(null);
  const logoRef        = useRef<HTMLDivElement>(null);
  const seam1Ref       = useRef<HTMLDivElement>(null);
  const seam2Ref       = useRef<HTMLDivElement>(null);
  const topSwayRef     = useRef<HTMLDivElement>(null);
  const botSwayRef     = useRef<HTMLDivElement>(null);

  type SparkItem = { id: number; x: number; y: number; angle: number; dist: number; delay: number };

  const [sparks,      setSparks]      = useState<SparkItem[]>([]);
  const [confetti,    setConfetti]    = useState<ConfettiProps[]>([]);
  const [bloomActive, setBloom]       = useState(false);
  const [hasCut,      setHasCut]      = useState(false);
  const [isReady,     setIsReady]     = useState(false);
  const [curtainGone, setCurtainGone] = useState(false);
  const [showRevealed, setShowRevealed] = useState(false);

  /* ── Entrance animation ── */
  useEffect(() => {
    gsap.set([topPanelRef.current, bottomPanelRef.current], { yPercent: 0 });
    gsap.set(ribbonRef.current,  { opacity: 0, scaleX: 0.3 });
    gsap.set(logoRef.current,    { opacity: 0, y: 50, scale: 0.85 });
    gsap.set(promptRef.current,  { opacity: 0, y: 16 });

    const tl = gsap.timeline();
    tl.to(logoRef.current,   { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out', delay: 0.15 })
      .to(ribbonRef.current,  { opacity: 1, scaleX: 1, duration: 1.2, ease: 'elastic.out(1, 0.55)' }, '-=0.5')
      .to(promptRef.current,  { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
      .call(() => setIsReady(true));

    gsap.to(topSwayRef.current, { skewX: 0.6, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to(botSwayRef.current, { skewX: -0.6, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5 });
  }, []);


  /* ── Cut / Reveal handler ── */
  const handleCut = useCallback(() => {
    if (hasCut) return;
    setHasCut(true);

    /* sparks */
    const ribbon = ribbonRef.current;
    if (ribbon) {
      const rect = ribbon.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const sparkArr: SparkItem[] = Array.from({ length: 64 }, (_, i) => ({
        id: i,
        x: cx + (Math.random() - 0.5) * rect.width * 0.6,
        y: cy + (Math.random() - 0.5) * 18,
        angle: (i / 64) * Math.PI * 2,
        dist: 55 + Math.random() * 140,
        delay: Math.random() * 0.18,
      }));
      setSparks(sparkArr);
    }

    /* confetti */
    const COLORS = ['#FFD700','#C9A227','#F5DC6E','#FF6B6B','#FF8E53','#FF4E6A','#A855F7','#60A5FA','#34D399','#F472B6','#FBBF24','#FFF'];
    const SHAPES: ConfettiProps['shape'][] = ['rect', 'circle', 'star'];
    const now = Date.now();
    setConfetti(Array.from({ length: 110 }, (_, i) => ({
      id: now + i,
      startX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1440),
      color:  COLORS[Math.floor(Math.random() * COLORS.length)],
      size:   6 + Math.random() * 10,
      shape:  SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay:  2.1 + Math.random() * 0.6,
    })));

    const tl = gsap.timeline({
      onComplete: () => {
        if (revealType === 'opening') {
          // Opening curtain: just dismiss and hand off to start screen
          setTimeout(() => { setCurtainGone(true); onDone(); }, 300);
        } else {
          // Inner panels handle onDone, just remove curtain
          setCurtainGone(true);
        }
      },
    });

    if (revealType !== 'opening') {
      setShowRevealed(true); // Panel appears instantly behind curtain
    }

    tl.to(scissorRef.current, { scale: 1.25, rotation: -25, duration: 0.1, ease: 'power3.in' })
      .to(scissorRef.current, { scale: 0, opacity: 0, duration: 0.18, ease: 'power3.in' })
      .to(cutLineRef.current, { opacity: 1, scaleX: 1, duration: 0.12, ease: 'power4.out' }, '<')
      .to(cutLineRef.current, { opacity: 0, duration: 0.35 }, '+=0.08')
      .to([ribbonRef.current, promptRef.current], { opacity: 0, y: -10, duration: 0.25, ease: 'power2.in' }, '<-=0.15')
      .to(logoRef.current, { opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' }, '<')
      .call(() => setBloom(true))
      .to(topPanelRef.current,    { yPercent: 1.5,  duration: 0.25, ease: 'power1.out' }, '+=0.05')
      .to(bottomPanelRef.current, { yPercent: -1.5, duration: 0.25, ease: 'power1.out' }, '<')
      .to(topPanelRef.current,    { yPercent: -28,  duration: 1.1,  ease: 'power1.inOut' })
      .to(bottomPanelRef.current, { yPercent: 28,   duration: 1.1,  ease: 'power1.inOut' }, '<')
      .to(topPanelRef.current,    { yPercent: -72,  duration: 0.85, ease: 'power2.in' })
      .to(bottomPanelRef.current, { yPercent: 72,   duration: 0.85, ease: 'power2.in' }, '<')
      .to(topPanelRef.current,    { yPercent: -107, duration: 1.0,  ease: 'power3.out' })
      .to(bottomPanelRef.current, { yPercent: 107,  duration: 1.0,  ease: 'power3.out' }, '<')
      .to([seam1Ref.current, seam2Ref.current], { opacity: 0, duration: 0.4 }, '-=0.8')
      .to(curtainRef.current, { opacity: 0, duration: 0.55, ease: 'power2.out' }, '-=0.2');
  }, [hasCut]);

  /* ── Enter / Space key → cut ribbon ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && isReady && !hasCut) {
        e.preventDefault();
        handleCut();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isReady, hasCut, handleCut]);

  /* label shown on curtain */
  const curtainLabel =
    revealType === 'opening'  ? 'DRIEMS Coders Guild'
    : revealType === 'logo'   ? 'Logo Reveal'
    : revealType === 'poster' ? 'Poster Reveal'
    : revealType === 'website'? 'Website Reveal'
    : 'Reveal';

  const curtainSubtitle =
    revealType === 'opening'  ? 'Expansion Ceremony'
    : 'DRIEMS Coders Guild · Expansion Ceremony';

  const ribbonText =
    revealType === 'opening'  ? '✦ Unveil the Ceremony ✦'
    : '✦ Click to Reveal ✦';

  /* The emoji icon for the ribbon */
  const ribbonIcon =
    revealType === 'opening'  ? '🎓'
    : revealType === 'logo'   ? '⚡'
    : revealType === 'poster' ? '🖼️'
    : revealType === 'website'? '🌐'
    : '✦';

  return (
    <>
      {/* Sparks layer */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}>
        {sparks.map(s => <Spark key={s.id} x={s.x} y={s.y} angle={s.angle} dist={s.dist} delay={s.delay} />)}
      </div>

      {/* Confetti layer */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
        {confetti.map(c => <ConfettiPiece key={c.id} startX={c.startX} color={c.color} size={c.size} shape={c.shape} delay={c.delay} />)}
      </div>

      <BloomFlash active={bloomActive} />

      {/* REVEALED CONTENT PANELS (mounted behind the curtain immediately on cut) */}
      {showRevealed && revealType === 'website' && <WebsiteRevealPanel onNext={onDone} zIndex={8990} />}
      {showRevealed && (revealType === 'logo' || revealType === 'poster') && <RevealedImagePanel revealType={revealType} onNext={onDone} zIndex={8990} />}

      {/* ── CURTAIN ── */}
      {!curtainGone && (
        <div ref={curtainRef} style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          pointerEvents: hasCut ? 'none' : 'auto',
          overflow: 'hidden',
        }}>
        {/* TOP PANEL */}
        <div ref={topPanelRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', overflow: 'hidden' }}>
          <div ref={topSwayRef} style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(170deg, #200800 0%, #3A1200 25%, #1A0600 55%, #280A00 80%, #120400 100%)',
          }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${(i / 30) * 100}%`, top: 0, bottom: 0,
                width: `${3 + Math.sin(i * 1.2) * 1.5}%`,
                background: i % 2 === 0 ? 'linear-gradient(to right, rgba(0,0,0,0.18), transparent)' : 'linear-gradient(to right, rgba(255,180,60,0.04), transparent)',
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90%', height: '60%', background: 'radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          </div>
          <FoldEdge position="top" />
          <div ref={seam1Ref} style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #8B6914 5%, #C9A227 18%, #F0DC7A 50%, #C9A227 82%, #8B6914 95%, transparent 100%)',
            boxShadow: '0 0 20px rgba(201,162,39,0.7), 0 0 50px rgba(201,162,39,0.35)',
          }} />
        </div>

        {/* BOTTOM PANEL */}
        <div ref={bottomPanelRef} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', overflow: 'hidden' }}>
          <div ref={botSwayRef} style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(190deg, #120400 0%, #280A00 20%, #1A0600 50%, #3A1200 75%, #200800 100%)',
          }}>
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${(i / 30) * 100}%`, top: 0, bottom: 0,
                width: `${3 + Math.sin(i * 1.2) * 1.5}%`,
                background: i % 2 === 0 ? 'linear-gradient(to right, rgba(0,0,0,0.18), transparent)' : 'linear-gradient(to right, rgba(255,180,60,0.04), transparent)',
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '90%', height: '60%', background: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          </div>
          <FoldEdge position="bottom" />
          <div ref={seam2Ref} style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, transparent 0%, #8B6914 5%, #C9A227 18%, #F0DC7A 50%, #C9A227 82%, #8B6914 95%, transparent 100%)',
            boxShadow: '0 0 20px rgba(201,162,39,0.7), 0 0 50px rgba(201,162,39,0.35)',
          }} />
        </div>

        {/* OVERLAY: Label + Ribbon */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>

          {/* Label */}
          <div ref={logoRef} style={{ textAlign: 'center', marginBottom: 44, userSelect: 'none' }}>
            <div style={{
              fontFamily: 'serif',
              fontSize: 'clamp(2.4rem,6.5vw,5.5rem)', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(140deg, #A87010 0%, #E8C547 30%, #FFF0A0 50%, #E8C547 70%, #C9A227 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 28px rgba(201,162,39,0.5))', lineHeight: 1,
            }}>
              {ribbonIcon} {curtainLabel}
            </div>
            <div style={{
              fontFamily: 'sans-serif', fontSize: 'clamp(0.65rem,1.5vw,0.9rem)', letterSpacing: '0.28em',
              color: 'rgba(200,170,100,0.65)', marginTop: 12, textTransform: 'uppercase',
            }}>
              {curtainSubtitle}
            </div>
          </div>

          {/* Ribbon */}
          <div ref={ribbonRef} style={{ position: 'relative', width: 'min(540px, 88vw)', pointerEvents: 'auto' }}>
            <div style={{
              position: 'absolute', inset: -20, borderRadius: 80,
              background: 'radial-gradient(ellipse, rgba(201,162,39,0.22) 0%, transparent 68%)',
              animation: 'rpulse 2.4s ease-in-out infinite', pointerEvents: 'none',
            }} />

            <div
              onClick={isReady ? handleCut : undefined}
              style={{
                position: 'relative',
                background: 'linear-gradient(180deg, #E0B53A 0%, #C9A227 22%, #A87818 50%, #C9A227 78%, #E0B53A 100%)',
                borderRadius: 7, height: 62, padding: '0 28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
                cursor: isReady ? 'pointer' : 'default', userSelect: 'none',
                boxShadow: '0 6px 30px rgba(201,162,39,0.55), 0 0 70px rgba(201,162,39,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.22)',
                transition: 'box-shadow 0.3s, transform 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(201,162,39,0.8), 0 0 90px rgba(201,162,39,0.3), inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -2px 0 rgba(0,0,0,0.22)';
                (e.currentTarget as HTMLDivElement).style.transform = 'scaleY(1.05)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 30px rgba(201,162,39,0.55), 0 0 70px rgba(201,162,39,0.18), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.22)';
                (e.currentTarget as HTMLDivElement).style.transform = 'scaleY(1)';
              }}
            >
              {/* Left tassel */}
              <div style={{ position: 'absolute', left: -26, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 26, height: 3, background: 'linear-gradient(90deg, transparent, #C9A227)', borderRadius: 2 }} />
                <div style={{ width: 10, height: 22, background: 'linear-gradient(180deg, #C9A227 0%, #7A5412 60%, #C9A227 100%)', borderRadius: '0 0 50% 50%', marginTop: -1 }} />
                <div style={{ width: 14, height: 6, background: 'radial-gradient(ellipse, #F0DC7A 0%, #C9A227 60%, transparent 100%)', borderRadius: '50%', marginTop: -2, opacity: 0.7 }} />
              </div>
              {/* Right tassel */}
              <div style={{ position: 'absolute', right: -26, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 26, height: 3, background: 'linear-gradient(90deg, #C9A227, transparent)', borderRadius: 2 }} />
                <div style={{ width: 10, height: 22, background: 'linear-gradient(180deg, #C9A227 0%, #7A5412 60%, #C9A227 100%)', borderRadius: '0 0 50% 50%', marginTop: -1 }} />
                <div style={{ width: 14, height: 6, background: 'radial-gradient(ellipse, #F0DC7A 0%, #C9A227 60%, transparent 100%)', borderRadius: '50%', marginTop: -2, opacity: 0.7 }} />
              </div>

              <span style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 'clamp(0.9rem,2.2vw,1.15rem)', letterSpacing: '0.14em', color: '#1C0A00', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {ribbonText}
              </span>
              <div ref={scissorRef} style={{ fontSize: 22, color: '#1C0A00', opacity: 0.8, flexShrink: 0 }}>✂</div>

              {/* Shine */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'rshine 3s ease-in-out infinite', pointerEvents: 'none' }} />

              {/* Cut line */}
              <div ref={cutLineRef} style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: 2, transform: 'translateY(-50%) scaleX(0)', transformOrigin: 'center', background: 'white', boxShadow: '0 0 12px rgba(255,255,255,1)', opacity: 0, pointerEvents: 'none', borderRadius: 2 }} />
            </div>
          </div>

          {/* Prompt */}
          <div ref={promptRef} style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ width: 36, height: 1, background: 'rgba(201,162,39,0.45)' }} />
            <span style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.24em', color: '#C9A227', textTransform: 'uppercase' }}>
              Click ribbon · or press Enter
            </span>
            <div style={{ width: 36, height: 1, background: 'rgba(201,162,39,0.45)' }} />
          </div>
        </div>
        </div>
      )}

      <style>{`
        @keyframes rpulse { 0%,100% { opacity:0.55; transform:scale(1); } 50% { opacity:1; transform:scale(1.07); } }
        @keyframes rshine { 0% { background-position:-120% 0; } 55% { background-position:220% 0; } 100% { background-position:220% 0; } }
      `}</style>
    </>
  );
}
