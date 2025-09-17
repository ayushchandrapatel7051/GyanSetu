// js/lessons.js — lessons list with automatic grade sync from SettingsDB and live language sync
(async () => {
  const lessonsListEl = document.getElementById("lessonsList");
  const spotTitle = document.getElementById("spot-title");
  const spotBody = document.getElementById("spot-body");
  const filterGrade = document.getElementById("filterGrade");
  const filterSubject = document.getElementById("filterSubject");
  const searchLessons = document.getElementById("searchLessons");
  const continueCard = document.getElementById("continueLastLesson"); // optional

  let lessons = [];
  const DEFAULT_EMAIL = "johndoe@email.com";

  function getEmailFromLocal() {
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) return parsed.email;
      }
    } catch (e) {
      console.warn("localStorage parse failed", e);
    }
    return null;
  }

  async function getCurrentEmail() {
    if (window.currentUser && window.currentUser.email) return window.currentUser.email;
    const fromLocal = getEmailFromLocal();
    return fromLocal || DEFAULT_EMAIL;
  }

  /* ========================
     Language resolution
     Prefer SettingsDB -> GyanSetu API -> #gs-language -> localStorage
     ======================== */
  async function getUserLanguage() {
    try {
      // 1) Try SettingsDB for canonical language
      let email = null;
      try {
        const raw = localStorage.getItem("gyan_current_user");
        if (raw) email = JSON.parse(raw).email || null;
      } catch (e) {}
      if (!email && window.currentUser?.email) email = window.currentUser.email;

      if (email && window.SettingsDB && typeof SettingsDB.getSettings === "function") {
        try {
          const s = await SettingsDB.getSettings(email);
          if (s && s.language) return String(s.language).slice(0,2).toLowerCase();
        } catch (e) {
          // ignore and fall through
        }
      }

      // 2) global getter
      if (window.GyanSetu && typeof window.GyanSetu.getCurrentLanguage === "function") {
        try {
          const g = window.GyanSetu.getCurrentLanguage();
          if (g) return String(g).slice(0,2).toLowerCase();
        } catch (e) {}
      }

      // 3) top-right DOM selector
      try {
        const sel = document.querySelector("#gs-language");
        if (sel && sel.value) return String(sel.value).slice(0,2).toLowerCase();
      } catch (e) {}

      // 4) local storage current user
      try {
        const raw = localStorage.getItem("gyan_current_user");
        if (raw) {
          const parsed = JSON.parse(raw || "{}");
          if (parsed && parsed.language) return String(parsed.language).slice(0,2).toLowerCase();
        }
      } catch (e) {}

      // 5) guest fallback
      try {
        const rawg = localStorage.getItem("gyan_guest_language");
        if (rawg) {
          const parsed = JSON.parse(rawg || "{}");
          if (parsed && parsed.language) return String(parsed.language).slice(0,2).toLowerCase();
        }
      } catch (e) {}

    } catch (err) {
      console.warn("getUserLanguage error", err);
    }
    return "en";
  }

  /* ========================
     Fetch lessons.json and build subject dropdown
     ======================== */
  async function fetchLessonsFile() {
    try {
      const res = await fetch("../data/lessons.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not fetch lessons.json");
      lessons = await res.json();

      const subjSet = new Set();
      for (const l of lessons) {
        const s = (l.subject || "Other").toString().trim();
        if (s) subjSet.add(s);
      }
      filterSubject.innerHTML = '<option value="">All subjects</option>';
      Array.from(subjSet).sort().forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = s;
        filterSubject.appendChild(opt);
      });
    } catch (err) {
      console.error("fetchLessonsFile failed", err);
      lessonsListEl.innerHTML = "<li class='muted'>Failed to load lessons.</li>";
    }
  }

  /* ========================
     LessonDB progress helper
     ======================== */
  async function getProgressForLesson(lessonId) {
    try {
      if (!window.LessonDB) return null;
      if (LessonDB.openDB) await LessonDB.openDB();
      const email = await getCurrentEmail();
      if (!LessonDB.getProgress) return null;
      return await LessonDB.getProgress(email, lessonId);
    } catch (e) {
      console.warn("getProgressForLesson failed", e);
      return null;
    }
  }

  /* ========================
     Language-aware view for a lesson
     Returns { title, description, subject, grade, duration_minutes, content }
     Fallback to base lesson fields when translation missing.
     ======================== */
  function lessonForLang(lesson, lang) {
    lang = (lang || "en").slice(0,2).toLowerCase();
    const translations = lesson.translations || {};
    const alias = lang === "od" ? "or" : lang; // alias for Odia
    const override = translations[lang] || translations[alias] || null;
    if (!override) {
      return {
        title: lesson.title,
        description: lesson.description || "",
        subject: lesson.subject,
        grade: lesson.grade,
        duration_minutes: lesson.duration_minutes,
        content: lesson.content || []
      };
    }
    return {
      title: override.title || lesson.title,
      description: override.description || lesson.description || "",
      subject: override.subject || lesson.subject,
      grade: override.grade || lesson.grade,
      duration_minutes: override.duration_minutes || lesson.duration_minutes,
      content: override.content || lesson.content || []
    };
  }

  /* ========================
     Create list item and preview using translated fields
     ======================== */
  function createLessonItem(lessonView, originalLesson, progress) {
    // lessonView is result of lessonForLang(lesson, lang)
    const li = document.createElement("li");
    li.className = "lesson-item";
    li.style.cursor = "pointer";

    const left = document.createElement("span");
    left.className = "lesson-text";
    const name = document.createElement("span");
    name.className = "lesson-name";
    name.textContent = lessonView.title;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${lessonView.grade} • ${lessonView.subject}`;

    left.appendChild(name);
    left.appendChild(meta);

    const right = document.createElement("span");
    right.className = "lesson-arrow";
    if (progress && typeof progress.percent === "number") {
      right.innerHTML = `<div style="text-align:center;font-size:13px">${progress.completed ? '✓' : ''}</div><div style="font-size:10px;margin-top:4px">${progress.percent}%</div>`;
    } else {
      right.innerHTML = `<i class="fas fa-arrow-right"></i>`;
    }

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener("click", () => {
      window.location.href = `lesson.html?id=${encodeURIComponent(originalLesson.id)}`;
    });

    li.addEventListener("mouseenter", () => showPreview(originalLesson, lessonView));
    li.addEventListener("focus", () => showPreview(originalLesson, lessonView));
    return li;
  }

  function showPreview(originalLesson, lessonView) {
    if (!spotTitle || !spotBody) return;
    // lessonView may be missing when calling showPreview from other places; ensure view available
    const view = lessonView || lessonForLang(originalLesson, window.__lastKnownLang || "en");
    spotTitle.textContent = view.title;
    spotBody.innerHTML = `
      <p class="muted">${view.description || ""}</p>
      <p class="muted small-muted">Duration: ${view.duration_minutes || "—"} mins • ${view.grade} • ${view.subject}</p>
      <p style="margin-top:8px"><button class="btn btn-purple" onclick="window.location.href='lesson.html?id=${encodeURIComponent(originalLesson.id)}'">Open lesson</button></p>
    `;
  }

  /* ========================
     Render visible lessons applying filters and current language
     ======================== */
  async function renderList() {
    lessonsListEl.innerHTML = "";
    const g = filterGrade.value;
    const s = filterSubject.value;
    const q = (searchLessons.value || "").trim().toLowerCase();

    // determine language once per render
    const lang = await getUserLanguage();
    window.__lastKnownLang = lang;

    const visible = lessons.filter((l) => {
      // apply grade/subject/search on base fields (you could also apply translation-aware filtering if desired)
      if (g && String(l.grade) !== String(g)) return false;
      if (s && l.subject !== s) return false;
      if (q && !(
        (l.title || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.subject || "").toLowerCase().includes(q)
      )) return false;
      return true;
    });

    if (!visible.length) {
      lessonsListEl.innerHTML = "<li class='muted'>No lessons found.</li>";
      return;
    }

    // build items sequentially (progress lookup is async)
    for (const l of visible) {
      // produce language-specific view:
      const view = lessonForLang(l, lang);
      const prog = await getProgressForLesson(l.id);
      const li = createLessonItem(view, l, prog);
      lessonsListEl.appendChild(li);
    }
  }

  /* ========================
     Sync grade and lastLesson from SettingsDB (and set filter grade)
     ======================== */
  async function syncFromSettings() {
    try {
      if (!window.SettingsDB) {
        return renderList();
      }
      if (SettingsDB.openDB) await SettingsDB.openDB();
      const email = await getCurrentEmail();
      const s = await SettingsDB.getSettings(email);

      if (s && s.grade != null) {
        const gradeStr = String(s.grade);
        if (![...filterGrade.options].some(o => o.value === gradeStr)) {
          const opt = document.createElement("option");
          opt.value = gradeStr;
          opt.textContent = `Grade ${gradeStr}`;
          filterGrade.appendChild(opt);
        }
        filterGrade.value = gradeStr;
      }

      if (s && s.lastLesson && continueCard) {
        const last = s.lastLesson;
        const lessonObj = lessons.find(l => l.id === last.lessonId);
        if (lessonObj) {
          continueCard.style.display = "";
          const titleEl = continueCard.querySelector(".title");
          const metaEl = continueCard.querySelector(".meta");
          const openBtn = continueCard.querySelector(".open");
          if (titleEl) {
            // show translated title in continue card
            const lang = await getUserLanguage();
            titleEl.textContent = `Continue: ${lessonForLang(lessonObj, lang).title}`;
          }
          if (metaEl) metaEl.textContent = `${lessonObj.subject} • Grade ${lessonObj.grade}`;
          if (openBtn) openBtn.onclick = () => window.location.href = `lesson.html?id=${encodeURIComponent(lessonObj.id)}`;
        }
      }
    } catch (e) {
      console.warn("syncFromSettings failed", e);
    } finally {
      await renderList();
    }
  }

  // Expose to global so login/profile flow can call it immediately after a change
  window.syncLessonsFromSettings = syncFromSettings;

  /* ========================
     Watchers for language / settings changes
     - gyan:user-updated (main.js)
     - storage (other tabs)
     - poll SettingsDB (defensive)
     ======================== */
  document.addEventListener("gyan:user-updated", async () => {
    await syncFromSettings();
  });

  window.addEventListener("storage", async (ev) => {
    if (!ev) return;
    if (["gyan_current_user", "gyan_guest_language", "gyan_user_ping"].includes(ev.key)) {
      await syncFromSettings();
    }
  });

  // lightweight poll of SettingsDB for changes to language (defensive)
  let _lastLangPolled = null;
  async function pollLangAndSync() {
    try {
      const lang = await getUserLanguage();
      if (lang !== _lastLangPolled) {
        _lastLangPolled = lang;
        await syncFromSettings();
      }
    } catch (e) {}
  }
  setTimeout(pollLangAndSync, 250);
  const pollId = setInterval(pollLangAndSync, 1500);
  window.addEventListener("beforeunload", () => clearInterval(pollId));

  /* ========================
     UI events
     ======================== */
  filterGrade.addEventListener("change", renderList);
  filterSubject.addEventListener("change", renderList);
  searchLessons.addEventListener("input", () => {
    if (window._lessonSearchTimer) clearTimeout(window._lessonSearchTimer);
    window._lessonSearchTimer = setTimeout(renderList, 200);
  });

  // Init
  await fetchLessonsFile();
  await syncFromSettings();

  // If your auth flow sets window.currentUser later, call window.syncLessonsFromSettings() afterwards.
})();
