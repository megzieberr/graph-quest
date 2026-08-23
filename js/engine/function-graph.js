/* ============================================================
   FUNCTION-GRAPH ENGINE   ★ accuracy-critical
   ------------------------------------------------------------
   Ported from blipwork (maths-homework-quest) and extended with
   semicircles + the inverse transform the interactive layers need.

   The whole picture is placed by ONE affine map
       px = padL + (x − xmin)·sx        py = H − padB − (y − ymin)·sy
   so every feature — curve, intercept, asymptote, handle, scan
   line — lands where the maths says. Because there is only one
   map, verify() can prove the drawing cannot lie.

   spec: {
     win:{xmin,xmax,ymin,ymax},
     curves:[{kind,…params, tone?:"a"|"b"|"c", dash?, label?, labelAt?}],
     points?:[{x,y,label?,on?,open?,dashTo?:"x"|"y"|"both",place?}],
     asymptotes?:[{x?,y?,of?,label?}],
     vlines?:[{x,label?}],
     shades?:[{x0,x1}],
     segment?:{x,fromCurve,toCurve,label?},
     grid?, ticks?, w?, h?, accent?
   }
   ============================================================ */
import { makeFn } from "../funclib.js";
import { fmtComma } from "../check.js";

const N = (v) => Math.round(v * 100) / 100;
const TONES = { a: "var(--fg-a)", b: "var(--fg-b)", c: "var(--fg-c)" };

/* the plotting rectangle's inset from the canvas edge — windowFor()
   (js/quests/_graphs.js) must use exactly these same numbers, or its
   square-grid promise (sx === sy) breaks the moment a spec's w/h differs
   from the 360×300 default. */
export const PAD = { L: 16, R: 16, T: 14, B: 16 };

/* the one opacity a "faint" thing wears — the curve, its name label and
   its asymptotes all read off this, so they can never drift apart */
export const FAINT = ".42";

/* how far below the x-axis a tick NUMBER's centre sits. UNCHANGED by the
   halo — no lowering was needed. Proved by rasterising a real sketch at
   360×300 (verify §31a): the topmost halo pixel lands 5 px below the
   axis, so it clears both the axis stroke (1,2 px wide, ±0,6) and the
   3 px tick marks, and the axis row comes back with zero pixels painted
   over and zero gaps. */
const TICK_LAB_DY = 11;

const text = (x, y, s, cls, anchor = "middle") =>
  `<text class="${cls}" x="${N(x)}" y="${N(y)}" text-anchor="${anchor}" dominant-baseline="middle">${s}</text>`;

