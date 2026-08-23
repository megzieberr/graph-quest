/* ============================================================
   THE PLAY LOOP  (rebuilt on Circle Quest's scaffolding toolkit)
   ------------------------------------------------------------
   Four kinds of screen:

     intro         "Kyk eers een saam" — a click-paced worked example
                   that plays the first time a quest opens
     mc            picture (maybe) + prompt + tap an option
     kp            picture (maybe) + prompt + type a number on the
                   on-screen keypad (qK's R2 kiss round, batch 3
                   session 2 keypad amendment) — no device keyboard
     interactive   DO the thing first — the options stay hidden
                   until the mechanic reports it is done

   The teach-layer (all from Circle Quest):
     · hint LADDER — one rung per tap; rung 1 names the move,
       never the answer
     · misconception nudges — a wrong pick leads with WHY that
       specific wrong answer is tempting (mc: chosen by which option
       was tapped; kp: chosen by the value typed — same idea)
     · solution steps — feedback shows the method, not just the
       answer
     · Boost mode — after 2 failed tries: hints open by themselves
       and every question gives a second chance for half marks;
       finally passing then earns a comeback bonus
     · a quest may set alwaysSecondChance to hand out that retry to
       every learner, Boost or not (Round D does — her ruling)

   Marking is always about the maths — a keypad answer is still checked
   as a number (near(), the same tolerance the rest of the app uses),
   never as matched text.
   ============================================================ */
import { el, $, toast, scrollToTop } from "./ui.js";
import { L, UI, getLang } from "./i18n.js";
import { near } from "./check.js";
import { staticGraph } from "./engine/interactive.js";
import { renderFunction } from "./engine/function-graph.js";
import { mountKeypad } from "./engine/keypad.js";
import { buildRound, getQuest } from "./quests/index.js";

const XP_FULL = 10, XP_HINTED = 5, XP_HALF = 5, COMEBACK = 40, PASS = 0.7, BOOST_AFTER = 2;
/* the host that mounts this app recomputes XP on its own server from the
   per-item record below ("the client never names an amount"), so it needs
   the same rates by name, not copied numbers */
export { XP_FULL, XP_HINTED, XP_HALF, COMEBACK, PASS, BOOST_AFTER };

let S = null;   // the running session

/* ---------------- option layout ----------------
   A maths option may never share a row. `.eq` is white-space:nowrap, so a
   squeezed equation does not wrap — it runs straight off the button's edge,
   and `.opts` only stacked below 380 px. Her phone is 540 px wide, so
   "y = 2·2ˣ − 4" shipped cut off mid-equation (playtest 2026-08-21).
   Any option list carrying an equation now goes one per line at EVERY
   width; prose options (happy/sad, the corner pairs) still pair up.
   Exported so verify.html can test the rule itself, not a screenshot. */
const MATH_MARKUP = /class="(eq|frac)"|<sup/;
const MATH_SIGN = /[=<>≤≥≠]/;
export function isMathOption(label) {
  const parts = (label && typeof label === "object") ? Object.values(label) : [label];
  return parts.some((v) => {
    const s = String(v == null ? "" : v);
    if (MATH_MARKUP.test(s)) return true;
    /* prose that merely mentions a symbol is still prose — the same
       eight-word test mc()'s eqWrap() uses, so the two agree */
    const plain = s.replace(/<[^>]*>/g, "");
    return MATH_SIGN.test(plain) && plain.trim().split(/\s+/).length <= 10;
  });
}
export function optionsNeedOneColumn(q) {
  return !!(q && q.options && q.options.some((o) => isMathOption(o.label)));
}

const introKey = (id) => "gq.intro." + id;
const introSeen = (id) => { try { return localStorage.getItem(introKey(id)) === "1"; } catch { return true; } };
const markIntroSeen = (id) => { try { localStorage.setItem(introKey(id), "1"); } catch { /* ignore */ } };

