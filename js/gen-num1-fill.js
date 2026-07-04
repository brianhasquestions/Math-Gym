// gen-num1-fill.js
// Self-contained generator pack for the first four Numerical Methods topics:
//   - numerical-methods.error-and-floating-point       (nm1-abs-rel-*, nm1-sigfig-*, nm1-error-prop-*, nm1-float-*)
//   - numerical-methods.root-finding-bracketing         (nm1-signchange-*, nm1-bisection-*, nm1-falsepos-*, nm1-bisect-count-*)
//   - numerical-methods.root-finding-open               (nm1-newton-*, nm1-secant-*, nm1-fixedpoint-*, nm1-order-*)
//   - numerical-methods.interpolation                   (nm1-linterp-*, nm1-lagrange-*, nm1-divdiff-*, nm1-interp-error-*)
// One generator per (concept, difficulty) — 48 total. Exports a `fill` map of
// template-name -> generator fn matching the shape used by js/generator.js.
// Deterministic from the passed rng only; no imports from generator.js.
//
// ROUNDING DISCIPLINE: every generator that reports a rounded decimal computes
// that decimal with the same rounding the instruction states, then feeds the
// SAME string as the step answer. To avoid float drift we round through an
// integer grid (Math.round(v * 10^k) / 10^k) and always take toFixed(k).

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

// Round v to k decimals through an integer grid; never emit "-0.00".
const rnd = (v, k) => {
  let n = Math.round(v * Math.pow(10, k)) / Math.pow(10, k);
  let s = n.toFixed(k);
  if (parseFloat(s) === 0) s = (0).toFixed(k);
  return s;
};
// Generous neighbours for a rounded decimal: one more decimal place + the
// trailing-zero and off-by-one-ulp variants the tight grader may need.
const nbrs = (v, k) => {
  const out = new Set();
  out.add(rnd(v, k + 1));
  out.add(rnd(v, k > 0 ? k - 1 : 0));
  // plain-integer form when the value is integral
  if (Math.abs(v - Math.round(v)) < 1e-9) out.add(`${Math.round(v)}`);
  return [...out];
};
// Signed number for inline prose: sgn(3) -> "+ 3", sgn(-3) -> "- 3".
const sgn = (n) => (n >= 0 ? `+ ${n}` : `- ${-n}`);
// A degree-2 polynomial "a x^2 + b x + c" as a plain string (a may be 1).
const polyABC = (a, b, c) => {
  let s = a === 1 ? "x^2" : a === -1 ? "-x^2" : `${a}x^2`;
  if (b !== 0) s += b > 0 ? ` + ${b === 1 ? "" : b}x` : ` - ${b === -1 ? "" : -b}x`;
  if (c !== 0) s += c > 0 ? ` + ${c}` : ` - ${-c}`;
  return s;
};

export const fill = {};

// ===========================================================================
// TOPIC 1: numerical-methods.error-and-floating-point
// ===========================================================================

// --- absolute-and-relative-error -------------------------------------------

// d1: absolute error only.
fill["nm1-abs-rel-error-1"] = (rng, idx) => {
  const exact = rng.int(20, 90);
  const err = rng.pick([1, 2, 3, 4, 5]);
  const approx = exact + rng.pick([-1, 1]) * err;
  return {
    id: `gen.nm1-abs-rel-error-1.${idx}`, generated: true, concepts: ["absolute-and-relative-error"], difficulty: 1, context: "abstract",
    prompt: `A true value is $${exact}$ and a measurement gives $${approx}$. Compute the absolute error $|\\text{true} - \\text{approx}|$.`,
    steps: [
      { instruction: `Subtract and take the absolute value: $|${exact} - ${approx}|$.`, answer: `${err}`, accept: [], hint: "Absolute error ignores the sign of the difference." },
    ],
    finalAnswer: { value: `${err}`, unit: "" },
    solutionNarrative: `Absolute error $= |${exact} - ${approx}| = ${err}$.`,
  };
};

// d2: absolute AND relative error, relative as a rounded decimal.
fill["nm1-abs-rel-error-2"] = (rng, idx) => {
  const exact = rng.pick([50, 80, 100, 125, 200, 250]);
  const abs = rng.pick([1, 2, 4, 5]);
  const approx = exact - abs;
  const rel = abs / exact;
  return {
    id: `gen.nm1-abs-rel-error-2.${idx}`, generated: true, concepts: ["absolute-and-relative-error"], difficulty: 2, context: "abstract",
    prompt: `A quantity's true value is $${exact}$ but it is estimated as $${approx}$. Find the absolute error, then the relative error $\\dfrac{|\\text{true}-\\text{approx}|}{|\\text{true}|}$ rounded to 4 decimals.`,
    steps: [
      { instruction: `Compute the absolute error $|${exact} - ${approx}|$.`, answer: `${abs}`, accept: [], hint: "Just the size of the gap." },
      { instruction: `Divide by the true value: $\\dfrac{${abs}}{${exact}}$. Round to 4 decimals.`, answer: rnd(rel, 4), accept: nbrs(rel, 4), hint: `$${abs} \\div ${exact}$.` },
    ],
    finalAnswer: { value: rnd(rel, 4), unit: "" },
    solutionNarrative: `Absolute error $= ${abs}$; relative error $= \\frac{${abs}}{${exact}} \\approx ${rnd(rel, 4)}$.`,
  };
};

// d3: relative error as a percentage, applied.
fill["nm1-abs-rel-error-3"] = (rng, idx) => {
  const exact = rng.pick([250, 400, 500, 800, 1200, 1500]);
  const abs = rng.pick([3, 5, 8, 10, 12]);
  const approx = exact + abs;
  const relPct = (abs / exact) * 100;
  const ctx = rng.pick([
    { what: "A bridge cable's rated load", unit: "kN" },
    { what: "A machined shaft's target length", unit: "mm" },
    { what: "A batch's specified mass", unit: "g" },
  ]);
  return {
    id: `gen.nm1-abs-rel-error-3.${idx}`, generated: true, concepts: ["absolute-and-relative-error"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} is $${exact}$ ${ctx.unit}, but the delivered part reads $${approx}$ ${ctx.unit}. Report the relative error as a percentage, rounded to 2 decimals.`,
    steps: [
      { instruction: `Absolute error $= |${exact} - ${approx}|$. Compute it.`, answer: `${abs}`, accept: [], hint: "Size of the discrepancy." },
      { instruction: `Relative error $= \\dfrac{${abs}}{${exact}}$; multiply by 100 for a percent. Round to 2 decimals.`, answer: rnd(relPct, 2), accept: nbrs(relPct, 2), hint: `$\\frac{${abs}}{${exact}} \\times 100$.` },
    ],
    finalAnswer: { value: rnd(relPct, 2), unit: "%" },
    solutionNarrative: `Relative error $= \\frac{${abs}}{${exact}} \\times 100 \\approx ${rnd(relPct, 2)}\\%$ — small parts tolerate larger absolute slips than small ones.`,
  };
};

// --- significant-figures-and-rounding --------------------------------------

// d1: round a decimal to a stated number of decimals.
fill["nm1-sigfig-round-1"] = (rng, idx) => {
  const whole = rng.int(1, 9);
  const frac = rng.int(1000, 9999); // 4 fractional digits
  const v = whole + frac / 10000;
  return {
    id: `gen.nm1-sigfig-round-1.${idx}`, generated: true, concepts: ["significant-figures-and-rounding"], difficulty: 1, context: "abstract",
    prompt: `Round $${v.toFixed(4)}$ to 2 decimal places.`,
    steps: [
      { instruction: `Look at the third decimal to decide rounding, then give $${v.toFixed(4)}$ to 2 decimals.`, answer: rnd(v, 2), accept: nbrs(v, 2), hint: "5 or more rounds up; 4 or less rounds down." },
    ],
    finalAnswer: { value: rnd(v, 2), unit: "" },
    solutionNarrative: `$${v.toFixed(4)}$ rounds to $${rnd(v, 2)}$ at 2 decimals.`,
  };
};

// d2: count significant figures (menu-ish via a number answer).
fill["nm1-sigfig-round-2"] = (rng, idx) => {
  const pick = rng.pick([
    { s: "0.00450", n: 3 }, { s: "3.140", n: 4 }, { s: "1200.0", n: 5 },
    { s: "0.0067", n: 2 }, { s: "50.020", n: 5 }, { s: "0.105", n: 3 },
  ]);
  return {
    id: `gen.nm1-sigfig-round-2.${idx}`, generated: true, concepts: ["significant-figures-and-rounding"], difficulty: 2, context: "abstract",
    prompt: `How many significant figures does $${pick.s}$ have?`,
    steps: [
      { instruction: `Count significant figures in $${pick.s}$ (leading zeros don't count; trailing zeros after a decimal point do).`, answer: `${pick.n}`, accept: [], hint: "Start counting at the first nonzero digit; a trailing zero right of the decimal is significant." },
    ],
    finalAnswer: { value: `${pick.n}`, unit: "" },
    solutionNarrative: `$${pick.s}$ carries $${pick.n}$ significant figures.`,
  };
};

// d3: round to a stated number of significant figures.
fill["nm1-sigfig-round-3"] = (rng, idx) => {
  const v = rng.int(31000, 98000) / 100; // e.g. 471.23
  const sig = 3;
  // round to 3 sig figs: magnitude is hundreds, so round to nearest whole.
  const rounded = Math.round(v);
  return {
    id: `gen.nm1-sigfig-round-3.${idx}`, generated: true, concepts: ["significant-figures-and-rounding"], difficulty: 3, context: "abstract",
    prompt: `Round $${v.toFixed(2)}$ to 3 significant figures.`,
    steps: [
      { instruction: `The first 3 significant figures live in the hundreds, tens, and units place, so round $${v.toFixed(2)}$ to the nearest whole number.`, answer: `${rounded}`, accept: [`${rounded}.0`, `${rounded}.00`], hint: "The 4th significant figure is the first decimal — round on it." },
    ],
    finalAnswer: { value: `${rounded}`, unit: "" },
    solutionNarrative: `Three significant figures of $${v.toFixed(2)}$ is $${rounded}$.`,
  };
};

