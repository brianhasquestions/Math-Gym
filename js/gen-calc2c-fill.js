// gen-calc2c-fill.js
// Parametric generators for two Calculus 2 topics:
//   calculus-2.trigonometric-integrals  (c2t-)
//   calculus-2.trig-substitution        (c2u-)
// One template per (concept, difficulty) tier — 12 per topic, 24 total.
// Self-contained: no imports. Exports a `fill` map of template-name -> fn,
// matching the pack pattern of gen-nt2-fill.js. Every answer is computed
// in-pack from the SAME randomized numbers shown in the prompt.
//
// Grader strategy (symbolic antiderivatives are NOT machine-checkable):
// every graded step is a number, a fraction, a pi/sqrt numeric expression
// (evalNumeric handles "3pi/8", "sqrt(3)/2"), or a tested menu word
// (sine / tangent / secant — negative cross-accept verified in tools tests).

// ---------------------------------------------------------------------------
// Helpers (all in-pack)
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

// Reduced fraction string: frac(4,6) -> "2/3", frac(6,3) -> "2", frac(-2,4) -> "-1/2".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};

// Reduced multiple-of-pi string: piStr(3,4) -> "3pi/4", piStr(2,2) -> "pi",
// piStr(4,2) -> "2pi", piStr(1,8) -> "pi/8". n=0 -> "0".
const piStr = (n, d) => {
  if (n === 0) return "0";
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d) || 1;
  n /= g; d /= g;
  const coef = (Math.abs(n) === 1 ? "" : `${Math.abs(n)}`);
  return `${n < 0 ? "-" : ""}${coef}pi${d > 1 ? `/${d}` : ""}`;
};

// 4-decimal accept variant (grader widens tolerance to the decimal's grain).
const dec = (x) => x.toFixed(4);

// LaTeX for the reduced fraction n/d (for use inside prompts/hints).
const texFrac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  return d === 1 ? `${n}` : `${n < 0 ? "-" : ""}\\tfrac{${Math.abs(n)}}{${d}}`;
};

const MENU = "Answer with one of: sine, tangent, secant.";

// Pythagorean triples [legA, legB, hyp].
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29]];

// ===========================================================================
export const fill = {};

// ===========================================================================
// calculus-2.trigonometric-integrals
// Concepts: odd-power-strategies, even-power-reduction, sec-tan-integrals,
//           product-to-sum
// ===========================================================================

// --- odd-power-strategies ---

// d1: definite odd cube over [0, pi/2] with a coefficient.
fill["c2t-odd-1"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const t = rng.pick(["sin", "cos"]); // symmetric over [0, pi/2]: both give 2/3
  const u = t === "sin" ? "cos" : "sin";
  const val = frac(2 * k, 3);
  return {
    id: `gen.c2t-odd-1.${idx}`, generated: true, concepts: ["odd-power-strategies"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/2} ${k}\\${t}^3 x\\,dx$ using the odd-power strategy: peel off one $\\${t} x$ and substitute $u = \\${u} x$.`,
    steps: [
      { instruction: `Writing $\\${t}^3 x = \\${t} x\\,(1 - \\${u}^2 x)$ and substituting $u = \\${u} x$ turns the integral into $${k}\\int_0^1 (1 - u^2)\\,du$. Compute $\\int_0^1 (1 - u^2)\\,du$ as a fraction.`, answer: "2/3", accept: ["0.6667"], hint: `$\\left[u - \\tfrac{u^3}{3}\\right]_0^1 = 1 - \\tfrac{1}{3}$.` },
      { instruction: `Multiply by the coefficient: $${k} \\cdot \\tfrac{2}{3} = $ ? (fraction)`, answer: val, accept: [dec(2 * k / 3)], hint: `$\\tfrac{2 \\cdot ${k}}{3}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `Peel one $\\${t} x$, use $\\${t}^2 x = 1 - \\${u}^2 x$, and substitute $u = \\${u} x$: the integral becomes $${k}\\int_0^1 (1-u^2)\\,du = ${k} \\cdot \\tfrac{2}{3} = ${texFrac(2 * k, 3)}$.`,
  };
};

// d2: grade the antiderivative COEFFICIENTS (stated form in the instruction).
fill["c2t-odd-2"] = (rng, idx) => {
  const k = rng.int(2, 6);
  const isSin = rng.pick([true, false]);
  // ∫ k sin^3 x dx = (k/3)cos^3 x - k cos x + C      (a = k/3, b = -k)
  // ∫ k cos^3 x dx = -(k/3)sin^3 x + k sin x + C     (a = -k/3, b = k)
  const t = isSin ? "sin" : "cos", w = isSin ? "cos" : "sin";
  const aNum = isSin ? k : -k, bVal = isSin ? -k : k;
  const a = frac(aNum, 3);
  return {
    id: `gen.c2t-odd-2.${idx}`, generated: true, concepts: ["odd-power-strategies"], difficulty: 2, context: "abstract",
    prompt: `The antiderivative has the form $\\displaystyle\\int ${k}\\${t}^3 x\\,dx = a\\,\\${w}^3 x + b\\,\\${w} x + C$. Find the coefficients $a$ and $b$.`,
    steps: [
      { instruction: `Substitute $u = \\${w} x$ (so $du = ${isSin ? "-" : ""}\\${t} x\\,dx$) to get $${isSin ? `-${k}` : k}\\int (1 - u^2)\\,du$. The $u^3$ term supplies $a$. Enter $a$ as a fraction.`, answer: a, accept: [dec(aNum / 3)], hint: `$${isSin ? `-${k}` : k}\\cdot\\left(-\\tfrac{u^3}{3}\\right)$ gives the $\\${w}^3 x$ term.` },
      { instruction: `The $u$ term supplies $b$. Enter $b$.`, answer: `${bVal}`, accept: [], hint: `$${isSin ? `-${k}` : k} \\cdot u$ evaluated back at $u = \\${w} x$.` },
    ],
    finalAnswer: { value: `a = ${a}, b = ${bVal}`, unit: "" },
    solutionNarrative: `With $u = \\${w} x$: $\\int ${k}\\${t}^3 x\\,dx = ${isSin ? `-${k}` : k}\\int(1-u^2)\\,du = ${texFrac(aNum, 3)}\\${w}^3 x ${bVal >= 0 ? "+" : "-"} ${Math.abs(bVal)}\\${w} x + C$, so $a = ${texFrac(aNum, 3)}$ and $b = ${bVal}$.`,
  };
};

