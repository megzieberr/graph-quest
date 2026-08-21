/* ============================================================
   QUEST I · ONGELYKHEDE 2 — x·f(x), f/g and which endpoints close
   ★ batch 3, session 3 — full redesign (2026-08-21)
   ------------------------------------------------------------
   Rebuilt onto her live-trail method, per the reteach + prototype
   verdict (reference/RETEACH-XFX-2026-08-21.md): place the cut lines
   (cutSockets, unchanged from the first build) → sweep the scan line
   across the WHOLE range TWICE, one sign-row per sweep (trailSweep,
   engine/interactive.js §6.5) → read off. No signPaint, no boxes, no
   confirm-tap sweep — a round with only one row (R3's single-curve
   half) gets ONE sweep, not two.

   Three round types, one shared flow, one shared mechanic:
     R1  x·f(x), quadrant signs (Law 5). x has no curve of its own —
         its row rides f's curve, one step further out (trailSweep's
         `stackFrom`). Pass 1 lays f's row, pass 2 lays x's row
         underneath. Its own x-intercept sits exactly at x = 0: the
         y-axis boundary a learner must remember falls straight out
         of the picture. Forgetting that socket is THE teaching
         moment. THERE IS NO LINE y = x — deleted, per her finding #4
         and "HER FINAL CALL" in the reteach file. Never rebuild it.
     R2  f/g, the open circle. f and g each carry their OWN sweep,
         each riding its own drawn curve, in its own colour — pass 1
         f, pass 2 g. Compared exactly as f·g. The one difference is
         at g's own root, which NEVER closes — division by zero.
         Options differ ONLY in < vs ≤ at that one x (her spec,
         verbatim); the open circle is a scaffold, hidden by default,
         shown only after a wrong pick (Law 6).
     R3  endpoint discipline, mixed. Same lesson as R2, generalised: a
         real x-intercept of f can always close; an asymptote or a
         quotient's g-root never can. Half the time a single curve —
         ONE sweep, one row; half the time a quotient — TWO sweeps,
         f then g, richer than R2 (f may be a hyperbola too, carrying
         BOTH kinds of forbidden boundary at once).

   Every generator uses the prototype's window rule (windowForRound,
   below): a candidate window is re-derived so its `include` list also
   holds every section's own midpoint, for every curve in the round —
   reject-and-redraw if no window can hold the whole story. This is
   what killed the old self-playing round: a section whose midpoint
   the window could not show at all made the whole thing collapse to
   one paintable box.

   Kiss-stop lesson (carried over): NONE of these rounds compare two
   DRAWN curves for a tangency — R1 has no second drawn curve at all,
   R2/R3's quotient rounds only ever look at each curve's OWN
   zeros/asymptotes, never an f-vs-g intersection. Nothing in this
   file calls intersections().
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { cutSockets, trailSweep } from "../engine/interactive.js";
import { renderFunction, computeFunction } from "../engine/function-graph.js";
import {
  specFor, randParabola, randLine, randHyperbolaOffAxis, randExp,
  windowFor, mostlyInFrame,
} from "./_graphs.js";
import {
  criticalXs, sections, signAt, xIntercepts, vAsymptotes, lineXInt,
  paraTP, parabolaFromRoots, eqStr, pick, makeFn, mergeSections, frac,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#f87171";

/* app-convention row colours (her prototype verdict): f always cyan;
   the second row is red — x's abstract sign in R1, g's own drawn
   colour in the quotient rounds (var(--fg-b) is BOTH already, by
   construction: specFor()'s curve[1] gets tone "b" automatically). */
const FTONE = "var(--fg-a)";
const XTONE = "var(--fg-b)";
const GTONE = "var(--fg-b)";

/* ---------------- shared helpers ---------------- */

/* the prototype's window rule (her ruling: "the picture must hold the
   whole story"), now required by EVERY qI generator, not just R1. An
   initial window is built from the curves' own identity features,
   then a section-truth pass forces a SECOND window whose `include`
   list also holds every section's own midpoint (for every curve in
   the round) — the actual thing a learner needs to see, not just
   intercepts and asymptotes. Reject-and-redraw (return null) if no
   window at either stage can hold it.
   cutsFn(win) computes this round's own cut list against a candidate
   window; it returns null for a draw that fails the round's OWN
   constraints (crowding, a trap landing on a real zero, …) — that
   null propagates straight through as "no window", so a single
   guard function carries every generator's reject conditions. */
