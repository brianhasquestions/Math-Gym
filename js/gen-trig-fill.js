// gen-trig-fill.js
// Parametric generators for the Trigonometry subject (radians-and-unit-circle,
// sine-cosine-graphs, trig-identities), one generator per concept per
// difficulty tier so the adaptive engine always has fresh problems at every
// level. Self-contained: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's `generators` map (same pattern
// as js/gen-de-fill.js and js/gen-linalg-fill.js).
//
// Answer-format rules honored throughout (grader facts):
// - pi/sqrt expressions ("5pi/6", "-sqrt(3)/2", "3500pi/3") grade numerically.
// - sin/cos/tan are NEVER answers; every step resolves to a value.
// - Non-numeric answers (quadrants, signs, model equations) are exact strings
//   with accept lists of common typed variants.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const piFrac = (n, d) => { if (n === 0) return "0"; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; n /= g; d /= g; const top = n === 1 ? "pi" : n === -1 ? "-pi" : `${n}pi`; return d === 1 ? top : `${top}/${d}`; };
const radTex = (n, d) => { const neg = n < 0 ? "-" : ""; n = Math.abs(n); const g = gcd(n, d) || 1; n /= g; d /= g; const top = n === 1 ? "\\pi" : `${n}\\pi`; return d === 1 ? `${neg}${top}` : `${neg}\\frac{${top}}{${d}}`; };
const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);

// Exact string for k*sqrt(s)/2 (unit-circle coordinate); k in {0,±1,±2}, s in {1,2,3}.
const half = (k, s) => (k === 0 ? "0" : s === 1 ? frac(k, 2) : `${k < 0 ? "-" : ""}sqrt(${s})/2`);
const halfTex = (k, s) => (k === 0 ? "0" : s === 1 ? (Math.abs(k) === 2 ? `${k / 2}` : `${k < 0 ? "-" : ""}\\frac{1}{2}`) : `${k < 0 ? "-" : ""}\\frac{\\sqrt{${s}}}{2}`);
// Exact string for r * k*sqrt(s)/2 with r even (scaled coordinate).
const scaled = (r, k, s) => { const c = (r * k) / 2; if (c === 0) return "0"; if (s === 1) return `${c}`; if (c === 1) return `sqrt(${s})`; if (c === -1) return `-sqrt(${s})`; return `${c}sqrt(${s})`; };

const QUAD_ACCEPT = {
  I: ["1", "one", "quadrant 1", "quadrant i", "q1"],
  II: ["2", "two", "quadrant 2", "quadrant ii", "q2"],
  III: ["3", "three", "quadrant 3", "quadrant iii", "q3"],
  IV: ["4", "four", "quadrant 4", "quadrant iv", "q4"],
};
const quadStep = (q, hint) => ({ instruction: "Which quadrant is the angle in? (Type a Roman numeral like II.)", answer: q, accept: QUAD_ACCEPT[q], hint });

// Special (non-axis) unit-circle angles. cos/sin stored as [k, s] meaning k*sqrt(s)/2.
const SA = [
  { deg: 30, n: 1, d: 6, quad: "I", ref: 30, cos: [1, 3], sin: [1, 1] },
  { deg: 45, n: 1, d: 4, quad: "I", ref: 45, cos: [1, 2], sin: [1, 2] },
  { deg: 60, n: 1, d: 3, quad: "I", ref: 60, cos: [1, 1], sin: [1, 3] },
  { deg: 120, n: 2, d: 3, quad: "II", ref: 60, cos: [-1, 1], sin: [1, 3] },
  { deg: 135, n: 3, d: 4, quad: "II", ref: 45, cos: [-1, 2], sin: [1, 2] },
  { deg: 150, n: 5, d: 6, quad: "II", ref: 30, cos: [-1, 3], sin: [1, 1] },
  { deg: 210, n: 7, d: 6, quad: "III", ref: 30, cos: [-1, 3], sin: [-1, 1] },
  { deg: 225, n: 5, d: 4, quad: "III", ref: 45, cos: [-1, 2], sin: [-1, 2] },
  { deg: 240, n: 4, d: 3, quad: "III", ref: 60, cos: [-1, 1], sin: [-1, 3] },
  { deg: 300, n: 5, d: 3, quad: "IV", ref: 60, cos: [1, 1], sin: [-1, 3] },
  { deg: 315, n: 7, d: 4, quad: "IV", ref: 45, cos: [1, 2], sin: [-1, 2] },
  { deg: 330, n: 11, d: 6, quad: "IV", ref: 30, cos: [1, 3], sin: [-1, 1] },
];
const NONQ1 = SA.slice(3);
const TAN_BASE = { 30: "sqrt(3)/3", 45: "1", 60: "sqrt(3)" };
const TAN_BASE_TEX = { 30: "\\frac{\\sqrt{3}}{3}", 45: "1", 60: "\\sqrt{3}" };
const REF_RAD = { 30: "pi/6", 45: "pi/4", 60: "pi/3" };

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

export const fill = {};

// ============================================================================
// trigonometry.radians-and-unit-circle
// ============================================================================

// degrees-to-radians: d1 (deg -> rad)
fill["trg-deg2rad-d1"] = (rng, idx) => {
  const pairs = [[30, 1, 6], [45, 1, 4], [60, 1, 3], [90, 1, 2], [120, 2, 3], [150, 5, 6], [180, 1, 1]];
  const [deg, n, d] = rng.pick(pairs);
  const rad = piFrac(n, d);
  return {
    id: `gen.trg-deg2rad-d1.${idx}`, generated: true, concepts: ["degrees-to-radians"], difficulty: 1, context: "abstract",
    prompt: `Convert $${deg}^\\circ$ to radians. Give an exact answer in terms of $\\pi$.`,
    steps: [
      { instruction: "What do you multiply a degree measure by to convert it to radians?", answer: "pi/180", accept: ["π/180"], hint: "$180^\\circ = \\pi$ radians." },
      { instruction: `Compute $${deg} \\cdot \\frac{\\pi}{180}$ and reduce. (Exact.)`, answer: rad, accept: [`${deg}pi/180`], hint: `Reduce the fraction $\\frac{${deg}}{180}$.` },
    ],
    finalAnswer: { value: rad, unit: "radians" },
    solutionNarrative: `$${deg} \\cdot \\frac{\\pi}{180} = ${radTex(n, d)}$.`,
  };
};

// degrees-to-radians: d2 (rad -> deg)
fill["trg-rad2deg-d2"] = (rng, idx) => {
  const pairs = [[1, 6, 30], [1, 4, 45], [3, 4, 135], [5, 6, 150], [7, 6, 210], [4, 3, 240], [3, 2, 270], [5, 3, 300], [11, 6, 330]];
  const [n, d, deg] = rng.pick(pairs);
  return {
    id: `gen.trg-rad2deg-d2.${idx}`, generated: true, concepts: ["degrees-to-radians"], difficulty: 2, context: "abstract",
    prompt: `Convert $${radTex(n, d)}$ radians to degrees.`,
    steps: [
      { instruction: "What do you multiply a radian measure by to convert it to degrees?", answer: "180/pi", accept: ["180/π"], hint: "The reciprocal of $\\frac{\\pi}{180}$." },
      { instruction: `Compute $${radTex(n, d)} \\cdot \\frac{180}{\\pi}$ (degrees).`, answer: `${deg}`, accept: [], hint: `The $\\pi$'s cancel: $\\frac{${n} \\cdot 180}{${d}}$.` },
    ],
    finalAnswer: { value: `${deg}`, unit: "degrees" },
    solutionNarrative: `$${radTex(n, d)} \\cdot \\frac{180}{\\pi} = ${deg}^\\circ$.`,
  };
};

