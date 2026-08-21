/* ============================================================
   NUMBER KEYPAD — the only typed input in the game
   ------------------------------------------------------------
   Ported from blipwork's js/keypad.js (batch 3 session 2 amendment,
   Megan's ruling 2026-08-21: qK's R2 kiss round needs typed entry, not
   four mc buttons — the answer is read straight off a marked point, and
   a keypad makes that "read one number" flow honest instead of hiding it
   behind decoys). Same shape, same classes, same tokens — no second look
   forked; graph-quest and blipwork share the System Window theme.

   On-screen keys only — no device keyboard. Digits, a decimal COMMA,
   a minus (when negatives are allowed), delete, submit.

   The buffer keeps a plain "-" for editing; what the learner SEES follows
   house style — the real minus sign (−), matching check.js's fmtComma()
   and funclib's C() everywhere else in the app.

   graph-quest's own check.js has no parseNum() (blipwork's lives beside a
   different answerCorrect() this app doesn't have) — so a small
   comma-aware parser travels with this file instead of forking a shared
   one for a single caller.

   mountKeypad(host, { unit, allowNeg, onSubmit(value, raw) })
     -> { value, raw, clear(), disable() }
   ============================================================ */
import { el } from "../ui.js";
import { B, L } from "../i18n.js";

const SUBMIT = B("Submit ✓", "Dien in ✓");

/* "8,2" or "8.2" -> 8.2 ; "" / "-" / "," -> NaN */
function parseNum(str) {
  if (str == null) return NaN;
  const cleaned = String(str).trim().replace(",", ".");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function mountKeypad(host, opts = {}) {
  const { unit = "", allowNeg = false, onSubmit } = opts;
  let buf = "";   // e.g. "-8,2" — the real minus only ever shows, never lives in here

  const wrap = el("div", "keypad");
  const disp = el("div", "kdisp empty");
  disp.innerHTML = `<span class="kval">0</span>${unit ? `<span class="unit">${unit}</span>` : ""}`;
  const valEl = disp.querySelector(".kval");
  wrap.appendChild(disp);

  function paint() {
    const shown = buf === "" ? "0" : buf.replace(/^-/, "−");
    valEl.textContent = shown;
    disp.classList.toggle("empty", buf === "");
  }
  function press(k) {
    if (k === "del") buf = buf.slice(0, -1);
    else if (k === "neg") buf = buf.startsWith("-") ? buf.slice(1) : "-" + buf;
    else if (k === ",") { if (!buf.includes(",") && buf !== "" && buf !== "-") buf += ","; }
    else { if (buf.replace("-", "").replace(",", "").length < 6) buf += k; }   // length guard
    paint();
  }

  const grid = el("div", "kgrid");
  const addKey = (label, cls, fn) => {
    const b = el("button", "key" + (cls ? " " + cls : ""), label);
    b.type = "button";
    b.addEventListener("click", fn);
    grid.appendChild(b);
    return b;
  };

  ["7", "8", "9", "4", "5", "6", "1", "2", "3"].forEach((d) => addKey(d, "", () => press(d)));
  addKey(",", "", () => press(","));
  addKey("0", "", () => press("0"));
  addKey("⌫", "del", () => press("del"));
  if (allowNeg) addKey("±", "", () => press("neg"));
  addKey(L(SUBMIT), "submit" + (allowNeg ? " wide2" : " wide"), () => {
    const v = parseNum(buf);
    onSubmit && onSubmit(v, buf);
  });
  // when negatives are allowed the submit spans the remaining 2 cols
  if (allowNeg) grid.lastChild.style.gridColumn = "span 2";

  wrap.appendChild(grid);
  host.appendChild(wrap);
  paint();

  return {
    get value() { return parseNum(buf); },
    get raw() { return buf; },
    clear() { buf = ""; paint(); },
    disable() { grid.querySelectorAll(".key").forEach((b) => { b.disabled = true; }); },
  };
}
