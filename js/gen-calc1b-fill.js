// gen-calc1b-fill.js
// Self-contained generator pack for two Calculus 1 topics:
//   - calculus-1.lhopital-rule                    (templates prefixed c1b-identify/lhop/growth)
//   - calculus-1.linearization-and-differentials  (templates prefixed c1b-linearize/approx/differentials/error)
// Gives every key concept a generator at difficulty 1, 2, and 3. Exports a
// `fill` map of template-name -> generator fn matching the shape used by
// js/generator.js (same pattern as gen-calc1-fill.js / gen-de-fill.js).
// Deterministic from the passed rng only; no imports from generator.js.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string, sign carried on the numerator: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Print a float without binary noise (14.700000000001 -> "14.7").
const fmt = (x) => String(Math.round(x * 100000) / 100000);

// Shared accept lists for the classification / menu-word answers.
const ACC_00 = ["zero over zero", "0 over 0"];
const ACC_II = ["infinity/infinity", "∞/∞", "inf over inf", "infinity over infinity"];
const ACC_NI = ["not", "neither", "no", "none"];
const ACC_INF = ["inf", "+infinity", "∞", "diverges to infinity"];
const CLASSIFY = "Answer '0/0', 'inf/inf', or 'not indeterminate'.";

export const fill = {};

// ============================================================================
// Topic A: calculus-1.lhopital-rule
// ============================================================================

// --- identify-indeterminate-forms --------------------------------------------

