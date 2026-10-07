const CACHE = 'shiguang-campus-v2.8.1';
const BASE = new URL(self.registration.scope).pathname;
const ART = ['campus', 'student', 'companion', 'teacher', 'mother', 'friend', 'classroom', 'home', 'city', 'graduation'];
const MAP_ART = ['world-map', 'library', 'laboratory', 'arts', 'park', 'market', 'university', 'zhixia', 'xinghe', 'tangtang', 'cloud-frame', 'romance-moments', 'romance-men-moments'];
const SHELL = [BASE, `${BASE}images/loading-campus.webp`, `${BASE}favicon.svg`, `${BASE}manifest.webmanifest`];
// These same-origin files are static. Development servers may add Vary: Origin,
// while module and prefetch requests send different Origin headers.
const STATIC_MATCH = { ignoreVary: true };
let warming;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE); await cache.addAll(SHELL);
    const html = await (await cache.match(BASE, STATIC_MATCH)).text();
    const bootstrap = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => new URL(match[1], self.location.origin + BASE)).filter(url => url.origin === self.location.origin && /\.js$/.test(url.pathname));
    await cache.addAll(bootstrap.map(url => url.href)); await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});
async function warmCache() {
  const cache = await caches.open(CACHE), manifest = await fetch(`${BASE}cache-manifest.json`, { cache: 'no-cache' });
  if (!manifest.ok) return;
  const files = await manifest.clone().json(); await cache.put(`${BASE}cache-manifest.json`, manifest);
  const queue = [...files.filter(name => /\.(?:js|css)$/.test(name)), ...ART.map(name => `images/${name}.jpg`), ...MAP_ART.map(name => `images/${name}.webp`), ...files.filter(name => /\.woff2?$/.test(name))].map(name => `${BASE}${name}`);
  let cursor = 0;
  let complete = true;
  await Promise.all([0, 1].map(async () => {
    while (cursor < queue.length) {
      const url = queue[cursor++]; if (await cache.match(url, STATIC_MATCH)) continue;
      try { const response = await fetch(url, { priority: 'low' }); if (response.ok) await cache.put(url, response); else complete = false; } catch { complete = false; }
    }
  }));
  if (complete) {
    await cache.put(`${BASE}offline-ready`, new Response(JSON.stringify({ cache: CACHE }), { headers: { 'Content-Type': 'application/json' } }));
    const keys = await caches.keys(); await Promise.all(keys.filter(key => key.startsWith('shiguang-campus-') && key !== CACHE).map(key => caches.delete(key)));
  }
}
self.addEventListener('message', event => {
  if (event.data?.type === 'WARM_CACHE') {
    if (!warming) warming = warmCache().catch(() => {}).finally(() => { warming = undefined; });
    event.waitUntil(warming);
  }
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const refresh = async () => {
    const response = await fetch(request);
    if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request.mode === 'navigate' ? BASE : request, response.clone()); }
    return response;
  };
  if (request.mode === 'navigate') {
    const update = refresh(); event.waitUntil(update.catch(() => {}));
    event.respondWith((async () => await (await caches.open(CACHE)).match(BASE, STATIC_MATCH) || await update.catch(() => Response.error()))());
  } else event.respondWith((async () => await (await caches.open(CACHE)).match(request, STATIC_MATCH) || await caches.match(request, STATIC_MATCH) || await refresh())());
});
