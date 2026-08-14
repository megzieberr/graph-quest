# Fun Functions — batch 3 RUN PLAN

Designed 2026-08-14 (Fable design pass; spec in GQ-BATCH3-DESIGN.md). Megan
approved the batch-3 setup the same day. Build day: not yet scheduled — Megan
dispatches each numbered session herself with /go; the foreman session reviews
the diff AND plays the result after each one. **Megan and the foreman both
approve before the next session is dispatched.** Ship one session at a time so
she can phone-test between, the fix-day rhythm.

**THE LAW in RUN-PLAN.md applies to every session — read it first.** Also read
GQ-BATCH3-DESIGN.md (the what and why per quest) and PROJECT-STATUS.md.

Kickoff calls — set to the recommended defaults, **Megan may flip any of these
before its session is dispatched**:

- a) Vind die vergelyking BUILDS the tap-the-values round (formFill mechanic).
- b) Aard van wortels is y = k ONLY. The g + k sliding-line tangent stays out
  (needs the discriminant = algebra, Law 1).
- c) Soek die fout is its OWN quest on the map, after Ongelykhede 2.
- d) Quest names below are placeholders, hers to change — same as batch 2.

Standing rules for every session below (batch-2 lessons, now law):

- Afrikaans is WRITTEN as its own sentence, never translated. Banned words
  (harness-enforced): sleep · frase · sywaarts · hoegenaamd · tak/takke.
  House vocabulary: vlerkies (hyperbola), arms (parabola only), rondte,
  refleksie/gereflekteer, soliede lyn, trek (drag) / skuif (the climb),
  English before/after labels.
- New quests slot in BEFORE Eksamenmodus; unlocks are grandfathered — inserting
  a quest must never take away earned access.
- Hyperbolas via randHyperbolaOffAxis() habits: NO asymptote may sit on an
  axis, anywhere, ever (global ruling 2026-08-13).
- Every generator enforces mostlyInFrame() itself and rejects-redraws.
- Every quest exposes its real specs to the harness (it.graph / buildAll scan).
- verify.html: same total, three runs in a row, before any commit. Trust it
  only after the cache discipline in PROJECT-STATUS.md (unregister SW, delete
  gq-* caches, force-refetch changed modules).
- Commit locally with `git commit -F <file>` (never -m). Do not push; the
  foreman pushes at ship time and bumps the SW cache then.
- End with a 5-line handoff note: what you built, what you're unsure of.

---

## SESSION 1 — Vind die vergelyking  (model: Sonnet)

Spec: GQ-BATCH3-DESIGN.md § "Vind die vergelyking". Build:

1. **Tidy-up first (it feeds this quest):** randParabola() in _graphs.js can
   emit a draw just under §4b's 34% frame line — fix the generator itself so
   its draws pass mostlyInFrame against their own windowFor window; keep every
   caller's local reject-and-redraw as belt-and-braces.
2. New quest file js/quests/qE-equation.js, three round types:
   - R1 Kies die vorm: mc(); options are the family's true forms; the correct
     one is the form the MARKED features fill (marked x-ints → intercept form,
     marked TP → hakie-vorm, marked asymptote cross → hyperbola form). Each
     decoy carries a misconception nudge saying what the sketch does NOT hand
     you for that form.
   - R2 Tap die waardes in: new `formFill()` in engine/interactive.js — the
     form renders with slots; one slot glows; tapping the matching marked
     feature on the sketch pours its value in (hakie shows the opposite sign
     visibly). Tap the wrong feature = gentle bounce, no penalty. iq() round:
     the filling IS the doing; the follow-up mc() asks one reading about the
     filled form.
   - R3 Watter vergelyking pas: four complete equations, all in the SAME form.
     Decoys by value: p-sign flip, q ↔ c, x-int signs swapped, a-sign flip.
     Never a decoy that equals the correct curve by value.
   - Families: parabola (all three forms), hyperbola (asymptotes → p, q;
     corners → sign of a), exponential (asymptote → q; above/below → sign of
     a; opstyg/land → b chips). NO solve-for-a anywhere.
3. Map: insert after questTransform in js/quests/index.js. Blurb in her
   register ("Wat gee die skets vir jou?").
4. verify.html additions (never relax): every R2 slot value equals funclib's
   value for the drawn curve over 60 sampled rounds; R3's correct equation
   re-renders to the drawn curve and no decoy does; formFill mounts and stays
   locked until every slot is filled; banned words; frame + off-axis checks
   see the new quest via its real specs.

Foreman review focus: R3 decoy-by-value discipline (render-and-compare, the qT
pattern); the hakie sign shown in R2 actually matches the tapped TP.

## SESSION 2 — Aard van wortels  (model: Sonnet)

Spec: GQ-BATCH3-DESIGN.md § "Aard van wortels". y = k ONLY (kickoff b). Build:

