# Project status — updated 2026-08-21 end of night (batch 3 session 3 CLOSED by her phone-test — "Ah, it's perfect"; 14 quests LIVE on sw gq-v27; NEXT: session 4, Soek die fout, tomorrow on her go)

**Read this first.** The v2 spec is [RUN-PLAN.md](RUN-PLAN.md); Megan's own class notes
are digested at [reference/GR11-FUNCTIONS-NOTES-DIGEST.md](reference/GR11-FUNCTIONS-NOTES-DIGEST.md).
**For qI (Ongelykhede 2) ONLY: [reference/RETEACH-XFX-2026-08-21.md](reference/RETEACH-XFX-2026-08-21.md)
OUTRANKS the design docs** — her own board pages plus every ruling from the redesign night.

## Where we are

- **14 quests LIVE on sw `gq-v27`, harness 235 checks, all approved by her.**
  Map order: Ontdek · Ontdek 2 · Vinnige Oë · Op die grafiek · Lees die
  gebied · Plus en minus · Bo of onder · Lengtes · Gemiddelde gradiënt ·
  Transformasies · Vind die vergelyking · Aard van wortels ·
  **Ongelykhede 2 (batch 3 session 3)** · Eksamenmodus.
- **Ongelykhede 2 runs her TWO-PASS LIVE TRAIL** (the night's whole arc:
  shipped-with-boxes → her playtest found it wrong → she retaught with her
  own board pages → one-round prototype → her verdict + amendment → full
  redesign → compare-block restore → "Ah, it's perfect"). The learner
  places every cut line (y-axis included in x·f(x) rounds — THE teaching
  moment), then sweeps the line once per sign-row (f first, then x or g),
  each sweep depositing its colour-coded trail; from sweep 2 the chip
  compares both signs live, and after completion the line STAYS draggable
  for comparing while answering. Stacked fraction for f/g, givens on
  separate lines, answer highlighted along the x-axis with circled section
  numbers. No boxes, no y = x line — ever (never-relax harness rules).
- **Her process ruling that made the night work: prototype-first.** One
  round built the new way behind a flag, her phone-test, THEN the full
  redesign. Keep this rhythm for any future design pivot.
- **Batch 3 sessions 1–3 are done and live.** Session 4 (Soek die fout) is
  pre-authorized to dispatch when she gives the go in tomorrow's session.
- **2026-08-13 was a FIX DAY (Fable foreman, her /go).** A full code review of the
  batch-2 range found 13 confirmed bugs; four Sonnet build sessions fixed them one
  at a time, each foreman-reviewed and shipped separately so she could phone-test
  between: (1) qL/qG generator fixes incl. the Lengtes open-crash; (2) Round D cut
  lines, reflections, grandfathered unlocks, global off-axis hyperbolas; (3) harness
  coverage hardening — which then CAUGHT a real frame bug on its third run; (4) the
  QUEST 5 REBUILD onto her board method (tekentabel gone). Details per session in
  Decisions below.
- **Her Afrikaans pass, mid-day:** batch 2's machine-Afrikaans gave her a headache;
  a foreman pass rewrote every learner string in qL/qG/qT as natural sentences, and
  every brief since carries the rule "Afrikaans is written as its own sentence,
  never translated." New vocabulary law (harness-enforced): refleksie/gereflekteer,
  soliede lyn, rondte, English before/after labels — see [[afrikaans-app-wording]].
- **verify.html: 162 checks, ALL PASS, count finally deterministic** (three
  identical runs is the ship bar now). The harness sees every quest's real specs
  via it.graph; frame rule has one owner (mostlyInFrame in _graphs.js).
- She played the new quests and quest 5's rebuild on her phone and is happy
  ("You put the boxes right next to the actual graphs! That reads so much easier").
- Progress saves still on-device only (Supabase schema written, NOT run; no login
  screen). Nobody but Megan has the app yet.

## Decisions

(append-only; see git history of this file for the v1-era list)

- 2026-08-09: FULL REBUILD, foreman pattern; THE LAW in RUN-PLAN.md (no algebra,
  square-grid engine, her +/− painting, no-spoilers discovery, scaffold-on-error).
- 2026-08-11 (day): session 1 (square-grid windowFor) + session 2 (discovery slider,
  parabola beats) built and reviewed; axis-of-symmetry = TP-form only (her kickoff
  answer); native sliders, not GeoGebra embeds.
- 2026-08-11 (overnight, foreman under her explicit /go): sessions 3–5 built by Sonnet
  agents, each reviewed + fixed before the next:
  - S3 review fixes: frozen asymptote coordinates never 0 (dashed line hides on an
    axis); exp b-beat keeps a > 0 (opstyg wording vs a downward plunge); Round B always
    deals 4 options; x-intercept decoy only when whole-number.
  - S4 review fix: sub-in point included in the window (an exp's point sat off-frame).
  - S5 review fix: the learner's +/− painting survives into the sweep phase (her
    method reads the answer OFF the painting).
  - Round D's half-marks retry is Boost-gated (as v1's plumbing works app-wide) — the
    scaffold shows on every wrong answer, the second chance only in Boost. Flag for
    Megan if she wants always-retry on Round D specifically.
  - Round B (Vinnige Oë) and the "notation" skill inside Bo of onder are additions the
    run plan allowed but did not spell out — hers to keep or cut after playtesting.
- Ship 2026-08-12 (foreman): sw.js SHELL list completed and corrected (it still named
  the deleted q6-sweep.js, which would have broken the SW install), CACHE bumped gq-v5
  → gq-v6, pushed to main (push = deploy on this repo).
- 2026-08-12 (morning): **Afrikaans wording pass runs via [AFRIKAANS-TEKS.md](AFRIKAANS-TEKS.md)**
  — all 485 learner-facing Afrikaans strings extracted from source in play order, labelled
  (vraag/wenk/afleier/nudge/metodekaart), ⟨…⟩ = runtime fill-ins. Megan edits the sentences
  in that file; a correction session maps every change back into the code and re-runs the
  harness. No more screenshot-by-screenshot wording fixes. The extractor lives at the
  session scratchpad's `extract_af.py` pattern (re-derivable: parse `B("en","af")` +
  `{en,af}` literals in map-order files) — regenerate the file after any content session.
