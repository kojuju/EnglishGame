const {
  STAGE_CONFIG,
  escapeHtml,
  formatTime,
  shuffle,
  getLevelMeta,
  getStoredLevel,
  persistSelectedLevel,
  getWordsForLevel,
  getWordById,
  createMeaningQuestion,
  renderLevelOptions,
  setBodyScrollLock,
  getStageProgress,
  saveStageProgress,
  getStageLevelStats,
  saveStageLevelStats
} = window.GameShared;

const state = {
  currentScreen: "home",
  selectedLevel: getStoredLevel(),
  pendingLevel: getStoredLevel(),
  currentStageNumber: 1,
  questions: [],
  currentIndex: 0,
  score: 0,
  lives: STAGE_CONFIG.meaning.startingLives,
  timeLeft: STAGE_CONFIG.meaning.totalTimeSeconds,
  correctCount: 0,
  answeredCount: 0,
  wrongWords: [],
  timerId: null,
  feedbackTimeoutId: null,
  lockInput: false,
  roundFinished: false,
  latestOptionMap: {},
  latestResult: null
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
  continueStageButton: document.getElementById("continue-stage-button"),
  scrollStageListButton: document.getElementById("scroll-stage-list-button"),
  unlockedStageValue: document.getElementById("unlocked-stage-value"),
  completedStageCount: document.getElementById("completed-stage-count"),
  stageOverviewCopy: document.getElementById("stage-overview-copy"),
  recommendedStageValue: document.getElementById("recommended-stage-value"),
  lastPlayedStageValue: document.getElementById("last-played-stage-value"),
  totalStageCount: document.getElementById("total-stage-count"),
  stageList: document.getElementById("stage-list"),
  stageListSection: document.getElementById("stage-list-section"),
  stageListEmpty: document.getElementById("stage-list-empty"),
  gameTitle: document.getElementById("game-title"),
  questionProgress: document.getElementById("question-progress"),
  exitGameButton: document.getElementById("exit-game-button"),
  timerValue: document.getElementById("timer-value"),
  scoreValue: document.getElementById("score-value"),
  livesValue: document.getElementById("lives-value"),
  accuracyValue: document.getElementById("accuracy-value"),
  posTag: document.getElementById("pos-tag"),
  difficultyTag: document.getElementById("difficulty-tag"),
  questionWord: document.getElementById("question-word"),
  questionPhonetic: document.getElementById("question-phonetic"),
  optionsGrid: document.getElementById("options-grid"),
  feedbackBox: document.getElementById("feedback-box"),
  resultTitle: document.getElementById("result-title"),
  resultPassStatus: document.getElementById("result-pass-status"),
  resultScore: document.getElementById("result-score"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultCorrect: document.getElementById("result-correct"),
  resultFailureReason: document.getElementById("result-failure-reason"),
  resultUnlockStatus: document.getElementById("result-unlock-status"),
  resultBestScore: document.getElementById("result-best-score"),
  resultSummary: document.getElementById("result-summary"),
  nextStageButton: document.getElementById("next-stage-button"),
  retryStageButton: document.getElementById("retry-stage-button"),
  backHomeButton: document.getElementById("back-home-button")
};

function getDifficultyLabel(difficulty) {
  if (difficulty === "easy") {
    return "easy";
  }

  if (difficulty === "medium") {
    return "medium";
  }

  if (difficulty === "hard") {
    return "hard";
  }

  return "normal";
}

function showScreen(screenName) {
  Object.entries(screens).forEach(([name, node]) => {
    node.classList.toggle("is-active", name === screenName);
  });

  state.currentScreen = screenName;
  elements.openSettingsButton.disabled = screenName === "game";
}

function getStageGroups() {
  return STAGE_WORD_BANK.meaning[state.selectedLevel] || [];
}

function getLevelProgress() {
  return getStageProgress("meaning", state.selectedLevel, getStageGroups().length);
}

function getLevelStats() {
  return getStageLevelStats("meaning", state.selectedLevel);
}

function getRecommendedStage(progress) {
  if (progress.unlockedStage > 0) {
    return progress.unlockedStage;
  }

  return getStageGroups().length > 0 ? 1 : 0;
}

function getAccuracy() {
  if (state.answeredCount === 0) {
    return 0;
  }

  return Math.round((state.correctCount / state.answeredCount) * 100);
}

function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前玩法：词义闯关 · 级别：${levelMeta.label}`;
  elements.pageTip.textContent = `${levelMeta.label} 当前按固定 10 词分关，过关后可继续解锁下一关。`;
}

function renderStageList() {
  const stageGroups = getStageGroups();
  const progress = getLevelProgress();
  const levelStats = getLevelStats();

  elements.stageList.innerHTML = "";
  elements.stageListEmpty.classList.toggle("is-hidden", stageGroups.length !== 0);

  stageGroups.forEach((stageWordIds, index) => {
    const stageNumber = index + 1;
    const isCompleted = progress.completedStages.includes(stageNumber);
    const isUnlocked = progress.unlockedStage > 0 && stageNumber <= progress.unlockedStage;
    const stageStat = levelStats[String(stageNumber)] || {};
    const wordPreview = stageWordIds
      .slice(0, 3)
      .map((wordId) => getWordById(wordId))
      .filter(Boolean)
      .map((word) => word.word)
      .join(" / ");
    const card = document.createElement("article");
    const statusLabel = isCompleted
      ? "已通关"
      : isUnlocked
        ? "可挑战"
        : "未解锁";

    card.className = `stage-card${isCompleted ? " is-completed" : ""}${!isUnlocked ? " is-locked" : ""}`;
    card.innerHTML = `
      <div class="stage-card-header">
        <strong>第 ${stageNumber} 关</strong>
        <span class="stage-status">${statusLabel}</span>
      </div>
      <p class="stage-card-copy">固定 10 词 · 预览：${escapeHtml(wordPreview || "待生成")}</p>
      <dl class="stage-card-meta">
        <div>
          <dt>最高分</dt>
          <dd>${stageStat.bestScore || 0}</dd>
        </div>
        <div>
          <dt>最佳正确率</dt>
          <dd>${stageStat.bestAccuracy || 0}%</dd>
        </div>
        <div>
          <dt>挑战次数</dt>
          <dd>${stageStat.attempts || 0}</dd>
        </div>
      </dl>
    `;

    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = isUnlocked ? "primary-button compact-button" : "secondary-button compact-button";
    actionButton.textContent = isCompleted ? "重玩本关" : isUnlocked ? "进入本关" : "尚未解锁";
    actionButton.disabled = !isUnlocked;
    actionButton.addEventListener("click", () => {
      startStage(stageNumber);
    });

    card.appendChild(actionButton);
    elements.stageList.appendChild(card);
  });
}

function renderHome() {
  const progress = getLevelProgress();
  const totalStages = getStageGroups().length;
  const recommendedStage = getRecommendedStage(progress);

  updateLevelLabels();
  elements.unlockedStageValue.textContent = progress.unlockedStage > 0 ? `第 ${progress.unlockedStage} 关` : "未开放";
  elements.completedStageCount.textContent = `${progress.completedStages.length} / ${totalStages}`;
  elements.recommendedStageValue.textContent = recommendedStage > 0 ? `第 ${recommendedStage} 关` : "暂无";
  elements.lastPlayedStageValue.textContent = progress.lastPlayedStage ? `第 ${progress.lastPlayedStage} 关` : "未开始";
  elements.totalStageCount.textContent = String(totalStages);
  elements.stageOverviewCopy.textContent = progress.completedStages.length === 0
    ? "准备从第 1 关开始，通关后会自动解锁下一关。"
    : `你已经通关 ${progress.completedStages.length} 关，当前推荐继续挑战第 ${recommendedStage} 关。`;
  elements.continueStageButton.disabled = recommendedStage === 0;
  elements.continueStageButton.textContent = recommendedStage > 0 ? `挑战第 ${recommendedStage} 关` : "暂无可挑战关卡";
  renderStageList();
}

function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = "75 秒内完成 10 题，至少答对 9 题即可通关。";
}

function updateStatusBar() {
  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
  elements.timerValue.textContent = formatTime(Math.max(state.timeLeft, 0));
  elements.scoreValue.textContent = String(state.score);
  elements.livesValue.textContent = String(state.lives);
  elements.accuracyValue.textContent = `${getAccuracy()}%`;
}

function renderQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  if (!currentQuestion) {
    return;
  }

  elements.gameTitle.textContent = `第 ${state.currentStageNumber} 关`;
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
    button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
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
  if (state.wrongWords.some((word) => word.id === question.id)) {
    return;
  }

  state.wrongWords.push({
    id: question.id,
    word: question.word,
    meaning: question.meaning,
    partOfSpeech: question.partOfSpeech,
    phonetic: question.phonetic,
    senses: question.senses,
    sourceOptions: [...question.options]
  });
}

function clearFeedbackTimeout() {
  if (state.feedbackTimeoutId) {
    window.clearTimeout(state.feedbackTimeoutId);
    state.feedbackTimeoutId = null;
  }
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function stopRoundEffects() {
  stopTimer();
  clearFeedbackTimeout();
}

function getFailureReasonLabel(reason) {
  if (reason === "timeout") {
    return "超时";
  }

  if (reason === "lives") {
    return "生命耗尽";
  }

  if (reason === "accuracy") {
    return "正确率不足";
  }

  return "无";
}

function getResultSummary(result) {
  if (result.passed) {
    return result.unlockedNextStage
      ? "通关成功，下一关已经解锁。"
      : "通关成功，这一关的进度已经记录。";
  }

  if (result.failureReason === "timeout") {
    return "时间先耗尽了，建议优先提速，别在单题上停太久。";
  }

  if (result.failureReason === "lives") {
    return "这一关失误超过上限，重试时题目顺序和干扰项都会刷新。";
  }

  return "已经完成整关，但正确率还没达到 90%，再来一轮会更稳。";
}

function renderResult() {
  const result = state.latestResult;

  if (!result) {
    return;
  }

  elements.resultTitle.textContent = `第 ${result.stageNumber} 关结算`;
  elements.resultPassStatus.textContent = result.passed ? "通关" : "失败";
  elements.resultScore.textContent = String(result.score);
  elements.resultAccuracy.textContent = `${result.accuracy}%`;
  elements.resultCorrect.textContent = `${result.correctCount} / ${result.questionCount}`;
  elements.resultFailureReason.textContent = result.passed ? "无" : getFailureReasonLabel(result.failureReason);
  elements.resultUnlockStatus.textContent = result.passed
    ? result.unlockedNextStage
      ? `已解锁第 ${result.nextStageNumber} 关`
      : "已是当前最高进度"
    : "未解锁";
  elements.resultBestScore.textContent = String(result.bestScore);
  elements.resultSummary.textContent = getResultSummary(result);
  elements.nextStageButton.classList.toggle("is-hidden", !(result.passed && result.hasNextStage));
}

function persistStageResult(result) {
  const totalStages = getStageGroups().length;
  const progress = getStageProgress("meaning", state.selectedLevel, totalStages);
  const levelStats = getStageLevelStats("meaning", state.selectedLevel);
  const stageKey = String(result.stageNumber);
  const previousStageStats = levelStats[stageKey] || {
    bestScore: 0,
    bestAccuracy: 0,
    passed: false,
    attempts: 0
  };

  levelStats[stageKey] = {
    bestScore: Math.max(result.score, previousStageStats.bestScore),
    bestAccuracy: Math.max(result.accuracy, previousStageStats.bestAccuracy),
    passed: previousStageStats.passed || result.passed,
    attempts: previousStageStats.attempts + 1
  };

  if (result.passed && !progress.completedStages.includes(result.stageNumber)) {
    progress.completedStages = [...progress.completedStages, result.stageNumber].sort((left, right) => left - right);
  }

  const previousUnlockedStage = progress.unlockedStage;
  const nextStageNumber = Math.min(totalStages, result.stageNumber + 1);

  if (result.passed) {
    progress.unlockedStage = Math.max(progress.unlockedStage, nextStageNumber);
  }

  progress.lastPlayedStage = result.stageNumber;

  saveStageLevelStats("meaning", state.selectedLevel, levelStats);
  saveStageProgress("meaning", state.selectedLevel, progress);

  return {
    bestScore: levelStats[stageKey].bestScore,
    unlockedNextStage: result.passed && progress.unlockedStage > previousUnlockedStage,
    nextStageNumber,
    hasNextStage: result.stageNumber < totalStages
  };
}

function endStage(reason) {
  if (state.roundFinished) {
    return;
  }

  state.roundFinished = true;
  stopRoundEffects();

  const accuracy = getAccuracy();
  const passed = reason === "completed" && accuracy >= STAGE_CONFIG.meaning.passAccuracy;
  const resolvedReason = passed
    ? null
    : reason === "timeout" || reason === "lives"
      ? reason
      : "accuracy";
  const baseResult = {
    stageNumber: state.currentStageNumber,
    passed,
    score: state.score,
    accuracy,
    correctCount: state.correctCount,
    questionCount: state.questions.length,
    failureReason: resolvedReason
  };
  const persistedResult = persistStageResult(baseResult);

  state.latestResult = {
    ...baseResult,
    bestScore: persistedResult.bestScore,
    unlockedNextStage: persistedResult.unlockedNextStage,
    nextStageNumber: persistedResult.nextStageNumber,
    hasNextStage: persistedResult.hasNextStage
  };

  renderResult();
  renderHome();
  showScreen("result");
}

function moveToNextQuestion() {
  if (state.currentIndex >= state.questions.length - 1) {
    endStage("completed");
    return;
  }

  state.currentIndex += 1;
  state.lockInput = false;
  renderQuestion();
}

function handleAnswer(selectedOption) {
  if (state.lockInput || state.roundFinished) {
    return;
  }

  const currentQuestion = state.questions[state.currentIndex];
  const isCorrect = selectedOption === currentQuestion.meaning;

  state.lockInput = true;
  state.answeredCount += 1;
  setOptionStates(selectedOption, currentQuestion.meaning);

  if (isCorrect) {
    state.correctCount += 1;
    state.score += STAGE_CONFIG.meaning.baseScore;
    elements.feedbackBox.className = "feedback-box is-success";
    elements.feedbackBox.textContent = `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
  } else {
    state.lives -= 1;
    addWrongWord(currentQuestion);
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
  }

  updateStatusBar();
  clearFeedbackTimeout();
  state.feedbackTimeoutId = window.setTimeout(() => {
    if (!isCorrect && state.lives <= 0) {
      endStage("lives");
      return;
    }

    moveToNextQuestion();
  }, STAGE_CONFIG.meaning.feedbackDelayMs);
}

