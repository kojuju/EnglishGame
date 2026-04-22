const GAME_CONFIG = {
  questionsPerRound: 10,
  totalTimeSeconds: 75,
  startingLives: 3,
  baseScore: 100,
  feedbackDelayMs: 850
};

const STORAGE_KEYS = {
  selectedLevel: "englishGame.selectedLevel",
  statsByLevel: "englishGame.statsByLevel",
  wrongWordsByLevel: "englishGame.wrongWordsByLevel"
};

const DEFAULT_LEVEL = "cet4";

const state = {
  currentScreen: "home",
  selectedLevel: DEFAULT_LEVEL,
  pendingLevel: DEFAULT_LEVEL,
  questions: [],
  currentIndex: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  lives: GAME_CONFIG.startingLives,
  timeLeft: GAME_CONFIG.totalTimeSeconds,
  correctCount: 0,
  answeredCount: 0,
  wrongWords: [],
  scrollLockY: 0,
  timerId: null,
  lockInput: false,
  roundFinished: false
};

const screens = {
  home: document.getElementById("screen-home"),
  game: document.getElementById("screen-game"),
  result: document.getElementById("screen-result")
};

const elements = {
  startButton: document.getElementById("start-button"),
  playAgainButton: document.getElementById("play-again-button"),
  backHomeButton: document.getElementById("back-home-button"),
  toggleReviewButton: document.getElementById("toggle-review-button"),
  openSettingsButton: document.getElementById("open-settings-button"),
  settingsModal: document.getElementById("settings-modal"),
  closeSettingsButton: document.getElementById("close-settings-button"),
  cancelSettingsButton: document.getElementById("cancel-settings-button"),
  saveSettingsButton: document.getElementById("save-settings-button"),
  levelOptions: document.getElementById("level-options"),
  currentLevelChip: document.getElementById("current-level-chip"),
  currentLevelBadge: document.getElementById("current-level-badge"),
  homeReviewPanel: document.getElementById("home-review-panel"),
  homeReviewList: document.getElementById("home-review-list"),
  homeReviewEmpty: document.getElementById("home-review-empty"),
  bestScore: document.getElementById("best-score"),
  latestAccuracy: document.getElementById("latest-accuracy"),
  wordBankSize: document.getElementById("word-bank-size"),
  questionProgress: document.getElementById("question-progress"),
  timerValue: document.getElementById("timer-value"),
  scoreValue: document.getElementById("score-value"),
  livesValue: document.getElementById("lives-value"),
  comboValue: document.getElementById("combo-value"),
  posTag: document.getElementById("pos-tag"),
  difficultyTag: document.getElementById("difficulty-tag"),
  questionWord: document.getElementById("question-word"),
  questionPhonetic: document.getElementById("question-phonetic"),
  optionsGrid: document.getElementById("options-grid"),
  feedbackBox: document.getElementById("feedback-box"),
  resultScore: document.getElementById("result-score"),
  resultCorrect: document.getElementById("result-correct"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultBestCombo: document.getElementById("result-best-combo"),
  resultSummary: document.getElementById("result-summary"),
  resultReviewList: document.getElementById("result-review-list"),
  resultReviewEmpty: document.getElementById("result-review-empty"),
  wrongCount: document.getElementById("wrong-count")
};

function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
  }

  return clone;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getComboBonus(combo) {
  if (combo >= 8) {
    return 100;
  }

  if (combo >= 5) {
    return 50;
  }

  if (combo >= 3) {
    return 20;
  }

  return 0;
}

function getDifficultyLabel(difficulty) {
  const labels = {
    easy: "基础",
    medium: "进阶",
    hard: "困难"
  };

  return labels[difficulty] || "基础";
}

function getLevelMeta(levelId) {
  return LEVEL_OPTIONS.find((option) => option.id === levelId) || LEVEL_OPTIONS.find((option) => option.id === DEFAULT_LEVEL);
}

