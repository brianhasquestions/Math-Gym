// gen-trig2-fill.js
// Self-contained parametric generator pack for the Trigonometry subject's
// oblique-triangle and trig-equation topics (law-of-sines-and-cosines,
// trig-equations). Exports a `fill` map of template-name -> generator fn,
// matching the shape of js/generator.js's registry (same pattern as
// js/gen-de-fill.js and js/gen-linalg-fill.js — no imports from generator.js).
//
// Conventions (must match the topic JSON + grader):
// - All angles in DEGREES; solution sets are plain degree numbers so the
//   grader's `form:"solutions"` parser handles them (pi-expressions do NOT parse).
// - Rounded answers are computed at full precision, then rounded exactly as the
//   instruction states; multi-step chains reuse the ROUNDED intermediate so the
//   authored answer always matches a student who follows the instructions.

const D = (x) => (x * Math.PI) / 180;
const sinD = (x) => Math.sin(D(x));
const cosD = (x) => Math.cos(D(x));
const asinDeg = (v) => (Math.asin(v) * 180) / Math.PI;
const acosDeg = (v) => (Math.acos(v) * 180) / Math.PI;
const r1 = (x) => (Math.round(x * 10) / 10).toFixed(1);   // "21.0" style, 1 dp
const r4 = (x) => (Math.round(x * 1e4) / 1e4).toFixed(4); // "0.5799" style, 4 dp
const rd = (x) => Math.round(x);                          // nearest degree
const num = (x) => (Number.isInteger(x) ? `${x}` : `${x}`);
const solAns = (sols) => sols.map((s) => `x = ${s}`).join(" or ");
const solAccept = (sols) => [sols.join(", ")];

export const fill = {};

// ============================================================================
// law-of-sines-and-cosines.json
// ============================================================================

// --- law-of-sines-sides ---

fill["trg2-los-side-d1"] = (rng, idx) => {
  const A = rng.pick([35, 40, 48, 52, 55]);
  const B = rng.pick([62, 70, 75, 80]);
  const a = rng.int(8, 20);
  const b = (a * sinD(B)) / sinD(A);
  return {
    id: `gen.trg2-los-side-d1.${idx}`, generated: true, concepts: ["law-of-sines-sides"], difficulty: 1, context: "abstract",
    prompt: `In triangle $ABC$, $A = ${A}^\\circ$, $B = ${B}^\\circ$, and $a = ${a}$. Find side $b$. Round to 1 decimal place.`,
    steps: [
      { instruction: "Set up the Law of Sines proportion that contains $b$.", answer: `b/sin(${B}) = ${a}/sin(${A})`, accept: [`b/sin${B}=${a}/sin${A}`, `b = ${a}sin(${B})/sin(${A})`, `sin(${B})/b = sin(${A})/${a}`], hint: `Match each side with the sine of its OPPOSITE angle: $\\frac{b}{\\sin ${B}^\\circ} = \\frac{${a}}{\\sin ${A}^\\circ}$.` },
      { instruction: `Solve $b = \\frac{${a}\\sin ${B}^\\circ}{\\sin ${A}^\\circ}$ and round to 1 decimal place.`, answer: r1(b), accept: [], hint: `$\\sin ${B}^\\circ \\approx ${r4(sinD(B))}$ and $\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$.` },
    ],
    finalAnswer: { value: r1(b), unit: "" },
    solutionNarrative: `$b = ${a}\\sin ${B}^\\circ/\\sin ${A}^\\circ \\approx ${r1(b)}$.`,
  };
};

fill["trg2-los-side-d2"] = (rng, idx) => {
  const ctx = rng.pick([
    { obs: "Two fire towers", target: "a smoke plume", unit: "m" },
    { obs: "Two ranger stations", target: "a stranded hiker", unit: "m" },
    { obs: "Two survey markers", target: "a radio mast", unit: "m" },
  ]);
  const A = rng.pick([35, 42, 48, 55]);
  const B = rng.pick([60, 68, 72, 80]);
  const c = 10 * rng.int(8, 15);
  const C = 180 - A - B;
  const a = (c * sinD(A)) / sinD(C);
  return {
    id: `gen.trg2-los-side-d2.${idx}`, generated: true, concepts: ["law-of-sines-sides"], difficulty: 2, context: "applied",
    prompt: `${ctx.obs} $A$ and $B$ are ${c} ${ctx.unit} apart. Both sight ${ctx.target} at point $C$: the angle at $A$ is $${A}^\\circ$ and the angle at $B$ is $${B}^\\circ$. Find the distance from $B$ to point $C$ (the side opposite the angle at $A$). Round to 1 decimal place.`,
    steps: [
      { instruction: "Find the angle at $C$ (the angles of a triangle sum to $180^\\circ$).", answer: `${C}`, accept: [`C = ${C}`, `${C} degrees`], hint: `$180 - ${A} - ${B}$.` },
      { instruction: `The distance $BC$ is opposite the $${A}^\\circ$ angle and the ${c} ${ctx.unit} baseline is opposite $C$. Set up the Law of Sines for $BC$.`, answer: `BC/sin(${A}) = ${c}/sin(${C})`, accept: [`BC/sin${A}=${c}/sin${C}`, `BC = ${c}sin(${A})/sin(${C})`, `a/sin(${A}) = ${c}/sin(${C})`], hint: `$\\frac{BC}{\\sin ${A}^\\circ} = \\frac{${c}}{\\sin ${C}^\\circ}$.` },
      { instruction: `Solve $BC = \\frac{${c}\\sin ${A}^\\circ}{\\sin ${C}^\\circ}$ and round to 1 decimal place (${ctx.unit}).`, answer: r1(a), accept: [], hint: `$\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$ and $\\sin ${C}^\\circ \\approx ${r4(sinD(C))}$.` },
    ],
    finalAnswer: { value: r1(a), unit: "meters" },
    solutionNarrative: `The third angle is $${C}^\\circ$, opposite the ${c} ${ctx.unit} baseline. Then $BC = ${c}\\sin ${A}^\\circ/\\sin ${C}^\\circ \\approx ${r1(a)}$ ${ctx.unit}.`,
  };
};

