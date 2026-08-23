/* ============================================================
   QUEST F · SOEK DIE FOUT — exam-marking eyes   ★ batch 3, session 4
   ------------------------------------------------------------
   Design: GQ-BATCH3-DESIGN.md § "Soek die fout"; kickoff call (c),
   its OWN quest on the map, after Ongelykhede 2.

   ONE round shape, many reps:

     stage 1   The sketch and the equation are on screen together.
               "Pas hulle?" — Ja / Nee. This is the DOING: the hand
               commits before anything is marked, the house rhythm
               every interactive round in this app follows.
               A wrong verdict switches on the SCAFFOLD (Law 6):
               the picture redraws with the curve the EQUATION
               actually describes, dashed and faint, over the honest
               sketch. Nothing is highlighted before that.
     stage 2   The marked question: "Wat is verkeerd?" — at most four
               feature-naming options, exactly one true. Every decoy
               names a feature that is demonstrably RIGHT in this
               drawn pair, with its own misconception nudge. "Niks
               nie — elke kenmerk pas" sits in EVERY list, so its
               presence never gives a no-fault round away, and it is
               the correct answer on exactly those rounds.

   WHICH SIDE LIES: always the equation. The sketch is drawn honestly
   from the true curve, and the learner marks the equation against it —
   that is the exam-marking eye this quest trains, and the quest's
   intro card says so in the first beat.

   Dealing (her qE ruling, 2026-08-21, reused here): one round of every
   fault kind — plus one no-fault round — per play, until the learner
   has met all six; then the plain weighted draw. Each fault kind IS a
   skill in the skills list below, so quest()'s dealEachKindFirst flag
   gives that for free through buildRound()'s existing dealer.

   The fault machinery itself lives in ./_fault.js — pure functions, no
   DOM, written to be lifted into blipwork's error-checking rounds
   (DICE-PLAN.md). This file is the thin caller: draw, inject, size the
   window, hand the option list to mc(). Nothing about the fault menu is
   decided here.
   ============================================================ */
import { mc, iq, quest } from "./_shared.js";
import { staticGraph } from "../engine/interactive.js";
import { B } from "../i18n.js";
import {
  CONTENT, specFor, windowFor, keyPoints, mostlyInFrame,
  randLine, randParabola, randHyperbolaOffAxis, randExp, randSemicircle,
} from "./_graphs.js";
import { EQL, pick } from "../funclib.js";
import {
  KINDS, FAMILIES_FOR, injectFault, faultGap, featureDiff, namedFeatures,
  whyOptions, faultSolution, eqOf, tpForm, LOOK_AGAIN, LOOK_AGAIN_OK,
} from "./_fault.js";

const ACC = "#a78bfa";

/* a fault that lands both curves on the same pixels is not a fault:
   the drawn window must show at least this much daylight between the
   honest curve and the one the equation describes (foreman's review
   focus for this session) */
const MIN_GAP = 1;

const VERDICT = B("Yes or no:", "Ja of nee:");
const YES = B("Yes, they match", "Ja, hulle pas");
const NO = B("No, they do not", "Nee, hulle pas nie");

const COACH = B("Check every feature against the sketch, then decide.",
                "Gaan elke kenmerk teen die skets na en besluit dan.");
const UNLOCK = B("Now name it.", "Noem dit nou.");

const HINT1 = B("Start with the sign of a — does the sketch open the way the equation promises?",
                "Begin by die teken van a — maak die skets oop soos die vergelyking belowe?");
