/**
 * app.js
 * Core application controller. Bootstraps everything, manages state,
 * and exposes the global App API used by other modules.
 */

const App = (() => {
  let icons = []; // All icons (grid + dock)
  let settings = {};

  const grid = document.getElementById("icon-grid");
  const dock = document.getElementById("dock");

  // ── Boot ─────────────────────────────────────────────────

  function init() {
    icons = loadIcons();
    settings = loadSettings();

    // Apply theme / background
    Theme.init(settings);

    // Wire up search form
    applySearchEngine(settings.searchEngine);

    // Render
    render();

    // Right-click on background → context menu
    document.getElementById("app").addEventListener("contextmenu", (e) => {
      // Only fire if not on an icon (icons handle their own contextmenu)
      if (!e.target.closest(".icon-wrapper")) {
        e.preventDefault();
        const inDock = !!e.target.closest("#dock");
        ContextMenu.showBackgroundMenu(e.clientX, e.clientY, inDock);
      }
    });

    // Drag-drop: allow drop on grid/dock backgrounds
    [grid, dock].forEach((container) => {
      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        // When dragging over the container's empty area (not over an icon),
        // move the dragged icon to the end of this container so it follows the cursor.
        if (e.target === container) {
          const id = e.dataTransfer.getData("text/plain");
          const el = document.querySelector(`[data-id="${id}"]`);
          if (el && el.parentNode !== container) {
            container.appendChild(el);
          }
        }
      });
      container.addEventListener("drop", (e) => {
        e.preventDefault();
        // The live-move in dragover already placed the icon; just persist order.
        persistOrder();
      });
    });
  }

  // ── Render ────────────────────────────────────────────────

  function render() {
    grid.innerHTML = "";
    dock.innerHTML = "";

    const gridIcons = icons.filter((ic) => !ic.inDock);
    const dockIcons = icons.filter((ic) => ic.inDock);

    gridIcons.forEach((ic) => {
      const el = Icons.createIconElement(ic, {
        onContextMenu: (e, icon) =>
          ContextMenu.showIconMenu(e.clientX, e.clientY, icon),
      });
      grid.appendChild(el);
    });

    dockIcons.forEach((ic) => {
      const el = Icons.createIconElement(ic, {
        onContextMenu: (e, icon) =>
          ContextMenu.showIconMenu(e.clientX, e.clientY, icon),
      });
      dock.appendChild(el);
    });
  }

  // ── CRUD ──────────────────────────────────────────────────

  function addIcon(data) {
    const icon = {
      id: generateId(),
      name: data.name,
      url: data.url,
      iconUrl: data.iconUrl || "",
      inDock: !!data.inDock,
    };
    icons.push(icon);
    save();
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
    save();
    render();
  }

  function deleteIcon(id) {
    icons = icons.filter((ic) => ic.id !== id);
    save();
    render();
  }

  function toggleDock(id) {
    const icon = icons.find((ic) => ic.id === id);
    if (!icon) return;
    icon.inDock = !icon.inDock;
    save();
    render();
  }

  // ── Order persistence (after drag-drop) ──────────────────

  /**
   * Read DOM order from grid and dock, then reorder `icons` array to match.
   */
  function persistOrder() {
    const newOrder = [];

    // Grid (exclude add button)
    grid.querySelectorAll(".icon-wrapper[data-id]").forEach((el) => {
      const ic = icons.find((i) => i.id === el.dataset.id);
      if (ic) newOrder.push(Object.assign({}, ic, { inDock: false }));
    });

    // Dock
    dock.querySelectorAll(".icon-wrapper[data-id]").forEach((el) => {
      const ic = icons.find((i) => i.id === el.dataset.id);
      if (ic) newOrder.push(Object.assign({}, ic, { inDock: true }));
    });

    icons = newOrder;
    save();
  }

  // ── Settings ──────────────────────────────────────────────

  function getSettings() {
    return Object.assign({}, settings);
  }

  function updateSetting(key, value) {
    settings[key] = value;
    saveSettings(settings);
  }

  function applySearchEngine(engineUrl) {
    if (!engineUrl) return;
    // engineUrl is stored as "https://example.com/search?q=" — a prefix.
    // We intercept submit on both forms and redirect.

    function attachHandler(formId, inputId) {
      const form = document.getElementById(formId);
      const input = document.getElementById(inputId);
      if (!form || !input) return;

      if (form._searchHandler) {
        form.removeEventListener("submit", form._searchHandler);
      }

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

  // ── Reload (after import) ─────────────────────────────────

  function reload() {
    icons = loadIcons();
    settings = loadSettings();
    Theme.init(settings);
    applySearchEngine(settings.searchEngine);
    render();
  }

  // ── Persist ───────────────────────────────────────────────

  function save() {
    saveIcons(icons);
  }

  // ── Init ──────────────────────────────────────────────────

  init();

  return {
    addIcon,
    updateIcon,
    deleteIcon,
    toggleDock,
    persistOrder,
    getSettings,
    updateSetting,
    applySearchEngine,
    reload,
  };
})();
