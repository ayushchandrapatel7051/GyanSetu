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

  // load saved progress
  const currentRaw = localStorage.getItem("gyan_current_user");
  const email = currentRaw ? JSON.parse(currentRaw).email || null : null;
  const idKey = (email || "anon") + "__" + lessonId;

  let savedProgress = await window.LessonDB.getProgress(email, lessonId);
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
  }

  markBtn.addEventListener("click", async () => {
    savedProgress.percent = 100;
    savedProgress.completed = true;
    savedProgress.lastViewedAt = Date.now();
    stopTimer();
    await window.LessonDB.saveProgress(savedProgress);
    localStorage.setItem(
      "lesson_progress_" + lessonId,
      JSON.stringify(savedProgress)
    );
    startTimer();
    updateUI(100);
    markBtn.textContent = "Completed ✓";
    markBtn.disabled = true;
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
