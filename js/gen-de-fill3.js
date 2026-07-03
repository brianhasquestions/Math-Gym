// gen-de-fill3.js
// Parametric generators for differential-equations.systems-of-odes.
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape merged into js/generator.js's registry (same pattern as
// js/gen-de-fill2.js). Prefix: def3- (def-/def2- are taken).
// Every generator constructs the coefficient matrix BACKWARD from chosen
// integer eigenvalues and unimodular integer eigenvectors (A = PDP^-1 with
// det P = ±1), so eigenvalues, eigenvectors, and IVP constants are exact
// integers by construction.

const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const compact = (s) => s.replace(/\s+/g, "");
const expT = (r) => (r === 1 ? "t" : r === -1 ? "-t" : `${r}t`); // exponent string for e^{rt}
const mat2 = (m) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;
const bmat = (m) => `\\begin{bmatrix} ${m[0][0]} & ${m[0][1]} \\\\ ${m[1][0]} & ${m[1][1]} \\end{bmatrix}`;
const vec = (v) => `<${v[0]}, ${v[1]}>`;
const vecAccepts = (v) => [`(${v[0]}, ${v[1]})`, `${v[0]}, ${v[1]}`];

// Characteristic equation string in the site's "lambda" convention.
const charEq = (T, D) => (T === 0 ? `lambda^2 ${signed(D)} = 0` : `lambda^2 ${signed(-T)}lambda ${signed(D)} = 0`);

// Build an integer 2x2 matrix with prescribed DISTINCT NONZERO integer
// eigenvalues l1, l2 and eigenvectors v1 = <1, m>, v2 = <1, n> where
// n = m ± 1 (so P = [[1,1],[m,n]] has det ±1 and P^-1 is integer).
// Both eigenvectors have first component 1, matching the "first component 1"
// normalization used in prompts. Guards: never triangular/diagonal (m, n != 0),
// never repeated or zero eigenvalues, entries kept small.
function eigenPick(rng, lo = -4, hi = 4, opts = {}) {
  for (let tries = 0; tries < 200; tries++) {
    const l1 = nz(rng, lo, hi);
    const l2 = nz(rng, lo, hi);
    if (l1 === l2) continue;
    if (opts.sign === "neg" && (l1 >= 0 || l2 >= 0)) continue;
    if (opts.sign === "pos" && (l1 <= 0 || l2 <= 0)) continue;
    if (opts.sign === "mixed" && l1 * l2 >= 0) continue;
    const m = nz(rng, -2, 2);
    const e = rng.pick([1, -1]);
    const n = m + e;
    if (n === 0) continue;
    const a11 = (l1 * n - l2 * m) / e;
    const a12 = (l2 - l1) / e;
    const a21 = (m * n * (l1 - l2)) / e;
    const a22 = (l2 * n - l1 * m) / e;
    if ([a11, a12, a21, a22].some((x) => Math.abs(x) > 12)) continue;
    return { A: [[a11, a12], [a21, a22]], l1, l2, m, n, v1: [1, m], v2: [1, n], T: l1 + l2, D: l1 * l2 };
  }
  // Deterministic fallback (always valid): eigenvalues 5, 2 with v1=<1,1>, v2=<1,2>.
  return { A: [[8, -3], [6, -1]], l1: 5, l2: 2, m: 1, n: 2, v1: [1, 1], v2: [1, 2], T: 7, D: 10 };
}

export const fill = {};

// ============================================================================
// matrix-form-and-verify — write x' = Ax, verify solutions, convert 2nd order
// ============================================================================

fill["def3-matrix-form-1"] = (rng, idx) => {
  const a = nz(rng, -5, 5), b = nz(rng, -5, 5), c = nz(rng, -5, 5), d = nz(rng, -5, 5);
  const M = mat2([[a, b], [c, d]]);
  return {
    id: `gen.def3-matrix-form-1.${idx}`, generated: true, concepts: ["matrix-form-and-verify"], difficulty: 1, context: "abstract",
    prompt: `Write the coupled system $x' = ${a}x ${signed(b)}y$, $y' = ${c}x ${signed(d)}y$ in matrix form $\\mathbf{x}' = A\\mathbf{x}$.`,
    steps: [
      { instruction: "Row 1 of $A$ holds the coefficients of the $x'$ equation, in the order $x$ then $y$. What entry goes in row 1, column 2?", answer: `${b}`, accept: [], hint: `The coefficient of $y$ in $x' = ${a}x ${signed(b)}y$.` },
      { instruction: "Write the full coefficient matrix as [[row 1], [row 2]].", answer: M, accept: [compact(M)], hint: "Row 1 comes from the $x'$ equation, row 2 from the $y'$ equation." },
    ],
    finalAnswer: { value: M, unit: "" },
    solutionNarrative: `Each row copies one equation's coefficients: $A = ${bmat([[a, b], [c, d]])}$.`,
  };
};

