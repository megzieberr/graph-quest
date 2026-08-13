/* ============================================================
   QUEST 5 · SIGNS — f(x) > 0 and f(x)·g(x) < 0   ★ fix day (2026-08-13)
   ------------------------------------------------------------
   REBUILT off the TEKENTABEL onto Megan's board method (her ruling,
   2026-08-13 — she dropped the sign table on 2026-08-09 after her
   learners struggled with it). Her method, in order, every stage
   done by hand:

     stap 1  trek 'n lyn deur ELKE x-afsnit en asimptoot
             (tap the sockets; decoys — a turning point, the
             y-axis — must NOT get a line)
     stap 2  merk + en − op ELKE grafiek, per afdeling — directly
             ON the curve, no table
     stap 3  lees die antwoord van die merke af, links → regs
             (a product question: where the two curves' marks are
             the SAME the product is +, where they DIFFER it is −
             — "tekens verskil", read by eye, never computed by
             the app into a third row)

   The learner's marking SURVIVES into the read-off exactly as they
   left it — mistakes included (house law from batch 1 / q6): the
   app never blocks progress on a wrong mark, it lets a wrong
   painting read into a wrong answer, and the feedback panel catches
   it there.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { cutSockets, signPaint } from "../engine/interactive.js";
import { specFor, randParabola, randLine, randHyperbola, randExp, randSemicircle, windowFor, mostlyInFrame } from "./_graphs.js";
import { criticalXs, sections, signAt, paraTP, eqStr, C, pick, makeFn, parabolaFromRoots } from "../funclib.js";
import { computeFunction } from "../engine/function-graph.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#fb7185";

/* ---------------- shared helpers ---------------- */

function usableSections(secs, curves) {
  return secs.map((s) => ({ ...s, usable: curves.every((cv) => Number.isFinite(makeFn(cv)(s.mid))) }));
}

/* socket candidates: the real boundaries plus up to two decoys that
   must NOT get a line (a turning point; the y-axis) */
function cutCandidates(curvesArr, win) {
  const cands = criticalXs(curvesArr, win.xmin, win.xmax).map((c) => ({ x: c.x, why: c.why, need: true }));
  const decoys = [];
  curvesArr.forEach((cv) => {
    if (cv.kind === "parabola") decoys.push({ x: paraTP(cv).x, why: "tp" });
  });
  decoys.push({ x: 0, why: "yaxis" });
  decoys.forEach((d) => {
    if (!Number.isFinite(d.x)) return;
    if (d.x <= win.xmin + 0.5 || d.x >= win.xmax - 0.5) return;
    if (cands.some((c) => Math.abs(c.x - d.x) < 0.45)) return;
    if (cands.filter((c) => !c.need).length >= 2) return;
    cands.push({ ...d, need: false });
  });
  return cands.sort((a, b) => a.x - b.x);
}

const DECOY_MSG = {
  tp: B("A turning point is not where the graph changes sign — no line there.",
        "'n Draaipunt is nie waar die grafiek van teken verander nie — geen lyn daar nie."),
  yaxis: B("The y-axis is not a boundary — only x-intercepts and asymptotes get lines.",
           "Die y-as is nie 'n grens nie — net x-afsnitte en asimptote kry lyne."),
};

/* the two-phase build: sockets (cut lines) → paint (+ / − on each curve).
   Nothing is gated on getting the paint right — her board method reads
   the ANSWER off the painting, mistakes included, so the marks the
   learner leaves behind are exactly what carries into the mc() that
   follows (house law from batch 1 / q6's compareSweep). */
