/* ============================================================
   QUEST 2 · THE POINT DROP — "P(5 ; k) lies on f"
   ------------------------------------------------------------
   The point is locked to one line and the learner drags it until
   it SNAPS onto the curve. That snap is the whole lesson: "lies on
   the graph" means the two coordinates fit the equation, so one
   coordinate buys you the other.

   Then the algebra: get the same number by substituting.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, UI } from "../i18n.js";
import { pointDrop } from "../engine/interactive.js";
import { specFor, randLine, randParabola, randHyperbola, randExp, windowFor } from "./_graphs.js";
import {
  makeFn, eqStr, C, ptStr, pick, randInt, isInt, numDecoys, circleEq,
} from "../funclib.js";

const ACC = "#7b5cff";

/* ---- a curve plus an (x ; y) on it, both whole numbers ---- */
function niceCurveAndPoint() {
  for (let tries = 0; tries < 200; tries++) {
    const kind = pick(["line", "parabola", "hyperbola", "exp", "parabola", "line"]);
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
    if (Math.abs(y) < 0.5) continue;                 // (x ; 0) is a giveaway, it's on the axis
    /* the dragged point P is an extra feature the window must also hold */
    if (!windowFor([cv], { include: [{ x, y }] })) continue;
    return { cv, x: Math.round(x), y: Math.round(y) };
  }
  const cv = { kind: "line", a: 2, q: 1 };
  return { cv, x: 3, y: 7 };
}

/* √n in simplest surd form, e.g. 20 → "2√5", 16 → "4" */
function simpSurd(n) {
  if (n < 0) return null;
  const r = Math.sqrt(n);
  if (isInt(r)) return C(Math.round(r));
  let out = 1, inn = n;
  for (let k = Math.floor(Math.sqrt(n)); k >= 2; k--) {
    if (inn % (k * k) === 0) { out = k; inn = inn / (k * k); break; }
  }
  return out === 1 ? `√${inn}` : `${C(out)}√${inn}`;
}

