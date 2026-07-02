// gen-calc1-fill.js
// Self-contained generator pack for two Calculus 1 topics:
//   - calculus-1.implicit-differentiation      (templates prefixed c1i-)
//   - calculus-1.transcendental-derivatives    (templates prefixed c1t-)
// Gives every key concept a generator at difficulty 1, 2, and 3. Exports a
// `fill` map of template-name -> generator fn matching the shape used by
// js/generator.js (same pattern as gen-de-fill.js / gen-linalg-fill.js).
// Deterministic from the passed rng only; no imports from generator.js.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string, sign carried on the numerator: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// "3y^2" style power piece with the exponent-1 special case: powY(1) -> "y".
const powY = (p) => (p === 1 ? "y" : `y^${p}`);
const E2 = 2.718; // convention: students are told e ≈ 2.718 so rounding agrees

export const fill = {};

// ============================================================================
// Topic A: calculus-1.implicit-differentiation (c1i-)
// ============================================================================

// --- differentiate-term-by-term ---------------------------------------------

// d1: chain-rule factor on a lone power of y.
fill["c1i-diff-term-d1"] = (rng, idx) => {
  const n = rng.int(2, 5);
  const body = powY(n - 1);
  const ans = `${n}${body}y'`;
  return {
    id: `gen.c1i-diff-term-d1.${idx}`, generated: true, concepts: ["differentiate-term-by-term"], difficulty: 1, context: "abstract",
    prompt: `Suppose $y$ is a function of $x$. Differentiate $y^{${n}}$ with respect to $x$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: `Apply the chain rule: power rule on $y^{${n}}$, times the inner derivative $y'$. (Type it like ${ans}.)`, answer: ans, accept: [`${n}${body}*y'`, `${n}${body} y'`, `${n}${body}dy/dx`, `${n}${body}(dy/dx)`], hint: `Bring down the ${n}, lower the power to ${n - 1}, then multiply by $y'$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Because $y$ depends on $x$, the chain rule gives $\\frac{d}{dx}y^{${n}} = ${n}${body === "y" ? "y" : `y^{${n - 1}}`}\\,y'$.`,
  };
};

// d2: differentiate x^2 + k*y^p = c term by term.
fill["c1i-diff-term-d2"] = (rng, idx) => {
  const k = rng.int(1, 4);            // coefficient on the y-power
  const p = rng.pick([2, 3]);         // y-power
  const c = rng.int(5, 40);
  const coef = k * p;                 // chain-rule coefficient
  const body = powY(p - 1);
  const lhsCurve = `x^2 ${k === 1 ? "+" : `+ ${k}`}y^${p}`;
  const dl = `2x + ${coef}${body}y'`;
  const eq = `${dl} = 0`;
  return {
    id: `gen.c1i-diff-term-d2.${idx}`, generated: true, concepts: ["differentiate-term-by-term"], difficulty: 2, context: "abstract",
    prompt: `Differentiate both sides of $${lhsCurve} = ${c}$ with respect to $x$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: `Differentiate the left side term by term (the $y$-term carries a $y'$).`, answer: dl, accept: [`2x+${coef}${body}*y'`, `${coef}${body}y'+2x`, `2x+${coef}${body}dy/dx`, `2x+${coef}${body}(dy/dx)`], hint: `$x^2 \\to 2x$ and $${k === 1 ? "" : k}y^{${p}} \\to ${coef}${body === "y" ? "y" : `y^{${p - 1}}`}\\,y'$ by the chain rule.` },
      { instruction: `Write the full differentiated equation (the right side is the constant ${c}).`, answer: eq, accept: [`2x+${coef}${body}*y'=0`, `${coef}${body}y'+2x=0`, `2x+${coef}${body}dy/dx=0`], hint: "The derivative of a constant is 0." },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `Term by term: $2x + ${coef}${body === "y" ? "y" : `y^{${p - 1}}`}\\,y' = 0$; the constant ${c} differentiates to 0.`,
  };
};

// d3: a product term m*x*y plus y^2 — product rule inside an implicit equation.
fill["c1i-diff-term-d3"] = (rng, idx) => {
  const m = rng.int(2, 5);
  const c = rng.int(6, 48);
  const dProd = `${m}y + ${m}xy'`;
  const eq = `${m}y + ${m}xy' + 2yy' = 0`;
  return {
    id: `gen.c1i-diff-term-d3.${idx}`, generated: true, concepts: ["differentiate-term-by-term"], difficulty: 3, context: "abstract",
    prompt: `Differentiate both sides of $${m}xy + y^2 = ${c}$ with respect to $x$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: `Differentiate the product term $${m}xy$ with the product rule.`, answer: dProd, accept: [`${m}y+${m}x*y'`, `${m}xy'+${m}y`, `${m}y+${m}xdy/dx`, `${m}y + ${m}x y'`], hint: `$${m}\\,\\frac{d}{dx}(xy) = ${m}(y + x\\,y')$.` },
      { instruction: "Differentiate the $y^2$ term.", answer: "2yy'", accept: ["2y*y'", "2y y'", "2ydy/dx", "2y(dy/dx)"], hint: "Chain rule: $2y\\,y'$." },
      { instruction: "Write the full differentiated equation.", answer: eq, accept: [`${m}y+${m}x*y'+2y*y'=0`, `${m}y+${m}xy'+2yy'=0`, `${m}xy'+2yy'+${m}y=0`], hint: `Add both derivatives; the constant ${c} goes to 0.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `Product rule on $${m}xy$ gives $${m}y + ${m}x\\,y'$; the chain rule on $y^2$ gives $2y\\,y'$; the constant dies: $${m}y + ${m}x\\,y' + 2y\\,y' = 0$.`,
  };
};

