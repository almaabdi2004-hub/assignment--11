export class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    const url = this.buildApiUrl();

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to connect to the server.");
    }

    const data = await response.json();

    if (data.response_code !== 0) {
      const errors = {
        1: "Not enough questions available for these options.",
        2: "Invalid quiz parameters.",
        3: "Session token not found.",
        4: "Session token has no more questions.",
        5: "Too many requests. Please wait a moment."
      };

      throw new Error(
        errors[data.response_code] || "Something went wrong."
      );
    }

    this.questions = data.results;

    return this.questions;
  }

  buildApiUrl() {
    const params = new URLSearchParams();

    params.append("amount", this.numberOfQuestions);
    params.append("difficulty", this.difficulty);
    params.append("type", "multiple");

    if (this.category) {
      params.append("category", this.category);
    }

    return `https://opentdb.com/api.php?${params.toString()}`;
  }

  incrementScore() {
    this.score++;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  nextQuestion() {
    this.currentQuestionIndex++;

    return !this.isComplete();
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    if (!this.questions.length) return 0;

    return Math.round(
      (this.score / this.questions.length) * 100
    );
  }

  getHighScores() {
    try {
      return JSON.parse(
        localStorage.getItem("quizHighScores")
      ) || [];
    } catch {
      return [];
    }
  }

  isHighScore() {
    const scores = this.getHighScores();
    const percentage = this.getScorePercentage();

    if (scores.length < 10) {
      return true;
    }

    const lowestScore = scores[scores.length - 1].percentage;

    return percentage > lowestScore;
  }

  saveHighScore() {
    const scores = this.getHighScores();

    const newScore = {
      name: this.playerName,
      score: this.score,
      total: this.questions.length,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString()
    };

    scores.push(newScore);

    scores.sort((a, b) => b.percentage - a.percentage);

    localStorage.setItem(
      "quizHighScores",
      JSON.stringify(scores.slice(0, 10))
    );
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    const newRecord = this.isHighScore();

    if (newRecord) {
      this.saveHighScore();
    }

    const highScores = this.getHighScores();

    const leaderboard = highScores
      .map((item, index) => {
        let rankClass = "";

        if (index === 0) rankClass = "gold";
        else if (index === 1) rankClass = "silver";
        else if (index === 2) rankClass = "bronze";

        return `
          <li class="leaderboard-item ${rankClass}">
            <span class="leaderboard-rank">#${index + 1}</span>
            <span class="leaderboard-name">${this.escapeHTML(item.name)}</span>
            <span class="leaderboard-score">${item.percentage}%</span>
          </li>
        `;
      })
      .join("");

    return `
      <div class="game-card results-card">

        <div class="results-trophy">🏆</div>

        <h2 class="results-title">Quiz Complete!</h2>

        <p class="results-score-display">
          ${this.score}/${this.questions.length}
        </p>

        <p class="results-percentage">
          ${percentage}% Accuracy
        </p>

        ${
          newRecord
            ? `
              <div class="new-record-badge">
                <i class="fa-solid fa-star"></i>
                New High Score!
              </div>
            `
            : ""
        }

        <div class="leaderboard">

          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i>
            Leaderboard
          </h4>

          <ul class="leaderboard-list">
            ${leaderboard}
          </ul>

        </div>

        <div class="action-buttons">
          <button class="btn-play btn-restart">
            <i class="fa-solid fa-rotate-right"></i>
            Play Again
          </button>
        </div>

      </div>
    `;
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
}