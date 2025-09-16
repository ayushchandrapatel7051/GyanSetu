// js/script.js (safe page switching, non-destructive login button behavior)

// Page navigation
const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

// helper helpers used for session merging where script might update UI
function normalizeEmailLocal(email) {
  if (!email) return email;
  return String(email).trim().toLowerCase();
}
function readSessionSafe() {
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
function writeSessionSafely(obj) {
  try {
    const existing = readSessionSafe();
    const merged = mergeSession(existing, obj);
    localStorage.setItem("gyan_current_user", JSON.stringify(merged));
    console.debug("script.js wrote gyan_current_user (merged)", merged);
  } catch (e) {
    console.warn("script writeSessionSafely failed", e);
  }
}

// show/hide pages
function showPageById(pageId) {
  pages.forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");
  menuItems.forEach((i) => i.classList.remove("active"));
  const menuItem = Array.from(menuItems).find((mi) => mi.dataset.page === pageId);
  if (menuItem) menuItem.classList.add("active");
  const content = document.querySelector(".content");
  if (content) content.scrollTop = 0;
}

menuItems.forEach((item) => {
  const target = item.dataset.page;
  if (!target) return;
  item.addEventListener("click", () => {
    showPageById(target);
  });
});

if (!document.querySelector(".page.active")) {
  const firstPage = pages[0];
  if (firstPage) firstPage.classList.add("active");
  if (menuItems[0]) menuItems[0].classList.add("active");
}

// Login/logout toggle -- purely UI only. Do not mutate session here.
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  let loggedInUI = true;
  loginBtn.addEventListener("click", () => {
    loggedInUI = !loggedInUI;
    loginBtn.innerHTML = loggedInUI
      ? '<i class="fas fa-right-from-bracket"></i><span>Log Out</span>'
      : '<i class="fas fa-right-to-bracket"></i><span>Log In</span>';
  });
}

// Theme toggle (optional)
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      document.documentElement.style.setProperty("--bg-1", "#ffffff");
      document.documentElement.style.setProperty("--bg-2", "#f6f6f8");
      document.documentElement.style.setProperty("--text", "#111827");
      document.documentElement.style.setProperty("--muted", "rgba(0,0,0,0.45)");
      document.documentElement.style.setProperty("--card", "rgba(0,0,0,0.03)");
    } else {
      document.documentElement.style.setProperty("--bg-1", "#16002a");
      document.documentElement.style.setProperty("--bg-2", "#2a0b3f");
      document.documentElement.style.setProperty("--text", "#ffffff");
      document.documentElement.style.setProperty("--muted", "rgba(255,255,255,0.65)");
      document.documentElement.style.setProperty("--card", "rgba(255,255,255,0.04)");
    }
  });
}
