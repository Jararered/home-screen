/**
 * theme.js
 * Manages iOS / Android theme switching and background (wallpaper / color).
 */

const Theme = (() => {
  const THEMES = ['android', 'ios'];

  function applyTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'android';
    document.body.classList.remove(...THEMES.map(t => `theme-${t}`));
    document.body.classList.add(`theme-${theme}`);

    // Sync settings UI
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
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
    // Also update root for dock consistency
    document.documentElement.style.setProperty('--grid-cols', cols);
  }

  function init(settings) {
    applyTheme(settings.theme);
    applyBgColor(settings.bgColor);
    if (settings.wallpaperUrl) applyWallpaper(settings.wallpaperUrl);
    applyGridCols(settings.gridCols);
  }

  return { applyTheme, applyWallpaper, applyBgColor, applyGridCols, init };
})();
