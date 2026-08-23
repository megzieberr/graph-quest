/* ============================================================
   FAULT INJECTION — the "does this equation match this sketch?"
   machinery, as PURE functions                    ★ batch 3, session 4
   ------------------------------------------------------------
   THE CONTRACT (this file is written to be lifted into blipwork —
   maths-homework-quest's DICE-PLAN.md § "Error-checking rounds" reuses
   this exact mechanic). Nothing in here touches the DOM, reads the
   clock, or knows anything about graph-quest's screens. It imports only
   funclib (pure maths + display strings) and _graphs.js's feature
   helpers. A caller supplies curves and a window; this file supplies the
   lie, the option list and the words.

     injectFault(trueCv, kind)
        → { stated, faultKind, family, claims, ok } | null
        `trueCv`   an HONEST curve spec (the one that gets drawn).
                   Parabolas must arrive in TP form {kind,a,p,q} —
                   tpForm() below converts a standard-form draw.
        `kind`     one of KINDS: "none" | "pFlip" | "qc" | "asymSwap"
                   | "aFlip" | "bFlip".
        `stated`   the curve the EQUATION describes. The equation is
                   always the one that lies; the sketch is drawn from
                   trueCv, honestly. Returns null when this kind cannot
                   be injected into this curve (p already 0, the swap
                   would not move anything, the confusion value collides
                   with the true one, …) — the caller redraws.
        `claims`   the named-feature keys this fault is supposed to
                   change. featureDiff() must return exactly this set.

     namedFeatures(cv) → { key: value, … }
        The features a learner can NAME, per family. This is the
        granularity the why-question works at — not windowFor()'s raw
        xs/ys, which move in a bundle whenever any parameter moves.
          parabola    aSign · p (the hakie) · q (the up-and-down shift)
          hyperbola   aSign · asymX · asymY
          exp         aSign · asymY · bDir (opstyg/land)
          semicircle  aSign (above/below the x-axis) · r
          line        aSign · q

     featureDiff(a, b) → [keys]   which named features disagree.

     faultGap(trueCv, statedCv, win) → number
        The biggest vertical disagreement between the two curves, at an
        x where the TRUE curve is actually drawn inside `win`. A fault
        that lands both curves on the same pixels is not a fault: the
        caller redraws unless this is ≥ 1 whole grid unit.

     whyOptions(trueCv, faultKind) → { correctKey, correct, wrongs, … }
        The "Wat is verkeerd?" list. Exactly one option is true. Every
        other option names a feature that is demonstrably RIGHT in the
        drawn pair (never a feature this fault moved), and carries its
        own misconception nudge. "Niks nie — elke kenmerk pas" is in
        EVERY list, so its presence can never signal a no-fault round.

     eqOf(cv) → HTML string        the stated claim, one equation.
     faultSolution(trueCv, statedCv, kind) → [bilingual lines]

   ONE DOCUMENTED EXCEPTION to "exactly one named feature differs":
   "asymSwap" swaps a hyperbola's two asymptote values with each other,
   so it moves BOTH asymX and asymY — by definition, a swap cannot move
   one of a pair. Its claim set is therefore ["asymX","asymY"] and its
   why-option names the swap itself ("die twee asimptote is omgeruil").
   Every other kind claims exactly one key. The law the LEARNER meets is
   unchanged either way: exactly one option in the list is ever true.
   ============================================================ */
import {
  makeFn, paraTP, paraYInt, hypYInt, expYInt, eqStr, eqTPStr, C, frac, isInt,
} from "../funclib.js";

/* bilingual pair — a local copy so this module carries no app imports.
   Same shape as i18n.js's B(), and tools/extract_af.py reads it the same way. */
const B = (en, af) => ({ en, af });

const R = (v) => (Number.isFinite(v) ? Math.round(v * 1e6) / 1e6 : v);

/* a parabola in turning-point form — the form this quest states, because
   every parabola fault it injects is about the hakie or the shift */
export function tpForm(cv) {
  if (cv.kind !== "parabola") return cv;
  if (cv.p !== undefined) return cv;
  const tp = paraTP(cv);
  return { kind: "parabola", a: cv.a, p: R(tp.x), q: R(tp.y) };
}

/* ============================================================
   NAMED FEATURES — what a learner can point at and name
   ============================================================ */
