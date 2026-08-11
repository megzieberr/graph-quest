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
   A wrong option may be a plain label OR `{ label, misc }`, where `misc`
   is a targeted misconception nudge shown when THAT distractor is picked
   (Circle Quest's pattern — even learners who never tap a hint get the
   misconception addressed).
   Wrong options are de-duplicated by their RENDERED text in BOTH
   languages, so a collision can never show two identical buttons.
   Generators must still filter decoys by VALUE (blipwork bug #4:
   `1/2` and `0,5` are different strings but the same number).

   opts.hints    progressive hint ladder (array, one rung per tap;
                 rung 1 names the MOVE, never the answer)
   opts.solution worked-method lines shown in the feedback panel */
/* A maths expression may never wrap mid-way across two lines.
   Rather than remembering to wrap every generated string by hand, every
   option label and answer goes through here: anything that looks like an
   inequality, an interval or set notation gets a no-break .eq wrapper.
   Already-wrapped text and plain prose are left alone. */
const MATHY = /(&lt;|&gt;|[<>≤≥≠∈])/;
function eqWrap(v) {
  if (v == null) return v;
  if (typeof v === "object") {
    const out = {};
    for (const k in v) out[k] = eqWrap(v[k]);
    return out;
  }
  const s = String(v);
  if (!MATHY.test(s) || s.includes("class=\"eq\"") || s.includes("class='eq'")) return s;
  /* prose that merely mentions a symbol (a misconception nudge, a reason)
     must not be turned into one unbreakable line */
  if (s.replace(/<[^>]*>/g, "").trim().split(/\s+/).length > 8) return s;
  return `<span class="eq">${s}</span>`;
}

export function mc(concept, prompt, correct, wrongs, opts = {}) {
  correct = eqWrap(correct);
  wrongs = (wrongs || []).map((w) =>
    (w && typeof w === "object" && "label" in w) ? { ...w, label: eqWrap(w.label) } : eqWrap(w));
  if (opts.answerLabel) opts = { ...opts, answerLabel: eqWrap(opts.answerLabel) };
  const key = (v) => `${L(v)}||${typeof v === "object" ? (v.en || "") + "|" + (v.af || "") : v}`;
  const seen = new Set([key(correct)]);
  const uniq = [];
  for (const w of wrongs) {
    if (w == null) continue;
    const label = (w && typeof w === "object" && "label" in w) ? w.label : w;
    const misc = (w && typeof w === "object" && "label" in w) ? w.misc : null;
    if (label == null) continue;
    const k = key(label);
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push({ label, misc, correct: false });
    if (uniq.length >= 3) break;              // 4 buttons max — a phone screen
  }
  return {
    type: "mc", concept,
    prompt, stem: opts.stem,
    options: shuffled([{ label: correct, correct: true }, ...uniq]),
    answerLabel: opts.answerLabel || correct,
    hint: opts.hint,
    hints: opts.hints,
    solution: opts.solution,
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
    /* a quest may build a whole round in one go — exam mode does (one
       sketch, many sub-questions) and so does a lesson whose beats have
       to arrive in a fixed order (the discovery quest) */
    buildAll: opts.buildAll || null,
    /* …and only the exam kind promises that every item shares ONE sketch */
    oneSketch: !!opts.oneSketch,
  };
}
