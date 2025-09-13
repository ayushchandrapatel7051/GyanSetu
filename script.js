// Sidebar Navigation
const pages = document.querySelectorAll(".page");
const menuItems = document.querySelectorAll(".sidebar li");

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    // remove active
    menuItems.forEach((i) => i.classList.remove("active"));
    pages.forEach((p) => p.classList.remove("active"));

    // set active
    item.classList.add("active");
    document.getElementById(item.dataset.page).classList.add("active");
  });
});

// Dark/Light Mode Toggle
const toggle = document.getElementById("theme-toggle");

toggle.addEventListener("change", () => {
  if (toggle.checked) {
    document.documentElement.style.setProperty("--primary-bg", "#fff");
    document.documentElement.style.setProperty("--secondary-bg", "#f0f0f0");
    document.documentElement.style.setProperty("--text-color", "#000");
  } else {
    document.documentElement.style.setProperty("--primary-bg", "#1e0033");
    document.documentElement.style.setProperty("--secondary-bg", "#2b0052");
    document.documentElement.style.setProperty("--text-color", "#fff");
  }
});

// Login/Logout Toggle
const loginBtn = document.querySelector(".login");
let loggedIn = false;

loginBtn.addEventListener("click", () => {
  loggedIn = !loggedIn;
  loginBtn.innerHTML = loggedIn
    ? '<i class="fas fa-sign-out-alt"></i> Log Out'
    : '<i class="fas fa-sign-in-alt"></i> Log In';
});

// Language Dropdown
const languageSelect = document.getElementById("language");

languageSelect.addEventListener("change", () => {
  const lang = languageSelect.value;
  console.log("Language selected:", lang);
  // Future: you can add translation handling here
});