/* a centred obstacle box: [x0,y0,x1,y1] in pixels */
const box = (cx, cy, w, h) => [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
/* two boxes touch (exported: _graphs.js's label chooser and
   curveLabelsClash() must ask the question exactly this way) */
export const boxesHit = (b, q) => !(b[2] <= q[0] || b[0] >= q[2] || b[3] <= q[1] || b[1] >= q[3]);

/* ---- the one transform, plus its inverse (for pointer input) ---- */
export function computeFunction(spec) {
  const W = spec.w || 360, H = spec.h || 300;
  const padL = PAD.L, padR = PAD.R, padT = PAD.T, padB = PAD.B;
  const { xmin, xmax, ymin, ymax } = spec.win;
  const sx = (W - padL - padR) / (xmax - xmin);
  const sy = (H - padT - padB) / (ymax - ymin);
  const X = (x) => padL + (x - xmin) * sx;
  const Y = (y) => H - padB - (y - ymin) * sy;
  const xAt = (px) => xmin + (px - padL) / sx;          // inverse of X
  const yAt = (py) => ymin + (H - padB - py) / sy;      // inverse of Y
  return { W, H, sx, sy, X, Y, xAt, yAt, win: spec.win, padL, padR, padT, padB };
}

/* the point on segment a→b where y crosses into [ymin,ymax] — used both
   to clip a curve exactly at the frame and to know where an arrowhead
   belongs (world coords in, world coords out) */
function intersectY(a, b, ymin, ymax) {
  const boundary = (a[1] < ymin || b[1] < ymin) ? ymin : ymax;
  const t = (boundary - a[1]) / (b[1] - a[1]);
  return [a[0] + t * (b[0] - a[0]), boundary];
}

/* ---- sample one curve into exactly-clipped world-coord segments ----
   Breaks at a hyperbola's asymptote (a real domain gap — no arrow) and
   clips precisely at ymin/ymax (the curve keeps going — arrow). The x
   sampling never leaves [xmin,xmax], so a segment that is still "alive"
   right at x=xmin/xmax also means the curve keeps going off the side.
   Semicircles get their exact endpoints added so the arc really touches
   the x-axis — that is a genuine domain edge, never an arrow. */
function clippedSegments(cv, g) {
  const f = makeFn(cv);
  const { xmin, xmax, ymin, ymax } = g.win;
  const breaks = cv.kind === "hyperbola" ? [cv.p] : [];
  const STEPS = 360, dx = (xmax - xmin) / STEPS, EPS = dx * 0.5;

  const xsAll = [];
  for (let i = 0; i <= STEPS; i++) xsAll.push(xmin + i * dx);
  if (cv.kind === "semicircle") {                       // exact edges, in order
    [-cv.r, cv.r].forEach((e) => { if (e > xmin && e < xmax) xsAll.push(e); });
    xsAll.sort((a, b) => a - b);
  }

  const runs = [];
  let cur = [];
  for (const x of xsAll) {
    if (breaks.some((b) => Math.abs(x - b) < EPS)) { if (cur.length > 1) runs.push(cur); cur = []; continue; }
    const y = f(x);
    if (!Number.isFinite(y)) { if (cur.length > 1) runs.push(cur); cur = []; continue; }
    cur.push([x, y]);
  }
  if (cur.length > 1) runs.push(cur);

  const out = [];
  runs.forEach((run) => {
    const segs = [];
    let piece = null, prev = null;
    for (const pt of run) {
      const inside = pt[1] >= ymin && pt[1] <= ymax;
      if (inside) {
        if (!piece) {
          piece = { pts: [], openStart: false, openEnd: false };
          if (prev) { piece.pts.push(intersectY(prev, pt, ymin, ymax)); piece.openStart = true; }
        }
        piece.pts.push(pt);
      } else if (piece) {
        piece.pts.push(intersectY(prev, pt, ymin, ymax));
        piece.openEnd = true;
        segs.push(piece); piece = null;
      }
      prev = pt;
    }
    if (piece) segs.push(piece);
    if (segs.length) {
      if (Math.abs(run[0][0] - xmin) < EPS) segs[0].openStart = true;
      if (Math.abs(run[run.length - 1][0] - xmax) < EPS) segs[segs.length - 1].openEnd = true;
    }
    segs.forEach((s) => { if (s.pts.length > 1) out.push(s); });
  });
  return out;
}

export function curvePaths(cv, g) {
  return clippedSegments(cv, g).map((s) =>
    "M " + s.pts.map(([x, y]) => `${N(g.X(x))} ${N(g.Y(y))}`).join(" L "));
}

/* a small triangle arrowhead, apex at pixel `to`, pointing away from `from` —
   the hand-sketch cue that a curve keeps going past the edge of the frame */
function arrowPath(g, from, to) {
  const x0 = g.X(from[0]), y0 = g.Y(from[1]), x1 = g.X(to[0]), y1 = g.Y(to[1]);
  const ang = Math.atan2(y1 - y0, x1 - x0), size = 6.5, spread = Math.PI * 0.82;
  const p1x = x1 + size * Math.cos(ang + spread), p1y = y1 + size * Math.sin(ang + spread);
  const p2x = x1 + size * Math.cos(ang - spread), p2y = y1 + size * Math.sin(ang - spread);
  return `M ${N(x1)} ${N(y1)} L ${N(p1x)} ${N(p1y)} L ${N(p2x)} ${N(p2y)} Z`;
}

/* arrowheads for every place this curve visibly leaves the frame (never
   at a genuine domain edge — an asymptote break or a semicircle's rim) */
export function curveExitArrows(cv, g) {
  const arrows = [];
  clippedSegments(cv, g).forEach((s) => {
    if (s.openStart) arrows.push(arrowPath(g, s.pts[1], s.pts[0]));
    if (s.openEnd) arrows.push(arrowPath(g, s.pts[s.pts.length - 2], s.pts[s.pts.length - 1]));
  });
  return arrows;
}

/* ---- label geometry, in ONE place ----------------------------------
   renderFunction() draws the axis letters and the curve-name labels
   straight off these three helpers, and _graphs.js's specFor() tests
   candidate label positions against the very same boxes. There is no
   second copy of this geometry anywhere: if the drawing moves, the test
   moves with it. (Batch 3 session 6 — q7-exam.js used to carry a private
   replica of the curve-label box maths; it now imports curveLabelsClash()
   from _graphs.js, which is built on curveLabelBox() below.) */

/* where the x / y / O letters are drawn, and the box each one owns */
export function axisLetters(spec) {
  const g = computeFunction(spec);
  const { W, H, X, Y, win } = g;
  const { xmin, xmax, ymin, ymax } = win;
  const x0px = X(0), y0px = Y(0);
  const showY = xmin <= 0 && xmax >= 0, showX = ymin <= 0 && ymax >= 0;
  const out = [];
  if (showX) {
    const xlY = y0px - 9 < 9 ? y0px + 13 : y0px - 9;
    out.push({ s: "x", x: X(xmax) - 4, y: xlY, box: box(X(xmax) - 4, xlY, 15, 17) });
  }
  if (showY) {
    const ylX = x0px + 9 > W - 6 ? x0px - 9 : x0px + 9;
    out.push({ s: "y", x: ylX, y: Y(ymax) + 4, box: box(ylX, Y(ymax) + 4, 15, 17) });
  }
  if (showX && showY) {
    const oY = y0px + 10 > H - 5 ? y0px - 9 : y0px + 10;
    out.push({ s: "O", x: x0px - 8, y: oY, box: box(x0px - 8, oY, 15, 17) });
  }
  return out;
}

/* the box a curve's NAME label ("f", "g") occupies — null when the label
   is not drawn at all (no label, no labelAt, or a y outside the window).
   Pass an explicit `at` to ask "where WOULD it sit at this x?". */
export function curveLabelBox(cv, g, at) {
  if (!cv || !cv.label) return null;
  const lx = at === undefined ? cv.labelAt : at;
  if (lx === undefined) return null;
  const ly = makeFn(cv)(lx);
  if (!Number.isFinite(ly) || ly < g.win.ymin || ly > g.win.ymax) return null;
  return box(g.X(lx) + 10, g.Y(ly) - 6, String(cv.label).length * 10 + 8, 19);
}

/* does the straight bit of path between two samples cut this box?
   (Liang–Barsky clip — true when any part of the segment is inside.) */
function segHitsBox(p0, p1, b) {
  let t0 = 0, t1 = 1;
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const tests = [[-dx, p0[0] - b[0]], [dx, b[2] - p0[0]], [-dy, p0[1] - b[1]], [dy, b[3] - p0[1]]];
  for (const [p, q] of tests) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
    else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}

/* does another curve's drawn path run through this label box? A "g"
   sitting on f's line is the same fault as "g" sitting on "f".
   It asks clippedSegments() — the very polyline curvePaths() draws — and
   walks its SEGMENTS, not a re-sampled dot cloud. Two earlier attempts
   were both resolution-dependent and lied: a 40-point dot test missed
   5,2% of real hits (a steep arm crosses a 19 px-tall box entirely
   between two samples) and a 120-point segment test still disagreed with
   a 400-point one near the frame edges. Testing what is actually drawn
   has no resolution to get wrong. */
export function labelBoxHitsCurve(cv, b, g) {
  return clippedSegments(cv, g).some((s) => {
    let prev = null;
    for (const [wx, wy] of s.pts) {
      const p = [g.X(wx), g.Y(wy)];
      if (p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3]) return true;
      if (prev && segHitsBox(prev, p, b)) return true;
      prev = p;
    }
    return false;
  });
}

