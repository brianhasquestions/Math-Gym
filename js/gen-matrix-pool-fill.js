// gen-matrix-pool-fill.js
// Parametric generators eliminating the 28 thin concept x difficulty pools in
// the Matrix Algebra subject (pools that had exactly one seed problem and no
// template at that tier). Self-contained pack: exports a `fill` map of
// template-name -> (rng, idx) => problem, same shape as gen-linalg-fill.js.
// Template prefix: mpl-. One template per thin pool; concept list and
// difficulty are FIXED per template so the engine's single-probe index works.

// --- helpers ---------------------------------------------------------------
const bmat = (m) => `\\begin{bmatrix} ${m.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;
const vmat = (m) => `\\begin{vmatrix} ${m.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{vmatrix}`;
const rows = (m) => `[[${m.map((r) => r.join(", ")).join("], [")}]]`;
const vec = (v) => `(${v.join(", ")})`;
const mul2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const apply2 = (A, v) => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
const tenth = (t) => `0.${t}`; // t in 1..9 -> "0.3" etc.

export const fill = {};

// ============================================================================
// determinants.json
// ============================================================================

// determinant-2x2 d2: signed 2x2 determinant with a negative entry.
fill["mpl-det2x2-d2"] = (rng, idx) => {
  const a = rng.int(-6, -2), b = rng.int(2, 6), c = rng.int(2, 6), d = rng.int(1, 5);
  const det = a * d - b * c;
  return {
    id: `gen.mpl-det2x2-d2.${idx}`, generated: true, concepts: ["determinant-2x2"], difficulty: 2, context: "abstract",
    prompt: `Compute the determinant: $${vmat([[a, b], [c, d]])}$`,
    steps: [
      { instruction: "Compute the main-diagonal product $ad$, watching the sign.", answer: `${a * d}`, accept: [], hint: `$(${a})(${d})$.` },
      { instruction: "Compute the anti-diagonal product $bc$.", answer: `${b * c}`, accept: [], hint: `$(${b})(${c})$.` },
      { instruction: "Compute $\\det = ad - bc$.", answer: `${det}`, accept: [], hint: `$${a * d} - ${b * c}$ — subtracting a positive makes it more negative.` },
    ],
    finalAnswer: { value: `${det}`, unit: "" },
    solutionNarrative: `$\\det = (${a})(${d}) - (${b})(${c}) = ${a * d} - ${b * c} = ${det}$.`,
  };
};

// determinant-2x2 d3: applied area scaling — det, |det|, then the new area.
const AREA_CTX = [
  { thing: "logo", app: "design app" },
  { thing: "sprite", app: "game engine" },
  { thing: "decal", app: "drawing program" },
  { thing: "floor plan", app: "CAD tool" },
];
fill["mpl-det2x2-d3"] = (rng, idx) => {
  const ctx = rng.pick(AREA_CTX);
  const a = rng.int(2, 5), d = rng.int(2, 5), b = rng.int(1, 4);
  let c = rng.int(1, 4);
  if (a * d - b * c === 0) c = c === 4 ? 3 : c + 1; // keep the transform non-singular
  const det = a * d - b * c;
  const S = rng.int(3, 8);
  const newA = Math.abs(det) * S;
  return {
    id: `gen.mpl-det2x2-d3.${idx}`, generated: true, concepts: ["determinant-2x2"], difficulty: 3, context: "applied",
    prompt: `A 2D transform in a ${ctx.app} is $${bmat([[a, b], [c, d]])}$. A ${ctx.thing} currently covers ${S} square units. Use the determinant to find the ${ctx.thing}'s area after the transform.`,
    steps: [
      { instruction: "Compute the determinant of the transform.", answer: `${det}`, accept: [], hint: `$(${a})(${d}) - (${b})(${c}) = ${a * d} - ${b * c}$.` },
      { instruction: "The area-scaling factor is the absolute value of the determinant. State it.", answer: `${Math.abs(det)}`, accept: [], hint: `$|${det}| = ${Math.abs(det)}$.` },
      { instruction: `Multiply the old area by that factor to get the new area.`, answer: `${newA}`, accept: [], hint: `$${Math.abs(det)} \\times ${S}$.` },
    ],
    finalAnswer: { value: `${newA}`, unit: "square units" },
    solutionNarrative: `$\\det = ${a * d} - ${b * c} = ${det}$, so every area scales by $|${det}| = ${Math.abs(det)}$. The new area is $${Math.abs(det)} \\times ${S} = ${newA}$ square units.`,
  };
};

// determinant-3x3 d1: lower-triangular 3x3 — top-row expansion, one surviving term.
fill["mpl-det3x3-d1"] = (rng, idx) => {
  const d1 = rng.int(2, 5), d2 = rng.int(2, 5), d3 = rng.int(2, 5);
  const e = rng.int(1, 4), f = rng.int(1, 4), g = rng.int(1, 4);
  const det = d1 * d2 * d3;
  return {
    id: `gen.mpl-det3x3-d1.${idx}`, generated: true, concepts: ["determinant-3x3"], difficulty: 1, context: "abstract",
    prompt: `Compute the determinant $${vmat([[d1, 0, 0], [e, d2, 0], [f, g, d3]])}$ by cofactor expansion along the top row.`,
    steps: [
      { instruction: `Expanding along the top row, only the first term survives. Compute the minor $${vmat([[d2, 0], [g, d3]])}$.`, answer: `${d2 * d3}`, accept: [], hint: `$(${d2})(${d3}) - (0)(${g})$.` },
      { instruction: `Multiply the minor by the top-left entry ${d1} to get the determinant.`, answer: `${det}`, accept: [], hint: `$${d1} \\times ${d2 * d3}$.` },
    ],
    finalAnswer: { value: `${det}`, unit: "" },
    solutionNarrative: `The top row is $[${d1}, 0, 0]$, so only the first cofactor survives: $\\det = ${d1} \\times \\left[(${d2})(${d3}) - 0\\right] = ${det}$ — the product of the diagonal.`,
  };
};

// determinant-and-invertibility d1: compute det, then a yes/no invertibility call.
fill["mpl-det-invert-d1"] = (rng, idx) => {
  const singular = rng.int(0, 1) === 0;
  let M, det;
  if (singular) {
    const a = rng.int(1, 4), b = rng.int(1, 4);
    M = [[a, b], [2 * a, 2 * b]];
    det = 0;
  } else {
    const a = rng.int(2, 6), b = rng.int(1, 5), c = rng.int(1, 5);
    let d = rng.int(2, 6);
    if (a * d === b * c) d += 1; // shift by a nonzero amount, det becomes a != 0
    M = [[a, b], [c, d]];
    det = a * d - b * c;
  }
  return {
    id: `gen.mpl-det-invert-d1.${idx}`, generated: true, concepts: ["determinant-and-invertibility"], difficulty: 1, context: "abstract",
    prompt: `Is the matrix $${bmat(M)}$ invertible? Compute its determinant and answer 'yes' or 'no'.`,
    steps: [
      { instruction: "Compute the determinant.", answer: `${det}`, accept: [], hint: `$(${M[0][0]})(${M[1][1]}) - (${M[0][1]})(${M[1][0]})$.` },
      { instruction: `The determinant is ${det === 0 ? "zero" : "nonzero"}. Is the matrix invertible? Answer 'yes' or 'no'.`, answer: det === 0 ? "no" : "yes", accept: det === 0 ? ["n", "singular"] : ["y", "invertible"], hint: "Invertible exactly when the determinant is nonzero." },
    ],
    finalAnswer: { value: det === 0 ? "no" : "yes", unit: "" },
    solutionNarrative: `$\\det = (${M[0][0]})(${M[1][1]}) - (${M[0][1]})(${M[1][0]}) = ${det}$, so the matrix is ${det === 0 ? "singular — row 2 is twice row 1, no inverse exists" : "invertible"}.`,
  };
};

