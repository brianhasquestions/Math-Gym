// gen-de-fill4.js
// Parametric generators for two wave-14 Differential Equations topics:
//   differential-equations.exact-equations
//   differential-equations.variation-of-parameters
// One template per (concept, difficulty) tier — 12 per topic, 24 total.
// Self-contained: no imports from generator.js. Exports a `fill` map of
// template-name -> generator fn (template prefix `def4-`), matching the pack
// pattern of gen-nt2-fill.js. Every answer is computed in-pack from the SAME
// randomized numbers shown in the prompt.
//
// Grader strategy (hard-won rules):
// - Exact equations keep M, N polynomial in x, y so partials, potentials F,
//   and integrating factors x^k all grade by polynomial equivalence; C from an
//   initial condition is numeric.
// - Variation of parameters never asks for symbolic e^x/trig answers: it
//   grades Wronskian VALUES at a point, polynomial Wronskians of {x, x^n},
//   polynomial u1'/u2' in the Euler frame {x, x^2}, and numeric evaluations.
// - Menu words ("exact"/"not exact", "yes"/"no", "variation"/"undetermined")
//   were negative-tested against the real grader: no cross-acceptance.

// ---------------------------------------------------------------------------
// Formatting helpers (in-pack copies)
// ---------------------------------------------------------------------------

// Coefficient in front of a symbol: 1 -> "", -1 -> "-", else the number.
const co = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);

// "x^k" with x^1 -> "x".
const xpow = (k) => (k === 1 ? "x" : `x^${k}`);

// c * x^k as a plain-text monomial (grader-friendly), c nonzero.
const mono = (c, k) => (k === 0 ? `${c}` : `${co(c)}${xpow(k)}`);

// Join monomial strings with " + " / " - " correctly given signed terms.
const joinTerms = (terms) =>
  terms
    .filter((t) => t !== null)
    .map((t, i) => (i === 0 ? t : t.startsWith("-") ? ` - ${t.slice(1)}` : ` + ${t}`))
    .join("");

// ===========================================================================
export const fill = {};

// ===========================================================================
// differential-equations.exact-equations
// Concepts: exactness-test, reconstruct-potential, implicit-solution-ivp,
//           integrating-factor
// ===========================================================================

// --- exactness-test ---