// --- error-propagation -----------------------------------------------------

// d1: error adds under addition.
fill["nm1-error-prop-1"] = (rng, idx) => {
  const ea = rng.pick([0.1, 0.2, 0.3, 0.5]);
  const eb = rng.pick([0.1, 0.2, 0.4, 0.5]);
  const tot = Math.round((ea + eb) * 10) / 10;
  return {
    id: `gen.nm1-error-prop-1.${idx}`, generated: true, concepts: ["error-propagation"], difficulty: 1, context: "abstract",
    prompt: `Two measured lengths have absolute errors $${ea}$ and $${eb}$. When you ADD the lengths, the worst-case absolute error is the SUM of the errors. Find it.`,
    steps: [
      { instruction: `Add the two absolute errors: $${ea} + ${eb}$.`, answer: rnd(tot, 1), accept: nbrs(tot, 1), hint: "Under addition (or subtraction) absolute errors add." },
    ],
    finalAnswer: { value: rnd(tot, 1), unit: "" },
    solutionNarrative: `Adding two quantities adds their absolute errors: $${ea} + ${eb} = ${rnd(tot, 1)}$.`,
  };
};

// d2: relative errors add under multiplication.
fill["nm1-error-prop-2"] = (rng, idx) => {
  const ra = rng.pick([0.01, 0.02, 0.03, 0.05]);
  const rb = rng.pick([0.01, 0.02, 0.04]);
  const tot = Math.round((ra + rb) * 1000) / 1000;
  return {
    id: `gen.nm1-error-prop-2.${idx}`, generated: true, concepts: ["error-propagation"], difficulty: 2, context: "abstract",
    prompt: `A rectangle's side measurements carry relative errors $${ra}$ and $${rb}$. When you MULTIPLY (to get area), RELATIVE errors add. Find the relative error of the area. Round to 3 decimals.`,
    steps: [
      { instruction: `Add the two relative errors: $${ra} + ${rb}$. Round to 3 decimals.`, answer: rnd(tot, 3), accept: nbrs(tot, 3), hint: "For products and quotients, add the RELATIVE errors (not the absolute ones)." },
    ],
    finalAnswer: { value: rnd(tot, 3), unit: "" },
    solutionNarrative: `Multiplication adds relative errors: $${ra} + ${rb} = ${rnd(tot, 3)}$ — about $${rnd(tot * 100, 1)}\\%$.`,
  };
};

// d3: propagate through a product numerically (abs error of a product).
fill["nm1-error-prop-3"] = (rng, idx) => {
  const a = rng.int(4, 12);
  const b = rng.int(3, 9);
  const ra = rng.pick([0.01, 0.02, 0.05]);
  const rb = rng.pick([0.01, 0.02, 0.03]);
  const area = a * b;
  const relTot = Math.round((ra + rb) * 1000) / 1000;
  const absTot = area * relTot;
  return {
    id: `gen.nm1-error-prop-3.${idx}`, generated: true, concepts: ["error-propagation"], difficulty: 3, context: "applied",
    prompt: `A plate measures $${a}$ by $${b}$ (area $= ${area}$). The length has relative error $${ra}$ and the width $${rb}$. Estimate the ABSOLUTE error in the area. Round to 2 decimals.`,
    steps: [
      { instruction: `First add the relative errors: $${ra} + ${rb}$. Round to 3 decimals.`, answer: rnd(relTot, 3), accept: nbrs(relTot, 3), hint: "Products add relative errors." },
      { instruction: `Multiply the area $${area}$ by that relative error to get the absolute error. Round to 2 decimals.`, answer: rnd(absTot, 2), accept: nbrs(absTot, 2), hint: `$${area} \\times ${rnd(relTot, 3)}$.` },
    ],
    finalAnswer: { value: rnd(absTot, 2), unit: "" },
    solutionNarrative: `Relative error of the area $= ${ra} + ${rb} = ${rnd(relTot, 3)}$; absolute error $= ${area} \\times ${rnd(relTot, 3)} \\approx ${rnd(absTot, 2)}$.`,
  };
};

// --- floating-point-and-machine-epsilon ------------------------------------

// d1: menu — what causes precision loss? (representation / cancellation).
fill["nm1-float-1"] = (rng, idx) => {
  const pick = rng.pick([
    {
      q: "Subtracting two nearly-equal numbers, so their leading digits cancel and few significant digits survive",
      ans: "catastrophic cancellation", accept: ["cancellation", "catastrophic-cancellation"],
      others: "rounding to the nearest representable value / overflow to infinity",
    },
    {
      q: "A finite number of bits cannot represent every real number exactly, so most values are stored as the nearest representable one",
      ans: "round-off error", accept: ["roundoff error", "round off error", "rounding error"],
      others: "catastrophic cancellation / overflow",
    },
  ]);
  return {
    id: `gen.nm1-float-1.${idx}`, generated: true, concepts: ["floating-point-and-machine-epsilon"], difficulty: 1, context: "abstract",
    prompt: `Which floating-point phenomenon is being described? "${pick.q}." Answer one of: round-off error, catastrophic cancellation, overflow.`,
    steps: [
      { instruction: `Name the phenomenon (round-off error, catastrophic cancellation, or overflow).`, answer: pick.ans, accept: pick.accept, hint: `Contrast it with: ${pick.others}.` },
    ],
    finalAnswer: { value: pick.ans, unit: "" },
    solutionNarrative: `The description matches ${pick.ans}.`,
  };
};

// d2: numeric — machine epsilon size / representable gap via 2^-p.
fill["nm1-float-2"] = (rng, idx) => {
  const p = rng.pick([10, 12, 16, 20]);
  const eps = Math.pow(2, -p);
  return {
    id: `gen.nm1-float-2.${idx}`, generated: true, concepts: ["floating-point-and-machine-epsilon"], difficulty: 2, context: "abstract",
    prompt: `A toy floating-point format keeps $${p}$ bits after the binary point of the mantissa, so its machine epsilon (the gap above 1) is $2^{-${p}}$. Compute $2^{-${p}}$ in scientific-ish decimal, rounded to 8 decimals.`,
    steps: [
      { instruction: `Evaluate $2^{-${p}}$. Round to 8 decimals.`, answer: rnd(eps, 8), accept: [`2^(-${p})`, `1/${Math.pow(2, p)}`, ...nbrs(eps, 8)], hint: `$2^{-${p}} = 1 / 2^{${p}} = 1/${Math.pow(2, p)}$.` },
    ],
    finalAnswer: { value: rnd(eps, 8), unit: "" },
    solutionNarrative: `Machine epsilon $= 2^{-${p}} = 1/${Math.pow(2, p)} \\approx ${rnd(eps, 8)}$: the smallest gap the format can resolve just above 1.`,
  };
};

// d3: catastrophic cancellation — significant digits lost when subtracting.
fill["nm1-float-3"] = (rng, idx) => {
  // two 6-sig-fig numbers agreeing in the first k digits; result keeps (6-k) sig figs.
  const k = rng.pick([3, 4]);
  const lead = rng.int(100, 999); // shared leading 3 digits
  const tailA = rng.int(10, 99);
  const tailB = tailA - rng.int(1, 9);
  // build numbers like 1.234 56 vs 1.234 41
  const a = lead / 1000 + tailA / 100000;
  const b = lead / 1000 + tailB / 100000;
  const diff = Math.round((a - b) * 100000) / 100000;
  const sigLost = k; // roughly k leading digits cancel
  return {
    id: `gen.nm1-float-3.${idx}`, generated: true, concepts: ["floating-point-and-machine-epsilon"], difficulty: 3, context: "abstract",
    prompt: `Two 6-significant-figure values are $a = ${a.toFixed(5)}$ and $b = ${b.toFixed(5)}$. They agree in their leading digits. Compute $a - b$ (exact), then note how cancellation destroys precision.`,
    steps: [
      { instruction: `Subtract: $${a.toFixed(5)} - ${b.toFixed(5)}$. Round to 5 decimals.`, answer: rnd(diff, 5), accept: nbrs(diff, 5), hint: "Line up the decimals and subtract." },
      { instruction: `The two inputs shared their first ${sigLost} significant digits, which cancelled. Roughly how many significant digits does the difference retain? (6 minus the ${sigLost} that cancelled.)`, answer: `${6 - sigLost}`, accept: [], hint: `$6 - ${sigLost}$.` },
    ],
    finalAnswer: { value: rnd(diff, 5), unit: "" },
    solutionNarrative: `$a - b = ${rnd(diff, 5)}$. The shared leading digits cancel, so only about $${6 - sigLost}$ significant digits of accuracy survive — the hallmark of catastrophic cancellation.`,
  };
};

// ===========================================================================
// TOPIC 2: numerical-methods.root-finding-bracketing
// ===========================================================================

// f(x) = x^2 - N type helpers. We use integer-friendly polynomials so f-values
// are exact and sign changes are unambiguous.

// --- sign-change-and-ivt ---------------------------------------------------

