(function () {
  const STORAGE_KEYS = {
    selectedLevel: "englishGame.selectedLevel",
    selectedMode: "englishGame.selectedMode",
    statsByModeAndLevel: "englishGame.statsByModeAndLevel",
    wrongWordsByModeAndLevel: "englishGame.wrongWordsByModeAndLevel",
    legacyStatsByLevel: "englishGame.statsByLevel",
    legacyWrongWordsByLevel: "englishGame.wrongWordsByLevel",
    stageProgressByModeAndLevel: "englishGame.stageProgressByModeAndLevel",
    stageStatsByModeAndLevel: "englishGame.stageStatsByModeAndLevel"
  };

  const DEFAULT_LEVEL = "cet4";
  const DEFAULT_MODE = "meaning";

  const STAGE_CONFIG = {
    meaning: {
      questionsPerStage: 10,
      totalTimeSeconds: 75,
      startingLives: 2,
      passAccuracy: 90,
      baseScore: 100,
      feedbackDelayMs: 850
    },
    dictation: {
      questionsPerStage: 10,
      totalTimeSeconds: 75,
      startingLives: 2,
      passAccuracy: 90
    }
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

  function getLevelMeta(levelId) {
    return LEVEL_OPTIONS.find((option) => option.id === levelId) || LEVEL_OPTIONS.find((option) => option.id === DEFAULT_LEVEL);
  }

  function getWordsForLevel(levelId) {
    return WORD_BANK.filter((word) => word.level === levelId);
  }

  function getWordById(wordId) {
    return WORD_BANK.find((word) => word.id === wordId) || null;
  }

  function getStoredLevel() {
    const storedLevel = localStorage.getItem(STORAGE_KEYS.selectedLevel);
    return LEVEL_OPTIONS.some((option) => option.id === storedLevel) ? storedLevel : DEFAULT_LEVEL;
  }

  function getStoredMode(modeOptions) {
    const storedMode = localStorage.getItem(STORAGE_KEYS.selectedMode);
    return Array.isArray(modeOptions) && modeOptions.some((option) => option.id === storedMode) ? storedMode : DEFAULT_MODE;
  }

  function persistSelectedLevel(levelId) {
    localStorage.setItem(STORAGE_KEYS.selectedLevel, levelId);
  }

  function persistSelectedMode(modeId) {
    localStorage.setItem(STORAGE_KEYS.selectedMode, modeId);
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
      .map((id) => getWordById(id))
      .filter(Boolean);
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

  function getOptionSignature(options) {
    return [...options].sort().join("||");
  }

  function buildMeaningOptions(word, distractorPool, excludedOptionSignature) {
    let fallbackOptions = [word.meaning];

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const sameDifficultyPool = distractorPool.filter((item) => {
        return item.id !== word.id && item.meaning !== word.meaning && item.difficulty === word.difficulty;
      });

      const fallbackPool = distractorPool.filter((item) => {
        return item.id !== word.id && item.meaning !== word.meaning;
      });

      const distractors = takeUniqueDistractors(
        shuffle([...sameDifficultyPool, ...fallbackPool]),
        3
      );
      const options = shuffle([word.meaning, ...distractors.map((item) => item.meaning)]);

      if (attempt === 0) {
        fallbackOptions = options;
      }

      if (!excludedOptionSignature || getOptionSignature(options) !== excludedOptionSignature) {
        return options;
      }
    }

    return fallbackOptions;
  }

  function createMeaningQuestion(word, levelPool, config = {}) {
    const distractorPool = config.distractorPool || levelPool;
    const excludedOptionSignature = Array.isArray(config.excludedOptions)
      ? getOptionSignature(config.excludedOptions)
      : null;
    const options = buildMeaningOptions(word, distractorPool, excludedOptionSignature);

    return {
      id: word.id,
      word: word.word,
      meaning: word.meaning,
      partOfSpeech: word.partOfSpeech,
      difficulty: word.difficulty,
      phonetic: word.phonetic,
      senses: word.senses,
      options
    };
  }

  function renderLevelOptions(container, selectedLevel, onSelect) {
    container.innerHTML = "";

    LEVEL_OPTIONS.forEach((option) => {
      const count = getWordsForLevel(option.id).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `level-option${selectedLevel === option.id ? " is-selected" : ""}`;
      button.dataset.level = option.id;
      button.innerHTML = `
        <div>
          <strong class="level-option-title">${escapeHtml(option.label)}</strong>
          <span class="level-option-copy">${escapeHtml(option.description)}</span>
        </div>
        <span class="level-option-count">${count} 词</span>
      `;
      button.addEventListener("click", () => {
        onSelect(option.id);
      });
      container.appendChild(button);
    });
  }

  let scrollLockY = 0;

  function setBodyScrollLock(locked) {
    if (locked) {
      scrollLockY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = `-${scrollLockY}px`;
      document.body.classList.add("modal-open");
      return;
    }

    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    window.scrollTo(0, scrollLockY);
  }

  function getEmptyStageProgress(totalStages, mode) {
    return {
      unlockedStage: mode === "meaning" && totalStages > 0 ? 1 : 0,
      completedStages: [],
      lastPlayedStage: null
    };
  }

  function getSavedStageProgressMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.stageProgressByModeAndLevel, {}));
  }

  function getStageProgress(mode, levelId, totalStages) {
    const progressMap = getSavedStageProgressMap();
    const defaults = getEmptyStageProgress(totalStages, mode);
    const raw = progressMap[mode] && progressMap[mode][levelId] ? progressMap[mode][levelId] : {};
    const completedStages = Array.isArray(raw.completedStages)
      ? raw.completedStages
        .map((stageNumber) => Number(stageNumber))
        .filter((stageNumber) => Number.isInteger(stageNumber) && stageNumber >= 1 && stageNumber <= totalStages)
      : [];

    return {
      unlockedStage: Math.max(0, Math.min(Number(raw.unlockedStage) || defaults.unlockedStage, totalStages || defaults.unlockedStage)),
      completedStages: [...new Set(completedStages)].sort((left, right) => left - right),
      lastPlayedStage: Number.isInteger(raw.lastPlayedStage) ? raw.lastPlayedStage : defaults.lastPlayedStage
    };
  }

  function saveStageProgress(mode, levelId, progress) {
    const progressMap = getSavedStageProgressMap();

    if (!progressMap[mode]) {
      progressMap[mode] = {};
    }

    progressMap[mode][levelId] = {
      unlockedStage: progress.unlockedStage,
      completedStages: progress.completedStages,
      lastPlayedStage: progress.lastPlayedStage
    };

    writeJsonStorage(STORAGE_KEYS.stageProgressByModeAndLevel, progressMap);
  }

  function getSavedStageStatsMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.stageStatsByModeAndLevel, {}));
  }

  function getStageLevelStats(mode, levelId) {
    const statsMap = getSavedStageStatsMap();
    const raw = statsMap[mode] && statsMap[mode][levelId] && typeof statsMap[mode][levelId] === "object"
      ? statsMap[mode][levelId]
      : {};

    return { ...raw };
  }

  function saveStageLevelStats(mode, levelId, levelStats) {
    const statsMap = getSavedStageStatsMap();

    if (!statsMap[mode]) {
      statsMap[mode] = {};
    }

    statsMap[mode][levelId] = levelStats;
    writeJsonStorage(STORAGE_KEYS.stageStatsByModeAndLevel, statsMap);
  }

  window.GameShared = {
    STORAGE_KEYS,
    DEFAULT_LEVEL,
    DEFAULT_MODE,
    STAGE_CONFIG,
    LEVEL_OPTIONS,
    WORD_BANK,
    shuffle,
    escapeHtml,
    formatTime,
    readJsonStorage,
    writeJsonStorage,
    createModeBucket,
    getLevelMeta,
    getWordsForLevel,
    getWordById,
    getStoredLevel,
    getStoredMode,
    persistSelectedLevel,
    persistSelectedMode,
    getSavedStatsMap,
    getModeStats,
    getSavedWrongWordMap,
    getSavedWrongWords,
    getOptionSignature,
    createMeaningQuestion,
    renderLevelOptions,
    setBodyScrollLock,
    getStageProgress,
    saveStageProgress,
    getStageLevelStats,
    saveStageLevelStats
  };
})();