// d1: M = a y + b x, N = c x + d y — partials are constants.
fill["def4-exactness-test-d1"] = (rng, idx) => {
  const a = rng.int(2, 6), b = rng.int(1, 5), d = rng.int(1, 5);
  const exact = rng.int(0, 1) === 1;
  let c;
  if (exact) c = a;
  else do { c = rng.int(2, 6); } while (c === a);
  const verdict = exact ? "exact" : "not exact";
  return {
    id: `gen.def4-exactness-test-d1.${idx}`, generated: true, concepts: ["exactness-test"], difficulty: 1, context: "abstract",
    prompt: `Test whether $(${a}y + ${b}x)\\,dx + (${c}x + ${d}y)\\,dy = 0$ is exact.`,
    steps: [
      { instruction: `Compute $\\partial M/\\partial y$ for $M = ${a}y + ${b}x$.`, answer: `${a}`, accept: [], hint: `Differentiate with respect to $y$; the $${b}x$ term vanishes.` },
      { instruction: `Compute $\\partial N/\\partial x$ for $N = ${c}x + ${d}y$.`, answer: `${c}`, accept: [], hint: `Differentiate with respect to $x$; the $${d}y$ term vanishes.` },
      { instruction: `Compare the two partials. Type exactly 'exact' or 'not exact'.`, answer: verdict, accept: [], hint: exact ? `Both equal $${a}$.` : `$${a} \\neq ${c}$.` },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$M_y = ${a}$ and $N_x = ${c}$ — ${exact ? "equal, so the equation is exact" : "unequal, so the equation is not exact"}.`,
  };
};

// d2: M = 2a x y + b, N = c x^2 + d y — partials are linear in x.
fill["def4-exactness-test-d2"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 6), d = rng.int(1, 5);
  const exact = rng.int(0, 1) === 1;
  let c;
  if (exact) c = a;
  else do { c = rng.int(1, 4); } while (c === a);
  const verdict = exact ? "exact" : "not exact";
  return {
    id: `gen.def4-exactness-test-d2.${idx}`, generated: true, concepts: ["exactness-test"], difficulty: 2, context: "abstract",
    prompt: `Test whether $(${co(2 * a)}xy + ${b})\\,dx + (${co(c)}x^2 + ${d}y)\\,dy = 0$ is exact.`,
    steps: [
      { instruction: `Compute $\\partial M/\\partial y$ for $M = ${co(2 * a)}xy + ${b}$.`, answer: mono(2 * a, 1), accept: [], hint: `Treat $x$ as a constant; the ${b} vanishes.` },
      { instruction: `Compute $\\partial N/\\partial x$ for $N = ${co(c)}x^2 + ${d}y$.`, answer: mono(2 * c, 1), accept: [], hint: `Power rule on $${co(c)}x^2$; the $${d}y$ term vanishes.` },
      { instruction: `Compare. Type exactly 'exact' or 'not exact'.`, answer: verdict, accept: [], hint: exact ? `Both partials equal $${mono(2 * a, 1)}$.` : `$${mono(2 * a, 1)} \\neq ${mono(2 * c, 1)}$.` },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$M_y = ${mono(2 * a, 1)}$ and $N_x = ${mono(2 * c, 1)}$ — ${exact ? "equal, so exact" : "unequal, so not exact"}.`,
  };
};

// d3: M = 3a x^2 y + b y, N = c x^3 + e x — subtle single-spot mismatch.
fill["def4-exactness-test-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 5);
  const exact = rng.int(0, 1) === 1;
  const c = a; // keep the cubic parts matching; failure (if any) hides in the linear term
  let e;
  if (exact) e = b;
  else do { e = rng.int(1, 5); } while (e === b);
  const verdict = exact ? "exact" : "not exact";
  return {
    id: `gen.def4-exactness-test-d3.${idx}`, generated: true, concepts: ["exactness-test"], difficulty: 3, context: "abstract",
    prompt: `Test whether $(${co(3 * a)}x^2y + ${b}y)\\,dx + (${co(c)}x^3 + ${e}x)\\,dy = 0$ is exact. (Look closely — the mismatch, if any, is subtle.)`,
    steps: [
      { instruction: `Compute $\\partial M/\\partial y$ for $M = ${co(3 * a)}x^2y + ${b}y$.`, answer: joinTerms([mono(3 * a, 2), `${b}`]), accept: [], hint: `Every term of $M$ contains $y$ to the first power.` },
      { instruction: `Compute $\\partial N/\\partial x$ for $N = ${co(c)}x^3 + ${e}x$.`, answer: joinTerms([mono(3 * c, 2), `${e}`]), accept: [], hint: `Power rule on each term.` },
      { instruction: `Compare term by term. Type exactly 'exact' or 'not exact'.`, answer: verdict, accept: [], hint: exact ? `Both partials are $${joinTerms([mono(3 * a, 2), `${b}`])}$.` : `The $x^2$ parts match but the constants differ: $${b} \\neq ${e}$.` },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$M_y = ${joinTerms([mono(3 * a, 2), `${b}`])}$ and $N_x = ${joinTerms([mono(3 * c, 2), `${e}`])}$ — ${exact ? "identical, so exact" : "they differ in the constant term, so not exact"}.`,
  };
};

// --- reconstruct-potential ---

// d1: M = 2a x + b y, N = b x + 2c y -> F = a x^2 + b x y + c y^2.
fill["def4-reconstruct-potential-d1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4), c = rng.int(1, 4);
  return {
    id: `gen.def4-reconstruct-potential-d1.${idx}`, generated: true, concepts: ["reconstruct-potential"], difficulty: 1, context: "abstract",
    prompt: `The equation $(${co(2 * a)}x + ${co(b)}y)\\,dx + (${co(b)}x + ${co(2 * c)}y)\\,dy = 0$ is exact ($M_y = ${b} = N_x$). Reconstruct the potential $F(x, y)$.`,
    steps: [
      { instruction: `Integrate $M = ${co(2 * a)}x + ${co(b)}y$ with respect to $x$ (hold $y$ fixed; omit $g(y)$ for now).`, answer: `${co(a)}x^2 + ${co(b)}xy`, accept: [], hint: `$\\int ${co(2 * a)}x\\,dx = ${co(a)}x^2$ and $\\int ${co(b)}y\\,dx = ${co(b)}xy$.` },
      { instruction: `Differentiate your result with respect to $y$ and match against $N = ${co(b)}x + ${co(2 * c)}y$. What is $g'(y)$?`, answer: `${co(2 * c)}y`, accept: [], hint: `$\\partial_y(${co(a)}x^2 + ${co(b)}xy) = ${co(b)}x$, so the missing piece is $${co(2 * c)}y$.` },
      { instruction: `Integrate $g'(y)$ and write the full potential $F(x, y)$.`, answer: `${co(a)}x^2 + ${co(b)}xy + ${co(c)}y^2`, accept: [], hint: `$g(y) = ${co(c)}y^2$.` },
    ],
    finalAnswer: { value: `F = ${co(a)}x^2 + ${co(b)}xy + ${co(c)}y^2`, unit: "" },
    solutionNarrative: `$\\int M\\,dx = ${co(a)}x^2 + ${co(b)}xy + g(y)$; matching $F_y$ against $N$ gives $g'(y) = ${co(2 * c)}y$, so $F = ${co(a)}x^2 + ${co(b)}xy + ${co(c)}y^2$.`,
  };
};

// d2: M = 2a x y + c, N = a x^2 + 2b y -> F = a x^2 y + c x + b y^2.
fill["def4-reconstruct-potential-d2"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 4), c = rng.int(1, 6);
  return {
    id: `gen.def4-reconstruct-potential-d2.${idx}`, generated: true, concepts: ["reconstruct-potential"], difficulty: 2, context: "abstract",
    prompt: `The equation $(${co(2 * a)}xy + ${c})\\,dx + (${co(a)}x^2 + ${co(2 * b)}y)\\,dy = 0$ is exact. Reconstruct $F(x, y)$.`,
    steps: [
      { instruction: `Integrate $M = ${co(2 * a)}xy + ${c}$ with respect to $x$ (omit $g(y)$).`, answer: `${co(a)}x^2y + ${co(c)}x`, accept: [], hint: `$y$ rides along as a constant: $\\int ${co(2 * a)}xy\\,dx = ${co(a)}x^2y$.` },
      { instruction: `Match $\\partial_y$ of your result against $N = ${co(a)}x^2 + ${co(2 * b)}y$. What is $g'(y)$?`, answer: `${co(2 * b)}y`, accept: [], hint: `$\\partial_y(${co(a)}x^2y + ${co(c)}x) = ${co(a)}x^2$ already covers the $x^2$ part of $N$.` },
      { instruction: `Write the full potential $F(x, y)$.`, answer: `${co(a)}x^2y + ${co(c)}x + ${co(b)}y^2`, accept: [], hint: `$g(y) = ${co(b)}y^2$.` },
    ],
    finalAnswer: { value: `F = ${co(a)}x^2y + ${co(c)}x + ${co(b)}y^2`, unit: "" },
    solutionNarrative: `Partial integration gives $${co(a)}x^2y + ${co(c)}x + g(y)$; matching against $N$ leaves $g'(y) = ${co(2 * b)}y$, so $F = ${co(a)}x^2y + ${co(c)}x + ${co(b)}y^2$.`,
  };
};

