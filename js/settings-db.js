// js/settings-db.js
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
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  async function saveSettings(settings) {
    /*
      settings = {
        email: "user@example.com",   // primary key
        name: "John Doe",
        language: "en",
        grade: "8",
        profile: "Some profile text",
        avatar: "avatar.jpg",
        badges: ["starter", "math_wiz"],
        xp: 1200
      }
    */
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readwrite");
      const st = tx.objectStore(STORE_SETTINGS);
      const putReq = st.put(settings);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = (e) => reject(e.target.error);
    });
  }

  async function getSettings(email) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SETTINGS, "readonly");
      const st = tx.objectStore(STORE_SETTINGS);
      const req = st.get(email);
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

  window.SettingsDB = {
    openDB,
    saveSettings,
    getSettings,
    getAllSettings,
  };
})(window);
