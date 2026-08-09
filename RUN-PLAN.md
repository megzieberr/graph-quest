# Fun Functions v2 — REBUILD RUN PLAN (batch 1)

Designed 2026-08-09, Megan + Fable (foreman). Build day: 2026-08-10.
Megan dispatches each numbered session herself; the Fable foreman session reviews the
diff AND plays the result in a browser after each one; **Megan and the foreman must both
approve before the next session is dispatched.**

Read this whole file before touching anything. Also read:
- `PROJECT-STATUS.md` — current state
- `reference/GR11-FUNCTIONS-NOTES-DIGEST.md` — Megan's own 59-page class notes, the
  content canon (her vocabulary section especially)

## Why a rebuild

v1 was a one-session build. Megan's verdict: "a typical educational game that has no
value outside the game itself." v2's single goal: a Gr11/Gr12 learner opens a past paper
and the sketch talks to them. The game trains **seeing and interpreting graphs** — like
Circle Quest trained circle geometry, and it transferred.

## THE LAW (applies to every session — violations fail review)

1. **NO ALGEBRA. Interpretation only.** Typing a number you READ off the picture
   (the asymptote's −2, the k in (2;k)) is interpretation — allowed. Producing a number
   by WORKING (solve for a, top minus bottom, −b/2a) is algebra — banned from the game.
   Their books own algebra; the game owns the eyes.
2. **No sentence input, ever** (free text needs AI marking = money). Answers are: taps
   on the picture, drags, chips, a number keypad, or an option list. Max 4 options.
3. **Square-grid engine rule** (built in session 1): one scale for both axes, bounded
   zoom, identity features centred. No graph may ever be squashed or needle-thin again.
4. **Her board method**: cut lines through every x-intercept / asymptote / intersection;
   **+ and − painted on each curve per section**. The TEKENTABEL is retired (her ruling
   2026-08-09 — she changed methods when learners struggled). Never rebuild a sign table.
5. **Her vocabulary** (digest §vocabulary): happy/sad, opstyg/land (taking off/landing),
   above/below the asymptote, quadrant signs for x·f(x).
6. **Scaffold-on-error**: the default picture looks like an exam paper (clean). Helping
   highlights/shading appear only AFTER a wrong answer. (v1 gave everyone the scaffold
   always — that was backwards.)
7. **Discovery rounds follow the Circle Quest no-spoilers rule**: the screen shows the
   raw effect; the LEARNER commits to the conclusion from options; the app never
   announces the conclusion first.
8. Bilingual en/af side by side in the same generator; decimal comma + real minus sign
   (−) via fmtComma; every answer computed in `funclib.js`, decoys filtered by value;
   every diagram through `specFor()` + verify.
9. Semicircles stay flag-gated (`CONTENT.semicircles`) — ON for the Gr12 Tech Maths
   learner, OFF later for the blipwork mount.
10. **Do not push to GitHub.** Commit locally per session (git commit -F <file>, never
    -m). The foreman pushes only after review — pushing IS deploying on this repo.
    Do not bump the SW cache; the foreman does that at ship time.
11. End your session with: verify.html result (all must pass), a 5-line handoff note in
    chat (what you built, what you're unsure of), and files committed.

## Confirm with Megan at kickoff (3 small open questions)

- a) Discovery sliders built natively in our engine (recommended; her GeoGebra applets
  serve as the spec) — or embed GeoGebra?
- b) Round D pre-draws the cut lines. Do learner-PLACED cut lines (v1's sockets) return
  as a later round in the inequalities batch? (Foreman recommends yes, one round.)
- c) Round B scope: axis of symmetry from TP-form only (x = p, pure seeing);
  −b/2a stays out of the game entirely per Law 1. Confirm.

---

## SESSION 1 — Engine: square-grid windows + verify teeth  (model: Opus)

The foundation. Nothing else builds until this passes.

Problem (measured 2026-08-09, probe in scratchpad `gq-probe/probe.mjs`): `windowFor` in
`js/quests/_graphs.js` produces unreadable windows — median parabola round has ~1,5 px
per y-unit (needle spike, no visible arms), 100% of parabola rounds squashed >1,5:1,
TP pressed against the frame edge in 57%. Three faults: (1) the `fitY` sampler is a
RATCHET — its ±6 clamp is per sample across 61 samples, so one pass can grow the window
by hundreds of units; (2) the aspect fix runs once and `widen()` re-runs `fitY`, breaking
what it fixed, with no convergence loop; (3) wrong objective — it tries to CONTAIN the
curve instead of SHOWING its identity. Semicircles (the one special-cased shape) score 0%
failures — proof the fixed-shape approach works.