function buildSignsFlow({ spec, cands, secs, curveIdx, names, tableSpec }) {
  const requiredIdx = new Set(cands.map((c, i) => (c.need ? i : -1)).filter((i) => i >= 0));
  return (host, done, nudge) => {
    const sockets = cutSockets(host, {
      spec, candidates: cands,
      onChange: (chosen) => {
        const same = chosen.size === requiredIdx.size && [...requiredIdx].every((i) => chosen.has(i));
        if (same) {
          sockets.reveal(requiredIdx);
          nudge(B("Lines placed! Now mark + and − on each graph, section by section.",
                  "Lyne geplaas! Merk nou + en − op elke grafiek, afdeling vir afdeling."));
          setTimeout(() => {
            const truth = {};
            curveIdx.forEach((ci) => {
              truth[ci] = {};
              secs.forEach((s, si) => { truth[ci][si] = signAt(tableSpec.curves[ci], s.mid); });
            });
            const painter = signPaint(host, {
              spec: tableSpec, sections: secs, curves: curveIdx, names,
              onChange: (state, allMarked) => {
                if (allMarked) {
                  painter.reveal(truth);
                  nudge(B("Marked! Now read the sections off your own marks.",
                          "Gemerk! Lees nou die afdelings van jou eie merke af."));
                  setTimeout(done, 400);
                  return;
                }
                let n = 0, total = 0;
                curveIdx.forEach((ci) => { Object.values(state[ci]).forEach((v) => { total++; if (v !== 0) n++; }); });
                nudge(B(`Marked ${n} of ${total}.`, `${n} van ${total} gemerk.`));
              },
            });
          }, 350);
          return;
        }
        const extra = [...chosen].find((i) => !cands[i].need);
        if (extra != null) nudge(DECOY_MSG[cands[extra].why] || DECOY_MSG.tp);
        else {
          const missingAsym = cands.some((c, i) => c.need && c.why === "asym" && !chosen.has(i));
          if (missingAsym && chosen.size >= requiredIdx.size - 1)
            nudge(B("You are missing a boundary — the asymptote counts too.",
                    "Jy kort 'n grens — die asimptoot tel ook."));
          else nudge(B(`Placed ${chosen.size} of ${requiredIdx.size}.`, `${chosen.size} van ${requiredIdx.size} geplaas.`));
        }
      },
    });
    return sockets;
  };
}

/* method lines shown in every feedback panel of this quest */
const METHOD = (productQ) => [
  B("1. A line through every x-intercept and asymptote.", "1. 'n Lyn deur elke x-afsnit en asimptoot."),
  B("2. Mark each section on the graph: above the x-axis +, below −.",
    "2. Merk elke afdeling op die grafiek: bo die x-as +, onder −."),
  ...(productQ ? [B("3. Compare the two rows of marks: signs the SAME → +, signs DIFFERENT → −.",
                     "3. Vergelyk die twee rye merke: tekens DIESELFDE → +, tekens VERSKIL → −.")] : []),
  B(productQ ? "4. Read the answer off the matching sections, left to right."
             : "3. Read the answer off the marks, left to right.",
    productQ ? "4. Lees die antwoord van die ooreenstemmende afdelings af, links na regs."
             : "3. Lees die antwoord van die merke af, links na regs."),
];

/* ---------------- the skills ---------------- */