function windowForRound(curves, cutsFn) {
  const win0 = windowFor(curves);
  if (!win0) return null;
  const cuts0 = cutsFn(win0);
  if (!cuts0 || !cuts0.length) return null;
  const secs0 = sections(cuts0, win0.xmin, win0.xmax);
  const include = [];
  secs0.forEach((s) => curves.forEach((cv) => {
    const y = makeFn(cv)(s.mid);
    include.push(Number.isFinite(y) ? { x: s.mid, y } : { x: s.mid });
  }));
  const win = windowFor(curves, { include });
  if (!win) return null;
  const cuts = cutsFn(win);
  if (!cuts || !cuts.length) return null;
  /* the include-list trick above sizes the window off secs0 — the
     FIRST pass's sections. But a wider window can pull new features
     into range and shift the cuts (more of the curve becomes visible,
     or a distant asymptote enters frame), so the FINAL cuts/sections
     (recomputed against the new window) can differ from secs0 — most
     often right next to a hyperbola's own asymptote, where a narrow
     section's midpoint still blows up even in a much bigger window.
     Verify the actual guarantee directly against the FINAL result
     rather than trusting the first pass: every final section's own
     midpoint, for every curve, must genuinely land inside the final
     window. Reject-and-redraw if not — measured empirically at ~66%
     of draws failing this without the check, so it is not optional. */
  const secs = sections(cuts, win.xmin, win.xmax);
  const allInside = secs.every((s) => curves.every((cv) => {
    const y = makeFn(cv)(s.mid);
    return !Number.isFinite(y) || (y >= win.ymin - 1e-6 && y <= win.ymax + 1e-6);
  }));
  if (!allInside) return null;
  return { win, cuts };
}

const DECOY_MSG = {
  tp: B("A turning point is not where the graph changes sign — no line there.",
        "'n Draaipunt is nie waar die grafiek van teken verander nie — geen lyn daar nie."),
};

/* the one required-but-easy-to-forget boundary each round can name
   specifically when it is the ONLY thing still missing */
const MISSING_MSG = {
  yaxis: B("You're missing the y-axis — that is where x itself changes sign.",
           "Jy kort die y-as — dis waar x self van teken verander."),
  gzero: B("You're missing a boundary — g's own x-intercept counts too, since f/g is undefined there.",
           "Jy kort 'n grens — g se eie x-afsnit tel ook, want f/g is onbepaald daar."),
};

/* R2/R3's two endpoint-lesson nudges, shown on a WRONG pick only */
const GZERO_TRAP_MSG = B("You can't divide by zero — that x always stays open.",
                         "Deel deur nul mag nie — daardie x bly oop.");
const ASYM_CLOSED_MSG = B("The graph never actually reaches its asymptote — that x can never close, even with ≤ or ≥.",
                          "Die grafiek bereik nooit werklik sy asimptoot nie — daardie x kan nooit toemaak nie, selfs met ≤ of ≥.");
const REAL_OPENED_MSG = B("That x is a real x-intercept — a genuine point on the graph, so ≤ or ≥ CAN close it.",
                          "Daardie x is 'n regte x-afsnit — 'n werklike punt op die grafiek, so ≤ of ≥ KAN dit toemaak.");

/* a boundary that can never close, whatever the drawn cuts array calls
   it: a real vertical asymptote ("asym") or a quotient's own
   denominator-root ("gzero" — undefined there, exactly as forbidden as
   an asymptote even though nothing is drawn breaking at it). */
const NEVER_CLOSE = new Set(["asym", "gzero"]);

/* _intervals.js's answerString() only knows "asym" as the never-close
   tag — this maps "gzero" onto it wherever a STRING actually gets
   built, so the shared interval-writing code never needs to learn a
   second name for the same idea. cutSockets/nudges keep "gzero" so the
   missing-boundary message can still name it precisely. */
function forAnswer(cuts) {
  return cuts.map((c) => (NEVER_CLOSE.has(c.why) ? { ...c, why: "asym" } : c));
}
/* re-tag ONE cut (by x) — used to build a decoy that differs from the
   correct answer at exactly one boundary, never a whole different set
   of sections */
function withForcedWhy(cuts, x, why) {
  return cuts.map((c) => (Math.abs(c.x - x) < 1e-6 ? { ...c, why } : c));
}
/* the cuts that actually border the chosen (merged) answer: exactly one
   of the two sections touching them is IN the selection, the other is
   OUT. A cut sitting between two chosen (or two unchosen) sections never
   shows up in the written answer at all, so it can never be the subject
   of an endpoint decoy. */
function boundaryCutsOf(chosen, secs, cuts) {
  const chosenIdx = new Set(chosen.map((s) => s.i));
  return cuts.filter((c) => {
    const li = secs.findIndex((s) => Math.abs(s.x1 - c.x) < 1e-6);
    const ri = secs.findIndex((s) => Math.abs(s.x0 - c.x) < 1e-6);
    const lin = li >= 0 && chosenIdx.has(secs[li].i);
    const rin = ri >= 0 && chosenIdx.has(secs[ri].i);
    return lin !== rin;
  });
}
/* endpoint-discipline options: correct + up to two decoys, EACH
   differing from the correct answer at exactly one boundary's < vs ≤ —
   never a different set of sections (R2/R3's shared decoy shape).
   includeRealOpened=false keeps R2 to its spec exactly: "options differ
   ONLY in < vs ≤ at that one x" (singular — the g-root trap alone). */
