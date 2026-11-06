import { Quiz } from "./Quiz.js";
import { Question } from "./Question.js";

const quizOptionsForm = document.querySelector("#quizOptions");
const playerNameInput = document.querySelector("#playerName");
const categoryInput = document.querySelector("#categoryMenu");
const difficultyInput = document.querySelector("#difficultyOptions");
const questionsNumberInput = document.querySelector("#questionsNumber");
const startQuizBtn = document.querySelector("#startQuiz");
const questionsContainer = document.querySelector("#questionsContainer");

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading">
      <p>Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  questionsContainer.innerHTML = "";
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="error">
      <p>${message}</p>
      <button type="button" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

function showFormError(message) {
  let errorElement = document.querySelector(".form-error");

  if (!errorElement) {
    errorElement = document.createElement("p");
    errorElement.className = "form-error";
    quizOptionsForm.prepend(errorElement);
  }

  errorElement.textContent = message;
}

function validateForm() {
  const playerName = playerNameInput.value.trim();
  const numberOfQuestions = Number(questionsNumberInput.value);

  if (!playerName) {
    showFormError("Please enter your name.");
    playerNameInput.focus();
    return false;
  }

  if (
    !numberOfQuestions ||
    numberOfQuestions < 1 ||
    numberOfQuestions > 50
  ) {
    showFormError("Please enter a number between 1 and 50.");
    questionsNumberInput.focus();
    return false;
  }

  const errorElement = document.querySelector(".form-error");

  if (errorElement) {
    errorElement.remove();
  }

  return true;
}

function resetToStart() {
  quizOptionsForm.style.display = "block";
  questionsContainer.innerHTML = "";
  currentQuiz = null;
}

async function startQuiz() {
  console.log("startQuiz function started");

  if (!validateForm()) {
    console.log("Form validation failed");
    return;
  }

  console.log("Form validation passed");

  const playerName = playerNameInput.value.trim();
  const category = categoryInput.value;
  const difficulty = difficultyInput.value;
  const numberOfQuestions = Number(questionsNumberInput.value);

  try {
    startQuizBtn.disabled = true;
    quizOptionsForm.style.display = "none";

    showLoading();

    console.log("Creating Quiz...");

    currentQuiz = new Quiz(
      category,
      difficulty,
      numberOfQuestions,
      playerName
    );

    console.log("Fetching Questions...");

    await currentQuiz.getQuestions();

    console.log("Questions Loaded:", currentQuiz.questions);

    hideLoading();

    const question = new Question(
      currentQuiz,
      questionsContainer,
      resetToStart
    );

    question.displayQuestion();

  } catch (error) {
    console.error("Quiz Error:", error);

    showError(
      error.message || "Something went wrong. Please try again."
    );

    quizOptionsForm.style.display = "block";

  } finally {
    startQuizBtn.disabled = false;
  }
}

startQuizBtn.addEventListener("click", (event) => {
  event.preventDefault();
  startQuiz();
});

questionsNumberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
  }
});