/* ============================================================
   BOOT
   ============================================================ */
import { $, el, toast } from "./ui.js";
import { L, UI } from "./i18n.js";
import { chooseBackend } from "./backend.js";
import { paintChrome, mapScreen, resultScreen } from "./screens.js";
import { startQuest, rerender, isPlaying } from "./play.js";
import { getQuest, setSemicircles } from "./quests/index.js";

const backend = chooseBackend();
let profile = { xp: 0, quests: {} };
let screen = { name: "map" };

/* Semicircles are ON for the standalone (Grade 12 Technical Maths)
   build. ?nosemi=1 previews the blipwork content set, where the
   IEB Grade 11s never meet them. */
setSemicircles(new URL(location.href).searchParams.get("nosemi") !== "1");

async function boot() {
  try { profile = await backend.profile(); }
  catch (e) { console.warn("profile load failed, using a blank one", e); }
  profile.quests = profile.quests || {};
  profile.met = profile.met || {};
  paint();
}

function paint() {
  paintChrome(profile, () => { if (isPlaying()) rerender(); else paint(); });
  if (screen.name === "map") show(mapScreen(profile, play, resetAll));
  else if (screen.name === "result") {
    const q = getQuest(screen.res.questId);
    const onLesson = q.intro && !screen.res.passed
      ? () => play(screen.res.questId, { forceIntro: true })
      : null;
    show(resultScreen(screen.res, q.title,
      () => play(screen.res.questId),
      () => { screen = { name: "map" }; paint(); },
      onLesson));
  }
}

function show(view) {
  const app = $("#app");
  app.textContent = "";
  app.appendChild(view);
  window.scrollTo(0, 0);
}

function play(questId, opts = {}) {
  const p = (profile.quests || {})[questId];
  const fails = p && !p.done ? (p.plays || 0) : 0;   // failed attempts → Boost mode after 2
  screen = { name: "play", questId };
  const q = getQuest(questId);
  /* only a quest that opted into dealEachKindFirst (qE) needs its met
     record threaded through — every other quest ignores both fields */
  const dealsByKind = !!(q && q.dealEachKindFirst);
  startQuest(questId, finished, () => { screen = { name: "map" }; paint(); },
    {
      fails, forceIntro: opts.forceIntro,
      met: dealsByKind ? ((profile.met || {})[questId] || {}) : undefined,
      onRoundShown: dealsByKind ? (skillId) => recordMet(questId, skillId) : null,
    });
}

/* persists that `skillId` in `questId` was actually shown to the learner
   — see play.js's render() for the "presented, not merely dealt" hook.
   A fresh device (no localStorage) starts the one-of-each deals again,
   her known and accepted consequence. */
async function recordMet(questId, skillId) {
  try {
    if (backend.markMet) profile = await backend.markMet(questId, skillId);
  } catch (e) { console.warn("markMet failed", e); }
  profile.quests = profile.quests || {};
  profile.met = profile.met || {};
}

async function finished(res) {
  try { profile = await backend.saveResult(res.questId, res.score, res.total, res.xp); }
  catch (e) {
    console.error("save failed", e);
    toast(L({ en: "Could not save — your progress may be lost", af: "Kon nie stoor nie — jou vordering kan verlore gaan" }), true);
  }
  profile.quests = profile.quests || {};
  profile.met = profile.met || {};
  screen = { name: "result", res };
  paint();
}

async function resetAll() {
  try { profile = await backend.reset(); } catch { /* ignore */ }
  profile.quests = profile.quests || {};
  profile.met = profile.met || {};
  screen = { name: "map" };
  paint();
}

/* service worker: registered only when served over http(s) */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => { /* fine offline */ });
  });
}

boot();