fill["trg2-los-side-d3"] = (rng, idx) => {
  const ctx = rng.pick([
    { job: "Engineers planning a tunnel", pts: "at the base of a mountain", target: "a portal point" },
    { job: "A crew laying a cable", pts: "on one rim of a canyon", target: "an anchor point" },
    { job: "Surveyors plotting a bridge", pts: "on the near shore", target: "a pier site" },
  ]);
  const A = rng.pick([44, 52, 58]);
  const B = rng.pick([62, 68, 75]);
  const c = 50 * rng.int(4, 9);
  const C = 180 - A - B;
  const a = (c * sinD(A)) / sinD(C); // side BC, opposite A
  const b = (c * sinD(B)) / sinD(C); // side AC, opposite B
  return {
    id: `gen.trg2-los-side-d3.${idx}`, generated: true, concepts: ["law-of-sines-sides"], difficulty: 3, context: "applied",
    prompt: `${ctx.job} mark points $A$ and $B$ ${c} m apart ${ctx.pts}. They sight ${ctx.target} $C$: the angle at $A$ is $${A}^\\circ$ and the angle at $B$ is $${B}^\\circ$. Find BOTH distances $AC$ and $BC$. Round each to 1 decimal place.`,
    steps: [
      { instruction: "Find the angle at $C$.", answer: `${C}`, accept: [`C = ${C}`, `${C} degrees`], hint: `$180 - ${A} - ${B}$.` },
      { instruction: `Side $BC$ is opposite the angle at $A$. Solve $BC = \\frac{${c}\\sin ${A}^\\circ}{\\sin ${C}^\\circ}$ and round to 1 decimal place (m).`, answer: r1(a), accept: [], hint: `$\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$ and $\\sin ${C}^\\circ \\approx ${r4(sinD(C))}$.` },
      { instruction: `Side $AC$ is opposite the angle at $B$. Solve $AC = \\frac{${c}\\sin ${B}^\\circ}{\\sin ${C}^\\circ}$ and round to 1 decimal place (m).`, answer: r1(b), accept: [], hint: `$\\sin ${B}^\\circ \\approx ${r4(sinD(B))}$; reuse $\\sin ${C}^\\circ \\approx ${r4(sinD(C))}$.` },
    ],
    finalAnswer: { value: `BC = ${r1(a)}, AC = ${r1(b)}`, unit: "meters" },
    solutionNarrative: `$C = ${C}^\\circ$ faces the ${c} m baseline. Then $BC = ${c}\\sin ${A}^\\circ/\\sin ${C}^\\circ \\approx ${r1(a)}$ m and $AC = ${c}\\sin ${B}^\\circ/\\sin ${C}^\\circ \\approx ${r1(b)}$ m.`,
  };
};

// --- law-of-sines-angles ---

// b < a guarantees a unique acute answer (no ambiguity at d1/d2).
fill["trg2-los-angle-d1"] = (rng, idx) => {
  const A = rng.pick([35, 42, 50, 55, 64]);
  const a = rng.int(10, 16);
  const b = rng.int(6, a - 1);
  const sB = (b * sinD(A)) / a;
  const sB4 = r4(sB);
  const B = rd(asinDeg(parseFloat(sB4)));
  return {
    id: `gen.trg2-los-angle-d1.${idx}`, generated: true, concepts: ["law-of-sines-angles"], difficulty: 1, context: "abstract",
    prompt: `In triangle $ABC$, $A = ${A}^\\circ$, $a = ${a}$, and $b = ${b}$. Find the acute angle $B$. Round to the nearest degree.`,
    steps: [
      { instruction: `Solve the Law of Sines for $\\sin B = \\frac{${b}\\sin ${A}^\\circ}{${a}}$ and round the value to 4 decimal places.`, answer: sB4, accept: [`sinB = ${sB4}`, `sin(B) = ${sB4}`], hint: `$\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$; multiply by ${b}, divide by ${a}.` },
      { instruction: "Apply $\\sin^{-1}$ to your rounded value and round to the nearest degree.", answer: `${B}`, accept: [`B = ${B}`, `${B} degrees`], hint: `$\\sin^{-1}(${sB4})$ is between 0 and 90 degrees — since $b < a$, angle $B$ must be smaller than $A$'s supplement pair and is acute.` },
    ],
    finalAnswer: { value: `${B}`, unit: "degrees" },
    solutionNarrative: `$\\sin B = ${b}\\sin ${A}^\\circ/${a} \\approx ${sB4}$, so $B = \\sin^{-1}(${sB4}) \\approx ${B}^\\circ$.`,
  };
};

fill["trg2-los-angle-d2"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A triangular sail", unit: "ft" },
    { thing: "A triangular garden bed", unit: "m" },
    { thing: "A triangular gable panel", unit: "ft" },
  ]);
  const A = rng.pick([38, 42, 47, 53]);
  const a = rng.int(12, 18);
  const b = rng.int(8, a - 1);
  const sB = (b * sinD(A)) / a;
  const sB4 = r4(sB);
  const B = rd(asinDeg(parseFloat(sB4)));
  return {
    id: `gen.trg2-los-angle-d2.${idx}`, generated: true, concepts: ["law-of-sines-angles"], difficulty: 2, context: "applied",
    prompt: `${ctx.thing} has a ${a} ${ctx.unit} edge opposite a $${A}^\\circ$ corner, and a second edge of ${b} ${ctx.unit}. Find the acute angle opposite the ${b} ${ctx.unit} edge. Round to the nearest degree.`,
    steps: [
      { instruction: `Solve the Law of Sines for the sine of the unknown angle: $\\sin B = \\frac{${b}\\sin ${A}^\\circ}{${a}}$. Round to 4 decimal places.`, answer: sB4, accept: [`sinB = ${sB4}`, `sin(B) = ${sB4}`], hint: `$\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$.` },
      { instruction: "Apply $\\sin^{-1}$ to your rounded value and round to the nearest degree.", answer: `${B}`, accept: [`B = ${B}`, `${B} degrees`], hint: "The angle opposite the shorter edge is acute." },
    ],
    finalAnswer: { value: `${B}`, unit: "degrees" },
    solutionNarrative: `$\\sin B = ${b}\\sin ${A}^\\circ/${a} \\approx ${sB4}$, so $B \\approx ${B}^\\circ$.`,
  };
};

