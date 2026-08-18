// Minimal service worker — required by browsers (Chrome/Edge/Android) before
// they'll offer to install the app. Deliberately does no caching: this app
// is backed by live Firestore data, so caching responses would risk serving
// stale choir data or a stale app version after a deploy.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
