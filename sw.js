/* Service worker.
   Network-first for app code so a deploy lands on the next load
   (blipwork's fix for "old version still showing"), cache-first
   for fonts and images.

   ⚠ BUMP THIS VERSION ON EVERY SHIPPABLE CHANGE. */
const CACHE = "gq-v6";

const SHELL = [
  "./", "./index.html", "./css/styles.css", "./manifest.json",
  "./js/app.js", "./js/play.js", "./js/screens.js", "./js/ui.js",
  "./js/check.js", "./js/i18n.js", "./js/funclib.js", "./js/backend.js",
  "./js/supabase-config.js",
  "./js/engine/function-graph.js", "./js/engine/interactive.js",
  "./js/engine/slider.js",
  "./js/quests/index.js", "./js/quests/_shared.js", "./js/quests/_graphs.js",
  "./js/quests/_intervals.js",
  "./js/quests/q1-discover.js", "./js/quests/q1b-discover2.js",
  "./js/quests/qB-recognize.js", "./js/quests/q2-point.js",
  "./js/quests/q3-region.js", "./js/quests/q5-signs.js",
  "./js/quests/q6-compare.js", "./js/quests/q7-exam.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isAsset = /\.(png|jpg|svg|woff2?)$/.test(url.pathname) || url.hostname.includes("gstatic");

  if (isAsset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    })));
    return;
  }
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
