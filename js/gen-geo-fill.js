// gen-geo-fill.js
// Full-tier parametric generators for the two Geometry topics
//   geometry.similarity  (templates prefixed gsm-)
//   geometry.circles     (templates prefixed gci-)
// giving every key concept a generator at difficulty 1, 2, AND 3.
// Self-contained pack: exports a `fill` map of template-name -> generator fn
// (same shape as js/generator.js's registry; merged via Object.assign there).
// Deterministic: numbers come only from the passed rng (no Date/Math.random),
// and each template returns a FIXED difficulty + concepts list so the engine's
// single-probe tier detection is reliable. Numbers are controlled for clean
// answers (integer scale factors, Pythagorean triples, integer pi-multiples).

const PI6 = (x) => x.toFixed(6); // 6-dp decimal accept for exact-pi answers (within grader 1e-6 tolerance)
const num = (x) => `${Math.round(x * 100) / 100}`; // clean string for values like 1.5, 4.5

// Pythagorean triples [leg, leg, hypotenuse]
const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [9, 12, 15],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
];

export const fill = {};

// ============================================================================
// geometry.similarity (gsm-)
// ============================================================================

// --- scale-factor -----------------------------------------------------------

fill["gsm-scale-factor-d1"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const w = rng.int(3, 6);
  const l = w + rng.int(1, 4);
  const ctx = rng.pick(["photo", "poster", "sticker", "flyer"]);
  return {
    id: `gen.gsm-scale-factor-d1.${idx}`, generated: true, concepts: ["scale-factor"], difficulty: 1, context: "applied",
    prompt: `A ${w} in by ${l} in ${ctx} is enlarged so that the ${w} in side becomes ${w * k} in. How long does the ${l} in side become?`,
    steps: [
      { instruction: "Find the scale factor of the enlargement.", answer: `${k}`, accept: [`k=${k}`, `${w * k}/${w}`], hint: `Scale factor = new side ÷ matching old side = ${w * k} ÷ ${w}.` },
      { instruction: "Multiply the other side by the scale factor.", answer: `${l * k}`, accept: [`${l * k} in`, `${l * k} inches`], hint: `${l} × ${k}.` },
    ],
    finalAnswer: { value: `${l * k}`, unit: "inches" },
    solutionNarrative: `The scale factor is ${w * k}/${w} = ${k}, so the ${l} in side becomes ${l} × ${k} = ${l * k} inches.`,
  };
};

fill["gsm-scale-factor-d2"] = (rng, idx) => {
  const opt = rng.pick([
    { thing: "model car", k: 24 },
    { thing: "model bus", k: 20 },
    { thing: "model fire truck", k: 12 },
    { thing: "model airplane", k: 48 },
  ]);
  const m = rng.int(4, 9);
  const w = rng.int(2, m - 1);
  return {
    id: `gen.gsm-scale-factor-d2.${idx}`, generated: true, concepts: ["scale-factor"], difficulty: 2, context: "applied",
    prompt: `A ${opt.thing} is ${m} inches long; the real vehicle is ${m * opt.k} inches long. The model is ${w} inches wide. How wide is the real vehicle?`,
    steps: [
      { instruction: "Find the scale factor from model to real vehicle.", answer: `${opt.k}`, accept: [`k=${opt.k}`, `${m * opt.k}/${m}`], hint: `${m * opt.k} ÷ ${m}.` },
      { instruction: "Multiply the model's width by the scale factor.", answer: `${w * opt.k}`, accept: [`${w * opt.k} in`, `${w * opt.k} inches`], hint: `${w} × ${opt.k}.` },
    ],
    finalAnswer: { value: `${w * opt.k}`, unit: "inches" },
    solutionNarrative: `The scale factor is ${m * opt.k}/${m} = ${opt.k}, so the real width is ${w} × ${opt.k} = ${w * opt.k} inches.`,
  };
};

fill["gsm-scale-factor-d3"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const A = rng.int(4, 12);
  const ctx = rng.pick(["logo", "mural stencil", "quilt block", "garden bed plan"]);
  return {
    id: `gen.gsm-scale-factor-d3.${idx}`, generated: true, concepts: ["scale-factor"], difficulty: 3, context: "applied",
    prompt: `A ${ctx} has an area of ${A} square feet. A similar, enlarged version is made with scale factor ${k} (every length is multiplied by ${k}). What is the enlarged version's area?`,
    steps: [
      { instruction: `Lengths scale by k = ${k}; by what factor does the AREA scale?`, answer: `${k * k}`, accept: [`k^2=${k * k}`, `${k}^2`], hint: `Area scales by $k^2 = ${k}^2$.` },
      { instruction: "Find the enlarged area in square feet.", answer: `${A * k * k}`, accept: [`${A * k * k} ft^2`], hint: `${A} × ${k * k}.` },
    ],
    finalAnswer: { value: `${A * k * k}`, unit: "square feet" },
    solutionNarrative: `Area scales by $k^2 = ${k * k}$, so the enlarged area is ${A} × ${k * k} = ${A * k * k} ft² — not ${A * k}.`,
  };
};

