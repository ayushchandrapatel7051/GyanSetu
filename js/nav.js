// nav.js - highlights active sidebar item and persists language selection
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

  // login toggle
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
