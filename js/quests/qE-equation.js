/* ============================================================
   QUEST E · VIND DIE VERGELYKING — what the sketch gives you   ★ batch 3, session 1
   ------------------------------------------------------------
   Design: GQ-BATCH3-DESIGN.md § "Vind die vergelyking". A learner looks
   at a sketch and knows WHICH form fits and WHERE its numbers sit. The
   solve-for-a step stays in their books (Law 1) — this quest owns
   "wat gee die skets vir jou?", never a computation.

   Three round types:
     R1 chooseForm     mc(). A sketch marks ONE feature (both x-ints, or
                        the TP, or the y-intercept). "Which form fits?" —
                        the correct form is the one the marked feature
                        fills; the other two are wrong on THAT sketch
                        (they may be true of the curve, just not what
                        THIS sketch hands you). Parabola only — a
                        hyperbola/exp each have one canonical form, so
                        there is no real "choose the form" decision to
                        make for them (flagged in the session handoff).
     R2 tapValues       iq(), the new formFill() mechanic. The chosen
                        form shows with empty slots; tap the marked
                        feature that fills them. Pure reading — the
                        follow-up mc() asks one sign-reading question
                        about the family (happy/sad, corners, above/
                        below the asymptote), never re-asks the numbers
                        just typed in.
     R3 whichEquation   mc(). Four COMPLETE equations, all in the SAME
                        form (qT's rule — the round is about reading,
                        never about rearranging). Decoys by VALUE:
                        p-sign flip, q confused with the y-intercept,
                        a-sign flip. No decoy ever equals the drawn
                        curve by value (render-and-compare, the qT
                        pattern) — verify §24 checks this by sampling.

   No solve-for-a anywhere, in any round.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { formFill } from "../engine/interactive.js";
import { B } from "../i18n.js";
import {
  specFor, windowFor, randParabola, randHyperbolaOffAxis, randExp, mostlyInFrame,
} from "./_graphs.js";
import {
  eqStr, eqTPStr, EQ, C, isInt, frac, pick,
  paraTP, paraStd, paraRoots, paraYInt, hypXInt, expYInt,
} from "../funclib.js";

const ACC = "#22d3ee";

/* ============================================================
   R1 — KIES DIE VORM (parabola only — see file header)
   ============================================================ */
const FORM_INTERCEPT = "y = a(x − x₁)(x − x₂)";
const FORM_HAKIE = "y = a(x − p)² + q";
const FORM_STD = "y = ax² + bx + c";
const FORM_BY_KIND = { intercept: FORM_INTERCEPT, hakie: FORM_HAKIE, std: FORM_STD };
const FORM_NUDGE = {
  intercept: B("This form needs the x-intercepts marked — this sketch does not mark them.",
               "Hierdie vorm het die x-afsnitte nodig — hierdie skets merk dit nie."),
  hakie: B("This form needs the turning point marked — this sketch does not mark it.",
           "Hierdie vorm het die draaipunt nodig — hierdie skets merk dit nie."),
  std: B("This form needs only the y-intercept marked — this sketch marks something else.",
         "Hierdie vorm het net die y-afsnit nodig — hierdie skets merk iets anders."),
};
const MARK_TO_KIND = { roots: "intercept", tp: "hakie", yint: "std" };

