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
import { quest7, TECHOK, resetExam } from "./q7-exam.js";
import { CONTENT } from "./_graphs.js";
import { pick, shuffled } from "../ui.js";

export const QUESTS = [
  questDiscover, questDiscover2, questRecognize, quest3,
  quest2, quest5, quest6, quest7,
];

/* flip semicircle content on/off everywhere */
export function setSemicircles(on) {
  CONTENT.semicircles = on;
  TECHOK.on = on;
  resetExam();
}

export const getQuest = (id) => QUESTS.find((q) => q.id === id);

/* build one round of questions for a quest, respecting the content flag
   and each skill's weight (a weight of 3 appears three times as often) */
export function buildRound(questId) {
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
