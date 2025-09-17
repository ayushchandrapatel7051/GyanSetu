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

  /* ------------------------------
     Resolve language
  ------------------------------ */
  async function resolveLanguage() {
    try {
      let email = null;
      try {
        const raw = localStorage.getItem("gyan_current_user");
        if (raw) email = JSON.parse(raw).email;
      } catch {}
      if (!email && window.currentUser?.email) email = window.currentUser.email;

      if (email && window.SettingsDB?.getSettings) {
        const s = await SettingsDB.getSettings(email);
        if (s?.language) return s.language.slice(0, 2).toLowerCase();
      }
      if (window.GyanSetu?.getCurrentLanguage) {
        return window.GyanSetu.getCurrentLanguage().slice(0, 2).toLowerCase();
      }
      const sel = document.querySelector("#gs-language");
      if (sel?.value) return sel.value.slice(0, 2).toLowerCase();

      const raw = localStorage.getItem("gyan_current_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.language) return parsed.language.slice(0, 2).toLowerCase();
      }
      const rawg = localStorage.getItem("gyan_guest_language");
      if (rawg) {
        const parsed = JSON.parse(rawg);
        if (parsed?.language) return parsed.language.slice(0, 2).toLowerCase();
      }
    } catch (e) {
      console.warn("resolveLanguage failed", e);
    }
    return "en";
  }

  function lessonForLang(lang) {
    const translations = lesson.translations || {};
    const alias = lang === "od" ? "or" : lang;
    const override = translations[lang] || translations[alias] || {};
    return {
      title: override.title || lesson.title,
      description: override.description || lesson.description || "",
      subject: override.subject || lesson.subject,
      grade: override.grade || lesson.grade,
      duration_minutes: override.duration_minutes || lesson.duration_minutes,
      content: override.content || lesson.content || [],
    };
  }

  /* ------------------------------
     Progress DB setup
  ------------------------------ */
  const currentRaw = localStorage.getItem("gyan_current_user");
  const email = currentRaw ? JSON.parse(currentRaw).email || null : null;
  const idKey = (email || "anon") + "__" + lessonId;

  try {
    if (window.LessonDB?.openDB) await LessonDB.openDB();
  } catch {}

  let savedProgress = await LessonDB.getProgress(email, lessonId).catch(
    () => null
  );
  if (!savedProgress) {
    savedProgress = {
      id: idKey,
      email,
      lessonId,
      completed: false,
      percent: 0,
      seenBlocks: [], // 🔥 track seen block indexes
      timeSpentSeconds: 0,
      lastViewedAt: Date.now(),
    };
    await LessonDB.saveProgress(savedProgress).catch(() => {});
  }

  function updateUI(percent) {
    progressFill.style.width = percent + "%";
    percentEl.textContent = percent + "%";
    if (percent >= 100) progressFill.classList.add("completed");
    else progressFill.classList.remove("completed");
  }

  function setCompletedUI() {
    markBtn.textContent = "Completed ✓";
    markBtn.disabled = true;
    savedProgress.completed = true;
    savedProgress.percent = 100;
    updateUI(100);
  }

  if (savedProgress.completed) setCompletedUI();
  else updateUI(savedProgress.percent || 0);

  /* ------------------------------
     Render lesson for language
  ------------------------------ */
  let io = null;
  let tickTimer = null;
  let autosaveTimer = null;
  let startedAt = Date.now();

  function stopTimers() {
    if (tickTimer) clearInterval(tickTimer);
    if (autosaveTimer) clearInterval(autosaveTimer);
    if (io) io.disconnect();
    tickTimer = autosaveTimer = io = null;
  }

  async function renderLesson(lang) {
    stopTimers();
    const view = lessonForLang(lang);

    titleEl.textContent = view.title;
    descEl.textContent = view.description;
    metaContainer.innerHTML = `${view.subject} • Grade ${view.grade} • ${
      view.duration_minutes || "—"
    } mins`;

    contentEl.innerHTML = "";
    view.content.forEach((block, idx) => {
      const wrapper = document.createElement("div");
      wrapper.className = "block fade-in";
      wrapper.dataset.blockIdx = idx;
      switch (block.type) {
        case "heading": {
          const tag =
            block.level === 1 ? "h1" : block.level === 2 ? "h2" : "h3";
          wrapper.innerHTML = `<${tag}>${escapeHTML(block.text)}</${tag}>`;
          break;
        }
        case "paragraph":
          wrapper.innerHTML = `<p>${escapeHTML(block.text)}</p>`;
          break;
        case "image":
          wrapper.innerHTML = `<figure>
            <img src="${block.src}" alt="${escapeHTML(
            block.alt || ""
          )}" style="max-width:100%;border-radius:8px"/>
            ${
              block.caption
                ? `<figcaption>${escapeHTML(block.caption)}</figcaption>`
                : ""
            }
          </figure>`;
          break;
        case "video":
          wrapper.innerHTML = `<video controls style="max-width:100%">
            <source src="${block.src}">
          </video>`;
          break;
        case "list":
          wrapper.innerHTML = `<${block.ordered ? "ol" : "ul"}>${(
            block.items || []
          )
            .map((i) => `<li>${escapeHTML(i)}</li>`)
            .join("")}</${block.ordered ? "ol" : "ul"}>`;
          break;
      }
      contentEl.appendChild(wrapper);
    });

    // reattach observer
    const blocks = Array.from(contentEl.querySelectorAll(".block"));
    let seenBlocks = new Set(savedProgress.seenBlocks || []); // 🔥 restore old

    const recalcAndSave = async () => {
      const percent = Math.round((seenBlocks.size / blocks.length) * 100);
      if (!savedProgress.completed) {
        savedProgress.percent = percent;
        savedProgress.seenBlocks = Array.from(seenBlocks);
        savedProgress.lastViewedAt = Date.now();
        updateUI(percent);
        await LessonDB.saveProgress(savedProgress).catch(() => {});
      }
    };

    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            seenBlocks.add(entry.target.dataset.blockIdx);
            recalcAndSave();
          }
        });
      },
      { threshold: [0.5] }
    );
    blocks.forEach((b) => io.observe(b));

    // apply old progress immediately
    if (seenBlocks.size) updateUI(savedProgress.percent);

    // start timers
    startedAt = Date.now();
    tickTimer = setInterval(() => {
      const total =
        savedProgress.timeSpentSeconds +
        Math.floor((Date.now() - startedAt) / 1000);
      timeSpentEl.textContent = `${total}s`;
    }, 1000);

    autosaveTimer = setInterval(async () => {
      const delta = Math.floor((Date.now() - startedAt) / 1000);
      savedProgress.timeSpentSeconds += delta;
      savedProgress.lastViewedAt = Date.now();
      await LessonDB.saveProgress(savedProgress).catch(() => {});
      startedAt = Date.now();
    }, 10000);
  }

  // Initial render
  renderLesson(await resolveLanguage());

  // Watch for language changes
  document.addEventListener("gyan:user-updated", async () =>
    renderLesson(await resolveLanguage())
  );
  window.addEventListener("storage", async () =>
    renderLesson(await resolveLanguage())
  );

  /* ------------------------------
     Mark complete, back, bookmark
  ------------------------------ */
  markBtn.addEventListener("click", async () => {
    savedProgress.completed = true;
    savedProgress.percent = 100;
    savedProgress.seenBlocks = []; // once complete, we don’t care
    savedProgress.lastViewedAt = Date.now();
    await LessonDB.saveProgress(savedProgress).catch(() => {});
    setCompletedUI();
  });

  backBtn.addEventListener("click", () => (location.href = "lessons.html"));

  bookmarkBtn.addEventListener("click", () => {
    const bmKey = "gyan_bookmarks";
    const raw = localStorage.getItem(bmKey);
    let arr = raw ? JSON.parse(raw) : [];
    if (!arr.includes(lessonId)) arr.push(lessonId);
    else arr = arr.filter((x) => x !== lessonId);
    localStorage.setItem(bmKey, JSON.stringify(arr));
    bookmarkBtn.textContent = arr.includes(lessonId)
      ? "Bookmarked ✓"
      : "Bookmark";
  });

  window.addEventListener("beforeunload", async () => {
    stopTimers();
    await LessonDB.saveProgress(savedProgress).catch(() => {});
  });

  function escapeHTML(s) {
    if (!s && s !== 0) return "";
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }
})();
