// gen-calc3-pool-fill.js
// Thin-pool eliminator pack for the calculus-3 subject (template prefix c3l-).
// One parametric generator per (topic, keyConcept, difficulty) pool that had
// exactly one seed problem and no generator at that tier — 20 templates across
// 6 topics. Self-contained: exports a `fill` map of template-name ->
// (rng, idx) => problem, matching js/generator.js's `generators` shape (same
// pattern as gen-calc3v-fill.js / gen-calc3s-fill.js).
//
// Grading notes (verified against the real checkStep):
// - Vector/tuple answers "<a, b, c>" grade component-wise when every entry is a
//   plain number or fraction, so all vector answers here are numeric tuples.
// - Single-variable polynomial answers ("2x + 3", "6 + 2k") grade via the
//   polynomial canonicalizer; multivariable monomial sums ("6xy^2 + 2y") also
//   get exact-match plus curated reorder accepts.
// - Angles are asked in whole degrees; magnitudes are engineered integers
//   (Pythagorean pairs/quadruples) except the deliberate m*n*sqrt(2) case,
//   authored as a 3-decimal value (seed s04 pattern) with sqrt accepts.
// - Degenerate draws excluded BY CONSTRUCTION: curated non-parallel vector
//   pairs, nonzero cross z-components (bump-and-reverify), nonzero directional
//   derivatives, divisibility fixed with bounded deterministic loops.

const V = (...xs) => `<${xs.join(", ")}>`;
const Pn = (...xs) => `(${xs.join(", ")})`;
const Vt = (xs) => `\\langle ${xs.join(", ")} \\rangle`; // LaTeX tuple for prompts

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
function frac(n, d) {
  const g = gcd(n, d) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? `${nn}` : `${nn}/${dd}`;
}
// Coefficient formatting: cf(1)="", cf(-1)="-", cf(3)="3".
const cf = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);
// "a + bv" linear string with proper signs (b nonzero).
function lin(a, b, v = "x") {
  const bt = `${cf(b)}${v}`;
  if (a === 0) return bt;
  return b > 0 ? `${a} + ${bt}` : `${a} - ${cf(-b)}${v}`;
}
// Signed trailing term: termS(0,"x")="", termS(3,"x")=" + 3x", termS(-1,"x")=" - x".
const termS = (c, sym) => (c === 0 ? "" : c > 0 ? ` + ${cf(c)}${sym}` : ` - ${cf(-c)}${sym}`);
const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const degOf = (dot, prod) => Math.round((Math.acos(dot / prod) * 180) / Math.PI);

export const fill = {};

// ============================================================================
// TOPIC: calculus-3.dot-and-cross-products
// ============================================================================

// Curated non-parallel 3D pairs with INTEGER magnitudes (used by angle d2/d3).
// Every pair's rounded angle sits safely away from the .5 rounding boundary.
const ANGLE_PAIRS = [
  { u: [1, 2, 2], v: [2, 2, 1] }, // 27 deg
  { u: [1, 2, 2], v: [2, 1, 2] }, // 27
  { u: [1, 2, 2], v: [2, 3, 6] }, // 18
  { u: [1, 2, 2], v: [3, 2, 6] }, // 25
  { u: [1, 2, 2], v: [6, 2, 3] }, // 40
  { u: [2, 2, 1], v: [1, 4, 8] }, // 48
  { u: [2, 2, 1], v: [8, 4, 1] }, // 22
  { u: [2, 3, 6], v: [3, 6, 2] }, // 43
  { u: [2, 3, 6], v: [6, 2, 3] }, // 43
  { u: [1, 2, 2], v: [4, 8, 1] }, // 35
];
const intMag = (v) => Math.round(Math.sqrt(dot3(v, v))); // exact for curated vectors

// d1: landmark angles (0/45/90/135/180) read off a clean dot product.
fill["c3l-angle-between-d1"] = (rng, idx) => {
  const kind = rng.pick(["perp", "para", "anti", "acute45", "obtuse135"]);
  const m = rng.int(2, 5), n = rng.int(2, 5);
  const i = rng.int(0, 2), j = (i + 1) % 3, k2 = (i + 2) % 3;
  const mk = (pairs) => { const w = [0, 0, 0]; for (const [pos, val] of pairs) w[pos] = val; return w; };
  const base = { id: `gen.c3l-angle-between-d1.${idx}`, generated: true, concepts: ["angle-between"], difficulty: 1, context: "abstract" };
  if (kind === "perp") {
    const a = mk([[i, m]]);
    const b = mk([[j, n], [k2, rng.int(0, 3)]]);
    return { ...base,
      prompt: `Find the angle between $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$ — no calculator needed once you see the dot product.`,
      steps: [
        { instruction: "Compute the dot product $\\vec{a} \\cdot \\vec{b}$.", answer: "0", accept: [], hint: `Each product pairs a component of $\\vec{a}$ with a zero (or vice versa).` },
        { instruction: "What is the angle between the vectors, in degrees?", answer: "90", accept: [], hint: "A zero dot product between nonzero vectors means perpendicular." },
      ],
      finalAnswer: { value: "90", unit: "degrees" },
      solutionNarrative: `$\\vec{a} \\cdot \\vec{b} = 0$, so $\\cos\\theta = 0$ and $\\theta = 90^\\circ$ — the vectors are perpendicular.`,
    };
  }
  if (kind === "para" || kind === "anti") {
    const s = kind === "para" ? 1 : -1;
    const kk = rng.int(2, 3);
    const a = mk([[i, m], [j, m]]); // <m, m, 0>-style so it doesn't LOOK trivially parallel to an axis
    const b = a.map((x) => s * kk * x);
    const d = s * kk * 2 * m * m;
    const prod = kk * 2 * m * m; // |a| = m*sqrt2, |b| = kk*m*sqrt2, product = 2*kk*m^2 (integer!)
    const theta = kind === "para" ? "0" : "180";
    return { ...base,
      prompt: `Find the angle between $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$. (Hint: compare the vectors before computing.)`,
      steps: [
        { instruction: "Compute the dot product $\\vec{a} \\cdot \\vec{b}$.", answer: `${d}`, accept: [], hint: `$${a[0]}(${b[0]}) + ${a[1]}(${b[1]}) + ${a[2]}(${b[2]})$... but notice $\\vec{b} = ${s * kk}\\vec{a}$.` },
        { instruction: "Compute the product of the magnitudes $|\\vec{a}|\\,|\\vec{b}|$.", answer: `${prod}`, accept: [], hint: `$|\\vec{a}| = ${m}\\sqrt{2}$ and $|\\vec{b}| = ${kk * m}\\sqrt{2}$; the $\\sqrt{2}$'s multiply to 2.` },
        { instruction: "So $\\cos\\theta = " + (kind === "para" ? "1" : "-1") + "$. What is the angle, in degrees?", answer: theta, accept: [], hint: kind === "para" ? "Same direction: the vectors are parallel." : "Exactly opposite directions." },
      ],
      finalAnswer: { value: theta, unit: "degrees" },
      solutionNarrative: `$\\vec{b} = ${s * kk}\\vec{a}$, so $\\cos\\theta = ${kind === "para" ? "1" : "-1"}$ and $\\theta = ${theta}^\\circ$.`,
    };
  }
  // acute45 / obtuse135: axis vector vs an equal-component diagonal.
  const s = kind === "acute45" ? 1 : -1;
  const a = mk([[i, m]]);
  const b = mk([[i, s * n], [j, n]]);
  const d = s * m * n;
  const pmVal = m * n * Math.SQRT2;
  const pm = pmVal.toFixed(3);
  const theta = kind === "acute45" ? "45" : "135";
  return { ...base,
    prompt: `Find the angle between $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$. Round to the nearest degree.`,
    steps: [
      { instruction: "Compute the dot product $\\vec{a} \\cdot \\vec{b}$.", answer: `${d}`, accept: [], hint: `Only the matching component survives: $${m}(${s * n})$.` },
      { instruction: "Compute the product of the magnitudes $|\\vec{a}|\\,|\\vec{b}|$ (3 decimal places, or exact).", answer: pm, accept: [`${m * n}sqrt(2)`, `${m * n}sqrt2`, pmVal.toFixed(2)], hint: `$|\\vec{a}| = ${m}$ and $|\\vec{b}| = ${n}\\sqrt{2}$.` },
      { instruction: "Find $\\theta = \\arccos\\!\\left(\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}\\right)$, in degrees.", answer: theta, accept: [], hint: `$\\cos\\theta = ${s === 1 ? "" : "-"}1/\\sqrt{2}$ — a landmark value.` },
    ],
    finalAnswer: { value: theta, unit: "degrees" },
    solutionNarrative: `$\\cos\\theta = \\dfrac{${d}}{${m}\\cdot${n}\\sqrt{2}} = ${s === 1 ? "" : "-"}\\dfrac{1}{\\sqrt{2}}$, so $\\theta = ${theta}^\\circ$.`,
  };
};

// d2: full arccos workflow on vectors with engineered integer magnitudes.
fill["c3l-angle-between-d2"] = (rng, idx) => {
  const pair = rng.pick(ANGLE_PAIRS);
  const s = rng.pick([1, 2]);               // cosmetic scale on u (angle unchanged)
  const flip = rng.pick([false, true]);     // negate v -> supplementary angle
  const u = pair.u.map((x) => s * x);
  const v = flip ? pair.v.map((x) => -x) : pair.v.slice();
  const d = dot3(u, v);
  const mu = intMag(u), mv = intMag(v);
  const theta = degOf(d, mu * mv);
  return {
    id: `gen.c3l-angle-between-d2.${idx}`, generated: true, concepts: ["angle-between"], difficulty: 2, context: "abstract",
    prompt: `Find the angle between $\\vec{a} = ${Vt(u)}$ and $\\vec{b} = ${Vt(v)}$. Round to the nearest degree.`,
    steps: [
      { instruction: "Compute the dot product $\\vec{a} \\cdot \\vec{b}$.", answer: `${d}`, accept: [], hint: `$${u[0]}(${v[0]}) + ${u[1]}(${v[1]}) + ${u[2]}(${v[2]})$.` },
      { instruction: "Compute $|\\vec{a}|$.", answer: `${mu}`, accept: [], hint: `$\\sqrt{${u[0] * u[0]} + ${u[1] * u[1]} + ${u[2] * u[2]}} = \\sqrt{${mu * mu}}$.` },
      { instruction: "Compute $|\\vec{b}|$.", answer: `${mv}`, accept: [], hint: `$\\sqrt{${v[0] * v[0]} + ${v[1] * v[1]} + ${v[2] * v[2]}} = \\sqrt{${mv * mv}}$.` },
      { instruction: "Find $\\theta = \\arccos\\!\\left(\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}\\right)$, rounded to the nearest degree.", answer: `${theta}`, accept: [], hint: `$\\cos\\theta = ${d}/${mu * mv} \\approx ${(d / (mu * mv)).toFixed(4)}$.` },
    ],
    finalAnswer: { value: `${theta}`, unit: "degrees" },
    solutionNarrative: `$\\cos\\theta = \\dfrac{${d}}{(${mu})(${mv})} \\approx ${(d / (mu * mv)).toFixed(4)}$, so $\\theta \\approx ${theta}^\\circ$. (Both magnitudes are exact integers by design.)`,
  };
};

// d3: interior angle of a triangle from three points — build the edge vectors
// first, then run the angle formula. Multi-step synthesis.
fill["c3l-angle-between-d3"] = (rng, idx) => {
  const pair = rng.pick(ANGLE_PAIRS);
  const flip = rng.pick([false, true]);
  const u = pair.u.slice();
  const v = flip ? pair.v.map((x) => -x) : pair.v.slice();
  const A = [rng.int(-3, 3), rng.int(-3, 3), rng.int(-3, 3)];
  const B = [A[0] + u[0], A[1] + u[1], A[2] + u[2]];
  const C = [A[0] + v[0], A[1] + v[1], A[2] + v[2]];
  const d = dot3(u, v);
  const mu = intMag(u), mv = intMag(v);
  const theta = degOf(d, mu * mv);
  return {
    id: `gen.c3l-angle-between-d3.${idx}`, generated: true, concepts: ["angle-between"], difficulty: 3, context: "abstract",
    prompt: `A triangle has vertices $A = (${A.join(", ")})$, $B = (${B.join(", ")})$, and $C = (${C.join(", ")})$. Find the interior angle at vertex $A$, rounded to the nearest degree.`,
    steps: [
      { instruction: "Compute the edge vector $\\vec{AB} = B - A$.", answer: V(...u), accept: [Pn(...u)], hint: `Subtract componentwise: $(${B[0]} - (${A[0]}),\\; ${B[1]} - (${A[1]}),\\; ${B[2]} - (${A[2]}))$.` },
      { instruction: "Compute the edge vector $\\vec{AC} = C - A$.", answer: V(...v), accept: [Pn(...v)], hint: `Subtract componentwise, always tail $A$ to tip $C$.` },
      { instruction: "Compute the dot product $\\vec{AB} \\cdot \\vec{AC}$.", answer: `${d}`, accept: [], hint: `$${u[0]}(${v[0]}) + ${u[1]}(${v[1]}) + ${u[2]}(${v[2]})$.` },
      { instruction: `Both edges have integer lengths: $|\\vec{AB}| = ${mu}$ and $|\\vec{AC}| = ${mv}$. Find the angle at $A$, rounded to the nearest degree.`, answer: `${theta}`, accept: [], hint: `$\\cos\\theta = ${d}/${mu * mv} \\approx ${(d / (mu * mv)).toFixed(4)}$.` },
    ],
    finalAnswer: { value: `${theta}`, unit: "degrees" },
    solutionNarrative: `$\\vec{AB} = ${Vt(u)}$ and $\\vec{AC} = ${Vt(v)}$; their dot product is ${d} and the lengths are ${mu} and ${mv}, so $\\cos\\theta = ${d}/${mu * mv}$ and $\\theta \\approx ${theta}^\\circ$.`,
  };
};

// d2 dot-product: solve for the component that makes two vectors perpendicular.
fill["c3l-dot-product-d2"] = (rng, idx) => {
  const a1 = rng.pick([-3, -2, -1, 1, 2, 3]);
  const a2 = rng.pick([1, -1]);
  const a3 = rng.int(1, 3);
  const b1 = rng.pick([-3, -2, -1, 1, 2, 3]);
  const kAns = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
  // Choose b2 so that a1*b1 + a2*b2 = -a3*kAns exactly (a2 = ±1, so 1/a2 = a2):
  const b2 = a2 * (-a3 * kAns - a1 * b1);
  const c0 = a1 * b1 + a2 * b2; // = -a3*kAns by construction (nonzero since kAns != 0)
  const a = [a1, a2, a3], b = [b1, b2, "k"];
  return {
    id: `gen.c3l-dot-product-d2.${idx}`, generated: true, concepts: ["dot-product"], difficulty: 2, context: "abstract",
    prompt: `Find the value of $k$ that makes $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$ perpendicular.`,
    steps: [
      { instruction: "Write the dot product $\\vec{a} \\cdot \\vec{b}$ as an expression in $k$.", answer: lin(c0, a3, "k"), accept: [`${cf(a3)}k${c0 >= 0 ? ` + ${c0}` : ` - ${-c0}`}`], hint: `$${a1}(${b1}) + (${a2})(${b2}) + ${a3}k$; combine the constants.` },
      { instruction: "Perpendicular means the dot product is 0. Solve for $k$.", answer: `${kAns}`, accept: [`k=${kAns}`], hint: `Set $${lin(c0, a3, "k")} = 0$.` },
    ],
    finalAnswer: { value: `${kAns}`, unit: "" },
    solutionNarrative: `$\\vec{a} \\cdot \\vec{b} = ${lin(c0, a3, "k")}$. Setting it to zero (the perpendicularity test) gives $k = ${kAns}$. Check: the dot product then vanishes exactly.`,
  };
};

