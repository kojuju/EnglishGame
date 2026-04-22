(function () {
  const { LEVEL_OPTIONS, STAGE_CONFIG, getWordsForLevel } = window.GameShared;
  const stageBank = {
    meaning: {},
    dictation: {}
  };

  LEVEL_OPTIONS.forEach((option) => {
    const wordIds = getWordsForLevel(option.id).map((word) => word.id);
    const stages = [];

    for (let index = 0; index < wordIds.length; index += STAGE_CONFIG.meaning.questionsPerStage) {
      const stageWordIds = wordIds.slice(index, index + STAGE_CONFIG.meaning.questionsPerStage);

      if (stageWordIds.length === STAGE_CONFIG.meaning.questionsPerStage) {
        stages.push(stageWordIds);
      }
    }

    stageBank.meaning[option.id] = stages;
    stageBank.dictation[option.id] = [];
  });

  window.STAGE_WORD_BANK = stageBank;
})();