// d1: menu — which of two intervals brackets a root of x^2 - N.
fill["nm1-signchange-1"] = (rng, idx) => {
  const N = rng.pick([2, 3, 5, 6, 7, 8, 10, 15]);
  const r = Math.sqrt(N);
  const lo = Math.floor(r);            // f(lo) < 0
  const hi = lo + 1;                   // f(hi) > 0
  const bad = rng.pick([[lo + 1, lo + 3], [lo - 2, lo - 1]]); // no sign change
  const optA = `[${lo}, ${hi}]`, optB = `[${bad[0]}, ${bad[1]}]`;
  return {
    id: `gen.nm1-signchange-1.${idx}`, generated: true, concepts: ["sign-change-and-ivt"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = x^2 - ${N}$, which interval brackets a root? A root is bracketed when $f$ changes sign across the interval. Options: $A = ${optA}$ or $B = ${optB}$. Answer A or B.`,
    steps: [
      { instruction: `Check the signs of $f$ at the endpoints of each interval. Which interval shows a sign change? Answer A or B.`, answer: "A", accept: ["a", optA], hint: `$f(${lo}) = ${lo * lo - N}$ (negative) and $f(${hi}) = ${hi * hi - N}$ (positive) — opposite signs.` },
    ],
    finalAnswer: { value: "A", unit: "" },
    solutionNarrative: `$f(${lo}) = ${lo * lo - N} < 0$ and $f(${hi}) = ${hi * hi - N} > 0$: interval $A$ brackets the root by the Intermediate Value Theorem.`,
  };
};

// d2: numeric — evaluate f at both endpoints and report the product's sign.
fill["nm1-signchange-2"] = (rng, idx) => {
  const a = rng.int(-3, 0);
  const c = rng.int(1, 3);
  const k = rng.int(1, 4);
  // f(x) = x^2 + k x + m chosen so it has a root in (a, c): pick m so f(a)*f(c) < 0.
  // Simpler: f(x) = x^3 - K with a real root between a and c is messy; use (x - root) form.
  // Use f(x) = x^2 - N with N between a^2.. ensure sign change; fall back to linear-ish.
  const N = rng.pick([2, 5, 7, 11]);
  const fa = a * a - N, fc = c * c - N;
  // guarantee a sign change by construction: choose a=-? no. Instead evaluate given a<0<c around sqrt.
  // Use interval [1, 3] style with N in between to be safe:
  const lo = 1, hi = 3;
  const flo = lo * lo - N, fhi = hi * hi - N;
  const prod = flo * fhi;
  return {
    id: `gen.nm1-signchange-2.${idx}`, generated: true, concepts: ["sign-change-and-ivt"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = x^2 - ${N}$ on $[${lo}, ${hi}]$, evaluate $f$ at both endpoints and multiply. If the product is negative, a root is bracketed.`,
    steps: [
      { instruction: `Compute $f(${lo}) = ${lo}^2 - ${N}$.`, answer: `${flo}`, accept: [], hint: `$${lo * lo} - ${N}$.` },
      { instruction: `Compute $f(${hi}) = ${hi}^2 - ${N}$.`, answer: `${fhi}`, accept: [], hint: `$${hi * hi} - ${N}$.` },
      { instruction: `Multiply $f(${lo}) \\cdot f(${hi})$.`, answer: `${prod}`, accept: [], hint: `$(${flo})(${fhi})$.` },
    ],
    finalAnswer: { value: `${prod}`, unit: "" },
    solutionNarrative: `$f(${lo}) = ${flo}$, $f(${hi}) = ${fhi}$; their product $${prod} < 0$ confirms a sign change, so a root lies in $[${lo}, ${hi}]$.`,
  };
};

// d3: IVT applied — a cooling/force model crosses a target; identify bracket.
fill["nm1-signchange-3"] = (rng, idx) => {
  const target = rng.pick([50, 60, 75, 100]);
  // g(t) = a t^2 with a chosen so g crosses target between t=lo and t=hi
  const lo = rng.int(2, 4);
  const hi = lo + 1;
  const a = rng.pick([6, 8, 10, 12]);
  // ensure a*lo^2 < target < a*hi^2
  const glo = a * lo * lo, ghi = a * hi * hi;
  return {
    id: `gen.nm1-signchange-3.${idx}`, generated: true, concepts: ["sign-change-and-ivt"], difficulty: 3, context: "applied",
    prompt: `A load builds up as $g(t) = ${a}t^2$ (kN) after $t$ seconds and we want the instant it first reaches $${target}$ kN — i.e. a root of $f(t) = ${a}t^2 - ${target}$. Confirm this root lies in $[${lo}, ${hi}]$ using the sign change.`,
    steps: [
      { instruction: `Compute $f(${lo}) = ${a}\\cdot${lo}^2 - ${target}$.`, answer: `${glo - target}`, accept: [], hint: `$${a} \\times ${lo * lo} - ${target}$.` },
      { instruction: `Compute $f(${hi}) = ${a}\\cdot${hi}^2 - ${target}$.`, answer: `${ghi - target}`, accept: [], hint: `$${a} \\times ${hi * hi} - ${target}$.` },
      { instruction: `Do the endpoint values have opposite signs, so a root is bracketed? Answer yes or no.`, answer: "yes", accept: ["y"], hint: `One value is negative and the other positive.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$f(${lo}) = ${glo - target} < 0$ and $f(${hi}) = ${ghi - target} > 0$: by the IVT the load reaches $${target}$ kN somewhere in $[${lo}, ${hi}]$.`,
  };
};

// --- bisection-iteration ---------------------------------------------------

// d1: compute the midpoint of a bracket.
fill["nm1-bisection-1"] = (rng, idx) => {
  const a = rng.int(0, 4);
  const b = a + rng.pick([2, 4]);
  const mid = (a + b) / 2;
  return {
    id: `gen.nm1-bisection-1.${idx}`, generated: true, concepts: ["bisection-iteration"], difficulty: 1, context: "abstract",
    prompt: `Bisection starts by testing the midpoint of the bracket $[${a}, ${b}]$. Compute the midpoint $\\dfrac{a + b}{2}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{${a} + ${b}}{2}$.`, answer: `${mid}`, accept: [], hint: `$(${a} + ${b}) \\div 2$.` },
    ],
    finalAnswer: { value: `${mid}`, unit: "" },
    solutionNarrative: `Midpoint $= \\frac{${a} + ${b}}{2} = ${mid}$ — the next point bisection tests.`,
  };
};

// d2: one bisection step — compute midpoint, its f-value, and which half to keep.
fill["nm1-bisection-2"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10, 15, 17]);
  const lo = Math.floor(Math.sqrt(N));
  const hi = lo + 2 - (lo + 2 - lo); // placeholder, fix below
  // Use a bracket of width 2 around sqrt(N): [lo-? ]; simplest: [1,3],[2,4] etc.
  const a = lo, b = lo + 2;
  const mid = (a + b) / 2;
  const fa = a * a - N, fmid = mid * mid - N;
  // If f(a) and f(mid) have opposite signs, root is in [a, mid]; else [mid, b].
  const keepLeft = fa * fmid < 0;
  const keep = keepLeft ? `[${a}, ${mid}]` : `[${mid}, ${b}]`;
  return {
    id: `gen.nm1-bisection-2.${idx}`, generated: true, concepts: ["bisection-iteration"], difficulty: 2, context: "abstract",
    prompt: `Bisect $f(x) = x^2 - ${N}$ on $[${a}, ${b}]$. Compute the midpoint, evaluate $f$ there, and decide which half to keep. (A root is between two points where $f$ has opposite signs.)`,
    steps: [
      { instruction: `Compute the midpoint $m = \\dfrac{${a} + ${b}}{2}$.`, answer: `${mid}`, accept: [], hint: `$(${a}+${b})/2$.` },
      { instruction: `Compute $f(${mid}) = ${mid}^2 - ${N}$.`, answer: `${fmid}`, accept: [], hint: `$${mid * mid} - ${N}$.` },
      { instruction: `$f(${a}) = ${fa}$. Since $f(${a})$ and $f(m)$ have ${keepLeft ? "opposite" : "the same"} signs, which half holds the root — the left half $[${a}, ${mid}]$ or the right half $[${mid}, ${b}]$? Answer left or right.`, answer: keepLeft ? "left" : "right", accept: keepLeft ? ["l", `[${a}, ${mid}]`] : ["r", `[${mid}, ${b}]`], hint: keepLeft ? "Opposite signs bracket the root: keep that side." : "Same sign means no root there: keep the other side." },
    ],
    finalAnswer: { value: keep, unit: "" },
    solutionNarrative: `Midpoint $${mid}$, $f(${mid}) = ${fmid}$. Comparing signs with $f(${a}) = ${fa}$, the root lies in ${keep}.`,
  };
};

// d3: two bisection steps — track the shrinking bracket, report the new midpoint.
fill["nm1-bisection-3"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10, 11]);
  let a = 1, b = 4; // width 3? choose width 4 for clean halves: [1,5]? use [1,4]-> mid 2.5
  a = 2; b = 4; // sqrt(N) with N in (4,16); width 2
  const m1 = (a + b) / 2;              // 3
  const fa = a * a - N, fm1 = m1 * m1 - N;
  let a2, b2;
  if (fa * fm1 < 0) { a2 = a; b2 = m1; } else { a2 = m1; b2 = b; }
  const m2 = (a2 + b2) / 2;
  return {
    id: `gen.nm1-bisection-3.${idx}`, generated: true, concepts: ["bisection-iteration"], difficulty: 3, context: "abstract",
    prompt: `Do TWO bisection steps for $f(x) = x^2 - ${N}$ starting from $[${a}, ${b}]$, and report the midpoint of the bracket after both steps.`,
    steps: [
      { instruction: `Step 1: midpoint $m_1 = \\dfrac{${a}+${b}}{2}$. Compute it.`, answer: `${m1}`, accept: [], hint: `$(${a}+${b})/2$.` },
      { instruction: `Step 1: $f(${a}) = ${fa}$ and $f(${m1}) = ${fm1}$. The new bracket is [${a2}, ${b2}]. Compute its midpoint $m_2$.`, answer: `${m2}`, accept: [], hint: `$(${a2}+${b2})/2$.` },
    ],
    finalAnswer: { value: `${m2}`, unit: "" },
    solutionNarrative: `Step 1 midpoint $${m1}$; the sign check keeps $[${a2}, ${b2}]$, whose midpoint is $${m2}$. Each step halves the interval.`,
  };
};

// --- false-position --------------------------------------------------------

// The regula-falsi update: c = b - f(b)*(b - a)/(f(b) - f(a)).
const falsePosC = (a, b, fa, fb) => b - fb * (b - a) / (fb - fa);

