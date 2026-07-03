// gen-lap-gs-fill.js
// Parametric problem generators for two topics:
//   differential-equations.laplace-transforms  (prefix: lap-)
//   linear-algebra.gram-schmidt                (prefix: gsq-)
// Self-contained: exports a `fill` map of template-name -> (rng, idx) =>
// problemObject, matching the object shape used by js/generator.js's internal
// generators. Does not import from or modify js/generator.js.
//
// Design notes:
// - Every Laplace answer that must GRADE is a rational function of s (the
//   engine verifies those by cross-multiplication). Time-domain answers f(t)
//   containing e^{at}, sin bt, cos bt are exact-string steps with generous
//   accept[] variants (paren/brace exponents, term order, explicit '*'), or
//   are backed by a numeric evaluation step.
// - Every Gram-Schmidt input is BUILT from a clean orthogonal set mixed with
//   small integer coefficients, so projections/coefficients/residuals come out
//   as small integers (or tame fractions computed forward from the same
//   parameters). Linearly dependent inputs and zero projections are impossible
//   by construction (mixing coefficients are guarded nonzero).

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? (hi > 0 ? hi : lo) : v; };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const add = (a, b) => a.map((x, i) => x + b[i]);
const scale = (v, k) => v.map((x) => x * k);
const vec = (v) => `<${v.join(", ")}>`;                       // integer vector answer
const fvec = (nums, den) => `<${nums.map((n) => frac(n, den)).join(", ")}>`; // fraction vector answer
const lvec = (v) => `\\langle ${v.join(", ")} \\rangle`;      // latex display

// "s - a" with the sign folded in (a = -3 -> "s + 3").
const sMinus = (a) => (a >= 0 ? `s - ${a}` : `s + ${-a}`);
// "s^2 + Ps + Q" with signs folded in (P, Q may be 0 or negative).
const quadStr = (P, Q) => {
  let out = "s^2";
  if (P !== 0) out += P > 0 ? ` + ${P === 1 ? "" : P}s` : ` - ${P === -1 ? "" : -P}s`;
  if (Q !== 0) out += Q > 0 ? ` + ${Q}` : ` - ${-Q}`;
  return out;
};
// "cs + m" with signs folded in (c assumed nonzero).
const linStr = (c, m) => {
  const cs = c === 1 ? "s" : c === -1 ? "-s" : `${c}s`;
  return m === 0 ? cs : m > 0 ? `${cs} + ${m}` : `${cs} - ${-m}`;
};

// --- exact-string builders for time-domain answers --------------------------
const coefStr = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);
const rtStr = (r) => `${r === 1 ? "" : r === -1 ? "-" : r}t`;
const expP = (c, r) => `${coefStr(c)}e^(${rtStr(r)})`;           // 5e^(-2t)
const expB = (c, r) => `${coefStr(c)}e^{${rtStr(r)}}`;           // 5e^{-2t}
const expS = (c, r) => `${c === 1 ? "" : c === -1 ? "-" : `${c}*`}e^(${rtStr(r)})`; // 5*e^(-2t)
const joinT = (x, y) => (y[0] === "-" ? `${x} - ${y.slice(1)}` : `${x} + ${y}`);
const expSum = (A, r1, B, r2) => ({
  answer: joinT(expP(A, r1), expP(B, r2)),
  accept: [
    joinT(expB(A, r1), expB(B, r2)),
    joinT(expP(B, r2), expP(A, r1)),
    joinT(expB(B, r2), expB(A, r1)),
    joinT(expS(A, r1), expS(B, r2)),
  ],
});
const trigP = (c, fn, b) => `${coefStr(c)}${fn}(${b === 1 ? "" : b}t)`; // 2cos(3t)
const trigN = (c, fn, b) => `${coefStr(c)}${fn} ${b === 1 ? "" : b}t`;  // 2cos 3t
const trigSum = (c, d, b) => ({ // c cos(bt) + d sin(bt)
  answer: joinT(trigP(c, "cos", b), trigP(d, "sin", b)),
  accept: [
    joinT(trigN(c, "cos", b), trigN(d, "sin", b)),
    joinT(trigP(d, "sin", b), trigP(c, "cos", b)),
    joinT(trigN(d, "sin", b), trigN(c, "cos", b)),
  ],
});
const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

export const fill = {};

// ============================================================================
// LAPLACE: transform-basic-functions
// ============================================================================

fill["lap-basic-1"] = (rng, idx) => {
  const kind = rng.pick(["exp", "t", "const"]);
  const base = { id: `gen.lap-basic-1.${idx}`, generated: true, concepts: ["transform-basic-functions"], difficulty: 1, context: "abstract" };
  if (kind === "exp") {
    const a = nz(rng, -5, 5);
    const F = `1/(${sMinus(a)})`;
    return { ...base,
      prompt: `Use the transform table to compute $\\mathcal{L}\\{e^{${a}t}\\}$.`,
      steps: [
        { instruction: `Match against $\\mathcal{L}\\{e^{at}\\} = \\dfrac{1}{s-a}$. What is $a$ here?`, answer: `${a}`, accept: [`a = ${a}`], hint: `The exponent is ${a}t, so read off $a$.` },
        { instruction: "Write $F(s)$ as a rational function of $s$.", answer: F, accept: [], hint: `Substitute $a = ${a}$ into $\\dfrac{1}{s-a}$.` },
      ],
      finalAnswer: { value: F, unit: "" },
      solutionNarrative: `$\\mathcal{L}\\{e^{${a}t}\\} = \\dfrac{1}{${sMinus(a)}}$ straight from the table entry $\\dfrac{1}{s-a}$ with $a = ${a}$.`,
    };
  }
  if (kind === "t") {
    const c = rng.int(2, 9);
    const F = `${c}/s^2`;
    return { ...base,
      prompt: `Use the transform table to compute $\\mathcal{L}\\{${c}t\\}$.`,
      steps: [
        { instruction: "First, what is $\\mathcal{L}\\{t\\}$ from the table? (Write it as a rational function of $s$.)", answer: "1/s^2", accept: [], hint: "$t = t^1$, so use $\\mathcal{L}\\{t^n\\} = n!/s^{n+1}$ with $n = 1$." },
        { instruction: `By linearity, $\\mathcal{L}\\{${c}t\\} = ${c}\\,\\mathcal{L}\\{t\\} = ?$`, answer: F, accept: [], hint: `Multiply $1/s^2$ by ${c}.` },
      ],
      finalAnswer: { value: F, unit: "" },
      solutionNarrative: `$\\mathcal{L}\\{t\\} = \\dfrac{1}{s^2}$, so $\\mathcal{L}\\{${c}t\\} = \\dfrac{${c}}{s^2}$.`,
    };
  }
  const c = rng.int(2, 9);
  const F = `${c}/s`;
  return { ...base,
    prompt: `Use the transform table to compute $\\mathcal{L}\\{${c}\\}$ (the constant function $f(t) = ${c}$).`,
    steps: [
      { instruction: "First, what is $\\mathcal{L}\\{1\\}$ from the table?", answer: "1/s", accept: [], hint: "The table entry for the constant function 1." },
      { instruction: `By linearity, $\\mathcal{L}\\{${c}\\} = ${c}\\,\\mathcal{L}\\{1\\} = ?$`, answer: F, accept: [], hint: `Multiply $1/s$ by ${c}.` },
    ],
    finalAnswer: { value: F, unit: "" },
    solutionNarrative: `$\\mathcal{L}\\{1\\} = \\dfrac{1}{s}$, so $\\mathcal{L}\\{${c}\\} = \\dfrac{${c}}{s}$.`,
  };
};

