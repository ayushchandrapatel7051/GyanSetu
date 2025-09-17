// js/quiz.js — complete file with language support, XP awarding, sounds, and robust fallbacks.
// Requirements: settings-db.js must be loaded before this file if you want XP persistence.
// Optional: Chart.js for the results chart.

(() => {
  "use strict";

  /* -----------------------------
     Utilities & small UI helpers
     ----------------------------- */

  // WebAudio for short feedback sounds
  const audioCtx = (() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      return AC ? new AC() : null;
    } catch (e) {
      return null;
    }
  })();

  function playSound(correct = true) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    if (correct) {
      o.type = "sine";
      o.frequency.setValueAtTime(880, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.01);
      o.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      o.start(now);
      o.stop(now + 0.38);
    } else {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.01);
      o.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      o.start(now);
      o.stop(now + 0.45);
    }
  }

  // small toast for XP
  (function injectToastCSS() {
    if (document.getElementById("gs-quiz-toast-css")) return;
    const s = document.createElement("style");
    s.id = "gs-quiz-toast-css";
    s.textContent = `
      .gs-xp-toast { position: fixed; right:18px; bottom:26px; z-index:99999;
        padding:10px 14px; border-radius:10px; font-weight:700; color:#fff;
        background: linear-gradient(90deg,#7b61ff,#3fd1c9); box-shadow:0 14px 40px rgba(0,0,0,0.45);
        transform: translateY(8px); opacity:0; transition: transform .22s, opacity .22s;
      }
      .gs-xp-toast.show { transform: translateY(0); opacity:1; }
    `;
    document.head.appendChild(s);
  })();

  function showXpToast(n) {
    if (!n || n <= 0) return;
    let t = document.querySelector(".gs-xp-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "gs-xp-toast";
      t.innerHTML = `+<strong style="margin:0 6px">${n}</strong> XP`;
      document.body.appendChild(t);
    } else {
      t.innerHTML = `+<strong style="margin:0 6px">${n}</strong> XP`;
    }
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove("show"), 1600);
  }

  // simple shuffle
  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // dedupe questions by question_id or question text
  function uniqueQuestions(list) {
    const seen = new Set();
    const out = [];
    for (const q of list) {
      const id = q.question_id ?? q.id ?? (q.question && q.question.trim());
      const key = String(id || "").trim();
      if (!key) {
        const txt = (q.question || "").trim();
        if (txt && !seen.has(txt)) {
          seen.add(txt);
          out.push(q);
        }
      } else {
        if (!seen.has(key)) {
          seen.add(key);
          out.push(q);
        }
      }
    }
    return out;
  }

  // safe value -> string
  function safeStr(v) {
    if (v === undefined || v === null) return "";
    return String(v);
  }

  /* -----------------------------
     DOM refs (must match your quiz.html)
     ----------------------------- */
  const qIndexEl = document.getElementById("qIndex");
  const qTotalEl = document.getElementById("qTotal");
  const scoreEl = document.getElementById("score");
  const questionText = document.getElementById("questionText");
  const optionsList = document.getElementById("optionsList");
  const nextBtn = document.getElementById("nextBtn");
  const quitBtn = document.getElementById("quitBtn");
  const timerDisplay = document.getElementById("timerDisplay");
  const progressFill = document.getElementById("progressFill");
  const summary = document.getElementById("summary");
  const finalScore = document.getElementById("finalScore");
  const totalTimeEl = document.getElementById("totalTime");
  const perQuestionTimes = document.getElementById("perQuestionTimes");
  const lastAnswerTime = document.getElementById("lastAnswerTime");
  const quizSelector = document.getElementById("quizSelector");
  const quizPage = document.getElementById("quiz-page");

  /* -----------------------------
     Play button discovery & dropdown injection
     ----------------------------- */
  const cardPlayButtons = Array.from(
    document.querySelectorAll(".card.card-game .btn")
  ).length
    ? Array.from(document.querySelectorAll(".card.card-game .btn"))
    : [
        ...(document.getElementById("playMathBtn")
          ? [document.getElementById("playMathBtn")]
          : []),
        ...(document.getElementById("playScienceBtn")
          ? [document.getElementById("playScienceBtn")]
          : []),
      ];

  (function insertCountDropdown() {
    if (!quizSelector) return;
    if (document.getElementById("qsCountSelect")) return;
    const container = quizSelector.querySelector(".cards") || quizSelector;
    const wrapper = document.createElement("div");
    wrapper.style =
      "display:flex;gap:12px;align-items:center;margin-bottom:14px;";
    wrapper.innerHTML = `
      <label style="font-weight:700;margin-right:8px;color:var(--muted)">Number of questions:</label>
      <select id="qsCountSelect" style="padding:8px;border-radius:8px;border:none;background:linear-gradient(90deg,#d946ef,#6366f1,#3b82f6);color:#fff;font-weight:700">
        <option value="5">5</option>
        <option value="10" selected>10</option>
        <option value="20">20</option>
      </select>
    `;
    container.parentNode.insertBefore(wrapper, container);
  })();

  function getSelectedCount() {
    const sel = document.getElementById("qsCountSelect");
    return sel ? Number(sel.value || 10) : 10;
  }

  /* -----------------------------
     State
     ----------------------------- */
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let questionStart = null;
  let timerInterval = null;
  let quizStartTime = null;
  let perQuestion = [];
  let currentSubject = "all";

  // hide quiz page initially
  if (quizPage) quizPage.style.display = "none";

  /* -----------------------------
     Language detection & live re-render
     Strategy:
       1. Look for window.currentUser.email and SettingsDB.getSettings(email).language
       2. Else look at localStorage.gyan_current_user.language
       3. Else look for <select id="language"> on page
       4. fallback 'en'
  ----------------------------- */
  async function getUserLanguage() {
  try {
    // 0) Prefer global API if available (main.js exposes GyanSetu.getCurrentLanguage)
    if (window.GyanSetu && typeof window.GyanSetu.getCurrentLanguage === "function") {
      try {
        const g = window.GyanSetu.getCurrentLanguage();
        if (g) return (String(g).toLowerCase() || "en").slice(0, 2);
      } catch (e) { /* ignore */ }
    }

    // 1) window.currentUser + SettingsDB (existing logic)
    if (
      window.currentUser &&
      window.currentUser.email &&
      window.SettingsDB &&
      typeof SettingsDB.getSettings === "function"
    ) {
      try {
        const s = await SettingsDB.getSettings(window.currentUser.email);
        if (s && s.language)
          return (String(s.language).toLowerCase() || "en").slice(0, 2);
      } catch (e) {
        /* ignore */
      }
    }

    // 2) localStorage gyan_current_user
    try {
      const raw = localStorage.getItem("gyan_current_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.language)
          return (String(parsed.language).toLowerCase() || "en").slice(0, 2);
      }
    } catch (e) {}

    // 3) top-right selector injected by main.js
    try {
      const topSel = document.querySelector("#gs-language");
      if (topSel && topSel.value) return (String(topSel.value).toLowerCase() || "en").slice(0, 2);
    } catch (e) {}

    // 4) language select on page (legacy)
    try {
      const sel = document.querySelector("#language, .lang-select");
      if (sel && sel.value)
        return (String(sel.value).toLowerCase() || "en").slice(0, 2);
    } catch (e) {}

  } catch (e) {
    console.warn("getUserLanguage failed", e);
  }
  return "en";
}

  // If user changes the page-wide language select we should re-render current question in new language
  (function attachLanguageWatcher() {
  // watch the legacy select(s) and the top-right select (#gs-language)
  const selectors = [
    () => document.querySelector("#language"),
    () => document.querySelector(".lang-select"),
    () => document.querySelector("#gs-language")
  ];

  function bindIfPresent(el) {
    if (!el) return;
    // avoid duplicate handlers
    if (el._quizLangBound) return;
    el._quizLangBound = true;
    el.addEventListener("change", async () => {
      // re-render current question in new language
      if (questions && questions.length && currentIndex >= 0) {
        try {
          await renderCurrent();
        } catch (e) { console.warn("renderCurrent failed after lang change", e); }
      }
    });
  }

  // initial bind for elements that already exist
  selectors.forEach((fn) => bindIfPresent(fn()));

  // observe DOM for late-inserted #gs-language (since main.js injects early but safe)
  const mo = new MutationObserver(() => {
    selectors.forEach((fn) => bindIfPresent(fn()));
  });
  mo.observe(document.documentElement || document.body, { childList: true, subtree: true });

  // listen for app-wide language updates via event dispatched by main.js
  document.addEventListener("gyan:user-updated", async (ev) => {
    try {
      if (ev && ev.detail && ev.detail.language) {
        // if top-right selector exists, keep it in sync (main.js should already)
        const sel = document.querySelector("#gs-language");
        if (sel && sel.value !== ev.detail.language) sel.value = ev.detail.language;

        if (questions && questions.length && currentIndex >= 0) {
          await renderCurrent();
        }
      }
    } catch (e) {
      console.warn("gyan:user-updated handler failed", e);
    }
  });

  // also listen for storage events so if another tab changes language we update
  window.addEventListener("storage", async (ev) => {
    try {
      if (!ev) return;
      if (ev.key === "gyan_current_user" || ev.key === "gyan_guest_language") {
        // re-render if language might have changed
        if (questions && questions.length && currentIndex >= 0) {
          await renderCurrent();
        }
      }
    } catch (e) {
      console.warn("storage event lang handler failed", e);
    }
  });
})();


  /* -----------------------------
     Load questions file (maths.json/science.json/questions.json)
     Accepts subject: 'math', 'science', 'all'
  ----------------------------- */
  async function loadQuestions(subject = "all", count = 10) {
    try {
      currentSubject = subject || "all";
      if (questionText) questionText.textContent = "Loading questions...";
      if (optionsList) optionsList.innerHTML = "";
      if (qIndexEl) qIndexEl.textContent = "0";
      if (qTotalEl) qTotalEl.textContent = "0";

      let path = "../data/questions.json";
      if (subject === "math") path = "../data/maths.json";
      else if (subject === "science") path = "../data/science.json";

      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load " + path);
      let data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        if (questionText) questionText.textContent = "No questions available.";
        questions = [];
        return;
      }

      // optional: filter by subject field when using mixed file
      if (subject && subject !== "all") {
        const normalized = subject.toLowerCase();
        const filtered = data.filter((q) => {
          const s = (q.subject || q.category || q.topic || "")
            .toString()
            .toLowerCase();
          return s === normalized || s.includes(normalized);
        });
        if (filtered.length > 0) data = filtered;
      }

      data = uniqueQuestions(data);

      // shuffle and slice to count
      let pool = shuffleArray(data);
      if (count && count > 0 && count < pool.length)
        pool = pool.slice(0, count);

      // Prepare question objects with canonical data for runtime mapping
      questions = pool.map((q, idx) => {
        const clone = JSON.parse(JSON.stringify(q));
        // canonical english options source for mapping
        const engOpts =
          Array.isArray(q.options) && q.options.length
            ? q.options.slice()
            : Array.isArray(q.en_options) && q.en_options.length
            ? q.en_options.slice()
            : [];
        clone._engOptions = engOpts.length
          ? engOpts
          : Array.isArray(q.options)
          ? q.options.slice()
          : [];
        clone._canonicalCorrect = (function () {
          // if there's an explicit numeric correct_option use it against the English options (if present)
          const c = Number(q.correct_option ?? q.correct ?? -1);
          if (c >= 0 && clone._engOptions.length > c)
            return clone._engOptions[c];
          // else try string match in english options using 'answer' or 'correctAnswer' if present
          if (q.answer) return q.answer;
          return clone._engOptions[0] ?? null;
        })();
        // ensure question_id
        if (!clone.question_id) clone.question_id = clone.id ?? idx;
        return clone;
      });

      if (qTotalEl) qTotalEl.textContent = String(questions.length);
      startQuiz();
    } catch (err) {
      console.error("loadQuestions error", err);
      if (questionText) questionText.textContent = "Error loading questions.";
      questions = [];
    }
  }

  /* -----------------------------
     Start / render / timers
  ----------------------------- */
  function startQuiz() {
    clearInterval(timerInterval);
    currentIndex = 0;
    score = 0;
    perQuestion = [];
    quizStartTime = Date.now();
    if (scoreEl) scoreEl.textContent = "0";
    if (document.querySelector(".quiz-controls"))
      document.querySelector(".quiz-controls").style.display = "";
    renderCurrent();
    updateProgress();
  }

  async function renderCurrent() {
    clearInterval(timerInterval);
    if (!questions || questions.length === 0) {
      if (questionText) questionText.textContent = "No questions available.";
      if (optionsList) optionsList.innerHTML = "";
      return;
    }
    const q = questions[currentIndex];

    // pick language-aware question text & options
    const lang = await getUserLanguage(); // 'en'|'hi'|'or' etc.
    let qText =
      q.question ||
      q.en_question ||
      q.hi_question ||
      q.od_question ||
      "No question text";
    let opts = Array.isArray(q.options)
      ? q.options.slice()
      : Array.isArray(q.en_options)
      ? q.en_options.slice()
      : [];
    // prefer hi/od fields if language asked
    if (lang === "hi" && Array.isArray(q.hi_options) && q.hi_options.length) {
      opts = q.hi_options.slice();
      if (q.hi_question) qText = q.hi_question;
    } else if (
      (lang === "or" || lang === "od") &&
      Array.isArray(q.od_options) &&
      q.od_options.length
    ) {
      opts = q.od_options.slice();
      if (q.od_question) qText = q.od_question;
    } else {
      // fallback to en fields - prefer en_options if present
      if (Array.isArray(q.en_options) && q.en_options.length)
        opts = q.en_options.slice();
      else if (Array.isArray(q.options) && q.options.length)
        opts = q.options.slice();
    }

    // compute runtime correct index using several fallbacks:
    // 1) if q has language-specific correct index (hi_correct_option / od_correct_option) use it
    // 2) else if canonical english correct value exists, try to find it inside this language's opts (exact match)
    // 3) else fallback to provided numeric q.correct_option or q.correct
    let runtimeCorrect = 0;
    if (lang === "hi" && Number.isFinite(Number(q.hi_correct_option))) {
      runtimeCorrect = Number(q.hi_correct_option);
    } else if (
      (lang === "or" || lang === "od") &&
      Number.isFinite(Number(q.od_correct_option))
    ) {
      runtimeCorrect = Number(q.od_correct_option);
    } else {
      // try matching canonical value if available
      if (q._canonicalCorrect != null) {
        const found = opts.findIndex(
          (o) => safeStr(o).trim() === safeStr(q._canonicalCorrect).trim()
        );
        if (found >= 0) runtimeCorrect = found;
        else {
          // fallback: try numeric correct_option
          if (Number.isFinite(Number(q.correct_option)))
            runtimeCorrect = Number(q.correct_option);
          else if (Number.isFinite(Number(q.correct)))
            runtimeCorrect = Number(q.correct);
          else runtimeCorrect = 0;
        }
      } else {
        if (Number.isFinite(Number(q.correct_option)))
          runtimeCorrect = Number(q.correct_option);
        else if (Number.isFinite(Number(q.correct)))
          runtimeCorrect = Number(q.correct);
        else runtimeCorrect = 0;
      }
    }

    // save runtime correct for later checks
    q._runtimeCorrect = runtimeCorrect;

    // render UI
    if (qIndexEl) qIndexEl.textContent = String(currentIndex + 1);
    if (questionText) questionText.textContent = qText;
    if (optionsList) optionsList.innerHTML = "";

    // image support
    const qImageWrapper = document.getElementById("questionImage");
    const imgSrc = q.image || q.image_link || q.imageLink || null;
    if (qImageWrapper) {
      if (imgSrc && imgSrc.toLowerCase() !== "null") {
        qImageWrapper.style.display = "";
        const img = qImageWrapper.querySelector("img");
        if (img) {
          img.src = imgSrc;
          img.alt = q.image_alt || "question image";
        }
      } else {
        qImageWrapper.style.display = "none";
      }
    }

    // render options
    opts.forEach((opt, idx) => {
      const li = document.createElement("li");
      li.className = "option-item";
      li.tabIndex = 0;
      li.textContent = opt;
      li.addEventListener("click", () => handleAnswer(li, idx));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAnswer(li, idx);
        }
      });
      optionsList.appendChild(li);
    });

    // timer
    questionStart = Date.now();
    timerDisplay && (timerDisplay.textContent = "0.0s");
    timerInterval = setInterval(() => {
      timerDisplay &&
        (timerDisplay.textContent =
          ((Date.now() - questionStart) / 1000).toFixed(1) + "s");
    }, 100);

    // disable next until answer chosen
    if (nextBtn) nextBtn.disabled = true;
  }

  /* -----------------------------
     Answer handling, XP awarding
  ----------------------------- */
  async function handleAnswer(li, pickedIdx) {
    if (!questions || questions.length === 0) return;
    clearInterval(timerInterval);

    const q = questions[currentIndex];
    const timeTaken = (Date.now() - questionStart) / 1000;

    // visually disable all options
    Array.from(optionsList.children).forEach((el) =>
      el.classList.add("disabled")
    );

    const correctIdx = Number(
      q._runtimeCorrect ?? q.correct_option ?? q.correct ?? 0
    );

    // mark UI
    if (pickedIdx === correctIdx) {
      li.classList.add("correct");
      score++;
      playSound(true);
    } else {
      li.classList.add("wrong");
      if (optionsList.children[correctIdx])
        optionsList.children[correctIdx].classList.add("correct");
      playSound(false);
    }

    // record
    perQuestion.push({
      id: q.question_id ?? currentIndex,
      tookSeconds: timeTaken.toFixed(2),
      correct: pickedIdx === correctIdx,
    });

    lastAnswerTime &&
      (lastAnswerTime.textContent = `Answered in ${timeTaken.toFixed(2)}s`);
    scoreEl && (scoreEl.textContent = String(score));
    if (nextBtn) nextBtn.disabled = false;
    updateProgress();

    // award XP for correct & faster answers
    (async function awardXp() {
      if (pickedIdx !== correctIdx) return;
      try {
        const maxSeconds = 30;
        const frac = Math.max(0, (maxSeconds - timeTaken) / maxSeconds);
        const rawXp = Math.round(frac * 20);
        const xpToAdd = Math.max(0, Math.min(20, rawXp));
        if (!xpToAdd) return;

        if (!window.SettingsDB || typeof SettingsDB.getSettings !== "function")
          return;

        // find email consistent with your app
        let email = null;
        if (window.currentUser && window.currentUser.email)
          email = window.currentUser.email;
        else {
          try {
            const raw = localStorage.getItem("gyan_current_user");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.email) email = parsed.email;
            }
          } catch (e) {}
        }
        if (!email) email = "johndoe@email.com";

        const s = await SettingsDB.getSettings(email);
        const settings = s || { email, xp: 0, badges: [] };
        settings.xp = (Number(settings.xp) || 0) + xpToAdd;
        await SettingsDB.saveSettings(settings);

        // update any on-screen XP display if present (id xpNumber used in progress page)
        const xpEl =
          document.getElementById("xpNumber") ||
          document.getElementById("xpValue");
        if (xpEl)
          xpEl.textContent = (Number(settings.xp) || 0).toLocaleString();

        showXpToast(xpToAdd);
      } catch (e) {
        console.warn("awardXp failed", e);
      }
    })();

    // auto-finish if last question after a short delay to show feedback
    if (currentIndex >= questions.length - 1) {
      setTimeout(() => finishQuiz(), 700);
      return;
    }
  }

  /* -----------------------------
     Progress UI and navigation
  ----------------------------- */
  function updateProgress() {
    const total = questions.length || 1;
    const pct =
      ((currentIndex + (nextBtn && nextBtn.disabled ? 0 : 1)) / total) * 100;
    if (progressFill)
      progressFill.style.width = Math.min(Math.max(pct, 0), 100) + "%";
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (!questions || currentIndex >= questions.length - 1) {
        finishQuiz();
      } else {
        currentIndex++;
        renderCurrent();
      }
    });
  }

  if (quitBtn) {
    quitBtn.addEventListener("click", () => {
      if (quizPage) quizPage.style.display = "none";
      if (quizSelector) quizSelector.style.display = "";
      if (document.getElementById("questionCard"))
        document.getElementById("questionCard").style.display = "";
      if (document.querySelector(".quiz-controls"))
        document.querySelector(".quiz-controls").style.display = "";
    });
  }

  /* -----------------------------
     finish quiz & show results (Chart.js optional)
  ----------------------------- */
  function finishQuiz() {
    clearInterval(timerInterval);
    const totalTime = ((Date.now() - quizStartTime) / 1000).toFixed(2);
    finalScore && (finalScore.textContent = `${score}/${questions.length}`);
    totalTimeEl && (totalTimeEl.textContent = totalTime);
    perQuestionTimes && (perQuestionTimes.innerHTML = "");
    if (perQuestionTimes) {
      perQuestion.forEach((p, i) => {
        const li = document.createElement("li");
        li.textContent = `Q${i + 1} — ${p.tookSeconds}s — ${
          p.correct ? "correct" : "wrong"
        }`;
        perQuestionTimes.appendChild(li);
      });
    }

    const attempted = perQuestion.length;
    const correct = perQuestion.filter((p) => p.correct).length;
    const incorrect = attempted - correct;
    const notAnswered = questions.length - attempted;
    const accuracy = questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0;

    document.getElementById("marksObtained") &&
      (document.getElementById("marksObtained").textContent = String(correct));
    document.getElementById("marksTotal") &&
      (document.getElementById("marksTotal").textContent = String(
        questions.length
      ));
    document.getElementById("qsAttempted") &&
      (document.getElementById(
        "qsAttempted"
      ).textContent = `${attempted}/${questions.length}`);
    document.getElementById("accuracy") &&
      (document.getElementById("accuracy").textContent = `${accuracy}%`);
    document.getElementById("timeTaken") &&
      (document.getElementById("timeTaken").textContent = `${(
        totalTime / 60
      ).toFixed(2)} min`);
    document.getElementById("correctCount") &&
      (document.getElementById("correctCount").textContent = String(correct));
    document.getElementById("incorrectCount") &&
      (document.getElementById("incorrectCount").textContent =
        String(incorrect));
    document.getElementById("notAnsweredCount") &&
      (document.getElementById("notAnsweredCount").textContent =
        String(notAnswered));

    // Chart.js if available and canvas exists
    if (typeof Chart !== "undefined") {
      try {
        const canvas = document.getElementById("attemptsChart");
        if (canvas && canvas.getContext) {
          if (window._attemptsChart) {
            window._attemptsChart.destroy();
            window._attemptsChart = null;
          }
          const ctx = canvas.getContext("2d");
          window._attemptsChart = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Correct", "Incorrect", "Not Answered"],
              datasets: [{ data: [correct, incorrect, notAnswered] }],
            },
            options: { plugins: { legend: { display: false } }, cutout: "70%" },
          });
        }
      } catch (e) {
        console.warn("Chart render failed", e);
      }
    }

    if (document.getElementById("questionCard"))
      document.getElementById("questionCard").style.display = "none";
    if (document.querySelector(".quiz-controls"))
      document.querySelector(".quiz-controls").style.display = "none";
    if (summary) summary.style.display = "none";
    const rpage = document.getElementById("resultPage");
    if (rpage) rpage.style.display = "";
  }

  // Play again / back home
  document.addEventListener("click", (ev) => {
    const id = ev.target && ev.target.id;
    if (id === "playAgainBtn") {
      const rpage = document.getElementById("resultPage");
      if (rpage) rpage.style.display = "none";
      if (document.getElementById("questionCard"))
        document.getElementById("questionCard").style.display = "";
      if (document.querySelector(".quiz-controls"))
        document.querySelector(".quiz-controls").style.display = "";
      const count = getSelectedCount();
      const subj = currentSubject || "all";
      loadQuestions(subj, count);
    } else if (id === "backHomeBtn") {
      if (quizPage) quizPage.style.display = "none";
      if (quizSelector) quizSelector.style.display = "";
    }
  });

  /* -----------------------------
     Hook up Play buttons (cards)
     ----------------------------- */
  /* -----------------------------
   Hook up Play buttons (cards)
   ----------------------------- */
  cardPlayButtons.forEach((btn) => {
    if (!btn) return;
    if (btn.hasAttribute("onclick")) btn.removeAttribute("onclick");
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // get subject from data-subject or fallback from button id/text
      let subject = btn.dataset.subject;
      if (!subject) {
        if (btn.id.toLowerCase().includes("math")) subject = "math";
        else if (btn.id.toLowerCase().includes("science")) subject = "science";
        else subject = "all";
      }

      currentSubject = subject;
      const count = getSelectedCount();

      // show quiz area
      if (quizSelector) quizSelector.style.display = "none";
      if (quizPage) quizPage.style.display = "";
      const rpage = document.getElementById("resultPage");
      if (rpage) rpage.style.display = "none";
      if (document.getElementById("questionCard"))
        document.getElementById("questionCard").style.display = "";
      if (document.querySelector(".quiz-controls"))
        document.querySelector(".quiz-controls").style.display = "";

      loadQuestions(subject, count);
    });
  });

  /* -----------------------------
     Expose some helpers for console
     ----------------------------- */
  window._quiz = {
    loadQuestions,
    startQuiz,
    renderCurrent,
    getUserLanguage,
  };

  // Done.
})();