function chooseFormRound() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const markKind = pick(["roots", "tp", "yint"]);
    let points;
    if (markKind === "roots") {
      const roots = paraRoots(cv);
      if (roots.length < 2 || roots[0] === roots[1]) continue;
      points = roots.map((r) => ({ x: r, y: 0, on: 0, label: `(${C(r)} ; 0)` }));
    } else if (markKind === "tp") {
      const tp = paraTP(cv);
      points = [{ x: tp.x, y: tp.y, on: 0, label: `(${C(tp.x)} ; ${C(tp.y)})` }];
    } else {
      const yi = paraYInt(cv);
      points = [{ x: 0, y: yi, on: 0, label: `(0 ; ${C(yi)})` }];
    }
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"], points });
    if (!spec) continue;
    const correctKind = MARK_TO_KIND[markKind];
    const wrongKinds = Object.keys(FORM_BY_KIND).filter((k) => k !== correctKind);

    const built = mc("equation",
      B("Which form fits this sketch?", "Watter vorm pas by hierdie skets?"),
      FORM_BY_KIND[correctKind],
      wrongKinds.map((k) => ({ label: FORM_BY_KIND[k], misc: FORM_NUDGE[k] })),
      {
        graph: spec,
        stem: B("What does the sketch give you?", "Wat gee die skets vir jou?"),
        hints: [B("Look at what is actually marked on the sketch — which form's letters does that fill in directly?",
                  "Kyk na wat werklik op die skets gemerk is — watter vorm se letters vul dit direk in?")],
        solution: [B(`The marked point fills ${FORM_BY_KIND[correctKind]} directly, no working needed.`,
                     `Die gemerkte punt vul ${FORM_BY_KIND[correctKind]} direk in, sonder enige werk.`)],
        answerLabel: FORM_BY_KIND[correctKind],
      });
    built.debugChooseForm = { markKind, correctKind, cv, win };
    return built;
  }
  throw new Error("qE chooseForm: no honest window fits any draw");
}

/* ============================================================
   R2 — TAP DIE WAARDES IN (formFill)
   ============================================================ */
function renderHakie(cv) {
  const co = cv.a === 1 ? "" : cv.a === -1 ? "−" : C(cv.a);
  const shell = `y = ${co}(x − p)² + q`;
  return (filled, glow) => {
    const done = filled.p !== undefined && filled.q !== undefined;
    const cls = done ? "filled" : glow.length ? "glow" : "";
    return `<div class="iv-form-eq"><span class="iv-slot ${cls}">${done ? eqTPStr(cv, "y") : shell}</span></div>`;
  };
}
function renderIntercept(cv) {
  const { a } = paraStd(cv);
  const co = a === 1 ? "" : a === -1 ? "−" : C(a);
  const [r1, r2] = paraRoots(cv);
  const factor = (r) => (r === 0 ? "x" : r > 0 ? `(x − ${C(r)})` : `(x + ${C(-r)})`);
  return (filled, glow) => {
    const f1 = filled.x1 !== undefined
      ? `<span class="iv-slot filled">${factor(r1)}</span>`
      : `<span class="iv-slot${glow.includes("x1") ? " glow" : ""}">(x − x₁)</span>`;
    const f2 = filled.x2 !== undefined
      ? `<span class="iv-slot filled">${factor(r2)}</span>`
      : `<span class="iv-slot${glow.includes("x2") ? " glow" : ""}">(x − x₂)</span>`;
    return `<div class="iv-form-eq">y = ${co}${f1}${f2}</div>`;
  };
}
function renderHyperbola(cv) {
  const shell = `y = ${frac(C(cv.a), "x − p")} + q`;
  return (filled, glow) => {
    const done = filled.p !== undefined && filled.q !== undefined;
    const cls = done ? "filled" : glow.length ? "glow" : "";
    return `<div class="iv-form-eq"><span class="iv-slot ${cls}">${done ? eqStr(cv, "y") : shell}</span></div>`;
  };
}
function renderExp(cv) {
  const base = isInt(cv.b) ? C(cv.b) : `(${C(cv.b)})`;
  const co = cv.a === 1 ? "" : cv.a === -1 ? "−" : C(cv.a) + "·";
  return (filled, glow) => {
    const done = filled.q !== undefined;
    const tail = done
      ? `<span class="iv-slot filled">${cv.q > 0 ? `+ ${C(cv.q)}` : `− ${C(-cv.q)}`}</span>`
      : `<span class="iv-slot${glow.includes("q") ? " glow" : ""}">+ q</span>`;
    return `<div class="iv-form-eq">y = ${co}${base}<sup>x</sup> ${tail}</div>`;
  };
}

/* every R2 skill returns the same shape: an iq() with debugFormFill
   exposing {mode, cv, win, tapIds, slots:[{id, tapId, value}]} so
   verify can recompute every filled value independently. */
