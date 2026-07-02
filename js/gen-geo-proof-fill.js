// gen-geo-proof-fill.js
// Parametric generators for geometry.intro-to-proof (template prefix gpr-),
// one generator per concept per difficulty tier (4 concepts x 3 tiers = 12).
// Self-contained: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's `generators` map. No imports.
//
// Design notes (verified against the real grader, js/problem-engine.js):
// - Reason steps are exact-string answers. normalize() lowercases and strips
//   all whitespace, and isWord() shields pure-letter strings from the
//   polynomial engine, so "SAS" vs "ASA" vs "AAS" can NOT cross-match via
//   anagram collision. Accept lists carry the casual variants.
// - Statement steps are numeric or equation answers, which grade natively
//   (side-swap invariant, but never simplified across "=").
// - Every reason step's instruction enumerates its answer menu.

export const fill = {};

// --- Fixed reason tables (answer + generous accept variants) ---------------
const R = {
  vertical: { answer: "vertical angles", accept: ["vertical angle theorem", "vertical angles theorem", "vert angles", "vertical angles are congruent"] },
  linearPair: { answer: "linear pair", accept: ["linear pair postulate", "linear pairs", "supplementary", "supplementary angles", "angles on a straight line"] },
  angleAdd: { answer: "angle addition", accept: ["angle addition postulate", "addition of angles", "angle addition property"] },
  corresponding: { answer: "corresponding angles", accept: ["corresponding angles postulate", "corresponding", "corresponding angle"] },
  altInterior: { answer: "alternate interior angles", accept: ["alternate interior", "alternate interior angle theorem", "alternate interior angles theorem", "alt interior angles", "alt int angles"] },
  addProp: { answer: "addition property", accept: ["addition property of equality", "addition", "apoe"] },
  subProp: { answer: "subtraction property", accept: ["subtraction property of equality", "subtraction", "spoe"] },
  divProp: { answer: "division property", accept: ["division property of equality", "division", "dpoe"] },
  distProp: { answer: "distributive property", accept: ["distributive", "distribution", "distributive property of equality"] },
  reflexive: { answer: "reflexive property", accept: ["reflexive", "reflexive property of congruence", "reflexive property of equality"] },
  given: { answer: "given", accept: ["givens", "it is given"] },
  cpctc: { answer: "cpctc", accept: ["corresponding parts of congruent triangles are congruent", "cpct"] },
  sss: { answer: "sss", accept: ["side side side", "sss postulate", "sss congruence"] },
  sas: { answer: "sas", accept: ["side angle side", "sas postulate", "sas congruence"] },
  asa: { answer: "asa", accept: ["angle side angle", "asa postulate", "asa congruence"] },
  aas: { answer: "aas", accept: ["angle angle side", "aas theorem", "aas congruence", "saa"] },
};

const ANGLE_MENU = "(Answer with one of: vertical angles, linear pair, angle addition, corresponding angles, alternate interior angles)";
const EQ_MENU = "(Answer with one of: addition property, subtraction property, multiplication property, division property, distributive property)";
const CRIT_MENU = "(Answer with one of: SSS, SAS, ASA, AAS)";
const CONG_MENU = "(Answer with one of: given, reflexive property, vertical angles, CPCTC)";

const reasonStep = (question, r, menu, hint) => ({
  instruction: `${question} ${menu}`,
  answer: r.answer,
  accept: r.accept.slice(),
  hint,
});

// ============================================================================
// Concept: conditionals-and-counterexamples
// ============================================================================

const CONDITIONALS = [
  { p: "a shape is a square", q: "it has four equal sides" },
  { p: "a number is divisible by 10", q: "it ends in the digit 0" },
  { p: "an angle measures 90 degrees", q: "it is a right angle" },
  { p: "two lines are parallel", q: "they never intersect" },
  { p: "an animal is a spider", q: "it has eight legs" },
  { p: "a triangle is equilateral", q: "all three of its angles are equal" },
];
const FORMS = [
  { desc: "swapping the hypothesis and conclusion", name: "converse" },
  { desc: "negating both the hypothesis and the conclusion (without swapping)", name: "inverse" },
  { desc: "swapping AND negating both parts", name: "contrapositive" },
];

