// gen-geo-pool-fill.js
// Thin-pool eliminator pack for the geometry subject (templates prefixed gpl-).
// Each template targets ONE (topic, keyConcept, difficulty) pool that previously
// had a single seed problem and no generator, across six topics:
//   geometry.angles-and-lines, geometry.perimeter-and-area,
//   geometry.pythagorean-theorem, geometry.right-triangle-trigonometry,
//   geometry.surface-area-and-volume, geometry.triangles
// Self-contained pack: exports a `fill` map of template-name -> (rng, idx) =>
// problem, matching js/generator.js's registry shape (merged via Object.assign).
// Deterministic: numbers come only from the passed rng, and every template
// returns a FIXED difficulty + concepts list so single-probe tier detection is
// reliable. Clean numbers by construction: Pythagorean triples for lengths,
// angle sets that sum exactly, even bases where halving must stay whole, and
// pi-as-3.14 arithmetic (this subject's seed convention) that lands on exact
// 2-decimal values.

// Pythagorean triples [leg, leg, hypotenuse] — primitives plus friendly multiples.
const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];
// Primitive triples only (so trig-ratio fractions are already in lowest terms).
const PRIM_TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

const deg = (d) => (d * Math.PI) / 180;
// Trim a product like 3.14 * n to its exact short decimal ("62.8", "339.12").
const p314 = (x) => `${Math.round(x * 100) / 100}`;
// 1-decimal rounding for trig results.
const r1 = (x) => x.toFixed(1);

export const fill = {};

// ============================================================================
// geometry.angles-and-lines
// ============================================================================

// --- angle-pairs d3: algebraic vertical angles / linear pair -----------------
fill["gpl-angle-pairs-d3"] = (rng, idx) => {
  const kind = rng.pick(["vertical", "linear"]);
  const base = { id: `gen.gpl-angle-pairs-d3.${idx}`, generated: true, concepts: ["angle-pairs"], difficulty: 3, context: "abstract" };
  if (kind === "vertical") {
    const a = rng.int(2, 4);      // coefficient on the left angle
    const x = rng.int(10, 35);
    const b = rng.int(1, 12);
    const c = (a - 1) * x + b;    // makes ax + b = x + c hold exactly
    const ang = a * x + b;        // 21..152, never degenerate
    return { ...base,
      prompt: `Two lines cross. One angle measures $(${a}x + ${b})^\\circ$ and the angle vertically opposite it measures $(x + ${c})^\\circ$. Find $x$, then the measure of that angle.`,
      steps: [
        { instruction: "Vertical angles are equal. Set the two expressions equal.", answer: `${a}x + ${b} = x + ${c}`, accept: [`${a}x+${b}=x+${c}`], hint: `Equal vertical angles: $${a}x + ${b} = x + ${c}$.` },
        { instruction: "Solve for $x$.", answer: `x = ${x}`, accept: [`x=${x}`, `${x}`], hint: `Subtract $x$ and ${b} from both sides: $${a - 1}x = ${c - b}$.` },
        { instruction: "Substitute to find the angle measure (degrees).", answer: `${ang}`, accept: [`${ang} degrees`], hint: `$${a}(${x}) + ${b} = ${ang}$, and check $${x} + ${c} = ${ang}$.` },
      ],
      finalAnswer: { value: `${ang}`, unit: "degrees" },
      solutionNarrative: `Vertical angles are equal: $${a}x + ${b} = x + ${c}$ gives $${a - 1}x = ${c - b}$, so $x = ${x}$. The angle is $${a}(${x}) + ${b} = ${ang}^\\circ$ (and $${x} + ${c} = ${ang}$ confirms it).`,
    };
  }
  // linear pair: (ax + b) + (x + d) = 180
  const a = rng.int(2, 4);
  const x = rng.int(10, 30);
  let b = rng.int(1, 15);
  if (a * x + b === 90) b += 1;      // never a 90/90 tie — "larger angle" must exist
  const ang1 = a * x + b;            // 21..136, != 90
  const d = 180 - ang1 - x;          // >= 15 by construction
  const ang2 = 180 - ang1;
  return { ...base,
    prompt: `Two angles form a linear pair (they sit side by side on a straight line). One measures $(${a}x + ${b})^\\circ$ and the other $(x + ${d})^\\circ$. Find $x$, then the measure of the larger angle.`,
    steps: [
      { instruction: "A linear pair sums to $180^\\circ$. Write the equation.", answer: `${a}x + ${b} + x + ${d} = 180`, accept: [`${a}x+${b}+x+${d}=180`, `${a + 1}x + ${b + d} = 180`], hint: "Add the two expressions and set the total equal to 180." },
      { instruction: "Solve for $x$.", answer: `x = ${x}`, accept: [`x=${x}`, `${x}`], hint: `Combine: $${a + 1}x + ${b + d} = 180$, so $${a + 1}x = ${180 - b - d}$.` },
      { instruction: "Substitute to find the LARGER of the two angles (degrees).", answer: `${Math.max(ang1, ang2)}`, accept: [`${Math.max(ang1, ang2)} degrees`], hint: `The angles are $${a}(${x}) + ${b} = ${ang1}^\\circ$ and $${x} + ${d} = ${ang2}^\\circ$.` },
    ],
    finalAnswer: { value: `${Math.max(ang1, ang2)}`, unit: "degrees" },
    solutionNarrative: `The pair sums to $180^\\circ$: $${a + 1}x + ${b + d} = 180$ gives $x = ${x}$. The angles are $${ang1}^\\circ$ and $${ang2}^\\circ$; the larger is $${Math.max(ang1, ang2)}^\\circ$.`,
  };
};

// --- angle-relationships-applied d3: mitre cuts from the polygon itself ------
const MITRE_POLY = [
  { n: 5, name: "pentagonal (5-sided)" },
  { n: 6, name: "hexagonal (6-sided)" },
  { n: 9, name: "nonagonal (9-sided)" },
  { n: 10, name: "decagonal (10-sided)" },
  { n: 12, name: "12-sided" },
];
fill["gpl-angle-applied-d3"] = (rng, idx) => {
  const poly = rng.pick(MITRE_POLY);
  const obj = rng.pick(["picture frame", "mirror frame", "raised planter box", "decorative window frame"]);
  const sum = (poly.n - 2) * 180;
  const corner = sum / poly.n;
  const mitre = corner / 2;
  return {
    id: `gen.gpl-angle-applied-d3.${idx}`, generated: true, concepts: ["angle-relationships-applied"], difficulty: 3, context: "applied",
    prompt: `A carpenter builds a regular ${poly.name} ${obj}. To join two boards cleanly at each corner, each board gets a mitre cut equal to HALF the corner angle. Work out the mitre angle from scratch.`,
    steps: [
      { instruction: `First find the sum of the interior angles of a ${poly.n}-sided polygon, in degrees.`, answer: `${sum}`, accept: [`${sum} degrees`], hint: `$(n - 2) \\times 180 = ${poly.n - 2} \\times 180$.` },
      { instruction: `The polygon is regular, so its ${poly.n} corners are equal. Find each corner angle (degrees).`, answer: `${corner}`, accept: [`${corner} degrees`], hint: `${sum} ÷ ${poly.n}.` },
      { instruction: "Each mitre cut is half the corner angle. Find it (degrees).", answer: `${mitre}`, accept: [`${mitre} degrees`], hint: `${corner} ÷ 2.` },
    ],
    finalAnswer: { value: `${mitre}`, unit: "degrees" },
    solutionNarrative: `The interior angles sum to $(${poly.n} - 2) \\times 180 = ${sum}^\\circ$, so each corner of the regular shape is $${sum}/${poly.n} = ${corner}^\\circ$. Splitting that between the two boards gives a mitre of $${corner}/2 = ${mitre}^\\circ$.`,
  };
};

