/**
 * theme.js
 * Manages iOS / Android theme switching and background (wallpaper / color).
 */

const Theme = (() => {
  const THEMES = ['android', 'ios'];
  const ICON_BG_MODES = ['light', 'dark', 'auto'];
  const ICON_PRESETS = ['android', 'ios', 'squircle', 'custom'];
  const SEARCH_BAR_PRESETS = ['google', 'minimal'];

  const ICON_PRESET_CLASSES = {
    android: 'preset-android-icons',
    ios: 'preset-ios-icons',
    squircle: 'preset-squircle-icons',
    custom: null,
  };

  const VISUAL_PRESET_CLASSES = {
    android: 'preset-android',
    ios: 'preset-ios',
  };

  function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'android';
    document.body.classList.remove(...THEMES.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${theme}`);

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  function applyIconBgMode(mode) {
    if (!ICON_BG_MODES.includes(mode)) mode = 'auto';
    document.body.classList.remove(...ICON_BG_MODES.map(m => `icon-bg-${m}`));
    document.body.classList.add(`icon-bg-${mode}`);

    document.querySelectorAll('.icon-bg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }

  function applyIconPreset(preset, customRadius, customImageSize) {
    document.body.classList.remove('preset-android-icons', 'preset-ios-icons', 'preset-squircle-icons');

    if (preset === 'custom') {
      document.documentElement.style.setProperty('--icon-radius', customRadius + '%');
      document.documentElement.style.setProperty('--icon-img-width', customImageSize + '%');
      document.documentElement.style.setProperty('--icon-img-height', customImageSize + '%');
    } else if (ICON_PRESET_CLASSES[preset]) {
      document.body.classList.add(ICON_PRESET_CLASSES[preset]);
      document.documentElement.style.setProperty('--icon-radius', '');
      document.documentElement.style.setProperty('--icon-img-width', '');
      document.documentElement.style.setProperty('--icon-img-height', '');
    }
  }

  function applySearchBarPreset(preset) {
    const container = document.getElementById('search-bar-container');
    if (!container) return;
    container.classList.remove('search-preset-google', 'search-preset-minimal');
    if (SEARCH_BAR_PRESETS.includes(preset)) {
      container.classList.add(`search-preset-${preset}`);
    }
  }

  function applyVisualPreset(preset) {
    document.body.classList.remove('preset-android', 'preset-ios');
    if (VISUAL_PRESET_CLASSES[preset]) {
      document.body.classList.add(VISUAL_PRESET_CLASSES[preset]);
    }
  }

  function applyWallpaper(url) {
    const el = document.getElementById('wallpaper');
    if (url) {
      el.style.backgroundImage = `url(${JSON.stringify(url)})`;
    } else {
      el.style.backgroundImage = '';
    }
  }

  function applyBgColor(color) {
    document.getElementById('wallpaper').style.backgroundColor = color;
  }

  function applyGridCols(cols) {
    document.getElementById('icon-grid').style.setProperty('--grid-cols', cols);
    document.documentElement.style.setProperty('--grid-cols', cols);
  }

  function init(settings) {
    applyTheme(settings.theme);
    applyBgColor(settings.bgColor);
    if (settings.wallpaperUrl) applyWallpaper(settings.wallpaperUrl);
    applyGridCols(settings.gridCols);
    applyIconBgMode(settings.iconBgMode || 'auto');
    applyIconPreset(settings.iconPreset || 'android', settings.iconRadius, settings.iconImageSize);
    applySearchBarPreset(settings.searchBarPreset || 'google');
    applyVisualPreset(settings.theme);
  }

  return {
    applyTheme,
    applyIconBgMode,
    applyIconPreset,
    applySearchBarPreset,
    applyVisualPreset,
    applyWallpaper,
    applyBgColor,
    applyGridCols,
    init,
    ICON_PRESETS,
    SEARCH_BAR_PRESETS,
  };
})();
