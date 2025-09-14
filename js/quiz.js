// js/quiz.js — dropdown selector + reliable restart
(() => {
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

      // shuffle pool then slice to requested count
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
    } else {
      li.classList.add("wrong");
      if (optionsList.children[correctIdx])
        optionsList.children[correctIdx].classList.add("correct");
    }
    perQuestion.push({
      id: q.question_id ?? currentIndex,
      tookSeconds: took.toFixed(2),
      correct: idx === correctIdx,
    });
    lastAnswerTime.textContent = `Answered in ${took.toFixed(2)}s`;
    scoreEl.textContent = score;
    nextBtn.disabled = false;
    updateProgress();
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
