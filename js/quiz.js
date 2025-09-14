// quiz.js
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
  // (Your HTML had style="display: none" already, but ensure here too)
  hide(quizPage);

  // Prevent inline onclick navigation on Play buttons and attach our listeners.
  cardPlayButtons.forEach((btn) => {
    // remove inline onclick attribute if present so the default location.href doesn't happen
    if (btn.hasAttribute("onclick")) btn.removeAttribute("onclick");

    // determine subject by looking for a sibling .tile or parent card text
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      // try to detect subject
      const card = btn.closest(".card");
      let subject = null;
      if (card) {
        const tile = card.querySelector(".tile");
        if (tile && tile.textContent)
          subject = tile.textContent.trim().toLowerCase();
        else {
          // try h3 text fallback
          const h3 = card.querySelector("h3");
          if (h3 && h3.textContent)
            subject = h3.textContent.trim().toLowerCase();
        }
      }
      // normalize subject to a keyword (math / science / other)
      if (subject) {
        if (subject.includes("math")) subject = "math";
        else if (subject.includes("science")) subject = "science";
        else subject = subject.split(" ")[0];
      } else {
        subject = "all";
      }

      // store and show quiz
      currentSubject = subject;
      hide(quizSelector);
      show(quizPage);

      // reset any result view if visible
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      document.querySelector(".quiz-controls").style.display = "flex";

      // now load questions for this subject and start
      loadQuestions(subject);
    });
  });

  // Load questions.json and optionally filter by subject
  async function loadQuestions(subject = "all") {
    try {
      // show loading state
      questionText.textContent = "Loading questions...";
      optionsList.innerHTML = "";
      qIndexEl.textContent = 0;
      qTotalEl.textContent = 0;

      const res = await fetch("../data/questions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load questions.json");
      let data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        questionText.textContent = "No questions available.";
        questions = [];
        return;
      }

      // If questions have a 'subject' or 'category' property, filter by it.
      if (subject && subject !== "all") {
        const normalized = subject.toLowerCase();
        const filtered = data.filter((q) => {
          const s = (q.subject || q.category || q.topic || "")
            .toString()
            .toLowerCase();
          // match exact or includes
          return s === normalized || s.includes(normalized);
        });
        // fallback to math/science keyword matching inside question text if nothing matched
        if (filtered.length > 0) data = filtered;
        else {
          const fallback = data.filter((q) => {
            const combined = (q.question || "" + q.options || "")
              .toString()
              .toLowerCase();
            return combined.includes(normalized);
          });
          if (fallback.length > 0) data = fallback;
          // else keep full data (so user still gets a quiz if no subject metadata)
        }
      }

      questions = data;
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
      // restart quiz with same subject
      hide(document.getElementById("resultPage"));
      show(document.getElementById("questionCard"));
      document.querySelector(".quiz-controls").style.display = "flex";
      // optionally reshuffle:
      // questions = shuffleArray(questions);
      startQuiz();
    }
    if (e.target && e.target.id === "backHomeBtn") {
      // go back to selector
      hide(quizPage);
      show(quizSelector);
    }
  });

  // optional: shuffle helper if you want to shuffle on restart
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
