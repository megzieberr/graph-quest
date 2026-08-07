# Graph Quest — brief (working title; Megan may rename)

Gamified graph-reading trainer for **functions interpretation**. Same "brainwash the seeing"
philosophy as Circle Quest: the learners know the theory but cannot read graphs, so every quest
drills one specific *seeing* skill until exam phrasing triggers it automatically.

Planned 2026-08-07 with Fable (planning session). This brief is the spec — build session follows
the **new-quest-app** skill for scaffolding/Supabase/deploy mechanics, and this file for content.
Build authorization: Megan hands this brief to an Opus session; normal execution gate applies.

## Two deployment targets (build in this order)

1. **Standalone page** — for Megan's Grade 12 Technical Mathematics learner (Afrikaans,
   Graad 12 Tegnies). Own URL, own login. Content INCLUDES semicircles (a Tech Maths signature).
   She will NEVER get blipwork access; her progress here is permanent for her, standalone forever.
2. **Blipwork section** — later, the same engine mounts into blipwork
   (megzieberr.github.io/blipwork, IEB Gr11s) as a full section in **blipwork's existing visual
   theme**. Content EXCLUDES semicircles (IEB Gr11 doesn't do them). Gr11 progress starts fresh
   inside blipwork's own backend (homework-hub Supabase) — no migration from standalone.

Because of target 2, build the whole thing in **blipwork's visual language from day one** (no new
theme, no frontend-design pass). Engine must be a self-contained ES module the blipwork shell can
mount later; the standalone target is a thin shell page around the same module.

**Semicircle content must be flag-gated** (e.g. per-question `techOnly: true`) so the blipwork
mount simply filters it out.

## Content scope

- Graphs: **straight line, parabola, hyperbola (a/x + q), exponential (a·bˣ + q)** for everyone;
  **semicircle (√(r²−x²)) standalone/Tech-Maths only**. No cubics.
- Every question stored **bilingual**: `en` and `af` fields side by side (Re:Lefela pattern), with
  a language toggle. Afrikaans exam register matters — use the real verbs:
  *definisieversameling* (domain), *waardeversameling* (range), *afsnitte* (intercepts),
  *asimptoot*, *stygend/dalend*, "Vir watter waardes van x is …".
- Question style reference (fresh questions, never copy):
  `C:\Users\megzi\Desktop\Wiskunde Boekies\2026\Graad 12 Tegnies\Werkkaarte\Funksies\funksies-grafieklees.tex`
  — read it; the vb. 1–8 structure there is the exam shape we're training toward.
- Diagrams: **to-scale rendering engines** (house rule) — plot real functions on a real coordinate
  system (SVG or canvas), never hand-placed sketch approximations. Points, asymptotes and
  intercepts must sit where the maths puts them.

## The five quests (order matters — each is a tool for the next)

### Quest 1 — Which axis? (x vs y mix-ups)
Pure pattern recognition, zero calculation, quick-fire with many reps. An exam phrase flashes and
the learner taps **x** or **y** (or drags along the correct axis):
"die grafiek sny die x-as…", "vir watter waardes van x…", "skryf die waardeversameling neer",
"die y-afsnit", "definisieversameling", etc. Include the domain-vs-range confusion explicitly:
*definisieversameling* → x-axis, *waardeversameling* → y-axis.
Second round type, slightly deeper: phrase → tap what you'd DO ("stel y = 0", "stel x = 0",
"lees af tussen die asimptote", …).

### Quest 2 — Point-drop (P(5; k) lies on f)
A point hovers at a fixed x, locked to that vertical line. Learner drags it up/down until it
**snaps onto the curve**; the y-value reveals. Then the app demands the same number by algebra
(substitute, simplify — multiple-choice or structured input, incl. surd form for semicircles:
"laat jou antwoord in wortelvorm"). Reverse rounds: point locked to a horizontal line, x unknown.
Core idea being trained: "lies on the graph" MEANS the coordinates satisfy the equation, so one
coordinate buys the other.

### Quest 3 — The curtain (domain & range)
A boundary line sits on the graph (e.g. y = 2, or the asymptote y = −4). Learner pulls a
shade-curtain up or down from it; the parts of the graph inside the shade light up. They SEE
"the graph lives above this line" before writing y ≥ 2, and the app only accepts the inequality
sign matching what they shaded. Vertical-line version for domain. Semicircles are gold here
(both domain and range finite: −r ≤ x ≤ r, 0 ≤ y ≤ r — both signs must be chosen).
Asymptote sub-skill: drag the dashed asymptote lines onto hyperbola/exponential graphs first;
range then reads off the asymptote + curtain side (strict inequality — never includes the
asymptote value).

### Quest 4 — The climb (increasing/decreasing) — headline mechanic
A point on the curve the finger can push **ONLY left to right**. Backward drag is ignored; a
reset button restarts at the left edge. The finger must stay ON the point (tolerance radius) or
the drag drops — so the hand physically rises and falls while moving right; that's the feel we
want. Live indicator: climbing ⬆ / descending ⬇, optional vibration on direction change
(navigator.vibrate, Android). After walking the curve, the interval questions come — the learner
has just *felt* the answer. Include *stygend/dalend* reason-taps for exponentials (tap answer,
then tap the reason about a and b — no free text).

