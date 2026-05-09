// === Storage ===

const STORAGE_KEYS = {
  ICONS: "hs_icons",
  SETTINGS: "hs_settings",
};

function getPreferredColorMode() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

const DEFAULT_SETTINGS = {
  colorMode: getPreferredColorMode(),
  gridGap: 16,
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function showToast(message) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage write failed", key, e);
    showToast("Storage error — changes may not be saved.");
  }
}

function loadIcons() {
  return safeRead(STORAGE_KEYS.ICONS, []);
}

function saveIcons(icons) {
  safeWrite(STORAGE_KEYS.ICONS, icons);
}

function loadSettings() {
  return Object.assign(
    {},
    DEFAULT_SETTINGS,
    safeRead(STORAGE_KEYS.SETTINGS, {}),
  );
}

function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, settings);
}

function generateId() {
  return `icon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function applyColorMode(mode) {
  document.body.classList.toggle("dark-mode", mode === "dark");
}

function applyGridGap(gap) {
  const safeGap = Math.min(32, Math.max(8, gap));
  document.documentElement.style.setProperty("--icon-gap", safeGap + "px");
}

// === App ===

const App = (() => {
  let icons = [];
  let settings = {};

  const grid = document.getElementById("icon-grid");

  function init() {
    icons = loadIcons();
settings = loadSettings();

    applyColorMode(settings.colorMode || "light");
    applyGridGap(settings.gridGap || 16);

    document.getElementById("app").addEventListener("contextmenu", (e) => {
      if (!e.target.closest(".icon-wrapper")) {
        e.preventDefault();
        ContextMenu.showBackgroundMenu(e.clientX, e.clientY);
      }
    });

    grid.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      persistOrder();
    });
  }

  function render() {
    grid.innerHTML = "";

    icons.forEach((ic) => {
      grid.appendChild(
        Icons.createIconElement(ic, {
          onContextMenu: (e, icon) =>
            ContextMenu.showIconMenu(e.clientX, e.clientY, icon),
        }),
      );
    });
  }

  function addIcon(data) {
    icons.push({
      id: generateId(),
      name: data.name,
      url: data.url,
      iconUrl: data.iconUrl || "",
      inDock: false,
    });
    saveIcons(icons);
    render();
  }

  function updateIcon(id, data) {
    const idx = icons.findIndex((ic) => ic.id === id);
    if (idx === -1) return;
    icons[idx] = Object.assign({}, icons[idx], {
      name: data.name,
      url: data.url,
      iconUrl: data.iconUrl || "",
      inDock: false,
    });
    saveIcons(icons);
    render();
  }

  function deleteIcon(id) {
    icons = icons.filter((ic) => ic.id !== id);
    saveIcons(icons);
    render();
  }

  function persistOrder() {
    const newOrder = [];
    grid.querySelectorAll(".icon-wrapper[data-id]").forEach((el) => {
      const ic = icons.find((i) => i.id === el.dataset.id);
      if (ic) newOrder.push({ ...ic, inDock: false });
    });
    icons = newOrder;
    saveIcons(icons);
  }

  function getSettings() {
    return Object.assign({}, settings);
  }

  function updateSetting(key, value) {
    settings[key] = value;
    saveSettings(settings);
  }

  function reload() {
    icons = loadIcons();
    settings = loadSettings();
    applyColorMode(settings.colorMode || "light");
    applyGridGap(settings.gridGap || 16);
    render();
  }

  function getIcons() {
    return [...icons];
  }

  function importIcons(importedIcons) {
    icons = importedIcons;
    saveIcons(icons);
    render();
  }

  init();

  return {
    addIcon,
    updateIcon,
    deleteIcon,
    persistOrder,
    getSettings,
    updateSetting,
    reload,
    getIcons,
    importIcons,
  };
})();
