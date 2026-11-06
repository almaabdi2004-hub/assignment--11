import { Sound } from "./Sounds.js";

export class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(
      this.questionData.correct_answer
    );

    this.category = this.decodeHtml(
      this.questionData.category
    );

    this.wrongAnswers = this.questionData.incorrect_answers.map(
      (answer) => this.decodeHtml(answer)
    );

    this.allAnswers = this.shuffleAnswers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 30;
    this.transitioning = false;

    this.answerHandlers = [];
    this.keyboardHandler = null;
  }

  decodeHtml(html) {
    const parser = new DOMParser();

    return parser.parseFromString(
      html,
      "text/html"
    ).documentElement.textContent;
  }

  escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[char];
    });
  }

  shuffleAnswers() {
    const answers = [
      ...this.wrongAnswers,
      this.correctAnswer
    ];

    for (let i = answers.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(
        Math.random() * (i + 1)
      );

      [answers[i], answers[randomIndex]] = [
        answers[randomIndex],
        answers[i]
      ];
    }

    return answers;
  }

  getProgress() {
    return Math.round(
      ((this.index + 1) / this.quiz.numberOfQuestions) * 100
    );
  }

  displayQuestion() {
    const progress = this.getProgress();

    const difficultyIcons = {
      easy: "fa-face-smile",
      medium: "fa-face-meh",
      hard: "fa-skull"
    };

    const answersHTML = this.allAnswers
      .map((answer, index) => `
        <button
          class="answer-btn"
          data-answer="${this.escapeHTML(answer)}"
        >
          <span class="answer-key">${index + 1}</span>
          <span class="answer-text">${this.escapeHTML(answer)}</span>
        </button>
      `)
      .join("");

    this.container.innerHTML = `
      <div class="game-card question-card">

        <div class="xp-bar-container">

          <div class="xp-bar-header">
            <span class="xp-label">
              <i class="fa-solid fa-bolt"></i>
              Progress
            </span>

            <span class="xp-value">
              Question ${this.index + 1}/${this.quiz.questions.length}
            </span>
          </div>

          <div class="xp-bar">
            <div
              class="xp-bar-fill"
              style="width: ${progress}%"
            ></div>
          </div>

        </div>

        <div class="stats-row">

          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.escapeHTML(this.category)}</span>
          </div>

          <div class="stat-badge difficulty ${this.quiz.difficulty}">
            <i class="fa-solid ${difficultyIcons[this.quiz.difficulty]}"></i>
            <span>${this.quiz.difficulty}</span>
          </div>

          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">30</span>s
          </div>

          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>
              ${this.index + 1}/${this.quiz.questions.length}
            </span>
          </div>

        </div>

        <h2 class="question-text">
          ${this.escapeHTML(this.question)}
        </h2>

        <div class="answers-grid">
          ${answersHTML}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i>
          Press 1-4 to select
        </p>

        <div class="score-panel">

          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">
              ${this.quiz.score}
            </div>
          </div>

        </div>

      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const answerButtons = this.container.querySelectorAll(
      ".answer-btn"
    );

    answerButtons.forEach((button) => {
      const handler = () => this.checkAnswer(button);

      button.addEventListener("click", handler);

      this.answerHandlers.push({
        button,
        handler
      });
    });

    this.keyboardHandler = (event) => {
      if (this.answered) return;

      if (event.target.matches("input, textarea")) return;

      const key = Number(event.key);

      if (key >= 1 && key <= 4) {
        const button = answerButtons[key - 1];

        if (button) {
          this.checkAnswer(button);
        }
      }
    };

    document.addEventListener(
      "keydown",
      this.keyboardHandler
    );
  }

  removeEventListeners() {
    this.answerHandlers.forEach(({ button, handler }) => {
      button.removeEventListener("click", handler);
    });

    this.answerHandlers = [];

    if (this.keyboardHandler) {
      document.removeEventListener(
        "keydown",
        this.keyboardHandler
      );

      this.keyboardHandler = null;
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const timerValue = this.container.querySelector(
        ".timer-value"
      );

      const timerBadge = this.container.querySelector(
        ".stat-badge.timer"
      );

      if (timerValue) {
        timerValue.textContent = this.timeRemaining;
      }

      if (this.timeRemaining <= 10) {
        timerBadge?.classList.add("warning");
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  handleTimeUp() {
    if (this.answered) return;

    this.answered = true;

    Sound.timeUp();

    this.removeEventListeners();

    const buttons = this.container.querySelectorAll(
      ".answer-btn"
    );

    buttons.forEach((button) => {
      button.classList.add("disabled");

      if (
        button.dataset.answer.toLowerCase() ===
        this.correctAnswer.toLowerCase()
      ) {
        button.classList.add("correct-reveal");
      }
    });

    const questionText = this.container.querySelector(
      ".question-text"
    );

    questionText.insertAdjacentHTML(
      "afterend",
      `
        <div class="time-up-message">
          <i class="fa-solid fa-clock"></i>
          TIME'S UP!
        </div>
      `
    );

    this.animateQuestion();
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;

    this.answered = true;

    this.stopTimer();
    this.removeEventListeners();

    const selectedAnswer = choiceElement.dataset.answer;

    const isCorrect =
      selectedAnswer.toLowerCase() ===
      this.correctAnswer.toLowerCase();

    if (isCorrect) {
      Sound.correct();

      choiceElement.classList.add("correct");

      this.quiz.incrementScore();

      const scoreValue = this.container.querySelector(
        ".score-item-value"
      );

      if (scoreValue) {
        scoreValue.textContent = this.quiz.score;
      }
    } else {
      Sound.wrong();

      choiceElement.classList.add("wrong");

      this.highlightCorrectAnswer();
    }

    const buttons = this.container.querySelectorAll(
      ".answer-btn"
    );

    buttons.forEach((button) => {
      button.classList.add("disabled");
      button.disabled = true;
    });

    this.animateQuestion();
  }

  highlightCorrectAnswer() {
    const buttons = this.container.querySelectorAll(
      ".answer-btn"
    );

    buttons.forEach((button) => {
      if (
        button.dataset.answer.toLowerCase() ===
        this.correctAnswer.toLowerCase()
      ) {
        button.classList.add("correct-reveal");
      }
    });
  }

  getNextQuestion() {
    const hasNextQuestion = this.quiz.nextQuestion();

    if (hasNextQuestion) {
      const nextQuestion = new Question(
        this.quiz,
        this.container,
        this.onQuizEnd
      );

      nextQuestion.displayQuestion();

    } else {
      Sound.complete();

      this.container.innerHTML = this.quiz.endQuiz();

      const restartButton = this.container.querySelector(
        ".btn-restart"
      );

      restartButton.addEventListener(
        "click",
        this.onQuizEnd
      );
    }
  }

  animateQuestion(duration = 300) {
    if (this.transitioning) return;

    this.transitioning = true;

    setTimeout(() => {
      const card = this.container.querySelector(
        ".question-card"
      );

      if (!card) return;

      card.style.transition = "all 0.3s ease";
      card.style.opacity = "0";
      card.style.transform = "translateY(-30px)";

      setTimeout(() => {
        this.getNextQuestion();
      }, duration);

    }, 1500);
  }
}