export function startQuest(questId, onFinish, onQuit, opts = {}) {
  const q = getQuest(questId);
  const items = buildRound(questId, opts.met);
  /* ?boost=1 is a STANDALONE url flag — the shell reads it and passes it
     in, because a mounted copy has no url of its own to read. verify.html
     §32b scans this file for any reach at the page address at all. */
  const boost = !!opts.forceBoost || (opts.fails || 0) >= BOOST_AFTER;
  S = {
    q, items, i: 0, score: 0, xp: 0, onFinish, onQuit,
    answered: false, usedHint: false, ctl: null,
    boost, fails: opts.fails || 0,
    /* one entry per item, in play order — see recordAnswer() */
    record: [],
    /* the qE dealing ruling's "met" hook — fired once per skillId, the
       moment a round is actually PRESENTED (below in render()), never
       for a round merely dealt into S.items that the learner may quit
       before reaching. metShown dedupes across a language-toggle
       re-render, which re-paints the SAME item without advancing i. */
    onRoundShown: opts.onRoundShown || null,
    metShown: new Set(),
  };
  if (q.intro && (opts.forceIntro || !introSeen(q.id))) renderIntro(q);
  else render();
}

/* Who gets the half-marks second chance on a wrong first pick: anyone in
   Boost, plus anyone playing a quest that hands it out to everybody
   (Round D — Megan's ruling 2026-08-12). Exported so verify.html can check
   the rule itself rather than re-implementing it. */
export const secondChanceAllowed = (q, boost) => !!boost || !!(q && q.alwaysSecondChance);

/* ---------------- the per-item record ----------------
   Every item that resolves writes exactly ONE row here:

     { i, skillId, outcome: "full"|"hinted"|"half"|"wrong"|"skipped", xp }

   `skillId` is the same id markMet() receives (buildRound() stamps it on
   every item; q7's sheets stamp "examSheet"), so a host can read the two
   together. `xp` is the amount this item really added — the sum of these
   plus the comeback bonus IS res.xp, and verify.html §32c checks that
   identity on every quest. It exists because the host that mounts this
   app recomputes the payout server-side from what was answered and never
   trusts a number the client names.

   Called from the four places an item can end: the no-follow-up
   interactive unlock, an option tap, a keypad submit, and the skip link.
   The S.i guard makes a second call for the same item a no-op — a
   language re-render repaints the SAME item without advancing i. */
function recordAnswer(outcome, xp) {
  if (!S) return;
  if (S.record.length && S.record[S.record.length - 1].i === S.i) return;
  const item = S.items[S.i] || {};
  S.record.push({
    i: S.i,
    skillId: item.skillId ?? item.kind ?? null,
    outcome,
    xp,
  });
}

export function rerender() { if (S) render(); }
export const isPlaying = () => !!S;
export function quitQuest() { S = null; }

/* ---------------- the intro player (cutscene) ----------------
   quest.intro = { beats: [ { cap:{en,af}, spec, frag? } ] }
   Each beat re-renders the graph spec (so lines/shades/points can
   appear step by step) and may add an SVG frag (sign marks, ①②③). */
function renderIntro(q) {
  const app = $(".ff-app");
  const beats = q.intro.beats;
  let i = 0;

  const view = el("div", "view");
  view.style.setProperty("--accent", q.accent || "#3aa0ff");
  const head = el("div", "qbar");
  head.innerHTML = `<div class="eyebrow">🔭 ${L(UI.watchFirst)}</div><div class="qcount"></div>`;
  const gbox = el("div", "graphbox");
  const cap = el("div", "intro-cap");
  const next = el("button", "btn primary big", L(UI.next));
  next.type = "button";
  const skip = el("button", "link-btn skip-btn", L(UI.skip));
  skip.type = "button";
  const foot = el("div", "stack");
  const skipRow = el("div", "center");
  skipRow.appendChild(skip);
  foot.append(next, skipRow);
  view.append(head, el("h2", null, L(q.title)), gbox, cap, foot);

  function paint() {
    head.querySelector(".qcount").textContent = `${i + 1} / ${beats.length}`;
    const b = beats[i];
    gbox.innerHTML = renderFunction(b.spec);
    if (b.frag) {
      const svg = gbox.querySelector("svg");
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.innerHTML = b.frag;
      svg.appendChild(g);
    }
    cap.innerHTML = L(b.cap);
    next.textContent = i + 1 < beats.length ? L(UI.next) : L(UI.start);
  }
  const done = () => { markIntroSeen(q.id); render(); };
  next.addEventListener("click", () => { i++; if (i < beats.length) paint(); else done(); });
  skip.addEventListener("click", done);
  gbox.addEventListener("pointerdown", () => { if (i + 1 < beats.length) { i++; paint(); } });

  app.textContent = "";
  app.appendChild(view);
  paint();
  scrollToTop();
}

