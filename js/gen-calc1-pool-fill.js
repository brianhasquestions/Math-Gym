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

// ============================================================================
// Wave 15: the remaining 2-seed pools, one template per (concept, difficulty)
// ============================================================================

// Trailing linear term: linTerm(3) -> " + 3", linTerm(-3) -> " - 3", linTerm(0) -> "".
const linTerm = (b) => (b === 0 ? "" : b > 0 ? ` + ${b}` : ` - ${-b}`);

// ============================================================================
// Topic: calculus-1.limits-and-continuity (wave 15)
// ============================================================================

// --- one-sided-and-infinite d1: limit at infinity, two flavors -----------------
const OS1_PAIRS = [[2, 4], [2, 8], [4, 6], [3, 9], [4, 10], [6, 8], [5, 10], [2, 6]]; // (3, 6) is the seed
const OS1_CTX = [
  { who: "A streaming service's", what: "average server cost per viewer", item: "viewers", x: "x" },
  { who: "A print shop's", what: "average cost per poster", item: "posters", x: "x" },
  { who: "A delivery hub's", what: "average cost per package", item: "packages", x: "x" },
];
fill["c1l-onesided-d1"] = (rng, idx) => {
  const kind = rng.pick(["ratio", "applied"]);
  const base = { id: `gen.c1l-onesided-d1.${idx}`, generated: true, concepts: ["one-sided-and-infinite"], difficulty: 1 };
  if (kind === "ratio") {
    const [a, b] = rng.pick(OS1_PAIRS);
    const p = rng.int(1, 5);
    const q = rng.int(1, 5);
    const g = gcd(a, b);
    const ans = frac(a, b); // every OS1 pair reduces
    const dec = (100 * a) % b === 0 ? dec2(a / b) : null;
    return { ...base, context: "abstract",
      prompt: `Find the limit at infinity: $\\lim_{x \\to \\infty}\\dfrac{${a}x^2 + ${p}}{${b}x^2 - ${q}x}$.`,
      steps: [
        { instruction: "Top and bottom have the same degree, so take the ratio of the leading coefficients and simplify to a fraction.", answer: ans, accept: [`${a}/${b}`, ...(dec ? [dec] : [])], hint: `Both are degree 2, so the limit is $\\frac{${a}}{${b}}$.` },
      ],
      finalAnswer: { value: ans, unit: "" },
      solutionNarrative: `Same degree top and bottom, so the limit is the ratio of leading coefficients, $\\frac{${a}}{${b}} = \\frac{${a / g}}{${b / g}}$.`,
    };
  }
  const ctx = rng.pick(OS1_CTX);
  const k = rng.pick([200, 300, 400, 600, 800]); // 500 is the seed
  const c = rng.int(2, 9);
  return { ...base, context: "applied",
    prompt: `${ctx.who} ${ctx.what} is $C(${ctx.x}) = \\dfrac{${k}}{${ctx.x}} + ${c}$ dollars when serving $${ctx.x}$ ${ctx.item}. As $${ctx.x}$ grows very large, what value does the ${ctx.what} approach (dollars)?`,
    steps: [
      { instruction: `As $${ctx.x} \\to \\infty$, the term $\\frac{${k}}{${ctx.x}}$ approaches what value?`, answer: "0", accept: [], hint: "A fixed number over a huge denominator goes to 0." },
      { instruction: `Add that to the constant ${c} to get the limiting ${ctx.what}.`, answer: `${c}`, accept: [], hint: `$0 + ${c}$.` },
    ],
    finalAnswer: { value: `${c}`, unit: "dollars" },
    solutionNarrative: `$\\frac{${k}}{${ctx.x}} \\to 0$ as $${ctx.x} \\to \\infty$, so the ${ctx.what} settles toward $\\$${c}$ per ${ctx.item.replace(/s$/, "")}.`,
  };
};