function endpointOptions(chosen, secs, cuts, win, lang, includeRealOpened) {
  const bounds = boundaryCutsOf(chosen, secs, cuts);
  const realZero = bounds.find((c) => c.why === "zero");
  const forbidden = bounds.find((c) => NEVER_CLOSE.has(c.why));
  const mapped = forAnswer(cuts);
  const correct = answerString(chosen, mapped, win, { strict: false, lang });
  const wrongs = [];
  if (forbidden) {
    wrongs.push({
      label: answerString(chosen, withForcedWhy(mapped, forbidden.x, "zero"), win, { strict: false, lang }),
      misc: forbidden.why === "gzero" ? GZERO_TRAP_MSG : ASYM_CLOSED_MSG,
    });
  }
  if (includeRealOpened && realZero) {
    wrongs.push({
      label: answerString(chosen, withForcedWhy(mapped, realZero.x, "asym"), win, { strict: false, lang }),
      misc: REAL_OPENED_MSG,
    });
  }
  return { correct, wrongs, forbidden, realZero };
}

/* the open-circle SCAFFOLD (Law 6): a re-render of the exact picture
   already on screen, with one extra open dot at the forbidden x — never
   drawn until a wrong pick asks for it (appended to that option's misc,
   which showFeedback() only ever paints after the wrong tap). */
function scaffoldHtml(tableSpec, x) {
  const marked = { ...tableSpec, points: [...(tableSpec.points || []), { x, y: 0, open: true }] };
  return `<div class="graphbox" style="margin-top:8px">${renderFunction(marked)}</div>`;
}
const withScaffoldOn = (x, tableSpec) => {
  const scaffold = scaffoldHtml(tableSpec, x);
  return (b) => ({ en: b.en + scaffold, af: b.af + scaffold });
};

/* the winning sections, shaded along the x-axis with their numbers
   circled — her ruling: "the answer is read OFF the x-axis". Appended
   onto the LAST solution line of every round type, so the axis
   read-off shows in the feedback panel on every outcome. */
function answerShadeHtml(tableSpec, secsAll, chosen, win) {
  const shades = mergeSections(chosen).map((iv) => ({ x0: iv.x0, x1: iv.x1 }));
  const marked = { ...tableSpec, shades };
  const g = computeFunction(marked);
  const chosenIdx = new Set(chosen.map((s) => s.i));
  const numFrag = secsAll.map((s, i) => {
    const cx = g.X((s.x0 + s.x1) / 2).toFixed(1), cy = (g.Y(win.ymax) + 12).toFixed(1);
    const circleEl = chosenIdx.has(s.i) ? `<circle class="iv-sectcircle" cx="${cx}" cy="${cy}" r="9"/>` : "";
    return `${circleEl}<text class="iv-sectlab${chosenIdx.has(s.i) ? " won" : ""}" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle">${"①②③④⑤⑥⑦⑧"[i] || String(i + 1)}</text>`;
  }).join("");
  const svgHtml = renderFunction(marked).replace("</svg>", numFrag + "</svg>");
  return `<div class="graphbox" style="margin-top:8px">${svgHtml}</div>`;
}
const withAnswerShade = (secsAll, chosen, win, tableSpec) => {
  const html = answerShadeHtml(tableSpec, secsAll, chosen, win);
  return (b) => ({ en: b.en + html, af: b.af + html });
};

/* the two-pass coach line: pass 1 names only the first row, pass 2
   names only the second — each pass promises exactly what it does,
   never the whole result. `letter` is the row's own plain name ("f",
   "x", "g") — coach text is textContent-only (play.js), so no HTML. */
const COACH_LINES_PLACED = B("Lines placed!", "Lyne geplaas!");
const coachPass1 = (letter) => B(
  `Now drag the line across to trace ${letter}'s sign.`,
  `Trek nou die lyn oor om ${letter} se teken te volg.`);
const coachPass2 = (letter) => B(
  `Traced! Now drag again to trace ${letter}'s sign underneath.`,
  `Gevolg! Trek nou weer oor om ${letter} se teken daaronder te volg.`);

/* the shared flow, every qI round: sockets → one or two trailSweep
   passes → unlock. No signPaint, no confirm sweep — her ruling. `rows`
   is trailSweep's own row array (1 or 2 entries; see engine §6.5),
   already wired by the caller to the round's actual curves. */
