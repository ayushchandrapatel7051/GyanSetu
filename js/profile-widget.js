// js/profile-widget.js (uses safe session reads and updates UI accordingly)

(function () {
  const DEFAULT_AVATAR = "../assets/img/1.png";
  const DEFAULT_EMAIL = "johndoe@email.com";

  const css = `
  .gs-profile-wrap { display:inline-flex; align-items:center; gap:10px; position:relative; }
  .gs-avatar-btn { width:40px; height:40px; border-radius:10px; overflow:hidden; display:inline-block; cursor:pointer; border:1px solid rgba(255,255,255,0.04); background:rgba(255,255,255,0.02); }
  .gs-avatar-btn img { width:100%; height:100%; object-fit:cover; display:block; }
  .gs-profile-popup { position:absolute; right:0; top:48px; min-width:200px; background:var(--card, #1b0b2b); border-radius:10px; box-shadow: 0 8px 24px rgba(0,0,0,0.45); padding:12px; z-index:9999; display:none; color:var(--text,#fff); }
  .gs-profile-popup.show { display:block; }
  .gs-popup-row { display:flex; align-items:center; gap:12px; }
  .gs-popup-avatar { width:56px; height:56px; border-radius:8px; overflow:hidden; }
  .gs-popup-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
  .gs-popup-title { font-weight:700; font-size:1rem; }
  .gs-popup-sub { color:var(--muted, rgba(255,255,255,0.6)); font-size:0.9rem; margin-top:4px; }
  .gs-popup-actions { display:flex; gap:8px; margin-top:10px; justify-content:flex-end; }
  .gs-popup-actions button { padding:6px 10px; border-radius:8px; border:0; cursor:pointer; }
  .gs-popup-xp { font-weight:700; color:#7b61ff; }
  `;

  function injectCSS() {
    if (document.getElementById("gs-profile-widget-css")) return;
    const s = document.createElement("style");
    s.id = "gs-profile-widget-css";
    s.textContent = css;
    document.head.appendChild(s);
  }

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

  async function readSettings(email) {
    try {
      if (window.SettingsDB && SettingsDB.getSettings) {
        const s = await SettingsDB.getSettings(email || (readSessionSafe() && readSessionSafe().email) || DEFAULT_EMAIL);
        return s || null;
      }
    } catch (e) {
      console.warn("SettingsDB read failed", e);
    }
    try {
      const raw = localStorage.getItem("gyan_settings_" + (email || (readSessionSafe() && readSessionSafe().email)));
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function formatXp(x) {
    try {
      return (Number(x) || 0).toLocaleString();
    } catch (e) {
      return String(x || 0);
    }
  }

  function buildWidget(rootContainer) {
    injectCSS();

    const wrap = document.createElement("div");
    wrap.className = "gs-profile-wrap";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gs-avatar-btn";
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("title", "Profile");
    btn.style.padding = 0;
    btn.style.border = "none";
    btn.style.background = "transparent";

    const img = document.createElement("img");
    img.alt = "Profile";
    img.src = DEFAULT_AVATAR;
    btn.appendChild(img);

    const popup = document.createElement("div");
    popup.className = "gs-profile-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-hidden", "true");
    popup.innerHTML = `
      <div class="gs-popup-row">
        <div class="gs-popup-avatar"><img src="${DEFAULT_AVATAR}" alt="avatar"/></div>
        <div style="flex:1">
          <div class="gs-popup-title">Guest</div>
          <div class="gs-popup-sub">—</div>
        </div>
      </div>
      <div class="gs-popup-actions">
        <div style="flex:1"></div>
        <button class="gs-btn-profile" type="button">Profile</button>
        <button class="gs-btn-logout" type="button">Log out</button>
      </div>
    `;

    wrap.appendChild(btn);
    wrap.appendChild(popup);

    let inserted = false;
    if (rootContainer && rootContainer instanceof Element) {
      rootContainer.appendChild(wrap);
      inserted = true;
    } else {
      const lf = document.querySelector(".lang-fixed");
      if (lf) { lf.appendChild(wrap); inserted = true; }
    }
    if (!inserted) {
      wrap.style.position = "fixed";
      wrap.style.top = "12px";
      wrap.style.right = "12px";
      document.body.appendChild(wrap);
    }

    const popupAvatarImg = popup.querySelector(".gs-popup-avatar img");
    const popupTitle = popup.querySelector(".gs-popup-title");
    const popupSub = popup.querySelector(".gs-popup-sub");
    const btnProfile = popup.querySelector(".gs-btn-profile");
    const btnLogout = popup.querySelector(".gs-btn-logout");

    let isOpen = false;

    function openPopup() {
      popup.classList.add("show");
      popup.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      isOpen = true;
      btnProfile.focus();
    }

    function closePopup() {
      popup.classList.remove("show");
      popup.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      isOpen = false;
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isOpen) closePopup(); else openPopup();
    });

    document.addEventListener("click", (ev) => {
      if (!wrap.contains(ev.target)) if (isOpen) closePopup();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && isOpen) closePopup();
    });

    btnProfile.addEventListener("click", () => window.location.href = "settings.html");
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("gyan_current_user");
      if (window.authLogout && typeof window.authLogout === "function") {
        try { window.authLogout(); } catch (e) {}
      }
      updateWidget();
    });

    async function updateWidget() {
      let email = null;
      if (window.currentUser && window.currentUser.email) email = window.currentUser.email;
      if (!email) {
        const ses = readSessionSafe();
        if (ses && ses.email) email = ses.email;
      }
      if (!email) email = DEFAULT_EMAIL;

      let s = null;
      try { s = await readSettings(email); } catch (e) { console.warn("readSettings failed", e); }

      const avatarUrl = (s && (s.avatar || s.profileAvatar || s.photo)) || DEFAULT_AVATAR;
      const name = (s && (s.name || s.displayName || s.username)) || (email ? email.split("@")[0] : "Guest");
      const xp = (s && (s.xp != null ? s.xp : s.points)) != null ? (s.xp || s.points) : null;

      img.src = avatarUrl;
      popupAvatarImg.src = avatarUrl;
      popupTitle.textContent = name;
      popupSub.innerHTML = xp != null ? `XP: <span class="gs-popup-xp">${formatXp(xp)}</span>` : `<span class="muted">No XP yet</span>`;
    }

    updateWidget();

    window.addEventListener("storage", (ev) => {
      if (ev.key === "gyan_current_user" || ev.key === "gyan_settings_" + (readSessionSafe() && readSessionSafe().email)) {
        console.debug("profile-widget detected storage change:", ev.key);
        updateWidget();
      }
    });

    window.updateProfileWidget = updateWidget;
  }

  function init() {
    injectCSS();
    const langFixed = document.querySelector(".lang-fixed");
    if (langFixed) { buildWidget(langFixed); return; }
    const langSelect = document.querySelector("#language, .lang-select, select.lang-select");
    if (langSelect && langSelect.parentElement) { buildWidget(langSelect.parentElement); return; }
    const header = document.querySelector("main .lang-fixed, .topbar, header, .header");
    if (header) { buildWidget(header); return; }
    buildWidget(null);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
