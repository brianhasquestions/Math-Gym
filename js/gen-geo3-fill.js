// gen-geo3-fill.js
// Parametric generators for geometry.triangle-congruence.
// One template per (concept, difficulty) tier — 12 total. Self-contained pack:
// no imports; exports a `fill` map of template-name -> generator fn, matching
// the pack pattern of gen-nt2-fill.js. Every answer is computed in-pack from
// the SAME numbers shown in the prompt.
//
// Grader notes (verified by negative tests against js/problem-engine.js):
//   - "SSS"/"SAS"/"ASA"/"AAS" do NOT cross-accept as typed answers, and the
//     word variants "side side side" etc. (spaces, no hyphens) are also clean.
//   - Hyphenated forms like "side-side-side" DO collide (hyphen parses as
//     minus) and are never used.
//   - Reason menu (given / reflexive property / vertical angles / CPCTC /
//     definition of midpoint) verified pairwise clean including accepts.

// --- criterion menu: canonical answers + accept lists (collision-tested) ---
const CRIT = {
  SSS: { answer: "SSS", accept: ["sss", "side side side", "SSS postulate", "sss congruence"] },
  SAS: { answer: "SAS", accept: ["sas", "side angle side", "SAS postulate", "sas congruence"] },
  ASA: { answer: "ASA", accept: ["asa", "angle side angle", "ASA postulate", "asa congruence"] },
  AAS: { answer: "AAS", accept: ["aas", "angle angle side", "AAS theorem", "aas congruence", "saa"] },
  NONE: { answer: "not enough information", accept: ["not enough info", "none", "no criterion", "cannot be determined"] },
};
const MENU4 = "(Answer with one of: SSS, SAS, ASA, AAS)";
const MENU5 = "(Answer with one of: SSS, SAS, ASA, AAS, not enough information)";

const REASON = {
  given: { answer: "given", accept: ["givens", "it is given"] },
  reflexive: { answer: "reflexive property", accept: ["reflexive", "reflexive property of congruence"] },
  vertical: { answer: "vertical angles", accept: ["vertical angle theorem", "vertical angles theorem", "vert angles"] },
  cpctc: { answer: "CPCTC", accept: ["cpctc", "corresponding parts of congruent triangles are congruent", "cpct"] },
  midpoint: { answer: "definition of midpoint", accept: ["midpoint", "def of midpoint", "midpoint definition"] },
};
const RMENU = "(Answer with one of: given, reflexive property, vertical angles, CPCTC)";
const RMENU_MID = "(Answer with one of: given, definition of midpoint, vertical angles, CPCTC)";

// Random triangle side lengths satisfying the STRICT triangle inequality,
// with all three lengths distinct (avoids ambiguous correspondences).
const triangleSides = (rng, lo, hi) => {
  let a, b, c;
  do {
    a = rng.int(lo, hi); b = rng.int(lo, hi); c = rng.int(lo, hi);
  } while (a === b || b === c || a === c || a + b <= c || a + c <= b || b + c <= a);
  return [a, b, c];
};

// Two random angles that leave a genuinely positive third angle, all distinct
// and not degenerate-thin.
const trianglePairOfAngles = (rng) => {
  let t1, t2;
  do {
    t1 = rng.int(25, 100); t2 = rng.int(25, 100);
  } while (t1 === t2 || t1 + t2 > 150);
  return [t1, t2, 180 - t1 - t2];
};

// Static side-by-side congruent-triangle diagram with the given vertex labels.
const twinTrianglePlot = (l1, l2, caption) => ({
  xRange: [-1, 12], yRange: [-1, 4.5], width: 360, height: 200,
  points: [
    { x: 0, y: 0, label: l1[0], color: "accent" }, { x: 4, y: 0, label: l1[1], color: "accent" }, { x: 1, y: 3, label: l1[2], color: "accent" },
    { x: 7, y: 0, label: l2[0], color: "good" }, { x: 11, y: 0, label: l2[1], color: "good" }, { x: 8, y: 3, label: l2[2], color: "good" },
  ],
  segments: [
    { from: [0, 0], to: [4, 0], color: "accent" }, { from: [4, 0], to: [1, 3], color: "accent" }, { from: [1, 3], to: [0, 0], color: "accent" },
    { from: [7, 0], to: [11, 0], color: "good" }, { from: [11, 0], to: [8, 3], color: "good" }, { from: [8, 3], to: [7, 0], color: "good" },
  ],
  caption,
});