function getWordsForLevel(levelId) {
  return WORD_BANK.filter((word) => word.level === levelId);
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSavedStatsMap() {
  return readJsonStorage(STORAGE_KEYS.statsByLevel, {});
}

function getLevelStats(levelId) {
  const statsMap = getSavedStatsMap();
  return statsMap[levelId] || { bestScore: 0, latestAccuracy: 0 };
}

function getSavedWrongWordMap() {
  return readJsonStorage(STORAGE_KEYS.wrongWordsByLevel, {});
}

function getSavedWrongWords(levelId) {
  const wrongWordMap = getSavedWrongWordMap();
  const ids = wrongWordMap[levelId] || [];

  return ids
    .map((id) => WORD_BANK.find((word) => word.id === id))
    .filter(Boolean);
}

function getStoredLevel() {
  const storedLevel = localStorage.getItem(STORAGE_KEYS.selectedLevel);
  return LEVEL_OPTIONS.some((option) => option.id === storedLevel) ? storedLevel : DEFAULT_LEVEL;
}

function persistSelectedLevel() {
  localStorage.setItem(STORAGE_KEYS.selectedLevel, state.selectedLevel);
}

function setBodyScrollLock(locked) {
  if (locked) {
    state.scrollLockY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = `-${state.scrollLockY}px`;
    document.body.classList.add("modal-open");
    return;
  }

  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, state.scrollLockY);
}

function takeUniqueDistractors(pool, limit) {
  const picked = [];
  const usedMeanings = new Set();

  for (const item of pool) {
    if (usedMeanings.has(item.meaning)) {
      continue;
    }

    usedMeanings.add(item.meaning);
    picked.push(item);

    if (picked.length === limit) {
      break;
    }
  }

  return picked;
}

function createQuestion(word, levelPool) {
  const sameDifficultyPool = levelPool.filter((item) => {
    return item.id !== word.id && item.meaning !== word.meaning && item.difficulty === word.difficulty;
  });

  const fallbackPool = levelPool.filter((item) => {
    return item.id !== word.id && item.meaning !== word.meaning;
  });

  const distractors = takeUniqueDistractors(
    shuffle([...sameDifficultyPool, ...fallbackPool]),
    3
  );

  return {
    id: word.id,
    word: word.word,
    meaning: word.meaning,
    partOfSpeech: word.partOfSpeech,
    difficulty: word.difficulty,
    phonetic: word.phonetic,
    senses: word.senses,
    options: shuffle([word.meaning, ...distractors.map((item) => item.meaning)])
  };
}

function buildQuestionSet(levelId) {
  const levelWords = getWordsForLevel(levelId);
  const roundSize = Math.min(GAME_CONFIG.questionsPerRound, levelWords.length);

  return shuffle(levelWords)
    .slice(0, roundSize)
    .map((word) => createQuestion(word, levelWords));
}

function updateHeaderState() {
  elements.openSettingsButton.disabled = state.currentScreen === "game";
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, node]) => {
    node.classList.toggle("is-active", name === screenName);
  });

  state.currentScreen = screenName;
  updateHeaderState();
}