fill["gpr-conditional-parts-d1"] = (rng, idx) => {
  const c = rng.pick(CONDITIONALS);
  const askHyp = rng.int(0, 1) === 0;
  const form = rng.pick(FORMS);
  const part = askHyp ? c.p : c.q;
  const name = askHyp ? "hypothesis" : "conclusion";
  return {
    id: `gen.gpr-conditional-parts-d1.${idx}`, generated: true, concepts: ["conditionals-and-counterexamples"], difficulty: 1, context: "abstract",
    prompt: `Consider the conditional statement: "If ${c.p}, then ${c.q}."`,
    steps: [
      { instruction: `The phrase "${part}" is which named part of the conditional? (Answer with one of: hypothesis, conclusion)`, answer: name, accept: [`the ${name}`], hint: "The 'if' part is the hypothesis; the 'then' part is the conclusion." },
      { instruction: `The new statement formed by ${form.desc} is called the what? (Answer with one of: converse, inverse, contrapositive)`, answer: form.name, accept: [`the ${form.name}`], hint: "Swap only = converse. Negate only = inverse. Both = contrapositive." },
    ],
    finalAnswer: { value: form.name, unit: "" },
    solutionNarrative: `The 'if' part is the hypothesis and the 'then' part is the conclusion, so "${part}" is the ${name}. ${form.desc[0].toUpperCase() + form.desc.slice(1)} produces the ${form.name}.`,
  };
};

fill["gpr-counterexample-d2"] = (rng, idx) => {
  if (rng.int(0, 1) === 0) {
    const n = rng.pick([3, 5, 7, 9]);
    const cex = 2 * n;
    return {
      id: `gen.gpr-counterexample-d2.${idx}`, generated: true, concepts: ["conditionals-and-counterexamples"], difficulty: 2, context: "abstract",
      prompt: `A student notices that ${n} is odd and claims: "Every multiple of ${n} is odd." Hunt for a counterexample among the small multiples of ${n}.`,
      steps: [
        { instruction: `Compute $2 \\times ${n}$. (Give a number.)`, answer: `${cex}`, accept: [], hint: `Double ${n}.` },
        { instruction: `Is ${cex} odd? (yes/no)`, answer: "no", accept: ["even", "it is even", "not odd"], hint: "It ends in an even digit." },
        { instruction: `${cex} is a multiple of ${n} that is not odd — a counterexample. Is the claim true or false? (Answer: true or false)`, answer: "false", accept: ["the claim is false"], hint: "One counterexample settles it." },
      ],
      finalAnswer: { value: "false", unit: "" },
      solutionNarrative: `$2 \\times ${n} = ${cex}$ is a multiple of ${n} but is even, so the claim is false. One counterexample is all it takes.`,
    };
  }
  const k = rng.pick([3, 4, 5, 6]);
  const cex = 3 * k;
  return {
    id: `gen.gpr-counterexample-d2.${idx}`, generated: true, concepts: ["conditionals-and-counterexamples"], difficulty: 2, context: "abstract",
    prompt: `A student claims: "If a number is divisible by ${k}, then it is divisible by ${2 * k}." Test the claim.`,
    steps: [
      { instruction: `Compute $3 \\times ${k}$. (Give a number.)`, answer: `${cex}`, accept: [], hint: `Triple ${k}.` },
      { instruction: `Is ${cex} divisible by ${2 * k}? (yes/no)`, answer: "no", accept: ["it is not", "not divisible"], hint: `$${cex} \\div ${2 * k} = 1.5$, not a whole number.` },
      { instruction: `${cex} is divisible by ${k} but not by ${2 * k} — a counterexample. Is the claim true or false? (Answer: true or false)`, answer: "false", accept: ["the claim is false"], hint: "A single counterexample disproves a claim." },
    ],
    finalAnswer: { value: "false", unit: "" },
    solutionNarrative: `$3 \\times ${k} = ${cex}$ is divisible by ${k} but not by ${2 * k}, so the claim is false.`,
  };
};

const DIV_PAIRS = [
  { a: 6, b: 3, n: 9 },
  { a: 10, b: 5, n: 15 },
  { a: 8, b: 4, n: 12 },
  { a: 9, b: 3, n: 6 },
  { a: 12, b: 4, n: 8 },
  { a: 10, b: 2, n: 4 },
];

