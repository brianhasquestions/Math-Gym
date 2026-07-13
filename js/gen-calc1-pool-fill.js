// gen-calc1-pool-fill.js
// Thin-pool eliminator pack for the calculus-1 subject (templates prefixed c1l-).
// Covers every (concept, difficulty) pool that previously had exactly one seed
// problem and no generator, across six topics:
//   differentiation-rules, limits-and-continuity, derivative-rates-of-change,
//   analyzing-functions, optimization, related-rates
// Self-contained: exports a `fill` map of template-name -> (rng, idx) => problem,
// the same shape as gen-calc1-fill.js / gen-alg-graph-fill.js. Deterministic
// from the passed rng only; no imports from generator.js.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string, sign carried on the numerator: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Leading-coefficient piece: co(1) -> "", co(3) -> "3" (never called with <= 0 here).
const co = (n) => (n === 1 ? "" : `${n}`);
// Exact short decimal (values are constructed to terminate within 2 places).
const dec2 = (v) => String(Math.round(v * 100) / 100);
const PI = 3.14; // convention across the subject: students are told pi ≈ 3.14

export const fill = {};

// ============================================================================
// Topic: calculus-1.differentiation-rules
// ============================================================================

// --- power-rule d3: position -> velocity -> acceleration, evaluated ----------
const POWER_CTX = [
  { obj: "A test sled on a straight rail", pos: "position", u: "meters", au: "m/s^2", tu: "seconds" },
  { obj: "A maglev cart on a track", pos: "position", u: "meters", au: "m/s^2", tu: "seconds" },
  { obj: "A model rocket on a guide wire", pos: "height", u: "feet", au: "ft/s^2", tu: "seconds" },
];
fill["c1l-power-d3"] = (rng, idx) => {
  const ctx = rng.pick(POWER_CTX);
  const a = rng.int(1, 3);
  let b = rng.int(2, 6);
  const c = rng.int(2, 9);
  const t0 = rng.int(1, 3);
  if (6 * a * t0 === 2 * b) b += 1; // keep the final acceleration nonzero
  const vel = `${3 * a}t^2 - ${2 * b}t + ${c}`;
  const acc = `${6 * a}t - ${2 * b}`;
  const accVal = 6 * a * t0 - 2 * b;
  return {
    id: `gen.c1l-power-d3.${idx}`, generated: true, concepts: ["power-rule"], difficulty: 3, context: "applied",
    prompt: `${ctx.obj} moves so its ${ctx.pos} after $t$ ${ctx.tu} is $s(t) = ${co(a)}t^3 - ${b}t^2 + ${c}t$ (in ${ctx.u}). Find the velocity $s'(t)$, the acceleration $s''(t)$, and the acceleration at $t = ${t0}$.`,
    steps: [
      { instruction: "Differentiate the position to get the velocity $s'(t)$.", answer: vel, accept: [], hint: `Power rule term by term: $${a === 1 ? "" : a}t^3 \\to ${3 * a}t^2$, $-${b}t^2 \\to -${2 * b}t$, $${c}t \\to ${c}$.` },
      { instruction: "Differentiate again to get the acceleration $s''(t)$.", answer: acc, accept: [], hint: `$${3 * a}t^2 \\to ${6 * a}t$, $-${2 * b}t \\to -${2 * b}$, and the constant ${c} goes to 0.` },
      { instruction: `Evaluate the acceleration at $t = ${t0}$. Give a number (${ctx.au}).`, answer: `${accVal}`, accept: [], hint: `$${6 * a}(${t0}) - ${2 * b}$.` },
    ],
    finalAnswer: { value: `${accVal}`, unit: ctx.au },
    solutionNarrative: `Two power-rule passes: $s'(t) = ${vel}$ and $s''(t) = ${acc}$. At $t = ${t0}$ the acceleration is $${6 * a}(${t0}) - ${2 * b} = ${accVal}$ ${ctx.au}.`,
  };
};

