// js/auth.js — modified to sync with SettingsDB

// ---------------------------
// Helper: ensure SettingsDB record exists for this user
async function ensureSettingsForUser(user) {
  if (!window.SettingsDB || !SettingsDB.openDB) {
    return;
  }
  try {
    await SettingsDB.openDB();
    const email = (user && user.email) ? String(user.email).toLowerCase() : null;
    if (!email) return;

    let s = null;
    try {
      s = await SettingsDB.getSettings(email);
    } catch (e) {
      s = null;
    }

    const merged = Object.assign({}, s || {}, {
      email: email,
      name:
        user.name ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        (s && s.name) ||
        "",
      grade:
        user.grade != null
          ? String(user.grade)
          : (s && s.grade) != null
          ? s.grade
          : "8",
      language: (function (l) {
        const v = String(l || (s && s.language) || "en").trim().toLowerCase();
        if (v === "english" || v.startsWith("en")) return "en";
        if (v === "hindi" || v.startsWith("hi")) return "hi";
        if (v === "odia" || v.startsWith("or")) return "or";
        return v;
      })(user.language),
      avatar: (s && s.avatar) || user.avatar || "../assets/avatar.jpg",
      badges: (s && s.badges) || user.badges || [],
      xp: s && s.xp != null ? s.xp : user.xp != null ? user.xp : 0,
      lastLesson: (s && s.lastLesson) || null,
    });

    await SettingsDB.saveSettings(merged);
    console.debug("SettingsDB synced for", email);
  } catch (err) {
    console.warn("ensureSettingsForUser failed", err);
  }
}

// ---------------------------
// Existing auth.js code (signup/login)

// (your form handling etc. unchanged)

// Example signup handler (insert ensureSettingsForUser after saving user)
async function signupUser(user) {
  try {
    await addUserToDB(user);
    saveUserLocal(user);

    // NEW: also sync to SettingsDB
    try {
      ensureSettingsForUser(user);
    } catch (e) {
      console.warn("Failed to ensure settings at signup", e);
    }

    // redirect or success message
    window.location.href = "../index.html";
  } catch (e) {
    console.error("Signup failed", e);
    alert("Signup failed. Please try again.");
  }
}

// Login success
async function loginSuccess(user) {
  localStorage.setItem(
    "gyan_current_user",
    JSON.stringify({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name || `${user.firstName} ${user.lastName}`,
      grade: user.grade,
      language: normalizeLanguage(user.language),
      phone: user.phone,
    })
  );

  // NEW: ensure SettingsDB record
  try {
    await ensureSettingsForUser(user);
  } catch (e) {
    console.warn("Failed to ensure settings at login", e);
  }

  setTimeout(() => {
    window.location.href = "../index.html";
  }, 700);
}

// keep your other existing functions (normalizeLanguage, addUserToDB, saveUserLocal, etc.)
