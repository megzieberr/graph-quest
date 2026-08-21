/* ============================================================
   QUEST K · AARD VAN WORTELS — how many times does y = k cut it?
   ★ batch 3, session 2
   ------------------------------------------------------------
   Design: GQ-BATCH3-DESIGN.md § "Aard van wortels". Kickoff call (b)
   CONFIRMED 2026-08-21: y = k ONLY. The g + k sliding-tangent variant
   (finding the k that makes a moving line tangent to a moving curve)
   needs the discriminant — that is algebra, Law 1 — and stays out.

   Four round types, all reusing varSlider (no new mechanic):
     R1 discover     iq(). Drag k, y = k rides, live snypunte marked.
                     No-spoilers (Law 7): options unlock only once the
                     WHOLE range has been dragged; the conclusion is
                     never stated before the learner commits.
     R2 kiss         mc(). The turning point is marked; the answer is
                     its y, read straight off — never computed.
     R3 count        mc(). "For which k does y = k cut TWICE?" —
                     k > q / k < q, matching happy/sad.
     R4 other        mc(). Hyperbola: exactly one cut for every k ≠ q,
                     none AT q (the asymptote round). Exponential: one
                     cut only on the curve's own side of the asymptote.

   Language ruling (house law, post-2026-08-21): tangent = "raak
   net-net", cut = "sny" — never mixed, never translated word-for-word.
   A hyperbola has vlerkies, never arms/tak(ke).
   ============================================================ */
import { mc, iq, kp, quest } from "./_shared.js";
import { varSlider } from "../engine/slider.js";
import { B } from "../i18n.js";
import { near } from "../check.js";
import {
  specFor, windowFor, randParabola, randHyperbolaOffAxis, randExp, mostlyInFrame,
} from "./_graphs.js";
import {
  intersections, paraTP, paraStd, EQ, C, ptStr, pick,
} from "../funclib.js";

const ACC = "#60a5fa";

const DRAGALL = B("Drag it through the whole range — the options only open once you have seen every stop.",
                  "Trek dit deur die hele reeks — die opsies gaan eers oop as jy elke stop gesien het.");
const SAWWHAT = B("What did you see?", "Wat het jy gesien?");

/* ============================================================
   R1 — DISCOVER: drag k, watch y = k ride, count the snypunte
   ============================================================ */