// d1: single false-position estimate on a linear-ish bracket.
fill["nm1-falsepos-1"] = (rng, idx) => {
  // f linear-ish: pick a, b and fa (neg), fb (pos).
  const a = rng.int(0, 2), b = a + rng.pick([2, 3]);
  const fa = -rng.int(1, 4), fb = rng.int(1, 4);
  const c = falsePosC(a, b, fa, fb);
  return {
    id: `gen.nm1-falsepos-1.${idx}`, generated: true, concepts: ["false-position"], difficulty: 1, context: "abstract",
    prompt: `False position joins $(a, f(a))$ and $(b, f(b))$ with a line and takes its x-intercept: $c = b - \\dfrac{f(b)\\,(b - a)}{f(b) - f(a)}$. With $a = ${a}$, $b = ${b}$, $f(a) = ${fa}$, $f(b) = ${fb}$, compute $c$. Round to 4 decimals.`,
    steps: [
      { instruction: `Plug in: $c = ${b} - \\dfrac{${fb}(${b} - ${a})}{${fb} - (${fa})}$. Round to 4 decimals.`, answer: rnd(c, 4), accept: nbrs(c, 4), hint: `Denominator $= ${fb} - (${fa}) = ${fb - fa}$.` },
    ],
    finalAnswer: { value: rnd(c, 4), unit: "" },
    solutionNarrative: `$c = ${b} - \\frac{${fb}(${b - a})}{${fb - fa}} = ${rnd(c, 4)}$.`,
  };
};

// d2: false-position on x^2 - N with actual f-values.
fill["nm1-falsepos-2"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10, 15]);
  const a = Math.floor(Math.sqrt(N));    // f(a) < 0
  const b = a + 2;                        // f(b) > 0
  const fa = a * a - N, fb = b * b - N;
  const c = falsePosC(a, b, fa, fb);
  return {
    id: `gen.nm1-falsepos-2.${idx}`, generated: true, concepts: ["false-position"], difficulty: 2, context: "abstract",
    prompt: `Apply one false-position step to $f(x) = x^2 - ${N}$ on $[${a}, ${b}]$. Round the new estimate to 4 decimals.`,
    steps: [
      { instruction: `Compute $f(${a}) = ${a}^2 - ${N}$.`, answer: `${fa}`, accept: [], hint: `$${a * a} - ${N}$.` },
      { instruction: `Compute $f(${b}) = ${b}^2 - ${N}$.`, answer: `${fb}`, accept: [], hint: `$${b * b} - ${N}$.` },
      { instruction: `Compute $c = ${b} - \\dfrac{${fb}(${b} - ${a})}{${fb} - (${fa})}$. Round to 4 decimals.`, answer: rnd(c, 4), accept: nbrs(c, 4), hint: `Denominator $= ${fb - fa}$.` },
    ],
    finalAnswer: { value: rnd(c, 4), unit: "" },
    solutionNarrative: `$f(${a}) = ${fa}$, $f(${b}) = ${fb}$, so $c = ${b} - \\frac{${fb}(${b - a})}{${fb - fa}} \\approx ${rnd(c, 4)}$ — closer to $\\sqrt{${N}} \\approx ${rnd(Math.sqrt(N), 4)}$ than the midpoint would be.`,
  };
};

// d3: two false-position steps.
fill["nm1-falsepos-3"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10]);
  const a = Math.floor(Math.sqrt(N));
  const b = a + 2;
  const fa = a * a - N, fb = b * b - N;
  const c1 = falsePosC(a, b, fa, fb);
  const fc1 = c1 * c1 - N;
  // root is where sign changes; f(a)<0, so if fc1>0 keep [a,c1], else [c1,b]
  let a2, b2, fa2, fb2;
  if (fa * fc1 < 0) { a2 = a; b2 = c1; fa2 = fa; fb2 = fc1; }
  else { a2 = c1; b2 = b; fa2 = fc1; fb2 = fb; }
  const c2 = falsePosC(a2, b2, fa2, fb2);
  return {
    id: `gen.nm1-falsepos-3.${idx}`, generated: true, concepts: ["false-position"], difficulty: 3, context: "abstract",
    prompt: `Do TWO false-position steps for $f(x) = x^2 - ${N}$ on $[${a}, ${b}]$. Report the second estimate, rounded to 4 decimals.`,
    steps: [
      { instruction: `First step: with $f(${a}) = ${fa}$, $f(${b}) = ${fb}$, compute $c_1 = ${b} - \\dfrac{${fb}(${b}-${a})}{${fb - fa}}$. Round to 4 decimals.`, answer: rnd(c1, 4), accept: nbrs(c1, 4), hint: `$c_1 = ${b} - \\frac{${fb}(${b - a})}{${fb - fa}}$.` },
      { instruction: `Now $f(c_1) = ${rnd(fc1, 4)}$ (${fc1 > 0 ? "positive" : "negative"}), so the new bracket is $[${rnd(a2, 4)}, ${rnd(b2, 4)}]$. Compute $c_2$. Round to 4 decimals.`, answer: rnd(c2, 4), accept: nbrs(c2, 4), hint: `Reapply the formula on the new bracket.` },
    ],
    finalAnswer: { value: rnd(c2, 4), unit: "" },
    solutionNarrative: `$c_1 \\approx ${rnd(c1, 4)}$, then reapplying on the retained bracket gives $c_2 \\approx ${rnd(c2, 4)}$, homing in on $\\sqrt{${N}} \\approx ${rnd(Math.sqrt(N), 4)}$.`,
  };
};

// --- convergence-and-iteration-count ---------------------------------------

// Bisection steps to reach tolerance: n = ceil(log2(width / tol)).
const bisectSteps = (width, tol) => Math.ceil(Math.log2(width / tol));

// d1: count steps for a simple width/tol.
fill["nm1-bisect-count-1"] = (rng, idx) => {
  const width = rng.pick([1, 2, 4, 8]);
  const tol = rng.pick([0.1, 0.01, 0.25, 0.5]);
  const n = bisectSteps(width, tol);
  return {
    id: `gen.nm1-bisect-count-1.${idx}`, generated: true, concepts: ["convergence-and-iteration-count"], difficulty: 1, context: "abstract",
    prompt: `Each bisection step halves the bracket. Starting from a bracket of width $${width}$, how many steps guarantee the width drops below $${tol}$? Use $n = \\lceil \\log_2(\\text{width}/\\text{tol}) \\rceil$.`,
    steps: [
      { instruction: `Compute $\\log_2\\!\\left(\\dfrac{${width}}{${tol}}\\right)$ and round UP to the next whole number.`, answer: `${n}`, accept: [], hint: `$\\frac{${width}}{${tol}} = ${width / tol}$; how many halvings get below 1?` },
    ],
    finalAnswer: { value: `${n}`, unit: "steps" },
    solutionNarrative: `$n = \\lceil \\log_2(${width}/${tol}) \\rceil = \\lceil \\log_2(${rnd(width / tol, 4)}) \\rceil = ${n}$ steps.`,
  };
};

// d2: count steps with less-round numbers.
fill["nm1-bisect-count-2"] = (rng, idx) => {
  const a = rng.int(0, 2), b = a + rng.pick([3, 5, 6]);
  const width = b - a;
  const tol = rng.pick([0.01, 0.001, 0.05]);
  const n = bisectSteps(width, tol);
  return {
    id: `gen.nm1-bisect-count-2.${idx}`, generated: true, concepts: ["convergence-and-iteration-count"], difficulty: 2, context: "abstract",
    prompt: `A root is bracketed in $[${a}, ${b}]$. How many bisection steps guarantee an interval narrower than the tolerance $${tol}$? Use $n = \\lceil \\log_2(\\text{width}/\\text{tol}) \\rceil$.`,
    steps: [
      { instruction: `The width is $${b} - ${a} = ${width}$. Compute $\\dfrac{${width}}{${tol}}$.`, answer: `${width / tol}`, accept: [rnd(width / tol, 2)], hint: `$${width} \\div ${tol}$.` },
      { instruction: `Take $\\log_2$ of that and round UP. How many steps?`, answer: `${n}`, accept: [], hint: `$\\log_2(${width / tol}) \\approx ${rnd(Math.log2(width / tol), 3)}$, ceiling it.` },
    ],
    finalAnswer: { value: `${n}`, unit: "steps" },
    solutionNarrative: `Width $${width}$, tolerance $${tol}$: $n = \\lceil \\log_2(${width / tol}) \\rceil = ${n}$ steps.`,
  };
};

// d3: applied — steps to a physical tolerance, plus the resulting error bound.
fill["nm1-bisect-count-3"] = (rng, idx) => {
  const width = rng.pick([2, 4, 5, 10]);
  const tol = rng.pick([0.001, 0.0005, 0.002]);
  const n = bisectSteps(width, tol);
  const finalWidth = width / Math.pow(2, n);
  return {
    id: `gen.nm1-bisect-count-3.${idx}`, generated: true, concepts: ["convergence-and-iteration-count"], difficulty: 3, context: "applied",
    prompt: `An engineer bisects a bracket of width $${width}$ (in mm) to locate a critical length to within $${tol}$ mm. Find the required number of steps, then the actual bracket width after that many steps.`,
    steps: [
      { instruction: `Steps: $n = \\lceil \\log_2(${width}/${tol}) \\rceil$. Compute $n$.`, answer: `${n}`, accept: [], hint: `$\\log_2(${width / tol}) \\approx ${rnd(Math.log2(width / tol), 3)}$, round up.` },
      { instruction: `After $${n}$ halvings the width is $\\dfrac{${width}}{2^{${n}}}$. Compute it, rounded to 6 decimals.`, answer: rnd(finalWidth, 6), accept: nbrs(finalWidth, 6), hint: `$${width} / ${Math.pow(2, n)}$.` },
    ],
    finalAnswer: { value: `${n}`, unit: "steps" },
    solutionNarrative: `$n = ${n}$ steps shrink the width to $${width}/2^{${n}} \\approx ${rnd(finalWidth, 6)}$ mm, safely below $${tol}$ mm.`,
  };
};

// ===========================================================================
// TOPIC 3: numerical-methods.root-finding-open
// ===========================================================================

// --- newton-iteration ------------------------------------------------------
// Newton: x1 = x0 - f(x0)/f'(x0). We give f and f' as formulas AND their values.

