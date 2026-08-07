/* ============================================================
   BUILDING THE WRITTEN ANSWER
   ------------------------------------------------------------
   Turning "these sections" into "x < −1 or 2 ≤ x < 5" — always
   left to right, and honouring the rule that trips everyone up:

     a vertical asymptote is NEVER included, even in a ≤ question.

   `strict` says whether the inequality itself is strict (> vs ≥).
   A boundary is closed only when the inequality is non-strict AND
   the boundary is a genuine zero/edge rather than an asymptote.
   ============================================================ */
import { mergeSections, intervalStr, joinIntervals, C } from "../funclib.js";

/* find the cut sitting at x (within tolerance) */
function cutAt(cuts, x) {
  return cuts.find((c) => Math.abs(c.x - x) < 1e-6) || null;
}

/* selected sections → the answer string */
export function answerString(selected, cuts, win, opts = {}) {
  const { strict = true, lang = "af" } = opts;
  if (!selected.length) return lang === "en" ? "no values of x" : "geen waardes van x nie";
  const merged = mergeSections(selected);
  const parts = merged.map((iv) => {
    const cl = cutAt(cuts, iv.x0), cr = cutAt(cuts, iv.x1);
    const openL = strict || !cl || cl.why === "asym";
    const openR = strict || !cr || cr.why === "asym";
    return intervalStr(iv, win, openL, openR);
  });
  return joinIntervals(parts, lang);
}

/* a wrong-but-tempting alternative: the sections they did NOT pick */
export function complementString(selected, all, cuts, win, opts = {}) {
  const chosen = new Set(selected.map((s) => s.i));
  const other = all.filter((s) => !chosen.has(s.i) && s.usable !== false);
  return answerString(other, cuts, win, opts);
}

/* the same intervals written with the wrong strictness — the classic
   "he included the asymptote" error */
export function flipStrictString(selected, cuts, win, opts = {}) {
  return answerString(selected, cuts, win, { ...opts, strict: !opts.strict });
}

/* the same numbers, but answered in y instead of x */
export function asYString(s) { return String(s).replace(/\bx\b/g, "y"); }

/* drop one piece — "he forgot the second interval" */
export function missingPieceString(selected, cuts, win, opts = {}) {
  if (selected.length < 2) return null;
  return answerString(selected.slice(0, -1), cuts, win, opts);
}

export { C };
