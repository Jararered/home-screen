// === Storage ===

const STORAGE_KEYS = {
  ICONS: "hs_icons",
  SETTINGS: "hs_settings",
};

const DEFAULT_SETTINGS = {
  theme: "android",
  wallpaperUrl: "",
  bgColor: "#1a1a2e",
  searchEngine: "https://www.google.com/search?q=",
  gridCols: 5,
  iconBgMode: "auto",
  iconPreset: "android",
  iconRadius: 22,
  iconImageSize: 80,
  searchBarPreset: "google",
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
  return Object.assign({}, DEFAULT_SETTINGS, safeRead(STORAGE_KEYS.SETTINGS, {}));
}

function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.SETTINGS, settings);
}

function exportData() {
  const data = {
    version: 1,
    exported: new Date().toISOString(),
    icons: loadIcons(),
    settings: loadSettings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "home-screen-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.icons)) throw new Error("Invalid backup format");
      saveIcons(data.icons);
      if (data.settings) saveSettings(data.settings);
      onSuccess(data);
    } catch (err) {
      onError(err);
    }
  };
  reader.onerror = () => onError(new Error("File read error"));
  reader.readAsText(file);
}

function generateId() {
  return `icon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// === App ===

const App = (() => {
  let icons = [];
  let settings = {};

  const grid = document.getElementById("icon-grid");
  const dock = document.getElementById("dock");

  function init() {
    icons = loadIcons();
    settings = loadSettings();

    Theme.init(settings);
    applySearchEngine(settings.searchEngine);
    render();

    document.getElementById("app").addEventListener("contextmenu", (e) => {
      if (!e.target.closest(".icon-wrapper")) {
        e.preventDefault();
        const inDock = !!e.target.closest("#dock");
        ContextMenu.showBackgroundMenu(e.clientX, e.clientY, inDock);
      }
    });

    [grid, dock].forEach((container) => {
      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (e.target === container) {
          const id = e.dataTransfer.getData("text/plain");
          const el = document.querySelector(`[data-id="${id}"]`);
          if (el && el.parentNode !== container) container.appendChild(el);
        }
      });
      container.addEventListener("drop", (e) => {
        e.preventDefault();
        persistOrder();
      });
    });
  }

  function render() {
    grid.innerHTML = "";
    dock.innerHTML = "";

    icons.filter((ic) => !ic.inDock).forEach((ic) => {
      grid.appendChild(Icons.createIconElement(ic, {
        onContextMenu: (e, icon) => ContextMenu.showIconMenu(e.clientX, e.clientY, icon),
      }));
    });

    icons.filter((ic) => ic.inDock).forEach((ic) => {
      dock.appendChild(Icons.createIconElement(ic, {
        onContextMenu: (e, icon) => ContextMenu.showIconMenu(e.clientX, e.clientY, icon),
      }));
    });
  }

  function addIcon(data) {
    icons.push({
      id: generateId(),
      name: data.name,
      url: data.url,
      iconUrl: data.iconUrl || "",
      inDock: !!data.inDock,
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
      inDock: !!data.inDock,
    });
    saveIcons(icons);
    render();
  }

  function deleteIcon(id) {
    icons = icons.filter((ic) => ic.id !== id);
    saveIcons(icons);
    render();
  }

  function toggleDock(id) {
    const icon = icons.find((ic) => ic.id === id);
    if (!icon) return;
    icon.inDock = !icon.inDock;
    saveIcons(icons);
    render();
  }

  function persistOrder() {
    const newOrder = [];
    grid.querySelectorAll(".icon-wrapper[data-id]").forEach((el) => {
      const ic = icons.find((i) => i.id === el.dataset.id);
      if (ic) newOrder.push(Object.assign({}, ic, { inDock: false }));
    });
    dock.querySelectorAll(".icon-wrapper[data-id]").forEach((el) => {
      const ic = icons.find((i) => i.id === el.dataset.id);
      if (ic) newOrder.push(Object.assign({}, ic, { inDock: true }));
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

  function applySearchEngine(engineUrl) {
    if (!engineUrl) return;

    function attachHandler(formId, inputId) {
      const form = document.getElementById(formId);
      const input = document.getElementById(inputId);
      if (!form || !input) return;
      if (form._searchHandler) form.removeEventListener("submit", form._searchHandler);
      form._searchHandler = (e) => {
        e.preventDefault();
        const q = encodeURIComponent(input.value.trim());
        if (!q) return;
        window.open(engineUrl + q, "_blank");
        input.value = "";
        input.blur();
      };
      form.addEventListener("submit", form._searchHandler);
    }

    attachHandler("search-form", "search-input");
    attachHandler("android-search-form", "android-search-input");
  }

  function reload() {
    icons = loadIcons();
    settings = loadSettings();
    Theme.init(settings);
    applySearchEngine(settings.searchEngine);
    render();
  }

  init();

  return { addIcon, updateIcon, deleteIcon, toggleDock, persistOrder, getSettings, updateSetting, applySearchEngine, reload };
})();