function tapHakie() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const tp = paraTP(cv);
    const roots = paraRoots(cv);
    /* eqTPStr() reads cv.p/cv.q directly off the object — randParabola()
       hands back standard form {a,b,c}, so the TP-form display needs its
       OWN {a,p,q} object built from the same tp just computed. Caught by
       play-testing (2026-08-14): without this the filled equation printed
       "NaN" for both slots the moment the tap landed. */
    const tpCv = { kind: "parabola", a: cv.a, p: tp.x, q: tp.y };
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const taps = [
      { id: "tp", x: tp.x, y: tp.y, values: { p: tp.x, q: tp.y } },
      ...roots.map((r, i) => ({ id: `r${i}`, x: r, y: 0, values: {} })),
    ];
    const slots = [{ id: "p", tapId: "tp" }, { id: "q", tapId: "tp" }];
    const aPos = cv.a > 0;
    const correct = aPos ? B("happy — arms UP", "happy — arms OP") : B("sad — arms DOWN", "sad — arms AF");
    const wrong = aPos ? B("sad — arms DOWN", "sad — arms AF") : B("happy — arms UP", "happy — arms OP");
    const built = iq({
      concept: "equation", kind: "formFill", accent: ACC,
      prompt: B("Tap the turning point to fill in p and q.", "Klik op die draaipunt om p en q in te vul."),
      stem: B("y = a(x − p)² + q", "y = a(x − p)² + q"),
      coach: B("Find the marked point and tap it.", "Kry die gemerkte punt en klik daarop."),
      hints: [B("The turning point's own coordinates ARE p and q — read them straight off, nothing to work out.",
                "Die draaipunt se eie koördinate IS p en q — lees dit reguit af, niks om uit te werk nie.")],
      build: (host, done, nudge) => formFill(host, {
        spec, taps, slots, renderForm: renderHakie(tpCv),
        onDone: () => { nudge(B("Filled in!", "Ingevul!")); done(); },
      }),
      then: mc("equation",
        B("Is f happy or sad?", "Is f happy of sad?"),
        correct, [wrong],
        { solution: [B(`a = ${C(cv.a)}, so f is ${aPos ? "happy" : "sad"}.`, `a = ${C(cv.a)}, dus is f ${aPos ? "happy" : "sad"}.`)],
          answerLabel: correct }),
    });
    built.debugFormFill = {
      mode: "hakie", cv, win, tapIds: taps.map((t) => t.id),
      slots: [{ id: "p", tapId: "tp", value: tp.x }, { id: "q", tapId: "tp", value: tp.y }],
    };
    built.graph = spec;
    return built;
  }
  throw new Error("qE tapHakie: no honest window fits any draw");
}

