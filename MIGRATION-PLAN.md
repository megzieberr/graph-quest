# MIGRATION-PLAN — Fun Functions becomes rounds inside Blipwork
*Drafted 2026-08-23 by the Fable foreman after batch 3 closed; rewritten the same
evening after Megan's ruling: the MOUNT is the plan ("the whole idea from the
beginning was to put it as a round in blipwork"). The earlier tab-and-bridge
draft is withdrawn — do not re-raise it. PLAN ONLY — nothing built; all four of her
calls are decided (see the end).*

## What the learner sees

In Blipwork's **Functions chapter** page, next to the static rounds and the 🎲 dice, a
new strip: **📈 Fun Functions** (her name, 2026-08-23) with the fifteen quest tiles in map order, each with its best score, exactly as
the standalone's map shows them. Tapping a tile plays that quest with all its
interactive mechanics — the climb, the sweep, the paint, the trail, the tap-to-fill,
the drag-line — inside Blipwork's chrome, in English (Blipwork's language), with
**semicircles OFF** (IEB). Finishing pays Blipwork XP and diamonds the normal way and
the tile's best score updates. Unlocks follow the standalone's map order (grandfather
rule kept). The teacher dashboard shows the quest plays like any other round.

The standalone at megzieberr.github.io/graph-quest stays for her Gr12 Tech Maths
learner (semicircles ON, Afrikaans, on-device saves — one learner, no login needed
there — her ruling, Part 4 closed).

## Why this is cheaper than it sounds

- **Blipwork already has the login, roster, XP, diamonds, results screen, dashboard,
  SW and push.** Fun Functions' own login + `supabase/schema.sql` are NOT needed for
  the Gr11s — that whole parked tail disappears.
- **The dice is the template.** `js/dice-play.js` already shows how a generated
  round type lives in a chapter page, runs its own play loop, and pays out through a
  server RPC that recomputes XP from stored answers (`mhq_submit_dice` — "the client
  never names an amount"). Fun Functions quests are that pattern with a different
  play module.
- Fun Functions' code is self-contained (its own `js/engine/`, `js/quests/`,
  `js/play.js`, `css/`) with only three touch points to the host: who's playing,
  save a result, which language/semicircle flags.

## The engineering shape — ONE source, TWO homes

Blipwork gets `js/funfun/` — a **copied build of graph-quest's `js/engine`,
`js/quests`, `js/play.js`, `js/i18n.js`, `js/funclib.js` and its CSS**, installed by
a sync script (`graph-quest/tools/sync-to-blipwork.py`), never hand-edited in
blipwork. graph-quest stays the source of truth; the harness (275 checks) runs
there. The sync copies, rewrites the three host touch points through a tiny
adapter (`js/funfun/host.js`), and bumps nothing — Blipwork's own ship ritual does
the SW bump. (Same rule as netcode-book: rebuild from source, never edit output.)

Blipwork already has its OWN `js/engine/function-graph.js` (same lineage, different
file, used by the Exam Focus cards). The two engines coexist under different paths
— no merge, no shared-file edits; a later session may unify them, not this one.

## The parts, in build order

### Part 1 — the adapter seam in graph-quest (its own repo, harness-guarded)

Make the three touch points explicit so the sync is mechanical:
1. `js/backend.js` grows a third backend, `HostBackend`, that delegates
   `profile()` / `saveResult()` / `markMet()` / `reset()` to a host object handed in
   at boot (`mountFunFunctions(rootEl, host)`). Local and cloud backends untouched.
2. `js/app.js` splits into "boot as standalone" (today's path) and
   `mountFunFunctions(rootEl, {lang, semicircles, profile, saveResult, markMet,
   onExit})` — the app renders into `rootEl` instead of `document.body`, hides its
   own header/map chrome when mounted, and calls `onExit` from "‹ Kaart".
3. CSS is scoped under `.ff-root` so Blipwork's styles and Fun Functions' don't
   fight (today's selectors are global — `.opt`, `.eq`, `.prompt`…). Harness check:
   no unscoped selector left.
4. The SW shell list stays the standalone's; Blipwork's SW gets the funfun/ files
   from the sync script's manifest.
Verify: standalone still 275/275 (three runs); a `mount-test.html` in graph-quest
mounts the app into a div with a fake host and plays one quest headlessly.

### Part 2 — Blipwork: tiles, play, payout, migration

1. `supabase/migration-funfun.sql`: table `funfun_progress(student_id, quest_id,
   best, total, plays, done, met_kinds jsonb, updated_at)` + RPC
   `mhq_submit_funfun(username, password, quest_id, answered jsonb)` that recomputes
   XP server-side from `answered` (rate: same per-round XP as a static Functions
   round — her ruling), updates best/plays/done, pays gold per the
   existing `award` path, and `mhq_funfun_state(username, password)` for the tiles.
   Seeded closed if Blipwork has a chapter gate (check `app_config`). Grants on new
   functions, `search_path` pinned, `/migration-check` after.
2. Functions chapter page: the 📈 strip with 15 tiles (order + unlock from the
   standalone's `questUnlocked()` logic ported to the state payload); tap →
   `mountFunFunctions()` inside a "play" screen with Blipwork chrome; finish →
   `mhq_submit_funfun` → Blipwork's results screen (XP, gold, level-up, like
   `finishDice`).
3. Dashboard: per-quest chips under Functions, like dice ("🎲 icon + play count"
   ruling — her ruling: same minimal treatment here).
4. Dice import: Trig Graphs' error-checking rounds import `js/funfun/quests/
   _fault.js` (built DOM-free for this) — rides here or on the dice's own day.
Verify: `verify-store` byte-stable on learner data through the migration (as on the
CQ day); new `verify-funfun.html` mounts each of the 15 quests in Blipwork's page and
plays one round each headlessly; `?local=1` path works offline.

### Part 3 — the sync script + the ship

`tools/sync-to-blipwork.py` (copy + path rewrite + manifest), run once per Fun
Functions change; Blipwork ship = normal `/ship` (SW bump, push, live check, her
phone). First ship: migration via MCP → sync → ship → her phone-test (Functions
chapter → 📈 tile → play Ontdek and Soek die fout → results screen pays → dashboard
shows the play).

### Part 4 — CLOSED (her ruling: standalone stays on-device)

The standalone keeps on-device saves for the one Tech Maths learner.
`supabase/schema.sql` stays unrun, parked for good unless she reopens it.

## Her calls — ALL DECIDED 2026-08-23 evening (do not re-ask)

1. Strip name in Blipwork = **📈 Fun Functions**.
2. XP per quest = **the same as a static Functions round**.
3. Dashboard = **minimal, like the dice** (icon + play count).
4. The standalone stays **on-device saves** for the Tech Maths learner — Part 4 is
   CLOSED; `supabase/schema.sql` stays unrun, parked for good unless she reopens it.

## Sequence and cost

Part 1 (Opus, ~400k) → Fable review → standalone ship (nothing visible changes) →
Part 2 (Opus, ~500–600k, the live-Supabase session: Opus planning pass first per
her model roles) → Fable review → migration → Part 3 sync + ship → her phone-test.
Two build days. The standalone's 15 quests, harness and Afrikaans strings are not
touched by any of it — only the seam around them.