// --- solve-for-dydx ----------------------------------------------------------

// d1: from a*x + b*y*y' = 0, isolate y' (answer is a rational in x, y — grades).
fill["c1i-solve-dydx-d1"] = (rng, idx) => {
  const b = rng.pick([2, 4, 6]);
  const m = rng.int(1, 3);
  const a = b * m;
  const slope = m === 1 ? "-x/y" : `-${m}x/y`;
  return {
    id: `gen.c1i-solve-dydx-d1.${idx}`, generated: true, concepts: ["solve-for-dydx"], difficulty: 1, context: "abstract",
    prompt: `Implicit differentiation produced $${a}x + ${b}y\\,y' = 0$. Solve for $y' = \\frac{dy}{dx}$.`,
    steps: [
      { instruction: "Move the $x$-term to the right side.", answer: `${b}yy' = -${a}x`, accept: [`${b}y*y'=-${a}x`, `-${a}x=${b}yy'`, `${b}ydy/dx=-${a}x`], hint: `Subtract $${a}x$ from both sides.` },
      { instruction: `Divide to isolate $y'$. Give the simplified fraction in $x$ and $y$.`, answer: slope, accept: [`(-${a}x)/(${b}y)`, `-${a}x/(${b}y)`, `-(${a}x)/(${b}y)`], hint: `Divide both sides by $${b}y$ and reduce.` },
    ],
    finalAnswer: { value: slope, unit: "" },
    solutionNarrative: `$${b}y\\,y' = -${a}x$, so $\\frac{dy}{dx} = \\frac{-${a}x}{${b}y} = ${m === 1 ? "-\\frac{x}{y}" : `-\\frac{${m}x}{y}`}$.`,
  };
};

// d2: ellipse x^2 + k*y^2 = c -> dy/dx = -x/(k y).
fill["c1i-solve-dydx-d2"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const c = rng.int(8, 50);
  const slope = `-x/(${k}y)`;
  return {
    id: `gen.c1i-solve-dydx-d2.${idx}`, generated: true, concepts: ["solve-for-dydx"], difficulty: 2, context: "abstract",
    prompt: `Find $\\frac{dy}{dx}$ for the ellipse $x^2 + ${k}y^2 = ${c}$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: "Differentiate both sides with respect to $x$.", answer: `2x + ${2 * k}yy' = 0`, accept: [`2x+${2 * k}y*y'=0`, `${2 * k}yy'+2x=0`, `2x+${2 * k}ydy/dx=0`], hint: `$${k}y^2 \\to ${2 * k}y\\,y'$.` },
      { instruction: "Solve for $y'$ and reduce. Give a fraction in $x$ and $y$.", answer: slope, accept: [`(-x)/(${k}y)`, `-(x/(${k}y))`, `-2x/(${2 * k}y)`], hint: `$${2 * k}y\\,y' = -2x$; divide, then cancel the 2.` },
    ],
    finalAnswer: { value: slope, unit: "" },
    solutionNarrative: `Differentiate: $2x + ${2 * k}y\\,y' = 0$, so $\\frac{dy}{dx} = \\frac{-2x}{${2 * k}y} = -\\frac{x}{${k}y}$.`,
  };
};

