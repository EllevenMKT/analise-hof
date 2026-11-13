// Service worker: guarda o app inteiro no aparelho para funcionar offline.
const VERSION = 'hof-v5';
const APP = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./maskable-512.png','./apple-touch-icon.png','./logo-mark.png','./logo-lockup.png',
  './vision_bundle.mjs','./vision_wasm_internal.js','./vision_wasm_internal.wasm','./face_model.js','./seg_model_a.js','./seg_model_b.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // fontes do Google: guarda a primeira cópia para uso offline
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => { const hit = await c.match(req); if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (_) { return hit || Response.error(); } }));
    return;
  }
  if (url.origin !== location.origin) return;
  // página: rede primeiro (pega atualizações), cache se offline. Demais arquivos: cache primeiro.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put('./index.html', r.clone())); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(hit => hit || fetch(req)));
});