export function namedFeatures(cv) {
  if (!cv) return {};
  if (cv.kind === "parabola") {
    const tp = paraTP(cv);
    return { aSign: Math.sign(cv.a), p: R(tp.x), q: R(tp.y) };
  }
  if (cv.kind === "hyperbola") return { aSign: Math.sign(cv.a), asymX: R(cv.p), asymY: R(cv.q) };
  if (cv.kind === "exp") return { aSign: Math.sign(cv.a), asymY: R(cv.q), bDir: cv.b > 1 ? 1 : -1 };
  if (cv.kind === "semicircle") return { aSign: cv.up === false ? -1 : 1, r: R(cv.r) };
  if (cv.kind === "line") return { aSign: Math.sign(cv.a), q: R(cv.q) };
  return {};
}

export function featureDiff(cvA, cvB) {
  const a = namedFeatures(cvA), b = namedFeatures(cvB);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => a[k] !== b[k]).sort();
}

/* ============================================================
   THE FAULT MENU
   ============================================================ */
export const KINDS = ["none", "pFlip", "qc", "asymSwap", "aFlip", "bFlip"];

/* which families each kind can be injected into. Semicircles appear only
   where the caller allows them (CONTENT.semicircles is the caller's
   business — this module never reads a flag). */
export const FAMILIES_FOR = {
  none: ["line", "parabola", "hyperbola", "exp", "semicircle"],
  /* exp is left out of pFlip on purpose: randExp() always draws p = 0,
     and flipping a zero moves nothing. Flagged in the session handoff. */
  pFlip: ["parabola", "hyperbola"],
  qc: ["parabola", "hyperbola", "exp"],
  asymSwap: ["hyperbola"],
  aFlip: ["parabola", "hyperbola", "exp", "semicircle"],
  bFlip: ["exp"],
};

const CLAIMS = {
  none: () => [],
  pFlip: (cv) => (cv.kind === "parabola" ? ["p"] : ["asymX"]),
  qc: (cv) => (cv.kind === "parabola" ? ["q"] : ["asymY"]),
  asymSwap: () => ["asymX", "asymY"],
  aFlip: () => ["aSign"],
  bFlip: () => ["bDir"],
};

/* the why-option key a fault answers to */
export const OPTION_KEY = {
  none: () => "none",
  pFlip: (cv) => (cv.kind === "parabola" ? "p" : "asymX"),
  qc: (cv) => (cv.kind === "parabola" ? "q" : "asymY"),
  asymSwap: () => "asymSwap",
  aFlip: () => "aSign",
  bFlip: () => "bDir",
};

/* every injection returns a NEW spec or null ("cannot be done here") */
const APPLY = {
  none: (cv) => ({ ...cv }),

  pFlip: (cv) => (cv.p === 0 || cv.p === undefined ? null : { ...cv, p: R(-cv.p) }),

  qc: (cv) => {
    if (cv.kind === "parabola") {
      const yi = R(paraYInt(cv));
      return yi === R(cv.q) ? null : { ...cv, q: yi };
    }
    if (cv.kind === "hyperbola") {
      const yi = hypYInt(cv);
      if (yi == null) return null;
      const v = R(yi);
      /* an asymptote stated AT 0 is a dashed line sitting on an axis —
         never shown, never stated (her 2026-08-13 ruling) */
      if (v === R(cv.q) || v === 0 || !Number.isInteger(v)) return null;
      return { ...cv, q: v };
    }
    if (cv.kind === "exp") {
      const v = R(expYInt(cv));
      if (v === R(cv.q) || v === 0 || !Number.isInteger(v)) return null;
      return { ...cv, q: v };
    }
    return null;
  },

  asymSwap: (cv) => {
    if (cv.kind !== "hyperbola") return null;
    if (cv.p === cv.q || cv.p === 0 || cv.q === 0) return null;
    return { ...cv, p: R(cv.q), q: R(cv.p) };
  },

  aFlip: (cv) => {
    if (cv.kind === "semicircle") return { ...cv, up: cv.up === false };
    if (cv.a === 0) return null;
    return { ...cv, a: R(-cv.a) };
  },

  bFlip: (cv) => {
    if (cv.kind !== "exp" || !cv.b || cv.b === 1) return null;
    /* (½)ˣ and 2⁻ˣ are ONE graph — the fault has to change the direction
       the curve is drawn in, not merely how the base is spelt. Taking the
       reciprocal does exactly that: an opstyg curve lands instead. */
    return { ...cv, b: R(1 / cv.b) };
  },
};