/* ---------------- the hint ladder ---------------- */
function hintSteps(item) {
  const src = item.type === "interactive" ? (item.hints || (item.then && (item.then.hints || (item.then.hint ? [item.then.hint] : []))) || []) : (item.hints || (item.hint ? [item.hint] : []));
  return src;
}
function buildHintLadder(item, host) {
  const steps = hintSteps(item);
  if (!steps.length) return null;
  const wrap = el("div", "stack");
  const panel = el("div", "stack");
  const btn = el("button", "link-btn hint-btn", "💡 " + L(UI.hint));
  btn.type = "button";
  let shown = 0;
  const open = () => {
    if (shown >= steps.length) return;
    S.usedHint = true;
    const step = el("div", "hintbox qh-step", `<span class="qh-n">${shown + 1}</span> ${L(steps[shown])}`);
    panel.appendChild(step);
    shown++;
    if (shown >= steps.length) { btn.textContent = "✓ " + L(UI.noMoreHints); btn.disabled = true; }
    else btn.textContent = "💡 " + L(UI.anotherHint);
  };
  btn.addEventListener("click", open);
  wrap.append(panel, btn);
  host.appendChild(wrap);
  return { wrap, btn, open, hide: () => { btn.hidden = true; } };
}

/* ---------------- rendering ---------------- */
function render() {
  const app = $(".ff-app");
  const item = S.items[S.i];
  if (!item) return finish();

  if (item.skillId && S.onRoundShown && !S.metShown.has(item.skillId)) {
    S.metShown.add(item.skillId);
    S.onRoundShown(item.skillId);
  }

  const view = el("div", "view");
  view.style.setProperty("--accent", item.accent || S.q.accent || "#3aa0ff");

  /* progress + a way OUT — an interactive round must never be a locked room */
  const bar = el("div", "qbar");
  bar.innerHTML = `<div class="qprog"><i style="width:${(S.i / S.items.length) * 100}%"></i></div>
    <div class="qcount">${S.i + 1} ${L(UI.roundOf)} ${S.items.length}</div>`;
  const backBtn = el("button", "link-btn back-btn", "‹ " + L(UI.mapShort));
  backBtn.type = "button";
  backBtn.style.padding = "2px 6px";
  backBtn.addEventListener("click", () => {
    const oq = S && S.onQuit;
    S = null;
    if (oq) oq();
  });
  bar.prepend(backBtn);
  view.appendChild(bar);

  if (S.boost && S.i === 0) {
    view.appendChild(el("div", "boost-banner",
      `<span class="boost-icon">🛟</span><div><b>${L(UI.boostTitle)}</b><div class="small muted">${L(UI.boostBlurb)}</div></div>`));
  }

  const wrap = el("div", "qwrap");
  view.appendChild(wrap);

  if (item.stem) wrap.appendChild(el("div", "stem", L(item.stem)));
  wrap.appendChild(el("div", "prompt", L(item.prompt)));

  const gbox = el("div", "graphbox");
  gbox.id = "gbox";
  const coach = el("div", "ivnote");
  const meter = el("div", "ivmeter");
  const askslot = el("div", "stack");
  const asked = (item.type === "interactive" && item.then) ? item.then : item;
  /* a keypad round is not an option grid — its own host class skips the
     .opts grid layout entirely (the ported .keypad block lays itself out).
     Checked on `asked`, not `item`, so an interactive round whose `then`
     is a keypad (qK's R2 kiss round: drag the line, then type the k —
     batch 3 session 2 evening amendment) gets the keypad layout too, not
     the option grid its outer `item.type` ("interactive") would imply. */
  const optbox = el("div", (asked.type === "kp" ? "kp-host" : "opts")
    + (item.wide || asked.wide || optionsNeedOneColumn(asked) ? " one" : ""));
  const fbslot = el("div", "stack");

  let ladder = null;

  if (item.type === "interactive") {
    wrap.append(gbox, meter, coach, askslot, optbox, fbslot);
    meter.style.display = item.meter ? "" : "none";
    coach.textContent = L(item.coach || "");
    optbox.style.display = "none";
    ladder = buildHintLadder(item, wrap);
    const skipBtn = el("button", "link-btn skip-btn", L(UI.skip));
    skipBtn.type = "button";
    skipBtn.addEventListener("click", () => {
      if (S.answered) return;
      S.answered = true;
      skipBtn.disabled = true;
      recordAnswer("skipped", 0);
      showFeedback(item.then || item, "wrong", fbslot, ladder, null);
    });
    const skipRow = el("div", "center");
    skipRow.appendChild(skipBtn);
    wrap.appendChild(skipRow);
    mountInteractive(item, gbox, coach, meter, askslot, optbox, fbslot, ladder);
  } else {
    if (item.graph) wrap.appendChild(gbox); else gbox.remove();
    wrap.append(optbox, fbslot);
    meter.remove(); coach.remove(); askslot.remove();
    if (item.graph) staticGraph(gbox, item.graph);
    ladder = buildHintLadder(item, wrap);
    if (item.type === "kp") paintKeypad(item, optbox, fbslot, ladder);
    else paintOptions(item, optbox, fbslot, ladder);
  }

  /* Boost: the first hint rung opens by itself, so the scaffold is in front
     of the learner without them having to admit they need it */
  if (S.boost && ladder) ladder.open();

  app.textContent = "";
  app.appendChild(view);
  scrollToTop();
}