// d1 cross-product: planar vectors, so only the z-component survives.
fill["c3l-cross-product-d1"] = (rng, idx) => {
  const a1 = rng.int(1, 4), a2 = rng.int(-3, 3);
  const b1 = rng.int(-3, 3);
  let b2 = rng.int(-3, 3);
  let D = a1 * b2 - a2 * b1;
  if (D === 0) { b2 += 1; D = a1 * b2 - a2 * b1; } // D becomes a1 (nonzero) when it was 0
  const a = [a1, a2, 0], b = [b1, b2, 0];
  return {
    id: `gen.c3l-cross-product-d1.${idx}`, generated: true, concepts: ["cross-product"], difficulty: 1, context: "abstract",
    prompt: `Compute the cross product $\\vec{a} \\times \\vec{b}$ for $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$.`,
    steps: [
      { instruction: "Both vectors lie in the $xy$-plane, so only the $z$-component of the cross product can be nonzero. Compute $a_1 b_2 - a_2 b_1$.", answer: `${D}`, accept: [], hint: `$${a1}(${b2}) - (${a2})(${b1})$.` },
      { instruction: "Write the full cross product as a vector.", answer: V(0, 0, D), accept: [Pn(0, 0, D)], hint: "The x- and y-components are zero; the z-component is what you just computed." },
    ],
    finalAnswer: { value: V(0, 0, D), unit: "" },
    solutionNarrative: `With $a_3 = b_3 = 0$, the formula collapses to $\\vec{a} \\times \\vec{b} = \\langle 0,\\; 0,\\; a_1 b_2 - a_2 b_1 \\rangle = ${Vt([0, 0, D])}$ — perpendicular to the plane of the two vectors.`,
  };
};

// d1 products-applied: work as a dot product, with a real displacement to build.
const WORK_CTX = [
  { actor: "A warehouse worker", obj: "a loaded pallet" },
  { actor: "A tugboat", obj: "a barge" },
  { actor: "A rover", obj: "a sample cart" },
  { actor: "A mule team", obj: "a supply sled" },
];
fill["c3l-products-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick(WORK_CTX);
  const A = [rng.int(0, 3), rng.int(0, 3), 0];
  const d = [rng.int(1, 5), rng.int(0, 4), 0];
  const B = [A[0] + d[0], A[1] + d[1], 0];
  const F = [rng.int(1, 7), rng.int(1, 6), rng.int(0, 4)];
  const W = F[0] * d[0] + F[1] * d[1]; // d3 = 0; W >= 1 since F1, d1 >= 1
  return {
    id: `gen.c3l-products-applied-d1.${idx}`, generated: true, concepts: ["products-applied"], difficulty: 1, context: "applied",
    prompt: `${ctx.actor} drags ${ctx.obj} with constant force $\\vec{F} = ${Vt(F)}$ newtons in a straight line from $A = (${A.join(", ")})$ to $B = (${B.join(", ")})$ (meters). How much work is done?`,
    steps: [
      { instruction: "Compute the displacement vector $\\vec{d} = B - A$.", answer: V(...d), accept: [Pn(...d)], hint: "Subtract componentwise: end minus start." },
      { instruction: "Work is $W = \\vec{F} \\cdot \\vec{d}$. Compute it.", answer: `${W}`, accept: [], hint: `$${F[0]}(${d[0]}) + ${F[1]}(${d[1]}) + ${F[2]}(0)$.` },
    ],
    finalAnswer: { value: `${W}`, unit: "joules" },
    solutionNarrative: `$\\vec{d} = ${Vt(d)}$, so $W = \\vec{F} \\cdot \\vec{d} = ${F[0] * d[0]} + ${F[1] * d[1]} + 0 = ${W}$ joules. Only the force components along the motion contribute.`,
  };
};

// ============================================================================
// TOPIC: calculus-3.gradient-and-directional-derivatives
// ============================================================================

const PYTH_2D = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
const PYTH_3D = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11]];

// d1: max rate of increase = |grad f|, gradient given numerically.
fill["c3l-max-rate-d1"] = (rng, idx) => {
  const use3d = rng.pick([false, true]);
  const trip = use3d ? rng.pick(PYTH_3D) : rng.pick(PYTH_2D);
  const h = trip[trip.length - 1];
  const g = trip.slice(0, -1).map((x) => rng.pick([1, -1]) * x); // sign flips keep the magnitude
  return {
    id: `gen.c3l-max-rate-d1.${idx}`, generated: true, concepts: ["max-rate-and-direction"], difficulty: 1, context: "abstract",
    prompt: `At a point $P$, the gradient of $f$ is $\\nabla f = ${Vt(g)}$. What is the maximum rate of increase of $f$ at $P$?`,
    steps: [
      { instruction: "Compute $|\\nabla f|^2$ (the sum of squared components).", answer: `${h * h}`, accept: [], hint: `$${g.map((x) => `(${x})^2`).join(" + ")}$.` },
      { instruction: "The maximum rate of increase equals $|\\nabla f|$. Compute it.", answer: `${h}`, accept: [], hint: `$\\sqrt{${h * h}}$ is a perfect square root.` },
    ],
    finalAnswer: { value: `${h}`, unit: "" },
    solutionNarrative: `The steepest ascent rate is $|\\nabla f| = \\sqrt{${h * h}} = ${h}$; it occurs in the direction of $\\nabla f$ itself.`,
  };
};

// d3: from a formula for f, evaluate the gradient, then extract both the max
// rate AND the unit direction of steepest ascent (engineered clean magnitude).
fill["c3l-max-rate-d3"] = (rng, idx) => {
  let [gu, gv, h] = rng.pick(PYTH_2D);
  if (rng.pick([false, true])) [gu, gv] = [gv, gu]; // swap for variety
  const p = rng.int(0, 4), q = rng.int(0, 4);
  const c1 = gu - 2 * p, c2 = gv - 2 * q; // makes grad f(p,q) = <gu, gv> exactly
  const fStr = `x^2${termS(c1, "x")} + y^2${termS(c2, "y")}`;
  const fxStr = c1 === 0 ? "2x" : c1 > 0 ? `2x + ${c1}` : `2x - ${-c1}`;
  const dir = [frac(gu, h), frac(gv, h)];
  return {
    id: `gen.c3l-max-rate-d3.${idx}`, generated: true, concepts: ["max-rate-and-direction"], difficulty: 3, context: "abstract",
    prompt: `For $f(x,y) = ${fStr}$, find the maximum rate of increase at the point $(${p}, ${q})$ and the unit direction of steepest ascent there.`,
    steps: [
      { instruction: "Compute $f_x$.", answer: fxStr, accept: c1 > 0 ? [`${c1} + 2x`] : [], hint: `Differentiate $${fStr}$ in $x$; the $y$ terms vanish.` },
      { instruction: `Evaluate $\\nabla f$ at $(${p}, ${q})$ as a numeric vector.`, answer: V(gu, gv), accept: [Pn(gu, gv)], hint: `$f_x(${p},${q}) = 2(${p})${c1 >= 0 ? ` + ${c1}` : ` - ${-c1}`}$ and $f_y(${p},${q}) = 2(${q})${c2 >= 0 ? ` + ${c2}` : ` - ${-c2}`}$.` },
      { instruction: "The maximum rate of increase is $|\\nabla f|$. Compute it.", answer: `${h}`, accept: [], hint: `$\\sqrt{${gu}^2 + ${gv}^2} = \\sqrt{${h * h}}$.` },
      { instruction: "Give the unit direction of steepest ascent, $\\nabla f / |\\nabla f|$, as a numeric vector.", answer: V(...dir), accept: [Pn(...dir)], hint: `Divide $${Vt([gu, gv])}$ by ${h} and reduce the fractions.` },
    ],
    finalAnswer: { value: V(...dir), unit: "" },
    solutionNarrative: `$\\nabla f(${p},${q}) = ${Vt([gu, gv])}$, which has magnitude ${h} (a Pythagorean pair). So $f$ climbs fastest at rate ${h}, in the unit direction $${Vt(dir)}$.`,
  };
};

// d2 gradient-vector: symbolic partials, then evaluate at a point.
fill["c3l-gradient-vector-d2"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 5);
  const p = rng.int(1, 3), q = rng.int(1, 3);
  const variant = rng.pick(["A", "B"]);
  const base = { id: `gen.c3l-gradient-vector-d2.${idx}`, generated: true, concepts: ["gradient-vector"], difficulty: 2, context: "abstract" };
  if (variant === "A") {
    // f = a x^2 y + b y : fx = 2a x y, fy = a x^2 + b
    const g = [2 * a * p * q, a * p * p + b];
    return { ...base,
      prompt: `For $f(x,y) = ${cf(a)}x^2 y + ${b}y$, find $\\nabla f$ and evaluate it at $(${p}, ${q})$.`,
      steps: [
        { instruction: "Compute $f_x$ (treat $y$ as constant).", answer: `${2 * a}xy`, accept: [`${2 * a}yx`, `${2 * a}*x*y`], hint: `Differentiate $${cf(a)}x^2 y$ in $x$; the $${b}y$ term has no $x$.` },
        { instruction: "Compute $f_y$ (treat $x$ as constant).", answer: `${cf(a)}x^2 + ${b}`, accept: [`${b} + ${cf(a)}x^2`], hint: `$${cf(a)}x^2 y$ contributes $${cf(a)}x^2$; $${b}y$ contributes $${b}$.` },
        { instruction: `Evaluate $\\nabla f$ at $(${p}, ${q})$ as a numeric vector.`, answer: V(...g), accept: [Pn(...g)], hint: `$${2 * a}(${p})(${q}) = ${g[0]}$ and $${cf(a)}(${p})^2 + ${b} = ${g[1]}$.` },
      ],
      finalAnswer: { value: V(...g), unit: "" },
      solutionNarrative: `$\\nabla f = \\langle ${2 * a}xy,\\; ${cf(a)}x^2 + ${b} \\rangle$; at $(${p},${q})$ this is $${Vt(g)}$.`,
    };
  }
  // f = a x y^2 + b x : fx = a y^2 + b, fy = 2a x y
  const g = [a * q * q + b, 2 * a * p * q];
  return { ...base,
    prompt: `For $f(x,y) = ${cf(a)}x y^2 + ${b}x$, find $\\nabla f$ and evaluate it at $(${p}, ${q})$.`,
    steps: [
      { instruction: "Compute $f_x$ (treat $y$ as constant).", answer: `${cf(a)}y^2 + ${b}`, accept: [`${b} + ${cf(a)}y^2`], hint: `$${cf(a)}x y^2$ contributes $${cf(a)}y^2$; $${b}x$ contributes $${b}$.` },
      { instruction: "Compute $f_y$ (treat $x$ as constant).", answer: `${2 * a}xy`, accept: [`${2 * a}yx`, `${2 * a}*x*y`], hint: `Differentiate $${cf(a)}x y^2$ in $y$; the $${b}x$ term has no $y$.` },
      { instruction: `Evaluate $\\nabla f$ at $(${p}, ${q})$ as a numeric vector.`, answer: V(...g), accept: [Pn(...g)], hint: `$${cf(a)}(${q})^2 + ${b} = ${g[0]}$ and $${2 * a}(${p})(${q}) = ${g[1]}$.` },
    ],
    finalAnswer: { value: V(...g), unit: "" },
    solutionNarrative: `$\\nabla f = \\langle ${cf(a)}y^2 + ${b},\\; ${2 * a}xy \\rangle$; at $(${p},${q})$ this is $${Vt(g)}$.`,
  };
};

// d1 directional-derivative: gradient given numerically, dot with a unit vector.
fill["c3l-directional-deriv-d1"] = (rng, idx) => {
  const branch = rng.pick(["axis", "triple"]);
  const base = { id: `gen.c3l-directional-deriv-d1.${idx}`, generated: true, concepts: ["directional-derivative"], difficulty: 1, context: "abstract" };
  let a, b, u, uTxt, D, hint;
  if (branch === "axis") {
    a = rng.pick([-6, -5, -4, -3, 2, 3, 4, 5, 6, 7]);
    b = rng.pick([-6, -5, -4, -3, 2, 3, 4, 5, 6, 7]);
    u = rng.pick([[1, 0], [0, 1], [-1, 0], [0, -1]]);
    uTxt = Vt(u);
    D = a * u[0] + b * u[1];
    hint = `$(${a})(${u[0]}) + (${b})(${u[1]})$ — an axis direction just picks out (±) one component.`;
  } else {
    const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]);
    a = rng.int(-4, 6);
    b = rng.int(-4, 6);
    // fix b so that s1*3a + s2*4b is divisible by 5 (4 and 5 are coprime, so a fix within 5 steps exists)
    for (let k = 0; k < 5; k++) { if (((s1 * 3 * a + s2 * 4 * (b + k)) % 5 + 5) % 5 === 0) { b = b + k; break; } }
    D = (s1 * 3 * a + s2 * 4 * b) / 5;
    if (D === 0) { b += 5 * 1; D = (s1 * 3 * a + s2 * 4 * b) / 5; } // shift by a full period: D changes by ±4, still an integer
    u = [`${s1 === -1 ? "-" : ""}3/5`, `${s2 === -1 ? "-" : ""}4/5`];
    uTxt = `\\langle ${s1 === -1 ? "-" : ""}\\tfrac{3}{5},\\; ${s2 === -1 ? "-" : ""}\\tfrac{4}{5} \\rangle`;
    hint = `$(${a})\\left(${s1 === -1 ? "-" : ""}\\tfrac{3}{5}\\right) + (${b})\\left(${s2 === -1 ? "-" : ""}\\tfrac{4}{5}\\right)$ — the fifths combine to a whole number.`;
  }
  const inc = D > 0;
  return { ...base,
    prompt: `The gradient of $f$ at a point is $\\nabla f = ${Vt([a, b])}$. Find the directional derivative there in the direction of the unit vector $\\vec{u} = ${uTxt}$.`,
    steps: [
      { instruction: "Compute $D_{\\vec u} f = \\nabla f \\cdot \\vec u$.", answer: `${D}`, accept: [], hint },
      { instruction: "Moving from the point in the direction $\\vec u$, is $f$ increasing or decreasing?", answer: inc ? "increasing" : "decreasing", accept: inc ? ["increases", "increase"] : ["decreases", "decrease"], hint: "The sign of the directional derivative tells the story." },
    ],
    finalAnswer: { value: `${D}`, unit: "" },
    solutionNarrative: `$D_{\\vec u} f = ${Vt([a, b])} \\cdot ${uTxt} = ${D}$. Since it is ${inc ? "positive, $f$ increases" : "negative, $f$ decreases"} in that direction.`,
  };
};

// ============================================================================
// TOPIC: calculus-3.partial-derivatives
// ============================================================================

// Power-rule term: dd(3, 4, "x") = "12x^3" -> second derivative helpers below.
const powTerm = (coef, pow, v) => (pow === 0 ? `${coef}` : pow === 1 ? `${cf(coef)}${v}` : `${cf(coef)}${v}^${pow}`);

