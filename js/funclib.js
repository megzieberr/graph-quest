/* ============================================================
   FUNCTION MATHS — every answer key is COMPUTED here
   ------------------------------------------------------------
   House rule from blipwork: quests never hand-type an answer.
   They build a curve spec, ask this library for the intercepts,
   turning point, asymptotes, signs and intervals, and hand the
   same spec to the drawing engine — so the picture and the
   answer key can never disagree.

   A "curve" spec (shared with js/engine/function-graph.js):
     line:        { kind:"line", a, q }               y = a·x + q
     parabola:    { kind:"parabola", a, b, c }        y = a·x² + b·x + c
                  { kind:"parabola", a, p, q }        y = a(x − p)² + q
     hyperbola:   { kind:"hyperbola", a, p, q }       y = a/(x − p) + q
     exp:         { kind:"exp", a, b, p, q }          y = a·bˣ⁻ᵖ + q
     semicircle:  { kind:"semicircle", r, up }        y = ±√(r² − x²)
                  (up:true → upper half, the Tech-Maths default)
   ============================================================ */
import { randInt, pick, shuffled } from "./ui.js";
import { fmtComma, isInt } from "./check.js";

export const C = (v) => fmtComma(v);
export { randInt, pick, shuffled, isInt };

export function fix(n, dp = 2) { return fmtComma(Math.round(n * 10 ** dp) / 10 ** dp, dp); }
export function ptStr(x, y) { return `(${C(x)} ; ${C(y)})`; }
export const neg = (s) => String(s).replace(/-/g, "−");

/* -------- evaluate any curve -------- */
export function makeFn(cv) {
  switch (cv.kind) {
    case "line": return (x) => cv.a * x + cv.q;
    case "parabola":
      return cv.p !== undefined
        ? (x) => cv.a * (x - cv.p) ** 2 + cv.q
        : (x) => cv.a * x * x + cv.b * x + cv.c;
    case "hyperbola": return (x) => cv.a / (x - cv.p) + cv.q;
    case "exp": return (x) => cv.a * Math.pow(cv.b, x - (cv.p || 0)) + cv.q;
    case "semicircle": {
      const s = cv.up === false ? -1 : 1;
      return (x) => (Math.abs(x) > cv.r ? NaN : s * Math.sqrt(Math.max(0, cv.r * cv.r - x * x)));
    }
    default: return () => NaN;
  }
}

/* the x-values where a curve exists (semicircles are the only bounded one) */
export function curveDomain(cv, xmin, xmax) {
  if (cv.kind === "semicircle") return { lo: Math.max(xmin, -cv.r), hi: Math.min(xmax, cv.r) };
  return { lo: xmin, hi: xmax };
}

/* ============================================================ LINE */
export const lineFromGrad = (a, q) => ({ kind: "line", a, q });
export function lineThrough(p1, p2) {
  const a = (p2.y - p1.y) / (p2.x - p1.x);
  return { kind: "line", a, q: p1.y - a * p1.x };
}
export const lineYInt = (cv) => cv.q;
export const lineXInt = (cv) => (cv.a === 0 ? null : -cv.q / cv.a);

