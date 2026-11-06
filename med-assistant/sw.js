/* Service worker: sayt fayllarini keshlaydi, internetsiz ishlash uchun */
const CACHE = 'medasistant-v1';
const FILES = [
  './', 'index.html', 'manifest.json', 'icon.svg', 'css/style.css',
  'js/db.js', 'js/seed.js', 'js/ui.js', 'js/audio.js', 'js/import.js', 'js/study.js',
  'js/games.js', 'js/books.js', 'js/anamnez.js', 'js/admin.js', 'js/app.js',
  'vendor/mammoth.browser.min.js', 'vendor/xlsx.full.min.js', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // AI so'rovlari to'g'ridan-to'g'ri internetga
  // Avval tarmoq (yangilanishlar uchun), bo'lmasa kesh
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
