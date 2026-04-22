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
    feedbackDelayMs: 10000
  }
};

const STORAGE_KEYS = {
  selectedLevel: "englishGame.selectedLevel",
  selectedMode: "englishGame.selectedMode",
  statsByModeAndLevel: "englishGame.statsByModeAndLevel",
  wrongWordsByModeAndLevel: "englishGame.wrongWordsByModeAndLevel",
  legacyStatsByLevel: "englishGame.statsByLevel",
  legacyWrongWordsByLevel: "englishGame.wrongWordsByLevel"
};

const DEFAULT_LEVEL = "cet4";
const DEFAULT_MODE = "meaning";

const MODE_OPTIONS = [
  { id: "meaning", label: "词义选择" },
  { id: "dictation", label: "听写" }
];

const MODE_META = {
  meaning: {
    homeTitle: "10 题一局，按你的水平练词义",
    homeCopy: "先在设置里选择英语级别，再开始闯关。系统会按当前级别切换词库，尽量避免超纲。",
    startLabel: "开始闯关",
    primaryStatLabel: "最高分",
    reviewEmpty: "当前级别下还没有错词记录，直接开始第一局吧。",
    tips: [
      { title: "1. 每局 10 题", copy: "整局限时，适合反复重开刷熟练度。" },
      { title: "2. 连击会加分", copy: "连续答对越多，奖励越高，但单次失误不致命。" },
      { title: "3. 错词会回顾", copy: "局后会展示答错的词，帮助你马上复习。" }
    ],
    gameTitle: "正在闯关",
    promptLabel: "请选择这个英文单词最贴切的中文意思：",
    hint: "键盘也可以按 1 / 2 / 3 / 4 作答",
    defaultFeedback: "答对加分，连续答对还有连击奖励。"
  },
  dictation: {
    homeTitle: "20 个词一局，听发音写拼写",
    homeCopy: "系统会从当前级别随机抽取 20 个词，每个词自动播放 3 遍，每两遍之间间隔 5 秒。",
    startLabel: "开始听写",
    primaryStatLabel: "最佳正确数",
    reviewEmpty: "当前级别下还没有听写错词记录，开始第一局试试吧。",
    tips: [
      { title: "1. 每局 20 词", copy: "单局比选择题更长，更适合专心练一轮拼写。" },
      { title: "2. 每词播放 3 遍", copy: "系统会自动连播三遍，间隔固定 5 秒。" },
      { title: "3. 三遍后提交", copy: "你可以边听边输入，第三遍结束后再提交答案。" }
    ],
    gameTitle: "正在听写",
    promptLabel: "请听发音并输入你听到的英文单词：",
    hint: "可以提前输入，第三遍播放结束后按 Enter 或点击按钮提交。",
    defaultFeedback: "系统会自动播放 3 遍，第三遍结束后才能提交。"
  }
};

