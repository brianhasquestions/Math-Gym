// gen-de-fill.js
// Additional parametric generators for the Differential Equations subject,
// filling in missing (concept, difficulty) tiers so the adaptive engine
// always has fresh problems at every level. Self-contained: exports a `fill`
// map of template-name -> generator fn, matching the shape used by
// js/generator.js's `generators` map (see de-classify-v1, de-cooling-v1,
// euler-1step-v1, de-char-eq-v1, etc. for the style this follows).

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const round2 = (x) => Math.round(x * 100) / 100;
const E2 = 2.718; // students are told to use e ≈ 2.718 so rounded answers agree

export const fill = {};

// ============================================================================
// introduction.json
// ============================================================================

// classify-order-linearity: d2, d3
fill["def-classify-order-linearity-d2"] = (rng, idx) => {
  const opts = [
    { de: (a, b) => `y'' ${signed(a)}y' ${signed(b)}y = 0`, order: 2, lin: "linear" },
    { de: (a, b) => `\\frac{d^2y}{dx^2} ${signed(a)}\\frac{dy}{dx} = ${b}x`, order: 2, lin: "linear" },
  ];
  const opt = rng.pick(opts);
  const a = nz(rng, -6, 6), b = nz(rng, -6, 6);
  const de = opt.de(a, b);
  return {
    id: `gen.def-classify-order-linearity-d2.${idx}`, generated: true, concepts: ["classify-order-linearity"], difficulty: 2, context: "abstract",
    prompt: `Consider the differential equation $${de}$.`,
    steps: [
      { instruction: "What is its order? (Give a number.)", answer: `${opt.order}`, accept: ["second", "two"], hint: "The order is the highest derivative present." },
      { instruction: "Is it linear or nonlinear? Type 'linear' or 'nonlinear'.", answer: opt.lin, accept: [], hint: "Every term is $y$ or a derivative of $y$ to the first power, not multiplied together." },
    ],
    finalAnswer: { value: `order ${opt.order}, ${opt.lin}`, unit: "" }, solutionNarrative: `Order ${opt.order}, ${opt.lin}.`,
  };
};
fill["def-classify-order-linearity-d3"] = (rng, idx) => {
  const opts = [
    { de: (a) => `\\frac{d^2y}{dx^2} + ${a}y^3 = 0`, order: 2, lin: "nonlinear" },
    { de: (a) => `y'' \\cdot y' + ${a}y = 0`, order: 2, lin: "nonlinear" },
    { de: (a) => `\\frac{dy}{dx} = \\sin(y) + ${a}x`, order: 1, lin: "nonlinear" },
    { de: (a) => `\\frac{d^3y}{dx^3} ${signed(a)}y = 0`, order: 3, lin: "linear" },
  ];
  const opt = rng.pick(opts);
  const a = nz(rng, -8, 8);
  const de = opt.de(a);
  return {
    id: `gen.def-classify-order-linearity-d3.${idx}`, generated: true, concepts: ["classify-order-linearity"], difficulty: 3, context: "abstract",
    prompt: `Consider the differential equation $${de}$.`,
    steps: [
      { instruction: "What is its order? (Give a number.)", answer: `${opt.order}`, accept: [], hint: "The order is the highest derivative present, regardless of any nonlinear terms." },
      { instruction: "Is it linear or nonlinear? Type 'linear' or 'nonlinear'.", answer: opt.lin, accept: [], hint: opt.lin === "nonlinear" ? "A power other than 1, a product of $y$ and a derivative, or $y$ inside a nonlinear function all break linearity." : "Every term is $y$ or a derivative of $y$ to the first power." },
    ],
    finalAnswer: { value: `order ${opt.order}, ${opt.lin}`, unit: "" }, solutionNarrative: `Order ${opt.order}, ${opt.lin}.`,
  };
};

// verify-solutions: d1, d2, d3
fill["def-verify-solutions-d1"] = (rng, idx) => {
  const k = rng.int(2, 5);
  return {
    id: `gen.def-verify-solutions-d1.${idx}`, generated: true, concepts: ["verify-solutions"], difficulty: 1, context: "abstract",
    prompt: `Does the function $y = e^{${k}x}$ satisfy the differential equation $\\frac{dy}{dx} = ${k}y$?`,
    steps: [
      { instruction: `Differentiate $y = e^{${k}x}$. What is $\\frac{dy}{dx}$? (Write it as a multiple of $y$.)`, answer: `${k}y`, accept: [`${k}e^{${k}x}`, `${k}e^(${k}x)`, `${k}*e^(${k}x)`], hint: `$\\frac{d}{dx}e^{${k}x} = ${k}e^{${k}x}$, and $e^{${k}x}$ is just $y$.` },
      { instruction: "Does this match the right-hand side? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Compare your derivative to the right-hand side." },
    ],
    finalAnswer: { value: "yes", unit: "" }, solutionNarrative: `$\\frac{dy}{dx} = ${k}e^{${k}x} = ${k}y$, which matches, so yes.`,
  };
};
fill["def-verify-solutions-d2"] = (rng, idx) => {
  const n = rng.int(2, 4);
  return {
    id: `gen.def-verify-solutions-d2.${idx}`, generated: true, concepts: ["verify-solutions"], difficulty: 2, context: "abstract",
    prompt: `Test whether $y = x^{${n}}$ satisfies the differential equation $\\frac{dy}{dx} = ${n}x^{${n - 1}}$.`,
    steps: [
      { instruction: `Differentiate $y = x^{${n}}$. What is $\\frac{dy}{dx}$?`, answer: `${n}x^${n - 1}`, accept: [`${n}x^{${n - 1}}`], hint: `Use the power rule: $\\frac{d}{dx}x^{${n}} = ${n}x^{${n - 1}}$.` },
      { instruction: "Does $y = x^{" + n + "}$ satisfy the equation? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Compare your derivative to the right-hand side." },
    ],
    finalAnswer: { value: "yes", unit: "" }, solutionNarrative: `$\\frac{dy}{dx} = ${n}x^{${n - 1}}$ matches the right-hand side exactly, so yes.`,
  };
};
fill["def-verify-solutions-d3"] = (rng, idx) => {
  const r = rng.int(2, 6), A0 = rng.int(2, 9) * 100;
  return {
    id: `gen.def-verify-solutions-d3.${idx}`, generated: true, concepts: ["verify-solutions"], difficulty: 3, context: "applied",
    prompt: `An account balance follows $\\frac{dA}{dt} = 0.0${r}A$ (continuous ${r}% growth). The general solution is $A = Ce^{0.0${r}t}$. If the starting balance is $A(0) = ${A0}$ dollars, find the constant $C$, then state the order of the equation.`,
    steps: [
      { instruction: "Substitute $t = 0$ into $A = Ce^{0.0" + r + "t}$. What does $A(0)$ simplify to in terms of $C$?", answer: "C", accept: ["C*1", "1C"], hint: "$e^{0} = 1$, so $A(0) = C$." },
      { instruction: "Set that equal to the initial balance and solve for $C$. (Give a number.)", answer: `${A0}`, accept: [], hint: `$A(0) = C = ${A0}$.` },
      { instruction: "What is the order of the differential equation $\\frac{dA}{dt} = 0.0" + r + "A$? (Give a number.)", answer: "1", accept: ["first", "one"], hint: "Only the first derivative appears." },
    ],
    finalAnswer: { value: `${A0}`, unit: "dollars" }, solutionNarrative: `At $t=0$, $e^0=1$, so $C = ${A0}$. The equation is first order.`,
  };
};

// separable-recognition: d1, d3
fill["def-separable-recognition-d1"] = (rng, idx) => {
  const sep = rng.int(0, 1) === 0;
  const c = rng.int(2, 9);
  const rhs = sep ? `${c}y` : `x ${signed(c)}`;
  return {
    id: `gen.def-separable-recognition-d1.${idx}`, generated: true, concepts: ["separable-recognition"], difficulty: 1, context: "abstract",
    prompt: `Consider $\\frac{dy}{dx} = ${rhs}$.`,
    steps: [{ instruction: "Is this equation separable? Type 'separable' or 'not separable'.", answer: sep ? "separable" : "not separable", accept: sep ? [] : ["nonseparable", "not-separable"], hint: sep ? `The right side is a constant times a $y$-only factor: $${c} \\cdot y$.` : "This has no $y$ on the right at all, so it's just a function of $x$ — which IS separable (constant y-part). Reconsider." }],
    finalAnswer: { value: sep ? "separable" : "not separable", unit: "" }, solutionNarrative: sep ? `The right side is $${c}y$, a product of a constant and a $y$-part, so it's separable.` : `The right side depends only on $x$, which is still technically separable (a constant $y$-part), but here we intend the equation as not mixing $x$ and $y$ multiplicatively in a nontrivial way.`,
  };
};
// The "not separable" branch above is actually always separable mathematically (pure function of x is separable).
// Simplify: always generate a genuinely separable vs. non-separable pair using product vs sum forms, like the seed problems.
fill["def-separable-recognition-d1"] = (rng, idx) => {
  const sep = rng.int(0, 1) === 0;
  const a = rng.int(2, 9), b = rng.int(2, 9);
  const rhs = sep ? `${a}xy` : `${a}x ${signed(b)}y`;
  return {
    id: `gen.def-separable-recognition-d1.${idx}`, generated: true, concepts: ["separable-recognition"], difficulty: 1, context: "abstract",
    prompt: `Consider $\\frac{dy}{dx} = ${rhs}$.`,
    steps: [{ instruction: "Is this equation separable? Type 'separable' or 'not separable'.", answer: sep ? "separable" : "not separable", accept: sep ? [] : ["nonseparable", "not-separable"], hint: sep ? `The right side is $${a}x \\cdot y$, a product of an $x$-part and a $y$-part.` : "A sum of an $x$-term and a $y$-term cannot be factored into (function of $x$)(function of $y$)." }],
    finalAnswer: { value: sep ? "separable" : "not separable", unit: "" }, solutionNarrative: sep ? `The right side factors as $${a}x \\cdot y$, so it is separable.` : `The right side is a sum, $${a}x ${signed(b)}y$, so it is not separable.`,
  };
};
fill["def-separable-recognition-d3"] = (rng, idx) => {
  const n = rng.int(2, 4);
  return {
    id: `gen.def-separable-recognition-d3.${idx}`, generated: true, concepts: ["separable-recognition"], difficulty: 3, context: "abstract",
    prompt: `Consider $\\frac{dy}{dx} = \\frac{x^{${n}}}{y^2}$. This is separable, so identify the pieces in $\\frac{dy}{dx} = g(x)\\,h(y)$.`,
    steps: [
      { instruction: "Is this equation separable? Type 'separable' or 'not separable'.", answer: "separable", accept: [], hint: `$\\frac{x^{${n}}}{y^2} = x^{${n}} \\cdot \\frac{1}{y^2}$, a product of an $x$-part and a $y$-part.` },
      { instruction: "What is the $x$-only factor $g(x)$?", answer: `x^${n}`, accept: [`x^{${n}}`], hint: "It's the part involving only $x$." },
      { instruction: `After separating, you write $y^2\\,dy = x^{${n}}\\,dx$. Integrate the right side $\\int x^{${n}}\\,dx$ (ignore $+C$). Use exponent ${n + 1} over ${n + 1}.`, answer: `x^${n + 1}/${n + 1}`, accept: [`x^{${n + 1}}/${n + 1}`, `(1/${n + 1})x^${n + 1}`], hint: `$\\int x^{${n}}\\,dx = \\frac{x^{${n + 1}}}{${n + 1}}$.` },
    ],
    finalAnswer: { value: "separable", unit: "" }, solutionNarrative: `$\\frac{x^{${n}}}{y^2} = x^{${n}}\\cdot\\frac{1}{y^2}$, so it's separable; $\\int x^{${n}}\\,dx = \\frac{x^{${n + 1}}}{${n + 1}}$.`,
  };
};

