# Fun Functions — batch 3 design (2026-08-14, Fable design pass)

Status: **DESIGN ONLY — nothing here is built or approved yet.**
Read with RUN-PLAN.md (the LAW still applies to every session) and
reference/GR11-FUNCTIONS-NOTES-DIGEST.md (her notes are the canon).

Batch 3 = the last four skill quests plus the exam-mode rebuild:

1. Vind die vergelyking (finding equations from sketches)
2. Aard van wortels (nature of roots — the y = k slider)
3. Ongelykhede 2 (x·f(x) quadrant signs, f/g with the open circle, ≤/≥ discipline)
4. Soek die fout (error-spotting)
5. Eksamenmodus REBUILD — last, once every skill exists for it to sample
   (this also fixes sheetHypLine's hard-coded p = 0, the on-axis asymptote
   learners can see in exam mode today)

Map order (unlocks stay grandfathered, her 2026-08-13 ruling):
… Transformasies → Vind die vergelyking → Aard van wortels → Ongelykhede 2 →
Soek die fout → Eksamenmodus.

Working names are placeholders — hers to change, same deal as batch 2.

---

## Quest: Vind die vergelyking

**What it trains (digest p25–37, the notes' biggest block):** a learner looks
at a sketch and knows WHICH form fits and WHERE its numbers sit. The solve-for-a
step stays in their books (Law 1) — the game owns "wat gee die skets vir jou?".

Round types:

- **R1 — Kies die vorm.** Sketch with marked features (two x-ints; or a marked
  TP; or a dashed asymptote cross). "Watter vorm pas by hierdie skets?" Options:
  y = a(x − x₁)(x − x₂) · y = a(x − p)² + q · y = ax² + bx + c (and the
  hyperbola/exp forms in their families). The right answer is the form whose
  slots the sketch FILLS — marked x-ints point at intercept form, a marked TP at
  hakie-vorm. Decoys are the other true forms (they fit the curve, but not what
  the sketch hands you) — the misconception nudge explains exactly that.
- **R2 — Tap die waardes in.** The chosen form shows with empty slots
  (p ▢, q ▢ / x₁ ▢, x₂ ▢). One slot glows at a time; the learner TAPS the
  feature on the sketch that fills it (tap the TP → p and q pour in, hakie shows
  the opposite sign happening live). Pure reading, no computing. Needs one small
  new mechanic: `formFill()` in engine/interactive.js (tap-a-marked-feature →
  value lands in a slot). Everything it marks is already computed in funclib.
- **R3 — Watter vergelyking pas?** Four COMPLETE equations, all in the SAME form
  (qT's rule: the round is about the reading, never about rearranging). Decoys
  by value: p-sign flipped (the hakie trap), q ↔ c confusion, x-ints swapped in
  sign, a-sign flipped (happy/sad). Sign of a is asked as happy/sad reading —
  never solved.
- Hyperbola: asymptote cross → p and q; corners → sign of a.
  Exponential: asymptote → q; above/below → sign of a; opstyg/land → b > 1 or
  0 < b < 1 as chips. No a = y-int − q computation round (that is solving; if
  Megan wants it under the "very basic algebra" amendment, say so at kickoff).

Verify: every R2 slot value equals funclib's value for the drawn curve; R3's
correct equation re-renders to the drawn curve and NO decoy does (render-and-
compare by value, the qT pattern); banned-word list applies.

## Quest: Aard van wortels

**What it trains (digest p52–58):** how many times y = k cuts the graph, and
that the tangent is "die kiss" at the TP.

Round types (all reuse `varSlider` — no new mechanic):

- **R1 — discovery beat.** Parabola drawn; the learner drags a k-slider and a
  horizontal line y = k rides up and down, live snypunte marked. No-spoilers:
  they drag first, then commit — "Wat het jy gesien?" → 2 snye bo die
  draaipunt · 1 raakpunt op die draaipunt · 0 onder (for a happy parabola;
  mirrored wording for sad).
- **R2 — die kiss.** "Vir watter k raak y = k die grafiek net-net?" Keypad. The
  answer is the TP's y, read straight off the marked sketch — reading, not Δ.
- **R3 — hoeveel snypunte.** "Vir watter waardes van k sny y = k die grafiek
  TWEE keer?" Chips: k > q / k < q (matching happy/sad). Decoys: flipped
  inequality, p instead of q (x of the TP — the classic).
- **R4 — the other families, pure seeing.** Hyperbola: y = k cuts EXACTLY once
  for every k except k = q (nothing at the asymptote) — a lovely eye-opener
  round. Exponential: y = k cuts once only on the curve's side of the asymptote
  (above/below vocabulary, Law 5).
- NOT in scope: the sliding-line g + k tangent case — finding THAT k needs Δ,
  which is algebra (Law 1). Flagged for Megan rather than smuggled in.

Verify: intersection count at every slider stop equals funclib's count; the
kiss k equals the TP's y; hyperbola never intersects at k = q, exactly one
intersection otherwise (30-round sample).

## Quest: Ongelykhede 2

**What it trains (digest p46–51):** the two inequality variants quest 5/6 do
not cover, on her full board method — and the learner now places EVERY cut line
themselves (RUN-PLAN kickoff (b): the sockets return).

Round types (reuses cutSockets + signPaint + sweep — no new engine):

- **R1 — x·f(x), quadrant signs (Law 5).** The learner must place a cut line
  at x = 0 too (the y-axis is a boundary of x's own sign — a socket sits there,
  and forgetting it is THE teaching moment). Paint x's sign per section (links
  −, regs +), paint f's sign, read the product off the two rows of marks —
  same compare-by-eye as quest 6, never a computed third row (Law 4).
- **R2 — f/g with the open circle.** Same painting as f·g, one difference: at
  g's root the answer NEVER closes. Options differ only in < vs ≤ at that one
  x; the open circle is drawn on the sketch after a wrong pick (scaffold-on-
  error, Law 6). Nudge: "Deel deur nul mag nie — daardie x bly oop."
- **R3 — ≤/≥ endpoint discipline.** Mixed rounds where the ONLY decision left
  is which endpoints close: x-ints close under ≤/≥, asymptotes and g-roots
  never. Extends quest 6's existing nudge into its own trained skill.

Verify: group-23-style independent sign recomputation via signAt/sections;
a socket at 0 required for every x·f(x) round; no option list where the correct
interval closes an asymptote endpoint; open-circle scaffold hidden by default.

## Quest: Soek die fout

**What it trains (RUN-PLAN parked list):** exam-marking eyes — does this sketch
match this equation?

Round type (one shape, many reps):

- Sketch + equation shown together. "Pas hulle?" Ja / Nee.
  - Generator takes a TRUE pair and, in ~2 of 3 rounds, injects exactly ONE
    fault from a menu: p-sign flip (hakie), q ↔ c, asymptote values swapped
    between x and y, a-sign flip (happy/sad, above/below), b opstyg/land flip.
  - On "Nee" a follow-up asks WHY, from ≤4 feature-naming options ("die hakie
    se teken", "die asimptoot se y", "happy/sad is omgeruil", …) — only the
    injected fault is a true mismatch; decoys name features that are correct.
  - ~1 in 3 rounds has NO fault, so "Nee" is never the safe guess.

Verify: the injected fault is the UNIQUE visible mismatch (funclib compares
every feature of drawn vs stated curve; exactly one differs on Nee-rounds,
zero on Ja-rounds); fault menu covered evenly over 60 sampled rounds.

## Eksamenmodus rebuild (LAST)

- Sheets are GENERATED, not hand-authored: each sheet draws its curves through
  the same generators the quests use (off-axis hyperbolas, frame rules and
  window discipline inherited for free — this deletes sheetHypLine's p = 0
  fault by construction).
- Sub-questions are sampled from every skill that now exists, batch 1–3, worded
  in exam register (the current q7's strength — keep its phrasing bank).
- oneSketch stays: one sketch, many sub-questions, like a real paper.
- Existing profiles keep their unlock (grandfather rule).

Verify: every sheet passes the §22 real-spec scan (no skip-and-report left);
sampled sub-answers recomputed independently; three deterministic runs.

---

## Build shape (when approved — not before)

Foreman pattern, five Sonnet sessions in the order above, shipped ONE AT A TIME
with Megan phone-testing between each — the fix day proved that rhythm. Session
1 also picks up the parked tidy-up (randParabola's 33%-in-frame draw) since
Vind die vergelyking leans on that generator. After the last session:
`python tools/extract_af.py` regenerates AFRIKAANS-TEKS.md for her wording pass.

## Open questions for Megan (kickoff)

- a) Vind die vergelyking: is R2's tap-the-values slot-filling worth the one new
  mechanic, or are R1+R3 (pick the form, pick the equation) enough? (Foreman
  recommends building R2 — it IS her "wat gee die skets vir jou?" move.)
- b) Aard van wortels: confirm y = k only; the g + k sliding-line tangent stays
  out (needs Δ = algebra). Or does the Law-1 amendment stretch to it?
- c) Soek die fout: its own quest (as designed) or woven as extra rounds into
  the existing quests? (Own quest recommended — it needs everything before it.)
- d) Names for the four new quests, whenever you like — placeholders ship
  otherwise, same as batch 2.
