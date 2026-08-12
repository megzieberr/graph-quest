/* ============================================================
   QUEST 6 · ABOVE OR BELOW — f(x) > g(x)   ★ session 5 (Round D)
   ------------------------------------------------------------
   RUN-PLAN's Round D, replacing v1's q6-sweep.js. The cut lines are
   no longer a learner task — this round starts one step further in
   than v1 did:

     1. the game PRE-DRAWS a vertical line through every intersection
        AND every asymptote (nothing to place, nothing to miss)
     2. the learner STAMPS each section + or − — her +/− painting
        move (Law 4) — is f above g here, or below?
     3. the learner drags ONE scan line left → right through the
        picture to confirm by eye — no shading, no highlighted
        regions, just the line (sweep's `plain`+`open` mode)
     4. the answer is picked from a short list of x-intervals
     5. get it wrong, and the shaded-region scaffold switches on
        (in the feedback) for a retry at half marks — Boost's
        existing second-chance plumbing, unchanged, just with a
        picture added to what it already shows

   The curve pairs are curated so every intersection lands on a
   whole number: a learner must never read "about 3,8".
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { comparePaint, sweep } from "../engine/interactive.js";
import { specFor, windowFor } from "./_graphs.js";
import { renderFunction, computeFunction } from "../engine/function-graph.js";
import {
  makeFn, parabolaFromRoots,
  criticalXs, sections, aboveAt, eqStr, C, pick, randInt, mergeSections,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#c4b5fd";

/* ------------------------------------------------------------
   Curated pairs with whole-number intersections (unchanged from v1).
   Returns { f, g, meets:[x…], hasAsym }
   ------------------------------------------------------------ */
