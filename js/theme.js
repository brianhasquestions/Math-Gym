// theme.js — theme registry, persistence, and application.
// Themes are pure CSS (token sets under `:root[data-theme="..."]`); this module
// just records the choice and sets the `data-theme` attribute on <html>.

const KEY = "mathgym.theme";
const DEFAULT = "light";

// localStorage GETTERS throw SecurityError when storage is blocked (strict
// privacy modes, some embedded webviews). Every page calls applyTheme() first,
// so an unguarded access here would kill the whole page module. The theme
// simply doesn't persist in that case.
function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* not persisted */ }
}

export const THEMES = [
  { id: "light", label: "Daylight Blue", swatch: "#2563eb" },
  { id: "terminal", label: "Matrix Terminal", swatch: "#00ff41" },
  { id: "slate", label: "Slate Dark", swatch: "#3b82f6" },
];

export function getTheme() {
  const t = safeGet(KEY);
  return THEMES.some((x) => x.id === t) ? t : DEFAULT;
}

export function setTheme(id) {
  if (!THEMES.some((x) => x.id === id)) return;
  safeSet(KEY, id);
  document.documentElement.setAttribute("data-theme", id);
  applyFavicon();
}

// Per-theme favicon colors: { badge fill, radical stroke, corner radius }.
const FAVICON = {
  terminal: { badge: "#00ff41", mark: "#03130a", rx: 0 },
  light: { badge: "#2563eb", mark: "#ffffff", rx: 7 },
  slate: { badge: "#3b82f6", mark: "#ffffff", rx: 7 },
};

// The shared logo mark — a rounded badge with a radical (√). Reused for the
// header logo (themed via CSS classes) and the favicon (literal colors).
export function logoMarkup() {
  return '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<rect class="logo-badge" x="2" y="2" width="28" height="28" rx="6"/>' +
    '<path class="logo-mark" d="M6 16.5 l3 0 l3.6 7 l5.4 -14 l8 0" fill="none" ' +
    'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

// Build and install an SVG favicon matching the current theme.
export function applyFavicon() {
  const f = FAVICON[getTheme()] || FAVICON.light;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect x="2" y="2" width="28" height="28" rx="${f.rx}" fill="${f.badge}"/>` +
    `<path d="M6 16.5 l3 0 l3.6 7 l5.4 -14 l8 0" fill="none" stroke="${f.mark}" ` +
    `stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.type = "image/svg+xml";
  link.href = "data:image/svg+xml," + encodeURIComponent(svg);
}

// Apply the saved theme to <html> + favicon. (Pages also set data-theme inline in
// <head> to avoid a flash of the wrong theme before this module loads.)
export function applyTheme() {
  document.documentElement.setAttribute("data-theme", getTheme());
  applyFavicon();
}

// Build a small theme picker (segmented swatches) wired to setTheme.
export function themePicker() {
  const wrap = document.createElement("div");
  wrap.className = "theme-picker";
  const current = getTheme();
  for (const t of THEMES) {
    const btn = document.createElement("button");
    btn.className = "theme-swatch" + (t.id === current ? " active" : "");
    btn.title = t.label;
    btn.setAttribute("aria-label", `Theme: ${t.label}`);
    btn.style.setProperty("--sw", t.swatch);
    btn.addEventListener("click", () => {
      setTheme(t.id);
      wrap.querySelectorAll(".theme-swatch").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    wrap.appendChild(btn);
  }
  return wrap;
}