// determinant-applied d3: parallelepiped volume via a triangular 3x3.
const BOX_CTX = ["box (parallelepiped)", "shipping crate (parallelepiped)", "crystal cell (parallelepiped)", "storage bin (parallelepiped)"];
fill["mpl-det-applied-d3"] = (rng, idx) => {
  const thing = rng.pick(BOX_CTX);
  const a = rng.int(2, 5), b = rng.int(2, 5), c = rng.int(2, 5);
  const p = rng.int(0, 3), q = rng.int(0, 3), r = rng.int(0, 3);
  const vol = a * b * c;
  return {
    id: `gen.mpl-det-applied-d3.${idx}`, generated: true, concepts: ["determinant-applied"], difficulty: 3, context: "applied",
    prompt: `A ${thing} is spanned by the vectors $(${a},0,0)$, $(${p},${b},0)$, and $(${q},${r},${c})$. Find its volume using the determinant.`,
    steps: [
      { instruction: `Form the matrix with these as columns and expand along the top row: $${vmat([[a, p, q], [0, b, r], [0, 0, c]])}$. Compute the first minor $${vmat([[b, r], [0, c]])}$.`, answer: `${b * c}`, accept: [], hint: `$(${b})(${c}) - (${r})(0)$.` },
      { instruction: `The entries below ${a} in column 1 are 0, so only the first term survives. Compute $\\det = ${a} \\times ${b * c}$.`, answer: `${vol}`, accept: [], hint: `$${a} \\times ${b * c} = ${vol}$.` },
      { instruction: "Volume is the absolute value of the determinant. State the volume.", answer: `${vol}`, accept: [], hint: `$|${vol}| = ${vol}$.` },
    ],
    finalAnswer: { value: `${vol}`, unit: "cubic units" },
    solutionNarrative: `The matrix is triangular in effect: $\\det = ${a} \\times (${b})(${c}) = ${vol}$, so the volume is $|${vol}| = ${vol}$ cubic units.`,
  };
};

// ============================================================================
// matrix-inverses.json
// ============================================================================

// invertibility-test d2: det with a negative entry, classify invertible/singular.
fill["mpl-invert-test-d2"] = (rng, idx) => {
  const singular = rng.int(0, 1) === 0;
  let M, det;
  if (singular) {
    const k = rng.int(2, 3), a = rng.int(1, 4), b = rng.int(1, 4);
    M = [[a, b], [k * a, k * b]];
    det = 0;
  } else {
    const a = rng.int(2, 6), b = rng.int(-5, -1), c = rng.int(1, 5), d = rng.int(1, 5);
    M = [[a, b], [c, d]];
    det = a * d - b * c; // ad + |b|c > 0, never zero
  }
  return {
    id: `gen.mpl-invert-test-d2.${idx}`, generated: true, concepts: ["invertibility-test"], difficulty: 2, context: "abstract",
    prompt: `For $A = ${bmat(M)}$, find the determinant and decide whether $A$ is singular or invertible.`,
    steps: [
      { instruction: "Compute the determinant $ad - bc$, watching the signs.", answer: `${det}`, accept: [], hint: `$(${M[0][0]})(${M[1][1]}) - (${M[0][1]})(${M[1][0]})$.` },
      { instruction: "Is $A$ 'invertible' or 'singular'?", answer: det === 0 ? "singular" : "invertible", accept: det === 0 ? ["not invertible", "noninvertible", "no"] : ["nonsingular", "yes"], hint: det === 0 ? "A zero determinant means no inverse — singular." : "A nonzero determinant means an inverse exists." },
    ],
    finalAnswer: { value: det === 0 ? "singular" : "invertible", unit: "" },
    solutionNarrative: `$\\det = (${M[0][0]})(${M[1][1]}) - (${M[0][1]})(${M[1][0]}) = ${det}$, so $A$ is ${det === 0 ? "singular (one row is a multiple of the other)" : "invertible"}.`,
  };
};

// inverse-2x2 d1: det = 1 by construction, so the inverse has integer entries.
fill["mpl-inverse2x2-d1"] = (rng, idx) => {
  const a = rng.int(2, 5), d = rng.int(2, 5);
  const b = a * d - 1; // det = ad - b*1 = 1
  const inv = [[d, 1 - a * d], [-1, a]];
  return {
    id: `gen.mpl-inverse2x2-d1.${idx}`, generated: true, concepts: ["inverse-2x2"], difficulty: 1, context: "abstract",
    prompt: `Find the inverse of $A = ${bmat([[a, b], [1, d]])}$.`,
    steps: [
      { instruction: "Compute the determinant $ad - bc$.", answer: "1", accept: [], hint: `$(${a})(${d}) - (${b})(1) = ${a * d} - ${b}$.` },
      { instruction: "Swap the diagonal, negate the off-diagonal, and divide by the determinant. Enter the inverse as [[a, b], [c, d]].", answer: rows(inv), accept: [], hint: `$\\frac{1}{1}${bmat(inv)}$.` },
    ],
    finalAnswer: { value: rows(inv), unit: "" },
    solutionNarrative: `$\\det = ${a * d} - ${b} = 1$, so $A^{-1} = ${bmat(inv)}$. Check: $A A^{-1} = I$.`,
  };
};

// solve-with-inverse d1: A^{-1} given — just multiply it by b.
fill["mpl-solve-inverse-d1"] = (rng, idx) => {
  const inv = [[rng.int(1, 3), rng.int(-3, -1)], [rng.int(-3, -1), rng.int(1, 3)]];
  const b = [rng.int(2, 6), rng.int(2, 6)];
  const x = apply2(inv, b);
  return {
    id: `gen.mpl-solve-inverse-d1.${idx}`, generated: true, concepts: ["solve-with-inverse"], difficulty: 1, context: "abstract",
    prompt: `Given $A^{-1} = ${bmat(inv)}$ and $\\mathbf{b} = ${bmat([[b[0]], [b[1]]])}$, solve $A\\mathbf{x} = \\mathbf{b}$ by computing $\\mathbf{x} = A^{-1}\\mathbf{b}$.`,
    steps: [
      { instruction: `Compute the top entry: $${inv[0][0]}\\cdot${b[0]} + (${inv[0][1]})\\cdot${b[1]}$.`, answer: `${x[0]}`, accept: [], hint: `$${inv[0][0] * b[0]} + (${inv[0][1] * b[1]})$.` },
      { instruction: `Compute the bottom entry: $${inv[1][0]}\\cdot${b[0]} + ${inv[1][1]}\\cdot${b[1]}$.`, answer: `${x[1]}`, accept: [], hint: `$${inv[1][0] * b[0]} + ${inv[1][1] * b[1]}$.` },
      { instruction: "Enter the solution as <x, y>.", answer: `<${x[0]}, ${x[1]}>`, accept: [vec(x)], hint: "Stack the two entries you found." },
    ],
    finalAnswer: { value: `<${x[0]}, ${x[1]}>`, unit: "" },
    solutionNarrative: `$\\mathbf{x} = A^{-1}\\mathbf{b} = \\langle ${x[0]}, ${x[1]} \\rangle$ — multiplying by the inverse solves the system in one step.`,
  };
};

