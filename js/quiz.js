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

  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let questionStart = null;
  let perQuestion = [];
  let timerInterval = null;
  let quizStartTime = null;

  async function loadQuestions() {
    try {
      const res = await fetch("../data/questions.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load questions.json");
      questions = await res.json();
      if (!Array.isArray(questions) || questions.length === 0) {
        questionText.textContent = "No questions available.";
        return;
      }
      qTotalEl.textContent = questions.length;
      startQuiz();
    } catch (err) {
      console.error(err);
      questionText.textContent = "Error loading questions.";
    }
  }

  function startQuiz() {
    currentIndex = 0;
    score = 0;
    perQuestion = [];
    quizStartTime = Date.now();
    scoreEl.textContent = 0;
    renderCurrent();
    updateProgress();
  }

  function renderCurrent() {
    clearInterval(timerInterval);
    const q = questions[currentIndex];
    qIndexEl.textContent = currentIndex + 1;
    questionText.textContent = q.question || "No question text";
    optionsList.innerHTML = "";
    q.options.forEach((opt, idx) => {
      const li = document.createElement("li");
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

  quitBtn.addEventListener("click", () => (location.href = "index.html"));

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
        // destroy existing chart if any
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
    document.getElementById("questionCard").style.display = "none";
    document.querySelector(".quiz-controls").style.display = "none";
    summary.style.display = "none";
    document.getElementById("resultPage").style.display = "block";
  }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "playAgainBtn") {
      // restart quiz
      document.getElementById("resultPage").style.display = "none";
      document.getElementById("questionCard").style.display = "block";
      document.querySelector(".quiz-controls").style.display = "flex";
      // shuffle if you like or keep order
      // questions = shuffleArray(questions);
      startQuiz();
    }
    if (e.target && e.target.id === "backHomeBtn") {
      location.href = "index.html";
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

  loadQuestions();
})();
