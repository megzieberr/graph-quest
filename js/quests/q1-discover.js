/* ============================================================
   QUEST 1 · ONTDEK — the discovery sliders   ★ session 2
   ------------------------------------------------------------
   Six beats, always in the same order, because this one is a
   lesson and not a drill:

     1. sign of a      happy or sad
     2. size of a      narrow or wide
     3. p              slides left/right — and the bracket lies
     4. q              the whole graph rides up and down
     5. c              (standard form) pins the y-cut
     6. q vs c         two panels, the one contrast that fixes
                       the classic mix-up

   THE RULE (Law 7, Circle Quest's no-spoilers rule): the screen
   shows the raw effect and nothing else. The prompt names the
   MOVE ("Trek a. Wat gebeur?"), never the finding. The learner
   drags every stop, commits to a conclusion from four options,
   and only THEN does the method card state the fact. The app
   never announces it first.

   No algebra anywhere: every answer is something you saw.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, L } from "../i18n.js";
import { varSlider, sliderPair } from "../engine/slider.js";
import { specFor, windowFor } from "./_graphs.js";
import {
  parabolaFromTP, paraTP, paraStd, paraYInt, eqTPStr, eqStr,
  ptStr, EQ, pick, randInt,
} from "../funclib.js";

const ACC = "#7b5cff";

const DRAGALL = B("Drag it through the whole range — the options only open once you have seen every stop.",
                  "Trek dit deur die hele reeks — die opsies maak eers oop as jy elke stop gesien het.");
const SAWWHAT = B("What did you see?", "Wat het jy gesien?");

/* the marked points that make the effect readable. They are the raw
   MEASUREMENT (a live coordinate), never the conclusion. */
function tpPoint(cv) {
  const tp = paraTP(cv);
  return { x: tp.x, y: tp.y, on: 0, label: ptStr(tp.x, tp.y), place: paraStd(cv).a > 0 ? "below" : "above" };
}
function yIntPoint(cv) {
  const c = paraYInt(cv);
  return { x: 0, y: c, on: 0, label: ptStr(0, c), place: "right" };
}

/* ------------------------------------------------------------
   One beat: a live graph, one slider, then the commit.

   The window is sized ONCE from every curve the slider can make,
   so the picture never re-zooms under the learner's finger. If no
   honest window fits (session 1's rule: never zoom out), this
   returns null and the caller draws different numbers.
   ------------------------------------------------------------ */
function beat(cfg) {
  const w = cfg.w || 360, h = cfg.h || 300;
  const curves = cfg.values.map(cfg.curveOf);
  const win = windowFor(curves, { w, h });
  if (!win) return null;

  const specOf = (v) => {
    const cv = cfg.curveOf(v);
    return specFor([cv], {
      win, w, h, accent: ACC, ticks: "labels", labels: ["f"],
      points: cfg.pointsOf ? [cfg.pointsOf(cv)] : [],
    });
  };

  return iq({
    concept: "discover", kind: "slider", accent: ACC, skillId: cfg.id,
    prompt: cfg.prompt,
    stem: cfg.stem,
    coach: DRAGALL,
    hints: cfg.hints,
    build: (host, done) => varSlider(host, {
      name: cfg.name, values: cfg.values, specOf, eqOf: cfg.eqOf,
      start: cfg.start, onComplete: done,
    }),
    then: mc("discover", SAWWHAT, cfg.correct, cfg.wrongs,
      { wide: true, solution: cfg.method, answerLabel: cfg.correct }),
  });
}

/* draw parameters until one gives an honest window. A beat that can
   never be drawn is a bug, not a bad roll — so say so out loud
   (verify catches it as a thrown generator). */
function beatOrDie(id, make) {
  for (let k = 0; k < 80; k++) {
    const b = make();
    if (b) return b;
  }
  throw new Error(`discovery beat ${id}: no honest window fits any parameter draw`);
}

