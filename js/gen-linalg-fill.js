// gen-linalg-fill.js
// Parametric problem generators filling out difficulty-tier coverage for the
// Linear Algebra subject. Self-contained: exports a `fill` map of
// template-name -> (rng, idx) => problemObject, matching the same object
// shape used by js/generator.js's internal generators. Does not import from
// or modify js/generator.js.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const round2 = (x) => Math.round(x * 100) / 100;
const mat2 = (m) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;
const rand2x2 = (rng, lo = -6, hi = 6) => [[rng.int(lo, hi), rng.int(lo, hi)], [rng.int(lo, hi), rng.int(lo, hi)]];
const MAG2 = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];

export const fill = {};

// ============================================================================
// vectors-and-span.json
// ============================================================================

// linear-combinations: d2, d3 (d1 already covered by lin-comb-v1)
fill["laf-linear-combinations-d2"] = (rng, idx) => {
  const s = nz(rng, -5, 6), t = nz(rng, -5, 6);
  const u = [rng.int(-6, 6), rng.int(-6, 6), rng.int(-6, 6)];
  const v = [rng.int(-6, 6), rng.int(-6, 6), rng.int(-6, 6)];
  const r = [s * u[0] + t * v[0], s * u[1] + t * v[1], s * u[2] + t * v[2]];
  return {
    id: `gen.laf-linear-combinations-d2.${idx}`, generated: true, concepts: ["linear-combinations"], difficulty: 2, context: "abstract",
    prompt: `Compute $${s}\\langle ${u.join(", ")} \\rangle ${signed(t)}\\langle ${v.join(", ")} \\rangle$ in $\\mathbb{R}^3$.`,
    steps: [{ instruction: "Scale each vector and add component-wise.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Component by component." }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};
fill["laf-linear-combinations-d3"] = (rng, idx) => {
  const c1 = nz(rng, -6, 6), c2 = nz(rng, -6, 6), c3 = nz(rng, -6, 6);
  const u = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const v = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const w = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const r = [
    c1 * u[0] + c2 * v[0] + c3 * w[0],
    c1 * u[1] + c2 * v[1] + c3 * w[1],
    c1 * u[2] + c2 * v[2] + c3 * w[2],
  ];
  return {
    id: `gen.laf-linear-combinations-d3.${idx}`, generated: true, concepts: ["linear-combinations"], difficulty: 3, context: "abstract",
    prompt: `Compute $${c1}\\langle ${u.join(", ")} \\rangle ${signed(c2)}\\langle ${v.join(", ")} \\rangle ${signed(c3)}\\langle ${w.join(", ")} \\rangle$.`,
    steps: [
      { instruction: "Scale each of the three vectors by its weight.", answer: `<${(c1 * u[0])}, ${(c1 * u[1])}, ${(c1 * u[2])}>`, accept: [], hint: `Multiply $\\langle ${u.join(", ")} \\rangle$ by ${c1}.` },
      { instruction: "Add all three scaled vectors entry by entry.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Sum each coordinate across the three scaled vectors." },
    ],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};

// span-membership: d2, d3 (d1 already covered by span-membership-v1)
fill["laf-span-membership-d2"] = (rng, idx) => {
  const v1 = [rng.int(1, 4), rng.int(1, 4)], v2 = [rng.int(1, 4), nz(rng, -4, 4)];
  const det = v1[0] * v2[1] - v1[1] * v2[0];
  if (det === 0) return fill["laf-span-membership-d2"](rng, idx + 1);
  const c1 = nz(rng, -4, 4), c2 = nz(rng, -4, 4);
  const b = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]];
  return {
    id: `gen.laf-span-membership-d2.${idx}`, generated: true, concepts: ["span-membership"], difficulty: 2, context: "abstract",
    prompt: `Is $\\vec{b} = \\langle ${b.join(", ")} \\rangle$ in the span of $\\langle ${v1.join(", ")} \\rangle$ and $\\langle ${v2.join(", ")} \\rangle$? Give the weights $c_1, c_2$.`,
    steps: [{ instruction: "Solve $c_1 \\vec{v}_1 + c_2 \\vec{v}_2 = \\vec{b}$ for the weights.", form: "solutions", answer: `c1 = ${c1} or c1 = ${c1}`, accept: [`${c1}`], hint: `Since the two vectors are independent (det $= ${det} \\ne 0$), a unique solution exists.` }],
    finalAnswer: { value: `c1 = ${c1}, c2 = ${c2}`, unit: "" }, solutionNarrative: `$c_1 = ${c1}$, $c_2 = ${c2}$: yes, $\\vec b$ is in the span.`,
  };
};
fill["laf-span-membership-d3"] = (rng, idx) => {
  const inSpan = rng.int(0, 1) === 0;
  const az = rng.int(-4, 4);
  // e1, e2 span the plane z = az*0... use vectors with fixed relation among coords
  const v1 = [1, 0, 0], v2 = [0, 1, 0];
  const target = inSpan ? [rng.int(-6, 6), rng.int(-6, 6), 0] : [rng.int(-6, 6), rng.int(-6, 6), nz(rng, -5, 5)];
  return {
    id: `gen.laf-span-membership-d3.${idx}`, generated: true, concepts: ["span-membership"], difficulty: 3, context: "abstract",
    prompt: `Is $\\vec{b} = \\langle ${target.join(", ")} \\rangle$ in the span of $\\langle 1, 0, 0 \\rangle$ and $\\langle 0, 1, 0 \\rangle$? (yes/no)`,
    steps: [
      { instruction: "Any combination $c_1\\langle 1,0,0\\rangle + c_2\\langle 0,1,0\\rangle$ has what third entry?", answer: "0", accept: ["zero"], hint: "The third coordinate of both spanning vectors is 0." },
      { instruction: "Is $\\vec{b}$ in the span? (yes/no)", answer: inSpan ? "yes" : "no", accept: [], hint: `The target's third entry is ${target[2]}.` },
    ],
    finalAnswer: { value: inSpan ? "yes" : "no", unit: "" }, solutionNarrative: inSpan ? "The third entry is 0, matching the span: yes." : `The third entry is ${target[2]} \\ne 0$, unreachable: no.`,
  };
};

// spanning-sets: d1, d2, d3
fill["laf-spanning-sets-d1"] = (rng, idx) => {
  const n = rng.int(2, 5);
  return {
    id: `gen.laf-spanning-sets-d1.${idx}`, generated: true, concepts: ["spanning-sets"], difficulty: 1, context: "abstract",
    prompt: `What is the minimum number of vectors needed to span $\\mathbb{R}^{${n}}$?`,
    steps: [{ instruction: "You need at least as many vectors as the dimension of the space.", answer: `${n}`, accept: [], hint: `$\\mathbb{R}^{${n}}$ has dimension ${n}.` }],
    finalAnswer: { value: `${n}`, unit: "" }, solutionNarrative: `At least ${n} vectors are needed to span $\\mathbb{R}^{${n}}$.`,
  };
};
fill["laf-spanning-sets-d2"] = (rng, idx) => {
  const u = [rng.int(1, 5), rng.int(1, 5)];
  const v = [rng.int(1, 5), rng.int(1, 5)];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: `gen.laf-spanning-sets-d2.${idx}`, generated: true, concepts: ["spanning-sets"], difficulty: 2, context: "abstract",
    prompt: `Do $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ span $\\mathbb{R}^2$? Compute the determinant first.`,
    steps: [
      { instruction: "Compute the determinant of the matrix with these as columns.", answer: `${det}`, accept: [], hint: `$u_1 v_2 - u_2 v_1$.` },
      { instruction: "Do they span $\\mathbb{R}^2$? (yes/no)", answer: det !== 0 ? "yes" : "no", accept: [], hint: "A nonzero determinant means 2 pivots, spanning $\\mathbb{R}^2$." },
    ],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det $= ${det}$, so they ${det !== 0 ? "do" : "do not"} span $\\mathbb{R}^2$.`,
  };
};
fill["laf-spanning-sets-d3"] = (rng, idx) => {
  const indep = rng.int(0, 1) === 0;
  const a = rng.int(-4, 4), b = rng.int(-4, 4), c = rng.int(-4, 4);
  const v1 = [1, 0, 0], v2 = [0, 1, 0], v3 = indep ? [rng.int(1, 4), rng.int(1, 4), nz(rng, 1, 4)] : [a, b, 0];
  const pivots = indep ? 3 : 2;
  return {
    id: `gen.laf-spanning-sets-d3.${idx}`, generated: true, concepts: ["spanning-sets"], difficulty: 3, context: "abstract",
    prompt: `Do the vectors $\\langle 1, 0, 0 \\rangle$, $\\langle 0, 1, 0 \\rangle$, and $\\langle ${v3.join(", ")} \\rangle$ span $\\mathbb{R}^3$? (yes/no)`,
    steps: [
      { instruction: "How many pivots does the matrix with these three columns have after row reduction?", answer: `${pivots}`, accept: [], hint: indep ? "The third vector has a nonzero third entry, adding a new direction." : "The third vector's third entry is 0, adding no new direction." },
      { instruction: "Do they span $\\mathbb{R}^3$? (yes/no)", answer: pivots === 3 ? "yes" : "no", accept: [], hint: "Spanning $\\mathbb{R}^3$ needs 3 pivots." },
    ],
    finalAnswer: { value: pivots === 3 ? "yes" : "no", unit: "" }, solutionNarrative: `${pivots} pivot(s), so they ${pivots === 3 ? "do" : "do not"} span $\\mathbb{R}^3$.`,
  };
};

// span-applied: d1, d2, d3
fill["laf-span-applied-d1"] = (rng, idx) => {
  const f1 = [rng.int(1, 6), rng.int(1, 6)], f2 = [rng.int(1, 6), rng.int(1, 6)];
  const r = [f1[0] + f2[0], f1[1] + f2[1]];
  return {
    id: `gen.laf-span-applied-d1.${idx}`, generated: true, concepts: ["span-applied"], difficulty: 1, context: "applied",
    prompt: `Two forces act on a beam: $\\vec{F}_1 = \\langle ${f1.join(", ")} \\rangle$ N and $\\vec{F}_2 = \\langle ${f2.join(", ")} \\rangle$ N. Find the net force.`,
    steps: [{ instruction: "Add the two force vectors entry by entry.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Sum matching components." }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "newtons" }, solutionNarrative: `$\\langle ${f1.join(", ")}\\rangle + \\langle ${f2.join(", ")}\\rangle = \\langle ${r.join(", ")}\\rangle$ N.`,
  };
};
fill["laf-span-applied-d2"] = (rng, idx) => {
  const a1 = rng.int(1, 4), a2 = rng.int(1, 4);
  const A = [a1, 1], B = [1, a2];
  const det = A[0] * B[1] - A[1] * B[0];
  if (det === 0) return fill["laf-span-applied-d2"](rng, idx + 1);
  const c1 = rng.int(1, 4), c2 = rng.int(1, 4);
  const target = [c1 * A[0] + c2 * B[0], c1 * A[1] + c2 * B[1]];
  return {
    id: `gen.laf-span-applied-d2.${idx}`, generated: true, concepts: ["span-applied"], difficulty: 2, context: "applied",
    prompt: `A smoothie bar blends two mixes described as (calories, protein) per scoop: mix A is $\\langle ${A.join(", ")} \\rangle$ and mix B is $\\langle ${B.join(", ")} \\rangle$. A customer's order totals $\\langle ${target.join(", ")} \\rangle$. How many scoops of each ($c_1$ of A, $c_2$ of B)?`,
    steps: [{ instruction: "Solve $c_1\\langle ${A[0]},${A[1]}\\rangle + c_2\\langle ${B[0]},${B[1]}\\rangle = \\langle ${target[0]}, ${target[1]}\\rangle$ for $c_1, c_2$.", answer: `c1 = ${c1}, c2 = ${c2}`, accept: [`${c1}, ${c2}`], hint: "Set up and solve the 2x2 linear system from matching entries." }],
    finalAnswer: { value: `c1 = ${c1}, c2 = ${c2}`, unit: "scoops" }, solutionNarrative: `$c_1 = ${c1}$ scoops of A, $c_2 = ${c2}$ scoops of B.`,
  };
};
fill["laf-span-applied-d3"] = (rng, idx) => {
  const c1 = rng.int(1, 6), c2 = rng.int(1, 6), c3 = rng.int(1, 6);
  const target = [c1, c2, c3];
  return {
    id: `gen.laf-span-applied-d3.${idx}`, generated: true, concepts: ["span-applied"], difficulty: 3, context: "applied",
    prompt: `A thruster rig has three independent thrusters pushing along $\\langle 1,0,0\\rangle$, $\\langle 0,1,0\\rangle$, and $\\langle 0,0,1\\rangle$ (units of thrust). To achieve a net push of $\\langle ${target.join(", ")} \\rangle$, how many units of each thruster ($c_1, c_2, c_3$), and is any net push in $\\mathbb{R}^3$ achievable?`,
    steps: [
      { instruction: "Find the weights $c_1, c_2, c_3$.", answer: `<${target.join(", ")}>`, accept: [`(${target.join(", ")})`], hint: "With the standard basis, the weights equal the target's entries directly." },
      { instruction: "Do the three thrusters span $\\mathbb{R}^3$, so any push is achievable? (yes/no)", answer: "yes", accept: [], hint: "The standard basis vectors always span $\\mathbb{R}^3$." },
    ],
    finalAnswer: { value: `<${target.join(", ")}>`, unit: "units" }, solutionNarrative: `Weights $\\langle ${target.join(", ")}\\rangle$; since the thrusters span $\\mathbb{R}^3$, any push is achievable.`,
  };
};

