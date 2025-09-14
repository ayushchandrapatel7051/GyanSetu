// js/db.js
// Lightweight wrapper for lesson progress using indexedDB
(function (window) {
  const DB_NAME = "gyansetu-lessons";
  const DB_VERSION = 1;
  const STORE_PROGRESS = "progress";

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_PROGRESS)) {
          const store = db.createObjectStore(STORE_PROGRESS, { keyPath: "id" });
          // index by email and lessonId for queries
          store.createIndex("by_email", "email", { unique: false });
          store.createIndex("by_lesson", "lessonId", { unique: false });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  async function saveProgress(progress) {
    /*
      progress = {
        id: "email__lessonId" or "anon__lessonId",
        email: "a@b.c" or null,
        lessonId: "math-6-fractions",
        completed: true|false,
        percent: number 0-100,
        timeSpentSeconds: number,
        lastViewedAt: timestamp
      }
    */
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, "readwrite");
      const st = tx.objectStore(STORE_PROGRESS);
      const putReq = st.put(progress);
      putReq.onsuccess = () => resolve(putReq.result);
      putReq.onerror = (e) => reject(e.target.error);
    });
  }

  async function getProgressById(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, "readonly");
      const st = tx.objectStore(STORE_PROGRESS);
      const req = st.get(id);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async function getProgress(email, lessonId) {
    // constructs id as email__lessonId (email may be null)
    const id = (email || "anon") + "__" + lessonId;
    return getProgressById(id);
  }

  async function getAllProgressForEmail(email) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PROGRESS, "readonly");
      const st = tx.objectStore(STORE_PROGRESS);
      const idx = st.index("by_email");
      const req = idx.getAll(email);
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  window.LessonDB = {
    openDB,
    saveProgress,
    getProgress,
    getAllProgressForEmail,
    getProgressById,
  };
})(window);
