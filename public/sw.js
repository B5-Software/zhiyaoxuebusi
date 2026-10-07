const CACHE = 'shiguang-campus-v2.3.0';
// Works both at the domain root and under a repository sub-path (GitHub Pages project sites).
const BASE = new URL(self.registration.scope).pathname;
const ART = ['campus', 'student', 'companion', 'teacher', 'mother', 'friend', 'classroom', 'home', 'city', 'graduation'];
const MAP_ART = ['world-map', 'library', 'laboratory', 'arts', 'park', 'market', 'university', 'zhixia', 'xinghe', 'tangtang', 'cloud-frame'];
const PRECACHE = [BASE, `${BASE}favicon.svg`, `${BASE}manifest.webmanifest`, ...ART.map(name => `${BASE}images/${name}.jpg`), ...MAP_ART.map(name => `${BASE}images/${name}.webp`)];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    const page = await cache.match(BASE);
    if (page) {
      const html = await page.text();
      const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
        .map(match => new URL(match[1], self.location.origin + BASE))
        .filter(url => url.origin === self.location.origin && /\.(?:js|css|woff2?)(?:\?|$)/.test(url.href))
        .map(url => url.href);
      await cache.addAll(assets);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('shiguang-campus-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) { const cache = await caches.open(CACHE); await cache.put(BASE, response.clone()); }
        return response;
      } catch {
        return await caches.match(BASE) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()); }
    return response;
  })());
});