// --- solve-similar-triangles ------------------------------------------------

fill["gsm-solve-similar-d1"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const a = rng.int(3, 7);
  const b = a + rng.int(1, 4);
  return {
    id: `gen.gsm-solve-similar-d1.${idx}`, generated: true, concepts: ["solve-similar-triangles"], difficulty: 1, context: "abstract",
    prompt: `$\\triangle ABC \\sim \\triangle DEF$. Side $AB = ${a}$ corresponds to $DE = ${a * k}$, and $BC = ${b}$ corresponds to $EF = x$. Find $x$.`,
    steps: [
      { instruction: "Find the scale factor from $\\triangle ABC$ to $\\triangle DEF$.", answer: `${k}`, accept: [`k=${k}`, `${a * k}/${a}`], hint: `${a * k} ÷ ${a}.` },
      { instruction: "Find $x$.", answer: `${b * k}`, accept: [`x=${b * k}`], hint: `${b} × ${k}.` },
    ],
    finalAnswer: { value: `${b * k}`, unit: "" },
    solutionNarrative: `$k = ${a * k}/${a} = ${k}$, so $x = ${b} \\times ${k} = ${b * k}$.`,
  };
};

fill["gsm-solve-similar-d2"] = (rng, idx) => {
  const k = rng.int(2, 4);
  const a = rng.int(3, 8);
  const b = rng.int(3, 8);
  const c = a * k; // side corresponding to a
  const x = b * k; // unknown
  return {
    id: `gen.gsm-solve-similar-d2.${idx}`, generated: true, concepts: ["solve-similar-triangles"], difficulty: 2, context: "abstract",
    prompt: `Two similar triangles have corresponding sides ${a} and ${c}, and corresponding sides ${b} and $x$. Solve the proportion $\\frac{${a}}{${c}} = \\frac{${b}}{x}$.`,
    steps: [
      { instruction: "Cross-multiply the proportion (write the resulting equation in $x$).", answer: `${a}x = ${a * x}`, accept: [`${a}x=${a * x}`, `${a * x}=${a}x`], hint: `$${a} \\cdot x = ${c} \\cdot ${b}$.` },
      { instruction: "Solve for $x$.", answer: `${x}`, accept: [`x=${x}`], hint: `${a * x} ÷ ${a}.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Cross-multiplying gives $${a}x = ${a * x}$, so $x = ${x}$. (Equivalently, $k = ${c}/${a} = ${k}$ and $${b} \\times ${k} = ${x}$.)`,
  };
};

fill["gsm-solve-similar-d3"] = (rng, idx) => {
  const m = rng.int(2, 4); // AB/AD ratio
  const p = rng.int(2, 4); // AD
  const d = rng.int(4, 9); // DE
  return {
    id: `gen.gsm-solve-similar-d3.${idx}`, generated: true, concepts: ["solve-similar-triangles"], difficulty: 3, context: "abstract",
    prompt: `In $\\triangle ABC$, segment $DE$ is drawn parallel to base $BC$, with $D$ on $AB$ and $E$ on $AC$. Given $AD = ${p}$, $DB = ${p * (m - 1)}$, and $DE = ${d}$, find $BC$.`,
    steps: [
      { instruction: "Because $DE \\parallel BC$, corresponding angles are equal. Which similarity criterion links $\\triangle ADE$ and $\\triangle ABC$?", answer: "AA", accept: ["aa similarity", "angle-angle"], hint: "Two pairs of equal angles suffice." },
      { instruction: "Find the full length $AB$.", answer: `${p * m}`, accept: [`ab=${p * m}`], hint: `$AD + DB = ${p} + ${p * (m - 1)}$.` },
      { instruction: "Find the ratio $AB / AD$.", answer: `${m}`, accept: [`${p * m}/${p}`], hint: `${p * m} ÷ ${p}.` },
      { instruction: "Find $BC$.", answer: `${d * m}`, accept: [`bc=${d * m}`], hint: `$BC = DE \\times ${m} = ${d} \\times ${m}$.` },
    ],
    finalAnswer: { value: `${d * m}`, unit: "" },
    solutionNarrative: `$DE \\parallel BC$ gives AA similarity. $AB = ${p * m}$, the ratio is ${m}, so $BC = ${d} \\times ${m} = ${d * m}$.`,
  };
};

// --- triangle-similarity-criteria --------------------------------------------

fill["gsm-criteria-d1"] = (rng, idx) => {
  const A = rng.pick([35, 40, 45, 50, 65]);
  const B = rng.pick([55, 60, 70, 75]);
  const C = 180 - A - B;
  return {
    id: `gen.gsm-criteria-d1.${idx}`, generated: true, concepts: ["triangle-similarity-criteria"], difficulty: 1, context: "abstract",
    prompt: `Triangle 1 has angles $${A}^\\circ$ and $${B}^\\circ$. Triangle 2 has angles $${B}^\\circ$ and $${C}^\\circ$. Are the triangles similar, and by which criterion?`,
    steps: [
      { instruction: "Find the third angle of Triangle 1 in degrees.", answer: `${C}`, accept: [`${C} degrees`], hint: `$180 - ${A} - ${B}$.` },
      { instruction: "Do the triangles have two pairs of equal angles? Type 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: `Both triangles contain $${B}^\\circ$ and $${C}^\\circ$.` },
      { instruction: "Which similarity criterion applies?", answer: "AA", accept: ["aa similarity", "angle-angle"], hint: "Two pairs of equal **A**ngles." },
    ],
    finalAnswer: { value: "AA", unit: "" },
    solutionNarrative: `Triangle 1's angles are $${A}^\\circ, ${B}^\\circ, ${C}^\\circ$; both triangles share $${B}^\\circ$ and $${C}^\\circ$, so they are similar by AA.`,
  };
};

fill["gsm-criteria-d2"] = (rng, idx) => {
  const t = rng.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [4, 7, 9], [5, 6, 8]]);
  const k = rng.int(2, 4);
  const [a, b, c] = t;
  return {
    id: `gen.gsm-criteria-d2.${idx}`, generated: true, concepts: ["triangle-similarity-criteria"], difficulty: 2, context: "abstract",
    prompt: `Triangle 1 has sides ${a}, ${b}, ${c}. Triangle 2 has sides ${a * k}, ${b * k}, ${c * k}. Are they similar, and by which criterion?`,
    steps: [
      { instruction: `Find the ratio of the shortest sides, $${a * k}/${a}$.`, answer: `${k}`, accept: [`${a * k}/${a}`], hint: `${a * k} ÷ ${a}.` },
      { instruction: `Check the other pairs: does $${b * k}/${b}$ also equal $${c * k}/${c}$ and your ratio? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `All three ratios equal ${k}.` },
      { instruction: "Which similarity criterion applies?", answer: "SSS", accept: ["sss similarity", "side-side-side"], hint: "All three pairs of **S**ides are proportional." },
    ],
    finalAnswer: { value: "SSS", unit: "" },
    solutionNarrative: `All three ratios equal ${k} ($${a * k}/${a} = ${b * k}/${b} = ${c * k}/${c}$), so the triangles are similar by SSS.`,
  };
};

fill["gsm-criteria-d3"] = (rng, idx) => {
  const a = rng.int(3, 6);
  const b = a + rng.int(1, 4);
  const k = rng.int(2, 3);
  const ctx = rng.pick(["triangular braces sharing the same corner angle of a frame", "triangular garden plots sharing the same corner angle at a fence post", "roof trusses sharing the same peak angle"]);
  return {
    id: `gen.gsm-criteria-d3.${idx}`, generated: true, concepts: ["triangle-similarity-criteria"], difficulty: 3, context: "applied",
    prompt: `Two ${ctx} are compared. The sides forming the shared angle measure ${a} ft and ${b} ft on the small triangle, and ${a * k} ft and ${b * k} ft on the large one. Are the triangles similar, and by which criterion?`,
    steps: [
      { instruction: `Find the ratio of the first pair of sides, $${a * k}/${a}$.`, answer: `${k}`, accept: [`${a * k}/${a}`], hint: `${a * k} ÷ ${a}.` },
      { instruction: `Find the ratio of the second pair of sides, $${b * k}/${b}$.`, answer: `${k}`, accept: [`${b * k}/${b}`], hint: `${b * k} ÷ ${b}.` },
      { instruction: "Is the angle between those sides the same in both triangles? Type 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: "They share the same corner angle." },
      { instruction: "Which similarity criterion applies?", answer: "SAS", accept: ["sas similarity", "side-angle-side"], hint: "Two proportional **S**ides with the included **A**ngle equal." },
    ],
    finalAnswer: { value: "SAS", unit: "" },
    solutionNarrative: `Both side ratios equal ${k} and the included angle is shared, so the triangles are similar by SAS.`,
  };
};

// --- indirect-measurement -----------------------------------------------------

fill["gsm-indirect-d1"] = (rng, idx) => {
  const opt = rng.pick([{ s: 2, m: 3 }, { s: 3, m: 2 }, { s: 4, m: 1.5 }]);
  const t = opt.m === 1.5 ? rng.pick([8, 10, 12, 14]) : rng.int(5, 12);
  const obj = rng.pick(["tree", "flagpole", "streetlight", "water tower"]);
  const h = t * opt.m;
  return {
    id: `gen.gsm-indirect-d1.${idx}`, generated: true, concepts: ["indirect-measurement"], difficulty: 1, context: "applied",
    prompt: `A 6 ft tall person casts a ${opt.s} ft shadow. At the same time, a ${obj} casts a ${t} ft shadow. How tall is the ${obj}?`,
    steps: [
      { instruction: "Find the height-to-shadow ratio.", answer: num(opt.m), accept: [`6/${opt.s}`, opt.m === 1.5 ? "3/2" : `${opt.m}`], hint: `6 ÷ ${opt.s}.` },
      { instruction: `Multiply the ${obj}'s shadow by that ratio to get its height in feet.`, answer: num(h), accept: [`${num(h)} ft`, `${num(h)} feet`], hint: `${t} × ${num(opt.m)}.` },
    ],
    finalAnswer: { value: num(h), unit: "feet" },
    solutionNarrative: `The sun makes similar triangles, so height/shadow is shared: $6/${opt.s} = ${num(opt.m)}$, and the ${obj} is $${t} \\times ${num(opt.m)} = ${num(h)}$ ft tall.`,
  };
};

fill["gsm-indirect-d2"] = (rng, idx) => {
  const e = rng.pick([1.5, 2]);
  const d1 = rng.int(2, 4);
  const m = rng.int(3, 5);
  const obj = rng.pick(["building", "climbing wall", "grain silo", "clock tower"]);
  const h = e * m;
  return {
    id: `gen.gsm-indirect-d2.${idx}`, generated: true, concepts: ["indirect-measurement"], difficulty: 2, context: "applied",
    prompt: `To measure a ${obj}, you place a mirror flat on the ground ${d1} m from your feet and stand so you see the ${obj}'s top in it. The mirror is ${d1 * m} m from the ${obj}, and your eyes are ${num(e)} m above the ground. How tall is the ${obj}? (The two sight-line triangles at the mirror are similar.)`,
    steps: [
      { instruction: `Find the ratio of the ${obj}'s distance to your distance from the mirror.`, answer: `${m}`, accept: [`${d1 * m}/${d1}`], hint: `${d1 * m} ÷ ${d1}.` },
      { instruction: `Multiply your eye height by that ratio to get the ${obj}'s height in meters.`, answer: num(h), accept: [`${num(h)} m`, `${num(h)} meters`], hint: `${num(e)} × ${m}.` },
    ],
    finalAnswer: { value: num(h), unit: "meters" },
    solutionNarrative: `Equal reflection angles make similar triangles: the ratio is $${d1 * m}/${d1} = ${m}$, so the ${obj} is $${num(e)} \\times ${m} = ${num(h)}$ m tall.`,
  };
};

fill["gsm-indirect-d3"] = (rng, idx) => {
  const M = rng.pick([5, 10, 20, 25, 50]);
  const L1 = rng.int(2, 5);
  const L2 = L1 + rng.int(1, 4);
  const unit = rng.pick(["miles", "kilometers"]);
  return {
    id: `gen.gsm-indirect-d3.${idx}`, generated: true, concepts: ["indirect-measurement"], difficulty: 3, context: "applied",
    prompt: `A map uses a scale of 1 inch : ${M} ${unit}. Town A is ${L1} inches from your city on the map; Town B is ${L2} inches away. Find both real distances, and how much farther Town B is than Town A.`,
    steps: [
      { instruction: `Find the real distance to Town A in ${unit}.`, answer: `${L1 * M}`, accept: [`${L1 * M} ${unit}`], hint: `${L1} × ${M}.` },
      { instruction: `Find the real distance to Town B in ${unit}.`, answer: `${L2 * M}`, accept: [`${L2 * M} ${unit}`], hint: `${L2} × ${M}.` },
      { instruction: `How much farther is Town B, in ${unit}?`, answer: `${(L2 - L1) * M}`, accept: [`${(L2 - L1) * M} ${unit}`], hint: `${L2 * M} − ${L1 * M}.` },
    ],
    finalAnswer: { value: `${(L2 - L1) * M}`, unit: unit },
    solutionNarrative: `The map scale is a similarity ratio: Town A is ${L1 * M} ${unit}, Town B is ${L2 * M} ${unit}, so B is ${(L2 - L1) * M} ${unit} farther.`,
  };
};

// ============================================================================
// geometry.circles (gci-)
// ============================================================================

// --- radius-diameter-circumference -------------------------------------------

fill["gci-circle-d1"] = (rng, idx) => {
  const r = rng.int(3, 12);
  const obj = rng.pick(["pizza", "round table", "trampoline", "circular rug"]);
  return {
    id: `gen.gci-circle-d1.${idx}`, generated: true, concepts: ["radius-diameter-circumference"], difficulty: 1, context: "applied",
    prompt: `A ${obj} has a diameter of ${2 * r} feet. Find its radius and its exact circumference.`,
    steps: [
      { instruction: "Find the radius in feet.", answer: `${r}`, accept: [`${r} ft`, `r=${r}`], hint: `Half the diameter: ${2 * r} ÷ 2.` },
      { instruction: "Find the exact circumference (leave $\\pi$ in your answer).", answer: `${2 * r}pi`, accept: [`${2 * r}*pi`, PI6(2 * r * Math.PI)], hint: `$C = 2\\pi r = \\pi d = ${2 * r}\\pi$.` },
    ],
    finalAnswer: { value: `${2 * r}π`, unit: "feet" },
    solutionNarrative: `$r = ${2 * r}/2 = ${r}$ ft and $C = 2\\pi(${r}) = ${2 * r}\\pi \\approx ${(2 * r * Math.PI).toFixed(1)}$ ft.`,
  };
};

fill["gci-circle-d2"] = (rng, idx) => {
  const r = rng.int(3, 12);
  const obj = rng.pick(["circular garden", "circular pond", "round patio", "helicopter landing pad"]);
  return {
    id: `gen.gci-circle-d2.${idx}`, generated: true, concepts: ["radius-diameter-circumference"], difficulty: 2, context: "applied",
    prompt: `A ${obj} has a radius of ${r} m. Find $r^2$, then the exact area.`,
    steps: [
      { instruction: "Square the radius.", answer: `${r * r}`, accept: [`${r}^2`], hint: `${r} × ${r}.` },
      { instruction: "Find the exact area in square meters (leave $\\pi$ in your answer).", answer: `${r * r}pi`, accept: [`${r * r}*pi`, PI6(r * r * Math.PI)], hint: `$A = \\pi r^2 = ${r * r}\\pi$.` },
    ],
    finalAnswer: { value: `${r * r}π`, unit: "square meters" },
    solutionNarrative: `$A = \\pi(${r})^2 = ${r * r}\\pi \\approx ${(r * r * Math.PI).toFixed(1)}$ m².`,
  };
};

fill["gci-circle-d3"] = (rng, idx) => {
  const r = rng.int(4, 12);
  const obj = rng.pick(["circular fountain", "merry-go-round", "circular ice rink", "round stage"]);
  return {
    id: `gen.gci-circle-d3.${idx}`, generated: true, concepts: ["radius-diameter-circumference"], difficulty: 3, context: "applied",
    prompt: `The rim of a ${obj} measures exactly $${2 * r}\\pi$ meters around (its circumference). Find its radius, then its exact area.`,
    steps: [
      { instruction: "Find the radius in meters.", answer: `${r}`, accept: [`${r} m`, `r=${r}`], hint: `From $2\\pi r = ${2 * r}\\pi$, divide both sides by $2\\pi$.` },
      { instruction: "Find the exact area in square meters (leave $\\pi$ in your answer).", answer: `${r * r}pi`, accept: [`${r * r}*pi`, PI6(r * r * Math.PI)], hint: `$A = \\pi r^2 = \\pi(${r})^2$.` },
    ],
    finalAnswer: { value: `${r * r}π`, unit: "square meters" },
    solutionNarrative: `$2\\pi r = ${2 * r}\\pi$ gives $r = ${r}$ m, so $A = \\pi(${r})^2 = ${r * r}\\pi$ m².`,
  };
};

// --- central-inscribed-angles -------------------------------------------------

fill["gci-angles-d1"] = (rng, idx) => {
  const a = 10 * rng.int(3, 16); // 30..160, always even
  return {
    id: `gen.gci-angles-d1.${idx}`, generated: true, concepts: ["central-inscribed-angles"], difficulty: 1, context: "abstract",
    prompt: `A central angle of a circle measures $${a}^\\circ$. Find the measure of its arc, and the measure of an inscribed angle subtending the same arc.`,
    steps: [
      { instruction: "What is the arc's measure in degrees?", answer: `${a}`, accept: [`${a} degrees`], hint: "A central angle equals its arc." },
      { instruction: "What is the inscribed angle's measure in degrees?", answer: `${a / 2}`, accept: [`${a / 2} degrees`], hint: "An inscribed angle is HALF its arc." },
    ],
    finalAnswer: { value: `${a / 2}`, unit: "degrees" },
    solutionNarrative: `The arc equals the central angle ($${a}^\\circ$); the inscribed angle is half of it, $${a / 2}^\\circ$.`,
  };
};

fill["gci-angles-d2"] = (rng, idx) => {
  const opt = rng.pick([
    { n: 8, thing: "cars on a Ferris wheel" },
    { n: 9, thing: "gondolas on a sky ride" },
    { n: 10, thing: "seats on a carousel" },
    { n: 12, thing: "cars on a Ferris wheel" },
    { n: 15, thing: "teeth marked on a gear" },
    { n: 18, thing: "teeth marked on a gear" },
  ]);
  const gap = 360 / opt.n;
  const m = rng.int(2, Math.min(5, opt.n - 1));
  return {
    id: `gen.gci-angles-d2.${idx}`, generated: true, concepts: ["central-inscribed-angles"], difficulty: 2, context: "applied",
    prompt: `There are ${opt.n} evenly spaced ${opt.thing}. Find the central angle between two adjacent ones, and the central angle spanning ${m} gaps.`,
    steps: [
      { instruction: "Find the central angle between adjacent positions, in degrees.", answer: `${gap}`, accept: [`${gap} degrees`], hint: `360 ÷ ${opt.n}.` },
      { instruction: `Find the central angle spanning ${m} gaps, in degrees.`, answer: `${m * gap}`, accept: [`${m * gap} degrees`], hint: `${m} × ${gap}.` },
    ],
    finalAnswer: { value: `${m * gap}`, unit: "degrees" },
    solutionNarrative: `Each gap is $360/${opt.n} = ${gap}^\\circ$; ${m} gaps span $${m} \\times ${gap} = ${m * gap}^\\circ$.`,
  };
};

fill["gci-angles-d3"] = (rng, idx) => {
  const a = rng.int(20, 70);
  return {
    id: `gen.gci-angles-d3.${idx}`, generated: true, concepts: ["central-inscribed-angles"], difficulty: 3, context: "abstract",
    prompt: `A triangle is inscribed in a circle with one side on a diameter. One of its other angles measures $${a}^\\circ$. Find the angle opposite the diameter, then the third angle of the triangle.`,
    steps: [
      { instruction: "The diameter subtends a $180^\\circ$ arc. What is the inscribed angle opposite the diameter, in degrees?", answer: "90", accept: ["90 degrees"], hint: "Thales' theorem: half of $180^\\circ$." },
      { instruction: "Find the third angle of the triangle in degrees.", answer: `${90 - a}`, accept: [`${90 - a} degrees`], hint: `$180 - 90 - ${a}$.` },
    ],
    finalAnswer: { value: `${90 - a}`, unit: "degrees" },
    solutionNarrative: `By Thales' theorem the angle in the semicircle is $90^\\circ$; the third angle is $180 - 90 - ${a} = ${90 - a}^\\circ$.`,
  };
};

// --- arc-length-sector-area ---------------------------------------------------

fill["gci-arc-sector-d1"] = (rng, idx) => {
  const opt = rng.pick([
    { n: 4, r: 6, c: 9 },
    { n: 4, r: 10, c: 25 },
    { n: 6, r: 6, c: 6 },
    { n: 6, r: 12, c: 24 },
    { n: 8, r: 8, c: 8 },
    { n: 8, r: 12, c: 18 },
  ]);
  const food = rng.pick(["pizza", "quiche", "round cake", "giant cookie"]);
  return {
    id: `gen.gci-arc-sector-d1.${idx}`, generated: true, concepts: ["arc-length-sector-area"], difficulty: 1, context: "applied",
    prompt: `A ${food} of radius ${opt.r} inches is cut into ${opt.n} equal slices. What fraction of the whole is one slice, and what is the exact area of one slice?`,
    steps: [
      { instruction: "What fraction of the full circle is one slice?", answer: `1/${opt.n}`, accept: [`${1 / opt.n}`], hint: `${opt.n} equal slices.` },
      { instruction: "Find the exact area of one slice in square inches (leave $\\pi$ in your answer).", answer: `${opt.c}pi`, accept: [`${opt.c}*pi`, PI6(opt.c * Math.PI)], hint: `$\\frac{1}{${opt.n}} \\cdot \\pi(${opt.r})^2 = \\frac{${opt.r * opt.r}\\pi}{${opt.n}}$.` },
    ],
    finalAnswer: { value: `${opt.c}π`, unit: "square inches" },
    solutionNarrative: `One slice is $\\frac{1}{${opt.n}}$ of $${opt.r * opt.r}\\pi$, which is $${opt.c}\\pi \\approx ${(opt.c * Math.PI).toFixed(1)}$ in².`,
  };
};

fill["gci-arc-sector-d2"] = (rng, idx) => {
  const opt = rng.pick([
    { a: 90, f: "1/4", r: 6, c: 9 },
    { a: 90, f: "1/4", r: 8, c: 16 },
    { a: 90, f: "1/4", r: 10, c: 25 },
    { a: 120, f: "1/3", r: 6, c: 12 },
    { a: 120, f: "1/3", r: 9, c: 27 },
    { a: 180, f: "1/2", r: 6, c: 18 },
    { a: 180, f: "1/2", r: 8, c: 32 },
    { a: 60, f: "1/6", r: 12, c: 24 },
  ]);
  const dev = rng.pick(["lawn sprinkler", "security camera's coverage zone", "radar sweep", "stage spotlight"]);
  return {
    id: `gen.gci-arc-sector-d2.${idx}`, generated: true, concepts: ["arc-length-sector-area"], difficulty: 2, context: "applied",
    prompt: `A ${dev} reaches ${opt.r} m and sweeps through $${opt.a}^\\circ$. What fraction of a full circle does it cover, and what is the exact covered area?`,
    steps: [
      { instruction: `What fraction of a full circle is $${opt.a}^\\circ$? (Give a reduced fraction.)`, answer: opt.f, accept: [`${opt.a}/360`], hint: `$\\frac{${opt.a}}{360}$, reduced.` },
      { instruction: "Find the exact covered area in square meters (leave $\\pi$ in your answer).", answer: `${opt.c}pi`, accept: [`${opt.c}*pi`, PI6(opt.c * Math.PI)], hint: `$${opt.f} \\cdot \\pi(${opt.r})^2 = ${opt.f} \\cdot ${opt.r * opt.r}\\pi$.` },
    ],
    finalAnswer: { value: `${opt.c}π`, unit: "square meters" },
    solutionNarrative: `$${opt.a}^\\circ$ is $${opt.f}$ of the circle, so the sector is $${opt.f} \\cdot ${opt.r * opt.r}\\pi = ${opt.c}\\pi \\approx ${(opt.c * Math.PI).toFixed(1)}$ m².`,
  };
};

fill["gci-arc-sector-d3"] = (rng, idx) => {
  const opt = rng.pick([
    { a: 90, f: "1/4", r: 10, L: 5 },
    { a: 90, f: "1/4", r: 14, L: 7 },
    { a: 120, f: "1/3", r: 9, L: 6 },
    { a: 120, f: "1/3", r: 12, L: 8 },
    { a: 135, f: "3/8", r: 16, L: 12 },
    { a: 60, f: "1/6", r: 18, L: 6 },
    { a: 270, f: "3/4", r: 12, L: 18 },
  ]);
  const ride = rng.pick(["Ferris wheel car", "cable car on a circular track", "carousel horse", "gondola on an observation wheel"]);
  return {
    id: `gen.gci-arc-sector-d3.${idx}`, generated: true, concepts: ["arc-length-sector-area"], difficulty: 3, context: "applied",
    prompt: `A ${ride} rides a circle of radius ${opt.r} m and travels through a central angle of $${opt.a}^\\circ$. Find the fraction of a revolution, the exact arc length traveled, and that distance rounded to 1 decimal place.`,
    steps: [
      { instruction: `What fraction of a full revolution is $${opt.a}^\\circ$? (Give a reduced fraction.)`, answer: opt.f, accept: [`${opt.a}/360`], hint: `$\\frac{${opt.a}}{360}$, reduced.` },
      { instruction: "Find the exact arc length in meters (leave $\\pi$ in your answer).", answer: `${opt.L}pi`, accept: [`${opt.L}*pi`, PI6(opt.L * Math.PI)], hint: `$${opt.f} \\cdot 2\\pi(${opt.r}) = ${opt.f} \\cdot ${2 * opt.r}\\pi$.` },
      { instruction: "Round the distance to 1 decimal place.", answer: (opt.L * Math.PI).toFixed(1), accept: [], hint: `$${opt.L}\\pi = ${(opt.L * Math.PI).toFixed(3)}\\ldots$` },
    ],
    finalAnswer: { value: `${opt.L}π ≈ ${(opt.L * Math.PI).toFixed(1)}`, unit: "meters" },
    solutionNarrative: `$${opt.a}^\\circ$ is $${opt.f}$ of the $${2 * opt.r}\\pi$ m circumference: $${opt.L}\\pi \\approx ${(opt.L * Math.PI).toFixed(1)}$ m.`,
  };
};

// --- chords-tangents ----------------------------------------------------------

fill["gci-chords-d1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.gci-chords-d1.${idx}`, generated: true, concepts: ["chords-tangents"], difficulty: 1, context: "abstract",
    prompt: `A tangent line touches a circle of radius ${a} at point $T$. An external point $P$ is ${c} units from the circle's center $O$. Find the angle between the tangent and radius $OT$, then the length of tangent segment $PT$.`,
    steps: [
      { instruction: "What is the angle (in degrees) between the tangent line and the radius at the point of tangency?", answer: "90", accept: ["90 degrees"], hint: "Tangent ⊥ radius, always." },
      { instruction: "Use the Pythagorean theorem to find $PT$.", answer: `${b}`, accept: [`pt=${b}`], hint: `$PT = \\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$.` },
    ],
    finalAnswer: { value: `${b}`, unit: "" },
    solutionNarrative: `$\\triangle OTP$ is right-angled at $T$, so $PT = \\sqrt{${c}^2 - ${a}^2} = ${b}$.`,
  };
};

fill["gci-chords-d2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.gci-chords-d2.${idx}`, generated: true, concepts: ["chords-tangents"], difficulty: 2, context: "abstract",
    prompt: `A circle has radius ${c}. A chord lies ${a} units from the center, and the radius drawn perpendicular to the chord bisects it. Find half the chord's length, then the full chord.`,
    steps: [
      { instruction: "Use the Pythagorean theorem to find HALF the chord's length.", answer: `${b}`, accept: [], hint: `$\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$.` },
      { instruction: "Find the full chord length.", answer: `${2 * b}`, accept: [], hint: "Double the half-chord." },
    ],
    finalAnswer: { value: `${2 * b}`, unit: "" },
    solutionNarrative: `Half the chord is $\\sqrt{${c}^2 - ${a}^2} = ${b}$, so the chord is $${2 * b}$.`,
  };
};