function discoverBeat() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const tp = paraTP(cv);
    const a = paraStd(cv).a;
    const SPAN = 3;
    const values = [];
    for (let d = -SPAN; d <= SPAN; d++) values.push(tp.y + d);
    const extremeK = a > 0 ? tp.y + SPAN : tp.y - SPAN;
    /* closed form, for SIZING the window only — the dots the learner
       actually sees always come from funclib's own intersections()
       below, never trusted from this arithmetic */
    const dx = Math.sqrt(SPAN / Math.abs(a));
    const include = [
      ...values.map((v) => ({ y: v })),
      { x: tp.x - dx, y: extremeK }, { x: tp.x + dx, y: extremeK },
    ];
    const win = windowFor([cv], { include });
    if (!win) continue;
    if (!mostlyInFrame(cv, win)) continue;
    if (!values.every((v) => mostlyInFrame({ kind: "line", a: 0, q: v }, win))) continue;

    const specOf = (k) => {
      const line = { kind: "line", a: 0, q: k };
      const pts = intersections(cv, line, win.xmin, win.xmax).map((x) => ({ x, y: k, on: 0 }));
      return specFor([cv, line], { win, accent: ACC, ticks: "labels", labels: ["f"], tones: ["a", "b"], points: pts });
    };

    const up = a > 0;
    const correct = up
      ? B("Above the turning point: 2 cuts. Right on it: 1 (a perfect touch). Below it: 0.",
          "Bo die draaipunt: 2 snye. Presies daarop: 1 (dit raak net-net). Onder dit: 0.")
      : B("Below the turning point: 2 cuts. Right on it: 1 (a perfect touch). Above it: 0.",
          "Onder die draaipunt: 2 snye. Presies daarop: 1 (dit raak net-net). Bo dit: 0.");
    const wrongs = [
      { label: up
          ? B("Above the turning point: 0 cuts. Right on it: 1. Below it: 2.",
              "Bo die draaipunt: 0 snye. Presies daarop: 1. Onder dit: 2.")
          : B("Below the turning point: 0 cuts. Right on it: 1. Above it: 2.",
              "Onder die draaipunt: 0 snye. Presies daarop: 1. Bo dit: 2."),
        misc: B("Look again at which side the arms actually open — that is the side with two cuts, not zero.",
                "Kyk weer na watter kant die arms werklik oopmaak — dis die kant met twee snye, nie nul nie.") },
      { label: B("The line always cuts the graph exactly once, wherever k sits.",
                 "Die lyn sny die grafiek altyd presies een keer, ongeag waar k sit."),
        misc: B("Drag k again and count the dots — some stops gave two, some gave none.",
                "Trek k weer en tel die kolletjies — party stoppe het twee gegee, ander geeneen nie.") },
      { label: B("The number of cuts has nothing to do with the turning point.",
                 "Die aantal snye het niks met die draaipunt te doen nie."),
        misc: B("The touch happened at exactly one k — the same number as the turning point's own y.",
                "Die net-net-raak het by presies een k gebeur — dieselfde getal as die draaipunt se eie y.") },
    ];

    const built = iq({
      concept: "roots", kind: "slider", accent: ACC,
      prompt: B("Drag k. Watch how many times the line meets f.", "Trek k. Kyk hoeveel keer die lyn f ontmoet."),
      stem: EQ("y = k"),
      coach: DRAGALL,
      hints: [B("Compare a stop above the turning point with a stop below it — count the dots each time.",
                "Vergelyk 'n stop bo die draaipunt met een onder dit — tel die kolletjies elke keer.")],
      build: (host, done) => varSlider(host, { name: "k", values, specOf, onComplete: done }),
      then: mc("roots", SAWWHAT, correct, wrongs, { wide: true, solution: [correct], answerLabel: correct }),
    });
    built.debugRoots = { kind: "discover", cv, tp, a, values, win };
    /* verify-only: play.js only ever reads item.graph on a NON-interactive
       item — an interactive item is mounted through build() instead, so
       exposing the opening spec here is pure data, never rendered twice
       (the qT slideMatch pattern, batch 2 session 2). Lets §4b's frame
       honesty and §22's off-axis scan see this round too. */
    built.graph = specOf(values[Math.floor((values.length - 1) / 2)]);
    return built;
  }
  throw new Error("qK discover: no honest window fits any draw");
}

/* ============================================================
   R2 — DIE KISS: the turning point is marked, its y IS k
   ------------------------------------------------------------
   Design amendment (foreman + Megan's ruling, 2026-08-21): the design
   doc always meant this as a KEYPAD round — session 2 shipped mc() only
   because no keypad mechanic existed yet. Typed entry now matches the
   design: the answer is read straight off the marked point, not picked
   out of four options. qK's dealing stays randomized (untouched by this
   amendment — that ruling was separate).
   ============================================================ */
function kissRound() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const tp = paraTP(cv);
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], {
      win, accent: ACC, ticks: "labels", labels: ["f"],
      points: [{ x: tp.x, y: tp.y, on: 0, label: ptStr(tp.x, tp.y), place: tp.y < 0 ? "below" : "above" }],
    });
    if (!spec) continue;
    /* the p-vs-q classic: typing the turning point's x instead of its y.
       Any other wrong entry gets the generic read-it-off-the-point nudge. */
    const missPX = B("That is the turning point's x — the touch depends on its y, not its x.",
                      "Dit is die draaipunt se x — die net-net-raak hang van sy y af, nie sy x nie.");
    const missGeneric = B("Read the marked point's y straight off the sketch — the touch happens exactly there.",
                          "Lees die gemerkte punt se y reguit van die sketch af — die net-net-raak gebeur presies daar.");
    const built = kp("roots",
      B("For which k does y = k just touch the graph?", "Vir watter k raak y = k die grafiek net-net?"),
      tp.y,
      {
        graph: spec,
        stem: B("The turning point is marked.", "Die draaipunt is gemerk."),
        allowNeg: true,
        hints: [B("The touch happens exactly at the turning point — its y IS the k you want, read it straight off.",
                  "Die net-net-raak gebeur presies by die draaipunt — sy y IS die k wat jy soek, lees dit reguit af.")],
        solution: [B(`The turning point is ${ptStr(tp.x, tp.y)}, so y = k just touches it at k = ${C(tp.y)}.`,
                     `Die draaipunt is ${ptStr(tp.x, tp.y)}, dus raak y = k dit net-net by k = ${C(tp.y)}.`)],
        answerLabel: C(tp.y),
        wrongMisc: (v) => (near(v, tp.x) ? missPX : missGeneric),
        miscTexts: [missPX, missGeneric],
      });
    built.debugKiss = { cv, tp, win };
    return built;
  }
  throw new Error("qK kiss: no honest window fits any draw");
}

