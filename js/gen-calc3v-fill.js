// gen-calc3v-fill.js
// Self-contained generator pack for calculus-3.vector-valued-functions and
// calculus-3.line-integrals (template prefix c3v-).
// One generator per concept per difficulty tier (2 topics x 4 concepts x 3 tiers = 24).
// Exports a `fill` map of template-name -> generator fn, matching the shape
// used by js/generator.js's `generators` map (same pattern as gen-calc3-proof-fill.js).
//
// Grading notes baked into the answers (verified against the real checkStep):
// - Vector/tuple answers <a, b> only cross-grade when every entry is a plain
//   number or fraction, so all generated vector answers are EVALUATED at a
//   specific t (numeric entries; fractions == decimals both grade).
// - Scalar answers that are polynomials in t/x/y ("2t", "16 + 8t", "x^2y + y^3")
//   grade via full polynomial equivalence.
// - "36pi" and "36*pi" both evaluate via evalNumeric; both forms are listed.
// - Degenerate configs are excluded BY CONSTRUCTION: nonzero direction vectors,
//   nonzero velocity at every evaluation point, non-parallel Py/Qx only in the
//   branch that wants them, d != c in Green's fields, arc-length integrands
//   built as literal perfect squares and re-verified before emitting.

const V = (...xs) => `<${xs.join(", ")}>`;
const Pn = (...xs) => `(${xs.join(", ")})`;
const Vt = (xs) => `\\langle ${xs.join(", ")} \\rangle`; // LaTeX tuple for prompts

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

// Reduced fraction string: frac(35,2) = "35/2", frac(42,3)... reduces to "14".
function frac(n, d) {
  const g = gcd(n, d) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? `${nn}` : `${nn}/${dd}`;
}
// Rounded-decimal accept variant for a fraction (null when it is an integer).
function fracDec(n, d) {
  const v = n / d;
  if (Number.isInteger(v)) return null;
  return `${Math.round(v * 100) / 100}`;
}

// Coefficient formatting: cf(1)="", cf(-1)="-", cf(3)="3".
const cf = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);
// "a + b t" style linear string with proper signs; b assumed nonzero.
function lin(a, b, v = "t") {
  const bt = `${cf(b)}${v}`;
  if (a === 0) return bt;
  return b > 0 ? `${a} + ${bt}` : `${a} - ${cf(-b)}${v}`;
}

export const fill = {};

// ============================================================================
// TOPIC: calculus-3.vector-valued-functions
// ============================================================================

// --- concept: parametrize-and-evaluate --------------------------------------

// d1: build r(t) = P + tv for a line, evaluate at t = k.
fill["c3v-param-eval-1"] = (rng, idx) => {
  const x0 = rng.int(-3, 5), y0 = rng.int(-3, 5);
  const a = rng.int(1, 4);
  let b = rng.int(-3, 3);
  if (b === 0) b = 2; // direction must be genuinely 2D-nonzero in both slots
  const k = rng.int(1, 3);
  const xk = x0 + a * k, yk = y0 + b * k;
  return {
    id: `gen.c3v-param-eval-1.${idx}`, generated: true, concepts: ["parametrize-and-evaluate"], difficulty: 1, context: "abstract",
    prompt: `A particle starts at $(${x0}, ${y0})$ and moves with constant velocity $\\vec{v} = ${Vt([a, b])}$. Build $\\vec{r}(t) = P + t\\vec{v}$ and evaluate it at $t = ${k}$.`,
    steps: [
      { instruction: "Write the x-component of $\\vec{r}(t)$.", answer: lin(x0, a), accept: [`${cf(a)}t + ${x0}`], hint: `Start at $x = ${x0}$ and add ${a} per unit time.` },
      { instruction: "Write the y-component of $\\vec{r}(t)$.", answer: lin(y0, b), accept: [], hint: `Start at $y = ${y0}$ and add ${b} per unit time.` },
      { instruction: `Evaluate $\\vec{r}(${k})$ as a numeric vector.`, answer: V(xk, yk), accept: [Pn(xk, yk)], hint: `$${x0} + ${a}(${k}) = ${xk}$ and $${y0} + (${b})(${k}) = ${yk}$.` },
    ],
    finalAnswer: { value: V(xk, yk), unit: "" },
    solutionNarrative: `$\\vec{r}(t) = ${Vt([lin(x0, a), lin(y0, b)])}$; substituting $t = ${k}$ gives $${Vt([xk, yk])}$.`,
  };
};

// d2: circle (possibly off-center), evaluate at the landmark angles.
fill["c3v-param-eval-2"] = (rng, idx) => {
  const R = rng.int(2, 5);
  const h = rng.int(0, 3), k = rng.int(0, 3);
  const cx = (t0c, t0s) => h + R * t0c, cy = (t0c, t0s) => k + R * t0s;
  const r0 = [h + R, k], rHalfPi = [h, k + R], rPi = [h - R, k];
  const centerTxt = h === 0 && k === 0 ? "the origin" : `$(${h}, ${k})$`;
  return {
    id: `gen.c3v-param-eval-2.${idx}`, generated: true, concepts: ["parametrize-and-evaluate"], difficulty: 2, context: "abstract",
    prompt: `The function $\\vec{r}(t) = \\langle ${h === 0 ? "" : `${h} + `}${R}\\cos t,\\; ${k === 0 ? "" : `${k} + `}${R}\\sin t \\rangle$ traces the circle of radius ${R} centered at ${centerTxt}. Evaluate the position at $t = 0$, $t = \\pi/2$, and $t = \\pi$.`,
    steps: [
      { instruction: "Evaluate $\\vec{r}(0)$ as a numeric vector.", answer: V(...r0), accept: [Pn(...r0)], hint: "$\\cos 0 = 1$, $\\sin 0 = 0$." },
      { instruction: "Evaluate $\\vec{r}(\\pi/2)$ as a numeric vector.", answer: V(...rHalfPi), accept: [Pn(...rHalfPi)], hint: "$\\cos\\tfrac{\\pi}{2} = 0$, $\\sin\\tfrac{\\pi}{2} = 1$." },
      { instruction: "Evaluate $\\vec{r}(\\pi)$ as a numeric vector.", answer: V(...rPi), accept: [Pn(...rPi)], hint: "$\\cos\\pi = -1$, $\\sin\\pi = 0$." },
    ],
    finalAnswer: { value: V(...rPi), unit: "" },
    solutionNarrative: `Using the landmark values of sine and cosine: $\\vec{r}(0) = ${Vt(r0)}$, $\\vec{r}(\\pi/2) = ${Vt(rHalfPi)}$, $\\vec{r}(\\pi) = ${Vt(rPi)}$ — quarter turns around the circle.`,
  };
};