const SKILLS = {
  /* one graph: f(x) > 0 or f(x) < 0 */
  singleSign: () => {
    const cv = pick([randParabola(), randParabola(), randLine(), randExp(), randHyperbola()]);
    const win = windowFor([cv]);
    /* the same rare edge case §4b guards everywhere else: windowFor()'s own
       identity-feature box can still leave a steep-armed parabola mostly
       cropped once the WHOLE curve is sampled, not just its features (fix
       day, 2026-08-13 — caught the moment this round's spec was first
       exposed as it.graph, closing a coverage hole that used to hide it).
       randParabola() lives in _graphs.js, out of this file's edit scope —
       so this round rejects the rare bad draw locally instead, the same
       way every caller of windowFor() already has to. (Null-guard first:
       mostlyInFrame reads win.xmin, and a null window must redraw, never
       throw — foreman review fix, 2026-08-13.) */
    if (!win || !mostlyInFrame(cv, win)) return SKILLS.singleSign();
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
    const cuts = criticalXs([cv], win.xmin, win.xmax);
    if (!cuts.length) return SKILLS.singleSign();
    const cands = cutCandidates([cv], win);
    const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
    const secs = usableSections(sections(cuts, win.xmin, win.xmax), [cv]);
    const wantPos = pick([true, false]);
    const lang = getLang();

    const chosen = secs.filter((s) => s.usable && signAt(cv, s.mid) === (wantPos ? 1 : -1));
    if (!chosen.length || chosen.length === secs.length) return SKILLS.singleSign();
    const correct = answerString(chosen, cuts, win, { strict: true, lang });
    const wrongs = [
      { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
        misc: wantPos
          ? B("Those are the − sections. f(x) > 0 asks where the graph is ABOVE the x-axis — the + marks.",
              "Daai is die − afdelings. f(x) > 0 vra waar die grafiek BO die x-as lê — die + merke.")
          : B("Those are the + sections. f(x) < 0 asks where the graph is BELOW the x-axis — the − marks.",
              "Daai is die + afdelings. f(x) < 0 vra waar die grafiek ONDER die x-as lê — die − merke.") },
      { label: asYString(correct),
        misc: B("The answer must be x-values. f(x) is the height, but WHERE it happens is an x.",
                "Die antwoord moet x-waardes wees. f(x) is die hoogte, maar WAAR dit gebeur is 'n x.") },
      { label: flipStrictString(chosen, cuts, win, { strict: true, lang }),
        misc: B("A strict < or > never includes the boundary values.",
                "'n Streng < of > sluit nooit die grenswaardes in nie.") },
    ];

    const built = iq({
      concept: "signs", kind: "signPaint", accent: ACC,
      prompt: wantPos
        ? B("For which values of x is <span class='eq'>f(x) &gt; 0</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &gt; 0</span>?")
        : B("For which values of x is <span class='eq'>f(x) &lt; 0</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &lt; 0</span>?"),
      stem: `<span class="eq">${eqStr(cv, "f(x)")}</span>`,
      coach: B("Step 1: tap every place that needs a vertical line.",
               "Stap 1: klik op elke plek wat 'n vertikale lyn nodig het."),
      hints: [
        B("Lines go where the graph CROSSES the x-axis, and at asymptotes — nowhere else.",
          "Lyne gaan waar die grafiek die x-as SNY, en by asimptote — nêrens anders nie."),
        wantPos
          ? B("Then read your + marks: those sections, left to right, are the answer.",
              "Lees dan jou + merke: daardie afdelings, links na regs, is die antwoord.")
          : B("Then read your − marks: those sections, left to right, are the answer.",
              "Lees dan jou − merke: daardie afdelings, links na regs, is die antwoord."),
      ],
      build: buildSignsFlow({ spec, cands, secs, curveIdx: [0], names: ["f"], tableSpec }),
      then: mc("signs",
        wantPos ? B("Read the answer off your + marks.", "Lees die antwoord van jou + merke af.")
                : B("Read the answer off your − marks.", "Lees die antwoord van jou − merke af."),
        correct, wrongs,
        { answerLabel: correct, solution: METHOD(false),
          hint: B("Your marks already hold the answer — join the right sections, left to right.",
                  "Jou merke het reeds die antwoord — voeg die regte afdelings saam, links na regs.") }),
    });
    /* verify-only: independent ground truth for the headless checks
       (never read by play.js — an extra field on an ordinary object) */
    built.debugCurves = { cv, win, cuts, secs, wantPos, cands };
    /* verify-only: play.js only ever reads item.graph on a NON-interactive
       item — an interactive item is mounted through build() instead, so
       exposing the built spec here is pure data (§4b frame-honesty and
       §22 off-axis now cover this round too, closing the gap the old
       code left open). */
    built.graph = tableSpec;
    return built;
  },

  /* two graphs: the product (her "tekens verskil") */
  productSign: () => {
    const a = pick([randParabola(), randLine(), randSemicircle()]);
    const b = pick([randLine(), randExp(), randParabola()]);
    const win = windowFor([a, b]);
    if (!win) return SKILLS.productSign();
    /* same rare-edge-case guard as singleSign — see its comment */
    if (!mostlyInFrame(a, win) || !mostlyInFrame(b, win)) return SKILLS.productSign();
    const spec = specFor([a, b], { win, accent: ACC, ticks: true, labels: ["f", "g"], asymLabels: true });
    const cuts = criticalXs([a, b], win.xmin, win.xmax);
    if (cuts.length < 2 || cuts.length > 4) return SKILLS.productSign();
    const cands = cutCandidates([a, b], win);
    const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
    const secs = usableSections(sections(cuts, win.xmin, win.xmax), [a, b]);
    const wantNeg = pick([true, true, false]);
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
      { label: complementString(chosen, secs, cuts, win, { strict, lang }),
        misc: wantNeg
          ? B("Those columns have the SAME signs — the product is positive there.",
              "Daai kolomme het DIESELFDE tekens — die produk is positief daar.")
          : B("Those columns have DIFFERENT signs — the product is negative there.",
              "Daai kolomme het VERSKILLENDE tekens — die produk is negatief daar.") },
      { label: flipStrictString(chosen, cuts, win, { strict, lang }),
        misc: strict
          ? B("A strict inequality never includes the boundaries.", "'n Streng ongelykheid sluit nooit die grense in nie.")
          : B("≤ and ≥ DO include the x-intercepts (where the product is 0) — but never an asymptote.",
              "≤ en ≥ sluit WEL die x-afsnitte in (waar die produk 0 is) — maar nooit 'n asimptoot nie.") },
      { label: asYString(correct),
        misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
    ];
    const sym = wantNeg ? (strict ? "&lt; 0" : "≤ 0") : (strict ? "&gt; 0" : "≥ 0");

    const built = iq({
      concept: "product", kind: "signPaint", accent: ACC,
      prompt: B(`For which values of x is <span class='eq'>f(x)·g(x) ${sym}</span>?`,
                `Vir watter waardes van x is <span class='eq'>f(x)·g(x) ${sym}</span>?`),
      stem: B("Both graphs get marked, section by section.", "Albei grafieke word gemerk, afdeling vir afdeling."),
      coach: B("Step 1: tap every place that needs a vertical line.",
               "Stap 1: klik op elke plek wat 'n vertikale lyn nodig het."),
      hints: [
        B("Lines at every x-intercept of BOTH graphs, and at asymptotes.",
          "Lyne by elke x-afsnit van ALBEI grafieke, en by asimptote."),
        B("Then compare the two rows of marks: same signs +, different signs − ('tekens verskil').",
          "Vergelyk dan die twee rye merke: dieselfde tekens +, verskillende tekens − ('tekens verskil')."),
      ],
      build: buildSignsFlow({ spec, cands, secs, curveIdx: [0, 1], names: ["f", "g"], tableSpec }),
      then: mc("product",
        wantNeg ? B("Where do the signs DIFFER? Read those sections off.", "Waar VERSKIL die tekens? Lees daardie afdelings af.")
                : B("Where do the signs MATCH? Read those sections off.", "Waar STEM die tekens ooreen? Lees daardie afdelings af."),
        correct, wrongs,
        { answerLabel: correct, solution: METHOD(true),
          hint: B("Compare f's marks with g's marks, section by section — same gives +, different gives −.",
                  "Vergelyk f se merke met g se merke, afdeling vir afdeling — dieselfde gee +, verskillend gee −.") }),
    });
    built.debugCurves = { a, b, win, cuts, secs, wantNeg, strict, cands };
    built.graph = tableSpec;
    return built;
  },

  /* the idea underneath it all: f(x) IS the height */
  heightIdea: () => {
    const cv = pick([randParabola(), randLine(), randExp()]);
    const win = windowFor([cv]);
    const f = makeFn(cv);
    /* the sample x must sit CLEARLY above or below the axis — a point on
       (or near) an x-intercept makes "positive or negative?" a lie, and
       the app once marked f(x)=0 as "negative" because of exactly this.
       It must also be a WHOLE number — the window's edges are no longer
       rounded (that would break sx === sy), so candidates are built from
       integers directly rather than from win.xmin/xmax arithmetic. */
    const loInt = Math.ceil(win.xmin) + 1, hiInt = Math.floor(win.xmax) - 1;
    const allInts = [];
    for (let v = loInt; v <= hiInt; v++) allInts.push(v);
    const cands = allInts.filter((v) => Number.isFinite(f(v)) && Math.abs(f(v)) >= 0.6 && f(v) > win.ymin && f(v) < win.ymax);
    if (!cands.length) return SKILLS.heightIdea();
    const x = pick(cands);
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
       { label: B("you cannot tell from a sketch", "jy kan nie van 'n skets af sê nie"),
         misc: B("You can! Height above the axis = positive, below = negative. That is all f(x) means.",
                 "Jy kan! Hoogte bo die as = positief, onder = negatief. Dis al wat f(x) beteken.") }],
      { graph: spec, wide: true,
        stem: B("The dashed line shows how high the graph is at that x.",
                "Die stippellyn wys hoe hoog die grafiek by daardie x is."),
        hints: [B("f(x) is just the y-value — the height of the graph at that x.",
                  "f(x) is net die y-waarde — die hoogte van die grafiek by daardie x."),
                B("Follow the dashed line: does it point up from the axis, or down?",
                  "Volg die stippellyn: wys dit op vanaf die as, of af?")],
        answerLabel: correct });
  },
};

