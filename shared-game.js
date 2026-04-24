/**
 * 封装练习模式、闯关模式与生存模式共用的工具模块，统一向 window.GameShared 暴露能力。
 */
(function () {
  const STORAGE_KEYS = {
    profileStore: "englishGame.profileStore",
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

  const PROFILE_STORE_VERSION = 1;
  const PROFILE_CHANGE_EVENT = "english-game:profile-change";
  const PROFILE_UPDATE_EVENT = "english-game:profile-update";
  const PROFILE_SWITCH_REQUEST_EVENT = "english-game:profile-switch-request";
  const DEFAULT_LEVEL = "cet4";
  const DEFAULT_MODE = "meaning";
  const DEFAULT_PROFILE_NAME = "默认档案";

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

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function cloneValue(value) {
    if (value === null || typeof value !== "object") {
      return value;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function getNowTimestamp() {
    return new Date().toISOString();
  }

  function isValidTimestamp(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
  }

  function normalizeProfileName(name, fallbackName = DEFAULT_PROFILE_NAME) {
    const normalized = String(name || "").trim();

    if (!normalized) {
      return fallbackName;
    }

    return normalized;
  }

  function normalizeLevelId(levelId) {
    return LEVEL_OPTIONS.some((option) => option.id === levelId) ? levelId : DEFAULT_LEVEL;
  }

  function normalizeModeId(modeId) {
    return typeof modeId === "string" && modeId.trim() ? modeId : DEFAULT_MODE;
  }

  function createModeBucket(rawValue) {
    const value = isObject(rawValue) ? rawValue : {};
    return {
      meaning: isObject(value.meaning) ? { ...value.meaning } : {},
      dictation: isObject(value.dictation) ? { ...value.dictation } : {}
    };
  }

  function createEmptyPracticeData() {
    return {
      statsByModeAndLevel: createModeBucket(),
      wrongWordsByModeAndLevel: createModeBucket()
    };
  }

  function createEmptyStageData() {
    return {
      progressByModeAndLevel: createModeBucket(),
      statsByModeAndLevel: createModeBucket()
    };
  }

  function createEmptySurvivalData() {
    return {
      statsByModeAndLevel: createModeBucket(),
      wrongWordsByModeAndLevel: createModeBucket()
    };
  }

  function createProfileId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `profile-${crypto.randomUUID()}`;
    }

    return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function createEmptyProfile(name = DEFAULT_PROFILE_NAME, options = {}) {
    const createdAt = isValidTimestamp(options.createdAt) ? options.createdAt : getNowTimestamp();
    const lastActiveAt = isValidTimestamp(options.lastActiveAt) ? options.lastActiveAt : createdAt;
    return {
      id: typeof options.id === "string" && options.id.trim() ? options.id : createProfileId(),
      name: normalizeProfileName(name),
      createdAt,
      lastActiveAt,
      settings: {
        selectedLevel: normalizeLevelId(options.selectedLevel),
        selectedMode: normalizeModeId(options.selectedMode)
      },
      practice: createEmptyPracticeData(),
      stage: createEmptyStageData(),
      survival: createEmptySurvivalData()
    };
  }

  function normalizeProfile(rawProfile, fallbackId) {
    const createdAt = isValidTimestamp(rawProfile && rawProfile.createdAt)
      ? rawProfile.createdAt
      : getNowTimestamp();
    const profile = createEmptyProfile(rawProfile && rawProfile.name, {
      id: rawProfile && rawProfile.id ? rawProfile.id : fallbackId,
      createdAt,
      lastActiveAt: rawProfile && rawProfile.lastActiveAt,
      selectedLevel: rawProfile && rawProfile.settings ? rawProfile.settings.selectedLevel : undefined,
      selectedMode: rawProfile && rawProfile.settings ? rawProfile.settings.selectedMode : undefined
    });

    return {
      ...profile,
      practice: {
        statsByModeAndLevel: createModeBucket(rawProfile && rawProfile.practice ? rawProfile.practice.statsByModeAndLevel : undefined),
        wrongWordsByModeAndLevel: createModeBucket(rawProfile && rawProfile.practice ? rawProfile.practice.wrongWordsByModeAndLevel : undefined)
      },
      stage: {
        progressByModeAndLevel: createModeBucket(rawProfile && rawProfile.stage ? rawProfile.stage.progressByModeAndLevel : undefined),
        statsByModeAndLevel: createModeBucket(rawProfile && rawProfile.stage ? rawProfile.stage.statsByModeAndLevel : undefined)
      },
      survival: {
        statsByModeAndLevel: createModeBucket(rawProfile && rawProfile.survival ? rawProfile.survival.statsByModeAndLevel : undefined),
        wrongWordsByModeAndLevel: createModeBucket(rawProfile && rawProfile.survival ? rawProfile.survival.wrongWordsByModeAndLevel : undefined)
      }
    };
  }

  function normalizeProfileStore(rawStore) {
    if (!isObject(rawStore) || !isObject(rawStore.profiles)) {
      return null;
    }

    const entries = Object.entries(rawStore.profiles)
      .map(([profileId, profile]) => [profileId, normalizeProfile(profile, profileId)]);

    if (entries.length === 0) {
      return null;
    }

    const profiles = Object.fromEntries(entries);
    const fallbackCurrentProfileId = entries[0][0];
    const currentProfileId = typeof rawStore.currentProfileId === "string" && profiles[rawStore.currentProfileId]
      ? rawStore.currentProfileId
      : fallbackCurrentProfileId;

    return {
      version: PROFILE_STORE_VERSION,
      currentProfileId,
      profiles
    };
  }

  function readRawJsonStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeRawJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function listProfilesFromStore(store) {
    return Object.values(store.profiles).sort((left, right) => {
      const leftTime = Date.parse(left.createdAt);
      const rightTime = Date.parse(right.createdAt);

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      return left.name.localeCompare(right.name, "zh-CN");
    });
  }

  function hasLegacyStorageData() {
    const legacyKeys = [
      STORAGE_KEYS.selectedLevel,
      STORAGE_KEYS.selectedMode,
      STORAGE_KEYS.statsByModeAndLevel,
      STORAGE_KEYS.wrongWordsByModeAndLevel,
      STORAGE_KEYS.legacyStatsByLevel,
      STORAGE_KEYS.legacyWrongWordsByLevel,
      STORAGE_KEYS.stageProgressByModeAndLevel,
      STORAGE_KEYS.stageStatsByModeAndLevel,
      STORAGE_KEYS.survivalStatsByModeAndLevel,
      STORAGE_KEYS.survivalWrongWordsByModeAndLevel
    ];

    return legacyKeys.some((key) => localStorage.getItem(key) !== null);
  }

  function getLegacySelectedLevel() {
    return normalizeLevelId(localStorage.getItem(STORAGE_KEYS.selectedLevel));
  }

  function getLegacySelectedMode() {
    return normalizeModeId(localStorage.getItem(STORAGE_KEYS.selectedMode));
  }

  function getLegacyPracticeStatsMap() {
    const saved = readRawJsonStorage(STORAGE_KEYS.statsByModeAndLevel, null);

    if (saved) {
      return createModeBucket(saved);
    }

    const legacy = readRawJsonStorage(STORAGE_KEYS.legacyStatsByLevel, {});
    return {
      meaning: isObject(legacy) ? { ...legacy } : {},
      dictation: {}
    };
  }

  function getLegacyPracticeWrongWordMap() {
    const saved = readRawJsonStorage(STORAGE_KEYS.wrongWordsByModeAndLevel, null);

    if (saved) {
      return createModeBucket(saved);
    }

    const legacy = readRawJsonStorage(STORAGE_KEYS.legacyWrongWordsByLevel, {});
    return {
      meaning: isObject(legacy) ? { ...legacy } : {},
      dictation: {}
    };
  }

  function getLegacyStageProgressMap() {
    return createModeBucket(readRawJsonStorage(STORAGE_KEYS.stageProgressByModeAndLevel, {}));
  }

  function getLegacyStageStatsMap() {
    return createModeBucket(readRawJsonStorage(STORAGE_KEYS.stageStatsByModeAndLevel, {}));
  }

  function getLegacySurvivalStatsMap() {
    return createModeBucket(readRawJsonStorage(STORAGE_KEYS.survivalStatsByModeAndLevel, {}));
  }

  function getLegacySurvivalWrongWordMap() {
    return createModeBucket(readRawJsonStorage(STORAGE_KEYS.survivalWrongWordsByModeAndLevel, {}));
  }

  function createProfileStoreFromLegacy() {
    const profile = createEmptyProfile(DEFAULT_PROFILE_NAME, {
      selectedLevel: getLegacySelectedLevel(),
      selectedMode: getLegacySelectedMode()
    });

    profile.practice.statsByModeAndLevel = getLegacyPracticeStatsMap();
    profile.practice.wrongWordsByModeAndLevel = getLegacyPracticeWrongWordMap();
    profile.stage.progressByModeAndLevel = getLegacyStageProgressMap();
    profile.stage.statsByModeAndLevel = getLegacyStageStatsMap();
    profile.survival.statsByModeAndLevel = getLegacySurvivalStatsMap();
    profile.survival.wrongWordsByModeAndLevel = getLegacySurvivalWrongWordMap();

    return {
      version: PROFILE_STORE_VERSION,
      currentProfileId: profile.id,
      profiles: {
        [profile.id]: profile
      }
    };
  }

  function createFreshProfileStore() {
    const profile = createEmptyProfile(DEFAULT_PROFILE_NAME);
    return {
      version: PROFILE_STORE_VERSION,
      currentProfileId: profile.id,
      profiles: {
        [profile.id]: profile
      }
    };
  }

  function ensureProfileStore() {
    const savedStore = normalizeProfileStore(readRawJsonStorage(STORAGE_KEYS.profileStore, null));

    if (savedStore) {
      return savedStore;
    }

    const initialStore = hasLegacyStorageData()
      ? createProfileStoreFromLegacy()
      : createFreshProfileStore();

    writeRawJsonStorage(STORAGE_KEYS.profileStore, initialStore);
    return initialStore;
  }

  function saveProfileStore(store) {
    const normalizedStore = normalizeProfileStore(store);

    if (!normalizedStore) {
      throw new Error("Profile store is invalid.");
    }

    writeRawJsonStorage(STORAGE_KEYS.profileStore, normalizedStore);
    return normalizedStore;
  }

  function dispatchProfileChange(detail) {
    window.dispatchEvent(new CustomEvent(PROFILE_CHANGE_EVENT, {
      detail
    }));
  }

  function dispatchProfileUpdate(detail) {
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATE_EVENT, {
      detail
    }));
  }

  const PROFILE_SCOPED_STORAGE_ACCESSORS = {
    [STORAGE_KEYS.selectedLevel]: {
      get(profile) {
        return profile.settings.selectedLevel;
      },
      set(profile, value) {
        profile.settings.selectedLevel = normalizeLevelId(value);
      }
    },
    [STORAGE_KEYS.selectedMode]: {
      get(profile) {
        return profile.settings.selectedMode;
      },
      set(profile, value) {
        profile.settings.selectedMode = normalizeModeId(value);
      }
    },
    [STORAGE_KEYS.statsByModeAndLevel]: {
      get(profile) {
        return profile.practice.statsByModeAndLevel;
      },
      set(profile, value) {
        profile.practice.statsByModeAndLevel = createModeBucket(value);
      }
    },
    [STORAGE_KEYS.wrongWordsByModeAndLevel]: {
      get(profile) {
        return profile.practice.wrongWordsByModeAndLevel;
      },
      set(profile, value) {
        profile.practice.wrongWordsByModeAndLevel = createModeBucket(value);
      }
    },
    [STORAGE_KEYS.stageProgressByModeAndLevel]: {
      get(profile) {
        return profile.stage.progressByModeAndLevel;
      },
      set(profile, value) {
        profile.stage.progressByModeAndLevel = createModeBucket(value);
      }
    },
    [STORAGE_KEYS.stageStatsByModeAndLevel]: {
      get(profile) {
        return profile.stage.statsByModeAndLevel;
      },
      set(profile, value) {
        profile.stage.statsByModeAndLevel = createModeBucket(value);
      }
    },
    [STORAGE_KEYS.survivalStatsByModeAndLevel]: {
      get(profile) {
        return profile.survival.statsByModeAndLevel;
      },
      set(profile, value) {
        profile.survival.statsByModeAndLevel = createModeBucket(value);
      }
    },
    [STORAGE_KEYS.survivalWrongWordsByModeAndLevel]: {
      get(profile) {
        return profile.survival.wrongWordsByModeAndLevel;
      },
      set(profile, value) {
        profile.survival.wrongWordsByModeAndLevel = createModeBucket(value);
      }
    }
  };

  function readProfileScopedStorage(key) {
    const accessors = PROFILE_SCOPED_STORAGE_ACCESSORS[key];

    if (!accessors) {
      return { found: false };
    }

    const store = ensureProfileStore();
    const currentProfile = store.profiles[store.currentProfileId];
    return {
      found: true,
      value: cloneValue(accessors.get(currentProfile))
    };
  }

  function writeProfileScopedStorage(key, value) {
    const accessors = PROFILE_SCOPED_STORAGE_ACCESSORS[key];

    if (!accessors) {
      return false;
    }

    const store = ensureProfileStore();
    const currentProfile = store.profiles[store.currentProfileId];
    accessors.set(currentProfile, cloneValue(value));
    currentProfile.lastActiveAt = getNowTimestamp();
    saveProfileStore(store);
    return true;
  }

  function getReplacementProfileId(store, profileId) {
    const profiles = listProfilesFromStore(store);
    const currentIndex = profiles.findIndex((profile) => profile.id === profileId);

    if (currentIndex === -1) {
      return profiles[0] ? profiles[0].id : null;
    }

    return profiles[currentIndex + 1]
      ? profiles[currentIndex + 1].id
      : profiles[currentIndex - 1]
        ? profiles[currentIndex - 1].id
        : null;
  }

  function getProfileStore() {
    return cloneValue(ensureProfileStore());
  }

  function getCurrentProfileId() {
    return ensureProfileStore().currentProfileId;
  }

  function getCurrentProfile() {
    const store = ensureProfileStore();
    return cloneValue(store.profiles[store.currentProfileId]);
  }

  function listProfiles() {
    const store = ensureProfileStore();
    return cloneValue(listProfilesFromStore(store));
  }

  function createProfile(name) {
    const normalizedName = normalizeProfileName(name, "");

    if (!normalizedName) {
      throw new Error("档案名称不能为空。");
    }

    const store = ensureProfileStore();
    const profile = createEmptyProfile(normalizedName);
    store.profiles[profile.id] = profile;
    saveProfileStore(store);
    return cloneValue(profile);
  }

  function renameProfile(profileId, name) {
    const normalizedName = normalizeProfileName(name, "");

    if (!normalizedName) {
      throw new Error("档案名称不能为空。");
    }

    const store = ensureProfileStore();
    const profile = store.profiles[profileId];

    if (!profile) {
      throw new Error("未找到要重命名的档案。");
    }

    const previousName = profile.name;
    profile.name = normalizedName;
    const savedStore = saveProfileStore(store);

    if (savedStore.currentProfileId === profileId) {
      dispatchProfileUpdate({
        reason: "rename",
        profileId,
        previousName,
        name: normalizedName
      });
    }

    return cloneValue(profile);
  }

  function touchProfile(profileId = getCurrentProfileId()) {
    const store = ensureProfileStore();
    const profile = store.profiles[profileId];

    if (!profile) {
      throw new Error("未找到要更新最近使用时间的档案。");
    }

    profile.lastActiveAt = getNowTimestamp();
    saveProfileStore(store);
    return cloneValue(profile);
  }

  function isLastRemainingProfile(profileId) {
    const store = ensureProfileStore();
    const profileIds = Object.keys(store.profiles);

    if (profileIds.length !== 1) {
      return false;
    }

    if (!profileId) {
      return true;
    }

    return profileIds[0] === profileId;
  }

  function switchProfile(profileId) {
    const store = ensureProfileStore();
    const targetProfile = store.profiles[profileId];

    if (!targetProfile) {
      throw new Error("未找到要切换的档案。");
    }

    const previousProfileId = store.currentProfileId;

    if (previousProfileId === profileId) {
      return touchProfile(profileId);
    }

    store.currentProfileId = profileId;
    store.profiles[profileId].lastActiveAt = getNowTimestamp();
    const savedStore = saveProfileStore(store);
    dispatchProfileChange({
      reason: "switch",
      previousProfileId,
      profileId: savedStore.currentProfileId
    });
    return cloneValue(savedStore.profiles[savedStore.currentProfileId]);
  }

  function resetProfile(profileId) {
    const store = ensureProfileStore();
    const profile = store.profiles[profileId];

    if (!profile) {
      throw new Error("未找到要重置的档案。");
    }

    store.profiles[profileId] = createEmptyProfile(profile.name, {
      id: profile.id,
      createdAt: profile.createdAt,
      lastActiveAt: getNowTimestamp()
    });

    const savedStore = saveProfileStore(store);

    if (profileId === savedStore.currentProfileId) {
      dispatchProfileChange({
        reason: "reset",
        previousProfileId: profileId,
        profileId
      });
    }

    return cloneValue(savedStore.profiles[profileId]);
  }

  function deleteProfile(profileId) {
    const store = ensureProfileStore();
    const profile = store.profiles[profileId];

    if (!profile) {
      throw new Error("未找到要删除的档案。");
    }

    if (isLastRemainingProfile(profileId)) {
      throw new Error("最后一个档案不能删除，请改用重置档案。");
    }

    const wasCurrent = store.currentProfileId === profileId;
    const nextProfileId = wasCurrent ? getReplacementProfileId(store, profileId) : store.currentProfileId;

    if (wasCurrent && !nextProfileId) {
      throw new Error("删除当前档案失败，未找到可切换的替代档案。");
    }

    delete store.profiles[profileId];

    if (wasCurrent) {
      store.currentProfileId = nextProfileId;
      store.profiles[nextProfileId].lastActiveAt = getNowTimestamp();
    }

    const savedStore = saveProfileStore(store);

    if (wasCurrent) {
      dispatchProfileChange({
        reason: "delete",
        previousProfileId: profileId,
        profileId: savedStore.currentProfileId,
        deletedProfileId: profileId
      });
    }

    return {
      deletedProfileId: profileId,
      currentProfileId: savedStore.currentProfileId
    };
  }

  function formatDateTime(value) {
    if (!isValidTimestamp(value)) {
      return "暂无";
    }

    return new Date(value).toLocaleString("zh-CN", {
      hour12: false
    });
  }

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
   * 从 localStorage 或当前档案读取 JSON 数据，并在异常时返回兜底值。
   */
  function readJsonStorage(key, fallback) {
    const scopedValue = readProfileScopedStorage(key);

    if (scopedValue.found) {
      return scopedValue.value;
    }

    return readRawJsonStorage(key, fallback);
  }

  /**
   * 把对象序列化后写入 localStorage，或写回当前档案。
   */
  function writeJsonStorage(key, value) {
    if (writeProfileScopedStorage(key, value)) {
      return;
    }

    writeRawJsonStorage(key, value);
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
   * 读取当前档案保存的级别设置，不合法时回退到默认级别。
   */
  function getStoredLevel() {
    return normalizeLevelId(getCurrentProfile().settings.selectedLevel);
  }

  /**
   * 读取当前档案保存的玩法设置，不合法时回退到默认玩法。
   */
  function getStoredMode(modeOptions) {
    const storedMode = normalizeModeId(getCurrentProfile().settings.selectedMode);
    return Array.isArray(modeOptions) && modeOptions.some((option) => option.id === storedMode) ? storedMode : DEFAULT_MODE;
  }

  /**
   * 持久化当前档案选中的级别。
   */
  function persistSelectedLevel(levelId) {
    writeProfileScopedStorage(STORAGE_KEYS.selectedLevel, levelId);
  }

  /**
   * 持久化当前档案选中的玩法。
   */
  function persistSelectedMode(modeId) {
    writeProfileScopedStorage(STORAGE_KEYS.selectedMode, modeId);
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
    PROFILE_STORE_VERSION,
    PROFILE_CHANGE_EVENT,
    PROFILE_UPDATE_EVENT,
    PROFILE_SWITCH_REQUEST_EVENT,
    DEFAULT_LEVEL,
    DEFAULT_MODE,
    DEFAULT_PROFILE_NAME,
    STAGE_CONFIG,
    SURVIVAL_CONFIG,
    LEVEL_OPTIONS,
    WORD_BANK,
    shuffle,
    escapeHtml,
    formatTime,
    formatDateTime,
    readJsonStorage,
    writeJsonStorage,
    createModeBucket,
    createEmptyProfile,
    getProfileStore,
    getCurrentProfileId,
    getCurrentProfile,
    listProfiles,
    createProfile,
    renameProfile,
    deleteProfile,
    resetProfile,
    switchProfile,
    isLastRemainingProfile,
    touchProfile,
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