// d1 second-partials: separated powers, so each second partial is one clean term.
fill["c3l-second-partials-d1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3);
  const m = rng.pick([3, 4]), n = rng.pick([3, 4]);
  const fxx = powTerm(a * m * (m - 1), m - 2, "x");
  const fyy = powTerm(b * n * (n - 1), n - 2, "y");
  return {
    id: `gen.c3l-second-partials-d1.${idx}`, generated: true, concepts: ["second-partials"], difficulty: 1, context: "abstract",
    prompt: `For $f(x, y) = ${powTerm(a, m, "x")} + ${powTerm(b, n, "y")}$, find $f_{xx}$, $f_{yy}$, and the mixed partial $f_{xy}$.`,
    steps: [
      { instruction: "Find $f_{xx}$ (differentiate in $x$ twice).", answer: fxx, accept: [], hint: `$f_x = ${powTerm(a * m, m - 1, "x")}$; differentiate again in $x$.` },
      { instruction: "Find $f_{yy}$ (differentiate in $y$ twice).", answer: fyy, accept: [], hint: `$f_y = ${powTerm(b * n, n - 1, "y")}$; differentiate again in $y$.` },
      { instruction: "Find $f_{xy}$ (differentiate $f_x$ in $y$).", answer: "0", accept: [], hint: `$f_x = ${powTerm(a * m, m - 1, "x")}$ has no $y$ in it at all.` },
    ],
    finalAnswer: { value: `f_xx = ${fxx}, f_yy = ${fyy}, f_xy = 0`, unit: "" },
    solutionNarrative: `$f_x = ${powTerm(a * m, m - 1, "x")} \\Rightarrow f_{xx} = ${fxx}$; $f_y = ${powTerm(b * n, n - 1, "y")} \\Rightarrow f_{yy} = ${fyy}$. Because the variables never mix, $f_{xy} = 0$.`,
  };
};

// d3 second-partials: full second-order workup of a genuinely mixed polynomial.
fill["c3l-second-partials-d3"] = (rng, idx) => {
  const a = rng.int(1, 2), b = rng.int(1, 3);
  const variant = rng.pick(["A", "B"]);
  const base = { id: `gen.c3l-second-partials-d3.${idx}`, generated: true, concepts: ["second-partials"], difficulty: 3, context: "abstract" };
  if (variant === "A") {
    // f = a x^3 y^2 + b x^2 y
    const fx = `${3 * a}x^2 y^2 + ${2 * b}xy`;
    const fxx = `${6 * a}x y^2 + ${2 * b}y`;
    const fxy = `${6 * a}x^2 y + ${2 * b}x`;
    const fyy = `${2 * a}x^3`;
    return { ...base,
      prompt: `For $f(x, y) = ${cf(a)}x^3 y^2 + ${cf(b)}x^2 y$, find $f_{xx}$, $f_{xy}$, and $f_{yy}$.`,
      steps: [
        { instruction: "Find $f_x$ first (treat $y$ as constant).", answer: fx, accept: [`${2 * b}xy + ${3 * a}x^2 y^2`, `${3 * a}x^2y^2 + ${2 * b}xy`], hint: "Differentiate each term in $x$." },
        { instruction: "Find $f_{xx}$ by differentiating $f_x$ in $x$ again.", answer: fxx, accept: [`${2 * b}y + ${6 * a}xy^2`, `${6 * a}xy^2 + ${2 * b}y`], hint: `Differentiate $${fx}$ in $x$.` },
        { instruction: "Find $f_{xy}$ by differentiating $f_x$ in $y$.", answer: fxy, accept: [`${2 * b}x + ${6 * a}x^2 y`, `${6 * a}x^2y + ${2 * b}x`], hint: `Differentiate $${fx}$ in $y$.` },
        { instruction: "Find $f_{yy}$ (differentiate the original twice in $y$).", answer: fyy, accept: [`${2 * a}*x^3`], hint: `$f_y = ${2 * a}x^3 y + ${cf(b)}x^2$; the second term dies on the next $y$-derivative.` },
      ],
      finalAnswer: { value: `f_xx = ${fxx}, f_xy = ${fxy}, f_yy = ${fyy}`, unit: "" },
      solutionNarrative: `$f_x = ${fx}$, so $f_{xx} = ${fxx}$ and $f_{xy} = ${fxy}$. Separately $f_y = ${2 * a}x^3 y + ${cf(b)}x^2$, so $f_{yy} = ${fyy}$. (Clairaut: differentiating $f_y$ in $x$ gives the same $f_{xy}$.)`,
    };
  }
  // f = a x^2 y^3 + b x y^2
  const fx = `${2 * a}x y^3 + ${cf(b)}y^2`;
  const fxx = `${2 * a}y^3`;
  const fxy = `${6 * a}x y^2 + ${2 * b}y`;
  const fyy = `${6 * a}x^2 y + ${2 * b}x`;
  return { ...base,
    prompt: `For $f(x, y) = ${cf(a)}x^2 y^3 + ${cf(b)}x y^2$, find $f_{xx}$, $f_{xy}$, and $f_{yy}$.`,
    steps: [
      { instruction: "Find $f_x$ first (treat $y$ as constant).", answer: fx, accept: [`${cf(b)}y^2 + ${2 * a}xy^3`, `${2 * a}xy^3 + ${cf(b)}y^2`], hint: "Differentiate each term in $x$." },
      { instruction: "Find $f_{xx}$ by differentiating $f_x$ in $x$ again.", answer: fxx, accept: [`${2 * a}*y^3`], hint: `In $${fx}$, only the first term still has an $x$.` },
      { instruction: "Find $f_{xy}$ by differentiating $f_x$ in $y$.", answer: fxy, accept: [`${2 * b}y + ${6 * a}xy^2`, `${6 * a}xy^2 + ${2 * b}y`], hint: `Differentiate $${fx}$ in $y$.` },
      { instruction: "Find $f_{yy}$ (differentiate the original twice in $y$).", answer: fyy, accept: [`${2 * b}x + ${6 * a}x^2 y`, `${6 * a}x^2y + ${2 * b}x`], hint: `$f_y = ${3 * a}x^2 y^2 + ${2 * b}xy$; differentiate again in $y$.` },
    ],
    finalAnswer: { value: `f_xx = ${fxx}, f_xy = ${fxy}, f_yy = ${fyy}`, unit: "" },
    solutionNarrative: `$f_x = ${fx}$ gives $f_{xx} = ${fxx}$ and $f_{xy} = ${fxy}$; from $f_y = ${3 * a}x^2 y^2 + ${2 * b}xy$ we get $f_{yy} = ${fyy}$.`,
  };
};

// d1 evaluate-partials: one symbolic partial, then plug in a point.
fill["c3l-evaluate-partials-d1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4);
  const p = rng.int(1, 4), q = rng.int(1, 4);
  const forms = [
    { f: `${cf(a)}x^2 y`, which: "x", sym: `${2 * a}xy`, symAcc: [`${2 * a}yx`], val: 2 * a * p * q, symHint: `Differentiate $x^2$ and keep the factor $${cf(a) || "1"}y$.` },
    { f: `${cf(a)}x y^2`, which: "x", sym: `${cf(a)}y^2`, symAcc: a === 1 ? [] : [`${a}*y^2`], val: a * q * q, symHint: `$x$ appears to the first power; its derivative leaves $${cf(a)}y^2$.` },
    { f: `${cf(a)}x^3 + ${cf(b)}y^2`, which: "x", sym: `${3 * a}x^2`, symAcc: [`${3 * a}*x^2`], val: 3 * a * p * p, symHint: `The $y$ term vanishes when differentiating in $x$.` },
    { f: `${cf(a)}x^2 + ${cf(b)}xy`, which: "y", sym: `${cf(b)}x`, symAcc: b === 1 ? [] : [`${b}*x`], val: b * p, symHint: `Only the $${cf(b)}xy$ term has a $y$.` },
  ];
  const F = rng.pick(forms);
  const sub = F.which === "x" ? "x" : "y";
  return {
    id: `gen.c3l-evaluate-partials-d1.${idx}`, generated: true, concepts: ["evaluate-partials"], difficulty: 1, context: "abstract",
    prompt: `For $f(x, y) = ${F.f}$, find $f_${sub}$ and then evaluate it at the point $(${p}, ${q})$.`,
    steps: [
      { instruction: `Find $f_${sub}$ (treat the other variable as constant).`, answer: F.sym, accept: F.symAcc, hint: F.symHint },
      { instruction: `Evaluate $f_${sub}$ at $(${p}, ${q})$.`, answer: `${F.val}`, accept: [], hint: `Substitute $x = ${p}$, $y = ${q}$ into $${F.sym}$.` },
    ],
    finalAnswer: { value: `${F.val}`, unit: "" },
    solutionNarrative: `$f_${sub} = ${F.sym}$, and at $(${p}, ${q})$ that is ${F.val}.`,
  };
};

// d1 partials-applied: a marginal rate in a real context.
fill["c3l-partials-applied-d1"] = (rng, idx) => {
  const c = rng.int(2, 6), k0 = rng.int(2, 5), m0 = rng.int(2, 6);
  const contexts = [
    {
      prompt: `A workshop's daily output (in units) is $P(L, K) = ${c}LK$, where $L$ is workers and $K$ is machines. The marginal product of labor is $\\partial P/\\partial L$. Find it, then evaluate at $K = ${k0}$ to get the extra units each added worker brings.`,
      sym: `${c}K`, symAcc: [`${c}k`], symHint: `Differentiate $${c}LK$ in $L$, keeping $K$ as a constant factor.`,
      val: c * k0, evalTxt: `Evaluate $P_L$ at $K = ${k0}$.`, evalHint: `Substitute $K = ${k0}$ into $${c}K$.`,
      unit: "units per worker",
      narrative: `$P_L = ${c}K$, which is ${c * k0} at $K = ${k0}$: each extra worker adds about ${c * k0} units, machines held fixed.`,
    },
    {
      prompt: `A bakery's weekly cost (in dollars) is $C(f, s) = ${m0}f + ${c}s + fs$, where $f$ is kilograms of flour and $s$ kilograms of sugar. Find the marginal cost of flour $\\partial C/\\partial f$, then evaluate it at $s = ${k0}$.`,
      sym: `${m0} + s`, symAcc: [`s + ${m0}`], symHint: `Differentiate in $f$: the $${c}s$ term vanishes and $fs$ contributes $s$.`,
      val: m0 + k0, evalTxt: `Evaluate $C_f$ at $s = ${k0}$.`, evalHint: `Substitute $s = ${k0}$ into $${m0} + s$.`,
      unit: "dollars per kg of flour",
      narrative: `$C_f = ${m0} + s$, which is ${m0 + k0} at $s = ${k0}$: each extra kilogram of flour costs about \\$${m0 + k0} at that sugar level.`,
    },
    {
      prompt: `The temperature on a heated plate is $T(x, y) = ${c}xy$ degrees, with $x$ and $y$ in centimeters. Find $\\partial T/\\partial x$ (how fast temperature changes as you move in $x$), then evaluate it along the line $y = ${k0}$.`,
      sym: `${c}y`, symAcc: [`${c}*y`], symHint: `Differentiate $${c}xy$ in $x$, keeping $y$ as a constant factor.`,
      val: c * k0, evalTxt: `Evaluate $T_x$ at $y = ${k0}$.`, evalHint: `Substitute $y = ${k0}$ into $${c}y$.`,
      unit: "degrees per cm",
      narrative: `$T_x = ${c}y$, which is ${c * k0} along $y = ${k0}$: moving 1 cm in the $x$ direction raises the temperature about ${c * k0} degrees there.`,
    },
  ];
  const ctx = rng.pick(contexts);
  return {
    id: `gen.c3l-partials-applied-d1.${idx}`, generated: true, concepts: ["partials-applied"], difficulty: 1, context: "applied",
    prompt: ctx.prompt,
    steps: [
      { instruction: "Find the requested partial derivative (treat the other variable as constant).", answer: ctx.sym, accept: ctx.symAcc, hint: ctx.symHint },
      { instruction: ctx.evalTxt, answer: `${ctx.val}`, accept: [], hint: ctx.evalHint },
    ],
    finalAnswer: { value: `${ctx.val}`, unit: ctx.unit },
    solutionNarrative: ctx.narrative,
  };
};

// ============================================================================
// TOPIC: calculus-3.vectors-in-space
// ============================================================================

// d1 vector-operations: componentwise add/subtract, scaffolded.
fill["c3l-vector-ops-d1"] = (rng, idx) => {
  const sub = rng.pick([false, true]);
  const u = [rng.int(-5, 6), rng.int(-5, 6), rng.int(-5, 6)];
  let v = [rng.int(-5, 6), rng.int(-5, 6), rng.int(-5, 6)];
  if (sub && v[0] === u[0] && v[1] === u[1] && v[2] === u[2]) v = [v[0] + 1, v[1], v[2] - 1]; // avoid u - u = 0
  const w = u.map((x, i) => (sub ? x - v[i] : x + v[i]));
  const op = sub ? "-" : "+";
  return {
    id: `gen.c3l-vector-ops-d1.${idx}`, generated: true, concepts: ["vector-operations"], difficulty: 1, context: "abstract",
    prompt: `Given $\\vec{u} = ${Vt(u)}$ and $\\vec{v} = ${Vt(v)}$, find $\\vec{u} ${op} \\vec{v}$.`,
    steps: [
      { instruction: `Compute the first component: $${u[0]} ${op} (${v[0]})$.`, answer: `${w[0]}`, accept: [], hint: `Vector ${sub ? "subtraction" : "addition"} works one matching component at a time.` },
      { instruction: `Now write the full vector $\\vec{u} ${op} \\vec{v}$.`, answer: V(...w), accept: [Pn(...w)], hint: `${sub ? "Subtract" : "Add"} each remaining pair: $${u[1]} ${op} (${v[1]})$ and $${u[2]} ${op} (${v[2]})$.` },
    ],
    finalAnswer: { value: V(...w), unit: "" },
    solutionNarrative: `Componentwise: $\\vec{u} ${op} \\vec{v} = \\langle ${u[0]} ${op} (${v[0]}),\\; ${u[1]} ${op} (${v[1]}),\\; ${u[2]} ${op} (${v[2]}) \\rangle = ${Vt(w)}$.`,
  };
};

// d3 vector-operations: three-vector linear combination with mixed signs.
fill["c3l-vector-ops-d3"] = (rng, idx) => {
  const m = rng.int(2, 3), n = rng.int(1, 3), p2 = rng.int(2, 3);
  const a = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
  const b = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
  const c = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
  const ma = a.map((x) => m * x);
  const nb = b.map((x) => n * x);
  const pc = c.map((x) => p2 * x);
  const w = ma.map((x, i) => x + nb[i] - pc[i]);
  const comboTxt = `${m}\\vec{a} + ${n === 1 ? "" : n}\\vec{b} - ${p2}\\vec{c}`;
  return {
    id: `gen.c3l-vector-ops-d3.${idx}`, generated: true, concepts: ["vector-operations"], difficulty: 3, context: "abstract",
    prompt: `Given $\\vec{a} = ${Vt(a)}$, $\\vec{b} = ${Vt(b)}$, and $\\vec{c} = ${Vt(c)}$, find the linear combination $${comboTxt}$.`,
    steps: [
      { instruction: `Compute $${m}\\vec{a}$.`, answer: V(...ma), accept: [Pn(...ma)], hint: `Multiply each component of $\\vec{a}$ by ${m}.` },
      { instruction: `Compute $${p2}\\vec{c}$ (you will subtract it at the end).`, answer: V(...pc), accept: [Pn(...pc)], hint: `Multiply each component of $\\vec{c}$ by ${p2}.` },
      { instruction: `Now combine: $${comboTxt}$.`, answer: V(...w), accept: [Pn(...w)], hint: `${n === 1 ? `Add $\\vec{b}$ as-is` : `Scale $\\vec{b}$ by ${n}: $${Vt(nb)}$`}, then compute $${Vt(ma)} + ${Vt(nb)} - ${Vt(pc)}$ componentwise.` },
    ],
    finalAnswer: { value: V(...w), unit: "" },
    solutionNarrative: `$${m}\\vec{a} = ${Vt(ma)}$, $${n === 1 ? "" : n}\\vec{b} = ${Vt(nb)}$, $${p2}\\vec{c} = ${Vt(pc)}$. Adding the first two and subtracting the third gives $${Vt(w)}$.`,
  };
};

// ============================================================================
// TOPIC: calculus-3.multivariable-optimization
// ============================================================================

