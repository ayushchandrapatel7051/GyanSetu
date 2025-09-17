// js/settings-db.js (improved with updatedAt + preserve xp/badges)
(function (window) {
  const DB_NAME = "gyansetu-settings";
  const DB_VERSION = 1;
  const STORE_SETTINGS = "settings";

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          const store = db.createObjectStore(STORE_SETTINGS, {
            keyPath: "email",
          });
          store.createIndex("by_name", "name", { unique: false });
          store.createIndex("by_language", "language", { unique: false });
          store.createIndex("by_updatedAt", "updatedAt", { unique: false });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  function normalizeEmail(email) {
    if (!email) return email;
    return String(email).trim().toLowerCase();
  }

  // Save settings - robust merge: preserve xp/badges and return the saved record
  async function saveSettings(settings) {
    if (!settings || !settings.email) {
      return Promise.reject(new Error("saveSettings: settings.email required"));
    }
    const normalizedEmail = normalizeEmail(settings.email);
    const now = Date.now();

    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      const st = tx.objectStore(STORE_SETTINGS);

      // Fetch existing record to preserve fields
      const getReq = st.get(normalizedEmail);
      getReq.onsuccess = () => {
        const existing = getReq.result || {};

        // Start from existing, then overlay incoming settings
        const merged = Object.assign({}, existing, settings);

        // Preserve xp unless explicitly provided. Ensure a numeric xp exists.
        if (settings.xp == null && existing.xp != null) {
          merged.xp = Number(existing.xp) || 0;
        } else {
          merged.xp = merged.xp != null ? Number(merged.xp) || 0 : 0;
        }

        // Preserve badges unless explicitly provided. Ensure an array exists.
        if (settings.badges == null && existing.badges != null) {
          merged.badges = Array.isArray(existing.badges)
            ? existing.badges.slice()
            : [];
        } else {
          merged.badges = Array.isArray(merged.badges) ? merged.badges : [];
        }

        merged.email = normalizedEmail;
        merged.updatedAt =
          settings.updatedAt && Number(settings.updatedAt) > 0
            ? Number(settings.updatedAt)
            : now;

        const putReq = st.put(merged);
        // IMPORTANT: resolve with the actual merged object so callers can write it to localStorage
        putReq.onsuccess = () => resolve(merged);
        putReq.onerror = (e) => reject(e.target.error);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  async function getSettings(email) {
    const key = normalizeEmail(email);
    if (!key) return null;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readonly");
      const st = tx.objectStore(STORE_SETTINGS);
      const req = st.get(key);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getAllSettings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readonly");
      const st = tx.objectStore(STORE_SETTINGS);
      const req = st.getAll();
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function deleteSettings(email) {
    const key = normalizeEmail(email);
    if (!key) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      tx.objectStore(STORE_SETTINGS).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  async function clearAllSettings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      tx.objectStore(STORE_SETTINGS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }

  window.SettingsDB = {
    openDB,
    saveSettings,
    getSettings,
    getAllSettings,
    deleteSettings,
    clearAllSettings,
    normalizeEmail, // exported so UI code can reuse same normalization
  };
})(window);
