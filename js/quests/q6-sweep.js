/* ============================================================
   QUEST 6 · WHICH ONE IS ON TOP — f(x) > g(x)
   ------------------------------------------------------------
   Megan's method, in three moves:

     1. draw a vertical line through EVERY intersection AND
        EVERY asymptote  (forgetting the asymptote is THE error,
        so the decoy sockets are things that must NOT get a line)
     2. number the sections and sweep a line left → right,
        deciding in each one which graph lies above the other
     3. write it down, left to right, with the right signs
        — and an asymptote's x is never included

   The curve pairs are curated so every intersection lands on a
   whole number: a learner must never read "about 3,8".
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { cutSockets, sweep } from "../engine/interactive.js";
import { specFor, windowFor } from "./_graphs.js";
import {
  makeFn, paraTP, paraRoots, lineXInt, hypXInt, parabolaFromRoots,
  criticalXs, sections, aboveAt, eqStr, C, pick, randInt, ptStr,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#c4b5fd";

/* ------------------------------------------------------------
   Curated pairs with whole-number intersections.
   Returns { f, g, meets:[x…], hasAsym }
   ------------------------------------------------------------ */
function nicePair() {
  if (pick([true, true, false])) {
    /* hyperbola + straight line — her vb. 6 shape.
       a/x + k = x + c  meets at r1, r2 when a = −r1·r2 and c = −(r1+r2) */
    let r1 = pick([-4, -3, -2, -1]), r2 = pick([1, 2, 3, 4]);
    const k = pick([0, 1, -1, 2]);
    const a = -r1 * r2, c = -(r1 + r2) + k;
    const f = { kind: "hyperbola", a, p: 0, q: k };
    const g = { kind: "line", a: 1, q: c };
    if (Math.abs(a) > 12) return nicePair();
    return { f, g, meets: [r1, r2].sort((u, v) => u - v), hasAsym: true };
  }
  /* parabola + straight line through two of its whole-number points */
  const rootA = randInt(-4, 0), rootB = rootA + pick([2, 3, 4]);
  const lead = pick([1, -1]);
  const f = parabolaFromRoots(lead, rootA, rootB);
  const ff = makeFn(f);
  let x1 = randInt(rootA - 2, rootB - 1), x2 = x1 + pick([2, 3]);
  const m = (ff(x2) - ff(x1)) / (x2 - x1);
  const g = { kind: "line", a: m, q: ff(x1) - m * x1 };
  /* steeper than this and the line runs off the top/bottom of any
     square-grid window before crossing much width — see randLine() */
  if (!Number.isFinite(m) || Math.abs(m) > 2) return nicePair();
  return { f, g, meets: [x1, x2].sort((u, v) => u - v), hasAsym: false };
}

/* every place that could plausibly get a cut line, real ones flagged */
function socketCandidates(f, g, meets, win) {
  const cands = [];
  meets.forEach((x) => cands.push({ x, why: "cross", need: true }));
  if (f.kind === "hyperbola") cands.push({ x: f.p, why: "asym", need: true });

  /* decoys — places learners wrongly cut for an "is it on top" question */
  const decoys = [];
  if (f.kind === "parabola") {
    paraRoots(f).forEach((r) => decoys.push({ x: r, why: "zero" }));
    decoys.push({ x: paraTP(f).x, why: "tp" });
  }
  if (f.kind === "hyperbola") { const t = hypXInt(f); if (t != null) decoys.push({ x: t, why: "zero" }); }
  const lx = lineXInt(g); if (lx != null) decoys.push({ x: lx, why: "zero" });

  decoys.forEach((d) => {
    if (!Number.isFinite(d.x)) return;
    if (d.x <= win.xmin + 0.4 || d.x >= win.xmax - 0.4) return;
    if (cands.some((c) => Math.abs(c.x - d.x) < 0.35)) return;
    if (cands.filter((c) => !c.need).length >= 2) return;
    cands.push({ ...d, need: false });
  });
  return cands.sort((a, b) => a.x - b.x);
}

