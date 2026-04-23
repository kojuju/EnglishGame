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
    setBodyScrollLock
  } = shared;

  const NAV_ITEMS = [
    { id: "home", label: "首页", href: "index.html" },
    { id: "practice", label: "练习模式", href: "practice-mode.html" },
    { id: "stage", label: "闯关模式", href: "stage-mode.html" },
    { id: "survival", label: "生存模式", href: "survival-mode.html" }
  ];

  const DEFAULTS = {
    sidebarCopy: "从入口页了解三种玩法，再进入对应页面开始练习与挑战。",
    sidebarHint: "设置中的级别会在练习模式、闯关模式和生存模式之间全局共享。",
    settingsCopy: "级别切换后，练习模式、闯关模式和生存模式都会切换到对应级别；三者的数据仍会分别保存。"
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

  function createSidebarMarkup(options, levelLabel) {
    const sidebarCopy = escapeHtml(options.sidebarCopy || DEFAULTS.sidebarCopy);
    const sidebarHint = escapeHtml(options.sidebarHint || DEFAULTS.sidebarHint);

    return `
      <aside class="sidebar card">
        <div class="sidebar-brand">
          <p class="eyebrow">English Game MVP</p>
          <h1><a class="brand-link" href="index.html">英语分级闯关小游戏</a></h1>
          <p class="sidebar-copy">${sidebarCopy}</p>
        </div>

        <nav class="sidebar-nav" aria-label="主导航">
          ${createNavMarkup(options.activeNav)}
        </nav>

        <div class="sidebar-meta">
          <p class="level-chip" id="current-level-chip">当前级别：${escapeHtml(levelLabel)}</p>
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

  function mountShell(options = {}) {
    const sidebarSlot = document.getElementById("shared-sidebar-slot");
    const settingsSlot = document.getElementById("shared-settings-slot");

    if (!sidebarSlot || !settingsSlot) {
      return createNoopShell();
    }

    const initialLevel = getStoredLevel();
    const initialLabel = getLevelMeta(initialLevel).label;
    const state = {
      selectedLevel: initialLevel,
      pendingLevel: initialLevel,
      settingsDisabled: false,
      previousFocus: null
    };

    sidebarSlot.innerHTML = createSidebarMarkup(options, initialLabel);
    settingsSlot.innerHTML = createSettingsMarkup(options);

    const elements = {
      openSettingsButton: document.getElementById("open-settings-button"),
      currentLevelChip: document.getElementById("current-level-chip"),
      settingsModal: document.getElementById("settings-modal"),
      closeSettingsButton: document.getElementById("close-settings-button"),
      cancelSettingsButton: document.getElementById("cancel-settings-button"),
      saveSettingsButton: document.getElementById("save-settings-button"),
      levelOptions: document.getElementById("level-options")
    };

    function updateLevelChip(levelId) {
      const levelMeta = getLevelMeta(levelId);
      elements.currentLevelChip.textContent = `当前级别：${levelMeta.label}`;
    }

    function rerenderLevelOptions() {
      renderLevelOptions(elements.levelOptions, state.pendingLevel, (levelId) => {
        state.pendingLevel = levelId;
        rerenderLevelOptions();
      });
    }

    function closeSettingsModal(restoreFocus = true) {
      if (elements.settingsModal.contains(document.activeElement)) {
        document.activeElement.blur();
      }

      setBodyScrollLock(false);
      elements.settingsModal.classList.add("is-hidden");
      elements.settingsModal.setAttribute("aria-hidden", "true");

      if (!restoreFocus) {
        return;
      }

      if (state.previousFocus && typeof state.previousFocus.focus === "function" && !state.previousFocus.disabled) {
        state.previousFocus.focus();
        return;
      }

      if (!state.settingsDisabled) {
        elements.openSettingsButton.focus();
      }
    }

    function openSettingsModal() {
      if (state.settingsDisabled) {
        return;
      }

      state.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      state.pendingLevel = state.selectedLevel;
      rerenderLevelOptions();
      setBodyScrollLock(true);
      elements.settingsModal.classList.remove("is-hidden");
      elements.settingsModal.setAttribute("aria-hidden", "false");
      elements.closeSettingsButton.focus();
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

    elements.openSettingsButton.addEventListener("click", openSettingsModal);
    elements.closeSettingsButton.addEventListener("click", () => closeSettingsModal());
    elements.cancelSettingsButton.addEventListener("click", () => closeSettingsModal());
    elements.saveSettingsButton.addEventListener("click", applyLevelSettings);
    elements.settingsModal.addEventListener("click", (event) => {
      if (event.target === elements.settingsModal) {
        closeSettingsModal();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!elements.settingsModal.classList.contains("is-hidden") && event.key === "Escape") {
        closeSettingsModal();
      }
    });

    updateLevelChip(state.selectedLevel);

    return {
      setSettingsDisabled,
      getSelectedLevel() {
        return state.selectedLevel;
      },
      syncLevel(levelId) {
        state.selectedLevel = levelId;
        updateLevelChip(levelId);
      }
    };
  }

  window.GameLayout = {
    NAV_ITEMS,
    mountShell
  };
}());