fill["lap-basic-2"] = (rng, idx) => {
  const kind = rng.pick(["tn", "sin", "cos"]);
  const base = { id: `gen.lap-basic-2.${idx}`, generated: true, concepts: ["transform-basic-functions"], difficulty: 2, context: "abstract" };
  if (kind === "tn") {
    const n = rng.int(2, 4);
    const f = fact(n);
    const F = `${f}/s^${n + 1}`;
    return { ...base,
      prompt: `Compute $\\mathcal{L}\\{t^${n}\\}$ using $\\mathcal{L}\\{t^n\\} = \\dfrac{n!}{s^{n+1}}$.`,
      steps: [
        { instruction: `Compute $${n}!$.`, answer: `${f}`, accept: [], hint: `$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")}$.` },
        { instruction: "Write $F(s)$ as a rational function of $s$.", answer: F, accept: [], hint: `Numerator $${n}! = ${f}$, denominator $s^{${n}+1}$.` },
      ],
      finalAnswer: { value: F, unit: "" },
      solutionNarrative: `$\\mathcal{L}\\{t^${n}\\} = \\dfrac{${n}!}{s^{${n + 1}}} = \\dfrac{${f}}{s^${n + 1}}$.`,
    };
  }
  const b = rng.int(2, 5);
  const isSin = kind === "sin";
  const F = isSin ? `${b}/(s^2 + ${b * b})` : `s/(s^2 + ${b * b})`;
  return { ...base,
    prompt: `Compute $\\mathcal{L}\\{\\${isSin ? "sin" : "cos"}(${b}t)\\}$ using the table.`,
    steps: [
      { instruction: `Both trig entries share the denominator $s^2 + b^2$. With $b = ${b}$, compute $b^2$.`, answer: `${b * b}`, accept: [], hint: `$${b}^2 = ${b * b}$.` },
      { instruction: `Write $F(s)$: the numerator is $${isSin ? "b" : "s"}$ for ${isSin ? "sine" : "cosine"}.`, answer: F, accept: [], hint: isSin ? `$\\mathcal{L}\\{\\sin bt\\} = \\dfrac{b}{s^2+b^2}$.` : `$\\mathcal{L}\\{\\cos bt\\} = \\dfrac{s}{s^2+b^2}$.` },
    ],
    finalAnswer: { value: F, unit: "" },
    solutionNarrative: `$\\mathcal{L}\\{\\${isSin ? "sin" : "cos"}(${b}t)\\} = \\dfrac{${isSin ? b : "s"}}{s^2 + ${b * b}}$ — sine puts $b$ on top, cosine puts $s$ on top.`,
  };
};

fill["lap-basic-3"] = (rng, idx) => {
  const n = rng.int(3, 5);
  const f = fact(n);
  const a = nz(rng, -4, 4);
  const F1 = `${f}/s^${n + 1}`;
  const F2 = `1/(${sMinus(a)})`;
  return {
    id: `gen.lap-basic-3.${idx}`, generated: true, concepts: ["transform-basic-functions"], difficulty: 3, context: "abstract",
    prompt: `Compute both $\\mathcal{L}\\{t^${n}\\}$ and $\\mathcal{L}\\{e^{${a}t}\\}$ from the table.`,
    steps: [
      { instruction: `Compute $${n}!$ for the $t^${n}$ entry.`, answer: `${f}`, accept: [], hint: `$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")}$.` },
      { instruction: `Write $\\mathcal{L}\\{t^${n}\\}$ as a rational function of $s$.`, answer: F1, accept: [], hint: `$\\dfrac{n!}{s^{n+1}}$ with $n = ${n}$.` },
      { instruction: `Write $\\mathcal{L}\\{e^{${a}t}\\}$ as a rational function of $s$.`, answer: F2, accept: [], hint: `$\\dfrac{1}{s-a}$ with $a = ${a}$ — watch the sign.` },
    ],
    finalAnswer: { value: F2, unit: "" },
    solutionNarrative: `$\\mathcal{L}\\{t^${n}\\} = \\dfrac{${f}}{s^${n + 1}}$ and $\\mathcal{L}\\{e^{${a}t}\\} = \\dfrac{1}{${sMinus(a)}}$.`,
  };
};

// ============================================================================
// LAPLACE: transform-properties
// ============================================================================

fill["lap-props-1"] = (rng, idx) => {
  const c1 = rng.int(2, 9), c2 = rng.int(2, 9);
  const combined = `(${c1}s + ${c2})/s^2`;
  return {
    id: `gen.lap-props-1.${idx}`, generated: true, concepts: ["transform-properties"], difficulty: 1, context: "abstract",
    prompt: `Use linearity to compute $\\mathcal{L}\\{${c1} + ${c2}t\\}$.`,
    steps: [
      { instruction: `Transform the first term: $\\mathcal{L}\\{${c1}\\} = ?$`, answer: `${c1}/s`, accept: [], hint: `$${c1}\\,\\mathcal{L}\\{1\\} = ${c1} \\cdot \\dfrac{1}{s}$.` },
      { instruction: `Transform the second term: $\\mathcal{L}\\{${c2}t\\} = ?$`, answer: `${c2}/s^2`, accept: [], hint: `$${c2}\\,\\mathcal{L}\\{t\\} = ${c2} \\cdot \\dfrac{1}{s^2}$.` },
      { instruction: "Add the two transforms and combine over the common denominator $s^2$ into a single rational function.", answer: combined, accept: [`${c1}/s + ${c2}/s^2`], hint: `$\\dfrac{${c1}}{s} = \\dfrac{${c1}s}{s^2}$, then add the numerators.` },
    ],
    finalAnswer: { value: combined, unit: "" },
    solutionNarrative: `Linearity transforms term by term: $\\dfrac{${c1}}{s} + \\dfrac{${c2}}{s^2} = \\dfrac{${c1}s + ${c2}}{s^2}$.`,
  };
};

fill["lap-props-2"] = (rng, idx) => {
  const a = nz(rng, -4, 4);
  const b = rng.int(2, 4);
  const isSin = rng.int(0, 1) === 0;
  const baseF = isSin ? `${b}/(s^2 + ${b * b})` : `s/(s^2 + ${b * b})`;
  const shifted = isSin ? `${b}/((${sMinus(a)})^2 + ${b * b})` : `(${sMinus(a)})/((${sMinus(a)})^2 + ${b * b})`;
  return {
    id: `gen.lap-props-2.${idx}`, generated: true, concepts: ["transform-properties"], difficulty: 2, context: "abstract",
    prompt: `Use the s-shifting property $\\mathcal{L}\\{e^{at}f(t)\\} = F(s-a)$ to compute $\\mathcal{L}\\{e^{${a}t}\\${isSin ? "sin" : "cos"}(${b}t)\\}$.`,
    steps: [
      { instruction: `First the base transform: $\\mathcal{L}\\{\\${isSin ? "sin" : "cos"}(${b}t)\\} = ?$`, answer: baseF, accept: [], hint: isSin ? `$\\dfrac{b}{s^2+b^2}$ with $b = ${b}$.` : `$\\dfrac{s}{s^2+b^2}$ with $b = ${b}$.` },
      { instruction: `Now shift: replace every $s$ by $s - (${a})$. Write the result as a rational function of $s$.`, answer: shifted, accept: [], hint: `The factor $e^{${a}t}$ shifts the whole transform: $F(s) \\to F(s - (${a}))$. You may expand the denominator or leave it as a square.` },
    ],
    finalAnswer: { value: shifted, unit: "" },
    solutionNarrative: `$\\mathcal{L}\\{\\${isSin ? "sin" : "cos"}(${b}t)\\} = ${isSin ? `\\dfrac{${b}}{s^2+${b * b}}` : `\\dfrac{s}{s^2+${b * b}}`}$; multiplying by $e^{${a}t}$ replaces $s$ with $${sMinus(a)}$, giving $${isSin ? `\\dfrac{${b}}{(${sMinus(a)})^2 + ${b * b}}` : `\\dfrac{${sMinus(a)}}{(${sMinus(a)})^2 + ${b * b}}`}$.`,
  };
};

