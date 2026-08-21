/* ============================================================
   VARIABLE SLIDER — the discovery mechanic   ★ session 2
   ------------------------------------------------------------
   One graph, ONE variable, everything else frozen. The learner
   drags through every stop and watches. The app says nothing
   about what happens: the options afterwards are where the
   learner commits to what they saw, and the method card is the
   only place the finding is ever stated (Circle Quest's
   no-spoilers rule).

   Three promises this mechanic keeps:

     1. The window is fixed for the whole range. It is computed
        once, from every curve the slider can produce, so the
        picture never re-zooms under the finger. A graph that
        changes its own scale mid-drag teaches nothing.
     2. Stops snap — whole numbers or halves, never 1,73.
     3. The question stays locked until EVERY stop has been
        visited. Half a drag is half a discovery.

   Deliberately no requestAnimationFrame: the re-render happens
   synchronously inside the pointer handler, exactly like the
   other mechanics (and the browser preview pane never fires rAF).

   opts: {
     name        the variable's letter, shown live ("a = −1,5")
     values      every stop, in order (whole numbers or halves)
     specOf(v)   → a ready spec for that value; every spec MUST
                 share one window (the caller sizes it once)
     eqOf(v)     → optional live equation HTML above the graph
     start       index to open on (default: the middle stop)
     onChange({value, index, seen, total})
     onComplete()   fires once, when every stop has been visited
     freeDrag    qK's no-gate rounds (R2/R3/R4, her ruling 2026-08-21):
                 the drag is a reading/exploring AID, never a lock — the
                 whole point is that a static picture never taught
                 anyone's eyes anything, but a meaningless "3/7" counter
                 with nothing gated behind it would be its own kind of
                 lie. onComplete() fires once, immediately, with the
                 slider already at opts.start; the seen-count readout
                 (vs-count) stays hidden all along, never shown then
                 hidden. Only R1's discovery round keeps the real gate.
   }
   ============================================================ */
