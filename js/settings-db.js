// js/settings-db.js (improved)
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
          // optional indexes
          store.createIndex("by_name", "name", { unique: false });
          store.createIndex("by_language", "language", { unique: false });
        }
      };
      req.onsuccess = (e) => {
        console.debug("SettingsDB: open OK");
        resolve(e.target.result);
      };
      req.onerror = (e) => {
        console.error("SettingsDB: open ERROR", e.target.error);
        reject(e.target.error);
      };
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
    const normalized = Object.assign({}, settings, {
      email: normalizeEmail(settings.email),
    });

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      const st = tx.objectStore(STORE_SETTINGS);
      const putReq = st.put(normalized);
      putReq.onsuccess = () => {
        console.debug("SettingsDB: saved", normalized.email);
        resolve(putReq.result);
      };
      putReq.onerror = (e) => {
        console.error("SettingsDB: save ERROR", e.target.error);
        reject(e.target.error);
      };
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
      req.onsuccess = (e) => {
        console.debug("SettingsDB: get", key, "->", e.target.result);
        resolve(e.target.result);
      };
      req.onerror = (e) => {
        console.error("SettingsDB: get ERROR", e.target.error);
        reject(e.target.error);
      };
    });
  }

  async function getAllSettings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readonly");
      const st = tx.objectStore(STORE_SETTINGS);
      const req = st.getAll();
      req.onsuccess = (e) => {
        resolve(e.target.result || []);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // bonus helpers
  async function deleteSettings(email) {
    const key = normalizeEmail(email);
    if (!key) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      tx.objectStore(STORE_SETTINGS).delete(key);
      tx.oncomplete = () => {
        console.debug("SettingsDB: deleted", key);
        resolve();
      };
      tx.onerror = (e) => {
        console.error("SettingsDB: delete ERROR", e);
        reject(e.target.error);
      };
    });
  }

  async function clearAllSettings() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      tx.objectStore(STORE_SETTINGS).clear();
      tx.oncomplete = () => {
        console.debug("SettingsDB: cleared all");
        resolve();
      };
      tx.onerror = (e) => {
        console.error("SettingsDB: clear ERROR", e);
        reject(e.target.error);
      };
    });
  }

  window.SettingsDB = {
    openDB,
    saveSettings,
    getSettings,
    getAllSettings,
    deleteSettings,
    clearAllSettings,
  };
})(window);
