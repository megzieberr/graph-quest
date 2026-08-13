/* ============================================================
   INTERACTIVE GRAPH LAYERS   ★ the heart of this app
   ------------------------------------------------------------
   Six mechanics that make the learner DO the thing instead of
   reading about it. Every one sits on top of the to-scale
   function-graph engine and uses its single affine map (and its
   inverse) so a finger position is real maths, not a guess.

     pointDrop   drag a point onto the curve   (P(5;k) lies on f)
     curtain     pull a shade from a boundary  (domain & range)
     climb       walk a point LEFT → RIGHT only (increasing/decreasing)
     signPaint   mark + and − on each piece    (f(x) > 0, f·g < 0)
     cutSockets  place the vertical cut lines  (f > g, step 1)
     sweep       drag the scan line, section by section (f > g, step 2)
     comparePaint mark + and − between TWO curves (f above/below g)   ★ session 5

   Deliberately no requestAnimationFrame: every update happens
   synchronously inside the pointer handler. (The browser preview
   pane never fires rAF, and synchronous is more responsive on a
   phone anyway.)
   ============================================================ */
import { computeFunction, renderFunction, curvePaths } from "./function-graph.js";
import { makeFn, curveDomain, signAt } from "../funclib.js";
import { fmtComma } from "../check.js";
import { buzz } from "../ui.js";

const SVGNS = "http://www.w3.org/2000/svg";
const N = (v) => Math.round(v * 100) / 100;

