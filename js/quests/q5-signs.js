/* ============================================================
   QUEST 5 · SIGNS — f(x) > 0 and f(x)·g(x) < 0
   ------------------------------------------------------------
   Megan's board method, made physical:

     step 1  f(x) is just the y-value — is the graph above or
             below the x-axis in this piece?
     step 2  mark + or − on every piece, exactly as she does
     step 3  for a product, compare the two marks per piece:
             SAME signs → +, DIFFERENT signs ("tekens verskil") → −
     step 4  read the answer off the marks

   The app will not let the question through until every piece is
   marked correctly — the marking IS the working.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B } from "../i18n.js";
import { signPaint } from "../engine/interactive.js";
import { specFor, randParabola, randLine, randHyperbola, randExp, randSemicircle, windowFor } from "./_graphs.js";
import { criticalXs, sections, signAt, eqStr, C, pick, makeFn } from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";
import { getLang } from "../i18n.js";

const ACC = "#fb7185";

/* sections where every curve involved actually exists */
function usableSections(secs, curves) {
  return secs.map((s) => ({ ...s, usable: curves.every((cv) => Number.isFinite(makeFn(cv)(s.mid))) }));
}

/* the true sign map the painting is checked against */
function truthMap(curves, idxs, secs) {
  const t = {};
  idxs.forEach((ci) => {
    t[ci] = {};
    secs.forEach((s, si) => {
      const v = signAt(curves[ci], s.mid);
      if (v !== null) t[ci][si] = v;
    });
  });
  return t;
}

const CHECK = B("Check every piece: is the graph above the x-axis (+) or below it (−)?",
                "Kyk na elke stuk: is die grafiek bo die x-as (+) of onder dit (−)?");