function nicePair() {
  if (pick([true, true, false])) {
    /* hyperbola + straight line — her vb. 6 shape.
       a/x + k = x + c  meets at r1, r2 when a = −r1·r2 and c = −(r1+r2) */
    let r1 = pick([-4, -3, -2, -1]), r2 = pick([1, 2, 3, 4]);
    const k = pick([1, -1, 2, -2]);
    const a = -r1 * r2, c = -(r1 + r2) + k;
    /* NEITHER asymptote may sit on an axis: a dashed line drawn on top of
       the x- or y-axis is invisible, and the notation round then points at
       something the learner cannot see ("the dashed line at the left edge
       is an asymptote"). Same principle as the frozen-asymptote rule from
       batch 1 — q is already non-zero above, and p shifts the whole picture
       sideways: solving a/(x−p) + k = (x−p) + c is the p = 0 case with every
       x moved by p, so the meeting points stay whole numbers. */
    const p = pick([-2, -1, 1, 2]);
    const f = { kind: "hyperbola", a, p, q: k };
    const g = { kind: "line", a: 1, q: c - p };
    if (Math.abs(a) > 12) return nicePair();
    return { f, g, meets: [r1 + p, r2 + p].sort((u, v) => u - v), hasAsym: true };
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

/* a compact re-render of the picture with the true + sections shaded —
   the "scaffold" that switches on only inside a wrong-answer nudge,
   never before (Law 6). Reuses the SAME lined spec so the cut lines and
   curves match exactly what the learner already stamped and swept. */
function scaffoldHtml(linedSpec, plusSections) {
  const merged = mergeSections(plusSections);
  const shaded = { ...linedSpec, shades: merged.map((iv) => ({ x0: iv.x0, x1: iv.x1 })) };
  return `<div class="graphbox" style="margin-top:8px">${renderFunction(shaded)}</div>`;
}

const SKILLS = {
  /* ---------- the three-move drill: stamp, sweep, answer ---------- */
  compareSweep: () => {
    const { f, g, meets, hasAsym } = nicePair();
    /* the intersections are the POINT of the question — the window must
       hold them (they are not "features" of either curve on its own, so
       windowFor would happily crop them out otherwise) */
    const win = windowFor([f, g], { include: meets.map((x) => ({ x, y: makeFn(g)(x) })) });
    if (!win) return SKILLS.compareSweep();
    if (meets.some((x) => x <= win.xmin + 0.5 || x >= win.xmax - 0.5)) return SKILLS.compareSweep();
    const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });

    const cuts = criticalXs([f, g], win.xmin, win.xmax, { zeros: false, withIntersections: true });
    const secs = sections(cuts, win.xmin, win.xmax);
    if (secs.length < 2) return SKILLS.compareSweep();
    /* the game pre-draws every cut line — nothing left for the learner
       to place or miss, unlike v1's cutSockets phase */
    const linedSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };

    const wantF = pick([true, false]);
    const lang = getLang();
    const chosen = secs.filter((s) => {
      const t = aboveAt(f, g, s.mid);
      return t !== null && (wantF ? t > 0 : t < 0);
    });
    if (!chosen.length || chosen.length === secs.length) return SKILLS.compareSweep();
    const plusSections = secs.filter((s) => aboveAt(f, g, s.mid) > 0);      // "f above g" truth, for the scaffold
    const truth = {};
    secs.forEach((s, i) => { truth[i] = aboveAt(f, g, s.mid) > 0 ? 1 : -1; });
    const scaffold = scaffoldHtml(linedSpec, plusSections);
    /* append the (language-agnostic) scaffold picture to BOTH sides of a
       bilingual misconception note — the AF/EN toggle re-renders the SAME
       stored item later (see rerender()), so `misc` must stay a proper
       {en,af} pair, never a string pre-flattened by "+" at build time
       (that silently stringifies the B() object to "[object Object]") */
    const withScaffold = (b) => ({ en: b.en + scaffold, af: b.af + scaffold });

    const correct = answerString(chosen, cuts, win, { strict: true, lang });
    const wrongs = [
      { label: complementString(chosen, secs, cuts, win, { strict: true, lang }),
        misc: withScaffold(wantF
          ? B("Those are the sections where f lies BELOW g — the question asks where f is on top.",
              "Daai is die afdelings waar f ONDER g lê — die vraag vra waar f bo lê.")
          : B("Those are the sections where f lies ABOVE g — the question asks where f is below.",
              "Daai is die afdelings waar f BO g lê — die vraag vra waar f onder lê.")) },
      { label: flipStrictString(chosen, cuts, win, { strict: true, lang }),
        misc: withScaffold(B("A strict < or > never includes the boundaries — and an asymptote's x is NEVER included.",
                 "'n Streng < of > sluit nooit die grense in nie — en 'n asimptoot se x word NOOIT ingesluit nie.")) },
      { label: asYString(correct),
        misc: withScaffold(B("The answer must be x-values — we compare heights, but WHERE it happens is an x.",
                 "Die antwoord moet x-waardes wees — ons vergelyk hoogtes, maar WAAR dit gebeur is 'n x.")) },
    ];

    const built = iq({
      concept: "compare", kind: "stampSweep", accent: ACC,
      prompt: wantF
        ? B("For which values of x is <span class='eq'>f(x) &gt; g(x)</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &gt; g(x)</span>?")
        : B("For which values of x is <span class='eq'>f(x) &lt; g(x)</span>?", "Vir watter waardes van x is <span class='eq'>f(x) &lt; g(x)</span>?"),
      stem: `<span class="eq">f(x) = ${eqStr(f, "").replace(/^\s*=\s*/, "")}</span> &nbsp;·&nbsp; <span class="eq">g(x) = ${eqStr(g, "").replace(/^\s*=\s*/, "")}</span>`,
      coach: B("The cut lines are already in — every intersection, and the asymptote. Now tap each section: is f above g, or below?",
               "Die snylyne is reeds daar — elke snypunt, en die asimptoot. Klik nou op elke afdeling: is f bo g, of onder?"),
      hints: [
        B("Tap a section once for +, twice for −. + means f is ABOVE g there.",
          "Klik op 'n afdeling een keer vir +, twee keer vir −. + beteken f is daar BO g."),
        B("Once every section is stamped, drag the scan line across left to right to check by eye.",
          "Sodra elke afdeling gestempel is, skuif die skandeerlyn oor links na regs om met die oog te toets."),
      ],
      build: (host, done, nudge) => {
        /* ---- phase 1: stamp each section + or − ---- */
        const stamper = comparePaint(host, {
          spec: linedSpec, curveA: 0, curveB: 1, sections: secs,
          onChange: (state, allMarked) => {
            if (allMarked) {
              stamper.reveal(truth);
              nudge(B("Stamped! Now drag the scan line across, left to right.",
                      "Gestempel! Skuif nou die skandeerlyn oor, links na regs."));
              setTimeout(startSweep, 450);
              return;
            }
            const n = Object.values(state).filter((v) => v !== 0).length;
            const total = Object.keys(state).length;
            nudge(B(`Stamped ${n} of ${total}.`, `${n} van ${total} gestempel.`));
          },
        });

        /* ---- phase 2: sweep left to right — just the line, no shading ---- */
        function startSweep() {
          const state = { ...stamper.state() };
          /* the scan line slides both ways now, so the last section can be
             entered more than once — this must still advance the round
             exactly once */
          let finished = false;
          sweep(host, {
            spec: linedSpec, sections: secs, plain: true, open: true,
            onEnter: (sec, i) => {
              if (finished || i < secs.length - 1) return;
              finished = true;
              setTimeout(done, 300);
            },
          });
          /* her board method reads the ANSWER off the PAINTING — so the
             painting must survive into this phase (mount() replaced the
             stamped graph; foreman catch). The stamps are re-drawn as the
             learner left them, mistakes included: a wrong painting reads
             into a wrong answer, and the scaffold catches it there. */
          const svg = host.querySelector("svg");
          const geo = computeFunction(linedSpec);
          const fA = makeFn(f), fB = makeFn(g);
          secs.forEach((sec, si) => {
            if (!state[si]) return;
            const ya = fA(sec.mid), yb = fB(sec.mid);
            if (!Number.isFinite(ya) || !Number.isFinite(yb)) return;
            const midY = Math.max(win.ymin + 0.3, Math.min(win.ymax - 0.3, (ya + yb) / 2));
            const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
            t.setAttribute("class", "iv-sign " + (state[si] === 1 ? "plus" : "minus"));
            t.setAttribute("x", geo.X(sec.mid).toFixed(1));
            t.setAttribute("y", geo.Y(midY).toFixed(1));
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("dominant-baseline", "middle");
            t.textContent = state[si] === 1 ? "+" : "−";
            svg.appendChild(t);
          });
        }
        return stamper;
      },
      then: mc("compare",
        B("Now pick the answer.", "Kies nou die antwoord."),
        correct, wrongs,
        { hint: hasAsym
            ? B("Join the sections you marked +. The asymptote's x is never included.",
                "Voeg die afdelings saam wat jy + gemerk het. Die asimptoot se x word nooit ingesluit nie.")
            : B("Join the sections you marked +, in order from left to right.",
                "Voeg die afdelings saam wat jy + gemerk het, van links na regs."),
          answerLabel: correct,
          solution: [
            B("1. A line through every intersection AND every asymptote — already drawn.",
              "1. 'n Lyn deur elke snypunt EN elke asimptoot — reeds geteken."),
            B("2. Stamp each section: is f above g (+) or below (−)?",
              "2. Stempel elke afdeling: is f bo g (+) of onder (−)?"),
            B("3. Write the + sections as x-intervals, left to right — an asymptote's x is never included.",
              "3. Skryf die + afdelings as x-intervalle, links na regs — 'n asimptoot se x word nooit ingesluit nie."),
          ] }),
    });
    /* verify-only: independent ground truth for the headless checks
       (never read by play.js — an extra field on an ordinary object) */
    built.debugCurves = { f, g, win, cuts, secs, wantF };
    return built;
  },

  /* ---------- read a SHADED band off a real sketch and write it ----------
     The band is drawn: the learner reads its two edges off the axes and
     decides each sign by what KIND of boundary it is (asymptote → open). */
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
  B("Above or below", "Bo of onder"),
  B("f(x) > g(x) — cut lines are in, stamp, then sweep to check", "f(x) > g(x) — snylyne is reeds daar, stempel, sweep dan om te toets"),
  [
    { id: "compareSweep", concept: "compare", gen: SKILLS.compareSweep, weight: 4 },
    { id: "notation", concept: "notation", gen: SKILLS.notation },
  ],
  /* alwaysSecondChance: her ruling 2026-08-12 — Round D offers the half-marks
     retry to everyone, not only inside Boost. */
  { rounds: 5, accent: ACC, alwaysSecondChance: true });

