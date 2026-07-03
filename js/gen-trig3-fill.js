// gen-trig3-fill.js
// Self-contained parametric generator pack for the Trigonometry subject's
// inverse-trig-functions and polar-coordinates topics. Exports a `fill` map of
// template-name -> generator fn, matching the shape of js/generator.js's
// registry (same pattern as js/gen-trig2-fill.js — no imports from
// generator.js).
//
// Conventions (must match the topic JSON + grader):
// - Angles in DEGREES unless a step explicitly asks for exact radians; exact
//   single-value radian answers ("pi/6") grade numerically via evalNumeric.
// - Exact coordinate conversions split x and y into SEPARATE numeric steps so
//   sqrt answers grade via evalNumeric; rounded answers state the rounding in
//   the instruction and are computed with the same rounding the learner uses.
// - Word answers (yes/no, quadrant numerals, curve names) are exact-string
//   with generous accept[] lists.
// - Degenerate guards: rect->polar points never sit at the origin, applied
//   compliance angles are pre-filtered to stay well clear of the threshold,
//   and tangent ratios never divide by zero (legs of Pythagorean triples).

const D = (x) => (x * Math.PI) / 180;
const sinD = (x) => Math.sin(D(x));
const cosD = (x) => Math.cos(D(x));
const atanDeg = (v) => (Math.atan(v) * 180) / Math.PI;
const r1 = (x) => (Math.round(x * 10) / 10).toFixed(1);   // "22.6" style, 1 dp
const r2 = (x) => (Math.round(x * 100) / 100).toFixed(2); // "-4.70" style, 2 dp
const r4 = (x) => (Math.round(x * 1e4) / 1e4).toFixed(4); // "0.9397" style, 4 dp
const rd = (x) => Math.round(x);                          // nearest degree

// Quadrant accept lists for Roman-numeral answers.
const QACC = {
  I: ["1", "one", "quadrant 1", "quadrant i", "q1"],
  II: ["2", "two", "quadrant 2", "quadrant ii", "q2"],
  III: ["3", "three", "quadrant 3", "quadrant iii", "q3"],
  IV: ["4", "four", "quadrant 4", "quadrant iv", "q4"],
};

// Pythagorean triples [leg, leg, hypotenuse] — all sides integers, so every
// missing-side and ratio answer is exact.
const TRIPLES = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17],
  [7, 24, 25], [9, 12, 15], [20, 21, 29], [9, 40, 41],
];

// Exact multiple-of-a-radical string: sq(1,3) -> "sqrt(3)", sq(3,2) -> "3sqrt(2)".
const sq = (k, s) => (k === 1 ? `sqrt(${s})` : `${k}sqrt(${s})`);
// Signed variant used for quadrant-aware coordinates: s === 1 means plain integer.
const sval = (sign, k, s) => (s === 1 ? `${sign * k}` : `${sign < 0 ? "-" : ""}${sq(k, s)}`);

export const fill = {};

// ============================================================================
// inverse-trig-functions.json
// ============================================================================

// --- inverse-trig-values ---

const IV1 = [
  { f: "\\arcsin", base: "\\sin", name: "sine", vl: "\\frac{1}{2}", vp: "1/2", ans: 30, range: "[-90^\\circ, 90^\\circ]" },
  { f: "\\arcsin", base: "\\sin", name: "sine", vl: "\\frac{\\sqrt{3}}{2}", vp: "sqrt(3)/2", ans: 60, range: "[-90^\\circ, 90^\\circ]" },
  { f: "\\arcsin", base: "\\sin", name: "sine", vl: "\\frac{\\sqrt{2}}{2}", vp: "sqrt(2)/2", ans: 45, range: "[-90^\\circ, 90^\\circ]" },
  { f: "\\arcsin", base: "\\sin", name: "sine", vl: "1", vp: "1", ans: 90, range: "[-90^\\circ, 90^\\circ]" },
  { f: "\\arccos", base: "\\cos", name: "cosine", vl: "\\frac{1}{2}", vp: "1/2", ans: 60, range: "[0^\\circ, 180^\\circ]" },
  { f: "\\arccos", base: "\\cos", name: "cosine", vl: "\\frac{\\sqrt{3}}{2}", vp: "sqrt(3)/2", ans: 30, range: "[0^\\circ, 180^\\circ]" },
  { f: "\\arccos", base: "\\cos", name: "cosine", vl: "\\frac{\\sqrt{2}}{2}", vp: "sqrt(2)/2", ans: 45, range: "[0^\\circ, 180^\\circ]" },
  { f: "\\arccos", base: "\\cos", name: "cosine", vl: "0", vp: "0", ans: 90, range: "[0^\\circ, 180^\\circ]" },
  { f: "\\arctan", base: "\\tan", name: "tangent", vl: "1", vp: "1", ans: 45, range: "(-90^\\circ, 90^\\circ)" },
  { f: "\\arctan", base: "\\tan", name: "tangent", vl: "\\sqrt{3}", vp: "sqrt(3)", ans: 60, range: "(-90^\\circ, 90^\\circ)" },
  { f: "\\arctan", base: "\\tan", name: "tangent", vl: "\\frac{\\sqrt{3}}{3}", vp: "sqrt(3)/3", ans: 30, range: "(-90^\\circ, 90^\\circ)" },
];

fill["trg3-inverse-values-1"] = (rng, idx) => {
  const t = rng.pick(IV1);
  return {
    id: `gen.trg3-inverse-values-1.${idx}`, generated: true, concepts: ["inverse-trig-values"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $${t.f}\\left(${t.vl}\\right)$ in degrees.`,
    steps: [
      { instruction: `$${t.f}$ asks: which angle in $${t.range}$ has ${t.name} equal to $${t.vl}$? Answer in degrees.`, answer: `${t.ans}`, accept: [`${t.ans} degrees`], hint: `Read the special-value table backwards: $${t.base} ${t.ans}^\\circ = ${t.vl}$.` },
      { instruction: `Check your answer: what is $${t.base} ${t.ans}^\\circ$? (Exact.)`, answer: t.vp, accept: [], hint: `It must reproduce the input $${t.vl}$ — that is what makes $${t.ans}^\\circ$ the inverse's output.` },
    ],
    finalAnswer: { value: `${t.ans}`, unit: "degrees" },
    solutionNarrative: `$${t.base} ${t.ans}^\\circ = ${t.vl}$ and $${t.ans}^\\circ$ lies in $${t.f}$'s range $${t.range}$, so $${t.f}(${t.vl}) = ${t.ans}^\\circ$.`,
  };
};

const IV2 = [
  { f: "\\arcsin", vl: "-\\frac{1}{2}", ref: 30, ans: -30, rule: "$\\arcsin$ returns angles in $[-90^\\circ, 90^\\circ]$, so a negative input gives the NEGATIVE of the reference angle (not a QIII or QIV angle like $330^\\circ$)." },
  { f: "\\arcsin", vl: "-\\frac{\\sqrt{2}}{2}", ref: 45, ans: -45, rule: "$\\arcsin$ returns angles in $[-90^\\circ, 90^\\circ]$, so a negative input gives the NEGATIVE of the reference angle." },
  { f: "\\arcsin", vl: "-\\frac{\\sqrt{3}}{2}", ref: 60, ans: -60, rule: "$\\arcsin$ returns angles in $[-90^\\circ, 90^\\circ]$, so a negative input gives the NEGATIVE of the reference angle." },
  { f: "\\arctan", vl: "-1", ref: 45, ans: -45, rule: "$\\arctan$ returns angles in $(-90^\\circ, 90^\\circ)$, so a negative input gives the NEGATIVE of the reference angle." },
  { f: "\\arctan", vl: "-\\sqrt{3}", ref: 60, ans: -60, rule: "$\\arctan$ returns angles in $(-90^\\circ, 90^\\circ)$, so a negative input gives the NEGATIVE of the reference angle." },
  { f: "\\arccos", vl: "-\\frac{1}{2}", ref: 60, ans: 120, rule: "$\\arccos$ returns angles in $[0^\\circ, 180^\\circ]$ and is NEVER negative: a negative input lands in QII, at $180^\\circ$ minus the reference angle." },
  { f: "\\arccos", vl: "-\\frac{\\sqrt{2}}{2}", ref: 45, ans: 135, rule: "$\\arccos$ returns angles in $[0^\\circ, 180^\\circ]$: a negative input lands in QII, at $180^\\circ$ minus the reference angle." },
  { f: "\\arccos", vl: "-\\frac{\\sqrt{3}}{2}", ref: 30, ans: 150, rule: "$\\arccos$ returns angles in $[0^\\circ, 180^\\circ]$: a negative input lands in QII, at $180^\\circ$ minus the reference angle." },
];