function svgEl(name, attrs = {}) {
  const n = document.createElementNS(SVGNS, name);
  for (const k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  return n;
}

/* ---- render the base picture into a host element, return handles ---- */
function mount(host, spec) {
  host.innerHTML = renderFunction(spec);
  const svg = host.querySelector("svg");
  const g = computeFunction(spec);
  return { svg, g };
}

/* client pixel → viewBox coordinate.
   The SVG keeps its aspect ratio (xMidYMid meet), so work out the
   uniform scale and any letterbox offset rather than assuming. */
function toLocal(svg, g, ev) {
  const r = svg.getBoundingClientRect();
  if (!r.width || !r.height) return { px: 0, py: 0 };
  const s = Math.min(r.width / g.W, r.height / g.H);
  const offX = (r.width - g.W * s) / 2, offY = (r.height - g.H * s) / 2;
  return { px: (ev.clientX - r.left - offX) / s, py: (ev.clientY - r.top - offY) / s };
}

/* attach a drag: onMove(local, ev) fires for down + move, onUp on release */
function drag(svg, g, onMove, onUp) {
  const down = (ev) => {
    ev.preventDefault();
    try { svg.setPointerCapture(ev.pointerId); } catch { /* not all browsers */ }
    onMove(toLocal(svg, g, ev), ev);
    const move = (e) => { e.preventDefault(); onMove(toLocal(svg, g, e), e); };
    const up = (e) => {
      svg.removeEventListener("pointermove", move);
      svg.removeEventListener("pointerup", up);
      svg.removeEventListener("pointercancel", up);
      try { svg.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      if (onUp) onUp(toLocal(svg, g, e), e);
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
  };
  svg.addEventListener("pointerdown", down);
  return () => svg.removeEventListener("pointerdown", down);
}

/* the drawn path of one curve, as a <path> we can clip or restyle */
function curveNode(cv, g, cls) {
  const d = curvePaths(cv, g).join(" ");
  return svgEl("path", { class: cls, d });
}

/* ============================================================
   1. POINT DROP — "P(5 ; k) lies on f"
   ------------------------------------------------------------
   The point is locked to one line (vertical for an unknown y,
   horizontal for an unknown x) and snaps when it reaches the
   curve. Snapping IS the lesson: "on the graph" means the
   coordinates fit the equation.

   opts: { spec, curve, at, mode:"v"|"h", tol, onSnap(value) }
   ============================================================ */
export function pointDrop(host, opts) {
  const { spec, curve, at, mode = "v", onSnap } = opts;
  const { svg, g } = mount(host, spec);
  const cv = spec.curves[curve], f = makeFn(cv);
  const { xmin, xmax, ymin, ymax } = g.win;
  const tol = opts.tol ?? (mode === "v" ? (ymax - ymin) * 0.045 : (xmax - xmin) * 0.045);

  /* the true landing spot */
  const target = mode === "v" ? { x: at, y: f(at) } : { x: solveForX(cv, at, xmin, xmax), y: at };
  let cur = mode === "v"
    ? { x: at, y: clamp(target.y + (ymax - ymin) * (target.y > (ymin + ymax) / 2 ? -0.34 : 0.34), ymin, ymax) }
    : { x: clamp(target.x + (xmax - xmin) * (target.x > (xmin + xmax) / 2 ? -0.34 : 0.34), xmin, xmax), y: at };
  let locked = false;

  /* the rail the point may travel along */
  const rail = mode === "v"
    ? svgEl("line", { class: "iv-rail", x1: N(g.X(at)), y1: N(g.Y(ymin)), x2: N(g.X(at)), y2: N(g.Y(ymax)) })
    : svgEl("line", { class: "iv-rail", x1: N(g.X(xmin)), y1: N(g.Y(at)), x2: N(g.X(xmax)), y2: N(g.Y(at)) });
  const ring = svgEl("circle", { class: "iv-handle-ring", r: 13 });
  const dot = svgEl("circle", { class: "iv-handle", r: 7 });
  const lab = svgEl("text", { class: "fg-plab", "text-anchor": "middle", "dominant-baseline": "middle" });
  const hit = svgEl("rect", { class: "iv-hit", x: 0, y: 0, width: g.W, height: g.H });
  svg.append(rail, hit, ring, dot, lab);

  function paint() {
    const px = g.X(cur.x), py = g.Y(cur.y);
    ring.setAttribute("cx", N(px)); ring.setAttribute("cy", N(py));
    dot.setAttribute("cx", N(px)); dot.setAttribute("cy", N(py));
    dot.setAttribute("class", locked ? "iv-snap" : "iv-handle");
    /* label sits clear of the ring: above-right for a vertical rail */
    lab.setAttribute("x", N(px + (mode === "v" ? 17 : 0)));
    lab.setAttribute("y", N(py + (mode === "v" ? -17 : -21)));
    lab.setAttribute("text-anchor", mode === "v" ? "start" : "middle");
    /* opts.symbol (e.g. "k") keeps the unknown SYMBOLIC — used when the
       follow-up wants an exact answer (a surd). Printing a live decimal
       there leaks a rounded version of the very answer being asked for. */
    if (opts.symbol) {
      lab.textContent = mode === "v"
        ? `(${fmtComma(at)} ; ${opts.symbol})`
        : `(${opts.symbol} ; ${fmtComma(at)})`;
    } else {
      lab.textContent = locked
        ? `(${fmtComma(N(target.x))} ; ${fmtComma(N(target.y))})`
        : `(${fmtComma(N(cur.x))} ; ${fmtComma(N(cur.y))})`;
    }
  }
  paint();

  drag(svg, g, ({ px, py }) => {
    if (locked) return;
    if (mode === "v") cur.y = clamp(g.yAt(py), ymin, ymax);
    else cur.x = clamp(g.xAt(px), xmin, xmax);
    const off = mode === "v" ? Math.abs(cur.y - target.y) : Math.abs(cur.x - target.x);
    if (off <= tol) {
      cur = { x: target.x, y: target.y };
      locked = true;
      buzz(18);
      paint();
      if (onSnap) onSnap(mode === "v" ? target.y : target.x);
      return;
    }
    paint();
  });

  return { isSnapped: () => locked, target };
}

/* x such that f(x) = y0 — numeric, inside the window (first crossing) */
function solveForX(cv, y0, xmin, xmax) {
  const f = makeFn(cv), STEPS = 2000, dx = (xmax - xmin) / STEPS;
  let px = xmin, pv = f(px) - y0;
  for (let i = 1; i <= STEPS; i++) {
    const x = xmin + i * dx, v = f(x) - y0;
    if (Number.isFinite(pv) && Number.isFinite(v) && (pv === 0 || pv * v < 0)) {
      let lo = px, hi = x, flo = pv;
      for (let k = 0; k < 60; k++) {
        const m = (lo + hi) / 2, vm = f(m) - y0;
        if (flo * vm <= 0) hi = m; else { lo = m; flo = vm; }
      }
      return (lo + hi) / 2;
    }
    px = x; pv = v;
  }
  return NaN;
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ============================================================
   2. CURTAIN — domain & range
   ------------------------------------------------------------
   A boundary line is given (a turning point's y, an asymptote, a
   semicircle's edge). The learner drags a shade away from it; the
   piece of the graph inside the shade lights up. They SEE which
   side the graph lives on before choosing ≥ or ≤.

   opts: { spec, boundary:{y}|{x}, label, onSweep(dir) }
         dir is "up"|"down" for a y-boundary, "left"|"right" for x.
   ============================================================ */
export function curtain(host, opts) {
  const { spec, boundary, onSweep } = opts;
  const { svg, g } = mount(host, spec);
  const { xmin, xmax, ymin, ymax } = g.win;
  const horiz = boundary.y !== undefined;
  const b = horiz ? boundary.y : boundary.x;
  let dir = null;

  const clipId = "ivclip" + Math.random().toString(36).slice(2, 8);
  const clipRect = svgEl("rect", { x: 0, y: 0, width: 0, height: 0 });
  const cp = svgEl("clipPath", { id: clipId });
  cp.appendChild(clipRect);
  const defs = svgEl("defs"); defs.appendChild(cp);

  const shade = svgEl("rect", { class: "iv-curtain", x: 0, y: 0, width: 0, height: 0 });
  const litG = svgEl("g", { "clip-path": `url(#${clipId})` });
  (spec.curves || []).forEach((cv) => litG.appendChild(curveNode(cv, g, "iv-lit")));

  const line = horiz
    ? svgEl("line", { class: "iv-bound", x1: N(g.X(xmin)), y1: N(g.Y(b)), x2: N(g.X(xmax)), y2: N(g.Y(b)) })
    : svgEl("line", { class: "iv-bound", x1: N(g.X(b)), y1: N(g.Y(ymin)), x2: N(g.X(b)), y2: N(g.Y(ymax)) });
  const blab = svgEl("text", {
    class: "iv-boundlab",
    x: horiz ? N(g.X(xmin) + 4) : N(g.X(b) + 5),
    y: horiz ? N(g.Y(b) - 8) : N(g.Y(ymax) + 9),
    "text-anchor": "start",
  });
  blab.textContent = opts.label || (horiz ? `y = ${fmtComma(b)}` : `x = ${fmtComma(b)}`);

  const grip = svgEl("g", { class: "iv-grip" });
  const gripDot = svgEl("circle", { class: "iv-handle", r: 8,
    cx: horiz ? N((g.X(xmin) + g.X(xmax)) / 2) : N(g.X(b)),
    cy: horiz ? N(g.Y(b)) : N((g.Y(ymin) + g.Y(ymax)) / 2) });
  grip.appendChild(gripDot);
  const hit = svgEl("rect", { class: "iv-hit", x: 0, y: 0, width: g.W, height: g.H });

  svg.append(defs, shade, litG, line, blab, hit, grip);

  function setShade(x, y, w, h) {
    [shade, clipRect].forEach((r) => {
      r.setAttribute("x", N(x)); r.setAttribute("y", N(y));
      r.setAttribute("width", N(Math.max(0, w))); r.setAttribute("height", N(Math.max(0, h)));
    });
  }

  drag(svg, g, ({ px, py }) => {
    if (horiz) {
      const v = g.yAt(py);
      const nd = v > b ? "up" : "down";
      const top = nd === "up" ? g.Y(ymax) : g.Y(b);
      const bot = nd === "up" ? g.Y(b) : g.Y(ymin);
      setShade(g.X(xmin), top, g.X(xmax) - g.X(xmin), bot - top);
      gripDot.setAttribute("cy", N(clamp(py, g.Y(ymax), g.Y(ymin))));
      if (nd !== dir) { dir = nd; buzz(10); if (onSweep) onSweep(dir); }
    } else {
      const v = g.xAt(px);
      const nd = v > b ? "right" : "left";
      const l = nd === "right" ? g.X(b) : g.X(xmin);
      const r = nd === "right" ? g.X(xmax) : g.X(b);
      setShade(l, g.Y(ymax), r - l, g.Y(ymin) - g.Y(ymax));
      gripDot.setAttribute("cx", N(clamp(px, g.X(xmin), g.X(xmax))));
      if (nd !== dir) { dir = nd; buzz(10); if (onSweep) onSweep(dir); }
    }
  });

  return { direction: () => dir };
}

/* ============================================================
   3. CLIMB — increasing / decreasing, felt in the hand
   ------------------------------------------------------------
   THE headline mechanic. The point may only ever move RIGHT: a
   backwards drag is ignored, so the finger is forced to rise and
   fall exactly as the graph does. Kids who read a graph from
   right to left cannot do that here.

   opts: { spec, curve, from, to, onMove({x,y,dir,frac}), onDone() }
   ============================================================ */
export function climb(host, opts) {
  const { spec, curve, onMove, onDone } = opts;
  const { svg, g } = mount(host, spec);
  const cv = spec.curves[curve], f = makeFn(cv);
  const dom = curveDomain(cv, g.win.xmin, g.win.xmax);
  const from = opts.from ?? dom.lo, to = opts.to ?? dom.hi;

  let x = from, dir = 0, done = false;
  let runs = [];            // finished trail runs: {dir, pts:[[px,py]]}
  let run = { dir: 0, pts: [[g.X(from), g.Y(f(from))]] };

  const trailG = svgEl("g");
  const ring = svgEl("circle", { class: "iv-handle-ring", r: 15 });
  const dot = svgEl("circle", { class: "iv-handle", r: 8 });
  const hit = svgEl("rect", { class: "iv-hit", x: 0, y: 0, width: g.W, height: g.H });
  svg.append(trailG, hit, ring, dot);

  function paintTrail() {
    trailG.textContent = "";
    [...runs, run].forEach((r) => {
      if (r.pts.length < 2) return;
      const d = "M " + r.pts.map(([px, py]) => `${N(px)} ${N(py)}`).join(" L ");
      trailG.appendChild(svgEl("path", { class: "iv-trail " + (r.dir >= 0 ? "up" : "down"), d }));
    });
  }
  function paintDot() {
    const px = g.X(x), py = g.Y(f(x));
    ring.setAttribute("cx", N(px)); ring.setAttribute("cy", N(py));
    dot.setAttribute("cx", N(px)); dot.setAttribute("cy", N(py));
  }
  paintDot();

  drag(svg, g, ({ px }) => {
    if (done) return;
    const want = g.xAt(px);
    /* THE RULE: never go back. Take the furthest right we have reached. */
    const nx = clamp(Math.max(x, want), from, to);
    if (nx <= x + 1e-9) return;
    const prevY = f(x);
    x = nx;
    const y = f(x);
    const nd = y > prevY + 1e-9 ? 1 : y < prevY - 1e-9 ? -1 : dir;
    if (nd !== dir && dir !== 0) {           // a real turn — break the trail run
      runs.push(run);
      run = { dir: nd, pts: [run.pts[run.pts.length - 1]] };
      buzz(22);
    }
    dir = nd;
    run.dir = dir;
    run.pts.push([g.X(x), g.Y(y)]);
    paintTrail(); paintDot();
    if (onMove) onMove({ x, y, dir, frac: (x - from) / (to - from) });
    if (x >= to - 1e-9 && !done) { done = true; buzz(30); if (onDone) onDone(); }
  });

  return {
    isDone: () => done,
    reset() {
      x = from; dir = 0; done = false; runs = [];
      run = { dir: 0, pts: [[g.X(from), g.Y(f(from))]] };
      paintTrail(); paintDot();
      if (onMove) onMove({ x, y: f(x), dir: 0, frac: 0 });
    },
  };
}

/* ============================================================
   4. SIGN PAINT — + and − on every piece, the way she marks a board
   ------------------------------------------------------------
   opts: { spec, sections, curves:[i…], onChange(state, allMarked) }
   state[curveIndex][sectionIndex] = +1 | -1 | 0 (unmarked)

   Numbers the sections along the top of the graph (①②③…), same
   labelling sweep()/signTable() already use — quest 5's rebuild
   (fix day, 2026-08-13) puts this mechanic straight after cutSockets
   with nothing else on screen, so the sections need their own
   numbering rather than borrowing it from a table header that no
   longer exists.
   ============================================================ */
const TONES = { a: "var(--fg-a)", b: "var(--fg-b)", c: "var(--fg-c)" };

export function signPaint(host, opts) {
  const { spec, sections, curves, onChange, names } = opts;
  const { svg, g } = mount(host, spec);
  const { ymax } = g.win;
  sections.forEach((sec, si) => {
    const lab = svgEl("text", {
      class: "iv-sectlab", x: N((g.X(sec.x0) + g.X(sec.x1)) / 2), y: N(g.Y(ymax) + 12),
      "text-anchor": "middle", "dominant-baseline": "middle",
    });
    lab.textContent = "①②③④⑤⑥⑦⑧"[si] || String(si + 1);
    svg.appendChild(lab);
  });
  const state = {};
  const nodes = [];

  /* two curves can sit at almost the same height in a section (quest 5's
     product rounds — that is the whole point of the question) — a mark
     placed purely by curve height then lands both boxes on top of each
     other. A fixed horizontal spread per curve (only when there is more
     than one) keeps every box tappable regardless of how close the two
     curves happen to be; a single-curve round is untouched (offset 0).
     Fix day, 2026-08-13 — caught during quest 5's rebuild visual pass:
     5 of 26 sampled productSign rounds had two overlapping paint boxes. */
  const SPREAD = 26;
  curves.forEach((ci, cidx) => {
    state[ci] = {};
    const cv = spec.curves[ci], f = makeFn(cv);
    const tone = TONES[cv.tone] || "var(--accent)";
    const xOffset = curves.length > 1 ? (cidx - (curves.length - 1) / 2) * SPREAD : 0;
    sections.forEach((sec, si) => {
      const y = f(sec.mid);
      if (!Number.isFinite(y) || y < g.win.ymin || y > g.win.ymax) return;   // no graph here
      state[ci][si] = 0;
      const px = g.X(sec.mid) + xOffset;
      /* sit the mark just off the curve, on the side away from the axis */
      const py = g.Y(y) + (y >= 0 ? -17 : 17);
      const slot = svgEl("rect", { class: "iv-signslot", x: N(px - 11), y: N(py - 11), width: 22, height: 22, rx: 3 });
      slot.style.stroke = tone;                     // the box wears its curve's colour
      const t = svgEl("text", { class: "iv-sign", x: N(px), y: N(py), "text-anchor": "middle", "dominant-baseline": "middle" });
      t.textContent = "";
      /* the curve's letter beside the box, so ownership is never a guess */
      if (names && names[cidx]) {
        const own = svgEl("text", { class: "iv-signowner", x: N(px - 15), y: N(py), "text-anchor": "end", "dominant-baseline": "middle" });
        own.textContent = names[cidx];
        own.style.fill = tone;
        svg.appendChild(own);
      }
      const tap = svgEl("rect", { class: "iv-hit", x: N(px - 16), y: N(py - 16), width: 32, height: 32 });
      tap.style.cursor = "pointer";
      tap.addEventListener("pointerdown", (ev) => {
        ev.preventDefault(); ev.stopPropagation();
        const nv = state[ci][si] === 0 ? 1 : state[ci][si] === 1 ? -1 : 0;
        state[ci][si] = nv;
        t.textContent = nv === 1 ? "+" : nv === -1 ? "−" : "";
        t.setAttribute("class", "iv-sign " + (nv === 1 ? "plus" : nv === -1 ? "minus" : ""));
        buzz(8);
        report();
      });
      svg.append(slot, t, tap);
      nodes.push({ ci, si, t, slot });
    });
  });

  function allMarked() {
    return curves.every((ci) => Object.values(state[ci]).every((v) => v !== 0));
  }
  function report() { if (onChange) onChange(state, allMarked()); }
  report();

  return {
    state: () => state,
    allMarked,
    /* colour every mark right/wrong against the real signs.
       Inline STYLE, not attributes — a stylesheet rule silently beats an
       SVG presentation attribute, which is exactly how the first version
       shipped verdict colours that never showed up on screen. */
    reveal(truth) {
      nodes.forEach(({ ci, si, slot }) => {
        const ok = state[ci][si] === truth[ci][si];
        slot.style.stroke = ok ? "var(--good)" : "var(--bad)";
        slot.style.fill = ok ? "rgba(52,211,153,.14)" : "rgba(251,113,133,.18)";
        slot.style.strokeWidth = ok ? "1" : "2";
      });
    },
    countLeft() {
      let n = 0;
      curves.forEach((ci) => Object.values(state[ci]).forEach((v) => { if (v === 0) n++; }));
      return n;
    },
  };
}

/* ============================================================
   4.5 COMPARE PAINT — is f above or below g, per section   ★ session 5
   ------------------------------------------------------------
   Round D's stamp move (Law 4's +/− painting, applied to TWO curves
   instead of one). Unlike signPaint (a curve's sign against the
   x-axis), the mark here lands BETWEEN the two curves, at their
   mid-height in that section — a finger genuinely points at "which
   one is physically higher here", not at a fixed axis.

   opts: { spec, curveA, curveB, sections, onChange(state, allMarked) }
   state[sectionIndex] = +1 (A above B) | −1 (A below B) | 0 (unmarked)
   ============================================================ */
export function comparePaint(host, opts) {
  const { spec, curveA = 0, curveB = 1, sections, onChange } = opts;
  const { svg, g } = mount(host, spec);
  const fA = makeFn(spec.curves[curveA]), fB = makeFn(spec.curves[curveB]);
  const state = {};
  const nodes = [];

  sections.forEach((sec, si) => {
    const ya = fA(sec.mid), yb = fB(sec.mid);
    if (!Number.isFinite(ya) || !Number.isFinite(yb)) return;    // curve gap here — no stamp
    state[si] = 0;
    const px = g.X(sec.mid);
    const midY = clamp((ya + yb) / 2, g.win.ymin + 0.3, g.win.ymax - 0.3);
    const py = g.Y(midY);
    const slot = svgEl("rect", { class: "iv-signslot", x: N(px - 11), y: N(py - 11), width: 22, height: 22, rx: 3 });
    const t = svgEl("text", { class: "iv-sign", x: N(px), y: N(py), "text-anchor": "middle", "dominant-baseline": "middle" });
    t.textContent = "";
    const tap = svgEl("rect", { class: "iv-hit", x: N(px - 16), y: N(py - 16), width: 32, height: 32 });
    tap.style.cursor = "pointer";
    tap.addEventListener("pointerdown", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const nv = state[si] === 0 ? 1 : state[si] === 1 ? -1 : 0;
      state[si] = nv;
      t.textContent = nv === 1 ? "+" : nv === -1 ? "−" : "";
      t.setAttribute("class", "iv-sign " + (nv === 1 ? "plus" : nv === -1 ? "minus" : ""));
      buzz(8);
      report();
    });
    svg.append(slot, t, tap);
    nodes.push({ si, t, slot });
  });

  function allMarked() { return nodes.every((n) => state[n.si] !== 0); }
  function report() { if (onChange) onChange(state, allMarked()); }
  report();

  return {
    state: () => state,
    allMarked,
    /* colour every mark right/wrong against the true sign of f − g */
    reveal(truth) {
      nodes.forEach(({ si, slot }) => {
        const ok = state[si] === truth[si];
        slot.style.stroke = ok ? "var(--good)" : "var(--bad)";
        slot.style.fill = ok ? "rgba(52,211,153,.14)" : "rgba(251,113,133,.18)";
        slot.style.strokeWidth = ok ? "1" : "2";
      });
    },
  };
}

/* ============================================================
   5. CUT SOCKETS — where does a vertical line belong?
   ------------------------------------------------------------
   Candidates are shown as tappable sockets on the x-axis, mixing
   the real boundaries (intersections, asymptotes, intercepts) with
   decoys that must NOT get a line (a turning point's x, say).
   Tapping is phone-friendly: no dragging a hairline into place.

   opts: { spec, candidates:[{x,why}], onChange(chosenSet) }
   ============================================================ */
export function cutSockets(host, opts) {
  const { spec, candidates, onChange } = opts;
  const { svg, g } = mount(host, spec);
  const { ymin, ymax } = g.win;
  const chosen = new Set();
  const marks = [];
  let locked = false;

  candidates.forEach((c, i) => {
    const px = g.X(c.x);
    const line = svgEl("line", { class: "iv-socket", x1: N(px), y1: N(g.Y(ymin)), x2: N(px), y2: N(g.Y(ymax)) });
    const knob = svgEl("circle", { class: "iv-sockdot", cx: N(px), cy: N(g.Y(0)), r: 6.5 });
    /* the knob is the most inviting tap target — let the tap fall through
       to the hit strip underneath it, or a finger on the knob does nothing */
    knob.style.pointerEvents = "none";
    const tap = svgEl("rect", { class: "iv-hit", x: N(px - 17), y: 0, width: 34, height: g.H });
    tap.style.cursor = "pointer";
    tap.addEventListener("pointerdown", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      if (locked) return;
      if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
      const on = chosen.has(i);
      line.setAttribute("class", "iv-socket" + (on ? " on" : ""));
      knob.setAttribute("class", "iv-sockdot" + (on ? " on" : ""));
      buzz(8);
      if (onChange) onChange(new Set(chosen));
    });
    svg.append(line, tap, knob);
    marks.push({ line, knob, c });
  });

  return {
    chosen: () => new Set(chosen),
    lock() { locked = true; },
    reveal(requiredIdx) {
      locked = true;
      marks.forEach((m, i) => {
        const should = requiredIdx.has(i), did = chosen.has(i);
        /* inline style — the .iv-sockdot stylesheet rule beats attributes */
        m.knob.style.fill = should === did ? "var(--good)" : "var(--bad)";
        m.knob.style.stroke = should === did ? "var(--good)" : "var(--bad)";
        if (should) m.line.setAttribute("class", "iv-socket on");
      });
    },
  };
}

/* ============================================================
   6. SWEEP — the scan line, section by section, left to right
   ------------------------------------------------------------
   The line will not pass a section until that section has been
   answered, and it never goes back. Answering left to right is
   what builds the interval answer in the right order.

   opts: { spec, sections, onEnter(section, index),
           plain?:bool   — no section fill as it passes (Round D:
                           "no shading, no highlighted regions, just
                           the line and their eyes" — only the
                           numbers and the scan line show),
           open?:bool    — no per-section gate: the whole width is
                           free to drag from the start (Round D has
                           no per-section question to answer first) }
   host app calls .unlock() once the section's question is right
   (skip this when opts.open is true — nothing to unlock).
   ============================================================ */
export function sweep(host, opts) {
  const { spec, sections, onEnter, plain, open } = opts;
  const { svg, g } = mount(host, spec);
  const { xmin, xmax, ymin, ymax } = g.win;

  let idx = -1;                                    // section the scan line is inside
  let reached = -1;                                // furthest section ever entered
  let limit = open ? xmax : sections[0].x1;         // may not pass this until unlocked
  let x = xmin;

  const bandG = svgEl("g");
  sections.forEach((s, i) => {
    const rect = svgEl("rect", {
      class: "iv-sect", x: N(g.X(s.x0)), y: N(g.Y(ymax)),
      width: N(g.X(s.x1) - g.X(s.x0)), height: N(g.Y(ymin) - g.Y(ymax)),
      opacity: 0,
    });
    const t = svgEl("text", {
      class: "iv-sectlab", x: N((g.X(s.x0) + g.X(s.x1)) / 2), y: N(g.Y(ymax) + 12),
      "text-anchor": "middle", "dominant-baseline": "middle",
    });
    t.textContent = "①②③④⑤⑥⑦⑧"[i] || String(i + 1);
    bandG.append(rect, t);
    s._rect = rect;
  });
  sections.forEach((s, i) => {
    if (i === 0) return;
    bandG.appendChild(svgEl("line", { class: "fg-vline", x1: N(g.X(s.x0)), y1: N(g.Y(ymin)), x2: N(g.X(s.x0)), y2: N(g.Y(ymax)) }));
  });

  const scan = svgEl("line", { class: "iv-scan", x1: N(g.X(x)), y1: N(g.Y(ymin)), x2: N(g.X(x)), y2: N(g.Y(ymax)) });
  const grip = svgEl("circle", { class: "iv-handle", r: 8, cx: N(g.X(x)), cy: N(g.Y(ymax) + 6) });
  const hit = svgEl("rect", { class: "iv-hit", x: 0, y: 0, width: g.W, height: g.H });
  svg.append(bandG, hit, scan, grip);

  function paint() {
    scan.setAttribute("x1", N(g.X(x))); scan.setAttribute("x2", N(g.X(x)));
    grip.setAttribute("cx", N(g.X(x)));
  }
  function enter(i) {
    if (i === idx) return;
    idx = i;
    if (i > reached) reached = i;
    if (!plain) {
      /* the shading follows the FURTHEST point reached, not where the line
         happens to be now — sliding back to re-check a section must never
         un-paint the work already done */
      sections.forEach((s, k) => s._rect.setAttribute("opacity", k === i ? 1 : k <= reached ? 0.55 : 0));
      sections.forEach((s, k) => s._rect.setAttribute("class", k < reached ? "iv-sect done" : "iv-sect"));
    }
    buzz(14);
    if (onEnter) onEnter(sections[i], i);
  }

  /* The scan line slides BOTH ways (Megan, 2026-08-12): while she is picking
     the answer she wants to run it back over a section and look again. The
     gate only ever limits how far RIGHT it may go — leftward is always free
     and never un-does progress.
     The climb is deliberately NOT like this: it stays strictly one-way so a
     graph gets read left to right. Harness check 8b guards that; do not
     "tidy up" the two mechanics into one. */
  drag(svg, g, ({ px }) => {
    const nx = clamp(g.xAt(px), xmin, limit);
    if (Math.abs(nx - x) <= 1e-9) return;
    x = nx; paint();
    const i = sections.findIndex((s) => x >= s.x0 - 1e-9 && x <= s.x1 + 1e-9);
    if (i >= 0) enter(i);
  });

  return {
    current: () => idx,
    /* open the gate to the end of the next section — measured from the
       furthest section reached, so unlocking still works if she has slid
       the line back to look at an earlier one */
    unlock() {
      const nxt = sections[reached + 1];
      limit = nxt ? nxt.x1 : xmax;
      if (reached >= 0) sections[reached]._rect.setAttribute("class", "iv-sect done");
    },
    isFinished: () => reached >= sections.length - 1,
  };
}

/* ============================================================
   7. SIGN TABLE — the exam "tekentabel", in her board ORDER
   ------------------------------------------------------------
   Runs AFTER the learner has placed the cut lines (cutSockets):
   the graph shows the numbered sections, and under it sits a
   table — one row per curve, one column per section. Tap a cell
   to cycle blank → + → −. When a stage is fully filled it marks
   itself: wrong cells go red (real red — HTML, not SVG attrs)
   and the learner fixes them.

   For a product question a third row (f·g) appears once the
   curve rows are right: same signs → +, different signs → −
   ("tekens verskil"). The answer is read off that bottom row.

   opts: { spec (with vlines), sections, curves:[idx], names,
           product:bool }
   cb:   { nudge(key), done() }   keys: "signs" | "product" | "productWrong"
   ============================================================ */
export function signTable(host, opts, cb) {
  const { spec, sections, curves, names, product } = opts;
  const { svg, g } = mount(host, spec);
  const { ymin, ymax } = g.win;

  /* number the sections along the top of the graph */
  sections.forEach((s, i) => {
    const t = svgEl("text", {
      class: "iv-sectlab", x: N((g.X(s.x0) + g.X(s.x1)) / 2), y: N(g.Y(ymax) + 12),
      "text-anchor": "middle", "dominant-baseline": "middle",
    });
    t.textContent = "①②③④⑤⑥⑦⑧"[i] || String(i + 1);
    svg.appendChild(t);
  });

  /* truth per curve per section (null = curve doesn't exist there) */
  const truth = curves.map((ci) => sections.map((s) => signAt(spec.curves[ci], s.mid)));
  const prodTruth = product
    ? sections.map((_, si) => {
        const a = truth[0][si], b = truth[1][si];
        return (a == null || b == null) ? null : (a * b > 0 ? 1 : a * b < 0 ? -1 : 0);
      })
    : null;

  const table = document.createElement("table");
  table.className = "sign-table";
  const headRow = document.createElement("tr");
  headRow.appendChild(document.createElement("th"));
  sections.forEach((_, i) => {
    const th = document.createElement("th");
    th.textContent = "①②③④⑤⑥⑦⑧"[i] || String(i + 1);
    headRow.appendChild(th);
  });
  table.appendChild(headRow);

  const stages = [];   // [{cells:[{btn,val,want}], row}]
  function addRow(label, tone, wants, locked) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = label;
    if (tone) th.style.color = tone;
    tr.appendChild(th);
    const cells = [];
    wants.forEach((want) => {
      const td = document.createElement("td");
      if (want == null) { td.textContent = "·"; td.className = "off"; }
      else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sgn";
        btn.disabled = !!locked;
        btn.addEventListener("click", () => {
          if (btn.disabled) return;
          const cur = btn.textContent;
          btn.textContent = cur === "" ? "+" : cur === "+" ? "−" : "";
          btn.classList.remove("bad");
          btn.classList.toggle("plus", btn.textContent === "+");
          btn.classList.toggle("minus", btn.textContent === "−");
          buzz(8);
          checkStage();
        });
        td.appendChild(btn);
        cells.push({ btn, want });
      }
      tr.appendChild(td);
    });
    table.appendChild(tr);
    return cells;
  }

  const TONES = { a: "var(--fg-a)", b: "var(--fg-b)", c: "var(--fg-c)" };
  curves.forEach((ci, k) => {
    const tone = TONES[spec.curves[ci].tone] || "var(--accent)";
    stages.push({ cells: addRow(names[k] || "f", tone, truth[k]), kind: "signs" });
  });
  let prodStage = null;

  let active = 0;                    // curve rows validate together as stage 0
  function stageCells() {
    return active === 0 ? stages.flatMap((s) => s.cells) : prodStage.cells;
  }
  function checkStage() {
    const cells = stageCells();
    if (cells.some((c) => c.btn.textContent === "")) return;      // not full yet
    const wrong = cells.filter((c) => (c.btn.textContent === "+" ? 1 : -1) !== c.want);
    if (wrong.length) {
      wrong.forEach((c) => c.btn.classList.add("bad"));
      cb.nudge(active === 0 ? "signs" : "productWrong");
      buzz(20);
      return;
    }
    cells.forEach((c) => { c.btn.disabled = true; c.btn.classList.add("good"); });
    if (active === 0 && product) {
      active = 1;
      prodStage = { cells: addRow(`${names[0]}·${names[1]}`, "var(--warn)", prodTruth) };
      cb.nudge("product");
      return;
    }
    cb.done();
  }

  host.appendChild(table);
  return { table };
}

/* ============================================================
   8. AXIS GATE — tap the axis the answer lives on   ★ session 4
   ------------------------------------------------------------
   Before a domain/range question opens its curtain, the learner
   must tap the AXIS their answer will live on: domain → x-axis,
   range → y-axis. A wrong tap gets a gentle flash and a nudge —
   no penalty, no lock; they simply try the other line.

   opts: { spec, want:"x"|"y", onPass(), onWrong(axis) }
   ============================================================ */
export function axisGate(host, opts) {
  const { spec, want, onPass, onWrong } = opts;
  const { svg, g } = mount(host, spec);
  let passed = false;

  const BAND = 28;    // px either side of the axis line — a forgiving strip
  const xHit = svgEl("rect", { class: "iv-axishit", x: 0, y: N(g.Y(0) - BAND / 2), width: g.W, height: BAND });
  const yHit = svgEl("rect", { class: "iv-axishit", x: N(g.X(0) - BAND / 2), y: 0, width: BAND, height: g.H });
  xHit.style.cursor = "pointer";
  yHit.style.cursor = "pointer";
  svg.append(xHit, yHit);

  function flash(el) {
    el.classList.remove("iv-bounce");
    el.getBoundingClientRect();           // force reflow — restarts the CSS animation, no rAF needed
    el.classList.add("iv-bounce");
  }
  function tap(axis, el) {
    if (passed) return;
    if (axis === want) {
      passed = true;
      el.classList.add("iv-axis-ok");
      buzz(16);
      if (onPass) onPass();
    } else {
      flash(el);
      buzz(6);
      if (onWrong) onWrong(axis);
    }
  }
  xHit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); tap("x", xHit); });
  yHit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); tap("y", yHit); });

  return { passed: () => passed };
}

