const {
  STORAGE_KEYS,
  DEFAULT_LEVEL,
  DEFAULT_MODE,
  PROFILE_CHANGE_EVENT,
  PROFILE_SWITCH_REQUEST_EVENT,
  shuffle,
  escapeHtml,
  formatTime,
  getLevelMeta,
  getWordsForLevel,
  getStoredLevel: getSharedStoredLevel,
  getStoredMode: getSharedStoredMode,
  persistSelectedLevel: persistSharedSelectedLevel,
  persistSelectedMode: persistSharedSelectedMode,
  writeJsonStorage,
  getSavedStatsMap,
  getModeStats,
  getSavedWrongWordMap,
  getSavedWrongWords,
  createMeaningQuestion
} = window.GameShared;

const GAME_CONFIG = {
  meaning: {
    questionsPerRound: 10,
    totalTimeSeconds: 75,
    startingLives: 3,
    baseScore: 100,
    feedbackDelayMs: 850
  },
  dictation: {
    wordsPerRound: 20,
    playbackRepeats: 3,
    playbackGapMs: 5000,
    submitWindowSeconds: 30,
    speechLang: "en-GB",
    speechRate: 0.82,
    feedbackDelayMs: 5000
  }
};

const gameTypeRegistry = window.GameTypeRegistry;
const MODE_OPTIONS = gameTypeRegistry.getSupportedTypes("practice").map((gameType) => ({
  id: gameType.id,
  label: gameType.label
}));