// slope-fields: d2, d3
fill["def-slope-fields-d2"] = (rng, idx) => {
  const a = nz(rng, -4, 4), x = rng.int(-3, 4), y = rng.int(-3, 4);
  const slope = a * x * x - y;
  return {
    id: `gen.def-slope-fields-d2.${idx}`, generated: true, concepts: ["slope-fields"], difficulty: 2, context: "abstract",
    prompt: `For $\\frac{dy}{dx} = ${a}x^2 - y$, a solution curve passes through $(${x}, ${y})$.`,
    steps: [
      { instruction: `Find the slope $\\frac{dy}{dx}$ at $(${x}, ${y})$.`, answer: `${slope}`, accept: [], hint: `$\\frac{dy}{dx} = ${a}x^2 - y = ${a}(${x})^2 - (${y})$.` },
      { instruction: "Is the solution curve increasing or decreasing at that point? Type 'increasing' or 'decreasing'.", answer: slope >= 0 ? "increasing" : "decreasing", accept: slope >= 0 ? ["rising"] : ["falling"], hint: slope >= 0 ? "A nonnegative slope means the curve is rising." : "A negative slope means the curve is falling." },
    ],
    finalAnswer: { value: `${slope}`, unit: "" }, solutionNarrative: `At $(${x}, ${y})$, $\\frac{dy}{dx} = ${a}(${x})^2 - ${y} = ${slope}$, so the curve is ${slope >= 0 ? "increasing" : "decreasing"}.`,
  };
};
fill["def-slope-fields-d3"] = (rng, idx) => {
  const K = rng.pick([4, 6, 8, 10]), r = rng.pick([2, 3]), y0 = rng.int(1, K - 1);
  const slope = y0 * (K - y0);
  return {
    id: `gen.def-slope-fields-d3.${idx}`, generated: true, concepts: ["slope-fields"], difficulty: 3, context: "abstract",
    prompt: `For the autonomous equation $\\frac{dy}{dx} = y(${K} - y)$, equilibrium solutions occur where the slope is zero everywhere along a horizontal line.`,
    steps: [
      { instruction: `Find the slope at the point $(${r}, ${y0})$ (the $x$-coordinate doesn't matter here).`, answer: `${slope}`, accept: [], hint: `$\\frac{dy}{dx} = y(${K} - y) = ${y0}(${K} - ${y0})$.` },
      { instruction: "At what positive value of $y$ is the slope zero (the upper equilibrium)? (Give a number.)", answer: `${K}`, accept: [], hint: `Set $y(${K} - y) = 0$; the solutions are $y = 0$ and $y = ${K}$.` },
    ],
    finalAnswer: { value: `${K}`, unit: "" }, solutionNarrative: `At $(${r},${y0})$, slope $= ${y0}(${K}-${y0}) = ${slope}$. Equilibria are $y=0$ and $y=${K}$; the positive one is $${K}$.`,
  };
};

// ============================================================================
// separable-equations.json
// ============================================================================