- 2026-08-12 (afternoon): **her wording pass mapped back into the code.** The word
  rulings, now house law for this app's Afrikaans:
  - "drag" → **trek**, except where she chose **skuif** (the climb, and the two
    map subtitles). "Stap"/"tik" as mechanics → **skuif** / **klik op**.
  - "Stap 1:", "Stap 2:" (numbered steps) and "ry" (a table row) are NOT the same
    words and stay — a blind find-replace breaks six intro lessons and quest 6.
  - "sywaarts" → **links of regs**; "hoegenaamd" → **op of af**.
  - A hyperbola's branches are **vlerkies**, never "arms" and never "takke".
    Only a parabola has **arms**. Applies to quest 2, quest 4 and eksamenmodus.
  - The graph "ry"/"gereis" (rides/travelled) → **skuif**, matching the four she
    rewrote herself.
- 2026-08-12: **maths bug she caught on her phone** — the hyperbola climb round
  (`climbHyp`) asked "vir watter waardes van x is **f** stygend?" but marked the
  single walked branch correct. Both branches of a hyperbola always rise together
  or fall together, so that question can only be answered by BOTH (x ∈ ℝ, x ≠ p).
  Her ruling: ask about the branch instead — "vir watter waardes van x is hierdie
  **vlerkie** stygend?" The parabola climb still asks about f, correctly: a parabola
  has a real turning point. Never let a question name f when the answer is one wing.
- 2026-08-12: **"x < 1of2 < x < 5"** — she caught the join word glued to its
  neighbours in an option button. Cause (measured, not guessed): `.opt` is
  `display:flex`, and a flex container turns each run of text into its own item
  with the edge whitespace trimmed, so `parts.join(" of ")` lost both spaces.
  Fix: `joinIntervals()` joins with NON-BREAKING spaces plus a `<wbr>`, which
  keeps the join word as the answer's only line-break point. Harness check 9f
  measures the gap and fails on a plain-space join — verified by re-running it
  against the old string. Watch for this anywhere else text sits beside an
  element inside a flex box.
- 2026-08-12: **the scan line slides BOTH ways** (her call, from the phone). While
  she is choosing the answer she wants to run the line back over a section and
  look again. `sweep()` dropped its `Math.max(x, want)` right-only clamp; the gate
  still only limits how far RIGHT it may go, and a `reached` high-water mark means
  sliding back never un-does progress or un-finishes the round. Round D's `onEnter`
  is guarded so re-entering the last section cannot advance the round twice.
  ⚠ **The CLIMB stays strictly one-way** — that is the headline mechanic and it is
  what teaches left-to-right reading. Two mechanics, two rules: check 8b guards the
  climb, check 9g guards the sweep. Never unify them.
- 2026-08-12: AFRIKAANS-TEKS.md missed one string — `coach` in q2-point.js is built
  with `"..." + C(y) + "."` instead of a template literal, so the extractor skipped
  it. Any future extractor must handle concatenation, not just `${}`.
- 2026-08-12 (evening): **her three batch-1 rulings, after playing it** — the gate
  batch 2 was waiting on is now open:
  - **Quest order SWAPS: "Op die grafiek" comes BEFORE "Lees die gebied."** She
    places a point on a curve before she reads regions off one. New order:
    Ontdek · Ontdek 2 · Vinnige Oë · Op die grafiek · Lees die gebied · Plus en
    minus · Bo of onder · Eksamenmodus.
  - **Vinnige Oë STAYS** (equation-only speed round, no picture) and the
    **notation question inside Bo of onder STAYS** (shaded band → interval, open
    end at the asymptote). Both were run-plan additions offered for cutting; she
    kept both.
  - **Round D always offers the retry at half marks** — not Boost-only. The
    scaffold-on-every-wrong-answer behaviour is unchanged; only the second chance
    stops being gated.
  - Her three word calls from the wording pass are APPROVED as shipped ("Skuif"
    on the climb vs "Trek" on the sliders; "Beweeg dit op of af?"; the two
    "ry/gereis" → "skuif" lines). Wording of batch 1 is closed.
  Both rulings are now IN and verified live (85/85 → 86/86 harness): the map
  reads Op die grafiek → Lees die gebied at 375 px, and a wrong first pick in
  Bo of onder with NO Boost greys out, keeps the other options live, and pays
  "✓ Amper — halwe punte" on the next pick. `alwaysSecondChance` is a quest
  flag; `secondChanceAllowed()` in play.js is the one rule, exported so the
  harness checks the real thing.
- 2026-08-12: **every Round D hyperbola had its vertical asymptote hidden under
  the y-axis** — found while play-testing the second chance. `nicePair()`
  hard-coded `p: 0` (and allowed `q: 0`), so the dashed line was drawn on top of
  an axis, while the notation round tells the learner in words to look at it.
  Fix: `p` is picked from ±1, ±2 and the whole picture shifts with it (solving
  a/(x−p) + k = (x−p) + c is the p = 0 case with every x moved by p, so the
  meeting points stay whole numbers); `q` never 0 either. New harness check 10c
  samples 30 rounds and fails if any asymptote lands on an axis. Verified in the
  DOM: the dashed line now sits 69 px clear of the y-axis.
- 2026-08-12: **quest 5 still teaches the TEKENTABEL she dropped on 2026-08-09.**
  Its blurb ("lyne, tabel, lees af") looked like a stale label, but the quest
  really does build a sign table — "Vul nou die tekentabel hieronder in", a
  product row, columns. So the blurb is honest and must NOT be quietly reworded;
  the QUEST is what is out of date against her board method (cut lines + paint
  + and − per section + read off). Left untouched, awaiting her call — see
  Next up.

