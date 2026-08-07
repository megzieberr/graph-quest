/* ============================================================
   QUEST 4 · THE CLIMB — increasing & decreasing   ★ headline
   ------------------------------------------------------------
   The point may only ever move RIGHT. A backwards drag does
   nothing, so the finger is forced to rise and fall exactly the
   way the graph does. Kids who read a graph from right to left
   physically cannot do it here.

   Only once the whole graph has been walked does the question
   appear — by then they have already felt the answer.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { climb } from "../engine/interactive.js";
import { specFor, randParabola, randExp, randHyperbola, randSemicircle, windowFor } from "./_graphs.js";
import { makeFn, paraTP, paraStd, eqStr, C, pick, circleEq } from "../funclib.js";

const ACC = "#fcd34d";

const WALK = B("Drag the point from left to right. It will not go back.",
               "Sleep die punt van links na regs. Dit gaan nie terug nie.");

/* a stretch of x the curve actually occupies inside the window */
function walkRange(cv, win, opts = {}) {
  const f = makeFn(cv);
  const lo = opts.lo ?? win.xmin, hi = opts.hi ?? win.xmax;
  const ok = (x) => { const y = f(x); return Number.isFinite(y) && y > win.ymin + 0.15 && y < win.ymax - 0.15; };
  let from = lo, to = hi;
  const step = (hi - lo) / 200;
  while (from < hi && !ok(from)) from += step;
  while (to > from && !ok(to)) to -= step;
  return { from, to };
}

