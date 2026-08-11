/* ============================================================
   QUEST 3 · READ THE REGION — basic region reading   ★ session 4
   ------------------------------------------------------------
   RUN-PLAN's Round C: one graph, ONE thing to look at, many reps.
   Four sub-rounds, families mixed from the start (semicircles
   behind the flag):

     1. increasing/decreasing  — v1's climb mechanic (kept), answer
        in x-values (her rule: the answer is ALWAYS x-values, even
        for a hyperbola branch or an exponential's whole domain).
     2. above/below the x-axis — a clean sketch, no mechanic: look
        and pick from the list. Never asks at a root (sections are
        sampled at their midpoint, never at a cut).
     3. domain & range — NEW: before the curtain opens, the learner
        must tap the AXIS the answer lives on (domain → x, range →
        y). A wrong tap just bounces — no penalty. Then v1's curtain
        (kept) confirms the sweep.
     4. sub-in reading — NEW: tap x = 2 on the sketch; the dashed
        drop-line and the point appear only once tapped (nothing is
        computed for the learner — they read k off the picture,
        then confirm it from a short numeric list).

   This quest replaces v1's q3-curtain.js and q4-climb.js, which are
   retired as this file lands (RUN-PLAN session 4).
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { climb, curtain, axisGate, tapReveal } from "../engine/interactive.js";
import {
  specFor, randLine, randParabola, randHyperbola, randExp, randSemicircle, windowFor,
} from "./_graphs.js";
import {
  makeFn, paraTP, paraStd, eqStr, C, pick, randInt, isInt, numDecoys, circleEq,
  rangeStr, domainStr,
  criticalXs, sections, signAt,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#2dd4bf";

const WALK = B("Drag the point from left to right. It will not go back.",
               "Drag die punt van links na regs. Dit gaan nie terug nie.");
const WRONGWAY = B("Nothing lit up — the graph is not on that side. Try the other way.",
                   "Niks het opgelig nie — die grafiek is nie aan daardie kant nie. Probeer die ander kant.");
const OTHERSIDE = B("Good — now try the other side too.", "Goed — probeer nou ook die ander kant.");
const TAPPED_X = B("Right line — the domain lives on the x-axis. Now pull the shade.",
                   "Reg lyn — die definisieversameling lê op die x-as. Trek nou die skerm.");
const TAPPED_Y = B("Right line — the range lives on the y-axis. Now pull the shade.",
                   "Reg lyn — die waardeversameling lê op die y-as. Trek nou die skerm.");
const WRONG_X = B("Domain lives on the x-axis — tap the other line.",
                  "Definisieversameling lê op die x-as — tik die ander lyn.");
const WRONG_Y = B("Range lives on the y-axis — tap the other line.",
                  "Waardeversameling lê op die y-as — tik die ander lyn.");

/* ------------------------------------------------------------
   1. INCREASING / DECREASING — v1's climb, x-value answers
   ------------------------------------------------------------ */

/* a stretch of x the curve actually occupies inside the window
   (unchanged from v1's q4-climb.js) */
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

const INC_Q = B("For which values of x is f increasing?", "Vir watter waardes van x is f stygend?");
const DEC_Q = B("For which values of x is f decreasing?", "Vir watter waardes van x is f dalend?");
/* the graph's letter varies per family (g for exponential, h for a
   semicircle) — the question must always name the SAME letter the
   sketch is labelled with, never a hardcoded "f" */
const incQFor = (name) => B(`For which values of x is ${name} increasing?`, `Vir watter waardes van x is ${name} stygend?`);
const decQFor = (name) => B(`For which values of x is ${name} decreasing?`, `Vir watter waardes van x is ${name} dalend?`);
const SAWUP = B("So where was your hand going UP?", "So waar het jou hand OP gegaan?");
const SAWDOWN = B("So where was your hand going DOWN?", "So waar het jou hand AF gegaan?");