// d3: mixed powers sin^3 x cos^m x over [0, pi/2].
fill["c2t-odd-3"] = (rng, idx) => {
  const k = rng.int(1, 4);
  const m = rng.pick([2, 4]);
  const p1 = frac(1, m + 1), p2 = frac(1, m + 3);
  const val = frac(2 * k, (m + 1) * (m + 3));
  return {
    id: `gen.c2t-odd-3.${idx}`, generated: true, concepts: ["odd-power-strategies"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/2} ${k === 1 ? "" : k}\\sin^3 x\\,\\cos^{${m}} x\\,dx$. The sine power is odd, so substitute $u = \\cos x$: the integral becomes $${k === 1 ? "" : k}\\displaystyle\\int_0^1 u^{${m}}(1 - u^2)\\,du$.`,
    steps: [
      { instruction: `Compute $\\int_0^1 u^{${m}}\\,du$ as a fraction.`, answer: p1, accept: [dec(1 / (m + 1))], hint: `Power rule: $\\tfrac{1}{${m + 1}}$.` },
      { instruction: `Compute $\\int_0^1 u^{${m + 2}}\\,du$ as a fraction.`, answer: p2, accept: [dec(1 / (m + 3))], hint: `Power rule: $\\tfrac{1}{${m + 3}}$.` },
      { instruction: `Combine: $${k}\\left(\\tfrac{1}{${m + 1}} - \\tfrac{1}{${m + 3}}\\right) = $ ? (fraction)`, answer: val, accept: [dec(2 * k / ((m + 1) * (m + 3)))], hint: `Common denominator $${(m + 1) * (m + 3)}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `With $u = \\cos x$: $${k}\\int_0^1 (u^{${m}} - u^{${m + 2}})\\,du = ${k}\\left(\\tfrac{1}{${m + 1}} - \\tfrac{1}{${m + 3}}\\right) = ${texFrac(2 * k, (m + 1) * (m + 3))}$.`,
  };
};

// --- even-power-reduction ---

// d1: half-angle rewrite — grade the new frequency and the cos coefficient.
fill["c2t-even-1"] = (rng, idx) => {
  const c = rng.int(1, 4);
  const isSin = rng.pick([true, false]);
  const t = isSin ? "sin" : "cos";
  const b = isSin ? "-1/2" : "1/2";
  const arg = c === 1 ? "x" : `${c}x`;
  return {
    id: `gen.c2t-even-1.${idx}`, generated: true, concepts: ["even-power-reduction"], difficulty: 1, context: "abstract",
    prompt: `Rewrite $\\${t}^2(${arg})$ with the half-angle identity: $\\${t}^2(${arg}) = \\tfrac{1}{2} + b\\cos(a x)$ for some frequency $a$ and coefficient $b$.`,
    steps: [
      { instruction: `The identity doubles the frequency. What is $a$?`, answer: `${2 * c}`, accept: [], hint: `$2 \\cdot ${c}$.` },
      { instruction: `What is the coefficient $b$ of $\\cos(${2 * c}x)$? (fraction, watch the sign)`, answer: b, accept: [isSin ? "-0.5" : "0.5"], hint: isSin ? `$\\sin^2\\theta = \\tfrac{1 - \\cos 2\\theta}{2}$ — minus for sine.` : `$\\cos^2\\theta = \\tfrac{1 + \\cos 2\\theta}{2}$ — plus for cosine.` },
    ],
    finalAnswer: { value: `a = ${2 * c}, b = ${b}`, unit: "" },
    solutionNarrative: `$\\${t}^2(${arg}) = \\tfrac{1}{2} ${isSin ? "-" : "+"} \\tfrac{1}{2}\\cos(${2 * c}x)$: the half-angle identity halves the power and doubles the frequency.`,
  };
};

