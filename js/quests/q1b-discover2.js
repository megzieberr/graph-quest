/* ============================================================
   QUEST 1b · ONTDEK 2 — line, hyperbola, exponential   ★ session 3
   ------------------------------------------------------------
   The second discovery sheet. Same mechanic as session 2's quest 1
   (varSlider / sliderPair from js/engine/slider.js) — NO new
   mechanic code here, only new beats built on it.

   Nine beats, always in the same order — this is a lesson, not a
   shuffle (RUN-PLAN's fixed-lesson-order principle):

     1. line:  m sign      increasing or decreasing
     2. line:  m size      steeper or flatter
     3. line:  c           the whole line rides up/down
     4. hyperbola: a sign  which pair of corners the branches sit in
     5. hyperbola: p       the vertical (dashed) asymptote rides
     6. hyperbola: q       the horizontal (dashed) asymptote rides
     7. exp:   a side      above or below the asymptote
     8. exp:   b           opstyg (taking off) or land (landing)
     9. exp:   q           the whole curve — and its asymptote — rides

   THE RULE (Law 7, Circle Quest's no-spoilers rule): the screen
   shows the raw effect and nothing else. The prompt names the MOVE,
   never the finding. The learner drags every stop, commits to a
   conclusion from up to four options, and only THEN does the method
   card state the fact.

   The hyperbola's asymptote cross is drawn dashed automatically:
   specFor() always pushes both the x= and y= asymptote lines for a
   hyperbola curve, and .fg-asym is dashed in css/styles.css for
   every asymptote line the engine ever draws — nothing extra needed
   here to keep that promise.

   No algebra anywhere: every answer is something you saw.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { varSlider } from "../engine/slider.js";
import { specFor, windowFor } from "./_graphs.js";
import {
  eqStr, EQ, ptStr, pick, randInt,
  lineYInt, expYInt,
} from "../funclib.js";

const ACC = "#7b5cff";

const DRAGALL = B("Drag it through the whole range — the options only open once you have seen every stop.",
                  "Drag dit deur die hele reeks — die opsies maak eers oop as jy elke stop gesien het.");
const SAWWHAT = B("What did you see?", "Wat het jy gesien?");

/* ------------------------------------------------------------
   One beat: a live graph, one slider, then the commit. Identical
   shape to q1-discover.js's beat() — kept local rather than shared,
   so this session never has to touch the foreman-reviewed file.
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

function beatOrDie(id, make) {
  for (let k = 0; k < 80; k++) {
    const b = make();
    if (b) return b;
  }
  throw new Error(`discovery beat ${id}: no honest window fits any parameter draw`);
}

/* ---- shared point markers ---- */
function lineYPoint(cv) {
  const q = lineYInt(cv);
  return { x: 0, y: q, on: 0, label: ptStr(0, q), place: "right" };
}
function expYIntPoint(cv) {
  const y = expYInt(cv);
  return { x: 0, y, on: 0, label: ptStr(0, y), place: "right" };
}

const lineCv = (m, c) => ({ kind: "line", a: m, q: c });
const hypCv = (a, p, q) => ({ kind: "hyperbola", a, p, q });
const expCv = (a, b, q) => ({ kind: "exp", a, b, p: 0, q });

/* ============================================================
   THE BEATS
   ============================================================ */