// d3: M = 3a x^2 y + b y^2, N = a x^3 + 2b x y + c -> F = a x^3 y + b x y^2 + c y.
fill["def4-reconstruct-potential-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3), c = rng.int(1, 6);
  return {
    id: `gen.def4-reconstruct-potential-d3.${idx}`, generated: true, concepts: ["reconstruct-potential"], difficulty: 3, context: "abstract",
    prompt: `The equation $(${co(3 * a)}x^2y + ${co(b)}y^2)\\,dx + (${co(a)}x^3 + ${co(2 * b)}xy + ${c})\\,dy = 0$ is exact. Reconstruct $F(x, y)$.`,
    steps: [
      { instruction: `Integrate $M = ${co(3 * a)}x^2y + ${co(b)}y^2$ with respect to $x$ (omit $g(y)$).`, answer: `${co(a)}x^3y + ${co(b)}xy^2`, accept: [], hint: `$\\int ${co(3 * a)}x^2y\\,dx = ${co(a)}x^3y$ and $\\int ${co(b)}y^2\\,dx = ${co(b)}xy^2$.` },
      { instruction: `Differentiate your result with respect to $y$.`, answer: `${co(a)}x^3 + ${co(2 * b)}xy`, accept: [], hint: `$\\partial_y(${co(a)}x^3y) = ${co(a)}x^3$; $\\partial_y(${co(b)}xy^2) = ${co(2 * b)}xy$.` },
      { instruction: `Match against $N = ${co(a)}x^3 + ${co(2 * b)}xy + ${c}$. What is $g'(y)$?`, answer: `${c}`, accept: [], hint: `Only the constant $${c}$ is unaccounted for.` },
      { instruction: `Write the full potential $F(x, y)$.`, answer: `${co(a)}x^3y + ${co(b)}xy^2 + ${co(c)}y`, accept: [], hint: `$g(y) = ${co(c)}y$.` },
    ],
    finalAnswer: { value: `F = ${co(a)}x^3y + ${co(b)}xy^2 + ${co(c)}y`, unit: "" },
    solutionNarrative: `$\\int M\\,dx = ${co(a)}x^3y + ${co(b)}xy^2 + g(y)$; the $y$-derivative matches $N$ except for the constant $${c}$, so $g(y) = ${co(c)}y$ and $F = ${co(a)}x^3y + ${co(b)}xy^2 + ${co(c)}y$.`,
  };
};

// --- implicit-solution-ivp ---

// d1: 2x dx + 2c y dy = 0 -> F = x^2 + c y^2, C = x0^2 + c y0^2.
fill["def4-implicit-solution-ivp-d1"] = (rng, idx) => {
  const c = rng.int(1, 3), x0 = rng.int(1, 4), y0 = rng.int(1, 4);
  const C = x0 * x0 + c * y0 * y0;
  return {
    id: `gen.def4-implicit-solution-ivp-d1.${idx}`, generated: true, concepts: ["implicit-solution-ivp"], difficulty: 1, context: "abstract",
    prompt: `Solve $2x\\,dx + ${co(2 * c)}y\\,dy = 0$ with $y(${x0}) = ${y0}$.`,
    steps: [
      { instruction: `The equation is exact with $F_x = 2x$ and $F_y = ${co(2 * c)}y$. Write the potential $F(x, y)$.`, answer: `x^2 + ${co(c)}y^2`, accept: [], hint: `Integrate each piece: $\\int 2x\\,dx = x^2$ and $\\int ${co(2 * c)}y\\,dy = ${co(c)}y^2$.` },
      { instruction: `Use $y(${x0}) = ${y0}$ to find $C$ in $F(x, y) = C$.`, answer: `${C}`, accept: [`C = ${C}`, `C=${C}`], hint: `$C = ${x0}^2 + ${c} \\cdot ${y0}^2$.` },
    ],
    finalAnswer: { value: `x^2 + ${co(c)}y^2 = ${C}`, unit: "" },
    solutionNarrative: `$F = x^2 + ${co(c)}y^2$, and the initial point gives $C = ${x0 * x0} + ${c * y0 * y0} = ${C}$: the solution is the level curve $x^2 + ${co(c)}y^2 = ${C}$.`,
  };
};

// d2: F = x^2 y + b x (M = 2xy + b, N = x^2); IC at x0 = 1, then y at x1.
fill["def4-implicit-solution-ivp-d2"] = (rng, idx) => {
  const b = rng.int(1, 4), x1 = rng.int(2, 3), y1 = rng.int(1, 4);
  const C = x1 * x1 * y1 + b * x1;
  const y0 = C - b; // value at x0 = 1, integer by construction
  return {
    id: `gen.def4-implicit-solution-ivp-d2.${idx}`, generated: true, concepts: ["implicit-solution-ivp"], difficulty: 2, context: "abstract",
    prompt: `Solve $(2xy + ${b})\\,dx + x^2\\,dy = 0$ with $y(1) = ${y0}$, then find $y$ at $x = ${x1}$.`,
    steps: [
      { instruction: `The equation is exact ($M_y = 2x = N_x$). Reconstruct $F(x, y)$.`, answer: `x^2y + ${co(b)}x`, accept: [], hint: `$\\int (2xy + ${b})\\,dx = x^2y + ${co(b)}x$, and $N = x^2$ adds nothing new in $y$.` },
      { instruction: `Use $y(1) = ${y0}$ to find $C$.`, answer: `${C}`, accept: [`C = ${C}`, `C=${C}`], hint: `$C = 1^2 \\cdot ${y0} + ${b} \\cdot 1$.` },
      { instruction: `At $x = ${x1}$ the level curve reads $${x1 * x1}y + ${b * x1} = ${C}$. Solve for $y$.`, answer: `${y1}`, accept: [`y = ${y1}`, `y=${y1}`], hint: `$${x1 * x1}y = ${C - b * x1}$.` },
    ],
    finalAnswer: { value: `${y1}`, unit: "" },
    solutionNarrative: `$F = x^2y + ${co(b)}x$ and $C = ${y0} + ${b} = ${C}$. At $x = ${x1}$: $${x1 * x1}y + ${b * x1} = ${C}$ gives $y = ${y1}$.`,
  };
};