// ============================================================================
// linear-independence.json
// ============================================================================

// independence-test: d1, d2, d3
fill["laf-independence-test-d1"] = (rng, idx) => {
  const indep = rng.int(0, 1) === 0;
  const u = [rng.int(1, 4), rng.int(1, 4)];
  const v = indep ? [rng.int(1, 4), u[1] + 1] : [2 * u[0], 2 * u[1]];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: `gen.laf-independence-test-d1.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 1, context: "abstract",
    prompt: `Are $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ linearly independent? (yes/no)`,
    steps: [{ instruction: "Check if one vector is a scalar multiple of the other.", answer: det !== 0 ? "yes" : "no", accept: [], hint: `Determinant $= ${det}$.` }],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det $= ${det}$, so they are ${det !== 0 ? "independent: yes" : "dependent: no"}.`,
  };
};
fill["laf-independence-test-d2"] = (rng, idx) => {
  const indep = rng.int(0, 1) === 0;
  const u = [rng.int(-5, 5), rng.int(-5, 5)];
  const v = indep ? [rng.int(-5, 5), u[1] + nz(rng, -3, 3)] : [3 * u[0], 3 * u[1]];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: `gen.laf-independence-test-d2.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 2, context: "abstract",
    prompt: `Are $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ linearly independent? Compute the determinant to decide.`,
    steps: [
      { instruction: "Compute the determinant of the matrix with these as columns.", answer: `${det}`, accept: [], hint: `$u_1 v_2 - u_2 v_1$.` },
      { instruction: "Independent or dependent? (yes/no for independent)", answer: det !== 0 ? "yes" : "no", accept: [], hint: "Nonzero determinant means independent." },
    ],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det $= ${det}$: ${det !== 0 ? "independent" : "dependent"}.`,
  };
};
fill["laf-independence-test-d3"] = (rng, idx) => {
  const indep = rng.int(0, 1) === 0;
  const v1 = [1, 0, 0], v2 = [0, 1, 0];
  const v3 = indep ? [rng.int(-4, 4), rng.int(-4, 4), nz(rng, -4, 4)] : [rng.int(-4, 4), rng.int(-4, 4), 0];
  return {
    id: `gen.laf-independence-test-d3.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 3, context: "abstract",
    prompt: `Are $\\langle 1,0,0\\rangle$, $\\langle 0,1,0\\rangle$, and $\\langle ${v3.join(", ")} \\rangle$ linearly independent in $\\mathbb{R}^3$? (yes/no)`,
    steps: [
      { instruction: "What is the third entry of $v_3$?", answer: `${v3[2]}`, accept: [], hint: "Read off the last coordinate." },
      { instruction: "Are the three vectors linearly independent? (yes/no)", answer: v3[2] !== 0 ? "yes" : "no", accept: [], hint: "A nonzero third entry gives a new direction out of the xy-plane." },
    ],
    finalAnswer: { value: v3[2] !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: v3[2] !== 0 ? "The third vector leaves the xy-plane: independent, yes." : "All three vectors lie in the xy-plane: dependent, no.",
  };
};

// determinant-method: d1, d3 (d2 already covered by indep-det-v1)
fill["laf-determinant-method-d1"] = (rng, idx) => {
  const u = [rng.int(1, 3), rng.int(1, 3)];
  const v = [rng.int(1, 3), rng.int(1, 3) + 1];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: `gen.laf-determinant-method-d1.${idx}`, generated: true, concepts: ["determinant-method"], difficulty: 1, context: "abstract",
    prompt: `Compute the determinant of the matrix with columns $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Determinant $= u_1 v_2 - u_2 v_1$.", answer: `${det}`, accept: [], hint: `$${u[0]}\\cdot${v[1]} - ${u[1]}\\cdot${v[0]}$.` }],
    finalAnswer: { value: `${det}`, unit: "" }, solutionNarrative: `det $= ${u[0]}(${v[1]}) - ${u[1]}(${v[0]}) = ${det}$.`,
  };
};
fill["laf-determinant-method-d3"] = (rng, idx) => {
  // 3x3 with a simple structure: rows [a,b,c],[0,d,e],[0,0,f] (upper triangular) -> det = a*d*f
  const a = nz(rng, -4, 4), d = nz(rng, -4, 4), f = nz(rng, -4, 4);
  const b = rng.int(-3, 3), c = rng.int(-3, 3), e = rng.int(-3, 3);
  const M = [[a, 0, 0], [b, d, 0], [c, e, f]]; // lower triangular, columns are these vectors
  const det = a * d * f;
  return {
    id: `gen.laf-determinant-method-d3.${idx}`, generated: true, concepts: ["determinant-method"], difficulty: 3, context: "abstract",
    prompt: `Are the columns of $${mat2([[a, 0], [b, d]])}$ extended to 3D as $\\langle ${a}, ${b}, ${c} \\rangle$, $\\langle 0, ${d}, ${e} \\rangle$, $\\langle 0, 0, ${f} \\rangle$ linearly independent? Use the determinant of the lower-triangular matrix $\\begin{bmatrix} ${a} & 0 & 0 \\\\ ${b} & ${d} & 0 \\\\ ${c} & ${e} & ${f} \\end{bmatrix}$.`,
    steps: [
      { instruction: "For a triangular matrix, the determinant is the product of the diagonal entries.", answer: `${det}`, accept: [], hint: `$${a} \\times ${d} \\times ${f}$.` },
      { instruction: "Independent or dependent? (yes/no for independent)", answer: det !== 0 ? "yes" : "no", accept: [], hint: "Nonzero determinant means independent." },
    ],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det $= ${a}\\cdot${d}\\cdot${f} = ${det}$, so ${det !== 0 ? "independent: yes" : "dependent: no"}.`,
  };
};

// dependency-relations: d1, d2, d3
fill["laf-dependency-relations-d1"] = (rng, idx) => {
  const u = [rng.int(1, 4), rng.int(1, 4)];
  const c = nz(rng, -4, 4);
  const v = [c * u[0], c * u[1]];
  return {
    id: `gen.laf-dependency-relations-d1.${idx}`, generated: true, concepts: ["dependency-relations"], difficulty: 1, context: "abstract",
    prompt: `Vector $\\vec{v} = \\langle ${v.join(", ")} \\rangle$ is a scalar multiple of $\\vec{u} = \\langle ${u.join(", ")} \\rangle$. Find the scalar $c$ such that $\\vec{v} = c\\vec{u}$.`,
    steps: [{ instruction: "Divide matching components to find $c$.", answer: `${c}`, accept: [], hint: `${v[0]} / ${u[0]}.` }],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `$c = ${v[0]}/${u[0]} = ${c}$.`,
  };
};
fill["laf-dependency-relations-d2"] = (rng, idx) => {
  const u = [rng.int(-5, 5), rng.int(1, 5)];
  const c = nz(rng, -5, 5);
  const v = [c * u[0], c * u[1]];
  return {
    id: `gen.laf-dependency-relations-d2.${idx}`, generated: true, concepts: ["dependency-relations"], difficulty: 2, context: "abstract",
    prompt: `Given $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ and $\\vec{v} = \\langle ${v.join(", ")} \\rangle$, these are dependent. Find $c$ with $\\vec{v} = c\\,\\vec{u}$.`,
    steps: [{ instruction: "Divide corresponding components (use the nonzero one).", answer: `${c}`, accept: [], hint: `${v[1]} / ${u[1]}.` }],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `$c = ${v[1]}/${u[1]} = ${c}$.`,
  };
};
fill["laf-dependency-relations-d3"] = (rng, idx) => {
  const u = [rng.int(-4, 4), rng.int(1, 4), nz(rng, -4, 4)];
  const c = nz(rng, -4, 4);
  const v = [c * u[0], c * u[1], c * u[2]];
  return {
    id: `gen.laf-dependency-relations-d3.${idx}`, generated: true, concepts: ["dependency-relations"], difficulty: 3, context: "abstract",
    prompt: `In $\\mathbb{R}^3$, $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ and $\\vec{v} = \\langle ${v.join(", ")} \\rangle$ are dependent. Find the scalar $c$ with $\\vec{v} = c\\,\\vec{u}$.`,
    steps: [
      { instruction: "Divide the second components to find a candidate $c$.", answer: `${c}`, accept: [], hint: `${v[1]} / ${u[1]}.` },
      { instruction: "Verify: does $c$ also work for the third components? (yes/no)", answer: "yes", accept: [], hint: `${c} \\times ${u[2]} = ${c * u[2]}$, matching $\\vec v$'s third entry.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `$c = ${v[1]}/${u[1]} = ${c}$, verified across all components.`,
  };
};