Build:
1. Rewrite `windowFor` on the **square-grid principle**: `sx === sy` exactly (one px per
   unit value for both axes). Zoom clamped to ~[20, 45] px/unit on the 360×300 canvas —
   i.e. the window is at most ~16 × 13 units, at least ~8 × 6,6.
2. Window is placed to CENTRE the identity features, family by family:
   parabola = TP + both roots + y-int, with ≥1 unit of visible arm-rise past the TP on
   both sides; hyperbola = asymptote cross centred-ish + both branches' near-elbows +
   intercepts; exp = asymptote + y-int + the bend (the region where |y−q| goes from
   <0,5 to >2); line = both intercepts; semicircle = keep current behaviour (it works).
   Pairs: union of both curves' identity features + all intersections (callers already
   pass `include:`).
3. If the identity features do NOT fit inside the max window: **do not zoom out —
   return null and let the generator regenerate a smaller curve.** Re-constrain
   generators accordingly (e.g. cap parabola |yTP| ≤ 8, hyperbola |a| ≤ 6, exp |q| ≤ 8 —
   tune until <1% regeneration failures).
4. Curves exit the frame honestly: clip as now, and add small arrowheads where a curve
   leaves the frame (like a hand sketch). Axis arrows already exist.
5. Delete the fitY ratchet entirely.
6. New verify checks (add to verify.html §4b, never relax): sx === sy; px/unit within
   [18, 47]; parabola TP ≥ 8% of window from every edge; every identity feature inside
   the window; for each family one hundred random specs pass these.
7. Port `probe.mjs` into a verify section (window statistics over 500 random rounds per
   scenario) so regressions are visible.
8. Run verify.html — ALL checks pass. Play 10 rounds of surviving v1 quests in the
   browser and LOOK at them (readable? square blocks? nothing cropped that matters?).
   Commit locally. Do not push.

## SESSION 2 — Discovery mechanic + parabola discovery rounds  (model: Opus)

Round type A. New interactive mechanic: **variable sliders** on a live graph, in the
style of `engine/interactive.js` (pointerdown/move/up, no external libs; browser-pane
note: no rAF — use direct event-driven re-render).

Flow per discovery beat (Circle Quest discovery style, Law 7):
1. Graph + ONE slider (other variables frozen). Prompt names the move, not the finding:
   "Sleep a. Wat gebeur?" Learner must actually drag through the range to unlock step 2
   (like v1's interaction gates).
2. Learner commits to the conclusion from ≤4 options, e.g. a-sign → "arms op (happy) /
   arms af (sad)"; a-size → "arms nader aan mekaar / verder uitmekaar".
3. Method card afterwards states the settled fact (this is the ONLY place the app says
   it), bilingual.

Parabola beats (this session): TP-form `a(x−p)²+q`: sign of a; size of a; p (opposite
sign!); q. Standard form `ax²+bx+c`: c beat. Then the **q vs c contrast**: two panels,
same parabola in both forms — drag q (whole graph + TP rides), drag c (what c pins is
the y-cut). Learner concludes: "q = y van TP; c = y-afsnit" from options.
All sliders snap to whole numbers / halves; all rendering through the session-1 engine.
Wire a "Ontdek" quest into the map replacing v1's q1 slot content (keep the quest-map
plumbing; old q1 file is retired when its replacement lands in session 4).
verify.html: add checks — slider mechanic mounts, stays locked until dragged through
range, re-renders match funclib values at every slider stop. All pass. Commit locally.

## SESSION 3 — Discovery: line, hyperbola, exponential + Round B recognition  (model: Sonnet)

Reuse session 2's mechanic exactly — no new mechanic code.

Discovery beats: line (m sign, m size, c); hyperbola `a/(x−p)+q` (sign of a → which
corners; p → vertical asymptote rides; q → horizontal asymptote rides; the asymptote
cross drawn dashed, ALWAYS); exponential `a·bˣ+q` (a above/below; b opstyg/land —
include b through (0;1)…(1;∞) but keep b>0; q rides the asymptote).