const CLIMB_SKILLS = {
  climbPara: () => {
    const cv = randParabola();
    const tp = paraTP(cv), opens = paraStd(cv).a > 0;
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    const { from, to } = walkRange(cv, win);
    const askInc = pick([true, false]);
    const incSide = opens ? `x > ${C(tp.x)}` : `x &lt; ${C(tp.x)}`;
    const decSide = opens ? `x &lt; ${C(tp.x)}` : `x > ${C(tp.x)}`;
    const correct = askInc ? incSide : decSide;
    const wrongs = [askInc ? decSide : incSide, `x > ${C(tp.y)}`, `y > ${C(tp.y)}`];
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: askInc ? INC_Q : DEC_Q,
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to, onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing", askInc ? SAWUP : SAWDOWN, correct, wrongs,
        { hint: B(`The turn happens at x = ${C(tp.x)}.`, `Die draai gebeur by x = ${C(tp.x)}.`),
          answerLabel: B(`f is ${askInc ? "increasing" : "decreasing"} for ${correct}`,
                         `f is ${askInc ? "stygend" : "dalend"} vir ${correct}`) }),
    });
  },

  climbExp: () => {
    const cv = randExp();
    const rising = cv.a > 0;
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: true, labels: ["g"], asymLabels: true });
    const { from, to } = walkRange(cv, win);
    const correct = "x ∈ ℝ";
    const p0 = cv.p || 0;
    const wrongs = [`x > ${C(p0)}`, `x &lt; ${C(p0)}`, `x ≠ ${C(p0)}`];
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: rising ? incQFor("g") : decQFor("g"),
      stem: `<span class="eq">${eqStr(cv, "g(x)")}</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to, onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing",
        B("Your hand never turned. So, for which x?", "Jou hand het nooit gedraai nie. Dus, vir watter x?"),
        correct, wrongs,
        { hint: B("An exponential graph has no turning point — it only ever goes one way, for its WHOLE domain.",
                  "'n Eksponensiële grafiek het geen draaipunt nie — dit gaan net een rigting, vir sy HELE definisieversameling."),
          answerLabel: B(`g is ${rising ? "increasing" : "decreasing"} for ${correct}`,
                         `g is ${rising ? "stygend" : "dalend"} vir ${correct}`) }),
    });
  },

  climbHyp: () => {
    const cv = randHyperbola();
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const right = pick([true, false]);
    const { from, to } = walkRange(cv, win, right ? { lo: cv.p + 1e-3 } : { hi: cv.p - 1e-3 });
    const falls = cv.a > 0;                     // a > 0 → every branch falls
    const correct = right ? `x > ${C(cv.p)}` : `x &lt; ${C(cv.p)}`;
    const wrongs = [right ? `x &lt; ${C(cv.p)}` : `x > ${C(cv.p)}`];  // wrong side of the asymptote
    if (cv.q !== cv.p) wrongs.push(right ? `x > ${C(cv.q)}` : `x &lt; ${C(cv.q)}`);  // used q instead of p
    wrongs.push(`y > ${C(cv.p)}`);                                    // answered with y instead of x
    if (wrongs.length < 3) wrongs.push(right ? `x > ${C(cv.p + 1)}` : `x &lt; ${C(cv.p - 1)}`);
    return iq({
      concept: "increasing", kind: "climb", accent: ACC, meter: true,
      prompt: falls ? DEC_Q : INC_Q,
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Walk the branch you can see the point on — left to right.",
               "Stap die tak waarop jy die punt sien — links na regs."),
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from, to, onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing", falls ? SAWDOWN : SAWUP, correct, wrongs,
        { hint: B(`This branch never crosses x = ${C(cv.p)} — the asymptote is the boundary.`,
                  `Hierdie tak kruis nooit x = ${C(cv.p)} nie — die asimptoot is die grens.`),
          answerLabel: B(`f is ${falls ? "decreasing" : "increasing"} for ${correct}`,
                         `f is ${falls ? "dalend" : "stygend"} vir ${correct}`) }),
    });
  },

  climbSemi: () => {
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
      prompt: askDown ? decQFor("h") : incQFor("h"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: WALK,
      build: (host, done, nudge, meter) => climb(host, {
        spec, curve: 0, from: -cv.r, to: cv.r, onMove: (s) => meter(s), onDone: () => done(),
      }),
      then: mc("increasing", askDown ? SAWDOWN : SAWUP, correct, wrongs,
        { hint: B("The top of the semicircle is at x = 0. That is where it turns.",
                  "Die bokant van die halfsirkel is by x = 0. Daar draai dit."),
          answerLabel: correct }),
    });
  },
};

/* ------------------------------------------------------------
   2. ABOVE / BELOW THE X-AXIS — clean sketch, list/chips only
   ------------------------------------------------------------ */
function usableSections(secs, cv) {
  const f = makeFn(cv);
  return secs.map((s) => ({ ...s, usable: Number.isFinite(f(s.mid)) }));
}

function aboveBelow() {
  const cv = pick([randParabola(), randParabola(), randLine(), randExp(), randHyperbola()]);
  const win = windowFor([cv]);
  if (!win) return aboveBelow();
  const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
  const cuts = criticalXs([cv], win.xmin, win.xmax);
  if (!cuts.length) return aboveBelow();
  const secs = usableSections(sections(cuts, win.xmin, win.xmax), cv);
  const wantPos = pick([true, false]);
  const lang = getLang();

  const chosen = secs.filter((s) => s.usable && signAt(cv, s.mid) === (wantPos ? 1 : -1));
  if (!chosen.length || chosen.length === secs.length) return aboveBelow();
  const correct = answerString(chosen, cuts, win, { strict: true, lang });
  const wrongs = [
    { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
      misc: wantPos
        ? B("Those are the sections where the graph is BELOW the x-axis — this question asks for above.",
            "Daai is die afdelings waar die grafiek ONDER die x-as lê — hierdie vraag vra vir bo.")
        : B("Those are the sections where the graph is ABOVE the x-axis — this question asks for below.",
            "Daai is die afdelings waar die grafiek BO die x-as lê — hierdie vraag vra vir onder.") },
    { label: asYString(correct),
      misc: B("The answer must be x-values — the graph's HEIGHT is f(x), but WHERE it happens is an x.",
              "Die antwoord moet x-waardes wees — die grafiek se HOOGTE is f(x), maar WAAR dit gebeur is 'n x.") },
    { label: flipStrictString(chosen, cuts, win, { strict: true, lang }),
      misc: B("A strict < or > never includes the boundary — the graph is exactly ON the axis there.",
              "'n Streng < of > sluit nooit die grens in nie — die grafiek is daar presies OP die as.") },
  ];
  return mc("sign",
    wantPos
      ? B("For which values of x is <span class='eq'>f(x) &gt; 0</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &gt; 0</span>?")
      : B("For which values of x is <span class='eq'>f(x) &lt; 0</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &lt; 0</span>?"),
    correct, wrongs,
    { graph: spec, wide: true, stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      hints: [
        wantPos
          ? B("Look for where the graph is drawn ABOVE the x-axis.", "Kyk waar die grafiek BO die x-as geteken is.")
          : B("Look for where the graph is drawn BELOW the x-axis.", "Kyk waar die grafiek ONDER die x-as geteken is."),
        B("Write it as x-values, left to right.", "Skryf dit as x-waardes, links na regs."),
      ],
      answerLabel: correct });
}

/* ------------------------------------------------------------
   3. DOMAIN & RANGE — tap the axis, then the curtain (v1, kept)
   ------------------------------------------------------------ */
function domainRangeFlow({ spec, want, boundary, label, need = 1, dirGood }) {
  return (host, done, nudge) => axisGate(host, {
    spec, want,
    onPass: () => {
      nudge(want === "x" ? TAPPED_X : TAPPED_Y);
      setTimeout(() => {
        const seen = new Set();
        curtain(host, {
          spec, boundary, label,
          onSweep: (dir) => {
            if (!dirGood(dir)) { nudge(WRONGWAY); return; }
            seen.add(dir);
            if (seen.size >= need) done();
            else nudge(OTHERSIDE);
          },
        });
      }, 320);
    },
    onWrong: () => nudge(want === "x" ? WRONG_X : WRONG_Y),
  });
}

const RANGE_Q = { title: (name) => B(`What is the <b>range</b> of ${name}?`, `Wat is die <b>waardeversameling</b> van ${name}?`) };
const DOMAIN_Q = { title: (name) => B(`What is the <b>domain</b> of ${name}?`, `Wat is die <b>definisieversameling</b> van ${name}?`) };

const REGION_SKILLS = {
  paraRange: () => {
    const cv = randParabola();
    const tp = paraTP(cv), up = paraStd(cv).a > 0;
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"] });
    const correct = rangeStr(cv);
    const wrongs = [
      up ? `y &lt; ${C(tp.y)}` : `y > ${C(tp.y)}`,
      up ? `y ≤ ${C(tp.y)}` : `y ≥ ${C(tp.y)}`,
      `y ≥ ${C(tp.x)}`,
    ];
    return iq({
      concept: "range", kind: "axisGate+curtain", accent: ACC,
      prompt: RANGE_Q.title("f"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("First: which axis does the range live on?", "Eerste: op watter as lê die waardeversameling?"),
      build: domainRangeFlow({ spec, want: "y", boundary: { y: tp.y }, label: `y = ${C(tp.y)}`, dirGood: (dir) => (dir === "up") === up }),
      then: mc("range", B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("The turning point IS reached, so the sign includes it: ≥ or ≤.",
                  "Die draaipunt WORD bereik, so die teken sluit dit in: ≥ of ≤."),
          answerLabel: correct }),
    });
  },

  expRange: () => {
    const cv = randExp();
    const up = cv.a > 0;
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["g"], asymLabels: true });
    const correct = rangeStr(cv);
    const wrongs = [
      up ? `y ≥ ${C(cv.q)}` : `y ≤ ${C(cv.q)}`,
      up ? `y &lt; ${C(cv.q)}` : `y > ${C(cv.q)}`,
      "y ∈ ℝ",
    ];
    return iq({
      concept: "range", kind: "axisGate+curtain", accent: ACC,
      prompt: RANGE_Q.title("g"),
      stem: `<span class="eq">${eqStr(cv, "g(x)")}</span>`,
      coach: B("First: which axis does the range live on?", "Eerste: op watter as lê die waardeversameling?"),
      build: domainRangeFlow({ spec, want: "y", boundary: { y: cv.q }, label: `y = ${C(cv.q)}`, dirGood: (dir) => (dir === "up") === up }),
      then: mc("range", B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("The graph gets closer and closer to the asymptote but never touches it — no line under the sign.",
                  "Die grafiek kom nader en nader aan die asimptoot maar raak dit nooit — geen streep onder die teken nie."),
          answerLabel: correct }),
    });
  },

  hypRange: () => {
    const cv = randHyperbola();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const correct = rangeStr(cv);
    const wrongs = [`y > ${C(cv.q)}`, `y &lt; ${C(cv.q)}`, "y ∈ ℝ"];
    return iq({
      concept: "range", kind: "axisGate+curtain", accent: ACC,
      prompt: RANGE_Q.title("f"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("First: which axis does the range live on?", "Eerste: op watter as lê die waardeversameling?"),
      build: domainRangeFlow({ spec, want: "y", boundary: { y: cv.q }, label: `y = ${C(cv.q)}`, need: 2, dirGood: () => true }),
      then: mc("range", B("So what is the range?", "So wat is die waardeversameling?"), correct, wrongs,
        { hint: B("There is graph above the line AND below it. Only one height is missing: the asymptote itself.",
                  "Daar is grafiek bo die lyn ÉN onder dit. Net een hoogte kom nie voor nie: die asimptoot self."),
          answerLabel: correct }),
    });
  },

  hypDomain: () => {
    const cv = randHyperbola();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const correct = domainStr(cv);
    const wrongs = [`x > ${C(cv.p)}`, "x ∈ ℝ", `x ≠ ${C(cv.q)}`];
    return iq({
      concept: "domain", kind: "axisGate+curtain", accent: ACC,
      prompt: DOMAIN_Q.title("f"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("First: which axis does the domain live on?", "Eerste: op watter as lê die definisieversameling?"),
      build: domainRangeFlow({ spec, want: "x", boundary: { x: cv.p }, label: `x = ${C(cv.p)}`, need: 2, dirGood: () => true }),
      then: mc("domain", B("So what is the domain?", "So wat is die definisieversameling?"), correct, wrongs,
        { hint: B("Domain = x-values. There is graph left of the line and right of it — only the line itself is missing.",
                  "Definisieversameling = x-waardes. Daar is grafiek links en regs van die lyn — net die lyn self ontbreek."),
          answerLabel: correct }),
    });
  },

  semiRange: () => {
    const cv = randSemicircle();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["h"] });
    const correct = rangeStr(cv);
    const wrongs = [`0 &lt; y &lt; ${C(cv.r)}`, `${C(-cv.r)} ≤ y ≤ ${C(cv.r)}`, "y ≥ 0"];
    return iq({
      concept: "range", kind: "axisGate+curtain", accent: ACC, techOnly: true,
      prompt: RANGE_Q.title("h"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: B("First: which axis does the range live on?", "Eerste: op watter as lê die waardeversameling?"),
      build: domainRangeFlow({ spec, want: "y", boundary: { y: 0 }, label: "y = 0", dirGood: (dir) => dir === "up" }),
      then: mc("range", B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("A semicircle stops at both ends — it really reaches 0 and it really reaches the top. Both signs get a line.",
                  "'n Halfsirkel hou aan albei kante op — dit bereik werklik 0 en werklik die bokant. Albei tekens kry 'n streep."),
          answerLabel: correct }),
    });
  },

  semiDomain: () => {
    const cv = randSemicircle();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["h"] });
    const correct = domainStr(cv);
    const wrongs = [`${C(-cv.r)} &lt; x &lt; ${C(cv.r)}`, "x ∈ ℝ", `0 ≤ x ≤ ${C(cv.r)}`];
    return iq({
      concept: "domain", kind: "axisGate+curtain", accent: ACC, techOnly: true,
      prompt: DOMAIN_Q.title("h"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: B("First: which axis does the domain live on?", "Eerste: op watter as lê die definisieversameling?"),
      build: domainRangeFlow({ spec, want: "x", boundary: { x: -cv.r }, label: `x = ${C(-cv.r)}`, dirGood: (dir) => dir === "right" }),
      then: mc("domain", B("Now write the domain.", "Skryf nou die definisieversameling."), correct, wrongs,
        { hint: B("Read where the graph starts and where it stops on the x-axis. Both ends are reached.",
                  "Lees waar die grafiek begin en waar dit ophou op die x-as. Albei punte word bereik."),
          answerLabel: correct }),
    });
  },
};

/* ------------------------------------------------------------
   4. SUB-IN READING — tap x = 2, read k off the picture
   ------------------------------------------------------------ */
function niceSubPoint(kind) {
  for (let tries = 0; tries < 200; tries++) {
    let cv, x;
    if (kind === "line") { cv = randLine(); x = randInt(-4, 4); }
    else if (kind === "parabola") { cv = randParabola(); x = randInt(-3, 4); }
    else if (kind === "hyperbola") {
      cv = randHyperbola();
      const d = pick([1, -1, 2, -2].filter((v) => isInt(cv.a / v)));
      if (d == null) continue;
      x = cv.p + d;
    } else { cv = randExp(); x = randInt(0, 2); }
    const y = makeFn(cv)(x);
    if (!Number.isFinite(y) || !isInt(y) || Math.abs(y) > 13 || Math.abs(x) > 7) continue;
    if (Math.abs(y) < 0.5) continue;                     // (x ; 0) sits on the axis — too easy a giveaway
    if (!windowFor([cv], { include: [{ x, y }] })) continue;
    return { cv, x: Math.round(x), y: Math.round(y) };
  }
  return { cv: { kind: "line", a: 2, q: 1 }, x: 3, y: 7 };
}

function subInFor(kind) {
  const { cv, x, y } = niceSubPoint(kind);
  const spec = specFor([cv], { accent: ACC, ticks: "labels", labels: ["f"] });
  if (!spec) return subInFor(kind);
  const correct = C(y);
  const wrongs = numDecoys(y, [x, -y, y + 2]).map(C);
  return iq({
    concept: "subIn", kind: "tapReveal", accent: ACC,
    prompt: B(`(${C(x)} ; k) lies on f. Tap x = ${C(x)} on the sketch.`,
              `(${C(x)} ; k) lê op f. Tik x = ${C(x)} op die skets.`),
    stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
    coach: B(`Tap the x-axis at x = ${C(x)}.`, `Tik die x-as by x = ${C(x)}.`),
    build: (host, done) => tapReveal(host, { spec, curve: 0, at: x, symbol: "k", onTap: () => done() }),
    then: mc("subIn", B("So what is k?", "So wat is k?"), correct, wrongs,
      { hint: B("Follow the dashed line up from the axis to the curve, then read the height.",
                "Volg die stippellyn op vanaf die as tot by die kurwe, lees dan die hoogte."),
        answerLabel: B(`k = ${correct}`, `k = ${correct}`) }),
  });
}

const SUBIN_SKILLS = {
  subInLine: () => subInFor("line"),
  subInPara: () => subInFor("parabola"),
  subInHyp: () => subInFor("hyperbola"),
  subInExp: () => subInFor("exp"),
};

/* ------------------------------------------------------------
   The quest — every sub-round mixed together
   ------------------------------------------------------------ */
export const quest3 = quest("q3",
  B("Read the region", "Lees die gebied"),
  B("One graph, one thing to look at — many reps", "Een grafiek, een ding om na te kyk — baie herhalings"),
  [
    { id: "climbPara", concept: "increasing", gen: CLIMB_SKILLS.climbPara },
    { id: "climbExp", concept: "increasing", gen: CLIMB_SKILLS.climbExp },
    { id: "climbHyp", concept: "increasing", gen: CLIMB_SKILLS.climbHyp },
    { id: "climbSemi", concept: "increasing", gen: CLIMB_SKILLS.climbSemi, techOnly: true },
    { id: "aboveBelow", concept: "sign", gen: aboveBelow, weight: 2 },
    { id: "paraRange", concept: "range", gen: REGION_SKILLS.paraRange },
    { id: "expRange", concept: "range", gen: REGION_SKILLS.expRange },
    { id: "hypRange", concept: "range", gen: REGION_SKILLS.hypRange },
    { id: "hypDomain", concept: "domain", gen: REGION_SKILLS.hypDomain },
    { id: "semiRange", concept: "range", gen: REGION_SKILLS.semiRange, techOnly: true },
    { id: "semiDomain", concept: "domain", gen: REGION_SKILLS.semiDomain, techOnly: true },
    { id: "subInLine", concept: "subIn", gen: SUBIN_SKILLS.subInLine },
    { id: "subInPara", concept: "subIn", gen: SUBIN_SKILLS.subInPara },
    { id: "subInHyp", concept: "subIn", gen: SUBIN_SKILLS.subInHyp },
    { id: "subInExp", concept: "subIn", gen: SUBIN_SKILLS.subInExp },
  ],
  { rounds: 10, accent: ACC });

/* ---------------- the intro lesson ----------------
   Two new things this quest teaches: the climb (kept from v1, but
   this is most learners' first sight of it if v1 was never played)
   and the brand-new axis-tap gate. Short, four beats. */
{
  const cv = { kind: "parabola", a: 1, p: 1, q: -2 };
  const win = windowFor([cv]);
  const base = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  quest3.intro = { beats: [
    { spec: base, cap: B("This quest is about READING one thing off a graph at a time — no working out, just looking.",
                         "Hierdie soektog gaan oor EEN ding op 'n slag van 'n grafiek AFLEES — geen uitwerk nie, net kyk.") },
    { spec: base, cap: B("Some rounds you WALK a point left to right — it will not go backwards, so your hand rises and falls exactly as the graph does.",
                         "Sommige rondtes STAP jy 'n punt van links na regs — dit gaan nie terugtoe nie, so jou hand styg en daal presies soos die grafiek.") },
    { spec: base, cap: B("For domain and range, you first tap the AXIS your answer lives on — x for domain, y for range. Tap the wrong one and nothing happens, just try again.",
                         "Vir definisie- en waardeversameling tik jy eers die AS waarop jou antwoord lê — x vir definisieversameling, y vir waardeversameling. Tik die verkeerde een en niks gebeur nie, probeer net weer.") },
    { spec: base, cap: B("Every answer is always written in x-values, or read straight off the picture. Ready?",
                         "Elke antwoord word altyd in x-waardes geskryf, of reguit van die prent afgelees. Reg?") },
  ] };
}
