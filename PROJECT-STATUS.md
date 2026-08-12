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
  said it looks great. She did NOT rule on the three open batch-1 questions below.

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

## Pending on Megan

1. 📱 5 min: **[blocking, this is what batch 2 waits on]** three calls, from playing it:
   does "Op die grafiek" belong before "Lees die gebied"? do Vinnige Oë and the
   notation skill stay? should Round D always offer the second chance, not only in Boost?
2. 💻 3 min: [whenever] three word calls I made for her — say if any is wrong:
   the climb says "Skuif" while the sliders say "Trek"; "Beweeg dit op of af?" where
   she wrote "opwaarts" in the twin line; two "ry/gereis" lines changed to "skuif".
3. 💻 2 min: [whenever] circle-geometry-game has 34 unpushed commits → run /ship there.

## Next up

- The wording correction session is DONE (2026-08-12): 46 of her edits + 34 sweep
  swaps mapped into 8 source files, 81/81 harness checks pass, map read at 375 px
  with no overflow. The workflow held — do it this way again, and regenerate
  AFRIKAANS-TEKS.md after any session that adds strings.
- **Batch 2 is NOT specced yet, on purpose** — she asked on 2026-08-12 and the answer
  stands: get her three rulings (Pending item 1) first, then pick the next few topics
  off the parked list below and write the plan. She has not said how big a batch she
  wants either. Ask both before writing anything.
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
  quests/q1-discover.js · q1b-discover2.js · qB-recognize.js · q3-region.js ·
         q2-point.js · q5-signs.js · q6-compare.js · q7-exam.js
supabase/schema.sql   written, not run
verify.html           the harness: 81 checks — §4b + frozen-asymptote + containment
                      + Round D exactness are never-relax rules
sw.js                 network-first for code; SHELL precache; CACHE = gq-v9
```
