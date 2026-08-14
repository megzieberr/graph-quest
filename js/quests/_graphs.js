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
import { PAD } from "../engine/function-graph.js";

/* whether semicircles may appear (blipwork mount turns this off:
   the IEB Grade 11 syllabus does not include them) */
export const CONTENT = { semicircles: true };

/* ---------------- individual curves ---------------- */

export function randLine(opts = {}) {
  /* a steeper slope than this runs off the top/bottom of any square-grid
     window before it has crossed much of the width — (drawH/drawW)/2 ≈
     41% of the window stays visible at |a|=2, which is the last slope
     that clears the "curve mostly inside its frame" verify rule */
  const a = pick([1, -1, 2, -2, 0.5, -0.5]);
  let q = randInt(-4, 4);
  if (opts.throughOrigin === false && q === 0) q = 2;
  /* keep the x-intercept a whole number so it can be read off */
  if (!Number.isInteger(-q / a)) return randLine(opts);
  const cv = { kind: "line", a, q };
  if (!windowFor([cv])) return randLine(opts);
  return cv;
}

export function randParabola(opts = {}) {
  const a = pick([1, -1, 1, -1, 2, -2]);
  let r1 = randInt(-4, 1), r2 = r1 + pick([2, 4, 6]);      // same parity → integer TP
  if (opts.roots === false) { r1 = randInt(-3, 2); r2 = r1 + pick([2, 4]); }
  const cv = parabolaFromRoots(a, r1, r2);
  const tp = paraTP(cv);
  /* |yTP| ≤ 8 keeps a square-grid window's identity box inside the
     [20,45] px/unit clamp — see windowFor()'s MARGIN comment.
     The second cap bans the tall-AND-narrow shape: when the feature box
     (TP, y-intercept, x-axis together) is tall and the arms are steep,
     the curve crosses the whole window in a few units of x and only a
     third of it is on screen — right at verify §4b's visibility line
     (in-frame fraction ≈ 1,4/√(|a|·spanY), so 12 keeps it ≥ 0,40) */
  const spanY = Math.max(tp.y, paraYInt(cv), 0) - Math.min(tp.y, paraYInt(cv), 0);
  if (Math.abs(tp.y) > 8 || Math.abs(a) * spanY > 12) return randParabola(opts);
  const win = windowFor([cv]);
  if (!win) return randParabola(opts);
  /* batch-3 session 1 tidy-up: the spanY cap above catches the tall-AND-narrow
     shape on average, but a draw can still land just under §4b's ⅓-in-frame
     line (measured 33%, just short of the 34% floor) — the generator itself
     must never hand out a draw its own window can't show honestly. Every
     caller already carries a local reject-and-redraw as belt-and-braces
     (q5, qT, …); this closes the gap at the source instead of leaving it to
     each caller to catch. */
  if (!mostlyInFrame(cv, win)) return randParabola(opts);
  return cv;
}

export function randHyperbola() {
  const q = pick([1, -1, 2, -2, 3, -3]);
  const a = pick([2, -2, 4, -4, 6, -6]);                     // |a| ≤ 6, see windowFor()
  /* MEGAN'S RULING 2026-08-13: neither asymptote may sit on an axis, full
     stop — no more p = 0 (q was already never 0 above). Every quest,
     batch 1 included, now draws hyperbolas with both asymptotes off the
     axes; see the updated comment on asymOnAxis() below. */
  const p = pick([1, -1, 2, -2]);
  if (!Number.isInteger(a / q)) return randHyperbola();     // integer x-intercept
  const xi = hypXInt({ kind: "hyperbola", a, p, q });
  if (xi === null || Math.abs(xi) > 9 || Math.abs(xi - p) < 0.6) return randHyperbola();
  const cv = { kind: "hyperbola", a, p, q };
  if (!windowFor([cv])) return randHyperbola();
  return cv;
}

