const {
  getLevelMeta,
  getStoredLevel,
  getWordsForLevel
} = window.GameShared;

const entryElements = {
  levelChip: document.getElementById("entry-page-level-chip"),
  levelBadge: document.getElementById("entry-level-badge"),
  levelSummary: document.getElementById("entry-level-summary")
};

function updateEntryLevel(levelId) {
  const levelMeta = getLevelMeta(levelId);
  const wordCount = getWordsForLevel(levelId).length;

  entryElements.levelChip.textContent = `当前共享级别：${levelMeta.label}`;
  entryElements.levelBadge.textContent = `当前全局级别：${levelMeta.label}`;
  entryElements.levelSummary.textContent = `${levelMeta.label} 当前可用约 ${wordCount} 个词。进入练习、闯关或生存页面后，都会直接沿用这一套级别设置。`;
}

window.addEventListener("english-game:level-change", (event) => {
  const nextLevel = event.detail && typeof event.detail.levelId === "string"
    ? event.detail.levelId
    : getStoredLevel();
  updateEntryLevel(nextLevel);
});

updateEntryLevel(getStoredLevel());