function tapIntercept() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const roots = paraRoots(cv);
    if (roots.length < 2 || roots[0] === roots[1]) continue;
    const tp = paraTP(cv);
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const [r1, r2] = roots;
    const taps = [
      { id: "r1", x: r1, y: 0, values: { x1: r1 } },
      { id: "r2", x: r2, y: 0, values: { x2: r2 } },
      { id: "tp", x: tp.x, y: tp.y, values: {} },
    ];
    const slots = [{ id: "x1", tapId: "r1" }, { id: "x2", tapId: "r2" }];
    const aPos = cv.a > 0;
    const correct = aPos ? B("happy — arms UP", "happy — arms OP") : B("sad — arms DOWN", "sad — arms AF");
    const wrong = aPos ? B("sad — arms DOWN", "sad — arms AF") : B("happy — arms UP", "happy — arms OP");
    const built = iq({
      concept: "equation", kind: "formFill", accent: ACC,
      prompt: B("Tap each x-intercept, left to right, to fill in x₁ and x₂.",
                "Klik op elke x-afsnit, links na regs, om x₁ en x₂ in te vul."),
      stem: B("y = a(x − x₁)(x − x₂)", "y = a(x − x₁)(x − x₂)"),
      coach: B("Start with the LEFT x-intercept.", "Begin met die LINKSE x-afsnit."),
      hints: [B("Each x-intercept's own x-value IS x₁ or x₂ — read it straight off, nothing to work out.",
                "Elke x-afsnit se eie x-waarde IS x₁ of x₂ — lees dit reguit af, niks om uit te werk nie.")],
      build: (host, done, nudge) => formFill(host, {
        spec, taps, slots, renderForm: renderIntercept(cv),
        onDone: () => { nudge(B("Filled in!", "Ingevul!")); done(); },
      }),
      then: mc("equation",
        B("Is f happy or sad?", "Is f happy of sad?"),
        correct, [wrong],
        { solution: [B(`a = ${C(cv.a)}, so f is ${aPos ? "happy" : "sad"}.`, `a = ${C(cv.a)}, dus is f ${aPos ? "happy" : "sad"}.`)],
          answerLabel: correct }),
    });
    built.debugFormFill = {
      mode: "intercept", cv, win, tapIds: taps.map((t) => t.id),
      slots: [{ id: "x1", tapId: "r1", value: r1 }, { id: "x2", tapId: "r2", value: r2 }],
    };
    built.graph = spec;
    return built;
  }
  throw new Error("qE tapIntercept: no honest window fits any draw");
}

function tapHyperbola() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randHyperbolaOffAxis();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const xi = hypXInt(cv);
    const taps = [
      { id: "cross", x: cv.p, y: cv.q, values: { p: cv.p, q: cv.q } },
      ...(xi != null ? [{ id: "xi", x: xi, y: 0, values: {} }] : []),
    ];
    const slots = [{ id: "p", tapId: "cross" }, { id: "q", tapId: "cross" }];
    const aPos = cv.a > 0;
    const correct = aPos
      ? B("the branches sit top-right & bottom-left of the cross", "die vlerkies lê regs-bo & links-onder van die kruis")
      : B("the branches sit top-left & bottom-right of the cross", "die vlerkies lê links-bo & regs-onder van die kruis");
    const wrong = aPos
      ? B("the branches sit top-left & bottom-right of the cross", "die vlerkies lê links-bo & regs-onder van die kruis")
      : B("the branches sit top-right & bottom-left of the cross", "die vlerkies lê regs-bo & links-onder van die kruis");
    const built = iq({
      concept: "equation", kind: "formFill", accent: ACC,
      prompt: B("Tap the dashed cross to fill in p and q.", "Klik op die stippellyn-kruis om p en q in te vul."),
      stem: EQ(`y = ${frac(C(cv.a), "x − p")} + q`),
      coach: B("Find where the two dashed asymptotes cross and tap it.",
               "Kry waar die twee stippellyne kruis en klik daarop."),
      hints: [B("The cross's own coordinates ARE p and q — read them straight off, nothing to work out.",
                "Die kruis se eie koördinate IS p en q — lees dit reguit af, niks om uit te werk nie.")],
      build: (host, done, nudge) => formFill(host, {
        spec, taps, slots, renderForm: renderHyperbola(cv),
        onDone: () => { nudge(B("Filled in!", "Ingevul!")); done(); },
      }),
      then: mc("equation",
        B("Which pair of corners do the branches sit in?", "In watter paar hoeke lê die vlerkies?"),
        correct, [wrong],
        { solution: [B(`a = ${C(cv.a)}, so ${correct.en}`, `a = ${C(cv.a)}, dus ${correct.af}`)],
          answerLabel: correct }),
    });
    built.debugFormFill = {
      mode: "hyperbola", cv, win, tapIds: taps.map((t) => t.id),
      slots: [{ id: "p", tapId: "cross", value: cv.p }, { id: "q", tapId: "cross", value: cv.q }],
    };
    built.graph = spec;
    return built;
  }
  throw new Error("qE tapHyperbola: no honest window fits any draw");
}

