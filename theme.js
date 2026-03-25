/**
 * theme.js
 * Manages light/dark color mode switching.
 */

const Theme = (() => {
  function applyColorMode(mode) {
    document.body.classList.remove("dark-mode");
    if (mode === "dark") {
      document.body.classList.add("dark-mode");
    }

    document.querySelectorAll(".color-mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  function applyGridGap(gap) {
    const safeGap = Math.min(32, Math.max(8, gap));
    document.documentElement.style.setProperty("--icon-gap", safeGap + "px");
  }

  function init(settings) {
    applyColorMode(settings.colorMode || "light");
    applyGridGap(settings.gridGap || 16);
  }

  return { applyColorMode, applyGridGap, init };
})();