// degrees-to-radians: d3 (coterminal angles)
fill["trg-coterminal-d3"] = (rng, idx) => {
  const opts = [
    { gn: 13, gd: 6, n: 1, d: 6, deg: 30, dir: "subtract" },
    { gn: 9, gd: 4, n: 1, d: 4, deg: 45, dir: "subtract" },
    { gn: 8, gd: 3, n: 2, d: 3, deg: 120, dir: "subtract" },
    { gn: 7, gd: 2, n: 3, d: 2, deg: 270, dir: "subtract" },
    { gn: -1, gd: 3, n: 5, d: 3, deg: 300, dir: "add" },
    { gn: -1, gd: 4, n: 7, d: 4, deg: 315, dir: "add" },
    { gn: -5, gd: 6, n: 7, d: 6, deg: 210, dir: "add" },
  ];
  const o = rng.pick(opts);
  const cot = piFrac(o.n, o.d);
  return {
    id: `gen.trg-coterminal-d3.${idx}`, generated: true, concepts: ["degrees-to-radians"], difficulty: 3, context: "abstract",
    prompt: `Find the angle in $[0, 2\\pi)$ that is coterminal with $${radTex(o.gn, o.gd)}$, then convert it to degrees.`,
    steps: [
      { instruction: `${o.dir === "subtract" ? "Subtract" : "Add"} $2\\pi$ to land in $[0, 2\\pi)$. What is the coterminal angle? (Exact.)`, answer: cot, accept: [], hint: `$2\\pi = ${radTex(2 * o.gd, o.gd)}$ with denominator ${o.gd}.` },
      { instruction: "Convert that angle to degrees.", answer: `${o.deg}`, accept: [], hint: "Multiply by $\\frac{180}{\\pi}$." },
    ],
    finalAnswer: { value: cot, unit: `radians (= ${o.deg} degrees)` },
    solutionNarrative: `${o.dir === "subtract" ? "Subtracting" : "Adding"} one full turn ($2\\pi$) gives $${radTex(o.n, o.d)} = ${o.deg}^\\circ$.`,
  };
};

// unit-circle-coordinates: d1 (first quadrant)
fill["trg-unit-coords-d1"] = (rng, idx) => {
  const a = rng.pick(SA.slice(0, 3));
  return {
    id: `gen.trg-unit-coords-d1.${idx}`, generated: true, concepts: ["unit-circle-coordinates"], difficulty: 1, context: "abstract",
    prompt: `Find the exact coordinates of the point on the unit circle at angle $\\theta = ${radTex(a.n, a.d)}$ (that is, $${a.deg}^\\circ$).`,
    steps: [
      { instruction: `What is the $x$-coordinate, $\\cos ${radTex(a.n, a.d)}$? (Exact.)`, answer: half(...a.cos), accept: [], hint: "Cosine is the $x$-coordinate; use the special right triangles." },
      { instruction: `What is the $y$-coordinate, $\\sin ${radTex(a.n, a.d)}$? (Exact.)`, answer: half(...a.sin), accept: [], hint: "Sine is the $y$-coordinate." },
    ],
    finalAnswer: { value: `(${half(...a.cos)}, ${half(...a.sin)})`, unit: "" },
    solutionNarrative: `At $${a.deg}^\\circ$ the unit-circle point is $\\left(${halfTex(...a.cos)}, ${halfTex(...a.sin)}\\right)$.`,
  };
};

// unit-circle-coordinates: d2 (other quadrants)
fill["trg-unit-coords-d2"] = (rng, idx) => {
  const a = rng.pick(NONQ1);
  return {
    id: `gen.trg-unit-coords-d2.${idx}`, generated: true, concepts: ["unit-circle-coordinates"], difficulty: 2, context: "abstract",
    prompt: `Find the exact coordinates of the point on the unit circle at angle $\\theta = ${radTex(a.n, a.d)}$.`,
    steps: [
      quadStep(a.quad, `$${radTex(a.n, a.d)} = ${a.deg}^\\circ$.`),
      { instruction: `What is $\\cos ${radTex(a.n, a.d)}$ (the $x$-coordinate)? Exact.`, answer: half(...a.cos), accept: [], hint: `Reference angle $${a.ref}^\\circ$; cosine is ${a.cos[0] > 0 ? "positive" : "negative"} in Q${a.quad}.` },
      { instruction: `What is $\\sin ${radTex(a.n, a.d)}$ (the $y$-coordinate)? Exact.`, answer: half(...a.sin), accept: [], hint: `Sine is ${a.sin[0] > 0 ? "positive" : "negative"} in Q${a.quad}.` },
    ],
    finalAnswer: { value: `(${half(...a.cos)}, ${half(...a.sin)})`, unit: "" },
    solutionNarrative: `$${radTex(a.n, a.d)}$ lies in Q${a.quad} with reference angle $${a.ref}^\\circ$: the point is $\\left(${halfTex(...a.cos)}, ${halfTex(...a.sin)}\\right)$.`,
  };
};

// unit-circle-coordinates: d3 (applied, scaled circle)
fill["trg-unit-coords-d3"] = (rng, idx) => {
  const a = rng.pick(NONQ1);
  const r = rng.pick([2, 4, 6, 8, 10]);
  const ctx = rng.pick([
    ["A drone circles a beacon", "the beacon"],
    ["A robot arm's tip sweeps around its base", "the base"],
    ["A carousel horse rides a platform centered on", "the center pole"],
  ]);
  const x = scaled(r, ...a.cos), y = scaled(r, ...a.sin);
  return {
    id: `gen.trg-unit-coords-d3.${idx}`, generated: true, concepts: ["unit-circle-coordinates"], difficulty: 3, context: "applied",
    prompt: `${ctx[0]} at a radius of ${r} m, so its position is $(${r}\\cos\\theta, ${r}\\sin\\theta)$ with ${ctx[1]} at the origin. Find its exact coordinates when $\\theta = ${radTex(a.n, a.d)}$.`,
    steps: [
      { instruction: `What is $\\cos ${radTex(a.n, a.d)}$? Exact.`, answer: half(...a.cos), accept: [], hint: `Q${a.quad}, reference angle $${a.ref}^\\circ$.` },
      { instruction: `So what is the $x$-coordinate, $${r}\\cos ${radTex(a.n, a.d)}$? Exact.`, answer: x, accept: [], hint: `Multiply your previous value by ${r}.` },
      { instruction: `What is $\\sin ${radTex(a.n, a.d)}$? Exact.`, answer: half(...a.sin), accept: [], hint: `Sine is ${a.sin[0] > 0 ? "positive" : "negative"} in Q${a.quad}.` },
      { instruction: `So what is the $y$-coordinate, $${r}\\sin ${radTex(a.n, a.d)}$? Exact.`, answer: y, accept: [], hint: `Multiply by ${r}.` },
    ],
    finalAnswer: { value: `(${x}, ${y})`, unit: "meters" },
    solutionNarrative: `Scaling the unit-circle point $\\left(${halfTex(...a.cos)}, ${halfTex(...a.sin)}\\right)$ by the radius ${r} gives $(${x}, ${y})$.`,
  };
};

// reference-angles-signs: d1 (quadrant + reference angle, degrees)
fill["trg-ref-quad-d1"] = (rng, idx) => {
  const a = rng.pick(NONQ1);
  const rule = { II: "180 - \\theta", III: "\\theta - 180", IV: "360 - \\theta" }[a.quad];
  return {
    id: `gen.trg-ref-quad-d1.${idx}`, generated: true, concepts: ["reference-angles-signs"], difficulty: 1, context: "abstract",
    prompt: `Consider the angle $${a.deg}^\\circ$.`,
    steps: [
      quadStep(a.quad, `Compare ${a.deg} with 90, 180, 270, 360.`),
      { instruction: "What is its reference angle, in degrees?", answer: `${a.ref}`, accept: [], hint: `In Q${a.quad} the reference angle is $${rule}$ (in degrees).` },
    ],
    finalAnswer: { value: `quadrant ${a.quad}, reference angle ${a.ref}`, unit: "degrees" },
    solutionNarrative: `$${a.deg}^\\circ$ lies in Q${a.quad}; its reference angle (acute angle to the $x$-axis) is $${a.ref}^\\circ$.`,
  };
};

