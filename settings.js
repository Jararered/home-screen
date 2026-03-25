// === Settings Modal ===

const SettingsModal = (() => {
  let overlay, closeBtn, colorModeBtns, colsInput, exportBtn, importBtn, importFile, settingsGear;

  function init() {
    overlay = document.getElementById("settings-overlay");
    closeBtn = document.getElementById("settings-close");
    colorModeBtns = document.querySelectorAll(".color-mode-btn");
    colsInput = document.getElementById("settings-columns");
    exportBtn = document.getElementById("settings-export");
    importBtn = document.getElementById("settings-import-btn");
    importFile = document.getElementById("settings-import-file");
    settingsGear = document.getElementById("settings-btn");

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

    exportBtn.addEventListener("click", () => exportData(App));

    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const file = importFile.files[0];
      if (!file) return;
      importData(
        file,
        App,
        () => {
          App.reload();
          close();
        },
        (err) => alert("Import failed: " + err.message),
      );
      importFile.value = "";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function exportData(appInstance) {
    const data = {
      version: 1,
      exported: new Date().toISOString(),
      icons: appInstance.getIcons(),
      settings: appInstance.getSettings(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "home-screen-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importData(file, appInstance, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.icons)) throw new Error("Invalid backup format");
        appInstance.importIcons(data.icons);
        if (data.settings) {
          const s = data.settings;
          appInstance.updateSetting("colorMode", s.colorMode);
          appInstance.updateSetting("gridGap", s.gridGap);
        }
        onSuccess(data);
      } catch (err) {
        onError(err);
      }
    };
    reader.onerror = () => onError(new Error("File read error"));
    reader.readAsText(file);
  }

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