// Ambiguous case: b sin A < a < b guarantees exactly two triangles.
fill["trg2-los-angle-d3"] = (rng, idx) => {
  const A = rng.pick([35, 40, 45, 50]);
  const aOpts = { 35: [6, 7, 8, 9], 40: [7, 8, 9], 45: [8, 9], 50: [8, 9] };
  const a = rng.pick(aOpts[A]);
  const b = 10;
  const h = b * sinD(A);
  const sB = h / a;
  const Bacute = rd(asinDeg(sB));
  const Bobtuse = 180 - Bacute;
  return {
    id: `gen.trg2-los-angle-d3.${idx}`, generated: true, concepts: ["law-of-sines-angles"], difficulty: 3, context: "abstract",
    prompt: `In triangle $ABC$, $A = ${A}^\\circ$, $a = ${a}$, and $b = ${b}$ — an SSA setup. Determine how many triangles are possible, then find every possible angle $B$. Round angles to the nearest degree.`,
    steps: [
      { instruction: `Compute the height $b\\sin A = ${b}\\sin ${A}^\\circ$ and round to 1 decimal place.`, answer: r1(h), accept: [], hint: `$\\sin ${A}^\\circ \\approx ${r4(sinD(A))}$.` },
      { instruction: `Compare: $b\\sin A \\approx ${r1(h)} < a = ${a} < b = ${b}$. How many triangles are possible? (Type a number.)`, answer: "2", accept: ["two"], hint: "When $b\\sin A < a < b$, the swinging side crosses the base twice — one acute $B$, one obtuse." },
      { instruction: `Find the ACUTE possibility: $B = \\sin^{-1}\\!\\left(\\frac{${b}\\sin ${A}^\\circ}{${a}}\\right)$, rounded to the nearest degree.`, answer: `${Bacute}`, accept: [`B = ${Bacute}`, `${Bacute} degrees`], hint: `$\\sin B \\approx ${r4(sB)}$.` },
      { instruction: "Find the OBTUSE possibility: subtract the rounded acute angle from $180^\\circ$.", answer: `${Bobtuse}`, accept: [`B = ${Bobtuse}`, `${Bobtuse} degrees`], hint: `$\\sin\\theta = \\sin(180^\\circ - \\theta)$, so $180 - ${Bacute}$ also works.` },
    ],
    finalAnswer: { value: `2 triangles: B = ${Bacute} or B = ${Bobtuse}`, unit: "" },
    solutionNarrative: `Since $b\\sin A \\approx ${r1(h)} < ${a} < ${b}$, two triangles fit. $\\sin B \\approx ${r4(sB)}$ gives the acute $B \\approx ${Bacute}^\\circ$; its supplement $${Bobtuse}^\\circ$ also satisfies the data.`,
  };
};

// --- law-of-cosines ---

// Perfect SAS triangles: 60° uses c² = a² + b² − ab; 120° uses c² = a² + b² + ab.
fill["trg2-loc-side-d1"] = (rng, idx) => {
  const t = rng.pick([
    { a: 3, b: 8, C: 60, c: 7 }, { a: 5, b: 8, C: 60, c: 7 }, { a: 8, b: 15, C: 60, c: 13 },
    { a: 5, b: 21, C: 60, c: 19 }, { a: 3, b: 5, C: 120, c: 7 }, { a: 7, b: 8, C: 120, c: 13 },
  ]);
  const cosVal = t.C === 60 ? "\\frac{1}{2}" : "-\\frac{1}{2}";
  const c2 = t.c * t.c;
  return {
    id: `gen.trg2-loc-side-d1.${idx}`, generated: true, concepts: ["law-of-cosines"], difficulty: 1, context: "abstract",
    prompt: `In triangle $ABC$, sides $a = ${t.a}$ and $b = ${t.b}$ meet at the included angle $C = ${t.C}^\\circ$. Find side $c$ exactly.`,
    steps: [
      { instruction: `Apply the Law of Cosines: compute $c^2 = ${t.a}^2 + ${t.b}^2 - 2(${t.a})(${t.b})\\cos ${t.C}^\\circ$. (Recall $\\cos ${t.C}^\\circ = ${cosVal}$.)`, answer: `${c2}`, accept: [`c^2 = ${c2}`], hint: `$${t.a * t.a} + ${t.b * t.b} ${t.C === 60 ? "-" : "+"} ${t.a * t.b}$.` },
      { instruction: "Take the square root to find $c$.", answer: `${t.c}`, accept: [`c = ${t.c}`], hint: `$\\sqrt{${c2}}$.` },
    ],
    finalAnswer: { value: `${t.c}`, unit: "" },
    solutionNarrative: `$c^2 = ${t.a * t.a} + ${t.b * t.b} - 2(${t.a})(${t.b})(${t.C === 60 ? "\\tfrac{1}{2}" : "-\\tfrac{1}{2}"}) = ${c2}$, so $c = ${t.c}$ exactly.`,
  };
};

fill["trg2-loc-side-d2"] = (rng, idx) => {
  const ctx = rng.pick([
    { setup: "Two straight trails leave the same trailhead", m1: "You hike", m2: "a friend hikes", q: "How far apart are you", unit: "km" },
    { setup: "Two roads leave the same junction", m1: "One car drives", m2: "another drives", q: "How far apart are the cars", unit: "km" },
    { setup: "Two ships leave the same port on straight courses", m1: "One sails", m2: "the other sails", q: "How far apart are the ships", unit: "km" },
  ]);
  const theta = rng.pick([40, 50, 55, 65, 70, 75, 110]);
  const a = rng.int(6, 12);
  const b = rng.int(8, 15);
  const c2 = a * a + b * b - 2 * a * b * cosD(theta);
  const c2r = r1(c2);
  const c = r1(Math.sqrt(parseFloat(c2r)));
  return {
    id: `gen.trg2-loc-side-d2.${idx}`, generated: true, concepts: ["law-of-cosines"], difficulty: 2, context: "applied",
    prompt: `${ctx.setup} with a $${theta}^\\circ$ angle between them. ${ctx.m1} ${a} ${ctx.unit} along one; ${ctx.m2} ${b} ${ctx.unit} along the other. ${ctx.q}? Round to 1 decimal place.`,
    steps: [
      { instruction: `This is SAS — two sides and the included angle. Compute $c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos ${theta}^\\circ$ and round to 1 decimal place.`, answer: c2r, accept: [`c^2 = ${c2r}`], hint: `$${a * a} + ${b * b} - ${2 * a * b}(${r4(cosD(theta))})$.` },
      { instruction: `Take the square root of your rounded value and round to 1 decimal place (${ctx.unit}).`, answer: c, accept: [`c = ${c}`], hint: `$\\sqrt{${c2r}}$.` },
    ],
    finalAnswer: { value: c, unit: "kilometers" },
    solutionNarrative: `SAS calls for the Law of Cosines: $c^2 = ${a * a} + ${b * b} - ${2 * a * b}\\cos ${theta}^\\circ \\approx ${c2r}$, so the distance is $\\sqrt{${c2r}} \\approx ${c}$ ${ctx.unit}.`,
  };
};

