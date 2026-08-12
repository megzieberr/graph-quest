/* ============================================================
   QUEST G · AVERAGE GRADIENT — the gradient of the chord
   ------------------------------------------------------------
   RUN-PLAN's "average gradient" batch (her p59): read two points
   off ONE curve, then one small sum — m = Δy/Δx. Taught as the
   gradient of the straight line (the CHORD) joining the two
   points, drawn as a deliberate step (chordReveal, engine/
   interactive.js) rather than handed over already drawn.

   Three round ideas, all on the same mechanic:
     1. gradNumber   — the number itself (whole or a simple fraction,
                        never a decimal — the points are chosen so
                        the arithmetic is always clean)
     2. gradSign     — positive or negative, read straight off the
                        drawn chord, BEFORE any arithmetic
     3. gradSteeper  — which of two marked chords is steeper

   No algebra anywhere: funclib's avgGradient/gradientStr do the one
   small sum, never the learner.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { chordReveal } from "../engine/interactive.js";
import { specFor, randParabola, randHyperbola, randExp, windowFor } from "./_graphs.js";
import { makeFn, eqStr, C, pick, isInt, shuffled, gradientStr } from "../funclib.js";

const ACC = "#f472b6";

/* ------------------------------------------------------------
   one clean pair of points on a curve, |Δx| ∈ {1,2,3} so the
   reduced gradient is always a whole number or a simple fraction
   ------------------------------------------------------------ */
function niceGradientPair() {
  for (let tries = 0; tries < 300; tries++) {
    const cv = pick([randParabola(), randParabola(), randHyperbola(), randExp()]);
    const win = windowFor([cv]);
    if (!win) continue;
    const lo = Math.ceil(win.xmin) + 1, hi = Math.floor(win.xmax) - 1;
    if (hi - lo < 1) continue;
    const f = makeFn(cv);
    const xs = []; for (let x = lo; x <= hi; x++) xs.push(x);
    for (const x1 of shuffled(xs)) {
      for (const dx of shuffled([1, 2, 3])) {
        const x2 = x1 + dx;
        if (!xs.includes(x2)) continue;
        if (cv.kind === "hyperbola" && (x1 < cv.p) !== (x2 < cv.p)) continue;   // same branch only
        const y1 = f(x1), y2 = f(x2);
        if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
        if (!isInt(y1) || !isInt(y2)) continue;
        if (Math.abs(y1) > 9 || Math.abs(y2) > 9) continue;
        const dy = y2 - y1;
        if (dy === 0) continue;                          // a flat chord has no sign to read
        const win2 = windowFor([cv], { include: [{ x: x1, y: y1 }, { x: x2, y: y2 }] });
        if (!win2) continue;
        return { cv, x1, x2, y1, y2, dy, dx, win: win2 };
      }
    }
  }
  const cv = { kind: "parabola", a: 1, p: 0, q: 0 };
  return { cv, x1: 1, x2: 2, y1: 1, y2: 4, dy: 3, dx: 1, win: windowFor([cv], { include: [{ x: 1, y: 1 }, { x: 2, y: 4 }] }) };
}

/* ------------------------------------------------------------
   two clean, clearly-different-steepness, non-overlapping pairs
   on the same curve
   ------------------------------------------------------------ */
function steeperPair() {
  for (let tries = 0; tries < 300; tries++) {
    const cv = pick([randParabola(), randParabola(), randHyperbola(), randExp()]);
    const win = windowFor([cv]);
    if (!win) continue;
    const lo = Math.ceil(win.xmin) + 1, hi = Math.floor(win.xmax) - 1;
    if (hi - lo < 3) continue;
    const f = makeFn(cv);
    const xs = []; for (let x = lo; x <= hi; x++) xs.push(x);
    const cands = [];
    xs.forEach((x1) => {
      [1, 2, 3].forEach((dx) => {
        const x2 = x1 + dx;
        if (!xs.includes(x2)) return;
        if (cv.kind === "hyperbola" && (x1 < cv.p) !== (x2 < cv.p)) return;
        const y1 = f(x1), y2 = f(x2);
        if (!Number.isFinite(y1) || !Number.isFinite(y2) || !isInt(y1) || !isInt(y2)) return;
        if (Math.abs(y1) > 9 || Math.abs(y2) > 9) return;
        const dy = y2 - y1;
        if (dy === 0) return;
        cands.push({ x1, x2, y1, y2, dy, dx, m: Math.abs(dy / dx) });
      });
    });
    if (cands.length < 2) continue;
    const sc = shuffled(cands);
    for (let i = 0; i < sc.length; i++) {
      for (let j = i + 1; j < sc.length; j++) {
        const P = sc[i], Q = sc[j];
        if (Math.abs(P.m - Q.m) < 0.4) continue;                 // want a clear winner
        const lo1 = Math.min(P.x1, P.x2), hi1 = Math.max(P.x1, P.x2);
        const lo2 = Math.min(Q.x1, Q.x2), hi2 = Math.max(Q.x1, Q.x2);
        if (lo1 < hi2 && lo2 < hi1) continue;                    // no overlapping x-ranges — stay readable
        const pts = [{ x: P.x1, y: P.y1 }, { x: P.x2, y: P.y2 }, { x: Q.x1, y: Q.y1 }, { x: Q.x2, y: Q.y2 }];
        const win2 = windowFor([cv], { include: pts });
        if (!win2) continue;
        return { cv, P, Q, win: win2 };
      }
    }
  }
  const cv = { kind: "parabola", a: 1, p: 0, q: 0 };
  const P = { x1: 0, x2: 1, y1: 0, y2: 1, dy: 1, dx: 1, m: 1 };
  const Q = { x1: 2, x2: 3, y1: 4, y2: 9, dy: 5, dx: 1, m: 5 };
  return { cv, P, Q, win: windowFor([cv], { include: [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }] }) };
}