// d1: Newton for sqrt(N): f = x^2 - N, f' = 2x. One step from an integer x0.
fill["nm1-newton-1"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10, 15, 20, 30]);
  const x0 = Math.round(Math.sqrt(N)) + rng.pick([0, 1]);
  const fx = x0 * x0 - N;
  const fpx = 2 * x0;
  const x1 = x0 - fx / fpx;
  return {
    id: `gen.nm1-newton-1.${idx}`, generated: true, concepts: ["newton-iteration"], difficulty: 1, context: "abstract",
    prompt: `Newton's method: $x_{1} = x_0 - \\dfrac{f(x_0)}{f'(x_0)}$. For $f(x) = x^2 - ${N}$ (so $f'(x) = 2x$) with $x_0 = ${x0}$, take one step. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $f(${x0}) = ${x0}^2 - ${N}$.`, answer: `${fx}`, accept: [], hint: `$${x0 * x0} - ${N}$.` },
      { instruction: `Compute $f'(${x0}) = 2 \\cdot ${x0}$.`, answer: `${fpx}`, accept: [], hint: `$2 \\times ${x0}$.` },
      { instruction: `Compute $x_1 = ${x0} - \\dfrac{${fx}}{${fpx}}$. Round to 4 decimals.`, answer: rnd(x1, 4), accept: nbrs(x1, 4), hint: `$${x0} - ${rnd(fx / fpx, 4)}$.` },
    ],
    finalAnswer: { value: rnd(x1, 4), unit: "" },
    solutionNarrative: `$x_1 = ${x0} - \\frac{${fx}}{${fpx}} = ${rnd(x1, 4)}$, already close to $\\sqrt{${N}} \\approx ${rnd(Math.sqrt(N), 4)}$.`,
  };
};

// d2: Newton on a cubic f = x^3 - N, f' = 3x^2.
fill["nm1-newton-2"] = (rng, idx) => {
  const N = rng.pick([20, 30, 50, 60, 100]);
  const x0 = Math.round(Math.cbrt(N)) + rng.pick([0, 1]);
  const fx = x0 ** 3 - N;
  const fpx = 3 * x0 * x0;
  const x1 = x0 - fx / fpx;
  return {
    id: `gen.nm1-newton-2.${idx}`, generated: true, concepts: ["newton-iteration"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = x^3 - ${N}$ with $f'(x) = 3x^2$ and $x_0 = ${x0}$, take one Newton step. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $f(${x0}) = ${x0}^3 - ${N}$.`, answer: `${fx}`, accept: [], hint: `$${x0 ** 3} - ${N}$.` },
      { instruction: `Compute $f'(${x0}) = 3 \\cdot ${x0}^2$.`, answer: `${fpx}`, accept: [], hint: `$3 \\times ${x0 * x0}$.` },
      { instruction: `Compute $x_1 = ${x0} - \\dfrac{${fx}}{${fpx}}$. Round to 4 decimals.`, answer: rnd(x1, 4), accept: nbrs(x1, 4), hint: `$${x0} - \\frac{${fx}}{${fpx}}$.` },
    ],
    finalAnswer: { value: rnd(x1, 4), unit: "" },
    solutionNarrative: `$x_1 = ${x0} - \\frac{${fx}}{${fpx}} = ${rnd(x1, 4)}$, converging to $\\sqrt[3]{${N}} \\approx ${rnd(Math.cbrt(N), 4)}$.`,
  };
};

// d3: two Newton steps on x^2 - N.
fill["nm1-newton-3"] = (rng, idx) => {
  const N = rng.pick([7, 10, 13, 17, 23]);
  const x0 = Math.round(Math.sqrt(N)) + 1;
  const x1v = x0 - (x0 * x0 - N) / (2 * x0);
  const x2v = x1v - (x1v * x1v - N) / (2 * x1v);
  return {
    id: `gen.nm1-newton-3.${idx}`, generated: true, concepts: ["newton-iteration"], difficulty: 3, context: "abstract",
    prompt: `Take TWO Newton steps for $f(x) = x^2 - ${N}$ ($f'(x) = 2x$) from $x_0 = ${x0}$. Report $x_2$, rounded to 4 decimals.`,
    steps: [
      { instruction: `Step 1: $x_1 = ${x0} - \\dfrac{${x0}^2 - ${N}}{2\\cdot${x0}}$. Round to 4 decimals.`, answer: rnd(x1v, 4), accept: nbrs(x1v, 4), hint: `$${x0} - \\frac{${x0 * x0 - N}}{${2 * x0}}$.` },
      { instruction: `Step 2: with $x_1 = ${rnd(x1v, 4)}$, compute $x_2 = x_1 - \\dfrac{x_1^2 - ${N}}{2 x_1}$. Round to 4 decimals.`, answer: rnd(x2v, 4), accept: nbrs(x2v, 4), hint: `Use the rounded $x_1$; $x_1^2 \\approx ${rnd(x1v * x1v, 4)}$.` },
    ],
    finalAnswer: { value: rnd(x2v, 4), unit: "" },
    solutionNarrative: `$x_1 \\approx ${rnd(x1v, 4)}$, then $x_2 \\approx ${rnd(x2v, 4)}$ — Newton roughly doubles the correct digits each step, closing on $\\sqrt{${N}} \\approx ${rnd(Math.sqrt(N), 6)}$.`,
  };
};

// --- secant-iteration ------------------------------------------------------
// Secant: x2 = x1 - f(x1)*(x1 - x0)/(f(x1) - f(x0)).
const secantNext = (x0, x1, f0, f1) => x1 - f1 * (x1 - x0) / (f1 - f0);

// d1: one secant step with given f-values.
fill["nm1-secant-1"] = (rng, idx) => {
  const x0 = rng.int(1, 3), x1 = x0 + 1;
  const f0 = -rng.int(1, 3), f1 = rng.int(1, 4);
  const x2 = secantNext(x0, x1, f0, f1);
  return {
    id: `gen.nm1-secant-1.${idx}`, generated: true, concepts: ["secant-iteration"], difficulty: 1, context: "abstract",
    prompt: `The secant method uses two points: $x_2 = x_1 - \\dfrac{f(x_1)(x_1 - x_0)}{f(x_1) - f(x_0)}$. With $x_0 = ${x0}$, $x_1 = ${x1}$, $f(x_0) = ${f0}$, $f(x_1) = ${f1}$, compute $x_2$. Round to 4 decimals.`,
    steps: [
      { instruction: `Plug in: $x_2 = ${x1} - \\dfrac{${f1}(${x1} - ${x0})}{${f1} - (${f0})}$. Round to 4 decimals.`, answer: rnd(x2, 4), accept: nbrs(x2, 4), hint: `Denominator $= ${f1} - (${f0}) = ${f1 - f0}$.` },
    ],
    finalAnswer: { value: rnd(x2, 4), unit: "" },
    solutionNarrative: `$x_2 = ${x1} - \\frac{${f1}(${x1 - x0})}{${f1 - f0}} = ${rnd(x2, 4)}$.`,
  };
};

// d2: secant on x^2 - N, computing the f-values.
fill["nm1-secant-2"] = (rng, idx) => {
  const N = rng.pick([5, 7, 10, 15]);
  const x0 = Math.floor(Math.sqrt(N)), x1 = x0 + 1;
  const f0 = x0 * x0 - N, f1 = x1 * x1 - N;
  const x2 = secantNext(x0, x1, f0, f1);
  return {
    id: `gen.nm1-secant-2.${idx}`, generated: true, concepts: ["secant-iteration"], difficulty: 2, context: "abstract",
    prompt: `Apply one secant step to $f(x) = x^2 - ${N}$ using $x_0 = ${x0}$ and $x_1 = ${x1}$. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $f(${x0}) = ${x0}^2 - ${N}$.`, answer: `${f0}`, accept: [], hint: `$${x0 * x0} - ${N}$.` },
      { instruction: `Compute $f(${x1}) = ${x1}^2 - ${N}$.`, answer: `${f1}`, accept: [], hint: `$${x1 * x1} - ${N}$.` },
      { instruction: `Compute $x_2 = ${x1} - \\dfrac{${f1}(${x1} - ${x0})}{${f1} - (${f0})}$. Round to 4 decimals.`, answer: rnd(x2, 4), accept: nbrs(x2, 4), hint: `Denominator $= ${f1 - f0}$.` },
    ],
    finalAnswer: { value: rnd(x2, 4), unit: "" },
    solutionNarrative: `$f(${x0}) = ${f0}$, $f(${x1}) = ${f1}$, so $x_2 = ${x1} - \\frac{${f1}(${x1 - x0})}{${f1 - f0}} \\approx ${rnd(x2, 4)}$.`,
  };
};

// d3: two secant steps on x^2 - N.
fill["nm1-secant-3"] = (rng, idx) => {
  const N = rng.pick([7, 10, 13, 17]);
  const x0 = Math.floor(Math.sqrt(N)), x1 = x0 + 1;
  const f0 = x0 * x0 - N, f1 = x1 * x1 - N;
  const x2 = secantNext(x0, x1, f0, f1);
  const f2 = x2 * x2 - N;
  const x3 = secantNext(x1, x2, f1, f2);
  return {
    id: `gen.nm1-secant-3.${idx}`, generated: true, concepts: ["secant-iteration"], difficulty: 3, context: "abstract",
    prompt: `Do TWO secant steps for $f(x) = x^2 - ${N}$ from $x_0 = ${x0}$, $x_1 = ${x1}$. Report $x_3$, rounded to 4 decimals.`,
    steps: [
      { instruction: `With $f(${x0}) = ${f0}$, $f(${x1}) = ${f1}$, compute $x_2 = ${x1} - \\dfrac{${f1}(${x1}-${x0})}{${f1 - f0}}$. Round to 4 decimals.`, answer: rnd(x2, 4), accept: nbrs(x2, 4), hint: `Denominator $= ${f1 - f0}$.` },
      { instruction: `Now $f(x_2) = ${rnd(f2, 4)}$. Compute $x_3 = x_2 - \\dfrac{f(x_2)(x_2 - ${x1})}{f(x_2) - ${f1}}$. Round to 4 decimals.`, answer: rnd(x3, 4), accept: nbrs(x3, 4), hint: `Use $x_1 = ${x1}$ and $x_2 \\approx ${rnd(x2, 4)}$ as the two points.` },
    ],
    finalAnswer: { value: rnd(x3, 4), unit: "" },
    solutionNarrative: `$x_2 \\approx ${rnd(x2, 4)}$, then $x_3 \\approx ${rnd(x3, 4)}$, closing on $\\sqrt{${N}} \\approx ${rnd(Math.sqrt(N), 6)}$ without needing a derivative.`,
  };
};

