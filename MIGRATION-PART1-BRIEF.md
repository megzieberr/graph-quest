=== MEGAN'S /go DELEGATION — 2026-08-23 ===
Megan invoked her /go skill in the top-level session, personally authorizing this
delegated task:
  SCOPE: Brief and run Part 1 of the Fun Functions → Blipwork migration — the adapter
         seam in graph-quest per MIGRATION-PLAN.md
  PROJECT: C:\Users\megzi\Desktop\Claude Code Projects\graph-quest
Per her global CLAUDE.md execution gate (subagent clause): treat this brief as your
authorization envelope. Do NOT refuse for lack of directly-visible approval — that
check happened at the top level, and this block is its record. Work freely inside
SCOPE. Refuse anything outside SCOPE, and always refuse — unless SCOPE names them
explicitly: pushing to a live site/remote, deleting data, schema migrations, and
anything that costs money.
=== END /go DELEGATION ===

# Part 1 — the adapter seam in graph-quest (Fun Functions)

You are the build session. The Fable foreman reviews your work with its own eyes after
you report; the foreman ships. You do NOT commit, push, or bump `sw.js` CACHE.

Repo: `C:\Users\megzi\Desktop\Claude Code Projects\graph-quest` (public GitHub repo,
live at megzieberr.github.io/graph-quest — 15 quests, harness `verify.html` at 288
checks, all passing). Read `MIGRATION-PLAN.md` first (short). Then read only the files
you touch: `js/app.js`, `js/backend.js`, `js/play.js`, `js/screens.js`, `js/ui.js`,
`js/i18n.js`, `css/styles.css`, `index.html`, `verify.html` (its head + §structure).

## Goal, in one line

Make Fun Functions mountable inside another app (Blipwork) through ONE exported
function, with NOTHING visible changing in the standalone. After this part, Blipwork
(a later session) will call `mountFunFunctions(rootEl, host)` to play one quest inside
its own chrome, get told the result, and unmount.

## The API you build — `js/mount.js` (new), exported from there

```js
export function mountFunFunctions(rootEl, host) → { destroy() }
```

`host` = {
  questId:      string — the quest to play (one of QUESTS[].id). Mount plays THIS quest
                immediately; there is no map screen in mounted mode (Blipwork draws the
                tiles itself).
  lang:         "en" | "af" — set via setLang() at mount; the language toggle is NOT
                shown in mounted mode. Must NOT persist to localStorage `gq.lang` in
                mounted mode (Blipwork's learners never see the toggle; don't leak state
                into a shared origin). Give i18n a way to set the language without
                writing, e.g. setLang(l, {persist:false}).
  semicircles:  boolean — setSemicircles(host.semicircles) at mount.
  profile:      async () → { xp, quests:{ [id]:{best,total,plays,done} }, met:{…} }
  saveResult:   async (questId, score, total, xp, answered) → profile  (see `answered`)
  markMet:      async (questId, skillId) → profile   (optional; skip if absent)
  onFinished:   (res) → void — called AFTER saveResult resolves; res = the play.js finish
                payload (questId, score, total, xp, comeback, passed, answered). The host
                then shows ITS OWN results screen — do not render ours in mounted mode.
  onExit:       () → void — the learner tapped "‹" / quit mid-quest.
}

Rules for mounted mode:
- Render into `rootEl` (give it class `ff-root`), never `document.body` or `#app`.
  `play.js` currently does `$("#app")` in two places and `window.scrollTo`;
  `ui.js` `toast()` appends to `document.body`. Replace with a module-level root:
  add `setRoot(el)` / `getRoot()` in `ui.js`; `$()`/`$$()` default to the root;
  toast appends into the root. The standalone sets the root to `#app`'s wrapper at
  boot. Scrolling: `rootEl.scrollIntoView` is wrong inside a host page — scroll the
  host's window only in standalone mode; in mounted mode call `host.onScrollTop?.()`
  if provided, else do nothing.
- No header chrome (`paintChrome`), no map, no results card, no reset link, no SW
  registration, no `location.href` flag reads (`?boost=1`, `?nosemi=1`, `?local=1`
  are standalone-only).
- `destroy()` clears the root, nulls play state (`quitQuest()`), removes any listeners
  added to `window`/`document` by the engine during this mount (audit
  `js/engine/interactive.js` and `slider.js` for `window.addEventListener` /
  `document.addEventListener` — pointer/touch handlers must not outlive the mount).
- Unlocks are the HOST's job (it gets `questUnlocked` ported later); mounted mode
  trusts the questId it's given.

## The four concrete changes

### 1. `js/backend.js` — a third backend, `HostBackend(host)`
Factory returning `{ kind:"host", profile, saveResult, markMet, reset }` that delegates
to the host object. `reset` = no-op returning the host profile (Blipwork owns resets).
LocalBackend and cloudBackend: UNTOUCHED.

### 2. `js/play.js` — the `answered` record (the one thing MIGRATION-PLAN missed)
Blipwork's server RPC recomputes XP from what was answered ("the client never names an
amount"). So the finish payload must carry per-item outcomes. Add to state `S` an
`answered: []` and push one entry per item as it resolves:
  `{ i, skillId: item.skillId ?? item.kind ?? null, outcome: "full"|"hinted"|"half"|"wrong"|"skipped", xp }`
