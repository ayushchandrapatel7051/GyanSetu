// js/quiz.js — dropdown selector + reliable restart
(() => {
  // small WebAudio helper and toast helper (insert near top so other functions can use them)
  const audioCtx = (function createAudioContext() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      return AC ? new AC() : null;
    } catch (e) {
      return null;
    }
  })();

  function playSound(isCorrect = true) {
    // short beep: correct -> higher pitch, quick envelope; wrong -> lower pitch + minor dissonance
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    if (isCorrect) {
      o.type = "sine";
      o.frequency.setValueAtTime(900, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.01);
      o.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      o.start(now);
      o.stop(now + 0.35);
    } else {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(220, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.01);
      o.frequency.exponentialRampToValueAtTime(160, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.start(now);
      o.stop(now + 0.45);
    }
  }

  function showXpToast(n) {
    if (!n || n <= 0) return;
    // create or reuse
    let t = document.querySelector(".xp-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "xp-toast";
      t.innerHTML = `<strong>+<span class="value">${n}</span> XP</strong>`;
      document.body.appendChild(t);
    } else {
      t.querySelector(".value").textContent = n;
    }
    // force reflow then show
    void t.offsetWidth;
    t.classList.add("show");
    // hide after 1.6s
    clearTimeout(t._hideTimeout);
    t._hideTimeout = setTimeout(() => {
      t.classList.remove("show");
    }, 1600);
  }

  // DOM refs
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

  // find play buttons inside cards
  const cardPlayButtons = Array.from(
    document.querySelectorAll(".card.card-game .btn")
  );

  // insert dropdown chooser into the selector (above play cards)
  (function insertDropdown() {
    const container = quizSelector.querySelector(".cards") || quizSelector;
    // avoid duplicate insertion
    if (document.getElementById("qsCountSelect")) return;
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
    if (!sel) return 10;
    return Number(sel.value || 10);
  }

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let questionStart = null;
  let perQuestion = [];
  let timerInterval = null;
  let quizStartTime = null;
  let currentSubject = null;
  let lastUsedCount = 10;

  function show(el) {
    if (!el) return;
    el.style.display = "";
  }
  function hide(el) {
    if (!el) return;
    el.style.display = "none";
  }

  // ensure quiz-page hidden initially
  hide(quizPage);

  // attach listeners to Play buttons
  cardPlayButtons.forEach((btn) => {
    if (btn.hasAttribute("onclick")) btn.removeAttribute("onclick");
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const card = btn.closest(".card");
      let subject = null;
      if (card) {
        const tile = card.querySelector(".tile");
        if (tile && tile.textContent)
          subject = tile.textContent.trim().toLowerCase();
        else {
          const h3 = card.querySelector("h3");
          if (h3 && h3.textContent)
            subject = h3.textContent.trim().toLowerCase();
        }
      }
      if (subject) {
        if (subject.includes("math")) subject = "math";
        else if (subject.includes("science")) subject = "science";
        else subject = subject.split(" ")[0];
      } else subject = "all";

      const count = getSelectedCount();
      lastUsedCount = count;
      currentSubject = subject;

      // show quiz page
      hide(quizSelector);
      show(quizPage);
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      if (document.querySelector(".quiz-controls"))
        document.querySelector(".quiz-controls").style.display = "flex";

      loadQuestions(subject, count);
    });
  });

  // helper: dedupe by question_id or question text
  function uniqueQuestions(arr) {
    const seen = new Set();
    const out = [];
    for (const q of arr) {
      const id = q.question_id ?? q.id ?? (q.question && q.question.trim());
      const key = String(id || "").trim();
      if (!key) {
        // fallback: stringify question text
        const txt = (q.question || "").trim();
        if (!seen.has(txt) && txt) {
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

  // Load questions file based on subject
  async function loadQuestions(subject = "all", count = 10) {
    try {
      questionText.textContent = "Loading questions...";
      optionsList.innerHTML = "";
      qIndexEl.textContent = 0;
      qTotalEl.textContent = 0;
      let path = "../data/questions.json";
      if (subject === "math") path = "../data/maths.json";
      else if (subject === "science") path = "../data/science.json";

      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load " + path);
      let data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        questionText.textContent = "No questions available.";
        questions = [];
        return;
      }

      // filter if data contains mixed subjects and user requested specific
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

      // dedupe first to avoid duplicated questions from source
      data = uniqueQuestions(data);

      // shuffle pool then slice to requested count (but ensure we don't pick duplicates)
      let pool = shuffleArray(data);
      if (count && count > 0 && count < pool.length)
        pool = pool.slice(0, count);

      // normalize & shuffle options per question
      questions = pool.map((q, idx) => {
        const clone = JSON.parse(JSON.stringify(q));
        if (Array.isArray(clone.options) && clone.options.length > 1) {
          const correctIdx = Number(clone.correct_option ?? clone.correct ?? 0);
          const opts = clone.options.map((o, i) => ({ o, i }));
          const shuffled = shuffleArray(opts);
          clone.options = shuffled.map((s) => s.o);
          clone.correct_option = shuffled.findIndex((s) => s.i === correctIdx);
        }
        if (!clone.question_id) clone.question_id = clone.id ?? idx;
        return clone;
      });

      qTotalEl.textContent = questions.length;
      startQuiz();
    } catch (err) {
      console.error(err);
      questionText.textContent = "Error loading questions.";
      questions = [];
    }
  }

  function startQuiz() {
    clearInterval(timerInterval);
    currentIndex = 0;
    score = 0;
    perQuestion = [];
    quizStartTime = Date.now();
    scoreEl.textContent = 0;
    if (document.querySelector(".quiz-controls"))
      document.querySelector(".quiz-controls").style.display = "flex";
    renderCurrent();
    updateProgress();
  }

  function renderCurrent() {
    clearInterval(timerInterval);
    if (!questions || questions.length === 0) {
      questionText.textContent = "No questions available.";
      optionsList.innerHTML = "";
      return;
    }
    const q = questions[currentIndex];
    qIndexEl.textContent = currentIndex + 1;
    questionText.textContent = q.question || "No question text";
    optionsList.innerHTML = "";

    const qImageWrapper = document.getElementById("questionImage");
    if (q.image) {
      if (qImageWrapper) {
        qImageWrapper.style.display = "";
        const img = qImageWrapper.querySelector("img");
        img.src = q.image;
        img.alt = q.image_alt || "question image";
      }
    } else {
      if (qImageWrapper) qImageWrapper.style.display = "none";
    }

    (q.options || []).forEach((opt, idx) => {
      const li = document.createElement("li");
      li.className = "option-item";
      li.textContent = opt;
      li.tabIndex = 0;
      li.addEventListener("click", () => handleAnswer(li, idx));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAnswer(li, idx);
        }
      });
      optionsList.appendChild(li);
    });

    questionStart = Date.now();
    timerDisplay.textContent = "0.0s";
    timerInterval = setInterval(() => {
      timerDisplay.textContent =
        ((Date.now() - questionStart) / 1000).toFixed(1) + "s";
    }, 100);
    nextBtn.disabled = true;
  }

  function handleAnswer(li, idx) {
    if (!questions.length) return;
    clearInterval(timerInterval);
    const q = questions[currentIndex];
    const took = (Date.now() - questionStart) / 1000;
    Array.from(optionsList.children).forEach((el) =>
      el.classList.add("disabled")
    );
    const correctIdx = Number(q.correct_option);
    if (idx === correctIdx) {
      li.classList.add("correct");
      score++;
      playSound(true); // sound for correct
    } else {
      li.classList.add("wrong");
      if (optionsList.children[correctIdx])
        optionsList.children[correctIdx].classList.add("correct");
      playSound(false); // sound for wrong
    }
    perQuestion.push({
      id: q.question_id ?? currentIndex,
      tookSeconds: took.toFixed(2),
      correct: idx === correctIdx,
    });

    // update last time & score UI
    lastAnswerTime.textContent = `Answered in ${took.toFixed(2)}s`;
    scoreEl.textContent = score;
    nextBtn.disabled = false;
    updateProgress();

    // ---- XP awarding: faster correct answers earn up to 20 XP per question ----
    (async function awardXpIfNeeded() {
      try {
        // only award XP for correct answers
        const wasCorrect = idx === correctIdx;
        if (!wasCorrect) return;

        // mapping: 0s => 20 XP, maxSeconds => 0 XP (linear)
        const maxSeconds = 30; // adjust to your per-question target (in seconds)
        const timeTaken = Number(took);
        // compute proportional XP: remaining fraction of maxSeconds * 20
        const frac = Math.max(0, (maxSeconds - timeTaken) / maxSeconds);
        const rawXp = Math.round(frac * 20);
        const xpToAdd = Math.max(0, Math.min(20, rawXp));
        if (xpToAdd <= 0) return;

        // ensure SettingsDB available
        if (!window.SettingsDB || !SettingsDB.getSettings) return;

        // determine current email consistently with other pages
        let email = null;
        try {
          if (window.currentUser && window.currentUser.email) {
            email = window.currentUser.email;
          } else {
            const raw = localStorage.getItem("gyan_current_user");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.email) email = parsed.email;
            }
          }
        } catch (e) {
          console.warn("Could not read current user email for XP award", e);
        }
        if (!email) email = "johndoe@email.com";

        // fetch settings, update xp, save
        const s = await SettingsDB.getSettings(email);
        const settings = s || {
          email,
          name: email.split("@")[0],
          xp: 0,
          badges: [],
        };
        settings.xp = (Number(settings.xp) || 0) + xpToAdd;
        await SettingsDB.saveSettings(settings);
        console.log("Awarded XP", xpToAdd, "to", email, "new xp:", settings.xp);

        // show toast and update visible xp element if exists
        showXpToast(xpToAdd);
        const xpDisplay =
          document.getElementById("xpNumber") ||
          document.getElementById("xpValue") ||
          document.getElementById("xp") ||
          null;
        if (xpDisplay)
          xpDisplay.textContent = (Number(settings.xp) || 0).toLocaleString();
      } catch (e) {
        console.warn("Failed to award XP", e);
      }
    })();

    // If this was the last question, auto-finish after a short delay so user sees feedback
    if (currentIndex >= questions.length - 1) {
      // small delay so the correct/wrong UI is visible before showing results
      setTimeout(() => {
        finishQuiz();
      }, 700);
      return; // do not enable "Next" to proceed — auto-finish
    }
  }

  function updateProgress() {
    const pct = questions.length
      ? ((currentIndex + (nextBtn.disabled ? 0 : 1)) / questions.length) * 100
      : 0;
    progressFill.style.width = Math.min(Math.max(pct, 0), 100) + "%";
  }

  nextBtn.addEventListener("click", () => {
    if (currentIndex >= questions.length - 1) finishQuiz();
    else {
      currentIndex++;
      renderCurrent();
    }
  });

  quitBtn.addEventListener("click", () => {
    hide(quizPage);
    show(quizSelector);
    // ensure controls reset
    if (document.getElementById("questionCard"))
      document.getElementById("questionCard").style.display = "block";
    if (document.querySelector(".quiz-controls"))
      document.querySelector(".quiz-controls").style.display = "flex";
  });

  function finishQuiz() {
    clearInterval(timerInterval);
    const totalTime = ((Date.now() - quizStartTime) / 1000).toFixed(2);
    finalScore.textContent = `${score}/${questions.length}`;
    totalTimeEl.textContent = totalTime;
    perQuestionTimes.innerHTML = "";
    perQuestion.forEach((p, i) => {
      const li = document.createElement("li");
      li.textContent = `Q${i + 1} — ${p.tookSeconds}s — ${
        p.correct ? "correct" : "wrong"
      }`;
      perQuestionTimes.appendChild(li);
    });

    const attempted = perQuestion.length;
    const correct = perQuestion.filter((p) => p.correct).length;
    const incorrect = attempted - correct;
    const notAnswered = questions.length - attempted;
    const accuracy = questions.length
      ? ((correct / questions.length) * 100).toFixed(0)
      : "0";

    document.getElementById("marksObtained").textContent = correct;
    document.getElementById("marksTotal").textContent = questions.length;
    document.getElementById("qsAttempted").textContent =
      attempted + "/" + questions.length;
    document.getElementById("accuracy").textContent = accuracy + "%";
    document.getElementById("timeTaken").textContent =
      (totalTime / 60).toFixed(2) + " min";
    document.getElementById("correctCount").textContent = correct;
    document.getElementById("incorrectCount").textContent = incorrect;
    document.getElementById("notAnsweredCount").textContent = notAnswered;

    // draw chart if Chart.js available
    if (typeof Chart !== "undefined") {
      try {
        if (window._attemptsChart) {
          window._attemptsChart.destroy();
          window._attemptsChart = null;
        }
        const ctx = document.getElementById("attemptsChart").getContext("2d");
        window._attemptsChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Correct", "Incorrect", "Not Answered"],
            datasets: [{ data: [correct, incorrect, notAnswered] }],
          },
          options: { plugins: { legend: { display: false } }, cutout: "70%" },
        });
      } catch (e) {
        console.warn("Chart render failed", e);
      }
    }

    hide(document.getElementById("questionCard"));
    if (document.querySelector(".quiz-controls"))
      document.querySelector(".quiz-controls").style.display = "none";
    hide(summary);
    show(document.getElementById("resultPage"));
  }

  // Play Again and Back Home handlers
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "playAgainBtn") {
      // restart quiz with same subject; read current dropdown value
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      if (document.querySelector(".quiz-controls"))
        document.querySelector(".quiz-controls").style.display = "flex";
      const count = getSelectedCount();
      lastUsedCount = count;
      if (!currentSubject) currentSubject = "all";
      loadQuestions(currentSubject, count);
    }
    if (e.target && e.target.id === "backHomeBtn") {
      hide(quizPage);
      show(quizSelector);
    }
  });

  // shuffle helper
  function shuffleArray(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
})();