// reference-angles-signs: d2 (sign + value, degrees)
fill["trg-ref-signs-d2"] = (rng, idx) => {
  const a = rng.pick(NONQ1);
  const which = rng.pick(["sine", "cosine"]);
  const pair = which === "sine" ? a.sin : a.cos;
  const sign = pair[0] > 0 ? "positive" : "negative";
  const fnTex = which === "sine" ? "\\sin" : "\\cos";
  return {
    id: `gen.trg-ref-signs-d2.${idx}`, generated: true, concepts: ["reference-angles-signs"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${fnTex} ${a.deg}^\\circ$ exactly using a reference angle.`,
    steps: [
      quadStep(a.quad, `Compare ${a.deg} with 90, 180, 270, 360.`),
      { instruction: `Is ${which} positive or negative there? (Type positive or negative.)`, answer: sign, accept: sign === "positive" ? ["+", "pos"] : ["-", "neg"], hint: "All Students Take Calculus: QI all, QII sine, QIII tangent, QIV cosine stay positive." },
      { instruction: `The reference angle is $${a.ref}^\\circ$. So what is $${fnTex} ${a.deg}^\\circ$? Exact.`, answer: half(...pair), accept: [], hint: `Take $${fnTex} ${a.ref}^\\circ$ and attach the sign you found.` },
    ],
    finalAnswer: { value: half(...pair), unit: "" },
    solutionNarrative: `$${a.deg}^\\circ$ is in Q${a.quad} (where ${which} is ${sign}) with reference angle $${a.ref}^\\circ$, so $${fnTex} ${a.deg}^\\circ = ${halfTex(...pair)}$.`,
  };
};

// reference-angles-signs: d3 (radians, includes tangent)
fill["trg-ref-eval-d3"] = (rng, idx) => {
  const a = rng.pick(NONQ1);
  const which = rng.pick(["sin", "cos", "tan"]);
  let val, sign;
  if (which === "tan") {
    const pos = a.quad === "III"; // among non-QI quadrants, tan > 0 only in QIII
    sign = pos ? "positive" : "negative";
    val = (pos ? "" : "-") + TAN_BASE[a.ref];
  } else {
    const pair = which === "sin" ? a.sin : a.cos;
    sign = pair[0] > 0 ? "positive" : "negative";
    val = half(...pair);
  }
  const fnTex = `\\${which}`;
  return {
    id: `gen.trg-ref-eval-d3.${idx}`, generated: true, concepts: ["reference-angles-signs"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $${fnTex} ${radTex(a.n, a.d)}$ exactly using a reference angle.`,
    steps: [
      quadStep(a.quad, `$${radTex(a.n, a.d)} = ${a.deg}^\\circ$.`),
      { instruction: "What is the reference angle, in radians? (Exact.)", answer: REF_RAD[a.ref], accept: [`${a.ref}pi/180`], hint: `The acute angle between the terminal side and the $x$-axis is $${a.ref}^\\circ$ — convert it.` },
      { instruction: `Is ${which === "sin" ? "sine" : which === "cos" ? "cosine" : "tangent"} positive or negative in that quadrant?`, answer: sign, accept: sign === "positive" ? ["+", "pos"] : ["-", "neg"], hint: "All Students Take Calculus." },
      { instruction: `So what is $${fnTex} ${radTex(a.n, a.d)}$? Exact.`, answer: val, accept: [], hint: `${which === "tan" ? `$\\tan ${a.ref}^\\circ = ${TAN_BASE_TEX[a.ref]}$` : "Use the reference angle's value"}, with the sign you found.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$${radTex(a.n, a.d)}$ is in Q${a.quad} with reference angle $${REF_RAD[a.ref].replace("pi", "\\pi")}$; applying the Q${a.quad} sign gives $${fnTex} ${radTex(a.n, a.d)} = ${val.replace("sqrt(3)/3", "\\frac{\\sqrt{3}}{3}").replace("sqrt(3)", "\\sqrt{3}").replace("sqrt(2)/2", "\\frac{\\sqrt{2}}{2}")}$.`,
  };
};

// arc-length-angular-velocity: d1 (s = r*theta)
fill["trg-arc-d1"] = (rng, idx) => {
  const r = rng.int(2, 12);
  const [n, d] = rng.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]]);
  const ctx = rng.pick(["A pendulum", "A windshield wiper blade tip", "A swinging gate's outer edge"]);
  const s = piFrac(r * n, d);
  const dec = ((r * n * Math.PI) / d).toFixed(1);
  return {
    id: `gen.trg-arc-d1.${idx}`, generated: true, concepts: ["arc-length-angular-velocity"], difficulty: 1, context: "applied",
    prompt: `${ctx} sweeps through an angle of $${radTex(n, d)}$ radians at a radius of ${r} ft. How far does the tip travel?`,
    steps: [
      { instruction: "Apply $s = r\\theta$. What is the exact arc length (in terms of $\\pi$)?", answer: s, accept: [`${r * n}pi/${d}`], hint: `$s = ${r} \\cdot ${radTex(n, d)}$.` },
      { instruction: "Round the arc length to 1 decimal place (ft).", answer: dec, accept: [], hint: `Multiply out with $\\pi \\approx 3.1416$.` },
    ],
    finalAnswer: { value: s, unit: `ft (about ${dec})` },
    solutionNarrative: `$s = r\\theta = ${r} \\cdot ${radTex(n, d)} = ${radTex(r * n, d)} \\approx ${dec}$ ft.`,
  };
};

// arc-length-angular-velocity: d2 (rpm -> rad/s)
fill["trg-arc-d2"] = (rng, idx) => {
  const rpm = rng.pick([15, 30, 45, 60, 90, 120, 150]);
  const ctx = rng.pick(["turntable", "ceiling fan", "potter's wheel", "exercise-bike flywheel"]);
  const w = piFrac(rpm, 30);
  return {
    id: `gen.trg-arc-d2.${idx}`, generated: true, concepts: ["arc-length-angular-velocity"], difficulty: 2, context: "applied",
    prompt: `A ${ctx} spins at ${rpm} revolutions per minute. Find its angular velocity in radians per second (exact).`,
    steps: [
      { instruction: "How many radians is one revolution? (Exact.)", answer: "2pi", accept: ["2π"], hint: "One full turn of the circle." },
      { instruction: `Convert: $\\omega = ${rpm} \\cdot \\frac{2\\pi}{60}$ rad/s. Simplify. (Exact.)`, answer: w, accept: [`${rpm}pi/30`, `${2 * rpm}pi/60`], hint: `$\\frac{${rpm} \\cdot 2}{60}$ reduces — then attach $\\pi$.` },
    ],
    finalAnswer: { value: w, unit: "rad/s" },
    solutionNarrative: `${rpm} rpm is $${rpm} \\cdot \\frac{2\\pi}{60} = ${radTex(rpm, 30)}$ rad/s.`,
  };
};

// arc-length-angular-velocity: d3 (orbital linear speed)
fill["trg-arc-d3"] = (rng, idx) => {
  const r = rng.pick([6000, 7000, 8000, 9000]);
  const [deg, n, d] = rng.pick([[30, 1, 6], [45, 1, 4], [60, 1, 3], [90, 1, 2]]);
  const v = piFrac(r * n, d);
  const dec = ((r * n * Math.PI) / d).toFixed(1);
  return {
    id: `gen.trg-arc-d3.${idx}`, generated: true, concepts: ["arc-length-angular-velocity"], difficulty: 3, context: "applied",
    prompt: `A satellite orbits ${r} km from Earth's center, sweeping through $${deg}^\\circ$ of its orbit every hour. Find its speed along the orbit.`,
    steps: [
      { instruction: `Convert $${deg}^\\circ$ to radians. (Exact.)`, answer: piFrac(n, d), accept: [`${deg}pi/180`], hint: "Multiply by $\\frac{\\pi}{180}$ and reduce." },
      { instruction: "Apply $v = r\\theta$ per hour: what is the exact speed in km/h (in terms of $\\pi$)?", answer: v, accept: [`${r * n}pi/${d}`], hint: `$${r} \\cdot ${radTex(n, d)}$.` },
      { instruction: "Round the speed to 1 decimal place (km/h).", answer: dec, accept: [], hint: "Multiply out with $\\pi \\approx 3.14159$." },
    ],
    finalAnswer: { value: v, unit: `km/h (about ${dec})` },
    solutionNarrative: `$${deg}^\\circ = ${radTex(n, d)}$ radians, so the arc covered per hour is $v = ${r} \\cdot ${radTex(n, d)} = ${radTex(r * n, d)} \\approx ${dec}$ km/h.`,
  };
};

// ============================================================================
// trigonometry.sine-cosine-graphs
// ============================================================================

// amplitude-midline: d1 (read off the equation)
fill["trg-amp-mid-d1"] = (rng, idx) => {
  const A = rng.int(2, 9), B = rng.int(1, 4);
  let D = rng.int(-6, 9); if (D === 0) D = 3;
  const fn = rng.pick(["sin", "cos"]);
  const eq = `y = ${A}\\${fn}(${B === 1 ? "x" : `${B}x`}) ${signed(D)}`;
  return {
    id: `gen.trg-amp-mid-d1.${idx}`, generated: true, concepts: ["amplitude-midline"], difficulty: 1, context: "abstract",
    prompt: `Consider $${eq}$.`,
    steps: [
      { instruction: "What is the amplitude?", answer: `${A}`, accept: [], hint: "The coefficient in front of the trig function." },
      { instruction: "What is the midline value $D$?", answer: `${D}`, accept: [`y=${D}`, `y = ${D}`], hint: "The constant added at the end." },
    ],
    finalAnswer: { value: `amplitude ${A}, midline y = ${D}`, unit: "" },
    solutionNarrative: `In $y = A\\${fn}(Bx) + D$: amplitude $|A| = ${A}$, midline $y = ${D}$.`,
  };
};

