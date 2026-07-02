// gen-linalg-fill2.js
// Parametric problem generators for the linear-algebra.diagonalization topic
// (Diagonalization and Matrix Powers). Self-contained: exports a `fill` map of
// template-name -> (rng, idx) => problemObject, matching the same object shape
// used by js/generator.js's internal generators. Does not import from or
// modify js/generator.js. Prefix: laf2- (laf- is taken by gen-linalg-fill.js).
//
// Design notes: every matrix is BUILT from chosen integer eigenvalues and
// integer eigenvectors (A = P D P^{-1} with det P = 1, P = [[1,1],[m,m+1]]),
// so all answers stay small integers / exact tenths. D is always requested
// with eigenvalues in increasing order and eigenvector scaling is pinned in
// the instruction.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const mat2 = (m) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;
const divisorsOf = (n) => { const out = []; for (let i = 1; i <= n; i++) if (n % i === 0) out.push(i); return out; };
// A = P D P^{-1} for P = [[1,1],[m,m+1]] (det 1), D = diag(l1, l2).
const buildA = (l1, l2, m) => [
  [l1 * (m + 1) - l2 * m, l2 - l1],
  [m * (m + 1) * (l1 - l2), (m + 1) * l2 - m * l1],
];

export const fill = {};

// ============================================================================
// eigen-recap-and-multiplicity
// ============================================================================

