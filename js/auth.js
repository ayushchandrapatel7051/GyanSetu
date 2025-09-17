// js/auth.js (safe session, updatedAt, merged writes)
// Authentication helpers + form wiring.
// Requires settings-db.js to be loaded before this file (so SettingsDB is available).

const AUTH_DB = "gyansetu-auth";
const AUTH_STORE = "users";
const AUTH_VERSION = 1;

// JSONBin config (provided by user)
const JSONBIN_BIN_ID = "68ca76a0d0ea881f4080ca15";
const JSONBIN_BASE = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
const JSONBIN_ACCESS_KEY =
  "$2a$10$zR1cR2SnB3AY5HsaXJl5DurOmCkyNhh/nqoCa4QQfB.WC6fEVymZy"; // read-only preferred for frontend
const JSONBIN_MASTER_KEY =
  "$2a$10$igVzx0be3sIoxVgcfIcqWuISN5TijUNAFmlolSVB9H1QSimy.1mCK"; // write - keep server-side ideally

/* -----------------------
   IndexedDB helpers
   ----------------------- */
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
    const addReq = st.add(user);
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

/* -----------------------
   Session helpers (local merge)
   ----------------------- */
function normalizeEmailLocal(email) {
  if (!email) return email;
  return String(email).trim().toLowerCase();
}

function mergeSession(existing, incoming) {
  const now = Date.now();
  const a = existing || {};
  const b = incoming || {};

  if (a.email) a.email = normalizeEmailLocal(a.email);
  if (b.email) b.email = normalizeEmailLocal(b.email);

  const aTime = a.updatedAt ? Number(a.updatedAt) : 0;
  const bTime = b.updatedAt ? Number(b.updatedAt) : 0;
  const newer = bTime > aTime ? b : a;
  const older = bTime > aTime ? a : b;

  return {
    email: newer.email || older.email || "",
    name:
      newer.name ||
      older.name ||
      (newer.firstName
        ? `${newer.firstName} ${newer.lastName || ""}`.trim()
        : "Unknown"),
    profile: newer.profile || older.profile || "",
    avatar: newer.avatar || older.avatar || "../assets/img/avatar.jpg",
    grade: newer.grade || older.grade || "",
    language: newer.language || older.language || "en",
    phone: newer.phone || older.phone || "",
    updatedAt: Math.max(aTime, bTime, now),
  };
}

function readLoginSession() {
  try {
    const raw = localStorage.getItem("gyan_current_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.email)
      parsed.email = normalizeEmailLocal(parsed.email);
    if (parsed && parsed.updatedAt)
      parsed.updatedAt = Number(parsed.updatedAt) || Date.now();
    return parsed;
  } catch (e) {
    return null;
  }
}

function writeLoginSessionSafely(obj) {
  try {
    const existing = readLoginSession();
    const merged = mergeSession(existing, obj);
    localStorage.setItem("gyan_current_user", JSON.stringify(merged));
    console.debug("gyan_current_user written (merged)", merged);
  } catch (e) {
    console.warn("writeLoginSessionSafely failed", e);
  }
}

/* -----------------------
   JSONBin helpers
   ----------------------- */
async function fetchUsersFromJsonbin() {
  try {
    const res = await fetch(JSONBIN_BASE, {
      headers: {
        "X-Access-Key": JSONBIN_ACCESS_KEY,
      },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const payload = await res.json();
    return payload && payload.record ? payload.record : [];
  } catch (err) {
    console.warn("fetchUsersFromJsonbin failed", err);
    return null;
  }
}

async function writeUsersToJsonbin(users) {
  try {
    const res = await fetch(JSONBIN_BASE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_MASTER_KEY,
      },
      body: JSON.stringify(users),
    });
    if (!res.ok) throw new Error(`Write failed: ${res.status}`);
    const payload = await res.json();
    return payload;
  } catch (err) {
    console.warn("writeUsersToJsonbin failed", err);
    return null;
  }
}

/* -----------------------
   ensureSettingsForUser (sync auth -> settings)
   ----------------------- */
async function ensureSettingsForUser(user) {
  if (!window.SettingsDB || !SettingsDB.openDB) return;
  try {
    await SettingsDB.openDB();
    const email =
      user && user.email ? normalizeEmailLocal(String(user.email)) : null;
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
      avatar: (s && s.avatar) || user.avatar || "../assets/img/avatar.jpg",
      badges: (s && s.badges) || [],
      xp: s && s.xp != null ? s.xp : 0,
      lastLesson: (s && s.lastLesson) || "",
      updatedAt: Date.now(),
    });

    await SettingsDB.saveSettings(merged);
    console.debug("SettingsDB synced for", email);
  } catch (err) {
    console.warn("ensureSettingsForUser failed", err);
  }
}