/* ---------------- interactive gate ---------------- */
function mountInteractive(item, gbox, coach, meter, askslot, optbox, fbslot, ladder) {
  let unlocked = false;

  const done = () => {
    if (unlocked || S.answered) return;
    unlocked = true;
    askslot.textContent = "";
    /* freeDrag rounds (qK's R2/R3/R4, her ruling 2026-08-21 evening) fire
       done() synchronously, before the mount's first paint — there is no
       gate closing for the learner to see, so overwriting the coach with
       the generic "unlocked" congratulation would silently replace a
       hand-written invitation ("drag the line if you want to see") with
       text the learner never asked for, and they would never see the
       original line at all (it would be swapped out before the browser
       ever paints it). Leave it exactly as authored. */
    if (!item.freeDrag) {
      coach.textContent = L(item.unlockMsg || UI.unlocked);
      coach.style.color = "var(--good)";
    }
    if (!item.then) {
      S.score++; S.xp += XP_FULL;
      recordAnswer("full", XP_FULL);
      showFeedback(item, "full", fbslot, ladder, null); return;
    }
    optbox.style.display = "";
    const q = item.then;
    if (q.prompt) {
      const p = el("div", "prompt", L(q.prompt));
      optbox.parentNode.insertBefore(p, optbox);
    }
    /* qK's R2 kiss round drags a line AND types an answer — the reveal
       is a keypad, not an option grid. One code path either way:
       paintKeypad/paintOptions are the SAME functions a plain kp/mc
       round uses at the top of render(), never duplicated here. */
    if (q.type === "kp") paintKeypad(q, optbox, fbslot, ladder);
    else paintOptions(q, optbox, fbslot, ladder);
  };

  const nudge = (msg) => { coach.textContent = L(msg); coach.style.color = ""; };

  const setMeter = (s) => {
    if (!item.meter) return;
    const dir = s.dir > 0 ? "up" : s.dir < 0 ? "down" : "";
    meter.className = "ivmeter " + dir;
    meter.innerHTML = `<span class="dirn">${s.dir > 0 ? "⬆" : s.dir < 0 ? "⬇" : "•"}</span>
      <span>${s.dir > 0 ? L(UI.climbing) : s.dir < 0 ? L(UI.descending) : L(UI.atStart)}</span>
      <span class="walkbar"><i style="width:${Math.round((s.frac || 0) * 100)}%"></i></span>`;
  };
  setMeter({ dir: 0, frac: 0 });

  /* the per-section chooser the sweep mechanic uses */
  const ask = (prompt, options, onPick) => {
    askslot.textContent = "";
    const p = el("div", "small muted", L(prompt));
    const row = el("div", "chips");
    options.forEach((o) => {
      const b = el("button", "chip", L(o.label));
      b.type = "button";
      b.addEventListener("click", () => {
        if (o.correct) {
          b.classList.add("good");
          [...row.children].forEach((c) => { c.disabled = true; });
          onPick(true);
        } else {
          b.classList.add("bad");
          b.disabled = true;
          onPick(false);
        }
      });
      row.appendChild(b);
    });
    askslot.append(p, row);
  };

  try {
    S.ctl = item.build(gbox, done, nudge, setMeter, ask);
  } catch (err) {
    console.error("interactive build failed", err);
    toast("Kon nie die grafiek laai nie / could not load the graph", true);
    done();
  }
}