const HINT2 = {
  parabola: B("Now read the turning point off the sketch and hold it against the bracket and the number behind it.",
              "Lees nou die draaipunt van die skets af en hou dit teen die hakie en die getal daaragter."),
  hyperbola: B("Now read the asymptote cross off the sketch: which number is the x-one and which is the y-one?",
               "Lees nou die asimptoot-kruis van die skets af: watter getal is die x-een en watter is die y-een?"),
  exp: B("Now read the asymptote off the sketch, then check which way the curve takes off.",
         "Lees nou die asimptoot van die skets af en kyk dan watter kant toe die kurwe opstyg."),
  semicircle: B("Now read where the half circle meets the x-axis — that is the radius.",
                "Lees nou waar die halwe sirkel die x-as ontmoet — dis die radius."),
  line: B("Now read where the line cuts the y-axis and hold it against the number in the equation.",
          "Lees nou waar die lyn die y-as sny en hou dit teen die getal in die vergelyking."),
};
const HINT3 = {
  parabola: B("The bracket flips the sign: (x − p) with the turning point LEFT of the y-axis gives a PLUS inside.",
              "Die hakie draai die teken om: (x − p) met die draaipunt LINKS van die y-as gee 'n PLUS binne-in."),
  hyperbola: B("The denominator flips the sign too: (x − p) with the cross LEFT of the y-axis gives a PLUS below.",
               "Die noemer draai die teken ook om: (x − p) met die kruis LINKS van die y-as gee 'n PLUS onder."),
  exp: B("Careful with the base: (½)ˣ and 2⁻ˣ are the same graph, so look at the direction, not at the writing.",
         "Wees versigtig met die grondtal: (½)ˣ en 2⁻ˣ is dieselfde grafiek, so kyk na die rigting, nie na die skryfwyse nie."),
};

/* ---------------- drawing one honest curve per family ---------------- */
function drawFamily(family) {
  if (family === "line") return randLine({ throughOrigin: false });
  if (family === "parabola") return tpForm(randParabola());
  if (family === "hyperbola") return randHyperbolaOffAxis();
  if (family === "exp") return randExp();
  return randSemicircle({ up: pick([true, false]) });
}

/* which families this fault kind may use in THIS build (semicircles are
   flag-gated app-wide — the blipwork mount turns them off) */
function familiesFor(kind) {
  return FAMILIES_FOR[kind].filter((f) => f !== "semicircle" || CONTENT.semicircles);
}

/* the points the round is ABOUT must be inside the window, or the frame
   crops the very thing the learner is asked to compare */
function includeFor(trueCv, stated, claims) {
  const t = namedFeatures(trueCv), s = namedFeatures(stated);
  const pts = [];
  claims.forEach((k) => {
    if (k === "p") { pts.push({ x: s.p, y: s.q }, { x: t.p, y: t.q }); }
    if (k === "asymX") { pts.push({ x: s.asymX }, { x: t.asymX }); }
    if (k === "asymY") { pts.push({ y: s.asymY }, { y: t.asymY }); }
  });
  return pts.filter((p) => (p.x == null || Number.isFinite(p.x)) && (p.y == null || Number.isFinite(p.y)));
}

/* the Law 6 scaffold: the honest sketch with the curve the EQUATION
   actually describes laid over it, dashed and faint, plus the dashed
   lines the equation claims for its asymptotes. Built here, shown only
   after a wrong verdict — never on a first, clean paint. */
function scaffoldOf(spec, trueCv, stated) {
  const extra = [];
  if (stated.kind === "hyperbola") {
    if (stated.p !== trueCv.p) extra.push({ x: stated.p });
    if (stated.q !== trueCv.q) extra.push({ y: stated.q });
  } else if (stated.kind === "exp" && stated.q !== trueCv.q) {
    extra.push({ y: stated.q });
  }
  return {
    ...spec,
    curves: [...spec.curves, { ...stated, tone: "c", dash: true, faint: true }],
    asymptotes: [...(spec.asymptotes || []), ...extra],
  };
}

/* ============================================================
   THE ONE ROUND SHAPE
   ------------------------------------------------------------
   `kind` is the fault to inject ("none" = an honest pair). Bounded
   retry loop, never recursion (the qL/qG house style) — a draw is
   thrown away when the window cannot hold both readings, when the
   curve is cropped, or when the lie is too small to see.
   ============================================================ */
