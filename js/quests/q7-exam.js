/* ============================================================
   QUEST 7 · EKSAMENMODUS — one sketch, many sub-questions
   ★ batch 3, session 5 — REBUILT (sheets are generated, not authored)
   ------------------------------------------------------------
   The transfer test, and the last quest on the map: exactly the shape
   of a real paper's numbered question — ONE sketch, 5–6 sub-questions
   in exam wording, crossing every skill batches 1–3 teach.

   WHAT CHANGED IN THE REBUILD (design: GQ-BATCH3-DESIGN.md
   § "Eksamenmodus rebuild"; run plan: RUN-PLAN-BATCH3.md § SESSION 5):

   1. SHEETS ARE GENERATED. Every curve comes out of the same family
      generators the skill quests use — randHyperbolaOffAxis() (never
      randHyperbola(), never p = 0), randParabola(), randExp(),
      randLine(), randSemicircle(). Frame and window discipline are
      inherited for free (windowFor + mostlyInFrame + every point a
      sub-question is ABOUT in `include:`). This deletes the old
      sheetHypLine()'s hard-coded p = 0 by construction — the on-axis
      asymptote a learner could see in exam mode until today.
   2. BOUNDED RETRY LOOPS, never recursion (the qL/qG/qF house style —
      the old sheets called themselves again on a failed draw).
   3. SUB-QUESTIONS ARE SAMPLED from every skill that now exists, each
      worded the way a paper words it. The phrasing bank of the old
      hand-authored sheets is kept and extended, sentence for sentence.
   4. ANSWERS ARE COMPUTED from the curve objects by funclib /
      _intervals / _fault / qT's own move maths — nothing hand-typed.
      Where a helper rejects a draw (a non-integer intercept, an
      intersection off the grid, a degenerate section, a decoy that
      collapses onto the answer) the whole sheet is redrawn.

   THE SKETCH SHOWS WHERE, NEVER THE VALUE. Marked points carry a
   LETTER (A, B, P, Q, R, S) through the engine's own point/label path,
   never their coordinates, and an exam sheet never prints an
   asymptote's equation on the picture (`asymLabels` stays off): one
   sketch serves five or six questions in a row, so a value printed for
   question (a) would still be sitting there when question (e) asks for
   it. hideAsymLabels() is still applied to the asymptote question
   itself, belt-and-braces, so the rule survives anyone turning the
   labels back on. Everything else is read off the axis ticks, which is
   exactly what a paper asks for.

   A sheet never asks the same skill twice, and the three "what is the
   equation?" skills (whichEquation · transform · matchEq) are mutually
   exclusive inside one sheet — any one of them printing or naming f's
   equation would answer the other two.
   ============================================================ */