// SSS: find the angle opposite the longest side.
fill["trg2-loc-angle-d3"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A triangular steel brace", unit: "m", who: "A fabricator needs the largest angle to set the welding jig." },
    { thing: "A triangular concrete pad", unit: "m", who: "The formwork crew needs the largest corner angle." },
    { thing: "A triangular garden plot", unit: "m", who: "The landscaper needs the widest corner angle." },
  ]);
  const t = rng.pick([[7, 8, 9], [5, 6, 8], [6, 8, 9], [5, 7, 10], [4, 7, 9], [6, 7, 11]]);
  const [a, b, c] = t;
  const num2 = a * a + b * b - c * c;
  const den = 2 * a * b;
  const cosC = num2 / den;
  const C = rd(acosDeg(cosC));
  return {
    id: `gen.trg2-loc-angle-d3.${idx}`, generated: true, concepts: ["law-of-cosines"], difficulty: 3, context: "applied",
    prompt: `${ctx.thing} has sides ${a} ${ctx.unit}, ${b} ${ctx.unit}, and ${c} ${ctx.unit}. ${ctx.who} Find the angle opposite the ${c} ${ctx.unit} side. Round to the nearest degree.`,
    steps: [
      { instruction: `Solve the Law of Cosines for the cosine of the angle opposite ${c}: $\\cos C = \\frac{${a}^2 + ${b}^2 - ${c}^2}{2(${a})(${b})}$. Give the value as a fraction.`, answer: `${num2}/${den}`, accept: [r4(cosC)], hint: `$\\frac{${a * a} + ${b * b} - ${c * c}}{${den}}$.` },
      { instruction: "Apply $\\cos^{-1}$ and round to the nearest degree.", answer: `${C}`, accept: [`C = ${C}`, `${C} degrees`], hint: `$\\cos^{-1}(${r4(cosC)}) \\approx ${C}^\\circ$${cosC < 0 ? " — the negative cosine means the angle is obtuse" : ""}.` },
    ],
    finalAnswer: { value: `${C}`, unit: "degrees" },
    solutionNarrative: `For SSS, solve for the cosine: $\\cos C = (${a * a} + ${b * b} - ${c * c})/${den} \\approx ${r4(cosC)}$, so $C \\approx ${C}^\\circ$. The largest angle always faces the longest side.`,
  };
};

// --- triangle-area-applied ---

fill["trg2-area-d1"] = (rng, idx) => {
  const a = rng.pick([4, 6, 8, 10, 12]);
  const b = rng.pick([5, 6, 7, 9, 10]);
  const K = (a * b) / 4;
  const Ks = Number.isInteger(K) ? `${K}` : K.toFixed(1);
  return {
    id: `gen.trg2-area-d1.${idx}`, generated: true, concepts: ["triangle-area-applied"], difficulty: 1, context: "abstract",
    prompt: `Two sides of a triangle measure ${a} and ${b}, and the angle between them is $30^\\circ$. Find the exact area.`,
    steps: [
      { instruction: "What is $\\sin 30^\\circ$?", answer: "1/2", accept: ["0.5"], hint: "A special value worth memorizing." },
      { instruction: `Compute the area $K = \\frac{1}{2}(${a})(${b})\\sin 30^\\circ$.`, answer: Ks, accept: [`K = ${Ks}`], hint: `$\\frac{1}{2}(${a})(${b})(\\frac{1}{2}) = ${(a * b) / 2} \\cdot \\frac{1}{2}$.` },
    ],
    finalAnswer: { value: Ks, unit: "" },
    solutionNarrative: `$K = \\frac{1}{2}(${a})(${b})\\sin 30^\\circ = ${Ks}$ — exact, because $30^\\circ$ is a special angle.`,
  };
};

fill["trg2-area-d2"] = (rng, idx) => {
  const C = rng.pick([60, 120]);
  const a = rng.pick([4, 8, 12]);
  const b = rng.pick([3, 5, 6, 7, 9, 10]);
  const k = (a * b) / 4;
  return {
    id: `gen.trg2-area-d2.${idx}`, generated: true, concepts: ["triangle-area-applied"], difficulty: 2, context: "abstract",
    prompt: `Two sides of a triangle measure ${a} and ${b}, meeting at a $${C}^\\circ$ angle. Find the exact area (in the form $k\\sqrt{3}$).`,
    steps: [
      { instruction: `What is $\\sin ${C}^\\circ$? Give the exact value.`, answer: "sqrt(3)/2", accept: ["√3/2", "0.8660254"], hint: C === 120 ? "Sine is still positive in quadrant II: $\\sin 120^\\circ = \\sin 60^\\circ = \\frac{\\sqrt{3}}{2}$." : "One of the special values: $\\frac{\\sqrt{3}}{2}$." },
      { instruction: `Compute the exact area $K = \\frac{1}{2}(${a})(${b})\\sin ${C}^\\circ$.`, answer: `${k}sqrt(3)`, accept: [`${k}√3`, `${k}*sqrt(3)`], hint: `$\\frac{1}{2}(${a})(${b}) = ${(a * b) / 2}$, and $${(a * b) / 2} \\cdot \\frac{\\sqrt{3}}{2} = ${k}\\sqrt{3}$.` },
    ],
    finalAnswer: { value: `${k}√3`, unit: "" },
    solutionNarrative: `$K = \\frac{1}{2}(${a})(${b})\\sin ${C}^\\circ = ${(a * b) / 2} \\cdot \\frac{\\sqrt{3}}{2} = ${k}\\sqrt{3}$.`,
  };
};

fill["trg2-area-d3"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "a triangular parcel", sides: "two fence lines", unit: "m", area: "square meters" },
    { thing: "a triangular field", sides: "two boundary walls", unit: "m", area: "square meters" },
    { thing: "a triangular deck", sides: "two edges", unit: "ft", area: "square feet" },
  ]);
  const theta = rng.pick([35, 40, 55, 65, 75, 105]);
  const a = 10 * rng.int(4, 9);
  const b = 10 * rng.int(3, 8);
  const s4 = r4(sinD(theta));
  const K = r1(0.5 * a * b * parseFloat(s4));
  return {
    id: `gen.trg2-area-d3.${idx}`, generated: true, concepts: ["triangle-area-applied"], difficulty: 3, context: "applied",
    prompt: `A surveyor measures ${ctx.sides} of ${ctx.thing}: ${a} ${ctx.unit} and ${b} ${ctx.unit}, meeting at a corner angle of $${theta}^\\circ$. Find the area. Round to 1 decimal place.`,
    steps: [
      { instruction: `Find $\\sin ${theta}^\\circ$ rounded to 4 decimal places.`, answer: s4, accept: [], hint: theta > 90 ? "An obtuse angle still has a positive sine (quadrant II)." : "Use a calculator in degree mode." },
      { instruction: `Using your rounded value, compute $K = \\frac{1}{2}(${a})(${b})\\sin ${theta}^\\circ$ and round to 1 decimal place (${ctx.area}).`, answer: K, accept: [], hint: `$\\frac{1}{2}(${a})(${b}) = ${(a * b) / 2}$; multiply by ${s4}.` },
    ],
    finalAnswer: { value: K, unit: ctx.area },
    solutionNarrative: `$K = \\frac{1}{2}(${a})(${b})\\sin ${theta}^\\circ = ${(a * b) / 2}(${s4}) \\approx ${K}$ ${ctx.area} — no height measurement required.`,
  };
};

// ============================================================================
// trig-equations.json
// ============================================================================