/* ============================================================
   R3 — HOEVEEL SNYPUNTE: k > q / k < q, matching happy/sad
   ============================================================ */
function countRound() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const tp = paraTP(cv);
    if (Math.round(tp.x) === Math.round(tp.y)) continue;   // keep the p-decoy visibly distinct
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], {
      win, accent: ACC, ticks: "labels", labels: ["f"],
      points: [{ x: tp.x, y: tp.y, on: 0, label: ptStr(tp.x, tp.y), place: tp.y < 0 ? "below" : "above" }],
    });
    if (!spec) continue;
    const up = cv.a > 0;
    /* "&lt;" not a raw "<" — a bare less-than sign inside HTML content
       gets misread as the start of a tag (by both the browser's own
       parser and verify.html's tag-stripping regex), exactly the trap
       funclib's own intervalStr() already dodges the same way. */
    const gt = ">", lt = "&lt;";
    const correctIneq = up ? `k ${gt} ${C(tp.y)}` : `k ${lt} ${C(tp.y)}`;
    const flipIneq = up ? `k ${lt} ${C(tp.y)}` : `k ${gt} ${C(tp.y)}`;
    const pIneq = up ? `k ${gt} ${C(tp.x)}` : `k ${lt} ${C(tp.x)}`;
    const built = mc("roots",
      B("For which values of k does y = k cut the graph TWICE?", "Vir watter waardes van k sny y = k die grafiek TWEE keer?"),
      EQ(correctIneq),
      [
        { label: EQ(flipIneq), misc: B("Wrong side — check which side of the turning point the arms actually open on.",
                                         "Verkeerde kant — kyk aan watter kant van die draaipunt die arms werklik oopmaak.") },
        { label: EQ(pIneq), misc: B("That compares k with p, the turning point's x — two cuts depend on q, its y.",
                                      "Dit vergelyk k met p, die draaipunt se x — twee snye hang van q af, sy y.") },
      ],
      {
        graph: spec,
        stem: B("The turning point is marked.", "Die draaipunt is gemerk."),
        hints: [up
          ? B("The arms point up, so two cuts happen only above the turning point's own y.",
              "Die arms wys op, dus gebeur twee snye net bo die draaipunt se eie y.")
          : B("The arms point down, so two cuts happen only below the turning point's own y.",
              "Die arms wys af, dus gebeur twee snye net onder die draaipunt se eie y.")],
        solution: [B(`The turning point's y is ${C(tp.y)}, so two cuts happen when ${correctIneq}.`,
                     `Die draaipunt se y is ${C(tp.y)}, dus gebeur twee snye wanneer ${correctIneq}.`)],
        answerLabel: EQ(correctIneq),
      });
    built.debugCount = { cv, tp, win, up };
    return built;
  }
  throw new Error("qK count: no honest window fits any draw");
}

/* ============================================================
   R4 — OTHER FAMILIES: hyperbola (never AT q) and exponential
   (only on the curve's own side of the asymptote) — pure seeing
   ------------------------------------------------------------
   The CORRECT option is always the count funclib's own intersections()
   actually finds for this k — never a guess from which side k was
   drawn on, so even a mis-classified draw can never ship a wrong key.
   ============================================================ */