fill["lap-props-3"] = (rng, idx) => {
  const n = rng.int(2, 3);
  const f = fact(n);
  const a = nz(rng, -4, 4);
  const baseF = `${f}/s^${n + 1}`;
  const shifted = `${f}/(${sMinus(a)})^${n + 1}`;
  return {
    id: `gen.lap-props-3.${idx}`, generated: true, concepts: ["transform-properties"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\mathcal{L}\\{t^${n}e^{${a}t}\\}$ by combining the $t^n$ table entry with s-shifting.`,
    steps: [
      { instruction: `Base transform first: $\\mathcal{L}\\{t^${n}\\} = ?$`, answer: baseF, accept: [], hint: `$\\dfrac{n!}{s^{n+1}}$ with $n = ${n}$, so numerator $${f}$.` },
      { instruction: `Shift for the $e^{${a}t}$ factor: replace $s$ by $s - (${a})$.`, answer: shifted, accept: [], hint: `$F(s-a)$ with $a = ${a}$: $\\dfrac{${f}}{(${sMinus(a)})^{${n + 1}}}$.` },
      { instruction: `Check: evaluate your $F(s)$ at $s = ${a + 1}$ (the denominator becomes $1$).`, answer: `${f}`, accept: [], hint: `$(${a + 1} - (${a}))^{${n + 1}} = 1$, so $F(${a + 1}) = ${f}$.` },
    ],
    finalAnswer: { value: shifted, unit: "" },
    solutionNarrative: `$\\mathcal{L}\\{t^${n}\\} = \\dfrac{${f}}{s^${n + 1}}$, and the $e^{${a}t}$ factor shifts $s \\to ${sMinus(a)}$: $\\mathcal{L}\\{t^${n}e^{${a}t}\\} = \\dfrac{${f}}{(${sMinus(a)})^${n + 1}}$. At $s = ${a + 1}$ the denominator is 1, confirming the numerator $${f}$.`,
  };
};

// ============================================================================
// LAPLACE: inverse-transforms
// ============================================================================

fill["lap-inv-1"] = (rng, idx) => {
  const c = rng.int(2, 7);
  const a = nz(rng, -4, 4);
  const F = `${c}/(${sMinus(a)})`;
  const y = expP(c, a);
  return {
    id: `gen.lap-inv-1.${idx}`, generated: true, concepts: ["inverse-transforms"], difficulty: 1, context: "abstract",
    prompt: `Find the inverse transform $f(t) = \\mathcal{L}^{-1}\\left\\{\\dfrac{${c}}{${sMinus(a)}}\\right\\}$.`,
    steps: [
      { instruction: `This matches $\\dfrac{c}{s-a}$, whose inverse is $ce^{at}$. What is $a$?`, answer: `${a}`, accept: [`a = ${a}`], hint: `The denominator is $${sMinus(a)}$, i.e. $s - (${a})$.` },
      { instruction: `Write $f(t)$ using notation like "5e^(2t)".`, answer: y, accept: [expB(c, a), expS(c, a), `${c}exp(${rtStr(a)})`], hint: `$f(t) = ${c}e^{${a}t}$.` },
    ],
    finalAnswer: { value: y, unit: "" },
    solutionNarrative: `$\\dfrac{${c}}{${sMinus(a)}} = ${c} \\cdot \\dfrac{1}{s - (${a})}$, so $f(t) = ${c}e^{${a}t}$.`,
  };
};

fill["lap-inv-2"] = (rng, idx) => {
  const r1 = nz(rng, -4, 4);
  let r2 = nz(rng, -4, 4);
  while (r2 === r1) r2 = nz(rng, -4, 4);
  const A = nz(rng, -5, 5), B = nz(rng, -5, 5);
  const p = A + B;                    // numerator: p s + m
  const m = -(A * r2 + B * r1);
  const numer = p === 0 ? `${m}` : linStr(p, m);
  const Fdisp = `\\dfrac{${numer}}{(${sMinus(r1)})(${sMinus(r2)})}`;
  const y = expSum(A, r1, B, r2);
  const N = (s) => p * s + m;
  return {
    id: `gen.lap-inv-2.${idx}`, generated: true, concepts: ["inverse-transforms"], difficulty: 2, context: "abstract",
    prompt: `Invert $F(s) = ${Fdisp}$ by partial fractions: write $F(s) = \\dfrac{A}{${sMinus(r1)}} + \\dfrac{B}{${sMinus(r2)}}$, then read off $f(t)$.`,
    steps: [
      { instruction: `Find $A$ by cover-up: $A = \\dfrac{N(${r1})}{${r1} - (${r2})}$ where $N(s) = ${numer}$.`, answer: `${A}`, accept: [`A = ${A}`], hint: `$N(${r1}) = ${N(r1)}$ and $${r1} - (${r2}) = ${r1 - r2}$, so $A = ${N(r1)}/${r1 - r2}$.` },
      { instruction: `Find $B$ the same way: $B = \\dfrac{N(${r2})}{${r2} - (${r1})}$.`, answer: `${B}`, accept: [`B = ${B}`], hint: `$N(${r2}) = ${N(r2)}$ and $${r2} - (${r1}) = ${r2 - r1}$.` },
      { instruction: `Each term $\\dfrac{c}{s-a}$ inverts to $ce^{at}$. Write $f(t)$ (e.g. "3e^(2t) - 4e^(-5t)").`, answer: y.answer, accept: y.accept, hint: `$f(t) = ${A}e^{${r1}t} ${B < 0 ? "-" : "+"} ${Math.abs(B)}e^{${r2}t}$.` },
    ],
    finalAnswer: { value: y.answer, unit: "" },
    solutionNarrative: `Cover-up gives $A = ${A}$ and $B = ${B}$, so $F(s) = \\dfrac{${A}}{${sMinus(r1)}} + \\dfrac{${B}}{${sMinus(r2)}}$ and $f(t) = ${A}e^{${r1}t} ${B < 0 ? "-" : "+"} ${Math.abs(B)}e^{${r2}t}$.`,
  };
};

fill["lap-inv-3"] = (rng, idx) => {
  const b = rng.int(2, 5);
  const c = nz(rng, -4, 4);
  const d = nz(rng, -4, 4);
  const m = d * b;
  const numer = linStr(c, m);
  const y = trigSum(c, d, b);
  return {
    id: `gen.lap-inv-3.${idx}`, generated: true, concepts: ["inverse-transforms"], difficulty: 3, context: "abstract",
    prompt: `Invert $F(s) = \\dfrac{${numer}}{s^2 + ${b * b}}$ by splitting it into cosine and sine pieces ($b = ${b}$).`,
    steps: [
      { instruction: `The cosine piece is $c\\,\\dfrac{s}{s^2+${b * b}}$. Read off $c$ (the coefficient of $s$ in the numerator).`, answer: `${c}`, accept: [`c = ${c}`], hint: `The numerator's $s$-term is $${c === 1 ? "" : c === -1 ? "-" : c}s$.` },
      { instruction: `The sine piece is $d\\,\\dfrac{${b}}{s^2+${b * b}}$. The constant part of the numerator is $${m}$, so $d = ${m}/${b} = ?$`, answer: `${d}`, accept: [`d = ${d}`], hint: `Divide the constant $${m}$ by $b = ${b}$.` },
      { instruction: `Write $f(t)$ (e.g. "2cos(3t) + 4sin(3t)").`, answer: y.answer, accept: y.accept, hint: `$f(t) = ${c}\\cos(${b}t) ${d < 0 ? "-" : "+"} ${Math.abs(d)}\\sin(${b}t)$.` },
      { instruction: `Check: compute $f(0)$ (recall $\\cos 0 = 1$, $\\sin 0 = 0$).`, answer: `${c}`, accept: [], hint: `Only the cosine term survives at $t = 0$.` },
    ],
    finalAnswer: { value: y.answer, unit: "" },
    solutionNarrative: `$\\dfrac{${numer}}{s^2+${b * b}} = ${c}\\,\\dfrac{s}{s^2+${b * b}} + ${d}\\,\\dfrac{${b}}{s^2+${b * b}}$, so $f(t) = ${c}\\cos(${b}t) ${d < 0 ? "-" : "+"} ${Math.abs(d)}\\sin(${b}t)$; $f(0) = ${c}$ checks against the cosine coefficient.`,
  };
};