// Special-value tables: [fn latex, fn plain, value latex, value plain, ref angle, solutions, quadrant note]
const BASIC_POS = [
  { fl: "\\sin", vl: "\\frac{1}{2}", ref: 30, sols: [30, 150], sign: "positive", quads: "I and II", place: "QI keeps the reference angle; QII uses $180^\\circ$ minus it." },
  { fl: "\\sin", vl: "\\frac{\\sqrt{3}}{2}", ref: 60, sols: [60, 120], sign: "positive", quads: "I and II", place: "QI keeps the reference angle; QII uses $180^\\circ$ minus it." },
  { fl: "\\sin", vl: "\\frac{\\sqrt{2}}{2}", ref: 45, sols: [45, 135], sign: "positive", quads: "I and II", place: "QI keeps the reference angle; QII uses $180^\\circ$ minus it." },
  { fl: "\\cos", vl: "\\frac{1}{2}", ref: 60, sols: [60, 300], sign: "positive", quads: "I and IV", place: "QI keeps the reference angle; QIV uses $360^\\circ$ minus it." },
  { fl: "\\cos", vl: "\\frac{\\sqrt{3}}{2}", ref: 30, sols: [30, 330], sign: "positive", quads: "I and IV", place: "QI keeps the reference angle; QIV uses $360^\\circ$ minus it." },
  { fl: "\\cos", vl: "\\frac{\\sqrt{2}}{2}", ref: 45, sols: [45, 315], sign: "positive", quads: "I and IV", place: "QI keeps the reference angle; QIV uses $360^\\circ$ minus it." },
];
const BASIC_NEG = [
  { fl: "\\sin", vl: "-\\frac{1}{2}", ref: 30, sols: [210, 330], quads: "III and IV", place: "QIII is $180^\\circ$ plus the reference angle; QIV is $360^\\circ$ minus it." },
  { fl: "\\sin", vl: "-\\frac{\\sqrt{3}}{2}", ref: 60, sols: [240, 300], quads: "III and IV", place: "QIII is $180^\\circ$ plus the reference angle; QIV is $360^\\circ$ minus it." },
  { fl: "\\sin", vl: "-\\frac{\\sqrt{2}}{2}", ref: 45, sols: [225, 315], quads: "III and IV", place: "QIII is $180^\\circ$ plus the reference angle; QIV is $360^\\circ$ minus it." },
  { fl: "\\cos", vl: "-\\frac{1}{2}", ref: 60, sols: [120, 240], quads: "II and III", place: "QII is $180^\\circ$ minus the reference angle; QIII is $180^\\circ$ plus it." },
  { fl: "\\cos", vl: "-\\frac{\\sqrt{3}}{2}", ref: 30, sols: [150, 210], quads: "II and III", place: "QII is $180^\\circ$ minus the reference angle; QIII is $180^\\circ$ plus it." },
  { fl: "\\cos", vl: "-\\frac{\\sqrt{2}}{2}", ref: 45, sols: [135, 225], quads: "II and III", place: "QII is $180^\\circ$ minus the reference angle; QIII is $180^\\circ$ plus it." },
];
const BASIC_TAN = [
  { vl: "1", ref: 45, sols: [45, 225], sign: "positive", quads: "I and III" },
  { vl: "\\sqrt{3}", ref: 60, sols: [60, 240], sign: "positive", quads: "I and III" },
  { vl: "\\frac{\\sqrt{3}}{3}", ref: 30, sols: [30, 210], sign: "positive", quads: "I and III" },
  { vl: "-1", ref: 45, sols: [135, 315], sign: "negative", quads: "II and IV" },
  { vl: "-\\sqrt{3}", ref: 60, sols: [120, 300], sign: "negative", quads: "II and IV" },
  { vl: "-\\frac{\\sqrt{3}}{3}", ref: 30, sols: [150, 330], sign: "negative", quads: "II and IV" },
];

fill["trg2-eq-basic-d1"] = (rng, idx) => {
  const t = rng.pick(BASIC_POS);
  return {
    id: `gen.trg2-eq-basic-d1.${idx}`, generated: true, concepts: ["basic-trig-equations"], difficulty: 1, context: "abstract",
    prompt: `Solve $${t.fl} x = ${t.vl}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `What is the reference angle — the special angle whose ${t.fl === "\\sin" ? "sine" : "cosine"} is $${t.vl}$? (Degrees.)`, answer: `${t.ref}`, accept: [`${t.ref} degrees`], hint: `From the special-value table: $${t.fl} ${t.ref}^\\circ = ${t.vl}$.` },
      { instruction: `${t.fl === "\\sin" ? "Sine" : "Cosine"} is positive in quadrants ${t.quads}. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(t.sols), accept: solAccept(t.sols), form: "solutions", hint: t.place },
    ],
    finalAnswer: { value: t.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Reference angle $${t.ref}^\\circ$; the function is positive in quadrants ${t.quads}, giving $x = ${t.sols[0]}^\\circ$ or $x = ${t.sols[1]}^\\circ$.`,
  };
};

fill["trg2-eq-basic-d2"] = (rng, idx) => {
  const t = rng.pick(BASIC_NEG);
  const name = t.fl === "\\sin" ? "Sine" : "Cosine";
  return {
    id: `gen.trg2-eq-basic-d2.${idx}`, generated: true, concepts: ["basic-trig-equations"], difficulty: 2, context: "abstract",
    prompt: `Solve $${t.fl} x = ${t.vl}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `What is the reference angle? (Ignore the sign; degrees.)`, answer: `${t.ref}`, accept: [`${t.ref} degrees`], hint: `$${t.fl} ${t.ref}^\\circ$ gives the same value without the minus sign — the sign only picks the quadrants.` },
      { instruction: `${name} is NEGATIVE in quadrants ${t.quads}. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(t.sols), accept: solAccept(t.sols), form: "solutions", hint: t.place },
    ],
    finalAnswer: { value: t.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Reference angle $${t.ref}^\\circ$; ${name.toLowerCase()} is negative in quadrants ${t.quads}, giving $x = ${t.sols[0]}^\\circ$ or $x = ${t.sols[1]}^\\circ$.`,
  };
};