const state = {
  currentScreen: "home",
  selectedLevel: DEFAULT_LEVEL,
  pendingLevel: DEFAULT_LEVEL,
  selectedMode: DEFAULT_MODE,
  roundKind: "normal",
  questions: [],
  currentIndex: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  lives: GAME_CONFIG.meaning.startingLives,
  timeLeft: GAME_CONFIG.meaning.totalTimeSeconds,
  correctCount: 0,
  answeredCount: 0,
  wrongWords: [],
  timerId: null,
  feedbackTimeoutId: null,
  lockInput: false,
  roundFinished: false,
  dictationPlaybackCount: 0,
  dictationPlaybackStatus: "idle",
  dictationReadyForSubmit: false,
  dictationSubmitSecondsLeft: GAME_CONFIG.dictation.submitWindowSeconds,
  dictationSubmitTimerId: null,
  dictationDelayId: null,
  speechRunId: 0
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
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  homeTitle: document.getElementById("home-title"),
  homeCopy: document.getElementById("home-copy"),
  homeModeNote: document.getElementById("home-mode-note"),
  homeReviewPanel: document.getElementById("home-review-panel"),
  homeReviewList: document.getElementById("home-review-list"),
  homeReviewEmpty: document.getElementById("home-review-empty"),
  bestScoreLabel: document.getElementById("best-score-label"),
  bestScore: document.getElementById("best-score"),
  latestAccuracyLabel: document.getElementById("latest-accuracy-label"),
  latestAccuracy: document.getElementById("latest-accuracy"),
  wordBankSize: document.getElementById("word-bank-size"),
  tipTitle1: document.getElementById("tip-title-1"),
  tipCopy1: document.getElementById("tip-copy-1"),
  tipTitle2: document.getElementById("tip-title-2"),
  tipCopy2: document.getElementById("tip-copy-2"),
  tipTitle3: document.getElementById("tip-title-3"),
  tipCopy3: document.getElementById("tip-copy-3"),
  gameTitle: document.getElementById("game-title"),
  questionProgress: document.getElementById("question-progress"),
  exitGameButton: document.getElementById("exit-game-button"),
  statusLabel1: document.getElementById("status-label-1"),
  timerValue: document.getElementById("timer-value"),
  statusLabel2: document.getElementById("status-label-2"),
  scoreValue: document.getElementById("score-value"),
  statusLabel3: document.getElementById("status-label-3"),
  livesValue: document.getElementById("lives-value"),
  statusLabel4: document.getElementById("status-label-4"),
  comboValue: document.getElementById("combo-value"),
  questionPanel: document.getElementById("question-panel"),
  promptLabel: document.getElementById("prompt-label"),
  posTag: document.getElementById("pos-tag"),
  difficultyTag: document.getElementById("difficulty-tag"),
  questionWord: document.getElementById("question-word"),
  questionPhonetic: document.getElementById("question-phonetic"),
  questionHint: document.getElementById("question-hint"),
  optionsGrid: document.getElementById("options-grid"),
  dictationPanel: document.getElementById("dictation-panel"),
  dictationInput: document.getElementById("dictation-input"),
  submitDictationButton: document.getElementById("submit-dictation-button"),
  dictationStatus: document.getElementById("dictation-status"),
  dictationSupportNote: document.getElementById("dictation-support-note"),
  feedbackBox: document.getElementById("feedback-box"),
  resultTitle: document.getElementById("result-title"),
  resultLabel1: document.getElementById("result-label-1"),
  resultScore: document.getElementById("result-score"),
  resultLabel2: document.getElementById("result-label-2"),
  resultCorrect: document.getElementById("result-correct"),
  resultLabel3: document.getElementById("result-label-3"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultLabel4: document.getElementById("result-label-4"),
  resultBestCombo: document.getElementById("result-best-combo"),
  resultSummary: document.getElementById("result-summary"),
  resultReviewList: document.getElementById("result-review-list"),
  resultReviewEmpty: document.getElementById("result-review-empty"),
  wrongCount: document.getElementById("wrong-count"),
  rematchButton: document.getElementById("rematch-button")
};

const shell = window.__gameShell;

function getSelectedModeType(mode = state.selectedMode) {
  return gameTypeRegistry.mustGet(mode);
}

function getSelectedModeStrategy(mode = state.selectedMode) {
  const gameType = getSelectedModeType(mode);

  if (!gameType.practice) {
    throw new Error(`Practice strategy is not registered for mode: ${mode}`);
  }

  return gameType.practice;
}

function createPracticeStrategyContext(mode = state.selectedMode) {
  return {
    state,
    elements,
    levelId: state.selectedLevel,
    mode,
    type: getSelectedModeType(mode),
    config: GAME_CONFIG[mode],
    helpers: {
      getDifficultyLabel,
      getComboBonus,
      getDictationWarning,
      getDictationUnavailableReason,
      isDictationAvailable,
      clearFeedback,
      clearFeedbackTimeout,
      addWrongWord,
      createReviewItem,
      setOptionStates,
      updateStatusBar,
      renderQuestion,
      moveToNextQuestion,
      handlePrimaryAction,
      endGame,
      startTimer,
      stopTimer,
      startDictationPlayback,
      stopDictationPlayback,
      startDictationSubmitCountdown,
      stopDictationSubmitTimer,
      getDictationFeedbackDelayMs() {
        return GAME_CONFIG.dictation.feedbackDelayMs;
      },
      focusDictationInput() {
        window.setTimeout(() => {
          if (state.currentScreen === "game" && state.selectedMode === "dictation") {
            elements.dictationInput.focus();
          }
        }, 0);
      },
      updateDictationChrome(isDictationMode) {
        elements.questionPanel.classList.toggle("is-dictation", isDictationMode);
        elements.dictationPanel.classList.toggle("is-hidden", !isDictationMode);
        elements.optionsGrid.classList.toggle("is-hidden", isDictationMode);
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

/**
 * 根据当前连击数计算额外得分奖励。
 */
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

/**
 * 把难度标记转换为练习模式界面展示文案。
 */
function getDifficultyLabel(difficulty) {
  const labels = {
    easy: "基础",
    medium: "进阶",
    hard: "困难"
  };

  return labels[difficulty] || "基础";
}

/**
 * 获取当前玩法对应的文案配置。
 */
function getModeMeta(mode) {
  return getSelectedModeStrategy(mode).getHomeMeta(createPracticeStrategyContext(mode));
}

/**
 * 读取已保存的练习级别设置。
 */
function getStoredLevel() {
  return getSharedStoredLevel();
}

/**
 * 读取已保存的练习玩法设置。
 */
function getStoredMode() {
  return getSharedStoredMode(MODE_OPTIONS);
}

/**
 * 持久化当前选中的练习级别。
 */
function persistSelectedLevel() {
  persistSharedSelectedLevel(state.selectedLevel);
}

/**
 * 持久化当前选中的练习玩法。
 */
function persistSelectedMode() {
  persistSharedSelectedMode(state.selectedMode);
}

/**
 * 检测浏览器是否支持听写所需的语音播放能力。
 */
function isSpeechSupported() {
  return typeof window.SpeechSynthesisUtterance !== "undefined" && "speechSynthesis" in window;
}

/**
 * 获取听写模式的环境警告提示。
 */
function getDictationWarning() {
  if (window.location.protocol === "file:") {
    return "当前是用 file:// 直接打开页面，听写模式可能受浏览器限制；建议改用 http://localhost 方式访问。";
  }

  return "";
}

/**
 * 获取听写模式不可用时的原因说明。
 */
function getDictationUnavailableReason() {
  if (!isSpeechSupported()) {
    return "当前浏览器不支持语音播放，听写模式暂不可用，请改用支持 SpeechSynthesis 的浏览器。";
  }

  return "";
}

/**
 * 判断当前环境是否可以使用听写模式。
 */
function isDictationAvailable() {
  return getDictationUnavailableReason() === "";
}

/**
 * 选择最合适的英文语音用于听写播放。
 */
function resolveSpeechVoice() {
  if (!isSpeechSupported()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  return voices.find((voice) => /en[-_]gb/i.test(voice.lang) || /en[-\s]?gb/i.test(voice.name))
    || voices.find((voice) => /^en/i.test(voice.lang))
    || null;
}

/**
 * 构建一局词义选择题目。
 */
function buildMeaningQuestionSet(levelId) {
  const levelWords = getWordsForLevel(levelId);
  const roundSize = Math.min(GAME_CONFIG.meaning.questionsPerRound, levelWords.length);

  return shuffle(levelWords)
    .slice(0, roundSize)
    .map((word) => createMeaningQuestion(word, levelWords));
}

/**
 * 基于错题构建词义再战题目，并尽量避免复用原选项。
 */
function buildMeaningRematchQuestionSet(words, levelId) {
  const levelWords = getWordsForLevel(levelId);

  return shuffle(words).map((word) => {
    return createMeaningQuestion(word, levelWords, {
      distractorPool: levelWords,
      excludedOptions: word.sourceOptions
    });
  });
}

/**
 * 构建一局听写题目数据。
 */
function buildDictationRound(levelId) {
  const levelWords = getWordsForLevel(levelId);
  const roundSize = Math.min(GAME_CONFIG.dictation.wordsPerRound, levelWords.length);

  return shuffle(levelWords)
    .slice(0, roundSize)
    .map((word) => ({
      id: word.id,
      word: word.word,
      meaning: word.meaning,
      partOfSpeech: word.partOfSpeech,
      difficulty: word.difficulty,
      phonetic: word.phonetic,
      senses: word.senses
    }));
}

/**
 * 基于错词构建听写再战题目数据。
 */
function buildDictationRematchRound(words) {
  return shuffle(words).map((word) => ({
    id: word.id,
    word: word.word,
    meaning: word.meaning,
    partOfSpeech: word.partOfSpeech,
    difficulty: word.difficulty,
    phonetic: word.phonetic,
    senses: word.senses
  }));
}

/**
 * 同步页面头部按钮的可用状态。
 */
function updateHeaderState() {
  setSettingsDisabled(state.currentScreen === "game");
}

/**
 * 切换当前显示的页面屏幕。
 */
function showScreen(screenName) {
  Object.entries(screens).forEach(([name, node]) => {
    node.classList.toggle("is-active", name === screenName);
  });

  state.currentScreen = screenName;
  updateHeaderState();
}

/**
 * 刷新首页玩法切换按钮的选中状态。
 */
function renderModeButtons() {
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.selectedMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

/**
 * 刷新当前级别和玩法的展示标签。
 */
function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  const modeLabel = getSelectedModeType().label;
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前玩法：${modeLabel} · 级别：${levelMeta.label}`;
}

/**
 * 根据当前玩法更新首页提示卡片。
 */
function updateTips(meta) {
  const [tip1, tip2, tip3] = meta.tips;
  elements.tipTitle1.textContent = tip1.title;
  elements.tipCopy1.textContent = tip1.copy;
  elements.tipTitle2.textContent = tip2.title;
  elements.tipCopy2.textContent = tip2.copy;
  elements.tipTitle3.textContent = tip3.title;
  elements.tipCopy3.textContent = tip3.copy;
}

/**
 * 刷新首页与当前玩法相关的标题、按钮和提示文案。
 */
function updateHomeModeContent() {
  const strategy = getSelectedModeStrategy();
  const context = createPracticeStrategyContext();
  const meta = strategy.getHomeMeta(context);
  const supportState = strategy.getHomeSupportState(context);

  renderModeButtons();
  updateLevelLabels();
  updateTips(meta);

  elements.homeTitle.textContent = meta.homeTitle;
  elements.homeCopy.textContent = meta.homeCopy;
  elements.startButton.textContent = meta.startLabel;
  elements.bestScoreLabel.textContent = meta.primaryStatLabel;
  elements.latestAccuracyLabel.textContent = "最近正确率";

  if (supportState.noteText) {
    elements.homeModeNote.textContent = supportState.noteText;
    elements.homeModeNote.classList.remove("is-hidden");
    elements.startButton.disabled = supportState.disableStartButton;
  } else {
    elements.homeModeNote.textContent = "";
    elements.homeModeNote.classList.add("is-hidden");
    elements.startButton.disabled = false;
  }
}

/**
 * 生成词义列表的 HTML 片段。
 */
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

/**
 * 生成错词回顾列表项节点。
 */
function createReviewItem(word) {
  const senses = Array.isArray(word.senses) && word.senses.length > 0
    ? word.senses
    : [{ label: "词性", partOfSpeech: word.partOfSpeech, meaning: word.meaning }];
  const attemptMarkup = word.userAnswer
    ? `<p class="word-review-note">你的输入：${escapeHtml(word.userAnswer)}</p>`
    : "";

  const item = document.createElement("li");
  item.className = "word-review-item";
  item.innerHTML = `
    <div class="word-review-heading">
      <div class="word-review-title">
        <strong>${escapeHtml(word.word)}</strong>
        <small class="word-review-phonetic">${escapeHtml(word.phonetic || "")}</small>
      </div>
    </div>
    ${attemptMarkup}
    <ul class="sense-list">
      ${createSenseMarkup(senses)}
    </ul>
  `;
  return item;
}

/**
 * 刷新首页统计信息和错词回顾区域。
 */
function updateHomeStats() {
  const strategy = getSelectedModeStrategy();
  const levelStats = getModeStats(state.selectedMode, state.selectedLevel);
  const savedWrongWords = getSavedWrongWords(state.selectedMode, state.selectedLevel);
  const levelWords = getWordsForLevel(state.selectedLevel);

  updateHomeModeContent();
  elements.wordBankSize.textContent = String(levelWords.length);
  elements.bestScore.textContent = strategy.formatHomePrimaryStat({
    ...createPracticeStrategyContext(),
    stats: levelStats
  });
  elements.latestAccuracy.textContent = `${levelStats.latestAccuracy}%`;
  elements.homeReviewList.innerHTML = "";
  elements.toggleReviewButton.disabled = savedWrongWords.length === 0;
  elements.homeReviewEmpty.textContent = getModeMeta(state.selectedMode).reviewEmpty;

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

/**
 * 获取听写状态栏中的播放标签。
 */
function getDictationPlaybackTag() {
  if (state.dictationPlaybackStatus === "ready") {
    return "可提交";
  }

  if (state.dictationPlaybackStatus === "error") {
    return "播放失败";
  }

  return `播放 ${state.dictationPlaybackCount} / ${GAME_CONFIG.dictation.playbackRepeats}`;
}

/**
 * 获取听写输入区下方的状态提示文案。
 */
function getDictationPlaybackStatusText() {
  const dictationUnavailableReason = getDictationUnavailableReason();

  if (dictationUnavailableReason) {
    return dictationUnavailableReason;
  }

  if (state.dictationPlaybackStatus === "speaking") {
    return `第 ${state.dictationPlaybackCount} / ${GAME_CONFIG.dictation.playbackRepeats} 遍播放中，请边听边输入。`;
  }

  if (state.dictationPlaybackStatus === "waiting") {
    return `已播放 ${state.dictationPlaybackCount} / ${GAME_CONFIG.dictation.playbackRepeats} 遍，5 秒后自动播放下一遍。`;
  }

  if (state.dictationPlaybackStatus === "ready") {
    return `三遍播放已结束，请在 ${state.dictationSubmitSecondsLeft} 秒内提交答案。`;
  }

  if (state.dictationPlaybackStatus === "error") {
    return `语音播放失败，请在 ${state.dictationSubmitSecondsLeft} 秒内决定是否提交。`;
  }

  return "准备播放，请稍候。";
}

/**
 * 根据听写状态更新输入框、提交按钮和提示信息。
 */
function updateDictationControls() {
  const shouldDisableInput = state.lockInput || state.roundFinished || !isDictationAvailable();
  const shouldDisableSubmit = shouldDisableInput || !state.dictationReadyForSubmit;

  elements.difficultyTag.textContent = getDictationPlaybackTag();
  elements.dictationStatus.textContent = getDictationPlaybackStatusText();
  elements.dictationInput.disabled = shouldDisableInput;
  elements.submitDictationButton.disabled = shouldDisableSubmit;
  const dictationMessage = getDictationUnavailableReason() || getDictationWarning();
  elements.dictationSupportNote.textContent = dictationMessage;
  elements.dictationSupportNote.classList.toggle("is-hidden", !dictationMessage);
}

/**
 * 刷新游戏内状态栏显示。
 */
function updateStatusBar() {
  getSelectedModeStrategy().updateStatusBar(createPracticeStrategyContext());
}

/**
 * 重置反馈提示为当前玩法的默认文案。
 */
function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = getSelectedModeStrategy().getDefaultFeedback(createPracticeStrategyContext());
}

/**
 * 渲染当前词义选择题。
 */
function renderMeaningQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  elements.gameTitle.textContent = state.roundKind === "rematch" ? "错题再战" : getModeMeta("meaning").gameTitle;
  elements.promptLabel.textContent = getModeMeta("meaning").promptLabel;
  elements.posTag.textContent = currentQuestion.partOfSpeech;
  elements.difficultyTag.textContent = getDifficultyLabel(currentQuestion.difficulty);
  elements.questionWord.textContent = currentQuestion.word;
  elements.questionPhonetic.textContent = currentQuestion.phonetic || "";
  elements.questionPhonetic.classList.remove("is-hidden");
  elements.questionHint.textContent = getModeMeta("meaning").hint;
  elements.questionPanel.classList.remove("is-dictation");
  elements.dictationPanel.classList.add("is-hidden");
  elements.optionsGrid.classList.remove("is-hidden");
  elements.optionsGrid.innerHTML = "";

  currentQuestion.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.dataset.option = option;
    button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
    button.addEventListener("click", () => handleMeaningAnswer(option));
    elements.optionsGrid.appendChild(button);
  });

  clearFeedback();
  updateStatusBar();
}

/**
 * 渲染当前听写题并启动播放流程。
 */
function renderDictationQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  elements.gameTitle.textContent = state.roundKind === "rematch" ? "错题听写再战" : getModeMeta("dictation").gameTitle;
  elements.promptLabel.textContent = getModeMeta("dictation").promptLabel;
  elements.posTag.textContent = "听写模式";
  elements.questionWord.textContent = "请写出你听到的单词";
  elements.questionPhonetic.textContent = "";
  elements.questionPhonetic.classList.add("is-hidden");
  elements.questionHint.textContent = getModeMeta("dictation").hint;
  elements.questionPanel.classList.add("is-dictation");
  elements.optionsGrid.classList.add("is-hidden");
  elements.optionsGrid.innerHTML = "";
  elements.dictationPanel.classList.remove("is-hidden");
  elements.dictationInput.value = "";
  elements.dictationInput.setAttribute("aria-label", `听写输入：第 ${state.currentIndex + 1} 个单词`);
  state.dictationPlaybackCount = 0;
  state.dictationPlaybackStatus = "idle";
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;

  clearFeedback();
  updateStatusBar();

  if (currentQuestion) {
    startDictationPlayback(currentQuestion.word);
    window.setTimeout(() => {
      if (state.currentScreen === "game" && state.selectedMode === "dictation") {
        elements.dictationInput.focus();
      }
    }, 0);
  }
}

/**
 * 根据当前玩法分发到对应的题目渲染逻辑。
 */
function renderQuestion() {
  getSelectedModeStrategy().renderQuestion(createPracticeStrategyContext());
}

/**
 * 把当前作答动作分发给所选题型策略。
 */
function handlePrimaryAction(payload = {}) {
  getSelectedModeStrategy().handleAnswer(createPracticeStrategyContext(), payload);
}

/**
 * 让当前题型策略决定如何推进到下一题。
 */
function moveToNextQuestion() {
  getSelectedModeStrategy().moveToNextQuestion(createPracticeStrategyContext());
}

/**
 * 标记词义选项的正确、错误和禁用状态。
 */
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

/**
 * 记录错题或更新已有错题的附加信息。
 */
function addWrongWord(question, details = {}) {
  const existingWord = state.wrongWords.find((word) => word.id === question.id);
  const payload = {
    id: question.id,
    word: question.word,
    meaning: question.meaning,
    partOfSpeech: question.partOfSpeech,
    phonetic: question.phonetic,
    senses: question.senses,
    ...details
  };

  if (existingWord) {
    Object.assign(existingWord, payload);
    return;
  }

  state.wrongWords.push(payload);
}

/**
 * 清理题目反馈后的延时跳转。
 */
function clearFeedbackTimeout() {
  if (state.feedbackTimeoutId) {
    window.clearTimeout(state.feedbackTimeoutId);
    state.feedbackTimeoutId = null;
  }
}

/**
 * 停止词义模式倒计时。
 */
function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

/**
 * 停止听写提交倒计时。
 */
function stopDictationSubmitTimer() {
  if (state.dictationSubmitTimerId) {
    window.clearInterval(state.dictationSubmitTimerId);
    state.dictationSubmitTimerId = null;
  }
}

/**
 * 停止当前听写播放及等待中的下一次播放。
 */
function stopDictationPlayback() {
  state.speechRunId += 1;
  state.dictationReadyForSubmit = false;

  if (state.dictationDelayId) {
    window.clearTimeout(state.dictationDelayId);
    state.dictationDelayId = null;
  }

  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

/**
 * 停止当前对局中的所有计时和播放副作用。
 */
function stopActiveRoundEffects() {
  clearFeedbackTimeout();
  getSelectedModeStrategy().stopEffects(createPracticeStrategyContext());
}

function resetTransientRoundState() {
  stopActiveRoundEffects();
  state.questions = [];
  state.roundKind = "normal";
  state.currentIndex = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.lives = GAME_CONFIG.meaning.startingLives;
  state.timeLeft = GAME_CONFIG.meaning.totalTimeSeconds;
  state.correctCount = 0;
  state.answeredCount = 0;
  state.wrongWords = [];
  state.lockInput = false;
  state.roundFinished = false;
  state.dictationPlaybackCount = 0;
  state.dictationPlaybackStatus = "idle";
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;
  elements.dictationInput.value = "";
}

function resetPracticeViewFromProfile() {
  state.selectedLevel = getStoredLevel();
  state.pendingLevel = state.selectedLevel;
  state.selectedMode = getStoredMode();
  resetTransientRoundState();
  elements.homeReviewPanel.classList.add("is-hidden");
  clearFeedback();
  updateHomeStats();
  showScreen("home");
}

/**
 * 启动听写提交倒计时，并在超时后自动提交。
 */
function startDictationSubmitCountdown() {
  stopDictationSubmitTimer();
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;
  updateStatusBar();

  state.dictationSubmitTimerId = window.setInterval(() => {
    if (state.roundFinished || state.selectedMode !== "dictation") {
      stopDictationSubmitTimer();
      return;
    }

    state.dictationSubmitSecondsLeft -= 1;

    if (state.dictationSubmitSecondsLeft <= 0) {
      state.dictationSubmitSecondsLeft = 0;
      stopDictationSubmitTimer();
      updateStatusBar();
      handlePrimaryAction({ auto: true });
      return;
    }

    updateStatusBar();
  }, 1000);
}

/**
 * 推进到下一道词义题，必要时结束本局。
 */
function moveToNextMeaningQuestion() {
  if (state.roundFinished) {
    return;
  }

  if (state.lives <= 0 || state.currentIndex >= state.questions.length - 1) {
    endGame();
    return;
  }

  state.currentIndex += 1;
  state.lockInput = false;
  renderQuestion();
}

/**
 * 推进到下一道听写题，必要时结束本局。
 */
function moveToNextDictationQuestion() {
  if (state.roundFinished) {
    return;
  }

  if (state.currentIndex >= state.questions.length - 1) {
    endGame();
    return;
  }

  state.currentIndex += 1;
  state.lockInput = false;
  renderQuestion();
}

/**
 * 处理词义选择题的作答结果和反馈。
 */
function handleMeaningAnswer(selectedOption) {
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
    state.score += GAME_CONFIG.meaning.baseScore + getComboBonus(state.combo);
    elements.feedbackBox.className = "feedback-box is-success";
    elements.feedbackBox.textContent = `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
  } else {
    state.combo = 0;
    state.lives -= 1;
    addWrongWord(currentQuestion, { sourceOptions: currentQuestion.options });
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
  }

  updateStatusBar();
  clearFeedbackTimeout();

  state.feedbackTimeoutId = window.setTimeout(() => {
    moveToNextMeaningQuestion();
  }, GAME_CONFIG.meaning.feedbackDelayMs);
}

/**
 * 统一标准化听写答案，便于忽略大小写比较。
 */
function normalizeWordAnswer(value) {
  return value.trim().toLowerCase();
}

/**
 * 处理听写提交、判题和反馈。
 */
function handleDictationSubmit({ auto = false } = {}) {
  if (state.selectedMode !== "dictation" || state.lockInput || state.roundFinished || !state.dictationReadyForSubmit) {
    return;
  }

  const currentQuestion = state.questions[state.currentIndex];
  const userAnswer = elements.dictationInput.value;
  const trimmedAnswer = userAnswer.trim();
  const isCorrect = normalizeWordAnswer(userAnswer) === normalizeWordAnswer(currentQuestion.word);

  stopDictationSubmitTimer();
  state.lockInput = true;
  state.answeredCount += 1;
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = 0;

  if (isCorrect) {
    state.correctCount += 1;
    elements.feedbackBox.className = "feedback-box is-success";
    elements.feedbackBox.textContent = auto
      ? `30 秒已到，系统已自动提交。你的答案正确：${currentQuestion.word} = ${currentQuestion.meaning}`
      : `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
  } else {
    addWrongWord(currentQuestion, { userAnswer: trimmedAnswer || "（未填写）" });
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = auto
      ? `30 秒已到，系统已自动提交。正确答案是 ${currentQuestion.word}（${currentQuestion.meaning}）`
      : `拼写不对。正确答案是 ${currentQuestion.word}（${currentQuestion.meaning}）`;
  }

  elements.dictationInput.disabled = true;
  elements.submitDictationButton.disabled = true;
  updateStatusBar();
  clearFeedbackTimeout();

  state.feedbackTimeoutId = window.setTimeout(() => {
    moveToNextDictationQuestion();
  }, GAME_CONFIG.dictation.feedbackDelayMs);
}

/**
 * 根据词义模式正确率生成结算总结。
 */
function getMeaningResultSummary(accuracy) {
  if (accuracy >= 85) {
    return "这局很稳，你已经能快速认出不少高频词了。";
  }

  if (accuracy >= 60) {
    return "状态不错，再来两局，这批单词会更熟。";
  }

  return "别怕，这一局已经帮你把重点词过了一遍，马上再刷效果最好。";
}

/**
 * 根据听写模式正确率生成结算总结。
 */
function getDictationResultSummary(accuracy) {
  if (accuracy >= 90) {
    return "这轮听写很稳，拼写和发音对应关系已经越来越熟了。";
  }

  if (accuracy >= 65) {
    return "这一轮基础不错，把错词再过一遍会更扎实。";
  }

  return "先别急，听写本来就比选择题更难，把这一轮错词复盘一遍最有效。";
}

/**
 * 根据词义错题再战正确率生成结算总结。
 */
function getMeaningRematchSummary(accuracy) {
  if (accuracy === 100) {
    return "这轮错题再战已经全部纠正，刚才的薄弱点补得很及时。";
  }

  if (accuracy >= 60) {
    return "这轮错题再战有进步，还剩下少量词需要再过一遍。";
  }

  return "这轮错题再战说明这些词还不够稳，再练一次会更有效。";
}

/**
 * 根据听写错题再战正确率生成结算总结。
 */
function getDictationRematchSummary(accuracy) {
  if (accuracy === 100) {
    return "这轮错题听写已经全部写对，拼写修正得很到位。";
  }

  if (accuracy >= 60) {
    return "这轮错题听写已经追回来一部分，剩下的再巩固一次会更稳。";
  }

  return "这些错词的拼写还需要继续强化，建议再战一次或回顾后再练。";
}

/**
 * 渲染当前对局的结算内容和错词回顾。
 */
function renderResult() {
  getSelectedModeStrategy().renderResult(createPracticeStrategyContext());
}

/**
 * 启动词义模式整局倒计时。
 */
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

/**
 * 保存本局练习统计和错词记录。
 */
function saveRoundSummary() {
  getSelectedModeStrategy().saveStats(createPracticeStrategyContext());
}

/**
 * 结束当前对局并切到结算页。
 */
function endGame() {
  if (state.roundFinished) {
    return;
  }

  state.roundFinished = true;
  stopActiveRoundEffects();
  saveRoundSummary();
  renderResult();
  updateHomeStats();
  showScreen("result");
}

/**
 * 重置并初始化新一局练习的状态数据。
 */
function prepareRoundState(items) {
  state.questions = items;
  state.roundKind = "normal";
  state.currentIndex = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.lives = 0;
  state.timeLeft = 0;
  state.correctCount = 0;
  state.answeredCount = 0;
  state.wrongWords = [];
  state.lockInput = false;
  state.roundFinished = false;
  state.dictationPlaybackCount = 0;
  state.dictationPlaybackStatus = "idle";
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;
  getSelectedModeStrategy().prepareRoundState(createPracticeStrategyContext());
}

/**
 * 按当前玩法和级别开始新一局练习。
 */
function startGame() {
  const strategy = getSelectedModeStrategy();
  const context = createPracticeStrategyContext();

  if (!strategy.canStartRound(context)) {
    updateHomeStats();
    return;
  }

  stopActiveRoundEffects();

  const items = strategy.buildRound(context);

  if (items.length === 0) {
    return;
  }

  prepareRoundState(items);
  showScreen("game");
  renderQuestion();
  strategy.startRoundEffects(createPracticeStrategyContext());
}

/**
 * 基于当前错词开始再战练习。
 */
function startWrongAnswerRematch() {
  if (state.wrongWords.length === 0) {
    return;
  }

  const strategy = getSelectedModeStrategy();
  stopActiveRoundEffects();

  const rematchWords = state.wrongWords.map((word) => ({
    ...word,
    sourceOptions: Array.isArray(word.sourceOptions) ? [...word.sourceOptions] : undefined
  }));
  const items = strategy.buildRematchRound({
    ...createPracticeStrategyContext(),
    words: rematchWords
  });

  if (items.length === 0) {
    return;
  }

  prepareRoundState(items);
  state.roundKind = "rematch";
  showScreen("game");
  renderQuestion();
  strategy.startRoundEffects(createPracticeStrategyContext());
}

/**
 * 切换首页错词回顾面板的展开状态。
 */
function toggleHomeReview() {
  if (elements.toggleReviewButton.disabled) {
    return;
  }

  elements.homeReviewPanel.classList.toggle("is-hidden");
}

/**
 * 切换练习玩法并更新首页内容。
 */
function selectMode(mode) {
  if (state.currentScreen === "game" || !MODE_OPTIONS.some((option) => option.id === mode)) {
    return;
  }

  state.selectedMode = mode;
  persistSelectedMode();
  updateHomeStats();
}

/**
 * 播放单词发音，并串联听写多遍播放流程。
 */
function speakWord(word, runId) {
  if (
    state.roundFinished
    || state.selectedMode !== "dictation"
    || state.currentScreen !== "game"
    || runId !== state.speechRunId
  ) {
    return;
  }

  state.dictationPlaybackCount += 1;
  state.dictationPlaybackStatus = "speaking";
  updateStatusBar();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = GAME_CONFIG.dictation.speechLang;
  utterance.rate = GAME_CONFIG.dictation.speechRate;
  utterance.pitch = 1;
  const voice = resolveSpeechVoice();

  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => {
    if (runId !== state.speechRunId || state.roundFinished) {
      return;
    }

    if (state.dictationPlaybackCount >= GAME_CONFIG.dictation.playbackRepeats) {
      state.dictationPlaybackStatus = "ready";
      state.dictationReadyForSubmit = true;
      startDictationSubmitCountdown();
      return;
    }

    state.dictationPlaybackStatus = "waiting";
    updateStatusBar();

    state.dictationDelayId = window.setTimeout(() => {
      speakWord(word, runId);
    }, GAME_CONFIG.dictation.playbackGapMs);
  };

  utterance.onerror = () => {
    if (runId !== state.speechRunId || state.roundFinished) {
      return;
    }

    state.dictationPlaybackStatus = "error";
    state.dictationReadyForSubmit = true;
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = "语音播放失败，请在 30 秒内决定是否提交；超时后会自动判定。";
    startDictationSubmitCountdown();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/**
 * 初始化当前单词的听写播放状态并开始播放。
 */
function startDictationPlayback(word) {
  stopDictationPlayback();
  stopDictationSubmitTimer();
  state.speechRunId += 1;
  state.dictationPlaybackCount = 0;
  state.dictationPlaybackStatus = "idle";
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;
  updateStatusBar();

  if (!isDictationAvailable()) {
    state.dictationPlaybackStatus = "error";
    updateStatusBar();
    return;
  }

  speakWord(word, state.speechRunId);
}

/**
 * 退出当前对局并返回练习首页。
 */
function goHome() {
  stopActiveRoundEffects();
  updateHomeStats();
  showScreen("home");
}

/**
 * 接收共享壳层派发的级别切换事件，并刷新练习首页状态。
 */
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
}

function getProfileActionWarning(type) {
  if (type === "delete-current-profile") {
    return "删除当前档案将放弃当前局，并切换到其他档案，确定继续吗？";
  }

  if (type === "reset-current-profile") {
    return "重置当前档案将放弃当前局，并清空该档案的长期学习数据，确定继续吗？";
  }

  return "切换档案将放弃当前局，确定继续吗？";
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

  resetTransientRoundState();
  detail.execute();
}

function handleProfileChange() {
  resetPracticeViewFromProfile();
}

/**
 * 绑定练习模式页面的交互事件。
 */
function bindEvents() {
  elements.startButton.addEventListener("click", startGame);
  elements.playAgainButton.addEventListener("click", startGame);
  elements.rematchButton.addEventListener("click", startWrongAnswerRematch);
  elements.backHomeButton.addEventListener("click", goHome);
  elements.exitGameButton.addEventListener("click", goHome);
  elements.toggleReviewButton.addEventListener("click", toggleHomeReview);
  elements.submitDictationButton.addEventListener("click", () => handlePrimaryAction());
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectMode(button.dataset.mode);
    });
  });
  elements.dictationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handlePrimaryAction();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (state.currentScreen !== "game" || state.lockInput || state.roundFinished) {
      return;
    }

    getSelectedModeStrategy().handleKeydown(createPracticeStrategyContext(), event);
  });

  if (isSpeechSupported() && typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      if (state.currentScreen !== "game") {
        updateHomeStats();
      }
    });
  }

  window.addEventListener("english-game:level-change", handleSharedLevelChange);
  window.addEventListener(PROFILE_SWITCH_REQUEST_EVENT, handleProfileSwitchRequest);
  window.addEventListener(PROFILE_CHANGE_EVENT, handleProfileChange);
}

/**
 * 初始化练习模式页面状态并完成首次渲染。
 */
function init() {
  state.selectedLevel = getStoredLevel();
  state.pendingLevel = state.selectedLevel;
  state.selectedMode = getStoredMode();
  updateHomeStats();
  clearFeedback();
  bindEvents();
  showScreen("home");
}

init();
