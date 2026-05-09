// === Context Menu ===

const ContextMenu = (() => {
  const menu = document.getElementById("context-menu");
  const menuList = document.getElementById("context-menu-list");

  const SVG = SVGIcons;

  function show(x, y, items) {
    menuList.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      if (item.danger) li.classList.add("danger");
      if (item.icon) {
        const iconWrap = document.createElement("span");
        iconWrap.innerHTML = item.icon;
        li.appendChild(iconWrap);
      }
      const label = document.createElement("span");
      label.textContent = item.label;
      li.appendChild(label);
      li.setAttribute("role", "menuitem");
      li.tabIndex = 0;
      li.addEventListener("click", () => {
        hide();
        item.action();
      });
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          hide();
          item.action();
        }
      });
      menuList.appendChild(li);
    });

    menu.classList.remove("hidden");

    const mw = 200,
      mh = items.length * 42;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    menu.style.left = `${x + mw > vw ? vw - mw - 8 : x}px`;
    menu.style.top = `${y + mh > vh ? vh - mh - 8 : y}px`;
  }

  function hide() {
    if (menu.classList.contains("hidden")) return;
    menu.classList.add("hidden");
  }

  document.addEventListener("click", hide);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
  menu.addEventListener("click", (e) => e.stopPropagation());

  function showBackgroundMenu(x, y) {
    show(x, y, [
      { icon: SVG.add, label: "Add icon", action: () => Modal.open(null, {}) },
      {
        icon: SVG.settings,
        label: "Settings",
        action: () => SettingsModal.open(),
      },
    ]);
  }

  function showIconMenu(x, y, icon) {
    show(x, y, [
      {
        icon: SVG.open,
        label: "Open",
        action: () => window.open(icon.url, "_blank"),
      },
      { icon: SVG.edit, label: "Edit", action: () => Modal.open(icon) },
      {
        icon: SVG.trash,
        label: "Delete",
        danger: true,
        action: () => App.deleteIcon(icon.id),
      },
    ]);
  }

  // === Icon Add/Edit Modal ===

  const Modal = (() => {
    const overlay = document.getElementById("modal-overlay");
    const title = document.getElementById("modal-title");
    const nameInput = document.getElementById("modal-name");
    const urlInput = document.getElementById("modal-url");
    const iconInput = document.getElementById("modal-icon");
    const preview = document.getElementById("modal-icon-preview");
    const fetchButton = document.getElementById("modal-fetch-favicon");
    const cancelButton = document.getElementById("modal-cancel");
    const deleteButton = document.getElementById("modal-delete");
    const saveButton = document.getElementById("modal-save");

    let editingIcon = null;

    function normalizeUrl(url) {
      return /^https?:\/\//i.test(url) ? url : "https://" + url;
    }

    function updatePreview(src) {
      preview.innerHTML = "";
      if (!src) return;
      const img = document.createElement("img");
      img.src = src;
      img.alt = "preview";
      preview.appendChild(img);
    }

    iconInput.addEventListener("input", () => updatePreview(iconInput.value));

    fetchButton.addEventListener("click", async () => {
      const url = urlInput.value.trim();
      if (!url) return;
      fetchButton.disabled = true;
      fetchButton.textContent = "Fetching…";
      try {
        const src = await Icons.fetchFaviconSrc(url);
        iconInput.value = src;
        updatePreview(src);
      } catch {
        alert("Could not fetch favicon. Try entering one manually.");
      } finally {
        fetchButton.disabled = false;
        fetchButton.textContent = "Fetch favicon";
      }
    });

    cancelButton.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) close();
    });

    deleteButton.addEventListener("click", () => {
      if (editingIcon) {
        App.deleteIcon(editingIcon.id);
        close();
      }
    });

    saveButton.addEventListener("click", () => {
      const name = nameInput.value.trim();
      const rawUrl = urlInput.value.trim();
      if (!name || !rawUrl) {
        alert("Name and URL are required.");
        return;
      }
      const iconData = {
        name,
        url: normalizeUrl(rawUrl),
        iconUrl: iconInput.value.trim(),
      };
      if (editingIcon) App.updateIcon(editingIcon.id, iconData);
      else App.addIcon(iconData);
      close();
    });

    function open(icon, opts = {}) {
      editingIcon = icon || null;
      title.textContent = icon ? "Edit Icon" : "Add Icon";
      nameInput.value = icon ? icon.name : "";
      urlInput.value = icon ? icon.url : "";
      iconInput.value = icon ? icon.iconUrl : "";
      deleteButton.classList.toggle("hidden", !icon);
      updatePreview(icon ? icon.iconUrl || Icons.faviconUrl(icon.url) : "");
      overlay.classList.remove("hidden");
      nameInput.focus();
    }

    function close() {
      overlay.classList.add("hidden");
      editingIcon = null;
    }

    return { open, close };
  })();

  return { showBackgroundMenu, showIconMenu, Modal };
})();
