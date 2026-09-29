const CACHE_NAME = "cadenero-v1";
const SHELL_URLS = [
    "/",
    "/index.html",
    "/favicon.svg",
    "/icons.svg",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    // Supabase requests: network only, no cache
    if (url.hostname.includes("supabase")) return;

    // Vite dev server requests: network only
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

    // Static assets: cache first, then network
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(() => {
                // Offline fallback for navigation
                if (event.request.mode === "navigate") {
                    return caches.match("/index.html");
                }
            });
        })
    );
});
