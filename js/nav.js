// js/nav.js (safe merge and language persistence)
// highlights active sidebar item and persists language selection

(function () {
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
      name: newer.name || older.name || "",
      profile: newer.profile || older.profile || "",
      avatar: newer.avatar || older.avatar || "../assets/img/avatar.jpg",
      grade: newer.grade || older.grade || "",
      language: newer.language || older.language || "en",
      phone: newer.phone || older.phone || "",
      updatedAt: Math.max(aTime, bTime, now)
    };
  }

  function getCurrentSession() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) parsed.email = normalizeEmailLocal(parsed.email);
      if (parsed && parsed.updatedAt) parsed.updatedAt = Number(parsed.updatedAt) || Date.now();
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeSessionSafely(obj) {
    try {
      const existing = getCurrentSession();
      const merged = mergeSession(existing, obj);
      localStorage.setItem("gyan_current_user", JSON.stringify(merged));
      console.debug("nav.js wrote gyan_current_user (merged)", merged);
    } catch (e) {
      console.warn("nav writeSessionSafely failed", e);
    }
  }

  // mapping of filenames to data-page values
  const map = {
    "index.html": "home",
    "": "home",
    "lessons.html": "lessons",
    "games.html": "games",
    "quiz.html": "games",
    "progress.html": "progress",
    "rewards.html": "rewards",
    "settings.html": "settings",
  };

  function getFilename() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "index.html";
    return parts[parts.length - 1];
  }

  const filename = getFilename();
  const page = map[filename] || filename.replace(".html", "") || "home";

  document.querySelectorAll(".menu-item").forEach((item) => {
    const dp = item.dataset ? item.dataset.page : null;
    if (dp === page) item.classList.add("active");

    item.addEventListener("click", (ev) => {
      const anchor = item.querySelector("a");
      if (anchor && anchor.getAttribute("href")) return;

      const target = dp;
      if (!target) return;
      if (target === "home") {
        window.location.href = "/index.html";
        return;
      }
      window.location.href = "/templates/" + target + ".html";
    });
  });

  // language selector persistence
  const langSelects = document.querySelectorAll("#language");
  const saved = localStorage.getItem("gyansetulang") || "en";
  langSelects.forEach((s) => (s.value = saved));
  langSelects.forEach((s) => {
    s.addEventListener("change", (e) => {
      localStorage.setItem("gyansetulang", e.target.value);
      document.querySelectorAll("#language").forEach((x) => (x.value = e.target.value));
    });
  });

  window.addEventListener("storage", (e) => {
    if (e.key === "gyansetulang") {
      document.querySelectorAll("#language").forEach((s) => (s.value = e.newValue));
    }
    if (e.key === "gyan_current_user") {
      console.debug("nav.js noticed session change (storage event)");
    }
  });

  // login button UI only: do not touch session here
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    let logged = false;
    loginBtn.addEventListener("click", () => {
      logged = !logged;
      loginBtn.innerHTML = logged
        ? '<i class="fas fa-right-from-bracket"></i><span>Log Out</span>'
        : '<i class="fas fa-right-to-bracket"></i><span>Log In</span>';
    });
  }
})();
