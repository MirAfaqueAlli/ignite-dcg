# Curtain Reveal React Component

Here is the complete code for the **Curtain Reveal** animation component. You can drop this directly into any Next.js or React project.

### Prerequisites

You need `gsap` installed in your project:
```bash
npm install gsap
```

### How to Use

1. Create a new file named [CurtainReveal.tsx](file:///c:/Users/miraf/OneDrive/Desktop/SmritiX-main/src/components/landing/CurtainReveal.tsx).
2. Paste the code below into the file.
3. Import and render `<CurtainReveal />` as high up in your layout or page tree as possible. 

The component will automatically mount a fixed-position full-screen overlay with `z-index: 9000`. Once the user clicks the ribbon, the animation will play, and the component will return `null` (unmounting itself) so it doesn't block interactions.

---

### [CurtainReveal.tsx](file:///c:/Users/miraf/OneDrive/Desktop/SmritiX-main/src/components/landing/CurtainReveal.tsx)

```tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

/* ═══════════════════════════════════════════════════════════════════════════
   SCISSOR ICON
═══════════════════════════════════════════════════════════════════════════ */
function ScissorIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="12" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="7.78" y1="12.23" x2="14" y2="16" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFETTI PIECE — falls from sky after reveal
═══════════════════════════════════════════════════════════════════════════ */
type ConfettiProps = { id: number; startX: number; color: string; size: number; shape: 'rect' | 'circle' | 'star'; delay: number };

function ConfettiPiece({ startX, color, size, shape, delay }: Omit<ConfettiProps, 'id'>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const drift = (Math.random() - 0.5) * 260;
    const spin = (Math.random() - 0.5) * 720;

    gsap.fromTo(el,
      { y: -60, x: 0, rotation: 0, opacity: 1, scale: 1 },
      {
        y: window.innerHeight + 80,
        x: drift,
        rotation: spin,
        opacity: 0,
        scale: 0.4,
        duration: 2.8 + Math.random() * 1.8,
        delay,
        ease: 'power1.in',
      }
    );
  }, [delay]);

  const starPath = 'M12,2 L14.4,9.5 L22,9.5 L16,14.2 L18.2,21.8 L12,17 L5.8,21.8 L8,14.2 L2,9.5 L9.6,9.5 Z';

  return (
    <div ref={ref} style={{
      position: 'absolute',
      left: startX,
      top: 0,
      pointerEvents: 'none',
      zIndex: 9998,
    }}>
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

/* ═══════════════════════════════════════════════════════════════════════════
   SPARK — radiates from ribbon cut point
═══════════════════════════════════════════════════════════════════════════ */
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
      position: 'absolute',
      left: x,
      top: y,
      width: 14 + Math.random() * 12,
      height: 2,
      borderRadius: 2,
      background: `hsl(${40 + Math.random() * 25}, 95%, ${70 + Math.random() * 20}%)`,
      transformOrigin: 'left center',
      transform: `rotate(${(angle * 180) / Math.PI}deg)`,
      pointerEvents: 'none',
      zIndex: 9997,
      boxShadow: `0 0 6px rgba(255,220,80,0.9)`,
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BLOOM FLASH — full-screen radial light burst
═══════════════════════════════════════════════════════════════════════════ */
function BloomFlash({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    gsap.fromTo(ref.current,
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 2.5, duration: 0.45, ease: 'power2.out',
        onComplete: () => {
          gsap.to(ref.current, { opacity: 0, duration: 0.7, ease: 'power2.in' });
        }
      }
    );
  }, [active]);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9996,
      opacity: 0,
      background: 'radial-gradient(ellipse at 50% 50%, rgba(255,220,80,0.32) 0%, rgba(201,162,39,0.12) 40%, transparent 70%)',
      borderRadius: '50%',
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CELEBRATE BANNER — text that pops up after reveal
═══════════════════════════════════════════════════════════════════════════ */
function CelebrateBanner({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;
    gsap.fromTo(ref.current,
      { y: 60, opacity: 0, scale: 0.7 },
      { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(ref.current, { opacity: 0, y: -30, scale: 0.9, duration: 0.8, delay: 1.6, ease: 'power2.in' });
        }
      }
    );
  }, [active]);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9995,
      pointerEvents: 'none',
      opacity: 0,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'serif',
        fontSize: 'clamp(2rem, 6vw, 4.5rem)',
        fontWeight: 800,
        background: 'linear-gradient(135deg, #F0DC7A 0%, #FFE680 30%, #C9A227 60%, #F0DC7A 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 30px rgba(255,220,80,0.6))',
        letterSpacing: '0.04em',
      }}>✦ Welcome ✦</div>
      <div style={{
        fontFamily: 'sans-serif',
        fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
        letterSpacing: '0.3em',
        color: 'rgba(240,220,120,0.8)',
        marginTop: 8,
        textTransform: 'uppercase',
      }}>The Experience is now revealed</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CURTAIN FABRIC FOLDS — animated CSS wave on the seam edge
═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CURTAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function CurtainReveal() {
  const curtainRef      = useRef<HTMLDivElement>(null);
  const topPanelRef     = useRef<HTMLDivElement>(null);
  const bottomPanelRef  = useRef<HTMLDivElement>(null);
  const ribbonRef       = useRef<HTMLDivElement>(null);
  const scissorRef      = useRef<HTMLDivElement>(null);
  const cutLineRef      = useRef<HTMLDivElement>(null);
  const promptRef       = useRef<HTMLDivElement>(null);
  const logoRef         = useRef<HTMLDivElement>(null);
  const seam1Ref        = useRef<HTMLDivElement>(null);
  const seam2Ref        = useRef<HTMLDivElement>(null);
  const topSwayRef      = useRef<HTMLDivElement>(null);
  const botSwayRef      = useRef<HTMLDivElement>(null);

  const [sparks, setSparks]       = useState<{ id: number; x: number; y: number; angle: number; dist: number; delay: number }[]>([]);
  const [confetti, setConfetti]   = useState<ConfettiProps[]>([]);
  const [bloomActive, setBloom]   = useState(false);
  const [bannerActive, setBanner] = useState(false);
  const [isGone, setIsGone]       = useState(false);
  const [hasCut, setHasCut]       = useState(false);
  const [isReady, setIsReady]     = useState(false);

  /* ── Entrance animation ─────────────────────────────────────────────── */
  useEffect(() => {
    gsap.set([topPanelRef.current, bottomPanelRef.current], { yPercent: 0 });
    gsap.set(ribbonRef.current, { opacity: 0, scaleX: 0.3 });
    gsap.set(logoRef.current, { opacity: 0, y: 50, scale: 0.85 });
    gsap.set(promptRef.current, { opacity: 0, y: 16 });

    const tl = gsap.timeline();
    tl.to(logoRef.current,  { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: 'power3.out', delay: 0.2 })
      .to(ribbonRef.current, { opacity: 1, scaleX: 1, duration: 1.2, ease: 'elastic.out(1, 0.55)' }, '-=0.5')
      .to(promptRef.current, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3')
      .call(() => setIsReady(true));

    gsap.to(topSwayRef.current, {
      skewX: 0.6, duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });
    gsap.to(botSwayRef.current, {
      skewX: -0.6, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.5,
    });
  }, []);

  /* ── Cut handler ────────────────────────────────────────────────────── */
  const handleCut = useCallback(() => {
    if (hasCut) return;
    setHasCut(true);

    const ribbon = ribbonRef.current;
    if (ribbon) {
      const rect = ribbon.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const sparkArr = Array.from({ length: 64 }, (_, i) => ({
        id: i,
        x: cx + (Math.random() - 0.5) * rect.width * 0.6,
        y: cy + (Math.random() - 0.5) * 18,
        angle: (i / 64) * Math.PI * 2,
        dist: 55 + Math.random() * 140,
        delay: Math.random() * 0.18,
      }));
      setSparks(sparkArr);
    }

    const COLORS = ['#FFD700','#C9A227','#F5DC6E','#FF6B6B','#FF8E53','#FF4E6A','#A855F7','#60A5FA','#34D399','#F472B6','#FBBF24','#FFF'];
    const SHAPES: ConfettiProps['shape'][] = ['rect', 'circle', 'star'];
    const now = Date.now();
    const confArr: ConfettiProps[] = Array.from({ length: 110 }, (_, i) => ({
      id: now + i,
      startX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1440),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 10,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      delay: 2.1 + Math.random() * 0.6,
    }));
    setConfetti(confArr);

    const tl = gsap.timeline({
      onComplete: () => { setTimeout(() => setIsGone(true), 2400); },
    });

    tl.to(scissorRef.current, { scale: 1.25, rotation: -25, duration: 0.1, ease: 'power3.in' })
      .to(scissorRef.current, { scale: 0, opacity: 0, duration: 0.18, ease: 'power3.in' })
      .to(cutLineRef.current, { opacity: 1, scaleX: 1, duration: 0.12, ease: 'power4.out' }, '<')
      .to(cutLineRef.current, { opacity: 0, duration: 0.35 }, '+=0.08')
      .to([ribbonRef.current, promptRef.current], { opacity: 0, y: -10, duration: 0.25, ease: 'power2.in' }, '<-=0.15')
      .to(logoRef.current, { opacity: 0, y: -24, duration: 0.4, ease: 'power2.in' }, '<')
      .call(() => setBloom(true))
      .to(topPanelRef.current, { yPercent: 1.5, duration: 0.25, ease: 'power1.out' }, '+=0.05')
      .to(bottomPanelRef.current, { yPercent: -1.5, duration: 0.25, ease: 'power1.out' }, '<')
      .to(topPanelRef.current, { yPercent: -28, duration: 1.1, ease: 'power1.inOut' })
      .to(bottomPanelRef.current, { yPercent: 28, duration: 1.1, ease: 'power1.inOut' }, '<')
      .to(topPanelRef.current, { yPercent: -72, duration: 0.85, ease: 'power2.in' })
      .to(bottomPanelRef.current, { yPercent: 72, duration: 0.85, ease: 'power2.in' }, '<')
      .to(topPanelRef.current, { yPercent: -107, duration: 1.0, ease: 'power3.out' })
      .to(bottomPanelRef.current, { yPercent: 107, duration: 1.0, ease: 'power3.out' }, '<')
      .to([seam1Ref.current, seam2Ref.current], { opacity: 0, duration: 0.4 }, '-=0.8')
      .call(() => setBanner(true), undefined, '-=0.3')
      .to(curtainRef.current, { opacity: 0, duration: 0.65, ease: 'power2.out' }, '-=0.2');

  }, [hasCut]);

  useEffect(() => {
    if (isGone) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handleCut();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isGone, handleCut]);

  if (isGone) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}>
        {sparks.map(s => <Spark key={s.id} x={s.x} y={s.y} angle={s.angle} dist={s.dist} delay={s.delay} />)}
      </div>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, overflow: 'hidden' }}>
        {confetti.map(c => <ConfettiPiece key={c.id} startX={c.startX} color={c.color} size={c.size} shape={c.shape} delay={c.delay} />)}
      </div>

      <BloomFlash active={bloomActive} />
      <CelebrateBanner active={bannerActive} />

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

        {/* OVERLAY: LOGO & RIBBON */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div ref={logoRef} style={{ textAlign: 'center', marginBottom: 44, userSelect: 'none' }}>
            <div style={{
              fontFamily: 'serif',
              fontSize: 'clamp(3rem, 7.5vw, 6rem)', fontWeight: 800, letterSpacing: '-0.02em',
              background: 'linear-gradient(140deg, #A87010 0%, #E8C547 30%, #FFF0A0 50%, #E8C547 70%, #C9A227 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 0 28px rgba(201,162,39,0.5))', lineHeight: 1,
            }}>My Project</div>
            <div style={{
              fontFamily: 'sans-serif', fontSize: 'clamp(0.68rem, 1.8vw, 0.95rem)', letterSpacing: '0.28em',
              color: 'rgba(200,170,100,0.65)', marginTop: 12, textTransform: 'uppercase',
            }}>The Ultimate Digital Experience</div>
          </div>

          <div ref={ribbonRef} style={{ position: 'relative', width: 'min(540px, 88vw)', pointerEvents: 'auto' }}>
            <div style={{ position: 'absolute', inset: -20, borderRadius: 80, background: 'radial-gradient(ellipse, rgba(201,162,39,0.22) 0%, transparent 68%)', animation: 'rpulse 2.4s ease-in-out infinite', pointerEvents: 'none' }} />
            
            <div
              onClick={isReady ? handleCut : undefined}
              style={{
                position: 'relative', background: 'linear-gradient(180deg, #E0B53A 0%, #C9A227 22%, #A87818 50%, #C9A227 78%, #E0B53A 100%)',
                borderRadius: 7, height: 58, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
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
              <div style={{ position: 'absolute', left: -26, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 26, height: 3, background: 'linear-gradient(90deg, transparent, #C9A227)', borderRadius: 2 }} />
                <div style={{ width: 10, height: 22, background: 'linear-gradient(180deg, #C9A227 0%, #7A5412 60%, #C9A227 100%)', borderRadius: '0 0 50% 50%', marginTop: -1 }} />
                <div style={{ width: 14, height: 6, background: 'radial-gradient(ellipse, #F0DC7A 0%, #C9A227 60%, transparent 100%)', borderRadius: '50%', marginTop: -2, opacity: 0.7 }} />
              </div>
              <div style={{ position: 'absolute', right: -26, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 26, height: 3, background: 'linear-gradient(90deg, #C9A227, transparent)', borderRadius: 2 }} />
                <div style={{ width: 10, height: 22, background: 'linear-gradient(180deg, #C9A227 0%, #7A5412 60%, #C9A227 100%)', borderRadius: '0 0 50% 50%', marginTop: -1 }} />
                <div style={{ width: 14, height: 6, background: 'radial-gradient(ellipse, #F0DC7A 0%, #C9A227 60%, transparent 100%)', borderRadius: '50%', marginTop: -2, opacity: 0.7 }} />
              </div>

              <span style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 'clamp(0.9rem, 2.4vw, 1.15rem)', letterSpacing: '0.14em', color: '#1C0A00', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                ✦ Cut to Unveil ✦
              </span>
              <div ref={scissorRef} style={{ color: '#1C0A00', opacity: 0.8, flexShrink: 0 }}><ScissorIcon /></div>
              
              <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'linear-gradient(108deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'rshine 3s ease-in-out infinite', pointerEvents: 'none' }} />
              
              <div ref={cutLineRef} style={{ position: 'absolute', top: '50%', left: '8%', right: '8%', height: 2, transform: 'translateY(-50%) scaleX(0)', transformOrigin: 'center', background: 'white', boxShadow: '0 0 12px rgba(255,255,255,1)', opacity: 0, pointerEvents: 'none', borderRadius: 2 }} />
            </div>
          </div>

          <div ref={promptRef} style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }}>
            <div style={{ width: 36, height: 1, background: 'rgba(201,162,39,0.45)' }} />
            <span style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.24em', color: '#C9A227', textTransform: 'uppercase' }}>Click ribbon · or press Enter</span>
            <div style={{ width: 36, height: 1, background: 'rgba(201,162,39,0.45)' }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rpulse { 0%,100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.07); } }
        @keyframes rshine { 0% { background-position: -120% 0; } 55% { background-position: 220% 0; } 100% { background-position: 220% 0; } }
      `}</style>
    </>
  );
}
```