/* y = a·bˣ + q, built backwards from a whole-number x-intercept */
/* A dashed asymptote drawn on top of an axis cannot be seen — the learner is
   told to look at a line that is not there. Megan's batch-1 rule; it bit
   Round D again on 2026-08-12 (every hyperbola pair had p = 0) and harness
   check 10c now guards it. MEGAN'S RULING 2026-08-13: randHyperbola() no
   longer allows p = 0 (or q = 0) at all — the guard used to be needed only
   for the callers that went through randHyperbolaOffAxis(); now every
   caller of randHyperbola() gets it for free, batch 1 included.
   randHyperbolaOffAxis() and this function both stay — asymOnAxis() is
   still the one place that KNOWS what "on an axis" means, and
   randHyperbolaOffAxis()'s retry loop is now trivially satisfied on its
   first try rather than deleted, so batch-2 callers keep working
   unchanged. randExp() is already safe: its q = −a·bᵏ can never be 0. */
export function asymOnAxis(cv) {
  if (!cv) return false;
  if (cv.kind === "hyperbola") return cv.p === 0 || cv.q === 0;
  if (cv.kind === "exp") return cv.q === 0;
  return false;
}

export function randHyperbolaOffAxis() {
  for (let i = 0; i < 60; i++) {
    const cv = randHyperbola();
    if (!asymOnAxis(cv)) return cv;
  }
  return { kind: "hyperbola", a: 6, p: 1, q: 1 };   // safe fallback, never reached in practice
}

export function randExp() {
  const b = pick([2, 2, 3]);
  const a = pick([1, 1, -1, 2, 3]);
  const k = randInt(1, 2);                                   // the x-intercept
  const q = -a * b ** k;                                     // forces a·bᵏ + q = 0
  if (Math.abs(q) > 8) return randExp();                      // see windowFor()
  const cv = { kind: "exp", a, b, p: 0, q };
  if (!windowFor([cv])) return randExp();
  return cv;
}

