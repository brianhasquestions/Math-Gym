// gen-alg2-fill.js
// Parametric generators for two Algebra 2 topics:
//   algebra-2.complex-numbers
//     a2f-imaginary-unit-*, a2f-complex-arith-*, a2f-conjugate-div-*, a2f-complex-plane-*
//   algebra-2.polynomial-functions
//     a2f-end-behavior-*, a2f-zeros-mult-*, a2f-poly-forms-*, a2f-remainder-thm-*
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry. Template prefix: a2f-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every answer is computed in
// the generator from the SAME parameters used in the prompt so they never
// desync.
//
// Grader notes honored throughout (js/problem-engine.js):
//  - i is an ordinary symbol to the polynomial engine (it does NOT know
//    i^2 = -1), so every complex answer is emitted already simplified to a+bi
//    form and no step's correct answer ever contains i^2.
//  - Moduli are numeric ("5") or exact sqrt expressions ("sqrt(13)") which
//    evalNumeric verifies; rounded decimals are added as accepts.
//  - End-behavior style answers are short menu words enumerated in the
//    instruction ("rises"/"falls", "even"/"odd", ...) with generous accepts.
//  - Zero sets use form:"solutions" (unordered, real roots only).
//  - "Write in factored form" steps use form:"factored".

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const rnd = (x, p) => { const f = Math.pow(10, p); return `${Math.round(x * f) / f}`; };
// Nonzero integer in [lo, hi].
const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
// "a + bi" with clean signs; never emits "1i" or "+ -".
const fmtIm = (im) => (im === 1 ? "i" : im === -1 ? "-i" : `${im}i`);
const fmtC = (re, im) => {
  if (im === 0) return `${re}`;
  if (re === 0) return fmtIm(im);
  return im > 0 ? `${re} + ${im === 1 ? "" : im}i` : `${re} - ${im === -1 ? "" : Math.abs(im)}i`;
};
// Polynomial in x from coefficients [c_deg, ..., c_0] (descending powers).
const fmtPoly = (coeffs) => {
  const deg = coeffs.length - 1;
  let out = "";
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const coefStr = p > 0 && abs === 1 ? "" : `${abs}`;
    const varStr = p === 0 ? "" : p === 1 ? "x" : `x^${p}`;
    const term = `${coefStr}${varStr}`;
    out = out === "" ? `${c < 0 ? "-" : ""}${term}` : `${out} ${c < 0 ? "-" : "+"} ${term}`;
  });
  return out === "" ? "0" : out;
};
// Factor (x - r) with the sign folded in; r must be nonzero.
const fmtFactor = (r) => (r > 0 ? `(x - ${r})` : `(x + ${-r})`);
const quadrantOf = (a, b) => (a > 0 ? (b > 0 ? ["first", "1"] : ["fourth", "4"]) : (b > 0 ? ["second", "2"] : ["third", "3"]));
// Parenthesize negatives so hints never read "+ -35(-4)".
const par = (n) => (n < 0 ? `(${n})` : `${n}`);
// Coefficient on i^2 without emitting "1i^2" / "-1i^2".
const coefI2 = (n) => (n === 1 ? "" : n === -1 ? "-" : `${n}`);
const RISE_OK = ["rise", "up", "goes up", "increases"];
const FALL_OK = ["fall", "down", "goes down", "decreases"];

export const fill = {};

// ===========================================================================
// TOPIC 1: algebra-2.complex-numbers
//   concepts: imaginary-unit-and-powers, complex-arithmetic,
//             conjugates-and-division, complex-plane-and-quadratics
// ===========================================================================