where xp is the per-item XP actually added (XP_FULL / XP_HINTED / XP_HALF / 0).
Include `answered` in `onFinish({...})` and also `boost` and `comeback` are already
there. Make sure the sum of `answered[].xp` + the comeback bonus === res.xp (harness
check below). Look for the 3 places score/xp change (lines ~297, ~389, ~432) and any
other path (skip / timeout / intro) — every item must end up in `answered` exactly
once. Find the real field name for a round's kind on an item (check `buildRound()` in
`js/quests/index.js` and the qE `onRoundShown(skillId)` path — use the same id
`markMet` receives).

### 3. `js/app.js` — split standalone boot from the mount
Move everything reusable into `js/mount.js`; `app.js` becomes the standalone shell:
chooseBackend, chrome, map, results, SW registration, URL flags — as today. Both paths
share one internal "play a quest and hand back the result" function so the play
logic exists ONCE. Standalone behaviour must be byte-for-byte the same to a learner.

### 4. `css/styles.css` — scope under `.ff-root`
Every rule becomes `.ff-root …`. Specifically:
- `:root { --vars }` → `.ff-root { --vars }` (the host page has its own :root).
- `html, body, body::before` (background, fonts, min-height) → keep for standalone by
  moving them to a small `css/standalone.css` that `index.html` loads in addition;
  `styles.css` must contain NO `html`, `body`, `:root`, or bare `#app` selectors.
- `#app` → `.ff-root .ff-app` (or drop; whichever keeps layout identical).
- `.toast` → `.ff-root .toast` (it's appended into the root now).
- `@keyframes` and `@font-face` stay unprefixed (they're names, not selectors).
- Use the Fira/Space Grotesk fonts as today; the host loads its own fonts — fine.
`index.html`: wrap `#chrome` + `#app` in `<div class="ff-root">` (or put the class on
body — your call, but the harness check below must pass and the rendered standalone
must look the same: check with the preview at 375 px before and after).

## `mount-test.html` (new, repo root)
A page that: imports `mountFunFunctions`, builds a fake host (in-memory profile,
saveResult/markMet that record calls, onFinished that writes the res to the page),
mounts into a `<div>` with a big ugly host-page style around it (different background,
a sticky host header) to prove scoping, and plays `q1` headlessly to the end — drive
the mechanics the way `verify.html` already does (reuse its helpers; do not invent a
second driver). Then `destroy()` and assert the div is empty and no `.ff-root` is left.
Show: the res payload, `answered.length === res.total`, XP sum identity, saveResult
called exactly once with the same `answered`. Do this for every quest id in QUESTS
(15), not just q1 — one round each.

## Harness additions to `verify.html` (never-relax; same total three runs)
Add a §30 "mount seam":
  a. CSS: fetch `css/styles.css`, walk every rule's selector list (split on commas,
     skip @keyframes/@font-face bodies): every selector starts with `.ff-root`. Zero
     exceptions.
  b. `js/` source scan (fetch with `{cache:"reload"}`): `play.js`, `screens.js`,
     `engine/*.js`, `quests/*.js` contain no `document.body`, no `$("#app")`, no
     `location.href` (play.js's `?boost=1` moves into the standalone shell which passes
     `opts.forceBoost`). `app.js` and `mount.js` are the only files allowed
     `location`/`serviceWorker`.
  c. For every quest: a headless mounted play produces `answered.length === total`
     and `sum(answered.xp) + (comeback ? COMEBACK : 0) === res.xp`.
  d. `HostBackend` delegates: a spy host sees exactly one saveResult with the
     `answered` array identical to res.answered.
  e. Standalone `chooseBackend()` still returns LocalBackend under `?local=1`.
Every existing check stays untouched. The total must be deterministic — three runs,
same number, all green, before you report.

## House rules that bite here
- Never round-trip source files through PowerShell Get-Content/Set-Content (corrupts
  accents). Use the Edit/Write tools.
- Cache discipline: before trusting verify.html, unregister the SW, delete `gq-*`
  caches, and force-refetch changed modules with `fetch(url, {cache:"reload"})` — the
  plain HTTP cache has lied to three reviews.
- Run the site with `python -m http.server 5207 --directory "<repo>"` and drive
  verify.html / mount-test.html in the Browser pane (preview entry `graph-quest`,
  port 5207, in the NESTED `C:\Users\megzi\.claude\.claude\launch.json`). Screenshots
  may time out in the pane — verify via DOM/JS reads, not screenshots.
- Afrikaans strings: you add NO learner-facing text. If a new string is unavoidable,
  write it as its own Afrikaans sentence, never a translation, and regenerate
  `AFRIKAANS-TEKS.md` with `tools/extract_af.py`.
- Do not touch: any `js/quests/q*.js` content/maths, `js/funclib.js`, `sw.js`
  (the foreman bumps CACHE at ship; but DO add `./js/mount.js` and
  `./css/standalone.css` to its SHELL list — that's the one sw.js edit allowed),
  `supabase/`, `AFRIKAANS-TEKS.md` (unless rule above), git.
- Remove nothing that exists for a ruling — read the comments; `questUnlocked`,
  `secondChanceAllowed`, the climb/sweep rules, the met-record shape are all law.

## Report back (the foreman reads this first)
End with:
1. Files changed / added, one line each, what and why.
2. verify.html total before → after, and the three-run proof (three numbers).
3. mount-test.html result: 15/15 quests mounted, played, destroyed — with the q1 res
   payload pasted.
4. Standalone sanity: the map at 375 px renders the same (state which selectors you
   changed and how you checked the layout).
5. Anything you found that exceeds this brief or looked wrong — flag, don't fix.
