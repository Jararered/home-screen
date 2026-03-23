// === Settings Modal ===

const SettingsModal = (() => {
  const overlay             = document.getElementById("settings-overlay");
  const closeBtn            = document.getElementById("settings-close");
  const themeBtns           = document.querySelectorAll(".theme-btn");
  const iconBgBtns          = document.querySelectorAll(".icon-bg-btn");
  const iconPresetBtns      = document.querySelectorAll(".icon-preset-btn");
  const searchBarPresetBtns = document.querySelectorAll(".search-bar-preset-btn");
  const wallpaperInput      = document.getElementById("settings-wallpaper-url");
  const applyWallBtn        = document.getElementById("settings-apply-wallpaper");
  const bgColorInput        = document.getElementById("settings-bg-color");
  const applyColorBtn       = document.getElementById("settings-apply-color");
  const clearWallBtn        = document.getElementById("settings-clear-wallpaper");
  const searchSel           = document.getElementById("settings-search-engine");
  const colsInput           = document.getElementById("settings-columns");
  const exportBtn           = document.getElementById("settings-export");
  const importBtn           = document.getElementById("settings-import-btn");
  const importFile          = document.getElementById("settings-import-file");
  const settingsGear        = document.getElementById("settings-btn");
  const customIconSettings  = document.getElementById("icon-custom-settings");
  const iconRadiusInput     = document.getElementById("settings-icon-radius");
  const iconImageSizeInput  = document.getElementById("settings-icon-image-size");
  const iconRadiusValue     = document.getElementById("icon-radius-value");
  const iconImageSizeValue  = document.getElementById("icon-image-size-value");

  settingsGear.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  themeBtns.forEach((btn) => btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    Theme.applyTheme(theme);
    Theme.applyVisualPreset(theme);
    App.updateSetting("theme", theme);
  }));

  iconBgBtns.forEach((btn) => btn.addEventListener("click", () => {
    const mode = btn.dataset.mode;
    Theme.applyIconBgMode(mode);
    App.updateSetting("iconBgMode", mode);
  }));

  iconPresetBtns.forEach((btn) => btn.addEventListener("click", () => {
    const preset = btn.dataset.preset;
    Theme.applyIconPreset(preset, parseInt(iconRadiusInput.value, 10), parseInt(iconImageSizeInput.value, 10));
    App.updateSetting("iconPreset", preset);
    customIconSettings.classList.toggle("hidden", preset !== "custom");
  }));

  searchBarPresetBtns.forEach((btn) => btn.addEventListener("click", () => {
    const preset = btn.dataset.preset;
    Theme.applySearchBarPreset(preset);
    App.updateSetting("searchBarPreset", preset);
  }));

  iconRadiusInput.addEventListener("input", () => {
    const val = parseInt(iconRadiusInput.value, 10);
    iconRadiusValue.textContent = val + "%";
    Theme.applyIconPreset("custom", val, parseInt(iconImageSizeInput.value, 10));
  });
  iconRadiusInput.addEventListener("change", () => {
    App.updateSetting("iconRadius", parseInt(iconRadiusInput.value, 10));
  });

  iconImageSizeInput.addEventListener("input", () => {
    const val = parseInt(iconImageSizeInput.value, 10);
    iconImageSizeValue.textContent = val + "%";
    Theme.applyIconPreset("custom", parseInt(iconRadiusInput.value, 10), val);
  });
  iconImageSizeInput.addEventListener("change", () => {
    App.updateSetting("iconImageSize", parseInt(iconImageSizeInput.value, 10));
  });

  applyWallBtn.addEventListener("click", () => {
    const url = wallpaperInput.value.trim();
    Theme.applyWallpaper(url);
    App.updateSetting("wallpaperUrl", url);
  });

  applyColorBtn.addEventListener("click", () => {
    Theme.applyBgColor(bgColorInput.value);
    App.updateSetting("bgColor", bgColorInput.value);
  });

  clearWallBtn.addEventListener("click", () => {
    wallpaperInput.value = "";
    Theme.applyWallpaper("");
    App.updateSetting("wallpaperUrl", "");
  });

  searchSel.addEventListener("change", () => {
    App.updateSetting("searchEngine", searchSel.value);
    App.applySearchEngine(searchSel.value);
  });

  colsInput.addEventListener("change", () => {
    const cols = Math.min(10, Math.max(3, parseInt(colsInput.value, 10) || 5));
    colsInput.value = cols;
    Theme.applyGridCols(cols);
    App.updateSetting("gridCols", cols);
  });

  exportBtn.addEventListener("click", exportData);

  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (!file) return;
    importData(file, () => { App.reload(); close(); }, (err) => alert("Import failed: " + err.message));
    importFile.value = "";
  });

  function open() {
    const s = App.getSettings();
    wallpaperInput.value     = s.wallpaperUrl || "";
    bgColorInput.value       = s.bgColor || "#1a1a2e";
    colsInput.value          = s.gridCols || 5;
    iconRadiusInput.value    = s.iconRadius || 22;
    iconImageSizeInput.value = s.iconImageSize || 80;
    iconRadiusValue.textContent    = (s.iconRadius || 22) + "%";
    iconImageSizeValue.textContent = (s.iconImageSize || 80) + "%";

    let matched = false;
    for (const opt of searchSel.options) {
      if (opt.value === s.searchEngine) { opt.selected = true; matched = true; }
    }
    if (!matched) searchSel.selectedIndex = 0;

    const currentMode = s.iconBgMode || "auto";
    iconBgBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === currentMode));

    const currentIconPreset = s.iconPreset || "android";
    iconPresetBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.preset === currentIconPreset));
    customIconSettings.classList.toggle("hidden", currentIconPreset !== "custom");

    const currentSearchBarPreset = s.searchBarPreset || "google";
    searchBarPresetBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.preset === currentSearchBarPreset));

    overlay.classList.remove("hidden");
  }

  function close() {
    overlay.classList.add("hidden");
  }

  return { open, close };
})();