// d3: x^2 + m*x*y = c -> y' = -(2x + m y)/(m x), a rational with polynomial numerator.
fill["c1i-solve-dydx-d3"] = (rng, idx) => {
  const m = rng.int(1, 3);
  const c = rng.int(5, 30);
  const mS = m === 1 ? "" : `${m}`;
  const slope = `(-2x - ${mS}y)/(${mS}x)`;
  return {
    id: `gen.c1i-solve-dydx-d3.${idx}`, generated: true, concepts: ["solve-for-dydx"], difficulty: 3, context: "abstract",
    prompt: `Find $\\frac{dy}{dx}$ for the curve $x^2 + ${mS}xy = ${c}$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: "Differentiate both sides (the mixed term needs the product rule).", answer: `2x + ${mS}y + ${mS}xy' = 0`, accept: [`2x+${mS}y+${mS}x*y'=0`, `${mS}xy'+2x+${mS}y=0`, `2x+${mS}y+${mS}xdy/dx=0`], hint: `$\\frac{d}{dx}(${mS}xy) = ${mS}y + ${mS}x\\,y'$.` },
      { instruction: "Isolate the $y'$ term.", answer: `${mS}xy' = -2x - ${mS}y`, accept: [`${mS}x*y'=-2x-${mS}y`, `-2x-${mS}y=${mS}xy'`, `${mS}xy'=-(2x+${mS}y)`], hint: `Move $2x + ${mS}y$ to the right side.` },
      { instruction: "Divide to finish. Give a single fraction in $x$ and $y$.", answer: slope, accept: [`-(2x+${mS}y)/(${mS}x)`, `-(2x + ${mS}y)/(${mS}x)`], hint: `Divide both sides by $${mS}x$.` },
    ],
    finalAnswer: { value: slope, unit: "" },
    solutionNarrative: `Differentiate: $2x + ${mS}y + ${mS}x\\,y' = 0$. Isolate: $${mS}x\\,y' = -2x - ${mS}y$, so $\\frac{dy}{dx} = \\frac{-2x - ${mS}y}{${mS}x}$.`,
  };
};

// --- slope-at-point ----------------------------------------------------------

const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]];

// d1: circle x^2 + y^2 = r^2 at a Pythagorean point; dy/dx = -x/y given.
fill["c1i-slope-d1"] = (rng, idx) => {
  const [x0, y0, r] = rng.pick(TRIPLES);
  const ans = frac(-x0, y0);
  return {
    id: `gen.c1i-slope-d1.${idx}`, generated: true, concepts: ["slope-at-point"], difficulty: 1, context: "applied",
    prompt: `A circular track satisfies $x^2 + y^2 = ${r * r}$ (meters), and implicit differentiation gives $\\frac{dy}{dx} = -\\frac{x}{y}$. What is the slope of the track at the point $(${x0}, ${y0})$?`,
    steps: [
      { instruction: `Substitute $x = ${x0}$, $y = ${y0}$ into $-\\frac{x}{y}$. Give a fraction or decimal.`, answer: ans, accept: [`-${x0}/${y0}`, `(-${x0})/${y0}`], hint: "Both coordinates go into the slope formula." },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Slope $= -\\frac{${x0}}{${y0}} = ${ans.includes("/") ? `-\\frac{${ans.slice(1).split("/")[0]}}{${ans.split("/")[1]}}` : ans}$ at $(${x0}, ${y0})$.`,
  };
};

// d2: ellipse x^2 + k y^2 = c at a chosen on-curve point.
fill["c1i-slope-d2"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const x0 = rng.int(1, 4), y0 = rng.int(1, 3);
  const c = x0 * x0 + k * y0 * y0;
  const ans = frac(-x0, k * y0);
  return {
    id: `gen.c1i-slope-d2.${idx}`, generated: true, concepts: ["slope-at-point"], difficulty: 2, context: "abstract",
    prompt: `Find the slope of the ellipse $x^2 + ${k}y^2 = ${c}$ at the point $(${x0}, ${y0})$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: "Differentiate both sides with respect to $x$.", answer: `2x + ${2 * k}yy' = 0`, accept: [`2x+${2 * k}y*y'=0`, `${2 * k}yy'+2x=0`, `2x+${2 * k}ydy/dx=0`], hint: `$${k}y^2 \\to ${2 * k}y\\,y'$.` },
      { instruction: "Solve for $y'$ as a reduced fraction in $x$ and $y$.", answer: `-x/(${k}y)`, accept: [`(-x)/(${k}y)`, `-2x/(${2 * k}y)`], hint: `Divide by $${2 * k}y$ and cancel the 2.` },
      { instruction: `Evaluate the slope at $(${x0}, ${y0})$. Give a fraction or decimal.`, answer: ans, accept: [`-${x0}/(${k}*${y0})`, `-${x0}/${k * y0}`], hint: `$-\\frac{${x0}}{${k} \\cdot ${y0}}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$y' = -\\frac{x}{${k}y}$; at $(${x0}, ${y0})$ the slope is $-\\frac{${x0}}{${k * y0}}$${frac(-x0, k * y0) !== `-${x0}/${k * y0}` ? ` $= ${ans}$` : ""}.`,
  };
};

