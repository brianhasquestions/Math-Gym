// gen-matx-fill.js
// Variety pack for the three under-covered Matrix Algebra topics:
//   matrix-algebra.solving-systems        (augmented-matrices, gaussian-elimination,
//                                          solution-types, systems-applied)
//   matrix-algebra.matrix-multiplication  (when-defined, compute-product,
//                                          multiplication-properties, multiplication-applied)
//   matrix-algebra.matrix-transformations (apply-transformation, rotation-reflection-scaling,
//                                          composition-of-transformations, applications)
// One template per (concept, difficulty) tier that the existing inline generators
// (solve-system-2x2-v1, mat-mult-v1, mat-defined-v1, transform-apply-v1, rotation-v1)
// do NOT already serve — 11 + 10 + 10 = 31 templates, prefix `mxa-`. Self-contained:
// no imports; helper copies live here. Every answer is computed in-pack from the
// same randomized numbers shown in the prompt.

// ---------------------------------------------------------------------------
// House helpers (copied, not imported)
// ---------------------------------------------------------------------------
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };

// Row-major bracket form for grading: [[a, b], [c, d]] (any rectangular shape).
const matStr = (M) => `[[${M.map((r) => r.join(", ")).join("], [")}]]`;

// LaTeX bmatrix for prompts.
const ltx = (M) => `\\begin{bmatrix} ${M.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{bmatrix}`;

// LaTeX augmented matrix: last column behind the bar.
const aug = (M) => {
  const cols = M[0].length;
  return `\\left[\\begin{array}{${"c".repeat(cols - 1)}|c} ${M.map((r) => r.join(" & ")).join(" \\\\ ")} \\end{array}\\right]`;
};

const matMul = (A, B) => A.map((row, i) =>
  B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
const matVec = (A, v) => A.map((row) => row.reduce((s, a, k) => s + a * v[k], 0));
const matEq = (A, B) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => x === B[i][j]));
const rand2x2 = (rng, lo = -6, hi = 6) => [[rng.int(lo, hi), rng.int(lo, hi)], [rng.int(lo, hi), rng.int(lo, hi)]];
const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
const vec = (v) => `<${v.join(", ")}>`;
const pt = (v) => `(${v.join(", ")})`;

// Linear-term formatter: coefficient +/-1 renders as bare symbol ("x + 2y - z").
const term = (coef, sym, first) => {
  const mag = Math.abs(coef) === 1 ? "" : `${Math.abs(coef)}`;
  if (first) return `${coef < 0 ? "-" : ""}${mag}${sym}`;
  return `${coef < 0 ? "- " : "+ "}${mag}${sym}`;
};
const lin2 = (a, b) => `${term(a, "x", true)} ${term(b, "y", false)}`;
const lin3 = (a, b, c) => `${term(a, "x", true)} ${term(b, "y", false)} ${term(c, "z", false)}`;

// Named 2x2 transformation matrices (integer entries only).
const ROT = { 0: [[1, 0], [0, 1]], 90: [[0, -1], [1, 0]], 180: [[-1, 0], [0, -1]], 270: [[0, 1], [-1, 0]] };
const REFL_X = [[1, 0], [0, -1]], REFL_Y = [[-1, 0], [0, 1]], REFL_DIAG = [[0, 1], [1, 0]];

// Shared accept variants for the "how many solutions" menu (mirrors seed problems).
const SOL_ACCEPT = {
  one: ["1", "unique", "exactly one"],
  none: ["0", "no solution", "inconsistent", "zero"],
  infinite: ["infinitely many", "infinite solutions", "many"],
};
const SOL_MENU = "(one, none, or infinite)";

// ===========================================================================
export const fill = {};

// ===========================================================================
// matrix-algebra.solving-systems
// Existing: solve-system-2x2-v1 (gaussian-elimination, d2)
// ===========================================================================

// --- augmented-matrices d1: write the augmented matrix of a 2x2 system ---
fill["mxa-aug-write-1"] = (rng, idx) => {
  const a = nz(rng, -4, 4), b = nz(rng, -4, 4), c = nz(rng, -4, 4), d = nz(rng, -4, 4);
  const e = rng.int(-9, 9), f = rng.int(-9, 9);
  const M = [[a, b, e], [c, d, f]];
  return {
    id: `gen.mxa-aug-write-1.${idx}`, generated: true, concepts: ["augmented-matrices"], difficulty: 1, context: "abstract",
    prompt: `Write the system $${lin2(a, b)} = ${e},\\; ${lin2(c, d)} = ${f}$ as an augmented matrix in row-major bracket form.`,
    steps: [
      { instruction: "Keep the column order $x$, $y$, then the right-hand side. Enter the augmented matrix as [[a, b, e], [c, d, f]].", answer: matStr(M), accept: [], hint: "A bare $x$ means coefficient 1; a bare $-y$ means $-1$." },
    ],
    finalAnswer: { value: matStr(M), unit: "" },
    solutionNarrative: `Row 1 holds ${a}, ${b}, ${e}; row 2 holds ${c}, ${d}, ${f}: $${matStr(M)}$.`,
  };
};

// --- augmented-matrices d2: read the solution off a reduced matrix ---
fill["mxa-aug-read-1"] = (rng, idx) => {
  const x = rng.int(-8, 8), y = nz(rng, -8, 8);
  return {
    id: `gen.mxa-aug-read-1.${idx}`, generated: true, concepts: ["augmented-matrices"], difficulty: 2, context: "abstract",
    prompt: `A system has been row-reduced to $${aug([[1, 0, x], [0, 1, y]])}$. Read off the solution as a vector $(x, y)$.`,
    steps: [
      { instruction: `The first row says $x = ${x}$ and the second says $y = ${y}$. Write the solution vector.`, answer: pt([x, y]), accept: [vec([x, y]), `${x}, ${y}`], hint: "The last column holds the values once the left block is the identity." },
    ],
    finalAnswer: { value: pt([x, y]), unit: "" },
    solutionNarrative: `The identity block on the left means the last column IS the solution: $(${x}, ${y})$.`,
  };
};

// --- augmented-matrices d3: write a 3-variable augmented matrix ---
fill["mxa-aug-write3-1"] = (rng, idx) => {
  const row = () => [nz(rng, -3, 3), nz(rng, -3, 3), nz(rng, -3, 3), rng.int(-8, 8)];
  const r1 = row(), r2 = row(), r3 = row();
  const M = [r1, r2, r3];
  return {
    id: `gen.mxa-aug-write3-1.${idx}`, generated: true, concepts: ["augmented-matrices"], difficulty: 3, context: "abstract",
    prompt: `Write the 3-variable system $${lin3(r1[0], r1[1], r1[2])} = ${r1[3]},\\; ${lin3(r2[0], r2[1], r2[2])} = ${r2[3]},\\; ${lin3(r3[0], r3[1], r3[2])} = ${r3[3]}$ as an augmented matrix in row-major bracket form.`,
    steps: [
      { instruction: "Build the matrix row by row, columns in the order $x$, $y$, $z$, then the constant. Enter it as [[...], [...], [...]].", answer: matStr(M), accept: [], hint: "Each equation becomes one row of four numbers." },
    ],
    finalAnswer: { value: matStr(M), unit: "" },
    solutionNarrative: `Each equation contributes one row: $${matStr(M)}$.`,
  };
};