/* ============================================================
   THE BEATS
   ============================================================ */
const BEATS = {

  /* ---------- 1. the SIGN of a: happy or sad ---------- */
  aSign: () => beatOrDie("aSign", () => {
    const p = pick([-1, 0, 1]), q = randInt(-2, 2);
    const correct = B("a positive → arms UP (happy); a negative → arms DOWN (sad)",
                      "a positief → arms OP (happy); a negatief → arms AF (sad)");
    return beat({
      id: "aSign", name: "a",
      values: [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2],
      curveOf: (a) => parabolaFromTP(a, p, q),
      pointsOf: tpPoint,
      eqOf: (a) => EQ(eqTPStr({ a, p, q }, "f(x)")),
      stem: EQ("f(x) = a(x − p)² + q"),
      prompt: B("Drag a. What happens?", "Trek a. Wat gebeur?"),
      hints: [
        B("Park a on 2 and look at the arms. Then park it on −2.",
          "Sit a op 2 en kyk na die arms. Sit dit dan op −2."),
        B("Did the turning point move? Or did only the arms turn over?",
          "Het die draaipunt beweeg? Of het net die arms omgedraai?"),
      ],
      correct,
      wrongs: [
        { label: B("a positive → arms DOWN (sad); a negative → arms UP (happy)",
                   "a positief → arms AF (sad); a negatief → arms OP (happy)"),
          misc: B("Look again at a = 1 and at a = −1 — which one is happy?",
                  "Kyk weer na a = 1 en a = −1 — watter een is happy?") },
        { label: B("The sign of a slides the graph up and down",
                   "Die teken van a skuif die grafiek op en af"),
          misc: B("The turning point stayed exactly where it was the whole time.",
                  "Die draaipunt het heeltyd presies waar dit was gebly.") },
        { label: B("The sign of a makes the arms narrower or wider",
                   "Die teken van a maak die arms nouer of wyer"),
          misc: B("That is what the SIZE of a does, not its sign.",
                  "Dis wat die GROOTTE van a doen, nie sy teken nie.") },
      ],
      method: [
        B("a decides which way the arms point.", "a besluit watter kant toe die arms wys."),
        B("a &gt; 0 → happy (arms up). a &lt; 0 → sad (arms down).",
          "a &gt; 0 → happy (arms op). a &lt; 0 → sad (arms af)."),
        B("The turning point does not move — the graph only flips over.",
          "Die draaipunt beweeg nie — die grafiek draai net om."),
      ],
    });
  }),

  /* ---------- 2. the SIZE of a: narrow or wide ---------- */
  aSize: () => beatOrDie("aSize", () => {
    const p = pick([-1, 0, 1]), q = randInt(-1, 1);
    const correct = B("Bigger a → the arms come CLOSER together (narrower)",
                      "Groter a → die arms kom NADER aan mekaar (nouer)");
    return beat({
      id: "aSize", name: "a",
      values: [0.5, 1, 1.5, 2, 2.5, 3],
      curveOf: (a) => parabolaFromTP(a, p, q),
      pointsOf: tpPoint,
      eqOf: (a) => EQ(eqTPStr({ a, p, q }, "f(x)")),
      stem: EQ("f(x) = a(x − p)² + q"),
      prompt: B("a stays positive here. Drag a. What happens?",
                "a bly hier positief. Trek a. Wat gebeur?"),
      hints: [
        B("Compare a = 0,5 with a = 3. How far apart are the arms at the top of the picture?",
          "Vergelyk a = 0,5 met a = 3. Hoe ver uitmekaar is die arms bo in die prent?"),
        B("Watch the turning point while you drag. Does it move at all?",
          "Kyk na die draaipunt terwyl jy trek. Beweeg dit op of af?"),
      ],
      correct,
      wrongs: [
        { label: B("Bigger a → the arms go FURTHER apart (wider)",
                   "Groter a → die arms gaan VERDER uitmekaar (wyer)"),
          misc: B("At a = 3 the graph shot off the top of the frame almost at once — that is a narrow one.",
                  "By a = 3 het die grafiek amper dadelik bo uit die raam geskiet — dis 'n nou een.") },
        { label: B("a slides the graph up and down", "a skuif die grafiek op en af"),
          misc: B("The turning point stayed on its spot the whole time.",
                  "Die draaipunt het heeltyd op sy plek gebly.") },
        { label: B("a turns the graph upside down", "a draai die grafiek onderstebo"),
          misc: B("That is what a NEGATIVE a does. Here a stayed positive throughout.",
                  "Dis wat 'n NEGATIEWE a doen. Hier het a heeltyd positief gebly.") },
      ],
      method: [
        B("The bigger |a| is, the narrower the parabola.",
          "Hoe groter |a|, hoe nouer die parabool."),
        B("Between 0 and 1 it works the other way: a = 0,5 is wider than a = 1.",
          "Tussen 0 en 1 werk dit andersom: a = 0,5 is wyer as a = 1."),
        B("The turning point never moves — a only changes the shape.",
          "Die draaipunt beweeg nooit nie — a verander net die vorm."),
      ],
    });
  }),

  /* ---------- 3. p — and the bracket that lies about it ---------- */
  pShift: () => beatOrDie("pShift", () => {
    const a = pick([1, -1]), q = randInt(-1, 1);
    const correct = B("p slides the graph left and right — and the bracket shows the OPPOSITE sign: (x − 2) moves 2 to the right",
                      "p skuif die grafiek links en regs — en die hakie wys die TEENOORGESTELDE teken: (x − 2) skuif 2 na regs");
    return beat({
      id: "pShift", name: "p",
      values: [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2],
      curveOf: (p) => parabolaFromTP(a, p, q),
      pointsOf: tpPoint,
      eqOf: (p) => EQ(eqTPStr({ a, p, q }, "f(x)")),
      stem: EQ("f(x) = a(x − p)² + q"),
      prompt: B("Drag p. Watch the bracket and the turning point together.",
                "Trek p. Kyk na die hakie en die draaipunt saam."),
      hints: [
        B("Park p on 2. Read the bracket out loud, then read the turning point.",
          "Sit p op 2. Lees die hakie hardop, lees dan die draaipunt."),
        B("Now park p on −2. Which way did the graph go, and what does the bracket say now?",
          "Sit p nou op −2. Watter kant toe het die grafiek gegaan, en wat sê die hakie nou?"),
      ],
      correct,
      wrongs: [
        { label: B("(x − 2) moves 2 to the LEFT; (x + 2) moves 2 to the right",
                   "(x − 2) skuif 2 na LINKS; (x + 2) skuif 2 na regs"),
          misc: B("Read the turning point's x when the bracket said (x − 2). It was on the right-hand side.",
                  "Lees die draaipunt se x toe die hakie (x − 2) gelees het. Dit was aan die regterkant.") },
        { label: B("p slides the graph up and down", "p skuif die grafiek op en af"),
          misc: B("The turning point's height never changed — only its x did.",
                  "Die draaipunt se hoogte het nooit verander nie — net sy x.") },
        { label: B("p makes the arms narrower or wider", "p maak die arms nouer of wyer"),
          misc: B("The shape stayed identical the whole way; the graph only travelled sideways.",
                  "Die vorm het heelpad presies dieselfde gebly; die grafiek het net na die kant toe beweeg.") },
      ],
      method: [
        B("p is the x of the turning point.", "p is die x van die draaipunt."),
        B("The bracket reads (x − p), so it shows the opposite sign to the move: (x − 3) means p = 3 and the graph sits 3 to the RIGHT.",
          "Die hakie lees (x − p), dus wys dit die teenoorgestelde teken as die skuif: (x − 3) beteken p = 3 en die grafiek skuif 3 na REGS."),
        B("(x + 3) means p = −3: 3 to the LEFT.", "(x + 3) beteken p = −3: 3 na LINKS."),
      ],
    });
  }),

  /* ---------- 4. q — the whole graph rides ---------- */
  qShift: () => beatOrDie("qShift", () => {
    /* p is never 0 here: with the turning point off the y-axis,
       "q is the y-intercept" is visibly false, so that distractor
       has to be beaten by looking rather than by luck */
    const a = pick([1, -1]), p = pick([-1, 1]);
    const correct = B("q slides the WHOLE graph up and down. q is the y of the turning point.",
                      "q skuif die HELE grafiek op en af. q is die y van die draaipunt.");
    return beat({
      id: "qShift", name: "q",
      values: [-3, -2, -1, 0, 1, 2, 3],
      curveOf: (q) => parabolaFromTP(a, p, q),
      pointsOf: tpPoint,
      eqOf: (q) => EQ(eqTPStr({ a, p, q }, "f(x)")),
      stem: EQ("f(x) = a(x − p)² + q"),
      prompt: B("Drag q. Keep your eye on the turning point.",
                "Trek q. Kyk mooi na die draaipunt."),
      hints: [
        B("Park q on 3, then on −3. Read the turning point each time.",
          "Sit q op 3, dan op −3. Lees elke keer die draaipunt."),
        B("Compare the turning point's y with the number in the slider.",
          "Vergelyk die draaipunt se y met die getal in die skuiwer."),
      ],
      correct,
      wrongs: [
        { label: B("q slides the graph left and right", "q skuif die grafiek links en regs"),
          misc: B("The turning point's x stayed on the same number all the way.",
                  "Die draaipunt se x het heelpad op dieselfde getal gebly.") },
        { label: B("q is the y-intercept", "q is die y-afsnit"),
          misc: B("Look where this graph cuts the y-axis — that was never the same number as q.",
                  "Kyk waar hierdie grafiek die y-as sny — dit was nooit dieselfde getal as q nie.") },
        { label: B("q makes the arms narrower or wider", "q maak die arms nouer of wyer"),
          misc: B("The shape never changed; the whole picture just travelled up and down.",
                  "Die vorm het nooit verander nie; die hele prent het net op en af geskuif.") },
      ],
      method: [
        B("q is the y of the turning point.", "q is die y van die draaipunt."),
        B("Change q and the whole graph rides up or down — the shape stays exactly the same.",
          "Verander q en die hele grafiek skuif op of af — die vorm bly presies dieselfde."),
      ],
    });
  }),

  /* ---------- 5. c — standard form pins the y-cut ---------- */
  cCut: () => beatOrDie("cCut", () => {
    /* b is never 0: that keeps the turning point off the y-axis, so
       "c is the turning point's y" is something the picture disproves */
    const a = pick([1, -1]), b = pick([-2, 2]);
    const correct = B("c is the y-intercept — the graph cuts the y-axis at c",
                      "c is die y-afsnit — die grafiek sny die y-as by c");
    return beat({
      id: "cCut", name: "c",
      values: [-3, -2, -1, 0, 1, 2, 3],
      curveOf: (c) => ({ kind: "parabola", a, b, c }),
      pointsOf: yIntPoint,
      eqOf: (c) => EQ(eqStr({ kind: "parabola", a, b, c }, "f(x)")),
      stem: EQ("f(x) = ax² + bx + c"),
      prompt: B("Drag c. Watch where the graph cuts the y-axis.",
                "Trek c. Kyk waar die grafiek die y-as sny."),
      hints: [
        B("The marked point sits on the y-axis. Read it at c = 3 and again at c = −3.",
          "Die gemerkte punt lê op die y-as. Lees dit by c = 3 en weer by c = −3."),
        B("Now compare that point with the turning point. Are they the same number?",
          "Vergelyk daardie punt nou met die draaipunt. Is hulle dieselfde getal?"),
      ],
      correct,
      wrongs: [
        { label: B("c is the y of the turning point", "c is die y van die draaipunt"),
          misc: B("The turning point's y was a different number from c every single time.",
                  "Die draaipunt se y was elke keer 'n ander getal as c.") },
        { label: B("c slides the graph left and right", "c skuif die grafiek links en regs"),
          misc: B("The turning point's x never budged.", "Die draaipunt se x het nooit verander nie.") },
        { label: B("c makes the arms narrower or wider", "c maak die arms nouer of wyer"),
          misc: B("The shape stayed identical; the picture only travelled up and down.",
                  "Die vorm het presies dieselfde gebly; die prent het net op en af geskuif.") },
      ],
      method: [
        B("In y = ax² + bx + c, the c is the y-intercept: the graph cuts the y-axis exactly at c.",
          "By y = ax² + bx + c is die c die y-afsnit: die grafiek sny die y-as presies by c."),
        B("It rides the whole graph up and down too — but the number it marks is the y-cut, not the turning point.",
          "Dit skuif ook die hele grafiek op en af — maar die getal wat dit wys, is die y-afsnit, nie die draaipunt nie."),
      ],
    });
  }),

  /* ---------- 6. q vs c — the contrast, two panels ---------- */
  qVsC: () => beatOrDie("qVsC", () => {
    const a = pick([1, -1]), p = pick([-1, 1]);
    const b = -2 * a * p;                       // the same parabola, written out
    const W = 360, H = 220;
    const qs = [-2, -1, 0, 1, 2], cs = [-2, -1, 0, 1, 2];
    const tpCurve = (q) => parabolaFromTP(a, p, q);
    const stdCurve = (c) => ({ kind: "parabola", a, b, c });
    /* both panels open on the IDENTICAL parabola: q = 0 in the one is
       c = a·p² in the other. Same picture twice — then the sliders show
       what each number is actually holding on to. */
    const c0 = a * p * p;
    if (!cs.includes(c0)) return null;
    const win = windowFor([...qs.map(tpCurve), ...cs.map(stdCurve)], { w: W, h: H });
    if (!win) return null;

    const specTP = (q) => specFor([tpCurve(q)], {
      win, w: W, h: H, accent: ACC, ticks: "labels", labels: ["f"],
      points: [tpPoint(tpCurve(q))],
    });
    const specStd = (c) => specFor([stdCurve(c)], {
      win, w: W, h: H, accent: ACC, ticks: "labels", labels: ["f"],
      points: [yIntPoint(stdCurve(c))],
    });

    const correct = B("q is the y of the turning point; c is the y-intercept",
                      "q is die y van die draaipunt; c is die y-afsnit");
    return iq({
      concept: "discover", kind: "sliderPair", accent: ACC, skillId: "qVsC",
      stem: B(`Both panels start as the same parabola: <span class="eq">${eqTPStr({ a, p, q: 0 }, "f(x)")}</span>`,
              `Albei panele begin as dieselfde parabool: <span class="eq">${eqTPStr({ a, p, q: 0 }, "f(x)")}</span>`),
      prompt: B("Drag q in the top panel and c in the bottom one. What is the difference?",
                "Trek q in die boonste paneel en c in die onderste een. Wat is die verskil?"),
      coach: DRAGALL,
      hints: [
        B("Each panel has one point marked. Read that point while you drag.",
          "Elke paneel het een punt gemerk. Lees daardie punt terwyl jy die punt trek."),
        B("In the top panel, compare q with the marked point. In the bottom one, compare c with its marked point.",
          "In die boonste paneel, vergelyk q met die gemerkte punt. In die onderste een, vergelyk c met sy gemerkte punt."),
      ],
      /* the panel titles are plain text inside the mechanic, so they are
         resolved here at build time — and build() re-runs when the
         language toggle flips, which is exactly when they must change */
      build: (host, done) => sliderPair(host,
        { name: "q", values: qs, specOf: specTP, start: qs.indexOf(0),
          title: L(B("Turning-point form", "Draaipunt-vorm")),
          eqOf: (q) => EQ(eqTPStr({ a, p, q }, "f(x)")) },
        { name: "c", values: cs, specOf: specStd, start: cs.indexOf(c0),
          title: L(B("Standard form", "Standaardvorm")),
          eqOf: (c) => EQ(eqStr(stdCurve(c), "f(x)")) },
        done),
      then: mc("discover", SAWWHAT, correct, [
        { label: B("c is the y of the turning point; q is the y-intercept",
                   "c is die y van die draaipunt; q is die y-afsnit"),
          misc: B("You have them the wrong way round. The bracket form holds the turning point.",
                  "Jy het hulle omgeruil. Die hakie-vorm dui die draaipunt aan.") },
        { label: B("q and c do exactly the same job", "q en c doen presies dieselfde werk"),
          misc: B("Both of them ride the graph up and down — but each one marks a different point.",
                  "Albei skuif die grafiek op en af — maar elkeen wys 'n ander punt.") },
        { label: B("q slides up and down; c slides left and right",
                   "q skuif op en af; c skuif links en regs"),
          misc: B("Neither panel ever moved sideways.", "Nie een paneel het ooit links or regs beweeg nie.") },
      ], {
        wide: true, answerLabel: correct,
        solution: [
          B("Turning-point form y = a(x − p)² + q: q is the y of the turning point.",
            "Draaipunt-vorm y = a(x − p)² + q: q is die y van die draaipunt."),
          B("Standard form y = ax² + bx + c: c is the y-intercept.",
            "Standaardvorm y = ax² + bx + c: c is die y-afsnit."),
          B("Both slide the graph up and down. They just hold on to two different points.",
            "Albei skuif die grafiek op en af. Hulle hou net aan twee verskillende punte vas."),
        ],
      }),
    });
  }),
};