function tapExp() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randExp();
    const win = windowFor([cv]);
    if (!win) continue;
    /* the stem must show the SAME given coefficient the fill panel shows —
       a hardcoded "y = bˣ + q" stem contradicted the panel whenever a ≠ 1
       (foreman review catch, 2026-08-14: stem said y = 2ˣ + q over a
       y = −2ˣ + q round). Same rendering rules as renderExp(). */
    const stemBase = isInt(cv.b) ? C(cv.b) : `(${C(cv.b)})`;
    const stemCo = cv.a === 1 ? "" : cv.a === -1 ? "−" : C(cv.a) + "·";
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const tapX = win.xmax - Math.max(0.6, (win.xmax - win.xmin) * 0.12);
    const yi = expYInt(cv);
    const taps = [
      { id: "asym", x: tapX, y: cv.q, values: { q: cv.q } },
      { id: "yint", x: 0, y: yi, values: {} },
    ];
    const slots = [{ id: "q", tapId: "asym" }];
    const aPos = cv.a > 0;
    const correct = aPos ? B("above the asymptote", "bo die asimptoot") : B("below the asymptote", "onder die asimptoot");
    const wrong = aPos ? B("below the asymptote", "onder die asimptoot") : B("above the asymptote", "bo die asimptoot");
    const built = iq({
      concept: "equation", kind: "formFill", accent: ACC,
      prompt: B("Tap the dashed asymptote to fill in q.", "Klik op die stippellyn-asimptoot om q in te vul."),
      stem: EQ(`y = ${stemCo}${stemBase}ˣ + q`),
      coach: B("Find the dashed horizontal line and tap it.", "Kry die stippel-horisontale lyn en klik daarop."),
      hints: [B("The asymptote's own y-value IS q — read it straight off, nothing to work out.",
                "Die asimptoot se eie y-waarde IS q — lees dit reguit af, niks om uit te werk nie.")],
      build: (host, done, nudge) => formFill(host, {
        spec, taps, slots, renderForm: renderExp(cv),
        onDone: () => { nudge(B("Filled in!", "Ingevul!")); done(); },
      }),
      then: mc("equation",
        B("Does the curve sit above or below the asymptote?", "Lê die kurwe bo of onder die asimptoot?"),
        correct, [wrong],
        { solution: [B(`a = ${C(cv.a)}, so the curve sits ${aPos ? "above" : "below"} the asymptote.`,
                       `a = ${C(cv.a)}, dus lê die kurwe ${aPos ? "bo" : "onder"} die asimptoot.`)],
          answerLabel: correct }),
    });
    built.debugFormFill = {
      mode: "exp", cv, win, tapIds: taps.map((t) => t.id),
      slots: [{ id: "q", tapId: "asym", value: cv.q }],
    };
    built.graph = spec;
    return built;
  }
  throw new Error("qE tapExp: no honest window fits any draw");
}

function tapValuesRound() {
  const which = pick(["hakie", "hakie", "intercept", "hyperbola", "exp"]);
  if (which === "hakie") return tapHakie();
  if (which === "intercept") return tapIntercept();
  if (which === "hyperbola") return tapHyperbola();
  return tapExp();
}

/* ============================================================
   R3 — WATTER VERGELYKING PAS? (four complete equations, same form)
   ============================================================ */
function dedupeVariants(variants, strFn) {
  const strs = {}; const seen = new Set();
  for (const k in variants) {
    const raw = strFn(variants[k]);
    const flat = raw.replace(/<[^>]*>/g, "");
    if (seen.has(flat)) return null;
    seen.add(flat); strs[k] = raw;
  }
  return strs;
}