// --- fixed-point-iteration -------------------------------------------------

// d1: one fixed-point step x1 = g(x0), g a simple linear/affine map.
fill["nm1-fixedpoint-1"] = (rng, idx) => {
  // g(x) = (x + a) / b, contraction when |1/b| < 1, i.e. b >= 2.
  const b = rng.pick([2, 3, 4]);
  const a = rng.int(2, 8);
  const x0 = rng.int(1, 5);
  const x1 = (x0 + a) / b;
  return {
    id: `gen.nm1-fixedpoint-1.${idx}`, generated: true, concepts: ["fixed-point-iteration"], difficulty: 1, context: "abstract",
    prompt: `Fixed-point iteration repeats $x_{n+1} = g(x_n)$. For $g(x) = \\dfrac{x + ${a}}{${b}}$ and $x_0 = ${x0}$, compute $x_1 = g(x_0)$. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $g(${x0}) = \\dfrac{${x0} + ${a}}{${b}}$. Round to 4 decimals.`, answer: rnd(x1, 4), accept: nbrs(x1, 4), hint: `$\\frac{${x0 + a}}{${b}}$.` },
    ],
    finalAnswer: { value: rnd(x1, 4), unit: "" },
    solutionNarrative: `$x_1 = g(${x0}) = \\frac{${x0 + a}}{${b}} = ${rnd(x1, 4)}$.`,
  };
};

// d2: convergence condition |g'| < 1 (menu) plus one step.
fill["nm1-fixedpoint-2"] = (rng, idx) => {
  const b = rng.pick([2, 3, 4, 5]);
  const a = rng.int(2, 9);
  const x0 = rng.int(1, 4);
  const x1 = (x0 + a) / b;
  const gp = 1 / b; // |g'| = 1/b < 1 -> converges
  return {
    id: `gen.nm1-fixedpoint-2.${idx}`, generated: true, concepts: ["fixed-point-iteration"], difficulty: 2, context: "abstract",
    prompt: `For $g(x) = \\dfrac{x + ${a}}{${b}}$, decide whether fixed-point iteration converges near a fixed point (it does when $|g'| < 1$), then take one step from $x_0 = ${x0}$.`,
    steps: [
      { instruction: `$g'(x) = \\dfrac{1}{${b}}$, a constant. Since $\\left|\\dfrac{1}{${b}}\\right| < 1$, does the iteration converge or diverge? Answer converges or diverges.`, answer: "converges", accept: ["convergent", "converge"], hint: "The derivative magnitude below 1 is exactly the contraction condition." },
      { instruction: `Compute $x_1 = g(${x0}) = \\dfrac{${x0} + ${a}}{${b}}$. Round to 4 decimals.`, answer: rnd(x1, 4), accept: nbrs(x1, 4), hint: `$\\frac{${x0 + a}}{${b}}$.` },
    ],
    finalAnswer: { value: "converges", unit: "" },
    solutionNarrative: `$|g'| = \\frac{1}{${b}} < 1$, so the iteration converges; the first step gives $x_1 = ${rnd(x1, 4)}$.`,
  };
};

// d3: a diverging g (|g'| > 1) — menu, plus recognizing the failure.
fill["nm1-fixedpoint-3"] = (rng, idx) => {
  // g(x) = k x - c with |k| > 1 diverges.
  const k = rng.pick([2, 3]);
  const c = rng.int(2, 6);
  const x0 = rng.int(2, 5);
  const x1 = k * x0 - c;
  const x2 = k * x1 - c;
  return {
    id: `gen.nm1-fixedpoint-3.${idx}`, generated: true, concepts: ["fixed-point-iteration"], difficulty: 3, context: "abstract",
    prompt: `Consider $g(x) = ${k}x - ${c}$ for fixed-point iteration. Check the convergence condition, then iterate twice from $x_0 = ${x0}$ to see what happens.`,
    steps: [
      { instruction: `$g'(x) = ${k}$. Since $|${k}| > 1$, will the iteration converge or diverge? Answer converges or diverges.`, answer: "diverges", accept: ["divergent", "diverge"], hint: "A derivative magnitude above 1 stretches errors each step." },
      { instruction: `Compute $x_1 = ${k}\\cdot${x0} - ${c}$.`, answer: `${x1}`, accept: [], hint: `$${k * x0} - ${c}$.` },
      { instruction: `Compute $x_2 = ${k}\\cdot${x1} - ${c}$.`, answer: `${x2}`, accept: [], hint: `$${k * x1} - ${c}$; notice it is moving AWAY.` },
    ],
    finalAnswer: { value: "diverges", unit: "" },
    solutionNarrative: `$|g'| = ${k} > 1$, so the iteration diverges: $x_1 = ${x1}$, $x_2 = ${x2}$ march away rather than settling.`,
  };
};

// --- convergence-order -----------------------------------------------------

// d1: menu — Newton is quadratic, bisection/secant/fixed-point linear.
fill["nm1-order-1"] = (rng, idx) => {
  const pick = rng.pick([
    { m: "Newton's method (with a simple root)", ans: "quadratic", other: "linear" },
    { m: "the bisection method", ans: "linear", other: "quadratic" },
    { m: "a well-behaved fixed-point iteration with $0 < |g'| < 1$", ans: "linear", other: "quadratic" },
  ]);
  return {
    id: `gen.nm1-order-1.${idx}`, generated: true, concepts: ["convergence-order"], difficulty: 1, context: "abstract",
    prompt: `What is the order of convergence of ${pick.m}? Answer linear or quadratic.`,
    steps: [
      { instruction: `State the convergence order of ${pick.m} (linear or quadratic).`, answer: pick.ans, accept: [], hint: `Quadratic roughly doubles correct digits each step; linear adds a fixed number. It is ${pick.ans}, not ${pick.other}.` },
    ],
    finalAnswer: { value: pick.ans, unit: "" },
    solutionNarrative: `${pick.m} converges ${pick.ans}ly.`,
  };
};

// d2: error-ratio numeric — quadratic: e_{n+1} ~ C e_n^2.
fill["nm1-order-2"] = (rng, idx) => {
  const C = rng.pick([1, 2, 0.5]);
  const en = rng.pick([0.1, 0.05, 0.2, 0.01]);
  const enext = C * en * en;
  return {
    id: `gen.nm1-order-2.${idx}`, generated: true, concepts: ["convergence-order"], difficulty: 2, context: "abstract",
    prompt: `For quadratically convergent Newton's method the errors satisfy $e_{n+1} \\approx C\\,e_n^2$. With $C = ${C}$ and current error $e_n = ${en}$, estimate the next error $e_{n+1}$. Round to 6 decimals.`,
    steps: [
      { instruction: `Compute $e_{n+1} = ${C} \\cdot (${en})^2$. Round to 6 decimals.`, answer: rnd(enext, 6), accept: nbrs(enext, 6), hint: `Square $${en}$ first, then multiply by $${C}$.` },
    ],
    finalAnswer: { value: rnd(enext, 6), unit: "" },
    solutionNarrative: `$e_{n+1} \\approx ${C}\\,(${en})^2 = ${rnd(enext, 6)}$ — the error is roughly squared, the signature of quadratic convergence.`,
  };
};

// d3: identify order from a sequence of shrinking errors (menu) + a ratio.
fill["nm1-order-3"] = (rng, idx) => {
  // linear: each error is a fixed fraction of the previous. ratio r.
  const r = rng.pick([0.5, 0.25, 0.1]);
  const e0 = rng.pick([0.4, 0.8, 0.2]);
  const e1 = Math.round(e0 * r * 10000) / 10000;
  const e2 = Math.round(e1 * r * 10000) / 10000;
  return {
    id: `gen.nm1-order-3.${idx}`, generated: true, concepts: ["convergence-order"], difficulty: 3, context: "abstract",
    prompt: `A method produces errors $e_0 = ${e0}$, $e_1 = ${rnd(e1, 4)}$, $e_2 = ${rnd(e2, 4)}$. Each error is the SAME constant times the previous. Find that ratio $\\dfrac{e_1}{e_0}$, then name the convergence order.`,
    steps: [
      { instruction: `Compute the ratio $\\dfrac{e_1}{e_0} = \\dfrac{${rnd(e1, 4)}}{${e0}}$. Round to 4 decimals.`, answer: rnd(r, 4), accept: nbrs(r, 4), hint: `A constant error ratio each step.` },
      { instruction: `A constant nonzero error ratio between steps means which order — linear or quadratic?`, answer: "linear", accept: [], hint: "Quadratic would shrink the ratio itself each step; a fixed ratio is linear." },
    ],
    finalAnswer: { value: "linear", unit: "" },
    solutionNarrative: `The ratio is a constant $${rnd(r, 4)}$ every step, so convergence is linear (quadratic convergence would drive the ratio toward 0).`,
  };
};

// ===========================================================================
// TOPIC 4: numerical-methods.interpolation
// ===========================================================================

// --- linear-interpolation --------------------------------------------------

// d1: estimate y between two points by the linear formula.
fill["nm1-linterp-1"] = (rng, idx) => {
  const x0 = rng.int(0, 4), x1 = x0 + rng.pick([2, 4]);
  const y0 = rng.int(1, 8), y1 = y0 + rng.pick([2, 4, 6]);
  const xq = (x0 + x1) / 2; // midpoint -> clean
  const yq = y0 + (y1 - y0) * (xq - x0) / (x1 - x0);
  return {
    id: `gen.nm1-linterp-1.${idx}`, generated: true, concepts: ["linear-interpolation"], difficulty: 1, context: "abstract",
    prompt: `Linearly interpolate between $(${x0}, ${y0})$ and $(${x1}, ${y1})$ to estimate $y$ at $x = ${xq}$. Use $y = y_0 + (y_1 - y_0)\\dfrac{x - x_0}{x_1 - x_0}$. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $y = ${y0} + (${y1} - ${y0})\\dfrac{${xq} - ${x0}}{${x1} - ${x0}}$. Round to 4 decimals.`, answer: rnd(yq, 4), accept: nbrs(yq, 4), hint: `The fraction is $\\frac{${xq - x0}}{${x1 - x0}}$.` },
    ],
    finalAnswer: { value: rnd(yq, 4), unit: "" },
    solutionNarrative: `$y = ${y0} + ${y1 - y0}\\cdot\\frac{${xq - x0}}{${x1 - x0}} = ${rnd(yq, 4)}$.`,
  };
};

