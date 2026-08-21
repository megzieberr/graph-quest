# Her board method for Ongelykhede 2 — the reteach (2026-08-21)

Source: `funksies-grafieklees_260821_195131.pdf` (repo root, 4 pages, her own
board sketches). Sent mid-playtest of qI after finding #4 ("no man, something
went VERY wrong here"). **This file is the spec for the qI R1 rebuild — where
the code disagrees with these pages, the pages win.**

The worked example on every page: f = hyperbola with x-intercept (−8; 0),
vertical asymptote ON the y-axis, horizontal asymptote y = 1; g = the straight
line through O. (Her hand example puts f's asymptote on the axis; generated
rounds keep the off-axis rule — the METHOD is what this file records.)

## Page 1 — f(x) > 0 / f(x) < 0 (single function)

- Solid vertical cut lines through EVERY x-intercept and asymptote of f.
- Sections numbered ① ② ③ across the top, each with its interval written
  out underneath: "x < −8", "−8 < x < 0", "x > 0".
- f's sign is painted as a trail of small + / − marks riding ALONGSIDE the
  curve itself, section by section (purple in her pages).
- THE ANSWER IS READ OFF THE X-AXIS: yellow highlighter along the axis over
  the winning sections, and the winning section numbers circled.

## Page 2 — x·f(x) > 0 / x·f(x) < 0 ⟵ THE R1 PAGE

- **There is NO line y = x. Ever.** The sketch is f alone (plus whatever the
  original figure had). The app's R1 drew "x" as a red line y = x — that is
  finding #4 and it is wrong.
- Cut lines: f's x-intercepts + f's asymptotes + the y-axis (x's own sign
  boundary). Forgetting the y-axis line stays THE teaching moment.
- **TWO sign-rows, BOTH riding along f's curve, side by side:** f's row in
  one colour (purple), x's row in a second colour (red). x's row carries the
  sign of the INPUT — − alongside every part of f left of the y-axis, +
  right of it — while hugging f's shape.
- **The header colour-codes the rows:** she writes "x·f(x) > 0" with the "x"
  in red and "f(x)" in purple — the question itself tells you which sign-row
  is which. The app's stem should do the same.
- Read-off: same signs in both rows → product +, different → − (the
  kwadrant 1/3 vs 2/4 wording stays in the teach text).
- Answer: yellow on the x-axis + circled section numbers, as on page 1.

## Page 3 — f(x)·g(x) > 0 / < 0

- Cut lines through f's zero, f's asymptote AND g's zero (her example has
  the last two coincide at O; she still shows both). Four sections.
- Each curve carries ITS OWN sign trail in its own colour: f's along f
  (purple), g's along g (red). Compare per section, answer on the axis.
- This is what qI's R2/R3 already structurally do (marks on each curve) —
  consistent; their bugs are mechanical (findings #2, #3), not method.

## Page 4 — f(x) > g(x) / f(x) < g(x)

- Different variant (quest 6's Bo of onder territory): cut lines through
  every INTERSECTION of f and g; the curves themselves are traced in two
  colours (f red, g green) and you read where one rides above the other.
  Confirms quest 6's existing mechanic — no change there.

## What the qI rebuild takes from this

1. R1: delete the y = x line and everything downstream of it. x's sign-row
   becomes a second, differently-coloured row of tap boxes anchored NEXT TO
   f's boxes in each section (the existing 26px spread), labelled "x".
2. Stem colour-coding: "x" wears x's row colour, "f(x)" wears f's, in the
   prompt — her headers do exactly this.
3. Cut sockets for R1: f's zeros + f's asymptotes + the y-axis. Unchanged.
4. Answer presentation: prefer her axis-highlight — the winning sections
   shaded/highlighted along the x-axis in the solution render (the intro's
   beat 5 already shades; reuse).
5. Sections keep their circled numbers with intervals written out.

## Her clarification (same evening, in chat)

The trails of many little + / − marks on the pages are a PAPER affordance —
"the kids only need to pick one sign per section." In the app:

- ONE tap-box per row per section (the existing box mechanic is right).
- The draggable scan line is the app-native replacement for the trail:
  "you can literally drag the line through and see the sign changes."
  Dragging through a cut line is where a learner WATCHES the sign flip —
  same spirit as her qK line-everywhere ruling (the line teaches their
  eyes). The sweep step is not a formality; it is the seeing.

## Her ruling on the sweep (same evening — "Yes, this is what I want")

**The sweep is LIVE, not a confirm-pass.** As the line drags, the sign pair
at the line's position shows live — x-row and f-row (f-row and g-row in
quotient rounds), colour-coded to match the rows and the stem — flipping
visibly each time the line crosses a cut. The line stays draggable both ways.

## HER FINAL CALL (same evening) — the boxes are OUT for qI

Seeing the boxes in the app changed her mind: "even after you fix it, it
won't have the same effect. The effect we make on paper is the trail of
+ and − signs but the app is dynamic so this will work better." So for qI:

- **No tap-boxes.** The learner places the cut lines (sockets stay — that
  is step 1 of her method and was never the complaint), then DRAGS the
  scan line through the picture; the drag deposits the colour-coded sign
  trail along the curve as it passes — the paper effect, produced
  dynamically — and the pair at the line's leading edge shows live.
- The learner's commitment moves to the answer step (the interval pick,
  endpoint discipline included). The paint-it-yourself sign skill stays
  taught where it lives today: quest 5.
- **Process ruling: prototype FIRST.** One single round built this way →
  her phone-test → only then the full qI redesign. "Before redesigning
  everything, let's make one round, just one, with this new approach."
