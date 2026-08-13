/* ============================================================
   QUEST T · TRANSFORMASIES — see the move, then name it   ★ batch 2
   ------------------------------------------------------------
   Working name (Megan's to change). RUN-PLAN's "transformations"
   batch, reshaped to Law 1: no algebra, ever. The equation NEVER
   gets expanded or simplified — it always stays in the shape it
   started in (TP-form parabola, a/(x−p)+q hyperbola, a·bˣ⁻ᵖ+q exp).

   Four round ideas, seeing-rounds outnumbering the equation round:

     1. nameMove      (weight 3) f drawn faint/dashed, its image
                       solid on the SAME sketch. "Wat het met f
                       gebeur?" → 3 op / 3 af / 3 links / 3 regs.
     2. reflection     (weight 2) same faint/solid pair, but the
                       image is a REFLECTION. y = −f(x) vs y = f(−x)
                       — the pair everyone mixes up.
     3. pickEquation   (weight 2) f's equation + a stated move
                       ("skuif 2 op") → choose g(x) from four, all
                       written in the SAME form as f. No graph: this
                       round is about the move, not the picture.
     4. slideMatch     (weight 1) the one hands-on round. Reuses
                       engine/slider.js: a faint target sits still,
                       the learner slides a number until the solid
                       image lands on it exactly, THEN names the
                       move they just made. Hand first, name second.

   Every number that ever appears is p or q moving by a whole-number
   k — nothing is ever solved for. The only "maths" funclib does
   here is add/subtract a whole number to p or q, exactly what the
   learner is asked to SEE.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { varSlider } from "../engine/slider.js";
import {
  specFor, windowFor, randParabola, randHyperbolaOffAxis, randExp, randLine, asymOnAxis,
} from "./_graphs.js";
import {
  eqStr, eqTPStr, EQ, C, pick, paraTP, paraStd, makeFn,
} from "../funclib.js";

const ACC = "#4ade80";
const FAMILIES = ["parabola", "hyperbola", "exp"];
const DIRS = ["up", "down", "left", "right"];

/* verify's own honesty rule (§4b, never relaxed): at least a THIRD of a
   drawn curve's sampled x-range must actually land inside the window. A
   window sized to hold two curves' IDENTITY features can still leave one
   of them mostly cropped when the pair sit far apart — checked here so a
   bad draw is caught and redrawn before it ever reaches the learner. */
