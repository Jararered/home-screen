# Home Screen — agent guide

A zero-dependency static "new tab" page. Vanilla HTML/CSS/JS, no build step, no package manager, no tests, no CI.

## Architecture

- **IIFE modules** (no module system), loaded synchronously via `<script>` tags in `index.html`.
- **Script load order matters** (dependency chain):
  `svg.js` → `icons.js` → `contextmenu.js` → `settings.js` → `app.js`
- **Persistence**: `localStorage` with keys `hs_icons` and `hs_settings`.
- **Hosting**: static files — open `index.html` directly or serve with any static server (e.g. `python3 -m http.server`).

## Key conventions

- All state lives in `App` (app.js) — the central coordinator. Other modules (`Theme`, `Icons`, `ContextMenu`, `SettingsModal`) read/write through `App`.
- No framework, no bundler, no TypeScript.
- Favicon fallback uses Google's `s2/favicons` service (no CORS needed).
- Dark mode is toggled via `body.dark-mode` class; CSS custom properties handle the switch.

## Workflow

No verification commands exist. To test, open `index.html` in a browser or deploy to GitHub Pages (this repo's intended host).