/* ============================================================
   QUEST 7 · EXAM MODE — one sketch, many sub-questions
   ------------------------------------------------------------
   The transfer test. Exactly the shape of her Graad 12 Tegnies
   worksheet: a single sketch with 5–6 sub-questions crossing every
   skill the earlier quests drilled, in exam wording.

   A "sheet" is generated once and its sub-questions are handed
   out in order, so the learner really does stay with one picture
   the way they must in a paper.
   ============================================================ */
import { mc, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { specFor, windowFor, randExp, randSemicircle, randHyperbola, randParabola } from "./_graphs.js";
import {
  makeFn, expXInt, expYInt, rangeStr, domainStr, eqStr, C, pick, ptStr,
  criticalXs, sections, signAt, aboveAt, hypXInt, paraTP, paraStd, paraRoots,
  circleEq, numDecoys, isInt,
} from "../funclib.js";
import { answerString, complementString, asYString } from "./_intervals.js";
import { getLang } from "../i18n.js";

const ACC = "#6fd0ff";

let queue = [];

/* ---------- sheet A: semicircle + exponential (her vb. 3) ---------- */
function sheetSemiExp() {
  const r = pick([3, 4, 5]);
  const h = { kind: "semicircle", r, up: true };
  const g = randExp();
  const win = windowFor([h, g]);
  const spec = specFor([h, g], { win, accent: ACC, ticks: "labels", labels: ["h", "g"], asymLabels: true });
  const lang = getLang();
  const xi = expXInt(g), yi = expYInt(g);
  const cuts = criticalXs([h, g], win.xmin, win.xmax);
  const secs = sections(cuts, win.xmin, win.xmax)
    .map((s) => ({ ...s, usable: Number.isFinite(makeFn(h)(s.mid)) && Number.isFinite(makeFn(g)(s.mid)) }));
  const negProd = secs.filter((s) => s.usable && signAt(h, s.mid) * signAt(g, s.mid) < 0);

  const stem = B(`The sketch shows the semicircle h with centre at the origin, and the exponential function g given by ${eqStr(g, "g(x)")}.`,
                 `Die skets toon die halfsirkel h met middelpunt by die oorsprong, en die eksponensiële funksie g gegee deur ${eqStr(g, "g(x)")}.`);
  const out = [];
  const q = (prompt, correct, wrongs, opts = {}) =>
    out.push(mc(opts.concept || "exam", prompt, correct, wrongs, { graph: spec, stem, wide: true, ...opts }));

  q(B("Write down the equation of the asymptote of g.", "Skryf die vergelyking van die asimptoot van g neer."),
    `y = ${C(g.q)}`, [`x = ${C(g.q)}`, `y = ${C(-g.q)}`, "y = 0"], { concept: "range" });

  if (xi != null && isInt(xi))
    q(B("Calculate the x-intercept of g.", "Bereken die x-afsnit van g."),
      ptStr(xi, 0), [ptStr(0, xi), ptStr(-xi, 0), ptStr(0, yi)], { concept: "readGraph" });

  q(B("Write down the range of g.", "Skryf die waardeversameling van g neer."),
    rangeStr(g), [`y ≥ ${C(g.q)}`, `y ∈ ℝ`, domainStr(g)], { concept: "range" });

  q(B("Write down the domain of h.", "Skryf die definisieversameling van h neer."),
    domainStr(h), [`${C(-r)} &lt; x &lt; ${C(r)}`, `0 ≤ x ≤ ${C(r)}`, "x ∈ ℝ"], { concept: "domain" });

  q(B("Is g increasing or decreasing? Give a reason.", "Is g stygend of dalend? Gee 'n rede."),
    g.a > 0 ? B(`Increasing — a is positive and b = ${C(g.b)} is bigger than 1`, `Stygend — a is positief en b = ${C(g.b)} is groter as 1`)
            : B("Decreasing — a is negative, so the graph is flipped over", "Dalend — a is negatief, dus is die grafiek omgekeer"),
    [g.a > 0 ? B("Decreasing — a is negative", "Dalend — a is negatief")
             : B("Increasing — a is positive", "Stygend — a is positief"),
     B("Increasing, then decreasing", "Stygend, dan dalend"),
     B(`Decreasing — q is negative (${C(g.q)})`, `Dalend — q is negatief (${C(g.q)})`)], { concept: "increasing" });

  if (negProd.length) {
    const correct = answerString(negProd, cuts, win, { strict: false, lang });
    q(B("For which values of x is h(x)·g(x) ≤ 0?", "Vir watter waardes van x is h(x)·g(x) ≤ 0?"),
      correct,
      [complementString(negProd, secs, cuts, win, { strict: false, lang }),
       asYString(correct),
       answerString(negProd, cuts, win, { strict: true, lang })],
      { concept: "product" });
  }
  return out;
}

/* ---------- sheet B: hyperbola + line (her vb. 6) ---------- */
function sheetHypLine() {
  const r1 = pick([-4, -3, -2]), r2 = pick([2, 3, 4]);
  const k = pick([0, 1, -1]);
  const f = { kind: "hyperbola", a: -r1 * r2, p: 0, q: k };
  const g = { kind: "line", a: 1, q: -(r1 + r2) + k };
  const win = windowFor([f, g]);
  const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
  const lang = getLang();
  const A = { x: r1, y: makeFn(f)(r1) }, Bpt = { x: r2, y: makeFn(f)(r2) };
  const cuts = criticalXs([f, g], win.xmin, win.xmax, { zeros: false, withIntersections: true });
  const secs = sections(cuts, win.xmin, win.xmax);
  const fTop = secs.filter((s) => aboveAt(f, g, s.mid) > 0);

  const stem = B(`The sketch shows the hyperbola f given by ${eqStr(f, "f(x)")} and the straight line g given by ${eqStr(g, "g(x)")}. They cut each other at A and B.`,
                 `Die skets toon die hiperbool f gegee deur ${eqStr(f, "f(x)")} en die reguitlyn g gegee deur ${eqStr(g, "g(x)")}. Hulle sny mekaar by A en B.`);
  const out = [];
  const q = (prompt, correct, wrongs, opts = {}) =>
    out.push(mc(opts.concept || "exam", prompt, correct, wrongs, { graph: spec, stem, wide: true, ...opts }));

  q(B("Write down the equations of the asymptotes of f.", "Skryf die vergelykings van die asimptote van f neer."),
    `x = ${C(f.p)} ${lang === "en" ? "and" : "en"} y = ${C(f.q)}`,
    [`x = ${C(f.q)} ${lang === "en" ? "and" : "en"} y = ${C(f.p)}`,
     `x = ${C(f.p)} ${lang === "en" ? "and" : "en"} y = 0`,
     `y = ${C(f.q)} ${lang === "en" ? "only" : "alleen"}`], { concept: "range" });

  const xi = hypXInt(f);
  if (xi != null && isInt(xi))
    q(B("Calculate the x-intercept of f.", "Bereken die x-afsnit van f."),
      ptStr(xi, 0), [ptStr(0, xi), ptStr(-xi, 0), ptStr(xi, f.q)], { concept: "readGraph" });

  q(B("Write down the coordinates of A and B.", "Skryf die koördinate van A en B neer."),
    `A${ptStr(A.x, A.y)}, B${ptStr(Bpt.x, Bpt.y)}`,
    [`A${ptStr(A.y, A.x)}, B${ptStr(Bpt.y, Bpt.x)}`,
     `A${ptStr(A.x, -A.y)}, B${ptStr(Bpt.x, -Bpt.y)}`,
     `A${ptStr(-A.x, A.y)}, B${ptStr(-Bpt.x, Bpt.y)}`], { concept: "pointOnGraph" });

  q(B("Write down the range of f.", "Skryf die waardeversameling van f neer."),
    rangeStr(f), [`y > ${C(f.q)}`, "y ∈ ℝ", domainStr(f)], { concept: "range" });

  q(B("Is each branch of f increasing or decreasing?", "Is elke tak van f stygend of dalend?"),
    f.a > 0 ? B("Decreasing — a is positive", "Dalend — a is positief") : B("Increasing — a is negative", "Stygend — a is negatief"),
    [f.a > 0 ? B("Increasing — a is positive", "Stygend — a is positief") : B("Decreasing — a is negative", "Dalend — a is negatief"),
     B("One rises, one falls", "Een styg, een daal"),
     B("It turns at the asymptote", "Dit draai by die asimptoot")], { concept: "increasing" });

  if (fTop.length) {
    const correct = answerString(fTop, cuts, win, { strict: true, lang });
    q(B("For which values of x is f(x) &gt; g(x)?", "Vir watter waardes van x is f(x) &gt; g(x)?"),
      correct,
      [complementString(fTop, secs, cuts, win, { strict: true, lang }),
       answerString(fTop, cuts, win, { strict: false, lang }),
       asYString(correct)], { concept: "compare" });
  }
  return out;
}

/* ---------- sheet C: parabola on its own (her vb. 5) ---------- */
function sheetParabola() {
  const cv = randParabola();
  const win = windowFor([cv]);
  const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  const tp = paraTP(cv), opens = paraStd(cv).a > 0, roots = paraRoots(cv);
  const lang = getLang();
  const cuts = criticalXs([cv], win.xmin, win.xmax);
  const secs = sections(cuts, win.xmin, win.xmax);
  const below = secs.filter((s) => signAt(cv, s.mid) < 0);

  const stem = B(`The sketch shows the parabola f with turning point ${ptStr(tp.x, tp.y)}.`,
                 `Die skets toon die parabool f met draaipunt ${ptStr(tp.x, tp.y)}.`);
  const out = [];
  const q = (prompt, correct, wrongs, opts = {}) =>
    out.push(mc(opts.concept || "exam", prompt, correct, wrongs, { graph: spec, stem, wide: true, ...opts }));

  q(B("Write down the equation of the axis of symmetry.", "Skryf die vergelyking van die simmetrie-as neer."),
    `x = ${C(tp.x)}`, [`y = ${C(tp.y)}`, `x = ${C(tp.y)}`, `y = ${C(tp.x)}`], { concept: "whichAxis" });

  q(B("Write down the range of f.", "Skryf die waardeversameling van f neer."),
    rangeStr(cv),
    [opens ? `y ≤ ${C(tp.y)}` : `y ≥ ${C(tp.y)}`, `x ≥ ${C(tp.x)}`, "y ∈ ℝ"], { concept: "range" });

  if (roots.length === 2)
    q(B("Write down the x-intercepts.", "Skryf die x-afsnitte neer."),
      `${ptStr(roots[0], 0)} ${lang === "en" ? "and" : "en"} ${ptStr(roots[1], 0)}`,
      [`${ptStr(0, roots[0])} ${lang === "en" ? "and" : "en"} ${ptStr(0, roots[1])}`,
       `${ptStr(-roots[0], 0)} ${lang === "en" ? "and" : "en"} ${ptStr(-roots[1], 0)}`,
       ptStr(tp.x, tp.y)], { concept: "readGraph" });

  q(B("For which values of x is f increasing?", "Vir watter waardes van x is f stygend?"),
    opens ? `x > ${C(tp.x)}` : `x &lt; ${C(tp.x)}`,
    [opens ? `x &lt; ${C(tp.x)}` : `x > ${C(tp.x)}`, `y > ${C(tp.y)}`, `x > ${C(tp.y)}`], { concept: "increasing" });

  if (below.length) {
    const correct = answerString(below, cuts, win, { strict: true, lang });
    q(B("For which values of x is f(x) &lt; 0?", "Vir watter waardes van x is f(x) &lt; 0?"),
      correct,
      [complementString(below, secs, cuts, win, { strict: true, lang }),
       asYString(correct),
       answerString(below, cuts, win, { strict: false, lang })], { concept: "signs" });
  }
  return out;
}

const SHEETS = [sheetSemiExp, sheetHypLine, sheetParabola];

/* ONE round = ONE sketch with all of its sub-questions, exactly like a
   numbered exam question. Mixing two sketches into one round would put
   the learner back to hopping between pictures, which is the habit this
   whole app exists to break. */
export function nextSheet() {
  const pool = SHEETS.filter((s) => s !== sheetSemiExp || TECHOK.on);
  const sheet = pick(pool)();
  sheet.forEach((q, i) => { q.skillId = "examSheet"; q.sheetPart = `${i + 1} of ${sheet.length}`; });
  return sheet;
}

/* semicircle sheets are Tech-Maths only */
export const TECHOK = { on: true };
export function resetExam() { queue = []; }

export const quest7 = quest("q7",
  B("Exam mode", "Eksamenmodus"),
  B("One sketch, every skill — the real thing", "Een skets, elke vaardigheid — die regte ding"),
  [{ id: "examSheet", concept: "exam", gen: () => nextSheet()[0] }],
  { rounds: 6, accent: ACC, buildAll: nextSheet });