// amplitude-midline: d2 (from max/min)
fill["trg-amp-mid-d2"] = (rng, idx) => {
  const A = rng.int(2, 8), D = rng.int(-3, 9);
  const M = D + A, m = D - A;
  const ctx = rng.pick(["A buoy's height above the seabed", "A city's daily temperature", "The water depth at a pier", "A vibrating spring's length"]);
  return {
    id: `gen.trg-amp-mid-d2.${idx}`, generated: true, concepts: ["amplitude-midline"], difficulty: 2, context: "applied",
    prompt: `${ctx} oscillates sinusoidally between a minimum of ${m} and a maximum of ${M}. Find the amplitude and midline of the model.`,
    steps: [
      { instruction: "Amplitude $= \\frac{\\max - \\min}{2}$. Compute it.", answer: `${A}`, accept: [], hint: `$\\frac{${M} - (${m})}{2}$.` },
      { instruction: "Midline $= \\frac{\\max + \\min}{2}$. Compute it.", answer: `${D}`, accept: [], hint: `$\\frac{${M} + (${m})}{2}$.` },
    ],
    finalAnswer: { value: `amplitude ${A}, midline ${D}`, unit: "" },
    solutionNarrative: `Amplitude $\\frac{${M} - (${m})}{2} = ${A}$; midline $\\frac{${M} + (${m})}{2} = ${D}$.`,
  };
};

// amplitude-midline: d3 (negative coefficient; max/min/start)
fill["trg-amp-mid-d3"] = (rng, idx) => {
  const A = rng.int(2, 7), D = rng.int(1, 6), B = rng.int(1, 3);
  const eq = `y = -${A}\\cos(${B === 1 ? "x" : `${B}x`}) + ${D}`;
  return {
    id: `gen.trg-amp-mid-d3.${idx}`, generated: true, concepts: ["amplitude-midline"], difficulty: 3, context: "abstract",
    prompt: `Consider $${eq}$. Note the negative coefficient.`,
    steps: [
      { instruction: "What is the amplitude? (Amplitude is always positive.)", answer: `${A}`, accept: [], hint: `Amplitude is $|-${A}|$.` },
      { instruction: "What is the maximum value of $y$?", answer: `${D + A}`, accept: [], hint: `Max $= D + |A| = ${D} + ${A}$.` },
      { instruction: "What is the minimum value of $y$?", answer: `${D - A}`, accept: [], hint: `Min $= D - |A| = ${D} - ${A}$.` },
      { instruction: "At $x = 0$, is the graph at its maximum or minimum? (Type max or min.)", answer: "min", accept: ["minimum", "its minimum"], hint: `$y(0) = -${A}\\cos 0 + ${D} = ${D - A}$ — compare with your extremes.` },
    ],
    finalAnswer: { value: `amplitude ${A}, max ${D + A}, min ${D - A}, starts at min`, unit: "" },
    solutionNarrative: `Amplitude $${A}$, so the wave runs from $${D - A}$ to $${D + A}$; the negative cosine starts at its minimum, $y(0) = ${D - A}$.`,
  };
};

// period-frequency: d1 (period from B)
fill["trg-period-d1"] = (rng, idx) => {
  const B = rng.pick([2, 3, 4, 6, 8]);
  const fn = rng.pick(["sin", "cos"]);
  const T = piFrac(2, B);
  return {
    id: `gen.trg-period-d1.${idx}`, generated: true, concepts: ["period-frequency"], difficulty: 1, context: "abstract",
    prompt: `Find the period of $y = \\${fn}(${B}x)$. Give an exact answer in terms of $\\pi$.`,
    steps: [
      { instruction: "Apply $T = \\frac{2\\pi}{B}$. (Exact.)", answer: T, accept: [`2pi/${B}`], hint: `$B = ${B}$.` },
    ],
    finalAnswer: { value: T, unit: "" },
    solutionNarrative: `$T = \\frac{2\\pi}{${B}} = ${radTex(2, B)}$.`,
  };
};

// period-frequency: d2 (B from period)
fill["trg-period-d2"] = (rng, idx) => {
  const opts = [
    { tex: "\\pi", B: "2" }, { tex: "\\frac{\\pi}{2}", B: "4" }, { tex: "\\frac{\\pi}{3}", B: "6" },
    { tex: "\\frac{2\\pi}{3}", B: "3" }, { tex: "4\\pi", B: "1/2" }, { tex: "6\\pi", B: "1/3" }, { tex: "\\frac{\\pi}{4}", B: "8" },
  ];
  const o = rng.pick(opts);
  return {
    id: `gen.trg-period-d2.${idx}`, generated: true, concepts: ["period-frequency"], difficulty: 2, context: "abstract",
    prompt: `A sinusoid $y = \\sin(Bx)$ must have period $${o.tex}$. Find $B$.`,
    steps: [
      { instruction: `Solve $\\frac{2\\pi}{B} = ${o.tex}$ for $B$.`, answer: o.B, accept: [], hint: `$B = \\frac{2\\pi}{T} = 2\\pi \\div ${o.tex}$.` },
    ],
    finalAnswer: { value: o.B, unit: "" },
    solutionNarrative: `$B = \\frac{2\\pi}{T} = ${o.B}$.`,
  };
};

// period-frequency: d3 (AC/sound frequency)
fill["trg-period-d3"] = (rng, idx) => {
  const f = rng.pick([50, 60, 220, 440]);
  const A = rng.pick([120, 170, 230, 311]);
  const ctx = f <= 60 ? "An AC voltage" : "A speaker cone driven by a tone";
  return {
    id: `gen.trg-period-d3.${idx}`, generated: true, concepts: ["period-frequency"], difficulty: 3, context: "applied",
    prompt: `${ctx} follows $y = ${A}\\sin(${2 * f}\\pi t)$, with $t$ in seconds.`,
    steps: [
      { instruction: "What is $B$? (Exact, in terms of $\\pi$.)", answer: `${2 * f}pi`, accept: [`${2 * f}π`], hint: "The coefficient of $t$ inside the sine." },
      { instruction: "Find the period $T = \\frac{2\\pi}{B}$ as an exact fraction of a second.", answer: `1/${f}`, accept: [], hint: `$\\frac{2\\pi}{${2 * f}\\pi}$ — the $\\pi$'s cancel.` },
      { instruction: "Find the frequency $f = \\frac{1}{T}$ in hertz.", answer: `${f}`, accept: [`${f} hz`], hint: "The reciprocal of the period." },
    ],
    finalAnswer: { value: `${f}`, unit: `Hz (period 1/${f} s)` },
    solutionNarrative: `$B = ${2 * f}\\pi$ gives $T = \\frac{2\\pi}{${2 * f}\\pi} = \\frac{1}{${f}}$ s, so $f = ${f}$ Hz.`,
  };
};

