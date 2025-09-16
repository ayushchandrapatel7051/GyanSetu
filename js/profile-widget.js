// profile-widget.js — robust attach to #gs-top-right and force one-line layout
(function () {
  const DEFAULT_AVATAR = "../assets/img/avatar.jpg";
  const DEFAULT_EMAIL = "johndoe@email.com";

  const CSS_ID = "gs-profile-widget-css-v2";
  const RETRY_MS = 120;     // retry interval
  const RETRY_MAX = 60;     // ~7.2s total retry time

  const css = `
  /* profile widget styling (v2) */
  #gs-top-right { display:flex !important; align-items:center !important; gap:12px !important; flex-wrap:nowrap !important; }
  #gs-top-right .gs-lang-wrapper { display:inline-flex !important; align-items:center !important; gap:8px !important; white-space:nowrap !important; }
  #gs-top-right .gs-lang-wrapper * { white-space:nowrap !important; }
  #gs-top-right .gs-profile-wrap { display:inline-flex !important; align-items:center !important; gap:8px !important; position:relative !important; }
  .gs-avatar-btn { width:36px; height:36px; border-radius:50% !important; overflow:hidden; cursor:pointer; border:2px solid rgba(255,255,255,0.08); padding:0; background:transparent; display:inline-block; }
  .gs-avatar-btn img { width:100%; height:100%; object-fit:cover; display:block; }
  .gs-profile-popup { position:absolute; right:0; top:44px; min-width:220px; background:var(--card,#1b0b2b); border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,0.5); padding:12px; z-index:10000; display:none; color:var(--text,#fff); }
  .gs-profile-popup.show { display:block; }
  .gs-popup-row { display:flex; align-items:center; gap:12px; }
  .gs-popup-avatar { width:48px; height:48px; border-radius:8px; overflow:hidden; }
  .gs-popup-avatar img { width:100%; height:100%; object-fit:cover; display:block; }
  .gs-popup-title { font-weight:700; font-size:1rem; }
  .gs-popup-sub { color:var(--muted, rgba(255,255,255,0.7)); font-size:0.9rem; margin-top:4px; }
  .gs-popup-actions { display:flex; gap:8px; margin-top:12px; justify-content:flex-end; }
  .gs-popup-actions button { padding:6px 10px; border-radius:8px; border:0; cursor:pointer; background:#2d1f3d; color:#fff; font-weight:600; }
  `;

  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function normalizeEmailLocal(email) {
    return email ? String(email).trim().toLowerCase() : email;
  }

  function readSessionSafe() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) parsed.email = normalizeEmailLocal(parsed.email);
      return parsed;
    } catch (e) { return null; }
  }

  async function readSettings(email) {
    try {
      if (window.SettingsDB && SettingsDB.getSettings) {
        return await SettingsDB.getSettings(email || DEFAULT_EMAIL);
      }
    } catch (e) {}
    // fallback localStorage per-user settings if any
    try {
      const raw = localStorage.getItem("gyan_settings_" + (email || (readSessionSafe() && readSessionSafe().email) || DEFAULT_EMAIL));
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function createWidgetElements() {
    // container
    const wrap = document.createElement("div");
    wrap.id = "gs-profile-wrap";
    wrap.className = "gs-profile-wrap";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gs-avatar-btn";
    btn.setAttribute("title", "Profile");
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.style.border = "none";

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
        <button class="gs-btn-profile" type="button">Profile</button>
        <button class="gs-btn-logout" type="button">Log out</button>
      </div>
    `;

    wrap.appendChild(btn);
    wrap.appendChild(popup);
    return { wrap, btn, img, popup };
  }

  async function attachToTopRight(container) {
    if (!container) return false;
    // avoid duplicate
    if (container.querySelector("#gs-profile-wrap")) return true;

    // create elements
    const { wrap, btn, img, popup } = createWidgetElements();

    // ensure container layout is forced to single line
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "12px";
    container.style.flexWrap = "nowrap";
    container.style.whiteSpace = "nowrap";

    // append as last child (to appear right of language)
    container.appendChild(wrap);

    // popup toggles
    let isOpen = false;
    function openPopup() {
      popup.classList.add("show");
      popup.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      isOpen = true;
    }
    function closePopup() {
      popup.classList.remove("show");
      popup.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      isOpen = false;
    }

    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      isOpen ? closePopup() : openPopup();
    });

    document.addEventListener("click", (ev) => {
      if (!wrap.contains(ev.target) && isOpen) closePopup();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && isOpen) closePopup();
    });

    const btnProfile = popup.querySelector(".gs-btn-profile");
    const btnLogout = popup.querySelector(".gs-btn-logout");
    const popupAvatarImg = popup.querySelector(".gs-popup-avatar img");
    const popupTitle = popup.querySelector(".gs-popup-title");
    const popupSub = popup.querySelector(".gs-popup-sub");

    btnProfile.addEventListener("click", () => window.location.href = "settings.html");
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("gyan_current_user");
      if (typeof window.authLogout === "function") {
        try { window.authLogout(); } catch (e) {}
      }
      updateWidget();
    });

    async function updateWidget() {
      let email = (window.currentUser && window.currentUser.email) || (readSessionSafe() && readSessionSafe().email) || DEFAULT_EMAIL;
      let s = await readSettings(email);
      const avatarUrl = (s && s.avatar) || DEFAULT_AVATAR;
      const name = (s && s.name) || (email ? email.split("@")[0] : "Guest");
      const xp = (s && (s.xp != null ? s.xp : s.points)) ?? null;

      img.src = avatarUrl;
      popupAvatarImg.src = avatarUrl;
      popupTitle.textContent = name;
      popupSub.innerHTML = xp != null ? `XP: <span class="gs-popup-xp">${(Number(xp)||0).toLocaleString()}</span>` : `<span class="muted">No XP yet</span>`;
    }

    updateWidget();
    // keep available globally for debugging
    window.updateProfileWidget = updateWidget;

    // listen for changes
    document.addEventListener("gyan:user-updated", updateWidget);
    window.addEventListener("storage", (ev) => {
      if (ev.key === "gyan_current_user" || (ev.key && ev.key.indexOf("gyan_settings_") === 0)) updateWidget();
    });

    return true;
  }

  // Wait for #gs-top-right to exist, retry a few times if needed
  function findAndAttach(retriesLeft) {
    if (retriesLeft <= 0) {
      // final fallback: create our own fixed container and attach there
      const fallback = document.createElement("div");
      fallback.id = "gs-top-right";
      fallback.style.position = "fixed";
      fallback.style.top = "12px";
      fallback.style.right = "18px";
      fallback.style.zIndex = "9999";
      fallback.style.display = "flex";
      fallback.style.alignItems = "center";
      fallback.style.gap = "12px";
      document.body.appendChild(fallback);
      return attachToTopRight(fallback);
    }

    const container = document.getElementById("gs-top-right");
    if (container) {
      return attachToTopRight(container);
    } else {
      // retry after short delay
      setTimeout(() => findAndAttach(retriesLeft - 1), RETRY_MS);
      return null;
    }
  }

  // init
  (function init() {
    injectCSS();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => findAndAttach(RETRY_MAX));
    } else {
      findAndAttach(RETRY_MAX);
    }
  })();

})();