// separate-and-integrate: d2, d3
fill["def-separate-and-integrate-d2"] = (rng, idx) => {
  const a = rng.int(2, 6), y0 = rng.int(1, 9), X = rng.int(2, 5);
  // dy/dx = 2a x + a  ->  y = a x^2 + a x + C
  const val = a * X * X + a * X + y0;
  return {
    id: `gen.def-separate-and-integrate-d2.${idx}`, generated: true, concepts: ["separate-and-integrate"], difficulty: 2, context: "abstract",
    prompt: `Solve $\\frac{dy}{dx} = ${2 * a}x + ${a}$ with $y(0) = ${y0}$, then evaluate the solution at $x = ${X}$.`,
    steps: [
      { instruction: "Integrate to get the general solution (use $C$).", answer: `y = ${a}x^2 + ${a}x + C`, accept: [`${a}x^2+${a}x+C`, `${a}x^2 + ${a}x + C`], hint: `$\\int (${2 * a}x + ${a})\\,dx = ${a}x^2 + ${a}x$.` },
      { instruction: `Use $y(0) = ${y0}$ to find $C$.`, answer: `${y0}`, accept: [`C = ${y0}`, `C=${y0}`], hint: `At $x=0$: $${y0} = 0 + 0 + C$.` },
      { instruction: `Evaluate $y$ at $x = ${X}$.`, answer: `${val}`, accept: [`y = ${val}`, `y=${val}`], hint: `$y = ${a}(${X})^2 + ${a}(${X}) + ${y0}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y = ${a}x^2 + ${a}x + C$; $C = ${y0}$; $y(${X}) = ${a}(${X})^2 + ${a}(${X}) + ${y0} = ${val}$.`,
  };
};
fill["def-separate-and-integrate-d3"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(1, 6), y0 = rng.int(-5, 5), X = rng.int(2, 5);
  // dy/dx = 3a x^2 - 2b x -> y = a x^3 - b x^2 + C
  const val = a * X * X * X - b * X * X + y0;
  return {
    id: `gen.def-separate-and-integrate-d3.${idx}`, generated: true, concepts: ["separate-and-integrate"], difficulty: 3, context: "abstract",
    prompt: `Solve $\\frac{dy}{dx} = ${3 * a}x^2 - ${2 * b}x$ with $y(0) = ${y0}$, then evaluate at $x = ${X}$.`,
    steps: [
      { instruction: "Integrate to get the general solution (use $C$).", answer: `y = ${a}x^3 - ${b}x^2 + C`, accept: [`${a}x^3-${b}x^2+C`, `${a}x^3 - ${b}x^2 + C`], hint: `$\\int ${3 * a}x^2\\,dx = ${a}x^3$ and $\\int -${2 * b}x\\,dx = -${b}x^2$.` },
      { instruction: `Use $y(0) = ${y0}$ to find $C$.`, answer: `${y0}`, accept: [`C = ${y0}`, `C=${y0}`], hint: `At $x=0$: $${y0} = 0 - 0 + C$.` },
      { instruction: `Evaluate $y$ at $x = ${X}$.`, answer: `${val}`, accept: [`y = ${val}`, `y=${val}`], hint: `$y = ${a}(${X})^3 - ${b}(${X})^2 + ${y0}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y = ${a}x^3 - ${b}x^2 + C$; $C = ${y0}$; $y(${X}) = ${a}(${X})^3 - ${b}(${X})^2 + ${y0} = ${val}$.`,
  };
};

// exponential-model: d1, d3
fill["def-exponential-model-d1"] = (rng, idx) => {
  const P0 = rng.int(2, 9) * 100, k = rng.pick([1, 2]), t = 1;
  const exp = k * t;
  const val = Math.round(P0 * Math.pow(E2, exp));
  return {
    id: `gen.def-exponential-model-d1.${idx}`, generated: true, concepts: ["exponential-model"], difficulty: 1, context: "applied",
    prompt: `A culture grows by $\\frac{dP}{dt} = ${k}P$ (hours), starting at $P_0 = ${P0}$ cells. The solution is $P = ${P0}e^{${k}t}$. How many cells after $t = ${t}$ hour? (Use $e \\approx 2.718$; round to the nearest whole cell.)`,
    steps: [
      { instruction: `Compute the exponent $${k} \\times ${t}$.`, answer: `${exp}`, accept: [], hint: `${k} × ${t}.` },
      { instruction: `Compute $P = ${P0} e^{${exp}}$ and round to the nearest whole cell.`, answer: `${val}`, accept: [], hint: `$${P0} \\times ${round2(Math.pow(E2, exp))}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "cells" }, solutionNarrative: `$P(${t}) = ${P0}e^{${exp}} \\approx ${val}$ cells.`,
  };
};
fill["def-exponential-model-d3"] = (rng, idx) => {
  const y0 = rng.int(1, 4) * 1000, ratio = rng.pick([2, 3]), tFit = rng.pick([4, 5]);
  // e^{k*tFit} = ratio -> k = ln(ratio)/tFit ; use ratio=2 -> ln2=0.693, ratio=3->ln3=1.0986
  const lnVal = ratio === 2 ? 0.6931 : 1.0986;
  const k = round2(lnVal / tFit * 10000) / 10000; // 4 decimals
  const tEval = tFit * 2; // exactly 2 fit-periods -> P doubles/triples twice
  const val = y0 * ratio * ratio;
  return {
    id: `gen.def-exponential-model-d3.${idx}`, generated: true, concepts: ["exponential-model"], difficulty: 3, context: "applied",
    prompt: `A population grows as $P = ${y0}e^{kt}$. It grows to ${y0 * ratio} in ${tFit} years, so $k = \\frac{\\ln ${ratio}}{${tFit}}$. First find $k$ (round to 4 decimals; use $\\ln ${ratio} \\approx ${lnVal}$), then predict the population at $t = ${tEval}$ years (an exact multiple of the fit period).`,
    steps: [
      { instruction: `Compute $k = \\frac{${lnVal}}{${tFit}}$ (round to 4 decimals).`, answer: `${k}`, accept: [], hint: `Divide ${lnVal} by ${tFit}.` },
      { instruction: `$t = ${tEval}$ is exactly two ${tFit}-year growth periods, each multiplying the population by ${ratio}. Compute $P(${tEval}) = ${y0} \\times ${ratio}^2$.`, answer: `${val}`, accept: [], hint: `$${y0} \\times ${ratio} \\times ${ratio}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "people" }, solutionNarrative: `$k = \\ln ${ratio}/${tFit} \\approx ${k}$ per year. In ${tEval} years (two periods), $P = ${y0} \\cdot ${ratio}^2 = ${val}$.`,
  };
};

// initial-value-problems: d1, d2, d3
fill["def-initial-value-problems-d1"] = (rng, idx) => {
  const m = nz(rng, -8, 8), y0 = rng.int(-5, 5), X = rng.int(1, 6);
  const val = m * X + y0;
  return {
    id: `gen.def-initial-value-problems-d1.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 1, context: "abstract",
    prompt: `Solve the initial-value problem $\\frac{dy}{dx} = ${m}$ with $y(0) = ${y0}$, then evaluate at $x = ${X}$.`,
    steps: [
      { instruction: "Integrate to get the general solution (use $C$).", answer: `y = ${m}x + C`, accept: [`${m}x+C`, `${m}x + C`], hint: `$\\int ${m}\\,dx = ${m}x$.` },
      { instruction: `Use $y(0) = ${y0}$ to find $C$.`, answer: `${y0}`, accept: [`C = ${y0}`, `C=${y0}`], hint: `$${y0} = 0 + C$.` },
      { instruction: `Evaluate $y$ at $x = ${X}$.`, answer: `${val}`, accept: [`y = ${val}`, `y=${val}`], hint: `$y = ${m}(${X}) + ${y0}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y = ${m}x + C$; $C = ${y0}$; $y(${X}) = ${m}(${X}) + ${y0} = ${val}$.`,
  };
};
fill["def-initial-value-problems-d2"] = (rng, idx) => {
  const a = rng.int(2, 6), y0 = rng.int(-6, 6), X = rng.int(1, 5);
  // dy/dx = 3a x^2 ; y = a x^3 + C
  const val = a * X * X * X + y0;
  return {
    id: `gen.def-initial-value-problems-d2.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 2, context: "abstract",
    prompt: `Solve $\\frac{dy}{dx} = ${3 * a}x^2$ with $y(1) = ${a + y0}$, then evaluate at $x = ${X}$.`,
    steps: [
      { instruction: "Integrate to get the general solution (use $C$).", answer: `y = ${a}x^3 + C`, accept: [`${a}x^3+C`, `${a}x^3 + C`], hint: `$\\int ${3 * a}x^2\\,dx = ${a}x^3$.` },
      { instruction: `Use $y(1) = ${a + y0}$ to find $C$.`, answer: `${y0}`, accept: [`C = ${y0}`, `C=${y0}`], hint: `$${a + y0} = ${a}(1)^3 + C$.` },
      { instruction: `Evaluate $y$ at $x = ${X}$.`, answer: `${val}`, accept: [`y = ${val}`, `y=${val}`], hint: `$y = ${a}(${X})^3 + ${y0}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y = ${a}x^3 + C$; from $y(1)=${a + y0}$, $C=${y0}$; $y(${X}) = ${a}(${X})^3 + ${y0} = ${val}$.`,
  };
};
fill["def-initial-value-problems-d3"] = (rng, idx) => {
  const c2 = rng.pick([9, 16, 25, 36]), y0 = Math.sqrt(c2), Xstep = rng.int(2, 6);
  // dy/dx = x/y ; y dy = x dx ; y^2 - x^2 = C ; y(0)=y0 -> C = y0^2
  const X = Xstep;
  const y2 = c2 + X * X;
  const yVal = Math.sqrt(y2);
  const clean = Number.isInteger(yVal);
  return {
    id: `gen.def-initial-value-problems-d3.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 3, context: "abstract",
    prompt: `Solve $\\frac{dy}{dx} = \\frac{x}{y}$ with $y(0) = ${y0}$ (positive branch), then find $y$ at $x = ${X}$.`,
    steps: [
      { instruction: "Separate the variables. Write the equation after multiplying both sides by $y$.", answer: "y dy = x dx", accept: ["y\\,dy = x\\,dx", "ydy=xdx"], hint: "Move $y$ to the left with $dy$ and $x$ to the right with $dx$." },
      { instruction: `Integrate both sides to get $y^2 - x^2 = C$. Use $y(0)=${y0}$ to find $C$.`, answer: `${c2}`, accept: [`y^2 - x^2 = ${c2}`, `y^2-x^2=${c2}`], hint: `At $x=0$, $y=${y0}$: $${c2} - 0 = ${c2}$.` },
      { instruction: `Evaluate $y$ at $x = ${X}$ (positive branch).`, answer: clean ? `${yVal}` : `${round2(yVal)}`, accept: [`y = ${clean ? yVal : round2(yVal)}`], hint: `$y^2 = ${c2} + ${X * X} = ${y2}$, so $y = \\sqrt{${y2}}$.` },
    ],
    finalAnswer: { value: clean ? `${yVal}` : `${round2(yVal)}`, unit: "" }, solutionNarrative: `Separating gives $y\\,dy=x\\,dx$, so $y^2-x^2=${c2}$. At $x=${X}$, $y^2=${y2}$, $y=${clean ? yVal : round2(yVal)}$.`,
  };
};

// separable-applied: d1, d2, d3
fill["def-separable-applied-d1"] = (rng, idx) => {
  const N0 = rng.int(2, 9) * 10, k = rng.pick([0.1, 0.2]), t = 1 / k; // exponent = -1
  const val = round2(N0 / E2);
  return {
    id: `gen.def-separable-applied-d1.${idx}`, generated: true, concepts: ["separable-applied"], difficulty: 1, context: "applied",
    prompt: `A radioactive sample starts at ${N0} mg and decays as $N = ${N0}e^{-kt}$ with $k = ${k}$ per year. How much remains after ${t} years? (Use $e \\approx 2.718$; round to 1 decimal place.)`,
    steps: [
      { instruction: `Compute the exponent $-${k} \\times ${t}$.`, answer: "-1", accept: ["-1.0"], hint: `$-${k} \\times ${t} = -1$.` },
      { instruction: `Compute $N = ${N0} e^{-1}$ and round to 1 decimal.`, answer: `${val}`, accept: [`${val} mg`], hint: `$${N0} / 2.718$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "mg" }, solutionNarrative: `Exponent is $-1$, so $N = ${N0}e^{-1} \\approx ${val}$ mg.`,
  };
};
fill["def-separable-applied-d2"] = (rng, idx) => {
  const T0 = rng.int(80, 100), Ts = rng.int(15, 25), k = 0.05, t = 20; // exponent -1
  const diff = T0 - Ts;
  const val = round2(Ts + diff / E2);
  return {
    id: `gen.def-separable-applied-d2.${idx}`, generated: true, concepts: ["separable-applied"], difficulty: 2, context: "applied",
    prompt: `A cup of coffee at ${T0}°C cools in a ${Ts}°C room following $T = ${Ts} + ${diff}e^{-kt}$ with $k = ${k}$ per minute. What is the temperature after ${t} minutes? (Use $e^{-1} \\approx 0.368$; round to 1 decimal place.)`,
    steps: [
      { instruction: `Compute the exponent $-${k} \\times ${t}$.`, answer: "-1", accept: ["-1.0"], hint: `$-${k} \\times ${t} = -1$.` },
      { instruction: `Compute $T = ${Ts} + ${diff}e^{-1}$ and round to 1 decimal.`, answer: `${val}`, accept: [`${val} C`, `${val}°C`], hint: `$${diff} \\times 0.368$; add ${Ts}.` },
    ],
    finalAnswer: { value: `${val}`, unit: "°C" }, solutionNarrative: `Exponent is $-1$, so $T = ${Ts} + ${diff}e^{-1} \\approx ${val}$°C after ${t} minutes.`,
  };
};
fill["def-separable-applied-d3"] = (rng, idx) => {
  const halfLife = rng.pick([3, 5, 6]), C0 = rng.pick([32, 64, 128]);
  const numHalfLives = rng.pick([2, 3]), t = halfLife * numHalfLives;
  const k = round2(0.6931 / halfLife * 10000) / 10000;
  const finalConc = C0 / Math.pow(2, numHalfLives);
  return {
    id: `gen.def-separable-applied-d3.${idx}`, generated: true, concepts: ["separable-applied"], difficulty: 3, context: "applied",
    prompt: `A drug clears the bloodstream by $\\frac{dC}{dt} = -kC$ with half-life ${halfLife} hours, starting at ${C0} mg/L. First find $k$ from the half-life, then find the concentration after ${t} hours. (Use $\\ln 2 \\approx 0.6931$; the answer is a clean number.)`,
    steps: [
      { instruction: `Find $k$ from the half-life: $k = \\frac{\\ln 2}{t_{1/2}} = \\frac{0.6931}{${halfLife}}$ (round to 4 decimals).`, answer: `${k}`, accept: [`k = ${k}`, `k=${k}`], hint: `$0.6931 / ${halfLife}$.` },
      { instruction: `${t} hours is how many half-lives? ($${t} \\div ${halfLife}$)`, answer: `${numHalfLives}`, accept: [`${numHalfLives} half-lives`], hint: `$${t} / ${halfLife} = ${numHalfLives}$.` },
      { instruction: `Halve ${C0} mg/L ${numHalfLives} times to get the concentration after ${t} hours.`, answer: `${finalConc}`, accept: [`${finalConc} mg/L`], hint: `Halve ${C0} repeatedly ${numHalfLives} times.` },
    ],
    finalAnswer: { value: `${finalConc}`, unit: "mg/L" }, solutionNarrative: `$k = 0.6931/${halfLife} \\approx ${k}$ per hour. In ${t} hours the drug passes through ${numHalfLives} half-lives: $${C0} \\to ${finalConc}$ mg/L.`,
  };
};

// ============================================================================
// linear-first-order.json
// ============================================================================

// standard-form: d2, d3
fill["def-standard-form-d2"] = (rng, idx) => {
  const k = rng.int(2, 6), P = rng.int(2, 9), Q = rng.int(1, 9) * k;
  return {
    id: `gen.def-standard-form-d2.${idx}`, generated: true, concepts: ["standard-form"], difficulty: 2, context: "abstract",
    prompt: `Write $${k}y' + ${k * P}y = ${Q}$ in standard form $y' + P(x)y = Q(x)$ by dividing through, then give $P(x)$ and $Q(x)$.`,
    steps: [
      { instruction: `Divide every term by ${k}. What is the constant $P(x)$?`, answer: `${P}`, accept: [], hint: `Dividing ${k * P}y by ${k} gives the coefficient of $y$.` },
      { instruction: "What is the constant $Q(x)$ on the right side?", answer: `${Q / k}`, accept: [], hint: `Divide ${Q} by ${k}.` },
    ],
    finalAnswer: { value: `${Q / k}`, unit: "" }, solutionNarrative: `Dividing by ${k} gives $y' + ${P}y = ${Q / k}$, so $P(x) = ${P}$ and $Q(x) = ${Q / k}$.`,
  };
};
fill["def-standard-form-d3"] = (rng, idx) => {
  const c = rng.int(2, 5), n = rng.int(2, 4), evalX = rng.int(2, 8);
  const Pval = frac(c, evalX);
  return {
    id: `gen.def-standard-form-d3.${idx}`, generated: true, concepts: ["standard-form"], difficulty: 3, context: "abstract",
    prompt: `Put $x y' + ${c}y = x^{${n + 1}}$ (for $x > 0$) into standard form $y' + P(x)y = Q(x)$ by dividing through by $x$. Then evaluate $P(x)$ at $x = ${evalX}$.`,
    steps: [
      { instruction: "Divide every term by $x$. Write the resulting standard-form equation.", answer: `y' + (${c}/x)y = x^${n}`, accept: [`y'+(${c}/x)y=x^${n}`, `y' + ${c}/x y = x^${n}`], hint: `Dividing $${c}y$ by $x$ gives $(${c}/x)y$; dividing $x^{${n + 1}}$ by $x$ gives $x^{${n}}$.` },
      { instruction: `Here $P(x) = ${c}/x$. Evaluate $P(${evalX})$ as a decimal or fraction.`, answer: `${Pval}`, accept: [`${round2(c / evalX)}`], hint: `Compute ${c}/${evalX}.` },
    ],
    finalAnswer: { value: `${Pval}`, unit: "" }, solutionNarrative: `Dividing by $x$ gives $y' + \\frac{${c}}{x}y = x^{${n}}$, so $P(${evalX}) = ${c}/${evalX} = ${Pval}$.`,
  };
};

// integrating-factor: d1, d2, d3
fill["def-integrating-factor-d1"] = (rng, idx) => {
  const P = nz(rng, 2, 6), Q = P * rng.int(1, 6);
  const steady = Q / P;
  return {
    id: `gen.def-integrating-factor-d1.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 1, context: "abstract",
    prompt: `The equation $y' + ${P}y = ${Q}$ has solution $y = ${steady} + Ce^{-${P}x}$. As $x \\to \\infty$, what value does $y$ approach (the steady state)?`,
    steps: [{ instruction: `As $x \\to \\infty$, $e^{-${P}x} \\to 0$. What number is left?`, answer: `${steady}`, accept: [], hint: "The transient term dies out; only the constant remains." }],
    finalAnswer: { value: `${steady}`, unit: "" }, solutionNarrative: `The transient dies out, so $y \\to ${steady}$, which equals $Q/P = ${Q}/${P}$.`,
  };
};
fill["def-integrating-factor-d2"] = (rng, idx) => {
  const P = rng.int(2, 5), Q = P * rng.int(1, 4), y0 = rng.int(1, 12);
  const steady = Q / P;
  const C = y0 - steady;
  return {
    id: `gen.def-integrating-factor-d2.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 2, context: "abstract",
    prompt: `Solve $y' + ${P}y = ${Q}$ with $y(0) = ${y0}$, then evaluate the solution at $x = 0$ to confirm. Give $y(0)$.`,
    steps: [
      { instruction: `The integrating factor is $e^{${P}x}$. After integrating, $y = ${steady} + Ce^{-${P}x}$. Use $y(0)=${y0}$ to find $C$.`, answer: `${C}`, accept: [], hint: `At $x=0$: $${y0} = ${steady} + C$.` },
      { instruction: `So $y = ${steady} + ${C}e^{-${P}x}$. Evaluate $y(0)$.`, answer: `${y0}`, accept: [], hint: `$e^0 = 1$, so $y(0) = ${steady} + ${C}$.` },
    ],
    finalAnswer: { value: `${y0}`, unit: "" }, solutionNarrative: `With $\\mu = e^{${P}x}$, $y = ${steady} + Ce^{-${P}x}$. From $y(0)=${y0}$, $C=${C}$, and $y(0)=${y0}$. ✓`,
  };
};
fill["def-integrating-factor-d3"] = (rng, idx) => {
  const P = rng.int(1, 3), Q = P * rng.int(1, 4), y0 = rng.int(1, 10);
  const steady = Q / P;
  const C = y0 - steady;
  const eNeg1 = round2(1 / E2);
  const val = round2(steady + C * eNeg1);
  return {
    id: `gen.def-integrating-factor-d3.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 3, context: "abstract",
    prompt: `Solve $y' + ${P}y = ${Q}$ with $y(0) = ${y0}$, giving $y = ${steady} + ${C}e^{-${P}x}$. Evaluate $y(1/${P})$ to two decimal places (use $e \\approx 2.718$, so the exponent works out to $-1$).`,
    steps: [
      { instruction: "Compute $e^{-1}$ to four decimals (use $e \\approx 2.718$).", answer: "0.3679", accept: ["0.368", "0.3679"], hint: "$e^{-1} = 1/2.718$." },
      { instruction: `Now compute $y = ${steady} + ${C}e^{-1}$, rounded to two decimals.`, answer: `${val}`, accept: [], hint: `$${steady} + ${C}(0.3679)$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y = ${steady} + ${C}e^{-1} \\approx ${val}$.`,
  };
};

// mixing-problems: d1, d3
fill["def-mixing-problems-d1"] = (rng, idx) => {
  const c = rng.int(2, 10), V = rng.int(20, 200);
  return {
    id: `gen.def-mixing-problems-d1.${idx}`, generated: true, concepts: ["mixing-problems"], difficulty: 1, context: "applied",
    prompt: `A ${V} L tank is fed brine at ${c} g/L flowing in, well-stirred, draining at the same rate (volume constant). At steady state the concentration matches the inflow. How many grams of salt does the tank hold at steady state?`,
    steps: [{ instruction: `At steady state the concentration equals the inflow, ${c} g/L. Multiply by the volume ${V} L.`, answer: `${c * V}`, accept: [], hint: "Steady-state amount = concentration × volume." }],
    finalAnswer: { value: `${c * V}`, unit: "grams" }, solutionNarrative: `At steady state the tank's concentration matches the inflow ${c} g/L, so the amount is ${c} × ${V} = ${c * V} g.`,
  };
};
fill["def-mixing-problems-d3"] = (rng, idx) => {
  const V = rng.pick([50, 100, 200]), rate = rng.pick([2, 4, 5]), cin = rng.int(2, 8);
  const rOverV = rate / V; // 1/timeConst
  const steady = cin * V;
  const t = Math.round(1 / rOverV); // pick t = time constant so exponent = -1
  const val = Math.round(steady * (1 - 1 / E2));
  return {
    id: `gen.def-mixing-problems-d3.${idx}`, generated: true, concepts: ["mixing-problems"], difficulty: 3, context: "applied",
    prompt: `A ${V} L tank of pure water is fed brine at ${cin} g/L flowing in at ${rate} L/min, draining at ${rate} L/min. The salt satisfies $A(t) = ${steady}(1 - e^{-t/${t}})$. How much salt is in the tank after $t = ${t}$ minutes? Round to the nearest gram (use $e \\approx 2.718$).`,
    steps: [
      { instruction: `At $t = ${t}$, the exponent is $-${t}/${t} = -1$. Compute $e^{-1}$ to four decimals.`, answer: "0.3679", accept: ["0.368"], hint: "$e^{-1} = 1/2.718$." },
      { instruction: `Compute $A(${t}) = ${steady}(1 - e^{-1})$, rounded to the nearest gram.`, answer: `${val}`, accept: [], hint: `$${steady}(1 - 0.3679)$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "grams" }, solutionNarrative: `$A(${t}) = ${steady}(1 - e^{-1}) \\approx ${val}$ g.`,
  };
};

// circuits-and-applied: d1, d3
fill["def-circuits-and-applied-d1"] = (rng, idx) => {
  const V = rng.int(6, 24), R = nz(rng, 2, 8);
  const i = V / R;
  const clean = Number.isInteger(i);
  return {
    id: `gen.def-circuits-and-applied-d1.${idx}`, generated: true, concepts: ["circuits-and-applied"], difficulty: 1, context: "applied",
    prompt: `An RL circuit has a ${V} V battery and ${R} ohm resistor. The current obeys $L i' + R i = V$ and rises toward a steady value $V/R$ where $i' = 0$. What is the steady-state current (amperes)?`,
    steps: [{ instruction: `At steady state $i' = 0$, so $Ri = V$. Compute $i = V/R = ${V}/${R}$.`, answer: clean ? `${i}` : `${round2(i)}`, accept: [], hint: "Divide the voltage by the resistance." }],
    finalAnswer: { value: clean ? `${i}` : `${round2(i)}`, unit: "amperes" }, solutionNarrative: `$i = ${V}/${R} = ${clean ? i : round2(i)}$ A.`,
  };
};
fill["def-circuits-and-applied-d3"] = (rng, idx) => {
  const V = rng.pick([6, 12, 18, 24]), R = rng.pick([2, 3, 4, 6]), L = R; // time constant L/R = 1
  const iMax = V / R;
  const val = round2(iMax * (1 - 1 / E2));
  return {
    id: `gen.def-circuits-and-applied-d3.${idx}`, generated: true, concepts: ["circuits-and-applied"], difficulty: 3, context: "applied",
    prompt: `An RL circuit with $L = ${L}$ H, $R = ${R}$ ohm, $V = ${V}$ V gives current $i(t) = ${iMax}(1 - e^{-t})$ amperes (time constant $L/R = 1$ s). What is the current at $t = 1$ s? Round to two decimals (use $e \\approx 2.718$).`,
    steps: [
      { instruction: "Compute $e^{-1}$ to four decimals (use $e \\approx 2.718$).", answer: "0.3679", accept: ["0.368"], hint: "$e^{-1} = 1/2.718$." },
      { instruction: `Compute $i(1) = ${iMax}(1 - e^{-1})$, rounded to two decimals.`, answer: `${val}`, accept: [], hint: `$${iMax}(1 - 0.3679)$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "amperes" }, solutionNarrative: `$i(1) = ${iMax}(1-e^{-1}) \\approx ${val}$ A — about 63% of the final ${iMax} A.`,
  };
};

// ============================================================================
// growth-decay-cooling.json
// ============================================================================

// exponential-growth: d2, d3
fill["def-exponential-growth-d2"] = (rng, idx) => {
  const A0 = rng.int(1, 9) * 1000, r = rng.pick([0.03, 0.04, 0.06]), t = rng.pick([1 / r]); // exponent 1
  const val = round2(A0 * E2);
  return {
    id: `gen.def-exponential-growth-d2.${idx}`, generated: true, concepts: ["exponential-growth"], difficulty: 2, context: "applied",
    prompt: `You invest \\$${A0} in an account earning ${Math.round(r * 100)}% interest compounded continuously, so the balance is $A(t) = ${A0}\\, e^{${r} t}$ with $t$ in years. What is the balance after ${round2(1 / r)} years? Use $e \\approx 2.718$ and round to the nearest cent.`,
    steps: [
      { instruction: `Compute the exponent $${r} \\times ${round2(1 / r)}$.`, answer: "1", accept: ["1.0"], hint: "Multiply the rate by the time." },
      { instruction: `Evaluate $${A0}\\, e^{1}$ and round to the nearest cent.`, answer: `${val}`, accept: [], hint: `$${A0} \\times 2.718$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "dollars" }, solutionNarrative: `The exponent is $1$, so $A = ${A0} e \\approx ${val}$.`,
  };
};
fill["def-exponential-growth-d3"] = (rng, idx) => {
  const P0 = rng.int(1, 5) * 1000, ratio = 1.5, tFit = rng.pick([4, 6]);
  // k = ln(1.5)/tFit ≈ 0.4055/tFit
  const lnVal = 0.4055;
  const k = Math.round(lnVal / tFit * 100000) / 100000;
  const tEval = tFit * 3;
  const factor3 = 1.5 ** 3; // 3.375
  const val = Math.round(P0 * factor3);
  const kRounded = Math.round(k * 100000) / 100000;
  return {
    id: `gen.def-exponential-growth-d3.${idx}`, generated: true, concepts: ["exponential-growth"], difficulty: 3, context: "applied",
    prompt: `A population grows continuously as $P(t) = ${P0}\\, e^{kt}$. It grows to ${P0 * 1.5} in ${tFit} years, so $k = \\frac{\\ln 1.5}{${tFit}}$. Find $k$ (round to 5 decimals; use $\\ln 1.5 \\approx ${lnVal}$), then predict the population after ${tEval} years (an exact multiple of the fit period, so no further rounding of $e$ is needed).`,
    steps: [
      { instruction: `Compute $k = \\frac{${lnVal}}{${tFit}}$ (round to 5 decimals).`, answer: `${kRounded}`, accept: [], hint: `Divide ${lnVal} by ${tFit}.` },
      { instruction: `$t = ${tEval}$ is exactly three ${tFit}-year growth periods, each multiplying the population by 1.5. Compute $P(${tEval}) = ${P0} \\times 1.5^3$ (round to the nearest whole).`, answer: `${val}`, accept: [`${val - 1}`, `${val + 1}`], hint: `$1.5^3 = 3.375$; multiply by ${P0}.` },
    ],
    finalAnswer: { value: `${val}`, unit: "people" }, solutionNarrative: `$k = \\ln 1.5/${tFit} \\approx ${kRounded}$. After ${tEval} years (3 periods), $P = ${P0} \\cdot 1.5^3 \\approx ${val}$.`,
  };
};

// radioactive-decay: d1, d3
fill["def-radioactive-decay-d1"] = (rng, idx) => {
  const A = rng.int(2, 12) * 10, H = rng.pick([4, 6, 8, 12]), k = rng.int(1, 3);
  const val = A / 2 ** k;
  return {
    id: `gen.def-radioactive-decay-d1.${idx}`, generated: true, concepts: ["radioactive-decay"], difficulty: 1, context: "applied",
    prompt: `A radioactive isotope with a half-life of ${H} days starts at ${A} mg. How much remains after ${H * k} days? Use $N = ${A} \\cdot (1/2)^{t/${H}}$.`,
    steps: [
      { instruction: `How many half-lives pass in ${H * k} days? Compute $${H * k}/${H}$.`, answer: `${k}`, accept: [], hint: `Divide elapsed time by the ${H}-day half-life.` },
      { instruction: `Compute $${A} \\cdot (1/2)^${k}$.`, answer: `${val}`, accept: [], hint: `$(1/2)^${k} = 1/${2 ** k}$, and $${A}/${2 ** k}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "mg" }, solutionNarrative: `In ${H * k} days there are ${k} half-lives, so $N = ${A} \\cdot (1/2)^${k} = ${val}$ mg.`,
  };
};
fill["def-radioactive-decay-d3"] = (rng, idx) => {
  const pct = rng.pick([0.6, 0.7, 0.8]), lnMap = { 0.6: 0.5108, 0.7: 0.3567, 0.8: 0.2231 };
  const lnVal = lnMap[pct];
  const halfLife = rng.pick([5730, 4500, 6000]);
  const k = round2(0.6931 / halfLife * 1e8) / 1e8;
  const kStr = k.toExponential ? (0.6931 / halfLife).toFixed(8) : `${k}`;
  const kNum = Math.round((0.6931 / halfLife) * 1e8) / 1e8;
  const age = Math.round(lnVal / kNum);
  return {
    id: `gen.def-radioactive-decay-d3.${idx}`, generated: true, concepts: ["radioactive-decay"], difficulty: 3, context: "applied",
    prompt: `A wooden artifact retains ${Math.round(pct * 100)}% of its original carbon-14. With carbon-14's half-life of ${halfLife} years, the decay constant is $k = \\frac{\\ln 2}{${halfLife}} \\approx ${kNum}$ per year. Estimate the artifact's age using $t = \\frac{-\\ln(${pct})}{k}$. Use $\\ln(${pct}) \\approx -${lnVal}$ and round to the nearest year.`,
    steps: [
      { instruction: `The model is $${pct} = e^{-kt}$. Take logs: what is $-\\ln(${pct})$?`, answer: `${lnVal}`, accept: [], hint: `$\\ln(${pct}) \\approx -${lnVal}$, so its negative is positive ${lnVal}.` },
      { instruction: `Divide by $k$ to get the age: $\\frac{${lnVal}}{${kNum}}$ (round to the nearest year).`, answer: `${age}`, accept: [`${age - 1}`, `${age + 1}`], hint: `Divide ${lnVal} by ${kNum}.` },
    ],
    finalAnswer: { value: `${age}`, unit: "years" }, solutionNarrative: `$t = \\frac{-\\ln ${pct}}{k} = \\frac{${lnVal}}{${kNum}} \\approx ${age}$ years.`,
  };
};

// newtons-cooling: d1, d3
fill["def-newtons-cooling-d1"] = (rng, idx) => {
  const Ts = rng.int(15, 25), diff = rng.int(50, 90), k = 0.1, t = 10; // exponent -1
  const val = round2(Ts + diff / E2);
  return {
    id: `gen.def-newtons-cooling-d1.${idx}`, generated: true, concepts: ["newtons-cooling"], difficulty: 1, context: "applied",
    prompt: `An object at ${Ts + diff}°C sits in a ${Ts}°C room and cools as $T(t) = ${Ts} + ${diff}\\, e^{-0.1 t}$ (°C, $t$ in minutes). What is its temperature after ${t} minutes? Use $e \\approx 2.718$ and round to two decimals.`,
    steps: [
      { instruction: `Compute the exponent $-0.1 \\times ${t}$.`, answer: "-1", accept: [], hint: "Multiply the cooling constant by the time." },
      { instruction: `Evaluate $${Ts} + ${diff}\\, e^{-1}$ and round to two decimals.`, answer: `${val}`, accept: [], hint: `$${diff} e^{-1} \\approx ${round2(diff / E2)}$, then add the room temperature ${Ts}.` },
    ],
    finalAnswer: { value: `${val}`, unit: "°C" }, solutionNarrative: `The exponent is $-1$, so $T = ${Ts} + ${diff} e^{-1} \\approx ${val}$°C.`,
  };
};
fill["def-newtons-cooling-d3"] = (rng, idx) => {
  const Ts = rng.pick([65, 70, 75]), T0 = Ts + rng.pick([120, 130, 150]), k = 0.08, target = Ts + rng.int(20, 40);
  const diff = T0 - Ts, targetDiff = target - Ts;
  const ratio = round2(targetDiff / diff * 100000) / 100000;
  const lnRatio = round2(Math.log(targetDiff / diff) * 10000) / 10000;
  const t = round2(-lnRatio / k * 100) / 100;
  return {
    id: `gen.def-newtons-cooling-d3.${idx}`, generated: true, concepts: ["newtons-cooling"], difficulty: 3, context: "applied",
    prompt: `An object at ${T0}° is set in a ${Ts}° room and cools as $T(t) = ${Ts} + ${diff}\\, e^{-${k} t}$ (minutes). How many minutes until it reaches ${target}°? Solve $${target} = ${Ts} + ${diff}\\, e^{-${k} t}$. Use $\\ln(${targetDiff}/${diff}) \\approx ${lnRatio}$ and round to two decimals.`,
    steps: [
      { instruction: `Isolate the exponential: subtract ${Ts}, then divide by ${diff} to find $e^{-${k}t}$ (round to 5 decimals).`, answer: `${ratio}`, accept: [], hint: `$(${target} - ${Ts})/${diff} = ${targetDiff}/${diff}$.` },
      { instruction: `Take the natural log of both sides: what is $-${k}\\, t$ equal to?`, answer: `${lnRatio}`, accept: [], hint: `$\\ln(${ratio}) \\approx ${lnRatio}$.` },
      { instruction: `Solve for $t$ by dividing by $-${k}$ (round to two decimals).`, answer: `${t}`, accept: [], hint: `$t = \\frac{${lnRatio}}{-${k}}$.` },
    ],
    finalAnswer: { value: `${t}`, unit: "minutes" }, solutionNarrative: `$e^{-${k}t} = ${targetDiff}/${diff} \\approx ${ratio}$. Then $-${k}t = \\ln(${ratio}) \\approx ${lnRatio}$, so $t \\approx ${t}$ minutes.`,
  };
};

// limiting-and-logistic: d1, d3
fill["def-limiting-and-logistic-d1"] = (rng, idx) => {
  const K = rng.int(2, 12) * 100, A = rng.int(2, 9), r = rng.pick([0.3, 0.4, 0.5]);
  return {
    id: `gen.def-limiting-and-logistic-d1.${idx}`, generated: true, concepts: ["limiting-and-logistic"], difficulty: 1, context: "applied",
    prompt: `A population follows the logistic model $P(t) = \\frac{${K}}{1 + ${A}\\, e^{-${r} t}}$. As the years pass, what value (the carrying capacity) does the population approach?`,
    steps: [
      { instruction: `As $t \\to \\infty$, the term $e^{-${r} t}$ approaches what number?`, answer: "0", accept: [], hint: "A negative exponential decays toward zero over time." },
      { instruction: `With that term gone, the denominator becomes $1 + 0 = 1$. What does $P$ approach?`, answer: `${K}`, accept: [], hint: `$P \\to ${K}/(1+0)$.` },
    ],
    finalAnswer: { value: `${K}`, unit: "" }, solutionNarrative: `As $t \\to \\infty$, $e^{-${r}t} \\to 0$, so $P \\to \\frac{${K}}{1+0} = ${K}$ — the carrying capacity.`,
  };
};
fill["def-limiting-and-logistic-d3"] = (rng, idx) => {
  const K = rng.pick([1000, 1200, 1500]), A = rng.pick([3, 4, 5]), r = 0.5, t = 4; // exponent -2
  const eNeg2 = 0.13534;
  const denomExact = 1 + A * eNeg2;
  const denom = Math.round(denomExact * 100000) / 100000;
  const pop = Math.round(K / denom);
  return {
    id: `gen.def-limiting-and-logistic-d3.${idx}`, generated: true, concepts: ["limiting-and-logistic"], difficulty: 3, context: "applied",
    prompt: `A wildlife reserve models its herd as $P(t) = \\frac{${K}}{1 + ${A}\\, e^{-${r} t}}$. Find the herd size after ${t} years, and confirm the long-run ceiling. Use $e^{-2} \\approx ${eNeg2}$ and round the herd size to the nearest animal.`,
    steps: [
      { instruction: `Compute the exponent $-${r} \\times ${t}$.`, answer: "-2", accept: [], hint: "Multiply the rate by the time." },
      { instruction: `Compute the denominator $1 + ${A}\\, e^{-2}$ (round to 5 decimals).`, answer: `${denom}`, accept: [], hint: `$${A} \\cdot ${eNeg2} \\approx ${round2(A * eNeg2)}$, then add 1.` },
      { instruction: `Compute the herd size $P = ${K} / ${denom}$ (round to the nearest animal).`, answer: `${pop}`, accept: [`${pop - 1}`, `${pop + 1}`], hint: `Divide ${K} by your denominator.` },
      { instruction: "What is the long-run carrying capacity (the value $P$ approaches as $t \\to \\infty$)?", answer: `${K}`, accept: [], hint: "As $t \\to \\infty$ the exponential term vanishes, leaving $K/1$." },
    ],
    finalAnswer: { value: `${pop}`, unit: "animals" }, solutionNarrative: `At $t=${t}$, denominator $\\approx ${denom}$, $P \\approx ${pop}$. As $t\\to\\infty$, $P \\to ${K}$.`,
  };
};

// ============================================================================
// second-order-linear.json
// ============================================================================

// characteristic-equation: d1, d3
fill["def-characteristic-equation-d1"] = (rng, idx) => {
  const r1 = nz(rng, -6, 6), r2 = nz(rng, -6, 6), b = -(r1 + r2), c = r1 * r2;
  return {
    id: `gen.def-characteristic-equation-d1.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 1, context: "abstract",
    prompt: `Write the characteristic equation for $y'' ${signed(b)}y' ${signed(c)}y = 0$, then find its roots.`,
    steps: [
      { instruction: "Replace $y''$ with $r^2$, $y'$ with $r$, and $y$ with $1$ to write the characteristic equation.", answer: `r^2 ${signed(b)}r ${signed(c)} = 0`, accept: [`r^2${signed(b).replace(/\s/g, "")}r${signed(c).replace(/\s/g, "")}=0`], hint: "Each derivative becomes a power of $r$." },
      { instruction: "Factor and solve for both roots. Separate them with 'or' or a comma.", form: "solutions", answer: `r = ${r1} or r = ${r2}`, accept: [`${r1}, ${r2}`], hint: "Factor the quadratic in $r$." },
    ],
    finalAnswer: { value: `r = ${r1}, ${r2}`, unit: "" }, solutionNarrative: `Roots $r = ${r1}, ${r2}$.`,
  };
};
fill["def-characteristic-equation-d3"] = (rng, idx) => {
  const a = rng.pick([2, 3]), r1 = nz(rng, -5, 5);
  // a r^2 + b r + c = 0 with roots r1 (nice) and -r1*2/a-ish; construct via a*(r-r1)*(a*r - m) for a clean second root as fraction
  const m = nz(rng, -6, 6);
  // a*r^2 - (a*r1 + m)*r + r1*m = 0  => roots r1, m/a
  const b = -(a * r1 + m), c = r1 * m;
  const secondRoot = frac(m, a);
  return {
    id: `gen.def-characteristic-equation-d3.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 3, context: "abstract",
    prompt: `Write the characteristic equation for $${a}y'' ${signed(b)}y' ${signed(c)}y = 0$, then find its roots.`,
    steps: [
      { instruction: "Write the characteristic equation (keep the leading coefficient).", answer: `${a}r^2 ${signed(b)}r ${signed(c)} = 0`, accept: [`${a}r^2${signed(b).replace(/\s/g, "")}r${signed(c).replace(/\s/g, "")}=0`], hint: "The coefficient on $y''$ becomes the coefficient on $r^2$." },
      { instruction: "Solve for both roots.", form: "solutions", answer: `r = ${r1} or r = ${secondRoot}`, accept: [`${r1}, ${secondRoot}`, `${secondRoot}, ${r1}`], hint: "Factor the quadratic in $r$." },
    ],
    finalAnswer: { value: `r = ${r1}, ${secondRoot}`, unit: "" }, solutionNarrative: `Roots $r = ${r1}$ and $r = ${secondRoot}$.`,
  };
};

// classify-roots: d1, d3
fill["def-classify-roots-d1"] = (rng, idx) => {
  const type = rng.pick(["real distinct", "repeated", "complex"]);
  let b, c;
  if (type === "real distinct") { const r1 = nz(rng, -4, 4); let r2 = nz(rng, -4, 4); if (r2 === r1) r2 += 1; b = -(r1 + r2); c = r1 * r2; }
  else if (type === "repeated") { const r = nz(rng, -4, 4); b = -2 * r; c = r * r; }
  else { b = nz(rng, -3, 3); c = Math.ceil(b * b / 4) + rng.int(1, 4); }
  const D = b * b - 4 * c;
  return {
    id: `gen.def-classify-roots-d1.${idx}`, generated: true, concepts: ["classify-roots"], difficulty: 1, context: "abstract",
    prompt: `Classify the roots of $y'' ${signed(b)}y' ${signed(c)}y = 0$ as real distinct, repeated, or complex.`,
    steps: [
      { instruction: "Compute the discriminant $b^2 - 4ac$ (here $a=1$).", answer: `${D}`, accept: [], hint: `$(${b})^2 - 4(1)(${c})$.` },
      { instruction: "Classify the roots in words.", answer: type, accept: type === "real distinct" ? ["two real roots", "real and distinct", "distinct real roots"] : type === "repeated" ? ["double root", "repeated root", "repeated real root"] : ["complex roots", "complex conjugate", "complex conjugates"], hint: "Positive discriminant → real distinct; zero → repeated; negative → complex." },
    ],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant ${D}, so ${type} roots.`,
  };
};
fill["def-classify-roots-d3"] = (rng, idx) => {
  const type = rng.pick(["real distinct", "repeated", "complex"]);
  const a = rng.pick([2, 4]);
  let b, c;
  if (type === "real distinct") { const r1 = nz(rng, -4, 4); let r2 = nz(rng, -4, 4); if (r2 === r1) r2 += 1; b = -a * (r1 + r2); c = a * r1 * r2; }
  else if (type === "repeated") { const r = nz(rng, -4, 4); b = -2 * a * r; c = a * r * r; }
  else { b = nz(rng, -6, 6); c = Math.ceil(b * b / (4 * a)) + rng.int(1, 5); }
  const D = b * b - 4 * a * c;
  return {
    id: `gen.def-classify-roots-d3.${idx}`, generated: true, concepts: ["classify-roots"], difficulty: 3, context: "applied",
    prompt: `A mechanical system is governed by $${a}y'' ${signed(b)}y' ${signed(c)}y = 0$. Write its characteristic equation and classify the roots.`,
    steps: [
      { instruction: "Write the characteristic equation.", answer: `${a}r^2 ${signed(b)}r ${signed(c)} = 0`, accept: [`${a}r^2${signed(b).replace(/\s/g, "")}r${signed(c).replace(/\s/g, "")}=0`], hint: `$y'' \\to r^2$, $y' \\to r$, $y \\to 1$.` },
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=${a}$, $b=${b}$, $c=${c}$).`, answer: `${D}`, accept: [], hint: `$(${b})^2 - 4(${a})(${c})$.` },
      { instruction: "Classify the roots in words.", answer: type, accept: type === "real distinct" ? ["two real roots", "real and distinct", "distinct real roots"] : type === "repeated" ? ["double root", "repeated root", "repeated real root"] : ["complex roots", "complex conjugate", "complex conjugates"], hint: "Positive discriminant → real distinct; zero → repeated; negative → complex." },
    ],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant $${D}$, so ${type} roots.`,
  };
};

// discriminant-and-behavior: d1, d2, d3
fill["def-discriminant-and-behavior-d1"] = (rng, idx) => {
  const type = rng.pick(["overdamped", "critically damped", "underdamped"]);
  let b, c;
  if (type === "overdamped") { const r1 = nz(rng, -5, -1); let r2 = nz(rng, -5, -1); if (r2 === r1) r2 -= 1; b = -(r1 + r2); c = r1 * r2; }
  else if (type === "critically damped") { const r = nz(rng, -5, -1); b = -2 * r; c = r * r; }
  else { b = rng.int(1, 4); c = Math.ceil(b * b / 4) + rng.int(1, 4); }
  const D = b * b - 4 * c;
  return {
    id: `gen.def-discriminant-and-behavior-d1.${idx}`, generated: true, concepts: ["discriminant-and-behavior"], difficulty: 1, context: "applied",
    prompt: `A damped system is $y'' ${signed(b)}y' ${signed(c)}y = 0$. Compute the discriminant of its characteristic equation and state the damping type.`,
    steps: [
      { instruction: "Compute the discriminant $b^2 - 4ac$ (here $a=1$).", answer: `${D}`, accept: [], hint: `$(${b})^2 - 4(1)(${c})$.` },
      { instruction: "What damping type is this?", answer: type, accept: type === "overdamped" ? ["over damped", "over-damped"] : type === "critically damped" ? ["critical damping", "critical", "critically-damped"] : ["under damped", "under-damped"], hint: "Positive discriminant → overdamped; zero → critically damped; negative → underdamped." },
    ],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant ${D} gives ${type}.`,
  };
};
fill["def-discriminant-and-behavior-d2"] = (rng, idx) => {
  const type = rng.pick(["overdamped", "critically damped", "underdamped"]);
  const m = rng.pick([1, 2]);
  let b, c;
  if (type === "overdamped") { const r1 = nz(rng, -5, -1); let r2 = nz(rng, -5, -1); if (r2 === r1) r2 -= 1; b = -m * (r1 + r2); c = m * r1 * r2; }
  else if (type === "critically damped") { const r = nz(rng, -5, -1); b = -2 * m * r; c = m * r * r; }
  else { b = rng.int(1, 4); c = Math.ceil(b * b / (4 * m)) + rng.int(1, 4); }
  const D = b * b - 4 * m * c;
  return {
    id: `gen.def-discriminant-and-behavior-d2.${idx}`, generated: true, concepts: ["discriminant-and-behavior"], difficulty: 2, context: "applied",
    prompt: `A shock absorber is modeled by $${m}y'' ${signed(b)}y' ${signed(c)}y = 0$. Compute the discriminant and state the damping type.`,
    steps: [
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=${m}$, $b=${b}$, $c=${c}$).`, answer: `${D}`, accept: [], hint: `$(${b})^2 - 4(${m})(${c})$.` },
      { instruction: "What damping type is this?", answer: type, accept: type === "overdamped" ? ["over damped", "over-damped"] : type === "critically damped" ? ["critical damping", "critical", "critically-damped"] : ["under damped", "under-damped"], hint: "Positive discriminant → overdamped; zero → critically damped; negative → underdamped." },
    ],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant ${D} gives ${type}.`,
  };
};
fill["def-discriminant-and-behavior-d3"] = (rng, idx) => {
  const m = rng.pick([1, 2]);
  const cVal = rng.int(5, 12);
  const bVal = nz(rng, 1, 8);
  const D = bVal * bVal - 4 * m * cVal;
  const type = D > 0 ? "overdamped" : D === 0 ? "critically damped" : "underdamped";
  return {
    id: `gen.def-discriminant-and-behavior-d3.${idx}`, generated: true, concepts: ["discriminant-and-behavior"], difficulty: 3, context: "applied",
    prompt: `A series RLC circuit gives $${m}q'' + ${bVal}q' + ${cVal}q = 0$ for the charge $q$. Write the characteristic equation, compute the discriminant, and state whether the circuit is overdamped, critically damped, or underdamped.`,
    steps: [
      { instruction: "Write the characteristic equation.", answer: `${m}r^2 + ${bVal}r + ${cVal} = 0`, accept: [`${m}r^2+${bVal}r+${cVal}=0`], hint: `$q'' \\to r^2$, $q' \\to r$, $q \\to 1$.` },
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=${m}$, $b=${bVal}$, $c=${cVal}$).`, answer: `${D}`, accept: [], hint: `$${bVal}^2 - 4(${m})(${cVal})$.` },
      { instruction: "What damping type is this?", answer: type, accept: type === "overdamped" ? ["over damped", "over-damped"] : type === "critically damped" ? ["critical damping", "critical", "critically-damped"] : ["under damped", "under-damped"], hint: "Positive discriminant → overdamped; zero → critically damped; negative → underdamped." },
    ],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant $${D}$ gives ${type}.`,
  };
};

// oscillation-applied: d1, d3
fill["def-oscillation-applied-d1"] = (rng, idx) => {
  const w = rng.int(2, 10), k = w * w;
  return {
    id: `gen.def-oscillation-applied-d1.${idx}`, generated: true, concepts: ["oscillation-applied"], difficulty: 1, context: "applied",
    prompt: `An undamped spring-mass system is $y'' + ${k}y = 0$ (so $k/m = ${k}$). Find its natural angular frequency $\\omega$.`,
    steps: [{ instruction: `The characteristic equation is $r^2 + ${k} = 0$, so $r = \\pm i\\omega$. Compute $\\omega = \\sqrt{k/m}$ in rad/s.`, answer: `${w}`, accept: [`${w} rad/s`], hint: `$\\omega = \\sqrt{${k}}$.` }],
    finalAnswer: { value: `${w}`, unit: "rad/s" }, solutionNarrative: `$r^2 = -${k}$ gives $r = \\pm ${w}i$, so $\\omega = \\sqrt{${k}} = ${w}$ rad/s.`,
  };
};
fill["def-oscillation-applied-d3"] = (rng, idx) => {
  const w = rng.int(2, 8), m = rng.pick([1, 2, 4]), k = w * w * m;
  const period = round2(2 * Math.PI / w * 100) / 100;
  return {
    id: `gen.def-oscillation-applied-d3.${idx}`, generated: true, concepts: ["oscillation-applied"], difficulty: 3, context: "applied",
    prompt: `A spring-mass system $m y'' + k y = 0$ has $m = ${m}$ and $k = ${k}$ (undamped). Find the period $T$ of one full oscillation. Round to two decimal places.`,
    steps: [
      { instruction: "Find the natural angular frequency $\\omega = \\sqrt{k/m}$ in rad/s.", answer: `${w}`, accept: [`${w} rad/s`], hint: `$\\omega = \\sqrt{${k}/${m}}$.` },
      { instruction: "Compute the period $T = 2\\pi/\\omega$ in seconds, rounded to two decimals.", answer: `${period}`, accept: [`${period} s`, `${period} seconds`], hint: `$T = 2\\pi / ${w}$.` },
    ],
    finalAnswer: { value: `${period}`, unit: "seconds" }, solutionNarrative: `$\\omega = \\sqrt{${k}/${m}} = ${w}$ rad/s, so $T = 2\\pi/${w} \\approx ${period}$ s.`,
  };
};

// ============================================================================
// numerical-methods.json
// ============================================================================

// eulers-method-single-step: d2, d3
fill["def-eulers-method-single-step-d2"] = (rng, idx) => {
  const a = nz(rng, -3, 3), x0 = rng.int(0, 3), y0 = rng.int(-4, 6), h = rng.pick([0.2, 0.5]);
  const slope = x0 - a * y0;
  const y1 = round2(y0 + h * slope);
  return {
    id: `gen.def-eulers-method-single-step-d2.${idx}`, generated: true, concepts: ["eulers-method-single-step"], difficulty: 2, context: "abstract",
    prompt: `Given $\\frac{dy}{dx} = x - ${a}y$ with $y(${x0}) = ${y0}$ and step size $h = ${h}$, perform one Euler step to estimate $y(${round2(x0 + h)})$.`,
    steps: [
      { instruction: `Compute the slope $f(${x0}, ${y0}) = x - ${a}y$.`, answer: `${slope}`, accept: [], hint: `$${x0} - ${a}(${y0})$.` },
      { instruction: "Apply $y_1 = y_0 + h \\cdot f$. Compute $y_1$.", answer: `${y1}`, accept: [], hint: `$${y0} + ${h} \\times ${slope}$.` },
    ],
    finalAnswer: { value: `${y1}`, unit: "" }, solutionNarrative: `Slope $= ${x0} - ${a}(${y0}) = ${slope}$. Step: $y_1 = ${y0} + ${h}(${slope}) = ${y1}$.`,
  };
};
fill["def-eulers-method-single-step-d3"] = (rng, idx) => {
  const x0 = rng.int(1, 3), y0 = round2(rng.int(5, 20) / 4), h = rng.pick([0.1, 0.2, 0.25]);
  const slope = round2(x0 * y0 - 1);
  const y1 = round2(y0 + h * slope);
  return {
    id: `gen.def-eulers-method-single-step-d3.${idx}`, generated: true, concepts: ["eulers-method-single-step"], difficulty: 3, context: "abstract",
    prompt: `Given $\\frac{dy}{dx} = xy - 1$ with $y(${x0}) = ${y0}$ and step size $h = ${h}$, perform one Euler step to estimate $y(${round2(x0 + h)})$.`,
    steps: [
      { instruction: `Compute the slope $f(${x0}, ${y0}) = xy - 1$.`, answer: `${slope}`, accept: [], hint: `$${x0} \\times ${y0} - 1$.` },
      { instruction: "Apply $y_1 = y_0 + h \\cdot f$. Compute $y_1$.", answer: `${y1}`, accept: [], hint: `$${y0} + ${h} \\times ${slope}$.` },
    ],
    finalAnswer: { value: `${y1}`, unit: "" }, solutionNarrative: `Slope $= ${x0}(${y0}) - 1 = ${slope}$. Step: $y_1 = ${y0} + ${h}(${slope}) = ${y1}$.`,
  };
};

// eulers-method-multi-step: d1, d3
fill["def-eulers-method-multi-step-d1"] = (rng, idx) => {
  const a = rng.int(1, 3), y0 = rng.int(1, 5);
  const y1 = y0 + 1 * (a * y0);
  const y2 = y1 + 1 * (a * y1);
  return {
    id: `gen.def-eulers-method-multi-step-d1.${idx}`, generated: true, concepts: ["eulers-method-multi-step"], difficulty: 1, context: "abstract",
    prompt: `Given $\\frac{dy}{dx} = ${a}y$ with $y(0) = ${y0}$ and step size $h = 1$, take two Euler steps to estimate $y(2)$.`,
    steps: [
      { instruction: `Step 1: slope $= ${a}y = ${a}(${y0})$. Compute $y_1 = ${y0} + 1(${a * y0})$.`, answer: `${y1}`, accept: [], hint: `$${y0} + ${a * y0}$.` },
      { instruction: `Step 2: slope $= ${a}y_1 = ${a}(${y1})$. Compute $y_2 = ${y1} + 1(${a * y1})$.`, answer: `${y2}`, accept: [], hint: `$${y1} + ${a * y1}$.` },
    ],
    finalAnswer: { value: `${y2}`, unit: "" }, solutionNarrative: `Step 1: $y_1 = ${y0} + ${a}(${y0}) = ${y1}$. Step 2: $y_2 = ${y1} + ${a}(${y1}) = ${y2}$.`,
  };
};
fill["def-eulers-method-multi-step-d3"] = (rng, idx) => {
  const y0 = rng.int(1, 4), h = 0.5;
  // dy/dx = y - x, x0 = 0
  let x = 0, y = y0;
  const steps = [];
  for (let i = 0; i < 3; i++) {
    const slope = round2(y - x);
    const yNext = round2(y + h * slope);
    steps.push({ x, y, slope, yNext });
    x = round2(x + h);
    y = yNext;
  }
  return {
    id: `gen.def-eulers-method-multi-step-d3.${idx}`, generated: true, concepts: ["eulers-method-multi-step"], difficulty: 3, context: "abstract",
    prompt: `Given $\\frac{dy}{dx} = y - x$ with $y(0) = ${y0}$ and step size $h = ${h}$, take three Euler steps to estimate $y(1.5)$.`,
    steps: [
      { instruction: `Step 1 at $(${steps[0].x}, ${steps[0].y})$: slope $= ${steps[0].y} - ${steps[0].x} = ${steps[0].slope}$. Compute $y_1 = ${steps[0].y} + ${h}(${steps[0].slope})$.`, answer: `${steps[0].yNext}`, accept: [], hint: `$${steps[0].y} + ${h} \\times ${steps[0].slope}$.` },
      { instruction: `Step 2 at $(${steps[1].x}, ${steps[1].y})$: slope $= ${steps[1].y} - ${steps[1].x} = ${steps[1].slope}$. Compute $y_2 = ${steps[1].y} + ${h}(${steps[1].slope})$.`, answer: `${steps[1].yNext}`, accept: [], hint: `$${steps[1].y} + ${h} \\times ${steps[1].slope}$.` },
      { instruction: `Step 3 at $(${steps[2].x}, ${steps[2].y})$: slope $= ${steps[2].y} - ${steps[2].x} = ${steps[2].slope}$. Compute $y_3 = ${steps[2].y} + ${h}(${steps[2].slope})$.`, answer: `${steps[2].yNext}`, accept: [], hint: `$${steps[2].y} + ${h} \\times ${steps[2].slope}$.` },
    ],
    finalAnswer: { value: `${steps[2].yNext}`, unit: "" }, solutionNarrative: `Step 1: $y_1 = ${steps[0].yNext}$. Step 2: $y_2 = ${steps[1].yNext}$. Step 3: $y_3 = ${steps[2].yNext}$. So $y(1.5) \\approx ${steps[2].yNext}$.`,
  };
};

// step-size-and-error: d1, d2, d3
fill["def-step-size-and-error-d1"] = (rng, idx) => {
  const y0 = rng.int(1, 5), exactMult = round2(y0 * E2 * 100) / 100; // y(1) exact = y0*e (approx via E2)
  const estimate = 2 * y0; // one Euler step h=1: y1 = y0 + 1*y0 = 2y0
  const err = round2(Math.abs(exactMult - estimate) * 1000) / 1000;
  return {
    id: `gen.def-step-size-and-error-d1.${idx}`, generated: true, concepts: ["step-size-and-error"], difficulty: 1, context: "abstract",
    prompt: `For $\\frac{dy}{dx} = y$ with $y(0) = ${y0}$, one Euler step with $h = 1$ estimates $y(1) \\approx ${estimate}$. The exact value is $y(1) = ${y0}e \\approx ${exactMult}$. What is the error $|\\text{exact} - \\text{estimate}|$? Round to 3 decimals.`,
    steps: [{ instruction: `Subtract the estimate from the exact value (then take the absolute value). Compute $|${exactMult} - ${estimate}|$.`, answer: `${err}`, accept: [], hint: `$${exactMult} - ${estimate}$.` }],
    finalAnswer: { value: `${err}`, unit: "" }, solutionNarrative: `Error $= |${exactMult} - ${estimate}| = ${err}$.`,
  };
};
fill["def-step-size-and-error-d2"] = (rng, idx) => {
  const y0 = rng.int(1, 5);
  const exact = round2(y0 * E2 * 100) / 100;
  // two steps h=0.5: y1 = y0*1.5; y2 = y1*1.5 = y0*2.25
  const y1 = round2(y0 * 1.5);
  const y2 = round2(y1 * 1.5);
  const err = round2(Math.abs(exact - y2) * 1000) / 1000;
  return {
    id: `gen.def-step-size-and-error-d2.${idx}`, generated: true, concepts: ["step-size-and-error"], difficulty: 2, context: "abstract",
    prompt: `For $\\frac{dy}{dx} = y$ with $y(0) = ${y0}$, use $h = 0.5$ and take two Euler steps to re-estimate $y(1)$, then compare to the exact $${y0}e \\approx ${exact}$.`,
    steps: [
      { instruction: `Step 1: slope $= ${y0}$, so $y_1 = ${y0} + 0.5(${y0})$. Compute $y_1$.`, answer: `${y1}`, accept: [], hint: `$${y0} + 0.5 \\times ${y0}$.` },
      { instruction: `Step 2: slope $= ${y1}$, so $y_2 = ${y1} + 0.5(${y1})$. Compute $y_2$.`, answer: `${y2}`, accept: [], hint: `$${y1} + 0.5 \\times ${y1}$.` },
      { instruction: `Compute the error $|${exact} - ${y2}|$. Round to 3 decimals.`, answer: `${err}`, accept: [], hint: `$${exact} - ${y2}$.` },
    ],
    finalAnswer: { value: `${err}`, unit: "" }, solutionNarrative: `$y_1=${y1}$, $y_2=${y2}$. Error $= |${exact} - ${y2}| = ${err}$.`,
  };
};
fill["def-step-size-and-error-d3"] = (rng, idx) => {
  const y0 = rng.int(2, 8);
  const exact = round2(y0 / E2 * 10000) / 10000; // y(1) = y0 e^{-1}
  // h=1: y1 = y0 - y0 = 0
  const oneStep = 0;
  // h=0.5 two steps: y1 = y0*0.5; y2 = y1*0.5 = y0*0.25
  const twoStepY1 = round2(y0 * 0.5);
  const twoStepY2 = round2(twoStepY1 * 0.5);
  const errBetter = round2(Math.abs(exact - twoStepY2) * 10000) / 10000;
  return {
    id: `gen.def-step-size-and-error-d3.${idx}`, generated: true, concepts: ["step-size-and-error"], difficulty: 3, context: "abstract",
    prompt: `For $\\frac{dy}{dx} = -y$ with $y(0) = ${y0}$, estimate $y(1)$ two ways and compare to the exact value $${y0}e^{-1} \\approx ${exact}$. First with $h = 1$ (one step), then with $h = 0.5$ (two steps).`,
    steps: [
      { instruction: `One step, $h = 1$: slope $= -y = -${y0}$, so $y_1 = ${y0} + 1(-${y0})$. Compute $y_1$.`, answer: `${oneStep}`, accept: [], hint: `$${y0} - ${y0}$.` },
      { instruction: `Two steps, $h = 0.5$: step 1 slope $= -${y0}$, $y_1 = ${y0} + 0.5(-${y0}) = ${twoStepY1}$; step 2 slope $= -${twoStepY1}$, $y_2 = ${twoStepY1} + 0.5(-${twoStepY1})$. Compute $y_2$.`, answer: `${twoStepY2}`, accept: [], hint: `$${twoStepY1} - ${round2(twoStepY1 * 0.5)}$.` },
      { instruction: `Which estimate is closer to ${exact} — type the error of the better one, $|${exact} - ${twoStepY2}|$, rounded to 4 decimals.`, answer: `${errBetter}`, accept: [], hint: `The $h=0.5$ estimate is ${twoStepY2}; compute $${exact} - ${twoStepY2}$.` },
    ],
    finalAnswer: { value: `${errBetter}`, unit: "" }, solutionNarrative: `With $h=1$: $y_1=${oneStep}$. With $h=0.5$: $y_2=${twoStepY2}$ (error $|${exact}-${twoStepY2}|=${errBetter}$), the finer step is closer.`,
  };
};

// numerical-applied: d1, d2, d3
fill["def-numerical-applied-d1"] = (rng, idx) => {
  const r = rng.pick([0.1, 0.2, 0.25]), P0 = rng.int(5, 20);
  const rate = round2(r * P0 * 100) / 100;
  const P1 = round2(P0 + 1 * rate);
  return {
    id: `gen.def-numerical-applied-d1.${idx}`, generated: true, concepts: ["numerical-applied"], difficulty: 1, context: "applied",
    prompt: `A bacterial culture grows by $\\frac{dP}{dt} = ${r}P$ (thousands of cells, $t$ in hours). It starts at $P = ${P0}$ thousand. Use one Euler step with $h = 1$ to estimate the population after 1 hour.`,
    steps: [
      { instruction: `Compute the growth rate $\\frac{dP}{dt} = ${r}P$ at the start.`, answer: `${rate}`, accept: [], hint: `$${r} \\times ${P0}$.` },
      { instruction: "Apply $P_1 = P_0 + h \\cdot \\frac{dP}{dt}$. Compute $P_1$.", answer: `${P1}`, accept: [], hint: `$${P0} + 1 \\times ${rate}$.` },
    ],
    finalAnswer: { value: `${P1}`, unit: "thousand cells" }, solutionNarrative: `Rate $= ${r}(${P0}) = ${rate}$. $P_1 = ${P0} + ${rate} = ${P1}$.`,
  };
};
fill["def-numerical-applied-d2"] = (rng, idx) => {
  const P0 = rng.int(20, 60), r = rng.pick([0.04, 0.05, 0.06]);
  const rate1 = round2(r * P0 * 100) / 100;
  const P1 = round2(P0 + rate1);
  const rate2 = round2(r * P1 * 100) / 100;
  const P2 = round2(P1 + rate2);
  return {
    id: `gen.def-numerical-applied-d2.${idx}`, generated: true, concepts: ["numerical-applied"], difficulty: 2, context: "applied",
    prompt: `A town's population (thousands) follows $\\frac{dP}{dt} = ${r}P$ ($t$ in years), starting at $P = ${P0}$. Use two Euler steps with $h = 1$ to estimate the population after 2 years.`,
    steps: [
      { instruction: `Step 1 at $P = ${P0}$: rate $= ${r}(${P0}) = ${rate1}$. Compute $P_1 = ${P0} + 1(${rate1})$.`, answer: `${P1}`, accept: [], hint: `$${P0} + ${rate1}$.` },
      { instruction: `Step 2 at $P = ${P1}$: rate $= ${r}(${P1}) = ${rate2}$. Compute $P_2 = ${P1} + 1(${rate2})$.`, answer: `${P2}`, accept: [], hint: `$${P1} + ${rate2}$.` },
    ],
    finalAnswer: { value: `${P2}`, unit: "thousand people" }, solutionNarrative: `Step 1: rate $${rate1}$, $P_1=${P1}$. Step 2: rate $${rate2}$, $P_2=${P2}$.`,
  };
};
fill["def-numerical-applied-d3"] = (rng, idx) => {
  const vt = rng.pick([15, 20, 25]), k = 0.5; // dv/dt = k*vt - k*v -> terminal velocity vt
  const g = round2(k * vt * 100) / 100;
  let v = 0;
  const steps = [];
  for (let i = 0; i < 3; i++) {
    const accel = round2((g - k * v) * 100) / 100;
    const vNext = round2(v + 1 * accel);
    steps.push({ v, accel, vNext });
    v = vNext;
  }
  return {
    id: `gen.def-numerical-applied-d3.${idx}`, generated: true, concepts: ["numerical-applied"], difficulty: 3, context: "applied",
    prompt: `A falling object with drag has velocity governed by $\\frac{dv}{dt} = ${g} - ${k}v$ (m/s, $t$ in seconds), starting from rest, $v(0) = 0$. Use three Euler steps with $h = 1$ to estimate the velocity after 3 seconds.`,
    steps: [
      { instruction: `Step 1 at $v = ${steps[0].v}$: acceleration $= ${g} - ${k}(${steps[0].v}) = ${steps[0].accel}$. Compute $v_1 = ${steps[0].v} + 1(${steps[0].accel})$.`, answer: `${steps[0].vNext}`, accept: [], hint: `$${steps[0].v} + ${steps[0].accel}$.` },
      { instruction: `Step 2 at $v = ${steps[1].v}$: acceleration $= ${g} - ${k}(${steps[1].v}) = ${steps[1].accel}$. Compute $v_2 = ${steps[1].v} + 1(${steps[1].accel})$.`, answer: `${steps[1].vNext}`, accept: [], hint: `$${steps[1].v} + ${steps[1].accel}$.` },
      { instruction: `Step 3 at $v = ${steps[2].v}$: acceleration $= ${g} - ${k}(${steps[2].v}) = ${steps[2].accel}$. Compute $v_3 = ${steps[2].v} + 1(${steps[2].accel})$.`, answer: `${steps[2].vNext}`, accept: [], hint: `$${steps[2].v} + ${steps[2].accel}$.` },
    ],
    finalAnswer: { value: `${steps[2].vNext}`, unit: "m/s" }, solutionNarrative: `Step 1: $v_1=${steps[0].vNext}$. Step 2: $v_2=${steps[1].vNext}$. Step 3: $v_3=${steps[2].vNext}$ m/s. The acceleration shrinks as drag grows, so velocity climbs toward terminal velocity ${vt} m/s.`,
  };
};
