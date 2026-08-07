/* Tiny DOM + random helpers (same names/idiom as blipwork's js/ui.js). */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function shuffled(a) {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}
/* pick n distinct members */
export function sample(a, n) { return shuffled(a).slice(0, n); }

/* a short buzz on phones — direction changes in the climb quest.
   navigator.vibrate is missing on desktop and iOS, so always guard. */
export function buzz(ms = 12) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch { /* ignore */ }
}

let toastTimer = null;
export function toast(msg, bad = false) {
  const old = $(".toast"); if (old) old.remove();
  clearTimeout(toastTimer);
  const t = el("div", "toast" + (bad ? " bad" : ""), msg);
  document.body.appendChild(t);
  toastTimer = setTimeout(() => t.remove(), bad ? 5200 : 2600);
}
