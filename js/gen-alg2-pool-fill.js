// gen-alg2-pool-fill.js
// Parametric generators that eliminate the 30 thin concept×difficulty pools in
// the algebra-2 subject (pools that previously had exactly one seed problem and
// no generator, so repeat practice re-served the identical problem). One
// template per pool, prefix a2l-. Self-contained pack: exports a `fill` map of
// template-name -> (rng, idx) => problem, matching js/generator.js's registry
// shape (same pattern as gen-alg2-fill.js / gen-alg-graph-fill.js).
//
// Covered pools (topic / concept / difficulty):
//   exponential-functions: growth-and-decay d3, exponential-equations d2+d3,
//                          compound-interest d1
//   functions:             function-notation d2+d3, domain-and-range d3,
//                          composition d1+d3, inverse-functions d1+d3
//   logarithms:            log-properties d1+d3, solve-with-logs d1,
//                          log-applications d1
//   radicals:              simplify-radicals d1+d3, evaluate-roots d2,
//                          solve-radical-equations d1, radical-applications d3
//   rational-expressions:  excluded-values d2+d3, simplify-rational d1+d3,
//                          evaluate-rational d1+d3
//   sequences-and-series:  arithmetic-sequences d3, arithmetic-series d1+d3,
//                          geometric-series d1
//
// Grader notes honored (js/problem-engine.js):
//  - Every template has a FIXED concept list + difficulty (the engine probes
//    once with makeRng(1) and indexes by concept|difficulty).
//  - Answers are short and checkStep-verifiable: integers, exact decimals,
//    fractions "a/b", equations/inequalities (canonicalized), rational
//    expressions (cross-multiplied), and radicals like "5\sqrt{2}" which
//    normalize to "5sqrt2" and evaluate numerically.
//  - Money is computed in integer cents so decimal strings are exact.
//  - No symbolic log/trig answers anywhere — log steps reduce to integers.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Nonzero integer in [lo, hi].
const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
// Reduced fraction string ("3/2", or "3" when the denominator divides out).
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
// Exact decimal string for cents (integer) -> "1102.50".
const money = (cents) => (cents / 100).toFixed(2);
// Parenthesize negatives so hints never read "+ -3".
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
// Polynomial in x from coefficients [c_deg, ..., c_0] (descending powers).
const fmtPoly = (coeffs) => {
  const deg = coeffs.length - 1;
  let out = "";
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const coefStr = p > 0 && abs === 1 ? "" : `${abs}`;
    const varStr = p === 0 ? "" : p === 1 ? "x" : `x^${p}`;
    const term = `${coefStr}${varStr}`;
    out = out === "" ? `${c < 0 ? "-" : ""}${term}` : `${out} ${c < 0 ? "-" : "+"} ${term}`;
  });
  return out === "" ? "0" : out;
};
// Factor (x - r) with the sign folded in; r must be nonzero.
const fmtFactor = (r) => (r > 0 ? `(x - ${r})` : `(x + ${-r})`);
// "x - b" with the sign of b folded in (b may be negative).
const fmtShift = (b) => (b === 0 ? "x" : b > 0 ? `x - ${b}` : `x + ${-b}`);
const squash = (s) => s.replace(/ /g, "");

export const fill = {};

// ===========================================================================
// TOPIC: algebra-2.exponential-functions
// ===========================================================================

// --- compound-interest d1: annual compounding over 2 years, clean decimals ---
fill["a2l-compound-d1"] = (rng, idx) => {
  const m = rng.pick([5, 8, 10, 12, 15, 20]);   // P = 100m dollars
  const r = rng.pick([2, 3, 4, 5, 10]);          // whole-percent annual rate
  const P = 100 * m;
  const factorStr = `${(100 + r) / 100}`;        // e.g. "1.05" (exact)
  const sq = (100 + r) * (100 + r);              // integer
  const f2Str = `${sq / 10000}`;                 // e.g. "1.1025" (exact)
  const cents = m * sq;                          // P * factor^2 in cents, exact
  return {
    id: `gen.a2l-compound-d1.${idx}`, generated: true, concepts: ["compound-interest"], difficulty: 1, context: "applied",
    prompt: `You deposit \\$${P} at ${r}% annual interest, compounded annually ($n = 1$), for 2 years. Use $A = P(1 + r/n)^{nt}$ to find the final amount. (Round to the nearest cent.)`,
    steps: [
      { instruction: `Find the annual growth factor $1 + r/n$.`, answer: factorStr, accept: [], hint: `$1 + ${r / 100}/1$.` },
      { instruction: `Raise it to the power $nt = 2$: compute $${factorStr}^2$ exactly.`, answer: f2Str, accept: [], hint: `$${factorStr} \\cdot ${factorStr}$.` },
      { instruction: `Multiply by the principal \\$${P} (round to the nearest cent).`, answer: money(cents), accept: [`${cents / 100}`], hint: `$${P} \\times ${f2Str}$.` },
    ],
    finalAnswer: { value: money(cents), unit: "dollars" },
    solutionNarrative: `$A = ${P}(${factorStr})^2 = ${P} \\cdot ${f2Str} = \\$${money(cents)}$. The second year's interest is earned on the first year's interest too — that's compounding.`,
  };
};

// --- growth-and-decay d3: percent growth/decay over 3 years + net change ---
const DECAY_ITEMS = ["car", "delivery van", "laptop fleet", "fishing boat"];
const GROWTH_ITEMS = ["investment account", "rare comic collection", "plot of land", "vintage guitar"];
fill["a2l-growth-decay-d3"] = (rng, idx) => {
  const grow = rng.int(0, 1) === 1;
  const pct = grow ? rng.pick([10, 20, 30, 50]) : rng.pick([10, 20, 30, 40, 50]);
  const k = grow ? 10 + pct / 10 : 10 - pct / 10; // factor = k/10 exactly
  const m = grow ? rng.int(2, 6) : rng.int(2, 9);
  const P = 1000 * m;
  const bStr = `${k / 10}`;                       // "0.8" / "1.2" (exact)
  const b3Str = `${(k * k * k) / 1000}`;          // e.g. "0.512" (exact)
  const value = m * k * k * k;                    // P * (k/10)^3, integer
  const change = Math.abs(P - value);
  const item = grow ? rng.pick(GROWTH_ITEMS) : rng.pick(DECAY_ITEMS);
  const verb = grow ? "gains" : "loses";
  return {
    id: `gen.a2l-growth-decay-d3.${idx}`, generated: true, concepts: ["growth-and-decay"], difficulty: 3, context: "applied",
    prompt: `A ${item} worth \\$${P} ${verb} ${pct}% of its value each year, so its value after $n$ years is $${P} \\cdot ${bStr}^n$ dollars. Find its value after 3 years and the total ${grow ? "gain" : "loss"}.`,
    steps: [
      { instruction: `A ${pct}% ${grow ? "gain" : "loss"} per year means the value multiplies by what factor each year? Enter the ${grow ? "growth" : "decay"} factor.`, answer: bStr, accept: [], hint: `$1 ${grow ? "+" : "-"} ${pct / 100}$.` },
      { instruction: `Evaluate $${bStr}^3$ exactly.`, answer: b3Str, accept: [], hint: `$${bStr} \\cdot ${bStr} \\cdot ${bStr}$.` },
      { instruction: `Multiply by the starting \\$${P} to get the value after 3 years, in dollars.`, answer: `${value}`, accept: [`$${value}`], hint: `$${P} \\times ${b3Str}$.` },
      { instruction: `How many dollars did the ${item} ${grow ? "gain" : "lose"} over the 3 years?`, answer: `${change}`, accept: [`$${change}`], hint: grow ? `$${value} - ${P}$.` : `$${P} - ${value}$.` },
    ],
    finalAnswer: { value: `${value}`, unit: "dollars" },
    solutionNarrative: `The ${grow ? "growth" : "decay"} factor is $${bStr}$, and $${bStr}^3 = ${b3Str}$, so after 3 years the ${item} is worth $${P} \\cdot ${b3Str} = \\$${value}$ — a ${grow ? "gain" : "loss"} of \\$${change}.`,
  };
};