import { renderFunction } from "./function-graph.js";
import { fmtComma } from "../check.js";
import { buzz } from "../ui.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const div = (cls, html) => {
  const n = document.createElement("div");
  n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export function varSlider(host, opts) {
  const { name, values, specOf, eqOf, onChange, onComplete, freeDrag } = opts;
  const n = values.length;
  /* every stop is rendered up front: the window can then be proved
     identical across the range, and a drag never pays for a rebuild */
  const specs = values.map((v) => specOf(v));

  let i = Number.isInteger(opts.start) ? clamp(opts.start, 0, n - 1) : Math.floor((n - 1) / 2);
  const seen = new Set([i]);
  /* freeDrag: there is no lock, so "complete" is true from the first
     paint — the seen-count would otherwise show a live "1/7" climbing
     toward a gate that never closes, which is worse than no counter. */
  let complete = !!freeDrag;

  const wrap = div("vs");
  const eqLine = div("vs-eq");
  const gbox = div("vs-graph");
  const bar = div("vs-bar");
  const read = div("vs-read");
  const count = div("vs-count");
  if (freeDrag) count.hidden = true;   // no gate exists, so no "N/total" to meter it
  const track = div("vs-track");
  const fill = div("vs-seen");
  const knob = div("vs-knob");
  track.setAttribute("tabindex", "0");
  track.setAttribute("role", "slider");
  track.setAttribute("aria-label", String(name));

  const tickEls = [];
  for (let k = 0; k < n; k++) {
    const t = div("vs-tick");
    t.style.left = pct(k);
    track.appendChild(t);
    tickEls.push(t);
  }
  track.append(fill, knob);
  bar.append(read, track, count);
  wrap.append(eqLine, gbox, bar);
  host.appendChild(wrap);

  function pct(k) { return (n === 1 ? 50 : (k / (n - 1)) * 100) + "%"; }

  function paintGraph() {
    gbox.innerHTML = renderFunction(specs[i]);
    if (eqOf) eqLine.innerHTML = eqOf(values[i]);
    else eqLine.style.display = "none";
  }
  function paintBar() {
    read.innerHTML = `${name} = <b>${fmtComma(values[i])}</b>`;
    knob.style.left = pct(i);
    tickEls.forEach((t, k) => t.classList.toggle("seen", seen.has(k)));
    const lo = Math.min(...seen), hi = Math.max(...seen);
    fill.style.left = pct(lo);
    fill.style.width = (n === 1 ? 0 : ((hi - lo) / (n - 1)) * 100) + "%";
    if (!freeDrag) count.textContent = `${seen.size}/${n}`;
    wrap.classList.toggle("done", complete);
    track.setAttribute("aria-valuenow", String(values[i]));
  }

  function setIndex(k) {
    k = clamp(Math.round(k), 0, n - 1);
    const moved = k !== i;
    const fresh = !seen.has(k);
    i = k;
    if (fresh) { seen.add(k); buzz(6); }
    if (moved) paintGraph();
    paintBar();
    if (moved && onChange) onChange({ value: values[i], index: i, seen: seen.size, total: n });
    if (!complete && seen.size === n) {
      complete = true;
      buzz(26);
      paintBar();
      if (onComplete) onComplete();
    }
    return i;
  }

  /* client x → the nearest stop */
  function stopAt(ev) {
    const r = track.getBoundingClientRect();
    if (!r.width) return i;
    return clamp(Math.round(((ev.clientX - r.left) / r.width) * (n - 1)), 0, n - 1);
  }

  const down = (ev) => {
    ev.preventDefault();
    try { track.setPointerCapture(ev.pointerId); } catch { /* not all browsers */ }
    track.focus({ preventScroll: true });
    setIndex(stopAt(ev));
    const move = (e) => { e.preventDefault(); setIndex(stopAt(e)); };
    const up = () => {
      track.removeEventListener("pointermove", move);
      track.removeEventListener("pointerup", up);
      track.removeEventListener("pointercancel", up);
      try { track.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    };
    track.addEventListener("pointermove", move);
    track.addEventListener("pointerup", up);
    track.addEventListener("pointercancel", up);
  };
  track.addEventListener("pointerdown", down);
  /* a keyboard is a perfectly good way to walk a range */
  track.addEventListener("keydown", (ev) => {
    const step = ev.key === "ArrowRight" || ev.key === "ArrowUp" ? 1
      : ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -1 : 0;
    if (!step) return;
    ev.preventDefault();
    setIndex(i + step);
  });

  paintGraph();
  paintBar();

  const ctl = {
    setIndex,                                  // verify drives the range with this
    index: () => i,
    value: () => values[i],
    values: () => values.slice(),
    spec: () => specs[i],
    specs: () => specs.slice(),
    graph: () => gbox,
    seen: () => seen.size,
    isComplete: () => complete,
  };
  /* every discovery build hands back a `.sliders` array, whether it
     mounted one panel or two — the harness walks that one shape */
  ctl.sliders = [ctl];
  /* freeDrag fires its "done" once, right here, before the mechanic ever
     returns control — the chip/keypad surface it unlocks must be there
     from the very first paint, not after some hidden requirement */
  if (freeDrag && onComplete) onComplete();
  return ctl;
}

/* two panels side by side (the q-vs-c contrast): both must be
   dragged all the way before the question opens */
export function sliderPair(host, a, b, onComplete) {
  const wrap = div("vs-pair");
  const boxA = div("vs-panel"), boxB = div("vs-panel");
  if (a.title) boxA.appendChild(div("vs-title", a.title));
  if (b.title) boxB.appendChild(div("vs-title", b.title));
  wrap.append(boxA, boxB);
  host.appendChild(wrap);

  /* declared before the panels are built: a one-stop slider would
     report itself complete during construction, and a half-built
     pair must never be asked whether it is finished */
  let ca = null, cb = null, fired = false;
  const both = () => {
    if (fired || !ca || !cb || !ca.isComplete() || !cb.isComplete()) return;
    fired = true;
    if (onComplete) onComplete();
  };
  ca = varSlider(boxA, { ...a, onComplete: both });
  cb = varSlider(boxB, { ...b, onComplete: both });
  both();

  return {
    sliders: [ca, cb],
    isComplete: () => ca.isComplete() && cb.isComplete(),
  };
}
