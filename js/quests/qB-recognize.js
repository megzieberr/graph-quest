/* ============================================================
   QUEST B · VINNIGE OË — equation-only instant recognition   ★ session 3
   ------------------------------------------------------------
   Round B from RUN-PLAN session 3. An equation flashes — NO graph,
   NO picture, speed-round format — and asks for one feature read
   straight off the numbers:

     "Waar is die horisontale asimptoot?"   / "Where is the horizontal asymptote?"
     "Waar is die vertikale asimptoot?"     / "Where is the vertical asymptote?"
     "Wat is die simmetrie-as?"             / "What is the axis of symmetry?"

   Answered by chip: "y = −2", "x = 1", or the first-class option
   "None" / "Geen" ("dis 'n parabool — geen asimptoot nie").

   Axis of symmetry is asked ONLY on a parabola, and ONLY read from
   turning-point form (x = p) — Megan's confirmed ruling. Every
   number comes straight off the curve object below; nothing here
   is ever solved for (Law 1).

   Which (family, feature) pairs exist is a closed, deterministic
   table (see FEATURE_TABLE below) — a line and a parabola never
   have an asymptote, a hyperbola always has both, an exponential
   has a horizontal one only. verify.html §7 checks this table
   holds for every generated round.
   ============================================================ */
import { mc, quest } from "./_shared.js";
import { B } from "../i18n.js";
import {
  eqStr, eqTPStr, C, paraTP, pick, randInt,
} from "../funclib.js";

const ACC = "#ff8a3d";
const NONE = B("None", "Geen");

/* ---------------- random curves for this round ----------------
   No window-fit constraints apply (nothing is drawn) — these just
   need to read cleanly as whole numbers. Parabolas are always built
   in TP-form so p is a number sitting right there, never derived. */
function randLineB() {
  return { kind: "line", a: pick([-3, -2, -1, 0, 1, 2, 3]), q: randInt(-4, 4) };
}
function randParabolaB() {
  return { kind: "parabola", a: pick([1, -1, 2, -2]), p: randInt(-4, 4), q: randInt(-4, 4) };
}
function randHyperbolaB() {
  return { kind: "hyperbola", a: pick([1, -1, 2, -2, 3, -3, 4, -4]), p: randInt(-4, 4), q: randInt(-4, 4) };
}
function randExpB() {
  return { kind: "exp", a: pick([1, -1, 2, -2, 3]), b: pick([2, 3, 0.5]), p: 0, q: randInt(-4, 4) };
}
const BUILDERS = { line: randLineB, parabola: randParabolaB, hyperbola: randHyperbolaB, exp: randExpB };

/* the closed table: which (family, feature) pairs are ever asked,
   and — deterministically — whether the answer is a value or "geen" */
const POOL = { line: ["hAsym", "vAsym"], parabola: ["hAsym", "vAsym", "axisSym"],
               hyperbola: ["hAsym", "vAsym"], exp: ["hAsym", "vAsym"] };
export const HAS_FEATURE = {
  line: { hAsym: false, vAsym: false },
  parabola: { hAsym: false, vAsym: false, axisSym: true },
  hyperbola: { hAsym: true, vAsym: true },
  exp: { hAsym: true, vAsym: false },
};

const PROMPTS = {
  hAsym: B("Where is the horizontal asymptote?", "Waar is die horisontale asimptoot?"),
  vAsym: B("Where is the vertical asymptote?", "Waar is die vertikale asimptoot?"),
  axisSym: B("What is the axis of symmetry?", "Wat is die simmetrie-as?"),
};
const FEAT_NAME = {
  hAsym: B("horizontal asymptote", "horisontale asimptoot"),
  vAsym: B("vertical asymptote", "vertikale asimptoot"),
  axisSym: B("axis of symmetry", "simmetrie-as"),
};
const FAM_NAME = {
  line: B("straight line", "reguit lyn"),
  parabola: B("parabola", "parabool"),
  hyperbola: B("hyperbola", "hiperbool"),
  exp: B("exponential graph", "eksponensiële grafiek"),
};
const HINTS = {
  hAsym: B("Only a hyperbola or an exponential graph has a horizontal asymptote.",
           "Net 'n hiperbool of 'n eksponensiële grafiek het 'n horisontale asimptoot."),
  vAsym: B("Only a hyperbola has a vertical asymptote.",
           "Net 'n hiperbool het 'n vertikale asimptoot."),
  axisSym: B("The axis of symmetry only applies to a parabola, read from the bracket form a(x − p)² + q.",
             "Die simmetrie-as geld net vir 'n parabool, gelees uit die hakie-vorm a(x − p)² + q."),
};