/* ---------------- the intro lesson: her vb. 6 shape ----------------
   Cut lines → number the sections → stamp → sweep → read off, in her
   exact vb. 6 pair (hyperbola a=8,p=0,q=1 vs line y=x−1), meeting at
   (−2;−3) and (4;3) — both named in `include:` so the window can never
   crop the very points the whole lesson is about. */
function buildIntro() {
  const f = { kind: "hyperbola", a: 8, p: 0, q: 1 };
  const g0 = { kind: "line", a: 1, q: -1 };
  const win = windowFor([f, g0], { include: [{ x: -2, y: -3 }, { x: 4, y: 3 }] });
  const base = specFor([f, g0], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
  const lined = { ...base, vlines: [{ x: -2 }, { x: 0 }, { x: 4 }] };
  const geo = computeFunction(base);
  const mids = [(win.xmin - 2) / 2, -1, 2, (win.xmax + 4) / 2];
  const numFrag = mids.map((m, i) =>
    `<text class="iv-sectlab" x="${geo.X(m).toFixed(1)}" y="${(geo.Y(win.ymax) + 12).toFixed(1)}" text-anchor="middle">${"①②③④"[i]}</text>`).join("");
  const signs = ["+", "−", "+", "−"];               // f above g, below, above, below — her worked pair
  const stampFrag = mids.map((m, i) => {
    const s = signs[i];
    const yMid = (makeFn(f)(Math.max(win.xmin + 0.3, Math.min(win.xmax - 0.3, m))) + makeFn(g0)(m)) / 2;
    const py = geo.Y(Math.max(win.ymin + 0.5, Math.min(win.ymax - 0.5, yMid)));
    return `<text class="iv-sign ${s === "+" ? "plus" : "minus"}" x="${geo.X(m).toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle">${s}</text>`;
  }).join("");
  quest6.intro = { beats: [
    { spec: base, cap: B("The question: for which values of x is f(x) &gt; g(x)? In pictures: WHERE does f lie on top of g?",
                         "Die vraag: vir watter waardes van x is f(x) &gt; g(x)? In prente: WAAR lê f bo-op g?") },
    { spec: lined, cap: B("Step 1: the cut lines are already drawn — through EVERY intersection AND every asymptote.",
                          "Stap 1: die snylyne is reeds geteken — deur ELKE snypunt EN elke asimptoot.") },
    { spec: lined, frag: numFrag,
      cap: B("Step 2: number the sections, left to right.", "Stap 2: nommer die afdelings, links na regs.") },
    { spec: lined, frag: numFrag + stampFrag,
      cap: B("Step 3: stamp each section — is f above g (+) or below (−)? ① + · ② − · ③ + · ④ −.",
             "Stap 3: stempel elke afdeling — is f bo g (+) of onder (−)? ① + · ② − · ③ + · ④ −.") },
    { spec: lined, frag: numFrag + stampFrag,
      cap: B("Step 4: drag a scan line left to right across the picture, to check the stamps with your own eyes.",
             "Stap 4: skuif 'n skandeerlyn links na regs oor die prent, om die stempels met jou eie oë te toets.") },
    { spec: { ...lined, shades: [{ x0: win.xmin, x1: -2 }, { x0: 0, x1: 4 }] }, frag: numFrag + stampFrag,
      cap: B("Step 5: write the + sections, left to right: <b>x &lt; −2 or 0 &lt; x &lt; 4</b>. The asymptote's x = 0 is NEVER included.",
             "Stap 5: skryf die + afdelings, links na regs: <b>x &lt; −2 of 0 &lt; x &lt; 4</b>. Die asimptoot se x = 0 word NOOIT ingesluit nie.") },
  ] };
}
buildIntro();