// ============================================================================
// LAPLACE: solve-ivp-with-laplace
// ============================================================================

fill["lap-ivp-1"] = (rng, idx) => {
  const k = rng.int(1, 5);
  const y0 = rng.int(2, 8);
  const Y = `${y0}/(s + ${k})`;
  const y = expP(y0, -k);
  return {
    id: `gen.lap-ivp-1.${idx}`, generated: true, concepts: ["solve-ivp-with-laplace"], difficulty: 1, context: "abstract",
    prompt: `Solve the IVP $y' + ${k}y = 0$, $y(0) = ${y0}$ with the Laplace transform.`,
    steps: [
      { instruction: `Transform using $\\mathcal{L}\\{y'\\} = sY - y(0)$: from $sY - ${y0} + ${k}Y = 0$, solve for $Y(s)$ as a rational function.`, answer: Y, accept: [], hint: `$(s + ${k})Y = ${y0}$.` },
      { instruction: `Invert with the table: $y(t) = ?$ (e.g. "5e^(-2t)").`, answer: y, accept: [expB(y0, -k), expS(y0, -k), `${y0}exp(${rtStr(-k)})`], hint: `$\\dfrac{${y0}}{s + ${k}}$ is the $\\dfrac{c}{s-a}$ pattern with $a = ${-k}$.` },
    ],
    finalAnswer: { value: y, unit: "" },
    solutionNarrative: `Transforming gives $(s + ${k})Y = ${y0}$, so $Y(s) = \\dfrac{${y0}}{s + ${k}}$ and $y(t) = ${y0}e^{-${k}t}$.`,
  };
};

fill["lap-ivp-2"] = (rng, idx) => {
  const b = rng.int(2, 4);
  const c = rng.int(2, 6);
  const Y = `${c}s/(s^2 + ${b * b})`;
  const y = trigP(c, "cos", b);
  return {
    id: `gen.lap-ivp-2.${idx}`, generated: true, concepts: ["solve-ivp-with-laplace"], difficulty: 2, context: "applied",
    prompt: `An undamped oscillator obeys $y'' + ${b * b}y = 0$ with $y(0) = ${c}$, $y'(0) = 0$. Solve it with the Laplace transform.`,
    steps: [
      { instruction: `Transform using $\\mathcal{L}\\{y''\\} = s^2Y - sy(0) - y'(0)$: from $s^2Y - ${c}s + ${b * b}Y = 0$, solve for $Y(s)$.`, answer: Y, accept: [], hint: `$(s^2 + ${b * b})Y = ${c}s$.` },
      { instruction: `Invert: $\\dfrac{s}{s^2+b^2}$ is the cosine entry. Write $y(t)$ (e.g. "3cos(2t)").`, answer: y, accept: [trigN(c, "cos", b), `${c}*cos(${b}t)`], hint: `$y(t) = ${c}\\cos(${b}t)$ with $b = ${b}$.` },
      { instruction: `Evaluate $y(\\pi/${b})$ exactly.`, answer: `${-c}`, accept: [], hint: `$\\cos(${b} \\cdot \\pi/${b}) = \\cos\\pi = -1$.` },
    ],
    finalAnswer: { value: y, unit: "" },
    solutionNarrative: `$(s^2 + ${b * b})Y = ${c}s$ gives $Y(s) = \\dfrac{${c}s}{s^2 + ${b * b}}$, the cosine pattern: $y(t) = ${c}\\cos(${b}t)$. At $t = \\pi/${b}$ the cosine is $-1$, so $y = ${-c}$.`,
  };
};

fill["lap-ivp-3"] = (rng, idx) => {
  const r1 = rng.int(-4, -1);
  let r2 = rng.int(-4, -1);
  while (r2 === r1) r2 = rng.int(-4, -1);
  let A = nz(rng, -4, 4), B = nz(rng, -4, 4);
  while (A + B === 0) B = nz(rng, -4, 4);
  const P = -(r1 + r2), Q = r1 * r2;   // both positive
  const y0 = A + B;
  const v0 = A * r1 + B * r2;
  const m = y0 * P + v0;               // numerator: y0 s + m
  const Y = `(${linStr(y0, m)})/(${quadStr(P, Q)})`;
  const Yfac = `(${linStr(y0, m)})/((${sMinus(r1)})(${sMinus(r2)}))`;
  const y = expSum(A, r1, B, r2);
  return {
    id: `gen.lap-ivp-3.${idx}`, generated: true, concepts: ["solve-ivp-with-laplace"], difficulty: 3, context: "applied",
    prompt: `A damped system obeys $y'' + ${P === 1 ? "" : P}y' + ${Q}y = 0$ with $y(0) = ${y0}$, $y'(0) = ${v0}$. Solve the IVP with the Laplace transform (the characteristic roots are $${r1}$ and $${r2}$).`,
    steps: [
      { instruction: `Transform the whole equation ($\\mathcal{L}\\{y''\\} = s^2Y - sy(0) - y'(0)$, $\\mathcal{L}\\{y'\\} = sY - y(0)$) and solve for $Y(s)$ as one rational function.`, answer: Y, accept: [Yfac], hint: `$(s^2 + ${P}s + ${Q})Y = ${y0}s + ${y0 * P} + (${v0})$ — collect the initial-condition terms on the right.` },
      { instruction: `Partial fractions: $Y(s) = \\dfrac{A}{${sMinus(r1)}} + \\dfrac{B}{${sMinus(r2)}}$. Find $A$ by cover-up at $s = ${r1}$.`, answer: `${A}`, accept: [`A = ${A}`], hint: `$A = \\dfrac{${y0}(${r1}) + ${m}}{${r1} - (${r2})} = \\dfrac{${y0 * r1 + m}}{${r1 - r2}}$.` },
      { instruction: `Find $B$ by cover-up at $s = ${r2}$.`, answer: `${B}`, accept: [`B = ${B}`], hint: `$B = \\dfrac{${y0}(${r2}) + ${m}}{${r2} - (${r1})} = \\dfrac{${y0 * r2 + m}}{${r2 - r1}}$.` },
      { instruction: `Write $y(t)$ (e.g. "3e^(-2t) - 4e^(-5t)").`, answer: y.answer, accept: y.accept, hint: `$y(t) = ${A}e^{${r1}t} ${B < 0 ? "-" : "+"} ${Math.abs(B)}e^{${r2}t}$. Check: $y(0) = ${A} + (${B}) = ${y0}$.` },
    ],
    finalAnswer: { value: y.answer, unit: "" },
    solutionNarrative: `Transforming gives $(s^2 + ${P}s + ${Q})Y = ${linStr(y0, m)}$, so $Y(s) = \\dfrac{${linStr(y0, m)}}{(${sMinus(r1)})(${sMinus(r2)})}$. Cover-up yields $A = ${A}$, $B = ${B}$, so $y(t) = ${A}e^{${r1}t} ${B < 0 ? "-" : "+"} ${Math.abs(B)}e^{${r2}t}$, which matches $y(0) = ${y0}$.`,
  };
};

