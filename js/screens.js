/* ============================================================
   SCREENS — the quest map and the results card
   ============================================================ */
import { el, $, toast } from "./ui.js";
import { L, UI, getLang, setLang } from "./i18n.js";
import { QUESTS } from "./quests/index.js";

/* ---------------- top chrome ---------------- */
export function paintChrome(profile, onLang) {
  const c = $("#chrome");
  c.textContent = "";
  const brand = el("div", "brand", `<span class="sparkle">✦</span> ${L(UI.appName)}`);
  const right = el("div", "chrome-right");
  const xp = el("div", "xpchip", `${L(UI.xp)} <b>${profile.xp || 0}</b>`);
  const tog = el("div", "langtog");
  ["af", "en"].forEach((code) => {
    const b = el("button", getLang() === code ? "on" : "", code.toUpperCase());
    b.type = "button";
    b.addEventListener("click", () => { setLang(code); onLang(); });
    tog.appendChild(b);
  });
  right.append(xp, tog);
  c.append(brand, right);
}

/* ---------------- the map ---------------- */
export function mapScreen(profile, onPlay, onReset) {
  const view = el("div", "view");
  view.appendChild(el("div", "eyebrow", L(UI.tagline)));
  view.appendChild(el("h1", null, L(UI.appName)));
  view.appendChild(el("div", "muted small", L(B_INTRO)));

  const grid = el("div", "qgrid");
  grid.style.marginTop = "14px";
  QUESTS.forEach((q, i) => {
    const st = profile.quests[q.id] || {};
    const prev = i === 0 ? { done: true } : (profile.quests[QUESTS[i - 1].id] || {});
    const locked = i > 0 && !prev.done;
    const card = el("button", "qcard" + (st.done ? " done" : ""));
    card.type = "button";
    card.disabled = locked;
    card.style.setProperty("--accent", q.accent || "#3aa0ff");
    card.innerHTML = `<span class="qn">${locked ? "🔒" : i + 1}</span>
      <span class="qt"><b>${L(q.title)}</b><span>${L(q.blurb)}</span></span>
      <span class="qs">${st.best != null ? `${st.best}/${st.total} ${L(UI.best)}` : ""}</span>`;
    card.addEventListener("click", () => { if (!locked) onPlay(q.id); });
    if (locked) card.title = L(UI.locked);
    grid.appendChild(card);
  });
  view.appendChild(grid);

  const reset = el("button", "link-btn", L(UI.reset));
  reset.type = "button";
  reset.addEventListener("click", () => { if (confirm(L(UI.resetSure))) onReset(); });
  const foot = el("div", "center");
  foot.style.marginTop = "18px";
  foot.appendChild(reset);
  view.appendChild(foot);
  return view;
}

const B_INTRO = {
  en: "Seven quests. Each one teaches your eyes one job — by making your hand do it first.",
  af: "Sewe soektogte. Elkeen leer jou oë een taak — deur eers jou hand dit te laat doen.",
};

/* ---------------- results ---------------- */
export function resultScreen(res, questTitle, onAgain, onMap, onLesson) {
  const view = el("div", "view");
  const pct = Math.round((res.score / res.total) * 100);
  const scoreStr = String(res.score).replace(".", ",");
  const card = el("div", "card res");
  card.innerHTML = `<div class="eyebrow">${L(questTitle)}</div>
    <div class="big">${scoreStr}/${res.total}</div>
    <div class="sub">${pct}% · +${res.xp} ${L(UI.xp)}</div>
    ${res.comeback ? `<div class="comeback-pill">🏅 ${L(UI.comeback)} · +40 XP</div>` : ""}`;
  view.appendChild(card);
  const again = el("button", "btn primary big", L(UI.again));
  const back = el("button", "btn big ghost", L(UI.backToMap));
  again.type = "button"; back.type = "button";
  again.addEventListener("click", onAgain);
  back.addEventListener("click", onMap);
  const stack = el("div", "stack");
  stack.style.marginTop = "16px";
  stack.appendChild(again);
  if (onLesson) {
    const lesson = el("button", "btn big ghost", "🔭 " + L(UI.lessonAgain));
    lesson.type = "button";
    lesson.addEventListener("click", onLesson);
    stack.appendChild(lesson);
  }
  stack.appendChild(back);
  view.appendChild(stack);
  return view;
}

export { toast };