// Butterfly (vertical angles) diagram: segments cross at center X.
const butterflyPlot = (a, b, c, d, x) => ({
  xRange: [-5, 5], yRange: [-3.5, 3.5], width: 340, height: 240,
  points: [
    { x: -4, y: 2, label: a, color: "accent" }, { x: 4, y: -2, label: c, color: "accent" },
    { x: -4, y: -2, label: b, color: "good" }, { x: 4, y: 2, label: d, color: "good" },
    { x: 0, y: 0, label: x, color: "text" },
  ],
  segments: [
    { from: [-4, 2], to: [4, -2], color: "accent" }, { from: [-4, -2], to: [4, 2], color: "good" },
    { from: [-4, 2], to: [-4, -2], color: "dim", dashed: true }, { from: [4, 2], to: [4, -2], color: "dim", dashed: true },
  ],
  caption: `${a}${c} and ${b}${d} cross at ${x}, making vertical angles.`,
});

// ===========================================================================
export const fill = {};

// ===========================================================================
// concept: congruence-and-cpctc
// ===========================================================================

// d1: read the correspondence and transfer two side lengths.
fill["geo3-cpctc-1"] = (rng, idx) => {
  const [a, b, c] = triangleSides(rng, 4, 15);
  return {
    id: `gen.geo3-cpctc-1.${idx}`, generated: true, concepts: ["congruence-and-cpctc"], difficulty: 1, context: "abstract",
    prompt: `$\\triangle ABC \\cong \\triangle DEF$, with $AB = ${a}$, $BC = ${b}$, $CA = ${c}$. Use the letter order to read off parts of $\\triangle DEF$.`,
    plot: twinTrianglePlot(["A", "B", "C"], ["D", "E", "F"], "△ABC ≅ △DEF — match parts by letter order."),
    steps: [
      { instruction: `Which side of $\\triangle DEF$ corresponds to $AB$? (Type the two letters, e.g. DF.)`, answer: "DE", accept: ["ED"], hint: `First two letters pair with first two letters: $A \\to D$, $B \\to E$.` },
      { instruction: `By CPCTC, what is the length of $DE$?`, answer: `${a}`, accept: [`DE=${a}`], hint: `$DE \\cong AB = ${a}$.` },
      { instruction: `What is the length of $EF$?`, answer: `${b}`, accept: [`EF=${b}`], hint: `$EF \\cong BC = ${b}$.` },
    ],
    finalAnswer: { value: `DE = ${a}, EF = ${b}`, unit: "" },
    solutionNarrative: `The letter order pairs $A \\to D$, $B \\to E$, $C \\to F$, so $DE \\cong AB = ${a}$ and $EF \\cong BC = ${b}$.`,
  };
};

// d2: perimeter of the congruent copy.
fill["geo3-cpctc-2"] = (rng, idx) => {
  const [a, b, c] = triangleSides(rng, 5, 18);
  const per = a + b + c;
  return {
    id: `gen.geo3-cpctc-2.${idx}`, generated: true, concepts: ["congruence-and-cpctc"], difficulty: 2, context: "abstract",
    prompt: `$\\triangle PQR \\cong \\triangle XYZ$ with $PQ = ${a}$, $QR = ${b}$, $PR = ${c}$. Find the perimeter of $\\triangle XYZ$.`,
    steps: [
      { instruction: `What is the length of $XY$?`, answer: `${a}`, accept: [`XY=${a}`], hint: `$X, Y$ pair with $P, Q$, so $XY \\cong PQ$.` },
      { instruction: `Congruent triangles have equal perimeters. Perimeter of $\\triangle XYZ$?`, answer: `${per}`, accept: [`${per} units`], hint: `$${a} + ${b} + ${c}$.` },
    ],
    finalAnswer: { value: `${per}`, unit: "units" },
    solutionNarrative: `Each side transfers by CPCTC, so the perimeter of the copy is $${a} + ${b} + ${c} = ${per}$.`,
  };
};