const SKILLS = {
  /* ---------- parabola: the turn is the whole point ---------- */
  paraClimb: () => {
    const cv = randParabola();
    const tp = paraTP(cv), opens = paraStd(cv).a > 0;
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    const { from, to } = walkRange(cv, win);
    const correct = opens ? `x > ${C(tp.x)}` : `x &lt; ${C(tp.x)}`;
    const wrongs = [
      opens ? `x &lt; ${C(tp.x)}` : `x > ${C(tp.x)}`,
      `x > ${C(tp.y)}`,                              // used the y of the turning point
      `y > ${C(tp.y)}`,                              // answered with y instead of x
    ];
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: B("For which values of x is f <b>increasing</b>?",
                "Vir watter waardes van x is f <b>stygend</b>?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to,
        onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing",
        B("So where was your hand going UP?", "So waar het jou hand OP gegaan?"), correct, wrongs,
        { hint: B(`The turn happens at x = ${C(tp.x)}. After it, your hand went the other way.`,
                  `Die draai gebeur by x = ${C(tp.x)}. Daarna het jou hand die ander kant toe gegaan.`),
          answerLabel: B(`f increases for ${correct}`, `f is stygend vir ${correct}`) }),
    });
  },

  /* ---------- semicircle: up then down ---------- */
  semiClimb: () => {
    const cv = randSemicircle();
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["h"] });
    const askDown = pick([true, false]);
    const correct = askDown ? `0 &lt; x &lt; ${C(cv.r)}` : `${C(-cv.r)} &lt; x &lt; 0`;
    const wrongs = [
      askDown ? `${C(-cv.r)} &lt; x &lt; 0` : `0 &lt; x &lt; ${C(cv.r)}`,
      `${C(-cv.r)} &lt; x &lt; ${C(cv.r)}`,
      askDown ? `x > ${C(cv.r)}` : `x &lt; ${C(-cv.r)}`,
    ];
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true, techOnly: true,
      prompt: askDown
        ? B("For which values of x is h <b>decreasing</b>?", "Vir watter waardes van x is h <b>dalend</b>?")
        : B("For which values of x is h <b>increasing</b>?", "Vir watter waardes van x is h <b>stygend</b>?"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from: -cv.r, to: cv.r,
        onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing",
        askDown ? B("So where was your hand going DOWN?", "So waar het jou hand AF gegaan?")
                : B("So where was your hand going UP?", "So waar het jou hand OP gegaan?"),
        correct, wrongs,
        { hint: B("The top of the semicircle is at x = 0. That is where it turns.",
                  "Die bokant van die halfsirkel is by x = 0. Daar draai dit."),
          answerLabel: correct }),
    });
  },

  /* ---------- exponential: no turn at all, plus the REASON ---------- */
  expClimb: () => {
    const cv = randExp();
    const rising = cv.a > 0;                    // b is always > 1 in our generator
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: true, labels: ["g"], asymLabels: true });
    const { from, to } = walkRange(cv, win);
    const correct = rising
      ? B("Increasing — it rises all the way", "Stygend — dit styg heelpad")
      : B("Decreasing — it falls all the way", "Dalend — dit daal heelpad");
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: B("Is g increasing or decreasing?", "Is g stygend of dalend?"),
      stem: `<span class="eq">${eqStr(cv, "g(x)")}</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to,
        onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing",
        B("Your hand never turned. So:", "Jou hand het nooit gedraai nie. Dus:"),
        correct,
        [rising ? B("Decreasing — it falls all the way", "Dalend — dit daal heelpad")
                : B("Increasing — it rises all the way", "Stygend — dit styg heelpad"),
         B("It increases, then decreases", "Dit styg, dan daal dit"),
         B("It decreases, then increases", "Dit daal, dan styg dit")],
        { hint: B("An exponential graph has no turning point — it only ever goes one way.",
                  "'n Eksponensiële grafiek het geen draaipunt nie — dit gaan net een rigting."),
          answerLabel: correct }),
    });
  },

  /* ---------- the reason, on its own (her "gee 'n rede") ---------- */
  expReason: () => {
    const cv = randExp();
    const rising = cv.a > 0;
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["g"], asymLabels: true });
    const correct = rising
      ? B(`a = ${C(cv.a)} > 0 and b = ${C(cv.b)} > 1, so g rises`, `a = ${C(cv.a)} > 0 en b = ${C(cv.b)} > 1, dus styg g`)
      : B(`a = ${C(cv.a)} &lt; 0, so the graph is flipped and g falls`, `a = ${C(cv.a)} &lt; 0, dus is die grafiek omgekeer en g daal`);
    return mc("increasing",
      rising ? B("g is increasing. Give the reason.", "g is stygend. Gee die rede.")
             : B("g is decreasing. Give the reason.", "g is dalend. Gee die rede."),
      correct,
      [B(`q = ${C(cv.q)}, so it moves down`, `q = ${C(cv.q)}, dus skuif dit af`),
       B("Because it has an asymptote", "Omdat dit 'n asimptoot het"),
       B("Because it has no turning point", "Omdat dit geen draaipunt het nie")],
      { graph: spec, wide: true, stem: `<span class="eq">${eqStr(cv, "g(x)")}</span>`,
        hint: B("Two things decide it: the sign of a, and whether b is bigger than 1.",
                "Twee dinge besluit dit: die teken van a, en of b groter as 1 is."),
        answerLabel: correct });
  },

  /* ---------- hyperbola: each branch on its own (her vb. 6.6) ---------- */
  hypClimb: () => {
    const cv = randHyperbola();
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const right = pick([true, false]);
    const { from, to } = walkRange(cv, win, right ? { lo: cv.p + 1e-3 } : { hi: cv.p - 1e-3 });
    /* a > 0 → both branches fall; a < 0 → both branches rise */
    const falls = cv.a > 0;
    const correct = falls
      ? B("Decreasing — every branch falls", "Dalend — elke tak daal")
      : B("Increasing — every branch rises", "Stygend — elke tak styg");
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: B("Is this branch of f increasing or decreasing?",
                "Is hierdie tak van f stygend of dalend?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Walk the branch you can see the point on — left to right.",
               "Stap die tak waarop jy die punt sien — links na regs."),
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to,
        onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing",
        B("And the other branch does the same. So:", "En die ander tak doen dieselfde. Dus:"),
        correct,
        [falls ? B("Increasing — every branch rises", "Stygend — elke tak styg")
               : B("Decreasing — every branch falls", "Dalend — elke tak daal"),
         B("One branch rises and the other falls", "Een tak styg en die ander daal"),
         B("It turns at the asymptote", "Dit draai by die asimptoot")],
        { hint: B(`For a hyperbola the sign of a decides it. Here a = ${C(cv.a)}.`,
                  `By 'n hiperbool besluit die teken van a. Hier is a = ${C(cv.a)}.`),
          answerLabel: correct }),
    });
  },
};

export const quest4 = quest("q4",
  B("The climb", "Die klim"),
  B("Feel the graph rise and fall — left to right only", "Voel die grafiek styg en daal — net links na regs"),
  [
    { id: "paraClimb", concept: "increasing", gen: SKILLS.paraClimb },
    { id: "expClimb", concept: "increasing", gen: SKILLS.expClimb },
    { id: "hypClimb", concept: "increasing", gen: SKILLS.hypClimb },
    { id: "expReason", concept: "increasing", gen: SKILLS.expReason },
    { id: "semiClimb", concept: "increasing", gen: SKILLS.semiClimb, techOnly: true },
  ],
  { rounds: 6, accent: ACC });