/* ============================================================ PARABOLA */
export function parabolaFromRoots(a, r1, r2) {
  return { kind: "parabola", a, b: -a * (r1 + r2), c: a * r1 * r2 };
}
export function parabolaFromTP(a, p, q) {
  return { kind: "parabola", a, b: -2 * a * p, c: a * p * p + q };
}
export function paraStd(cv) {
  if (cv.p !== undefined) { const e = parabolaFromTP(cv.a, cv.p, cv.q); return { a: e.a, b: e.b, c: e.c }; }
  return { a: cv.a, b: cv.b, c: cv.c };
}
export function paraTP(cv) {
  const { a, b, c } = paraStd(cv);
  const x = -b / (2 * a);
  return { x, y: a * x * x + b * x + c };
}
export const paraYInt = (cv) => paraStd(cv).c;
export function paraRoots(cv) {
  const { a, b, c } = paraStd(cv), d = b * b - 4 * a * c;
  if (d < 0) return [];
  const s = Math.sqrt(d);
  const r = [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((u, v) => u - v);
  return d === 0 ? [r[0]] : r;
}

/* ============================================================ HYPERBOLA */
export const hypAsymX = (cv) => cv.p;
export const hypAsymY = (cv) => cv.q;
export const hypYInt = (cv) => (cv.p === 0 ? null : cv.a / (0 - cv.p) + cv.q);
export const hypXInt = (cv) => (cv.q === 0 ? null : cv.p - cv.a / cv.q);

/* ============================================================ EXPONENTIAL */
export const expAsymY = (cv) => cv.q;
export const expYInt = (cv) => cv.a * Math.pow(cv.b, -(cv.p || 0)) + cv.q;
export const expGrows = (cv) => cv.b > 1;
/* x-intercept of a·bˣ⁻ᵖ + q  (exists only when −q/a > 0) */
export function expXInt(cv) {
  const t = -cv.q / cv.a;
  if (!(t > 0)) return null;
  return Math.log(t) / Math.log(cv.b) + (cv.p || 0);
}

/* ============================================================ SEMICIRCLE */
export const semiRadius = (cv) => cv.r;
export const semiXInts = (cv) => [-cv.r, cv.r];
export const semiYInt = (cv) => (cv.up === false ? -cv.r : cv.r);

/* ============================================================
   DOMAIN / RANGE  (CAPS notation, both languages share the symbols)
   ============================================================ */
/* wrapped in .eq: a domain/range never breaks across lines mid-expression */
const EQ = (s) => `<span class="eq">${s}</span>`;

export function domainStr(cv) {
  if (cv.kind === "hyperbola") return EQ(`x ∈ ℝ, x ≠ ${C(cv.p)}`);
  if (cv.kind === "semicircle") return EQ(`${C(-cv.r)} ≤ x ≤ ${C(cv.r)}`);
  return EQ("x ∈ ℝ");
}
export function rangeStr(cv) {
  if (cv.kind === "parabola") {
    const { y: q } = paraTP(cv), a = paraStd(cv).a;
    return EQ(a > 0 ? `y ≥ ${C(q)}` : `y ≤ ${C(q)}`);
  }
  if (cv.kind === "hyperbola") return EQ(`y ∈ ℝ, y ≠ ${C(cv.q)}`);
  if (cv.kind === "exp") return EQ(cv.a > 0 ? `y > ${C(cv.q)}` : `y &lt; ${C(cv.q)}`);
  if (cv.kind === "semicircle") return EQ(cv.up === false ? `${C(-cv.r)} ≤ y ≤ 0` : `0 ≤ y ≤ ${C(cv.r)}`);
  return EQ("y ∈ ℝ");
}
export { EQ };

/* ============================================================
   INTERSECTIONS — numeric sign-change scan, robust for any pair
   ============================================================ */
export function intersections(cvA, cvB, xmin, xmax, step = 0.01) {
  const f = makeFn(cvA), g = makeFn(cvB), xs = [];
  const skip = (x) => (cvA.kind === "hyperbola" && Math.abs(x - cvA.p) < 1e-6) ||
                      (cvB.kind === "hyperbola" && Math.abs(x - cvB.p) < 1e-6);
  const d = (x) => f(x) - g(x);
  let px = xmin, pv = d(px);
  for (let x = xmin + step; x <= xmax + 1e-9; x += step) {
    const v = d(x);
    if (skip(x) || skip(px) || !Number.isFinite(pv) || !Number.isFinite(v)) { px = x; pv = v; continue; }
    if (pv === 0 || pv * v < 0) {
      let lo = px, hi = x, flo = pv;
      for (let i = 0; i < 60; i++) {
        const m = (lo + hi) / 2, vm = d(m);
        if (flo * vm <= 0) hi = m; else { lo = m; flo = vm; }
      }
      xs.push((lo + hi) / 2);
    }
    px = x; pv = v;
  }
  const out = [];
  xs.sort((a, b) => a - b).forEach((x) => { if (!out.length || Math.abs(x - out[out.length - 1]) > 1e-3) out.push(x); });
  return out;
}

/* ============================================================
   SIGN ANALYSIS — the machinery behind Megan's board method
   ------------------------------------------------------------
   criticalXs()  the x-values that split the picture into sections:
                 x-intercepts (where a graph changes sign) and
                 vertical asymptotes (where it jumps). These are
                 exactly the places that earn a cut line.
   sections()    consecutive [x0,x1] bands between those cuts.
   signOf()      the true sign of a curve inside a section.
   ============================================================ */

/* the x-intercepts of one curve, inside a window */
export function xIntercepts(cv, xmin, xmax) {
  let xs = [];
  if (cv.kind === "line") { const t = lineXInt(cv); if (t != null) xs = [t]; }
  else if (cv.kind === "parabola") xs = paraRoots(cv);
  else if (cv.kind === "hyperbola") { const t = hypXInt(cv); if (t != null) xs = [t]; }
  else if (cv.kind === "exp") { const t = expXInt(cv); if (t != null) xs = [t]; }
  else if (cv.kind === "semicircle") xs = semiXInts(cv);
  return xs.filter((x) => Number.isFinite(x) && x > xmin + 1e-9 && x < xmax - 1e-9).sort((a, b) => a - b);
}

/* vertical asymptotes of one curve */
export function vAsymptotes(cv) { return cv.kind === "hyperbola" ? [cv.p] : []; }

/* de-duplicated, sorted cut positions for a set of curves.
   opts.withIntersections → also cut where the curves cross (needed for f > g) */
export function criticalXs(curves, xmin, xmax, opts = {}) {
  const xs = [];
  curves.forEach((cv) => {
    if (opts.zeros !== false) xIntercepts(cv, xmin, xmax).forEach((x) => xs.push({ x, why: "zero" }));
    vAsymptotes(cv).forEach((x) => { if (x > xmin && x < xmax) xs.push({ x, why: "asym" }); });
    /* a semicircle simply stops — its edges are boundaries of the picture too */
    if (cv.kind === "semicircle") [-cv.r, cv.r].forEach((x) => { if (x > xmin && x < xmax) xs.push({ x, why: "edge" }); });
  });
  if (opts.withIntersections && curves.length === 2) {
    intersections(curves[0], curves[1], xmin, xmax).forEach((x) => xs.push({ x, why: "cross" }));
  }
  const out = [];
  xs.sort((a, b) => a.x - b.x).forEach((c) => {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x - c.x) < 1e-3) { if (last.why === "zero" && c.why !== "zero") last.why = c.why; return; }
    out.push({ ...c });
  });
  return out;
}

