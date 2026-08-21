/* ============================================================
   QUEST E · VIND DIE VERGELYKING — what the sketch gives you   ★ batch 3, session 1
   ------------------------------------------------------------
   Design: GQ-BATCH3-DESIGN.md § "Vind die vergelyking". A learner looks
   at a sketch and knows WHICH form fits and WHERE its numbers sit. The
   solve-for-a step stays in their books (Law 1) — this quest owns
   "wat gee die skets vir jou?", never a computation.

   Five round types (R4 and R5 are hers, 2026-08-21):
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
     R4 aSign           mc(), two options identical apart from the SIGN
                        of a. One family per round, one visual cue per
                        family: happy/sad · which pair of corners ·
                        above or below the asymptote.
     R5 whichBase       mc(), exponential only. Four options sharing a
                        and q, differing only in the base — written
                        across all three notations (whole number,
                        fraction, negative exponent). (½)ˣ and 2⁻ˣ are
                        ONE graph, so decoys are filtered by value and
                        the two spellings can never both appear.

   No solve-for-a anywhere, in any round.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { formFill } from "../engine/interactive.js";
import { B } from "../i18n.js";
import {
  specFor, windowFor, randParabola, randHyperbolaOffAxis, randExp, mostlyInFrame,
} from "./_graphs.js";
import {
  eqStr, eqTPStr, EQ, EQL, C, isInt, frac, pick, randInt, shuffled, makeFn, ptStr,
  paraTP, paraStd, paraRoots, paraYInt, hypXInt, expYInt, expXInt,
} from "../funclib.js";

const ACC = "#22d3ee";

/* Every R2 sketch marks MORE points than the form needs — that is the
   reading the round is about. Tapping one of the extras used to buzz in
   silence, so a learner who tapped the right dot first read the others as
   dead ("what is the purpose of that second dot?", her playtest
   2026-08-21). Each extra now names ITSELF and says why it is not the one. */
const WHY = {
  root: B("That is an x-intercept — where the curve cuts the x-axis. This form does not ask for it.",
          "Dis 'n x-afsnit — waar die kurwe die x-as sny. Hierdie vorm vra nie daarvoor nie."),
  tp: B("That is the turning point — this form is built from the x-intercepts.",
        "Dis die draaipunt — hierdie vorm word uit die x-afsnitte gebou."),
  yint: B("That is the y-intercept — where the curve cuts the y-axis. The asymptote is the dashed line.",
          "Dis die y-afsnit — waar die kurwe die y-as sny. Die asimptoot is die stippellyn."),
  other: B("Not that one — look again at what the form asks for.",
           "Nie daardie een nie — kyk weer waarvoor die vorm vra."),
};

/* ============================================================
   EXPONENTIAL BASES — shared by R3, R4 and R5
   ------------------------------------------------------------
   A base can be written three ways, and two of them are the SAME
   graph: (½)ˣ and 2⁻ˣ are one curve, drawn once. So an option list
   may never carry both — every decoy here is filtered by VALUE
   (curvesDiffer), never by how it is spelt. R5 says the equality out
   loud in its worked solution, because that is the thing worth
   learning about the notation.

   randExp() only ever makes b = 2 or 3, both bigger than 1, so every
   exponential in the quest used to climb the same way. These four
   bases give the falling ones too — which is what makes "which side
   does it lie flat against the asymptote?" a real reading.
   ============================================================ */
const EXP_BASES = [
  { b: 2, inv: null, styles: ["base"] },
  { b: 3, inv: null, styles: ["base"] },
  { b: 1 / 2, inv: 2, styles: ["base", "negexp"] },
  { b: 1 / 3, inv: 3, styles: ["base", "negexp"] },
];

/* y = a·bˣ + q with the x-intercept parked on a whole number, the way
   randExp() does it: q = −a·bᵏ. For a base under 1 the whole-number k
   is NEGATIVE, so the arithmetic stays exact — (1/3)**-1 in floating
   point is 3,0000000000000004, which is why the power is built from
   the integer `inv` instead of from b. */
function expWithBase(desc) {
  for (let i = 0; i < 40; i++) {
    const a = pick([1, 1, -1, 2]);
    const m = randInt(1, 2);
    const pow = desc.inv ? desc.inv ** m : desc.b ** m;
    const q = -a * pow;
    if (!Number.isInteger(q) || q === 0 || Math.abs(q) > 8) continue;
    const cv = { kind: "exp", a, b: desc.b, p: 0, q };
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    return { cv, win, desc };
  }
  return null;
}
function randExpAnyBase() {
  for (let i = 0; i < 20; i++) {
    const got = expWithBase(pick(EXP_BASES));
    if (got) return got;
  }
  return null;
}
const baseDescOf = (cv) => EXP_BASES.find((d) => Math.abs(d.b - cv.b) < 1e-9) || null;

