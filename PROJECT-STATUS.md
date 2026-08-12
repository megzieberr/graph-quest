# Project status — updated 2026-08-12 (her wording pass + two fixes she caught playing)

**Read this first.** The v2 spec is [RUN-PLAN.md](RUN-PLAN.md); Megan's own class notes
are digested at [reference/GR11-FUNCTIONS-NOTES-DIGEST.md](reference/GR11-FUNCTIONS-NOTES-DIGEST.md).

## Where we are

- **Batch 1 of the v2 rebuild is COMPLETE and DEPLOYED** (overnight 2026-08-11→12,
  Megan's explicit authorization: sessions run one at a time, each foreman-reviewed —
  code, fresh harness runs, AND rendered-graph inspection — before the next started).
- The app now has **8 quests**: Ontdek (parabola discovery sliders) · Ontdek 2
  (line/hyperbola/exp discovery) · Vinnige Oë (equation-only recognition, Round B) ·
  Lees die gebied (Round C: climb, above/below, domain/range axis-tap, sub-in reading) ·
  Op die grafiek (v1 q2, kept) · Plus en minus (v1 q5, kept) · Bo of onder (Round D:
  pre-drawn cuts, +/− stamping, scan line) · Eksamenmodus (v1 q7, kept).
- v1's q1-axis / q3-curtain / q4-climb / q6-sweep are retired and deleted.
- **verify.html: 81 checks, ALL PASS** — grown from 40, now covering the square-grid
  window engine, slider mechanics read back off the SVG against funclib, no-spoilers
  wording, her "drag/sin" rulings, frozen-asymptote visibility, full-hand options,
  sub-in point containment, Round D cut-line exactness and scaffold gating.
- Progress saves are still on-device only (Supabase schema written, NOT run; no login
  screen). Nobody but Megan has the app yet.
- **2026-08-12 session: all of her Afrikaans wording is in the code**, plus three
  things she caught play-testing on her phone — the hyperbola "vlerkie" question,
  the glued "1of2" join word, and the one-way scan line. All LIVE on gq-v9,
  verified against the deployed files, not just locally. She played through and
  said it looks great.
- **2026-08-12 evening: her three batch-1 rulings are in, and BATCH 2 IS BUILT
  AND SHIPPED.** The map now has **11 quests** — Lengtes, Gemiddelde gradiënt
  and Transformasies joined between Bo of onder and Eksamenmodus. verify.html
  is at **113 checks, all passing**. sw CACHE `gq-v12`. Foreman was Opus this
  run (her call), two Sonnet build sessions dispatched from the foreman session
  itself rather than pasted by hand — also her call.

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

## Pending on Megan

1. 💻 5 min: [whenever] **name the three new quests.** They shipped with working
   names — "Lengtes", "Gemiddelde gradiënt", "Transformasies". Say the word and
   they change.
2. 📱 10 min: [whenever] **play the three new quests** and say whether they are
   at the right place on the map (they sit between Bo of onder and Eksamenmodus).
3. 💻 2 min: [whenever] **two rulings waiting**: should quest 5 be reworked off
   the tekentabel onto your board method (about one build session), and should
   the old `randHyperbola()` stop allowing p = 0 for the batch-1 quests (it
   touches every quest already built and reviewed with it)?

## Next up

- The wording correction session is DONE (2026-08-12): 46 of her edits + 34 sweep
  swaps mapped into 8 source files, 81/81 harness checks pass, map read at 375 px
  with no overflow. The workflow held — do it this way again, and regenerate
  AFRIKAANS-TEKS.md after any session that adds strings.
- **Batch 2 is DONE and LIVE.** Her three rulings, both new-quest sessions and
  both foreman review fixes shipped on 2026-08-12.
- **First thing next session: her three Pending items above** — the quest names,
  a playtest of the new three, and the two rulings. Batch 3 should not be specced
  before the quest-5 ruling in particular, because that rework competes with new
  topics for the same session.
- **DECISION WAITING: quest 5 vs her board method.** Quest 5 still builds the
  tekentabel she dropped on 2026-08-09 — a rework of the intro lesson, the
  singleSign/productSign rounds and the harness checks that assert the table.
  Roughly one build session. Do NOT touch its blurb alone: "lyne, tabel, lees af"
  describes the quest accurately today, and rewording it would hide the problem.
- **DECISION WAITING: `randHyperbola()` and p = 0.** The batch-2 quests draw
  through `randHyperbolaOffAxis()`, but the batch-1 quests still use the raw
  generator, which puts a vertical asymptote on the y-axis a third of the time.
  Changing it touches every quest already built and reviewed — her call.
- **Known harness wobble** (pre-existing, not from batch 2): the total count
  varies 112/113 between runs because a §4 check skips a quest when a random
  6-round draw happens to contain no interactive item. fail is always 0. Worth
  tightening so the count is stable and nothing can hide in the skip.
- Still parked for a later batch: finding equations · nature of roots (both drift
  toward algebra — they need a design pass first) · the full inequalities batch
  (learner-placed cut lines return, engine work) · error-spotting ·
  **eksamenmodus rebuild LAST**, once every new skill exists for it to sample.
- Then per RUN-PLAN "parked for later batches": transformations, finding equations,
  lengths, full inequalities batch (learner-placed cut lines return), nature of roots,
  average gradient, error-spotting, eksamenmodus rebuild.
- After all batches: login screen + Supabase, then the blipwork mount
  (`setSemicircles(false)`).

## How to run it

```bash
python -m http.server 5207 --directory "C:\Users\megzi\Desktop\Claude Code Projects\graph-quest"
```

Then <http://localhost:5207/> (`?local=1` forces local save mode). Preview entry
`graph-quest` (port 5207) in the nested `C:\Users\megzi\.claude\.claude\launch.json`.
verify.html is the harness — all 81 must pass before any commit.

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
         q3-region.js · q5-signs.js · q6-compare.js · qL-lengths.js ·
         qG-gradient.js · qT-transform.js · q7-exam.js      ← map order
supabase/schema.sql   written, not run
verify.html           the harness: 113 checks — §4b + frozen-asymptote +
                      containment + Round D exactness + §10's rulings/asymptote
                      guards are never-relax rules
sw.js                 network-first for code; SHELL precache; CACHE = gq-v12
```
