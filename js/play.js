/* ============================================================
   THE PLAY LOOP
   ------------------------------------------------------------
   Two kinds of round:

     mc            picture (maybe) + prompt + tap an option
     interactive   DO the thing first — the options stay hidden
                   until the mechanic reports it is done

   Nothing is typed. Marking is always about the maths, never
   about spelling or a keyboard (blipwork's locked decision).
   ============================================================ */
import { el, $, toast } from "./ui.js";
import { L, UI, getLang } from "./i18n.js";
import { staticGraph } from "./engine/interactive.js";
import { buildRound, getQuest } from "./quests/index.js";

let S = null;   // the running session

export function startQuest(questId, onFinish, onQuit) {
  const q = getQuest(questId);
  const items = buildRound(questId);
  S = { q, items, i: 0, score: 0, xp: 0, onFinish, onQuit, answered: false, usedHint: false, ctl: null };
  render();
}

export function rerender() { if (S) render(); }
export const isPlaying = () => !!S;
export function quitQuest() { S = null; }

/* ---------------- rendering ---------------- */
function render() {
  const app = $("#app");
  const item = S.items[S.i];
  if (!item) return finish();

  const view = el("div", "view");
  view.style.setProperty("--accent", item.accent || S.q.accent || "#3aa0ff");

  /* progress + a way OUT — an interactive round must never be a locked room */
  const bar = el("div", "qbar");
  bar.innerHTML = `<div class="qprog"><i style="width:${(S.i / S.items.length) * 100}%"></i></div>
    <div class="qcount">${S.i + 1} ${L(UI.roundOf)} ${S.items.length}</div>`;
  const backBtn = el("button", "link-btn", "‹ " + L(UI.mapShort));
  backBtn.type = "button";
  backBtn.style.padding = "2px 6px";
  backBtn.addEventListener("click", () => {
    const oq = S && S.onQuit;
    S = null;
    if (oq) oq();
  });
  bar.prepend(backBtn);
  view.appendChild(bar);

  const wrap = el("div", "qwrap");
  view.appendChild(wrap);

  if (item.stem) wrap.appendChild(el("div", "stem", L(item.stem)));
  wrap.appendChild(el("div", "prompt", L(item.prompt)));

  const gbox = el("div", "graphbox");
  gbox.id = "gbox";
  const coach = el("div", "ivnote");
  const meter = el("div", "ivmeter");
  const askslot = el("div", "stack");
  const optbox = el("div", "opts" + (item.wide || (item.then && item.then.wide) ? " one" : ""));
  const fbslot = el("div", "stack");

  const hintBtn = el("button", "link-btn", L(UI.hint));
  hintBtn.type = "button";

  if (item.type === "interactive") {
    const helpRow = el("div", "row");
    helpRow.style.justifyContent = "center";
    const skipBtn = el("button", "link-btn", L(UI.skip));
    skipBtn.type = "button";
    skipBtn.addEventListener("click", () => {
      if (S.answered) return;
      S.answered = true;
      skipBtn.disabled = true;
      showFeedback(item.then || item, false, fbslot, hintBtn);
    });
    helpRow.append(hintBtn, skipBtn);
    wrap.append(gbox, meter, coach, askslot, optbox, fbslot, helpRow);
    meter.style.display = item.meter ? "" : "none";
    coach.textContent = L(item.coach || "");
    optbox.style.display = "none";
    mountInteractive(item, gbox, coach, meter, askslot, optbox, fbslot, hintBtn);
  } else {
    if (item.graph) wrap.appendChild(gbox); else gbox.remove();
    wrap.append(optbox, fbslot, hintBtn);
    meter.remove(); coach.remove(); askslot.remove();
    if (item.graph) staticGraph(gbox, item.graph);
    paintOptions(item, optbox, fbslot, hintBtn);
  }

  hintBtn.addEventListener("click", () => {
    const src = item.type === "interactive" ? item.then : item;
    if (!src || !src.hint) { toast(L(UI.hint)); return; }
    if ($(".hintbox")) return;
    S.usedHint = true;
    fbslot.prepend(el("div", "hintbox", L(src.hint)));
    hintBtn.disabled = true;
  });

  app.textContent = "";
  app.appendChild(view);
  window.scrollTo(0, 0);
}

/* ---------------- interactive gate ---------------- */
function mountInteractive(item, gbox, coach, meter, askslot, optbox, fbslot, hintBtn) {
  let unlocked = false;

  const done = () => {
    if (unlocked) return;
    unlocked = true;
    askslot.textContent = "";
    coach.textContent = L(item.unlockMsg || UI.unlocked);
    coach.style.color = "var(--good)";
    if (!item.then) { S.score++; showFeedback(item, true, fbslot, hintBtn); return; }
    optbox.style.display = "";
    const q = item.then;
    if (q.prompt) {
      const p = el("div", "prompt", L(q.prompt));
      optbox.parentNode.insertBefore(p, optbox);
    }
    paintOptions(q, optbox, fbslot, hintBtn);
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
function paintOptions(q, optbox, fbslot, hintBtn) {
  optbox.textContent = "";
  q.options.forEach((o) => {
    const b = el("button", "opt", L(o.label));
    b.type = "button";
    b.addEventListener("click", () => {
      if (S.answered) return;
      S.answered = true;
      [...optbox.children].forEach((c) => { c.disabled = true; });
      b.classList.add(o.correct ? "good" : "bad");
      if (!o.correct) {
        [...optbox.children].forEach((c, k) => { if (q.options[k].correct) c.classList.add("good"); });
      } else {
        S.score++;
        S.xp += S.usedHint ? 5 : 10;
      }
      showFeedback(q, o.correct, fbslot, hintBtn);
    });
    optbox.appendChild(b);
  });
}

function showFeedback(q, ok, fbslot, hintBtn) {
  hintBtn.style.display = "none";
  const fb = el("div", "fb " + (ok ? "good" : "bad"));
  fb.innerHTML = `<h3>${ok ? L(UI.correct) : L(UI.notQuite)}</h3>
    <div>${ok ? "" : `${L(UI.answerWas)} <b>${L(q.answerLabel || "")}</b>`}</div>`;
  const next = el("button", "btn primary big", S.i === S.items.length - 1 ? L(UI.finish) : L(UI.next));
  next.type = "button";
  next.addEventListener("click", () => {
    S.i++; S.answered = false; S.usedHint = false; S.ctl = null;
    render();
  });
  fbslot.append(fb, next);
  next.scrollIntoView({ block: "nearest" });
}

function finish() {
  const { q, score, items, xp, onFinish } = S;
  S = null;
  onFinish({ questId: q.id, score, total: items.length, xp });
}