// rank-and-independence: d1, d2, d3
fill["laf-rank-and-independence-d1"] = (rng, idx) => {
  const total = rng.int(2, 4), redundant = rng.int(1, total - 1);
  const rank = total - redundant;
  return {
    id: `gen.laf-rank-and-independence-d1.${idx}`, generated: true, concepts: ["rank-and-independence"], difficulty: 1, context: "abstract",
    prompt: `A set has ${total} vectors, of which ${redundant} are redundant (linear combinations of the others). What is the rank of the set (the number of independent vectors)?`,
    steps: [{ instruction: "Rank = total vectors − redundant vectors.", answer: `${rank}`, accept: [], hint: `${total} − ${redundant}.` }],
    finalAnswer: { value: `${rank}`, unit: "" }, solutionNarrative: `Rank $= ${total} - ${redundant} = ${rank}$.`,
  };
};
fill["laf-rank-and-independence-d2"] = (rng, idx) => {
  const u = [rng.int(1, 5), rng.int(1, 5)];
  const c = nz(rng, -3, 3);
  const v = [c * u[0], c * u[1]];
  const w = [rng.int(1, 5), u[1] + nz(rng, -3, 3)];
  // three vectors in R^2: u, v (=c*u, dependent), w (independent of u). rank = 2
  const det = u[0] * w[1] - u[1] * w[0];
  const rank = det !== 0 ? 2 : 1;
  return {
    id: `gen.laf-rank-and-independence-d2.${idx}`, generated: true, concepts: ["rank-and-independence"], difficulty: 2, context: "abstract",
    prompt: `Find the rank of the set $\\{\\langle ${u.join(", ")} \\rangle, \\langle ${v.join(", ")} \\rangle, \\langle ${w.join(", ")} \\rangle\\}$ in $\\mathbb{R}^2$ (the maximum number of independent vectors among them).`,
    steps: [
      { instruction: "Note that the second vector is a multiple of the first — how many independent directions remain from just those two?", answer: "1", accept: [], hint: `$\\langle ${v.join(", ")} \\rangle = ${c}\\langle ${u.join(", ")} \\rangle$.` },
      { instruction: "What is the rank of the full set of three vectors?", answer: `${rank}`, accept: [], hint: rank === 2 ? "The third vector adds a new, independent direction." : "The third vector is also dependent on the first." },
    ],
    finalAnswer: { value: `${rank}`, unit: "" }, solutionNarrative: `Rank $= ${rank}$ (at most 2 independent directions exist in $\\mathbb{R}^2$).`,
  };
};
fill["laf-rank-and-independence-d3"] = (rng, idx) => {
  const v1 = [1, 0, 0], v2 = [0, 1, 0], v3 = [0, 0, 1];
  const rank = rng.pick([2, 3]);
  const v4 = rank === 3 ? [rng.int(1, 3), rng.int(1, 3), rng.int(1, 3)] : [rng.int(1, 4), rng.int(1, 4), 0];
  return {
    id: `gen.laf-rank-and-independence-d3.${idx}`, generated: true, concepts: ["rank-and-independence"], difficulty: 3, context: "abstract",
    prompt: `Find the rank of $\\{\\langle 1,0,0\\rangle, \\langle 0,1,0\\rangle, \\langle 0,0,1\\rangle, \\langle ${v4.join(", ")} \\rangle\\}$ (4 vectors in $\\mathbb{R}^3$).`,
    steps: [
      { instruction: "What is the maximum possible rank of any set of vectors in $\\mathbb{R}^3$?", answer: "3", accept: [], hint: "Rank can never exceed the dimension of the ambient space." },
      { instruction: "Since the first three vectors already span $\\mathbb{R}^3$, what is the rank of the full set of 4?", answer: "3", accept: [], hint: "Adding a 4th vector to a spanning set cannot raise the rank above the space's dimension." },
    ],
    finalAnswer: { value: "3", unit: "" }, solutionNarrative: "The first three standard-basis vectors already span $\\mathbb{R}^3$, so the rank of all four is 3.",
  };
};

// ============================================================================
// subspaces-and-basis.json
// ============================================================================

// subspace-test: d1, d2, d3
fill["laf-subspace-test-d1"] = (rng, idx) => {
  const isSub = rng.int(0, 1) === 0;
  const k = rng.int(1, 5), c = rng.int(1, 5);
  return {
    id: `gen.laf-subspace-test-d1.${idx}`, generated: true, concepts: ["subspace-test"], difficulty: 1, context: "abstract",
    prompt: isSub
      ? `Is the set of all $(x, y)$ with $y = ${k}x$ a subspace of $\\mathbb{R}^2$? (yes/no)`
      : `Is the set of all $(x, y)$ with $y = ${k}x + ${c}$ a subspace of $\\mathbb{R}^2$? (yes/no)`,
    steps: [{ instruction: "Does the set contain the origin $(0, 0)$?", answer: isSub ? "yes" : "no", accept: [], hint: isSub ? `At $x=0$, $y = ${k}(0) = 0$.` : `At $x=0$, $y = ${c} \\ne 0$.` }],
    finalAnswer: { value: isSub ? "yes" : "no", unit: "" }, solutionNarrative: isSub ? "Passes through the origin and is closed under addition/scaling: it is a subspace." : "It misses the origin, so it fails the subspace test.",
  };
};
fill["laf-subspace-test-d2"] = (rng, idx) => {
  const isSub = rng.int(0, 1) === 0;
  const a = rng.int(1, 4), b = rng.int(1, 4);
  return {
    id: `gen.laf-subspace-test-d2.${idx}`, generated: true, concepts: ["subspace-test"], difficulty: 2, context: "abstract",
    prompt: isSub
      ? `Is the set $\\{(x, y, z) : ${a}x + ${b}y - z = 0\\}$ a subspace of $\\mathbb{R}^3$? (yes/no)`
      : `Is the set $\\{(x, y, z) : ${a}x + ${b}y + z^2 = 0\\}$ a subspace of $\\mathbb{R}^3$? (yes/no)`,
    steps: [
      { instruction: "Is the defining equation linear (no squared or product terms)? (yes/no)", answer: isSub ? "yes" : "no", accept: [], hint: isSub ? "It's a plane through the origin, all terms are linear." : "There is a $z^2$ term." },
      { instruction: "Is the set a subspace? (yes/no)", answer: isSub ? "yes" : "no", accept: [], hint: "A homogeneous linear equation defines a subspace; a nonlinear term breaks closure." },
    ],
    finalAnswer: { value: isSub ? "yes" : "no", unit: "" }, solutionNarrative: isSub ? "A homogeneous linear equation defines a plane through the origin: a subspace." : "The $z^2$ term breaks closure under scaling: not a subspace.",
  };
};
fill["laf-subspace-test-d3"] = (rng, idx) => {
  const isSub = rng.int(0, 1) === 0;
  const n = rng.int(2, 3);
  return {
    id: `gen.laf-subspace-test-d3.${idx}`, generated: true, concepts: ["subspace-test"], difficulty: 3, context: "abstract",
    prompt: isSub
      ? `Is the null space of a matrix (all $\\vec{x}$ with $A\\vec{x} = \\vec{0}$, $A$ an $m \\times ${n}$ matrix) always a subspace of $\\mathbb{R}^{${n}}$? (yes/no)`
      : `Is the set of all $\\vec{x} \\in \\mathbb{R}^{${n}}$ with $\\lVert \\vec{x} \\rVert = 1$ (the unit sphere/circle) a subspace? (yes/no)`,
    steps: [
      { instruction: "Does the set contain the zero vector? (yes/no)", answer: isSub ? "yes" : "no", accept: [], hint: isSub ? "$A\\vec{0} = \\vec{0}$ always." : "The zero vector has length 0, not 1." },
      { instruction: "Is the set a subspace? (yes/no)", answer: isSub ? "yes" : "no", accept: [], hint: "A set that excludes the origin can never be a subspace." },
    ],
    finalAnswer: { value: isSub ? "yes" : "no", unit: "" }, solutionNarrative: isSub ? "The null space always contains 0 and is closed under addition/scaling: a subspace." : "The unit sphere excludes the origin: not a subspace.",
  };
};