/* ------------------------------------------------------------
   injectFault — the one entry point a round generator calls
   ------------------------------------------------------------ */
export function injectFault(trueCurve, kind) {
  const cv = tpForm(trueCurve);
  if (!KINDS.includes(kind)) return null;
  if (!FAMILIES_FOR[kind].includes(cv.kind)) return null;
  const stated = APPLY[kind](cv);
  if (!stated) return null;
  const claims = CLAIMS[kind](cv);
  const diff = featureDiff(cv, stated);
  /* the unique-mismatch law, enforced at the source: what actually moved
     must be exactly what this fault claims to move — no more, no fewer */
  if (diff.length !== claims.length || !claims.every((k) => diff.includes(k))) return null;
  return {
    stated, faultKind: kind, family: cv.kind, claims, diff,
    optionKey: OPTION_KEY[kind](cv),
    ok: true,
  };
}

/* ------------------------------------------------------------
   Is the lie VISIBLE? A fault that puts both curves on the same
   pixels inside the drawn window is not a fault at all.
   Returns the biggest vertical gap, in graph units, measured only
   where the TRUE curve is actually on screen.
   ------------------------------------------------------------ */
export function faultGap(trueCv, statedCv, win, steps = 240) {
  const f = makeFn(trueCv), g = makeFn(statedCv);
  const skip = (cv, x) => cv.kind === "hyperbola" && Math.abs(x - cv.p) < 0.35;
  let worst = 0;
  for (let i = 0; i <= steps; i++) {
    const x = win.xmin + ((win.xmax - win.xmin) * i) / steps;
    if (skip(trueCv, x) || skip(statedCv, x)) continue;
    const u = f(x), v = g(x);
    if (!Number.isFinite(u) || !Number.isFinite(v)) continue;
    if (u < win.ymin || u > win.ymax) continue;          // the learner cannot look there
    worst = Math.max(worst, Math.abs(u - v));
  }
  return worst;
}

/* ============================================================
   THE EQUATION, AS STATED
   ============================================================ */
/* funclib's eqStr() writes a base under 1 as "(0,5)ˣ". A learner reads
   (½)ˣ, so exponentials get their own line here. Everything else already
   has an honest house string. */
function expEq(cv) {
  const co = cv.a === 1 ? "" : cv.a === -1 ? "−" : `${C(cv.a)}·`;
  const base = isInt(cv.b) ? C(cv.b) : `(${frac("1", C(Math.round(1 / cv.b)))})`;
  const tail = cv.q === 0 ? "" : cv.q > 0 ? ` + ${C(cv.q)}` : ` − ${C(-cv.q)}`;
  return `y = ${co}${base}<sup>x</sup>${tail}`;
}

export function eqOf(cv) {
  if (cv.kind === "parabola") return eqTPStr(tpForm(cv), "y");
  if (cv.kind === "exp") return expEq(cv);
  return eqStr(cv, "y");
}

/* ============================================================
   THE "WAT IS VERKEERD?" LIST
   ------------------------------------------------------------
   One option per NAMED feature of the family, plus "niks nie".
   Only the injected fault's own option is true; every other option
   names a feature this fault did NOT move, so it is demonstrably
   right in the drawn pair — checked, not assumed, by the caller
   (verify §29 re-derives it from featureDiff()).
   ============================================================ */