fill["gpr-conditional-truth-d3"] = (rng, idx) => {
  const { a, b, n } = rng.pick(DIV_PAIRS);
  return {
    id: `gen.gpr-conditional-truth-d3.${idx}`, generated: true, concepts: ["conditionals-and-counterexamples"], difficulty: 3, context: "abstract",
    prompt: `Consider the statement: "If a number is divisible by ${a}, then it is divisible by ${b}." Since $${a} = ${a / b} \\times ${b}$, every multiple of ${a} is automatically a multiple of ${b} — the statement is TRUE. Now investigate its converse.`,
    steps: [
      { instruction: "The converse swaps the parts: \"If a number is divisible by " + b + ", then it is divisible by " + a + ".\" What is this swap-only relative of a conditional called? (Answer with one of: converse, inverse, contrapositive)", answer: "converse", accept: ["the converse"], hint: "Swap only, no negation." },
      { instruction: `Test the converse with the number ${n}: compute $${n} \\div ${b}$. (Give a number.)`, answer: `${n / b}`, accept: [], hint: `${n} is a multiple of ${b}.` },
      { instruction: `So ${n} satisfies the converse's hypothesis. Is ${n} divisible by ${a}? (yes/no)`, answer: "no", accept: ["it is not", "not divisible"], hint: `$${n} \\div ${a}$ is not a whole number.` },
      { instruction: `${n} is a counterexample to the converse. Is the converse true or false? (Answer: true or false)`, answer: "false", accept: ["the converse is false"], hint: "A true statement's converse can still be false — and here it is." },
    ],
    finalAnswer: { value: "false", unit: "" },
    solutionNarrative: `The converse is "if divisible by ${b}, then divisible by ${a}." But $${n} = ${n / b} \\times ${b}$ is divisible by ${b} and not by ${a}, so the converse is false even though the original is true.`,
  };
};

// ============================================================================
// Concept: algebraic-proof
// ============================================================================

fill["gpr-algproof-onestep-d1"] = (rng, idx) => {
  const x0 = rng.int(3, 12);
  if (rng.int(0, 1) === 0) {
    const a = rng.int(2, 9);
    return {
      id: `gen.gpr-algproof-onestep-d1.${idx}`, generated: true, concepts: ["algebraic-proof"], difficulty: 1, context: "abstract",
      prompt: `Complete the one-step proof: if $${a}x = ${a * x0}$, then $x = ${x0}$.`,
      steps: [
        { instruction: "Statement: solve for $x$.", answer: `x = ${x0}`, accept: [`x=${x0}`, `${x0}`], hint: `Divide both sides by ${a}.` },
        reasonStep(`Reason: which property of equality justifies dividing both sides by ${a}?`, R.divProp, EQ_MENU, "Both sides were divided by the same nonzero number."),
      ],
      finalAnswer: { value: `${x0}`, unit: "" },
      solutionNarrative: `Divide both sides by ${a} (division property of equality): $x = ${x0}$.`,
    };
  }
  const b = rng.int(4, 30);
  return {
    id: `gen.gpr-algproof-onestep-d1.${idx}`, generated: true, concepts: ["algebraic-proof"], difficulty: 1, context: "abstract",
    prompt: `Complete the one-step proof: if $x + ${b} = ${x0 + b}$, then $x = ${x0}$.`,
    steps: [
      { instruction: "Statement: solve for $x$.", answer: `x = ${x0}`, accept: [`x=${x0}`, `${x0}`], hint: `Subtract ${b} from both sides.` },
      reasonStep(`Reason: which property of equality justifies subtracting ${b} from both sides?`, R.subProp, EQ_MENU, "The same number was subtracted from both sides."),
    ],
    finalAnswer: { value: `${x0}`, unit: "" },
    solutionNarrative: `Subtract ${b} from both sides (subtraction property of equality): $x = ${x0}$.`,
  };
};