import { mc, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import {
  specFor, windowFor, mostlyInFrame, hideAsymLabels, asymOnAxis, curveLabelsClash,
  randLine, randParabola, randHyperbolaOffAxis, randExp, randSemicircle,
} from "./_graphs.js";
import {
  makeFn, intersections, criticalXs, sections, signAt, aboveAt,
  eqStr, EQ, EQL, C, pick, shuffled, ptStr, isInt,
  domainStr, rangeStr, paraTP, paraStd, paraRoots, paraYInt,
  hypXInt, expXInt, expYInt, lineXInt,
  lengthBetween, avgGradient, gradientStr, circleEq, frac,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";
/* the move maths of Transformasies, and the numeral-overlap guard of
   Lengtes — reused, never re-derived (both are plain `export` additions
   to those files; neither quest's behaviour changed) */
import { shifted, deltaFor, eqStrFor } from "./qT-transform.js";
import { noNumeralOverlap } from "./qL-lengths.js";
/* the fault machinery of Soek die fout — pure functions, no DOM */
import {
  KINDS, FAMILIES_FOR, injectFault, whyOptions, faultGap, faultSolution, eqOf, tpForm,
} from "./_fault.js";

const ACC = "#6fd0ff";

/* a decoy curve has to be VISIBLY a different graph — faultGap() is the
   one owner of "how far apart are these two curves inside this window",
   so the equation rounds ask it rather than re-measuring */
const MIN_DECOY_GAP = 0.6;

/* at most four labelled dots on one sketch: past that the letters start
   fighting each other and the curve for room */
const MAX_MARKS = 4;

/* ============================================================
   SMALL SHARED HELPERS
   ============================================================ */
const AND = (lang) => (lang === "en" ? "and" : "en");
const LT = "&lt;", GT = "&gt;";

/* bilingual concatenation onto a sheet stem (a sub-question that has to
   quote an equation of its own puts it on its own line) */
const stemPlus = (stem, add) => ({ en: stem.en + add.en, af: stem.af + add.af });

/* the letters a sheet hands out to marked points, in order */
function letterPool() {
  const pool = ["A", "B", "P", "Q", "R", "S"];
  let i = 0;
  return {
    take(n) {
      if (i + n > pool.length) return null;
      const out = pool.slice(i, i + n);
      i += n;
      return out;
    },
  };
}

/* every whole-number point of a curve that is comfortably inside the
   window — the only places a sheet is ever allowed to mark, so a marked
   point can always be read off the grid */
function integerPoints(cv, win, opts = {}) {
  const f = makeFn(cv), out = [];
  const lo = Math.ceil(win.xmin) + 1, hi = Math.floor(win.xmax) - 1;
  for (let x = lo; x <= hi; x++) {
    if (cv.kind === "hyperbola" && Math.abs(x - cv.p) < 0.6) continue;
    const y = f(x);
    if (!Number.isFinite(y) || !isInt(y)) continue;
    if (y < win.ymin + 0.6 || y > win.ymax - 0.6) continue;
    if (opts.noOrigin && x === 0 && y === 0) continue;
    out.push({ x, y: Math.round(y) });
  }
  return out;
}

/* the intersections of two curves, but ONLY when every one of them
   lands on a grid point — windows crop and eyes read integers, so a
   sheet whose crossings sit at x = 1,37 is thrown away */
function gridCrossings(a, b, win) {
  const xs = intersections(a, b, win.xmin, win.xmax);
  if (!xs.length) return null;
  const out = [];
  for (const x of xs) {
    const rx = Math.round(x);
    if (Math.abs(x - rx) > 1e-6) return null;
    const y = makeFn(a)(rx);
    if (!Number.isFinite(y) || !isInt(y)) return null;
    out.push({ x: rx, y: Math.round(y) });
  }
  return out;
}

/* the two CURVE-NAME labels ("f" and "g") used to be placed one curve at
   a time, blind to each other, and landed on top of each other on ~1,3%
   of two-curve draws — this file carried its own clash test and redrew
   the sheet. Batch 3 session 6 moved BOTH halves into _graphs.js:
   specFor() now refuses a clashing candidate outright (engine-wide, so
   every quest gets it), and the test itself is the exported
   curveLabelsClash(), built on the engine's own curveLabelBox(). This
   file keeps calling it as a belt-and-braces guard — an exam sheet is
   the one place a crowded label is least forgivable. */

const inside = (p, win, m = 0.4) =>
  (p.x == null || (p.x > win.xmin + m && p.x < win.xmax - m)) &&
  (p.y == null || (p.y > win.ymin + m && p.y < win.ymax - m));

/* pick the first `n` DISTINCT decoy labels from a candidate pool,
   filtered by rendered text against the correct answer (mc() de-dupes
   too, but a generator that ships three options is a generator that
   quietly relaxed the four-option rule) */
function decoysFrom(correct, pool, n = 3) {
  /* compare on the RENDERED text in BOTH languages — a bilingual option
     is an object, and String()-ing one turns every distinct option into
     the same "[object Object]" */
  const flat = (v) => {
    if (v == null) return "";
    const lab = (typeof v === "object" && "label" in v) ? v.label : v;
    const s = (lab && typeof lab === "object")
      ? `${lab.en == null ? "" : lab.en}|${lab.af == null ? "" : lab.af}`
      : String(lab);
    return s.replace(/<[^>]*>/g, "").trim();
  };
  const seen = new Set([flat(correct)]);
  const out = [];
  for (const cand of pool) {
    if (cand == null) continue;
    const k = flat(cand);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(cand);
    if (out.length === n) break;
  }
  return out.length === n ? out : null;
}

/* re-tag ONE cut so an interval answer closes (or refuses to close) at
   exactly that boundary — the one-boundary decoy shape qI uses */
const forceWhy = (cuts, x, why) =>
  cuts.map((c) => (Math.abs(c.x - x) < 1e-6 ? { ...c, why } : c));

/* ============================================================
   THE FIVE SHEET SHAPES
   ------------------------------------------------------------
   Each is a pair (or a single curve) drawn through the family
   generators, plus the letter each curve wears on the sketch. The
   "main" curve is the one nearly every sub-question is about; the
   "other" is the partner a comparison needs.
   ============================================================ */
export const SHAPES = ["semiExp", "hypLine", "parabola", "paraLine", "expLine"];

/* a line drawn by randLine() whose crossings with `f` all land on grid
   points. randLine() stays the generator — this is plain rejection
   sampling on top of it, never a hand-built line. */
function lineCrossing(f) {
  for (let i = 0; i < 200; i++) {
    const g = randLine();
    const w = windowFor([f, g]);
    if (!w) continue;
    if (!mostlyInFrame(f, w) || !mostlyInFrame(g, w)) continue;
    if (!gridCrossings(f, g, w)) continue;
    return g;
  }
  return null;
}

function drawShape(shape) {
  if (shape === "semiExp") {
    const h = randSemicircle();
    const g = randExp();
    return { curves: [h, g], names: ["h", "g"], main: 1, other: 0 };
  }
  if (shape === "parabola") {
    return { curves: [randParabola()], names: ["f"], main: 0, other: -1 };
  }
  const f = shape === "hypLine" ? randHyperbolaOffAxis()
    : shape === "paraLine" ? randParabola() : randExp();
  const g = lineCrossing(f);
  if (!g) return null;
  return { curves: [f, g], names: ["f", "g"], main: 0, other: 1 };
}

/* ============================================================
   THE SKILL MENU
   ------------------------------------------------------------
   One entry per skill batches 1–3 teach. `prep(ctx)` either returns a
   prepared sub-question or null ("this draw cannot carry me") — a null
   drops the skill and the sheet tries the next candidate.

     marks    the dots this sub-question needs on the shared sketch
     stemBit  a sentence the sheet stem gains because of those dots
     build    (spec, stem) → the mc() item
     debug    everything the harness needs to recompute the answer
   ============================================================ */

/* the order a paper asks them in */
const RANK = {
  asymptotes: 1, intercepts: 2, pointCoords: 3, domain: 4, range: 5,
  increasing: 6, signOfF: 7, fgCompare: 8, xTimesF: 9, fOverG: 10,
  length: 11, avgGradient: 12, kCuts: 13,
  whichEquation: 14, transform: 15, matchEq: 16,
};

/* the "this is what the equation says" family — at most one per sheet */
const EQ_GROUP = ["whichEquation", "transform", "matchEq"];

const AVAILABLE = {
  semiExp: ["asymptotes", "intercepts", "pointCoords", "domain", "range", "increasing",
    "signOfF", "xTimesF", "length", "avgGradient", ...EQ_GROUP],
  hypLine: ["asymptotes", "intercepts", "pointCoords", "domain", "range", "increasing",
    "signOfF", "fgCompare", "xTimesF", "fOverG", "length", "avgGradient", "kCuts", ...EQ_GROUP],
  parabola: ["intercepts", "pointCoords", "range", "increasing",
    "signOfF", "xTimesF", "length", "avgGradient", "kCuts", ...EQ_GROUP],
  paraLine: ["intercepts", "pointCoords", "range", "increasing",
    "signOfF", "fgCompare", "xTimesF", "fOverG", "length", "avgGradient", "kCuts", ...EQ_GROUP],
  expLine: ["asymptotes", "intercepts", "pointCoords", "range", "increasing",
    "signOfF", "fgCompare", "xTimesF", "fOverG", "length", "avgGradient", "kCuts", ...EQ_GROUP],
};

/* ---------- (a) asymptotes ---------- */
function prepAsymptotes(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], lang = ctx.lang;
  if (cv.kind === "hyperbola") {
    const correct = `x = ${C(cv.p)} ${AND(lang)} y = ${C(cv.q)}`;
    const wrongs = decoysFrom(correct, [
      { label: `x = ${C(cv.q)} ${AND(lang)} y = ${C(cv.p)}`,
        misc: B("The two asymptotes are swapped — the vertical one is the x-one.",
                "Die twee asimptote is omgeruil — die vertikale een is die x-een.") },
      { label: `x = ${C(cv.p)} ${AND(lang)} y = 0`,
        misc: B("The horizontal asymptote is not the x-axis here — look where the wings flatten out.",
                "Die horisontale asimptoot is nie hier die x-as nie — kyk waar die vlerkies plat uitloop.") },
      `y = ${C(cv.q)} ${lang === "en" ? "only" : "alleen"}`,
      `x = ${C(-cv.p)} ${AND(lang)} y = ${C(-cv.q)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "asymptotes", marks: [], hideAsym: true,
      prompt: B(`Write down the equations of the asymptotes of ${nm}.`,
                `Skryf die vergelykings van die asimptote van ${nm} neer.`),
      concept: "range", correct, wrongs,
      debug: { p: cv.p, q: cv.q, kind: cv.kind },
    };
  }
  if (cv.kind === "exp") {
    const correct = `y = ${C(cv.q)}`;
    const wrongs = decoysFrom(correct, [
      { label: `x = ${C(cv.q)}`,
        misc: B("That is a vertical line — an exponential graph flattens against a HORIZONTAL one.",
                "Dis 'n vertikale lyn — 'n eksponensiële grafiek loop plat teen 'n HORISONTALE een.") },
      `y = ${C(-cv.q)}`, "y = 0", `x = ${C(-cv.q)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "asymptotes", marks: [], hideAsym: true,
      prompt: B(`Write down the equation of the asymptote of ${nm}.`,
                `Skryf die vergelyking van die asimptoot van ${nm} neer.`),
      concept: "range", correct, wrongs,
      debug: { q: cv.q, kind: cv.kind },
    };
  }
  return null;
}

/* ---------- (b) intercepts ---------- */
function prepIntercepts(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], win = ctx.win, lang = ctx.lang;
  if (cv.kind === "parabola") {
    const roots = paraRoots(cv);
    if (roots.length !== 2 || !roots.every(isInt)) return null;
    if (!roots.every((r) => r > win.xmin + 0.4 && r < win.xmax - 0.4)) return null;
    const [r1, r2] = roots.map(Math.round);
    const correct = `${ptStr(r1, 0)} ${AND(lang)} ${ptStr(r2, 0)}`;
    const wrongs = decoysFrom(correct, [
      { label: `${ptStr(0, r1)} ${AND(lang)} ${ptStr(0, r2)}`,
        misc: B("Those are written the wrong way round — an x-intercept has y = 0.",
                "Dit is andersom geskryf — 'n x-afsnit het y = 0.") },
      `${ptStr(-r1, 0)} ${AND(lang)} ${ptStr(-r2, 0)}`,
      ptStr(0, paraYInt(cv)),
      `${ptStr(r1, 0)} ${AND(lang)} ${ptStr(r2 + 1, 0)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "intercepts", marks: [],
      prompt: B(`Write down the x-intercepts of ${nm}.`, `Skryf die x-afsnitte van ${nm} neer.`),
      concept: "readGraph", correct, wrongs,
      debug: { roots: [r1, r2], kind: cv.kind },
    };
  }
  const xi = cv.kind === "hyperbola" ? hypXInt(cv) : cv.kind === "exp" ? expXInt(cv) : lineXInt(cv);
  if (xi == null || !isInt(xi)) return null;
  const x = Math.round(xi);
  if (x <= win.xmin + 0.4 || x >= win.xmax - 0.4) return null;
  const correct = ptStr(x, 0);
  const wrongs = decoysFrom(correct, [
    { label: ptStr(0, x),
      misc: B("That is written the wrong way round — an x-intercept has y = 0.",
              "Dit is andersom geskryf — 'n x-afsnit het y = 0.") },
    ptStr(-x, 0),
    ptStr(0, cv.kind === "exp" ? expYInt(cv) : cv.q),
    ptStr(x, cv.q),
  ]);
  if (!wrongs) return null;
  return {
    id: "intercepts", marks: [],
    prompt: B(`Calculate the x-intercept of ${nm}.`, `Bereken die x-afsnit van ${nm}.`),
    concept: "readGraph", correct, wrongs,
    debug: { xInt: x, kind: cv.kind },
  };
}

/* ---------- (c) coordinates of a marked point / intersection ---------- */
function prepPointCoords(ctx) {
  const lang = ctx.lang;
  /* two curves that really cross: the paper's own "hulle sny by A en B" */
  if (ctx.crossings && ctx.crossings.length) {
    const pts = ctx.crossings.slice(0, 2);
    const letters = ctx.letters.take(pts.length);
    if (!letters) return null;
    const marks = pts.map((p, i) => ({ x: p.x, y: p.y, on: ctx.main, label: letters[i] }));
    const one = pts.length === 1;
    /* two points are written the way a paper writes them, A(…), B(…);
       a single one is just its own coordinates — the prompt already
       named it, so repeating the letter reads like a typo */
    const say = (f) => pts.map((p, i) => `${one ? "" : letters[i]}${f(p)}`).join(one ? "" : ", ");
    const correct = say((p) => ptStr(p.x, p.y));
    const wrongs = decoysFrom(correct, [
      { label: say((p) => ptStr(p.y, p.x)),
        misc: B("The x and the y are swapped — read across first, then up.",
                "Die x en die y is omgeruil — lees eers oor, dan op.") },
      say((p) => ptStr(p.x, -p.y)),
      say((p) => ptStr(-p.x, p.y)),
      say((p) => ptStr(p.x + 1, p.y)),
    ]);
    if (!wrongs) return null;
    return {
      id: "pointCoords", marks,
      stemBit: one
        ? B(`They cut each other at ${letters[0]}.`, `Hulle sny mekaar by ${letters[0]}.`)
        : B(`They cut each other at ${letters[0]} and ${letters[1]}.`,
            `Hulle sny mekaar by ${letters[0]} en ${letters[1]}.`),
      prompt: one
        ? B(`Write down the coordinates of ${letters[0]}.`, `Skryf die koördinate van ${letters[0]} neer.`)
        : B(`Write down the coordinates of ${letters[0]} and ${letters[1]}.`,
            `Skryf die koördinate van ${letters[0]} en ${letters[1]} neer.`),
      concept: "pointOnGraph", correct, wrongs,
      debug: { pts, letters, from: "crossings" },
    };
  }
  /* a single curve: the turning point is what a paper marks */
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main];
  let pt = null, isTP = false;
  if (cv.kind === "parabola") {
    const tp = paraTP(cv);
    if (isInt(tp.x) && isInt(tp.y) && inside({ x: tp.x, y: tp.y }, ctx.win, 0.6)) {
      pt = { x: Math.round(tp.x), y: Math.round(tp.y) }; isTP = true;
    }
  }
  if (!pt) {
    const cands = integerPoints(cv, ctx.win, { noOrigin: true }).filter((p) => p.x !== 0 && p.y !== 0);
    if (!cands.length) return null;
    pt = pick(cands);
  }
  const letters = ctx.letters.take(1);
  if (!letters) return null;
  const L1 = letters[0];
  const correct = ptStr(pt.x, pt.y);
  const wrongs = decoysFrom(correct, [
    { label: ptStr(pt.y, pt.x),
      misc: B("The x and the y are swapped — read across first, then up.",
              "Die x en die y is omgeruil — lees eers oor, dan op.") },
    ptStr(pt.x, -pt.y), ptStr(-pt.x, pt.y), ptStr(pt.x + 1, pt.y),
  ]);
  if (!wrongs) return null;
  return {
    id: "pointCoords",
    marks: [{ x: pt.x, y: pt.y, on: ctx.main, label: L1, place: pt.y < 0 ? "below" : "above" }],
    stemBit: isTP
      ? B(`${L1} is the turning point of ${nm}.`, `${L1} is die draaipunt van ${nm}.`)
      : B(`${L1} lies on ${nm}.`, `${L1} lê op ${nm}.`),
    prompt: B(`Write down the coordinates of ${L1}.`, `Skryf die koördinate van ${L1} neer.`),
    concept: "pointOnGraph", correct, wrongs,
    debug: { pts: [pt], letters: [L1], from: isTP ? "tp" : "onCurve" },
  };
}

/* ---------- (d) domain ---------- */
function prepDomain(ctx) {
  /* only where the domain is a real reading: a hyperbola's gap, or a
     semicircle's edges. "x ∈ ℝ" for a parabola is not a question. */
  const idx = ctx.curves.findIndex((c) => c.kind === "hyperbola" || c.kind === "semicircle");
  if (idx < 0) return null;
  const cv = ctx.curves[idx], nm = ctx.names[idx];
  const correct = domainStr(cv);
  const pool = cv.kind === "hyperbola"
    ? [{ label: EQ("x ∈ ℝ"),
         misc: B("Look at the vertical dashed line — the graph has no value at all there.",
                 "Kyk na die vertikale stippellyn — die grafiek het glad nie 'n waarde daar nie.") },
       EQ(`x ∈ ℝ, x ≠ ${C(cv.q)}`), EQ(`y ∈ ℝ, y ≠ ${C(cv.q)}`), EQ(`x ≠ ${C(cv.p)}`)]
    : [{ label: EQ(`${C(-cv.r)} ${LT} x ${LT} ${C(cv.r)}`),
         misc: B("The half circle really does reach both edges — those two x-values are on the graph.",
                 "Die halwe sirkel bereik wel albei rande — daardie twee x-waardes lê op die grafiek.") },
       EQ(`0 ≤ x ≤ ${C(cv.r)}`), EQ("x ∈ ℝ"), EQ(`${C(-cv.r)} ≤ y ≤ ${C(cv.r)}`)];
  const wrongs = decoysFrom(correct, pool);
  if (!wrongs) return null;
  return {
    id: "domain", marks: [],
    prompt: B(`Write down the domain of ${nm}.`, `Skryf die definisieversameling van ${nm} neer.`),
    concept: "domain", correct, wrongs,
    debug: { on: idx, kind: cv.kind },
  };
}

/* ---------- (e) range ---------- */
function prepRange(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main];
  const correct = rangeStr(cv);
  let pool = [];
  if (cv.kind === "parabola") {
    const tp = paraTP(cv), up = paraStd(cv).a > 0;
    pool = [
      { label: EQ(up ? `y ≤ ${C(tp.y)}` : `y ≥ ${C(tp.y)}`),
        misc: B("The inequality points the wrong way — look which side of the turning point the arms open.",
                "Die ongelykheid wys die verkeerde kant toe — kyk aan watter kant van die draaipunt die arms oopmaak.") },
      EQ(`x ${up ? "≥" : "≤"} ${C(tp.x)}`), EQ("y ∈ ℝ"), EQ(`y ${up ? GT : LT} ${C(tp.y)}`),
    ];
  } else if (cv.kind === "hyperbola") {
    pool = [
      { label: EQ(`y ${GT} ${C(cv.q)}`),
        misc: B("A hyperbola reaches every height except one — the one its horizontal asymptote sits at.",
                "'n Hiperbool bereik elke hoogte behalwe een — die een waar sy horisontale asimptoot lê.") },
      EQ("y ∈ ℝ"), domainStr(cv), EQ(`y ∈ ℝ, y ≠ ${C(cv.p)}`),
    ];
  } else if (cv.kind === "exp") {
    const up = cv.a > 0;
    pool = [
      { label: EQ(up ? `y ≥ ${C(cv.q)}` : `y ≤ ${C(cv.q)}`),
        misc: B("The graph never actually reaches its asymptote, so that height can never close.",
                "Die grafiek bereik nooit werklik sy asimptoot nie, so daardie hoogte kan nooit toemaak nie.") },
      EQ(up ? `y ${LT} ${C(cv.q)}` : `y ${GT} ${C(cv.q)}`), EQ("y ∈ ℝ"), domainStr(cv),
    ];
  } else return null;
  const wrongs = decoysFrom(correct, pool);
  if (!wrongs) return null;
  return {
    id: "range", marks: [],
    prompt: B(`Write down the range of ${nm}.`, `Skryf die waardeversameling van ${nm} neer.`),
    concept: "range", correct, wrongs,
    debug: { kind: cv.kind },
  };
}

/* ---------- (f) increasing / decreasing ---------- */
function prepIncreasing(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main];
  if (cv.kind === "parabola") {
    const tp = paraTP(cv), up = paraStd(cv).a > 0;
    if (!isInt(tp.x)) return null;
    const correct = up ? `x ${GT} ${C(tp.x)}` : `x ${LT} ${C(tp.x)}`;
    const wrongs = decoysFrom(correct, [
      { label: up ? `x ${LT} ${C(tp.x)}` : `x ${GT} ${C(tp.x)}`,
        misc: B("That is the side where it falls — follow the curve with your eye, left to right.",
                "Dis die kant waar dit daal — volg die kurwe met jou oog, links na regs.") },
      `y ${GT} ${C(tp.y)}`, `x ${GT} ${C(tp.y)}`, `x ${up ? "≥" : "≤"} ${C(tp.x)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "increasing", marks: [],
      prompt: B(`For which values of x is ${nm} increasing?`, `Vir watter waardes van x is ${nm} stygend?`),
      concept: "increasing", correct, wrongs,
      debug: { kind: cv.kind, tpx: tp.x, up },
    };
  }
  if (cv.kind === "hyperbola") {
    const dec = cv.a > 0;
    const correct = dec
      ? B("Decreasing — a is positive", "Dalend — a is positief")
      : B("Increasing — a is negative", "Stygend — a is negatief");
    const wrongs = decoysFrom(correct, [
      { label: dec ? B("Increasing — a is positive", "Stygend — a is positief")
                   : B("Decreasing — a is negative", "Dalend — a is negatief"),
        misc: B("Follow one wing with your eye, left to right — which way does it go?",
                "Volg een vlerkie met jou oog, links na regs — watter kant toe gaan dit?") },
      B("One rises, one falls", "Een styg, een daal"),
      B("It turns at the asymptote", "Dit draai by die asimptoot"),
    ]);
    if (!wrongs) return null;
    return {
      id: "increasing", marks: [],
      prompt: B(`Is each wing of ${nm} increasing or decreasing?`,
                `Is elke vlerkie van ${nm} stygend of dalend?`),
      concept: "increasing", correct, wrongs,
      debug: { kind: cv.kind, a: cv.a },
    };
  }
  if (cv.kind === "exp") {
    const rises = (cv.a > 0) === (cv.b > 1);
    const correct = rises
      ? B(`Increasing — a is positive and b = ${C(cv.b)} is bigger than 1`,
          `Stygend — a is positief en b = ${C(cv.b)} is groter as 1`)
      : B("Decreasing — a is negative, so the graph is turned over",
          "Dalend — a is negatief, dus is die grafiek omgekeer");
    const wrongs = decoysFrom(correct, [
      { label: rises ? B("Decreasing — a is negative", "Dalend — a is negatief")
                     : B("Increasing — a is positive", "Stygend — a is positief"),
        misc: B("Follow the curve with your eye, left to right — which way does it go?",
                "Volg die kurwe met jou oog, links na regs — watter kant toe gaan dit?") },
      B("Increasing, then decreasing", "Stygend, dan dalend"),
      B(`Decreasing — q is negative (${C(cv.q)})`, `Dalend — q is negatief (${C(cv.q)})`),
    ]);
    if (!wrongs) return null;
    return {
      id: "increasing", marks: [],
      prompt: B(`Is ${nm} increasing or decreasing? Give a reason.`,
                `Is ${nm} stygend of dalend? Gee 'n rede.`),
      concept: "increasing", correct, wrongs,
      debug: { kind: cv.kind, a: cv.a, b: cv.b, rises },
    };
  }
  return null;
}

/* ---------- (g) sign of f ---------- */
function prepSignOfF(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], win = ctx.win, lang = ctx.lang;
  const cuts = criticalXs([cv], win.xmin, win.xmax);
  if (!cuts.length) return null;
  const secs = sections(cuts, win.xmin, win.xmax);
  const wantNeg = pick([true, false]);
  const chosen = secs.filter((s) => {
    const sg = signAt(cv, s.mid);
    return sg != null && (wantNeg ? sg < 0 : sg > 0);
  });
  if (!chosen.length || chosen.length === secs.length) return null;
  const correct = answerString(chosen, cuts, win, { strict: true, lang });
  const wrongs = decoysFrom(correct, [
    { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
      misc: wantNeg
        ? B("Those are the sections where the graph lies ABOVE the x-axis.",
            "Daai is die afdelings waar die grafiek BO die x-as lê.")
        : B("Those are the sections where the graph lies BELOW the x-axis.",
            "Daai is die afdelings waar die grafiek ONDER die x-as lê.") },
    { label: asYString(correct),
      misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
    flipStrictString(chosen, cuts, win, { strict: true, lang }),
  ]);
  if (!wrongs) return null;
  const sym = wantNeg ? `${LT} 0` : `${GT} 0`;
  return {
    id: "signOfF", marks: [],
    prompt: B(`For which values of x is <span class='eq'>${nm}(x) ${sym}</span>?`,
              `Vir watter waardes van x is <span class='eq'>${nm}(x) ${sym}</span>?`),
    concept: "signs", correct, wrongs,
    debug: { on: ctx.main, wantNeg, strict: true },
  };
}

/* ---------- (h) f above g ---------- */
function prepFgCompare(ctx) {
  if (ctx.other < 0) return null;
  const f = ctx.curves[ctx.main], g = ctx.curves[ctx.other];
  const nf = ctx.names[ctx.main], ng = ctx.names[ctx.other];
  const win = ctx.win, lang = ctx.lang;
  const cuts = criticalXs([f, g], win.xmin, win.xmax, { zeros: false, withIntersections: true });
  if (!cuts.length) return null;
  if (!cuts.every((c) => c.why !== "cross" || isInt(c.x))) return null;
  const secs = sections(cuts, win.xmin, win.xmax);
  const wantAbove = pick([true, false]);
  const chosen = secs.filter((s) => {
    const ab = aboveAt(f, g, s.mid);
    return ab != null && (wantAbove ? ab > 0 : ab < 0);
  });
  if (!chosen.length || chosen.length === secs.length) return null;
  const correct = answerString(chosen, cuts, win, { strict: true, lang });
  const wrongs = decoysFrom(correct, [
    { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
      misc: B("That is the other way round — check which graph is on TOP there.",
              "Dis andersom — kyk watter grafiek BO lê daar.") },
    { label: asYString(correct),
      misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
    flipStrictString(chosen, cuts, win, { strict: true, lang }),
  ]);
  if (!wrongs) return null;
  const sym = wantAbove ? GT : LT;
  return {
    id: "fgCompare", marks: [],
    prompt: B(`For which values of x is <span class='eq'>${nf}(x) ${sym} ${ng}(x)</span>?`,
              `Vir watter waardes van x is <span class='eq'>${nf}(x) ${sym} ${ng}(x)</span>?`),
    concept: "compare", correct, wrongs,
    debug: { wantAbove, strict: true },
  };
}

/* ---------- (i) x·f(x) ---------- */
function prepXTimesF(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], win = ctx.win, lang = ctx.lang;
  if (!(win.xmin < -0.8 && win.xmax > 0.8)) return null;
  const own = criticalXs([cv], win.xmin, win.xmax);
  if (!own.length) return null;
  if (own.some((c) => Math.abs(c.x) < 1)) return null;         // keep the y-axis boundary clean
  const cuts = [...own, { x: 0, why: "zero" }].sort((a, b) => a.x - b.x);
  const secs = sections(cuts, win.xmin, win.xmax);
  const wantNeg = pick([true, false]);
  const strict = pick([true, false]);
  const chosen = secs.filter((s) => {
    const sg = signAt(cv, s.mid);
    if (sg == null) return false;
    const p = (s.mid < 0 ? -1 : 1) * sg;
    return wantNeg ? p < 0 : p > 0;
  });
  if (!chosen.length || chosen.length === secs.length) return null;
  const correct = answerString(chosen, cuts, win, { strict, lang });
  const wrongs = decoysFrom(correct, [
    { label: complementString(chosen, secs, cuts, win, { strict, lang }),
      misc: wantNeg
        ? B("Those are the sections where x and f(x) share a sign — quadrant 1 or 3.",
            "Daai is die afdelings waar x en f(x) dieselfde teken deel — kwadrant 1 of 3.")
        : B("Those are the sections where x and f(x) have different signs — quadrant 2 or 4.",
            "Daai is die afdelings waar x en f(x) verskillende tekens het — kwadrant 2 of 4.") },
    { label: flipStrictString(chosen, cuts, win, { strict, lang }),
      misc: strict
        ? B("A strict inequality never includes the boundaries.",
            "'n Streng ongelykheid sluit nooit die grense in nie.")
        : B("≤ and ≥ DO include the x-intercepts, and the y-axis boundary closes the same way.",
            "≤ en ≥ sluit WEL die x-afsnitte in, en die y-as grens maak net so toe.") },
    { label: asYString(correct),
      misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
  ]);
  if (!wrongs) return null;
  const sym = wantNeg ? (strict ? `${LT} 0` : "≤ 0") : (strict ? `${GT} 0` : "≥ 0");
  return {
    id: "xTimesF", marks: [],
    prompt: B(`For which values of x is <span class='eq'>x·${nm}(x) ${sym}</span>?`,
              `Vir watter waardes van x is <span class='eq'>x·${nm}(x) ${sym}</span>?`),
    concept: "product", correct, wrongs,
    debug: { wantNeg, strict, cuts: cuts.map((c) => ({ x: c.x, why: c.why })) },
  };
}

/* ---------- (j) f(x)/g(x) ---------- */
function prepFOverG(ctx) {
  if (ctx.other < 0) return null;
  const f = ctx.curves[ctx.main], g = ctx.curves[ctx.other];
  if (g.kind !== "line") return null;
  const nf = ctx.names[ctx.main], ng = ctx.names[ctx.other];
  const win = ctx.win, lang = ctx.lang;
  const gRoot = lineXInt(g);
  if (gRoot == null || !isInt(gRoot)) return null;
  if (gRoot <= win.xmin + 0.5 || gRoot >= win.xmax - 0.5) return null;
  const own = criticalXs([f], win.xmin, win.xmax);
  if (!own.length) return null;
  if (own.some((c) => Math.abs(c.x - gRoot) < 0.6)) return null;
  /* g's own root is as forbidden as an asymptote — nothing is drawn
     breaking there, but f/g is undefined, so the boundary never closes.
     _intervals.js only knows the tag "asym", so that is what it is told. */
  const cuts = [...own, { x: gRoot, why: "asym" }].sort((a, b) => a.x - b.x);
  const secs = sections(cuts, win.xmin, win.xmax);
  const wantNeg = pick([true, false]);
  const chosen = secs.filter((s) => {
    const a = signAt(f, s.mid), b = signAt(g, s.mid);
    if (a == null || b == null) return false;
    return wantNeg ? a * b < 0 : a * b > 0;
  });
  if (!chosen.length || chosen.length === secs.length) return null;
  const correct = answerString(chosen, cuts, win, { strict: false, lang });
  const closedAtG = answerString(chosen, forceWhy(cuts, gRoot, "zero"), win, { strict: false, lang });
  const wrongs = decoysFrom(correct, [
    { label: closedAtG,
      misc: B("You can't divide by zero — that x always stays open.",
              "Deel deur nul mag nie — daardie x bly oop.") },
    { label: complementString(chosen, secs, cuts, win, { strict: false, lang }),
      misc: B("That is the other way round — compare it exactly as f·g, section by section.",
              "Dis andersom — vergelyk dit presies soos f·g, afdeling vir afdeling.") },
    { label: asYString(correct),
      misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
  ]);
  if (!wrongs) return null;
  const sym = wantNeg ? "≤ 0" : "≥ 0";
  /* the stacked vinculum, funclib's own frac() — the same fraction qI
     writes this inequality with */
  const quot = frac(`${nf}(x)`, `${ng}(x)`);
  return {
    id: "fOverG", marks: [],
    prompt: B(`For which values of x is <span class='eq'>${quot} ${sym}</span>?`,
              `Vir watter waardes van x is <span class='eq'>${quot} ${sym}</span>?`),
    concept: "product", correct, wrongs,
    debug: { wantNeg, gRoot, cuts: cuts.map((c) => ({ x: c.x, why: c.why })) },
  };
}

/* ---------- (k) length of a segment ---------- */
function prepLength(ctx) {
  const win = ctx.win;
  /* one curve on the sheet: the horizontal chord between the two points
     that share a height, the classic symmetric pair on a parabola */
  if (ctx.other < 0) {
    const cv = ctx.curves[ctx.main];
    if (cv.kind !== "parabola") return null;
    const tp = paraTP(cv);
    if (!isInt(tp.x)) return null;
    const opts = shuffled([1, 2, 3]);
    for (const d of opts) {
      const xA = Math.round(tp.x) - d, xB = Math.round(tp.x) + d;
      const y = makeFn(cv)(xA);
      if (!Number.isFinite(y) || !isInt(y)) continue;
      if (!inside({ x: xA, y }, win, 0.5) || !inside({ x: xB, y }, win, 0.5)) continue;
      const correct = lengthBetween(xA, xB);
      if (!noNumeralOverlap(y, correct)) continue;
      const raw = new Set([correct, correct / 2, xB, Math.abs(y)]);
      if (raw.size < 4) continue;
      const letters = ctx.letters.take(2);
      if (!letters) return null;
      const wrongs = decoysFrom(C(correct), [
        { label: C(correct / 2),
          misc: B("That is only half of it — the chord runs the whole way across.",
                  "Dis net die helfte — die koord loop die hele ent oor.") },
        { label: C(xB),
          misc: B("That is only the right-hand x-coordinate — the length is the GAP between the two.",
                  "Dis net die regterkantste x-koördinaat — die lengte is die GAPING tussen die twee.") },
        C(y), C(correct + 1),
      ]);
      if (!wrongs) continue;
      return {
        id: "length",
        marks: [{ x: xA, y, on: ctx.main, label: letters[0] }, { x: xB, y, on: ctx.main, label: letters[1] }],
        stemBit: B(`${letters[0]} and ${letters[1]} both lie on ${ctx.names[ctx.main]} at y = ${C(y)}.`,
                   `${letters[0]} en ${letters[1]} lê altwee op ${ctx.names[ctx.main]} by y = ${C(y)}.`),
        prompt: B(`Determine the length of ${letters[0]}${letters[1]}.`,
                  `Bepaal die lengte van ${letters[0]}${letters[1]}.`),
        concept: "length", correct: C(correct), wrongs,
        debug: { mode: "h", pts: [{ x: xA, y }, { x: xB, y }], length: correct },
      };
    }
    return null;
  }
  /* two curves: the vertical segment between them at one whole x */
  const f = ctx.curves[ctx.main], g = ctx.curves[ctx.other];
  const ff = makeFn(f), gg = makeFn(g);
  const lo = Math.ceil(win.xmin) + 1, hi = Math.floor(win.xmax) - 1;
  const xs = []; for (let x = lo; x <= hi; x++) xs.push(x);
  for (const x of shuffled(xs)) {
    if (f.kind === "hyperbola" && Math.abs(x - f.p) < 0.6) continue;
    const yF = ff(x), yG = gg(x);
    if (!Number.isFinite(yF) || !Number.isFinite(yG) || !isInt(yF) || !isInt(yG)) continue;
    if (!inside({ x, y: yF }, win, 0.5) || !inside({ x, y: yG }, win, 0.5)) continue;
    const correct = lengthBetween(yF, yG);
    if (correct < 1.5 || correct > 9) continue;
    if (!noNumeralOverlap(x, correct)) continue;
    const raw = new Set([correct, -correct, yF, Math.abs(yF) + Math.abs(yG)]);
    if (raw.size < 4) continue;
    const letters = ctx.letters.take(2);
    if (!letters) return null;
    const [LP, LQ] = letters;
    const wrongs = decoysFrom(C(correct), [
      { label: C(-correct),
        misc: B("A length can never be negative — you subtracted the two heights the wrong way round.",
                "'n Lengte kan nooit negatief wees nie — jy het die twee hoogtes andersom afgetrek.") },
      { label: C(yF),
        misc: B(`That is only ${LP}'s height — you still have to subtract ${LQ}'s.`,
                `Dis net ${LP} se hoogte — jy moet ${LQ} s'n nog aftrek.`) },
      { label: C(Math.abs(yF) + Math.abs(yG)),
        misc: B("It is the DIFFERENCE between the two heights, not their sum.",
                "Dis die VERSKIL tussen die twee hoogtes, nie hulle som nie.") },
      C(correct + 1),
    ]);
    if (!wrongs) continue;
    return {
      id: "length",
      marks: [
        { x, y: Math.round(yF), on: ctx.main, label: LP },
        { x, y: Math.round(yG), on: ctx.other, label: LQ },
      ],
      stemBit: B(`${LP} lies on ${ctx.names[ctx.main]} and ${LQ} lies on ${ctx.names[ctx.other]}, both at x = ${C(x)}.`,
                 `${LP} lê op ${ctx.names[ctx.main]} en ${LQ} lê op ${ctx.names[ctx.other]}, altwee by x = ${C(x)}.`),
      prompt: B(`Determine the length of ${LP}${LQ}.`, `Bepaal die lengte van ${LP}${LQ}.`),
      concept: "length", correct: C(correct), wrongs,
      debug: { mode: "v", x, yF: Math.round(yF), yG: Math.round(yG), length: correct },
    };
  }
  return null;
}

/* ---------- (l) average gradient ---------- */
function prepAvgGradient(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], win = ctx.win;
  const pts = integerPoints(cv, win);
  if (pts.length < 2) return null;
  for (const p1 of shuffled(pts)) {
    for (const dx of shuffled([1, 2, 3])) {
      const p2 = pts.find((p) => p.x === p1.x + dx);
      if (!p2) continue;
      if (cv.kind === "hyperbola" && (p1.x < cv.p) !== (p2.x < cv.p)) continue;   // same wing only
      const dy = p2.y - p1.y;
      if (dy === 0) continue;
      if (Math.abs(p1.y) > 9 || Math.abs(p2.y) > 9) continue;
      const correct = gradientStr(dy, dx);
      const flip = gradientStr(-dy, dx);
      const same = Math.abs(dy) === Math.abs(dx);
      const recip = same ? gradientStr(2 * dy, dx) : gradientStr(dx, dy);
      const recipMisc = same
        ? B("That is double the true gradient — check Δy and Δx again, one at a time.",
            "Dit is dubbel die ware gradiënt — gaan Δy en Δx weer een vir een na.")
        : B("That is Δx over Δy — the gradient is the other way up: Δy OVER Δx.",
            "Dit is Δx oor Δy — die gradiënt is andersom: Δy OOR Δx.");
      const rawFromB = p2.x !== 0;
      const rawPoint = gradientStr(rawFromB ? p2.y : p1.y, rawFromB ? p2.x : p1.x);
      if (new Set([correct, flip, recip, rawPoint]).size < 4) continue;
      const letters = ctx.letters.take(2);
      if (!letters) return null;
      const [LA, LB] = letters;
      const wrongs = decoysFrom(correct, [
        { label: flip,
          misc: B(`The sign flipped — Δy is ${LB}'s height MINUS ${LA}'s, not the other way round.`,
                  `Die teken het omgeswaai — Δy is ${LB} se hoogte MINUS ${LA} s'n, nie andersom nie.`) },
        { label: recip, misc: recipMisc },
        { label: rawPoint,
          misc: B("That uses one point's own coordinates — the gradient needs the CHANGE between them.",
                  "Dit gebruik net een punt se eie koördinate — die gradiënt het die VERANDERING tussen hulle nodig.") },
      ]);
      if (!wrongs) continue;
      return {
        id: "avgGradient",
        marks: [
          { x: p1.x, y: p1.y, on: ctx.main, label: LA },
          { x: p2.x, y: p2.y, on: ctx.main, label: LB },
        ],
        stemBit: B(`${LA} and ${LB} lie on ${nm}.`, `${LA} en ${LB} lê op ${nm}.`),
        prompt: B(`Calculate the average gradient of ${nm} between ${LA} and ${LB}.`,
                  `Bereken die gemiddelde gradiënt van ${nm} tussen ${LA} en ${LB}.`),
        concept: "gradient", correct, wrongs,
        debug: { p1, p2, dy, dx, m: avgGradient(p1.y, p2.y, p1.x, p2.x) },
      };
    }
  }
  return null;
}

/* ---------- (m) for which k does y = k cut f ---------- */
function prepKCuts(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main];
  if (cv.kind === "parabola") {
    const tp = paraTP(cv), up = paraStd(cv).a > 0;
    if (!isInt(tp.x) || !isInt(tp.y) || Math.round(tp.x) === Math.round(tp.y)) return null;
    const correct = up ? `k ${GT} ${C(tp.y)}` : `k ${LT} ${C(tp.y)}`;
    const wrongs = decoysFrom(correct, [
      { label: up ? `k ${LT} ${C(tp.y)}` : `k ${GT} ${C(tp.y)}`,
        misc: B("Wrong side — check which side of the turning point the arms open on.",
                "Verkeerde kant — kyk aan watter kant van die draaipunt die arms oopmaak.") },
      { label: up ? `k ${GT} ${C(tp.x)}` : `k ${LT} ${C(tp.x)}`,
        misc: B("That compares k with the turning point's x — two cuts depend on its y.",
                "Dit vergelyk k met die draaipunt se x — twee snye hang van sy y af.") },
      `k = ${C(tp.y)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "kCuts", marks: [],
      prompt: B(`For which values of k will the line y = k cut the graph of ${nm} twice?`,
                `Vir watter waardes van k sal die lyn y = k die grafiek van ${nm} twee keer sny?`),
      concept: "roots", correct, wrongs,
      debug: { kind: cv.kind, tp: { x: tp.x, y: tp.y }, up, want: 2 },
    };
  }
  if (cv.kind === "hyperbola") {
    if (cv.p === cv.q) return null;
    const correct = `k = ${C(cv.q)}`;
    const wrongs = decoysFrom(correct, [
      { label: `k = ${C(cv.p)}`,
        misc: B("That is the vertical asymptote's number — y = k is a horizontal line.",
                "Dis die vertikale asimptoot se getal — y = k is 'n horisontale lyn.") },
      { label: "k = 0",
        misc: B("y = 0 is the x-axis, and this graph does cross it.",
                "y = 0 is die x-as, en hierdie grafiek sny dit wel.") },
      `k = ${C(-cv.q)}`,
    ]);
    if (!wrongs) return null;
    return {
      id: "kCuts", marks: [],
      prompt: B(`For which value of k will the line y = k NOT cut the graph of ${nm} at all?`,
                `Vir watter waarde van k sal die lyn y = k die grafiek van ${nm} glad nie sny nie?`),
      concept: "roots", correct, wrongs,
      debug: { kind: cv.kind, q: cv.q, p: cv.p, want: 0 },
    };
  }
  if (cv.kind === "exp") {
    const above = cv.a > 0;
    const correct = above ? `k ${GT} ${C(cv.q)}` : `k ${LT} ${C(cv.q)}`;
    const wrongs = decoysFrom(correct, [
      { label: above ? `k ${LT} ${C(cv.q)}` : `k ${GT} ${C(cv.q)}`,
        misc: B("That is the other side of the asymptote — the curve never reaches over there.",
                "Dis die ander kant van die asimptoot — die kurwe kom nooit daar nie.") },
      { label: `k = ${C(cv.q)}`,
        misc: B("Right on the asymptote the curve never arrives — that k gives no cut at all.",
                "Presies op die asimptoot kom die kurwe nooit — daardie k gee glad nie 'n snypunt nie.") },
      "k ∈ ℝ",
    ]);
    if (!wrongs) return null;
    return {
      id: "kCuts", marks: [],
      prompt: B(`For which values of k will the line y = k cut the graph of ${nm}?`,
                `Vir watter waardes van k sal die lyn y = k die grafiek van ${nm} sny?`),
      concept: "roots", correct, wrongs,
      debug: { kind: cv.kind, q: cv.q, above, want: 1 },
    };
  }
  return null;
}

/* ---------- (n) which equation is f ---------- */
function prepWhichEquation(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main], win = ctx.win;
  let family = cv.kind, base = cv, variants = null, nudges = null;
  if (cv.kind === "parabola") {
    const tp = paraTP(cv), yi = paraYInt(cv);
    if (tp.x === 0 || Math.abs(yi - tp.y) < 1e-9) return null;
    base = { kind: "parabola", a: paraStd(cv).a, p: tp.x, q: tp.y };
    variants = [
      { key: "pFlip", cv: { ...base, p: -tp.x } },
      { key: "qFlip", cv: { ...base, q: yi } },
      { key: "aFlip", cv: { ...base, a: -base.a } },
    ];
    nudges = {
      pFlip: B("Right size, wrong sign on p — the bracket flips the sign of what you read off.",
               "Regte grootte, verkeerde teken op p — die hakie draai die teken van wat jy afgelees het om."),
      qFlip: B("That is the y-intercept's value, not the turning point's y.",
               "Dis die y-afsnit se waarde, nie die draaipunt se y nie."),
      aFlip: B("Wrong sign on a — look again: happy or sad?",
               "Verkeerde teken op a — kyk weer: happy of sad?"),
    };
  } else if (cv.kind === "hyperbola") {
    variants = [
      { key: "pFlip", cv: { ...cv, p: -cv.p } },
      { key: "qFlip", cv: { ...cv, q: -cv.q } },
      { key: "aFlip", cv: { ...cv, a: -cv.a } },
    ];
    nudges = {
      pFlip: B("Wrong sign on p — the vertical asymptote would stand on the OTHER side.",
               "Verkeerde teken op p — die vertikale asimptoot sou aan die ANDER kant staan."),
      qFlip: B("Wrong sign on q — the horizontal asymptote would lie on the OTHER side.",
               "Verkeerde teken op q — die horisontale asimptoot sou aan die ANDER kant lê."),
      aFlip: B("Wrong sign on a — that puts the wings in the wrong pair of corners.",
               "Verkeerde teken op a — dit sit die vlerkies in die verkeerde paar hoeke."),
    };
  } else if (cv.kind === "exp") {
    variants = [
      { key: "qFlip", cv: { ...cv, q: -cv.q } },
      { key: "aFlip", cv: { ...cv, a: -cv.a } },
      { key: "bRecip", cv: { ...cv, b: 1 / cv.b } },
    ];
    nudges = {
      qFlip: B("Wrong sign on q — the asymptote would lie on the OTHER side of the x-axis.",
               "Verkeerde teken op q — die asimptoot sou aan die ANDER kant van die x-as lê."),
      aFlip: B("Wrong sign on a — that puts the curve on the wrong side of the asymptote.",
               "Verkeerde teken op a — dit sit die kurwe aan die verkeerde kant van die asimptoot."),
      bRecip: cv.b > 1
        ? B("That base lies flat against the asymptote on the wrong side — this curve is flat on the LEFT.",
            "Daardie grondtal lê plat teen die asimptoot aan die verkeerde kant — hierdie kurwe lê plat aan die LINKERKANT.")
        : B("That base lies flat against the asymptote on the wrong side — this curve is flat on the RIGHT.",
            "Daardie grondtal lê plat teen die asimptoot aan die verkeerde kant — hierdie kurwe lê plat aan die REGTERKANT."),
    };
  } else return null;

  /* every decoy has to be a visibly DIFFERENT graph inside this window
     — faultGap() is the one owner of that measurement */
  if (!variants.every((v) => faultGap(base, v.cv, win) >= MIN_DECOY_GAP)) return null;
  const render = (c) => EQ(eqStrFor(family, c, "y"));
  const flat = (s) => String(s).replace(/<[^>]*>/g, "");
  const correct = render(base);
  const seen = new Set([flat(correct)]);
  for (const v of variants) { const t = flat(render(v.cv)); if (seen.has(t)) return null; seen.add(t); }
  const wrongs = decoysFrom(correct, variants.map((v) => ({ label: render(v.cv), misc: nudges[v.key] })));
  if (!wrongs) return null;
  return {
    id: "whichEquation", marks: [],
    prompt: B(`Which equation represents ${nm}?`, `Watter vergelyking stel ${nm} voor?`),
    concept: "equation", correct, wrongs,
    debug: { family, base, decoys: variants.map((v) => v.cv) },
  };
}

/* ---------- (o) a transformation ---------- */
function prepTransform(ctx) {
  const cv = ctx.curves[ctx.main], nm = ctx.names[ctx.main];
  const family = cv.kind;
  if (!["parabola", "hyperbola", "exp"].includes(family)) return null;
  let base = cv;
  if (family === "parabola") {
    const tp = paraTP(cv);
    if (!isInt(tp.x) || !isInt(tp.y)) return null;
    base = { kind: "parabola", a: paraStd(cv).a, p: tp.x, q: tp.y };
  }
  for (const dir of shuffled(["up", "down", "left", "right"])) {
    for (const k of shuffled([1, 2, 3])) {
      const { dp, dq } = deltaFor(dir, k);
      const variants = {
        correct: shifted(base, dp, dq),
        axisWrong: shifted(base, dq, dp),
        signWrong: shifted(base, -dp, -dq),
        bothWrong: shifted(base, -dq, -dp),
      };
      /* a shift moves a hyperbola's or an exponential's asymptote too —
         none of the four may end up on an axis (her 2026-08-13 ruling) */
      if (family !== "parabola" &&
          Object.values(variants).some((v) => asymOnAxis(v))) continue;
      const flat = (s) => String(s).replace(/<[^>]*>/g, "");
      const strs = {}; const seen = new Set(); let collide = false;
      for (const key in variants) {
        const raw = EQ(eqStrFor(family, variants[key], "y"));
        const t = flat(raw);
        if (seen.has(t)) { collide = true; break; }
        seen.add(t); strs[key] = raw;
      }
      if (collide) continue;
      const wrongs = decoysFrom(strs.correct, [
        { label: strs.axisWrong,
          misc: B("Wrong letter — that is not the one this move changes.",
                  "Verkeerde letter — dis nie die een wat hierdie skuif verander nie.") },
        { label: strs.signWrong, misc: B("Right letter, wrong sign.", "Regte letter, verkeerde teken.") },
        { label: strs.bothWrong,
          misc: B("Wrong letter, and the wrong sign too.", "Verkeerde letter, en ook die verkeerde teken.") },
      ]);
      if (!wrongs) continue;
      const word = { up: B("up", "op"), down: B("down", "af"), left: B("left", "links"), right: B("right", "regs") }[dir];
      return {
        id: "transform", marks: [],
        /* foreman review fix: "1 eenheid", "2 eenhede" — singular for one */
        prompt: B(`The graph of ${nm} is shifted ${C(k)} ${k === 1 ? "unit" : "units"} ${word.en}. Write down the equation of the new graph.`,
                  `Die grafiek van ${nm} skuif ${C(k)} ${k === 1 ? "eenheid" : "eenhede"} ${word.af}. Skryf die vergelyking van die nuwe grafiek neer.`),
        concept: "transform", correct: strs.correct, wrongs,
        debug: { family, base, dir, k, dp, dq, image: variants.correct },
      };
    }
  }
  return null;
}

/* ---------- (p) does the equation match the sketch? ---------- */
function prepMatchEq(ctx) {
  const trueCv = tpForm(ctx.curves[ctx.main]);
  const nm = ctx.names[ctx.main], win = ctx.win;
  const faults = KINDS.filter((k) => k !== "none" && FAMILIES_FOR[k].includes(trueCv.kind));
  if (!faults.length) return null;
  /* about one round in three states an equation that is actually right —
     "Nee" must never be the safe guess, and neither must "Ja" */
  const bag = [...faults, ...Array(Math.max(1, Math.round(faults.length / 2))).fill("none")];
  for (const kind of shuffled(bag)) {
    const inj = injectFault(trueCv, kind);
    if (!inj) continue;
    if (kind !== "none" && faultGap(trueCv, inj.stated, win) < 1) continue;
    const why = whyOptions(trueCv, kind, inj.diff);
    if (!why || !why.wrongs.length) continue;
    const yes = B("Yes, it matches — every feature agrees with the sketch",
                  "Ja, dit pas — elke kenmerk stem met die skets ooreen");
    const no = (lab) => ({ en: `No — ${lab.en.charAt(0).toLowerCase()}${lab.en.slice(1)}`,
                           af: `Nee — ${lab.af.charAt(0).toLowerCase()}${lab.af.slice(1)}` });
    const correct = kind === "none" ? yes : no(why.correct);
    const wrongs = why.wrongs.map((w) => ({
      label: w.key === "none" ? yes : no(w.label),
      misc: w.misc,
    }));
    /* asymSwap moves a PAIR of named features, so its list is one decoy
       shorter by construction (see _fault.js's header) — three options
       is the floor a round may ship, never fewer */
    const picked = decoysFrom(correct, wrongs, Math.min(3, wrongs.length));
    if (!picked || picked.length < 2) continue;
    return {
      id: "matchEq", marks: [],
      eqLine: eqOf(inj.stated),
      prompt: B(`Does the equation above match ${nm} on the sketch?`,
                `Pas die vergelyking hierbo by ${nm} op die skets?`),
      concept: "fault", correct, wrongs: picked,
      solution: faultSolution(trueCv, inj.stated, kind),
      debug: { kind, family: trueCv.kind, trueCv, stated: inj.stated, claims: inj.claims, diff: inj.diff,
        correctKey: why.correctKey, decoyKeys: why.decoyKeys, isMatch: kind === "none" },
    };
  }
  return null;
}

const PREP = {
  asymptotes: prepAsymptotes, intercepts: prepIntercepts, pointCoords: prepPointCoords,
  domain: prepDomain, range: prepRange, increasing: prepIncreasing,
  signOfF: prepSignOfF, fgCompare: prepFgCompare, xTimesF: prepXTimesF, fOverG: prepFOverG,
  length: prepLength, avgGradient: prepAvgGradient, kCuts: prepKCuts,
  whichEquation: prepWhichEquation, transform: prepTransform, matchEq: prepMatchEq,
};

/* ============================================================
   BUILDING ONE SHEET
   ============================================================ */
function buildSheet(shape) {
  for (let tries = 0; tries < 80; tries++) {
    const drawn = drawShape(shape);
    if (!drawn) continue;
    const { curves, names, main, other } = drawn;

    /* the window: the curves' own identity features, plus every
       crossing — the one thing windowFor() does not know about */
    const win0 = windowFor(curves);
    if (!win0) continue;
    let crossings = null;
    if (other >= 0) {
      crossings = gridCrossings(curves[main], curves[other], win0);
      if (shape !== "semiExp" && !crossings) continue;
    }
    const win = windowFor(curves, { include: crossings || [] });
    if (!win) continue;
    if (!curves.every((cv) => mostlyInFrame(cv, win))) continue;
    /* a wider window can pull a NEW crossing into view — recompute
       against the window actually drawn, never trust the first pass */
    if (other >= 0) {
      crossings = gridCrossings(curves[main], curves[other], win);
      if (shape !== "semiExp" && !crossings) continue;
      if (crossings && !crossings.every((p) => inside(p, win, 0.4))) continue;
    }

    const ctx = {
      shape, curves, names, main, other, win, crossings,
      lang: getLang(), letters: letterPool(),
    };

    /* the candidate menu: this shape's skills, with at most ONE of the
       three "what does the equation say?" skills (each of them would
       hand the other two their answer) */
    const menu = AVAILABLE[shape].filter((id) => !EQ_GROUP.includes(id));
    const chosen = shuffled([...menu, pick(EQ_GROUP)]);

    const want = pick([5, 5, 6, 6]);
    const prepared = [];
    let markCount = 0;
    for (const id of chosen) {
      if (prepared.length >= want) break;
      let got = null;
      try { got = PREP[id](ctx); } catch { got = null; }
      if (!got) continue;
      if (markCount + got.marks.length > MAX_MARKS) continue;
      markCount += got.marks.length;
      prepared.push(got);
    }
    if (prepared.length < 5) continue;

    prepared.sort((a, b) => RANK[a.id] - RANK[b.id]);

    /* the shared sketch: curve names through specFor's own labelSpot,
       marked points through the engine's point/label path, and NO
       asymptote values printed (see this file's header) */
    const points = prepared.flatMap((p) => p.marks);
    const spec = specFor(curves, {
      win, accent: ACC, ticks: "labels", labels: names, points, asymLabels: false,
    });
    if (!spec) continue;
    if (curveLabelsClash(spec)) continue;

    const stem = sheetStem(shape, names, curves, prepared);

    const out = prepared.map((p) => {
      /* the one sub-question that quotes an equation of its own puts it
         on its own line under the sheet's stem (qF's EQL pattern) */
      const st = p.eqLine
        ? stemPlus(stem, { en: ` A learner writes:${EQL(p.eqLine)}`, af: ` 'n Leerder skryf:${EQL(p.eqLine)}` })
        : stem;
      const item = mc(p.concept || "exam", p.prompt, p.correct, p.wrongs, {
        graph: p.hideAsym ? hideAsymLabels(spec) : spec,
        stem: st, wide: true,
        solution: p.solution,
      });
      item.examSkill = p.id;
      item.debugExam = {
        shape, skill: p.id, curves, names, main, other, win,
        crossings, marks: p.marks, answer: p.correct, ...p.debug,
      };
      return item;
    });
    out.sheetShape = shape;
    return out;
  }
  return null;
}

/* the sentence a paper opens with, then whatever the marked letters add.
   The semicircle sheet quotes its own circle equation the way her Graad
   12 Tegnies worksheet does — read off the RADIUS ACTUALLY DRAWN, so
   the words and the picture can never disagree. */
function sheetStem(shape, names, curves, prepared) {
  const head = {
    semiExp: B(`The sketch shows the semicircle ${names[0]}, ${circleEq(curves[0])}, and the exponential function ${names[1]}.`,
               `Die skets toon die halfsirkel ${names[0]}, ${circleEq(curves[0])}, en die eksponensiële funksie ${names[1]}.`),
    hypLine: B(`The sketch shows the hyperbola ${names[0]} and the straight line ${names[1]}.`,
               `Die skets toon die hiperbool ${names[0]} en die reguitlyn ${names[1]}.`),
    parabola: B(`The sketch shows the parabola ${names[0]}.`, `Die skets toon die parabool ${names[0]}.`),
    paraLine: B(`The sketch shows the parabola ${names[0]} and the straight line ${names[1]}.`,
                `Die skets toon die parabool ${names[0]} en die reguitlyn ${names[1]}.`),
    expLine: B(`The sketch shows the exponential function ${names[0]} and the straight line ${names[1]}.`,
               `Die skets toon die eksponensiële funksie ${names[0]} en die reguitlyn ${names[1]}.`),
  }[shape];
  let en = head.en, af = head.af;
  prepared.forEach((p) => {
    if (!p.stemBit) return;
    en += " " + p.stemBit.en;
    af += " " + p.stemBit.af;
  });
  return { en, af };
}

/* ============================================================
   DEALING
   ------------------------------------------------------------
   ONE round = ONE sketch with all of its sub-questions, exactly like a
   numbered exam question. Mixing two sketches into one round would put
   the learner back to hopping between pictures, which is the habit this
   whole app exists to break.
   ============================================================ */
export const TECHOK = { on: true };           // semicircle sheets are Tech-Maths only
let recent = [];

export function nextSheet() {
  const pool = SHAPES.filter((s) => s !== "semiExp" || TECHOK.on);
  const stamp = (sheet) => {
    sheet.forEach((q, i) => { q.skillId = "examSheet"; q.sheetPart = `${i + 1} of ${sheet.length}`; });
    return sheet;
  };
  for (let tries = 0; tries < 40; tries++) {
    /* never the same shape twice in a row if the pool can help it —
       the same spread rule buildRound()'s own dealer keeps */
    const fresh = pool.filter((s) => s !== recent[recent.length - 1]);
    const shape = pick(fresh.length ? fresh : pool);
    const sheet = buildSheet(shape);
    if (!sheet) continue;
    recent.push(shape);
    if (recent.length > 3) recent.shift();
    return stamp(sheet);
  }
  /* every shape refused 40 draws in a row — impossible in practice, but
     a quest must never hand play.js an empty round */
  const fallback = buildSheet("parabola");
  if (!fallback) throw new Error("q7 exam: no sheet could be drawn");
  return stamp(fallback);
}

export function resetExam() { recent = []; }

export const quest7 = quest("q7",
  B("Exam mode", "Eksamenmodus"),
  B("One sketch, every skill — the real thing", "Een skets, elke vaardigheid — die regte ding"),
  [{ id: "examSheet", concept: "exam", gen: () => nextSheet()[0] }],
  { rounds: 6, accent: ACC, buildAll: nextSheet, oneSketch: true });
