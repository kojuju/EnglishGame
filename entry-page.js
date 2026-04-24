const {
  PROFILE_CHANGE_EVENT,
  PROFILE_UPDATE_EVENT,
  getCurrentProfile,
  getLevelMeta,
  getStoredLevel,
  getWordsForLevel
} = window.GameShared;

const entryElements = {
  profileChip: document.getElementById("entry-page-profile-chip"),
  levelChip: document.getElementById("entry-page-level-chip"),
  profileBadge: document.getElementById("entry-profile-badge"),
  levelBadge: document.getElementById("entry-level-badge"),
  levelSummary: document.getElementById("entry-level-summary")
};

function updateEntryOverview() {
  const profile = getCurrentProfile();
  const levelId = getStoredLevel();
  const levelMeta = getLevelMeta(levelId);
  const wordCount = getWordsForLevel(levelId).length;

  entryElements.profileChip.textContent = `当前档案：${profile.name}`;
  entryElements.levelChip.textContent = `当前档案级别：${levelMeta.label}`;
  entryElements.profileBadge.textContent = `当前档案：${profile.name}`;
  entryElements.levelBadge.textContent = `当前档案级别：${levelMeta.label}`;
  entryElements.levelSummary.textContent = `${profile.name} 当前使用 ${levelMeta.label} 级别，约可用 ${wordCount} 个词。进入练习、闯关或生存页面后，都会直接沿用这一档案下的设置与学习记录。`;
}

window.addEventListener("english-game:level-change", updateEntryOverview);

window.addEventListener(PROFILE_CHANGE_EVENT, updateEntryOverview);
window.addEventListener(PROFILE_UPDATE_EVENT, updateEntryOverview);

updateEntryOverview();