fill["gpr-algproof-twostep-d2"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const x0 = rng.int(3, 12);
  const b = rng.int(4, 30);
  const plus = rng.int(0, 1) === 0;
  const c = a * x0 + (plus ? b : -b);
  const eq = plus ? `${a}x + ${b} = ${c}` : `${a}x - ${b} = ${c}`;
  const undoReason = plus ? R.subProp : R.addProp;
  const undoHint = plus ? `Subtract ${b} from both sides.` : `Add ${b} to both sides.`;
  return {
    id: `gen.gpr-algproof-twostep-d2.${idx}`, generated: true, concepts: ["algebraic-proof"], difficulty: 2, context: "abstract",
    prompt: `Complete the two-column proof that if $${eq}$, then $x = ${x0}$, naming the property of equality behind each move.`,
    steps: [
      { instruction: "Statement 2: undo the constant term. What equation results?", answer: `${a}x = ${a * x0}`, accept: [`${a}x=${a * x0}`], hint: undoHint },
      reasonStep("Reason 2: which property justifies that move?", undoReason, EQ_MENU, plus ? "The same number was subtracted from both sides." : "The same number was added to both sides."),
      { instruction: "Statement 3: solve for $x$.", answer: `x = ${x0}`, accept: [`x=${x0}`, `${x0}`], hint: `Divide both sides by ${a}.` },
      reasonStep("Reason 3: which property justifies that move?", R.divProp, EQ_MENU, `Both sides were divided by ${a}.`),
    ],
    finalAnswer: { value: `${x0}`, unit: "" },
    solutionNarrative: `${plus ? `Subtract ${b}` : `Add ${b}`} (${undoReason.answer} of equality): $${a}x = ${a * x0}$. Divide by ${a} (division property of equality): $x = ${x0}$.`,
  };
};

fill["gpr-algproof-distribute-d3"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const b = rng.int(2, 9);
  const x0 = rng.int(3, 12);
  const c = a * (x0 + b);
  return {
    id: `gen.gpr-algproof-distribute-d3.${idx}`, generated: true, concepts: ["algebraic-proof"], difficulty: 3, context: "abstract",
    prompt: `Complete the two-column proof that if $${a}(x + ${b}) = ${c}$, then $x = ${x0}$, naming the property of equality behind every line.`,
    steps: [
      { instruction: "Statement 2: clear the parentheses. What equation results?", answer: `${a}x + ${a * b} = ${c}`, accept: [`${a}x+${a * b}=${c}`, `${a * b}+${a}x=${c}`], hint: `$${a}(x + ${b}) = ${a}x + ${a * b}$.` },
      reasonStep("Reason 2: which property justifies clearing the parentheses?", R.distProp, EQ_MENU, "$a(b + c) = ab + ac$."),
      { instruction: "Statement 3: undo the constant term. What equation results?", answer: `${a}x = ${a * x0}`, accept: [`${a}x=${a * x0}`], hint: `Subtract ${a * b} from both sides.` },
      reasonStep("Reason 3: which property justifies that move?", R.subProp, EQ_MENU, "The same number was subtracted from both sides."),
      { instruction: "Statement 4: solve for $x$.", answer: `x = ${x0}`, accept: [`x=${x0}`, `${x0}`], hint: `Divide both sides by ${a}.` },
      reasonStep("Reason 4: which property justifies that move?", R.divProp, EQ_MENU, `Both sides were divided by ${a}.`),
    ],
    finalAnswer: { value: `${x0}`, unit: "" },
    solutionNarrative: `Distribute (distributive property): $${a}x + ${a * b} = ${c}$. Subtract ${a * b} (subtraction property): $${a}x = ${a * x0}$. Divide by ${a} (division property): $x = ${x0}$.`,
  };
};

// ============================================================================
// Concept: angle-proofs
// ============================================================================

fill["gpr-angle-vertical-d1"] = (rng, idx) => {
  const theta = rng.int(25, 155);
  return {
    id: `gen.gpr-angle-vertical-d1.${idx}`, generated: true, concepts: ["angle-proofs"], difficulty: 1, context: "abstract",
    prompt: `Two straight lines cross. One of the four angles formed measures $${theta}^\\circ$. Justify the measures of the other angles.`,
    steps: [
      { instruction: "Statement: the angle directly opposite measures how many degrees?", answer: `${theta}`, accept: [], hint: "Opposite angles at a crossing are equal." },
      reasonStep("Reason: which fact justifies that?", R.vertical, ANGLE_MENU, "Opposite angles formed by two crossing lines are congruent."),
      { instruction: "Statement: an angle adjacent to it measures how many degrees?", answer: `${180 - theta}`, accept: [], hint: `$180 - ${theta}$.` },
      reasonStep("Reason: which fact justifies that?", R.linearPair, ANGLE_MENU, "Adjacent angles along a straight line sum to $180^\\circ$."),
    ],
    finalAnswer: { value: `${180 - theta}`, unit: "degrees" },
    solutionNarrative: `The vertical angle equals $${theta}^\\circ$ (vertical angles are congruent); the adjacent angle is $180 - ${theta} = ${180 - theta}^\\circ$ (linear pair).`,
  };
};