fill["trg2-eq-basic-d3"] = (rng, idx) => {
  const t = rng.pick(BASIC_TAN);
  return {
    id: `gen.trg2-eq-basic-d3.${idx}`, generated: true, concepts: ["basic-trig-equations"], difficulty: 3, context: "abstract",
    prompt: `Solve $\\tan x = ${t.vl}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: "What is the reference angle? (Ignore any sign; degrees.)", answer: `${t.ref}`, accept: [`${t.ref} degrees`], hint: `$\\tan ${t.ref}^\\circ$ has this magnitude.` },
      { instruction: "Tangent has period $180^\\circ$. How many degrees apart are consecutive solutions of a tangent equation?", answer: "180", accept: ["180 degrees"], hint: "Unlike sine and cosine (period $360^\\circ$), tangent repeats every half revolution." },
      { instruction: `Tangent is ${t.sign} in quadrants ${t.quads}. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(t.sols), accept: solAccept(t.sols), form: "solutions", hint: `Place the reference angle in quadrant ${t.quads.split(" ")[0]}, then add $180^\\circ$.` },
    ],
    finalAnswer: { value: t.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Reference angle $${t.ref}^\\circ$; tangent is ${t.sign} in quadrants ${t.quads}, giving $x = ${t.sols[0]}^\\circ$ and $x = ${t.sols[0]} + 180 = ${t.sols[1]}^\\circ$.`,
  };
};

// --- multi-step-isolation ---

const ISO_TABLE = {
  "sin:1/2": { sols: [30, 150], quads: "I and II", sign: "positive", ref: 30 },
  "sin:-1/2": { sols: [210, 330], quads: "III and IV", sign: "NEGATIVE", ref: 30 },
  "cos:1/2": { sols: [60, 300], quads: "I and IV", sign: "positive", ref: 60 },
  "cos:-1/2": { sols: [120, 240], quads: "II and III", sign: "NEGATIVE", ref: 60 },
};

fill["trg2-eq-isolate-d1"] = (rng, idx) => {
  const t = rng.pick([
    { eq: "2\\sin x - 1 = 0", fn: "sin", val: "1/2", how: "Add 1 to both sides, then divide by 2" },
    { eq: "2\\cos x - 1 = 0", fn: "cos", val: "1/2", how: "Add 1 to both sides, then divide by 2" },
    { eq: "2\\sin x + 1 = 0", fn: "sin", val: "-1/2", how: "Subtract 1 from both sides, then divide by 2 — watch the sign" },
    { eq: "2\\cos x + 1 = 0", fn: "cos", val: "-1/2", how: "Subtract 1 from both sides, then divide by 2 — watch the sign" },
  ]);
  const info = ISO_TABLE[`${t.fn}:${t.val}`];
  const dec = t.val === "1/2" ? "0.5" : "-0.5";
  return {
    id: `gen.trg2-eq-isolate-d1.${idx}`, generated: true, concepts: ["multi-step-isolation"], difficulty: 1, context: "abstract",
    prompt: `Solve $${t.eq}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Isolate the trig function: what must $\\${t.fn} x$ equal?`, answer: t.val, accept: [dec, `${t.fn}(x) = ${t.val}`], hint: `${t.how} — treat $\\${t.fn} x$ like a single unknown.` },
      { instruction: `${t.fn === "sin" ? "Sine" : "Cosine"} is ${info.sign} in quadrants ${info.quads}. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(info.sols), accept: solAccept(info.sols), form: "solutions", hint: `Reference angle $${info.ref}^\\circ$.` },
    ],
    finalAnswer: { value: info.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Isolate: $\\${t.fn} x = ${t.val}$. The function is ${info.sign.toLowerCase()} in quadrants ${info.quads}, so $x = ${info.sols[0]}^\\circ$ or $x = ${info.sols[1]}^\\circ$.`,
  };
};

fill["trg2-eq-isolate-d2"] = (rng, idx) => {
  const fn = rng.pick(["sin", "cos"]);
  const k = rng.pick([4, 6, 8]);
  const c = rng.int(1, 9);
  const neg = rng.int(0, 1) === 1;
  const val = neg ? "-1/2" : "1/2";
  const dec = neg ? "-0.5" : "0.5";
  const rhs = k / 2 * (neg ? -1 : 1); // k·val
  const d = rhs + c;
  const info = ISO_TABLE[`${fn}:${val}`];
  return {
    id: `gen.trg2-eq-isolate-d2.${idx}`, generated: true, concepts: ["multi-step-isolation"], difficulty: 2, context: "abstract",
    prompt: `Solve $${k}\\${fn} x + ${c} = ${d}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Subtract ${c} from both sides. What equation remains?`, answer: `${k}${fn}(x) = ${rhs}`, accept: [`${k}${fn}x=${rhs}`, `${fn}(x) = ${val}`], hint: `$${d} - ${c} = ${rhs}$.` },
      { instruction: `Divide by ${k}: what must $\\${fn} x$ equal?`, answer: val, accept: [dec, `${fn}(x) = ${val}`], hint: `$${rhs}/${k}$.` },
      { instruction: `${fn === "sin" ? "Sine" : "Cosine"} is ${info.sign} in quadrants ${info.quads}. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(info.sols), accept: solAccept(info.sols), form: "solutions", hint: `Reference angle $${info.ref}^\\circ$.` },
    ],
    finalAnswer: { value: info.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Subtract ${c}: $${k}\\${fn} x = ${rhs}$. Divide by ${k}: $\\${fn} x = ${val}$, giving $x = ${info.sols[0]}^\\circ$ or $x = ${info.sols[1]}^\\circ$.`,
  };
};

fill["trg2-eq-isolate-d3"] = (rng, idx) => {
  const fn = rng.pick(["sin", "cos"]);
  const q = rng.pick([2, 3, 4]);
  const p = q + 2;
  const neg = rng.int(0, 1) === 1;
  const val = neg ? "-1/2" : "1/2";
  const dec = neg ? "-0.5" : "0.5";
  const total = neg ? -1 : 1; // m + n = 2·val
  const m = rng.pick([2, 3, 4]);
  const n = total - m; // always negative
  const info = ISO_TABLE[`${fn}:${val}`];
  return {
    id: `gen.trg2-eq-isolate-d3.${idx}`, generated: true, concepts: ["multi-step-isolation"], difficulty: 3, context: "abstract",
    prompt: `Solve $${p}\\${fn} x - ${m} = ${q}\\${fn} x - ${-n}$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Gather the trig terms on one side (subtract $${q}\\${fn} x$ and add ${m} to both sides). What equation remains?`, answer: `2${fn}(x) = ${total}`, accept: [`2${fn}x=${total}`, `${fn}(x) = ${val}`], hint: `Exactly like $${p}y - ${m} = ${q}y - ${-n}$: gather $y$ terms left, constants right.` },
      { instruction: `What must $\\${fn} x$ equal?`, answer: val, accept: [dec, `${fn}(x) = ${val}`], hint: "Divide both sides by 2." },
      { instruction: `List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(info.sols), accept: solAccept(info.sols), form: "solutions", hint: `${fn === "sin" ? "Sine" : "Cosine"} is ${info.sign.toLowerCase()} in quadrants ${info.quads}; reference angle $${info.ref}^\\circ$.` },
    ],
    finalAnswer: { value: info.sols.map((s) => `x = ${s}°`).join(" or "), unit: "" },
    solutionNarrative: `Gathering like terms gives $2\\${fn} x = ${total}$, so $\\${fn} x = ${val}$ and $x = ${info.sols[0]}^\\circ$ or $x = ${info.sols[1]}^\\circ$ — the algebra is identical to a linear equation in $y$.`,
  };
};

