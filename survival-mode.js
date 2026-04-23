const {
  STORAGE_KEYS,
  DEFAULT_LEVEL,
  SURVIVAL_CONFIG,
  shuffle,
  escapeHtml,
  getLevelMeta,
  getWordsForLevel,
  getStoredLevel,
  persistSelectedLevel,
  writeJsonStorage,
  getSavedSurvivalStatsMap,
  getSurvivalStats,
  getSavedSurvivalWrongWordMap,
  getSavedSurvivalWrongWords,
  createMeaningQuestion,
  renderLevelOptions,
  setBodyScrollLock
} = window.GameShared;

const SURVIVAL_MODE = "meaning";

const state = {
  currentScreen: "home",
  selectedLevel: DEFAULT_LEVEL,
  pendingLevel: DEFAULT_LEVEL,
  levelWords: [],
  questionQueue: [],
  recentWordIds: [],
  currentQuestion: null,
  currentIndex: 0,
  answeredCount: 0,
  correctCount: 0,
  score: 0,
  wrongWords: [],
  latestOptionMap: {},
  latestResult: null,
  feedbackTimeoutId: null,
  lockInput: false,
  roundFinished: false
};

const screens = {
  home: document.getElementById("screen-home"),
  game: document.getElementById("screen-game"),
  result: document.getElementById("screen-result")
};

const elements = {
  openSettingsButton: document.getElementById("open-settings-button"),
  settingsModal: document.getElementById("settings-modal"),
  closeSettingsButton: document.getElementById("close-settings-button"),
  cancelSettingsButton: document.getElementById("cancel-settings-button"),
  saveSettingsButton: document.getElementById("save-settings-button"),
  levelOptions: document.getElementById("level-options"),
  currentLevelChip: document.getElementById("current-level-chip"),
  currentLevelBadge: document.getElementById("current-level-badge"),
  pageTip: document.getElementById("page-tip"),
  startButton: document.getElementById("start-button"),
  playAgainButton: document.getElementById("play-again-button"),
  backHomeButton: document.getElementById("back-home-button"),
  exitGameButton: document.getElementById("exit-game-button"),
  toggleReviewButton: document.getElementById("toggle-review-button"),
  wordBankSize: document.getElementById("word-bank-size"),
  bestStreakValue: document.getElementById("best-streak-value"),
  latestRunValue: document.getElementById("latest-run-value"),
  homeReviewPanel: document.getElementById("home-review-panel"),
  homeReviewList: document.getElementById("home-review-list"),
  homeReviewEmpty: document.getElementById("home-review-empty"),
  gameTitle: document.getElementById("game-title"),
  questionProgress: document.getElementById("question-progress"),
  scoreValue: document.getElementById("score-value"),
  correctValue: document.getElementById("correct-value"),
  bestRecordValue: document.getElementById("best-record-value"),
  accuracyValue: document.getElementById("accuracy-value"),
  posTag: document.getElementById("pos-tag"),
  difficultyTag: document.getElementById("difficulty-tag"),
  questionWord: document.getElementById("question-word"),
  questionPhonetic: document.getElementById("question-phonetic"),
  optionsGrid: document.getElementById("options-grid"),
  feedbackBox: document.getElementById("feedback-box"),
  resultStreak: document.getElementById("result-streak"),
  resultAnswered: document.getElementById("result-answered"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultScore: document.getElementById("result-score"),
  resultBestStreak: document.getElementById("result-best-streak"),
  resultRecordStatus: document.getElementById("result-record-status"),
  resultSummary: document.getElementById("result-summary"),
  resultReviewList: document.getElementById("result-review-list"),
  resultReviewEmpty: document.getElementById("result-review-empty"),
  wrongCount: document.getElementById("wrong-count")
};

function getDifficultyLabel(difficulty) {
  const labels = {
    easy: "基础",
    medium: "进阶",
    hard: "困难"
  };

  return labels[difficulty] || "基础";
}

function getAccuracy() {
  if (state.answeredCount === 0) {
    return 0;
  }

  return Math.round((state.correctCount / state.answeredCount) * 100);
}

function createSenseMarkup(senses) {
  return senses.map((sense) => {
    return `
      <li class="sense-item">
        <span class="sense-badge">${escapeHtml(sense.label)} ${escapeHtml(sense.partOfSpeech)}</span>
        <span class="sense-meaning">${escapeHtml(sense.meaning)}</span>
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
        <strong>${escapeHtml(word.word)}</strong>
        <small class="word-review-phonetic">${escapeHtml(word.phonetic || "")}</small>
      </div>
    </div>
    <ul class="sense-list">
      ${createSenseMarkup(senses)}
    </ul>
  `;
  return item;
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, node]) => {
    node.classList.toggle("is-active", name === screenName);
  });

  state.currentScreen = screenName;
  elements.openSettingsButton.disabled = screenName === "game";
}

