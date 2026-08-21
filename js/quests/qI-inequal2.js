/* ============================================================
   QUEST I · ONGELYKHEDE 2 — x·f(x), f/g and which endpoints close
   ★ batch 3, session 3
   ------------------------------------------------------------
   Design: GQ-BATCH3-DESIGN.md § "Quest: Ongelykhede 2". The two
   inequality variants quest 5/6 do not cover, on her full board method
   — and the sockets return (RUN-PLAN's original kickoff (b)): the
   learner places EVERY cut line themselves again, like quest 5, not
   pre-drawn like quest 6's Round D.

   Three round types, all sharing ONE flow (her four-step method, in
   full, for the first time in one round): place the cut lines
   (cutSockets) → paint + and − on each row (signPaint) → slide the
   scan line left to right to confirm (sweep) → read off. Quest 5 stops
   after painting; quest 6 pre-draws its lines and skips straight to
   stamping — this is the first round to chain all three mechanics in
   her exact order. No new engine code anywhere in this file.

     R1  x·f(x), quadrant signs (Law 5). "x" is drawn as the straight
         line y = x — its own sign IS the sign of x, so painting its
         row is literally the same signPaint mechanic as f's row, and
         its own x-intercept sits exactly at x = 0: the y-axis boundary
         a learner must remember falls straight out of the picture
         instead of needing a special case. Forgetting that socket is
         THE teaching moment (Law 5's "quadrant signs" — same signs =
         quadrant 1/3, different = quadrant 2/4).
     R2  f/g, the open circle. Painted exactly as f·g (same signs +,
         different −); the one difference is at g's own root, which
         NEVER closes — division by zero. Options differ ONLY in
         < vs ≤ at that one x (her spec, verbatim); the open circle is
         drawn as a scaffold, hidden by default, shown only after a
         wrong pick (Law 6).
     R3  endpoint discipline, mixed. The same lesson as R2, generalised:
         a real x-intercept of f can always close; an asymptote or a
         quotient's g-root never can. Half the time a single curve
         (parabola/hyperbola/exp, no g at all); half the time a
         quotient (richer than R2 — f may be a hyperbola too, so a
         round can carry BOTH kinds of forbidden boundary at once).

   Kiss-stop lesson (PROJECT-STATUS, carried into this brief): NONE of
   these rounds compare two DRAWN curves for a tangency — R1's second
   curve is the fixed line y = x (never tangent to anything but its own
   axis-crossing), R2/R3's quotient rounds only ever look at each
   curve's OWN zeros/asymptotes, never an f-vs-g intersection. The
   sign-change blind spot that bit qK's y = k slider does not apply
   here; nothing in this file calls intersections().
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { B, getLang } from "../i18n.js";
import { cutSockets, signPaint, sweep } from "../engine/interactive.js";
import { renderFunction, computeFunction } from "../engine/function-graph.js";
import {
  specFor, randParabola, randLine, randHyperbolaOffAxis, randExp,
  windowFor, mostlyInFrame,
} from "./_graphs.js";
import {
  criticalXs, sections, signAt, xIntercepts, vAsymptotes, lineXInt,
  paraTP, parabolaFromRoots, eqStr, pick, makeFn,
} from "../funclib.js";
import { answerString, complementString, flipStrictString, asYString } from "./_intervals.js";

const ACC = "#f87171";

/* ---------------- shared helpers ---------------- */

/* signPaint only mounts a paint box where a curve's section-midpoint lies
   INSIDE the window — same guard quest 5 needs (fix day, 2026-08-14),
   copied here rather than exported since each quest file owns its own
   generator-side safety net. */
