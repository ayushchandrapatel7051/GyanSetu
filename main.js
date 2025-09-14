// main.js
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

  // get all users (then we will find the one with isLoggedIn === true)
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

  // If there is a currently logged-in user in localStorage - prefer that (fast)
  function getCurrentUserFromLocal() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Redirect helper
  function redirectToAuth() {
    // If already on auth page, do nothing
    if (location.pathname.endsWith("auth.html")) return;
    location.href = "../templates/auth.html";
  }

  try {
    // 1) quick localStorage check
    const localUser = getCurrentUserFromLocal();
    if (localUser && localUser.email) {
      // verify exists in IndexedDB and still flagged loggedIn
      const users = await getAllUsers();
      const user = users.find((u) => u.email === localUser.email);
      if (user && user.isLoggedIn) {
        // success: put on window for other scripts to use
        window.currentUser = user;
        console.info("User loaded from localStorage + DB:", user.email);
        return;
      }
    }

    // 2) scan IndexedDB for any user with isLoggedIn === true
    const users = await getAllUsers();
    const logged = users.find((u) => u.isLoggedIn === true);
    if (logged) {
      // set localStorage for quick future access
      try {
        localStorage.setItem(
          "gyan_current_user",
          JSON.stringify({
            email: logged.email,
            firstName: logged.firstName,
            lastName: logged.lastName,
            grade: logged.grade,
            language: logged.language,
            phone: logged.phone,
          })
        );
      } catch (e) {
        // ignore localStorage failures
      }
      window.currentUser = logged;
      console.info("User loaded from IndexedDB:", logged.email);
      return;
    }

    // 3) nothing found -> redirect to auth
    redirectToAuth();
  } catch (err) {
    console.error("Auth check failed", err);
    // In failure modes, send user to auth page to be safe.
    redirectToAuth();
  }
})();