// --- gaussian-elimination d1: carry out one row operation ---
fill["mxa-rowop-1"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = nz(rng, -3, 3), e = rng.int(-5, 5);
  const c = nz(rng, -4, 4), d = nz(rng, -4, 4), f = rng.int(-6, 6);
  const k = rng.int(1, 3);
  const nr = [c - k * a, d - k * b, f - k * e];
  return {
    id: `gen.mxa-rowop-1.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 1, context: "abstract",
    prompt: `Start from the augmented matrix $${aug([[a, b, e], [c, d, f]])}$ and perform the row operation $R_2 \\to R_2 - ${k}R_1$.`,
    steps: [
      { instruction: `Subtract ${k} times row 1 from row 2, entry by entry. Enter the new second row as a vector <a, b, c>.`, answer: vec(nr), accept: [pt(nr)], hint: `First entry: $${c} - ${k}\\cdot${a === 0 ? 0 : `(${a})`}$.` },
    ],
    finalAnswer: { value: vec(nr), unit: "" },
    solutionNarrative: `New row 2: $(${c} - ${k}\\cdot${a},\\; ${d} - ${k}\\cdot${b},\\; ${f} - ${k}\\cdot${e}) = (${nr.join(", ")})$. Row 1 is unchanged.`,
  };
};

// --- gaussian-elimination d3: back-substitution on a 3x3 triangular system ---
fill["mxa-backsub3-1"] = (rng, idx) => {
  const x = nz(rng, -4, 4), y = nz(rng, -4, 4), z = nz(rng, -4, 4);
  const a33 = rng.int(1, 3), a22 = rng.int(1, 3), a23 = nz(rng, -3, 3);
  const a11 = rng.int(1, 3), a12 = nz(rng, -3, 3), a13 = nz(rng, -3, 3);
  const e3 = a33 * z, e2 = a22 * y + a23 * z, e1 = a11 * x + a12 * y + a13 * z;
  return {
    id: `gen.mxa-backsub3-1.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 3, context: "abstract",
    prompt: `Elimination has reduced a system to the triangular form $${aug([[a11, a12, a13, e1], [0, a22, a23, e2], [0, 0, a33, e3]])}$. Back-substitute to solve it.`,
    steps: [
      { instruction: `The bottom row says $${a33 === 1 ? "z" : `${a33}z`} = ${e3}$. Solve for $z$.`, answer: `z = ${z}`, accept: [`${z}`], hint: `Divide by ${a33}.` },
      { instruction: `The middle row says $${term(a22, "y", true)} ${term(a23, "z", false)} = ${e2}$. Substitute $z = ${z}$ and solve for $y$.`, answer: `y = ${y}`, accept: [`${y}`], hint: `$${a22}y = ${e2} - (${a23})(${z})$.` },
      { instruction: `Use the top row to find $x$, then write the solution vector $(x, y, z)$.`, answer: pt([x, y, z]), accept: [vec([x, y, z])], hint: `$${a11}x = ${e1} - (${a12})(${y}) - (${a13})(${z})$.` },
    ],
    finalAnswer: { value: pt([x, y, z]), unit: "" },
    solutionNarrative: `Bottom-up: $z = ${z}$, then $y = ${y}$, then $x = ${x}$. Solution $(${x}, ${y}, ${z})$.`,
  };
};