const OPT = {
  aSign: {
    parabola: {
      label: B("The sign of a — happy or sad", "Die teken van a — happy of sad"),
      misc: B("The arms point the same way in both — that part matches.",
              "Die arms wys in albei dieselfde kant toe — daardie deel pas."),
    },
    hyperbola: {
      label: B("The sign of a — which corners the wings lie in", "Die teken van a — in watter hoeke die vlerkies lê"),
      misc: B("The wings lie in the corners the sign of a promises — that part matches.",
              "Die vlerkies lê in die hoeke wat die teken van a belowe — daardie deel pas."),
    },
    exp: {
      label: B("The sign of a — above or below the asymptote", "Die teken van a — bo of onder die asimptoot"),
      misc: B("The curve lies on the side of the asymptote the sign of a promises — that part matches.",
              "Die kurwe lê aan die kant van die asimptoot wat die teken van a belowe — daardie deel pas."),
    },
    semicircle: {
      label: B("Above or below the x-axis", "Bo of onder die x-as"),
      misc: B("The half circle sits on the side the equation's sign promises — that part matches.",
              "Die halwe sirkel lê aan die kant wat die vergelyking se teken belowe — daardie deel pas."),
    },
    line: {
      label: B("Which way the line slopes", "Watter kant toe die lyn hel"),
      misc: B("The line climbs or falls exactly as the gradient says — that part matches.",
              "Die lyn klim of daal presies soos die helling sê — daardie deel pas."),
    },
  },
  p: {
    parabola: {
      label: B("The bracket's sign — where the turning point sits", "Die hakie se teken — waar die draaipunt lê"),
      misc: B("The turning point's x is exactly where the bracket says. Remember (x − p) flips the sign of what you read off.",
              "Die draaipunt se x lê presies waar die hakie sê. Onthou (x − p) draai die teken om van wat jy aflees."),
    },
  },
  q: {
    parabola: {
      label: B("The up-and-down shift — the turning point's y", "Die op-en-af skuif — die draaipunt se y"),
      misc: B("The number behind the bracket is the turning point's y, and it matches the sketch.",
              "Die getal agter die hakie is die draaipunt se y, en dit pas by die skets."),
    },
    line: {
      label: B("The y-intercept", "Die y-afsnit"),
      misc: B("The line cuts the y-axis exactly at the number in the equation — that part matches.",
              "Die lyn sny die y-as presies by die getal in die vergelyking — daardie deel pas."),
    },
  },
  asymX: {
    hyperbola: {
      label: B("The vertical asymptote — the bracket's sign", "Die vertikale asimptoot — die hakie se teken"),
      misc: B("The vertical dashed line stands exactly where the denominator says — that part matches.",
              "Die vertikale stippellyn staan presies waar die noemer sê — daardie deel pas."),
    },
  },
  asymY: {
    hyperbola: {
      label: B("The horizontal asymptote — the up-and-down shift", "Die horisontale asimptoot — die op-en-af skuif"),
      misc: B("The horizontal dashed line lies exactly at the number on the end — that part matches.",
              "Die horisontale stippellyn lê presies by die getal agteraan — daardie deel pas."),
    },
    exp: {
      label: B("The asymptote — the up-and-down shift", "Die asimptoot — die op-en-af skuif"),
      misc: B("The dashed line lies exactly at the number on the end — that part matches.",
              "Die stippellyn lê presies by die getal agteraan — daardie deel pas."),
    },
  },
  bDir: {
    exp: {
      label: B("The base — taking off or landing", "Die grondtal — opstyg of land"),
      misc: B("The curve takes off or lands exactly as the base says — that part matches.",
              "Die kurwe styg op of land presies soos die grondtal sê — daardie deel pas."),
    },
  },
  r: {
    semicircle: {
      label: B("The radius — how wide the half circle is", "Die radius — hoe wyd die halwe sirkel is"),
      misc: B("The half circle meets the x-axis exactly where the radius says — that part matches.",
              "Die halwe sirkel ontmoet die x-as presies waar die radius sê — daardie deel pas."),
    },
  },
  asymSwap: {
    hyperbola: {
      label: B("The two asymptotes are swapped around", "Die twee asimptote is omgeruil"),
      misc: B("Both dashed lines stand where the equation says — neither one is on the other's number.",
              "Albei stippellyne staan waar die vergelyking sê — nie een van hulle staan op die ander se getal nie."),
    },
  },
};

const NONE_OPT = {
  label: B("Nothing — every feature matches", "Niks nie — elke kenmerk pas"),
  misc: B("Look again, one feature at a time, and hold each one against the sketch.",
          "Kyk weer, een kenmerk op 'n slag, en hou elkeen teen die skets."),
};

/* the keys a family can be asked about, in a fixed order */
export const FEATURE_KEYS = {
  parabola: ["aSign", "p", "q"],
  hyperbola: ["aSign", "asymX", "asymY"],
  exp: ["aSign", "asymY", "bDir"],
  semicircle: ["aSign", "r"],
  line: ["aSign", "q"],
};

