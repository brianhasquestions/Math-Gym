// gen-alg-pool-fill.js
// Parametric generators eliminating the 38 thin concept×difficulty pools in
// the algebra subject (pools that had exactly ONE seed problem and no template
// at that tier, so repeat practice re-served the identical problem). One
// template per pool, named apl-<concept>-d<difficulty>. Self-contained pack:
// exports a `fill` map of template-name -> (rng, idx) => problem, matching the
// shape used by js/generator.js (same pattern as gen-alg-graph-fill.js).

// --- shared helpers ---------------------------------------------------------

const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const squash = (s) => s.replace(/ /g, "");
const WORDNUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight"];
// Signed constant term for display inside an expression: "+ 5" / "- 5".
const sgnC = (n) => (n < 0 ? `- ${-n}` : `+ ${n}`);
// Leading coefficient term: 1 -> "x", -1 -> "-x", else "3x".
const coefTerm = (c, v) => (c === 1 ? v : c === -1 ? `-${v}` : `${c}${v}`);
// Signed middle term for display: "+ x", "- 3x", etc. (c must be nonzero).
const midTerm = (c, v) => (c < 0 ? `- ${c === -1 ? "" : -c}${v}` : `+ ${c === 1 ? "" : c}${v}`);
// Monic trinomial v^2 + Bv + C as display/answer text (B, C nonzero).
const triStr = (B, C, v = "x") => `${v}^2 ${midTerm(B, v)} ${sgnC(C)}`;
// Binomial factor for root r: (x - 3) / (x + 3). r must be nonzero.
const fac = (r, v = "x") => (r < 0 ? `(${v} + ${-r})` : `(${v} - ${r})`);
// Proper divisors of n strictly between 1 and n.
const properDivs = (n) => { const out = []; for (let i = 2; i < n; i++) if (n % i === 0) out.push(i); return out; };
const OP_LATEX = { "<=": "\\leq", ">=": "\\geq", "<": "<", ">": ">" };
const OP_FLIP = { "<=": ">=", ">=": "<=", "<": ">", ">": "<" };

export const fill = {};

// ============================================================================
// exponents  (power-rules d1, scientific-notation d1 & d3)
// ============================================================================

// d1: power of a power — one rule, one step.
fill["apl-power-rules-d1"] = (rng, idx) => {
  const v = rng.pick(["x", "y", "m"]);
  const [a, b] = rng.pick([[2, 2], [2, 3], [3, 2], [2, 4], [4, 2]]);
  return {
    id: `gen.apl-power-rules-d1.${idx}`, generated: true, concepts: ["power-rules"], difficulty: 1, context: "abstract",
    prompt: `Simplify: $(${v}^${a})^${b}$.`,
    steps: [
      { instruction: "Multiply the exponents and write a single power.", answer: `${v}^${a * b}`, accept: [`${v}^{${a * b}}`], hint: `$(${v}^a)^b = ${v}^{ab}$: multiply ${a} and ${b}.` },
    ],
    finalAnswer: { value: `${v}^${a * b}`, unit: "" },
    solutionNarrative: `Power of a power multiplies exponents: $${v}^{${a} \\cdot ${b}} = ${v}^${a * b}$.`,
  };
};

