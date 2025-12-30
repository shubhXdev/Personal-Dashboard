const CACHE_NAME = 'midnight-spark-v1';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'logo.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    clients.claim();
});

// Cache-falling-back-to-network strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Push handler placeholder
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : { title: 'Reminder', body: 'Time for your habit' };
    const options = {
        body: data.body,
        icon: 'logo.png',
        badge: 'logo.png',
        data: data
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('./'));
});