// basis-test: d2, d3 (d1 already covered by basis-count-v1)
fill["laf-basis-test-d2"] = (rng, idx) => {
  const isBasis = rng.int(0, 1) === 0;
  const u = [rng.int(1, 4), rng.int(1, 4)];
  const v = isBasis ? [rng.int(1, 4), u[1] + nz(rng, -3, 3)] : [2 * u[0], 2 * u[1]];
  const det = u[0] * v[1] - u[1] * v[0];
  return {
    id: `gen.laf-basis-test-d2.${idx}`, generated: true, concepts: ["basis-test"], difficulty: 2, context: "abstract",
    prompt: `Do $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ form a basis for $\\mathbb{R}^2$? (yes/no)`,
    steps: [
      { instruction: "Compute the determinant of the matrix with these as columns.", answer: `${det}`, accept: [], hint: `$u_1 v_2 - u_2 v_1$.` },
      { instruction: "Do they form a basis for $\\mathbb{R}^2$? (yes/no)", answer: det !== 0 ? "yes" : "no", accept: [], hint: "2 independent vectors in $\\mathbb{R}^2$ automatically form a basis." },
    ],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det $= ${det}$, so they ${det !== 0 ? "do" : "do not"} form a basis.`,
  };
};
fill["laf-basis-test-d3"] = (rng, idx) => {
  const isBasis = rng.int(0, 1) === 0;
  const v3 = isBasis ? [rng.int(1, 3), rng.int(1, 3), nz(rng, 1, 3)] : [rng.int(1, 4), rng.int(1, 4), 0];
  return {
    id: `gen.laf-basis-test-d3.${idx}`, generated: true, concepts: ["basis-test"], difficulty: 3, context: "abstract",
    prompt: `Do $\\langle 1, 0, 0 \\rangle$, $\\langle 0, 1, 0 \\rangle$, and $\\langle ${v3.join(", ")} \\rangle$ form a basis for $\\mathbb{R}^3$? (yes/no)`,
    steps: [
      { instruction: "Is the third entry of the third vector nonzero? (yes/no)", answer: v3[2] !== 0 ? "yes" : "no", accept: [], hint: "A nonzero third entry gives a direction out of the xy-plane." },
      { instruction: "Do the three vectors form a basis for $\\mathbb{R}^3$? (yes/no)", answer: v3[2] !== 0 ? "yes" : "no", accept: [], hint: "3 independent vectors in $\\mathbb{R}^3$ automatically form a basis." },
    ],
    finalAnswer: { value: v3[2] !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: v3[2] !== 0 ? "All three are independent and span $\\mathbb{R}^3$: a basis, yes." : "The third vector lies in the xy-plane, dependent: not a basis, no.",
  };
};

// dimension-and-rank: d1, d3 (d2 already covered by rank-nullity-v1)
fill["laf-dimension-and-rank-d1"] = (rng, idx) => {
  const n = rng.int(2, 6);
  return {
    id: `gen.laf-dimension-and-rank-d1.${idx}`, generated: true, concepts: ["dimension-and-rank"], difficulty: 1, context: "abstract",
    prompt: `What is the dimension of $\\mathbb{R}^{${n}}$?`,
    steps: [{ instruction: "The dimension of $\\mathbb{R}^n$ equals $n$.", answer: `${n}`, accept: [], hint: "It's the count of vectors in any basis." }],
    finalAnswer: { value: `${n}`, unit: "" }, solutionNarrative: `$\\dim \\mathbb{R}^{${n}} = ${n}$.`,
  };
};
fill["laf-dimension-and-rank-d3"] = (rng, idx) => {
  const cols = rng.int(4, 7), rank = rng.int(2, cols - 2);
  const nullity = cols - rank;
  return {
    id: `gen.laf-dimension-and-rank-d3.${idx}`, generated: true, concepts: ["dimension-and-rank"], difficulty: 3, context: "abstract",
    prompt: `A matrix with ${cols} columns has nullity ${nullity}. Using rank–nullity, find the rank, then state whether the columns are linearly independent (yes/no).`,
    steps: [
      { instruction: "Rank = (number of columns) − nullity.", answer: `${rank}`, accept: [], hint: `${cols} − ${nullity}.` },
      { instruction: "Are the columns linearly independent? (yes/no)", answer: rank === cols ? "yes" : "no", accept: [], hint: "Independent only if rank equals the number of columns." },
    ],
    finalAnswer: { value: `${rank}`, unit: "" }, solutionNarrative: `Rank $= ${cols} - ${nullity} = ${rank}$, ${rank === cols ? "so the columns are independent" : "less than " + cols + ", so the columns are dependent"}.`,
  };
};

// coordinates: d1, d2, d3
fill["laf-coordinates-d1"] = (rng, idx) => {
  // standard basis: coordinates = the vector itself
  const v = [rng.int(-6, 6), rng.int(-6, 6)];
  return {
    id: `gen.laf-coordinates-d1.${idx}`, generated: true, concepts: ["coordinates"], difficulty: 1, context: "abstract",
    prompt: `Find the coordinates of $\\vec{v} = \\langle ${v.join(", ")} \\rangle$ relative to the standard basis $\\{\\langle 1,0\\rangle, \\langle 0,1\\rangle\\}$.`,
    steps: [{ instruction: "In the standard basis, coordinates equal the vector's own entries.", answer: `<${v.join(", ")}>`, accept: [`(${v.join(", ")})`], hint: "No computation needed for the standard basis." }],
    finalAnswer: { value: `<${v.join(", ")}>`, unit: "" }, solutionNarrative: `Coordinates are $\\langle ${v.join(", ")} \\rangle$.`,
  };
};
fill["laf-coordinates-d2"] = (rng, idx) => {
  const b1 = [1, 1], b2 = [1, -1]; // det = -2
  const c1 = nz(rng, -5, 5), c2 = nz(rng, -5, 5);
  const w = [c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]];
  return {
    id: `gen.laf-coordinates-d2.${idx}`, generated: true, concepts: ["coordinates"], difficulty: 2, context: "abstract",
    prompt: `Find the coordinates of $\\vec{w} = \\langle ${w.join(", ")} \\rangle$ relative to the basis $\\{\\langle 1,1\\rangle, \\langle 1,-1\\rangle\\}$ (i.e. find $c_1, c_2$ with $c_1\\langle 1,1\\rangle + c_2\\langle 1,-1\\rangle = \\vec w$).`,
    steps: [{ instruction: "Solve the 2x2 system for $c_1, c_2$.", answer: `<${c1}, ${c2}>`, accept: [`(${c1}, ${c2})`], hint: `$c_1 + c_2 = ${w[0]}$ and $c_1 - c_2 = ${w[1]}$.` }],
    finalAnswer: { value: `<${c1}, ${c2}>`, unit: "" }, solutionNarrative: `Coordinates $\\langle ${c1}, ${c2} \\rangle$.`,
  };
};
fill["laf-coordinates-d3"] = (rng, idx) => {
  const b1 = [1, 0], b2 = [1, 1]; // det = 1
  const c1 = nz(rng, -6, 6), c2 = nz(rng, -6, 6);
  const w = [c1 * b1[0] + c2 * b2[0], c1 * b1[1] + c2 * b2[1]];
  return {
    id: `gen.laf-coordinates-d3.${idx}`, generated: true, concepts: ["coordinates"], difficulty: 3, context: "abstract",
    prompt: `Relative to the basis $\\{\\langle 1,0\\rangle, \\langle 1,1\\rangle\\}$, the vector $\\vec{w} = \\langle ${w.join(", ")} \\rangle$ has coordinates $(c_1, c_2)$. Find them, then verify by reconstructing $\\vec w$.`,
    steps: [
      { instruction: "Since $b_2 = \\langle 1,1\\rangle$ contributes to both entries, first solve for $c_2$ from the second entry.", answer: `${c2}`, accept: [], hint: `The second entry of $\\vec w$ equals $c_2$ alone (since $b_1$'s second entry is 0).` },
      { instruction: "Now solve for $c_1$ using the first entry.", answer: `${c1}`, accept: [], hint: `$c_1 + c_2 = ${w[0]}$.` },
      { instruction: "State the coordinate vector $(c_1, c_2)$.", answer: `<${c1}, ${c2}>`, accept: [`(${c1}, ${c2})`], hint: "Combine the two values found." },
    ],
    finalAnswer: { value: `<${c1}, ${c2}>`, unit: "" }, solutionNarrative: `Coordinates $\\langle ${c1}, ${c2} \\rangle$; check: $${c1}\\langle 1,0\\rangle + ${c2}\\langle 1,1\\rangle = \\langle ${w.join(", ")}\\rangle$.`,
  };
};

