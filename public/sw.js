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
  // Cross-origin requests (notably authenticated Firebase Storage media)
  // must bypass the service worker. Proxying them here can leave streamed
  // responses pending indefinitely in Chromium.
  if (new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(fetch(event.request));
  }
});
