/* ============================================================
   QUEST L · LENGTHS — every length is a subtraction you can SEE
   ------------------------------------------------------------
   RUN-PLAN's "lengths" batch, reshaped to Law 1: no algebra, ever.
   Three sub-skills, all read straight off the picture:

     1. vertical PQ between two graphs at a given x — top minus
        bottom, the shape that appears in every paper (P on f, Q
        on g)
     2. horizontal AB between two points on ONE curve that share
        a y-value (a parabola's two symmetric points)
     3. a point on a curve to the x-axis (|y|) or the y-axis (|x|)

   Deliberately OUT of scope (Law 1 — needs a turning point of a
   difference function, i.e. algebra): "maximum length of PQ".
   Never add it here.

   The house pattern: the learner taps to REVEAL the two marked
   spots and the segment joining them (lengthReveal, engine/
   interactive.js) — nothing is computed for them — then reads the
   length off the grid in the follow-up mc(). funclib's
   lengthBetween() does the actual subtraction for the answer key.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { lengthReveal } from "../engine/interactive.js";
import {
  specFor, randLine, randParabola, randHyperbolaOffAxis, randExp, windowFor,
} from "./_graphs.js";
import {
  makeFn, eqStr, C, pick, randInt, isInt, shuffled, paraTP, lengthBetween,
} from "../funclib.js";

const ACC = "#facc15";

/* true when neither of two rendered numerals is a SUBSTRING of the
   other — a plain "===" is not enough, because "−4" (the stated x, say)
   contains "4" (the computed length) as a literal substring, and a
   prompt that states "x = −4" right next to an answer of "4" reads as
   a spoiler even though −4 ≠ 4 as numbers (Law 7: a prompt never
   contains its own answer). Guards every stated-value/answer pair in
   this quest's generators. */
function noNumeralOverlap(a, b) {
  const sa = C(a), sb = C(b);
  return !sa.includes(sb) && !sb.includes(sa);
}

/* ------------------------------------------------------------
   1. VERTICAL PQ — P on f, Q on g, both at the same x
   ------------------------------------------------------------ */
function niceVerticalPair() {
  for (let tries = 0; tries < 300; tries++) {
    const kind = pick(["paraLine", "paraLine", "lineLine", "hypLine"]);
    let f, g;
    if (kind === "lineLine") {
      const a1 = pick([1, -1, 2, -2]);
      let a2 = pick([1, -1, 2, -2]);
      if (a2 === a1) a2 = -a1;
      f = { kind: "line", a: a1, q: randInt(-4, 4) };
      g = { kind: "line", a: a2, q: randInt(-4, 4) };
    } else if (kind === "hypLine") {
      f = randHyperbolaOffAxis();
      g = { kind: "line", a: pick([1, -1]), q: randInt(-3, 3) };
    } else {
      f = randParabola();
      g = { kind: "line", a: pick([1, -1, 2, -2, 0]), q: randInt(-4, 4) };
    }
    const win = windowFor([f, g]);
    if (!win) continue;
    const lo = Math.ceil(win.xmin) + 1, hi = Math.floor(win.xmax) - 1;
    if (hi < lo) continue;
    const xs = []; for (let x = lo; x <= hi; x++) xs.push(x);
    for (const x of shuffled(xs)) {
      if (f.kind === "hyperbola" && Math.abs(x - f.p) < 0.6) continue;
      const yF = makeFn(f)(x), yG = makeFn(g)(x);
      if (!Number.isFinite(yF) || !Number.isFinite(yG)) continue;
      if (!isInt(yF) || !isInt(yG)) continue;
      const correct = lengthBetween(yF, yG);
      if (correct < 1.5 || correct > 9) continue;              // too short to be worth reading, or too big for the grid
      if (!noNumeralOverlap(x, correct)) continue;              // never let the tapped x's numeral double as the answer's
      const win2 = windowFor([f, g], { include: [{ x, y: yF }, { x, y: yG }] });
      if (!win2) continue;
      if (yF < win2.ymin + 0.4 || yF > win2.ymax - 0.4) continue;
      if (yG < win2.ymin + 0.4 || yG > win2.ymax - 0.4) continue;
      return { f, g, x, yF, yG, win: win2 };
    }
  }
  const f = { kind: "line", a: 1, q: 0 }, g = { kind: "line", a: -1, q: 4 };
  return { f, g, x: 1, yF: 1, yG: 3, win: windowFor([f, g], { include: [{ x: 1, y: 1 }, { x: 1, y: 3 }] }) };
}