/* ------------------------------------------------------------
   The sheet: all six beats, in order. A lesson, not a shuffle.
   ------------------------------------------------------------ */
function discoverSheet() {
  return [BEATS.aSign(), BEATS.aSize(), BEATS.pShift(), BEATS.qShift(), BEATS.cCut(), BEATS.qVsC()];
}

export const questDiscover = quest("q1",
  B("Discover", "Ontdek"),
  B("Drag one number and watch what it does", "Skuif een getal en kyk wat dit doen"),
  [{ id: "discover", concept: "discover", gen: () => BEATS.aSign() }],
  { rounds: 6, accent: ACC, buildAll: discoverSheet });

/* ---------------- the intro lesson ----------------
   How the control works, and the promise that the app will not
   tell them the answer. No finding is stated here. */
{
  const cv = parabolaFromTP(1, 1, -2);
  const win = windowFor([cv]);
  const base = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  const marked = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"], points: [tpPoint(cv)] });
  questDiscover.intro = { beats: [
    { spec: base,
      cap: B(`This is a parabola. Its equation carries three numbers: <span class="eq">a</span>, <span class="eq">p</span> and <span class="eq">q</span> — ${EQ(eqTPStr({ a: 1, p: 1, q: -2 }, "f(x)"))}.`,
             `Dis 'n parabool. Sy vergelyking dra drie getalle: <span class="eq">a</span>, <span class="eq">p</span> en <span class="eq">q</span> — ${EQ(eqTPStr({ a: 1, p: 1, q: -2 }, "f(x)"))}.`) },
    { spec: marked,
      cap: B("Every round freezes two of them and gives you ONE slider.",
             "Elke ronde vries twee van hulle en gee jou EEN skuiwer.") },
    { spec: base,
      cap: B("Drag through the whole range and look carefully. Then you choose what you saw — this app does not tell you first.",
             "Trek deur die hele reeks en kyk mooi. Daarna kies jy self wat jy gesien het — hierdie app vertel dit nie eerste vir jou nie.") },
  ] };
}