// d2: interpolate at a non-midpoint query.
fill["nm1-linterp-2"] = (rng, idx) => {
  const x0 = rng.int(0, 3), x1 = x0 + rng.pick([4, 5]);
  const y0 = rng.int(2, 10), y1 = y0 + rng.pick([3, 5, 7]);
  const xq = x0 + rng.int(1, x1 - x0 - 1);
  const yq = y0 + (y1 - y0) * (xq - x0) / (x1 - x0);
  return {
    id: `gen.nm1-linterp-2.${idx}`, generated: true, concepts: ["linear-interpolation"], difficulty: 2, context: "applied",
    prompt: `A sensor reads $${y0}$ at time $${x0}$ s and $${y1}$ at time $${x1}$ s. Estimate the reading at $t = ${xq}$ s by linear interpolation. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute the fraction of the way across: $\\dfrac{${xq} - ${x0}}{${x1} - ${x0}}$. Round to 4 decimals.`, answer: rnd((xq - x0) / (x1 - x0), 4), accept: nbrs((xq - x0) / (x1 - x0), 4), hint: `$\\frac{${xq - x0}}{${x1 - x0}}$.` },
      { instruction: `Now $y = ${y0} + (${y1 - y0}) \\times$ that fraction. Round to 4 decimals.`, answer: rnd(yq, 4), accept: nbrs(yq, 4), hint: `$${y0} + ${y1 - y0}\\cdot${rnd((xq - x0) / (x1 - x0), 4)}$.` },
    ],
    finalAnswer: { value: rnd(yq, 4), unit: "" },
    solutionNarrative: `The query sits $\\frac{${xq - x0}}{${x1 - x0}}$ of the way across, giving $y = ${y0} + ${y1 - y0}\\cdot\\frac{${xq - x0}}{${x1 - x0}} = ${rnd(yq, 4)}$.`,
  };
};

// d3: inverse linear interpolation — find x for a target y.
fill["nm1-linterp-3"] = (rng, idx) => {
  const x0 = rng.int(0, 3), x1 = x0 + rng.pick([4, 5]);
  const y0 = rng.int(1, 6), y1 = y0 + rng.pick([4, 6, 8]);
  const yt = y0 + rng.int(1, y1 - y0 - 1);
  const xt = x0 + (x1 - x0) * (yt - y0) / (y1 - y0);
  return {
    id: `gen.nm1-linterp-3.${idx}`, generated: true, concepts: ["linear-interpolation"], difficulty: 3, context: "applied",
    prompt: `A calibration line passes through $(${x0}, ${y0})$ and $(${x1}, ${y1})$. What input $x$ gives the output $y = ${yt}$? (Inverse linear interpolation.) Round to 4 decimals.`,
    steps: [
      { instruction: `Solve $x = ${x0} + (${x1} - ${x0})\\dfrac{${yt} - ${y0}}{${y1} - ${y0}}$. Round to 4 decimals.`, answer: rnd(xt, 4), accept: nbrs(xt, 4), hint: `The fraction of the output range is $\\frac{${yt - y0}}{${y1 - y0}}$.` },
    ],
    finalAnswer: { value: rnd(xt, 4), unit: "" },
    solutionNarrative: `$x = ${x0} + ${x1 - x0}\\cdot\\frac{${yt - y0}}{${y1 - y0}} = ${rnd(xt, 4)}$.`,
  };
};

// --- lagrange-form ---------------------------------------------------------
// Build the interpolating polynomial through nodes; graded by polynomial
// equivalence, so we can supply the expanded form as the answer.

// d1: line through 2 points as a polynomial.
fill["nm1-lagrange-1"] = (rng, idx) => {
  const x0 = rng.int(0, 2), x1 = x0 + rng.pick([1, 2]);
  const m = rng.pick([1, 2, 3, -1, -2]);
  const b = rng.int(-3, 4);
  const y0 = m * x0 + b, y1 = m * x1 + b;
  // interpolating polynomial IS mx + b
  const poly = `${m === 1 ? "" : m === -1 ? "-" : m}x${b >= 0 ? ` + ${b}` : ` - ${-b}`}`;
  return {
    id: `gen.nm1-lagrange-1.${idx}`, generated: true, concepts: ["lagrange-form"], difficulty: 1, context: "abstract",
    prompt: `Find the (degree-1) interpolating polynomial through $(${x0}, ${y0})$ and $(${x1}, ${y1})$. Write it in the form $mx + b$.`,
    steps: [
      { instruction: `Slope $m = \\dfrac{${y1} - ${y0}}{${x1} - ${x0}}$. Compute it.`, answer: `${m}`, accept: [], hint: `$\\frac{${y1 - y0}}{${x1 - x0}}$.` },
      { instruction: `Using $y - ${y0} = m(x - ${x0})$, write the polynomial $mx + b$.`, answer: poly, accept: [`${m}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}`], hint: `Intercept $b = ${y0} - ${m}\\cdot${x0} = ${b}$.` },
    ],
    finalAnswer: { value: poly, unit: "" },
    solutionNarrative: `Slope $${m}$, intercept $${b}$: the interpolating line is $${poly}$.`,
  };
};

// d2: parabola through 3 points — supply the expanded quadratic.
fill["nm1-lagrange-2"] = (rng, idx) => {
  // choose a quadratic a x^2 + b x + c, sample at 3 integer nodes.
  const a = rng.pick([1, 2, -1]);
  const b = rng.int(-2, 2);
  const c = rng.int(-2, 3);
  const xs = [-1, 0, 1];
  const ys = xs.map((x) => a * x * x + b * x + c);
  const poly = polyABC(a, b, c);
  return {
    id: `gen.nm1-lagrange-2.${idx}`, generated: true, concepts: ["lagrange-form"], difficulty: 2, context: "abstract",
    prompt: `Find the degree-2 polynomial through $(${xs[0]}, ${ys[0]})$, $(${xs[1]}, ${ys[1]})$, $(${xs[2]}, ${ys[2]})$. Give it expanded (like $a x^2 + b x + c$).`,
    steps: [
      { instruction: `From the node at $x = 0$, read off the constant term $c$.`, answer: `${c}`, accept: [], hint: `$p(0) = c = ${ys[1]}$.` },
      { instruction: `Using $p(1) = a + b + c = ${ys[2]}$ and $p(-1) = a - b + c = ${ys[0]}$, find $b = \\dfrac{p(1) - p(-1)}{2}$.`, answer: `${b}`, accept: [], hint: `$\\frac{${ys[2]} - (${ys[0]})}{2}$.` },
      { instruction: `Find $a = \\dfrac{p(1) + p(-1)}{2} - c$, then write the full polynomial.`, answer: poly, accept: [poly.replace(/\s+/g, "")], hint: `$a = \\frac{${ys[2]} + (${ys[0]})}{2} - ${c} = ${a}$.` },
    ],
    finalAnswer: { value: poly, unit: "" },
    solutionNarrative: `The three conditions give $a = ${a}$, $b = ${b}$, $c = ${c}$: $p(x) = ${poly}$.`,
  };
};

// d3: Lagrange basis at one node, then the polynomial through 3 general nodes.
fill["nm1-lagrange-3"] = (rng, idx) => {
  const a = rng.pick([1, 2]);
  const b = rng.int(-3, 3);
  const c = rng.int(-2, 4);
  const xs = [0, 1, 2];
  const ys = xs.map((x) => a * x * x + b * x + c);
  const poly = polyABC(a, b, c);
  return {
    id: `gen.nm1-lagrange-3.${idx}`, generated: true, concepts: ["lagrange-form"], difficulty: 3, context: "abstract",
    prompt: `Interpolate the three points $(0, ${ys[0]})$, $(1, ${ys[1]})$, $(2, ${ys[2]})$ with a degree-2 polynomial. Give the expanded result.`,
    steps: [
      { instruction: `The constant term equals $p(0)$. What is it?`, answer: `${c}`, accept: [], hint: `$p(0) = ${ys[0]}$.` },
      { instruction: `Solve the system $a + b + c = ${ys[1]}$, $4a + 2b + c = ${ys[2]}$ (with $c = ${c}$) for $b$.`, answer: `${b}`, accept: [], hint: `Subtracting: $3a + b = ${ys[2] - ys[1]}$ and $a + b = ${ys[1] - c}$; solve.` },
      { instruction: `Find $a$ and write the polynomial $${a}x^2 ${b >= 0 ? "+ " + b : "- " + -b}x ${c >= 0 ? "+ " + c : "- " + -c}$ expanded.`, answer: poly, accept: [poly.replace(/\s+/g, "")], hint: `$a = ${a}$ from the leading behaviour.` },
    ],
    finalAnswer: { value: poly, unit: "" },
    solutionNarrative: `Solving the 3-by-3 system yields $a = ${a}$, $b = ${b}$, $c = ${c}$, so $p(x) = ${poly}$.`,
  };
};

// --- newton-divided-differences --------------------------------------------

// d1: first divided difference of two points.
fill["nm1-divdiff-1"] = (rng, idx) => {
  const x0 = rng.int(0, 3), x1 = x0 + rng.pick([1, 2]);
  const y0 = rng.int(1, 9), y1 = rng.int(1, 9);
  const dd = (y1 - y0) / (x1 - x0);
  return {
    id: `gen.nm1-divdiff-1.${idx}`, generated: true, concepts: ["newton-divided-differences"], difficulty: 1, context: "abstract",
    prompt: `The first divided difference is $f[x_0, x_1] = \\dfrac{f(x_1) - f(x_0)}{x_1 - x_0}$. Compute it for $(${x0}, ${y0})$ and $(${x1}, ${y1})$. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $\\dfrac{${y1} - ${y0}}{${x1} - ${x0}}$. Round to 4 decimals.`, answer: rnd(dd, 4), accept: nbrs(dd, 4), hint: `$\\frac{${y1 - y0}}{${x1 - x0}}$.` },
    ],
    finalAnswer: { value: rnd(dd, 4), unit: "" },
    solutionNarrative: `$f[x_0, x_1] = \\frac{${y1 - y0}}{${x1 - x0}} = ${rnd(dd, 4)}$.`,
  };
};