function whichEqParabola() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const tp = paraTP(cv);
    if (tp.x === 0) continue;                                  // p-flip would collide with correct
    const yi = paraYInt(cv);
    if (Math.abs(yi - tp.y) < 1e-9) continue;                  // q-vs-yint decoy would collide
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const variants = {
      correct: { kind: "parabola", a: cv.a, p: tp.x, q: tp.y },
      pFlip: { kind: "parabola", a: cv.a, p: -tp.x, q: tp.y },
      qFlip: { kind: "parabola", a: cv.a, p: tp.x, q: yi },
      aFlip: { kind: "parabola", a: -cv.a, p: tp.x, q: tp.y },
    };
    const strs = dedupeVariants(variants, (v) => EQ(eqTPStr(v, "y")));
    if (!strs) continue;
    const built = mc("equation",
      B("Which equation matches this sketch?", "Watter vergelyking pas by hierdie skets?"),
      strs.correct,
      [
        { label: strs.pFlip, misc: B("Right size, wrong sign on p — the bracket flips the sign of what you read off.",
                                      "Regte grootte, verkeerde teken op p — die hakie draai die teken van wat jy afgelees het om.") },
        { label: strs.qFlip, misc: B("That is the y-intercept's value, not the turning point's y.",
                                      "Dis die y-afsnit se waarde, nie die draaipunt se y nie.") },
        { label: strs.aFlip, misc: B("Wrong sign on a — look again: happy or sad?",
                                      "Verkeerde teken op a — kyk weer: happy of sad?") },
      ],
      {
        graph: spec,
        stem: B("All four options are written in the same form.", "Al vier opsies is in dieselfde vorm geskryf."),
        hints: [B("Read the turning point straight off the sketch — that gives you p and q directly.",
                  "Lees die draaipunt reguit van die skets af — dit gee jou p en q direk.")],
        answerLabel: strs.correct,
      });
    built.debugEquation = { family: "parabola", drawnCv: cv, correctCv: variants.correct, decoyCvs: [variants.pFlip, variants.qFlip, variants.aFlip], win };
    return built;
  }
  throw new Error("qE whichEqParabola: could not build a distinct-options round");
}

function whichEqHyperbola() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randHyperbolaOffAxis();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const variants = {
      correct: { kind: "hyperbola", a: cv.a, p: cv.p, q: cv.q },
      pFlip: { kind: "hyperbola", a: cv.a, p: -cv.p, q: cv.q },
      qFlip: { kind: "hyperbola", a: cv.a, p: cv.p, q: -cv.q },
      aFlip: { kind: "hyperbola", a: -cv.a, p: cv.p, q: cv.q },
    };
    const strs = dedupeVariants(variants, (v) => EQ(eqStr(v, "y")));
    if (!strs) continue;
    const built = mc("equation",
      B("Which equation matches this sketch?", "Watter vergelyking pas by hierdie skets?"),
      strs.correct,
      [
        { label: strs.pFlip, misc: B("Wrong sign on p — the vertical asymptote would sit on the OTHER side.",
                                      "Verkeerde teken op p — die vertikale asimptoot sou aan die ANDER kant lê.") },
        { label: strs.qFlip, misc: B("Wrong sign on q — the horizontal asymptote would sit on the OTHER side.",
                                      "Verkeerde teken op q — die horisontale asimptoot sou aan die ANDER kant lê.") },
        { label: strs.aFlip, misc: B("Wrong sign on a — that puts the branches in the wrong pair of corners.",
                                      "Verkeerde teken op a — dit sit die vlerkies in die verkeerde paar hoeke.") },
      ],
      {
        graph: spec,
        stem: B("All four options are written in the same form.", "Al vier opsies is in dieselfde vorm geskryf."),
        hints: [B("Read the asymptote cross straight off the sketch — that gives you p and q directly.",
                  "Lees die asimptoot-kruis reguit van die skets af — dit gee jou p en q direk.")],
        answerLabel: strs.correct,
      });
    built.debugEquation = { family: "hyperbola", drawnCv: cv, correctCv: variants.correct, decoyCvs: [variants.pFlip, variants.qFlip, variants.aFlip], win };
    return built;
  }
  throw new Error("qE whichEqHyperbola: could not build a distinct-options round");
}