/* ============================================================
   9. TAP REVEAL — "(2 ; k) lies on f", read not computed   ★ session 4
   ------------------------------------------------------------
   A single tap at x = `at` on the x-axis reveals the dashed drop
   line up to the curve and marks the point — nothing is shown
   before the tap. Reading, not dragging: the point is marked the
   instant it is tapped, symbol kept literal ("k") so a follow-up
   question never leaks a rounded version of its own answer.

   opts: { spec, curve, at, symbol, onTap(y) }
   ============================================================ */
export function tapReveal(host, opts) {
  const { spec, curve, at, symbol, onTap } = opts;
  const { svg, g } = mount(host, spec);
  const cv = spec.curves[curve], f = makeFn(cv);
  const y = f(at);
  let tapped = false;

  const px = N(g.X(at));
  const knob = svgEl("circle", { class: "iv-taphint", cx: px, cy: N(g.Y(0)), r: 7 });
  const hit = svgEl("rect", { class: "iv-hit", x: N(px - 18), y: 0, width: 36, height: g.H });
  hit.style.cursor = "pointer";
  svg.append(hit, knob);

  const reveal = svgEl("g");
  function doReveal() {
    if (tapped || !Number.isFinite(y)) return;
    tapped = true;
    knob.setAttribute("class", "iv-taphint on");
    const drop = svgEl("line", { class: "fg-drop", x1: px, y1: N(g.Y(y)), x2: px, y2: N(g.Y(0)) });
    const dot = svgEl("circle", { class: "fg-dot", cx: px, cy: N(g.Y(y)), r: 3.6 });
    const lab = svgEl("text", { class: "fg-plab", x: N(px + 8), y: N(g.Y(y) - 10), "text-anchor": "start" });
    lab.textContent = `(${fmtComma(at)} ; ${symbol})`;
    reveal.append(drop, dot, lab);
    svg.appendChild(reveal);
    buzz(16);
    if (onTap) onTap(y);
  }
  hit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); doReveal(); });

  return { isTapped: () => tapped, value: () => y };
}

