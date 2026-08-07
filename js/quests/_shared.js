/* ============================================================
   QUEST AUTHORING HELPERS
   ------------------------------------------------------------
   Two question shapes:

     mc(...)  a normal multiple-choice round (may carry a picture)
     iq(...)  an INTERACTIVE round: the learner does the physical
              thing first, and only then does the question unlock

   Every learner-facing string is bilingual — pass B("en","af")
   (or a plain string for maths that reads the same either way).
   ============================================================ */
import { shuffled } from "../ui.js";
import { L } from "../i18n.js";

/* Multiple choice.
   Wrong options are de-duplicated by their RENDERED text in BOTH
   languages, so a collision can never show two identical buttons.
   Generators must still filter decoys by VALUE (blipwork bug #4:
   `1/2` and `0,5` are different strings but the same number). */
export function mc(concept, prompt, correct, wrongs, opts = {}) {
  const key = (v) => `${L(v)}||${typeof v === "object" ? v.en + "|" + v.af : v}`;
  const seen = new Set([key(correct)]);
  const uniq = [];
  for (const w of wrongs) {
    if (w == null) continue;
    const k = key(w);
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push({ label: w, correct: false });
    if (uniq.length >= 3) break;              // 4 buttons max — a phone screen
  }
  return {
    type: "mc", concept,
    prompt, stem: opts.stem,
    options: shuffled([{ label: correct, correct: true }, ...uniq]),
    answerLabel: opts.answerLabel || correct,
    hint: opts.hint,
    graph: opts.graph,
    graphCap: opts.graphCap,
    wide: opts.wide,
  };
}

/* An interactive round.
   cfg = { concept, kind, prompt, coach, build(host, done), then }
     build()  mounts the mechanic; call done() when the physical
              part is complete (that reveals `then`)
     then     an mc() question — or null for "the doing IS the round" */
export function iq(cfg) {
  return { type: "interactive", ...cfg };
}

/* a quest = an id, a title, and a list of skill generators */
export function quest(id, title, blurb, skills, opts = {}) {
  return {
    id, title, blurb, skills,
    rounds: opts.rounds || 6,
    techOnly: !!opts.techOnly,
    accent: opts.accent,
    /* a quest may build a whole round in one go (exam mode does, so that
       one round is one sketch rather than a shuffle of loose questions) */
    buildAll: opts.buildAll || null,
  };
}
