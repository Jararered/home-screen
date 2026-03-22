/**
 * contextmenu.js
 * Handles right-click context menus and the icon add/edit modal.
 */

const ContextMenu = (() => {
  // ── Helpers ───────────────────────────────────────────────

  /**
   * Ensures a URL has a scheme. Bare addresses like "youtube.com" become
   * "https://youtube.com" so they resolve correctly in window.open().
   */
  function normalizeUrl(url) {
    if (/^https?:\/\//i.test(url)) return url;
    return 'https://' + url;
  }

  const menu = document.getElementById('context-menu');
  const menuList = document.getElementById('context-menu-list');

  // ── Context menu ──────────────────────────────────────────

  function show(x, y, items) {
    menuList.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      if (item.danger) li.classList.add('danger');
      li.innerHTML = `${item.icon || ''}<span>${item.label}</span>`;
      li.addEventListener('click', () => {
        hide();
        item.action();
      });
      menuList.appendChild(li);
    });

    menu.classList.remove('hidden');

    // Position: keep within viewport
    const mw = 200, mh = items.length * 42;
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = x + mw > vw ? vw - mw - 8 : x;
    const top  = y + mh > vh ? vh - mh - 8 : y;
    menu.style.left = `${left}px`;
    menu.style.top  = `${top}px`;
  }

  function hide() {
    menu.classList.add('hidden');
  }

  // Close on outside click or Escape
  document.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  menu.addEventListener('click', (e) => e.stopPropagation());

  // ── SVG icons for menu items ──────────────────────────────

  const SVG = {
    add:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    edit:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    pin:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 4-7 13-7 13S5 13 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
    unpin:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M12 2a7 7 0 0 1 6.93 8H5.07A7 7 0 0 1 12 2z"/><path d="M12 22S5 13 5 9"/><path d="M19 9c0 4-7 13-7 13"/></svg>`,
    trash:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
    open:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
    settings:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  };

  /**
   * Show context menu for background (no icon targeted).
   */
  function showBackgroundMenu(x, y, inDock) {
    show(x, y, [
      {
        icon: SVG.add,
        label: inDock ? 'Add dock icon' : 'Add icon',
        action: () => Modal.open(null, { inDock }),
      },
      {
        icon: SVG.settings,
        label: 'Settings',
        action: () => SettingsModal.open(),
      },
    ]);
  }

  /**
   * Show context menu for an icon.
   */
  function showIconMenu(x, y, icon) {
    show(x, y, [
      {
        icon: SVG.open,
        label: 'Open',
        action: () => window.open(icon.url, '_blank'),
      },
      {
        icon: SVG.edit,
        label: 'Edit',
        action: () => Modal.open(icon),
      },
      {
        icon: icon.inDock ? SVG.unpin : SVG.pin,
        label: icon.inDock ? 'Unpin from dock' : 'Pin to dock',
        action: () => App.toggleDock(icon.id),
      },
      {
        icon: SVG.trash,
        label: 'Delete',
        danger: true,
        action: () => App.deleteIcon(icon.id),
      },
    ]);
  }

  // ── Icon add/edit modal ───────────────────────────────────

  const Modal = (() => {
    const overlay   = document.getElementById('modal-overlay');
    const title     = document.getElementById('modal-title');
    const nameInput = document.getElementById('modal-name');
    const urlInput  = document.getElementById('modal-url');
    const iconInput = document.getElementById('modal-icon');
    const preview   = document.getElementById('modal-icon-preview');
    const fetchBtn  = document.getElementById('modal-fetch-favicon');
    const dockChk   = document.getElementById('modal-dock');
    const cancelBtn = document.getElementById('modal-cancel');
    const deleteBtn = document.getElementById('modal-delete');
    const saveBtn   = document.getElementById('modal-save');

    let editingIcon = null;
    let defaultInDock = false;

    function updatePreview(src) {
      preview.innerHTML = '';
      if (!src) return;
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'preview';
      preview.appendChild(img);
    }

    iconInput.addEventListener('input', () => updatePreview(iconInput.value));

    fetchBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      fetchBtn.disabled = true;
      fetchBtn.textContent = 'Fetching…';
      try {
        const src = await Icons.fetchFaviconSrc(url);
        iconInput.value = src;
        updatePreview(src);
      } catch {
        alert('Could not fetch favicon. Try entering one manually.');
      } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = 'Fetch favicon';
      }
    });

    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close(); });

    deleteBtn.addEventListener('click', () => {
      if (editingIcon) {
        App.deleteIcon(editingIcon.id);
        close();
      }
    });

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const rawUrl  = urlInput.value.trim();
      if (!name || !rawUrl) {
        alert('Name and URL are required.');
        return;
      }
      const url = normalizeUrl(rawUrl);
      const iconData = {
        name,
        url,
        iconUrl: iconInput.value.trim(),
        inDock: dockChk.checked,
      };
      if (editingIcon) {
        App.updateIcon(editingIcon.id, iconData);
      } else {
        App.addIcon(iconData);
      }
      close();
    });

    function open(icon, opts = {}) {
      editingIcon = icon || null;
      defaultInDock = opts.inDock || false;

      title.textContent = icon ? 'Edit Icon' : 'Add Icon';
      nameInput.value   = icon ? icon.name    : '';
      urlInput.value    = icon ? icon.url     : '';
      iconInput.value   = icon ? icon.iconUrl : '';
      dockChk.checked   = icon ? icon.inDock  : defaultInDock;

      deleteBtn.classList.toggle('hidden', !icon);
      updatePreview(icon ? (icon.iconUrl || Icons.faviconUrl(icon.url)) : '');

      overlay.classList.remove('hidden');
      nameInput.focus();
    }

    function close() {
      overlay.classList.add('hidden');
      editingIcon = null;
    }

    return { open, close };
  })();

  // ── Settings modal ────────────────────────────────────────

  const SettingsModal = (() => {
    const overlay        = document.getElementById('settings-overlay');
    const closeBtn       = document.getElementById('settings-close');
    const themeBtns      = document.querySelectorAll('.theme-btn');
    const wallpaperInput = document.getElementById('settings-wallpaper-url');
    const applyWallBtn   = document.getElementById('settings-apply-wallpaper');
    const bgColorInput   = document.getElementById('settings-bg-color');
    const applyColorBtn  = document.getElementById('settings-apply-color');
    const clearWallBtn   = document.getElementById('settings-clear-wallpaper');
    const searchSel      = document.getElementById('settings-search-engine');
    const colsInput      = document.getElementById('settings-columns');
    const exportBtn      = document.getElementById('settings-export');
    const importBtn      = document.getElementById('settings-import-btn');
    const importFile     = document.getElementById('settings-import-file');
    const settingsGear   = document.getElementById('settings-btn');

    settingsGear.addEventListener('click', () => open());

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        Theme.applyTheme(theme);
        App.updateSetting('theme', theme);
      });
    });

    applyWallBtn.addEventListener('click', () => {
      const url = wallpaperInput.value.trim();
      Theme.applyWallpaper(url);
      App.updateSetting('wallpaperUrl', url);
    });

    applyColorBtn.addEventListener('click', () => {
      const color = bgColorInput.value;
      Theme.applyBgColor(color);
      App.updateSetting('bgColor', color);
    });

    clearWallBtn.addEventListener('click', () => {
      wallpaperInput.value = '';
      Theme.applyWallpaper('');
      App.updateSetting('wallpaperUrl', '');
    });

    searchSel.addEventListener('change', () => {
      App.updateSetting('searchEngine', searchSel.value);
      App.applySearchEngine(searchSel.value);
    });

    colsInput.addEventListener('change', () => {
      const cols = Math.min(10, Math.max(3, parseInt(colsInput.value, 10) || 5));
      colsInput.value = cols;
      Theme.applyGridCols(cols);
      App.updateSetting('gridCols', cols);
    });

    exportBtn.addEventListener('click', () => exportData());

    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', () => {
      const file = importFile.files[0];
      if (!file) return;
      importData(file, (data) => {
        App.reload();
        close();
      }, (err) => {
        alert('Import failed: ' + err.message);
      });
      importFile.value = '';
    });

    function open() {
      const s = App.getSettings();
      wallpaperInput.value = s.wallpaperUrl || '';
      bgColorInput.value   = s.bgColor || '#1a1a2e';
      colsInput.value      = s.gridCols || 5;

      // Sync search engine select
      let matched = false;
      for (const opt of searchSel.options) {
        if (opt.value === s.searchEngine) { opt.selected = true; matched = true; }
      }
      if (!matched) searchSel.selectedIndex = 0;

      overlay.classList.remove('hidden');
    }

    function close() {
      overlay.classList.add('hidden');
    }

    return { open, close };
  })();

  return { showBackgroundMenu, showIconMenu, Modal, SettingsModal };
})();