function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前玩法：词义生存 · 级别：${levelMeta.label}`;
  elements.pageTip.textContent = `${levelMeta.label} 当前采用不限题量、答错即结束的词义生存规则，每局都会重新混淆题目和选项。`;
}

function updateStatusBar() {
  const bestStats = getSurvivalStats(SURVIVAL_MODE, state.selectedLevel);
  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} 题`;
  elements.scoreValue.textContent = String(state.score);
  elements.correctValue.textContent = String(state.correctCount);
  elements.bestRecordValue.textContent = String(bestStats.bestStreak);
  elements.accuracyValue.textContent = `${getAccuracy()}%`;
}

function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = "当前局只要答错 1 题就会结束，先稳住再冲纪录。";
}

function clearFeedbackTimeout() {
  if (state.feedbackTimeoutId) {
    window.clearTimeout(state.feedbackTimeoutId);
    state.feedbackTimeoutId = null;
  }
}

function stopRoundEffects() {
  clearFeedbackTimeout();
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
  state.wrongWords = [{
    id: question.id,
    word: question.word,
    meaning: question.meaning,
    partOfSpeech: question.partOfSpeech,
    phonetic: question.phonetic,
    senses: question.senses,
    sourceOptions: [...question.options]
  }];
}

function refillQuestionQueue() {
  const recentWordSet = new Set(state.recentWordIds);
  const preferred = shuffle(state.levelWords.filter((word) => !recentWordSet.has(word.id)));
  const fallback = shuffle(state.levelWords.filter((word) => recentWordSet.has(word.id)));
  state.questionQueue.push(...preferred, ...fallback);
}

function trackRecentWord(wordId) {
  state.recentWordIds.push(wordId);

  if (state.recentWordIds.length > SURVIVAL_CONFIG.meaning.recentWordWindowSize) {
    state.recentWordIds = state.recentWordIds.slice(-SURVIVAL_CONFIG.meaning.recentWordWindowSize);
  }
}

function getNextQuestion() {
  if (state.levelWords.length === 0) {
    return null;
  }

  if (state.questionQueue.length === 0) {
    refillQuestionQueue();
  }

  let word = state.questionQueue.shift() || null;

  if (!word) {
    return null;
  }

  if (state.questionQueue.length === 0) {
    refillQuestionQueue();
  }

  const previousOptions = state.latestOptionMap[word.id];
  const question = createMeaningQuestion(word, state.levelWords, {
    distractorPool: state.levelWords,
    excludedOptions: previousOptions
  });

  state.latestOptionMap[word.id] = [...question.options];
  trackRecentWord(word.id);
  return question;
}

function renderQuestion() {
  if (!state.currentQuestion) {
    return;
  }

  elements.gameTitle.textContent = "词义生存中";
  elements.posTag.textContent = state.currentQuestion.partOfSpeech;
  elements.difficultyTag.textContent = getDifficultyLabel(state.currentQuestion.difficulty);
  elements.questionWord.textContent = state.currentQuestion.word;
  elements.questionPhonetic.textContent = state.currentQuestion.phonetic || "";
  elements.optionsGrid.innerHTML = "";

  state.currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.option = option;
    button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
    button.addEventListener("click", () => handleAnswer(option));
    elements.optionsGrid.appendChild(button);
  });

  clearFeedback();
  updateStatusBar();
}