// inverse-applied d1: given decoding/undo matrix, apply it to recover a vector.
const UNDO_CTX = [
  { lead: "A message was encoded by multiplying by $A$. The decoding matrix is", got: "You receive the coded pair", ask: "Decode it", recovered: "original message" },
  { lead: "A graphics tool moved a point by multiplying by $A$. The undo matrix is", got: "The point is now at", ask: "Undo the move", recovered: "original point" },
];
fill["mpl-inv-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick(UNDO_CTX);
  const inv = [[rng.int(1, 3), rng.int(-3, -1)], [rng.int(-3, -1), rng.int(1, 3)]];
  const c = [rng.int(2, 7), rng.int(2, 7)];
  const x = apply2(inv, c);
  return {
    id: `gen.mpl-inv-applied-d1.${idx}`, generated: true, concepts: ["inverse-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.lead} $A^{-1} = ${bmat(inv)}$. ${ctx.got} $\\mathbf{c} = ${bmat([[c[0]], [c[1]]])}$. ${ctx.ask} by computing $A^{-1}\\mathbf{c}$.`,
    steps: [
      { instruction: `Compute the top entry: $${inv[0][0]}\\cdot${c[0]} + (${inv[0][1]})\\cdot${c[1]}$.`, answer: `${x[0]}`, accept: [], hint: `$${inv[0][0] * c[0]} + (${inv[0][1] * c[1]})$.` },
      { instruction: `Enter the ${ctx.recovered} as <x, y>.`, answer: `<${x[0]}, ${x[1]}>`, accept: [vec(x)], hint: `Bottom entry: $${inv[1][0]}\\cdot${c[0]} + ${inv[1][1]}\\cdot${c[1]} = ${x[1]}$.` },
    ],
    finalAnswer: { value: `<${x[0]}, ${x[1]}>`, unit: "" },
    solutionNarrative: `$A^{-1}\\mathbf{c} = \\langle ${x[0]}, ${x[1]} \\rangle$ — multiplying by the inverse undoes the original multiplication by $A$.`,
  };
};

// inverse-applied d2: find the decoding matrix for a det-1 cipher key.
const KEY_CTX = [
  { name: "Hill-cipher key", need: "decoding matrix" },
  { name: "sensor calibration matrix", need: "correction (inverse) matrix" },
];
fill["mpl-inv-applied-d2"] = (rng, idx) => {
  const ctx = rng.pick(KEY_CTX);
  const a = rng.int(2, 5), d = rng.int(2, 5);
  const b = a * d - 1; // det = 1
  const inv = [[d, 1 - a * d], [-1, a]];
  return {
    id: `gen.mpl-inv-applied-d2.${idx}`, generated: true, concepts: ["inverse-applied"], difficulty: 2, context: "applied",
    prompt: `A ${ctx.name} is $A = ${bmat([[a, b], [1, d]])}$. To reverse its effect you need the ${ctx.need} $A^{-1}$. Find it.`,
    steps: [
      { instruction: "Compute the determinant of the matrix.", answer: "1", accept: [], hint: `$(${a})(${d}) - (${b})(1) = ${a * d} - ${b}$.` },
      { instruction: `Compute the ${ctx.need} $A^{-1}$. Enter as [[a, b], [c, d]].`, answer: rows(inv), accept: [], hint: `Swap ${a} and ${d}, negate ${b} and 1, divide by 1.` },
    ],
    finalAnswer: { value: rows(inv), unit: "" },
    solutionNarrative: `$\\det = ${a * d} - ${b} = 1$, so $A^{-1} = ${bmat(inv)}$. Every block is reversed by multiplying by this matrix.`,
  };
};

// inverse-applied d3: full undo — det, inverse, then recover the original point.
const UNDO3_CTX = [
  { who: "A drawing program", did: "sheared a shape's anchor point with the transform", place: "landing it at", find: "find the original anchor point by reversing the transform" },
  { who: "A robot controller", did: "reoriented its gripper with the matrix", place: "the sensor now reads", find: "recover the gripper's original coordinates by reversing the transform" },
  { who: "An encoder", did: "scrambled a two-number message by multiplying by", place: "the transmitted pair is", find: "decode the original message by reversing the encoding" },
];
fill["mpl-inv-applied-d3"] = (rng, idx) => {
  const ctx = rng.pick(UNDO3_CTX);
  const m = rng.int(2, 4);
  const upper = rng.int(0, 1) === 0;
  const A = upper ? [[1, m], [0, 1]] : [[1, 0], [m, 1]];
  const inv = upper ? [[1, -m], [0, 1]] : [[1, 0], [-m, 1]];
  const x = [rng.int(1, 6), rng.int(1, 6)];
  const p = apply2(A, x);
  return {
    id: `gen.mpl-inv-applied-d3.${idx}`, generated: true, concepts: ["inverse-applied"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} ${ctx.did} $A = ${bmat(A)}$, ${ctx.place} $\\mathbf{p} = ${bmat([[p[0]], [p[1]]])}$. First ${ctx.find}.`,
    steps: [
      { instruction: "Compute the determinant of $A$.", answer: "1", accept: [], hint: `$(1)(1) - (${A[0][1]})(${A[1][0]})$.` },
      { instruction: "Compute the inverse $A^{-1}$. Enter as [[a, b], [c, d]].", answer: rows(inv), accept: [], hint: `Swap the diagonal (both 1), negate ${m} and 0, divide by 1.` },
      { instruction: "Apply $\\mathbf{x} = A^{-1}\\mathbf{p}$ to recover the original pair. Enter as <x, y>.", answer: `<${x[0]}, ${x[1]}>`, accept: [vec(x)], hint: `Top: $${inv[0][0]}\\cdot${p[0]} + (${inv[0][1]})\\cdot${p[1]}$. Bottom: $${inv[1][0]}\\cdot${p[0]} + ${inv[1][1]}\\cdot${p[1]}$.` },
    ],
    finalAnswer: { value: `<${x[0]}, ${x[1]}>`, unit: "" },
    solutionNarrative: `$\\det = 1$, so $A^{-1} = ${bmat(inv)}$. Then $A^{-1}\\mathbf{p} = \\langle ${x[0]}, ${x[1]} \\rangle$ — the pair before the transform.`,
  };
};

// ============================================================================
// matrix-multiplication.json
// ============================================================================

// when-defined d2: check inner dimensions; defined and undefined branches.
fill["mpl-when-defined-d2"] = (rng, idx) => {
  const defined = rng.int(0, 1) === 0;
  const m = rng.int(2, 6), n = rng.int(2, 6), q = rng.int(2, 6);
  const base = { id: `gen.mpl-when-defined-d2.${idx}`, generated: true, concepts: ["when-defined"], difficulty: 2, context: "abstract" };
  if (defined) {
    return { ...base,
      prompt: `Matrix $A$ is $${m} \\times ${n}$ and matrix $B$ is $${n} \\times ${q}$. Decide whether $AB$ is defined and give its size.`,
      steps: [
        { instruction: `Compare the inner dimensions of $(${m} \\times ${n})(${n} \\times ${q})$. Is $AB$ defined? Answer 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `The inner numbers are ${n} and ${n}.` },
        { instruction: "How many rows does $AB$ have?", answer: `${m}`, accept: [], hint: "Rows of the result match rows of $A$." },
        { instruction: "How many columns does $AB$ have?", answer: `${q}`, accept: [], hint: "Columns of the result match columns of $B$." },
      ],
      finalAnswer: { value: `${m} x ${q}`, unit: "" },
      solutionNarrative: `Inner dimensions $${n} = ${n}$ match, so $AB$ is defined; the outer dimensions give a $${m} \\times ${q}$ result.`,
    };
  }
  let p = rng.int(2, 6);
  if (p === n) p = p === 6 ? 2 : p + 1; // force a mismatch
  return { ...base,
    prompt: `Matrix $A$ is $${m} \\times ${n}$ and matrix $B$ is $${p} \\times ${q}$. Decide whether $AB$ is defined.`,
    steps: [
      { instruction: "In the product $AB$, how many columns does $A$ contribute as the inner dimension?", answer: `${n}`, accept: [], hint: "The first inner number is $A$'s column count." },
      { instruction: "How many rows does $B$ contribute as the inner dimension?", answer: `${p}`, accept: [], hint: "The second inner number is $B$'s row count." },
      { instruction: `Since ${n} and ${p} differ, is $AB$ defined? Answer 'yes' or 'no'.`, answer: "no", accept: ["n", "undefined"], hint: "The inner dimensions must be equal." },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `The inner dimensions are ${n} and ${p}, which do not match, so $AB$ is not defined.`,
  };
};