// d3: parametrize the segment between two points, find direction and midpoint.
fill["c3v-param-eval-3"] = (rng, idx) => {
  const A = [2 * rng.int(-2, 3), 2 * rng.int(-2, 3)];
  let B = [2 * rng.int(-2, 3), 2 * rng.int(-2, 3)];
  while (B[0] === A[0] && B[1] === A[1]) B = [B[0] + 2, B[1] + 2]; // no zero-length segment
  const d = [B[0] - A[0], B[1] - A[1]];
  const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const xExpr = d[0] === 0 ? `${A[0]}` : lin(A[0], d[0]);
  return {
    id: `gen.c3v-param-eval-3.${idx}`, generated: true, concepts: ["parametrize-and-evaluate"], difficulty: 3, context: "abstract",
    prompt: `Parametrize the straight segment from $A = (${A.join(", ")})$ to $B = (${B.join(", ")})$ as $\\vec{r}(t) = A + t(B - A)$ for $0 \\le t \\le 1$, and locate its midpoint.`,
    steps: [
      { instruction: "Compute the direction vector $B - A$.", answer: V(...d), accept: [Pn(...d)], hint: `Subtract componentwise: $(${B[0]} - ${A[0]},\\; ${B[1]} - ${A[1]})$.` },
      { instruction: "Write the x-component of $\\vec{r}(t)$.", answer: xExpr, accept: [], hint: `$x(t) = ${A[0]} + (${d[0]})t$.` },
      { instruction: "Evaluate the midpoint $\\vec{r}(1/2)$ as a numeric vector.", answer: V(...mid), accept: [Pn(...mid)], hint: `Average the endpoints: $\\left(\\frac{${A[0]}+${B[0]}}{2}, \\frac{${A[1]}+${B[1]}}{2}\\right)$.` },
    ],
    finalAnswer: { value: V(...mid), unit: "" },
    solutionNarrative: `$B - A = ${Vt(d)}$, so $\\vec{r}(t) = ${Vt([xExpr, d[1] === 0 ? `${A[1]}` : lin(A[1], d[1])])}$; at $t = 1/2$ this is the midpoint $${Vt(mid)}$.`,
  };
};

// --- concept: velocity-and-acceleration -------------------------------------

// d1: r(t) = <a t^2, b t>; v and a evaluated at t = k.
fill["c3v-vel-accel-1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 5), k = rng.int(1, 3);
  const vk = [2 * a * k, b]; // b >= 1 keeps v(k) nonzero
  return {
    id: `gen.c3v-vel-accel-1.${idx}`, generated: true, concepts: ["velocity-and-acceleration"], difficulty: 1, context: "abstract",
    prompt: `For $\\vec{r}(t) = \\langle ${cf(a)}t^2,\\; ${cf(b)}t \\rangle$, find the velocity at $t = ${k}$ and the (constant) acceleration.`,
    steps: [
      { instruction: "Write the x-component of the velocity $\\vec{v}(t)$.", answer: `${2 * a}t`, accept: [`${2 * a}*t`], hint: `Differentiate $${cf(a)}t^2$.` },
      { instruction: `Evaluate $\\vec{v}(${k})$ as a numeric vector.`, answer: V(...vk), accept: [Pn(...vk)], hint: `$\\vec{v}(t) = \\langle ${2 * a}t, ${b} \\rangle$; substitute $t = ${k}$.` },
      { instruction: "Give the acceleration $\\vec{a}(t)$ as a numeric vector.", answer: V(2 * a, 0), accept: [Pn(2 * a, 0)], hint: `Differentiate $\\langle ${2 * a}t, ${b} \\rangle$ componentwise.` },
    ],
    finalAnswer: { value: V(...vk), unit: "" },
    solutionNarrative: `$\\vec{v}(t) = \\langle ${2 * a}t, ${b} \\rangle$ gives $\\vec{v}(${k}) = ${Vt(vk)}$; differentiating again, $\\vec{a} = ${Vt([2 * a, 0])}$.`,
  };
};

// d2: 3D cubic/quadratic path, v and a at t = k.
fill["c3v-vel-accel-2"] = (rng, idx) => {
  const a = rng.int(1, 2), c = rng.int(0, 3), b = rng.int(1, 2), d = rng.int(1, 4), k = rng.int(1, 2);
  const vk = [2 * a * k + c, 3 * b * k * k, d]; // d >= 1 keeps v(k) nonzero
  const ak = [2 * a, 6 * b * k, 0];
  const xTxt = c === 0 ? `${cf(a)}t^2` : `${cf(a)}t^2 + ${c}t`;
  return {
    id: `gen.c3v-vel-accel-2.${idx}`, generated: true, concepts: ["velocity-and-acceleration"], difficulty: 2, context: "abstract",
    prompt: `For the 3D path $\\vec{r}(t) = \\langle ${xTxt},\\; ${cf(b)}t^3,\\; ${cf(d)}t \\rangle$, find the velocity and acceleration at $t = ${k}$.`,
    steps: [
      { instruction: "Write the y-component of $\\vec{v}(t)$.", answer: `${3 * b}t^2`, accept: [`${3 * b}*t^2`], hint: `Differentiate $${cf(b)}t^3$.` },
      { instruction: `Evaluate $\\vec{v}(${k})$ as a numeric vector.`, answer: V(...vk), accept: [Pn(...vk)], hint: `$\\vec{v}(t) = \\langle ${lin(c, 2 * a)}, ${3 * b}t^2, ${d} \\rangle$ at $t = ${k}$.` },
      { instruction: `Evaluate $\\vec{a}(${k})$ as a numeric vector.`, answer: V(...ak), accept: [Pn(...ak)], hint: `$\\vec{a}(t) = \\langle ${2 * a}, ${6 * b}t, 0 \\rangle$ at $t = ${k}$.` },
    ],
    finalAnswer: { value: V(...vk), unit: "" },
    solutionNarrative: `Componentwise: $\\vec{v}(${k}) = ${Vt(vk)}$ and $\\vec{a}(${k}) = ${Vt(ak)}$.`,
  };
};