// d3: cubic curve x^3 + y^3 = c at an on-curve point; slope = -x^2/y^2.
fill["c1i-slope-d3"] = (rng, idx) => {
  const x0 = rng.int(1, 3), y0 = rng.int(1, 4);
  const c = x0 ** 3 + y0 ** 3;
  const ans = frac(-x0 * x0, y0 * y0);
  return {
    id: `gen.c1i-slope-d3.${idx}`, generated: true, concepts: ["slope-at-point"], difficulty: 3, context: "abstract",
    prompt: `The curve $x^3 + y^3 = ${c}$ passes through $(${x0}, ${y0})$. Find the slope of the curve at that point. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: "Differentiate both sides with respect to $x$.", answer: "3x^2 + 3y^2y' = 0", accept: ["3x^2+3y^2*y'=0", "3y^2y'+3x^2=0", "3x^2+3y^2dy/dx=0"], hint: "$y^3 \\to 3y^2\\,y'$ by the chain rule." },
      { instruction: "Solve for $y'$ as a fraction in $x$ and $y$.", answer: "-x^2/y^2", accept: ["(-x^2)/y^2", "-(x^2/y^2)", "-3x^2/(3y^2)"], hint: "Divide by $3y^2$ and cancel the 3s." },
      { instruction: `Evaluate at $(${x0}, ${y0})$. Give a fraction or decimal.`, answer: ans, accept: [`-${x0 * x0}/${y0 * y0}`, `-${x0}^2/${y0}^2`], hint: `$-\\frac{${x0}^2}{${y0}^2} = -\\frac{${x0 * x0}}{${y0 * y0}}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$y' = -\\frac{x^2}{y^2}$; at $(${x0}, ${y0})$ that is $-\\frac{${x0 * x0}}{${y0 * y0}}$.`,
  };
};

// --- tangent-lines-implicit --------------------------------------------------

// d1: circle x^2 + y^2 = 2a^2 at (a, a): slope -1, tangent y = -x + 2a.
fill["c1i-tangent-d1"] = (rng, idx) => {
  const a = rng.int(1, 5);
  const line = `y = -x + ${2 * a}`;
  return {
    id: `gen.c1i-tangent-d1.${idx}`, generated: true, concepts: ["tangent-lines-implicit"], difficulty: 1, context: "abstract",
    prompt: `Find the tangent line to the circle $x^2 + y^2 = ${2 * a * a}$ at the point $(${a}, ${a})$. (The circle's implicit derivative is $\\frac{dy}{dx} = -\\frac{x}{y}$.)`,
    steps: [
      { instruction: `Find the slope at $(${a}, ${a})$.`, answer: "-1", accept: [`-${a}/${a}`], hint: `$-\\frac{${a}}{${a}}$.` },
      { instruction: "Write the tangent line in the form $y = mx + b$.", answer: line, accept: [`y=-x+${2 * a}`, `y=${2 * a}-x`], hint: `Point–slope: $y - ${a} = -1(x - ${a})$, then simplify.` },
    ],
    finalAnswer: { value: line, unit: "" },
    solutionNarrative: `Slope $= -\\frac{${a}}{${a}} = -1$; then $y - ${a} = -(x - ${a})$ gives $y = -x + ${2 * a}$.`,
  };
};

// d2: hyperbola xy = ab at (a, b): slope -b/a, tangent y = -(b/a)x + 2b.
fill["c1i-tangent-d2"] = (rng, idx) => {
  const a = rng.int(2, 5);
  let b = rng.int(2, 5);
  if (b === a) b = a + 1; // keep the slope a genuine fraction or distinct integer
  const g = gcd(a, b), p = b / g, q = a / g;
  const slope = frac(-b, a);
  const mx = q === 1 ? (p === 1 ? "-x" : `-${p}x`) : `-${p}x/${q}`;
  const line = `y = ${mx} + ${2 * b}`;
  return {
    id: `gen.c1i-tangent-d2.${idx}`, generated: true, concepts: ["tangent-lines-implicit"], difficulty: 2, context: "abstract",
    prompt: `Find the tangent line to the hyperbola $xy = ${a * b}$ at the point $(${a}, ${b})$. (Use $y'$ for $\\frac{dy}{dx}$.)`,
    steps: [
      { instruction: "Differentiate $xy = " + (a * b) + "$ and solve for $y'$.", answer: "-y/x", accept: ["(-y)/x", "-(y/x)"], hint: "$y + x\\,y' = 0$, so $y' = -\\frac{y}{x}$." },
      { instruction: `Find the slope at $(${a}, ${b})$. Give a fraction or decimal.`, answer: slope, accept: [`-${b}/${a}`], hint: `$-\\frac{${b}}{${a}}$.` },
      { instruction: "Write the tangent line in the form $y = mx + b$.", answer: line, accept: [`y=${mx}+${2 * b}`, `y=${2 * b}${mx.startsWith("-") ? mx : `+${mx}`}`], hint: `Point–slope: $y - ${b} = ${slope}(x - ${a})$; the intercept works out to $${2 * b}$.` },
    ],
    finalAnswer: { value: line, unit: "" },
    solutionNarrative: `$y' = -\\frac{y}{x}$, which is $-\\frac{${b}}{${a}}$ at $(${a}, ${b})$. Point–slope gives $y = ${mx} + ${2 * b}$ (a tangent to $xy = c$ always doubles the intercept).`,
  };
};