function whichEqExp() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randExp();
    const win = windowFor([cv]);
    if (!win) continue;
    const otherB = pick([2, 3].filter((b) => b !== cv.b));
    if (otherB === undefined) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const variants = {
      correct: { kind: "exp", a: cv.a, b: cv.b, p: 0, q: cv.q },
      qFlip: { kind: "exp", a: cv.a, b: cv.b, p: 0, q: -cv.q },
      aFlip: { kind: "exp", a: -cv.a, b: cv.b, p: 0, q: cv.q },
      bSwap: { kind: "exp", a: cv.a, b: otherB, p: 0, q: cv.q },
    };
    const strs = dedupeVariants(variants, (v) => EQ(eqStr(v, "y")));
    if (!strs) continue;
    const built = mc("equation",
      B("Which equation matches this sketch?", "Watter vergelyking pas by hierdie skets?"),
      strs.correct,
      [
        { label: strs.qFlip, misc: B("Wrong sign on q — the asymptote would sit on the OTHER side of the x-axis.",
                                      "Verkeerde teken op q — die asimptoot sou aan die ANDER kant van die x-as lê.") },
        { label: strs.aFlip, misc: B("Wrong sign on a — that puts the curve on the wrong side of the asymptote.",
                                      "Verkeerde teken op a — dit sit die kurwe aan die verkeerde kant van die asimptoot.") },
        { label: strs.bSwap, misc: B("That b does not match how steeply this curve takes off — look again.",
                                      "Daardie b pas nie by hoe skerp hierdie kurwe wegspring nie — kyk weer.") },
      ],
      {
        graph: spec,
        stem: B("All four options are written in the same form.", "Al vier opsies is in dieselfde vorm geskryf."),
        hints: [B("Read the asymptote straight off the sketch — that gives you q directly.",
                  "Lees die asimptoot reguit van die skets af — dit gee jou q direk.")],
        answerLabel: strs.correct,
      });
    built.debugEquation = { family: "exp", drawnCv: cv, correctCv: variants.correct, decoyCvs: [variants.qFlip, variants.aFlip, variants.bSwap], win };
    return built;
  }
  throw new Error("qE whichEqExp: could not build a distinct-options round");
}

function whichEquationRound() {
  const family = pick(["parabola", "parabola", "hyperbola", "exp"]);
  if (family === "parabola") return whichEqParabola();
  if (family === "hyperbola") return whichEqHyperbola();
  return whichEqExp();
}

/* ---------------- the quest + intro ---------------- */

export const questEquation = quest("qE",
  B("Find the equation", "Vind die vergelyking"),
  B("What does the sketch give you?", "Wat gee die skets vir jou?"),
  [
    { id: "chooseForm", concept: "equation", gen: chooseFormRound, weight: 2 },
    { id: "tapValues", concept: "equation", gen: tapValuesRound, weight: 2 },
    { id: "whichEquation", concept: "equation", gen: whichEquationRound, weight: 2 },
  ],
  { rounds: 6, accent: ACC });

/* worked example, once, at module load: a happy parabola, TP marked,
   hakie-vorm filled — the shortest honest path through all three ideas
   (mark → form → fill) before the learner's own rounds begin. */
{
  const cv = { kind: "parabola", a: 1, p: -1, q: -4 };
  const win = windowFor([cv]);
  const marked = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"],
    points: [{ x: -1, y: -4, on: 0, label: "(−1 ; −4)" }] });
  const plain = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
  questEquation.intro = { beats: [
    { spec: plain, cap: B("The question: which equation is this? Every round in this quest starts from a picture like this.",
                          "Die vraag: watter vergelyking is dit? Elke rondte in hierdie soektog begin met so 'n prent.") },
    { spec: marked, cap: B("The sketch marks the turning point — that tells you the form to use: y = a(x − p)² + q.",
                           "Die skets merk die draaipunt — dit sê vir jou watter vorm om te gebruik: y = a(x − p)² + q.") },
    { spec: marked, cap: B(`The turning point's own coordinates ARE p and q: ${eqTPStr(cv, "y")}. Nothing is worked out — it is read straight off.`,
                           `Die draaipunt se eie koördinate IS p en q: ${eqTPStr(cv, "y")}. Niks word uitgewerk nie — dit word reguit afgelees.`) },
  ] };
}
