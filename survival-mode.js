const {
  STORAGE_KEYS,
  DEFAULT_LEVEL,
  PROFILE_CHANGE_EVENT,
  PROFILE_SWITCH_REQUEST_EVENT,
  SURVIVAL_CONFIG,
  shuffle,
  escapeHtml,
  getLevelMeta,
  getWordsForLevel,
  getStoredLevel,
  writeJsonStorage,
  getSavedSurvivalStatsMap,
  getSurvivalStats,
  getSavedSurvivalWrongWordMap,
  getSavedSurvivalWrongWords,
  createMeaningQuestion
} = window.GameShared;

const SURVIVAL_MODE = "meaning";
const survivalType = window.GameTypeRegistry.mustGet(SURVIVAL_MODE);
const survivalStrategy = survivalType.survival;

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

const shell = window.__gameShell;

function createSurvivalStrategyContext() {
  return {
    state,
    elements,
    levelId: state.selectedLevel,
    helpers: {
      getDifficultyLabel,
      clearFeedback,
      updateStatusBar,
      handlePrimaryAction,
      setOptionStates,
      addWrongWord,
      clearFeedbackTimeout,
      moveToNextQuestion,
      endGame,
      createReviewItem,
      getLevelLabel(levelId) {
        return getLevelMeta(levelId).label;
      }
    }
  };
}

function setSettingsDisabled(disabled) {
  if (shell && typeof shell.setSettingsDisabled === "function") {
    shell.setSettingsDisabled(disabled);
    return;
  }

  if (elements.openSettingsButton) {
    elements.openSettingsButton.disabled = disabled;
  }
}

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
  setSettingsDisabled(screenName === "game");
}

function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前玩法：${survivalType.label}生存 · 级别：${levelMeta.label}`;
  elements.pageTip.textContent = `${levelMeta.label} 当前采用不限题量、答错即结束的词义生存规则，每局都会重新混淆题目和选项。`;
}

function updateStatusBar() {
  survivalStrategy.updateStatusBar(createSurvivalStrategyContext());
}

function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = survivalStrategy.getDefaultFeedback(createSurvivalStrategyContext());
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

function resetSurvivalSessionState() {
  stopRoundEffects();
  state.levelWords = [];
  state.questionQueue = [];
  state.recentWordIds = [];
  state.currentQuestion = null;
  state.currentIndex = 0;
  state.answeredCount = 0;
  state.correctCount = 0;
  state.score = 0;
  state.wrongWords = [];
  state.latestOptionMap = {};
  state.latestResult = null;
  state.lockInput = false;
  state.roundFinished = false;
}

function resetSurvivalViewFromProfile() {
  state.selectedLevel = getStoredLevel();
  state.pendingLevel = state.selectedLevel;
  resetSurvivalSessionState();
  elements.homeReviewPanel.classList.add("is-hidden");
  clearFeedback();
  updateHomeStats();
  showScreen("home");
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

  if (state.recentWordIds.length > survivalStrategy.config.recentWordWindowSize) {
    state.recentWordIds = state.recentWordIds.slice(-survivalStrategy.config.recentWordWindowSize);
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
  const question = survivalStrategy.buildQuestion({
    ...createSurvivalStrategyContext(),
    word,
    levelWords: state.levelWords,
    previousOptions
  });

  state.latestOptionMap[word.id] = [...question.options];
  trackRecentWord(word.id);
  return question;
}

function renderQuestion() {
  survivalStrategy.renderQuestion(createSurvivalStrategyContext());
}

function handlePrimaryAction(payload = {}) {
  survivalStrategy.handleAnswer(createSurvivalStrategyContext(), payload);
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
  survivalStrategy.renderResult(createSurvivalStrategyContext());
}

function saveRoundSummary() {
  return survivalStrategy.saveStats(createSurvivalStrategyContext());
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
  handlePrimaryAction({ selectedOption });
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

function handleSharedLevelChange(event) {
  if (state.currentScreen === "game") {
    return;
  }

  const nextLevel = event.detail && typeof event.detail.levelId === "string"
    ? event.detail.levelId
    : getStoredLevel();

  if (nextLevel === state.selectedLevel) {
    return;
  }

  state.selectedLevel = nextLevel;
  state.pendingLevel = nextLevel;
  updateHomeStats();

  if (state.currentScreen === "result") {
    showScreen("home");
  }
}

function getProfileActionWarning(type) {
  if (type === "delete-current-profile") {
    return "删除当前档案将放弃正在进行的生存挑战，并切换到其他档案，确定继续吗？";
  }

  if (type === "reset-current-profile") {
    return "重置当前档案将放弃正在进行的生存挑战，并清空该档案的长期学习数据，确定继续吗？";
  }

  return "切换档案将放弃正在进行的生存挑战，确定继续吗？";
}

function handleProfileSwitchRequest(event) {
  const detail = event.detail;

  if (!detail || typeof detail.execute !== "function") {
    return;
  }

  detail.handled = true;

  if (state.currentScreen !== "game") {
    detail.execute();
    return;
  }

  const confirmed = window.confirm(getProfileActionWarning(detail.type));

  if (!confirmed) {
    return;
  }

  resetSurvivalSessionState();
  detail.execute();
}

function handleProfileChange() {
  resetSurvivalViewFromProfile();
}

function goHome() {
  stopRoundEffects();
  updateHomeStats();
  showScreen("home");
}

function bindEvents() {
  elements.startButton.addEventListener("click", startGame);
  elements.playAgainButton.addEventListener("click", startGame);
  elements.backHomeButton.addEventListener("click", goHome);
  elements.exitGameButton.addEventListener("click", goHome);
  elements.toggleReviewButton.addEventListener("click", toggleHomeReview);

  document.addEventListener("keydown", (event) => {
    if (state.currentScreen !== "game" || state.lockInput || state.roundFinished) {
      return;
    }
    survivalStrategy.handleKeydown(createSurvivalStrategyContext(), event);
  });

  window.addEventListener("english-game:level-change", handleSharedLevelChange);
  window.addEventListener(PROFILE_SWITCH_REQUEST_EVENT, handleProfileSwitchRequest);
  window.addEventListener(PROFILE_CHANGE_EVENT, handleProfileChange);
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