- 2026-08-12 (batch 2, session 1 — Sonnet, foreman-reviewed): **Lengtes** and
  **Gemiddelde gradiënt**. Lengths is a subtraction you can see (PQ between two
  curves, a horizontal gap, a point's distance to an axis); average gradient is
  two points and one small sum, taught as the gradient of the chord. Both are
  tap-to-reveal — the learner uncovers the points before answering. New engine
  pieces: `lengthReveal()` and `chordReveal()` in interactive.js; new funclib
  helpers `lengthBetween`/`avgGradient`/`gradientStr`.
  - Foreman review, independent of the harness: 480 Lengths rounds (correct
    option always matched the geometry of the two revealed points), 480 Gradient
    rounds (Δy/Δx always matched the actual points, no horizontal chord ever
    drawn, so no divide-by-zero decoy), every revealed point checked against the
    drawn path itself.
  - Review FIX: it built its sketches with `randHyperbola()`, which picks p = 0 a
    third of the time — so a round could draw a hyperbola with its vertical
    asymptote invisible down the y-axis, the same fault Round D had that morning.
    `_graphs.js` now exports `asymOnAxis()` and **`randHyperbolaOffAxis()`**; the
    new quests use it. `randHyperbola()` itself is UNCHANGED — see Pending.
- 2026-08-12 (batch 2, session 2 — Sonnet, foreman-reviewed): **Transformasies**.
  Four round types: name the move (faint "before" + solid "after" on one sketch),
  reflections (y = −f(x) vs f(−x), the pair learners swap), pick the equation
  (all four options in the SAME form, so the round is about the move and not
  about rearranging), and a slider round where the learner slides the image onto
  a ghost target and only THEN names what they did. `renderFunction` gained an
  opt-in `faint` curve flag; nothing else changed for existing quests.
  - Foreman review, independent of the harness: 420 rounds — the image curve
    always equalled the stated move (shift by dp/dq, or −f(x) / f(−x) as
    claimed), the correct option's **Afrikaans words matched the actual move**
    (a "2 links" label with a rightward shift would have been caught), and the
    slider target always matched its parameter.
  - Review FIX: it wrote **"sywaarts"** into a hint — a word she replaced with
    "links of regs" in her wording pass. Fixed, and the existing banned-word
    check now covers her whole list: sleep · frase · sywaarts · hoegenaamd ·
    tak/takke. Both new guards were negative-tested (they do fail on the bad
    text) rather than trusted because they went green.
- 2026-08-12: the line family is deliberately excluded from the shift rounds —
  for a straight line, "3 right" and "3a up" are the same picture, so those
  rounds use parabola/hyperbola/exp only. A line still appears in the reflection
  round, where it is not degenerate. (Session 2's call; it flagged it rather
  than hiding it.)
- 2026-08-12: AFRIKAANS-TEKS.md rebuilt — the three new quests spliced in AND
  the section numbering brought back in line with the shipped map order (it
  still had Lees die gebied before Op die grafiek). Every one of the 488 old
  bullets is still present, 592 now. It was rebuilt from the RUNNING app, not
  by parsing source, which is why the concatenated-string blind spot from the
  first extractor does not apply. Her edits were untouched.

- 2026-08-13: **full code review of the batch-2 range (11bec27..HEAD): 13 confirmed
  findings**, top of the list: Lengtes crashed on open (null intro spec — the harness
  never tests intros), Eksamenmodus re-locked for existing profiles by the quest
  insertion, a Round D cut line invisible on the y-axis in 26,5% of hyperbola rounds,
  and the parabola y-axis reflection in Transformasies being identical to a shift
  (correct answer marked wrong). Today became a FIX DAY: four Sonnet build sessions,
  foreman-reviewed and shipped ONE AT A TIME with Megan phone-testing between each.
- 2026-08-13: **her ruling — Law 1 is AMENDED, not violated, by the new quests.** The
  review flagged that qL/qG's "top minus bottom" subtraction is the verbatim example
  RUN-PLAN's Law 1 bans. Megan: "top minus bottom is very basic algebra, we can keep
  that in." The subtraction wording in Lengtes and Gemiddelde gradiënt STAYS — do not
  "fix" it back out in a later session.
- 2026-08-13: **her ruling — unlocks are GRANDFATHERED.** A quest is open if the
  previous quest on the map is done OR the quest itself was ever played/finished.
  Inserting new quests must never take away earned access (this bit her own profile:
  Eksamenmodus re-locked after batch 2).
- 2026-08-13: **her ruling — `randHyperbola()` goes off-axis GLOBALLY.** The p = 0
  question from batch 2 is settled: no quest, batch 1 included, may draw a hyperbola
  with an asymptote on an axis.
- 2026-08-13: **her ruling — the parabola + y-axis reflection case is DROPPED from
  Transformasies** (a parabola's y-reflection is pixel-identical to a shift, so the
  round marked a true reading wrong). Lines and hyperbolas keep both reflection axes.
- 2026-08-13: **her ruling — quest 5 is reworked TODAY** onto her board method (cut
  lines → paint + and − per section → read off the painting); the tekentabel rounds
  and their harness checks are replaced. This clears the blocker batch 3 was waiting
  on.

- 2026-08-13 (session 3): **the harness's new real-spec scan found that
  Eksamenmodus's fixed hyperbola sheet (sheetHypLine in q7-exam.js) hard-codes
  p = 0** — exam mode shows learners a dashed asymptote lying invisibly on the
  y-axis today. Left untouched (hand-authored content; the eksamenmodus rebuild
  is already parked as its own batch) and the scan explicitly skips-and-reports
  it rather than failing. Fold the fix into the exam rebuild.
- 2026-08-13 (session 3, foreman review): the new §4b coverage caught a REAL
  intermittent bug on its third run — a qL parabola drawn only 30% in frame.
  Root cause: qL/qG's generators never enforced the frame rule themselves.
  Foreman review fix: all seven qL/qG skills now reject draws failing the
  shared mostlyInFrame() guard, like qT always did. 2 100 stress rounds in
  node: zero throws, zero frame failures; harness 147/147 three runs straight.
  Also fixed in review: the tak-ban regex never matched the singular "tak"
  (\btakke?\b parses as "takk"+optional-e) — now \btak(ke)?\b.

- 2026-08-13 (session 4): **QUEST 5 REBUILT onto her board method** — cut lines
  (sockets, decoys unchanged) → the learner paints + and − directly ON each curve
  per numbered section (signPaint, extended with section numbers ①②③ and a 26px
  spread so two close curves' boxes never overlap) → the answer is read off the
  painting; "tekens verskil" is compared by eye, never computed into a third row.
  The tekentabel and its harness checks are gone (her sanctioned replacement);
  group 23's 15 checks recompute all sign truth independently via
  signAt/sections/criticalXs. Foreman review fixes: a null-window guard before
  the new mostlyInFrame call in singleSign (crash-class), noted that q5 keeps its
  pre-existing retry-by-recursion style (cleanup candidate, not a regression).
  Session 4 also flagged: randParabola() in _graphs.js can produce a 33%-in-frame
  draw (just under §4b's 34% line) — q5 and the other quests all reject-and-redraw
  locally, but the generator itself is worth a look in a future session.

- 2026-08-14: **her ruling — the three batch-2 quest names are FINAL.** "Lengtes",
  "Gemiddelde gradiënt" and "Transformasies" stay exactly as shipped ("Those 3
  names are perfect"). Closes the last open item from the fix day.
- 2026-08-14: **AFRIKAANS-TEKS.md is now GENERATED by `tools/extract_af.py`** —
  a deterministic source parser (handles template fills, concatenation AND
  ternaries; labels from code shape, never guessed). One command after any
  content session; no more re-derived extractors. Rebuilt this day: 599 bullets,
  all fix-day wording in, diff-validated line by line against the old file.
- 2026-08-14: the extractor caught a real bug — q1-discover.js's q-vs-c nudge
  said "links **or** regs" (English "or", left over from the sywaarts pass).
  Fixed with her go-ahead; note the banned-word harness check cannot see English
  function words, only the named banned list.
- 2026-08-14: **batch 3 designed and briefed** (her "yes, go ahead"):
  [GQ-BATCH3-DESIGN.md](GQ-BATCH3-DESIGN.md) is the spec,
  [RUN-PLAN-BATCH3.md](RUN-PLAN-BATCH3.md) the session briefs — Vind die
  vergelyking → Aard van wortels → Ongelykhede 2 → Soek die fout → Eksamenmodus
  rebuild last. Kickoff calls set to recommended defaults (slot-fill built,
  y = k only, fault-quest standalone); she may flip any before its session
  dispatches. Build day not yet scheduled.

- 2026-08-14 (batch 3, session 1 — Sonnet, foreman-reviewed; her "run it", kickoff
  calls a/b/c at defaults): **Vind die vergelyking** built and committed LOCALLY
  (`8b2a73a` + review fix `be3b5cb`, NOT pushed — live is still 11 quests on gq-v19).
  New formFill() mechanic in interactive.js; qE slots in after Transformasies;
  harness now 170 checks (§24: 118 slot values recomputed vs funclib, 62-round
  render-and-compare on R3, formFill lock). randParabola() now rejects its own
  out-of-frame draws (the tidy-up). Session's own play-testing caught two real
  bugs pre-commit (NaN in the hakie fill — eqTPStr needs {a,p,q}, randParabola
  returns {a,b,c}; B_INTRO said "Eleven"). Foreman review played all three round
  types at 375 px: decoy tap bounces without filling, follow-up mc's and
  misconception nudges fire, map + intro clean. Review fix: the R2 exp stem
  hardcoded "y = bˣ + q" and contradicted the fill panel whenever a ≠ 1 — stem
  now built with renderExp()'s rules, proven for a = 1 / −1 / 2. 170/170 three
  runs before AND after the fix, full cache discipline each time.
- 2026-08-14 (session 1, flagged for her): R1 "Kies die vorm" is parabola-only —
  a hyperbola/exp each have ONE canonical form, so there is no real form-choice
  to quiz (the design's wording was ambiguous). R2's follow-up asks a sign-reading
  question (happy/sad · corners · above/below), not a re-quiz of the numbers just
  filled. Both are the session's readings of the spec, hers to overturn.

- 2026-08-14 (night, foreman ship on her "ship it"): **SHIPPED to live** —
  qE + its review fix + the q5 crash fix, SW SHELL + CACHE gq-v19 → gq-v20,
  push `4b15f23`. Live files verified byte-fresh (sw.js v20, qE serving with
  formFill + stem fix, q5 with paintable()); full 12-card UI verified at 375 px
  on local, which is byte-identical to what the server now serves.
- 2026-08-14 (night, foreman review find during the ship pre-flight): **quest 5
  could CRASH the moment the learner placed the last cut line** — a steep line
  could put every section midpoint outside the y-window (measured 2,2% of
  singleSign draws), so signPaint mounted zero paint boxes, its construction-time
  onChange reported allMarked vacuously, and the callback hit `painter` in its
  TDZ inside a setTimeout: Uncaught, invisible to the harness, frozen round.
  Fix in three layers: q5 generators reject-and-redraw unpaintable rounds
  (paintable(), signPaint's own predicate) — post-fix 0/500 degenerate;
  buildSignsFlow pre-declares `painter`; new never-relax check in verify §23
  (harness now 171). The stray console errors that exposed this dated back to
  harness runs mounting exactly such rounds.

- 2026-08-21 (her playtest of qE, all shipped the same day):
  - **An option list carrying an equation goes ONE PER LINE at every width.**
    `.eq` is nowrap, so a squeezed equation does not wrap — it runs off the
    button's edge — and `.opts` only stacked below 380 px. Her phone is
    540 px, so "y = 2·2ˣ − 4" shipped cut off mid-equation. Prose options
    (happy/sad, the corner pairs) still pair up. `optionsNeedOneColumn()` in
    play.js decides it; harness §25a sweeps EVERY quest. Never relax.
  - **A formula quoted in a sentence gets its own line** — new `.eq-line`
    (funclib `EQL()`). Inline it wrapped as "y = a(x −" / "p)² + q". The new
    §25b sweep then caught the same bug in two lessons she had not reached:
    qG's "gemiddelde gradiënt = Δy oor Δx" and q6's step-5 interval. One
    character after an "=" is prose shorthand ("BO die x-as = +") and is
    exempt; two or more is a formula and must be protected.
  - **Every extra dot on a formFill sketch names itself when tapped.** They
    used to buzz in silence, so a learner who tapped the right dot first read
    the others as dead ("what is the purpose of that second dot?"). She ruled
    KEEP them — without a decoy the round is "tap the only dot" and teaches no
    reading. formFill takes an `onMiss` callback; qE's WHY map supplies the
    words.
  - **The exp "which equation" round's b-decoy is now the RECIPROCAL base.**
    It used to be 2 swapped for 3 — both lie flat on the same side and share a
    y-intercept, so nothing on the sketch separated them. Her words: three of
    the options carried the right q, so reading the asymptote decided almost
    nothing. All three R3 families now have a three-rung ladder (q → sign of a
    → base/p) and a worked solution.
  - **HER DESIGN CALLS, both answered:** the form-choice round STAYS
    parabola-only; the tap round's follow-up STAYS a sign question.
  - **R4 "Watter teken het a?" (new, hers):** two options identical apart from
    the sign of a, one cue per family — happy/sad · which pair of corners ·
    above or below the asymptote.
  - **R5 "Watter grondtal?" (new, hers):** four options sharing a and q, bases
    written across all three notations (whole number, fraction, negative
    exponent). ⚖️ **(½)ˣ and 2⁻ˣ are ONE graph**, so options are filtered by
    VALUE and the two spellings can never both appear — the worked solution
    says the equality out loud. The x-intercept is MARKED on a whole number,
    because "which side is it flat on?" only narrows four options to two.
  - `randExp()` still only makes b = 2 or 3. The new `EXP_BASES` table in
    qE adds ½ and ⅓, which is what makes "which side does it lie flat?" a
    real reading instead of a formality.

- 2026-08-21 (evening, same session — her rulings after the ship):
  - **qE dealing CHANGES (queued for session 2's dispatch, not yet built):** deal
    one round of each kind per play until a learner has met every kind, THEN fully
    random. Reason: 6 rounds drawn at random from 5 kinds skip at least one kind in
    ~5 plays out of 6 — she hit this herself and read it as missing rounds.
  - She discovered the app generates questions fresh each play only NOW — the run
    plans said "generators" and nobody ever said it in plain words. Standing note:
    design-level facts a teacher would notice get one plain sentence at kickoff.
  - She loves the generative design and wants it in blipwork too — as an ADDITIVE
    dice per chapter, not a conversion. Full plan written this session:
    `C:\Users\megzi\Desktop\Claude Code Projects\maths-homework-quest\DICE-PLAN.md`
    (uncommitted in that repo). All her rulings live in it — read it there.
  - Cross-project tie: **Soek die fout (session 4 here) shares its mechanic with
    blipwork's error-checking dice rounds** — build once, both apps use it. Land
    it here first.

- 2026-08-21 (night — batch 3 SESSION 2, Sonnet build under her /go, foreman-reviewed):
  - **qE dealing built per her ruling.** Opt-in quest flag `dealEachKindFirst`
    (only qE sets it); `buildRound()` deals one round of every usable kind in a
    shuffled order, remaining slots from the weighted bag, spread rule kept.
    "Met" = the round was actually PRESENTED in play (hooked in play.js's
    render(), deduped across language-toggle re-paints), persisted via
    `backend.markMet()` at top-level `profile.met` — deliberately NOT inside
    `profile.quests[id]`, which saveResult() replaces wholesale. Plain-words
    consequence, known and accepted: a fresh device starts one-of-each again.
    Harness §26 (10 checks): fresh/omitted/partial met-state always deal all
    five; full met-state provably reverts to the plain draw; other quests
    (weighted AND buildAll) ignore the argument entirely.
  - **Aard van wortels (qK) built** — R1 discover (varSlider, options gated on
    dragging the FULL range), R2 kiss, R3 count chips, R4 hyperbola/exp.
    Inserted after qE; grandfathered unlocks verified live (a profile with
    Eksamenmodus merely PLAYED keeps it open despite qK being new and undone).
    Session's own finds, fixed in-build: funclib `intersections()` reported a
    spurious extra crossing where a sampling step straddled a hyperbola's own
    asymptote (every k ≠ q round read 2 cuts instead of 1 — fixed by skipping
    straddling steps; criticalXs' 1e-3 dedupe means older quests never saw the
    spurious cross, so cut-line behaviour is unchanged); a raw "<" in option
    HTML parsed as a tag (now `&lt;`, the intervalStr() dodge); B_INTRO said
    "Twelve/Twaalf" — now Thirteen/Dertien.
  - **Foreman review fixes (`1c89f53`):** R4's cut point now goes into
    `include:` and a draw whose window contradicts the family truth
    rejects-and-redraws (a cropped cut could otherwise key "0" while the
    solution claimed the asymptote reason); §27 tightened to the closed-form
    truths (k ≠ q hyperbola = exactly 1, exp = side-of-asymptote), independent
    of the intersections() recompute; English canon "branches" restored
    (vlerkies stays Afrikaans-only, the q1b pattern); wording: "die opsies
    gaan eers oop", "een snypunt" (never "1 snit" — q6's snypunt canon).
  - ~~Session judgment call: R2 kiss built as mc() for lack of a keypad~~ —
    **RESOLVED same evening, her ruling: add the keypad, reuse blipwork's.**
  - ~~Open question: should qK also deal one-of-each?~~ — **RESOLVED same
    evening, her ruling: qK's dealing stays randomized.**

- 2026-08-21 (late night — keypad amendment, Sonnet build under the same /go
  envelope, her explicit ruling in-chat; foreman-reviewed):
  - **`js/engine/keypad.js`** ported from blipwork's js/keypad.js (on-screen
    keys only, decimal comma, ± when negatives allowed): bilingual submit key
    ("Dien in ✓"), and the display shows the REAL minus sign (−) while the
    buffer keeps "-" for editing. Its CSS block ported verbatim — the two
    apps share the System Window theme, no second look forked.
  - **`kp()` round shape** in _shared.js + **`paintKeypad()`** in play.js:
    scores exactly like an mc round (same XP constants, same
    `secondChanceAllowed()` gate — first wrong entry with a chance clears
    the buffer and nudges inline, next submit is final at half marks), runs
    through the same showFeedback(). An empty/garbage submit is inert.
    `wrongMisc(v)` picks the nudge BY TYPED VALUE — typing the TP's x gets
    the specific p-vs-q nudge; `miscTexts` lists every possible return so
    the language sweep can see strings a function hides.
  - **qK's kiss round converted** from mc() to kp() (the design doc's
    original R2 spec — mc existed only because no keypad did).
  - **verify.html: 202 → 203.** §3's generic scan gained a kp branch (it
    assumed every round has options and would have crashed); §27's R2
    checks rewritten for the typed shape PLUS a mount-and-drive block that
    clicks the real on-screen keys: the correct value completes, a wrong
    one does not.
  - **Foreman review fixes (`2e6e7e2`):** "van die sketch af" → "skets"
    (English word inside an Afrikaans nudge — the banned-word check can't
    see English function words; the native-eye pass exists for this), the
    stale qK file header, and **ui.js buzz() now skips vibrate without user
    activation** — harness runs drive mechanics synthetically and the
    browser logged 485 blocked-vibrate errors per run (measured), noise
    that once buried a real bug (q5's TDZ). Phone behaviour unchanged: a
    learner has always tapped before anything buzzes.
  - Foreman played every kiss path live at 375 px: correct-first (full
    marks, keypad locks), typed tp.x (final wrong + the specific nudge),
    Boost second chance (inline nudge → cleared buffer → half marks).

- 2026-08-21 (late night — her live phone-test findings, built immediately,
  Sonnet under the same session-2 /go envelope, foreman-reviewed; commits
  `1029fb9` + `3f3ef0d`, NOT yet pushed):
  - **Her ruling: EVERY qK round draws the y = k line, DRAGGABLE.** Her words,
    mid-playtest, after a chips round showed no line at all: "the line always
    needs to be there and draggable otherwise it never teaches their eyes
    anything... they could've just been looking at a static diagram on a piece
    of paper." R2 (kiss) drags the line and types the k it lands on (starts
    away from the TP so the drag means something); R3 (count) drags with live
    snypunte; R4 (hyperbola/exp) — extended mid-session by the foreman under
    the same ruling — drags through a small range that always straddles the
    asymptote AND holds the asked k, so the cut visibly appears/disappears at
    q while the stem/key/options stay pinned to the printed k. Only R1 keeps
    the Law-7 seen-every-stop gate; R2/R3/R4 are `freeDrag` (new varSlider
    opt): chips/keypad live from the first paint, no counter shown, coach
    lines rewritten so none promises a gate that doesn't exist (harness
    checks: no-gate reveal-on-mount, hidden counter, coach wording).
  - **R3 no longer labels the turning point** — you FIND it by dragging (the
    dots vanish there). Session judgment following R1's pattern; flag for her
    eye on the phone.
  - Build session found + fixed: play.js's done() now picks paintKeypad vs
    paintOptions off the ASKED shape (an interactive round whose `then` is a
    keypad got the option grid before); a freeDrag round's authored coach line
    was silently overwritten by the generic "unlocked" text before first
    paint; verify.html §3's kp branch checked the wrong object (it.type vs
    mcq.type — latent since the keypad amendment).
  - **Foreman review find, fixed in `3f3ef0d`: the kiss stop drew ZERO dots.**
    funclib's intersections() finds roots by sign change; a tangency never
    crosses, so at k = tp.y the scanner sees nothing — R1 taught "Presies
    daarop: 1 (dit raak net-net)" while its own picture at that stop had
    nothing to count, LIVE since the session-2 ship (the harness's per-stop
    recompute shared the same blind function, so it self-passed). Fix: R1/R3's
    specOf draw the closed-form touch point at k = tp.y (it IS the TP by
    definition); intersections() untouched; NEVER-RELAX kiss-stop assertions
    in §27 checked against tp directly, never against the blind recompute.
    Foreman verified live: 2/1/0 dots below/at/above the TP on a sad parabola.
  - ⚠ Known coverage gap (flagged by the build session, real): verify.html
    mounts builds directly and bypasses play.js's render/done wrapper, so
    bugs in that wrapper (like the coach-overwrite) are invisible to the
    harness — they surface only in live play. Candidate for a future
    harness session.
  - Harness 203 → 207, three identical runs post-fix; console clean (the
    buzz guard now proven — a full synthetic-drag session logs zero errors).

- 2026-08-21 (close of the day): **her phone-test of gq-v23 PASSED** — "Much
  much better, it looks great!" The line-everywhere build, the keypad, the
  kiss-stop dot and the qE one-of-each dealing are all approved as shipped.
  Session 2 is CLOSED. (Her approval also settles the R3-no-TP-label
  judgment call — flagged, seen, kept.)

- 2026-08-21 (build day 2, morning): **pre-build audit + Afrikaans housekeeping**
  (her ask before sessions 3–5). Base verified sound: 207/207 ×3 with full cache
  discipline, console totally clean (buzz guard proven — zero errors where 485
  once drowned a real bug), live = HEAD, qK smoke-played through the real play
  wrapper. Housekeeping found + fixed a real hole: **tools/extract_af.py's
  SECTIONS list stopped at the 11 pre-batch-3 quests**, so AFRIKAANS-TEKS.md
  had ZERO qE/qK/keypad strings — her wording pass would have silently skipped
  the two newest quests. Extractor now mirrors index.js (rule already in its
  header); file went 599 → 738 bullets; the 139 new strings passed a native-eye
  read (canon held: vlerkies/arms, Trek/Klik op, no banned words).

- 2026-08-21 (build day 2 — batch 3 SESSION 3, Sonnet build under her /go,
  foreman-reviewed, SHIPPED sw gq-v24, push `26f77f7`, live-verified byte-fresh
  by SHA-256 against local HEAD):
  - **Ongelykhede 2 (qI) built** — R1 x·f(x) (quadrant signs), R2 f/g with the
    open circle, R3 endpoint discipline (single-curve and quotient shapes).
    First quest to chain her FULL four-step board method in one round:
    cutSockets → signPaint → sweep → read off. Map: after qK, before
    Eksamenmodus — 14 quests.
  - **Build session's design call, flagged for her phone-test: "x" is drawn as
    the literal line y = x** on the same sketch as f. Why it's good: painting
    x's row becomes the same f·g mechanic learners know from quest 5, and the
    required 0-socket IS that line's x-intercept — "a line through every
    x-intercept" produces the teaching moment with no special rule. The
    kwadrant 1/3 vs 2/4 wording from her notes stays in hints + solutions
    (Law 5). HER EYE SETTLES IT.
  - R2 ships exactly 2 options (spec-literal: they differ ONLY in < vs ≤ at
    g's root; qE-R4 precedent); R3 ships 2–3. The verbatim nudge canon is in:
    "Deel deur nul mag nie — daardie x bly oop."
  - Build session self-caught pre-commit: a ~2% R1 draw where flipStrictString
    collided with the correct answer (asymptote-forced-open ray) shipped only
    3 options — reject-and-redraw guard; and the intro's hand-built sign marks
    drifted above the frame (same clamp q5's intro needed on fix day).
  - **Foreman review (own eyes, no say-so):** 225/225 ×3 identical, console
    clean; §28's checks read line by line (independent recompute via
    signAt/sections on FRESH cuts, negative-tested, non-vacuous); 1000-round
    stress across all round types — **minimum cut separation 1.0 unit (~45px),
    zero draws under 0.45** — the x=0 crowding worry is measured away, the
    generators only make whole-unit boundaries; full round played through the
    REAL play.js wrapper at 375px (sockets → paint → sweep → wrong-pick nudge
    → method card), intro's 5 beats free of clipped equations (§25b class).
  - ⚠ Environment note, NOT an app bug: this session's browser pane stopped
    registering the localhost SW mid-review ("unknown error fetching the
    script") — plain fetch of sw.js was 200/correct, the SAME sw.js registers
    fine on the live site, and the ship commit never touched it. Don't chase
    it in the app; it's the pane's localhost storage state.
  - Ship: SHELL + qI-inequal2.js, CACHE gq-v23 → gq-v24; AFRIKAANS-TEKS.md
    regenerated 738 → 794 bullets (Quest 13 · Ongelykhede 2 in, ready for her
    wording pass).

- 2026-08-21 (night — her playtest of qI: FOUR findings, then the RETEACH):
  (1) f(x)/g(x) must be a proper stacked fraction, not a slash; (1b) the two
  givens ran together with a · that read as times; (2) g's section-② signs
  rendered in section ①; (3) an exp round with an off-window section midpoint
  collapsed to one tap and played itself, her wrong + surviving the reveal;
  (4) THE BIG ONE — R1's "x drawn as the line y = x" is wrong pedagogy ("no
  man, something went VERY wrong here"). She sent her own board pages
  (funksies-grafieklees PDF, 4 pages) — digested with all her rulings into
  **reference/RETEACH-XFX-2026-08-21.md**, which OUTRANKS the design docs for
  this quest. Key rulings: no y = x line ever; x's signs are a second
  colour-coded row riding f's curve; the question colour-codes its rows; the
  answer is read off the x-axis (highlighter); one sign per section in-app;
  the sweep is LIVE ("drag the line through and see the sign changes"); the
  BOXES ARE OUT for qI entirely — the drag deposits the trail; and
  prototype-first ("make one round, just one, then I play test it").
- 2026-08-21 (night — prototype SHIPPED sw gq-v25, push `f721130`, behind
  ?proto=xfx): trailSweep engine mechanic + one x·f(x) round. Foreman-reviewed
  (233/233 ×3, played at 375 px). **Her verdict: PASS — "The rest looks
  perfect" — with ONE amendment: two sweeps, one row per sweep** (first f's
  signs, then x's).
- 2026-08-21 (night — qI FULL REDESIGN, Sonnet under the same /go,
  foreman-reviewed, SHIPPED sw gq-v26, commit `615a1cd` + ship commit,
  live-verified byte-fresh): all three round types on the two-pass trail
  (R1: f then x, stacked from f's curve; R2/R3 quotient: f then g, each row
  on its own curve — HER EYE still owed on that pass order; R3 single: one
  pass). Stacked fraction via funclib's existing frac(); givens on two
  .eq-line rows; windowForRound() rejects any draw whose window can't hold
  every section midpoint (the build measured the old sizing at ~66% violy,
  0% after); ?proto=xfx door REMOVED — the trail IS the quest; old
  signPaint/box flows + their §28 checks deleted with their mechanic (the
  tekentabel precedent), new §28 drives both passes with synthetic pointers.
  Foreman review: 233/233 ×3 own runs, R2 played through both passes at
  375 px (chip row-pure, pass-specific coach lines, exactly 2 options
  differing only at g's root, verbatim "Deel deur nul mag nie" + open-circle
  scaffold on the wrong pick), fraction + two-line givens confirmed in DOM.

- 2026-08-21 (last round of the night — her regression report + the fix,
  SHIPPED sw gq-v27, fix commit `ee17f46`, ship `3c998bd`, live byte-verified):
  the redesign's row-pure chip had dropped the prototype's COMPARE BLOCK she
  liked ("the little block with the x signs and f(x) signs and then the user
  could still drag the line"). Her ruling, now in the reteach file: sweep 1's
  chip shows only its own row; from sweep 2 it shows BOTH rows side by side;
  and after the final sweep the line STAYS draggable with the block live —
  comparing while answering. Harness 233 → 235 (post-completion drag driven
  synthetically; onComplete proven to fire exactly once). Foreman verified by
  hand: dragged post-completion with the options on screen, block flipped
  across g's root. **Her verdict on the whole rebuilt quest: "Ah, it's
  perfect." SESSION 3 CLOSED.** Soek die fout deferred to tomorrow's fresh
  session at her call.

## Pending on Megan

- 💻 [whenever] 1 min: open tomorrow's Fun Functions session and say
  **"session 4 can go"** — the foreman dispatches Soek die fout.
- 💻 [whenever] 1 min: say whether your board-pages PDF
  (funksies-grafieklees…, repo root) may be committed — the repo is PUBLIC,
  so it stays untracked until you say yes.

## Next up

- **NEXT = batch 3 session 4: Soek die fout** (qF — sketch + equation, "Pas
  hulle?", one injected fault; brief in RUN-PLAN-BATCH3.md; design its
  mechanic to be SHARED with blipwork's error-checking dice rounds — see
  DICE-PLAN.md there). Dispatches on her go in tomorrow's session
  (pre-authorized tonight). Then session 5: Eksamenmodus rebuild (which
  removes the sheetHypLine p = 0 exemption from the §22 scan).
- Carry into session 4's brief: the wrapper blind spot (play in a real tab,
  read the console), whole-unit boundary habit, include-section-midpoints
  window rule where sections matter, banned-word + native-eye Afrikaans
  pass, and the fault-visibility review focus (a p-flip that lands both
  curves on the same pixels must redraw). Prototype-first is available if a
  design question feels open — her ruling made it the house rhythm.
- **Batch 3 (foreman = Fable; the foreman dispatches the build agents itself,
  reviews, reports back between sessions).** Sessions 1–3 shipped and closed.
- AFRIKAANS-TEKS.md is CURRENT through the qI redesign (regenerated in
  `615a1cd`). Regenerate again after sessions 4/5, then her wording pass
  → correction session.
- Small tidy-ups, any session: q5's retry-by-recursion style could become
  bounded loops like qL/qG · the faint flag doesn't dim a faint curve's
  asymptotes/labels (cosmetic, needs her call). (randParabola moved into
  batch-3 session 1.)
- After batch 3: login screen + Supabase (schema written, NOT run), then the
  blipwork mount (`setSemicircles(false)`).

## How to run it

```bash
python -m http.server 5207 --directory "C:\Users\megzi\Desktop\Claude Code Projects\graph-quest"
```

Then <http://localhost:5207/> (`?local=1` forces local save mode). Preview entry
`graph-quest` (port 5207) in the nested `C:\Users\megzi\.claude\.claude\launch.json`.
verify.html is the harness — ALL must pass at the same total three runs in a row
(currently 235) before any commit.

⚠ Cache discipline (it lied to THREE reviews this build): before trusting verify.html
in a browser, unregister the SW, delete `gq-*` caches, AND force-refetch changed modules
with `fetch(url, {cache:"reload"})` — the plain HTTP cache serves stale modules even
with the SW gone.

## The deploy pipeline (unchanged)

1. verify.html all-pass → 2. bump `CACHE` in `sw.js` → 3. commit (`git commit -F`,
never `-m`) → 4. `git push` (= deploy, ~1 min) → 5. check live → 6. phone: fully close
+ reopen the PWA. Supabase is a separate hand-run pipeline (schema written, NOT run).

## Map of the code

```
index.html            shell
css/styles.css        blipwork "System Window" theme + .iv-* / .vs-* classes
js/
  app.js · play.js (Boost, XP, second-chance) · screens.js · i18n.js · check.js
  funclib.js          ALL the maths — every answer computed here (+ eqTPStr)
  backend.js          local + cloud behind one interface (cloud unused, no login yet)
  engine/function-graph.js   the one affine map, square-grid renderer, exit arrows
  engine/slider.js           varSlider/sliderPair — the discovery mechanic (S2)
  engine/keypad.js           mountKeypad — typed-number entry (qK's kiss round;
                             ported from blipwork, batch 3 session 2)
  engine/interactive.js      pointDrop · curtain · climb · signPaint · cutSockets ·
                             sweep(+plain/open) · comparePaint · axisGate · tapReveal
  quests/_shared.js (mc dedupes options) · _graphs.js (windowFor: square-grid, returns
                    null → regenerate; generators self-constrain) · _intervals.js
  quests/q1-discover.js · q1b-discover2.js · qB-recognize.js · q2-point.js ·
         q3-region.js · q5-signs.js (board method: cutSockets → signPaint;
         paintable() rejects unpaintable draws) · q6-compare.js ·
         qL-lengths.js · qG-gradient.js · qT-transform.js ·
         qE-equation.js (formFill: tap the marked feature, value pours in;
         dealEachKindFirst) · qK-roots.js (Aard van wortels: y = k, varSlider) ·
         qI-inequal2.js (Ongelykhede 2: two-pass live trail per her reteach —
         sockets → trailSweep pass per sign-row → answer with the axis-shade;
         NO boxes, NO y = x line; spec = reference/RETEACH-XFX-2026-08-21.md) ·
         q7-exam.js      ← map order; screens.js exports questUnlocked()
supabase/schema.sql   written, not run
verify.html           the harness: 235 checks, deterministic count — §4b (shared
                      mostlyInFrame) + §22 real-spec off-axis + banned words incl.
                      titles/blurbs/intro caps + groups 14–23's fix-day guards +
                      §25's playtest guards (maths options one per line, no loose
                      formula in a beat, every decoy speaks, no two options that
                      are the same graph) +
                      §23's paint-box guard + §24 (qE) + §28 (qI) are never-relax rules
sw.js                 network-first for code; SHELL precache; CACHE = gq-v27
```