fill["gpr-angle-addition-d2"] = (rng, idx) => {
  const p = rng.int(20, 70);
  const q = rng.int(20, 70);
  const whole = p + q;
  return {
    id: `gen.gpr-angle-addition-d2.${idx}`, generated: true, concepts: ["angle-proofs"], difficulty: 2, context: "abstract",
    prompt: `Ray $BD$ lies inside $\\angle ABC$, with $m\\angle ABD = ${p}^\\circ$ and $m\\angle DBC = ${q}^\\circ$. Ray $BE$ extends ray $BA$ through $B$, so $\\angle ABC$ and $\\angle CBE$ form a linear pair. Justify each measure.`,
    steps: [
      { instruction: "Statement: find $m\\angle ABC$ in degrees.", answer: `${whole}`, accept: [], hint: `The whole equals the sum of its parts: $${p} + ${q}$.` },
      reasonStep("Reason: which postulate justifies $m\\angle ABD + m\\angle DBC = m\\angle ABC$?", R.angleAdd, ANGLE_MENU, "A whole angle equals the sum of its adjacent parts."),
      { instruction: "Statement: find $m\\angle CBE$ in degrees.", answer: `${180 - whole}`, accept: [], hint: `$180 - ${whole}$.` },
      reasonStep("Reason: which fact justifies that?", R.linearPair, ANGLE_MENU, "$\\angle ABC$ and $\\angle CBE$ sit on a straight line."),
    ],
    finalAnswer: { value: `${180 - whole}`, unit: "degrees" },
    solutionNarrative: `By the angle addition postulate, $m\\angle ABC = ${p} + ${q} = ${whole}^\\circ$. Its linear-pair partner measures $180 - ${whole} = ${180 - whole}^\\circ$.`,
  };
};

const ANGLE_SOLVE_CFGS = [
  { type: "equal", reason: "vertical", desc: "Two straight lines cross. One angle measures $(EXPR1)^\\circ$ and the angle directly opposite it measures $(EXPR2)^\\circ$.", why: "Opposite angles at a crossing are congruent." },
  { type: "equal", reason: "corresponding", desc: "A transversal crosses two parallel lines. An angle at the first crossing measures $(EXPR1)^\\circ$ and the corresponding angle (same position) at the second crossing measures $(EXPR2)^\\circ$.", why: "Corresponding angles at parallel lines are congruent." },
  { type: "equal", reason: "altInterior", desc: "A transversal crosses two parallel lines. An alternate interior pair measures $(EXPR1)^\\circ$ and $(EXPR2)^\\circ$.", why: "Alternate interior angles at parallel lines are congruent." },
  { type: "supp", reason: "linearPair", desc: "Two angles form a linear pair, measuring $(EXPR1)^\\circ$ and $(EXPR2)^\\circ$.", why: "A linear pair sums to $180^\\circ$." },
];