// ============================================================================
// linear-transformations.json
// ============================================================================

// is-linear: d1, d2, d3
fill["laf-is-linear-d1"] = (rng, idx) => {
  const isLin = rng.int(0, 1) === 0;
  const a = rng.int(1, 5), b = rng.int(1, 5);
  return {
    id: `gen.laf-is-linear-d1.${idx}`, generated: true, concepts: ["is-linear"], difficulty: 1, context: "abstract",
    prompt: isLin
      ? `Is $T(x, y) = (${a}x, ${b}y)$ a linear transformation? (yes/no)`
      : `Is $T(x, y) = (${a}x + 1, ${b}y)$ a linear transformation? (yes/no)`,
    steps: [{ instruction: "Does $T(0, 0) = (0, 0)$? (yes/no)", answer: isLin ? "yes" : "no", accept: [], hint: isLin ? `$T(0,0) = (${a}\\cdot 0, ${b}\\cdot 0) = (0,0)$.` : `$T(0,0) = (1, 0) \\ne (0,0)$.` }],
    finalAnswer: { value: isLin ? "linear" : "not linear", unit: "" }, solutionNarrative: isLin ? "Every term is a constant times an input, and $T(0,0)=0$: linear." : "The added constant breaks $T(0,0)=0$: not linear.",
  };
};
fill["laf-is-linear-d2"] = (rng, idx) => {
  const isLin = rng.int(0, 1) === 0;
  const a = rng.int(1, 5), b = rng.int(1, 5), c = rng.int(1, 5), d = rng.int(1, 5);
  return {
    id: `gen.laf-is-linear-d2.${idx}`, generated: true, concepts: ["is-linear"], difficulty: 2, context: "abstract",
    prompt: isLin
      ? `Is $T(x, y) = (${a}x ${signed(b)}y, ${c}x ${signed(d)}y)$ a linear transformation? (yes/no)`
      : `Is $T(x, y) = (${a}x ${signed(b)}y, xy)$ a linear transformation? (yes/no)`,
    steps: [
      { instruction: "Are all terms constant coefficients times a single input variable (no products or powers of inputs)? (yes/no)", answer: isLin ? "yes" : "no", accept: [], hint: isLin ? "Every term is linear in x and y." : "The second output has a product $xy$." },
      { instruction: "Is $T$ linear? (yes/no)", answer: isLin ? "yes" : "no", accept: [], hint: "A product or power of the inputs breaks linearity." },
    ],
    finalAnswer: { value: isLin ? "linear" : "not linear", unit: "" }, solutionNarrative: isLin ? "All outputs are constant-coefficient sums of the inputs: linear." : "The $xy$ term is not linear in the inputs: not linear.",
  };
};
fill["laf-is-linear-d3"] = (rng, idx) => {
  const isLin = rng.int(0, 1) === 0;
  const a = rng.int(1, 5), b = rng.int(1, 5), c = rng.int(1, 5);
  const u = [rng.int(1, 4), rng.int(1, 4)], v = [rng.int(1, 4), rng.int(1, 4)];
  const Tlin = (p) => [a * p[0] + b * p[1], c * p[0] - p[1]];
  const Tnonlin = (p) => [a * p[0] + b * p[1], p[0] * p[0]];
  const T = isLin ? Tlin : Tnonlin;
  const Tu = T(u), Tv = T(v);
  const sum = [u[0] + v[0], u[1] + v[1]];
  const Tsum = T(sum);
  const addSum = [Tu[0] + Tv[0], Tu[1] + Tv[1]];
  const matches = Tsum[0] === addSum[0] && Tsum[1] === addSum[1];
  const label = isLin
    ? `T(x, y) = (${a}x ${signed(b)}y, ${c}x - y)`
    : `T(x, y) = (${a}x ${signed(b)}y, x^2)`;
  return {
    id: `gen.laf-is-linear-d3.${idx}`, generated: true, concepts: ["is-linear"], difficulty: 3, context: "abstract",
    prompt: `Test additivity for $${label}$ with $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ and $\\vec{v} = \\langle ${v.join(", ")} \\rangle$: compute $T(\\vec{u} + \\vec{v})$ and $T(\\vec{u}) + T(\\vec{v})$, and state whether $T$ is linear.`,
    steps: [
      { instruction: "Compute $T(\\vec{u} + \\vec{v})$.", answer: `<${Tsum.join(", ")}>`, accept: [`(${Tsum.join(", ")})`], hint: `First add $\\vec u + \\vec v = \\langle ${sum.join(", ")} \\rangle$, then apply $T$.` },
      { instruction: "Compute $T(\\vec{u}) + T(\\vec{v})$.", answer: `<${addSum.join(", ")}>`, accept: [`(${addSum.join(", ")})`], hint: `$T(\\vec u) = \\langle ${Tu.join(", ")} \\rangle$, $T(\\vec v) = \\langle ${Tv.join(", ")} \\rangle$.` },
      { instruction: "Is $T$ linear (do the two results match)? (yes/no)", answer: matches ? "yes" : "no", accept: [], hint: "Linear maps must satisfy $T(u+v) = T(u)+T(v)$ for every pair." },
    ],
    finalAnswer: { value: matches ? "linear" : "not linear", unit: "" }, solutionNarrative: matches ? "The two computations agree for this pair, consistent with linear." : "The two computations disagree: $T$ is not linear.",
  };
};

// standard-matrix: d1, d2, d3
fill["laf-standard-matrix-d1"] = (rng, idx) => {
  const a = rng.int(1, 5), d = rng.int(1, 5);
  const Te1 = [a, 0], Te2 = [0, d];
  return {
    id: `gen.laf-standard-matrix-d1.${idx}`, generated: true, concepts: ["standard-matrix"], difficulty: 1, context: "abstract",
    prompt: `A linear map has $T(1, 0) = (${Te1.join(", ")})$ and $T(0, 1) = (${Te2.join(", ")})$. Find its standard matrix.`,
    steps: [{ instruction: "The images of $e_1, e_2$ become the columns of the matrix.", answer: mat2([[a, 0], [0, d]]), accept: [], hint: "Column 1 is $T(e_1)$, column 2 is $T(e_2)$." }],
    finalAnswer: { value: mat2([[a, 0], [0, d]]), unit: "" }, solutionNarrative: `$${mat2([[a, 0], [0, d]])}$.`,
  };
};
fill["laf-standard-matrix-d2"] = (rng, idx) => {
  const A = rand2x2(rng, -5, 5);
  return {
    id: `gen.laf-standard-matrix-d2.${idx}`, generated: true, concepts: ["standard-matrix"], difficulty: 2, context: "abstract",
    prompt: `A linear map is defined by $T(x, y) = (${A[0][0]}x ${signed(A[0][1])}y,\\ ${A[1][0]}x ${signed(A[1][1])}y)$. Find its standard matrix.`,
    steps: [{ instruction: "Read the coefficients of x and y from each output component into rows.", answer: mat2(A), accept: [], hint: "Row 1 holds the coefficients from the first output; row 2 from the second." }],
    finalAnswer: { value: mat2(A), unit: "" }, solutionNarrative: `$${mat2(A)}$.`,
  };
};
fill["laf-standard-matrix-d3"] = (rng, idx) => {
  const a = rng.int(-5, 5), b = rng.int(-5, 5), c = rng.int(-5, 5), d = rng.int(-5, 5);
  const e1 = [a, c], e2 = [b, d];
  return {
    id: `gen.laf-standard-matrix-d3.${idx}`, generated: true, concepts: ["standard-matrix"], difficulty: 3, context: "abstract",
    prompt: `A linear map sends $T(1, 0) = (${e1.join(", ")})$ and $T(0, 1) = (${e2.join(", ")})$. Find the standard matrix $A$, then use it to compute $T(2, -1)$.`,
    steps: [
      { instruction: "Build the standard matrix from $T(e_1)$ and $T(e_2)$ as columns.", answer: mat2([[a, b], [c, d]]), accept: [], hint: "Column 1 is $T(e_1)$, column 2 is $T(e_2)$." },
      { instruction: "Compute $T(2, -1) = A\\langle 2, -1\\rangle$.", answer: `<${2 * a - b}, ${2 * c - d}>`, accept: [`(${2 * a - b}, ${2 * c - d})`], hint: "Multiply the matrix by the vector $\\langle 2, -1 \\rangle$." },
    ],
    finalAnswer: { value: `<${2 * a - b}, ${2 * c - d}>`, unit: "" }, solutionNarrative: `$A = ${mat2([[a, b], [c, d]])}$, and $T(2,-1) = \\langle ${2 * a - b}, ${2 * c - d} \\rangle$.`,
  };
};

