/* ============================================================
   RANDOM CURVE BUILDERS + AUTO WINDOWS
   ------------------------------------------------------------
   Every generated curve is built so its important features land on
   whole numbers — a learner reading a value off an axis must land
   on a gridline, never on "about 2,7".

   The window is computed from the features (not guessed), so the
   turning point, both intercepts and the asymptotes are always
   comfortably inside the frame.
   ============================================================ */
import {
  randInt, pick, parabolaFromRoots, paraTP, paraRoots, paraYInt,
  lineXInt, lineYInt, hypXInt, hypYInt, expXInt, expYInt, makeFn, C,
} from "../funclib.js";

/* whether semicircles may appear (blipwork mount turns this off:
   the IEB Grade 11 syllabus does not include them) */
export const CONTENT = { semicircles: true };

/* ---------------- individual curves ---------------- */

export function randLine(opts = {}) {
  const a = pick([1, -1, 2, -2, 3, -3, 0.5, -0.5]);
  let q = randInt(-4, 4);
  if (opts.throughOrigin === false && q === 0) q = 2;
  /* keep the x-intercept a whole number so it can be read off */
  if (!Number.isInteger(-q / a)) return randLine(opts);
  return { kind: "line", a, q };
}

export function randParabola(opts = {}) {
  const a = pick([1, -1, 1, -1, 2, -2]);
  let r1 = randInt(-4, 1), r2 = r1 + pick([2, 4, 6]);      // same parity → integer TP
  if (opts.roots === false) { r1 = randInt(-3, 2); r2 = r1 + pick([2, 4]); }
  const cv = parabolaFromRoots(a, r1, r2);
  const tp = paraTP(cv);
  if (Math.abs(tp.y) > 14) return randParabola(opts);
  return cv;
}

export function randHyperbola() {
  const q = pick([1, -1, 2, -2, 3, -3]);
  const a = pick([2, -2, 4, -4, 6, -6, 8, -8]);
  const p = pick([0, 0, 1, -1, 2, -2]);
  if (!Number.isInteger(a / q)) return randHyperbola();     // integer x-intercept
  const xi = hypXInt({ kind: "hyperbola", a, p, q });
  if (xi === null || Math.abs(xi) > 9 || Math.abs(xi - p) < 0.6) return randHyperbola();
  return { kind: "hyperbola", a, p, q };
}

/* y = a·bˣ + q, built backwards from a whole-number x-intercept */
export function randExp() {
  const b = pick([2, 2, 3]);
  const a = pick([1, 1, -1, 2, 3]);
  const k = randInt(1, 2);                                   // the x-intercept
  const q = -a * b ** k;                                     // forces a·bᵏ + q = 0
  if (Math.abs(q) > 14) return randExp();
  return { kind: "exp", a, b, p: 0, q };
}

export function randSemicircle(opts = {}) {
  const r = pick([2, 3, 4, 5, 6]);
  return { kind: "semicircle", r, up: opts.up ?? true };
}

/* a random curve of any allowed family */
export function randCurve(kinds) {
  const pool = kinds || ["line", "parabola", "hyperbola", "exp", ...(CONTENT.semicircles ? ["semicircle"] : [])];
  switch (pick(pool)) {
    case "line": return randLine();
    case "parabola": return randParabola();
    case "hyperbola": return randHyperbola();
    case "exp": return randExp();
    default: return randSemicircle();
  }
}

/* ---------------- features + windows ---------------- */