/* sections between the cuts, each with its midpoint sample x */
export function sections(cuts, xmin, xmax) {
  const bounds = [xmin, ...cuts.map((c) => c.x), xmax];
  const out = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const x0 = bounds[i], x1 = bounds[i + 1];
    if (x1 - x0 < 1e-6) continue;
    out.push({ i: out.length, x0, x1, mid: (x0 + x1) / 2, left: cuts[i - 1] || null, right: cuts[i] || null });
  }
  return out;
}

/* +1 / −1 / 0 — the sign of a curve at a sample x (NaN → null: the
   graph does not exist there, e.g. outside a semicircle) */
export function signAt(cv, x) {
  const y = makeFn(cv)(x);
  if (!Number.isFinite(y)) return null;
  if (Math.abs(y) < 1e-9) return 0;
  return y > 0 ? 1 : -1;
}
/* which of two curves is on top at a sample x (+1 → A above B) */
export function aboveAt(cvA, cvB, x) {
  const ya = makeFn(cvA)(x), yb = makeFn(cvB)(x);
  if (!Number.isFinite(ya) || !Number.isFinite(yb)) return null;
  if (Math.abs(ya - yb) < 1e-9) return 0;
  return ya > yb ? 1 : -1;
}

/* ============================================================
   INTERVAL STRINGS — always written left to right
   ------------------------------------------------------------
   buildIntervalAnswer() takes the sections the learner selected
   and glues touching ones together, then writes the notation.
   `strictAt` lists x-values that can NEVER be included (vertical
   asymptotes, and the excluded end of a strict inequality) — the
   hyperbola trap in the brief.
   ============================================================ */
export function mergeSections(sel) {
  const s = sel.slice().sort((a, b) => a.x0 - b.x0), out = [];
  s.forEach((sec) => {
    const last = out[out.length - 1];
    if (last && Math.abs(last.x1 - sec.x0) < 1e-6) last.x1 = sec.x1;
    else out.push({ x0: sec.x0, x1: sec.x1 });
  });
  return out;
}

/* one interval → a string. `openL/openR` decide < vs ≤ at each end;
   an end sitting on the window edge is written as an open ray. */