/* ------------------------------------------------------------
   2. HORIZONTAL AB — two points on ONE curve sharing a y-value
   ------------------------------------------------------------ */
function niceHorizontalPair() {
  for (let tries = 0; tries < 300; tries++) {
    const cv = randParabola();
    const tp = paraTP(cv);
    if (!isInt(tp.x)) continue;
    const d = pick([1, 2, 3]);
    const xA = tp.x - d, xB = tp.x + d;
    const y = makeFn(cv)(xA);
    if (!Number.isFinite(y) || !isInt(y)) continue;
    const correct = lengthBetween(xA, xB);
    if (!noNumeralOverlap(y, correct)) continue;                 // never let the stated height's numeral double as AB's
    const win = windowFor([cv], { include: [{ x: xA, y }, { x: xB, y }] });
    if (!win) continue;
    if (xA < win.xmin + 0.4 || xB > win.xmax - 0.4) continue;
    if (y < win.ymin + 0.4 || y > win.ymax - 0.4) continue;
    return { cv, xA, xB, y, win };
  }
  /* p = 1, not 0: with tp.x = 0 the symmetric pair xA = −xB always makes
     the "half the width" decoy (correct/2 = xB − tp.x) collide with xB
     itself — lenHorizontal's own distinct-options check then failed on
     EVERY visit to this fallback (bug 3). p = 1 breaks that symmetry:
     xA = −1, xB = 3, correct = 4, correct/2 = 2, xB = 3, |y| = 0 — four
     distinct values, checked by hand and in the scratch harness. */
  const cv = { kind: "parabola", a: 1, p: 1, q: -4 };
  return { cv, xA: -1, xB: 3, y: 0, win: windowFor([cv], { include: [{ x: -1, y: 0 }, { x: 3, y: 0 }] }) };
}

/* ------------------------------------------------------------
   3. POINT → AXIS — |y| to the x-axis, |x| to the y-axis
   ------------------------------------------------------------ */
function nicePointOnCurve(monotonicOnly) {
  for (let tries = 0; tries < 200; tries++) {
    const kind = monotonicOnly ? pick(["line", "exp"]) : pick(["line", "parabola", "hyperbola", "exp"]);
    let cv, x;
    if (kind === "line") { cv = randLine(); x = randInt(-4, 4); }
    else if (kind === "parabola") { cv = randParabola(); x = randInt(-3, 4); }
    else if (kind === "hyperbola") {
      cv = randHyperbolaOffAxis();
      const d = pick([1, -1, 2, -2].filter((v) => isInt(cv.a / v)));
      if (d == null) continue;
      x = cv.p + d;
    } else { cv = randExp(); x = randInt(0, 2); }
    const y = makeFn(cv)(x);
    if (!Number.isFinite(y) || !isInt(y)) continue;
    /* single-digit magnitudes only, and the two coordinates must never
       share a magnitude — otherwise the coordinate STATED in the prompt
       could double as the OTHER coordinate's numeral (a real spoiler:
       Law 7 bans a prompt that contains its own answer) */
    if (Math.abs(x) < 1 || Math.abs(x) > 9 || Math.abs(y) < 1 || Math.abs(y) > 9) continue;
    if (Math.abs(x) === Math.abs(y)) continue;
    if (!windowFor([cv], { include: [{ x, y }] })) continue;
    return { cv, x: Math.round(x), y: Math.round(y) };
  }
  return { cv: { kind: "line", a: 1, q: 2 }, x: 3, y: 5 };
}

/* ------------------------------------------------------------
   the skills
   ------------------------------------------------------------ */