function startTimer() {
  stopTimer();
  state.timerId = window.setInterval(() => {
    if (state.roundFinished) {
      stopTimer();
      return;
    }

    state.timeLeft -= 1;
    updateStatusBar();

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      updateStatusBar();
      endStage("timeout");
    }
  }, 1000);
}

function buildStageQuestionSet(stageNumber, options = {}) {
  const stageWordIds = getStageGroups()[stageNumber - 1] || [];
  const fixedWords = stageWordIds.map((wordId) => getWordById(wordId)).filter(Boolean);
  const levelWords = getWordsForLevel(state.selectedLevel);
  const previousOptionsByWordId = options.previousOptionsByWordId || {};

  return shuffle(fixedWords).map((word) => {
    return createMeaningQuestion(word, levelWords, {
      distractorPool: levelWords,
      excludedOptions: previousOptionsByWordId[word.id]
    });
  });
}

function prepareRoundState(stageNumber, questions) {
  state.currentStageNumber = stageNumber;
  state.questions = questions;
  state.currentIndex = 0;
  state.score = 0;
  state.lives = STAGE_CONFIG.meaning.startingLives;
  state.timeLeft = STAGE_CONFIG.meaning.totalTimeSeconds;
  state.correctCount = 0;
  state.answeredCount = 0;
  state.wrongWords = [];
  state.lockInput = false;
  state.roundFinished = false;
  state.latestOptionMap = Object.fromEntries(questions.map((question) => [question.id, [...question.options]]));
}