fill["def3-matrix-form-2"] = (rng, idx) => {
  const { A, l1, v1 } = eigenPick(rng, -4, 4);
  const Av = [l1 * v1[0], l1 * v1[1]]; // A v1 = l1 v1 by construction
  return {
    id: `gen.def3-matrix-form-2.${idx}`, generated: true, concepts: ["matrix-form-and-verify"], difficulty: 2, context: "abstract",
    prompt: `For the system $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${bmat(A)}$, verify that the proposed solution $\\mathbf{x}(t) = e^{${expT(l1)}}\\langle ${v1[0]}, ${v1[1]} \\rangle$ really works, by checking both sides at $t = 0$.`,
    steps: [
      { instruction: `At $t = 0$ the exponential is 1, so $\\mathbf{x}(0) = \\langle ${v1[0]}, ${v1[1]} \\rangle$. Compute the right side $A\\mathbf{x}(0)$ as a vector.`, answer: vec(Av), accept: vecAccepts(Av), hint: `Row times column: first component $${A[0][0]}(${v1[0]}) ${signed(A[0][1])}(${v1[1]})$.` },
      { instruction: `Now the left side: $\\mathbf{x}'(t) = ${l1}e^{${expT(l1)}}\\langle ${v1[0]}, ${v1[1]} \\rangle$, so $\\mathbf{x}'(0) = ${l1}\\langle ${v1[0]}, ${v1[1]} \\rangle$. Compute it.`, answer: vec(Av), accept: vecAccepts(Av), hint: `Multiply each component by ${l1}.` },
      { instruction: "Both sides agree, so the proposal solves the system. Is $\\langle " + v1[0] + ", " + v1[1] + " \\rangle$ an eigenvector of $A$? Type 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: `$A\\mathbf{v} = ${l1}\\mathbf{v}$ is exactly the eigenvector equation with $\\lambda = ${l1}$.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$A\\langle ${v1[0]}, ${v1[1]} \\rangle = \\langle ${Av[0]}, ${Av[1]} \\rangle = ${l1}\\langle ${v1[0]}, ${v1[1]} \\rangle$, matching $\\mathbf{x}'(0)$ — a straight-line eigen-solution with $\\lambda = ${l1}$.`,
  };
};

fill["def3-matrix-form-3"] = (rng, idx) => {
  const P = nz(rng, -6, 6), Q = nz(rng, -6, 6);
  const M = mat2([[0, 1], [-Q, -P]]);
  return {
    id: `gen.def3-matrix-form-3.${idx}`, generated: true, concepts: ["matrix-form-and-verify"], difficulty: 3, context: "abstract",
    prompt: `Convert the second-order equation $y'' ${signed(P)}y' ${signed(Q)}y = 0$ into a first-order system $\\mathbf{x}' = A\\mathbf{x}$ using $x_1 = y$ and $x_2 = y'$.`,
    steps: [
      { instruction: `Then $x_1' = x_2$, and solving the ODE for $y''$ gives $x_2' = ${-Q}x_1 ${signed(-P)}x_2$. What is the coefficient of $x_1$ in the $x_2'$ equation?`, answer: `${-Q}`, accept: [], hint: `Move $${Q === 1 ? "" : Q}y$ to the right side: $y'' = ${-Q}y ${signed(-P)}y'$.` },
      { instruction: "What is the coefficient of $x_2$?", answer: `${-P}`, accept: [], hint: `The $y'$ term moves across with its sign flipped.` },
      { instruction: "Write the companion matrix $A$ as [[row 1], [row 2]].", answer: M, accept: [compact(M)], hint: "Row 1 encodes $x_1' = x_2$: it is $[0, 1]$." },
    ],
    finalAnswer: { value: M, unit: "" },
    solutionNarrative: `With $x_1 = y$, $x_2 = y'$: $x_1' = x_2$ and $x_2' = ${-Q}x_1 ${signed(-P)}x_2$, so $A = ${bmat([[0, 1], [-Q, -P]])}$. Its characteristic polynomial $\\lambda^2 ${signed(P)}\\lambda ${signed(Q)}$ is exactly the old characteristic equation.`,
  };
};

// ============================================================================
// eigenvalue-method — eigenvalues via trace/det, eigenvectors normalized
// ============================================================================

fill["def3-eigenvalue-method-1"] = (rng, idx) => {
  const { A, l1, l2, T, D } = eigenPick(rng, -4, 4);
  const eq = charEq(T, D);
  return {
    id: `gen.def3-eigenvalue-method-1.${idx}`, generated: true, concepts: ["eigenvalue-method"], difficulty: 1, context: "abstract",
    prompt: `Find the eigenvalues of the coefficient matrix $A = ${bmat(A)}$ of the system $\\mathbf{x}' = A\\mathbf{x}$.`,
    steps: [
      { instruction: "Compute the trace of $A$ (sum of the diagonal entries).", answer: `${T}`, accept: [], hint: `$${A[0][0]} + (${A[1][1]})$.` },
      { instruction: "Compute the determinant $ad - bc$.", answer: `${D}`, accept: [], hint: `$(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})$.` },
      { instruction: "Write the characteristic equation $\\lambda^2 - (\\text{trace})\\lambda + \\det = 0$.", answer: eq, accept: [compact(eq)], hint: `Substitute trace ${T} and determinant ${D} (watch the minus sign on the trace).` },
      { instruction: "Solve for both eigenvalues. Separate them with 'or' or a comma.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: `It factors as $(\\lambda ${signed(-l1)})(\\lambda ${signed(-l2)}) = 0$.` },
    ],
    finalAnswer: { value: `lambda = ${l1}, lambda = ${l2}`, unit: "" },
    solutionNarrative: `Trace $${T}$, determinant $${D}$, so $${eq.replace(/lambda/g, "\\lambda ")}$ factors to give $\\lambda = ${l1}$ and $\\lambda = ${l2}$.`,
  };
};

fill["def3-eigenvalue-method-2"] = (rng, idx) => {
  const { A, l1, m } = eigenPick(rng, -4, 4);
  const d11 = A[0][0] - l1;
  return {
    id: `gen.def3-eigenvalue-method-2.${idx}`, generated: true, concepts: ["eigenvalue-method"], difficulty: 2, context: "abstract",
    prompt: `One eigenvalue of $A = ${bmat(A)}$ is $\\lambda = ${l1}$. Find the eigenvector for $\\lambda = ${l1}$ with first component 1.`,
    steps: [
      { instruction: `Form $A - ${l1}I$ by subtracting ${l1} from each diagonal entry. What is its top-left entry?`, answer: `${d11}`, accept: [], hint: `$${A[0][0]} - (${l1})$.` },
      { instruction: `Row 1 of $(A - ${l1}I)\\mathbf{v} = \\mathbf{0}$ reads $${d11}v_1 ${signed(A[0][1])}v_2 = 0$. Set $v_1 = 1$ and solve for $v_2$.`, answer: `${m}`, accept: [`v2 = ${m}`, `v2=${m}`], hint: `$${d11} ${signed(A[0][1])}v_2 = 0$.` },
      { instruction: "State the eigenvector with first component 1 as $\\langle v_1, v_2 \\rangle$.", answer: `<1, ${m}>`, accept: [`(1, ${m})`, `1, ${m}`], hint: `$\\langle 1, ${m} \\rangle$ — any scalar multiple is also an eigenvector, but the normalization pins this one down.` },
    ],
    finalAnswer: { value: `<1, ${m}>`, unit: "" },
    solutionNarrative: `Row 1 of $A - ${l1}I$ gives $${d11} ${signed(A[0][1])}v_2 = 0$, so $v_2 = ${m}$ and the eigenvector is $\\langle 1, ${m} \\rangle$. Check: $A\\langle 1, ${m} \\rangle = ${l1}\\langle 1, ${m} \\rangle$.`,
  };
};

fill["def3-eigenvalue-method-3"] = (rng, idx) => {
  const { A, l1, l2, m, T, D } = eigenPick(rng, -4, 4);
  const eq = charEq(T, D);
  const Av = [l1, l1 * m];
  return {
    id: `gen.def3-eigenvalue-method-3.${idx}`, generated: true, concepts: ["eigenvalue-method"], difficulty: 3, context: "abstract",
    prompt: `For the system $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${bmat(A)}$: find both eigenvalues, then the eigenvector for $\\lambda = ${l1}$ with first component 1, and verify it.`,
    steps: [
      { instruction: `Write the characteristic equation (trace $${T}$, determinant $${D}$).`, answer: eq, accept: [compact(eq)], hint: `$\\lambda^2 - (\\text{trace})\\lambda + \\det = 0$.` },
      { instruction: "Solve for both eigenvalues.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: `$(\\lambda ${signed(-l1)})(\\lambda ${signed(-l2)}) = 0$.` },
      { instruction: `For $\\lambda = ${l1}$, row 1 of $(A - ${l1}I)\\mathbf{v} = \\mathbf{0}$ is $${A[0][0] - l1}v_1 ${signed(A[0][1])}v_2 = 0$. Give the eigenvector with first component 1 as $\\langle v_1, v_2 \\rangle$.`, answer: `<1, ${m}>`, accept: [`(1, ${m})`, `1, ${m}`], hint: `Set $v_1 = 1$: $${A[0][0] - l1} ${signed(A[0][1])}v_2 = 0$.` },
      { instruction: `Verify: compute $A\\langle 1, ${m} \\rangle$ as a vector (it should equal $${l1}\\langle 1, ${m} \\rangle$).`, answer: vec(Av), accept: vecAccepts(Av), hint: `Multiply the eigenvector by $\\lambda = ${l1}$ — or do the matrix product directly; they must match.` },
    ],
    finalAnswer: { value: `<1, ${m}>`, unit: "" },
    solutionNarrative: `$${eq.replace(/lambda/g, "\\lambda ")}$ gives $\\lambda = ${l1}, ${l2}$. For $\\lambda = ${l1}$ the eigenvector is $\\langle 1, ${m} \\rangle$, and $A\\langle 1, ${m} \\rangle = \\langle ${Av[0]}, ${Av[1]} \\rangle = ${l1}\\langle 1, ${m} \\rangle$. ✓`,
  };
};

// ============================================================================
// general-solutions-and-ivp — fit c1, c2 to initial conditions
// ============================================================================

fill["def3-general-ivp-1"] = (rng, idx) => {
  let l1 = nz(rng, -4, 4), l2 = nz(rng, -4, 4);
  if (l1 === l2) l2 = l1 === 4 ? -4 : l1 + 1 || 1;
  if (l2 === 0) l2 = 4;
  const c1 = nz(rng, -4, 4), c2 = nz(rng, -4, 4);
  const x01 = c1 + c2, x02 = c1 - c2;
  return {
    id: `gen.def3-general-ivp-1.${idx}`, generated: true, concepts: ["general-solutions-and-ivp"], difficulty: 1, context: "abstract",
    prompt: `A system has general solution $\\mathbf{x}(t) = c_1 e^{${expT(l1)}}\\langle 1, 1 \\rangle + c_2 e^{${expT(l2)}}\\langle 1, -1 \\rangle$ with initial condition $\\mathbf{x}(0) = \\langle ${x01}, ${x02} \\rangle$. Find $c_1$ and $c_2$.`,
    steps: [
      { instruction: `At $t = 0$ both exponentials equal 1, so $c_1\\langle 1, 1 \\rangle + c_2\\langle 1, -1 \\rangle = \\langle ${x01}, ${x02} \\rangle$. That means $c_1 + c_2 = ${x01}$ and $c_1 - c_2 = ${x02}$. Add the two equations: $2c_1 = ?$`, answer: `${2 * c1}`, accept: [], hint: `$${x01} + (${x02})$ — the $c_2$ terms cancel.` },
      { instruction: "Solve for $c_1$.", answer: `${c1}`, accept: [`c1 = ${c1}`, `c1=${c1}`], hint: `Divide ${2 * c1} by 2.` },
      { instruction: "Now find $c_2$.", answer: `${c2}`, accept: [`c2 = ${c2}`, `c2=${c2}`], hint: `$c_2 = ${x01} - c_1 = ${x01} - (${c1})$.` },
    ],
    finalAnswer: { value: `c1 = ${c1}, c2 = ${c2}`, unit: "" },
    solutionNarrative: `Setting $t = 0$ gives the 2×2 system $c_1 + c_2 = ${x01}$, $c_1 - c_2 = ${x02}$. Adding: $2c_1 = ${2 * c1}$, so $c_1 = ${c1}$ and $c_2 = ${c2}$.`,
  };
};

fill["def3-general-ivp-2"] = (rng, idx) => {
  const { l1, l2, m, n } = eigenPick(rng, -4, 4);
  const c1 = rng.int(1, 4), c2 = rng.int(1, 4); // nonzero by construction
  const x01 = c1 + c2, x02 = c1 * m + c2 * n;
  const e = n - m; // ±1
  const rhs2 = x02 - m * x01; // = e * c2
  return {
    id: `gen.def3-general-ivp-2.${idx}`, generated: true, concepts: ["general-solutions-and-ivp"], difficulty: 2, context: "abstract",
    prompt: `A system $\\mathbf{x}' = A\\mathbf{x}$ has eigenvalues $\\lambda_1 = ${l1}$ with $\\mathbf{v}_1 = \\langle 1, ${m} \\rangle$ and $\\lambda_2 = ${l2}$ with $\\mathbf{v}_2 = \\langle 1, ${n} \\rangle$, so $\\mathbf{x}(t) = c_1 e^{${expT(l1)}}\\mathbf{v}_1 + c_2 e^{${expT(l2)}}\\mathbf{v}_2$. Apply $\\mathbf{x}(0) = \\langle ${x01}, ${x02} \\rangle$ to find $c_1$ and $c_2$.`,
    steps: [
      { instruction: `At $t = 0$: $c_1\\mathbf{v}_1 + c_2\\mathbf{v}_2 = \\langle ${x01}, ${x02} \\rangle$. The first components give $c_1 + c_2 = ?$`, answer: `${x01}`, accept: [`c1 + c2 = ${x01}`, `c1+c2=${x01}`], hint: `Both eigenvectors have first component 1.` },
      { instruction: `The second components give $${m}c_1 ${signed(n)}c_2 = ${x02}$. Multiply the first equation by ${m} and subtract it from this one: $${e}c_2 = ?$`, answer: `${rhs2}`, accept: [], hint: `$${x02} - ${m}(${x01})$.` },
      { instruction: "Solve for $c_2$.", answer: `${c2}`, accept: [`c2 = ${c2}`, `c2=${c2}`], hint: `Divide ${rhs2} by ${e}.` },
      { instruction: "Now find $c_1$.", answer: `${c1}`, accept: [`c1 = ${c1}`, `c1=${c1}`], hint: `$c_1 = ${x01} - c_2 = ${x01} - ${c2}$.` },
    ],
    finalAnswer: { value: `c1 = ${c1}, c2 = ${c2}`, unit: "" },
    solutionNarrative: `The initial condition gives $c_1 + c_2 = ${x01}$ and $${m}c_1 ${signed(n)}c_2 = ${x02}$. Eliminating $c_1$: $${e}c_2 = ${rhs2}$, so $c_2 = ${c2}$ and $c_1 = ${c1}$.`,
  };
};

fill["def3-general-ivp-3"] = (rng, idx) => {
  const { A, l1, l2, m, n, T, D } = eigenPick(rng, -4, 4);
  const c1 = rng.int(1, 3), c2 = rng.int(1, 3); // positive, nonzero — keeps the symbolic string join simple
  const x01 = c1 + c2, x02 = c1 * m + c2 * n;
  const e = n - m;
  const termP = (c, l) => `${c === 1 ? "" : c}e^(${expT(l)})`;
  const termB = (c, l) => `${c === 1 ? "" : c}e^{${expT(l)}}`;
  const x1P = `${termP(c1, l1)} + ${termP(c2, l2)}`;
  const x1Accepts = [
    `${termB(c1, l1)} + ${termB(c2, l2)}`,
    `${termP(c2, l2)} + ${termP(c1, l1)}`,
    `${termB(c2, l2)} + ${termB(c1, l1)}`,
    `${c1}e^(${expT(l1)}) + ${c2}e^(${expT(l2)})`,
  ];
  return {
    id: `gen.def3-general-ivp-3.${idx}`, generated: true, concepts: ["general-solutions-and-ivp"], difficulty: 3, context: "abstract",
    prompt: `Solve the initial value problem $\\mathbf{x}' = A\\mathbf{x}$, $\\mathbf{x}(0) = \\langle ${x01}, ${x02} \\rangle$, for $A = ${bmat(A)}$ (trace $${T}$, determinant $${D}$).`,
    steps: [
      { instruction: `Solve the characteristic equation $\\lambda^2 ${signed(-T)}\\lambda ${signed(D)} = 0$ for both eigenvalues.`, form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`, `${l2}, ${l1}`], hint: `$(\\lambda ${signed(-l1)})(\\lambda ${signed(-l2)}) = 0$.` },
      { instruction: `For $\\lambda_1 = ${l1}$, row 1 of $(A - ${l1}I)\\mathbf{v} = \\mathbf{0}$ is $${A[0][0] - l1}v_1 ${signed(A[0][1])}v_2 = 0$. Give the eigenvector with first component 1.`, answer: `<1, ${m}>`, accept: [`(1, ${m})`, `1, ${m}`], hint: `Set $v_1 = 1$ and solve for $v_2$.` },
      { instruction: `For $\\lambda_2 = ${l2}$, row 1 of $(A - ${l2}I)\\mathbf{v} = \\mathbf{0}$ is $${A[0][0] - l2}v_1 ${signed(A[0][1])}v_2 = 0$. Give the eigenvector with first component 1.`, answer: `<1, ${n}>`, accept: [`(1, ${n})`, `1, ${n}`], hint: `Set $v_1 = 1$ and solve for $v_2$.` },
      { instruction: `Apply $\\mathbf{x}(0)$: first components give $c_1 + c_2 = ${x01}$, second give $${m}c_1 ${signed(n)}c_2 = ${x02}$. Solve for $c_2$.`, answer: `${c2}`, accept: [`c2 = ${c2}`, `c2=${c2}`], hint: `Eliminate $c_1$: $${e}c_2 = ${x02} - ${m}(${x01}) = ${x02 - m * x01}$.` },
      { instruction: "Now find $c_1$.", answer: `${c1}`, accept: [`c1 = ${c1}`, `c1=${c1}`], hint: `$c_1 = ${x01} - ${c2}$.` },
      { instruction: `Both eigenvectors have first component 1, so $x_1(t) = c_1 e^{${expT(l1)}} + c_2 e^{${expT(l2)}}$. Write $x_1(t)$ with your constants (e.g. "3e^(2t) + 4e^(-t)").`, answer: x1P, accept: x1Accepts, hint: `Substitute $c_1 = ${c1}$ and $c_2 = ${c2}$.` },
    ],
    finalAnswer: { value: x1P, unit: "" },
    solutionNarrative: `Eigen-pairs: $\\lambda = ${l1}$ with $\\langle 1, ${m} \\rangle$ and $\\lambda = ${l2}$ with $\\langle 1, ${n} \\rangle$. Fitting $\\mathbf{x}(0)$: $c_1 = ${c1}$, $c_2 = ${c2}$, so $x_1(t) = ${termB(c1, l1)} + ${termB(c2, l2)}$.`,
  };
};

// ============================================================================
// phase-portraits-and-applications — classify the origin; applied systems
// ============================================================================

const MENU = 'saddle, stable node, unstable node, spiral';

fill["def3-phase-portrait-1"] = (rng, idx) => {
  const kind = rng.pick(["saddle", "stable node", "unstable node"]);
  let l1, l2;
  if (kind === "saddle") { l1 = rng.int(1, 5); l2 = -rng.int(1, 5); }
  else if (kind === "stable node") { l1 = -rng.int(1, 3); l2 = l1 - rng.int(1, 3); }
  else { l1 = rng.int(1, 3); l2 = l1 + rng.int(1, 3); }
  const pos = (l1 > 0 ? 1 : 0) + (l2 > 0 ? 1 : 0);
  const accepts = { "saddle": ["saddle point"], "stable node": ["stable", "sink", "nodal sink"], "unstable node": ["unstable", "source", "nodal source"] }[kind];
  const behavior = kind === "saddle" ? "trajectories approach along one eigenline and escape along the other" : kind === "stable node" ? "every trajectory decays into the origin" : "every trajectory grows away from the origin";
  return {
    id: `gen.def3-phase-portrait-1.${idx}`, generated: true, concepts: ["phase-portraits-and-applications"], difficulty: 1, context: "abstract",
    prompt: `A linear system $\\mathbf{x}' = A\\mathbf{x}$ has real eigenvalues $\\lambda_1 = ${l1}$ and $\\lambda_2 = ${l2}$. Classify the equilibrium at the origin.`,
    steps: [
      { instruction: "How many of the eigenvalues are positive? Type a number.", answer: `${pos}`, accept: pos === 1 ? ["one"] : pos === 2 ? ["two", "both"] : ["zero", "none"], hint: `Check the signs of ${l1} and ${l2}.` },
      { instruction: `Classify the origin. Type exactly one of: ${MENU}.`, answer: kind, accept: accepts, hint: `Opposite signs → saddle; both negative → stable node; both positive → unstable node.` },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `Eigenvalues ${l1} and ${l2}: ${pos} positive, so the origin is a ${kind} — ${behavior}.`,
  };
};

fill["def3-phase-portrait-2"] = (rng, idx) => {
  const sign = rng.pick(["neg", "pos", "mixed"]);
  const { A, l1, l2, T, D } = eigenPick(rng, -4, 4, { sign });
  const disc = T * T - 4 * D; // = (l1 - l2)^2 > 0
  const kind = D < 0 ? "saddle" : T < 0 ? "stable node" : "unstable node";
  const accepts = { "saddle": ["saddle point"], "stable node": ["stable", "sink", "nodal sink"], "unstable node": ["unstable", "source", "nodal source"] }[kind];
  return {
    id: `gen.def3-phase-portrait-2.${idx}`, generated: true, concepts: ["phase-portraits-and-applications"], difficulty: 2, context: "abstract",
    prompt: `Classify the equilibrium at the origin for $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${bmat(A)}$, using the trace, determinant, and discriminant.`,
    steps: [
      { instruction: "Compute the trace $T$ of $A$.", answer: `${T}`, accept: [], hint: `$${A[0][0]} + (${A[1][1]})$.` },
      { instruction: "Compute the determinant $D$.", answer: `${D}`, accept: [], hint: `$(${A[0][0]})(${A[1][1]}) - (${A[0][1]})(${A[1][0]})$.` },
      { instruction: "Compute the discriminant $T^2 - 4D$.", answer: `${disc}`, accept: [], hint: `$(${T})^2 - 4(${D})$.` },
      { instruction: `The discriminant is positive, so the eigenvalues are real and distinct (here $\\lambda = ${l1}, ${l2}$). Classify the origin. Type exactly one of: ${MENU}.`, answer: kind, accept: accepts, hint: `$D < 0$ → saddle. $D > 0$: node, stable when $T < 0$, unstable when $T > 0$.` },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `$T = ${T}$, $D = ${D}$, $T^2 - 4D = ${disc} > 0$: real distinct eigenvalues $${l1}$ and $${l2}$, so the origin is a ${kind}.`,
  };
};

fill["def3-phase-portrait-3"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = rng.int(1, 4);
  const A = [[a, -b], [b, a]];
  const T = 2 * a, D = a * a + b * b, disc = -4 * b * b;
  return {
    id: `gen.def3-phase-portrait-3.${idx}`, generated: true, concepts: ["phase-portraits-and-applications"], difficulty: 3, context: "applied",
    prompt: `A predator-prey model, linearized about its coexistence equilibrium, gives $\\mathbf{x}' = A\\mathbf{x}$ with $A = ${bmat(A)}$ (components are deviations from equilibrium). Classify the equilibrium.`,
    steps: [
      { instruction: "Compute the trace $T$ of $A$.", answer: `${T}`, accept: [], hint: `$${a} + ${a}$.` },
      { instruction: "Compute the determinant $D$.", answer: `${D}`, accept: [], hint: `$(${a})(${a}) - (${-b})(${b})$.` },
      { instruction: "Compute the discriminant $T^2 - 4D$.", answer: `${disc}`, accept: [], hint: `$${T * T} - ${4 * D}$.` },
      { instruction: "Is the discriminant negative? Type 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: `$${disc} < 0$ — the square root in the quadratic formula goes imaginary.` },
      { instruction: `Complex eigenvalues make trajectories rotate around the equilibrium. Classify it. Type exactly one of: ${MENU}.`, answer: "spiral", accept: ["spiral point", "focus", "a spiral"], hint: "A negative discriminant always means a spiral (the trace's sign then decides growing vs decaying)." },
    ],
    finalAnswer: { value: "spiral", unit: "" },
    solutionNarrative: `$T = ${T}$, $D = ${D}$, $T^2 - 4D = ${disc} < 0$: the eigenvalues are complex, so the populations ${a < 0 ? "spiral inward — oscillations that die out" : "spiral outward — growing oscillations"} around the equilibrium. Classification: spiral.`,
  };
};