// --- product-rule d1: x(x ± a), simplify ------------------------------------
fill["c1l-product-d1"] = (rng, idx) => {
  const a = rng.int(2, 9);
  const plus = rng.pick([true, false]);
  const g = plus ? `x + ${a}` : `x - ${a}`;
  const ans = plus ? `2x + ${a}` : `2x - ${a}`;
  return {
    id: `gen.c1l-product-d1.${idx}`, generated: true, concepts: ["product-rule"], difficulty: 1, context: "abstract",
    prompt: `Use the product rule to differentiate $f(x) = x(${g})$. Give the simplified polynomial.`,
    steps: [
      { instruction: `Apply $f'g + fg'$ with $f = x$, $g = ${g}$, then simplify.`, answer: ans, accept: [], hint: `$(1)(${g}) + x(1) = ${g} + x$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Product rule: $(1)(${g}) + x(1) = ${ans}$. (Check: expanding first gives $x^2 ${plus ? "+" : "-"} ${a}x$, whose derivative is the same.)`,
  };
};

// --- product-rule d3: (x^2 + a)(x + b), simplify and evaluate ----------------
fill["c1l-product-d3"] = (rng, idx) => {
  const a = rng.int(1, 5);
  const b = rng.int(1, 4);
  const x0 = rng.int(1, 3);
  const dstr = `3x^2 + ${2 * b}x + ${a}`;
  const val = 3 * x0 * x0 + 2 * b * x0 + a;
  return {
    id: `gen.c1l-product-d3.${idx}`, generated: true, concepts: ["product-rule"], difficulty: 3, context: "abstract",
    prompt: `Use the product rule to differentiate $f(x) = (x^2 + ${a})(x + ${b})$, simplify to a polynomial, then evaluate $f'(${x0})$.`,
    steps: [
      { instruction: `Apply $f'g + fg'$ with $f = x^2 + ${a}$, $g = x + ${b}$, and simplify to a polynomial.`, answer: dstr, accept: [`2x(x+${b}) + x^2 + ${a}`], hint: `$2x(x + ${b}) + (x^2 + ${a})(1) = 2x^2 + ${2 * b}x + x^2 + ${a}$.` },
      { instruction: `Evaluate $f'(${x0})$. Give a number.`, answer: `${val}`, accept: [], hint: `$3(${x0 * x0}) + ${2 * b}(${x0}) + ${a}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$f'(x) = 2x(x + ${b}) + (x^2 + ${a}) = ${dstr}$. At $x = ${x0}$: $${3 * x0 * x0} + ${2 * b * x0} + ${a} = ${val}$.`,
  };
};

// --- quotient-rule d1: derivative of x/(x+a) given, evaluate -----------------
fill["c1l-quotient-d1"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const x0 = rng.int(1, 3);
  const den = (x0 + a) * (x0 + a);
  const ans = frac(a, den);
  const raw = `${a}/${den}`;
  return {
    id: `gen.c1l-quotient-d1.${idx}`, generated: true, concepts: ["quotient-rule"], difficulty: 1, context: "abstract",
    prompt: `Let $f(x) = \\dfrac{x}{x + ${a}}$. The quotient rule gives $f'(x) = \\dfrac{${a}}{(x + ${a})^2}$. Evaluate the derivative at $x = ${x0}$.`,
    steps: [
      { instruction: `Substitute $x = ${x0}$ into $\\frac{${a}}{(x + ${a})^2}$. Give a fraction or decimal.`, answer: ans, accept: ans === raw ? [] : [raw], hint: `$(${x0} + ${a})^2 = ${den}$, so the value is $\\frac{${a}}{${den}}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `The numerator $f'g - fg' = (1)(x + ${a}) - x(1) = ${a}$, so $f'(x) = \\frac{${a}}{(x + ${a})^2}$. At $x = ${x0}$: $\\frac{${a}}{${den}}$.`,
  };
};

// --- quotient-rule d3: average cost (x^2 + c)/x, rate at a production level --
const QUOT_CTX = [
  { who: "A workshop's", item: "units" },
  { who: "A print shop's", item: "batches" },
  { who: "A bakery's", item: "trays" },
];
fill["c1l-quotient-d3"] = (rng, idx) => {
  const ctx = rng.pick(QUOT_CTX);
  const x0 = rng.pick([5, 10]);
  const c = x0 === 5 ? rng.int(9, 21) : rng.int(21, 79);
  const num = x0 * x0 - c;
  const val = dec2(num / (x0 * x0));
  return {
    id: `gen.c1l-quotient-d3.${idx}`, generated: true, concepts: ["quotient-rule"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} average cost per ${ctx.item.replace(/s$/, "")} is $A(x) = \\dfrac{x^2 + ${c}}{x}$ dollars when making $x$ ${ctx.item}. Use the quotient rule to find $A'(x)$, then the rate of change of average cost at $x = ${x0}$ ${ctx.item}.`,
    steps: [
      { instruction: `Compute the numerator $f'g - fg'$ with $f = x^2 + ${c}$, $g = x$, and simplify.`, answer: `x^2 - ${c}`, accept: [], hint: `$(2x)(x) - (x^2 + ${c})(1) = 2x^2 - x^2 - ${c}$.` },
      { instruction: `So $A'(x) = \\frac{x^2 - ${c}}{x^2}$. Evaluate $A'(${x0})$. Give a number (a decimal is fine).`, answer: val, accept: [`${num}/${x0 * x0}`], hint: `$\\frac{${x0 * x0} - ${c}}{${x0 * x0}} = \\frac{${num}}{${x0 * x0}}$.` },
    ],
    finalAnswer: { value: val, unit: "dollars per " + ctx.item.replace(/s$/, "") },
    solutionNarrative: `$A'(x) = \\frac{(2x)(x) - (x^2 + ${c})}{x^2} = \\frac{x^2 - ${c}}{x^2}$. At $x = ${x0}$: $\\frac{${num}}{${x0 * x0}} = ${val}$ — average cost is ${num >= 0 ? "rising" : "falling"} by that much per extra ${ctx.item.replace(/s$/, "")}.`,
  };
};

// --- chain-rule d1: (x ± a)^2, expand ----------------------------------------
fill["c1l-chain-d1"] = (rng, idx) => {
  const a = rng.int(2, 9);
  const plus = rng.pick([true, false]);
  const u = plus ? `x + ${a}` : `x - ${a}`;
  const ans = plus ? `2x + ${2 * a}` : `2x - ${2 * a}`;
  return {
    id: `gen.c1l-chain-d1.${idx}`, generated: true, concepts: ["chain-rule"], difficulty: 1, context: "abstract",
    prompt: `Use the chain rule to differentiate $f(x) = (${u})^2$. Give the expanded polynomial.`,
    steps: [
      { instruction: `Apply $n u^{n-1} u'$ with $u = ${u}$, $n = 2$, $u' = 1$, then expand.`, answer: ans, accept: [`2(${u})`], hint: `$2(${u})^1 \\cdot 1 = 2(${u})$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Chain rule: $2(${u}) \\cdot 1 = ${ans}$.`,
  };
};

// --- chain-rule d3: (x^2 + a)^3, factored derivative, then evaluate -----------
fill["c1l-chain-d3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const x0 = rng.int(1, 2);
  const inner = x0 * x0 + a;
  const val = 6 * x0 * inner * inner;
  const dstr = `6x(x^2 + ${a})^2`;
  return {
    id: `gen.c1l-chain-d3.${idx}`, generated: true, concepts: ["chain-rule"], difficulty: 3, context: "abstract",
    prompt: `Use the chain rule to differentiate $f(x) = (x^2 + ${a})^3$, then evaluate the derivative at $x = ${x0}$.`,
    steps: [
      { instruction: `With $u = x^2 + ${a}$, $n = 3$, $u' = 2x$, write $n u^{n-1} u'$ (you may leave it factored).`, answer: dstr, accept: [`3(x^2+${a})^2*2x`, `6*x*(x^2+${a})^2`], hint: `$3(x^2 + ${a})^2 \\cdot 2x = 6x(x^2 + ${a})^2$.` },
      { instruction: `Evaluate the derivative at $x = ${x0}$. Give a number.`, answer: `${val}`, accept: [], hint: `$6(${x0})(${x0 * x0} + ${a})^2 = ${6 * x0} \\cdot ${inner * inner}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$f'(x) = 3(x^2 + ${a})^2 \\cdot 2x = ${dstr}$. At $x = ${x0}$: $${6 * x0}(${inner})^2 = ${val}$. Forgetting the inner factor $2x$ is the classic mistake.`,
  };
};

// ============================================================================
// Topic: calculus-1.limits-and-continuity
// ============================================================================

// --- evaluate-limits d3: 0/0 with both top and bottom factoring --------------
fill["c1l-evallim-d3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  let c = rng.int(1, 6);
  if (c === a) c = c === 6 ? 5 : c + 1;       // denominator roots must be distinct
  if (a === 3 && c === 2) c = 4;              // don't clone the seed problem
  const d = c - a;
  const dAbs = Math.abs(d);
  const midTerm = d > 0 ? `+ ${dAbs === 1 ? "" : dAbs}x` : `- ${dAbs === 1 ? "" : dAbs}x`;
  const denStr = `x^2 ${midTerm} - ${a * c}`;
  const ans = frac(2 * a, a + c);
  const raw = `${2 * a}/${a + c}`;
  return {
    id: `gen.c1l-evallim-d3.${idx}`, generated: true, concepts: ["evaluate-limits"], difficulty: 3, context: "abstract",
    prompt: `Evaluate: $\\lim_{x \\to ${a}}\\dfrac{x^2 - ${a * a}}{${denStr}}$.`,
    steps: [
      { instruction: `Factor the numerator $x^2 - ${a * a}$.`, answer: `(x - ${a})(x + ${a})`, accept: [`(x+${a})(x-${a})`], hint: "Difference of squares." },
      { instruction: `Factor the denominator $${denStr}$.`, answer: `(x - ${a})(x + ${c})`, accept: [`(x+${c})(x-${a})`], hint: `Two numbers multiplying to $-${a * c}$ and adding to $${d}$: $-${a}$ and $${c}$.` },
      { instruction: `Cancel $(x - ${a})$ and substitute $x = ${a}$ into $\\frac{x + ${a}}{x + ${c}}$. Give a fraction.`, answer: ans, accept: ans === raw ? [] : [raw], hint: `$\\frac{${a} + ${a}}{${a} + ${c}} = \\frac{${2 * a}}{${a + c}}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Both factor with $(x - ${a})$: $\\frac{(x-${a})(x+${a})}{(x-${a})(x+${c})} = \\frac{x+${a}}{x+${c}}$, which at $x = ${a}$ is $\\frac{${2 * a}}{${a + c}}$.`,
  };
};

// --- continuity d1: a polynomial is continuous; check the value --------------
fill["c1l-cont-d1"] = (rng, idx) => {
  const b = rng.int(2, 6);
  const c = rng.int(1, 9);
  const p = rng.int(1, 4);
  const v = b * p - c;
  return {
    id: `gen.c1l-cont-d1.${idx}`, generated: true, concepts: ["continuity"], difficulty: 1, context: "abstract",
    prompt: `Is $f(x) = ${b}x - ${c}$ continuous at $x = ${p}$? Answer 'yes' or 'no'.`,
    steps: [
      { instruction: `Compute $f(${p})$.`, answer: `${v}`, accept: [], hint: `$${b}(${p}) - ${c}$.` },
      { instruction: `Since a polynomial's limit equals its value everywhere, is it continuous at $x = ${p}$? Answer 'yes' or 'no'.`, answer: "yes", accept: [], hint: "Polynomials are continuous at every point — no holes, no jumps." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Polynomials are continuous everywhere; $f(${p}) = ${v}$ equals the limit as $x \\to ${p}$, so $f$ is continuous there.`,
  };
};

// --- continuity d3: patch a removable hole, or stitch a piecewise seam --------
fill["c1l-cont-d3"] = (rng, idx) => {
  const kind = rng.pick(["hole", "seam"]);
  const base = { id: `gen.c1l-cont-d3.${idx}`, generated: true, concepts: ["continuity"], difficulty: 3, context: "abstract" };
  if (kind === "hole") {
    const a = rng.int(4, 9); // a = 3 is the seed problem
    return { ...base,
      prompt: `A piecewise function is $f(x) = \\dfrac{x^2 - ${a * a}}{x - ${a}}$ for $x \\ne ${a}$ and $f(x) = k$ for $x = ${a}$. What value of $k$ removes the discontinuity at $x = ${a}$?`,
      steps: [
        { instruction: `Factor and cancel: simplify $\\frac{x^2 - ${a * a}}{x - ${a}}$ to a polynomial.`, answer: `x + ${a}`, accept: [], hint: `$x^2 - ${a * a} = (x - ${a})(x + ${a})$; cancel $(x - ${a})$.` },
        { instruction: `Take the limit as $x \\to ${a}$ of $x + ${a}$. This is the value $k$ must equal.`, answer: `${2 * a}`, accept: [`k=${2 * a}`], hint: `$${a} + ${a}$.` },
      ],
      finalAnswer: { value: `${2 * a}`, unit: "" },
      solutionNarrative: `The function simplifies to $x + ${a}$, whose limit at ${a} is ${2 * a}; setting $k = ${2 * a}$ patches the hole.`,
    };
  }
  const p = rng.int(1, 3);
  const b = rng.int(1, 8);
  const m = rng.int(2, 5);
  const left = p * p + b;
  const k = left - m * p;
  return { ...base,
    prompt: `A piecewise function is $f(x) = x^2 + ${b}$ for $x \\le ${p}$ and $f(x) = ${m}x + k$ for $x > ${p}$. What value of $k$ makes $f$ continuous at $x = ${p}$?`,
    steps: [
      { instruction: `Evaluate the left piece at $x = ${p}$.`, answer: `${left}`, accept: [], hint: `$${p}^2 + ${b}$.` },
      { instruction: `Set the right piece equal to that value at $x = ${p}$: $${m}(${p}) + k = ${left}$. Solve for $k$.`, answer: `${k}`, accept: [`k=${k}`], hint: `$${m * p} + k = ${left}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `The left piece reaches $${p}^2 + ${b} = ${left}$ at the seam; forcing $${m}(${p}) + k = ${left}$ gives $k = ${k}$, which makes the pieces meet with no jump.`,
  };
};

// --- limits-applied d1: read the instantaneous rate off a simplified average --
const LIMAPP_CTX = [
  { thing: "A cyclist's", q: "average speed", when: "over $[t, t+h]$ at a certain moment", unit: "m/s", name: "instantaneous speed" },
  { thing: "A pump's", q: "average flow rate", when: "over a short interval $[t, t+h]$", unit: "liters per second", name: "instantaneous flow rate" },
  { thing: "A reaction's", q: "average rate", when: "over $[t, t+h]$", unit: "grams per second", name: "instantaneous rate" },
];
fill["c1l-limapp-d1"] = (rng, idx) => {
  const ctx = rng.pick(LIMAPP_CTX);
  const c = rng.int(3, 12);
  const k = rng.int(2, 16);
  return {
    id: `gen.c1l-limapp-d1.${idx}`, generated: true, concepts: ["limits-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.thing} ${ctx.q} ${ctx.when} simplifies to $${c} + ${k}h$. Find the ${ctx.name} by taking the limit as $h \\to 0$ (${ctx.unit}).`,
    steps: [
      { instruction: `Evaluate the limit of $${c} + ${k}h$ as $h \\to 0$.`, answer: `${c}`, accept: [], hint: `Substitute $h = 0$: the $${k}h$ term vanishes.` },
    ],
    finalAnswer: { value: `${c}`, unit: ctx.unit },
    solutionNarrative: `As the interval shrinks, $${c} + ${k}h \\to ${c}$ — the average over a vanishing window becomes the instantaneous rate, $${c}$ ${ctx.unit}.`,
  };
};

// ============================================================================
// Topic: calculus-1.derivative-rates-of-change
// ============================================================================

// --- slope-and-tangent d1: evaluate a given derivative for the tangent slope --
fill["c1l-slopetan-d1"] = (rng, idx) => {
  const b = rng.int(2, 8);
  const x0 = rng.int(1, 5);
  const m = 2 * x0 + b;
  return {
    id: `gen.c1l-slopetan-d1.${idx}`, generated: true, concepts: ["slope-and-tangent"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = x^2 + ${b}x$ with derivative $f'(x) = 2x + ${b}$, find the slope of the tangent line at $x = ${x0}$.`,
    steps: [
      { instruction: `Evaluate $f'(${x0})$ (a number).`, answer: `${m}`, accept: [], hint: `Substitute $x = ${x0}$ into $2x + ${b}$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$f'(x) = 2x + ${b}$, so the tangent slope at $x = ${x0}$ is $f'(${x0}) = ${m}$.`,
  };
};

// --- average-vs-instantaneous d1: average velocity over an interval -----------
const AVG_CTX = [
  { obj: "A car's", pos: "position", posu: "miles", tu: "hours", ru: "miles per hour" },
  { obj: "A jogger's", pos: "distance from home", posu: "kilometers", tu: "hours", ru: "kilometers per hour" },
  { obj: "A cart's", pos: "position", posu: "meters", tu: "seconds", ru: "meters per second" },
];
fill["c1l-avginst-d1"] = (rng, idx) => {
  const ctx = rng.pick(AVG_CTX);
  const c = rng.int(1, 5);
  const a = rng.int(0, 2);
  const b = a + rng.int(2, 4);
  const avg = a + b + c; // ((b^2+cb) - (a^2+ca))/(b-a) simplifies to a+b+c
  const sa = a * a + c * a, sb = b * b + c * b;
  return {
    id: `gen.c1l-avginst-d1.${idx}`, generated: true, concepts: ["average-vs-instantaneous"], difficulty: 1, context: "applied",
    prompt: `${ctx.obj} ${ctx.pos} is $s(t) = t^2 + ${c}t$ ${ctx.posu} after $t$ ${ctx.tu}. Find the average velocity over the interval from $t = ${a}$ to $t = ${b}$ ${ctx.tu}.`,
    steps: [
      { instruction: `Compute the average rate $\\dfrac{s(${b}) - s(${a})}{${b} - ${a}}$ (a number, in ${ctx.ru}).`, answer: `${avg}`, accept: [`${sb - sa}/${b - a}`], hint: `$s(${b}) = ${sb}$, $s(${a}) = ${sa}$; divide the change by ${b - a}.` },
    ],
    finalAnswer: { value: `${avg}`, unit: ctx.ru },
    solutionNarrative: `Average velocity $= \\dfrac{${sb} - ${sa}}{${b} - ${a}} = \\dfrac{${sb - sa}}{${b - a}} = ${avg}$ ${ctx.ru} — total change over total time.`,
  };
};

// --- average-vs-instantaneous d3: cubic position, average vs midpoint instant --
fill["c1l-avginst-d3"] = (rng, idx) => {
  const a = rng.int(2, 4); // a = 1 would clone the seed's [1,3] numbers
  const b = a + 2;
  const m = a + 1;
  const avg = a * a + a * b + b * b;   // (b^3 - a^3)/2
  const inst = 3 * m * m;
  const ctx = rng.pick([
    { obj: "A rocket's", pos: "height", u: "meters", tu: "seconds", ru: "m/s" },
    { obj: "A drag racer's", pos: "distance down the strip", u: "meters", tu: "seconds", ru: "m/s" },
    { obj: "A weather balloon's", pos: "altitude", u: "feet", tu: "minutes", ru: "ft/min" },
  ]);
  return {
    id: `gen.c1l-avginst-d3.${idx}`, generated: true, concepts: ["average-vs-instantaneous"], difficulty: 3, context: "applied",
    prompt: `${ctx.obj} ${ctx.pos} is $s(t) = t^3$ ${ctx.u} after $t$ ${ctx.tu}, with velocity $s'(t) = 3t^2$. Find the average velocity over $[${a}, ${b}]$ and the instantaneous velocity at the midpoint $t = ${m}$, then state which is larger.`,
    steps: [
      { instruction: `Compute the average velocity $\\dfrac{s(${b}) - s(${a})}{${b} - ${a}}$ (a number, ${ctx.ru}).`, answer: `${avg}`, accept: [`${b ** 3 - a ** 3}/2`], hint: `$s(${b}) = ${b ** 3}$, $s(${a}) = ${a ** 3}$; divide the change by 2.` },
      { instruction: `Compute the instantaneous velocity $s'(${m})$ (a number, ${ctx.ru}).`, answer: `${inst}`, accept: [], hint: `Substitute into $3t^2$: $3(${m * m})$.` },
      { instruction: `Which is larger — the average over $[${a}, ${b}]$ or the instant at $t = ${m}$? Type 'average' or 'instantaneous'.`, answer: "average", accept: [], hint: `Compare ${avg} and ${inst}.` },
    ],
    finalAnswer: { value: "average", unit: "" },
    solutionNarrative: `Average velocity $= \\dfrac{${b ** 3} - ${a ** 3}}{2} = ${avg}$ ${ctx.ru}; instantaneous $s'(${m}) = 3(${m * m}) = ${inst}$ ${ctx.ru}. On a speeding-up cubic the interval average beats the midpoint instant — here by exactly 1.`,
  };
};

// --- interpret-derivative d3: marginal profit with sign interpretation --------
fill["c1l-interp-d3"] = (rng, idx) => {
  const b = 2 * rng.int(10, 25);
  const d = rng.int(2, 8);
  const falling = rng.pick([true, false]);
  const x0 = falling ? b / 2 + d : b / 2 - d;
  const rate = falling ? -2 * d : 2 * d;
  const word = falling ? "falling" : "rising";
  const ctx = rng.pick([
    { who: "A company's", fn: "profit", model: "P", xdesc: "units", unit: "dollars per unit" },
    { who: "A food stand's", fn: "profit", model: "P", xdesc: "meals", unit: "dollars per meal" },
    { who: "An app studio's", fn: "profit", model: "P", xdesc: "licenses", unit: "dollars per license" },
  ]);
  return {
    id: `gen.c1l-interp-d3.${idx}`, generated: true, concepts: ["interpret-derivative"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} ${ctx.fn} on $x$ ${ctx.xdesc} is $${ctx.model}(x) = -x^2 + ${b}x$ dollars. Find the marginal ${ctx.fn} $${ctx.model}'(x)$, evaluate it at $x = ${x0}$, then state whether ${ctx.fn} is rising or falling there.`,
    steps: [
      { instruction: `Differentiate $${ctx.model}(x)$.`, answer: `-2x + ${b}`, accept: [`${b} - 2x`], hint: "Power rule term by term." },
      { instruction: `Evaluate $${ctx.model}'(${x0})$ (a number, ${ctx.unit}).`, answer: `${rate}`, accept: [], hint: `$-2(${x0}) + ${b}$.` },
      { instruction: `Is ${ctx.fn} rising or falling at $x = ${x0}$? Type 'rising' or 'falling'.`, answer: word, accept: [falling ? "decreasing" : "increasing"], hint: `The sign of the derivative tells the direction: ${rate} is ${falling ? "negative" : "positive"}.` },
    ],
    finalAnswer: { value: `${rate}`, unit: ctx.unit },
    solutionNarrative: `$${ctx.model}'(x) = -2x + ${b}$, so $${ctx.model}'(${x0}) = ${rate}$ ${ctx.unit}. The ${falling ? "negative" : "positive"} sign means each additional ${ctx.xdesc.replace(/s$/, "")} ${falling ? "reduces" : "adds to"} ${ctx.fn} — it is ${word} there.`,
  };
};

// ============================================================================
// Topic: calculus-1.analyzing-functions
// ============================================================================

// --- increasing-decreasing d1: sign of f' at a point --------------------------
fill["c1l-incdec-d1"] = (rng, idx) => {
  const c = rng.int(1, 9);
  const dec = rng.pick([true, false]);
  let x0, b;
  if (dec) { x0 = rng.int(1, 3); b = 2 * x0 + rng.int(2, 6); }
  else { x0 = rng.int(3, 6); b = 2 * x0 - rng.int(2, 5); }
  const v = 2 * x0 - b;
  const word = dec ? "decreasing" : "increasing";
  return {
    id: `gen.c1l-incdec-d1.${idx}`, generated: true, concepts: ["increasing-decreasing"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = x^2 - ${b}x + ${c}$, is the function increasing or decreasing at $x = ${x0}$?`,
    steps: [
      { instruction: "Differentiate $f$.", answer: `2x - ${b}`, accept: [`f'(x) = 2x - ${b}`], hint: "Derivative of $x^2$ is $2x$; the constant goes to 0." },
      { instruction: `Evaluate $f'(${x0})$.`, answer: `${v}`, accept: [], hint: `Substitute $x = ${x0}$ into $2x - ${b}$.` },
      { instruction: `Since $f'(${x0})$ is ${dec ? "negative" : "positive"}, is $f$ increasing or decreasing there? (one word)`, answer: word, accept: [dec ? "falling" : "rising"], hint: `A ${dec ? "negative slope means the function is going down" : "positive slope means the function is going up"}.` },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `$f'(x) = 2x - ${b}$, and $f'(${x0}) = ${v}$ is ${dec ? "negative" : "positive"}, so the function is ${word} at $x = ${x0}$.`,
  };
};

// --- increasing-decreasing d3: decreasing interval of a cubic -----------------
fill["c1l-incdec-d3"] = (rng, idx) => {
  const kind = rng.pick(["hump", "symmetric"]);
  const base = { id: `gen.c1l-incdec-d3.${idx}`, generated: true, concepts: ["increasing-decreasing"], difficulty: 3, context: "abstract" };
  if (kind === "hump") {
    const k = rng.int(2, 6); // k = 1 is the seed's x^3 - 3x^2
    const r = 2 * k;
    return { ...base,
      prompt: `For $f(x) = x^3 - ${3 * k}x^2$, find the interval where the function is decreasing (as a compound inequality in $x$).`,
      steps: [
        { instruction: "Differentiate $f$.", answer: `3x^2 - ${6 * k}x`, accept: [`f'(x) = 3x^2 - ${6 * k}x`], hint: "Differentiate term by term." },
        { instruction: "Factor $f'(x)$.", answer: `3x(x - ${r})`, accept: [`3x(x-${r})`], hint: "Pull out $3x$." },
        { instruction: "The function decreases where $f'(x) < 0$ — between the two roots. Give the interval as a compound inequality.", answer: `0 < x < ${r}`, accept: [`0<x<${r}`], hint: `Between $x = 0$ and $x = ${r}$ the product $3x(x - ${r})$ is negative.` },
      ],
      finalAnswer: { value: `0 < x < ${r}`, unit: "" },
      solutionNarrative: `$f'(x) = 3x(x - ${r})$ is negative exactly between its roots, so $f$ is decreasing on $0 < x < ${r}$.`,
    };
  }
  const a = rng.int(2, 5);
  return { ...base,
    prompt: `For $f(x) = x^3 - ${3 * a * a}x$, find the interval where the function is decreasing (as a compound inequality in $x$).`,
    steps: [
      { instruction: "Differentiate $f$.", answer: `3x^2 - ${3 * a * a}`, accept: [`f'(x) = 3x^2 - ${3 * a * a}`], hint: "Differentiate term by term." },
      { instruction: "Set $f'(x) = 0$ and solve. Enter both $x$-values.", answer: `x = ${a} or x = -${a}`, accept: [`${a}, -${a}`, `-${a}, ${a}`, `x = -${a} or x = ${a}`], hint: `$3x^2 = ${3 * a * a} \\Rightarrow x^2 = ${a * a}$, so $x = \\pm ${a}$.` },
      { instruction: "The function decreases between the critical points. Give the interval as a compound inequality.", answer: `-${a} < x < ${a}`, accept: [`-${a}<x<${a}`], hint: `$3x^2 - ${3 * a * a} < 0$ when $x^2 < ${a * a}$.` },
    ],
    finalAnswer: { value: `-${a} < x < ${a}`, unit: "" },
    solutionNarrative: `$f'(x) = 3x^2 - ${3 * a * a} < 0$ when $x^2 < ${a * a}$, so $f$ is decreasing on $-${a} < x < ${a}$.`,
  };
};

// --- concavity-inflection d1: sign of f'' at a point ---------------------------
fill["c1l-concav-d1"] = (rng, idx) => {
  const x0 = rng.int(1, 3);
  const down = rng.pick([true, false]);
  const b = down ? 3 * x0 + rng.int(1, 4) : rng.int(1, 5);
  const c = rng.int(1, 9);
  const sgn = down ? "-" : "+";
  const fpp = `6x ${sgn} ${2 * b}`;
  const v = down ? 6 * x0 - 2 * b : 6 * x0 + 2 * b;
  const word = down ? "concave down" : "concave up";
  return {
    id: `gen.c1l-concav-d1.${idx}`, generated: true, concepts: ["concavity-inflection"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = x^3 ${sgn} ${b}x^2 + ${c}x$, is the graph concave up or concave down at $x = ${x0}$?`,
    steps: [
      { instruction: "Find the second derivative $f''(x)$.", answer: fpp, accept: [`f''(x) = ${fpp}`], hint: `$f'(x) = 3x^2 ${sgn} ${2 * b}x + ${c}$, then differentiate again.` },
      { instruction: `Evaluate $f''(${x0})$.`, answer: `${v}`, accept: [], hint: `Substitute $x = ${x0}$ into $${fpp}$.` },
      { instruction: `Since $f''(${x0})$ is ${down ? "negative" : "positive"}, is the graph concave up or concave down? (two words)`, answer: word, accept: [down ? "down" : "up"], hint: down ? "Negative second derivative means the curve arches over." : "Positive second derivative means the curve cups upward." },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `$f''(x) = ${fpp}$, and $f''(${x0}) = ${v}$ is ${down ? "negative" : "positive"}, so the graph is ${word} at $x = ${x0}$.`,
  };
};

// ============================================================================
// Topic: calculus-1.optimization
// ============================================================================

// --- max-min-from-derivative d3: closed-interval max of a cubic ----------------
const MAXMIN_CTX = [
  { thing: "machine's efficiency score", unit: "points" },
  { thing: "solar array's output index", unit: "points" },
  { thing: "crew's productivity score", unit: "points" },
];
fill["c1l-maxmin-d3"] = (rng, idx) => {
  const ctx = rng.pick(MAXMIN_CTX);
  const p = rng.pick([1, 2]);
  const q = p + 2;
  let D = rng.int(2, 9);
  if (p === 2 && D === 5) D += 1; // seed problem is t^3 - 9t^2 + 24t + 5 on [0,6]
  const B = (3 * (p + q)) / 2;
  const C = 3 * p * q;
  const bEnd = q + 2;
  const E = (t) => t ** 3 - B * t * t + C * t + D;
  const maxV = Math.max(E(0), E(p), E(q), E(bEnd)); // always E(bEnd) by construction
  return {
    id: `gen.c1l-maxmin-d3.${idx}`, generated: true, concepts: ["max-min-from-derivative"], difficulty: 3, context: "applied",
    prompt: `Over a work shift $0 \\le t \\le ${bEnd}$ hours, a ${ctx.thing} is $E(t) = t^3 - ${B}t^2 + ${C}t + ${D}$. The maximum on this closed interval could be at a critical point or an endpoint. Find the highest score on $[0, ${bEnd}]$.`,
    steps: [
      { instruction: "Differentiate $E(t)$.", answer: `3t^2 - ${2 * B}t + ${C}`, accept: [], hint: "Power rule term by term." },
      { instruction: "Set $E'(t) = 0$ and find the critical points (the smaller one first, as a list).", answer: `t = ${p}, t = ${q}`, accept: [`${p}, ${q}`, `t=${p}, t=${q}`], hint: `Divide by 3: $t^2 - ${p + q}t + ${p * q} = 0$ factors as $(t - ${p})(t - ${q})$.` },
      { instruction: `Evaluate $E$ at the critical points $t=${p}$, $t=${q}$ and the endpoints $t=0$, $t=${bEnd}$. What is the largest value?`, answer: `${maxV}`, accept: [], hint: `Compute $E(0)=${E(0)}$, $E(${p})=${E(p)}$, $E(${q})=${E(q)}$, $E(${bEnd})=${E(bEnd)}$ and pick the biggest.` },
    ],
    finalAnswer: { value: `${maxV}`, unit: ctx.unit },
    solutionNarrative: `$E'(t) = 3t^2 - ${2 * B}t + ${C} = 3(t-${p})(t-${q})$, so the critical points are $t=${p}, ${q}$. Comparing $E(0)=${E(0)}$, $E(${p})=${E(p)}$, $E(${q})=${E(q)}$, $E(${bEnd})=${E(bEnd)}$, the endpoint $t=${bEnd}$ gives the maximum of ${maxV} — a reminder that endpoints can beat interior critical points.`,
  };
};

// --- geometry-optimization d1: pen against a wall ------------------------------
const GEO_CTX = ["an existing barn wall", "a straight riverbank", "a garage wall", "a neighbor's fence"];
fill["c1l-geoopt-d1"] = (rng, idx) => {
  const wall = rng.pick(GEO_CTX);
  let k = rng.int(4, 9);
  if (k === 6) k = 7; // F = 24 with x = 6 is the seed problem
  const F = 4 * k;
  return {
    id: `gen.c1l-geoopt-d1.${idx}`, generated: true, concepts: ["geometry-optimization"], difficulty: 1, context: "applied",
    prompt: `A farmer has ${F} feet of fencing to build a rectangular pen against ${wall}, so fencing is needed on only the two widths and one length: $2x + y = ${F}$, where $x$ is the width and $y$ the length. The area is $A = xy$. Find the width $x$ that maximizes the area.`,
    steps: [
      { instruction: `Use the constraint to write the area as a function of $x$ alone (substitute $y = ${F} - 2x$).`, answer: `${F}x - 2x^2`, accept: [`x(${F} - 2x)`, `-2x^2 + ${F}x`], hint: `$A = x \\cdot y = x(${F} - 2x)$.` },
      { instruction: "Differentiate and set $A'(x) = 0$, then solve for $x$.", answer: `x = ${k}`, accept: [`${k}`], hint: `$A'(x) = ${F} - 4x = 0$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "feet" },
    solutionNarrative: `With $y = ${F} - 2x$, $A(x) = ${F}x - 2x^2$. Then $A'(x) = ${F} - 4x = 0$ gives $x = ${k}$ feet (and $y = ${2 * k}$ ft), the maximizing width.`,
  };
};

// --- business-optimization d1: profit-maximizing price -------------------------
const BUS_CTX = ["A lemonade stand's", "A food truck's", "A pop-up kiosk's", "A coffee cart's"];
fill["c1l-busopt-d1"] = (rng, idx) => {
  const who = rng.pick(BUS_CTX);
  const a = rng.int(1, 3);
  const pStar = rng.int(3, 12);
  const b = 2 * a * pStar;
  const cc = rng.int(5, 60);
  return {
    id: `gen.c1l-busopt-d1.${idx}`, generated: true, concepts: ["business-optimization"], difficulty: 1, context: "applied",
    prompt: `${who} daily profit (in dollars) as a function of price $p$ (in dollars) is $P(p) = -${co(a)}p^2 + ${b}p - ${cc}$. Find the price that maximizes profit.`,
    steps: [
      { instruction: "Differentiate $P(p)$.", answer: `-${2 * a}p + ${b}`, accept: [`${b} - ${2 * a}p`], hint: "Power rule term by term." },
      { instruction: "Set $P'(p) = 0$ and solve for $p$.", answer: `p = ${pStar}`, accept: [`${pStar}`], hint: `Solve $-${2 * a}p + ${b} = 0$.` },
    ],
    finalAnswer: { value: `${pStar}`, unit: "dollars" },
    solutionNarrative: `$P'(p) = -${2 * a}p + ${b} = 0$ gives $p = ${pStar}$. The parabola opens downward, so \\$${pStar} is the profit-maximizing price.`,
  };
};

// --- business-optimization d3: price -> demand -> profit ------------------------
const BUS3_CTX = [{ item: "gadget" }, { item: "phone case" }, { item: "desk lamp" }, { item: "board game" }];
fill["c1l-busopt-d3"] = (rng, idx) => {
  const ctx = rng.pick(BUS3_CTX);
  const k = rng.pick([1, 2]);
  const cost = rng.pick([10, 20, 30]);
  let m = rng.pick([10, 20]);
  if (k === 2 && cost === 20 && m === 20) m = 10; // seed: P = (p-20)(120-2p)
  const pStar = cost + m;
  const N = k * (cost + 2 * m);
  const A1 = 2 * k * (cost + m);
  const A0 = cost * N;
  const maxProfit = k * m * m;
  const poly = `-${co(k)}p^2 + ${A1}p - ${A0}`;
  return {
    id: `gen.c1l-busopt-d3.${idx}`, generated: true, concepts: ["business-optimization"], difficulty: 3, context: "applied",
    prompt: `An online store sells a ${ctx.item}. If it charges price $p$ dollars, it sells $(${N} - ${co(k)}p)$ units, and each unit costs \\$${cost} to make. Profit is $P(p) = (p - ${cost})(${N} - ${co(k)}p)$. Find the price that maximizes profit and the maximum profit (in dollars).`,
    steps: [
      { instruction: "Expand the profit into a polynomial in $p$.", answer: poly, accept: [], hint: `$(p - ${cost})(${N} - ${co(k)}p) = ${N}p - ${co(k)}p^2 - ${A0} + ${k * cost}p$.` },
      { instruction: "Differentiate and set $P'(p) = 0$ to find the optimal price.", answer: `p = ${pStar}`, accept: [`${pStar}`], hint: `$P'(p) = -${2 * k}p + ${A1} = 0$.` },
      { instruction: `Substitute $p = ${pStar}$ to find the maximum profit.`, answer: `${maxProfit}`, accept: [], hint: `$(${pStar} - ${cost})(${N} - ${k * pStar}) = ${m} \\times ${k * m}$.` },
    ],
    finalAnswer: { value: `${maxProfit}`, unit: "dollars" },
    solutionNarrative: `Expanding, $P(p) = ${poly}$, so $P'(p) = -${2 * k}p + ${A1} = 0$ at $p = ${pStar}$. The store then sells $${N} - ${k * pStar} = ${k * m}$ units at a \\$${m} margin each: \\$${maxProfit} profit.`,
  };
};

// --- distance-time-optimization d1: quadratic trip time -------------------------
const DIST1_CTX = ["A delivery van's total trip time", "A ferry's crossing time", "A shuttle's total run time"];
fill["c1l-distopt-d1"] = (rng, idx) => {
  const what = rng.pick(DIST1_CTX);
  const m = rng.int(4, 9);
  const c = m * m + rng.int(5, 40);
  return {
    id: `gen.c1l-distopt-d1.${idx}`, generated: true, concepts: ["distance-time-optimization"], difficulty: 1, context: "applied",
    prompt: `${what} (in minutes) depends on its routing choice $x$ as $T(x) = x^2 - ${2 * m}x + ${c}$. Find the value of $x$ that minimizes the trip time.`,
    steps: [
      { instruction: "Differentiate $T(x)$.", answer: `2x - ${2 * m}`, accept: [], hint: "Power rule term by term." },
      { instruction: "Set $T'(x) = 0$ and solve for $x$.", answer: `x = ${m}`, accept: [`${m}`], hint: `Solve $2x - ${2 * m} = 0$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$T'(x) = 2x - ${2 * m} = 0$ gives $x = ${m}$; the upward parabola makes this the minimum-time choice.`,
  };
};

// --- distance-time-optimization d2: run-then-swim time with minimum value -------
const DIST2_CTX = [
  { who: "A lifeguard runs to a point $x$ meters down the beach before swimming out", u: "seconds" },
  { who: "A courier rides to a point $x$ meters along the road before cutting across a field", u: "seconds" },
  { who: "A cable crew trenches to a point $x$ meters along the street before crossing a lot", u: "minutes" },
];
fill["c1l-distopt-d2"] = (rng, idx) => {
  const ctx = rng.pick(DIST2_CTX);
  const m = 2 * rng.int(3, 7);
  let c = (m * m) / 2 + rng.int(10, 60);
  if (m === 8 && c === 90) c = 80; // seed: T = x^2/2 - 8x + 90
  const minT = c - (m * m) / 2;
  return {
    id: `gen.c1l-distopt-d2.${idx}`, generated: true, concepts: ["distance-time-optimization"], difficulty: 2, context: "applied",
    prompt: `${ctx.who}. The total time (in ${ctx.u}) works out to $T(x) = \\frac{1}{2}x^2 - ${m}x + ${c}$. Find the value of $x$ that minimizes travel time, and the minimum time.`,
    steps: [
      { instruction: "Differentiate $T(x)$.", answer: `x - ${m}`, accept: [], hint: "$\\frac{d}{dx}[\\frac{1}{2}x^2] = x$." },
      { instruction: "Set $T'(x) = 0$ and solve for $x$.", answer: `x = ${m}`, accept: [`${m}`], hint: `Solve $x - ${m} = 0$.` },
      { instruction: `Substitute $x = ${m}$ to find the minimum time.`, answer: `${minT}`, accept: [], hint: `$\\frac{1}{2}(${m * m}) - ${m}(${m}) + ${c} = ${(m * m) / 2} - ${m * m} + ${c}$.` },
    ],
    finalAnswer: { value: `${minT}`, unit: ctx.u },
    solutionNarrative: `$T'(x) = x - ${m} = 0$ gives $x = ${m}$. Then $T(${m}) = ${(m * m) / 2} - ${m * m} + ${c} = ${minT}$ ${ctx.u}, the minimum travel time.`,
  };
};

// --- distance-time-optimization d3: cubic time, classify the local minimum ------
const DIST3_CTX = [
  "A courier crosses from a road to a point in a field",
  "A hiker leaves a trail to cut toward a campsite",
  "A boat picks a landing point along the shore",
];
fill["c1l-distopt-d3"] = (rng, idx) => {
  const who = rng.pick(DIST3_CTX);
  const p = rng.int(1, 3);
  const q = p + 2;
  let c = rng.int(2, 9);
  if (p === 3 && c === 2) c = 3; // seed: T = x^3/3 - 4x^2 + 15x + 2
  const B = (p + q) / 2;
  const C = p * q;
  return {
    id: `gen.c1l-distopt-d3.${idx}`, generated: true, concepts: ["distance-time-optimization"], difficulty: 3, context: "applied",
    prompt: `${who}. Minimizing total time leads to the function $T(x) = \\frac{1}{3}x^3 - ${B}x^2 + ${C}x + ${c}$ (in minutes), for $x \\ge 0$. Among its critical points, find the value of $x$ that gives a local minimum of time.`,
    steps: [
      { instruction: "Differentiate $T(x)$.", answer: `x^2 - ${p + q}x + ${C}`, accept: [], hint: "$\\frac{d}{dx}[\\frac{1}{3}x^3] = x^2$." },
      { instruction: "Set $T'(x) = 0$ and find the critical points (smaller first, as a list).", answer: `x = ${p}, x = ${q}`, accept: [`${p}, ${q}`, `x=${p}, x=${q}`], hint: `$x^2 - ${p + q}x + ${C} = (x - ${p})(x - ${q})$.` },
      { instruction: `Using the second derivative $T''(x) = 2x - ${p + q}$, which critical point is the local minimum?`, answer: `x = ${q}`, accept: [`${q}`], hint: `A local min needs $T''(x) > 0$; check $T''(${q}) = ${2 * q - p - q}$ versus $T''(${p}) = ${2 * p - p - q}$.` },
    ],
    finalAnswer: { value: `${q}`, unit: "" },
    solutionNarrative: `$T'(x) = x^2 - ${p + q}x + ${C} = (x-${p})(x-${q})$, so the critical points are $x = ${p}, ${q}$. Since $T''(x) = 2x - ${p + q}$, $T''(${q}) = ${q - p} > 0$, making $x = ${q}$ the local minimum (while $x = ${p}$ is a local max).`,
  };
};

// ============================================================================
// Topic: calculus-1.related-rates
// ============================================================================

// --- expanding-shrinking d1: circle area rate from radius rate ------------------
const EXP_CTX = [
  { thing: "A pebble dropped in a lake makes a circular ripple whose radius grows", u: "ft", tu: "s" },
  { thing: "A patch of algae spreads as a circle whose radius grows", u: "m", tu: "day" },
  { thing: "A projector's circular spotlight is widened so its radius grows", u: "ft", tu: "s" },
];
fill["c1l-expand-d1"] = (rng, idx) => {
  const ctx = rng.pick(EXP_CTX);
  let r = rng.int(3, 9);
  const k = rng.int(1, 3);
  if (r === 5 && k === 2) r = 6; // seed: r = 5, dr/dt = 2
  const val = dec2(2 * PI * r * k);
  return {
    id: `gen.c1l-expand-d1.${idx}`, generated: true, concepts: ["expanding-shrinking"], difficulty: 1, context: "applied",
    prompt: `${ctx.thing} at $\\frac{dr}{dt} = ${k}$ ${ctx.u}/${ctx.tu}. How fast is the enclosed area growing when the radius is ${r} ${ctx.u}? Use $\\pi \\approx 3.14$.`,
    steps: [
      { instruction: "Differentiate $A = \\pi r^2$ with respect to time. Write the related-rate equation.", answer: "dA/dt = 2*pi*r*dr/dt", accept: ["dA/dt=2*pi*r*dr/dt", "dA/dt = 2 pi r dr/dt"], hint: "Chain rule: $\\frac{dA}{dt} = 2\\pi r \\frac{dr}{dt}$." },
      { instruction: `Substitute $r = ${r}$, $\\frac{dr}{dt} = ${k}$, and $\\pi \\approx 3.14$, then compute the rate in ${ctx.u}²/${ctx.tu}.`, answer: val, accept: [], hint: `$2(3.14)(${r})(${k})$.` },
    ],
    finalAnswer: { value: val, unit: `${ctx.u}^2/${ctx.tu}` },
    solutionNarrative: `From $A = \\pi r^2$, $\\frac{dA}{dt} = 2\\pi r \\frac{dr}{dt} = 2(3.14)(${r})(${k}) = ${val}$ ${ctx.u}²/${ctx.tu}.`,
  };
};

// --- ladder-and-distance d1: sliding ladder, clean integer rate -----------------
const LADDER_POOL = [
  { x: 3, y: 4, z: 5, k: 4 },
  { x: 3, y: 4, z: 5, k: 8 },
  { x: 6, y: 8, z: 10, k: 4 },
  { x: 6, y: 8, z: 10, k: 8 },
  { x: 8, y: 6, z: 10, k: 3 },
  { x: 8, y: 6, z: 10, k: 6 },
  { x: 9, y: 12, z: 15, k: 4 },
  { x: 9, y: 12, z: 15, k: 8 },
  { x: 12, y: 16, z: 20, k: 4 },
  { x: 16, y: 12, z: 20, k: 3 },
  { x: 4, y: 3, z: 5, k: 3 },
  { x: 4, y: 3, z: 5, k: 6 },
];
fill["c1l-ladder-d1"] = (rng, idx) => {
  const { x, y, z, k } = rng.pick(LADDER_POOL);
  const ans = -(x * k) / y; // integer by construction
  return {
    id: `gen.c1l-ladder-d1.${idx}`, generated: true, concepts: ["ladder-and-distance"], difficulty: 1, context: "applied",
    prompt: `A ${z} ft ladder leans against a wall. Its base is pulled away from the wall at $\\frac{dx}{dt} = ${k}$ ft/s. When the base is ${x} ft from the wall, the top is ${y} ft up. How fast is the top sliding down? (Report the rate; it will be negative because the top descends.)`,
    steps: [
      { instruction: `Differentiate $x^2 + y^2 = ${z * z}$ in time (the length is constant). Write the related-rate equation.`, answer: "2x*dx/dt + 2y*dy/dt = 0", accept: ["2x*dx/dt+2y*dy/dt=0", "x*dx/dt + y*dy/dt = 0"], hint: `The right side is 0 since $z = ${z}$ is constant: $2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0$.` },
      { instruction: `Substitute $x = ${x}$, $y = ${y}$, $\\frac{dx}{dt} = ${k}$ and solve for $\\frac{dy}{dt}$ in ft/s.`, answer: `${ans}`, accept: [], hint: `$\\frac{dy}{dt} = -\\frac{x}{y}\\frac{dx}{dt} = -\\frac{${x}}{${y}}(${k})$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "ft/s" },
    solutionNarrative: `$2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0 \\Rightarrow \\frac{dy}{dt} = -\\frac{${x}}{${y}}(${k}) = ${ans}$ ft/s (the top descends).`,
  };
};

// --- ladder-and-distance d3: two movers separating along perpendicular paths ----
const SEP_CTX = [
  { who: "Two ships leave the same port", a: "one sails north", b: "the other east", u: "km", tu: "h" },
  { who: "Two hikers leave the same trailhead", a: "one walks north", b: "the other east", u: "km", tu: "h" },
  { who: "Two delivery drones lift off from the same pad and fly level", a: "one heads north", b: "the other east", u: "m", tu: "s" },
];
const SEP_TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]];
fill["c1l-ladder-d3"] = (rng, idx) => {
  const ctx = rng.pick(SEP_CTX);
  const [a, b, c] = rng.pick(SEP_TRIPLES);
  const m = rng.int(1, 3);
  const n = rng.int(1, 3);
  const y = a * m, x = b * m, z = c * m;   // north leg a·m, east leg b·m
  const dy = a * n, dx = b * n, dz = c * n;
  return {
    id: `gen.c1l-ladder-d3.${idx}`, generated: true, concepts: ["ladder-and-distance"], difficulty: 3, context: "applied",
    prompt: `${ctx.who}: ${ctx.a} at ${dy} ${ctx.u}/${ctx.tu}, ${ctx.b} at ${dx} ${ctx.u}/${ctx.tu}. At the moment the north traveler is ${y} ${ctx.u} out and the east traveler is ${x} ${ctx.u} out, how fast is the distance between them increasing? ($x^2 + y^2 = z^2$.)`,
    steps: [
      { instruction: `Find the current separation $z$ from $x = ${x}$, $y = ${y}$.`, answer: `${z}`, accept: [`z = ${z}`, `z=${z}`], hint: `$\\sqrt{${x}^2 + ${y}^2} = \\sqrt{${x * x + y * y}}$.` },
      { instruction: "Differentiate $x^2 + y^2 = z^2$ in time. Write the related-rate equation.", answer: "2x*dx/dt + 2y*dy/dt = 2z*dz/dt", accept: ["x*dx/dt + y*dy/dt = z*dz/dt", "2x*dx/dt+2y*dy/dt=2z*dz/dt"], hint: "$2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 2z\\frac{dz}{dt}$." },
      { instruction: `Substitute $x=${x}$, $\\frac{dx}{dt}=${dx}$, $y=${y}$, $\\frac{dy}{dt}=${dy}$, $z=${z}$ and solve for $\\frac{dz}{dt}$ in ${ctx.u}/${ctx.tu}.`, answer: `${dz}`, accept: [`${dz}.0`, `dz/dt = ${dz}`], hint: `$\\frac{dz}{dt} = \\frac{x\\frac{dx}{dt} + y\\frac{dy}{dt}}{z} = \\frac{${x}(${dx}) + ${y}(${dy})}{${z}} = \\frac{${x * dx + y * dy}}{${z}}$.` },
    ],
    finalAnswer: { value: `${dz}`, unit: `${ctx.u}/${ctx.tu}` },
    solutionNarrative: `With $z = ${z}$, $\\frac{dz}{dt} = \\frac{${x}(${dx}) + ${y}(${dy})}{${z}} = \\frac{${x * dx + y * dy}}{${z}} = ${dz}$ ${ctx.u}/${ctx.tu} — they separate at a steady combined rate.`,
  };
};

// --- filling-draining d1: constant cross-section tank ---------------------------
const FILL_PAIRS = [
  { A: 10, dV: 5 }, { A: 10, dV: 2 }, { A: 20, dV: 4 }, { A: 20, dV: 10 },
  { A: 25, dV: 5 }, { A: 40, dV: 10 }, { A: 40, dV: 8 }, { A: 50, dV: 10 }, { A: 50, dV: 25 },
]; // (20, 5) is the seed pool; every pair here gives an exact 1-2 decimal rate
const FILL_CTX = ["rectangular pool", "storage tank", "lap pool", "koi pond"];
fill["c1l-filling-d1"] = (rng, idx) => {
  const { A, dV } = rng.pick(FILL_PAIRS);
  const what = rng.pick(FILL_CTX);
  const val = dec2(dV / A);
  return {
    id: `gen.c1l-filling-d1.${idx}`, generated: true, concepts: ["filling-draining"], difficulty: 1, context: "applied",
    prompt: `A ${what} with a flat ${A} m² surface is being filled at $\\frac{dV}{dt} = ${dV}$ m³/min. Because the surface area is constant, $V = ${A}h$. How fast is the water level $h$ rising?`,
    steps: [
      { instruction: `Differentiate $V = ${A}h$ in time. Write the related-rate equation.`, answer: `dV/dt = ${A}*dh/dt`, accept: [`dV/dt=${A}*dh/dt`, `dV/dt = ${A} dh/dt`], hint: `The area is constant, so $\\frac{dV}{dt} = ${A}\\frac{dh}{dt}$.` },
      { instruction: `Substitute $\\frac{dV}{dt} = ${dV}$ and solve for $\\frac{dh}{dt}$ in m/min.`, answer: val, accept: [`${dV}/${A}`], hint: `$\\frac{dh}{dt} = \\frac{${dV}}{${A}}$.` },
    ],
    finalAnswer: { value: val, unit: "m/min" },
    solutionNarrative: `$\\frac{dV}{dt} = ${A}\\frac{dh}{dt} \\Rightarrow \\frac{dh}{dt} = \\frac{${dV}}{${A}} = ${val}$ m/min.`,
  };
};

// --- filling-draining d3: conical tank via similar triangles ---------------------
fill["c1l-filling-d3"] = (rng, idx) => {
  const n = rng.pick([2, 3, 4]);       // depth-to-radius ratio, r = h/n
  const R = 2, D = 2 * n, h = n;       // tank: depth D, top radius R, water at half depth
  let dV = rng.int(2, 8);
  if (n === 3 && dV === 2) dV = 5;     // seed: 6 ft deep, 2 ft top radius, dV = 2, h = 3
  const den3 = 3 * n * n;              // V = pi h^3 / (3n^2)
  const val = (dV / PI).toFixed(2);    // at h = n, dV/dt = pi * dh/dt exactly
  return {
    id: `gen.c1l-filling-d3.${idx}`, generated: true, concepts: ["filling-draining"], difficulty: 3, context: "applied",
    prompt: `An inverted conical tank is ${D} ft deep with a ${R} ft top radius. Water flows in at $\\frac{dV}{dt} = ${dV}$ ft³/min. How fast is the level rising when the depth is ${h} ft? Use similar triangles ($r = h/${n}$) and $\\pi \\approx 3.14$; round to 2 decimals.`,
    steps: [
      { instruction: `Using $r = h/${n}$, substitute into $V = \\frac{1}{3}\\pi r^2 h$ to get $V$ in terms of $h$ alone.`, answer: `V = pi*h^3/${den3}`, accept: [`V=pi*h^3/${den3}`, `V = (pi/${den3})*h^3`], hint: `$V = \\frac{1}{3}\\pi\\left(\\frac{h}{${n}}\\right)^2 h = \\frac{\\pi}{${den3}}h^3$.` },
      { instruction: "Differentiate in time. Write the related-rate equation.", answer: `dV/dt = (pi/${n * n})*h^2*dh/dt`, accept: [`dV/dt=(pi/${n * n})*h^2*dh/dt`, `dV/dt = pi/${n * n} h^2 dh/dt`], hint: `$\\frac{d}{dt}\\left(\\frac{\\pi}{${den3}}h^3\\right) = \\frac{3\\pi}{${den3}}h^2\\frac{dh}{dt} = \\frac{\\pi}{${n * n}}h^2\\frac{dh}{dt}$.` },
      { instruction: `Substitute $h = ${h}$, $\\frac{dV}{dt} = ${dV}$, $\\pi \\approx 3.14$ and solve for $\\frac{dh}{dt}$ in ft/min (2 decimals).`, answer: val, accept: [], hint: `$\\frac{\\pi}{${n * n}}(${h * h}) = \\pi$, so $\\frac{dh}{dt} = \\frac{${dV}}{3.14}$.` },
    ],
    finalAnswer: { value: val, unit: "ft/min" },
    solutionNarrative: `$V = \\frac{\\pi}{${den3}}h^3 \\Rightarrow \\frac{dV}{dt} = \\frac{\\pi}{${n * n}}h^2\\frac{dh}{dt}$. At $h = ${h}$ the coefficient is exactly $\\pi$, so $\\frac{dh}{dt} = \\frac{${dV}}{3.14} \\approx ${val}$ ft/min — and it keeps slowing as the water widens.`,
  };
};

// --- rates-in-motion d1: shadow growing at a fixed fraction of walking speed -----
const MOT1_CTX = [
  { who: "A person walks directly away from a streetlight", what: "shadow" },
  { who: "A child walks away from a porch light", what: "shadow" },
  { who: "A worker walks away from a floodlight pole", what: "shadow" },
];
fill["c1l-motion-d1"] = (rng, idx) => {
  const ctx = rng.pick(MOT1_CTX);
  const m = rng.pick([2, 3, 4]);
  let j = rng.int(1, 4);
  if (m === 2 && j === 2) j = 3; // seed: ds/dt = (1/2)(4) = 2
  const v = m * j;
  return {
    id: `gen.c1l-motion-d1.${idx}`, generated: true, concepts: ["rates-in-motion"], difficulty: 1, context: "applied",
    prompt: `${ctx.who}. A similar-triangles analysis shows the ${ctx.what} length $s$ always satisfies $\\frac{ds}{dt} = \\frac{1}{${m}}\\frac{dx}{dt}$ for this lamp. If they walk at $\\frac{dx}{dt} = ${v}$ ft/s, how fast does the ${ctx.what} lengthen?`,
    steps: [
      { instruction: `Substitute $\\frac{dx}{dt} = ${v}$ into $\\frac{ds}{dt} = \\frac{1}{${m}}\\frac{dx}{dt}$ to find $\\frac{ds}{dt}$ in ft/s.`, answer: `${j}`, accept: [`${j}.0`, `ds/dt = ${j}`], hint: `One ${m === 2 ? "half" : m === 3 ? "third" : "quarter"} of ${v}.` },
    ],
    finalAnswer: { value: `${j}`, unit: "ft/s" },
    solutionNarrative: `$\\frac{ds}{dt} = \\frac{1}{${m}}(${v}) = ${j}$ ft/s — the ${ctx.what} grows at a fixed fraction of the walking speed.`,
  };
};

// --- rates-in-motion d3: shadow-tip speed from lamp and person heights -----------
const MOT3_PAIRS = [
  { H: 12, hh: 6 }, { H: 10, hh: 6 }, { H: 18, hh: 6 }, { H: 16, hh: 4 },
  { H: 20, hh: 8 }, { H: 12, hh: 8 }, { H: 15, hh: 9 }, { H: 14, hh: 7 },
]; // (15, 6) is the seed pair
fill["c1l-motion-d3"] = (rng, idx) => {
  const { H, hh } = rng.pick(MOT3_PAIRS);
  const g = gcd(H, H - hh);
  const p = H / g, q = (H - hh) / g;    // L = (p/q) x
  const j = rng.int(1, 3);
  const speed = q * j;
  const ans = p * j;
  const ratio = frac(H, H - hh);
  const ratioEq = q === 1 ? `dL/dt = ${p}*dx/dt` : `dL/dt = (${p}/${q})*dx/dt`;
  return {
    id: `gen.c1l-motion-d3.${idx}`, generated: true, concepts: ["rates-in-motion"], difficulty: 3, context: "applied",
    prompt: `A ${hh} ft tall person walks away from a ${H} ft streetlight at $\\frac{dx}{dt} = ${speed}$ ft/s ($x$ is the distance from the lamp post). By similar triangles the shadow tip sits at distance $L = \\frac{${H}}{${H} - ${hh}}x$ from the post. How fast is the shadow tip moving?`,
    steps: [
      { instruction: `Simplify the ratio $\\frac{${H}}{${H} - ${hh}}$ (a reduced fraction or whole number).`, answer: ratio, accept: [`${H}/${H - hh}`], hint: `$\\frac{${H}}{${H - hh}}$; divide top and bottom by ${g}.` },
      { instruction: `Differentiate $L = ${q === 1 ? p : `\\frac{${p}}{${q}}`}x$ in time. Write the related-rate equation.`, answer: ratioEq, accept: [ratioEq.replace(/ /g, ""), q === 1 ? `dL/dt = ${p} dx/dt` : `dL/dt = ${p}/${q} dx/dt`], hint: `The ratio is constant: $\\frac{dL}{dt} = ${q === 1 ? p : `\\frac{${p}}{${q}}`}\\frac{dx}{dt}$.` },
      { instruction: `Substitute $\\frac{dx}{dt} = ${speed}$ and compute $\\frac{dL}{dt}$ in ft/s.`, answer: `${ans}`, accept: [`${ans}.0`, `dL/dt = ${ans}`], hint: q === 1 ? `$${p} \\times ${speed}$.` : `$\\frac{${p}}{${q}}(${speed}) = ${p} \\times ${j}$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "ft/s" },
    solutionNarrative: `$L = ${q === 1 ? p : `\\frac{${p}}{${q}}`}x$, so $\\frac{dL}{dt} = ${q === 1 ? p : `\\frac{${p}}{${q}}`}(${speed}) = ${ans}$ ft/s — the shadow tip always outruns the walker.`,
  };
};