// d3: F = a x^2 + b x y + c y (M = 2a x + b y, N = b x + c); IC at x = 0, then y at x1.
fill["def4-implicit-solution-ivp-d3"] = (rng, idx) => {
  let a, b, c, y0, C, x1 = 0, y1 = 0, found = false, attempts = 0;
  do {
    a = rng.int(1, 3); b = rng.int(1, 3); c = rng.int(1, 4); y0 = rng.int(1, 6);
    C = c * y0;
    for (let t = 1; t <= 5 && !found; t++) {
      const den = b * t + c, num = C - a * t * t;
      if (num !== 0 && num % den === 0) { x1 = t; y1 = num / den; found = true; }
    }
    attempts++;
  } while (!found && attempts < 200);
  if (!found) { a = 1; b = 1; c = 1; y0 = 5; C = 5; x1 = 1; y1 = 2; }
  return {
    id: `gen.def4-implicit-solution-ivp-d3.${idx}`, generated: true, concepts: ["implicit-solution-ivp"], difficulty: 3, context: "abstract",
    prompt: `Solve $(${co(2 * a)}x + ${co(b)}y)\\,dx + (${co(b)}x + ${c})\\,dy = 0$ with $y(0) = ${y0}$, then find $y$ at $x = ${x1}$.`,
    steps: [
      { instruction: `Verify exactness mentally ($M_y = ${b} = N_x$), then reconstruct $F(x, y)$.`, answer: `${co(a)}x^2 + ${co(b)}xy + ${co(c)}y`, accept: [], hint: `$\\int M\\,dx = ${co(a)}x^2 + ${co(b)}xy$; matching $N = ${co(b)}x + ${c}$ leaves $g'(y) = ${c}$.` },
      { instruction: `Use $y(0) = ${y0}$ to find $C$.`, answer: `${C}`, accept: [`C = ${C}`, `C=${C}`], hint: `$F(0, ${y0}) = ${c} \\cdot ${y0}$.` },
      { instruction: `At $x = ${x1}$ the curve reads $${a * x1 * x1} + ${b * x1 + c}y = ${C}$. Solve for $y$.`, answer: `${y1}`, accept: [`y = ${y1}`, `y=${y1}`], hint: `$${b * x1 + c}y = ${C - a * x1 * x1}$.` },
    ],
    finalAnswer: { value: `${y1}`, unit: "" },
    solutionNarrative: `$F = ${co(a)}x^2 + ${co(b)}xy + ${co(c)}y$ with $C = ${C}$ from the initial point. At $x = ${x1}$: $${a * x1 * x1} + ${b * x1 + c}y = ${C}$, so $y = ${y1}$.`,
  };
};

// --- integrating-factor ---

// d1: a y dx + x dy = 0 -> ratio (a-1)/x, mu = x^(a-1), F = x^a y.
fill["def4-integrating-factor-d1"] = (rng, idx) => {
  const a = rng.int(3, 6); // k = a - 1 >= 2 keeps mu nontrivial
  const k = a - 1;
  return {
    id: `gen.def4-integrating-factor-d1.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 1, context: "abstract",
    prompt: `The equation $${a}y\\,dx + x\\,dy = 0$ is not exact. Find an integrating factor of the form $\\mu = x^k$.`,
    steps: [
      { instruction: `Compute $M_y - N_x$.`, answer: `${k}`, accept: [], hint: `$M_y = ${a}$ and $N_x = 1$.` },
      { instruction: `The ratio $\\dfrac{M_y - N_x}{N} = \\dfrac{${k}}{x}$ depends on $x$ alone, so $\\mu = x^k$ with $k = ${k}$. Write $\\mu$.`, answer: xpow(k), accept: [`mu = ${xpow(k)}`, `x^{${k}}`], hint: `$\\mu = e^{\\int ${k}/x\\,dx} = e^{${k}\\ln x} = ${xpow(k)}$.` },
      { instruction: `Multiply through and reconstruct: the exact equation $${a}x^{${k}}y\\,dx + x^{${a}}\\,dy = 0$ has potential $F = \\,?$`, answer: `x^${a}y`, accept: [`x^{${a}}y`, `yx^${a}`], hint: `$\\int ${a}x^{${k}}y\\,dx = x^{${a}}y$, and $N$ adds nothing new.` },
    ],
    finalAnswer: { value: `x^${a}y = C`, unit: "" },
    solutionNarrative: `$(M_y - N_x)/N = ${k}/x$, so $\\mu = ${xpow(k)}$. The repaired equation is exact with $F = x^{${a}}y$.`,
  };
};

// d2: (2y + 3b x) dx + x dy = 0 -> mu = x, F = x^2 y + b x^3.
fill["def4-integrating-factor-d2"] = (rng, idx) => {
  const b = rng.int(1, 4);
  return {
    id: `gen.def4-integrating-factor-d2.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 2, context: "abstract",
    prompt: `The equation $(2y + ${co(3 * b)}x)\\,dx + x\\,dy = 0$ is not exact. Repair it with a factor $\\mu = x^k$ and solve.`,
    steps: [
      { instruction: `Compute $M_y - N_x$.`, answer: `1`, accept: [], hint: `$M_y = 2$, $N_x = 1$.` },
      { instruction: `So $\\dfrac{M_y - N_x}{N} = \\dfrac{1}{x}$ and $\\mu = x^k$ with $k = 1$. Write $\\mu$.`, answer: `x`, accept: [`mu = x`, `x^1`], hint: `$e^{\\int 1/x\\,dx} = e^{\\ln x} = x$.` },
      { instruction: `After multiplying, $M = 2xy + ${co(3 * b)}x^2$ and $N = x^2$. Verify the test: compute $\\partial M/\\partial y$ (it should equal $N_x$).`, answer: `2x`, accept: [`2 x`], hint: `Both partials are $2x$ — the repair worked.` },
      { instruction: `Reconstruct the potential $F(x, y)$.`, answer: `x^2y + ${co(b)}x^3`, accept: [], hint: `$\\int (2xy + ${co(3 * b)}x^2)\\,dx = x^2y + ${co(b)}x^3$.` },
    ],
    finalAnswer: { value: `x^2y + ${co(b)}x^3 = C`, unit: "" },
    solutionNarrative: `$(M_y - N_x)/N = 1/x$ gives $\\mu = x$. The repaired equation is exact with $F = x^2y + ${co(b)}x^3$.`,
  };
};

