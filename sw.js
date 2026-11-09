/* Service worker: bikin aplikasi bisa dibuka tanpa internet.
   Aplikasi: RaeZhy Kasir Pro.
   File ini TIDAK perlu diedit saat aplikasi diperbarui. Cukup ganti index.html
   dan upload ulang: versi baru diunduh otomatis di belakang layar setiap aplikasi
   dibuka, lalu tampil pada pembukaan berikutnya. */
const CACHE = 'raezhy-kasir-pro-v3';
const FILES = ['./', './index.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Tampilkan dari cache dulu (cepat, tanpa internet), sambil mengambil versi terbaru
   dari server di belakang layar untuk dipakai pada pembukaan berikutnya. */
async function segar(e, key, url) {
  const c = await caches.open(CACHE);
  const hit = await c.match(key, { ignoreSearch: true });
  const net = fetch(url, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok) c.put(key, res.clone());
    return res;
  }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || new Response('Tidak ada koneksi.', { status: 503 });
}

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;      /* wa.me dan situs lain tidak disentuh */
  if (r.mode === 'navigate') e.respondWith(segar(e, './index.html', './index.html'));
  else e.respondWith(segar(e, r, r.url));
});
