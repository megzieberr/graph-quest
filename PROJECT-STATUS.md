# Graph Quest — project status

**Read this first.** Written 2026-08-07 (Opus build session). The full spec is
[BRIEF.md](BRIEF.md) — read that for the *why*; this file is the *where things stand*.

---

## What it is, in one line

A gamified graph-reading trainer for **functions**: seven quests that teach the eyes one
job each, by making the hand do it first. Standalone app for Megan's Grade 12 Technical
Maths learner now; the same engine mounts into **blipwork** later as a section.

## LIVE: <https://megzieberr.github.io/graph-quest/>

Public repo `megzieberr/graph-quest`, Pages from `main` / root.
**Pushing to `main` IS the deploy** — no build step, no workflow, ~1 minute to go live.

## State: BUILT AND PLAYABLE. Progress saves on the device only (no login yet).

| Piece | State |
|---|---|
| All 7 quests, both languages | ✅ built |
| 6 interactive mechanics | ✅ built and driven-tested in a real browser |
| To-scale graph engine (+ semicircles) | ✅ built, verify() honest |
| `verify.html` | ✅ **34/34 checks pass** |
| PWA (manifest, icons, service worker) | ✅ built, cache `gq-v2` |
| Progress saving | ✅ local (localStorage) |
| GitHub repo / Pages deploy | ✅ **live**, verified 2026-08-07 |
| `supabase/schema.sql` | ✅ written — **NOT RUN YET** |
| Login screen | ❌ **the one missing piece** before progress can follow her between devices |
| Blipwork mount | ❌ separate later job |

---

## How to run it

```bash
python -m http.server 5207 --directory "C:\Users\megzi\Desktop\Claude Code Projects\graph-quest"
```

Then <http://localhost:5207/>. Preview entry `graph-quest` (port 5207) is already in the
nested `C:\Users\megzi\.claude\.claude\launch.json`.

- `?local=1` — force local mode (sticks via localStorage `gq.forceLocal`)
- `?nosemi=1` — preview the **blipwork content set** (no semicircles anywhere)
- `verify.html` — the test harness. **All 34 must pass before shipping.**

⚠ The service worker caches app code. While developing, if a change does not appear:
unregister the SW and delete the `gq-*` cache (this cost time once during the build).

---

## The seven quests

| # | id | Name | Mechanic | What it fixes |
|---|---|---|---|---|
| 1 | q1 | Watter waarde? | tap x / y | mixing up which value the question asks for |
| 2 | q2 | Op die grafiek | **point drop** — drag a locked point until it snaps onto the curve | "P(5;k) lies on f" |
| 3 | q3 | Die skerm | **curtain** — pull a shade from a boundary; the graph inside lights up | domain & range, and the inequality SIGN |
| 4 | q4 | Die klim | **climb** — a point that can only move LEFT → RIGHT | reading a graph right-to-left |
| 5 | q5 | Plus en minus | **cut lines → TEKENTABEL** — place the lines, fill the sign table, product row does "tekens verskil" | f(x) > 0, f(x)·g(x) < 0 |
| 6 | q6 | Watter een lê bo | **cut sockets** then **sweep** | f(x) > g(x) |
| 7 | q7 | Eksamenmodus | one sketch, all its sub-questions | transfer to exam wording |

Quests unlock in order (70% of a round marks it done).

## The teach-layer (mined from Circle Quest, 2026-08-07 — her request)

- **Hint LADDER** per question: one rung per tap, rung 1 names the move, never the answer.
- **Misconception nudges**: wrong options can carry `misc` — picking that distractor leads
  the feedback with WHY it was tempting.
- **Method cards**: `solution` lines in feedback show the steps, not just the answer.
- **Intro lessons** ("Kyk eers een saam"): q4/q5/q6 play a click-paced worked example the
  first time they open (localStorage `gq.intro.<qid>`); a failed round offers
  "Kyk weer die les".
- **Boost mode** after 2 failed attempts (`?boost=1` to preview): banner + hints auto-open
  + second chance on every MC for half marks; finally passing earns +40 comeback XP.
- q5 is now HER board order end to end: tap the cut-line sockets (decoys: turning point,
  y-axis) → numbered sections → fill the TEKENTABEL (rows per curve) → product row
  ("tekens verskil") → read the answer off the bottom row. Wrong cells go genuinely red
  (HTML, immune to the SVG-attribute CSS trap).

---

## Decisions worth not reversing