function updateHomeStats() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  const levelWords = getWordsForLevel(state.selectedLevel);
  const levelStats = getSurvivalStats(SURVIVAL_MODE, state.selectedLevel);
  const savedWrongWords = getSavedSurvivalWrongWords(SURVIVAL_MODE, state.selectedLevel);

  updateLevelLabels();
  elements.wordBankSize.textContent = String(levelWords.length);
  elements.bestStreakValue.textContent = `${levelStats.bestStreak}`;
  elements.latestRunValue.textContent = `${levelStats.latestAnsweredCount} 题`;
  elements.startButton.textContent = `${levelMeta.label} 开始挑战`;
  elements.homeReviewList.innerHTML = "";
  elements.toggleReviewButton.disabled = savedWrongWords.length === 0;

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

function renderResult() {
  const result = state.latestResult;

  if (!result) {
    return;
  }

  elements.resultStreak.textContent = String(result.correctCount);
  elements.resultAnswered.textContent = String(result.answeredCount);
  elements.resultAccuracy.textContent = `${result.accuracy}%`;
  elements.resultScore.textContent = String(result.score);
  elements.resultBestStreak.textContent = String(result.bestStreak);
  elements.resultRecordStatus.textContent = result.isNewRecord ? "已刷新" : "未刷新";
  elements.resultSummary.textContent = result.isNewRecord
    ? `新纪录！你在 ${getLevelMeta(state.selectedLevel).label} 级别下已经连续答对 ${result.correctCount} 题。`
    : result.correctCount >= 10
      ? `这局已经顶到 ${result.correctCount} 题，离最佳纪录还差一点，再来一局。`
      : "先把前几题答稳，再慢慢把纪录往上推。";
  elements.resultReviewList.innerHTML = "";
  elements.wrongCount.textContent = `${result.wrongWords.length} 个`;

  if (result.wrongWords.length === 0) {
    elements.resultReviewEmpty.classList.remove("is-hidden");
    return;
  }

  elements.resultReviewEmpty.classList.add("is-hidden");
  result.wrongWords.forEach((word) => {
    elements.resultReviewList.appendChild(createReviewItem(word));
  });
}

function saveRoundSummary() {
  const accuracy = getAccuracy();
  const statsMap = getSavedSurvivalStatsMap();
  const wrongWordMap = getSavedSurvivalWrongWordMap();
  const currentStats = getSurvivalStats(SURVIVAL_MODE, state.selectedLevel);
  const bestStreak = Math.max(state.correctCount, currentStats.bestStreak);
  const bestScore = Math.max(state.score, currentStats.bestScore);

  if (!statsMap[SURVIVAL_MODE]) {
    statsMap[SURVIVAL_MODE] = {};
  }

  if (!wrongWordMap[SURVIVAL_MODE]) {
    wrongWordMap[SURVIVAL_MODE] = {};
  }

  statsMap[SURVIVAL_MODE][state.selectedLevel] = {
    bestStreak,
    bestScore,
    latestAccuracy: accuracy,
    latestAnsweredCount: state.answeredCount
  };
  wrongWordMap[SURVIVAL_MODE][state.selectedLevel] = state.wrongWords.map((word) => word.id);

  writeJsonStorage(STORAGE_KEYS.survivalStatsByModeAndLevel, statsMap);
  writeJsonStorage(STORAGE_KEYS.survivalWrongWordsByModeAndLevel, wrongWordMap);

  return {
    bestStreak,
    isNewRecord: state.correctCount > currentStats.bestStreak
  };
}

