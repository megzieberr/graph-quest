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
   ============================================================ */
const TONES = { a: "var(--fg-a)", b: "var(--fg-b)", c: "var(--fg-c)" };

export function signPaint(host, opts) {
  const { spec, sections, curves, onChange, names } = opts;
  const { svg, g } = mount(host, spec);
  const state = {};
  const nodes = [];

  curves.forEach((ci, cidx) => {
    state[ci] = {};
    const cv = spec.curves[ci], f = makeFn(cv);
    const tone = TONES[cv.tone] || "var(--accent)";
    sections.forEach((sec, si) => {
      const y = f(sec.mid);
      if (!Number.isFinite(y) || y < g.win.ymin || y > g.win.ymax) return;   // no graph here
      state[ci][si] = 0;
      const px = g.X(sec.mid);
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

   opts: { spec, sections, onEnter(section, index) }
   host app calls .unlock() once the section's question is right.
   ============================================================ */
export function sweep(host, opts) {
  const { spec, sections, onEnter } = opts;
  const { svg, g } = mount(host, spec);
  const { xmin, xmax, ymin, ymax } = g.win;

  let idx = -1;                 // section the scan line is inside
  let limit = sections[0].x1;   // may not pass this until unlocked
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
    sections.forEach((s, k) => s._rect.setAttribute("opacity", k === i ? 1 : k < i ? 0.55 : 0));
    sections.forEach((s, k) => s._rect.setAttribute("class", k < i ? "iv-sect done" : "iv-sect"));
    buzz(14);
    if (onEnter) onEnter(sections[i], i);
  }

  drag(svg, g, ({ px }) => {
    const want = g.xAt(px);
    const nx = clamp(Math.max(x, want), xmin, limit);   // right-only, and never past the gate
    if (nx <= x + 1e-9) return;
    x = nx; paint();
    const i = sections.findIndex((s) => x >= s.x0 - 1e-9 && x <= s.x1 + 1e-9);
    if (i >= 0) enter(i);
  });

  return {
    current: () => idx,
    /* open the gate to the end of the next section */
    unlock() {
      const nxt = sections[idx + 1];
      limit = nxt ? nxt.x1 : xmax;
      if (idx >= 0) sections[idx]._rect.setAttribute("class", "iv-sect done");
    },
    isFinished: () => idx >= sections.length - 1,
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
   A plain (non-interactive) graph, for the MC rounds
   ============================================================ */
export function staticGraph(host, spec) { return mount(host, spec); }