/* ============================================================
   10. LENGTH REVEAL — tap to reveal a length, read not computed   ★ batch 2
   ------------------------------------------------------------
   Three flavours of the same idea: tapping never COMPUTES anything,
   it only reveals the two marked spots and the segment joining them
   — the length itself is always read off the grid in the follow-up
   question (funclib's lengthBetween does the actual subtraction for
   the answer key, never the learner).

     mode:"v"    a vertical PQ between TWO CURVES at x = at
                 (top minus bottom — her paper's #1 shape)
     mode:"h"    a horizontal AB between two points on ONE curve
                 that share a y-value
     mode:"axis" one point on a curve to the x-axis (|y|) or the
                 y-axis (|x|) — the OTHER coordinate is the one
                 already given in the prompt, so the tap strip runs
                 along the axis for the coordinate that is unknown
                 (never spoils the answer by pre-labelling it)

   opts (mode "v"):    { spec, mode:"v", curveA, curveB, at, onTap(yA,yB) }
   opts (mode "h"):    { spec, mode:"h", y, xA, xB, onTap(xA,xB) }
   opts (mode "axis"): { spec, mode:"axis", point:{x,y}, to:"x"|"y", onTap(len) }
   ============================================================ */
export function lengthReveal(host, opts) {
  const { spec, mode } = opts;
  const { svg, g } = mount(host, spec);
  let tapped = false;
  const reveal = svgEl("g");

  if (mode === "v") {
    const { curveA = 0, curveB = 1, at, onTap } = opts;
    const fA = makeFn(spec.curves[curveA]), fB = makeFn(spec.curves[curveB]);
    const yA = fA(at), yB = fB(at);
    const px = N(g.X(at));
    const knob = svgEl("circle", { class: "iv-taphint", cx: px, cy: N(g.Y(0)), r: 7 });
    const hit = svgEl("rect", { class: "iv-hit", x: N(px - 18), y: 0, width: 36, height: g.H });
    hit.style.cursor = "pointer";
    svg.append(hit, knob);
    const doReveal = () => {
      if (tapped || !Number.isFinite(yA) || !Number.isFinite(yB)) return;
      tapped = true;
      knob.setAttribute("class", "iv-taphint on");
      const seg = svgEl("line", { class: "fg-seg", x1: px, y1: N(g.Y(yA)), x2: px, y2: N(g.Y(yB)) });
      const dotP = svgEl("circle", { class: "fg-dot", cx: px, cy: N(g.Y(yA)), r: 3.6 });
      const dotQ = svgEl("circle", { class: "fg-dot", cx: px, cy: N(g.Y(yB)), r: 3.6 });
      const labP = svgEl("text", { class: "fg-plab", x: N(px + 8), y: N(g.Y(yA) - 8), "text-anchor": "start" });
      labP.textContent = "P";
      const labQ = svgEl("text", { class: "fg-plab", x: N(px + 8), y: N(g.Y(yB) + 12), "text-anchor": "start" });
      labQ.textContent = "Q";
      reveal.append(seg, dotP, dotQ, labP, labQ);
      svg.appendChild(reveal);
      buzz(16);
      if (onTap) onTap(yA, yB);
    };
    hit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); doReveal(); });
    return { isTapped: () => tapped, values: () => [yA, yB] };
  }

  if (mode === "h") {
    const { y, xA, xB, onTap } = opts;
    const py = N(g.Y(y));
    const knob = svgEl("circle", { class: "iv-taphint", cx: N(g.X(0)), cy: py, r: 7 });
    const hit = svgEl("rect", { class: "iv-hit", x: 0, y: N(py - 18), width: g.W, height: 36 });
    hit.style.cursor = "pointer";
    svg.append(hit, knob);
    const doReveal = () => {
      if (tapped) return;
      tapped = true;
      knob.setAttribute("class", "iv-taphint on");
      const pxA = N(g.X(xA)), pxB = N(g.X(xB));
      const seg = svgEl("line", { class: "fg-seg", x1: pxA, y1: py, x2: pxB, y2: py });
      const dotA = svgEl("circle", { class: "fg-dot", cx: pxA, cy: py, r: 3.6 });
      const dotB = svgEl("circle", { class: "fg-dot", cx: pxB, cy: py, r: 3.6 });
      const labA = svgEl("text", { class: "fg-plab", x: pxA, y: N(py - 10), "text-anchor": "middle" });
      labA.textContent = "A";
      const labB = svgEl("text", { class: "fg-plab", x: pxB, y: N(py - 10), "text-anchor": "middle" });
      labB.textContent = "B";
      reveal.append(seg, dotA, dotB, labA, labB);
      svg.appendChild(reveal);
      buzz(16);
      if (onTap) onTap(xA, xB);
    };
    hit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); doReveal(); });
    return { isTapped: () => tapped, values: () => [xA, xB] };
  }

  /* mode === "axis" */
  const { point, to, onTap } = opts;
  const px = N(g.X(point.x)), py = N(g.Y(point.y));
  let hit, knob;
  if (to === "x") {
    /* point.x is the coordinate already given in the prompt — the
       strip runs vertically through it, exactly like tapReveal */
    knob = svgEl("circle", { class: "iv-taphint", cx: px, cy: N(g.Y(0)), r: 7 });
    hit = svgEl("rect", { class: "iv-hit", x: N(px - 18), y: 0, width: 36, height: g.H });
  } else {
    /* point.y is given instead — the strip runs horizontally, so
       nothing about x (the very thing being asked for) is hinted */
    knob = svgEl("circle", { class: "iv-taphint", cx: N(g.X(0)), cy: py, r: 7 });
    hit = svgEl("rect", { class: "iv-hit", x: 0, y: N(py - 18), width: g.W, height: 36 });
  }
  hit.style.cursor = "pointer";
  svg.append(hit, knob);
  const doReveal = () => {
    if (tapped) return;
    tapped = true;
    knob.setAttribute("class", "iv-taphint on");
    const footX = to === "x" ? px : N(g.X(0));
    const footY = to === "x" ? N(g.Y(0)) : py;
    const seg = svgEl("line", { class: "fg-drop", x1: px, y1: py, x2: footX, y2: footY });
    const dot = svgEl("circle", { class: "fg-dot", cx: px, cy: py, r: 3.6 });
    const lab = svgEl("text", { class: "fg-plab", x: N(px + 8), y: N(py - 10), "text-anchor": "start" });
    lab.textContent = "P";
    reveal.append(seg, dot, lab);
    svg.appendChild(reveal);
    buzz(16);
    if (onTap) onTap(to === "x" ? Math.abs(point.y) : Math.abs(point.x));
  };
  hit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); doReveal(); });
  return { isTapped: () => tapped, value: () => (to === "x" ? Math.abs(point.y) : Math.abs(point.x)) };
}

