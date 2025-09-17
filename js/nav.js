// nav.js - highlights active sidebar item, persists language selection, and handles logout
(function () {
  // mapping of filenames to data-page values
  const map = {
    "index.html": "home",
    "": "home",
    "lessons.html": "lessons",
    "games.html": "games",
    "quiz.html": "games", // optional: treat quiz.html as games highlight
    "progress.html": "progress",
    "rewards.html": "rewards",
    "settings.html": "settings",
  };

  // helper to get the filename even if the page is under /templates/
  function getFilename() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "index.html";
    return parts[parts.length - 1]; // last segment, e.g. "progress.html"
  }

  const filename = getFilename();
  const page = map[filename] || filename.replace(".html", "") || "home";

  // highlight the correct menu item
  document.querySelectorAll(".menu-item").forEach((item) => {
    const dp = item.dataset ? item.dataset.page : null;
    if (dp === page) item.classList.add("active");

    // if the item contains an <a> link (like Home anchor), let it behave normally
    item.addEventListener("click", (ev) => {
      const anchor = item.querySelector("a");
      if (anchor && anchor.getAttribute("href")) {
        // allow default anchor navigation
        return;
      }

      const target = dp;
      if (!target) return;

      // special-case Home -> root index.html
      if (target === "home") {
        // root-relative so Live Server will serve it from project root
        window.location.href = "/index.html";
        return;
      }

      // navigate to templates folder where your pages now live
      // using root-relative path so server resolves correctly
      window.location.href = "/templates/" + target + ".html";
    });
  });

  // language selector: persist and apply
  const langSelects = document.querySelectorAll("#language");
  const saved = localStorage.getItem("gyansetulang") || "en";
  langSelects.forEach((s) => (s.value = saved));
  langSelects.forEach((s) => {
    s.addEventListener("change", (e) => {
      localStorage.setItem("gyansetulang", e.target.value);
      document
        .querySelectorAll("#language")
        .forEach((x) => (x.value = e.target.value));
    });
  });

  // storage listener for cross-tab sync
  window.addEventListener("storage", (e) => {
    if (e.key === "gyansetulang") {
      document
        .querySelectorAll("#language")
        .forEach((s) => (s.value = e.newValue));
    }
  });

  // ---------- LOGOUT / LOGIN handling ----------
  // Helper to safely read current user from localStorage
  function readLocalSessionSafe() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // Helper to write local session safely (merge by timestamp if desired)
  function writeLocalSession(obj) {
    try {
      if (!obj) {
        localStorage.removeItem("gyan_current_user");
      } else {
        localStorage.setItem("gyan_current_user", JSON.stringify(obj));
      }
      localStorage.setItem("gyan_user_ping", String(Date.now()));
    } catch (e) {
      console.warn("writeLocalSession failed", e);
    }
  }

  // Primary logout function - clears local session, tries to update auth DB, and redirects.
  async function doLogout() {
    try {
      const cur = window.currentUser || readLocalSessionSafe();

      // Step 1: attempt to update auth DB record if helper exists (best-effort)
      // auth.js defines updateUserInDB / openAuthDB in some setups. Use them if available.
      if (typeof updateUserInDB === "function" && cur && cur.email) {
        try {
          const mark = Object.assign({}, cur, {
            email: String(cur.email).trim().toLowerCase(),
            isLoggedIn: false,
            updatedAt: Date.now(),
          });
          await updateUserInDB(mark).catch((e) => {
            // ignore failure, still proceed with local logout
            console.warn("updateUserInDB failed during logout", e);
          });
        } catch (e) {
          // ignore
        }
      }

      // Step 2: clear local session and global currentUser
      try {
        localStorage.removeItem("gyan_current_user");
        // keep a ping so other tabs can notice change
        localStorage.setItem("gyan_user_ping", String(Date.now()));
      } catch (e) {
        console.warn("Failed to clear local session during logout", e);
      }
      window.currentUser = null;

      // Step 3: inform app via events so UI widgets can react
      document.dispatchEvent(
        new CustomEvent("gyan:user-logged-out", {
          detail: { email: cur && cur.email ? cur.email : null },
        })
      );
      document.dispatchEvent(
        new CustomEvent("gyan:user-updated", { detail: { isLoggedIn: false } })
      );

      // Step 4: redirect to auth page (use templates path if your app uses it)
      // prefer templates/auth.html when inside templates folder; otherwise use /templates/auth.html
      const inTemplates = location.pathname.includes("/templates/");
      const authPath = inTemplates ? "/templates/auth.html" : "/templates/auth.html";
      window.location.href = authPath;
    } catch (err) {
      console.error("Logout failed", err);
      // final fallback: force redirect
      window.location.href = "/templates/auth.html";
    }
  }

  // Attach to login/logout button
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    // update UI label according to session
    function refreshLoginButtonLabel() {
      const cur = window.currentUser || readLocalSessionSafe();
      const isLogged = cur && (cur.isLoggedIn === true || cur.email);
      loginBtn.innerHTML = isLogged
        ? '<i class="fas fa-right-from-bracket"></i><span>Log Out</span>'
        : '<i class="fas fa-right-to-bracket"></i><span>Log In</span>';
    }

    refreshLoginButtonLabel();

    loginBtn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const cur = window.currentUser || readLocalSessionSafe();
      const isLogged = cur && (cur.isLoggedIn === true || cur.email);
      if (isLogged) {
        // perform logout
        await doLogout();
      } else {
        // navigate to auth page for login
        const authPath = location.pathname.includes("/templates/")
          ? "/templates/auth.html"
          : "/templates/auth.html";
        window.location.href = authPath;
      }
    });

    // update label if session changes elsewhere in the app
    document.addEventListener("gyan:user-updated", refreshLoginButtonLabel);
    document.addEventListener("gyan:user-logged-out", refreshLoginButtonLabel);
  }

  // mobile sidebar toggle
  var opened = false;
  const sidebarMobile = document.getElementById("sidebarMobile");
  const sidebar = document.querySelector(".sidebar");

  if (sidebarMobile && sidebar) {
    // ensure an <i> icon exists inside the trigger
    function ensureIcon() {
      let icon = sidebarMobile.querySelector("i");
      if (!icon) {
        icon = document.createElement("i");
        icon.setAttribute("aria-hidden", "true");
        sidebarMobile.appendChild(icon);
      }
      return icon;
    }

    function setIcon(isOpen) {
      const icon = ensureIcon();
      // reset classes to avoid leftover classes from different FA versions
      icon.className = "";
      if (isOpen) {
        // Font Awesome close icon (FA5: fas fa-times)
        icon.classList.add("fas", "fa-times");
        sidebarMobile.setAttribute("aria-label", "Close menu");
        sidebarMobile.setAttribute("aria-expanded", "true");
      } else {
        // Font Awesome bars icon (FA5: fas fa-bars)
        icon.classList.add("fas", "fa-bars");
        sidebarMobile.setAttribute("aria-label", "Open menu");
        sidebarMobile.setAttribute("aria-expanded", "false");
      }
    }

    // initialize to closed state icon
    setIcon(false);

    sidebarMobile.addEventListener("click", function (e) {
      e.preventDefault();
      if (opened) {
        sidebar.style.transform = "translateX(-100%)";
        setIcon(false);
      } else {
        sidebar.style.transform = "translateX(0)";
        setIcon(true);
      }
      opened = !opened;
    });
  }
})();