const chipY = (v) => `<span class="eq">y = ${C(v)}</span>`;
const chipX = (v) => `<span class="eq">x = ${C(v)}</span>`;

function eqOfFamily(family, cv) {
  return `<span class="eq">${family === "parabola" ? eqTPStr(cv, "f(x)") : eqStr(cv, "f(x)")}</span>`;
}

/* the answer + its decoys, all computed off the curve object.
   Decoys are the classic swaps: the axis flipped (x for y or back),
   the sign flipped, and p confused for q (or vice versa). */
function answerFor(family, feature, cv) {
  if (family === "line") {
    if (feature === "hAsym") return { correct: NONE, decoys: [chipY(cv.q), chipY(-cv.q), chipX(cv.q)] };
    if (feature === "vAsym") {
      const xi = cv.a === 0 ? null : -cv.q / cv.a;
      const decoys = [chipY(cv.q), chipX(-cv.q)];
      if (Number.isFinite(xi)) decoys.push(chipX(xi));
      return { correct: NONE, decoys };
    }
  }
  if (family === "parabola") {
    const tp = paraTP(cv);
    if (feature === "hAsym") return { correct: NONE, decoys: [chipY(tp.y), chipY(-tp.y), chipX(cv.p)] };
    if (feature === "vAsym") return { correct: NONE, decoys: [chipX(cv.p), chipY(cv.q), chipX(-cv.p)] };
    if (feature === "axisSym") return { correct: chipX(cv.p), decoys: [chipX(-cv.p), chipY(cv.p), chipX(cv.q)] };
  }
  if (family === "hyperbola") {
    if (feature === "hAsym") return { correct: chipY(cv.q), decoys: [chipX(cv.q), chipY(-cv.q), chipY(cv.p)] };
    if (feature === "vAsym") return { correct: chipX(cv.p), decoys: [chipY(cv.p), chipX(-cv.p), chipX(cv.q)] };
  }
  if (family === "exp") {
    if (feature === "hAsym") return { correct: chipY(cv.q), decoys: [chipX(cv.q), chipY(-cv.q), chipY(cv.a)] };
    if (feature === "vAsym") return { correct: NONE, decoys: [chipY(cv.q), chipX(cv.q), chipX(cv.a)] };
  }
  return null;
}

function methodFor(family, feature, ans) {
  const fam = FAM_NAME[family], feat = FEAT_NAME[feature];
  if (ans.correct === NONE) {
    return [B(`This is a ${fam.en} — it has no ${feat.en}.`, `Dis 'n ${fam.af} — dit het geen ${feat.af} nie.`)];
  }
  return [B(`This is a ${fam.en}. Its ${feat.en} is ${ans.correct}.`,
            `Dis 'n ${fam.af}. Sy ${feat.af} is ${ans.correct}.`)];
}

/* one round: pick a family, then a feature that family is actually
   allowed to be asked about (POOL), build a curve, compute the
   answer from it, and hand back a plain mc() round with no graph. */
function genOne() {
  const family = pick(["line", "parabola", "hyperbola", "exp"]);
  const feature = pick(POOL[family]);
  const cv = BUILDERS[family]();
  const ans = answerFor(family, feature, cv);
  if (!ans) return null;
  const correctStr = ans.correct === NONE ? "NONE" : ans.correct;
  const decoys = ans.decoys.filter((d) => d !== correctStr);
  return mc("recognize", PROMPTS[feature], ans.correct, decoys, {
    stem: eqOfFamily(family, cv),
    hints: [HINTS[feature]],
    solution: methodFor(family, feature, ans),
  });
}
function genRound() {
  for (let k = 0; k < 20; k++) {
    const it = genOne();
    if (it) return it;
  }
  throw new Error("qB: could not build a round");
}

export const questRecognize = quest("qB",
  B("Quick Eyes", "Vinnige Oë"),
  B("Flash — name the asymptote or symmetry axis, no picture", "Flits — noem die asimptoot of simmetrie-as, geen prent nie"),
  [{ id: "recognize", concept: "recognize", gen: genRound }],
  { rounds: 10, accent: ACC });
