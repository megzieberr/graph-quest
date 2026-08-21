/* ============================================================
   QUEST REGISTRY
   ------------------------------------------------------------
   Order matters: each quest is a tool for the next one. The map
   unlocks them in sequence.

   CONTENT.semicircles = false turns off every semicircle round in
   one place — that is the switch the blipwork mount flips, because
   the IEB Grade 11 syllabus does not include them.
   ============================================================ */
/* q1's slot holds session 2's discovery sliders. */
import { questDiscover } from "./q1-discover.js";
/* session 3: the second discovery sheet (line/hyperbola/exp) and Round B
   (equation-only recognition) slot in right after the parabola discovery
   quest. */
import { questDiscover2 } from "./q1b-discover2.js";
import { questRecognize } from "./qB-recognize.js";
/* session 4: Round C (basic region reading) replaces v1's q3-curtain.js
   AND q4-climb.js in one slot — both retired, files deleted. The old
   q1-axis.js is also retired this session: its TECH content flag had no
   remaining reader once its own quest content (superseded back in
   session 2) was the last thing to use it, so it is simply gone rather
   than moved — CONTENT.semicircles (below) is the one remaining
   semicircle switch, and every skill that needs it already gates on
   `techOnly` generically in buildRound(). */
import { quest3 } from "./q3-region.js";
import { quest2 } from "./q2-point.js";
import { quest5 } from "./q5-signs.js";
/* session 5: Round D (f above/below g) replaces v1's q6-sweep.js — the
   cut lines are now pre-drawn by the game, the learner stamps + and −
   between the two curves, then sweeps a scan line to confirm by eye. */
import { quest6 } from "./q6-compare.js";
/* batch 2, session 1: two new reading quests slot in AFTER quest6 (Bo of
   onder) and BEFORE quest7 (Eksamenmodus) — exam mode stays last (NOTE:
   today it still deals only its three fixed batch-1 sheets — the rebuild
   that samples every earlier skill is parked, see PROJECT-STATUS). Working names, hers to rename:
   "Lengtes" (lengths — every length is a subtraction you can see) and
   "Gemiddelde gradiënt" (average gradient — the gradient of the chord). */
import { questLengths } from "./qL-lengths.js";
import { questGradient } from "./qG-gradient.js";
/* batch 2, session 2: transformations slots in AFTER questGradient and
   BEFORE quest7 (Eksamenmodus) — exam mode samples everything that exists
   before it, so it stays last. Working name "Transformasies", hers to
   rename: see, then name, the move that turned f into its image. */
import { questTransform } from "./qT-transform.js";
/* batch 3, session 1: "Vind die vergelyking" slots in AFTER questTransform and
   BEFORE quest7 (Eksamenmodus) — exam mode samples everything that exists
   before it, so it stays last. Working name "Vind die vergelyking", hers to
   rename: which form fits the sketch, then tap the marked feature to fill it. */
import { questEquation } from "./qE-equation.js";
/* batch 3, session 2: "Aard van wortels" slots in AFTER questEquation and
   BEFORE quest7 (Eksamenmodus) — exam mode samples everything that exists
   before it, so it stays last. y = k only (her kickoff answer,
   2026-08-21) — the g + k sliding-tangent variant needs the discriminant,
   which is algebra, Law 1, and stays out. */
import { questRoots } from "./qK-roots.js";
/* batch 3, session 3: "Ongelykhede 2" slots in AFTER questRoots and
   BEFORE quest7 (Eksamenmodus) — exam mode samples everything that
   exists before it, so it stays last. x·f(x) quadrant signs, f/g with
   the open circle, and endpoint discipline (which boundaries close). */
import { questInequal2 } from "./qI-inequal2.js";
import { quest7, TECHOK, resetExam } from "./q7-exam.js";
import { CONTENT } from "./_graphs.js";
import { pick, shuffled } from "../ui.js";

