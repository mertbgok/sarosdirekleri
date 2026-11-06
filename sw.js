// Sayfa ve uydu harita parçaları telefonda saklanır; sahada internetsiz açılır, kota harcamaz.
const SAYFA = "saros-pusula-v2";
const KARO = "saros-karo";  // sürüm değişince silinmez
const DOSYALAR = ["./", "index.html", "manifest.webmanifest", "ikon.png",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(SAYFA).then(c => Promise.all(DOSYALAR.map(u =>
    fetch(u, {mode: "cors"}).then(r => r.ok && c.put(u, r)).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SAYFA && x !== KARO).map(x => caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.hostname === "server.arcgisonline.com") {
    // uydu parçası: önce telefondakine bak; "?o=1" ise internete hiç çıkma
    const anahtar = url.origin + url.pathname;
    e.respondWith(caches.open(KARO).then(async c => {
      const r = await c.match(anahtar);
      if (r) return r;
      if (url.searchParams.get("o") === "1") return new Response("", {status: 404});
      const n = await fetch(anahtar, {mode: "cors"});
      if (n.ok) c.put(anahtar, n.clone());
      return n;
    }).catch(() => new Response("", {status: 404})));
    return;
  }
  if (url.hostname === "cdnjs.cloudflare.com") {
    e.respondWith(caches.match(e.request.url).then(r => r || fetch(e.request).then(n => {
      const k = n.clone(); caches.open(SAYFA).then(c => c.put(e.request.url, k)); return n;
    })));
    return;
  }
  // kendi dosyalarımız: internet varsa tazesi, yoksa saklanan
  e.respondWith(fetch(e.request).then(r => {
    const kopya = r.clone();
    caches.open(SAYFA).then(c => c.put(e.request, kopya));
    return r;
  }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match("index.html"))));
});