// d3: scrambled correspondence △ABC ≅ △PNM — read side and angle across it.
fill["geo3-cpctc-3"] = (rng, idx) => {
  const a = rng.int(5, 16);
  const theta = rng.int(25, 130);
  return {
    id: `gen.geo3-cpctc-3.${idx}`, generated: true, concepts: ["congruence-and-cpctc"], difficulty: 3, context: "abstract",
    prompt: `$\\triangle ABC \\cong \\triangle PNM$ (watch the letter order!), with $AB = ${a}$ and $m\\angle B = ${theta}^\\circ$. Read off parts of $\\triangle PNM$.`,
    steps: [
      { instruction: `Which side of $\\triangle PNM$ corresponds to $AB$? (Type the two letters.)`, answer: "PN", accept: ["NP"], hint: `$A \\to P$ and $B \\to N$ by letter order.` },
      { instruction: `What is the length of $PN$?`, answer: `${a}`, accept: [`PN=${a}`], hint: `$PN \\cong AB = ${a}$.` },
      { instruction: `What is $m\\angle N$ in degrees?`, answer: `${theta}`, accept: [`${theta} degrees`], hint: `$\\angle N$ corresponds to $\\angle B$.` },
    ],
    finalAnswer: { value: `PN = ${a}, m∠N = ${theta}°`, unit: "" },
    solutionNarrative: `The correspondence is $A \\to P$, $B \\to N$, $C \\to M$, so $PN = ${a}$ and $m\\angle N = ${theta}^\\circ$ — regardless of how the picture is drawn.`,
  };
};

// ===========================================================================
// concept: congruence-criteria
// ===========================================================================

// d1: count marked side pairs, name the criterion.
fill["geo3-criteria-1"] = (rng, idx) => {
  const scenarios = [
    { desc: "all three pairs of corresponding sides are marked congruent, and no angles are marked", nSides: 3, crit: "SSS", why: "Three side pairs alone are enough." },
    { desc: "two pairs of sides are marked congruent, together with the pair of angles BETWEEN those sides", nSides: 2, crit: "SAS", why: "Side, included angle, side." },
    { desc: "two pairs of angles are marked congruent, together with the pair of sides BETWEEN those angles", nSides: 1, crit: "ASA", why: "Angle, included side, angle." },
    { desc: "two pairs of angles are marked congruent, together with a pair of sides NOT between those angles", nSides: 1, crit: "AAS", why: "Two angles and a non-included side." },
  ];
  const sc = rng.pick(scenarios);
  const c = CRIT[sc.crit];
  return {
    id: `gen.geo3-criteria-1.${idx}`, generated: true, concepts: ["congruence-criteria"], difficulty: 1, context: "abstract",
    prompt: `In a diagram of two triangles, ${sc.desc}. Which congruence criterion applies?`,
    plot: twinTrianglePlot(["A", "B", "C"], ["D", "E", "F"], "Two triangles with matching marked parts."),
    steps: [
      { instruction: `How many pairs of SIDES are marked congruent?`, answer: `${sc.nSides}`, accept: sc.nSides === 3 ? ["three"] : sc.nSides === 2 ? ["two"] : ["one"], hint: `Count only tick-marked side pairs, not angle arcs.` },
      { instruction: `Which criterion applies? ${MENU4}`, answer: c.answer, accept: c.accept, hint: sc.why },
    ],
    finalAnswer: { value: c.answer, unit: "" },
    solutionNarrative: `${sc.desc[0].toUpperCase()}${sc.desc.slice(1)} — that is exactly the ${c.answer} criterion. ${sc.why}`,
  };
};

// d2: two sides + one angle — included gives SAS, non-included is the SSA trap.
fill["geo3-criteria-2"] = (rng, idx) => {
  const included = rng.pick([true, false]);
  const c = included ? CRIT.SAS : CRIT.NONE;
  const angleDesc = included
    ? "the marked angle pair is at the vertex SHARED by the two marked sides"
    : "the marked angle pair is at a vertex touching only ONE of the two marked sides";
  return {
    id: `gen.geo3-criteria-2.${idx}`, generated: true, concepts: ["congruence-criteria"], difficulty: 2, context: "abstract",
    prompt: `Two triangles have two pairs of sides marked congruent, plus one pair of congruent angles: ${angleDesc}. Decide what can be concluded.`,
    steps: [
      { instruction: `Is the marked angle INCLUDED between the two marked sides? (yes/no)`, answer: included ? "yes" : "no", accept: included ? ["y"] : ["n"], hint: `Included = the angle's vertex is the endpoint the two sides share.` },
      { instruction: `Which criterion, if any, applies? ${MENU5}`, answer: c.answer, accept: c.accept, hint: included ? `Side, included angle, side.` : `Two sides + non-included angle is SSA — the swinging door.` },
    ],
    finalAnswer: { value: c.answer, unit: "" },
    solutionNarrative: included
      ? `The angle sits between the two marked sides, so SAS applies.`
      : `The angle is NOT between the marked sides — this is the SSA pattern, which can produce two different triangles, so nothing can be concluded.`,
  };
};

