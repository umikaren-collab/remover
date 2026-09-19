// 車両移動ツール - Service Worker
// バージョンを上げる（v1→v2…）たびに、スマホ側は自動で新しいファイルを取りに行きます。
// ここを書き換えずに index.html だけ差し替えても更新は反映されないので注意。
const CACHE_NAME = 'shsac-vehicle-tool-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 地図タイル・OSRMルート計算など外部通信には一切手を出さない（そのまま素通し）
  if (url.origin !== self.location.origin) return;

  // アプリ本体はネットワーク優先。オフライン/読込失敗時だけキャッシュを使う。
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