// ============================================================================
// GRAM-SCHMIDT: shared clean building blocks
// ============================================================================

const U2 = [[1, 2], [2, 1], [1, 3], [3, 1], [2, 3], [1, 1], [2, -1], [3, -1]]; // small 2D directions
const PY2 = [[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5], [8, 15], [9, 12]]; // integer norms 5,5,10,10,13,13,17,15
const T3 = [[1, 2, 2], [2, 1, -2], [2, -2, 1]]; // mutually orthogonal, each norm 3
const B3 = [[1, 1, 0], [1, -1, 0], [0, 0, 1]];  // orthogonal, norms^2 = 2, 2, 1
const C3 = [[1, 1, 1], [1, -1, 0], [1, 1, -2]]; // orthogonal, norms^2 = 3, 2, 6

// ============================================================================
// GRAM-SCHMIDT: projection-review
// ============================================================================

fill["gsq-proj-1"] = (rng, idx) => {
  const u = rng.pick(U2);
  const k = nz(rng, -3, 3);
  const m = nz(rng, -2, 2);
  const w = [-u[1], u[0]];                    // orthogonal to u
  const v = add(scale(u, k), scale(w, m));    // engineered: proj = k*u exactly
  const n1 = dot(u, u);
  const proj = scale(u, k);
  return {
    id: `gen.gsq-proj-1.${idx}`, generated: true, concepts: ["projection-review"], difficulty: 1, context: "abstract",
    prompt: `Compute $\\text{proj}_{\\vec u}(\\vec v)$ for $\\vec v = ${lvec(v)}$ and $\\vec u = ${lvec(u)}$.`,
    steps: [
      { instruction: `Compute $\\vec v \\cdot \\vec u$.`, answer: `${k * n1}`, accept: [], hint: `$(${v[0]})(${u[0]}) + (${v[1]})(${u[1]})$.` },
      { instruction: `Compute $\\vec u \\cdot \\vec u$.`, answer: `${n1}`, accept: [], hint: `$${u[0]}^2 + ${u[1]}^2$.` },
      { instruction: `The scalar is $\\dfrac{${k * n1}}{${n1}} = ${k}$. Multiply it by $\\vec u$ to get the projection vector as $\\langle x, y \\rangle$.`, answer: vec(proj), accept: [`(${proj.join(", ")})`], hint: `$${k}${lvec(u)} = ${lvec(proj)}$.` },
    ],
    finalAnswer: { value: vec(proj), unit: "" },
    solutionNarrative: `$\\vec v \\cdot \\vec u = ${k * n1}$ and $\\vec u \\cdot \\vec u = ${n1}$, so the scalar is $${k}$ and $\\text{proj}_{\\vec u}(\\vec v) = ${k}${lvec(u)} = ${lvec(proj)}$.`,
  };
};