// d3: two angles + one side with numeric third angle, ASA vs AAS.
fill["geo3-criteria-3"] = (rng, idx) => {
  const [t1, t2, t3] = trianglePairOfAngles(rng);
  const includedSide = rng.pick([true, false]);
  const c = includedSide ? CRIT.ASA : CRIT.AAS;
  const sideName = includedSide ? "AB" : "BC";
  return {
    id: `gen.geo3-criteria-3.${idx}`, generated: true, concepts: ["congruence-criteria"], difficulty: 3, context: "abstract",
    prompt: `In $\\triangle ABC$ and $\\triangle DEF$: $\\angle A \\cong \\angle D$ (both $${t1}^\\circ$), $\\angle B \\cong \\angle E$ (both $${t2}^\\circ$), and $${sideName} \\cong ${includedSide ? "DE" : "EF"}$. Analyze the setup.`,
    steps: [
      { instruction: `Find $m\\angle C$ using the angle sum.`, answer: `${t3}`, accept: [`${t3} degrees`], hint: `$180 - ${t1} - ${t2}$.` },
      { instruction: `The side included between $\\angle A$ and $\\angle B$ is $AB$. Is the marked side $${sideName}$ that included side? (yes/no)`, answer: includedSide ? "yes" : "no", accept: includedSide ? ["y"] : ["n"], hint: `The included side connects the two marked angle vertices $A$ and $B$.` },
      { instruction: `Which criterion applies? ${MENU4}`, answer: c.answer, accept: c.accept, hint: includedSide ? `Angle, included side, angle.` : `Two angles and a NON-included side.` },
    ],
    finalAnswer: { value: `${c.answer} (with m∠C = ${t3}°)`, unit: "" },
    solutionNarrative: `$m\\angle C = 180 - ${t1} - ${t2} = ${t3}^\\circ$. The marked side $${sideName}$ ${includedSide ? "connects the two marked angle vertices, so ASA" : "does not connect the two marked angle vertices, so AAS"} applies.`,
  };
};

// ===========================================================================
// concept: solving-with-congruence
// ===========================================================================

// d1: one linear equation from CPCTC.
fill["geo3-solve-1"] = (rng, idx) => {
  const x0 = rng.int(2, 9);
  const m = rng.int(2, 5);
  const b = rng.int(1, 12);
  const L = m * x0 + b;
  return {
    id: `gen.geo3-solve-1.${idx}`, generated: true, concepts: ["solving-with-congruence"], difficulty: 1, context: "abstract",
    prompt: `$\\triangle ABC \\cong \\triangle DEF$, $AB = ${L}$, and $DE = ${m}x + ${b}$. Find $x$.`,
    steps: [
      { instruction: `By CPCTC, $DE = AB$. Solve $${m}x + ${b} = ${L}$ for $x$.`, answer: `${x0}`, accept: [`x=${x0}`, `x = ${x0}`], hint: `Subtract ${b}, then divide by ${m}.` },
      { instruction: `Check: with that $x$, what is $DE$?`, answer: `${L}`, accept: [`DE=${L}`], hint: `$${m}(${x0}) + ${b}$.` },
    ],
    finalAnswer: { value: `x = ${x0}`, unit: "" },
    solutionNarrative: `CPCTC forces $${m}x + ${b} = ${L}$, so $${m}x = ${L - b}$ and $x = ${x0}$; then $DE = ${L}$, matching $AB$.`,
  };
};

