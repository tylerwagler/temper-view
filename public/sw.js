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
    // Let the browser handle all requests natively.
    // Calling event.respondWith(fetch(...)) breaks streaming responses
    // (e.g. SSE/chunked transfer from LLM endpoints) on concurrent requests.
    // By not calling event.respondWith(), the browser uses its default fetch.
    return;
});