function hyperbolaCutRound() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randHyperbolaOffAxis();
    const wantZero = pick([true, false, false]);       // weight toward the "≠ q" case
    const k = wantZero ? cv.q : cv.q + pick([-2, -1, 1, 2]);
    /* closed form, for SIZING the window only (R1's pattern): the round
       is ABOUT the cut point, so it goes into include: — windows crop
       everything else. The truth still comes from intersections() below. */
    const cutX = wantZero ? null : cv.p + cv.a / (k - cv.q);
    const win = windowFor([cv], { include: cutX == null ? [{ y: k }] : [{ y: k }, { x: cutX, y: k }] });
    if (!win) continue;
    const line = { kind: "line", a: 0, q: k };
    if (!mostlyInFrame(cv, win) || !mostlyInFrame(line, win)) continue;
    const spec = specFor([cv, line], { win, accent: ACC, ticks: "labels", labels: ["f"], tones: ["a", "b"] });
    if (!spec) continue;
    const n = intersections(cv, line, win.xmin, win.xmax).length;
    /* a drawn window that contradicts the family truth (a cropped cut, a
       numeric edge) must REDRAW — never ship a round whose solution text
       explains a different picture than its own key */
    if (n !== (wantZero ? 0 : 1)) continue;
    const zero = n === 0;
    const correct = String(n);
    const wrongs = ["0", "1", "2"].filter((s) => s !== correct).map((s) => ({
      label: s,
      misc: zero
        ? B("y = k sits exactly on the asymptote here — a hyperbola never meets its own asymptote.",
            "y = k lê hier presies op die asimptoot — 'n hiperbool ontmoet nooit sy eie asimptoot nie.")
        : B("Each branch lies on its own side of the asymptote cross — a horizontal line only ever reaches ONE of them.",
            "Elke vlerkie lê aan sy eie kant van die asimptoot-kruis — 'n horisontale lyn bereik altyd net EEN daarvan."),
    }));
    const built = mc("roots",
      B("How many times does y = k cut this graph?", "Hoeveel keer sny y = k hierdie grafiek?"),
      correct, wrongs,
      {
        graph: spec,
        stem: EQ(`y = ${C(k)}`),
        hints: [zero
          ? B("This k is the same number as the horizontal asymptote — what happens right on an asymptote?",
              "Hierdie k is dieselfde getal as die horisontale asimptoot — wat gebeur presies op 'n asimptoot?")
          : B("Look at where the line crosses — does it reach both branches, or only one?",
              "Kyk waar die lyn kruis — bereik dit albei vlerkies, of net een?")],
        solution: [zero
          ? B(`k = ${C(k)} is exactly the horizontal asymptote, so y = k never meets the graph: 0 cuts.`,
              `k = ${C(k)} is presies die horisontale asimptoot, dus ontmoet y = k die grafiek nooit nie: 0 snye.`)
          : B(`k is not ${C(cv.q)} (the asymptote), so y = k cuts exactly one branch — one cut.`,
              `k is nie ${C(cv.q)} nie (die asimptoot), dus sny y = k presies een vlerkie — een snypunt.`)],
        answerLabel: correct,
      });
    built.debugOther = { family: "hyperbola", cv, k, win, n };
    return built;
  }
  throw new Error("qK hyperbolaCut: no honest window fits any draw");
}