/* every interesting x and y of a curve, used to size the window */
export function features(cv) {
  const xs = [], ys = [];
  if (cv.kind === "line") {
    const xi = lineXInt(cv); if (xi != null) xs.push(xi);
    ys.push(lineYInt(cv)); xs.push(0);
  } else if (cv.kind === "parabola") {
    const tp = paraTP(cv); xs.push(tp.x); ys.push(tp.y);
    paraRoots(cv).forEach((r) => xs.push(r));
    ys.push(paraYInt(cv)); xs.push(0);
  } else if (cv.kind === "hyperbola") {
    xs.push(cv.p); ys.push(cv.q);
    const xi = hypXInt(cv); if (xi != null) xs.push(xi);
    const yi = hypYInt(cv); if (yi != null) ys.push(yi);
  } else if (cv.kind === "exp") {
    ys.push(cv.q, expYInt(cv));
    const xi = expXInt(cv); if (xi != null) xs.push(xi);
    xs.push(0);
  } else if (cv.kind === "semicircle") {
    xs.push(-cv.r, cv.r); ys.push(0, cv.up === false ? -cv.r : cv.r);
  }
  return { xs: xs.filter(Number.isFinite), ys: ys.filter(Number.isFinite) };
}

/* a window that holds every feature of every curve, with margin,
   rounded out to whole numbers and never sillily tall or wide */
export function windowFor(curves, opts = {}) {
  let xs = [0], ys = [0];
  curves.forEach((cv) => { const f = features(cv); xs.push(...f.xs); ys.push(...f.ys); });
  (opts.include || []).forEach((p) => { if (p.x != null) xs.push(p.x); if (p.y != null) ys.push(p.y); });

  let xmin = Math.min(...xs), xmax = Math.max(...xs);
  let ymin = Math.min(...ys), ymax = Math.max(...ys);
  const padX = Math.max(1.5, (xmax - xmin) * 0.22), padY = Math.max(1.5, (ymax - ymin) * 0.22);
  xmin = Math.floor(xmin - padX); xmax = Math.ceil(xmax + padX);
  ymin = Math.floor(ymin - padY); ymax = Math.ceil(ymax + padY);

  /* sample the curves across the window so nothing shoots off-frame
     unseen (a hyperbola branch, an exponential taking off) */
  function fitY() {
    curves.forEach((cv) => {
      const f = makeFn(cv);
      for (let i = 0; i <= 60; i++) {
        const x = xmin + (i / 60) * (xmax - xmin), y = f(x);
        if (!Number.isFinite(y)) continue;
        if (cv.kind === "hyperbola" && Math.abs(x - cv.p) < 0.5) continue;
        if (cv.kind === "exp" && Math.abs(y) > 40) continue;
        ymin = Math.min(ymin, Math.max(y, ymin - 6));
        ymax = Math.max(ymax, Math.min(y, ymax + 6));
      }
    });
    ymin = Math.floor(ymin); ymax = Math.ceil(ymax);
  }
  fitY();

  /* ---- keep the picture READABLE on a phone ----
     A very wide, very short window squashes the curves into a strip and
     crops whatever leaves it (a hyperbola + line pair did exactly that:
     half the diagram was off-screen). The drawing area is 360×300, so
     hold the window near that 1,2 : 1 shape — widen the short axis
     rather than ever cropping the long one. */
  const targetRatio = 360 / 300;
  let w = xmax - xmin, h = ymax - ymin;

  /* A semicircle MUST look like a semicircle. The canvas is 360×300, so the
     window has to carry the same shape or a circle is drawn as an ellipse —
     which is a lie about the graph, not a cosmetic issue. */
  const widen = () => {
    const add = Math.ceil(h * targetRatio - w), right = Math.ceil(add / 2);
    xmax += right; xmin -= (add - right);
    /* widening x exposes MORE of the curve — a parabola's arms shoot up out
       of frame — so the vertical fit has to be redone afterwards */
    fitY();
  };
  const heighten = () => {
    const add = Math.ceil(w / targetRatio - h), up = Math.ceil(add / 2);
    ymax += up; ymin -= (add - up);
  };

  if (curves.some((cv) => cv.kind === "semicircle")) {
    if (w / h > targetRatio) heighten(); else widen();
    return { xmin, xmax, ymin, ymax };
  }
  if (w / h > targetRatio) heighten();
  else if (h / w > (1 / targetRatio) * 1.9) widen();
  return { xmin, xmax, ymin, ymax };
}