function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前词库：${levelMeta.label}`;
}

function createSenseMarkup(senses) {
  return senses.map((sense) => {
    return `
      <li class="sense-item">
        <span class="sense-badge">${sense.label} ${sense.partOfSpeech}</span>
        <span class="sense-meaning">${sense.meaning}</span>
      </li>
    `;
  }).join("");
}

function createReviewItem(word) {
  const senses = Array.isArray(word.senses) && word.senses.length > 0
    ? word.senses
    : [{ label: "词性", partOfSpeech: word.partOfSpeech, meaning: word.meaning }];

  const item = document.createElement("li");
  item.className = "word-review-item";
  item.innerHTML = `
    <div class="word-review-heading">
      <div class="word-review-title">
        <strong>${word.word}</strong>
        <small class="word-review-phonetic">${word.phonetic || ""}</small>
      </div>
    </div>
    <ul class="sense-list">
      ${createSenseMarkup(senses)}
    </ul>
  `;
  return item;
}

function updateHomeStats() {
  const levelStats = getLevelStats(state.selectedLevel);
  const savedWrongWords = getSavedWrongWords(state.selectedLevel);
  const levelWords = getWordsForLevel(state.selectedLevel);

  updateLevelLabels();
  elements.wordBankSize.textContent = String(levelWords.length);
  elements.bestScore.textContent = String(levelStats.bestScore);
  elements.latestAccuracy.textContent = `${levelStats.latestAccuracy}%`;
  elements.homeReviewList.innerHTML = "";
  elements.toggleReviewButton.disabled = savedWrongWords.length === 0;
  elements.homeReviewEmpty.textContent = "当前级别下还没有错词记录，直接开始第一局吧。";

  if (savedWrongWords.length === 0) {
    elements.homeReviewPanel.classList.add("is-hidden");
    elements.homeReviewEmpty.classList.remove("is-hidden");
    return;
  }

  elements.homeReviewEmpty.classList.add("is-hidden");

  savedWrongWords.forEach((word) => {
    elements.homeReviewList.appendChild(createReviewItem(word));
  });
}

function updateStatusBar() {
  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
  elements.timerValue.textContent = formatTime(state.timeLeft);
  elements.scoreValue.textContent = String(state.score);
  elements.livesValue.textContent = String(state.lives);
  elements.comboValue.textContent = String(state.combo);
}

function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = "答对加分，连续答对还有连击奖励。";
}

function renderQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  elements.posTag.textContent = currentQuestion.partOfSpeech;
  elements.difficultyTag.textContent = getDifficultyLabel(currentQuestion.difficulty);
  elements.questionWord.textContent = currentQuestion.word;
  elements.questionPhonetic.textContent = currentQuestion.phonetic || "";
  elements.optionsGrid.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.option = option;
    button.innerHTML = `<strong>${index + 1}</strong>${option}`;
    button.addEventListener("click", () => handleAnswer(option));
    elements.optionsGrid.appendChild(button);
  });

  clearFeedback();
  updateStatusBar();
}

function setOptionStates(selectedOption, correctOption) {
  const buttons = elements.optionsGrid.querySelectorAll(".option-button");

  buttons.forEach((button) => {
    button.classList.add("is-disabled");
    button.disabled = true;

    if (button.dataset.option === correctOption) {
      button.classList.add("is-correct");
    } else if (button.dataset.option === selectedOption) {
      button.classList.add("is-wrong");
    }
  });
}

function addWrongWord(question) {
  const alreadyIncluded = state.wrongWords.some((word) => word.id === question.id);

  if (!alreadyIncluded) {
    state.wrongWords.push({
      id: question.id,
      word: question.word,
      meaning: question.meaning,
      partOfSpeech: question.partOfSpeech,
      phonetic: question.phonetic,
      senses: question.senses
    });
  }
}

function handleAnswer(selectedOption) {
  if (state.lockInput || state.roundFinished) {
    return;
  }

  state.lockInput = true;
  state.answeredCount += 1;

  const currentQuestion = state.questions[state.currentIndex];
  const isCorrect = selectedOption === currentQuestion.meaning;

  setOptionStates(selectedOption, currentQuestion.meaning);

  if (isCorrect) {
    state.correctCount += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.score += GAME_CONFIG.baseScore + getComboBonus(state.combo);
    elements.feedbackBox.className = "feedback-box is-success";
    elements.feedbackBox.textContent = `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
  } else {
    state.combo = 0;
    state.lives -= 1;
    addWrongWord(currentQuestion);
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
  }

  updateStatusBar();

  window.setTimeout(() => {
    if (state.roundFinished) {
      return;
    }

    if (state.lives <= 0) {
      endGame();
      return;
    }

    if (state.currentIndex >= state.questions.length - 1) {
      endGame();
      return;
    }

    state.currentIndex += 1;
    state.lockInput = false;
    renderQuestion();
  }, GAME_CONFIG.feedbackDelayMs);
}

function getResultSummary(accuracy) {
  if (accuracy >= 85) {
    return "这局很稳，你已经能快速认出不少高频词了。";
  }

  if (accuracy >= 60) {
    return "状态不错，再来两局，这批单词会更熟。";
  }

  return "别怕，这一局已经帮你把重点词过了一遍，马上再刷效果最好。";
}

