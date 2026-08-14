# Project status — updated 2026-08-13 (the fix day: full code review, 4 build sessions, her Afrikaans pass)

**Read this first.** The v2 spec is [RUN-PLAN.md](RUN-PLAN.md); Megan's own class notes
are digested at [reference/GR11-FUNCTIONS-NOTES-DIGEST.md](reference/GR11-FUNCTIONS-NOTES-DIGEST.md).

## Where we are

- **11 quests LIVE on sw `gq-v19`**, map order: Ontdek · Ontdek 2 · Vinnige Oë ·
  Op die grafiek · Lees die gebied · Plus en minus · Bo of onder · Lengtes ·
  Gemiddelde gradiënt · Transformasies · Eksamenmodus.
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

## Pending on Megan

(nothing — the quest names were approved 2026-08-14, see Decisions)

## Next up

- **Batch 3 build day, whenever Megan schedules it** — foreman pattern, she
  dispatches each session with /go. Everything a session needs is in
  RUN-PLAN-BATCH3.md; the spec is GQ-BATCH3-DESIGN.md. Session order: Vind die
  vergelyking (includes the randParabola generator tidy-up) → Aard van wortels →
  Ongelykhede 2 → Soek die fout → Eksamenmodus rebuild (which removes the
  sheetHypLine p = 0 exemption from the §22 scan). Ship one at a time,
  phone-test between.
- **Uncommitted work from 2026-08-14 sitting in the working tree**: the
  regenerated AFRIKAANS-TEKS.md, tools/extract_af.py, the two batch-3 docs, the
  "links of regs" fix in q1-discover.js, and this file. Run verify (three-run
  bar, mind the cache discipline) before committing; the string fix needs no SW
  bump on its own but WILL need one if it ships alone.
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
verify.html is the harness — all 162 must pass, same total three runs in a row,
before any commit.

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
  engine/interactive.js      pointDrop · curtain · climb · signPaint · cutSockets ·
                             sweep(+plain/open) · comparePaint · axisGate · tapReveal
  quests/_shared.js (mc dedupes options) · _graphs.js (windowFor: square-grid, returns
                    null → regenerate; generators self-constrain) · _intervals.js
  quests/q1-discover.js · q1b-discover2.js · qB-recognize.js · q2-point.js ·
         q3-region.js · q5-signs.js (board method: cutSockets → signPaint) ·
         q6-compare.js · qL-lengths.js · qG-gradient.js · qT-transform.js ·
         q7-exam.js      ← map order; screens.js exports questUnlocked()
supabase/schema.sql   written, not run
verify.html           the harness: 162 checks, deterministic count — §4b (shared
                      mostlyInFrame) + §22 real-spec off-axis + banned words incl.
                      titles/blurbs/intro caps + groups 14–23's fix-day guards
                      are never-relax rules
sw.js                 network-first for code; SHELL precache; CACHE = gq-v19
```