function expCutRound() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randExp();
    const above = cv.a > 0;
    const wantCut = pick([true, true, false]);
    const dK = pick([1, 2]);
    const k = wantCut
      ? (above ? cv.q + dK : cv.q - dK)
      : (above ? cv.q - dK : cv.q + dK);
    /* closed form, for SIZING only (R1's pattern) — the cut the round is
       ABOUT must sit inside the window; truth still from intersections() */
    const cutX = wantCut ? cv.p + Math.log((k - cv.q) / cv.a) / Math.log(cv.b) : null;
    const win = windowFor([cv], { include: cutX == null ? [{ y: k }] : [{ y: k }, { x: cutX, y: k }] });
    if (!win) continue;
    const line = { kind: "line", a: 0, q: k };
    if (!mostlyInFrame(cv, win) || !mostlyInFrame(line, win)) continue;
    const spec = specFor([cv, line], { win, accent: ACC, ticks: "labels", labels: ["f"], tones: ["a", "b"] });
    if (!spec) continue;
    const n = intersections(cv, line, win.xmin, win.xmax).length;
    /* same insurance as the hyperbola round: the drawn window must agree
       with the family truth or the draw redraws */
    if (n !== (wantCut ? 1 : 0)) continue;
    const cuts = n === 1;
    const correct = String(n);
    const wrongs = ["0", "1", "2"].filter((s) => s !== correct).map((s) => ({
      label: s,
      misc: cuts
        ? B("This k sits on the curve's own side of the asymptote — the curve does reach it, exactly once.",
            "Hierdie k lê aan die kurwe se eie kant van die asimptoot — die kurwe bereik dit wel, presies een keer.")
        : B("This k sits on the OTHER side of the asymptote from the curve — the curve never reaches it.",
            "Hierdie k lê aan die ANDER kant van die asimptoot as die kurwe — die kurwe bereik dit nooit nie."),
    }));
    const built = mc("roots",
      B("How many times does y = k cut this graph?", "Hoeveel keer sny y = k hierdie grafiek?"),
      correct, wrongs,
      {
        graph: spec,
        stem: EQ(`y = ${C(k)}`),
        hints: [above
          ? B("The curve lies above its asymptote — so a cut can only happen above the asymptote.",
              "Die kurwe lê bo sy asimptoot — dus kan 'n snypunt net bo die asimptoot lê.")
          : B("The curve lies below its asymptote — so a cut can only happen below the asymptote.",
              "Die kurwe lê onder sy asimptoot — dus kan 'n snypunt net onder die asimptoot lê.")],
        solution: [B(`The curve lies ${above ? "above" : "below"} the asymptote, so y = k only ever cuts it ${above ? "above" : "below"} y = ${C(cv.q)}.`,
                     `Die kurwe lê ${above ? "bo" : "onder"} die asimptoot, dus sny y = k dit net ${above ? "bo" : "onder"} y = ${C(cv.q)}.`)],
        answerLabel: correct,
      });
    built.debugOther = { family: "exp", cv, k, win, n };
    return built;
  }
  throw new Error("qK expCut: no honest window fits any draw");
}

function otherFamiliesRound() {
  return pick([hyperbolaCutRound, expCutRound])();
}

/* ---------------- the quest + intro ---------------- */

export const questRoots = quest("qK",
  B("Nature of roots", "Aard van wortels"),
  B("How many times does y = k cut the graph?", "Hoeveel keer sny y = k die grafiek?"),
  [
    { id: "discover", concept: "roots", gen: discoverBeat, weight: 1 },
    { id: "kiss", concept: "roots", gen: kissRound, weight: 1 },
    { id: "count", concept: "roots", gen: countRound, weight: 1 },
    { id: "other", concept: "roots", gen: otherFamiliesRound, weight: 1 },
  ],
  { rounds: 6, accent: ACC });

/* worked example, once, at module load: a happy parabola, three lines —
   a plain one, one that just touches the turning point, one below it.
   Purely mechanical (Law 7): it shows WHAT a snypunt/net-net-raak looks
   like, never states the general k>q / k<q rule — that stays for the
   learner's own R1 commit and R3's answer. */
{
  const cv = { kind: "parabola", a: 1, p: -1, q: -4 };
  const win = windowFor([cv], { include: [{ y: -4 }, { y: 0 }, { y: -6 }] });
  const lineAt = (k) => ({ kind: "line", a: 0, q: k });
  const specAt = (k, pts) => specFor([cv, lineAt(k)], {
    win, accent: ACC, ticks: "labels", labels: ["f"], tones: ["a", "b"], points: pts || [],
  });
  questRoots.intro = { beats: [
    { spec: specAt(0, []),
      cap: B("Every round in this quest draws a horizontal line, y = k, over a graph.",
             "Elke rondte in hierdie soektog trek 'n horisontale lyn, y = k, oor 'n grafiek.") },
    { spec: specAt(-4, [{ x: -1, y: -4, on: 0, label: "(−1 ; −4)" }]),
      cap: B("Sometimes the line lands exactly on the turning point — a perfect touch, one point only.",
             "Soms lê die lyn presies op die draaipunt — 'n net-net-raak, net een punt.") },
    { spec: specAt(-6, []),
      cap: B("Drag k in your own rounds and watch how many times the line cuts the graph.",
             "Trek k in jou eie rondtes en kyk hoeveel keer die lyn die grafiek sny.") },
  ] };
}