function buildTrailFlow({ spec, cands, secs, tableSpec, rows, missingWhy, missingMsg }) {
  const requiredIdx = new Set(cands.map((c, i) => (c.need ? i : -1)).filter((i) => i >= 0));
  return (host, done, nudge) => {
    const sockets = cutSockets(host, {
      spec, candidates: cands,
      onChange: (chosen) => {
        const same = chosen.size === requiredIdx.size && [...requiredIdx].every((i) => chosen.has(i));
        if (same) {
          sockets.reveal(requiredIdx);
          nudge(COACH_LINES_PLACED);
          setTimeout(() => {
            trailSweep(host, {
              spec: tableSpec, sections: secs, rows,
              onPassStart: (i, row) => nudge(i === 0 ? coachPass1(row.name) : coachPass2(row.name)),
              onComplete: () => setTimeout(done, 300),
            });
          }, 350);
          return;
        }
        const extra = [...chosen].find((i) => !cands[i].need);
        if (extra != null) { nudge(DECOY_MSG[cands[extra].why] || DECOY_MSG.tp); return; }
        const missing = missingWhy && cands.some((c, i) => c.need && c.why === missingWhy && !chosen.has(i));
        if (missing && chosen.size >= requiredIdx.size - 1) nudge(missingMsg);
        else nudge(B(`Placed ${chosen.size} of ${requiredIdx.size}.`, `${chosen.size} van ${requiredIdx.size} geplaas.`));
      },
    });
    return sockets;
  };
}

/* a TP decoy socket, added the same way quest 5 does — a candidate that
   must NOT get a line, so forgetting to skip it earns the same nudge */
function addTPDecoy(cands, f, win) {
  if (f.kind !== "parabola") return;
  const tpx = paraTP(f).x;
  if (!Number.isFinite(tpx)) return;
  if (tpx <= win.xmin + 0.5 || tpx >= win.xmax - 0.5) return;
  if (cands.some((c) => Math.abs(c.x - tpx) < 0.45)) return;
  cands.push({ x: tpx, why: "tp", need: false });
}

/* R2/R3-quotient share the stacked f(x)/g(x) fraction (her CSS-only
   vinculum, funclib's own frac() — already used for a hyperbola's
   coefficient) and the two-givens-on-separate-lines stem. Both are
   colour-coded to match their sweep rows, matching the fraction. */
const QUOTIENT_FRAC = frac(`<span style="color:${FTONE}">f(x)</span>`, `<span style="color:${GTONE}">g(x)</span>`);
function quotientStem(f, g) {
  const fRhs = eqStr(f, "").replace(/^\s*=\s*/, "");
  const gRhs = eqStr(g, "").replace(/^\s*=\s*/, "");
  return `<span class="eq-line">f(x) = ${fRhs}</span><span class="eq-line">g(x) = ${gRhs}</span>`;
}

/* ---------------- the skills ---------------- */