const SKILLS = {
  lenVertical: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { f, g, x, yF, yG, win } = niceVerticalPair();
      const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
      if (!spec) continue;
      const correct = lengthBetween(yF, yG);
      /* the "wrong way round" decoy is the SIGNED subtraction yF − yG — but
         that is exactly `correct` whenever P sits above Q (yF > yG), so the
         Set collapsed and every yF > yG round got redrawn away (measured:
         400/400 shipped rounds had P below Q). −correct is the signed
         subtraction done the wrong way round EITHER way P and Q sit, and —
         since correct ≥ 1.5 by construction — can never equal it. */
      const raw = new Set([correct, -correct, yF, Math.abs(yF) + Math.abs(yG)]);
      if (raw.size < 4) continue;               // a decoy collapsed onto another value — redraw
      const wrongs = [
        { label: C(-correct),
          misc: B("A length can never be negative — you subtracted the two heights the wrong way round.",
                  "'n Lengte kan nooit negatief wees nie — jy het die twee hoogtes andersom afgetrek.") },
        { label: C(yF),
          misc: B("That is only P's height — you still have to subtract Q's.",
                  "Dis net P se hoogte — jy moet Q s'n nog aftrek.") },
        { label: C(Math.abs(yF) + Math.abs(yG)),
          misc: B("PQ is the DIFFERENCE between the two heights, not their sum.",
                  "PQ is die VERSKIL tussen die twee hoogtes, nie hulle som nie.") },
      ];
      const built = iq({
        concept: "length", kind: "lengthReveal", accent: ACC,
        prompt: B(`P lies on f and Q lies on g, both at x = ${C(x)}. Tap to reveal them, then find the length of PQ.`,
                  `P lê op f en Q lê op g, altwee by x = ${C(x)}. Klik om hulle te wys, en bepaal dan die lengte van PQ.`),
        stem: `<span class="eq">f(x) = ${eqStr(f, "").replace(/^\s*=\s*/, "")}</span> &nbsp;·&nbsp; <span class="eq">g(x) = ${eqStr(g, "").replace(/^\s*=\s*/, "")}</span>`,
        coach: B(`Tap x = ${C(x)} on the sketch.`, `Klik op x = ${C(x)} op die skets.`),
        build: (host, done) => lengthReveal(host, { spec, mode: "v", curveA: 0, curveB: 1, at: x, onTap: () => done() }),
        then: mc("length", B("What is the length of PQ?", "Wat is die lengte van PQ?"), C(correct), wrongs,
          { hint: B("Read both heights off the grid and subtract — top minus bottom.",
                    "Lees albei hoogtes van die rooster af en trek af: boonste minus onderste."),
            answerLabel: C(correct) }),
      });
      built.debugLen = { win: spec.win, points: [{ x, y: yF }, { x, y: yG }], correct, diff: "y" };
      return built;
    }
    throw new Error("qL lenVertical: no honest round survived the distinct-options check");
  },

  lenHorizontal: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { cv, xA, xB, y, win } = niceHorizontalPair();
      const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
      if (!spec) continue;
      const correct = lengthBetween(xA, xB);
      const raw = new Set([correct, correct / 2, xB, Math.abs(y)]);
      if (raw.size < 4) continue;
      const wrongs = [
        { label: C(correct / 2),
          misc: B("That is only half of it — AB stretches the whole way from A to B.",
                  "Dis net die helfte — AB strek die hele ent van A tot by B.") },
        { label: C(xB),
          misc: B("That is only B's x-coordinate — the length is the GAP between A and B.",
                  "Dis net B se x-koördinaat — die lengte is die GAPING tussen A en B.") },
        { label: C(y),
          misc: B("That is the height where A and B both lie, not the gap between their x-values.",
                  "Dis die hoogte waar A en B albei lê, nie die gaping tussen hulle x-waardes nie.") },
      ];
      const built = iq({
        concept: "length", kind: "lengthReveal", accent: ACC,
        prompt: B(`A and B lie on f, both at y = ${C(y)}. Tap to reveal them, then find the length of AB.`,
                  `A en B lê op f, altwee by y = ${C(y)}. Klik om hulle te wys, en bepaal dan die lengte van AB.`),
        stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
        coach: B(`Tap the height y = ${C(y)} on the sketch.`, `Klik op die hoogte y = ${C(y)} op die skets.`),
        build: (host, done) => lengthReveal(host, { spec, mode: "h", y, xA, xB, onTap: () => done() }),
        then: mc("length", B("What is the length of AB?", "Wat is die lengte van AB?"), C(correct), wrongs,
          { hint: B("Read A's and B's x-values off the grid and subtract — right minus left.",
                    "Lees A en B se x-waardes van die rooster af en trek af: regs minus links."),
            answerLabel: C(correct) }),
      });
      built.debugLen = { win: spec.win, points: [{ x: xA, y }, { x: xB, y }], correct, diff: "x" };
      return built;
    }
    throw new Error("qL lenHorizontal: no honest round survived the distinct-options check");
  },

  lenToX: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { cv, x, y } = nicePointOnCurve(false);
      const spec = specFor([cv], { accent: ACC, ticks: "labels", labels: ["f"], include: [{ x, y }] });
      if (!spec) continue;
      const correct = Math.abs(y);
      /* the "drop the sign" decoy used the SIGNED y itself — but a positive
         y is already equal to `correct`, so every positive-coordinate draw
         collapsed the Set and got redrawn away (measured: 400/400 shipped
         rounds had P below the x-axis). −correct is a distinct stand-in
         for "wrote the length with a minus sign" either way P sits, and —
         since correct ≥ 1 by construction — can never equal it. */
      const raw = new Set([correct, -correct, Math.abs(x), correct + 1]);
      if (raw.size < 4) continue;
      const wrongs = [
        { label: C(-correct), misc: B("A length is never negative — drop the minus sign.", "'n Lengte is nooit negatief nie — los die minusteken.") },
        { label: C(Math.abs(x)),
          misc: B("That is P's x-coordinate, not its height above or below the x-axis.",
                  "Dis P se x-koördinaat, nie sy hoogte bo of onder die x-as nie.") },
        C(correct + 1),
      ];
      const built = iq({
        concept: "length", kind: "lengthReveal", accent: ACC,
        prompt: B(`P lies on f at x = ${C(x)}. Tap to reveal it, then see how far it is from the x-axis.`,
                  `P lê op f by x = ${C(x)}. Klik om dit te wys, en kyk dan hoe ver dit van die x-as af is.`),
        stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
        coach: B(`Tap x = ${C(x)} on the sketch.`, `Klik op x = ${C(x)} op die skets.`),
        build: (host, done) => lengthReveal(host, { spec, mode: "axis", point: { x, y }, to: "x", onTap: () => done() }),
        then: mc("length", B("How far is P from the x-axis?", "Hoe ver is P van die x-as af?"), C(correct), wrongs,
          { hint: B("Count the grid squares from P straight down (or up) to the x-axis.",
                    "Tel die roosterblokkies van P reguit af (of op) tot by die x-as."),
            answerLabel: C(correct) }),
      });
      built.debugLen = { win: spec.win, points: [{ x, y }], correct, diff: "y0", kind: cv.kind };
      return built;
    }
    throw new Error("qL lenToX: no honest round survived the distinct-options check");
  },

  lenToY: () => {
    for (let tries = 0; tries < 30; tries++) {
      const { cv, x, y } = nicePointOnCurve(true);
      const spec = specFor([cv], { accent: ACC, ticks: "labels", labels: ["f"], include: [{ x, y }] });
      if (!spec) continue;
      const correct = Math.abs(x);
      /* same bug as lenToX: the signed x collapses onto `correct` whenever
         x is positive. −correct is the distinct stand-in — see lenToX. */
      const raw = new Set([correct, -correct, Math.abs(y), correct + 1]);
      if (raw.size < 4) continue;
      const wrongs = [
        { label: C(-correct), misc: B("A length is never negative — drop the minus sign.", "'n Lengte is nooit negatief nie — los die minusteken.") },
        { label: C(Math.abs(y)),
          misc: B("That is P's y-coordinate, not its distance from the y-axis.",
                  "Dis P se y-koördinaat, nie sy afstand van die y-as nie.") },
        C(correct + 1),
      ];
      const built = iq({
        concept: "length", kind: "lengthReveal", accent: ACC,
        prompt: B(`P lies on f at y = ${C(y)}. Tap to reveal it, then see how far it is from the y-axis.`,
                  `P lê op f by y = ${C(y)}. Klik om dit te wys, en kyk dan hoe ver dit van die y-as af is.`),
        stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
        coach: B(`Tap the height y = ${C(y)} on the sketch.`, `Klik op die hoogte y = ${C(y)} op die skets.`),
        build: (host, done) => lengthReveal(host, { spec, mode: "axis", point: { x, y }, to: "y", onTap: () => done() }),
        then: mc("length", B("How far is P from the y-axis?", "Hoe ver is P van die y-as af?"), C(correct), wrongs,
          { hint: B("Count the grid squares from P straight across to the y-axis.",
                    "Tel die roosterblokkies van P reguit oor tot by die y-as."),
            answerLabel: C(correct) }),
      });
      built.debugLen = { win: spec.win, points: [{ x, y }], correct, diff: "x0", kind: cv.kind };
      return built;
    }
    throw new Error("qL lenToY: no honest round survived the distinct-options check");
  },
};

