# Project status — updated 2026-08-12 (overnight foreman run, batch 1 SHIPPED)

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
- **verify.html: 78 checks, ALL PASS** — grown from 40, now covering the square-grid
  window engine, slider mechanics read back off the SVG against funclib, no-spoilers
  wording, her "drag/sin" rulings, frozen-asymptote visibility, full-hand options,
  sub-in point containment, Round D cut-line exactness and scaffold gating.
- Progress saves are still on-device only (Supabase schema written, NOT run; no login
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

## Pending on Megan

1. 📱 15 min: **[blocking, morning]** play-test the new app on your phone — fully close
   + reopen the PWA first (stale-icon/cache rule) — the whole point of the overnight run.
2. 💻 2 min: [whenever] circle-geometry-game has 18 unpushed commits → run /ship there.

## Next up

- Her playtest verdict drives the next foreman day: wording tweaks, map order (Op die
  grafiek now sits AFTER Lees die gebied — run-plan order, easily swapped), whether
  Vinnige Oë / notation stay, Round D retry behavior.
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
verify.html is the harness — all 78 must pass before any commit.

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
verify.html           the harness: 78 checks — §4b + frozen-asymptote + containment
                      + Round D exactness are never-relax rules
sw.js                 network-first for code; SHELL precache; CACHE = gq-v6
```