// --- factoring-trig ---

const FACTOR_SOLS = {
  "sin:0": [0, 180], "sin:1/2": [30, 150], "sin:-1/2": [210, 330], "sin:1": [90],
  "cos:0": [90, 270], "cos:1/2": [60, 300], "cos:-1/2": [120, 240], "cos:1": [0],
};
const solsFor = (fn, us) => us.flatMap((u) => FACTOR_SOLS[`${fn}:${u}`]).sort((x, y) => x - y);
const whereText = (fn, us) => us.map((u) => `$\\${fn} x = ${u}$ at $${FACTOR_SOLS[`${fn}:${u}`].join("^\\circ, ")}^\\circ$`).join("; ");

fill["trg2-eq-factor-d1"] = (rng, idx) => {
  const fn = rng.pick(["sin", "cos"]);
  const us = ["0", "1/2"];
  const sols = solsFor(fn, us);
  return {
    id: `gen.trg2-eq-factor-d1.${idx}`, generated: true, concepts: ["factoring-trig"], difficulty: 1, context: "abstract",
    prompt: `Solve $2\\${fn}^2 x - \\${fn} x = 0$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Substitute $u = \\${fn} x$. What quadratic equation results?`, answer: "2u^2 - u = 0", accept: ["2u^2-u=0", "2u^2 = u"], hint: `Replace every $\\${fn} x$ with $u$.` },
      { instruction: "Factor the left side (do NOT divide by $u$ — that loses solutions).", answer: "u(2u - 1) = 0", accept: ["u(2u-1)=0", "(2u-1)u=0"], form: "factored", hint: "Pull out the common factor $u$." },
      { instruction: "Solve each factor: list the possible values of $u$.", answer: "u = 0 or u = 1/2", accept: ["0, 1/2", "0, 0.5"], form: "solutions", hint: "$u = 0$ or $2u - 1 = 0$." },
      { instruction: `Convert back to $x$. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(sols), accept: solAccept(sols), form: "solutions", hint: whereText(fn, us) + "." },
    ],
    finalAnswer: { value: `x = ${sols.join("°, ")}°`, unit: "" },
    solutionNarrative: `With $u = \\${fn} x$: $u(2u - 1) = 0$, so ${whereText(fn, us)}. All solutions: $${sols.join("^\\circ, ")}^\\circ$ — dividing by $\\${fn} x$ would have deleted half of them.`,
  };
};

fill["trg2-eq-factor-d2"] = (rng, idx) => {
  const fn = rng.pick(["sin", "cos"]);
  const us = ["0", "-1/2"];
  const sols = solsFor(fn, us);
  return {
    id: `gen.trg2-eq-factor-d2.${idx}`, generated: true, concepts: ["factoring-trig"], difficulty: 2, context: "abstract",
    prompt: `Solve $2\\${fn}^2 x + \\${fn} x = 0$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Substitute $u = \\${fn} x$ and factor the resulting quadratic.`, answer: "u(2u + 1) = 0", accept: ["u(2u+1)=0", "(2u+1)u=0"], form: "factored", hint: "$2u^2 + u = 0$; pull out the common factor $u$." },
      { instruction: "List the possible values of $u$.", answer: "u = 0 or u = -1/2", accept: ["0, -1/2", "0, -0.5"], form: "solutions", hint: "$u = 0$ or $2u + 1 = 0$." },
      { instruction: `Convert back to $x$. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(sols), accept: solAccept(sols), form: "solutions", hint: whereText(fn, us) + "." },
    ],
    finalAnswer: { value: `x = ${sols.join("°, ")}°`, unit: "" },
    solutionNarrative: `$u(2u + 1) = 0$ gives ${whereText(fn, us)} — ${sols.length} solutions in all.`,
  };
};

fill["trg2-eq-factor-d3"] = (rng, idx) => {
  const fn = rng.pick(["sin", "cos"]);
  const us = ["1/2", "1"];
  const sols = solsFor(fn, us);
  return {
    id: `gen.trg2-eq-factor-d3.${idx}`, generated: true, concepts: ["factoring-trig"], difficulty: 3, context: "abstract",
    prompt: `Solve $2\\${fn}^2 x - 3\\${fn} x + 1 = 0$ for all $x$ in $[0^\\circ, 360^\\circ)$.`,
    steps: [
      { instruction: `Substitute $u = \\${fn} x$. What quadratic results?`, answer: "2u^2 - 3u + 1 = 0", accept: ["2u^2-3u+1=0"], hint: `Replace $\\${fn}^2 x$ with $u^2$ and $\\${fn} x$ with $u$.` },
      { instruction: "Factor the quadratic.", answer: "(2u - 1)(u - 1) = 0", accept: ["(2u-1)(u-1)=0", "(u-1)(2u-1)=0"], form: "factored", hint: "Look for factors of the form $(2u - ?)(u - ?)$ whose product gives $+1$ and middle term $-3u$." },
      { instruction: "List the possible values of $u$.", answer: "u = 1/2 or u = 1", accept: ["1/2, 1", "0.5, 1"], form: "solutions", hint: "Set each factor to zero." },
      { instruction: `Convert back: $\\${fn} x = \\frac{1}{2}$ gives two solutions, $\\${fn} x = 1$ gives one. List ALL solutions in $[0^\\circ, 360^\\circ)$.`, answer: solAns(sols), accept: solAccept(sols), form: "solutions", hint: whereText(fn, us) + "." },
    ],
    finalAnswer: { value: `x = ${sols.join("°, ")}°`, unit: "" },
    solutionNarrative: `Factoring $2u^2 - 3u + 1 = (2u - 1)(u - 1)$ gives ${whereText(fn, us)}: three solutions.`,
  };
};

// --- applied-periodic ---