// when-defined d3: applied — which of two products is meaningful, and its size.
const DEF_CTX = [
  { t1: "sales table $S$", r1: "stores", c1: "products", t2: "price table $P$", c2: "currencies", goal: "a table of each store's total value in each currency" },
  { t1: "usage table $S$", r1: "clinics", c1: "medications", t2: "cost table $P$", c2: "suppliers", goal: "a table of each clinic's total cost from each supplier" },
  { t1: "minutes table $S$", r1: "teams", c1: "drills", t2: "benefit table $P$", c2: "skill areas", goal: "a table of each team's training benefit in each skill area" },
];
fill["mpl-when-defined-d3"] = (rng, idx) => {
  const ctx = rng.pick(DEF_CTX);
  const m = rng.int(3, 6), n = rng.int(2, 5);
  let q = rng.int(2, 4);
  if (q === m) q = q === 2 ? 3 : q - 1; // keep PS undefined
  return {
    id: `gen.mpl-when-defined-d3.${idx}`, generated: true, concepts: ["when-defined"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.t1} lists ${m} ${ctx.r1} (rows) against ${n} ${ctx.c1} (columns), so $S$ is $${m} \\times ${n}$. A ${ctx.t2} lists ${n} ${ctx.c1} (rows) against ${q} ${ctx.c2} (columns), so $P$ is $${n} \\times ${q}$. You want ${ctx.goal}. Which product is defined, $SP$ or $PS$, and what size is the meaningful result?`,
    steps: [
      { instruction: `Is $SP$, the product $(${m} \\times ${n})(${n} \\times ${q})$, defined? Answer 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `Inner dimensions ${n} and ${n} match.` },
      { instruction: `Is $PS$, the product $(${n} \\times ${q})(${m} \\times ${n})$, defined? Answer 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: `Inner dimensions ${q} and ${m} do not match.` },
      { instruction: "How many rows does the meaningful product $SP$ have?", answer: `${m}`, accept: [], hint: `The ${ctx.r1} carry over from $S$.` },
      { instruction: "How many columns does $SP$ have?", answer: `${q}`, accept: [], hint: `The ${ctx.c2} carry over from $P$.` },
    ],
    finalAnswer: { value: `${m} x ${q}`, unit: "" },
    solutionNarrative: `$SP = (${m} \\times ${n})(${n} \\times ${q})$ is defined and yields a $${m} \\times ${q}$ ${ctx.r1}-by-${ctx.c2} table; $PS$ is not defined because $${q} \\neq ${m}$.`,
  };
};

// compute-product d1: a single row-dot-column product.
fill["mpl-product-d1"] = (rng, idx) => {
  const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(2, 9);
  const dot = a * c + b * d;
  return {
    id: `gen.mpl-product-d1.${idx}`, generated: true, concepts: ["compute-product"], difficulty: 1, context: "abstract",
    prompt: `Compute the single dot product of the row $${bmat([[a, b]])}$ with the column $${bmat([[c], [d]])}$.`,
    steps: [
      { instruction: `Multiply matching entries and add: $${a}\\cdot${c} + ${b}\\cdot${d}$.`, answer: `${dot}`, accept: [], hint: `$${a * c} + ${b * d}$.` },
    ],
    finalAnswer: { value: `${dot}`, unit: "" },
    solutionNarrative: `$${a}\\cdot${c} + ${b}\\cdot${d} = ${a * c} + ${b * d} = ${dot}$.`,
  };
};

// compute-product d3: full 2x3 times 3x2 product.
fill["mpl-product-d3"] = (rng, idx) => {
  const A = [[rng.int(0, 4), rng.int(0, 4), rng.int(0, 4)], [rng.int(0, 4), rng.int(0, 4), rng.int(0, 4)]];
  const B = [[rng.int(0, 4), rng.int(0, 4)], [rng.int(0, 4), rng.int(0, 4)], [rng.int(0, 4), rng.int(0, 4)]];
  const P = [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0] + A[0][2] * B[2][0], A[0][0] * B[0][1] + A[0][1] * B[1][1] + A[0][2] * B[2][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0] + A[1][2] * B[2][0], A[1][0] * B[0][1] + A[1][1] * B[1][1] + A[1][2] * B[2][1]],
  ];
  return {
    id: `gen.mpl-product-d3.${idx}`, generated: true, concepts: ["compute-product"], difficulty: 3, context: "abstract",
    prompt: `Compute the product $${bmat(A)}${bmat(B)}$.`,
    steps: [
      { instruction: `Entry (1,1): $${A[0][0]}\\cdot${B[0][0]} + ${A[0][1]}\\cdot${B[1][0]} + ${A[0][2]}\\cdot${B[2][0]}$.`, answer: `${P[0][0]}`, accept: [], hint: `$${A[0][0] * B[0][0]} + ${A[0][1] * B[1][0]} + ${A[0][2] * B[2][0]}$.` },
      { instruction: `Entry (1,2): $${A[0][0]}\\cdot${B[0][1]} + ${A[0][1]}\\cdot${B[1][1]} + ${A[0][2]}\\cdot${B[2][1]}$.`, answer: `${P[0][1]}`, accept: [], hint: `$${A[0][0] * B[0][1]} + ${A[0][1] * B[1][1]} + ${A[0][2] * B[2][1]}$.` },
      { instruction: "Write the full $2 \\times 2$ product as [[a, b], [c, d]].", answer: rows(P), accept: [], hint: `Row 2: $${A[1][0]}\\cdot${B[0][0]}+${A[1][1]}\\cdot${B[1][0]}+${A[1][2]}\\cdot${B[2][0]} = ${P[1][0]}$ and $${A[1][0]}\\cdot${B[0][1]}+${A[1][1]}\\cdot${B[1][1]}+${A[1][2]}\\cdot${B[2][1]} = ${P[1][1]}$.` },
    ],
    finalAnswer: { value: rows(P), unit: "" },
    solutionNarrative: `Each entry is a row-by-column dot product: $${P[0][0]}, ${P[0][1]}$ in row 1 and $${P[1][0]}, ${P[1][1]}$ in row 2, giving $${bmat(P)}$.`,
  };
};

// multiplication-properties d2: AB vs BA for two shear matrices — order matters.
fill["mpl-mult-props-d2"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(2, 5);
  const A = [[1, a], [0, 1]], B = [[1, 0], [b, 1]];
  const AB = mul2(A, B), BA = mul2(B, A);
  return {
    id: `gen.mpl-mult-props-d2.${idx}`, generated: true, concepts: ["multiplication-properties"], difficulty: 2, context: "abstract",
    prompt: `Show that order matters. Let $A = ${bmat(A)}$ and $B = ${bmat(B)}$. Compute $AB$ and $BA$, then compare.`,
    steps: [
      { instruction: "Compute $AB$ and write it as [[a, b], [c, d]].", answer: rows(AB), accept: [], hint: `Row 1: $1\\cdot1+${a}\\cdot${b} = ${AB[0][0]}$, $1\\cdot0+${a}\\cdot1 = ${AB[0][1]}$.` },
      { instruction: "Compute $BA$ and write it as [[a, b], [c, d]].", answer: rows(BA), accept: [], hint: `Row 2: $${b}\\cdot1+1\\cdot0 = ${BA[1][0]}$, $${b}\\cdot${a}+1\\cdot1 = ${BA[1][1]}$.` },
      { instruction: "Are $AB$ and $BA$ equal? Answer 'yes' or 'no'.", answer: "no", accept: ["n"], hint: `Compare the corner entries: ${AB[0][0]} versus ${BA[0][0]}.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `$AB = ${bmat(AB)}$ but $BA = ${bmat(BA)}$ — different matrices, confirming multiplication is not commutative.`,
  };
};