// --- one-sided-and-infinite d3: one-sided limits at a piecewise seam ------------
fill["c1l-onesided-d3"] = (rng, idx) => {
  const p = rng.int(1, 4);
  const a = rng.int(1, 9);
  const L = p + a;
  const jump = rng.pick([true, false]);
  const d = jump ? rng.pick([-3, -2, -1, 1, 2, 3]) : 0;
  const R = L + d;
  const b = R - 2 * p; // right piece 2x + b hits R at x = p
  const rightStr = `2x${linTerm(b)}`;
  const word = jump ? "no" : "yes";
  return {
    id: `gen.c1l-onesided-d3.${idx}`, generated: true, concepts: ["one-sided-and-infinite"], difficulty: 3, context: "abstract",
    prompt: `A function is defined piecewise: $f(x) = x + ${a}$ for $x < ${p}$ and $f(x) = ${rightStr}$ for $x > ${p}$. Does $\\lim_{x \\to ${p}}f(x)$ exist? Answer 'yes' or 'no' after computing both one-sided limits.`,
    steps: [
      { instruction: `Find the left-hand limit: substitute $x = ${p}$ into $x + ${a}$.`, answer: `${L}`, accept: [], hint: `$${p} + ${a}$.` },
      { instruction: `Find the right-hand limit: substitute $x = ${p}$ into $${rightStr}$.`, answer: `${R}`, accept: [], hint: `$2(${p})${linTerm(b)}$.` },
      { instruction: "Do the two one-sided limits agree, so the two-sided limit exists? Answer 'yes' or 'no'.", answer: word, accept: jump ? ["dne"] : [], hint: `Compare ${L} and ${R}: a two-sided limit exists only when both sides match.` },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: jump
      ? `The left limit is ${L} and the right limit is ${R}; they disagree, so the two-sided limit does not exist.`
      : `Both one-sided limits equal ${L}, so the two-sided limit exists (and equals ${L}) even though $f(${p})$ itself is undefined.`,
  };
};

// --- limits-applied d3: simplify a difference quotient at a point ----------------
const LIMAPP3_CTX = [
  { obj: "A maglev sled's", u: "meters", tu: "seconds", ru: "m/s" },
  { obj: "A subway train's", u: "meters", tu: "seconds", ru: "m/s" },
  { obj: "A soapbox cart's", u: "feet", tu: "seconds", ru: "ft/s" },
];
fill["c1l-limapp-d3"] = (rng, idx) => {
  const ctx = rng.pick(LIMAPP3_CTX);
  const k = rng.pick([1, 2, 3]);
  let a = rng.int(2, 6);
  if (k === 1 && a === 3) a = 4; // seed: s(t) = t^2 over [3, 3+h]
  const v = 2 * a * k;
  const numer = `${v}h + ${co(k)}h^2`;
  const quot = `${v} + ${co(k)}h`;
  return {
    id: `gen.c1l-limapp-d3.${idx}`, generated: true, concepts: ["limits-applied"], difficulty: 3, context: "applied",
    prompt: `${ctx.obj} position is $s(t) = ${co(k)}t^2$ ${ctx.u} after $t$ ${ctx.tu}. The average velocity over $[${a}, ${a}+h]$ is $\\dfrac{${co(k)}(${a}+h)^2 - ${k * a * a}}{h}$. Simplify it and take the limit as $h \\to 0$ to find the instantaneous velocity at $t = ${a}$ (${ctx.ru}).`,
    steps: [
      { instruction: `Expand $${co(k)}(${a}+h)^2 - ${k * a * a}$.`, answer: numer, accept: [`${co(k)}h^2 + ${v}h`], hint: `$(${a}+h)^2 = ${a * a} + ${2 * a}h + h^2$; ${k === 1 ? `subtract ${a * a}` : `multiply by ${k}, then subtract ${k * a * a}`}.` },
      { instruction: "Divide by $h$ to simplify the average velocity.", answer: quot, accept: [`${co(k)}h + ${v}`], hint: `$\\frac{${numer}}{h} = ${quot}$.` },
      { instruction: "Take the limit as $h \\to 0$.", answer: `${v}`, accept: [], hint: `Substitute $h = 0$ into $${quot}$.` },
    ],
    finalAnswer: { value: `${v}`, unit: ctx.ru },
    solutionNarrative: `$\\dfrac{${co(k)}(${a}+h)^2 - ${k * a * a}}{h} = ${quot}$, whose limit as $h \\to 0$ is $${v}$ ${ctx.ru} — the instantaneous velocity at $t = ${a}$.`,
  };
};

// ============================================================================
// Topic: calculus-1.derivative-rates-of-change (wave 15)
// ============================================================================

// --- limit-definition d2: difference quotient for a monic quadratic --------------
const LDEF2_CTX = [
  { obj: "A ball rolls", what: "distance" },
  { obj: "A cart coasts", what: "distance" },
  { obj: "A robot vacuum drives", what: "distance" },
];
fill["c1l-limitdef-d2"] = (rng, idx) => {
  const kind = rng.pick(["abstract", "applied"]);
  const base = { id: `gen.c1l-limitdef-d2.${idx}`, generated: true, concepts: ["limit-definition"], difficulty: 2 };
  if (kind === "abstract") {
    const plus = rng.pick([true, false]);
    let b = rng.int(2, 9);
    if (!plus && b === 4) b = 5; // seed: x^2 - 4x
    const sgn = plus ? "+" : "-";
    const deriv = `2x ${sgn} ${b}`;
    return { ...base, context: "abstract",
      prompt: `Use the limit definition to find $f'(x)$ for $f(x) = x^2 ${sgn} ${b}x$.`,
      steps: [
        { instruction: "Simplify the difference quotient $\\dfrac{f(x+h) - f(x)}{h}$ until the $h$ cancels. What expression remains?", answer: `${deriv} + h`, accept: [`2x + h ${sgn} ${b}`], hint: `$f(x+h) = (x+h)^2 ${sgn} ${b}(x+h)$; subtract $f(x)$, expand, divide by $h$.` },
        { instruction: "Let $h \\to 0$. Write $f'(x)$.", answer: deriv, accept: [], hint: "The lone $h$ term vanishes." },
      ],
      finalAnswer: { value: deriv, unit: "" },
      solutionNarrative: `The quotient simplifies to $${deriv} + h$; as $h \\to 0$, $f'(x) = ${deriv}$.`,
    };
  }
  const ctx = rng.pick(LDEF2_CTX);
  let c = rng.int(2, 9);
  if (c === 3) c = 6; // seed: s(t) = t^2 + 3t
  return { ...base, context: "applied",
    prompt: `${ctx.obj} so its ${ctx.what} is $s(t) = t^2 + ${c}t$ feet after $t$ seconds. Use the limit definition to find the velocity function $s'(t)$ (in feet per second).`,
    steps: [
      { instruction: `Simplify the difference quotient for $s(t) = t^2 + ${c}t$ until $h$ cancels. What expression remains?`, answer: `2t + ${c} + h`, accept: [`2t + h + ${c}`], hint: `$s(t+h) = (t+h)^2 + ${c}(t+h)$.` },
      { instruction: "Let $h \\to 0$ to get the velocity function $s'(t)$.", answer: `2t + ${c}`, accept: [], hint: "The $h$ term vanishes." },
    ],
    finalAnswer: { value: `2t + ${c}`, unit: "feet per second" },
    solutionNarrative: `The quotient simplifies to $2t + ${c} + h$; as $h \\to 0$ the velocity is $s'(t) = 2t + ${c}$ ft/s.`,
  };
};

// --- limit-definition d3: non-monic quadratic, then a slope ----------------------
fill["c1l-limitdef-d3"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const plus = rng.pick([true, false]);
  let c = rng.int(2, 7);
  if (a === 2 && !plus && c === 3) c = 5; // seed: 2x^2 - 3x
  const x0 = rng.int(1, 3);
  const sgn = plus ? "+" : "-";
  const quot = `${2 * a}x ${sgn} ${c} + ${a}h`;
  const deriv = `${2 * a}x ${sgn} ${c}`;
  const m = 2 * a * x0 + (plus ? c : -c);
  return {
    id: `gen.c1l-limitdef-d3.${idx}`, generated: true, concepts: ["limit-definition"], difficulty: 3, context: "abstract",
    prompt: `Let $f(x) = ${a}x^2 ${sgn} ${c}x$. Use the limit definition to find $f'(x)$, then find the slope of the tangent at $x = ${x0}$.`,
    steps: [
      { instruction: "Simplify the difference quotient until $h$ cancels. What expression remains before the limit?", answer: quot, accept: [`${2 * a}x + ${a}h ${sgn} ${c}`], hint: `$f(x+h) = ${a}(x+h)^2 ${sgn} ${c}(x+h)$; subtract $f(x)$ and divide by $h$.` },
      { instruction: "Let $h \\to 0$. Write $f'(x)$.", answer: deriv, accept: [], hint: `The $${a}h$ term vanishes.` },
      { instruction: `Find the tangent slope $f'(${x0})$ (a number).`, answer: `${m}`, accept: [], hint: `Substitute $x = ${x0}$ into $${deriv}$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `The quotient simplifies to $${quot}$; as $h \\to 0$, $f'(x) = ${deriv}$, and $f'(${x0}) = ${2 * a}(${x0}) ${sgn} ${c} = ${m}$.`,
  };
};

// --- slope-and-tangent d3: full tangent line at a point ---------------------------
fill["c1l-slopetan-d3"] = (rng, idx) => {
  const x0 = rng.int(2, 5);
  const plus = rng.pick([true, false]);
  let b;
  if (plus) { b = rng.int(1, 6); }
  else { b = rng.int(1, 2 * x0 - 2); if (b === 2 && x0 === 4) b = 3; } // seed: x^2 - 2x at x = 4
  const sgn = plus ? "+" : "-";
  const m = plus ? 2 * x0 + b : 2 * x0 - b;
  const y0 = x0 * x0 + (plus ? b * x0 : -b * x0);
  const line = `y = ${m}x - ${x0 * x0}`;
  return {
    id: `gen.c1l-slopetan-d3.${idx}`, generated: true, concepts: ["slope-and-tangent"], difficulty: 3, context: "abstract",
    prompt: `For $f(x) = x^2 ${sgn} ${b}x$ (so $f'(x) = 2x ${sgn} ${b}$), find the tangent line at $x = ${x0}$.`,
    steps: [
      { instruction: `Find the slope $f'(${x0})$ (a number).`, answer: `${m}`, accept: [], hint: `Substitute into $2x ${sgn} ${b}$.` },
      { instruction: `Find $f(${x0})$ (a number).`, answer: `${y0}`, accept: [], hint: `$f(${x0}) = ${x0}^2 ${sgn} ${b}(${x0})$.` },
      { instruction: "Write the tangent line in the form $y = mx + b$.", answer: line, accept: [], hint: `Use $y - ${y0} = ${m}(x - ${x0})$ and simplify.` },
    ],
    finalAnswer: { value: line, unit: "" },
    solutionNarrative: `Slope $f'(${x0}) = ${m}$ and point $(${x0}, ${y0})$ give $y - ${y0} = ${m}(x - ${x0})$, i.e. $${line}$.`,
  };
};

// ============================================================================
// Topic: calculus-1.analyzing-functions (wave 15)
// ============================================================================

// --- concavity-inflection d3: concave-down interval, or an inflection day ---------
const CONCAV3_CTX = [
  { what: "The number of infected people in an outbreak", event: "New infections stop accelerating", tu: "days", tname: "day" },
  { what: "A viral video's total view count", event: "New views stop accelerating", tu: "days", tname: "day" },
  { what: "An app's total download count", event: "New downloads stop accelerating", tu: "weeks", tname: "week" },
];
fill["c1l-concav-d3"] = (rng, idx) => {
  const kind = rng.pick(["quartic", "cubic"]);
  const base = { id: `gen.c1l-concav-d3.${idx}`, generated: true, concepts: ["concavity-inflection"], difficulty: 3 };
  if (kind === "quartic") {
    const k = rng.int(2, 4); // k = 1 is the seed's x^4 - 6x^2
    return { ...base, context: "abstract",
      prompt: `For $f(x) = x^4 - ${6 * k * k}x^2$, find the interval where the graph is concave down. (The inflection points are at $x = -${k}$ and $x = ${k}$.)`,
      steps: [
        { instruction: "Find the second derivative $f''(x)$.", answer: `12x^2 - ${12 * k * k}`, accept: [`f''(x) = 12x^2 - ${12 * k * k}`], hint: `$f'(x) = 4x^3 - ${12 * k * k}x$, then differentiate again.` },
        { instruction: "Factor $f''(x)$.", answer: `12(x^2 - ${k * k})`, accept: [`12(x^2-${k * k})`, `12(x-${k})(x+${k})`], hint: "Pull out 12; the rest is a difference of squares." },
        { instruction: "Concave down means $f''(x) < 0$, which happens between the inflection points. Give the interval as a compound inequality.", answer: `-${k} < x < ${k}`, accept: [`-${k}<x<${k}`], hint: `$12(x^2 - ${k * k}) < 0$ when $x^2 < ${k * k}$.` },
      ],
      finalAnswer: { value: `-${k} < x < ${k}`, unit: "" },
      solutionNarrative: `$f''(x) = 12(x^2 - ${k * k})$ is negative when $x^2 < ${k * k}$, so the graph is concave down on $-${k} < x < ${k}$.`,
    };
  }
  const ctx = rng.pick(CONCAV3_CTX);
  const m = rng.pick([3, 4, 5, 7, 8]); // m = 6 is the seed's 18t^2
  const c = rng.int(2, 9);
  return { ...base, context: "applied",
    prompt: `${ctx.what} is modeled by $N(t) = -t^3 + ${3 * m}t^2 + ${c}t$ for $t$ in ${ctx.tu}. ${ctx.event} at the inflection point. On which ${ctx.tname} does that turning point occur?`,
    steps: [
      { instruction: "Find the first derivative $N'(t)$ (the growth rate).", answer: `N'(t) = -3t^2 + ${6 * m}t + ${c}`, accept: [`-3t^2 + ${6 * m}t + ${c}`, `-3t^2+${6 * m}t+${c}`], hint: "Differentiate term by term." },
      { instruction: "Find the second derivative $N''(t)$.", answer: `N''(t) = -6t + ${6 * m}`, accept: [`-6t + ${6 * m}`, `-6t+${6 * m}`, `${6 * m} - 6t`], hint: "Differentiate $N'(t)$." },
      { instruction: `Set $N''(t) = 0$ and solve for $t$ to find the inflection ${ctx.tname}.`, answer: `t = ${m}`, accept: [`${m}`], hint: `Solve $-6t + ${6 * m} = 0$.` },
    ],
    finalAnswer: { value: `${m}`, unit: ctx.tu },
    solutionNarrative: `$N''(t) = -6t + ${6 * m} = 0$ at $t = ${m}$. Before ${ctx.tname} ${m} the curve is concave up (accelerating); after, concave down — so ${ctx.tname} ${m} is the inflection point where growth stops accelerating.`,
  };
};

// ============================================================================
// Topic: calculus-1.optimization (wave 15)
// ============================================================================

// --- max-min-from-derivative d1: vertex of an applied quadratic -------------------
const MAXMIN1_MAX_CTX = [
  { what: "A toy rocket's altitude (in meters)", v: "t", tu: "seconds", goal: "Find the time at which it reaches its maximum altitude." },
  { what: "A flare's height (in meters)", v: "t", tu: "seconds", goal: "Find the time at which it reaches its maximum height." },
  { what: "A stunt bike's ramp height (in feet)", v: "t", tu: "seconds", goal: "Find the time at which the rider is highest." },
];
const MAXMIN1_MIN_CTX = [
  { what: "A car's fuel use (liters per 100 km) at cruise setting $x$", v: "x", tu: "", goal: "Find the setting $x$ that minimizes fuel use." },
  { what: "A server farm's power draw (kilowatts) at load setting $x$", v: "x", tu: "", goal: "Find the setting $x$ that minimizes power draw." },
  { what: "A kiln's defect score at temperature setting $x$", v: "x", tu: "", goal: "Find the setting $x$ that minimizes defects." },
];
fill["c1l-maxmin-d1"] = (rng, idx) => {
  const isMax = rng.pick([true, false]);
  const base = { id: `gen.c1l-maxmin-d1.${idx}`, generated: true, concepts: ["max-min-from-derivative"], difficulty: 1, context: "applied" };
  const m = rng.int(2, 7);
  if (isMax) {
    const ctx = rng.pick(MAXMIN1_MAX_CTX);
    let c = rng.int(2, 9);
    if (m === 3 && c === 5) c = 7; // seed: -t^2 + 6t + 5
    return { ...base,
      prompt: `${ctx.what} is modeled by $h(${ctx.v}) = -${ctx.v}^2 + ${2 * m}${ctx.v} + ${c}$${ctx.tu ? ` for $${ctx.v}$ in ${ctx.tu}` : ""}. ${ctx.goal}`,
      steps: [
        { instruction: `Differentiate $h(${ctx.v})$ with respect to $${ctx.v}$.`, answer: `-2${ctx.v} + ${2 * m}`, accept: [`${2 * m} - 2${ctx.v}`], hint: `Use the power rule term by term; the constant ${c} differentiates to 0.` },
        { instruction: `Set the derivative equal to 0 and solve for $${ctx.v}$.`, answer: `${ctx.v} = ${m}`, accept: [`${m}`], hint: `Solve $-2${ctx.v} + ${2 * m} = 0$.` },
      ],
      finalAnswer: { value: `${m}`, unit: ctx.tu },
      solutionNarrative: `$h'(${ctx.v}) = -2${ctx.v} + ${2 * m}$. Setting it to 0 gives $${ctx.v} = ${m}$${ctx.tu ? ` ${ctx.tu}` : ""}, the peak (the parabola opens downward, so it is a maximum).`,
    };
  }
  const ctx = rng.pick(MAXMIN1_MIN_CTX);
  let c = m * m + rng.int(2, 20);
  if (m === 4 && c === 30) c = 31; // seed: x^2 - 8x + 30
  return { ...base,
    prompt: `${ctx.what} is $C(x) = x^2 - ${2 * m}x + ${c}$. ${ctx.goal}`,
    steps: [
      { instruction: "Differentiate $C(x)$.", answer: `2x - ${2 * m}`, accept: [], hint: "Power rule term by term." },
      { instruction: "Set the derivative to 0 and solve for $x$.", answer: `x = ${m}`, accept: [`${m}`], hint: `Solve $2x - ${2 * m} = 0$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$C'(x) = 2x - ${2 * m}$. Setting it to 0 gives $x = ${m}$; since the parabola opens upward, this is the minimum.`,
  };
};

// --- max-min-from-derivative d2: maximum value, or a cubic's interior peak --------
const MAXMIN2_CTX = [
  { who: "A company's", scale: "hundreds of dollars", xdesc: "items (in thousands) sold" },
  { who: "A game studio's", scale: "thousands of dollars", xdesc: "ad slots (in hundreds) sold" },
  { who: "A farm stand's", scale: "tens of dollars", xdesc: "crates sold" },
];
fill["c1l-maxmin-d2"] = (rng, idx) => {
  const kind = rng.pick(["quadratic", "cubic"]);
  const base = { id: `gen.c1l-maxmin-d2.${idx}`, generated: true, concepts: ["max-min-from-derivative"], difficulty: 2, context: "applied" };
  if (kind === "quadratic") {
    const ctx = rng.pick(MAXMIN2_CTX);
    const m = rng.int(3, 9);
    let c = rng.int(2, Math.min(m * m - 1, 30));
    if (m === 5 && c === 9) c = 11; // seed: -x^2 + 10x - 9
    const maxV = m * m - c;
    return { ...base,
      prompt: `${ctx.who} daily profit (in ${ctx.scale}) is $P(x) = -x^2 + ${2 * m}x - ${c}$, where $x$ is the number of ${ctx.xdesc}. What is the maximum daily profit, in ${ctx.scale}?`,
      steps: [
        { instruction: "Differentiate $P(x)$.", answer: `-2x + ${2 * m}`, accept: [`${2 * m} - 2x`], hint: "Power rule term by term." },
        { instruction: "Set $P'(x) = 0$ and solve for $x$.", answer: `x = ${m}`, accept: [`${m}`], hint: `Solve $-2x + ${2 * m} = 0$.` },
        { instruction: `Substitute $x = ${m}$ into $P(x)$ to get the maximum profit.`, answer: `${maxV}`, accept: [], hint: `Compute $-(${m})^2 + ${2 * m}(${m}) - ${c} = -${m * m} + ${2 * m * m} - ${c}$.` },
      ],
      finalAnswer: { value: `${maxV}`, unit: ctx.scale },
      solutionNarrative: `$P'(x) = -2x + ${2 * m} = 0$ gives $x = ${m}$. Then $P(${m}) = -${m * m} + ${2 * m * m} - ${c} = ${maxV}$ ${ctx.scale}, the maximum since the parabola opens downward.`,
    };
  }
  const k = rng.pick([3, 4]); // k = 2 is the seed reservoir
  const C = rng.int(5, 30);
  const T = 2 * k;
  const ctx = rng.pick([
    { what: "A reservoir's water level (in meters)", tname: "hours" },
    { what: "A tidal basin's water level (in meters)", tname: "hours" },
    { what: "A storage battery's charge level (in percent of capacity, scaled)", tname: "hours" },
  ]);
  return { ...base,
    prompt: `${ctx.what} over part of a day is $L(t) = -\\frac{1}{3}t^3 + ${k}t^2 + ${C}$ for $0 \\le t \\le ${T + 1}$ ${ctx.tname}. Find the time $t$ at which the level is highest (a critical point inside the interval).`,
    steps: [
      { instruction: "Differentiate $L(t)$.", answer: `-t^2 + ${2 * k}t`, accept: [`${2 * k}t - t^2`], hint: "$\\frac{d}{dt}[-\\frac{1}{3}t^3] = -t^2$." },
      { instruction: "Set $L'(t) = 0$ and find the positive critical point.", answer: `t = ${T}`, accept: [`${T}`], hint: `$-t^2 + ${2 * k}t = -t(t - ${T}) = 0$, so $t = 0$ or $t = ${T}$; take the interior one.` },
    ],
    finalAnswer: { value: `${T}`, unit: ctx.tname },
    solutionNarrative: `$L'(t) = -t^2 + ${2 * k}t = -t(t - ${T})$, so critical points are $t = 0$ and $t = ${T}$. Since $L''(t) = -2t + ${2 * k}$ gives $L''(${T}) = -${2 * k} < 0$, $t = ${T}$ ${ctx.tname} is the maximum level.`,
  };
};

// ============================================================================
// Topic: calculus-1.related-rates (wave 15)
// ============================================================================

// --- filling-draining d2: constant cross-section cylinder, or a V = kh^2 trough ---
const FILL2_CYL_CTX = ["cylindrical tank", "cylindrical rain barrel", "cylindrical vat"];
const FILL2_TROUGH_CTX = ["trough", "drainage channel", "feed trough"];
fill["c1l-filling-d2"] = (rng, idx) => {
  const kind = rng.pick(["cylinder", "trough"]);
  const base = { id: `gen.c1l-filling-d2.${idx}`, generated: true, concepts: ["filling-draining"], difficulty: 2, context: "applied" };
  if (kind === "cylinder") {
    const what = rng.pick(FILL2_CYL_CTX);
    const r = rng.pick([2, 3, 4]);
    let dV = -rng.int(2, 8);
    if (r === 2 && dV === -3) dV = -5; // seed: radius 2, dV/dt = -3
    const A = r * r;
    const val = (dV / (PI * A)).toFixed(2);
    return { ...base,
      prompt: `A ${what} of radius ${r} ft is being drained at $\\frac{dV}{dt} = ${dV}$ ft³/min (negative because it's draining). How fast is the water level falling? ($V = \\pi r^2 h$ with $r = ${r}$ fixed.) Use $\\pi \\approx 3.14$ and round to 2 decimals.`,
      steps: [
        { instruction: `With $r = ${r}$ fixed, $V = \\pi(${A})h = ${A}\\pi h$. Differentiate in time. Write the related-rate equation.`, answer: `dV/dt = ${A}*pi*dh/dt`, accept: [`dV/dt=${A}*pi*dh/dt`, `dV/dt = ${A} pi dh/dt`], hint: `$\\frac{dV}{dt} = ${A}\\pi \\frac{dh}{dt}$ since the cross-section is constant.` },
        { instruction: `Substitute $\\frac{dV}{dt} = ${dV}$, $\\pi \\approx 3.14$ and solve for $\\frac{dh}{dt}$ in ft/min (2 decimals).`, answer: val, accept: [], hint: `$\\frac{dh}{dt} = \\frac{${dV}}{${A}(3.14)} = \\frac{${dV}}{${dec2(A * PI)}}$.` },
      ],
      finalAnswer: { value: val, unit: "ft/min" },
      solutionNarrative: `$\\frac{dV}{dt} = ${A}\\pi\\frac{dh}{dt} \\Rightarrow \\frac{dh}{dt} = \\frac{${dV}}{${dec2(A * PI)}} \\approx ${val}$ ft/min (falling).`,
    };
  }
  const what = rng.pick(FILL2_TROUGH_CTX);
  const k = rng.pick([2, 4, 5]); // k = 3 is the seed trough
  const dV = rng.int(2, 9);
  const h0 = rng.int(1, 3);
  const val = (dV / (2 * k * h0)).toFixed(2);
  return { ...base,
    prompt: `A ${what} has a triangular cross-section; its water volume is $V = ${k}h^2$ (cubic feet, $h$ in feet) when filled to depth $h$. Water enters at $\\frac{dV}{dt} = ${dV}$ ft³/min. How fast is the depth rising when $h = ${h0}$ ft? Round to 2 decimals.`,
    steps: [
      { instruction: `Differentiate $V = ${k}h^2$ in time. Write the related-rate equation.`, answer: `dV/dt = ${2 * k}*h*dh/dt`, accept: [`dV/dt=${2 * k}*h*dh/dt`, `dV/dt = ${2 * k} h dh/dt`], hint: `$\\frac{d}{dt}(${k}h^2) = ${2 * k}h\\frac{dh}{dt}$.` },
      { instruction: `Substitute $h = ${h0}$, $\\frac{dV}{dt} = ${dV}$ and solve for $\\frac{dh}{dt}$ in ft/min (2 decimals).`, answer: val, accept: [], hint: `$\\frac{dh}{dt} = \\frac{${dV}}{${2 * k}(${h0})} = \\frac{${dV}}{${2 * k * h0}}$.` },
    ],
    finalAnswer: { value: val, unit: "ft/min" },
    solutionNarrative: `$\\frac{dV}{dt} = ${2 * k}h\\frac{dh}{dt} \\Rightarrow \\frac{dh}{dt} = \\frac{${dV}}{${2 * k * h0}} \\approx ${val}$ ft/min.`,
  };
};

// --- rates-in-motion d2: closing cars, or a rising balloon on a 3-4-5 sight line --
// Each entry: scaled 3-4-5-style triple plus a speed factor keeping speeds realistic.
// ([3,4,5], sf 20) would clone the seed's 0.3/0.4 km at 60/80 km/h.
const MOT2_CARS = [
  { a: 3, b: 4, c: 5, sf: 10 }, { a: 3, b: 4, c: 5, sf: 15 }, { a: 3, b: 4, c: 5, sf: 25 }, { a: 3, b: 4, c: 5, sf: 30 },
  { a: 6, b: 8, c: 10, sf: 10 }, { a: 6, b: 8, c: 10, sf: 12 },
  { a: 5, b: 12, c: 13, sf: 5 }, { a: 5, b: 12, c: 13, sf: 10 },
];
const MOT2_BALLOON_CTX = [
  { obj: "A hot-air balloon rises straight up", watcher: "A camera crew stands" },
  { obj: "A weather balloon rises straight up", watcher: "A technician stands" },
  { obj: "A drone climbs straight up", watcher: "Its pilot stands" },
];
fill["c1l-motion-d2"] = (rng, idx) => {
  const kind = rng.pick(["cars", "balloon"]);
  const base = { id: `gen.c1l-motion-d2.${idx}`, generated: true, concepts: ["rates-in-motion"], difficulty: 2, context: "applied" };
  if (kind === "cars") {
    const { a, b, c, sf } = rng.pick(MOT2_CARS);
    const y = a / 10, x = b / 10, z = c / 10;
    const vy = a * sf, vx = b * sf, ans = c * sf;
    return { ...base,
      prompt: `Two cars approach the same intersection on perpendicular roads. Car A is ${y} km north of it moving south at ${vy} km/h; car B is ${x} km east moving west at ${vx} km/h. How fast is the distance between them changing right now? (Both are approaching, so expect a negative rate.)`,
      steps: [
        { instruction: `Find the current separation $z$ from $x = ${x}$, $y = ${y}$ via $x^2 + y^2 = z^2$.`, answer: `${z}`, accept: [`z = ${z}`, `z=${z}`], hint: `$\\sqrt{${x}^2 + ${y}^2} = \\sqrt{${dec2(x * x + y * y)}}$.` },
        { instruction: "Differentiate $x^2 + y^2 = z^2$ in time. Write the related-rate equation.", answer: "2x*dx/dt + 2y*dy/dt = 2z*dz/dt", accept: ["x*dx/dt + y*dy/dt = z*dz/dt", "2x*dx/dt+2y*dy/dt=2z*dz/dt"], hint: "$2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 2z\\frac{dz}{dt}$. Approaching means $\\frac{dx}{dt}$, $\\frac{dy}{dt}$ are negative." },
        { instruction: `Substitute $x=${x}$, $\\frac{dx}{dt}=-${vx}$, $y=${y}$, $\\frac{dy}{dt}=-${vy}$, $z=${z}$ and solve for $\\frac{dz}{dt}$ in km/h.`, answer: `${-ans}`, accept: [`${-ans}.0`, `dz/dt = ${-ans}`], hint: `$\\frac{dz}{dt} = \\frac{${x}(-${vx}) + ${y}(-${vy})}{${z}} = \\frac{${dec2(-x * vx - y * vy)}}{${z}}$.` },
      ],
      finalAnswer: { value: `${-ans}`, unit: "km/h" },
      solutionNarrative: `$\\frac{dz}{dt} = \\frac{x\\frac{dx}{dt}+y\\frac{dy}{dt}}{z} = \\frac{${dec2(-x * vx - y * vy)}}{${z}} = ${-ans}$ km/h (closing).`,
    };
  }
  const ctx = rng.pick(MOT2_BALLOON_CTX);
  const g = rng.pick([10, 20, 30]);
  const dy = rng.pick([5, 10, 15]);
  const d = 3 * g, yy = 4 * g, z = 5 * g;
  const ans = (4 * dy) / 5; // integer since dy is a multiple of 5
  return { ...base,
    prompt: `${ctx.obj} at $\\frac{dy}{dt} = ${dy}$ ft/s. ${ctx.watcher} ${d} ft from the launch point. When the balloon is ${yy} ft high, how fast is the line-of-sight distance $z$ increasing? ($z^2 = ${d}^2 + y^2$.)`,
    steps: [
      { instruction: `Find the current sight-line distance $z$ when $y = ${yy}$.`, answer: `${z}`, accept: [`z = ${z}`, `z=${z}`], hint: `$\\sqrt{${d}^2 + ${yy}^2} = \\sqrt{${d * d + yy * yy}}$ — a ${3 * g}-${4 * g}-${5 * g} right triangle.` },
      { instruction: `Differentiate $z^2 = ${d * d} + y^2$ in time. Write the related-rate equation.`, answer: "2z*dz/dt = 2y*dy/dt", accept: ["z*dz/dt = y*dy/dt", "2z*dz/dt=2y*dy/dt"], hint: `The ${d} ft ground distance is constant: $2z\\frac{dz}{dt} = 2y\\frac{dy}{dt}$.` },
      { instruction: `Substitute $y = ${yy}$, $z = ${z}$, $\\frac{dy}{dt} = ${dy}$ and solve for $\\frac{dz}{dt}$ in ft/s.`, answer: `${ans}`, accept: [`${ans}.0`, `dz/dt = ${ans}`], hint: `$\\frac{dz}{dt} = \\frac{y}{z}\\frac{dy}{dt} = \\frac{${yy}}{${z}}(${dy}) = \\frac{4}{5}(${dy})$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "ft/s" },
    solutionNarrative: `$\\frac{dz}{dt} = \\frac{y}{z}\\frac{dy}{dt} = \\frac{${yy}}{${z}}(${dy}) = ${ans}$ ft/s — the sight line lengthens at $\\frac{4}{5}$ of the climb rate.`,
  };
};