fill["gsq-proj-2"] = (rng, idx) => {
  const u = rng.pick(U2);
  let v = [rng.int(-4, 4), rng.int(-4, 4)];
  while (dot(v, u) === 0 || (v[0] === 0 && v[1] === 0)) v = [rng.int(-4, 4), rng.int(-4, 4)];
  const d = dot(v, u);
  const n1 = dot(u, u);
  const projNum = scale(u, d);                // proj = (d/n1) u -> entries d*u_i / n1
  return {
    id: `gen.gsq-proj-2.${idx}`, generated: true, concepts: ["projection-review"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\text{proj}_{\\vec u}(\\vec v)$ for $\\vec v = ${lvec(v)}$ and $\\vec u = ${lvec(u)}$. Give exact fractions.`,
    steps: [
      { instruction: `Compute $\\vec v \\cdot \\vec u$.`, answer: `${d}`, accept: [], hint: `$(${v[0]})(${u[0]}) + (${v[1]})(${u[1]})$.` },
      { instruction: `Compute the scalar $\\dfrac{\\vec v \\cdot \\vec u}{\\vec u \\cdot \\vec u}$ as an exact fraction.`, answer: frac(d, n1), accept: [`${d}/${n1}`], hint: `$\\vec u \\cdot \\vec u = ${n1}$.` },
      { instruction: `Multiply the scalar by $\\vec u$ to get the projection as $\\langle x, y \\rangle$ (fraction entries are fine).`, answer: fvec(projNum, n1), accept: [`<${projNum.map((x) => `${x}/${n1}`).join(", ")}>`], hint: `$\\dfrac{${d}}{${n1}}${lvec(u)}$.` },
    ],
    finalAnswer: { value: fvec(projNum, n1), unit: "" },
    solutionNarrative: `$\\vec v \\cdot \\vec u = ${d}$, $\\vec u \\cdot \\vec u = ${n1}$, so the scalar is $${frac(d, n1)}$ and $\\text{proj}_{\\vec u}(\\vec v) = ${frac(d, n1)}${lvec(u)}$.`,
  };
};

fill["gsq-proj-3"] = (rng, idx) => {
  const i = rng.int(0, 2);
  const j = (i + rng.int(1, 2)) % 3;
  const u = T3[i];
  const w = T3[j];
  const k = nz(rng, -3, 3);
  const m = nz(rng, -2, 2);
  const v = add(scale(u, k), scale(w, m));
  const proj = scale(u, k);
  const resid = scale(w, m);
  return {
    id: `gen.gsq-proj-3.${idx}`, generated: true, concepts: ["projection-review"], difficulty: 3, context: "abstract",
    prompt: `In $\\mathbb{R}^3$, decompose $\\vec v = ${lvec(v)}$ into a part along $\\vec u = ${lvec(u)}$ and a part orthogonal to it.`,
    steps: [
      { instruction: `Compute $\\vec v \\cdot \\vec u$.`, answer: `${9 * k}`, accept: [], hint: `$(${v[0]})(${u[0]}) + (${v[1]})(${u[1]}) + (${v[2]})(${u[2]})$.` },
      { instruction: `Compute the scalar $\\dfrac{\\vec v \\cdot \\vec u}{\\vec u \\cdot \\vec u}$ (note $\\vec u \\cdot \\vec u = 9$).`, answer: `${k}`, accept: [], hint: `$${9 * k}/9$.` },
      { instruction: `Write $\\text{proj}_{\\vec u}(\\vec v)$ as $\\langle x, y, z \\rangle$.`, answer: vec(proj), accept: [], hint: `$${k}${lvec(u)}$.` },
      { instruction: `Write the orthogonal remainder $\\vec v - \\text{proj}_{\\vec u}(\\vec v)$.`, answer: vec(resid), accept: [], hint: `Subtract component-wise.` },
      { instruction: `Check orthogonality: $(\\vec v - \\text{proj}_{\\vec u}\\vec v) \\cdot \\vec u = ?$`, answer: "0", accept: [], hint: `The remainder is built to be perpendicular to $\\vec u$.` },
    ],
    finalAnswer: { value: vec(resid), unit: "" },
    solutionNarrative: `$\\vec v \\cdot \\vec u = ${9 * k}$, $\\vec u \\cdot \\vec u = 9$, so the projection is $${k}${lvec(u)} = ${lvec(proj)}$ and the remainder $${lvec(resid)}$ is orthogonal to $\\vec u$ (dot product 0).`,
  };
};

// ============================================================================
// GRAM-SCHMIDT: orthogonalize-two-vectors
// ============================================================================

fill["gsq-two-1"] = (rng, idx) => {
  const u1 = rng.pick(U2);
  const c = nz(rng, -3, 3);
  const m = rng.pick([1, -1, 2, -2]);
  const u2 = scale([-u1[1], u1[0]], m);       // orthogonal to u1 by construction
  const v2 = add(scale(u1, c), u2);
  const n1 = dot(u1, u1);
  return {
    id: `gen.gsq-two-1.${idx}`, generated: true, concepts: ["orthogonalize-two-vectors"], difficulty: 1, context: "abstract",
    prompt: `Run Gram-Schmidt on $\\vec v_1 = ${lvec(u1)}$, $\\vec v_2 = ${lvec(v2)}$: keep $\\vec u_1 = \\vec v_1$ and compute $\\vec u_2 = \\vec v_2 - \\dfrac{\\vec v_2 \\cdot \\vec u_1}{\\vec u_1 \\cdot \\vec u_1}\\vec u_1$.`,
    steps: [
      { instruction: `Compute $\\vec v_2 \\cdot \\vec u_1$.`, answer: `${c * n1}`, accept: [], hint: `$(${v2[0]})(${u1[0]}) + (${v2[1]})(${u1[1]})$.` },
      { instruction: `Compute the coefficient $\\dfrac{\\vec v_2 \\cdot \\vec u_1}{\\vec u_1 \\cdot \\vec u_1}$ (note $\\vec u_1 \\cdot \\vec u_1 = ${n1}$).`, answer: `${c}`, accept: [], hint: `$${c * n1}/${n1}$.` },
      { instruction: `Compute $\\vec u_2 = \\vec v_2 - ${c}\\vec u_1$ as $\\langle x, y \\rangle$.`, answer: vec(u2), accept: [], hint: `Subtract $${c}${lvec(u1)}$ from $\\vec v_2$ component-wise.` },
    ],
    finalAnswer: { value: vec(u2), unit: "" },
    solutionNarrative: `$\\vec v_2 \\cdot \\vec u_1 = ${c * n1}$ over $\\vec u_1 \\cdot \\vec u_1 = ${n1}$ gives coefficient $${c}$, so $\\vec u_2 = \\vec v_2 - ${c}\\vec u_1 = ${lvec(u2)}$ — check: $\\vec u_2 \\cdot \\vec u_1 = 0$.`,
  };
};

fill["gsq-two-2"] = (rng, idx) => {
  const v1 = rng.pick(U2);
  let v2 = [rng.int(-4, 4), rng.int(-4, 4)];
  while (v1[0] * v2[1] - v1[1] * v2[0] === 0 || dot(v1, v2) === 0) v2 = [rng.int(-4, 4), rng.int(-4, 4)];
  const d = dot(v2, v1);
  const n1 = dot(v1, v1);
  const u2num = [v2[0] * n1 - d * v1[0], v2[1] * n1 - d * v1[1]]; // u2 entries over n1
  return {
    id: `gen.gsq-two-2.${idx}`, generated: true, concepts: ["orthogonalize-two-vectors"], difficulty: 2, context: "abstract",
    prompt: `Orthogonalize $\\vec v_1 = ${lvec(v1)}$, $\\vec v_2 = ${lvec(v2)}$ with Gram-Schmidt ($\\vec u_1 = \\vec v_1$). Fraction entries are expected.`,
    steps: [
      { instruction: `Compute $\\vec v_2 \\cdot \\vec u_1$.`, answer: `${d}`, accept: [], hint: `$(${v2[0]})(${v1[0]}) + (${v2[1]})(${v1[1]})$.` },
      { instruction: `Compute $\\vec u_1 \\cdot \\vec u_1$.`, answer: `${n1}`, accept: [], hint: `$${v1[0]}^2 + ${v1[1]}^2$.` },
      { instruction: `Compute $\\vec u_2 = \\vec v_2 - \\dfrac{${d}}{${n1}}\\vec u_1$ as $\\langle x, y \\rangle$ with exact fractions.`, answer: fvec(u2num, n1), accept: [`<${u2num.map((x) => `${x}/${n1}`).join(", ")}>`], hint: `First component: $${v2[0]} - \\dfrac{${d}}{${n1}} \\cdot ${v1[0]}$.` },
    ],
    finalAnswer: { value: fvec(u2num, n1), unit: "" },
    solutionNarrative: `$\\vec v_2 \\cdot \\vec u_1 = ${d}$, $\\vec u_1 \\cdot \\vec u_1 = ${n1}$, so $\\vec u_2 = \\vec v_2 - ${frac(d, n1)}\\,\\vec u_1 = \\langle ${u2num.map((x) => frac(x, n1)).join(", ")} \\rangle$, which is orthogonal to $\\vec v_1$.`,
  };
};

fill["gsq-two-3"] = (rng, idx) => {
  const base = rng.pick([T3, C3]);
  const i = rng.int(0, 2);
  const j = (i + rng.int(1, 2)) % 3;
  const u1 = base[i];
  const c = nz(rng, -3, 3);
  const m = rng.pick([1, -1, 2]);
  const u2 = scale(base[j], m);
  const v2 = add(scale(u1, c), u2);
  const n1 = dot(u1, u1);
  return {
    id: `gen.gsq-two-3.${idx}`, generated: true, concepts: ["orthogonalize-two-vectors"], difficulty: 3, context: "abstract",
    prompt: `Run Gram-Schmidt in $\\mathbb{R}^3$ on $\\vec v_1 = ${lvec(u1)}$, $\\vec v_2 = ${lvec(v2)}$ (take $\\vec u_1 = \\vec v_1$).`,
    steps: [
      { instruction: `Compute $\\vec v_2 \\cdot \\vec u_1$.`, answer: `${c * n1}`, accept: [], hint: `$(${v2[0]})(${u1[0]}) + (${v2[1]})(${u1[1]}) + (${v2[2]})(${u1[2]})$.` },
      { instruction: `Compute the Gram-Schmidt coefficient $\\dfrac{\\vec v_2 \\cdot \\vec u_1}{\\vec u_1 \\cdot \\vec u_1}$ (note $\\vec u_1 \\cdot \\vec u_1 = ${n1}$).`, answer: `${c}`, accept: [], hint: `$${c * n1}/${n1}$.` },
      { instruction: `Compute $\\vec u_2 = \\vec v_2 - ${c}\\vec u_1$ as $\\langle x, y, z \\rangle$.`, answer: vec(u2), accept: [], hint: `Subtract component-wise.` },
      { instruction: `Verify: $\\vec u_2 \\cdot \\vec u_1 = ?$`, answer: "0", accept: [], hint: `Orthogonal vectors have dot product zero — that is the whole point of the subtraction.` },
    ],
    finalAnswer: { value: vec(u2), unit: "" },
    solutionNarrative: `The coefficient is $${c * n1}/${n1} = ${c}$, so $\\vec u_2 = \\vec v_2 - ${c}\\vec u_1 = ${lvec(u2)}$, and $\\vec u_2 \\cdot \\vec u_1 = 0$ confirms orthogonality.`,
  };
};

// ============================================================================
// GRAM-SCHMIDT: orthogonalize-three-vectors
// ============================================================================

fill["gsq-three-1"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = nz(rng, -3, 3), c = nz(rng, -3, 3);
  const v3 = [a + b, a - b, c];
  const u3 = [0, 0, c];
  return {
    id: `gen.gsq-three-1.${idx}`, generated: true, concepts: ["orthogonalize-three-vectors"], difficulty: 1, context: "abstract",
    prompt: `The orthogonal vectors $\\vec u_1 = \\langle 1, 1, 0 \\rangle$ and $\\vec u_2 = \\langle 1, -1, 0 \\rangle$ are already built. Extend Gram-Schmidt to $\\vec v_3 = ${lvec(v3)}$: compute $\\vec u_3 = \\vec v_3 - c_1\\vec u_1 - c_2\\vec u_2$.`,
    steps: [
      { instruction: `Compute $c_1 = \\dfrac{\\vec v_3 \\cdot \\vec u_1}{\\vec u_1 \\cdot \\vec u_1}$ (note $\\vec u_1 \\cdot \\vec u_1 = 2$).`, answer: `${a}`, accept: [], hint: `$\\vec v_3 \\cdot \\vec u_1 = ${v3[0]} + ${v3[1]} = ${2 * a}$, then divide by 2.` },
      { instruction: `Compute $c_2 = \\dfrac{\\vec v_3 \\cdot \\vec u_2}{\\vec u_2 \\cdot \\vec u_2}$ (note $\\vec u_2 \\cdot \\vec u_2 = 2$).`, answer: `${b}`, accept: [], hint: `$\\vec v_3 \\cdot \\vec u_2 = ${v3[0]} - (${v3[1]}) = ${2 * b}$, then divide by 2.` },
      { instruction: `Compute $\\vec u_3 = \\vec v_3 - ${a}\\vec u_1 ${b < 0 ? "+" : "-"} ${Math.abs(b)}\\vec u_2$ as $\\langle x, y, z \\rangle$.`, answer: vec(u3), accept: [], hint: `The first two components cancel completely.` },
    ],
    finalAnswer: { value: vec(u3), unit: "" },
    solutionNarrative: `$c_1 = ${a}$ and $c_2 = ${b}$, so $\\vec u_3 = \\vec v_3 - ${a}\\vec u_1 - (${b})\\vec u_2 = ${lvec(u3)}$ — orthogonal to both $\\vec u_1$ and $\\vec u_2$.`,
  };
};

fill["gsq-three-2"] = (rng, idx) => {
  const p = nz(rng, -3, 3), q = nz(rng, -3, 3), r = nz(rng, -3, 3);
  const mm = rng.pick([1, 2, -2, 3]);
  const v1 = [1, 1, 0];
  const v2 = [p + 1, p - 1, 0];
  const v3 = [q + r, q - r, mm];
  const u2 = [1, -1, 0];
  const u3 = [0, 0, mm];
  return {
    id: `gen.gsq-three-2.${idx}`, generated: true, concepts: ["orthogonalize-three-vectors"], difficulty: 2, context: "abstract",
    prompt: `Run the full Gram-Schmidt process on $\\vec v_1 = ${lvec(v1)}$, $\\vec v_2 = ${lvec(v2)}$, $\\vec v_3 = ${lvec(v3)}$ (take $\\vec u_1 = \\vec v_1$).`,
    steps: [
      { instruction: `Compute $\\vec v_2 \\cdot \\vec u_1$.`, answer: `${2 * p}`, accept: [], hint: `$(${v2[0]}) + (${v2[1]})$.` },
      { instruction: `With $\\vec u_1 \\cdot \\vec u_1 = 2$, the coefficient is $${p}$. Compute $\\vec u_2 = \\vec v_2 - ${p}\\vec u_1$.`, answer: vec(u2), accept: [], hint: `$\\langle ${v2[0]} - ${p}, ${v2[1]} - ${p}, 0 \\rangle$.` },
      { instruction: `Compute $c_1 = \\dfrac{\\vec v_3 \\cdot \\vec u_1}{2}$.`, answer: `${q}`, accept: [], hint: `$\\vec v_3 \\cdot \\vec u_1 = ${v3[0]} + (${v3[1]}) = ${2 * q}$.` },
      { instruction: `Compute $c_2 = \\dfrac{\\vec v_3 \\cdot \\vec u_2}{2}$.`, answer: `${r}`, accept: [], hint: `$\\vec v_3 \\cdot \\vec u_2 = ${v3[0]} - (${v3[1]}) = ${2 * r}$.` },
      { instruction: `Compute $\\vec u_3 = \\vec v_3 - ${q}\\vec u_1 ${r < 0 ? "+" : "-"} ${Math.abs(r)}\\vec u_2$ as $\\langle x, y, z \\rangle$.`, answer: vec(u3), accept: [], hint: `Only the third component survives.` },
    ],
    finalAnswer: { value: vec(u3), unit: "" },
    solutionNarrative: `$\\vec u_2 = \\vec v_2 - ${p}\\vec u_1 = ${lvec(u2)}$; then $c_1 = ${q}$, $c_2 = ${r}$ give $\\vec u_3 = ${lvec(u3)}$. All three $\\vec u$'s are mutually orthogonal.`,
  };
};

fill["gsq-three-3"] = (rng, idx) => {
  const p = nz(rng, -2, 2), q = nz(rng, -2, 2), r = nz(rng, -2, 2);
  const mm = rng.pick([1, -1]);
  const v1 = C3[0];                                   // <1,1,1>, norm^2 3
  const v2 = add(scale(C3[0], p), C3[1]);             // coefficient p over u1
  const v3 = add(add(scale(C3[0], q), scale(C3[1], r)), scale(C3[2], mm));
  const u2 = C3[1];                                   // <1,-1,0>, norm^2 2
  const u3 = scale(C3[2], mm);
  return {
    id: `gen.gsq-three-3.${idx}`, generated: true, concepts: ["orthogonalize-three-vectors"], difficulty: 3, context: "abstract",
    prompt: `Run Gram-Schmidt on $\\vec v_1 = ${lvec(v1)}$, $\\vec v_2 = ${lvec(v2)}$, $\\vec v_3 = ${lvec(v3)}$ (take $\\vec u_1 = \\vec v_1$; note $\\vec u_1 \\cdot \\vec u_1 = 3$).`,
    steps: [
      { instruction: `Compute $\\vec v_2 \\cdot \\vec u_1$.`, answer: `${3 * p}`, accept: [], hint: `$(${v2[0]}) + (${v2[1]}) + (${v2[2]})$.` },
      { instruction: `Compute the coefficient $\\dfrac{\\vec v_2 \\cdot \\vec u_1}{3}$.`, answer: `${p}`, accept: [], hint: `$${3 * p}/3$.` },
      { instruction: `Compute $\\vec u_2 = \\vec v_2 - ${p}\\vec u_1$ as $\\langle x, y, z \\rangle$.`, answer: vec(u2), accept: [], hint: `Subtract $${p}$ from each component of $\\vec v_2$... carefully: $${p}\\vec u_1 = ${lvec(scale(v1, p))}$.` },
      { instruction: `Compute $\\vec v_3 \\cdot \\vec u_1$.`, answer: `${3 * q}`, accept: [], hint: `Add the three components of $\\vec v_3$.` },
      { instruction: `Compute $\\vec v_3 \\cdot \\vec u_2$ (note $\\vec u_2 \\cdot \\vec u_2 = 2$, so the coefficient will be this over 2).`, answer: `${2 * r}`, accept: [], hint: `$(${v3[0]}) - (${v3[1]})$.` },
      { instruction: `With coefficients $${q}$ (on $\\vec u_1$) and $${r}$ (on $\\vec u_2$), compute $\\vec u_3 = \\vec v_3 - ${q}\\vec u_1 ${r < 0 ? "+" : "-"} ${Math.abs(r)}\\vec u_2$.`, answer: vec(u3), accept: [], hint: `The result is a multiple of $\\langle 1, 1, -2 \\rangle$.` },
    ],
    finalAnswer: { value: vec(u3), unit: "" },
    solutionNarrative: `Coefficient on $\\vec u_1$: $${3 * p}/3 = ${p}$, so $\\vec u_2 = ${lvec(u2)}$. For $\\vec v_3$: coefficients $${q}$ and $${r}$, leaving $\\vec u_3 = ${lvec(u3)}$. The set $\\{\\vec u_1, \\vec u_2, \\vec u_3\\}$ is orthogonal.`,
  };
};

// ============================================================================
// GRAM-SCHMIDT: orthonormal-basis-and-qr
// ============================================================================

fill["gsq-qr-1"] = (rng, idx) => {
  const [a, b] = rng.pick(PY2);
  const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]);
  const v = [a * s1, b * s2];
  const n = Math.round(Math.sqrt(a * a + b * b));
  return {
    id: `gen.gsq-qr-1.${idx}`, generated: true, concepts: ["orthonormal-basis-and-qr"], difficulty: 1, context: "abstract",
    prompt: `Normalize $\\vec v = ${lvec(v)}$ to a unit vector.`,
    steps: [
      { instruction: `Compute $\\lVert \\vec v \\rVert = \\sqrt{(${v[0]})^2 + (${v[1]})^2}$.`, answer: `${n}`, accept: [], hint: `$\\sqrt{${a * a} + ${b * b}} = \\sqrt{${a * a + b * b}}$.` },
      { instruction: `Divide each component by the norm. Give the unit vector with exact fractions.`, answer: fvec(v, n), accept: [`<${v[0]}/${n}, ${v[1]}/${n}>`], hint: `$\\dfrac{1}{${n}}${lvec(v)}$.` },
    ],
    finalAnswer: { value: fvec(v, n), unit: "" },
    solutionNarrative: `$\\lVert \\vec v \\rVert = \\sqrt{${a * a + b * b}} = ${n}$, so the unit vector is $\\langle ${v.map((x) => frac(x, n)).join(", ")} \\rangle$.`,
  };
};

