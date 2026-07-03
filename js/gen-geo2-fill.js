// gen-geo2-fill.js
// Full-tier parametric generators for two Geometry topics
//   geometry.quadrilaterals-and-polygons  (templates geo2-angle-sums-*, geo2-parallelogram-*,
//                                          geo2-special-quads-*, geo2-trapezoids-*)
//   geometry.transformations              (templates geo2-translate-reflect-*, geo2-rotations-*,
//                                          geo2-dilations-*, geo2-compositions-*)
// giving every key concept a generator at difficulty 1, 2, AND 3.
// Self-contained pack: exports a `fill` map of template-name -> generator fn
// (same shape as js/generator.js's registry; merged via Object.assign there).
// Deterministic: numbers come only from the passed rng (no Date/Math.random),
// and each template returns a FIXED difficulty + concepts list so the engine's
// single-probe tier detection is reliable. Degenerate combos are guarded out:
// n < 3 polygons, non-positive solved lengths, points at the origin or on the
// mirror line, scale factor 1, and equal pre-/post-translation coordinates.

// Pythagorean triples [half-diagonal, half-diagonal, side] for rhombus problems
const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
];

const POLY_NAMES = { 5: "pentagon", 6: "hexagon", 7: "heptagon", 8: "octagon", 9: "nonagon", 10: "decagon", 12: "12-gon" };

// Nonzero integer in [-hi, -1] ∪ [1, hi] (never 0, so points never sit on an axis).
const nz = (rng, hi) => rng.int(1, hi) * rng.pick([1, -1]);

// Vector-format answer for an image point, plus the accepted spellings.
const vec = (x, y) => `<${x}, ${y}>`;
const vecAccept = (x, y) => [`(${x}, ${y})`, `${x}, ${y}`, `x=${x}, y=${y}`];
const VEC_HOWTO = "Write the image as a vector in the form <x, y> (e.g. <3, -2>).";

// Build a cartesian plot spec sized to fit the given points (axes always visible).
function planePlot(points, segments, caption) {
  const xs = points.map((p) => p.x).concat([0]);
  const ys = points.map((p) => p.y).concat([0]);
  return {
    xRange: [Math.min(...xs) - 2, Math.max(...xs) + 2],
    yRange: [Math.min(...ys) - 2, Math.max(...ys) + 2],
    width: 320, height: 320,
    points, segments,
    caption,
  };
}

export const fill = {};

// ============================================================================
// geometry.quadrilaterals-and-polygons
// ============================================================================

// --- polygon-angle-sums -------------------------------------------------------

fill["geo2-angle-sums-1"] = (rng, idx) => {
  const n = rng.int(5, 10); // always >= 5: no degenerate n < 3 polygons
  const name = POLY_NAMES[n];
  const sum = (n - 2) * 180;
  const obj = rng.pick(["floor tile", "garden paver", "window pane", "mirror frame"]);
  return {
    id: `gen.geo2-angle-sums-1.${idx}`, generated: true, concepts: ["polygon-angle-sums"], difficulty: 1, context: "applied",
    prompt: `A ${obj} is shaped like a convex ${name} (${n} sides). Find the sum of its interior angles, and the sum of its exterior angles (one at each vertex).`,
    steps: [
      { instruction: `Diagonals from one vertex split the ${name} into how many triangles? (That is $n - 2$.)`, answer: `${n - 2}`, accept: [`${n - 2} triangles`], hint: `$n - 2 = ${n} - 2$.` },
      { instruction: "Each triangle contributes $180^\\circ$. Find the interior angle sum, in degrees.", answer: `${sum}`, accept: [`${sum} degrees`], hint: `${n - 2} × 180.` },
      { instruction: "What is the sum of the exterior angles (one per vertex), in degrees?", answer: "360", accept: ["360 degrees"], hint: "It is $360^\\circ$ for EVERY convex polygon, no matter how many sides." },
    ],
    finalAnswer: { value: `${sum}`, unit: "degrees" },
    solutionNarrative: `The ${name} splits into $${n} - 2 = ${n - 2}$ triangles, so its interior angles sum to $${n - 2} \\times 180 = ${sum}^\\circ$. The exterior angles of any convex polygon always sum to $360^\\circ$.`,
  };
};

fill["geo2-angle-sums-2"] = (rng, idx) => {
  const n = rng.pick([5, 6, 8, 9, 10, 12]); // divisors chosen so each angle is a whole number
  const name = POLY_NAMES[n];
  const sum = (n - 2) * 180;
  const each = sum / n;
  const obj = rng.pick(["gazebo floor", "stop-sign-style plaque", "patio table top", "decorative clock face"]);
  return {
    id: `gen.geo2-angle-sums-2.${idx}`, generated: true, concepts: ["polygon-angle-sums"], difficulty: 2, context: "applied",
    prompt: `A ${obj} is a regular ${name} — all ${n} sides and all ${n} angles are equal. Find the interior angle sum, then the measure of each interior angle.`,
    steps: [
      { instruction: "Find the interior angle sum, in degrees.", answer: `${sum}`, accept: [`${sum} degrees`], hint: `$(n - 2) \\times 180 = ${n - 2} \\times 180$.` },
      { instruction: `The ${n} equal angles share that sum. Find each interior angle, in degrees.`, answer: `${each}`, accept: [`${each} degrees`], hint: `${sum} ÷ ${n}.` },
    ],
    finalAnswer: { value: `${each}`, unit: "degrees" },
    solutionNarrative: `The angle sum is $(${n} - 2) \\times 180 = ${sum}^\\circ$; split equally ${n} ways, each angle is $${sum}/${n} = ${each}^\\circ$.`,
  };
};