/* ============================================================
   11. CHORD REVEAL — tap to draw the chord(s) between marked
       points on ONE curve, then read the average gradient   ★ batch 2
   ------------------------------------------------------------
   Her board method: the average gradient IS the gradient of the
   straight line (chord) joining two points on a curve. The
   endpoints are marked from the start — nothing about WHERE they
   are is hidden — the tap only draws the connecting line(s), as a
   deliberate second step rather than handing it over already drawn.

   opts: { spec, curve, pairs:[{x1,x2,names:[a,b]}, …], onTap(vals) }
   vals = one [y1,y2] per pair, in the same order as `pairs`
   ============================================================ */
export function chordReveal(host, opts) {
  const { spec, curve = 0, pairs, onTap } = opts;
  const { svg, g } = mount(host, spec);
  const f = makeFn(spec.curves[curve]);
  let tapped = false;

  const chords = pairs.map((pr) => {
    const y1 = f(pr.x1), y2 = f(pr.x2);
    const p1 = { x: N(g.X(pr.x1)), y: N(g.Y(y1)) }, p2 = { x: N(g.X(pr.x2)), y: N(g.Y(y2)) };
    const dot1 = svgEl("circle", { class: "fg-dot", cx: p1.x, cy: p1.y, r: 4 });
    const dot2 = svgEl("circle", { class: "fg-dot", cx: p2.x, cy: p2.y, r: 4 });
    const lab1 = svgEl("text", { class: "fg-plab", x: p1.x, y: N(p1.y - 12), "text-anchor": "middle" });
    lab1.textContent = (pr.names && pr.names[0]) || "A";
    const lab2 = svgEl("text", { class: "fg-plab", x: p2.x, y: N(p2.y - 12), "text-anchor": "middle" });
    lab2.textContent = (pr.names && pr.names[1]) || "B";
    const line = svgEl("line", { class: "fg-seg", x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    svg.append(dot1, dot2, lab1, lab2);
    return { line, p1, p2, y1, y2 };
  });

  const midx = N(chords.reduce((s, c) => s + (c.p1.x + c.p2.x) / 2, 0) / chords.length);
  const midy = N(chords.reduce((s, c) => s + (c.p1.y + c.p2.y) / 2, 0) / chords.length);
  const knob = svgEl("circle", { class: "iv-taphint", cx: midx, cy: midy, r: 9 });
  const hit = svgEl("rect", { class: "iv-hit", x: 0, y: 0, width: g.W, height: g.H });
  hit.style.cursor = "pointer";
  svg.append(hit, knob);

  const doReveal = () => {
    if (tapped) return;
    tapped = true;
    knob.setAttribute("class", "iv-taphint on");
    chords.forEach((c) => svg.insertBefore(c.line, hit));
    buzz(16);
    if (onTap) onTap(chords.map((c) => [c.y1, c.y2]));
  };
  hit.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); doReveal(); });

  return { isTapped: () => tapped, values: () => chords.map((c) => [c.y1, c.y2]) };
}

/* ============================================================
   A plain (non-interactive) graph, for the MC rounds
   ============================================================ */
export function staticGraph(host, spec) { return mount(host, spec); }