fill["trg2-eq-applied-d1"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A slow observation wheel carries a cabin whose height follows", unit: "minutes", u: "m", tvar: "minutes after boarding" },
    { thing: "A buoy bobs on ocean swell so its height follows", unit: "seconds", u: "ft", tvar: "seconds after a sensor starts" },
    { thing: "A weight on a spring moves so its height follows", unit: "seconds", u: "cm", tvar: "seconds after release" },
  ]);
  const A = rng.pick([4, 6, 8, 10]);
  const Dv = A + rng.int(2, 6);
  const B = rng.pick([10, 15, 30]);
  const k = Dv + A / 2;
  const t = 30 / B;
  return {
    id: `gen.trg2-eq-applied-d1.${idx}`, generated: true, concepts: ["applied-periodic"], difficulty: 1, context: "applied",
    prompt: `${ctx.thing} $h(t) = ${A}\\sin(${B}t)^\\circ + ${Dv}$ ${ctx.u}, $t$ ${ctx.tvar}. When does the height FIRST reach ${k} ${ctx.u}?`,
    steps: [
      { instruction: `Set $h(t) = ${k}$ and isolate the sine: what must $\\sin(${B}t)$ equal?`, answer: "1/2", accept: ["0.5", `sin(${B}t) = 1/2`], hint: `Subtract ${Dv} from both sides, then divide by ${A}.` },
      { instruction: "What is the smallest positive angle (in degrees) whose sine is $\\frac{1}{2}$?", answer: "30", accept: ["30 degrees"], hint: "The special-value table: $\\sin 30^\\circ = \\frac{1}{2}$." },
      { instruction: `Set $${B}t = 30$ and solve for $t$ (${ctx.unit}).`, answer: `${t}`, accept: [`t = ${t}`], hint: `Divide both sides by ${B} to convert the angle into a time.` },
    ],
    finalAnswer: { value: `${t}`, unit: ctx.unit },
    solutionNarrative: `$${A}\\sin(${B}t) + ${Dv} = ${k}$ isolates to $\\sin(${B}t) = \\frac{1}{2}$, so the angle $${B}t$ first equals $30^\\circ$, giving $t = ${t}$ ${ctx.unit}.`,
  };
};

fill["trg2-eq-applied-d2"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A harbor's depth follows", u: "feet", tvar: "hours after 6 a.m.", q: "the depth equals", unit: "hours" },
    { thing: "A bay's tide height follows", u: "feet", tvar: "hours after midnight", q: "the height equals", unit: "hours" },
    { thing: "A reservoir gauge follows", u: "meters", tvar: "hours after opening", q: "the reading equals", unit: "hours" },
  ]);
  const A = rng.pick([2, 4, 6, 8]);
  const Dv = A + rng.int(2, 8);
  const B = rng.pick([10, 15, 30]);
  const k = Dv + A / 2;
  const t1 = 30 / B, t2 = 150 / B;
  return {
    id: `gen.trg2-eq-applied-d2.${idx}`, generated: true, concepts: ["applied-periodic"], difficulty: 2, context: "applied",
    prompt: `${ctx.thing} $d(t) = ${A}\\sin(${B}t)^\\circ + ${Dv}$ ${ctx.u}, $t$ ${ctx.tvar}. Find the FIRST TWO times ${ctx.q} ${k} ${ctx.u}.`,
    steps: [
      { instruction: `Set $d(t) = ${k}$ and isolate the sine: what must $\\sin(${B}t)$ equal?`, answer: "1/2", accept: ["0.5", `sin(${B}t) = 1/2`], hint: `Subtract ${Dv}, then divide by ${A}.` },
      { instruction: `The angle $${B}t$ can be $30^\\circ$ (quadrant I). Solve $${B}t = 30$ for the first time $t$ (${ctx.unit}).`, answer: `${t1}`, accept: [`t = ${t1}`], hint: `Divide by ${B}.` },
      { instruction: `The angle can also be $180^\\circ - 30^\\circ = 150^\\circ$ (quadrant II). Solve $${B}t = 150$ for the second time $t$ (${ctx.unit}).`, answer: `${t2}`, accept: [`t = ${t2}`], hint: `Divide 150 by ${B}.` },
    ],
    finalAnswer: { value: `t = ${t1} and t = ${t2}`, unit: ctx.unit },
    solutionNarrative: `$\\sin(${B}t) = \\frac{1}{2}$ means $${B}t = 30^\\circ$ or $150^\\circ$, so $t = ${t1}$ (rising) and $t = ${t2}$ (falling). Between them the value stays above ${k} ${ctx.u}.`,
  };
};

fill["trg2-eq-applied-d3"] = (rng, idx) => {
  const ctx = rng.pick([
    { thing: "A tidal channel's depth follows", u: "feet", tvar: "hours after high tide", q: "a dredging alarm must trigger when the depth drops to", unit: "hours" },
    { thing: "A city's temperature follows", u: "°C", tvar: "hours after the daily peak", q: "a greenhouse vent must close when the temperature falls to", unit: "hours" },
  ]);
  const A = rng.pick([4, 6, 8]);
  const Dv = A + rng.int(3, 8);
  const B = rng.pick([10, 15, 20, 30]);
  const k = Dv - A / 2;
  const t1 = 120 / B, t2 = 240 / B;
  return {
    id: `gen.trg2-eq-applied-d3.${idx}`, generated: true, concepts: ["applied-periodic"], difficulty: 3, context: "applied",
    prompt: `${ctx.thing} $d(t) = ${A}\\cos(${B}t)^\\circ + ${Dv}$ ${ctx.u}, $t$ ${ctx.tvar}; ${ctx.q} ${k} ${ctx.u}. Find both times in the first cycle when $d(t) = ${k}$.`,
    steps: [
      { instruction: `Set $d(t) = ${k}$ and isolate the cosine: what must $\\cos(${B}t)$ equal?`, answer: "-1/2", accept: ["-0.5", `cos(${B}t) = -1/2`], hint: `Subtract ${Dv} from both sides, then divide by ${A}: $(${k} - ${Dv})/${A}$.` },
      { instruction: `Cosine is $-\\frac{1}{2}$ first at $180^\\circ - 60^\\circ = 120^\\circ$ (quadrant II). Solve $${B}t = 120$ for the first time $t$ (${ctx.unit}).`, answer: `${t1}`, accept: [`t = ${t1}`], hint: `Divide 120 by ${B}.` },
      { instruction: `The quadrant-III angle is $180^\\circ + 60^\\circ = 240^\\circ$. Solve $${B}t = 240$ for the second time $t$ (${ctx.unit}).`, answer: `${t2}`, accept: [`t = ${t2}`], hint: `Divide 240 by ${B}.` },
      { instruction: `For how many ${ctx.unit} between those crossings does the value stay BELOW ${k} ${ctx.u}?`, answer: `${t2 - t1}`, accept: [`${t2 - t1} ${ctx.unit}`], hint: "Subtract the first crossing time from the second." },
    ],
    finalAnswer: { value: `t = ${t1} and t = ${t2}`, unit: ctx.unit },
    solutionNarrative: `$\\cos(${B}t) = -\\frac{1}{2}$ gives $${B}t = 120^\\circ$ or $240^\\circ$: crossings at $t = ${t1}$ and $t = ${t2}$, with the value below ${k} ${ctx.u} for the $${t2 - t1}$ ${ctx.unit} in between (cosine is below $-\\frac{1}{2}$ between QII and QIII).`,
  };
};
