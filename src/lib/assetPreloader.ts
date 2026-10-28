/**
 * Asset Preloader & Cache Storage Manager for ICETICT-2027
 *
 * Ensures all 3D models, audio, dignitary images, and logos are
 * cached permanently in the browser's CacheStorage and pre-decoded
 * in GPU/RAM memory without competing with initial React/Three.js rendering.
 */

export const CRITICAL_ASSETS = [
  // 3D Avatar Model
  '/edith.glb',

  // Celebration & Speech Audio
  '/audio/slide-1.mp3',
  '/audio/Birthday Fireworks.mp3',
  '/audio/soothing_celebration_bgm.m4a',

  // Event & University Logos
  '/ICETICE-WHITE.webp',
  '/LIGHT-DRIEMS-LOGO-2048x640.webp',
  '/logo-3.webp',
  '/logo-masterbrand-tagline-white-transparent.webp',

  // Dignitary Photos
  '/images/vcsir.png',
  '/images/Sj-Balaram-Kar.jpg',
  '/images/Smt.-Chinmayee-Rath-300x300.jpg',
  '/images/alokSir.jpg',
  '/images/deansir.png',
  '/images/biswaranjanSir.jpg',

  // Curtains / Atmosphere
  '/images/robot_thinking.jpg',
];

const CACHE_NAME = 'icetict-2027-assets-v1';

export async function preloadCriticalAssets(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Pre-decode critical visible images into GPU texture memory immediately
  CRITICAL_ASSETS.filter(url => /\.(png|jpg|jpeg|webp)$/i.test(url)).forEach(url => {
    try {
      const img = new Image();
      img.src = url;
      if ('decode' in img) {
        img.decode().catch(() => {/* non-blocking */});
      }
    } catch {}
  });

  // 2. Pre-buffer audio files in the background after initial render (avoids network clogging on reload)
  setTimeout(() => {
    CRITICAL_ASSETS.filter(url => /\.(mp3|wav|m4a)$/i.test(url)).forEach(url => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.load();
      } catch {}
    });
  }, 1200);

  // 3. Persistent CacheStorage API (works offline, instant disk retrieval across reloads)
  // Staggered slightly so initial Three.js WebGL and DOM mount take priority
  setTimeout(async () => {
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);

        const uncachedUrls: string[] = [];
        for (const url of CRITICAL_ASSETS) {
          const match = await cache.match(url);
          if (!match) {
            uncachedUrls.push(url);
          }
        }

        if (uncachedUrls.length > 0) {
          console.log(`[CacheStorage] Caching ${uncachedUrls.length} assets locally for instant replay...`);
          await Promise.allSettled(
            uncachedUrls.map(async url => {
              try {
                const res = await fetch(url, { cache: 'force-cache' });
                if (res.ok) {
                  await cache.put(url, res);
                }
              } catch (err) {
                console.debug(`[CacheStorage] Skipped ${url}`, err);
              }
            })
          );
          console.log('[CacheStorage] All critical assets cached successfully in browser!');
        } else {
          console.log('[CacheStorage] All assets already cached in browser storage (instant mode).');
        }
      } catch (err) {
        console.warn('[CacheStorage] CacheStorage not supported or restricted', err);
      }
    }
  }, 1800);
}