### Quest 5 — Inequalities (Megan's method, exactly — do not substitute a textbook method)
Her method in three moves, each a stage the learner physically performs:

- **Stage 1 — f(x) is just the y-value.** Tap anywhere on a curve → a vertical bar drops from
  the x-axis to the curve; that bar IS f(x). Rounds: "by x = 3, is f(x) positief, negatief of
  nul?" — the bar shows it. f(x) > 0 means "the bar points up".
- **Stage 2 — sign-painting** (for f(x) > 0, f(x)·g(x) ≤ 0). Learner paints **+** and **−**
  marks along each curve section, exactly as Megan does on the board; app validates against the
  real graph. Products use her "tekens verskil" rule: per section, do the two signs match
  (product +) or differ (product −)? Answer is read straight off the painted sketch.
- **Stage 3 — cut lines + the sweep** (for f(x) > g(x), f(x) < g(x)). Learner places vertical
  cut lines themselves; the app enforces her rule: **a line through EVERY intersection AND EVERY
  asymptote**. Forgetting the asymptote line is *the* classic error — the app must catch exactly
  that ("jy kort 'n grens…"). Sections auto-number ① ② ③ ④. Then a scan line draggable **only
  left to right** (same muscle as Quest 4); in each section the learner answers "watter grafiek
  lê bo?" before moving on. The interval answer assembles itself section by section, left to
  right.
- **Stage 4 — writing it down.** Notation as its own skill: < vs ≤ at each boundary, joining
  with "of"/"or", answers always ordered left to right (only left-to-right orderings accepted),
  and the hyperbola trap: **an asymptote's x-value is NEVER included, even in a ≤ question**.

### Cross-quest round types
- **"The graph is the boss"** — algebra yields two solutions (e.g. semicircle ∩ line gives
  x = 3 and x = −4); the sketch rejects one. Learner taps which one survives and why (reason-tap).
  Blipwork variant without semicircles: hyperbola ∩ line where a solution falls outside a shown
  restricted domain, or similar — keep the round type, swap the graph.
- **Exam mode** — unlocked after all five quests: full vb.-style mixed sets, one sketch, ~6
  sub-questions crossing all skills (the transfer test; doubles as daily-challenge content later).
- **Interleaving** — after each new quest, mixed rounds fold in earlier skills (spaced practice).

## Game logic

Circle Quest bones: rounds per quest, XP, streaks, hints, Boost mode after repeated fails
(auto-hints + second chances + comeback bonus), "I don't get it" stuck-taps visible to Megan,
replay-for-half-XP, admin view of per-round progress. Reuse the proven logic/patterns, not the
skin. Answers that involve intervals/signs are tap/drag-built, never typed free text.

## Tech + architecture (defaults from the new-quest-app skill, plus specifics)

- Static ES-module site, no build step; PWA (manifest, icons, versioned service-worker cache,
  `.nojekyll`, relative paths). Phone-first; she plays on Android.
- **Engine as a mountable module** (`js/engine/…`) with the standalone shell in `index.html`;
  blipwork integration later imports the same module. Question bank data-driven
  (one JS/JSON file: id, graph spec(s), quest type, `techOnly` flag, `en`/`af` text, answer spec).
- Local-first: `js/local-backend.js` + `?local=1`; build and verify everything offline first.
- Supabase (standalone target): **class-ready RPC model from day one** — username + password via
  SECURITY DEFINER RPCs (maths-quest pattern, teacher never sees passwords), RLS on, NO direct
  table policies, all writes through RPCs. Known traps (all bitten before): no `.upsert()`
  against partial unique indexes (42P10 → find-then-write + error toasts); column-level grants —
  every new column needs its own grant; privilege-escalation test with a throwaway account.
  Megan runs all SQL herself in the dashboard — give her the file + click-by-click steps, wait
  for confirmation. `supabase/schema.sql` idempotent + seeded closed; real names/passwords never
  in the repo (repo is public for Pages).
- Verification: browser pane never fires rAF and screenshots time out — verify via JS/DOM
  evaluation (measure the rendered geometry, dispatch PointerEvents programmatically to test the
  drag clamps). Add a `verify-*.html` headless check for the graph engines (house rule).
- Deploy: public GitHub repo `megzieberr/<name>`, Pages from main/root. launch.json entry goes in
  the NESTED file `C:\Users\megzi\.claude\.claude\launch.json` (next free port; 5180–5201 mostly
  taken).
- Write `PROJECT-STATUS.md` (catchup format) at session end.

## Open items

- App name: "Graph Quest" is a placeholder — Megan names it (bilingual-friendly).
- Blipwork mount is a SEPARATE later job (own go-ahead): section registration, homework-hub
  Supabase tables/RPCs, XP-economy hookup, semicircle filter, service-worker bump on blipwork.
- Left-to-right drag details worth play-testing with the Gr12 learner early: tolerance radius for
  "finger on point", whether backward drag ignoring feels fair, vibration on/off.