// apply-and-compose: d2, d3 (d1 already covered by apply-T-v1)
fill["laf-apply-and-compose-d2"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 4), B = rand2x2(rng, -4, 4);
  const P = [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
  return {
    id: `gen.laf-apply-and-compose-d2.${idx}`, generated: true, concepts: ["apply-and-compose"], difficulty: 2, context: "abstract",
    prompt: `Two linear maps have matrices $A = ${mat2(A)}$ and $B = ${mat2(B)}$. Find the matrix of the composition "apply $B$ then $A$" (that is, $AB$).`,
    steps: [{ instruction: "Multiply the matrices: $AB$, each entry is a row of $A$ dotted with a column of $B$.", answer: mat2(P), accept: [], hint: "Compute row·column dot products." }],
    finalAnswer: { value: mat2(P), unit: "" }, solutionNarrative: `$AB = ${mat2(P)}$.`,
  };
};
fill["laf-apply-and-compose-d3"] = (rng, idx) => {
  const A = rand2x2(rng, -3, 3), B = rand2x2(rng, -3, 3);
  const v = [rng.int(-4, 4), rng.int(-4, 4)];
  const Bv = [B[0][0] * v[0] + B[0][1] * v[1], B[1][0] * v[0] + B[1][1] * v[1]];
  const ABv = [A[0][0] * Bv[0] + A[0][1] * Bv[1], A[1][0] * Bv[0] + A[1][1] * Bv[1]];
  return {
    id: `gen.laf-apply-and-compose-d3.${idx}`, generated: true, concepts: ["apply-and-compose"], difficulty: 3, context: "abstract",
    prompt: `Let $A = ${mat2(A)}$ and $B = ${mat2(B)}$. Compute $(AB)\\vec{v}$ for $\\vec{v} = \\langle ${v.join(", ")} \\rangle$ by first applying $B$, then $A$.`,
    steps: [
      { instruction: "Compute $B\\vec{v}$ first.", answer: `<${Bv.join(", ")}>`, accept: [`(${Bv.join(", ")})`], hint: "Multiply $B$ by $\\vec v$." },
      { instruction: "Apply $A$ to that result.", answer: `<${ABv.join(", ")}>`, accept: [`(${ABv.join(", ")})`], hint: "Multiply $A$ by the vector from the previous step." },
    ],
    finalAnswer: { value: `<${ABv.join(", ")}>`, unit: "" }, solutionNarrative: `$B\\vec v = \\langle ${Bv.join(", ")}\\rangle$, then $A(B\\vec v) = \\langle ${ABv.join(", ")}\\rangle$.`,
  };
};

// kernel-and-image: d1, d2, d3
fill["laf-kernel-and-image-d1"] = (rng, idx) => {
  const rank = rng.int(1, 2), n = 2;
  const nullity = n - rank;
  return {
    id: `gen.laf-kernel-and-image-d1.${idx}`, generated: true, concepts: ["kernel-and-image"], difficulty: 1, context: "abstract",
    prompt: `A linear transformation $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ has rank ${rank}. What is the dimension of its kernel (nullity)?`,
    steps: [{ instruction: "By rank-nullity: nullity = (number of input dimensions) − rank.", answer: `${nullity}`, accept: [], hint: `2 − ${rank}.` }],
    finalAnswer: { value: `${nullity}`, unit: "" }, solutionNarrative: `Nullity $= 2 - ${rank} = ${nullity}$.`,
  };
};
fill["laf-kernel-and-image-d2"] = (rng, idx) => {
  const singular = rng.int(0, 1) === 0;
  let A;
  if (singular) { const a = rng.int(1, 4), b = rng.int(1, 4), k = rng.int(2, 3); A = [[a, b], [k * a, k * b]]; }
  else { A = [[rng.int(1, 4), rng.int(1, 4)], [rng.int(1, 4), rng.int(2, 5)]]; if (A[0][0] * A[1][1] - A[0][1] * A[1][0] === 0) A[1][1] += 1; }
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const rank = det !== 0 ? 2 : 1;
  const nullity = 2 - rank;
  return {
    id: `gen.laf-kernel-and-image-d2.${idx}`, generated: true, concepts: ["kernel-and-image"], difficulty: 2, context: "abstract",
    prompt: `A linear transformation has standard matrix $${mat2(A)}$. Find the rank (dimension of the image) and the nullity (dimension of the kernel).`,
    steps: [
      { instruction: "Compute the determinant to find the rank.", answer: `${rank}`, accept: [], hint: `det $= ${det}$; rank is 2 if nonzero, else 1.` },
      { instruction: "Find the nullity using rank-nullity (2 columns).", answer: `${nullity}`, accept: [], hint: `2 − ${rank}.` },
    ],
    finalAnswer: { value: `${rank}`, unit: "" }, solutionNarrative: `det $= ${det}$, rank $= ${rank}$, nullity $= ${nullity}$.`,
  };
};
fill["laf-kernel-and-image-d3"] = (rng, idx) => {
  const k = nz(rng, -4, 4);
  // T(x,y) = (x + k*y, 2x + 2k*y) -> rank 1, kernel is span of <k, -1> (scaled to integer)
  const A = [[1, k], [2, 2 * k]];
  return {
    id: `gen.laf-kernel-and-image-d3.${idx}`, generated: true, concepts: ["kernel-and-image"], difficulty: 3, context: "abstract",
    prompt: `A linear transformation has standard matrix $${mat2(A)}$. Find a nonzero vector in its kernel (with first component 1), and state the rank.`,
    steps: [
      { instruction: "Solve $A\\vec{v} = \\vec{0}$ for a vector with first component 1: $\\vec v = \\langle 1, t \\rangle$.", answer: `<1, ${frac(-1, k)}>`, accept: [], hint: `From row 1: $1 + ${k}t = 0$, so $t = -1/${k}$.` },
      { instruction: "What is the rank of this transformation?", answer: "1", accept: [], hint: "The second row is a multiple of the first, so only 1 pivot exists." },
    ],
    finalAnswer: { value: `<1, ${frac(-1, k)}>`, unit: "" }, solutionNarrative: `Kernel vector $\\langle 1, ${frac(-1, k)} \\rangle$; rank $= 1$ since the rows are proportional.`,
  };
};

// ============================================================================
// eigenvalues-and-eigenvectors.json
// ============================================================================

// characteristic-equation: d1, d3 (d2 already covered by char-equation-v1)
fill["laf-characteristic-equation-d1"] = (rng, idx) => {
  const l1 = nz(rng, -4, 4), l2 = nz(rng, -4, 4);
  const A = [[l1, 0], [0, l2]];
  const tr = l1 + l2, det = l1 * l2;
  return {
    id: `gen.laf-characteristic-equation-d1.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 1, context: "abstract",
    prompt: `For the diagonal matrix $${mat2(A)}$, find the trace and determinant used in the characteristic equation $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$.`,
    steps: [
      { instruction: "What is the trace (sum of diagonal entries)?", answer: `${tr}`, accept: [], hint: `${l1} + ${l2}.` },
      { instruction: "What is the determinant?", answer: `${det}`, accept: [], hint: `${l1} \\times ${l2}.` },
    ],
    finalAnswer: { value: `tr ${tr}, det ${det}`, unit: "" }, solutionNarrative: `$\\lambda^2 - ${tr}\\lambda + ${det} = 0$.`,
  };
};
fill["laf-characteristic-equation-d3"] = (rng, idx) => {
  const A = rand2x2(rng, -5, 5);
  const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const disc = tr * tr - 4 * det;
  return {
    id: `gen.laf-characteristic-equation-d3.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 3, context: "abstract",
    prompt: `For $A = ${mat2(A)}$, form the characteristic equation $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$ and compute its discriminant.`,
    steps: [
      { instruction: "Find the trace and determinant.", answer: `tr = ${tr}, det = ${det}`, accept: [`${tr}, ${det}`], hint: "Trace is the diagonal sum; determinant is $ad-bc$." },
      { instruction: "Compute the discriminant of $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$, i.e. $\\text{tr}^2 - 4\\det$.", answer: `${disc}`, accept: [], hint: `${tr}^2 - 4(${det}).` },
    ],
    finalAnswer: { value: `${disc}`, unit: "" }, solutionNarrative: `tr $= ${tr}$, det $= ${det}$, discriminant $= ${tr}^2 - 4(${det}) = ${disc}$.`,
  };
};

