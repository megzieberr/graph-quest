/* ============================================================
   QUEST 1 · WHICH VALUE? — x or y
   ------------------------------------------------------------
   Pure pattern recognition, no calculating at all. An exam phrase
   flashes; the learner taps x or y. Many fast reps, because the
   bug being fixed is a reading reflex, not a knowledge gap.

   Round 2 goes one step deeper: the phrase → what you actually DO.
   ============================================================ */
import { mc, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { pick, shuffled } from "../ui.js";
import { specFor, randCurve, windowFor } from "./_graphs.js";

/* Every round shows a real graph, even this word-recognition drill.
   The learner should never be answering ABOUT graphs while staring at a
   wall of text — the phrase and the picture belong together. The curve
   is generic and unlabelled, so it never leaks the answer. */
function refGraph() {
  const cv = randCurve(["line", "parabola", "hyperbola", "exp"]);
  /* h:230 is shorter than the default canvas — a steep line that clears
     the frame comfortably at 360×300 can still run off the top/bottom
     here before crossing much width (the visible fraction is capped by
     (drawH/drawW)/|a|, and this canvas has a much smaller drawH/drawW) */
  if (cv.kind === "line" && Math.abs(cv.a) > 1) return refGraph();
  const win = windowFor([cv], { h: 230 });
  if (!win) return refGraph();
  return specFor([cv], { win, accent: "#3aa0ff", ticks: "labels", labels: ["f"], asymLabels: true, h: 230 });
}

const X = "x", Y = "y", BOTH = "both";

const OPT = {
  x: B("an x-value", "'n x-waarde"),
  y: B("a y-value", "'n y-waarde"),
  both: B("both — it is a point", "albei — dit is 'n punt"),
};

/* ------------------------------------------------------------
   The phrase bank. `a` is the value the QUESTION is asking for.
   Wording is taken from her Graad 12 Tegnies worksheets.
   ------------------------------------------------------------ */
const PHRASES = [
  { a: X, t: B("the <b>x-intercept</b> of f", "die <b>x-afsnit</b> van f"),
    why: B("An x-intercept sits ON the x-axis, so its y is 0 — the value you are asked for is the x.",
           "'n x-Afsnit lê OP die x-as, so sy y is 0 — die waarde wat gevra word, is die x.") },
  { a: Y, t: B("the <b>y-intercept</b> of f", "die <b>y-afsnit</b> van f"),
    why: B("A y-intercept sits on the y-axis, where x = 0. The value asked for is the y.",
           "'n y-Afsnit lê op die y-as, waar x = 0. Die waarde wat gevra word, is die y.") },
  { a: X, t: B("the <b>domain</b> of f", "die <b>definisieversameling</b> van f"),
    why: B("Domain = the x-values the graph uses. Left and right.",
           "Definisieversameling = die x-waardes wat die grafiek gebruik. Links en regs.") },
  { a: Y, t: B("the <b>range</b> of f", "die <b>waardeversameling</b> van f"),
    why: B("Range = the y-values the graph reaches. Up and down.",
           "Waardeversameling = die y-waardes wat die grafiek bereik. Op en af.") },
  { a: X, t: B("<b>for which values of x</b> is f(x) &gt; 0", "<b>vir watter waardes van x</b> is f(x) &gt; 0"),
    why: B("f(x) > 0 is the condition; the ANSWER is a set of x-values.",
           "f(x) > 0 is die voorwaarde; die ANTWOORD is 'n stel x-waardes.") },
  { a: X, t: B("<b>for which values of x</b> is f increasing", "<b>vir watter waardes van x</b> is f stygend"),
    why: B("Increasing is about what the graph does, but the answer is written as x-values.",
           "Stygend gaan oor wat die grafiek doen, maar die antwoord word as x-waardes geskryf.") },
  { a: Y, t: B("the value of k if P(5 ; k) lies on f", "die waarde van k as P(5 ; k) op f lê"),
    why: B("The 5 is the x. The unknown k sits in the y-position.",
           "Die 5 is die x. Die onbekende k staan in die y-plek.") },
  { a: X, t: B("the value of k if P(k ; 7) lies on f", "die waarde van k as P(k ; 7) op f lê"),
    why: B("The 7 is the y. The unknown k sits in the x-position.",
           "Die 7 is die y. Die onbekende k staan in die x-plek.") },
  { a: Y, t: B("the <b>asymptote</b> of an exponential graph", "die <b>asimptoot</b> van 'n eksponensiële grafiek"),
    why: B("An exponential graph flattens towards a horizontal line, y = …",
           "'n Eksponensiële grafiek plat uit na 'n horisontale lyn, y = …") },
  { a: X, t: B("the <b>axis of symmetry</b> of a parabola", "die <b>simmetrie-as</b> van 'n parabool"),
    why: B("It is a vertical line, written x = …",
           "Dit is 'n vertikale lyn, geskryf as x = …") },
  { a: BOTH, t: B("the <b>turning point</b> of f", "die <b>draaipunt</b> van f"),
    why: B("A turning point is a point, so it needs both coordinates.",
           "'n Draaipunt is 'n punt, so dit het albei koördinate nodig.") },
  { a: BOTH, t: B("where two graphs <b>cut each other</b>", "waar twee grafieke <b>mekaar sny</b>"),
    why: B("An intersection is a point — both coordinates.",
           "'n Snypunt is 'n punt — albei koördinate.") },
  { a: Y, t: B("the <b>maximum value</b> of f", "die <b>maksimum waarde</b> van f"),
    why: B("The highest the graph gets is a height — a y-value.",
           "Die hoogste wat die grafiek kom, is 'n hoogte — 'n y-waarde.") },
  { a: X, t: B("<b>where</b> f cuts the x-axis", "<b>waar</b> f die x-as sny"),
    why: B("On the x-axis y is 0, so the value that changes is the x.",
           "Op die x-as is y = 0, so die waarde wat verander, is die x.") },
  { a: X, t: B("the <b>vertical asymptote</b> of a hyperbola", "die <b>vertikale asimptoot</b> van 'n hiperbool"),
    why: B("A vertical line is written x = …",
           "'n Vertikale lyn word geskryf as x = …") },
  { a: X, t: B("<b>for which values of x</b> is g(x) &lt; f(x)", "<b>vir watter waardes van x</b> is g(x) &lt; f(x)"),
    why: B("Comparing heights, but the answer is still a set of x-values.",
           "Ons vergelyk hoogtes, maar die antwoord bly 'n stel x-waardes.") },
];

/* ------------------------------------------------------------
   Round 2: the phrase → the first move
   ------------------------------------------------------------ */
const MOVES = [
  { t: B("To find the <b>x-intercept</b> of f", "Om die <b>x-afsnit</b> van f te kry"),
    a: B("let y = 0", "stel y = 0"),
    w: [B("let x = 0", "stel x = 0"), B("look at the turning point", "kyk na die draaipunt"), B("look at the asymptote", "kyk na die asimptoot")] },
  { t: B("To find the <b>y-intercept</b> of f", "Om die <b>y-afsnit</b> van f te kry"),
    a: B("let x = 0", "stel x = 0"),
    w: [B("let y = 0", "stel y = 0"), B("solve f(x) = g(x)", "los f(x) = g(x) op"), B("look at the domain", "kyk na die definisieversameling")] },
  { t: B("P(5 ; k) lies on f. To find k", "P(5 ; k) lê op f. Om k te kry"),
    a: B("substitute x = 5 into the equation", "vervang x = 5 in die vergelyking"),
    w: [B("substitute y = 5 into the equation", "vervang y = 5 in die vergelyking"), B("let y = 0", "stel y = 0"), B("read the turning point", "lees die draaipunt af")] },
  { t: B("P(k ; 7) lies on f. To find k", "P(k ; 7) lê op f. Om k te kry"),
    a: B("let y = 7 and solve for x", "stel y = 7 en los op vir x"),
    w: [B("substitute x = 7 into the equation", "vervang x = 7 in die vergelyking"), B("let x = 0", "stel x = 0"), B("read the y-intercept", "lees die y-afsnit af")] },
  { t: B("To find where f and g <b>cut each other</b>", "Om te kry waar f en g <b>mekaar sny</b>"),
    a: B("let f(x) = g(x)", "stel f(x) = g(x)"),
    w: [B("let f(x) = 0", "stel f(x) = 0"), B("let x = 0", "stel x = 0"), B("subtract the asymptotes", "trek die asimptote af")] },
  { t: B("To write down the <b>range</b> of a parabola", "Om die <b>waardeversameling</b> van 'n parabool neer te skryf"),
    a: B("look at the turning point's y-value", "kyk na die draaipunt se y-waarde"),
    w: [B("look at the turning point's x-value", "kyk na die draaipunt se x-waarde"), B("look at the x-intercepts", "kyk na die x-afsnitte"), B("let y = 0", "stel y = 0")] },
  { t: B("To write down the <b>domain</b> of a hyperbola", "Om die <b>definisieversameling</b> van 'n hiperbool neer te skryf"),
    a: B("look at the vertical asymptote", "kyk na die vertikale asimptoot"),
    w: [B("look at the horizontal asymptote", "kyk na die horisontale asimptoot"), B("look at the y-intercept", "kyk na die y-afsnit"), B("let x = 0", "stel x = 0")] },
  { t: B("To write down the <b>range</b> of an exponential graph", "Om die <b>waardeversameling</b> van 'n eksponensiële grafiek neer te skryf"),
    a: B("look at the horizontal asymptote", "kyk na die horisontale asimptoot"),
    w: [B("look at the vertical asymptote", "kyk na die vertikale asimptoot"), B("look at the x-intercept", "kyk na die x-afsnit"), B("look at the turning point", "kyk na die draaipunt")] },
  { t: B("To write down the <b>domain</b> of a semicircle", "Om die <b>definisieversameling</b> van 'n halfsirkel neer te skryf"),
    a: B("read where it starts and stops on the x-axis", "lees waar dit op die x-as begin en ophou"),
    w: [B("read the highest point", "lees die hoogste punt"), B("let x = 0", "stel x = 0"), B("look at the radius only", "kyk net na die radius")], techOnly: true },
];

const SKILLS = {
  /* x or y? */
  whichValue: () => {
    const p = pick(PHRASES);
    const correct = p.a === X ? OPT.x : p.a === Y ? OPT.y : OPT.both;
    const wrongs = p.a === BOTH ? [OPT.x, OPT.y] : [p.a === X ? OPT.y : OPT.x, OPT.both];
    return mc("whichAxis",
      B("The question asks for …", "Die vraag vra vir …"),
      correct, wrongs,
      { stem: p.t, hint: p.why, answerLabel: correct, wide: true, graph: refGraph() });
  },

  /* what is your first move? */
  firstMove: () => {
    const m = pick(MOVES.filter((x) => !x.techOnly || TECH.on));
    return mc("firstMove",
      B("What do you do first?", "Wat doen jy eerste?"),
      m.a, shuffled(m.w),
      { stem: m.t, wide: true, graph: refGraph(),
        hint: B("Read the sentence again: which coordinate did they GIVE you?",
                "Lees die sin weer: watter koördinaat het hulle vir jou GEGEE?") });
  },
};

/* semicircle content flag (blipwork turns this off) */
export const TECH = { on: true };

export const quest1 = quest("q1",
  B("Which value?", "Watter waarde?"),
  B("x or y — train the reflex", "x of y — dril die refleks"),
  [
    { id: "whichValue", concept: "whichAxis", gen: SKILLS.whichValue, weight: 3 },
    { id: "firstMove", concept: "firstMove", gen: SKILLS.firstMove, weight: 2 },
  ],
  { rounds: 10, accent: "#3aa0ff" });
