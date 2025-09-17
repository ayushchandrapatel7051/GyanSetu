// js/lesson.js
// Loads lessons from lessons.json, renders content with language support, tracks reading progress and time spent.

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
  const backBtn = document.getElementById("backBtn");
  const markBtn = document.getElementById("markCompleted");
  const bookmarkBtn = document.getElementById("bookmarkBtn");

  // get user language: SettingsDB -> localStorage.gyan_current_user -> lang select -> default en
  async function getUserLanguage() {
    try {
      // If you have SettingsDB available (settings-db.js), prefer it
      if (
        typeof SettingsDB !== "undefined" &&
        SettingsDB &&
        SettingsDB.getSettings
      ) {
        try {
          const cur = localStorage.getItem("gyan_current_user");
          if (cur) {
            const parsed = JSON.parse(cur);
            if (parsed && parsed.email) {
              const s = await SettingsDB.getSettings(parsed.email);
              if (s && s.language) {
                return String(s.language || "en")
                  .toLowerCase()
                  .slice(0, 2);
              }
            }
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      // fallback: localStorage user
      const cur = localStorage.getItem("gyan_current_user");
      if (cur) {
        try {
          const parsed = JSON.parse(cur);
          if (parsed && parsed.language)
            return String(parsed.language || "en")
              .toLowerCase()
              .slice(0, 2);
        } catch (e) {}
      }

      // fallback: page-level select (if present)
      try {
        const el = document.querySelector("#language, .lang-select");
        if (el) {
          if (el.value)
            return String(el.value || "en")
              .toLowerCase()
              .slice(0, 2);
          if (el.getAttribute && el.getAttribute("data-lang"))
            return String(el.getAttribute("data-lang") || "en")
              .toLowerCase()
              .slice(0, 2);
        }
      } catch (e) {}
    } catch (e) {}
    // fallback
    return "en";
  }

  // choose localized value for a field
  // supports: field_hi, field_od, nested { hi: { ... } }, translations: { hi: { ... } }, fallback to field
  function chooseLocalized(obj = {}, field = "text", lang = "en") {
    if (!obj) return null;
    const L = String(lang || "en").toLowerCase();

    // 1) direct suffix e.g. title_hi, description_hi, text_hi, items_hi
    const suffKey = `${field}_${L}`;
    if (Object.prototype.hasOwnProperty.call(obj, suffKey)) return obj[suffKey];

    // 2) translations object (common pattern: obj.translations = { hi: { title, content... } })
    if (
      obj.translations &&
      obj.translations[L] &&
      typeof obj.translations[L][field] !== "undefined"
    ) {
      return obj.translations[L][field];
    }

    // 3) alternate suffixes ('od' vs 'or' sometimes used)
    if (
      L === "or" &&
      Object.prototype.hasOwnProperty.call(obj, `${field}_od`)
    ) {
      return obj[`${field}_od`];
    }
    if (
      L === "od" &&
      Object.prototype.hasOwnProperty.call(obj, `${field}_or`)
    ) {
      return obj[`${field}_or`];
    }

    // 4) nested object style: obj.hi.title  (legacy pattern)
    if (obj[L] && typeof obj[L][field] !== "undefined") return obj[L][field];

    // 5) localized list items e.g. items_hi
    if (Array.isArray(obj[suffKey])) return obj[suffKey];

    // final fallback to default field value
    return obj[field];
  }

  // safe escape
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

  // fetch lessons.json and find lesson (using string comparison for ids)
  let lesson = null;
  try {
    const res = await fetch("../data/lessons.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Could not fetch lessons.json");
    const list = await res.json();
    if (!Array.isArray(list)) throw new Error("lessons.json is not an array");
    lesson = list.find((l) => String(l.id) === String(lessonId));
    if (!lesson) throw new Error("Lesson not found");
  } catch (err) {
    console.error("Failed to load lesson:", err);
    if (titleEl) titleEl.textContent = "Lesson not found";
    if (contentEl)
      contentEl.innerHTML =
        "<p class='muted'>This lesson could not be loaded.</p>";
    return;
  }

  // ensure LessonDB exists
  let savedProgress = {
    lessonId,
    percent: 0,
    badges: [],
    timeSpentSeconds: 0,
  };

  // Attempt to load saved progress from settings DB if available
  try {
    if (
      typeof SettingsDB !== "undefined" &&
      SettingsDB &&
      SettingsDB.getSettings
    ) {
      const cur = localStorage.getItem("gyan_current_user");
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed && parsed.email) {
          const s = await SettingsDB.getSettings(parsed.email);
          if (s && s.progress && s.progress[lessonId]) {
            savedProgress = Object.assign(savedProgress, s.progress[lessonId]);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load progress from SettingsDB", e);
  }

  // Timer logic
  let startedAt = Date.now();
  let tickTimer = null;
  function startTimer() {
    if (tickTimer) return;
    tickTimer = setInterval(() => {
      const now = Date.now();
      const delta = Math.floor((now - startedAt) / 1000);
      const total = (savedProgress.timeSpentSeconds || 0) + delta;
      if (timeSpentEl) timeSpentEl.textContent = `${total}s`;
    }, 1000);
  }
  function stopTimer() {
    if (!tickTimer) return;
    clearInterval(tickTimer);
    tickTimer = null;
    const now = Date.now();
    const delta = Math.floor((now - startedAt) / 1000);
    savedProgress.timeSpentSeconds =
      (savedProgress.timeSpentSeconds || 0) + delta;
    startedAt = now;
  }

  // Render header and content with language applied
  async function renderLessonWithLanguage() {
    const lang = await getUserLanguage(); // 'en' | 'hi' | 'or' etc.

    // render header (title / description)
    const title = chooseLocalized(lesson, "title", lang) || lesson.title || "";
    const desc =
      chooseLocalized(lesson, "description", lang) || lesson.description || "";

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    // meta container: grade / subject / duration
    if (metaContainer) {
      const grade = lesson.grade
        ? `<span class="meta-item">Grade: ${escapeHTML(lesson.grade)}</span>`
        : "";
      const subject = lesson.subject
        ? `<span class="meta-item">Subject: ${escapeHTML(
            lesson.subject
          )}</span>`
        : "";
      const duration = lesson.estimatedMinutes
        ? `<span class="meta-item">Est: ${escapeHTML(
            String(lesson.estimatedMinutes)
          )}m</span>`
        : "";
      metaContainer.innerHTML = `${grade} ${subject} ${duration}`;
    }

    // build content blocks
    const blocks = Array.isArray(lesson.content) ? lesson.content : [];
    contentEl.innerHTML = "";

    // helper to append block
    for (const block of blocks) {
      const type = (block.type || block.kind || "").toLowerCase();
      const wrapper = document.createElement("div");
      wrapper.className = `lesson-block lesson-block-${escapeHTML(
        type || "unknown"
      )}`;
      switch (type) {
        case "heading": {
          const t = chooseLocalized(block, "text", lang) || block.text || "";
          wrapper.innerHTML = `<h3>${escapeHTML(t)}</h3>`;
          break;
        }
        case "paragraph":
        case "text": {
          const t = chooseLocalized(block, "text", lang) || block.text || "";
          wrapper.innerHTML = `<p>${escapeHTML(t)}</p>`;
          break;
        }
        case "image": {
          const src = block.src || block.url || "";
          const alt =
            chooseLocalized(block, "alt", lang) ||
            block.alt ||
            block.caption ||
            "";
          wrapper.innerHTML = `<figure><img src="${escapeHTML(
            src
          )}" alt="${escapeHTML(alt)}"><figcaption>${escapeHTML(
            alt
          )}</figcaption></figure>`;
          break;
        }
        case "code": {
          const codeText =
            chooseLocalized(block, "code", lang) || block.code || "";
          const langCls = block.language
            ? `language-${escapeHTML(block.language)}`
            : "";
          wrapper.innerHTML = `<pre class="${langCls}"><code>${escapeHTML(
            codeText
          )}</code></pre>`;
          break;
        }
        case "video": {
          const url = block.url || block.src || "";
          wrapper.innerHTML = `<div class="video-embed"><a href="${escapeHTML(
            url
          )}" target="_blank" rel="noopener">Watch video</a></div>`;
          break;
        }
        case "list": {
          const items =
            chooseLocalized(block, "items", lang) || block.items || [];
          const listTag = block.ordered ? "ol" : "ul";
          const inner = (Array.isArray(items) ? items : [])
            .map((i) => `<li>${escapeHTML(i)}</li>`)
            .join("");
          wrapper.innerHTML = `<${listTag}>${inner}</${listTag}>`;
          break;
        }
        case "quote": {
          const q = chooseLocalized(block, "text", lang) || block.text || "";
          const by = chooseLocalized(block, "by", lang) || block.by || "";
          wrapper.innerHTML = `<blockquote>${escapeHTML(q)}<footer>${escapeHTML(
            by
          )}</footer></blockquote>`;
          break;
        }
        case "quiz": {
          const quizId = block.quiz_id || block.quizId || block.quiz;
          wrapper.innerHTML = `<div class="muted">Quiz embedded: <a href="../quiz.html?quiz=${encodeURIComponent(
            quizId || ""
          )}">Open Quiz</a></div>`;
          break;
        }
        default: {
          // fallback: try to render any localized text field
          const text = chooseLocalized(block, "text", lang) || block.text || "";
          if (text) wrapper.innerHTML = `<p>${escapeHTML(text)}</p>`;
          else
            wrapper.innerHTML = `<p class="muted">[Unsupported block type: ${escapeHTML(
              type
            )}]</p>`;
        }
      }
      contentEl.appendChild(wrapper);
    }

    // update progress UI
    function updateUI(percent) {
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (percentEl) percentEl.textContent = `${percent}%`;
    }
    updateUI(savedProgress.percent || 0);
    if (timeSpentEl)
      timeSpentEl.textContent = `${savedProgress.timeSpentSeconds || 0}s`;
  }

  // initial render
  await renderLessonWithLanguage();
  startTimer();

  // Save last lesson to SettingsDB (non-blocking)
  (async () => {
    try {
      if (
        typeof SettingsDB !== "undefined" &&
        SettingsDB &&
        SettingsDB.getSettings &&
        SettingsDB.saveSettings
      ) {
        const cur = localStorage.getItem("gyan_current_user");
        if (cur) {
          const parsed = JSON.parse(cur);
          if (parsed && parsed.email) {
            const s = (await SettingsDB.getSettings(parsed.email)) || {};
            if (!s.progress) s.progress = {};
            s.progress[lessonId] = Object.assign(
              s.progress[lessonId] || {},
              savedProgress
            );
            s.lastLesson = {
              lessonId,
              completed: true,
              viewedAt: Date.now(),
              subject: lesson.subject,
              grade: lesson.grade,
            };
            await SettingsDB.saveSettings(s);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to save lastLesson to SettingsDB", e);
    }
  })();

  // mark completed button (updates SettingsDB progress)
  if (markBtn) {
    markBtn.addEventListener("click", async () => {
      savedProgress.percent = 100;
      try {
        if (
          typeof SettingsDB !== "undefined" &&
          SettingsDB &&
          SettingsDB.getSettings &&
          SettingsDB.saveSettings
        ) {
          const cur = localStorage.getItem("gyan_current_user");
          if (cur) {
            const parsed = JSON.parse(cur);
            if (parsed && parsed.email) {
              const s = (await SettingsDB.getSettings(parsed.email)) || {};
              if (!s.progress) s.progress = {};
              s.progress[lessonId] = Object.assign(s.progress[lessonId] || {}, {
                percent: 100,
                badges: savedProgress.badges || [],
                xp: savedProgress.xp || 0,
                timeSpentSeconds: savedProgress.timeSpentSeconds || 0,
              });
              s.lastLesson = {
                lessonId,
                completed: true,
                viewedAt: Date.now(),
                subject: lesson.subject,
                grade: lesson.grade,
              };
              await SettingsDB.saveSettings(s);
            }
          }
        }
      } catch (e) {
        console.warn("Failed saving lastLesson to SettingsDB", e);
      }

      // UI
      markBtn.textContent = "Completed ✓";
      markBtn.disabled = true;
      stopTimer();
      updateUI(100);
    });
  }

  if (backBtn)
    backBtn.addEventListener("click", () => (location.href = "lessons.html"));

  if (bookmarkBtn) {
    bookmarkBtn.addEventListener("click", () => {
      // simple toggle stored in localStorage for now
      try {
        const key = "gyan_bookmarks";
        const cur = localStorage.getItem(key);
        const arr = cur ? JSON.parse(cur) : [];
        const exists = (arr || []).some((x) => x === lessonId);
        let newArr;
        if (exists) {
          newArr = (arr || []).filter((x) => x !== lessonId);
          bookmarkBtn.textContent = "Bookmark";
        } else {
          newArr = (arr || []).concat([lessonId]);
          bookmarkBtn.textContent = "Bookmarked ✓";
        }
        localStorage.setItem(key, JSON.stringify(newArr));
      } catch (e) {}
    });
  }

  // Optional: if language selection changes on the page, re-render in new language
  try {
    const langSel = document.querySelector("#language, .lang-select");
    if (langSel) {
      langSel.addEventListener("change", async () => {
        await renderLessonWithLanguage();
      });
    }
  } catch (e) {}
})();