const SKILLS = {
  /* ---------- R1: x·f(x), quadrant signs — two sweeps, f then x ---------- */
  timesFRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      /* parabola / hyperbola (off-axis) / exp — NO line: a line for f
         would make x·f(x) a familiar two-line quadratic picture, not
         the curve-plus-y-axis picture her reteach spec draws */
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp()]);
      const cutsFn = (w) => {
        const fCuts = criticalXs([f], w.xmin, w.xmax);
        if (!fCuts.length || fCuts.some((c) => Math.abs(c.x) < 1.0)) return null;   // keep the y-axis cut clean of crowding
        return [...fCuts, { x: 0, why: "yaxis" }].sort((a, b) => a.x - b.x);
      };
      const wr = windowForRound([f], cutsFn);
      if (!wr) continue;
      const { win, cuts } = wr;
      if (!mostlyInFrame(f, win)) continue;

      const cands = cuts.map((c) => ({ x: c.x, why: c.why, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const spec = specFor([f], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);

      const wantNeg = pick([true, false]);
      const strict = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => {
        const xs = s.mid < 0 ? -1 : 1;
        const p = xs * signAt(f, s.mid);
        return wantNeg ? p < 0 : p > 0;
      });
      if (!chosen.length || chosen.length === secs.length) continue;

      const correct = answerString(chosen, cuts, win, { strict, lang });
      /* when the chosen selection is a ray bounded ONLY by an asymptote
         (f's own zero happened to land exactly on the y-axis, merging
         the two boundaries down to one) flipping strict changes nothing
         — that boundary forces open either way — so flipStrictString
         would silently collide with correct and mc()'s de-dupe would
         ship only 3 options. Reject and redraw rather than ship a round
         one decoy short. */
      if (flipStrictString(chosen, cuts, win, { strict, lang }) === correct) continue;
      const wrongs = [
        { label: complementString(chosen, secs, cuts, win, { strict, lang }),
          misc: wantNeg
            ? B("Those are the sections where x and f(x) share a sign — quadrant 1 or 3, x·f(x) is positive there.",
                "Daai is die afdelings waar x en f(x) dieselfde teken deel — kwadrant 1 of 3, x·f(x) is positief daar.")
            : B("Those are the sections where x and f(x) have different signs — quadrant 2 or 4, x·f(x) is negative there.",
                "Daai is die afdelings waar x en f(x) verskillende tekens het — kwadrant 2 of 4, x·f(x) is negatief daar.") },
        { label: flipStrictString(chosen, cuts, win, { strict, lang }),
          misc: strict
            ? B("A strict inequality never includes the boundaries.", "'n Streng ongelykheid sluit nooit die grense in nie.")
            : B("≤ and ≥ DO include the x-intercepts — the y-axis boundary closes the same way, it is a real zero, not an asymptote.",
                "≤ en ≥ sluit WEL die x-afsnitte in — die y-as grens maak net so toe, dis 'n regte nulpunt, nie 'n asimptoot nie.") },
        { label: asYString(correct),
          misc: B("The answer must be x-values, not y.", "Die antwoord moet x-waardes wees, nie y nie.") },
      ];
      const sym = wantNeg ? (strict ? "&lt; 0" : "≤ 0") : (strict ? "&gt; 0" : "≥ 0");
      const xSpan = `<span style="color:${XTONE}">x</span>`;
      const fSpan = `<span style="color:${FTONE}">f(x)</span>`;
      const rows = [
        { tone: FTONE, name: "f", sign: (x) => signAt(f, x), anchorCurve: 0 },
        { tone: XTONE, name: "x", sign: (x) => (x < 0 ? -1 : x > 0 ? 1 : 0), stackFrom: 0 },
      ];

      const built = iq({
        concept: "inequal2", kind: "trailSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>${xSpan}·${fSpan} ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>${xSpan}·${fSpan} ${sym}</span>?`),
        stem: `<span class="eq">${eqStr(f, "f(x)")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — every x-intercept and asymptote of f, and the y-axis too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit en asimptoot van f, en ook die y-as."),
        hints: [
          B("x is negative left of the y-axis and positive right of it — that row needs a line at x = 0 too.",
            "x is negatief links van die y-as en positief regs daarvan — daai ry het ook 'n lyn nodig by x = 0."),
          B("Drag the line across and watch both signs — same signs → +, different signs → − (quadrant 1/3 versus 2/4).",
            "Trek die lyn oor en kyk na albei tekens — dieselfde tekens → +, verskillende tekens → − (kwadrant 1/3 teenoor 2/4)."),
        ],
        build: buildTrailFlow({
          spec, cands, secs, tableSpec, rows, missingWhy: "yaxis", missingMsg: MISSING_MSG.yaxis,
        }),
        then: mc("inequal2",
          B("Read the answer off the trail you just swept.", "Lees die antwoord van die spoor wat jy pas deurgeskuif het."),
          correct, wrongs,
          { answerLabel: correct,
            solution: [
              B("1. A line at every x-intercept/asymptote of f, AND at the y-axis (where x itself changes sign).",
                "1. 'n Lyn by elke x-afsnit/asimptoot van f, EN by die y-as (waar x self van teken verander)."),
              B("2. Drag the line across for f's sign. Drag it again for x's sign, underneath.",
                "2. Trek die lyn oor vir f se teken. Trek dit weer oor vir x se teken, daaronder."),
              B("3. Same signs on both rows → +. Different signs → − (quadrant 1/3 versus 2/4).",
                "3. Dieselfde tekens op albei rye → +. Verskillende tekens → − (kwadrant 1/3 teenoor 2/4)."),
              withAnswerShade(secs, chosen, win, tableSpec)(
                B("4. Read the answer off the highlighted sections, left to right.",
                  "4. Lees die antwoord van die uitgeligte afdelings af, links na regs.")),
            ],
            hint: B("Compare x's sign with f's sign as the line crosses each cut.",
                    "Vergelyk x se teken met f se teken soos die lyn elke snylyn kruis.") }),
      });
      built.debugTimesF = { f, win, cuts, secs, cands, wantNeg, strict };
      built.graph = tableSpec;
      return built;
    }
    throw new Error("qI timesF: no honest window fits any draw");
  },

  /* ---------- R2: f/g, the open circle — two sweeps, f then g ---------- */
  quotientOpenRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randExp()]);      // no asymptote of its own — g's root stays the ONE forbidden x
      const g = randLine();
      const gRoot = lineXInt(g);
      const cutsFn = (w) => {
        if (gRoot == null || gRoot <= w.xmin + 0.5 || gRoot >= w.xmax - 0.5) return null;
        const fZeros = xIntercepts(f, w.xmin, w.xmax);
        if (!fZeros.length) return null;
        if (fZeros.some((x) => Math.abs(x - gRoot) < 0.5)) return null;   // keep the trap distinct from a real f-zero
        return [...fZeros.map((x) => ({ x, why: "zero" })), { x: gRoot, why: "gzero" }].sort((a, b) => a.x - b.x);
      };
      const wr = windowForRound([f, g], cutsFn);
      if (!wr) continue;
      const { win, cuts } = wr;
      if (!mostlyInFrame(f, win) || !mostlyInFrame(g, win)) continue;

      const cands = cuts.map((c) => ({ ...c, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);

      const wantNeg = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => {
        const p = signAt(f, s.mid) * signAt(g, s.mid);
        return wantNeg ? p < 0 : p > 0;
      });
      if (!chosen.length || chosen.length === secs.length) continue;

      const opts = endpointOptions(chosen, secs, cuts, win, lang, false);
      if (!opts.forbidden) continue;      // gRoot always borders the answer by construction — defensive only

      const sym = wantNeg ? "≤ 0" : "≥ 0";
      const withScaffold = withScaffoldOn(opts.forbidden.x, tableSpec);
      const rows = [
        { tone: FTONE, name: "f", sign: (x) => signAt(f, x), anchorCurve: 0 },
        { tone: GTONE, name: "g", sign: (x) => signAt(g, x), anchorCurve: 1 },
      ];

      const built = iq({
        concept: "inequal2", kind: "trailSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>${QUOTIENT_FRAC} ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>${QUOTIENT_FRAC} ${sym}</span>?`),
        stem: quotientStem(f, g),
        coach: B("Step 1: tap on every place that needs a line — every x-intercept of f, and g's own x-intercept too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit van f, en ook g se eie x-afsnit."),
        hints: [
          B("Trace it exactly as f·g, section by section — same signs +, different signs −.",
            "Volg dit presies soos f·g, afdeling vir afdeling — dieselfde tekens +, verskillende tekens −."),
          B("At g's own x-intercept, f/g is undefined — you cannot divide by zero, so that x can never close.",
            "By g se eie x-afsnit is f/g onbepaald — jy kan nie deur nul deel nie, so daardie x kan nooit toemaak nie."),
        ],
        build: buildTrailFlow({
          spec, cands, secs, tableSpec, rows, missingWhy: "gzero", missingMsg: MISSING_MSG.gzero,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every x-intercept of f, and at g's own x-intercept.",
                "1. 'n Lyn by elke x-afsnit van f, en by g se eie x-afsnit."),
              B("2. Drag the line across for f's sign. Drag it again for g's sign, exactly as for f·g.",
                "2. Trek die lyn oor vir f se teken. Trek dit weer oor vir g se teken, presies soos vir f·g."),
              B("3. Read the sections off — but at g's own x-intercept, f/g is undefined, so that x NEVER closes, even with ≤ or ≥.",
                "3. Lees die afdelings af — maar by g se eie x-afsnit is f/g onbepaald, so daardie x maak NOOIT toe nie, selfs met ≤ of ≥."),
              withAnswerShade(secs, chosen, win, tableSpec)(
                B("4. Read the answer off the highlighted sections, left to right.",
                  "4. Lees die antwoord van die uitgeligte afdelings af, links na regs.")),
            ],
            hint: B("Every real x-intercept of f can close. g's own x-intercept never can — division by zero.",
                    "Elke regte x-afsnit van f kan toemaak. g se eie x-afsnit kan nooit nie — deling deur nul.") }),
      });
      built.debugQuotient = { f, g, win, cuts, secs, cands, wantNeg, gRoot: opts.forbidden.x };
      built.graph = tableSpec;
      return built;
    }
    throw new Error("qI quotientOpen: no honest window fits any draw");
  },

  /* ---------- R3a: endpoint discipline, single curve — ONE sweep ---------- */
  singleEndpointRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp()]);
      const cutsFn = (w) => {
        const cuts = criticalXs([f], w.xmin, w.xmax);
        return cuts.length ? cuts : null;
      };
      const wr = windowForRound([f], cutsFn);
      if (!wr) continue;
      const { win, cuts } = wr;
      if (!mostlyInFrame(f, win)) continue;

      const cands = cuts.map((c) => ({ x: c.x, why: c.why, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const spec = specFor([f], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);

      const wantNeg = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => (wantNeg ? signAt(f, s.mid) < 0 : signAt(f, s.mid) > 0));
      if (!chosen.length || chosen.length === secs.length) continue;

      const opts = endpointOptions(chosen, secs, cuts, win, lang, true);
      if (!opts.realZero || !opts.wrongs.length) continue;

      const sym = wantNeg ? "≤ 0" : "≥ 0";
      const withScaffold = opts.forbidden ? withScaffoldOn(opts.forbidden.x, tableSpec) : (b) => b;
      const rows = [{ tone: FTONE, name: "f", sign: (x) => signAt(f, x), anchorCurve: 0 }];

      const built = iq({
        concept: "inequal2", kind: "trailSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>f(x) ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>f(x) ${sym}</span>?`),
        stem: `<span class="eq">${eqStr(f, "f(x)")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — every x-intercept and asymptote.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit en asimptoot."),
        hints: [
          B("Trace + and − on f, then read your own trail off.",
            "Volg + en − op f, en lees dan jou eie spoor af."),
          B("A real x-intercept CAN close under ≤ or ≥. An asymptote never can — the graph never actually reaches it.",
            "'n Regte x-afsnit KAN toemaak onder ≤ of ≥. 'n Asimptoot kan nooit nie — die grafiek bereik dit nooit werklik nie."),
        ],
        build: buildTrailFlow({
          spec, cands, secs, tableSpec, rows, missingWhy: null, missingMsg: null,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every x-intercept and asymptote.", "1. 'n Lyn by elke x-afsnit en asimptoot."),
              B("2. Drag the line across once: f's sign, section by section.", "2. Trek die lyn een keer oor: f se teken, afdeling vir afdeling."),
              B("3. A real x-intercept can close (≤/≥). An asymptote never can.",
                "3. 'n Regte x-afsnit kan toemaak (≤/≥). 'n Asimptoot kan nooit nie."),
              withAnswerShade(secs, chosen, win, tableSpec)(
                B("4. Read the answer off the highlighted sections, left to right.",
                  "4. Lees die antwoord van die uitgeligte afdelings af, links na regs.")),
            ],
            hint: B("Which of your cut lines sit on a real point of the graph, and which sit on an asymptote?",
                    "Watter van jou snylyne sit op 'n regte punt van die grafiek, en watter op 'n asimptoot?") }),
      });
      built.debugEndpoint = { mode: "single", f, win, cuts, secs, cands, wantNeg };
      built.graph = tableSpec;
      return built;
    }
    throw new Error("qI endpointSingle: no honest window fits any draw");
  },

  /* ---------- R3b: endpoint discipline, quotient — two sweeps, f then g ---------- */
  quotientEndpointRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp()]);
      const g = randLine();
      const gRoot = lineXInt(g);
      const cutsFn = (w) => {
        if (gRoot == null || gRoot <= w.xmin + 0.5 || gRoot >= w.xmax - 0.5) return null;
        const fZeros = xIntercepts(f, w.xmin, w.xmax);
        const fAsym = vAsymptotes(f).filter((x) => x > w.xmin + 0.5 && x < w.xmax - 0.5);
        if (!fZeros.length && !fAsym.length) return null;
        if ([...fZeros, ...fAsym].some((x) => Math.abs(x - gRoot) < 0.5)) return null;
        return [
          ...fZeros.map((x) => ({ x, why: "zero" })),
          ...fAsym.map((x) => ({ x, why: "asym" })),
          { x: gRoot, why: "gzero" },
        ].sort((a, b) => a.x - b.x);
      };
      const wr = windowForRound([f, g], cutsFn);
      if (!wr) continue;
      const { win, cuts } = wr;
      if (!mostlyInFrame(f, win) || !mostlyInFrame(g, win)) continue;

      const cands = cuts.map((c) => ({ ...c, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);

      const wantNeg = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => {
        const p = signAt(f, s.mid) * signAt(g, s.mid);
        return wantNeg ? p < 0 : p > 0;
      });
      if (!chosen.length || chosen.length === secs.length) continue;

      const opts = endpointOptions(chosen, secs, cuts, win, lang, true);
      if (!opts.realZero || !opts.wrongs.length) continue;

      const sym = wantNeg ? "≤ 0" : "≥ 0";
      const withScaffold = opts.forbidden ? withScaffoldOn(opts.forbidden.x, tableSpec) : (b) => b;
      const rows = [
        { tone: FTONE, name: "f", sign: (x) => signAt(f, x), anchorCurve: 0 },
        { tone: GTONE, name: "g", sign: (x) => signAt(g, x), anchorCurve: 1 },
      ];

      const built = iq({
        concept: "inequal2", kind: "trailSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>${QUOTIENT_FRAC} ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>${QUOTIENT_FRAC} ${sym}</span>?`),
        stem: quotientStem(f, g),
        coach: B("Step 1: tap on every place that needs a line — f's own x-intercepts and asymptotes, and g's x-intercept too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — f se eie x-afsnitte en asimptote, en ook g se x-afsnit."),
        hints: [
          B("Trace it exactly as f·g, section by section.", "Volg dit presies soos f·g, afdeling vir afdeling."),
          B("A real x-intercept of f can close. f's own asymptote and g's own x-intercept never can.",
            "'n Regte x-afsnit van f kan toemaak. f se eie asimptoot en g se eie x-afsnit kan nooit nie."),
        ],
        build: buildTrailFlow({
          spec, cands, secs, tableSpec, rows, missingWhy: "gzero", missingMsg: MISSING_MSG.gzero,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every boundary: f's x-intercepts/asymptote, and g's x-intercept.",
                "1. 'n Lyn by elke grens: f se x-afsnitte/asimptoot, en g se x-afsnit."),
              B("2. Drag the line across for f's sign. Drag it again for g's sign.", "2. Trek die lyn oor vir f se teken. Trek dit weer oor vir g se teken."),
              B("3. Only a real x-intercept of f can close. An asymptote or g's own x-intercept never can.",
                "3. Net 'n regte x-afsnit van f kan toemaak. 'n Asimptoot of g se eie x-afsnit kan nooit nie."),
              withAnswerShade(secs, chosen, win, tableSpec)(
                B("4. Read the answer off the highlighted sections, left to right.",
                  "4. Lees die antwoord van die uitgeligte afdelings af, links na regs.")),
            ],
            hint: B("Which boundary is a real point on f, and which is an asymptote or g's own zero?",
                    "Watter grens is 'n regte punt op f, en watter is 'n asimptoot of g se eie nulpunt?") }),
      });
      built.debugEndpoint = { mode: "quotient", f, g, win, cuts, secs, cands, wantNeg };
      built.graph = tableSpec;
      return built;
    }
    throw new Error("qI endpointQuotient: no honest window fits any draw");
  },
};