// d3: find where the horizontal velocity vanishes; v and a there.
fill["c3v-vel-accel-3"] = (rng, idx) => {
  const m = rng.int(1, 2); // the root of v_x
  const p = 3 * m * m;     // ensures 3t^2 - p = 0 exactly at t = m
  const q = rng.int(1, 3);
  const vm = [0, 2 * q * m]; // 2qm >= 2: velocity at the stop-moment is NOT the zero vector
  const am = [6 * m, 2 * q];
  return {
    id: `gen.c3v-vel-accel-3.${idx}`, generated: true, concepts: ["velocity-and-acceleration"], difficulty: 3, context: "abstract",
    prompt: `For $\\vec{r}(t) = \\langle t^3 - ${p}t,\\; ${cf(q)}t^2 \\rangle$, find the moment ($t \\geq 0$) when the horizontal velocity vanishes, and the velocity and acceleration vectors there.`,
    steps: [
      { instruction: "Write the x-component of $\\vec{v}(t)$.", answer: `3t^2 - ${p}`, accept: [`3*t^2 - ${p}`, `-${p} + 3t^2`], hint: `Differentiate $t^3 - ${p}t$.` },
      { instruction: `Solve $3t^2 - ${p} = 0$ for $t \\geq 0$.`, answer: `${m}`, accept: [`t=${m}`], hint: `$t^2 = ${m * m}$; keep the nonnegative root.` },
      { instruction: `Evaluate $\\vec{v}(${m})$ as a numeric vector.`, answer: V(...vm), accept: [Pn(...vm)], hint: `$\\vec{v}(t) = \\langle 3t^2 - ${p},\\; ${2 * q}t \\rangle$ at $t = ${m}$.` },
      { instruction: `Evaluate $\\vec{a}(${m})$ as a numeric vector.`, answer: V(...am), accept: [Pn(...am)], hint: `$\\vec{a}(t) = \\langle 6t,\\; ${2 * q} \\rangle$ at $t = ${m}$.` },
    ],
    finalAnswer: { value: V(...vm), unit: "" },
    solutionNarrative: `$v_x = 3t^2 - ${p} = 0$ at $t = ${m}$. There $\\vec{v}(${m}) = ${Vt(vm)}$ — momentarily moving straight up — while $\\vec{a}(${m}) = ${Vt(am)}$.`,
  };
};

// --- concept: speed-and-arc-length -------------------------------------------

const TRIPLES_2D = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17]];
const TRIPLES_3D = [[1, 2, 2, 3], [2, 3, 6, 7], [4, 4, 7, 9], [1, 4, 8, 9], [2, 6, 9, 11]];

// d1: straight line, constant speed, length = speed x time.
fill["c3v-speed-arclen-1"] = (rng, idx) => {
  const use3d = rng.pick([true, false]);
  const trip = use3d ? rng.pick(TRIPLES_3D) : rng.pick(TRIPLES_2D);
  const v = trip.slice(0, -1), s = trip[trip.length - 1];
  const T = rng.int(2, 4);
  const P = v.map(() => rng.int(0, 3));
  const comps = v.map((vi, i) => (P[i] === 0 ? `${cf(vi)}t` : lin(P[i], vi)));
  return {
    id: `gen.c3v-speed-arclen-1.${idx}`, generated: true, concepts: ["speed-and-arc-length"], difficulty: 1, context: "abstract",
    prompt: `For the straight-line path $\\vec{r}(t) = ${Vt(comps)}$, find the speed and the arc length over $[0, ${T}]$.`,
    steps: [
      { instruction: "Give the (constant) velocity $\\vec{v}(t)$ as a numeric vector.", answer: V(...v), accept: [Pn(...v)], hint: "Differentiate each component; the constants vanish." },
      { instruction: "Compute the speed.", answer: `${s}`, accept: [], hint: `$\\sqrt{${v.map((x) => `${x}^2`).join(" + ")}} = \\sqrt{${s * s}}$.` },
      { instruction: `Arc length over $[0, ${T}]$ is speed × elapsed time. Compute it.`, answer: `${s * T}`, accept: [], hint: `$${s} \\times ${T}$.` },
    ],
    finalAnswer: { value: `${s * T}`, unit: "" },
    solutionNarrative: `The velocity is the constant $${Vt(v)}$ with magnitude ${s}, so $L = \\int_0^{${T}} ${s}\\, dt = ${s * T}$.`,
  };
};

