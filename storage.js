/**
 * storage.js
 * All localStorage read/write operations and JSON import/export.
 */

const STORAGE_KEYS = {
  ICONS: 'hs_icons',
  DOCK: 'hs_dock',
  SETTINGS: 'hs_settings',
};

const DEFAULT_SETTINGS = {
  theme: 'android',
  wallpaperUrl: '',
  bgColor: '#1a1a2e',
  searchEngine: 'https://www.google.com/search?q=',
  gridCols: 5,
  iconBgMode: 'auto',
};

// ── Helpers ──────────────────────────────────────────────

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed', key, e);
  }
}

// ── Icons (grid) ─────────────────────────────────────────

/**
 * Each icon: { id, name, url, iconUrl, inDock }
 */
function loadIcons() {
  return safeRead(STORAGE_KEYS.ICONS, []);
}

function saveIcons(icons) {
  safeWrite(STORAGE_KEYS.ICONS, icons);
}

// ── Settings ──────────────────────────────────────────────

function loadSettings() {
  const saved = safeRead(STORAGE_KEYS.SETTINGS, {});
  return Object.assign({}, DEFAULT_SETTINGS, saved);
}

function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, settings);
}

// ── Export / Import ───────────────────────────────────────

function exportData() {
  const data = {
    version: 1,
    exported: new Date().toISOString(),
    icons: loadIcons(),
    settings: loadSettings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'home-screen-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.icons)) throw new Error('Invalid backup format');
      saveIcons(data.icons);
      if (data.settings) saveSettings(data.settings);
      onSuccess(data);
    } catch (err) {
      onError(err);
    }
  };
  reader.onerror = () => onError(new Error('File read error'));
  reader.readAsText(file);
}

// ── ID generation ─────────────────────────────────────────

function generateId() {
  return `icon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
