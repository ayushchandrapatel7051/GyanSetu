// script.js - fixed version (page switching, login toggle, theme toggle)

// Page navigation
const menuItems = document.querySelectorAll(".menu-item");
const pages = document.querySelectorAll(".page");

// helper: show a page by id and hide others
function showPageById(pageId) {
  pages.forEach((p) => p.classList.remove("active"));
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  // update sidebar active state
  menuItems.forEach((i) => i.classList.remove("active"));
  const menuItem = Array.from(menuItems).find(
    (mi) => mi.dataset.page === pageId
  );
  if (menuItem) menuItem.classList.add("active");

  // scroll main content to top when switching
  const content = document.querySelector(".content");
  if (content) content.scrollTop = 0;
}

// attach click handlers for menu items
menuItems.forEach((item) => {
  const target = item.dataset.page;
  if (!target) return; // skip if no data-page

  item.addEventListener("click", () => {
    showPageById(target);
  });
});

// Ensure at least one page is visible (fallback to first)
if (!document.querySelector(".page.active")) {
  const firstPage = pages[0];
  if (firstPage) firstPage.classList.add("active");
  if (menuItems[0]) menuItems[0].classList.add("active");
}

// Login/logout toggle (defensive)
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  let loggedIn = false;
  loginBtn.addEventListener("click", () => {
    loggedIn = !loggedIn;
    loginBtn.innerHTML = loggedIn
      ? '<i class="fas fa-right-from-bracket"></i><span>Log Out</span>'
      : '<i class="fas fa-right-to-bracket"></i><span>Log In</span>';
  });
}

// Theme toggle (dark <-> light) - optional, only if toggle exists
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      // light theme
      document.documentElement.style.setProperty("--bg-1", "#ffffff");
      document.documentElement.style.setProperty("--bg-2", "#f6f6f8");
      document.documentElement.style.setProperty("--text", "#111827");
      document.documentElement.style.setProperty("--muted", "rgba(0,0,0,0.45)");
      document.documentElement.style.setProperty("--card", "rgba(0,0,0,0.03)");
    } else {
      // restore dark theme (matching your CSS defaults)
      document.documentElement.style.setProperty("--bg-1", "#16002a");
      document.documentElement.style.setProperty("--bg-2", "#2a0b3f");
      document.documentElement.style.setProperty("--text", "#ffffff");
      document.documentElement.style.setProperty(
        "--muted",
        "rgba(255,255,255,0.65)"
      );
      document.documentElement.style.setProperty(
        "--card",
        "rgba(255,255,255,0.04)"
      );
    }
  });
}