/* R3 mixes both shapes — richer than R2, which stays a single clean
   trap; a quotient round here may draw a hyperbola for f, carrying BOTH
   a real asymptote AND a g-root in the same picture. */
function endpointRound() {
  return pick([SKILLS.singleEndpointRound, SKILLS.quotientEndpointRound])();
}

/* ---------------- the quest + intro ---------------- */

export const questInequal2 = quest("qI",
  B("Inequalities 2", "Ongelykhede 2"),
  B("x·f(x), f/g and which endpoints can close", "x·f(x), f/g en watter grense kan toemaak"),
  [
    { id: "timesF", concept: "inequal2", gen: SKILLS.timesFRound, weight: 2 },
    { id: "quotientOpen", concept: "inequal2", gen: SKILLS.quotientOpenRound, weight: 2 },
    { id: "endpoint", concept: "inequal2", gen: endpointRound, weight: 2 },
  ],
  { rounds: 6, accent: ACC });

/* worked example, once, at module load: x·f(x) > 0 for a happy parabola
   with roots at −3 and 1 — the SAME picture as R1 (f alone — no y = x
   line, ever), walking the four steps in her exact order: lines, number
   the sections, sweep f's row, sweep x's row underneath, read off. */
function buildIntro() {
  const f = parabolaFromRoots(1, -3, 1);
  const win = windowFor([f]);
  const base = specFor([f], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  const lined = { ...base, vlines: [{ x: -3 }, { x: 0 }, { x: 1 }] };
  const g = computeFunction(base);
  const mids = [(win.xmin - 3) / 2, -1.5, 0.5, (win.xmax + 1) / 2];
  const numFrag = mids.map((m, i) =>
    `<text class="iv-sectlab" x="${g.X(m).toFixed(1)}" y="${(g.Y(win.ymax) + 12).toFixed(1)}" text-anchor="middle">${"①②③④"[i]}</text>`).join("");
  const fSigns = ["+", "−", "−", "+"];
  const xSigns = ["−", "−", "+", "+"];
  const fFn = makeFn(f);
  /* both rows ride f's own curve — x's row one step further out, same
     direction — exactly trailSweep's `stackFrom` convention, so the
     lesson looks the same in the intro as it plays in the round.
     Clamped clear of the frame edges AND the ①②③④ number row (the
     same clamp lesson q5's and qI's own intro needed on fix day). */
  function markFrag(signs, depth) {
    return mids.map((m, i) => {
      const y = fFn(m);
      const dir = y >= 0 ? -1 : 1;
      const rawPy = g.Y(Math.max(win.ymin + 1, Math.min(win.ymax - 1, y))) + dir * 17 * depth;
      const py = Math.max(g.Y(win.ymax) + 30, Math.min(g.Y(win.ymin) - 14, rawPy));
      const s = signs[i];
      return `<text class="iv-sign ${s === "+" ? "plus" : "minus"}" x="${g.X(m).toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle">${s}</text>`;
    }).join("");
  }
  const fFrag = markFrag(fSigns, 1);
  const xFrag = markFrag(xSigns, 2);
  return { beats: [
    { spec: base, cap: B("The question: for which values of x is <span class='eq'>x·f(x) &gt; 0</span>?",
                         "Die vraag: vir watter waardes van x is <span class='eq'>x·f(x) &gt; 0</span>?") },
    { spec: lined, cap: B("Step 1: a line through every x-intercept of f — AND through the y-axis, where x itself changes sign.",
                          "Stap 1: 'n lyn deur elke x-afsnit van f — EN deur die y-as, waar x self van teken verander.") },
    { spec: lined, frag: numFrag,
      cap: B("Step 2: number the sections, left to right.", "Stap 2: nommer die afdelings, links na regs.") },
    { spec: lined, frag: numFrag + fFrag,
      cap: B("Step 3: drag the line across once, left to right — f's sign lays down first.",
             "Stap 3: trek die lyn een keer oor, links na regs — f se teken lê eerste neer.") },
    { spec: lined, frag: numFrag + fFrag + xFrag,
      cap: B("Step 4: drag the line across again — x's sign lays down underneath. x is negative left of 0, positive right of it.",
             "Stap 4: trek die lyn weer oor — x se teken lê onder neer. x is negatief links van 0, positief regs daarvan.") },
    { spec: { ...lined, shades: [{ x0: -3, x1: 0 }, { x0: 1, x1: win.xmax }] }, frag: numFrag + fFrag + xFrag,
      cap: B("Step 5: same signs on both rows → +. Read it off: <b class=\"eq\">−3 &lt; x &lt; 0 or x &gt; 1</b>.",
             "Stap 5: dieselfde tekens op albei rye → +. Lees dit af: <b class=\"eq\">−3 &lt; x &lt; 0 of x &gt; 1</b>.") },
  ] };
}
questInequal2.intro = buildIntro();