function mostlyInFrame(cv, win) {
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

/* ------------------------------------------------------------
   base curves, always kept in the SAME shape the round displays:
   parabola in TP-form {a,p,q} (never standard form — the bracket
   itself is what a shift moves), hyperbola/exp already carry p,q.
   ------------------------------------------------------------ */
function baseParabola() {
  const cv = randParabola();                       // whole-number TP, guaranteed by randParabola()
  const tp = paraTP(cv), { a } = paraStd(cv);
  return { kind: "parabola", a, p: tp.x, q: tp.y };
}
function baseParabolaOffCenter() {
  for (let i = 0; i < 30; i++) {
    const b = baseParabola();
    if (b.p !== 0) return b;
  }
  return { kind: "parabola", a: 1, p: 2, q: -3 };
}
function baseHyperbola() { return randHyperbolaOffAxis(); }
function baseExp() { return randExp(); }
function baseLineOffAxis() {
  for (let i = 0; i < 30; i++) {
    const cv = randLine();
    if (cv.q !== 0) return cv;
  }
  return { kind: "line", a: 1, q: 2 };
}
const FAMILY_BUILD = { parabola: baseParabola, hyperbola: baseHyperbola, exp: baseExp };

function eqStrFor(family, cv, name) {
  return family === "parabola" ? eqTPStr(cv, name) : eqStr(cv, name);
}

/* ------------------------------------------------------------
   the move: dp/dq applied to p/q — the only "computation" this
   quest ever does, and it is exactly what the learner is asked
   to read off the picture, never asked to produce themselves.
   ------------------------------------------------------------ */
function shifted(cv, dp, dq) {
  return { ...cv, p: (cv.p || 0) + dp, q: (cv.q || 0) + dq };
}
function deltaFor(dir, k) {
  if (dir === "up") return { dp: 0, dq: k };
  if (dir === "down") return { dp: 0, dq: -k };
  if (dir === "right") return { dp: k, dq: 0 };
  return { dp: -k, dq: 0 };                         // left
}
const axisWord = (dir) => ((dir === "up" || dir === "down") ? "q" : "p");
function moveLabel(dir, k) {
  const n = C(k);
  return {
    up: B(`${n} up`, `${n} op`), down: B(`${n} down`, `${n} af`),
    left: B(`${n} left`, `${n} links`), right: B(`${n} right`, `${n} regs`),
  }[dir];
}
function moveSentence(dir, k) {
  const n = C(k);
  return {
    up: B(`f moved ${n} up.`, `f het ${n} op geskuif.`),
    down: B(`f moved ${n} down.`, `f het ${n} af geskuif.`),
    left: B(`f moved ${n} left.`, `f het ${n} links geskuif.`),
    right: B(`f moved ${n} right.`, `f het ${n} regs geskuif.`),
  }[dir];
}
function moveInstr(dir, k) {
  const n = C(k);
  return {
    up: B(`Shift ${n} up.`, `Skuif ${n} op.`),
    down: B(`Shift ${n} down.`, `Skuif ${n} af.`),
    left: B(`Shift ${n} left.`, `Skuif ${n} links.`),
    right: B(`Shift ${n} right.`, `Skuif ${n} regs.`),
  }[dir];
}
function moveNudge(actualDir, wrongDir) {
  const sameAxis = (actualDir === "up" || actualDir === "down") === (wrongDir === "up" || wrongDir === "down");
  return sameAxis
    ? B("Look again — right axis, wrong direction.",
        "Kyk weer — dis die regte as, maar die verkeerde rigting.")
    : B("Wrong axis — look again: did the x change, or the y?",
        "Dis die verkeerde as — kyk weer: het die x verander, of die y?");
}
function combine(a, b) {
  return {
    en: `${typeof a === "string" ? a : a.en} ${typeof b === "string" ? b : b.en}`,
    af: `${typeof a === "string" ? a : a.af} ${typeof b === "string" ? b : b.af}`,
  };
}

/* ============================================================
   1. NAME THE MOVE — f faint/dashed, its image solid, one sketch
   ============================================================ */
function nameMoveRound() {
  for (let tries = 0; tries < 60; tries++) {
    const family = pick(FAMILIES);
    const base = FAMILY_BUILD[family]();
    const dir = pick(DIRS);
    const k = pick([1, 2, 3]);
    const { dp, dq } = deltaFor(dir, k);
    const image = shifted(base, dp, dq);
    /* ⚠ a horizontal shift moves the vertical asymptote too — check the
       SHIFTED curve, not only the original (this bit twice already) */
    if ((family === "hyperbola" || family === "exp") && (asymOnAxis(base) || asymOnAxis(image))) continue;
    const win = windowFor([base, image]);
    if (!win) continue;
    if (!mostlyInFrame(base, win) || !mostlyInFrame(image, win)) continue;
    /* specFor() assigns tone by POSITION (first → a, second → b) unless
       `tones:` is passed — pass it explicitly so the faint/dashed original
       is never accidentally recoloured by a future reorder of this array */
    const spec = specFor([
      { ...base, dash: true, faint: true },
      { ...image },
    ], { win, accent: ACC, ticks: "labels", tones: ["b", "a"] });
    if (!spec) continue;

    const correct = moveLabel(dir, k);
    const wrongs = DIRS.filter((d) => d !== dir).map((d) => ({ label: moveLabel(d, k), misc: moveNudge(dir, d) }));

    const built = mc("transform",
      B("What happened to f?", "Wat het met f gebeur?"),
      correct, wrongs,
      {
        graph: spec,
        stem: B("Dashed = f (before). Solid = the image (after).",
                /* "voor"/"na" read as place words in Afrikaans (in front of /
                   next to), so the before/after labels stay English — her
                   correction, 2026-08-13. "Vol lyn" → "soliede lyn", same day. */
                "Stippellyn = f (before). Soliede lyn = die beeld (after)."),
        /* "sywaarts" is one of the words Megan replaced in her wording pass
           (2026-08-12): it becomes "links of regs". */
        hints: [B("Compare where it sits now with where it was — did it move left or right, or up or down?",
                  "Vergelyk waar dit nou sit met waar dit was — het dit links of regs geskuif, of op of af?")],
        solution: [moveSentence(dir, k)],
        answerLabel: correct,
      });
    built.debugTransform = { kind: "nameMove", family, base, image, dp, dq, dir, k, win };
    return built;
  }
  throw new Error("qT nameMove: no honest window fits any draw");
}

/* ============================================================
   2. REFLECTIONS — y = −f(x) vs y = f(−x), the pair she flagged
   ============================================================ */
function reflectX(cv, family) {                      // y = −f(x)
  if (family === "line") return { kind: "line", a: -cv.a, q: -cv.q };
  return { kind: family, a: -cv.a, p: cv.p, q: -cv.q };
}
function reflectY(cv, family) {                       // y = f(−x)
  if (family === "line") return { kind: "line", a: -cv.a, q: cv.q };
  if (family === "parabola") return { kind: "parabola", a: cv.a, p: -cv.p, q: cv.q };
  return { kind: "hyperbola", a: -cv.a, p: -cv.p, q: cv.q };
}
function reflectionRound() {
  for (let tries = 0; tries < 60; tries++) {
    const family = pick(["parabola", "hyperbola", "line"]);
    const base = family === "parabola" ? baseParabolaOffCenter()
      : family === "hyperbola" ? baseHyperbola() : baseLineOffAxis();
    const axis = pick(["x", "y"]);
    const image = axis === "x" ? reflectX(base, family) : reflectY(base, family);
    if (family === "hyperbola" && (asymOnAxis(base) || asymOnAxis(image))) continue;
    const win = windowFor([base, image]);
    if (!win) continue;
    if (!mostlyInFrame(base, win) || !mostlyInFrame(image, win)) continue;
    /* specFor() assigns tone by POSITION (first → a, second → b) unless
       `tones:` is passed — pass it explicitly so the faint/dashed original
       is never accidentally recoloured by a future reorder of this array */
    const spec = specFor([
      { ...base, dash: true, faint: true },
      { ...image },
    ], { win, accent: ACC, ticks: "labels", tones: ["b", "a"] });
    if (!spec) continue;

    const asX = B("y = −f(x) — flipped over the x-axis", "y = −f(x) — gereflekteer oor die x-as");
    const asY = B("y = f(−x) — flipped over the y-axis", "y = f(−x) — gereflekteer oor die y-as");
    const correct = axis === "x" ? asX : asY;
    const other = axis === "x" ? asY : asX;

    const built = mc("transform",
      B("f is dashed. Which reflection is the solid graph?", "f is die stippellyn. Watter refleksie is die soliede lyn?"),
      correct,
      [
        { label: other,
          misc: B("Keep the two reflections apart: −f(x) turns the graph upside-down; f(−x) swaps left and right. Which one happened here?",
                  "Hou die twee refleksies uitmekaar: −f(x) draai die grafiek onderstebo; f(−x) ruil links en regs om. Watter een het hier gebeur?") },
        { label: B("f was shifted, not reflected", "f is geskuif, nie gereflekteer nie"),
          misc: B("With a shift the graph keeps facing the same way — this one is reflected, not shifted.",
                  "By 'n skuif bly die grafiek dieselfde kant toe wys — hierdie een is gereflekteer, nie geskuif nie.") },
        { label: B("this is the same graph as f, just redrawn", "dis dieselfde grafiek as f, net weer geteken"),
          misc: B("Look again — the solid graph does not sit on top of the dashed one.",
                  "Kyk weer — die soliede grafiek lê nie bo-op die stippellyn nie.") },
      ],
      {
        graph: spec, wide: true,
        stem: B("Dashed = f. Solid = the reflected image.", "Stippellyn = f. Soliede lyn = die gereflekteerde beeld."),
        hints: [
          family === "hyperbola"
            ? B("Look at which two corners the branches sit in — did they swap corners, or did they only slide across?",
                "Kyk in watter twee hoeke die vlerkies lê — het hulle omgeruil, of het hulle net geskuif?")
            : family === "parabola"
            ? B("Look which way the arms point — is the graph upside-down, or did only the turning point's x change?",
                "Kyk watter kant toe die arms wys — is die grafiek onderstebo, of het net die draaipunt se x verander?")
            : B("Compare the line's direction, and where it crosses the y-axis.",
                "Vergelyk die lyn se rigting, en waar dit die y-as sny."),
        ],
        solution: [correct],
        answerLabel: correct,
      });
    built.debugTransform = { kind: "reflection", family, base, image, axis, win };
    return built;
  }
  throw new Error("qT reflection: no honest window fits any draw");
}

/* ============================================================
   3. PICK THE EQUATION — see f, given a stated move, choose g(x)
   ------------------------------------------------------------
   Every round in this app carries a picture (verify's house rule,
   never relaxed — qB's speed round is the one deliberate exception
   and this is not that). f is drawn plain; the round is still about
   the move and the letters, not about reading a number off the
   picture — the picture is there so f is never just words. */
function eqNudge(kind) {
  if (kind === "axis") return B("Wrong letter — that is not the one this move changes.",
                                 "Verkeerde letter — dis nie die een wat hierdie skuif verander nie.");
  if (kind === "sign") return B("Right letter, wrong sign.", "Regte letter, verkeerde teken.");
  return B("Wrong letter, and the wrong sign too.", "Verkeerde letter, en ook die verkeerde teken.");
}
function pickEquationRound() {
  for (let tries = 0; tries < 60; tries++) {
    const family = pick(FAMILIES);
    const base = FAMILY_BUILD[family]();
    const dir = pick(DIRS);
    const k = pick([1, 2, 3]);
    const { dp, dq } = deltaFor(dir, k);
    const variants = {
      correct: shifted(base, dp, dq),
      axisWrong: shifted(base, dq, dp),               // the move applied to the OTHER letter
      bothWrong: shifted(base, -dq, -dp),              // other letter, and the wrong sign
      signWrong: shifted(base, -dp, -dq),              // right letter, wrong sign
    };
    /* dedupe on the FLATTENED text (tags stripped), not the raw markup — a
       hyperbola's frac() has no separator between numerator and denominator
       once tags are gone, so e.g. frac(2,"x+2") and frac(2,"x")+"+2" both
       read "2x+2" in plain text even though the fractions are genuinely
       different curves. Two options that would ever look the same once
       stripped are a real duplicate for this check's purposes, so redraw. */
    const strs = {}; const seen = new Set(); let collide = false;
    for (const key in variants) {
      const raw = EQ(eqStrFor(family, variants[key], "g(x)"));
      const flat = raw.replace(/<[^>]*>/g, "");
      if (seen.has(flat)) { collide = true; break; }
      seen.add(flat); strs[key] = raw;
    }
    if (collide) continue;
    const win = windowFor([base]);
    if (!win) continue;
    const spec = specFor([{ ...base }], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;

    const axis = axisWord(dir);
    const sign = (dp < 0 || dq < 0) ? "−" : "+";
    const built = mc("transform",
      combine(moveInstr(dir, k), B("What is g(x)?", "Wat is g(x)?")),
      strs.correct,
      [
        { label: strs.axisWrong, misc: eqNudge("axis") },
        { label: strs.bothWrong, misc: eqNudge("both") },
        { label: strs.signWrong, misc: eqNudge("sign") },
      ],
      {
        graph: spec,
        stem: EQ(eqStrFor(family, base, "f(x)")),
        hints: [
          B("Which letter gets changed by this move — p or q?", "Watter letter word deur hierdie skuif verander — p of q?"),
          B("Up or right is a PLUS on that letter; down or left is a MINUS.",
            "Op of regs is 'n PLUS by daardie letter; af of links is 'n MINUS."),
        ],
        solution: [
          B("p moves the graph left/right. q moves it up/down.", "p skuif die grafiek links/regs. q skuif dit op/af."),
          B(`This move changes ${axis} by ${sign}${C(k)}.`, `Hierdie skuif verander ${axis} met ${sign}${C(k)}.`),
        ],
        answerLabel: strs.correct,
      });
    built.debugTransform = { kind: "pickEquation", family, base, dir, k, dp, dq, correctCv: variants.correct, win };
    return built;
  }
  throw new Error("qT pickEquation: could not build a distinct-options round");
}

/* ============================================================
   4. SLIDE TO MATCH — the one hands-on round, session 2's slider
   ------------------------------------------------------------
   A faint TARGET sits still. The learner drags a single number
   until the solid image lands on it exactly — hand first — then
   names the move they just made — name second.
   ============================================================ */
function slideToMatchBeat() {
  for (let tries = 0; tries < 60; tries++) {
    const family = pick(FAMILIES);
    const base = FAMILY_BUILD[family]();
    const axis = pick(["p", "q"]);
    const dir = axis === "q" ? pick(["up", "down"]) : pick(["left", "right"]);
    const k = pick([1, 2, 3]);
    const { dp, dq } = deltaFor(dir, k);
    const targetVal = (base[axis] || 0) + (axis === "p" ? dp : dq);

    const lo = Math.min(base[axis], targetVal) - 1, hi = Math.max(base[axis], targetVal) + 1;
    const values = []; for (let v = lo; v <= hi; v++) values.push(v);
    const startIdx = values.indexOf(base[axis]), targetIdx = values.indexOf(targetVal);
    if (startIdx < 0 || targetIdx < 0 || startIdx === targetIdx) continue;

    const movingCv = (v) => ({ ...base, [axis]: v });
    const target = movingCv(targetVal);                // the frozen faint reference
    /* only the FROZEN curve must never sit on an axis — the moving one is
       allowed to cross it mid-drag, exactly like a dragged discovery slider */
    if ((family === "hyperbola" || family === "exp") && asymOnAxis(target)) continue;

    const win = windowFor([target, ...values.map(movingCv)]);
    if (!win) continue;
    /* every curve the slider can ever show must stay mostly on screen —
       not just the union of identity features that sized the window */
    if (!values.every((v) => mostlyInFrame(movingCv(v), win)) || !mostlyInFrame(target, win)) continue;
    const specOf = (v) => specFor([
      { ...target, dash: true, faint: true },
      { ...movingCv(v) },
    ], { win, accent: ACC, ticks: "labels", tones: ["b", "a"] });
    if (!specOf(values[startIdx])) continue;

    const wrongs = DIRS.filter((d) => d !== dir).map((d) => ({ label: moveLabel(d, k), misc: moveNudge(dir, d) }));

    const built = iq({
      concept: "transform", kind: "slideMatch", accent: ACC,
      prompt: B("Slide the number until the solid graph lies exactly on the dashed target.",
                "Skuif die getal totdat die soliede grafiek presies op die stippellyn-teiken lê."),
      stem: EQ(eqStrFor(family, base, "f(x)")),
      coach: B("Drag until the two graphs lie exactly on top of each other.", "Trek totdat die twee grafieke presies op mekaar lê."),
      hints: [B("Watch the marked point of the solid graph — is it on the dashed one's yet?",
                "Kyk na die gemerkte punt van die soliede grafiek — lê dit al op die stippellyn s'n?")],
      build: (host, done) => varSlider(host, {
        name: axis, values, specOf, start: startIdx,
        onChange: ({ value }) => { if (value === targetVal) done(); },
      }),
      then: mc("transform",
        B("What move did you just make?", "Watter skuif het jy nou net gemaak?"),
        moveLabel(dir, k), wrongs,
        { solution: [moveSentence(dir, k)], answerLabel: moveLabel(dir, k) }),
    });
    built.debugTransform = {
      kind: "slideMatch", family, base, target, axis, dir, k, targetVal, startIdx, targetIdx, values, win,
    };
    return built;
  }
  throw new Error("qT slideMatch: no honest window fits any draw");
}

export const questTransform = quest("qT",
  B("Transformations", "Transformasies"),
  B("See the move, then name it", "Sien die skuif, noem dit dan"),
  [
    { id: "nameMove", concept: "transform", gen: nameMoveRound, weight: 3 },
    { id: "reflection", concept: "transform", gen: reflectionRound, weight: 2 },
    { id: "pickEquation", concept: "transform", gen: pickEquationRound, weight: 2 },
    { id: "slideMatch", concept: "transform", gen: slideToMatchBeat, weight: 1 },
  ],
  { rounds: 6, accent: ACC });

/* ---------------- the intro lesson ----------------
   Dashed vs solid, in one worked example: f shifted 2 up. No
   finding beyond "this is what a move looks like" is ever stated
   here — the quest's own rounds are where the learner commits. */
{
  const base = { kind: "parabola", a: 1, p: -1, q: -2 };
  const image = shifted(base, 0, 3);
  const win = windowFor([base, image]);
  const bothSpec = specFor([
    { ...base, dash: true, faint: true },
    { ...image },
  ], { win, accent: ACC, ticks: "labels", tones: ["b", "a"] });
  const onlyBase = specFor([{ ...base }], { win, accent: ACC, ticks: "labels", tones: ["b"] });
  questTransform.intro = { beats: [
    { spec: onlyBase, cap: B("This is f. Every round in this quest starts from a picture like this.",
                              "Dis f. Elke rondte in hierdie soektog begin met so 'n prent.") },
    { spec: bothSpec, cap: B("Now its IMAGE appears solid, while f stays dashed and faint — the before and after, on one sketch.",
                              "Nou verskyn sy beeld as solied en f word 'n vaal stippellyn. Dit is die before en after op een skets.") },
    { spec: bothSpec, cap: B("The equation never gets expanded or simplified — it always stays in the same shape. Your job is to SEE the move.",
                              "Die vergelyking word nooit uitgebrei of vereenvoudig nie — dit bly altyd in dieselfde vorm. Jou taak is om die skuif te SIEN.") },
  ] };
}