// evaluate-sinusoid: d1 (axis angles)
fill["trg-eval-d1"] = (rng, idx) => {
  const A = rng.int(2, 9), D = rng.int(1, 9);
  const o = rng.pick([{ tex: "\\frac{\\pi}{2}", s: 1 }, { tex: "\\pi", s: 0 }, { tex: "\\frac{3\\pi}{2}", s: -1 }]);
  const y = A * o.s + D;
  return {
    id: `gen.trg-eval-d1.${idx}`, generated: true, concepts: ["evaluate-sinusoid"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $y = ${A}\\sin(x) + ${D}$ at $x = ${o.tex}$.`,
    steps: [
      { instruction: `What is $\\sin ${o.tex}$?`, answer: `${o.s}`, accept: [], hint: "Sine is the $y$-coordinate of the unit-circle point on the axis." },
      { instruction: `Compute $y = ${A}(${o.s}) + ${D}$.`, answer: `${y}`, accept: [], hint: `Multiply by ${A}, then add ${D}.` },
    ],
    finalAnswer: { value: `${y}`, unit: "" },
    solutionNarrative: `$\\sin ${o.tex} = ${o.s}$, so $y = ${A} \\cdot ${o.s} + ${D} = ${y}$.`,
  };
};

// evaluate-sinusoid: d2 (inner angle first)
fill["trg-eval-d2"] = (rng, idx) => {
  const A = rng.pick([2, 4, 6, 8]);
  let D = rng.int(-5, 9); if (D === 0) D = -1;
  const o = rng.pick([
    { B: 2, xTex: "\\frac{\\pi}{6}", inn: [1, 3], c: 1 },
    { B: 2, xTex: "\\frac{\\pi}{3}", inn: [2, 3], c: -1 },
    { B: 3, xTex: "\\frac{\\pi}{3}", inn: [1, 1], c: -2 },
    { B: 4, xTex: "\\frac{\\pi}{6}", inn: [2, 3], c: -1 },
    { B: 2, xTex: "\\frac{\\pi}{2}", inn: [1, 1], c: -2 },
  ]);
  const inner = piFrac(...o.inn);
  const cosVal = frac(o.c, 2);
  const y = (A * o.c) / 2 + D;
  return {
    id: `gen.trg-eval-d2.${idx}`, generated: true, concepts: ["evaluate-sinusoid"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $y = ${A}\\cos(${o.B}x) ${signed(D)}$ at $x = ${o.xTex}$.`,
    steps: [
      { instruction: `Compute the inner angle $${o.B}x$ at $x = ${o.xTex}$. (Exact.)`, answer: inner, accept: [], hint: `Multiply $${o.B} \\cdot ${o.xTex}$ and reduce.` },
      { instruction: "Evaluate the cosine of that angle. (Exact.)", answer: cosVal, accept: [], hint: "Use the unit circle (mind the quadrant sign)." },
      { instruction: `Compute $y = ${A} \\cdot (${cosVal}) ${signed(D)}$.`, answer: `${y}`, accept: [], hint: `Scale by ${A}, then shift by ${D}.` },
    ],
    finalAnswer: { value: `${y}`, unit: "" },
    solutionNarrative: `Inside-out: inner angle $${radTex(...o.inn)}$, cosine $${cosVal}$, then $${A} \\cdot ${cosVal} ${signed(D)} = ${y}$.`,
  };
};

// evaluate-sinusoid: d3 (applied model at a time)
fill["trg-eval-d3"] = (rng, idx) => {
  const A = rng.pick([2, 4, 6]), D = rng.int(8, 15);
  const o = rng.pick([
    { t: 1, inn: [1, 6], num: 1, den: 2 },
    { t: 3, inn: [1, 2], num: 1, den: 1 },
    { t: 9, inn: [3, 2], num: -1, den: 1 },
  ]);
  const ctx = rng.pick([
    ["The water depth at a dock", "m", "hours after midnight"],
    ["A bay's tide height", "m", "hours after 6 AM"],
    ["The temperature in a greenhouse", "°C", "hours after sunrise"],
  ]);
  const sinVal = frac(o.num, o.den);
  const h = (A * o.num) / o.den + D;
  const hStr = Number.isInteger(h) ? `${h}` : h.toFixed(1);
  return {
    id: `gen.trg-eval-d3.${idx}`, generated: true, concepts: ["evaluate-sinusoid"], difficulty: 3, context: "applied",
    prompt: `${ctx[0]} follows $h(t) = ${A}\\sin\\left(\\frac{\\pi}{6}t\\right) + ${D}$ (${ctx[1]}), with $t$ in ${ctx[2]}. Find the value at $t = ${o.t}$.`,
    steps: [
      { instruction: `Compute the inner angle $\\frac{\\pi}{6} \\cdot ${o.t}$. (Exact.)`, answer: piFrac(...o.inn), accept: [`${o.t}pi/6`], hint: "Multiply and reduce the fraction." },
      { instruction: "Evaluate the sine of that angle. (Exact.)", answer: sinVal, accept: [], hint: "A unit-circle special angle." },
      { instruction: `Compute $h = ${A} \\cdot (${sinVal}) + ${D}$.`, answer: hStr, accept: [], hint: `Scale by ${A}, then add ${D}.` },
    ],
    finalAnswer: { value: hStr, unit: ctx[1] },
    solutionNarrative: `At $t = ${o.t}$ the inner angle is $${radTex(...o.inn)}$, whose sine is $${sinVal}$; so $h = ${A} \\cdot ${sinVal} + ${D} = ${hStr}$.`,
  };
};

// model-real-oscillation: d1 (A, D given directly)
fill["trg-model-d1"] = (rng, idx) => {
  const A = rng.int(2, 9), D = rng.int(1, 9);
  const eq = `y = ${A}sin(x) + ${D}`;
  return {
    id: `gen.trg-model-d1.${idx}`, generated: true, concepts: ["model-real-oscillation"], difficulty: 1, context: "abstract",
    prompt: `Write the equation of a sine curve with amplitude ${A}, midline $y = ${D}$, and period $2\\pi$ (no phase shift).`,
    steps: [
      { instruction: "What is $A$ in $y = A\\sin(x) + D$?", answer: `${A}`, accept: [], hint: "The amplitude." },
      { instruction: "What is $D$?", answer: `${D}`, accept: [], hint: "The midline value." },
      { instruction: "Write the full equation.", answer: eq, accept: [`y=${A}sin(x)+${D}`, `${A}sin(x)+${D}`, `y = ${D} + ${A}sin(x)`, `y = ${A}sinx + ${D}`], hint: "Drop $A$ and $D$ into the template; period $2\\pi$ means $B = 1$." },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `Amplitude ${A} and midline ${D} with $B = 1$: $y = ${A}\\sin(x) + ${D}$.`,
  };
};

// model-real-oscillation: d2 (from max/min and period)
fill["trg-model-d2"] = (rng, idx) => {
  const A = rng.int(2, 6), D = rng.int(A + 1, 9);
  const o = rng.pick([{ tex: "\\pi", B: 2 }, { tex: "\\frac{2\\pi}{3}", B: 3 }, { tex: "\\frac{\\pi}{2}", B: 4 }]);
  const M = D + A, m = D - A;
  const eq = `y = ${A}sin(${o.B}x) + ${D}`;
  return {
    id: `gen.trg-model-d2.${idx}`, generated: true, concepts: ["model-real-oscillation"], difficulty: 2, context: "applied",
    prompt: `A quantity oscillates sinusoidally between ${m} and ${M} with period $${o.tex}$, starting at its average value and rising at $x = 0$. Build the model $y = A\\sin(Bx) + D$.`,
    steps: [
      { instruction: "Find the amplitude $A$.", answer: `${A}`, accept: [], hint: `$\\frac{${M} - ${m}}{2}$.` },
      { instruction: "Find the midline $D$.", answer: `${D}`, accept: [], hint: `$\\frac{${M} + ${m}}{2}$.` },
      { instruction: `Find $B$ from the period $${o.tex}$.`, answer: `${o.B}`, accept: [], hint: `$B = \\frac{2\\pi}{T}$.` },
      { instruction: "Write the full equation.", answer: eq, accept: [`y=${A}sin(${o.B}x)+${D}`, `${A}sin(${o.B}x)+${D}`, `y = ${D} + ${A}sin(${o.B}x)`], hint: "Rising through the midline at $x=0$ is a sine start." },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `$A = \\frac{${M}-${m}}{2} = ${A}$, $D = \\frac{${M}+${m}}{2} = ${D}$, $B = \\frac{2\\pi}{T} = ${o.B}$: $y = ${A}\\sin(${o.B}x) + ${D}$.`,
  };
};

// model-real-oscillation: d3 (Ferris wheel, negative cosine)
fill["trg-model-d3"] = (rng, idx) => {
  const r = rng.pick([15, 20, 25, 30]);
  const hub = r + rng.pick([3, 5, 8]);
  const T = rng.pick([20, 30, 40, 60]);
  const k = T / 2;
  const eq = `h = ${hub} - ${r}cos(pi t/${k})`;
  return {
    id: `gen.trg-model-d3.${idx}`, generated: true, concepts: ["model-real-oscillation"], difficulty: 3, context: "applied",
    prompt: `A Ferris wheel of radius ${r} m has its hub ${hub} m above the ground, turns once every ${T} seconds, and you board at the lowest point at $t = 0$. Model your height with $h(t) = D - A\\cos(Bt)$.`,
    steps: [
      { instruction: "What is the amplitude $A$?", answer: `${r}`, accept: [], hint: "You swing one radius above and below the hub." },
      { instruction: "What is the midline $D$?", answer: `${hub}`, accept: [], hint: "The hub height is the center of the swing." },
      { instruction: `Find $B$ from the ${T}-second period. (Exact.)`, answer: piFrac(1, k), accept: [`2pi/${T}`], hint: `$B = \\frac{2\\pi}{${T}}$ — reduce it.` },
      { instruction: "Check the start: what is your height at $t = 0$?", answer: `${hub - r}`, accept: [], hint: `$h(0) = ${hub} - ${r}\\cos 0$.` },
      { instruction: "Write the full equation.", answer: eq, accept: [`h=${hub}-${r}cos(pit/${k})`, `h = ${hub} - ${r}cos((pi/${k})t)`, `h = ${hub} - ${r}cos(pi*t/${k})`, `${hub} - ${r}cos(pi t/${k})`, `h(t) = ${hub} - ${r}cos(pi t/${k})`], hint: `Drop $D = ${hub}$, $A = ${r}$, $B = \\frac{\\pi}{${k}}$ into $h = D - A\\cos(Bt)$.` },
    ],
    finalAnswer: { value: eq, unit: "meters" },
    solutionNarrative: `Amplitude ${r} (the radius), midline ${hub} (the hub), $B = \\frac{2\\pi}{${T}} = \\frac{\\pi}{${k}}$; boarding at the bottom ($${hub - r}$ m) is a negative-cosine start.`,
  };
};

// ============================================================================
// trigonometry.trig-identities
// ============================================================================

// pythagorean-identity: d1 (QI, triples)
fill["trg-pyth-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.trg-pyth-d1.${idx}`, generated: true, concepts: ["pythagorean-identity"], difficulty: 1, context: "abstract",
    prompt: `Given $\\sin\\theta = \\frac{${a}}{${c}}$ with $\\theta$ in Quadrant I, find $\\cos\\theta$ and $\\tan\\theta$ exactly.`,
    steps: [
      { instruction: "Use $\\sin^2\\theta + \\cos^2\\theta = 1$: what is $\\cos^2\\theta$?", answer: frac(b * b, c * c), accept: [], hint: `$1 - \\frac{${a * a}}{${c * c}}$.` },
      { instruction: "Take the square root with the Quadrant I sign. What is $\\cos\\theta$?", answer: frac(b, c), accept: [], hint: "Cosine is positive in QI." },
      { instruction: "Find $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$.", answer: frac(a, b), accept: [], hint: `The ${c}'s cancel.` },
    ],
    finalAnswer: { value: `cos = ${frac(b, c)}, tan = ${frac(a, b)}`, unit: "" },
    solutionNarrative: `$\\cos^2\\theta = \\frac{${b * b}}{${c * c}}$, QI keeps it positive: $\\cos\\theta = \\frac{${b}}{${c}}$, so $\\tan\\theta = \\frac{${a}}{${b}}$.`,
  };
};

// pythagorean-identity: d2 (other quadrants)
fill["trg-pyth-d2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const q = rng.pick(["II", "III", "IV"]);
  const sinSign = q === "II" ? 1 : -1;
  const cosSign = q === "IV" ? 1 : -1;
  const tanSign = sinSign * cosSign;
  const sinStr = frac(sinSign * a, c), cosStr = frac(cosSign * b, c), tanStr = frac(tanSign * a, b);
  return {
    id: `gen.trg-pyth-d2.${idx}`, generated: true, concepts: ["pythagorean-identity"], difficulty: 2, context: "abstract",
    prompt: `Given $\\sin\\theta = ${sinSign < 0 ? "-" : ""}\\frac{${a}}{${c}}$ with $\\theta$ in Quadrant ${q}, find $\\cos\\theta$ and $\\tan\\theta$ exactly.`,
    steps: [
      { instruction: `Is cosine positive or negative in Quadrant ${q}?`, answer: cosSign > 0 ? "positive" : "negative", accept: cosSign > 0 ? ["+", "pos"] : ["-", "neg"], hint: "Cosine is the $x$-coordinate: positive on the right half of the circle." },
      { instruction: "Apply the Pythagorean identity with that sign. What is $\\cos\\theta$?", answer: cosStr, accept: [], hint: `$\\cos^2\\theta = 1 - \\frac{${a * a}}{${c * c}} = \\frac{${b * b}}{${c * c}}$.` },
      { instruction: "Find $\\tan\\theta$.", answer: tanStr, accept: [], hint: `Divide: $\\sin\\theta / \\cos\\theta$ — track the signs.` },
    ],
    finalAnswer: { value: `cos = ${cosStr}, tan = ${tanStr}`, unit: "" },
    solutionNarrative: `The ${a}-${b}-${c} triple gives magnitudes; Quadrant ${q} sets the signs: $\\cos\\theta = ${cosSign < 0 ? "-" : ""}\\frac{${b}}{${c}}$, $\\tan\\theta = ${tanSign < 0 ? "-" : ""}\\frac{${a}}{${b}}$.`,
  };
};

// pythagorean-identity: d3 (radical results)
fill["trg-pyth-d3"] = (rng, idx) => {
  const opts = [
    { k: 3, cos: "2sqrt(2)/3", cosAlt: ["sqrt(8)/3"], tan: "sqrt(2)/4", tanAlt: ["1/(2sqrt(2))"] },
    { k: 4, cos: "sqrt(15)/4", cosAlt: [], tan: "sqrt(15)/15", tanAlt: ["1/sqrt(15)"] },
    { k: 5, cos: "2sqrt(6)/5", cosAlt: ["sqrt(24)/5"], tan: "sqrt(6)/12", tanAlt: ["1/sqrt(24)", "1/(2sqrt(6))"] },
  ];
  const o = rng.pick(opts);
  const k2 = o.k * o.k;
  return {
    id: `gen.trg-pyth-d3.${idx}`, generated: true, concepts: ["pythagorean-identity"], difficulty: 3, context: "abstract",
    prompt: `Given $\\sin\\theta = \\frac{1}{${o.k}}$ with $\\theta$ in Quadrant II, find $\\cos\\theta$ and $\\tan\\theta$ exactly (simplified radicals).`,
    steps: [
      { instruction: "What is $\\cos^2\\theta$?", answer: frac(k2 - 1, k2), accept: [], hint: `$1 - \\frac{1}{${k2}}$.` },
      { instruction: "Root it and attach the Quadrant II sign. What is $\\cos\\theta$?", answer: `-${o.cos}`, accept: o.cosAlt.map((s) => `-${s}`), hint: `Cosine is negative in QII; $\\sqrt{${k2 - 1}}$ may simplify.` },
      { instruction: "Find $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$, rationalized.", answer: `-${o.tan}`, accept: o.tanAlt.map((s) => `-${s}`), hint: `$\\frac{1/${o.k}}{\\cos\\theta}$ — the ${o.k}'s cancel; then rationalize.` },
    ],
    finalAnswer: { value: `cos = -${o.cos}, tan = -${o.tan}`, unit: "" },
    solutionNarrative: `$\\cos^2\\theta = \\frac{${k2 - 1}}{${k2}}$, and QII makes cosine negative: $\\cos\\theta = -${o.cos}$; dividing gives $\\tan\\theta = -${o.tan}$.`,
  };
};

// quotient-reciprocal: d1 (tan and cot from sin, cos)
fill["trg-quot-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.trg-quot-d1.${idx}`, generated: true, concepts: ["quotient-reciprocal"], difficulty: 1, context: "abstract",
    prompt: `Given $\\sin\\theta = \\frac{${a}}{${c}}$ and $\\cos\\theta = \\frac{${b}}{${c}}$, find $\\tan\\theta$ and $\\cot\\theta$ exactly.`,
    steps: [
      { instruction: "Compute $\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}$.", answer: frac(a, b), accept: [], hint: `The ${c}'s cancel when you divide.` },
      { instruction: "Compute $\\cot\\theta$ (the reciprocal of tangent).", answer: frac(b, a), accept: [], hint: `Flip $\\frac{${a}}{${b}}$.` },
    ],
    finalAnswer: { value: `tan = ${frac(a, b)}, cot = ${frac(b, a)}`, unit: "" },
    solutionNarrative: `$\\tan\\theta = \\frac{${a}}{${b}}$ and $\\cot\\theta = \\frac{${b}}{${a}}$.`,
  };
};

// quotient-reciprocal: d2 (sec and csc with signs)
fill["trg-quot-d2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const q = rng.pick(["II", "IV"]);
  const sinSign = q === "II" ? 1 : -1;
  const cosSign = q === "II" ? -1 : 1;
  return {
    id: `gen.trg-quot-d2.${idx}`, generated: true, concepts: ["quotient-reciprocal"], difficulty: 2, context: "abstract",
    prompt: `Given $\\sin\\theta = ${sinSign < 0 ? "-" : ""}\\frac{${a}}{${c}}$ and $\\cos\\theta = ${cosSign < 0 ? "-" : ""}\\frac{${b}}{${c}}$ (Quadrant ${q}), find $\\sec\\theta$ and $\\csc\\theta$ exactly.`,
    steps: [
      { instruction: "Compute $\\sec\\theta = \\frac{1}{\\cos\\theta}$, keeping the sign.", answer: frac(cosSign * c, b), accept: [], hint: `Flip $${cosSign < 0 ? "-" : ""}\\frac{${b}}{${c}}$.` },
      { instruction: "Compute $\\csc\\theta = \\frac{1}{\\sin\\theta}$.", answer: frac(sinSign * c, a), accept: [], hint: `Flip $${sinSign < 0 ? "-" : ""}\\frac{${a}}{${c}}$.` },
    ],
    finalAnswer: { value: `sec = ${frac(cosSign * c, b)}, csc = ${frac(sinSign * c, a)}`, unit: "" },
    solutionNarrative: `Reciprocals keep their signs: $\\sec\\theta = ${cosSign < 0 ? "-" : ""}\\frac{${c}}{${b}}$, $\\csc\\theta = ${sinSign < 0 ? "-" : ""}\\frac{${c}}{${a}}$.`,
  };
};

// quotient-reciprocal: d3 (from tan in QIII)
fill["trg-quot-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.trg-quot-d3.${idx}`, generated: true, concepts: ["quotient-reciprocal"], difficulty: 3, context: "abstract",
    prompt: `Given $\\tan\\theta = \\frac{${a}}{${b}}$ with $\\theta$ in Quadrant III, find $\\sin\\theta$, $\\cos\\theta$, and $\\sec\\theta$ exactly.`,
    steps: [
      { instruction: `A ${a}-${b} opposite/adjacent pair belongs to which hypotenuse?`, answer: `${c}`, accept: [], hint: `$\\sqrt{${a}^2 + ${b}^2}$.` },
      { instruction: "In Quadrant III both sine and cosine are negative. What is $\\sin\\theta$?", answer: frac(-a, c), accept: [], hint: `Magnitude $\\frac{${a}}{${c}}$ with the QIII sign.` },
      { instruction: "What is $\\cos\\theta$?", answer: frac(-b, c), accept: [], hint: `Check: their ratio should give back $+\\frac{${a}}{${b}}$.` },
      { instruction: "What is $\\sec\\theta$?", answer: frac(-c, b), accept: [], hint: "The reciprocal of cosine." },
    ],
    finalAnswer: { value: `sin = ${frac(-a, c)}, cos = ${frac(-b, c)}, sec = ${frac(-c, b)}`, unit: "" },
    solutionNarrative: `The ${a}-${b}-${c} triple gives magnitudes; QIII makes sine and cosine negative, so $\\sin = -\\frac{${a}}{${c}}$, $\\cos = -\\frac{${b}}{${c}}$, $\\sec = -\\frac{${c}}{${b}}$.`,
  };
};

