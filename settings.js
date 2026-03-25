// === Settings Modal ===

const SettingsModal = (() => {
  const overlay = document.getElementById("settings-overlay");
  const closeBtn = document.getElementById("settings-close");
  const colorModeBtns = document.querySelectorAll(".color-mode-btn");
  const colsInput = document.getElementById("settings-columns");
  const exportBtn = document.getElementById("settings-export");
  const importBtn = document.getElementById("settings-import-btn");
  const importFile = document.getElementById("settings-import-file");
  const settingsGear = document.getElementById("settings-btn");

  settingsGear.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  colorModeBtns.forEach((btn) =>
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      Theme.applyColorMode(mode);
      App.updateSetting("colorMode", mode);
    }),
  );

  colsInput.addEventListener("change", () => {
    const gap = Math.min(32, Math.max(8, parseInt(colsInput.value, 10) || 16));
    colsInput.value = gap;
    Theme.applyGridGap(gap);
    App.updateSetting("gridGap", gap);
  });

  exportBtn.addEventListener("click", exportData);

  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (!file) return;
    importData(
      file,
      () => {
        App.reload();
        close();
      },
      (err) => alert("Import failed: " + err.message),
    );
    importFile.value = "";
  });

  function open() {
    const s = App.getSettings();
    colsInput.value = s.gridGap || 16;

    const currentMode = s.colorMode || "light";
    colorModeBtns.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.mode === currentMode),
    );

    overlay.classList.remove("hidden");
  }

  function close() {
    overlay.classList.add("hidden");
  }

  return { open, close };
})();