// --- parallel-lines-transversal d1: name the relationship, state the angle ---
const TRANSVERSAL_RELS = [
  { rel: "corresponding angle", equal: true },
  { rel: "alternate interior angle", equal: true },
  { rel: "alternate exterior angle", equal: true },
  { rel: "same-side (co-interior) angle", equal: false },
];
fill["gpl-transversal-d1"] = (rng, idx) => {
  let t = rng.int(35, 144);
  if (t >= 90) t += 1; // skip the 90-degree special case
  const r = rng.pick(TRANSVERSAL_RELS);
  const ans = r.equal ? t : 180 - t;
  return {
    id: `gen.gpl-transversal-d1.${idx}`, generated: true, concepts: ["parallel-lines-transversal"], difficulty: 1, context: "abstract",
    prompt: `A transversal crosses two parallel lines. One angle measures $${t}^\\circ$. Find its ${r.rel} at the other crossing.`,
    steps: [
      { instruction: `Between parallel lines, is a ${r.rel} pair equal or supplementary?`, answer: r.equal ? "equal" : "supplementary", accept: r.equal ? ["congruent", "the same"] : ["they sum to 180", "supplementary angles"], hint: r.equal ? "This pair makes an F/Z-style pattern — the angles match." : "Same-side interior angles make a C-style pattern — they add to $180^\\circ$." },
      { instruction: "So what is the angle's measure, in degrees?", answer: `${ans}`, accept: [`${ans} degrees`], hint: r.equal ? `It equals $${t}^\\circ$.` : `$180 - ${t}$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "degrees" },
    solutionNarrative: r.equal
      ? `${r.rel[0].toUpperCase() + r.rel.slice(1)}s between parallel lines are equal, so it also measures $${t}^\\circ$.`
      : `Same-side interior angles between parallel lines are supplementary: $180 - ${t} = ${ans}^\\circ$.`,
  };
};

// --- angle-arithmetic d1: missing angle on a line / around a point -----------
fill["gpl-angle-arith-d1"] = (rng, idx) => {
  const kind = rng.pick(["line", "point"]);
  const base = { id: `gen.gpl-angle-arith-d1.${idx}`, generated: true, concepts: ["angle-arithmetic"], difficulty: 1, context: "abstract" };
  if (kind === "line") {
    const ans = rng.int(20, 100);
    const a = rng.int(15, 180 - ans - 15);
    const b = 180 - ans - a;
    return { ...base,
      prompt: `Three angles sit side by side along a straight line. Two of them measure $${a}^\\circ$ and $${b}^\\circ$. Find the third angle.`,
      steps: [
        { instruction: "Add the two known angles (degrees).", answer: `${a + b}`, accept: [], hint: `$${a} + ${b}$.` },
        { instruction: "Angles on a straight line sum to $180^\\circ$. Subtract to find the third angle (degrees).", answer: `${ans}`, accept: [`${ans} degrees`], hint: `$180 - ${a + b}$.` },
      ],
      finalAnswer: { value: `${ans}`, unit: "degrees" },
      solutionNarrative: `Angles on a straight line total $180^\\circ$: $180 - ${a} - ${b} = ${ans}^\\circ$.`,
    };
  }
  const ans = rng.int(60, 100);
  const a = rng.int(70, 110);
  const b = rng.int(70, 110);
  const c = 360 - ans - a - b; // 40..160 by construction — no reflex givens
  return { ...base,
    prompt: `Four angles meet around a single point. Three of them measure $${a}^\\circ$, $${b}^\\circ$, and $${c}^\\circ$. Find the fourth angle.`,
    steps: [
      { instruction: "Add the three known angles (degrees).", answer: `${a + b + c}`, accept: [], hint: `$${a} + ${b} + ${c}$.` },
      { instruction: "Angles around a point sum to $360^\\circ$. Subtract to find the fourth angle (degrees).", answer: `${ans}`, accept: [`${ans} degrees`], hint: `$360 - ${a + b + c}$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "degrees" },
    solutionNarrative: `Angles around a point total $360^\\circ$: $360 - ${a} - ${b} - ${c} = ${ans}^\\circ$.`,
  };
};

// ============================================================================
// geometry.perimeter-and-area
// ============================================================================

// --- triangle-parallelogram-trapezoid d3: work BACKWARD from area ------------
fill["gpl-tri-trap-d3"] = (rng, idx) => {
  const kind = rng.pick(["trapezoid", "triangle"]);
  const base = { id: `gen.gpl-tri-trap-d3.${idx}`, generated: true, concepts: ["triangle-parallelogram-trapezoid"], difficulty: 3, context: "applied" };
  if (kind === "trapezoid") {
    const b1 = rng.int(6, 14);
    const b2 = b1 + 2 * rng.int(1, 4); // sum stays even, bases distinct
    const h = rng.int(4, 12);
    const avg = (b1 + b2) / 2;
    const A = avg * h;
    const obj = rng.pick(["garden bed", "deck section", "counter top", "patio slab"]);
    return { ...base,
      prompt: `A trapezoid-shaped ${obj} has parallel sides of ${b2} ft and ${b1} ft and an area of ${A} square feet. Work backward to find the distance between the parallel sides (the height).`,
      steps: [
        { instruction: "Add the two parallel sides $b_1 + b_2$ (feet).", answer: `${b1 + b2}`, accept: [`${b1 + b2} ft`], hint: `$${b2} + ${b1}$.` },
        { instruction: "In $A = \\tfrac{1}{2}(b_1 + b_2)h$, the factor $\\tfrac{1}{2}(b_1 + b_2)$ is the average of the bases. Compute it.", answer: `${avg}`, accept: [`${avg} ft`], hint: `${b1 + b2} ÷ 2.` },
        { instruction: `Solve $${A} = ${avg} \\times h$ for the height $h$ (feet).`, answer: `${h}`, accept: [`h=${h}`, `${h} ft`], hint: `${A} ÷ ${avg}.` },
      ],
      finalAnswer: { value: `${h}`, unit: "feet" },
      solutionNarrative: `$b_1 + b_2 = ${b1 + b2}$, so $A = ${avg}h$. Then $h = ${A}/${avg} = ${h}$ ft.`,
    };
  }
  const b = 2 * rng.int(3, 8); // even base
  const h = rng.int(4, 12);
  const A = (b * h) / 2;
  const obj = rng.pick(["sail", "banner", "gable wall", "traffic-island planting"]);
  return { ...base,
    prompt: `A triangular ${obj} has a base of ${b} ft and an area of ${A} square feet. Work backward to find its height.`,
    steps: [
      { instruction: "Double the area to undo the $\\tfrac{1}{2}$ in $A = \\tfrac{1}{2}bh$.", answer: `${2 * A}`, accept: [], hint: `$2 \\times ${A}$.` },
      { instruction: `Now $${2 * A} = ${b} \\times h$. Solve for the height $h$ (feet).`, answer: `${h}`, accept: [`h=${h}`, `${h} ft`], hint: `${2 * A} ÷ ${b}.` },
    ],
    finalAnswer: { value: `${h}`, unit: "feet" },
    solutionNarrative: `From $A = \\tfrac{1}{2}bh$: $2A = bh$, so $h = ${2 * A}/${b} = ${h}$ ft.`,
  };
};

// --- circle-circumference-area d3: circumference given, recover r, find area -
fill["gpl-circle-d3"] = (rng, idx) => {
  const r = rng.int(4, 12);
  const C = p314(6.28 * r);
  const A = p314(3.14 * r * r);
  const obj = rng.pick(["circular pond", "round fire-pit ring", "circular rug", "round splash pad"]);
  return {
    id: `gen.gpl-circle-d3.${idx}`, generated: true, concepts: ["circle-circumference-area"], difficulty: 3, context: "applied",
    prompt: `The edging around a ${obj} measures ${C} ft — that is its circumference. Using $\\pi \\approx 3.14$, work backward to the radius, then find the area inside.`,
    steps: [
      { instruction: `Circumference is $C = 2\\pi r \\approx 6.28r$. Solve $${C} = 6.28r$ for the radius $r$ (feet).`, answer: `${r}`, accept: [`r=${r}`, `${r} ft`], hint: `${C} ÷ 6.28.` },
      { instruction: "Square the radius.", answer: `${r * r}`, accept: [], hint: `$${r}^2$.` },
      { instruction: "Area: $A = \\pi r^2 \\approx 3.14 \\times r^2$. Compute it (square feet).", answer: A, accept: [], hint: `$3.14 \\times ${r * r}$.` },
    ],
    finalAnswer: { value: A, unit: "square feet" },
    solutionNarrative: `$r = ${C}/6.28 = ${r}$ ft. Then $A = 3.14 \\times ${r}^2 = 3.14 \\times ${r * r} = ${A}$ ft².`,
  };
};

// --- circle-circumference-area d1: one direct formula --------------------------
fill["gpl-circle-d1"] = (rng, idx) => {
  const kind = rng.pick(["circumference", "area"]);
  const r = rng.int(3, 12);
  const obj = rng.pick(["circular tabletop", "round mirror", "circular trampoline", "round pizza pan"]);
  const base = { id: `gen.gpl-circle-d1.${idx}`, generated: true, concepts: ["circle-circumference-area"], difficulty: 1, context: "applied" };
  if (kind === "circumference") {
    const C = p314(6.28 * r);
    return { ...base,
      prompt: `A ${obj} has a radius of ${r} inches. Find its circumference. Use $\\pi \\approx 3.14$.`,
      steps: [
        { instruction: "First find the diameter (inches).", answer: `${2 * r}`, accept: [`d=${2 * r}`], hint: `$2 \\times ${r}$.` },
        { instruction: "Circumference: $C = \\pi d \\approx 3.14 \\times d$. Compute it (inches).", answer: C, accept: [], hint: `$3.14 \\times ${2 * r}$.` },
      ],
      finalAnswer: { value: C, unit: "inches" },
      solutionNarrative: `$d = 2r = ${2 * r}$, so $C = 3.14 \\times ${2 * r} = ${C}$ inches.`,
    };
  }
  const A = p314(3.14 * r * r);
  return { ...base,
    prompt: `A ${obj} has a radius of ${r} inches. Find its area. Use $\\pi \\approx 3.14$.`,
    steps: [
      { instruction: "Square the radius.", answer: `${r * r}`, accept: [], hint: `$${r}^2 = ${r} \\times ${r}$.` },
      { instruction: "Area: $A = \\pi r^2 \\approx 3.14 \\times r^2$. Compute it (square inches).", answer: A, accept: [], hint: `$3.14 \\times ${r * r}$.` },
    ],
    finalAnswer: { value: A, unit: "square inches" },
    solutionNarrative: `$A = 3.14 \\times ${r}^2 = 3.14 \\times ${r * r} = ${A}$ square inches.`,
  };
};

// --- composite-and-applied d1: area times unit price ---------------------------
const COST_CTX = [
  { job: "laying sod in a", surface: "backyard", unit: "ft", item: "sod" },
  { job: "carpeting a", surface: "living room", unit: "ft", item: "carpet" },
  { job: "tiling a", surface: "kitchen wall", unit: "ft", item: "tile" },
  { job: "painting a", surface: "mural wall", unit: "ft", item: "paint coverage" },
];
fill["gpl-composite-d1"] = (rng, idx) => {
  const ctx = rng.pick(COST_CTX);
  const L = rng.int(8, 18);
  const W = rng.int(6, 12);
  const p = rng.int(2, 9);
  const area = L * W;
  const cost = area * p;
  return {
    id: `gen.gpl-composite-d1.${idx}`, generated: true, concepts: ["composite-and-applied"], difficulty: 1, context: "applied",
    prompt: `You are ${ctx.job} ${L} ${ctx.unit} by ${W} ${ctx.unit} ${ctx.surface}. The ${ctx.item} costs \\$${p} per square foot. What is the total cost?`,
    steps: [
      { instruction: "Find the area (length × width).", answer: `${area}`, accept: [`${area} ft^2`, `${area} square feet`], hint: `$${L} \\times ${W}$.` },
      { instruction: "Multiply the area by the price per square foot to get the cost (dollars).", answer: `${cost}`, accept: [`${cost} dollars`, `\\$${cost}`], hint: `$${area} \\times ${p}$.` },
    ],
    finalAnswer: { value: `${cost}`, unit: "dollars" },
    solutionNarrative: `Area $= ${L} \\times ${W} = ${area}$ ft²; cost $= ${area} \\times \\$${p} = \\$${cost}$.`,
  };
};

// ============================================================================
// geometry.pythagorean-theorem
// ============================================================================

// --- find-hypotenuse d3: diagonal shortcut vs walking two sides ---------------
fill["gpl-hypotenuse-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const k = c < 20 ? rng.pick([1, 2]) : 1; // keep numbers sane for big triples
  const [A, B, C] = [a * k, b * k, c * k];
  const place = rng.pick(["rectangular park", "rectangular parking lot", "rectangular field", "rectangular plaza"]);
  const saved = A + B - C;
  return {
    id: `gen.gpl-hypotenuse-d3.${idx}`, generated: true, concepts: ["find-hypotenuse"], difficulty: 3, context: "applied",
    prompt: `A ${place} is ${A} m by ${B} m. You can walk along its two sides from one corner to the opposite corner, or cut straight across the diagonal. How much distance does the diagonal shortcut save?`,
    steps: [
      { instruction: "The two sides are the legs of a right triangle. Add their squares.", answer: `${A * A + B * B}`, accept: [], hint: `$${A}^2 + ${B}^2 = ${A * A} + ${B * B}$.` },
      { instruction: "Take the square root to find the diagonal (meters).", answer: `${C}`, accept: [`c=${C}`, `${C} m`], hint: `$\\sqrt{${A * A + B * B}}$ — it comes out whole.` },
      { instruction: `Walking the two sides covers $${A} + ${B} = ${A + B}$ m. How many meters does the diagonal save?`, answer: `${saved}`, accept: [`${saved} m`, `${saved} meters`], hint: `$${A + B} - ${C}$.` },
    ],
    finalAnswer: { value: `${saved}`, unit: "meters" },
    solutionNarrative: `The diagonal is $\\sqrt{${A}^2 + ${B}^2} = \\sqrt{${A * A + B * B}} = ${C}$ m — the $(${A}, ${B}, ${C})$ right triangle. The two sides total ${A + B} m, so the shortcut saves $${A + B} - ${C} = ${saved}$ m.`,
  };
};

// --- distance-between-points d3: negative coordinates, full formula -----------
fill["gpl-distance-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(PRIM_TRIPLES.slice(0, 4)); // keep coordinates readable
  const x1 = rng.int(-9, -1);
  const y1 = rng.int(-9, -1);
  const x2 = x1 + a;
  const y2 = y1 + b;
  return {
    id: `gen.gpl-distance-d3.${idx}`, generated: true, concepts: ["distance-between-points"], difficulty: 3, context: "abstract",
    prompt: `Find the distance between the points $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    steps: [
      { instruction: "Find the horizontal gap, $x_2 - x_1$.", answer: `${a}`, accept: [], hint: `$${x2} - (${x1})$ — subtracting a negative adds.` },
      { instruction: "Find the vertical gap, $y_2 - y_1$.", answer: `${b}`, accept: [], hint: `$${y2} - (${y1})$.` },
      { instruction: "Add the squares of the gaps.", answer: `${a * a + b * b}`, accept: [], hint: `$${a}^2 + ${b}^2 = ${a * a} + ${b * b}$.` },
      { instruction: "Take the square root to find the distance.", answer: `${c}`, accept: [`d=${c}`], hint: `$\\sqrt{${a * a + b * b}}$ — it comes out whole.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `Gaps: $${x2} - (${x1}) = ${a}$ and $${y2} - (${y1}) = ${b}$. Then $d = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}} = ${c}$ — the $(${a}, ${b}, ${c})$ triple.`,
  };
};

// --- distance-between-points d1: friendly first-quadrant points ---------------
const MAP_SPOTS = [["library", "gym"], ["school", "park"], ["bakery", "bus stop"], ["fountain", "kiosk"]];
fill["gpl-distance-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
  const [from, to] = rng.pick(MAP_SPOTS);
  const x1 = rng.int(0, 3);
  const y1 = rng.int(0, 3);
  const x2 = x1 + a;
  const y2 = y1 + b;
  return {
    id: `gen.gpl-distance-d1.${idx}`, generated: true, concepts: ["distance-between-points"], difficulty: 1, context: "applied",
    prompt: `On a city map, the ${from} is at $(${x1}, ${y1})$ and the ${to} is at $(${x2}, ${y2})$, where each unit is one block. What is the straight-line distance between them?`,
    steps: [
      { instruction: "Find the horizontal gap between the points.", answer: `${a}`, accept: [], hint: `$${x2} - ${x1}$.` },
      { instruction: "Find the vertical gap between the points.", answer: `${b}`, accept: [], hint: `$${y2} - ${y1}$.` },
      { instruction: "The gaps are the legs of a right triangle. Find the distance (blocks).", answer: `${c}`, accept: [`d=${c}`, `${c} blocks`], hint: `$\\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}$.` },
    ],
    finalAnswer: { value: `${c}`, unit: "blocks" },
    solutionNarrative: `$d = \\sqrt{(${x2}-${x1})^2 + (${y2}-${y1})^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${a * a + b * b}} = ${c}$ blocks.`,
  };
};

// --- find-leg d1: hypotenuse and one leg known ---------------------------------
fill["gpl-find-leg-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const knownFirst = rng.pick([true, false]);
  const known = knownFirst ? a : b;
  const missing = knownFirst ? b : a;
  const kind = rng.pick(["abstract", "wire"]);
  const base = { id: `gen.gpl-find-leg-d1.${idx}`, generated: true, concepts: ["find-leg"], difficulty: 1 };
  if (kind === "abstract") {
    return { ...base, context: "abstract",
      prompt: `A right triangle has a hypotenuse of ${c} and one leg of ${known}. Find the other leg.`,
      steps: [
        { instruction: "Subtract the squares: hypotenuse squared minus the known leg squared.", answer: `${missing * missing}`, accept: [], hint: `$${c}^2 - ${known}^2 = ${c * c} - ${known * known}$. Subtract because the hypotenuse is the biggest side.` },
        { instruction: "Take the square root to find the missing leg.", answer: `${missing}`, accept: [`b=${missing}`], hint: `$\\sqrt{${missing * missing}}$.` },
      ],
      finalAnswer: { value: `${missing}`, unit: "" },
      solutionNarrative: `Missing leg $= \\sqrt{${c}^2 - ${known}^2} = \\sqrt{${missing * missing}} = ${missing}$. This is the $(${a}, ${b}, ${c})$ triple.`,
    };
  }
  const obj = rng.pick(["guy wire", "zip line", "support cable", "tent rope"]);
  return { ...base, context: "applied",
    prompt: `A ${c} m ${obj} runs from the top of a pole to the ground, anchored ${known} m from the pole's base. How tall is the pole?`,
    steps: [
      { instruction: `The ${obj} (${c}) is the hypotenuse and the ground distance (${known}) is a leg. Subtract the squares.`, answer: `${missing * missing}`, accept: [], hint: `$${c}^2 - ${known}^2 = ${c * c} - ${known * known}$.` },
      { instruction: "Take the square root to find the pole's height (meters).", answer: `${missing}`, accept: [`${missing} m`, `${missing} meters`], hint: `$\\sqrt{${missing * missing}}$.` },
    ],
    finalAnswer: { value: `${missing}`, unit: "meters" },
    solutionNarrative: `Height $= \\sqrt{${c}^2 - ${known}^2} = \\sqrt{${missing * missing}} = ${missing}$ m — the $(${a}, ${b}, ${c})$ triple.`,
  };
};

// --- pythagorean-applications d1: diagonal of a square, rounded ---------------
fill["gpl-pyth-app-d1"] = (rng, idx) => {
  const s = rng.int(5, 30);
  const obj = rng.pick(["square picnic blanket", "square courtyard", "square garden plot", "square dance floor"]);
  const diag = r1(s * Math.SQRT2);
  return {
    id: `gen.gpl-pyth-app-d1.${idx}`, generated: true, concepts: ["pythagorean-applications"], difficulty: 1, context: "applied",
    prompt: `A ${obj} is ${s} ft on each side. How long is its diagonal, corner to corner? Round to 1 decimal place.`,
    steps: [
      { instruction: "Both legs are the same side length. Add their squares.", answer: `${2 * s * s}`, accept: [], hint: `$${s}^2 + ${s}^2 = ${s * s} + ${s * s}$.` },
      { instruction: "Take the square root and round to 1 decimal place (feet).", answer: diag, accept: [], hint: `$\\sqrt{${2 * s * s}} \\approx ${(s * Math.SQRT2).toFixed(2)}$.` },
    ],
    finalAnswer: { value: diag, unit: "feet" },
    solutionNarrative: `Diagonal $= \\sqrt{${s}^2 + ${s}^2} = \\sqrt{${2 * s * s}} = ${s}\\sqrt{2} \\approx ${diag}$ ft.`,
  };
};

// ============================================================================
// geometry.right-triangle-trigonometry
// ============================================================================

// --- trig-ratios d2: all three ratios from a labeled triple -------------------
fill["gpl-trig-ratios-d2"] = (rng, idx) => {
  const [p, q, c] = rng.pick(PRIM_TRIPLES);
  const swap = rng.pick([true, false]);
  const opp = swap ? q : p;
  const adj = swap ? p : q;
  return {
    id: `gen.gpl-trig-ratios-d2.${idx}`, generated: true, concepts: ["trig-ratios"], difficulty: 2, context: "abstract",
    prompt: `A right triangle has legs ${opp} and ${adj} and hypotenuse ${c}. For the angle $\\theta$ opposite the side of length ${opp}, find $\\sin\\theta$, $\\cos\\theta$, and $\\tan\\theta$ as exact fractions.`,
    steps: [
      { instruction: "Find $\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}$ as a fraction.", answer: `${opp}/${c}`, accept: [], hint: `Opposite is ${opp}, hypotenuse is ${c}.` },
      { instruction: "Find $\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$ as a fraction.", answer: `${adj}/${c}`, accept: [], hint: `Adjacent is ${adj}, hypotenuse is ${c}.` },
      { instruction: "Find $\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}$ as a fraction.", answer: `${opp}/${adj}`, accept: [], hint: `Opposite is ${opp}, adjacent is ${adj}.` },
    ],
    finalAnswer: { value: `${opp}/${c}, ${adj}/${c}, ${opp}/${adj}`, unit: "" },
    solutionNarrative: `With opposite ${opp}, adjacent ${adj}, hypotenuse ${c}: $\\sin\\theta = ${opp}/${c}$, $\\cos\\theta = ${adj}/${c}$, $\\tan\\theta = ${opp}/${adj}$.`,
  };
};

// --- trig-ratios d3: recover the third side first, then the other ratios ------
const INCLINE_CTX = [
  { thing: "zipline cable", unit: "m" },
  { thing: "escalator", unit: "m" },
  { thing: "loading ramp", unit: "ft" },
  { thing: "ski tow rope", unit: "m" },
];
fill["gpl-trig-ratios-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(PRIM_TRIPLES);
  const ctx = rng.pick(INCLINE_CTX);
  return {
    id: `gen.gpl-trig-ratios-d3.${idx}`, generated: true, concepts: ["trig-ratios"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.thing} runs ${c} ${ctx.unit} along its slope and rises ${a} ${ctx.unit} vertically. Let $\\theta$ be its incline angle, so $\\sin\\theta = ${a}/${c}$. Find the horizontal run, then $\\cos\\theta$ and $\\tan\\theta$ as exact fractions.`,
    steps: [
      { instruction: `Use the Pythagorean theorem to find the horizontal run (${ctx.unit}).`, answer: `${b}`, accept: [`${b} ${ctx.unit}`], hint: `$\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$ — it comes out whole.` },
      { instruction: "Find $\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$ as a fraction.", answer: `${b}/${c}`, accept: [], hint: `The run ${b} is adjacent; the slope ${c} is the hypotenuse.` },
      { instruction: "Find $\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}$ as a fraction.", answer: `${a}/${b}`, accept: [], hint: `Rise ${a} over run ${b}.` },
    ],
    finalAnswer: { value: `${b}/${c}, ${a}/${b}`, unit: "" },
    solutionNarrative: `The run is $\\sqrt{${c}^2 - ${a}^2} = ${b}$ — the $(${a}, ${b}, ${c})$ triple. Then $\\cos\\theta = ${b}/${c}$ and $\\tan\\theta = ${a}/${b}$.`,
  };
};

// Angle avoiding the trivial 45° case: 25..44 or 46..65.
const pickAngle = (rng) => { let t = rng.int(25, 64); if (t >= 45) t += 1; return t; };

// --- find-missing-side d1: one ratio, one unknown ------------------------------
fill["gpl-find-side-d1"] = (rng, idx) => {
  const kind = rng.pick(["tan", "sin"]);
  const t = pickAngle(rng);
  const L = rng.int(8, 40);
  const base = { id: `gen.gpl-find-side-d1.${idx}`, generated: true, concepts: ["find-missing-side"], difficulty: 1, context: "abstract" };
  if (kind === "tan") {
    const x = r1(L * Math.tan(deg(t)));
    return { ...base,
      prompt: `In a right triangle, an angle of $${t}^\\circ$ has an adjacent leg of ${L}. Find the opposite leg. Round to 1 decimal place.`,
      steps: [
        { instruction: "Which trig ratio links the opposite and adjacent legs?", answer: "tangent", accept: ["tan"], hint: "SOH-CAH-TOA: opposite over adjacent." },
        { instruction: `Solve $x = ${L}\\tan ${t}^\\circ$ and round to 1 decimal place.`, answer: x, accept: [], hint: `$\\tan ${t}^\\circ \\approx ${Math.tan(deg(t)).toFixed(4)}$, so $${L} \\times ${Math.tan(deg(t)).toFixed(4)} \\approx ${(L * Math.tan(deg(t))).toFixed(2)}$.` },
      ],
      finalAnswer: { value: x, unit: "" },
      solutionNarrative: `$\\tan ${t}^\\circ = x/${L}$, so $x = ${L}\\tan ${t}^\\circ \\approx ${x}$.`,
    };
  }
  const x = r1(L * Math.sin(deg(t)));
  return { ...base,
    prompt: `In a right triangle, an angle of $${t}^\\circ$ is opposite an unknown leg, and the hypotenuse is ${L}. Find the opposite leg. Round to 1 decimal place.`,
    steps: [
      { instruction: "Which trig ratio links the opposite leg and the hypotenuse?", answer: "sine", accept: ["sin"], hint: "SOH-CAH-TOA: opposite over hypotenuse." },
      { instruction: `Solve $x = ${L}\\sin ${t}^\\circ$ and round to 1 decimal place.`, answer: x, accept: [], hint: `$\\sin ${t}^\\circ \\approx ${Math.sin(deg(t)).toFixed(4)}$, so $${L} \\times ${Math.sin(deg(t)).toFixed(4)} \\approx ${(L * Math.sin(deg(t))).toFixed(2)}$.` },
    ],
    finalAnswer: { value: x, unit: "" },
    solutionNarrative: `$\\sin ${t}^\\circ = x/${L}$, so $x = ${L}\\sin ${t}^\\circ \\approx ${x}$.`,
  };
};

// --- find-missing-side d3: two sides from one setup (tan then cos) ------------
fill["gpl-find-side-d3"] = (rng, idx) => {
  const t = rng.int(30, 60);
  const d = rng.int(6, 20);
  const obj = rng.pick(["guy wire", "zipline", "support cable", "tow rope"]);
  const h = r1(d * Math.tan(deg(t)));
  const w = r1(d / Math.cos(deg(t)));
  return {
    id: `gen.gpl-find-side-d3.${idx}`, generated: true, concepts: ["find-missing-side"], difficulty: 3, context: "applied",
    prompt: `A ${obj} runs from the top of a pole to a ground anchor ${d} m from the pole's base, making a $${t}^\\circ$ angle with the GROUND. Find the pole's height AND the ${obj}'s length. Round each to 1 decimal place.`,
    steps: [
      { instruction: "The height is opposite the angle and the ground distance is adjacent. Which ratio finds the height?", answer: "tangent", accept: ["tan"], hint: "Opposite over adjacent is tangent." },
      { instruction: `Solve $h = ${d}\\tan ${t}^\\circ$ and round to 1 decimal place (meters).`, answer: h, accept: [], hint: `$\\tan ${t}^\\circ \\approx ${Math.tan(deg(t)).toFixed(4)}$, so $${d} \\times ${Math.tan(deg(t)).toFixed(4)} \\approx ${(d * Math.tan(deg(t))).toFixed(2)}$.` },
      { instruction: `The ${obj} is the hypotenuse. Solve $w = ${d}/\\cos ${t}^\\circ$ and round to 1 decimal place (meters).`, answer: w, accept: [], hint: `$\\cos ${t}^\\circ \\approx ${Math.cos(deg(t)).toFixed(4)}$, so $${d} / ${Math.cos(deg(t)).toFixed(4)} \\approx ${(d / Math.cos(deg(t))).toFixed(2)}$.` },
    ],
    finalAnswer: { value: w, unit: "meters" },
    solutionNarrative: `Height: $h = ${d}\\tan ${t}^\\circ \\approx ${h}$ m. Length: the adjacent side is known and the hypotenuse is wanted, so $w = ${d}/\\cos ${t}^\\circ \\approx ${w}$ m.`,
  };
};

// --- angles-of-elevation-depression d1: height from distance + angle ----------
fill["gpl-elev-d1"] = (rng, idx) => {
  const obj = rng.pick(["flagpole", "lighthouse", "water tower", "cell tower"]);
  const d = rng.int(20, 80);
  const t = pickAngle(rng);
  const h = r1(d * Math.tan(deg(t)));
  return {
    id: `gen.gpl-elev-d1.${idx}`, generated: true, concepts: ["angles-of-elevation-depression"], difficulty: 1, context: "applied",
    prompt: `Standing ${d} ft from the base of a ${obj} on level ground, you measure the angle of elevation to its top as $${t}^\\circ$. How tall is the ${obj}? Round to 1 decimal place.`,
    steps: [
      { instruction: "The height is opposite the angle and your distance is adjacent. Which trig ratio applies?", answer: "tangent", accept: ["tan"], hint: "Opposite over adjacent is tangent." },
      { instruction: `Solve $h = ${d}\\tan ${t}^\\circ$ and round to 1 decimal place (feet).`, answer: h, accept: [], hint: `$\\tan ${t}^\\circ \\approx ${Math.tan(deg(t)).toFixed(4)}$, so $${d} \\times ${Math.tan(deg(t)).toFixed(4)} \\approx ${(d * Math.tan(deg(t))).toFixed(2)}$.` },
    ],
    finalAnswer: { value: h, unit: "feet" },
    solutionNarrative: `$\\tan ${t}^\\circ = h/${d}$, so $h = ${d}\\tan ${t}^\\circ \\approx ${h}$ ft.`,
  };
};

// --- angles-of-elevation-depression d3: depression, or instrument height ------
fill["gpl-elev-d3"] = (rng, idx) => {
  const kind = rng.pick(["depression", "instrument"]);
  const base = { id: `gen.gpl-elev-d3.${idx}`, generated: true, concepts: ["angles-of-elevation-depression"], difficulty: 3, context: "applied" };
  if (kind === "depression") {
    const t = rng.int(25, 55);
    const h = rng.int(30, 90);
    const obs = rng.pick(["lifeguard on a cliff", "lighthouse keeper", "drone operator on a rooftop", "ranger in a fire tower"]);
    const target = rng.pick(["swimmer", "sailboat", "kayak", "buoy"]);
    const d = r1(h / Math.tan(deg(t)));
    const s = r1(h / Math.sin(deg(t)));
    return { ...base,
      prompt: `A ${obs} looks down from ${h} ft above the water and spots a ${target} at an angle of DEPRESSION of $${t}^\\circ$. Find the ${target}'s horizontal distance from the base, and the straight line-of-sight distance. Round each to 1 decimal place.`,
      steps: [
        { instruction: `The angle of depression from the top equals the angle of elevation from the ${target} (alternate interior angles). What is that angle, in degrees?`, answer: `${t}`, accept: [`${t} degrees`], hint: "The horizontal sight line and the water surface are parallel." },
        { instruction: `The ${h} ft height is opposite that angle; the horizontal distance is adjacent. Solve $d = ${h}/\\tan ${t}^\\circ$ and round to 1 decimal place (feet).`, answer: d, accept: [], hint: `$\\tan ${t}^\\circ \\approx ${Math.tan(deg(t)).toFixed(4)}$, so $${h} / ${Math.tan(deg(t)).toFixed(4)} \\approx ${(h / Math.tan(deg(t))).toFixed(2)}$.` },
        { instruction: `The line of sight is the hypotenuse. Solve $s = ${h}/\\sin ${t}^\\circ$ and round to 1 decimal place (feet).`, answer: s, accept: [], hint: `$\\sin ${t}^\\circ \\approx ${Math.sin(deg(t)).toFixed(4)}$, so $${h} / ${Math.sin(deg(t)).toFixed(4)} \\approx ${(h / Math.sin(deg(t))).toFixed(2)}$.` },
      ],
      finalAnswer: { value: s, unit: "feet" },
      solutionNarrative: `The depression angle equals the elevation angle from the ${target}: $${t}^\\circ$. Horizontal distance $= ${h}/\\tan ${t}^\\circ \\approx ${d}$ ft; line of sight $= ${h}/\\sin ${t}^\\circ \\approx ${s}$ ft.`,
    };
  }
  const t = rng.int(35, 65);
  const d = rng.pick([40, 50, 60, 80, 100]);
  const e = rng.int(4, 6);
  const obj = rng.pick(["office building", "grain elevator", "stadium wall", "monument"]);
  const y = r1(d * Math.tan(deg(t)));
  const total = r1(Number(y) + e);
  return { ...base,
    prompt: `A surveyor stands ${d} ft from the base of a ${obj} and measures the angle of elevation to its top as $${t}^\\circ$. The instrument sits ${e} ft above the ground. How tall is the ${obj}? Round to 1 decimal place.`,
    steps: [
      { instruction: "Which trig ratio gives the height of the top ABOVE instrument level from the angle and the distance?", answer: "tangent", accept: ["tan"], hint: "That height is opposite the angle; the distance is adjacent." },
      { instruction: `Solve $y = ${d}\\tan ${t}^\\circ$ and round to 1 decimal place (feet).`, answer: y, accept: [], hint: `$\\tan ${t}^\\circ \\approx ${Math.tan(deg(t)).toFixed(4)}$, so $${d} \\times ${Math.tan(deg(t)).toFixed(4)} \\approx ${(d * Math.tan(deg(t))).toFixed(2)}$.` },
      { instruction: `Add the ${e} ft instrument height for the full height (feet, 1 decimal place).`, answer: total, accept: [], hint: `$${y} + ${e}$.` },
    ],
    finalAnswer: { value: total, unit: "feet" },
    solutionNarrative: `Above the instrument: $y = ${d}\\tan ${t}^\\circ \\approx ${y}$ ft. Adding the ${e} ft instrument height gives $${y} + ${e} = ${total}$ ft.`,
  };
};

// ============================================================================
// geometry.surface-area-and-volume
// ============================================================================

// --- volume-prisms d2: compare a cube against a box ---------------------------
fill["gpl-vol-prisms-d2"] = (rng, idx) => {
  const s = rng.int(4, 7);
  const l = rng.int(6, 10);
  const w = rng.int(3, 5);
  let h = rng.int(3, 5);
  if (l * w * h === s * s * s) h += 1; // never a tie (one bump suffices: adds l*w != 0)
  const V1 = s * s * s;
  const V2 = l * w * h;
  const bigger = V1 > V2 ? "cube" : "box";
  const diff = Math.abs(V1 - V2);
  const pairCtx = rng.pick(["moving containers", "storage bins", "shipping crates", "toy chests"]);
  return {
    id: `gen.gpl-vol-prisms-d2.${idx}`, generated: true, concepts: ["volume-prisms"], difficulty: 2, context: "applied",
    prompt: `Two ${pairCtx}: a cube with ${s} ft edges, and a box ${l} ft long, ${w} ft wide, and ${h} ft tall. Which holds more, and by how many cubic feet?`,
    steps: [
      { instruction: "Find the volume of the cube ($s^3$), in cubic feet.", answer: `${V1}`, accept: [`${V1} ft^3`], hint: `$${s} \\times ${s} \\times ${s}$.` },
      { instruction: "Find the volume of the box, in cubic feet.", answer: `${V2}`, accept: [`${V2} ft^3`], hint: `$${l} \\times ${w} \\times ${h}$.` },
      { instruction: `Which holds more — the cube or the box?`, answer: bigger, accept: [`the ${bigger}`], hint: `Compare ${V1} with ${V2}.` },
      { instruction: "Subtract to find the difference (cubic feet).", answer: `${diff}`, accept: [`${diff} ft^3`], hint: `$${Math.max(V1, V2)} - ${Math.min(V1, V2)}$.` },
    ],
    finalAnswer: { value: `${diff}`, unit: "cubic feet" },
    solutionNarrative: `Cube: $${s}^3 = ${V1}$ ft³. Box: $${l} \\times ${w} \\times ${h} = ${V2}$ ft³. The ${bigger} holds $${Math.max(V1, V2)} - ${Math.min(V1, V2)} = ${diff}$ ft³ more.`,
  };
};

// --- volume-prisms d3: composite building = box + triangular prism roof -------
fill["gpl-vol-prisms-d3"] = (rng, idx) => {
  const bld = rng.pick(["shed", "barn", "cabin", "playhouse"]);
  const l = rng.int(8, 14);       // length of the building (and roof prism)
  const w = 2 * rng.int(3, 5);    // even width so the triangle area is whole
  const h = rng.int(6, 9);        // wall height
  const r = rng.int(3, 5);        // roof rise
  const boxV = l * w * h;
  const triA = (w * r) / 2;
  const roofV = triA * l;
  const total = boxV + roofV;
  return {
    id: `gen.gpl-vol-prisms-d3.${idx}`, generated: true, concepts: ["volume-prisms"], difficulty: 3, context: "applied",
    prompt: `A ${bld} is a rectangular prism ${l} ft long, ${w} ft wide, and ${h} ft tall, topped by a roof shaped like a triangular prism: the triangular end spans the full ${w} ft width, rises ${r} ft, and the prism runs the full ${l} ft length. Find the total enclosed volume.`,
    steps: [
      { instruction: "Find the volume of the rectangular part (cubic feet).", answer: `${boxV}`, accept: [`${boxV} ft^3`], hint: `$${l} \\times ${w} \\times ${h}$.` },
      { instruction: "Find the area of the roof's triangular cross-section ($\\tfrac{1}{2}bh$), in square feet.", answer: `${triA}`, accept: [`${triA} ft^2`], hint: `$\\tfrac{1}{2} \\times ${w} \\times ${r}$.` },
      { instruction: "Multiply by the roof's length to get the roof volume (cubic feet).", answer: `${roofV}`, accept: [`${roofV} ft^3`], hint: `$${triA} \\times ${l}$.` },
      { instruction: "Add the two volumes for the total (cubic feet).", answer: `${total}`, accept: [`${total} ft^3`], hint: `$${boxV} + ${roofV}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "cubic feet" },
    solutionNarrative: `Box: $${l} \\times ${w} \\times ${h} = ${boxV}$ ft³. Roof cross-section: $\\tfrac{1}{2}(${w})(${r}) = ${triA}$ ft², so the roof holds $${triA} \\times ${l} = ${roofV}$ ft³. Total: $${boxV} + ${roofV} = ${total}$ ft³.`,
  };
};

// --- volume-applied d3: volume -> bags -> cost ---------------------------------
const FILL_CTX = [
  { box: "sandbox", fill: "play sand" },
  { box: "raised garden bed", fill: "soil" },
  { box: "compost frame", fill: "compost" },
  { box: "gravel pit for a swing set", fill: "gravel" },
];
fill["gpl-vol-applied-d3"] = (rng, idx) => {
  const ctx = rng.pick(FILL_CTX);
  const L = 2 * rng.int(3, 5); // even length keeps the bag count whole
  const W = rng.int(3, 8);
  const D = rng.int(1, 2);
  const price = rng.int(3, 7);
  const V = L * W * D;
  const bags = V / 2;
  const cost = bags * price;
  return {
    id: `gen.gpl-vol-applied-d3.${idx}`, generated: true, concepts: ["volume-applied"], difficulty: 3, context: "applied",
    prompt: `You are filling a ${ctx.box} ${L} ft long, ${W} ft wide, and ${D} ft deep with ${ctx.fill}. Each bag of ${ctx.fill} fills 2 cubic feet and costs \\$${price}. What will the ${ctx.fill} cost in total?`,
    steps: [
      { instruction: "Find the volume to fill (cubic feet).", answer: `${V}`, accept: [`${V} ft^3`], hint: `$${L} \\times ${W} \\times ${D}$.` },
      { instruction: "Each bag fills 2 cubic feet. How many bags are needed?", answer: `${bags}`, accept: [`${bags} bags`], hint: `$${V} \\div 2$.` },
      { instruction: `Multiply by \\$${price} per bag to get the total cost (dollars).`, answer: `${cost}`, accept: [`${cost} dollars`, `\\$${cost}`], hint: `$${bags} \\times ${price}$.` },
    ],
    finalAnswer: { value: `${cost}`, unit: "dollars" },
    solutionNarrative: `Volume $= ${L} \\times ${W} \\times ${D} = ${V}$ ft³, needing $${V}/2 = ${bags}$ bags. Cost $= ${bags} \\times \\$${price} = \\$${cost}$.`,
  };
};

// --- volume-cylinders-cones-spheres d1: cylinder volume ------------------------
fill["gpl-vol-cyl-d1"] = (rng, idx) => {
  const obj = rng.pick(["paint can", "thermos", "glass jar", "storage canister"]);
  const r = rng.int(2, 6);
  const h = rng.int(5, 15);
  const exact = p314(3.14 * r * r * h);
  const rounded = (3.14 * r * r * h).toFixed(1);
  return {
    id: `gen.gpl-vol-cyl-d1.${idx}`, generated: true, concepts: ["volume-cylinders-cones-spheres"], difficulty: 1, context: "applied",
    prompt: `A ${obj} is a cylinder with radius ${r} cm and height ${h} cm. How many cubic centimeters does it hold? Use $\\pi \\approx 3.14$ and round to 1 decimal place.`,
    steps: [
      { instruction: "Compute $r^2$ (the radius squared).", answer: `${r * r}`, accept: [], hint: `$${r}^2 = ${r * r}$.` },
      { instruction: "Multiply $3.14 \\times r^2 \\times h$ and round to 1 decimal place.", answer: rounded, accept: exact === rounded ? [] : [exact], hint: `$3.14 \\times ${r * r} \\times ${h}$.` },
    ],
    finalAnswer: { value: rounded, unit: "cubic centimeters" },
    solutionNarrative: `$V = \\pi r^2 h \\approx 3.14 \\times ${r * r} \\times ${h} = ${exact} \\approx ${rounded}$ cm³.`,
  };
};

// ============================================================================
// geometry.triangles
// ============================================================================

// --- triangle-inequality d2: can three given lengths close up? -----------------
fill["gpl-tri-ineq-d2"] = (rng, idx) => {
  const works = rng.pick([true, false]);
  const a = rng.int(3, 8);
  const b = a + rng.int(1, 5);
  const c = works ? rng.int(b + 1, a + b - 1) : a + b + rng.int(1, 5);
  const rods = rng.pick(["metal rods", "wooden dowels", "PVC pipes", "steel struts"]);
  const yn = works ? "yes" : "no";
  return {
    id: `gen.gpl-tri-ineq-d2.${idx}`, generated: true, concepts: ["triangle-inequality"], difficulty: 2, context: "applied",
    prompt: `A crew has three ${rods} measuring ${a} m, ${b} m, and ${c} m. Can they be joined end-to-end into a triangular frame? (Answer yes or no, after testing.)`,
    steps: [
      { instruction: "Add the two shorter lengths (meters).", answer: `${a + b}`, accept: [], hint: `$${a} + ${b}$.` },
      { instruction: `Is that sum greater than the longest length (${c})? Answer yes or no.`, answer: yn, accept: [], hint: `Compare ${a + b} with ${c}.` },
      { instruction: "So can these lengths form a triangle? Answer yes or no.", answer: yn, accept: [], hint: works ? "The two shorter sides can reach past the longest — the triangle closes." : "The triangle inequality fails, so they cannot close into a triangle." },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: works
      ? `The two shorter ${rods} sum to $${a} + ${b} = ${a + b}$ m, which beats the longest (${c} m), so the triangle closes — yes.`
      : `The two shorter ${rods} sum to $${a} + ${b} = ${a + b}$ m, which does not exceed the longest (${c} m), so they cannot form a triangle — no.`,
  };
};

// --- triangle-inequality d3: whole-number range for the third side -------------
fill["gpl-tri-ineq-d3"] = (rng, idx) => {
  const p = rng.int(5, 12);
  const q = p + rng.int(2, 6);
  const lower = q - p;
  const upper = p + q;
  const obj = rng.pick(["triangular bracket", "roof truss", "gate brace", "shelf support"]);
  return {
    id: `gen.gpl-tri-ineq-d3.${idx}`, generated: true, concepts: ["triangle-inequality"], difficulty: 3, context: "applied",
    prompt: `An engineer fixes two sides of a ${obj} at ${p} cm and ${q} cm. The third side must be longer than the difference of these and shorter than their sum. Find the range of possible whole-number lengths for the third side.`,
    steps: [
      { instruction: "Find the lower bound: the difference of the two sides (cm).", answer: `${lower}`, accept: [], hint: `$${q} - ${p}$.` },
      { instruction: "Find the upper bound: the sum of the two sides (cm).", answer: `${upper}`, accept: [], hint: `$${q} + ${p}$.` },
      { instruction: "The third side must be strictly between those. What is the smallest whole-number length allowed (cm)?", answer: `${lower + 1}`, accept: [], hint: `Strictly greater than ${lower} means the next whole number.` },
      { instruction: "What is the largest whole-number length allowed (cm)?", answer: `${upper - 1}`, accept: [], hint: `Strictly less than ${upper} means the whole number just below it.` },
    ],
    finalAnswer: { value: `${lower + 1} to ${upper - 1}`, unit: "cm" },
    solutionNarrative: `The third side $c$ must satisfy $|${q} - ${p}| < c < ${q} + ${p}$, i.e. $${lower} < c < ${upper}$. Whole numbers run from ${lower + 1} cm to ${upper - 1} cm.`,
  };
};

// --- perimeter-and-basic-area d3: isosceles triangle, height via Pythagoras ----
// [half-base, height, equal side] triples so every intermediate value is whole.
const ISO_TRIPLES = [
  [3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13],
  [8, 15, 17], [15, 8, 17], [6, 8, 10], [9, 12, 15],
];
fill["gpl-tri-perim-area-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(ISO_TRIPLES);
  const obj = rng.pick(["sail", "pennant", "yield-style sign", "gable end"]);
  const baseLen = 2 * a;
  const per = 2 * c + baseLen;
  const area = a * b;
  return {
    id: `gen.gpl-tri-perim-area-d3.${idx}`, generated: true, concepts: ["perimeter-and-basic-area"], difficulty: 3, context: "applied",
    prompt: `An isosceles triangular ${obj} has two equal sides of ${c} in and a base of ${baseLen} in. Its height is not given — find it first, then find the area and the perimeter.`,
    steps: [
      { instruction: "The height from the apex splits the base in half. How long is each half (inches)?", answer: `${a}`, accept: [], hint: `$${baseLen} \\div 2$.` },
      { instruction: "That half-base and the height are the legs of a right triangle whose hypotenuse is an equal side. Find the height (inches).", answer: `${b}`, accept: [`h=${b}`], hint: `$\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$ — it comes out whole.` },
      { instruction: "Area: $\\tfrac{1}{2} \\times$ base $\\times$ height (square inches).", answer: `${area}`, accept: [`${area} in^2`], hint: `$\\tfrac{1}{2} \\times ${baseLen} \\times ${b}$.` },
      { instruction: "Perimeter: add the three sides (inches).", answer: `${per}`, accept: [`${per} in`], hint: `$${c} + ${c} + ${baseLen}$.` },
    ],
    finalAnswer: { value: `${area}`, unit: "square inches" },
    solutionNarrative: `The height splits the base into ${a}-in halves, so $h = \\sqrt{${c}^2 - ${a}^2} = ${b}$ in — the $(${a}, ${b}, ${c})$ triple. Area $= \\tfrac{1}{2}(${baseLen})(${b}) = ${area}$ in²; perimeter $= ${c} + ${c} + ${baseLen} = ${per}$ in.`,
  };
};