// multiplication-properties d3: compute a power of an upper-triangular matrix.
fill["mpl-mult-props-d3"] = (rng, idx) => {
  const a = rng.int(2, 4), d = rng.int(2, 4), b = rng.int(1, 3);
  const A = [[a, b], [0, d]];
  const A2 = mul2(A, A); // [[a^2, ab+bd], [0, d^2]]
  return {
    id: `gen.mpl-mult-props-d3.${idx}`, generated: true, concepts: ["multiplication-properties"], difficulty: 3, context: "abstract",
    prompt: `Compute the power $A^2$ for $A = ${bmat(A)}$, where $A^2 = AA$.`,
    steps: [
      { instruction: `Entry (1,1) of $AA$: $${a}\\cdot${a} + ${b}\\cdot0$.`, answer: `${A2[0][0]}`, accept: [], hint: `$${a * a} + 0$.` },
      { instruction: `Entry (1,2) of $AA$: $${a}\\cdot${b} + ${b}\\cdot${d}$.`, answer: `${A2[0][1]}`, accept: [], hint: `$${a * b} + ${b * d}$.` },
      { instruction: "Write the full $A^2$ as [[a, b], [c, d]].", answer: rows(A2), accept: [], hint: `Row 2: $0\\cdot${a}+${d}\\cdot0 = 0$ and $0\\cdot${b}+${d}\\cdot${d} = ${A2[1][1]}$.` },
    ],
    finalAnswer: { value: rows(A2), unit: "" },
    solutionNarrative: `$A^2 = AA = ${bmat(A2)}$ — note the diagonal entries are the squares $${a}^2$ and $${d}^2$.`,
  };
};