const SKILLS = {
  /* ---------- drag DOWN onto the curve, then name k ---------- */
  dropForY: () => {
    const { cv, x, y } = niceCurveAndPoint();
    const spec = specFor([cv], {
      accent: ACC, ticks: "labels", labels: ["f"],
      include: [{ x, y }],
    });
    const correct = C(y);
    const wrongs = numDecoys(y, [x, -y, y + 2]).map(C);
    return iq({
      concept: "pointOnGraph", kind: "pointDrop", accent: ACC, unlockMsg: UI.snapped,
      prompt: B(`P(${C(x)} ; k) lies on f. Drag P onto the graph.`,
                `P(${C(x)} ; k) lê op f. Drag P op die grafiek.`),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("It can only move up and down — P's x stays " + C(x) + ".",
               "Dit kan net op en af beweeg — P se x bly " + C(x) + "."),
      build: (host, done) => pointDrop(host, { spec, curve: 0, at: x, mode: "v", onSnap: () => done() }),
      then: mc("pointOnGraph",
        B("So what is k?", "So wat is k?"), correct, wrongs,
        { hint: B(`Substitute x = ${C(x)} into f(x) and work out the answer.`,
                  `Vervang x = ${C(x)} in f(x) en werk die antwoord uit.`),
          answerLabel: B(`k = ${correct}, so P is ${ptStr(x, y)}`, `k = ${correct}, dus is P ${ptStr(x, y)}`) }),
    });
  },

  /* ---------- drag SIDEWAYS onto the curve, then name k ---------- */
  dropForX: () => {
    const { cv, x, y } = niceCurveAndPoint();
    const spec = specFor([cv], {
      accent: ACC, ticks: "labels", labels: ["f"],
      include: [{ x, y }],
    });
    const correct = C(x);
    const wrongs = numDecoys(x, [y, -x]).map(C);
    return iq({
      concept: "pointOnGraph", kind: "pointDrop", accent: ACC, unlockMsg: UI.snapped,
      prompt: B(`P(k ; ${C(y)}) lies on f. Drag P onto the graph.`,
                `P(k ; ${C(y)}) lê op f. Drag P op die grafiek.`),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("This one slides sideways — P's y stays " + C(y) + ".",
               "Hierdie een gly sywaarts — P se y bly " + C(y) + "."),
      build: (host, done) => pointDrop(host, { spec, curve: 0, at: y, mode: "h", onSnap: () => done() }),
      then: mc("pointOnGraph",
        B("So what is k?", "So wat is k?"), correct, wrongs,
        { hint: B(`Let f(x) = ${C(y)} and solve for x.`, `Stel f(x) = ${C(y)} en los op vir x.`),
          answerLabel: B(`k = ${correct}, so P is ${ptStr(x, y)}`, `k = ${correct}, dus is P ${ptStr(x, y)}`) }),
    });
  },

  /* ---------- the algebra move, on its own ---------- */
  whichSub: () => {
    const { cv, x, y } = niceCurveAndPoint();
    const eq = eqStr(cv, "f(x)");
    /* the sketch shows P sitting on the curve with a dashed line down to
       the x-axis, so the learner SEES that x is the coordinate they were
       handed — this round used to be words only, which taught nothing
       about reading a graph */
    const spec = specFor([cv], {
      accent: ACC, ticks: "labels", labels: ["f"], include: [{ x, y }],
      points: [{ x, y, on: 0, dashTo: "x", label: `P(${C(x)} ; k)` }],
    });
    const correct = B(`Substitute x = ${C(x)} and work out f(${C(x)})`,
                      `Vervang x = ${C(x)} en werk f(${C(x)}) uit`);
    return mc("pointOnGraph",
      B(`P(${C(x)} ; k) lies on f. Which move gives you k?`,
        `P(${C(x)} ; k) lê op f. Watter stap gee vir jou k?`),
      correct,
      [{ label: B(`Substitute y = ${C(x)} and solve for x`, `Vervang y = ${C(x)} en los op vir x`),
         misc: B(`${C(x)} is in the FIRST position, so it is the x — not the y.`,
                 `${C(x)} staan in die EERSTE plek, so dit is die x — nie die y nie.`) },
       { label: B("Let f(x) = 0 and solve for x", "Stel f(x) = 0 en los op vir x"),
         misc: B("That finds the x-intercept, not a point sitting up on the curve.",
                 "Dit kry die x-afsnit, nie 'n punt wat bo-op die kurwe lê nie.") },
       B("Read the y-intercept off the graph", "Lees die y-afsnit van die grafiek af")],
      { graph: spec, stem: `<span class="eq">${eq}</span>`, wide: true,
        hints: [B("Follow the dashed line down: which coordinate of P did they already give you?",
                  "Volg die stippellyn af: watter koördinaat van P het hulle reeds gegee?"),
                B("They gave you the x. Put it in and see what comes out.",
                  "Hulle het die x gegee. Sit dit in en kyk wat uitkom.")],
        answerLabel: B(`k = f(${C(x)}) = ${C(y)}`, `k = f(${C(x)}) = ${C(y)}`) });
  },

  /* ---------- semicircle: the answer is a surd (her vb. 1.4) ---------- */
  semiSurd: () => {
    const r = pick([4, 5, 6]);                        // 7 does not fit the square-grid window
    const cv = { kind: "semicircle", r, up: true };
    const x = pick([-r + 1, -r + 2, r - 2, r - 1].filter((v) => Math.abs(v) < r && v !== 0));
    const inside = r * r - x * x;
    const y = Math.sqrt(inside);
    const correct = simpSurd(inside);
    const wrongs = [
      simpSurd(r * r + x * x),
      C(r - Math.abs(x)),
      `√${C(r * r)} − ${C(Math.abs(x))}`,
    ];
    const spec = specFor([cv], { accent: ACC, ticks: "labels", labels: ["h"], include: [{ x, y }] });
    if (!spec) return SKILLS.semiSurd();
    return iq({
      concept: "pointOnGraph", kind: "pointDrop", accent: ACC, unlockMsg: UI.snapped, techOnly: true,
      prompt: B(`P(${C(x)} ; k) lies on the semicircle h. Drag P onto the graph.`,
                `P(${C(x)} ; k) lê op die halfsirkel h. Drag P op die grafiek.`),
      stem: `<span class="eq">${circleEq(cv)}</span>`,
      coach: B("Straight up and down only.", "Net reguit op en af."),
      build: (host, done) => pointDrop(host, { spec, curve: 0, at: x, mode: "v", symbol: "k", onSnap: () => done() }),
      then: mc("pointOnGraph",
        B("The graph can only show ABOUT where k is. Give k exactly, in simplest surd form.",
          "Die grafiek kan net OMTRENT wys waar k is. Gee k presies, in vereenvoudigde wortelvorm."),
        correct, wrongs,
        { hint: B(`Substitute into x² + y² = ${C(r * r)}: y² = ${C(r * r)} − ${C(x * x)} = ${C(inside)}.`,
                  `Vervang in x² + y² = ${C(r * r)}: y² = ${C(r * r)} − ${C(x * x)} = ${C(inside)}.`),
          answerLabel: B(`k = ${correct}`, `k = ${correct}`) }),
    });
  },

  /* ---------- "the graph is the boss" (her vb. 2.4) ---------- */
  graphIsBoss: () => {
    const r = 5;
    const h = { kind: "semicircle", r, up: true };
    /* a point of the FULL circle whose mirror image is NOT on the upper half */
    const P = pick([{ x: 3, y: 4 }, { x: 4, y: 3 }, { x: -3, y: 4 }, { x: -4, y: 3 }]);
    const bad = { x: -P.x, y: -P.y };
    const spec = specFor([h], { accent: ACC, ticks: "labels", labels: ["h"] });
    const correct = B(`${ptStr(bad.x, bad.y)} — h is only the top half, so a negative y cannot lie on it`,
                      `${ptStr(bad.x, bad.y)} — h is net die boonste helfte, so 'n negatiewe y kan nie daarop lê nie`);
    return mc("graphIsBoss",
      B("Solving algebraically gives TWO answers. Which one must you throw away, and why?",
        "Algebraïes kry jy TWEE antwoorde. Watter een moet jy weggooi, en hoekom?"),
      correct,
      [B(`${ptStr(P.x, P.y)} — its x is too big`, `${ptStr(P.x, P.y)} — sy x is te groot`),
       B("Neither — both lie on h", "Nie een nie — albei lê op h"),
       B(`${ptStr(bad.x, bad.y)} — it is outside the domain`, `${ptStr(bad.x, bad.y)} — dit is buite die definisieversameling`)],
      { graph: spec, wide: true, techOnly: true,
        stem: B(`h is the semicircle below. Both ${ptStr(P.x, P.y)} and ${ptStr(bad.x, bad.y)} satisfy x² + y² = 25.`,
                `h is die halfsirkel hieronder. Beide ${ptStr(P.x, P.y)} en ${ptStr(bad.x, bad.y)} voldoen aan x² + y² = 25.`),
        hint: B("Look at the picture, not only at the algebra. Where does h actually go?",
                "Kyk na die prentjie, nie net na die algebra nie. Waar loop h werklik?"),
        answerLabel: correct });
  },
};

export const quest2 = quest("q2",
  B("On the graph", "Op die grafiek"),
  B("P(5 ; k) lies on f — find the partner", "P(5 ; k) lê op f — kry die maat"),
  [
    { id: "dropForY", concept: "pointOnGraph", gen: SKILLS.dropForY },
    { id: "dropForX", concept: "pointOnGraph", gen: SKILLS.dropForX },
    { id: "whichSub", concept: "pointOnGraph", gen: SKILLS.whichSub },
    { id: "semiSurd", concept: "pointOnGraph", gen: SKILLS.semiSurd, techOnly: true },
    { id: "graphIsBoss", concept: "graphIsBoss", gen: SKILLS.graphIsBoss, techOnly: true },
  ],
  { rounds: 6, accent: ACC });
