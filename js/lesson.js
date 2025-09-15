// js/lesson.js
// Loads lessons from lessons.json, renders content, tracks reading progress and time spent.

(async () => {
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  const lessonId = qs("id");
  const titleEl = document.getElementById("lessonTitle");
  const descEl = document.getElementById("lessonDescription");
  const metaContainer = document.getElementById("metaContainer");
  const contentEl = document.getElementById("lessonContent");
  const progressFill = document.getElementById("lessonProgressFill");
  const percentEl = document.getElementById("lessonPercent");
  const timeSpentEl = document.getElementById("timeSpent");
  const markBtn = document.getElementById("markComplete");
  const backBtn = document.getElementById("backToLessons");
  const bookmarkBtn = document.getElementById("bookmarkBtn");

  if (!lessonId) {
    location.href = "lessons.html";
    return;
  }

  // fetch lessons.json
  let lesson = null;
  try {
    const res = await fetch("../data/lessons.json", { cache: "no-store" });
    const list = await res.json();
    lesson = list.find((l) => l.id === lessonId);
    if (!lesson) throw new Error("Lesson not found");
  } catch (err) {
    console.error(err);
    titleEl.textContent = "Lesson not found";
    contentEl.innerHTML =
      "<p class='muted'>This lesson could not be loaded.</p>";
    return;
  }

  // render header
  titleEl.textContent = lesson.title;
  descEl.textContent = lesson.description || "";
  metaContainer.innerHTML = `${lesson.subject} • Grade ${lesson.grade} • ${
    lesson.duration_minutes || "—"
  } mins`;

  // find current user email (same approach used elsewhere)
  const currentRaw = localStorage.getItem("gyan_current_user");
  const email = currentRaw ? JSON.parse(currentRaw).email || null : null;
  const idKey = (email || "anon") + "__" + lessonId;

  // ensure LessonDB open (if the wrapper supports open)
  try {
    if (window.LessonDB && LessonDB.openDB) await LessonDB.openDB();
  } catch (e) {
    /* ignore */
  }

  // load saved progress
  let savedProgress = null;
  try {
    savedProgress = await window.LessonDB.getProgress(email, lessonId);
  } catch (e) {
    console.warn("LessonDB.getProgress failed:", e);
    savedProgress = null;
  }

  if (!savedProgress) {
    savedProgress = {
      id: idKey,
      email: email,
      lessonId,
      completed: false,
      percent: 0,
      timeSpentSeconds: 0,
      lastViewedAt: Date.now(),
    };
    try {
      // create initial entry immediately so other pages can read it
      await window.LessonDB.saveProgress(savedProgress);
    } catch (e) {
      console.warn("Initial saveProgress failed", e);
    }
  }

  // If lesson already completed, reflect that in UI and disable the mark button
  function setCompletedUI() {
    markBtn.textContent = "Completed ✓";
    markBtn.disabled = true;
    savedProgress.completed = true;
    savedProgress.percent = 100;
    updateUI(100);
  }
  if (savedProgress.completed) {
    setCompletedUI();
  } else if (savedProgress.percent && savedProgress.percent >= 100) {
    // normalization: if percent recorded as 100 but completed false, mark completed
    savedProgress.completed = true;
    try {
      await window.LessonDB.saveProgress(savedProgress);
    } catch (e) {}
    setCompletedUI();
  } else {
    updateUI(savedProgress.percent || 0);
  }

  // Also store last opened lesson into SettingsDB so app remembers last lesson
  try {
    if (
      window.SettingsDB &&
      SettingsDB.getSettings &&
      SettingsDB.saveSettings
    ) {
      const DEFAULT_EMAIL = "johndoe@email.com";
      let settingsEmail = email || DEFAULT_EMAIL;
      let s = await SettingsDB.getSettings(settingsEmail);
      if (!s) {
        // seed minimal settings record if not present
        s = {
          email: settingsEmail,
          name:
            settingsEmail === DEFAULT_EMAIL
              ? "John Doe"
              : settingsEmail.split("@")[0],
          language: "en",
          grade: String(lesson.grade || "8"),
          avatar: "../assets/avatar.jpg",
          badges: [],
          xp: 0,
        };
      }
      s.lastLesson = {
        lessonId,
        viewedAt: Date.now(),
        subject: lesson.subject,
        grade: lesson.grade,
      };
      await SettingsDB.saveSettings(s);
    }
  } catch (e) {
    console.warn("Could not save lastLesson to SettingsDB", e);
  }

  // timer
  let startedAt = Date.now();
  let tickTimer = null;
  function startTimer() {
    if (tickTimer) return;
    tickTimer = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - startedAt) / 1000);
      const total = savedProgress.timeSpentSeconds + delta;
      timeSpentEl.textContent = `${total}s`;
    }, 1000);
  }
  function stopTimer() {
    if (!tickTimer) return;
    clearInterval(tickTimer);
    tickTimer = null;
    const now = Date.now();
    const delta = Math.floor((now - startedAt) / 1000);
    savedProgress.timeSpentSeconds += delta;
    startedAt = now;
  }

  // render lesson content
  contentEl.innerHTML = "";
  lesson.content.forEach((block, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "block fade-in";
    wrapper.dataset.blockIdx = idx;

    switch (block.type) {
      case "heading": {
        const tag = block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
        wrapper.innerHTML = `<${tag} class="lesson-heading">${escapeHTML(
          block.text
        )}</${tag}>`;
        break;
      }
      case "paragraph":
        wrapper.innerHTML = `<p>${escapeHTML(block.text)}</p>`;
        break;
      case "image": {
        const imgStyles = [];
        if (block.width) imgStyles.push(`width:${block.width}`);
        if (block.height) imgStyles.push(`height:${block.height}`);
        imgStyles.push("border-radius:8px");
        imgStyles.push("display:block");
        imgStyles.push("margin:1rem");
        wrapper.innerHTML = `<figure>
          <img src="${block.src}" alt="${escapeHTML(
          block.alt || ""
        )}" style="${imgStyles.join(";")}" />
          ${
            block.caption
              ? `<figcaption class="muted small-muted">${escapeHTML(
                  block.caption
                )}</figcaption>`
              : ""
          }
        </figure>`;
        break;
      }
      case "video":
        wrapper.innerHTML = `<video controls controlsList="nodownload" style="max-width:100%;border-radius:8px">
          <source src="${block.src}">
        </video>${
          block.caption
            ? `<div class="muted small-muted">${escapeHTML(
                block.caption
              )}</div>`
            : ""
        }`;
        break;
      case "list": {
        const listTag = block.ordered ? "ol" : "ul";
        const items = (block.items || [])
          .map((i) => `<li>${escapeHTML(i)}</li>`)
          .join("");
        wrapper.innerHTML = `<${listTag}>${items}</${listTag}>`;
        break;
      }
      case "quiz":
        wrapper.innerHTML = `<div class="muted">Quiz embedded: <a href="../quiz.html?quiz=${encodeURIComponent(
          block.quiz_id
        )}">Open Quiz</a></div>`;
        break;
      default:
        wrapper.innerHTML = `<p class="muted">[Unsupported block type: ${escapeHTML(
          block.type
        )}]</p>`;
    }

    contentEl.appendChild(wrapper);
  });

  // observe blocks for progress
  const blocks = Array.from(contentEl.querySelectorAll(".block"));
  let seenBlocks = new Set();
  if (savedProgress.percent && savedProgress.completed) updateUI(100);
  else updateUI(savedProgress.percent || 0);

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          seenBlocks.add(String(entry.target.dataset.blockIdx));
          const percent = Math.round((seenBlocks.size / blocks.length) * 100);
          savedProgress.percent = percent;
          savedProgress.lastViewedAt = Date.now();
          updateUI(percent);
        }
      });
    },
    { threshold: [0.5] }
  );
  blocks.forEach((b) => io.observe(b));

  // start timer and save periodically
  startTimer();
  let autosaveTimer = setInterval(async () => {
    const now = Date.now();
    const delta = Math.floor((now - startedAt) / 1000);
    savedProgress.timeSpentSeconds += delta;
    savedProgress.lastViewedAt = Date.now();
    try {
      await window.LessonDB.saveProgress(savedProgress);
      localStorage.setItem(
        "lesson_progress_" + lessonId,
        JSON.stringify(savedProgress)
      );
    } catch (e) {
      console.warn("Autosave failed", e);
    }
    startedAt = now;
  }, 10000);

  function updateUI(percent) {
    progressFill.style.width = Math.min(Math.max(percent, 0), 100) + "%";
    percentEl.textContent = Math.round(percent) + "%";
    // if 100% consider completed (but do not auto-disable unless markComplete clicked)
    if (percent >= 100) {
      // reflect visual complete but keep button enabled until user explicitly marks complete
      progressFill.classList.add("completed");
    } else {
      progressFill.classList.remove("completed");
    }
  }

  markBtn.addEventListener("click", async () => {
    savedProgress.percent = 100;
    savedProgress.completed = true;
    savedProgress.lastViewedAt = Date.now();
    stopTimer();
    try {
      await window.LessonDB.saveProgress(savedProgress);
      localStorage.setItem(
        "lesson_progress_" + lessonId,
        JSON.stringify(savedProgress)
      );
    } catch (e) {
      console.warn("Save on markComplete failed", e);
    }
    // also update lastLesson in SettingsDB
    try {
      if (
        window.SettingsDB &&
        SettingsDB.getSettings &&
        SettingsDB.saveSettings
      ) {
        const DEFAULT_EMAIL = "johndoe@email.com";
        let settingsEmail = email || DEFAULT_EMAIL;
        let s = await SettingsDB.getSettings(settingsEmail);
        if (!s) {
          s = {
            email: settingsEmail,
            name:
              settingsEmail === DEFAULT_EMAIL
                ? "John Doe"
                : settingsEmail.split("@")[0],
            language: "en",
            grade: lesson.grade ? String(lesson.grade) : "8",
            avatar: "../assets/avatar.jpg",
            badges: [],
            xp: 0,
          };
        }
        s.lastLesson = {
          lessonId,
          completed: true,
          viewedAt: Date.now(),
          subject: lesson.subject,
          grade: lesson.grade,
        };
        await SettingsDB.saveSettings(s);
      }
    } catch (e) {
      console.warn("Failed saving lastLesson to SettingsDB", e);
    }

    // update UI and disable button so it doesn't show again
    markBtn.textContent = "Completed ✓";
    markBtn.disabled = true;
    // resume timer if you want (we stopped it before saving)
    startTimer();
    updateUI(100);
  });

  backBtn.addEventListener("click", () => (location.href = "lessons.html"));

  bookmarkBtn.addEventListener("click", () => {
    const bmKey = "gyan_bookmarks";
    const raw = localStorage.getItem(bmKey);
    let arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(lessonId)) {
      arr.push(lessonId);
      localStorage.setItem(bmKey, JSON.stringify(arr));
      bookmarkBtn.textContent = "Bookmarked ✓";
    } else {
      arr = arr.filter((x) => x !== lessonId);
      localStorage.setItem(bmKey, JSON.stringify(arr));
      bookmarkBtn.textContent = "Bookmark";
    }
  });

  window.addEventListener("beforeunload", async () => {
    stopTimer();
    try {
      await window.LessonDB.saveProgress(savedProgress);
      localStorage.setItem(
        "lesson_progress_" + lessonId,
        JSON.stringify(savedProgress)
      );
    } catch (e) {}
  });

  function escapeHTML(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/[&<>"']/g, (m) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }
})();