// d2: build a small divided-difference table (two first DDs + the second DD).
fill["nm1-divdiff-2"] = (rng, idx) => {
  const xs = [rng.int(0, 1), 2, 4];
  xs[0] = 0; xs[1] = 2; xs[2] = 4; // fixed clean nodes
  const ys = [rng.int(1, 5), rng.int(4, 9), rng.int(8, 14)];
  const dd01 = (ys[1] - ys[0]) / (xs[1] - xs[0]);
  const dd12 = (ys[2] - ys[1]) / (xs[2] - xs[1]);
  const dd012 = (dd12 - dd01) / (xs[2] - xs[0]);
  return {
    id: `gen.nm1-divdiff-2.${idx}`, generated: true, concepts: ["newton-divided-differences"], difficulty: 2, context: "abstract",
    prompt: `Build the divided-difference table for $(0, ${ys[0]})$, $(2, ${ys[1]})$, $(4, ${ys[2]})$. Find both first differences and the second difference. Round each to 4 decimals.`,
    steps: [
      { instruction: `First difference $f[x_0,x_1] = \\dfrac{${ys[1]} - ${ys[0]}}{2 - 0}$. Round to 4 decimals.`, answer: rnd(dd01, 4), accept: nbrs(dd01, 4), hint: `$\\frac{${ys[1] - ys[0]}}{2}$.` },
      { instruction: `First difference $f[x_1,x_2] = \\dfrac{${ys[2]} - ${ys[1]}}{4 - 2}$. Round to 4 decimals.`, answer: rnd(dd12, 4), accept: nbrs(dd12, 4), hint: `$\\frac{${ys[2] - ys[1]}}{2}$.` },
      { instruction: `Second difference $f[x_0,x_1,x_2] = \\dfrac{f[x_1,x_2] - f[x_0,x_1]}{4 - 0}$. Round to 4 decimals.`, answer: rnd(dd012, 4), accept: nbrs(dd012, 4), hint: `$\\frac{${rnd(dd12, 4)} - ${rnd(dd01, 4)}}{4}$.` },
    ],
    finalAnswer: { value: rnd(dd012, 4), unit: "" },
    solutionNarrative: `$f[x_0,x_1] = ${rnd(dd01, 4)}$, $f[x_1,x_2] = ${rnd(dd12, 4)}$, and $f[x_0,x_1,x_2] = ${rnd(dd012, 4)}$ — the leading coefficient of the Newton form.`,
  };
};

// d3: Newton form -> expanded polynomial through 3 nodes (poly equivalence).
fill["nm1-divdiff-3"] = (rng, idx) => {
  // Use a known quadratic so the expansion is exact integers.
  const a = rng.pick([1, 2, -1]);
  const b = rng.int(-2, 2);
  const c = rng.int(-1, 3);
  const xs = [0, 1, 2];
  const ys = xs.map((x) => a * x * x + b * x + c);
  const dd01 = ys[1] - ys[0];                 // /1
  const dd12 = ys[2] - ys[1];                 // /1
  const dd012 = (dd12 - dd01) / 2;            // = a
  const poly = polyABC(a, b, c);
  // Newton form: y0 + dd01*(x - 0) + dd012*(x-0)(x-1)
  const newton = `${ys[0]} + ${dd01}(x) + ${dd012}(x)(x - 1)`;
  return {
    id: `gen.nm1-divdiff-3.${idx}`, generated: true, concepts: ["newton-divided-differences"], difficulty: 3, context: "abstract",
    prompt: `For nodes $(0, ${ys[0]})$, $(1, ${ys[1]})$, $(2, ${ys[2]})$ the Newton form is $p(x) = ${ys[0]} + ${dd01}x + ${dd012}x(x-1)$. Expand it to $a x^2 + b x + c$.`,
    steps: [
      { instruction: `The second divided difference (coefficient of $x(x-1)$) is $\\dfrac{${dd12} - ${dd01}}{2}$. Compute it.`, answer: `${dd012}`, accept: [], hint: `$\\frac{${dd12 - dd01}}{2}$.` },
      { instruction: `Expand $${ys[0]} + ${dd01}x + ${dd012}x(x - 1)$ into $a x^2 + b x + c$.`, answer: poly, accept: [poly.replace(/\s+/g, ""), newton], hint: `$${dd012}x(x-1) = ${dd012}x^2 - ${dd012}x$; combine with $${dd01}x$.` },
    ],
    finalAnswer: { value: poly, unit: "" },
    solutionNarrative: `Expanding the Newton form gives $p(x) = ${poly}$ — the same polynomial the Lagrange form would produce.`,
  };
};

// --- interpolation-error-and-use -------------------------------------------

// d1: use a fitted polynomial to estimate a value.
fill["nm1-interp-error-1"] = (rng, idx) => {
  const a = rng.pick([1, 2]);
  const b = rng.int(0, 3);
  const c = rng.int(0, 3);
  const xq = rng.pick([3, 4, 5]);
  const val = a * xq * xq + b * xq + c;
  return {
    id: `gen.nm1-interp-error-1.${idx}`, generated: true, concepts: ["interpolation-error-and-use"], difficulty: 1, context: "abstract",
    prompt: `An interpolating polynomial came out to $p(x) = ${polyABC(a, b, c)}$. Use it to estimate the value at $x = ${xq}$.`,
    steps: [
      { instruction: `Evaluate $p(${xq}) = ${a}\\cdot${xq}^2 ${b ? sgn(b).replace("+", "+ " + "").replace("- ", "- ") + "\\cdot" + xq : ""} ${c ? sgn(c) : ""}$. Compute the number.`, answer: `${val}`, accept: [], hint: `$${a}\\times${xq * xq} ${b ? "+ " + b + "\\times" + xq : ""} ${c ? "+ " + c : ""}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$p(${xq}) = ${a}(${xq * xq}) ${b ? "+ " + b * xq : ""} ${c ? "+ " + c : ""} = ${val}$.`,
  };
};

// d2: interpolation error bound |f''(xi)|/2 * |x-x0||x-x1|.
fill["nm1-interp-error-2"] = (rng, idx) => {
  const M2 = rng.pick([2, 4, 6, 8]);      // bound on |f''|
  const x0 = rng.int(0, 2), x1 = x0 + rng.pick([2, 4]);
  const xq = (x0 + x1) / 2;
  const bound = (M2 / 2) * Math.abs(xq - x0) * Math.abs(xq - x1);
  return {
    id: `gen.nm1-interp-error-2.${idx}`, generated: true, concepts: ["interpolation-error-and-use"], difficulty: 2, context: "abstract",
    prompt: `Linear interpolation between $x_0 = ${x0}$ and $x_1 = ${x1}$ has error bounded by $\\dfrac{|f''|}{2}\\,|x - x_0|\\,|x - x_1|$. With $|f''| \\le ${M2}$, bound the error at the midpoint $x = ${xq}$. Round to 4 decimals.`,
    steps: [
      { instruction: `Compute $|x - x_0|\\,|x - x_1| = |${xq} - ${x0}|\\,|${xq} - ${x1}|$.`, answer: rnd(Math.abs(xq - x0) * Math.abs(xq - x1), 4), accept: nbrs(Math.abs(xq - x0) * Math.abs(xq - x1), 4), hint: `$${Math.abs(xq - x0)} \\times ${Math.abs(xq - x1)}$.` },
      { instruction: `Multiply by $\\dfrac{${M2}}{2}$ to get the bound. Round to 4 decimals.`, answer: rnd(bound, 4), accept: nbrs(bound, 4), hint: `$\\frac{${M2}}{2} \\times ${rnd(Math.abs(xq - x0) * Math.abs(xq - x1), 4)}$.` },
    ],
    finalAnswer: { value: rnd(bound, 4), unit: "" },
    solutionNarrative: `The product $|x - x_0||x - x_1| = ${rnd(Math.abs(xq - x0) * Math.abs(xq - x1), 4)}$; times $\\frac{${M2}}{2}$ gives an error bound of $${rnd(bound, 4)}$.`,
  };
};

// d3: applied estimate + error bound together.
fill["nm1-interp-error-3"] = (rng, idx) => {
  const M2 = rng.pick([1, 2, 3]);
  const x0 = rng.int(1, 3), x1 = x0 + 2;
  const y0 = rng.int(2, 6), y1 = y0 + rng.pick([2, 3]);
  const xq = x0 + 1; // midpoint
  const est = y0 + (y1 - y0) * (xq - x0) / (x1 - x0);
  const bound = (M2 / 2) * Math.abs(xq - x0) * Math.abs(xq - x1);
  return {
    id: `gen.nm1-interp-error-3.${idx}`, generated: true, concepts: ["interpolation-error-and-use"], difficulty: 3, context: "applied",
    prompt: `A table gives $f(${x0}) = ${y0}$ and $f(${x1}) = ${y1}$. Estimate $f(${xq})$ by linear interpolation, and bound the error given $|f''| \\le ${M2}$. Round to 4 decimals.`,
    steps: [
      { instruction: `Linear estimate: $f(${xq}) \\approx ${y0} + (${y1 - y0})\\dfrac{${xq} - ${x0}}{${x1} - ${x0}}$. Round to 4 decimals.`, answer: rnd(est, 4), accept: nbrs(est, 4), hint: `Midpoint, so the fraction is $\\frac{1}{2}$.` },
      { instruction: `Error bound $= \\dfrac{${M2}}{2}|${xq}-${x0}||${xq}-${x1}|$. Compute it. Round to 4 decimals.`, answer: rnd(bound, 4), accept: nbrs(bound, 4), hint: `$\\frac{${M2}}{2}\\times ${Math.abs(xq - x0)}\\times${Math.abs(xq - x1)}$.` },
    ],
    finalAnswer: { value: rnd(est, 4), unit: "" },
    solutionNarrative: `Linear interpolation gives $f(${xq}) \\approx ${rnd(est, 4)}$, accurate to within $${rnd(bound, 4)}$ since $|f''| \\le ${M2}$.`,
  };
};
