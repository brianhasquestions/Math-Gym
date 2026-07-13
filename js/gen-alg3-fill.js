// gen-alg3-fill.js
// Parametric generators for two wave-14 curriculum-gap topics:
//   algebra.absolute-value            (aab- prefix)
//   algebra-2.function-transformations (a2v- prefix)
// One template per (concept, difficulty) tier — 12 per topic, 24 total.
// Self-contained: no imports from generator.js. Exports a `fill` map of
// template-name -> generator fn, matching the pack pattern of gen-nt2-fill.js.
// Every answer is computed in-pack from the SAME numbers shown in the prompt.

// ---------------------------------------------------------------------------
// Formatting helpers (all in-pack)
// ---------------------------------------------------------------------------

// "+ 3" / "- 3" for appending a signed constant to an expression.
const addConst = (k) => (k >= 0 ? `+ ${k}` : `- ${-k}`);

// "(x - 3)" for h = 3, "(x + 3)" for h = -3 (the inside-shift argument).
const xShift = (h) => (h >= 0 ? `(x - ${h})` : `(x + ${-h})`);

// Inside of |a x + b| with clean signs; omits "+ 0", renders coefficient 1 as "x".
const linExpr = (a, b, v = "x") => {
  const head = a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  return b === 0 ? head : `${head} ${addConst(b)}`;
};

// Quadratic A x^2 + B x + C as a plain-text answer string ("2x^2 - 4x + 5").
// Omits zero terms, renders |coef| 1 without the digit.
const quadStr = (A, B, C) => {
  let s = A === 1 ? "x^2" : A === -1 ? "-x^2" : `${A}x^2`;
  if (B !== 0) s += B > 0 ? ` + ${B === 1 ? "" : B}x` : ` - ${-B === 1 ? "" : -B}x`;
  if (C !== 0) s += C > 0 ? ` + ${C}` : ` - ${-C}`;
  return s;
};

// Vertex form a(x - h)^2 + k as a plain-text answer string.
const vertexStr = (a, h, k) => {
  const lead = a === 1 ? "" : a === -1 ? "-" : `${a}`;
  let s = `${lead}${xShift(h)}^2`;
  if (k !== 0) s += ` ${addConst(k)}`;
  return s;
};

// Nonzero random int in [-m, m].
const nzInt = (rng, m) => {
  let v;
  do { v = rng.int(-m, m); } while (v === 0);
  return v;
};

// ===========================================================================
export const fill = {};

// ===========================================================================
// algebra.absolute-value
// Concepts: absolute-value-meaning, absolute-value-equations,
//           less-than-inequalities, greater-than-inequalities
// ===========================================================================

// --- absolute-value-meaning ---