// Sum/difference exact-value tables. All products fold signs into the terms.
const SD1 = [
  { label: "\\sin 75^\\circ", split: "75^\\circ = 45^\\circ + 30^\\circ", formula: "\\sin 45\\cos 30 + \\cos 45\\sin 30", t1: ["\\sin 45^\\circ \\cos 30^\\circ", "sqrt(6)/4"], t2: ["\\cos 45^\\circ \\sin 30^\\circ", "sqrt(2)/4"], op: "Add them", res: "(sqrt(6)+sqrt(2))/4", resAcc: ["(sqrt(2)+sqrt(6))/4", "sqrt(6)/4+sqrt(2)/4"] },
  { label: "\\cos 15^\\circ", split: "15^\\circ = 45^\\circ - 30^\\circ", formula: "\\cos 45\\cos 30 + \\sin 45\\sin 30", t1: ["\\cos 45^\\circ \\cos 30^\\circ", "sqrt(6)/4"], t2: ["\\sin 45^\\circ \\sin 30^\\circ", "sqrt(2)/4"], op: "Add them (cos(A-B) uses a PLUS)", res: "(sqrt(6)+sqrt(2))/4", resAcc: ["(sqrt(2)+sqrt(6))/4", "sqrt(6)/4+sqrt(2)/4"] },
  { label: "\\sin 15^\\circ", split: "15^\\circ = 45^\\circ - 30^\\circ", formula: "\\sin 45\\cos 30 - \\cos 45\\sin 30", t1: ["\\sin 45^\\circ \\cos 30^\\circ", "sqrt(6)/4"], t2: ["\\cos 45^\\circ \\sin 30^\\circ", "sqrt(2)/4"], op: "Subtract the second from the first", res: "(sqrt(6)-sqrt(2))/4", resAcc: ["sqrt(6)/4-sqrt(2)/4"] },
  { label: "\\cos 75^\\circ", split: "75^\\circ = 45^\\circ + 30^\\circ", formula: "\\cos 45\\cos 30 - \\sin 45\\sin 30", t1: ["\\cos 45^\\circ \\cos 30^\\circ", "sqrt(6)/4"], t2: ["\\sin 45^\\circ \\sin 30^\\circ", "sqrt(2)/4"], op: "Subtract the second from the first (cos(A+B) uses a MINUS)", res: "(sqrt(6)-sqrt(2))/4", resAcc: ["sqrt(6)/4-sqrt(2)/4"] },
];
const SD2 = [
  { label: "\\sin 105^\\circ", split: "105^\\circ = 60^\\circ + 45^\\circ", formula: "\\sin 60\\cos 45 + \\cos 60\\sin 45", t1: ["\\sin 60^\\circ \\cos 45^\\circ", "sqrt(6)/4"], t2: ["$\\cos 60^\\circ \\sin 45^\\circ$", "sqrt(2)/4"], res: "(sqrt(6)+sqrt(2))/4", resAcc: ["(sqrt(2)+sqrt(6))/4", "sqrt(6)/4+sqrt(2)/4"] },
  { label: "\\cos 105^\\circ", split: "105^\\circ = 60^\\circ + 45^\\circ", formula: "\\cos 60\\cos 45 - \\sin 60\\sin 45", t1: ["\\cos 60^\\circ \\cos 45^\\circ", "sqrt(2)/4"], t2: ["$-\\sin 60^\\circ \\sin 45^\\circ$ (the formula's minus term)", "-sqrt(6)/4"], res: "(sqrt(2)-sqrt(6))/4", resAcc: ["sqrt(2)/4-sqrt(6)/4"] },
  { label: "\\sin 165^\\circ", split: "165^\\circ = 120^\\circ + 45^\\circ", formula: "\\sin 120\\cos 45 + \\cos 120\\sin 45", t1: ["\\sin 120^\\circ \\cos 45^\\circ", "sqrt(6)/4"], t2: ["$\\cos 120^\\circ \\sin 45^\\circ$ (note $\\cos 120^\\circ$ is negative)", "-sqrt(2)/4"], res: "(sqrt(6)-sqrt(2))/4", resAcc: ["sqrt(6)/4-sqrt(2)/4"] },
  { label: "\\cos 165^\\circ", split: "165^\\circ = 120^\\circ + 45^\\circ", formula: "\\cos 120\\cos 45 - \\sin 120\\sin 45", t1: ["\\cos 120^\\circ \\cos 45^\\circ", "-sqrt(2)/4"], t2: ["$-\\sin 120^\\circ \\sin 45^\\circ$ (the formula's minus term)", "-sqrt(6)/4"], res: "-(sqrt(6)+sqrt(2))/4", resAcc: ["(-sqrt(6)-sqrt(2))/4", "-sqrt(6)/4-sqrt(2)/4"] },
];

