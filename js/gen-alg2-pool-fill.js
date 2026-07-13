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
