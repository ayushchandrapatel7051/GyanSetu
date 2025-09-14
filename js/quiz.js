// js/quiz.js (updated: choose number of questions + subject-specific files + random order)
// Replaces previous quiz.js logic; keeps original UI selectors and result rendering.

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

  // find play buttons inside cards (works without changing HTML)
  const cardPlayButtons = Array.from(
    document.querySelectorAll(".card.card-game .btn")
  );

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let questionStart = null;
  let perQuestion = [];
  let timerInterval = null;
  let quizStartTime = null;
  let currentSubject = null;

  // Utility: safely hide/show elements
  function show(el) {
    if (!el) return;
    el.style.display = "";
  }
  function hide(el) {
    if (!el) return;
    el.style.display = "none";
  }

  // When the page includes both selector and quiz, ensure quiz-page hidden initially
  hide(quizPage);

  // Create a small chooser modal for number of questions
  function askNumberOfQuestions() {
    return new Promise((resolve) => {
      // If modal exists already reuse
      let modal = document.getElementById("qs-count-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "qs-count-modal";
        modal.style =
          "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:2000;";
        modal.innerHTML = `
          <div style="background:rgba(11,7,20,0.98);padding:18px;border-radius:12px;min-width:280px;box-shadow:0 12px 40px rgba(0,0,0,0.6);">
            <h3 style="margin:0 0 8px 0;font-size:18px">Choose number of questions</h3>
            <div style="display:flex;gap:10px;margin-bottom:12px">
              <button class="qs-count-btn" data-count="5" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer">5</button>
              <button class="qs-count-btn" data-count="10" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer">10</button>
              <button class="qs-count-btn" data-count="20" style="flex:1;padding:10px;border-radius:8px;border:none;cursor:pointer">20</button>
            </div>
            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button id="qs-count-cancel" style="padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:transparent;cursor:pointer">Cancel</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        // attach listeners
        modal.querySelectorAll(".qs-count-btn").forEach((b) => {
          b.addEventListener("click", (e) => {
            const val = Number(b.getAttribute("data-count") || 5);
            modal.style.display = "none";
            resolve(val);
          });
        });
        modal
          .querySelector("#qs-count-cancel")
          .addEventListener("click", () => {
            modal.style.display = "none";
            resolve(null);
          });
      } else {
        modal.style.display = "flex";
      }
    });
  }

  // Prevent inline onclick navigation on Play buttons and attach our listeners.
  cardPlayButtons.forEach((btn) => {
    // remove inline onclick attribute if present so the default location.href doesn't happen
    if (btn.hasAttribute("onclick")) btn.removeAttribute("onclick");

    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      // determine subject by looking for a sibling .tile or parent card text
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
      } else {
        subject = "all";
      }

      // Ask user how many questions they want
      const count = await askNumberOfQuestions();
      if (!count) {
        // user cancelled -> stay on selector
        return;
      }

      currentSubject = subject;
      hide(quizSelector);
      show(quizPage);

      // reset any result view if visible
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      document.querySelector(".quiz-controls").style.display = "flex";

      // now load questions for this subject and start
      loadQuestions(subject, count);
    });
  });

  // Load questions from subject-specific files and optionally limit to count
  async function loadQuestions(subject = "all", count = 10) {
    try {
      // show loading state
      questionText.textContent = "Loading questions...";
      optionsList.innerHTML = "";
      qIndexEl.textContent = 0;
      qTotalEl.textContent = 0;

      // select file based on subject
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

      // If questions have subject metadata and user requested specific subject, try to filter
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

      // Randomize order of questions
      let pool = shuffleArray(data);

      // If requested count less than pool length, slice
      if (count && count > 0 && count < pool.length) {
        pool = pool.slice(0, count);
      }

      // For safety, normalize each question (and shuffle options while tracking correct index)
      questions = pool.map((q, idx) => {
        const clone = JSON.parse(JSON.stringify(q));
        // ensure options array
        if (Array.isArray(clone.options) && clone.options.length > 1) {
          // determine correct index (number)
          const correctIdx = Number(clone.correct_option ?? clone.correct ?? 0);
          const opts = clone.options.map((o, i) => ({ o, i }));
          const shuffled = shuffleArray(opts);
          const newOptions = shuffled.map((s) => s.o);
          const newCorrect = shuffled.findIndex((s) => s.i === correctIdx);
          clone.options = newOptions;
          clone.correct_option = newCorrect;
        }
        // attach question_id if missing
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
    // ensure controls visible
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

    // Show image if present
    const qImageWrapper = document.getElementById("questionImage");
    if (q.image) {
      qImageWrapper.style.display = "";
      const img = qImageWrapper.querySelector("img");
      img.src = q.image;
      img.alt = q.image_alt || "question image";
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
    // if user quits mid-quiz, return to selector
    hide(quizPage);
    show(quizSelector);
    // reset view
    document.getElementById("questionCard").style.display = "block";
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

    // Stats
    const attempted = perQuestion.length;
    const correct = perQuestion.filter((p) => p.correct).length;
    const incorrect = attempted - correct;
    const notAnswered = questions.length - attempted;
    const accuracy = questions.length
      ? ((correct / questions.length) * 100).toFixed(0)
      : "0";

    // Fill result page
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

    // draw chart if Chart is available
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
            datasets: [
              {
                data: [correct, incorrect, notAnswered],
                backgroundColor: ["#34d399", "#ef4444", "#6b7280"],
              },
            ],
          },
          options: { plugins: { legend: { display: false } }, cutout: "70%" },
        });
      } catch (e) {
        console.warn("Chart render failed", e);
      }
    }

    // show result page
    hide(document.getElementById("questionCard"));
    hide(document.querySelector(".quiz-controls"));
    hide(summary);
    show(document.getElementById("resultPage"));
  }

  // Global click handler for playAgain & backHome
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "playAgainBtn") {
      // restart quiz with same subject; ask again for number of questions
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      document.querySelector(".quiz-controls").style.display = "flex";
      (async () => {
        const count = await askNumberOfQuestions();
        if (!count) return;
        loadQuestions(currentSubject, count);
      })();
    }
    if (e.target && e.target.id === "backHomeBtn") {
      // go back to selector
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

  // Do NOT auto-load questions here. Quiz will start when a Play button is clicked.
})();
