// profile-widget.js
// Adds a profile avatar to the top-right (next to language) and shows name + XP on click.
// Usage: include after settings-db.js (so SettingsDB is already defined).
(function () {
  const DEFAULT_AVATAR = "../assets/img/1.png";
  const DEFAULT_EMAIL = "johndoe@email.com";

  // tiny CSS injected so you don't need to touch global stylesheet
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

  // get email same way other pages do
  function getEmailFromLocal() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.email ? parsed.email : null;
    } catch (e) {
      return null;
    }
  }

  async function readSettings(email) {
    // prefer SettingsDB when available
    try {
      if (window.SettingsDB && SettingsDB.getSettings) {
        const s = await SettingsDB.getSettings(email || getEmailFromLocal() || DEFAULT_EMAIL);
        return s || null;
      }
    } catch (e) {
      console.warn("SettingsDB read failed", e);
    }

    // fallback to localStorage cache if available
    try {
      const raw = localStorage.getItem("gyan_settings_" + (email || getEmailFromLocal()));
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

    // wrapper placed inside same container as language box (lang-fixed)
    const wrap = document.createElement("div");
    wrap.className = "gs-profile-wrap";

    // avatar button
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

    // popup panel
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

    // insert into DOM: after language element inside .lang-fixed
    // prefer .lang-fixed container, else place into top-right area of body
    let inserted = false;
    if (rootContainer && rootContainer instanceof Element) {
      rootContainer.appendChild(wrap);
      inserted = true;
    } else {
      const lf = document.querySelector(".lang-fixed");
      if (lf) {
        // append at end so it appears to the right
        lf.style.display = lf.style.display || ""; // ensure visible
        lf.appendChild(wrap);
        inserted = true;
      }
    }

    if (!inserted) {
      // fallback: append to body top-right corner
      wrap.style.position = "fixed";
      wrap.style.top = "12px";
      wrap.style.right = "12px";
      document.body.appendChild(wrap);
    }

    // wire interactions
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
      // focus first actionable button for accessibility
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
      if (isOpen) closePopup();
      else openPopup();
    });

    // close on outside click
    document.addEventListener("click", (ev) => {
      if (!wrap.contains(ev.target)) {
        if (isOpen) closePopup();
      }
    });

    // keyboard: Esc closes
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && isOpen) closePopup();
    });

    // profile button - navigate to settings page (if exists)
    btnProfile.addEventListener("click", () => {
      // prefer settings page in same folder
      window.location.href = "settings.html";
    });

    // logout button - clear local cache and optionally redirect to auth page
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("gyan_current_user");
      // keep settings but you may want to redirect to login screen
      // try to call a global auth logout if available:
      if (window.authLogout && typeof window.authLogout === "function") {
        try {
          window.authLogout();
        } catch (e) {}
      }
      // visual update
      updateWidget(); // will show guest
    });

    // expose update function
    async function updateWidget() {
      let email = null;
      if (window.currentUser && window.currentUser.email) email = window.currentUser.email;
      if (!email) email = getEmailFromLocal();
      if (!email) email = DEFAULT_EMAIL;

      let s = null;
      try {
        s = await readSettings(email);
      } catch (e) {
        console.warn("readSettings failed", e);
      }

      const avatarUrl =
        (s && (s.avatar || s.profileAvatar || s.photo)) || DEFAULT_AVATAR;
      const name = (s && (s.name || s.displayName || s.username)) || (email ? email.split("@")[0] : "Guest");
      const xp = (s && (s.xp != null ? s.xp : s.points)) != null ? (s.xp || s.points) : null;

      // update small avatar and popup
      img.src = avatarUrl;
      popupAvatarImg.src = avatarUrl;
      popupTitle.textContent = name;
      popupSub.innerHTML = xp != null ? `XP: <span class="gs-popup-xp">${formatXp(xp)}</span>` : `<span class="muted">No XP yet</span>`;
    }

    // initial update
    updateWidget();

    // update when localStorage gyan_current_user changes (other tabs or login flow)
    window.addEventListener("storage", (ev) => {
      if (ev.key === "gyan_current_user" || ev.key === "gyan_settings_" + getEmailFromLocal()) {
        updateWidget();
      }
    });

    // also provide global update for other pages to call after login/profile changes
    window.updateProfileWidget = updateWidget;
  }

  // Try to find the language container first so avatar sits to the right of language select
  function init() {
    injectCSS();
    // prefer element with class 'lang-fixed'
    const langFixed = document.querySelector(".lang-fixed");
    if (langFixed) {
      buildWidget(langFixed);
      return;
    }

    // try to find the top-right area by locating any element containing a language select
    const langSelect = document.querySelector("#language, .lang-select, select.lang-select");
    if (langSelect && langSelect.parentElement) {
      buildWidget(langSelect.parentElement);
      return;
    }

    // fallback: append to header/topbar if exists
    const header = document.querySelector("main .lang-fixed, .topbar, header, .header");
    if (header) {
      buildWidget(header);
      return;
    }

    // ultimate fallback: body
    buildWidget(null);
  }

  // Run after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