/* ---------------- options + marking ---------------- */
function paintOptions(q, optbox, fbslot, ladder) {
  optbox.textContent = "";
  let chanceUsed = false;
  const nudgeEl = el("div", "second-nudge");
  nudgeEl.hidden = true;

  q.options.forEach((o) => {
    const b = el("button", "opt", L(o.label));
    b.type = "button";
    b.addEventListener("click", () => {
      if (S.answered) return;
      /* Second chance: the first wrong pick greys out with its
         misconception nudge instead of ending the question; the next
         pick is final (correct = half marks). Boost gives this to
         everyone; Round D gives it always (alwaysSecondChance). */
      if (secondChanceAllowed(S.q, S.boost) && !chanceUsed && !o.correct && q.options.length > 2) {
        chanceUsed = true;
        b.disabled = true;
        b.classList.add("bad");
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = "💡 " + L(o.misc || UI.secondChance);
        return;
      }
      S.answered = true;
      nudgeEl.hidden = true;
      [...optbox.children].forEach((c, k) => {
        c.disabled = true;
        if (q.options[k].correct) c.classList.add("good");
      });
      if (!o.correct) b.classList.add("bad");
      let outcome = "wrong";
      let gained = 0;
      if (o.correct && chanceUsed) { outcome = "half"; S.score += 0.5; gained = XP_HALF; S.xp += gained; }
      else if (o.correct) { outcome = "full"; S.score += 1; gained = S.usedHint ? XP_HINTED : XP_FULL; S.xp += gained; }
      /* the record names the HINTED case separately — the feedback card
         still says plain "Korrek", because a learner who used a hint got
         it right and is not told off for it (her teach-layer ruling) */
      recordAnswer(outcome === "full" && gained === XP_HINTED ? "hinted" : outcome, gained);
      showFeedback(q, outcome, fbslot, ladder, o.correct ? null : o);
    });
    optbox.appendChild(b);
  });
  optbox.parentNode.insertBefore(nudgeEl, optbox.nextSibling);
}

/* ---------------- keypad + marking ----------------
   A typed-number round (qK's R2 kiss round, batch 3 session 2 keypad
   amendment). Same scoring and second-chance rules as paintOptions() —
   the entry surface differs, the teach layer does not: secondChanceAllowed()
   gates one retry exactly the way it gates a wrong mc tap, XP amounts are
   the same constants, and the final submit runs through the same
   showFeedback() every other round type uses. */