/* one exponential, written in one of its notations */
function expLabel(cv, style) {
  const co = cv.a === 1 ? "" : cv.a === -1 ? "−" : C(cv.a) + "·";
  const tail = cv.q === 0 ? "" : cv.q > 0 ? ` + ${C(cv.q)}` : ` − ${C(-cv.q)}`;
  const desc = baseDescOf(cv);
  let power;
  if (style === "negexp" && desc && desc.inv) power = `${C(desc.inv)}<sup>−x</sup>`;
  else if (isInt(cv.b)) power = `${C(cv.b)}<sup>x</sup>`;
  else power = `(${frac("1", C(desc ? desc.inv : Math.round(1 / cv.b)))})<sup>x</sup>`;
  return EQ(`y = ${co}${power}${tail}`);
}

/* two curves are the same graph if nothing separates them across the
   window the learner can actually see — the qT render-and-compare rule,
   applied to values instead of pixels */
function curvesDiffer(cvA, cvB, win) {
  const f = makeFn(cvA), g = makeFn(cvB);
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const x = win.xmin + ((win.xmax - win.xmin) * i) / N;
    const u = f(x), v = g(x);
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue;
    if (Math.abs(u - v) > 1e-6) return true;
  }
  return false;
}

/* the one visual cue that separates a base over 1 from a base under 1,
   and it holds whichever sign a has: which side the curve lies flat
   against its asymptote */
function flatSideNudge(grows) {
  return grows
    ? B("That base lies flat against the asymptote on the wrong side — this curve is flat on the LEFT.",
        "Daardie grondtal lê plat teen die asimptoot aan die verkeerde kant — hierdie kurwe lê plat aan die LINKERKANT.")
    : B("That base lies flat against the asymptote on the wrong side — this curve is flat on the RIGHT.",
        "Daardie grondtal lê plat teen die asimptoot aan die verkeerde kant — hierdie kurwe lê plat aan die REGTERKANT.");
}

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
      ...roots.map((r, i) => ({ id: `r${i}`, x: r, y: 0, values: {}, why: WHY.root })),
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
        onMiss: (t) => nudge(t.why || WHY.other),
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
      { id: "tp", x: tp.x, y: tp.y, values: {}, why: WHY.tp },
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
        onMiss: (t) => nudge(t.why || WHY.other),
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
      ...(xi != null ? [{ id: "xi", x: xi, y: 0, values: {}, why: WHY.root }] : []),
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
        onMiss: (t) => nudge(t.why || WHY.other),
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
      { id: "yint", x: 0, y: yi, values: {}, why: WHY.yint },
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
        onMiss: (t) => nudge(t.why || WHY.other),
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
        /* three rungs: more than one option can carry the right q, so
           reading one feature never finishes the round (her playtest
           2026-08-21, on the exponential version of this same round) */
        hints: [
          B("Read the turning point straight off the sketch — that gives you p and q directly.",
            "Lees die draaipunt reguit van die skets af — dit gee jou p en q direk."),
          B("Careful with p: the bracket is (x − p), so a turning point to the LEFT of the y-axis gives a PLUS inside.",
            "Wees versigtig met p: die hakie is (x − p), so 'n draaipunt LINKS van die y-as gee 'n PLUS binne-in."),
          B("Last, check the arms: up means a is positive, down means a is negative.",
            "Kyk laastens na die arms: op beteken a is positief, af beteken a is negatief."),
        ],
        solution: [
          B(`The turning point is ${ptStr(tp.x, tp.y)}, so p = ${C(tp.x)} and q = ${C(tp.y)}.`,
            `Die draaipunt is ${ptStr(tp.x, tp.y)}, dus is p = ${C(tp.x)} en q = ${C(tp.y)}.`),
          B(`The arms point ${cv.a > 0 ? "up" : "down"}, so a is ${cv.a > 0 ? "positive" : "negative"}.`,
            `Die arms wys ${cv.a > 0 ? "op" : "af"}, dus is a ${cv.a > 0 ? "positief" : "negatief"}.`),
        ],
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
        hints: [
          B("Read the asymptote cross straight off the sketch — that gives you p and q directly.",
            "Lees die asimptoot-kruis reguit van die skets af — dit gee jou p en q direk."),
          B("Careful with p: the denominator is (x − p), so a cross to the LEFT of the y-axis gives a PLUS below.",
            "Wees versigtig met p: die noemer is (x − p), so 'n kruis LINKS van die y-as gee 'n PLUS onder."),
          B("Last, look at which pair of corners the wings lie in — that is the sign of a.",
            "Kyk laastens in watter paar hoeke die vlerkies lê — dis die teken van a."),
        ],
        solution: [
          B(`The asymptotes cross at ${ptStr(cv.p, cv.q)}, so p = ${C(cv.p)} and q = ${C(cv.q)}.`,
            `Die asimptote kruis by ${ptStr(cv.p, cv.q)}, dus is p = ${C(cv.p)} en q = ${C(cv.q)}.`),
          cv.a > 0
            ? B("The wings lie top-right and bottom-left of the cross, so a is positive.",
                "Die vlerkies lê regs-bo en links-onder van die kruis, dus is a positief.")
            : B("The wings lie top-left and bottom-right of the cross, so a is negative.",
                "Die vlerkies lê links-bo en regs-onder van die kruis, dus is a negatief."),
        ],
        answerLabel: strs.correct,
      });
    built.debugEquation = { family: "hyperbola", drawnCv: cv, correctCv: variants.correct, decoyCvs: [variants.pFlip, variants.qFlip, variants.aFlip], win };
    return built;
  }
  throw new Error("qE whichEqHyperbola: could not build a distinct-options round");
}

