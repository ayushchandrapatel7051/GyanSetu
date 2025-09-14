// js/lesson.js
// Responsible for loading a lesson by id, rendering content blocks,
// tracking time spent and percent read, and saving progress to IndexedDB + localStorage.

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
    // no id -> go back to lessons
    location.href = "lessons.html";
    return;
  }

  // fetch lessons.json and find the lesson
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

  // load existing progress
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
    // persist into savedProgress
    const now = Date.now();
    const delta = Math.floor((now - startedAt) / 1000);
    savedProgress.timeSpentSeconds += delta;
    startedAt = now;
  }

  // render blocks
  contentEl.innerHTML = "";
  lesson.content.forEach((block, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "block";
    wrapper.dataset.blockIdx = idx;

    switch (block.type) {
      case "heading":
        if (block.level === 1)
          wrapper.innerHTML = `<h1>${escapeHTML(block.text)}</h1>`;
        else if (block.level === 2)
          wrapper.innerHTML = `<h2>${escapeHTML(block.text)}</h2>`;
        else wrapper.innerHTML = `<h3>${escapeHTML(block.text)}</h3>`;
        break;
      case "paragraph":
        wrapper.innerHTML = `<p>${escapeHTML(block.text)}</p>`;
        break;
      case "image":
        wrapper.innerHTML = `<figure><img src="${block.src}" alt="${escapeHTML(
          block.alt || ""
        )}" style="max-width:100%;border-radius:8px" /><figcaption class="muted small-muted">${escapeHTML(
          block.caption || ""
        )}</figcaption></figure>`;
        break;
      case "video":
        wrapper.innerHTML = `<video controls style="max-width:100%;border-radius:8px"><source src="${
          block.src
        }"></video>${
          block.caption
            ? `<div class="muted small-muted">${escapeHTML(
                block.caption
              )}</div>`
            : ""
        }`;
        break;
      case "code":
        wrapper.innerHTML = `<pre class="code-block">${escapeHTML(
          block.text
        )}</pre>`;
        break;
      case "list":
        const tag = block.ordered ? "ol" : "ul";
        const items = (block.items || [])
          .map((i) => `<li>${escapeHTML(i)}</li>`)
          .join("");
        wrapper.innerHTML = `<${tag}>${items}</${tag}>`;
        break;
      case "quiz":
        wrapper.innerHTML = `<div class="muted">Quiz embedded: <a href="../quiz.html?quiz=${encodeURIComponent(
          block.quiz_id
        )}">Open Quiz</a></div>`;
        break;
      case "embed":
        // safe embedding (iframe)
        wrapper.innerHTML = `<div class="embed-wrap"><iframe src="${block.src}" frameborder="0" style="width:100%;height:360px;border-radius:8px"></iframe></div>`;
        break;
      default:
        wrapper.innerHTML = `<p class="muted">[Unsupported block type: ${escapeHTML(
          block.type
        )}]</p>`;
    }

    contentEl.appendChild(wrapper);
  });

  // IntersectionObserver to detect read blocks and compute percent
  const blocks = Array.from(contentEl.querySelectorAll(".block"));
  let seenBlocks = new Set();
  if (
    savedProgress.percent &&
    savedProgress.percent > 0 &&
    savedProgress.completed
  ) {
    // if completed earlier, show 100%
    updateUI(100);
  } else {
    updateUI(savedProgress.percent || 0);
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const idx = entry.target.dataset.blockIdx;
          seenBlocks.add(String(idx));
          const percent = Math.round((seenBlocks.size / blocks.length) * 100);
          savedProgress.percent = percent;
          savedProgress.lastViewedAt = Date.now();
          // reflect in UI
          updateUI(percent);
        }
      });
    },
    { threshold: [0.5] }
  );

  blocks.forEach((b) => io.observe(b));

  // start timer and save periodically
  startedAt = Date.now();
  startTimer();

  let autosaveTimer = setInterval(async () => {
    // flush current delta
    const now = Date.now();
    const delta = Math.floor((now - startedAt) / 1000);
    const total = savedProgress.timeSpentSeconds + delta;
    savedProgress.timeSpentSeconds = total;
    savedProgress.lastViewedAt = Date.now();
    // save
    try {
      await window.LessonDB.saveProgress(savedProgress);
      // mirror to localStorage for quick reads
      localStorage.setItem(
        "lesson_progress_" + lessonId,
        JSON.stringify(savedProgress)
      );
    } catch (e) {
      console.warn("Autosave failed", e);
    }
    // keep timer rolling
    startedAt = now;
  }, 10000);

  // Helper: update UI percent/progress display
  function updateUI(percent) {
    progressFill.style.width = Math.min(Math.max(percent, 0), 100) + "%";
    percentEl.textContent = Math.round(percent) + "%";
  }

  // mark complete button
  markBtn.addEventListener("click", async () => {
    savedProgress.percent = 100;
    savedProgress.completed = true;
    savedProgress.lastViewedAt = Date.now();
    // stop timer delta into savedProgress before save
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

  backBtn.addEventListener("click", () => {
    location.href = "lessons.html";
  });

  bookmarkBtn.addEventListener("click", () => {
    // simple bookmark in localStorage
    const bmKey = "gyan_bookmarks";
    const raw = localStorage.getItem(bmKey);
    let arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(lessonId)) {
      arr.push(lessonId);
      localStorage.setItem(bmKey, JSON.stringify(arr));
      bookmarkBtn.textContent = "Bookmarked ✓";
    } else {
      // toggle off
      arr = arr.filter((x) => x !== lessonId);
      localStorage.setItem(bmKey, JSON.stringify(arr));
      bookmarkBtn.textContent = "Bookmark";
    }
  });

  // on unload save progress
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

  // small helper escape
  function escapeHTML(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(/[&<>"']/g, function (m) {
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
