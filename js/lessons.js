// js/lessons.js — lessons list with robust auto-grade selection and lastLesson
(async () => {
  const lessonsListEl = document.getElementById("lessonsList");
  const spotTitle = document.getElementById("spot-title");
  const spotBody = document.getElementById("spot-body");
  const filterGrade = document.getElementById("filterGrade");
  const filterSubject = document.getElementById("filterSubject");
  const searchLessons = document.getElementById("searchLessons");
  const continueCard = document.getElementById("continueLastLesson"); // optional; check HTML

  let lessons = [];

  async function getCurrentEmail() {
    if (window.currentUser && window.currentUser.email)
      return window.currentUser.email;
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) return parsed.email;
      }
    } catch (e) {
      console.warn("localStorage parse failed", e);
    }
    return "johndoe@email.com";
  }

  async function fetchLessonsAndInit() {
    try {
      // fetch lessons.json
      const res = await fetch("../data/lessons.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not fetch lessons.json");
      lessons = await res.json();

      // populate subject dropdown dynamically (use canonical subjects)
      const subjSet = new Set();
      for (const l of lessons) {
        const s = (l.subject || "Other").toString().trim();
        if (s) subjSet.add(s);
      }
      filterSubject.innerHTML = '<option value="">All subjects</option>';
      Array.from(subjSet)
        .sort()
        .forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          filterSubject.appendChild(opt);
        });

      // open SettingsDB and read settings
      if (window.SettingsDB && SettingsDB.openDB) await SettingsDB.openDB();
      const email = await getCurrentEmail();
      let s = null;
      if (window.SettingsDB && SettingsDB.getSettings) {
        s = await SettingsDB.getSettings(email);
      }
      if (s && s.grade != null) {
        // grade might be stored as number/string — coerce to string for comparison with filter options
        filterGrade.value = String(s.grade);
      }

      // show continue card if lastLesson present
      if (s && s.lastLesson && continueCard) {
        const last = s.lastLesson;
        const lessonObj = lessons.find((l) => l.id === last.lessonId);
        if (lessonObj) {
          continueCard.style.display = "";
          const titleEl = continueCard.querySelector(".title");
          const metaEl = continueCard.querySelector(".meta");
          const openBtn = continueCard.querySelector(".open");
          if (titleEl) titleEl.textContent = `Continue: ${lessonObj.title}`;
          if (metaEl)
            metaEl.textContent = `${lessonObj.subject} • Grade ${lessonObj.grade}`;
          if (openBtn)
            openBtn.onclick = () =>
              (window.location.href = `lesson.html?id=${encodeURIComponent(
                lessonObj.id
              )}`);
        }
      }

      // finally render list
      renderList();
    } catch (err) {
      console.error("fetchLessonsAndInit failed", err);
      lessonsListEl.innerHTML =
        "<li class='muted'>Failed to load lessons.</li>";
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
      right.innerHTML = `<div style="text-align:center;font-size:13px">${
        progress.completed ? "✓" : ""
      }</div><div style="font-size:10px;margin-top:4px">${
        progress.percent
      }%</div>`;
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

  async function getProgressForLesson(lessonId) {
    try {
      if (!window.LessonDB) return null;
      if (LessonDB.openDB) await LessonDB.openDB();
      const email = await getCurrentEmail();
      return await LessonDB.getProgress(email, lessonId);
    } catch (e) {
      console.warn("getProgressForLesson failed", e);
      return null;
    }
  }

  async function renderList() {
    lessonsListEl.innerHTML = "";
    const g = filterGrade.value;
    const s = filterSubject.value;
    const q = (searchLessons.value || "").trim().toLowerCase();

    const visible = lessons.filter((l) => {
      if (g && String(l.grade) !== String(g)) return false;
      if (s && l.subject !== s) return false;
      if (
        q &&
        !(
          (l.title || "").toLowerCase().includes(q) ||
          (l.description || "").toLowerCase().includes(q) ||
          (l.subject || "").toLowerCase().includes(q)
        )
      )
        return false;
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

  function showPreview(lesson) {
    if (!spotTitle || !spotBody) return;
    spotTitle.textContent = lesson.title;
    spotBody.innerHTML = `
      <p class="muted">${lesson.description || ""}</p>
      <p class="muted small-muted">Duration: ${
        lesson.duration_minutes || "—"
      } mins • ${lesson.grade} • ${lesson.subject}</p>
      <p style="margin-top:8px"><button class="btn btn-purple" onclick="window.location.href='lesson.html?id=${encodeURIComponent(
        lesson.id
      )}'">Open lesson</button></p>
    `;
  }

  filterGrade.addEventListener("change", renderList);
  filterSubject.addEventListener("change", renderList);
  searchLessons.addEventListener("input", () => {
    if (window._lessonSearchTimer) clearTimeout(window._lessonSearchTimer);
    window._lessonSearchTimer = setTimeout(renderList, 200);
  });

  // start
  await fetchLessonsAndInit();
})();