function paintable(curvesArr, secs, win) {
  return curvesArr.every((cv) => {
    const f = makeFn(cv);
    return secs.some((s) => {
      const y = f(s.mid);
      return Number.isFinite(y) && y >= win.ymin && y <= win.ymax;
    });
  });
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

/* re-paint the finished marks onto the fresh svg sweep() just mounted
   (sweep()'s own mount() replaces host.innerHTML, wiping signPaint's
   marks — her board method reads the answer OFF the painting, so it
   must survive; the exact offset formula signPaint itself uses, so a
   redrawn mark lands exactly where the original paint box sat). */
function redrawMarks(svg, geo, curvesArr, curveIdx, secs, state) {
  const SPREAD = 26;
  curveIdx.forEach((ci, cidx) => {
    const f = makeFn(curvesArr[ci]);
    const xOffset = curveIdx.length > 1 ? (cidx - (curveIdx.length - 1) / 2) * SPREAD : 0;
    secs.forEach((s, si) => {
      const v = state[ci] && state[ci][si];
      if (!v) return;
      const y = f(s.mid);
      if (!Number.isFinite(y)) return;
      const px = geo.X(s.mid) + xOffset;
      const py = geo.Y(y) + (y >= 0 ? -17 : 17);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("class", "iv-sign " + (v === 1 ? "plus" : "minus"));
      t.setAttribute("x", px.toFixed(1));
      t.setAttribute("y", py.toFixed(1));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dominant-baseline", "middle");
      t.textContent = v === 1 ? "+" : "−";
      svg.appendChild(t);
    });
  });
}

const COACH_PAINT = B("Lines placed! Now mark + and − on each row.", "Lyne geplaas! Merk nou + en − op elke ry.");
const COACH_SLIDE = B("Marked! Now slide the scan line left to right to check.",
                      "Gemerk! Skuif nou die skandeerlyn links na regs om te toets.");

/* the shared four-step flow: sockets -> paint -> slide -> unlock the
   read-off. opts: { spec, cands, secs, curveIdx, names, tableSpec,
   curvesArr, missingWhy, missingMsg } — missingWhy/missingMsg name ONE
   specific required cut when it is the only thing still missing
   (R1's y-axis, R2/R3's g-root); pass null/null for a round with no
   single boundary worth calling out by name (R3's single-curve half). */
function buildFlow({ spec, cands, secs, curveIdx, names, tableSpec, curvesArr, missingWhy, missingMsg }) {
  const requiredIdx = new Set(cands.map((c, i) => (c.need ? i : -1)).filter((i) => i >= 0));
  const truth = {};
  curveIdx.forEach((ci) => {
    truth[ci] = {};
    secs.forEach((s, si) => { truth[ci][si] = signAt(curvesArr[ci], s.mid); });
  });
  return (host, done, nudge) => {
    const sockets = cutSockets(host, {
      spec, candidates: cands,
      onChange: (chosen) => {
        const same = chosen.size === requiredIdx.size && [...requiredIdx].every((i) => chosen.has(i));
        if (same) {
          sockets.reveal(requiredIdx);
          nudge(COACH_PAINT);
          setTimeout(() => {
            let painter;
            painter = signPaint(host, {
              spec: tableSpec, sections: secs, curves: curveIdx, names,
              onChange: (state, allMarked) => {
                if (allMarked && painter) {
                  painter.reveal(truth);
                  nudge(COACH_SLIDE);
                  const finalState = painter.state();
                  setTimeout(() => startSlide(finalState), 400);
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
        if (extra != null) { nudge(DECOY_MSG[cands[extra].why] || DECOY_MSG.tp); return; }
        const missing = missingWhy && cands.some((c, i) => c.need && c.why === missingWhy && !chosen.has(i));
        if (missing && chosen.size >= requiredIdx.size - 1) nudge(missingMsg);
        else nudge(B(`Placed ${chosen.size} of ${requiredIdx.size}.`, `${chosen.size} van ${requiredIdx.size} geplaas.`));
      },
    });
    function startSlide(finalState) {
      let finished = false;
      sweep(host, {
        spec: tableSpec, sections: secs, plain: true, open: true,
        onEnter: (sec, i) => {
          if (finished || i < secs.length - 1) return;
          finished = true;
          setTimeout(done, 300);
        },
      });
      const svg = host.querySelector("svg");
      const geo = computeFunction(tableSpec);
      redrawMarks(svg, geo, curvesArr, curveIdx, secs, finalState);
    }
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

/* ---------------- the skills ---------------- */

const SKILLS = {
  /* ---------- R1: x·f(x), quadrant signs ---------- */
  timesFRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const xLine = { kind: "line", a: 1, q: 0 };
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp(), randLine()]);
      if (f.kind === "line" && f.a === 1 && f.q === 0) continue;   // f would BE the x-line itself
      const win = windowFor([f, xLine]);
      if (!win) continue;
      if (!mostlyInFrame(f, win) || !mostlyInFrame(xLine, win)) continue;
      const spec = specFor([f, xLine], { win, accent: ACC, ticks: "labels", labels: ["f", "x"], asymLabels: true });
      const cuts = criticalXs([f, xLine], win.xmin, win.xmax);
      if (cuts.length < 2) continue;
      const cands = cuts.map((c) => ({ x: c.x, why: Math.abs(c.x) < 1e-6 ? "yaxis" : c.why, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);
      if (!paintable([f, xLine], secs, win)) continue;

      const wantNeg = pick([true, false]);
      const strict = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => {
        const p = signAt(xLine, s.mid) * signAt(f, s.mid);
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

      const built = iq({
        concept: "inequal2", kind: "cutPaintSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>x·f(x) ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>x·f(x) ${sym}</span>?`),
        stem: `<span class="eq">${eqStr(f, "f(x)")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — every x-intercept and asymptote of f, and the y-axis too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit en asimptoot van f, en ook die y-as."),
        hints: [
          B("x is negative left of the y-axis and positive right of it — that row needs a line at x = 0 too.",
            "x is negatief links van die y-as en positief regs daarvan — daai ry het ook 'n lyn nodig by x = 0."),
          B("Then compare the two rows: same signs → +, different signs → − (quadrant 1/3 versus 2/4).",
            "Vergelyk dan die twee rye: dieselfde tekens → +, verskillende tekens → − (kwadrant 1/3 teenoor 2/4)."),
        ],
        build: buildFlow({
          spec, cands, secs, curveIdx: [0, 1], names: ["f", "x"], tableSpec, curvesArr: [f, xLine],
          missingWhy: "yaxis", missingMsg: MISSING_MSG.yaxis,
        }),
        then: mc("inequal2",
          B("Read the answer off both rows.", "Lees die antwoord van albei rye af."),
          correct, wrongs,
          { answerLabel: correct,
            solution: [
              B("1. A line at every x-intercept/asymptote of f, AND at the y-axis (where x itself changes sign).",
                "1. 'n Lyn by elke x-afsnit/asimptoot van f, EN by die y-as (waar x self van teken verander)."),
              B("2. Mark each row: x's row (left −, right +) and f's row (above the x-axis +, below −).",
                "2. Merk elke ry: x se ry (links − · regs +) en f se ry (bo die x-as + · onder −)."),
              B("3. Same signs on both rows → +. Different signs → − (quadrant 1/3 versus 2/4).",
                "3. Dieselfde tekens op albei rye → +. Verskillende tekens → − (kwadrant 1/3 teenoor 2/4)."),
              B("4. Read the answer off the matching sections, left to right.",
                "4. Lees die antwoord van die ooreenstemmende afdelings af, links na regs."),
            ],
            hint: B("Compare x's row with f's row, section by section.", "Vergelyk x se ry met f se ry, afdeling vir afdeling.") }),
      });
      built.debugTimesF = { f, xLine, win, cuts, secs, cands, wantNeg, strict };
      built.graph = tableSpec;
      return built;
    }
    throw new Error("qI timesF: no honest window fits any draw");
  },

  /* ---------- R2: f/g, the open circle ---------- */
  quotientOpenRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randExp()]);      // no asymptote of its own — g's root stays the ONE forbidden x
      const g = randLine();
      const gRoot = lineXInt(g);
      const win = windowFor([f, g]);
      if (!win) continue;
      if (!mostlyInFrame(f, win) || !mostlyInFrame(g, win)) continue;
      if (gRoot == null || gRoot <= win.xmin + 0.5 || gRoot >= win.xmax - 0.5) continue;
      const fZerosRaw = xIntercepts(f, win.xmin, win.xmax);
      if (!fZerosRaw.length) continue;
      if (fZerosRaw.some((x) => Math.abs(x - gRoot) < 0.5)) continue;   // keep the trap distinct from a real f-zero

      const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
      const cuts = [...fZerosRaw.map((x) => ({ x, why: "zero" })), { x: gRoot, why: "gzero" }].sort((a, b) => a.x - b.x);
      const cands = cuts.map((c) => ({ ...c, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);
      if (!paintable([f, g], secs, win)) continue;

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

      const built = iq({
        concept: "inequal2", kind: "cutPaintSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>f(x)/g(x) ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>f(x)/g(x) ${sym}</span>?`),
        stem: `<span class="eq">f(x) = ${eqStr(f, "").replace(/^\s*=\s*/, "")}</span> &nbsp;·&nbsp; <span class="eq">g(x) = ${eqStr(g, "").replace(/^\s*=\s*/, "")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — every x-intercept of f, and g's own x-intercept too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit van f, en ook g se eie x-afsnit."),
        hints: [
          B("Paint it exactly as f·g, section by section — same signs +, different signs −.",
            "Merk dit presies soos f·g, afdeling vir afdeling — dieselfde tekens +, verskillende tekens −."),
          B("At g's own x-intercept, f/g is undefined — you cannot divide by zero, so that x can never close.",
            "By g se eie x-afsnit is f/g onbepaald — jy kan nie deur nul deel nie, so daardie x kan nooit toemaak nie."),
        ],
        build: buildFlow({
          spec, cands, secs, curveIdx: [0, 1], names: ["f", "g"], tableSpec, curvesArr: [f, g],
          missingWhy: "gzero", missingMsg: MISSING_MSG.gzero,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every x-intercept of f, and at g's own x-intercept.",
                "1. 'n Lyn by elke x-afsnit van f, en by g se eie x-afsnit."),
              B("2. Paint f's row and g's row, section by section, exactly as for f·g.",
                "2. Merk f se ry en g se ry, afdeling vir afdeling, presies soos vir f·g."),
              B("3. Read the sections off — but at g's own x-intercept, f/g is undefined, so that x NEVER closes, even with ≤ or ≥.",
                "3. Lees die afdelings af — maar by g se eie x-afsnit is f/g onbepaald, so daardie x maak NOOIT toe nie, selfs met ≤ of ≥."),
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

  /* ---------- R3a: endpoint discipline, single curve ---------- */
  singleEndpointRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp()]);
      const win = windowFor([f]);
      if (!win) continue;
      if (!mostlyInFrame(f, win)) continue;
      const spec = specFor([f], { win, accent: ACC, ticks: "labels", labels: ["f"], asymLabels: true });
      const cuts = criticalXs([f], win.xmin, win.xmax);
      if (!cuts.length) continue;
      const cands = cuts.map((c) => ({ x: c.x, why: c.why, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);
      if (!paintable([f], secs, win)) continue;

      const wantNeg = pick([true, false]);
      const lang = getLang();
      const chosen = secs.filter((s) => (wantNeg ? signAt(f, s.mid) < 0 : signAt(f, s.mid) > 0));
      if (!chosen.length || chosen.length === secs.length) continue;

      const opts = endpointOptions(chosen, secs, cuts, win, lang, true);
      if (!opts.realZero || !opts.wrongs.length) continue;

      const sym = wantNeg ? "≤ 0" : "≥ 0";
      const withScaffold = opts.forbidden ? withScaffoldOn(opts.forbidden.x, tableSpec) : (b) => b;

      const built = iq({
        concept: "inequal2", kind: "cutPaintSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>f(x) ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>f(x) ${sym}</span>?`),
        stem: `<span class="eq">${eqStr(f, "f(x)")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — every x-intercept and asymptote.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — elke x-afsnit en asimptoot."),
        hints: [
          B("Mark + and − on f, section by section, then read your own marks off.",
            "Merk + en − op f, afdeling vir afdeling, en lees dan jou eie merke af."),
          B("A real x-intercept CAN close under ≤ or ≥. An asymptote never can — the graph never actually reaches it.",
            "'n Regte x-afsnit KAN toemaak onder ≤ of ≥. 'n Asimptoot kan nooit nie — die grafiek bereik dit nooit werklik nie."),
        ],
        build: buildFlow({
          spec, cands, secs, curveIdx: [0], names: ["f"], tableSpec, curvesArr: [f],
          missingWhy: null, missingMsg: null,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every x-intercept and asymptote.", "1. 'n Lyn by elke x-afsnit en asimptoot."),
              B("2. Mark + and − on f, section by section.", "2. Merk + en − op f, afdeling vir afdeling."),
              B("3. A real x-intercept can close (≤/≥). An asymptote never can.",
                "3. 'n Regte x-afsnit kan toemaak (≤/≥). 'n Asimptoot kan nooit nie."),
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

  /* ---------- R3b: endpoint discipline, quotient ---------- */
  quotientEndpointRound: () => {
    for (let tries = 0; tries < 60; tries++) {
      const f = pick([randParabola(), randHyperbolaOffAxis(), randExp()]);
      const g = randLine();
      const gRoot = lineXInt(g);
      const win = windowFor([f, g]);
      if (!win) continue;
      if (!mostlyInFrame(f, win) || !mostlyInFrame(g, win)) continue;
      if (gRoot == null || gRoot <= win.xmin + 0.5 || gRoot >= win.xmax - 0.5) continue;
      const fZerosRaw = xIntercepts(f, win.xmin, win.xmax);
      const fAsymRaw = vAsymptotes(f).filter((x) => x > win.xmin + 0.5 && x < win.xmax - 0.5);
      if (!fZerosRaw.length && !fAsymRaw.length) continue;
      if ([...fZerosRaw, ...fAsymRaw].some((x) => Math.abs(x - gRoot) < 0.5)) continue;

      const spec = specFor([f, g], { win, accent: ACC, ticks: "labels", labels: ["f", "g"], asymLabels: true });
      const cuts = [
        ...fZerosRaw.map((x) => ({ x, why: "zero" })),
        ...fAsymRaw.map((x) => ({ x, why: "asym" })),
        { x: gRoot, why: "gzero" },
      ].sort((a, b) => a.x - b.x);
      const cands = cuts.map((c) => ({ ...c, need: true }));
      addTPDecoy(cands, f, win);
      cands.sort((a, b) => a.x - b.x);
      const tableSpec = { ...spec, vlines: cuts.map((c) => ({ x: c.x })) };
      const secs = sections(cuts, win.xmin, win.xmax);
      if (!paintable([f, g], secs, win)) continue;

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

      const built = iq({
        concept: "inequal2", kind: "cutPaintSweep", accent: ACC,
        prompt: B(`For which values of x is <span class='eq'>f(x)/g(x) ${sym}</span>?`,
                  `Vir watter waardes van x is <span class='eq'>f(x)/g(x) ${sym}</span>?`),
        stem: `<span class="eq">f(x) = ${eqStr(f, "").replace(/^\s*=\s*/, "")}</span> &nbsp;·&nbsp; <span class="eq">g(x) = ${eqStr(g, "").replace(/^\s*=\s*/, "")}</span>`,
        coach: B("Step 1: tap on every place that needs a line — f's own x-intercepts and asymptotes, and g's x-intercept too.",
                 "Stap 1: klik op elke plek wat 'n lyn nodig het — f se eie x-afsnitte en asimptote, en ook g se x-afsnit."),
        hints: [
          B("Paint it exactly as f·g, section by section.", "Merk dit presies soos f·g, afdeling vir afdeling."),
          B("A real x-intercept of f can close. f's own asymptote and g's own x-intercept never can.",
            "'n Regte x-afsnit van f kan toemaak. f se eie asimptoot en g se eie x-afsnit kan nooit nie."),
        ],
        build: buildFlow({
          spec, cands, secs, curveIdx: [0, 1], names: ["f", "g"], tableSpec, curvesArr: [f, g],
          missingWhy: "gzero", missingMsg: MISSING_MSG.gzero,
        }),
        then: mc("inequal2",
          B("Pick the correctly closed answer.", "Kies die antwoord met die regte toe/oop kant."),
          opts.correct, opts.wrongs.map((w) => ({ ...w, misc: withScaffold(w.misc) })),
          { answerLabel: opts.correct,
            solution: [
              B("1. A line at every boundary: f's x-intercepts/asymptote, and g's x-intercept.",
                "1. 'n Lyn by elke grens: f se x-afsnitte/asimptoot, en g se x-afsnit."),
              B("2. Paint f's row and g's row, section by section.", "2. Merk f se ry en g se ry, afdeling vir afdeling."),
              B("3. Only a real x-intercept of f can close. An asymptote or g's own x-intercept never can.",
                "3. Net 'n regte x-afsnit van f kan toemaak. 'n Asimptoot of g se eie x-afsnit kan nooit nie."),
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
   with roots at −3 and 1 — the SAME picture as R1, walking the four
   steps in her exact order, the y-axis socket named explicitly. */
function buildIntro() {
  const f = parabolaFromRoots(1, -3, 1);
  const xLine = { kind: "line", a: 1, q: 0 };
  const win = windowFor([f, xLine]);
  const base = specFor([f, xLine], { win, accent: ACC, ticks: "labels", labels: ["f", "x"] });
  const lined = { ...base, vlines: [{ x: -3 }, { x: 0 }, { x: 1 }] };
  const g = computeFunction(base);
  const mids = [(win.xmin - 3) / 2, -1.5, 0.5, (win.xmax + 1) / 2];
  const numFrag = mids.map((m, i) =>
    `<text class="iv-sectlab" x="${g.X(m).toFixed(1)}" y="${(g.Y(win.ymax) + 12).toFixed(1)}" text-anchor="middle">${"①②③④"[i]}</text>`).join("");
  const fSigns = ["+", "−", "−", "+"];
  const xSigns = ["−", "−", "+", "+"];
  const markFrag = (curveFn, signs, xOffset) => mids.map((m, i) => {
    const y = curveFn(m);
    const rawPy = g.Y(Math.max(win.ymin + 1, Math.min(win.ymax - 1, y))) + (y >= 0 ? -17 : 17);
    /* clamp clear of the ①②③④ number row — the same fix q5's own intro
       needed on fix day, 2026-08-13: a section near the top edge puts the
       raw mark right off the top of the frame, above the labels. */
    const py = Math.max(g.Y(win.ymax) + 30, Math.min(g.Y(win.ymin) - 14, rawPy));
    const s = signs[i];
    return `<text class="iv-sign ${s === "+" ? "plus" : "minus"}" x="${(g.X(m) + xOffset).toFixed(1)}" y="${py.toFixed(1)}" text-anchor="middle">${s}</text>`;
  }).join("");
  const fFrag = markFrag(makeFn(f), fSigns, -13);
  const xFrag = markFrag(makeFn(xLine), xSigns, 13);
  return { beats: [
    { spec: base, cap: B("The question: for which values of x is <span class='eq'>x·f(x) &gt; 0</span>?",
                         "Die vraag: vir watter waardes van x is <span class='eq'>x·f(x) &gt; 0</span>?") },
    { spec: lined, cap: B("Step 1: a line through every x-intercept of f — AND through the y-axis, where x itself changes sign.",
                          "Stap 1: 'n lyn deur elke x-afsnit van f — EN deur die y-as, waar x self van teken verander.") },
    { spec: lined, frag: numFrag,
      cap: B("Step 2: number the sections, left to right.", "Stap 2: nommer die afdelings, links na regs.") },
    { spec: lined, frag: numFrag + fFrag + xFrag,
      cap: B("Step 3: mark x's row AND f's row — x is negative left of 0, positive right of it.",
             "Stap 3: merk x se ry ÉN f se ry — x is negatief links van 0, positief regs daarvan.") },
    { spec: { ...lined, shades: [{ x0: -3, x1: 0 }, { x0: 1, x1: win.xmax }] }, frag: numFrag + fFrag + xFrag,
      cap: B("Step 4: same signs on both rows → +. Read it off: <b class=\"eq\">−3 &lt; x &lt; 0 or x &gt; 1</b>.",
             "Stap 4: dieselfde tekens op albei rye → +. Lees dit af: <b class=\"eq\">−3 &lt; x &lt; 0 of x &gt; 1</b>.") },
  ] };
}
questInequal2.intro = buildIntro();
