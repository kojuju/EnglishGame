(function () {
  const shared = window.GameShared;

  if (!shared) {
    return;
  }

  const {
    escapeHtml,
    getStoredLevel,
    persistSelectedLevel,
    getLevelMeta,
    renderLevelOptions,
    setBodyScrollLock,
    getCurrentProfile,
    listProfiles,
    createProfile,
    renameProfile,
    deleteProfile,
    resetProfile,
    switchProfile,
    isLastRemainingProfile,
    formatDateTime,
    PROFILE_CHANGE_EVENT,
    PROFILE_SWITCH_REQUEST_EVENT
  } = shared;

  const NAV_ITEMS = [
    { id: "home", label: "首页", href: "index.html" },
    { id: "practice", label: "练习模式", href: "practice-mode.html" },
    { id: "stage", label: "闯关模式", href: "stage-mode.html" },
    { id: "survival", label: "生存模式", href: "survival-mode.html" }
  ];

  const DEFAULTS = {
    sidebarCopy: "从入口页了解三种玩法，再进入对应页面开始练习与挑战。",
    sidebarHint: "同一档案内的级别会在练习模式、闯关模式和生存模式之间共享；不同档案彼此隔离保存。",
    settingsCopy: "级别切换只会影响当前档案；同一档案内的练习模式、闯关模式和生存模式会同步切换到对应级别。",
    profileCopy: "在当前浏览器中管理多个本地学习档案。切换档案后，级别、统计、错词、闯关进度和生存纪录都会切到目标档案的数据视图。"
  };

  function createNoopShell() {
    return {
      setSettingsDisabled() {},
      getSelectedLevel() {
        return getStoredLevel();
      },
      syncLevel() {}
    };
  }

  function createNavMarkup(activeNav) {
    const links = NAV_ITEMS.map((item) => {
      const isActive = item.id === activeNav;
      const activeClass = isActive ? " is-active" : "";
      const currentMarkup = isActive ? ' aria-current="page"' : "";
      return `<a class="sidebar-nav-button${activeClass}" href="${item.href}"${currentMarkup}>${item.label}</a>`;
    }).join("");

    return `
      <button class="sidebar-nav-button" id="open-settings-button" type="button">设置</button>
      ${links}
    `;
  }

  function createSidebarMarkup(options, levelLabel, profileName) {
    const sidebarCopy = escapeHtml(options.sidebarCopy || DEFAULTS.sidebarCopy);
    const sidebarHint = escapeHtml(options.sidebarHint || DEFAULTS.sidebarHint);

    return `
      <aside class="sidebar card">
        <div class="sidebar-brand">
          <p class="eyebrow">English Game MVP</p>
          <h1><a class="brand-link" href="index.html">英语分级闯关小游戏</a></h1>
          <p class="sidebar-copy">${sidebarCopy}</p>
        </div>

        <div class="sidebar-status">
          <p class="level-chip" id="current-level-chip">当前级别：${escapeHtml(levelLabel)}</p>
          <p class="level-chip profile-chip" id="current-profile-chip">当前档案：${escapeHtml(profileName)}</p>
        </div>

        <nav class="sidebar-nav" aria-label="主导航">
          ${createNavMarkup(options.activeNav)}
        </nav>

        <div class="sidebar-meta">
          <button class="secondary-button compact-button sidebar-meta-button" id="open-profile-manager-button" type="button">管理档案</button>
          <p class="sidebar-hint">${sidebarHint}</p>
        </div>
      </aside>
    `;
  }

  function createSettingsMarkup(options) {
    const settingsCopy = escapeHtml(options.settingsCopy || DEFAULTS.settingsCopy);

    return `
      <section class="modal-backdrop is-hidden" id="settings-modal" aria-hidden="true">
        <div class="modal-card card" role="dialog" aria-modal="true" aria-labelledby="settings-title">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Settings</p>
              <h2 id="settings-title">选择英语级别</h2>
            </div>
            <button class="icon-button" id="close-settings-button" type="button" aria-label="关闭设置">×</button>
          </div>
          <p class="modal-copy">${settingsCopy}</p>
          <div class="level-options" id="level-options"></div>
          <div class="action-row modal-actions">
            <button class="primary-button" id="save-settings-button" type="button">保存设置</button>
            <button class="secondary-button" id="cancel-settings-button" type="button">取消</button>
          </div>
        </div>
      </section>
    `;
  }

  function createProfileModalMarkup(options) {
    const profileCopy = escapeHtml(options.profileCopy || DEFAULTS.profileCopy);

    return `
      <section class="modal-backdrop is-hidden" id="profile-modal" aria-hidden="true">
        <div class="modal-card card profile-modal-card" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Profiles</p>
              <h2 id="profile-title">管理本地档案</h2>
            </div>
            <button class="icon-button" id="close-profile-button" type="button" aria-label="关闭档案管理">×</button>
          </div>
          <p class="modal-copy">${profileCopy}</p>
          <div class="profile-modal-feedback is-hidden" id="profile-modal-feedback" aria-live="polite"></div>
          <div class="profile-modal-body">
            <section class="profile-panel profile-summary-panel">
              <div class="panel-header">
                <div>
                  <h3>当前档案摘要</h3>
                  <p class="panel-copy">当前页面展示和长期学习数据都归属于这里。</p>
                </div>
              </div>
              <div id="profile-summary-slot"></div>
            </section>

            <section class="profile-panel">
              <div class="panel-header">
                <div>
                  <h3>档案列表</h3>
                  <p class="panel-copy">先选中一个档案，再执行切换、重命名、删除或重置。</p>
                </div>
              </div>
              <div class="profile-list" id="profile-list"></div>
            </section>

            <section class="profile-panel">
              <div class="panel-header">
                <div>
                  <h3>选中档案操作</h3>
                  <p class="panel-copy">删除与重置属于危险操作，会要求你再次确认。</p>
                </div>
              </div>
              <div id="profile-actions-slot"></div>
            </section>

            <section class="profile-panel">
              <div class="panel-header">
                <div>
                  <h3>新建档案</h3>
                  <p class="panel-copy">新档案会从默认级别和空白学习数据开始，不继承其他档案的统计与进度。</p>
                </div>
              </div>
              <div class="profile-create-row">
                <input class="profile-name-input" id="create-profile-input" type="text" maxlength="24" autocomplete="off" placeholder="输入新档案名称">
                <button class="primary-button" id="create-profile-button" type="button">创建档案</button>
              </div>
            </section>
          </div>
        </div>
      </section>
    `;
  }

  function mountShell(options = {}) {
    const sidebarSlot = document.getElementById("shared-sidebar-slot");
    const settingsSlot = document.getElementById("shared-settings-slot");

    if (!sidebarSlot || !settingsSlot) {
      return createNoopShell();
    }

    const currentProfile = getCurrentProfile();
    const initialLevel = getStoredLevel();
    const initialLabel = getLevelMeta(initialLevel).label;
    const state = {
      selectedLevel: initialLevel,
      pendingLevel: initialLevel,
      settingsDisabled: false,
      previousFocus: null,
      activeModal: null,
      selectedProfileId: currentProfile.id,
      isRenamingProfile: false,
      renameProfileName: "",
      createProfileName: "",
      profileNotice: { type: "", text: "" }
    };

    sidebarSlot.innerHTML = createSidebarMarkup(options, initialLabel, currentProfile.name);
    settingsSlot.innerHTML = `${createSettingsMarkup(options)}${createProfileModalMarkup(options)}`;

    const elements = {
      openSettingsButton: document.getElementById("open-settings-button"),
      openProfileManagerButton: document.getElementById("open-profile-manager-button"),
      currentLevelChip: document.getElementById("current-level-chip"),
      currentProfileChip: document.getElementById("current-profile-chip"),
      settingsModal: document.getElementById("settings-modal"),
      closeSettingsButton: document.getElementById("close-settings-button"),
      cancelSettingsButton: document.getElementById("cancel-settings-button"),
      saveSettingsButton: document.getElementById("save-settings-button"),
      levelOptions: document.getElementById("level-options"),
      profileModal: document.getElementById("profile-modal"),
      closeProfileButton: document.getElementById("close-profile-button"),
      profileSummarySlot: document.getElementById("profile-summary-slot"),
      profileList: document.getElementById("profile-list"),
      profileActionsSlot: document.getElementById("profile-actions-slot"),
      createProfileInput: document.getElementById("create-profile-input"),
      createProfileButton: document.getElementById("create-profile-button"),
      profileModalFeedback: document.getElementById("profile-modal-feedback")
    };

    function getSelectedProfile(profiles) {
      return profiles.find((profile) => profile.id === state.selectedProfileId) || null;
    }

    function clearProfileNotice() {
      state.profileNotice = { type: "", text: "" };
    }

    function setProfileNotice(text, type = "error") {
      state.profileNotice = { type, text };
      renderProfileFeedback();
    }

    function renderProfileFeedback() {
      const hasText = Boolean(state.profileNotice.text);
      elements.profileModalFeedback.className = `profile-modal-feedback${hasText ? ` is-${state.profileNotice.type || "info"}` : ""}${hasText ? "" : " is-hidden"}`;
      elements.profileModalFeedback.textContent = hasText ? state.profileNotice.text : "";
    }

    function updateLevelChip(levelId) {
      const levelMeta = getLevelMeta(levelId);
      elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
    }

    function updateProfileChip(profile) {
      elements.currentProfileChip.textContent = `当前档案：${profile.name}`;
    }

    function syncSidebarMeta() {
      const profile = getCurrentProfile();
      state.selectedLevel = getStoredLevel();

      if (state.activeModal !== "settings") {
        state.pendingLevel = state.selectedLevel;
      }

      updateLevelChip(state.selectedLevel);
      updateProfileChip(profile);
    }

    function rerenderLevelOptions() {
      renderLevelOptions(elements.levelOptions, state.pendingLevel, (levelId) => {
        state.pendingLevel = levelId;
        rerenderLevelOptions();
      });
    }

    function syncSelectedProfile(preserveSelection = true) {
      const profiles = listProfiles();
      const current = getCurrentProfile();

      if (!preserveSelection || !profiles.some((profile) => profile.id === state.selectedProfileId)) {
        state.selectedProfileId = current.id;
        state.isRenamingProfile = false;
        state.renameProfileName = "";
      }
    }

    function renderProfileSummary(current) {
      const levelLabel = getLevelMeta(current.settings.selectedLevel).label;
      elements.profileSummarySlot.innerHTML = `
        <div class="profile-summary-grid">
          <article class="stat-card">
            <span class="stat-label">当前档案</span>
            <strong class="stat-value profile-summary-value">${escapeHtml(current.name)}</strong>
          </article>
          <article class="stat-card">
            <span class="stat-label">当前级别</span>
            <strong class="stat-value profile-summary-value">${escapeHtml(levelLabel)}</strong>
          </article>
          <article class="stat-card">
            <span class="stat-label">最近使用</span>
            <strong class="stat-value profile-summary-value">${escapeHtml(formatDateTime(current.lastActiveAt))}</strong>
          </article>
        </div>
      `;
    }

    function renderProfileList(profiles, currentProfileId) {
      elements.profileList.innerHTML = "";

      profiles.forEach((profile) => {
        const button = document.createElement("button");
        const isSelected = profile.id === state.selectedProfileId;
        const isCurrent = profile.id === currentProfileId;

        button.type = "button";
        button.className = `profile-list-item${isSelected ? " is-selected" : ""}${isCurrent ? " is-current" : ""}`;
        button.innerHTML = `
          <div class="profile-list-header">
            <strong>${escapeHtml(profile.name)}</strong>
            <span class="profile-list-tags">
              ${isCurrent ? '<span class="profile-pill">当前档案</span>' : ""}
              ${isSelected ? '<span class="profile-pill is-selected">已选中</span>' : ""}
            </span>
          </div>
          <p class="profile-list-meta">最近使用：${escapeHtml(formatDateTime(profile.lastActiveAt))}</p>
        `;
        button.addEventListener("click", () => {
          state.selectedProfileId = profile.id;
          state.isRenamingProfile = false;
          state.renameProfileName = "";
          clearProfileNotice();
          renderProfileModalContent();
        });
        elements.profileList.appendChild(button);
      });
    }

    function requestProfileAction(request) {
      const detail = {
        ...request,
        handled: false
      };

      window.dispatchEvent(new CustomEvent(PROFILE_SWITCH_REQUEST_EVENT, {
        detail
      }));

      if (!detail.handled && typeof detail.execute === "function") {
        detail.execute();
      }
    }

    function handleGuardedAction(request) {
      clearProfileNotice();

      try {
        requestProfileAction(request);
      } catch (error) {
        setProfileNotice(error.message || "档案操作失败。");
      }
    }

    function handleCreateProfile() {
      clearProfileNotice();

      try {
        const profile = createProfile(elements.createProfileInput.value);
        state.selectedProfileId = profile.id;
        state.createProfileName = "";
        elements.createProfileInput.value = "";
        renderProfileModalContent();
        setProfileNotice(`已创建档案「${profile.name}」。`, "success");
      } catch (error) {
        setProfileNotice(error.message || "创建档案失败。");
      }
    }

    function handleRenameProfile(profile) {
      clearProfileNotice();

      try {
        const renamed = renameProfile(profile.id, state.renameProfileName);
        state.isRenamingProfile = false;
        state.renameProfileName = "";
        syncSidebarMeta();
        renderProfileModalContent();
        setProfileNotice(`已将档案重命名为「${renamed.name}」。`, "success");
      } catch (error) {
        setProfileNotice(error.message || "重命名档案失败。");
      }
    }

    function handleDeleteProfile(profile, isCurrent) {
      const actionLabel = isCurrent ? "删除当前档案后会切换到其他档案，确定继续吗？" : `确定删除档案「${profile.name}」吗？`;

      if (!window.confirm(actionLabel)) {
        return;
      }

      if (isCurrent) {
        handleGuardedAction({
          type: "delete-current-profile",
          profileId: profile.id,
          execute() {
            closeProfileModal(false);
            deleteProfile(profile.id);
          }
        });
        return;
      }

      clearProfileNotice();

      try {
        deleteProfile(profile.id);
        syncSelectedProfile(false);
        renderProfileModalContent();
        setProfileNotice(`已删除档案「${profile.name}」。`, "success");
      } catch (error) {
        setProfileNotice(error.message || "删除档案失败。");
      }
    }

    function handleResetProfile(profile, isCurrent) {
      const confirmed = window.confirm(`确定重置档案「${profile.name}」吗？这会清空该档案的长期学习数据并恢复默认设置。`);

      if (!confirmed) {
        return;
      }

      if (isCurrent) {
        handleGuardedAction({
          type: "reset-current-profile",
          profileId: profile.id,
          execute() {
            closeProfileModal(false);
            resetProfile(profile.id);
          }
        });
        return;
      }

      clearProfileNotice();

      try {
        resetProfile(profile.id);
        renderProfileModalContent();
        setProfileNotice(`已重置档案「${profile.name}」。`, "success");
      } catch (error) {
        setProfileNotice(error.message || "重置档案失败。");
      }
    }

    function renderProfileActions(profiles, current) {
      const selected = getSelectedProfile(profiles);

      if (!selected) {
        elements.profileActionsSlot.innerHTML = '<p class="empty-state">请先在列表中选中一个档案。</p>';
        return;
      }

      const isCurrent = selected.id === current.id;
      const showReset = isLastRemainingProfile(selected.id);
      const levelLabel = getLevelMeta(selected.settings.selectedLevel).label;

      elements.profileActionsSlot.innerHTML = `
        <div class="profile-selection-card${isCurrent ? " is-current" : ""}">
          <div class="profile-selection-header">
            <strong>${escapeHtml(selected.name)}</strong>
            <span class="profile-list-tags">
              ${isCurrent ? '<span class="profile-pill">当前档案</span>' : ""}
            </span>
          </div>
          <p class="profile-list-meta">当前级别：${escapeHtml(levelLabel)} · 最近使用：${escapeHtml(formatDateTime(selected.lastActiveAt))}</p>
        </div>
        <div class="action-row profile-action-row">
          ${isCurrent ? "" : '<button class="primary-button" id="switch-profile-button" type="button">切换到此档案</button>'}
          <button class="secondary-button" id="rename-profile-button" type="button">${state.isRenamingProfile ? "重新编辑名称" : "重命名档案"}</button>
          <button class="secondary-button danger-button" id="danger-profile-button" type="button">${showReset ? "重置档案" : "删除档案"}</button>
        </div>
        ${state.isRenamingProfile ? `
          <div class="profile-rename-box">
            <label class="profile-input-label" for="rename-profile-input">新的档案名称</label>
            <div class="profile-create-row">
              <input class="profile-name-input" id="rename-profile-input" type="text" maxlength="24" autocomplete="off" value="${escapeHtml(state.renameProfileName)}">
              <button class="primary-button" id="save-rename-profile-button" type="button">保存名称</button>
            </div>
            <div class="action-row profile-action-row">
              <button class="secondary-button" id="cancel-rename-profile-button" type="button">取消</button>
            </div>
          </div>
        ` : ""}
      `;

      const switchButton = document.getElementById("switch-profile-button");
      const renameButton = document.getElementById("rename-profile-button");
      const dangerButton = document.getElementById("danger-profile-button");
      const renameInput = document.getElementById("rename-profile-input");
      const saveRenameButton = document.getElementById("save-rename-profile-button");
      const cancelRenameButton = document.getElementById("cancel-rename-profile-button");

      if (switchButton) {
        switchButton.addEventListener("click", () => {
          handleGuardedAction({
            type: "switch-profile",
            profileId: selected.id,
            execute() {
              closeProfileModal(false);
              switchProfile(selected.id);
            }
          });
        });
      }

      renameButton.addEventListener("click", () => {
        state.isRenamingProfile = true;
        state.renameProfileName = selected.name;
        clearProfileNotice();
        renderProfileModalContent();
      });

      dangerButton.addEventListener("click", () => {
        if (showReset) {
          handleResetProfile(selected, isCurrent);
          return;
        }

        handleDeleteProfile(selected, isCurrent);
      });

      if (renameInput) {
        renameInput.addEventListener("input", (event) => {
          state.renameProfileName = event.target.value;
        });
        renameInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleRenameProfile(selected);
          }
        });
        window.setTimeout(() => renameInput.focus(), 0);
      }

      if (saveRenameButton) {
        saveRenameButton.addEventListener("click", () => handleRenameProfile(selected));
      }

      if (cancelRenameButton) {
        cancelRenameButton.addEventListener("click", () => {
          state.isRenamingProfile = false;
          state.renameProfileName = "";
          clearProfileNotice();
          renderProfileModalContent();
        });
      }
    }

    function renderProfileModalContent() {
      syncSelectedProfile(true);
      const current = getCurrentProfile();
      const profiles = listProfiles();
      renderProfileSummary(current);
      renderProfileList(profiles, current.id);
      renderProfileActions(profiles, current);
      renderProfileFeedback();
      elements.createProfileInput.value = state.createProfileName;
    }

    function openModal(modalName) {
      state.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      state.activeModal = modalName;
      setBodyScrollLock(true);
    }

    function restorePreviousFocus() {
      if (state.previousFocus && typeof state.previousFocus.focus === "function" && !state.previousFocus.disabled) {
        state.previousFocus.focus();
        return;
      }

      if (!state.settingsDisabled && elements.openSettingsButton) {
        elements.openSettingsButton.focus();
      }
    }

    function closeSettingsModal(shouldRestoreFocus = true) {
      if (elements.settingsModal.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      elements.settingsModal.classList.add("is-hidden");
      elements.settingsModal.setAttribute("aria-hidden", "true");
      state.activeModal = null;
      setBodyScrollLock(false);

      if (shouldRestoreFocus) {
        restorePreviousFocus();
      }
    }

    function closeProfileModal(shouldRestoreFocus = true) {
      if (elements.profileModal.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      elements.profileModal.classList.add("is-hidden");
      elements.profileModal.setAttribute("aria-hidden", "true");
      state.activeModal = null;
      setBodyScrollLock(false);
      clearProfileNotice();

      if (shouldRestoreFocus) {
        restorePreviousFocus();
      }
    }

    function openSettingsModal() {
      if (state.settingsDisabled) {
        return;
      }

      state.pendingLevel = state.selectedLevel;
      rerenderLevelOptions();
      openModal("settings");
      elements.settingsModal.classList.remove("is-hidden");
      elements.settingsModal.setAttribute("aria-hidden", "false");
      elements.closeSettingsButton.focus();
    }

    function openProfileModal() {
      clearProfileNotice();
      syncSelectedProfile(false);
      renderProfileModalContent();
      openModal("profiles");
      elements.profileModal.classList.remove("is-hidden");
      elements.profileModal.setAttribute("aria-hidden", "false");
      elements.closeProfileButton.focus();
    }

    function applyLevelSettings() {
      const nextLevel = state.pendingLevel;
      const didChange = nextLevel !== state.selectedLevel;
      state.selectedLevel = nextLevel;
      persistSelectedLevel(nextLevel);
      updateLevelChip(nextLevel);
      closeSettingsModal();

      if (didChange) {
        window.dispatchEvent(new CustomEvent("english-game:level-change", {
          detail: { levelId: nextLevel }
        }));
      }
    }

    function setSettingsDisabled(disabled) {
      state.settingsDisabled = Boolean(disabled);
      elements.openSettingsButton.disabled = state.settingsDisabled;

      if (state.settingsDisabled && !elements.settingsModal.classList.contains("is-hidden")) {
        closeSettingsModal(false);
      }
    }

    function handleProfileChange() {
      syncSidebarMeta();
      syncSelectedProfile(false);

      if (state.activeModal === "settings") {
        state.pendingLevel = state.selectedLevel;
        rerenderLevelOptions();
      }

      if (state.activeModal === "profiles") {
        renderProfileModalContent();
      }
    }

    function handleLevelChange(event) {
      const nextLevel = event.detail && typeof event.detail.levelId === "string"
        ? event.detail.levelId
        : getStoredLevel();

      state.selectedLevel = nextLevel;

      if (state.activeModal !== "settings") {
        state.pendingLevel = nextLevel;
      }

      updateLevelChip(nextLevel);

      if (state.activeModal === "profiles") {
        renderProfileModalContent();
      }
    }

    elements.openSettingsButton.addEventListener("click", openSettingsModal);
    elements.openProfileManagerButton.addEventListener("click", openProfileModal);
    elements.closeSettingsButton.addEventListener("click", () => closeSettingsModal());
    elements.cancelSettingsButton.addEventListener("click", () => closeSettingsModal());
    elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
    elements.closeProfileButton.addEventListener("click", () => closeProfileModal());
    elements.createProfileButton.addEventListener("click", handleCreateProfile);
    elements.createProfileInput.addEventListener("input", (event) => {
      state.createProfileName = event.target.value;
    });
    elements.createProfileInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCreateProfile();
      }
    });
    elements.settingsModal.addEventListener("click", (event) => {
      if (event.target === elements.settingsModal) {
        closeSettingsModal();
      }
    });
    elements.profileModal.addEventListener("click", (event) => {
      if (event.target === elements.profileModal) {
        closeProfileModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (state.activeModal === "settings") {
        closeSettingsModal();
      } else if (state.activeModal === "profiles") {
        closeProfileModal();
      }
    });
    window.addEventListener(PROFILE_CHANGE_EVENT, handleProfileChange);
    window.addEventListener("english-game:level-change", handleLevelChange);

    syncSidebarMeta();

    return {
      setSettingsDisabled,
      getSelectedLevel() {
        return state.selectedLevel;
      },
      syncLevel(levelId) {
        state.selectedLevel = levelId;
        state.pendingLevel = levelId;
        updateLevelChip(levelId);
      }
    };
  }

  window.GameLayout = {
    NAV_ITEMS,
    mountShell
  };
}());
