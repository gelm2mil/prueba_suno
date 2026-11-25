const CACHE = "mx-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

let offlineAudio = true;
self.addEventListener("message", e => { if(e.data?.type === "offline") offlineAudio = e.data.on; });

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);

  // audio: cache-first
  if(/\.(mp3|m4a|ogg|wav|flac|aac|opus)(\?|$)/i.test(url.pathname)){
    if(!offlineAudio) return;
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if(hit) return hit;
      const res = await fetch(req);
      if(res.ok && res.status === 200) c.put(req, res.clone());
      return res;
    }).catch(() => fetch(req)));
    return;
  }

  // json: network-first con copia
  if(/\.json(\?|$)/i.test(url.pathname)){
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req)));
    return;
  }

  // resto: cache-first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
