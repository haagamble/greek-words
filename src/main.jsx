import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { words } from "../words.js";
import { bigTopics } from "../big-topic.js";
import "./styles.css";

const QUESTION_COUNT = 10;
const OPTION_COUNT = 4;

const categoryLabels = {
  "food-drink": "Food and Drink",
  "people-family": "People and Family",
  "abstract-nouns": "Abstract Nouns",
  adverbs: "Adverbs",
  adjectives: "Adjectives",
  animals: "Animals",
  appliances: "Appliances",
  "body-health": "Body and Health",
  clothing: "Clothing",
  communication: "Communication",
  colours: "Colours",
  "common-phrases": "Common Phrases",
  comparatives: "Comparatives",
  "days-week": "Days of the Week",
  elements: "Elements",
  flowers: "Flowers",
  "function-words": "Function Words",
  geography: "Geography",
  "house-parts": "House Parts",
  household: "Household Items",
  "law-rules": "Law and Rules",
  materials: "Materials",
  measurements: "Units of Measurement",
  "money-shopping": "Money and Shopping",
  "musical-instruments": "Musical Instruments",
  nature: "Nature",
  "nature-places": "Nature Places",
  numbers: "Numbers",
  ordinals: "Ordinals",
  participles: "Participles",
  "people-roles": "People and Roles",
  "personal-care": "Personal Care",
  places: "Places",
  "precious-stones": "Precious Stones",
  prepositions: "Prepositions",
  professions: "Professions",
  pronouns: "Pronouns",
  "question-words": "Question Words",
  "road-travel": "Road Travel",
  rooms: "Rooms",
  seasons: "Seasons",
  "school-subjects": "School Subjects",
  "school-office": "School and Office",
  shapes: "Shapes",
  space: "Space",
  "spices-seasonings": "Spices and Seasonings",
  sports: "Sports",
  technology: "Technology",
  "time-expressions": "Time Expressions",
  "time-units": "Time Units",
  "tools-objects": "Tools and Objects",
  toys: "Toys",
  travel: "Travel",
  vehicles: "Vehicles",
  verbs: "Verbs",
  weather: "Weather",
};

function repairText(value) {
  if (typeof value !== "string" || !/[ÎÏ]/.test(value)) {
    return value;
  }

  const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 255);
  return new TextDecoder("utf-8").decode(bytes);
}

const cleanWords = words.map((word) => ({
  ...word,
  greek: repairText(word.greek),
  article: repairText(word.article),
}));

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function getQuizWords(pool) {
  return shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
}

function getOptions(answer, allWords) {
  const sameLevelWrongAnswers = uniqueBy(
    shuffle(
      allWords.filter(
        (word) =>
          word.category === answer.category &&
          word.level === answer.level &&
          word.english !== answer.english
      )
    ),
    (word) => word.english
  );

  const sameCategoryWrongAnswers = uniqueBy(
    shuffle(
      allWords.filter(
        (word) =>
          word.category === answer.category &&
          word.english !== answer.english
      )
    ),
    (word) => word.english
  );

  const fallbackWrongAnswers = uniqueBy(
    shuffle(allWords.filter((word) => word.english !== answer.english)),
    (word) => word.english
  );

  const wrongAnswers = uniqueBy(
    [...sameLevelWrongAnswers, ...sameCategoryWrongAnswers, ...fallbackWrongAnswers],
    (word) => word.english
  ).slice(0, OPTION_COUNT - 1);

  return shuffle([answer, ...wrongAnswers]).map((word) => word.english);
}

function getLevelItems() {
  return [...new Set(cleanWords.map((word) => word.level))]
    .sort((a, b) => a - b)
    .map((level) => {
      const count = cleanWords.filter((word) => word.level === level).length;
      return {
        id: String(level),
        title: `Level ${level}`,
        meta: `${count} words`,
      };
    });
}

function getCategoryItems() {
  return bigTopics.map((topic) => {
      const count = getTopicWords(topic, cleanWords).length;
      return {
        id: topic.id,
        title: topic.label,
        meta: `${count} words`,
      };
    });
}

function getCategoryPosition(word, allWords) {
  return allWords.filter((item) => item.category === word.category).findIndex((item) => item.id === word.id);
}

function isInSplit(word, split, allWords) {
  if (!split) {
    return true;
  }

  const categoryWords = allWords.filter((item) => item.category === word.category);
  const halfway = Math.ceil(categoryWords.length / 2);
  const position = getCategoryPosition(word, allWords);

  return split === "first" ? position < halfway : position >= halfway;
}

function getTopicWords(topic, allWords) {
  return allWords.filter((word) => {
    if (!topic.categories.includes(word.category)) {
      return false;
    }

    return isInSplit(word, topic.split?.[word.category], allWords);
  });
}