// d2: find the third angle so ASA activates.
fill["geo3-solve-2"] = (rng, idx) => {
  const [t1, t2, t3] = trianglePairOfAngles(rng);
  return {
    id: `gen.geo3-solve-2.${idx}`, generated: true, concepts: ["solving-with-congruence"], difficulty: 2, context: "abstract",
    prompt: `In $\\triangle ABC$, $m\\angle A = ${t1}^\\circ$ and $m\\angle B = ${t2}^\\circ$. $\\triangle DEF$ has $m\\angle D = ${t1}^\\circ$, $m\\angle E = ${t2}^\\circ$, and $DE \\cong AB$. Work toward a criterion.`,
    steps: [
      { instruction: `Find $m\\angle C$ using the angle sum.`, answer: `${t3}`, accept: [`${t3} degrees`], hint: `$180 - ${t1} - ${t2}$.` },
      { instruction: `$AB$ connects the vertices of the two matched angles, so it is the included side. Which criterion applies? ${MENU4}`, answer: CRIT.ASA.answer, accept: CRIT.ASA.accept, hint: `Angle, included side, angle.` },
    ],
    finalAnswer: { value: `ASA (with m∠C = ${t3}°)`, unit: "" },
    solutionNarrative: `$m\\angle C = 180 - ${t1} - ${t2} = ${t3}^\\circ$; the matched side $AB$/$DE$ lies between the matched angle pairs, so ASA applies.`,
  };
};

// d3: two unknowns (side equation + angle equation) plus a perimeter.
fill["geo3-solve-3"] = (rng, idx) => {
  const x0 = rng.int(3, 8);
  const m = rng.int(2, 3);
  const b = rng.int(1, 6);
  const L = m * x0 + b; // 7..30
  // other two sides: ranges tied to L so the triangle inequality is always
  // satisfiable (s2 + s3 > L needs s2, s3 near or above L/2 — guaranteed here).
  let s2, s3;
  do {
    s2 = rng.int(L - 4, L + 4); s3 = rng.int(L - 4, L + 4);
  } while (s2 < 2 || s3 < 2 || s2 === s3 || s2 === L || s3 === L ||
           L + s2 <= s3 || L + s3 <= s2 || s2 + s3 <= L);
  const per = L + s2 + s3;
  const y0 = rng.int(4, 12);
  const k = rng.pick([4, 5, 6]);
  const theta = k * y0; // angle measure; <= 72 degrees, always valid
  return {
      id: `gen.geo3-solve-3.${idx}`, generated: true, concepts: ["solving-with-congruence"], difficulty: 3, context: "abstract",
      prompt: `$\\triangle ABC \\cong \\triangle DEF$ with $AB = ${m}x + ${b}$, $DE = ${L}$, $m\\angle A = (${k}y)^\\circ$, $m\\angle D = ${theta}^\\circ$, $BC = ${s2}$, and $CA = ${s3}$. Find $x$, $y$, and the perimeter of $\\triangle DEF$.`,
      steps: [
        { instruction: `CPCTC: $AB = DE$. Solve $${m}x + ${b} = ${L}$.`, answer: `${x0}`, accept: [`x=${x0}`, `x = ${x0}`], hint: `Subtract ${b}, divide by ${m}.` },
        { instruction: `CPCTC: $m\\angle A = m\\angle D$. Solve $${k}y = ${theta}$.`, answer: `${y0}`, accept: [`y=${y0}`, `y = ${y0}`], hint: `Divide by ${k}.` },
        { instruction: `Perimeter of $\\triangle DEF$ (equal to that of $\\triangle ABC$)?`, answer: `${per}`, accept: [`${per} units`], hint: `$${L} + ${s2} + ${s3}$.` },
      ],
      finalAnswer: { value: `x = ${x0}, y = ${y0}, perimeter ${per}`, unit: "" },
      solutionNarrative: `$${m}x + ${b} = ${L}$ gives $x = ${x0}$; $${k}y = ${theta}$ gives $y = ${y0}$; the sides $${L}, ${s2}, ${s3}$ total $${per}$, shared by both triangles.`,
    };
};

// ===========================================================================
// concept: congruence-proofs
// ===========================================================================

