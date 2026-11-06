// İlk açılıştan sonra sayfayı telefonda saklar; sahada internetsiz açılır.
const AD = "saros-pusula-v1";
const DOSYALAR = ["./", "index.html", "manifest.webmanifest", "ikon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(AD).then(c => c.addAll(DOSYALAR))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== AD).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  // önce internetten taze olanı dene, olmazsa saklananı ver
  e.respondWith(fetch(e.request).then(r => {
    const kopya = r.clone();
    caches.open(AD).then(c => c.put(e.request, kopya));
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
});