export function renderFunction(spec) {
  const g = computeFunction(spec);
  const { W, H, X, Y, win } = g;
  const { xmin, xmax, ymin, ymax } = win;
  let out = "";

  if (spec.grid) {
    let gl = "";
    for (let x = Math.ceil(xmin); x <= xmax; x++) gl += `<line class="fg-grid" x1="${N(X(x))}" y1="${N(Y(ymin))}" x2="${N(X(x))}" y2="${N(Y(ymax))}"/>`;
    for (let y = Math.ceil(ymin); y <= ymax; y++) gl += `<line class="fg-grid" x1="${N(X(xmin))}" y1="${N(Y(y))}" x2="${N(X(xmax))}" y2="${N(Y(y))}"/>`;
    out += gl;
  }

  (spec.shades || []).forEach((s) => {
    const x0 = Math.max(s.x0, xmin), x1 = Math.min(s.x1, xmax);
    if (x1 <= x0) return;
    out += `<rect class="fg-shade" x="${N(X(x0))}" y="${N(Y(ymax))}" width="${N(X(x1) - X(x0))}" height="${N(Y(ymin) - Y(ymax))}"/>`;
  });

  /* a.faint: this asymptote belongs to a FAINT curve (specFor() sets it
     from the source curve; qF's scaffoldOf() sets it on the liar's extra
     lines). It fades by exactly the same .42 the curve itself uses, so a
     faint "before" curve stops shouting its asymptotes at full strength.
     An asymptote of a solid curve is untouched. */
  (spec.asymptotes || []).forEach((a) => {
    /* foreman review fix: .fg-asym already sits at opacity .7 in the
       stylesheet, so an inline .42 would fade the line only to 60 % of its
       solid partner while the curve fades to 42 %. Multiply, so the faint
       "before" picture dims as ONE thing: .7 × .42 ≈ .29. The label has no
       base opacity, so it keeps the plain FAINT value. */
    const ao = a.faint ? ` style="opacity:${(0.7 * Number(FAINT)).toFixed(2)}"` : "";
    if (a.x !== undefined) out += `<line class="fg-asym" x1="${N(X(a.x))}" y1="${N(Y(ymin))}" x2="${N(X(a.x))}" y2="${N(Y(ymax))}"${ao}/>`;
    if (a.y !== undefined) out += `<line class="fg-asym" x1="${N(X(xmin))}" y1="${N(Y(a.y))}" x2="${N(X(xmax))}" y2="${N(Y(a.y))}"${ao}/>`;
    if (a.label) {
      const lx = a.x !== undefined ? X(a.x) + 4 : X(xmax) - 4;
      const ly = a.y !== undefined ? Y(a.y) - 8 : Y(ymax) + 10;
      /* the style goes AFTER the anchor, never before the class — §30i
         reads these labels back off the SVG with a positional regex */
      const t = text(lx, ly, a.label, "fg-asymlab", a.x !== undefined ? "start" : "end");
      out += a.faint ? t.replace('dominant-baseline="middle"', `dominant-baseline="middle" style="opacity:${FAINT}"`) : t;
    }
  });

  const obstacles = [];
  /* every .fg-axlab (the x / y / O letters AND the tick numbers) is
     collected here and emitted AFTER the curves. Their halo (css
     .fg-axlab) only reads as "the curve passes behind the number" if the
     number is painted last — drawn before the curve, the halo would sit
     under it and do nothing. Positions are unchanged; only paint order
     moved. Tick MARKS and the axis lines themselves stay where they were,
     under the curve. */
  let axisText = "";

  /* ---- axes ---- */
  const x0px = X(0), y0px = Y(0);
  const showY = xmin <= 0 && xmax >= 0, showX = ymin <= 0 && ymax >= 0;
  if (showX) {
    out += `<line class="fg-axis" x1="${N(X(xmin))}" y1="${N(y0px)}" x2="${N(X(xmax))}" y2="${N(y0px)}"/>`;
    out += `<path class="fg-arrow" d="M ${N(X(xmax))} ${N(y0px)} l -7 -3.5 l 0 7 z"/>`;
    out += `<path class="fg-arrow" d="M ${N(X(xmin))} ${N(y0px)} l 7 -3.5 l 0 7 z"/>`;
  }
  if (showY) {
    out += `<line class="fg-axis" x1="${N(x0px)}" y1="${N(Y(ymin))}" x2="${N(x0px)}" y2="${N(Y(ymax))}"/>`;
    out += `<path class="fg-arrow" d="M ${N(x0px)} ${N(Y(ymax))} l -3.5 7 l 7 0 z"/>`;
    out += `<path class="fg-arrow" d="M ${N(x0px)} ${N(Y(ymin))} l -3.5 -7 l 7 0 z"/>`;
  }
  /* the x / y / O letters — positions and obstacle boxes from the one
     shared helper, text deferred to the axisText block above */
  axisLetters(spec).forEach((l) => {
    axisText += text(l.x, l.y, l.s, "fg-axlab");
    obstacles.push(l.box);
  });

  /* ---- axis number ticks (helps "read it off the axis" questions) ---- */
  if (spec.ticks && showX) {
    /* label every 2nd integer on a wide window — a solid row of digits
       around the origin mashes "−1  1" into what reads like "−10 1" */
    const step = xmax - xmin > 13 ? 2 : 1;
    for (let x = Math.ceil(xmin); x <= xmax; x++) {
      if (x === 0) continue;
      out += `<line class="fg-axis" x1="${N(X(x))}" y1="${N(y0px - 3)}" x2="${N(X(x))}" y2="${N(y0px + 3)}"/>`;
      if (spec.ticks === "labels" && x % step === 0) axisText += text(X(x), y0px + TICK_LAB_DY, fmtComma(x), "fg-axlab");
    }
  }
  if (spec.ticks && showY) {
    for (let y = Math.ceil(ymin); y <= ymax; y++) {
      if (y === 0) continue;
      out += `<line class="fg-axis" x1="${N(x0px - 3)}" y1="${N(Y(y))}" x2="${N(x0px + 3)}" y2="${N(Y(y))}"/>`;
    }
  }

  /* ---- the curves ---- */
  /* the NAME labels are held back like the axis text: painted after every
     curve so their halo can hide the line running under them, and so a
     second curve can never draw over the first curve's name. */
  let curveText = "";
  (spec.curves || []).forEach((cv) => {
    const stroke = cv.tone ? TONES[cv.tone] : "var(--accent)";
    /* cv.faint: reduced opacity, for a curve drawn as a "before" reference
       next to a solid "after" one (batch 2's transformations quest) — never
       used anywhere the curve is the only one on screen, since a faint
       curve alone would fail the "curve is visible" spirit of the frame */
    const op = cv.faint ? `;opacity:${FAINT}` : "";
    curvePaths(cv, g).forEach((d) => {
      out += `<path class="fg-curve${cv.dash ? " dash" : ""}" d="${d}" style="stroke:${stroke}${op}"/>`;
    });
    curveExitArrows(cv, g).forEach((d) => {
      out += `<path class="fg-curve-arrow" d="${d}" style="fill:${stroke}${op}"/>`;
    });
    const lb = curveLabelBox(cv, g);
    if (lb) {
      /* the name fades with its own curve — a faint "before" curve with a
         full-strength "f" beside it reads as the solid one's label */
      curveText += `<text class="fg-flab" x="${N((lb[0] + lb[2]) / 2)}" y="${N((lb[1] + lb[3]) / 2)}" text-anchor="middle" dominant-baseline="middle" style="fill:${stroke}${op}">${cv.label}</text>`;
      obstacles.push(lb);
    }
  });
  out += curveText + axisText;

  (spec.vlines || []).forEach((v) => {
    out += `<line class="fg-vline" x1="${N(X(v.x))}" y1="${N(Y(ymin))}" x2="${N(X(v.x))}" y2="${N(Y(ymax))}"/>`;
  });

  if (spec.segment) {
    const s = spec.segment, f = makeFn(spec.curves[s.fromCurve]), h = makeFn(spec.curves[s.toCurve]);
    const yA = f(s.x), yB = h(s.x);
    out += `<line class="fg-seg" x1="${N(X(s.x))}" y1="${N(Y(yA))}" x2="${N(X(s.x))}" y2="${N(Y(yB))}"/>`;
    out += `<circle class="fg-dot" cx="${N(X(s.x))}" cy="${N(Y(yA))}" r="2.6"/>`;
    out += `<circle class="fg-dot" cx="${N(X(s.x))}" cy="${N(Y(yB))}" r="2.6"/>`;
    if (s.label) out += text(X(s.x) + 10, (Y(yA) + Y(yB)) / 2, s.label, "fg-flab");
  }

  const labelReqs = [];
  (spec.points || []).forEach((p) => {
    const px = X(p.x), py = Y(p.y);
    if (p.dashTo === "x" || p.dashTo === "both") out += `<line class="fg-drop" x1="${N(px)}" y1="${N(py)}" x2="${N(px)}" y2="${N(Y(0))}"/>`;
    if (p.dashTo === "y" || p.dashTo === "both") out += `<line class="fg-drop" x1="${N(px)}" y1="${N(py)}" x2="${N(X(0))}" y2="${N(py)}"/>`;
    out += `<circle class="fg-dot${p.open ? " open" : ""}" cx="${N(px)}" cy="${N(py)}" r="3.2"/>`;
    if (p.label != null) labelReqs.push({ px, py, label: p.label, place: p.place });
  });
  out += placeLabels(labelReqs, spec, g, obstacles);

  const style = spec.accent ? ` style="--accent:${spec.accent}"` : "";
  return `<svg class="sg fg" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMid meet"${style}>${out}</svg>`;
}