// d2 lagrange-multipliers: closest point on a line (min x^2 + y^2 on px + qy = c),
// engineered so the multiplier relation and the solution are integers.
fill["c3l-lagrange-d2"] = (rng, idx) => {
  const q = rng.int(2, 4), t = rng.int(1, 3);
  const flip = rng.pick([false, true]); // which variable carries the coefficient
  const c = t * (1 + q * q);
  const fVal = t * t * (1 + q * q);
  const base = { id: `gen.c3l-lagrange-d2.${idx}`, generated: true, concepts: ["lagrange-multipliers"], difficulty: 2, context: "abstract" };
  if (!flip) {
    // constraint x + q y = c; gradients: 2x = λ, 2y = λq  =>  y = q x
    return { ...base,
      prompt: `Minimize $f(x,y) = x^2 + y^2$ subject to $x + ${q}y = ${c}$ using Lagrange multipliers.`,
      steps: [
        { instruction: `From $f_x = \\lambda g_x$ and $f_y = \\lambda g_y$ we get $2x = \\lambda$ and $2y = ${q}\\lambda$. Express $y$ in terms of $x$.`, answer: `y = ${q}x`, accept: [`y=${q}x`], hint: `$2y = ${q}\\lambda = ${q}(2x)$, so $y = ${q}x$.` },
        { instruction: `Substitute $y = ${q}x$ into $x + ${q}y = ${c}$ and solve for $x$.`, answer: `${t}`, accept: [`x=${t}`], hint: `$x + ${q * q}x = ${c}$, so $${1 + q * q}x = ${c}$.` },
        { instruction: `Find $y$, then compute the minimum value $f = x^2 + y^2$.`, answer: `${fVal}`, accept: [`f=${fVal}`], hint: `$y = ${q * t}$, so $f = ${t * t} + ${q * q * t * t}$.` },
      ],
      finalAnswer: { value: `${fVal}`, unit: "" },
      solutionNarrative: `$2x = \\lambda$ and $2y = ${q}\\lambda$ give $y = ${q}x$. Then $x + ${q * q}x = ${c}$ so $x = ${t}$, $y = ${q * t}$, and $f = ${fVal}$ — the squared distance from the origin to the line.`,
    };
  }
  // constraint q x + y = c; gradients: 2x = λq, 2y = λ  =>  x = q y
  return { ...base,
    prompt: `Minimize $f(x,y) = x^2 + y^2$ subject to $${q}x + y = ${c}$ using Lagrange multipliers.`,
    steps: [
      { instruction: `From $f_x = \\lambda g_x$ and $f_y = \\lambda g_y$ we get $2x = ${q}\\lambda$ and $2y = \\lambda$. Express $x$ in terms of $y$.`, answer: `x = ${q}y`, accept: [`x=${q}y`], hint: `$2x = ${q}\\lambda = ${q}(2y)$, so $x = ${q}y$.` },
      { instruction: `Substitute $x = ${q}y$ into $${q}x + y = ${c}$ and solve for $y$.`, answer: `${t}`, accept: [`y=${t}`], hint: `$${q * q}y + y = ${c}$, so $${1 + q * q}y = ${c}$.` },
      { instruction: `Find $x$, then compute the minimum value $f = x^2 + y^2$.`, answer: `${fVal}`, accept: [`f=${fVal}`], hint: `$x = ${q * t}$, so $f = ${q * q * t * t} + ${t * t}$.` },
    ],
    finalAnswer: { value: `${fVal}`, unit: "" },
    solutionNarrative: `$2x = ${q}\\lambda$ and $2y = \\lambda$ give $x = ${q}y$. Then $${q * q}y + y = ${c}$ so $y = ${t}$, $x = ${q * t}$, and the minimum is $f = ${fVal}$.`,
  };
};

