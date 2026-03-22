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
      const origin = new URL(siteUrl).origin;
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(origin)}&sz=128`;
    } catch {
      return '';
    }
  }

  // ── Element builders ──────────────────────────────────────

  /**
   * Creates a DOM element for a single icon.
   * @param {Object} icon - { id, name, url, iconUrl, inDock }
   * @param {Object} opts - { onEdit, onOpen }
   */
  function createIconElement(icon, opts = {}) {
    const wrapper = document.createElement('div');
    wrapper.className = 'icon-wrapper';
    wrapper.dataset.id = icon.id;
    wrapper.draggable = true;

    // Image container
    const imgWrap = document.createElement('div');
    imgWrap.className = 'icon-img-wrap';

    const img = document.createElement('img');
    const src = icon.iconUrl || faviconUrl(icon.url);
    img.src = src;
    img.alt = icon.name;
    img.loading = 'lazy';
    img.onerror = () => {
      // Fallback: render first letter of name
      img.style.display = 'none';
      const fallback = document.createElement('span');
      fallback.textContent = (icon.name || '?')[0].toUpperCase();
      fallback.style.cssText = 'font-size:22px;font-weight:700;color:rgba(255,255,255,0.8);';
      imgWrap.appendChild(fallback);
    };
    imgWrap.appendChild(img);

    // Label
    const label = document.createElement('div');
    label.className = 'icon-label';
    label.textContent = icon.name;

    wrapper.appendChild(imgWrap);
    wrapper.appendChild(label);

    // Click → open URL
    wrapper.addEventListener('click', (e) => {
      if (wrapper.classList.contains('dragging')) return;
      if (opts.onOpen) opts.onOpen(icon);
      else window.open(icon.url, '_blank');
    });

    // Right-click → edit menu (handled by contextmenu.js)
    wrapper.addEventListener('contextmenu', (e) => {
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

  /**
   * Creates the "+ Add" placeholder button.
   */
  function createAddButton(onAdd) {
    const wrapper = document.createElement('div');
    wrapper.className = 'add-icon-btn icon-wrapper';
    wrapper.title = 'Add icon';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'icon-img-wrap';
    imgWrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>`;

    const label = document.createElement('div');
    label.className = 'icon-label';
    label.textContent = 'Add';

    wrapper.appendChild(imgWrap);
    wrapper.appendChild(label);
    wrapper.addEventListener('click', onAdd);
    return wrapper;
  }

  // ── Drag & Drop ───────────────────────────────────────────

  let dragSrc = null;
  let placeholder = null;

  function attachDrag(el) {
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('dragend', onDragEnd);
    el.addEventListener('dragover', onDragOver);
    el.addEventListener('drop', onDrop);
    el.addEventListener('dragleave', onDragLeave);
  }

  function onDragStart(e) {
    dragSrc = e.currentTarget;
    dragSrc.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrc.dataset.id);

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.className = 'icon-placeholder';
  }

  function onDragEnd(e) {
    if (dragSrc) dragSrc.classList.remove('dragging');
    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
    document.querySelectorAll('.icon-wrapper.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragSrc = null;
    placeholder = null;
    // Persist new order
    if (window.App) App.persistOrder();
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    if (!dragSrc || target === dragSrc) return;
    target.classList.add('drag-over');

    // Insert placeholder before or after based on cursor position
    const rect = target.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const parent = target.parentNode;
    if (e.clientX < midX) {
      parent.insertBefore(placeholder, target);
    } else {
      parent.insertBefore(placeholder, target.nextSibling);
    }
  }

  function onDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  function onDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over');
    if (!dragSrc || target === dragSrc) return;

    const parent = target.parentNode;
    if (placeholder && placeholder.parentNode === parent) {
      parent.insertBefore(dragSrc, placeholder);
    }
  }

  // ── Long press (mobile) ───────────────────────────────────

  function attachLongPress(el, callback) {
    let timer = null;
    let startX, startY;

    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      timer = setTimeout(() => {
        callback(e.touches[0]);
        timer = null;
      }, 500);
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > 8 || dy > 8) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });

    el.addEventListener('touchend', () => {
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
      if (!src) { reject(new Error('Invalid URL')); return; }
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error('Favicon not found'));
      img.src = src;
    });
  }

  return { createIconElement, createAddButton, fetchFaviconSrc, faviconUrl };
})();