// find-eigenvalues: d1, d3 (d2 already covered by find-eigenvalues-v1)
fill["laf-find-eigenvalues-d1"] = (rng, idx) => {
  const l1 = nz(rng, -4, 5), l2 = nz(rng, -4, 5);
  const A = [[l1, 0], [0, l2]];
  return {
    id: `gen.laf-find-eigenvalues-d1.${idx}`, generated: true, concepts: ["find-eigenvalues"], difficulty: 1, context: "abstract",
    prompt: `Find the eigenvalues of the diagonal matrix $${mat2(A)}$.`,
    steps: [{ instruction: "For a diagonal matrix, the eigenvalues are the diagonal entries.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`], hint: "Read them straight off the diagonal." }],
    finalAnswer: { value: `${l1}, ${l2}`, unit: "" }, solutionNarrative: `Eigenvalues $${l1}$ and $${l2}$.`,
  };
};
fill["laf-find-eigenvalues-d3"] = (rng, idx) => {
  const l1 = nz(rng, -5, 6), l2 = nz(rng, -5, 6), k = nz(rng, -4, 4);
  const A = [[l1, k], [0, l2]];
  const tr = l1 + l2, det = l1 * l2;
  return {
    id: `gen.laf-find-eigenvalues-d3.${idx}`, generated: true, concepts: ["find-eigenvalues"], difficulty: 3, context: "abstract",
    prompt: `Find the eigenvalues of $${mat2(A)}$ by solving $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$, then verify they match the triangular matrix's diagonal.`,
    steps: [
      { instruction: "State the trace and determinant.", answer: `tr = ${tr}, det = ${det}`, accept: [`${tr}, ${det}`], hint: "Trace is the diagonal sum; determinant is $ad-bc$ (here $ad$ since $c=0$)." },
      { instruction: "Solve the characteristic equation for the eigenvalues.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`], hint: "Factor $\\lambda^2 - (\\text{tr})\\lambda + \\det$, or read them off the triangular diagonal." },
    ],
    finalAnswer: { value: `${l1}, ${l2}`, unit: "" }, solutionNarrative: `Eigenvalues $${l1}$ and $${l2}$ (matching the diagonal of the triangular matrix).`,
  };
};

// find-eigenvectors: d1, d2, d3
fill["laf-find-eigenvectors-d1"] = (rng, idx) => {
  // upper triangular [[a,b],[0,d]], eigenvalues a,d; eigenvector for d: <1, (d-a)/b>
  let a, b, d;
  do { a = nz(rng, -4, 4); d = nz(rng, -4, 4); b = nz(rng, -3, 3); } while (a === d || (d - a) % b !== 0);
  const A = [[a, b], [0, d]];
  const t = (d - a) / b;
  return {
    id: `gen.laf-find-eigenvectors-d1.${idx}`, generated: true, concepts: ["find-eigenvectors"], difficulty: 1, context: "abstract",
    prompt: `The matrix $${mat2(A)}$ has eigenvalues $${a}$ and $${d}$. Find the eigenvector for $\\lambda = ${d}$ with first component 1 (i.e. $\\langle 1, t \\rangle$).`,
    steps: [{ instruction: "Solve $(A - ${d}I)\\vec v = \\vec 0$ for $t$, using first component 1.", answer: `<1, ${t}>`, accept: [], hint: `Row 1 gives $(${a}-${d}) + ${b}t = 0$.` }],
    finalAnswer: { value: `<1, ${t}>`, unit: "" }, solutionNarrative: `Eigenvector $\\langle 1, ${t} \\rangle$.`,
  };
};
fill["laf-find-eigenvectors-d2"] = (rng, idx) => {
  let a, b, d;
  do { a = nz(rng, -5, 5); d = nz(rng, -5, 5); b = nz(rng, -4, 4); } while (a === d || (d - a) % b !== 0);
  const A = [[a, b], [0, d]];
  const t = (d - a) / b;
  return {
    id: `gen.laf-find-eigenvectors-d2.${idx}`, generated: true, concepts: ["find-eigenvectors"], difficulty: 2, context: "abstract",
    prompt: `For $A = ${mat2(A)}$, one eigenvalue is $\\lambda = ${d}$. Solve $(A - ${d}I)\\vec v = \\vec 0$ to find the eigenvector with first component 1.`,
    steps: [
      { instruction: "Write $A - \\lambda I$ for $\\lambda = ${d}$.", answer: mat2([[a - d, b], [0, 0]]), accept: [], hint: "Subtract $\\lambda$ from each diagonal entry." },
      { instruction: "Solve for the eigenvector $\\langle 1, t \\rangle$.", answer: `<1, ${t}>`, accept: [], hint: `$(${a - d}) + ${b}t = 0$.` },
    ],
    finalAnswer: { value: `<1, ${t}>`, unit: "" }, solutionNarrative: `Eigenvector $\\langle 1, ${t} \\rangle$.`,
  };
};
fill["laf-find-eigenvectors-d3"] = (rng, idx) => {
  let a, b, d;
  do { a = nz(rng, -6, 6); d = nz(rng, -6, 6); b = nz(rng, -5, 5); } while (a === d || (d - a) % b !== 0);
  const A = [[a, b], [0, d]];
  const t = (d - a) / b;
  const tr = a + d, det = a * d;
  return {
    id: `gen.laf-find-eigenvectors-d3.${idx}`, generated: true, concepts: ["find-eigenvectors"], difficulty: 3, context: "abstract",
    prompt: `For $A = ${mat2(A)}$: verify the eigenvalues via trace/determinant, then find the eigenvector for $\\lambda = ${d}$ with first component 1.`,
    steps: [
      { instruction: "Confirm: trace and determinant of $A$.", answer: `tr = ${tr}, det = ${det}`, accept: [`${tr}, ${det}`], hint: "Trace is the diagonal sum, determinant is $ad$ here (upper triangular)." },
      { instruction: "Solve $(A - ${d}I)\\vec v = \\vec 0$ for the eigenvector $\\langle 1, t \\rangle$.", answer: `<1, ${t}>`, accept: [], hint: `$(${a}-${d}) + ${b}t = 0$.` },
      { instruction: "Verify: compute $A\\vec v$ and confirm it equals $${d}\\vec v$. State $A\\vec v$.", answer: `<${d}, ${round2(d * t)}>`, accept: [], hint: `$A\\langle 1, ${t}\\rangle$ should equal $\\langle ${d}, ${round2(d * t)} \\rangle$.` },
    ],
    finalAnswer: { value: `<1, ${t}>`, unit: "" }, solutionNarrative: `Eigenvector $\\langle 1, ${t} \\rangle$ for $\\lambda = ${d}$; verified $A\\vec v = ${d}\\vec v$.`,
  };
};

// eigen-applied: d1, d2, d3
fill["laf-eigen-applied-d1"] = (rng, idx) => {
  const l1 = nz(rng, 1, 6), l2 = nz(rng, 1, 6);
  const A = [[l1, 0], [0, l2]];
  const dominant = Math.max(l1, l2);
  return {
    id: `gen.laf-eigen-applied-d1.${idx}`, generated: true, concepts: ["eigen-applied"], difficulty: 1, context: "applied",
    prompt: `A system's growth is modeled by the matrix $${mat2(A)}$ (a diagonal matrix, eigenvalues on the diagonal). Which eigenvalue dominates the long-run behavior (the largest one)?`,
    steps: [{ instruction: "Pick the larger of the two eigenvalues.", answer: `${dominant}`, accept: [], hint: `Compare ${l1} and ${l2}.` }],
    finalAnswer: { value: `${dominant}`, unit: "" }, solutionNarrative: `The dominant eigenvalue is ${dominant}, driving the long-run growth rate.`,
  };
};
fill["laf-eigen-applied-d2"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 4);
  const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return {
    id: `gen.laf-eigen-applied-d2.${idx}`, generated: true, concepts: ["eigen-applied"], difficulty: 2, context: "applied",
    prompt: `A system matrix is $A = ${mat2(A)}$. Without finding the individual eigenvalues, use the trace and determinant to find the sum and product of the eigenvalues.`,
    steps: [
      { instruction: "The sum of the eigenvalues equals the trace. Find it.", answer: `${tr}`, accept: [], hint: "Add the diagonal entries." },
      { instruction: "The product of the eigenvalues equals the determinant. Find it.", answer: `${det}`, accept: [], hint: "$ad - bc$." },
    ],
    finalAnswer: { value: `sum ${tr}, product ${det}`, unit: "" }, solutionNarrative: `Sum of eigenvalues $= \\text{tr}(A) = ${tr}$; product $= \\det(A) = ${det}$.`,
  };
};
fill["laf-eigen-applied-d3"] = (rng, idx) => {
  const l1 = nz(rng, -5, 5), l2 = nz(rng, -5, 5);
  const A = [[l1, 0], [0, l2]];
  const stable = l1 < 0 && l2 < 0;
  return {
    id: `gen.laf-eigen-applied-d3.${idx}`, generated: true, concepts: ["eigen-applied"], difficulty: 3, context: "applied",
    prompt: `A dynamical system $\\vec{x}' = A\\vec{x}$ has matrix $A = ${mat2(A)}$ with eigenvalues on the diagonal. State the eigenvalues, then determine whether the system is stable (all eigenvalues negative). (yes/no)`,
    steps: [
      { instruction: "State the eigenvalues.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`], hint: "They're the diagonal entries." },
      { instruction: "Is the system stable (all eigenvalues negative)? (yes/no)", answer: stable ? "yes" : "no", accept: [], hint: "Stability requires every eigenvalue to be negative." },
    ],
    finalAnswer: { value: stable ? "yes" : "no", unit: "" }, solutionNarrative: `Eigenvalues $${l1}$, $${l2}$; the system is ${stable ? "stable (yes)" : "not stable (no)"}.`,
  };
};

// ============================================================================
// orthogonality-and-least-squares.json
// ============================================================================

// orthogonality-test: d2, d3 (d1 already covered by orthogonality-test-v1)
fill["laf-orthogonality-test-d2"] = (rng, idx) => {
  const orth = rng.int(0, 1) === 0;
  const u = [rng.int(-5, 5), nz(rng, -5, 5)];
  const v = orth ? [-u[1], u[0]] : [rng.int(-5, 5), rng.int(-5, 5)];
  const dot = u[0] * v[0] + u[1] * v[1];
  return {
    id: `gen.laf-orthogonality-test-d2.${idx}`, generated: true, concepts: ["orthogonality-test"], difficulty: 2, context: "abstract",
    prompt: `Compute the dot product of $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$, then state whether they are orthogonal.`,
    steps: [
      { instruction: "Compute the dot product.", answer: `${dot}`, accept: [], hint: `${u[0]}\\cdot${v[0]} + ${u[1]}\\cdot${v[1]}.` },
      { instruction: "Are they orthogonal? (yes/no)", answer: dot === 0 ? "yes" : "no", accept: [], hint: "Orthogonal exactly when the dot product is 0." },
    ],
    finalAnswer: { value: dot === 0 ? "yes" : "no", unit: "" }, solutionNarrative: `Dot product $= ${dot}$: ${dot === 0 ? "orthogonal, yes" : "not orthogonal, no"}.`,
  };
};
fill["laf-orthogonality-test-d3"] = (rng, idx) => {
  const orth = rng.int(0, 1) === 0;
  const u = [rng.int(-5, 5), rng.int(-5, 5), nz(rng, -5, 5)];
  let v;
  if (orth) {
    // pick v with u·v = 0: choose v0, v1 free, solve v2
    let v0 = rng.int(-4, 4), v1 = rng.int(-4, 4);
    while ((u[0] * v0 + u[1] * v1) % u[2] !== 0) { v0 = rng.int(-4, 4); v1 = rng.int(-4, 4); }
    v = [v0, v1, -(u[0] * v0 + u[1] * v1) / u[2]];
  } else {
    v = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  }
  const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return {
    id: `gen.laf-orthogonality-test-d3.${idx}`, generated: true, concepts: ["orthogonality-test"], difficulty: 3, context: "abstract",
    prompt: `In $\\mathbb{R}^3$, are $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ orthogonal? Compute the dot product first.`,
    steps: [
      { instruction: "Compute the dot product (sum of products of matching entries).", answer: `${dot}`, accept: [], hint: `${u[0]}\\cdot${v[0]} + ${u[1]}\\cdot${v[1]} + ${u[2]}\\cdot${v[2]}.` },
      { instruction: "Are they orthogonal? (yes/no)", answer: dot === 0 ? "yes" : "no", accept: [], hint: "Orthogonal exactly when the dot product is 0." },
    ],
    finalAnswer: { value: dot === 0 ? "yes" : "no", unit: "" }, solutionNarrative: `Dot product $= ${dot}$: ${dot === 0 ? "orthogonal, yes" : "not orthogonal, no"}.`,
  };
};

// projections: d1, d3 (d2 already covered by projection-scalar-v1)
fill["laf-projections-d1"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2);
  const k = nz(rng, 1, 3);
  const u = [k * a, k * b]; // u parallel to v -> scalar projection = |u|
  const comp = round2((u[0] * a + u[1] * b) / mag);
  return {
    id: `gen.laf-projections-d1.${idx}`, generated: true, concepts: ["projections"], difficulty: 1, context: "abstract",
    prompt: `Find the scalar projection of $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ onto $\\vec{v} = \\langle ${a}, ${b} \\rangle$.`,
    steps: [{ instruction: "Scalar projection $= \\dfrac{\\vec{u}\\cdot\\vec{v}}{|\\vec{v}|}$.", answer: `${comp}`, accept: [], hint: `$\\vec u \\cdot \\vec v = ${u[0] * a + u[1] * b}$, $|\\vec v| = ${mag}$.` }],
    finalAnswer: { value: `${comp}`, unit: "" }, solutionNarrative: `$\\frac{${u[0] * a + u[1] * b}}{${mag}} = ${comp}$.`,
  };
};
fill["laf-projections-d3"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2);
  const u = [rng.int(-6, 7), rng.int(-6, 7)];
  const scalar = (u[0] * a + u[1] * b) / (mag * mag); // as a fraction of mag^2
  const projVec = [round2(scalar * a), round2(scalar * b)];
  return {
    id: `gen.laf-projections-d3.${idx}`, generated: true, concepts: ["projections"], difficulty: 3, context: "abstract",
    prompt: `Find the full vector projection of $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ onto $\\vec{v} = \\langle ${a}, ${b} \\rangle$ (round to 2 decimals). Use $\\text{proj}_{\\vec v}\\vec u = \\dfrac{\\vec u \\cdot \\vec v}{\\vec v \\cdot \\vec v}\\vec v$.`,
    steps: [
      { instruction: "Compute the scalar factor $\\dfrac{\\vec u \\cdot \\vec v}{\\vec v \\cdot \\vec v}$ (round to 4 decimals).", answer: `${Math.round(scalar * 10000) / 10000}`, accept: [], hint: `$\\vec u \\cdot \\vec v = ${u[0] * a + u[1] * b}$, $\\vec v \\cdot \\vec v = ${mag * mag}$.` },
      { instruction: "Multiply that scalar by $\\vec v$ to get the projection vector.", answer: `<${projVec.join(", ")}>`, accept: [`(${projVec.join(", ")})`], hint: "Scale each component of $\\vec v$ by the factor from the previous step." },
    ],
    finalAnswer: { value: `<${projVec.join(", ")}>`, unit: "" }, solutionNarrative: `$\\text{proj}_{\\vec v}\\vec u = \\langle ${projVec.join(", ")} \\rangle$.`,
  };
};

// orthonormal-and-normalize: d1, d3 (d2 already covered by normalize-v1)
fill["laf-orthonormal-and-normalize-d1"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2);
  return {
    id: `gen.laf-orthonormal-and-normalize-d1.${idx}`, generated: true, concepts: ["orthonormal-and-normalize"], difficulty: 1, context: "abstract",
    prompt: `Find the magnitude of $\\vec{v} = \\langle ${a}, ${b} \\rangle$, the first step in normalizing it.`,
    steps: [{ instruction: "Magnitude $= \\sqrt{a^2 + b^2}$.", answer: `${mag}`, accept: [], hint: `$\\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}$.` }],
    finalAnswer: { value: `${mag}`, unit: "" }, solutionNarrative: `$\\lVert \\vec v \\rVert = ${mag}$.`,
  };
};
fill["laf-orthonormal-and-normalize-d3"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2);
  const sa = rng.int(0, 1) ? a : -a, sb = rng.int(0, 1) ? b : -b;
  const u1 = [frac(sa, mag), frac(sb, mag)];
  // orthogonal partner in R2: <-b, a> scaled the same way, also unit length
  const u2 = [frac(-sb, mag), frac(sa, mag)];
  return {
    id: `gen.laf-orthonormal-and-normalize-d3.${idx}`, generated: true, concepts: ["orthonormal-and-normalize"], difficulty: 3, context: "abstract",
    prompt: `Normalize $\\vec{v} = \\langle ${sa}, ${sb} \\rangle$ to get $\\hat u_1$, then find a second unit vector $\\hat u_2 = \\langle -\\hat u_{1,2}, \\hat u_{1,1} \\rangle$ orthogonal to it (using fractions).`,
    steps: [
      { instruction: "Normalize $\\vec v$ (divide each component by its magnitude).", answer: `<${u1.join(", ")}>`, accept: [`(${u1.join(", ")})`], hint: `The magnitude is ${mag}.` },
      { instruction: "Rotate $\\hat u_1$ by 90° to get $\\hat u_2 = \\langle -\\hat u_{1,2}, \\hat u_{1,1} \\rangle$.", answer: `<${u2.join(", ")}>`, accept: [`(${u2.join(", ")})`], hint: "Swap the components and negate the new first one." },
    ],
    finalAnswer: { value: `<${u1.join(", ")}>`, unit: "" }, solutionNarrative: `$\\hat u_1 = \\langle ${u1.join(", ")} \\rangle$, $\\hat u_2 = \\langle ${u2.join(", ")} \\rangle$; together an orthonormal set.`,
  };
};

