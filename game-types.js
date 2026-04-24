(function () {
  const shared = window.GameShared;

  if (!shared) {
    return;
  }

  const {
    STORAGE_KEYS,
    STAGE_CONFIG,
    SURVIVAL_CONFIG,
    shuffle,
    escapeHtml,
    formatTime,
    getWordsForLevel,
    createMeaningQuestion,
    getSavedStatsMap,
    getSavedWrongWordMap,
    writeJsonStorage,
    getSavedSurvivalStatsMap,
    getSavedSurvivalWrongWordMap,
    getSurvivalStats
  } = shared;

  const PRACTICE_HOME_META = {
    meaning: {
      homeTitle: "10 题一局，按你的水平练词义",
      homeCopy: "先在设置里选择英语级别，再开始练习。系统会按当前级别切换词库，尽量避免超纲。",
      startLabel: "开始练习",
      primaryStatLabel: "最高分",
      reviewEmpty: "当前级别下还没有错词记录，直接开始第一局吧。",
      tips: [
        { title: "1. 每局 10 题", copy: "整局限时，适合反复重开刷熟练度。" },
        { title: "2. 连击会加分", copy: "连续答对越多，奖励越高，但单次失误不致命。" },
        { title: "3. 错词会回顾", copy: "局后会展示答错的词，帮助你马上复习。" }
      ],
      gameTitle: "正在练习",
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

  const registry = {};

  function registerGameType(gameType) {
    if (!gameType || typeof gameType.id !== "string") {
      throw new Error("Invalid game type definition.");
    }

    registry[gameType.id] = gameType;
    return gameType;
  }

  function getGameType(id) {
    return registry[id] || null;
  }

  function mustGetGameType(id) {
    const gameType = getGameType(id);

    if (!gameType) {
      throw new Error(`Unknown game type: ${id}`);
    }

    return gameType;
  }

  function getSupportedTypes(engineId) {
    return Object.values(registry).filter((gameType) => {
      return !Array.isArray(gameType.supportedEngines) || gameType.supportedEngines.includes(engineId);
    });
  }

  function getAccuracy(correctCount, answeredCount) {
    if (answeredCount === 0) {
      return 0;
    }

    return Math.round((correctCount / answeredCount) * 100);
  }

  function buildDictationItems(words) {
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

  function normalizeWordAnswer(value) {
    return value.trim().toLowerCase();
  }

  function renderReviewList(reviewList, emptyNode, words, createReviewItem) {
    reviewList.innerHTML = "";

    if (words.length === 0) {
      emptyNode.classList.remove("is-hidden");
      return;
    }

    emptyNode.classList.add("is-hidden");
    words.forEach((word) => {
      reviewList.appendChild(createReviewItem(word));
    });
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

  function getMeaningRematchSummary(accuracy) {
    if (accuracy === 100) {
      return "这轮错题再战已经全部纠正，刚才的薄弱点补得很及时。";
    }

    if (accuracy >= 60) {
      return "这轮错题再战有进步，还剩下少量词需要再过一遍。";
    }

    return "这轮错题再战说明这些词还不够稳，再练一次会更有效。";
  }

  function getDictationRematchSummary(accuracy) {
    if (accuracy === 100) {
      return "这轮错题听写已经全部写对，拼写修正得很到位。";
    }

    if (accuracy >= 60) {
      return "这轮错题听写已经追回来一部分，剩下的再巩固一次会更稳。";
    }

    return "这些错词的拼写还需要继续强化，建议再战一次或回顾后再练。";
  }

  function getDictationPlaybackTag(state, config) {
    if (state.dictationPlaybackStatus === "ready") {
      return "可提交";
    }

    if (state.dictationPlaybackStatus === "error") {
      return "播放失败";
    }

    return `播放 ${state.dictationPlaybackCount} / ${config.playbackRepeats}`;
  }

  function getDictationPlaybackStatusText(context) {
    const { state, config, helpers } = context;
    const unavailableReason = helpers.getDictationUnavailableReason();

    if (unavailableReason) {
      return unavailableReason;
    }

    if (state.dictationPlaybackStatus === "speaking") {
      return `第 ${state.dictationPlaybackCount} / ${config.playbackRepeats} 遍播放中，请边听边输入。`;
    }

    if (state.dictationPlaybackStatus === "waiting") {
      return `已播放 ${state.dictationPlaybackCount} / ${config.playbackRepeats} 遍，5 秒后自动播放下一遍。`;
    }

    if (state.dictationPlaybackStatus === "ready") {
      return `三遍播放已结束，请在 ${state.dictationSubmitSecondsLeft} 秒内提交答案。`;
    }

    if (state.dictationPlaybackStatus === "error") {
      return `语音播放失败，请在 ${state.dictationSubmitSecondsLeft} 秒内决定是否提交。`;
    }

    return "准备播放，请稍候。";
  }

  function updateDictationControls(context) {
    const { state, elements, helpers } = context;
    const shouldDisableInput = state.lockInput || state.roundFinished || !helpers.isDictationAvailable();
    const shouldDisableSubmit = shouldDisableInput || !state.dictationReadyForSubmit;
    const supportMessage = helpers.getDictationUnavailableReason() || helpers.getDictationWarning();

    elements.difficultyTag.textContent = getDictationPlaybackTag(state, context.config);
    elements.dictationStatus.textContent = getDictationPlaybackStatusText(context);
    elements.dictationInput.disabled = shouldDisableInput;
    elements.submitDictationButton.disabled = shouldDisableSubmit;
    elements.dictationSupportNote.textContent = supportMessage;
    elements.dictationSupportNote.classList.toggle("is-hidden", !supportMessage);
  }

  const meaningType = registerGameType({
    id: "meaning",
    label: "词义选择",
    supportedEngines: ["practice", "stage", "survival"],
    practice: {
      getHomeMeta() {
        return PRACTICE_HOME_META.meaning;
      },
      getHomeSupportState() {
        return {
          noteText: "",
          disableStartButton: false
        };
      },
      formatHomePrimaryStat({ stats }) {
        return String(stats.bestScore);
      },
      canStartRound() {
        return true;
      },
      buildRound({ levelId, config }) {
        const levelWords = getWordsForLevel(levelId);
        const roundSize = Math.min(config.questionsPerRound, levelWords.length);

        return shuffle(levelWords)
          .slice(0, roundSize)
          .map((word) => createMeaningQuestion(word, levelWords));
      },
      buildRematchRound({ words, levelId }) {
        const levelWords = getWordsForLevel(levelId);

        return shuffle(words).map((word) => {
          return createMeaningQuestion(word, levelWords, {
            distractorPool: levelWords,
            excludedOptions: word.sourceOptions
          });
        });
      },
      prepareRoundState({ state, config }) {
        state.lives = config.startingLives;
        state.timeLeft = config.totalTimeSeconds;
      },
      getDefaultFeedback() {
        return PRACTICE_HOME_META.meaning.defaultFeedback;
      },
      updateStatusBar({ state, elements, helpers }) {
        elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
        elements.statusLabel1.textContent = "时间";
        elements.timerValue.textContent = formatTime(state.timeLeft);
        elements.statusLabel2.textContent = "分数";
        elements.scoreValue.textContent = String(state.score);
        elements.statusLabel3.textContent = "生命";
        elements.livesValue.textContent = String(state.lives);
        elements.statusLabel4.textContent = "连击";
        elements.comboValue.textContent = String(state.combo);
        helpers.updateDictationChrome(false);
      },
      renderQuestion({ state, elements, helpers }) {
        const currentQuestion = state.questions[state.currentIndex];

        elements.gameTitle.textContent = state.roundKind === "rematch" ? "错题再战" : PRACTICE_HOME_META.meaning.gameTitle;
        elements.promptLabel.textContent = PRACTICE_HOME_META.meaning.promptLabel;
        elements.posTag.textContent = currentQuestion.partOfSpeech;
        elements.difficultyTag.textContent = helpers.getDifficultyLabel(currentQuestion.difficulty);
        elements.questionWord.textContent = currentQuestion.word;
        elements.questionPhonetic.textContent = currentQuestion.phonetic || "";
        elements.questionPhonetic.classList.remove("is-hidden");
        elements.questionHint.textContent = PRACTICE_HOME_META.meaning.hint;
        elements.questionPanel.classList.remove("is-dictation");
        elements.optionsGrid.classList.remove("is-hidden");
        elements.optionsGrid.innerHTML = "";

        currentQuestion.options.forEach((option, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "option-button";
          button.dataset.option = option;
          button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
          button.addEventListener("click", () => helpers.handlePrimaryAction({ selectedOption: option }));
          elements.optionsGrid.appendChild(button);
        });

        helpers.clearFeedback();
        helpers.updateStatusBar();
      },
      handleAnswer({ state, elements, config, helpers }, payload = {}) {
        if (state.lockInput || state.roundFinished) {
          return;
        }

        const selectedOption = payload.selectedOption;
        const currentQuestion = state.questions[state.currentIndex];
        const isCorrect = selectedOption === currentQuestion.meaning;

        state.lockInput = true;
        state.answeredCount += 1;
        helpers.setOptionStates(selectedOption, currentQuestion.meaning);

        if (isCorrect) {
          state.correctCount += 1;
          state.combo += 1;
          state.bestCombo = Math.max(state.bestCombo, state.combo);
          state.score += config.baseScore + helpers.getComboBonus(state.combo);
          elements.feedbackBox.className = "feedback-box is-success";
          elements.feedbackBox.textContent = `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
        } else {
          state.combo = 0;
          state.lives -= 1;
          helpers.addWrongWord(currentQuestion, { sourceOptions: currentQuestion.options });
          elements.feedbackBox.className = "feedback-box is-error";
          elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
        }

        helpers.updateStatusBar();
        helpers.clearFeedbackTimeout();
        state.feedbackTimeoutId = window.setTimeout(() => {
          helpers.moveToNextQuestion();
        }, config.feedbackDelayMs);
      },
      moveToNextQuestion({ state, helpers }) {
        if (state.roundFinished) {
          return;
        }

        if (state.lives <= 0 || state.currentIndex >= state.questions.length - 1) {
          helpers.endGame();
          return;
        }

        state.currentIndex += 1;
        state.lockInput = false;
        helpers.renderQuestion();
      },
      renderResult({ state, elements, helpers }) {
        const accuracy = getAccuracy(state.correctCount, state.answeredCount);
        const isRematchRound = state.roundKind === "rematch";

        elements.resultTitle.textContent = isRematchRound ? "错题再战结算" : "本局结算";
        elements.resultLabel1.textContent = "最终得分";
        elements.resultScore.textContent = String(state.score);
        elements.resultLabel2.textContent = "答对题数";
        elements.resultCorrect.textContent = `${state.correctCount} / ${state.answeredCount}`;
        elements.resultLabel3.textContent = "正确率";
        elements.resultAccuracy.textContent = `${accuracy}%`;
        elements.resultLabel4.textContent = "最高连击";
        elements.resultBestCombo.textContent = String(state.bestCombo);
        elements.resultSummary.textContent = isRematchRound
          ? getMeaningRematchSummary(accuracy)
          : getMeaningResultSummary(accuracy);
        elements.resultReviewEmpty.textContent = isRematchRound
          ? "这一轮错题再战已经全部纠正，表现不错。"
          : "这一局没有错词，表现不错。";
        elements.playAgainButton.textContent = "再来一局";
        elements.rematchButton.textContent = isRematchRound ? "继续错题再战" : "错题再战";
        elements.rematchButton.classList.toggle("is-hidden", state.wrongWords.length === 0);
        elements.wrongCount.textContent = `${state.wrongWords.length} 个`;
        renderReviewList(elements.resultReviewList, elements.resultReviewEmpty, state.wrongWords, helpers.createReviewItem);
      },
      saveStats({ state, levelId }) {
        if (state.roundKind === "rematch") {
          return;
        }

        const accuracy = getAccuracy(state.correctCount, state.answeredCount);
        const statsMap = getSavedStatsMap();
        const wrongWordMap = getSavedWrongWordMap();
        const currentStats = statsMap.meaning[levelId] || { bestScore: 0, latestAccuracy: 0 };

        statsMap.meaning[levelId] = {
          bestScore: Math.max(state.score, currentStats.bestScore),
          latestAccuracy: accuracy
        };
        wrongWordMap.meaning[levelId] = state.wrongWords.map((word) => word.id);

        writeJsonStorage(STORAGE_KEYS.statsByModeAndLevel, statsMap);
        writeJsonStorage(STORAGE_KEYS.wrongWordsByModeAndLevel, wrongWordMap);
      },
      startRoundEffects({ helpers }) {
        helpers.startTimer();
      },
      stopEffects({ helpers }) {
        helpers.stopTimer();
      },
      handleKeydown({ elements }, event) {
        const number = Number(event.key);

        if (number < 1 || number > 4) {
          return;
        }

        const button = elements.optionsGrid.querySelectorAll(".option-button")[number - 1];

        if (button) {
          button.click();
        }
      }
    },
    stage: {
      config: STAGE_CONFIG.meaning,
      getDefaultFeedback() {
        return "75 秒内完成 10 题，至少答对 9 题即可通关。";
      },
      buildRound({ words, levelId, previousOptionsByWordId = {} }) {
        const levelWords = getWordsForLevel(levelId);

        return shuffle(words).map((word) => {
          return createMeaningQuestion(word, levelWords, {
            distractorPool: levelWords,
            excludedOptions: previousOptionsByWordId[word.id]
          });
        });
      },
      updateStatusBar({ state, elements }) {
        elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
        elements.timerValue.textContent = formatTime(Math.max(state.timeLeft, 0));
        elements.scoreValue.textContent = String(state.score);
        elements.livesValue.textContent = String(state.lives);
        elements.accuracyValue.textContent = `${getAccuracy(state.correctCount, state.answeredCount)}%`;
      },
      renderQuestion({ state, elements, helpers }) {
        const currentQuestion = state.questions[state.currentIndex];

        if (!currentQuestion) {
          return;
        }

        elements.gameTitle.textContent = `第 ${state.currentStageNumber} 关`;
        elements.posTag.textContent = currentQuestion.partOfSpeech;
        elements.difficultyTag.textContent = helpers.getDifficultyLabel(currentQuestion.difficulty);
        elements.questionWord.textContent = currentQuestion.word;
        elements.questionPhonetic.textContent = currentQuestion.phonetic || "";
        elements.optionsGrid.innerHTML = "";

        currentQuestion.options.forEach((option, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "option-button";
          button.dataset.option = option;
          button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
          button.addEventListener("click", () => helpers.handlePrimaryAction({ selectedOption: option }));
          elements.optionsGrid.appendChild(button);
        });

        helpers.clearFeedback();
        helpers.updateStatusBar();
      },
      handleAnswer({ state, elements, helpers }, payload = {}) {
        if (state.lockInput || state.roundFinished) {
          return;
        }

        const currentQuestion = state.questions[state.currentIndex];
        const selectedOption = payload.selectedOption;
        const isCorrect = selectedOption === currentQuestion.meaning;

        state.lockInput = true;
        state.answeredCount += 1;
        helpers.setOptionStates(selectedOption, currentQuestion.meaning);

        if (isCorrect) {
          state.correctCount += 1;
          state.score += STAGE_CONFIG.meaning.baseScore;
          elements.feedbackBox.className = "feedback-box is-success";
          elements.feedbackBox.textContent = `答对了！${currentQuestion.word} = ${currentQuestion.meaning}`;
        } else {
          state.lives -= 1;
          helpers.addWrongWord(currentQuestion);
          elements.feedbackBox.className = "feedback-box is-error";
          elements.feedbackBox.textContent = `答错了。正确答案是「${currentQuestion.meaning}」`;
        }

        helpers.updateStatusBar();
        helpers.clearFeedbackTimeout();
        state.feedbackTimeoutId = window.setTimeout(() => {
          if (!isCorrect && state.lives <= 0) {
            helpers.endStage("lives");
            return;
          }

          helpers.moveToNextQuestion();
        }, STAGE_CONFIG.meaning.feedbackDelayMs);
      },
      handleKeydown({ elements }, event) {
        const number = Number(event.key);

        if (number < 1 || number > 4) {
          return;
        }

        const button = elements.optionsGrid.querySelectorAll(".option-button")[number - 1];

        if (button) {
          button.click();
        }
      }
    },
    survival: {
      config: SURVIVAL_CONFIG.meaning,
      getDefaultFeedback() {
        return "当前局只要答错 1 题就会结束，先稳住再冲纪录。";
      },
      buildQuestion({ word, levelWords, previousOptions }) {
        return createMeaningQuestion(word, levelWords, {
          distractorPool: levelWords,
          excludedOptions: previousOptions
        });
      },
      updateStatusBar({ state, elements, levelId }) {
        const bestStats = getSurvivalStats("meaning", levelId);

        elements.questionProgress.textContent = `第 ${state.currentIndex + 1} 题`;
        elements.scoreValue.textContent = String(state.score);
        elements.correctValue.textContent = String(state.correctCount);
        elements.bestRecordValue.textContent = String(bestStats.bestStreak);
        elements.accuracyValue.textContent = `${getAccuracy(state.correctCount, state.answeredCount)}%`;
      },
      renderQuestion({ state, elements, helpers }) {
        if (!state.currentQuestion) {
          return;
        }

        elements.gameTitle.textContent = "词义生存中";
        elements.posTag.textContent = state.currentQuestion.partOfSpeech;
        elements.difficultyTag.textContent = helpers.getDifficultyLabel(state.currentQuestion.difficulty);
        elements.questionWord.textContent = state.currentQuestion.word;
        elements.questionPhonetic.textContent = state.currentQuestion.phonetic || "";
        elements.optionsGrid.innerHTML = "";

        state.currentQuestion.options.forEach((option, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "option-button";
          button.dataset.option = option;
          button.innerHTML = `<strong>${index + 1}</strong>${escapeHtml(option)}`;
          button.addEventListener("click", () => helpers.handlePrimaryAction({ selectedOption: option }));
          elements.optionsGrid.appendChild(button);
        });

        helpers.clearFeedback();
        helpers.updateStatusBar();
      },
      handleAnswer({ state, elements, helpers }, payload = {}) {
        if (state.lockInput || state.roundFinished || !state.currentQuestion) {
          return;
        }

        const selectedOption = payload.selectedOption;
        const isCorrect = selectedOption === state.currentQuestion.meaning;

        state.lockInput = true;
        state.answeredCount += 1;
        helpers.setOptionStates(selectedOption, state.currentQuestion.meaning);

        if (isCorrect) {
          state.correctCount += 1;
          state.score += SURVIVAL_CONFIG.meaning.baseScore;
          elements.feedbackBox.className = "feedback-box is-success";
          elements.feedbackBox.textContent = `答对了！${state.currentQuestion.word} = ${state.currentQuestion.meaning}`;
          helpers.updateStatusBar();
          helpers.clearFeedbackTimeout();
          state.feedbackTimeoutId = window.setTimeout(() => {
            helpers.moveToNextQuestion();
          }, SURVIVAL_CONFIG.meaning.feedbackDelayMs);
          return;
        }

        helpers.addWrongWord(state.currentQuestion);
        elements.feedbackBox.className = "feedback-box is-error";
        elements.feedbackBox.textContent = `答错了，本局结束。正确答案是「${state.currentQuestion.meaning}」`;
        helpers.updateStatusBar();
        helpers.clearFeedbackTimeout();
        state.feedbackTimeoutId = window.setTimeout(() => {
          helpers.endGame();
        }, SURVIVAL_CONFIG.meaning.feedbackDelayMs);
      },
      renderResult({ state, elements, levelId, helpers }) {
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
          ? `新纪录！你在 ${helpers.getLevelLabel(levelId)} 级别下已经连续答对 ${result.correctCount} 题。`
          : result.correctCount >= 10
            ? `这局已经顶到 ${result.correctCount} 题，离最佳纪录还差一点，再来一局。`
            : "先把前几题答稳，再慢慢把纪录往上推。";
        elements.wrongCount.textContent = `${result.wrongWords.length} 个`;
        renderReviewList(elements.resultReviewList, elements.resultReviewEmpty, result.wrongWords, helpers.createReviewItem);
      },
      saveStats({ state, levelId }) {
        const accuracy = getAccuracy(state.correctCount, state.answeredCount);
        const statsMap = getSavedSurvivalStatsMap();
        const wrongWordMap = getSavedSurvivalWrongWordMap();
        const currentStats = getSurvivalStats("meaning", levelId);
        const bestStreak = Math.max(state.correctCount, currentStats.bestStreak);
        const bestScore = Math.max(state.score, currentStats.bestScore);

        statsMap.meaning[levelId] = {
          bestStreak,
          bestScore,
          latestAccuracy: accuracy,
          latestAnsweredCount: state.answeredCount
        };
        wrongWordMap.meaning[levelId] = state.wrongWords.map((word) => word.id);

        writeJsonStorage(STORAGE_KEYS.survivalStatsByModeAndLevel, statsMap);
        writeJsonStorage(STORAGE_KEYS.survivalWrongWordsByModeAndLevel, wrongWordMap);

        return {
          bestStreak,
          isNewRecord: state.correctCount > currentStats.bestStreak
        };
      },
      handleKeydown({ elements }, event) {
        const number = Number(event.key);

        if (number < 1 || number > 4) {
          return;
        }

        const button = elements.optionsGrid.querySelectorAll(".option-button")[number - 1];

        if (button) {
          button.click();
        }
      }
    }
  });

  registerGameType({
    id: "dictation",
    label: "听写",
    supportedEngines: ["practice"],
    practice: {
      getHomeMeta() {
        return PRACTICE_HOME_META.dictation;
      },
      getHomeSupportState({ helpers }) {
        const unavailableReason = helpers.getDictationUnavailableReason();
        const warning = helpers.getDictationWarning();

        return {
          noteText: unavailableReason || warning,
          disableStartButton: Boolean(unavailableReason)
        };
      },
      formatHomePrimaryStat({ stats, config }) {
        return `${stats.bestCorrect} / ${config.wordsPerRound}`;
      },
      canStartRound({ helpers }) {
        return helpers.isDictationAvailable();
      },
      buildRound({ levelId, config }) {
        const levelWords = getWordsForLevel(levelId);
        const roundSize = Math.min(config.wordsPerRound, levelWords.length);
        return buildDictationItems(shuffle(levelWords).slice(0, roundSize));
      },
      buildRematchRound({ words }) {
        return buildDictationItems(words);
      },
      prepareRoundState({ state, config }) {
        state.dictationPlaybackCount = 0;
        state.dictationPlaybackStatus = "idle";
        state.dictationReadyForSubmit = false;
        state.dictationSubmitSecondsLeft = config.submitWindowSeconds;
      },
      getDefaultFeedback() {
        return PRACTICE_HOME_META.dictation.defaultFeedback;
      },
      updateStatusBar(context) {
        const { state, elements, helpers } = context;

        elements.questionProgress.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 词`;
        elements.statusLabel1.textContent = "提交倒计时";
        elements.timerValue.textContent = state.dictationReadyForSubmit || state.lockInput
          ? formatTime(Math.max(state.dictationSubmitSecondsLeft, 0))
          : "--:--";
        elements.statusLabel2.textContent = "播放";
        elements.scoreValue.textContent = state.dictationPlaybackStatus === "error"
          ? "异常"
          : `${state.dictationPlaybackCount} / ${context.config.playbackRepeats}`;
        elements.statusLabel3.textContent = "答对";
        elements.livesValue.textContent = String(state.correctCount);
        elements.statusLabel4.textContent = "错误";
        elements.comboValue.textContent = String(state.wrongWords.length);
        helpers.updateDictationChrome(true);
        updateDictationControls(context);
      },
      renderQuestion({ state, elements, helpers, config }) {
        const currentQuestion = state.questions[state.currentIndex];

        elements.gameTitle.textContent = state.roundKind === "rematch" ? "错题听写再战" : PRACTICE_HOME_META.dictation.gameTitle;
        elements.promptLabel.textContent = PRACTICE_HOME_META.dictation.promptLabel;
        elements.posTag.textContent = "听写模式";
        elements.questionWord.textContent = "请写出你听到的单词";
        elements.questionPhonetic.textContent = "";
        elements.questionPhonetic.classList.add("is-hidden");
        elements.questionHint.textContent = PRACTICE_HOME_META.dictation.hint;
        elements.questionPanel.classList.add("is-dictation");
        elements.optionsGrid.classList.add("is-hidden");
        elements.optionsGrid.innerHTML = "";
        elements.dictationInput.value = "";
        elements.dictationInput.setAttribute("aria-label", `听写输入：第 ${state.currentIndex + 1} 个单词`);
        state.dictationPlaybackCount = 0;
        state.dictationPlaybackStatus = "idle";
        state.dictationReadyForSubmit = false;
        state.dictationSubmitSecondsLeft = config.submitWindowSeconds;

        helpers.clearFeedback();
        helpers.updateStatusBar();

        if (currentQuestion) {
          helpers.startDictationPlayback(currentQuestion.word);
          helpers.focusDictationInput();
        }
      },
      handleAnswer({ state, elements, helpers }, payload = {}) {
        if (state.lockInput || state.roundFinished || !state.dictationReadyForSubmit) {
          return;
        }

        const auto = Boolean(payload.auto);
        const currentQuestion = state.questions[state.currentIndex];
        const userAnswer = elements.dictationInput.value;
        const trimmedAnswer = userAnswer.trim();
        const isCorrect = normalizeWordAnswer(userAnswer) === normalizeWordAnswer(currentQuestion.word);

        helpers.stopDictationSubmitTimer();
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
          helpers.addWrongWord(currentQuestion, { userAnswer: trimmedAnswer || "（未填写）" });
          elements.feedbackBox.className = "feedback-box is-error";
          elements.feedbackBox.textContent = auto
            ? `30 秒已到，系统已自动提交。正确答案是 ${currentQuestion.word}（${currentQuestion.meaning}）`
            : `拼写不对。正确答案是 ${currentQuestion.word}（${currentQuestion.meaning}）`;
        }

        elements.dictationInput.disabled = true;
        elements.submitDictationButton.disabled = true;
        helpers.updateStatusBar();
        helpers.clearFeedbackTimeout();
        state.feedbackTimeoutId = window.setTimeout(() => {
          helpers.moveToNextQuestion();
        }, helpers.getDictationFeedbackDelayMs());
      },
      moveToNextQuestion({ state, helpers }) {
        if (state.roundFinished) {
          return;
        }

        if (state.currentIndex >= state.questions.length - 1) {
          helpers.endGame();
          return;
        }

        state.currentIndex += 1;
        state.lockInput = false;
        helpers.renderQuestion();
      },
      renderResult({ state, elements, helpers }) {
        const accuracy = getAccuracy(state.correctCount, state.answeredCount);
        const isRematchRound = state.roundKind === "rematch";

        elements.resultTitle.textContent = isRematchRound ? "错题听写再战结算" : "听写结算";
        elements.resultLabel1.textContent = "本局答对";
        elements.resultScore.textContent = String(state.correctCount);
        elements.resultLabel2.textContent = "总词数";
        elements.resultCorrect.textContent = String(state.questions.length);
        elements.resultLabel3.textContent = "正确率";
        elements.resultAccuracy.textContent = `${accuracy}%`;
        elements.resultLabel4.textContent = "错词数";
        elements.resultBestCombo.textContent = String(state.wrongWords.length);
        elements.resultSummary.textContent = isRematchRound
          ? getDictationRematchSummary(accuracy)
          : getDictationResultSummary(accuracy);
        elements.resultReviewEmpty.textContent = isRematchRound
          ? "这一轮错题听写已经全部纠正，表现很稳。"
          : "这一轮听写没有错词，表现很稳。";
        elements.playAgainButton.textContent = "再来一轮听写";
        elements.rematchButton.textContent = isRematchRound ? "继续错题再战" : "错题再战";
        elements.rematchButton.classList.toggle("is-hidden", state.wrongWords.length === 0);
        elements.wrongCount.textContent = `${state.wrongWords.length} 个`;
        renderReviewList(elements.resultReviewList, elements.resultReviewEmpty, state.wrongWords, helpers.createReviewItem);
      },
      saveStats({ state, levelId }) {
        if (state.roundKind === "rematch") {
          return;
        }

        const accuracy = getAccuracy(state.correctCount, state.answeredCount);
        const statsMap = getSavedStatsMap();
        const wrongWordMap = getSavedWrongWordMap();
        const currentStats = statsMap.dictation[levelId] || { bestCorrect: 0, latestAccuracy: 0 };

        statsMap.dictation[levelId] = {
          bestCorrect: Math.max(state.correctCount, currentStats.bestCorrect),
          latestAccuracy: accuracy
        };
        wrongWordMap.dictation[levelId] = state.wrongWords.map((word) => word.id);

        writeJsonStorage(STORAGE_KEYS.statsByModeAndLevel, statsMap);
        writeJsonStorage(STORAGE_KEYS.wrongWordsByModeAndLevel, wrongWordMap);
      },
      startRoundEffects() {},
      stopEffects({ helpers }) {
        helpers.stopDictationSubmitTimer();
        helpers.stopDictationPlayback();
      },
      handleKeydown({ helpers }, event) {
        if (event.key === "Enter") {
          event.preventDefault();
          helpers.handlePrimaryAction();
        }
      }
    }
  });

  window.GameTypeRegistry = {
    register: registerGameType,
    get: getGameType,
    mustGet: mustGetGameType,
    list() {
      return Object.values(registry);
    },
    getSupportedTypes
  };
}());