/* ---- greedy label placement (unchanged from blipwork) ---- */
function placeLabels(reqs, spec, g, obstacles = []) {
  if (!reqs.length) return "";
  const { W, H, X, Y, win } = g;
  const { xmin, xmax, ymin, ymax } = win;

  const cpts = [];
  (spec.curves || []).forEach((cv) => {
    const f = makeFn(cv), STEPS = 150, dx = (xmax - xmin) / STEPS;
    for (let i = 0; i <= STEPS; i++) {
      const x = xmin + i * dx;
      if (cv.kind === "hyperbola" && Math.abs(x - cv.p) < dx) continue;
      const y = f(x);
      if (!Number.isFinite(y) || y < ymin || y > ymax) continue;
      cpts.push({ x: X(x), y: Y(y) });
    }
  });

  const CW = 6.5, CH = 17, GAP = 8, PAD = 2;
  const placed = obstacles.slice();
  const slot = (px, py, w) => ({
    above:      { x: px, y: py - 13, a: "middle", bx: px - w / 2 },
    aboveRight: { x: px + GAP, y: py - 13, a: "start", bx: px + GAP },
    aboveLeft:  { x: px - GAP, y: py - 13, a: "end", bx: px - GAP - w },
    right:      { x: px + GAP, y: py, a: "start", bx: px + GAP },
    left:       { x: px - GAP, y: py, a: "end", bx: px - GAP - w },
    below:      { x: px, y: py + 14, a: "middle", bx: px - w / 2 },
    belowRight: { x: px + GAP, y: py + 14, a: "start", bx: px + GAP },
    belowLeft:  { x: px - GAP, y: py + 14, a: "end", bx: px - GAP - w },
  });
  const DEFAULT = ["above", "aboveRight", "aboveLeft", "right", "left", "below", "belowRight", "belowLeft"];
  const inFrame = (b) => b[0] >= 2 && b[2] <= W - 2 && b[1] >= 2 && b[3] <= H - 2;
  const olArea = (b, q) => Math.max(0, Math.min(b[2], q[2]) - Math.max(b[0], q[0])) * Math.max(0, Math.min(b[3], q[3]) - Math.max(b[1], q[1]));
  const overBoxes = (b) => placed.some((q) => !(b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]));
  const overCurve = (b) => cpts.some((p) => p.x >= b[0] - PAD && p.x <= b[2] + PAD && p.y >= b[1] - PAD && p.y <= b[3] + PAD);
  const boxScore = (b) => placed.reduce((s, q) => s + olArea(b, q), 0) + (inFrame(b) ? 0 : 1e5);

  const ordered = reqs.map((r, i) => ({ r, i })).sort((a, b) => (b.r.place ? 1 : 0) - (a.r.place ? 1 : 0));
  const drawn = new Array(reqs.length);
  const withBox = (s, w) => ({ ...s, box: [s.bx, s.y - CH / 2, s.bx + w, s.y + CH / 2] });
  ordered.forEach(({ r, i }) => {
    const w = String(r.label).length * CW, m = slot(r.px, r.py, w);
    const order = r.place && m[r.place] ? [r.place, ...DEFAULT.filter((k) => k !== r.place)] : DEFAULT;
    const opts = order.map((k) => withBox(m[k], w));
    let chosen;
    if (r.place) {
      const prefKeys = r.place === "above" ? ["above", "aboveRight", "aboveLeft"]
        : r.place === "below" ? ["below", "belowRight", "belowLeft"] : [r.place];
      for (const k of prefKeys) {
        if (!m[k]) continue;
        const o = withBox(m[k], w);
        if (inFrame(o.box) && !overBoxes(o.box)) { chosen = o; break; }
      }
    }
    chosen = chosen ||
      opts.find((o) => inFrame(o.box) && !overCurve(o.box) && !overBoxes(o.box)) ||
      opts.find((o) => inFrame(o.box) && !overBoxes(o.box)) ||
      opts.slice().sort((a, b) => boxScore(a.box) - boxScore(b.box))[0];
    placed.push(chosen.box);
    drawn[i] = text(chosen.x, chosen.y, r.label, "fg-plab", chosen.a);
  });
  return drawn.join("");
}