// d3: ((k+1)y + c(k+2)x) dx + x dy = 0 -> mu = x^k, F = x^(k+1) y + c x^(k+2).
fill["def4-integrating-factor-d3"] = (rng, idx) => {
  const k = rng.int(2, 3), c = rng.int(1, 3);
  const my = k + 1, mcoef = c * (k + 2);
  return {
    id: `gen.def4-integrating-factor-d3.${idx}`, generated: true, concepts: ["integrating-factor"], difficulty: 3, context: "abstract",
    prompt: `The equation $(${co(my)}y + ${co(mcoef)}x)\\,dx + x\\,dy = 0$ is not exact. Find $\\mu = x^k$ and the potential of the repaired equation.`,
    steps: [
      { instruction: `Compute $M_y - N_x$.`, answer: `${k}`, accept: [], hint: `$M_y = ${my}$ and $N_x = 1$.` },
      { instruction: `So $\\dfrac{M_y - N_x}{N} = \\dfrac{${k}}{x}$, giving $\\mu = x^k$. Write $\\mu$.`, answer: xpow(k), accept: [`mu = ${xpow(k)}`, `x^{${k}}`], hint: `$k = ${k}$.` },
      { instruction: `After multiplying, $M = ${co(my)}x^{${k}}y + ${co(mcoef)}x^{${k + 1}}$ and $N = x^{${k + 1}}$. Reconstruct $F(x, y)$.`, answer: `x^${k + 1}y + ${co(c)}x^${k + 2}`, accept: [`x^{${k + 1}}y + ${co(c)}x^{${k + 2}}`], hint: `$\\int ${co(my)}x^{${k}}y\\,dx = x^{${k + 1}}y$ and $\\int ${co(mcoef)}x^{${k + 1}}\\,dx = ${co(c)}x^{${k + 2}}$.` },
    ],
    finalAnswer: { value: `x^${k + 1}y + ${co(c)}x^${k + 2} = C`, unit: "" },
    solutionNarrative: `$M_y - N_x = ${k}$ and $N = x$, so the ratio is $${k}/x$ and $\\mu = ${xpow(k)}$. The repaired equation has potential $F = x^{${k + 1}}y + ${co(c)}x^{${k + 2}}$.`,
  };
};

// ===========================================================================
// differential-equations.variation-of-parameters
// Concepts: when-uc-fails, wronskian, vop-formulas, assemble-yp
// ===========================================================================

// Forcing pool for the UC-catalog questions. `uc` = handled by undetermined
// coefficients.
const FORCINGS = [
  { tex: "\\tan t", uc: false },
  { tex: "\\sec t", uc: false },
  { tex: "\\ln t", uc: false },
  { tex: "1/t", uc: false },
  { tex: "e^{t}/t", uc: false },
  { tex: "t\\ln t", uc: false },
  { tex: "5e^{2t}", uc: true },
  { tex: "t^2", uc: true },
  { tex: "3\\sin 2t", uc: true },
  { tex: "4\\cos 3t", uc: true },
  { tex: "t e^{-t}", uc: true },
  { tex: "t^3 + 2t", uc: true },
];

// d1: single forcing — catalog yes/no, then method menu.
fill["def4-when-uc-fails-d1"] = (rng, idx) => {
  const f = rng.pick(FORCINGS);
  const inCat = f.uc ? "yes" : "no";
  const method = f.uc ? "undetermined" : "variation";
  return {
    id: `gen.def4-when-uc-fails-d1.${idx}`, generated: true, concepts: ["when-uc-fails"], difficulty: 1, context: "abstract",
    prompt: `Consider $y'' + 4y = ${f.tex}$. Decide which solution method to use.`,
    steps: [
      { instruction: `Is $${f.tex}$ in the undetermined-coefficients catalog (polynomials, exponentials, sines/cosines, and their products)? Type 'yes' or 'no'.`, answer: inCat, accept: [inCat[0]], hint: f.uc ? `Its derivatives stay inside a finite family.` : `Differentiate it: the family of derivatives never closes.` },
      { instruction: `Which method should you use (the shortcut when it applies, the general method otherwise)? Type exactly 'variation' or 'undetermined'.`, answer: method, accept: [], hint: f.uc ? `Catalog forcing: undetermined coefficients is the fast route.` : `Outside the catalog only variation of parameters works.` },
    ],
    finalAnswer: { value: method, unit: "" },
    solutionNarrative: f.uc
      ? `$${f.tex}$ is closed under differentiation, so undetermined coefficients applies (and is faster than variation of parameters).`
      : `$${f.tex}$ is not closed under differentiation — no finite guess exists, so variation of parameters is required.`,
  };
};

// d2: two contrasting forcings, yes/no each.
fill["def4-when-uc-fails-d2"] = (rng, idx) => {
  const ucPool = FORCINGS.filter((f) => f.uc);
  const nonPool = FORCINGS.filter((f) => !f.uc);
  const fa = rng.pick(nonPool);
  const fb = rng.pick(ucPool);
  return {
    id: `gen.def4-when-uc-fails-d2.${idx}`, generated: true, concepts: ["when-uc-fails"], difficulty: 2, context: "abstract",
    prompt: `For each forcing, decide whether undetermined coefficients can handle it: (a) $g = ${fa.tex}$, (b) $g = ${fb.tex}$.`,
    steps: [
      { instruction: `(a) Can undetermined coefficients handle $g = ${fa.tex}$? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: `Differentiate $${fa.tex}$ repeatedly — the family of derivatives never closes.` },
      { instruction: `(b) Can undetermined coefficients handle $g = ${fb.tex}$? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `$${fb.tex}$ is built from catalog pieces (polynomials, exponentials, sines/cosines).` },
    ],
    finalAnswer: { value: "no; yes", unit: "" },
    solutionNarrative: `$${fa.tex}$ falls outside the closed-under-differentiation catalog (variation of parameters territory), while $${fb.tex}$ has a standard undetermined-coefficients template.`,
  };
};