// least-squares-applied: d1, d2, d3
fill["laf-least-squares-applied-d1"] = (rng, idx) => {
  const n = rng.int(3, 5);
  const vals = Array.from({ length: n }, () => rng.int(1, 20));
  const sum = vals.reduce((s, x) => s + x, 0);
  const mean = round2(sum / n);
  return {
    id: `gen.laf-least-squares-applied-d1.${idx}`, generated: true, concepts: ["least-squares-applied"], difficulty: 1, context: "applied",
    prompt: `The best constant fit to data $\\{${vals.join(", ")}\\}$ (least squares, no slope) is the mean. Find it (round to 2 decimals).`,
    steps: [{ instruction: "Average the data values.", answer: `${mean}`, accept: [], hint: `Sum is ${sum}, divide by ${n}.` }],
    finalAnswer: { value: `${mean}`, unit: "" }, solutionNarrative: `Mean $= ${sum}/${n} = ${mean}$.`,
  };
};
fill["laf-least-squares-applied-d2"] = (rng, idx) => {
  // points (0,c),(1,c+m),(2,c+2m) exact on a line -> best-fit slope = m exactly
  const m = nz(rng, -5, 5), c = rng.int(-5, 10);
  const pts = [0, 1, 2].map((x) => [x, c + m * x]);
  return {
    id: `gen.laf-least-squares-applied-d2.${idx}`, generated: true, concepts: ["least-squares-applied"], difficulty: 2, context: "applied",
    prompt: `Find the best-fit slope $m$ for the points $(${pts[0].join(",")}), (${pts[1].join(",")}), (${pts[2].join(",")})$ using $m = \\dfrac{n\\sum xy - \\sum x \\sum y}{n\\sum x^2 - (\\sum x)^2}$.`,
    steps: [{ instruction: "Compute the best-fit slope.", answer: `${m}`, accept: [], hint: "These points are exactly collinear, so the slope is exact." }],
    finalAnswer: { value: `${m}`, unit: "" }, solutionNarrative: `The points lie exactly on a line of slope ${m}, so $m = ${m}$.`,
  };
};
fill["laf-least-squares-applied-d3"] = (rng, idx) => {
  const m = nz(rng, -4, 4), c = rng.int(-5, 10);
  const pts = [0, 1, 2].map((x) => [x, c + m * x]);
  const xNew = rng.int(3, 6);
  const yPred = c + m * xNew;
  return {
    id: `gen.laf-least-squares-applied-d3.${idx}`, generated: true, concepts: ["least-squares-applied"], difficulty: 3, context: "applied",
    prompt: `Points $(${pts[0].join(",")}), (${pts[1].join(",")}), (${pts[2].join(",")})$ lie on a line. Find the best-fit slope $m$ and intercept $b$, then predict $y$ at $x = ${xNew}$.`,
    steps: [
      { instruction: "Find the slope $m$.", answer: `${m}`, accept: [], hint: "Use consecutive points' rise over run — they're exactly collinear." },
      { instruction: "Find the intercept $b$ (value at $x=0$).", answer: `${c}`, accept: [], hint: "Read the y-value at $x=0$." },
      { instruction: `Predict $y$ at $x = ${xNew}$ using $y = mx + b$.`, answer: `${yPred}`, accept: [], hint: `${m}(${xNew}) + ${c}.` },
    ],
    finalAnswer: { value: `${yPred}`, unit: "" }, solutionNarrative: `$y = ${m}x ${signed(c)}$; at $x=${xNew}$, $y = ${yPred}$.`,
  };
};
