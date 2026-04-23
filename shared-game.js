/**
 * 封装练习模式、闯关模式与生存模式共用的工具模块，统一向 window.GameShared 暴露能力。
 */
(function () {
  const STORAGE_KEYS = {
    selectedLevel: "englishGame.selectedLevel",
    selectedMode: "englishGame.selectedMode",
    statsByModeAndLevel: "englishGame.statsByModeAndLevel",
    wrongWordsByModeAndLevel: "englishGame.wrongWordsByModeAndLevel",
    legacyStatsByLevel: "englishGame.statsByLevel",
    legacyWrongWordsByLevel: "englishGame.wrongWordsByLevel",
    stageProgressByModeAndLevel: "englishGame.stageProgressByModeAndLevel",
    stageStatsByModeAndLevel: "englishGame.stageStatsByModeAndLevel",
    survivalStatsByModeAndLevel: "englishGame.survivalStatsByModeAndLevel",
    survivalWrongWordsByModeAndLevel: "englishGame.survivalWrongWordsByModeAndLevel"
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

  const SURVIVAL_CONFIG = {
    meaning: {
      startingLives: 1,
      baseScore: 100,
      feedbackDelayMs: 850,
      recentWordWindowSize: 12
    },
    dictation: {}
  };

  /**
   * 随机打乱数组顺序并返回新数组。
   */
  function shuffle(items) {
    const clone = [...items];

    for (let index = clone.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [clone[index], clone[randomIndex]] = [clone[randomIndex], clone[index]];
    }

    return clone;
  }

  /**
   * 对文本进行 HTML 转义，避免渲染时插入未转义内容。
   */
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#39;");
  }

  /**
   * 把秒数格式化为 mm:ss 形式的倒计时文本。
   */
  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  /**
   * 从 localStorage 读取 JSON 数据，并在异常时返回兜底值。
   */
  function readJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * 把对象序列化后写入 localStorage。
   */
  function writeJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * 规范化按玩法分组的存储结构，确保 meaning 和 dictation 桶始终存在。
   */
  function createModeBucket(rawValue) {
    const value = rawValue && typeof rawValue === "object" ? rawValue : {};
    return {
      meaning: value.meaning && typeof value.meaning === "object" ? value.meaning : {},
      dictation: value.dictation && typeof value.dictation === "object" ? value.dictation : {}
    };
  }

  /**
   * 根据级别 ID 获取对应的级别元信息。
   */
  function getLevelMeta(levelId) {
    return LEVEL_OPTIONS.find((option) => option.id === levelId) || LEVEL_OPTIONS.find((option) => option.id === DEFAULT_LEVEL);
  }

  /**
   * 获取指定级别下的全部单词。
   */
  function getWordsForLevel(levelId) {
    return WORD_BANK.filter((word) => word.level === levelId);
  }

  /**
   * 根据单词 ID 查找词库中的单词详情。
   */
  function getWordById(wordId) {
    return WORD_BANK.find((word) => word.id === wordId) || null;
  }

  /**
   * 读取本地保存的级别设置，不合法时回退到默认级别。
   */
  function getStoredLevel() {
    const storedLevel = localStorage.getItem(STORAGE_KEYS.selectedLevel);
    return LEVEL_OPTIONS.some((option) => option.id === storedLevel) ? storedLevel : DEFAULT_LEVEL;
  }

  /**
   * 读取本地保存的玩法设置，不合法时回退到默认玩法。
   */
  function getStoredMode(modeOptions) {
    const storedMode = localStorage.getItem(STORAGE_KEYS.selectedMode);
    return Array.isArray(modeOptions) && modeOptions.some((option) => option.id === storedMode) ? storedMode : DEFAULT_MODE;
  }

  /**
   * 持久化当前选中的级别。
   */
  function persistSelectedLevel(levelId) {
    localStorage.setItem(STORAGE_KEYS.selectedLevel, levelId);
  }

  /**
   * 持久化当前选中的玩法。
   */
  function persistSelectedMode(modeId) {
    localStorage.setItem(STORAGE_KEYS.selectedMode, modeId);
  }

  /**
   * 读取练习模式统计数据，并兼容旧版存储结构。
   */
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

  /**
   * 获取指定玩法和级别下的统计数据，并补齐默认字段。
   */
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

  /**
   * 读取错词记录，并兼容旧版存储结构。
   */
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

  /**
   * 获取指定玩法和级别下的错词详情列表。
   */
  function getSavedWrongWords(mode, levelId) {
    const wrongWordMap = getSavedWrongWordMap();
    const ids = wrongWordMap[mode] && Array.isArray(wrongWordMap[mode][levelId])
      ? wrongWordMap[mode][levelId]
      : [];

    return ids
      .map((id) => getWordById(id))
      .filter(Boolean);
  }

  /**
   * 从干扰项池中选出含义不重复的干扰项。
   */
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

  /**
   * 把选项数组转换为稳定签名，便于比较是否与旧选项重复。
   */
  function getOptionSignature(options) {
    return [...options].sort().join("||");
  }

  /**
   * 为词义题构建包含正确答案的选项列表，并尽量避免重复上一次选项。
   */
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

  /**
   * 根据单词数据生成一题完整的词义选择题结构。
   */
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

  /**
   * 渲染级别选择按钮列表，并绑定选择事件。
   */
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

  /**
   * 在弹窗打开或关闭时锁定并恢复页面滚动位置。
   */
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

  /**
   * 生成新的闯关进度默认值。
   */
  function getEmptyStageProgress(totalStages, mode) {
    return {
      unlockedStage: mode === "meaning" && totalStages > 0 ? 1 : 0,
      completedStages: [],
      lastPlayedStage: null
    };
  }

  /**
   * 读取按玩法和级别存储的闯关进度映射。
   */
  function getSavedStageProgressMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.stageProgressByModeAndLevel, {}));
  }

  /**
   * 获取指定玩法和级别下的闯关进度，并校正字段合法性。
   */
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

  /**
   * 保存指定玩法和级别下的闯关进度。
   */
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

  /**
   * 读取按玩法和级别存储的闯关统计映射。
   */
  function getSavedStageStatsMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.stageStatsByModeAndLevel, {}));
  }

  /**
   * 获取指定玩法和级别下的关卡统计数据。
   */
  function getStageLevelStats(mode, levelId) {
    const statsMap = getSavedStageStatsMap();
    const raw = statsMap[mode] && statsMap[mode][levelId] && typeof statsMap[mode][levelId] === "object"
      ? statsMap[mode][levelId]
      : {};

    return { ...raw };
  }

  /**
   * 保存指定玩法和级别下的关卡统计数据。
   */
  function saveStageLevelStats(mode, levelId, levelStats) {
    const statsMap = getSavedStageStatsMap();

    if (!statsMap[mode]) {
      statsMap[mode] = {};
    }

    statsMap[mode][levelId] = levelStats;
    writeJsonStorage(STORAGE_KEYS.stageStatsByModeAndLevel, statsMap);
  }

  /**
   * 读取按玩法和级别存储的生存模式统计映射。
   */
  function getSavedSurvivalStatsMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.survivalStatsByModeAndLevel, {}));
  }

  /**
   * 获取指定玩法和级别下的生存模式统计数据。
   */
  function getSurvivalStats(mode, levelId) {
    const statsMap = getSavedSurvivalStatsMap();
    const defaults = {
      bestStreak: 0,
      bestScore: 0,
      latestAccuracy: 0,
      latestAnsweredCount: 0
    };

    return {
      ...defaults,
      ...(statsMap[mode] && statsMap[mode][levelId] ? statsMap[mode][levelId] : {})
    };
  }

  /**
   * 读取按玩法和级别存储的生存模式错词映射。
   */
  function getSavedSurvivalWrongWordMap() {
    return createModeBucket(readJsonStorage(STORAGE_KEYS.survivalWrongWordsByModeAndLevel, {}));
  }

  /**
   * 获取指定玩法和级别下的生存模式错词详情列表。
   */
  function getSavedSurvivalWrongWords(mode, levelId) {
    const wrongWordMap = getSavedSurvivalWrongWordMap();
    const ids = wrongWordMap[mode] && Array.isArray(wrongWordMap[mode][levelId])
      ? wrongWordMap[mode][levelId]
      : [];

    return ids
      .map((id) => getWordById(id))
      .filter(Boolean);
  }

  window.GameShared = {
    STORAGE_KEYS,
    DEFAULT_LEVEL,
    DEFAULT_MODE,
    STAGE_CONFIG,
    SURVIVAL_CONFIG,
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
    saveStageLevelStats,
    getSavedSurvivalStatsMap,
    getSurvivalStats,
    getSavedSurvivalWrongWordMap,
    getSavedSurvivalWrongWords
  };
})();