// --- solution-types d1: classify a reduced 2x2 augmented matrix ---
fill["mxa-soltype-1"] = (rng, idx) => {
  const kind = rng.pick(["one", "none", "infinite"]);
  let M, why;
  if (kind === "one") {
    M = [[1, 0, rng.int(-6, 6)], [0, 1, rng.int(-6, 6)]];
    why = "Each variable column has its own leading 1, so the last column is the single solution.";
  } else if (kind === "none") {
    M = [[1, nz(rng, -4, 4), rng.int(-6, 6)], [0, 0, nz(rng, 1, 6)]];
    why = `The bottom row reads $0 = ${M[1][2]}$, which is impossible.`;
  } else {
    M = [[1, nz(rng, -4, 4), rng.int(-6, 6)], [0, 0, 0]];
    why = "The bottom row is all zeros, so one variable is free.";
  }
  return {
    id: `gen.mxa-soltype-1.${idx}`, generated: true, concepts: ["solution-types"], difficulty: 1, context: "abstract",
    prompt: `A system row-reduces to $${aug(M)}$. How many solutions does it have? Answer with a word.`,
    steps: [
      { instruction: `Look at the shape of the rows, especially the bottom one. State the number of solutions ${SOL_MENU}.`, answer: kind, accept: SOL_ACCEPT[kind], hint: "A row $[\\,0\\;0\\;|\\;k\\,]$ with $k \\neq 0$ is a contradiction; a row of all zeros leaves a free variable." },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `${why} The system has ${kind === "one" ? "exactly one solution" : kind === "none" ? "no solution" : "infinitely many solutions"}.`,
  };
};

// --- solution-types d2: classify a raw 2x2 system by comparing the equations ---
fill["mxa-soltype-2"] = (rng, idx) => {
  const kind = rng.pick(["one", "none", "infinite"]);
  let a = nz(rng, -3, 3), b = nz(rng, -3, 3), e = rng.int(-5, 5);
  let c, d, f;
  if (kind === "one") {
    do { c = nz(rng, -3, 3); d = nz(rng, -3, 3); } while (a * d - b * c === 0);
    f = rng.int(-5, 5);
  } else {
    const k = rng.int(2, 3);
    c = k * a; d = k * b;
    f = kind === "infinite" ? k * e : k * e + nz(rng, 1, 4);
  }
  return {
    id: `gen.mxa-soltype-2.${idx}`, generated: true, concepts: ["solution-types"], difficulty: 2, context: "abstract",
    prompt: `Classify the system $${lin2(a, b)} = ${e},\\; ${lin2(c, d)} = ${f}$. How many solutions does it have? Answer with a word.`,
    steps: [
      { instruction: `Check whether the second equation is a multiple of the first — coefficients AND right-hand side. State the number of solutions ${SOL_MENU}.`, answer: kind, accept: SOL_ACCEPT[kind], hint: kind === "one" ? "The coefficient rows are not proportional." : `The left sides are proportional (factor ${c / a}); compare the right-hand sides with the same factor.` },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: kind === "one"
      ? `The coefficient rows $(${a}, ${b})$ and $(${c}, ${d})$ are not proportional, so the lines cross once: one solution.`
      : kind === "infinite"
        ? `The second equation is exactly ${c / a} times the first — the same line twice, so infinitely many solutions.`
        : `The left side of equation 2 is ${c / a} times equation 1's, but $${f} \\neq ${(c / a) * e}$ — parallel lines, no solution.`,
  };
};

// --- solution-types d3: classify a 3x3 echelon form from its bottom row ---
fill["mxa-soltype-3"] = (rng, idx) => {
  const kind = rng.pick(["one", "none", "infinite"]);
  const r1 = [1, nz(rng, -3, 3), nz(rng, -3, 3), rng.int(-6, 6)];
  const r2 = [0, 1, nz(rng, -3, 3), rng.int(-6, 6)];
  const r3 = kind === "one" ? [0, 0, rng.int(1, 3), rng.int(-6, 6)]
    : kind === "none" ? [0, 0, 0, nz(rng, 1, 5)]
      : [0, 0, 0, 0];
  return {
    id: `gen.mxa-soltype-3.${idx}`, generated: true, concepts: ["solution-types"], difficulty: 3, context: "abstract",
    prompt: `A 3-variable system row-reduces to the echelon form $${aug([r1, r2, r3])}$. How many solutions does it have? Answer with a word.`,
    steps: [
      { instruction: `Read the bottom row as an equation in $z$ and decide what it forces. State the number of solutions ${SOL_MENU}.`, answer: kind, accept: SOL_ACCEPT[kind], hint: kind === "one" ? `The bottom row pins down $z$; back-substitution then pins down $y$ and $x$.` : kind === "none" ? `The bottom row says $0 = ${r3[3]}$.` : "The bottom row says $0 = 0$, so $z$ is free." },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: kind === "one"
      ? `The bottom row gives $${r3[2]}z = ${r3[3]}$ — a pivot in every column, so exactly one solution.`
      : kind === "none"
        ? `The bottom row $0 = ${r3[3]}$ is impossible: no solution.`
        : "The zero bottom row leaves $z$ free: infinitely many solutions.",
  };
};

// --- systems-applied d1: sum-and-difference word problem ---
const SUMDIFF_CONTEXTS = [
  { who: "Two teammates", what: "points", a: "Ava", b: "Ben" },
  { who: "Two food stalls", what: "orders", a: "the taco stand", b: "the noodle cart" },
  { who: "Two branches", what: "sign-ups", a: "the north branch", b: "the south branch" },
];
fill["mxa-sys-applied-1"] = (rng, idx) => {
  const ctx = rng.pick(SUMDIFF_CONTEXTS);
  const yv = rng.int(3, 20), dd = rng.int(2, 9), xv = yv + dd, s = xv + yv;
  return {
    id: `gen.mxa-sys-applied-1.${idx}`, generated: true, concepts: ["systems-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.who} recorded ${s} ${ctx.what} in total, and ${ctx.a} had ${dd} more than ${ctx.b}. That is the system $x + y = ${s},\\; x - y = ${dd}$. Solve it.`,
    steps: [
      { instruction: "Add the two equations to eliminate $y$, then solve for $x$.", answer: `x = ${xv}`, accept: [`${xv}`], hint: `$2x = ${s + dd}$.` },
      { instruction: `Substitute back to find $y$, then write the solution vector $(x, y)$.`, answer: pt([xv, yv]), accept: [vec([xv, yv])], hint: `$y = ${s} - ${xv}$.` },
    ],
    finalAnswer: { value: pt([xv, yv]), unit: ctx.what },
    solutionNarrative: `Adding gives $2x = ${s + dd}$, so $x = ${xv}$; then $y = ${yv}$. Solution $(${xv}, ${yv})$.`,
  };
};

// --- systems-applied d2: ticket-price system ---
const TICKET_CTX = [
  { event: "play", a: "adult", c: "student" },
  { event: "matinee", a: "adult", c: "child" },
  { event: "exhibit", a: "regular", c: "member" },
];
fill["mxa-sys-applied-2"] = (rng, idx) => {
  const ctx = rng.pick(TICKET_CTX);
  const q = rng.int(3, 7), p = q + rng.int(2, 6); // distinct prices, p > q
  const xv = rng.int(2, 9), yv = rng.int(2, 9);
  const t = xv + yv, R = p * xv + q * yv;
  return {
    id: `gen.mxa-sys-applied-2.${idx}`, generated: true, concepts: ["systems-applied"], difficulty: 2, context: "applied",
    prompt: `A ${ctx.event} sold ${t} tickets for a total of \\$${R}. ${ctx.a.charAt(0).toUpperCase() + ctx.a.slice(1)} tickets cost \\$${p} and ${ctx.c} tickets cost \\$${q}. With $x$ ${ctx.a} and $y$ ${ctx.c} tickets, the system is $x + y = ${t},\\; ${p}x + ${q}y = ${R}$. Solve it.`,
    steps: [
      { instruction: `Substitute $y = ${t} - x$ into the money equation and solve for $x$.`, answer: `x = ${xv}`, accept: [`${xv}`], hint: `$(${p} - ${q})x = ${R} - ${q}\\cdot${t}$.` },
      { instruction: `Find $y$ and write the solution vector $(x, y)$.`, answer: pt([xv, yv]), accept: [vec([xv, yv])], hint: `$y = ${t} - ${xv}$.` },
    ],
    finalAnswer: { value: pt([xv, yv]), unit: "tickets" },
    solutionNarrative: `$(${p} - ${q})x = ${R - q * t}$ gives $x = ${xv}$, so $y = ${yv}$: ${xv} ${ctx.a} and ${yv} ${ctx.c} tickets.`,
  };
};

// --- systems-applied d3: three-variable word system by substitution ---
const TRIO_CTX = [
  { place: "bakery", items: ["muffins", "scones", "croissants"] },
  { place: "print shop", items: ["posters", "flyers", "banners"] },
  { place: "nursery", items: ["ferns", "succulents", "orchids"] },
];
fill["mxa-sys-applied-3"] = (rng, idx) => {
  const ctx = rng.pick(TRIO_CTX);
  const xv = rng.int(2, 7), m = rng.int(2, 3), k = rng.int(1, 5);
  const yv = m * xv, zv = xv + k, T = xv + yv + zv;
  const [i1, i2, i3] = ctx.items;
  return {
    id: `gen.mxa-sys-applied-3.${idx}`, generated: true, concepts: ["systems-applied"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.place} made ${T} items today: $x$ ${i1}, $y$ ${i2}, and $z$ ${i3}. It made ${m} times as many ${i2} as ${i1}, and ${k} more ${i3} than ${i1}. That is the system $x + y + z = ${T},\\; y = ${m}x,\\; z = x + ${k}$. Solve it.`,
    steps: [
      { instruction: `Substitute $y = ${m}x$ and $z = x + ${k}$ into the total and solve for $x$.`, answer: `x = ${xv}`, accept: [`${xv}`], hint: `$${m + 2}x + ${k} = ${T}$.` },
      { instruction: `Compute $y = ${m}x$.`, answer: `y = ${yv}`, accept: [`${yv}`], hint: `$y = ${m}\\cdot${xv}$.` },
      { instruction: `Compute $z$ and write the solution vector $(x, y, z)$.`, answer: pt([xv, yv, zv]), accept: [vec([xv, yv, zv])], hint: `$z = ${xv} + ${k}$.` },
    ],
    finalAnswer: { value: pt([xv, yv, zv]), unit: "items" },
    solutionNarrative: `$${m + 2}x + ${k} = ${T}$ gives $x = ${xv}$, so $y = ${yv}$ and $z = ${zv}$: $(${xv}, ${yv}, ${zv})$.`,
  };
};

// ===========================================================================
// matrix-algebra.matrix-multiplication
// Existing: mat-defined-v1 (when-defined, d1), mat-mult-v1 (compute-product, d2)
// ===========================================================================

// --- when-defined d2: result dimensions + is BA defined ---
fill["mxa-dims-2"] = (rng, idx) => {
  const m = rng.int(2, 5), n = rng.int(2, 5), q = rng.int(2, 5);
  const baOk = q === m;
  return {
    id: `gen.mxa-dims-2.${idx}`, generated: true, concepts: ["when-defined"], difficulty: 2, context: "abstract",
    prompt: `$A$ is a ${m}×${n} matrix and $B$ is a ${n}×${q} matrix, so $AB$ is defined.`,
    steps: [
      { instruction: "How many rows does $AB$ have?", answer: `${m}`, accept: [], hint: "The outer dimensions give the result size: rows from the first factor." },
      { instruction: "How many columns does $AB$ have?", answer: `${q}`, accept: [], hint: "Columns come from the second factor." },
      { instruction: `Is the reversed product $BA$, i.e. $(${n} \\times ${q})(${m} \\times ${n})$, defined? Answer 'yes' or 'no'.`, answer: baOk ? "yes" : "no", accept: [], hint: `Its inner dimensions are ${q} and ${m}.` },
    ],
    finalAnswer: { value: `${m}×${q}`, unit: "" },
    solutionNarrative: `$AB$ is ${m}×${q}. $BA$ needs ${q} = ${m}, so it is ${baOk ? "also defined" : "NOT defined"}.`,
  };
};

// --- when-defined d3: dimensions through a three-matrix chain ---
fill["mxa-dims-3"] = (rng, idx) => {
  const m = rng.int(2, 4), n = rng.int(2, 4), p = rng.int(2, 4), q = rng.int(2, 4);
  return {
    id: `gen.mxa-dims-3.${idx}`, generated: true, concepts: ["when-defined"], difficulty: 3, context: "abstract",
    prompt: `$A$ is ${m}×${n}, $B$ is ${n}×${p}, and $C$ is ${p}×${q}. The triple product $ABC$ is defined; track its size.`,
    steps: [
      { instruction: "First compute the size of $AB$. How many columns does $AB$ have?", answer: `${p}`, accept: [], hint: `$AB$ is $(${m} \\times ${n})(${n} \\times ${p})$.` },
      { instruction: "Now multiply $(AB)C$. How many rows does $ABC$ have?", answer: `${m}`, accept: [], hint: "Rows always come from the leftmost factor." },
      { instruction: "How many columns does $ABC$ have?", answer: `${q}`, accept: [], hint: "Columns come from the rightmost factor." },
    ],
    finalAnswer: { value: `${m}×${q}`, unit: "" },
    solutionNarrative: `$AB$ is ${m}×${p}; multiplying by $C$ gives ${m}×${q}. The inner sizes ${n} and ${p} disappear.`,
  };
};

// --- compute-product d1: one entry of a 2x2 product ---
fill["mxa-entry-1"] = (rng, idx) => {
  const A = rand2x2(rng, -5, 5), B = rand2x2(rng, -5, 5);
  const i = rng.int(1, 2), j = rng.int(1, 2);
  const val = A[i - 1][0] * B[0][j - 1] + A[i - 1][1] * B[1][j - 1];
  return {
    id: `gen.mxa-entry-1.${idx}`, generated: true, concepts: ["compute-product"], difficulty: 1, context: "abstract",
    prompt: `Let $A = ${ltx(A)}$ and $B = ${ltx(B)}$. Compute the single entry $(AB)_{${i}${j}}$ (row ${i}, column ${j} of the product).`,
    steps: [
      { instruction: `Dot row ${i} of $A$ with column ${j} of $B$: $(${A[i - 1][0]})(${B[0][j - 1]}) + (${A[i - 1][1]})(${B[1][j - 1]})$.`, answer: `${val}`, accept: [], hint: "Multiply matching entries, then add." },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$(AB)_{${i}${j}} = ${A[i - 1][0]}\\cdot${B[0][j - 1]} + ${A[i - 1][1]}\\cdot${B[1][j - 1]} = ${val}$.`,
  };
};

// --- compute-product d3: full product of a 2x3 and a 3x2 ---
fill["mxa-prod-rect-3"] = (rng, idx) => {
  const A = [[rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)], [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)]];
  const B = [[rng.int(-3, 3), rng.int(-3, 3)], [rng.int(-3, 3), rng.int(-3, 3)], [rng.int(-3, 3), rng.int(-3, 3)]];
  const P = matMul(A, B);
  return {
    id: `gen.mxa-prod-rect-3.${idx}`, generated: true, concepts: ["compute-product"], difficulty: 3, context: "abstract",
    prompt: `Multiply the ${"$2 \\times 3$"} and ${"$3 \\times 2$"} matrices $${ltx(A)}${ltx(B)}$. The result is $2 \\times 2$.`,
    steps: [
      { instruction: `Entry (1,1): row 1 of the first dot column 1 of the second, $(${A[0][0]})(${B[0][0]}) + (${A[0][1]})(${B[1][0]}) + (${A[0][2]})(${B[2][0]})$.`, answer: `${P[0][0]}`, accept: [], hint: "Three products summed — the inner dimension is 3." },
      { instruction: "Compute the remaining three entries the same way and write the full product as [[a, b], [c, d]].", answer: matStr(P), accept: [], hint: "Row $i$ of the first matrix dots column $j$ of the second for entry $(i, j)$." },
    ],
    finalAnswer: { value: matStr(P), unit: "" },
    solutionNarrative: `Each entry is a 3-term dot product; the result is $${matStr(P)}$.`,
  };
};

// --- multiplication-properties d1: multiplying by the identity ---
fill["mxa-identity-1"] = (rng, idx) => {
  const A = rand2x2(rng, -6, 6);
  const side = rng.pick(["AI", "IA"]);
  const disp = side === "AI" ? `${ltx(A)}${ltx([[1, 0], [0, 1]])}` : `${ltx([[1, 0], [0, 1]])}${ltx(A)}`;
  return {
    id: `gen.mxa-identity-1.${idx}`, generated: true, concepts: ["multiplication-properties"], difficulty: 1, context: "abstract",
    prompt: `Compute $${disp}$ — a matrix times the identity ${side === "AI" ? "on the right" : "on the left"}.`,
    steps: [
      { instruction: "The identity acts like the number 1. Write the result as [[a, b], [c, d]].", answer: matStr(A), accept: [], hint: `$${side}$ = $A$ — nothing changes.` },
    ],
    finalAnswer: { value: matStr(A), unit: "" },
    solutionNarrative: `Multiplying by $I$ on either side returns $A$ unchanged: $${matStr(A)}$.`,
  };
};

// --- multiplication-properties d2: does this pair commute? (computed witness) ---
fill["mxa-commute-2"] = (rng, idx) => {
  const scalarCase = rng.pick([true, false]);
  let A, B, AB, BA;
  if (scalarCase) {
    A = rand2x2(rng, -4, 4);
    const k = rng.int(2, 4);
    B = [[k, 0], [0, k]];
    AB = matMul(A, B); BA = matMul(B, A); // equal: kA
  } else {
    do {
      A = rand2x2(rng, -4, 4);
      B = rand2x2(rng, -4, 4);
      AB = matMul(A, B); BA = matMul(B, A);
    } while (AB[0][0] === BA[0][0] || matEq(A, B)); // force a visible witness in entry (1,1)
  }
  const equal = matEq(AB, BA);
  return {
    id: `gen.mxa-commute-2.${idx}`, generated: true, concepts: ["multiplication-properties"], difficulty: 2, context: "abstract",
    prompt: `Let $A = ${ltx(A)}$ and $B = ${ltx(B)}$. Test whether this particular pair commutes.`,
    steps: [
      { instruction: "Compute entry (1,1) of $AB$: row 1 of $A$ dot column 1 of $B$.", answer: `${AB[0][0]}`, accept: [], hint: `$(${A[0][0]})(${B[0][0]}) + (${A[0][1]})(${B[1][0]})$.` },
      { instruction: "Compute entry (1,1) of $BA$: row 1 of $B$ dot column 1 of $A$.", answer: `${BA[0][0]}`, accept: [], hint: `$(${B[0][0]})(${A[0][0]}) + (${B[0][1]})(${A[1][0]})$.` },
      { instruction: "Comparing ALL entries of $AB$ and $BA$, does $AB = BA$ for this pair? Answer 'yes' or 'no'.", answer: equal ? "yes" : "no", accept: [], hint: equal ? "$B$ is a scalar multiple of the identity — those commute with everything." : "The (1,1) entries already disagree." },
    ],
    finalAnswer: { value: equal ? "yes" : "no", unit: "" },
    solutionNarrative: equal
      ? `$B = ${B[0][0]}I$, and scalar multiples of the identity commute with every matrix: $AB = BA = ${B[0][0]}A$.`
      : `$(AB)_{11} = ${AB[0][0]}$ but $(BA)_{11} = ${BA[0][0]}$ — one mismatched entry is enough: $AB \\neq BA$.`,
  };
};

// --- multiplication-properties d3: matrix powers ---
fill["mxa-power-3"] = (rng, idx) => {
  let A;
  do { A = rand2x2(rng, -3, 3); } while (A.flat().every((v) => v === 0));
  const A2 = matMul(A, A);
  return {
    id: `gen.mxa-power-3.${idx}`, generated: true, concepts: ["multiplication-properties"], difficulty: 3, context: "abstract",
    prompt: `Let $A = ${ltx(A)}$. Compute the power $A^2 = AA$.`,
    steps: [
      { instruction: `Entry (1,1): $(${A[0][0]})(${A[0][0]}) + (${A[0][1]})(${A[1][0]})$.`, answer: `${A2[0][0]}`, accept: [], hint: "Row 1 of $A$ dot column 1 of $A$." },
      { instruction: "Compute the remaining entries and write the full $A^2$ as [[a, b], [c, d]].", answer: matStr(A2), accept: [], hint: "Note $A^2$ squares the MATRIX, not each entry." },
    ],
    finalAnswer: { value: matStr(A2), unit: "" },
    solutionNarrative: `$A^2 = ${matStr(A2)}$ — each entry is a row-dot-column of $A$ with itself, not an entrywise square.`,
  };
};

// --- multiplication-applied d1: quantities times prices ---
const COST_CTX = [
  { items: ["mugs", "plates"], unit: "dollars" },
  { items: ["seed packets", "planters"], unit: "dollars" },
  { items: ["USB cables", "adapters"], unit: "dollars" },
];
fill["mxa-cost-1"] = (rng, idx) => {
  const ctx = rng.pick(COST_CTX);
  const q1 = rng.int(2, 9), q2 = rng.int(2, 9), p1 = rng.int(2, 9), p2 = rng.int(2, 9);
  const total = q1 * p1 + q2 * p2;
  return {
    id: `gen.mxa-cost-1.${idx}`, generated: true, concepts: ["multiplication-applied"], difficulty: 1, context: "applied",
    prompt: `An order lists ${q1} ${ctx.items[0]} and ${q2} ${ctx.items[1]}; prices are \\$${p1} per ${ctx.items[0].replace(/s$/, "")} and \\$${p2} per ${ctx.items[1].replace(/s$/, "")}. The total cost is the row-times-column product $\\begin{bmatrix} ${q1} & ${q2} \\end{bmatrix}\\begin{bmatrix} ${p1} \\\\ ${p2} \\end{bmatrix}$.`,
    steps: [
      { instruction: `Multiply quantities by prices and add: $${q1}\\cdot${p1} + ${q2}\\cdot${p2}$.`, answer: `${total}`, accept: [], hint: "This dot product IS a 1×2 times 2×1 matrix product." },
    ],
    finalAnswer: { value: `${total}`, unit: ctx.unit },
    solutionNarrative: `$${q1}\\cdot${p1} + ${q2}\\cdot${p2} = ${total}$ ${ctx.unit} — a matrix product bundling the weighted sum.`,
  };
};

// --- multiplication-applied d2: transition matrix times a state vector ---
const STATE_CTX = [
  { thing: "customers", s1: "subscribed", s2: "unsubscribed", step: "month" },
  { thing: "bikes", s1: "downtown", s2: "uptown", step: "day" },
  { thing: "players", s1: "active", s2: "inactive", step: "week" },
];
fill["mxa-markov-2"] = (rng, idx) => {
  const ctx = rng.pick(STATE_CTX);
  const r1t = rng.int(6, 9), r2t = rng.int(6, 9); // retention rates in tenths
  const p1 = 10 * rng.int(20, 60), p2 = 10 * rng.int(20, 60);
  const n1 = (r1t * p1 + (10 - r2t) * p2) / 10;
  const n2 = ((10 - r1t) * p1 + r2t * p2) / 10;
  const T = [[`0.${r1t}`, `0.${10 - r2t}`], [`0.${10 - r1t}`, `0.${r2t}`]];
  return {
    id: `gen.mxa-markov-2.${idx}`, generated: true, concepts: ["multiplication-applied"], difficulty: 2, context: "applied",
    prompt: `Each ${ctx.step}, ${r1t * 10}% of ${ctx.s1} ${ctx.thing} stay ${ctx.s1} (the rest switch), and ${r2t * 10}% of ${ctx.s2} ${ctx.thing} stay ${ctx.s2}. Currently ${p1} are ${ctx.s1} and ${p2} are ${ctx.s2}. Next ${ctx.step}'s counts are $${ltx(T)}\\begin{bmatrix} ${p1} \\\\ ${p2} \\end{bmatrix}$.`,
    steps: [
      { instruction: `Compute next ${ctx.step}'s ${ctx.s1} count: $0.${r1t}\\cdot${p1} + 0.${10 - r2t}\\cdot${p2}$.`, answer: `${n1}`, accept: [], hint: "Stayers from the first group plus switchers from the second." },
      { instruction: `Compute next ${ctx.step}'s ${ctx.s2} count: $0.${10 - r1t}\\cdot${p1} + 0.${r2t}\\cdot${p2}$.`, answer: `${n2}`, accept: [], hint: "Switchers out of the first group plus stayers in the second." },
      { instruction: `Write next ${ctx.step}'s state vector as <a, b> (${ctx.s1} first).`, answer: vec([n1, n2]), accept: [pt([n1, n2])], hint: "Stack the two counts you just computed." },
    ],
    finalAnswer: { value: vec([n1, n2]), unit: ctx.thing },
    solutionNarrative: `Matrix-times-vector gives $(${n1}, ${n2})$ — note the total ${n1 + n2} matches ${p1} + ${p2}: nobody vanishes.`,
  };
};

// --- multiplication-applied d3: two-step paths via the squared adjacency matrix ---
fill["mxa-paths-3"] = (rng, idx) => {
  let A, edges;
  do {
    A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    edges = 0;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const on = rng.int(0, 1);
      A[i][j] = on; A[j][i] = on; edges += on;
    }
  } while (edges < 2);
  const A2 = matMul(A, A);
  const i = rng.int(1, 3);
  let j; do { j = rng.int(1, 3); } while (j === i);
  return {
    id: `gen.mxa-paths-3.${idx}`, generated: true, concepts: ["multiplication-applied"], difficulty: 3, context: "applied",
    prompt: `Three servers are wired together; entry $(i, j)$ of the adjacency matrix $A = ${ltx(A)}$ is 1 when servers $i$ and $j$ share a direct link. Entry $(i, j)$ of $A^2$ counts the two-hop routes from $i$ to $j$.`,
    steps: [
      { instruction: `Compute $(A^2)_{${i}${j}}$ — the number of two-hop routes from server ${i} to server ${j}: dot row ${i} of $A$ with column ${j} of $A$.`, answer: `${A2[i - 1][j - 1]}`, accept: [], hint: `$(${A[i - 1][0]})(${A[0][j - 1]}) + (${A[i - 1][1]})(${A[1][j - 1]}) + (${A[i - 1][2]})(${A[2][j - 1]})$.` },
      { instruction: `Compute $(A^2)_{${i}${i}}$ — two-hop routes from server ${i} back to itself.`, answer: `${A2[i - 1][i - 1]}`, accept: [], hint: `Out and back along each link at server ${i} — this equals the number of direct links it has.` },
    ],
    finalAnswer: { value: `${A2[i - 1][j - 1]}`, unit: "routes" },
    solutionNarrative: `$(A^2)_{${i}${j}} = ${A2[i - 1][j - 1]}$ two-hop routes; $(A^2)_{${i}${i}} = ${A2[i - 1][i - 1]}$ equals server ${i}'s link count (out and straight back).`,
  };
};

// ===========================================================================
// matrix-algebra.matrix-transformations
// Existing: transform-apply-v1 (apply-transformation, d1),
//           rotation-v1 (rotation-reflection-scaling, d2)
// ===========================================================================

// --- apply-transformation d2: apply a matrix entry by entry ---
fill["mxa-apply-2"] = (rng, idx) => {
  let A;
  do { A = rand2x2(rng, -4, 4); } while (A.flat().every((v) => v === 0));
  const v = [nz(rng, -5, 5), nz(rng, -5, 5)];
  const r = matVec(A, v);
  return {
    id: `gen.mxa-apply-2.${idx}`, generated: true, concepts: ["apply-transformation"], difficulty: 2, context: "abstract",
    prompt: `Apply the transformation $${ltx(A)}$ to the point $(${v.join(", ")})$, computing one coordinate at a time.`,
    steps: [
      { instruction: `Compute the new $x$-coordinate: $(${A[0][0]})(${v[0]}) + (${A[0][1]})(${v[1]})$.`, answer: `${r[0]}`, accept: [], hint: "Top row of the matrix dot the point." },
      { instruction: `Compute the new $y$-coordinate: $(${A[1][0]})(${v[0]}) + (${A[1][1]})(${v[1]})$.`, answer: `${r[1]}`, accept: [], hint: "Bottom row of the matrix dot the point." },
      { instruction: "State the image point.", answer: pt(r), accept: [vec(r), `${r[0]}, ${r[1]}`], hint: "Stack the two coordinates you computed." },
    ],
    finalAnswer: { value: pt(r), unit: "" },
    solutionNarrative: `Each output coordinate is a row of the matrix dotted with the input: image $(${r.join(", ")})$.`,
  };
};

// --- apply-transformation d3: transform two vertices of a shape ---
const SHAPE_CTX = [
  { obj: "a game sprite", pts: "two corners of its bounding box" },
  { obj: "a robot arm's tool plate", pts: "two mounting bolts" },
  { obj: "a drone's camera footprint", pts: "two marked corners" },
];
fill["mxa-apply-3"] = (rng, idx) => {
  const ctx = rng.pick(SHAPE_CTX);
  let A;
  do { A = rand2x2(rng, -3, 3); } while (det2(A) === 0);
  const P = [nz(rng, -4, 4), nz(rng, -4, 4)];
  let Q;
  do { Q = [nz(rng, -4, 4), nz(rng, -4, 4)]; } while (Q[0] === P[0] && Q[1] === P[1]);
  const rP = matVec(A, P), rQ = matVec(A, Q);
  return {
    id: `gen.mxa-apply-3.${idx}`, generated: true, concepts: ["apply-transformation"], difficulty: 3, context: "applied",
    prompt: `A graphics engine transforms ${ctx.obj} by the matrix $${ltx(A)}$. Find the images of ${ctx.pts}, $P(${P.join(", ")})$ and $Q(${Q.join(", ")})$.`,
    steps: [
      { instruction: `Apply the matrix to $P(${P.join(", ")})$ and give the image as a point.`, answer: pt(rP), accept: [vec(rP), `${rP[0]}, ${rP[1]}`], hint: `New $x$: $(${A[0][0]})(${P[0]}) + (${A[0][1]})(${P[1]})$.` },
      { instruction: `Apply the matrix to $Q(${Q.join(", ")})$ and give the image as a point.`, answer: pt(rQ), accept: [vec(rQ), `${rQ[0]}, ${rQ[1]}`], hint: "Same matrix, same recipe — rows dot the point." },
    ],
    finalAnswer: { value: `${pt(rP)} and ${pt(rQ)}`, unit: "" },
    solutionNarrative: `The same matrix moves every point by the same rule: $P \\to (${rP.join(", ")})$ and $Q \\to (${rQ.join(", ")})$.`,
  };
};

// --- rotation-reflection-scaling d1: write a named transformation matrix ---
fill["mxa-stdmat-1"] = (rng, idx) => {
  const kind = rng.pick(["rot90", "rot180", "rot270", "reflx", "refly", "scale"]);
  const k = rng.int(2, 5);
  const table = {
    rot90: { M: ROT[90], desc: "rotation by $90°$ counterclockwise about the origin", why: "It sends $(1, 0) \\to (0, 1)$ and $(0, 1) \\to (-1, 0)$ — those images are the columns." },
    rot180: { M: ROT[180], desc: "rotation by $180°$ about the origin", why: "Both basis vectors flip sign, so the columns are $(-1, 0)$ and $(0, -1)$." },
    rot270: { M: ROT[270], desc: "rotation by $270°$ counterclockwise about the origin", why: "It sends $(1, 0) \\to (0, -1)$ and $(0, 1) \\to (1, 0)$ — those images are the columns." },
    reflx: { M: REFL_X, desc: "reflection across the $x$-axis", why: "$x$ stays, $y$ flips: columns $(1, 0)$ and $(0, -1)$." },
    refly: { M: REFL_Y, desc: "reflection across the $y$-axis", why: "$x$ flips, $y$ stays: columns $(-1, 0)$ and $(0, 1)$." },
    scale: { M: [[k, 0], [0, k]], desc: `scaling by a factor of ${k} about the origin`, why: `Both basis vectors stretch by ${k}: the matrix is ${k} times the identity.` },
  };
  const t = table[kind];
  return {
    id: `gen.mxa-stdmat-1.${idx}`, generated: true, concepts: ["rotation-reflection-scaling"], difficulty: 1, context: "abstract",
    prompt: `Write the $2 \\times 2$ matrix for ${t.desc}, in row-major bracket form.`,
    steps: [
      { instruction: "The columns are the images of $(1, 0)$ and $(0, 1)$. Enter the matrix as [[a, b], [c, d]].", answer: matStr(t.M), accept: [], hint: "Track where each basis vector lands; those landing spots ARE the columns." },
    ],
    finalAnswer: { value: matStr(t.M), unit: "" },
    solutionNarrative: `${t.why} Matrix: $${matStr(t.M)}$.`,
  };
};

// --- rotation-reflection-scaling d3: identify a transformation from its matrix ---
fill["mxa-classify-3"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const kind = rng.pick([
    { M: ROT[90], word: "rotation", tell: "columns are unit vectors at right angles with determinant $+1$", follow: "a $90°$ counterclockwise rotation" },
    { M: ROT[270], word: "rotation", tell: "columns are unit vectors at right angles with determinant $+1$", follow: "a $270°$ counterclockwise rotation" },
    { M: REFL_X, word: "reflection", tell: "it fixes the $x$-axis and flips $y$ (determinant $-1$)", follow: "a reflection across the $x$-axis" },
    { M: REFL_Y, word: "reflection", tell: "it fixes the $y$-axis and flips $x$ (determinant $-1$)", follow: "a reflection across the $y$-axis" },
    { M: REFL_DIAG, word: "reflection", tell: "it swaps the coordinates (determinant $-1$)", follow: "a reflection across the line $y = x$" },
    { M: [[k, 0], [0, k]], word: "scaling", tell: `it is ${k} times the identity`, follow: `a scaling by factor ${k}` },
  ]);
  const p = [nz(rng, -4, 4), nz(rng, -4, 4)];
  const img = matVec(kind.M, p);
  return {
    id: `gen.mxa-classify-3.${idx}`, generated: true, concepts: ["rotation-reflection-scaling"], difficulty: 3, context: "abstract",
    prompt: `A transformation has matrix $${ltx(kind.M)}$. Identify what kind of transformation it is, then use it.`,
    steps: [
      { instruction: "Classify the transformation. Answer with one of: rotation, reflection, scaling.", answer: kind.word, accept: [], hint: "Check where $(1, 0)$ and $(0, 1)$ go, and whether lengths or orientation change." },
      { instruction: `Apply the matrix to the point $(${p.join(", ")})$ and give the image.`, answer: pt(img), accept: [vec(img), `${img[0]}, ${img[1]}`], hint: "Rows of the matrix dot the point." },
    ],
    finalAnswer: { value: kind.word, unit: "" },
    solutionNarrative: `This matrix is ${kind.follow}: ${kind.tell}. It sends $(${p.join(", ")})$ to $(${img.join(", ")})$.`,
  };
};

// --- composition-of-transformations d1: multiply a scaling and a rotation ---
fill["mxa-compose-1"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const deg = rng.pick([90, 270]);
  const S = [[k, 0], [0, k]], R = ROT[deg];
  const C = matMul(R, S); // scale first, then rotate
  return {
    id: `gen.mxa-compose-1.${idx}`, generated: true, concepts: ["composition-of-transformations"], difficulty: 1, context: "abstract",
    prompt: `A figure is first scaled by ${k} (matrix $S = ${ltx(S)}$), then rotated $${deg}°$ counterclockwise (matrix $R = ${ltx(R)}$). The combined transformation is the product $RS$ — the FIRST transformation sits on the right.`,
    steps: [
      { instruction: "Compute $RS$ and write it as [[a, b], [c, d]].", answer: matStr(C), accept: [], hint: "Rows of $R$ dot columns of $S$." },
    ],
    finalAnswer: { value: matStr(C), unit: "" },
    solutionNarrative: `$RS = ${matStr(C)}$ — a rotation combined with a scaling, applied right-to-left.`,
  };
};

// --- composition-of-transformations d2: composing two rotations adds angles ---
fill["mxa-compose-2"] = (rng, idx) => {
  const a1 = rng.pick([90, 180, 270]), a2 = rng.pick([90, 180, 270]);
  const total = (a1 + a2) % 360;
  const M = ROT[total];
  return {
    id: `gen.mxa-compose-2.${idx}`, generated: true, concepts: ["composition-of-transformations"], difficulty: 2, context: "abstract",
    prompt: `A shape is rotated $${a1}°$ counterclockwise about the origin, then rotated another $${a2}°$ counterclockwise. Describe the single equivalent transformation.`,
    steps: [
      { instruction: "Rotations about the same point compose by ADDING angles. What single angle (in degrees, from 0 up to 359) is the combined rotation?", answer: `${total}`, accept: [], hint: `$${a1} + ${a2} = ${a1 + a2}$; subtract $360$ if that is $360$ or more.` },
      { instruction: `Write the matrix of the combined ${total === 0 ? "transformation (the identity)" : `$${total}°$ rotation`} as [[a, b], [c, d]].`, answer: matStr(M), accept: [], hint: "The columns are the images of $(1, 0)$ and $(0, 1)$." },
    ],
    finalAnswer: { value: `${total}°`, unit: "" },
    solutionNarrative: `$${a1}° + ${a2}° \\equiv ${total}°$ (mod $360°$)${total === 0 ? " — the shape returns to its start, so the matrix is the identity" : ""}: $${matStr(M)}$.`,
  };
};

// --- composition-of-transformations d3: order matters (non-uniform scaling) ---
fill["mxa-compose-3"] = (rng, idx) => {
  const k1 = rng.int(2, 4), k2 = rng.int(2, 4);
  const S = [[k1, 0], [0, k2]], R = ROT[90];
  const RS = matMul(R, S); // scale then rotate
  const SR = matMul(S, R); // rotate then scale
  const same = matEq(RS, SR);
  return {
    id: `gen.mxa-compose-3.${idx}`, generated: true, concepts: ["composition-of-transformations"], difficulty: 3, context: "abstract",
    prompt: `Let $S = ${ltx(S)}$ (scaling $x$ by ${k1} and $y$ by ${k2}) and $R = ${ltx(R)}$ (rotation by $90°$). Compare the two orders of composition.`,
    steps: [
      { instruction: "Scaling FIRST, then rotating, is the product $RS$. Compute it as [[a, b], [c, d]].", answer: matStr(RS), accept: [], hint: "The first transformation applied sits on the right of the product." },
      { instruction: "Rotating FIRST, then scaling, is the product $SR$. Compute it as [[a, b], [c, d]].", answer: matStr(SR), accept: [], hint: "Now $R$ sits on the right." },
      { instruction: "Do the two orders give the same transformation here? Answer 'yes' or 'no'.", answer: same ? "yes" : "no", accept: [], hint: same ? "With equal scale factors the scaling is uniform — it commutes with rotations." : "Compare the matrices entry by entry." },
    ],
    finalAnswer: { value: same ? "yes" : "no", unit: "" },
    solutionNarrative: same
      ? `Because $${k1} = ${k2}$, $S$ is a uniform scaling ($${k1}I$), which commutes with every rotation: both orders give $${matStr(RS)}$.`
      : `$RS = ${matStr(RS)}$ but $SR = ${matStr(SR)}$ — with unequal scale factors (${k1} vs ${k2}), the order of transformations changes the result.`,
  };
};

// --- applications d1: uniform scaling multiplies area by k^2 ---
const AREA_CTX = ["logo", "map icon", "sticker design", "floor-plan tile"];
fill["mxa-area-1"] = (rng, idx) => {
  const k = rng.int(2, 5), a0 = rng.int(3, 12);
  const obj = rng.pick(AREA_CTX);
  return {
    id: `gen.mxa-area-1.${idx}`, generated: true, concepts: ["applications"], difficulty: 1, context: "applied",
    prompt: `A ${obj} with area ${a0} cm² is enlarged by the scaling matrix $${ltx([[k, 0], [0, k]])}$.`,
    steps: [
      { instruction: `Lengths stretch by ${k}, so area multiplies by $${k}^2$. Compute that area factor.`, answer: `${k * k}`, accept: [], hint: "Area is two-dimensional: the factor applies twice." },
      { instruction: "Compute the area of the enlarged design.", answer: `${k * k * a0}`, accept: [], hint: `$${k * k} \\times ${a0}$.` },
    ],
    finalAnswer: { value: `${k * k * a0}`, unit: "cm²" },
    solutionNarrative: `Scaling by ${k} multiplies area by $${k}^2 = ${k * k}$: new area $${k * k} \\cdot ${a0} = ${k * k * a0}$ cm².`,
  };
};

// --- applications d2: |det| as the area factor of a general matrix ---
fill["mxa-area-2"] = (rng, idx) => {
  let A;
  do { A = rand2x2(rng, -4, 4); } while (det2(A) === 0);
  const d = det2(A), a0 = rng.int(2, 10);
  return {
    id: `gen.mxa-area-2.${idx}`, generated: true, concepts: ["applications"], difficulty: 2, context: "applied",
    prompt: `A CAD program transforms a part outline of area ${a0} cm² by the matrix $${ltx(A)}$. The area of the image is $|\\det|$ times the original.`,
    steps: [
      { instruction: "Compute the determinant $ad - bc$.", answer: `${d}`, accept: [], hint: `$(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})$.` },
      { instruction: "Multiply the original area by $|\\det|$ to get the image's area.", answer: `${Math.abs(d) * a0}`, accept: [], hint: `$|${d}| \\times ${a0}$.` },
    ],
    finalAnswer: { value: `${Math.abs(d) * a0}`, unit: "cm²" },
    solutionNarrative: `$\\det = ${d}$, so every region's area multiplies by $|${d}| = ${Math.abs(d)}$: new area ${Math.abs(d) * a0} cm².`,
  };
};

// --- applications d3: area factor plus orientation from the determinant's sign ---
fill["mxa-area-3"] = (rng, idx) => {
  let A;
  do { A = rand2x2(rng, -5, 5); } while (det2(A) === 0);
  const d = det2(A), a0 = rng.int(2, 8);
  const preserved = d > 0;
  return {
    id: `gen.mxa-area-3.${idx}`, generated: true, concepts: ["applications"], difficulty: 3, context: "applied",
    prompt: `A physics simulation deforms a triangular mesh cell of area ${a0} units² by the matrix $${ltx(A)}$. The determinant tells you both the area change and whether the cell got flipped.`,
    steps: [
      { instruction: "Compute the determinant $ad - bc$.", answer: `${d}`, accept: [], hint: `$(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})$.` },
      { instruction: "Compute the area of the deformed cell ($|\\det|$ times the original area).", answer: `${Math.abs(d) * a0}`, accept: [], hint: `$|${d}| \\times ${a0}$ — area uses the absolute value.` },
      { instruction: "Is the cell's orientation preserved (no mirror flip)? Answer 'yes' or 'no'.", answer: preserved ? "yes" : "no", accept: [], hint: "Positive determinant preserves orientation; negative flips it." },
    ],
    finalAnswer: { value: `${Math.abs(d) * a0}`, unit: "units²" },
    solutionNarrative: `$\\det = ${d}$: area multiplies by $|${d}| = ${Math.abs(d)}$ giving ${Math.abs(d) * a0} units², and the ${preserved ? "positive" : "negative"} sign means orientation is ${preserved ? "preserved" : "reversed (the cell is mirror-flipped)"}.`,
  };
};
