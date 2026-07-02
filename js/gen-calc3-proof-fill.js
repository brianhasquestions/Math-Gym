// gen-calc3-proof-fill.js
// Self-contained generator pack for calculus-3.vector-proofs (template prefix c3p-).
// One generator per concept per difficulty tier (4 concepts x 3 tiers = 12).
// Exports a `fill` map of template-name -> generator fn, matching the shape
// used by js/generator.js's `generators` map (same pattern as gen-de-fill.js).
//
// Grading notes baked into the answers (verified against the real checkStep):
// - Subscripted names (v1, w2, u3) parse as single variables, and juxtaposition
//   works (v2w3 == v2*w3), with full multivariable polynomial equivalence.
// - Symbolic entries inside <...> tuples do NOT get polynomial equivalence,
//   so all symbolic work is graded as scalar polynomial steps; tuples are
//   reserved for integer entries (where (a, b, c) == <a, b, c> and
//   fractions == decimals both grade).
// - A step answer of "0" accepts any polynomially-zero expansion.

const V = (...xs) => `<${xs.join(", ")}>`;
const Pn = (...xs) => `(${xs.join(", ")})`;
const Vt = (xs) => `\\langle ${xs.join(", ")} \\rangle`; // LaTeX tuple for prompts
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mag2 = (a) => dot(a, a);
const isZero = (a) => a.every((x) => x === 0);

export const fill = {};

// ============================================================================
// concept: component-expansion-proofs
// ============================================================================