// --- imaginary-unit-and-powers ---
fill["a2f-imaginary-unit-1"] = (rng, idx) => {
  const k = rng.int(2, 12);
  const N = k * k;
  return {
    id: `gen.a2f-imaginary-unit-1.${idx}`, generated: true, concepts: ["imaginary-unit-and-powers"], difficulty: 1, context: "abstract",
    prompt: `Simplify $\\sqrt{-${N}}$ using the imaginary unit $i$.`,
    steps: [
      { instruction: `First handle the positive part: what is $\\sqrt{${N}}$? (Give a whole number.)`, answer: `${k}`, accept: [], hint: `${k} \\cdot ${k} = ${N}.` },
      { instruction: `Now $\\sqrt{-${N}} = \\sqrt{${N}} \\cdot \\sqrt{-1}$. Write the simplified result using $i$.`, answer: `${k}i`, accept: [`${k}*i`], hint: `$\\sqrt{-1} = i$, so the answer is (that whole number)$\\,i$.` },
    ],
    finalAnswer: { value: `${k}i`, unit: "" },
    solutionNarrative: `Pull the negative out first: $\\sqrt{-${N}} = \\sqrt{${N}}\\sqrt{-1} = ${k}i$.`,
  };
};
fill["a2f-imaginary-unit-2"] = (rng, idx) => {
  const n = rng.int(6, 49);
  const r = n % 4;
  const vals = ["1", "i", "-1", "-i"];
  const ans = vals[r];
  return {
    id: `gen.a2f-imaginary-unit-2.${idx}`, generated: true, concepts: ["imaginary-unit-and-powers"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $i^{${n}}$. The powers of $i$ cycle with period 4: $i^1 = i$, $i^2 = -1$, $i^3 = -i$, $i^4 = 1$.`,
    steps: [
      { instruction: `Divide ${n} by 4. What is the remainder? (Give a whole number 0-3.)`, answer: `${r}`, accept: [], hint: `$${n} = 4 \\cdot ${(n - r) / 4} + ${r}$.` },
      { instruction: `So $i^{${n}} = i^{${r}}$. What is its value? (Answer one of: 1, i, -1, -i.)`, answer: ans, accept: [], hint: r === 0 ? "Any $i^{4k}$ equals 1." : `Read it off the cycle: $i^{${r}}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Since $${n} \\equiv ${r} \\pmod 4$, $i^{${n}} = i^{${r}} = ${ans}$.`,
  };
};
fill["a2f-imaginary-unit-3"] = (rng, idx) => {
  const a = rng.int(2, 9), b = rng.int(2, 9);
  const prod = -a * b;
  return {
    id: `gen.a2f-imaginary-unit-3.${idx}`, generated: true, concepts: ["imaginary-unit-and-powers"], difficulty: 3, context: "abstract",
    prompt: `Simplify $\\sqrt{-${a * a}} \\cdot \\sqrt{-${b * b}}$. Careful: the rule $\\sqrt{x}\\sqrt{y} = \\sqrt{xy}$ does NOT hold for two negatives — convert each radical to $i$ form FIRST.`,
    steps: [
      { instruction: `Rewrite $\\sqrt{-${a * a}}$ using $i$.`, answer: `${a}i`, accept: [`${a}*i`], hint: `$\\sqrt{-${a * a}} = \\sqrt{${a * a}}\\,i$.` },
      { instruction: `Rewrite $\\sqrt{-${b * b}}$ using $i$.`, answer: `${b}i`, accept: [`${b}*i`], hint: `$\\sqrt{-${b * b}} = \\sqrt{${b * b}}\\,i$.` },
      { instruction: `Multiply: $(${a}i)(${b}i) = ${a * b}i^2$. Using $i^2 = -1$, what real number is this? (Give a number.)`, answer: `${prod}`, accept: [], hint: `$${a * b} \\cdot (-1)$.` },
    ],
    finalAnswer: { value: `${prod}`, unit: "" },
    solutionNarrative: `Convert first: $(${a}i)(${b}i) = ${a * b}i^2 = ${prod}$. Multiplying the radicands directly would give $\\sqrt{${a * a * b * b}} = ${a * b}$ — the wrong sign.`,
  };
};

// --- complex-arithmetic ---
fill["a2f-complex-arith-1"] = (rng, idx) => {
  let a, b, c, d;
  do { a = nz(rng, -9, 9); b = nz(rng, -9, 9); c = nz(rng, -9, 9); d = nz(rng, -9, 9); }
  while (a + c === 0 || b + d === 0); // keep both parts of the sum nonzero
  const re = a + c, im = b + d;
  return {
    id: `gen.a2f-complex-arith-1.${idx}`, generated: true, concepts: ["complex-arithmetic"], difficulty: 1, context: "abstract",
    prompt: `Add the complex numbers: $(${fmtC(a, b)}) + (${fmtC(c, d)})$. Give the result in $a + bi$ form.`,
    steps: [
      { instruction: `Add the real parts: $${a} + (${c})$. (Give a number.)`, answer: `${re}`, accept: [], hint: `Real parts are ${a} and ${c}.` },
      { instruction: `Add the imaginary coefficients: $${b} + (${d})$. (Give a number.)`, answer: `${im}`, accept: [], hint: `The coefficients of $i$ are ${b} and ${d}.` },
      { instruction: `Combine into $a + bi$ form.`, answer: fmtC(re, im), accept: [], hint: `Real part ${re}, imaginary coefficient ${im}.` },
    ],
    finalAnswer: { value: fmtC(re, im), unit: "" },
    solutionNarrative: `Combine like parts, exactly like like terms: $(${a} + ${c > 0 ? c : `(${c})`}) + (${b} + ${d > 0 ? d : `(${d})`})i = ${fmtC(re, im)}$.`,
  };
};
fill["a2f-complex-arith-2"] = (rng, idx) => {
  let a, b, c, d;
  do { a = nz(rng, -9, 9); b = nz(rng, -9, 9); c = nz(rng, -9, 9); d = nz(rng, -9, 9); }
  while (a - c === 0 || b - d === 0); // keep both parts of the difference nonzero
  const re = a - c, im = b - d;
  return {
    id: `gen.a2f-complex-arith-2.${idx}`, generated: true, concepts: ["complex-arithmetic"], difficulty: 2, context: "abstract",
    prompt: `Subtract: $(${fmtC(a, b)}) - (${fmtC(c, d)})$. Give the result in $a + bi$ form. Watch the signs — the minus distributes to BOTH parts of the second number.`,
    steps: [
      { instruction: `Subtract the real parts: $${a} - (${c})$. (Give a number.)`, answer: `${re}`, accept: [], hint: c < 0 ? `Subtracting a negative adds: $${a} + ${-c}$.` : `$${a} - ${c}$.` },
      { instruction: `Subtract the imaginary coefficients: $${b} - (${d})$. (Give a number.)`, answer: `${im}`, accept: [], hint: d < 0 ? `Subtracting a negative adds: $${b} + ${-d}$.` : `$${b} - ${d}$.` },
      { instruction: `Combine into $a + bi$ form.`, answer: fmtC(re, im), accept: [], hint: `Real part ${re}, imaginary coefficient ${im}.` },
    ],
    finalAnswer: { value: fmtC(re, im), unit: "" },
    solutionNarrative: `Distribute the minus over both parts: real $${a} - (${c}) = ${re}$, imaginary $${b} - (${d}) = ${im}$, so the difference is $${fmtC(re, im)}$.`,
  };
};
fill["a2f-complex-arith-3"] = (rng, idx) => {
  let a, b, c, d, re, im;
  do {
    a = nz(rng, -6, 6); b = nz(rng, -6, 6); c = nz(rng, -6, 6); d = nz(rng, -6, 6);
    re = a * c - b * d; im = a * d + b * c;
  } while (re === 0 || im === 0); // keep the product genuinely a+bi
  return {
    id: `gen.a2f-complex-arith-3.${idx}`, generated: true, concepts: ["complex-arithmetic"], difficulty: 3, context: "abstract",
    prompt: `Multiply: $(${fmtC(a, b)})(${fmtC(c, d)})$. FOIL, then use $i^2 = -1$. Give the result in $a + bi$ form.`,
    steps: [
      { instruction: `The Outer and Inner products give the $i$ terms. Compute the imaginary coefficient $ad + bc = (${a})(${d}) + (${b})(${c})$. (Give a number.)`, answer: `${im}`, accept: [], hint: `$${a * d} + ${par(b * c)}$.` },
      { instruction: `The First product is $${a * c}$ and the Last product is $${coefI2(b * d)}i^2 = ${-b * d}$. Add them for the real part. (Give a number.)`, answer: `${re}`, accept: [], hint: `$${a * c} + ${par(-b * d)}$ — the $i^2$ flips the sign of $bd$.` },
      { instruction: `Combine into $a + bi$ form.`, answer: fmtC(re, im), accept: [], hint: `Real part ${re}, imaginary coefficient ${im}.` },
    ],
    finalAnswer: { value: fmtC(re, im), unit: "" },
    solutionNarrative: `$(ac - bd) + (ad + bc)i = (${a * c} - ${b * d > 0 ? b * d : `(${b * d})`}) + (${a * d} + ${b * c > 0 ? b * c : `(${b * c})`})i = ${fmtC(re, im)}$. The $i^2 = -1$ step is what folds the Last product into the REAL part.`,
  };
};

// --- conjugates-and-division ---
fill["a2f-conjugate-div-1"] = (rng, idx) => {
  const a = nz(rng, -9, 9), b = nz(rng, -9, 9);
  const conj = fmtC(a, -b);
  const prod = a * a + b * b;
  return {
    id: `gen.a2f-conjugate-div-1.${idx}`, generated: true, concepts: ["conjugates-and-division"], difficulty: 1, context: "abstract",
    prompt: `Let $z = ${fmtC(a, b)}$. Find its complex conjugate $\\bar{z}$, then compute the product $z\\bar{z}$.`,
    steps: [
      { instruction: `Write the conjugate $\\bar{z}$ (flip the sign of the imaginary part only).`, answer: conj, accept: [], hint: `Real part stays ${a}; the imaginary coefficient becomes ${-b}.` },
      { instruction: `Compute $z\\bar{z} = (${fmtC(a, b)})(${conj})$. It always equals $a^2 + b^2$ — a real number. (Give a number.)`, answer: `${prod}`, accept: [], hint: `$(${a})^2 + (${b})^2 = ${a * a} + ${b * b}$.` },
    ],
    finalAnswer: { value: `${prod}`, unit: "" },
    solutionNarrative: `$\\bar{z} = ${conj}$, and $z\\bar{z} = a^2 + b^2 = ${a * a} + ${b * b} = ${prod}$. A number times its conjugate is always real — that is exactly why conjugates clear $i$ from denominators.`,
  };
};
fill["a2f-conjugate-div-2"] = (rng, idx) => {
  // Build the quotient FROM the answer so the division is always clean:
  // numerator = (p + qi)(c + di) guarantees (A + Bi)/(c + di) = p + qi.
  let p, q, c, d, A, B;
  do {
    p = nz(rng, -5, 5); q = nz(rng, -5, 5); c = nz(rng, -4, 4); d = nz(rng, -4, 4);
    A = p * c - q * d; B = p * d + q * c;
  } while (A === 0 || B === 0);
  const den = c * c + d * d;
  const numRe = A * c + B * d;   // = p * den
  const numIm = B * c - A * d;   // = q * den
  return {
    id: `gen.a2f-conjugate-div-2.${idx}`, generated: true, concepts: ["conjugates-and-division"], difficulty: 2, context: "abstract",
    prompt: `Simplify $\\dfrac{${fmtC(A, B)}}{${fmtC(c, d)}}$ by multiplying numerator and denominator by the conjugate of the denominator. Give the result in $a + bi$ form.`,
    steps: [
      { instruction: `What is the conjugate of the denominator $${fmtC(c, d)}$?`, answer: fmtC(c, -d), accept: [], hint: `Flip only the sign of the $i$ term.` },
      { instruction: `Multiply the denominator by its conjugate: $(${fmtC(c, d)})(${fmtC(c, -d)}) = c^2 + d^2$. (Give a number.)`, answer: `${den}`, accept: [], hint: `$(${c})^2 + (${d})^2$.` },
      { instruction: `Multiply the numerator by the conjugate: $(${fmtC(A, B)})(${fmtC(c, -d)})$, simplified to $a + bi$ form.`, answer: fmtC(numRe, numIm), accept: [], hint: `FOIL and use $i^2 = -1$: real part $${par(A)}(${c}) + ${par(B)}(${d})$, imaginary $${par(B)}(${c}) - ${par(A)}(${d})$.` },
      { instruction: `Divide each part by ${den} to finish. Give the result in $a + bi$ form.`, answer: fmtC(p, q), accept: [], hint: `$${numRe}/${den} = ${p}$ and $${numIm}/${den} = ${q}$.` },
    ],
    finalAnswer: { value: fmtC(p, q), unit: "" },
    solutionNarrative: `Multiplying top and bottom by $${fmtC(c, -d)}$ makes the denominator real: $${den}$. The numerator becomes $${fmtC(numRe, numIm)}$, so the quotient is $${fmtC(p, q)}$.`,
  };
};
fill["a2f-conjugate-div-3"] = (rng, idx) => {
  let p, q, c, d, A, B;
  do {
    p = nz(rng, -6, 6); q = nz(rng, -6, 6); c = nz(rng, -5, 5); d = nz(rng, -5, 5);
    A = p * c - q * d; B = p * d + q * c;
  } while (A === 0 || B === 0);
  const den = c * c + d * d;
  const numRe = A * c + B * d;
  const numIm = B * c - A * d;
  return {
    id: `gen.a2f-conjugate-div-3.${idx}`, generated: true, concepts: ["conjugates-and-division"], difficulty: 3, context: "abstract",
    prompt: `Simplify $\\dfrac{${fmtC(A, B)}}{${fmtC(c, d)}}$, then CHECK your result by multiplying it back by the denominator. Give all complex answers in $a + bi$ form.`,
    steps: [
      { instruction: `Multiply the denominator $${fmtC(c, d)}$ by its conjugate $${fmtC(c, -d)}$. (Give a number.)`, answer: `${den}`, accept: [], hint: `$c^2 + d^2 = (${c})^2 + (${d})^2$.` },
      { instruction: `Multiply the numerator $${fmtC(A, B)}$ by the conjugate $${fmtC(c, -d)}$, in $a + bi$ form.`, answer: fmtC(numRe, numIm), accept: [], hint: `Real part $${par(A)}(${c}) + ${par(B)}(${d})$; imaginary coefficient $${par(B)}(${c}) - ${par(A)}(${d})$.` },
      { instruction: `Divide both parts by ${den}. Give the simplified quotient in $a + bi$ form.`, answer: fmtC(p, q), accept: [], hint: `$${numRe}/${den}$ and $${numIm}/${den}$ are both whole numbers.` },
      { instruction: `Check: compute $(${fmtC(p, q)})(${fmtC(c, d)})$ in $a + bi$ form — it should reproduce the original numerator.`, answer: fmtC(A, B), accept: [], hint: `Real part $${par(p)}(${c}) - ${par(q)}(${d})$; imaginary coefficient $${par(p)}(${d}) + ${par(q)}(${c})$.` },
    ],
    finalAnswer: { value: fmtC(p, q), unit: "" },
    solutionNarrative: `The conjugate trick gives $\\dfrac{${fmtC(numRe, numIm)}}{${den}} = ${fmtC(p, q)}$, and the check $(${fmtC(p, q)})(${fmtC(c, d)}) = ${fmtC(A, B)}$ recovers the numerator, confirming the quotient.`,
  };
};

// --- complex-plane-and-quadratics ---
fill["a2f-complex-plane-1"] = (rng, idx) => {
  const a = nz(rng, -8, 8), b = nz(rng, -8, 8);
  const [qWord, qNum] = quadrantOf(a, b);
  return {
    id: `gen.a2f-complex-plane-1.${idx}`, generated: true, concepts: ["complex-plane-and-quadratics"], difficulty: 1, context: "abstract",
    prompt: `Plot $z = ${fmtC(a, b)}$ on the complex plane (real axis horizontal, imaginary axis vertical).`,
    steps: [
      { instruction: `Give the point's coordinates as an ordered pair (real, imaginary).`, answer: `(${a}, ${b})`, accept: [], hint: `Real part ${a} goes horizontally; imaginary coefficient ${b} goes vertically.` },
      { instruction: `Which quadrant is the point in? (Answer: first, second, third, or fourth.)`, answer: qWord, accept: [qNum, `quadrant ${qNum}`, `q${qNum}`], hint: `The signs are (${a > 0 ? "+" : "-"}, ${b > 0 ? "+" : "-"}).` },
    ],
    finalAnswer: { value: qWord, unit: "quadrant" },
    solutionNarrative: `$${fmtC(a, b)}$ sits at $(${a}, ${b})$: ${a} along the real axis, ${b} along the imaginary axis — the ${qWord} quadrant.`,
  };
};
fill["a2f-complex-plane-2"] = (rng, idx) => {
  // Mix perfect (Pythagorean) moduli with irrational ones.
  let a, b;
  if (rng.int(0, 1) === 0) {
    const t = rng.pick([[3, 4], [6, 8], [5, 12], [8, 15], [9, 12]]);
    a = t[0] * (rng.int(0, 1) ? 1 : -1); b = t[1] * (rng.int(0, 1) ? 1 : -1);
  } else {
    a = nz(rng, -7, 7); b = nz(rng, -7, 7);
  }
  const s = a * a + b * b;
  const r = Math.sqrt(s);
  const isPerfect = Number.isInteger(r);
  const ans = isPerfect ? `${r}` : `sqrt(${s})`;
  const accepts = isPerfect ? [] : [rnd(r, 4), rnd(r, 2)];
  return {
    id: `gen.a2f-complex-plane-2.${idx}`, generated: true, concepts: ["complex-plane-and-quadratics"], difficulty: 2, context: "abstract",
    prompt: `Find the modulus $|z|$ of $z = ${fmtC(a, b)}$ — its distance from the origin in the complex plane.`,
    steps: [
      { instruction: `Compute $a^2 + b^2 = (${a})^2 + (${b})^2$. (Give a whole number.)`, answer: `${s}`, accept: [], hint: `$${a * a} + ${b * b}$.` },
      { instruction: `Take the square root: $|z| = \\sqrt{${s}}$.${isPerfect ? " (Give a whole number.)" : " (Give the exact value, e.g. sqrt(13), or a decimal.)"}`, answer: ans, accept: accepts, hint: isPerfect ? `$${r} \\cdot ${r} = ${s}$.` : `${s} is not a perfect square — leave it under the radical.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$|${fmtC(a, b)}| = \\sqrt{(${a})^2 + (${b})^2} = \\sqrt{${s}}${isPerfect ? ` = ${r}` : ` \\approx ${rnd(r, 3)}`}$ — the Pythagorean distance from 0.`,
  };
};
fill["a2f-complex-plane-3"] = (rng, idx) => {
  // Quadratic built from the root s + ti so the complex roots are exact:
  // x^2 - 2s x + (s^2 + t^2) = 0 has roots s ± ti.
  const s = nz(rng, -4, 4);
  const t = rng.int(1, 4);
  const B = -2 * s, C = s * s + t * t;
  const quadStr = fmtPoly([1, B, C]);
  const disc = -4 * t * t;
  return {
    id: `gen.a2f-complex-plane-3.${idx}`, generated: true, concepts: ["complex-plane-and-quadratics"], difficulty: 3, context: "abstract",
    prompt: `Solve $${quadStr} = 0$ using the quadratic formula. The solutions are complex.`,
    steps: [
      { instruction: `Compute the discriminant $b^2 - 4ac = (${B})^2 - 4(1)(${C})$. (Give a number.)`, answer: `${disc}`, accept: [], hint: `$${B * B} - ${4 * C}$.` },
      { instruction: `Write $\\sqrt{${disc}}$ using $i$.`, answer: `${2 * t}i`, accept: [`${2 * t}*i`], hint: `$\\sqrt{${-disc}} = ${2 * t}$, and the negative contributes $i$.` },
      { instruction: `Apply the formula with the plus sign: $x = \\dfrac{${-B} + ${2 * t}i}{2}$. Give this root in $a + bi$ form.`, answer: fmtC(s, t), accept: [], hint: `$${-B}/2 = ${s}$ and $${2 * t}/2 = ${t}$.` },
      { instruction: `The other root is its complex conjugate. Write it in $a + bi$ form.`, answer: fmtC(s, -t), accept: [], hint: `Flip the sign of the imaginary part of $${fmtC(s, t)}$.` },
    ],
    finalAnswer: { value: `${fmtC(s, t)} and ${fmtC(s, -t)}`, unit: "" },
    solutionNarrative: `The discriminant is $${disc} < 0$, so the roots are complex: $x = \\dfrac{${-B} \\pm ${2 * t}i}{2} = ${fmtC(s, t)}$ and $${fmtC(s, -t)}$ — a conjugate pair, as always for real coefficients.`,
  };
};

// ===========================================================================
// TOPIC 2: algebra-2.polynomial-functions
//   concepts: end-behavior, zeros-and-multiplicity,
//             factored-and-expanded-forms, evaluating-and-remainder-theorem
// ===========================================================================

// --- end-behavior ---
fill["a2f-end-behavior-1"] = (rng, idx) => {
  const n = rng.int(2, 5);
  const a = nz(rng, -5, 5);
  const term = `${a === 1 ? "" : a === -1 ? "-" : a}x^${n}`;
  const parity = n % 2 === 0 ? "even" : "odd";
  const sign = a > 0 ? "positive" : "negative";
  const right = a > 0 ? "rises" : "falls";
  return {
    id: `gen.a2f-end-behavior-1.${idx}`, generated: true, concepts: ["end-behavior"], difficulty: 1, context: "abstract",
    prompt: `Consider $f(x) = ${term}$. Use the leading term test to describe its end behavior.`,
    steps: [
      { instruction: `Is the degree ${n} even or odd? (Answer 'even' or 'odd'.)`, answer: parity, accept: [], hint: `Even numbers are divisible by 2.` },
      { instruction: `Is the leading coefficient ${a} positive or negative? (Answer 'positive' or 'negative'.)`, answer: sign, accept: [a > 0 ? "pos" : "neg"], hint: `Look at its sign.` },
      { instruction: `As $x \\to +\\infty$ (far right), does the graph rise or fall? (Answer 'rises' or 'falls'.)`, answer: right, accept: right === "rises" ? RISE_OK : FALL_OK, hint: `For large positive $x$, $${term}$ has the sign of ${a}.` },
    ],
    finalAnswer: { value: right, unit: "on the right" },
    solutionNarrative: `The degree is ${parity} and the leading coefficient is ${sign}, so on the right the graph ${right}${parity === "even" ? ` (and the left matches, since even degree makes both ends agree)` : ` (and the left does the opposite, since odd degree makes the ends disagree)`}.`,
  };
};
fill["a2f-end-behavior-2"] = (rng, idx) => {
  const n = rng.int(3, 5);
  const a = nz(rng, -4, 4);
  const c = nz(rng, -6, 6);
  const e = nz(rng, -9, 9);
  const coeffs = [a, ...Array(n - 2).fill(0), c, e]; // a x^n + c x + e
  const fStr = fmtPoly(coeffs);
  const leadTerm = `${a === 1 ? "" : a === -1 ? "-" : a}x^${n}`;
  const right = a > 0 ? "rises" : "falls";
  const left = n % 2 === 0 ? right : (a > 0 ? "falls" : "rises");
  return {
    id: `gen.a2f-end-behavior-2.${idx}`, generated: true, concepts: ["end-behavior"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = ${fStr}$, identify the leading term and use it to describe both ends of the graph.`,
    steps: [
      { instruction: `What is the leading term (the term with the highest power)?`, answer: leadTerm, accept: [], hint: `The $x^{${n}}$ term dominates for large $|x|$.` },
      { instruction: `What is the degree of $f$? (Give a whole number.)`, answer: `${n}`, accept: [], hint: `The highest exponent.` },
      { instruction: `As $x \\to -\\infty$ (far left), does the graph rise or fall? (Answer 'rises' or 'falls'.)`, answer: left, accept: left === "rises" ? RISE_OK : FALL_OK, hint: n % 2 === 0 ? `Even degree: both ends match the sign of ${a}.` : `Odd degree: the left end does the OPPOSITE of the right end.` },
      { instruction: `As $x \\to +\\infty$ (far right), does the graph rise or fall? (Answer 'rises' or 'falls'.)`, answer: right, accept: right === "rises" ? RISE_OK : FALL_OK, hint: `For large positive $x$, the sign of $${leadTerm}$ is the sign of ${a}.` },
    ],
    finalAnswer: { value: `${left} left, ${right} right`, unit: "" },
    solutionNarrative: `Only the leading term $${leadTerm}$ matters at the extremes. Degree ${n} (${n % 2 === 0 ? "even" : "odd"}) with leading coefficient ${a} means the graph ${left} on the left and ${right} on the right.`,
  };
};
fill["a2f-end-behavior-3"] = (rng, idx) => {
  const a = rng.pick([2, 3, -2, -3]);
  let r1, r2;
  do { r1 = nz(rng, -5, 5); r2 = nz(rng, -5, 5); } while (r1 === r2);
  const [m1, m2] = rng.pick([[2, 1], [1, 2], [2, 2], [3, 1]]);
  const deg = m1 + m2;
  const fStr = `${a}${fmtFactor(r1)}${m1 > 1 ? `^${m1}` : ""}${fmtFactor(r2)}${m2 > 1 ? `^${m2}` : ""}`;
  const right = a > 0 ? "rises" : "falls";
  const left = deg % 2 === 0 ? right : (a > 0 ? "falls" : "rises");
  return {
    id: `gen.a2f-end-behavior-3.${idx}`, generated: true, concepts: ["end-behavior"], difficulty: 3, context: "abstract",
    prompt: `The polynomial $f(x) = ${fStr}$ is given in factored form. Determine its degree, leading coefficient, and end behavior WITHOUT expanding.`,
    steps: [
      { instruction: `What is the degree? (Add the multiplicities of the factors. Give a whole number.)`, answer: `${deg}`, accept: [], hint: `$${m1} + ${m2}$.` },
      { instruction: `What is the leading coefficient? (Give a number.)`, answer: `${a}`, accept: [], hint: `Each factor contributes leading term $x$; the constant out front scales it.` },
      { instruction: `As $x \\to -\\infty$, does the graph rise or fall? (Answer 'rises' or 'falls'.)`, answer: left, accept: left === "rises" ? RISE_OK : FALL_OK, hint: deg % 2 === 0 ? `Even degree: both ends match the sign of ${a}.` : `Odd degree: the ends point opposite ways.` },
      { instruction: `As $x \\to +\\infty$, does the graph rise or fall? (Answer 'rises' or 'falls'.)`, answer: right, accept: right === "rises" ? RISE_OK : FALL_OK, hint: `The sign of the leading coefficient ${a} decides the right end.` },
    ],
    finalAnswer: { value: `${left} left, ${right} right`, unit: "" },
    solutionNarrative: `The leading term is $${a}x^{${deg}}$ (multiplicities add: $${m1} + ${m2} = ${deg}$), so the graph ${left} on the left and ${right} on the right.`,
  };
};

// --- zeros-and-multiplicity ---
fill["a2f-zeros-mult-1"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -8, 8); q = nz(rng, -8, 8); } while (p === q);
  const fStr = `${fmtFactor(p)}${fmtFactor(q)}`;
  const yInt = p * q; // (0 - p)(0 - q)
  return {
    id: `gen.a2f-zeros-mult-1.${idx}`, generated: true, concepts: ["zeros-and-multiplicity"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = ${fStr}$, find the zeros and the y-intercept.`,
    steps: [
      { instruction: `Set each factor equal to zero and solve. Give both zeros (e.g. "x = 1 or x = 2").`, answer: `x = ${p} or x = ${q}`, accept: [`${p}, ${q}`], form: "solutions", hint: `Each factor $(x - r)$ vanishes at $x = r$; watch the sign inside.` },
      { instruction: `Find the y-intercept by evaluating $f(0)$. (Give a number.)`, answer: `${yInt}`, accept: [], hint: `$(0 - ${p})(0 - ${q}) = (${-p})(${-q})$.` },
    ],
    finalAnswer: { value: `x = ${p} or x = ${q}`, unit: "" },
    solutionNarrative: `The zeros are where a factor vanishes: $x = ${p}$ and $x = ${q}$. Substituting $x = 0$ gives the y-intercept $(${-p})(${-q}) = ${yInt}$.`,
  };
};
fill["a2f-zeros-mult-2"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -6, 6); q = nz(rng, -6, 6); } while (p === q);
  const fStr = `${fmtFactor(p)}^2${fmtFactor(q)}`;
  return {
    id: `gen.a2f-zeros-mult-2.${idx}`, generated: true, concepts: ["zeros-and-multiplicity"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = ${fStr}$, find the zeros with their multiplicities and describe how the graph meets the x-axis at each.`,
    steps: [
      { instruction: `Give the distinct zeros (e.g. "x = 1 or x = 2").`, answer: `x = ${p} or x = ${q}`, accept: [`${p}, ${q}`], form: "solutions", hint: `One zero from each distinct factor.` },
      { instruction: `What is the multiplicity of the zero $x = ${p}$? (Give a whole number.)`, answer: "2", accept: [], hint: `The exponent on its factor.` },
      { instruction: `At $x = ${p}$, does the graph cross the axis or just touch it and turn around? (Answer 'crosses' or 'touches'.)`, answer: "touches", accept: ["touch", "bounces", "bounce", "touches and turns around"], hint: `EVEN multiplicity means the graph does not change sign there.` },
      { instruction: `At $x = ${q}$ (multiplicity 1), does the graph cross or touch? (Answer 'crosses' or 'touches'.)`, answer: "crosses", accept: ["cross", "crosses through", "passes through"], hint: `ODD multiplicity means the sign flips, so the graph goes through.` },
    ],
    finalAnswer: { value: "touches", unit: `at x = ${p}` },
    solutionNarrative: `Zeros: $x = ${p}$ (multiplicity 2) and $x = ${q}$ (multiplicity 1). Even multiplicity means the graph touches and bounces at $${p}$; odd multiplicity means it crosses at $${q}$.`,
  };
};
fill["a2f-zeros-mult-3"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -6, 6); q = nz(rng, -6, 6); } while (p === q);
  const fStr = `x${fmtFactor(p)}^2${fmtFactor(q)}`;
  return {
    id: `gen.a2f-zeros-mult-3.${idx}`, generated: true, concepts: ["zeros-and-multiplicity"], difficulty: 3, context: "abstract",
    prompt: `Analyze $f(x) = ${fStr}$: degree, all zeros with multiplicity, and end behavior.`,
    steps: [
      { instruction: `What is the degree of $f$? (Add all the multiplicities. Give a whole number.)`, answer: "4", accept: [], hint: `$1 + 2 + 1$.` },
      { instruction: `Give all distinct zeros (e.g. "x = 0 or x = 1 or x = 2").`, answer: `x = 0 or x = ${p} or x = ${q}`, accept: [`0, ${p}, ${q}`], form: "solutions", hint: `Don't forget the lone factor $x$ vanishes at 0.` },
      { instruction: `What is the multiplicity of the zero $x = ${p}$? (Give a whole number.)`, answer: "2", accept: [], hint: `The exponent on $${fmtFactor(p)}$.` },
      { instruction: `Degree 4 (even) with leading coefficient 1 (positive): do BOTH ends of the graph rise or fall? (Answer 'rise' or 'fall'.)`, answer: "rise", accept: ["rises", "up", "both rise", "rise on both ends"], hint: `Even degree, positive lead: up on both sides.` },
    ],
    finalAnswer: { value: `x = 0 or x = ${p} or x = ${q}`, unit: "" },
    solutionNarrative: `The zeros are $0$, $${p}$ (multiplicity 2, so the graph bounces there), and $${q}$. The leading term is $x^4$, so both ends rise.`,
  };
};

// --- factored-and-expanded-forms ---
fill["a2f-poly-forms-1"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -6, 6); q = nz(rng, -6, 6); } while (p === q || p + q === 0);
  const factored = `${fmtFactor(p)}${fmtFactor(q)}`;
  const expanded = fmtPoly([1, -(p + q), p * q]);
  return {
    id: `gen.a2f-poly-forms-1.${idx}`, generated: true, concepts: ["factored-and-expanded-forms"], difficulty: 1, context: "abstract",
    prompt: `A quadratic with leading coefficient 1 has zeros $x = ${p}$ and $x = ${q}$. Write it in factored form, then expand.`,
    steps: [
      { instruction: `Write the factored form (a product of two linear factors).`, answer: factored, accept: [], form: "factored", hint: `A zero at $x = r$ gives the factor $(x - r)$ — flip the sign of the zero.` },
      { instruction: `Expand the product into $x^2 + bx + c$ form.`, answer: expanded, accept: [], hint: `FOIL: the middle coefficient is $-(${p} + ${q > 0 ? q : `(${q})`})$, the constant is $(${-p})(${-q})$.` },
    ],
    finalAnswer: { value: expanded, unit: "" },
    solutionNarrative: `Zeros ${p} and ${q} give factors $${fmtFactor(p)}$ and $${fmtFactor(q)}$. Expanding: $${expanded}$ — sum of zeros with a minus in the middle, product of zeros at the end.`,
  };
};
fill["a2f-poly-forms-2"] = (rng, idx) => {
  const a = rng.pick([2, 3, 4, -2, -3]);
  let p, q;
  do { p = nz(rng, -6, 6); q = nz(rng, -6, 6); } while (p === q || p + q === 0);
  const inner = fmtPoly([1, -(p + q), p * q]);
  const full = fmtPoly([a, -a * (p + q), a * p * q]);
  return {
    id: `gen.a2f-poly-forms-2.${idx}`, generated: true, concepts: ["factored-and-expanded-forms"], difficulty: 2, context: "abstract",
    prompt: `Expand $f(x) = ${a}${fmtFactor(p)}${fmtFactor(q)}$ into standard form. Expand the binomials first, then distribute the ${a}.`,
    steps: [
      { instruction: `Expand $${fmtFactor(p)}${fmtFactor(q)}$ first.`, answer: inner, accept: [], hint: `FOIL: $x^2 - (\\text{sum})x + (\\text{product})$ where the zeros are ${p} and ${q}.` },
      { instruction: `Now multiply every term by ${a}. Give the expanded standard form.`, answer: full, accept: [], hint: `Distribute ${a} across all three terms.` },
    ],
    finalAnswer: { value: full, unit: "" },
    solutionNarrative: `$${fmtFactor(p)}${fmtFactor(q)} = ${inner}$, and scaling by ${a} gives $${full}$. The zeros don't move when you scale — only the vertical stretch changes.`,
  };
};
fill["a2f-poly-forms-3"] = (rng, idx) => {
  const a = rng.pick([2, 3, -2]);
  let p, q;
  do { p = nz(rng, -4, 4); q = nz(rng, -4, 4); } while (p === q || 2 * p + q === 0 || p + 2 * q === 0);
  const factored = `${a}${fmtFactor(p)}^2${fmtFactor(q)}`;
  const sq = fmtPoly([1, -2 * p, p * p]);
  const full = fmtPoly([a, -a * (2 * p + q), a * (p * p + 2 * p * q), -a * p * p * q]);
  return {
    id: `gen.a2f-poly-forms-3.${idx}`, generated: true, concepts: ["factored-and-expanded-forms"], difficulty: 3, context: "abstract",
    prompt: `A cubic has leading coefficient ${a}, a zero at $x = ${p}$ with multiplicity 2, and a zero at $x = ${q}$. Write its factored form, then expand it completely.`,
    steps: [
      { instruction: `Write the factored form (include the leading coefficient and the squared factor).`, answer: factored, accept: [], form: "factored", hint: `Multiplicity 2 means the factor $${fmtFactor(p)}$ is squared.` },
      { instruction: `Expand the squared factor $${fmtFactor(p)}^2$ first.`, answer: sq, accept: [], hint: `$(x - r)^2 = x^2 - 2rx + r^2$ with $r = ${p}$.` },
      { instruction: `Multiply by $${fmtFactor(q)}$ and by ${a}. Give the fully expanded cubic.`, answer: full, accept: [], hint: `First $(${sq})${fmtFactor(q)}$, then distribute ${a} over all four terms.` },
    ],
    finalAnswer: { value: full, unit: "" },
    solutionNarrative: `Factored: $${factored}$. Expanding step by step: $${fmtFactor(p)}^2 = ${sq}$, then multiplying by $${fmtFactor(q)}$ and scaling by ${a} gives $${full}$.`,
  };
};