// d1 optimization-applied: maximize a concave profit surface by setting both
// partials to zero.
const PROFIT_CTX = [
  { a: "chairs", b: "tables" },
  { a: "mugs", b: "plates" },
  { a: "backpacks", b: "tents" },
  { a: "cupcake batches", b: "pies" },
];
fill["c3l-optimization-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick(PROFIT_CTX);
  const x0 = rng.int(2, 6);
  let y0 = rng.int(2, 6);
  if (y0 === x0) y0 = y0 === 6 ? 5 : y0 + 1; // distinct answers read better
  const cc = rng.int(1, 9);
  return {
    id: `gen.c3l-optimization-applied-d1.${idx}`, generated: true, concepts: ["optimization-applied"], difficulty: 1, context: "applied",
    prompt: `A workshop's weekly profit (in \\$thousands) from making $x$ hundred ${ctx.a} and $y$ hundred ${ctx.b} is $P(x,y) = -x^2 - y^2 + ${2 * x0}x + ${2 * y0}y - ${cc}$. Find the production amounts that maximize profit.`,
    steps: [
      { instruction: "Set $P_x = 0$ and solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`, `x=${x0}`], hint: `$P_x = -2x + ${2 * x0}$.` },
      { instruction: "Set $P_y = 0$ and solve for $y$.", answer: `y = ${y0}`, accept: [`${y0}`, `y=${y0}`], hint: `$P_y = -2y + ${2 * y0}$.` },
      { instruction: "Write the optimal production as the point $(x, y)$.", answer: Pn(x0, y0), accept: [`(${x0},${y0})`], hint: "Pair the two values." },
    ],
    finalAnswer: { value: Pn(x0, y0), unit: "" },
    solutionNarrative: `$P_x = -2x + ${2 * x0} = 0 \\Rightarrow x = ${x0}$ and $P_y = -2y + ${2 * y0} = 0 \\Rightarrow y = ${y0}$. Making ${x0 * 100} ${ctx.a} and ${y0 * 100} ${ctx.b} maximizes profit (the surface opens downward, so this critical point is the peak).`,
  };
};

// ============================================================================
// TOPIC: calculus-3.multiple-integrals
// ============================================================================

// d1 double-integrals-general: constant integrand over a triangular region —
// the inner integral produces the variable upper limit.
fill["c3l-double-general-d1"] = (rng, idx) => {
  const k = rng.int(1, 3), cSlope = rng.pick([1, 2]), aLim = rng.int(2, 4);
  const inner = k * cSlope; // integrand of the outer integral is (inner)·x
  const total = frac(inner * aLim * aLim, 2);
  const totalDec = (inner * aLim * aLim) % 2 === 0 ? null : `${(inner * aLim * aLim) / 2}`;
  const upper = cSlope === 1 ? "x" : `${cSlope}x`;
  return {
    id: `gen.c3l-double-general-d1.${idx}`, generated: true, concepts: ["double-integrals-general"], difficulty: 1, context: "abstract",
    prompt: `Evaluate the integral over the triangular region where $y$ runs from 0 to $${upper}$ and $x$ runs from 0 to ${aLim}: $\\displaystyle\\int_0^{${aLim}}\\!\\int_0^{${upper}} ${k}\\,dy\\,dx$.`,
    steps: [
      { instruction: `Inner integral over $y$ from 0 to $${upper}$: $\\int_0^{${upper}} ${k}\\,dy$.`, answer: `${cf(inner)}x`, accept: [`${cf(inner)}*x`], hint: `Integrating the constant ${k} over an interval of length $${upper}$ gives $${cf(inner)}x$.` },
      { instruction: `Outer integral: $\\int_0^{${aLim}} ${cf(inner)}x\\,dx$.`, answer: total, accept: totalDec ? [totalDec] : [], hint: `$${cf(inner)}\\cdot\\tfrac{x^2}{2}\\Big|_0^{${aLim}} = ${inner} \\cdot ${aLim * aLim}/2$.` },
    ],
    finalAnswer: { value: total, unit: "" },
    solutionNarrative: `The inner integral gives $${cf(inner)}x$ (the strip height grows with $x$); then $\\int_0^{${aLim}} ${cf(inner)}x\\,dx = ${total}$ — which is ${k} times the triangle's area.`,
  };
};

// d1 triple-integrals: peel a constant integrand off a box, one integral at a time.
fill["c3l-triple-box-d1"] = (rng, idx) => {
  const k = rng.pick([1, 2]), A = rng.int(2, 4), B = rng.int(2, 4), C = rng.int(2, 4);
  const s1 = k * C, s2 = k * C * B, s3 = k * C * B * A;
  return {
    id: `gen.c3l-triple-box-d1.${idx}`, generated: true, concepts: ["triple-integrals"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${A}}\\!\\int_0^{${B}}\\!\\int_0^{${C}} ${k}\\,dz\\,dy\\,dx$ over the box.`,
    steps: [
      { instruction: `Inner integral $\\int_0^{${C}} ${k}\\,dz$.`, answer: `${s1}`, accept: [], hint: `Integrate the constant ${k} over a $z$-interval of length ${C}.` },
      { instruction: `Middle integral $\\int_0^{${B}} ${s1}\\,dy$.`, answer: `${s2}`, accept: [], hint: `Constant ${s1} over a $y$-interval of length ${B}.` },
      { instruction: `Outer integral $\\int_0^{${A}} ${s2}\\,dx$.`, answer: `${s3}`, accept: [], hint: `Constant ${s2} over an $x$-interval of length ${A}.` },
    ],
    finalAnswer: { value: `${s3}`, unit: "" },
    solutionNarrative: `Peeling off each integral: $${s1}$, then $${s2}$, then $${s3}$ — that is ${k} times the volume of the $${A}\\times${B}\\times${C}$ box.`,
  };
};

// ============================================================================
// ============================================================================
// WAVE-15 EXTENSION: two-seed pools. One template per (topic, keyConcept,
// difficulty) pool that had exactly TWO seed problems and no generator at that
// tier — 29 more templates across the same 6 topics. Same conventions,
// helpers, and grading constraints as the wave-14 section above.
// ============================================================================
// ============================================================================

const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
// Nonzero integer draw (returns 1 in the zero case — bias is cosmetic only).
const nzi = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? 1 : v; };
// Signed trailing CONSTANT: sgn(0)="", sgn(3)=" + 3", sgn(-3)=" - 3".
const sgn = (n) => (n === 0 ? "" : n > 0 ? ` + ${n}` : ` - ${-n}`);

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.dot-and-cross-products
// ---------------------------------------------------------------------------

// d3 dot-product: compute the dot product, then read the angle class off its
// sign (right angles built by construction, so the "zero" case is exact).
fill["c3l-dot-product-d3"] = (rng, idx) => {
  const kind = rng.pick(["right", "acute", "obtuse"]);
  let u, v;
  if (kind === "right") {
    u = [nzi(rng, -4, 4), nzi(rng, -4, 4), nzi(rng, -4, 4)];
    const mode = rng.int(0, 2);
    v = mode === 0 ? [u[1], -u[0], 0] : mode === 1 ? [-u[2], 0, u[0]] : [0, u[2], -u[1]];
  } else {
    u = [nzi(rng, -4, 4), rng.int(-3, 3), nzi(rng, -4, 4)];
    v = [rng.int(-3, 3), nzi(rng, -4, 4), rng.int(-3, 3)];
    if (dot3(u, v) === 0) v[0] += 1; // shifts the dot by u[0] != 0
    const want = kind === "acute" ? 1 : -1;
    if (Math.sign(dot3(u, v)) !== want) v = v.map((x) => -x);
  }
  const d = dot3(u, v);
  const word = kind === "right" ? "right" : kind;
  return {
    id: `gen.c3l-dot-product-d3.${idx}`, generated: true, concepts: ["dot-product"], difficulty: 3, context: "abstract",
    prompt: `For the nonzero vectors $\\vec{a} = ${Vt(u)}$ and $\\vec{b} = ${Vt(v)}$, compute the dot product and decide what it says about the angle between them.`,
    steps: [
      { instruction: "Compute the dot product $\\vec{a} \\cdot \\vec{b}$.", answer: `${d}`, accept: [], hint: `$${u[0]}(${v[0]}) + (${u[1]})(${v[1]}) + (${u[2]})(${v[2]})$ — watch the signs.` },
      { instruction: "Is the angle between the vectors acute, right, or obtuse? Answer acute, right, or obtuse.", answer: word, accept: kind === "right" ? ["perpendicular"] : [], hint: "Positive dot product: acute. Zero: right angle. Negative: obtuse." },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `$\\vec{a} \\cdot \\vec{b} = ${d}$, which is ${d === 0 ? "zero, so the vectors are perpendicular — a right angle" : d > 0 ? "positive, so $\\cos\\theta > 0$ and the angle is acute" : "negative, so $\\cos\\theta < 0$ and the angle is obtuse"}.`,
  };
};

// d3 cross-product: full 3D cross product, component by component (s10 tier).
fill["c3l-cross-product-d3"] = (rng, idx) => {
  const a = [nzi(rng, -3, 3), nzi(rng, -4, 4), rng.int(-3, 3)];
  const b = [rng.int(-3, 3), rng.int(-3, 3), nzi(rng, -4, 4)];
  let c = cross3(a, b);
  if (c[0] === 0 && c[1] === 0 && c[2] === 0) { b[2] += 1; c = cross3(a, b); } // parallel draw: bump changes c[0] by a[1] != 0
  return {
    id: `gen.c3l-cross-product-d3.${idx}`, generated: true, concepts: ["cross-product"], difficulty: 3, context: "abstract",
    prompt: `Compute the cross product $\\vec{a} \\times \\vec{b}$ for $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$.`,
    steps: [
      { instruction: "Compute the first component $a_2 b_3 - a_3 b_2$.", answer: `${c[0]}`, accept: [], hint: `$(${a[1]})(${b[2]}) - (${a[2]})(${b[1]})$.` },
      { instruction: "Compute the second component $a_3 b_1 - a_1 b_3$ — note the reversed pairing.", answer: `${c[1]}`, accept: [], hint: `$(${a[2]})(${b[0]}) - (${a[0]})(${b[2]})$.` },
      { instruction: "Compute the third component $a_1 b_2 - a_2 b_1$, then state the full vector.", answer: V(...c), accept: [Pn(...c)], hint: `Third: $(${a[0]})(${b[1]}) - (${a[1]})(${b[0]}) = ${c[2]}$.` },
    ],
    finalAnswer: { value: V(...c), unit: "" },
    solutionNarrative: `$\\vec{a} \\times \\vec{b} = \\langle (${a[1]})(${b[2]})-(${a[2]})(${b[1]}),\\; (${a[2]})(${b[0]})-(${a[0]})(${b[2]}),\\; (${a[0]})(${b[1]})-(${a[1]})(${b[0]}) \\rangle = ${Vt(c)}$ — perpendicular to both inputs.`,
  };
};

// d3 products-applied: area of a triangular panel via the cross product,
// engineered so the magnitude is an exact integer (3-4-5 pair in the yz-part).
const TRI_CTX = ["A triangular sail", "A triangular glass canopy panel", "A triangular shade tarp"];
fill["c3l-products-applied-d3"] = (rng, idx) => {
  const obj = rng.pick(TRI_CTX);
  const p = rng.pick([2, 4, 6]);
  const m = rng.int(1, 2);
  const q = rng.int(0, 3);
  const swap = rng.pick([false, true]);
  const r = swap ? 4 * m : 3 * m, s = swap ? 3 * m : 4 * m;
  const a = [p, 0, 0], b = [q, r, s];
  const c = [0, -p * s, p * r];
  const mag = 5 * p * m;
  const area = mag / 2; // p is even, so this is an integer
  return {
    id: `gen.c3l-products-applied-d3.${idx}`, generated: true, concepts: ["products-applied"], difficulty: 3, context: "applied",
    prompt: `${obj} has two edge vectors $\\vec{a} = ${Vt(a)}$ and $\\vec{b} = ${Vt(b)}$ (meters) from one corner. Find the area of the triangle.`,
    steps: [
      { instruction: "Compute $\\vec{a} \\times \\vec{b}$.", answer: V(...c), accept: [Pn(...c)], hint: `First: $0(${s}) - 0(${r}) = 0$; second: $0(${q}) - ${p}(${s}) = ${-p * s}$; third: $${p}(${r}) - 0(${q}) = ${p * r}$.` },
      { instruction: "Find the magnitude $|\\vec{a} \\times \\vec{b}|$ (the parallelogram area).", answer: `${mag}`, accept: [], hint: `$\\sqrt{0 + ${p * s * p * s} + ${p * r * p * r}} = \\sqrt{${mag * mag}}$.` },
      { instruction: "The triangle area is half the parallelogram area. What is it?", answer: `${area}`, accept: [], hint: `Half of ${mag}.` },
    ],
    finalAnswer: { value: `${area}`, unit: "square meters" },
    solutionNarrative: `$\\vec{a} \\times \\vec{b} = ${Vt(c)}$ with magnitude $\\sqrt{${mag * mag}} = ${mag}$ (a scaled 3-4-5 pair), so the triangle area is $\\tfrac{1}{2}(${mag}) = ${area}$ m².`,
  };
};

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.gradient-and-directional-derivatives
// ---------------------------------------------------------------------------

// d1 gradient-applied: evaluate the uphill / fastest-warming arrow at a point.
fill["c3l-gradient-applied-d1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3);
  const C = rng.pick([50, 80, 100, 120]);
  const p = rng.int(1, 4), q = rng.int(1, 4);
  const g = [-2 * a * p, -2 * b * q];
  const sym = `<${-2 * a}x, ${-2 * b}y>`;
  const fStr = `${C} - ${cf(a)}x^2 - ${cf(b)}y^2`;
  const hill = rng.pick([false, true]);
  const name = hill ? "h" : "T";
  return {
    id: `gen.c3l-gradient-applied-d1.${idx}`, generated: true, concepts: ["gradient-applied"], difficulty: 1, context: "applied",
    prompt: hill
      ? `A hill's elevation (meters) is $h(x,y) = ${fStr}$, with $x$ east and $y$ north (km). A hiker stands at $(${p}, ${q})$. Find the gradient $\\nabla h$ there — the arrow pointing straight uphill — as a numeric vector.`
      : `The temperature on a metal plate (degrees) is $T(x,y) = ${fStr}$. Find the gradient $\\nabla T$ at the point $(${p}, ${q})$ — the direction of fastest warming — as a numeric vector.`,
    steps: [
      { instruction: `Write $\\nabla ${name} = \\langle ${name}_x, ${name}_y \\rangle$ in terms of $x$ and $y$.`, answer: sym, accept: [], hint: `$${name}_x = ${-2 * a}x$ and $${name}_y = ${-2 * b}y$.` },
      { instruction: `Evaluate at $(${p}, ${q})$ as a numeric vector.`, answer: V(...g), accept: [Pn(...g)], hint: `$${-2 * a}(${p}) = ${g[0]}$ and $${-2 * b}(${q}) = ${g[1]}$.` },
    ],
    finalAnswer: { value: V(...g), unit: "" },
    solutionNarrative: `$\\nabla ${name} = \\langle ${-2 * a}x, ${-2 * b}y \\rangle$; at $(${p}, ${q})$ this is $${Vt(g)}$${hill ? " — uphill points back toward the peak" : " — the direction of fastest temperature increase"}.`,
  };
};

// d3 gradient-applied: full heat-flow / steepest-descent pipeline (s14 tier),
// engineered on Pythagorean pairs so the magnitude and unit vector are exact.
const GRAD3_PAIRS = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
fill["c3l-gradient-applied-d3"] = (rng, idx) => {
  const a = rng.pick([1, 2]);
  let [p, q, h] = rng.pick(GRAD3_PAIRS);
  if (rng.pick([false, true])) [p, q] = [q, p];
  const C = rng.pick([50, 100, 200]);
  const g = [-2 * a * p, -2 * a * q];
  const neg = [2 * a * p, 2 * a * q];
  const unit = [frac(p, h), frac(q, h)];
  const fStr = `${C} - ${cf(a)}x^2 - ${cf(a)}y^2`;
  const heat = rng.pick([false, true]);
  const name = heat ? "T" : "h";
  return {
    id: `gen.c3l-gradient-applied-d3.${idx}`, generated: true, concepts: ["gradient-applied"], difficulty: 3, context: "applied",
    prompt: heat
      ? `Heat flows down the temperature gradient (from hot to cold). On the plate $T(x,y) = ${fStr}$ at the point $(${p}, ${q})$, find the unit vector in the direction of heat flow.`
      : `On the hill $h(x,y) = ${fStr}$ (elevation in meters), a dropped ball at $(${p}, ${q})$ rolls in the direction of steepest descent. Give that direction as a numeric unit vector.`,
    steps: [
      { instruction: `Evaluate $\\nabla ${name} = \\langle ${-2 * a}x, ${-2 * a}y \\rangle$ at $(${p}, ${q})$ as a numeric vector.`, answer: V(...g), accept: [Pn(...g)], hint: `$${-2 * a}(${p}) = ${g[0]}$ and $${-2 * a}(${q}) = ${g[1]}$.` },
      { instruction: heat ? "Heat flows along $-\\nabla T$. Write that vector." : "Steepest descent is along $-\\nabla h$. Write that vector.", answer: V(...neg), accept: [Pn(...neg)], hint: `Negate each component of $${Vt(g)}$.` },
      { instruction: `Normalize $${Vt(neg)}$ (its magnitude is ${2 * a * h}) to a unit vector.`, answer: V(...unit), accept: [Pn(...unit)], hint: `Divide each component by ${2 * a * h} and reduce the fractions.` },
    ],
    finalAnswer: { value: V(...unit), unit: "" },
    solutionNarrative: `$\\nabla ${name}(${p},${q}) = ${Vt(g)}$; ${heat ? "heat flows" : "the ball rolls"} along $-\\nabla ${name} = ${Vt(neg)}$, which has magnitude ${2 * a * h} and normalizes to $${Vt(unit)}$.`,
  };
};

// d3 directional-derivative: gradient from a formula, then normalize the
// direction and dot (s06 tier). Direction is a signed 3-4-5 vector.
fill["c3l-directional-deriv-d3"] = (rng, idx) => {
  const a = rng.int(1, 3);
  const p = rng.int(1, 3);
  let q = rng.int(1, 3);
  const s1 = rng.pick([1, -1]), s2 = rng.pick([1, -1]);
  let g = [2 * p + a * q, a * p];
  let n = 3 * s1 * g[0] + 4 * s2 * g[1];
  if (n === 0) { q += 1; g = [2 * p + a * q, a * p]; n = 3 * s1 * g[0] + 4 * s2 * g[1]; } // bump shifts n by 3*s1*a != 0
  const vArrow = [3 * s1, 4 * s2];
  const u = [`${s1 === -1 ? "-" : ""}3/5`, `${s2 === -1 ? "-" : ""}4/5`];
  const D = frac(n, 5);
  const dec = (n / 5).toFixed(1);
  return {
    id: `gen.c3l-directional-deriv-d3.${idx}`, generated: true, concepts: ["directional-derivative"], difficulty: 3, context: "abstract",
    prompt: `For $f(x,y) = x^2 + ${cf(a)}xy$, find the directional derivative at $(${p}, ${q})$ in the direction of $\\vec{v} = ${Vt(vArrow)}$.`,
    steps: [
      { instruction: `Compute $\\nabla f = \\langle 2x + ${cf(a)}y,\\; ${cf(a)}x \\rangle$ at $(${p}, ${q})$ as a numeric vector.`, answer: V(...g), accept: [Pn(...g)], hint: `$f_x(${p},${q}) = 2(${p}) + ${a}(${q}) = ${g[0]}$ and $f_y(${p},${q}) = ${a}(${p}) = ${g[1]}$.` },
      { instruction: `Normalize $\\vec{v} = ${Vt(vArrow)}$. Its magnitude is 5; write the unit vector.`, answer: V(...u), accept: [Pn(...u)], hint: "Divide each component by 5." },
      { instruction: "Compute $D_{\\vec u} f = \\nabla f \\cdot \\vec u$.", answer: D, accept: [dec, `${n}/5`], hint: `$${g[0]}\\left(${s1 === -1 ? "-" : ""}\\tfrac{3}{5}\\right) + ${g[1]}\\left(${s2 === -1 ? "-" : ""}\\tfrac{4}{5}\\right) = \\tfrac{${n}}{5}$.` },
    ],
    finalAnswer: { value: D, unit: "" },
    solutionNarrative: `$\\nabla f(${p},${q}) = ${Vt(g)}$; with $\\vec u = \\langle ${u.join(",\\; ")} \\rangle$, $D_{\\vec u} f = \\tfrac{${n}}{5} = ${dec}$ — $f$ is ${n > 0 ? "increasing" : "decreasing"} in that direction.`,
  };
};

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.multiple-integrals
// ---------------------------------------------------------------------------

// d3 double-integrals-rectangular: mixed integrand, simplify, then outer (s04 tier).
fill["c3l-double-rect-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 4);
  const A = rng.pick([1, 2]);
  const K = a * A ** 3 + b * A;
  const t1 = `${cf(a * A ** 3)}y`, t2 = `${cf(b * A)}y`;
  return {
    id: `gen.c3l-double-rect-d3.${idx}`, generated: true, concepts: ["double-integrals-rectangular"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{2}\\!\\int_0^{${A}} (${3 * a}x^2 y + ${cf(b)}y)\\,dx\\,dy$.`,
    steps: [
      { instruction: `Inner integral over $x$ from 0 to ${A}: $\\int_0^{${A}} (${3 * a}x^2 y + ${cf(b)}y)\\,dx$.`, answer: `${t1} + ${t2}`, accept: [`${K}y`, `${t2} + ${t1}`], hint: `$\\int_0^{${A}} ${3 * a}x^2 y\\,dx = ${cf(a)}y\\,x^3\\Big|_0^{${A}} = ${t1}$ and $\\int_0^{${A}} ${cf(b)}y\\,dx = ${t2}$.` },
      { instruction: "Simplify the inner result to a single term.", answer: `${K}y`, accept: [], hint: `$${a * A ** 3}y + ${b * A}y = ${K}y$.` },
      { instruction: `Outer integral: $\\int_0^2 ${K}y\\,dy$.`, answer: `${2 * K}`, accept: [], hint: `$${K}\\cdot\\tfrac{y^2}{2}\\Big|_0^2 = ${K} \\cdot 2$.` },
    ],
    finalAnswer: { value: `${2 * K}`, unit: "" },
    solutionNarrative: `Inner: $${t1} + ${t2} = ${K}y$. Outer: $\\int_0^2 ${K}y\\,dy = ${K}\\cdot 2 = ${2 * K}$.`,
  };
};

// d3 double-integrals-general: region between y = x^2 and y = mx (s07 tier).
fill["c3l-double-general-d3"] = (rng, idx) => {
  const m = rng.pick([2, 3]);
  const k = rng.int(1, 3);
  const innerStr = `${cf(k * m)}x - ${cf(k)}x^2`;
  const num = k * m ** 3;
  const total = frac(num, 6);
  const acc = num % 6 === 0 ? [] : num % 3 === 0 ? [`${num / 6}`] : [(num / 6).toFixed(4)];
  return {
    id: `gen.c3l-double-general-d3.${idx}`, generated: true, concepts: ["double-integrals-general"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${m}}\\!\\int_{x^2}^{${m}x} ${k}\\,dy\\,dx$ over the region between $y = x^2$ and $y = ${m}x$ (they meet at $x = 0$ and $x = ${m}$).`,
    steps: [
      { instruction: `Inner integral over $y$ from $x^2$ to $${m}x$: $\\int_{x^2}^{${m}x} ${k}\\,dy$.`, answer: innerStr, accept: [`-${cf(k)}x^2 + ${cf(k * m)}x`, `${k === 1 ? "" : k}(${m}x - x^2)`], hint: `Integrating the constant ${k} gives ${k} times (top limit minus bottom limit).` },
      { instruction: `Outer integral: $\\int_0^{${m}} (${innerStr})\\,dx$.`, answer: total, accept: acc, hint: `$${cf(k * m)}\\tfrac{x^2}{2} - ${cf(k)}\\tfrac{x^3}{3}\\Big|_0^{${m}} = \\tfrac{${k * m ** 3}}{2} - \\tfrac{${k * m ** 3}}{3}$.` },
    ],
    finalAnswer: { value: total, unit: "" },
    solutionNarrative: `Inner: $${innerStr}$. Outer: $\\tfrac{${num}}{2} - \\tfrac{${num}}{3} = \\tfrac{${num}}{6} = ${total}$${k > 1 ? ` — ${k} times the area between the curves` : ", the area between the curves"}.`,
  };
};

// d3 triple-integrals: factored integrand 8xyz over a box, peeled one variable
// at a time; every stage has an integer coefficient by construction.
fill["c3l-triple-integrals-d3"] = (rng, idx) => {
  const A = rng.pick([2, 3]), B = rng.pick([1, 2]), C = rng.pick([1, 2]);
  const s1c = 4 * C * C, s2c = 2 * C * C * B * B, s3 = A * A * B * B * C * C;
  return {
    id: `gen.c3l-triple-integrals-d3.${idx}`, generated: true, concepts: ["triple-integrals"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${A}}\\!\\int_0^{${B}}\\!\\int_0^{${C}} 8xyz\\,dz\\,dy\\,dx$.`,
    steps: [
      { instruction: `Inner integral over $z$ from 0 to ${C}: $\\int_0^{${C}} 8xyz\\,dz$.`, answer: `${s1c}xy`, accept: [`${s1c}yx`], hint: `$\\int_0^{${C}} z\\,dz = \\tfrac{${C * C}}{2}$, so $8xy \\cdot \\tfrac{${C * C}}{2} = ${s1c}xy$.` },
      { instruction: `Middle integral over $y$ from 0 to ${B}: $\\int_0^{${B}} ${s1c}xy\\,dy$.`, answer: `${s2c}x`, accept: [], hint: `$\\int_0^{${B}} y\\,dy = \\tfrac{${B * B}}{2}$, so $${s1c}x \\cdot \\tfrac{${B * B}}{2} = ${s2c}x$.` },
      { instruction: `Outer integral over $x$ from 0 to ${A}: $\\int_0^{${A}} ${s2c}x\\,dx$.`, answer: `${s3}`, accept: [], hint: `$${s2c}\\cdot\\tfrac{x^2}{2}\\Big|_0^{${A}} = ${s2c} \\cdot \\tfrac{${A * A}}{2}$.` },
    ],
    finalAnswer: { value: `${s3}`, unit: "" },
    solutionNarrative: `The integrand factors, so each integral peels cleanly: $${s1c}xy$, then $${s2c}x$, then $${s3}$.`,
  };
};

// d1 integral-applications: constant density over a rectangle (s11/s17 tier).
fill["c3l-integral-applications-d1"] = (rng, idx) => {
  const d = rng.int(2, 6), A = rng.int(2, 5), B = rng.int(2, 4);
  const inner = d * A, total = d * A * B;
  const ctx = rng.pick([
    { prompt: `A thin rectangular plate covers $0 \\le x \\le ${A}$ m and $0 \\le y \\le ${B}$ m. Its density is constant at $${d}$ kg/m$^2$, so the mass is $\\iint_R ${d}\\,dA$. Find the total mass.`, unit: "kg", what: "mass" },
    { prompt: `Rain falls at a uniform depth of $${d}$ cm over a field $0 \\le x \\le ${A}$ km and $0 \\le y \\le ${B}$ km, so the total water is $\\iint_R ${d}\\,dA$. Find it (in cm-km$^2$).`, unit: "cm-km^2", what: "total water" },
    { prompt: `A solar farm covers $0 \\le x \\le ${A}$ km and $0 \\le y \\le ${B}$ km and generates a uniform $${d}$ MW per km$^2$, so the total output is $\\iint_R ${d}\\,dA$. Find it.`, unit: "MW", what: "total output" },
  ]);
  return {
    id: `gen.c3l-integral-applications-d1.${idx}`, generated: true, concepts: ["integral-applications"], difficulty: 1, context: "applied",
    prompt: ctx.prompt,
    steps: [
      { instruction: `Inner integral $\\int_0^{${A}} ${d}\\,dx$.`, answer: `${inner}`, accept: [], hint: `The constant ${d} over an $x$-length of ${A}.` },
      { instruction: `Outer integral $\\int_0^{${B}} ${inner}\\,dy$.`, answer: `${total}`, accept: [], hint: `The constant ${inner} over a $y$-length of ${B}.` },
    ],
    finalAnswer: { value: `${total}`, unit: ctx.unit },
    solutionNarrative: `A constant integrand just multiplies by the area: ${ctx.what} $= ${d} \\times (${A} \\cdot ${B}) = ${total}$.`,
  };
};

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.multivariable-optimization
// ---------------------------------------------------------------------------

// d2 critical-points: an xy cross term couples the two equations (s03 tier).
// Built backwards from an integer critical point (x0, y0).
fill["c3l-critical-points-d2"] = (rng, idx) => {
  let x0 = rng.int(-3, 4), y0 = rng.int(-3, 4);
  if (x0 === 0 && y0 === 0) x0 = 2;
  const b = -(2 * x0 + y0), c = -(x0 + 2 * y0);
  const fStr = `x^2 + xy + y^2${termS(b, "x")}${termS(c, "y")}`;
  return {
    id: `gen.c3l-critical-points-d2.${idx}`, generated: true, concepts: ["critical-points"], difficulty: 2, context: "abstract",
    prompt: `Find the critical point of $f(x,y) = ${fStr}$.`,
    steps: [
      { instruction: "Write the equation from $f_x = 0$.", answer: `2x + y = ${-b}`, accept: b === 0 ? [] : [`2x + y ${b > 0 ? `+ ${b}` : `- ${-b}`} = 0`], hint: `$f_x = 2x + y${sgn(b)}$.` },
      { instruction: "Write the equation from $f_y = 0$.", answer: `x + 2y = ${-c}`, accept: c === 0 ? [] : [`x + 2y ${c > 0 ? `+ ${c}` : `- ${-c}`} = 0`], hint: `$f_y = x + 2y${sgn(c)}$.` },
      { instruction: "Solve the two equations together and give the critical point $(x, y)$.", answer: `(${x0}, ${y0})`, accept: [`(${x0},${y0})`], hint: `From the second equation, $x = ${-c} - 2y$; substitute into the first.` },
    ],
    finalAnswer: { value: `(${x0}, ${y0})`, unit: "" },
    solutionNarrative: `$f_x = 2x + y${sgn(b)} = 0$ and $f_y = x + 2y${sgn(c)} = 0$. Substituting $x = ${-c} - 2y$ into the first gives $y = ${y0}$, then $x = ${x0}$: the point $(${x0}, ${y0})$.`,
  };
};

// d3 critical-points: a cubic in x gives TWO critical points; report the one
// with the larger x (s04 tier).
fill["c3l-critical-points-d3"] = (rng, idx) => {
  const a = rng.int(1, 3);
  const b2 = nzi(rng, -4, 4);
  const fStr = `x^3 - ${cf(3 * a * a)}x + y^2${termS(-2 * b2, "y")}`;
  return {
    id: `gen.c3l-critical-points-d3.${idx}`, generated: true, concepts: ["critical-points"], difficulty: 3, context: "abstract",
    prompt: `The function $f(x,y) = ${fStr}$ has two critical points. Find the one with the larger $x$-coordinate.`,
    steps: [
      { instruction: "Set $f_x = 0$. Which positive value of $x$ solves it?", answer: `x = ${a}`, accept: [`${a}`, `x=${a}`], hint: `$f_x = 3x^2 - ${3 * a * a} = 0 \\Rightarrow x^2 = ${a * a}$, so $x = \\pm ${a}$; take the larger.` },
      { instruction: "Set $f_y = 0$ and solve for $y$.", answer: `y = ${b2}`, accept: [`${b2}`, `y=${b2}`], hint: `$f_y = 2y${sgn(-2 * b2)}$.` },
      { instruction: "Write the critical point as $(x, y)$.", answer: `(${a}, ${b2})`, accept: [`(${a},${b2})`], hint: "Pair the larger $x$ with the $y$ you found." },
    ],
    finalAnswer: { value: `(${a}, ${b2})`, unit: "" },
    solutionNarrative: `$f_x = 3x^2 - ${3 * a * a} = 0$ gives $x = \\pm ${a}$; the larger is $x = ${a}$. $f_y = 2y${sgn(-2 * b2)} = 0$ gives $y = ${b2}$. The point is $(${a}, ${b2})$ (the other critical point is $(${-a}, ${b2})$).`,
  };
};

// d1 second-derivative-test: given the three second partials, compute D and
// classify (s05/s16 tier). All three verdicts appear.
fill["c3l-second-deriv-test-d1"] = (rng, idx) => {
  const kind = rng.pick(["min", "max", "saddle"]);
  let fxx, fyy, fxy;
  if (kind === "saddle") {
    const s = rng.pick([1, -1]);
    fxx = s * rng.int(2, 6); fyy = -s * rng.int(2, 6); fxy = rng.int(-2, 2);
  } else {
    const s = kind === "min" ? 1 : -1;
    fxx = s * rng.int(2, 6); fyy = s * rng.int(2, 4); fxy = rng.pick([-2, -1, 0, 1, 2]);
    if (fxx * fyy - fxy * fxy <= 0) fxy = 1; // |fxx*fyy| >= 4 > 1, so D > 0 now
  }
  const D = fxx * fyy - fxy * fxy;
  const word = kind === "min" ? "minimum" : kind === "max" ? "maximum" : "saddle";
  const acc = kind === "min" ? ["min", "local minimum"] : kind === "max" ? ["max", "local maximum"] : ["saddle point"];
  return {
    id: `gen.c3l-second-deriv-test-d1.${idx}`, generated: true, concepts: ["second-derivative-test"], difficulty: 1, context: "abstract",
    prompt: `At a critical point of $f(x,y)$, the second partials are $f_{xx} = ${fxx}$, $f_{yy} = ${fyy}$, and $f_{xy} = ${fxy}$. Compute $D$ and classify the point.`,
    steps: [
      { instruction: "Compute the discriminant $D = f_{xx} f_{yy} - (f_{xy})^2$.", answer: `${D}`, accept: [], hint: `$(${fxx})(${fyy}) - (${fxy})^2$.` },
      { instruction: "Classify the critical point. Answer minimum, maximum, or saddle.", answer: word, accept: acc, hint: D < 0 ? "A negative discriminant is always a saddle point." : `$D > 0$, so the sign of $f_{xx} = ${fxx}$ decides: positive is a bowl, negative a dome.` },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `$D = (${fxx})(${fyy}) - (${fxy})^2 = ${D}$. ${D < 0 ? "Since $D < 0$, the point is a saddle." : `Since $D > 0$ and $f_{xx} = ${fxx} ${fxx > 0 ? "> 0$, the point is a local minimum." : "< 0$, the point is a local maximum."}`}`,
  };
};

// d3 second-derivative-test: find the critical point of a coupled quadratic,
// then D, then the verdict (s07 tier). D = 3 by construction.
fill["c3l-second-deriv-test-d3"] = (rng, idx) => {
  const s = rng.pick([1, -1]);
  const c = rng.pick([1, -1]);
  const t = nzi(rng, -3, 3);
  const x0 = 2 * t;
  const y0 = s === 1 ? -c * t : c * t;
  const d = s === 1 ? -3 * t : 3 * t;
  const fStr = `${s === 1 ? "x^2 + y^2" : "-x^2 - y^2"}${termS(c, "xy")}${termS(d, "x")}`;
  const word = s === 1 ? "minimum" : "maximum";
  const yRel = (s === 1 ? -c : c) === 1 ? "x/2" : "-x/2";
  return {
    id: `gen.c3l-second-deriv-test-d3.${idx}`, generated: true, concepts: ["second-derivative-test"], difficulty: 3, context: "abstract",
    prompt: `For $f(x,y) = ${fStr}$, find the critical point, then compute $D$ and classify it.`,
    steps: [
      { instruction: "Solve $f_x = 0$ and $f_y = 0$ together for the critical point $(x, y)$.", answer: `(${x0}, ${y0})`, accept: [`(${x0},${y0})`], hint: `$f_y = ${s === 1 ? "2y" : "-2y"}${termS(c, "x")} = 0$ gives $y = ${yRel}$; substitute into $f_x = ${s === 1 ? "2x" : "-2x"}${termS(c, "y")}${sgn(d)} = 0$.` },
      { instruction: `Compute $D = f_{xx} f_{yy} - (f_{xy})^2$ (here $f_{xx} = ${2 * s}$, $f_{yy} = ${2 * s}$, $f_{xy} = ${c}$).`, answer: "3", accept: [], hint: `$(${2 * s})(${2 * s}) - (${c})^2 = 4 - 1$.` },
      { instruction: "Classify the point. Answer minimum, maximum, or saddle.", answer: word, accept: s === 1 ? ["min", "local minimum"] : ["max", "local maximum"], hint: `$D = 3 > 0$, so the sign of $f_{xx} = ${2 * s}$ decides.` },
    ],
    finalAnswer: { value: `${word} at (${x0}, ${y0})`, unit: "" },
    solutionNarrative: `From $f_y = 0$, $y = ${yRel}$; substituting into $f_x = 0$ gives $x = ${x0}$, $y = ${y0}$. Then $D = 4 - 1 = 3 > 0$ with $f_{xx} = ${2 * s}$, so $(${x0}, ${y0})$ is a local ${word}.`,
  };
};

// d2 optimization-applied: peak production point AND the peak profit (s12 tier).
fill["c3l-optimization-applied-d2"] = (rng, idx) => {
  const ctx = rng.pick(PROFIT_CTX);
  const x0 = rng.int(2, 6);
  let y0 = rng.int(2, 6); if (y0 === x0) y0 = y0 === 6 ? 5 : y0 + 1;
  const peak = x0 * x0 + y0 * y0;
  const cc = rng.int(1, Math.min(9, peak - 1));
  const V2 = peak - cc;
  return {
    id: `gen.c3l-optimization-applied-d2.${idx}`, generated: true, concepts: ["optimization-applied"], difficulty: 2, context: "applied",
    prompt: `A workshop's weekly profit (in \\$thousands) from making $x$ hundred ${ctx.a} and $y$ hundred ${ctx.b} is $P(x,y) = -x^2 - y^2 + ${2 * x0}x + ${2 * y0}y - ${cc}$. Find the profit-maximizing production point and the maximum profit.`,
    steps: [
      { instruction: "Set $P_x = 0$ and solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`, `x=${x0}`], hint: `$P_x = -2x + ${2 * x0}$.` },
      { instruction: "Set $P_y = 0$ and solve for $y$.", answer: `y = ${y0}`, accept: [`${y0}`, `y=${y0}`], hint: `$P_y = -2y + ${2 * y0}$.` },
      { instruction: `Compute the maximum profit $P(${x0}, ${y0})$, in \\$thousands.`, answer: `${V2}`, accept: [`P=${V2}`], hint: `$-${x0 * x0} - ${y0 * y0} + ${2 * x0 * x0} + ${2 * y0 * y0} - ${cc}$.` },
    ],
    finalAnswer: { value: `${V2}`, unit: "thousand dollars" },
    solutionNarrative: `$P_x = 0$ gives $x = ${x0}$ and $P_y = 0$ gives $y = ${y0}$ (the surface opens downward, so this is the peak). Then $P(${x0},${y0}) = ${x0 * x0} + ${y0 * y0} - ${cc} = ${V2}$ thousand dollars.`,
  };
};

// d3 optimization-applied: interacting products (an xy cross term couples the
// system) plus the peak value. Built backwards from an integer optimum.
fill["c3l-optimization-applied-d3"] = (rng, idx) => {
  const ctx = rng.pick(PROFIT_CTX);
  const x0 = rng.int(1, 4);
  let y0 = rng.int(1, 4); if (y0 === x0) y0 = y0 === 4 ? 3 : y0 + 1;
  const A2 = 2 * x0 + y0, B2 = 2 * y0 + x0;
  const V3 = x0 * x0 + y0 * y0 + x0 * y0;
  return {
    id: `gen.c3l-optimization-applied-d3.${idx}`, generated: true, concepts: ["optimization-applied"], difficulty: 3, context: "applied",
    prompt: `A workshop sells $x$ hundred ${ctx.a} and $y$ hundred ${ctx.b} that compete for the same buyers, so weekly profit (in \\$thousands) is $P(x,y) = -x^2 - y^2 - xy + ${A2}x + ${B2}y$. Find the profit-maximizing mix and the maximum profit.`,
    steps: [
      { instruction: "Set $P_x = 0$ and $P_y = 0$, then solve the system for $x$.", answer: `x = ${x0}`, accept: [`${x0}`, `x=${x0}`], hint: `$P_x = -2x - y + ${A2} = 0$ and $P_y = -x - 2y + ${B2} = 0$; doubling the first and subtracting the second gives $3x = ${2 * A2 - B2}$.` },
      { instruction: "Now solve for $y$.", answer: `y = ${y0}`, accept: [`${y0}`, `y=${y0}`], hint: `Substitute $x = ${x0}$ into $2x + y = ${A2}$.` },
      { instruction: `Compute the maximum profit $P(${x0}, ${y0})$, in \\$thousands.`, answer: `${V3}`, accept: [`P=${V3}`], hint: `$-${x0 * x0} - ${y0 * y0} - ${x0 * y0} + ${A2 * x0} + ${B2 * y0}$.` },
    ],
    finalAnswer: { value: `${V3}`, unit: "thousand dollars" },
    solutionNarrative: `Solving $2x + y = ${A2}$ and $x + 2y = ${B2}$ gives $(${x0}, ${y0})$. The discriminant is $D = (-2)(-2) - (-1)^2 = 3 > 0$ with $P_{xx} = -2 < 0$ — a genuine maximum — and $P(${x0},${y0}) = ${V3}$ thousand dollars.`,
  };
};

// d1 lagrange-multipliers: symmetric constraint, so the multiplier equations
// force x = y immediately (s08/s17 tier).
fill["c3l-lagrange-d1"] = (rng, idx) => {
  const s = rng.int(3, 8);
  const maxProd = rng.pick([true, false]);
  const base = { id: `gen.c3l-lagrange-d1.${idx}`, generated: true, concepts: ["lagrange-multipliers"], difficulty: 1, context: "abstract" };
  if (maxProd) {
    return { ...base,
      prompt: `Maximize $f(x,y) = xy$ subject to $x + y = ${2 * s}$ using Lagrange multipliers (with $x, y > 0$).`,
      steps: [
        { instruction: "The conditions $f_x = \\lambda g_x$ and $f_y = \\lambda g_y$ give $y = \\lambda$ and $x = \\lambda$. What relationship between $x$ and $y$ does this force?", answer: "x = y", accept: ["y=x", "x=y"], hint: "Both equal $\\lambda$, so they equal each other." },
        { instruction: `Use $x = y$ in the constraint $x + y = ${2 * s}$ to find $x$.`, answer: `x = ${s}`, accept: [`${s}`, `x=${s}`], hint: `$2x = ${2 * s}$.` },
        { instruction: "Compute the maximum value $f = xy$.", answer: `${s * s}`, accept: [`f=${s * s}`], hint: `$x = y = ${s}$, so $xy = ${s * s}$.` },
      ],
      finalAnswer: { value: `${s * s}`, unit: "" },
      solutionNarrative: `$\\nabla f = \\lambda \\nabla g$ gives $y = \\lambda$ and $x = \\lambda$, so $x = y$. The constraint forces $x = y = ${s}$, and the maximum product is $${s * s}$.`,
    };
  }
  return { ...base,
    prompt: `Minimize $f(x,y) = x^2 + y^2$ subject to $x + y = ${2 * s}$ using Lagrange multipliers.`,
    steps: [
      { instruction: "The conditions give $2x = \\lambda$ and $2y = \\lambda$. What relationship between $x$ and $y$ does this force?", answer: "x = y", accept: ["y=x", "x=y"], hint: "Both $2x$ and $2y$ equal the same $\\lambda$." },
      { instruction: `Use $x = y$ in the constraint $x + y = ${2 * s}$ to find $x$.`, answer: `x = ${s}`, accept: [`${s}`, `x=${s}`], hint: `$2x = ${2 * s}$.` },
      { instruction: "Compute the minimum value $f = x^2 + y^2$.", answer: `${2 * s * s}`, accept: [`f=${2 * s * s}`], hint: `$${s}^2 + ${s}^2$.` },
    ],
    finalAnswer: { value: `${2 * s * s}`, unit: "" },
    solutionNarrative: `$2x = \\lambda = 2y$ forces $x = y$; the constraint gives $x = y = ${s}$, so the minimum is $f = ${s * s} + ${s * s} = ${2 * s * s}$ — the closest point on the line to the origin.`,
  };
};

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.partial-derivatives
// ---------------------------------------------------------------------------

// d2 first-partials: two genuinely mixed terms (s03 tier).
fill["c3l-first-partials-d2"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4);
  const fStr = `${cf(a)}x^2 y + ${cf(b)}x y^2`;
  const fx = `${2 * a}xy + ${cf(b)}y^2`;
  const fy = `${cf(a)}x^2 + ${2 * b}xy`;
  return {
    id: `gen.c3l-first-partials-d2.${idx}`, generated: true, concepts: ["first-partials"], difficulty: 2, context: "abstract",
    prompt: `For $f(x, y) = ${fStr}$, find both first partial derivatives.`,
    steps: [
      { instruction: "Find $f_x$ (treat $y$ as a constant).", answer: fx, accept: [`${cf(b)}y^2 + ${2 * a}xy`], hint: `Differentiate each term in $x$: $${cf(a)}x^2 y \\to ${2 * a}xy$ and $${cf(b)}x y^2 \\to ${cf(b)}y^2$.` },
      { instruction: "Find $f_y$ (treat $x$ as a constant).", answer: fy, accept: [`${2 * b}xy + ${cf(a)}x^2`], hint: `Differentiate each term in $y$: $${cf(a)}x^2 y \\to ${cf(a)}x^2$ and $${cf(b)}x y^2 \\to ${2 * b}xy$.` },
    ],
    finalAnswer: { value: `f_x = ${fx}, f_y = ${fy}`, unit: "" },
    solutionNarrative: `In $x$: $f_x = ${fx}$. In $y$: $f_y = ${fy}$. Each term keeps the frozen variable as a constant factor.`,
  };
};

// d3 first-partials: three variables (s04 tier).
fill["c3l-first-partials-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3);
  const varA = rng.pick([true, false]);
  const base = { id: `gen.c3l-first-partials-d3.${idx}`, generated: true, concepts: ["first-partials"], difficulty: 3, context: "abstract" };
  if (varA) {
    // f = a x^2 y z + b x z^3
    const fx = `${2 * a}xyz + ${cf(b)}z^3`, fy = `${cf(a)}x^2 z`, fz = `${cf(a)}x^2 y + ${3 * b}x z^2`;
    return { ...base,
      prompt: `For $f(x, y, z) = ${cf(a)}x^2 y z + ${cf(b)}x z^3$, find all three first partial derivatives.`,
      steps: [
        { instruction: "Find $f_x$ (treat $y$ and $z$ as constants).", answer: fx, accept: [`${cf(b)}z^3 + ${2 * a}xyz`], hint: `$${cf(a)}x^2 y z \\to ${2 * a}xyz$ and $${cf(b)}x z^3 \\to ${cf(b)}z^3$.` },
        { instruction: "Find $f_y$ (treat $x$ and $z$ as constants).", answer: fy, accept: [], hint: `Only the first term has $y$; the $${cf(b)}x z^3$ term vanishes.` },
        { instruction: "Find $f_z$ (treat $x$ and $y$ as constants).", answer: fz, accept: [`${3 * b}x z^2 + ${cf(a)}x^2 y`], hint: `$${cf(a)}x^2 y z \\to ${cf(a)}x^2 y$ and $${cf(b)}x z^3 \\to ${3 * b}x z^2$.` },
      ],
      finalAnswer: { value: `f_x = ${fx}, f_y = ${fy}, f_z = ${fz}`, unit: "" },
      solutionNarrative: `Freeze the other two variables for each: $f_x = ${fx}$, $f_y = ${fy}$, $f_z = ${fz}$.`,
    };
  }
  // f = a x y^2 z + b y z^2
  const fx = `${cf(a)}y^2 z`, fy = `${2 * a}xyz + ${cf(b)}z^2`, fz = `${cf(a)}x y^2 + ${2 * b}y z`;
  return { ...base,
    prompt: `For $f(x, y, z) = ${cf(a)}x y^2 z + ${cf(b)}y z^2$, find all three first partial derivatives.`,
    steps: [
      { instruction: "Find $f_x$ (treat $y$ and $z$ as constants).", answer: fx, accept: [], hint: `Only the first term has $x$; the $${cf(b)}y z^2$ term vanishes.` },
      { instruction: "Find $f_y$ (treat $x$ and $z$ as constants).", answer: fy, accept: [`${cf(b)}z^2 + ${2 * a}xyz`], hint: `$${cf(a)}x y^2 z \\to ${2 * a}xyz$ and $${cf(b)}y z^2 \\to ${cf(b)}z^2$.` },
      { instruction: "Find $f_z$ (treat $x$ and $y$ as constants).", answer: fz, accept: [`${2 * b}y z + ${cf(a)}x y^2`], hint: `$${cf(a)}x y^2 z \\to ${cf(a)}x y^2$ and $${cf(b)}y z^2 \\to ${2 * b}y z$.` },
    ],
    finalAnswer: { value: `f_x = ${fx}, f_y = ${fy}, f_z = ${fz}`, unit: "" },
    solutionNarrative: `Freeze the other two variables for each: $f_x = ${fx}$, $f_y = ${fy}$, $f_z = ${fz}$.`,
  };
};

// d3 evaluate-partials: a two-term mixed partial, evaluated at a point (s07
// tier). Values engineered nonzero with a bounded bump.
fill["c3l-evaluate-partials-d3"] = (rng, idx) => {
  const a = rng.int(1, 2), b = rng.int(1, 3);
  let p = rng.int(1, 3), q = rng.int(1, 3);
  const which = rng.pick(["x", "y"]);
  let sym, symAcc, val, symHint, evalHint;
  if (which === "x") {
    if (3 * a * p * p === b * q) p += 1; // val = q(3a p^2 - bq); after the bump 3a(p+1)^2 > bq
    sym = `${3 * a}x^2 y - ${cf(b)}y^2`;
    symAcc = [`-${cf(b)}y^2 + ${3 * a}x^2 y`];
    val = 3 * a * p * p * q - b * q * q;
    symHint = `Differentiate in $x$: $${cf(a)}x^3 y \\to ${3 * a}x^2 y$ and $-${cf(b)}x y^2 \\to -${cf(b)}y^2$.`;
    evalHint = `$${3 * a}(${p})^2(${q}) - ${b}(${q})^2 = ${3 * a * p * p * q} - ${b * q * q}$.`;
  } else {
    if (a * p * p === 2 * b * q) q += 1; // val = p(a p^2 - 2bq); the bump moves 2bq off a p^2
    sym = `${cf(a)}x^3 - ${2 * b}xy`;
    symAcc = [`-${2 * b}xy + ${cf(a)}x^3`];
    val = a * p ** 3 - 2 * b * p * q;
    symHint = `Differentiate in $y$: $${cf(a)}x^3 y \\to ${cf(a)}x^3$ and $-${cf(b)}x y^2 \\to -${2 * b}xy$.`;
    evalHint = `$${a === 1 ? "" : a}(${p})^3 - ${2 * b}(${p})(${q}) = ${a * p ** 3} - ${2 * b * p * q}$.`;
  }
  return {
    id: `gen.c3l-evaluate-partials-d3.${idx}`, generated: true, concepts: ["evaluate-partials"], difficulty: 3, context: "abstract",
    prompt: `For $f(x, y) = ${cf(a)}x^3 y - ${cf(b)}x y^2$, find $f_${which}$ and evaluate it at the point $(${p}, ${q})$.`,
    steps: [
      { instruction: `Find $f_${which}$ (treat the other variable as constant).`, answer: sym, accept: symAcc, hint: symHint },
      { instruction: `Evaluate $f_${which}$ at $(${p}, ${q})$.`, answer: `${val}`, accept: [], hint: evalHint },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$f_${which} = ${sym}$; at $(${p}, ${q})$ that is ${val}.`,
  };
};

// d2 partials-applied: a two-term marginal rate at an operating point (s12 tier).
fill["c3l-partials-applied-d2"] = (rng, idx) => {
  const a = rng.pick([2, 3, 4, 5]);
  const u0 = rng.int(4, 12), v0 = rng.int(2, 8);
  const val = a * v0 + 2 * u0;
  const ctx = rng.pick([
    {
      prompt: `A factory's output (units) is $P(L, K) = ${a}LK + L^2$, with $L$ workers and $K$ machines. Currently $L = ${u0}$, $K = ${v0}$. Find the marginal product of labor $\\partial P/\\partial L$ and evaluate it at the current operating point.`,
      sym: `${a}K + 2L`, symAcc: [`2L + ${a}K`], symHint: `Differentiate $${a}LK + L^2$ in $L$: $${a}LK \\to ${a}K$ and $L^2 \\to 2L$.`,
      evalTxt: `Evaluate $P_L$ at $L = ${u0}$, $K = ${v0}$.`, evalHint: `$${a}(${v0}) + 2(${u0})$.`,
      unit: "units per worker",
      narrative: `$P_L = ${a}K + 2L$; at $(${u0}, ${v0})$ this is $${a}(${v0}) + 2(${u0}) = ${val}$ units per added worker, capital held fixed.`,
    },
    {
      prompt: `A cafe's weekly revenue (dollars) is $R(x, y) = ${a}xy + x^2$, where $x$ is dozens of espresso drinks and $y$ dozens of pastries sold. Currently $x = ${u0}$, $y = ${v0}$. Find the marginal revenue $\\partial R/\\partial x$ and evaluate it there.`,
      sym: `${a}y + 2x`, symAcc: [`2x + ${a}y`], symHint: `Differentiate $${a}xy + x^2$ in $x$: $${a}xy \\to ${a}y$ and $x^2 \\to 2x$.`,
      evalTxt: `Evaluate $R_x$ at $x = ${u0}$, $y = ${v0}$.`, evalHint: `$${a}(${v0}) + 2(${u0})$.`,
      unit: "dollars per dozen drinks",
      narrative: `$R_x = ${a}y + 2x$; at $(${u0}, ${v0})$ this is $${val}$ — each extra dozen drinks adds about \\$${val}, pastry sales held fixed.`,
    },
    {
      prompt: `A greenhouse's weekly yield (kg) is $Y(w, f) = ${a}wf + w^2$, where $w$ is water units and $f$ fertilizer units. Currently $w = ${u0}$, $f = ${v0}$. Find $\\partial Y/\\partial w$ and evaluate it at the current settings.`,
      sym: `${a}f + 2w`, symAcc: [`2w + ${a}f`], symHint: `Differentiate $${a}wf + w^2$ in $w$: $${a}wf \\to ${a}f$ and $w^2 \\to 2w$.`,
      evalTxt: `Evaluate $Y_w$ at $w = ${u0}$, $f = ${v0}$.`, evalHint: `$${a}(${v0}) + 2(${u0})$.`,
      unit: "kg per water unit",
      narrative: `$Y_w = ${a}f + 2w = ${val}$ at the current settings: each extra water unit adds about ${val} kg, fertilizer held fixed.`,
    },
  ]);
  return {
    id: `gen.c3l-partials-applied-d2.${idx}`, generated: true, concepts: ["partials-applied"], difficulty: 2, context: "applied",
    prompt: ctx.prompt,
    steps: [
      { instruction: "Find the requested partial derivative (treat the other variable as constant).", answer: ctx.sym, accept: ctx.symAcc, hint: ctx.symHint },
      { instruction: ctx.evalTxt, answer: `${val}`, accept: [], hint: ctx.evalHint },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: ctx.narrative,
  };
};

// d3 partials-applied: marginal rate from a squared-plus-interaction model
// (s15 tier).
fill["c3l-partials-applied-d3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(2, 4);
  const p = rng.int(3, 8), q = rng.int(2, 6);
  const val = 2 * a * p + b * q;
  const ctx = rng.pick([
    {
      prompt: `A company's revenue (in thousands of dollars) is $R(x, y) = ${cf(a)}x^2 + ${b}xy$, where $x$ is spending on online ads and $y$ on TV ads (both in thousands). At $x = ${p}$, $y = ${q}$, find the marginal revenue from online ad spending $\\partial R/\\partial x$ and evaluate it.`,
      sym: `${2 * a}x + ${b}y`, symAcc: [`${b}y + ${2 * a}x`], symHint: `Differentiate $${cf(a)}x^2 + ${b}xy$ in $x$: $${cf(a)}x^2 \\to ${2 * a}x$ and $${b}xy \\to ${b}y$.`,
      evalTxt: `Evaluate $R_x$ at $x = ${p}$, $y = ${q}$.`, evalHint: `$${2 * a}(${p}) + ${b}(${q}) = ${2 * a * p} + ${b * q}$.`,
      unit: "thousand dollars per thousand spent",
      narrative: `$R_x = ${2 * a}x + ${b}y$; at $(${p}, ${q})$ this is $${2 * a * p} + ${b * q} = ${val}$ — each extra \\$1k of online ads adds about \\$${val}k, TV spend held fixed.`,
    },
    {
      prompt: `A farm's harvest (bushels) is $H(f, w) = ${cf(a)}f^2 + ${b}fw$, where $f$ is fertilizer units and $w$ irrigation units. At $f = ${p}$, $w = ${q}$, find the marginal yield of fertilizer $\\partial H/\\partial f$ and evaluate it.`,
      sym: `${2 * a}f + ${b}w`, symAcc: [`${b}w + ${2 * a}f`], symHint: `Differentiate $${cf(a)}f^2 + ${b}fw$ in $f$: $${cf(a)}f^2 \\to ${2 * a}f$ and $${b}fw \\to ${b}w$.`,
      evalTxt: `Evaluate $H_f$ at $f = ${p}$, $w = ${q}$.`, evalHint: `$${2 * a}(${p}) + ${b}(${q}) = ${2 * a * p} + ${b * q}$.`,
      unit: "bushels per fertilizer unit",
      narrative: `$H_f = ${2 * a}f + ${b}w = ${val}$ at $(${p}, ${q})$: each extra fertilizer unit adds about ${val} bushels, irrigation held fixed.`,
    },
    {
      prompt: `A plant's output (units) is $P(L, K) = ${cf(a)}L^2 + ${b}LK$, with $L$ workers and $K$ machines. At $L = ${p}$, $K = ${q}$, find the marginal product of labor $\\partial P/\\partial L$ and evaluate it.`,
      sym: `${2 * a}L + ${b}K`, symAcc: [`${b}K + ${2 * a}L`], symHint: `Differentiate $${cf(a)}L^2 + ${b}LK$ in $L$: $${cf(a)}L^2 \\to ${2 * a}L$ and $${b}LK \\to ${b}K$.`,
      evalTxt: `Evaluate $P_L$ at $L = ${p}$, $K = ${q}$.`, evalHint: `$${2 * a}(${p}) + ${b}(${q}) = ${2 * a * p} + ${b * q}$.`,
      unit: "units per worker",
      narrative: `$P_L = ${2 * a}L + ${b}K = ${val}$ at $(${p}, ${q})$: each added worker brings about ${val} units, machines held fixed.`,
    },
  ]);
  return {
    id: `gen.c3l-partials-applied-d3.${idx}`, generated: true, concepts: ["partials-applied"], difficulty: 3, context: "applied",
    prompt: ctx.prompt,
    steps: [
      { instruction: "Find the requested partial derivative (treat the other variable as constant).", answer: ctx.sym, accept: ctx.symAcc, hint: ctx.symHint },
      { instruction: ctx.evalTxt, answer: `${val}`, accept: [], hint: ctx.evalHint },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: ctx.narrative,
  };
};

// ---------------------------------------------------------------------------
// TOPIC: calculus-3.vectors-in-space
// ---------------------------------------------------------------------------

// d2 vector-components: tip minus tail with negative coordinates (s02 tier).
fill["c3l-vector-components-d2"] = (rng, idx) => {
  const A = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const u = [nzi(rng, -6, 6), nzi(rng, -6, 6), rng.int(-6, 6)];
  const B = [A[0] + u[0], A[1] + u[1], A[2] + u[2]];
  return {
    id: `gen.c3l-vector-components-d2.${idx}`, generated: true, concepts: ["vector-components"], difficulty: 2, context: "abstract",
    prompt: `Find the component form of the vector from $A = (${A.join(", ")})$ to $B = (${B.join(", ")})$.`,
    steps: [
      { instruction: "Compute the $x$-component, $B_x - A_x$.", answer: `${u[0]}`, accept: [], hint: `$${B[0]} - (${A[0]})$.` },
      { instruction: "Now give the full vector $\\vec{AB}$ in component form.", answer: V(...u), accept: [Pn(...u)], hint: `$y$: $${B[1]} - (${A[1]}) = ${u[1]}$; $z$: $${B[2]} - (${A[2]}) = ${u[2]}$.` },
    ],
    finalAnswer: { value: V(...u), unit: "" },
    solutionNarrative: `$\\vec{AB} = \\langle ${B[0]} - (${A[0]}),\\; ${B[1]} - (${A[1]}),\\; ${B[2]} - (${A[2]}) \\rangle = ${Vt(u)}$.`,
  };
};

// d3 vector-components: recover the TAIL point from the vector and the tip —
// the tip-minus-tail relation run in reverse.
fill["c3l-vector-components-d3"] = (rng, idx) => {
  const P = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const u = [nzi(rng, -6, 6), rng.int(-6, 6), nzi(rng, -6, 6)];
  const Q = [P[0] + u[0], P[1] + u[1], P[2] + u[2]];
  return {
    id: `gen.c3l-vector-components-d3.${idx}`, generated: true, concepts: ["vector-components"], difficulty: 3, context: "abstract",
    prompt: `The vector from a point $P$ to $Q = (${Q.join(", ")})$ is $\\vec{PQ} = ${Vt(u)}$. Find the point $P$.`,
    steps: [
      { instruction: "Since $\\vec{PQ} = Q - P$, we have $P = Q - \\vec{PQ}$. Compute the $x$-coordinate of $P$.", answer: `${P[0]}`, accept: [], hint: `$${Q[0]} - (${u[0]})$.` },
      { instruction: "Now give the full point $P$.", answer: `(${P.join(", ")})`, accept: [V(...P)], hint: `$y$: $${Q[1]} - (${u[1]}) = ${P[1]}$; $z$: $${Q[2]} - (${u[2]}) = ${P[2]}$.` },
    ],
    finalAnswer: { value: `(${P.join(", ")})`, unit: "" },
    solutionNarrative: `Rearranging tip-minus-tail: $P = Q - \\vec{PQ} = (${Q[0]} - (${u[0]}),\\; ${Q[1]} - (${u[1]}),\\; ${Q[2]} - (${u[2]})) = (${P.join(", ")})$. Check: $Q - P$ reproduces $${Vt(u)}$.`,
  };
};

// d2 magnitude-and-unit: Pythagorean quadruple with sign flips, so the
// magnitude is an exact integer and the unit vector has clean fractions.
fill["c3l-magnitude-unit-d2"] = (rng, idx) => {
  const quad = rng.pick(PYTH_3D);
  const h = quad[3];
  const r = rng.int(0, 2);
  const v = [0, 1, 2].map((i) => rng.pick([1, -1]) * quad[(r + i) % 3]);
  const unit = v.map((x) => frac(x, h));
  return {
    id: `gen.c3l-magnitude-unit-d2.${idx}`, generated: true, concepts: ["magnitude-and-unit"], difficulty: 2, context: "abstract",
    prompt: `For $\\vec{v} = ${Vt(v)}$, find its magnitude and then the unit vector in its direction.`,
    steps: [
      { instruction: "Compute the magnitude $\\sqrt{a^2 + b^2 + c^2}$.", answer: `${h}`, accept: [], hint: `$\\sqrt{${v[0] * v[0]} + ${v[1] * v[1]} + ${v[2] * v[2]}} = \\sqrt{${h * h}}$.` },
      { instruction: "Divide each component by the magnitude to get the unit vector.", answer: V(...unit), accept: [Pn(...unit)], hint: `$\\hat{u} = \\langle ${unit.join(",\\; ")} \\rangle$ — signs ride along unchanged.` },
    ],
    finalAnswer: { value: V(...unit), unit: "" },
    solutionNarrative: `$\\|\\vec{v}\\| = \\sqrt{${h * h}} = ${h}$ (a Pythagorean quadruple), so $\\hat{u} = ${Vt(unit)}$.`,
  };
};

// d3 magnitude-and-unit: the direction requested is -v, or v arrives
// pre-scaled so the fractions must be reduced (s06 tier).
fill["c3l-magnitude-unit-d3"] = (rng, idx) => {
  const quad = rng.pick(PYTH_3D);
  const h = quad[3];
  const r = rng.int(0, 2);
  const v = [0, 1, 2].map((i) => rng.pick([1, -1]) * quad[(r + i) % 3]);
  const base = { id: `gen.c3l-magnitude-unit-d3.${idx}`, generated: true, concepts: ["magnitude-and-unit"], difficulty: 3, context: "abstract" };
  if (rng.pick([false, true])) {
    const k = rng.int(2, 3);
    const w = v.map((x) => k * x);
    const unit = v.map((x) => frac(x, h));
    return { ...base,
      prompt: `For $\\vec{v} = ${Vt(w)}$, find its magnitude and the unit vector in its direction.`,
      steps: [
        { instruction: "Compute $\\|\\vec{v}\\|$.", answer: `${k * h}`, accept: [], hint: `$\\sqrt{${w[0] * w[0]} + ${w[1] * w[1]} + ${w[2] * w[2]}} = \\sqrt{${k * h * k * h}}$ — or spot that $\\vec{v} = ${k}${Vt(v)}$.` },
        { instruction: "Divide each component by the magnitude and reduce the fractions fully.", answer: V(...unit), accept: [Pn(...unit)], hint: `$${w[0]}/${k * h}$ reduces to $${unit[0]}$, and so on — the common factor ${k} cancels.` },
      ],
      finalAnswer: { value: V(...unit), unit: "" },
      solutionNarrative: `$\\|\\vec{v}\\| = ${k * h}$, and every fraction $${w[0]}/${k * h}, \\dots$ reduces by the common factor ${k}: $\\hat{u} = ${Vt(unit)}$. Scaling a vector never changes its unit direction.`,
    };
  }
  const unitNeg = v.map((x) => frac(-x, h));
  return { ...base,
    prompt: `For $\\vec{v} = ${Vt(v)}$, find its magnitude, then the unit vector in the direction of $-\\vec{v}$.`,
    steps: [
      { instruction: "Compute $\\|\\vec{v}\\|$.", answer: `${h}`, accept: [], hint: `$\\sqrt{${v[0] * v[0]} + ${v[1] * v[1]} + ${v[2] * v[2]}} = \\sqrt{${h * h}}$.` },
      { instruction: "The unit vector for $-\\vec{v}$ flips each sign, then divides by the magnitude. Give it in component form.", answer: V(...unitNeg), accept: [Pn(...unitNeg)], hint: `$-\\vec{v} = ${Vt(v.map((x) => -x))}$; divide each component by ${h}.` },
    ],
    finalAnswer: { value: V(...unitNeg), unit: "" },
    solutionNarrative: `$\\|\\vec{v}\\| = ${h}$. Then $-\\vec{v} = ${Vt(v.map((x) => -x))}$, and dividing by ${h} gives $${Vt(unitNeg)}$.`,
  };
};

// d1 vectors-applied: a displacement or a two-velocity resultant (s10/s11 tier).
fill["c3l-vectors-applied-d1"] = (rng, idx) => {
  const base = { id: `gen.c3l-vectors-applied-d1.${idx}`, generated: true, concepts: ["vectors-applied"], difficulty: 1, context: "applied" };
  if (rng.pick([true, false])) {
    const A = [rng.int(0, 5), rng.int(0, 5), 0];
    const u = [rng.int(1, 6), rng.int(1, 6), rng.int(2, 12)];
    const B = [A[0] + u[0], A[1] + u[1], u[2]];
    const who = rng.pick(["A drone", "A delivery quadcopter", "An inspection robot"]);
    return { ...base,
      prompt: `${who} takes off from position $(${A.join(", ")})$ meters and flies to $(${B.join(", ")})$ meters. What is its displacement vector?`,
      steps: [
        { instruction: "Displacement is destination minus start. Write it in component form.", answer: V(...u), accept: [Pn(...u)], hint: `$\\langle ${B[0]}-${A[0]},\\; ${B[1]}-${A[1]},\\; ${B[2]}-0 \\rangle$.` },
      ],
      finalAnswer: { value: V(...u), unit: "meters" },
      solutionNarrative: `Displacement $= \\langle ${B[0]}-${A[0]},\\; ${B[1]}-${A[1]},\\; ${B[2]}-0 \\rangle = ${Vt(u)}$ meters.`,
    };
  }
  const boat = rng.pick([true, false]);
  const sc = boat ? 1 : 10;
  const e = rng.int(4, 12) * sc, c = rng.int(2, 9) * sc;
  return { ...base,
    prompt: boat
      ? `A boat's engine drives it with velocity $\\langle ${e}, 0 \\rangle$ km/h and a current pushes it with velocity $\\langle 0, ${c} \\rangle$ km/h. What is the boat's resultant (net) velocity vector?`
      : `A plane flies with velocity $\\langle ${e}, 0 \\rangle$ km/h while a crosswind blows with velocity $\\langle 0, ${c} \\rangle$ km/h. What is the plane's ground-velocity vector?`,
    steps: [
      { instruction: "Add the two velocities component by component.", answer: V(e, c), accept: [Pn(e, c)], hint: `$\\langle ${e}+0,\\; 0+${c} \\rangle$.` },
    ],
    finalAnswer: { value: V(e, c), unit: "km/h" },
    solutionNarrative: `Net velocity $= \\langle ${e}, 0 \\rangle + \\langle 0, ${c} \\rangle = ${Vt([e, c])}$ km/h — the two effects add component by component.`,
  };
};

// d2 vectors-applied: two forces whose resultant is an engineered Pythagorean
// quadruple, so the magnitude is an exact integer (s12/s13 tier).
const FORCE2_CTX = ["Two cables pull on a ring", "Two tugboats pull on a barge", "Two ropes drag a crate"];
fill["c3l-vectors-applied-d2"] = (rng, idx) => {
  const quad = rng.pick(PYTH_3D);
  const m = rng.pick([2, 5]);
  const r = rng.int(0, 2);
  const R = [0, 1, 2].map((i) => quad[(r + i) % 3] * m);
  const F1 = [rng.int(-10, 30), rng.int(-10, 30), rng.int(0, 20)];
  const F2 = [R[0] - F1[0], R[1] - F1[1], R[2] - F1[2]];
  const mag = quad[3] * m;
  return {
    id: `gen.c3l-vectors-applied-d2.${idx}`, generated: true, concepts: ["vectors-applied"], difficulty: 2, context: "applied",
    prompt: `${rng.pick(FORCE2_CTX)}. The first exerts force $${Vt(F1)}$ N and the second $${Vt(F2)}$ N. Find the resultant force vector and its magnitude.`,
    steps: [
      { instruction: "Add the two force vectors component by component.", answer: V(...R), accept: [Pn(...R)], hint: `$x: ${F1[0]} + (${F2[0]})$; $y: ${F1[1]} + (${F2[1]})$; $z: ${F1[2]} + (${F2[2]})$.` },
      { instruction: "Compute the magnitude of the resultant.", answer: `${mag}`, accept: [], hint: `$\\sqrt{${R[0] * R[0]} + ${R[1] * R[1]} + ${R[2] * R[2]}} = \\sqrt{${mag * mag}}$.` },
    ],
    finalAnswer: { value: `${mag}`, unit: "N" },
    solutionNarrative: `Resultant $= ${Vt(R)}$ N; its magnitude is $\\sqrt{${mag * mag}} = ${mag}$ N — exact, because the resultant is a scaled Pythagorean quadruple.`,
  };
};

// d3 vectors-applied: THREE forces, resultant + exact integer magnitude (s15 tier).
const FORCE3_CTX = ["Three cables pull on a bolt", "Three guy-wires pull on an anchor plate", "Three rotor arms pull on a drone frame"];
fill["c3l-vectors-applied-d3"] = (rng, idx) => {
  const quad = rng.pick(PYTH_3D);
  const m = rng.pick([1, 2, 3]);
  const r = rng.int(0, 2);
  const R = [0, 1, 2].map((i) => quad[(r + i) % 3] * m);
  const F1 = [rng.int(-8, 12), rng.int(-8, 12), rng.int(-4, 12)];
  const F2 = [rng.int(-8, 12), rng.int(-8, 12), rng.int(-4, 12)];
  const F3 = [R[0] - F1[0] - F2[0], R[1] - F1[1] - F2[1], R[2] - F1[2] - F2[2]];
  const mag = quad[3] * m;
  return {
    id: `gen.c3l-vectors-applied-d3.${idx}`, generated: true, concepts: ["vectors-applied"], difficulty: 3, context: "applied",
    prompt: `${rng.pick(FORCE3_CTX)}: $${Vt(F1)}$ N, $${Vt(F2)}$ N, and $${Vt(F3)}$ N. Find the resultant force and its magnitude.`,
    steps: [
      { instruction: "Add all three force vectors component by component.", answer: V(...R), accept: [Pn(...R)], hint: `$x: ${F1[0]} + (${F2[0]}) + (${F3[0]})$; $y: ${F1[1]} + (${F2[1]}) + (${F3[1]})$; $z: ${F1[2]} + (${F2[2]}) + (${F3[2]})$.` },
      { instruction: "Compute the magnitude of the resultant.", answer: `${mag}`, accept: [], hint: `$\\sqrt{${R[0] * R[0]} + ${R[1] * R[1]} + ${R[2] * R[2]}} = \\sqrt{${mag * mag}}$.` },
    ],
    finalAnswer: { value: `${mag}`, unit: "N" },
    solutionNarrative: `Resultant $= ${Vt(R)}$ N with magnitude $\\sqrt{${mag * mag}} = ${mag}$ N — the components were engineered as a scaled Pythagorean quadruple.`,
  };
};