export function intervalStr(iv, win, openL = true, openR = true) {
  const atLeft = iv.x0 <= win.xmin + 1e-9, atRight = iv.x1 >= win.xmax - 1e-9;
  const lt = "&lt;", le = "≤";
  if (atLeft && atRight) return "x ∈ ℝ";
  if (atLeft) return `x ${openR ? lt : le} ${C(iv.x1)}`;
  if (atRight) return `x ${openL ? ">" : "≥"} ${C(iv.x0)}`;
  return `${C(iv.x0)} ${openL ? lt : le} x ${openR ? lt : le} ${C(iv.x1)}`;
}

/* the full answer: merged intervals joined with "or" / "of" */
export function joinIntervals(parts, lang = "af") {
  const word = lang === "en" ? " or " : " of ";
  return parts.join(word);
}

/* ============================================================
   EQUATION → display string (decimal comma, real minus signs)
   ============================================================ */
const term = (coef, varStr) => {
  if (coef === 0) return "";
  const a = Math.abs(coef);
  const co = a === 1 && varStr ? "" : C(a);
  return (coef < 0 ? "−" : "+") + " " + co + varStr;
};
const lead = (coef, varStr) => {
  if (coef === 0) return "0";
  const a = Math.abs(coef), co = a === 1 && varStr ? "" : C(a);
  return (coef < 0 ? "−" : "") + co + varStr;
};
export function frac(num, den) {
  return `<span class="frac"><span class="fr-n">${num}</span><span class="fr-d">${den}</span></span>`;
}
export function eqStr(cv, name = "y") {
  if (cv.kind === "line") {
    const t = `${lead(cv.a, "x")}${cv.q ? " " + term(cv.q, "") : ""}`;
    return `${name} = ${cv.a === 0 ? C(cv.q) : t}`.trim();
  }
  if (cv.kind === "parabola") {
    const { a, b, c } = paraStd(cv);
    let s = `${name} = ${lead(a, "x²")}`;
    if (b) s += ` ${term(b, "x")}`;
    if (c) s += ` ${term(c, "")}`;
    return s;
  }
  if (cv.kind === "hyperbola") {
    const denom = cv.p === 0 ? "x" : cv.p > 0 ? `x − ${C(cv.p)}` : `x + ${C(-cv.p)}`;
    const tail = cv.q === 0 ? "" : cv.q > 0 ? ` + ${C(cv.q)}` : ` − ${C(-cv.q)}`;
    return `${name} = ${frac(C(cv.a), denom)}${tail}`;
  }
  if (cv.kind === "exp") {
    const ex = !cv.p ? "x" : cv.p > 0 ? `x − ${C(cv.p)}` : `x + ${C(-cv.p)}`;
    const tail = cv.q === 0 ? "" : cv.q > 0 ? ` + ${C(cv.q)}` : ` − ${C(-cv.q)}`;
    const base = isInt(cv.b) ? C(cv.b) : `(${C(cv.b)})`;
    const co = cv.a === 1 ? "" : cv.a === -1 ? "−" : C(cv.a) + "·";
    return `${name} = ${co}${base}<sup>${ex}</sup>${tail}`;
  }
  if (cv.kind === "semicircle") {
    const inner = `${C(cv.r * cv.r)} − x²`;
    return `${name} = ${cv.up === false ? "−" : ""}√(${inner})`;
  }
  return `${name} = ?`;
}

/* the circle equation a semicircle comes from: x² + y² = r² */
export const circleEq = (cv) => `x² + y² = ${C(cv.r * cv.r)}`;

/* ============================================================
   DECOYS — wrong options that are wrong for a REASON
   (blipwork rule: filter by VALUE so a decoy can never equal the
   right answer numerically, only mc()'s string de-dupe is not enough)
   ============================================================ */
export function ptDecoys(x, y) {
  const cands = [[y, x], [x, -y], [-x, y], [x, y + 1], [x + 1, y], [-x, -y]];
  return cands
    .filter(([a, b]) => !(Math.abs(a - x) < 1e-9 && Math.abs(b - y) < 1e-9))
    .map(([a, b]) => ptStr(a, b));
}
export function numDecoys(v, extras = []) {
  return [...extras, -v, v + 1, v - 1, v * 2].filter((d) => Number.isFinite(d) && Math.abs(d - v) > 1e-9);
}