// d3: count UC-able forcings in a list of four.
fill["def4-when-uc-fails-d3"] = (rng, idx) => {
  // Pick 4 distinct forcings with between 1 and 3 UC-able ones.
  let chosen, count;
  do {
    const pool = [...FORCINGS];
    chosen = [];
    for (let i = 0; i < 4; i++) {
      const j = rng.int(0, pool.length - 1);
      chosen.push(pool.splice(j, 1)[0]);
    }
    count = chosen.filter((f) => f.uc).length;
  } while (count < 1 || count > 3);
  const list = chosen.map((f) => `$${f.tex}$`).join(", ");
  const ucNames = chosen.filter((f) => f.uc).map((f) => `$${f.tex}$`).join(" and ");
  return {
    id: `gen.def4-when-uc-fails-d3.${idx}`, generated: true, concepts: ["when-uc-fails"], difficulty: 3, context: "abstract",
    prompt: `Of the four forcings ${list} — how many can undetermined coefficients handle?`,
    steps: [
      { instruction: `Catalog members are polynomials, exponentials, sines/cosines, and products of those. Count the ones undetermined coefficients handles.`, answer: `${count}`, accept: [], hint: `The catalog members here: ${ucNames}.` },
      { instruction: `How many of the four therefore require variation of parameters?`, answer: `${4 - count}`, accept: [], hint: `$4 - ${count}$.` },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: `Exactly ${count} of the four (${ucNames}) are closed under differentiation; the other ${4 - count} need variation of parameters.`,
  };
};

// --- wronskian ---

// d1: {cos kt, sin kt} -> W = k (evaluate at t = 0).
fill["def4-wronskian-d1"] = (rng, idx) => {
  const k = rng.int(2, 6);
  return {
    id: `gen.def4-wronskian-d1.${idx}`, generated: true, concepts: ["wronskian"], difficulty: 1, context: "abstract",
    prompt: `Compute the Wronskian of $y_1 = \\cos ${k}t$ and $y_2 = \\sin ${k}t$ at $t = 0$. (It is constant, so this is its value everywhere.)`,
    steps: [
      { instruction: `Compute $y_2'(0)$ for $y_2 = \\sin ${k}t$.`, answer: `${k}`, accept: [], hint: `$y_2' = ${k}\\cos ${k}t$, and $\\cos 0 = 1$.` },
      { instruction: `Now $W(0) = y_1(0)\\,y_2'(0) - y_2(0)\\,y_1'(0)$ with $y_1(0) = 1$, $y_2(0) = 0$, $y_1'(0) = 0$. Compute $W(0)$.`, answer: `${k}`, accept: [`W = ${k}`, `W=${k}`], hint: `$1 \\cdot ${k} - 0 \\cdot 0$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$W = ${k}\\cos^2 ${k}t + ${k}\\sin^2 ${k}t = ${k}$ everywhere — the $\\{\\cos kt, \\sin kt\\}$ pair always has constant Wronskian $k$.`,
  };
};

// d2: {e^{at}, e^{bt}} -> W(0) = b - a. Guard a != b.
fill["def4-wronskian-d2"] = (rng, idx) => {
  let a, b;
  do { a = rng.int(-3, 5); b = rng.int(-3, 5); } while (a === b || a === 0 || b === 0);
  const W0 = b - a;
  return {
    id: `gen.def4-wronskian-d2.${idx}`, generated: true, concepts: ["wronskian"], difficulty: 2, context: "abstract",
    prompt: `Compute the Wronskian of $y_1 = e^{${a}t}$ and $y_2 = e^{${b}t}$ at $t = 0$.`,
    steps: [
      { instruction: `Compute $y_1'(0)$.`, answer: `${a}`, accept: [], hint: `$y_1' = ${a}e^{${a}t}$ and $e^0 = 1$.` },
      { instruction: `Compute $y_2'(0)$.`, answer: `${b}`, accept: [], hint: `$y_2' = ${b}e^{${b}t}$.` },
      { instruction: `With $y_1(0) = y_2(0) = 1$, compute $W(0) = y_1(0)y_2'(0) - y_2(0)y_1'(0)$.`, answer: `${W0}`, accept: [`W = ${W0}`, `W=${W0}`], hint: `$${b} - (${a})$.` },
    ],
    finalAnswer: { value: `${W0}`, unit: "" },
    solutionNarrative: `$W(t) = (${b} - (${a}))e^{${a + b}t}$, so $W(0) = ${W0}$. Distinct exponents guarantee $W \\neq 0$: a genuine fundamental set.`,
  };
};

// d3: {x, x^n} -> W = (n-1) x^n, then W(x0).
fill["def4-wronskian-d3"] = (rng, idx) => {
  const n = rng.int(2, 4), x0 = rng.int(2, 3);
  const Wcoef = n - 1;
  const Wx0 = Wcoef * x0 ** n;
  return {
    id: `gen.def4-wronskian-d3.${idx}`, generated: true, concepts: ["wronskian"], difficulty: 3, context: "abstract",
    prompt: `Compute the Wronskian of $y_1 = x$ and $y_2 = x^{${n}}$ as a polynomial in $x$, then evaluate it at $x = ${x0}$.`,
    steps: [
      { instruction: `Compute $y_2'$ for $y_2 = x^{${n}}$.`, answer: mono(n, n - 1), accept: [], hint: `Power rule.` },
      { instruction: `Compute $W = y_1 y_2' - y_2 y_1'$ as a polynomial.`, answer: mono(Wcoef, n), accept: [`W = ${mono(Wcoef, n)}`], hint: `$x(${mono(n, n - 1)}) - x^{${n}}(1) = ${mono(n, n)} - ${xpow(n)}$.` },
      { instruction: `Evaluate $W(${x0})$.`, answer: `${Wx0}`, accept: [`W(${x0}) = ${Wx0}`], hint: `$${Wcoef} \\cdot ${x0}^{${n}} = ${Wcoef} \\cdot ${x0 ** n}$.` },
    ],
    finalAnswer: { value: mono(Wcoef, n), unit: "" },
    solutionNarrative: `$W = x \\cdot ${mono(n, n - 1)} - x^{${n}} \\cdot 1 = ${mono(Wcoef, n)}$, nonzero away from the origin, and $W(${x0}) = ${Wx0}$.`,
  };
};

// --- vop-formulas ---

// d1: y'' + y = g0 (constant), {cos t, sin t}, W = 1; evaluate u' at t = 0.
fill["def4-vop-formulas-d1"] = (rng, idx) => {
  const g0 = rng.int(2, 8);
  return {
    id: `gen.def4-vop-formulas-d1.${idx}`, generated: true, concepts: ["vop-formulas"], difficulty: 1, context: "abstract",
    prompt: `For $y'' + y = ${g0}$ with $y_1 = \\cos t$, $y_2 = \\sin t$, set up the variation-of-parameters derivatives and evaluate them at $t = 0$.`,
    steps: [
      { instruction: `Compute the Wronskian of $\\{\\cos t, \\sin t\\}$ (a constant).`, answer: `1`, accept: [`W = 1`, `W=1`], hint: `$\\cos^2 t + \\sin^2 t$.` },
      { instruction: `The formula $u_1' = -y_2 g/W$ gives $u_1' = -${g0}\\sin t$. Evaluate $u_1'(0)$.`, answer: `0`, accept: [], hint: `$\\sin 0 = 0$.` },
      { instruction: `The formula $u_2' = y_1 g/W$ gives $u_2' = ${g0}\\cos t$. Evaluate $u_2'(0)$.`, answer: `${g0}`, accept: [], hint: `$\\cos 0 = 1$.` },
    ],
    finalAnswer: { value: `u1'(0) = 0, u2'(0) = ${g0}`, unit: "" },
    solutionNarrative: `With $W = 1$ and $g = ${g0}$: $u_1' = -${g0}\\sin t$ vanishes at $t = 0$, while $u_2' = ${g0}\\cos t$ starts at $${g0}$. The minus sign rides with the $y_2$ numerator.`,
  };
};

// d2: Euler frame {x, x^2}, g = a x -> u1' = -a x, u2' = a.
fill["def4-vop-formulas-d2"] = (rng, idx) => {
  const a = rng.int(2, 9);
  return {
    id: `gen.def4-vop-formulas-d2.${idx}`, generated: true, concepts: ["vop-formulas"], difficulty: 2, context: "abstract",
    prompt: `For $y'' - \\dfrac{2}{x}y' + \\dfrac{2}{x^2}y = ${co(a)}x$ with $y_1 = x$, $y_2 = x^2$, compute $u_1'$ and $u_2'$.`,
    steps: [
      { instruction: `Compute the Wronskian $W$ of $\\{x, x^2\\}$.`, answer: `x^2`, accept: [`x^{2}`, `W = x^2`], hint: `$x(2x) - x^2(1)$.` },
      { instruction: `Apply $u_1' = \\dfrac{-y_2\\,g}{W} = \\dfrac{-x^2 \\cdot ${co(a)}x}{x^2}$. Simplify.`, answer: mono(-a, 1), accept: [`u1' = ${mono(-a, 1)}`], hint: `The $x^2$ factors cancel.` },
      { instruction: `Apply $u_2' = \\dfrac{y_1\\,g}{W} = \\dfrac{x \\cdot ${co(a)}x}{x^2}$. Simplify.`, answer: `${a}`, accept: [`u2' = ${a}`], hint: `$${co(a)}x^2 / x^2$.` },
    ],
    finalAnswer: { value: `u1' = ${mono(-a, 1)}, u2' = ${a}`, unit: "" },
    solutionNarrative: `$W = x^2$; the formulas give $u_1' = -${a}x^3/x^2 = ${mono(-a, 1)}$ and $u_2' = ${a}x^2/x^2 = ${a}$ — pure polynomial arithmetic.`,
  };
};

// d3: standard-form trap: x^2 y'' - 2x y' + 2y = a x^(n+2) -> g = a x^n.
fill["def4-vop-formulas-d3"] = (rng, idx) => {
  const n = rng.int(1, 3), a = rng.int(2, 6);
  return {
    id: `gen.def4-vop-formulas-d3.${idx}`, generated: true, concepts: ["vop-formulas"], difficulty: 3, context: "abstract",
    prompt: `For $x^2y'' - 2xy' + 2y = ${co(a)}x^{${n + 2}}$ with $y_1 = x$, $y_2 = x^2$, $W = x^2$: read off $g$ correctly, then compute $u_1'$ and $u_2'$.`,
    steps: [
      { instruction: `Put the equation in standard form (divide by $x^2$). What is $g(x)$?`, answer: mono(a, n), accept: [`g = ${mono(a, n)}`], hint: `$${co(a)}x^{${n + 2}} / x^2$ — using the raw right side is the classic standard-form error.` },
      { instruction: `Compute $u_1' = \\dfrac{-y_2\\,g}{W} = \\dfrac{-x^2 \\cdot ${mono(a, n)}}{x^2}$.`, answer: mono(-a, n), accept: [`u1' = ${mono(-a, n)}`], hint: `Cancel $x^2$.` },
      { instruction: `Compute $u_2' = \\dfrac{y_1\\,g}{W} = \\dfrac{x \\cdot ${mono(a, n)}}{x^2}$.`, answer: mono(a, n - 1), accept: [`u2' = ${mono(a, n - 1)}`], hint: `One power of $x$ cancels.` },
    ],
    finalAnswer: { value: `u1' = ${mono(-a, n)}, u2' = ${mono(a, n - 1)}`, unit: "" },
    solutionNarrative: `Standard form first: $g = ${mono(a, n)}$. Then $u_1' = ${mono(-a, n)}$ and $u_2' = ${mono(a, n - 1)}$. Reading $g = ${co(a)}x^{${n + 2}}$ would wreck both formulas.`,
  };
};

// --- assemble-yp ---

// d1: given u1 = -p x^2, u2 = q x with y1 = x, y2 = x^2 -> y_p = (q - p) x^3.
fill["def4-assemble-yp-d1"] = (rng, idx) => {
  let p, q;
  do { p = rng.int(1, 5); q = rng.int(2, 8); } while (q === p); // nonzero y_p
  const diff = q - p;
  return {
    id: `gen.def4-assemble-yp-d1.${idx}`, generated: true, concepts: ["assemble-yp"], difficulty: 1, context: "abstract",
    prompt: `Given $u_1 = ${mono(-p, 2)}$ and $u_2 = ${mono(q, 1)}$ with $y_1 = x$ and $y_2 = x^2$, assemble the particular solution $y_p = u_1 y_1 + u_2 y_2$.`,
    steps: [
      { instruction: `Compute the first product $u_1 y_1$.`, answer: mono(-p, 3), accept: [], hint: `$(${mono(-p, 2)})(x)$.` },
      { instruction: `Compute the second product $u_2 y_2$.`, answer: mono(q, 3), accept: [], hint: `$(${mono(q, 1)})(x^2)$.` },
      { instruction: `Add them: $y_p = \\,?$`, answer: mono(diff, 3), accept: [`y_p = ${mono(diff, 3)}`], hint: `$${mono(-p, 3)} + ${mono(q, 3)}$.` },
    ],
    finalAnswer: { value: `y_p = ${mono(diff, 3)}`, unit: "" },
    solutionNarrative: `$y_p = (${mono(-p, 2)})(x) + (${mono(q, 1)})(x^2) = ${mono(-p, 3)} + ${mono(q, 3)} = ${mono(diff, 3)}$.`,
  };
};

// d2: full pipeline, n = 1: g = 2m x -> u1 = -m x^2, u2 = 2m x, y_p = m x^3.
fill["def4-assemble-yp-d2"] = (rng, idx) => {
  const m = rng.int(2, 5);
  return {
    id: `gen.def4-assemble-yp-d2.${idx}`, generated: true, concepts: ["assemble-yp"], difficulty: 2, context: "abstract",
    prompt: `For $x^2y'' - 2xy' + 2y = ${co(2 * m)}x^3$ (standard-form $g = ${co(2 * m)}x$) with $y_1 = x$, $y_2 = x^2$, the formulas give $u_1' = ${mono(-2 * m, 1)}$ and $u_2' = ${2 * m}$. Integrate and assemble $y_p$.`,
    steps: [
      { instruction: `Integrate $u_1' = ${mono(-2 * m, 1)}$ (no constant needed).`, answer: mono(-m, 2), accept: [`u1 = ${mono(-m, 2)}`], hint: `$\\int ${mono(-2 * m, 1)}\\,dx$.` },
      { instruction: `Integrate $u_2' = ${2 * m}$.`, answer: mono(2 * m, 1), accept: [`u2 = ${mono(2 * m, 1)}`], hint: `$\\int ${2 * m}\\,dx$.` },
      { instruction: `Assemble $y_p = u_1 y_1 + u_2 y_2$.`, answer: mono(m, 3), accept: [`y_p = ${mono(m, 3)}`], hint: `$(${mono(-m, 2)})(x) + (${mono(2 * m, 1)})(x^2) = ${mono(-m, 3)} + ${mono(2 * m, 3)}$.` },
    ],
    finalAnswer: { value: `y_p = ${mono(m, 3)}`, unit: "" },
    solutionNarrative: `$u_1 = ${mono(-m, 2)}$, $u_2 = ${mono(2 * m, 1)}$, so $y_p = ${mono(-m, 3)} + ${mono(2 * m, 3)} = ${mono(m, 3)}$.`,
  };
};

// d3: general n: g = n(n+1)m x^n -> u1 = -n m x^(n+1), u2 = (n+1) m x^n,
//     y_p = m x^(n+2); evaluate y_p(x0).
fill["def4-assemble-yp-d3"] = (rng, idx) => {
  const n = rng.int(2, 3), m = rng.int(1, 3), x0 = rng.int(2, 3);
  const a = n * (n + 1) * m; // forcing coefficient in standard form
  const u1 = -n * m, u2 = (n + 1) * m;
  const ypx0 = m * x0 ** (n + 2);
  return {
    id: `gen.def4-assemble-yp-d3.${idx}`, generated: true, concepts: ["assemble-yp"], difficulty: 3, context: "abstract",
    prompt: `For $x^2y'' - 2xy' + 2y = ${co(a)}x^{${n + 2}}$ (standard-form $g = ${mono(a, n)}$) with $y_1 = x$, $y_2 = x^2$, $W = x^2$: the formulas give $u_1' = ${mono(-a, n)}$ and $u_2' = ${mono(a, n - 1)}$. Finish the solution.`,
    steps: [
      { instruction: `Integrate $u_1' = ${mono(-a, n)}$.`, answer: mono(u1, n + 1), accept: [`u1 = ${mono(u1, n + 1)}`], hint: `$\\int ${mono(-a, n)}\\,dx = ${mono(-a, n + 1)}/${n + 1}$.` },
      { instruction: `Integrate $u_2' = ${mono(a, n - 1)}$.`, answer: mono(u2, n), accept: [`u2 = ${mono(u2, n)}`], hint: `$\\int ${mono(a, n - 1)}\\,dx = ${mono(a, n)}/${n}$.` },
      { instruction: `Assemble $y_p = u_1 y_1 + u_2 y_2$.`, answer: mono(m, n + 2), accept: [`y_p = ${mono(m, n + 2)}`], hint: `$${mono(u1, n + 2)} + ${mono(u2, n + 2)}$.` },
      { instruction: `Evaluate $y_p(${x0})$.`, answer: `${ypx0}`, accept: [], hint: `$${m} \\cdot ${x0}^{${n + 2}} = ${m} \\cdot ${x0 ** (n + 2)}$.` },
    ],
    finalAnswer: { value: `y_p = ${mono(m, n + 2)}`, unit: "" },
    solutionNarrative: `$u_1 = ${mono(u1, n + 1)}$ and $u_2 = ${mono(u2, n)}$, so $y_p = ${mono(u1, n + 2)} + ${mono(u2, n + 2)} = ${mono(m, n + 2)}$, and $y_p(${x0}) = ${ypx0}$.`,
  };
};
