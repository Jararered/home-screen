/**
 * icons.js
 * Renders icon elements, handles favicon fetching, and drag-and-drop reordering.
 */

const Icons = (() => {
  // ── Favicon helpers ───────────────────────────────────────

  /**
   * Returns a best-effort favicon URL for a given site URL.
   * Uses Google's favicon service (works without CORS).
   */
  function faviconUrl(siteUrl) {
    try {
      const normalized = /^https?:\/\//i.test(siteUrl)
        ? siteUrl
        : "https://" + siteUrl;
      const origin = new URL(normalized).origin;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=128`;
    } catch {
      return "";
    }
  }

  // ── Element builders ──────────────────────────────────────

  /**
   * Creates a DOM element for a single icon.
   * @param {Object} icon - { id, name, url, iconUrl, inDock }
   * @param {Object} opts - { onEdit, onOpen }
   */
  function createIconElement(icon, opts = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = "icon-wrapper";
    wrapper.dataset.id = icon.id;
    wrapper.draggable = true;

    // Image container
    const imgWrap = document.createElement("div");
    imgWrap.className = "icon-img-wrap";

    const img = document.createElement("img");
    const src = icon.iconUrl || faviconUrl(icon.url);
    img.src = src;
    img.alt = icon.name;
    img.loading = "lazy";
    img.onerror = () => {
      // Fallback: render first letter of name
      img.style.display = "none";
      const fallback = document.createElement("span");
      fallback.textContent = (icon.name || "?")[0].toUpperCase();
      fallback.style.cssText =
        "font-size:22px;font-weight:700;color:rgba(255,255,255,0.8);";
      imgWrap.appendChild(fallback);
    };
    imgWrap.appendChild(img);

    // Label
    const label = document.createElement("div");
    label.className = "icon-label";
    label.textContent = icon.name;

    wrapper.appendChild(imgWrap);
    wrapper.appendChild(label);

    // Click → open URL
    wrapper.addEventListener("click", (e) => {
      if (wrapper.dataset.dragged === "true") return;
      if (opts.onOpen) opts.onOpen(icon);
      else window.open(icon.url, "_blank");
    });

    // Right-click → edit menu (handled by contextmenu.js)
    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (opts.onContextMenu) opts.onContextMenu(e, icon);
    });

    // Long-press → same as right-click on mobile
    attachLongPress(wrapper, (e) => {
      if (opts.onContextMenu) opts.onContextMenu(e, icon);
    });

    // Drag events
    attachDrag(wrapper);

    return wrapper;
  }

  // ── Drag & Drop ───────────────────────────────────────────

  let dragSrc = null;

  function attachDrag(el) {
    el.addEventListener("dragstart", onDragStart);
    el.addEventListener("dragend", onDragEnd);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
  }

  function onDragStart(e) {
    dragSrc = e.currentTarget;
    dragSrc.dataset.dragged = "true";
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragSrc.dataset.id);
    // Slight delay so the browser captures the non-faded image as the drag ghost
    requestAnimationFrame(() => {
      if (dragSrc) dragSrc.classList.add("dragging");
    });
  }

  function onDragEnd(e) {
    if (dragSrc) {
      dragSrc.classList.remove("dragging");
      // Keep dragged flag briefly to suppress accidental click
      setTimeout(() => {
        if (dragSrc) dragSrc.dataset.dragged = "false";
        dragSrc = null;
      }, 100);
    }
    // Persist new order
    if (window.App) App.persistOrder();
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const target = e.currentTarget;
    if (!dragSrc || target === dragSrc) return;

    // Determine insert position based on cursor vs element midpoint
    const rect = target.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const parent = target.parentNode;

    if (e.clientX < midX) {
      // Insert dragSrc before target if it isn't already there
      if (target.previousElementSibling !== dragSrc) {
        parent.insertBefore(dragSrc, target);
      }
    } else {
      // Insert dragSrc after target if it isn't already there
      if (target.nextElementSibling !== dragSrc) {
        parent.insertBefore(dragSrc, target.nextSibling);
      }
    }
  }

  function onDrop(e) {
    e.preventDefault();
    // Insertion already happened live in onDragOver; nothing more needed here.
  }

  // ── Long press (mobile) ───────────────────────────────────

  function attachLongPress(el, callback) {
    let timer = null;
    let startX, startY;

    el.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        timer = setTimeout(() => {
          callback(e.touches[0]);
          timer = null;
        }, 500);
      },
      { passive: true },
    );

    el.addEventListener(
      "touchmove",
      (e) => {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        if (dx > 8 || dy > 8) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { passive: true },
    );

    el.addEventListener("touchend", () => {
      clearTimeout(timer);
    });
  }

  // ── Favicon fetch (for modal preview) ────────────────────

  /**
   * Returns a promise that resolves to an image src for the favicon.
   */
  function fetchFaviconSrc(siteUrl) {
    return new Promise((resolve, reject) => {
      const src = faviconUrl(siteUrl);
      if (!src) {
        reject(new Error("Invalid URL"));
        return;
      }
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error("Favicon not found"));
      img.src = src;
    });
  }

  return { createIconElement, fetchFaviconSrc, faviconUrl };
})();
