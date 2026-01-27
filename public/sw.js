// Minimal Service Worker for PWA install capability
// We use a Network-Only strategy to ensure dashboard data is always fresh.

const CACHE_NAME = 'temperview-dashboard-v1';

self.addEventListener('install', (event) => {
    // Skip waiting to ensure the SW activates immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all clients immediately
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass through all requests to the network.
    // We do NOT want to cache API responses or the app shell aggressively 
    // without a more complex strategy, as this is a real-time dashboard.
    event.respondWith(fetch(event.request));
});