function whichEqExp() {
  for (let tries = 0; tries < 60; tries++) {
    const drawn = randExpAnyBase();
    if (!drawn) continue;
    const { cv, win } = drawn;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    /* The b-decoy used to be the OTHER whole-number base (2 ↔ 3). Both
       climb the same way and share a y-intercept, so nothing on the sketch
       separated them without arithmetic — and with three options carrying
       the right q, reading the asymptote decided almost nothing (her
       playtest 2026-08-21). The b-decoy is now the RECIPROCAL base, which
       lies flat against the asymptote on the opposite side: a pure read,
       and the third rung of the hint ladder below. */
    const variants = {
      correct: { kind: "exp", a: cv.a, b: cv.b, p: 0, q: cv.q },
      qFlip: { kind: "exp", a: cv.a, b: cv.b, p: 0, q: -cv.q },
      aFlip: { kind: "exp", a: -cv.a, b: cv.b, p: 0, q: cv.q },
      bRecip: { kind: "exp", a: cv.a, b: 1 / cv.b, p: 0, q: cv.q },
    };
    if (!Object.keys(variants).filter((k) => k !== "correct")
        .every((k) => curvesDiffer(cv, variants[k], win))) continue;
    const strs = dedupeVariants(variants, (v) => expLabel(v, "base"));
    if (!strs) continue;
    const grows = cv.b > 1;
    const built = mc("equation",
      B("Which equation matches this sketch?", "Watter vergelyking pas by hierdie skets?"),
      strs.correct,
      [
        { label: strs.qFlip, misc: B("Wrong sign on q — the asymptote would sit on the OTHER side of the x-axis.",
                                      "Verkeerde teken op q — die asimptoot sou aan die ANDER kant van die x-as lê.") },
        { label: strs.aFlip, misc: B("Wrong sign on a — that puts the curve on the wrong side of the asymptote.",
                                      "Verkeerde teken op a — dit sit die kurwe aan die verkeerde kant van die asimptoot.") },
        { label: strs.bRecip, misc: flatSideNudge(grows) },
      ],
      {
        graph: spec,
        stem: B("All four options are written in the same form.", "Al vier opsies is in dieselfde vorm geskryf."),
        /* three rungs, because three of the four options can carry the
           right q — reading the asymptote alone never finishes this round */
        hints: [
          B("Read the asymptote straight off the sketch — that gives you q directly.",
            "Lees die asimptoot reguit van die skets af — dit gee jou q direk."),
          B("Now look at the curve against that asymptote: above it or below it? That is the sign of a.",
            "Kyk nou na die kurwe teenoor daardie asimptoot: lê dit bo of onder? Dis die teken van a."),
          B("Last, look at which side the curve lies flat against the asymptote — flat on the LEFT means a base bigger than 1, flat on the RIGHT means a base smaller than 1.",
            "Kyk laastens aan watter kant die kurwe plat teen die asimptoot lê — plat aan die LINKERKANT beteken 'n grondtal groter as 1, plat aan die REGTERKANT beteken 'n grondtal kleiner as 1."),
        ],
        solution: [
          B(`The asymptote sits at y = ${C(cv.q)}, so q = ${C(cv.q)}.`,
            `Die asimptoot lê by y = ${C(cv.q)}, dus is q = ${C(cv.q)}.`),
          B(`The curve lies ${cv.a > 0 ? "above" : "below"} it, so a is ${cv.a > 0 ? "positive" : "negative"}.`,
            `Die kurwe lê ${cv.a > 0 ? "bo" : "onder"} dit, dus is a ${cv.a > 0 ? "positief" : "negatief"}.`),
          B(`It lies flat against the asymptote on the ${grows ? "left" : "right"}, so the base is ${grows ? "bigger" : "smaller"} than 1.`,
            `Dit lê plat teen die asimptoot aan die ${grows ? "linkerkant" : "regterkant"}, dus is die grondtal ${grows ? "groter" : "kleiner"} as 1.`),
        ],
        answerLabel: strs.correct,
      });
    built.debugEquation = { family: "exp", drawnCv: cv, correctCv: variants.correct, decoyCvs: [variants.qFlip, variants.aFlip, variants.bRecip], win };
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

/* ============================================================
   R4 — WATTER TEKEN HET a? (her ask, 2026-08-21)
   ------------------------------------------------------------
   Two options, identical apart from the sign of a. Every family has
   ONE visual cue for it and the round drills only that cue:
     parabola   happy or sad
     hyperbola  which pair of corners the vlerkies lie in
     exp        above or below the asymptote
   ============================================================ */
function aSignParabola() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randParabola();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const tp = paraTP(cv);
    const right = { kind: "parabola", a: cv.a, p: tp.x, q: tp.y };
    const flip = { kind: "parabola", a: -cv.a, p: tp.x, q: tp.y };
    const up = cv.a > 0;
    return {
      cv, win, spec,
      correct: EQ(eqTPStr(right, "y")),
      wrong: EQ(eqTPStr(flip, "y")),
      misc: B("That a is the wrong sign — it would turn the arms the other way.",
              "Daardie a het die verkeerde teken — dit sou die arms die ander kant toe draai."),
      hint: B("Look at the arms: do they point up or down? Up means a is positive, down means a is negative.",
              "Kyk na die arms: wys hulle op of af? Op beteken a is positief, af beteken a is negatief."),
      solution: B(`The arms point ${up ? "up" : "down"}, so a is ${up ? "positive" : "negative"}.`,
                  `Die arms wys ${up ? "op" : "af"}, dus is a ${up ? "positief" : "negatief"}.`),
      family: "parabola",
    };
  }
  return null;
}
function aSignHyperbola() {
  for (let tries = 0; tries < 60; tries++) {
    const cv = randHyperbolaOffAxis();
    const win = windowFor([cv]);
    if (!win || !mostlyInFrame(cv, win)) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const flip = { kind: "hyperbola", a: -cv.a, p: cv.p, q: cv.q };
    const pos = cv.a > 0;
    return {
      cv, win, spec,
      correct: EQ(eqStr(cv, "y")),
      wrong: EQ(eqStr(flip, "y")),
      misc: B("That a is the wrong sign — it would move the wings into the other pair of corners.",
              "Daardie a het die verkeerde teken — dit sou die vlerkies na die ander paar hoeke skuif."),
      hint: B("Find where the two dashed lines cross, then see which pair of corners the wings lie in.",
              "Kry waar die twee stippellyne kruis, en kyk dan in watter paar hoeke die vlerkies lê."),
      solution: pos
        ? B("The wings lie top-right and bottom-left of the cross, so a is positive.",
            "Die vlerkies lê regs-bo en links-onder van die kruis, dus is a positief.")
        : B("The wings lie top-left and bottom-right of the cross, so a is negative.",
            "Die vlerkies lê links-bo en regs-onder van die kruis, dus is a negatief."),
      family: "hyperbola",
    };
  }
  return null;
}
function aSignExp() {
  for (let tries = 0; tries < 40; tries++) {
    const drawn = randExpAnyBase();
    if (!drawn) continue;
    const { cv, win } = drawn;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"] });
    if (!spec) continue;
    const flip = { kind: "exp", a: -cv.a, b: cv.b, p: 0, q: cv.q };
    const above = cv.a > 0;
    return {
      cv, win, spec,
      correct: expLabel(cv, "base"),
      wrong: expLabel(flip, "base"),
      misc: B("That a is the wrong sign — it would put the curve on the other side of the asymptote.",
              "Daardie a het die verkeerde teken — dit sou die kurwe aan die ander kant van die asimptoot sit."),
      hint: B("Find the dashed asymptote, then see whether the curve lies above it or below it.",
              "Kry die stippellyn-asimptoot, en kyk dan of die kurwe bo of onder dit lê."),
      solution: B(`The curve lies ${above ? "above" : "below"} the asymptote, so a is ${above ? "positive" : "negative"}.`,
                  `Die kurwe lê ${above ? "bo" : "onder"} die asimptoot, dus is a ${above ? "positief" : "negatief"}.`),
      family: "exp",
    };
  }
  return null;
}