const SKILLS = {
  /* ---------- the full three-move drill ---------- */
  topSweep: () => {
    const { f, g, meets, hasAsym } = nicePair();
    /* the intersections are the POINT of the question — the window must
       hold them (they are not "features" of either curve on its own, so
       windowFor would happily crop them out otherwise) */
    const win = windowFor([f, g], { include: meets.map((x) => ({ x, y: makeFn(g)(x) })) });
    if (!win) return SKILLS.topSweep();
    if (meets.some((x) => x <= win.xmin + 0.5 || x >= win.xmax - 0.5)) return SKILLS.topSweep();
    const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
    const cands = socketCandidates(f, g, meets, win);
    const requiredIdx = new Set(cands.map((c, i) => (c.need ? i : -1)).filter((i) => i >= 0));

    const cuts = criticalXs([f, g], win.xmin, win.xmax, { zeros: false, withIntersections: true });
    const secs = sections(cuts, win.xmin, win.xmax);
    const wantF = pick([true, false]);
    const lang = getLang();
    const chosen = secs.filter((s) => {
      const t = aboveAt(f, g, s.mid);
      return t !== null && (wantF ? t > 0 : t < 0);
    });
    if (!chosen.length || chosen.length === secs.length) return SKILLS.topSweep();

    const correct = answerString(chosen, cuts, win, { strict: true, lang });
    const wrongs = [
      { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
        misc: wantF
          ? B("Those are the sections where f lies BELOW g — the question asks where f is on top.",
              "Daai is die afdelings waar f ONDER g lê — die vraag vra waar f bo lê.")
          : B("Those are the sections where f lies ABOVE g — the question asks where f is below.",
              "Daai is die afdelings waar f BO g lê — die vraag vra waar f onder lê.") },
      { label: flipStrictString(chosen, cuts, win, { strict: true, lang }),
        misc: B("A strict < or > never includes the boundaries — and an asymptote's x is NEVER included.",
                "'n Streng < of > sluit nooit die grense in nie — en 'n asimptoot se x word NOOIT ingesluit nie.") },
      { label: asYString(correct),
        misc: B("The answer must be x-values — we compare heights, but WHERE it happens is an x.",
                "Die antwoord moet x-waardes wees — ons vergelyk hoogtes, maar WAAR dit gebeur is 'n x.") },
    ];

    const nameTop = (fOnTop) => (fOnTop ? "f" : "g");

    return iq({
      concept: "compare", kind: "sweep", accent: ACC,
      prompt: wantF
        ? B("For which values of x is <span class='eq'>f(x) &gt; g(x)</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &gt; g(x)</span>?")
        : B("For which values of x is <span class='eq'>f(x) &lt; g(x)</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &lt; g(x)</span>?"),
      stem: `<span class="eq">f(x) = ${eqStr(f, "").replace(/^\s*=\s*/, "")}</span> &nbsp;·&nbsp; <span class="eq">g(x) = ${eqStr(g, "").replace(/^\s*=\s*/, "")}</span>`,
      coach: B("First: tap every place that needs a vertical cut line.",
               "Eerste: tik elke plek wat 'n vertikale snylyn nodig het."),
      hints: [
        B("Cut lines go where the graphs CROSS each other, and at every asymptote.",
          "Snylyne gaan waar die grafieke mekaar SNY, en by elke asimptoot."),
        B("Then sweep left to right: in each section, which graph is physically higher?",
          "Vee dan links na regs: in elke afdeling, watter grafiek lê fisies hoër?"),
      ],
      build: (host, done, nudge, meter, ask) => {
        /* ---- phase 1: place the cut lines ---- */
        const sockets = cutSockets(host, {
          spec, candidates: cands,
          onChange: (chosenSet) => {
            const same = chosenSet.size === requiredIdx.size && [...requiredIdx].every((i) => chosenSet.has(i));
            if (same) { sockets.reveal(requiredIdx); startSweep(); return; }
            const missingAsym = hasAsym && ![...chosenSet].some((i) => cands[i].why === "asym");
            const tooMany = [...chosenSet].some((i) => !cands[i].need);
            if (tooMany) nudge(B("One of those does not need a line — a turning point or an x-intercept is not where the graphs swap places.",
                                 "Een van daai het nie 'n lyn nodig nie — 'n draaipunt of x-afsnit is nie waar die grafieke omruil nie."));
            else if (missingAsym && chosenSet.size >= requiredIdx.size - 1)
              nudge(B("You are missing a boundary — remember the asymptote counts too.",
                      "Jy kort 'n grens — onthou die asimptoot tel ook."));
            else nudge(B(`Placed ${chosenSet.size} of ${requiredIdx.size}.`,
                         `${chosenSet.size} van ${requiredIdx.size} geplaas.`));
          },
        });

        /* ---- phase 2: sweep left to right ---- */
        function startSweep() {
          nudge(B("Now slide the scan line to the right, section by section.",
                  "Skuif nou die skandeerlyn na regs, afdeling vir afdeling."));
          setTimeout(() => {
            const sw = sweep(host, {
              spec, sections: secs,
              onEnter: (sec, i) => {
                const t = aboveAt(f, g, sec.mid);
                const fTop = t > 0;
                ask(B("In this section, which graph is on top?", "In hierdie afdeling, watter grafiek lê bo?"),
                  [{ label: "f", correct: fTop }, { label: "g", correct: !fTop }],
                  (ok) => {
                    if (!ok) { nudge(B(`Look again — ${nameTop(fTop)} is the higher one there.`,
                                       `Kyk weer — ${nameTop(fTop)} is daar die hoër een.`)); return; }
                    sw.unlock();
                    if (i >= secs.length - 1) done();
                    else nudge(B("Good. Slide on to the next section.", "Goed. Skuif aan na die volgende afdeling."));
                  });
              },
            });
          }, 350);
        }
        return sockets;
      },
      then: mc("compare",
        B("Now write it down — left to right.", "Skryf dit nou neer — links na regs."),
        correct, wrongs,
        { hint: hasAsym
            ? B("Join the sections you marked. The asymptote's x is never included.",
                "Voeg die afdelings saam wat jy gemerk het. Die asimptoot se x word nooit ingesluit nie.")
            : B("Join the sections you marked, in order from left to right.",
                "Voeg die afdelings saam wat jy gemerk het, van links na regs."),
          answerLabel: correct,
          solution: [
            B("1. A line through every intersection AND every asymptote.",
              "1. 'n Lyn deur elke snypunt EN elke asimptoot."),
            B("2. Sweep left to right: per section, which graph is on top?",
              "2. Vee links na regs: per afdeling, watter grafiek lê bo?"),
            B("3. Write those sections as x-intervals, left to right — an asymptote's x is never included.",
              "3. Skryf daardie afdelings as x-intervalle, links na regs — 'n asimptoot se x word nooit ingesluit nie."),
          ] }),
    });
  },

  /* ---------- just the boundaries: which x needs a line? ---------- */
  whichCuts: () => {
    const { f, g, meets, hasAsym } = nicePair();
    const win = windowFor([f, g], { include: meets.map((x) => ({ x, y: makeFn(g)(x) })) });
    if (!win) return SKILLS.whichCuts();
    if (meets.some((x) => x <= win.xmin + 0.5 || x >= win.xmax - 0.5)) return SKILLS.whichCuts();
    const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
    const meetStr = meets.map((x) => C(x)).join(" and ");
    const meetStrAf = meets.map((x) => C(x)).join(" en ");
    const correct = hasAsym
      ? B(`x = ${meetStr}, and the asymptote x = ${C(f.p)}`, `x = ${meetStrAf}, en die asimptoot x = ${C(f.p)}`)
      : B(`x = ${meetStr} — where the graphs cut each other`, `x = ${meetStrAf} — waar die grafieke mekaar sny`);
    const wrongs = hasAsym
      ? [B(`Only x = ${meetStr}`, `Net x = ${meetStrAf}`),
         B("Only the asymptote", "Net die asimptoot"),
         B("Where each graph cuts the x-axis", "Waar elke grafiek die x-as sny")]
      : [B("Where each graph cuts the x-axis", "Waar elke grafiek die x-as sny"),
         B("At the turning point", "By die draaipunt"),
         B(`Only x = ${C(meets[0])}`, `Net x = ${C(meets[0])}`)];
    return mc("compare",
      B("Where must the vertical cut lines go for <span class='eq'>f(x) &gt; g(x)</span>?",
        "Waar moet die vertikale snylyne gaan vir <span class='eq'>f(x) &gt; g(x)</span>?"),
      correct, wrongs,
      { graph: spec, wide: true,
        hint: B("Cut lines go where the graphs SWAP places, and where a graph jumps — nowhere else.",
                "Snylyne gaan waar die grafieke OMRUIL, en waar 'n grafiek spring — nêrens anders nie."),
        answerLabel: correct });
  },

  /* ---------- read a SHADED band off a real sketch and write it ----------
     This used to be a wall of sentences with no picture at all — which
     taught nothing about reading a graph. Now the band is drawn: the
     learner reads its two edges off the axes and decides each sign by
     what KIND of boundary it is (asymptote → always open). */
  notation: () => {
    const { f, g, meets, hasAsym } = nicePair();
    if (!hasAsym) return SKILLS.notation();                 // the trap needs an asymptote
    const win = windowFor([f, g], { include: meets.map((x) => ({ x, y: makeFn(g)(x) })) });
    if (!win) return SKILLS.notation();
    if (meets.some((x) => x <= win.xmin + 0.5 || x >= win.xmax - 0.5)) return SKILLS.notation();

    /* shade the band between the asymptote and the intersection to its right */
    const right = meets.find((x) => x > f.p);
    if (right == null) return SKILLS.notation();
    const lo = f.p, hi = right;
    const spec = specFor([f, g], {
      win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true,
      points: [{ x: hi, y: makeFn(g)(hi), on: [0, 1], label: `(${C(hi)} ; ${C(makeFn(g)(hi))})` }],
    });
    spec.shades = [{ x0: lo, x1: hi }];
    spec.vlines = [{ x: lo }, { x: hi }];

    const correct = `<span class='eq'>${C(lo)} &lt; x ≤ ${C(hi)}</span>`;
    return mc("notation",
      B("Write the shaded band in symbols. Careful with each end!",
        "Skryf die skakeerde strook in simbole. Wees versigtig met elke kant!"),
      correct,
      [{ label: `<span class='eq'>${C(lo)} ≤ x ≤ ${C(hi)}</span>`,
         misc: B(`x = ${C(lo)} is a vertical asymptote — the graph never reaches it, so that end can never be closed.`,
                 `x = ${C(lo)} is 'n vertikale asimptoot — die grafiek bereik dit nooit nie, so daardie kant kan nooit toe wees nie.`) },
       { label: `<span class='eq'>${C(lo)} &lt; x &lt; ${C(hi)}</span>`,
         misc: B(`x = ${C(hi)} is a real meeting point on both graphs, so it CAN be included.`,
                 `x = ${C(hi)} is 'n werklike ontmoetpunt op albei grafieke, so dit KAN ingesluit word.`) },
       { label: `<span class='eq'>${C(hi)} &lt; x ≤ ${C(lo)}</span>`,
         misc: B("Intervals are always written left to right — the smaller number first.",
                 "Intervalle word altyd links na regs geskryf — die kleiner getal eerste.") }],
      { graph: spec, wide: true,
        stem: B("The dashed line at the left edge is an asymptote; the dot at the right edge is where the graphs meet.",
                "Die stippellyn aan die linkerkant is 'n asimptoot; die kolletjie aan die regterkant is waar die grafieke mekaar ontmoet."),
        hints: [
          B("Read the two edges off the x-axis first — what are the numbers?",
            "Lees eers die twee kante van die x-as af — wat is die getalle?"),
          B("Now each sign: you can never stand ON an asymptote (open), but a meeting point is a real point (can be closed).",
            "Nou elke teken: jy kan nooit OP 'n asimptoot staan nie (oop), maar 'n ontmoetpunt is 'n regte punt (kan toe wees)."),
        ],
        solution: [
          B("1. Read the left edge and the right edge off the x-axis.", "1. Lees die linker- en regterkant van die x-as af."),
          B("2. Asymptote end → always < or > (never included).", "2. Asimptoot-kant → altyd < of > (nooit ingesluit nie)."),
          B("3. Meeting-point end → ≤ or ≥ is allowed.", "3. Ontmoetpunt-kant → ≤ of ≥ is toegelaat."),
        ],
        answerLabel: correct });
  },
};

