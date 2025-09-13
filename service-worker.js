importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

if (workbox) {
  workbox.precaching.precacheAndRoute([
    { url: "/", revision: "v1" },
    { url: "/index.html", revision: "v1" },
    { url: "/offline.html", revision: "v1" },
    { url: "/main.js", revision: "abcd1234" },
    { url: "css/styles.css", revision: "abcd1234" },
  ]);

  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    new workbox.strategies.NetworkFirst({
      cacheName: "pages-cache",
      plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 50 })],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === "image",
    new workbox.strategies.CacheFirst({
      cacheName: "images-cache",
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === "font",
    new workbox.strategies.CacheFirst({
      cacheName: "fonts-cache",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new workbox.strategies.NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    })
  );

  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin(
    "post-queue",
    {
      maxRetentionTime: 24 * 60,
    }
  );

  workbox.routing.registerRoute(
    /\/api\/.*\/?/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin],
    }),
    "POST"
  );

  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
  });
} else {
  console.error("Workbox failed to load");
}