/* -----------------------
   Signup / Login flows
   ----------------------- */
async function signupUser(user) {
  try {
    user.email = normalizeEmailLocal(user.email || "");
    user.createdAt = Date.now();
    user.updatedAt = Date.now();

    const remote = await fetchUsersFromJsonbin();
    if (Array.isArray(remote)) {
      const existsRemote = remote.find(
        (u) => String(u.email || "").toLowerCase() === user.email
      );
      if (existsRemote) {
        alert(
          "An account with this email already exists. Please login instead."
        );
        return;
      }
    }

    await addUserToDB(Object.assign({}, user));

    if (Array.isArray(remote)) {
      const newRemote = remote.concat([
        Object.assign({}, user, { xp: 0, lastLesson: "" }),
      ]);
      await writeUsersToJsonbin(newRemote).catch((e) =>
        console.warn("jsonbin write failed after signup", e)
      );
    }

    writeLoginSessionSafely(user);
    await ensureSettingsForUser(user).catch((e) =>
      console.warn("Settings sync after signup failed", e)
    );

    // ✅ store signup success message before redirect
    localStorage.setItem(
      "gyan_signup_success",
      "Your account has been created! Please login with your credentials."
    );

    const authPath = location.pathname.includes("/templates/")
      ? "auth.html?login=1"
      : "./auth.html?login=1";
    window.location.href = authPath;
  } catch (e) {
    console.error("Signup failed", e);
    if (e && e.name === "ConstraintError") {
      alert("An account with this email already exists. Please login instead.");
    } else {
      alert("Signup failed. Please try again.");
    }
  }
}

async function loginSuccess(user) {
  try {
    // normalize and mark
    user.email = normalizeEmailLocal(user.email || "");
    user.updatedAt = Date.now();
    user.isLoggedIn = true;

    // update local auth DB
    await updateUserInDB(user).catch((e) =>
      console.warn("updateUserInDB failed", e)
    );

    // write safe merged session
    writeLoginSessionSafely({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name:
        user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      grade: user.grade,
      language: (function (l) {
        const v = String(l || "en").toLowerCase();
        if (v.startsWith("en")) return "en";
        if (v.startsWith("hi")) return "hi";
        if (v.startsWith("or")) return "or";
        return v;
      })(user.language),
      phone: user.phone,
      updatedAt: user.updatedAt,
    });

    // ensure a settings record exists locally (seeds defaults if missing)
    await ensureSettingsForUser(user).catch((e) =>
      console.warn("ensureSettingsForUser during login failed", e)
    );

    // ------ NEW: fetch remote JSONBin and update local xp if present ------
    try {
      const remote = await fetchUsersFromJsonbin(); // returns array or null
      if (Array.isArray(remote)) {
        const remoteUser = remote.find(
          (u) => (u.email || "").toLowerCase() === user.email
        );
        if (remoteUser && remoteUser.xp != null) {
          const remoteXp = Number(remoteUser.xp) || 0;

          // update SettingsDB xp
          try {
            await SettingsDB.openDB();
            const emailKey = user.email;
            let settings = null;
            try {
              settings = await SettingsDB.getSettings(emailKey);
            } catch (e) {
              settings = null;
            }

            const mergedSettings = Object.assign({}, settings || {}, {
              email: emailKey,
              name:
                settings && settings.name
                  ? settings.name
                  : user.name || (user.email ? user.email.split("@")[0] : ""),
              xp: remoteXp,
              lastLesson:
                settings && settings.lastLesson != null
                  ? settings.lastLesson
                  : "",
              badges: (settings && settings.badges) || [],
              language:
                (settings && settings.language) || user.language || "en",
              grade: (settings && settings.grade) || user.grade || "8",
              avatar:
                (settings && settings.avatar) ||
                user.avatar ||
                "../assets/img/avatar.jpg",
              updatedAt: Date.now(),
            });

            await SettingsDB.saveSettings(mergedSettings).catch((e) =>
              console.warn(
                "SettingsDB.saveSettings failed (remote xp merge)",
                e
              )
            );
            console.debug(
              "SettingsDB xp updated from remote for",
              emailKey,
              remoteXp
            );
          } catch (e) {
            console.warn("Failed to update SettingsDB with remote xp", e);
          }

          // update auth DB xp (so auth/users store mirrors xp)
          try {
            const localAuthUser = await getUserFromDB(user.email);
            if (localAuthUser) {
              localAuthUser.xp = remoteXp;
              localAuthUser.updatedAt = Date.now();
              await updateUserInDB(localAuthUser);
            } else {
              // seed an auth record if missing
              const seedAuth = Object.assign({}, user, {
                xp: remoteXp,
                updatedAt: Date.now(),
              });
              try {
                await addUserToDB(seedAuth);
              } catch (e) {
                /* ignore constraint errors */
              }
            }
          } catch (e) {
            console.warn("Failed to update auth DB xp", e);
          }

          // update session (optional)
          try {
            const sess = readLoginSession() || {};
            sess.xp = remoteXp;
            sess.updatedAt = Date.now();
            writeLoginSessionSafely(sess);
          } catch (e) {
            /* ignore */
          }
        }
      }
    } catch (e) {
      console.warn("remote xp sync failed", e);
    }
    // ------ end remote sync ------

    // redirect to index page
    const redirectPath = location.pathname.includes("/templates/")
      ? "../index.html"
      : "../index.html";
    setTimeout(() => (window.location.href = redirectPath), 300);
  } catch (err) {
    console.error("loginSuccess failed", err);
    // fallback: still redirect
    window.location.href = "../index.html";
  }
}