// --- evaluating-and-remainder-theorem ---
fill["a2f-remainder-thm-1"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = nz(rng, -6, 6), c = nz(rng, -9, 9), k = nz(rng, -4, 4);
  const fStr = fmtPoly([a, b, c]);
  const fk = a * k * k + b * k + c;
  return {
    id: `gen.a2f-remainder-thm-1.${idx}`, generated: true, concepts: ["evaluating-and-remainder-theorem"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $f(x) = ${fStr}$ at $x = ${k}$.`,
    steps: [
      { instruction: `First compute $x^2$ at $x = ${k}$. (Give a number.)`, answer: `${k * k}`, accept: [], hint: `$(${k})^2$ — a square is never negative.` },
      { instruction: `Now compute $f(${k}) = ${a}(${k * k}) + (${b})(${k}) + (${c})$. (Give a number.)`, answer: `${fk}`, accept: [], hint: `$${a * k * k} + ${b * k > 0 ? b * k : `(${b * k})`} + ${c > 0 ? c : `(${c})`}$.` },
    ],
    finalAnswer: { value: `${fk}`, unit: "" },
    solutionNarrative: `Substitute and follow order of operations: $f(${k}) = ${a}(${k * k}) + (${b * k}) + (${c}) = ${fk}$.`,
  };
};
fill["a2f-remainder-thm-2"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = nz(rng, -6, 6), c = nz(rng, -9, 9), k = nz(rng, -4, 4);
  const fStr = fmtPoly([a, b, c]);
  const divisor = k > 0 ? `(x - ${k})` : `(x + ${-k})`;
  const rem = a * k * k + b * k + c;
  return {
    id: `gen.a2f-remainder-thm-2.${idx}`, generated: true, concepts: ["evaluating-and-remainder-theorem"], difficulty: 2, context: "abstract",
    prompt: `Use the remainder theorem to find the remainder when $f(x) = ${fStr}$ is divided by $${divisor}$ — no long division needed.`,
    steps: [
      { instruction: `The remainder theorem says the remainder on division by $(x - k)$ is $f(k)$. For the divisor $${divisor}$, what is $k$? (Give a number — watch the sign.)`, answer: `${k}`, accept: [], hint: k < 0 ? `$(x + ${-k})$ is $(x - (${k}))$, so $k = ${k}$.` : `Match $${divisor}$ to $(x - k)$.` },
      { instruction: `Evaluate $f(${k}) = ${a}(${k})^2 + (${b})(${k}) + (${c})$. (Give a number.)`, answer: `${rem}`, accept: [], hint: `$${a * k * k} + ${b * k > 0 ? b * k : `(${b * k})`} + ${c > 0 ? c : `(${c})`}$.` },
    ],
    finalAnswer: { value: `${rem}`, unit: "" },
    solutionNarrative: `By the remainder theorem the remainder equals $f(${k}) = ${rem}$${rem === 0 ? ` — a zero remainder, so $${divisor}$ is a factor of $f$` : ""}. One substitution replaces the whole division.`,
  };
};
fill["a2f-remainder-thm-3"] = (rng, idx) => {
  let b, c, d, k, q1, q0;
  do {
    b = nz(rng, -6, 6); c = nz(rng, -6, 6); d = nz(rng, -6, 6); k = nz(rng, -3, 3);
    q1 = b + k; q0 = c + k * q1;
  } while (q1 === 0 || q0 === 0); // keep every quotient term present
  const rem = d + k * q0;
  const fStr = fmtPoly([1, b, c, d]);
  const divisor = k > 0 ? `(x - ${k})` : `(x + ${-k})`;
  const quot = fmtPoly([1, q1, q0]);
  return {
    id: `gen.a2f-remainder-thm-3.${idx}`, generated: true, concepts: ["evaluating-and-remainder-theorem"], difficulty: 3, context: "abstract",
    prompt: `Use synthetic division to divide $f(x) = ${fStr}$ by $${divisor}$. Write the coefficients $1, ${b}, ${c}, ${d}$ in a row and use $k = ${k}$: bring down the 1, then repeatedly multiply by ${k} and add.`,
    steps: [
      { instruction: `Bring down the leading 1, multiply by ${k}, and add to ${b}. What is the second bottom-row number? (Give a number.)`, answer: `${q1}`, accept: [], hint: `$${b} + (1)(${k})$.` },
      { instruction: `Multiply that result by ${k} and add to ${c}. What is the third bottom-row number? (Give a number.)`, answer: `${q0}`, accept: [], hint: `$${c} + (${q1})(${k})$.` },
      { instruction: `Multiply again by ${k} and add to ${d}. This last number is the remainder. (Give a number.)`, answer: `${rem}`, accept: [], hint: `$${d} + (${q0})(${k})$.` },
      { instruction: `The other bottom-row numbers are the quotient's coefficients (one degree lower). Write the quotient polynomial.`, answer: quot, accept: [], hint: `Coefficients $1, ${q1}, ${q0}$ give a quadratic.` },
    ],
    finalAnswer: { value: `${rem}`, unit: "remainder" },
    solutionNarrative: `Synthetic division with $k = ${k}$ gives bottom row $1, ${q1}, ${q0}, ${rem}$: quotient $${quot}$ and remainder $${rem}$. Check: the remainder theorem agrees, since $f(${k}) = ${rem}$${rem === 0 ? `, so $${divisor}$ is a factor` : ""}.`,
  };
};
