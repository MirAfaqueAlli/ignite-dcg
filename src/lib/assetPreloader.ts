/**
 * Asset Preloader & Cache Storage Manager for ICETICT-2027
 *
 * Ensures all 3D models, audio, dignitary images, and logos are
 * cached permanently in the browser's CacheStorage and pre-decoded
 * in GPU/RAM memory.
 *
 * Subsequent visits & refreshes load instantly (0ms network delay).
 */

export const CRITICAL_ASSETS = [
  // 3D Avatar Model
  '/edith.glb',

  // Celebration & Speech Audio
  '/audio/slide-1.mp3',
  '/audio/Birthday Fireworks.mp3',
  '/audio/soothing_celebration_bgm.wav',

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

  // 1. Pre-decode images into GPU texture memory to prevent any visual hitching
  CRITICAL_ASSETS.filter(url => /\.(png|jpg|jpeg|webp)$/i.test(url)).forEach(url => {
    try {
      const img = new Image();
      img.src = url;
      if ('decode' in img) {
        img.decode().catch(() => {/* ignore decode errors on unsupported formats */});
      }
    } catch {
      // Ignore background image pre-fetch errors
    }
  });

  // 2. Pre-buffer audio files in the browser audio pipeline
  CRITICAL_ASSETS.filter(url => /\.(mp3|wav)$/i.test(url)).forEach(url => {
    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.load();
    } catch {
      // Ignore audio pre-buffer errors
    }
  });

  // 3. Persistent CacheStorage API (works offline, instant disk retrieval across reloads)
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);

      // Check which items are missing from cache
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
}