export function randSemicircle(opts = {}) {
  const r = pick([2, 3, 4, 5, 6]);
  const cv = { kind: "semicircle", r, up: opts.up ?? true };
  if (!windowFor([cv])) return randSemicircle(opts);
  return cv;
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

/* every interesting x and y of a curve, used to size the window.
   These are the curve's IDENTITY — not just its intercepts, but enough
   of its shape that the window is forced to show what makes it that
   family (a parabola's arms actually rising, a hyperbola actually
   bending away from its asymptote, an exponential actually flattening
   AND actually taking off). */
export function features(cv) {
  const xs = [], ys = [];
  if (cv.kind === "line") {
    const xi = lineXInt(cv); if (xi != null) xs.push(xi);
    ys.push(lineYInt(cv)); xs.push(0);
  } else if (cv.kind === "parabola") {
    const tp = paraTP(cv); xs.push(tp.x); ys.push(tp.y);
    paraRoots(cv).forEach((r) => xs.push(r));
    ys.push(paraYInt(cv)); xs.push(0);
    /* ≥1 unit of visible arm-rise past the TP, on both sides */
    const sign = Math.sign(cv.a) || 1, dx = Math.sqrt(1 / Math.abs(cv.a));
    xs.push(tp.x - dx, tp.x + dx); ys.push(tp.y + sign);
  } else if (cv.kind === "hyperbola") {
    xs.push(cv.p); ys.push(cv.q);
    const xi = hypXInt(cv); if (xi != null) xs.push(xi);
    const yi = hypYInt(cv); if (yi != null) ys.push(yi);
    /* both branches' near-elbows: a point that has visibly bent ELBOW_RISE
       units away from the asymptote, one on each side of it */
    const sign = Math.sign(cv.a);
    const dx = Math.abs(cv.a) / ELBOW_RISE;
    xs.push(cv.p + dx, cv.p - dx); ys.push(cv.q + sign * ELBOW_RISE, cv.q - sign * ELBOW_RISE);
  } else if (cv.kind === "exp") {
    ys.push(cv.q, expYInt(cv));
    const xi = expXInt(cv); if (xi != null) xs.push(xi);
    xs.push(0);
    /* the "bend": where |y − q| goes from BEND_LO (still hugging the
       asymptote) to BEND_HI (clearly away from it) */
    const p = cv.p || 0, sign = Math.sign(cv.a), logb = Math.log(cv.b);
    const lo = p + Math.log(BEND_LO / Math.abs(cv.a)) / logb;
    const hi = p + Math.log(BEND_HI / Math.abs(cv.a)) / logb;
    xs.push(lo, hi); ys.push(cv.q + sign * BEND_LO, cv.q + sign * BEND_HI);
  } else if (cv.kind === "semicircle") {
    xs.push(-cv.r, cv.r); ys.push(0, cv.up === false ? -cv.r : cv.r);
  }
  return { xs: xs.filter(Number.isFinite), ys: ys.filter(Number.isFinite) };
}

const ELBOW_RISE = 3;      // hyperbola: units away from the asymptote a "near-elbow" claims
const BEND_LO = 0.5, BEND_HI = 2;  // exp: |y-q| band that counts as "the bend"

/* px/unit clamp (the same scale for x AND y — the square-grid rule) and
   the margin every identity feature gets from the window's edge. 10%
   comfortably clears the "parabola TP ≥ 8% from every edge" verify rule
   even in the tightest case (TP sitting exactly on the feature box's
   own edge, which it always does on the y-axis). */
const MIN_PXU = 20, MAX_PXU = 45, MARGIN = 0.10;

/* a window on the SQUARE-GRID principle: sx === sy always (forced by
   construction, not fixed up afterwards), identity features centred with
   a guaranteed margin, zoom clamped to [MIN_PXU, MAX_PXU]. If nothing in
   that clamp range can hold the features, there is no window that shows
   this curve honestly — return null so the caller regenerates a smaller
   curve. Never zooms out past MIN_PXU to force a fit. */
export function windowFor(curves, opts = {}) {
  const W = opts.w || 360, H = opts.h || 300;
  const drawW = W - PAD.L - PAD.R, drawH = H - PAD.T - PAD.B;

  let xs = [0], ys = [0];
  curves.forEach((cv) => { const f = features(cv); xs.push(...f.xs); ys.push(...f.ys); });
  (opts.include || []).forEach((p) => { if (p.x != null) xs.push(p.x); if (p.y != null) ys.push(p.y); });

  const bx0 = Math.min(...xs), bx1 = Math.max(...xs);
  const by0 = Math.min(...ys), by1 = Math.max(...ys);
  const featW = Math.max(bx1 - bx0, 1e-6), featH = Math.max(by1 - by0, 1e-6);

  /* the window that gives the features exactly MARGIN on every side */
  const wReq = featW / (1 - 2 * MARGIN), hReq = featH / (1 - 2 * MARGIN);

  /* the tightest (largest) scale that still fits both requirements,
     clamped to the readable range */
  const s = Math.min(MAX_PXU, drawW / wReq, drawH / hReq);
  if (s < MIN_PXU) return null;

  /* square grid: window shape is ALWAYS drawW:drawH at this scale —
     there is no separate aspect-ratio fix, because there is nothing to
     fix; sx and sy are the same number by construction. */
  const w = drawW / s, h = drawH / s;
  const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
  return { xmin: cx - w / 2, xmax: cx + w / 2, ymin: cy - h / 2, ymax: cy + h / 2 };
}

/* verify's own honesty rule (§4b, never relaxed): at least a THIRD of a
   drawn curve's sampled x-range must actually land inside the window. A
   window sized to hold two curves' IDENTITY features can still leave one
   of them mostly cropped when the pair sit far apart. THE ONE OWNER of
   this house rule (fix day, 2026-08-13): qT-transform.js's generator used
   to carry a private copy of this exact function, and verify.html's §4b
   re-implemented the same maths inline a third time — two copies that
   could silently drift apart. Both now import this one. */
export function mostlyInFrame(cv, win) {
  const f = makeFn(cv);
  let inside = 0, total = 0;
  for (let i = 0; i <= 60; i++) {
    const x = win.xmin + (i / 60) * (win.xmax - win.xmin), y = f(x);
    if (!Number.isFinite(y)) continue;
    if (cv.kind === "hyperbola" && Math.abs(x - cv.p) < 0.4) continue;
    total++;
    if (y >= win.ymin && y <= win.ymax) inside++;
  }
  return total === 0 || inside / total >= 0.34;
}

/* strip a spec's asymptote LABELS — for questions that ask what the
   asymptote is. Printing "y = −8" on the sketch answers the question. */
export function hideAsymLabels(spec) {
  return { ...spec, asymptotes: (spec.asymptotes || []).map((a) => ({ ...a, label: null })) };
}

/* build a ready-to-draw spec. Returns null when opts.win was not given
   and windowFor() could not fit the curves — the caller must regenerate
   (every quest generator already knows how: it calls itself again). */
export function specFor(curves, opts = {}) {
  const win = opts.win || windowFor(curves, opts);
  if (!win) return null;
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