/* Megan's ruling 2026-08-12 (after playing batch 1): "Op die grafiek" (quest2 —
   drop a point ONTO a curve) comes BEFORE "Lees die gebied" (quest3 — read
   regions OFF a curve). She places a point on a graph before she reads one.
   The map unlocks strictly in this array's order, so this array IS the order. */
export const QUESTS = [
  questDiscover, questDiscover2, questRecognize, quest2,
  quest3, quest5, quest6, questLengths, questGradient, questTransform, questEquation, questRoots,
  questInequal2, quest7,
];

/* flip semicircle content on/off everywhere */
export function setSemicircles(on) {
  CONTENT.semicircles = on;
  TECHOK.on = on;
  resetExam();
}

export const getQuest = (id) => QUESTS.find((q) => q.id === id);

/* call a skill's generator, retrying a few times on a thrown/failed draw
   (every generator already retries hard internally — ~60 tries — before
   ever throwing, so this is belt-and-braces, not the real safety net) */
function tryGen(s, tries = 10) {
  for (let i = 0; i < tries; i++) {
    let built = null;
    try { built = s.gen(); } catch { built = null; }
    if (built) return built;
  }
  return null;
}

/* the qE dealing ruling (her 2026-08-21): one round of EVERY usable skill
   kind, in a random order, then the remaining slots from the normal
   weighted bag — never the same skill immediately next to itself, the
   same spread rule the plain draw below already keeps. */
function buildCoverageRound(q, usable, bag) {
  const required = shuffled(usable.slice());
  const out = [];
  required.forEach((s) => {
    const built = tryGen(s);
    if (!built) return;                    // a generator that can never draw is a bug elsewhere, not here
    built.skillId = s.id;
    built.concept = built.concept || s.concept;
    out.push(built);
  });
  let guard = 0;
  while (out.length < q.rounds && guard++ < 400) {
    const lastId = out.length ? out[out.length - 1].skillId : null;
    const choices = bag.filter((s) => s.id !== lastId);
    const s = pick(choices.length ? choices : bag);
    const built = tryGen(s, 5);
    if (!built) continue;
    built.skillId = s.id;
    built.concept = built.concept || s.concept;
    out.push(built);
  }
  return out;
}

/* build one round of questions for a quest, respecting the content flag
   and each skill's weight (a weight of 3 appears three times as often).

   `metState` = { skillId: true, … } — which of this quest's skill kinds
   the learner has already MET (a round of it was actually presented in
   play, not merely dealt into a list — see play.js's render()). Only
   consulted for a quest that opts into dealEachKindFirst (qE); every
   other quest ignores the second argument entirely, so its dealing is
   byte-for-byte unchanged. Omitting metState (or passing {}) means
   "nothing met yet" — the safe default for a fresh profile. */
export function buildRound(questId, metState) {
  const q = getQuest(questId);
  if (!q) return [];
  if (q.buildAll) {
    const all = q.buildAll();
    all.forEach((it) => { it.concept = it.concept || "exam"; });
    return all;
  }
  const usable = q.skills.filter((s) => !s.techOnly || CONTENT.semicircles);
  const bag = [];
  usable.forEach((s) => { for (let i = 0; i < (s.weight || 1); i++) bag.push(s); });

  if (q.dealEachKindFirst) {
    const met = metState || {};
    const allMet = usable.every((s) => met[s.id]);
    if (!allMet) return buildCoverageRound(q, usable, bag);
  }

  const out = [];
  let guard = 0;
  /* spread the skills: never the same skill twice in a row if we can help it */
  let lastId = null;
  while (out.length < q.rounds && guard++ < 400) {
    const choices = bag.filter((s) => s.id !== lastId);
    const s = pick(choices.length ? choices : bag);
    let built = null;
    try { built = s.gen(); } catch { built = null; }
    if (!built) continue;
    built.skillId = s.id;
    built.concept = built.concept || s.concept;
    out.push(built);
    lastId = s.id;
  }
  return out;
}

export { shuffled };