/* ------------------------------------------------------------
   the skills
   ------------------------------------------------------------ */
const SKILLS = {
  gradNumber: () => {
    const { cv, x1, x2, y1, y2, dy, dx, win } = niceGradientPair();
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) return SKILLS.gradNumber();
    const correct = gradientStr(dy, dx);
    const flipSign = gradientStr(-dy, dx);
    const reciprocal = gradientStr(dx, dy);
    /* the classic "used one point's raw coordinates as a slope"
       mistake — pick whichever of A/B has a non-zero x, so the
       decoy itself is never a divide-by-zero */
    const rawFromB = x2 !== 0;
    const rawX = rawFromB ? x2 : x1, rawY = rawFromB ? y2 : y1, rawWho = rawFromB ? "B" : "A";
    const rawPoint = gradientStr(rawY, rawX);
    const seen = new Set([correct, flipSign, reciprocal, rawPoint]);
    if (seen.size < 4) return SKILLS.gradNumber();                // a decoy collapsed onto another value — redraw
    const wrongs = [
      { label: flipSign,
        misc: B("The sign flipped — Δy is B's height MINUS A's, not the other way round.",
                "Die teken het omgeswaai — Δy is B se hoogte MINUS A s'n, nie andersom nie.") },
      { label: reciprocal,
        misc: B("That is Δx over Δy — the gradient is the other way up: Δy OVER Δx.",
                "Dit is Δx oor Δy — die gradiënt is andersom: Δy OOR Δx.") },
      { label: rawPoint,
        misc: B(`That uses ${rawWho}'s own coordinates on their own — the gradient needs the CHANGE from A to B.`,
                `Dit gebruik net ${rawWho} se eie koördinate — die gradiënt het die VERANDERING van A na B nodig.`) },
    ];
    const built = iq({
      concept: "gradient", kind: "chordReveal", accent: ACC,
      prompt: B("A and B lie on f. Tap to draw the chord AB, then find its average gradient.",
                "A en B lê op f. Klik om die koord AB te teken, kry dan sy gemiddelde gradiënt."),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Tap the sketch to draw the line through A and B.", "Klik op die skets om die lyn deur A en B te teken."),
      build: (host, done) => chordReveal(host, { spec, curve: 0, pairs: [{ x1, x2, names: ["A", "B"] }], onTap: () => done() }),
      then: mc("gradient",
        B("What is the average gradient of AB?", "Wat is die gemiddelde gradiënt van AB?"), correct, wrongs,
        { hint: B("Average gradient = Δy over Δx — B's height minus A's, over B's x minus A's.",
                  "Gemiddelde gradiënt = Δy oor Δx — B se hoogte min A s'n, oor B se x min A s'n."),
          answerLabel: B(`m = ${correct}`, `m = ${correct}`) }),
    });
    built.debugGrad = { win: spec.win, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], dy, dx };
    return built;
  },

  gradSign: () => {
    const { cv, x1, x2, y1, y2, dy, dx, win } = niceGradientPair();
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) return SKILLS.gradSign();
    const rising = dy > 0;
    const correct = rising
      ? B("positive — the chord climbs from A to B", "positief — die koord styg van A na B")
      : B("negative — the chord falls from A to B", "negatief — die koord daal van A na B");
    const built = iq({
      concept: "gradient", kind: "chordReveal", accent: ACC,
      prompt: B("A and B lie on f. Tap to draw the chord AB. Before working out a number — is its average gradient positive or negative?",
                "A en B lê op f. Klik om die koord AB te teken. Voor jy 'n getal uitwerk — is sy gemiddelde gradiënt positief of negatief?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Tap the sketch to draw the line through A and B.", "Klik op die skets om die lyn deur A en B te teken."),
      build: (host, done) => chordReveal(host, { spec, curve: 0, pairs: [{ x1, x2, names: ["A", "B"] }], onTap: () => done() }),
      then: mc("gradient",
        B("Just from the picture — positive or negative?", "Net van die prentjie af — positief of negatief?"),
        correct,
        [rising
          ? B("negative — the chord falls from A to B", "negatief — die koord daal van A na B")
          : B("positive — the chord climbs from A to B", "positief — die koord styg van A na B"),
         B("zero — it is flat", "nul — dit is plat"),
         { label: B("you cannot tell without calculating", "jy kan nie sonder om uit te werk sê nie"),
           misc: B("You can! A chord that climbs left to right has a positive gradient, one that falls has a negative one — no arithmetic needed.",
                   "Jy kan! 'n Koord wat links na regs styg het 'n positiewe gradiënt, een wat daal het 'n negatiewe — geen uitwerk nodig nie.") }],
        { hint: B("Follow the drawn chord with your eye, left to right — does it climb or fall?",
                  "Volg die geteken koord met jou oog, links na regs — styg of daal dit?"),
          answerLabel: correct }),
    });
    built.debugGrad = { win: spec.win, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], dy, dx };
    return built;
  },

  gradSteeper: () => {
    const { cv, P, Q, win } = steeperPair();
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) return SKILLS.gradSteeper();
    const abSteeper = P.m > Q.m;
    const correct = abSteeper ? "AB" : "CD";
    const wrong1 = abSteeper ? "CD" : "AB";
    const built = iq({
      concept: "gradient", kind: "chordReveal", accent: ACC,
      prompt: B("Two chords are marked on f. Tap to draw them, then say which one is STEEPER.",
                "Twee koorde is op f gemerk. Klik om hulle te teken, sê dan watter een STEILER is."),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Tap the sketch to draw both chords.", "Klik op die skets om albei koorde te teken."),
      build: (host, done) => chordReveal(host, {
        spec, curve: 0,
        pairs: [{ x1: P.x1, x2: P.x2, names: ["A", "B"] }, { x1: Q.x1, x2: Q.x2, names: ["C", "D"] }],
        onTap: () => done(),
      }),
      then: mc("gradient",
        B("Which chord has the steeper average gradient — AB or CD?", "Watter koord het die steiler gemiddelde gradiënt — AB of CD?"),
        correct,
        [wrong1,
         { label: B("they are equally steep", "hulle is ewe steil"),
           misc: B("Look again — one climbs (or falls) more sharply across its own width. They are not equal.",
                   "Kyk weer — een styg (of daal) skerper oor sy eie wydte. Hulle is nie gelyk nie.") },
         { label: B("you cannot tell without calculating", "jy kan nie sonder om uit te werk sê nie"),
           misc: B("You can! The steeper chord climbs or falls more sharply — no arithmetic needed to see which one wins by eye.",
                   "Jy kan! Die steiler koord styg of daal skerper — geen uitwerk nodig om met die oog te sien watter een wen nie.") }],
        { hint: B("The steeper chord looks closer to vertical — compare how much each one rises across its own width.",
                  "Die steiler koord lyk nader aan vertikaal — vergelyk hoeveel elkeen styg oor sy eie wydte."),
          answerLabel: correct === "AB" ? B("AB is steeper", "AB is steiler") : B("CD is steeper", "CD is steiler") }),
    });
    built.debugGrad = {
      win: spec.win,
      points: [{ x: P.x1, y: P.y1 }, { x: P.x2, y: P.y2 }, { x: Q.x1, y: Q.y1 }, { x: Q.x2, y: Q.y2 }],
      mAB: P.m, mCD: Q.m,
    };
    return built;
  },
};

