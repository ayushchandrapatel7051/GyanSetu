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
    const res = await fetch("questions.json");
    questions = await res.json();
    qTotalEl.textContent = questions.length;
    startQuiz();
  }

  function startQuiz() {
    currentIndex = 0;
    score = 0;
    perQuestion = [];
    quizStartTime = Date.now();
    renderCurrent();
  }

  function renderCurrent() {
    clearInterval(timerInterval);
    const q = questions[currentIndex];
    qIndexEl.textContent = currentIndex + 1;
    questionText.textContent = q.question;
    optionsList.innerHTML = "";
    q.options.forEach((opt, idx) => {
      const li = document.createElement("li");
      li.textContent = opt;
      li.onclick = () => handleAnswer(li, idx);
      optionsList.appendChild(li);
    });
    questionStart = Date.now();
    timerInterval = setInterval(() => {
      timerDisplay.textContent =
        ((Date.now() - questionStart) / 1000).toFixed(1) + "s";
    }, 100);
    nextBtn.disabled = true;
  }

  function handleAnswer(li, idx) {
    clearInterval(timerInterval);
    const q = questions[currentIndex];
    const took = (Date.now() - questionStart) / 1000;
    [...optionsList.children].forEach((el) => el.classList.add("disabled"));
    if (idx === q.correct_option) {
      li.classList.add("correct");
      score++;
    } else {
      li.classList.add("wrong");
      optionsList.children[q.correct_option].classList.add("correct");
    }
    perQuestion.push({
      id: q.question_id,
      tookSeconds: took.toFixed(2),
      correct: idx === q.correct_option,
    });
    //lastAnswerTime.textContent = `Answered in ${took.toFixed(2)}s`;
    scoreEl.textContent = score;
    nextBtn.disabled = false;
    progressFill.style.width =
      ((currentIndex + 1) / questions.length) * 100 + "%";
  }

  nextBtn.onclick = () => {
    currentIndex >= questions.length - 1
      ? finishQuiz()
      : renderCurrent(++currentIndex);
  };
  quitBtn.onclick = () => (location.href = "index.html");

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
    const accuracy = ((correct / questions.length) * 100).toFixed(0);

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

    new Chart(document.getElementById("attemptsChart"), {
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
      options: { plugins: { legend: { position: "bottom" } } },
    });

    document.getElementById("questionCard").style.display = "none";
    document.querySelector(".quiz-controls").style.display = "none";
    summary.style.display = "none";
    document.getElementById("resultPage").style.display = "block";
  }

  document.addEventListener("click", (e) => {
    if (e.target.id === "playAgainBtn") {
      startQuiz();
      document.getElementById("resultPage").style.display = "none";
      document.getElementById("questionCard").style.display = "block";
      document.querySelector(".quiz-controls").style.display = "flex";
    }
    if (e.target.id === "backHomeBtn") {
      location.href = "index.html";
    }
  });

  loadQuestions();
})();
