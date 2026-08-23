/* Tiny DOM + random helpers (same names/idiom as blipwork's js/ui.js). */

/* ---------- the render root ----------
   The app used to reach straight for document / document.body / #app.
   That is fine while it owns the whole page, and wrong the moment it is
   MOUNTED inside another app (blipwork) — see js/mount.js. So there is
   now exactly one module-level root: the standalone points it at its own
   .ff-root wrapper at boot, the mount points it at the host's element,
   and every $ / $$ / toast() below scopes to it. Nothing else in the app
   is allowed to name document.body or #app again (verify.html §32b). */
let ROOT = null;
export function setRoot(node) { ROOT = node || null; }
export function getRoot() { return ROOT; }
const scope = () => ROOT || document;

export const $ = (sel, root) => (root || scope()).querySelector(sel);
export const $$ = (sel, root) => [...(root || scope()).querySelectorAll(sel)];

/* ---------- scrolling to the top of a new screen ----------
   Standalone: the page itself scrolls (window.scrollTo). Mounted: the app
   owns a box inside somebody else's page, so yanking THEIR window to the
   top would be rude and usually wrong — the host passes onScrollTop if it
   wants a scroll, otherwise nothing moves. */
let SCROLLER = null;
export function setScroller(fn) { SCROLLER = typeof fn === "function" ? fn : null; }
export function scrollToTop() { if (SCROLLER) SCROLLER(); }

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
   navigator.vibrate is missing on desktop and iOS, so always guard.
   Without user activation the browser BLOCKS the call and logs a console
   error — harness runs drive every mechanic synthetically (hundreds of
   calls per run), and console noise once buried a real bug (the q5 TDZ
   story). Skip what could not fire anyway; a real learner has always
   tapped before anything buzzes. */
export function buzz(ms = 12) {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch { /* ignore */ }
}

let toastTimer = null;
export function toast(msg, bad = false) {
  const old = $(".toast"); if (old) old.remove();
  clearTimeout(toastTimer);
  const t = el("div", "toast" + (bad ? " bad" : ""), msg);
  /* into the root, so a mounted app never leaves a toast behind in the
     host's page after destroy(). The document.body fallback only ever
     fires if something toasts before a root is set — neither entry point
     can (app.js and mount.js both call setRoot() first). */
  (ROOT || document.body).appendChild(t);
  toastTimer = setTimeout(() => t.remove(), bad ? 5200 : 2600);
}