function renderResult() {
  const accuracy = state.answeredCount === 0
    ? 0
    : Math.round((state.correctCount / state.answeredCount) * 100);

  elements.resultScore.textContent = String(state.score);
  elements.resultCorrect.textContent = `${state.correctCount} / ${state.answeredCount}`;
  elements.resultAccuracy.textContent = `${accuracy}%`;
  elements.resultBestCombo.textContent = String(state.bestCombo);
  elements.resultSummary.textContent = getResultSummary(accuracy);
  elements.wrongCount.textContent = `${state.wrongWords.length} 个`;
  elements.resultReviewList.innerHTML = "";

  if (state.wrongWords.length === 0) {
    elements.resultReviewEmpty.classList.remove("is-hidden");
    return;
  }

  elements.resultReviewEmpty.classList.add("is-hidden");

  state.wrongWords.forEach((word) => {
    elements.resultReviewList.appendChild(createReviewItem(word));
  });
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  stopTimer();

  state.timerId = window.setInterval(() => {
    if (state.roundFinished) {
      stopTimer();
      return;
    }

    state.timeLeft -= 1;
    elements.timerValue.textContent = formatTime(Math.max(state.timeLeft, 0));

    if (state.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function saveRoundSummary() {
  const accuracy = state.answeredCount === 0
    ? 0
    : Math.round((state.correctCount / state.answeredCount) * 100);
  const statsMap = getSavedStatsMap();
  const currentStats = statsMap[state.selectedLevel] || { bestScore: 0, latestAccuracy: 0 };

  statsMap[state.selectedLevel] = {
    bestScore: Math.max(state.score, currentStats.bestScore),
    latestAccuracy: accuracy
  };

  writeJsonStorage(STORAGE_KEYS.statsByLevel, statsMap);

  const wrongWordMap = getSavedWrongWordMap();
  wrongWordMap[state.selectedLevel] = state.wrongWords.map((word) => word.id);
  writeJsonStorage(STORAGE_KEYS.wrongWordsByLevel, wrongWordMap);
}

function endGame() {
  if (state.roundFinished) {
    return;
  }

  state.roundFinished = true;
  stopTimer();
  saveRoundSummary();
  renderResult();
  updateHomeStats();
  showScreen("result");
}

function startGame() {
  const questions = buildQuestionSet(state.selectedLevel);

  if (questions.length === 0) {
    return;
  }

  state.questions = questions;
  state.currentIndex = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.lives = GAME_CONFIG.startingLives;
  state.timeLeft = GAME_CONFIG.totalTimeSeconds;
  state.correctCount = 0;
  state.answeredCount = 0;
  state.wrongWords = [];
  state.lockInput = false;
  state.roundFinished = false;

  renderQuestion();
  showScreen("game");
  startTimer();
}

function toggleHomeReview() {
  if (elements.toggleReviewButton.disabled) {
    return;
  }

  elements.homeReviewPanel.classList.toggle("is-hidden");
}

function openSettingsModal() {
  if (state.currentScreen === "game") {
    return;
  }

  state.pendingLevel = state.selectedLevel;
  renderLevelOptions();
  setBodyScrollLock(true);
  elements.settingsModal.classList.remove("is-hidden");
  elements.settingsModal.setAttribute("aria-hidden", "false");
  elements.closeSettingsButton.focus();
}

function closeSettingsModal() {
  if (elements.settingsModal.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  setBodyScrollLock(false);
  elements.settingsModal.classList.add("is-hidden");
  elements.settingsModal.setAttribute("aria-hidden", "true");

  if (state.currentScreen !== "game") {
    elements.openSettingsButton.focus();
  }
}

function renderLevelOptions() {
  elements.levelOptions.innerHTML = "";

  LEVEL_OPTIONS.forEach((option) => {
    const count = getWordsForLevel(option.id).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `level-option${state.pendingLevel === option.id ? " is-selected" : ""}`;
    button.dataset.level = option.id;
    button.innerHTML = `
      <div>
        <strong class="level-option-title">${option.label}</strong>
        <span class="level-option-copy">${option.description}</span>
      </div>
      <span class="level-option-count">${count} 词</span>
    `;
    button.addEventListener("click", () => {
      state.pendingLevel = option.id;
      renderLevelOptions();
    });
    elements.levelOptions.appendChild(button);
  });
}

function applyLevelSettings() {
  state.selectedLevel = state.pendingLevel;
  persistSelectedLevel();
  updateHomeStats();
  closeSettingsModal();
}

function bindEvents() {
  elements.startButton.addEventListener("click", startGame);
  elements.playAgainButton.addEventListener("click", startGame);
  elements.backHomeButton.addEventListener("click", () => showScreen("home"));
  elements.toggleReviewButton.addEventListener("click", toggleHomeReview);
  elements.openSettingsButton.addEventListener("click", openSettingsModal);
  elements.closeSettingsButton.addEventListener("click", closeSettingsModal);
  elements.cancelSettingsButton.addEventListener("click", closeSettingsModal);
  elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) {
      closeSettingsModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!elements.settingsModal.classList.contains("is-hidden") && event.key === "Escape") {
      closeSettingsModal();
      return;
    }

    if (state.currentScreen !== "game" || state.lockInput || state.roundFinished) {
      return;
    }

    const number = Number(event.key);

    if (number < 1 || number > 4) {
      return;
    }

    const button = elements.optionsGrid.querySelectorAll(".option-button")[number - 1];

    if (button) {
      button.click();
    }
  });
}

function init() {
  state.selectedLevel = getStoredLevel();
  state.pendingLevel = state.selectedLevel;
  updateHomeStats();
  clearFeedback();
  bindEvents();
  showScreen("home");
}

init();