fill["gsq-qr-2"] = (rng, idx) => {
  const [a, b] = rng.pick(PY2);
  const s = rng.pick([1, -1]);
  const u1 = [a * s, b * s];
  const u2 = [-u1[1], u1[0]];
  const n = Math.round(Math.sqrt(a * a + b * b));
  return {
    id: `gen.gsq-qr-2.${idx}`, generated: true, concepts: ["orthonormal-basis-and-qr"], difficulty: 2, context: "abstract",
    prompt: `Gram-Schmidt produced the orthogonal pair $\\vec u_1 = ${lvec(u1)}$, $\\vec u_2 = ${lvec(u2)}$. Normalize both to get the columns $\\vec q_1, \\vec q_2$ of the orthogonal matrix $Q$.`,
    steps: [
      { instruction: `Confirm orthogonality first: $\\vec u_1 \\cdot \\vec u_2 = ?$`, answer: "0", accept: [], hint: `$(${u1[0]})(${u2[0]}) + (${u1[1]})(${u2[1]})$.` },
      { instruction: `Both vectors have the same norm. Compute it, then give $\\vec q_1 = \\vec u_1 / \\lVert \\vec u_1 \\rVert$ with exact fractions.`, answer: fvec(u1, n), accept: [`<${u1[0]}/${n}, ${u1[1]}/${n}>`], hint: `$\\lVert \\vec u_1 \\rVert = \\sqrt{${a * a + b * b}} = ${n}$.` },
      { instruction: `Give $\\vec q_2 = \\vec u_2 / \\lVert \\vec u_2 \\rVert$ with exact fractions.`, answer: fvec(u2, n), accept: [`<${u2[0]}/${n}, ${u2[1]}/${n}>`], hint: `Same norm $${n}$.` },
    ],
    finalAnswer: { value: fvec(u2, n), unit: "" },
    solutionNarrative: `$\\vec u_1 \\cdot \\vec u_2 = 0$ and both norms are $${n}$, so $Q$ has columns $\\vec q_1 = \\langle ${u1.map((x) => frac(x, n)).join(", ")} \\rangle$ and $\\vec q_2 = \\langle ${u2.map((x) => frac(x, n)).join(", ")} \\rangle$.`,
  };
};