// d1: evaluate |negative| and |positive| as distances from 0.
fill["aab-meaning-1"] = (rng, idx) => {
  const a = -rng.int(2, 12);
  const b = rng.int(2, 12);
  return {
    id: `gen.aab-meaning-1.${idx}`, generated: true, concepts: ["absolute-value-meaning"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $|${a}|$ and $|${b}|$, thinking of each as a distance from 0.`,
    steps: [
      { instruction: `How far is $${a}$ from 0? That is, $|${a}| = $ ?`, answer: `${-a}`, accept: [], hint: `Distance is never negative; $${a}$ sits ${-a} units left of 0.` },
      { instruction: `And $|${b}| = $ ?`, answer: `${b}`, accept: [], hint: `$${b}$ is already ${b} units from 0.` },
    ],
    finalAnswer: { value: `${-a} and ${b}`, unit: "" },
    solutionNarrative: `Both are distances from 0: $|${a}| = ${-a}$ and $|${b}| = ${b}$.`,
  };
};

// d2: distance between two numbers via |a - b|.
fill["aab-meaning-2"] = (rng, idx) => {
  const a = -rng.int(1, 9); // negative reading
  const b = rng.int(1, 9);  // positive reading
  const diff = b - a;
  const ctx = rng.pick([
    { story: `A thermometer read $${a}°$ at dawn and $${b}°$ at noon. The temperature swing is the distance between the readings`, unit: "degrees" },
    { story: `A submarine drone sat at depth $${a}$ m (below sea level) and rose to $${b}$ m (above, on its lift line). The total climb is the distance between the two positions`, unit: "m" },
    { story: `An account balance moved from $${a}$ dollars (overdrawn) to $${b}$ dollars. The size of the change is the distance between the balances`, unit: "dollars" },
  ]);
  return {
    id: `gen.aab-meaning-2.${idx}`, generated: true, concepts: ["absolute-value-meaning"], difficulty: 2, context: "applied",
    prompt: `${ctx.story}, $|${b} - (${a})|$. Compute it.`,
    steps: [
      { instruction: `First simplify the inside: $${b} - (${a}) = $ ?`, answer: `${diff}`, accept: [], hint: `Subtracting a negative adds: $${b} + ${-a}$.` },
      { instruction: `So the distance is $|${diff}| = $ ?`, answer: `${diff}`, accept: [], hint: `${diff} is already positive.` },
    ],
    finalAnswer: { value: `${diff}`, unit: ctx.unit },
    solutionNarrative: `$|${b} - (${a})| = |${diff}| = ${diff}$ — the gap between the two values on the number line.`,
  };
};

// d3: which x sit at distance c from m — |x - m| = c read as distance.
fill["aab-meaning-3"] = (rng, idx) => {
  const c = rng.int(2, 9);
  const m = nzInt(rng, 6);
  const hi = m + c, lo = m - c;
  const inside = m >= 0 ? `x - ${m}` : `x + ${-m}`;
  return {
    id: `gen.aab-meaning-3.${idx}`, generated: true, concepts: ["absolute-value-meaning"], difficulty: 3, context: "abstract",
    prompt: `The equation $|${inside}| = ${c}$ says '$x$ sits at distance ${c} from ${m}'. Use the distance reading to find both solutions.`,
    steps: [
      { instruction: `One solution lies ${c} units RIGHT of ${m}. What is it?`, answer: `${hi}`, accept: [`x = ${hi}`], hint: `$${m} + ${c}$.` },
      { instruction: `The other lies ${c} units LEFT of ${m}. What is it?`, answer: `${lo}`, accept: [`x = ${lo}`], hint: `$${m} - ${c}$.` },
      { instruction: `State the full solution. (Type it like x = ${hi} or x = ${lo}.)`, answer: `x = ${hi} or x = ${lo}`, accept: [`x = ${lo} or x = ${hi}`], form: "solutions", hint: `Distance-${c} points from ${m} come in a pair.` },
    ],
    finalAnswer: { value: `x = ${hi} or x = ${lo}`, unit: "" },
    solutionNarrative: `Exactly two points sit ${c} from ${m}: $${m} + ${c} = ${hi}$ and $${m} - ${c} = ${lo}$.`,
  };
};

// --- absolute-value-equations ---

// d1: |x + b| = c, two clean cases.
fill["aab-equation-1"] = (rng, idx) => {
  const b = nzInt(rng, 8);
  const c = rng.int(2, 9);
  const s1 = c - b, s2 = -c - b;
  const inside = linExpr(1, b);
  return {
    id: `gen.aab-equation-1.${idx}`, generated: true, concepts: ["absolute-value-equations"], difficulty: 1, context: "abstract",
    prompt: `Solve $|${inside}| = ${c}$ by splitting into two cases.`,
    steps: [
      { instruction: `Case 1: $${inside} = ${c}$. Solve it.`, answer: `x = ${s1}`, accept: [`${s1}`], hint: `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides.` },
      { instruction: `Case 2: $${inside} = ${-c}$. Solve it.`, answer: `x = ${s2}`, accept: [`${s2}`], hint: `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides.` },
      { instruction: `State the full solution. (Type it like x = ${s1} or x = ${s2}.)`, answer: `x = ${s1} or x = ${s2}`, accept: [`x = ${s2} or x = ${s1}`], form: "solutions", hint: `Both cases are genuine solutions here.` },
    ],
    finalAnswer: { value: `x = ${s1} or x = ${s2}`, unit: "" },
    solutionNarrative: `The inside is $${c}$ or $${-c}$: the cases give $x = ${s1}$ and $x = ${s2}$.`,
  };
};

// d2: |ax + b| = c with integer solutions (constructed backwards from the roots).
fill["aab-equation-2"] = (rng, idx) => {
  let a, x1, x2;
  do {
    a = rng.int(2, 4);
    x1 = rng.int(-4, 4);
    x2 = rng.int(-4, 4);
  } while (x1 <= x2 || (x1 + x2) % 2 !== 0); // distinct, ordered, even sum keeps b an integer
  const b = -a * (x1 + x2) / 2;
  const c = a * (x1 - x2) / 2; // > 0 by construction
  const inside = linExpr(a, b);
  return {
    id: `gen.aab-equation-2.${idx}`, generated: true, concepts: ["absolute-value-equations"], difficulty: 2, context: "abstract",
    prompt: `Solve $|${inside}| = ${c}$.`,
    steps: [
      { instruction: `Case 1: $${inside} = ${c}$. Solve for $x$.`, answer: `x = ${x1}`, accept: [`${x1}`], hint: `$${a}x = ${c - b}$.` },
      { instruction: `Case 2: $${inside} = ${-c}$. Solve for $x$.`, answer: `x = ${x2}`, accept: [`${x2}`], hint: `$${a}x = ${-c - b}$.` },
      { instruction: `State the full solution. (Type it like x = ${x1} or x = ${x2}.)`, answer: `x = ${x1} or x = ${x2}`, accept: [`x = ${x2} or x = ${x1}`], form: "solutions", hint: `Combine both cases with 'or'.` },
    ],
    finalAnswer: { value: `x = ${x1} or x = ${x2}`, unit: "" },
    solutionNarrative: `$${inside} = ${c}$ gives $x = ${x1}$; $${inside} = ${-c}$ gives $x = ${x2}$.`,
  };
};

// d3: either a no-solution trap (c < 0) or a tougher two-case equation.
fill["aab-equation-3"] = (rng, idx) => {
  if (rng.float() < 0.4) {
    const a = rng.int(2, 6);
    const b = nzInt(rng, 9);
    const c = rng.int(2, 9);
    const inside = linExpr(a, b);
    return {
      id: `gen.aab-equation-3.${idx}`, generated: true, concepts: ["absolute-value-equations"], difficulty: 3, context: "abstract",
      prompt: `Solve $|${inside}| = ${-c}$, or explain why you cannot.`,
      steps: [
        { instruction: `What is the SMALLEST value $|${inside}|$ can ever take?`, answer: `0`, accept: [], hint: `An absolute value is a distance.` },
        { instruction: `A distance can never be negative, so the equation has... Answer with exactly: no solution`, answer: `no solution`, accept: ["none", "no solutions", "empty set"], hint: `Do not split into cases when the right side is negative.` },
      ],
      finalAnswer: { value: "no solution", unit: "" },
      solutionNarrative: `$|${inside}| \\geq 0$ for every $x$, so it can never equal $${-c}$: no solution.`,
    };
  }
  let a, x1, x2;
  do {
    a = rng.int(3, 6);
    x1 = rng.int(-6, 6);
    x2 = rng.int(-6, 6);
  } while (x1 <= x2 || (x1 + x2) % 2 !== 0);
  const b = -a * (x1 + x2) / 2;
  const c = a * (x1 - x2) / 2;
  const inside = linExpr(a, b);
  return {
    id: `gen.aab-equation-3.${idx}`, generated: true, concepts: ["absolute-value-equations"], difficulty: 3, context: "abstract",
    prompt: `Solve $|${inside}| = ${c}$, keeping the two cases straight.`,
    steps: [
      { instruction: `Case 1: $${inside} = ${c}$. First isolate the $x$-term: $${a}x = $ ?`, answer: `${c - b}`, accept: [`${a}x = ${c - b}`], hint: `${b > 0 ? `Subtract ${b}` : `Add ${-b}`} on both sides.` },
      { instruction: `Divide by ${a}: $x = $ ?`, answer: `${x1}`, accept: [`x = ${x1}`], hint: `$${c - b} \\div ${a}$.` },
      { instruction: `Case 2: $${inside} = ${-c}$. Solve it fully: $x = $ ?`, answer: `${x2}`, accept: [`x = ${x2}`], hint: `$${a}x = ${-c - b}$, then divide by ${a}.` },
      { instruction: `State the full solution. (Type it like x = ${x1} or x = ${x2}.)`, answer: `x = ${x1} or x = ${x2}`, accept: [`x = ${x2} or x = ${x1}`], form: "solutions", hint: `Two cases, two solutions.` },
    ],
    finalAnswer: { value: `x = ${x1} or x = ${x2}`, unit: "" },
    solutionNarrative: `Case 1: $${a}x = ${c - b}$ so $x = ${x1}$. Case 2: $${a}x = ${-c - b}$ so $x = ${x2}$.`,
  };
};

// --- less-than-inequalities ---

// d1: |x| < c — a single band.
fill["aab-less-1"] = (rng, idx) => {
  const c = rng.int(2, 12);
  return {
    id: `gen.aab-less-1.${idx}`, generated: true, concepts: ["less-than-inequalities"], difficulty: 1, context: "abstract",
    prompt: `Solve $|x| < ${c}$ and write the answer as a compound inequality.`,
    steps: [
      { instruction: `'Within ${c} of 0' means fenced on the left at what value?`, answer: `${-c}`, accept: [], hint: `The negative fence.` },
      { instruction: `Write the compound inequality. (Type it like ${-c} < x < ${c}.)`, answer: `${-c} < x < ${c}`, accept: [`${c} > x > ${-c}`], hint: `Less-than gives a single band: $-c < x < c$.` },
    ],
    finalAnswer: { value: `${-c} < x < ${c}`, unit: "" },
    solutionNarrative: `$|x| < ${c}$ traps $x$ between the fences: $${-c} < x < ${c}$.`,
  };
};

// d2: |x + b| <= c — shift the band.
fill["aab-less-2"] = (rng, idx) => {
  const b = nzInt(rng, 7);
  const c = rng.int(2, 9);
  const lo = -c - b, hi = c - b;
  const inside = linExpr(1, b);
  return {
    id: `gen.aab-less-2.${idx}`, generated: true, concepts: ["less-than-inequalities"], difficulty: 2, context: "abstract",
    prompt: `Solve $|${inside}| \\leq ${c}$.`,
    steps: [
      { instruction: `Rewrite as a band: $${-c} \\leq ${inside} \\leq ${c}$. ${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} all three parts. What is the LOWER endpoint?`, answer: `${lo}`, accept: [], hint: `$${-c} ${addConst(-b)}$.` },
      { instruction: `What is the UPPER endpoint?`, answer: `${hi}`, accept: [], hint: `$${c} ${addConst(-b)}$.` },
      { instruction: `Write the solution. (Type it like ${lo} <= x <= ${hi}.)`, answer: `${lo} <= x <= ${hi}`, accept: [`${lo} \\leq x \\leq ${hi}`, `${hi} >= x >= ${lo}`], hint: `Endpoints included because of $\\leq$.` },
    ],
    finalAnswer: { value: `${lo} <= x <= ${hi}`, unit: "" },
    solutionNarrative: `$${-c} \\leq ${inside} \\leq ${c}$ shifts to $${lo} \\leq x \\leq ${hi}$.`,
  };
};

// d3: |ax + b| < c with integer endpoints (constructed backwards).
fill["aab-less-3"] = (rng, idx) => {
  let a, x1, x2;
  do {
    a = rng.int(2, 4);
    x1 = rng.int(-5, 5);
    x2 = rng.int(-5, 5);
  } while (x1 <= x2 || (x1 + x2) % 2 !== 0);
  const b = -a * (x1 + x2) / 2;
  const c = a * (x1 - x2) / 2;
  const lo2 = -c - b, hi2 = c - b; // band for ax
  const inside = linExpr(a, b);
  return {
    id: `gen.aab-less-3.${idx}`, generated: true, concepts: ["less-than-inequalities"], difficulty: 3, context: "abstract",
    prompt: `Solve $|${inside}| < ${c}$.`,
    plot: { xRange: [x2 - 3, x1 + 3], yRange: [-1, c + 4], curves: [ { fn: `abs(${a}*x ${b >= 0 ? `+ ${b}` : `- ${-b}`})`, label: `y = |${inside}|`, labelAt: x1 + 1.6, color: "accent" }, { fn: `${c}`, label: `y = ${c}`, labelAt: x2 - 2.2, color: "warn" } ], caption: `The V dips below y = ${c} exactly on the solution band.` },
    steps: [
      { instruction: `Rewrite as a band and ${b > 0 ? `subtract ${b} from` : b < 0 ? `add ${-b} to` : "keep"} all three parts. What compound inequality results? (Type it like ${lo2} < ${a}x < ${hi2}.)`, answer: `${lo2} < ${a}x < ${hi2}`, accept: [`${hi2} > ${a}x > ${lo2}`], hint: `Start from $${-c} < ${inside} < ${c}$.` },
      { instruction: `Divide all three parts by ${a}. What is the LOWER endpoint of the solution?`, answer: `${x2}`, accept: [], hint: `$${lo2} \\div ${a}$.` },
      { instruction: `And the UPPER endpoint?`, answer: `${x1}`, accept: [], hint: `$${hi2} \\div ${a}$.` },
      { instruction: `Write the solution. (Type it like ${x2} < x < ${x1}.)`, answer: `${x2} < x < ${x1}`, accept: [`${x1} > x > ${x2}`], hint: `Strict inequality keeps the endpoints out.` },
    ],
    finalAnswer: { value: `${x2} < x < ${x1}`, unit: "" },
    solutionNarrative: `$${-c} < ${inside} < ${c}$ gives $${lo2} < ${a}x < ${hi2}$, then $${x2} < x < ${x1}$.`,
  };
};

// --- greater-than-inequalities ---

// d1: |x| > c — two rays.
fill["aab-greater-1"] = (rng, idx) => {
  const c = rng.int(2, 12);
  return {
    id: `gen.aab-greater-1.${idx}`, generated: true, concepts: ["greater-than-inequalities"], difficulty: 1, context: "abstract",
    prompt: `Solve $|x| > ${c}$ and write the answer as an 'or' statement.`,
    steps: [
      { instruction: `Farther than ${c} from 0 means beyond a fence on either side. Write the solution. (Type it like x < ${-c} or x > ${c}.)`, answer: `x < ${-c} or x > ${c}`, accept: [`x > ${c} or x < ${-c}`], hint: `Greater-than gives TWO pieces, never a band.` },
    ],
    finalAnswer: { value: `x < ${-c} or x > ${c}`, unit: "" },
    solutionNarrative: `$|x| > ${c}$ means $x$ is farther than ${c} from 0: $x < ${-c}$ or $x > ${c}$.`,
  };
};

// d2: |x + b| >= c — shifted rays.
fill["aab-greater-2"] = (rng, idx) => {
  const b = nzInt(rng, 7);
  const c = rng.int(2, 9);
  const hi = c - b, lo = -c - b;
  const inside = linExpr(1, b);
  return {
    id: `gen.aab-greater-2.${idx}`, generated: true, concepts: ["greater-than-inequalities"], difficulty: 2, context: "abstract",
    prompt: `Solve $|${inside}| \\geq ${c}$.`,
    steps: [
      { instruction: `Case 1: $${inside} \\geq ${c}$. Solve it.`, answer: `x >= ${hi}`, accept: [`x \\geq ${hi}`, `${hi} <= x`], hint: `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides.` },
      { instruction: `Case 2: $${inside} \\leq ${-c}$. Solve it.`, answer: `x <= ${lo}`, accept: [`x \\leq ${lo}`, `${lo} >= x`], hint: `${b > 0 ? `Subtract ${b} from` : `Add ${-b} to`} both sides.` },
      { instruction: `Combine with 'or'. (Type it like x <= ${lo} or x >= ${hi}.)`, answer: `x <= ${lo} or x >= ${hi}`, accept: [`x >= ${hi} or x <= ${lo}`], hint: `Two rays with a gap from ${lo} to ${hi}.` },
    ],
    finalAnswer: { value: `x <= ${lo} or x >= ${hi}`, unit: "" },
    solutionNarrative: `$${inside} \\geq ${c}$ gives $x \\geq ${hi}$; $${inside} \\leq ${-c}$ gives $x \\leq ${lo}$.`,
  };
};

// d3: |ax + b| > c with integer boundaries (constructed backwards).
fill["aab-greater-3"] = (rng, idx) => {
  let a, x1, x2;
  do {
    a = rng.int(2, 4);
    x1 = rng.int(-5, 5);
    x2 = rng.int(-5, 5);
  } while (x1 <= x2 || (x1 + x2) % 2 !== 0);
  const b = -a * (x1 + x2) / 2;
  const c = a * (x1 - x2) / 2;
  const inside = linExpr(a, b);
  return {
    id: `gen.aab-greater-3.${idx}`, generated: true, concepts: ["greater-than-inequalities"], difficulty: 3, context: "abstract",
    prompt: `Solve $|${inside}| > ${c}$.`,
    steps: [
      { instruction: `Case 1: $${inside} > ${c}$. Solve for $x$.`, answer: `x > ${x1}`, accept: [`${x1} < x`], hint: `$${a}x > ${c - b}$, divide by ${a}.` },
      { instruction: `Case 2: $${inside} < ${-c}$. Solve for $x$.`, answer: `x < ${x2}`, accept: [`${x2} > x`], hint: `$${a}x < ${-c - b}$, divide by ${a}.` },
      { instruction: `Combine with 'or'. (Type it like x < ${x2} or x > ${x1}.)`, answer: `x < ${x2} or x > ${x1}`, accept: [`x > ${x1} or x < ${x2}`], hint: `Two pieces outside the fences.` },
    ],
    finalAnswer: { value: `x < ${x2} or x > ${x1}`, unit: "" },
    solutionNarrative: `$${inside} > ${c}$ gives $x > ${x1}$; $${inside} < ${-c}$ gives $x < ${x2}$.`,
  };
};

// ===========================================================================
// algebra-2.function-transformations
// Concepts: shifts, reflections, stretches, combining-transformations
// ===========================================================================

// --- shifts ---

// d1: single shift, direction word + image point.
fill["a2v-shift-1"] = (rng, idx) => {
  const k = rng.int(1, 9);
  const p = rng.int(-5, 5), q = rng.int(-5, 5);
  const kind = rng.pick(["up", "down", "left", "right"]);
  const defs = {
    up:    { g: `f(x) + ${k}`, where: "OUTSIDE the function, so it acts on y", img: [p, q + k], why: "Outside changes behave exactly as written." },
    down:  { g: `f(x) - ${k}`, where: "OUTSIDE the function, so it acts on y", img: [p, q - k], why: "Outside changes behave exactly as written." },
    right: { g: `f(x - ${k})`, where: "INSIDE the function, so it acts on x — backwards", img: [p + k, q], why: "Inside changes do the opposite of their sign: minus moves right." },
    left:  { g: `f(x + ${k})`, where: "INSIDE the function, so it acts on x — backwards", img: [p - k, q], why: "Inside changes do the opposite of their sign: plus moves left." },
  };
  const d = defs[kind];
  const [ix, iy] = d.img;
  return {
    id: `gen.a2v-shift-1.${idx}`, generated: true, concepts: ["shifts"], difficulty: 1, context: "abstract",
    prompt: `Let $g(x) = ${d.g}$, and suppose $(${p}, ${q})$ is on the graph of $f$. Which direction does the graph shift, and where does the point land?`,
    steps: [
      { instruction: `The ${k} sits ${d.where}. Which way does the graph move? Answer with one of: up, down, left, right.`, answer: kind, accept: [`shifted ${kind}`], hint: d.why },
      { instruction: `Where does $(${p}, ${q})$ land? Write the image in the form <x, y> (e.g. <3, -2>).`, answer: `<${ix}, ${iy}>`, accept: [`(${ix}, ${iy})`, `${ix}, ${iy}`], hint: `Shift ${kind} by ${k} moves ${kind === "up" || kind === "down" ? "the y-coordinate" : "the x-coordinate"}.` },
    ],
    finalAnswer: { value: `<${ix}, ${iy}>`, unit: "" },
    solutionNarrative: `$${d.g}$ shifts the graph ${kind} ${k}, carrying $(${p}, ${q})$ to $(${ix}, ${iy})$.`,
  };
};

// d2: write the shifted parabola formula + vertex.
fill["a2v-shift-2"] = (rng, idx) => {
  const h = nzInt(rng, 5);
  const k = nzInt(rng, 6);
  const hWord = h > 0 ? "RIGHT" : "LEFT", kWord = k > 0 ? "UP" : "DOWN";
  const formula = vertexStr(1, h, k);
  const expanded = quadStr(1, -2 * h, h * h + k);
  return {
    id: `gen.a2v-shift-2.${idx}`, generated: true, concepts: ["shifts"], difficulty: 2, context: "abstract",
    prompt: `Write the formula for $y = x^2$ shifted ${hWord} ${Math.abs(h)} and ${kWord} ${Math.abs(k)}, and give the new vertex.`,
    steps: [
      { instruction: `Where does the vertex $(0, 0)$ land? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${h}, ${k}>`, accept: [`(${h}, ${k})`, `${h}, ${k}`], hint: `${hWord.toLowerCase()} ${Math.abs(h)} moves x; ${kWord.toLowerCase()} ${Math.abs(k)} moves y.` },
      { instruction: `Write the transformed formula. (Type it like ${vertexStr(1, 3, 2)}.)`, answer: formula, accept: [expanded], hint: `${hWord} ${Math.abs(h)} means $${h > 0 ? "-" : "+"} ${Math.abs(h)}$ INSIDE; ${kWord} ${Math.abs(k)} means $${k > 0 ? "+" : "-"} ${Math.abs(k)}$ OUTSIDE.` },
    ],
    finalAnswer: { value: formula, unit: "" },
    solutionNarrative: `The shift puts $${h > 0 ? `-${h}` : `+${-h}`}$ inside and $${k > 0 ? `+${k}` : `${k}`}$ outside: $g(x) = ${formula}$, vertex $(${h}, ${k})$.`,
  };
};

// d3: double shift on a general point.
fill["a2v-shift-3"] = (rng, idx) => {
  const h = nzInt(rng, 6), k = nzInt(rng, 6);
  let p, q;
  do { p = rng.int(-5, 5); q = rng.int(-5, 5); } while (p + h === p || q + k === q); // always true, kept for symmetry
  const ix = p + h, iy = q + k;
  return {
    id: `gen.a2v-shift-3.${idx}`, generated: true, concepts: ["shifts"], difficulty: 3, context: "abstract",
    prompt: `Let $g(x) = f(${xShift(h).slice(1, -1)}) ${addConst(k)}$, and suppose $(${p}, ${q})$ is on the graph of $f$. Track the point through both shifts.`,
    steps: [
      { instruction: `Inside first: the graph shifts ${h > 0 ? "right" : "left"} ${Math.abs(h)}. What is the new x-coordinate?`, answer: `${ix}`, accept: [], hint: `$${p} ${addConst(h)}$.` },
      { instruction: `Outside next: the graph shifts ${k > 0 ? "up" : "down"} ${Math.abs(k)}. What is the new y-coordinate?`, answer: `${iy}`, accept: [], hint: `$${q} ${addConst(k)}$.` },
      { instruction: `Write the image in the form <x, y> (e.g. <3, -2>).`, answer: `<${ix}, ${iy}>`, accept: [`(${ix}, ${iy})`, `${ix}, ${iy}`], hint: `Combine the two coordinates.` },
    ],
    finalAnswer: { value: `<${ix}, ${iy}>`, unit: "" },
    solutionNarrative: `$(p, q) \\to (p ${addConst(h)}, q ${addConst(k)})$: $(${p}, ${q}) \\to (${ix}, ${iy})$.`,
  };
};

// --- reflections ---

// d1: which axis + image point.
fill["a2v-reflect-1"] = (rng, idx) => {
  const p = nzInt(rng, 6), q = nzInt(rng, 7);
  const outside = rng.float() < 0.5;
  const axis = outside ? "x-axis" : "y-axis";
  const ix = outside ? p : -p, iy = outside ? -q : q;
  return {
    id: `gen.a2v-reflect-1.${idx}`, generated: true, concepts: ["reflections"], difficulty: 1, context: "abstract",
    prompt: `Let $g(x) = ${outside ? "-f(x)" : "f(-x)"}$, and suppose $(${p}, ${q})$ is on the graph of $f$. Which axis does the graph flip over, and where does the point land?`,
    steps: [
      { instruction: `The minus sign is ${outside ? "OUTSIDE, acting on the output" : "INSIDE, acting on the input"}. Which axis is the mirror? Answer with one of: x-axis, y-axis.`, answer: axis, accept: [axis.replace("-", " "), `the ${axis}`], hint: outside ? `Outside minus negates y — that flips over the x-axis.` : `Inside minus negates x — a left-right mirror.` },
      { instruction: `Where does $(${p}, ${q})$ land? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${ix}, ${iy}>`, accept: [`(${ix}, ${iy})`, `${ix}, ${iy}`], hint: outside ? `Keep x; negate y.` : `Negate x; keep y.` },
    ],
    finalAnswer: { value: `<${ix}, ${iy}>`, unit: "" },
    solutionNarrative: `$${outside ? "-f(x)" : "f(-x)"}$ reflects over the ${axis}: $(${p}, ${q}) \\to (${ix}, ${iy})$.`,
  };
};

// d2: numeric value after an x-axis reflection, then the image point.
fill["a2v-reflect-2"] = (rng, idx) => {
  const p = rng.int(-6, 6);
  const q = nzInt(rng, 9);
  return {
    id: `gen.a2v-reflect-2.${idx}`, generated: true, concepts: ["reflections"], difficulty: 2, context: "abstract",
    prompt: `Let $g(x) = -f(x)$, and suppose $f(${p}) = ${q}$. Evaluate $g(${p})$ and give the reflected point.`,
    steps: [
      { instruction: `$g(${p}) = -f(${p}) = $ ?`, answer: `${-q}`, accept: [], hint: `Negate the output ${q}.` },
      { instruction: `So the point $(${p}, ${q})$ on $f$ becomes which point on $g$? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${p}, ${-q}>`, accept: [`(${p}, ${-q})`, `${p}, ${-q}`], hint: `x-axis reflection: keep x, negate y.` },
    ],
    finalAnswer: { value: `<${p}, ${-q}>`, unit: "" },
    solutionNarrative: `$g(${p}) = -${q < 0 ? `(${q})` : q} = ${-q}$: the point flips to $(${p}, ${-q})$.`,
  };
};

// d3: reflect a quadratic formula over the y-axis by substituting -x.
fill["a2v-reflect-3"] = (rng, idx) => {
  const c = nzInt(rng, 7);
  const fStr = quadStr(1, c, 0);
  const gStr = quadStr(1, -c, 0);
  return {
    id: `gen.a2v-reflect-3.${idx}`, generated: true, concepts: ["reflections"], difficulty: 3, context: "abstract",
    prompt: `Reflect $f(x) = ${fStr}$ over the y-axis by computing $g(x) = f(-x)$, and simplify.`,
    steps: [
      { instruction: `Substitute: $(-x)^2 ${c >= 0 ? `+ ${c === 1 ? "" : c}` : `- ${-c === 1 ? "" : -c}`}(-x)$. What is the coefficient of $x$ after simplifying?`, answer: `${-c}`, accept: [], hint: `$(-x)^2 = x^2$ keeps its sign; the odd-power term flips.` },
      { instruction: `Write the simplified formula for $g(x)$. (Type it like ${quadStr(1, -2, 0)}.)`, answer: gStr, accept: [], hint: `Even power unchanged, odd power negated.` },
    ],
    finalAnswer: { value: gStr, unit: "" },
    solutionNarrative: `$f(-x) = (-x)^2 ${c >= 0 ? "+" : "-"} ${Math.abs(c)}(-x) = ${gStr}$: the even term survives, the odd term flips sign.`,
  };
};

// --- stretches ---

// d1: vertical stretch factor + image point.
fill["a2v-stretch-1"] = (rng, idx) => {
  const a = rng.int(2, 5);
  const p = rng.int(-5, 5);
  const q = nzInt(rng, 6);
  return {
    id: `gen.a2v-stretch-1.${idx}`, generated: true, concepts: ["stretches"], difficulty: 1, context: "abstract",
    prompt: `Let $g(x) = ${a}f(x)$, and suppose $(${p}, ${q})$ is on the graph of $f$. Describe the transformation and track the point.`,
    steps: [
      { instruction: `The factor ${a} multiplies the OUTPUT. What is the vertical stretch factor?`, answer: `${a}`, accept: [], hint: `Outside multiplication scales y directly.` },
      { instruction: `Where does $(${p}, ${q})$ land? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${p}, ${a * q}>`, accept: [`(${p}, ${a * q})`, `${p}, ${a * q}`], hint: `Keep x; multiply y by ${a}.` },
    ],
    finalAnswer: { value: `<${p}, ${a * q}>`, unit: "" },
    solutionNarrative: `$${a}f(x)$ stretches vertically by ${a}: $(${p}, ${q}) \\to (${p}, ${a * q})$.`,
  };
};

// d2: horizontal scaling f(bx) or f(x/b) — classify + image point.
fill["a2v-stretch-2"] = (rng, idx) => {
  const b = rng.int(2, 4);
  const compress = rng.float() < 0.5;
  const q = nzInt(rng, 7);
  let ix, oldX, gStr, word, hint;
  if (compress) {
    ix = nzInt(rng, 4);          // image x
    oldX = b * ix;               // point on f
    gStr = `f(${b}x)`;
    word = "compression";
    hint = `Inside factor greater than 1 squeezes toward the y-axis.`;
  } else {
    oldX = nzInt(rng, 4);        // point on f
    ix = b * oldX;               // image x
    gStr = `f(x/${b})`;
    word = "stretch";
    hint = `Inside factor LESS than 1 widens the graph.`;
  }
  return {
    id: `gen.a2v-stretch-2.${idx}`, generated: true, concepts: ["stretches"], difficulty: 2, context: "abstract",
    prompt: `Let $g(x) = ${gStr}$, and suppose $(${oldX}, ${q})$ is on the graph of $f$. Is this a horizontal stretch or compression, and where does the point land?`,
    steps: [
      { instruction: `The inside factor acts on x with the RECIPROCAL. Is the graph horizontally stretched or compressed? Answer with one of: stretch, compression.`, answer: word, accept: word === "stretch" ? ["stretched"] : ["compressed", "compress"], hint },
      { instruction: `Where does $(${oldX}, ${q})$ land? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${ix}, ${q}>`, accept: [`(${ix}, ${q})`, `${ix}, ${q}`], hint: compress ? `x is divided by ${b}; y is untouched.` : `x is multiplied by ${b}; y is untouched.` },
    ],
    finalAnswer: { value: `<${ix}, ${q}>`, unit: "" },
    solutionNarrative: `$${gStr}$ ${compress ? `compresses horizontally by $\\tfrac{1}{${b}}$` : `stretches horizontally by ${b}`}: $(${oldX}, ${q}) \\to (${ix}, ${q})$.`,
  };
};

// d3: vertical stretch of a full quadratic formula.
fill["a2v-stretch-3"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const m = nzInt(rng, 4);
  const c = nzInt(rng, 5);
  const fStr = quadStr(1, m, c);
  const gStr = quadStr(a, a * m, a * c);
  return {
    id: `gen.a2v-stretch-3.${idx}`, generated: true, concepts: ["stretches"], difficulty: 3, context: "abstract",
    prompt: `Stretch $f(x) = ${fStr}$ vertically by a factor of ${a}. Write the resulting formula.`,
    steps: [
      { instruction: `The stretch multiplies EVERY term of the output. What does the constant term ${c >= 0 ? c : `$${c}$`} become?`, answer: `${a * c}`, accept: [], hint: `$${a} \\cdot ${c < 0 ? `(${c})` : c}$.` },
      { instruction: `Write the stretched formula expanded. (Type it like ${quadStr(4, -8, 4)}.)`, answer: gStr, accept: [`${a}(${fStr})`], hint: `Multiply each of the three terms by ${a}.` },
    ],
    finalAnswer: { value: gStr, unit: "" },
    solutionNarrative: `A vertical stretch by ${a} multiplies the entire output: $${a}(${fStr}) = ${gStr}$.`,
  };
};

// --- combining-transformations ---

// d1: a f(x) + k on a point — order of operations on y.
fill["a2v-combine-1"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const k = nzInt(rng, 5);
  const p = rng.int(-5, 5);
  const q = nzInt(rng, 5);
  const iy = a * q + k;
  return {
    id: `gen.a2v-combine-1.${idx}`, generated: true, concepts: ["combining-transformations"], difficulty: 1, context: "abstract",
    prompt: `Let $g(x) = ${a}f(x) ${addConst(k)}$, and suppose $(${p}, ${q})$ is on the graph of $f$. Where does the point land? (Stretch first, then shift.)`,
    steps: [
      { instruction: `Apply the operations to $y = ${q}$ in order: multiply by ${a}, THEN ${k > 0 ? `add ${k}` : `subtract ${-k}`}. What is the new y-value?`, answer: `${iy}`, accept: [], hint: `$${a} \\cdot ${q < 0 ? `(${q})` : q} ${addConst(k)}$ — multiplication before addition.` },
      { instruction: `Write the image in the form <x, y> (e.g. <3, -2>).`, answer: `<${p}, ${iy}>`, accept: [`(${p}, ${iy})`, `${p}, ${iy}`], hint: `Nothing touched the input, so x stays ${p}.` },
    ],
    finalAnswer: { value: `<${p}, ${iy}>`, unit: "" },
    solutionNarrative: `Outside operations follow order of operations: $y = ${a}(${q}) ${addConst(k)} = ${iy}$, so $(${p}, ${q}) \\to (${p}, ${iy})$.`,
  };
};

// d2: reflect + shift: -f(x - h) on a point.
fill["a2v-combine-2"] = (rng, idx) => {
  const h = nzInt(rng, 5);
  const p = rng.int(-4, 4);
  const q = nzInt(rng, 7);
  const ix = p + h, iy = -q;
  return {
    id: `gen.a2v-combine-2.${idx}`, generated: true, concepts: ["combining-transformations"], difficulty: 2, context: "abstract",
    prompt: `Let $g(x) = -f(${xShift(h).slice(1, -1)})$, and suppose $(${p}, ${q})$ is on the graph of $f$. Where does the point land?`,
    steps: [
      { instruction: `Inside first: the graph shifts ${h > 0 ? "right" : "left"} ${Math.abs(h)}. What is the new x-coordinate?`, answer: `${ix}`, accept: [], hint: `$${p} ${addConst(h)}$.` },
      { instruction: `Outside next: the minus reflects over the x-axis. What is the new y-coordinate?`, answer: `${iy}`, accept: [], hint: `Negate the output ${q}.` },
      { instruction: `Write the image in the form <x, y> (e.g. <3, -2>).`, answer: `<${ix}, ${iy}>`, accept: [`(${ix}, ${iy})`, `${ix}, ${iy}`], hint: `Combine the two coordinates.` },
    ],
    finalAnswer: { value: `<${ix}, ${iy}>`, unit: "" },
    solutionNarrative: `Shift ${h > 0 ? "right" : "left"} ${Math.abs(h)} then flip over the x-axis: $(${p}, ${q}) \\to (${ix}, ${q}) \\to (${ix}, ${iy})$.`,
  };
};

// d3: full template on y = x^2: vertex + vertex-form formula.
fill["a2v-combine-3"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const h = nzInt(rng, 4);
  const k = nzInt(rng, 6);
  const formula = vertexStr(a, h, k);
  const expanded = quadStr(a, -2 * a * h, a * h * h + k);
  const hWord = h > 0 ? "RIGHT" : "LEFT", kWord = k > 0 ? "UP" : "DOWN";
  return {
    id: `gen.a2v-combine-3.${idx}`, generated: true, concepts: ["combining-transformations"], difficulty: 3, context: "abstract",
    prompt: `Transform $y = x^2$: shift ${hWord} ${Math.abs(h)}, stretch vertically by ${a}, then shift ${kWord} ${Math.abs(k)}. Give the new vertex and the formula.`,
    steps: [
      { instruction: `The vertex starts at $(0,0)$. Where does it end up? Write it in the form <x, y> (e.g. <3, -2>).`, answer: `<${h}, ${k}>`, accept: [`(${h}, ${k})`, `${h}, ${k}`], hint: `The stretch does not move the vertex: $(0 ${addConst(h)}, ${a} \\cdot 0 ${addConst(k)})$.` },
      { instruction: `Write the transformed formula in vertex form. (Type it like ${vertexStr(2, 1, 3)}.)`, answer: formula, accept: [expanded], hint: `$a = ${a}$, $h = ${h}$, $k = ${k}$ in $a(x-h)^2 + k$.` },
    ],
    finalAnswer: { value: formula, unit: "" },
    solutionNarrative: `Filling the template $a(x-h)^2+k$ with $a=${a}, h=${h}, k=${k}$ gives $${formula}$; the vertex rides to $(${h}, ${k})$.`,
  };
};