fill["trg3-inverse-values-2"] = (rng, idx) => {
  const t = rng.pick(IV2);
  return {
    id: `gen.trg3-inverse-values-2.${idx}`, generated: true, concepts: ["inverse-trig-values"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${t.f}\\left(${t.vl}\\right)$ in degrees. Watch the range: the sign of the input decides where the answer can live.`,
    steps: [
      { instruction: "What is the reference angle — ignore the minus sign? (Degrees.)", answer: `${t.ref}`, accept: [`${t.ref} degrees`], hint: `The special-value table gives $${t.ref}^\\circ$ for this magnitude.` },
      { instruction: `${t.rule} Give the value in degrees.`, answer: `${t.ans}`, accept: [`${t.ans} degrees`], hint: t.ans < 0 ? `Negate the reference angle: $-${t.ref}^\\circ$.` : `$180^\\circ - ${t.ref}^\\circ$.` },
    ],
    finalAnswer: { value: `${t.ans}`, unit: "degrees" },
    solutionNarrative: `Reference angle $${t.ref}^\\circ$. ${t.ans < 0 ? `Since the input is negative and the range is symmetric about $0^\\circ$, the answer is $-${t.ref}^\\circ$.` : `Since $\\arccos$ of a negative lands in QII, the answer is $180 - ${t.ref} = ${t.ans}^\\circ$.`}`,
  };
};

const IV3 = [
  { f: "\\arcsin", vl: "\\frac{1}{2}", deg: 30, rad: "pi/6", radl: "\\frac{\\pi}{6}" },
  { f: "\\arcsin", vl: "-1", deg: -90, rad: "-pi/2", radl: "-\\frac{\\pi}{2}" },
  { f: "\\arcsin", vl: "-\\frac{\\sqrt{3}}{2}", deg: -60, rad: "-pi/3", radl: "-\\frac{\\pi}{3}" },
  { f: "\\arccos", vl: "-\\frac{1}{2}", deg: 120, rad: "2pi/3", radl: "\\frac{2\\pi}{3}" },
  { f: "\\arccos", vl: "-\\frac{\\sqrt{2}}{2}", deg: 135, rad: "3pi/4", radl: "\\frac{3\\pi}{4}" },
  { f: "\\arccos", vl: "0", deg: 90, rad: "pi/2", radl: "\\frac{\\pi}{2}" },
  { f: "\\arctan", vl: "-1", deg: -45, rad: "-pi/4", radl: "-\\frac{\\pi}{4}" },
  { f: "\\arctan", vl: "\\sqrt{3}", deg: 60, rad: "pi/3", radl: "\\frac{\\pi}{3}" },
];

fill["trg3-inverse-values-3"] = (rng, idx) => {
  const t = rng.pick(IV3);
  return {
    id: `gen.trg3-inverse-values-3.${idx}`, generated: true, concepts: ["inverse-trig-values"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $${t.f}\\left(${t.vl}\\right)$. Give the EXACT answer in radians (type it like pi/6).`,
    steps: [
      { instruction: "First find the value in degrees (respect the function's range).", answer: `${t.deg}`, accept: [`${t.deg} degrees`], hint: t.deg < 0 ? "The input is negative and this function's range is symmetric about 0, so the answer is the negated reference angle." : "Place the reference angle inside the function's range.", },
      { instruction: "Convert to radians (exact, in terms of $\\pi$).", answer: t.rad, accept: [], hint: `Multiply by $\\frac{\\pi}{180}$: $${t.deg} \\cdot \\frac{\\pi}{180} = ${t.radl}$.` },
    ],
    finalAnswer: { value: t.rad, unit: "radians" },
    solutionNarrative: `$${t.f}(${t.vl}) = ${t.deg}^\\circ = ${t.radl}$ radians.`,
  };
};

// --- domain-range-restrictions ---

const DOM_VALID = ["0.4", "0.75", "-0.6", "1", "-1", "0.25"];
const DOM_INVALID = ["1.2", "1.5", "2", "-1.4", "-2", "3.5"];

fill["trg3-inverse-domain-1"] = (rng, idx) => {
  const fn = rng.pick([{ f: "\\arcsin", base: "\\sin", name: "sine" }, { f: "\\arccos", base: "\\cos", name: "cosine" }]);
  const defined = rng.int(0, 1) === 1;
  const v = defined ? rng.pick(DOM_VALID) : rng.pick(DOM_INVALID);
  const yn = defined ? "yes" : "no";
  return {
    id: `gen.trg3-inverse-domain-1.${idx}`, generated: true, concepts: ["domain-range-restrictions"], difficulty: 1, context: "abstract",
    prompt: `Decide whether $${fn.f}(${v})$ is defined.`,
    steps: [
      { instruction: `What is the LARGEST value $${fn.base}\\theta$ can ever equal?`, answer: "1", accept: [], hint: `On the unit circle, ${fn.name} is a coordinate of a point on a radius-1 circle — it cannot exceed the radius.` },
      { instruction: `And the SMALLEST value $${fn.base}\\theta$ can ever equal?`, answer: "-1", accept: [], hint: "The coordinate can be at most 1 to the other side: $-1$." },
      { instruction: `So $${fn.f}$ only accepts inputs in $[-1, 1]$. Is $${fn.f}(${v})$ defined? (yes/no)`, answer: yn, accept: [yn === "yes" ? "y" : "n"], hint: `Is $${v}$ between $-1$ and $1$ inclusive?` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: `${fn.name[0].toUpperCase()}${fn.name.slice(1)} only outputs values in $[-1, 1]$, so $${fn.f}$ only accepts inputs there. Since $${v}$ ${defined ? "lies inside" : "falls outside"} $[-1, 1]$, $${fn.f}(${v})$ is ${defined ? "defined" : "undefined"}.`,
  };
};

const RANGES = [
  { f: "\\arcsin", lo: -90, hi: 90, out: [120, 150, -120, 210], word: "$[-90^\\circ, 90^\\circ]$" },
  { f: "\\arccos", lo: 0, hi: 180, out: [-30, -60, 200, 270], word: "$[0^\\circ, 180^\\circ]$" },
  { f: "\\arctan", lo: -90, hi: 90, out: [135, 180, -120, 90], word: "$(-90^\\circ, 90^\\circ)$ (endpoints excluded)" },
];

fill["trg3-inverse-domain-2"] = (rng, idx) => {
  const t = rng.pick(RANGES);
  const x = rng.pick(t.out);
  return {
    id: `gen.trg3-inverse-domain-2.${idx}`, generated: true, concepts: ["domain-range-restrictions"], difficulty: 2, context: "abstract",
    prompt: `The function $${t.f}$ only ever returns angles from one fixed window — its range. Identify that window, then use it.`,
    steps: [
      { instruction: `What is the smallest angle (in degrees) $${t.f}$ can return${t.f === "\\arctan" ? " — the lower bound its outputs approach" : ""}?`, answer: `${t.lo}`, accept: [`${t.lo} degrees`], hint: `The range of $${t.f}$ is ${t.word}.` },
      { instruction: `What is the largest (or upper-bound) angle in degrees?`, answer: `${t.hi}`, accept: [`${t.hi} degrees`], hint: `The range of $${t.f}$ is ${t.word}.` },
      { instruction: `Could $${t.f}$ ever return $${x}^\\circ$? (yes/no)`, answer: "no", accept: ["n"], hint: `Is $${x}^\\circ$ inside ${t.word}?` },
    ],
    finalAnswer: { value: `${t.lo} to ${t.hi}`, unit: "degrees" },
    solutionNarrative: `$${t.f}$ returns only angles in ${t.word}; $${x}^\\circ$ is outside that window, so it can never be an output.`,
  };
};

const DOM3 = [
  { kind: "sin", A: 150, inner: "1/2", innerL: "\\frac{1}{2}", out: 30 },
  { kind: "sin", A: 135, inner: "sqrt(2)/2", innerL: "\\frac{\\sqrt{2}}{2}", out: 45 },
  { kind: "sin", A: 120, inner: "sqrt(3)/2", innerL: "\\frac{\\sqrt{3}}{2}", out: 60 },
  { kind: "cos", A: -60, inner: "1/2", innerL: "\\frac{1}{2}", out: 60 },
  { kind: "cos", A: -45, inner: "sqrt(2)/2", innerL: "\\frac{\\sqrt{2}}{2}", out: 45 },
  { kind: "cos", A: -30, inner: "sqrt(3)/2", innerL: "\\frac{\\sqrt{3}}{2}", out: 30 },
];

fill["trg3-inverse-domain-3"] = (rng, idx) => {
  const t = rng.pick(DOM3);
  const F = t.kind === "sin" ? "\\arcsin" : "\\arccos";
  const B = t.kind === "sin" ? "\\sin" : "\\cos";
  const rangeWord = t.kind === "sin" ? "$[-90^\\circ, 90^\\circ]$" : "$[0^\\circ, 180^\\circ]$";
  const innerExpr = `${B}(${t.A}^\\circ)`; // parenthesized so negative angles typeset cleanly
  return {
    id: `gen.trg3-inverse-domain-3.${idx}`, generated: true, concepts: ["domain-range-restrictions"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $${F}\\left(${innerExpr}\\right)$ — careful: the answer is NOT $${t.A}^\\circ$.`,
    steps: [
      { instruction: `Work inside-out: what is $${innerExpr}$? (Exact.)`, answer: t.inner, accept: [], hint: t.kind === "sin" ? `$${t.A}^\\circ$ is in QII where sine is positive; its reference angle is $${180 - t.A}^\\circ$.` : `Cosine is even: $\\cos(${t.A}^\\circ) = \\cos(${-t.A}^\\circ)$.` },
      { instruction: `Now $${F}\\left(${t.innerL}\\right)$ must land in ${rangeWord}. What is it, in degrees?`, answer: `${t.out}`, accept: [`${t.out} degrees`], hint: `Which angle INSIDE the range has ${t.kind === "sin" ? "sine" : "cosine"} $${t.innerL}$?` },
      { instruction: `Is $${F}(${innerExpr})$ equal to $${t.A}^\\circ$? (yes/no)`, answer: "no", accept: ["n"], hint: `$${t.A}^\\circ$ is outside ${rangeWord}, so the composition cannot return it.` },
    ],
    finalAnswer: { value: `${t.out}`, unit: "degrees" },
    solutionNarrative: `$${innerExpr} = ${t.innerL}$, and $${F}$ must answer from ${rangeWord}, so $${F}(${innerExpr}) = ${t.out}^\\circ \\neq ${t.A}^\\circ$. Inverse-then-function only round-trips when the original angle is already in the range.`,
  };
};

// --- compositions ---

fill["trg3-inverse-comp-1"] = (rng, idx) => {
  const [l1, l2, c] = rng.pick(TRIPLES);
  const swap = rng.int(0, 1) === 1;
  const known = swap ? l2 : l1;   // side used in the inner ratio
  const other = swap ? l1 : l2;   // side the learner must find
  const mode = rng.pick([
    { outer: "\\sin", inner: "\\arccos", knownSide: "adjacent", findSide: "opposite" },
    { outer: "\\cos", inner: "\\arcsin", knownSide: "opposite", findSide: "adjacent" },
  ]);
  return {
    id: `gen.trg3-inverse-comp-1.${idx}`, generated: true, concepts: ["compositions"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $${mode.outer}\\left(${mode.inner}\\frac{${known}}{${c}}\\right)$ exactly — no calculator needed.`,
    steps: [
      { instruction: `Let $\\theta = ${mode.inner}\\frac{${known}}{${c}}$: an angle with ${mode.knownSide} side ${known} and hypotenuse ${c}. Use the Pythagorean theorem to find the ${mode.findSide} side.`, answer: `${other}`, accept: [], hint: `$\\sqrt{${c}^2 - ${known}^2} = \\sqrt{${c * c - known * known}}$.` },
      { instruction: `Now read off $${mode.outer}\\theta = \\frac{\\text{${mode.outer === "\\sin" ? "opposite" : "adjacent"}}}{\\text{hypotenuse}}$. What is the value?`, answer: `${other}/${c}`, accept: [], hint: `$\\frac{${other}}{${c}}$ — the triangle turns the composition into one ratio.` },
    ],
    finalAnswer: { value: `${other}/${c}`, unit: "" },
    solutionNarrative: `Draw the right triangle for $\\theta$: ${mode.knownSide} ${known}, hypotenuse ${c}, so the ${mode.findSide} side is $\\sqrt{${c * c} - ${known * known}} = ${other}$. Then $${mode.outer}\\theta = \\frac{${other}}{${c}}$.`,
  };
};

fill["trg3-inverse-comp-2"] = (rng, idx) => {
  const [p, q, c] = rng.pick(TRIPLES);
  const mode = rng.pick([
    { expr: (a, b, h) => `\\tan\\left(\\arcsin\\frac{${a}}{${h}}\\right)`, known: "opposite", knownV: p, find: "adjacent", findV: q, hyp: true, ans: `${p}/${q}` },
    { expr: (a, b, h) => `\\tan\\left(\\arccos\\frac{${b}}{${h}}\\right)`, known: "adjacent", knownV: q, find: "opposite", findV: p, hyp: true, ans: `${p}/${q}` },
    { expr: (a, b, h) => `\\cos\\left(\\arctan\\frac{${a}}{${b}}\\right)`, known: "opposite and adjacent", knownV: null, find: "hypotenuse", findV: c, hyp: false, ans: `${q}/${c}` },
    { expr: (a, b, h) => `\\sin\\left(\\arctan\\frac{${a}}{${b}}\\right)`, known: "opposite and adjacent", knownV: null, find: "hypotenuse", findV: c, hyp: false, ans: `${p}/${c}` },
  ]);
  const exprL = mode.expr(p, q, c);
  const findHint = mode.hyp
    ? `$\\sqrt{${c}^2 - ${mode.knownV}^2} = \\sqrt{${c * c - mode.knownV * mode.knownV}}$.`
    : `$\\sqrt{${p}^2 + ${q}^2} = \\sqrt{${p * p + q * q}}$.`;
  return {
    id: `gen.trg3-inverse-comp-2.${idx}`, generated: true, concepts: ["compositions"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${exprL}$ exactly.`,
    steps: [
      { instruction: `Let $\\theta$ be the inner angle. Its triangle has known ${mode.known} side(s)${mode.hyp ? ` and hypotenuse ${c}` : ""}. Find the ${mode.find} side (Pythagorean theorem).`, answer: `${mode.findV}`, accept: [], hint: findHint },
      { instruction: `Read the outer function off the completed triangle. What is $${exprL}$?`, answer: mode.ans, accept: [], hint: `All three sides are now known: opposite ${p}, adjacent ${q}, hypotenuse ${c}.` },
    ],
    finalAnswer: { value: mode.ans, unit: "" },
    solutionNarrative: `The inner inverse pins down a right triangle with sides ${p}, ${q}, ${c}; the ${mode.find} side comes from the Pythagorean theorem. Reading the outer ratio gives $${exprL} = ${mode.ans.replace("/", "/")}$.`,
  };
};

fill["trg3-inverse-comp-3"] = (rng, idx) => {
  const [p, q, c] = rng.pick(TRIPLES);
  const mode = rng.pick([
    { exprL: `\\cos\\left(\\arcsin\\left(-\\frac{${p}}{${c}}\\right)\\right)`, quad: "between $-90^\\circ$ and $0^\\circ$ (QIV)", outer: "cosine", sign: "positive", findV: q, findHint: `$\\sqrt{${c * c} - ${p * p}}$`, ans: `${q}/${c}` },
    { exprL: `\\tan\\left(\\arcsin\\left(-\\frac{${p}}{${c}}\\right)\\right)`, quad: "between $-90^\\circ$ and $0^\\circ$ (QIV)", outer: "tangent", sign: "negative", findV: q, findHint: `$\\sqrt{${c * c} - ${p * p}}$`, ans: `-${p}/${q}` },
    { exprL: `\\sin\\left(\\arccos\\left(-\\frac{${q}}{${c}}\\right)\\right)`, quad: "between $90^\\circ$ and $180^\\circ$ (QII)", outer: "sine", sign: "positive", findV: p, findHint: `$\\sqrt{${c * c} - ${q * q}}$`, ans: `${p}/${c}` },
  ]);
  return {
    id: `gen.trg3-inverse-comp-3.${idx}`, generated: true, concepts: ["compositions"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $${mode.exprL}$ exactly. Mind the sign.`,
    steps: [
      { instruction: `Because the input is negative, the inner angle lies ${mode.quad}. Is ${mode.outer} positive or negative there? (Type positive or negative.)`, answer: mode.sign, accept: [mode.sign === "positive" ? "+" : "-", mode.sign.slice(0, 3)], hint: `Use the quadrant signs: in QIV cosine is positive and sine/tangent negative; in QII sine is positive and cosine/tangent negative.` },
      { instruction: `Find the missing side of the reference right triangle (sides from the triple ${p}-${q}-${c}).`, answer: `${mode.findV}`, accept: [], hint: `${mode.findHint} = ${mode.findV}.` },
      { instruction: `Combine the magnitude and the sign. What is $${mode.exprL}$?`, answer: mode.ans, accept: [], hint: `Magnitude from the triangle, sign from the quadrant you identified.` },
    ],
    finalAnswer: { value: mode.ans, unit: "" },
    solutionNarrative: `The inner angle sits ${mode.quad}, where ${mode.outer} is ${mode.sign}. The reference triangle is ${p}-${q}-${c}, so $${mode.exprL} = ${mode.ans}$.`,
  };
};

// --- applied-angle-recovery ---

fill["trg3-inverse-applied-1"] = (rng, idx) => {
  const mode = rng.int(0, 1);
  if (mode === 0) {
    const L = rng.pick([8, 10, 12, 16, 20]);
    const h = L / 2;
    const ctx = rng.pick([
      { thing: `A ${L}-ft ladder leans against a wall and reaches ${h} ft up`, ask: "the angle the ladder makes with the ground" },
      { thing: `A ${L}-m guy wire runs from the top of a ${h}-m pole to the ground`, ask: "the angle the wire makes with the ground" },
      { thing: `A ${L}-m zipline drops to a platform ${h} m below its anchor`, ask: "the angle the zipline makes with the horizontal" },
    ]);
    return {
      id: `gen.trg3-inverse-applied-1.${idx}`, generated: true, concepts: ["applied-angle-recovery"], difficulty: 1, context: "applied",
      prompt: `${ctx.thing}. Find ${ctx.ask}, exactly.`,
      steps: [
        { instruction: `You know the side OPPOSITE the angle (${h}) and the HYPOTENUSE (${L}). What is $\\sin\\theta$?`, answer: "1/2", accept: ["0.5", `${h}/${L}`], hint: `$\\frac{${h}}{${L}}$ reduces.` },
        { instruction: `Apply the inverse: $\\theta = \\arcsin\\frac{1}{2}$ = ? (degrees)`, answer: "30", accept: ["30 degrees"], hint: `$\\sin 30^\\circ = \\frac{1}{2}$ — a special value, so no calculator needed.` },
      ],
      finalAnswer: { value: "30", unit: "degrees" },
      solutionNarrative: `Opposite over hypotenuse gives $\\sin\\theta = \\frac{${h}}{${L}} = \\frac{1}{2}$, so $\\theta = \\arcsin\\frac{1}{2} = 30^\\circ$.`,
    };
  }
  const a = rng.pick([3, 4, 5, 6, 8]);
  const ctx = rng.pick([
    { thing: `A ramp rises ${a} ft over a horizontal run of ${a} ft`, ask: "the ramp's angle of incline" },
    { thing: `A drainage pipe drops ${a} m over a horizontal distance of ${a} m`, ask: "the pipe's angle below horizontal" },
    { thing: `A staircase stringer rises ${a} ft across a run of ${a} ft`, ask: "the stringer's angle of incline" },
  ]);
  return {
    id: `gen.trg3-inverse-applied-1.${idx}`, generated: true, concepts: ["applied-angle-recovery"], difficulty: 1, context: "applied",
    prompt: `${ctx.thing}. Find ${ctx.ask}, exactly.`,
    steps: [
      { instruction: `You know the side OPPOSITE the angle (${a}) and the side ADJACENT to it (${a}). What is $\\tan\\theta$?`, answer: "1", accept: [`${a}/${a}`], hint: `$\\frac{${a}}{${a}}$.` },
      { instruction: `Apply the inverse: $\\theta = \\arctan 1$ = ? (degrees)`, answer: "45", accept: ["45 degrees"], hint: `$\\tan 45^\\circ = 1$ — rise equals run means a $45^\\circ$ slope.` },
    ],
    finalAnswer: { value: "45", unit: "degrees" },
    solutionNarrative: `Rise over run gives $\\tan\\theta = \\frac{${a}}{${a}} = 1$, so $\\theta = \\arctan 1 = 45^\\circ$.`,
  };
};

fill["trg3-inverse-applied-2"] = (rng, idx) => {
  const t = rng.pick(TRIPLES);
  const p = Math.min(t[0], t[1]);
  const q = Math.max(t[0], t[1]);
  const ang = r1(atanDeg(p / q));
  const ctx = rng.pick([
    { thing: `A drone hovers ${p}0 m above its launch pad while you stand ${q}0 m away horizontally`, ask: "the angle of elevation from you to the drone", unit: "m" },
    { thing: `A lighthouse keeper looks down at a boat: the lamp is ${p}0 ft above the water and the boat is ${q}0 ft from the base`, ask: "the angle of depression to the boat", unit: "ft" },
    { thing: `A cell antenna stands ${p}0 ft tall and casts a ${q}0-ft shadow`, ask: "the sun's angle of elevation", unit: "ft" },
  ]);
  return {
    id: `gen.trg3-inverse-applied-2.${idx}`, generated: true, concepts: ["applied-angle-recovery"], difficulty: 2, context: "applied",
    prompt: `${ctx.thing}. Find ${ctx.ask}. Round to 1 decimal place.`,
    steps: [
      { instruction: `The vertical side is opposite the angle and the horizontal side is adjacent. What is $\\tan\\theta$ as a fraction (reduce or not — your choice)?`, answer: `${p}/${q}`, accept: [`${p}0/${q}0`], hint: `$\\frac{${p}0}{${q}0} = \\frac{${p}}{${q}}$.` },
      { instruction: `Compute $\\theta = \\arctan\\frac{${p}}{${q}}$ in degree mode and round to 1 decimal place.`, answer: ang, accept: [`${ang} degrees`], hint: `$\\frac{${p}}{${q}} \\approx ${r4(p / q)}$; take $\\tan^{-1}$ of that.` },
    ],
    finalAnswer: { value: ang, unit: "degrees" },
    solutionNarrative: `$\\tan\\theta = \\frac{${p}0}{${q}0} = \\frac{${p}}{${q}}$, so $\\theta = \\arctan(${r4(p / q)}) \\approx ${ang}^\\circ$.`,
  };
};

// Ramp-compliance table: every entry's true angle is at least 0.2 degrees away
// from the 4.8-degree threshold, so rounding can never flip the verdict.
const RAMPS = [
  { rise: 1, run: 20 }, { rise: 2, run: 25 }, { rise: 2, run: 20 },
  { rise: 3, run: 30 }, { rise: 3, run: 40 }, { rise: 2, run: 30 }, { rise: 3, run: 25 },
];

fill["trg3-inverse-applied-3"] = (rng, idx) => {
  const t = rng.pick(RAMPS);
  const angle = atanDeg(t.rise / t.run);
  const ang1 = r1(angle);
  const ok = angle < 4.8;
  const yn = ok ? "yes" : "no";
  const ctx = rng.pick([
    { thing: "A wheelchair ramp", place: "a library entrance" },
    { thing: "An accessibility ramp", place: "a clinic doorway" },
    { thing: "A loading ramp", place: "a community center" },
  ]);
  return {
    id: `gen.trg3-inverse-applied-3.${idx}`, generated: true, concepts: ["applied-angle-recovery"], difficulty: 3, context: "applied",
    prompt: `${ctx.thing} at ${ctx.place} rises ${t.rise} ft over a horizontal run of ${t.run} ft. The accessibility code allows an incline of at most $4.8^\\circ$. Find the ramp's angle (round to 1 decimal place) and decide whether it complies.`,
    steps: [
      { instruction: `Rise is opposite, run is adjacent. What is $\\tan\\theta$?`, answer: `${t.rise}/${t.run}`, accept: [], hint: `$\\frac{\\text{rise}}{\\text{run}} = \\frac{${t.rise}}{${t.run}}$.` },
      { instruction: `Compute $\\theta = \\arctan\\frac{${t.rise}}{${t.run}}$ and round to 1 decimal place (degrees).`, answer: ang1, accept: [`${ang1} degrees`], hint: `$\\frac{${t.rise}}{${t.run}} = ${r4(t.rise / t.run)}$; take $\\tan^{-1}$ in degree mode.` },
      { instruction: `Does the ramp comply with the $4.8^\\circ$ limit? (yes/no)`, answer: yn, accept: [ok ? "y" : "n"], hint: `Compare $${ang1}^\\circ$ with $4.8^\\circ$.` },
    ],
    finalAnswer: { value: `${ang1} degrees — ${ok ? "complies" : "does NOT comply"}`, unit: "" },
    solutionNarrative: `$\\theta = \\arctan\\frac{${t.rise}}{${t.run}} \\approx ${ang1}^\\circ$, which is ${ok ? "under" : "over"} the $4.8^\\circ$ limit, so the ramp ${ok ? "complies" : "must be rebuilt with a longer run"}.`,
  };
};

// ============================================================================
// polar-coordinates.json
// ============================================================================

// --- polar-to-rectangular ---

fill["trg3-polar-torect-1"] = (rng, idx) => {
  const r = rng.pick([2, 4, 6, 8, 10]);
  const h = r / 2;
  const th = rng.pick([30, 45, 60]);
  const T = {
    30: { cos: "sqrt(3)/2", cosL: "\\frac{\\sqrt{3}}{2}", sinL: "\\frac{1}{2}", x: sq(h, 3), y: `${h}` },
    45: { cos: "sqrt(2)/2", cosL: "\\frac{\\sqrt{2}}{2}", sinL: "\\frac{\\sqrt{2}}{2}", x: sq(h, 2), y: sq(h, 2) },
    60: { cos: "1/2", cosL: "\\frac{1}{2}", sinL: "\\frac{\\sqrt{3}}{2}", x: `${h}`, y: sq(h, 3) },
  }[th];
  return {
    id: `gen.trg3-polar-torect-1.${idx}`, generated: true, concepts: ["polar-to-rectangular"], difficulty: 1, context: "abstract",
    prompt: `Convert the polar point $(r, \\theta) = (${r}, ${th}^\\circ)$ to rectangular coordinates $(x, y)$. Give exact values.`,
    steps: [
      { instruction: `What is $\\cos ${th}^\\circ$? (Exact.)`, answer: T.cos, accept: [], hint: `A special value: $${T.cosL}$.` },
      { instruction: `Compute $x = r\\cos\\theta = ${r} \\cdot ${T.cosL}$. (Exact.)`, answer: T.x, accept: [], hint: `Multiply: half of ${r} is ${h}.` },
      { instruction: `Compute $y = r\\sin\\theta$, using $\\sin ${th}^\\circ = ${T.sinL}$. (Exact.)`, answer: T.y, accept: [], hint: `$${r} \\cdot ${T.sinL}$.` },
    ],
    finalAnswer: { value: `(${T.x}, ${T.y})`, unit: "" },
    solutionNarrative: `$x = ${r}\\cos ${th}^\\circ = ${T.x}$ and $y = ${r}\\sin ${th}^\\circ = ${T.y}$, so the point is $(${T.x}, ${T.y})$.`,
  };
};

// Exact cos/sin components for the non-QI special angles, encoded as
// sign * (r/2) * sqrt(s) with s in {1,2,3}.
const TH2 = {
  120: { q: "II", x: [-1, 1], y: [1, 3], cx: "-1/2", sy: "sqrt(3)/2" },
  135: { q: "II", x: [-1, 2], y: [1, 2], cx: "-sqrt(2)/2", sy: "sqrt(2)/2" },
  150: { q: "II", x: [-1, 3], y: [1, 1], cx: "-sqrt(3)/2", sy: "1/2" },
  210: { q: "III", x: [-1, 3], y: [-1, 1], cx: "-sqrt(3)/2", sy: "-1/2" },
  225: { q: "III", x: [-1, 2], y: [-1, 2], cx: "-sqrt(2)/2", sy: "-sqrt(2)/2" },
  240: { q: "III", x: [-1, 1], y: [-1, 3], cx: "-1/2", sy: "-sqrt(3)/2" },
  300: { q: "IV", x: [1, 1], y: [-1, 3], cx: "1/2", sy: "-sqrt(3)/2" },
  315: { q: "IV", x: [1, 2], y: [-1, 2], cx: "sqrt(2)/2", sy: "-sqrt(2)/2" },
  330: { q: "IV", x: [1, 3], y: [-1, 1], cx: "sqrt(3)/2", sy: "-1/2" },
};

fill["trg3-polar-torect-2"] = (rng, idx) => {
  const r = rng.pick([2, 4, 6, 8]);
  const h = r / 2;
  const th = rng.pick([120, 135, 150, 210, 225, 240, 300, 315, 330]);
  const t = TH2[th];
  const xs = sval(t.x[0], h, t.x[1]);
  const ys = sval(t.y[0], h, t.y[1]);
  return {
    id: `gen.trg3-polar-torect-2.${idx}`, generated: true, concepts: ["polar-to-rectangular"], difficulty: 2, context: "abstract",
    prompt: `Convert the polar point $(r, \\theta) = (${r}, ${th}^\\circ)$ to rectangular coordinates. Give exact values — signs matter.`,
    steps: [
      { instruction: `Which quadrant does the angle $${th}^\\circ$ put the point in? (Roman numeral.)`, answer: t.q, accept: QACC[t.q], hint: `Between which two axes does the $${th}^\\circ$ arm point?` },
      { instruction: `Compute $x = ${r}\\cos ${th}^\\circ$. (Exact; $\\cos ${th}^\\circ$ = ${t.cx}.)`, answer: xs, accept: [], hint: `$${r} \\cdot$ (${t.cx}).` },
      { instruction: `Compute $y = ${r}\\sin ${th}^\\circ$. (Exact; $\\sin ${th}^\\circ$ = ${t.sy}.)`, answer: ys, accept: [], hint: `$${r} \\cdot$ (${t.sy}).` },
    ],
    finalAnswer: { value: `(${xs}, ${ys})`, unit: "" },
    solutionNarrative: `In Q${t.q} the signs are set by the quadrant: $x = ${r}\\cos ${th}^\\circ = ${xs}$, $y = ${r}\\sin ${th}^\\circ = ${ys}$.`,
  };
};

fill["trg3-polar-torect-3"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A radar blip sits at", unit: "km" },
    { thing: "A lidar return places an obstacle at", unit: "m" },
    { thing: "A sonar contact registers at", unit: "m" },
  ]);
  const r = rng.int(3, 9);
  const th = rng.pick([20, 40, 70, 110, 160, 200, 250, 290, 340]);
  const xs = r2(r * cosD(th));
  const ys = r2(r * sinD(th));
  return {
    id: `gen.trg3-polar-torect-3.${idx}`, generated: true, concepts: ["polar-to-rectangular"], difficulty: 3, context: "applied",
    prompt: `${ctx.thing} range ${r} ${ctx.unit}, bearing $${th}^\\circ$ counterclockwise from east — the polar point $(${r}, ${th}^\\circ)$. Convert to rectangular $(x, y)$ for the mapping software. Round each coordinate to 2 decimal places.`,
    steps: [
      { instruction: `Compute $x = ${r}\\cos ${th}^\\circ$, rounded to 2 decimal places.`, answer: xs, accept: [], hint: `$\\cos ${th}^\\circ \\approx ${r4(cosD(th))}$; multiply by ${r}.` },
      { instruction: `Compute $y = ${r}\\sin ${th}^\\circ$, rounded to 2 decimal places.`, answer: ys, accept: [], hint: `$\\sin ${th}^\\circ \\approx ${r4(sinD(th))}$; multiply by ${r}.` },
    ],
    finalAnswer: { value: `(${xs}, ${ys})`, unit: ctx.unit },
    solutionNarrative: `$x = ${r}\\cos ${th}^\\circ \\approx ${xs}$ and $y = ${r}\\sin ${th}^\\circ \\approx ${ys}$ ${ctx.unit} — the same two formulas work in every quadrant because cosine and sine carry the signs.`,
  };
};

// --- rectangular-to-polar ---

fill["trg3-polar-topolar-1"] = (rng, idx) => {
  const t = rng.pick(TRIPLES);
  const swap = rng.int(0, 1) === 1;
  const p = swap ? t[1] : t[0];
  const q = swap ? t[0] : t[1];
  const c = t[2];
  const th = rd(atanDeg(q / p));
  return {
    id: `gen.trg3-polar-topolar-1.${idx}`, generated: true, concepts: ["rectangular-to-polar"], difficulty: 1, context: "abstract",
    prompt: `Convert the rectangular point $(${p}, ${q})$ to polar coordinates $(r, \\theta)$ with $\\theta$ in degrees rounded to the nearest degree.`,
    steps: [
      { instruction: `Compute $r = \\sqrt{x^2 + y^2} = \\sqrt{${p}^2 + ${q}^2}$.`, answer: `${c}`, accept: [], hint: `$${p * p} + ${q * q} = ${c * c}$, a perfect square.` },
      { instruction: `What ratio does $\\tan\\theta$ equal for this point?`, answer: `${q}/${p}`, accept: [], hint: `$\\tan\\theta = \\frac{y}{x}$.` },
      { instruction: `The point is in QI, so $\\theta = \\arctan\\frac{${q}}{${p}}$ directly. Round to the nearest degree.`, answer: `${th}`, accept: [`${th} degrees`], hint: `$\\frac{${q}}{${p}} = ${r4(q / p)}$; take $\\tan^{-1}$ in degree mode.` },
    ],
    finalAnswer: { value: `(${c}, ${th}°)`, unit: "" },
    solutionNarrative: `$r = \\sqrt{${p * p} + ${q * q}} = ${c}$ (a Pythagorean triple) and $\\theta = \\arctan\\frac{${q}}{${p}} \\approx ${th}^\\circ$, so the point is $(${c}, ${th}^\\circ)$.`,
  };
};

const P2 = [
  { xl: "1", yl: "\\sqrt{3}", r: "2", ss: 4, th: 60, quad: "I" },
  { xl: "\\sqrt{3}", yl: "1", r: "2", ss: 4, th: 30, quad: "I" },
  { xl: "1", yl: "1", r: "sqrt(2)", ss: 2, th: 45, quad: "I" },
  { xl: "-1", yl: "1", r: "sqrt(2)", ss: 2, th: 135, quad: "II" },
  { xl: "-\\sqrt{3}", yl: "1", r: "2", ss: 4, th: 150, quad: "II" },
  { xl: "-1", yl: "\\sqrt{3}", r: "2", ss: 4, th: 120, quad: "II" },
  { xl: "2", yl: "2", r: "2sqrt(2)", ss: 8, th: 45, quad: "I" },
  { xl: "-2", yl: "2", r: "2sqrt(2)", ss: 8, th: 135, quad: "II" },
];

fill["trg3-polar-topolar-2"] = (rng, idx) => {
  const t = rng.pick(P2);
  return {
    id: `gen.trg3-polar-topolar-2.${idx}`, generated: true, concepts: ["rectangular-to-polar"], difficulty: 2, context: "abstract",
    prompt: `Convert the rectangular point $\\left(${t.xl}, ${t.yl}\\right)$ to polar coordinates $(r, \\theta)$ exactly, with $0^\\circ \\le \\theta < 360^\\circ$.`,
    steps: [
      { instruction: `Compute $r = \\sqrt{x^2 + y^2}$. (Exact.)`, answer: t.r, accept: [], hint: `$x^2 + y^2 = ${t.ss}$, so $r = \\sqrt{${t.ss}}$.` },
      { instruction: `Find $\\theta$ (degrees), placing the angle in the correct quadrant (Q${t.quad} here).`, answer: `${t.th}`, accept: [`${t.th} degrees`], hint: t.quad === "I" ? `The reference angle from the special-value table IS the answer in QI.` : `The reference angle is $${180 - t.th}^\\circ$; in QII use $180^\\circ$ minus it.` },
    ],
    finalAnswer: { value: `(${t.r}, ${t.th}°)`, unit: "" },
    solutionNarrative: `$r = \\sqrt{${t.ss}} = ${t.r}$ and the arm to $\\left(${t.xl}, ${t.yl}\\right)$ makes $${t.th}^\\circ$ with the positive $x$-axis (Q${t.quad}), so the polar form is $(${t.r}, ${t.th}^\\circ)$.`,
  };
};

fill["trg3-polar-topolar-3"] = (rng, idx) => {
  const t = rng.pick(TRIPLES);
  const p = t[0], q = t[1], c = t[2];
  const quad = rng.pick(["II", "III", "IV"]);
  const x = quad === "IV" ? p : -p;
  const y = quad === "II" ? q : -q;
  const ref = rd(atanDeg(q / p));
  const th = quad === "II" ? 180 - ref : quad === "III" ? 180 + ref : 360 - ref;
  const adjText = quad === "II" ? `180^\\circ - ${ref}^\\circ` : quad === "III" ? `180^\\circ + ${ref}^\\circ` : `360^\\circ - ${ref}^\\circ`;
  return {
    id: `gen.trg3-polar-topolar-3.${idx}`, generated: true, concepts: ["rectangular-to-polar"], difficulty: 3, context: "abstract",
    prompt: `Convert the rectangular point $(${x}, ${y})$ to polar coordinates $(r, \\theta)$, $0^\\circ \\le \\theta < 360^\\circ$, $\\theta$ to the nearest degree. A bare $\\arctan\\frac{y}{x}$ will NOT give the right angle here.`,
    steps: [
      { instruction: `Compute $r = \\sqrt{(${x})^2 + (${y})^2}$.`, answer: `${c}`, accept: [], hint: `Squares kill the signs: $${p * p} + ${q * q} = ${c * c}$.` },
      { instruction: `Which quadrant is $(${x}, ${y})$ in? (Roman numeral.)`, answer: quad, accept: QACC[quad], hint: `Check the signs of $x$ and $y$.` },
      { instruction: `Find the reference angle $\\arctan\\frac{|y|}{|x|} = \\arctan\\frac{${q}}{${p}}$, to the nearest degree.`, answer: `${ref}`, accept: [`${ref} degrees`], hint: `$\\frac{${q}}{${p}} = ${r4(q / p)}$.` },
      { instruction: `Place the reference angle in Q${quad}: compute $\\theta = ${adjText}$.`, answer: `${th}`, accept: [`${th} degrees`], hint: `QII: $180 - $ ref; QIII: $180 + $ ref; QIV: $360 - $ ref.` },
    ],
    finalAnswer: { value: `(${c}, ${th}°)`, unit: "" },
    solutionNarrative: `$r = ${c}$ from the ${p}-${q}-${c} triple. The point is in Q${quad} with reference angle $${ref}^\\circ$, so $\\theta = ${adjText} = ${th}^\\circ$ — the quadrant adjustment is the step a bare calculator $\\tan^{-1}$ skips.`,
  };
};

// --- polar-equations-conversion ---

fill["trg3-polar-eqconv-1"] = (rng, idx) => {
  const k = rng.int(2, 7);
  const k2 = k * k;
  if (rng.int(0, 1) === 0) {
    return {
      id: `gen.trg3-polar-eqconv-1.${idx}`, generated: true, concepts: ["polar-equations-conversion"], difficulty: 1, context: "abstract",
      prompt: `Convert the polar equation $r = ${k}$ to rectangular coordinates.`,
      steps: [
        { instruction: `What expression in $x$ and $y$ equals $r^2$?`, answer: "x^2 + y^2", accept: [], hint: `From the conversion triangle: $r = \\sqrt{x^2 + y^2}$, so $r^2 = x^2 + y^2$.` },
        { instruction: `Square both sides of $r = ${k}$ and substitute. Write the rectangular equation.`, answer: `x^2 + y^2 = ${k2}`, accept: [`x^2 + y^2 - ${k2} = 0`], hint: `$r^2 = ${k2}$ becomes $x^2 + y^2 = ${k2}$.` },
      ],
      finalAnswer: { value: `x^2 + y^2 = ${k2}`, unit: "" },
      solutionNarrative: `Squaring gives $r^2 = ${k2}$; substituting $r^2 = x^2 + y^2$ yields $x^2 + y^2 = ${k2}$ — a circle of radius ${k} centered at the origin, exactly what "all points at distance ${k} from the pole" should be.`,
    };
  }
  return {
    id: `gen.trg3-polar-eqconv-1.${idx}`, generated: true, concepts: ["polar-equations-conversion"], difficulty: 1, context: "abstract",
    prompt: `Convert the rectangular equation $x^2 + y^2 = ${k2}$ to a polar equation.`,
    steps: [
      { instruction: `Substitute $x^2 + y^2 = r^2$. What equation results?`, answer: `r^2 = ${k2}`, accept: [], hint: `Replace the whole left side with $r^2$.` },
      { instruction: `Solve for $r$ (take $r \\ge 0$).`, answer: `r = ${k}`, accept: [`${k}`], hint: `$\\sqrt{${k2}} = ${k}$.` },
    ],
    finalAnswer: { value: `r = ${k}`, unit: "" },
    solutionNarrative: `$x^2 + y^2 = r^2$ turns the equation into $r^2 = ${k2}$, so $r = ${k}$: the circle becomes a one-symbol equation in polar form.`,
  };
};

fill["trg3-polar-eqconv-2"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const m = 2 * a;
  if (rng.int(0, 1) === 0) {
    // polar -> rectangular with the multiply-by-r trick (cosine version)
    return {
      id: `gen.trg3-polar-eqconv-2.${idx}`, generated: true, concepts: ["polar-equations-conversion"], difficulty: 2, context: "abstract",
      prompt: `Convert the polar equation $r = ${m}\\cos\\theta$ to rectangular coordinates.`,
      steps: [
        { instruction: `Neither $r$ alone nor $\\cos\\theta$ alone substitutes cleanly — but $r^2$ and $r\\cos\\theta$ both do. Multiply BOTH sides by $r$ and write the result (type theta for $\\theta$).`, answer: `r^2 = ${m}rcos(theta)`, accept: [`r^2 = ${m}rcosθ`, `${m}rcos(theta) = r^2`, `r^2 = ${m}r cos(theta)`], hint: `$r \\cdot r = r^2$ on the left, $${m}r\\cos\\theta$ on the right.` },
        { instruction: `Substitute $r^2 = x^2 + y^2$ and $r\\cos\\theta = x$. Write the rectangular equation.`, answer: `x^2 + y^2 = ${m}x`, accept: [`x^2 + y^2 - ${m}x = 0`], hint: `Both substitutions come straight from the conversion triangle.` },
      ],
      finalAnswer: { value: `x^2 + y^2 = ${m}x`, unit: "" },
      solutionNarrative: `Multiplying by $r$ gives $r^2 = ${m}r\\cos\\theta$; substituting $r^2 = x^2 + y^2$ and $r\\cos\\theta = x$ gives $x^2 + y^2 = ${m}x$ — a circle through the origin.`,
    };
  }
  // rectangular -> polar (sine version)
  return {
    id: `gen.trg3-polar-eqconv-2.${idx}`, generated: true, concepts: ["polar-equations-conversion"], difficulty: 2, context: "abstract",
    prompt: `Convert the rectangular equation $x^2 + y^2 = ${m}y$ to a polar equation solved for $r$.`,
    steps: [
      { instruction: `Substitute $x^2 + y^2 = r^2$ and $y = r\\sin\\theta$. Write the resulting polar equation (type theta for $\\theta$).`, answer: `r^2 = ${m}rsin(theta)`, accept: [`r^2 = ${m}rsinθ`, `${m}rsin(theta) = r^2`, `r^2 = ${m}r sin(theta)`], hint: `Left side becomes $r^2$; the right side's $y$ becomes $r\\sin\\theta$.` },
      { instruction: `Divide both sides by $r$ and write the equation solved for $r$.`, answer: `r = ${m}sin(theta)`, accept: [`${m}sin(theta)`, `${m}sintheta`, `r = ${m}sinθ`, `r = ${m}sintheta`], hint: `$\\frac{r^2}{r} = r$. (Dividing by $r$ only drops the pole point, which the curve still passes through at $\\theta = 0$.)` },
    ],
    finalAnswer: { value: `r = ${m}sin(theta)`, unit: "" },
    solutionNarrative: `Substituting gives $r^2 = ${m}r\\sin\\theta$; dividing by $r$ leaves $r = ${m}\\sin\\theta$. The circle's polar form is one term long.`,
  };
};

fill["trg3-polar-eqconv-3"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const m = 2 * a;
  const useCos = rng.int(0, 1) === 0;
  const fn = useCos ? "\\cos" : "\\sin";
  const varName = useCos ? "x" : "y";
  const rect = `x^2 + y^2 = ${m}${varName}`;
  const center = useCos ? `(${a}, 0)` : `(0, ${a})`;
  const completed = useCos ? `(x - ${a})^2 + y^2 = ${a * a}` : `x^2 + (y - ${a})^2 = ${a * a}`;
  return {
    id: `gen.trg3-polar-eqconv-3.${idx}`, generated: true, concepts: ["polar-equations-conversion"], difficulty: 3, context: "abstract",
    prompt: `The polar equation $r = ${m}${fn}\\theta$ is a circle in disguise. Convert it to rectangular form, then find the circle's center and radius.`,
    steps: [
      { instruction: `Multiply both sides by $r$, then substitute $r^2 = x^2 + y^2$ and $r${fn}\\theta = ${varName}$. Write the rectangular equation.`, answer: rect, accept: [`x^2 + y^2 - ${m}${varName} = 0`], hint: `$r^2 = ${m}r${fn}\\theta$ becomes $x^2 + y^2 = ${m}${varName}$.` },
      { instruction: `Complete the square (the identity $${varName}^2 - ${m}${varName} + ${a * a} = (${varName} - ${a})^2$ helps): $${completed}$. What is the center $(x, y)$?`, answer: center, accept: [center.replace(", ", ",")], hint: `Move $${m}${varName}$ left and add $${a * a}$ to both sides.` },
      { instruction: `What is the radius?`, answer: `${a}`, accept: [], hint: `The right side is $${a * a} = ${a}^2$.` },
    ],
    finalAnswer: { value: `circle, center ${center}, radius ${a}`, unit: "" },
    solutionNarrative: `Multiplying by $r$ and substituting gives $${rect}$; completing the square yields $${completed}$ — a circle centered at $${center}$ with radius ${a}, tangent to the pole.`,
  };
};

// --- polar-curves-recognition ---

const MENU = `Identify the curve: type circle, cardioid, rose, or line.`;

fill["trg3-polar-curves-1"] = (rng, idx) => {
  if (rng.int(0, 1) === 0) {
    const k = rng.int(2, 7);
    return {
      id: `gen.trg3-polar-curves-1.${idx}`, generated: true, concepts: ["polar-curves-recognition"], difficulty: 1, context: "abstract",
      prompt: `Consider the polar equation $r = ${k}$.`,
      steps: [
        { instruction: `${MENU}`, answer: "circle", accept: ["a circle"], hint: `Every point at distance ${k} from the pole, in every direction.` },
        { instruction: `What is its radius?`, answer: `${k}`, accept: [], hint: `$r$ is constant at ${k}.` },
      ],
      finalAnswer: { value: `circle of radius ${k}`, unit: "" },
      solutionNarrative: `$r = ${k}$ holds for every $\\theta$: all points at distance ${k} from the pole — a circle of radius ${k} centered at the origin.`,
    };
  }
  const cdeg = rng.pick([30, 45, 60, 120, 135, 150]);
  return {
    id: `gen.trg3-polar-curves-1.${idx}`, generated: true, concepts: ["polar-curves-recognition"], difficulty: 1, context: "abstract",
    prompt: `Consider the polar equation $\\theta = ${cdeg}^\\circ$ (with $r$ allowed to be any real number).`,
    steps: [
      { instruction: `${MENU}`, answer: "line", accept: ["a line"], hint: `The direction is fixed; only the distance varies — every point along one direction through the pole.` },
      { instruction: `What angle (in degrees) does it make with the positive $x$-axis?`, answer: `${cdeg}`, accept: [`${cdeg} degrees`], hint: `The equation names the angle directly.` },
    ],
    finalAnswer: { value: `line at ${cdeg}° through the pole`, unit: "" },
    solutionNarrative: `Fixing $\\theta = ${cdeg}^\\circ$ while $r$ runs over all reals traces the straight line through the pole at $${cdeg}^\\circ$ to the positive $x$-axis.`,
  };
};

fill["trg3-polar-curves-2"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const fn = rng.pick(["\\cos", "\\sin"]);
  const minus = rng.int(0, 1) === 1;
  const eq = `r = ${a} ${minus ? "-" : "+"} ${a}${fn}\\theta`;
  return {
    id: `gen.trg3-polar-curves-2.${idx}`, generated: true, concepts: ["polar-curves-recognition"], difficulty: 2, context: "abstract",
    prompt: `Consider the polar equation $${eq}$.`,
    steps: [
      { instruction: `The constant term (${a}) EQUALS the coefficient of $${fn}\\theta$ (${a}). ${MENU}`, answer: "cardioid", accept: ["a cardioid"], hint: `$r = a \\pm a\\cos\\theta$ or $r = a \\pm a\\sin\\theta$ is the heart-shaped curve.` },
      { instruction: `What is the MAXIMUM value of $r$ on this curve?`, answer: `${2 * a}`, accept: [], hint: `It occurs where $${fn}\\theta = ${minus ? "-1" : "1"}$: $${a} + ${a} = ${2 * a}$.` },
      { instruction: `What is the MINIMUM value of $r$?`, answer: "0", accept: [], hint: `Where $${fn}\\theta = ${minus ? "1" : "-1"}$ the two terms cancel — the cardioid touches the pole, which makes its signature cusp.` },
    ],
    finalAnswer: { value: `cardioid (max r = ${2 * a})`, unit: "" },
    solutionNarrative: `Constant equal to coefficient marks a cardioid. $r$ swings between $0$ (the cusp at the pole) and $${2 * a}$ (the far tip).`,
  };
};

fill["trg3-polar-curves-3"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const n = rng.pick([2, 3, 4, 5]);
  const fn = rng.pick(["\\cos", "\\sin"]);
  const petals = n % 2 === 1 ? n : 2 * n;
  return {
    id: `gen.trg3-polar-curves-3.${idx}`, generated: true, concepts: ["polar-curves-recognition"], difficulty: 3, context: "abstract",
    prompt: `Consider the polar equation $r = ${a}${fn}(${n}\\theta)$.`,
    steps: [
      { instruction: `The angle is multiplied by ${n} inside the trig function. ${MENU}`, answer: "rose", accept: ["a rose", "rose curve"], hint: `$r = a\\cos(n\\theta)$ and $r = a\\sin(n\\theta)$ trace petaled rose curves.` },
      { instruction: `How many petals does it have? (Rule: $n$ petals if $n$ is odd, $2n$ if $n$ is even.)`, answer: `${petals}`, accept: [], hint: `Here $n = ${n}$, which is ${n % 2 === 1 ? "odd" : "even"}.` },
      { instruction: `How long is each petal (the maximum $|r|$)?`, answer: `${a}`, accept: [], hint: `$${fn}(${n}\\theta)$ peaks at 1, so $r$ peaks at the coefficient.` },
    ],
    finalAnswer: { value: `rose with ${petals} petals of length ${a}`, unit: "" },
    solutionNarrative: `A multiplied angle inside cosine or sine is the rose signature. With $n = ${n}$ (${n % 2 === 1 ? "odd" : "even"}) the curve has $${petals}$ petals, each reaching $|r| = ${a}$.`,
  };
};
