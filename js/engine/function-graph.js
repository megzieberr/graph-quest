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

const text = (x, y, s, cls, anchor = "middle") =>
  `<text class="${cls}" x="${N(x)}" y="${N(y)}" text-anchor="${anchor}" dominant-baseline="middle">${s}</text>`;

/* ---- the one transform, plus its inverse (for pointer input) ---- */
export function computeFunction(spec) {
  const W = spec.w || 360, H = spec.h || 300;
  const padL = 16, padR = 16, padT = 14, padB = 16;
  const { xmin, xmax, ymin, ymax } = spec.win;
  const sx = (W - padL - padR) / (xmax - xmin);
  const sy = (H - padT - padB) / (ymax - ymin);
  const X = (x) => padL + (x - xmin) * sx;
  const Y = (y) => H - padB - (y - ymin) * sy;
  const xAt = (px) => xmin + (px - padL) / sx;          // inverse of X
  const yAt = (py) => ymin + (H - padB - py) / sy;      // inverse of Y
  return { W, H, sx, sy, X, Y, xAt, yAt, win: spec.win, padL, padR, padT, padB };
}

/* ---- sample one curve into clipped polyline segments ----
   Breaks at a hyperbola's asymptote and whenever the curve leaves the
   window, so we never draw a false near-vertical connector. Semicircles
   get their exact endpoints added so the arc really touches the x-axis. */
export function curvePaths(cv, g) {
  const f = makeFn(cv);
  const { xmin, xmax, ymin, ymax } = g.win;
  const span = ymax - ymin, lo = ymin - span * 0.6, hi = ymax + span * 0.6;
  const breaks = cv.kind === "hyperbola" ? [cv.p] : [];
  const STEPS = 360, dx = (xmax - xmin) / STEPS;

  const xsAll = [];
  for (let i = 0; i <= STEPS; i++) xsAll.push(xmin + i * dx);
  if (cv.kind === "semicircle") {                       // exact edges, in order
    [-cv.r, cv.r].forEach((e) => { if (e > xmin && e < xmax) xsAll.push(e); });
    xsAll.sort((a, b) => a - b);
  }

  const segs = [];
  let cur = [];
  for (const x of xsAll) {
    if (breaks.some((b) => Math.abs(x - b) < dx * 0.5)) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
    const y = f(x);
    if (!Number.isFinite(y) || y < lo || y > hi) { if (cur.length > 1) segs.push(cur); cur = []; continue; }
    cur.push([g.X(x), g.Y(Math.max(ymin - span * 0.55, Math.min(ymax + span * 0.55, y)))]);
  }
  if (cur.length > 1) segs.push(cur);
  return segs.map((s) => "M " + s.map(([px, py]) => `${N(px)} ${N(py)}`).join(" L "));
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

  (spec.asymptotes || []).forEach((a) => {
    if (a.x !== undefined) out += `<line class="fg-asym" x1="${N(X(a.x))}" y1="${N(Y(ymin))}" x2="${N(X(a.x))}" y2="${N(Y(ymax))}"/>`;
    if (a.y !== undefined) out += `<line class="fg-asym" x1="${N(X(xmin))}" y1="${N(Y(a.y))}" x2="${N(X(xmax))}" y2="${N(Y(a.y))}"/>`;
    if (a.label) {
      const lx = a.x !== undefined ? X(a.x) + 4 : X(xmax) - 4;
      const ly = a.y !== undefined ? Y(a.y) - 8 : Y(ymax) + 10;
      out += text(lx, ly, a.label, "fg-asymlab", a.x !== undefined ? "start" : "end");
    }
  });

  const obstacles = [];
  const box = (cx, cy, w, h) => [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];

  /* ---- axes ---- */
  const x0px = X(0), y0px = Y(0);
  const showY = xmin <= 0 && xmax >= 0, showX = ymin <= 0 && ymax >= 0;
  if (showX) {
    out += `<line class="fg-axis" x1="${N(X(xmin))}" y1="${N(y0px)}" x2="${N(X(xmax))}" y2="${N(y0px)}"/>`;
    out += `<path class="fg-arrow" d="M ${N(X(xmax))} ${N(y0px)} l -7 -3.5 l 0 7 z"/>`;
    out += `<path class="fg-arrow" d="M ${N(X(xmin))} ${N(y0px)} l 7 -3.5 l 0 7 z"/>`;
    const xlY = y0px - 9 < 9 ? y0px + 13 : y0px - 9;
    out += text(X(xmax) - 4, xlY, "x", "fg-axlab");
    obstacles.push(box(X(xmax) - 4, xlY, 15, 17));
  }
  if (showY) {
    out += `<line class="fg-axis" x1="${N(x0px)}" y1="${N(Y(ymin))}" x2="${N(x0px)}" y2="${N(Y(ymax))}"/>`;
    out += `<path class="fg-arrow" d="M ${N(x0px)} ${N(Y(ymax))} l -3.5 7 l 7 0 z"/>`;
    out += `<path class="fg-arrow" d="M ${N(x0px)} ${N(Y(ymin))} l -3.5 -7 l 7 0 z"/>`;
    const ylX = x0px + 9 > W - 6 ? x0px - 9 : x0px + 9;
    out += text(ylX, Y(ymax) + 4, "y", "fg-axlab");
    obstacles.push(box(ylX, Y(ymax) + 4, 15, 17));
  }
  if (showX && showY) {
    const oY = y0px + 10 > H - 5 ? y0px - 9 : y0px + 10;
    out += text(x0px - 8, oY, "O", "fg-axlab"); obstacles.push(box(x0px - 8, oY, 15, 17));
  }

  /* ---- axis number ticks (helps "read it off the axis" questions) ---- */
  if (spec.ticks && showX) {
    /* label every 2nd integer on a wide window — a solid row of digits
       around the origin mashes "−1  1" into what reads like "−10 1" */
    const step = xmax - xmin > 13 ? 2 : 1;
    for (let x = Math.ceil(xmin); x <= xmax; x++) {
      if (x === 0) continue;
      out += `<line class="fg-axis" x1="${N(X(x))}" y1="${N(y0px - 3)}" x2="${N(X(x))}" y2="${N(y0px + 3)}"/>`;
      if (spec.ticks === "labels" && x % step === 0) out += text(X(x), y0px + 11, fmtComma(x), "fg-axlab");
    }
  }
  if (spec.ticks && showY) {
    for (let y = Math.ceil(ymin); y <= ymax; y++) {
      if (y === 0) continue;
      out += `<line class="fg-axis" x1="${N(x0px - 3)}" y1="${N(Y(y))}" x2="${N(x0px + 3)}" y2="${N(Y(y))}"/>`;
    }
  }

  /* ---- the curves ---- */
  (spec.curves || []).forEach((cv) => {
    const stroke = cv.tone ? TONES[cv.tone] : "var(--accent)";
    curvePaths(cv, g).forEach((d) => {
      out += `<path class="fg-curve${cv.dash ? " dash" : ""}" d="${d}" style="stroke:${stroke}"/>`;
    });
    if (cv.label && cv.labelAt !== undefined) {
      const f = makeFn(cv), lx = cv.labelAt, ly = f(lx);
      if (Number.isFinite(ly) && ly >= ymin && ly <= ymax) {
        out += `<text class="fg-flab" x="${N(X(lx) + 10)}" y="${N(Y(ly) - 6)}" text-anchor="middle" dominant-baseline="middle" style="fill:${stroke}">${cv.label}</text>`;
        obstacles.push(box(X(lx) + 10, Y(ly) - 6, String(cv.label).length * 10 + 8, 19));
      }
    }
  });

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