// d2: ∫_0^pi k sin^2 x dx = k pi / 2.
fill["c2t-even-2"] = (rng, idx) => {
  const k = rng.int(2, 6);
  const t = rng.pick(["sin", "cos"]); // both integrate to pi/2 over [0, pi]
  const val = piStr(k, 2);
  return {
    id: `gen.c2t-even-2.${idx}`, generated: true, concepts: ["even-power-reduction"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi} ${k}\\${t}^2 x\\,dx$ using the half-angle identity.`,
    steps: [
      { instruction: `After the rewrite, the constant term of the integrand is $\\tfrac{${k}}{2}$... but check it yourself: $${k}\\${t}^2 x = c + \\text{(cosine term)}$. Enter the constant $c$ as a fraction.`, answer: frac(k, 2), accept: [dec(k / 2)], hint: `$${k} \\cdot \\tfrac{1}{2}$.` },
      { instruction: `Over $[0, \\pi]$ the $\\cos 2x$ term integrates to $0$, so the answer is $\\tfrac{${k}}{2} \\cdot \\pi$. Enter it (e.g. like 3pi/2).`, answer: val, accept: [dec(k * Math.PI / 2)], hint: `Constant times the interval length $\\pi$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$${k}\\${t}^2 x = \\tfrac{${k}}{2} ${t === "sin" ? "-" : "+"} \\tfrac{${k}}{2}\\cos 2x$; the cosine integrates to 0 over a full half-period, leaving $\\tfrac{${k}}{2}\\pi$.`,
  };
};

// d3: fourth powers over [0, pi]: ∫ k sin^4 x dx = 3k pi / 8.
fill["c2t-even-3"] = (rng, idx) => {
  const k = rng.int(1, 4);
  const t = rng.pick(["sin", "cos"]); // both give 3pi/8 over [0, pi]
  const val = piStr(3 * k, 8);
  return {
    id: `gen.c2t-even-3.${idx}`, generated: true, concepts: ["even-power-reduction"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi} ${k === 1 ? "" : k}\\${t}^4 x\\,dx$ by applying the half-angle identity twice.`,
    steps: [
      { instruction: `Two rounds of reduction give $\\${t}^4 x = c ${t === "sin" ? "-" : "+"} \\tfrac{1}{2}\\cos 2x + \\tfrac{1}{8}\\cos 4x$. What is the constant $c$? (fraction)`, answer: "3/8", accept: ["0.375"], hint: `$\\left(\\tfrac{1}{2}\\right)^2 + \\tfrac{1}{2}\\cdot\\tfrac{1}{4} = \\tfrac{1}{4} + \\tfrac{1}{8}$.` },
      { instruction: `Over $[0, \\pi]$ every cosine term integrates to $0$, so the integral is $${k} \\cdot \\tfrac{3}{8} \\cdot \\pi$. Enter it (e.g. like 3pi/8).`, answer: val, accept: [dec(3 * k * Math.PI / 8)], hint: `Only the constant survives: $\\tfrac{3 \\cdot ${k}}{8}\\pi$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$\\${t}^4 x$ reduces to constant $\\tfrac{3}{8}$ plus pure cosines; over $[0,\\pi]$ the cosines vanish, so the value is $${k}\\cdot\\tfrac{3\\pi}{8}$.`,
  };
};

// --- sec-tan-integrals ---

// d1: ∫_0^{pi/4} k sec^2 x dx = k.
fill["c2t-sectan-1"] = (rng, idx) => {
  const k = rng.int(2, 7);
  return {
    id: `gen.c2t-sectan-1.${idx}`, generated: true, concepts: ["sec-tan-integrals"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/4} ${k}\\sec^2 x\\,dx$. Recall $\\dfrac{d}{dx}\\tan x = \\sec^2 x$.`,
    steps: [
      { instruction: `The antiderivative is $${k}\\tan x$. Compute $\\tan\\tfrac{\\pi}{4}$.`, answer: "1", accept: [], hint: `At $45^\\circ$, opposite = adjacent.` },
      { instruction: `Evaluate: $${k}\\tan\\tfrac{\\pi}{4} - ${k}\\tan 0 = $ ?`, answer: `${k}`, accept: [], hint: `$\\tan 0 = 0$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\int ${k}\\sec^2 x\\,dx = ${k}\\tan x$, and $${k}(\\tan\\tfrac{\\pi}{4} - \\tan 0) = ${k}(1 - 0) = ${k}$.`,
  };
};

// d2: u = tan x, or the sec x tan x -> sec x pattern.
fill["c2t-sectan-2"] = (rng, idx) => {
  const k = rng.int(2, 6);
  const variant = rng.pick(["tansec2", "sectan"]);
  if (variant === "tansec2") {
    const val = frac(k, 2);
    return {
      id: `gen.c2t-sectan-2.${idx}`, generated: true, concepts: ["sec-tan-integrals"], difficulty: 2, context: "abstract",
      prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/4} ${k}\\tan x\\,\\sec^2 x\\,dx$ with the substitution $u = \\tan x$.`,
      steps: [
        { instruction: `With $u = \\tan x$, $du = \\sec^2 x\\,dx$. The upper limit becomes $u = \\tan\\tfrac{\\pi}{4} = $ ?`, answer: "1", accept: [], hint: `$\\tan\\tfrac{\\pi}{4} = 1$.` },
        { instruction: `So the integral is $${k}\\int_0^1 u\\,du = $ ? (fraction)`, answer: val, accept: [dec(k / 2)], hint: `$${k} \\cdot \\tfrac{1}{2}$.` },
      ],
      finalAnswer: { value: val, unit: "" },
      solutionNarrative: `$u = \\tan x$ maps $[0, \\tfrac{\\pi}{4}]$ to $[0, 1]$: $${k}\\int_0^1 u\\,du = \\tfrac{${k}}{2}${k % 2 === 0 ? ` = ${k / 2}` : ""}$.`,
    };
  }
  return {
    id: `gen.c2t-sectan-2.${idx}`, generated: true, concepts: ["sec-tan-integrals"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/3} ${k}\\sec x\\tan x\\,dx$. Recall $\\dfrac{d}{dx}\\sec x = \\sec x\\tan x$.`,
    steps: [
      { instruction: `The antiderivative is $${k}\\sec x$. Compute $\\sec\\tfrac{\\pi}{3}$.`, answer: "2", accept: [], hint: `$\\cos\\tfrac{\\pi}{3} = \\tfrac{1}{2}$, and secant is its reciprocal.` },
      { instruction: `Evaluate: $${k}\\left(\\sec\\tfrac{\\pi}{3} - \\sec 0\\right) = $ ?`, answer: `${k}`, accept: [], hint: `$\\sec 0 = 1$, so $${k}(2 - 1)$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\int ${k}\\sec x\\tan x\\,dx = ${k}\\sec x$; evaluating gives $${k}(2 - 1) = ${k}$.`,
  };
};

// d3: ∫_0^{pi/4} k tan^2 x dx = k(1 - pi/4) — pi expression, no ln anywhere.
fill["c2t-sectan-3"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const piPart = piStr(k, 4);
  const val = `${k} - ${piPart}`;
  return {
    id: `gen.c2t-sectan-3.${idx}`, generated: true, concepts: ["sec-tan-integrals"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi/4} ${k}\\tan^2 x\\,dx$ using the identity $\\tan^2 x = \\sec^2 x - 1$.`,
    steps: [
      { instruction: `First piece: $\\displaystyle\\int_0^{\\pi/4} ${k}\\sec^2 x\\,dx = ${k}\\tan x\\Big|_0^{\\pi/4} = $ ?`, answer: `${k}`, accept: [], hint: `$\\tan\\tfrac{\\pi}{4} = 1$.` },
      { instruction: `Second piece: $\\displaystyle\\int_0^{\\pi/4} ${k}\\,dx = $ ? (enter a pi expression like 3pi/4)`, answer: piPart, accept: [dec(k * Math.PI / 4)], hint: `Constant times interval length: $${k} \\cdot \\tfrac{\\pi}{4}$.` },
      { instruction: `Subtract: the value is $${k} - ${piPart.replace("pi", "\\pi")}$. Enter it (like 3 - 3pi/4).`, answer: val, accept: [dec(k - k * Math.PI / 4)], hint: `sec$^2$ piece minus the constant piece.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$${k}\\tan^2 x = ${k}\\sec^2 x - ${k}$: the pieces integrate to $${k}$ and $${k}\\cdot\\tfrac{\\pi}{4}$, so the value is $${k} - \\tfrac{${k}\\pi}{4} \\approx ${dec(k - k * Math.PI / 4)}$.`,
  };
};

// --- product-to-sum ---

// d1: rewrite sin(mx)cos(nx) — grade the two new frequencies.
fill["c2t-prodsum-1"] = (rng, idx) => {
  let m, n;
  do { m = rng.int(2, 6); n = rng.int(1, 5); } while (m <= n);
  return {
    id: `gen.c2t-prodsum-1.${idx}`, generated: true, concepts: ["product-to-sum"], difficulty: 1, context: "abstract",
    prompt: `Use the product-to-sum identity $\\sin A\\cos B = \\tfrac{1}{2}[\\sin(A+B) + \\sin(A-B)]$ to write $\\sin(${m}x)\\cos(${n}x) = \\tfrac{1}{2}[\\sin(ax) + \\sin(bx)]$ with $a > b$.`,
    steps: [
      { instruction: `The sum frequency: $a = ${m} + ${n} = $ ?`, answer: `${m + n}`, accept: [], hint: `$A + B$ with $A = ${m}x$, $B = ${n}x$.` },
      { instruction: `The difference frequency: $b = ${m} - ${n} = $ ?`, answer: `${m - n}`, accept: [], hint: `$A - B$.` },
    ],
    finalAnswer: { value: `a = ${m + n}, b = ${m - n}`, unit: "" },
    solutionNarrative: `$\\sin(${m}x)\\cos(${n}x) = \\tfrac{1}{2}[\\sin(${m + n}x) + \\sin(${m - n}x)]$ — one product becomes two easy sines.`,
  };
};

// d2: definite ∫_0^pi sin(mx)cos(nx) dx with m+n odd (nonzero value).
fill["c2t-prodsum-2"] = (rng, idx) => {
  const pairs = [[2, 1], [4, 1], [4, 3], [3, 2], [5, 2], [5, 4], [6, 1], [6, 5]]; // m > n, m+n odd
  const [m, n] = rng.pick(pairs);
  const s = m + n, d = m - n;
  const val = frac(2 * m, m * m - n * n); // 1/s + 1/d
  return {
    id: `gen.c2t-prodsum-2.${idx}`, generated: true, concepts: ["product-to-sum"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{\\pi} \\sin(${m}x)\\cos(${n}x)\\,dx$ by first converting the product to a sum.`,
    steps: [
      { instruction: `Product-to-sum gives $\\tfrac{1}{2}[\\sin(sx) + \\sin(${d}x)]$ where the sum frequency $s = $ ?`, answer: `${s}`, accept: [], hint: `$${m} + ${n}$.` },
      { instruction: `For odd $j$, $\\displaystyle\\int_0^{\\pi}\\sin(jx)\\,dx = \\tfrac{2}{j}$. Compute $\\displaystyle\\int_0^{\\pi}\\sin(${s}x)\\,dx$ as a fraction.`, answer: frac(2, s), accept: [dec(2 / s)], hint: `$\\left[-\\tfrac{\\cos ${s}x}{${s}}\\right]_0^{\\pi} = \\tfrac{1 - \\cos ${s}\\pi}{${s}} = \\tfrac{2}{${s}}$ since $${s}$ is odd.` },
      { instruction: `Combine: $\\tfrac{1}{2}\\left(\\tfrac{2}{${s}} + \\tfrac{2}{${d}}\\right) = \\tfrac{1}{${s}} + \\tfrac{1}{${d}} = $ ? (fraction)`, answer: val, accept: [dec(2 * m / (m * m - n * n))], hint: `Common denominator $${s * d}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$\\sin(${m}x)\\cos(${n}x) = \\tfrac{1}{2}[\\sin(${s}x) + \\sin(${d}x)]$; both frequencies are odd, each sine contributes $\\tfrac{2}{j}$, giving $\\tfrac{1}{${s}} + \\tfrac{1}{${d}} = ${texFrac(2 * m, m * m - n * n)}$.`,
  };
};

// d3: Fourier orthogonality over a full period.
fill["c2t-prodsum-3"] = (rng, idx) => {
  let m, n;
  do { m = rng.int(2, 5); n = rng.int(1, 4); } while (m <= n);
  return {
    id: `gen.c2t-prodsum-3.${idx}`, generated: true, concepts: ["product-to-sum"], difficulty: 3, context: "applied",
    prompt: `A signal analyzer projects $\\sin(${m}x)$ onto $\\sin(${n}x)$ by computing $\\displaystyle\\int_0^{2\\pi} \\sin(${m}x)\\sin(${n}x)\\,dx$ — the Fourier orthogonality integral.`,
    steps: [
      { instruction: `Product-to-sum: $\\sin(${m}x)\\sin(${n}x) = \\tfrac{1}{2}[\\cos(bx) - \\cos(${m + n}x)]$ where the difference frequency $b = $ ?`, answer: `${m - n}`, accept: [], hint: `$${m} - ${n}$.` },
      { instruction: `Every $\\cos(jx)$ with $j \\neq 0$ integrates to $0$ over the full period $[0, 2\\pi]$. So the integral equals ?`, answer: "0", accept: [], hint: `Both cosine frequencies ($${m - n}$ and $${m + n}$) are nonzero.` },
      { instruction: `Now the matched case: $\\displaystyle\\int_0^{2\\pi} \\sin^2(${m}x)\\,dx = $ ? (a pi expression)`, answer: "pi", accept: [dec(Math.PI)], hint: `$\\sin^2 = \\tfrac{1 - \\cos(${2 * m}x)}{2}$: only the $\\tfrac{1}{2}$ survives, times $2\\pi$.` },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `Distinct frequencies are orthogonal: the product becomes $\\tfrac{1}{2}[\\cos(${m - n}x) - \\cos(${m + n}x)]$ and both cosines vanish over $[0, 2\\pi]$, giving $0$; the matched integral $\\int_0^{2\\pi}\\sin^2(${m}x)\\,dx = \\pi$ is what normalizes Fourier coefficients.`,
  };
};

// ===========================================================================
// calculus-2.trig-substitution
// Concepts: choosing-the-substitution, sine-substitution,
//           tangent-secant-substitution, completing-the-square
// ===========================================================================

// Pattern helpers: word + radicand builder.
const PATTERNS = {
  sine: { word: "sine", accept: ["sin"], radicand: (a2) => `${a2} - x^2` },
  tangent: { word: "tangent", accept: ["tan"], radicand: (a2) => `x^2 + ${a2}` },
  secant: { word: "secant", accept: ["sec"], radicand: (a2) => `x^2 - ${a2}` },
};

// --- choosing-the-substitution ---

// d1: identify the pattern and a.
fill["c2u-choose-1"] = (rng, idx) => {
  const key = rng.pick(["sine", "tangent", "secant"]);
  const a = rng.int(2, 7);
  const P = PATTERNS[key];
  const sub = key === "sine" ? `x = ${a}\\sin\\theta` : key === "tangent" ? `x = ${a}\\tan\\theta` : `x = ${a}\\sec\\theta`;
  return {
    id: `gen.c2u-choose-1.${idx}`, generated: true, concepts: ["choosing-the-substitution"], difficulty: 1, context: "abstract",
    prompt: `An integral contains $\\sqrt{${P.radicand(a * a)}}$. Choose the trig substitution.`,
    steps: [
      { instruction: `Which substitution pattern applies? ${MENU}`, answer: P.word, accept: P.accept, hint: `$a^2 - x^2 \\to$ sine, $x^2 + a^2 \\to$ tangent, $x^2 - a^2 \\to$ secant.` },
      { instruction: `In $${sub}$, what is $a$?`, answer: `${a}`, accept: [], hint: `$a = \\sqrt{${a * a}}$.` },
    ],
    finalAnswer: { value: `${P.word}, a = ${a}`, unit: "" },
    solutionNarrative: `$\\sqrt{${P.radicand(a * a)}}$ matches the ${P.word} pattern with $a = ${a}$: substitute $${sub}$.`,
  };
};

// d2: identify the pattern AND evaluate the radical at a Pythagorean point.
fill["c2u-choose-2"] = (rng, idx) => {
  const key = rng.pick(["sine", "tangent", "secant"]);
  const [l1, l2, hyp] = rng.pick(TRIPLES);
  const P = PATTERNS[key];
  // sine: a = hyp, x0 = l1, value l2; tangent: a = l1, x0 = l2, value hyp;
  // secant: a = l1, x0 = hyp, value l2.
  const a = key === "sine" ? hyp : l1;
  const x0 = key === "sine" ? l1 : key === "tangent" ? l2 : hyp;
  const v = key === "tangent" ? hyp : l2;
  return {
    id: `gen.c2u-choose-2.${idx}`, generated: true, concepts: ["choosing-the-substitution"], difficulty: 2, context: "abstract",
    prompt: `An integral contains $\\sqrt{${P.radicand(a * a)}}$.`,
    steps: [
      { instruction: `Which substitution pattern applies? ${MENU}`, answer: P.word, accept: P.accept, hint: `Match the sign pattern against $a^2 - x^2$, $x^2 + a^2$, $x^2 - a^2$.` },
      { instruction: `Sanity-check the geometry: at $x = ${x0}$, compute $\\sqrt{${P.radicand(a * a).replace("x^2", `${x0}^2`)}}$.`, answer: `${v}`, accept: [], hint: `A Pythagorean triple: $${l1}^2 + ${l2}^2 = ${hyp}^2$.` },
    ],
    finalAnswer: { value: `${P.word}, ${v}`, unit: "" },
    solutionNarrative: `The radicand matches the ${P.word} pattern with $a = ${a}$; at $x = ${x0}$ the radical is $${v}$ — the third side of the $${l1}$-$${l2}$-$${hyp}$ reference triangle.`,
  };
};

// d3: coefficient on x^2 — substitution x = (a/b) trig(theta).
fill["c2u-choose-3"] = (rng, idx) => {
  const isTan = rng.pick([true, false]);
  let a, b;
  do { b = rng.pick([2, 3, 4]); a = rng.pick([3, 5, 7, 9]); } while (gcd(a, b) !== 1);
  const rad = isTan ? `${b * b}x^2 + ${a * a}` : `${a * a} - ${b * b}x^2`;
  const word = isTan ? "tangent" : "sine";
  const acc = isTan ? ["tan"] : ["sin"];
  const fn = isTan ? "\\tan" : "\\sin";
  return {
    id: `gen.c2u-choose-3.${idx}`, generated: true, concepts: ["choosing-the-substitution"], difficulty: 3, context: "abstract",
    prompt: `An integral contains $\\sqrt{${rad}}$. The $x^2$ coefficient means the substitution is $x = c\\,${fn}\\theta$ for some constant $c$.`,
    steps: [
      { instruction: `Which substitution pattern applies? ${MENU}`, answer: word, accept: acc, hint: `Ignore the coefficients: the sign pattern is ${isTan ? "$u^2 + a^2$" : "$a^2 - u^2$"} with $u = ${b}x$.` },
      { instruction: `Setting $${b}x = ${a}${fn}\\theta$ makes the radical collapse. So $c = $ ? (fraction)`, answer: frac(a, b), accept: [dec(a / b)], hint: `$x = \\tfrac{${a}}{${b}}${fn}\\theta$.` },
    ],
    finalAnswer: { value: `${word}, c = ${frac(a, b)}`, unit: "" },
    solutionNarrative: `With $u = ${b}x$ the radicand is $${isTan ? `u^2 + ${a * a}` : `${a * a} - u^2`}$ — the ${word} pattern — so $${b}x = ${a}${fn}\\theta$, i.e. $x = \\tfrac{${a}}{${b}}${fn}\\theta$.`,
  };
};

// --- sine-substitution ---

// d1: quarter-circle area ∫_0^a sqrt(a^2 - x^2) dx = pi a^2 / 4.
fill["c2u-sine-1"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const full = piStr(a * a, 1), quarter = piStr(a * a, 4);
  return {
    id: `gen.c2u-sine-1.${idx}`, generated: true, concepts: ["sine-substitution"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${a}} \\sqrt{${a * a} - x^2}\\,dx$ by recognizing the region: $y = \\sqrt{${a * a} - x^2}$ is the top half of a circle of radius $${a}$, and the integral covers the first-quadrant quarter.`,
    steps: [
      { instruction: `Area of the FULL circle of radius $${a}$? (enter a pi expression like 25pi)`, answer: full, accept: [dec(a * a * Math.PI)], hint: `$\\pi r^2$ with $r = ${a}$.` },
      { instruction: `The integral is one quarter of that. Enter the value (like 25pi/4).`, answer: quarter, accept: [dec(a * a * Math.PI / 4)], hint: `Divide by 4.` },
    ],
    finalAnswer: { value: quarter, unit: "" },
    solutionNarrative: `The sine substitution $x = ${a}\\sin\\theta$ would give the same result the long way: the region is a quarter circle, area $\\tfrac{\\pi \\cdot ${a * a}}{4}$.`,
  };
};

// d2: reference-triangle back-substitution with a Pythagorean triple.
fill["c2u-sine-2"] = (rng, idx) => {
  const [lA, lB, hyp] = rng.pick(TRIPLES);
  const swap = rng.pick([true, false]);
  const opp = swap ? lB : lA, adj = swap ? lA : lB;
  return {
    id: `gen.c2u-sine-2.${idx}`, generated: true, concepts: ["sine-substitution"], difficulty: 2, context: "abstract",
    prompt: `While evaluating $\\displaystyle\\int \\dfrac{dx}{\\sqrt{${hyp * hyp} - x^2}}$ you substitute $x = ${hyp}\\sin\\theta$. Back-substitution uses the reference triangle at the point $x = ${opp}$.`,
    steps: [
      { instruction: `Compute $\\sqrt{${hyp * hyp} - ${opp}^2}$ — the adjacent side of the reference triangle.`, answer: `${adj}`, accept: [], hint: `$${opp}$-$${adj}$-$${hyp}$ is a Pythagorean triple.` },
      { instruction: `Read off $\\cos\\theta$ = adjacent / hypotenuse. (fraction)`, answer: frac(adj, hyp), accept: [dec(adj / hyp)], hint: `$\\tfrac{${adj}}{${hyp}}$, reduced.` },
      { instruction: `Read off $\\tan\\theta$ = opposite / adjacent. (fraction)`, answer: frac(opp, adj), accept: [dec(opp / adj)], hint: `$\\tfrac{${opp}}{${adj}}$, reduced.` },
    ],
    finalAnswer: { value: `cos = ${frac(adj, hyp)}, tan = ${frac(opp, adj)}`, unit: "" },
    solutionNarrative: `With $\\sin\\theta = \\tfrac{${opp}}{${hyp}}$, the triangle has legs $${opp}$ and $${adj}$: $\\cos\\theta = ${texFrac(adj, hyp)}$ and $\\tan\\theta = ${texFrac(opp, adj)}$ — exactly what back-substitution needs.`,
  };
};

// d3: definite arcsine value ∫_0^L k/sqrt(a^2 - x^2) dx = k * arcsin(L/a).
fill["c2u-sine-3"] = (rng, idx) => {
  const k = rng.int(1, 4);
  const a = rng.pick([2, 4, 6]);
  const useRoot3 = rng.pick([true, false]);
  const limitTex = useRoot3 ? `${a / 2 === 1 ? "" : a / 2}\\sqrt{3}` : `${a / 2}`;
  const sinVal = useRoot3 ? "sqrt(3)/2" : "1/2";
  const sinAcc = useRoot3 ? dec(Math.sqrt(3) / 2) : "0.5";
  const den = useRoot3 ? 3 : 6;
  const theta = piStr(1, den), val = piStr(k, den);
  return {
    id: `gen.c2u-sine-3.${idx}`, generated: true, concepts: ["sine-substitution"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${limitTex}} \\dfrac{${k}}{\\sqrt{${a * a} - x^2}}\\,dx$ with the substitution $x = ${a}\\sin\\theta$ (the integral becomes $${k}\\displaystyle\\int d\\theta$).`,
    steps: [
      { instruction: `At the upper limit, $\\sin\\theta = \\dfrac{${limitTex}}{${a}} = $ ? (enter like 1/2 or sqrt(3)/2)`, answer: sinVal, accept: [sinAcc], hint: `Divide the limit by $a = ${a}$.` },
      { instruction: `So the upper $\\theta$-limit is $\\arcsin(${useRoot3 ? "\\sqrt{3}/2" : "1/2"}) = $ ? (a pi expression)`, answer: theta, accept: [dec(Math.PI / den)], hint: useRoot3 ? `$\\sin\\tfrac{\\pi}{3} = \\tfrac{\\sqrt{3}}{2}$.` : `$\\sin\\tfrac{\\pi}{6} = \\tfrac{1}{2}$.` },
      { instruction: `The integrand collapses to $${k}\\,d\\theta$, so the value is $${k} \\cdot \\theta$. Enter it (a pi expression).`, answer: val, accept: [dec(k * Math.PI / den)], hint: `$${k} \\cdot \\tfrac{\\pi}{${den}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$x = ${a}\\sin\\theta$ turns $\\sqrt{${a * a} - x^2}$ into $${a}\\cos\\theta$ and $dx$ into $${a}\\cos\\theta\\,d\\theta$ — they cancel, leaving $${k}\\theta$ evaluated at $\\arcsin(${useRoot3 ? "\\tfrac{\\sqrt{3}}{2}" : "\\tfrac{1}{2}"}) = \\tfrac{\\pi}{${den}}$: the value is $${val.replace("pi", "\\pi")}$.`,
  };
};

// --- tangent-secant-substitution ---

// d1: ∫_0^a dx/(a^2 + x^2) = pi/(4a).
fill["c2u-tansec-1"] = (rng, idx) => {
  const a = rng.int(1, 5);
  const val = piStr(1, 4 * a);
  return {
    id: `gen.c2u-tansec-1.${idx}`, generated: true, concepts: ["tangent-secant-substitution"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${a}} \\dfrac{dx}{${a * a} + x^2}$ using $x = ${a}\\tan\\theta$, which gives $\\dfrac{1}{${a}}\\arctan\\dfrac{x}{${a}}$.`,
    steps: [
      { instruction: `At the upper limit, $\\arctan\\left(\\tfrac{${a}}{${a}}\\right) = \\arctan(1) = $ ? (a pi expression)`, answer: "pi/4", accept: [dec(Math.PI / 4)], hint: `$\\tan\\tfrac{\\pi}{4} = 1$.` },
      { instruction: `Multiply by $\\tfrac{1}{${a}}$: the value is ? (a pi expression like pi/12)`, answer: val, accept: [dec(Math.PI / (4 * a))], hint: `$\\tfrac{1}{${a}} \\cdot \\tfrac{\\pi}{4}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$x = ${a}\\tan\\theta$ turns the integrand into $\\tfrac{1}{${a}}\\,d\\theta$; the limits become $0$ to $\\tfrac{\\pi}{4}$, so the value is $\\tfrac{\\pi}{${4 * a}}$.`,
  };
};

// d2: secant reference triangle with a Pythagorean triple.
fill["c2u-tansec-2"] = (rng, idx) => {
  const [lA, lB, hyp] = rng.pick(TRIPLES);
  const swap = rng.pick([true, false]);
  const a = swap ? lB : lA, other = swap ? lA : lB;
  return {
    id: `gen.c2u-tansec-2.${idx}`, generated: true, concepts: ["tangent-secant-substitution"], difficulty: 2, context: "abstract",
    prompt: `While evaluating $\\displaystyle\\int \\dfrac{\\sqrt{x^2 - ${a * a}}}{x}\\,dx$ you substitute $x = ${a}\\sec\\theta$. Back-substitute at the point $x = ${hyp}$ using the reference triangle (hypotenuse $x$, adjacent $${a}$).`,
    steps: [
      { instruction: `Compute the opposite side $\\sqrt{${hyp}^2 - ${a * a}}$.`, answer: `${other}`, accept: [], hint: `$${a}$-$${other}$-$${hyp}$ is a Pythagorean triple.` },
      { instruction: `Read off $\\tan\\theta$ = opposite / adjacent. (fraction)`, answer: frac(other, a), accept: [dec(other / a)], hint: `$\\tfrac{${other}}{${a}}$, reduced.` },
      { instruction: `Read off $\\sin\\theta$ = opposite / hypotenuse. (fraction)`, answer: frac(other, hyp), accept: [dec(other / hyp)], hint: `$\\tfrac{${other}}{${hyp}}$, reduced.` },
    ],
    finalAnswer: { value: `tan = ${frac(other, a)}, sin = ${frac(other, hyp)}`, unit: "" },
    solutionNarrative: `$\\sec\\theta = \\tfrac{${hyp}}{${a}}$ puts hypotenuse $${hyp}$ over adjacent $${a}$; the opposite side is $${other}$, so $\\tan\\theta = ${texFrac(other, a)}$ and $\\sin\\theta = ${texFrac(other, hyp)}$.`,
  };
};

// d3: ∫_0^a x^2/(a^2 + x^2) dx = a - a*pi/4.
fill["c2u-tansec-3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const piPart = piStr(a, 4);
  const val = `${a} - ${piPart}`;
  return {
    id: `gen.c2u-tansec-3.${idx}`, generated: true, concepts: ["tangent-secant-substitution"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${a}} \\dfrac{x^2}{${a * a} + x^2}\\,dx$ by writing $\\dfrac{x^2}{${a * a} + x^2} = 1 - \\dfrac{${a * a}}{${a * a} + x^2}$ and using the tangent substitution on the second piece.`,
    steps: [
      { instruction: `First piece: $\\displaystyle\\int_0^{${a}} 1\\,dx = $ ?`, answer: `${a}`, accept: [], hint: `Length of the interval.` },
      { instruction: `Second piece: $\\displaystyle\\int_0^{${a}} \\dfrac{${a * a}}{${a * a} + x^2}\\,dx = ${a}\\arctan\\tfrac{x}{${a}}\\Big|_0^{${a}} = $ ? (a pi expression like 3pi/4)`, answer: piPart, accept: [dec(a * Math.PI / 4)], hint: `$${a}\\arctan(1) = ${a} \\cdot \\tfrac{\\pi}{4}$.` },
      { instruction: `Subtract. Enter the value (like 3 - 3pi/4).`, answer: val, accept: [dec(a - a * Math.PI / 4)], hint: `First piece minus second piece.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `The split gives $${a} - ${a}\\cdot\\tfrac{\\pi}{4} \\approx ${dec(a - a * Math.PI / 4)}$ — the "improper fraction" trick (divide first) paired with the tangent pattern.`,
  };
};

// --- completing-the-square ---

// d1: complete the square under a radical: x^2 + 2hx + (h^2 + k).
fill["c2u-cts-1"] = (rng, idx) => {
  const h = rng.pick([1, 2, 3, 4, 5]) * rng.pick([1, -1]);
  const k = rng.pick([4, 9, 16, 25]);
  const c = h * h + k;
  const lin = 2 * h >= 0 ? `+ ${2 * h}x` : `- ${-2 * h}x`;
  return {
    id: `gen.c2u-cts-1.${idx}`, generated: true, concepts: ["completing-the-square"], difficulty: 1, context: "abstract",
    prompt: `Before any trig substitution, complete the square: $x^2 ${lin} + ${c} = (x + h)^2 + k$. Find $h$ and $k$.`,
    steps: [
      { instruction: `$h$ is half the $x$-coefficient. $h = $ ?`, answer: `${h}`, accept: [], hint: `Half of $${2 * h}$.` },
      { instruction: `$k = ${c} - h^2 = $ ?`, answer: `${k}`, accept: [], hint: `$${c} - ${h * h}$.` },
    ],
    finalAnswer: { value: `h = ${h}, k = ${k}`, unit: "" },
    solutionNarrative: `$x^2 ${lin} + ${c} = (x ${h >= 0 ? "+" : "-"} ${Math.abs(h)})^2 + ${k}$ — now $u = x ${h >= 0 ? "+" : "-"} ${Math.abs(h)}$ exposes the tangent pattern $u^2 + ${k}$.`,
  };
};

// d2: downward parabola radicand -> sine pattern after completing the square.
fill["c2u-cts-2"] = (rng, idx) => {
  const h = rng.int(1, 4) * rng.pick([1, -1]);
  const a = rng.pick([2, 3, 4, 5]);
  const c = a * a - h * h; // radicand: -x^2 + 2hx + c = a^2 - (x-h)^2
  const lin = 2 * h >= 0 ? `+ ${2 * h}x` : `- ${-2 * h}x`;
  const con = c >= 0 ? `+ ${c}` : `- ${-c}`;
  const shift = h >= 0 ? `x - ${h}` : `x + ${-h}`;
  return {
    id: `gen.c2u-cts-2.${idx}`, generated: true, concepts: ["completing-the-square"], difficulty: 2, context: "abstract",
    prompt: `An integral contains $\\sqrt{-x^2 ${lin} ${con}}$. Completing the square gives $-x^2 ${lin} ${con} = A - (${shift})^2$.`,
    steps: [
      { instruction: `Find the constant $A$.`, answer: `${a * a}`, accept: [], hint: `$-(x^2 - ${2 * h}x) ${con} = -( (${shift})^2 - ${h * h} ) ${con}$.` },
      { instruction: `So the radical is $\\sqrt{${a * a} - u^2}$ with $u = ${shift}$. What is $a$?`, answer: `${a}`, accept: [], hint: `$\\sqrt{${a * a}}$.` },
      { instruction: `Which substitution pattern now applies to $u$? ${MENU}`, answer: "sine", accept: ["sin"], hint: `$a^2 - u^2$ is the sine pattern: $u = ${a}\\sin\\theta$.` },
    ],
    finalAnswer: { value: `A = ${a * a}, a = ${a}, sine`, unit: "" },
    solutionNarrative: `$-x^2 ${lin} ${con} = ${a * a} - (${shift})^2$: shifting to $u = ${shift}$ exposes $\\sqrt{${a * a} - u^2}$, the sine pattern with $a = ${a}$.`,
  };
};

// d3: semicircle area across the full width after completing the square.
fill["c2u-cts-3"] = (rng, idx) => {
  const h = rng.int(0, 4);
  const a = rng.pick([2, 3, 4]);
  const c = a * a - h * h;
  const lin = h === 0 ? "" : ` + ${2 * h}x`;
  const con = c >= 0 ? `+ ${c}` : `- ${-c}`;
  const lo = h - a, hi = h + a;
  const val = piStr(a * a, 2);
  return {
    id: `gen.c2u-cts-3.${idx}`, generated: true, concepts: ["completing-the-square"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{${lo}}^{${hi}} \\sqrt{-x^2${lin} ${con}}\\,dx$. Complete the square first: the radicand is $a^2 - (x - ${h})^2$, so the graph is the top half of a circle centered at $x = ${h}$.`,
    steps: [
      { instruction: `What is the radius $a$?`, answer: `${a}`, accept: [], hint: `$a^2 = ${h * h} ${con} = ${a * a}$.` },
      { instruction: `The limits $${lo}$ to $${hi}$ span the full diameter, so the integral is the area of a semicircle of radius $${a}$. Enter it (a pi expression like 9pi/2).`, answer: val, accept: [dec(a * a * Math.PI / 2)], hint: `$\\tfrac{1}{2}\\pi a^2$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$-x^2${lin} ${con} = ${a * a} - (x - ${h})^2$: a circle of radius $${a}$ centered at $${h}$. Integrating the top half across its diameter gives $\\tfrac{\\pi \\cdot ${a * a}}{2}$ — no antiderivative needed once the geometry is exposed.`,
  };
};