// d1: prove dot-product commutativity by expansion (symbolic).
fill["c3p-dot-commute-d1"] = (rng, idx) => {
  const [A, B] = rng.pick([["u", "v"], ["v", "w"], ["a", "b"], ["p", "q"]]);
  const lhs = `${A}1${B}1 + ${A}2${B}2 + ${A}3${B}3`;
  const lhsStar = `${A}1*${B}1 + ${A}2*${B}2 + ${A}3*${B}3`;
  const rhs = `${B}1${A}1 + ${B}2${A}2 + ${B}3${A}3`;
  return {
    id: `gen.c3p-dot-commute-d1.${idx}`, generated: true, concepts: ["component-expansion-proofs"], difficulty: 1, context: "abstract",
    prompt: `Prove the dot product is commutative: for $\\vec{${A}} = \\langle ${A}_1, ${A}_2, ${A}_3 \\rangle$ and $\\vec{${B}} = \\langle ${B}_1, ${B}_2, ${B}_3 \\rangle$, show $\\vec{${A}} \\cdot \\vec{${B}} = \\vec{${B}} \\cdot \\vec{${A}}$. (Type subscripts inline: $${A}_1 ${B}_1$ is ${A}1${B}1.)`,
    steps: [
      { instruction: `Expand the left side $\\vec{${A}} \\cdot \\vec{${B}}$ in components.`, answer: lhs, accept: [lhsStar], hint: `Multiply matching components and add: $${A}_1${B}_1 + ${A}_2${B}_2 + ${A}_3${B}_3$.` },
      { instruction: `Expand the right side $\\vec{${B}} \\cdot \\vec{${A}}$ in components.`, answer: rhs, accept: [lhs], hint: `Same recipe with the factors in the other order: $${B}_1${A}_1 + ${B}_2${A}_2 + ${B}_3${A}_3$.` },
      { instruction: "Multiplying numbers commutes, so the terms match one for one. Are the two expansions equal? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: `$${B}_1${A}_1 = ${A}_1${B}_1$, and likewise for each term.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Both sides expand to $${A}_1${B}_1 + ${A}_2${B}_2 + ${A}_3${B}_3$, so the dot product commutes for all vectors.`,
  };
};

// d2: prove the scalar pull-out rule (k v) . w = k (v . w) (symbolic).
fill["c3p-dot-scalar-d2"] = (rng, idx) => {
  const k = rng.pick(["k", "m", "t"]);
  const [A, B] = rng.pick([["u", "v"], ["v", "w"], ["a", "b"]]);
  const star = `${k}*${A}1*${B}1 + ${k}*${A}2*${B}2 + ${k}*${A}3*${B}3`;
  const juxt = `${k}${A}1${B}1 + ${k}${A}2${B}2 + ${k}${A}3${B}3`;
  const factored = `${k}(${A}1${B}1 + ${A}2${B}2 + ${A}3${B}3)`;
  return {
    id: `gen.c3p-dot-scalar-d2.${idx}`, generated: true, concepts: ["component-expansion-proofs"], difficulty: 2, context: "abstract",
    prompt: `Prove the scalar pull-out rule $(${k}\\vec{${A}}) \\cdot \\vec{${B}} = ${k}(\\vec{${A}} \\cdot \\vec{${B}})$ for $\\vec{${A}} = \\langle ${A}_1, ${A}_2, ${A}_3 \\rangle$, $\\vec{${B}} = \\langle ${B}_1, ${B}_2, ${B}_3 \\rangle$, and any scalar $${k}$. (Type $${k}${A}_1${B}_1$ as ${k}${A}1${B}1.)`,
    steps: [
      { instruction: `The scaled vector is $${k}\\vec{${A}} = \\langle ${k}${A}_1, ${k}${A}_2, ${k}${A}_3 \\rangle$. Expand the left side $(${k}\\vec{${A}}) \\cdot \\vec{${B}}$.`, answer: star, accept: [juxt, factored], hint: `Each term is (scaled component)(matching component): $${k}${A}_1${B}_1 + ${k}${A}_2${B}_2 + ${k}${A}_3${B}_3$.` },
      { instruction: `Expand the right side $${k}(\\vec{${A}} \\cdot \\vec{${B}})$ (you may leave $${k}$ factored out).`, answer: factored, accept: [star, juxt], hint: `Dot first, then scale: $${k}(${A}_1${B}_1 + ${A}_2${B}_2 + ${A}_3${B}_3)$.` },
      { instruction: `Distributing $${k}$ over the sum makes the two sides identical. Does the identity hold for every scalar and every pair of vectors? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "The distributive law finishes the proof." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$(${k}\\vec{${A}}) \\cdot \\vec{${B}}$ expands to $${k}${A}_1${B}_1 + ${k}${A}_2${B}_2 + ${k}${A}_3${B}_3$, which is $${k}$ distributed over the dot product — the scalar pulls out.`,
  };
};

// d3: prove distributivity u . (v + w) = u.v + u.w (symbolic).
fill["c3p-dot-distribute-d3"] = (rng, idx) => {
  const [U, A, B] = rng.pick([["u", "v", "w"], ["a", "b", "c"]]);
  const lhs = `${U}1(${A}1+${B}1) + ${U}2(${A}2+${B}2) + ${U}3(${A}3+${B}3)`;
  const lhsExp = `${U}1${A}1 + ${U}1${B}1 + ${U}2${A}2 + ${U}2${B}2 + ${U}3${A}3 + ${U}3${B}3`;
  const rhs = `${U}1${A}1 + ${U}2${A}2 + ${U}3${A}3 + ${U}1${B}1 + ${U}2${B}2 + ${U}3${B}3`;
  return {
    id: `gen.c3p-dot-distribute-d3.${idx}`, generated: true, concepts: ["component-expansion-proofs"], difficulty: 3, context: "abstract",
    prompt: `Prove the dot product distributes over addition: $\\vec{${U}} \\cdot (\\vec{${A}} + \\vec{${B}}) = \\vec{${U}} \\cdot \\vec{${A}} + \\vec{${U}} \\cdot \\vec{${B}}$ for $\\vec{${U}} = \\langle ${U}_1, ${U}_2, ${U}_3 \\rangle$, $\\vec{${A}} = \\langle ${A}_1, ${A}_2, ${A}_3 \\rangle$, $\\vec{${B}} = \\langle ${B}_1, ${B}_2, ${B}_3 \\rangle$. (Type subscripts inline: $${U}_1${A}_1$ is ${U}1${A}1.)`,
    steps: [
      { instruction: `What is the first component of $\\vec{${A}} + \\vec{${B}}$?`, answer: `${A}1 + ${B}1`, accept: [`${A}1+${B}1`], hint: "Vectors add componentwise." },
      { instruction: `Expand the left side $\\vec{${U}} \\cdot (\\vec{${A}} + \\vec{${B}})$.`, answer: lhs, accept: [lhsExp], hint: `$${U}_1(${A}_1+${B}_1) + ${U}_2(${A}_2+${B}_2) + ${U}_3(${A}_3+${B}_3)$.` },
      { instruction: `Expand the right side $\\vec{${U}} \\cdot \\vec{${A}} + \\vec{${U}} \\cdot \\vec{${B}}$.`, answer: rhs, accept: [lhs], hint: `Two dot products added: $${U}_1${A}_1 + ${U}_2${A}_2 + ${U}_3${A}_3 + ${U}_1${B}_1 + ${U}_2${B}_2 + ${U}_3${B}_3$.` },
      { instruction: `Distributing each $${U}_i$ on the left gives exactly the right side's six terms. Does the identity hold for all vectors? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `$${U}_1(${A}_1+${B}_1) = ${U}_1${A}_1 + ${U}_1${B}_1$, and similarly in each slot.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Expanding the left side and distributing each $${U}_i$ produces the same six terms as the right side, so the dot product distributes over vector addition.`,
  };
};

// ============================================================================
// concept: orthogonality-proofs
// ============================================================================

// d1: numeric, vectors in the xy-plane so the cross product is <0, 0, D>.
fill["c3p-orth-plane-d1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4), c = rng.int(1, 4);
  let d = rng.int(1, 4);
  while (a * d === b * c) d += 1; // keep the vectors non-parallel
  const D = a * d - b * c;
  const v = [a, b, 0], w = [c, d, 0];
  return {
    id: `gen.c3p-orth-plane-d1.${idx}`, generated: true, concepts: ["orthogonality-proofs"], difficulty: 1, context: "abstract",
    prompt: `Show that $\\vec{v} \\times \\vec{w}$ is perpendicular to $\\vec{v}$ for $\\vec{v} = ${Vt(v)}$ and $\\vec{w} = ${Vt(w)}$.`,
    steps: [
      { instruction: "Compute the cross product $\\vec{v} \\times \\vec{w}$.", answer: V(0, 0, D), accept: [Pn(0, 0, D)], hint: `Both vectors lie in the $xy$-plane, so only the third component survives: $${a}(${d}) - ${b}(${c}) = ${D}$.` },
      { instruction: "Compute the dot product $(\\vec{v} \\times \\vec{w}) \\cdot \\vec{v}$.", answer: "0", accept: [], hint: `$0(${a}) + 0(${b}) + (${D})(0) = 0$.` },
      { instruction: "Is $\\vec{v} \\times \\vec{w}$ perpendicular to $\\vec{v}$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "A zero dot product means perpendicular." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$\\vec{v} \\times \\vec{w} = ${Vt([0, 0, D])}$, and dotting with $\\vec{v}$ gives 0, so the cross product is perpendicular to $\\vec{v}$.`,
  };
};

// d2: numeric, full 3D — verify perpendicularity to BOTH inputs.
fill["c3p-orth-3d-d2"] = (rng, idx) => {
  const v = [rng.int(1, 3), rng.int(-2, 2), rng.int(0, 2)];
  const w = [rng.int(-2, 2), rng.int(1, 3), rng.int(0, 2)];
  let n = cross(v, w);
  while (isZero(n)) { w[2] += 1; n = cross(v, w); }
  return {
    id: `gen.c3p-orth-3d-d2.${idx}`, generated: true, concepts: ["orthogonality-proofs"], difficulty: 2, context: "applied",
    prompt: `A graphics engine takes triangle edge vectors $\\vec{v} = ${Vt(v)}$ and $\\vec{w} = ${Vt(w)}$ and uses $\\vec{n} = \\vec{v} \\times \\vec{w}$ as the surface normal. Verify $\\vec{n}$ is perpendicular to both edges.`,
    steps: [
      { instruction: "Compute the normal $\\vec{n} = \\vec{v} \\times \\vec{w}$.", answer: V(...n), accept: [Pn(...n)], hint: `First: $${v[1]}(${w[2]}) - ${v[2]}(${w[1]})$; second: $${v[2]}(${w[0]}) - ${v[0]}(${w[2]})$; third: $${v[0]}(${w[1]}) - ${v[1]}(${w[0]})$.` },
      { instruction: "Compute $\\vec{n} \\cdot \\vec{v}$.", answer: "0", accept: [], hint: `$(${n[0]})(${v[0]}) + (${n[1]})(${v[1]}) + (${n[2]})(${v[2]})$ — the terms cancel to 0.` },
      { instruction: "Compute $\\vec{n} \\cdot \\vec{w}$.", answer: "0", accept: [], hint: `$(${n[0]})(${w[0]}) + (${n[1]})(${w[1]}) + (${n[2]})(${w[2]})$ — again 0.` },
      { instruction: "Is $\\vec{n}$ a valid normal for the triangle? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "It is perpendicular to both edge vectors." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$\\vec{n} = ${Vt(n)}$ dots to 0 against both $\\vec{v}$ and $\\vec{w}$, so it is a genuine normal — guaranteed by the cross product's orthogonality theorem.`,
  };
};

// d3: fully symbolic proof that (v x w) . v = 0.
fill["c3p-orth-symbolic-d3"] = (rng, idx) => {
  const [A, B] = rng.pick([["v", "w"], ["u", "v"], ["a", "b"]]);
  const c1 = `${A}2${B}3 - ${A}3${B}2`;
  const c2 = `${A}3${B}1 - ${A}1${B}3`;
  const c3 = `${A}1${B}2 - ${A}2${B}1`;
  const zeroExp = `${A}1(${A}2${B}3-${A}3${B}2) + ${A}2(${A}3${B}1-${A}1${B}3) + ${A}3(${A}1${B}2-${A}2${B}1)`;
  return {
    id: `gen.c3p-orth-symbolic-d3.${idx}`, generated: true, concepts: ["orthogonality-proofs"], difficulty: 3, context: "abstract",
    prompt: `Prove, for ALL vectors, that $\\vec{${A}} \\times \\vec{${B}}$ is perpendicular to $\\vec{${A}}$, where $\\vec{${A}} = \\langle ${A}_1, ${A}_2, ${A}_3 \\rangle$ and $\\vec{${B}} = \\langle ${B}_1, ${B}_2, ${B}_3 \\rangle$. (Type subscripts inline: $${A}_2${B}_3$ is ${A}2${B}3.)`,
    steps: [
      { instruction: `Write the first component of $\\vec{${A}} \\times \\vec{${B}}$.`, answer: c1, accept: [`${A}2*${B}3 - ${A}3*${B}2`], hint: `$${A}_2${B}_3 - ${A}_3${B}_2$.` },
      { instruction: `Write the second component of $\\vec{${A}} \\times \\vec{${B}}$.`, answer: c2, accept: [`${A}3*${B}1 - ${A}1*${B}3`], hint: `The middle component uses the 'backwards' pairing: $${A}_3${B}_1 - ${A}_1${B}_3$.` },
      { instruction: `Write the third component of $\\vec{${A}} \\times \\vec{${B}}$.`, answer: c3, accept: [`${A}1*${B}2 - ${A}2*${B}1`], hint: `$${A}_1${B}_2 - ${A}_2${B}_1$.` },
      { instruction: `Expand $(\\vec{${A}} \\times \\vec{${B}}) \\cdot \\vec{${A}}$ fully and simplify. What does it equal?`, answer: "0", accept: [zeroExp], hint: "All six terms cancel in opposite-sign pairs." },
      { instruction: `No values were ever assigned, so this holds for every $\\vec{${A}}$ and $\\vec{${B}}$. Is the cross product always perpendicular to $\\vec{${A}}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "An identically-zero dot product means perpendicular, always." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Dotting the cross product back into $\\vec{${A}}$ gives six terms that cancel in pairs, leaving 0 for every choice of components — perpendicularity is proven, not assumed.`,
  };
};

// ============================================================================
// concept: identity-verification
// ============================================================================

// d1: Lagrange's identity on axis-aligned vectors.
fill["c3p-lagrange-axis-d1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(2, 5);
  const v = [a, 0, 0], w = [0, b, 0];
  const prod = a * a * b * b;
  return {
    id: `gen.c3p-lagrange-axis-d1.${idx}`, generated: true, concepts: ["identity-verification"], difficulty: 1, context: "abstract",
    prompt: `Verify Lagrange's identity $|\\vec{v} \\times \\vec{w}|^2 = |\\vec{v}|^2|\\vec{w}|^2 - (\\vec{v} \\cdot \\vec{w})^2$ for $\\vec{v} = ${Vt(v)}$ and $\\vec{w} = ${Vt(w)}$.`,
    steps: [
      { instruction: "Compute the dot product $\\vec{v} \\cdot \\vec{w}$.", answer: "0", accept: [], hint: `$${a}(0) + 0(${b}) + 0(0) = 0$.` },
      { instruction: "Compute $|\\vec{v}|^2 |\\vec{w}|^2$.", answer: `${prod}`, accept: [], hint: `$|\\vec{v}|^2 = ${a * a}$ and $|\\vec{w}|^2 = ${b * b}$.` },
      { instruction: "Compute the cross product $\\vec{v} \\times \\vec{w}$.", answer: V(0, 0, a * b), accept: [Pn(0, 0, a * b)], hint: `Only the third component survives: $${a}(${b}) - 0(0) = ${a * b}$.` },
      { instruction: `Compute $|\\vec{v} \\times \\vec{w}|^2$ and compare with $${prod} - 0$. What is $|\\vec{v} \\times \\vec{w}|^2$?`, answer: `${prod}`, accept: [], hint: `$(${a * b})^2 = ${prod}$ — both sides agree.` },
    ],
    finalAnswer: { value: `${prod}`, unit: "" },
    solutionNarrative: `Both sides equal ${prod}: $|\\vec{v} \\times \\vec{w}|^2 = (${a * b})^2$ and $|\\vec{v}|^2|\\vec{w}|^2 - 0 = ${prod}$. Lagrange's identity checks out.`,
  };
};

// d2: Lagrange's identity on general small integer vectors.
fill["c3p-lagrange-d2"] = (rng, idx) => {
  const v = [rng.int(1, 2), rng.int(0, 2), rng.int(1, 2)];
  const w = [rng.int(1, 2), rng.int(-1, 1), rng.int(0, 2)];
  while (isZero(cross(v, w))) w[2] += 1; // keep v, w non-parallel so the cross product is nonzero
  const d0 = dot(v, w);
  const m1 = mag2(v), m2 = mag2(w);
  const rhs = m1 * m2 - d0 * d0; // equals |v x w|^2 by the identity
  return {
    id: `gen.c3p-lagrange-d2.${idx}`, generated: true, concepts: ["identity-verification"], difficulty: 2, context: "abstract",
    prompt: `Verify Lagrange's identity $|\\vec{v} \\times \\vec{w}|^2 = |\\vec{v}|^2|\\vec{w}|^2 - (\\vec{v} \\cdot \\vec{w})^2$ for $\\vec{v} = ${Vt(v)}$ and $\\vec{w} = ${Vt(w)}$.`,
    steps: [
      { instruction: "Compute $\\vec{v} \\cdot \\vec{w}$.", answer: `${d0}`, accept: [], hint: `$${v[0]}(${w[0]}) + ${v[1]}(${w[1]}) + ${v[2]}(${w[2]})$.` },
      { instruction: "Compute $|\\vec{v}|^2$.", answer: `${m1}`, accept: [], hint: `$${v[0]}^2 + ${v[1]}^2 + ${v[2]}^2$.` },
      { instruction: "Compute $|\\vec{w}|^2$.", answer: `${m2}`, accept: [], hint: `$${w[0]}^2 + ${w[1]}^2 + ${w[2]}^2$.` },
      { instruction: "Compute the right side $|\\vec{v}|^2|\\vec{w}|^2 - (\\vec{v} \\cdot \\vec{w})^2$.", answer: `${rhs}`, accept: [], hint: `$${m1} \\cdot ${m2} - (${d0})^2 = ${m1 * m2} - ${d0 * d0}$.` },
      { instruction: "Now compute the left side directly: find $\\vec{v} \\times \\vec{w}$ and take $|\\vec{v} \\times \\vec{w}|^2$. What do you get?", answer: `${rhs}`, accept: [], hint: `$\\vec{v} \\times \\vec{w} = ${Vt(cross(v, w))}$; sum the squares of its components.` },
    ],
    finalAnswer: { value: `${rhs}`, unit: "" },
    solutionNarrative: `The right side gives $${m1}(${m2}) - ${d0 * d0} = ${rhs}$, and computing $\\vec{v} \\times \\vec{w} = ${Vt(cross(v, w))}$ directly gives $|\\vec{v} \\times \\vec{w}|^2 = ${rhs}$ as well — the identity holds.`,
  };
};

// d3: cyclic symmetry of the scalar triple product on structured integer vectors.
fill["c3p-triple-cyclic-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3), c = rng.int(1, 3);
  const d = rng.int(0, 3), e = rng.int(0, 3);
  const u = [d, e, 1], v = [1, a, 0], w = [b, 1, c];
  const n1 = cross(v, w); // <ac, -c, 1-ab> — never the zero vector since c >= 1
  const t = dot(u, n1);
  const n2 = cross(w, u);
  return {
    id: `gen.c3p-triple-cyclic-d3.${idx}`, generated: true, concepts: ["identity-verification"], difficulty: 3, context: "abstract",
    prompt: `Verify the cyclic symmetry of the scalar triple product, $\\vec{u} \\cdot (\\vec{v} \\times \\vec{w}) = \\vec{v} \\cdot (\\vec{w} \\times \\vec{u})$, for $\\vec{u} = ${Vt(u)}$, $\\vec{v} = ${Vt(v)}$, $\\vec{w} = ${Vt(w)}$.`,
    steps: [
      { instruction: "Compute $\\vec{v} \\times \\vec{w}$.", answer: V(...n1), accept: [Pn(...n1)], hint: `First: $${v[1]}(${w[2]}) - ${v[2]}(${w[1]})$; second: $${v[2]}(${w[0]}) - ${v[0]}(${w[2]})$; third: $${v[0]}(${w[1]}) - ${v[1]}(${w[0]})$.` },
      { instruction: "Compute $\\vec{u} \\cdot (\\vec{v} \\times \\vec{w})$.", answer: `${t}`, accept: [], hint: `$${u[0]}(${n1[0]}) + ${u[1]}(${n1[1]}) + ${u[2]}(${n1[2]})$.` },
      { instruction: "Now compute $\\vec{w} \\times \\vec{u}$.", answer: V(...n2), accept: [Pn(...n2)], hint: `First: $${w[1]}(${u[2]}) - ${w[2]}(${u[1]})$; second: $${w[2]}(${u[0]}) - ${w[0]}(${u[2]})$; third: $${w[0]}(${u[1]}) - ${w[1]}(${u[0]})$.` },
      { instruction: "Compute $\\vec{v} \\cdot (\\vec{w} \\times \\vec{u})$.", answer: `${t}`, accept: [], hint: `$${v[0]}(${n2[0]}) + ${v[1]}(${n2[1]}) + ${v[2]}(${n2[2]})$.` },
      { instruction: "Do the two triple products agree, confirming the cyclic symmetry? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: `Both equal ${t} — the signed volume doesn't care which vector leads the cycle.` },
    ],
    finalAnswer: { value: `${t}`, unit: "" },
    solutionNarrative: `$\\vec{u} \\cdot (\\vec{v} \\times \\vec{w}) = ${t}$ and $\\vec{v} \\cdot (\\vec{w} \\times \\vec{u}) = ${t}$: cycling the vectors leaves the scalar triple product unchanged.`,
  };
};

// ============================================================================
// concept: geometric-vector-proofs
// ============================================================================

// d1: parallelogram diagonals bisect each other (numeric).
fill["c3p-geom-parallelogram-d1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(0, 3), c = rng.int(0, 3);
  let d = rng.int(1, 4);
  while (a * d === b * c) d += 1; // keep O, A, B non-collinear
  const A = [2 * a, 2 * b], B = [2 * c, 2 * d];
  const C = [A[0] + B[0], A[1] + B[1]];
  const mid = [a + c, b + d];
  return {
    id: `gen.c3p-geom-parallelogram-d1.${idx}`, generated: true, concepts: ["geometric-vector-proofs"], difficulty: 1, context: "abstract",
    prompt: `Parallelogram $OACB$ has vertices $O = (0,0)$, $A = (${A.join(",")})$, $B = (${B.join(",")})$, and $C = A + B$. Show its diagonals $OC$ and $AB$ bisect each other. (Give points as 2D vectors like <3, 2>.)`,
    steps: [
      { instruction: "Find the coordinates of $C = A + B$.", answer: V(...C), accept: [Pn(...C)], hint: `Add componentwise: $(${A[0]}+${B[0]}, ${A[1]}+${B[1]})$.` },
      { instruction: "Find the midpoint of diagonal $OC$.", answer: V(...mid), accept: [Pn(...mid)], hint: "Halve each coordinate of $C$." },
      { instruction: "Find the midpoint of diagonal $AB$.", answer: V(...mid), accept: [Pn(...mid)], hint: `Average the coordinates: $\\left(\\frac{${A[0]}+${B[0]}}{2}, \\frac{${A[1]}+${B[1]}}{2}\\right)$.` },
      { instruction: "The midpoints coincide. Do the diagonals bisect each other? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "One shared midpoint cuts both diagonals in half." },
    ],
    finalAnswer: { value: V(...mid), unit: "" },
    solutionNarrative: `$C = (${C.join(",")})$; both diagonals have midpoint $(${mid.join(",")})$, so they bisect each other.`,
  };
};

// d2: midsegment theorem (numeric).
fill["c3p-geom-midsegment-d2"] = (rng, idx) => {
  const p = rng.int(1, 4), q = rng.int(0, 3), r = rng.int(0, 4);
  let s = rng.int(1, 4);
  while (p * s === q * r) s += 1; // keep A, B, C non-collinear (a real triangle; also keeps the midsegment nonzero)
  const B = [2 * p, 2 * q], C = [2 * r, 2 * s];
  const M1 = [p, q], M2 = [r, s];
  const seg = [r - p, s - q], side = [2 * (r - p), 2 * (s - q)];
  return {
    id: `gen.c3p-geom-midsegment-d2.${idx}`, generated: true, concepts: ["geometric-vector-proofs"], difficulty: 2, context: "abstract",
    prompt: `Triangle $ABC$ has $A = (0,0)$, $B = (${B.join(",")})$, $C = (${C.join(",")})$. Verify the midsegment theorem: the segment joining the midpoints of $AB$ and $AC$ is parallel to $BC$ and half its length.`,
    steps: [
      { instruction: "Find $M_1$, the midpoint of $AB$.", answer: V(...M1), accept: [Pn(...M1)], hint: "Halve $B$'s coordinates." },
      { instruction: "Find $M_2$, the midpoint of $AC$.", answer: V(...M2), accept: [Pn(...M2)], hint: "Halve $C$'s coordinates." },
      { instruction: "Compute the midsegment vector $M_2 - M_1$.", answer: V(...seg), accept: [Pn(...seg)], hint: `$(${r}-${p}, ${s}-${q})$.` },
      { instruction: "Compute the side vector $\\vec{BC} = C - B$.", answer: V(...side), accept: [Pn(...side)], hint: `$(${C[0]}-${B[0]}, ${C[1]}-${B[1]})$.` },
      { instruction: "$\\vec{BC}$ is how many times the midsegment vector? (Give a number.)", answer: "2", accept: [], hint: `$${Vt(side)} = 2${Vt(seg)}$ — parallel, and the midsegment is half as long.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `Midsegment $= ${Vt(seg)}$ and $\\vec{BC} = ${Vt(side)} = 2 \\cdot ${Vt(seg)}$: parallel and twice the midsegment, as the theorem promises.`,
  };
};

// d3: gradient is perpendicular to the level curve at a point (numeric).
fill["c3p-geom-gradient-d3"] = (rng, idx) => {
  const x0 = rng.int(1, 5), y0 = rng.int(1, 5);
  const r2 = x0 * x0 + y0 * y0;
  const g = [2 * x0, 2 * y0], tan = [-y0, x0];
  return {
    id: `gen.c3p-geom-gradient-d3.${idx}`, generated: true, concepts: ["geometric-vector-proofs"], difficulty: 3, context: "applied",
    prompt: `A robot follows the circular level curve $f(x,y) = x^2 + y^2 = ${r2}$. At the point $(${x0}, ${y0})$ its motion points along the tangent direction $${Vt(tan)}$. Prove the gradient of $f$ there is perpendicular to the path.`,
    steps: [
      { instruction: `The gradient is $\\nabla f = \\langle 2x, 2y \\rangle$. Evaluate it at $(${x0}, ${y0})$.`, answer: V(...g), accept: [Pn(...g)], hint: `$\\langle 2(${x0}), 2(${y0}) \\rangle$.` },
      { instruction: `Compute the dot product of the gradient with the tangent direction $${Vt(tan)}$.`, answer: "0", accept: [], hint: `$${g[0]}(${tan[0]}) + ${g[1]}(${tan[1]}) = ${g[0] * tan[0]} + ${g[1] * tan[1]}$.` },
      { instruction: "Is the gradient perpendicular to the level curve at this point? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "The dot product with the tangent direction is zero." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$\\nabla f(${x0},${y0}) = ${Vt(g)}$ and $${Vt(g)} \\cdot ${Vt(tan)} = ${g[0] * tan[0]} + ${g[1] * tan[1]} = 0$ — the gradient points straight out of the circle, perpendicular to the motion.`,
  };
};
