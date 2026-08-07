/* ============================================================
   BILINGUAL TEXT
   ------------------------------------------------------------
   Every learner-facing string exists as {en, af} side by side, so
   flipping the toggle re-renders instantly (no regeneration, no
   losing the current question).

     B("Range", "Waardeversameling")   → a bilingual value
     L(v)                              → resolve for the current language

   L() also accepts a plain string (maths that reads the same in
   both languages: equations, coordinates, intervals).
   ============================================================ */

const KEY = "gq.lang";
let LANG = (() => {
  try { return localStorage.getItem(KEY) || "af"; } catch { return "af"; }
})();

export const getLang = () => LANG;
export function setLang(l) {
  LANG = l === "en" ? "en" : "af";
  try { localStorage.setItem(KEY, LANG); } catch { /* private mode */ }
}

export const B = (en, af) => ({ en, af });
export function L(v) {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  return v[LANG] ?? v.en ?? v.af ?? "";
}

/* ---- UI chrome strings ---- */
export const UI = {
  appName:      B("Graph Quest", "Grafiek Quest"),
  tagline:      B("Learn to SEE the graph", "Leer om die grafiek te SIEN"),
  play:         B("Play", "Speel"),
  start:        B("Start", "Begin"),
  next:         B("Next", "Volgende"),
  finish:       B("Finish", "Klaar"),
  check:        B("Check", "Kontroleer"),
  again:        B("Play again", "Speel weer"),
  backToMap:    B("Back to the map", "Terug na die kaart"),
  hint:         B("I'm stuck", "Ek is vas"),
  correct:      B("Correct", "Korrek"),
  notQuite:     B("Not quite", "Nie heeltemal nie"),
  answerWas:    B("The answer:", "Die antwoord:"),
  score:        B("Score", "Punt"),
  xp:           B("XP", "XP"),
  quest:        B("Quest", "Soektog"),
  locked:       B("Finish the quest before this one first", "Voltooi eers die vorige soektog"),
  done:         B("done", "klaar"),
  best:         B("best", "beste"),
  reset:        B("Reset my progress", "Herstel my vordering"),
  resetSure:    B("Wipe all progress on this device?", "Vee alle vordering op hierdie toestel uit?"),
  loading:      B("Loading…", "Laai…"),
  roundOf:      B("of", "van"),

  /* interactive coaching lines */
  dragDown:     B("Drag the point onto the graph", "Sleep die punt op die grafiek"),
  dragAcross:   B("Drag the point sideways onto the graph", "Sleep die punt sywaarts op die grafiek"),
  snapped:      B("On the graph!", "Op die grafiek!"),
  unlocked:     B("Nice — now answer it.", "Mooi — antwoord dit nou."),
  walkIt:       B("Walk the point from left to right — it will not go back", "Stap die punt van links na regs — dit gaan nie terug nie"),
  walkAgain:    B("Walk it again", "Stap dit weer"),
  climbing:     B("CLIMBING", "STYGEND"),
  descending:   B("DESCENDING", "DALEND"),
  atStart:      B("Start dragging", "Begin sleep"),
  walkedAll:    B("You walked the whole graph", "Jy het die hele grafiek gestap"),
  finishWalk:   B("Walk all the way to the right first", "Stap eers heeltemal tot regs"),
  pullCurtain:  B("Pull the shade over the part where the graph lives", "Trek die skerm oor die deel waar die grafiek lê"),
  paintSigns:   B("Mark each piece + or −", "Merk elke stuk + of −"),
  paintLeft:    B("Still to mark:", "Nog te merk:"),
  tapSockets:   B("Tap every place that needs a cut line", "Tik elke plek wat 'n snylyn nodig het"),
  cutMissing:   B("A boundary is missing", "Jy kort 'n grens"),
  cutExtra:     B("One of those does not need a line", "Een van daai het nie 'n lyn nodig nie"),
  sweepIt:      B("Slide the scan line right, section by section", "Skuif die skandeerlyn regs, afdeling vir afdeling"),
  whichTop:     B("In this section, which graph is on top?", "In hierdie afdeling, watter grafiek lê bo?"),
  buildAnswer:  B("Build the answer", "Bou die antwoord"),
};

/* the two axis words, used all over quest 1 */
export const AXIS = {
  x: B("the x-value", "die x-waarde"),
  y: B("the y-value", "die y-waarde"),
  xAxis: B("x-axis", "x-as"),
  yAxis: B("y-axis", "y-as"),
  both: B("both", "albei"),
};