export const quest6 = quest("q6",
  B("Which one is on top", "Watter een lê bo"),
  B("f(x) > g(x) — cut lines, then sweep left to right", "f(x) > g(x) — snylyne, dan vee links na regs"),
  [
    { id: "whichCuts", concept: "compare", gen: SKILLS.whichCuts },
    { id: "topSweep", concept: "compare", gen: SKILLS.topSweep, weight: 3 },
    { id: "notation", concept: "notation", gen: SKILLS.notation },
  ],
  { rounds: 5, accent: ACC });

/* ---------------- the intro lesson: her vb. 6 shape ---------------- */
import { computeFunction } from "../engine/function-graph.js";
import { specFor as _specFor, windowFor as _windowFor } from "./_graphs.js";

function buildIntro() {
  const f = { kind: "hyperbola", a: 8, p: 0, q: 1 };
  const g0 = { kind: "line", a: 1, q: -1 };
  /* this fixed pair meets at (−2;−3) and (4;3). Without naming them the
     window puts x = 4 EXACTLY on the frame edge — and the whole lesson
     is "a cut line through every intersection", so both must sit
     comfortably inside the picture */
  const win = _windowFor([f, g0], { include: [{ x: -2, y: -3 }, { x: 4, y: 3 }] });
  const base = _specFor([f, g0], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
  const lined = { ...base, vlines: [{ x: -2 }, { x: 0 }, { x: 4 }] };
  const geo = computeFunction(base);
  const mids = [(win.xmin - 2) / 2, -1, 2, (win.xmax + 4) / 2];
  const labFrag = mids.map((m, i) =>
    `<text class="iv-sectlab" x="${geo.X(m).toFixed(1)}" y="${(geo.Y(win.ymax) + 12).toFixed(1)}" text-anchor="middle">${"①②③④"[i]}</text>`).join("");
  quest6.intro = { beats: [
    { spec: base, cap: B("The question: for which values of x is f(x) &gt; g(x)? In pictures: WHERE does f lie on top of g?",
                         "Die vraag: vir watter waardes van x is f(x) &gt; g(x)? In prente: WAAR lê f bo-op g?") },
    { spec: lined, cap: B("Step 1: a vertical line through EVERY intersection AND every asymptote. The asymptote is the one everyone forgets.",
                          "Stap 1: 'n vertikale lyn deur ELKE snypunt EN elke asimptoot. Die asimptoot is die een wat almal vergeet.") },
    { spec: lined, frag: labFrag,
      cap: B("Step 2: number the sections, left to right.", "Stap 2: nommer die afdelings, links na regs.") },
    { spec: { ...lined, shades: [{ x0: win.xmin, x1: -2 }, { x0: 0, x1: 4 }] }, frag: labFrag,
      cap: B("Step 3: sweep left to right, one section at a time: ① f on top ✓ · ② g on top ✗ · ③ f on top ✓ · ④ g on top ✗.",
             "Stap 3: vee links na regs, een afdeling op 'n slag: ① f lê bo ✓ · ② g lê bo ✗ · ③ f lê bo ✓ · ④ g lê bo ✗.") },
    { spec: { ...lined, shades: [{ x0: win.xmin, x1: -2 }, { x0: 0, x1: 4 }] }, frag: labFrag,
      cap: B("Step 4: write the ✓ sections, left to right: <b>x &lt; −2 or 0 &lt; x &lt; 4</b>. The asymptote's x = 0 is NEVER included.",
             "Stap 4: skryf die ✓ afdelings, links na regs: <b>x &lt; −2 of 0 &lt; x &lt; 4</b>. Die asimptoot se x = 0 word NOOIT ingesluit nie.") },
  ] };
}
buildIntro();