// --- exponential-equations d2: b^(x±c) = b^k, solve the linear exponent ---
fill["a2l-exp-eq-d2"] = (rng, idx) => {
  const b = rng.pick([2, 3, 5]);
  const k = b === 2 ? rng.int(4, 6) : b === 3 ? rng.int(3, 4) : 3;
  const minus = rng.int(0, 1) === 1;
  const c = minus ? rng.int(1, 3) : rng.int(1, k - 1); // keep x >= 1
  const x = minus ? k + c : k - c;
  const N = b ** k;
  const expStr = minus ? `x - ${c}` : `x + ${c}`;
  return {
    id: `gen.a2l-exp-eq-d2.${idx}`, generated: true, concepts: ["exponential-equations"], difficulty: 2, context: "abstract",
    prompt: `Solve by matching bases: $${b}^{${expStr}} = ${N}$.`,
    steps: [
      { instruction: `Rewrite ${N} as a power of ${b}: $${N} = ${b}^{?}$. Enter the exponent.`, answer: `${k}`, accept: [], hint: `$${b}^{${k}} = ${N}$.` },
      { instruction: `Set the exponents equal: $${expStr} = ${k}$. Solve for $x$.`, answer: `${x}`, accept: [`x=${x}`, `x = ${x}`], hint: minus ? `Add ${c} to both sides.` : `Subtract ${c} from both sides.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `$${N} = ${b}^{${k}}$, so the exponents must match: $${expStr} = ${k}$, giving $x = ${x}$.`,
  };
};

// --- exponential-equations d3: unlike bases, rewrite both as one base ---
fill["a2l-exp-eq-d3"] = (rng, idx) => {
  const square = rng.int(0, 1) === 1;
  let B, b, mult, m;
  if (square) {
    [B, b] = rng.pick([[4, 2], [9, 3], [25, 5]]);
    mult = 2;
    m = rng.pick(B === 25 ? [3] : [3, 5]);        // odd, so x = m/2 is a real fraction
  } else {
    [B, b] = rng.pick([[8, 2], [27, 3]]);
    mult = 3;
    m = rng.pick(B === 8 ? [4, 5] : [4]);         // not divisible by 3
  }
  const N = b ** m;
  const x = frac(m, mult);
  const dec = mult === 2 ? [`${m / 2}`] : [];     // halves have exact decimals; thirds don't
  return {
    id: `gen.a2l-exp-eq-d3.${idx}`, generated: true, concepts: ["exponential-equations"], difficulty: 3, context: "abstract",
    prompt: `Solve by matching bases: $${B}^x = ${N}$. (Hint: write both sides as powers of ${b}.)`,
    steps: [
      { instruction: `Rewrite $${B}^x$ as a power of ${b}. What is the exponent in terms of $x$? (i.e. $${B}^x = ${b}^{?}$)`, answer: `${mult}x`, accept: [`${mult}*x`], hint: `$${B} = ${b}^{${mult}}$, so $${B}^x = ${b}^{${mult}x}$.` },
      { instruction: `Rewrite ${N} as a power of ${b}: $${N} = ${b}^{?}$.`, answer: `${m}`, accept: [], hint: `$${b}^{${m}} = ${N}$.` },
      { instruction: `Set the exponents equal ($${mult}x = ${m}$) and solve for $x$. Give a fraction.`, answer: x, accept: [`x=${x}`, ...dec], hint: `Divide both sides by ${mult}.` },
    ],
    finalAnswer: { value: x, unit: "" },
    solutionNarrative: `$${B}^x = ${b}^{${mult}x}$ and $${N} = ${b}^{${m}}$, so $${mult}x = ${m}$ and $x = ${x}$.`,
  };
};

// ===========================================================================
// TOPIC: algebra-2.functions
// ===========================================================================

// --- function-notation d2: evaluate a quadratic at a negative input ---
fill["a2l-fn-notation-d2"] = (rng, idx) => {
  const a = rng.int(1, 3);
  const b = nz(rng, -6, 6);
  const c = nz(rng, -9, 9);
  const k = rng.int(2, 5);                        // input is -k
  const fStr = fmtPoly([a, b, c]);
  const val = a * k * k - b * k + c;
  return {
    id: `gen.a2l-fn-notation-d2.${idx}`, generated: true, concepts: ["function-notation"], difficulty: 2, context: "abstract",
    prompt: `Given $f(x) = ${fStr}$, evaluate $f(-${k})$.`,
    steps: [
      { instruction: `First compute $(-${k})^2$. (Give a number.)`, answer: `${k * k}`, accept: [], hint: `A square is never negative: $(-${k})(-${k})$.` },
      { instruction: `Now compute $f(-${k}) = ${a === 1 ? "" : a}(${k * k}) ${b < 0 ? "-" : "+"} ${Math.abs(b)}(-${k}) ${c < 0 ? "-" : "+"} ${Math.abs(c)}$. (Give a number.)`, answer: `${val}`, accept: [], hint: `$${a * k * k} + ${par(-b * k)} + ${par(c)}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `Keep parentheses around the $-${k}$: $f(-${k}) = ${a === 1 ? "" : a}(${k * k}) + ${par(-b * k)} + ${par(c)} = ${val}$.`,
  };
};

// --- function-notation d3: read f(h) = total backward and solve for h ---
const PAY_CTX = [
  { who: "A dog walker", fee: "flat booking fee", per: "per hour" },
  { who: "An electrician", fee: "call-out fee", per: "per hour of work" },
  { who: "A math tutor", fee: "materials fee", per: "per session hour" },
  { who: "A caterer", fee: "setup fee", per: "per hour of service" },
];
fill["a2l-fn-notation-d3"] = (rng, idx) => {
  const ctx = rng.pick(PAY_CTX);
  const rate = rng.pick([12, 15, 18, 20, 22, 25]);
  const base = rng.pick([20, 25, 30, 35, 40]);
  const h = rng.int(3, 9);
  const total = rate * h + base;
  return {
    id: `gen.a2l-fn-notation-d3.${idx}`, generated: true, concepts: ["function-notation"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} charges $P(h) = ${rate}h + ${base}$ dollars for $h$ hours (a \\$${base} ${ctx.fee} plus \\$${rate} ${ctx.per}). One job paid \\$${total}. Solve $P(h) = ${total}$ to find the hours worked.`,
    steps: [
      { instruction: `Set the pay rule equal to ${total}.`, answer: `${rate}h + ${base} = ${total}`, accept: [`${rate}h+${base}=${total}`, `${base}+${rate}h=${total}`], hint: `Replace $P(h)$ with the rule and set it equal to the pay.` },
      { instruction: `Subtract the ${ctx.fee} from both sides.`, answer: `${rate}h = ${rate * h}`, accept: [`${rate}h=${rate * h}`], hint: `Undo the $+${base}$ first.` },
      { instruction: `Solve for $h$.`, answer: `h = ${h}`, accept: [`h=${h}`, `${h}`], hint: `Divide both sides by ${rate}.` },
    ],
    finalAnswer: { value: `${h}`, unit: "hours" },
    solutionNarrative: `$${rate}h + ${base} = ${total}$; subtract ${base} to get $${rate}h = ${rate * h}$, then divide by ${rate}: $h = ${h}$ hours. The statement $P(${h}) = ${total}$ read backward.`,
  };
};

// --- domain-and-range d3: root AND denominator restrictions together ---
fill["a2l-domain-range-d3"] = (rng, idx) => {
  const c = rng.int(1, 6);
  const d = c + rng.int(1, 5);
  return {
    id: `gen.a2l-domain-range-d3.${idx}`, generated: true, concepts: ["domain-and-range"], difficulty: 3, context: "abstract",
    prompt: `The function $f(x) = \\dfrac{\\sqrt{x - ${c}}}{x - ${d}}$ has TWO restrictions on its domain: the square root needs a non-negative inside, and the denominator cannot be zero.`,
    steps: [
      { instruction: `Solve the square-root restriction $x - ${c} \\geq 0$. Give an inequality in $x$.`, answer: `x >= ${c}`, accept: [`x>=${c}`, `${c} <= x`], hint: `Add ${c} to both sides.` },
      { instruction: `Which single value does the denominator exclude?`, answer: `x = ${d}`, accept: [`${d}`, `x=${d}`], hint: `$x - ${d} = 0$ where?` },
      { instruction: `The domain is $x \\geq ${c}$ with $x = ${d}$ removed. What is the SMALLEST number in the domain?`, answer: `${c}`, accept: [`x=${c}`], hint: `$x = ${c}$ makes the root $\\sqrt{0} = 0$, which is allowed — and $${c} \\neq ${d}$.` },
    ],
    finalAnswer: { value: `x >= ${c}, x != ${d}`, unit: "" },
    solutionNarrative: `The root demands $x \\geq ${c}$; the denominator forbids $x = ${d}$. Both apply at once, so the domain is $x \\geq ${c}$ except $x = ${d}$, and its smallest member is $${c}$.`,
  };
};

// --- composition d1: build f(g(x)) from two linear machines, then evaluate ---
fill["a2l-composition-d1"] = (rng, idx) => {
  const a = rng.int(1, 9);
  const b = rng.int(2, 9);
  const k = rng.int(2, 6);
  const outer = rng.int(0, 1) === 1;              // false: f(g(x)); true: g(f(x))
  const comp = outer ? `g(f(x))` : `f(g(x))`;
  const expr = outer ? `${b}x + ${a * b}` : `${b}x + ${a}`;
  const val = outer ? b * (k + a) : b * k + a;
  return {
    id: `gen.a2l-composition-d1.${idx}`, generated: true, concepts: ["composition"], difficulty: 1, context: "abstract",
    prompt: `Given $f(x) = x + ${a}$ and $g(x) = ${b}x$, find $${comp}$.`,
    steps: [
      { instruction: outer
          ? `Substitute the whole rule $f(x) = x + ${a}$ in for $x$ inside $g$, and simplify.`
          : `Substitute the whole rule $g(x) = ${b}x$ in for $x$ inside $f$.`,
        answer: expr, accept: [squash(expr), outer ? `${b}(x + ${a})` : `${a} + ${b}x`], hint: outer ? `$g(\\text{input}) = ${b} \\cdot \\text{input}$; the input is $x + ${a}$.` : `$f(\\text{input}) = \\text{input} + ${a}$; the input is $${b}x$.` },
      { instruction: `Evaluate $${outer ? `g(f(${k}))` : `f(g(${k}))`}$ by plugging $x = ${k}$ into your rule.`, answer: `${val}`, accept: [], hint: outer ? `Inside-out: $f(${k}) = ${k + a}$, then $g(${k + a})$.` : `Inside-out: $g(${k}) = ${b * k}$, then $f(${b * k})$.` },
    ],
    finalAnswer: { value: expr, unit: "" },
    solutionNarrative: outer
      ? `$g(f(x)) = ${b}(x + ${a}) = ${expr}$. At $x = ${k}$: $f(${k}) = ${k + a}$, then $g(${k + a}) = ${val}$.`
      : `$f(g(x)) = (${b}x) + ${a} = ${expr}$. At $x = ${k}$: $g(${k}) = ${b * k}$, then $f(${b * k}) = ${val}$.`,
  };
};

// --- composition d3: applied discount-then-tax collapsed to one multiplier ---
const SHOP_ITEMS = ["jacket", "bicycle", "pair of headphones", "coffee maker"];
fill["a2l-composition-d3"] = (rng, idx) => {
  const p = rng.pick([10, 20, 25, 30]);           // discount %
  const q = rng.pick([5, 6, 8, 10]);              // tax %
  const m = rng.int(3, 9);                        // price = 100m dollars
  const price = 100 * m;
  const c1 = `${(100 - p) / 100}`;                // "0.8" (exact)
  const c2 = `${(100 + q) / 100}`;                // "1.05" (exact)
  const prod = (100 - p) * (100 + q);             // combined multiplier * 10^4
  const combined = `${prod / 10000}`;             // e.g. "0.84" (exact)
  const cents = m * prod;                         // price * combined in cents, exact
  const item = rng.pick(SHOP_ITEMS);
  return {
    id: `gen.a2l-composition-d3.${idx}`, generated: true, concepts: ["composition"], difficulty: 3, context: "applied",
    prompt: `A store applies a ${p}% discount, $g(x) = ${c1}x$, and then ${q}% sales tax, $f(x) = ${c2}x$, to the discounted price. Find the combined checkout rule $f(g(x))$, then the final cost of a \\$${price} ${item}.`,
    steps: [
      { instruction: `Substitute $g(x) = ${c1}x$ in for $x$ inside $f(x) = ${c2}x$.`, answer: `${c2}(${c1}x)`, accept: [`${c2}*${c1}x`, `${combined}x`], hint: `Feed the discounted price into the tax rule.` },
      { instruction: `Multiply the constants to get the combined rule.`, answer: `${combined}x`, accept: [`${combined}*x`], hint: `$${c2} \\times ${c1} = ${combined}$.` },
      { instruction: `Evaluate the combined rule at $x = ${price}$ (round to the nearest cent).`, answer: money(cents), accept: [`${cents / 100}`], hint: `$${combined} \\times ${price}$.` },
    ],
    finalAnswer: { value: money(cents), unit: "dollars" },
    solutionNarrative: `$f(g(x)) = ${c2}(${c1}x) = ${combined}x$ — the whole checkout is one multiplier. At $x = ${price}$ that gives $${combined} \\times ${price} = \\$${money(cents)}$.`,
  };
};

// --- inverse-functions d1: invert a one-step rule and run a value backward ---
fill["a2l-inverse-d1"] = (rng, idx) => {
  const a = rng.int(2, 9);
  const k = rng.int(2, 9);
  const kind = rng.pick(["add", "sub", "mul"]);
  let fStr, inv, invAccept, v, hint1;
  if (kind === "add") {
    fStr = `x + ${a}`; inv = `x - ${a}`; invAccept = [`x-${a}`]; v = k + a;
    hint1 = `After swapping, $x = y + ${a}$; subtract ${a}.`;
  } else if (kind === "sub") {
    fStr = `x - ${a}`; inv = `x + ${a}`; invAccept = [`x+${a}`]; v = k - a;
    hint1 = `After swapping, $x = y - ${a}$; add ${a}.`;
  } else {
    fStr = `${a}x`; inv = `x/${a}`; invAccept = [`x / ${a}`, `(1/${a})x`]; v = a * k;
    hint1 = `After swapping, $x = ${a}y$; divide by ${a}.`;
  }
  return {
    id: `gen.a2l-inverse-d1.${idx}`, generated: true, concepts: ["inverse-functions"], difficulty: 1, context: "abstract",
    prompt: `Find the inverse of $f(x) = ${fStr}$, then use it to undo an output.`,
    steps: [
      { instruction: `Write $y = ${fStr}$, swap $x$ and $y$, then solve for $y$. Give $f^{-1}(x)$.`, answer: inv, accept: invAccept, hint: hint1 },
      { instruction: `Since $f(${k}) = ${v}$, the inverse must send ${v} back to the original input. Compute $f^{-1}(${v})$.`, answer: `${k}`, accept: [], hint: kind === "mul" ? `$${v} \\div ${a}$.` : kind === "add" ? `$${v} - ${a}$.` : `$${v} + ${a}$.` },
    ],
    finalAnswer: { value: inv, unit: "" },
    solutionNarrative: `Swapping and solving gives $f^{-1}(x) = ${inv}$. Check the round trip: $f(${k}) = ${v}$ and $f^{-1}(${v}) = ${k}$ — the inverse undoes $f$.`,
  };
};

// --- inverse-functions d3: full swap-and-solve on ax + b, with verification ---
fill["a2l-inverse-d3"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const b = nz(rng, -9, 9);
  const k = rng.int(2, 8);
  const v = a * k + b;
  const fStr = `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`;
  const lhs = fmtShift(b);                        // "x - b" with sign folded in
  const inv = `(${lhs})/${a}`;
  return {
    id: `gen.a2l-inverse-d3.${idx}`, generated: true, concepts: ["inverse-functions"], difficulty: 3, context: "abstract",
    prompt: `Find the inverse of $f(x) = ${fStr}$, then verify it by running an output backward.`,
    steps: [
      { instruction: `Write $y = ${fStr}$, swap $x$ and $y$: $x = ${a}y ${b < 0 ? "-" : "+"} ${Math.abs(b)}$. ${b < 0 ? `Add ${-b} to` : `Subtract ${b} from`} both sides.`, answer: `${lhs} = ${a}y`, accept: [`${squash(lhs)}=${a}y`, `${a}y = ${lhs}`], hint: `Isolate the term with $y$.` },
      { instruction: `Divide both sides by ${a} to get $f^{-1}(x)$.`, answer: inv, accept: [squash(inv)], hint: `The inverse ${b < 0 ? "adds" : "subtracts"} ${Math.abs(b)} first, then divides by ${a}.` },
      { instruction: `Verify: $f(${k}) = ${v}$. Compute $f^{-1}(${v})$ — it should return the original input.`, answer: `${k}`, accept: [], hint: `$(${v} ${b < 0 ? "+" : "-"} ${Math.abs(b)})/${a} = ${a * k}/${a}$.` },
    ],
    finalAnswer: { value: inv, unit: "" },
    solutionNarrative: `Swap to $x = ${a}y ${b < 0 ? "-" : "+"} ${Math.abs(b)}$, isolate: $${lhs} = ${a}y$, divide by ${a}: $f^{-1}(x) = ${inv}$. Round trip: $f(${k}) = ${v}$ and $f^{-1}(${v}) = ${k}$. ✓`,
  };
};

// ===========================================================================
// TOPIC: algebra-2.logarithms
// ===========================================================================

// --- log-properties d1: product rule collapses a sum into one log ---
fill["a2l-log-props-d1"] = (rng, idx) => {
  const b = rng.pick([2, 3]);
  const k = b === 2 ? rng.int(4, 6) : rng.int(3, 4);
  let i = rng.int(1, k - 1);
  if (2 * i === k) i = i === 1 ? i + 1 : i - 1;    // keep the two arguments distinct
  const M = b ** i, N = b ** (k - i), MN = b ** k;
  return {
    id: `gen.a2l-log-props-d1.${idx}`, generated: true, concepts: ["log-properties"], difficulty: 1, context: "abstract",
    prompt: `Use the product rule to evaluate $\\log_{${b}}(${M}) + \\log_{${b}}(${N})$.`,
    steps: [
      { instruction: `The product rule combines the sum into one log: $\\log_{${b}}(${M} \\cdot ${N})$. What number is inside the log?`, answer: `${MN}`, accept: [], hint: `$${M} \\times ${N}$.` },
      { instruction: `Evaluate $\\log_{${b}}(${MN})$: ${b} to what power equals ${MN}?`, answer: `${k}`, accept: [], hint: `$${b}^{${k}} = ${MN}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\log_{${b}}(${M}) + \\log_{${b}}(${N}) = \\log_{${b}}(${MN})$, and $${b}^{${k}} = ${MN}$, so the value is ${k}. Logs turn multiplication into addition.`,
  };
};

// --- log-properties d3: power rule + product rule chained ---
fill["a2l-log-props-d3"] = (rng, idx) => {
  const b = rng.pick([2, 3]);
  const i = b === 2 ? rng.int(2, 3) : rng.int(1, 2);
  const j = b === 2 ? rng.int(1, 3) : rng.int(1, 2);
  const M = b ** i, N = b ** j;
  const k = 2 * i + j;
  const Msq = M * M, arg = Msq * N;
  return {
    id: `gen.a2l-log-props-d3.${idx}`, generated: true, concepts: ["log-properties"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $2\\log_{${b}}(${M}) + \\log_{${b}}(${N})$ by combining it into a single logarithm first.`,
    steps: [
      { instruction: `Apply the power rule to the first term: $2\\log_{${b}}(${M}) = \\log_{${b}}(${M}^2)$. What number is inside that log?`, answer: `${Msq}`, accept: [], hint: `$${M}^2 = ${M} \\times ${M}$.` },
      { instruction: `Now apply the product rule: $\\log_{${b}}(${Msq}) + \\log_{${b}}(${N}) = \\log_{${b}}(?)$. What number is inside the single log?`, answer: `${arg}`, accept: [], hint: `$${Msq} \\times ${N}$.` },
      { instruction: `Evaluate $\\log_{${b}}(${arg})$: ${b} to what power equals ${arg}?`, answer: `${k}`, accept: [], hint: `$${b}^{${k}} = ${arg}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `Power rule first: $2\\log_{${b}}(${M}) = \\log_{${b}}(${Msq})$. Product rule next: $\\log_{${b}}(${Msq} \\cdot ${N}) = \\log_{${b}}(${arg})$. Since $${b}^{${k}} = ${arg}$, the value is ${k}.`,
  };
};

// --- solve-with-logs d1: move the unknown out of (or into) the exponent ---
fill["a2l-solve-logs-d1"] = (rng, idx) => {
  const inExp = rng.int(0, 1) === 1;
  if (inExp) {
    const b = rng.pick([2, 3, 10]);
    const k = b === 2 ? rng.int(3, 6) : b === 3 ? rng.int(2, 4) : rng.int(2, 5);
    const N = b ** k;
    return {
      id: `gen.a2l-solve-logs-d1.${idx}`, generated: true, concepts: ["solve-with-logs"], difficulty: 1, context: "abstract",
      prompt: `Solve for $x$: $${b}^x = ${N}$.`,
      steps: [
        { instruction: `Rewrite in log form: $x = \\log_{${b}}(${N})$. ${b} to what power equals ${N}?`, answer: `${k}`, accept: [], hint: `$${b}^{${k}} = ${N}$.` },
        { instruction: `So what is $x$?`, answer: `${k}`, accept: [`x=${k}`, `x = ${k}`], hint: `The log IS the exponent.` },
      ],
      finalAnswer: { value: `${k}`, unit: "" },
      solutionNarrative: `$${b}^x = ${N}$ means $x = \\log_{${b}}(${N}) = ${k}$, since $${b}^{${k}} = ${N}$.`,
    };
  }
  const b = rng.pick([2, 3, 10]);
  const k = b === 2 ? rng.int(3, 5) : b === 3 ? rng.int(2, 3) : rng.int(2, 3);
  const N = b ** k;
  return {
    id: `gen.a2l-solve-logs-d1.${idx}`, generated: true, concepts: ["solve-with-logs"], difficulty: 1, context: "abstract",
    prompt: `Solve for $x$: $\\log_{${b}}(x) = ${k}$.`,
    steps: [
      { instruction: `Rewrite in exponential form: $x = ${b}^{${k}}$.`, answer: `x = ${b}^${k}`, accept: [`x=${b}^${k}`, `${b}^${k}`, `x = ${N}`], hint: `$\\log_b(y) = x$ means $b^x = y$ — the base raised to the log's value.` },
      { instruction: `Compute $${b}^{${k}}$ to find $x$.`, answer: `${N}`, accept: [`x=${N}`, `x = ${N}`], hint: `Multiply ${b} by itself ${k} times.` },
    ],
    finalAnswer: { value: `${N}`, unit: "" },
    solutionNarrative: `$\\log_{${b}}(x) = ${k}$ rewrites as $x = ${b}^{${k}} = ${N}$.`,
  };
};

// --- log-applications d1: read a pH or decibel value off a power of 10 ---
fill["a2l-log-apps-d1"] = (rng, idx) => {
  const isPh = rng.int(0, 1) === 1;
  if (isPh) {
    const k = rng.int(3, 9);
    return {
      id: `gen.a2l-log-apps-d1.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 1, context: "applied",
      prompt: `The acidity of a solution is $\\text{pH} = -\\log_{10}[\\text{H}^+]$. A sample has hydrogen-ion concentration $[\\text{H}^+] = 10^{-${k}}$. What is its pH?`,
      steps: [
        { instruction: `Compute $\\log_{10}(10^{-${k}})$.`, answer: `${-k}`, accept: [], hint: `The log of a power of 10 is just the exponent.` },
        { instruction: `Apply the negative sign: pH $= -(${-k})$. What is the pH?`, answer: `${k}`, accept: [], hint: `Negate $${-k}$.` },
      ],
      finalAnswer: { value: `${k}`, unit: "pH" },
      solutionNarrative: `$\\log_{10}(10^{-${k}}) = -${k}$, so $\\text{pH} = -(-${k}) = ${k}$. Each whole pH unit is a tenfold change in acidity.`,
    };
  }
  const k = rng.int(2, 6);
  return {
    id: `gen.a2l-log-apps-d1.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 1, context: "applied",
    prompt: `Sound level in decibels is $L = 10\\log_{10}(I/I_0)$. A sound has intensity $I = 10^{${k}} \\, I_0$ (that is, $10^{${k}}$ times the reference). What is its level in decibels?`,
    steps: [
      { instruction: `Compute $\\log_{10}(10^{${k}})$.`, answer: `${k}`, accept: [], hint: `The log of a power of 10 is just the exponent.` },
      { instruction: `Multiply by 10: $L = 10 \\times ${k}$. What is $L$?`, answer: `${10 * k}`, accept: [], hint: `$10 \\times ${k}$.` },
    ],
    finalAnswer: { value: `${10 * k}`, unit: "decibels" },
    solutionNarrative: `$\\log_{10}(10^{${k}}) = ${k}$, so $L = 10 \\times ${k} = ${10 * k}$ decibels. Every $+10$ dB is ten times the intensity.`,
  };
};

// ===========================================================================
// TOPIC: algebra-2.radicals
// ===========================================================================

// --- simplify-radicals d1: recognize and extract a perfect square ---
fill["a2l-simplify-rad-d1"] = (rng, idx) => {
  const k = rng.int(6, 16);
  const N = k * k;
  return {
    id: `gen.a2l-simplify-rad-d1.${idx}`, generated: true, concepts: ["simplify-radicals"], difficulty: 1, context: "abstract",
    prompt: `Simplify: $\\sqrt{${N}}$`,
    steps: [
      { instruction: `${N} is a perfect square. What is its square root?`, answer: `${k}`, accept: [], hint: `$${k} \\times ${k} = ${N}$.` },
      { instruction: `Check your answer: what is $${k}^2$?`, answer: `${N}`, accept: [], hint: `Squaring undoes the square root.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$${k}^2 = ${N}$, so $\\sqrt{${N}} = ${k}$ — everything comes out of the root, leaving a plain integer.`,
  };
};

// --- simplify-radicals d3: extract a square factor, then combine like radicals ---
fill["a2l-simplify-rad-d3"] = (rng, idx) => {
  let a, sqfree;
  do {
    a = rng.int(2, 5);
    sqfree = rng.pick([2, 3, 5, 6, 7, 10]);
  } while (a * a * sqfree > 300);
  const N = a * a * sqfree;
  const c = rng.int(2, 6);
  const sum = a + c;
  const dec = (x) => `${Math.round(x * 100) / 100}`;
  return {
    id: `gen.a2l-simplify-rad-d3.${idx}`, generated: true, concepts: ["simplify-radicals"], difficulty: 3, context: "abstract",
    prompt: `Simplify $\\sqrt{${N}}$ to the form $a\\sqrt{b}$, then compute $\\sqrt{${N}} + ${c}\\sqrt{${sqfree}}$. Type radical answers like 5\\sqrt{2}.`,
    steps: [
      { instruction: `Find the largest perfect-square factor of ${N}.`, answer: `${a * a}`, accept: [], hint: `$${N} = ${a * a} \\times ${sqfree}$, and $${a * a} = ${a}^2$.` },
      { instruction: `Write $\\sqrt{${N}}$ in simplified form $a\\sqrt{b}$.`, answer: `${a}\\sqrt{${sqfree}}`, accept: [`${a}sqrt(${sqfree})`, dec(a * Math.sqrt(sqfree))], hint: `$\\sqrt{${a * a}} = ${a}$ comes out; the ${sqfree} stays under the root.` },
      { instruction: `Now both terms are like radicals. Compute $${a}\\sqrt{${sqfree}} + ${c}\\sqrt{${sqfree}}$.`, answer: `${sum}\\sqrt{${sqfree}}`, accept: [`${sum}sqrt(${sqfree})`, dec(sum * Math.sqrt(sqfree))], hint: `Add the coefficients, exactly like $${a}x + ${c}x$: $(${a} + ${c})\\sqrt{${sqfree}}$.` },
    ],
    finalAnswer: { value: `${sum}\\sqrt{${sqfree}}`, unit: "" },
    solutionNarrative: `$\\sqrt{${N}} = \\sqrt{${a * a} \\cdot ${sqfree}} = ${a}\\sqrt{${sqfree}}$. Once simplified, the radicals match, so they add like like terms: $${a}\\sqrt{${sqfree}} + ${c}\\sqrt{${sqfree}} = ${sum}\\sqrt{${sqfree}}$.`,
  };
};

// --- evaluate-roots d2: decimal square roots and cube roots ---
fill["a2l-eval-roots-d2"] = (rng, idx) => {
  const cube = rng.int(0, 1) === 1;
  if (cube) {
    const k = rng.int(2, 6);
    const N = k * k * k;
    return {
      id: `gen.a2l-eval-roots-d2.${idx}`, generated: true, concepts: ["evaluate-roots"], difficulty: 2, context: "abstract",
      prompt: `Evaluate the cube root: $\\sqrt[3]{${N}}$`,
      steps: [
        { instruction: `What number multiplied by itself three times gives ${N}?`, answer: `${k}`, accept: [], hint: `$${k} \\times ${k} \\times ${k} = ${N}$.` },
        { instruction: `Check: what is $${k}^3$?`, answer: `${N}`, accept: [], hint: `$${k} \\times ${k} = ${k * k}$, then $\\times ${k}$ again.` },
      ],
      finalAnswer: { value: `${k}`, unit: "" },
      solutionNarrative: `$${k}^3 = ${N}$, so $\\sqrt[3]{${N}} = ${k}$.`,
    };
  }
  const k = rng.int(2, 9);
  const NStr = `${(k * k) / 100}`;                // e.g. "0.36" (exact)
  const rootStr = `${k / 10}`;                    // e.g. "0.6" (exact)
  return {
    id: `gen.a2l-eval-roots-d2.${idx}`, generated: true, concepts: ["evaluate-roots"], difficulty: 2, context: "abstract",
    prompt: `Evaluate the decimal square root: $\\sqrt{${NStr}}$`,
    steps: [
      { instruction: `Ignore the decimal point for a moment: what is $\\sqrt{${k * k}}$?`, answer: `${k}`, accept: [], hint: `$${k} \\times ${k} = ${k * k}$.` },
      { instruction: `Now place the decimal: what number squared gives ${NStr}?`, answer: rootStr, accept: [frac(k, 10)], hint: `$${rootStr} \\times ${rootStr} = ${NStr}$ — half the decimal places of the radicand.` },
    ],
    finalAnswer: { value: rootStr, unit: "" },
    solutionNarrative: `$${rootStr}^2 = ${NStr}$, so $\\sqrt{${NStr}} = ${rootStr}$. Squaring doubles the decimal places, so rooting halves them.`,
  };
};

// --- solve-radical-equations d1: sqrt(x) = k, square both sides, check ---
fill["a2l-solve-radical-d1"] = (rng, idx) => {
  const k = rng.int(3, 12);
  const sq = k * k;
  return {
    id: `gen.a2l-solve-radical-d1.${idx}`, generated: true, concepts: ["solve-radical-equations"], difficulty: 1, context: "abstract",
    prompt: `Solve for $x$:  $\\sqrt{x} = ${k}$`,
    steps: [
      { instruction: `Square both sides to free $x$: what is $${k}^2$?`, answer: `${sq}`, accept: [], hint: `$${k} \\times ${k}$.` },
      { instruction: `So what is the solution?`, answer: `x = ${sq}`, accept: [`x=${sq}`, `${sq}`], hint: `$(\\sqrt{x})^2 = x$, so $x$ equals the squared right side.` },
      { instruction: `Check by substituting back: what is $\\sqrt{${sq}}$?`, answer: `${k}`, accept: [], hint: `It should reproduce the original right side.` },
    ],
    finalAnswer: { value: `${sq}`, unit: "" },
    solutionNarrative: `Square both sides: $x = ${k}^2 = ${sq}$. Check: $\\sqrt{${sq}} = ${k}$. ✓`,
  };
};

// --- radical-applications d3: free-fall time AND impact speed ---
const DROP_SPOTS = ["bridge deck", "cliff ledge", "rooftop", "dam walkway"];
fill["a2l-radical-apps-d3"] = (rng, idx) => {
  const t = rng.int(2, 6);
  const hStr = `${(49 * t * t) / 10}`;            // h = 4.9 t^2, exact 1-decimal
  const vStr = `${(98 * t) / 10}`;                // v = 9.8 t, exact
  const spot = rng.pick(DROP_SPOTS);
  return {
    id: `gen.a2l-radical-apps-d3.${idx}`, generated: true, concepts: ["radical-applications"], difficulty: 3, context: "applied",
    prompt: `A tool slips off a ${spot} $h = ${hStr}$ m up. Free-fall time is $t = \\sqrt{2h/g}$ with $g = 9.8\\ \\text{m/s}^2$, and the impact speed is $v = g \\cdot t$. Find both.`,
    steps: [
      { instruction: `Compute the value inside the root, $2h/g = 2(${hStr})/9.8$.`, answer: `${t * t}`, accept: [], hint: `$2 \\times ${hStr} = ${(98 * t * t) / 10}$, and $${(98 * t * t) / 10} / 9.8 = ${t * t}$.` },
      { instruction: `Take the square root to find the fall time $t$ (seconds).`, answer: `${t}`, accept: [`t=${t}`], hint: `$\\sqrt{${t * t}} = ${t}$.` },
      { instruction: `Compute the impact speed $v = 9.8 \\times ${t}$ (m/s).`, answer: vStr, accept: [], hint: `$9.8 \\times ${t}$.` },
    ],
    finalAnswer: { value: vStr, unit: "m/s" },
    solutionNarrative: `$2h/g = ${t * t}$, so the fall takes $t = \\sqrt{${t * t}} = ${t}$ s, and it hits at $v = 9.8 \\times ${t} = ${vStr}$ m/s. The root undoes the square law of falling.`,
  };
};

// ===========================================================================
// TOPIC: algebra-2.rational-expressions
// ===========================================================================

// --- excluded-values d2: linear denominator with a coefficient ---
fill["a2l-excluded-d2"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const c = nz(rng, -8, 8);
  const b = a * c;                                 // denominator ax - b vanishes at x = c
  const m = rng.int(2, 9);                         // constant numerator
  const denStr = b < 0 ? `${a}x + ${-b}` : `${a}x - ${b}`;
  return {
    id: `gen.a2l-excluded-d2.${idx}`, generated: true, concepts: ["excluded-values"], difficulty: 2, context: "abstract",
    prompt: `For what value of $x$ is the expression $\\dfrac{${m}}{${denStr}}$ undefined?`,
    steps: [
      { instruction: `Set the denominator equal to zero and isolate the $x$ term.`, answer: `${a}x = ${b}`, accept: [`${a}x=${b}`, `${denStr} = 0`], hint: `A fraction is undefined when its bottom is zero; ${b < 0 ? `subtract ${-b} from` : `add ${b} to`} both sides.` },
      { instruction: `Solve for the excluded value $x$.`, answer: `x = ${c}`, accept: [`x=${c}`, `${c}`], hint: `Divide both sides by ${a}.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `The denominator $${denStr}$ is zero when $${a}x = ${b}$, i.e. $x = ${c}$ — the one excluded value.`,
  };
};

// --- excluded-values d3: factor a quadratic denominator, two exclusions ---
fill["a2l-excluded-d3"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -6, 6); q = nz(rng, -6, 6); } while (p === q || p + q === 0);
  const m = rng.int(2, 9);
  const denStr = fmtPoly([1, -(p + q), p * q]);
  return {
    id: `gen.a2l-excluded-d3.${idx}`, generated: true, concepts: ["excluded-values"], difficulty: 3, context: "abstract",
    prompt: `Find ALL excluded values of $\\dfrac{${m}}{${denStr}}$.`,
    steps: [
      { instruction: `Factor the denominator $${denStr}$.`, form: "factored", answer: `${fmtFactor(p)}${fmtFactor(q)}`, accept: [`${fmtFactor(q)}${fmtFactor(p)}`], hint: `Two numbers multiplying to ${p * q} and adding to ${p + q}.` },
      { instruction: `Set each factor to zero and give both excluded values (e.g. "x = 1 or x = 2").`, form: "solutions", answer: `x = ${p} or x = ${q}`, accept: [`${p}, ${q}`, `${q}, ${p}`], hint: `$${fmtFactor(p)} = 0$ and $${fmtFactor(q)} = 0$ — flip the sign inside each factor.` },
    ],
    finalAnswer: { value: `x = ${p}, x = ${q}`, unit: "" },
    solutionNarrative: `$${denStr} = ${fmtFactor(p)}${fmtFactor(q)}$, which is zero at $x = ${p}$ and $x = ${q}$; both are excluded.`,
  };
};

// --- simplify-rational d1: reduce a monomial fraction, state the exclusion ---
const COPRIME_PAIRS = [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6]];
fill["a2l-simplify-rational-d1"] = (rng, idx) => {
  const [a, b] = rng.pick(COPRIME_PAIRS);
  const m = rng.int(2, 4);
  const A = a * m, B = b * m;                      // (Ax)/(Bx^2) reduces to a/(bx)
  return {
    id: `gen.a2l-simplify-rational-d1.${idx}`, generated: true, concepts: ["simplify-rational"], difficulty: 1, context: "abstract",
    prompt: `Simplify $\\dfrac{${A}x}{${B}x^2}$ and state the excluded value.`,
    steps: [
      { instruction: `Cancel the common factors to simplify. Write your answer as a fraction like (2)/(3x).`, answer: `(${a})/(${b}x)`, accept: [`${a}/(${b}x)`], hint: `Cancel a ${m} and an $x$ from top and bottom, leaving $\\dfrac{${a}}{${b}x}$.` },
      { instruction: `What value of $x$ is excluded (makes the original denominator zero)?`, answer: `x = 0`, accept: [`x=0`, `0`], hint: `$${B}x^2 = 0$ only when $x = 0$.` },
    ],
    finalAnswer: { value: `(${a})/(${b}x)`, unit: "" },
    solutionNarrative: `$\\dfrac{${A}x}{${B}x^2} = \\dfrac{${a}}{${b}x}$ after cancelling $${m}x$. The original denominator $${B}x^2$ is zero at $x = 0$, so $x = 0$ is excluded.`,
  };
};

// --- simplify-rational d3: factor, cancel, then evaluate the reduced form ---
fill["a2l-simplify-rational-d3"] = (rng, idx) => {
  let c, a, b, k;
  do {
    c = rng.int(1, 5);                             // shared factor (x - c)
    a = rng.int(1, 6);                             // numerator partner (x + a)
    b = rng.int(1, 6);                             // denominator partner (x + b)
    k = rng.int(1, 6);                             // evaluation point
  } while (a === b || a === c || b === c || k === c);
  const numStr = fmtPoly([1, a - c, -a * c]);
  const denStr = fmtPoly([1, b - c, -b * c]);
  const val = frac(k + a, k + b);
  return {
    id: `gen.a2l-simplify-rational-d3.${idx}`, generated: true, concepts: ["simplify-rational"], difficulty: 3, context: "abstract",
    prompt: `Simplify $\\dfrac{${numStr}}{${denStr}}$ by factoring and cancelling, then evaluate the simplified expression at $x = ${k}$.`,
    steps: [
      { instruction: `Factor the numerator and the denominator.`, answer: `((x - ${c})(x + ${a}))/((x - ${c})(x + ${b}))`, accept: [`(x-${c})(x+${a})/((x-${c})(x+${b}))`], hint: `Both quadratics share the factor $(x - ${c})$; the partners are $(x + ${a})$ on top and $(x + ${b})$ below.` },
      { instruction: `Cancel the common factor. Write the simplified form as a fraction like (x+1)/(x+2).`, answer: `(x + ${a})/(x + ${b})`, accept: [`(x+${a})/(x+${b})`], hint: `Cancel $(x - ${c})$ from top and bottom.` },
      { instruction: `Evaluate the simplified expression at $x = ${k}$. Give a fraction in lowest terms.`, answer: val, accept: [`${k + a}/${k + b}`], hint: `$\\dfrac{${k} + ${a}}{${k} + ${b}} = \\dfrac{${k + a}}{${k + b}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$\\dfrac{(x - ${c})(x + ${a})}{(x - ${c})(x + ${b})} = \\dfrac{x + ${a}}{x + ${b}}$ after cancelling $(x - ${c})$ — though $x = ${c}$ stays excluded. At $x = ${k}$ the value is $${val}$.`,
  };
};

// --- evaluate-rational d1: substitute, top and bottom separately ---
fill["a2l-eval-rational-d1"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const b = rng.int(1, 9);
  const c = rng.int(1, 5);
  const k = c + rng.int(1, 5);                     // keeps the denominator positive
  const num = a * k + b, den = k - c;
  const val = frac(num, den);
  return {
    id: `gen.a2l-eval-rational-d1.${idx}`, generated: true, concepts: ["evaluate-rational"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\dfrac{${a}x + ${b}}{x - ${c}}$ at $x = ${k}$.`,
    steps: [
      { instruction: `Substitute $x = ${k}$ and compute the numerator.`, answer: `${num}`, accept: [], hint: `$${a}(${k}) + ${b} = ${a * k} + ${b}$.` },
      { instruction: `Compute the denominator at $x = ${k}$.`, answer: `${den}`, accept: [], hint: `$${k} - ${c}$.` },
      { instruction: `Divide to give the value.`, answer: val, accept: [`${num}/${den}`], hint: `$\\dfrac{${num}}{${den}}$${val.includes("/") ? ", reduced if possible" : ""}.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `At $x = ${k}$: numerator $${a}(${k}) + ${b} = ${num}$, denominator $${k} - ${c} = ${den}$, so the value is $${val}$.`,
  };
};

// --- evaluate-rational d3: applied per-person cost + long-run behavior ---
const SPLIT_CTX = [
  { group: "club", event: "banquet hall rental", person: "attendee" },
  { group: "team", event: "charter bus", person: "rider" },
  { group: "class", event: "field-trip package", person: "student" },
  { group: "band", event: "recording session", person: "member" },
];
fill["a2l-eval-rational-d3"] = (rng, idx) => {
  const ctx = rng.pick(SPLIT_CTX);
  const k = rng.pick([20, 25, 40, 50]);
  const v = rng.int(4, 9);
  const w = v + rng.int(6, 15);
  const F = k * (w - v);                           // flat fee chosen so the split is exact
  return {
    id: `gen.a2l-eval-rational-d3.${idx}`, generated: true, concepts: ["evaluate-rational"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.group} books a ${ctx.event} for a flat \\$${F} plus \\$${v} per ${ctx.person}, so the cost per ${ctx.person} is $\\dfrac{${F} + ${v}n}{n}$ dollars when $n$ people attend. Evaluate it at $n = ${k}$, then reason about large $n$.`,
    steps: [
      { instruction: `Compute the numerator (total cost) at $n = ${k}$.`, answer: `${F + v * k}`, accept: [], hint: `$${F} + ${v}(${k}) = ${F} + ${v * k}$.` },
      { instruction: `Divide by $n = ${k}$ to get the cost per ${ctx.person}, in dollars.`, answer: `${w}`, accept: [`$${w}`], hint: `$\\dfrac{${F + v * k}}{${k}}$.` },
      { instruction: `As $n$ grows very large, the flat fee's share $\\dfrac{${F}}{n}$ shrinks toward 0. What dollar amount does the cost per ${ctx.person} approach?`, answer: `${v}`, accept: [`$${v}`], hint: `Only the per-${ctx.person} \\$${v} survives when the flat fee is split among a huge crowd.` },
    ],
    finalAnswer: { value: `${w}`, unit: "dollars" },
    solutionNarrative: `At $n = ${k}$: total $${F} + ${v * k} = ${F + v * k}$, so each ${ctx.person} pays $\\dfrac{${F + v * k}}{${k}} = \\$${w}$. For huge $n$ the flat fee washes out and the cost per ${ctx.person} approaches \\$${v}.`,
  };
};

// ===========================================================================
// TOPIC: algebra-2.sequences-and-series
// ===========================================================================

// --- arithmetic-sequences d3: nth term + solve for the year a target is hit ---
const RAISE_CTX = ["An analyst", "A teacher", "A lab technician", "A paramedic"];
fill["a2l-arith-seq-d3"] = (rng, idx) => {
  const who = rng.pick(RAISE_CTX);
  const a1 = 1000 * rng.int(40, 52);
  const d = 500 * rng.int(3, 6);
  const n = rng.int(8, 12);
  const n2 = n + rng.int(3, 6);
  const an = a1 + (n - 1) * d;
  const T = a1 + (n2 - 1) * d;
  return {
    id: `gen.a2l-arith-seq-d3.${idx}`, generated: true, concepts: ["arithmetic-sequences"], difficulty: 3, context: "applied",
    prompt: `${who} starts at a salary of \\$${a1} and receives a flat raise of \\$${d} each year (year 1 is the starting salary). Find the year-${n} salary, then the first year the salary reaches \\$${T}.`,
    steps: [
      { instruction: `Identify $a_1$ and $d$. Enter the common difference $d$.`, answer: `${d}`, accept: [`$${d}`], hint: `The flat annual raise is the common difference.` },
      { instruction: `Use $a_n = a_1 + (n-1)d$ to find the salary in year ${n}.`, answer: `${an}`, accept: [`$${an}`], hint: `$${a1} + (${n} - 1)(${d}) = ${a1} + ${(n - 1) * d}$.` },
      { instruction: `Solve $${a1} + (n-1)(${d}) = ${T}$ for $n$: in which year does the salary first reach \\$${T}?`, answer: `${n2}`, accept: [`n=${n2}`, `year ${n2}`], hint: `$(n-1) = \\dfrac{${T} - ${a1}}{${d}} = ${n2 - 1}$.` },
    ],
    finalAnswer: { value: `${n2}`, unit: "year" },
    solutionNarrative: `With $a_1 = ${a1}$ and $d = ${d}$: year ${n} pays $${a1} + ${n - 1}(${d}) = \\$${an}$. Setting $a_n = ${T}$ gives $n - 1 = ${n2 - 1}$, so the salary reaches \\$${T} in year ${n2}.`,
  };
};

// --- arithmetic-series d1: sum 10 terms by pairing first and last ---
fill["a2l-arith-series-d1"] = (rng, idx) => {
  const a1 = rng.int(1, 6);
  const d = rng.int(2, 5);
  const a10 = a1 + 9 * d;
  const S = 5 * (a1 + a10);
  return {
    id: `gen.a2l-arith-series-d1.${idx}`, generated: true, concepts: ["arithmetic-series"], difficulty: 1, context: "abstract",
    prompt: `Find the sum of the first 10 terms of the arithmetic sequence $${a1}, ${a1 + d}, ${a1 + 2 * d}, ${a1 + 3 * d}, \\dots$`,
    steps: [
      { instruction: `Find the 10th term $a_{10}$ using $a_n = a_1 + (n-1)d$.`, answer: `${a10}`, accept: [], hint: `$d = ${d}$, so $a_{10} = ${a1} + 9(${d})$.` },
      { instruction: `Use $S_n = \\dfrac{n}{2}(a_1 + a_n)$ with $n = 10$.`, answer: `${S}`, accept: [], hint: `$\\dfrac{10}{2}(${a1} + ${a10}) = 5 \\times ${a1 + a10}$.` },
    ],
    finalAnswer: { value: `${S}`, unit: "" },
    solutionNarrative: `$a_{10} = ${a1} + 9(${d}) = ${a10}$, so $S_{10} = \\tfrac{10}{2}(${a1} + ${a10}) = 5 \\times ${a1 + a10} = ${S}$ — ten terms times the average of the first and last.`,
  };
};

// --- arithmetic-series d3: growing deposits — last term, total, and average ---
const SAVE_CTX = [
  { plan: "savings plan", put: "deposit", period: "week" },
  { plan: "fundraising drive", put: "donation collected", period: "week" },
];
fill["a2l-arith-series-d3"] = (rng, idx) => {
  const ctx = rng.pick(SAVE_CTX);
  const n = rng.pick([15, 21, 25]);                // odd n keeps a1 + an even
  const a1 = rng.pick([30, 40, 50, 60]);
  const d = rng.pick([5, 10, 15]);
  const an = a1 + (n - 1) * d;
  const S = (n * (a1 + an)) / 2;
  const avg = (a1 + an) / 2;
  return {
    id: `gen.a2l-arith-series-d3.${idx}`, generated: true, concepts: ["arithmetic-series"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.plan} starts with a \\$${a1} ${ctx.put} in ${ctx.period} 1 and grows by \\$${d} each ${ctx.period} (\\$${a1 + d} in ${ctx.period} 2, \\$${a1 + 2 * d} in ${ctx.period} 3, ...). Find the ${ctx.period}-${n} ${ctx.put}, the ${n}-${ctx.period} total, and the average per ${ctx.period}.`,
    steps: [
      { instruction: `Find the ${ctx.put} in ${ctx.period} ${n} using $a_n = a_1 + (n-1)d$.`, answer: `${an}`, accept: [`$${an}`], hint: `$${a1} + (${n} - 1)(${d}) = ${a1} + ${(n - 1) * d}$.` },
      { instruction: `Use $S_n = \\dfrac{n}{2}(a_1 + a_n)$ to total all ${n} ${ctx.period}s, in dollars.`, answer: `${S}`, accept: [`$${S}`], hint: `$\\dfrac{${n}}{2}(${a1} + ${an}) = \\dfrac{${n} \\times ${a1 + an}}{2}$.` },
      { instruction: `The average ${ctx.put} per ${ctx.period} is $S_n / n$ — which equals the average of the first and last. Compute it, in dollars.`, answer: `${avg}`, accept: [`$${avg}`, `${S}/${n}`], hint: `$\\dfrac{${a1} + ${an}}{2}$.` },
    ],
    finalAnswer: { value: `${S}`, unit: "dollars" },
    solutionNarrative: `${ctx.period.charAt(0).toUpperCase() + ctx.period.slice(1)} ${n}'s ${ctx.put} is $${a1} + ${n - 1}(${d}) = \\$${an}$. The total is $S_{${n}} = \\tfrac{${n}}{2}(${a1} + ${an}) = \\$${S}$, which averages $\\$${avg}$ per ${ctx.period} — exactly the mean of the first and last ${ctx.put}s.`,
  };
};

// --- geometric-series d1: sum a short written-out doubling/tripling series ---
fill["a2l-geom-series-d1"] = (rng, idx) => {
  const r = rng.pick([2, 3]);
  const n = r === 2 ? rng.int(4, 6) : rng.int(4, 5);
  const a1 = r === 2 ? rng.int(1, 6) : rng.int(1, 3);
  const terms = Array.from({ length: n }, (_, i) => a1 * r ** i);
  const S = (a1 * (r ** n - 1)) / (r - 1);
  return {
    id: `gen.a2l-geom-series-d1.${idx}`, generated: true, concepts: ["geometric-series"], difficulty: 1, context: "abstract",
    prompt: `Find the sum of the geometric series $${terms.join(" + ")}$.`,
    steps: [
      { instruction: `Identify $a_1$, $r$, and $n$. Enter the common ratio $r$.`, answer: `${r}`, accept: [`r=${r}`], hint: `Divide any term by the one before it: $${terms[1]} \\div ${terms[0]}$.` },
      { instruction: `Use $S_n = a_1 \\cdot \\dfrac{r^{n} - 1}{r - 1}$ with $a_1 = ${a1}$, $n = ${n}$.`, answer: `${S}`, accept: [], hint: `$${a1} \\cdot \\dfrac{${r ** n} - 1}{${r - 1}} = ${a1} \\cdot ${(r ** n - 1) / (r - 1)}$.` },
    ],
    finalAnswer: { value: `${S}`, unit: "" },
    solutionNarrative: `With $a_1 = ${a1}$, $r = ${r}$, $n = ${n}$: $S_{${n}} = ${a1} \\cdot \\dfrac{${r}^{${n}} - 1}{${r} - 1} = ${S}$. (Check: $${terms.join(" + ")} = ${S}$.)`,
  };
};

// ===========================================================================
// WAVE 2 — the 16 remaining thin algebra-2 pools (seeds <= 2, no generator):
//   exponential-functions: evaluate-exponential d3, growth-and-decay d1
//   logarithms:            log-definition d2+d3, solve-with-logs d3,
//                          log-applications d2+d3
//   radicals:              evaluate-roots d3, solve-radical-equations d3,
//                          radical-applications d2
//   sequences-and-series:  geometric-sequences d1+d3, geometric-series d3,
//                          arithmetic-sequences d2
//   functions:             domain-and-range d2
//   rational-expressions:  solve-rational-equations d1
// Same conventions as above: fixed concept+difficulty per template, all
// answers grader-verifiable (integers, exact decimals, fractions, equations,
// inequalities, and the seed-established "yes"/"no"/"no solution" strings).
// ===========================================================================

// --- evaluate-exponential d3: f(x) = a·b^x, difference of two outputs ---
fill["a2l-eval-exp-d3"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const b = rng.pick([2, 3, 5]);
  const p = b === 2 ? rng.int(4, 6) : b === 3 ? rng.int(3, 4) : 3;
  const q = p - 2;
  const v1 = a * b ** p, v2 = a * b ** q, diff = v1 - v2;
  return {
    id: `gen.a2l-eval-exp-d3.${idx}`, generated: true, concepts: ["evaluate-exponential"], difficulty: 3, context: "abstract",
    prompt: `For $f(x) = ${a} \\cdot ${b}^x$, evaluate $f(${p}) - f(${q})$.`,
    steps: [
      { instruction: `Find $f(${p})$ by computing $${a} \\cdot ${b}^{${p}}$.`, answer: `${v1}`, accept: [], hint: `$${b}^{${p}} = ${b ** p}$, then times ${a}.` },
      { instruction: `Find $f(${q})$ by computing $${a} \\cdot ${b}^{${q}}$.`, answer: `${v2}`, accept: [], hint: `$${b}^{${q}} = ${b ** q}$, then times ${a}.` },
      { instruction: `Subtract: $f(${p}) - f(${q})$.`, answer: `${diff}`, accept: [], hint: `$${v1} - ${v2}$.` },
    ],
    finalAnswer: { value: `${diff}`, unit: "" },
    solutionNarrative: `$f(${p}) = ${a} \\cdot ${b ** p} = ${v1}$ and $f(${q}) = ${a} \\cdot ${b ** q} = ${v2}$, so $f(${p}) - f(${q}) = ${diff}$. The exponential outgrows itself: two extra steps multiplied the output by $${b ** 2}$.`,
  };
};

// --- growth-and-decay d1: doubling/tripling population, evaluate the model ---
const GD1_CTX = [
  { what: "bacteria culture", unit: "bacteria", period: "hour" },
  { what: "colony of yeast cells", unit: "cells", period: "hour" },
  { what: "town", unit: "people", period: "decade" },
];
fill["a2l-growth-decay-d1"] = (rng, idx) => {
  const r = rng.pick([2, 3]);
  const n = r === 2 ? rng.int(3, 4) : rng.int(2, 3);
  const m = rng.int(2, 9);
  const P = 100 * m;
  const ctx = rng.pick(GD1_CTX);
  const word = r === 2 ? "doubles" : "triples";
  const pow = r ** n;
  const val = P * pow;
  return {
    id: `gen.a2l-growth-decay-d1.${idx}`, generated: true, concepts: ["growth-and-decay"], difficulty: 1, context: "applied",
    prompt: `A ${ctx.what} of ${P} ${ctx.unit} ${word} every ${ctx.period}. Using the model $${P} \\cdot ${r}^n$ where $n$ counts ${ctx.period}s, how many ${ctx.unit} are there after ${n} ${ctx.period}s?`,
    steps: [
      { instruction: `Evaluate the growth factor raised to the power: what is $${r}^{${n}}$?`, answer: `${pow}`, accept: [], hint: `Multiply ${r} by itself ${n} times.` },
      { instruction: `Multiply by the starting ${P}.`, answer: `${val}`, accept: [], hint: `$${P} \\times ${pow}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: `$${r}^{${n}} = ${pow}$, so the ${ctx.what} reaches $${P} \\cdot ${pow} = ${val}$ ${ctx.unit} after ${n} ${ctx.period}s.`,
  };
};

// --- log-definition d2: convert b^k = N (or a reciprocal) to log form ---
fill["a2l-log-def-d2"] = (rng, idx) => {
  const recip = rng.int(0, 1) === 1;
  const b = rng.pick([2, 3, 4, 5, 10]);
  if (recip) {
    const k = b === 2 ? rng.int(2, 5) : b === 3 ? rng.int(2, 4) : b === 5 ? 3 : rng.int(2, 3);
    const M = b ** k;
    return {
      id: `gen.a2l-log-def-d2.${idx}`, generated: true, concepts: ["log-definition"], difficulty: 2, context: "abstract",
      prompt: `Evaluate $\\log_{${b}}\\left(\\dfrac{1}{${M}}\\right)$.`,
      steps: [
        { instruction: `First compute $${b}^{${k}}$.`, answer: `${M}`, accept: [], hint: `Multiply ${b} by itself ${k} times.` },
        { instruction: `So $\\dfrac{1}{${M}} = ${b}^{?}$. Enter that exponent — it is the value of the log.`, answer: `${-k}`, accept: [], hint: `$${b}^{-${k}} = \\dfrac{1}{${b}^{${k}}}$.` },
      ],
      finalAnswer: { value: `${-k}`, unit: "" },
      solutionNarrative: `$${b}^{-${k}} = \\dfrac{1}{${M}}$, so $\\log_{${b}}\\!\\left(\\dfrac{1}{${M}}\\right) = ${-k}$. Reciprocals flip the sign of the exponent.`,
    };
  }
  const k = b === 2 ? rng.pick([3, 4, 6]) : b === 3 ? rng.int(2, 4) : b === 10 ? rng.int(2, 4) : rng.int(2, 3);
  const N = b ** k;
  return {
    id: `gen.a2l-log-def-d2.${idx}`, generated: true, concepts: ["log-definition"], difficulty: 2, context: "abstract",
    prompt: `Rewrite $${b}^{${k}} = ${N}$ in logarithmic form and read off the value of $\\log_{${b}}(${N})$.`,
    steps: [
      { instruction: `The form $b^x = y$ becomes $\\log_b(y) = x$. What is $\\log_{${b}}(${N})$?`, answer: `${k}`, accept: [], hint: `$${b}^{${k}} = ${N}$, so the exponent is ${k}.` },
      { instruction: `Check backward: what is $${b}^{${k}}$?`, answer: `${N}`, accept: [], hint: `The log and the power undo each other.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$${b}^{${k}} = ${N}$ converts to $\\log_{${b}}(${N}) = ${k}$ — the log IS the exponent.`,
  };
};

// --- log-definition d3: fractional value, base and argument share a root ---
const LOGDEF3 = [[2, 2, 1], [2, 3, 1], [2, 2, 3], [2, 3, 2], [3, 2, 1], [3, 3, 1], [3, 2, 3], [3, 3, 2], [5, 2, 1], [5, 2, 3]];
fill["a2l-log-def-d3"] = (rng, idx) => {
  const [b, m, j] = rng.pick(LOGDEF3);
  const B = b ** m, N = b ** j;
  const val = frac(j, m);
  const dec = m === 2 ? [`${j / 2}`] : [];
  return {
    id: `gen.a2l-log-def-d3.${idx}`, generated: true, concepts: ["log-definition"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\log_{${B}}(${N})$. (Hint: write both ${B} and ${N} as powers of ${b}.)`,
    steps: [
      { instruction: `Write the base as a power of ${b}: $${B} = ${b}^{?}$. Enter the exponent.`, answer: `${m}`, accept: [], hint: `$${b}^{${m}} = ${B}$.` },
      { instruction: `Write the argument as a power of ${b}: $${N} = ${b}^{?}$. Enter the exponent.`, answer: `${j}`, accept: [], hint: j === 1 ? `$${b}^1 = ${b}$.` : `$${b}^{${j}} = ${N}$.` },
      { instruction: `If $\\log_{${B}}(${N}) = x$, then $${B}^x = ${N}$, i.e. $${b}^{${m}x} = ${b}^{${j}}$. Solve $${m}x = ${j}$ for $x$. Give a fraction.`, answer: val, accept: [`x=${val}`, ...dec], hint: `Divide both sides by ${m}.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$${B} = ${b}^{${m}}$ and $${N} = ${b}^{${j}}$, so $${b}^{${m}x} = ${b}^{${j}}$ forces $${m}x = ${j}$: $\\log_{${B}}(${N}) = ${val}$. Logs can be fractions — the base just isn't the natural unit here.`,
  };
};

// --- solve-with-logs d3: isolate the power first, then take the log ---
fill["a2l-solve-logs-d3"] = (rng, idx) => {
  const b = rng.pick([2, 3]);
  const k = b === 2 ? rng.int(3, 5) : rng.int(2, 3);
  const a = rng.pick([3, 4, 5, 6, 7]);
  const N = b ** k;
  const M = a * N;
  return {
    id: `gen.a2l-solve-logs-d3.${idx}`, generated: true, concepts: ["solve-with-logs"], difficulty: 3, context: "abstract",
    prompt: `Solve for $x$: $${a} \\cdot ${b}^x = ${M}$. (Isolate the power before using logs.)`,
    steps: [
      { instruction: `Divide both sides by ${a} to isolate the power: $${b}^x = ?$`, answer: `${N}`, accept: [], hint: `$${M} \\div ${a}$.` },
      { instruction: `Now $x = \\log_{${b}}(${N})$: ${b} to what power equals ${N}?`, answer: `${k}`, accept: [`x=${k}`, `x = ${k}`], hint: `$${b}^{${k}} = ${N}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `The coefficient must come off first: $${b}^x = ${M}/${a} = ${N}$, so $x = \\log_{${b}}(${N}) = ${k}$. Taking a log of $${a} \\cdot ${b}^x$ directly would NOT give $x$ alone.`,
  };
};

// --- log-applications d2: ratio from a difference on a base-10 scale ---
fill["a2l-log-apps-d2"] = (rng, idx) => {
  const richter = rng.int(0, 1) === 1;
  const d = rng.int(2, 4);
  const low = rng.int(3, 5);
  const high = low + d;
  const ratio = 10 ** d;
  if (richter) {
    return {
      id: `gen.a2l-log-apps-d2.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 2, context: "applied",
      prompt: `On the Richter scale, each whole magnitude is a tenfold increase in shaking amplitude. How many times stronger is a magnitude-${high} earthquake than a magnitude-${low} earthquake?`,
      steps: [
        { instruction: `Find the difference in magnitude.`, answer: `${d}`, accept: [], hint: `$${high} - ${low}$.` },
        { instruction: `Each step is a factor of 10, so the ratio is $10^{${d}}$. Compute it.`, answer: `${ratio}`, accept: [], hint: `A 1 followed by ${d} zeros.` },
      ],
      finalAnswer: { value: `${ratio}`, unit: "times" },
      solutionNarrative: `The magnitudes differ by $${high} - ${low} = ${d}$, and each step multiplies amplitude by 10, so the ratio is $10^{${d}} = ${ratio}$ times.`,
    };
  }
  return {
    id: `gen.a2l-log-apps-d2.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 2, context: "applied",
    prompt: `The pH scale is logarithmic: each whole pH unit is a tenfold change in acidity, and LOWER pH means MORE acidic. Sample A has pH ${low} and sample B has pH ${high}. How many times more acidic is sample A?`,
    steps: [
      { instruction: `Find the difference in pH.`, answer: `${d}`, accept: [], hint: `$${high} - ${low}$.` },
      { instruction: `Each pH unit is a factor of 10 in acidity, so the ratio is $10^{${d}}$. Compute it.`, answer: `${ratio}`, accept: [], hint: `A 1 followed by ${d} zeros.` },
    ],
    finalAnswer: { value: `${ratio}`, unit: "times" },
    solutionNarrative: `The pH values differ by $${high} - ${low} = ${d}$ units, each a tenfold change, so sample A is $10^{${d}} = ${ratio}$ times more acidic.`,
  };
};

// --- log-applications d3: run the scale BACKWARD — from a ratio to a reading ---
fill["a2l-log-apps-d3"] = (rng, idx) => {
  const quake = rng.int(0, 1) === 1;
  const d = rng.int(2, 4);
  const N = 10 ** d;
  if (quake) {
    const m = rng.int(3, 5);
    const target = m + d;
    return {
      id: `gen.a2l-log-apps-d3.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 3, context: "applied",
      prompt: `An aftershock registers magnitude ${m} on the Richter scale. The main earthquake's shaking amplitude was ${N} times greater. Each whole magnitude step is a tenfold increase in amplitude. What was the main quake's magnitude?`,
      steps: [
        { instruction: `How many tenfold steps make a factor of ${N}? Compute $\\log_{10}(${N})$.`, answer: `${d}`, accept: [], hint: `$10^{${d}} = ${N}$.` },
        { instruction: `Add those steps to the aftershock's magnitude.`, answer: `${target}`, accept: [], hint: `$${m} + ${d}$.` },
      ],
      finalAnswer: { value: `${target}`, unit: "" },
      solutionNarrative: `A factor of ${N} is $\\log_{10}(${N}) = ${d}$ magnitude steps, so the main quake measured $${m} + ${d} = ${target}$. The log converts a ratio back into a scale reading.`,
    };
  }
  const pA = rng.int(5, 7);
  const pB = pA - d;
  return {
    id: `gen.a2l-log-apps-d3.${idx}`, generated: true, concepts: ["log-applications"], difficulty: 3, context: "applied",
    prompt: `Since $\\text{pH} = -\\log_{10}[\\text{H}^+]$, each whole pH unit is a tenfold change in acidity, and lower pH means more acidic. A vinegar sample is ${N} times more acidic than a coffee sample with pH ${pA}. What is the vinegar's pH?`,
    steps: [
      { instruction: `How many tenfold steps make a factor of ${N}? Compute $\\log_{10}(${N})$.`, answer: `${d}`, accept: [], hint: `$10^{${d}} = ${N}$.` },
      { instruction: `More acidic means LOWER pH: subtract those steps from the coffee's pH.`, answer: `${pB}`, accept: [], hint: `$${pA} - ${d}$.` },
    ],
    finalAnswer: { value: `${pB}`, unit: "pH" },
    solutionNarrative: `A factor of ${N} is $\\log_{10}(${N}) = ${d}$ pH units, and acidity grows as pH falls, so the vinegar's pH is $${pA} - ${d} = ${pB}$.`,
  };
};

// --- evaluate-roots d3: trap sqrt(N) between integers, then to 1 decimal ---
fill["a2l-eval-roots-d3"] = (rng, idx) => {
  let a, t, v10, N;
  do {
    a = rng.int(4, 9);
    t = rng.int(1, 9);
    v10 = 10 * a + t;                             // the answer is v10/10
    N = Math.round((v10 * v10) / 100);
  } while (Math.round(Math.sqrt(N) * 10) !== v10 || Number.isInteger(Math.sqrt(N)) || N === 20);
  const vStr = `${a}.${t}`;
  const lo2 = ((v10 - 1) * (v10 - 1)) / 100;       // (v - 0.1)^2, exact
  const hi2 = (v10 * v10) / 100;                   // v^2, exact
  return {
    id: `gen.a2l-eval-roots-d3.${idx}`, generated: true, concepts: ["evaluate-roots"], difficulty: 3, context: "abstract",
    prompt: `Estimate $\\sqrt{${N}}$ rounded to 1 decimal place.`,
    steps: [
      { instruction: `Which two consecutive whole numbers does $\\sqrt{${N}}$ fall between? Give the smaller one.`, answer: `${a}`, accept: [], hint: `$${a}^2 = ${a * a}$ and $${a + 1}^2 = ${(a + 1) * (a + 1)}$, and ${N} is between them.` },
      { instruction: `Now give $\\sqrt{${N}}$ rounded to 1 decimal place.`, answer: vStr, accept: [], hint: `$${(v10 - 1) / 10}^2 = ${lo2}$ and $${vStr}^2 = ${hi2}$, so it rounds to ${vStr}.` },
    ],
    finalAnswer: { value: vStr, unit: "" },
    solutionNarrative: `${N} sits between $${a * a}$ and $${(a + 1) * (a + 1)}$, so $\\sqrt{${N}}$ is between ${a} and ${a + 1}. Since $${vStr}^2 = ${hi2} \\approx ${N}$, $\\sqrt{${N}} \\approx ${vStr}$.`,
  };
};

// --- solve-radical-equations d3: shifted radical, or an extraneous trap ---
fill["a2l-solve-radical-d3"] = (rng, idx) => {
  const extraneous = rng.int(0, 1) === 1;
  if (extraneous) {
    const k = rng.pick([2, 4, 5, 6, 7, 8, 9]);     // 3 would clone the seed
    const sq = k * k;
    return {
      id: `gen.a2l-solve-radical-d3.${idx}`, generated: true, concepts: ["solve-radical-equations"], difficulty: 3, context: "abstract",
      prompt: `Solve for $x$:  $\\sqrt{x} = -${k}$. Watch for an extraneous result.`,
      steps: [
        { instruction: `Square both sides to get a candidate value.`, answer: `x = ${sq}`, accept: [`x=${sq}`, `${sq}`], hint: `$(-${k})^2 = ${sq}$.` },
        { instruction: `Check $x = ${sq}$ in the ORIGINAL equation: does $\\sqrt{${sq}} = -${k}$? Type 'yes' or 'no'.`, answer: `no`, accept: [`n`], hint: `The principal square root $\\sqrt{${sq}} = +${k}$, not $-${k}$.` },
        { instruction: `So how many solutions does the equation have? Type a number or 'no solution'.`, answer: `no solution`, accept: [`none`, `0`, `zero`], hint: `A square root can never equal a negative number.` },
      ],
      finalAnswer: { value: "no solution", unit: "" },
      solutionNarrative: `Squaring gives $x = ${sq}$, but $\\sqrt{${sq}} = ${k} \\ne -${k}$, so ${sq} is extraneous. A principal square root is never negative, so there is no solution.`,
    };
  }
  const k = rng.int(4, 9);
  const c = nz(rng, -15, 15);
  const x = k * k - c;
  const inside = c < 0 ? `x - ${-c}` : `x + ${c}`;
  return {
    id: `gen.a2l-solve-radical-d3.${idx}`, generated: true, concepts: ["solve-radical-equations"], difficulty: 3, context: "abstract",
    prompt: `Solve for $x$:  $\\sqrt{${inside}} = ${k}$, and check your answer.`,
    steps: [
      { instruction: `Square both sides.`, answer: `${inside} = ${k * k}`, accept: [`${squash(inside)}=${k * k}`], hint: `$${k}^2 = ${k * k}$.` },
      { instruction: `Solve for $x$.`, answer: `x = ${x}`, accept: [`x=${x}`, `${x}`], hint: c < 0 ? `Add ${-c} to both sides.` : `Subtract ${c} from both sides.` },
      { instruction: `Check by substituting back: $${x} ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${k * k}$, and $\\sqrt{${k * k}} = ?$`, answer: `${k}`, accept: [], hint: `It should reproduce the original right side.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Square: $${inside} = ${k * k}$, so $x = ${x}$. Check: $\\sqrt{${x} ${c < 0 ? "-" : "+"} ${Math.abs(c)}} = \\sqrt{${k * k}} = ${k}$. ✓`,
  };
};

// --- radical-applications d2: one clean formula-with-a-root evaluation ---
fill["a2l-radical-apps-d2"] = (rng, idx) => {
  const kinetic = rng.int(0, 1) === 1;
  if (kinetic) {
    let m, v;
    do {
      m = rng.pick([2, 4, 6, 8]);
      v = rng.int(3, 9);
    } while (m === 2 && v === 6);                  // seed s16's exact numbers
    const E = (m * v * v) / 2;
    const obj = rng.pick(["cart", "wagon", "go-kart", "sled"]);
    return {
      id: `gen.a2l-radical-apps-d2.${idx}`, generated: true, concepts: ["radical-applications"], difficulty: 2, context: "applied",
      prompt: `A ${m} kg ${obj} has kinetic energy $E = ${E}$ joules. Its speed is $v = \\sqrt{2E/m}$. Find $v$ in m/s.`,
      steps: [
        { instruction: `Compute the value inside the root, $2E/m = 2(${E})/${m}$.`, answer: `${v * v}`, accept: [], hint: `$2 \\times ${E} = ${2 * E}$, and $${2 * E} / ${m} = ${v * v}$.` },
        { instruction: `Take the square root to find $v$ (m/s).`, answer: `${v}`, accept: [`v=${v}`], hint: `$\\sqrt{${v * v}} = ${v}$.` },
      ],
      finalAnswer: { value: `${v}`, unit: "m/s" },
      solutionNarrative: `$v = \\sqrt{2(${E})/${m}} = \\sqrt{${v * v}} = ${v}$ m/s.`,
    };
  }
  const t = rng.pick([2, 4, 5, 6, 7]);             // 3 would clone seed s15
  const hStr = `${(49 * t * t) / 10}`;             // h = 4.9 t^2, exact 1-decimal
  const obj = rng.pick(["phone", "wrench", "acorn", "hailstone"]);
  return {
    id: `gen.a2l-radical-apps-d2.${idx}`, generated: true, concepts: ["radical-applications"], difficulty: 2, context: "applied",
    prompt: `A ${obj} falls from a height of $h = ${hStr}$ m. Free-fall time is $t = \\sqrt{2h/g}$ with $g = 9.8\\ \\text{m/s}^2$. Find $t$ in seconds.`,
    steps: [
      { instruction: `Compute the value inside the root, $2h/g = 2(${hStr})/9.8$.`, answer: `${t * t}`, accept: [], hint: `$2 \\times ${hStr} = ${(98 * t * t) / 10}$, and $${(98 * t * t) / 10} / 9.8 = ${t * t}$.` },
      { instruction: `Take the square root to find $t$ (seconds).`, answer: `${t}`, accept: [`t=${t}`], hint: `$\\sqrt{${t * t}} = ${t}$.` },
    ],
    finalAnswer: { value: `${t}`, unit: "seconds" },
    solutionNarrative: `$t = \\sqrt{2(${hStr})/9.8} = \\sqrt{${t * t}} = ${t}$ seconds.`,
  };
};

// --- geometric-sequences d1: spot the ratio, extend with the formula ---
fill["a2l-geom-seq-d1"] = (rng, idx) => {
  const r = rng.pick([2, 3]);
  const a1 = r === 2 ? rng.pick([2, 4, 5, 6]) : rng.int(1, 3); // a1=3, r=2 is seed s05
  const n = r === 2 ? 6 : 5;
  const an = a1 * r ** (n - 1);
  const terms = [a1, a1 * r, a1 * r * r, a1 * r ** 3];
  return {
    id: `gen.a2l-geom-seq-d1.${idx}`, generated: true, concepts: ["geometric-sequences"], difficulty: 1, context: "abstract",
    prompt: `Consider the geometric sequence $${terms.join(", ")}, \\dots$`,
    steps: [
      { instruction: `Find the common ratio $r$.`, answer: `${r}`, accept: [`r=${r}`], hint: `Divide a term by the previous one: $${terms[1]} \\div ${terms[0]}$.` },
      { instruction: `Find the ${n}th term $a_{${n}}$ using $a_n = a_1 \\cdot r^{n-1}$.`, answer: `${an}`, accept: [], hint: `$a_{${n}} = ${a1} \\cdot ${r}^{${n - 1}} = ${a1} \\cdot ${r ** (n - 1)}$.` },
    ],
    finalAnswer: { value: `${an}`, unit: "" },
    solutionNarrative: `The ratio is $r = ${terms[1]} / ${terms[0]} = ${r}$. Then $a_{${n}} = ${a1} \\cdot ${r}^{${n - 1}} = ${a1} \\cdot ${r ** (n - 1)} = ${an}$.`,
  };
};

// --- geometric-sequences d3: recover r from two non-adjacent terms ---
fill["a2l-geom-seq-d3"] = (rng, idx) => {
  const r = rng.pick([2, 3]);
  const a1 = r === 2 ? rng.int(2, 6) : rng.int(1, 4);
  const a2 = a1 * r, a4 = a1 * r ** 3, a6 = a1 * r ** 5;
  return {
    id: `gen.a2l-geom-seq-d3.${idx}`, generated: true, concepts: ["geometric-sequences"], difficulty: 3, context: "abstract",
    prompt: `A geometric sequence with positive terms has $a_2 = ${a2}$ and $a_4 = ${a4}$. Find the common ratio $r$, then find $a_6$.`,
    steps: [
      { instruction: `Terms two steps apart differ by a factor of $r^2$. Compute $a_4 / a_2$.`, answer: `${r * r}`, accept: [], hint: `$${a4} \\div ${a2}$.` },
      { instruction: `Take the square root to find $r$ (the terms are positive, so $r > 0$).`, answer: `${r}`, accept: [`r=${r}`], hint: `$\\sqrt{${r * r}} = ${r}$.` },
      { instruction: `Step forward two more terms: $a_6 = a_4 \\cdot r^2$.`, answer: `${a6}`, accept: [], hint: `$${a4} \\times ${r * r}$.` },
    ],
    finalAnswer: { value: `${a6}`, unit: "" },
    solutionNarrative: `$a_4 / a_2 = r^2 = ${r * r}$, so $r = ${r}$ (positive terms rule out $-${r}$). Then $a_6 = a_4 \\cdot r^2 = ${a4} \\cdot ${r * r} = ${a6}$.`,
  };
};

// --- geometric-series d3: total of doubling/tripling weekly amounts ---
const GS3_CTX = [
  { plan: "fundraising drive", amt: "collections" },
  { plan: "seedling giveaway", amt: "distributions" },
  { plan: "recycling challenge", amt: "collections" },
];
fill["a2l-geom-series-d3"] = (rng, idx) => {
  let r, n, m;
  do {
    r = rng.pick([2, 3]);
    n = r === 2 ? rng.int(6, 8) : rng.int(4, 5);
    m = rng.int(1, 4);
  } while (r === 2 && n === 7 && m === 2);         // seed s14's exact numbers
  const a1 = 100 * m;
  const rn = r ** n;
  const S = (a1 * (rn - 1)) / (r - 1);
  const word = r === 2 ? "double" : "triple";
  const ctx = rng.pick(GS3_CTX);
  return {
    id: `gen.a2l-geom-series-d3.${idx}`, generated: true, concepts: ["geometric-series"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.plan} brings in \\$${a1} in week 1, and each week's total is ${word} the previous week's. What is the combined total of the ${ctx.amt} over ${n} weeks?`,
    steps: [
      { instruction: `Identify $a_1$, $r$, and $n$. Enter the common ratio $r$.`, answer: `${r}`, accept: [`r=${r}`], hint: `Each week's amount is ${word} the one before.` },
      { instruction: `Compute $r^{n} = ${r}^{${n}}$.`, answer: `${rn}`, accept: [], hint: `Multiply ${r} by itself ${n} times.` },
      { instruction: `Use $S_n = a_1 \\cdot \\dfrac{r^{n} - 1}{r - 1}$ to total all ${n} weeks, in dollars.`, answer: `${S}`, accept: [`$${S}`], hint: `$${a1} \\cdot \\dfrac{${rn} - 1}{${r - 1}} = ${a1} \\cdot ${(rn - 1) / (r - 1)}$.` },
    ],
    finalAnswer: { value: `${S}`, unit: "dollars" },
    solutionNarrative: `With $a_1 = ${a1}$, $r = ${r}$, $n = ${n}$: $S_{${n}} = ${a1} \\cdot \\dfrac{${rn} - 1}{${r - 1}} = ${a1} \\cdot ${(rn - 1) / (r - 1)} = \\$${S}$. Late weeks dominate — the last week alone brings in \\$${a1 * r ** (n - 1)}.`,
  };
};

// --- arithmetic-sequences d2: explicit formula in the form an + b ---
fill["a2l-arith-seq-d2"] = (rng, idx) => {
  let a1, d;
  do {
    a1 = rng.int(1, 9);
    d = rng.int(2, 6);
  } while (a1 === d || (a1 === 2 && d === 3));     // a1=d makes b=0; (2,3) is seed s03
  const b = a1 - d;
  const formula = b < 0 ? `${d}n - ${-b}` : `${d}n + ${b}`;
  const a8 = 8 * d + b;
  const terms = [a1, a1 + d, a1 + 2 * d, a1 + 3 * d];
  return {
    id: `gen.a2l-arith-seq-d2.${idx}`, generated: true, concepts: ["arithmetic-sequences"], difficulty: 2, context: "abstract",
    prompt: `An arithmetic sequence starts $${terms.join(", ")}, \\dots$. Write the explicit formula for the $n$th term, simplified to the form $an + b$, then use it to find $a_8$.`,
    steps: [
      { instruction: `Find $a_1$ and the common difference $d$. Enter $d$.`, answer: `${d}`, accept: [`d=${d}`], hint: `$d = ${a1 + d} - ${a1}$.` },
      { instruction: `Substitute into $a_n = a_1 + (n-1)d$ and simplify to the form $an + b$.`, answer: formula, accept: [squash(formula), `${d}*n ${b < 0 ? "-" : "+"} ${Math.abs(b)}`], hint: `$${a1} + (n-1)(${d}) = ${a1} + ${d}n - ${d} = ${formula}$.` },
      { instruction: `Evaluate your formula at $n = 8$ to find $a_8$.`, answer: `${a8}`, accept: [], hint: `$${d}(8) ${b < 0 ? "-" : "+"} ${Math.abs(b)}$.` },
    ],
    finalAnswer: { value: formula, unit: "" },
    solutionNarrative: `$a_1 = ${a1}$, $d = ${d}$, so $a_n = ${a1} + (n-1)(${d}) = ${formula}$. Check: $n = 1$ gives ${a1}. ✓ Then $a_8 = ${formula.replace("n", "(8)")} = ${a8}$.`,
  };
};

// --- domain-and-range d2: one restriction at a time (root, square, or denominator) ---
fill["a2l-domain-range-d2"] = (rng, idx) => {
  const kind = rng.pick(["root", "range", "denom"]);
  if (kind === "root") {
    let c, plus;
    do {
      c = rng.int(2, 9);
      plus = rng.int(0, 1) === 1;
    } while (!plus && c === 5);                    // sqrt(x - 5) is seed s07
    const inside = plus ? `x + ${c}` : `x - ${c}`;
    const bound = plus ? -c : c;
    return {
      id: `gen.a2l-domain-range-d2.${idx}`, generated: true, concepts: ["domain-and-range"], difficulty: 2, context: "abstract",
      prompt: `The function $f(x) = \\sqrt{${inside}}$ requires the inside of the square root to be non-negative. What is its domain? Give your answer as an inequality in $x$.`,
      steps: [
        { instruction: `Set the inside of the root to be $\\geq 0$.`, answer: `${inside} >= 0`, accept: [`${squash(inside)}>=0`, `0<=${squash(inside)}`], hint: `The expression under the square root cannot be negative.` },
        { instruction: `Solve the inequality for $x$.`, answer: `x >= ${bound}`, accept: [`x>=${bound}`, `${bound}<=x`], hint: plus ? `Subtract ${c} from both sides.` : `Add ${c} to both sides.` },
      ],
      finalAnswer: { value: `x >= ${bound}`, unit: "" },
      solutionNarrative: `We need $${inside} \\geq 0$, i.e. $x \\geq ${bound}$, so the domain is $x \\geq ${bound}$.`,
    };
  }
  if (kind === "range") {
    const k = nz(rng, -9, 9);
    const fStr = k < 0 ? `x^2 - ${-k}` : `x^2 + ${k}`;
    return {
      id: `gen.a2l-domain-range-d2.${idx}`, generated: true, concepts: ["domain-and-range"], difficulty: 2, context: "abstract",
      prompt: `What is the range of $f(x) = ${fStr}$? Give your answer as an inequality in $y$.`,
      steps: [
        { instruction: `What is the smallest possible value of $x^2$?`, answer: `0`, accept: [], hint: `A square is never negative, and $0^2 = 0$.` },
        { instruction: `So the smallest output is $0 ${k < 0 ? "-" : "+"} ${Math.abs(k)}$. State the range as an inequality in $y$.`, answer: `y >= ${k}`, accept: [`y>=${k}`, `${k}<=y`], hint: `Every output is at least ${k}.` },
      ],
      finalAnswer: { value: `y >= ${k}`, unit: "" },
      solutionNarrative: `$x^2 \\geq 0$ always, with equality at $x = 0$, so the outputs of $${fStr}$ are exactly $y \\geq ${k}$.`,
    };
  }
  const c = nz(rng, -9, 9);
  const denom = fmtShift(c);
  return {
    id: `gen.a2l-domain-range-d2.${idx}`, generated: true, concepts: ["domain-and-range"], difficulty: 2, context: "abstract",
    prompt: `The function $f(x) = \\dfrac{1}{${denom}}$ is defined for every $x$ except where the denominator is zero. Which value of $x$ is excluded from the domain?`,
    steps: [
      { instruction: `Set the denominator equal to zero and solve.`, answer: `x = ${c}`, accept: [`x=${c}`, `${c}`], hint: `$${denom} = 0$ where?` },
      { instruction: `Check a nearby ALLOWED input: what is the denominator $${denom}$ at $x = ${c + 1}$?`, answer: `1`, accept: [], hint: `$${c + 1} ${c < 0 ? "+" : "-"} ${Math.abs(c)}$.` },
    ],
    finalAnswer: { value: `x != ${c}`, unit: "" },
    solutionNarrative: `$${denom} = 0$ exactly at $x = ${c}$, so the domain is all real numbers except $x = ${c}$. Everywhere else — like $x = ${c + 1}$, where the denominator is 1 — the function is fine.`,
  };
};

// --- solve-rational-equations d1: one-fraction-each-side, cross-multiply ---
const SRE1_PAIRS = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6]];
fill["a2l-solve-rational-d1"] = (rng, idx) => {
  const varOnTop = rng.int(0, 1) === 1;
  const s = rng.int(2, 5);
  if (varOnTop) {
    const [p, q] = rng.pick([[1, 2], [1, 3], [1, 4], ...SRE1_PAIRS]);
    const den = q * s;                             // x/den = p/q, so x = p*s
    const x = p * s;
    return {
      id: `gen.a2l-solve-rational-d1.${idx}`, generated: true, concepts: ["solve-rational-equations"], difficulty: 1, context: "abstract",
      prompt: `Solve for $x$:  $\\dfrac{x}{${den}} = \\dfrac{${p}}{${q}}$.`,
      steps: [
        { instruction: `Cross-multiply to clear the fractions.`, answer: `${q}x = ${p * den}`, accept: [`${q}x=${p * den}`, `${p * den} = ${q}x`, `${p * den}=${q}x`], hint: `$x \\cdot ${q} = ${p} \\cdot ${den}$.` },
        { instruction: `Solve for $x$.`, answer: `x = ${x}`, accept: [`x=${x}`, `${x}`], hint: `Divide both sides by ${q}.` },
      ],
      finalAnswer: { value: `${x}`, unit: "" },
      solutionNarrative: `Cross-multiplying gives $${q}x = ${p * den}$, so $x = ${x}$. No denominator here contains $x$, so nothing can be extraneous.`,
    };
  }
  const [p, q] = rng.pick(SRE1_PAIRS);             // p >= 2 keeps step 1 meaningful
  const k = p * s, x = q * s;                      // k/x = p/q
  return {
    id: `gen.a2l-solve-rational-d1.${idx}`, generated: true, concepts: ["solve-rational-equations"], difficulty: 1, context: "abstract",
    prompt: `Solve for $x$:  $\\dfrac{${k}}{x} = \\dfrac{${p}}{${q}}$.`,
    steps: [
      { instruction: `Cross-multiply (or multiply both sides by $${q}x$) to clear the fractions.`, answer: `${p}x = ${k * q}`, accept: [`${p}x=${k * q}`, `${k * q} = ${p}x`, `${k * q}=${p}x`], hint: `$${k} \\cdot ${q} = ${p} \\cdot x$.` },
      { instruction: `Solve for $x$.`, answer: `x = ${x}`, accept: [`x=${x}`, `${x}`], hint: `Divide both sides by ${p}.` },
      { instruction: `Is $x = ${x}$ allowed (it must not make a denominator zero)? Type 'yes' or 'no'.`, answer: `yes`, accept: [`y`], hint: `Does $x = ${x}$ make the original denominator $x$ zero?` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Cross-multiplying gives $${p}x = ${k * q}$, so $x = ${x}$. Since $${x} \\neq 0$, no denominator vanishes and the solution is valid.`,
  };
};
