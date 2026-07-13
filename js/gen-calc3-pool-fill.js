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