fill["laf2-eigen-recap-d1"] = (rng, idx) => {
  const l1 = nz(rng, -4, 5);
  let l2 = nz(rng, -4, 5);
  while (l2 === l1) l2 = nz(rng, -4, 5);
  const A = [[l1, 0], [0, l2]];
  return {
    id: `gen.laf2-eigen-recap-d1.${idx}`, generated: true, concepts: ["eigen-recap-and-multiplicity"], difficulty: 1, context: "abstract",
    prompt: `Find the eigenvalues of $${mat2(A)}$ and state whether it is diagonalizable.`,
    steps: [
      { instruction: "A diagonal matrix shows its eigenvalues on the diagonal. State both.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: "Read the diagonal entries." },
      { instruction: "The eigenvalues are distinct. Is the matrix diagonalizable? (yes/no)", answer: "yes", accept: ["y"], hint: "Distinct eigenvalues always give a full set of independent eigenvectors — and this matrix is already diagonal." },
    ],
    finalAnswer: { value: "yes", unit: "" }, solutionNarrative: `Eigenvalues $${l1}$ and $${l2}$ are distinct, so the matrix is diagonalizable (it is already diagonal).`,
  };
};

fill["laf2-eigen-recap-d2"] = (rng, idx) => {
  const a = nz(rng, -4, 4);
  let d = nz(rng, -4, 4);
  while (d === a) d = nz(rng, -4, 4);
  const b = nz(rng, -3, 3);
  const A = [[a, b], [0, d]];
  const tr = a + d, det = a * d;
  return {
    id: `gen.laf2-eigen-recap-d2.${idx}`, generated: true, concepts: ["eigen-recap-and-multiplicity"], difficulty: 2, context: "abstract",
    prompt: `Find the eigenvalues of the triangular matrix $A = ${mat2(A)}$ via the characteristic equation, then decide whether $A$ is diagonalizable.`,
    steps: [
      { instruction: "State the trace and determinant.", answer: `tr = ${tr}, det = ${det}`, accept: [`${tr}, ${det}`], hint: "Trace is the diagonal sum; determinant is $ad - bc$ (here $ad$ since the lower-left entry is 0)." },
      { instruction: "Solve $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$ for both eigenvalues.", form: "solutions", answer: `lambda = ${a} or lambda = ${d}`, accept: [`${a}, ${d}`, `${d}, ${a}`], hint: "A triangular matrix wears its eigenvalues on the diagonal — the quadratic just confirms it." },
      { instruction: "The eigenvalues are distinct. Is $A$ diagonalizable? (yes/no)", answer: "yes", accept: ["y"], hint: "Two distinct eigenvalues guarantee two independent eigenvectors." },
    ],
    finalAnswer: { value: "yes", unit: "" }, solutionNarrative: `Eigenvalues $${a}$ and $${d}$ (the diagonal of a triangular matrix) are distinct, so $A$ is diagonalizable.`,
  };
};

fill["laf2-eigen-recap-d3"] = (rng, idx) => {
  const repeated = rng.int(0, 1) === 0;
  if (repeated) {
    const l = nz(rng, -4, 4), k = nz(rng, 1, 3);
    const A = [[l, k], [0, l]];
    return {
      id: `gen.laf2-eigen-recap-d3.${idx}`, generated: true, concepts: ["eigen-recap-and-multiplicity"], difficulty: 3, context: "abstract",
      prompt: `The shear-like matrix $A = ${mat2(A)}$ has a repeated eigenvalue. Find it, count the independent eigenvector directions, and decide diagonalizability.`,
      steps: [
        { instruction: "Both diagonal slots of this triangular matrix hold the same number. What is the repeated eigenvalue?", answer: `${l}`, accept: [`lambda = ${l}`, `${l}, ${l}`], hint: `Both diagonal entries are ${l}.` },
        { instruction: `$(A - ${l}I) = ${mat2([[0, k], [0, 0]])}$ forces $v_2 = 0$. How many independent eigenvector directions does $A$ have?`, answer: "1", accept: ["one"], hint: "Every eigenvector is a multiple of $\\langle 1, 0 \\rangle$." },
        { instruction: "A $2\\times 2$ needs 2 independent eigenvectors to diagonalize. Is $A$ diagonalizable? (yes/no)", answer: "no", accept: ["n", "not diagonalizable"], hint: "One eigenvector direction cannot fill both columns of an invertible $P$." },
      ],
      finalAnswer: { value: "no", unit: "" }, solutionNarrative: `$\\lambda = ${l}$ is repeated but yields only the direction $\\langle 1, 0 \\rangle$, so $A$ is not diagonalizable.`,
    };
  }
  const a = nz(rng, -4, 4);
  let d = nz(rng, -4, 4);
  while (d === a) d = nz(rng, -4, 4);
  const b = nz(rng, 1, 3);
  const A = [[a, b], [0, d]];
  return {
    id: `gen.laf2-eigen-recap-d3.${idx}`, generated: true, concepts: ["eigen-recap-and-multiplicity"], difficulty: 3, context: "abstract",
    prompt: `For $A = ${mat2(A)}$: find the eigenvalues, count the independent eigenvector directions, and decide diagonalizability.`,
    steps: [
      { instruction: "State both eigenvalues of this triangular matrix.", form: "solutions", answer: `lambda = ${a} or lambda = ${d}`, accept: [`${a}, ${d}`, `${d}, ${a}`], hint: "Read the diagonal." },
      { instruction: "Each distinct eigenvalue contributes its own eigenvector direction. How many independent directions in total?", answer: "2", accept: ["two"], hint: "Eigenvectors for different eigenvalues are automatically independent." },
      { instruction: "Is $A$ diagonalizable? (yes/no)", answer: "yes", accept: ["y"], hint: "Two independent eigenvectors fill the columns of an invertible $P$." },
    ],
    finalAnswer: { value: "yes", unit: "" }, solutionNarrative: `Distinct eigenvalues $${a}$ and $${d}$ give two independent eigenvectors: $A$ is diagonalizable.`,
  };
};

// ============================================================================
// build-p-and-d
// ============================================================================

fill["laf2-build-pd-d1"] = (rng, idx) => {
  const l1 = rng.int(-3, 2), l2 = l1 + rng.int(1, 4);
  const p = rng.int(-3, 3), q = p + nz(rng, -2, 2);
  return {
    id: `gen.laf2-build-pd-d1.${idx}`, generated: true, concepts: ["build-p-and-d"], difficulty: 1, context: "abstract",
    prompt: `A $2\\times 2$ matrix has eigenvalue $\\lambda = ${l1}$ with eigenvector $\\langle 1, ${p} \\rangle$ and $\\lambda = ${l2}$ with eigenvector $\\langle 1, ${q} \\rangle$. Build $D$ and $P$ with the eigenvalues in increasing order along the diagonal.`,
    steps: [
      { instruction: "Write $D$ with the eigenvalues in increasing order along the diagonal, as $[[a, b], [c, d]]$.", answer: mat2([[l1, 0], [0, l2]]), accept: [], hint: `$${l1}$ first, then $${l2}$; zeros off the diagonal.` },
      { instruction: "Write $P$ whose columns are the corresponding eigenvectors in the same order.", answer: mat2([[1, 1], [p, q]]), accept: [], hint: `Column 1 is $\\langle 1, ${p} \\rangle$ (for $\\lambda = ${l1}$), column 2 is $\\langle 1, ${q} \\rangle$.` },
    ],
    finalAnswer: { value: mat2([[1, 1], [p, q]]), unit: "" }, solutionNarrative: `$D = ${mat2([[l1, 0], [0, l2]])}$, $P = ${mat2([[1, 1], [p, q]])}$ — column $k$ of $P$ matches slot $k$ of $D$.`,
  };
};

fill["laf2-build-pd-d2"] = (rng, idx) => {
  const a = rng.int(-3, 3), b = rng.int(1, 3), t = rng.int(1, 3);
  const d = a + b * t; // ensures a < d and eigenvector <1, t> for lambda = d
  const A = [[a, b], [0, d]];
  return {
    id: `gen.laf2-build-pd-d2.${idx}`, generated: true, concepts: ["build-p-and-d"], difficulty: 2, context: "abstract",
    prompt: `Diagonalize the triangular matrix $A = ${mat2(A)}$: find the eigenvalues and eigenvectors (first entry 1), then $D$ and $P$ with eigenvalues in increasing order along the diagonal.`,
    steps: [
      { instruction: "State both eigenvalues.", form: "solutions", answer: `lambda = ${a} or lambda = ${d}`, accept: [`${a}, ${d}`, `${d}, ${a}`], hint: "A triangular matrix shows its eigenvalues on the diagonal." },
      { instruction: `For $\\lambda = ${d}$, solve $(A - ${d}I)\\vec v = \\vec 0$ and give the eigenvector with first entry 1 as $\\langle 1, t \\rangle$.`, answer: `<1, ${t}>`, accept: [`(1, ${t})`, `1, ${t}`], hint: `Row 1 gives $(${a - d}) + ${b}t = 0$.` },
      { instruction: `The eigenvector for $\\lambda = ${a}$ is $\\langle 1, 0 \\rangle$. Write $D$ with the eigenvalues in increasing order.`, answer: mat2([[a, 0], [0, d]]), accept: [], hint: `$${a}$ first, then $${d}$.` },
      { instruction: "Write $P$ with the matching eigenvector columns.", answer: mat2([[1, 1], [0, t]]), accept: [], hint: `Column 1 is $\\langle 1, 0 \\rangle$, column 2 is $\\langle 1, ${t} \\rangle$.` },
    ],
    finalAnswer: { value: mat2([[1, 1], [0, t]]), unit: "" }, solutionNarrative: `Eigenvalues $${a} < ${d}$ with eigenvectors $\\langle 1, 0 \\rangle$ and $\\langle 1, ${t} \\rangle$: $D = ${mat2([[a, 0], [0, d]])}$, $P = ${mat2([[1, 1], [0, t]])}$.`,
  };
};

fill["laf2-build-pd-d3"] = (rng, idx) => {
  const m = rng.int(1, 3);
  const l1 = rng.int(-2, 2), l2 = l1 + rng.int(1, 3);
  const A = buildA(l1, l2, m);
  const tr = l1 + l2, det = l1 * l2;
  return {
    id: `gen.laf2-build-pd-d3.${idx}`, generated: true, concepts: ["build-p-and-d"], difficulty: 3, context: "abstract",
    prompt: `Run the full pipeline on $A = ${mat2(A)}$, whose eigenvectors are $\\langle 1, ${m} \\rangle$ (smaller eigenvalue) and $\\langle 1, ${m + 1} \\rangle$ (larger eigenvalue): find the eigenvalues, then $D$, $P$, and $P^{-1}$, with eigenvalues in increasing order along the diagonal.`,
    steps: [
      { instruction: "State the trace and determinant of $A$.", answer: `tr = ${tr}, det = ${det}`, accept: [`${tr}, ${det}`], hint: "Add the diagonal; compute $ad - bc$." },
      { instruction: "Solve $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$ for both eigenvalues.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: `Factor: $(\\lambda - (${l1}))(\\lambda - (${l2})) = 0$.` },
      { instruction: "Write $D$ with the eigenvalues in increasing order.", answer: mat2([[l1, 0], [0, l2]]), accept: [], hint: `$${l1}$ first, then $${l2}$.` },
      { instruction: "Write $P$ with the matching eigenvector columns.", answer: mat2([[1, 1], [m, m + 1]]), accept: [], hint: `Column 1 is $\\langle 1, ${m} \\rangle$, column 2 is $\\langle 1, ${m + 1} \\rangle$.` },
      { instruction: "Compute $P^{-1}$ (note $\\det P = 1$).", answer: mat2([[m + 1, -1], [-m, 1]]), accept: [], hint: "With determinant 1: swap the diagonal entries, negate the off-diagonal ones." },
    ],
    finalAnswer: { value: mat2([[m + 1, -1], [-m, 1]]), unit: "" }, solutionNarrative: `Eigenvalues $${l1} < ${l2}$: $D = ${mat2([[l1, 0], [0, l2]])}$, $P = ${mat2([[1, 1], [m, m + 1]])}$, $P^{-1} = ${mat2([[m + 1, -1], [-m, 1]])}$.`,
  };
};

// ============================================================================
// matrix-powers
// ============================================================================

fill["laf2-matrix-powers-d1"] = (rng, idx) => {
  const d1v = nz(rng, -3, 3), d2v = nz(rng, -3, 3), k = rng.int(2, 3);
  const p1 = Math.pow(d1v, k), p2 = Math.pow(d2v, k);
  const D = [[d1v, 0], [0, d2v]];
  return {
    id: `gen.laf2-matrix-powers-d1.${idx}`, generated: true, concepts: ["matrix-powers"], difficulty: 1, context: "abstract",
    prompt: `Compute $D^${k}$ for the diagonal matrix $D = ${mat2(D)}$.`,
    steps: [
      { instruction: `Raise the first diagonal entry to the ${k}th power: $(${d1v})^${k} = ?$`, answer: `${p1}`, accept: [], hint: `Multiply ${d1v} by itself ${k} times, watching the sign.` },
      { instruction: `Write the full matrix $D^${k}$ as $[[a, b], [c, d]]$.`, answer: mat2([[p1, 0], [0, p2]]), accept: [], hint: "Each diagonal entry is powered independently; zeros stay zero." },
    ],
    finalAnswer: { value: mat2([[p1, 0], [0, p2]]), unit: "" }, solutionNarrative: `$D^${k} = ${mat2([[p1, 0], [0, p2]])}$ — powers of a diagonal matrix are entry-wise.`,
  };
};

fill["laf2-matrix-powers-d2"] = (rng, idx) => {
  const m = rng.int(1, 3);
  const l1 = rng.pick([1, -1]);
  const l2 = rng.int(2, 3);
  const k = l2 === 3 ? 2 : rng.int(2, 3);
  const c1 = rng.int(1, 3), c2 = rng.int(1, 3);
  const A = buildA(l1, l2, m);
  const v = [c1 + c2, c1 * m + c2 * (m + 1)];
  const r1 = c1 * Math.pow(l1, k), r2 = c2 * Math.pow(l2, k);
  const res = [r1 + r2, r1 * m + r2 * (m + 1)];
  return {
    id: `gen.laf2-matrix-powers-d2.${idx}`, generated: true, concepts: ["matrix-powers"], difficulty: 2, context: "abstract",
    prompt: `The matrix $A = ${mat2(A)}$ has eigenpairs $\\lambda = ${l1}$ with $\\vec v_1 = \\langle 1, ${m} \\rangle$ and $\\lambda = ${l2}$ with $\\vec v_2 = \\langle 1, ${m + 1} \\rangle$. Compute $A^${k}\\vec v$ for $\\vec v = \\langle ${v.join(", ")} \\rangle$ without multiplying matrices.`,
    steps: [
      { instruction: `Expand $\\vec v = c_1\\vec v_1 + c_2\\vec v_2$: solve $c_1 + c_2 = ${v[0]}$ and $${m}c_1 + ${m + 1}c_2 = ${v[1]}$ for $(c_1, c_2)$.`, answer: `c1 = ${c1}, c2 = ${c2}`, accept: [`(${c1}, ${c2})`, `${c1}, ${c2}`], hint: `Subtract ${m} times the first equation from the second to isolate $c_2$.` },
      { instruction: `Compute $A^${k}\\vec v = c_1(${l1})^${k}\\vec v_1 + c_2(${l2})^${k}\\vec v_2$ as $\\langle x, y \\rangle$.`, answer: `<${res.join(", ")}>`, accept: [`(${res.join(", ")})`, `${res.join(", ")}`], hint: `$${r1}\\langle 1, ${m} \\rangle + ${r2}\\langle 1, ${m + 1} \\rangle$.` },
    ],
    finalAnswer: { value: `<${res.join(", ")}>`, unit: "" }, solutionNarrative: `$\\vec v = ${c1}\\vec v_1 + ${c2}\\vec v_2$, so $A^${k}\\vec v = ${r1}\\langle 1, ${m} \\rangle + ${r2}\\langle 1, ${m + 1} \\rangle = \\langle ${res.join(", ")} \\rangle$.`,
  };
};

fill["laf2-matrix-powers-d3"] = (rng, idx) => {
  const m = rng.int(1, 2);
  const l1 = rng.pick([-1, 0, 1]);
  const l2 = rng.int(2, 3);
  const k = l2 === 3 ? 2 : rng.int(2, 3);
  const A = buildA(l1, l2, m);
  const p1 = Math.pow(l1, k), p2 = Math.pow(l2, k);
  const Ak = buildA(p1, p2, m);
  const P = [[1, 1], [m, m + 1]], Pinv = [[m + 1, -1], [-m, 1]];
  return {
    id: `gen.laf2-matrix-powers-d3.${idx}`, generated: true, concepts: ["matrix-powers"], difficulty: 3, context: "abstract",
    prompt: `Compute $A^${k}$ for $A = ${mat2(A)}$ using its diagonalization $A = PDP^{-1}$ with $P = ${mat2(P)}$, $D = ${mat2([[l1, 0], [0, l2]])}$, $P^{-1} = ${mat2(Pinv)}$.`,
    steps: [
      { instruction: `Compute $D^${k}$.`, answer: mat2([[p1, 0], [0, p2]]), accept: [], hint: `Raise each diagonal entry to the ${k}th power.` },
      { instruction: `Finish: $A^${k} = P D^${k} P^{-1}$.`, answer: mat2(Ak), accept: [], hint: `First $PD^${k} = ${mat2([[p1, p2], [m * p1, (m + 1) * p2]])}$ (the diagonal scales $P$'s columns), then multiply by $P^{-1}$.` },
    ],
    finalAnswer: { value: mat2(Ak), unit: "" }, solutionNarrative: `$A^${k} = P${mat2([[p1, 0], [0, p2]])}P^{-1} = ${mat2(Ak)}$. Check: trace $${Ak[0][0] + Ak[1][1]} = ${p1} + ${p2}$.`,
  };
};

// ============================================================================
// dynamics-applications
// ============================================================================

fill["laf2-dynamics-d1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = rng.int(1, 5); // switch rates in tenths
  const g = gcd(a, b);
  const v = [b / g, a / g];
  const M = [[(10 - a) / 10, b / 10], [a / 10, (10 - b) / 10]];
  return {
    id: `gen.laf2-dynamics-d1.${idx}`, generated: true, concepts: ["dynamics-applications"], difficulty: 1, context: "applied",
    prompt: `A two-region migration model uses the Markov matrix $A = ${mat2(M)}$ (columns sum to 1). Find the dominant eigenvalue and the steady-state direction.`,
    steps: [
      { instruction: "Every Markov matrix has the same dominant eigenvalue. What is it?", answer: "1", accept: ["lambda = 1"], hint: "The steady state is neither grown nor shrunk — it is scaled by exactly 1." },
      { instruction: "Solve $(A - I)\\vec v = \\vec 0$ and give the steady-state eigenvector with smallest positive integer entries as $\\langle v_1, v_2 \\rangle$.", answer: `<${v[0]}, ${v[1]}>`, accept: [`(${v[0]}, ${v[1]})`, `${v[0]}, ${v[1]}`], hint: `The top row of $A - I$ gives $-${a / 10}v_1 + ${b / 10}v_2 = 0$, i.e. $${a}v_1 = ${b}v_2$.` },
    ],
    finalAnswer: { value: `<${v[0]}, ${v[1]}>`, unit: "" }, solutionNarrative: `The dominant eigenvalue of a Markov matrix is $1$; $(A - I)\\vec v = \\vec 0$ gives $${a}v_1 = ${b}v_2$, so the steady state is $\\langle ${v[0]}, ${v[1]} \\rangle$.`,
  };
};

fill["laf2-dynamics-d2"] = (rng, idx) => {
  const a = rng.int(1, 5), b = rng.int(1, 5);
  const g = gcd(a, b);
  const v = [b / g, a / g];
  const second = (10 - a - b) / 10;
  const share = frac(b, a + b);
  const M = [[(10 - a) / 10, b / 10], [a / 10, (10 - b) / 10]];
  return {
    id: `gen.laf2-dynamics-d2.${idx}`, generated: true, concepts: ["dynamics-applications"], difficulty: 2, context: "applied",
    prompt: `Two competing services trade customers monthly by the Markov matrix $A = ${mat2(M)}$. Find the steady state, the second eigenvalue (which sets the convergence speed), and service 1's long-run share.`,
    steps: [
      { instruction: "Solve $(A - I)\\vec v = \\vec 0$ and give the steady-state eigenvector with smallest positive integer entries.", answer: `<${v[0]}, ${v[1]}>`, accept: [`(${v[0]}, ${v[1]})`, `${v[0]}, ${v[1]}`], hint: `Top row of $A - I$: $-${a / 10}v_1 + ${b / 10}v_2 = 0$, i.e. $${a}v_1 = ${b}v_2$.` },
      { instruction: "For a $2\\times 2$ Markov matrix the eigenvalues are $1$ and $\\text{trace} - 1$. Find the second eigenvalue.", answer: `${second}`, accept: [frac(10 - a - b, 10)], hint: `Trace $= ${(10 - a) / 10} + ${(10 - b) / 10} = ${(20 - a - b) / 10}$.` },
      { instruction: "Normalize the steady state: what fraction of customers ends up with service 1?", answer: share, accept: [], hint: `$${v[0]}$ out of every $${v[0]} + ${v[1]} = ${v[0] + v[1]}$.` },
    ],
    finalAnswer: { value: share, unit: "" }, solutionNarrative: `Steady state $\\langle ${v[0]}, ${v[1]} \\rangle$, so service 1 keeps $${share}$ of the market; the second eigenvalue $${second}$ multiplies the transient each month.`,
  };
};

fill["laf2-dynamics-d3"] = (rng, idx) => {
  const l1 = rng.int(2, 4);            // dominant growth factor
  const neg = rng.int(1, 3);
  const l2 = -neg;                      // decaying/oscillating mode
  const a = l1 + l2;                    // trace
  const prod = l1 * neg;                // -det
  const b = rng.pick(divisorsOf(prod));
  const c = prod / b;
  const g = gcd(l1, c);
  const v = [l1 / g, c / g];            // eigenvector for l1 from row 2: c*v1 = l1*v2
  const A = [[a, b], [c, 0]];
  return {
    id: `gen.laf2-dynamics-d3.${idx}`, generated: true, concepts: ["dynamics-applications"], difficulty: 3, context: "applied",
    prompt: `A two-stage population (juveniles, adults) updates yearly by $A = ${mat2(A)}$. Find the eigenvalues, the long-run growth factor, and the stable population structure.`,
    steps: [
      { instruction: `Solve the characteristic equation (trace ${a}, determinant ${-prod}) for both eigenvalues.`, form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: `$(\\lambda - ${l1})(\\lambda + ${neg}) = 0$.` },
      { instruction: "The dominant eigenvalue (largest $|\\lambda|$) is the long-run yearly growth factor. What is it?", answer: `${l1}`, accept: [], hint: `Compare $|${l1}|$ and $|${l2}|$.` },
      { instruction: `Find the eigenvector for $\\lambda = ${l1}$ with smallest positive integer entries — the stable juvenile:adult structure.`, answer: `<${v[0]}, ${v[1]}>`, accept: [`(${v[0]}, ${v[1]})`, `${v[0]}, ${v[1]}`], hint: `Row 2 of $(A - ${l1}I)$ gives $${c}v_1 = ${l1}v_2$.` },
    ],
    finalAnswer: { value: `<${v[0]}, ${v[1]}>`, unit: "" }, solutionNarrative: `Eigenvalues $${l1}$ and $${l2}$; the dominant $${l1}$ is the long-run growth factor, with stable structure $\\langle ${v[0]}, ${v[1]} \\rangle$. The $${l2}$ mode fades relative to it.`,
  };
};