function startStage(stageNumber, options = {}) {
  const progress = getLevelProgress();
  const isReplay = progress.completedStages.includes(stageNumber);
  const isUnlocked = progress.unlockedStage > 0 && stageNumber <= progress.unlockedStage;

  if (!isUnlocked && !isReplay) {
    return;
  }

  progress.lastPlayedStage = stageNumber;
  saveStageProgress("meaning", state.selectedLevel, progress);

  stopRoundEffects();

  const questions = buildStageQuestionSet(stageNumber, {
    previousOptionsByWordId: options.previousOptionsByWordId
  });

  if (questions.length === 0) {
    return;
  }

  prepareRoundState(stageNumber, questions);
  showScreen("game");
  renderQuestion();
  startTimer();
}

function retryCurrentStage() {
  if (!state.latestResult) {
    return;
  }

  startStage(state.latestResult.stageNumber, {
    previousOptionsByWordId: state.latestOptionMap
  });
}

function goToNextStage() {
  if (!state.latestResult || !state.latestResult.passed || !state.latestResult.hasNextStage) {
    return;
  }

  startStage(state.latestResult.nextStageNumber);
}

function scrollToStageList() {
  elements.stageListSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goHome() {
  stopRoundEffects();
  renderHome();
  showScreen("home");
}

function rerenderLevelOptions() {
  renderLevelOptions(elements.levelOptions, state.pendingLevel, (levelId) => {
    state.pendingLevel = levelId;
    rerenderLevelOptions();
  });
}

function openSettings() {
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
  renderHome();
  closeSettingsModal();

  if (state.currentScreen === "result") {
    showScreen("home");
  }
}

function bindEvents() {
  elements.openSettingsButton.addEventListener("click", openSettings);
  elements.closeSettingsButton.addEventListener("click", closeSettingsModal);
  elements.cancelSettingsButton.addEventListener("click", closeSettingsModal);
  elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
  elements.continueStageButton.addEventListener("click", () => {
    const progress = getLevelProgress();
    const recommendedStage = getRecommendedStage(progress);
    if (recommendedStage > 0) {
      startStage(recommendedStage);
    }
  });
  elements.scrollStageListButton.addEventListener("click", scrollToStageList);
  elements.exitGameButton.addEventListener("click", goHome);
  elements.nextStageButton.addEventListener("click", goToNextStage);
  elements.retryStageButton.addEventListener("click", retryCurrentStage);
  elements.backHomeButton.addEventListener("click", goHome);
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
  renderHome();
  clearFeedback();
  bindEvents();
  showScreen("home");
}

init();