function faultRound(kind) {
  const fams = familiesFor(kind);
  for (let tries = 0; tries < 80; tries++) {
    const family = pick(fams);
    const trueCv = drawFamily(family);
    if (!trueCv) continue;

    const inj = injectFault(trueCv, kind);
    if (!inj) continue;
    const stated = inj.stated;

    const include = includeFor(trueCv, stated, inj.claims);
    const win = windowFor([trueCv], { include });
    if (!win) continue;
    if (!mostlyInFrame(trueCv, win)) continue;
    /* every point the round is ABOUT really landed inside the frame */
    if (!include.every((p) => (p.x == null || (p.x > win.xmin + 0.4 && p.x < win.xmax - 0.4))
                           && (p.y == null || (p.y > win.ymin + 0.4 && p.y < win.ymax - 0.4)))) continue;

    /* the lie has to be VISIBLE at this window — at least one whole grid
       unit of daylight somewhere the learner can actually look */
    const gap = kind === "none" ? 0 : faultGap(trueCv, stated, win);
    if (kind !== "none" && gap < MIN_GAP) continue;

    const spec = specFor([trueCv], {
      win, accent: ACC, ticks: "labels", labels: ["f"],
      /* bare dots: the sketch marks WHERE the features are, never their
         values — printing them would hand over the comparison the round
         is asking for (the equation is the only stated claim) */
      points: keyPoints(trueCv, 0, { bare: true }),
    });
    if (!spec) continue;

    const why = whyOptions(trueCv, kind, inj.diff);
    if (!why || !why.wrongs.length) continue;

    const isMatch = kind === "none";
    const eq = eqOf(stated);
    const scaffold = scaffoldOf(spec, trueCv, stated);

    const hints = [HINT1, HINT2[family]].filter(Boolean);
    if (HINT3[family]) hints.push(HINT3[family]);

    const built = iq({
      concept: "fault", kind: "faultVerdict", accent: ACC,
      stem: B(`The equation says:${EQL(eq)}`, `Die vergelyking sê:${EQL(eq)}`),
      prompt: B("Do they match?", "Pas hulle?"),
      coach: COACH,
      unlockMsg: UNLOCK,
      hints,
      build: (host, done, nudge, setMeter, ask) => {
        staticGraph(host, spec);
        let settled = false;
        ask(VERDICT, [
          { label: YES, correct: isMatch },
          { label: NO, correct: !isMatch },
        ], (ok) => {
          if (ok) { settled = true; done(); return; }
          if (settled) return;
          staticGraph(host, scaffold);           // Law 6 — only now
          nudge(isMatch ? LOOK_AGAIN_OK : LOOK_AGAIN);
        });
      },
      then: mc("fault",
        B("What is wrong — or does everything match?", "Wat is verkeerd — of pas alles?"),
        why.correct,
        why.wrongs.map((w) => ({ label: w.label, misc: w.misc })),
        {
          solution: faultSolution(trueCv, stated, kind),
          answerLabel: why.correct,
        }),
    });

    /* verify-only, pure data — play.js reads item.graph on NON-interactive
       items only, so an interactive round exposing its opening spec here
       is never rendered twice (the qK/qT slideMatch pattern). Lets §4b's
       frame honesty and §22's off-axis scan see this quest too. */
    built.graph = spec;
    built.debugFault = {
      kind, family, trueCv, stated, win, spec, scaffold, include,
      claims: inj.claims, diff: inj.diff, gap,
      correctKey: why.correctKey, decoyKeys: why.decoyKeys,
      isMatch, optionCount: why.wrongs.length + 1,
      trueFeatures: namedFeatures(trueCv), statedFeatures: namedFeatures(stated),
    };
    return built;
  }
  throw new Error(`qF ${kind}: no honest, visible draw fits any window`);
}