/* ---------------- the intro lesson (Kyk eers een saam) ----------------
   Her board method, worked once: f(x) = (x + 1)(x − 3), asked f(x) < 0.
   Cut lines → number the sections → mark + / − directly on the curve →
   read off. No table appears anywhere — this IS the method, not a
   simplified preview of a different one. Built once at module load;
   every beat re-renders the spec so the method appears in HER order. */
function buildIntro() {
  const cv = parabolaFromRoots(1, -1, 3);
  const win = windowFor([cv]);
  const base = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  const lined = { ...base, vlines: [{ x: -1 }, { x: 3 }] };
  const g = computeFunction(base);
  const secMids = [(win.xmin - 1) / 2, 1, (win.xmax + 3) / 2];
  const labFrag = secMids.map((m, i) =>
    `<text class="iv-sectlab" x="${g.X(m).toFixed(1)}" y="${(g.Y(win.ymax) + 12).toFixed(1)}" text-anchor="middle">${"①②③"[i]}</text>`).join("");
  const signFrag = secMids.map((m, i) => {
    const s = i === 1 ? "−" : "+";
    const y = makeFn(cv)(m);
    const rawPy = g.Y(Math.max(win.ymin + 1, Math.min(win.ymax - 1, y))) + (y >= 0 ? -18 : 18);
    /* clamp clear of the ①②③ number row (verify's visual pass caught a
       4px overlap here, fix day 2026-08-13 — a steep section near the
       top edge put the + mark right under the section number) */
    const py = Math.max(g.Y(win.ymax) + 30, Math.min(g.Y(win.ymin) - 14, rawPy));
    return `<text class="iv-sign ${s === "+" ? "plus" : "minus"}" x="${g.X(m).toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle">${s}</text>`;
  }).join("");
  return { beats: [
    { spec: base, cap: B("The question: for which values of x is <span class='eq'>f(x) &lt; 0</span>? Remember — f(x) is just the y-value, the HEIGHT of the graph.",
                         "Die vraag: vir watter waardes van x is <span class='eq'>f(x) &lt; 0</span>? Onthou — f(x) is net die y-waarde, die HOOGTE van die grafiek.") },
    { spec: lined, cap: B("Step 1: draw a vertical line through EVERY x-intercept (and every asymptote).",
                          "Stap 1: trek 'n vertikale lyn deur ELKE x-afsnit (en elke asimptoot).") },
    { spec: lined, frag: labFrag,
      cap: B("Step 2: number the sections, left to right.", "Stap 2: nommer die afdelings, links na regs.") },
    { spec: lined, frag: labFrag + signFrag,
      cap: B("Step 3: mark each section, right on the curve — ABOVE the x-axis = +, BELOW = −.",
             "Stap 3: merk elke afdeling, reg op die kurwe — BO die x-as = +, ONDER = −.") },
    { spec: { ...lined, shades: [{ x0: -1, x1: 3 }] }, frag: labFrag + signFrag,
      cap: B("Step 4: read it off your own marks, left to right. <span class='eq'>f(x) &lt; 0</span> where the − is: <b class='eq'>−1 &lt; x &lt; 3</b>.",
             "Stap 4: lees dit van jou eie merke af, links na regs. <span class='eq'>f(x) &lt; 0</span> waar die − is: <b class='eq'>−1 &lt; x &lt; 3</b>.") },
  ] };
}

export const quest5 = quest("q5",
  B("Plus and minus", "Plus en minus"),
  B("f(x) > 0 and f(x)·g(x) < 0 — lines, then mark the curve, then read off", "f(x) > 0 en f(x)·g(x) < 0 — lyne, merk dan die kurwe, lees dan af"),
  [
    { id: "heightIdea", concept: "signs", gen: SKILLS.heightIdea },
    { id: "singleSign", concept: "signs", gen: SKILLS.singleSign, weight: 2 },
    { id: "productSign", concept: "product", gen: SKILLS.productSign, weight: 2 },
  ],
  { rounds: 5, accent: ACC });

quest5.intro = buildIntro();