function aSignRound() {
  for (let tries = 0; tries < 20; tries++) {
    const family = pick(["parabola", "hyperbola", "exp"]);
    const r = family === "parabola" ? aSignParabola()
      : family === "hyperbola" ? aSignHyperbola() : aSignExp();
    if (!r) continue;
    /* a and −a can never draw the same curve, but the two labels must
       still read differently — a = 1 vs a = −1 is the tight case */
    if (r.correct.replace(/<[^>]*>/g, "") === r.wrong.replace(/<[^>]*>/g, "")) continue;
    const built = mc("equation",
      B("Which equation matches this sketch?", "Watter vergelyking pas by hierdie skets?"),
      r.correct,
      [{ label: r.wrong, misc: r.misc }],
      {
        graph: r.spec,
        stem: B("The two options are the same, apart from the sign of a.",
                "Die twee opsies is dieselfde, behalwe vir die teken van a."),
        hints: [r.hint],
        solution: [r.solution],
        answerLabel: r.correct,
      });
    built.debugASign = { family: r.family, cv: r.cv, win: r.win, aPositive: r.cv.a > 0 };
    return built;
  }
  throw new Error("qE aSign: no honest window fits any draw");
}

/* ============================================================
   R5 — WATTER GRONDTAL? (her ask, 2026-08-21)
   ------------------------------------------------------------
   All four options share a and q and differ ONLY in the base, written
   across all three notations: a whole number, a fraction, and a
   negative exponent. Because (½)ˣ and 2⁻ˣ are the same graph, decoys
   are filtered by VALUE — the two spellings of one base can never both
   appear — and the worked solution names that equality out loud.
   ============================================================ */
