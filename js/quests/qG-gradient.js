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
import { specFor, randParabola, randHyperbolaOffAxis, randExp, windowFor } from "./_graphs.js";
import { makeFn, eqStr, C, pick, isInt, shuffled, gradientStr, avgGradient } from "../funclib.js";

const ACC = "#f472b6";

/* ------------------------------------------------------------
   one clean pair of points on a curve, |Δx| ∈ {1,2,3} so the
   reduced gradient is always a whole number or a simple fraction
   ------------------------------------------------------------ */
function niceGradientPair() {
  for (let tries = 0; tries < 300; tries++) {
    const cv = pick([randParabola(), randParabola(), randHyperbolaOffAxis(), randExp()]);
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
    const cv = pick([randParabola(), randParabola(), randHyperbolaOffAxis(), randExp()]);
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
        /* the gradient itself always goes through funclib's avgGradient() —
           never a raw dy/dx division here — so the answer key and the
           harness that checks it share the one source of truth (house
           law: ALL maths lives in funclib.js). */
        cands.push({ x1, x2, y1, y2, dy, dx, m: Math.abs(avgGradient(y1, y2, x1, x2)) });
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
        /* <=, not < : two chords that only TOUCH at a shared endpoint x
           still land two dots and two labels on the exact same point —
           measured 65,5% of rounds did this before the fix (bug 4). */
        if (lo1 <= hi2 && lo2 <= hi1) continue;                  // no overlapping (or touching) x-ranges — stay readable
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
    for (let tries = 0; tries < 30; tries++) {
      const { cv, x1, x2, y1, y2, dy, dx, win } = niceGradientPair();
      const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
      if (!spec) continue;
      const correct = gradientStr(dy, dx);
      const flipSign = gradientStr(-dy, dx);
      /* the reciprocal decoy (Δx over Δy) reduces to the SAME string as
         `correct` whenever |Δy| = |Δx| — both sides reduce to ±1 — so
         m = +1 and m = −1 could never ship (exhaustively verified: 867/867
         such draws collapsed the Set and got redrawn away, bug 5). When
         that happens, swap in "double the gradient" instead — a real
         transcription slip, and 2m is never equal to a unit slope. */
      const dxDyEqual = Math.abs(dy) === Math.abs(dx);
      const reciprocal = dxDyEqual ? gradientStr(2 * dy, dx) : gradientStr(dx, dy);
      const reciprocalMisc = dxDyEqual
        ? B("That is double the true gradient — check Δy and Δx again, one at a time.",
            "Dit is dubbel die ware gradiënt — gaan Δy en Δx weer een vir een na.")
        : B("That is Δx over Δy — the gradient is the other way up: Δy OVER Δx.",
            "Dit is Δx oor Δy — die gradiënt is andersom: Δy OOR Δx.");
      /* the classic "used one point's raw coordinates as a slope"
         mistake — pick whichever of A/B has a non-zero x, so the
         decoy itself is never a divide-by-zero */
      const rawFromB = x2 !== 0;
      const rawX = rawFromB ? x2 : x1, rawY = rawFromB ? y2 : y1, rawWho = rawFromB ? "B" : "A";
      const rawPoint = gradientStr(rawY, rawX);
      const seen = new Set([correct, flipSign, reciprocal, rawPoint]);
      if (seen.size < 4) continue;                // a decoy collapsed onto another value — redraw
      const wrongs = [
        { label: flipSign,
          misc: B("The sign flipped — Δy is B's height MINUS A's, not the other way round.",
                  "Die teken het omgeswaai — Δy is B se hoogte MINUS A s'n, nie andersom nie.") },
        { label: reciprocal, misc: reciprocalMisc },
        { label: rawPoint,
          misc: B(`That uses ${rawWho}'s own coordinates on their own — the gradient needs the CHANGE from A to B.`,
                  `Dit gebruik net ${rawWho} se eie koördinate — die gradiënt het die VERANDERING van A na B nodig.`) },
      ];
      const built = iq({
        concept: "gradient", kind: "chordReveal", accent: ACC,
        prompt: B("A and B lie on f. Tap to draw the chord AB, then find its average gradient.",
                  "A en B lê op f. Klik om die koord AB te teken, en bepaal dan sy gemiddelde gradiënt."),
        stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
        coach: B("Tap the sketch to draw the line through A and B.", "Klik op die skets om die lyn deur A en B te teken."),
        build: (host, done) => chordReveal(host, { spec, curve: 0, pairs: [{ x1, x2, names: ["A", "B"] }], onTap: () => done() }),
        then: mc("gradient",
          B("What is the average gradient of AB?", "Wat is die gemiddelde gradiënt van AB?"), correct, wrongs,
          { hint: B("Average gradient = Δy over Δx — B's height minus A's, over B's x minus A's.",
                    "Gemiddelde gradiënt = Δy oor Δx — B se hoogte minus A s'n, oor B se x minus A s'n."),
            answerLabel: B(`m = ${correct}`, `m = ${correct}`) }),
      });
      built.debugGrad = { win: spec.win, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], dy, dx };
      return built;
    }
    throw new Error("qG gradNumber: no honest round survived the distinct-options check");
  },

  gradSign: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { cv, x1, x2, y1, y2, dy, dx, win } = niceGradientPair();
      const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
      if (!spec) continue;
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
           { label: B("you cannot tell without calculating", "jy kan nie sê sonder om uit te werk nie"),
             misc: B("You can! A chord that climbs from left to right has a positive gradient; one that falls has a negative one. Nothing to work out.",
                     "Jy kan! 'n Koord wat van links na regs styg, het 'n positiewe gradiënt; een wat daal, het 'n negatiewe een. Jy hoef niks uit te werk nie.") }],
          { hint: B("Follow the drawn chord with your eye, left to right — does it climb or fall?",
                    "Volg die geteken koord met jou oog, links na regs — styg of daal dit?"),
            answerLabel: correct }),
      });
      built.debugGrad = { win: spec.win, points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], dy, dx };
      return built;
    }
    throw new Error("qG gradSign: no honest round survived");
  },

  gradSteeper: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { cv, P, Q, win } = steeperPair();
      const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
      if (!spec) continue;
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
             misc: B("Look again — one of them climbs or falls much more sharply. They are not equally steep.",
                     "Kyk weer — een van hulle styg of daal baie skerper. Hulle is nie ewe steil nie.") },
           { label: B("you cannot tell without calculating", "jy kan nie sê sonder om uit te werk nie"),
             misc: B("You can! The steeper chord looks closer to vertical — your eyes can see which one wins.",
                     "Jy kan! Die steiler koord lyk nader aan vertikaal — jy kan sommer met jou oë sien watter een wen.") }],
          { hint: B("The steeper chord looks closer to vertical — see which one climbs or falls the sharpest.",
                    "Die steiler koord lyk nader aan vertikaal — kyk watter een klim of val die skerpste."),
            answerLabel: correct === "AB" ? B("AB is steeper", "AB is steiler") : B("CD is steeper", "CD is steiler") }),
      });
      built.debugGrad = {
        win: spec.win,
        points: [{ x: P.x1, y: P.y1 }, { x: P.x2, y: P.y2 }, { x: Q.x1, y: Q.y1 }, { x: Q.x2, y: Q.y2 }],
        mAB: P.m, mCD: Q.m,
      };
      return built;
    }
    throw new Error("qG gradSteeper: no honest round survived");
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