/* -----------------------
   DOM wiring (forms)
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

  const params = new URLSearchParams(window.location.search);
  if (params.get("login") === "1") showLoginTab();
  else showLoginTab();

  if (tabLogin) tabLogin.addEventListener("click", showLoginTab);
  if (tabSignup) tabSignup.addEventListener("click", showSignupTab);

  // ✅ check signup success message
  const signupSuccessMsg = localStorage.getItem("gyan_signup_success");
  if (signupSuccessMsg && loginMsg) {
    loginMsg.textContent = signupSuccessMsg;
    loginMsg.style.color = "limegreen";
    localStorage.removeItem("gyan_signup_success");
  }

  // SIGNUP submit
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (signupMsg) signupMsg.textContent = "";

      const user = {
        firstName: document.getElementById("firstName")?.value?.trim() || "",
        lastName: document.getElementById("lastName")?.value?.trim() || "",
        email: (document.getElementById("signupEmail")?.value || "")
          .trim()
          .toLowerCase(),
        grade: document.getElementById("grade")?.value || "",
        language: document.getElementById("languagePref")?.value || "english",
        phone: (document.getElementById("phoneNumber")?.value || "").trim(),
        password: document.getElementById("signupPassword")?.value || "",
        isLoggedIn: false,
      };

      if (!user.email || !user.password) {
        if (signupMsg)
          signupMsg.textContent = "Please provide email and password.";
        return;
      }

      try {
        await signupUser(user);
      } catch (err) {
        if (signupMsg)
          signupMsg.textContent = "Signup failed. Please try again.";
      }
    });
  }

  // LOGIN submit
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (loginMsg) loginMsg.textContent = "";

      const email = (document.getElementById("loginEmail")?.value || "")
        .trim()
        .toLowerCase();
      const password = document.getElementById("loginPassword")?.value || "";

      if (!email || !password) {
        if (loginMsg) loginMsg.textContent = "Please enter email and password.";
        return;
      }

      try {
        let user = await getUserFromDB(email);
        if (user && user.password === password) {
          user.isLoggedIn = true;
          user.updatedAt = Date.now();
          await updateUserInDB(user);
          await loginSuccess(user);
          return;
        }

        const remote = await fetchUsersFromJsonbin();
        if (Array.isArray(remote)) {
          const remoteUser = remote.find(
            (u) => String(u.email || "").toLowerCase() === email
          );
          if (remoteUser && remoteUser.password === password) {
            const seedUser = Object.assign({}, remoteUser, {
              updatedAt: Date.now(),
              isLoggedIn: true,
            });
            try {
              await addUserToDB(seedUser);
            } catch (e) {
              console.warn("seed local add failed", e);
            }
            await loginSuccess(seedUser);
            return;
          }
        }

        if (loginMsg) loginMsg.textContent = "Invalid email or password";
      } catch (err) {
        console.error("Login attempt failed", err);
        if (loginMsg) loginMsg.textContent = "Login failed. Please try again.";
      }
    });
  }
});
