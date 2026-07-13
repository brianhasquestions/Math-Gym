// gen-num3-fill.js
// Parametric generators for two wave-14 Numerical Methods topics:
//   numerical-methods.least-squares-fitting
//   numerical-methods.numerical-differentiation
// One template per (concept, difficulty) tier — 12 per topic, 24 total.
// Self-contained: no imports from generator.js. Exports a `fill` map of
// template-name -> generator fn, matching the pack pattern of gen-nt2-fill.js.
// Every answer is COMPUTED in-pack from the SAME numbers shown in the prompt.

// ---------------------------------------------------------------------------
// Helpers (all in-pack)
// ---------------------------------------------------------------------------

// Round to d decimals to kill float dust, then render without trailing zeros.
const rd = (x, d = 6) => {
  const p = 10 ** d;
  const v = Math.round(x * p) / p;
  return Object.is(v, -0) ? 0 : v;
};
const fmt = (x) => `${rd(x)}`;

const sum = (arr) => arr.reduce((s, v) => s + v, 0);

// Build a 3-point least-squares dataset with EXACT integer recovery.
// x = {m-h, m, m+h}; y_i = a + b x_i + d*(1, -2, 1). The deviation pattern
// (d, -2d, d) has zero sum and zero x-weighted sum, so the least-squares fit
// of y = a + bx recovers a and b exactly, and SSE = 6 d^2.
const lsq3 = (rng, { needResid = false } = {}) => {
  let m, h, a, b, d, xs, ys;
  do {
    m = rng.int(2, 6);
    h = rng.int(1, Math.min(3, m - 1)); // keeps every x >= 1
    a = rng.int(1, 8);
    b = rng.int(1, 4);
    d = needResid ? rng.int(1, 2) : rng.int(0, 2);
    xs = [m - h, m, m + h];
    const ds = [d, -2 * d, d];
    ys = xs.map((x, i) => a + b * x + ds[i]);
  } while (ys.some((y) => y <= 0));
  const sx = sum(xs), sy = sum(ys);
  const sxy = sum(xs.map((x, i) => x * ys[i]));
  const sxx = sum(xs.map((x) => x * x));
  const n = 3;
  const num = n * sxy - sx * sy;      // = b * den, exactly
  const den = n * sxx - sx * sx;      // = 6 h^2 > 0, always
  return { n, xs, ys, a, b, d, sse: 6 * d * d, sx, sy, sxy, sxx, num, den, xbar: sx / n, ybar: sy / n };
};

// 4-point version: x = {m-3, m-1, m+1, m+3}; deviations d*(1, -1, -1, 1)
// (zero sum, zero x-weighted sum), so a and b are recovered exactly; SSE = 4 d^2.
const lsq4 = (rng) => {
  let m, a, b, d, xs, ys;
  do {
    m = rng.int(4, 7);
    a = rng.int(1, 6);
    b = rng.int(1, 3);
    d = rng.int(1, 2);
    xs = [m - 3, m - 1, m + 1, m + 3];
    const ds = [d, -d, -d, d];
    ys = xs.map((x, i) => a + b * x + ds[i]);
  } while (ys.some((y) => y <= 0));
  const sx = sum(xs), sy = sum(ys);
  const sxy = sum(xs.map((x, i) => x * ys[i]));
  const sxx = sum(xs.map((x) => x * x));
  const n = 4;
  const num = n * sxy - sx * sy;
  const den = n * sxx - sx * sx;      // = 80, always
  return { n, xs, ys, a, b, d, sse: 4 * d * d, sx, sy, sxy, sxx, num, den, xbar: sx / n, ybar: sy / n };
};

const dataList = (xs, ys) => xs.map((x, i) => `(${x}, ${ys[i]})`).join(", ");

// ===========================================================================
export const fill = {};

// ===========================================================================
// numerical-methods.least-squares-fitting
// Concepts: residuals-and-sse, normal-equations, fitting-the-line, linearization
// ===========================================================================

// --- residuals-and-sse ---