const BEATS = {

  /* ---------- 1. line: sign of m ---------- */
  lineSign: () => beatOrDie("lineSign", () => {
    const c = randInt(-2, 2);
    const correct = B("m positive → the line climbs left to right (increasing); m negative → it falls (decreasing)",
                      "m positief → die lyn styg van links na regs (toenemend); m negatief → dit daal (afnemend)");
    return beat({
      id: "lineSign", name: "m",
      values: [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2],
      curveOf: (m) => lineCv(m, c),
      pointsOf: lineYPoint,
      eqOf: (m) => EQ(eqStr(lineCv(m, c), "f(x)")),
      stem: EQ("f(x) = mx + c"),
      prompt: B("Drag m. What happens to the line?", "Drag m. Wat gebeur met die lyn?"),
      hints: [
        B("Park m on 2 and watch the line. Then park it on −2.",
          "Sit m op 2 en kyk na die lyn. Sit dit dan op −2."),
        B("Did the y-intercept move? Or did only the direction of the line change?",
          "Het die y-afsnit beweeg? Of het net die rigting van die lyn verander?"),
      ],
      correct,
      wrongs: [
        { label: B("m positive → the line falls; m negative → it climbs",
                   "m positief → die lyn daal; m negatief → dit styg"),
          misc: B("Look again at m = 1 and at m = −1 — which one is climbing?",
                  "Kyk weer na m = 1 en m = −1 — watter een styg?") },
        { label: B("the sign of m slides the line up and down",
                   "die teken van m skuif die lyn op en af"),
          misc: B("The line passed through the same y-intercept the whole time.",
                  "Die lyn het heeltyd deur dieselfde y-afsnit gegaan.") },
        { label: B("the sign of m makes the line steeper or flatter",
                   "die teken van m maak die lyn steiler of platter"),
          misc: B("That is what the SIZE of m does, not its sign.",
                  "Dis wat die GROOTTE van m doen, nie sy teken nie.") },
      ],
      method: [
        B("m decides which way the line goes.", "m besluit watter kant toe die lyn gaan."),
        B("m &gt; 0 → increasing (climbs left to right). m &lt; 0 → decreasing (falls).",
          "m &gt; 0 → toenemend (styg van links na regs). m &lt; 0 → afnemend (daal)."),
        B("The y-intercept never moved — only the direction flipped.",
          "Die y-afsnit het nooit beweeg nie — net die rigting het omgedraai."),
      ],
    });
  }),

  /* ---------- 2. line: size of m ---------- */
  lineSize: () => beatOrDie("lineSize", () => {
    const c = randInt(-2, 2);
    const correct = B("Bigger m → the line is STEEPER", "Groter m → die lyn is STEILER");
    return beat({
      id: "lineSize", name: "m",
      values: [0.5, 1, 1.5, 2],
      curveOf: (m) => lineCv(m, c),
      pointsOf: lineYPoint,
      eqOf: (m) => EQ(eqStr(lineCv(m, c), "f(x)")),
      stem: EQ("f(x) = mx + c"),
      prompt: B("m stays positive here. Drag m. What happens?",
                "m bly hier positief. Drag m. Wat gebeur?"),
      hints: [
        B("Compare m = 0,5 with m = 2. How steep is the line each time?",
          "Vergelyk m = 0,5 met m = 2. Hoe steil is die lyn elke keer?"),
        B("Watch the y-intercept while you drag. Does it move at all?",
          "Kyk na die y-afsnit terwyl jy drag. Beweeg dit hoegenaamd?"),
      ],
      correct,
      wrongs: [
        { label: B("Bigger m → the line is FLATTER", "Groter m → die lyn is PLATTER"),
          misc: B("At m = 2 the line shot up almost straight — compare that with m = 0,5.",
                  "By m = 2 het die lyn amper regop geskiet — vergelyk dit met m = 0,5.") },
        { label: B("m slides the line up and down", "m skuif die lyn op en af"),
          misc: B("The y-intercept stayed on its spot the whole time.",
                  "Die y-afsnit het heeltyd op sy plek gebly.") },
        { label: B("m flips the line upside down", "m draai die lyn onderstebo"),
          misc: B("That is what a NEGATIVE m does. Here m stayed positive throughout.",
                  "Dis wat 'n NEGATIEWE m doen. Hier het m heeltyd positief gebly.") },
      ],
      method: [
        B("The bigger m is, the steeper the line.", "Hoe groter m, hoe steiler die lyn."),
        B("Between 0 and 1 it works the other way: m = 0,5 is flatter than m = 1.",
          "Tussen 0 en 1 werk dit andersom: m = 0,5 is platter as m = 1."),
        B("The y-intercept never moves — m only changes the steepness.",
          "Die y-afsnit beweeg nooit nie — m verander net die steilheid."),
      ],
    });
  }),

  /* ---------- 3. line: c ---------- */
  lineC: () => beatOrDie("lineC", () => {
    const m = pick([1, -1, 2, -2]);
    const correct = B("c slides the WHOLE line up and down. c is the y-intercept.",
                      "c skuif die HELE lyn op en af. c is die y-afsnit.");
    return beat({
      id: "lineC", name: "c",
      values: [-3, -2, -1, 0, 1, 2, 3],
      curveOf: (c) => lineCv(m, c),
      pointsOf: lineYPoint,
      eqOf: (c) => EQ(eqStr(lineCv(m, c), "f(x)")),
      stem: EQ("f(x) = mx + c"),
      prompt: B("Drag c. Watch where the line crosses the y-axis.",
                "Drag c. Kyk waar die lyn die y-as sny."),
      hints: [
        B("Read the marked point at c = 3, then again at c = −3.",
          "Lees die gemerkte punt by c = 3, dan weer by c = −3."),
        B("Now compare the line's steepness at those two stops. Did it change?",
          "Vergelyk nou die lyn se steilheid by daardie twee stoppe. Het dit verander?") ,
      ],
      correct,
      wrongs: [
        { label: B("c changes the line's steepness", "c verander die lyn se steilheid"),
          misc: B("The line stayed exactly as steep the whole time — only its height changed.",
                  "Die lyn het heeltyd presies ewe steil gebly — net sy hoogte het verander.") },
        { label: B("c is the x-intercept", "c is die x-afsnit"),
          misc: B("Look where the line crosses the y-axis, not the x-axis.",
                  "Kyk waar die lyn die y-as sny, nie die x-as nie.") },
        { label: B("c flips the line over", "c draai die lyn om"),
          misc: B("The line never turned upside down — it only rode up and down.",
                  "Die lyn het nooit onderstebo gedraai nie — dit het net op en af gery.") },
      ],
      method: [
        B("c is the y-intercept — the line crosses the y-axis exactly at c.",
          "c is die y-afsnit — die lyn sny die y-as presies by c."),
        B("Change c and the whole line rides up or down — the steepness stays exactly the same.",
          "Verander c en die hele lyn ry op of af — die steilheid bly presies dieselfde."),
      ],
    });
  }),

  /* ---------- 4. hyperbola: sign of a ---------- */
  hypSign: () => beatOrDie("hypSign", () => {
    /* frozen asymptotes stay OFF the axes: at p = 0 or q = 0 the dashed
       line is drawn exactly on top of the solid axis and the "cross"
       this beat's wording leans on is half invisible (seen on the
       foreman's contact sheet). Dragged parameters may cross 0 —
       watching an asymptote ride through an axis is good discovery —
       but a frozen one must be visibly its own line. */
    const p = pick([-1, 1]), q = pick([-2, -1, 1, 2]);
    const correct = B("a positive → the branches sit top-right & bottom-left of the cross; a negative → top-left & bottom-right",
                      "a positief → die arms lê regs-bo & links-onder van die kruis; a negatief → links-bo & regs-onder");
    return beat({
      id: "hypSign", name: "a",
      values: [-4, -3, -2, -1, 1, 2, 3, 4],
      curveOf: (a) => hypCv(a, p, q),
      eqOf: (a) => EQ(eqStr(hypCv(a, p, q), "f(x)")),
      stem: EQ("f(x) = a/(x − p) + q"),
      prompt: B("Drag a. Which corners do the branches sit in?",
                "Drag a. In watter hoeke lê die arms?"),
      hints: [
        B("Park a on 3 and look at the two branches against the dashed cross. Then park it on −3.",
          "Sit a op 3 en kyk na die twee arms teenoor die kruis. Sit dit dan op −3."),
        B("Did the dashed cross move? Or did only the branches swap corners?",
          "Het die kruis beweeg? Of het net die arms van hoeke verruil?"),
      ],
      correct,
      wrongs: [
        { label: B("a positive → top-left & bottom-right; a negative → top-right & bottom-left",
                   "a positief → links-bo & regs-onder; a negatief → regs-bo & links-onder"),
          misc: B("Look again at a = 3 — which corner is the branch actually sitting in, up on the right?",
                  "Kyk weer na a = 3 — in watter hoek lê die arm eintlik, daar bo-regs?") },
        { label: B("the sign of a moves the dashed asymptote cross",
                   "die teken van a skuif die stippellyn-kruis"),
          misc: B("The cross stayed on exactly the same spot the whole drag — only the branches flipped.",
                  "Die kruis het heeltyd presies op dieselfde plek gebly — net die arms het omgeruil.") },
        { label: B("the sign of a controls how close the branches hug the cross",
                   "die teken van a beheer hoe naby die arms aan die kruis lê"),
          misc: B("That is the SIZE of a, not its sign.", "Dis die GROOTTE van a, nie sy teken nie.") },
      ],
      method: [
        B("a decides which pair of corners the two branches sit in.",
          "a besluit in watter paar hoeke die twee arms lê."),
        B("a &gt; 0 → top-right &amp; bottom-left. a &lt; 0 → top-left &amp; bottom-right.",
          "a &gt; 0 → regs-bo &amp; links-onder. a &lt; 0 → links-bo &amp; regs-onder."),
        B("The dashed asymptote cross never moves — only the branches flip to the other pair of corners.",
          "Die stippellyn-kruis beweeg nooit nie — net die arms swaai na die ander paar hoeke."),
      ],
    });
  }),

  /* ---------- 5. hyperbola: p — vertical asymptote rides ---------- */
  hypP: () => beatOrDie("hypP", () => {
    const a = pick([2, -2, 3, -3]), q = pick([-2, -1, 1, 2]);   // frozen q off the axis, see hypSign
    const correct = B("p slides the vertical (dashed) asymptote sideways — it always sits at x = p",
                      "p skuif die vertikale (stippel) asimptoot sywaarts — dit sit altyd by x = p");
    return beat({
      id: "hypP", name: "p",
      values: [-3, -2, -1, 0, 1, 2, 3],
      curveOf: (p) => hypCv(a, p, q),
      eqOf: (p) => EQ(eqStr(hypCv(a, p, q), "f(x)")),
      stem: EQ("f(x) = a/(x − p) + q"),
      prompt: B("Drag p. Watch the vertical dashed line.",
                "Drag p. Kyk na die vertikale stippellyn."),
      hints: [
        B("Park p on 2. Read the x-value the dashed vertical line sits at.",
          "Sit p op 2. Lees die x-waarde waar die vertikale stippellyn sit."),
        B("Now park p on −2. Did the horizontal dashed line move at all?",
          "Sit p nou op −2. Het die horisontale stippellyn hoegenaamd beweeg?"),
      ],
      correct,
      wrongs: [
        { label: B("p slides the horizontal (dashed) asymptote up and down",
                   "p skuif die horisontale (stippel) asimptoot op en af"),
          misc: B("Watch the horizontal dashed line only — it never moved.",
                  "Kyk net na die horisontale stippellyn — dit het nooit beweeg nie.") },
        { label: B("p changes which corners the branches sit in",
                   "p verander in watter hoeke die arms lê"),
          misc: B("The branches stayed in the same pair of corners the whole drag — only the whole picture slid sideways.",
                  "Die arms het heeltyd in dieselfde paar hoeke gebly — net die hele prent het sywaarts geskuif.") },
        { label: B("p makes the branches hug the cross tighter or looser",
                   "p maak die arms nouer of losser om die kruis"),
          misc: B("That is what a does, not p.", "Dis wat a doen, nie p nie.") },
      ],
      method: [
        B("p is the x of the vertical asymptote.", "p is die x van die vertikale asimptoot."),
        B("Drag p and the whole picture — branches, cross and all — rides sideways with it.",
          "Drag p en die hele prent — arms, kruis en al — ry saam met dit sywaarts."),
      ],
    });
  }),

  /* ---------- 6. hyperbola: q — horizontal asymptote rides ---------- */
  hypQ: () => beatOrDie("hypQ", () => {
    const a = pick([2, -2, 3, -3]), p = pick([-1, 1]);          // frozen p off the axis, see hypSign
    const correct = B("q slides the horizontal (dashed) asymptote up and down — it always sits at y = q",
                      "q skuif die horisontale (stippel) asimptoot op en af — dit sit altyd by y = q");
    return beat({
      id: "hypQ", name: "q",
      values: [-2, -1, 0, 1, 2],
      curveOf: (q) => hypCv(a, p, q),
      eqOf: (q) => EQ(eqStr(hypCv(a, p, q), "f(x)")),
      stem: EQ("f(x) = a/(x − p) + q"),
      prompt: B("Drag q. Watch the horizontal dashed line.",
                "Drag q. Kyk na die horisontale stippellyn."),
      hints: [
        B("Park q on 2. Read the y-value the horizontal dashed line sits at.",
          "Sit q op 2. Lees die y-waarde waar die horisontale stippellyn sit."),
        B("Now park q on −2. Did the vertical dashed line move at all?",
          "Sit q nou op −2. Het die vertikale stippellyn hoegenaamd beweeg?"),
      ],
      correct,
      wrongs: [
        { label: B("q slides the vertical (dashed) asymptote sideways",
                   "q skuif die vertikale (stippel) asimptoot sywaarts"),
          misc: B("Watch the vertical dashed line only — it never moved.",
                  "Kyk net na die vertikale stippellyn — dit het nooit beweeg nie.") },
        { label: B("q changes which corners the branches sit in",
                   "q verander in watter hoeke die arms lê"),
          misc: B("The branches stayed in the same pair of corners the whole drag — only the whole picture rode up and down.",
                  "Die arms het heeltyd in dieselfde paar hoeke gebly — net die hele prent het op en af gery.") },
        { label: B("q makes the branches hug the cross tighter or looser",
                   "q maak die arms nouer of losser om die kruis"),
          misc: B("That is what a does, not q.", "Dis wat a doen, nie q nie.") },
      ],
      method: [
        B("q is the y of the horizontal asymptote.", "q is die y van die horisontale asimptoot."),
        B("Drag q and the whole picture — branches, cross and all — rides up and down with it.",
          "Drag q en die hele prent — arms, kruis en al — ry saam met dit op en af."),
      ],
    });
  }),

  /* ---------- 7. exp: a — above/below the asymptote ---------- */
  expSide: () => beatOrDie("expSide", () => {
    const b = pick([2, 3]), q = pick([-2, -1, 1, 2]);           // frozen q off the axis, see hypSign
    const correct = B("a positive → the curve sits ABOVE the asymptote; a negative → BELOW it",
                      "a positief → die kurwe lê BO die asimptoot; a negatief → ONDER dit");
    return beat({
      id: "expSide", name: "a",
      values: [-3, -2, -1, 1, 2, 3],
      curveOf: (a) => expCv(a, b, q),
      pointsOf: expYIntPoint,
      eqOf: (a) => EQ(eqStr(expCv(a, b, q), "f(x)")),
      stem: EQ("f(x) = a·bˣ + q"),
      prompt: B("Drag a. Which side of the dashed asymptote is the curve on?",
                "Drag a. Aan watter kant van die stippellyn lê die kurwe?"),
      hints: [
        B("Park a on 2 and look above or below the dashed line. Then park it on −2.",
          "Sit a op 2 en kyk bo of onder die stippellyn. Sit dit dan op −2."),
        B("Did the dashed asymptote line itself move?", "Het die stippel-asimptootlyn self beweeg?"),
      ],
      correct,
      wrongs: [
        { label: B("a positive → below the asymptote; a negative → above it",
                   "a positief → onder die asimptoot; a negatief → bo dit"),
          misc: B("Look again at a = 2 — is the curve above or below the dashed line there?",
                  "Kyk weer na a = 2 — lê die kurwe bo of onder die stippellyn daar?") },
        { label: B("a controls taking off vs landing (opstyg/land)",
                   "a beheer opstyg teenoor land"),
          misc: B("That is what b does, not a.", "Dis wat b doen, nie a nie.") },
        { label: B("a slides the dashed asymptote up and down",
                   "a skuif die stippellyn op en af"),
          misc: B("The dashed line never moved — only which side the curve sits on changed.",
                  "Die stippellyn het nooit beweeg nie — net aan watter kant die kurwe lê het verander.") },
      ],
      method: [
        B("a decides which side of the asymptote the whole curve lives on.",
          "a besluit aan watter kant van die asimptoot die hele kurwe lê."),
        B("a &gt; 0 → above the asymptote. a &lt; 0 → below it.",
          "a &gt; 0 → bo die asimptoot. a &lt; 0 → onder dit."),
      ],
    });
  }),

  /* ---------- 8. exp: b — opstyg (taking off) / land (landing) ---------- */
  expB: () => beatOrDie("expB", () => {
    /* a stays POSITIVE in this beat: the correct option says the curve
       "STYG OP weg van die asimptoot" (her opstyg/land vocabulary), and
       with a negative a the takeoff is a downward plunge — the words
       would fight the picture. The a-beat (expSide) owns negative a.
       Frozen q off the axis, see hypSign. */
    const a = pick([1, 2]), q = pick([-2, -1, 1, 2]);
    const correct = B("b between 0 and 1 → the curve LANDS on the asymptote as x grows; b bigger than 1 → it TAKES OFF away from the asymptote",
                      "b tussen 0 en 1 → die kurwe LAND op die asimptoot soos x groei; b groter as 1 → dit STYG OP weg van die asimptoot");
    return beat({
      id: "expB", name: "b",
      values: [0.5, 1.5, 2, 2.5, 3],
      curveOf: (b) => expCv(a, b, q),
      pointsOf: expYIntPoint,
      eqOf: (b) => EQ(eqStr(expCv(a, b, q), "f(x)")),
      stem: EQ("f(x) = a·bˣ + q"),
      prompt: B("Drag b. Watch how the curve behaves as x grows (to the right).",
                "Drag b. Kyk hoe die kurwe optree soos x groei (na regs)."),
      hints: [
        B("Park b on 0,5 and watch the right-hand side of the curve. Then park it on 2.",
          "Sit b op 0,5 en kyk na die regterkant van die kurwe. Sit dit dan op 2."),
        B("At b = 0,5, does the curve get closer to the dashed line or further away, going right?",
          "By b = 0,5, kom die kurwe nader aan die stippellyn of verder weg, na regs toe?"),
      ],
      correct,
      wrongs: [
        { label: B("b between 0 and 1 → takes off; b bigger than 1 → lands",
                   "b tussen 0 en 1 → styg op; b groter as 1 → land"),
          misc: B("Look again at b = 0,5 on the right-hand side — is it landing on the dashed line or flying off?",
                  "Kyk weer na b = 0,5 aan die regterkant — land dit op die stippellyn of vlieg dit weg?") },
        { label: B("b slides the dashed asymptote up and down",
                   "b skuif die stippellyn op en af"),
          misc: B("q does that — the dashed line never moved while you dragged b.",
                  "q doen dit — die stippellyn het nooit beweeg terwyl jy b gedrag het nie.") },
        { label: B("b decides which side of the asymptote the curve sits on",
                   "b besluit aan watter kant van die asimptoot die kurwe lê"),
          misc: B("That is what a does, not b.", "Dis wat a doen, nie b nie.") },
      ],
      method: [
        B("b decides how the curve behaves as x grows.", "b besluit hoe die kurwe optree soos x groei."),
        B("0 &lt; b &lt; 1 → landing on the asymptote. b &gt; 1 → taking off away from it.",
          "0 &lt; b &lt; 1 → land op die asimptoot. b &gt; 1 → styg op weg daarvan."),
        B("b is never zero or negative.", "b is nooit nul of negatief nie."),
      ],
    });
  }),

  /* ---------- 9. exp: q — the whole curve rides ---------- */
  expQ: () => beatOrDie("expQ", () => {
    const a = pick([1, 2, -1, -2]), b = pick([2, 3]);
    const correct = B("q slides the WHOLE curve — and its asymptote — up and down. The asymptote always sits at y = q.",
                      "q skuif die HELE kurwe — en sy asimptoot — op en af. Die asimptoot sit altyd by y = q.");
    return beat({
      id: "expQ", name: "q",
      values: [-2, -1, 0, 1, 2],
      curveOf: (q) => expCv(a, b, q),
      pointsOf: expYIntPoint,
      eqOf: (q) => EQ(eqStr(expCv(a, b, q), "f(x)")),
      stem: EQ("f(x) = a·bˣ + q"),
      prompt: B("Drag q. Watch the dashed asymptote line.",
                "Drag q. Kyk na die stippel-asimptootlyn."),
      hints: [
        B("Park q on 2. Read the y-value the dashed line sits at.",
          "Sit q op 2. Lees die y-waarde waar die stippellyn sit."),
        B("Now park q on −2. Did the curve's shape change, or only its height?",
          "Sit q nou op −2. Het die kurwe se vorm verander, of net sy hoogte?"),
      ],
      correct,
      wrongs: [
        { label: B("q controls taking off vs landing (opstyg/land)",
                   "q beheer opstyg teenoor land"),
          misc: B("That is what b does — the curve's shape never changed while you dragged q.",
                  "Dis wat b doen — die kurwe se vorm het nooit verander terwyl jy q gedrag het nie.") },
        { label: B("q decides which side of the asymptote the curve sits on",
                   "q besluit aan watter kant van die asimptoot die kurwe lê"),
          misc: B("That is what a does, not q.", "Dis wat a doen, nie q nie.") },
        { label: B("q is the y-intercept", "q is die y-afsnit"),
          misc: B("Look where this curve cuts the y-axis — that was never the same number as q.",
                  "Kyk waar hierdie kurwe die y-as sny — dit was nooit dieselfde getal as q nie.") },
      ],
      method: [
        B("q is the y of the asymptote.", "q is die y van die asimptoot."),
        B("Change q and the whole picture rides up or down with it — the shape stays exactly the same.",
          "Verander q en die hele prent ry saam met dit op of af — die vorm bly presies dieselfde."),
      ],
    });
  }),
};

/* ------------------------------------------------------------
   The sheet: all nine beats, in order. A lesson, not a shuffle.
   ------------------------------------------------------------ */
function discoverSheet2() {
  return [
    BEATS.lineSign(), BEATS.lineSize(), BEATS.lineC(),
    BEATS.hypSign(), BEATS.hypP(), BEATS.hypQ(),
    BEATS.expSide(), BEATS.expB(), BEATS.expQ(),
  ];
}

export const questDiscover2 = quest("q1b",
  B("Discover 2", "Ontdek 2"),
  B("Line, hyperbola, exponential — drag one number and watch",
    "Lyn, hiperbool, eksponensieel — drag een getal en kyk"),
  [{ id: "discover2", concept: "discover", gen: () => BEATS.lineSign() }],
  { rounds: 9, accent: ACC, buildAll: discoverSheet2 });