/* ============================================================
   VERIFY — prove the drawing is honest
   ============================================================ */
export function verifyFunction(spec, tol = { onCurve: 0.02, asym: 1e-6 }) {
  const g = computeFunction(spec), r = [];
  const { xmin, xmax, ymin, ymax } = spec.win;

  r.push({ label: "window is valid (xmax>xmin, ymax>ymin)", ok: xmax > xmin && ymax > ymin });

  (spec.curves || []).forEach((cv, i) => {
    const segs = curvePaths(cv, g);
    const pts = segs.reduce((n, d) => n + (d.match(/L/g) || []).length + 1, 0);
    r.push({ label: `curve ${i} (${cv.kind}) is visible in the window`, ok: pts >= 2 });
  });

  (spec.points || []).forEach((p) => {
    if (p.on != null) {
      const idxs = Array.isArray(p.on) ? p.on : [p.on];
      idxs.forEach((i) => {
        const y = makeFn(spec.curves[i])(p.x);
        const ok = Number.isFinite(y) && Math.abs(y - p.y) <= tol.onCurve * Math.max(1, Math.abs(p.y), ymax - ymin);
        r.push({ label: `point ${p.label || "(" + p.x + ";" + p.y + ")"} lies on curve ${i}`, ok });
      });
    }
    r.push({ label: `point ${p.label || ""} sits inside the frame`,
      ok: p.x >= xmin - 1e-9 && p.x <= xmax + 1e-9 && p.y >= ymin - 1e-9 && p.y <= ymax + 1e-9 });
  });

  (spec.asymptotes || []).forEach((a) => {
    if (a.of == null) return;
    const cv = spec.curves[a.of];
    if (a.x !== undefined) r.push({ label: `vertical asymptote x=${a.x} matches curve ${a.of}`, ok: cv.kind === "hyperbola" && Math.abs(cv.p - a.x) <= tol.asym });
    if (a.y !== undefined) r.push({ label: `horizontal asymptote y=${a.y} matches curve ${a.of}`, ok: Math.abs(cv.q - a.y) <= tol.asym });
  });

  /* the inverse transform really is the inverse of the forward one —
     the interactive layers depend on this to place a dragged point */
  const probe = [0.13, 0.5, 0.87].map((t) => xmin + t * (xmax - xmin));
  r.push({ label: "inverse transform round-trips (xAt ∘ X = id)",
    ok: probe.every((x) => Math.abs(g.xAt(g.X(x)) - x) < 1e-6) });
  r.push({ label: "inverse transform round-trips (yAt ∘ Y = id)",
    ok: probe.map((x) => ymin + (x - xmin) / (xmax - xmin) * (ymax - ymin))
             .every((y) => Math.abs(g.yAt(g.Y(y)) - y) < 1e-6) });

  return r;
}