fill["gpr-angle-solve-d3"] = (rng, idx) => {
  const cfg = rng.pick(ANGLE_SOLVE_CFGS);
  let x0, a, b, c2, d, eqAnswer, eqAccept;
  if (cfg.type === "equal") {
    x0 = rng.int(10, 30);
    a = rng.int(3, 5);
    c2 = a - 2;
    b = rng.int(1, 20);
    d = (a - c2) * x0 + b;
    eqAnswer = `${a}x + ${b} = ${c2}x + ${d}`;
    eqAccept = [`${a}x+${b}=${c2}x+${d}`, `${c2}x+${d}=${a}x+${b}`];
  } else {
    x0 = rng.int(10, 20);
    a = rng.int(2, 3);
    c2 = rng.int(2, 3);
    b = rng.int(1, 15);
    d = 180 - (a + c2) * x0 - b;
    eqAnswer = `${a}x + ${b} + ${c2}x + ${d} = 180`;
    eqAccept = [`(${a}x+${b})+(${c2}x+${d})=180`, `${a + c2}x+${b + d}=180`, `${a}x+${b}+${c2}x+${d}=180`];
  }
  const measure = a * x0 + b;
  const reason = R[cfg.reason];
  return {
    id: `gen.gpr-angle-solve-d3.${idx}`, generated: true, concepts: ["angle-proofs"], difficulty: 3, context: "abstract",
    prompt: cfg.desc.replace("EXPR1", `${a}x + ${b}`).replace("EXPR2", cfg.type === "equal" ? `${c2}x + ${d}` : `${c2}x + ${d}`) + " Prove the measures, justifying each step.",
    steps: [
      { instruction: `Statement 1: write the equation relating the two expressions${cfg.type === "supp" ? " (they sum to 180)" : " (they are equal)"}.`, answer: eqAnswer, accept: eqAccept, hint: cfg.why },
      reasonStep("Reason 1: which fact justifies that equation?", reason, ANGLE_MENU, cfg.why),
      { instruction: "Statement 2: solve for $x$.", answer: `x = ${x0}`, accept: [`x=${x0}`, `${x0}`], hint: "Gather the $x$ terms, then isolate." },
      { instruction: `Statement 3: find the measure of the $(${a}x + ${b})^\\circ$ angle, in degrees.`, answer: `${measure}`, accept: [], hint: `$${a}(${x0}) + ${b}$.` },
    ],
    finalAnswer: { value: `${measure}`, unit: "degrees" },
    solutionNarrative: `${cfg.why} So $${eqAnswer}$, giving $x = ${x0}$ and a measure of $${measure}^\\circ$.`,
  };
};

// ============================================================================
// Concept: congruence-proofs
// ============================================================================

const SHARED_SIDE_CTXS = [
  { setup: "An A-frame ladder is modeled as $\\triangle ABC$ and $\\triangle DBC$ sharing the brace $BC$", shared: "BC" },
  { setup: "A roof truss contains $\\triangle PQR$ and $\\triangle SQR$ sharing the central strut $QR$", shared: "QR" },
  { setup: "A kite frame is built as $\\triangle JKL$ and $\\triangle MKL$ sharing the spar $KL$", shared: "KL" },
  { setup: "A bridge gusset holds $\\triangle ABD$ and $\\triangle CBD$ sharing the plate edge $BD$", shared: "BD" },
];

fill["gpr-cong-shared-side-d1"] = (rng, idx) => {
  const ctx = rng.pick(SHARED_SIDE_CTXS);
  const sssCase = rng.int(0, 1) === 0;
  const marks = sssCase
    ? "the two remaining pairs of sides are marked congruent"
    : `one pair of sides is marked congruent, along with the pair of angles those sides make with ${ctx.shared} (the included angles)`;
  const crit = sssCase ? R.sss : R.sas;
  return {
    id: `gen.gpr-cong-shared-side-d1.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 1, context: "applied",
    prompt: `${ctx.setup}. In the design drawing, ${marks}.`,
    steps: [
      reasonStep(`Statement: $${ctx.shared} \\cong ${ctx.shared}$. Reason: which property justifies a shared side being congruent to itself?`, R.reflexive, CONG_MENU, "Anything is congruent to itself."),
      reasonStep("With the shared side counted, which congruence criterion proves the two triangles congruent?", crit, CRIT_MENU, sssCase ? "Three pairs of sides match." : "Two side pairs and the included angle pair match."),
    ],
    finalAnswer: { value: crit.answer.toUpperCase(), unit: "" },
    solutionNarrative: `The shared side is congruent to itself by the reflexive property, which completes ${crit.answer.toUpperCase()}: the two halves are congruent.`,
  };
};

const CRITERION_TABLE = [
  { desc: "three pairs of sides are marked congruent", crit: "sss", hint: "Side, side, side." },
  { desc: "two pairs of sides and the pair of angles BETWEEN them are marked congruent", crit: "sas", hint: "The angle is included between the two sides." },
  { desc: "two pairs of angles and the pair of sides BETWEEN them are marked congruent", crit: "asa", hint: "The side is included between the two angles." },
  { desc: "two pairs of angles and a pair of sides NOT between them are marked congruent", crit: "aas", hint: "The side is non-included." },
];

fill["gpr-cong-criterion-d2"] = (rng, idx) => {
  const row = rng.pick(CRITERION_TABLE);
  const a1 = rng.int(30, 70);
  const a2 = rng.int(30, 70);
  const crit = R[row.crit];
  return {
    id: `gen.gpr-cong-criterion-d2.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 2, context: "abstract",
    prompt: `In triangles $\\triangle ABC$ and $\\triangle DEF$, ${row.desc}. Separately, $m\\angle A = ${a1}^\\circ$ and $m\\angle B = ${a2}^\\circ$.`,
    steps: [
      { instruction: "Find $m\\angle C$ in degrees.", answer: `${180 - a1 - a2}`, accept: [], hint: `Triangle angles sum to 180: $180 - ${a1} - ${a2}$.` },
      reasonStep("Which congruence criterion proves the triangles congruent?", crit, CRIT_MENU, row.hint),
      reasonStep("After the triangles are proved congruent, which reason lets you conclude the remaining corresponding parts are congruent?", R.cpctc, CONG_MENU, "Corresponding Parts of Congruent Triangles are Congruent."),
    ],
    finalAnswer: { value: crit.answer.toUpperCase(), unit: "" },
    solutionNarrative: `$m\\angle C = 180 - ${a1} - ${a2} = ${180 - a1 - a2}^\\circ$. The marked parts match the ${crit.answer.toUpperCase()} pattern, and CPCTC then delivers every remaining pair.`,
  };
};

