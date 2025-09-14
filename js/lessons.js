// js/lessons.js
// Renders lessons list, filter, preview, and links to lesson.html?id=...

(async () => {
  const lessonsListEl = document.getElementById("lessonsList");
  const spotTitle = document.getElementById("spot-title");
  const spotBody = document.getElementById("spot-body");
  const filterGrade = document.getElementById("filterGrade");
  const filterSubject = document.getElementById("filterSubject");
  const searchLessons = document.getElementById("searchLessons");

  let lessons = [];

  async function fetchLessons() {
    try {
      const res = await fetch("../data/lessons.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not fetch lessons");
      lessons = await res.json();
      renderList();
    } catch (err) {
      lessonsListEl.innerHTML =
        "<li class='muted'>Failed to load lessons.</li>";
      console.error(err);
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

    // show progress inside arrow area optionally
    if (progress && typeof progress.percent === "number") {
      right.innerHTML = `<div style="text-align:center;font-size:13px"></div><div style="font-size:10px;margin-top:4px">${progress.percent}%</div></div>`;
    } else {
      right.innerHTML = `<i class="fas fa-arrow-right"></i>`;
    }

    li.appendChild(left);
    li.appendChild(right);

    li.addEventListener("click", () => {
      // open lesson viewer
      window.location.href = `lesson.html?id=${encodeURIComponent(lesson.id)}`;
    });

    // preview on hover / focus
    li.addEventListener("mouseenter", () => showPreview(lesson));
    li.addEventListener("focus", () => showPreview(lesson));

    return li;
  }

  async function getProgressForLesson(lessonId) {
    try {
      const current = localStorage.getItem("gyan_current_user");
      let email = null;
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed && parsed.email) email = parsed.email;
      }
      const p = await window.LessonDB.getProgress(email, lessonId);
      return p || null;
    } catch (e) {
      return null;
    }
  }

  async function renderList() {
    lessonsListEl.innerHTML = "";
    const g = filterGrade.value;
    const s = filterSubject.value;
    const q = searchLessons.value.trim().toLowerCase();

    const visible = lessons.filter((L) => {
      if (g && String(L.grade) !== String(g)) return false;
      if (s && L.subject !== s) return false;
      if (
        q &&
        !(
          (L.title || "").toLowerCase().includes(q) ||
          (L.description || "").toLowerCase().includes(q) ||
          (L.subject || "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });

    if (!visible.length) {
      lessonsListEl.innerHTML = "<li class='muted'>No lessons found.</li>";
      return;
    }

    // render with progress loaded in parallel
    for (const l of visible) {
      const prog = await getProgressForLesson(l.id);
      const li = createLessonItem(l, prog);
      lessonsListEl.appendChild(li);
    }
  }

  function showPreview(lesson) {
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
    // debounce small
    if (window._lessonSearchTimer) clearTimeout(window._lessonSearchTimer);
    window._lessonSearchTimer = setTimeout(renderList, 200);
  });

  // initial load
  await fetchLessons();
})();
