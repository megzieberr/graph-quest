/* Number formatting for South African school convention:
   decimal COMMA and a real minus sign (−, U+2212) — never a hyphen.
   (blipwork bug #5: plain hyphens leaked into 6 skills before this.) */

export function fmtComma(v, dp) {
  if (v == null || !Number.isFinite(v)) return String(v);
  let s;
  if (dp == null) {
    // tidy: drop float fuzz, keep up to 3 decimals, no trailing zeros
    const r = Math.round(v * 1000) / 1000;
    s = String(Object.is(r, -0) ? 0 : r);
  } else {
    s = (Math.round(v * 10 ** dp) / 10 ** dp).toFixed(dp);
  }
  return s.replace(".", ",").replace(/^-/, "−");
}

/* is this float effectively an integer? */
export const isInt = (v) => Number.isFinite(v) && Math.abs(v - Math.round(v)) < 1e-9;
/* compare with tolerance */
export const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