export const questLengths = quest("qL",
  B("Lengths", "Lengtes"),
  B("Every length is a subtraction you can see", "Elke lengte is 'n aftrekking wat jy kan sien"),
  [
    { id: "lenVertical", concept: "length", gen: SKILLS.lenVertical, weight: 2 },
    { id: "lenHorizontal", concept: "length", gen: SKILLS.lenHorizontal },
    { id: "lenToX", concept: "length", gen: SKILLS.lenToX },
    { id: "lenToY", concept: "length", gen: SKILLS.lenToY },
  ],
  { rounds: 6, accent: ACC });

/* ---------------- the intro lesson ----------------
   The new mechanic (lengthReveal) taps to reveal, rather than drags —
   three short beats, one per flavour, all in her vb. 6 pair so the
   sketch is already familiar from quest 6. */
{
  /* p = 1, not 0: with p = 0 the vertical asymptote is drawn straight down
     the y-axis and cannot be seen (foreman review fix, 2026-08-12).
     a = 2, not 8: the OLD a = 8 hyperbola's own y-intercept is a = 8/(0-1)+q
     = −7 — a computed IDENTITY FEATURE windowFor() must always frame, not
     an optional extra — so the required window height blew straight past
     MAX_PXU's [20,45] px/unit clamp: windowFor() returned null, specFor()'s
     null fallback propagated, and renderIntro() crashed reading `.w` off a
     null spec the moment Lengtes was opened (bug 1, found 2026-08-13).
     a = 2 keeps the y-intercept at −1, so the natural window (no `include`
     needed) already frames both curves at 36 px/unit — verified by hand
     and in the scratch harness before shipping. */
  const f = { kind: "hyperbola", a: 2, p: 1, q: 1 };
  const g0 = { kind: "line", a: 1, q: -1 };
  const win = windowFor([f, g0]);
  const base = specFor([f, g0], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
  questLengths.intro = { beats: [
    { spec: base, cap: B("This quest is about LENGTHS — and every one of them is just a subtraction of two numbers you can already see.",
                         "Hierdie soektog gaan oor LENGTES — en elkeen is net 'n aftrekking van twee getalle wat jy klaar kan sien.") },
    { spec: base, cap: B("Tap the sketch to reveal the two marked points and the segment joining them — nothing is computed for you.",
                         "Klik op die skets om die twee gemerkte punte en die lyn tussen hulle te wys — niks word vir jou uitgewerk nie.") },
    { spec: base, cap: B("Then read each point's height (or position) off the grid, and subtract: top minus bottom, or right minus left.",
                         "Lees dan elke punt se hoogte (of posisie) van die rooster af, en trek af: boonste minus onderste, of regs minus links.") },
  ] };
}