function App() {
  const [mode, setMode] = useState("level");
  const [selection, setSelection] = useState(null);
  const [quizWords, setQuizWords] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const levelItems = useMemo(getLevelItems, []);
  const categoryItems = useMemo(getCategoryItems, []);
  const selectionItems = mode === "level" ? levelItems : categoryItems;
  const selectedTopic = bigTopics.find((topic) => topic.id === selection);
  const selectedPool =
    mode === "level"
      ? cleanWords.filter((word) => word.level === Number(selection))
      : selectedTopic
        ? getTopicWords(selectedTopic, cleanWords)
        : [];

  const currentWord = quizWords[currentIndex];
  const currentAnswer = answers[currentIndex];
  const score = answers.filter((answer) => answer?.isCorrect).length;
  const isQuizStarted = quizWords.length > 0;
  const isComplete = isQuizStarted && currentIndex >= quizWords.length;

  const options = useMemo(() => {
    if (!currentWord) {
      return [];
    }
    return getOptions(currentWord, cleanWords);
  }, [currentWord]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setSelection(null);
  }

  function startQuiz() {
    const nextQuizWords = getQuizWords(selectedPool);
    setQuizWords(nextQuizWords);
    setAnswers([]);
    setCurrentIndex(0);
  }

  function chooseAnswer(answer) {
    if (currentAnswer) {
      return;
    }

    setAnswers((previousAnswers) => {
      const nextAnswers = [...previousAnswers];
      nextAnswers[currentIndex] = {
        answer,
        isCorrect: answer === currentWord.english,
      };
      return nextAnswers;
    });
  }

  function nextQuestion() {
    setCurrentIndex((index) => index + 1);
  }

  function resetQuiz() {
    setQuizWords([]);
    setAnswers([]);
    setCurrentIndex(0);
  }

  function replaySelection() {
    const nextQuizWords = getQuizWords(selectedPool);
    setQuizWords(nextQuizWords);
    setAnswers([]);
    setCurrentIndex(0);
  }

  return (
    <main className={`app-shell ${isQuizStarted && !isComplete ? "quiz-active" : ""}`}>
      {!isQuizStarted && (
        <section className="setup-panel" aria-labelledby="setup-heading">
          <p className="eyebrow">Greek vocabulary</p>
          <h1 id="setup-heading">Select a Word List</h1>

          <div className="mode-toggle" aria-label="Quiz type">
            <button
              className={mode === "level" ? "active" : ""}
              type="button"
              onClick={() => changeMode("level")}
            >
              Levels
            </button>
            <button
              className={mode === "category" ? "active" : ""}
              type="button"
              onClick={() => changeMode("category")}
            >
              Topics
            </button>
          </div>

          <p className="availability">
            {selectionItems.length} {mode === "level" ? "levels" : "topics"} available
          </p>

          <div className="selection-grid">
            {selectionItems.map((item) => (
              <button
                className={`selection-card ${selection === item.id ? "selected" : ""}`}
                type="button"
                key={item.id}
                onClick={() => setSelection(item.id)}
              >
                <span>{item.title}</span>
                <small>{item.meta}</small>
              </button>
            ))}
          </div>

          <button className="primary-action" type="button" disabled={!selection} onClick={startQuiz}>
            <Sparkles size={20} />
            Start 10-question quiz
          </button>
        </section>
      )}

      {isQuizStarted && !isComplete && currentWord && (
        <section className="quiz-panel" aria-labelledby="question-heading">
          <div className="quiz-topbar">
            <button className="icon-button" type="button" onClick={resetQuiz} aria-label="Back to lists">
              <ArrowLeft size={20} />
            </button>
            <div className="progress-copy">
              <span>
                Question {currentIndex + 1} of {quizWords.length}
              </span>
              <strong>{score} correct</strong>
            </div>
          </div>

          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${((currentIndex + 1) / quizWords.length) * 100}%` }} />
          </div>

          <div className="word-prompt">
            <p>Choose the English meaning</p>
            <h2 id="question-heading">
              {currentWord.article && <span>{currentWord.article}</span>} {currentWord.greek}
            </h2>
          </div>

          <div className="answers-grid">
            {options.map((option) => {
              const isSelected = currentAnswer?.answer === option;
              const isCorrect = currentAnswer && option === currentWord.english;
              const isWrong = currentAnswer && isSelected && !isCorrect;

              return (
                <button
                  className={`answer-button ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                  type="button"
                  key={option}
                  onClick={() => chooseAnswer(option)}
                >
                  <span>{option}</span>
                  {isCorrect && <Check size={18} />}
                  {isWrong && <X size={18} />}
                </button>
              );
            })}
          </div>

          <div className={`feedback-row ${currentAnswer ? "visible" : ""}`} aria-hidden={!currentAnswer}>
            <p>
              {currentAnswer
                ? currentAnswer.isCorrect
                  ? "Correct."
                  : `Correct answer: ${currentWord.english}`
                : "Answer feedback"}
            </p>
            <button
              className="secondary-action"
              type="button"
              onClick={nextQuestion}
              disabled={!currentAnswer}
              tabIndex={currentAnswer ? 0 : -1}
            >
                {currentIndex + 1 === quizWords.length ? "See results" : "Next question"}
            </button>
          </div>
        </section>
      )}

      {isComplete && (
        <section className="results-panel" aria-labelledby="results-heading">
          <p className="eyebrow">Quiz complete</p>
          <h1 id="results-heading">
            {score}/{quizWords.length}
          </h1>
          <p className="results-copy">
            {score === quizWords.length
              ? "Perfect score. That list is yours now."
              : "Review the missed words and try another round when you are ready."}
          </p>

          <div className="review-list">
            {quizWords.map((word, index) => (
              <div className="review-item" key={`${word.id}-${index}`}>
                <strong>
                  {word.article ? `${word.article} ` : ""}
                  {word.greek}
                </strong>
                <span>{word.english}</span>
                {answers[index]?.isCorrect ? <Check size={18} /> : <X size={18} />}
              </div>
            ))}
          </div>

          <div className="result-actions">
            <button className="secondary-action" type="button" onClick={resetQuiz}>
              Choose another list
            </button>
            <button className="primary-action compact" type="button" onClick={replaySelection}>
              <RotateCcw size={19} />
              Try again
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