// d1: classify a genuine 0/0 (factorable quotient at a point) or a genuine
// inf/inf (same-degree rational function at infinity).
fill["c1b-identify-forms-1"] = (rng, idx) => {
  const zeroForm = rng.pick([true, false]);
  if (zeroForm) {
    const a = rng.int(2, 6);
    return {
      id: `gen.c1b-identify-forms-1.${idx}`, generated: true, concepts: ["identify-indeterminate-forms"], difficulty: 1, context: "abstract",
      prompt: `Classify the form of $\\lim_{x \\to ${a}}\\frac{x^2 - ${a * a}}{x - ${a}}$ before evaluating it.`,
      steps: [
        { instruction: `Substitute $x = ${a}$ into the numerator $x^2 - ${a * a}$. What value does it approach?`, answer: "0", accept: [], hint: `$${a}^2 - ${a * a} = 0$.` },
        { instruction: `Substitute $x = ${a}$ into the denominator $x - ${a}$. What value does it approach?`, answer: "0", accept: [], hint: `$${a} - ${a} = 0$.` },
        { instruction: `Classify the form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: "Both top and bottom head to 0 — the classic stalemate." },
      ],
      finalAnswer: { value: "0/0", unit: "" },
      solutionNarrative: `At $x = ${a}$ both the numerator and the denominator vanish, so the limit is the indeterminate form $0/0$ and needs more work (factoring or L'Hôpital).`,
    };
  }
  const p = rng.int(2, 7), r = rng.int(2, 7), q = rng.int(1, 9), s = rng.int(1, 9);
  return {
    id: `gen.c1b-identify-forms-1.${idx}`, generated: true, concepts: ["identify-indeterminate-forms"], difficulty: 1, context: "abstract",
    prompt: `Classify the form of $\\lim_{x \\to \\infty}\\frac{${p}x^2 + ${q}}{${r}x^2 + ${s}}$.`,
    steps: [
      { instruction: `As $x \\to \\infty$, what does the numerator $${p}x^2 + ${q}$ do? Answer 'infinity' if it grows without bound.`, answer: "infinity", accept: ACC_INF, hint: "A positive-leading-coefficient polynomial blows up." },
      { instruction: `As $x \\to \\infty$, what does the denominator $${r}x^2 + ${s}$ do? Answer 'infinity' if it grows without bound.`, answer: "infinity", accept: ACC_INF, hint: "Same story on the bottom." },
      { instruction: `Classify the form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both top and bottom blow up." },
    ],
    finalAnswer: { value: "inf/inf", unit: "" },
    solutionNarrative: `Both polynomials grow without bound as $x \\to \\infty$, so the limit is the indeterminate form $\\infty/\\infty$.`,
  };
};

// d2: NOT indeterminate — substitute, see an ordinary quotient, evaluate it.
fill["c1b-identify-forms-2"] = (rng, idx) => {
  const a = rng.int(1, 5);
  let c = rng.int(1, 5); if (c === a) c = a + 1; // keep the denominator nonzero at x = a
  const b = rng.int(1, 6);
  const num = a * a + b, den = a - c;
  const val = frac(num, den);
  return {
    id: `gen.c1b-identify-forms-2.${idx}`, generated: true, concepts: ["identify-indeterminate-forms"], difficulty: 2, context: "abstract",
    prompt: `Classify the form of $\\lim_{x \\to ${a}}\\frac{x^2 + ${b}}{x - ${c}}$, then evaluate the limit.`,
    steps: [
      { instruction: `Substitute $x = ${a}$ into the numerator $x^2 + ${b}$.`, answer: `${num}`, accept: [], hint: `$${a}^2 + ${b} = ${num}$.` },
      { instruction: `Substitute $x = ${a}$ into the denominator $x - ${c}$.`, answer: `${den}`, accept: [], hint: `$${a} - ${c} = ${den}$.` },
      { instruction: `Classify the form. ${CLASSIFY}`, answer: "not indeterminate", accept: ACC_NI, hint: `$\\frac{${num}}{${den}}$ is an ordinary quotient — no stalemate, no L'Hôpital.` },
      { instruction: "So the limit is just the quotient of those two values. Give a fraction or decimal.", answer: val, accept: [`${num}/${den}`], hint: `$\\frac{${num}}{${den}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `Substitution gives $\\frac{${num}}{${den}}$, which is not indeterminate — the limit is simply $${val.includes("/") ? `\\frac{${val.split("/")[0]}}{${val.split("/")[1]}}` : val}$. Applying L'Hôpital here would be illegal.`,
  };
};

// d3: the 0/(nonzero) trap — the numerator dies but the form is NOT 0/0.
fill["c1b-identify-forms-3"] = (rng, idx) => {
  const a = rng.int(1, 6);
  return {
    id: `gen.c1b-identify-forms-3.${idx}`, generated: true, concepts: ["identify-indeterminate-forms"], difficulty: 3, context: "abstract",
    prompt: `A student sees $\\lim_{x \\to ${a}}\\frac{x^2 - ${a * a}}{x + ${a}}$, notices the numerator vanishes at $x = ${a}$, and reaches for L'Hôpital's rule. Check whether the rule actually applies, then find the limit.`,
    steps: [
      { instruction: `Substitute $x = ${a}$ into the numerator $x^2 - ${a * a}$.`, answer: "0", accept: [], hint: `$${a * a} - ${a * a} = 0$.` },
      { instruction: `Substitute $x = ${a}$ into the denominator $x + ${a}$.`, answer: `${2 * a}`, accept: [], hint: `$${a} + ${a} = ${2 * a}$.` },
      { instruction: `The form is $\\frac{0}{${2 * a}}$. Classify it. ${CLASSIFY}`, answer: "not indeterminate", accept: ACC_NI, hint: "Zero over a NONZERO number is not a stalemate — it is just 0. Only 0/0 is indeterminate." },
      { instruction: "So the limit is the quotient itself. Evaluate it.", answer: "0", accept: [`0/${2 * a}`], hint: `$\\frac{0}{${2 * a}} = 0$.` },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `Only the numerator vanishes: the form is $\\frac{0}{${2 * a}} = 0$, not indeterminate. L'Hôpital's rule does not apply — and using it anyway would give the wrong answer $\\frac{2 \\cdot ${a}}{1} = ${2 * a}$.`,
  };
};

// --- lhopital-zero-over-zero --------------------------------------------------

// d1: lim x->0 sin(kx)/x = k.
fill["c1b-lhop-zero-1"] = (rng, idx) => {
  const k = rng.int(2, 9);
  return {
    id: `gen.c1b-lhop-zero-1.${idx}`, generated: true, concepts: ["lhopital-zero-over-zero"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to 0}\\frac{\\sin ${k}x}{x}$ using L'Hôpital's rule.`,
    steps: [
      { instruction: `Substitute $x = 0$ into top and bottom. Classify the form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: `$\\sin 0 = 0$ over $0$.` },
      { instruction: `The derivative of the numerator is $${k}\\cos ${k}x$. Evaluate it at $x = 0$.`, answer: `${k}`, accept: [`${k}cos(0)`], hint: `$\\cos 0 = 1$, so the value is $${k} \\cdot 1$.` },
      { instruction: "The derivative of the denominator $x$ is constant. What is it?", answer: "1", accept: [], hint: "$\\frac{d}{dx}x = 1$." },
      { instruction: "The limit equals the ratio of those derivative values. Evaluate it.", answer: `${k}`, accept: [`${k}/1`], hint: `$\\frac{${k}}{1}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `The form is $0/0$, so L'Hôpital applies: $\\lim_{x \\to 0}\\frac{\\sin ${k}x}{x} = \\lim_{x \\to 0}\\frac{${k}\\cos ${k}x}{1} = ${k}$.`,
  };
};

// d2: lim x->0 (e^(kx) - 1)/(mx) = k/m.
fill["c1b-lhop-zero-2"] = (rng, idx) => {
  const k = rng.int(2, 7), m = rng.int(2, 5);
  const val = frac(k, m);
  return {
    id: `gen.c1b-lhop-zero-2.${idx}`, generated: true, concepts: ["lhopital-zero-over-zero"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to 0}\\frac{e^{${k}x} - 1}{${m}x}$ using L'Hôpital's rule.`,
    steps: [
      { instruction: `Substitute $x = 0$ into top and bottom. Classify the form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: `$e^0 - 1 = 0$ over $${m} \\cdot 0 = 0$.` },
      { instruction: `The derivative of the numerator is $${k}e^{${k}x}$. Evaluate it at $x = 0$.`, answer: `${k}`, accept: [`${k}e^0`], hint: `$e^0 = 1$.` },
      { instruction: `The derivative of the denominator $${m}x$ is constant. What is it?`, answer: `${m}`, accept: [], hint: `$\\frac{d}{dx}(${m}x) = ${m}$.` },
      { instruction: "The limit is the ratio of those values. Give a fraction or decimal.", answer: val, accept: [`${k}/${m}`], hint: `$\\frac{${k}}{${m}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `The form is $0/0$; differentiating separately gives $\\frac{${k}e^{${k}x}}{${m}}$, which at $x = 0$ is $\\frac{${k}}{${m}}$${val !== `${k}/${m}` ? ` $= ${val}$` : ""}.`,
  };
};

// d3: lim x->0 sin(ax)/sin(bx) = a/b (a != b guaranteed by construction).
fill["c1b-lhop-zero-3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const b = a + rng.int(1, 4); // always distinct from a
  const val = frac(a, b);
  return {
    id: `gen.c1b-lhop-zero-3.${idx}`, generated: true, concepts: ["lhopital-zero-over-zero"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to 0}\\frac{\\sin ${a}x}{\\sin ${b}x}$ using L'Hôpital's rule.`,
    steps: [
      { instruction: `Substitute $x = 0$ into top and bottom. Classify the form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: "Both sines vanish at 0." },
      { instruction: `The derivative of the numerator is $${a}\\cos ${a}x$. Evaluate it at $x = 0$.`, answer: `${a}`, accept: [`${a}cos(0)`], hint: `$\\cos 0 = 1$.` },
      { instruction: `The derivative of the denominator is $${b}\\cos ${b}x$. Evaluate it at $x = 0$.`, answer: `${b}`, accept: [`${b}cos(0)`], hint: `$\\cos 0 = 1$ again.` },
      { instruction: "The limit is the ratio of those values. Give a fraction.", answer: val, accept: [`${a}/${b}`], hint: `$\\frac{${a}}{${b}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `A genuine $0/0$: one application gives $\\frac{${a}\\cos ${a}x}{${b}\\cos ${b}x}$, which at $x = 0$ is $\\frac{${a}}{${b}}$ — each sine contributes its inner coefficient.`,
  };
};

// --- lhopital-inf-over-inf ------------------------------------------------------

// d1: same-degree linear rational function at infinity -> a/c.
fill["c1b-lhop-inf-1"] = (rng, idx) => {
  const a = rng.int(2, 9), c = rng.int(2, 9), b = rng.int(1, 9), d = rng.int(1, 9);
  const val = frac(a, c);
  return {
    id: `gen.c1b-lhop-inf-1.${idx}`, generated: true, concepts: ["lhopital-inf-over-inf"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to \\infty}\\frac{${a}x + ${b}}{${c}x - ${d}}$ using L'Hôpital's rule.`,
    steps: [
      { instruction: `As $x \\to \\infty$ both top and bottom blow up. Classify the form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both linear polynomials head to $+\\infty$." },
      { instruction: `Differentiate the numerator $${a}x + ${b}$. What constant do you get?`, answer: `${a}`, accept: [], hint: `$\\frac{d}{dx}(${a}x + ${b}) = ${a}$.` },
      { instruction: `Differentiate the denominator $${c}x - ${d}$. What constant do you get?`, answer: `${c}`, accept: [], hint: `$\\frac{d}{dx}(${c}x - ${d}) = ${c}$.` },
      { instruction: "The limit is the ratio of those constants. Give a fraction or decimal.", answer: val, accept: [`${a}/${c}`], hint: `$\\frac{${a}}{${c}}$ — the ratio of leading coefficients.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `The form is $\\infty/\\infty$; one application of L'Hôpital gives $\\frac{${a}}{${c}}$${val !== `${a}/${c}` ? ` $= ${val}$` : ""}, matching the leading-coefficient shortcut.`,
  };
};

// d2: same-degree quadratic rational function -> two applications -> a/c.
fill["c1b-lhop-inf-2"] = (rng, idx) => {
  const a = rng.int(2, 6), c = rng.int(2, 6), b = rng.int(1, 9), d = rng.int(1, 9);
  const val = frac(a, c);
  return {
    id: `gen.c1b-lhop-inf-2.${idx}`, generated: true, concepts: ["lhopital-inf-over-inf"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to \\infty}\\frac{${a}x^2 + ${b}x}{${c}x^2 + ${d}}$, applying L'Hôpital's rule as many times as needed.`,
    steps: [
      { instruction: `Classify the original form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both quadratics blow up." },
      { instruction: `One application gives $\\frac{${2 * a}x + ${b}}{${2 * c}x}$. Classify this new form as $x \\to \\infty$. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Still two quantities that blow up — the license renews." },
      { instruction: `Apply the rule once more: differentiate $${2 * a}x + ${b}$ and $${2 * c}x$ and take the ratio. Give a fraction or decimal.`, answer: val, accept: [`${2 * a}/${2 * c}`, `${a}/${c}`], hint: `$\\frac{${2 * a}}{${2 * c}}$, which reduces.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$\\infty/\\infty$ twice over: $\\frac{${a}x^2 + ${b}x}{${c}x^2 + ${d}} \\to \\frac{${2 * a}x + ${b}}{${2 * c}x} \\to \\frac{${2 * a}}{${2 * c}} = ${val.includes("/") ? `\\frac{${val.split("/")[0]}}{${val.split("/")[1]}}` : val}$ — the leading-coefficient ratio.`,
  };
};

// d3: mismatched degrees — the limit is infinity (top-heavy) or 0 (bottom-heavy).
fill["c1b-lhop-inf-3"] = (rng, idx) => {
  const topHeavy = rng.pick([true, false]);
  const a = rng.int(2, 7), c = rng.int(2, 7), b = rng.int(1, 9), d = rng.int(1, 9);
  if (topHeavy) {
    const ratio = `${2 * a}x/${c}`;
    return {
      id: `gen.c1b-lhop-inf-3.${idx}`, generated: true, concepts: ["lhopital-inf-over-inf"], difficulty: 3, context: "abstract",
      prompt: `Evaluate $\\lim_{x \\to \\infty}\\frac{${a}x^2 + ${b}}{${c}x + ${d}}$. Use 'infinity' or '-infinity' if the limit is infinite.`,
      steps: [
        { instruction: `Classify the form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both polynomials blow up as $x \\to \\infty$." },
        { instruction: "Apply L'Hôpital once: differentiate top and bottom and write the new ratio.", answer: ratio, accept: [`(${2 * a}x)/${c}`, `(${2 * a}/${c})x`, frac(2 * a, c) === `${2 * a}/${c}` ? `${2 * a}x/${c}` : `${frac(2 * a, c)}x`], hint: `Top: $${2 * a}x$. Bottom: $${c}$.` },
        { instruction: `As $x \\to \\infty$, what does $\\frac{${2 * a}x}{${c}}$ do? Answer 'infinity', '-infinity', or a number.`, answer: "infinity", accept: ACC_INF, hint: "A positive-slope linear function over a constant grows without bound." },
      ],
      finalAnswer: { value: "infinity", unit: "" },
      solutionNarrative: `One application leaves $\\frac{${2 * a}x}{${c}}$, no longer indeterminate — it grows without bound. The top-heavy ratio diverges to $+\\infty$.`,
    };
  }
  const ratio = `${a}/(${2 * c}x)`;
  return {
    id: `gen.c1b-lhop-inf-3.${idx}`, generated: true, concepts: ["lhopital-inf-over-inf"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to \\infty}\\frac{${a}x + ${b}}{${c}x^2 + ${d}}$ using L'Hôpital's rule.`,
    steps: [
      { instruction: `Classify the form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both polynomials blow up as $x \\to \\infty$." },
      { instruction: "Apply L'Hôpital once: differentiate top and bottom and write the new ratio.", answer: ratio, accept: [`(${a})/(${2 * c}x)`, `${a}/${2 * c}x`], hint: `Top: $${a}$. Bottom: $${2 * c}x$.` },
      { instruction: `As $x \\to \\infty$, what does $\\frac{${a}}{${2 * c}x}$ approach?`, answer: "0", accept: [], hint: "A constant over something that blows up shrinks to 0." },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `One application leaves $\\frac{${a}}{${2 * c}x}$, which dies to 0 as $x \\to \\infty$ — the bottom-heavy ratio loses the race.`,
  };
};

// --- repeated-and-growth-rates -------------------------------------------------

// d1: ln x vs x — lim (k ln x)/x = 0, so x wins.
fill["c1b-growth-rates-1"] = (rng, idx) => {
  const k = rng.int(2, 9);
  return {
    id: `gen.c1b-growth-rates-1.${idx}`, generated: true, concepts: ["repeated-and-growth-rates"], difficulty: 1, context: "abstract",
    prompt: `Which grows faster, $\\ln x$ or $x$? Decide by evaluating $\\lim_{x \\to \\infty}\\frac{${k}\\ln x}{x}$.`,
    steps: [
      { instruction: `Classify the form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Both $\\ln x$ and $x$ grow without bound (the log just does it slowly)." },
      { instruction: `Apply L'Hôpital: the ratio becomes $\\frac{${k}/x}{1} = \\frac{${k}}{x}$. Evaluate its limit as $x \\to \\infty$.`, answer: "0", accept: [], hint: `$\\frac{${k}}{x}$ shrinks to 0.` },
      { instruction: "A limit of 0 means the numerator loses the race. Which grows faster: type 'ln x' or 'x'?", answer: "x", accept: ["x grows faster", "linear", "the denominator"], hint: "The ratio dying to 0 means $\\ln x$ becomes negligible next to $x$." },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `$\\frac{${k}\\ln x}{x}$ is $\\infty/\\infty$; L'Hôpital gives $\\frac{${k}/x}{1} \\to 0$. The logarithm grows more slowly than $x$ — the coefficient ${k} never had a vote.`,
  };
};

// d2: x^2 vs e^x — two applications, exponential wins.
fill["c1b-growth-rates-2"] = (rng, idx) => {
  const a = rng.int(2, 6);
  return {
    id: `gen.c1b-growth-rates-2.${idx}`, generated: true, concepts: ["repeated-and-growth-rates"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to \\infty}\\frac{${a}x^2}{e^x}$ by applying L'Hôpital's rule twice.`,
    steps: [
      { instruction: `Classify the original form. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: `$${a}x^2$ and $e^x$ both blow up.` },
      { instruction: `One application gives $\\frac{${2 * a}x}{e^x}$. Classify this form as $x \\to \\infty$. ${CLASSIFY}`, answer: "inf/inf", accept: ACC_II, hint: "Still a race between two unbounded quantities — apply the rule again." },
      { instruction: `A second application gives $\\frac{${2 * a}}{e^x}$. Evaluate its limit as $x \\to \\infty$.`, answer: "0", accept: [], hint: "A constant over $e^x$ shrinks to 0." },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `Two rounds: $\\frac{${a}x^2}{e^x} \\to \\frac{${2 * a}x}{e^x} \\to \\frac{${2 * a}}{e^x} \\to 0$. The exponential crushes $x^2$ — and with more repetitions, any polynomial.`,
  };
};

// d3: repeated 0/0 — lim x->0 (1 - cos(kx))/x^2 = k^2/2.
fill["c1b-growth-rates-3"] = (rng, idx) => {
  const k = rng.int(1, 4);
  const val = frac(k * k, 2);
  const kS = k === 1 ? "" : `${k}`;
  return {
    id: `gen.c1b-growth-rates-3.${idx}`, generated: true, concepts: ["repeated-and-growth-rates"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\lim_{x \\to 0}\\frac{1 - \\cos ${kS}x}{x^2}$ by applying L'Hôpital's rule twice.`,
    steps: [
      { instruction: `Substitute $x = 0$. Classify the form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: `$1 - \\cos 0 = 0$ and $0^2 = 0$.` },
      { instruction: `One application gives $\\frac{${kS}\\sin ${kS}x}{2x}$. Substitute $x = 0$ and classify this new form. ${CLASSIFY}`, answer: "0/0", accept: ACC_00, hint: "$\\sin 0 = 0$ over $0$ — still a stalemate, so the rule applies again." },
      { instruction: `A second application gives $\\frac{${k * k}\\cos ${kS}x}{2}$. Evaluate it at $x = 0$. Give a fraction or decimal.`, answer: val, accept: [`${k * k}/2`, fmt(k * k / 2)], hint: `$\\cos 0 = 1$, so the value is $\\frac{${k * k}}{2}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `Each pass is re-licensed by a fresh $0/0$ check: $\\frac{1 - \\cos ${kS}x}{x^2} \\to \\frac{${kS}\\sin ${kS}x}{2x} \\to \\frac{${k * k}\\cos ${kS}x}{2} = \\frac{${k * k}}{2}$ at $x = 0$.`,
  };
};

// ============================================================================
// Topic B: calculus-1.linearization-and-differentials
// ============================================================================

// --- tangent-line-approximation -----------------------------------------------

// d1: linearize f(x) = x^2 at a.
fill["c1b-linearize-1"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const L = `${a * a} + ${2 * a}(x - ${a})`;
  const Ls = `${2 * a}x - ${a * a}`;
  return {
    id: `gen.c1b-linearize-1.${idx}`, generated: true, concepts: ["tangent-line-approximation"], difficulty: 1, context: "abstract",
    prompt: `Build the linearization $L(x)$ of $f(x) = x^2$ at $a = ${a}$.`,
    steps: [
      { instruction: `Compute the height $f(${a})$.`, answer: `${a * a}`, accept: [], hint: `$${a}^2$.` },
      { instruction: "Differentiate: what is $f'(x)$?", answer: "2x", accept: [], hint: "Power rule on $x^2$." },
      { instruction: `Compute the slope $f'(${a})$.`, answer: `${2 * a}`, accept: [], hint: `$2 \\cdot ${a}$.` },
      { instruction: "Assemble $L(x) = f(a) + f'(a)(x - a)$. Write it as an expression in $x$.", answer: L, accept: [Ls, `${2 * a}x-${a * a}`], hint: `$${a * a} + ${2 * a}(x - ${a})$ — simplifying to $${Ls}$ is fine too.` },
    ],
    finalAnswer: { value: `L(x) = ${Ls}`, unit: "" },
    solutionNarrative: `Height $f(${a}) = ${a * a}$, slope $f'(${a}) = ${2 * a}$, so $L(x) = ${a * a} + ${2 * a}(x - ${a}) = ${Ls}$.`,
  };
};

// d2: linearize f(x) = sqrt(x) at a perfect square a = s^2.
fill["c1b-linearize-2"] = (rng, idx) => {
  const s = rng.pick([2, 3, 4, 5]);
  const a = s * s;
  const L = `${s} + (x - ${a})/${2 * s}`;
  const Ls = `x/${2 * s} + ${frac(s, 2)}`;
  return {
    id: `gen.c1b-linearize-2.${idx}`, generated: true, concepts: ["tangent-line-approximation"], difficulty: 2, context: "abstract",
    prompt: `Build the linearization $L(x)$ of $f(x) = \\sqrt{x}$ at $a = ${a}$. (Recall $f'(x) = \\frac{1}{2\\sqrt{x}}$.)`,
    steps: [
      { instruction: `Compute the height $f(${a})$.`, answer: `${s}`, accept: [], hint: `$\\sqrt{${a}} = ${s}$.` },
      { instruction: `Evaluate the slope $f'(${a}) = \\frac{1}{2\\sqrt{${a}}}$. Give a fraction.`, answer: `1/${2 * s}`, accept: [], hint: `$\\frac{1}{2 \\cdot ${s}}$.` },
      { instruction: "Assemble $L(x) = f(a) + f'(a)(x - a)$. Write it as an expression in $x$.", answer: L, accept: [Ls, `${s} + (1/${2 * s})(x - ${a})`], hint: `$${s} + \\frac{x - ${a}}{${2 * s}}$.` },
    ],
    finalAnswer: { value: `L(x) = ${L}`, unit: "" },
    solutionNarrative: `Height $${s}$, slope $\\frac{1}{${2 * s}}$: $L(x) = ${s} + \\frac{x - ${a}}{${2 * s}}$ — one line that estimates any square root near ${a}.`,
  };
};

// d3: linearize f(x) = 1/x at a.
fill["c1b-linearize-3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const L = `1/${a} - (x - ${a})/${a * a}`;
  const Ls = `2/${a} - x/${a * a}`;
  return {
    id: `gen.c1b-linearize-3.${idx}`, generated: true, concepts: ["tangent-line-approximation"], difficulty: 3, context: "abstract",
    prompt: `Build the linearization $L(x)$ of $f(x) = \\frac{1}{x}$ at $a = ${a}$. (Recall $f'(x) = -\\frac{1}{x^2}$.)`,
    steps: [
      { instruction: `Compute the height $f(${a})$. Give a fraction.`, answer: `1/${a}`, accept: [], hint: `$\\frac{1}{${a}}$.` },
      { instruction: `Evaluate the slope $f'(${a}) = -\\frac{1}{${a}^2}$. Give a fraction — mind the sign.`, answer: `-1/${a * a}`, accept: [], hint: `$-\\frac{1}{${a * a}}$.` },
      { instruction: "Assemble $L(x) = f(a) + f'(a)(x - a)$. Write it as an expression in $x$.", answer: L, accept: [Ls, `1/${a} - (1/${a * a})(x - ${a})`], hint: `$\\frac{1}{${a}} - \\frac{x - ${a}}{${a * a}}$, which simplifies to $${Ls}$.` },
    ],
    finalAnswer: { value: `L(x) = ${Ls}`, unit: "" },
    solutionNarrative: `Height $\\frac{1}{${a}}$, slope $-\\frac{1}{${a * a}}$: $L(x) = \\frac{1}{${a}} - \\frac{x - ${a}}{${a * a}} = \\frac{2}{${a}} - \\frac{x}{${a * a}}$. Note the negative slope: reciprocals shrink as $x$ grows.`,
  };
};

// --- approximate-values ---------------------------------------------------------

// d1: applied "value + rate × step" forecast from measured f(a), f'(a).
fill["c1b-approx-value-1"] = (rng, idx) => {
  const F = rng.int(20, 80);
  const m = rng.pick([-4, -3, -2, 2, 3, 4]); // never 0: the linearization must not be flat
  const d = rng.pick([0.1, 0.2, 0.5]);
  const change = m * d, est = F + change;
  const ctx = rng.pick([
    { thing: "A reactor's temperature", sym: "T", unit: "°C", at: "hours", verb: "changing at" },
    { thing: "A tank's water level", sym: "W", unit: "cm", at: "minutes", verb: "changing at" },
    { thing: "A city's air-quality index", sym: "Q", unit: "points", at: "hours", verb: "drifting at" },
  ]);
  const a = rng.int(2, 6);
  return {
    id: `gen.c1b-approx-value-1.${idx}`, generated: true, concepts: ["approximate-values"], difficulty: 1, context: "applied",
    prompt: `${ctx.thing} at time $t = ${a}$ ${ctx.at} is $${ctx.sym}(${a}) = ${F}$ ${ctx.unit}, ${ctx.verb} $${ctx.sym}'(${a}) = ${m}$ ${ctx.unit} per ${ctx.at.slice(0, -1)}. Use the linearization to estimate $${ctx.sym}(${fmt(a + d)})$.`,
    steps: [
      { instruction: `The elapsed time is $${fmt(d)}$. Compute the predicted change $${ctx.sym}'(${a}) \\times ${fmt(d)}$.`, answer: fmt(change), accept: [], hint: `$${m} \\times ${fmt(d)}$.` },
      { instruction: `Add the change to the current value: estimate $${ctx.sym}(${fmt(a + d)})$ in ${ctx.unit}.`, answer: fmt(est), accept: [], hint: `$${F} + (${fmt(change)})$.` },
    ],
    finalAnswer: { value: fmt(est), unit: ctx.unit },
    solutionNarrative: `$L(t) = ${F} + ${m}(t - ${a})$, so the estimate is $${F} + ${m}(${fmt(d)}) = ${fmt(est)}$ ${ctx.unit} — value plus rate times step.`,
  };
};

// d2: estimate sqrt(s^2 + d) via the linearization at the perfect square.
fill["c1b-approx-value-2"] = (rng, idx) => {
  const [s, d] = rng.pick([[2, 0.1], [2, 0.2], [2, 0.4], [3, 0.3], [3, 0.6], [4, 0.2], [4, 0.4], [4, 0.8], [5, 0.1], [5, 0.5]]);
  const a = s * s, N = fmt(a + d), est = fmt(s + d / (2 * s));
  return {
    id: `gen.c1b-approx-value-2.${idx}`, generated: true, concepts: ["approximate-values"], difficulty: 2, context: "abstract",
    prompt: `Estimate $\\sqrt{${N}}$ by linearizing $f(x) = \\sqrt{x}$ at a nearby nice point.`,
    steps: [
      { instruction: `Pick the nice base point: the perfect square nearest $${N}$. What is $a$?`, answer: `${a}`, accept: [`a = ${a}`, `a=${a}`], hint: `$${a} = ${s}^2$ is right next door.` },
      { instruction: `Evaluate the slope $f'(${a})$, where $f'(x) = \\frac{1}{2\\sqrt{x}}$. Give a fraction.`, answer: `1/${2 * s}`, accept: [], hint: `$\\frac{1}{2 \\cdot ${s}}$.` },
      { instruction: `Use $L(x) = ${s} + \\frac{x - ${a}}{${2 * s}}$ to estimate $\\sqrt{${N}}$. Give the exact decimal.`, answer: est, accept: [], hint: `$${s} + \\frac{${fmt(d)}}{${2 * s}}$.` },
    ],
    finalAnswer: { value: est, unit: "" },
    solutionNarrative: `Base $a = ${a}$: height ${s}, slope $\\frac{1}{${2 * s}}$, so $\\sqrt{${N}} \\approx ${s} + \\frac{${fmt(d)}}{${2 * s}} = ${est}$.`,
  };
};

// d3: estimate 1/(a + d) via the linearization of 1/x at a.
fill["c1b-approx-value-3"] = (rng, idx) => {
  const [a, d] = rng.pick([[2, 0.1], [2, 0.2], [2, 0.4], [4, 0.2], [4, 0.4], [5, 0.25], [5, 0.5]]);
  const N = fmt(a + d), dy = -d / (a * a), est = fmt(1 / a + dy);
  return {
    id: `gen.c1b-approx-value-3.${idx}`, generated: true, concepts: ["approximate-values"], difficulty: 3, context: "abstract",
    prompt: `Estimate $\\frac{1}{${N}}$ by linearizing $f(x) = \\frac{1}{x}$ at $a = ${a}$. (Recall $f'(x) = -\\frac{1}{x^2}$.)`,
    steps: [
      { instruction: `Compute the height $f(${a})$. Give a decimal or fraction.`, answer: fmt(1 / a), accept: [`1/${a}`], hint: `$\\frac{1}{${a}}$.` },
      { instruction: `Evaluate the slope $f'(${a})$. Give a fraction — mind the sign.`, answer: `-1/${a * a}`, accept: [], hint: `$-\\frac{1}{${a}^2}$.` },
      { instruction: `The step is $x - a = ${fmt(d)}$. Compute the predicted change $f'(${a}) \\times ${fmt(d)}$.`, answer: fmt(dy), accept: [`-${fmt(d)}/${a * a}`], hint: `$-\\frac{${fmt(d)}}{${a * a}}$.` },
      { instruction: `Add the change to the height: estimate $\\frac{1}{${N}}$. Give the exact decimal.`, answer: est, accept: [], hint: `$${fmt(1 / a)} + (${fmt(dy)})$.` },
    ],
    finalAnswer: { value: est, unit: "" },
    solutionNarrative: `Height $\\frac{1}{${a}}$, slope $-\\frac{1}{${a * a}}$: $\\frac{1}{${N}} \\approx ${fmt(1 / a)} - ${fmt(d / (a * a))} = ${est}$. The negative slope reflects that reciprocals shrink as $x$ grows.`,
  };
};

// --- differentials ---------------------------------------------------------------

// d1: y = x^2, dy = 2x dx at a point.
fill["c1b-differentials-1"] = (rng, idx) => {
  const x0 = rng.int(3, 8);
  const dx = rng.pick([0.1, 0.2, 0.5]);
  const dy = fmt(2 * x0 * dx);
  return {
    id: `gen.c1b-differentials-1.${idx}`, generated: true, concepts: ["differentials"], difficulty: 1, context: "abstract",
    prompt: `For $y = x^2$, use the differential $dy = f'(x)\\,dx$ to estimate the change in $y$ when $x$ moves from $${x0}$ to $${fmt(x0 + dx)}$.`,
    steps: [
      { instruction: `Evaluate the derivative $f'(${x0})$, where $f'(x) = 2x$.`, answer: `${2 * x0}`, accept: [], hint: `$2 \\cdot ${x0}$.` },
      { instruction: `The step is $dx = ${fmt(dx)}$. Compute $dy = f'(${x0})\\,dx$.`, answer: dy, accept: [], hint: `$${2 * x0} \\times ${fmt(dx)}$.` },
    ],
    finalAnswer: { value: dy, unit: "" },
    solutionNarrative: `$dy = 2x\\,dx = ${2 * x0} \\times ${fmt(dx)} = ${dy}$ — the tangent line's prediction of the change (the true change $\\Delta y$ is only slightly larger, by the curvature term $dx^2 = ${fmt(dx * dx)}$).`,
  };
};

// d2: cube volume error propagation, dV = 3s^2 ds.
fill["c1b-differentials-2"] = (rng, idx) => {
  const s = rng.int(4, 9);
  const ds = rng.pick([0.05, 0.1, 0.2]);
  const dV = fmt(3 * s * s * ds);
  const ctx = rng.pick([
    { thing: "shipping crate", who: "A packing engineer measures" },
    { thing: "concrete block", who: "A builder measures" },
    { thing: "ice cube mold", who: "A lab tech measures" },
  ]);
  return {
    id: `gen.c1b-differentials-2.${idx}`, generated: true, concepts: ["differentials"], difficulty: 2, context: "applied",
    prompt: `${ctx.who} a cubical ${ctx.thing}'s side as $s = ${s}$ cm, with a possible measurement error of $ds = ${fmt(ds)}$ cm. Use differentials to estimate the resulting error in the volume $V = s^3$.`,
    steps: [
      { instruction: `Differentiate the volume formula and evaluate $V'(${s})$, where $V'(s) = 3s^2$.`, answer: `${3 * s * s}`, accept: [], hint: `$3 \\cdot ${s}^2 = 3 \\cdot ${s * s}$.` },
      { instruction: `Propagate the error: $dV = V'(${s})\\,ds$. Give the volume error in cm³.`, answer: dV, accept: [], hint: `$${3 * s * s} \\times ${fmt(ds)}$.` },
    ],
    finalAnswer: { value: dV, unit: "cm^3" },
    solutionNarrative: `$dV = 3s^2\\,ds = ${3 * s * s} \\times ${fmt(ds)} = ${dV}$ cm³. The derivative $${3 * s * s}$ is the amplification factor converting side error into volume error.`,
  };
};

// d3: circle area error propagation, dA = 2*pi*r dr — answer in terms of pi.
fill["c1b-differentials-3"] = (rng, idx) => {
  const r = rng.int(3, 8);
  const dr = rng.pick([0.01, 0.02, 0.05]);
  const coef = fmt(2 * r * dr);
  const ans = `${coef}pi`;
  const dec3 = (2 * r * dr * Math.PI).toFixed(3);
  const dec2 = (2 * r * dr * Math.PI).toFixed(2);
  return {
    id: `gen.c1b-differentials-3.${idx}`, generated: true, concepts: ["differentials"], difficulty: 3, context: "applied",
    prompt: `A circular metal plate is cut to radius $r = ${r}$ cm, accurate to $dr = ${fmt(dr)}$ cm. Use differentials to estimate the resulting uncertainty in its area $A = \\pi r^2$.`,
    steps: [
      { instruction: `Differentiate: $A'(r) = 2\\pi r$. Compute the numeric part $2 \\cdot r \\cdot dr$ at $r = ${r}$, $dr = ${fmt(dr)}$.`, answer: coef, accept: [], hint: `$2 \\times ${r} \\times ${fmt(dr)}$.` },
      { instruction: `So $dA = ${coef}\\pi$ cm². Give the area error in terms of $\\pi$ (like ${ans}) or as a decimal (3 decimal places).`, answer: ans, accept: [dec3, dec2, `${coef}*pi`, `${coef}π`], hint: `$${coef}\\pi \\approx ${dec3}$.` },
    ],
    finalAnswer: { value: `${coef}π ≈ ${dec3}`, unit: "cm^2" },
    solutionNarrative: `$dA = 2\\pi r\\,dr = 2\\pi(${r})(${fmt(dr)}) = ${coef}\\pi \\approx ${dec3}$ cm². The circumference $2\\pi r$ is the amplification factor — radius error is smeared around the whole rim.`,
  };
};

// --- approximation-error-and-concavity -------------------------------------------

// d1: upward parabola cx^2 — concave up, tangent estimates read low.
fill["c1b-error-concavity-1"] = (rng, idx) => {
  const c = rng.int(1, 4);
  const cS = c === 1 ? "" : `${c}`;
  const a = rng.int(2, 5);
  return {
    id: `gen.c1b-error-concavity-1.${idx}`, generated: true, concepts: ["approximation-error-and-concavity"], difficulty: 1, context: "abstract",
    prompt: `Tangent-line estimates of $f(x) = ${cS}x^2$ are made near $x = ${a}$. Use concavity to predict whether they run high or low.`,
    steps: [
      { instruction: `Compute the second derivative $f''(x)$ of $f(x) = ${cS}x^2$.`, answer: `${2 * c}`, accept: [], hint: `Differentiate $${2 * c}x$ once more.` },
      { instruction: `Is $f'' = ${2 * c}$ positive or negative? Answer 'positive' or 'negative'.`, answer: "positive", accept: ["pos", "+"], hint: `$${2 * c} > 0$.` },
      { instruction: "Positive $f''$ means the curve bends above its tangent lines. Are tangent-line estimates an 'overestimate' or 'underestimate'?", answer: "underestimate", accept: ["under", "under-estimate", "underestimates", "too small"], hint: "Curve above line means the line's value is too small." },
    ],
    finalAnswer: { value: "underestimate", unit: "" },
    solutionNarrative: `$f'' = ${2 * c} > 0$: concave up, so the parabola sits above every tangent line and linearization estimates are underestimates.`,
  };
};

// d2: sqrt(x) — concave down, tangent estimates read high.
fill["c1b-error-concavity-2"] = (rng, idx) => {
  const s = rng.pick([2, 3, 4, 5]);
  const a = s * s;
  return {
    id: `gen.c1b-error-concavity-2.${idx}`, generated: true, concepts: ["approximation-error-and-concavity"], difficulty: 2, context: "abstract",
    prompt: `Square roots near $${a}$ are being estimated with the linearization of $f(x) = \\sqrt{x}$ at $a = ${a}$. Given $f''(x) = -\\frac{1}{4x^{3/2}}$, decide whether those estimates run high or low.`,
    steps: [
      { instruction: `Is $f''(${a}) = -\\frac{1}{4 \\cdot ${a * s}}$ positive or negative? Answer 'positive' or 'negative'.`, answer: "negative", accept: ["neg", "-"], hint: "The formula has a minus sign out front and a positive denominator." },
      { instruction: "Negative $f''$ means the curve is 'concave up' or 'concave down'?", answer: "concave down", accept: ["down"], hint: "$f'' < 0$ arches over." },
      { instruction: "A concave-down curve sags below its tangent line. Are the estimates an 'overestimate' or 'underestimate'?", answer: "overestimate", accept: ["over", "over-estimate", "overestimates", "too big"], hint: "Curve below line: the line reads high." },
    ],
    finalAnswer: { value: "overestimate", unit: "" },
    solutionNarrative: `$f''(${a}) < 0$: $\\sqrt{x}$ is concave down, so it falls below every tangent line — linearization estimates of square roots near ${a} are overestimates.`,
  };
};

// d3: x^3 — the direction depends on which side of 0 the base point sits.
fill["c1b-error-concavity-3"] = (rng, idx) => {
  const a = rng.pick([-3, -2, -1, 1, 2, 3]); // never 0: f'' must have a definite sign
  const up = a > 0;
  const conc = up ? "concave up" : "concave down";
  const verdict = up ? "underestimate" : "overestimate";
  return {
    id: `gen.c1b-error-concavity-3.${idx}`, generated: true, concepts: ["approximation-error-and-concavity"], difficulty: 3, context: "abstract",
    prompt: `The function $f(x) = x^3$ is linearized at $a = ${a}$ to estimate nearby values. Use concavity to predict the direction of the error near $a$.`,
    steps: [
      { instruction: "Compute the second derivative $f''(x)$ of $f(x) = x^3$.", answer: "6x", accept: [], hint: "Differentiate $3x^2$ once more." },
      { instruction: `Evaluate $f''(${a})$.`, answer: `${6 * a}`, accept: [], hint: `$6 \\cdot (${a})$.` },
      { instruction: `Since $f''(${a}) ${up ? ">" : "<"} 0$, is the curve 'concave up' or 'concave down' near $a = ${a}$?`, answer: conc, accept: [up ? "up" : "down"], hint: up ? "Positive second derivative cups upward." : "Negative second derivative arches over." },
      { instruction: `So near $a = ${a}$ the curve bends ${up ? "above" : "below"} its tangent. Are the estimates an 'overestimate' or 'underestimate'?`, answer: verdict, accept: up ? ["under", "under-estimate", "underestimates", "too small"] : ["over", "over-estimate", "overestimates", "too big"], hint: up ? "Curve above line: the line reads low." : "Curve below line: the line reads high." },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$f''(x) = 6x$, so $f''(${a}) = ${6 * a} ${up ? "> 0" : "< 0"}$: ${conc} near $a = ${a}$, and the tangent-line estimates there are ${verdict}s. The cubic's inflection at 0 means the answer flips with the sign of the base point.`,
  };
};