fill["gsq-qr-3"] = (rng, idx) => {
  const i = rng.int(0, 2);
  const j = (i + rng.int(1, 2)) % 3;
  const k1 = rng.int(1, 2), k2 = rng.int(1, 2);
  const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]);
  const u1 = scale(T3[i], k1 * s1);
  const u2 = scale(T3[j], k2 * s2);
  const q1n = scale(T3[i], s1);   // q1 = q1n / 3
  const q2n = scale(T3[j], s2);
  return {
    id: `gen.gsq-qr-3.${idx}`, generated: true, concepts: ["orthonormal-basis-and-qr"], difficulty: 3, context: "abstract",
    prompt: `Gram-Schmidt on two vectors in $\\mathbb{R}^3$ produced $\\vec u_1 = ${lvec(u1)}$ and $\\vec u_2 = ${lvec(u2)}$. Build the orthonormal columns of $Q$ and the diagonal of $R$ in the QR factorization.`,
    steps: [
      { instruction: `Confirm orthogonality: $\\vec u_1 \\cdot \\vec u_2 = ?$`, answer: "0", accept: [], hint: `Multiply matching components and add all three products.` },
      { instruction: `Compute $\\lVert \\vec u_1 \\rVert$.`, answer: `${3 * k1}`, accept: [], hint: `$\\sqrt{${u1[0] * u1[0]} + ${u1[1] * u1[1]} + ${u1[2] * u1[2]}} = \\sqrt{${9 * k1 * k1}}$.` },
      { instruction: `Give $\\vec q_1 = \\vec u_1 / \\lVert \\vec u_1 \\rVert$ with exact fractions.`, answer: fvec(q1n, 3), accept: [`<${u1.map((x) => `${x}/${3 * k1}`).join(", ")}>`], hint: `Dividing $${lvec(u1)}$ by $${3 * k1}$ reduces to thirds.` },
      { instruction: `Compute $\\lVert \\vec u_2 \\rVert$, then give $\\vec q_2$ with exact fractions.`, answer: fvec(q2n, 3), accept: [`<${u2.map((x) => `${x}/${3 * k2}`).join(", ")}>`], hint: `$\\lVert \\vec u_2 \\rVert = ${3 * k2}$.` },
      { instruction: `In $A = QR$, the diagonal entry $r_{11}$ is $\\lVert \\vec u_1 \\rVert$. State $r_{11}$.`, answer: `${3 * k1}`, accept: [], hint: `Already computed above.` },
    ],
    finalAnswer: { value: fvec(q2n, 3), unit: "" },
    solutionNarrative: `$\\vec u_1 \\cdot \\vec u_2 = 0$; the norms are $${3 * k1}$ and $${3 * k2}$, so $\\vec q_1 = \\langle ${q1n.map((x) => frac(x, 3)).join(", ")} \\rangle$, $\\vec q_2 = \\langle ${q2n.map((x) => frac(x, 3)).join(", ")} \\rangle$, and $r_{11} = ${3 * k1}$.`,
  };
};