// sum-difference: d1 (75/15 from 45 and 30)
fill["trg-sumdiff-d1"] = (rng, idx) => {
  const o = rng.pick(SD1);
  return {
    id: `gen.trg-sumdiff-d1.${idx}`, generated: true, concepts: ["sum-difference"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $${o.label}$ exactly using $${o.split}$ and the formula $${o.label} = ${o.formula}$.`,
    steps: [
      { instruction: `Compute the first product, $${o.t1[0]}$. Exact.`, answer: o.t1[1], accept: [], hint: "Multiply the two unit-circle values; multiply the radicals." },
      { instruction: `Compute the second product, $${o.t2[0]}$. Exact.`, answer: o.t2[1], accept: [], hint: "Multiply the two unit-circle values." },
      { instruction: `${o.op}. What is $${o.label}$ exactly?`, answer: o.res, accept: o.resAcc, hint: "Combine over the common denominator 4." },
    ],
    finalAnswer: { value: o.res, unit: "" },
    solutionNarrative: `$${o.label} = ${o.formula}$; the products are $${o.t1[1].replace("sqrt", "\\sqrt")}$ and $${o.t2[1].replace("sqrt", "\\sqrt")}$, combining to the exact value.`,
  };
};

// sum-difference: d2 (105/165, negative-value factors)
fill["trg-sumdiff-d2"] = (rng, idx) => {
  const o = rng.pick(SD2);
  return {
    id: `gen.trg-sumdiff-d2.${idx}`, generated: true, concepts: ["sum-difference"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${o.label}$ exactly using $${o.split}$ and the formula $${o.label} = ${o.formula}$.`,
    steps: [
      { instruction: `Compute the first term, $${o.t1[0]}$. Exact (include any sign).`, answer: o.t1[1], accept: [], hint: "Watch the signs of the Quadrant II values." },
      { instruction: `Compute the second term, ${o.t2[0]}. Exact (include the sign).`, answer: o.t2[1], accept: [], hint: "Fold the formula's sign into the term." },
      { instruction: `Add the two terms. What is $${o.label}$ exactly?`, answer: o.res, accept: o.resAcc, hint: "Combine over the common denominator 4." },
    ],
    finalAnswer: { value: o.res, unit: "" },
    solutionNarrative: `With the signs folded in, the two terms sum to $${o.label.startsWith("\\sin 105") || o.label.startsWith("\\cos 15") ? "" : ""}${o.res.replace(/sqrt/g, "\\sqrt")}$.`,
  };
};

// sum-difference: d3 (two triples, sin(A+B) and cos(A+B))
fill["trg-sumdiff-d3"] = (rng, idx) => {
  const i = rng.int(0, TRIPLES.length - 1);
  let j = rng.int(0, TRIPLES.length - 2); if (j >= i) j++;
  const [a1, b1, c1] = TRIPLES[i], [a2, b2, c2] = TRIPLES[j];
  const sinAB = frac(a1 * b2 + b1 * a2, c1 * c2);
  const cosAB = frac(b1 * b2 - a1 * a2, c1 * c2);
  return {
    id: `gen.trg-sumdiff-d3.${idx}`, generated: true, concepts: ["sum-difference"], difficulty: 3, context: "abstract",
    prompt: `Angles $A$ and $B$ are both in Quadrant I with $\\sin A = \\frac{${a1}}{${c1}}$ and $\\sin B = \\frac{${a2}}{${c2}}$. Find $\\sin(A+B)$ and $\\cos(A+B)$ exactly.`,
    steps: [
      { instruction: "Find $\\cos A$ (QI, so positive).", answer: frac(b1, c1), accept: [], hint: `${a1}-${b1}-${c1} triangle.` },
      { instruction: "Find $\\cos B$ (QI).", answer: frac(b2, c2), accept: [], hint: `${a2}-${b2}-${c2} triangle.` },
      { instruction: "Apply $\\sin(A+B) = \\sin A\\cos B + \\cos A\\sin B$ and simplify to a single fraction.", answer: sinAB, accept: [], hint: `$\\frac{${a1}}{${c1}}\\cdot\\frac{${b2}}{${c2}} + \\frac{${b1}}{${c1}}\\cdot\\frac{${a2}}{${c2}}$.` },
      { instruction: "Apply $\\cos(A+B) = \\cos A\\cos B - \\sin A\\sin B$ (note the minus).", answer: cosAB, accept: [], hint: `$\\frac{${b1}}{${c1}}\\cdot\\frac{${b2}}{${c2}} - \\frac{${a1}}{${c1}}\\cdot\\frac{${a2}}{${c2}}$.` },
    ],
    finalAnswer: { value: `sin(A+B) = ${sinAB}, cos(A+B) = ${cosAB}`, unit: "" },
    solutionNarrative: `Pythagorean triples give $\\cos A = \\frac{${b1}}{${c1}}$, $\\cos B = \\frac{${b2}}{${c2}}$; the sum formulas then give $\\sin(A+B) = ${sinAB}$ and $\\cos(A+B) = ${cosAB}$.`,
  };
};

// double-angle: d1 (QI)
fill["trg-dbl-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const sin2 = frac(2 * a * b, c * c), cos2 = frac(b * b - a * a, c * c);
  return {
    id: `gen.trg-dbl-d1.${idx}`, generated: true, concepts: ["double-angle"], difficulty: 1, context: "abstract",
    prompt: `Given $\\sin\\theta = \\frac{${a}}{${c}}$ with $\\theta$ in Quadrant I, find $\\sin 2\\theta$ and $\\cos 2\\theta$ exactly.`,
    steps: [
      { instruction: "First find $\\cos\\theta$ (QI).", answer: frac(b, c), accept: [], hint: "Pythagorean identity with the positive root." },
      { instruction: "Apply $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$.", answer: sin2, accept: [], hint: `$2 \\cdot \\frac{${a}}{${c}} \\cdot \\frac{${b}}{${c}}$.` },
      { instruction: "Apply $\\cos 2\\theta = 1 - 2\\sin^2\\theta$.", answer: cos2, accept: [], hint: `$1 - 2 \\cdot \\frac{${a * a}}{${c * c}}$.` },
    ],
    finalAnswer: { value: `sin 2θ = ${sin2}, cos 2θ = ${cos2}`, unit: "" },
    solutionNarrative: `$\\cos\\theta = \\frac{${b}}{${c}}$, so $\\sin 2\\theta = ${sin2}$ and $\\cos 2\\theta = ${cos2}$.`,
  };
};

// double-angle: d2 (QII)
fill["trg-dbl-d2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const sin2 = frac(-2 * a * b, c * c), cos2 = frac(b * b - a * a, c * c);
  return {
    id: `gen.trg-dbl-d2.${idx}`, generated: true, concepts: ["double-angle"], difficulty: 2, context: "abstract",
    prompt: `Given $\\sin\\theta = \\frac{${a}}{${c}}$ with $\\theta$ in Quadrant II, find $\\sin 2\\theta$ and $\\cos 2\\theta$ exactly.`,
    steps: [
      { instruction: "Find $\\cos\\theta$, with the Quadrant II sign.", answer: frac(-b, c), accept: [], hint: `${a}-${b}-${c} triple; cosine is negative in QII.` },
      { instruction: "Apply $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$.", answer: sin2, accept: [], hint: `$2 \\cdot \\frac{${a}}{${c}} \\cdot \\left(-\\frac{${b}}{${c}}\\right)$.` },
      { instruction: "Apply $\\cos 2\\theta = 1 - 2\\sin^2\\theta$.", answer: cos2, accept: [], hint: `$1 - 2 \\cdot \\frac{${a * a}}{${c * c}}$.` },
    ],
    finalAnswer: { value: `sin 2θ = ${sin2}, cos 2θ = ${cos2}`, unit: "" },
    solutionNarrative: `$\\cos\\theta = -\\frac{${b}}{${c}}$ in QII, so $\\sin 2\\theta = ${sin2}$ and $\\cos 2\\theta = ${cos2}$.`,
  };
};

// double-angle: d3 (QIII, includes tan 2θ)
fill["trg-dbl-d3"] = (rng, idx) => {
  let [a, b, c] = rng.pick(TRIPLES);
  if (rng.int(0, 1) === 1) [a, b] = [b, a]; // vary which leg is the cosine
  const sin2 = frac(2 * a * b, c * c);
  const cos2 = frac(2 * b * b - c * c, c * c);
  const tan2 = frac(2 * a * b, 2 * b * b - c * c);
  return {
    id: `gen.trg-dbl-d3.${idx}`, generated: true, concepts: ["double-angle"], difficulty: 3, context: "abstract",
    prompt: `Given $\\cos\\theta = -\\frac{${b}}{${c}}$ with $\\theta$ in Quadrant III, find $\\sin 2\\theta$, $\\cos 2\\theta$, and $\\tan 2\\theta$ exactly.`,
    steps: [
      { instruction: "Find $\\sin\\theta$, with the Quadrant III sign.", answer: frac(-a, c), accept: [], hint: `${Math.min(a, b)}-${Math.max(a, b)}-${c} magnitudes; sine is negative in QIII.` },
      { instruction: "Apply $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$. Watch the signs.", answer: sin2, accept: [], hint: "Two negatives multiply to a positive." },
      { instruction: "Apply $\\cos 2\\theta = 2\\cos^2\\theta - 1$.", answer: cos2, accept: [], hint: `$2 \\cdot \\frac{${b * b}}{${c * c}} - 1$.` },
      { instruction: "Divide to get $\\tan 2\\theta$.", answer: tan2, accept: [], hint: `$\\sin 2\\theta / \\cos 2\\theta$ — the $${c * c}$'s cancel.` },
    ],
    finalAnswer: { value: `sin 2θ = ${sin2}, cos 2θ = ${cos2}, tan 2θ = ${tan2}`, unit: "" },
    solutionNarrative: `QIII gives $\\sin\\theta = -\\frac{${a}}{${c}}$; then $\\sin 2\\theta = ${sin2}$, $\\cos 2\\theta = ${cos2}$, and $\\tan 2\\theta = ${tan2}$.`,
  };
};