const SKILLS = {
  /* ---------- one graph: f(x) > 0 or f(x) < 0 ---------- */
  singleSign: () => {
    const cv = pick([randParabola(), randParabola(), randLine(), randExp(), randHyperbola()]);
    const win = windowFor([cv]);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
    const cuts = criticalXs([cv], win.xmin, win.xmax);
    if (!cuts.length) return SKILLS.singleSign();                 // needs at least one crossing
    const secs = usableSections(sections(cuts, win.xmin, win.xmax), [cv]);
    const wantPos = pick([true, false]);
    const lang = getLang();

    const chosen = secs.filter((s) => s.usable && signAt(cv, s.mid) === (wantPos ? 1 : -1));
    if (!chosen.length) return SKILLS.singleSign();
    const correct = answerString(chosen, cuts, win, { strict: true, lang });
    const wrongs = [
      complementString(chosen, secs, cuts, win, { strict: true, lang }),
      asYString(correct),
      flipStrictString(chosen, cuts, win, { strict: true, lang }),
    ];

    return iq({
      concept: "signs", kind: "signPaint", accent: ACC,
      prompt: wantPos
        ? B("For which values of x is f(x) &gt; 0?", "Vir watter waardes van x is f(x) &gt; 0?")
        : B("For which values of x is f(x) &lt; 0?", "Vir watter waardes van x is f(x) &lt; 0?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: CHECK,
      build: (host, done, nudge) => {
        const truth = truthMap([cv], [0], secs);
        const ctl = signPaint(host, {
          spec, sections: secs, curves: [0],
          onChange: (state, all) => {
            if (!all) return;
            const wrong = secs.some((s, si) => truth[0][si] !== undefined && state[0][si] !== truth[0][si]);
            ctl.reveal(truth);
            if (wrong) nudge(B("Look at the pieces in red — is the graph really on that side there?",
                               "Kyk na die stukke in rooi — is die grafiek regtig daar aan daardie kant?"));
            else done();
          },
        });
        return ctl;
      },
      then: mc("signs",
        wantPos ? B("Now read the answer off your + marks.", "Lees nou die antwoord van jou +-merke af.")
                : B("Now read the answer off your − marks.", "Lees nou die antwoord van jou −-merke af."),
        correct, wrongs,
        { hint: B("f(x) > 0 means the graph is ABOVE the x-axis. Which pieces did you mark +?",
                  "f(x) > 0 beteken die grafiek is BO die x-as. Watter stukke het jy + gemerk?"),
          answerLabel: correct }),
    });
  },

  /* ---------- two graphs: the product (her "tekens verskil") ---------- */
  productSign: () => {
    const a = pick([randParabola(), randLine(), randSemicircle()]);
    const b = pick([randLine(), randExp(), randParabola()]);
    const win = windowFor([a, b]);
    const spec = specFor([a, b], { win, accent: ACC, ticks: true, labels: ["f", "g"], asymLabels: true });
    const cuts = criticalXs([a, b], win.xmin, win.xmax);
    if (cuts.length < 2) return SKILLS.productSign();
    const secs = usableSections(sections(cuts, win.xmin, win.xmax), [a, b]);
    const wantNeg = pick([true, true, false]);                    // < 0 is the exam favourite
    const lang = getLang();

    const chosen = secs.filter((s) => {
      if (!s.usable) return false;
      const p = signAt(a, s.mid) * signAt(b, s.mid);
      return wantNeg ? p < 0 : p > 0;
    });
    if (!chosen.length || chosen.length === secs.length) return SKILLS.productSign();
    const strict = pick([true, false]);
    const correct = answerString(chosen, cuts, win, { strict, lang });
    const wrongs = [
      complementString(chosen, secs, cuts, win, { strict, lang }),
      flipStrictString(chosen, cuts, win, { strict, lang }),
      asYString(correct),
    ];
    const sym = wantNeg ? (strict ? "&lt; 0" : "≤ 0") : (strict ? "&gt; 0" : "≥ 0");

    return iq({
      concept: "product", kind: "signPaint", accent: ACC,
      prompt: B(`For which values of x is f(x)·g(x) ${sym}?`,
                `Vir watter waardes van x is f(x)·g(x) ${sym}?`),
      stem: B("Mark BOTH graphs, piece by piece.", "Merk ALBEI grafieke, stuk vir stuk."),
      coach: CHECK,
      build: (host, done, nudge) => {
        const truth = truthMap([a, b], [0, 1], secs);
        const ctl = signPaint(host, {
          spec, sections: secs, curves: [0, 1],
          onChange: (state, all) => {
            if (!all) return;
            let wrong = false;
            [0, 1].forEach((ci) => secs.forEach((s, si) => {
              if (truth[ci][si] !== undefined && state[ci][si] !== truth[ci][si]) wrong = true;
            }));
            ctl.reveal(truth);
            if (wrong) nudge(B("The red marks are on the wrong side of the x-axis.",
                               "Die rooi merke is aan die verkeerde kant van die x-as."));
            else done();
          },
        });
        return ctl;
      },
      then: mc("product",
        wantNeg
          ? B("A product is negative where the two signs are DIFFERENT. Where is that?",
              "'n Produk is negatief waar die twee tekens VERSKIL. Waar is dit?")
          : B("A product is positive where the two signs are the SAME. Where is that?",
              "'n Produk is positief waar die twee tekens DIESELFDE is. Waar is dit?"),
        correct, wrongs,
        { hint: wantNeg
            ? B("Piece by piece: + and − together give −. + and + give +. − and − also give +.",
                "Stuk vir stuk: + en − saam gee −. + en + gee +. − en − gee ook +.")
            : B("Same signs multiply to a positive. Different signs give a negative.",
                "Dieselfde tekens vermenigvuldig tot 'n positiewe. Verskillende tekens gee 'n negatiewe."),
          answerLabel: correct }),
    });
  },

  /* ---------- the idea underneath it all: f(x) IS the height ---------- */
  heightIdea: () => {
    const cv = pick([randParabola(), randLine(), randExp()]);
    const win = windowFor([cv]);
    const f = makeFn(cv);
    let x = pick([win.xmin + 1, win.xmin + 2, win.xmax - 2, win.xmax - 1].filter((v) => Number.isFinite(f(v))));
    if (x == null) x = 0;
    const y = f(x);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"],
      points: [{ x, y, on: 0, dashTo: "x" }] });
    const correct = y > 0
      ? B("positive — the graph is above the x-axis there", "positief — die grafiek is daar bo die x-as")
      : B("negative — the graph is below the x-axis there", "negatief — die grafiek is daar onder die x-as");
    return mc("signs",
      B(`At x = ${C(x)}, is f(x) positive or negative?`, `By x = ${C(x)}, is f(x) positief of negatief?`),
      correct,
      [y > 0 ? B("negative — the graph is below the x-axis there", "negatief — die grafiek is daar onder die x-as")
             : B("positive — the graph is above the x-axis there", "positief — die grafiek is daar bo die x-as"),
       B("zero", "nul"),
       B("you cannot tell from a sketch", "jy kan nie van 'n skets af sê nie")],
      { graph: spec, wide: true,
        stem: B("The dashed line shows how high the graph is at that x.",
                "Die stippellyn wys hoe hoog die grafiek by daardie x is."),
        hint: B("f(x) is just the y-value — the height of the graph above (or below) the x-axis.",
                "f(x) is net die y-waarde — die hoogte van die grafiek bo (of onder) die x-as."),
        answerLabel: correct });
  },
};

export const quest5 = quest("q5",
  B("Plus and minus", "Plus en minus"),
  B("f(x) > 0 and f(x)·g(x) < 0 — mark the signs", "f(x) > 0 en f(x)·g(x) < 0 — merk die tekens"),
  [
    { id: "heightIdea", concept: "signs", gen: SKILLS.heightIdea },
    { id: "singleSign", concept: "signs", gen: SKILLS.singleSign, weight: 2 },
    { id: "productSign", concept: "product", gen: SKILLS.productSign, weight: 2 },
  ],
  { rounds: 5, accent: ACC });