// d2: speed at a point with a Pythagorean-clean velocity.
const SPEED_PAIRS = [[2, 3, 5], [3, 8, 10], [4, 6, 10], [6, 5, 13], [4, 15, 17], [6, 9, 15]]; // [t0, c, speed] with (2t0)^2 + c^2 = speed^2
fill["c3v-speed-arclen-2"] = (rng, idx) => {
  const [t0, c, s] = rng.pick(SPEED_PAIRS);
  const vt0 = [2 * t0, c];
  return {
    id: `gen.c3v-speed-arclen-2.${idx}`, generated: true, concepts: ["speed-and-arc-length"], difficulty: 2, context: "abstract",
    prompt: `For $\\vec{r}(t) = \\langle t^2,\\; ${cf(c)}t \\rangle$, find the speed at $t = ${t0}$.`,
    steps: [
      { instruction: "Write the x-component of $\\vec{v}(t)$.", answer: "2t", accept: ["2*t"], hint: "Differentiate $t^2$." },
      { instruction: `Evaluate $\\vec{v}(${t0})$ as a numeric vector.`, answer: V(...vt0), accept: [Pn(...vt0)], hint: `$\\langle 2(${t0}), ${c} \\rangle$.` },
      { instruction: `Compute the speed at $t = ${t0}$.`, answer: `${s}`, accept: [], hint: `$\\sqrt{${2 * t0}^2 + ${c}^2} = \\sqrt{${s * s}}$.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$\\vec{v}(${t0}) = ${Vt(vt0)}$, so the speed is $\\sqrt{${4 * t0 * t0} + ${c * c}} = ${s}$.`,
  };
};

// d3: arc length of r(t) = <t, (2/3)t^{3/2}> with a perfect-square integrand.
fill["c3v-speed-arclen-3"] = (rng, idx) => {
  let k = rng.pick([2, 3, 4, 5]);
  let b = k * k - 1; // upper limit chosen so (1 + b)^{3/2} = k^3 exactly
  if (1 + b !== k * k) { k = 2; b = 3; } // algebraic re-verification (never triggers)
  const Lnum = 2 * (k * k * k - 1); // L = (2/3)(k^3 - 1)
  const ans = frac(Lnum, 3);
  const dec = fracDec(Lnum, 3);
  return {
    id: `gen.c3v-speed-arclen-3.${idx}`, generated: true, concepts: ["speed-and-arc-length"], difficulty: 3, context: "abstract",
    prompt: `Compute the arc length of $\\vec{r}(t) = \\langle t,\\; \\tfrac{2}{3}t^{3/2} \\rangle$ over $[0, ${b}]$. (The curve is engineered so the speed simplifies.)`,
    steps: [
      { instruction: "With $\\vec{r}\\,'(t) = \\langle 1,\\; t^{1/2} \\rangle$, write $|\\vec{r}\\,'(t)|^2$ as a polynomial in $t$.", answer: "1 + t", accept: ["t + 1", "1+t"], hint: "$1^2 + (t^{1/2})^2$." },
      { instruction: `The antiderivative of $\\sqrt{1+t}$ is $\\tfrac{2}{3}(1+t)^{3/2}$. Evaluate $(1 + ${b})^{3/2}$.`, answer: `${k * k * k}`, accept: [], hint: `$${k * k}^{3/2} = (\\sqrt{${k * k}})^3 = ${k}^3$.` },
      { instruction: `Compute $L = \\tfrac{2}{3}\\left[(1+t)^{3/2}\\right]_0^{${b}} = \\tfrac{2}{3}(${k * k * k} - 1)$.`, answer: ans, accept: dec ? [dec] : [], hint: `$\\tfrac{2}{3} \\times ${k * k * k - 1}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$|\\vec{r}\\,'|^2 = 1 + t$ — a perfect setup — so $L = \\int_0^{${b}} \\sqrt{1+t}\\,dt = \\tfrac{2}{3}(${k}^3 - 1) = ${ans}$.`,
  };
};

// --- concept: tangent-vectors-and-motion -------------------------------------

const PRIMITIVE_TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [20, 21, 29]];

// d1: unit tangent from a given velocity with a clean norm.
fill["c3v-tangent-motion-1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(PRIMITIVE_TRIPLES);
  const m = rng.int(1, 2);
  const sx = rng.pick([1, -1]);
  const v = [sx * a * m, b * m], s = c * m;
  const T = [`${sx === -1 ? "-" : ""}${a}/${c}`, `${b}/${c}`];
  return {
    id: `gen.c3v-tangent-motion-1.${idx}`, generated: true, concepts: ["tangent-vectors-and-motion"], difficulty: 1, context: "abstract",
    prompt: `At some moment a particle's velocity is $\\vec{v} = ${Vt(v)}$. Find its speed and the unit tangent vector $\\vec{T} = \\vec{v}/|\\vec{v}|$.`,
    steps: [
      { instruction: "Compute the speed $|\\vec{v}|$.", answer: `${s}`, accept: [], hint: `$\\sqrt{${v[0] * v[0]} + ${v[1] * v[1]}} = \\sqrt{${s * s}}$.` },
      { instruction: "Give the unit tangent $\\vec{T}$ as a numeric vector.", answer: V(...T), accept: [Pn(...T)], hint: `Divide $${Vt(v)}$ by ${s} and reduce the fractions.` },
    ],
    finalAnswer: { value: V(...T), unit: "" },
    solutionNarrative: `$|\\vec{v}| = ${s}$, so $\\vec{T} = ${Vt(v)}/${s} = ${Vt(T)}$ — pure direction, length 1.`,
  };
};

// d2: unit tangent at a point on r(t) = <t^2, c t> with a clean norm.
fill["c3v-tangent-motion-2"] = (rng, idx) => {
  const [t0, c, s] = rng.pick(SPEED_PAIRS);
  const vt0 = [2 * t0, c];
  const g1 = gcd(2 * t0, s), g2 = gcd(c, s);
  const T = [`${(2 * t0) / g1}/${s / g1}`, `${c / g2}/${s / g2}`];
  return {
    id: `gen.c3v-tangent-motion-2.${idx}`, generated: true, concepts: ["tangent-vectors-and-motion"], difficulty: 2, context: "abstract",
    prompt: `For $\\vec{r}(t) = \\langle t^2,\\; ${cf(c)}t \\rangle$, find the unit tangent vector at $t = ${t0}$.`,
    steps: [
      { instruction: `Evaluate $\\vec{v}(${t0})$ as a numeric vector.`, answer: V(...vt0), accept: [Pn(...vt0)], hint: `$\\vec{v}(t) = \\langle 2t, ${c} \\rangle$ at $t = ${t0}$.` },
      { instruction: `Compute the speed at $t = ${t0}$.`, answer: `${s}`, accept: [], hint: `$\\sqrt{${2 * t0}^2 + ${c}^2}$.` },
      { instruction: `Give the unit tangent $\\vec{T}(${t0})$ as a numeric vector.`, answer: V(...T), accept: [Pn(...T)], hint: `Divide $${Vt(vt0)}$ by ${s}.` },
    ],
    finalAnswer: { value: V(...T), unit: "" },
    solutionNarrative: `$\\vec{v}(${t0}) = ${Vt(vt0)}$ with speed ${s}, so $\\vec{T}(${t0}) = ${Vt(T)}$.`,
  };
};

// d3: full projectile analysis — apex, landing, impact velocity.
fill["c3v-tangent-motion-3"] = (rng, idx) => {
  const m = rng.int(1, 2);         // apex time (v1 = 32m)
  const r = rng.int(1, 2);
  const n = 2 * m + r;             // landing time (positive root by construction)
  let h = 16 * n * (n - 2 * m);    // launch height making y(n) = 0 exactly
  if (h + 32 * m * n - 16 * n * n !== 0) h = 16 * n * n - 32 * m * n; // re-verify the root
  const v0 = 10 * rng.int(2, 4);
  const v1 = 32 * m;
  const apexY = h + 16 * m * m;
  const impact = [v0, v1 - 32 * n];
  return {
    id: `gen.c3v-tangent-motion-3.${idx}`, generated: true, concepts: ["tangent-vectors-and-motion"], difficulty: 3, context: "applied",
    prompt: `A projectile launched from a platform follows $\\vec{r}(t) = \\langle ${v0}t,\\; ${h === 0 ? "" : `${h} + `}${v1}t - 16t^2 \\rangle$ (feet). Find the apex time, the landing time, and the impact velocity.`,
    steps: [
      { instruction: "Write the y-component of $\\vec{v}(t)$.", answer: `${v1} - 32t`, accept: [`-32t + ${v1}`], hint: `Differentiate $${h === 0 ? "" : `${h} + `}${v1}t - 16t^2$.` },
      { instruction: `Find the apex time (where $${v1} - 32t = 0$).`, answer: `${m}`, accept: [`t=${m}`], hint: `Solve $${v1} = 32t$.` },
      { instruction: `Find the landing time: solve $${h === 0 ? "" : `${h} + `}${v1}t - 16t^2 = 0$ (keep the positive root).`, answer: `${n}`, accept: [`t=${n}`], hint: `Divide by $-16$: $t^2 - ${2 * m}t${h === 0 ? "" : ` - ${h / 16}`} = 0$ factors with root $t = ${n}$.` },
      { instruction: `Give the impact velocity $\\vec{v}(${n})$ as a numeric vector.`, answer: V(...impact), accept: [Pn(...impact)], hint: `$\\langle ${v0},\\; ${v1} - 32(${n}) \\rangle$.` },
    ],
    finalAnswer: { value: V(...impact), unit: "" },
    solutionNarrative: `Apex at $t = ${v1}/32 = ${m}$ s (height ${apexY} ft). Landing at $t = ${n}$ s. Impact velocity $${Vt(impact)}$ — the horizontal ${v0} never changed; gravity only touched the vertical component.`,
  };
};

// ============================================================================
// TOPIC: calculus-3.line-integrals
// ============================================================================

// --- concept: vector-fields-and-potentials -----------------------------------

// d1: conservative test on F = <a y, b x>; potential when it passes.
fill["c3v-field-potential-1"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const conservative = rng.pick([true, false]);
  let b = conservative ? a : a + rng.pick([1, 2, -1]);
  if (!conservative && b === a) b = a + 1; // the non-conservative branch must truly fail the test
  const steps = [
    { instruction: `Compute $\\partial P/\\partial y$ for $P = ${a}y$.`, answer: `${a}`, accept: [], hint: `Differentiate $${a}y$ with respect to $y$.` },
    { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${b}x$.`, answer: `${b}`, accept: [], hint: `Differentiate $${b}x$ with respect to $x$.` },
    { instruction: "Is the field conservative? Type 'conservative' or 'not conservative'.", answer: conservative ? "conservative" : "not conservative", accept: conservative ? ["yes"] : ["not", "no"], hint: conservative ? `$${a} = ${b}$, so the test passes.` : `$${a} \\neq ${b}$, so the test fails.` },
  ];
  if (conservative) {
    steps.push({ instruction: "Find the potential $f(x,y)$ (constant 0).", answer: `${a}xy`, accept: [`${a}yx`, `${a}xy + c`, `${a}*x*y`], hint: `Integrate $P = ${a}y$ in $x$: $${a}xy + g(y)$; matching $f_y = ${a}x = Q$ forces $g' = 0$.` });
  }
  return {
    id: `gen.c3v-field-potential-1.${idx}`, generated: true, concepts: ["vector-fields-and-potentials"], difficulty: 1, context: "abstract",
    prompt: `Test whether $\\vec{F} = \\langle ${a}y,\\; ${b}x \\rangle$ is conservative${conservative ? ", and if so find a potential $f$ with $\\nabla f = \\vec{F}$" : ""}.`,
    steps,
    finalAnswer: { value: conservative ? `${a}xy` : "not conservative", unit: "" },
    solutionNarrative: conservative
      ? `$P_y = ${a} = Q_x$, so the field is conservative with potential $f = ${a}xy$ (check: $\\nabla(${a}xy) = \\langle ${a}y, ${a}x \\rangle$).`
      : `$P_y = ${a}$ but $Q_x = ${b}$. Since they differ, no potential exists — work done by this field depends on the path.`,
  };
};

// d2: conservative BY DESIGN (built as a gradient); find the potential.
fill["c3v-field-potential-2"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 5);
  // f = a x^2 y + b y  =>  F = <2a x y, a x^2 + b>
  const fStr = `${cf(a)}x^2y + ${b}y`;
  return {
    id: `gen.c3v-field-potential-2.${idx}`, generated: true, concepts: ["vector-fields-and-potentials"], difficulty: 2, context: "abstract",
    prompt: `Test whether $\\vec{F} = \\langle ${2 * a}xy,\\; ${cf(a)}x^2 + ${b} \\rangle$ is conservative, and find its potential $f$ (constant 0).`,
    steps: [
      { instruction: `Compute $\\partial P/\\partial y$ for $P = ${2 * a}xy$.`, answer: `${2 * a}x`, accept: [`${2 * a}*x`], hint: "Treat $x$ as a constant." },
      { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${cf(a)}x^2 + ${b}$.`, answer: `${2 * a}x`, accept: [`${2 * a}*x`], hint: "The constant term vanishes." },
      { instruction: "Is the field conservative? Type 'conservative' or 'not conservative'.", answer: "conservative", accept: ["yes"], hint: `Both partials equal $${2 * a}x$.` },
      { instruction: "Find the potential $f(x,y)$.", answer: fStr, accept: [`${cf(a)}x^2*y + ${b}y`, `${fStr} + c`, `${b}y + ${cf(a)}x^2y`], hint: `Integrate $P$ in $x$: $${cf(a)}x^2y + g(y)$; match $f_y = ${cf(a)}x^2 + g'(y)$ with $Q$ to get $g'(y) = ${b}$.` },
    ],
    finalAnswer: { value: fStr, unit: "" },
    solutionNarrative: `$P_y = ${2 * a}x = Q_x$ ✓. Then $f = \\int ${2 * a}xy\\,dx = ${cf(a)}x^2y + g(y)$; matching against $Q$ gives $g(y) = ${b}y$, so $f = ${fStr}$.`,
  };
};

// d3: gradient plus an OPTIONAL non-conservative perturbation <0, kx>.
fill["c3v-field-potential-3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 4);
  const conservative = rng.pick([true, false]);
  const k = conservative ? 0 : rng.pick([1, 2, 3]);
  // f = a x y^2 + b x^2  =>  grad f = <a y^2 + 2b x, 2a x y>; perturbed Q adds kx.
  const P = `${cf(a)}y^2 + ${2 * b}x`;
  const Q = k === 0 ? `${2 * a}xy` : `${2 * a}xy + ${k}x`;
  const fStr = `${cf(a)}xy^2 + ${cf(b)}x^2`;
  const steps = [
    { instruction: `Compute $\\partial P/\\partial y$ for $P = ${P}$.`, answer: `${2 * a}y`, accept: [`${2 * a}*y`], hint: `The $${2 * b}x$ term has no $y$.` },
    { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${Q}$.`, answer: k === 0 ? `${2 * a}y` : `${2 * a}y + ${k}`, accept: [], hint: k === 0 ? "Treat $y$ as a constant." : `Both terms contribute: $${2 * a}y + ${k}$.` },
    { instruction: "Is the field conservative? Type 'conservative' or 'not conservative'.", answer: conservative ? "conservative" : "not conservative", accept: conservative ? ["yes"] : ["not", "no"], hint: conservative ? "The two partials agree." : `They differ by the constant ${k}.` },
  ];
  if (conservative) {
    steps.push({ instruction: "Find the potential $f(x,y)$ (constant 0).", answer: fStr, accept: [`${cf(a)}x*y^2 + ${cf(b)}x^2`, `${fStr} + c`, `${cf(b)}x^2 + ${cf(a)}xy^2`], hint: `Integrate $P$ in $x$: $${cf(a)}xy^2 + ${cf(b)}x^2 + g(y)$; matching $f_y = ${2 * a}xy$ against $Q$ gives $g' = 0$.` });
  } else {
    steps.push({ instruction: "By how much does the test fail? Compute $Q_x - P_y$.", answer: `${k}`, accept: [], hint: `$(${2 * a}y + ${k}) - ${2 * a}y$.` });
  }
  return {
    id: `gen.c3v-field-potential-3.${idx}`, generated: true, concepts: ["vector-fields-and-potentials"], difficulty: 3, context: "abstract",
    prompt: `Test whether $\\vec{F} = \\langle ${P},\\; ${Q} \\rangle$ is conservative${conservative ? ", and find its potential $f$ (constant 0)" : ", and measure how badly the test fails"}.`,
    steps,
    finalAnswer: { value: conservative ? fStr : "not conservative", unit: "" },
    solutionNarrative: conservative
      ? `$P_y = ${2 * a}y = Q_x$ ✓, and integrating $P$ in $x$ gives $f = ${fStr}$ (the $y$-match adds nothing).`
      : `$P_y = ${2 * a}y$ but $Q_x = ${2 * a}y + ${k}$ — off by ${k}, so no potential exists. (The field is a gradient plus the swirl $\\langle 0, ${k}x \\rangle$.)`,
  };
};

// --- concept: scalar-line-integrals -------------------------------------------

// d1: axis-aligned segment, speed 1.
fill["c3v-scalar-line-1"] = (rng, idx) => {
  const alongX = rng.pick([true, false]);
  const c = rng.int(1, 4), L = rng.int(2, 6);
  const varName = alongX ? "x" : "y";
  const end = alongX ? `(${L}, 0)` : `(0, ${L})`;
  const param = alongX ? "\\langle t, 0 \\rangle" : "\\langle 0, t \\rangle";
  const ans = frac(c * L * L, 2);
  const dec = fracDec(c * L * L, 2);
  return {
    id: `gen.c3v-scalar-line-1.${idx}`, generated: true, concepts: ["scalar-line-integrals"], difficulty: 1, context: "abstract",
    prompt: `Compute $\\displaystyle\\int_C ${c === 1 ? "" : c}${varName}\\, ds$, where $C$ is the straight segment from $(0,0)$ to $${end}$.`,
    steps: [
      { instruction: `Parametrize $C$ as $\\vec{r}(t) = ${param}$, $0 \\le t \\le ${L}$. What is the speed $|\\vec{r}\\,'(t)|$?`, answer: "1", accept: [], hint: "The velocity is a unit coordinate vector." },
      { instruction: `Compute $\\displaystyle\\int_0^{${L}} ${c === 1 ? "" : c}t \\cdot 1\\, dt$.`, answer: ans, accept: dec ? [dec] : [], hint: `$${c}\\left[t^2/2\\right]_0^{${L}} = ${c} \\cdot ${L * L}/2$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Along the axis, $ds = dt$ and $${varName} = t$, so the integral is $\\int_0^{${L}} ${c}t\\, dt = ${ans}$.`,
  };
};

// d2: 3-4-5 segment, linear integrand.
fill["c3v-scalar-line-2"] = (rng, idx) => {
  const m = rng.int(1, 3), p = rng.int(1, 3), q = rng.int(1, 3);
  const end = [3 * m, 4 * m];
  const L = 5 * m;
  const A = 3 * m * p + 4 * m * q; // f(r(t)) = A t; A > 0 by construction
  const fTxt = p === q ? (p === 1 ? "x + y" : `${p}x + ${q}y`) : `${cf(p)}x + ${cf(q)}y`;
  const ans = frac(A * L, 2);
  const dec = fracDec(A * L, 2);
  return {
    id: `gen.c3v-scalar-line-2.${idx}`, generated: true, concepts: ["scalar-line-integrals"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\displaystyle\\int_C (${fTxt})\\, ds$, where $C$ is the straight segment from $(0,0)$ to $(${end.join(", ")})$, parametrized as $\\vec{r}(t) = \\langle ${3 * m}t,\\; ${4 * m}t \\rangle$, $0 \\le t \\le 1$.`,
    steps: [
      { instruction: "Compute the speed $|\\vec{r}\\,'(t)|$ (the segment's length, since $t$ runs over $[0,1]$).", answer: `${L}`, accept: [], hint: `$|\\langle ${3 * m}, ${4 * m} \\rangle| = \\sqrt{${9 * m * m} + ${16 * m * m}}$.` },
      { instruction: "Substitute the path into the integrand: write $f(\\vec{r}(t))$ as a polynomial in $t$.", answer: `${A}t`, accept: [`${A}*t`], hint: `$${cf(p)}(${3 * m}t) + ${cf(q)}(${4 * m}t) = ${A}t$.` },
      { instruction: `Compute $\\displaystyle\\int_0^1 (${A}t)(${L})\\, dt$.`, answer: ans, accept: dec ? [dec] : [], hint: `$${A * L}\\left[t^2/2\\right]_0^1$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$ds = ${L}\\,dt$ and the integrand is $${A}t$ on the path, so the integral is $\\int_0^1 ${A * L}t\\, dt = ${ans}$.`,
  };
};

// d3: 3D segment with a Pythagorean-quadruple direction.
fill["c3v-scalar-line-3"] = (rng, idx) => {
  const trip = rng.pick(TRIPLES_3D);
  const v = trip.slice(0, 3), s = trip[3];
  const m = rng.int(1, 2);
  let p = rng.int(0, 3), q = rng.int(0, 3), r = rng.int(0, 3);
  if (p + q + r === 0) p = 1; // integrand must not be identically zero
  const end = v.map((x) => x * m);
  const L = s * m;
  const A = m * (p * v[0] + q * v[1] + r * v[2]); // > 0 since some coeff > 0 and v_i >= 1
  const terms = [];
  if (p) terms.push(`${cf(p)}x`);
  if (q) terms.push(`${cf(q)}y`);
  if (r) terms.push(`${cf(r)}z`);
  const fTxt = terms.join(" + ");
  const ans = frac(A * L, 2);
  const dec = fracDec(A * L, 2);
  return {
    id: `gen.c3v-scalar-line-3.${idx}`, generated: true, concepts: ["scalar-line-integrals"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\displaystyle\\int_C (${fTxt})\\, ds$, where $C$ is the straight segment from $(0,0,0)$ to $(${end.join(", ")})$, parametrized as $\\vec{r}(t) = ${Vt(end.map((x) => `${cf(x)}t`))}$, $0 \\le t \\le 1$.`,
    steps: [
      { instruction: "Compute the speed $|\\vec{r}\\,'(t)|$.", answer: `${L}`, accept: [], hint: `$|${Vt(end)}| = \\sqrt{${end.map((x) => x * x).join(" + ")}} = \\sqrt{${L * L}}$.` },
      { instruction: "Write $f(\\vec{r}(t))$ as a polynomial in $t$.", answer: `${A}t`, accept: [`${A}*t`], hint: "Substitute each component and collect the $t$ terms." },
      { instruction: `Compute $\\displaystyle\\int_0^1 (${A}t)(${L})\\, dt$.`, answer: ans, accept: dec ? [dec] : [], hint: `$${A * L}\\left[t^2/2\\right]_0^1$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `The direction $${Vt(end)}$ has magnitude ${L}, so $ds = ${L}\\,dt$; the integrand on the path is $${A}t$, giving $\\int_0^1 ${A * L}t\\, dt = ${ans}$.`,
  };
};

// --- concept: work-integrals ---------------------------------------------------

// d1: constant force, straight displacement — work is a dot product.
fill["c3v-work-1"] = (rng, idx) => {
  let a = rng.int(-4, 6), b = rng.int(-4, 6);
  if (a === 0 && b === 0) a = 3; // no zero force
  const p = rng.int(1, 5), q = rng.int(-3, 5); // p >= 1: no zero-length displacement
  const W = a * p + b * q;
  return {
    id: `gen.c3v-work-1.${idx}`, generated: true, concepts: ["work-integrals"], difficulty: 1, context: "applied",
    prompt: `A constant force $\\vec{F} = ${Vt([a, b])}$ N pushes an object in a straight line from $(0,0)$ to $(${p}, ${q})$ (meters). Compute the work $W = \\vec{F} \\cdot \\vec{d}$.`,
    steps: [
      { instruction: "Write the displacement vector $\\vec{d}$.", answer: V(p, q), accept: [Pn(p, q)], hint: "End minus start." },
      { instruction: "Compute the work $W = \\vec{F} \\cdot \\vec{d}$.", answer: `${W}`, accept: [], hint: `$(${a})(${p}) + (${b})(${q})$.` },
    ],
    finalAnswer: { value: `${W}`, unit: "joules" },
    solutionNarrative: `For a constant force along a straight path the work integral collapses to a dot product: $W = ${Vt([a, b])} \\cdot ${Vt([p, q])} = ${a * p} + ${b * q} = ${W}$ J.`,
  };
};

// d2: F = <a y, b x> along a segment from the origin — full parametrized workflow.
fill["c3v-work-2"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4); // a + b >= 2: integrand never identically zero
  const p = rng.int(1, 4), q = rng.int(1, 4);
  const coefI = (a + b) * p * q;
  const ans = frac(coefI, 2);
  const dec = fracDec(coefI, 2);
  return {
    id: `gen.c3v-work-2.${idx}`, generated: true, concepts: ["work-integrals"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\displaystyle\\int_C \\vec{F} \\cdot d\\vec{r}$ for $\\vec{F} = \\langle ${cf(a)}y,\\; ${cf(b)}x \\rangle$ along the segment $\\vec{r}(t) = \\langle ${cf(p)}t,\\; ${cf(q)}t \\rangle$, $0 \\le t \\le 1$.`,
    steps: [
      { instruction: "Write the velocity $\\vec{r}\\,'(t)$ as a numeric vector.", answer: V(p, q), accept: [Pn(p, q)], hint: "Differentiate each component." },
      { instruction: "Evaluate the field on the path and dot with the velocity: write $\\vec{F}(\\vec{r}(t)) \\cdot \\vec{r}\\,'(t)$ as a polynomial in $t$.", answer: `${coefI}t`, accept: [`${coefI}*t`], hint: `$\\vec{F}(\\vec{r}(t)) = \\langle ${a * q}t, ${b * p}t \\rangle$; dot with $${Vt([p, q])}$: $${a * q * p}t + ${b * p * q}t$.` },
      { instruction: `Compute $W = \\displaystyle\\int_0^1 ${coefI}t\\, dt$.`, answer: ans, accept: dec ? [dec] : [], hint: `$${coefI}\\left[t^2/2\\right]_0^1$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `On the path $\\vec{F} = \\langle ${a * q}t, ${b * p}t \\rangle$; dotting with $${Vt([p, q])}$ gives $${coefI}t$, so $W = ${ans}$.`,
  };
};

// d3: conservative shortcut — potential endpoints only.
fill["c3v-work-3"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(0, 4);
  // f = a x^2 y + b x  =>  F = <2a x y + b, a x^2>
  const f = (x, y) => a * x * x * y + b * x;
  const x1 = rng.int(0, 2), y1 = rng.int(0, 2);
  let x2 = rng.int(1, 3), y2 = rng.int(1, 3);
  while (x2 === x1 && y2 === y1) x2 += 1;      // endpoints must differ
  let W = f(x2, y2) - f(x1, y1);
  if (W === 0) { y2 += 1; W = f(x2, y2) - f(x1, y1); } // avoid an anticlimactic zero
  const Ptxt = b === 0 ? `${2 * a}xy` : `${2 * a}xy + ${b}`;
  const fStr = b === 0 ? `${cf(a)}x^2y` : `${cf(a)}x^2y + ${b}x`;
  return {
    id: `gen.c3v-work-3.${idx}`, generated: true, concepts: ["work-integrals"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\displaystyle\\int_C \\vec{F} \\cdot d\\vec{r}$ for $\\vec{F} = \\langle ${Ptxt},\\; ${cf(a)}x^2 \\rangle$, where $C$ is ANY path from $(${x1}, ${y1})$ to $(${x2}, ${y2})$ — use the conservative shortcut.`,
    steps: [
      { instruction: `Compute $\\partial P/\\partial y$ for $P = ${Ptxt}$.`, answer: `${2 * a}x`, accept: [`${2 * a}*x`], hint: "The constant term (if any) vanishes." },
      { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${cf(a)}x^2$.`, answer: `${2 * a}x`, accept: [`${2 * a}*x`], hint: `Differentiate $${cf(a)}x^2$.` },
      { instruction: "The field is conservative. Find the potential $f(x,y)$ (constant 0).", answer: fStr, accept: [`${fStr} + c`, b === 0 ? `${cf(a)}x^2*y` : `${b}x + ${cf(a)}x^2y`], hint: `Integrate $P$ in $x$; matching $f_y = ${cf(a)}x^2$ against $Q$ adds nothing.` },
      { instruction: `Apply the fundamental theorem: $W = f(${x2}, ${y2}) - f(${x1}, ${y1})$.`, answer: `${W}`, accept: [], hint: `$${f(x2, y2)} - ${f(x1, y1)}$.` },
    ],
    finalAnswer: { value: `${W}`, unit: "" },
    solutionNarrative: `$P_y = Q_x = ${2 * a}x$, so $\\vec{F} = \\nabla(${fStr})$ and $W = f(${x2},${y2}) - f(${x1},${y1}) = ${f(x2, y2)} - ${f(x1, y1)} = ${W}$ for every path between the endpoints.`,
  };
};

// --- concept: greens-theorem -----------------------------------------------------

// d1: rectangle, constant integrand.
fill["c3v-greens-1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(2, 4);
  const c = rng.int(1, 4);
  let d = rng.int(1, 6);
  if (d === c) d = c + 2; // integrand must be nonzero
  const circ = (d - c) * a * b;
  return {
    id: `gen.c3v-greens-1.${idx}`, generated: true, concepts: ["greens-theorem"], difficulty: 1, context: "abstract",
    prompt: `Use Green's theorem to compute the counterclockwise circulation $\\oint_C \\vec{F} \\cdot d\\vec{r}$ of $\\vec{F} = \\langle ${c}y,\\; ${d}x \\rangle$ around the rectangle $[0,${a}] \\times [0,${b}]$.`,
    steps: [
      { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${d}x$.`, answer: `${d}`, accept: [], hint: `Differentiate $${d}x$.` },
      { instruction: `Compute $\\partial P/\\partial y$ for $P = ${c}y$.`, answer: `${c}`, accept: [], hint: `Differentiate $${c}y$.` },
      { instruction: "Compute the integrand $Q_x - P_y$.", answer: `${d - c}`, accept: [], hint: `$${d} - ${c}$.` },
      { instruction: `The integrand is constant, so circulation $= (${d - c}) \\times \\text{Area}$. Compute it.`, answer: `${circ}`, accept: [], hint: `Area of the rectangle is $${a} \\times ${b} = ${a * b}$.` },
    ],
    finalAnswer: { value: `${circ}`, unit: "" },
    solutionNarrative: `$Q_x - P_y = ${d} - ${c} = ${d - c}$, a constant, so the circulation is $${d - c} \\times ${a * b} = ${circ}$ — one multiplication instead of four edge integrals.`,
  };
};

// d2: triangle, constant integrand.
fill["c3v-greens-2"] = (rng, idx) => {
  const p = 2 * rng.int(1, 3); // even base keeps the area an integer
  const q = rng.int(2, 5);
  const c = rng.int(1, 4);
  let d = rng.int(2, 7);
  if (d === c) d = c + 3;
  const area = (p * q) / 2;
  const circ = (d - c) * area;
  return {
    id: `gen.c3v-greens-2.${idx}`, generated: true, concepts: ["greens-theorem"], difficulty: 2, context: "abstract",
    prompt: `Use Green's theorem to compute the counterclockwise circulation of $\\vec{F} = \\langle ${c}y,\\; ${d}x \\rangle$ around the triangle with vertices $(0,0)$, $(${p},0)$, $(0,${q})$.`,
    steps: [
      { instruction: "Compute the integrand $Q_x - P_y$.", answer: `${d - c}`, accept: [], hint: `$Q_x = ${d}$ and $P_y = ${c}$.` },
      { instruction: "Compute the area of the triangle.", answer: `${area}`, accept: [], hint: `$\\tfrac{1}{2}(${p})(${q})$.` },
      { instruction: "Compute the circulation.", answer: `${circ}`, accept: [], hint: `Constant integrand: $${d - c} \\times ${area}$.` },
    ],
    finalAnswer: { value: `${circ}`, unit: "" },
    solutionNarrative: `$Q_x - P_y = ${d - c}$ everywhere, so the circulation is $${d - c} \\times \\tfrac{1}{2}(${p})(${q}) = ${circ}$.`,
  };
};

// d3: disk, exact multiples of pi.
fill["c3v-greens-3"] = (rng, idx) => {
  const R = rng.int(1, 4), c = rng.int(1, 4);
  // F = <-c y, c x>: Qx - Py = 2c, a nonzero constant by construction.
  const areaPi = R * R, circPi = 2 * c * R * R;
  const circDec = `${Math.round(circPi * Math.PI * 100) / 100}`;
  return {
    id: `gen.c3v-greens-3.${idx}`, generated: true, concepts: ["greens-theorem"], difficulty: 3, context: "abstract",
    prompt: `Use Green's theorem to compute the counterclockwise circulation of $\\vec{F} = \\langle -${c}y,\\; ${c}x \\rangle$ around the circle of radius ${R} centered at the origin. Give exact answers (multiples of $\\pi$).`,
    steps: [
      { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${c}x$.`, answer: `${c}`, accept: [], hint: `Differentiate $${c}x$.` },
      { instruction: `Compute $\\partial P/\\partial y$ for $P = -${c}y$.`, answer: `${-c}`, accept: [], hint: `Differentiate $-${c}y$.` },
      { instruction: "Compute the integrand $Q_x - P_y$.", answer: `${2 * c}`, accept: [], hint: `$${c} - (${-c})$.` },
      { instruction: "Compute the area of the disk (exact, in terms of $\\pi$).", answer: `${areaPi}pi`, accept: [`${areaPi}*pi`], hint: `$\\pi R^2$ with $R = ${R}$.` },
      { instruction: "Compute the circulation (exact, in terms of $\\pi$).", answer: `${circPi}pi`, accept: [`${circPi}*pi`, circDec], hint: `$${2 * c} \\times ${areaPi}\\pi$.` },
    ],
    finalAnswer: { value: `${circPi}pi`, unit: "" },
    solutionNarrative: `$Q_x - P_y = ${c} - (${-c}) = ${2 * c}$, constant, so the circulation is $${2 * c} \\times \\pi(${R})^2 = ${circPi}\\pi \\approx ${circDec}$.`,
  };
};