Round B — **equation-only instant recognition** (no graph drawn, speed-round format,
generous reps): flash an equation from any family → "Waar is die horisontale asimptoot?"
/ "vertikale asimptoot?" / "simmetrie-as?" → answer as chips/keypad `y = −2`, `x = 1`,
or the first-class option **"geen"** ("dis 'n parabool — geen asimptoot nie").
Axis of symmetry: TP-form only (x = p) pending Megan's kickoff confirmation (c).
Every answer computed from the curve object; decoys by value (the classic swaps:
x/y flipped, sign flipped, p vs q confused). verify: generators for every family,
notation wrapped in .eq, no "geen" round whose curve HAS the asked feature. Commit.

## SESSION 4 — Round C: basic region reading  (model: Sonnet)

One graph, ONE thing to look at, many reps. Four sub-rounds:
1. **Increasing / decreasing** on the sliding point — reuse v1's climb (one-way
   left→right drag, backwards silently ignored). Learner rides the point, then answers
   in chips: "x < p" / "x > p" (chips supply x, <, >, ≤, ≥, numbers, "of").
2. **Above / below the x-axis** (f>0 / f<0 basic): clean sketch, answer from
   list/chips. Never sample a question at a root (v1's on-axis rule stands).
3. **Domain and range axis-tap**: before options appear the learner must tap the AXIS
   the answer lives on (domain → x-axis, range → y-axis); wrong axis = gentle bounce.
   Then the curtain (v1 q3 mechanic, kept) confirms the sweep; answer in chips with
   ≠ / ≥ as needed.
4. **Sub-in reading**: "(2;k) lê op f" — tap x=2 on the sketch, dashed drop-lines
   appear, k on the keypad (reading, not computing: the point is marked).
Families mixed from the start (incl. semicircles behind the flag). Hint ladder +
misconception nudges per v1's teach-layer pattern. verify: all pass. Commit. Retire
v1 q1/q3/q4 files as their replacements land here.

## SESSION 5 — Round D: f above / below g  (model: Sonnet)

The clean-picture comparison round (replaces v1 q6; retire q6 file):
1. Two curves, intersections marked. The GAME pre-draws the vertical cut lines through
   every intersection (and asymptote where relevant) — learner does not place them
   in this round.
2. Learner marks each section + or − (tap to stamp onto the picture: is f above g
   here?). Her +/− painting move, Law 4.
3. Learner drags ONE scan line left→right through the picture — no shading, no
   highlighted regions, just the line and their eyes.
4. Answer: the x-interval(s) picked from a list (≤4 options, decoys by value: flipped
   inequality, y-values instead of x, missing "of" branch).
5. **On a wrong answer only**: the highlighting/shaded-region scaffold switches on and
   the round is retried at half marks (Boost rules apply after 2 fails, as in v1).
verify: pre-drawn lines exactly at computed intersections/asymptotes; stamp state
matches sign of f−g per section; scaffold hidden by default, shown only after error.
All pass. Commit locally. Foreman review → batch-1 ship decision with Megan.

---

## Parked for later batches (reshaped to Law 1 — no algebra)

- Transformations: ghost-graph drag, equation rewrites live; reverse "pick the move".
- Finding equations: "wat gee die skets vir jou?" → choose the FORM → tap the values
  off the sketch into its slots. No solve-for-a step (algebra died; reading survives).
- Lengths: which curve is on top per section; where is the gap widest (watch the
  segment sweep); vertical vs horizontal segment recognition. No subtraction.
- Full inequalities batch: learner-placed cut lines (sockets, pending kickoff (b)),
  full +/− painting, x·f(x) quadrant signs, f/g with the g≠0 open circle.
- Nature of roots: the y=k SLIDER (drag, watch 2→1→0 intersections; tangent = the kiss).
- Average gradient: two dots → chord draws → "gemiddeld = die koord".
- Error-spotting rounds woven through every batch: sketch vs equation, ja/nee → WHY
  from feature-naming options.
- Straight-lines mini-chunk; speed-sorting (equations → family cards); mixed
  end-of-chunk rounds; eksamenmodus last.
- After everything: login screen + supabase, then the blipwork strip
  (setSemicircles(false)).
