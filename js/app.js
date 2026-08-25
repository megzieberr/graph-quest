/* ============================================================
   BOOT — the STANDALONE shell only
   ------------------------------------------------------------
   Everything a mounted copy shares with this one lives in
   js/mount.js. What is left here is exactly what belongs to the
   standalone at megzieberr.github.io/graph-quest and to nothing
   else: the header chrome, the quest map, the results card, the
   reset link, the ?url flags, and the service worker.
   ============================================================ */
import { $, toast, setRoot, setScroller } from "./ui.js";
import { L } from "./i18n.js";
import { chooseBackend } from "./backend.js";
import { paintChrome, mapScreen, resultScreen } from "./screens.js";
import { rerender, isPlaying } from "./play.js";
import { getQuest, setSemicircles } from "./quests/index.js";
import { runQuest } from "./mount.js";

/* the standalone IS the page: its root is the .ff-root wrapper in
   index.html, and the page's own window does the scrolling */
setRoot(document.querySelector(".ff-root") || document.body);
setScroller(() => window.scrollTo(0, 0));

const backend = chooseBackend();
let profile = { xp: 0, quests: {} };
let screen = { name: "map" };

/* ---------- url flags: STANDALONE ONLY ----------
   A mounted copy has no url of its own, so every flag is read here and
   passed inward. Semicircles are ON for the standalone (Grade 12
   Technical Maths) build; ?nosemi=1 gives the set without them — the same
   content the IEB Grade 11s meet in blipwork, for a learner who is not on
   Technical Maths but has no blipwork login. ?boost=1 forces help mode.

   nosemi STICKS to the device, the same way backend.js makes ?local=1
   stick: the manifest's start_url is a plain "./", so a learner who adds
   the app to her home screen would otherwise open it WITHOUT the flag and
   meet semicircles the day she installs it. ?nosemi=0 clears it again —
   that is how a phone goes back to the Technical Maths set. */
const NOSEMI_FLAG = "gq.nosemi";
const FLAGS = new URL(location.href).searchParams;

/* the url wins when it says anything, and says so for good; otherwise the
   device remembers what it was last told */
function semicirclesAreOff() {
  const asked = FLAGS.get("nosemi");
  if (asked === "1" || asked === "0") {
    try {
      if (asked === "1") localStorage.setItem(NOSEMI_FLAG, "1");
      else localStorage.removeItem(NOSEMI_FLAG);
    } catch { /* private mode: the url still rules this visit */ }
    return asked === "1";
  }
  try { return localStorage.getItem(NOSEMI_FLAG) === "1"; } catch { return false; }
}

setSemicircles(!semicirclesAreOff());
const FORCE_BOOST = FLAGS.get("boost") === "1";

async function boot() {
  try { profile = await backend.profile(); }
  catch (e) { console.warn("profile load failed, using a blank one", e); }
  normalise();
  paint();
}

function normalise(p) {
  if (p) profile = p;
  profile.quests = profile.quests || {};
  profile.met = profile.met || {};
  return profile;
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
  const app = $(".ff-app");
  app.textContent = "";
  app.appendChild(view);
  window.scrollTo(0, 0);
}

function play(questId, opts = {}) {
  screen = { name: "play", questId };
  runQuest(questId, {
    profile: () => profile,
    backend,
    onProfile: normalise,
    onSaveError: (e) => {
      console.error("save failed", e);
      toast(L({ en: "Could not save — your progress may be lost", af: "Kon nie stoor nie — jou vordering kan verlore gaan" }), true);
    },
    onFinished: (res) => { screen = { name: "result", res }; paint(); },
    onExit: () => { screen = { name: "map" }; paint(); },
    opts: { forceIntro: opts.forceIntro, forceBoost: FORCE_BOOST },
  });
}

async function resetAll() {
  try { profile = await backend.reset(); } catch { /* ignore */ }
  normalise();
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