/* the option list for one round.
   `moved` = the named features this fault actually changed (from
   featureDiff), so a decoy can never name a feature that is also wrong. */
export function whyOptions(trueCv, faultKind, moved = []) {
  const cv = tpForm(trueCv);
  const family = cv.kind;
  const keys = FEATURE_KEYS[family] || [];
  const isNone = faultKind === "none";
  const correctKey = isNone ? "none" : OPTION_KEY[faultKind](cv);

  const optFor = (key) => {
    if (key === "none") return NONE_OPT;
    const byFam = OPT[key];
    return byFam ? byFam[family] : null;
  };

  const correctOpt = optFor(correctKey);
  if (!correctOpt) return null;

  /* decoys: features this fault left alone (so they are provably right),
     plus "niks nie" on a fault round — it sits in EVERY list, so it can
     never be the tell that a round has no fault in it */
  const decoyKeys = keys.filter((k) => k !== correctKey && !moved.includes(k));
  const wrongKeys = isNone ? decoyKeys : [...decoyKeys, "none"];

  const wrongs = wrongKeys
    .map((k) => ({ key: k, o: optFor(k) }))
    .filter((x) => x.o)
    .slice(0, 3)
    .map((x) => ({ key: x.key, label: x.o.label, misc: x.o.misc }));

  return { correctKey, correct: correctOpt.label, wrongs, decoyKeys: wrongs.map((w) => w.key) };
}

/* ============================================================
   THE METHOD CARD — what to compare, in numbers off this draw
   ============================================================ */
