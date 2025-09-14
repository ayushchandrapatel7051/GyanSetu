// auth.js
// Updated signup/login code — now includes XP, Milestones, Progress, Badges, streak,
// quizzes_completed, lessons_completed, avatar. Login sets isLoggedIn and lastActive in DB.

(() => {
  const dbName = "gyansetu-auth";
  const storeName = "users";
  const dbVersion = 1;

  // DOM refs
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const loginMsg = document.getElementById("loginMsg");
  const signupMsg = document.getElementById("signupMsg");

  // Open or create DB
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, dbVersion);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: "email" });
          store.createIndex("phone", "phone", { unique: false });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  function addUserToDB(user) {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const addReq = store.add(user);
        addReq.onsuccess = () => resolve(true);
        addReq.onerror = (ev) => reject(ev.target.error);
      });
    });
  }

  function updateUserInDB(user) {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const putReq = store.put(user);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = (ev) => reject(ev.target.error);
      });
    });
  }

  function getUserByEmail(email) {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const getReq = store.get(email);
        getReq.onsuccess = (e) => resolve(e.target.result);
        getReq.onerror = (e) => reject(e.target.error);
      });
    });
  }

  // localStorage save
  function saveUserLocal(user) {
    try {
      localStorage.setItem(`gyan_user_${user.email}`, JSON.stringify(user));
      localStorage.setItem("gyan_last_user", user.email);
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }

  // toggle tabs
  function showLogin() {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.style.display = "";
    signupForm.style.display = "none";
    clearMsgs();
  }
  function showSignup() {
    tabLogin.classList.remove("active");
    tabSignup.classList.add("active");
    loginForm.style.display = "none";
    signupForm.style.display = "";
    clearMsgs();
  }
  tabLogin.addEventListener("click", showLogin);
  tabSignup.addEventListener("click", showSignup);

  function clearMsgs() {
    loginMsg.textContent = "";
    signupMsg.textContent = "";
    loginMsg.className = "form-msg";
    signupMsg.className = "form-msg";
  }

  // signup handler
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupMsg.textContent = "";
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document
      .getElementById("signupEmail")
      .value.trim()
      .toLowerCase();
    const grade = document.getElementById("grade").value;
    const language = document.getElementById("languagePref").value;
    const phone = document.getElementById("phoneNumber").value.trim();
    const password = document.getElementById("signupPassword").value;

    // basic validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !grade ||
      !language ||
      !phone ||
      !password
    ) {
      signupMsg.textContent = "Please fill all fields.";
      signupMsg.classList.add("error");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      signupMsg.textContent = "Invalid India phone number.";
      signupMsg.classList.add("error");
      return;
    }

    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        signupMsg.textContent = "An account with this email already exists.";
        signupMsg.classList.add("error");
        return;
      }

      // Default progress subjects object (you can expand subjects later)
      const defaultProgress = {
        Maths: 0,
        Science: 0,
        English: 0,
      };

      // user object with extra fields requested
      const user = {
        email,
        firstName,
        lastName,
        grade,
        language,
        phone: "+91" + phone,
        // NOTE: demo only, not secure. In production, hash + server-side storage required.
        password: btoa(password), // lightweight obfuscation only
        createdAt: Date.now(),

        // Additional fields requested
        xp: 0,
        milestones: [],
        progress: defaultProgress, // object of subjects -> percent
        badges: [],
        streak: 0,
        quizzes_completed: [], // array of quiz ids
        lessons_completed: [], // array of lesson ids
        avatar: null, // avatar id or URL
        isLoggedIn: false, // not logged in immediately after signup
        lastActive: null,
      };

      await addUserToDB(user);
      saveUserLocal(user);

      signupMsg.textContent = "Account created ✅ You can log in now.";
      signupMsg.classList.add("success");

      // auto-switch to login after small delay
      setTimeout(() => {
        showLogin();
        document.getElementById("loginEmail").value = email;
      }, 700);
    } catch (err) {
      console.error("Signup error", err);
      signupMsg.textContent = "Sign up failed. Try again.";
      signupMsg.classList.add("error");
    }
  });

  // login handler
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMsg.textContent = "";
    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      loginMsg.textContent = "Enter email and password.";
      loginMsg.classList.add("error");
      return;
    }

    try {
      let user = await getUserByEmail(email);
      if (!user) {
        // fallback to localStorage
        const raw = localStorage.getItem(`gyan_user_${email}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.password === btoa(password)) {
            // success: mark in DB as logged in (create record in DB if absent)
            user = parsed;
            try {
              // ensure DB has the user record
              await addUserToDB({
                ...user,
                isLoggedIn: true,
                lastActive: Date.now(),
              });
            } catch (e) {
              // if addUserToDB fails because already exists, attempt update
              try {
                await updateUserInDB({
                  ...user,
                  isLoggedIn: true,
                  lastActive: Date.now(),
                });
              } catch (_) {}
            }
            loginSuccess(user);
            return;
          }
        }
        loginMsg.textContent = "Account not found.";
        loginMsg.classList.add("error");
        return;
      }

      if (user.password === btoa(password)) {
        // mark as logged in in DB
        user.isLoggedIn = true;
        user.lastActive = Date.now();
        await updateUserInDB(user);
        // update localStorage copy
        saveUserLocal(user);
        loginSuccess(user);
      } else {
        loginMsg.textContent = "Incorrect password.";
        loginMsg.classList.add("error");
      }
    } catch (err) {
      console.error("Login error", err);
      loginMsg.textContent = "Login failed. Try again.";
      loginMsg.classList.add("error");
    }
  });

  function loginSuccess(user) {
    loginMsg.textContent = `Welcome back, ${user.firstName}! Redirecting...`;
    loginMsg.classList.add("success");
    // store current logged user to localStorage (light safe subset)
    localStorage.setItem(
      "gyan_current_user",
      JSON.stringify({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        grade: user.grade,
        language: user.language,
        phone: user.phone,
      })
    );
    // small delay then go to index
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 700);
  }

  // simple "forgot" button demo
  document.getElementById("forgotBtn").addEventListener("click", () => {
    const email = document
      .getElementById("loginEmail")
      .value.trim()
      .toLowerCase();
    if (!email) {
      loginMsg.textContent = "Enter your email to recover.";
      loginMsg.classList.add("error");
      return;
    }
    getUserByEmail(email)
      .then((user) => {
        if (!user) {
          loginMsg.textContent = "Account not found.";
          loginMsg.classList.add("error");
        } else {
          loginMsg.textContent = `Password hint: (first 2 letters) ${atob(
            user.password
          ).slice(0, 2)}●●●`;
          loginMsg.classList.add("success");
        }
      })
      .catch((err) => {
        loginMsg.textContent = "Could not recover password.";
        loginMsg.classList.add("error");
      });
  });

  // optional: expose a logout helper that other pages can call
  window.gyanLogout = async function () {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (raw) {
        const cu = JSON.parse(raw);
        const user = await getUserByEmail(cu.email);
        if (user) {
          user.isLoggedIn = false;
          await updateUserInDB(user);
        }
      }
    } catch (e) {
      console.warn("Logout cleanup failed", e);
    } finally {
      // clear local session data and go to auth
      localStorage.removeItem("gyan_current_user");
      location.href = "auth.html";
    }
  };

  // init page: show login
  showLogin();
})();