// d1: expand scientific notation into an ordinary number.
fill["apl-sci-notation-d1"] = (rng, idx) => {
  const a = rng.int(1, 9);
  const b = rng.int(1, 9);
  const n = rng.int(3, 6);
  const val = `${a}${b}${"0".repeat(n - 1)}`;
  return {
    id: `gen.apl-sci-notation-d1.${idx}`, generated: true, concepts: ["scientific-notation"], difficulty: 1, context: "abstract",
    prompt: `Write $${a}.${b} \\times 10^{${n}}$ as an ordinary number.`,
    steps: [
      { instruction: `Move the decimal point ${n} places to the right.`, answer: val, accept: [`${a}.${b} \\times 10^${n}`], hint: "Each power of 10 shifts the decimal one place right; pad with zeros as needed." },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$${a}.${b} \\times 10^{${n}} = ${val}$.`,
  };
};

// d3: applied product of two scientific-notation quantities.
const SCI_CTX = [
  { who: "A satellite downlink transfers", unit: "kilobytes", per: "second", span: "A full image dump takes" },
  { who: "A bottling plant fills", unit: "bottles", per: "hour", span: "A production season lasts" },
  { who: "A power station delivers", unit: "joules", per: "second", span: "A stress test runs for" },
];
fill["apl-sci-notation-d3"] = (rng, idx) => {
  const ctx = rng.pick(SCI_CTX);
  const f1 = rng.int(2, 9);
  let k = rng.int(12, 48);            // second front = k/10, one decimal place
  if (k % 10 === 0) k += 3;
  const f2s = (k / 10).toFixed(1);
  const e1 = rng.int(3, 4);
  const e2 = rng.int(2, 4);
  const esum = e1 + e2;               // 5..8, safe for the ^ parser
  const p = f1 * k;                   // 10 × (front product), an exact integer
  const front = p % 10 === 0 ? `${p / 10}` : (p / 10).toFixed(1);
  const total = String(p * Math.pow(10, esum - 1));
  return {
    id: `gen.apl-sci-notation-d3.${idx}`, generated: true, concepts: ["scientific-notation"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} $${f1} \\times 10^{${e1}}$ ${ctx.unit} per ${ctx.per}. ${ctx.span} $${f2s} \\times 10^{${e2}}$ ${ctx.per}s. How many ${ctx.unit} is that in total? (Multiply the fronts and add the exponents.)`,
    steps: [
      { instruction: `Multiply the front numbers: $${f1} \\times ${f2s}$.`, answer: front, accept: [], hint: `$${f1} \\times ${f2s} = ${front}$.` },
      { instruction: `Add the exponents on the 10s: $10^{${e1}} \\times 10^{${e2}}$.`, answer: `10^${esum}`, accept: [`10^{${esum}}`], hint: `$${e1} + ${e2} = ${esum}$.` },
      { instruction: `Combine into one ordinary number ($${front} \\times 10^{${esum}}$).`, answer: total, accept: [`${front}*10^${esum}`], hint: `Shift the decimal in ${front} to the right ${esum} places.` },
    ],
    finalAnswer: { value: total, unit: ctx.unit },
    solutionNarrative: `$(${f1} \\times 10^{${e1}})(${f2s} \\times 10^{${e2}}) = (${f1} \\cdot ${f2s}) \\times 10^{${e1}+${e2}} = ${front} \\times 10^{${esum}} = ${total}$ ${ctx.unit}.`,
  };
};

// ============================================================================
// factoring  (gcf d3, difference-of-squares d3, trinomial-simple d3, trinomial-leading d1)
// ============================================================================

// d3: GCF with a variable factor across three terms.
// Triples all have gcd 1 and an irreducible inner trinomial (negative discriminant).
const GCF_TRIPLES = [[2, 3, 4], [3, 2, 5], [4, 3, 2], [2, 5, 7], [5, 2, 3], [4, 5, 3], [3, 4, 6]];
fill["apl-gcf-d3"] = (rng, idx) => {
  const g = rng.pick([2, 3, 4, 6]);
  const [m1, m2, m3] = rng.pick(GCF_TRIPLES);
  const factored = `${g}x(${m1}x^2 + ${m2}x + ${m3})`;
  return {
    id: `gen.apl-gcf-d3.${idx}`, generated: true, concepts: ["gcf"], difficulty: 3, context: "abstract",
    prompt: `Factor completely: $${g * m1}x^3 + ${g * m2}x^2 + ${g * m3}x$`,
    steps: [
      { instruction: `What is the GCF of $${g * m1}x^3$, $${g * m2}x^2$, and $${g * m3}x$?`, answer: `${g}x`, accept: [], hint: `The GCF of ${g * m1}, ${g * m2}, and ${g * m3} is ${g}; the smallest power of $x$ present is $x$ itself.` },
      { instruction: "Write the factored form.", form: "factored", answer: factored, accept: [], hint: `Divide each term by $${g}x$.` },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `The GCF is $${g}x$: $${g * m1}x^3 + ${g * m2}x^2 + ${g * m3}x = ${factored}$. The inner trinomial does not factor further.`,
  };
};

// d3: difference of squares hiding behind a GCF — factor completely in stages.
const DSQ_PAIRS = [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [2, 7], [5, 6], [3, 7]];
fill["apl-diff-squares-d3"] = (rng, idx) => {
  const g = rng.pick([2, 3, 5]);
  const [a, b] = rng.pick(DSQ_PAIRS);
  const A = g * a * a, B = g * b * b;
  const full = `${g}(${a}x - ${b})(${a}x + ${b})`;
  return {
    id: `gen.apl-diff-squares-d3.${idx}`, generated: true, concepts: ["difference-of-squares"], difficulty: 3, context: "abstract",
    prompt: `Factor completely: $${A}x^2 - ${B}$`,
    steps: [
      { instruction: `What is the GCF of $${A}x^2$ and $${B}$?`, answer: `${g}`, accept: [], hint: `Both coefficients are divisible by ${g} (and by nothing larger).` },
      { instruction: "Factor out the GCF.", form: "factored", answer: `${g}(${a * a}x^2 - ${b * b})`, accept: [], hint: `Divide each term by ${g}.` },
      { instruction: "The parentheses hold a difference of squares. Write the complete factorization.", form: "factored", answer: full, accept: [`${g}(${a}x + ${b})(${a}x - ${b})`], hint: `$${a * a}x^2 - ${b * b} = (${a}x)^2 - ${b}^2 = (a - b)(a + b)$ form.` },
    ],
    finalAnswer: { value: full, unit: "" },
    solutionNarrative: `Pull out the GCF first: $${A}x^2 - ${B} = ${g}(${a * a}x^2 - ${b * b})$. Inside is $(${a}x)^2 - ${b}^2$, so the complete factorization is $${full}$.`,
  };
};

// d3: monic trinomial with trickier sign patterns.
fill["apl-trinomial-simple-d3"] = (rng, idx) => {
  const kind = rng.pick(["mixed", "negneg"]);
  let p, q, B, C, n1, n2, factored, hint1;
  if (kind === "mixed") {
    p = rng.int(2, 9);
    q = rng.int(2, 9);
    if (q === p) q = q === 9 ? 8 : q + 1;
    B = q - p; C = -p * q;            // (x - p)(x + q), B nonzero since p != q
    n1 = -p; n2 = q;
    factored = `(x - ${p})(x + ${q})`;
    hint1 = "A negative product means opposite signs; the sum tells you which one has the larger magnitude.";
  } else {
    p = rng.int(2, 7);
    q = rng.int(2, 7);
    if (q === p) q = q + 1;
    B = -(p + q); C = p * q;          // (x - p)(x - q)
    n1 = -p; n2 = -q;
    factored = `(x - ${p})(x - ${q})`;
    hint1 = "A positive product with a negative sum means BOTH numbers are negative.";
  }
  return {
    id: `gen.apl-trinomial-simple-d3.${idx}`, generated: true, concepts: ["trinomial-simple"], difficulty: 3, context: "abstract",
    prompt: `Factor completely: $${triStr(B, C)}$`,
    steps: [
      { instruction: `Find two integers that multiply to ${C} and add to ${B}. Enter them comma-separated.`, answer: `${n1}, ${n2}`, accept: [`${n2}, ${n1}`], hint: hint1 },
      { instruction: "Write the factorization.", form: "factored", answer: factored, accept: [], hint: `The numbers ${n1} and ${n2} become the constants in the two binomials.` },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `$${n1}$ and $${n2}$ multiply to $${C}$ and add to $${B}$, so $${triStr(B, C)} = ${factored}$.`,
  };
};

// d1: leading-coefficient trinomial with small, friendly numbers.
fill["apl-trinomial-leading-d1"] = (rng, idx) => {
  const [a, b] = rng.pick([[2, 1], [3, 1], [2, 3], [3, 2]]); // gcd(a, b) = 1
  const c = rng.int(2, 5);
  const factored = `(${a}x + ${b})(x + ${c})`;
  const mid = a * c + b, last = b * c;
  return {
    id: `gen.apl-trinomial-leading-d1.${idx}`, generated: true, concepts: ["trinomial-leading"], difficulty: 1, context: "abstract",
    prompt: `Factor completely: $${a}x^2 + ${mid}x + ${last}$`,
    steps: [
      { instruction: "Factor this trinomial into two binomials.", form: "factored", answer: factored, accept: [`(x + ${c})(${a}x + ${b})`], hint: `AC method: $a \\cdot c = ${a * last}$; two numbers multiplying to ${a * last} and adding to ${mid} are ${a * c} and ${b}.` },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `$${a}x^2 + ${mid}x + ${last} = ${factored}$. Check with FOIL: the middle term is $${a * c}x + ${b}x = ${mid}x$. ✓`,
  };
};

// ============================================================================
// linear-inequalities  (interval-notation d1 & d3, compound-inequality d3)
// ============================================================================

const INTERVAL_STR = (op, E) => (op === "<=" ? `(-\\infty, ${E}]` : op === "<" ? `(-\\infty, ${E})` : op === ">=" ? `[${E}, \\infty)` : `(${E}, \\infty)`);

// d1: one-step solve, connect to interval notation.
fill["apl-interval-d1"] = (rng, idx) => {
  const op = rng.pick([">=", "<="]);
  const E = rng.int(-5, 9);
  const a = rng.int(2, 9);
  const bb = E + a;
  return {
    id: `gen.apl-interval-d1.${idx}`, generated: true, concepts: ["interval-notation"], difficulty: 1, context: "abstract",
    prompt: `Solve $x + ${a} ${OP_LATEX[op]} ${bb}$ and write the solution as an inequality. (In interval notation this is $${INTERVAL_STR(op, E)}$.)`,
    steps: [
      { instruction: `Subtract ${a} from both sides to solve for $x$.`, answer: `x ${op} ${E}`, accept: [`${E} ${OP_FLIP[op]} x`], hint: `The endpoint ${E} is included because of the ${op === ">=" ? "$\\geq$" : "$\\leq$"}, giving a square bracket in $${INTERVAL_STR(op, E)}$.` },
    ],
    finalAnswer: { value: `x ${op} ${E}`, unit: "" },
    solutionNarrative: `$x + ${a} ${OP_LATEX[op]} ${bb}$ gives $x ${OP_LATEX[op]} ${E}$, which in interval notation is $${INTERVAL_STR(op, E)}$.`,
  };
};

// d3: two-step solve with a fraction, all four inequality directions.
fill["apl-interval-d3"] = (rng, idx) => {
  const op = rng.pick(["<=", ">=", "<", ">"]);
  const k = rng.pick([2, 3, 4]);
  const e = rng.int(2, 6);
  const E = k * e;
  const m = rng.int(2, 9);
  const c = e - m;
  const iv = INTERVAL_STR(op, E);
  return {
    id: `gen.apl-interval-d3.${idx}`, generated: true, concepts: ["interval-notation"], difficulty: 3, context: "abstract",
    prompt: `Solve $\\frac{x}{${k}} - ${m} ${OP_LATEX[op]} ${c}$ and write the solution as an inequality. (In interval notation this is $${iv}$.)`,
    steps: [
      { instruction: `Add ${m} to both sides.`, answer: `x/${k} ${op} ${e}`, accept: [], hint: `Undo the $-${m}$ first: $${c} + ${m} = ${e}$.` },
      { instruction: `Multiply both sides by ${k}. (Multiplying by a positive number does NOT flip the sign.)`, answer: `x ${op} ${E}`, accept: [`${E} ${OP_FLIP[op]} x`], hint: `${op === "<=" || op === ">=" ? `The endpoint ${E} is included — square bracket` : `The endpoint ${E} is NOT included — round parenthesis`} in $${iv}$.` },
    ],
    finalAnswer: { value: `x ${op} ${E}`, unit: "" },
    solutionNarrative: `Adding ${m} gives $\\frac{x}{${k}} ${OP_LATEX[op]} ${e}$; multiplying by ${k} (positive, no flip) gives $x ${OP_LATEX[op]} ${E}$, or $${iv}$.`,
  };
};

// d3: compound inequality requiring a divide-by-negative with a double flip.
fill["apl-compound-ineq-d3"] = (rng, idx) => {
  const k = rng.pick([2, 3]);
  const lo = rng.int(-5, 1);
  const hi = lo + rng.int(2, 6);
  const A = -k * hi, B = -k * lo;      // A <= -kx < B  with A < B
  const ans = `${lo} < x <= ${hi}`;
  return {
    id: `gen.apl-compound-ineq-d3.${idx}`, generated: true, concepts: ["compound-inequality"], difficulty: 3, context: "abstract",
    prompt: `Solve the compound inequality $${A} \\leq -${k}x < ${B}$ for $x$. Watch the signs when you divide.`,
    steps: [
      { instruction: `To isolate $x$ you will divide all three parts by $-${k}$. Do the inequality signs flip? (yes/no)`, answer: "yes", accept: ["y", "they flip"], hint: "Dividing (or multiplying) an inequality by a negative number reverses every inequality sign." },
      { instruction: `Divide all three parts by $-${k}$, flipping BOTH signs, and write the result as a compound inequality.`, answer: ans, accept: [`${hi} >= x > ${lo}`, `${lo} < x \\leq ${hi}`, `${hi} \\geq x > ${lo}`], hint: `$${A} \\div (-${k}) = ${hi}$ and $${B} \\div (-${k}) = ${lo}$; the order of the values reverses too.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Dividing $${A} \\leq -${k}x < ${B}$ by $-${k}$ flips both signs: $${hi} \\geq x > ${lo}$, the same as $${lo} < x \\leq ${hi}$.`,
  };
};

// ============================================================================
// polynomials-operations  (add-subtract d3, degree d2 & d3, multiply-binomials d1)
// ============================================================================

// d3: applied polynomial subtraction (profit = revenue - cost), then evaluate.
const PROFIT_CTX = [
  { who: "A phone-case shop's", items: "cases" },
  { who: "A candle studio's", items: "candles" },
  { who: "A poster printer's", items: "posters" },
];
fill["apl-poly-addsub-d3"] = (rng, idx) => {
  const ctx = rng.pick(PROFIT_CTX);
  const r2 = rng.int(3, 6), c2 = rng.int(1, r2 - 1);
  const r1 = rng.int(4, 9), c1 = rng.int(1, r1 - 1);
  const r0 = rng.int(30, 60), c0 = rng.int(10, r0 - 10);
  const d2 = r2 - c2, d1 = r1 - c1, d0 = r0 - c0;
  const n = rng.int(2, 5);
  const val = d2 * n * n + d1 * n + d0;
  const R = `${r2}x^2 + ${r1}x + ${r0}`;
  const C = `${c2}x^2 + ${c1}x + ${c0}`;
  const P = `${d2}x^2 + ${d1}x + ${d0}`;
  return {
    id: `gen.apl-poly-addsub-d3.${idx}`, generated: true, concepts: ["add-subtract-polynomials"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} weekly revenue from selling $x$ ${ctx.items} is $${R}$ dollars and the production cost is $${C}$ dollars. Find the profit polynomial, then evaluate it.`,
    steps: [
      { instruction: "Write the profit as revenue minus cost (keep the parentheses).", answer: `(${R}) - (${C})`, accept: [`${R} - (${C})`], hint: "Profit is what's left of revenue after cost." },
      { instruction: "Distribute the minus sign and combine like terms.", answer: P, accept: [], hint: `$${r2}x^2 - ${c2}x^2$, $${r1}x - ${c1}x$, $${r0} - ${c0}$.` },
      { instruction: `Evaluate the profit at $x = ${n}$ ${ctx.items}.`, answer: `${val}`, accept: [], hint: `$${d2}(${n})^2 + ${d1}(${n}) + ${d0}$.` },
    ],
    finalAnswer: { value: P, unit: "dollars" },
    solutionNarrative: `Subtracting like terms: $(${R}) - (${C}) = ${P}$. At $x = ${n}$: $${d2}(${n * n}) + ${d1 * n} + ${d0} = ${val}$ dollars.`,
  };
};

// d3: applied — expand an area, then state degree and classification.
const AREA_CTX = [
  { thing: "banner", unit: "feet" },
  { thing: "patio slab", unit: "feet" },
  { thing: "garden bed", unit: "meters" },
];
fill["apl-poly-degree-d3"] = (rng, idx) => {
  const ctx = rng.pick(AREA_CTX);
  const k = rng.int(2, 5);
  const a = rng.int(2, 4);
  const b = rng.int(2, 9);
  const q = rng.pick([2, 3]);
  const deg = q + 1;
  const expanded = `${k * a}x^${deg} + ${k * b}x`;
  return {
    id: `gen.apl-poly-degree-d3.${idx}`, generated: true, concepts: ["degree-and-classification"], difficulty: 3, context: "applied",
    prompt: `A rectangular ${ctx.thing} has width $${k}x$ ${ctx.unit} and length $(${a}x^${q} + ${b})$ ${ctx.unit}, so its area is $${k}x(${a}x^${q} + ${b})$. Expand the area, then state its degree and classify it by number of terms.`,
    steps: [
      { instruction: `Expand the area $${k}x(${a}x^${q} + ${b})$.`, answer: expanded, accept: [], hint: `$${k}x \\cdot ${a}x^${q} = ${k * a}x^${deg}$ and $${k}x \\cdot ${b} = ${k * b}x$.` },
      { instruction: "What is the degree of the expanded area?", answer: `${deg}`, accept: [WORDNUM[deg]], hint: `The highest exponent in $${expanded}$.` },
      { instruction: "Classify the expanded area by number of terms.", answer: "binomial", accept: ["two-term", "two terms"], hint: "Count the terms after expanding." },
    ],
    finalAnswer: { value: `${expanded}; degree ${deg}, binomial`, unit: "" },
    solutionNarrative: `$${k}x(${a}x^${q} + ${b}) = ${expanded}$. The highest exponent is ${deg} (degree ${deg}) and there are two terms, so it is a binomial.`,
  };
};

// d2: degree and classification of a randomly shaped polynomial.
fill["apl-poly-degree-d2"] = (rng, idx) => {
  const kind = rng.pick(["monomial", "binomial", "trinomial"]);
  const n = rng.int(3, 6);
  const a = rng.int(2, 7);
  let str;
  if (kind === "monomial") {
    str = `${a}x^${n}`;
  } else if (kind === "binomial") {
    const b = rng.int(2, 9);
    const m = rng.int(1, n - 1);
    str = `${a}x^${n} - ${b}${m === 1 ? "x" : `x^${m}`}`;
  } else {
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    const m = rng.int(1, n - 1);
    str = `${a}x^${n} + ${b}${m === 1 ? "x" : `x^${m}`} + ${c}`;
  }
  const ACCEPTS = { monomial: ["one-term", "one term"], binomial: ["two-term", "two terms"], trinomial: ["three-term", "three terms"] };
  return {
    id: `gen.apl-poly-degree-d2.${idx}`, generated: true, concepts: ["degree-and-classification"], difficulty: 2, context: "abstract",
    prompt: `Consider the polynomial $${str}$. State its degree, then classify it by number of terms.`,
    steps: [
      { instruction: `What is the degree of $${str}$?`, answer: `${n}`, accept: [WORDNUM[n]], hint: "The highest exponent present." },
      { instruction: "Classify it by number of terms (monomial, binomial, or trinomial).", answer: kind, accept: ACCEPTS[kind], hint: "Count the terms separated by + or −." },
    ],
    finalAnswer: { value: `degree ${n}, ${kind}`, unit: "" },
    solutionNarrative: `The highest exponent is ${n} (degree ${n}), and it has ${kind === "monomial" ? "one term" : kind === "binomial" ? "two terms" : "three terms"}, so it is a ${kind}.`,
  };
};

// d1: FOIL two friendly binomials.
fill["apl-multiply-binomials-d1"] = (rng, idx) => {
  const a = rng.int(1, 6);
  let b = rng.int(1, 6);
  if (b === a) b = a === 6 ? 5 : a + 1;
  const ans = `x^2 + ${a + b}x + ${a * b}`;
  return {
    id: `gen.apl-multiply-binomials-d1.${idx}`, generated: true, concepts: ["multiply-binomials"], difficulty: 1, context: "abstract",
    prompt: `Multiply: $(x + ${a})(x + ${b})$.`,
    steps: [
      { instruction: "Use FOIL and combine like terms.", answer: ans, accept: [], hint: `$x \\cdot x$, then the outer + inner middle terms $${b}x + ${a}x$, then $${a} \\cdot ${b}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$(x + ${a})(x + ${b}) = x^2 + ${b}x + ${a}x + ${a * b} = ${ans}$.`,
  };
};

// ============================================================================
// quadratic-equations  (solve-by-factoring d1 & d3, square-root d3,
//                       quadratic-formula d1, discriminant d2 & d3)
// ============================================================================

// d1: monic factorable quadratic, roots of any sign.
const pickRoots = (rng) => {
  const p = nz(rng, -6, 6);
  const cands = [];
  for (let n = -6; n <= 6; n++) if (n !== 0 && n !== p && n !== -p) cands.push(n);
  return [p, rng.pick(cands)];       // distinct, nonzero, p + q != 0
};
fill["apl-quad-factor-d1"] = (rng, idx) => {
  const [p, q] = pickRoots(rng);
  const B = -(p + q), C = p * q;
  const factored = `${fac(p)}${fac(q)}`;
  return {
    id: `gen.apl-quad-factor-d1.${idx}`, generated: true, concepts: ["solve-by-factoring"], difficulty: 1, context: "abstract",
    prompt: `Solve by factoring: $${triStr(B, C)} = 0$`,
    steps: [
      { instruction: "Factor the left side.", form: "factored", answer: factored, accept: [`${fac(q)}${fac(p)}`], hint: `Find two numbers that multiply to ${C} and add to ${B}.` },
      { instruction: "Find both solutions. Separate them with 'or' or a comma.", form: "solutions", answer: `x = ${p} or x = ${q}`, accept: [`${p}, ${q}`, `${q}, ${p}`], hint: "Set each factor to zero." },
    ],
    finalAnswer: { value: `x = ${p}, x = ${q}`, unit: "" },
    solutionNarrative: `$${factored} = 0$ gives $x = ${p}$ or $x = ${q}$.`,
  };
};

// d3: applied projectile — divide out -16, factor, keep the physical root.
const LAUNCH_CTX = [
  { obj: "ball", place: "ledge" },
  { obj: "rock", place: "cliff" },
  { obj: "beanbag", place: "platform" },
];
fill["apl-quad-factor-d3"] = (rng, idx) => {
  const ctx = rng.pick(LAUNCH_CTX);
  const T = rng.int(2, 4);
  const u = rng.int(1, T - 1);         // landing at t = T, extraneous root t = -u
  const M = T - u;                     // middle coefficient after dividing by -16
  const H = 16 * T * u, V = 16 * M;
  const eq = `${triStr(-M, -T * u, "t")} = 0`;
  return {
    id: `gen.apl-quad-factor-d3.${idx}`, generated: true, concepts: ["solve-by-factoring"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.obj} is launched upward from a ${H} ft ${ctx.place} at ${V} ft/s, so its height after $t$ seconds is $-16t^2 + ${V}t + ${H}$ feet. When does it hit the ground?`,
    steps: [
      { instruction: "Set the height to 0 and divide every term by $-16$ to simplify. Write the resulting equation.", answer: eq, accept: [squash(eq)], hint: `Dividing $-16t^2 + ${V}t + ${H} = 0$ by $-16$ flips every sign.` },
      { instruction: "Factor the left side.", form: "factored", answer: `(t - ${T})(t + ${u})`, accept: [`(t + ${u})(t - ${T})`], hint: `Two numbers multiplying to ${-T * u} and adding to ${-M}.` },
      { instruction: "Both factors give a root, but time can't be negative. At what time $t$ does it land? (seconds)", answer: `t = ${T}`, accept: [`${T}`], hint: "Discard the negative root." },
    ],
    finalAnswer: { value: `${T}`, unit: "seconds" },
    solutionNarrative: `Dividing by $-16$: $${eq}$, which factors as $(t - ${T})(t + ${u}) = 0$, so $t = ${T}$ or $t = -${u}$. Discarding the negative root, the ${ctx.obj} lands at $t = ${T}$ s.`,
  };
};

// d3: square-root method with a leading coefficient to strip first.
fill["apl-sqrt-method-d3"] = (rng, idx) => {
  const a = rng.pick([2, 3, 5]);
  const h = rng.int(1, 7);
  const k = rng.int(2, 5);
  const C = a * k * k;
  const s1 = h + k, s2 = h - k;
  return {
    id: `gen.apl-sqrt-method-d3.${idx}`, generated: true, concepts: ["square-root-method"], difficulty: 3, context: "abstract",
    prompt: `Solve by isolating the square first, then square-rooting:  $${a}(x - ${h})^2 - ${C} = 0$.`,
    steps: [
      { instruction: `Add ${C} to both sides, then divide by ${a} to isolate the square. Write the equation $(x - ${h})^2 = (\\text{number})$.`, answer: `(x - ${h})^2 = ${k * k}`, accept: [], hint: `$${a}(x - ${h})^2 = ${C}$, so $(x - ${h})^2 = ${k * k}$.` },
      { instruction: "Square-root both sides (remember $\\pm$) and solve. Enter both solutions.", form: "solutions", answer: `x = ${s1} or x = ${s2}`, accept: [`${s1}, ${s2}`, `${s2}, ${s1}`], hint: `$x - ${h} = \\pm ${k}$, so $x = ${h} \\pm ${k}$.` },
    ],
    finalAnswer: { value: `x = ${s1}, x = ${s2}`, unit: "" },
    solutionNarrative: `Isolate: $(x - ${h})^2 = ${k * k}$. Then $x - ${h} = \\pm ${k}$, so $x = ${s1}$ or $x = ${s2}$.`,
  };
};

// Shared count-words for discriminant answers.
const COUNT_ACCEPT = { none: ["0", "zero"], one: ["1"], two: ["2"] };

// d2: how many real solutions — all three discriminant signs.
fill["apl-discriminant-d2"] = (rng, idx) => {
  const kind = rng.pick(["two", "one", "none"]);
  const sign = rng.pick([1, -1]);
  let B, C;
  if (kind === "one") {
    const m = rng.int(1, 5);
    B = 2 * m * sign; C = m * m;
  } else if (kind === "none") {
    B = rng.int(2, 6) * sign;
    C = Math.ceil((B * B) / 4) + rng.int(1, 5);
  } else {
    B = rng.int(1, 6) * sign;
    C = -rng.int(1, 8);
  }
  const D = B * B - 4 * C;
  return {
    id: `gen.apl-discriminant-d2.${idx}`, generated: true, concepts: ["discriminant"], difficulty: 2, context: "abstract",
    prompt: `How many real solutions does $${triStr(B, C)} = 0$ have?`,
    steps: [
      { instruction: "Compute the discriminant $b^2 - 4ac$.", answer: `${D}`, accept: [], hint: `$(${B})^2 - 4(1)(${C})$.` },
      { instruction: "How many real solutions? Type 'two', 'one', or 'none'.", answer: kind, accept: COUNT_ACCEPT[kind], hint: kind === "two" ? "A positive discriminant means two distinct real solutions." : kind === "one" ? "A zero discriminant means exactly one (repeated) solution." : "A negative discriminant means no real solutions." },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `Discriminant $= (${B})^2 - 4(1)(${C}) = ${D}$, which is ${D > 0 ? "positive: two real solutions" : D === 0 ? "zero: one repeated real solution" : "negative: no real solutions"}.`,
  };
};

// d3: applied break-even count via the discriminant.
const PROFIT_WHO = ["A gadget maker's", "A coffee cart's", "A candle shop's", "A bike courier service's"];
fill["apl-discriminant-d3"] = (rng, idx) => {
  const who = rng.pick(PROFIT_WHO);
  const kind = rng.pick(["none", "two", "one"]);
  let a, Bp, Cp;
  if (kind === "two") {
    a = rng.int(2, 3);
    const r = rng.int(1, 5);
    let s = rng.int(1, 5);
    if (s === r) s = r === 5 ? 4 : r + 1;
    Bp = a * (r + s); Cp = a * r * s;
  } else if (kind === "one") {
    a = rng.int(2, 3);
    const r = rng.int(1, 4);
    Bp = 2 * a * r; Cp = a * r * r;
  } else {
    a = rng.int(2, 4);
    Bp = rng.int(3, 7);
    Cp = Math.ceil((Bp * Bp + 1) / (4 * a)) + rng.int(1, 4);
  }
  const D = Bp * Bp - 4 * a * Cp;
  const phrase = { none: "no price breaks even", one: "exactly one price breaks even", two: "two prices break even" }[kind];
  return {
    id: `gen.apl-discriminant-d3.${idx}`, generated: true, concepts: ["discriminant"], difficulty: 3, context: "applied",
    prompt: `${who} profit (in thousands of dollars) at price $x$ is modeled by $-${a}x^2 + ${Bp}x - ${Cp}$. Break-even is where profit $= 0$: $${a}x^2 - ${Bp}x + ${Cp} = 0$. Use the discriminant to decide how many break-even prices exist.`,
    steps: [
      { instruction: `Compute the discriminant $b^2 - 4ac$ for $${a}x^2 - ${Bp}x + ${Cp} = 0$ (here $a=${a}$, $b=-${Bp}$, $c=${Cp}$).`, answer: `${D}`, accept: [], hint: `$(-${Bp})^2 - 4(${a})(${Cp}) = ${Bp * Bp} - ${4 * a * Cp}$.` },
      { instruction: "How many real break-even prices are there? Type 'two', 'one', or 'none'.", answer: kind, accept: COUNT_ACCEPT[kind], hint: kind === "none" ? "A negative discriminant means no real solutions — the business never breaks even." : kind === "one" ? "A zero discriminant means the profit curve just touches zero once." : "A positive discriminant means the profit curve crosses zero twice." },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `Discriminant $= ${Bp * Bp} - ${4 * a * Cp} = ${D}$, which is ${D > 0 ? "positive" : D === 0 ? "zero" : "negative"} — ${phrase}.`,
  };
};

// d1: quadratic formula with a perfect-square discriminant.
fill["apl-quad-formula-d1"] = (rng, idx) => {
  const [p, q] = pickRoots(rng);
  const B = -(p + q), C = p * q;
  const D = (p - q) * (p - q);
  return {
    id: `gen.apl-quad-formula-d1.${idx}`, generated: true, concepts: ["quadratic-formula"], difficulty: 1, context: "abstract",
    prompt: `Solve using the quadratic formula: $${triStr(B, C)} = 0$`,
    steps: [
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=1$, $b=${B}$, $c=${C}$).`, answer: `${D}`, accept: [], hint: `$(${B})^2 - 4(1)(${C})$.` },
      { instruction: "Apply $x = \\dfrac{-b \\pm \\sqrt{D}}{2a}$ to find both solutions.", form: "solutions", answer: `x = ${p} or x = ${q}`, accept: [`${p}, ${q}`, `${q}, ${p}`], hint: `$x = \\dfrac{${-B} \\pm ${Math.abs(p - q)}}{2}$.` },
    ],
    finalAnswer: { value: `x = ${p}, x = ${q}`, unit: "" },
    solutionNarrative: `Discriminant $${D}$; $x = \\dfrac{${-B} \\pm ${Math.abs(p - q)}}{2}$ gives $x = ${p}$ or $x = ${q}$.`,
  };
};

// ============================================================================
// ratios-proportions-percent  (ratios-and-rates d2 & d3, solve-proportion d3, percent-of d3)
// ============================================================================

// d2: which size is the better deal (unit-price comparison).
const DEAL_ITEMS = ["juice", "olive oil", "yogurt", "shampoo"];
fill["apl-rates-d2"] = (rng, idx) => {
  const item = rng.pick(DEAL_ITEMS);
  const [s1, s2] = rng.pick([[12, 16], [16, 24], [20, 32], [8, 12]]);
  const c1 = rng.int(9, 25);           // cents per ounce, small bottle
  let c2 = rng.int(8, 24);             // cents per ounce, big bottle
  if (c2 === c1) c2 += 2;
  const p1 = (s1 * c1 / 100).toFixed(2), p2 = (s2 * c2 / 100).toFixed(2);
  const u1 = (c1 / 100).toFixed(2), u2 = (c2 / 100).toFixed(2);
  const winner = c1 < c2 ? s1 : s2;
  return {
    id: `gen.apl-rates-d2.${idx}`, generated: true, concepts: ["ratios-and-rates"], difficulty: 2, context: "applied",
    prompt: `A store sells the same ${item} in two sizes: a ${s1} oz bottle for \\$${p1} and a ${s2} oz bottle for \\$${p2}. Which size is the better deal (lower cost per ounce)? (Enter the size in ounces: ${s1} or ${s2}.)`,
    steps: [
      { instruction: `Find the cost per ounce of the ${s1} oz bottle (dollars per ounce).`, answer: u1, accept: [], hint: `${p1} ÷ ${s1}.` },
      { instruction: `Find the cost per ounce of the ${s2} oz bottle (dollars per ounce).`, answer: u2, accept: [], hint: `${p2} ÷ ${s2}.` },
      { instruction: "Which bottle has the lower cost per ounce? Enter its size in ounces.", answer: `${winner}`, accept: [`${winner} oz`, `${winner}oz`], hint: `Smaller per-ounce price wins; compare ${u1} and ${u2}.` },
    ],
    finalAnswer: { value: `${winner}`, unit: "ounces" },
    solutionNarrative: `${s1} oz: $${p1} \\div ${s1} = \\$${u1}$/oz. ${s2} oz: $${p2} \\div ${s2} = \\$${u2}$/oz. The ${winner} oz bottle is cheaper per ounce, so it's the better deal.`,
  };
};

// d3: unit rate, scale it up, then invert it.
const RATE3_CTX = [
  { who: "A car", does: "travels", amt: "miles", per: "gallon", perPl: "gallons", rlo: 18, rhi: 34 },
  { who: "A delivery van", does: "travels", amt: "miles", per: "gallon", perPl: "gallons", rlo: 14, rhi: 22 },
  { who: "An office printer", does: "prints", amt: "pages", per: "minute", perPl: "minutes", rlo: 12, rhi: 28 },
];
fill["apl-rates-d3"] = (rng, idx) => {
  const ctx = rng.pick(RATE3_CTX);
  const r = rng.int(ctx.rlo, ctx.rhi);
  const g1 = rng.int(6, 12);
  const g2 = g1 + rng.int(2, 6);
  const g3 = rng.int(13, 25);
  return {
    id: `gen.apl-rates-d3.${idx}`, generated: true, concepts: ["ratios-and-rates"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} ${ctx.does} ${r * g1} ${ctx.amt} using ${g1} ${ctx.perPl}. At that rate: how many ${ctx.amt} for ${g2} ${ctx.perPl}, and how many ${ctx.perPl} for ${r * g3} ${ctx.amt}?`,
    steps: [
      { instruction: `Find the unit rate in ${ctx.amt} per ${ctx.per}.`, answer: `${r}`, accept: [], hint: `${r * g1} ÷ ${g1}.` },
      { instruction: `Multiply the unit rate by ${g2} ${ctx.perPl}.`, answer: `${r * g2}`, accept: [], hint: `${r} × ${g2}.` },
      { instruction: `Now reverse it: divide ${r * g3} ${ctx.amt} by the unit rate to find the ${ctx.perPl} needed.`, answer: `${g3}`, accept: [], hint: `${r * g3} ÷ ${r}.` },
    ],
    finalAnswer: { value: `${r * g2}`, unit: ctx.amt },
    solutionNarrative: `Unit rate: $${r * g1} \\div ${g1} = ${r}$ ${ctx.amt} per ${ctx.per}. For ${g2} ${ctx.perPl}: $${r} \\times ${g2} = ${r * g2}$ ${ctx.amt}. For ${r * g3} ${ctx.amt}: $${r * g3} \\div ${r} = ${g3}$ ${ctx.perPl}.`,
  };
};

// d3: scale-model / map proportion.
const SCALE_CTX = [
  { thing: "scale model of a lighthouse", small: "inch", smallPl: "inches", big: "feet", dim: "tall", real: "lighthouse" },
  { thing: "hiking map", small: "centimeter", smallPl: "centimeters", big: "kilometers", dim: "long", real: "trail" },
  { thing: "blueprint of a warehouse", small: "inch", smallPl: "inches", big: "feet", dim: "wide", real: "warehouse" },
];
fill["apl-proportion-d3"] = (rng, idx) => {
  const ctx = rng.pick(SCALE_CTX);
  const x0 = rng.int(9, 24);
  const f = rng.int(4, 12);
  const H = f * x0;
  return {
    id: `gen.apl-proportion-d3.${idx}`, generated: true, concepts: ["solve-proportion"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.thing} uses a scale of 1 ${ctx.small} to ${f} ${ctx.big}. The real ${ctx.real} is ${H} ${ctx.big} ${ctx.dim}. How many ${ctx.smallPl} is that on the ${ctx.thing.split(" ")[0] === "hiking" ? "map" : "model"}? Use $\\frac{1}{${f}} = \\frac{x}{${H}}$.`,
    steps: [
      { instruction: "Cross-multiply the proportion.", answer: `${f}x = ${H}`, accept: [`${H} = ${f}x`], hint: `Cross-multiply: $1 \\times ${H} = ${f} \\times x$.` },
      { instruction: `Solve for $x$ (${ctx.smallPl}).`, answer: `x = ${x0}`, accept: [`${x0}`], hint: `Divide both sides by ${f}.` },
    ],
    finalAnswer: { value: `${x0}`, unit: ctx.smallPl },
    solutionNarrative: `$\\frac{1}{${f}} = \\frac{x}{${H}}$ cross-multiplies to $${f}x = ${H}$, so $x = ${x0}$ ${ctx.smallPl}.`,
  };
};

// d3: reverse percent — the part is known, find the whole.
const PCT_CTX = [
  { a: "A salesperson earned a", pn: "commission", wn: "total sales" },
  { a: "A museum collected a", pn: "single donation", wn: "annual fund" },
  { a: "An app store took a", pn: "platform fee", wn: "developer's gross revenue" },
];
fill["apl-percent-of-d3"] = (rng, idx) => {
  const ctx = rng.pick(PCT_CTX);
  const p = rng.pick([4, 5, 6, 8, 15, 20, 25]);
  const w0 = rng.int(20, 90);
  const W = w0 * 100;
  const part = w0 * p;
  const dec = String(p / 100);
  return {
    id: `gen.apl-percent-of-d3.${idx}`, generated: true, concepts: ["percent-of"], difficulty: 3, context: "applied",
    prompt: `${ctx.a} \\$${part} ${ctx.pn}, which was ${p}\\% of the ${ctx.wn}. Find the ${ctx.wn} in dollars.`,
    steps: [
      { instruction: `Using part = percent × whole, write the equation with the whole as $x$ (use ${dec} for ${p}%).`, answer: `${dec}x = ${part}`, accept: [`${part} = ${dec}x`], hint: `The \\$${part} is the part; ${p}% of the whole equals ${part}.` },
      { instruction: `Solve for $x$ by dividing both sides by ${dec}.`, answer: `x = ${W}`, accept: [`${W}`], hint: `${part} ÷ ${dec}.` },
    ],
    finalAnswer: { value: `${W}`, unit: "dollars" },
    solutionNarrative: `$${dec}x = ${part}$, so $x = ${part} \\div ${dec} = \\$${W}$ — the ${ctx.wn}.`,
  };
};

// ============================================================================
// real-numbers  (order-of-operations d3, absolute-value d3)
// ============================================================================

// d3: full PEMDAS chain with parentheses, exponent, and left-to-right × ÷.
fill["apl-order-ops-d3"] = (rng, idx) => {
  const inner = rng.int(2, 4);
  const d = rng.int(3, 7);
  const c = d + inner;
  const b = rng.int(2, 5);
  const sq = inner * inner;
  const P = b * sq;
  const e = rng.pick(properDivs(P));   // P is always composite here
  const md = P / e;
  const a = rng.int(2, 9);
  const final = a + md;
  return {
    id: `gen.apl-order-ops-d3.${idx}`, generated: true, concepts: ["order-of-operations"], difficulty: 3, context: "abstract",
    prompt: `Evaluate: $${a} + ${b} \\times (${c} - ${d})^2 \\div ${e}$`,
    steps: [
      { instruction: "Evaluate inside the parentheses first.", answer: `${inner}`, accept: [], hint: `$${c} - ${d}$.` },
      { instruction: "Apply the exponent: square that result.", answer: `${sq}`, accept: [], hint: `$${inner}^2$.` },
      { instruction: `Now do multiplication and division left to right: $${b} \\times ${sq} \\div ${e}$.`, answer: `${md}`, accept: [], hint: `$${b} \\times ${sq} = ${P}$, then $${P} \\div ${e} = ${md}$.` },
      { instruction: "Finally add.", answer: `${final}`, accept: [], hint: `$${a} + ${md}$.` },
    ],
    finalAnswer: { value: `${final}`, unit: "" },
    solutionNarrative: `Parentheses: $${c} - ${d} = ${inner}$. Exponent: $${inner}^2 = ${sq}$. Left to right: $${b} \\times ${sq} = ${P}$, $${P} \\div ${e} = ${md}$. Add: $${a} + ${md} = ${final}$.`,
  };
};

// d3: absolute value as distance between signed readings, plus the midpoint.
const ABS_CTX = [
  { duo: "Two hikers report their elevations relative to sea level", noun: "elevation", unit: "meters" },
  { duo: "Two weather stations report temperatures relative to freezing", noun: "temperature reading", unit: "degrees Celsius" },
  { duo: "Two research buoys report their depths relative to the surface", noun: "reading", unit: "meters" },
];
fill["apl-abs-value-d3"] = (rng, idx) => {
  const ctx = rng.pick(ABS_CTX);
  const a = -rng.int(15, 60);
  let b = rng.int(10, 45);
  if ((a + b) % 2 !== 0) b += 1;       // keep the midpoint an integer
  const diff = b - a;
  const mid = (a + b) / 2;
  return {
    id: `gen.apl-abs-value-d3.${idx}`, generated: true, concepts: ["absolute-value"], difficulty: 3, context: "applied",
    prompt: `${ctx.duo}: one is at $${a}$ ${ctx.unit} and the other at $${b}$ ${ctx.unit}. How far apart are the two readings?`,
    steps: [
      { instruction: `Compute the difference $${a} - ${b}$.`, answer: `${a - b}`, accept: [], hint: `$${a} - ${b} = ${a - b}$ — negative, because we subtracted the larger value.` },
      { instruction: `The distance between them is the absolute value $|${a - b}|$. Evaluate it.`, answer: `${diff}`, accept: [`|${a - b}|`], hint: "Distance is never negative — drop the sign." },
      { instruction: `A sensor sits exactly halfway between the two. What is its ${ctx.noun}? (Average the two values.)`, answer: `${mid}`, accept: [], hint: `$(${a} + ${b}) \\div 2$ — mind the signs.` },
    ],
    finalAnswer: { value: `${diff}`, unit: ctx.unit },
    solutionNarrative: `$|${a} - ${b}| = |${a - b}| = ${diff}$ ${ctx.unit} apart. The halfway point is $(${a} + ${b})/2 = ${mid}$ ${ctx.unit} — note the distance uses the absolute value, but the midpoint keeps its sign.`,
  };
};

// ============================================================================
// systems-linear-equations  (substitution d1, elimination d1, classify d1-d3)
// ============================================================================

// d1: single substitution step.
fill["apl-substitution-d1"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const aC = rng.int(1, 4);
  const s = aC + k;
  const x0 = rng.int(2, 6);
  const C = s * x0;
  return {
    id: `gen.apl-substitution-d1.${idx}`, generated: true, concepts: ["substitution"], difficulty: 1, context: "abstract",
    prompt: `One equation already gives $y = ${k}x$. Substitute it into $${coefTerm(aC, "x")} + y = ${C}$ and simplify to the form $(\\text{number})x = (\\text{number})$.`,
    steps: [
      { instruction: `Replace $y$ with $${k}x$ and combine the $x$ terms. Write the resulting equation.`, answer: `${s}x = ${C}`, accept: [`${C} = ${s}x`], hint: `$${coefTerm(aC, "x")} + ${k}x = ${s}x$.` },
    ],
    finalAnswer: { value: `${s}x = ${C}`, unit: "" },
    solutionNarrative: `Substituting $y = ${k}x$ gives $${coefTerm(aC, "x")} + ${k}x = ${C}$, i.e. $${s}x = ${C}$ (so $x = ${x0}$, $y = ${k * x0}$).`,
  };
};

// d1: single elimination step (y terms already opposites).
fill["apl-elimination-d1"] = (rng, idx) => {
  const x0 = rng.int(3, 9);
  const y0 = rng.int(1, x0 - 1);
  const S = x0 + y0, Dv = x0 - y0;
  return {
    id: `gen.apl-elimination-d1.${idx}`, generated: true, concepts: ["elimination"], difficulty: 1, context: "abstract",
    prompt: `The $y$ terms are already opposites. Add the two equations to eliminate $y$:  $\\begin{cases} x + y = ${S} \\\\ x - y = ${Dv} \\end{cases}$  Write the resulting equation in $x$.`,
    steps: [
      { instruction: "Add the two equations. The $+y$ and $-y$ cancel. Write the resulting equation.", answer: `2x = ${S + Dv}`, accept: [`${S + Dv} = 2x`], hint: `$x + x = 2x$ and $${S} + ${Dv} = ${S + Dv}$.` },
    ],
    finalAnswer: { value: `2x = ${S + Dv}`, unit: "" },
    solutionNarrative: `Adding cancels $y$: $2x = ${S + Dv}$ (so $x = ${x0}$, then $y = ${y0}$).`,
  };
};

// d1: classify from two slope-intercept lines (parallel vs identical).
fill["apl-classify-d1"] = (rng, idx) => {
  const kind = rng.pick(["none", "infinite"]);
  const m = nz(rng, -5, 5);
  const b1 = nz(rng, -6, 8);
  const mx = coefTerm(m, "x");
  const line1 = `y = ${mx} ${sgnC(b1)}`;
  if (kind === "none") {
    const delta = rng.int(1, 6) * rng.pick([1, -1]);
    let b2 = b1 + delta;
    if (b2 === 0) b2 = b1 - delta;
    const line2 = `y = ${mx} ${sgnC(b2)}`;
    return {
      id: `gen.apl-classify-d1.${idx}`, generated: true, concepts: ["classify-solution"], difficulty: 1, context: "abstract",
      prompt: `How many solutions does this system have? $\\begin{cases} ${line1} \\\\ ${line2} \\end{cases}$`,
      steps: [
        { instruction: "Set the two right-hand sides equal (both equal $y$) and simplify. What statement results?", answer: `${b1} = ${b2}`, accept: [`${mx} ${sgnC(b1)} = ${mx} ${sgnC(b2)}`, `0 = ${b2 - b1}`, `${b2 - b1} = 0`], hint: `$${mx} ${sgnC(b1)} = ${mx} ${sgnC(b2)}$. Subtract $${mx}$ from both sides.` },
        { instruction: "Is that statement true or false? Type 'true' or 'false'.", answer: "false", accept: ["f"], hint: `Is ${b1} equal to ${b2}?` },
        { instruction: "So how many solutions? Type 'none', 'one', or 'infinite'.", answer: "none", accept: ["no solution", "0", "zero"], hint: "Same slope, different intercept means parallel lines." },
      ],
      finalAnswer: { value: "none", unit: "" },
      solutionNarrative: `Both lines have slope ${m} but different intercepts, so they're parallel: setting them equal gives $${b1} = ${b2}$ (false). No solution.`,
    };
  }
  const line2 = `y = ${b1} ${m < 0 ? `- ${coefTerm(-m, "x")}` : `+ ${coefTerm(m, "x")}`}`;
  return {
    id: `gen.apl-classify-d1.${idx}`, generated: true, concepts: ["classify-solution"], difficulty: 1, context: "abstract",
    prompt: `How many solutions does this system have? $\\begin{cases} ${line1} \\\\ ${line2} \\end{cases}$`,
    steps: [
      { instruction: "Set the two right-hand sides equal (both equal $y$) and simplify. What statement results?", answer: `${b1} = ${b1}`, accept: ["0 = 0"], hint: `$${mx} ${sgnC(b1)} = ${b1} ${m < 0 ? `- ${coefTerm(-m, "x")}` : `+ ${coefTerm(m, "x")}`}$ — the $x$ terms cancel.` },
      { instruction: "Is that statement always true? Type 'true' or 'false'.", answer: "true", accept: ["t"], hint: `Does $${b1} = ${b1}$ always hold?` },
      { instruction: "So how many solutions? Type 'none', 'one', or 'infinite'.", answer: "infinite", accept: ["infinitely many", "many"], hint: "The two equations describe the same line, just written in a different order." },
    ],
    finalAnswer: { value: "infinite", unit: "" },
    solutionNarrative: `The second equation is the first with its terms reordered — the same line. Setting them equal gives $${b1} = ${b1}$, always true: infinitely many solutions.`,
  };
};

// d2: classify by substituting into a standard-form second equation.
fill["apl-classify-d2"] = (rng, idx) => {
  const kind = rng.pick(["none", "infinite"]);
  const aa = rng.int(1, 5);
  const c = rng.int(2, 9);
  const k = rng.pick([2, 3]);
  const d = rng.int(2, 6);
  const c2 = kind === "infinite" ? c : c + d;
  const line1 = `y = ${coefTerm(-aa, "x")} + ${c}`;
  const eq2 = `${k * aa}x + ${k}y = ${k * c2}`;
  const stmt = `${k * c} = ${k * c2}`;
  const isInf = kind === "infinite";
  return {
    id: `gen.apl-classify-d2.${idx}`, generated: true, concepts: ["classify-solution"], difficulty: 2, context: "abstract",
    prompt: `How many solutions does this system have? $\\begin{cases} ${line1} \\\\ ${eq2} \\end{cases}$`,
    steps: [
      { instruction: `Substitute $${line1.replace("y = ", "y = ")}$ into $${eq2}$ and simplify completely. What statement results?`, answer: stmt, accept: isInf ? ["0 = 0"] : [`0 = ${k * d}`, `${k * d} = 0`], hint: `$${k * aa}x + ${k}(${coefTerm(-aa, "x")} + ${c}) = ${k * c2}$ — watch the $x$ terms cancel.` },
      { instruction: "Is that statement always true? Type 'true' or 'false'.", answer: isInf ? "true" : "false", accept: [isInf ? "t" : "f"], hint: `Does $${stmt}$ hold?` },
      { instruction: "So how many solutions? Type 'none', 'one', or 'infinite'.", answer: isInf ? "infinite" : "none", accept: isInf ? ["infinitely many", "many"] : ["no solution", "0", "zero"], hint: isInf ? "The two equations are the same line." : "The lines are parallel — they never meet." },
    ],
    finalAnswer: { value: isInf ? "infinite" : "none", unit: "" },
    solutionNarrative: isInf
      ? `Substituting makes the $x$ terms cancel: $${k * c} = ${k * c}$, always true — the second equation is just ${k} times the first, so infinitely many solutions.`
      : `Substituting makes the $x$ terms cancel: $${k * c} = ${k * c2}$, false — the lines are parallel, so no solution.`,
  };
};

// d3: applied classify — plans with the same rate (none) or a rescaled sheet (infinite).
const PLAN_CTX3 = [
  { item: "ride service", per: "mile", fee: "pickup fee" },
  { item: "moving crew", per: "hour", fee: "truck fee" },
  { item: "print shop", per: "poster", fee: "setup fee" },
];
fill["apl-classify-d3"] = (rng, idx) => {
  const ctx = rng.pick(PLAN_CTX3);
  const kind = rng.pick(["none", "infinite"]);
  const m = rng.int(2, 6);
  if (kind === "none") {
    const F = rng.int(3, 8) * 5;
    return {
      id: `gen.apl-classify-d3.${idx}`, generated: true, concepts: ["classify-solution"], difficulty: 3, context: "applied",
      prompt: `${ctx.item.replace(/^./, (ch) => ch.toUpperCase())} A charges \\$${m} per ${ctx.per} with no ${ctx.fee}. ${ctx.item.replace(/^./, (ch) => ch.toUpperCase())} B charges \\$${m} per ${ctx.per} plus a \\$${F} ${ctx.fee}. Is there a usage where they cost the same? Model cost $y$ vs ${ctx.per}s $x$: $\\begin{cases} y = ${m}x \\\\ y = ${m}x + ${F} \\end{cases}$`,
      steps: [
        { instruction: "Set the two costs equal and simplify. What statement results?", answer: `0 = ${F}`, accept: [`${m}x = ${m}x + ${F}`, `${F} = 0`], hint: `$${m}x = ${m}x + ${F}$; subtract $${m}x$.` },
        { instruction: "Is that true or false? Type 'true' or 'false'.", answer: "false", accept: ["f"], hint: `Can 0 equal ${F}?` },
        { instruction: "So how many usages make them equal? Type 'none', 'one', or 'infinite'.", answer: "none", accept: ["no solution", "0", "zero"], hint: `Same per-${ctx.per} rate, different ${ctx.fee} — B is always \\$${F} more.` },
      ],
      finalAnswer: { value: "none", unit: "" },
      solutionNarrative: `Both grow at \\$${m}/${ctx.per} but B starts \\$${F} higher, so $0 = ${F}$ (false): they're never equal.`,
    };
  }
  const f = rng.int(2, 9);
  const k = rng.pick([2, 3]);
  return {
    id: `gen.apl-classify-d3.${idx}`, generated: true, concepts: ["classify-solution"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.item}'s price sheet lists the same plan two ways: $y = ${m}x + ${f}$ and $${k}y = ${k * m}x + ${k * f}$ (total cost $y$ for $x$ ${ctx.per}s). How many $(x, y)$ pairs satisfy both equations?`,
    steps: [
      { instruction: `Substitute $y = ${m}x + ${f}$ into the second equation and simplify completely. What statement results?`, answer: `${k * f} = ${k * f}`, accept: ["0 = 0"], hint: `$${k}(${m}x + ${f}) = ${k * m}x + ${k * f}$ — the $x$ terms cancel.` },
      { instruction: "Is that statement always true? Type 'true' or 'false'.", answer: "true", accept: ["t"], hint: `Does $${k * f} = ${k * f}$ always hold?` },
      { instruction: "So how many solutions? Type 'none', 'one', or 'infinite'.", answer: "infinite", accept: ["infinitely many", "many"], hint: `The second equation is just the first multiplied by ${k} — the same line.` },
    ],
    finalAnswer: { value: "infinite", unit: "" },
    solutionNarrative: `The second equation is ${k} times the first, so every point on the line satisfies both: $${k * f} = ${k * f}$ (always true) — infinitely many solutions.`,
  };
};

// ============================================================================
// variables-expressions  (evaluate d3, translate d3, distributive d1)
// ============================================================================

// d3: evaluate a projectile-height quadratic at a time.
const PROJ_OBJS = ["ball", "arrow", "flare"];
fill["apl-evaluate-d3"] = (rng, idx) => {
  const obj = rng.pick(PROJ_OBJS);
  const T = rng.pick([1, 2, 3]);
  let v = rng.pick([32, 48, 64]);
  if (v < 16 * T) v = 48;              // keep the height nonnegative
  const h0 = rng.int(4, 12);
  const sqTerm = 16 * T * T, vT = v * T;
  const val = -sqTerm + vT + h0;
  return {
    id: `gen.apl-evaluate-d3.${idx}`, generated: true, concepts: ["evaluate-expression"], difficulty: 3, context: "applied",
    prompt: `A ${obj}'s height in feet after $t$ seconds is $-16t^2 + ${v}t + ${h0}$. What is its height at $t = ${T}$ seconds?`,
    steps: [
      { instruction: `Substitute $t = ${T}$ into the expression.`, answer: `-16(${T})^2 + ${v}(${T}) + ${h0}`, accept: [`-16*${T}^2 + ${v}*${T} + ${h0}`], hint: `Replace each $t$ with ${T}.` },
      { instruction: "Evaluate the squared term and the products.", answer: `${-sqTerm} + ${vT} + ${h0}`, accept: [], hint: `$(${T})^2 = ${T * T}$, so $-16 \\times ${T * T} = ${-sqTerm}$ and $${v} \\times ${T} = ${vT}$.` },
      { instruction: "Add to get the height.", answer: `${val}`, accept: [], hint: `$${-sqTerm} + ${vT} = ${vT - sqTerm}$, then add ${h0}.` },
    ],
    finalAnswer: { value: `${val}`, unit: "feet" },
    solutionNarrative: `At $t = ${T}$: $-16(${T * T}) + ${v}(${T}) + ${h0} = ${-sqTerm} + ${vT} + ${h0} = ${val}$ feet.`,
  };
};

// d3: translate a two-part verbal rule into an expression.
const TRANSLATE_WHO = ["A plumber", "A math tutor", "A wedding photographer", "A mobile mechanic"];
fill["apl-translate-d3"] = (rng, idx) => {
  const who = rng.pick(TRANSLATE_WHO);
  const r = rng.pick([35, 40, 45, 50, 60, 75]);
  const dd = rng.pick([15, 20, 25, 30, 40]);
  return {
    id: `gen.apl-translate-d3.${idx}`, generated: true, concepts: ["translate-to-expression"], difficulty: 3, context: "applied",
    prompt: `${who} charges \\$${r} per hour but gives every customer a \\$${dd} discount off the final bill. Write an expression for the amount charged for $h$ hours of work.`,
    steps: [
      { instruction: `Translate '\\$${r} per hour' into a term (use $h$ for hours).`, answer: `${r}h`, accept: [`${r}*h`], hint: "Per hour signals multiplication." },
      { instruction: `Subtract the \\$${dd} discount to get the final amount.`, answer: `${r}h - ${dd}`, accept: [], hint: "A discount off the bill signals subtraction." },
    ],
    finalAnswer: { value: `${r}h - ${dd}`, unit: "dollars" },
    solutionNarrative: `Hourly charge $${r}h$ minus the \\$${dd} discount gives $${r}h - ${dd}$ dollars.`,
  };
};

// d1: single distributive expansion.
fill["apl-distributive-d1"] = (rng, idx) => {
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const v = rng.pick(["x", "y", "n"]);
  const sign = rng.pick(["+", "-"]);
  const ans = `${a}${v} ${sign} ${a * b}`;
  return {
    id: `gen.apl-distributive-d1.${idx}`, generated: true, concepts: ["distributive-property"], difficulty: 1, context: "abstract",
    prompt: `Use the distributive property to expand $${a}(${v} ${sign} ${b})$.`,
    steps: [
      { instruction: `Multiply ${a} by each term inside the parentheses.`, answer: ans, accept: [`${a}*${v} ${sign} ${a}*${b}`], hint: `$${a} \\cdot ${v}$ and $${a} \\cdot ${b}$${sign === "-" ? ", keeping the minus sign" : ""}.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$${a}(${v} ${sign} ${b}) = ${ans}$.`,
  };
};

// ============================================================================
// linear-equations  (combine-like-terms d1 & d2, isolate-variable d2, distribute d2)
// ============================================================================

// d1: combine two purchases of the same item, then solve.
const BUY2_CTX = [
  { items: "markers", extra: "sketchpad" },
  { items: "succulents", extra: "planter" },
  { items: "protein bars", extra: "sports drink" },
];
fill["apl-combine-terms-d1"] = (rng, idx) => {
  const ctx = rng.pick(BUY2_CTX);
  const a1 = rng.int(2, 5);
  const a2 = rng.int(2, 5);
  const cc = rng.int(2, 9);
  const x0 = rng.int(2, 8);
  const dd = (a1 + a2) * x0 + cc;
  const s = a1 + a2;
  const itemSing = ctx.items.replace(/s$/, "");
  return {
    id: `gen.apl-combine-terms-d1.${idx}`, generated: true, concepts: ["combine-like-terms"], difficulty: 1, context: "applied",
    prompt: `You buy ${a1} ${ctx.items} in the morning and ${a2} more in the afternoon, plus one \\$${cc} ${ctx.extra}. The total is \\$${dd}. Each ${itemSing} costs the same amount, $x$ dollars.`,
    steps: [
      { instruction: "Write an equation for the total.", answer: `${a1}x + ${a2}x + ${cc} = ${dd}`, accept: [`${a2}x + ${a1}x + ${cc} = ${dd}`], hint: `${a1} at $x$ each, then ${a2} more at $x$ each, plus the \\$${cc} ${ctx.extra}.` },
      { instruction: "Combine the like terms on the left.", answer: `${s}x + ${cc} = ${dd}`, accept: [], hint: `$${a1}x + ${a2}x = ${s}x$.` },
      { instruction: "Solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`], hint: `Subtract ${cc}, then divide by ${s}.` },
    ],
    finalAnswer: { value: `${x0}`, unit: "dollars" },
    solutionNarrative: `$${a1}x + ${a2}x + ${cc} = ${dd}$ combines to $${s}x + ${cc} = ${dd}$. Subtract ${cc}: $${s}x = ${s * x0}$. Divide by ${s}: each ${itemSing} costs \\$${x0}.`,
  };
};

// d2: variables on both sides, gather then solve.
fill["apl-combine-terms-d2"] = (rng, idx) => {
  const x0 = rng.int(3, 12);
  const cc = rng.int(2, 5);
  const aa = cc + rng.int(2, 5);
  const bb = rng.int(3, 15);
  const dd = bb + (aa - cc) * x0;
  const g = aa - cc;
  return {
    id: `gen.apl-combine-terms-d2.${idx}`, generated: true, concepts: ["combine-like-terms"], difficulty: 2, context: "abstract",
    prompt: `Solve for $x$:  $${aa}x + ${bb} = ${cc}x + ${dd}$.`,
    steps: [
      { instruction: `Subtract $${cc}x$ from both sides to gather the like $x$ terms.`, answer: `${g}x + ${bb} = ${dd}`, accept: [`${bb} + ${g}x = ${dd}`], hint: `$${aa}x - ${cc}x = ${g}x$.` },
      { instruction: `Subtract ${bb} from both sides.`, answer: `${g}x = ${g * x0}`, accept: [], hint: "Move the constant." },
      { instruction: "Solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`], hint: `Divide by ${g}.` },
    ],
    finalAnswer: { value: `${x0}`, unit: "" },
    solutionNarrative: `Subtract $${cc}x$: $${g}x + ${bb} = ${dd}$. Subtract ${bb}: $${g}x = ${g * x0}$. Divide by ${g}: $x = ${x0}$.`,
  };
};

// d2: applied — undo a division and an addition to isolate x.
const SPLIT_CTX = [
  { group: "friends", bill: "dinner bill", extra: "tip share" },
  { group: "roommates", bill: "utility bill", extra: "late-fee share" },
  { group: "teammates", bill: "equipment bill", extra: "shipping share" },
];
fill["apl-isolate-d2"] = (rng, idx) => {
  const ctx = rng.pick(SPLIT_CTX);
  const k = rng.int(2, 5);
  const m = rng.int(4, 12);
  const aT = rng.int(2, 8);
  const btot = m + aT;
  const X = k * m;
  return {
    id: `gen.apl-isolate-d2.${idx}`, generated: true, concepts: ["isolate-variable"], difficulty: 2, context: "applied",
    prompt: `A group of ${k} ${ctx.group} splits a ${ctx.bill} of $x$ dollars evenly. Each person also adds a \\$${aT} ${ctx.extra}, so each pays \\$${btot} in total. Find the ${ctx.bill}.`,
    steps: [
      { instruction: "Write an equation for what one person pays.", answer: `x/${k} + ${aT} = ${btot}`, accept: [`${aT} + x/${k} = ${btot}`], hint: `An even split of $x$ is $x/${k}$; add the \\$${aT} ${ctx.extra}.` },
      { instruction: `Subtract ${aT} from both sides.`, answer: `x/${k} = ${m}`, accept: [], hint: `Undo the $+${aT}$ first.` },
      { instruction: `Multiply both sides by ${k} to isolate $x$.`, answer: `x = ${X}`, accept: [`${X}`], hint: "Undo the division last." },
    ],
    finalAnswer: { value: `${X}`, unit: "dollars" },
    solutionNarrative: `$x/${k} + ${aT} = ${btot}$: subtract ${aT} to get $x/${k} = ${m}$, then multiply by ${k}: the ${ctx.bill} is \\$${X}.`,
  };
};

// d2: applied distribute-then-solve.
const RIBBON_CTX = [
  { who: "A florist", item: "bouquets", uses: "feet of ribbon", plain: "plain bows" },
  { who: "A carpenter", item: "framed shelves", uses: "feet of trim", plain: "plain boards" },
  { who: "An electrician", item: "wired sconces", uses: "feet of cable", plain: "plain leads" },
];
fill["apl-distribute-d2"] = (rng, idx) => {
  const ctx = rng.pick(RIBBON_CTX);
  const k = rng.int(2, 4);
  const aa = rng.int(2, 6);
  const m = rng.int(1, 4);
  const x0 = rng.int(2, 9);
  const C = k * (x0 + aa) + m * x0;
  const s = k + m;
  const plainN = m === 1 ? ctx.plain.replace(/s$/, "") : ctx.plain;
  return {
    id: `gen.apl-distribute-d2.${idx}`, generated: true, concepts: ["distribute"], difficulty: 2, context: "applied",
    prompt: `${ctx.who} makes ${k} ${ctx.item}, each using $(x + ${aa})$ ${ctx.uses}, plus ${m} ${plainN} using $x$ ${ctx.uses} each. The whole job uses ${C} ${ctx.uses}. The equation is $${k}(x + ${aa}) + ${coefTerm(m, "x")} = ${C}$. Solve for $x$.`,
    steps: [
      { instruction: `Distribute the ${k} across the parentheses.`, answer: `${k}x + ${k * aa} + ${coefTerm(m, "x")} = ${C}`, accept: [`${s}x + ${k * aa} = ${C}`], hint: `$${k}(x + ${aa}) = ${k}x + ${k * aa}$.` },
      { instruction: "Combine the like $x$ terms.", answer: `${s}x + ${k * aa} = ${C}`, accept: [], hint: `$${k}x + ${coefTerm(m, "x")} = ${s}x$.` },
      { instruction: `Subtract ${k * aa} from both sides.`, answer: `${s}x = ${s * x0}`, accept: [], hint: `$${C} - ${k * aa} = ${s * x0}$.` },
      { instruction: "Solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`], hint: `Divide both sides by ${s}.` },
    ],
    finalAnswer: { value: `${x0}`, unit: "feet" },
    solutionNarrative: `Distribute: $${k}x + ${k * aa} + ${coefTerm(m, "x")} = ${C}$. Combine: $${s}x + ${k * aa} = ${C}$. Subtract ${k * aa}: $${s}x = ${s * x0}$. Divide by ${s}: $x = ${x0}$.`,
  };
};