fill["gci-chords-d3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const road = rng.pick(["highway", "railway line", "coastal road", "canal"]);
  return {
    id: `gen.gci-chords-d3.${idx}`, generated: true, concepts: ["chords-tangents"], difficulty: 3, context: "applied",
    prompt: `A cell tower covers a circle of radius ${c} miles. A straight ${road} passes ${a} miles from the tower at its closest point. Find half the covered stretch, the full covered stretch (a chord), and the minutes of coverage for a vehicle moving at 60 mph.`,
    steps: [
      { instruction: `The radius to the closest point is perpendicular to the ${road} and bisects the covered chord. Find HALF the covered stretch, in miles.`, answer: `${b}`, accept: [`${b} mi`, `${b} miles`], hint: `$\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$.` },
      { instruction: "Find the full covered stretch in miles.", answer: `${2 * b}`, accept: [`${2 * b} mi`, `${2 * b} miles`], hint: "Double the half-chord." },
      { instruction: "At 60 mph (1 mile per minute), how many minutes is the vehicle in coverage?", answer: `${2 * b}`, accept: [`${2 * b} min`, `${2 * b} minutes`], hint: "At 60 mph, each mile takes one minute." },
    ],
    finalAnswer: { value: `${2 * b}`, unit: "minutes" },
    solutionNarrative: `Half the chord is $\\sqrt{${c}^2 - ${a}^2} = ${b}$ mi, so the covered stretch is ${2 * b} mi — ${2 * b} minutes at a mile a minute.`,
  };
};
