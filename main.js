// main.js (safe merge version)
// Include this on pages that require authentication (index.html, quiz pages, etc.)
// It checks IndexedDB for a user who is currently logged in. If none, redirect to auth.html

(async () => {
  const DB_NAME = "gyansetu-auth";
  const DB_VERSION = 1;
  const STORE_USERS = "users";

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const store = db.createObjectStore(STORE_USERS, { keyPath: "email" });
          store.createIndex("phone", "phone", { unique: false });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function getAllUsers() {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USERS, "readonly");
        const store = tx.objectStore(STORE_USERS);
        const req = store.getAll();
        req.onsuccess = (e) => resolve(e.target.result || []);
        req.onerror = (e) => reject(e.target.error);
      });
    });
  }

  function getCurrentUserFromLocal() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function redirectToAuth() {
    if (location.pathname.endsWith("auth.html")) return;
    location.href = "../templates/auth.html";
  }

  // normalize helper (same logic as SettingsDB.normalizeEmail)
  function normalizeEmailLocal(email){
    if(!email) return email;
    return String(email).trim().toLowerCase();
  }

  // merge session objects: keep more recent updatedAt values
  function mergeSession(existing, fromAuthDb) {
    // canonical session shape we want in localStorage:
    // { email, name, profile, avatar, grade, language, phone, updatedAt }
    const now = Date.now();
    const a = existing || {};
    const b = fromAuthDb || {};

    // normalize email if present
    if (a.email) a.email = normalizeEmailLocal(a.email);
    if (b.email) b.email = normalizeEmailLocal(b.email);

    const aTime = a.updatedAt ? Number(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Number(b.updatedAt) : 0;

    // strategy: build merged object from fields present, prefer the newer object overall
    const newer = bTime > aTime ? b : a;
    const older = bTime > aTime ? a : b;

    const merged = {
      email: newer.email || older.email || "",
      name: newer.name || older.name || (newer.firstName ? `${newer.firstName} ${newer.lastName || ""}`.trim() : "Unknown"),
      profile: newer.profile || older.profile || "",
      avatar: newer.avatar || older.avatar || "../assets/img/avatar.jpg",
      grade: newer.grade || older.grade || "",
      language: newer.language || older.language || "en",
      phone: newer.phone || older.phone || "",
      // keep highest timestamp
      updatedAt: Math.max(aTime, bTime, now)
    };

    return merged;
  }

  try {
    // 1) quick localStorage check
    const localUser = getCurrentUserFromLocal();
    if (localUser && localUser.email) {
      // verify exists in IndexedDB and still flagged loggedIn
      const users = await getAllUsers();
      const normalizedLocalEmail = normalizeEmailLocal(localUser.email);
      const user = users.find((u) => normalizeEmailLocal(u.email) === normalizedLocalEmail);

      if (user && user.isLoggedIn) {
        // merge carefully: mergeSession keeps newest updatedAt and fills missing fields
        const merged = mergeSession(localUser, user);
        try { localStorage.setItem("gyan_current_user", JSON.stringify(merged)); } catch(e) {}
        window.currentUser = user;
        console.info("User loaded from localStorage + DB (merged):", merged.email);
        return;
      }
    }

    // 2) scan IndexedDB for any user with isLoggedIn === true
    const users = await getAllUsers();
    const logged = users.find((u) => u.isLoggedIn === true);
    if (logged) {
      // do not blindly overwrite localStorage. Merge with existing session if any.
      const existing = getCurrentUserFromLocal();
      const merged = mergeSession(existing, logged);

      try {
        localStorage.setItem("gyan_current_user", JSON.stringify(merged));
      } catch (e) {
        // ignore localStorage failures
      }
      window.currentUser = logged;
      console.info("User loaded from IndexedDB (merged into session):", merged.email);
      return;
    }

    // 3) nothing found -> redirect to auth
    redirectToAuth();
  } catch (err) {
    console.error("Auth check failed", err);
    redirectToAuth();
  }
})();