const PROOF_LETTER_SETS = [
  { s1: "AC", s2: "BD", m: "X", t1: "AXB", t2: "CXD", v1: "AX", v2: "CX", w1: "BX", w2: "DX", c1: "AB", c2: "CD" },
  { s1: "PR", s2: "QS", m: "M", t1: "PMQ", t2: "RMS", v1: "PM", v2: "RM", w1: "QM", w2: "SM", c1: "PQ", c2: "RS" },
  { s1: "JL", s2: "KN", m: "E", t1: "JEK", t2: "LEN", v1: "JE", v2: "LE", w1: "KE", w2: "NE", c1: "JK", c2: "LN" },
];

fill["gpr-cong-proof-d3"] = (rng, idx) => {
  const L = rng.pick(PROOF_LETTER_SETS);
  const theta = rng.int(30, 150);
  return {
    id: `gen.gpr-cong-proof-d3.${idx}`, generated: true, concepts: ["congruence-proofs"], difficulty: 3, context: "abstract",
    prompt: `Segments $\\overline{${L.s1}}$ and $\\overline{${L.s2}}$ bisect each other at point $${L.m}$, so $${L.v1} \\cong ${L.v2}$ and $${L.w1} \\cong ${L.w2}$. Given $m\\angle ${L.t1} = ${theta}^\\circ$, prove $\\triangle ${L.t1} \\cong \\triangle ${L.t2}$ and then $${L.c1} \\cong ${L.c2}$.`,
    steps: [
      reasonStep(`Statement: $\\angle ${L.t1} \\cong \\angle ${L.t2}$. Reason: which fact justifies it?`, R.vertical, CONG_MENU, `The two segments cross at $${L.m}$, forming opposite angles.`),
      { instruction: `Statement: find $m\\angle ${L.t2}$ in degrees.`, answer: `${theta}`, accept: [], hint: "Vertical angles are equal." },
      reasonStep(`Two side pairs with the INCLUDED angle pair match. Which criterion proves $\\triangle ${L.t1} \\cong \\triangle ${L.t2}$?`, R.sas, CRIT_MENU, `The angle at $${L.m}$ sits between the two given sides.`),
      reasonStep(`Which reason then justifies the final statement $${L.c1} \\cong ${L.c2}$?`, R.cpctc, CONG_MENU, "After congruence, corresponding parts follow."),
    ],
    finalAnswer: { value: "SAS, then CPCTC", unit: "" },
    solutionNarrative: `$\\angle ${L.t1} \\cong \\angle ${L.t2}$ by vertical angles (both $${theta}^\\circ$); with the two given side pairs this is SAS, and CPCTC yields $${L.c1} \\cong ${L.c2}$.`,
  };
};