const state = {
  currentScreen: "home",
  selectedLevel: DEFAULT_LEVEL,
  pendingLevel: DEFAULT_LEVEL,
  selectedMode: DEFAULT_MODE,
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
  scrollLockY: 0,
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
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

function getModeMeta(mode) {
  return MODE_META[mode] || MODE_META[DEFAULT_MODE];
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

function createModeBucket(rawValue) {
  const value = rawValue && typeof rawValue === "object" ? rawValue : {};
  return {
    meaning: value.meaning && typeof value.meaning === "object" ? value.meaning : {},
    dictation: value.dictation && typeof value.dictation === "object" ? value.dictation : {}
  };
}

function getSavedStatsMap() {
  const saved = readJsonStorage(STORAGE_KEYS.statsByModeAndLevel, null);

  if (saved) {
    return createModeBucket(saved);
  }

  const legacy = readJsonStorage(STORAGE_KEYS.legacyStatsByLevel, {});
  return {
    meaning: legacy && typeof legacy === "object" ? legacy : {},
    dictation: {}
  };
}

function getModeStats(mode, levelId) {
  const statsMap = getSavedStatsMap();
  const defaults = mode === "dictation"
    ? { bestCorrect: 0, latestAccuracy: 0 }
    : { bestScore: 0, latestAccuracy: 0 };

  return {
    ...defaults,
    ...(statsMap[mode] && statsMap[mode][levelId] ? statsMap[mode][levelId] : {})
  };
}

function getSavedWrongWordMap() {
  const saved = readJsonStorage(STORAGE_KEYS.wrongWordsByModeAndLevel, null);

  if (saved) {
    return createModeBucket(saved);
  }

  const legacy = readJsonStorage(STORAGE_KEYS.legacyWrongWordsByLevel, {});
  return {
    meaning: legacy && typeof legacy === "object" ? legacy : {},
    dictation: {}
  };
}

function getSavedWrongWords(mode, levelId) {
  const wrongWordMap = getSavedWrongWordMap();
  const ids = wrongWordMap[mode] && Array.isArray(wrongWordMap[mode][levelId])
    ? wrongWordMap[mode][levelId]
    : [];

  return ids
    .map((id) => WORD_BANK.find((word) => word.id === id))
    .filter(Boolean);
}

function getStoredLevel() {
  const storedLevel = localStorage.getItem(STORAGE_KEYS.selectedLevel);
  return LEVEL_OPTIONS.some((option) => option.id === storedLevel) ? storedLevel : DEFAULT_LEVEL;
}

function getStoredMode() {
  const storedMode = localStorage.getItem(STORAGE_KEYS.selectedMode);
  return MODE_OPTIONS.some((option) => option.id === storedMode) ? storedMode : DEFAULT_MODE;
}

function persistSelectedLevel() {
  localStorage.setItem(STORAGE_KEYS.selectedLevel, state.selectedLevel);
}

function persistSelectedMode() {
  localStorage.setItem(STORAGE_KEYS.selectedMode, state.selectedMode);
}

function isSpeechSupported() {
  return typeof window.SpeechSynthesisUtterance !== "undefined" && "speechSynthesis" in window;
}

function resolveSpeechVoice() {
  if (!isSpeechSupported()) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();

  return voices.find((voice) => /en[-_]gb/i.test(voice.lang) || /en[-\s]?gb/i.test(voice.name))
    || voices.find((voice) => /^en/i.test(voice.lang))
    || null;
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

function createMeaningQuestion(word, levelPool) {
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

function buildMeaningQuestionSet(levelId) {
  const levelWords = getWordsForLevel(levelId);
  const roundSize = Math.min(GAME_CONFIG.meaning.questionsPerRound, levelWords.length);

  return shuffle(levelWords)
    .slice(0, roundSize)
    .map((word) => createMeaningQuestion(word, levelWords));
}

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

function renderModeButtons() {
  elements.modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === state.selectedMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
}

function updateLevelLabels() {
  const levelMeta = getLevelMeta(state.selectedLevel);
  const modeLabel = MODE_OPTIONS.find((option) => option.id === state.selectedMode)?.label || "词义选择";
  elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
  elements.currentLevelBadge.textContent = `当前玩法：${modeLabel} · 级别：${levelMeta.label}`;
}

function updateTips(meta) {
  const [tip1, tip2, tip3] = meta.tips;
  elements.tipTitle1.textContent = tip1.title;
  elements.tipCopy1.textContent = tip1.copy;
  elements.tipTitle2.textContent = tip2.title;
  elements.tipCopy2.textContent = tip2.copy;
  elements.tipTitle3.textContent = tip3.title;
  elements.tipCopy3.textContent = tip3.copy;
}

function updateHomeModeContent() {
  const meta = getModeMeta(state.selectedMode);
  const dictationSupported = isSpeechSupported();

  renderModeButtons();
  updateLevelLabels();
  updateTips(meta);

  elements.homeTitle.textContent = meta.homeTitle;
  elements.homeCopy.textContent = meta.homeCopy;
  elements.startButton.textContent = meta.startLabel;
  elements.bestScoreLabel.textContent = meta.primaryStatLabel;
  elements.latestAccuracyLabel.textContent = "最近正确率";

  if (state.selectedMode === "dictation" && !dictationSupported) {
    elements.homeModeNote.textContent = "当前浏览器不支持语音播放，听写模式暂不可用，请改用支持 SpeechSynthesis 的浏览器。";
    elements.homeModeNote.classList.remove("is-hidden");
    elements.startButton.disabled = true;
  } else {
    elements.homeModeNote.textContent = "";
    elements.homeModeNote.classList.add("is-hidden");
    elements.startButton.disabled = false;
  }
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

function updateHomeStats() {
  const levelStats = getModeStats(state.selectedMode, state.selectedLevel);
  const savedWrongWords = getSavedWrongWords(state.selectedMode, state.selectedLevel);
  const levelWords = getWordsForLevel(state.selectedLevel);

  updateHomeModeContent();
  elements.wordBankSize.textContent = String(levelWords.length);
  elements.bestScore.textContent = state.selectedMode === "dictation"
    ? `${levelStats.bestCorrect} / ${GAME_CONFIG.dictation.wordsPerRound}`
    : String(levelStats.bestScore);
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

function getDictationPlaybackTag() {
  if (state.dictationPlaybackStatus === "ready") {
    return "可提交";
  }

  if (state.dictationPlaybackStatus === "error") {
    return "播放失败";
  }

  return `播放 ${state.dictationPlaybackCount} / ${GAME_CONFIG.dictation.playbackRepeats}`;
}

function getDictationPlaybackStatusText() {
  if (!isSpeechSupported()) {
    return "当前浏览器不支持语音播放，无法进入听写流程。";
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

function updateDictationControls() {
  const shouldDisableInput = state.lockInput || state.roundFinished || !isSpeechSupported();
  const shouldDisableSubmit = shouldDisableInput || !state.dictationReadyForSubmit;

  elements.difficultyTag.textContent = getDictationPlaybackTag();
  elements.dictationStatus.textContent = getDictationPlaybackStatusText();
  elements.dictationInput.disabled = shouldDisableInput;
  elements.submitDictationButton.disabled = shouldDisableSubmit;
  elements.dictationSupportNote.classList.toggle("is-hidden", isSpeechSupported());
}

function updateStatusBar() {
  if (state.selectedMode === "dictation") {
    elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 词`;
    elements.statusLabel1.textContent = "提交倒计时";
    elements.timerValue.textContent = state.dictationReadyForSubmit || state.lockInput
      ? formatTime(Math.max(state.dictationSubmitSecondsLeft, 0))
      : "--:--";
    elements.statusLabel2.textContent = "播放";
    elements.scoreValue.textContent = state.dictationPlaybackStatus === "error"
      ? "异常"
      : `${state.dictationPlaybackCount} / ${GAME_CONFIG.dictation.playbackRepeats}`;
    elements.statusLabel3.textContent = "答对";
    elements.livesValue.textContent = String(state.correctCount);
    elements.statusLabel4.textContent = "错误";
    elements.comboValue.textContent = String(state.wrongWords.length);
    updateDictationControls();
    return;
  }

  elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
  elements.statusLabel1.textContent = "时间";
  elements.timerValue.textContent = formatTime(state.timeLeft);
  elements.statusLabel2.textContent = "分数";
  elements.scoreValue.textContent = String(state.score);
  elements.statusLabel3.textContent = "生命";
  elements.livesValue.textContent = String(state.lives);
  elements.statusLabel4.textContent = "连击";
  elements.comboValue.textContent = String(state.combo);
}

function clearFeedback() {
  elements.feedbackBox.className = "feedback-box";
  elements.feedbackBox.textContent = getModeMeta(state.selectedMode).defaultFeedback;
}

function renderMeaningQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  elements.gameTitle.textContent = getModeMeta("meaning").gameTitle;
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

function renderDictationQuestion() {
  const currentQuestion = state.questions[state.currentIndex];

  elements.gameTitle.textContent = getModeMeta("dictation").gameTitle;
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

function renderQuestion() {
  if (state.selectedMode === "dictation") {
    renderDictationQuestion();
    return;
  }

  renderMeaningQuestion();
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

function stopDictationSubmitTimer() {
  if (state.dictationSubmitTimerId) {
    window.clearInterval(state.dictationSubmitTimerId);
    state.dictationSubmitTimerId = null;
  }
}

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

function stopActiveRoundEffects() {
  stopTimer();
  stopDictationSubmitTimer();
  clearFeedbackTimeout();
  stopDictationPlayback();
}

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
      handleDictationSubmit({ auto: true });
      return;
    }

    updateStatusBar();
  }, 1000);
}

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
    addWrongWord(currentQuestion);
    elements.feedbackBox.className = "feedback-box is-error";
    elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
  }

  updateStatusBar();
  clearFeedbackTimeout();

  state.feedbackTimeoutId = window.setTimeout(() => {
    moveToNextMeaningQuestion();
  }, GAME_CONFIG.meaning.feedbackDelayMs);
}

function normalizeWordAnswer(value) {
  return value.trim().toLowerCase();
}

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

function getMeaningResultSummary(accuracy) {
  if (accuracy >= 85) {
    return "这局很稳，你已经能快速认出不少高频词了。";
  }

  if (accuracy >= 60) {
    return "状态不错，再来两局，这批单词会更熟。";
  }

  return "别怕，这一局已经帮你把重点词过了一遍，马上再刷效果最好。";
}

function getDictationResultSummary(accuracy) {
  if (accuracy >= 90) {
    return "这轮听写很稳，拼写和发音对应关系已经越来越熟了。";
  }

  if (accuracy >= 65) {
    return "这一轮基础不错，把错词再过一遍会更扎实。";
  }

  return "先别急，听写本来就比选择题更难，把这一轮错词复盘一遍最有效。";
}

function renderResult() {
  const accuracy = state.answeredCount === 0
    ? 0
    : Math.round((state.correctCount / state.answeredCount) * 100);

  if (state.selectedMode === "dictation") {
    elements.resultTitle.textContent = "听写结算";
    elements.resultLabel1.textContent = "本局答对";
    elements.resultScore.textContent = String(state.correctCount);
    elements.resultLabel2.textContent = "总词数";
    elements.resultCorrect.textContent = String(state.questions.length);
    elements.resultLabel3.textContent = "正确率";
    elements.resultAccuracy.textContent = `${accuracy}%`;
    elements.resultLabel4.textContent = "错词数";
    elements.resultBestCombo.textContent = String(state.wrongWords.length);
    elements.resultSummary.textContent = getDictationResultSummary(accuracy);
    elements.resultReviewEmpty.textContent = "这一轮听写没有错词，表现很稳。";
    elements.playAgainButton.textContent = "再来一轮听写";
  } else {
    elements.resultTitle.textContent = "本局结算";
    elements.resultLabel1.textContent = "最终得分";
    elements.resultScore.textContent = String(state.score);
    elements.resultLabel2.textContent = "答对题数";
    elements.resultCorrect.textContent = `${state.correctCount} / ${state.answeredCount}`;
    elements.resultLabel3.textContent = "正确率";
    elements.resultAccuracy.textContent = `${accuracy}%`;
    elements.resultLabel4.textContent = "最高连击";
    elements.resultBestCombo.textContent = String(state.bestCombo);
    elements.resultSummary.textContent = getMeaningResultSummary(accuracy);
    elements.resultReviewEmpty.textContent = "这一局没有错词，表现不错。";
    elements.playAgainButton.textContent = "再来一局";
  }

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
  const wrongWordMap = getSavedWrongWordMap();

  if (!statsMap[state.selectedMode]) {
    statsMap[state.selectedMode] = {};
  }

  if (!wrongWordMap[state.selectedMode]) {
    wrongWordMap[state.selectedMode] = {};
  }

  if (state.selectedMode === "dictation") {
    const currentStats = statsMap.dictation[state.selectedLevel] || { bestCorrect: 0, latestAccuracy: 0 };
    statsMap.dictation[state.selectedLevel] = {
      bestCorrect: Math.max(state.correctCount, currentStats.bestCorrect),
      latestAccuracy: accuracy
    };
  } else {
    const currentStats = statsMap.meaning[state.selectedLevel] || { bestScore: 0, latestAccuracy: 0 };
    statsMap.meaning[state.selectedLevel] = {
      bestScore: Math.max(state.score, currentStats.bestScore),
      latestAccuracy: accuracy
    };
  }

  wrongWordMap[state.selectedMode][state.selectedLevel] = state.wrongWords.map((word) => word.id);

  writeJsonStorage(STORAGE_KEYS.statsByModeAndLevel, statsMap);
  writeJsonStorage(STORAGE_KEYS.wrongWordsByModeAndLevel, wrongWordMap);
}

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

function prepareRoundState(items) {
  state.questions = items;
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
}

function startGame() {
  if (state.selectedMode === "dictation" && !isSpeechSupported()) {
    updateHomeStats();
    return;
  }

  stopActiveRoundEffects();

  const items = state.selectedMode === "dictation"
    ? buildDictationRound(state.selectedLevel)
    : buildMeaningQuestionSet(state.selectedLevel);

  if (items.length === 0) {
    return;
  }

  prepareRoundState(items);
  showScreen("game");
  renderQuestion();

  if (state.selectedMode === "meaning") {
    startTimer();
  }
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
        <strong class="level-option-title">${escapeHtml(option.label)}</strong>
        <span class="level-option-copy">${escapeHtml(option.description)}</span>
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

function selectMode(mode) {
  if (state.currentScreen === "game" || !MODE_OPTIONS.some((option) => option.id === mode)) {
    return;
  }

  state.selectedMode = mode;
  persistSelectedMode();
  updateHomeStats();
}

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

function startDictationPlayback(word) {
  stopDictationPlayback();
  stopDictationSubmitTimer();
  state.speechRunId += 1;
  state.dictationPlaybackCount = 0;
  state.dictationPlaybackStatus = "idle";
  state.dictationReadyForSubmit = false;
  state.dictationSubmitSecondsLeft = GAME_CONFIG.dictation.submitWindowSeconds;
  updateStatusBar();

  if (!isSpeechSupported()) {
    state.dictationPlaybackStatus = "error";
    updateStatusBar();
    return;
  }

  speakWord(word, state.speechRunId);
}

function goHome() {
  stopActiveRoundEffects();
  updateHomeStats();
  showScreen("home");
}

function bindEvents() {
  elements.startButton.addEventListener("click", startGame);
  elements.playAgainButton.addEventListener("click", startGame);
  elements.backHomeButton.addEventListener("click", goHome);
  elements.exitGameButton.addEventListener("click", goHome);
  elements.toggleReviewButton.addEventListener("click", toggleHomeReview);
  elements.openSettingsButton.addEventListener("click", openSettingsModal);
  elements.closeSettingsButton.addEventListener("click", closeSettingsModal);
  elements.cancelSettingsButton.addEventListener("click", closeSettingsModal);
  elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
  elements.submitDictationButton.addEventListener("click", handleDictationSubmit);
  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectMode(button.dataset.mode);
    });
  });
  elements.settingsModal.addEventListener("click", (event) => {
    if (event.target === elements.settingsModal) {
      closeSettingsModal();
    }
  });
  elements.dictationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleDictationSubmit();
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

    if (state.selectedMode === "dictation") {
      if (event.key === "Enter") {
        event.preventDefault();
        handleDictationSubmit();
      }

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

  if (isSpeechSupported() && typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      if (state.currentScreen !== "game") {
        updateHomeStats();
      }
    });
  }
}

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
