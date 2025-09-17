/* service-worker.js
   Workbox CDN version tailored to Gyan Setu repository structure.
   - Precaches app shell, templates, data, CSS/JS, and images found in assets/img.
   - Runtime caching: CacheFirst for images, StaleWhileRevalidate for static resources,
     NetworkFirst for navigations and data endpoints.
   - Offline navigation fallback uses templates/offline.html
*/

/* eslint-disable no-undef */
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

if (!self.workbox) {
  console.error("Workbox failed to load");
} else {
  workbox.setConfig({ debug: false });
  const precacheManifest = [
    { url: "/", revision: "index" },
    { url: "/index.html", revision: "index" },

    // main scripts and entry points
    { url: "/main.js", revision: "mainjs" },

    // all JS in /js/
    { url: "/js/auth.js", revision: "authjs" },
    { url: "/js/db.js", revision: "dbjs" },
    { url: "/js/lesson.js", revision: "lessonjs" },
    { url: "/js/lessons.js", revision: "lessonsjs" },
    { url: "/js/nav.js", revision: "navjs" },
    { url: "/js/profile-widget.js", revision: "profilewidgetjs" },
    { url: "/js/quiz.js", revision: "quizjs" },
    { url: "/js/script.js", revision: "scriptjs" },
    { url: "/js/settings-db.js", revision: "settingsdbjs" },

    // CSS
    { url: "/css/style.css", revision: "stylecss" },
    { url: "/css/lesson.css", revision: "lessoncss" },
    { url: "/css/lessons.css", revision: "lessonscss" },
    { url: "/css/quiz.css", revision: "quizcss" },

    // templates (use templates/offline.html as fallback)
    { url: "/templates/home.html", revision: "home-tpl" },
    { url: "/templates/lesson.html", revision: "lesson-tpl" },
    { url: "/templates/lessons.html", revision: "lessons-tpl" },
    { url: "/templates/offline.html", revision: "offline-tpl" },
    { url: "/templates/quiz.html", revision: "quiz-tpl" },
    { url: "/templates/games.html", revision: "games-tpl" },
    { url: "/templates/progress.html", revision: "progress-tpl" },
    { url: "/templates/rewards.html", revision: "rewards-tpl" },
    { url: "/templates/settings.html", revision: "settings-tpl" },
    { url: "/templates/auth.html", revision: "auth-tpl" },

    // data JSON files
    { url: "/data/lessons.json", revision: "lessons-json" },
    { url: "/data/maths.json", revision: "maths-json" },
    { url: "/data/questions.json", revision: "questions-json" },
    { url: "/data/science.json", revision: "science-json" },

    // a handful of image assets present in assets/img used across the app
    { url: "/assets/img/logo1.png", revision: "logo1" },
    { url: "/assets/img/avatar.jpg", revision: "avatar" },
    { url: "/assets/img/math-quiz.png", revision: "mathquiz" },
    { url: "/assets/img/motion.gif", revision: "motion" },
    { url: "/assets/img/photosynthesis.gif", revision: "photosynthesis" },
    { url: "/assets/img/puzzle.png", revision: "puzzle" },
    // Generic catch-all: we'll also runtime cache other images under /assets/img
  ];

  // Precache & route
  workbox.precaching.precacheAndRoute(precacheManifest, {
    // ignore all URL parameters when matching precached entries
    ignoreURLParametersMatching: [/.*/],
  });

  // --- Images: CacheFirst for /assets/img/* and any image request
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === "image" ||
      url.pathname.startsWith("/assets/img/") ||
      url.pathname.includes("/img/"),
    new workbox.strategies.CacheFirst({
      cacheName: "gyansetu-images-v1",
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 400,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
        }),
      ],
    })
  );

  // --- CSS & JS: StaleWhileRevalidate for quick loads and background refresh
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === "style" || request.destination === "script",
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: "gyansetu-static-v1",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );

  // --- Fonts: CacheFirst with long expiration
  workbox.routing.registerRoute(
    ({ request }) => request.destination === "font",
    new workbox.strategies.CacheFirst({
      cacheName: "gyansetu-fonts-v1",
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
      ],
    })
  );

  // --- Data JSON: NetworkFirst so we get fresh data when online, fallback to cache
  workbox.routing.registerRoute(
    ({ url }) =>
      url.pathname.startsWith("/data/") || url.pathname.endsWith(".json"),
    new workbox.strategies.NetworkFirst({
      cacheName: "gyansetu-data-v1",
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    })
  );

  // --- API route (if you call /api/*) - NetworkFirst with short timeout
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new workbox.strategies.NetworkFirst({
      cacheName: "gyansetu-api-v1",
      networkTimeoutSeconds: 6,
    })
  );

  // --- Navigation requests: NetworkFirst but fallback to offline template if offline
  const OFFLINE_HTML = "/templates/offline.html";
  workbox.routing.registerRoute(
    ({ request }) => request.mode === "navigate",
    async ({ event }) => {
      try {
        return await workbox.strategies
          .NetworkFirst({
            cacheName: "gyansetu-pages-v1",
            networkTimeoutSeconds: 5,
          })
          .handle({ event });
      } catch (err) {
        return caches.match(OFFLINE_HTML, { ignoreSearch: true });
      }
    }
  );

  // --- Catch handler (fallbacks)
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === "image") {
      // fallback image (use avatar or placeholder if missing)
      return caches.match("/assets/img/avatar.jpg");
    }
    if (event.request.destination === "document") {
      return caches.match(OFFLINE_HTML);
    }
    return Response.error();
  });

  // --- Allow immediate activation of updated service worker
  self.addEventListener("message", (event) => {
    if (event?.data?.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
  });
}
