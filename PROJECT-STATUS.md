# Project status — updated 2026-08-09 (evening, Fable design day)

**Read this first, then [RUN-PLAN.md](RUN-PLAN.md).** The full v1 spec is [BRIEF.md](BRIEF.md);
Megan's own 59-page class notes are digested at
[reference/GR11-FUNCTIONS-NOTES-DIGEST.md](reference/GR11-FUNCTIONS-NOTES-DIGEST.md) — they
are the content canon.

## Where we are

- **v1 is condemned; a full rebuild starts 2026-08-10.** Her verdict on v1 (a one-session
  Opus build): "no value outside the game itself." v2's goal: train SEEING and
  interpreting graphs so the skill transfers to paper, like Circle Quest transferred.
- 2026-08-09 was the **design day** (Fable foreman + Megan, round-by-round). Output:
  `RUN-PLAN.md` — THE LAW (no algebra, square-grid engine, scaffold-on-error, her +/−
  painting method, no-spoilers discovery) + 5 numbered session prompts for batch 1.
- The graph-unreadability mystery is SOLVED and measured (probe results + 3 root causes
  in RUN-PLAN session 1): `windowFor`'s fitY sampler is a ratchet, the aspect fix never
  converges, and the objective (contain, not show) is wrong. Median parabola round:
  1,5 px per y-unit. Session 1 rebuilds it on the square-grid principle.
- v1 stays live at <https://megzieberr.github.io/graph-quest/> untouched until batch 1
  ships (build sessions commit locally, ONLY the foreman pushes — push = deploy).
- Target order unchanged: Gr12 Tech Maths learner plays the finished v2 first
  (semicircles ON) → feedback → semicircles OFF → rounds into blipwork for the Gr11s.

## Decisions

(append-only; older v1 decisions kept for the record)

- 2026-08-07: name **Fun Functions**; blipwork theme from day one; computed answers only;
  to-scale engine + verify; max 4 options; decimal comma + real minus; semicircles
  flag-gated; quests 5/6 encode her board method (tekentabel).
- 2026-08-08: presentation faults she caught became verify §4b checks — never relax them.
- **2026-08-09: FULL REBUILD (foreman pattern).** Design day rulings:
  - **NO ALGEBRA in the game — interpretation only.** Reading a number off the picture is
    in; producing one by working (solve for a, −b/2a, top−bottom) is out.
  - **TEKENTABEL retired** (supersedes the 2026-08-07 q5/q6 decision): her board method
    is now cut lines + **+/− painted on each curve per section**. Her own Gr11 notes
    (the 59-page PDF) show the method and are canon.
  - **Square-grid engine rule**: sx = sy, zoom clamped, identity features centred; if
    features don't fit, regenerate the curve — never zoom out. Semicircle handling stays.
  - **Scaffold-on-error**: clean exam-look picture by default; highlights only after a
    wrong answer. Boost layer stays.
  - **Discovery rounds** (sliders per variable, q-vs-c contrast) follow Circle Quest's
    no-spoilers rule: learner commits to the conclusion; the app never announces it first.
  - No sentence input anywhere (chips / keypad / taps / option lists only — AI marking
    costs money). No sketching mechanic; error-spotting rounds instead (ja/nee → why).
  - Same repo + URL; rebuild in place. She plays the whole thing only when done.
  - Batch 1 = engine fix → discovery sliders → equation-only recognition → basic region
    reading → f-above/below-g scan line. Both Megan AND the foreman review every session
    before the next dispatches.

## Pending on Megan

1. 📱 1 min: **[blocking, tomorrow at kickoff]** answer RUN-PLAN's 3 confirm questions —
   native sliders vs GeoGebra? · sockets return later? · axis-of-symmetry TP-form only?
2. 💻 2 min: [whenever, before session 2 runs] share/point to the GeoGebra applets so the
   discovery beats can copy what they show.

## Next up (tomorrow, 2026-08-10 — build day, foreman pattern)

1. Fable session: /catchup on fun functions → confirm the 3 kickoff questions.
2. Dispatch **session 1 (engine, Opus)** from RUN-PLAN.md. Foreman reviews diff + plays
   rounds; Megan eyeballs graphs. Both approve → dispatch session 2.
3. Continue through sessions 2–5 the same way. Ship decision (push + SW cache bump)
   happens in the foreman session only, with her explicit yes.

## How to run it

```bash
python -m http.server 5207 --directory "C:\Users\megzi\Desktop\Claude Code Projects\graph-quest"
```

Then <http://localhost:5207/>. Preview entry `graph-quest` (port 5207) in the nested
`C:\Users\megzi\.claude\.claude\launch.json`. `?local=1` forces local save mode;
`verify.html` is the harness — all checks must pass before any commit.

⚠ The service worker caches app code: if a change doesn't appear, unregister the SW and
delete the `gq-*` cache. Stale modules have lied to the harness twice.

## The deploy pipeline (unchanged)

1. verify.html all-pass → 2. bump `CACHE` in `sw.js` → 3. `git add -A && git commit -F
<file> && git push` (push = deploy, ~1 min) → 4. check live → 5. phone: fully close +
reopen the PWA. Supabase is a separate hand-run pipeline (schema written, NOT run;
login screen still unbuilt — parked until after the rebuild).

## Map of the code

```
index.html            shell
css/styles.css        blipwork "System Window" theme + .iv-* interactive classes
js/
  app.js · play.js · screens.js · i18n.js (B/L bilingual) · check.js (fmtComma)
  funclib.js          ALL the maths — every answer computed here
  backend.js          local + cloud behind one interface (cloud unused, no login yet)
  engine/function-graph.js   the one affine map + verify()  ← session 1 rewrites windowFor
  engine/interactive.js      pointDrop · curtain · climb · signPaint · cutSockets · sweep
  quests/_shared.js · _graphs.js (windowFor lives here) · _intervals.js · q1…q7 (v1,
                      being replaced batch by batch)
supabase/schema.sql   written, not run
verify.html           the harness; §4b = her caught-fault rules — never relax
```

v1 quest content (the seven-quest table, teach-layer notes) is now historical — see git
history of this file if needed. The teach-layer PATTERNS (hint ladder, misconception
nudges, method cards, Boost) carry into v2 rounds.

---
Probe artefacts from the design day (window-readability measurements):
`scratchpad …\gq-probe\probe.mjs` — RUN-PLAN session 1 says to port this into verify.
