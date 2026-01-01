const CACHE_NAME = 'swapit-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/about.html',
  '/privacy.html',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png',
  '/splash-1170x2532.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
