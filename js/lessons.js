// js/lessons.js — lessons list with automatic grade sync from SettingsDB and live sync
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

  // fetch lessons.json and build subject dropdown
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

  // Lesson progress getter (LessonDB wrapper)
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

  function createLessonItem(lesson, progress) {
    const li = document.createElement("li");
    li.className = "lesson-item";
    li.style.cursor = "pointer";

    const left = document.createElement("span");
    left.className = "lesson-text";
    const name = document.createElement("span");
    name.className = "lesson-name";
    name.textContent = lesson.title;
    const meta = document.createElement("span");
    meta.className = "muted";
    meta.textContent = `${lesson.grade} • ${lesson.subject}`;

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
      window.location.href = `lesson.html?id=${encodeURIComponent(lesson.id)}`;
    });

    li.addEventListener("mouseenter", () => showPreview(lesson));
    li.addEventListener("focus", () => showPreview(lesson));
    return li;
  }

  function showPreview(lesson) {
    if (!spotTitle || !spotBody) return;
    spotTitle.textContent = lesson.title;
    spotBody.innerHTML = `
      <p class="muted">${lesson.description || ""}</p>
      <p class="muted small-muted">Duration: ${lesson.duration_minutes || "—"} mins • ${lesson.grade} • ${lesson.subject}</p>
      <p style="margin-top:8px"><button class="btn btn-purple" onclick="window.location.href='lesson.html?id=${encodeURIComponent(lesson.id)}'">Open lesson</button></p>
    `;
  }

  // Render visible lessons applying filters
  async function renderList() {
    lessonsListEl.innerHTML = "";
    const g = filterGrade.value;
    const s = filterSubject.value;
    const q = (searchLessons.value || "").trim().toLowerCase();

    const visible = lessons.filter((l) => {
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

    for (const l of visible) {
      const prog = await getProgressForLesson(l.id);
      const li = createLessonItem(l, prog);
      lessonsListEl.appendChild(li);
    }
  }

  // Sync grade and lastLesson from SettingsDB
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
          if (titleEl) titleEl.textContent = `Continue: ${lessonObj.title}`;
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

  // Listen for localStorage changes (other tabs) and also watch for explicit calls
  window.addEventListener("storage", (ev) => {
    if (ev.key === "gyan_current_user") {
      syncFromSettings();
    }
  });

  // UI events: filters & search
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