/* ---------------- the quest ---------------- */
/* one skill per fault kind — that is what makes dealEachKindFirst deal
   "one round of each fault kind, plus one no-fault" on every early play
   (her ruling 2026-08-21). The weights only steer the LATER, fully
   random dealing, and they are tuned against BOTH design bars at once:
   no-fault has to stay between a quarter and two fifths of the rounds
   ("Nee" must never be the safe guess, and neither must "Ja"), while
   every one of the five fault kinds still has to come up at least eight
   times in sixty. Those two bars leave a narrow band; 5 : 2 lands at
   ≈ 28,7 % no-fault and ≈ 8,6 rounds per fault kind per sixty. Note
   buildRound()'s "never the same skill twice in a row" rule pulls the
   heaviest weight DOWN from its nominal share — 5/15 nominal reads as
   ≈ 28,7 % in play, which is why the weight looks bigger than the
   target. Verify §29a/§29b measure both bars on the real dealer. */
export const questFault = quest("qF",
  B("Spot the mistake", "Soek die fout"),
  B("Does this sketch match this equation?", "Pas hierdie skets by hierdie vergelyking?"),
  [
    { id: "none", concept: "fault", gen: () => faultRound("none"), weight: 5 },
    { id: "pFlip", concept: "fault", gen: () => faultRound("pFlip"), weight: 2 },
    { id: "qc", concept: "fault", gen: () => faultRound("qc"), weight: 2 },
    { id: "asymSwap", concept: "fault", gen: () => faultRound("asymSwap"), weight: 2 },
    { id: "aFlip", concept: "fault", gen: () => faultRound("aFlip"), weight: 2 },
    { id: "bFlip", concept: "fault", gen: () => faultRound("bFlip"), weight: 2 },
  ],
  { rounds: 6, accent: ACC, dealEachKindFirst: true });

export { KINDS as FAULT_KINDS };

/* worked example, once, at module load: one honest pair, then the same
   sketch beside an equation that lies about the bracket. Three beats,
   and the first one states the rule this whole quest rests on — the
   sketch is honest, the equation is the thing being marked. */
{
  const cv = { kind: "parabola", a: 1, p: 2, q: -4 };
  const win = windowFor([cv], { include: [{ x: -2 }] });
  const base = specFor([cv], {
    win, accent: ACC, ticks: "labels", labels: ["f"],
    points: keyPoints(cv, 0, { bare: true }),
  });
  const marked = specFor([cv], {
    win, accent: ACC, ticks: "labels", labels: ["f"],
    points: [{ x: 2, y: -4, on: 0, label: "(2 ; −4)", place: "below" }],
  });
  const liar = { kind: "parabola", a: 1, p: -2, q: -4 };
  const withLie = { ...marked, curves: [...marked.curves, { ...liar, tone: "c", dash: true, faint: true }] };
  questFault.intro = { beats: [
    { spec: base,
      cap: B("Every round shows a sketch and an equation side by side. The sketch is always drawn honestly — it is the EQUATION that may be lying.",
             "Elke rondte wys 'n skets en 'n vergelyking langs mekaar. Die skets is altyd eerlik geteken — dis die VERGELYKING wat dalk lieg.") },
    { spec: marked,
      cap: B(`Here they match. The turning point sits at (2 ; −4), and the equation says exactly that:${EQL("y = (x − 2)² − 4")}`,
             `Hier pas hulle. Die draaipunt lê by (2 ; −4), en die vergelyking sê presies dit:${EQL("y = (x − 2)² − 4")}`) },
    { spec: withLie,
      cap: B(`And here it lies:${EQL("y = (x + 2)² − 4")}The bracket's sign puts the turning point on the other side — the dashed curve. You mark the equation against the sketch, exactly like marking a paper.`,
             `En hier lieg dit:${EQL("y = (x + 2)² − 4")}Die hakie se teken sit die draaipunt aan die ander kant — die stippellyn-kurwe. Jy merk die vergelyking teen die skets, net soos wanneer 'n vraestel nagesien word.`) },
  ] };
}
