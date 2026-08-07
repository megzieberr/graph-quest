/* ============================================================
   QUEST 3 · THE CURTAIN — domain & range
   ------------------------------------------------------------
   A boundary line is drawn (a turning point, an asymptote, the
   edge of a semicircle). The learner pulls a shade away from it;
   the piece of the graph inside the shade lights up.

   Pull it the wrong way and NOTHING lights up. That is the point:
   you see which side the graph lives on BEFORE you choose ≥ or ≤.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { curtain } from "../engine/interactive.js";
import { specFor, randParabola, randExp, randHyperbola, randSemicircle } from "./_graphs.js";
import { paraTP, paraStd, rangeStr, domainStr, eqStr, C, pick, circleEq } from "../funclib.js";

const ACC = "#34d399";

const PULL = B("Pull the shade over the part where the graph lives.",
               "Trek die skerm oor die deel waar die grafiek lê.");
const WRONGWAY = B("Nothing lit up — the graph is not on that side. Try the other way.",
                   "Niks het opgelig nie — die grafiek is nie aan daardie kant nie. Probeer die ander kant.");

const SKILLS = {
  /* ---------- parabola: range off the turning point ---------- */
  paraRange: () => {
    const cv = randParabola();
    const tp = paraTP(cv), up = paraStd(cv).a > 0;
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"] });
    const correct = rangeStr(cv);                       // y ≥ q  or  y ≤ q
    const wrongs = [
      up ? `y &lt; ${C(tp.y)}` : `y > ${C(tp.y)}`,      // wrong side AND wrong sign
      up ? `y ≤ ${C(tp.y)}` : `y ≥ ${C(tp.y)}`,         // wrong side, right sign
      `y ≥ ${C(tp.x)}`,                                  // the classic: used the x
    ];
    return iq({
      concept: "range", kind: "curtain", accent: ACC,
      prompt: B("What is the <b>range</b> of f?", "Wat is die <b>waardeversameling</b> van f?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: PULL,
      build: (host, done, nudge) => curtain(host, {
        spec, boundary: { y: tp.y }, label: `y = ${C(tp.y)}`,
        onSweep: (dir) => { if ((dir === "up") === up) done(); else nudge(WRONGWAY); },
      }),
      then: mc("range",
        B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("The turning point IS reached, so the sign includes it: ≥ or ≤.",
                  "Die draaipunt WORD bereik, so die teken sluit dit in: ≥ of ≤."),
          answerLabel: correct }),
    });
  },

  /* ---------- exponential: range off the asymptote (never reached) ---------- */
  expRange: () => {
    const cv = randExp();
    const up = cv.a > 0;
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["g"], asymLabels: true });
    const correct = rangeStr(cv);                        // y > q  or  y < q
    const wrongs = [
      up ? `y ≥ ${C(cv.q)}` : `y ≤ ${C(cv.q)}`,          // the trap: asymptote included
      up ? `y &lt; ${C(cv.q)}` : `y > ${C(cv.q)}`,       // wrong side
      "y ∈ ℝ",
    ];
    return iq({
      concept: "range", kind: "curtain", accent: ACC,
      prompt: B("What is the <b>range</b> of g?", "Wat is die <b>waardeversameling</b> van g?"),
      stem: `<span class="eq">${eqStr(cv, "g(x)")}</span>`,
      coach: PULL,
      build: (host, done, nudge) => curtain(host, {
        spec, boundary: { y: cv.q }, label: `y = ${C(cv.q)}`,
        onSweep: (dir) => { if ((dir === "up") === up) done(); else nudge(WRONGWAY); },
      }),
      then: mc("range",
        B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("The graph gets closer and closer to the asymptote but never touches it — so no line under the sign.",
                  "Die grafiek kom nader en nader aan die asimptoot maar raak dit nooit — dus geen streep onder die teken nie."),
          answerLabel: correct }),
    });
  },

  /* ---------- hyperbola: it lives on BOTH sides ---------- */
  hypRange: () => {
    const cv = randHyperbola();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const correct = rangeStr(cv);                        // y ∈ ℝ, y ≠ q
    const wrongs = [`y > ${C(cv.q)}`, `y &lt; ${C(cv.q)}`, `y ∈ ℝ`];
    return iq({
      concept: "range", kind: "curtain", accent: ACC,
      prompt: B("What is the <b>range</b> of f?", "Wat is die <b>waardeversameling</b> van f?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Sweep the shade up, then down. Notice where the graph is.",
               "Vee die skerm op, dan af. Let op waar die grafiek is."),
      build: (host, done, nudge) => {
        const seen = new Set();
        return curtain(host, {
          spec, boundary: { y: cv.q }, label: `y = ${C(cv.q)}`,
          onSweep: (dir) => { seen.add(dir); if (seen.size >= 2) done(); else nudge(B("Good — now try the other side too.", "Goed — probeer nou ook die ander kant.")); },
        });
      },
      then: mc("range",
        B("So what is the range?", "So wat is die waardeversameling?"), correct, wrongs,
        { hint: B("There is graph above the line AND below it. Only one height is missing: the asymptote itself.",
                  "Daar is grafiek bo die lyn ÉN onder dit. Net een hoogte kom nie voor nie: die asimptoot self."),
          answerLabel: correct }),
    });
  },

  /* ---------- hyperbola: domain, the sideways curtain ---------- */
  hypDomain: () => {
    const cv = randHyperbola();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["f"], asymLabels: true });
    const correct = domainStr(cv);                       // x ∈ ℝ, x ≠ p
    const wrongs = [`x > ${C(cv.p)}`, `x ∈ ℝ`, `x ≠ ${C(cv.q)}`];
    return iq({
      concept: "domain", kind: "curtain", accent: ACC,
      prompt: B("What is the <b>domain</b> of f?", "Wat is die <b>definisieversameling</b> van f?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("This shade moves left and right. Sweep both sides.",
               "Hierdie skerm beweeg links en regs. Vee albei kante."),
      build: (host, done, nudge) => {
        const seen = new Set();
        return curtain(host, {
          spec, boundary: { x: cv.p }, label: `x = ${C(cv.p)}`,
          onSweep: (dir) => { seen.add(dir); if (seen.size >= 2) done(); else nudge(B("Now the other side.", "Nou die ander kant.")); },
        });
      },
      then: mc("domain",
        B("So what is the domain?", "So wat is die definisieversameling?"), correct, wrongs,
        { hint: B("Domain = x-values. There is graph left of the line and right of it — only the line itself is missing.",
                  "Definisieversameling = x-waardes. Daar is grafiek links en regs van die lyn — net die lyn self ontbreek."),
          answerLabel: correct }),
    });
  },

  /* ---------- semicircle: range is finite on BOTH ends ---------- */
  semiRange: () => {
    const cv = randSemicircle();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["h"] });
    const correct = rangeStr(cv);                        // 0 ≤ y ≤ r
    const wrongs = [`0 &lt; y &lt; ${C(cv.r)}`, `${C(-cv.r)} ≤ y ≤ ${C(cv.r)}`, `y ≥ 0`];
    return iq({
      concept: "range", kind: "curtain", accent: ACC, techOnly: true,
      prompt: B("What is the <b>range</b> of h?", "Wat is die <b>waardeversameling</b> van h?"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: PULL,
      build: (host, done, nudge) => curtain(host, {
        spec, boundary: { y: 0 }, label: "y = 0",
        onSweep: (dir) => { if (dir === "up") done(); else nudge(WRONGWAY); },
      }),
      then: mc("range",
        B("Now write the range.", "Skryf nou die waardeversameling."), correct, wrongs,
        { hint: B("A semicircle stops at both ends — it really reaches 0 and it really reaches the top. Both signs get a line.",
                  "'n Halfsirkel hou aan albei kante op — dit bereik werklik 0 en werklik die bokant. Albei tekens kry 'n streep."),
          answerLabel: correct }),
    });
  },

  /* ---------- semicircle: domain, left edge to right edge ---------- */
  semiDomain: () => {
    const cv = randSemicircle();
    const spec = specFor([cv], { accent: ACC, ticks: true, labels: ["h"] });
    const correct = domainStr(cv);                       // −r ≤ x ≤ r
    const wrongs = [`${C(-cv.r)} &lt; x &lt; ${C(cv.r)}`, `x ∈ ℝ`, `0 ≤ x ≤ ${C(cv.r)}`];
    return iq({
      concept: "domain", kind: "curtain", accent: ACC, techOnly: true,
      prompt: B("What is the <b>domain</b> of h?", "Wat is die <b>definisieversameling</b> van h?"),
      stem: `<span class="eq">${circleEq(cv)}, y ≥ 0</span>`,
      coach: B("Pull the shade sideways over the part where the graph lives.",
               "Trek die skerm sywaarts oor die deel waar die grafiek lê."),
      build: (host, done, nudge) => curtain(host, {
        spec, boundary: { x: -cv.r }, label: `x = ${C(-cv.r)}`,
        onSweep: (dir) => { if (dir === "right") done(); else nudge(WRONGWAY); },
      }),
      then: mc("domain",
        B("Now write the domain.", "Skryf nou die definisieversameling."), correct, wrongs,
        { hint: B("Read where the graph starts and where it stops on the x-axis. Both ends are reached.",
                  "Lees waar die grafiek begin en waar dit ophou op die x-as. Albei punte word bereik."),
          answerLabel: correct }),
    });
  },
};

export const quest3 = quest("q3",
  B("The curtain", "Die skerm"),
  B("Domain & range — see the side, then pick the sign", "Definisie- & waardeversameling — sien die kant, kies dan die teken"),
  [
    { id: "paraRange", concept: "range", gen: SKILLS.paraRange },
    { id: "expRange", concept: "range", gen: SKILLS.expRange },
    { id: "hypRange", concept: "range", gen: SKILLS.hypRange },
    { id: "hypDomain", concept: "domain", gen: SKILLS.hypDomain },
    { id: "semiRange", concept: "range", gen: SKILLS.semiRange, techOnly: true },
    { id: "semiDomain", concept: "domain", gen: SKILLS.semiDomain, techOnly: true },
  ],
  { rounds: 6, accent: ACC });