function whichBaseRound() {
  for (let tries = 0; tries < 60; tries++) {
    const drawn = randExpAnyBase();
    if (!drawn) continue;
    const { cv, win, desc } = drawn;
    /* The x-intercept is MARKED, and it has to be: "which side is it flat
       on?" narrows four options to two, but 2ˣ and 3ˣ over the same q are
       only told apart where the curve crosses the x-axis. expWithBase()
       parks that crossing on a whole number so it can be read, not
       worked out — the marked point is what makes this round fair. */
    const xi = expXInt(cv);
    if (xi == null || Math.abs(xi - Math.round(xi)) > 1e-9) continue;
    const spec = specFor([cv], { win, accent: ACC, ticks: "labels", labels: ["f"],
      points: [{ x: Math.round(xi), y: 0, on: 0, label: `(${C(Math.round(xi))} ; 0)` }] });
    if (!spec) continue;

    const pool = EXP_BASES
      .map((d) => ({ d, alt: { kind: "exp", a: cv.a, b: d.b, p: 0, q: cv.q } }))
      .filter(({ alt }) => curvesDiffer(cv, alt, win));
    if (pool.length < 3) continue;

    const style = pick(desc.styles);
    const correct = expLabel(cv, style);
    /* at least one decoy is written in the OTHER notation, so every list
       shows both ways of spelling a base — that IS the round */
    let mixed = style === "negexp";
    const chosen = shuffled(pool).slice(0, 3);
    const wrongs = chosen.map(({ d, alt }) => {
      let st = pick(d.styles);
      if (!mixed && d.styles.includes("negexp")) st = "negexp";
      if (st === "negexp") mixed = true;
      return { label: expLabel(alt, st), misc: flatSideNudge(cv.b > 1) };
    });
    if (wrongs.some((w) => w.label.replace(/<[^>]*>/g, "") === correct.replace(/<[^>]*>/g, ""))) continue;

    const grows = cv.b > 1;
    const bothWays = desc.inv
      ? B(`(${"1/" + desc.inv})ˣ and ${desc.inv}⁻ˣ are two ways of writing the same graph.`,
          `(${"1/" + desc.inv})ˣ en ${desc.inv}⁻ˣ is twee maniere om dieselfde grafiek te skryf.`)
      : B("A base bigger than 1 climbs to the right; its reciprocal climbs to the left.",
          "'n Grondtal groter as 1 klim na regs; sy omgekeerde klim na links.");
    const built = mc("equation",
      B("Which base does this curve have?", "Watter grondtal het hierdie kurwe?"),
      correct, wrongs,
      {
        graph: spec,
        stem: B("All four options have the same a and the same q — only the base differs.",
                "Al vier opsies het dieselfde a en dieselfde q — net die grondtal verskil."),
        hints: [
          B("Do not work anything out — look at which side the curve lies flat against the asymptote.",
            "Moenie iets uitwerk nie — kyk aan watter kant die kurwe plat teen die asimptoot lê."),
          B("Flat on the LEFT means a base bigger than 1. Flat on the RIGHT means a base smaller than 1.",
            "Plat aan die LINKERKANT beteken 'n grondtal groter as 1. Plat aan die REGTERKANT beteken 'n grondtal kleiner as 1."),
          B("A fraction and a negative exponent do the same job — both make the curve fall away to the right.",
            "'n Breuk en 'n negatiewe eksponent doen dieselfde werk — albei laat die kurwe na regs wegval."),
          B("Two options are still left? The marked point is where the curve cuts the x-axis — check each base at that x and only one lands on zero.",
            "Bly daar nog twee opsies oor? Die gemerkte punt is waar die kurwe die x-as sny — toets elke grondtal by daardie x en net een kom op nul uit."),
        ],
        solution: [
          B(`The curve lies flat against the asymptote on the ${grows ? "left" : "right"}, so the base is ${grows ? "bigger" : "smaller"} than 1.`,
            `Die kurwe lê plat teen die asimptoot aan die ${grows ? "linkerkant" : "regterkant"}, dus is die grondtal ${grows ? "groter" : "kleiner"} as 1.`),
          B(`It cuts the x-axis at ${ptStr(Math.round(xi), 0)}, and only this base lands on zero there.`,
            `Dit sny die x-as by ${ptStr(Math.round(xi), 0)}, en net hierdie grondtal kom daar op nul uit.`),
          bothWays,
        ],
        answerLabel: correct,
      });
    built.debugWhichBase = {
      cv, win, style, correctB: cv.b,
      decoyBs: chosen.map(({ d }) => d.b),
      optionCount: wrongs.length + 1,
    };
    return built;
  }
  throw new Error("qE whichBase: could not build a distinct-options round");
}