fill["geo2-angle-sums-3"] = (rng, idx) => {
  const e = rng.pick([20, 24, 30, 36, 40, 45, 60, 72]); // exterior angle; n = 360/e is a whole number >= 5
  const n = 360 / e;
  const I = 180 - e;
  return {
    id: `gen.geo2-angle-sums-3.${idx}`, generated: true, concepts: ["polygon-angle-sums"], difficulty: 3, context: "abstract",
    prompt: `Each interior angle of a regular polygon measures $${I}^\\circ$. How many sides does the polygon have?`,
    steps: [
      { instruction: "Interior and exterior angles at a vertex are supplementary. Find each exterior angle, in degrees.", answer: `${e}`, accept: [`${e} degrees`], hint: `$180 - ${I}$.` },
      { instruction: "The exterior angles sum to $360^\\circ$. Solve $n \\cdot ${e} = 360$ for the number of sides $n$.", answer: `${n}`, accept: [`n=${n}`, `${n} sides`], hint: `360 ÷ ${e}.` },
    ],
    finalAnswer: { value: `${n}`, unit: "sides" },
    solutionNarrative: `Each exterior angle is $180 - ${I} = ${e}^\\circ$, and the exterior angles total $360^\\circ$, so $n = 360/${e} = ${n}$ sides.`,
  };
};

// --- parallelogram-properties --------------------------------------------------

fill["geo2-parallelogram-1"] = (rng, idx) => {
  const A = rng.pick([55, 60, 65, 70, 75, 80, 85, 95, 100, 105, 110, 115, 120, 125]); // never 90: rectangle would be a giveaway
  const obj = rng.pick(["pantograph linkage", "adjustable easel frame", "folding gate panel", "ironing-board leg frame"]);
  return {
    id: `gen.geo2-parallelogram-1.${idx}`, generated: true, concepts: ["parallelogram-properties"], difficulty: 1, context: "applied",
    prompt: `A ${obj} forms parallelogram $ABCD$ with $\\angle A = ${A}^\\circ$. Find $\\angle C$ (opposite $\\angle A$) and $\\angle B$ (consecutive to $\\angle A$). (Answers in degrees.)`,
    steps: [
      { instruction: "Opposite angles of a parallelogram are equal. Find $\\angle C$, in degrees.", answer: `${A}`, accept: [`${A} degrees`], hint: "$\\angle C = \\angle A$." },
      { instruction: "Consecutive angles are supplementary. Find $\\angle B$, in degrees.", answer: `${180 - A}`, accept: [`${180 - A} degrees`], hint: `$180 - ${A}$.` },
    ],
    finalAnswer: { value: `${180 - A}`, unit: "degrees" },
    solutionNarrative: `Opposite angles match, so $\\angle C = ${A}^\\circ$; consecutive angles are supplementary, so $\\angle B = 180 - ${A} = ${180 - A}^\\circ$.`,
  };
};

