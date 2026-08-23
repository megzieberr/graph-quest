/* ============================================================
   THE HEADLESS MOUNT DRIVER  (test scaffolding — not shipped)
   ------------------------------------------------------------
   Mounts a quest with mountFunFunctions() and plays it to the end by
   clicking the REAL buttons a learner clicks — no private hooks, no
   second copy of the play loop. verify.html §32 and mount-test.html
   both import THIS file, so there is exactly one driver and the two
   pages can never drift apart.

   What it can and cannot do:
   · mc / keypad rounds are answered for real (an option is tapped, a
     digit is typed and submitted)
   · an interactive round's mechanic needs a pointer on an SVG, which is
     not something a headless page can honestly fake — so the driver
     takes the round's own "Slaan oor" link, exactly as a stuck learner
     would. That still exercises play.js's whole book-keeping path.
   · the intro cutscene is clicked through beat by beat
   ============================================================ */
import { mountFunFunctions } from "./js/mount.js";

/* a MICROTASK, deliberately — not setTimeout. Everything the play loop
   does on a click is synchronous DOM work; the only real waits are the
   host's own promises, which settle on the microtask queue. A timer-based
   tick would also be clamped to a second per step in a background tab,
   which is exactly where a harness run lives. */
const tick = () => new Promise((r) => queueMicrotask(r));

/* a host that records every call, so a test can assert on them */
export function spyHost(over = {}) {
  const calls = { profile: 0, saveResult: [], markMet: [], finished: [], exited: 0 };
  let profile = over.startProfile || { xp: 0, quests: {}, met: {} };
  const host = {
    questId: over.questId,
    lang: over.lang || "en",
    semicircles: over.semicircles === true,
    calls,
    async profile() { calls.profile++; return JSON.parse(JSON.stringify(profile)); },
    async saveResult(questId, score, total, xp, answered) {
      calls.saveResult.push({ questId, score, total, xp, answered });
      const prev = profile.quests[questId] || { best: 0, plays: 0, done: false };
      profile.quests[questId] = {
        best: Math.max(prev.best, score), total,
        plays: prev.plays + 1,
        done: prev.done || (total > 0 && score / total >= 0.7),
      };
      profile.xp += xp;
      return JSON.parse(JSON.stringify(profile));
    },
    async markMet(questId, skillId) {
      calls.markMet.push({ questId, skillId });
      profile.met[questId] = profile.met[questId] || {};
      profile.met[questId][skillId] = true;
      return JSON.parse(JSON.stringify(profile));
    },
    onFinished(res) { calls.finished.push(res); },
    onExit() { calls.exited++; },
  };
  if (over.noMarkMet) delete host.markMet;
  return host;
}

/* mount `questId` into `rootEl` and play it to the end.
   -> { res, calls, handle, steps, stuck } */
export async function playMounted(rootEl, hostIn, opts = {}) {
  const host = hostIn;
  let res = null;
  const wrapped = { ...host, onFinished: (r) => { res = r; if (host.onFinished) host.onFinished(r); } };

  const handle = mountFunFunctions(rootEl, wrapped);
  await handle.ready;

  const clicked = new Set();
  const hit = (node) => {
    if (!node || node.disabled || clicked.has(node)) return false;
    clicked.add(node);
    node.click();
    return true;
  };

  const maxSteps = opts.maxSteps || 4000;
  let steps = 0, stuck = false;
  let round = 0;
  while (res == null && steps++ < maxSteps) {
    await tick();
    if (res != null) break;

    /* the intro cutscene: one beat per click, then "Begin". The same
       button node is reused for every beat (paint() only swaps its
       label), so this one may NOT go through hit()'s once-only guard. */
    if (rootEl.querySelector(".intro-cap")) {
      const b = rootEl.querySelector(".btn.primary.big");
      if (b && !b.disabled) { b.click(); continue; }
    }

    /* feedback is up → the only thing left is Volgende / Klaar */
    if (rootEl.querySelector(".fb")) {
      const nexts = [...rootEl.querySelectorAll(".btn.primary.big")];
      if (hit(nexts[nexts.length - 1])) { round++; continue; }
    }

    /* every third round, pull a hint rung first — that is the only way
       the "hinted" outcome (XP_HINTED, not XP_FULL) is ever recorded */
    if (round % 3 === 2) {
      const hintBtn = rootEl.querySelector(".hint-btn");
      if (hintBtn && !hintBtn.disabled && !clicked.has(hintBtn)) { hit(hintBtn); continue; }
    }

    /* a typed-number round */
    const grid = rootEl.querySelector(".kgrid");
    if (grid) {
      const submit = grid.querySelector(".key.submit");
      if (submit && !submit.disabled) {
        const digit = [...grid.querySelectorAll(".key")].find((k) => k.textContent === "4");
        if (digit && !digit.disabled) digit.click();
        submit.click();
        continue;
      }
    }

    /* an option grid — take the first one still live. Under a second
       chance (Boost / alwaysSecondChance) a wrong first tap leaves the
       rest live, so the loop naturally walks on to the right one and
       the "half" outcome gets exercised too. */
    const live = [...rootEl.querySelectorAll(".opt")].filter((b) => !b.disabled);
    if (live.length) { live[0].click(); continue; }

    /* an interactive round we cannot drive by hand */
    const skip = rootEl.querySelector(".skip-btn");
    if (skip && !skip.disabled) { skip.click(); continue; }

    stuck = true;
    break;
  }
  /* the finish payload is handed over after saveResult settles */
  for (let i = 0; i < 20 && res == null; i++) await tick();

  return { res, calls: host.calls, handle, steps, stuck };
}