// d1: shared-diagonal proof — reflexive property, then SSS.
fill["geo3-proof-1"] = (rng, idx) => {
  const [A, B, C, D] = rng.pick([["A", "B", "C", "D"], ["P", "Q", "R", "S"], ["W", "X", "Y", "Z"]]);
  return {
    id: `gen.geo3-proof-1.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 1, context: "abstract",
    prompt: `Given $${A}${B} \\cong ${C}${B}$ and $${A}${D} \\cong ${C}${D}$, prove $\\triangle ${A}${B}${D} \\cong \\triangle ${C}${B}${D}$. Supply the reasons.`,
    steps: [
      { instruction: `Statement: $${B}${D} \\cong ${B}${D}$. Reason? ${RMENU}`, answer: REASON.reflexive.answer, accept: REASON.reflexive.accept, hint: `The diagonal $${B}${D}$ belongs to BOTH triangles.` },
      { instruction: `Three side pairs now match. Which criterion? ${MENU4}`, answer: CRIT.SSS.answer, accept: CRIT.SSS.accept, hint: `$${A}${B}/${C}${B}$, $${A}${D}/${C}${D}$, and the shared $${B}${D}$.` },
    ],
    finalAnswer: { value: "reflexive property; SSS", unit: "" },
    solutionNarrative: `The shared diagonal $${B}${D}$ is congruent to itself by the reflexive property, giving three side pairs — SSS.`,
  };
};

// d2: butterfly proof — vertical angles, SAS, CPCTC.
fill["geo3-proof-2"] = (rng, idx) => {
  const [A, B, C, D, X] = rng.pick([["A", "B", "C", "D", "X"], ["P", "Q", "R", "S", "M"], ["J", "K", "L", "N", "O"]]);
  return {
    id: `gen.geo3-proof-2.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 2, context: "abstract",
    prompt: `Segments $${A}${C}$ and $${B}${D}$ intersect at $${X}$, with $${A}${X} \\cong ${C}${X}$ and $${B}${X} \\cong ${D}${X}$. Prove $\\triangle ${A}${X}${B} \\cong \\triangle ${C}${X}${D}$ and conclude $${A}${B} \\cong ${C}${D}$.`,
    plot: butterflyPlot(A, B, C, D, X),
    steps: [
      { instruction: `Statement: $\\angle ${A}${X}${B} \\cong \\angle ${C}${X}${D}$. Reason? ${RMENU}`, answer: REASON.vertical.answer, accept: REASON.vertical.accept, hint: `Opposite angles at the crossing point $${X}$.` },
      { instruction: `Two side pairs with the included angle pair — which criterion? ${MENU4}`, answer: CRIT.SAS.answer, accept: CRIT.SAS.accept, hint: `The angle at $${X}$ sits between $${A}${X}$ and $${B}${X}$.` },
      { instruction: `Which reason justifies $${A}${B} \\cong ${C}${D}$? ${RMENU}`, answer: REASON.cpctc.answer, accept: REASON.cpctc.accept, hint: `Corresponding parts, after the congruence is sealed.` },
    ],
    finalAnswer: { value: "vertical angles; SAS; CPCTC", unit: "" },
    solutionNarrative: `The vertical angles at $${X}$ are included between the given side pairs, so SAS proves the congruence and CPCTC delivers $${A}${B} \\cong ${C}${D}$.`,
  };
};

// d3: midpoint proof with a numeric CPCTC transfer — 4 steps.
fill["geo3-proof-3"] = (rng, idx) => {
  const k = rng.int(4, 15);
  return {
    id: `gen.geo3-proof-3.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 3, context: "abstract",
    prompt: `$M$ is the midpoint of both $AC$ and $BD$, and $AM = ${k}$. Prove $\\triangle AMB \\cong \\triangle CMD$ and conclude $AB \\cong CD$.`,
    steps: [
      { instruction: `Statement: $AM \\cong MC$. Reason? ${RMENU_MID}`, answer: REASON.midpoint.answer, accept: REASON.midpoint.accept, hint: `A midpoint splits a segment into two congruent halves.` },
      { instruction: `With $AM = ${k}$, what is $MC$?`, answer: `${k}`, accept: [`MC=${k}`], hint: `The two halves of $AC$ are equal.` },
      { instruction: `$\\angle AMB \\cong \\angle CMD$ (vertical angles) is included between the midpoint side pairs. Which criterion? ${MENU4}`, answer: CRIT.SAS.answer, accept: CRIT.SAS.accept, hint: `Side, included vertical angle, side.` },
      { instruction: `Which reason justifies $AB \\cong CD$? ${RMENU_MID}`, answer: REASON.cpctc.answer, accept: REASON.cpctc.accept, hint: `After the congruence, corresponding parts follow.` },
    ],
    finalAnswer: { value: `definition of midpoint; MC = ${k}; SAS; CPCTC`, unit: "" },
    solutionNarrative: `The midpoint gives $AM \\cong MC$ (both $${k}$) and $BM \\cong MD$; the vertical angles at $M$ are included, so SAS applies, and CPCTC gives $AB \\cong CD$.`,
  };
};