1. New quest file js/quests/qK-roots.js reusing varSlider — no new mechanic:
   - R1 discovery beat (Law 7, no spoilers): drag k, line y = k rides, live
     snypunte marked; unlock options only after the full range is dragged;
     conclusions worded for happy AND sad parabolas.
   - R2 die kiss: keypad; answer = the TP's y read off the marked sketch.
   - R3 hoeveel snypunte: chips k > q / k < q; decoys: flipped inequality,
     p instead of q.
   - R4 other families: hyperbola (exactly one cut for every k ≠ q, none AT
     q — the asymptote round); exponential (one cut only on the curve's side
     of the asymptote; above/below vocabulary).
2. Map: after qE-equation. Grandfathered unlocks.
3. verify.html: intersection count at every slider stop equals funclib's count
   (sample 30 rounds × full slider range); kiss-k equals TP y; hyperbola
   k = q round yields zero intersections and is never marked "een"; banned
   words; specs visible to the harness.

Foreman review focus: R1's wording never announces the conclusion before the
learner commits; the tangent language ("raak net-net") vs cut ("sny") is
consistent everywhere.

## SESSION 3 — Ongelykhede 2  (model: Sonnet)

Spec: GQ-BATCH3-DESIGN.md § "Ongelykhede 2". Sockets return (kickoff b of the
ORIGINAL run plan — learner-placed cut lines). Build:

1. New quest file js/quests/qI-inequal2.js reusing cutSockets + signPaint +
   sweep — no new engine:
   - R1 x·f(x): a socket must be placed at x = 0 as well (the y-axis bounds
     x's own sign — forgetting it is the teaching moment; cutMissing nudge
     names it). Paint x's row and f's row, read the product off the marks by
     eye — never a computed third row (Law 4). Quadrant-signs wording (Law 5).
   - R2 f/g open circle: painting as f·g; at g's root the answer never closes;
     options differ ONLY in < vs ≤ at that x; open circle drawn as scaffold
     after a wrong pick only (Law 6). Nudge: "Deel deur nul mag nie — daardie
     x bly oop."
   - R3 endpoint discipline: mixed ≤/≥ rounds where the only decision is which
     endpoints close — x-ints close, asymptotes and g-roots never.
2. Map: after qK-roots.
3. verify.html: group-23-style independent recomputation (signAt/sections/
   criticalXs) for both rows; every x·f(x) round requires the 0-socket; no
   option list closes an asymptote endpoint on its correct answer; scaffold
   hidden by default (DOM-checked), shown after error.

Foreman review focus: the f/g option pairs really differ only at g's root;
section numbering/spread when x = 0 crowds another cut line (26px rule).

## SESSION 4 — Soek die fout  (model: Sonnet)

Spec: GQ-BATCH3-DESIGN.md § "Soek die fout". Own quest (kickoff c). Build:

1. New quest file js/quests/qF-fault.js:
   - One round shape: sketch + equation together; "Pas hulle?" Ja/Nee; on Nee
     a follow-up mc() asks what is wrong, ≤4 feature-naming options.
   - Fault injection: from a TRUE pair, inject exactly ONE fault — p-sign flip,
     q ↔ c, asymptote x/y swap, a-sign flip (happy/sad, above/below), b
     opstyg/land flip. ~1 in 3 rounds injects nothing (Ja is correct).
   - Decoys on the why-question name features that are demonstrably RIGHT in
     the drawn pair, each with a misconception nudge.
2. Map: after qI-inequal2, before quest7.
3. verify.html: over 60 sampled rounds, funclib compares every feature of the
   drawn vs stated curve — exactly one mismatch on Nee-rounds, zero on
   Ja-rounds; fault menu evenly covered; Ja-frequency within 25–40%.

Foreman review focus: no injected fault that is invisible at the drawn window
size (a p-flip that lands both curves on the same pixels must redraw).

## SESSION 5 — Eksamenmodus rebuild  (model: Sonnet, LAST — only after 1–4 ship)

Spec: GQ-BATCH3-DESIGN.md § "Eksamenmodus rebuild". Build:

1. Rebuild q7-exam.js: sheets GENERATED through the same family generators the
   quests use (off-axis, frame and window discipline inherited — this deletes
   sheetHypLine's hard-coded p = 0 by construction). Keep the exam phrasing
   bank; keep oneSketch; sample sub-questions from every batch-1/2/3 skill.
2. Existing profiles keep their unlock and their best scores.
3. verify.html: the §22 real-spec scan now has NO skip-and-report cases left —
   remove the sheetHypLine exemption; sampled sub-answers recomputed
   independently; three deterministic runs.

Foreman review focus: exam wording register (this is the quest that talks like
a paper); no sub-question whose skill quest the learner may not have unlocked
yet — exam mode stays last on the map for exactly that reason.

## After session 5

- `python tools/extract_af.py` → regenerate AFRIKAANS-TEKS.md → Megan's
  wording pass → a correction session maps her edits back.
- Foreman ship: verify three-run bar, bump CACHE in sw.js (add the new quest
  files to SHELL — the batch-2 lesson: a missing/stale SHELL entry breaks the
  SW install), push (= deploy), check live, phone reopen.
- Then the parked tail: login screen + Supabase (schema written, NOT run),
  then the blipwork mount (setSemicircles(false)).
