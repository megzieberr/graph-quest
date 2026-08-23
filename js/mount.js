/* ============================================================
   THE MOUNT SEAM
   ------------------------------------------------------------
   Fun Functions has two homes:

     · the standalone at megzieberr.github.io/graph-quest — its own
       page, its own map, its own on-device saves (js/app.js)
     · one quest at a time INSIDE another app (blipwork), which draws
       its own tiles, owns the learner, and pays out its own XP

   Everything both homes share lives here. app.js is now only the
   standalone shell (chrome, map, results card, url flags, service
   worker); this file holds the one "play a quest and hand the result
   back" path, so the play logic exists exactly once.

     mountFunFunctions(rootEl, host) -> { destroy() }

   host = {
     questId,                       the quest to play — mounted mode has
                                    no map, the host drew the tiles
     lang: "en" | "af",             set for this run only, never stored
     semicircles: boolean,          false for the IEB Grade 11 content set
     profile:    async () -> { xp, quests:{[id]:{best,total,plays,done}}, met:{…} }
     saveResult: async (questId, score, total, xp, answered) -> profile
     markMet:    async (questId, skillId) -> profile          (optional)
     onFinished: (res) -> void      AFTER saveResult resolves; the host
                                    then shows ITS OWN results screen
     onExit:     () -> void         the learner tapped "‹" mid-quest
     onScrollTop:() -> void         (optional) the host scrolls, we don't
   }

   Unlocks are the host's job — the mount trusts the questId it is given.
   ============================================================ */
import { el, setRoot, setScroller } from "./ui.js";
import { setLang } from "./i18n.js";
import { HostBackend } from "./backend.js";
import { startQuest, quitQuest } from "./play.js";
import { getQuest, setSemicircles } from "./quests/index.js";

/* ---------------- the one play path ----------------
   ctx = {
     profile()      -> the current profile object
     backend        -> any of the three backends
     onProfile(p)   -> a fresher profile arrived (save/markMet)
     onSaveError(e) -> the save failed (standalone toasts; the mount logs)
     onFinished(res)-> the quest ended, AFTER the save settled
     onExit()       -> the learner walked out mid-quest
     opts           -> { forceIntro, forceBoost }
   }
   Used by BOTH homes, so a fix here can never land in one and not the
   other. */
export function runQuest(questId, ctx) {
  const q = getQuest(questId);
  const profile = ctx.profile() || {};
  const st = (profile.quests || {})[questId];
  /* failed attempts → Boost mode after 2 (a finished quest is not a fail) */
  const fails = st && !st.done ? (st.plays || 0) : 0;
  /* only a quest that opted into dealEachKindFirst (qE) needs its met
     record threaded through — every other quest ignores both fields */
  const dealsByKind = !!(q && q.dealEachKindFirst);
  const opts = ctx.opts || {};

  /* persists that `skillId` in `questId` was actually shown to the learner
     — see play.js's render() for the "presented, not merely dealt" hook.
     A fresh device (no localStorage) starts the one-of-each deals again,
     her known and accepted consequence. */
  const recordMet = async (skillId) => {
    try {
      if (ctx.backend.markMet) ctx.onProfile(await ctx.backend.markMet(questId, skillId));
    } catch (e) { console.warn("markMet failed", e); }
  };

  const finished = async (res) => {
    try {
      ctx.onProfile(await ctx.backend.saveResult(res.questId, res.score, res.total, res.xp, res.answered));
    } catch (e) {
      ctx.onSaveError(e);
    }
    /* the result is handed on either way — the learner finished the quest
       whether or not the store took it */
    ctx.onFinished(res);
  };

  startQuest(questId, finished, ctx.onExit, {
    fails,
    forceIntro: opts.forceIntro,
    forceBoost: opts.forceBoost,
    met: dealsByKind ? ((profile.met || {})[questId] || {}) : undefined,
    onRoundShown: dealsByKind ? recordMet : null,
  });
}

/* ---------------- mounted mode ---------------- */
export function mountFunFunctions(rootEl, host) {
  if (!rootEl) throw new Error("mountFunFunctions() needs a root element");
  const h = host || {};

  rootEl.classList.add("ff-root");
  rootEl.textContent = "";
  const stage = el("div", "ff-app");
  rootEl.appendChild(stage);

  setRoot(rootEl);
  /* the host's page owns its own scrolling; we only move it if asked to */
  setScroller(h.onScrollTop || null);
  /* for this run only — blipwork picks the language and never shows our
     toggle, so nothing may be written into a shared origin */
  setLang(h.lang === "en" ? "en" : "af", { persist: false });
  setSemicircles(!!h.semicircles);

  const backend = HostBackend(h);
  let profile = { xp: 0, quests: {}, met: {} };
  let dead = false;

  const onProfile = (p) => {
    if (p) profile = p;
    profile.quests = profile.quests || {};
    profile.met = profile.met || {};
    return profile;
  };

  const started = (async () => {
    try { onProfile(await backend.profile()); }
    catch (e) { console.warn("host profile load failed, using a blank one", e); }
    if (dead) return;
    runQuest(h.questId, {
      profile: () => profile,
      backend,
      onProfile,
      onSaveError: (e) => console.error("host saveResult failed", e),
      onFinished: (res) => { if (!dead && h.onFinished) h.onFinished(res); },
      onExit: () => { if (!dead && h.onExit) h.onExit(); },
      opts: {},
    });
  })();

  return {
    /* the promise the mount is running on — the harness and mount-test
       await it so they never click into a half-built screen */
    ready: started,
    destroy() {
      if (dead) return;
      dead = true;
      /* drop the play session first: every listener the engine adds sits
         on an element INSIDE rootEl (audited — js/engine/interactive.js
         and slider.js use setPointerCapture on their own svg/track, never
         window or document), so emptying the root really does take them
         all with it. */
      quitQuest();
      rootEl.textContent = "";
      rootEl.classList.remove("ff-root");
      setRoot(null);
      setScroller(null);
    },
  };
}