// multiplication-applied d1: quantities dot prices = revenue.
const REV_CTX = [
  { q1: "coffees", q2: "muffins", where: "A snack stand sells" },
  { q1: "adult tickets", q2: "child tickets", where: "A matinee show sells" },
  { q1: "burritos", q2: "sodas", where: "A food truck sells" },
  { q1: "notebooks", q2: "pens", where: "A campus store sells" },
];
fill["mpl-mult-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick(REV_CTX);
  const n1 = rng.int(2, 9), n2 = rng.int(2, 9);
  const p1 = rng.int(2, 9), p2 = rng.int(2, 9);
  const rev = n1 * p1 + n2 * p2;
  return {
    id: `gen.mpl-mult-applied-d1.${idx}`, generated: true, concepts: ["multiplication-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.where} ${n1} ${ctx.q1} and ${n2} ${ctx.q2} in an hour. Each of the ${ctx.q1} costs \\$${p1} and each of the ${ctx.q2} costs \\$${p2}. Find total revenue as the dot product $${bmat([[n1, n2]])}${bmat([[p1], [p2]])}$.`,
    steps: [
      { instruction: `Multiply quantities by prices and add: $${n1}\\cdot${p1} + ${n2}\\cdot${p2}$.`, answer: `${rev}`, accept: [], hint: `$${n1 * p1} + ${n2 * p2}$ dollars.` },
    ],
    finalAnswer: { value: `${rev}`, unit: "dollars" },
    solutionNarrative: `Revenue is the dot product $${n1}\\cdot${p1} + ${n2}\\cdot${p2} = ${n1 * p1} + ${n2 * p2} = \\$${rev}$.`,
  };
};

// ============================================================================
// matrix-operations.json
// ============================================================================

// matrix-dimensions d2: read entries by address from a 2x3 matrix.
fill["mpl-dimensions-d2"] = (rng, idx) => {
  const M = [[rng.int(0, 9), rng.int(0, 9), rng.int(0, 9)], [rng.int(0, 9), rng.int(0, 9), rng.int(0, 9)]];
  return {
    id: `gen.mpl-dimensions-d2.${idx}`, generated: true, concepts: ["matrix-dimensions"], difficulty: 2, context: "abstract",
    prompt: `Let $A = ${bmat(M)}$. Read off the requested entries (row first, column second).`,
    steps: [
      { instruction: "What is the entry $a_{12}$ (row 1, column 2)?", answer: `${M[0][1]}`, accept: [], hint: "Go to row 1, then count over to the second column." },
      { instruction: "What is the entry $a_{21}$ (row 2, column 1)?", answer: `${M[1][0]}`, accept: [], hint: "Row 2, first column." },
      { instruction: "What is the entry $a_{23}$ (row 2, column 3)?", answer: `${M[1][2]}`, accept: [], hint: "Row 2, third column." },
    ],
    finalAnswer: { value: `${M[0][1]}, ${M[1][0]}, ${M[1][2]}`, unit: "" },
    solutionNarrative: `Reading row-then-column: $a_{12} = ${M[0][1]}$, $a_{21} = ${M[1][0]}$, and $a_{23} = ${M[1][2]}$.`,
  };
};

// matrix-dimensions d3: reason about an m x n matrix without seeing its entries.
fill["mpl-dimensions-d3"] = (rng, idx) => {
  const m = rng.int(3, 6);
  const n = m + rng.int(1, 3); // never square
  return {
    id: `gen.mpl-dimensions-d3.${idx}`, generated: true, concepts: ["matrix-dimensions"], difficulty: 3, context: "abstract",
    prompt: `A matrix $B$ has dimensions $${m} \\times ${n}$. Answer the following about it.`,
    steps: [
      { instruction: "How many entries does $B$ have in total?", answer: `${m * n}`, accept: [], hint: `A grid with ${m} rows and ${n} columns has rows × columns cells.` },
      { instruction: "Is $B$ a square matrix? Answer 'yes' or 'no'.", answer: "no", accept: ["n"], hint: "A matrix is square only when its number of rows equals its number of columns." },
      { instruction: "How many entries sit in each single row of $B$?", answer: `${n}`, accept: [], hint: "A row has one entry per column." },
    ],
    finalAnswer: { value: `${m * n} entries; not square`, unit: "" },
    solutionNarrative: `A $${m} \\times ${n}$ matrix has $${m} \\times ${n} = ${m * n}$ entries. Since $${m} \\neq ${n}$ it is not square, and each row holds ${n} entries — one per column.`,
  };
};

// ============================================================================
// matrix-transformations.json
// ============================================================================

// rotation-reflection-scaling d3: a reflection/rotation followed by a scaling.
const RRS_OPS = [
  { name: "reflect it across the $x$-axis", f: (v) => [v[0], -v[1]], how: "negate the $y$-coordinate" },
  { name: "reflect it across the $y$-axis", f: (v) => [-v[0], v[1]], how: "negate the $x$-coordinate" },
  { name: "rotate it $90°$ counterclockwise", f: (v) => [-v[1], v[0]], how: "send $(x, y)$ to $(-y, x)$" },
  { name: "rotate it $180°$", f: (v) => [-v[0], -v[1]], how: "negate both coordinates" },
];
const RRS_CTX = [
  { thing: "logo", where: "An image editor" },
  { thing: "sprite", where: "A game engine" },
  { thing: "sticker", where: "A design tool" },
];
fill["mpl-rrs-d3"] = (rng, idx) => {
  const op = rng.pick(RRS_OPS);
  const ctx = rng.pick(RRS_CTX);
  const k = rng.int(2, 4);
  const P = [rng.int(1, 6), rng.int(1, 6)];
  const mid = op.f(P);
  const fin = [k * mid[0], k * mid[1]];
  return {
    id: `gen.mpl-rrs-d3.${idx}`, generated: true, concepts: ["rotation-reflection-scaling"], difficulty: 3, context: "applied",
    prompt: `${ctx.where} needs to ${op.name} and then scale it by a factor of ${k}. The ${ctx.thing}'s anchor point is at $(${P[0]}, ${P[1]})$. Apply the two moves in order. Where does the anchor end up?`,
    steps: [
      { instruction: `First ${op.name}: give the point after this move.`, answer: vec(mid), accept: [`<${mid[0]}, ${mid[1]}>`], hint: `This move is: ${op.how}.` },
      { instruction: `Now scale that result by ${k}. Give the final point.`, answer: vec(fin), accept: [`<${fin[0]}, ${fin[1]}>`], hint: `Multiply both coordinates by ${k}.` },
    ],
    finalAnswer: { value: vec(fin), unit: "" },
    solutionNarrative: `The first move sends $(${P[0]}, ${P[1]})$ to $(${mid[0]}, ${mid[1]})$; scaling by ${k} gives $(${fin[0]}, ${fin[1]})$.`,
  };
};

// composition-of-transformations d2: combined matrix BA of two standard moves.
const STD_MATS = [
  { M: [[0, -1], [1, 0]], desc: "rotate $90°$ counterclockwise" },
  { M: [[-1, 0], [0, -1]], desc: "rotate $180°$" },
  { M: [[0, 1], [-1, 0]], desc: "rotate $270°$ counterclockwise" },
  { M: [[1, 0], [0, -1]], desc: "reflect across the $x$-axis" },
  { M: [[-1, 0], [0, 1]], desc: "reflect across the $y$-axis" },
];
fill["mpl-compose-d2"] = (rng, idx) => {
  const iA = rng.int(0, 4);
  const iB = (iA + rng.int(1, 4)) % 5; // always a different move
  const A = STD_MATS[iA], B = STD_MATS[iB];
  const C = mul2(B.M, A.M);
  return {
    id: `gen.mpl-compose-d2.${idx}`, generated: true, concepts: ["composition-of-transformations"], difficulty: 2, context: "abstract",
    prompt: `Apply $A = ${bmat(A.M)}$ (${A.desc}) first, then $B = ${bmat(B.M)}$ (${B.desc}). Find the combined matrix $BA$.`,
    steps: [
      { instruction: `Compute entry (1,1) of $BA$: row 1 of $B$ dot column 1 of $A$.`, answer: `${C[0][0]}`, accept: [], hint: `$${B.M[0][0]}\\cdot${A.M[0][0]} + (${B.M[0][1]})\\cdot(${A.M[1][0]})$.` },
      { instruction: "Compute the full product $BA$ and write it in row-major bracket form.", answer: rows(C), accept: [], hint: "The second transformation goes on the left; each entry is a row of $B$ dotted with a column of $A$." },
    ],
    finalAnswer: { value: rows(C), unit: "" },
    solutionNarrative: `$BA = ${bmat(B.M)}${bmat(A.M)} = ${bmat(C)}$ — the second move multiplies from the left.`,
  };
};

// composition-of-transformations d3: build SR (rotate then scale), then apply it.
const COMP_CTX = [
  { who: "A graphics engine", thing: "sprite", pt: "corner" },
  { who: "A CAD program", thing: "part outline", pt: "vertex" },
  { who: "A mapping app", thing: "navigation arrow", pt: "tip" },
];
const COMP_ROTS = [
  { M: [[0, -1], [1, 0]], desc: "rotates it $90°$ counterclockwise" },
  { M: [[-1, 0], [0, -1]], desc: "rotates it $180°$" },
  { M: [[0, 1], [-1, 0]], desc: "rotates it $270°$ counterclockwise" },
];
fill["mpl-compose-d3"] = (rng, idx) => {
  const ctx = rng.pick(COMP_CTX);
  const rot = rng.pick(COMP_ROTS);
  const k = rng.int(2, 3);
  const S = [[k, 0], [0, k]];
  const C = mul2(S, rot.M);
  const P = [rng.int(1, 4), rng.int(1, 4)];
  const out = apply2(C, P);
  return {
    id: `gen.mpl-compose-d3.${idx}`, generated: true, concepts: ["composition-of-transformations"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} ${rot.desc} with $R = ${bmat(rot.M)}$, then scales it by ${k} with $S = ${bmat(S)}$. The ${ctx.thing} has a ${ctx.pt} at $(${P[0]}, ${P[1]})$. Build the combined matrix and apply it.`,
    steps: [
      { instruction: "The rotation happens first, then the scaling, so the combined matrix is $SR$. Compute it in row-major bracket form.", answer: rows(C), accept: [], hint: `Scaling by ${k} just multiplies every entry of $R$ by ${k}.` },
      { instruction: `Apply the combined matrix to the ${ctx.pt} $(${P[0]}, ${P[1]})$. Give the new point.`, answer: vec(out), accept: [`<${out[0]}, ${out[1]}>`], hint: `Top: $${C[0][0]}\\cdot${P[0]} + (${C[0][1]})\\cdot${P[1]}$. Bottom: $${C[1][0]}\\cdot${P[0]} + (${C[1][1]})\\cdot${P[1]}$.` },
    ],
    finalAnswer: { value: vec(out), unit: "" },
    solutionNarrative: `$SR = ${bmat(C)}$. Applying it to $(${P[0]}, ${P[1]})$ gives $(${out[0]}, ${out[1]})$ — both moves done in one multiply.`,
  };
};

// applications d1: one step of a two-state transition (single weighted sum).
const MK1_CTX = [
  { group: "subscribers", other: "cancelled users", stay: "of subscribers stay", back: "of cancelled users resubscribe", service: "A streaming service", state: "subscribed" },
  { group: "members", other: "lapsed members", stay: "of members renew", back: "of lapsed members rejoin", service: "A gym", state: "active" },
  { group: "readers", other: "unsubscribed readers", stay: "of readers stay on the list", back: "of unsubscribed readers re-join", service: "A newsletter", state: "subscribed" },
];
fill["mpl-markov-d1"] = (rng, idx) => {
  const ctx = rng.pick(MK1_CTX);
  const p10 = rng.int(7, 9), q10 = rng.int(1, 3);
  const s = rng.int(3, 8) * 100, c = rng.int(2, 6) * 100;
  const next = (p10 * s + q10 * c) / 10;
  return {
    id: `gen.mpl-markov-d1.${idx}`, generated: true, concepts: ["applications"], difficulty: 1, context: "applied",
    prompt: `${ctx.service} finds that each month ${p10 * 10}% ${ctx.stay} and ${q10 * 10}% ${ctx.back}. Today there are ${s} ${ctx.group} and ${c} ${ctx.other}. The transition gives next month's ${ctx.state} count as $${tenth(p10)}\\cdot ${s} + ${tenth(q10)}\\cdot ${c}$. How many will be ${ctx.state} next month?`,
    steps: [
      { instruction: `Compute $${tenth(p10)}\\cdot ${s} + ${tenth(q10)}\\cdot ${c}$.`, answer: `${next}`, accept: [], hint: `$${(p10 * s) / 10} + ${(q10 * c) / 10}$.` },
    ],
    finalAnswer: { value: `${next}`, unit: ctx.group },
    solutionNarrative: `$${tenth(p10)}\\cdot ${s} + ${tenth(q10)}\\cdot ${c} = ${(p10 * s) / 10} + ${(q10 * c) / 10} = ${next}$ ${ctx.state} next month.`,
  };
};

// applications d2: full transition-matrix-times-state-vector step.
const MK2_CTX = [
  { s1: "city", s2: "suburb", units: "thousand residents", story: "Each year some residents move between the city and the suburbs" },
  { s1: "brand A", s2: "brand B", units: "customers", story: "Each month customers switch between two competing brands" },
  { s1: "employed", s2: "searching", units: "workers", story: "Each quarter workers move between employment and job-searching" },
];
fill["mpl-markov-d2"] = (rng, idx) => {
  const ctx = rng.pick(MK2_CTX);
  const p10 = rng.int(6, 9), q10 = rng.int(1, 4);
  const s = rng.int(4, 9) * 10, c = rng.int(3, 8) * 10;
  const P = [[tenth(p10), tenth(q10)], [tenth(10 - p10), tenth(10 - q10)]];
  const top = (p10 * s + q10 * c) / 10;
  const bot = ((10 - p10) * s + (10 - q10) * c) / 10;
  return {
    id: `gen.mpl-markov-d2.${idx}`, generated: true, concepts: ["applications"], difficulty: 2, context: "applied",
    prompt: `${ctx.story}, following a Markov chain with transition matrix $P = ${bmat(P)}$ (columns: currently ${ctx.s1}/${ctx.s2}; rows: next ${ctx.s1}/${ctx.s2}). The current state vector is $${bmat([[s], [c]])}$ (${ctx.units}). Compute the next state $P$ times this vector.`,
    steps: [
      { instruction: `Compute the next ${ctx.s1} count: $${P[0][0]}\\cdot ${s} + ${P[0][1]}\\cdot ${c}$.`, answer: `${top}`, accept: [], hint: `$${(p10 * s) / 10} + ${(q10 * c) / 10}$.` },
      { instruction: `Compute the next ${ctx.s2} count: $${P[1][0]}\\cdot ${s} + ${P[1][1]}\\cdot ${c}$.`, answer: `${bot}`, accept: [], hint: `$${((10 - p10) * s) / 10} + ${((10 - q10) * c) / 10}$.` },
      { instruction: `State the next state vector (${ctx.s1}, ${ctx.s2}).`, answer: `(${top}, ${bot})`, accept: [`<${top}, ${bot}>`], hint: "Pair the two counts you computed." },
    ],
    finalAnswer: { value: `(${top}, ${bot})`, unit: ctx.units },
    solutionNarrative: `$P${bmat([[s], [c]])} = ${bmat([[top], [bot]])}$: ${top} ${ctx.s1} and ${bot} ${ctx.s2} after one step. (Totals check: $${top} + ${bot} = ${top + bot} = ${s} + ${c}$.)`,
  };
};

// applications d3: solve for the steady state of a two-state chain.
const SS_POOL = [
  { p: "0.7", q: "0.2", den: "0.5", a: "0.4", b: "0.6" },
  { p: "0.8", q: "0.3", den: "0.5", a: "0.6", b: "0.4" },
  { p: "0.9", q: "0.4", den: "0.5", a: "0.8", b: "0.2" },
  { p: "0.6", q: "0.4", den: "0.8", a: "0.5", b: "0.5" },
  { p: "0.9", q: "0.3", den: "0.4", a: "0.75", b: "0.25" },
];
const SS_CTX = [
  { A: "brand A", B: "brand B", who: "customers", scene: "Two brands compete" },
  { A: "gym A", B: "gym B", who: "members", scene: "Two gyms compete for the same members" },
  { A: "carrier A", B: "carrier B", who: "subscribers", scene: "Two phone carriers compete" },
];
fill["mpl-steady-state-d3"] = (rng, idx) => {
  const v = rng.pick(SS_POOL);
  const ctx = rng.pick(SS_CTX);
  const stayPct = `${Number(v.p) * 100}%`, inPct = `${Number(v.q) * 100}%`;
  return {
    id: `gen.mpl-steady-state-d3.${idx}`, generated: true, concepts: ["applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.scene}. Each month ${stayPct} of ${ctx.A}'s ${ctx.who} stay with ${ctx.A}, and ${inPct} of ${ctx.B}'s ${ctx.who} switch to ${ctx.A}. In the long run the shares reach a steady state. Let $a$ be ${ctx.A}'s steady-state share and $b = 1 - a$. The steady state satisfies $${v.p}a + ${v.q}(1 - a) = a$.`,
    steps: [
      { instruction: `Collect the $a$ terms: the equation becomes $${v.q} = ka$ for some coefficient $k = (1 - ${v.p}) + ${v.q}$. Compute $k$.`, answer: v.den, accept: [], hint: `$1 - ${v.p} = ${(10 - Number(v.p) * 10) / 10}$; add ${v.q}.` },
      { instruction: `Solve for the steady-state share $a = ${v.q} / ${v.den}$.`, answer: v.a, accept: [], hint: `Divide: $${v.q} \\div ${v.den}$.` },
      { instruction: `What is ${ctx.B}'s long-run share, $b = 1 - a$?`, answer: v.b, accept: [], hint: `$1 - ${v.a}$.` },
    ],
    finalAnswer: { value: v.a, unit: "" },
    solutionNarrative: `From $${v.p}a + ${v.q}(1-a) = a$ we get $${v.q} = ${v.den}a$, so $a = ${v.a}$: ${ctx.A} holds a ${Number(v.a) * 100}% share in the long run, leaving ${Number(v.b) * 100}% for ${ctx.B}.`,
  };
};

// ============================================================================
// solving-systems.json
// ============================================================================

// solution-types d3: classify a 3-variable reduced matrix (one/none/infinite).
fill["mpl-solution-types-d3"] = (rng, idx) => {
  const kind = rng.pick(["one", "none", "infinite"]);
  const base = { id: `gen.mpl-solution-types-d3.${idx}`, generated: true, concepts: ["solution-types"], difficulty: 3, context: "abstract" };
  const arr = (m) => `\\left[\\begin{array}{ccc|c} ${m.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{array}\\right]`;
  if (kind === "one") {
    const p = rng.int(-5, 5), q = rng.int(-5, 5), r = rng.int(-5, 5);
    return { ...base,
      prompt: `A 3-variable system row-reduces to $${arr([[1, 0, 0, p], [0, 1, 0, q], [0, 0, 1, r]])}$. Classify its solutions.`,
      steps: [
        { instruction: "How many leading 1's (pivots) does the reduced matrix have?", answer: "3", accept: [], hint: "One per row, each in its own variable column." },
        { instruction: "Does any row read $0 = k$ with $k \\neq 0$? Answer 'yes' or 'no'.", answer: "no", accept: ["n"], hint: "Every row has a leading 1 in a variable column." },
        { instruction: "How many solutions does the system have? (one, none, or infinite)", answer: "one", accept: ["1", "unique", "exactly one"], hint: "A leading 1 in every variable column pins each variable to a single value." },
        { instruction: "Read off the value of $z$ from the third row.", answer: `${r}`, accept: [`z=${r}`], hint: "The last column holds each pinned variable's value." },
      ],
      finalAnswer: { value: "one", unit: "" },
      solutionNarrative: `All three variable columns hold leading 1's and no row is contradictory, so there is exactly one solution: $(${p}, ${q}, ${r})$.`,
    };
  }
  if (kind === "none") {
    const a = rng.int(1, 3), b = rng.int(1, 3), p = rng.int(-5, 5), q = rng.int(-5, 5);
    const k = rng.int(1, 5);
    return { ...base,
      prompt: `A 3-variable system row-reduces to $${arr([[1, 0, a, p], [0, 1, b, q], [0, 0, 0, k]])}$. Classify its solutions.`,
      steps: [
        { instruction: "Read the bottom row as an equation. What does it say?", answer: `0 = ${k}`, accept: [`0=${k}`], hint: `The row means $0x + 0y + 0z = ${k}$.` },
        { instruction: "Is that statement ever true? Answer 'yes' or 'no'.", answer: "no", accept: ["n"], hint: "Zero cannot equal a nonzero number." },
        { instruction: "How many solutions does the system have? (one, none, or infinite)", answer: "none", accept: ["0", "no solution", "inconsistent", "zero"], hint: "A false row means the system is inconsistent." },
      ],
      finalAnswer: { value: "none", unit: "" },
      solutionNarrative: `The bottom row asserts $0 = ${k}$, which is impossible, so the system is inconsistent — no solution.`,
    };
  }
  const a = rng.int(1, 3), b = rng.int(1, 3), p = rng.int(-5, 5), q = rng.int(-5, 5);
  return { ...base,
    prompt: `A 3-variable system row-reduces to $${arr([[1, 0, a, p], [0, 1, b, q], [0, 0, 0, 0]])}$. Classify its solutions.`,
    steps: [
      { instruction: "Does any row read $0 = k$ with $k \\neq 0$? Answer 'yes' or 'no'.", answer: "no", accept: ["n"], hint: "The bottom row is all zeros on both sides." },
      { instruction: "The third variable $z$ has no leading 1. Is $z$ a free variable? Answer 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: "A variable column without a pivot is free to take any value." },
      { instruction: "How many solutions does the system have? (one, none, or infinite)", answer: "infinite", accept: ["infinitely many", "infinite solutions", "many"], hint: "Each choice of the free variable gives a valid solution." },
    ],
    finalAnswer: { value: "infinite", unit: "" },
    solutionNarrative: "The all-zero row removes one constraint, leaving $z$ free; with no contradictory row, every choice of $z$ yields a solution — infinitely many.",
  };
};

// systems-applied d1: two-item pricing system solved by subtracting equations.
const SYS_CTX = [
  { i1: "pretzel", i2: "juice", s1: "p", s2: "j", where: "At a snack stand" },
  { i1: "taco", i2: "lemonade", s1: "t", s2: "l", where: "At a food cart" },
  { i1: "muffin", i2: "coffee", s1: "m", s2: "c", where: "At a bakery counter" },
  { i1: "bagel", i2: "smoothie", s1: "b", s2: "s", where: "At a café" },
];
fill["mpl-systems-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick(SYS_CTX);
  const x1 = rng.int(2, 6), x2 = rng.int(1, 5);
  const s = x1 + x2, t = x1 + 2 * x2;
  return {
    id: `gen.mpl-systems-applied-d1.${idx}`, generated: true, concepts: ["systems-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.where}, 1 ${ctx.i1} and 1 ${ctx.i2} cost \\$${s}, while 1 ${ctx.i1} and 2 ${ctx.i2}s cost \\$${t}. Let $${ctx.s1}$ be the ${ctx.i1} price and $${ctx.s2}$ the ${ctx.i2} price. Find $(${ctx.s1}, ${ctx.s2})$.`,
    steps: [
      { instruction: `Subtract the first equation $${ctx.s1} + ${ctx.s2} = ${s}$ from the second $${ctx.s1} + 2${ctx.s2} = ${t}$ to find $${ctx.s2}$.`, answer: `${ctx.s2} = ${x2}`, accept: [`${x2}`], hint: `$(${ctx.s1} + 2${ctx.s2}) - (${ctx.s1} + ${ctx.s2}) = ${t} - ${s}$ leaves $${ctx.s2} = ${x2}$.` },
      { instruction: `Use $${ctx.s1} + ${ctx.s2} = ${s}$ to find $${ctx.s1}$, then write the solution vector $(${ctx.s1}, ${ctx.s2})$.`, answer: `(${x1}, ${x2})`, accept: [`<${x1}, ${x2}>`], hint: `With $${ctx.s2} = ${x2}$, $${ctx.s1} + ${x2} = ${s}$.` },
    ],
    finalAnswer: { value: `(${x1}, ${x2})`, unit: "dollars" },
    solutionNarrative: `Subtracting the equations gives $${ctx.s2} = ${x2}$; then $${ctx.s1} + ${x2} = ${s}$ gives $${ctx.s1} = ${x1}$. So a ${ctx.i1} is \\$${x1} and a ${ctx.i2} is \\$${x2}, the vector $(${x1}, ${x2})$.`,
  };
};
