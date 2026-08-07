/* ============================================================
   QUEST REGISTRY
   ------------------------------------------------------------
   Order matters: each quest is a tool for the next one. The map
   unlocks them in sequence.

   CONTENT.semicircles = false turns off every semicircle round in
   one place — that is the switch the blipwork mount flips, because
   the IEB Grade 11 syllabus does not include them.
   ============================================================ */
import { quest1, TECH } from "./q1-axis.js";
import { quest2 } from "./q2-point.js";
import { quest3 } from "./q3-curtain.js";
import { quest4 } from "./q4-climb.js";
import { quest5 } from "./q5-signs.js";
import { quest6 } from "./q6-sweep.js";
import { quest7, TECHOK, resetExam } from "./q7-exam.js";
import { CONTENT } from "./_graphs.js";
import { pick, shuffled } from "../ui.js";

export const QUESTS = [quest1, quest2, quest3, quest4, quest5, quest6, quest7];

/* flip semicircle content on/off everywhere */
export function setSemicircles(on) {
  CONTENT.semicircles = on;
  TECH.on = on;
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
