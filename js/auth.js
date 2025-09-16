// js/auth.js
// Authentication helpers + form wiring.
// Requires settings-db.js to be loaded before this file (so SettingsDB exists).

/* -----------------------
   Simple auth IndexedDB helpers
   ----------------------- */
const AUTH_DB = "gyansetu-auth";
const AUTH_STORE = "users";
const AUTH_VERSION = 1;

function openAuthDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(AUTH_DB, AUTH_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(AUTH_STORE)) {
        const store = db.createObjectStore(AUTH_STORE, { keyPath: "email" });
        store.createIndex("phone", "phone", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function addUserToDB(user) {
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUTH_STORE, "readwrite");
    const st = tx.objectStore(AUTH_STORE);
    const addReq = st.add(user); // will fail if email already exists
    addReq.onsuccess = () => resolve(addReq.result);
    addReq.onerror = (e) => reject(e.target.error);
  });
}

async function getUserFromDB(email) {
  if (!email) return null;
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUTH_STORE, "readonly");
    const st = tx.objectStore(AUTH_STORE);
    const req = st.get(email);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function updateUserInDB(user) {
  const db = await openAuthDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUTH_STORE, "readwrite");
    const st = tx.objectStore(AUTH_STORE);
    const req = st.put(user);
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

function saveUserLocal(user) {
  try {
    localStorage.setItem(
      "gyan_current_user",
      JSON.stringify({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        grade: user.grade,
        language: user.language,
        phone: user.phone,
      })
    );
  } catch (e) {
    console.warn("saveUserLocal failed", e);
  }
}

function normalizeLanguage(l) {
  if (!l) return "en";
  const v = String(l).toLowerCase();
  if (v.startsWith("en")) return "en";
  if (v.startsWith("hi")) return "hi";
  if (v.startsWith("or")) return "or";
  return v;
}

/* -----------------------
   ensureSettingsForUser (uses your existing SettingsDB wrapper)
   (kept your implementation but with a small defensive guard)
   ----------------------- */
async function ensureSettingsForUser(user) {
  if (!window.SettingsDB || !SettingsDB.openDB) return;
  try {
    await SettingsDB.openDB();
    const email = (user && user.email) ? String(user.email).toLowerCase() : null;
    if (!email) return;

    let s = null;
    try {
      s = await SettingsDB.getSettings(email);
    } catch (e) {
      s = null;
    }

    const merged = Object.assign({}, s || {}, {
      email,
      name:
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        (s && s.name) ||
        "",
      grade: user.grade || (s && s.grade) || "8",
      language: (function (l) {
        const v = String(l || (s && s.language) || "en").toLowerCase();
        if (v.startsWith("en")) return "en";
        if (v.startsWith("hi")) return "hi";
        if (v.startsWith("or")) return "or";
        return v;
      })(user.language),
      avatar: (s && s.avatar) || user.avatar || "../assets/avatar.jpg",
      badges: (s && s.badges) || [],
      xp: s && s.xp != null ? s.xp : 0,
      lastLesson: (s && s.lastLesson) || null,
    });

    await SettingsDB.saveSettings(merged);
    console.debug("SettingsDB synced for", email);
  } catch (err) {
    console.warn("ensureSettingsForUser failed", err);
  }
}

/* -----------------------
   signup and login flows
   ----------------------- */
async function signupUser(user) {
  try {
    // normalise
    user.email = String(user.email || "").toLowerCase();
    // create createdAt metadata
    user.createdAt = Date.now();

    // attempt to add to DB; if email exists, addUserToDB will reject (ConstraintError)
    await addUserToDB(user);

    // keep a short local copy (not marking logged-in automatically)
    saveUserLocal(user);

    // sync settings record (best-effort)
    await ensureSettingsForUser(user).catch((e) => {
      console.warn("Settings sync after signup failed", e);
    });

    // Redirect to auth page with login tab active
    // If auth.html is in templates/ use that path, otherwise adjust
    const authPath = location.pathname.includes("/templates/") ? "auth.html?login=1" : "./auth.html?login=1";
    window.location.href = authPath;
  } catch (e) {
    console.error("Signup failed", e);
    // show friendly error for common case
    if (e && e.name === "ConstraintError") {
      alert("An account with this email already exists. Please login instead.");
    } else {
      alert("Signup failed. Please try again.");
    }
  }
}

async function loginSuccess(user) {
  // store minimal profile in localStorage (quick access for UI)
  localStorage.setItem(
    "gyan_current_user",
    JSON.stringify({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      grade: user.grade,
      language: normalizeLanguage(user.language),
      phone: user.phone,
    })
  );

  // ensure settings record exists
  await ensureSettingsForUser(user).catch((e) => {
    console.warn("ensureSettingsForUser during login failed", e);
  });

  // redirect to root (adjust path depending on templates folder)
  const redirectPath = location.pathname.includes("/templates/") ? "../index.html" : "../index.html";
  setTimeout(() => {
    window.location.href = redirectPath;
  }, 300);
}

/* -----------------------
   DOM wiring: forms + tabs
   ----------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const loginMsg = document.getElementById("loginMsg");
  const signupMsg = document.getElementById("signupMsg");

  function showLoginTab() {
    if (tabLogin) tabLogin.classList.add("active");
    if (tabSignup) tabSignup.classList.remove("active");
    if (loginForm) loginForm.style.display = "";
    if (signupForm) signupForm.style.display = "none";
  }
  function showSignupTab() {
    if (tabLogin) tabLogin.classList.remove("active");
    if (tabSignup) tabSignup.classList.add("active");
    if (loginForm) loginForm.style.display = "none";
    if (signupForm) signupForm.style.display = "";
  }

  // if url contains ?login=1 we show login tab
  const params = new URLSearchParams(window.location.search);
  if (params.get("login") === "1") {
    showLoginTab();
  } else {
    // default show login
    showLoginTab();
  }

  if (tabLogin) tabLogin.addEventListener("click", showLoginTab);
  if (tabSignup) tabSignup.addEventListener("click", showSignupTab);

  // SIGNUP submit
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (signupMsg) signupMsg.textContent = "";

      const user = {
        firstName: document.getElementById("firstName")?.value?.trim() || "",
        lastName: document.getElementById("lastName")?.value?.trim() || "",
        email: (document.getElementById("signupEmail")?.value || "").trim().toLowerCase(),
        grade: document.getElementById("grade")?.value || "",
        language: document.getElementById("languagePref")?.value || "english",
        phone: (document.getElementById("phoneNumber")?.value || "").trim(),
        password: document.getElementById("signupPassword")?.value || "",
        isLoggedIn: false
      };

      // basic validation
      if (!user.email || !user.password) {
        if (signupMsg) signupMsg.textContent = "Please provide email and password.";
        return;
      }

      try {
        await signupUser(user);
      } catch (err) {
        // signupUser already shows alerts; but keep fallback message
        if (signupMsg) signupMsg.textContent = "Signup failed. Please try again.";
      }
    });
  }

  // LOGIN submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loginMsg) loginMsg.textContent = "";

      const email = (document.getElementById("loginEmail")?.value || "").trim().toLowerCase();
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        if (loginMsg) loginMsg.textContent = "Please enter email and password.";
        return;
      }

      try {
        const user = await getUserFromDB(email);
        if (user && user.password === password) {
          user.isLoggedIn = true;
          await updateUserInDB(user);
          await loginSuccess(user);
        } else {
          if (loginMsg) loginMsg.textContent = "Invalid email or password";
        }
      } catch (err) {
        console.error("Login attempt failed", err);
        if (loginMsg) loginMsg.textContent = "Login failed. Please try again.";
      }
    });
  }
});