fill["geo2-parallelogram-2"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const x0 = rng.int(3, 9);
  const b = rng.int(1, 8);
  const c = a * x0 + b; // opposite side length; positive by construction
  return {
    id: `gen.geo2-parallelogram-2.${idx}`, generated: true, concepts: ["parallelogram-properties"], difficulty: 2, context: "abstract",
    prompt: `In parallelogram $ABCD$, side $AB = ${a}x + ${b}$ and the opposite side $CD = ${c}$. Opposite sides of a parallelogram are equal. Solve for $x$, then find $AB$.`,
    steps: [
      { instruction: `Set $AB = CD$ and subtract ${b} from both sides. Write the resulting equation.`, answer: `${a}x = ${c - b}`, accept: [`${a}x=${c - b}`, `${c - b}=${a}x`], hint: `From $${a}x + ${b} = ${c}$, subtract ${b}.` },
      { instruction: "Solve for $x$.", answer: `${x0}`, accept: [`x=${x0}`], hint: `${c - b} ÷ ${a}.` },
      { instruction: "Find the length of $AB$.", answer: `${c}`, accept: [`ab=${c}`], hint: `$${a}(${x0}) + ${b}$ — it must match $CD$.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `$${a}x + ${b} = ${c}$ gives $${a}x = ${c - b}$, so $x = ${x0}$ and $AB = ${a}(${x0}) + ${b} = ${c}$, equal to $CD$ as it must be.`,
  };
};

fill["geo2-parallelogram-3"] = (rng, idx) => {
  const r = rng.int(2, 4);
  const p = r + rng.int(1, 3); // p > r so the x-coefficient stays positive after gathering
  const x0 = rng.int(2, 8);
  const q = rng.int(1, 6);
  const s = q + (p - r) * x0; // forces the solution x = x0 with positive segment lengths
  const AE = p * x0 + q;
  return {
    id: `gen.geo2-parallelogram-3.${idx}`, generated: true, concepts: ["parallelogram-properties"], difficulty: 3, context: "abstract",
    prompt: `The diagonals of parallelogram $ABCD$ meet at $E$. Along diagonal $AC$, $AE = ${p}x + ${q}$ and $EC = ${r}x + ${s}$. Diagonals of a parallelogram bisect each other. Solve for $x$, then find $AE$ and the full diagonal $AC$.`,
    steps: [
      { instruction: `Set $AE = EC$ and gather the $x$ terms on one side. Write the resulting equation.`, answer: `${p - r}x = ${s - q}`, accept: [`${p - r}x=${s - q}`, `${s - q}=${p - r}x`], hint: `Subtract $${r}x$ and ${q} from both sides of $${p}x + ${q} = ${r}x + ${s}$.` },
      { instruction: "Solve for $x$.", answer: `${x0}`, accept: [`x=${x0}`], hint: `${s - q} ÷ ${p - r}.` },
      { instruction: "Find $AE$.", answer: `${AE}`, accept: [`ae=${AE}`], hint: `$${p}(${x0}) + ${q}$.` },
      { instruction: "$E$ is the midpoint of $AC$, so find the full diagonal $AC$.", answer: `${2 * AE}`, accept: [`ac=${2 * AE}`], hint: "Double $AE$." },
    ],
    finalAnswer: { value: `${2 * AE}`, unit: "" },
    solutionNarrative: `Bisecting diagonals force $AE = EC$: $${p}x + ${q} = ${r}x + ${s}$ gives $${p - r}x = ${s - q}$, so $x = ${x0}$. Then $AE = ${AE}$ and $AC = 2(${AE}) = ${2 * AE}$.`,
  };
};

// --- special-quadrilaterals -----------------------------------------------------

fill["geo2-special-quads-1"] = (rng, idx) => {
  const h = rng.int(5, 14);
  const d = 2 * h;
  const obj = rng.pick(["TV screen", "picture frame", "tabletop", "window"]);
  return {
    id: `gen.geo2-special-quads-1.${idx}`, generated: true, concepts: ["special-quadrilaterals"], difficulty: 1, context: "applied",
    prompt: `A rectangular ${obj} $ABCD$ has diagonals that meet at $E$, and diagonal $AC = ${d}$ inches. Find the other diagonal $BD$, and the half-diagonal $AE$.`,
    steps: [
      { instruction: "The diagonals of a rectangle are equal. Find $BD$, in inches.", answer: `${d}`, accept: [`${d} in`, `bd=${d}`], hint: "$BD = AC$ in any rectangle." },
      { instruction: "The diagonals also bisect each other. Find $AE$, in inches.", answer: `${h}`, accept: [`${h} in`, `ae=${h}`], hint: `Half of ${d}.` },
    ],
    finalAnswer: { value: `${h}`, unit: "inches" },
    solutionNarrative: `A rectangle's diagonals are equal ($BD = ${d}$) and bisect each other, so $AE = ${d}/2 = ${h}$ inches.`,
  };
};

fill["geo2-special-quads-2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const thing = rng.pick(["rhombus-shaped garden bed", "rhombus-shaped mosaic tile", "rhombus-shaped earring", "rhombus-shaped logo"]);
  return {
    id: `gen.geo2-special-quads-2.${idx}`, generated: true, concepts: ["special-quadrilaterals"], difficulty: 2, context: "applied",
    prompt: `A ${thing} has diagonals of ${2 * a} cm and ${2 * b} cm. The diagonals of a rhombus are perpendicular bisectors of each other. Find the two half-diagonals, the angle at which the diagonals cross, and the side length of the rhombus.`,
    steps: [
      { instruction: `Find half of the ${2 * a} cm diagonal, in cm.`, answer: `${a}`, accept: [`${a} cm`], hint: `${2 * a} ÷ 2.` },
      { instruction: `Find half of the ${2 * b} cm diagonal, in cm.`, answer: `${b}`, accept: [`${b} cm`], hint: `${2 * b} ÷ 2.` },
      { instruction: "At what angle (in degrees) do a rhombus's diagonals cross?", answer: "90", accept: ["90 degrees"], hint: "They are PERPENDICULAR bisectors." },
      { instruction: "The half-diagonals are the legs of a right triangle whose hypotenuse is a side. Find the side length, in cm.", answer: `${c}`, accept: [`${c} cm`], hint: `$\\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}$.` },
    ],
    finalAnswer: { value: `${c}`, unit: "cm" },
    solutionNarrative: `The half-diagonals are ${a} and ${b} cm and meet at $90^\\circ$, so each side is $\\sqrt{${a}^2 + ${b}^2} = ${c}$ cm.`,
  };
};

fill["geo2-special-quads-3"] = (rng, idx) => {
  const A = 10 * rng.int(4, 9);   // 40..90
  const B = 10 * rng.int(10, 15); // 100..150; A + B <= 240 keeps x positive
  const x = (360 - A - B) / 2;    // whole number: A and B are multiples of 10
  return {
    id: `gen.geo2-special-quads-3.${idx}`, generated: true, concepts: ["special-quadrilaterals"], difficulty: 3, context: "applied",
    prompt: `A kite-shaped stunt kite has vertex angles of $${A}^\\circ$ (at the nose) and $${B}^\\circ$ (at the tail) along its axis of symmetry. The other two angles — the pair the symmetry axis does NOT pass through — are equal. Find each of those two angles.`,
    steps: [
      { instruction: "What do the four interior angles of any quadrilateral sum to, in degrees?", answer: "360", accept: ["360 degrees"], hint: "A quadrilateral splits into two triangles: $2 \\times 180$." },
      { instruction: "Add the two known vertex angles, in degrees.", answer: `${A + B}`, accept: [`${A + B} degrees`], hint: `${A} + ${B}.` },
      { instruction: "How many degrees remain for the two equal angles together?", answer: `${360 - A - B}`, accept: [`${360 - A - B} degrees`], hint: `$360 - ${A + B}$.` },
      { instruction: "Find each of the two equal angles, in degrees.", answer: `${x}`, accept: [`${x} degrees`], hint: `${360 - A - B} ÷ 2.` },
    ],
    finalAnswer: { value: `${x}`, unit: "degrees" },
    solutionNarrative: `The angles sum to $360^\\circ$. The vertex angles take $${A} + ${B} = ${A + B}^\\circ$, leaving $${360 - A - B}^\\circ$ for the congruent pair — $${x}^\\circ$ each.`,
  };
};

// --- trapezoids-and-midsegments --------------------------------------------------

fill["geo2-trapezoids-1"] = (rng, idx) => {
  const b1 = rng.int(3, 9);
  const b2 = b1 + 2 * rng.int(1, 5); // same parity: the midsegment is a whole number
  const m = (b1 + b2) / 2;
  const obj = rng.pick(["deck", "garden bed", "stage platform", "roof cross-section"]);
  return {
    id: `gen.geo2-trapezoids-1.${idx}`, generated: true, concepts: ["trapezoids-and-midsegments"], difficulty: 1, context: "applied",
    prompt: `A trapezoid-shaped ${obj} has parallel sides (bases) of ${b1} ft and ${b2} ft. A support beam runs along the midsegment — the segment joining the midpoints of the two legs. How long is the beam?`,
    steps: [
      { instruction: "Add the two bases, in feet.", answer: `${b1 + b2}`, accept: [`${b1 + b2} ft`], hint: `${b1} + ${b2}.` },
      { instruction: "The midsegment is the AVERAGE of the bases. Find its length, in feet.", answer: `${m}`, accept: [`${m} ft`], hint: `${b1 + b2} ÷ 2.` },
    ],
    finalAnswer: { value: `${m}`, unit: "feet" },
    solutionNarrative: `Midsegment $= \\frac{${b1} + ${b2}}{2} = \\frac{${b1 + b2}}{2} = ${m}$ ft.`,
  };
};

fill["geo2-trapezoids-2"] = (rng, idx) => {
  const m = rng.int(8, 20);
  const diff = rng.int(2, 6);
  const b1 = m - diff;        // known base; positive since m >= 8 > diff
  const b2 = m + diff;        // unknown base, always positive and != b1
  const obj = rng.pick(["access ramp", "retaining wall panel", "awning", "ski-jump profile"]);
  return {
    id: `gen.geo2-trapezoids-2.${idx}`, generated: true, concepts: ["trapezoids-and-midsegments"], difficulty: 2, context: "applied",
    prompt: `The midsegment of a trapezoid-shaped ${obj} measures ${m} m, and one base measures ${b1} m. Find the other base.`,
    steps: [
      { instruction: "Midsegment $= \\frac{b_1 + b_2}{2}$, so the bases sum to twice the midsegment. Find that sum, in meters.", answer: `${2 * m}`, accept: [`${2 * m} m`], hint: `2 × ${m}.` },
      { instruction: "Subtract the known base to find the other base, in meters.", answer: `${b2}`, accept: [`${b2} m`], hint: `${2 * m} − ${b1}.` },
    ],
    finalAnswer: { value: `${b2}`, unit: "meters" },
    solutionNarrative: `From $\\frac{b_1 + b_2}{2} = ${m}$, the bases sum to ${2 * m}; subtracting the known base leaves $${2 * m} - ${b1} = ${b2}$ m.`,
  };
};

fill["geo2-trapezoids-3"] = (rng, idx) => {
  const x0 = rng.int(5, 15);
  const k = 2 * rng.int(1, 5);  // even, so the midsegment x0 + k/2 is a whole number
  const m = x0 + k / 2;
  return {
    id: `gen.geo2-trapezoids-3.${idx}`, generated: true, concepts: ["trapezoids-and-midsegments"], difficulty: 3, context: "abstract",
    prompt: `A trapezoid's shorter base is $x$ and its longer base is $x + ${k}$. Its midsegment measures ${m}. Solve for $x$, then give both bases.`,
    steps: [
      { instruction: `The bases sum to twice the midsegment. Write the equation in $x$.`, answer: `2x + ${k} = ${2 * m}`, accept: [`x + x + ${k} = ${2 * m}`, `2x+${k}=${2 * m}`], hint: `$x + (x + ${k}) = 2(${m})$.` },
      { instruction: `Subtract ${k} from both sides.`, answer: `2x = ${2 * m - k}`, accept: [`2x=${2 * m - k}`], hint: `$${2 * m} - ${k}$.` },
      { instruction: "Solve for $x$ (the shorter base).", answer: `${x0}`, accept: [`x=${x0}`], hint: `${2 * m - k} ÷ 2.` },
      { instruction: "Find the longer base.", answer: `${x0 + k}`, accept: [], hint: `$x + ${k} = ${x0} + ${k}$.` },
    ],
    finalAnswer: { value: `${x0 + k}`, unit: "" },
    solutionNarrative: `$x + (x + ${k}) = 2(${m})$ gives $2x + ${k} = ${2 * m}$, so $x = ${x0}$: bases ${x0} and ${x0 + k}, whose average is indeed ${m}.`,
  };
};

// ============================================================================
// geometry.transformations
// ============================================================================

// --- translations-and-reflections ------------------------------------------------

fill["geo2-translate-reflect-1"] = (rng, idx) => {
  const px = nz(rng, 6), py = nz(rng, 6);
  const a = nz(rng, 5), b = nz(rng, 5); // nonzero shift in both directions: image != pre-image
  const qx = px + a, qy = py + b;
  const dirX = a > 0 ? `${a} units right` : `${-a} units left`;
  const dirY = b > 0 ? `${b} units up` : `${-b} units down`;
  return {
    id: `gen.geo2-translate-reflect-1.${idx}`, generated: true, concepts: ["translations-and-reflections"], difficulty: 1, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is translated ${dirX} and ${dirY}. Find the coordinates of the image $P'$.`,
    plot: planePlot(
      [{ x: px, y: py, label: "P", color: "accent" }, { x: qx, y: qy, label: "P'", color: "good" }],
      [{ from: [px, py], to: [qx, qy], color: "dim", dashed: true, arrow: true }],
      `P(${px}, ${py}) slides ${dirX} and ${dirY} to P'.`
    ),
    steps: [
      { instruction: "Find the x-coordinate of the image.", answer: `${qx}`, accept: [`x=${qx}`], hint: `${px} ${a >= 0 ? "+" : "−"} ${Math.abs(a)}.` },
      { instruction: "Find the y-coordinate of the image.", answer: `${qy}`, accept: [`y=${qy}`], hint: `${py} ${b >= 0 ? "+" : "−"} ${Math.abs(b)}.` },
      { instruction: VEC_HOWTO, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `Combine the two coordinates you just found.` },
    ],
    finalAnswer: { value: `(${qx}, ${qy})`, unit: "" },
    solutionNarrative: `A translation adds the shift to each coordinate: $P'(${px} + (${a}), ${py} + (${b})) = P'(${qx}, ${qy})$.`,
  };
};

fill["geo2-translate-reflect-2"] = (rng, idx) => {
  const px = nz(rng, 7), py = nz(rng, 7); // both nonzero: P is never ON the mirror axis
  const axis = rng.pick(["x", "y"]);
  const qx = axis === "x" ? px : -px;
  const qy = axis === "x" ? -py : py;
  const flipped = axis === "x" ? "y" : "x";
  return {
    id: `gen.geo2-translate-reflect-2.${idx}`, generated: true, concepts: ["translations-and-reflections"], difficulty: 2, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is reflected over the ${axis}-axis. Find the coordinates of the image $P'$.`,
    plot: planePlot(
      [{ x: px, y: py, label: "P", color: "accent" }, { x: qx, y: qy, label: "P'", color: "good" }],
      [{ from: [px, py], to: [qx, qy], color: "dim", dashed: true }],
      `P and its mirror image P' across the ${axis}-axis.`
    ),
    steps: [
      { instruction: `Reflecting over the ${axis}-axis changes the sign of which coordinate — x or y?`, answer: flipped, accept: [`${flipped}-coordinate`, `the ${flipped}-coordinate`], hint: `The coordinate measured ACROSS the mirror flips; the one along the mirror stays.` },
      { instruction: VEC_HOWTO, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `Flip the sign of the ${flipped}-coordinate and keep the other.` },
    ],
    finalAnswer: { value: `(${qx}, ${qy})`, unit: "" },
    solutionNarrative: `Reflection over the ${axis}-axis flips the ${flipped}-coordinate: $P(${px}, ${py}) \\to P'(${qx}, ${qy})$.`,
  };
};

fill["geo2-translate-reflect-3"] = (rng, idx) => {
  let px = nz(rng, 7), py = nz(rng, 7);
  if (px === py) py = -py; // P must not lie ON the mirror line y = x (image would equal pre-image)
  const lo = Math.min(px, py, 0) - 1, hi = Math.max(px, py, 0) + 1;
  return {
    id: `gen.geo2-translate-reflect-3.${idx}`, generated: true, concepts: ["translations-and-reflections"], difficulty: 3, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is reflected over the line $y = x$. Find the coordinates of the image $P'$, and decide whether the reflection changes $P$'s distance from the origin.`,
    plot: planePlot(
      [{ x: px, y: py, label: "P", color: "accent" }, { x: py, y: px, label: "P'", color: "good" }],
      [
        { from: [lo, lo], to: [hi, hi], color: "warn", dashed: true, label: "y = x" },
        { from: [px, py], to: [py, px], color: "dim", dashed: true },
      ],
      `Reflecting P over the line y = x swaps its coordinates.`
    ),
    steps: [
      { instruction: `Reflecting over $y = x$ swaps the coordinates. ${VEC_HOWTO}`, answer: vec(py, px), accept: vecAccept(py, px), hint: `$(x, y) \\to (y, x)$.` },
      { instruction: "Does a reflection change a point's distance from the origin? (yes or no)", answer: "no", accept: ["n"], hint: "Reflections are rigid motions — they preserve all distances." },
    ],
    finalAnswer: { value: `(${py}, ${px})`, unit: "" },
    solutionNarrative: `Over $y = x$, coordinates swap: $P(${px}, ${py}) \\to P'(${py}, ${px})$. Reflections are rigid, so the distance from the origin is unchanged.`,
  };
};

// --- rotations --------------------------------------------------------------------

fill["geo2-rotations-1"] = (rng, idx) => {
  const px = nz(rng, 7), py = nz(rng, 7); // never the origin: rotation would be trivial
  return {
    id: `gen.geo2-rotations-1.${idx}`, generated: true, concepts: ["rotations"], difficulty: 1, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is rotated $180^\\circ$ about the origin. Find the coordinates of the image $P'$.`,
    plot: planePlot(
      [{ x: 0, y: 0, label: "O", color: "text" }, { x: px, y: py, label: "P", color: "accent" }, { x: -px, y: -py, label: "P'", color: "good" }],
      [{ from: [px, py], to: [0, 0], color: "dim", dashed: true }, { from: [0, 0], to: [-px, -py], color: "dim", dashed: true }],
      `A 180° rotation about O sends P straight through the origin to P'.`
    ),
    steps: [
      { instruction: "A $180^\\circ$ rotation about the origin flips the sign of BOTH coordinates. Find the x-coordinate of the image.", answer: `${-px}`, accept: [`x=${-px}`], hint: `The opposite of ${px}.` },
      { instruction: "Find the y-coordinate of the image.", answer: `${-py}`, accept: [`y=${-py}`], hint: `The opposite of ${py}.` },
      { instruction: VEC_HOWTO, answer: vec(-px, -py), accept: vecAccept(-px, -py), hint: `$(x, y) \\to (-x, -y)$.` },
    ],
    finalAnswer: { value: `(${-px}, ${-py})`, unit: "" },
    solutionNarrative: `$180^\\circ$ about the origin: $(x, y) \\to (-x, -y)$, so $P(${px}, ${py}) \\to P'(${-px}, ${-py})$.`,
  };
};

fill["geo2-rotations-2"] = (rng, idx) => {
  const px = nz(rng, 7), py = nz(rng, 7);
  const qx = -py, qy = px; // 90° counterclockwise: (x, y) -> (-y, x)
  return {
    id: `gen.geo2-rotations-2.${idx}`, generated: true, concepts: ["rotations"], difficulty: 2, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is rotated $90^\\circ$ counterclockwise about the origin, using the rule $(x, y) \\to (-y, x)$. Find the coordinates of the image $P'$.`,
    plot: planePlot(
      [{ x: 0, y: 0, label: "O", color: "text" }, { x: px, y: py, label: "P", color: "accent" }, { x: qx, y: qy, label: "P'", color: "good" }],
      [{ from: [0, 0], to: [px, py], color: "dim", dashed: true }, { from: [0, 0], to: [qx, qy], color: "dim", dashed: true }],
      `P rotates a quarter turn counterclockwise about O to P'.`
    ),
    steps: [
      { instruction: "Find the x-coordinate of the image (the opposite of the old y).", answer: `${qx}`, accept: [`x=${qx}`], hint: `$-(${py})$.` },
      { instruction: "Find the y-coordinate of the image (the old x).", answer: `${qy}`, accept: [`y=${qy}`], hint: `It is just ${px}.` },
      { instruction: VEC_HOWTO, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `$(x, y) \\to (-y, x)$.` },
    ],
    finalAnswer: { value: `(${qx}, ${qy})`, unit: "" },
    solutionNarrative: `$90^\\circ$ CCW: $(x, y) \\to (-y, x)$, so $P(${px}, ${py}) \\to P'(${qx}, ${qy})$.`,
  };
};

fill["geo2-rotations-3"] = (rng, idx) => {
  const px = nz(rng, 7), py = nz(rng, 7);
  const qx = py, qy = -px; // 270° counterclockwise = 90° clockwise: (x, y) -> (y, -x)
  return {
    id: `gen.geo2-rotations-3.${idx}`, generated: true, concepts: ["rotations"], difficulty: 3, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is rotated $270^\\circ$ counterclockwise about the origin. Find the image $P'$. (Hint: think about the equivalent clockwise rotation.)`,
    plot: planePlot(
      [{ x: 0, y: 0, label: "O", color: "text" }, { x: px, y: py, label: "P", color: "accent" }, { x: qx, y: qy, label: "P'", color: "good" }],
      [{ from: [0, 0], to: [px, py], color: "dim", dashed: true }, { from: [0, 0], to: [qx, qy], color: "dim", dashed: true }],
      `A 270° counterclockwise turn about O lands P at P' — the same as 90° clockwise.`
    ),
    steps: [
      { instruction: "A $270^\\circ$ counterclockwise rotation equals how many degrees CLOCKWISE?", answer: "90", accept: ["90 degrees"], hint: "The two must total a full turn: $360 - 270$." },
      { instruction: `That rotation uses the rule $(x, y) \\to (y, -x)$. ${VEC_HOWTO}`, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `New x is the old y (${py}); new y is the opposite of the old x.` },
    ],
    finalAnswer: { value: `(${qx}, ${qy})`, unit: "" },
    solutionNarrative: `$270^\\circ$ CCW is the same as $90^\\circ$ CW: $(x, y) \\to (y, -x)$, so $P(${px}, ${py}) \\to P'(${qx}, ${qy})$.`,
  };
};

// --- dilations ----------------------------------------------------------------------

fill["geo2-dilations-1"] = (rng, idx) => {
  const k = rng.int(2, 4); // never 1: the dilation actually moves the point
  const px = nz(rng, 5), py = nz(rng, 5);
  const qx = k * px, qy = k * py;
  return {
    id: `gen.geo2-dilations-1.${idx}`, generated: true, concepts: ["dilations"], difficulty: 1, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is dilated from the origin with scale factor ${k}. Find the coordinates of the image $P'$.`,
    plot: planePlot(
      [{ x: 0, y: 0, label: "O", color: "text" }, { x: px, y: py, label: "P", color: "accent" }, { x: qx, y: qy, label: "P'", color: "good" }],
      [{ from: [0, 0], to: [qx, qy], color: "dim", dashed: true }],
      `The dilation stretches P along the ray from O, ${k} times as far, to P'.`
    ),
    steps: [
      { instruction: "Multiply the x-coordinate by the scale factor.", answer: `${qx}`, accept: [`x=${qx}`], hint: `${k} × ${px}.` },
      { instruction: "Multiply the y-coordinate by the scale factor.", answer: `${qy}`, accept: [`y=${qy}`], hint: `${k} × ${py}.` },
      { instruction: VEC_HOWTO, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `$(x, y) \\to (${k}x, ${k}y)$.` },
    ],
    finalAnswer: { value: `(${qx}, ${qy})`, unit: "" },
    solutionNarrative: `A dilation from the origin multiplies both coordinates by $k = ${k}$: $P(${px}, ${py}) \\to P'(${qx}, ${qy})$.`,
  };
};

fill["geo2-dilations-2"] = (rng, idx) => {
  const k = rng.pick([2, 3, 4, 5]); // integer > 1: never the identity dilation
  const L = rng.int(3, 8);
  const s = rng.int(2, 9);
  const obj = rng.pick(["logo", "blueprint", "phone-screen icon", "map symbol"]);
  return {
    id: `gen.geo2-dilations-2.${idx}`, generated: true, concepts: ["dilations"], difficulty: 2, context: "applied",
    prompt: `A designer dilates a ${obj}. A segment of length ${L} mm in the pre-image maps to a segment of length ${k * L} mm in the image. Find the scale factor, then the image length of another segment measuring ${s} mm.`,
    steps: [
      { instruction: "Scale factor = image length ÷ pre-image length. Find it.", answer: `${k}`, accept: [`k=${k}`, `${k * L}/${L}`], hint: `${k * L} ÷ ${L}.` },
      { instruction: `Every length is multiplied by the scale factor. Find the image of the ${s} mm segment, in mm.`, answer: `${k * s}`, accept: [`${k * s} mm`], hint: `${s} × ${k}.` },
    ],
    finalAnswer: { value: `${k * s}`, unit: "mm" },
    solutionNarrative: `$k = ${k * L}/${L} = ${k}$, so the ${s} mm segment maps to $${s} \\times ${k} = ${k * s}$ mm.`,
  };
};

fill["geo2-dilations-3"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const P0 = rng.int(8, 20);
  const A0 = rng.int(3, 12);
  const obj = rng.pick(["triangular sail design", "triangular park plot", "pennant flag design", "triangular solar panel layout"]);
  return {
    id: `gen.geo2-dilations-3.${idx}`, generated: true, concepts: ["dilations"], difficulty: 3, context: "applied",
    prompt: `A ${obj} with perimeter ${P0} m and area ${A0} m² is dilated with scale factor ${k}. Find the image's perimeter, the factor by which the AREA grows, and the image's area.`,
    steps: [
      { instruction: "Perimeter is a length, so it scales by $k$. Find the image's perimeter, in meters.", answer: `${k * P0}`, accept: [`${k * P0} m`], hint: `${P0} × ${k}.` },
      { instruction: "By what factor does the area grow?", answer: `${k * k}`, accept: [`k^2=${k * k}`, `${k}^2`], hint: `Area scales by $k^2 = ${k}^2$.` },
      { instruction: "Find the image's area, in square meters.", answer: `${A0 * k * k}`, accept: [`${A0 * k * k} m^2`], hint: `${A0} × ${k * k}.` },
    ],
    finalAnswer: { value: `${A0 * k * k}`, unit: "square meters" },
    solutionNarrative: `Lengths scale by ${k}, so the perimeter becomes ${k * P0} m; area scales by $k^2 = ${k * k}$, so it becomes $${A0} \\times ${k * k} = ${A0 * k * k}$ m² — not ${A0 * k}.`,
  };
};

// --- compositions-and-identify --------------------------------------------------------

const MENU = "Answer with one of: translation, reflection, rotation, dilation.";
const MENU_ACCEPT = {
  translation: ["a translation", "translate", "slide"],
  reflection: ["a reflection", "reflect", "flip"],
  rotation: ["a rotation", "rotate", "turn"],
  dilation: ["a dilation", "dilate", "scaling"],
};

fill["geo2-compositions-1"] = (rng, idx) => {
  const type = rng.pick(["translation", "reflection", "rotation", "dilation"]);
  const px = nz(rng, 5), py = nz(rng, 5);
  let rule, qx, qy;
  if (type === "translation") {
    const a = nz(rng, 5), b = nz(rng, 5);
    rule = `(x, y) \\to (x ${a >= 0 ? "+" : "-"} ${Math.abs(a)}, y ${b >= 0 ? "+" : "-"} ${Math.abs(b)})`;
    qx = px + a; qy = py + b;
  } else if (type === "reflection") {
    const axis = rng.pick(["x", "y"]);
    rule = axis === "x" ? "(x, y) \\to (x, -y)" : "(x, y) \\to (-x, y)";
    qx = axis === "x" ? px : -px; qy = axis === "x" ? -py : py;
  } else if (type === "rotation") {
    rule = "(x, y) \\to (-x, -y)";
    qx = -px; qy = -py;
  } else {
    const k = rng.int(2, 4);
    rule = `(x, y) \\to (${k}x, ${k}y)`;
    qx = k * px; qy = k * py;
  }
  return {
    id: `gen.geo2-compositions-1.${idx}`, generated: true, concepts: ["compositions-and-identify"], difficulty: 1, context: "abstract",
    prompt: `A transformation of the plane follows the rule $${rule}$. Apply it to the point $P(${px}, ${py})$, then identify the type of transformation.`,
    steps: [
      { instruction: `Apply the rule to $P(${px}, ${py})$. ${VEC_HOWTO}`, answer: vec(qx, qy), accept: vecAccept(qx, qy), hint: `Substitute $x = ${px}$ and $y = ${py}$ into the rule.` },
      { instruction: `Which single transformation is this? ${MENU}`, answer: type, accept: MENU_ACCEPT[type], hint: type === "translation" ? "Every point slides by the same amounts." : type === "reflection" ? "Exactly one coordinate flips sign — a mirror flip over an axis." : type === "rotation" ? "Both signs flip: a half-turn about the origin." : "Both coordinates are MULTIPLIED by the same factor." },
    ],
    finalAnswer: { value: type, unit: "" },
    solutionNarrative: `The rule sends $P(${px}, ${py})$ to $(${qx}, ${qy})$; the mapping is a ${type}.`,
  };
};

fill["geo2-compositions-2"] = (rng, idx) => {
  const px = nz(rng, 5), py = nz(rng, 5);
  const a = nz(rng, 5);
  const ty = (py > 0 ? -1 : 1) * rng.int(1, 5); // translated y is nonzero AND differs from py (opposite sign)
  const b = ty - py;                             // nonzero by construction
  const mx = px + a;                             // intermediate point (mx, ty), never on the x-axis
  const dirX = a > 0 ? `${a} units right` : `${-a} units left`;
  const dirY = b > 0 ? `${b} units up` : `${-b} units down`;
  return {
    id: `gen.geo2-compositions-2.${idx}`, generated: true, concepts: ["compositions-and-identify"], difficulty: 2, context: "abstract",
    prompt: `The point $P(${px}, ${py})$ is first translated ${dirX} and ${dirY}, and the result is then reflected over the x-axis. Find the intermediate point $P'$ and the final image $P''$.`,
    plot: planePlot(
      [{ x: px, y: py, label: "P", color: "accent" }, { x: mx, y: ty, label: "P'", color: "warn" }, { x: mx, y: -ty, label: "P''", color: "good" }],
      [
        { from: [px, py], to: [mx, ty], color: "dim", dashed: true, arrow: true },
        { from: [mx, ty], to: [mx, -ty], color: "dim", dashed: true, arrow: true },
      ],
      `P slides to P', then flips across the x-axis to P''.`
    ),
    steps: [
      { instruction: `First the translation. ${VEC_HOWTO}`, answer: vec(mx, ty), accept: vecAccept(mx, ty), hint: `$(${px} + (${a}), ${py} + (${b}))$.` },
      { instruction: `Now reflect $P'$ over the x-axis. ${VEC_HOWTO}`, answer: vec(mx, -ty), accept: vecAccept(mx, -ty), hint: "Keep x; flip the sign of y." },
    ],
    finalAnswer: { value: `(${mx}, ${-ty})`, unit: "" },
    solutionNarrative: `Translation: $P' = (${px} + (${a}), ${py} + (${b})) = (${mx}, ${ty})$. Reflection over the x-axis flips y: $P'' = (${mx}, ${-ty})$. Order matters — reflecting first would end elsewhere.`,
  };
};

fill["geo2-compositions-3"] = (rng, idx) => {
  const type = rng.pick(["reflection-x", "reflection-y", "rotation", "dilation"]);
  const p = nz(rng, 6), q = nz(rng, 6);
  let r = nz(rng, 6), s = nz(rng, 6);
  if (r === p && s === q) r = -r; // two DISTINCT pre-image points
  const k = rng.int(2, 4);
  const img = (x, y) =>
    type === "reflection-x" ? [x, -y] :
    type === "reflection-y" ? [-x, y] :
    type === "rotation" ? [-x, -y] : [k * x, k * y];
  const [i1x, i1y] = img(p, q);
  const [i2x, i2y] = img(r, s);
  const word = type.startsWith("reflection") ? "reflection" : type;
  const steps = [];
  if (type === "rotation") {
    steps.push({ instruction: "Both coordinates of each point change sign. A rotation about the origin by how many degrees does that?", answer: "180", accept: ["180 degrees"], hint: "A half-turn sends $(x, y)$ to $(-x, -y)$." });
  } else if (type === "dilation") {
    steps.push({ instruction: "Each image coordinate is the pre-image coordinate times the same number. Find that scale factor.", answer: `${k}`, accept: [`k=${k}`], hint: `${i1x} ÷ ${p}.` });
  } else {
    const axis = type === "reflection-x" ? "x" : "y";
    const flipped = type === "reflection-x" ? "y" : "x";
    steps.push({ instruction: "In both pairs, exactly one coordinate changes sign. Which one — x or y?", answer: flipped, accept: [`${flipped}-coordinate`, `the ${flipped}-coordinate`], hint: `Compare $(${p}, ${q})$ with $(${i1x}, ${i1y})$ coordinate by coordinate.` });
    steps.push({ instruction: "Which axis is the mirror line — x or y?", answer: axis, accept: [`${axis}-axis`, `the ${axis}-axis`], hint: `Flipping the ${flipped}-coordinate means the mirror is the ${axis}-axis.` });
  }
  steps.push({ instruction: `Which single transformation maps the pre-image to the image? ${MENU}`, answer: word, accept: MENU_ACCEPT[word], hint: type === "dilation" ? "Distances from the origin were multiplied — the shape changed size." : "The shape kept its size, so it is a rigid motion." });
  return {
    id: `gen.geo2-compositions-3.${idx}`, generated: true, concepts: ["compositions-and-identify"], difficulty: 3, context: "abstract",
    prompt: `A single transformation maps $A(${p}, ${q}) \\to A'(${i1x}, ${i1y})$ and $B(${r}, ${s}) \\to B'(${i2x}, ${i2y})$. Identify it.`,
    plot: planePlot(
      [
        { x: p, y: q, label: "A", color: "accent" }, { x: r, y: s, label: "B", color: "accent" },
        { x: i1x, y: i1y, label: "A'", color: "good" }, { x: i2x, y: i2y, label: "B'", color: "good" },
      ],
      [
        { from: [p, q], to: [i1x, i1y], color: "dim", dashed: true },
        { from: [r, s], to: [i2x, i2y], color: "dim", dashed: true },
      ],
      `Pre-image points A, B and their images A', B' under one transformation.`
    ),
    steps,
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: type === "rotation"
      ? `Both coordinates flip sign in both pairs — the rule $(x, y) \\to (-x, -y)$ — so this is a $180^\\circ$ rotation about the origin.`
      : type === "dilation"
        ? `Each coordinate is multiplied by ${k} — the rule $(x, y) \\to (${k}x, ${k}y)$ — so this is a dilation with scale factor ${k}.`
        : `Exactly one coordinate flips sign in both pairs, so this is a reflection over the ${type === "reflection-x" ? "x" : "y"}-axis.`,
  };
};
