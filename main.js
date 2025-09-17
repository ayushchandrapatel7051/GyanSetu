// main.js — injects #gs-top-right container and language selector, plus auth/session logic
(async () => {
  const DB_NAME = "gyansetu-auth";
  const DB_VERSION = 1;
  const STORE_USERS = "users";

  // ---------- IndexedDB helpers ----------
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

  async function getAllUsers() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_USERS, "readonly");
        const store = tx.objectStore(STORE_USERS);
        const req = store.getAll();
        req.onsuccess = (ev) => {
          resolve(ev.target.result || []);
          db.close();
        };
        req.onerror = (ev) => {
          reject(ev.target.error);
          db.close();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async function getUserByEmail(email) {
    if (!email) return null;
    const normalized = normalizeEmailLocal(email);
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_USERS, "readonly");
        const store = tx.objectStore(STORE_USERS);
        const req = store.get(normalized);
        req.onsuccess = (ev) => {
          resolve(ev.target.result || null);
          db.close();
        };
        req.onerror = (ev) => {
          reject(ev.target.error);
          db.close();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async function putUser(record) {
    if (!record || !record.email) return;
    record.email = normalizeEmailLocal(record.email);
    record.updatedAt = record.updatedAt || Date.now();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_USERS, "readwrite");
        const store = tx.objectStore(STORE_USERS);
        const req = store.put(record);
        req.onsuccess = () => {
          resolve();
          db.close();
        };
        req.onerror = (ev) => {
          reject(ev.target.error);
          db.close();
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------- local helpers ----------
  function getCurrentUserFromLocal() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  function normalizeEmailLocal(email) {
    if (!email) return email;
    return String(email).trim().toLowerCase();
  }
  function redirectToAuth() {
    if (location.pathname.endsWith("auth.html")) return;
    location.href = "../templates/auth.html";
  }
  function mergeSession(existing, fromAuthDb) {
    const now = Date.now();
    const a = existing || {};
    const b = fromAuthDb || {};
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
      isLoggedIn: newer.isLoggedIn || older.isLoggedIn || false,
      updatedAt: Math.max(aTime, bTime, now),
    };
  }

  // persist canonical user to DB + localStorage + window.currentUser
  async function persistCanonicalUser(user) {
    if (!user || !user.email) return;
    user.email = normalizeEmailLocal(user.email);
    user.updatedAt = Date.now();
    try {
      await putUser(user);
    } catch (e) {
      console.warn("putUser failed", e);
    }
    try {
      localStorage.setItem("gyan_current_user", JSON.stringify(user));
      localStorage.setItem("gyan_user_ping", String(Date.now()));
    } catch (e) {}
    window.currentUser = user;
    document.dispatchEvent(
      new CustomEvent("gyan:user-updated", { detail: user })
    );
  }

  // update current user partially
  async function updateCurrentUser(updates) {
    if (!updates) return;
    const cur = window.currentUser || getCurrentUserFromLocal();
    if (!cur) return;
    const merged = Object.assign({}, cur, updates);
    merged.email = normalizeEmailLocal(merged.email || cur.email || "");
    merged.updatedAt = Date.now();
    try {
      await putUser(merged);
    } catch (e) {
      console.warn("putUser failed", e);
    }
    try {
      localStorage.setItem("gyan_current_user", JSON.stringify(merged));
      localStorage.setItem("gyan_user_ping", String(Date.now()));
    } catch (e) {}
    window.currentUser = merged;
    document.dispatchEvent(
      new CustomEvent("gyan:user-updated", { detail: merged })
    );
    return merged;
  }

  // API
  window.GyanSetu = window.GyanSetu || {};
  window.GyanSetu.updateProfile = updateCurrentUser;
  window.GyanSetu.setLanguage = async (lang) => {
    if (!lang) return;
    if (window.currentUser && window.currentUser.email) {
      return updateCurrentUser({ language: lang });
    } else {
      try {
        localStorage.setItem(
          "gyan_guest_language",
          JSON.stringify({ language: lang, updatedAt: Date.now() })
        );
        localStorage.setItem("gyan_user_ping", String(Date.now()));
      } catch (e) {}
      document.dispatchEvent(
        new CustomEvent("gyan:user-updated", { detail: { language: lang } })
      );
    }
  };
  window.GyanSetu.getCurrentLanguage = () =>
    (window.currentUser && window.currentUser.language) ||
    (function () {
      try {
        const g = localStorage.getItem("gyan_guest_language");
        return g ? JSON.parse(g).language : null;
      } catch (e) {
        return null;
      }
    })() ||
    "en";

  // ---------- initialize canonical session ----------
  try {
    const localUser = getCurrentUserFromLocal();
    let mergedUser = null;

    if (localUser && localUser.email) {
      const dbUser = await getUserByEmail(localUser.email).catch(() => null);
      if (dbUser) mergedUser = mergeSession(localUser, dbUser);
      else mergedUser = mergeSession(localUser, null);
    } else {
      const users = await getAllUsers();
      const logged = users.find((u) => u.isLoggedIn === true);
      if (logged) mergedUser = mergeSession(localUser, logged);
    }

    if (!mergedUser || !mergedUser.email) {
      // allow guests? currently redirecting to auth
      redirectToAuth();
      return;
    }

    await persistCanonicalUser(mergedUser);
    console.info("GyanSetu: session initialized:", mergedUser.email);
  } catch (err) {
    console.error("Auth check failed", err);
    redirectToAuth();
    return;
  }

  // ---------- Create single top-right anchor (#gs-top-right) ----------
  function injectTopRightContainer() {
    try {
      if (document.querySelector("#gs-top-right"))
        return document.querySelector("#gs-top-right");

      // container
      const container = document.createElement("div");
      container.id = "gs-top-right";
      // minimal inline styles so it appears above other content
      container.style.position = "fixed";
      container.style.top = "12px";
      container.style.right = "18px";
      container.style.zIndex = "9999";
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.gap = "12px";
      container.style.pointerEvents = "auto"; // allow clicks
      // transparent background so it doesn't block header
      container.style.background = "transparent";
      document.body.appendChild(container);

      // also ensure a helpful CSS hook exists for further styling
      const styleId = "gs-top-right-style";
      if (!document.getElementById(styleId)) {
        const s = document.createElement("style");
        s.id = styleId;
        s.textContent = `
          #gs-top-right { font-family: Inter, system-ui, Arial, sans-serif; }
          #gs-top-right .gs-lang-label { color: #fff; font-weight:600; margin-left:6px; margin-right:6px; }
          #gs-top-right select { border-radius:999px; padding:6px 10px; border:0; outline:0; background: rgba(0,0,0,0.45); color:#fff; font-weight:600; }
        `;
        document.head.appendChild(s);
      }

      return container;
    } catch (e) {
      console.error("injectTopRightContainer failed", e);
      return null;
    }
  }

  // ---------- create language selector inside #gs-top-right ----------
  function createLanguageSelector(container) {
    if (!container) return null;
    // if exist, return it
    const existing = container.querySelector("#gs-language");
    if (existing) return existing;

    // wrapper for label + select + globe icon
    const wrapper = document.createElement("div");
    wrapper.className = "gs-lang-wrapper";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "8px";
    wrapper.style.padding = "6px 10px";
    wrapper.style.background = "rgba(0,0,0,0.35)";
    wrapper.style.borderRadius = "999px";
    wrapper.style.backdropFilter = "blur(6px)";

    // globe icon (fa or fallback)
    const globe = document.createElement("span");
    globe.className = "gs-globe";
    globe.innerHTML = "&#127760;"; // fallback globe emoji
    globe.style.fontSize = "14px";
    globe.style.display = "inline-block";
    globe.style.marginLeft = "2px";

    // label
    const label = document.createElement("span");
    label.className = "gs-lang-label";
    label.textContent = "Language:";
    label.style.color = "#fff";
    label.style.fontWeight = "600";
    label.style.fontSize = "13px";

    // select
    const select = document.createElement("select");
    select.id = "gs-language";
    select.className = "gs-language-select";
    select.setAttribute("aria-label", "Language");
    select.innerHTML = `
      <option value="en">English</option>
      <option value="hi">Hindi</option>
      <option value="or">Odia</option>
    `;

    wrapper.appendChild(globe);
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    container.appendChild(wrapper);

    // set initial
    const lang = window.GyanSetu.getCurrentLanguage();
    select.value = lang;
    document.documentElement.setAttribute("lang", lang);

    select.addEventListener("change", async (e) => {
      const v = e.target.value;
      document.documentElement.setAttribute("lang", v);
      try {
        await window.GyanSetu.setLanguage(v);
      } catch (err) {
        console.warn("setLanguage error", err);
      }
    });

    // listen for updates
    document.addEventListener("gyan:user-updated", (ev) => {
      try {
        if (ev && ev.detail && ev.detail.language) {
          select.value = ev.detail.language;
          document.documentElement.setAttribute("lang", ev.detail.language);
        }
      } catch (e) {}
    });
    window.addEventListener("storage", (ev) => {
      try {
        if (ev.key === "gyan_current_user" && ev.newValue) {
          const parsed = JSON.parse(ev.newValue || "{}");
          if (parsed.language) {
            select.value = parsed.language;
            document.documentElement.setAttribute("lang", parsed.language);
          }
        } else if (ev.key === "gyan_guest_language" && ev.newValue) {
          const parsed = JSON.parse(ev.newValue || "{}");
          if (parsed.language) {
            select.value = parsed.language;
            document.documentElement.setAttribute("lang", parsed.language);
          }
        }
      } catch (e) {}
    });

    return select;
  }

  // ensure injection runs as soon as possible
  try {
    const attach = () => {
      const container = injectTopRightContainer();
      createLanguageSelector(container);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", attach, { once: true });
      // also try immediate
      try {
        attach();
      } catch (e) {}
    } else {
      attach();
    }
  } catch (e) {
    console.error("language injection error", e);
  }
})();