export const questGradient = quest("qG",
  B("Average gradient", "Gemiddelde gradiënt"),
  B("The gradient of the chord — read two points, do one small sum", "Die gradiënt van die koord — lees twee punte, doen een klein som"),
  [
    { id: "gradNumber", concept: "gradient", gen: SKILLS.gradNumber, weight: 2 },
    { id: "gradSign", concept: "gradient", gen: SKILLS.gradSign },
    { id: "gradSteeper", concept: "gradient", gen: SKILLS.gradSteeper },
  ],
  { rounds: 6, accent: ACC });

/* ---------------- the intro lesson ----------------
   Her method, in order: mark two points, draw the chord, THEN
   read Δy over Δx off the picture. */
{
  const cv = { kind: "parabola", a: 1, p: 0, q: -1 };
  const win = windowFor([cv], { include: [{ x: -2, y: 3 }, { x: 1, y: 0 }] });
  const base = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  questGradient.intro = { beats: [
    { spec: base, cap: B("The average gradient between two points on a curve is the gradient of the straight LINE joining them — the chord.",
                         "Die gemiddelde gradiënt tussen twee punte op 'n kurwe is die gradiënt van die reguit LYN wat hulle verbind — die koord.") },
    { spec: base, cap: B("Tap the sketch to draw the chord — nothing is computed for you, you only see the line.",
                         "Klik op die skets om die koord te teken — niks word vir jou uitgewerk nie, jy sien net die lyn.") },
    { spec: base, cap: B("Then read each point's height off the grid: gemiddelde gradiënt = Δy oor Δx.",
                         "Lees dan elke punt se hoogte van die rooster af: gemiddelde gradiënt = Δy oor Δx.") },
  ] };
}