function paintKeypad(q, optbox, fbslot, ladder) {
  optbox.textContent = "";
  let chanceUsed = false;
  const nudgeEl = el("div", "second-nudge");
  nudgeEl.hidden = true;

  const kpad = mountKeypad(optbox, {
    unit: q.unit, allowNeg: q.allowNeg,
    onSubmit: (v) => {
      if (S.answered || !Number.isFinite(v)) return;   // an empty/garbage submit never counts
      const correct = near(v, q.correct);
      const misc = correct ? null : (q.wrongMisc ? q.wrongMisc(v) : null);
      /* Second chance: the first wrong entry clears and nudges instead of
         ending the round; the next submit is final (correct = half marks).
         Boost gives this to everyone; Round D gives it always
         (alwaysSecondChance) — the exact same gate paintOptions() uses. */
      if (secondChanceAllowed(S.q, S.boost) && !chanceUsed && !correct) {
        chanceUsed = true;
        kpad.clear();
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = "💡 " + L(misc || UI.secondChance);
        return;
      }
      S.answered = true;
      nudgeEl.hidden = true;
      kpad.disable();                                   // final — no double submits
      let outcome = "wrong";
      let gained = 0;
      if (correct && chanceUsed) { outcome = "half"; S.score += 0.5; gained = XP_HALF; S.xp += gained; }
      else if (correct) { outcome = "full"; S.score += 1; gained = S.usedHint ? XP_HINTED : XP_FULL; S.xp += gained; }
      recordAnswer(outcome === "full" && gained === XP_HINTED ? "hinted" : outcome, gained);
      showFeedback(q, outcome, fbslot, ladder, correct ? null : { misc });
    },
  });
  optbox.parentNode.insertBefore(nudgeEl, optbox.nextSibling);
}

/* outcome: "full" | "half" | "wrong". `chosen` = the wrong option picked. */
function showFeedback(q, outcome, fbslot, ladder, chosen) {
  if (ladder) ladder.hide();
  const good = outcome !== "wrong";
  const fb = el("div", "fb " + (good ? "good" : "bad"));
  let html = `<h3>${outcome === "full" ? "✓ " + L(UI.correct) : outcome === "half" ? "✓ " + L(UI.almost) : "✗ " + L(UI.notQuite)}</h3>`;
  if (outcome === "wrong" && chosen && chosen.misc) html += `<div class="fb-nudge">💡 ${L(chosen.misc)}</div>`;
  if (outcome !== "full") html += `<div>${L(UI.answerWas)} <b>${L(q.answerLabel || "")}</b></div>`;
  if (Array.isArray(q.solution) && q.solution.length) {
    html += `<div class="fb-steps"><div class="fb-steps-head">${L(UI.theMethod)}:</div>`
      + q.solution.map((s) => `<div class="fb-step">${L(s)}</div>`).join("") + `</div>`;
  }
  fb.innerHTML = html;
  const next = el("button", "btn primary big", S.i === S.items.length - 1 ? L(UI.finish) : L(UI.next));
  next.type = "button";
  next.addEventListener("click", () => {
    /* disable BEFORE advancing (her double-submit rule): a second tap on
       the final "Klaar" used to land after finish() had set S = null and
       throw on S.i++ — the results screen was already up, so the learner
       saw nothing, but the error was real (foreman review fix 2026-08-23) */
    if (next.disabled || !S) return;
    next.disabled = true;
    S.i++; S.answered = false; S.usedHint = false; S.ctl = null;
    render();
  });
  fbslot.append(fb, next);
  next.scrollIntoView({ block: "nearest" });
}

function finish() {
  const { q, score, items, fails, onFinish, boost, record } = S;
  let { xp } = S;
  const frac = items.length ? score / items.length : 0;
  /* Comeback: finally passing on the 3rd+ attempt earns a bonus — persistence
     is the exact behaviour worth celebrating (Circle Quest's rule). */
  const comeback = fails >= BOOST_AFTER && frac >= PASS;
  if (comeback) xp += COMEBACK;
  S = null;
  onFinish({
    questId: q.id, score, total: items.length, xp, comeback, boost,
    passed: frac >= PASS,
    /* per-item outcomes, in play order — the mount's host recomputes its
       own payout from these instead of trusting `xp`. */
    answered: record,
  });
}
