const CACHE_NAME = "cadenero-v3";
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
    // Tomar control de todas las pestañas inmediatamente
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Solo manejar peticiones GET
    if (event.request.method !== "GET") return;

    // Supabase: solo red
    if (url.hostname.includes("supabase")) return;

    // Vite dev server: solo red
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return;

    // Archivos con hash (JS, CSS de Vite): network first, fallback cache
    // Esto evita servir archivos viejos con hashes incorrectos
    const esAssetConHash = url.pathname.match(
        /\/assets\/.*\.[a-f0-9]{8,}\.(js|css)$/
    );

    if (esAssetConHash) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // HTML (navegación): network first, fallback cache
    if (
        event.request.mode === "navigate" ||
        url.pathname === "/" ||
        url.pathname === "/index.html"
    ) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match("/index.html"))
        );
        return;
    }

    // Otros estáticos: cache first, fallback network
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
            });
        })
    );
});