function endGame() {
  if (state.roundFinished) {
    return;
  }

  state.roundFinished = true;
  stopRoundEffects();
  const accuracy = getAccuracy();
  const persisted = saveRoundSummary();
  state.latestResult = {
    answeredCount: state.answeredCount,
    correctCount: state.correctCount,
    accuracy,
    score: state.score,
    wrongWords: [...state.wrongWords],
    bestStreak: persisted.bestStreak,
    isNewRecord: persisted.isNewRecord
  };
  renderResult();
  updateHomeStats();
  showScreen("result");
}

function moveToNextQuestion() {
  state.currentIndex += 1;
  state.currentQuestion = getNextQuestion();
  state.lockInput = false;
  renderQuestion();
}

function handleAnswer(selectedOption) {
  if (state.lockInput || state.roundFinished || !state.currentQuestion) {
    return;
  }

  state.lockInput = true;
  state.answeredCount += 1;
  const isCorrect = selectedOption === state.currentQuestion.meaning;

  setOptionStates(selectedOption, state.currentQuestion.meaning);

  if (isCorrect) {
    state.correctCount += 1;
    state.score += SURVIVAL_CONFIG.meaning.baseScore;
    elements.feedbackBox.className = "feedback-box is-success";
    elements.feedbackBox.textContent = `答对了！${state.currentQuestion.word} = ${state.currentQuestion.meaning}`;
    updateStatusBar();
    clearFeedbackTimeout();
    state.feedbackTimeoutId = window.setTimeout(() => {
      moveToNextQuestion();
    }, SURVIVAL_CONFIG.meaning.feedbackDelayMs);
    return;
  }

  addWrongWord(state.currentQuestion);
  elements.feedbackBox.className = "feedback-box is-error";
  elements.feedbackBox.textContent = `答错了，本局结束。正确答案是「${state.currentQuestion.meaning}」`;
  updateStatusBar();
  clearFeedbackTimeout();
  state.feedbackTimeoutId = window.setTimeout(() => {
    endGame();
  }, SURVIVAL_CONFIG.meaning.feedbackDelayMs);
}

function prepareRoundState() {
  state.levelWords = getWordsForLevel(state.selectedLevel);
  state.questionQueue = [];
  state.recentWordIds = [];
  state.currentQuestion = null;
  state.currentIndex = 0;
  state.answeredCount = 0;
  state.correctCount = 0;
  state.score = 0;
  state.wrongWords = [];
  state.lockInput = false;
  state.roundFinished = false;
  refillQuestionQueue();
  state.currentQuestion = getNextQuestion();
}

function startGame() {
  stopRoundEffects();
  prepareRoundState();

  if (!state.currentQuestion) {
    return;
  }

  showScreen("game");
  renderQuestion();
}

function toggleHomeReview() {
  if (elements.toggleReviewButton.disabled) {
    return;
  }

  elements.homeReviewPanel.classList.toggle("is-hidden");
}

function rerenderLevelOptions() {
  renderLevelOptions(elements.levelOptions, state.pendingLevel, (levelId) => {
    state.pendingLevel = levelId;
    rerenderLevelOptions();
  });
}

function openSettingsModal() {
  if (state.currentScreen === "game") {
    return;
  }

  state.pendingLevel = state.selectedLevel;
  rerenderLevelOptions();
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

function applyLevelSettings() {
  state.selectedLevel = state.pendingLevel;
  persistSelectedLevel(state.selectedLevel);
  updateHomeStats();
  closeSettingsModal();

  if (state.currentScreen === "result") {
    showScreen("home");
  }
}

function goHome() {
  stopRoundEffects();
  updateHomeStats();
  showScreen("home");
}

function bindEvents() {
  elements.openSettingsButton.addEventListener("click", openSettingsModal);
  elements.closeSettingsButton.addEventListener("click", closeSettingsModal);
  elements.cancelSettingsButton.addEventListener("click", closeSettingsModal);
  elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
  elements.startButton.addEventListener("click", startGame);
  elements.playAgainButton.addEventListener("click", startGame);
  elements.backHomeButton.addEventListener("click", goHome);
  elements.exitGameButton.addEventListener("click", goHome);
  elements.toggleReviewButton.addEventListener("click", toggleHomeReview);
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