- **Quest 5 and 6 encode HER board method, not a textbook one.** Sign-painting with
  "tekens verskil" for products; cut lines through every intersection **and** every
  asymptote; a scan line swept left to right, section by section. The socket decoys in
  q6 are deliberately turning points and x-intercepts — places that must NOT get a line.
- **The climb only moves right, and a backwards drag is silently ignored** (not an error
  message). The whole point is that the wrong reading direction is *impossible*.
- **The curtain will not unlock if you sweep the wrong way** — nothing lights up. Seeing
  the empty shade is the lesson.
- **One exam round = one sketch.** `buildAll` on quest 7 exists so a round can never mix
  two pictures (it did at first; fixed).
- **Every answer is computed** in `js/funclib.js`, never hand-typed — blipwork's rule.
- **Every diagram comes from the to-scale engine** with a `verify()` that proves each
  labelled point really lies on its curve.
- **Max 4 options per question** (phone screens). Enforced in `mc()`.
- **Decimal comma and a real minus sign (−)** everywhere, via `fmtComma`.
- **Semicircles are flag-gated**: `setSemicircles(false)` removes every semicircle round
  in one call. That is the switch the blipwork mount flips.
- **Built in blipwork's visual theme from day one** (same tokens, fonts, classes) so the
  later mount needs no restyle.

---

## The deploy pipeline (how to ship a change)

1. Make the change, run `verify.html` — all checks must pass.
2. Bump `CACHE` in `sw.js` (`gq-v2` → `gq-v3`). **Skipping this is why a phone still
   shows the old version.**
3. `git add -A && git commit -F <message file> && git push` — that is the whole deploy.
   (Use `-F`, not `-m`: double quotes break on her Windows PowerShell.)
4. Wait ~1 minute, then check the live URL.
5. On the phone: fully close and reopen the installed app, sometimes twice.

The database is a **separate** pipeline: pushing code never touches Supabase. Schema
changes are pasted into the Supabase SQL editor by hand.

## Pending on Megan

1. **Play it on the phone.** Especially quest 4 (the climb) — the finger-tolerance and
   whether the backwards-drag lock feels fair are the things to judge on a real screen.
2. Decide the **real app name** ("Grafiek Quest" is a placeholder).
3. Nothing else is blocking.

## Next build session, in order

1. **Login screen** (username + password against the RPCs). The cloud backend in
   `js/backend.js` is written and expects a session token; there is just no UI to get
   one yet. Until then `chooseBackend()` falls back to local, which is why nothing is
   broken.
2. Run `supabase/schema.sql` in the dashboard, fill in `js/supabase-config.js`, then
   test signup / login / save AND the privilege-escalation test with a throwaway account.
3. Create the public repo `megzieberr/graph-quest`, Pages from main/root, verify live.
4. **Blipwork mount** — its own job, its own go-ahead: copy `js/engine/interactive.js`
   + the quest files, register the section in blipwork's `js/config.js` and
   `js/quests/index.js`, call `setSemicircles(false)`, add a
   `supabase/migration-graph-quests.sql` seeded **closed**, bump blipwork's `sw.js` cache.

---

## Map of the code

```
index.html            shell
css/styles.css        blipwork "System Window" theme + the .iv-* interactive classes
js/
  app.js              boot, screen switching
  play.js             the round loop; gates interactive rounds before revealing options
  screens.js          quest map, results, top chrome (language toggle)
  i18n.js             B("en","af") / L() — every string is bilingual
  funclib.js          ALL the maths: curves, intercepts, signs, sections, intervals
  check.js            decimal comma + real minus sign
  backend.js          local + cloud (RPC) behind one interface
  engine/
    function-graph.js the to-scale renderer + verify() + the inverse transform
    interactive.js    pointDrop · curtain · climb · signPaint · cutSockets · sweep
  quests/
    _shared.js        mc() / iq() / quest()
    _graphs.js        random curves with whole-number features + auto windows
    _intervals.js     turning chosen sections into "x < −1 of 0 < x ≤ 4"
    q1…q7             the seven quests
supabase/schema.sql   RLS on, no table policies, everything through SECURITY DEFINER RPCs
verify.html           34 checks — engine honesty, generators, mechanics, notation
```

### If you add a quest or a mechanic
1. Answers computed in `funclib.js`; decoys filtered **by value**, not by string.
2. Diagram through `specFor()` so `verifyFunction()` can prove it.
3. Both languages, side by side, in the same generator.
4. New interactive mechanic → add a check to `verify.html` §4 (mounts, draws a curve,
   and stays locked until the learner acts).
5. Re-run `verify.html`; all checks must pass. Bump `CACHE` in `sw.js`.