// d1: one residual against a given line.
fill["nm3-resid-1"] = (rng, idx) => {
  const b = rng.int(1, 4), a = rng.int(1, 6);
  const x0 = rng.int(1, 6);
  let r; do { r = rng.int(-3, 3); } while (r === 0);
  const pred = b * x0 + a;
  const obs = pred + r;
  return {
    id: `gen.nm3-resid-1.${idx}`, generated: true, concepts: ["residuals-and-sse"], difficulty: 1, context: "abstract",
    prompt: `The fitted line is $\\hat{y} = ${b}x + ${a}$. Find the residual $e = y - \\hat{y}$ at the data point $(${x0}, ${obs})$.`,
    steps: [
      { instruction: `Compute the predicted value $\\hat{y} = ${b}\\cdot${x0} + ${a}$.`, answer: `${pred}`, accept: [], hint: `Plug $x = ${x0}$ into the line.` },
      { instruction: `Residual $e = y - \\hat{y} = ${obs} - ${pred}$. Compute it (sign matters).`, answer: `${r}`, accept: [], hint: `Observed minus predicted.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$\\hat{y}(${x0}) = ${pred}$, so the residual is $${obs} - ${pred} = ${r}$: the point sits ${Math.abs(r)} ${r > 0 ? "above" : "below"} the line.`,
  };
};

// d2: residuals of a 3-point dataset against its true best-fit line; SSE.
fill["nm3-resid-2"] = (rng, idx) => {
  const D = lsq3(rng, { needResid: true });
  const midResid = -2 * D.d;
  return {
    id: `gen.nm3-resid-2.${idx}`, generated: true, concepts: ["residuals-and-sse"], difficulty: 2, context: "abstract",
    prompt: `For the data $${dataList(D.xs, D.ys)}$, the least-squares line is $\\hat{y} = ${D.b}x + ${D.a}$. The residuals are $${D.d}, ${midResid}, ${D.d}$ in order. Verify the middle one and compute the SSE $= \\sum e_i^2$.`,
    steps: [
      { instruction: `Compute the residual at the middle point $(${D.xs[1]}, ${D.ys[1]})$: $e = ${D.ys[1]} - (${D.b}\\cdot${D.xs[1]} + ${D.a})$.`, answer: `${midResid}`, accept: [], hint: `Observed minus predicted; it comes out negative.` },
      { instruction: `Sum the squared residuals: $SSE = ${D.d}^2 + (${midResid})^2 + ${D.d}^2$.`, answer: `${D.sse}`, accept: [], hint: `$${D.d * D.d} + ${4 * D.d * D.d} + ${D.d * D.d}$.` },
    ],
    finalAnswer: { value: `${D.sse}`, unit: "" },
    solutionNarrative: `The residuals $${D.d}, ${midResid}, ${D.d}$ sum to zero (they always do for a least-squares line), and $SSE = ${D.sse}$.`,
  };
};

// d3: compare SSE of two candidate lines; the least-squares one must win.
fill["nm3-resid-3"] = (rng, idx) => {
  const D = lsq3(rng, { needResid: true });
  const s = rng.int(1, 2); // vertical shift of the rival line
  const sseTrue = D.sse;
  const sseShift = D.sse + 3 * s * s; // residuals d_i - s; cross term vanishes
  const trueIsA = rng.pick([true, false]);
  const lineA = trueIsA ? { b: D.b, a: D.a, sse: sseTrue } : { b: D.b, a: D.a + s, sse: sseShift };
  const lineB = trueIsA ? { b: D.b, a: D.a + s, sse: sseShift } : { b: D.b, a: D.a, sse: sseTrue };
  const winner = trueIsA ? "A" : "B";
  return {
    id: `gen.nm3-resid-3.${idx}`, generated: true, concepts: ["residuals-and-sse"], difficulty: 3, context: "abstract",
    prompt: `Two candidate lines are proposed for the data $${dataList(D.xs, D.ys)}$: line A is $\\hat{y} = ${lineA.b}x + ${lineA.a}$ and line B is $\\hat{y} = ${lineB.b}x + ${lineB.a}$. Compute each SSE and decide which line fits better in the least-squares sense.`,
    steps: [
      { instruction: `Compute the SSE of line A (square each residual $y_i - (${lineA.b}x_i + ${lineA.a})$ and add).`, answer: `${lineA.sse}`, accept: [], hint: `Three residuals; square and sum.` },
      { instruction: `Compute the SSE of line B the same way.`, answer: `${lineB.sse}`, accept: [], hint: `Same three points, other line.` },
      { instruction: `Which line has the smaller SSE? Answer with one of: A, B.`, answer: winner, accept: [winner.toLowerCase()], hint: `Smaller SSE = better least-squares fit.` },
    ],
    finalAnswer: { value: winner, unit: "" },
    solutionNarrative: `Line A has $SSE = ${lineA.sse}$ and line B has $SSE = ${lineB.sse}$, so line ${winner} is the better least-squares fit — in fact it is the least-squares line itself.`,
  };
};

// --- normal-equations ---

// d1: the four sums.
fill["nm3-normal-1"] = (rng, idx) => {
  const D = lsq3(rng);
  return {
    id: `gen.nm3-normal-1.${idx}`, generated: true, concepts: ["normal-equations"], difficulty: 1, context: "abstract",
    prompt: `For the data $${dataList(D.xs, D.ys)}$, compute the sums $\\Sigma x$ and $\\Sigma y$ needed by the normal equations.`,
    steps: [
      { instruction: `$\\Sigma x = ${D.xs.join(" + ")} = $ ?`, answer: `${D.sx}`, accept: [], hint: `Add the x-values.` },
      { instruction: `$\\Sigma y = ${D.ys.join(" + ")} = $ ?`, answer: `${D.sy}`, accept: [], hint: `Add the y-values.` },
    ],
    finalAnswer: { value: `${D.sy}`, unit: "" },
    solutionNarrative: `$\\Sigma x = ${D.sx}$ and $\\Sigma y = ${D.sy}$ — two of the four sums that feed the normal equations.`,
  };
};

// d2: sum of products and sum of squares.
fill["nm3-normal-2"] = (rng, idx) => {
  const D = lsq3(rng);
  const prods = D.xs.map((x, i) => `${x}\\cdot${D.ys[i]}`).join(" + ");
  const sqs = D.xs.map((x) => `${x}^2`).join(" + ");
  return {
    id: `gen.nm3-normal-2.${idx}`, generated: true, concepts: ["normal-equations"], difficulty: 2, context: "abstract",
    prompt: `For the data $${dataList(D.xs, D.ys)}$, compute $\\Sigma xy$ and $\\Sigma x^2$ (these appear in the slope formula $b = \\frac{n\\Sigma xy - \\Sigma x\\,\\Sigma y}{n\\Sigma x^2 - (\\Sigma x)^2}$).`,
    steps: [
      { instruction: `$\\Sigma xy = ${prods} = $ ?`, answer: `${D.sxy}`, accept: [], hint: `Multiply each pair, then add.` },
      { instruction: `$\\Sigma x^2 = ${sqs} = $ ?`, answer: `${D.sxx}`, accept: [], hint: `Square each x, then add.` },
    ],
    finalAnswer: { value: `${D.sxx}`, unit: "" },
    solutionNarrative: `$\\Sigma xy = ${D.sxy}$ and $\\Sigma x^2 = ${D.sxx}$: with $\\Sigma x = ${D.sx}$ and $\\Sigma y = ${D.sy}$ these determine the best-fit slope and intercept.`,
  };
};

// d3: full slope from the sums.
fill["nm3-normal-3"] = (rng, idx) => {
  const D = lsq3(rng);
  return {
    id: `gen.nm3-normal-3.${idx}`, generated: true, concepts: ["normal-equations"], difficulty: 3, context: "abstract",
    prompt: `For the data $${dataList(D.xs, D.ys)}$ the sums are $\\Sigma x = ${D.sx}$, $\\Sigma y = ${D.sy}$, $\\Sigma x^2 = ${D.sxx}$. Compute $\\Sigma xy$, then the slope $b = \\dfrac{n\\Sigma xy - \\Sigma x\\,\\Sigma y}{n\\Sigma x^2 - (\\Sigma x)^2}$ with $n = 3$.`,
    steps: [
      { instruction: `$\\Sigma xy = $ ? (multiply each $x_i y_i$ and add)`, answer: `${D.sxy}`, accept: [], hint: `${D.xs.map((x, i) => `${x * D.ys[i]}`).join(" + ")}.` },
      { instruction: `Numerator: $n\\Sigma xy - \\Sigma x\\,\\Sigma y = 3\\cdot${D.sxy} - ${D.sx}\\cdot${D.sy} = $ ?`, answer: `${D.num}`, accept: [], hint: `$${3 * D.sxy} - ${D.sx * D.sy}$.` },
      { instruction: `Denominator: $n\\Sigma x^2 - (\\Sigma x)^2 = 3\\cdot${D.sxx} - ${D.sx}^2 = $ ?`, answer: `${D.den}`, accept: [], hint: `$${3 * D.sxx} - ${D.sx * D.sx}$.` },
      { instruction: `Slope $b = ${D.num}/${D.den} = $ ?`, answer: `${D.b}`, accept: [], hint: `The division comes out exact.` },
    ],
    finalAnswer: { value: `${D.b}`, unit: "" },
    solutionNarrative: `$b = \\dfrac{3\\cdot${D.sxy} - ${D.sx}\\cdot${D.sy}}{3\\cdot${D.sxx} - ${D.sx}^2} = \\dfrac{${D.num}}{${D.den}} = ${D.b}$.`,
  };
};

// --- fitting-the-line ---

// d1: intercept from slope and means.
fill["nm3-fitline-1"] = (rng, idx) => {
  const b = rng.int(1, 4);
  const xbar = rng.int(2, 6);
  const a = rng.int(1, 8);
  const ybar = a + b * xbar;
  return {
    id: `gen.nm3-fitline-1.${idx}`, generated: true, concepts: ["fitting-the-line"], difficulty: 1, context: "abstract",
    prompt: `A least-squares fit has slope $b = ${b}$, and the data means are $\\bar{x} = ${xbar}$, $\\bar{y} = ${ybar}$. Find the intercept from $a = \\bar{y} - b\\bar{x}$ (the best-fit line always passes through $(\\bar{x}, \\bar{y})$).`,
    steps: [
      { instruction: `Compute $b\\bar{x} = ${b}\\cdot${xbar}$.`, answer: `${b * xbar}`, accept: [], hint: `Slope times the mean of x.` },
      { instruction: `Intercept $a = ${ybar} - ${b * xbar} = $ ?`, answer: `${a}`, accept: [], hint: `$\\bar{y} - b\\bar{x}$.` },
    ],
    finalAnswer: { value: `${a}`, unit: "" },
    solutionNarrative: `$a = \\bar{y} - b\\bar{x} = ${ybar} - ${b * xbar} = ${a}$, so the fitted line is $\\hat{y} = ${b}x + ${a}$.`,
  };
};

// d2: full fit of a perfect 3-point dataset, then predict.
fill["nm3-fitline-2"] = (rng, idx) => {
  let D;
  do { D = lsq3(rng); } while (D.d !== 0); // perfect-fit data keeps tier-2 arithmetic light
  const xq = D.xs[2] + rng.int(1, 3);
  const yq = D.a + D.b * xq;
  return {
    id: `gen.nm3-fitline-2.${idx}`, generated: true, concepts: ["fitting-the-line"], difficulty: 2, context: "abstract",
    prompt: `Fit $\\hat{y} = a + bx$ to the data $${dataList(D.xs, D.ys)}$. The sums are $\\Sigma x = ${D.sx}$, $\\Sigma y = ${D.sy}$, $\\Sigma xy = ${D.sxy}$, $\\Sigma x^2 = ${D.sxx}$, $n = 3$. Then predict $y$ at $x = ${xq}$.`,
    steps: [
      { instruction: `Slope $b = \\dfrac{3\\cdot${D.sxy} - ${D.sx}\\cdot${D.sy}}{3\\cdot${D.sxx} - ${D.sx}^2} = $ ?`, answer: `${D.b}`, accept: [], hint: `Numerator $${D.num}$, denominator $${D.den}$.` },
      { instruction: `Intercept $a = \\bar{y} - b\\bar{x} = ${fmt(D.ybar)} - ${D.b}\\cdot${fmt(D.xbar)} = $ ?`, answer: `${D.a}`, accept: [], hint: `Means: $\\bar{x} = ${fmt(D.xbar)}$, $\\bar{y} = ${fmt(D.ybar)}$.` },
      { instruction: `Predict at $x = ${xq}$: $\\hat{y} = ${D.a} + ${D.b}\\cdot${xq} = $ ?`, answer: `${yq}`, accept: [], hint: `Plug into the fitted line.` },
    ],
    finalAnswer: { value: `${yq}`, unit: "" },
    solutionNarrative: `The fit is $\\hat{y} = ${D.b}x + ${D.a}$ (here it passes exactly through all three points), and $\\hat{y}(${xq}) = ${yq}$.`,
  };
};

// d3: full fit of a noisy 4-point dataset, then predict.
fill["nm3-fitline-3"] = (rng, idx) => {
  const D = lsq4(rng);
  const xq = D.xs[3] + 2;
  const yq = D.a + D.b * xq;
  return {
    id: `gen.nm3-fitline-3.${idx}`, generated: true, concepts: ["fitting-the-line"], difficulty: 3, context: "applied",
    prompt: `A technician logs four calibration readings $${dataList(D.xs, D.ys)}$ and fits $\\hat{y} = a + bx$ by least squares. The sums are $\\Sigma x = ${D.sx}$, $\\Sigma y = ${D.sy}$, $\\Sigma xy = ${D.sxy}$, $\\Sigma x^2 = ${D.sxx}$, $n = 4$. Find the line and predict the reading at $x = ${xq}$.`,
    steps: [
      { instruction: `Slope $b = \\dfrac{4\\cdot${D.sxy} - ${D.sx}\\cdot${D.sy}}{4\\cdot${D.sxx} - ${D.sx}^2} = $ ?`, answer: `${D.b}`, accept: [], hint: `Numerator $${D.num}$, denominator $${D.den}$.` },
      { instruction: `Intercept $a = \\bar{y} - b\\bar{x} = ${fmt(D.ybar)} - ${D.b}\\cdot${fmt(D.xbar)} = $ ?`, answer: `${D.a}`, accept: [], hint: `Means: $\\bar{x} = ${fmt(D.xbar)}$, $\\bar{y} = ${fmt(D.ybar)}$.` },
      { instruction: `Predict at $x = ${xq}$: $\\hat{y} = ${D.a} + ${D.b}\\cdot${xq} = $ ?`, answer: `${yq}`, accept: [], hint: `Evaluate the fitted line.` },
    ],
    finalAnswer: { value: `${yq}`, unit: "" },
    solutionNarrative: `The least-squares line is $\\hat{y} = ${D.b}x + ${D.a}$ (the noise pattern averages out), giving $\\hat{y}(${xq}) = ${yq}$. Its SSE is $${D.sse}$ — no line does better.`,
  };
};

// --- linearization ---

// d1: which model becomes linear under the named transform — menu.
fill["nm3-linearize-1"] = (rng, idx) => {
  const variants = [
    { plot: "\\log y$ against $x", ans: "exponential", why: `$y = C\\,10^{kx}$ gives $\\log y = \\log C + kx$ — linear in $x$.` },
    { plot: "\\log y$ against $\\log x", ans: "power", why: `$y = C x^m$ gives $\\log y = \\log C + m \\log x$ — linear in $\\log x$.` },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.nm3-linearize-1.${idx}`, generated: true, concepts: ["linearization"], difficulty: 1, context: "abstract",
    prompt: `Data are plotted as $${v.plot}$ and fall on a straight line. Which model does that reveal? Answer with one of: exponential, power, linear.`,
    steps: [
      { instruction: `Type exactly one of: exponential, power, linear.`, answer: v.ans, accept: [], hint: `Take logs of each model form and see which becomes a straight line in the plotted coordinates.` },
    ],
    finalAnswer: { value: v.ans, unit: "" },
    solutionNarrative: v.why,
  };
};

// d2: exponential data with power-of-10 values — fit the log line.
fill["nm3-linearize-2"] = (rng, idx) => {
  const a0 = rng.int(0, 1);   // log C
  const b0 = rng.int(1, 2);   // k
  const ys = [0, 1, 2].map((x) => 10 ** (a0 + b0 * x));
  const C = 10 ** a0;
  return {
    id: `gen.nm3-linearize-2.${idx}`, generated: true, concepts: ["linearization"], difficulty: 2, context: "abstract",
    prompt: `The data $(0, ${ys[0]}), (1, ${ys[1]}), (2, ${ys[2]})$ follow $y = C\\cdot 10^{kx}$. Linearize by taking $\\log_{10}$ of the y-values, then read off $k$ and $C$.`,
    steps: [
      { instruction: `Compute $\\log_{10}(${ys[1]})$ (the transformed value at $x = 1$).`, answer: `${a0 + b0}`, accept: [], hint: `${ys[1]} is a power of 10.` },
      { instruction: `The transformed points are $(0, ${a0}), (1, ${a0 + b0}), (2, ${a0 + 2 * b0})$ — a straight line. Its slope is $k = $ ?`, answer: `${b0}`, accept: [], hint: `Rise over run between consecutive points.` },
      { instruction: `The intercept of the log-line is $\\log_{10} C = ${a0}$, so $C = $ ?`, answer: `${C}`, accept: [], hint: `$10^{${a0}}$.` },
    ],
    finalAnswer: { value: `${b0}`, unit: "" },
    solutionNarrative: `Taking logs turns the exponential into the straight line $\\log y = ${a0} + ${b0}x$, so $k = ${b0}$ and $C = 10^{${a0}} = ${C}$.`,
  };
};

// d3: power-law data on a log-log plot.
fill["nm3-linearize-3"] = (rng, idx) => {
  const c = rng.int(0, 1);    // log C
  const mExp = rng.int(2, 3); // exponent m
  const y1 = 10 ** (c + mExp);      // at x = 10
  const y2 = 10 ** (c + 2 * mExp);  // at x = 100
  const C = 10 ** c;
  return {
    id: `gen.nm3-linearize-3.${idx}`, generated: true, concepts: ["linearization"], difficulty: 3, context: "abstract",
    prompt: `The data $(10, ${y1})$ and $(100, ${y2})$ follow a power law $y = C x^m$. Linearize with $\\log_{10}$ of BOTH coordinates (so $\\log x = 1$ and $2$), then find $m$ and $C$.`,
    steps: [
      { instruction: `Compute $\\log_{10}(${y1})$ and $\\log_{10}(${y2})$; their difference is the rise. Slope $m = \\dfrac{\\log y_2 - \\log y_1}{\\log x_2 - \\log x_1} = $ ?`, answer: `${mExp}`, accept: [], hint: `$\\dfrac{${c + 2 * mExp} - ${c + mExp}}{2 - 1}$.` },
      { instruction: `Extend the log-log line back to $\\log x = 0$: the intercept is $\\log_{10} C = ${c + mExp} - ${mExp} = ${c}$. So $C = $ ?`, answer: `${C}`, accept: [], hint: `$10^{${c}}$.` },
    ],
    finalAnswer: { value: `${mExp}`, unit: "" },
    solutionNarrative: `On log-log axes the points are $(1, ${c + mExp})$ and $(2, ${c + 2 * mExp})$: slope $m = ${mExp}$, intercept $${c}$, so $y = ${C}x^{${mExp}}$.`,
  };
};

// ===========================================================================
// numerical-methods.numerical-differentiation
// Concepts: forward-backward-difference, central-difference,
//           second-derivative, richardson-and-error
// ===========================================================================

// --- forward-backward-difference ---

// d1: forward difference of x^2.
fill["nm3-fwd-1"] = (rng, idx) => {
  const x0 = rng.int(2, 5);
  const h = rng.pick([0.5, 0.25, 0.2]);
  const fPlus = rd((x0 + h) ** 2);
  const f0 = x0 * x0;
  const D = rd(2 * x0 + h); // exact for x^2
  return {
    id: `gen.nm3-fwd-1.${idx}`, generated: true, concepts: ["forward-backward-difference"], difficulty: 1, context: "abstract",
    prompt: `Estimate $f'(${x0})$ for $f(x) = x^2$ with the forward difference $D_+ = \\dfrac{f(x+h) - f(x)}{h}$, using $h = ${h}$.`,
    steps: [
      { instruction: `Evaluate $f(${x0} + ${h}) = (${fmt(x0 + h)})^2$.`, answer: `${fPlus}`, accept: [], hint: `Square $${fmt(x0 + h)}$.` },
      { instruction: `Form the quotient $D_+ = \\dfrac{${fPlus} - ${f0}}{${h}}$.`, answer: `${D}`, accept: [], hint: `Subtract, then divide by $${h}$.` },
    ],
    finalAnswer: { value: `${D}`, unit: "" },
    solutionNarrative: `$D_+ = \\dfrac{${fPlus} - ${f0}}{${h}} = ${D}$ — it overshoots the true derivative $${2 * x0}$ by exactly $h = ${h}$, the signature $O(h)$ error.`,
  };
};

// d2: forward AND backward on a x^2, with the error.
fill["nm3-fwd-2"] = (rng, idx) => {
  const a = rng.int(1, 3);
  const x0 = rng.int(2, 4);
  const h = rng.pick([0.5, 0.2, 0.1]);
  const truD = 2 * a * x0;
  const Dp = rd(truD + a * h);
  const Dm = rd(truD - a * h);
  const err = rd(a * h);
  return {
    id: `gen.nm3-fwd-2.${idx}`, generated: true, concepts: ["forward-backward-difference"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = ${a === 1 ? "" : a}x^2$ at $x = ${x0}$ with $h = ${h}$, compute the forward difference $D_+$, the backward difference $D_- = \\dfrac{f(x) - f(x-h)}{h}$, and the error of $D_+$ against the true $f'(${x0}) = ${truD}$.`,
    steps: [
      { instruction: `$D_+ = \\dfrac{f(${fmt(x0 + h)}) - f(${x0})}{${h}} = $ ?`, answer: `${Dp}`, accept: [], hint: `$f(${fmt(x0 + h)}) = ${fmt(a * (x0 + h) ** 2)}$ and $f(${x0}) = ${a * x0 * x0}$.` },
      { instruction: `$D_- = \\dfrac{f(${x0}) - f(${fmt(x0 - h)})}{${h}} = $ ?`, answer: `${Dm}`, accept: [], hint: `$f(${fmt(x0 - h)}) = ${fmt(a * (x0 - h) ** 2)}$.` },
      { instruction: `Error of $D_+$: $|${Dp} - ${truD}| = $ ?`, answer: `${err}`, accept: [], hint: `The two estimates straddle the true value symmetrically.` },
    ],
    finalAnswer: { value: `${err}`, unit: "" },
    solutionNarrative: `$D_+ = ${Dp}$ and $D_- = ${Dm}$ straddle the true $${truD}$; each is off by $${err}$, an error proportional to $h$ — first-order accuracy.`,
  };
};

// d3: tabulated data, both one-sided estimates, plus the order.
fill["nm3-fwd-3"] = (rng, idx) => {
  const a = rng.int(1, 2), b = rng.int(0, 3);
  const x0 = rng.int(1, 3);
  const h = rng.pick([0.5, 0.25]);
  const f = (x) => a * x * x + b * x;
  const f0 = rd(f(x0 - h)), f1 = rd(f(x0)), f2 = rd(f(x0 + h));
  const Dp = rd((f2 - f1) / h), Dm = rd((f1 - f0) / h);
  return {
    id: `gen.nm3-fwd-3.${idx}`, generated: true, concepts: ["forward-backward-difference"], difficulty: 3, context: "applied",
    prompt: `A sensor logs $f(${fmt(x0 - h)}) = ${f0}$, $f(${x0}) = ${f1}$, $f(${fmt(x0 + h)}) = ${f2}$ (spacing $h = ${h}$). Estimate $f'(${x0})$ both one-sided ways and state the order of accuracy of these formulas.`,
    steps: [
      { instruction: `Forward: $D_+ = \\dfrac{${f2} - ${f1}}{${h}} = $ ?`, answer: `${Dp}`, accept: [], hint: `Uses the point ahead.` },
      { instruction: `Backward: $D_- = \\dfrac{${f1} - ${f0}}{${h}} = $ ?`, answer: `${Dm}`, accept: [], hint: `Uses the point behind.` },
      { instruction: `Both one-sided formulas have truncation error $O(h^p)$ with $p = $ ? (Enter the number.)`, answer: `1`, accept: [], hint: `Halving $h$ halves the error — first order.` },
    ],
    finalAnswer: { value: `1`, unit: "" },
    solutionNarrative: `$D_+ = ${Dp}$, $D_- = ${Dm}$; both are first-order accurate ($p = 1$). Averaging them gives the second-order central estimate $${rd((Dp + Dm) / 2)}$.`,
  };
};

// --- central-difference ---

// d1: central difference of a x^2 (exact).
fill["nm3-central-1"] = (rng, idx) => {
  const a = rng.int(1, 3);
  const x0 = rng.int(2, 5);
  const h = rng.pick([0.5, 0.25]);
  const numTop = rd(4 * a * x0 * h); // f(x+h) - f(x-h)
  const D = 2 * a * x0;
  return {
    id: `gen.nm3-central-1.${idx}`, generated: true, concepts: ["central-difference"], difficulty: 1, context: "abstract",
    prompt: `Estimate $f'(${x0})$ for $f(x) = ${a === 1 ? "" : a}x^2$ with the central difference $D_c = \\dfrac{f(x+h) - f(x-h)}{2h}$, using $h = ${h}$.`,
    steps: [
      { instruction: `Compute the numerator $f(${fmt(x0 + h)}) - f(${fmt(x0 - h)}) = ${fmt(a * (x0 + h) ** 2)} - ${fmt(a * (x0 - h) ** 2)}$.`, answer: `${numTop}`, accept: [], hint: `Evaluate both squares, then subtract.` },
      { instruction: `Divide by $2h = ${fmt(2 * h)}$: $D_c = $ ?`, answer: `${D}`, accept: [], hint: `The result is the exact derivative $${D}$.` },
    ],
    finalAnswer: { value: `${D}`, unit: "" },
    solutionNarrative: `$D_c = \\dfrac{${numTop}}{${fmt(2 * h)}} = ${D}$ — exactly $f'(${x0})$, because the central difference is exact for quadratics.`,
  };
};

// d2: central difference of x^3: error h^2.
fill["nm3-central-2"] = (rng, idx) => {
  const x0 = rng.int(1, 3);
  const h = rng.pick([0.5, 0.2, 0.1]);
  const tru = 3 * x0 * x0;
  const D = rd(tru + h * h); // exact identity for x^3
  const err = rd(h * h);
  return {
    id: `gen.nm3-central-2.${idx}`, generated: true, concepts: ["central-difference"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = x^3$ at $x = ${x0}$ with $h = ${h}$, compute the central difference $D_c = \\dfrac{f(${fmt(x0 + h)}) - f(${fmt(x0 - h)})}{${fmt(2 * h)}}$ and its error against the true $f'(${x0})$.`,
    steps: [
      { instruction: `$D_c = \\dfrac{${fmt((x0 + h) ** 3)} - ${fmt((x0 - h) ** 3)}}{${fmt(2 * h)}} = $ ?`, answer: `${D}`, accept: [], hint: `Cube both shifted points, subtract, divide.` },
      { instruction: `True derivative: $f'(${x0}) = 3\\cdot${x0}^2 = $ ?`, answer: `${tru}`, accept: [], hint: `$3x^2$ at $x = ${x0}$.` },
      { instruction: `Error $= |${D} - ${tru}| = $ ?`, answer: `${err}`, accept: [], hint: `For $x^3$ the central-difference error is exactly $h^2$.` },
    ],
    finalAnswer: { value: `${err}`, unit: "" },
    solutionNarrative: `$D_c = ${D}$ versus the true $${tru}$: error $${err} = h^2$ on the nose — the central difference is second-order accurate.`,
  };
};

// d3: forward vs central on x^3 — compute both errors, pick the winner.
fill["nm3-central-3"] = (rng, idx) => {
  const x0 = rng.int(1, 3);
  const h = rng.pick([0.5, 0.2, 0.1]);
  const tru = 3 * x0 * x0;
  const errF = rd(3 * x0 * h + h * h);
  const errC = rd(h * h);
  return {
    id: `gen.nm3-central-3.${idx}`, generated: true, concepts: ["central-difference"], difficulty: 3, context: "abstract",
    prompt: `For $f(x) = x^3$ at $x = ${x0}$ with $h = ${h}$ (true $f'(${x0}) = ${tru}$): the forward difference gives $D_+ = ${rd(tru + 3 * x0 * h + h * h)}$ and the central difference gives $D_c = ${rd(tru + h * h)}$. Compare their errors.`,
    steps: [
      { instruction: `Error of the forward difference: $|${rd(tru + 3 * x0 * h + h * h)} - ${tru}| = $ ?`, answer: `${errF}`, accept: [], hint: `Subtract the true value.` },
      { instruction: `Error of the central difference: $|${rd(tru + h * h)} - ${tru}| = $ ?`, answer: `${errC}`, accept: [], hint: `Much smaller.` },
      { instruction: `Which formula wins at this step size? Answer with one of: forward, central.`, answer: "central", accept: [], hint: `$O(h^2)$ beats $O(h)$ once $h$ is small.` },
    ],
    finalAnswer: { value: "central", unit: "" },
    solutionNarrative: `Forward error $${errF}$ versus central error $${errC}$: the symmetric formula cancels the $O(h)$ term, so central wins by a factor of about $${rd(errF / errC, 2)}$ here.`,
  };
};

// --- second-derivative ---

// d1: second central difference of a x^2 (exact 2a).
fill["nm3-second-1"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const x0 = rng.int(2, 4);
  const h = 0.5;
  const f = (x) => a * x * x;
  const numTop = rd(f(x0 + h) - 2 * f(x0) + f(x0 - h)); // = 2 a h^2 = 0.5 a
  const res = 2 * a;
  return {
    id: `gen.nm3-second-1.${idx}`, generated: true, concepts: ["second-derivative"], difficulty: 1, context: "abstract",
    prompt: `Estimate $f''(${x0})$ for $f(x) = ${a === 1 ? "" : a}x^2$ with the central formula $f'' \\approx \\dfrac{f(x+h) - 2f(x) + f(x-h)}{h^2}$, $h = ${h}$.`,
    steps: [
      { instruction: `Numerator: $${fmt(f(x0 + h))} - 2\\cdot${fmt(f(x0))} + ${fmt(f(x0 - h))} = $ ?`, answer: `${numTop}`, accept: [], hint: `Evaluate the three values first.` },
      { instruction: `Divide by $h^2 = ${h * h}$: $f''(${x0}) \\approx $ ?`, answer: `${res}`, accept: [], hint: `The exact second derivative of $${a === 1 ? "" : a}x^2$ is $${res}$ everywhere.` },
    ],
    finalAnswer: { value: `${res}`, unit: "" },
    solutionNarrative: `$\\dfrac{${numTop}}{${h * h}} = ${res}$ — exact, since the second-difference formula has zero error on quadratics.`,
  };
};

// d2: tabulated second derivative with h != 1.
fill["nm3-second-2"] = (rng, idx) => {
  const s = rng.pick([2, 4, 6]);        // true f''
  const h = rng.pick([0.5, 2]);
  const p = rng.int(2, 8);              // f(x-h)
  const q = rng.int(p + 1, p + 9);      // f(x)
  const f2 = rd(2 * q - p + s * h * h); // forces the second difference to equal s
  const numTop = rd(s * h * h);
  const x0 = rng.int(2, 5);
  return {
    id: `gen.nm3-second-2.${idx}`, generated: true, concepts: ["second-derivative"], difficulty: 2, context: "applied",
    prompt: `A table gives $f(${fmt(x0 - h)}) = ${p}$, $f(${x0}) = ${q}$, $f(${fmt(x0 + h)}) = ${f2}$ with spacing $h = ${h}$. Estimate $f''(${x0})$ with $\\dfrac{f(x+h) - 2f(x) + f(x-h)}{h^2}$.`,
    steps: [
      { instruction: `Numerator: $${f2} - 2\\cdot${q} + ${p} = $ ?`, answer: `${numTop}`, accept: [], hint: `Watch the signs.` },
      { instruction: `Divide by $h^2 = ${rd(h * h)}$: $f''(${x0}) \\approx $ ?`, answer: `${s}`, accept: [], hint: `$${numTop} / ${rd(h * h)}$.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `The weighted sum $${f2} - ${2 * q} + ${p} = ${numTop}$ divided by $h^2 = ${rd(h * h)}$ gives $f'' \\approx ${s}$ — positive, so the data curve is concave up at $x = ${x0}$.`,
  };
};

// d3: second difference on x^4 — approx, true, error 2h^2.
fill["nm3-second-3"] = (rng, idx) => {
  const x0 = rng.int(1, 2);
  const h = 0.5;
  const f = (x) => x ** 4;
  const approx = rd(12 * x0 * x0 + 2 * h * h); // exact identity for x^4
  const tru = 12 * x0 * x0;
  const err = rd(2 * h * h);
  return {
    id: `gen.nm3-second-3.${idx}`, generated: true, concepts: ["second-derivative"], difficulty: 3, context: "abstract",
    prompt: `For $f(x) = x^4$ at $x = ${x0}$ with $h = ${h}$: $f(${fmt(x0 - h)}) = ${fmt(f(x0 - h))}$, $f(${x0}) = ${fmt(f(x0))}$, $f(${fmt(x0 + h)}) = ${fmt(f(x0 + h))}$. Apply the second-difference formula and measure its error against the true $f''(x) = 12x^2$.`,
    steps: [
      { instruction: `$f'' \\approx \\dfrac{${fmt(f(x0 + h))} - 2\\cdot${fmt(f(x0))} + ${fmt(f(x0 - h))}}{${h * h}} = $ ?`, answer: `${approx}`, accept: [], hint: `Numerator $${rd(f(x0 + h) - 2 * f(x0) + f(x0 - h))}$, then divide by $${h * h}$.` },
      { instruction: `True value: $12\\cdot${x0}^2 = $ ?`, answer: `${tru}`, accept: [], hint: `$f''(x) = 12x^2$.` },
      { instruction: `Error $= |${approx} - ${tru}| = $ ?`, answer: `${err}`, accept: [], hint: `For $x^4$ the error is exactly $2h^2$.` },
    ],
    finalAnswer: { value: `${err}`, unit: "" },
    solutionNarrative: `The formula gives $${approx}$ against the true $${tru}$: error $${err} = 2h^2$, again shrinking quadratically as the grid refines.`,
  };
};

// --- richardson-and-error ---

// d1: identify the order of accuracy — numeric menu (1 or 2).
fill["nm3-richardson-1"] = (rng, idx) => {
  const variants = [
    { name: "forward difference $\\frac{f(x+h) - f(x)}{h}$", p: 1 },
    { name: "backward difference $\\frac{f(x) - f(x-h)}{h}$", p: 1 },
    { name: "central difference $\\frac{f(x+h) - f(x-h)}{2h}$", p: 2 },
    { name: "second-derivative central formula $\\frac{f(x+h) - 2f(x) + f(x-h)}{h^2}$", p: 2 },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.nm3-richardson-1.${idx}`, generated: true, concepts: ["richardson-and-error"], difficulty: 1, context: "abstract",
    prompt: `The ${v.name} has truncation error $O(h^p)$. What is $p$? (Enter 1 or 2.)`,
    steps: [
      { instruction: `Enter the order $p$.`, answer: `${v.p}`, accept: [], hint: v.p === 1 ? `One-sided formulas keep the $O(h)$ Taylor term.` : `Symmetry cancels the odd Taylor terms, leaving $O(h^2)$.` },
    ],
    finalAnswer: { value: `${v.p}`, unit: "" },
    solutionNarrative: `The ${v.name} is order $${v.p}$: halving $h$ divides the truncation error by $${2 ** v.p}$.`,
  };
};

// d2: Richardson extrapolation on central differences of x^3 (lands exactly).
fill["nm3-richardson-2"] = (rng, idx) => {
  const x0 = rng.int(1, 3);
  const h = rng.pick([0.5, 0.4, 0.2]);
  const tru = 3 * x0 * x0;
  const Dh = rd(tru + h * h);
  const Dh2 = rd(tru + (h * h) / 4);
  const four = rd(4 * Dh2);
  return {
    id: `gen.nm3-richardson-2.${idx}`, generated: true, concepts: ["richardson-and-error"], difficulty: 2, context: "abstract",
    prompt: `Central differences for $f(x) = x^3$ at $x = ${x0}$ gave $D(h) = ${Dh}$ with $h = ${h}$ and $D(h/2) = ${Dh2}$ with $h/2 = ${fmt(h / 2)}$. Apply Richardson extrapolation $R = \\dfrac{4D(h/2) - D(h)}{3}$.`,
    steps: [
      { instruction: `Compute $4D(h/2) = 4\\cdot${Dh2}$.`, answer: `${four}`, accept: [], hint: `Just multiply.` },
      { instruction: `$R = \\dfrac{${four} - ${Dh}}{3} = $ ?`, answer: `${tru}`, accept: [], hint: `The $h^2$ error terms cancel exactly.` },
    ],
    finalAnswer: { value: `${tru}`, unit: "" },
    solutionNarrative: `$R = \\frac{${four} - ${Dh}}{3} = ${tru}$ — the exact derivative. Richardson eliminates the $h^2$ term, jumping from second- to fourth-order accuracy.`,
  };
};

// d3: truncation-vs-rounding trade-off — evaluate a total-error model.
fill["nm3-richardson-3"] = (rng, idx) => {
  const K = rng.pick([0.002, 0.004, 0.008]);
  const pair = rng.pick([[0.5, 0.1], [0.1, 0.01]]);
  const [h1, h2] = pair;
  const E = (h) => rd(h * h + K / h);
  const E1 = E(h1), E2 = E(h2);
  const winner = E1 < E2 ? "larger" : "smaller";
  return {
    id: `gen.nm3-richardson-3.${idx}`, generated: true, concepts: ["richardson-and-error"], difficulty: 3, context: "abstract",
    prompt: `In floating point, a central difference has total error about $E(h) = h^2 + \\dfrac{${K}}{h}$: truncation ($h^2$) plus rounding ($${K}/h$, which GROWS as $h$ shrinks). Evaluate $E$ at $h = ${h1}$ and $h = ${h2}$ and decide which step size is better.`,
    steps: [
      { instruction: `$E(${h1}) = ${rd(h1 * h1)} + ${fmt(rd(K / h1))} = $ ?`, answer: `${E1}`, accept: [], hint: `Add the two error contributions.` },
      { instruction: `$E(${h2}) = ${rd(h2 * h2)} + ${fmt(rd(K / h2))} = $ ?`, answer: `${E2}`, accept: [], hint: `Note how the rounding term behaves.` },
      { instruction: `Which step size gives the smaller total error here — the larger or the smaller one? Answer with one of: larger, smaller.`, answer: winner, accept: [], hint: `Shrinking $h$ helps truncation but hurts rounding; the best $h$ sits in between.` },
    ],
    finalAnswer: { value: winner, unit: "" },
    solutionNarrative: `$E(${h1}) = ${E1}$ versus $E(${h2}) = ${E2}$: the ${winner} step wins. Total error is U-shaped in $h$ — beyond the optimum, further refinement makes things WORSE.`,
  };
};