/* ---------------- the quest + intro ---------------- */

export const questEquation = quest("qE",
  B("Find the equation", "Vind die vergelyking"),
  B("What does the sketch give you?", "Wat gee die skets vir jou?"),
  [
    { id: "chooseForm", concept: "equation", gen: chooseFormRound, weight: 1 },
    { id: "tapValues", concept: "equation", gen: tapValuesRound, weight: 2 },
    { id: "whichEquation", concept: "equation", gen: whichEquationRound, weight: 2 },
    { id: "aSign", concept: "equation", gen: aSignRound, weight: 1 },
    { id: "whichBase", concept: "equation", gen: whichBaseRound, weight: 1 },
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
    /* the quoted form gets its OWN line (.eq-line): inline at the end of
       the sentence it wrapped as "y = a(x −" / "p)² + q" on her phone
       (playtest 2026-08-21). Same for the filled equation below. */
    { spec: marked, cap: B(`The sketch marks the turning point — that tells you the form to use:${EQL(FORM_HAKIE)}`,
                           `Die skets merk die draaipunt — dit sê vir jou watter vorm om te gebruik:${EQL(FORM_HAKIE)}`) },
    { spec: marked, cap: B(`The turning point's own coordinates ARE p and q — nothing is worked out, it is read straight off:${EQL(eqTPStr(cv, "y"))}`,
                           `Die draaipunt se eie koördinate IS p en q — niks word uitgewerk nie, dit word reguit afgelees:${EQL(eqTPStr(cv, "y"))}`) },
  ] };
}