// d3: applied — release along the tangent to a circle at a Pythagorean point.
fill["c1i-tangent-d3"] = (rng, idx) => {
  const [x0, y0, r] = rng.pick(TRIPLES);
  const g = gcd(x0, y0), p = x0 / g, q = y0 / g;
  const slope = frac(-x0, y0);
  const bFrac = frac(r * r, y0);
  const mx = q === 1 ? (p === 1 ? "-x" : `-${p}x`) : `-${p}x/${q}`;
  const line = `y = ${mx} + ${bFrac}`;
  const ctx = rng.pick([
    { who: "A discus thrower releases the discus", track: "spins it along the circle" },
    { who: "A cart releases a package", track: "rounds the circular track" },
    { who: "A spark flies off a grinding wheel", track: "the wheel's rim is the circle" },
  ]);
  return {
    id: `gen.c1i-tangent-d3.${idx}`, generated: true, concepts: ["tangent-lines-implicit"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} at the point $(${x0}, ${y0})$ — ${ctx.track} $x^2 + y^2 = ${r * r}$ (meters) — and it travels along the tangent line. Find that line. (The circle's implicit derivative is $\\frac{dy}{dx} = -\\frac{x}{y}$.)`,
    steps: [
      { instruction: `Find the slope at $(${x0}, ${y0})$. Give a reduced fraction or decimal.`, answer: slope, accept: [`-${x0}/${y0}`], hint: `$-\\frac{${x0}}{${y0}}$, then reduce.` },
      { instruction: "Write the tangent line in the form $y = mx + b$.", answer: line, accept: [`y=${mx}+${bFrac}`, `y = ${mx} + ${r * r}/${y0}`], hint: `Point–slope: $y - ${y0} = ${slope}(x - ${x0})$; the intercept is $\\frac{${r * r}}{${y0}}$ (i.e. $r^2/y_0$).` },
    ],
    finalAnswer: { value: line, unit: "" },
    solutionNarrative: `Slope $= -\\frac{${x0}}{${y0}} = ${slope}$. Point–slope: $y - ${y0} = ${slope}(x - ${x0})$, so $y = ${mx} + ${bFrac}$ — the straight-line flight path.`,
  };
};

// ============================================================================
// Topic B: calculus-1.transcendental-derivatives (c1t-)
// ============================================================================

// --- exp-derivatives ---------------------------------------------------------

// d1: d/dx e^(kx) = k e^(kx), exact-string answer with accept variants.
fill["c1t-exp-d1"] = (rng, idx) => {
  const k = rng.int(2, 7);
  const ans = `${k}e^(${k}x)`;
  return {
    id: `gen.c1t-exp-d1.${idx}`, generated: true, concepts: ["exp-derivatives"], difficulty: 1, context: "abstract",
    prompt: `Differentiate $f(x) = e^{${k}x}$.`,
    steps: [
      { instruction: `Apply the chain rule: the exponential stays, times the inner derivative. (Type it like ${ans}.)`, answer: ans, accept: [`${k}e^{${k}x}`, `${k}*e^(${k}x)`, `${k}e^${k}x`], hint: `$\\frac{d}{dx}e^{kx} = k\\,e^{kx}$ with $k = ${k}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `The inside $${k}x$ has derivative ${k}, so $f'(x) = ${k}e^{${k}x}$.`,
  };
};

// d2: f = a e^(kx): derivative string, then f'(0) numeric.
fill["c1t-exp-d2"] = (rng, idx) => {
  const a = rng.int(2, 6), k = rng.int(2, 5);
  const ak = a * k;
  const ans = `${ak}e^(${k}x)`;
  return {
    id: `gen.c1t-exp-d2.${idx}`, generated: true, concepts: ["exp-derivatives"], difficulty: 2, context: "abstract",
    prompt: `Differentiate $f(x) = ${a}e^{${k}x}$, then evaluate $f'(0)$.`,
    steps: [
      { instruction: `Find $f'(x)$. (Type it like ${ans}.)`, answer: ans, accept: [`${ak}e^{${k}x}`, `${ak}*e^(${k}x)`, `${ak}e^${k}x`], hint: `The constant ${a} rides along; the chain rule contributes ${k}: $${a} \\cdot ${k} = ${ak}$.` },
      { instruction: "Evaluate $f'(0)$. Give a number.", answer: `${ak}`, accept: [`${ak}e^0`], hint: `$e^0 = 1$, so $f'(0) = ${ak} \\cdot 1$.` },
    ],
    finalAnswer: { value: `${ak}`, unit: "" },
    solutionNarrative: `$f'(x) = ${a} \\cdot ${k}e^{${k}x} = ${ak}e^{${k}x}$; at $x = 0$, $e^0 = 1$, so $f'(0) = ${ak}$.`,
  };
};

// d3: exponential decay a e^(-kt): derivative string with sign, initial rate.
fill["c1t-exp-d3"] = (rng, idx) => {
  const a = rng.int(2, 9), k = rng.int(2, 6);
  const ak = a * k;
  const ans = `-${ak}e^(-${k}t)`;
  return {
    id: `gen.c1t-exp-d3.${idx}`, generated: true, concepts: ["exp-derivatives"], difficulty: 3, context: "applied",
    prompt: `A radioactive sample has mass $m(t) = ${a}e^{-${k}t}$ grams after $t$ hours. Find the rate of change $m'(t)$, then the initial rate $m'(0)$.`,
    steps: [
      { instruction: `Differentiate $m(t)$ — the inner derivative is $-${k}$, so watch the sign. (Type it like ${ans}.)`, answer: ans, accept: [`-${ak}e^{-${k}t}`, `-${ak}*e^(-${k}t)`, `-${ak}e^-${k}t`], hint: `$\\frac{d}{dt}e^{-${k}t} = -${k}e^{-${k}t}$, and $${a} \\cdot (-${k}) = -${ak}$.` },
      { instruction: "Evaluate $m'(0)$. Give a number (grams per hour).", answer: `-${ak}`, accept: [`-${ak}e^0`], hint: `$e^0 = 1$, so $m'(0) = -${ak}$ — negative because the mass is shrinking.` },
    ],
    finalAnswer: { value: `-${ak}`, unit: "grams per hour" },
    solutionNarrative: `$m'(t) = -${ak}e^{-${k}t}$; at $t = 0$ the sample loses ${ak} grams per hour.`,
  };
};

// --- log-derivatives ---------------------------------------------------------

// d1: d/dx ln(kx) = 1/x — the constant cancels; rational answers grade.
fill["c1t-log-d1"] = (rng, idx) => {
  const k = rng.int(2, 9);
  return {
    id: `gen.c1t-log-d1.${idx}`, generated: true, concepts: ["log-derivatives"], difficulty: 1, context: "abstract",
    prompt: `Differentiate $f(x) = \\ln(${k}x)$ and simplify.`,
    steps: [
      { instruction: `Apply $\\frac{d}{dx}\\ln(u) = \\frac{u'}{u}$ with $u = ${k}x$.`, answer: `${k}/(${k}x)`, accept: ["1/x", `${k}/${k}x`], hint: `Derivative of the inside (${k}) over the inside ($${k}x$).` },
      { instruction: "Simplify the fraction.", answer: "1/x", accept: [`${k}/(${k}x)`], hint: `The ${k}s cancel — $\\ln(kx)$ always has derivative $\\frac{1}{x}$.` },
    ],
    finalAnswer: { value: "1/x", unit: "" },
    solutionNarrative: `$\\frac{u'}{u} = \\frac{${k}}{${k}x} = \\frac{1}{x}$ — the inner constant cancels completely.`,
  };
};

// d2: d/dx ln(x^2 + a) = 2x/(x^2 + a), a rational expression that grades.
fill["c1t-log-d2"] = (rng, idx) => {
  const a = rng.int(1, 9);
  const ans = `2x/(x^2+${a})`;
  return {
    id: `gen.c1t-log-d2.${idx}`, generated: true, concepts: ["log-derivatives"], difficulty: 2, context: "abstract",
    prompt: `Differentiate $f(x) = \\ln(x^2 + ${a})$.`,
    steps: [
      { instruction: `Apply $\\frac{u'}{u}$ with $u = x^2 + ${a}$. Give a single fraction.`, answer: ans, accept: [`(2x)/(x^2+${a})`, `2x/(${a}+x^2)`], hint: "The inside's derivative $2x$ goes on top; the whole inside goes on the bottom." },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$f'(x) = \\frac{2x}{x^2 + ${a}}$ by the chain rule for logs.`,
  };
};

// d3: f = ln(x^2 + b), then evaluate f'(x0) to a clean fraction.
fill["c1t-log-d3"] = (rng, idx) => {
  const b = rng.int(1, 5), x0 = rng.int(1, 4);
  const den = x0 * x0 + b;
  const val = frac(2 * x0, den);
  return {
    id: `gen.c1t-log-d3.${idx}`, generated: true, concepts: ["log-derivatives"], difficulty: 3, context: "abstract",
    prompt: `Differentiate $f(x) = \\ln(x^2 + ${b})$, then evaluate $f'(${x0})$.`,
    steps: [
      { instruction: `Apply $\\frac{u'}{u}$ with $u = x^2 + ${b}$. Give a single fraction.`, answer: `2x/(x^2+${b})`, accept: [`(2x)/(x^2+${b})`, `2x/(${b}+x^2)`], hint: "Derivative of the inside over the inside." },
      { instruction: `Evaluate $f'(${x0})$. Give a fraction or decimal.`, answer: val, accept: [`${2 * x0}/${den}`, `${2 * x0}/(${x0}^2+${b})`], hint: `$\\frac{2 \\cdot ${x0}}{${x0}^2 + ${b}} = \\frac{${2 * x0}}{${den}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$f'(x) = \\frac{2x}{x^2 + ${b}}$; at $x = ${x0}$: $\\frac{${2 * x0}}{${den}}$${val !== `${2 * x0}/${den}` ? ` $= ${val}$` : ""}.`,
  };
};

// --- trig-derivatives --------------------------------------------------------

// d1: the core pair, sin -> cos and cos -> -sin, exact strings.
fill["c1t-trig-d1"] = (rng, idx) => {
  const pair = rng.pick([
    { f: "\\sin x", ans: "cos(x)", accept: ["cosx", "cos x"], hintText: "The derivative of sine is cosine.", narrative: "$\\frac{d}{dx}\\sin x = \\cos x$." },
    { f: "\\cos x", ans: "-sin(x)", accept: ["-sinx", "-sin x"], hintText: "Cosine's derivative is **negative** sine — mind the sign.", narrative: "$\\frac{d}{dx}\\cos x = -\\sin x$ — don't drop the minus." },
  ]);
  return {
    id: `gen.c1t-trig-d1.${idx}`, generated: true, concepts: ["trig-derivatives"], difficulty: 1, context: "abstract",
    prompt: `Differentiate $f(x) = ${pair.f}$.`,
    steps: [
      { instruction: `State the derivative. (Type it like ${pair.ans}.)`, answer: pair.ans, accept: pair.accept, hint: pair.hintText },
    ],
    finalAnswer: { value: pair.ans, unit: "" },
    solutionNarrative: pair.narrative,
  };
};

// d2: d/dx sin(kx) = k cos(kx), then slope at 0.
fill["c1t-trig-d2"] = (rng, idx) => {
  const k = rng.int(2, 6);
  const ans = `${k}cos(${k}x)`;
  return {
    id: `gen.c1t-trig-d2.${idx}`, generated: true, concepts: ["trig-derivatives"], difficulty: 2, context: "abstract",
    prompt: `Differentiate $f(x) = \\sin(${k}x)$, then evaluate $f'(0)$.`,
    steps: [
      { instruction: `Apply the chain rule. (Type it like ${ans}.)`, answer: ans, accept: [`${k}cos${k}x`, `${k}*cos(${k}x)`, `${k} cos(${k}x)`], hint: `Outer: $\\cos(${k}x)$. Inner derivative: ${k}.` },
      { instruction: "Evaluate $f'(0)$. Give a number.", answer: `${k}`, accept: [`${k}cos(0)`], hint: `$\\cos 0 = 1$, so $f'(0) = ${k} \\cdot 1$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$f'(x) = ${k}\\cos(${k}x)$; at $x = 0$ the slope is ${k} — frequency scales the slope.`,
  };
};

// d3: d/dx [a cos(kx)] = -ak sin(kx), evaluated where kx = pi/2 (sin = 1).
fill["c1t-trig-d3"] = (rng, idx) => {
  const a = rng.int(2, 5), k = rng.pick([2, 3]);
  const ak = a * k;
  const ans = `-${ak}sin(${k}x)`;
  const xLatex = k === 2 ? "\\frac{\\pi}{4}" : "\\frac{\\pi}{6}";
  return {
    id: `gen.c1t-trig-d3.${idx}`, generated: true, concepts: ["trig-derivatives"], difficulty: 3, context: "abstract",
    prompt: `Differentiate $f(x) = ${a}\\cos(${k}x)$, then evaluate $f'\\left(${xLatex}\\right)$.`,
    steps: [
      { instruction: `Apply the chain rule — watch the sign. (Type it like ${ans}.)`, answer: ans, accept: [`-${ak}sin${k}x`, `-${ak}*sin(${k}x)`, `-${ak} sin(${k}x)`], hint: `$\\frac{d}{dx}\\cos(${k}x) = -${k}\\sin(${k}x)$, and $${a} \\cdot (-${k}) = -${ak}$.` },
      { instruction: `Evaluate at $x = ${xLatex}$, where $${k}x = \\frac{\\pi}{2}$ and $\\sin\\frac{\\pi}{2} = 1$. Give a number.`, answer: `-${ak}`, accept: [], hint: `$-${ak} \\cdot 1$.` },
    ],
    finalAnswer: { value: `-${ak}`, unit: "" },
    solutionNarrative: `$f'(x) = -${ak}\\sin(${k}x)$; at $x = ${xLatex}$, $\\sin\\frac{\\pi}{2} = 1$, so the value is $-${ak}$.`,
  };
};

// --- transcendental-rates ----------------------------------------------------

// d1: P(t) = P0 e^(kt), initial growth rate k*P0.
fill["c1t-rate-d1"] = (rng, idx) => {
  const P0 = rng.pick([10, 20, 50, 100, 200]);
  const k = rng.int(2, 4);
  const ans = `${k * P0}e^(${k}t)`;
  const ctx = rng.pick([
    { thing: "bacteria colony", unit: "bacteria per hour", t: "hours" },
    { thing: "algae bloom (in kg)", unit: "kg per day", t: "days" },
    { thing: "online user base", unit: "users per month", t: "months" },
  ]);
  return {
    id: `gen.c1t-rate-d1.${idx}`, generated: true, concepts: ["transcendental-rates"], difficulty: 1, context: "applied",
    prompt: `A ${ctx.thing} grows as $P(t) = ${P0}e^{${k}t}$ after $t$ ${ctx.t}. Find the rate function $P'(t)$ and the initial rate $P'(0)$.`,
    steps: [
      { instruction: `Differentiate $P(t)$. (Type it like ${ans}.)`, answer: ans, accept: [`${k * P0}e^{${k}t}`, `${k * P0}*e^(${k}t)`, `${k * P0}e^${k}t`], hint: `$\\frac{d}{dt}e^{${k}t} = ${k}e^{${k}t}$, and $${P0} \\cdot ${k} = ${k * P0}$.` },
      { instruction: `Evaluate $P'(0)$. Give a number (${ctx.unit}).`, answer: `${k * P0}`, accept: [`${k * P0}e^0`], hint: "$e^0 = 1$." },
    ],
    finalAnswer: { value: `${k * P0}`, unit: ctx.unit },
    solutionNarrative: `$P'(t) = ${k * P0}e^{${k}t}$; at $t = 0$ the rate is ${k * P0} ${ctx.unit} — always proportional to the current amount.`,
  };
};

// d2: P(t) = P0 e^t, rate at t = 1 using e ≈ 2.718 (P0 a multiple of 100 keeps 1 decimal).
fill["c1t-rate-d2"] = (rng, idx) => {
  const h = rng.int(1, 9);
  const P0 = h * 100;
  const val = (h * 271.8).toFixed(1);
  return {
    id: `gen.c1t-rate-d2.${idx}`, generated: true, concepts: ["transcendental-rates"], difficulty: 2, context: "applied",
    prompt: `A culture grows as $P(t) = ${P0}e^{t}$ cells after $t$ hours. Find the growth rate at $t = 1$ hour. Use $e \\approx 2.718$.`,
    steps: [
      { instruction: `Differentiate $P(t)$. (Type it like ${P0}e^t.)`, answer: `${P0}e^t`, accept: [`${P0}e^(t)`, `${P0}*e^t`, `${P0}e^{t}`], hint: "$e^t$ is its own derivative." },
      { instruction: "Evaluate $P'(1)$ using $e \\approx 2.718$. Give a number (cells per hour).", answer: val, accept: [`${(h * 271.8).toFixed(2)}`, `${Math.round(h * 271.8)}`], hint: `$${P0} \\times 2.718$.` },
    ],
    finalAnswer: { value: val, unit: "cells per hour" },
    solutionNarrative: `$P'(t) = ${P0}e^t$, so $P'(1) = ${P0} \\times 2.718 = ${val}$ cells/hour.`,
  };
};

// d3: oscillation y = A sin(2t): velocity 2A cos(2t) at a clean angle.
fill["c1t-rate-d3"] = (rng, idx) => {
  const A = rng.int(2, 6);
  const v = 2 * A;
  const ans = `${v}cos(2t)`;
  const spot = rng.pick([
    { tLatex: "\\frac{\\pi}{2}", angle: "\\pi", cosv: -1 },
    { tLatex: "\\pi", angle: "2\\pi", cosv: 1 },
  ]);
  const val = v * spot.cosv;
  const ctx = rng.pick([
    { thing: "buoy", motion: "bobs with height", unit: "m/s" },
    { thing: "piston", motion: "moves with displacement", unit: "cm/s" },
    { thing: "pendulum bob", motion: "swings with horizontal position", unit: "m/s" },
  ]);
  return {
    id: `gen.c1t-rate-d3.${idx}`, generated: true, concepts: ["transcendental-rates"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.thing} ${ctx.motion} $y(t) = ${A}\\sin(2t)$ after $t$ seconds. Find its velocity at $t = ${spot.tLatex}$ seconds.`,
    steps: [
      { instruction: `Differentiate to get the velocity $y'(t)$. (Type it like ${ans}.)`, answer: ans, accept: [`${v}cos2t`, `${v}*cos(2t)`, `${v} cos(2t)`], hint: `Chain rule: $${A} \\cdot 2\\cos(2t)$.` },
      { instruction: `Evaluate at $t = ${spot.tLatex}$, where $2t = ${spot.angle}$ and $\\cos ${spot.angle} = ${spot.cosv}$. Give a number (${ctx.unit}).`, answer: `${val}`, accept: [], hint: `$${v} \\times (${spot.cosv})$.` },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: `$y'(t) = ${v}\\cos(2t)$; at $t = ${spot.tLatex}$, $\\cos ${spot.angle} = ${spot.cosv}$, so the velocity is ${val} ${ctx.unit}.`,
  };
};