/* strip a spec's asymptote LABELS — for questions that ask what the
   asymptote is. Printing "y = −8" on the sketch answers the question. */
export function hideAsymLabels(spec) {
  return { ...spec, asymptotes: (spec.asymptotes || []).map((a) => ({ ...a, label: null })) };
}

/* build a ready-to-draw spec */
export function specFor(curves, opts = {}) {
  const win = opts.win || windowFor(curves, opts);
  const spec = {
    win, curves: curves.map((cv, i) => ({ ...cv, tone: opts.tones ? opts.tones[i] : i === 0 ? "a" : "b" })),
    grid: opts.grid !== false,
    ticks: opts.ticks,
    points: opts.points || [],
    asymptotes: [],
    w: opts.w || 360, h: opts.h || 300,
    accent: opts.accent,
  };
  curves.forEach((cv, i) => {
    if (cv.kind === "hyperbola") {
      spec.asymptotes.push({ x: cv.p, of: i }, { y: cv.q, of: i, label: opts.asymLabels ? `y = ${C(cv.q)}` : null });
    }
    if (cv.kind === "exp") {
      spec.asymptotes.push({ y: cv.q, of: i, label: opts.asymLabels ? `y = ${C(cv.q)}` : null });
    }
  });
  if (opts.labels) {
    spec.curves.forEach((cv, i) => {
      cv.label = opts.labels[i];
      cv.labelAt = labelSpot(cv, win, i);
    });
  }
  return spec;
}

/* a readable x to hang the curve's name at */
function labelSpot(cv, win, i) {
  const f = makeFn(cv);
  const tries = i === 0
    ? [win.xmax - 1, win.xmax - 1.6, win.xmin + 1.2, win.xmax - 2.4]
    : [win.xmin + 1.2, win.xmax - 2.2, win.xmax - 1.2, win.xmin + 2];
  for (const x of tries) {
    const y = f(x);
    if (Number.isFinite(y) && y > win.ymin + 0.6 && y < win.ymax - 0.6) return x;
  }
  for (let k = 0; k <= 20; k++) {
    const x = win.xmin + (k / 20) * (win.xmax - win.xmin), y = f(x);
    if (Number.isFinite(y) && y > win.ymin + 0.6 && y < win.ymax - 0.6) return x;
  }
  return (win.xmin + win.xmax) / 2;
}

/* the marked points a sketch usually shows (intercepts, TP) */
export function keyPoints(cv, idx = 0, opts = {}) {
  const pts = [];
  const add = (x, y, label, place) => pts.push({ x, y, on: idx, label, place });
  if (cv.kind === "line") {
    const xi = lineXInt(cv); if (xi != null && xi !== 0) add(xi, 0, opts.bare ? null : `(${C(xi)} ; 0)`);
    add(0, lineYInt(cv), opts.bare ? null : `(0 ; ${C(lineYInt(cv))})`);
  } else if (cv.kind === "parabola") {
    paraRoots(cv).forEach((r) => add(r, 0, opts.bare ? null : `(${C(r)} ; 0)`));
    const tp = paraTP(cv);
    add(tp.x, tp.y, opts.bare ? null : `(${C(tp.x)} ; ${C(tp.y)})`, tp.y < 0 ? "below" : "above");
  } else if (cv.kind === "hyperbola") {
    const xi = hypXInt(cv); if (xi != null) add(xi, 0, opts.bare ? null : `(${C(xi)} ; 0)`);
  } else if (cv.kind === "exp") {
    const xi = expXInt(cv); if (xi != null) add(xi, 0, opts.bare ? null : `(${C(xi)} ; 0)`);
    add(0, expYInt(cv), opts.bare ? null : `(0 ; ${C(expYInt(cv))})`);
  } else if (cv.kind === "semicircle") {
    add(-cv.r, 0, opts.bare ? null : `(${C(-cv.r)} ; 0)`);
    add(cv.r, 0, opts.bare ? null : `(${C(cv.r)} ; 0)`);
  }
  return pts;
}
