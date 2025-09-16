// js/settings-db.js (improved with updatedAt + exported normalize)
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

  async function saveSettings(settings) {
    if (!settings || !settings.email) {
      return Promise.reject(new Error("saveSettings: settings.email required"));
    }
    const normalizedEmail = normalizeEmail(settings.email);
    // ensure updatedAt for conflict resolution
    const now = Date.now();
    const normalized = Object.assign({}, settings, {
      email: normalizedEmail,
      updatedAt: settings.updatedAt && Number(settings.updatedAt) > 0 ? Number(settings.updatedAt) : now,
    });

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      const st = tx.objectStore(STORE_SETTINGS);
      const putReq = st.put(normalized);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = (e) => reject(e.target.error);
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
