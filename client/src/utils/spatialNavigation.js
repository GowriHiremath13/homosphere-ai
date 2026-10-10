/**
 * Minimal spatial navigation for D-pad UIs.
 *  - Anything with [data-focusable] participates (use <FocusButton>).
 *  - Arrow keys move DOM focus to the geometrically nearest focusable in that direction.
 *  - If a [data-focus-trap] element exists (modal), navigation is confined to it.
 *  - Scrolling lists use [data-scroll]; the focused item is centred inside it (never scrolls the page).
 */
export const FOCUSABLE = '[data-focusable]:not([disabled]):not([aria-disabled="true"])';

function isVisible(el) {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const cs = window.getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}

const scopeOf = (root) => document.querySelector('[data-focus-trap]') || root || document;

export function getFocusables(root) {
  return Array.from(scopeOf(root).querySelectorAll(FOCUSABLE)).filter(isVisible);
}

const box = (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 };
};

export function findNext(current, dir, list) {
  const c = box(current);
  const horizontal = dir === 'left' || dir === 'right';
  let best = null;
  let bestScore = Infinity;
  for (const el of list) {
    if (el === current) continue;
    const r = box(el);
    const along = { right: r.cx - c.cx, left: c.cx - r.cx, down: r.cy - c.cy, up: c.cy - r.cy }[dir];
    if (along <= 1) continue; // not in that direction
    const perpGap = horizontal
      ? Math.max(0, Math.max(c.top, r.top) - Math.min(c.bottom, r.bottom))
      : Math.max(0, Math.max(c.left, r.left) - Math.min(c.right, r.right));
    const perpCentre = horizontal ? Math.abs(r.cy - c.cy) : Math.abs(r.cx - c.cx);
    const score = along + perpGap * 4 + perpCentre * 0.5; // strongly prefer items that line up
    if (score < bestScore) { bestScore = score; best = el; }
  }
  return best;
}

export function ensureVisible(el) {
  const sc = el.closest('[data-scroll]');
  if (!sc || sc.clientHeight === 0) return;
  const er = el.getBoundingClientRect();
  const cr = sc.getBoundingClientRect();
  const scale = cr.height / sc.clientHeight || 1; // the TV stage is CSS-scaled
  const delta = (er.top + er.height / 2 - (cr.top + cr.height / 2)) / scale;
  sc.scrollTop += delta;
}

export function focusEl(el) {
  if (!el) return;
  el.focus({ preventScroll: true });
  ensureVisible(el);
}

export function focusById(id) {
  const el = document.querySelector(`[data-focus-id="${id}"]`);
  if (el) focusEl(el);
  return Boolean(el);
}

export function focusInitial(root) {
  const trap = document.querySelector('[data-focus-trap]');
  const scope = trap || root.querySelector('[data-screen]') || root;
  const el = scope.querySelector(`[data-autofocus]${FOCUSABLE.slice(FOCUSABLE.indexOf(':not'))}`) || scope.querySelector(FOCUSABLE) || root.querySelector(FOCUSABLE);
  if (el) focusEl(el);
  return el;
}

export function moveFocus(dir, root) {
  const list = getFocusables(root);
  if (!list.length) return false;
  const active = document.activeElement;
  const current = list.includes(active) ? active : list.find((el) => active && el.contains(active));
  if (!current) { focusEl(list[0]); return true; }
  const next = findNext(current, dir, list);
  if (next) { focusEl(next); return true; }
  return false;
}