export function faultSolution(trueCv, statedCv, kind) {
  const cv = tpForm(trueCv), st = tpForm(statedCv);
  const nf = namedFeatures(cv), ns = namedFeatures(st);

  if (kind === "none") {
    /* name only the features THIS family has — a line has no asymptote */
    const FEATS = {
      line: B("the gradient and the y-intercept", "die gradiënt en die y-afsnit"),
      parabola: B("the sign of a and the turning point", "die teken van a en die draaipunt"),
      hyperbola: B("the sign of a and both asymptotes", "die teken van a en albei asimptote"),
      exp: B("the base, the sign of a and the asymptote", "die grondtal, die teken van a en die asimptoot"),
      semicircle: B("the radius and which half it is", "die radius en watter helfte dit is"),
    };
    const f = FEATS[cv.kind] || FEATS.parabola;
    return [B(`Every feature matches: ${f.en} all agree with the sketch.`,
              `Elke kenmerk pas: ${f.af} stem met die skets ooreen.`)];
  }
  if (kind === "pFlip" && cv.kind === "parabola") {
    return [
      B(`The sketch's turning point sits at x = ${C(nf.p)}, but the equation says x = ${C(ns.p)}.`,
        `Die skets se draaipunt lê by x = ${C(nf.p)}, maar die vergelyking sê x = ${C(ns.p)}.`),
      B("The bracket is (x − p), so a turning point left of the y-axis gives a PLUS inside.",
        "Die hakie is (x − p), so 'n draaipunt links van die y-as gee 'n PLUS binne-in."),
    ];
  }
  if (kind === "pFlip") {
    return [
      B(`The vertical asymptote stands at x = ${C(nf.asymX)}, but the equation says x = ${C(ns.asymX)}.`,
        `Die vertikale asimptoot staan by x = ${C(nf.asymX)}, maar die vergelyking sê x = ${C(ns.asymX)}.`),
      B("The denominator is (x − p), so a cross left of the y-axis gives a PLUS below.",
        "Die noemer is (x − p), so 'n kruis links van die y-as gee 'n PLUS onder."),
    ];
  }
  if (kind === "qc" && cv.kind === "parabola") {
    return [
      B(`The number behind the bracket is the turning point's y: ${C(nf.q)}, not ${C(ns.q)}.`,
        `Die getal agter die hakie is die draaipunt se y: ${C(nf.q)}, nie ${C(ns.q)} nie.`),
      B(`${C(ns.q)} is where the curve cuts the y-axis — a different reading altogether.`,
        `${C(ns.q)} is waar die kurwe die y-as sny — 'n heel ander aflesing.`),
    ];
  }
  if (kind === "qc") {
    const key = "asymY";
    return [
      B(`The asymptote lies at y = ${C(nf[key])}, but the equation says y = ${C(ns[key])}.`,
        `Die asimptoot lê by y = ${C(nf[key])}, maar die vergelyking sê y = ${C(ns[key])}.`),
      B(`${C(ns[key])} is where the curve cuts the y-axis — the shift and the y-intercept are two different readings.`,
        `${C(ns[key])} is waar die kurwe die y-as sny — die skuif en die y-afsnit is twee verskillende aflesings.`),
    ];
  }
  if (kind === "asymSwap") {
    return [
      B(`The vertical asymptote stands at x = ${C(nf.asymX)} and the horizontal one lies at y = ${C(nf.asymY)}.`,
        `Die vertikale asimptoot staan by x = ${C(nf.asymX)} en die horisontale een lê by y = ${C(nf.asymY)}.`),
      B("The equation has them the other way around — the x-one and the y-one are swapped.",
        "Die vergelyking het hulle andersom — die x-een en die y-een is omgeruil."),
    ];
  }
  if (kind === "aFlip") {
    if (cv.kind === "parabola") {
      return [B(`The arms point ${nf.aSign > 0 ? "up" : "down"}, so a is ${nf.aSign > 0 ? "positive" : "negative"} — the equation says the opposite.`,
                `Die arms wys ${nf.aSign > 0 ? "op" : "af"}, dus is a ${nf.aSign > 0 ? "positief" : "negatief"} — die vergelyking sê die teenoorgestelde.`)];
    }
    if (cv.kind === "hyperbola") {
      return [nf.aSign > 0
        ? B("The wings lie top-right and bottom-left, so a is positive — the equation says the opposite.",
            "Die vlerkies lê regs-bo en links-onder, dus is a positief — die vergelyking sê die teenoorgestelde.")
        : B("The wings lie top-left and bottom-right, so a is negative — the equation says the opposite.",
            "Die vlerkies lê links-bo en regs-onder, dus is a negatief — die vergelyking sê die teenoorgestelde.")];
    }
    if (cv.kind === "semicircle") {
      return [B(`The half circle lies ${nf.aSign > 0 ? "above" : "below"} the x-axis, so the root ${nf.aSign > 0 ? "has no minus in front" : "has a minus in front"} — the equation says the opposite.`,
                `Die halwe sirkel lê ${nf.aSign > 0 ? "bo" : "onder"} die x-as, dus ${nf.aSign > 0 ? "staan daar geen minus voor die wortel nie" : "staan daar 'n minus voor die wortel"} — die vergelyking sê die teenoorgestelde.`)];
    }
    return [B(`The curve lies ${nf.aSign > 0 ? "above" : "below"} its asymptote, so a is ${nf.aSign > 0 ? "positive" : "negative"} — the equation says the opposite.`,
              `Die kurwe lê ${nf.aSign > 0 ? "bo" : "onder"} sy asimptoot, dus is a ${nf.aSign > 0 ? "positief" : "negatief"} — die vergelyking sê die teenoorgestelde.`)];
  }
  if (kind === "bFlip") {
    const grows = nf.bDir > 0;
    return [
      B(`The curve ${grows ? "takes off to the right" : "lands to the right"}, so the base is ${grows ? "bigger" : "smaller"} than 1 — the equation says the other one.`,
        `Die kurwe ${grows ? "styg op na regs" : "land na regs"}, dus is die grondtal ${grows ? "groter" : "kleiner"} as 1 — die vergelyking sê die ander een.`),
      B("Careful with the spelling: (½)ˣ and 2⁻ˣ are the SAME graph. It is the direction that has to change, not the writing.",
        "Wees versigtig met die skryfwyse: (½)ˣ en 2⁻ˣ is DIESELFDE grafiek. Dis die rigting wat moet verander, nie die skryfwyse nie."),
    ];
  }
  return [];
}

/* the wrong-verdict nudge (Law 6 scaffold caption) — never names the
   feature, only says where to look, because the learner still has the
   naming question ahead of them */
export const LOOK_AGAIN = B("The dashed curve is what the equation actually draws. Look at where it leaves the sketch behind.",
                            "Die stippellyn-kurwe is wat die vergelyking werklik teken. Kyk waar dit van die skets af wegbreek.");
export const LOOK_AGAIN_OK = B("They really do match — the dashed curve lies on the sketch all the way.",
                               "Hulle pas werklik — die stippellyn-kurwe lê heelpad op die skets.");
