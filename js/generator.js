// generator.js
// Parametric problem generators. Each is keyed by a `template` id referenced
// from a topic's content file. Generators produce fully-populated problem
// objects (same shape as authored "seed" problems) with randomized numbers and
// applied contexts, so the adaptive engine can serve effectively unlimited
// "similar" problems. Answers are always controlled to stay clean and checkable.

// Full-tier coverage packs for Differential Equations and Linear Algebra — each
// gives every key concept a generator at difficulty 1/2/3. Kept in separate,
// self-contained files and merged into the registry below (see Object.assign
// near the bottom). These modules do not import from here, so no import cycle.
import { fill as deFill } from "./gen-de-fill.js";
import { fill as linAlgFill } from "./gen-linalg-fill.js";
// 2026-07 P1 content-expansion packs (see ROADMAP §15): one self-contained
// file per authoring slice, unique template prefixes, merged below.
import { fill as algGraphFill } from "./gen-alg-graph-fill.js";   // agr-
import { fill as calc1Fill } from "./gen-calc1-fill.js";          // c1i-, c1t-
import { fill as geoFill } from "./gen-geo-fill.js";              // gsm-, gci-
import { fill as deFill2 } from "./gen-de-fill2.js";              // def2-
import { fill as linAlgFill2 } from "./gen-linalg-fill2.js";      // laf2-
import { fill as trigFill } from "./gen-trig-fill.js";            // trg-
import { fill as trig2Fill } from "./gen-trig2-fill.js";          // trg2-
// Wave-2 packs (proofs + Cryptography, see ROADMAP §15.2b).
import { fill as geoProofFill } from "./gen-geo-proof-fill.js";     // gpr-
import { fill as calc3ProofFill } from "./gen-calc3-proof-fill.js"; // c3p-
import { fill as crypto1Fill } from "./gen-crypto1-fill.js";        // cr1-
import { fill as crypto2Fill } from "./gen-crypto2-fill.js";        // cr2-
import { fill as crypto3Fill } from "./gen-crypto3-fill.js";        // cr3-
import { fill as crypto4Fill } from "./gen-crypto4-fill.js";        // cr4- (weaknesses)
import { fill as discreteFill } from "./gen-discrete-fill.js";      // dm-  (discrete math)
import { fill as statsFill } from "./gen-stats-fill.js";            // stat- (statistics)
import { fill as alg2Fill } from "./gen-alg2-fill.js";              // a2f-  (algebra-2 complex/polynomial)
import { fill as trig3Fill } from "./gen-trig3-fill.js";            // trg3- (inverse trig, polar)
import { fill as calc1bFill } from "./gen-calc1b-fill.js";          // c1b-  (L'Hopital, linearization)
import { fill as calc2Fill } from "./gen-calc2-fill.js";            // c2f-  (partial fractions, improper, Taylor)
import { fill as calc3vFill } from "./gen-calc3v-fill.js";          // c3v-  (vector-valued, line integrals)
import { fill as lapGsFill } from "./gen-lap-gs-fill.js";           // lap-/gsq- (Laplace, Gram-Schmidt)
import { fill as stats2Fill } from "./gen-stats2-fill.js";          // st2-  (inference, regression)

// --- Seeded RNG (mulberry32) so sessions are reproducible/debuggable ---
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    float: next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

// Applied-context pools keep generated problems feeling real, not robotic.
const PLAN_CONTEXTS = [
  { item: "phone plan", unit: "months", monthly: "monthly fee", fee: "activation fee" },
  { item: "gym membership", unit: "months", monthly: "monthly dues", fee: "sign-up fee" },
  { item: "streaming service", unit: "months", monthly: "monthly cost", fee: "setup fee" },
  { item: "storage unit", unit: "months", monthly: "monthly rent", fee: "deposit" },
];

const BUY_CONTEXTS = [
  { plural: "notebooks", extra: "pen", unit: "dollars" },
  { plural: "tickets", extra: "booking fee", unit: "dollars" },
  { plural: "filters", extra: "wrench", unit: "dollars" },
  { plural: "bags of soil", extra: "trowel", unit: "dollars" },
];

const generators = {};

// Difficulty 1: a·x + b = c, integer solution. Concept: isolate-variable.
generators["linear-oneside-v1"] = (rng, idx) => {
  const a = rng.int(2, 9);
  const x = rng.int(2, 12);
  const b = rng.int(2, 20);
  const c = a * x + b;
  const ctx = rng.pick(BUY_CONTEXTS);
  return {
    id: `gen.linear-oneside-v1.${idx}`,
    generated: true,
    concepts: ["isolate-variable"],
    difficulty: 1,
    context: "applied",
    prompt: `You buy ${a} identical ${ctx.plural} and one \\$${b} ${ctx.extra}. The total is \\$${c}. What does each ${ctx.plural.replace(/s$/, "")} cost?`,
    steps: [
      {
        instruction: `Write an equation where $x$ is the cost of one ${ctx.plural.replace(/s$/, "")}.`,
        answer: `${a}x + ${b} = ${c}`,
        accept: [`${a}x+${b}=${c}`, `${b}+${a}x=${c}`],
        hint: `${a} items at $x$ each, plus the \\$${b} ${ctx.extra}, totals ${c}.`,
      },
      {
        instruction: `Subtract ${b} from both sides.`,
        answer: `${a}x = ${a * x}`,
        accept: [`${a}x=${a * x}`],
        hint: `Undo the +${b} first.`,
      },
      {
        instruction: "Solve for $x$.",
        answer: `x = ${x}`,
        accept: [`x=${x}`, `${x}`],
        hint: `Divide both sides by ${a}.`,
      },
    ],
    finalAnswer: { value: String(x), unit: ctx.unit },
    solutionNarrative: `From $${a}x + ${b} = ${c}$, subtract ${b} to get $${a}x = ${a * x}$, then divide by ${a}: $x = ${x}$.`,
  };
};

// Difficulty 2: variables on both sides, applied break-even.
// a·x + b = c·x + d with a > c and integer solution.
generators["linear-twoside-v1"] = (rng, idx) => {
  const x = rng.int(2, 12);
  const c = rng.int(1, 5);
  const a = c + rng.int(1, 4); // ensure a > c
  // a*x + b = c*x + d  ->  d - b = (a-c)*x. Choose b, derive d.
  const b = rng.int(5, 25);
  const d = b + (a - c) * x;
  const ctx = rng.pick(PLAN_CONTEXTS);
  return {
    id: `gen.linear-twoside-v1.${idx}`,
    generated: true,
    concepts: ["variables-both-sides"],
    difficulty: 2,
    context: "applied",
    prompt: `${ctx.item.replace(/^./, (m) => m.toUpperCase())} A costs \\$${a}/month plus a \\$${b} ${ctx.fee}. ${ctx.item.replace(/^./, (m) => m.toUpperCase())} B costs \\$${c}/month plus a \\$${d} ${ctx.fee}. After how many ${ctx.unit} do they cost the same?`,
    steps: [
      {
        instruction: `Write an equation setting the two totals equal (use $x$ for ${ctx.unit}).`,
        answer: `${a}x + ${b} = ${c}x + ${d}`,
        accept: [`${a}x+${b}=${c}x+${d}`, `${b}+${a}x=${d}+${c}x`],
        hint: "Each total is monthly × time + the one-time fee.",
      },
      {
        instruction: `Gather the variable terms (subtract ${c}x from both sides).`,
        answer: `${a - c}x + ${b} = ${d}`,
        accept: [`${a - c}x+${b}=${d}`, `${b}+${a - c}x=${d}`],
        hint: `Subtract ${c}x from both sides.`,
      },
      {
        instruction: `Isolate the variable term (subtract ${b}).`,
        answer: `${a - c}x = ${(a - c) * x}`,
        accept: [`${a - c}x=${(a - c) * x}`],
        hint: `Move the constant ${b} to the right.`,
      },
      {
        instruction: "Solve for $x$.",
        answer: `x = ${x}`,
        accept: [`x=${x}`, `${x}`],
        hint: `Divide both sides by ${a - c}.`,
      },
    ],
    finalAnswer: { value: String(x), unit: ctx.unit },
    solutionNarrative: `Set $${a}x + ${b} = ${c}x + ${d}$. Subtract ${c}x: $${a - c}x + ${b} = ${d}$. Subtract ${b}: $${a - c}x = ${(a - c) * x}$. Divide by ${a - c}: $x = ${x}$.`,
  };
};

// Difficulty 3: distribution with variables both sides.
// a(x + p) = b(x + q), integer solution. Concept: distribute + both sides.
generators["linear-distribute-v1"] = (rng, idx) => {
  // Build with a known integer root x0: a(x0 + p) = b(x0 + q)
  // => (a-b)x0 = bq - ap. Pick a,b,p,x0, derive q so it's integer.
  let a, b, p, q, x0, tries = 0;
  do {
    a = rng.int(2, 6);
    b = rng.int(2, 6);
    p = rng.int(1, 6);
    x0 = rng.int(2, 10);
    // need bq - ap = (a-b)x0  => q = ((a-b)x0 + a p) / b
    const numer = (a - b) * x0 + a * p;
    if (a !== b && numer % b === 0) {
      q = numer / b;
    } else {
      q = null;
    }
    tries++;
  } while ((q === null || q < -9 || q > 12) && tries < 200);
  if (q === null) {
    // Fallback to a guaranteed-clean instance.
    a = 3; b = 5; p = 4; q = -2; x0 = 11;
  }
  const qStr = q < 0 ? `- ${Math.abs(q)}` : `+ ${q}`;
  const rhsConst = b * q;
  const rhsConstStr = rhsConst < 0 ? `- ${Math.abs(rhsConst)}` : `+ ${rhsConst}`;
  return {
    id: `gen.linear-distribute-v1.${idx}`,
    generated: true,
    concepts: ["distribute", "variables-both-sides"],
    difficulty: 3,
    context: "abstract",
    prompt: `Solve for $x$:  $${a}(x + ${p}) = ${b}(x ${qStr})$.`,
    steps: [
      {
        instruction: "Distribute both sides.",
        answer: `${a}x + ${a * p} = ${b}x ${rhsConstStr}`,
        accept: [`${a}x+${a * p}=${b}x${rhsConst < 0 ? rhsConst : "+" + rhsConst}`],
        hint: `${a}(x + ${p}) = ${a}x + ${a * p}; distribute the right the same way.`,
      },
      {
        instruction: `Gather variables and constants, then solve for $x$.`,
        answer: `x = ${x0}`,
        accept: [`x=${x0}`, `${x0}`],
        hint: `Move all $x$ terms to one side and constants to the other, then divide by the coefficient.`,
      },
    ],
    finalAnswer: { value: String(x0), unit: "" },
    solutionNarrative: `Distribute to $${a}x + ${a * p} = ${b}x ${rhsConstStr}$, gather like terms, and divide through to get $x = ${x0}$.`,
  };
};

// --- Systems of linear equations (two variables) ----------------------------
// Coefficient formatter: 1x -> x, -1x -> -x, else 3x.
const cf = (n) => (n === 1 ? "" : n === -1 ? "-" : String(n));
// Signed constant for building "... + k" / "... - k" instructions.
const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);

const TICKET_CONTEXTS = [
  { event: "movie", a: "adult", c: "child", aShort: "adult", cShort: "child" },
  { event: "concert", a: "floor", c: "balcony", aShort: "floor", cShort: "balcony" },
  { event: "museum", a: "adult", c: "student", aShort: "adult", cShort: "student" },
];

// Difficulty 2: solve by elimination. Built so adding the equations cancels y.
generators["system-elimination-v1"] = (rng, idx) => {
  const x0 = rng.int(1, 8), y0 = rng.int(1, 8);
  const a = rng.int(1, 4), e = rng.int(1, 4), b = rng.int(1, 4);
  const c1 = a * x0 + b * y0;
  const c2 = e * x0 - b * y0;
  const sumA = a + e, sumC = c1 + c2;
  return {
    id: `gen.system-elimination-v1.${idx}`,
    generated: true,
    concepts: ["elimination"],
    difficulty: 2,
    context: "abstract",
    prompt: `Solve the system: $\\begin{cases} ${cf(a)}x + ${cf(b)}y = ${c1} \\\\ ${cf(e)}x - ${cf(b)}y = ${c2} \\end{cases}$`,
    steps: [
      {
        instruction: "The $y$ terms are opposites, so adding the two equations eliminates $y$. Add them and write the result as one equation in $x$.",
        answer: `${sumA}x = ${sumC}`,
        accept: [`${sumC} = ${sumA}x`],
        hint: "Add left-to-left and right-to-right: the $+" + cf(b) + "y$ and $-" + cf(b) + "y$ cancel.",
      },
      { instruction: "Solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`], hint: `Divide both sides by ${sumA}.` },
      {
        instruction: `Substitute $x = ${x0}$ into the first equation to find $y$.`,
        answer: `y = ${y0}`,
        accept: [`${y0}`],
        hint: `Replace $x$ with ${x0}, then isolate $y$.`,
      },
      {
        instruction: "Write the solution as an ordered pair $(x, y)$.",
        answer: `(${x0}, ${y0})`,
        accept: [`x=${x0}, y=${y0}`, `${x0},${y0}`],
        hint: "Ordered pairs are written (x-value, y-value).",
      },
    ],
    finalAnswer: { value: `(${x0}, ${y0})`, unit: "" },
    solutionNarrative: `Adding the equations cancels $y$: $${sumA}x = ${sumC}$, so $x = ${x0}$. Substituting back gives $y = ${y0}$. Solution: $(${x0}, ${y0})$.`,
  };
};

// Difficulty 2: solve by substitution (one equation already solved for y).
generators["system-substitution-v1"] = (rng, idx) => {
  const x0 = rng.int(1, 8), m = rng.int(1, 3), k = rng.int(-4, 6);
  const y0 = m * x0 + k;
  const a = rng.int(1, 4), b = rng.int(1, 4);
  const c = a * x0 + b * y0;
  const A = a + b * m, B = c - b * k;
  return {
    id: `gen.system-substitution-v1.${idx}`,
    generated: true,
    concepts: ["substitution"],
    difficulty: 2,
    context: "abstract",
    prompt: `Solve the system: $\\begin{cases} y = ${cf(m)}x ${signed(k)} \\\\ ${cf(a)}x + ${cf(b)}y = ${c} \\end{cases}$`,
    steps: [
      {
        instruction: `Substitute $y = ${cf(m)}x ${signed(k)}$ into the second equation, distribute, and combine like terms into the form $(\\text{number})x = (\\text{number})$.`,
        answer: `${A}x = ${B}`,
        accept: [`${B} = ${A}x`],
        hint: `The second equation becomes $${cf(a)}x + ${b}(${cf(m)}x ${signed(k)}) = ${c}$. Distribute and collect the $x$ terms.`,
      },
      { instruction: "Solve for $x$.", answer: `x = ${x0}`, accept: [`${x0}`], hint: `Divide both sides by ${A}.` },
      {
        instruction: `Use $y = ${cf(m)}x ${signed(k)}$ with $x = ${x0}$ to find $y$.`,
        answer: `y = ${y0}`,
        accept: [`${y0}`],
        hint: `Plug ${x0} in for $x$.`,
      },
      {
        instruction: "Write the solution as an ordered pair $(x, y)$.",
        answer: `(${x0}, ${y0})`,
        accept: [`x=${x0}, y=${y0}`, `${x0},${y0}`],
        hint: "Ordered pairs are written (x-value, y-value).",
      },
    ],
    finalAnswer: { value: `(${x0}, ${y0})`, unit: "" },
    solutionNarrative: `Substituting gives $${A}x = ${B}$, so $x = ${x0}$, and then $y = ${y0}$. Solution: $(${x0}, ${y0})$.`,
  };
};

// Difficulty 2: translate an applied situation into a system, then solve.
generators["system-setup-v1"] = (rng, idx) => {
  const x0 = rng.int(4, 20), y0 = rng.int(4, 20);
  const T = x0 + y0;
  const pa = rng.int(7, 15), pc = rng.int(3, pa - 1);
  const R = pa * x0 + pc * y0;
  const ctx = rng.pick(TICKET_CONTEXTS);
  return {
    id: `gen.system-setup-v1.${idx}`,
    generated: true,
    concepts: ["setup-system"],
    difficulty: 2,
    context: "applied",
    prompt: `A ${ctx.event} sells ${ctx.aShort} tickets for \\$${pa} and ${ctx.cShort} tickets for \\$${pc}. One showing sold ${T} tickets and collected \\$${R}. How many of each were sold? (Let $x$ = ${ctx.aShort} tickets, $y$ = ${ctx.cShort} tickets.)`,
    steps: [
      {
        instruction: "Write an equation for the total number of tickets sold.",
        answer: `x + y = ${T}`,
        accept: [`y + x = ${T}`],
        hint: "Adult tickets plus child tickets equals the total count.",
      },
      {
        instruction: "Write an equation for the total money collected.",
        answer: `${cf(pa)}x + ${cf(pc)}y = ${R}`,
        accept: [`${cf(pc)}y + ${cf(pa)}x = ${R}`],
        hint: `Each $x$ brings in \\$${pa} and each $y$ brings in \\$${pc}.`,
      },
      {
        instruction: `Solve the system for the number of ${ctx.aShort} tickets, $x$.`,
        answer: `x = ${x0}`,
        accept: [`${x0}`],
        hint: "From the first equation, $y = " + T + " - x$. Substitute into the second.",
      },
      {
        instruction: `How many ${ctx.cShort} tickets, $y$?`,
        answer: `y = ${y0}`,
        accept: [`${y0}`],
        hint: `Use $y = ${T} - x$ with the $x$ you just found.`,
      },
    ],
    finalAnswer: { value: `(${x0}, ${y0})`, unit: "tickets" },
    solutionNarrative: `The system is $x + y = ${T}$ and $${cf(pa)}x + ${cf(pc)}y = ${R}$. Solving gives ${x0} ${ctx.aShort} tickets and ${y0} ${ctx.cShort} tickets.`,
  };
};

// --- Factoring polynomials ---------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
// Coefficient on x^2 in a prompt: drop a leading 1 ("1x^2" -> "x^2").
const sqf = (n) => (n === 1 ? "x^2" : `${n}x^2`);

// Factor out the GCF:  (g*a)x^2 + (g*b)x  ->  gx(ax + b).
generators["factor-gcf-v1"] = (rng, idx) => {
  const g = rng.int(2, 6);
  let a, b;
  do { a = rng.int(1, 4); b = rng.int(2, 8); } while (gcd(a, b) !== 1);
  const t1 = g * a, t2 = g * b;
  const factored = `${g}x(${cf(a)}x + ${b})`;
  return {
    id: `gen.factor-gcf-v1.${idx}`, generated: true,
    concepts: ["gcf"], difficulty: 2, context: "abstract",
    prompt: `Factor completely by pulling out the greatest common factor: $${t1}x^2 + ${t2}x$`,
    steps: [
      { instruction: "What is the greatest common factor (GCF) of the two terms?", answer: `${g}x`, accept: [`${cf(g)}x`], hint: `Both terms share the number ${g} and at least one $x$.` },
      { instruction: "Factor out the GCF and write the factored form.", form: "factored", answer: factored, accept: [], hint: "Divide each term by the GCF to find what's left inside the parentheses." },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `The GCF is $${g}x$, leaving $${factored}$.`,
  };
};

// Difference of squares:  (m^2)x^2 - n^2  ->  (mx - n)(mx + n).
generators["factor-diff-squares-v1"] = (rng, idx) => {
  const m = rng.int(1, 3), n = rng.int(2, 9);
  const sq1 = m * m, sq2 = n * n;
  const mx = `${cf(m)}x`;
  const factored = `(${mx} - ${n})(${mx} + ${n})`;
  return {
    id: `gen.factor-diff-squares-v1.${idx}`, generated: true,
    concepts: ["difference-of-squares"], difficulty: 2, context: "abstract",
    prompt: `Factor completely: $${sqf(sq1)} - ${sq2}$`,
    steps: [
      { instruction: `This is a difference of squares. What is the square root of $${sqf(sq1)}$? (For example, $9x^2 \\to 3x$.)`, answer: mx, accept: [], hint: `Square-root the coefficient ${sq1} and the $x^2$.` },
      { instruction: `What is the square root of $${sq2}$?`, answer: `${n}`, accept: [], hint: `What number squared is ${sq2}?` },
      { instruction: "Write the factorization as (difference)(sum).", form: "factored", answer: factored, accept: [], hint: "The pattern $a^2-b^2=(a-b)(a+b)$." },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `A difference of squares: $${sqf(sq1)} - ${sq2} = ${factored}$.`,
  };
};

// Simple trinomial (leading coefficient 1):  x^2 + (p+q)x + pq  ->  (x+p)(x+q).
generators["factor-trinomial-v1"] = (rng, idx) => {
  let p, q;
  do { p = rng.int(-6, 6); q = rng.int(-6, 6); } while (p === 0 || q === 0 || p + q === 0);
  const b = p + q, c = p * q;
  const factored = `(x ${signed(p)})(x ${signed(q)})`;
  return {
    id: `gen.factor-trinomial-v1.${idx}`, generated: true,
    concepts: ["trinomial-simple"], difficulty: 2, context: "abstract",
    prompt: `Factor completely: $x^2 ${signed(b)}x ${signed(c)}$`,
    steps: [
      { instruction: `Find two integers that multiply to ${c} and add to ${b}. Enter them comma-separated.`, answer: `${p}, ${q}`, accept: [`${q}, ${p}`], hint: `Product = ${c}, sum = ${b}. Mind the signs.` },
      { instruction: "Write the factorization.", form: "factored", answer: factored, accept: [], hint: "Each number $r$ becomes a factor $(x + r)$." },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `${p} and ${q} multiply to ${c} and add to ${b}, so it factors as $${factored}$.`,
  };
};

// Trinomial with a leading coefficient:  (mx+p)(nx+q), with mn > 1.
generators["factor-trinomial-leading-v1"] = (rng, idx) => {
  let m, n, p, q;
  do {
    m = rng.int(1, 3); n = rng.int(1, 3);
    p = rng.int(-4, 4); q = rng.int(-4, 4);
  } while (m * n < 2 || p === 0 || q === 0 || m * q + n * p === 0);
  const A = m * n, B = m * q + n * p, C = p * q;
  const factored = `(${cf(m)}x ${signed(p)})(${cf(n)}x ${signed(q)})`;
  return {
    id: `gen.factor-trinomial-leading-v1.${idx}`, generated: true,
    concepts: ["trinomial-leading"], difficulty: 3, context: "abstract",
    prompt: `Factor completely: $${A}x^2 ${signed(B)}x ${signed(C)}$`,
    steps: [
      { instruction: `Factor this trinomial (leading coefficient ${A}) into a product of two binomials.`, form: "factored", answer: factored, accept: [], hint: `AC method: find two numbers that multiply to ${A * C} and add to ${B}, then split the middle term.` },
    ],
    finalAnswer: { value: factored, unit: "" },
    solutionNarrative: `It factors as $${factored}$.`,
  };
};

// --- Quadratic equations -----------------------------------------------------

// Solve by factoring: x^2 + bx + c = 0 with integer roots r1, r2.
generators["quad-factorable-v1"] = (rng, idx) => {
  let r1, r2;
  do { r1 = rng.int(-6, 6); r2 = rng.int(-6, 6); } while (r1 === 0 || r2 === 0 || r1 + r2 === 0);
  const b = -(r1 + r2), c = r1 * r2;
  const factored = `(x ${signed(-r1)})(x ${signed(-r2)})`;
  return {
    id: `gen.quad-factorable-v1.${idx}`, generated: true,
    concepts: ["solve-by-factoring"], difficulty: 2, context: "abstract",
    prompt: `Solve by factoring: $x^2 ${signed(b)}x ${signed(c)} = 0$`,
    steps: [
      { instruction: "Factor the left side.", form: "factored", answer: factored, accept: [], hint: `Two numbers multiplying to ${c} and adding to ${b}.` },
      { instruction: "Use the zero-product property to find both solutions. Separate them with 'or' or a comma.", form: "solutions", answer: `x = ${r1} or x = ${r2}`, accept: [`${r1}, ${r2}`], hint: "Set each factor equal to 0 and solve." },
    ],
    finalAnswer: { value: `x = ${r1}, x = ${r2}`, unit: "" },
    solutionNarrative: `Factor to $${factored} = 0$; the solutions are $x = ${r1}$ and $x = ${r2}$.`,
  };
};

// Square-root method: (x - h)^2 = n^2  ->  x = h ± n.
generators["quad-sqrt-v1"] = (rng, idx) => {
  const h = rng.int(0, 5), n = rng.int(2, 7), k = n * n;
  const lhs = h === 0 ? "x^2" : `(x ${signed(-h)})^2`;
  return {
    id: `gen.quad-sqrt-v1.${idx}`, generated: true,
    concepts: ["square-root-method"], difficulty: 2, context: "abstract",
    prompt: `Solve: $${lhs} = ${k}$`,
    steps: [
      { instruction: "Take the square root of both sides (keep the $\\pm$), then solve for both values of $x$. Enter both solutions.", form: "solutions", answer: `x = ${h + n} or x = ${h - n}`, accept: [`${h + n}, ${h - n}`], hint: `$x ${signed(-h)} = \\pm ${n}$, so $x = ${h} \\pm ${n}$.` },
    ],
    finalAnswer: { value: `x = ${h + n}, x = ${h - n}`, unit: "" },
    solutionNarrative: `Square-rooting both sides gives $x ${signed(-h)} = \\pm ${n}$, so $x = ${h + n}$ and $x = ${h - n}$.`,
  };
};

// Quadratic formula: x^2 + bx + c = 0 (a = 1), perfect-square discriminant.
generators["quad-formula-v1"] = (rng, idx) => {
  let r1, r2;
  do { r1 = rng.int(-6, 6); r2 = rng.int(-6, 6); } while (r1 === 0 || r2 === 0 || r1 + r2 === 0);
  const b = -(r1 + r2), c = r1 * r2;
  const D = b * b - 4 * c;
  return {
    id: `gen.quad-formula-v1.${idx}`, generated: true,
    concepts: ["quadratic-formula"], difficulty: 3, context: "abstract",
    prompt: `Use the quadratic formula to solve: $x^2 ${signed(b)}x ${signed(c)} = 0$`,
    steps: [
      { instruction: "First compute the discriminant $b^2 - 4ac$ (here $a = 1$).", answer: `${D}`, accept: [], hint: `$b = ${b}$, $c = ${c}$.` },
      { instruction: "Now apply $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ to find both solutions. Enter both.", form: "solutions", answer: `x = ${r1} or x = ${r2}`, accept: [`${r1}, ${r2}`], hint: `$\\sqrt{${D}} = ${Math.sqrt(D)}$, then $x = \\dfrac{${-b} \\pm ${Math.sqrt(D)}}{2}$.` },
    ],
    finalAnswer: { value: `x = ${r1}, x = ${r2}`, unit: "" },
    solutionNarrative: `The discriminant is ${D}; the formula gives $x = ${r1}$ and $x = ${r2}$.`,
  };
};

// Discriminant: classify number of real solutions of ax^2 + bx + c = 0.
generators["discriminant-v1"] = (rng, idx) => {
  let a, b, c;
  do { a = rng.int(1, 3); b = rng.int(-6, 6); c = rng.int(-5, 6); } while (b === 0 || c === 0);
  const D = b * b - 4 * a * c;
  const count = D > 0 ? "two" : D === 0 ? "one" : "none";
  return {
    id: `gen.discriminant-v1.${idx}`, generated: true,
    concepts: ["discriminant"], difficulty: 1, context: "abstract",
    prompt: `For $${cf(a)}x^2 ${signed(b)}x ${signed(c)} = 0$, use the discriminant to find the number of real solutions.`,
    steps: [
      { instruction: "Compute the discriminant $b^2 - 4ac$.", answer: `${D}`, accept: [], hint: `Here $a = ${a}$, $b = ${b}$, $c = ${c}$.` },
      { instruction: "How many real solutions? Type 'two', 'one', or 'none'.", answer: count, accept: [count === "none" ? "0" : count === "one" ? "1" : "2"], hint: "Positive → two, zero → one, negative → none." },
    ],
    finalAnswer: { value: count, unit: "" },
    solutionNarrative: `The discriminant is ${D}, so the equation has ${count === "two" ? "two real solutions" : count === "one" ? "one real solution" : "no real solutions"}.`,
  };
};

// --- Variables & Expressions -------------------------------------------------

const SERVICE_CONTEXTS = [
  { name: "plumber", fee: "call-out fee", rate: "per hour", unit: "hours", v: "h" },
  { name: "car rental", fee: "base fee", rate: "per day", unit: "days", v: "d" },
  { name: "caterer", fee: "setup fee", rate: "per guest", unit: "guests", v: "g" },
  { name: "gym", fee: "joining fee", rate: "per month", unit: "months", v: "m" },
];

// Evaluate a linear expression a*x + b at x = v (difficulty 1).
generators["eval-linear-v1"] = (rng, idx) => {
  const a = rng.int(2, 9), b = rng.int(-9, 12), v = rng.int(-5, 8);
  const val = a * v + b;
  return {
    id: `gen.eval-linear-v1.${idx}`, generated: true,
    concepts: ["evaluate-expression"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $${a}x ${signed(b)}$ when $x = ${v}$.`,
    steps: [
      { instruction: `Substitute $x = ${v}$ and compute.`, answer: `${val}`, accept: [], hint: `Multiply ${a} by ${v}, then ${b < 0 ? "subtract " + -b : "add " + b}.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$${a}(${v}) ${signed(b)} = ${val}$.`,
  };
};

// Evaluate a quadratic a*x^2 + b*x + c at x = v (difficulty 2).
generators["eval-quadratic-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(-6, 6), c = rng.int(-8, 8), v = rng.int(-4, 5);
  const val = a * v * v + b * v + c;
  return {
    id: `gen.eval-quadratic-v1.${idx}`, generated: true,
    concepts: ["evaluate-expression"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${cf(a)}x^2 ${signed(b)}x ${signed(c)}$ when $x = ${v}$.`,
    steps: [
      { instruction: `Substitute $x = ${v}$ and compute (remember $x^2$ first).`, answer: `${val}`, accept: [], hint: `First square ${v} to get ${v * v}, then combine the terms.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$${cf(a)}(${v})^2 ${signed(b)}(${v}) ${signed(c)} = ${val}$.`,
  };
};

// Combine like terms: a*x + b + c*x + d (difficulty 1).
generators["combine-terms-v1"] = (rng, idx) => {
  const a = rng.int(2, 9), b = rng.int(-8, 9), c = rng.int(-6, 7), d = rng.int(-8, 9);
  const xc = a + c, k = b + d;
  return {
    id: `gen.combine-terms-v1.${idx}`, generated: true,
    concepts: ["combine-like-terms"], difficulty: 1, context: "abstract",
    prompt: `Combine like terms: $${a}x ${signed(b)} ${signed(c)}x ${signed(d)}$`,
    steps: [
      { instruction: "Combine the $x$ terms and the constants.", answer: `${xc}x ${signed(k)}`, accept: [`${k} + ${xc}x`], hint: `Add the coefficients of $x$ (${a} and ${c}); add the constants (${b} and ${d}).` },
    ],
    finalAnswer: { value: `${xc}x ${signed(k)}`, unit: "" },
    solutionNarrative: `The $x$ terms give $${xc}x$ and the constants give $${k}$: $${xc}x ${signed(k)}$.`,
  };
};

// Distribute: a(b*x + c) (difficulty 2).
generators["distribute-v1"] = (rng, idx) => {
  const a = rng.int(2, 7), b = rng.int(2, 6), c = rng.int(-8, 8);
  return {
    id: `gen.distribute-v1.${idx}`, generated: true,
    concepts: ["distributive-property"], difficulty: 2, context: "abstract",
    prompt: `Use the distributive property: $${a}(${cf(b)}x ${signed(c)})$`,
    steps: [
      { instruction: "Multiply each term inside the parentheses by the outside factor.", answer: `${a * b}x ${signed(a * c)}`, accept: [], hint: `${a} times ${b}x, and ${a} times ${c}.` },
    ],
    finalAnswer: { value: `${a * b}x ${signed(a * c)}`, unit: "" },
    solutionNarrative: `$${a}(${cf(b)}x ${signed(c)}) = ${a * b}x ${signed(a * c)}$.`,
  };
};

// Distribute then combine: a(b*x + c) + d*x (difficulty 3).
generators["distribute-combine-v1"] = (rng, idx) => {
  const a = rng.int(2, 6), b = rng.int(2, 5), c = rng.int(-7, 7), d = rng.int(-6, 8);
  const xc = a * b + d, k = a * c;
  return {
    id: `gen.distribute-combine-v1.${idx}`, generated: true,
    concepts: ["distributive-property"], difficulty: 3, context: "abstract",
    prompt: `Simplify: $${a}(${cf(b)}x ${signed(c)}) ${signed(d)}x$`,
    steps: [
      { instruction: "Distribute, then combine like terms.", answer: `${xc}x ${signed(k)}`, accept: [`${k} + ${xc}x`], hint: `First $${a}(${cf(b)}x ${signed(c)}) = ${a * b}x ${signed(k)}$, then add the $${d}x$.` },
    ],
    finalAnswer: { value: `${xc}x ${signed(k)}`, unit: "" },
    solutionNarrative: `Distributing gives $${a * b}x ${signed(k)}$; adding $${d}x$ yields $${xc}x ${signed(k)}$.`,
  };
};

// Translate a real situation into an expression (difficulty 1, applied).
generators["translate-cost-v1"] = (rng, idx) => {
  const a = rng.int(3, 25), b = rng.int(10, 80);
  const ctx = rng.pick(SERVICE_CONTEXTS);
  return {
    id: `gen.translate-cost-v1.${idx}`, generated: true,
    concepts: ["translate-to-expression"], difficulty: 1, context: "applied",
    prompt: `A ${ctx.name} charges a \\$${b} ${ctx.fee} plus \\$${a} ${ctx.rate}. Write an expression for the total cost of $x$ ${ctx.unit}.`,
    steps: [
      { instruction: `Write the cost as (rate)(number of ${ctx.unit}) + fee.`, answer: `${a}x + ${b}`, accept: [`${b} + ${a}x`], hint: `Each of the $x$ ${ctx.unit} costs \\$${a}, plus the one-time \\$${b}.` },
    ],
    finalAnswer: { value: `${a}x + ${b}`, unit: "dollars" },
    solutionNarrative: `Total cost $= ${a}x + ${b}$ dollars.`,
  };
};

// --- Real Numbers ------------------------------------------------------------
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };

generators["pemdas-v1"] = (rng, idx) => {
  const a = rng.int(2, 20), b = rng.int(2, 9), c = rng.int(2, 9);
  const val = a + b * c;
  return {
    id: `gen.pemdas-v1.${idx}`, generated: true, concepts: ["order-of-operations"], difficulty: 1, context: "abstract",
    prompt: `Evaluate using order of operations: $${a} + ${b} \\times ${c}$`,
    steps: [{ instruction: "Multiply before adding.", answer: `${val}`, accept: [], hint: `Do $${b} \\times ${c}$ first, then add ${a}.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${b}\\times${c}=${b * c}$, then $+${a}=${val}$.`,
  };
};
generators["pemdas-parens-v1"] = (rng, idx) => {
  const a = rng.int(2, 8), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(1, 15);
  const val = a * (b + c) - d;
  return {
    id: `gen.pemdas-parens-v1.${idx}`, generated: true, concepts: ["order-of-operations"], difficulty: 2, context: "abstract",
    prompt: `Evaluate: $${a}(${b} + ${c}) - ${d}$`,
    steps: [{ instruction: "Parentheses first, then multiply, then subtract.", answer: `${val}`, accept: [], hint: `$${b}+${c}=${b + c}$, then $\\times ${a}$, then $-${d}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${a}(${b + c}) - ${d} = ${val}$.`,
  };
};
generators["integer-arith-v1"] = (rng, idx) => {
  const x = nz(rng, -12, 12), y = nz(rng, -12, 12);
  const [sym, val] = rng.pick([["+", x + y], ["-", x - y], ["\\times", x * y]]);
  const ydisp = y < 0 ? `(${y})` : `${y}`;
  return {
    id: `gen.integer-arith-v1.${idx}`, generated: true, concepts: ["integer-operations"], difficulty: 1, context: "abstract",
    prompt: `Compute: $${x} ${sym} ${ydisp}$`,
    steps: [{ instruction: "Apply the sign rules and compute.", answer: `${val}`, accept: [], hint: "A negative times a negative is positive; subtracting a negative adds." }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${x} ${sym} ${ydisp} = ${val}$.`,
  };
};
generators["integer-mixed-v1"] = (rng, idx) => {
  const a = nz(rng, -10, 10), b = nz(rng, -8, 8), c = nz(rng, -8, 8);
  const val = a - b * c;
  return {
    id: `gen.integer-mixed-v1.${idx}`, generated: true, concepts: ["integer-operations"], difficulty: 2, context: "abstract",
    prompt: `Compute: $${a} - (${b})(${c})$`,
    steps: [{ instruction: "Multiply first (watch the signs), then subtract.", answer: `${val}`, accept: [], hint: `$(${b})(${c}) = ${b * c}$, then $${a} - (${b * c})$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${a} - (${b * c}) = ${val}$.`,
  };
};
generators["fraction-mult-v1"] = (rng, idx) => {
  const a = rng.int(1, 6), b = rng.int(2, 7), c = rng.int(1, 6), d = rng.int(2, 7);
  const ans = frac(a * c, b * d);
  return {
    id: `gen.fraction-mult-v1.${idx}`, generated: true, concepts: ["fraction-operations"], difficulty: 1, context: "abstract",
    prompt: `Multiply and simplify: $\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}$`,
    steps: [{ instruction: "Multiply numerators and denominators, then simplify. Enter as a fraction.", answer: ans, accept: [`${a * c}/${b * d}`], hint: `$\\frac{${a}\\times${c}}{${b}\\times${d}}$, then reduce.` }],
    finalAnswer: { value: ans, unit: "" }, solutionNarrative: `$\\frac{${a * c}}{${b * d}} = ${ans}$.`,
  };
};
generators["fraction-add-v1"] = (rng, idx) => {
  const b = rng.int(2, 8), d = rng.int(2, 8), a = rng.int(1, b), c = rng.int(1, d);
  const num = a * d + c * b, den = b * d, ans = frac(num, den);
  return {
    id: `gen.fraction-add-v1.${idx}`, generated: true, concepts: ["fraction-operations"], difficulty: 2, context: "abstract",
    prompt: `Add and simplify: $\\frac{${a}}{${b}} + \\frac{${c}}{${d}}$`,
    steps: [{ instruction: "Find a common denominator, add, then simplify. Enter as a fraction (or whole number).", answer: ans, accept: [`${num}/${den}`], hint: `Common denominator ${den}: $\\frac{${a * d}}{${den}} + \\frac{${c * b}}{${den}}$.` }],
    finalAnswer: { value: ans, unit: "" }, solutionNarrative: `$\\frac{${a * d} + ${c * b}}{${den}} = ${ans}$.`,
  };
};
generators["abs-eval-v1"] = (rng, idx) => {
  const a = rng.int(-15, -1), val = Math.abs(a);
  return {
    id: `gen.abs-eval-v1.${idx}`, generated: true, concepts: ["absolute-value"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $|${a}|$`,
    steps: [{ instruction: "Absolute value is distance from zero (never negative).", answer: `${val}`, accept: [], hint: `How far is ${a} from 0?` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$|${a}| = ${val}$.`,
  };
};
generators["abs-distance-v1"] = (rng, idx) => {
  const p = nz(rng, -9, 9);
  let q = nz(rng, -9, 9); if (q === p) q = p === 9 ? -9 : p + 1;
  const val = Math.abs(p - q);
  return {
    id: `gen.abs-distance-v1.${idx}`, generated: true, concepts: ["absolute-value"], difficulty: 2, context: "applied",
    prompt: `The temperature went from $${p}°$ to $${q}°$. By how many degrees did it change (the size of the change)?`,
    steps: [{ instruction: `Compute the distance $|${q} - (${p})|$.`, answer: `${val}`, accept: [], hint: `Distance between ${p} and ${q} on the number line.` }],
    finalAnswer: { value: `${val}`, unit: "degrees" }, solutionNarrative: `$|${q} - (${p})| = ${val}$.`,
  };
};

// --- Polynomial Operations ---------------------------------------------------
generators["poly-add-v1"] = (rng, idx) => {
  const a = rng.int(1, 6), b = nz(rng, -6, 6), c = nz(rng, -8, 8), d = rng.int(1, 6), e = nz(rng, -6, 6), f = nz(rng, -8, 8);
  return {
    id: `gen.poly-add-v1.${idx}`, generated: true, concepts: ["add-subtract-polynomials"], difficulty: 1, context: "abstract",
    prompt: `Add: $(${cf(a)}x^2 ${signed(b)}x ${signed(c)}) + (${cf(d)}x^2 ${signed(e)}x ${signed(f)})$`,
    steps: [{ instruction: "Combine like terms.", answer: `${a + d}x^2 ${signed(b + e)}x ${signed(c + f)}`, accept: [], hint: "Add the $x^2$ coefficients, the $x$ coefficients, and the constants." }],
    finalAnswer: { value: `${a + d}x^2 ${signed(b + e)}x ${signed(c + f)}`, unit: "" }, solutionNarrative: `Combining like terms gives $${a + d}x^2 ${signed(b + e)}x ${signed(c + f)}$.`,
  };
};
generators["poly-subtract-v1"] = (rng, idx) => {
  const a = rng.int(2, 7), b = nz(rng, -6, 6), c = nz(rng, -8, 8), d = rng.int(1, a - 1 < 1 ? 1 : a - 1), e = nz(rng, -6, 6), f = nz(rng, -8, 8);
  return {
    id: `gen.poly-subtract-v1.${idx}`, generated: true, concepts: ["add-subtract-polynomials"], difficulty: 2, context: "abstract",
    prompt: `Subtract: $(${cf(a)}x^2 ${signed(b)}x ${signed(c)}) - (${cf(d)}x^2 ${signed(e)}x ${signed(f)})$`,
    steps: [{ instruction: "Distribute the minus sign, then combine like terms.", answer: `${a - d}x^2 ${signed(b - e)}x ${signed(c - f)}`, accept: [], hint: "Subtracting flips the sign of every term in the second polynomial." }],
    finalAnswer: { value: `${a - d}x^2 ${signed(b - e)}x ${signed(c - f)}`, unit: "" }, solutionNarrative: `After distributing the minus and combining: $${a - d}x^2 ${signed(b - e)}x ${signed(c - f)}$.`,
  };
};
generators["poly-monomial-v1"] = (rng, idx) => {
  const k = rng.int(2, 6), a = rng.int(1, 5), b = nz(rng, -6, 6), c = nz(rng, -7, 7);
  return {
    id: `gen.poly-monomial-v1.${idx}`, generated: true, concepts: ["multiply-monomial"], difficulty: 2, context: "abstract",
    prompt: `Multiply: $${k}x(${cf(a)}x^2 ${signed(b)}x ${signed(c)})$`,
    steps: [{ instruction: "Distribute the monomial to each term.", answer: `${k * a}x^3 ${signed(k * b)}x^2 ${signed(k * c)}x`, accept: [], hint: `Multiply $${k}x$ by each term; add exponents on the $x$'s.` }],
    finalAnswer: { value: `${k * a}x^3 ${signed(k * b)}x^2 ${signed(k * c)}x`, unit: "" }, solutionNarrative: `$${k}x$ times each term gives $${k * a}x^3 ${signed(k * b)}x^2 ${signed(k * c)}x$.`,
  };
};
generators["poly-foil-v1"] = (rng, idx) => {
  const p = nz(rng, -7, 7), q = nz(rng, -7, 7);
  return {
    id: `gen.poly-foil-v1.${idx}`, generated: true, concepts: ["multiply-binomials"], difficulty: 2, context: "abstract",
    prompt: `Multiply (FOIL): $(x ${signed(p)})(x ${signed(q)})$`,
    steps: [{ instruction: "Multiply out and combine the middle terms.", answer: `x^2 ${signed(p + q)}x ${signed(p * q)}`, accept: [], hint: `First $x^2$, then the middle term $${p + q}x$, then the constant $${p * q}$.` }],
    finalAnswer: { value: `x^2 ${signed(p + q)}x ${signed(p * q)}`, unit: "" }, solutionNarrative: `$(x ${signed(p)})(x ${signed(q)}) = x^2 ${signed(p + q)}x ${signed(p * q)}$.`,
  };
};
generators["poly-degree-v1"] = (rng, idx) => {
  const n = rng.int(3, 6), a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(1, 9);
  return {
    id: `gen.poly-degree-v1.${idx}`, generated: true, concepts: ["degree-and-classification"], difficulty: 1, context: "abstract",
    prompt: `Consider the polynomial $${a}x^${n} - ${b}x^2 + ${c}$.`,
    steps: [
      { instruction: "What is the degree of the polynomial?", answer: `${n}`, accept: [], hint: "The degree is the highest exponent." },
      { instruction: "Classify it by its number of terms (monomial, binomial, or trinomial).", answer: "trinomial", accept: ["3 terms"], hint: "Count the terms." },
    ],
    finalAnswer: { value: `degree ${n}, trinomial`, unit: "" }, solutionNarrative: `Highest exponent is ${n} (degree ${n}); it has 3 terms, so it's a trinomial.`,
  };
};

// --- Linear Inequalities -----------------------------------------------------
const flipOp = (op) => ({ "<": ">", ">": "<", "<=": ">=", ">=": "<=" }[op]);
const opTex = (op) => ({ "<": "<", ">": ">", "<=": "\\le", ">=": "\\ge" }[op]); // nice display
generators["solve-ineq-v1"] = (rng, idx) => {
  const a = rng.int(2, 8), k = nz(rng, -8, 8), b = nz(rng, -10, 10);
  const c = a * k + b; // a*x + b <op> c  has boundary x = k
  const op = rng.pick(["<", ">", "<=", ">="]);
  return {
    id: `gen.solve-ineq-v1.${idx}`, generated: true, concepts: ["solve-inequality"], difficulty: 1, context: "abstract",
    prompt: `Solve: $${a}x ${signed(b)} ${opTex(op)} ${c}$`,
    steps: [{ instruction: "Isolate $x$ (the coefficient is positive, so the direction stays).", answer: `x ${op} ${k}`, accept: [`${k} ${flipOp(op)} x`], hint: `Subtract ${b}, then divide by ${a}.` }],
    finalAnswer: { value: `x ${op} ${k}`, unit: "" }, solutionNarrative: `Solving gives $x ${opTex(op)} ${k}$.`,
  };
};
generators["flip-negative-v1"] = (rng, idx) => {
  const a = rng.int(2, 8), k = nz(rng, -8, 8), b = nz(rng, -10, 10);
  const c = -a * k + b; // -a*x + b <op> c has boundary x = k; dividing by -a flips
  const op = rng.pick(["<", ">", "<=", ">="]);
  return {
    id: `gen.flip-negative-v1.${idx}`, generated: true, concepts: ["flip-on-negative"], difficulty: 2, context: "abstract",
    prompt: `Solve (watch the sign flip): $-${a}x ${signed(b)} ${opTex(op)} ${c}$`,
    steps: [{ instruction: "Isolate $x$. Dividing by a negative REVERSES the inequality.", answer: `x ${flipOp(op)} ${k}`, accept: [`${k} ${op} x`], hint: `Subtract ${b}, then divide by $-${a}$ and flip the sign.` }],
    finalAnswer: { value: `x ${flipOp(op)} ${k}`, unit: "" }, solutionNarrative: `Dividing by $-${a}$ flips the inequality, giving $x ${opTex(flipOp(op))} ${k}$.`,
  };
};
generators["interval-ineq-v1"] = (rng, idx) => {
  const a = rng.int(2, 7), k = nz(rng, -7, 9), b = nz(rng, -9, 9);
  const c = a * k + b;
  const op = rng.pick(["<=", ">="]);
  return {
    id: `gen.interval-ineq-v1.${idx}`, generated: true, concepts: ["interval-notation"], difficulty: 2, context: "abstract",
    prompt: `Solve and give the solution as an inequality: $${a}x ${signed(b)} ${opTex(op)} ${c}$`,
    steps: [{ instruction: "Solve for $x$ and write the solution as an inequality (e.g. $x \\le 5$).", answer: `x ${op} ${k}`, accept: [`${k} ${flipOp(op)} x`], hint: `This is the interval ${op === "<=" ? `(-\\infty, ${k}]` : `[${k}, \\infty)`} in interval notation.` }],
    finalAnswer: { value: `x ${op} ${k}`, unit: "" }, solutionNarrative: `$x ${op} ${k}$.`,
  };
};
generators["compound-ineq-v1"] = (rng, idx) => {
  const b = nz(rng, -6, 6), lo = rng.int(-8, 0), hi = rng.int(1, 9);
  // lo <= x + b <= hi   ->   lo-b <= x <= hi-b
  return {
    id: `gen.compound-ineq-v1.${idx}`, generated: true, concepts: ["compound-inequality"], difficulty: 2, context: "abstract",
    prompt: `Solve the compound inequality: $${lo} \\le x ${signed(b)} \\le ${hi}$`,
    steps: [{ instruction: "Subtract from all three parts to isolate $x$. Write your answer as $a \\le x \\le b$.", answer: `${lo - b} <= x <= ${hi - b}`, accept: [`${lo - b} \\le x \\le ${hi - b}`], hint: `Subtract ${b} from all three parts.` }],
    finalAnswer: { value: `${lo - b} <= x <= ${hi - b}`, unit: "" }, solutionNarrative: `Subtracting ${b} throughout gives $${lo - b} \\le x \\le ${hi - b}$.`,
  };
};

// --- Ratios, Proportions & Percent -------------------------------------------
const round2 = (x) => Math.round(x * 100) / 100;
const RATE_ITEMS = [["apples", "apple"], ["bottles", "bottle"], ["pens", "pen"], ["notebooks", "notebook"], ["bags", "bag"]];

generators["unit-rate-v1"] = (rng, idx) => {
  const q = rng.int(3, 12), per = rng.int(2, 9), total = q * per;
  const [plural, sing] = rng.pick(RATE_ITEMS);
  return {
    id: `gen.unit-rate-v1.${idx}`, generated: true, concepts: ["ratios-and-rates"], difficulty: 1, context: "applied",
    prompt: `${q} ${plural} cost \\$${total}. What is the unit price (dollars per ${sing})?`,
    steps: [{ instruction: `Divide the total cost by the number of ${plural}.`, answer: `${per}`, accept: [], hint: `\\$${total} divided by ${q}.` }],
    finalAnswer: { value: `${per}`, unit: `dollars per ${sing}` }, solutionNarrative: `\\$${total} / ${q} = \\$${per} per ${sing}.`,
  };
};
generators["proportion-v1"] = (rng, idx) => {
  const g = rng.int(2, 6), b = rng.int(2, 6), a = g * b, d = rng.int(2, 9), x = g * d;
  return {
    id: `gen.proportion-v1.${idx}`, generated: true, concepts: ["solve-proportion"], difficulty: 2, context: "abstract",
    prompt: `Solve the proportion: $\\frac{${a}}{${b}} = \\frac{x}{${d}}$`,
    steps: [{ instruction: "Cross-multiply and solve for $x$.", answer: `${x}`, accept: [`x=${x}`], hint: `$${a} \\times ${d} = ${b} \\times x$.` }],
    finalAnswer: { value: `${x}`, unit: "" }, solutionNarrative: `Cross-multiplying: $${b}x = ${a * d}$, so $x = ${x}$.`,
  };
};
generators["percent-of-v1"] = (rng, idx) => {
  const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80]), n = rng.int(2, 20) * 5;
  const val = round2(p * n / 100);
  return {
    id: `gen.percent-of-v1.${idx}`, generated: true, concepts: ["percent-of"], difficulty: 1, context: "abstract",
    prompt: `What is ${p}% of ${n}? (enter the number)`,
    steps: [{ instruction: `Multiply ${n} by ${p}% = ${p / 100}.`, answer: `${val}`, accept: [], hint: `${p}% means ${p} per 100.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `${p}% of ${n} = ${p / 100} × ${n} = ${val}.`,
  };
};
generators["percent-is-v1"] = (rng, idx) => {
  const whole = rng.int(2, 20) * 5, pct = rng.pick([5, 10, 20, 25, 40, 50, 60, 75]);
  const part = round2(pct * whole / 100);
  return {
    id: `gen.percent-is-v1.${idx}`, generated: true, concepts: ["percent-of"], difficulty: 2, context: "abstract",
    prompt: `${part} is what percent of ${whole}? (enter the percent as a number)`,
    steps: [{ instruction: "Compute (part / whole) × 100.", answer: `${pct}`, accept: [], hint: `$\\frac{${part}}{${whole}} \\times 100$.` }],
    finalAnswer: { value: `${pct}`, unit: "percent" }, solutionNarrative: `${part}/${whole} × 100 = ${pct}%.`,
  };
};
generators["tax-total-v1"] = (rng, idx) => {
  const price = rng.int(10, 200), rate = rng.pick([5, 6, 7, 8, 10]);
  const total = round2(price * (1 + rate / 100));
  return {
    id: `gen.tax-total-v1.${idx}`, generated: true, concepts: ["percent-change"], difficulty: 2, context: "applied",
    prompt: `A \\$${price} purchase has ${rate}% sales tax. What is the total cost? (nearest cent)`,
    steps: [{ instruction: `Add ${rate}% tax — multiply the price by ${round2(1 + rate / 100)}.`, answer: `${total}`, accept: [], hint: `Tax is ${rate}% of \\$${price}; add it on.` }],
    finalAnswer: { value: `${total}`, unit: "dollars" }, solutionNarrative: `\\$${price} × ${round2(1 + rate / 100)} = \\$${total}.`,
  };
};
generators["discount-v1"] = (rng, idx) => {
  const price = rng.int(20, 200), off = rng.pick([10, 15, 20, 25, 30, 40, 50]);
  const sale = round2(price * (1 - off / 100));
  return {
    id: `gen.discount-v1.${idx}`, generated: true, concepts: ["percent-change"], difficulty: 2, context: "applied",
    prompt: `A \\$${price} item is ${off}% off. What is the sale price? (nearest cent)`,
    steps: [{ instruction: `You pay ${100 - off}% — multiply by ${round2(1 - off / 100)}.`, answer: `${sale}`, accept: [], hint: `Discount is ${off}% of \\$${price}; subtract it.` }],
    finalAnswer: { value: `${sale}`, unit: "dollars" }, solutionNarrative: `\\$${price} × ${round2(1 - off / 100)} = \\$${sale}.`,
  };
};
generators["percent-change-v1"] = (rng, idx) => {
  const a = rng.int(1, 5) * 20, pct = rng.pick([5, 10, 15, 20, 25, 50]), up = rng.int(0, 1) === 0;
  const b = round2(a * (1 + (up ? 1 : -1) * pct / 100)), change = up ? pct : -pct;
  return {
    id: `gen.percent-change-v1.${idx}`, generated: true, concepts: ["percent-change"], difficulty: 3, context: "applied",
    prompt: `A value changed from ${a} to ${b}. What is the percent change? (negative for a decrease)`,
    steps: [{ instruction: "Compute (new − old) / old × 100.", answer: `${change}`, accept: [], hint: `$\\frac{${b} - ${a}}{${a}} \\times 100$.` }],
    finalAnswer: { value: `${change}`, unit: "percent" }, solutionNarrative: `(${b} − ${a})/${a} × 100 = ${change}%.`,
  };
};

// --- Exponents ---------------------------------------------------------------
generators["exp-product-v1"] = (rng, idx) => {
  const a = rng.int(2, 6), b = rng.int(2, 6);
  return {
    id: `gen.exp-product-v1.${idx}`, generated: true, concepts: ["product-and-quotient-rules"], difficulty: 1, context: "abstract",
    prompt: `Simplify (leave in exponent form): $x^${a} \\cdot x^${b}$`,
    steps: [{ instruction: "Add the exponents.", answer: `x^${a + b}`, accept: [], hint: `$x^a \\cdot x^b = x^{a+b}$.` }],
    finalAnswer: { value: `x^${a + b}`, unit: "" }, solutionNarrative: `$x^${a} \\cdot x^${b} = x^{${a + b}}$.`,
  };
};
generators["exp-quotient-v1"] = (rng, idx) => {
  const b = rng.int(2, 5), a = b + rng.int(2, 6);
  return {
    id: `gen.exp-quotient-v1.${idx}`, generated: true, concepts: ["product-and-quotient-rules"], difficulty: 2, context: "abstract",
    prompt: `Simplify: $\\dfrac{x^${a}}{x^${b}}$`,
    steps: [{ instruction: "Subtract the exponents.", answer: `x^${a - b}`, accept: [], hint: `$x^a / x^b = x^{a-b}$.` }],
    finalAnswer: { value: `x^${a - b}`, unit: "" }, solutionNarrative: `$x^{${a}-${b}} = x^${a - b}$.`,
  };
};
generators["exp-power-v1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(2, 4);
  return {
    id: `gen.exp-power-v1.${idx}`, generated: true, concepts: ["power-rules"], difficulty: 2, context: "abstract",
    prompt: `Simplify: $(x^${a})^${b}$`,
    steps: [{ instruction: "Multiply the exponents.", answer: `x^${a * b}`, accept: [], hint: `$(x^a)^b = x^{ab}$.` }],
    finalAnswer: { value: `x^${a * b}`, unit: "" }, solutionNarrative: `$(x^${a})^${b} = x^${a * b}$.`,
  };
};
generators["exp-power-coef-v1"] = (rng, idx) => {
  const k = rng.int(2, 4), a = rng.int(2, 4), n = rng.int(2, 3);
  return {
    id: `gen.exp-power-coef-v1.${idx}`, generated: true, concepts: ["power-rules"], difficulty: 2, context: "abstract",
    prompt: `Simplify: $(${k}x^${a})^${n}$`,
    steps: [{ instruction: "Raise the coefficient to the power and multiply the exponents.", answer: `${k ** n}x^${a * n}`, accept: [], hint: `$${k}^${n} = ${k ** n}$, and $x^{${a} \\cdot ${n}}$.` }],
    finalAnswer: { value: `${k ** n}x^${a * n}`, unit: "" }, solutionNarrative: `$(${k}x^${a})^${n} = ${k ** n}x^${a * n}$.`,
  };
};
generators["exp-numeric-v1"] = (rng, idx) => {
  const base = rng.int(2, 5), exp = rng.int(0, 3);
  const ans = exp === 0 ? "1" : `${base ** exp}`;
  return {
    id: `gen.exp-numeric-v1.${idx}`, generated: true, concepts: ["zero-and-negative-exponents"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $${base}^{${exp}}$`,
    steps: [{ instruction: "Evaluate the power.", answer: ans, accept: [], hint: exp === 0 ? "Anything (nonzero) to the power 0 is 1." : `Multiply ${base} by itself ${exp} times.` }],
    finalAnswer: { value: ans, unit: "" }, solutionNarrative: `$${base}^{${exp}} = ${ans}$.`,
  };
};
generators["exp-negative-v1"] = (rng, idx) => {
  const base = rng.int(2, 5), exp = rng.int(1, 3);
  const ans = frac(1, base ** exp);
  return {
    id: `gen.exp-negative-v1.${idx}`, generated: true, concepts: ["zero-and-negative-exponents"], difficulty: 2, context: "abstract",
    prompt: `Evaluate: $${base}^{-${exp}}$  (enter a fraction)`,
    steps: [{ instruction: "A negative exponent means take the reciprocal.", answer: ans, accept: [], hint: `$${base}^{-${exp}} = \\frac{1}{${base}^${exp}}$.` }],
    finalAnswer: { value: ans, unit: "" }, solutionNarrative: `$${base}^{-${exp}} = ${ans}$.`,
  };
};
generators["sci-eval-v1"] = (rng, idx) => {
  const a = rng.int(11, 99) / 10, n = rng.int(2, 7);
  const val = Math.round(a * Math.pow(10, n));
  return {
    id: `gen.sci-eval-v1.${idx}`, generated: true, concepts: ["scientific-notation"], difficulty: 2, context: "abstract",
    prompt: `Write as an ordinary number: $${a} \\times 10^${n}$`,
    steps: [{ instruction: `Move the decimal point ${n} places to the right.`, answer: `${val}`, accept: [], hint: `${a} × ${Math.pow(10, n)}.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${a} \\times 10^${n} = ${val}$.`,
  };
};

// --- Geometry: Lines & Angles ------------------------------------------------
const round1 = (x) => Math.round(x * 10) / 10;

generators["complement-supplement-v1"] = (rng, idx) => {
  const x = rng.int(10, 80), comp = rng.int(0, 1) === 0, base = comp ? 90 : 180;
  return {
    id: `gen.complement-supplement-v1.${idx}`, generated: true, concepts: ["angle-pairs"], difficulty: 1, context: "abstract",
    prompt: `Two angles are ${comp ? "complementary" : "supplementary"}. One measures $${x}°$. Find the other (degrees).`,
    steps: [{ instruction: `${comp ? "Complementary angles sum to 90°" : "Supplementary angles sum to 180°"} — subtract.`, answer: `${base - x}`, accept: [], hint: `${base} − ${x}.` }],
    finalAnswer: { value: `${base - x}`, unit: "degrees" }, solutionNarrative: `${base} − ${x} = ${base - x}°.`,
  };
};
generators["vertical-angle-v1"] = (rng, idx) => {
  const x = rng.int(20, 160);
  return {
    id: `gen.vertical-angle-v1.${idx}`, generated: true, concepts: ["angle-pairs"], difficulty: 1, context: "abstract",
    prompt: `Two lines cross; one of the four angles is $${x}°$. What is its vertical (opposite) angle?`,
    steps: [{ instruction: "Vertical angles are equal.", answer: `${x}`, accept: [], hint: "Opposite angles at an intersection are congruent." }],
    finalAnswer: { value: `${x}`, unit: "degrees" }, solutionNarrative: `Vertical angles are congruent, so it's $${x}°$.`,
  };
};
generators["transversal-v1"] = (rng, idx) => {
  const x = rng.int(40, 140);
  const [rel, ans] = rng.pick([["corresponding", x], ["alternate interior", x], ["alternate exterior", x], ["co-interior (same-side interior)", 180 - x]]);
  return {
    id: `gen.transversal-v1.${idx}`, generated: true, concepts: ["parallel-lines-transversal"], difficulty: 2, context: "abstract",
    prompt: `Two parallel lines are cut by a transversal; one angle is $${x}°$. Find its ${rel} angle (degrees).`,
    steps: [{ instruction: `Apply the ${rel} angle relationship.`, answer: `${ans}`, accept: [], hint: rel.startsWith("co-interior") ? "Same-side interior angles are supplementary (sum to 180°)." : "These angles are equal." }],
    finalAnswer: { value: `${ans}`, unit: "degrees" }, solutionNarrative: `The ${rel} angle is $${ans}°$.`,
  };
};
generators["angle-on-line-v1"] = (rng, idx) => {
  const a = rng.int(30, 80), b = rng.int(30, 80);
  return {
    id: `gen.angle-on-line-v1.${idx}`, generated: true, concepts: ["angle-arithmetic"], difficulty: 2, context: "abstract",
    prompt: `Three angles lie on a straight line; two measure $${a}°$ and $${b}°$. Find the third (degrees).`,
    steps: [{ instruction: "Angles on a straight line sum to 180°.", answer: `${180 - a - b}`, accept: [], hint: `180 − ${a} − ${b}.` }],
    finalAnswer: { value: `${180 - a - b}`, unit: "degrees" }, solutionNarrative: `180 − ${a} − ${b} = ${180 - a - b}°.`,
  };
};
generators["clock-angle-v1"] = (rng, idx) => {
  const h = rng.int(1, 6);
  return {
    id: `gen.clock-angle-v1.${idx}`, generated: true, concepts: ["angle-relationships-applied"], difficulty: 2, context: "applied",
    prompt: `On a clock at ${h}:00, what is the angle (degrees) between the hour and minute hands?`,
    steps: [{ instruction: "Each hour mark is 30° apart.", answer: `${30 * h}`, accept: [], hint: `${h} × 30°.` }],
    finalAnswer: { value: `${30 * h}`, unit: "degrees" }, solutionNarrative: `${h} × 30° = ${30 * h}°.`,
  };
};

// --- Geometry: Pythagorean Theorem -------------------------------------------
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [20, 21, 29], [10, 24, 26]];
generators["pyth-hypotenuse-v1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.pyth-hypotenuse-v1.${idx}`, generated: true, concepts: ["find-hypotenuse"], difficulty: 1, context: "abstract",
    prompt: `A right triangle has legs ${a} and ${b}. Find the hypotenuse.`,
    steps: [{ instruction: "Use $c = \\sqrt{a^2 + b^2}$.", answer: `${c}`, accept: [], hint: `$\\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}$.` }],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `$\\sqrt{${a * a + b * b}} = ${c}$.`,
  };
};
generators["pyth-leg-v1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.pyth-leg-v1.${idx}`, generated: true, concepts: ["find-leg"], difficulty: 2, context: "abstract",
    prompt: `A right triangle has hypotenuse ${c} and one leg ${a}. Find the other leg.`,
    steps: [{ instruction: "Use $b = \\sqrt{c^2 - a^2}$.", answer: `${b}`, accept: [], hint: `$\\sqrt{${c}^2 - ${a}^2} = \\sqrt{${c * c - a * a}}$.` }],
    finalAnswer: { value: `${b}`, unit: "" }, solutionNarrative: `$\\sqrt{${c * c - a * a}} = ${b}$.`,
  };
};
generators["pyth-distance-v1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  const x1 = rng.int(-3, 3), y1 = rng.int(-3, 3), x2 = x1 + a, y2 = y1 + b;
  return {
    id: `gen.pyth-distance-v1.${idx}`, generated: true, concepts: ["distance-between-points"], difficulty: 2, context: "abstract",
    prompt: `Find the distance between $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    steps: [{ instruction: "Use the distance formula $\\sqrt{(\\Delta x)^2 + (\\Delta y)^2}$.", answer: `${c}`, accept: [], hint: `$\\Delta x = ${a}$, $\\Delta y = ${b}$.` }],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `$\\sqrt{${a}^2 + ${b}^2} = ${c}$.`,
  };
};
generators["pyth-ladder-v1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.pyth-ladder-v1.${idx}`, generated: true, concepts: ["pythagorean-applications"], difficulty: 2, context: "applied",
    prompt: `A ${c} ft ladder leans on a wall, its base ${a} ft out. How high up the wall does it reach?`,
    steps: [{ instruction: "The wall height is the missing leg: $\\sqrt{c^2 - a^2}$.", answer: `${b}`, accept: [], hint: `$\\sqrt{${c}^2 - ${a}^2}$.` }],
    finalAnswer: { value: `${b}`, unit: "feet" }, solutionNarrative: `$\\sqrt{${c}^2 - ${a}^2} = ${b}$ ft.`,
  };
};

// --- Geometry: Perimeter & Area ----------------------------------------------
generators["rect-area-perim-v1"] = (rng, idx) => {
  const l = rng.int(3, 20), w = rng.int(2, l), wantArea = rng.int(0, 1) === 0;
  return {
    id: `gen.rect-area-perim-v1.${idx}`, generated: true, concepts: ["rectangle-square"], difficulty: 1, context: "applied",
    prompt: `A rectangle is ${l} ft by ${w} ft. Find its ${wantArea ? "area (sq ft)" : "perimeter (ft)"}.`,
    steps: [{ instruction: wantArea ? "Area = length × width." : "Perimeter = 2(length + width).", answer: `${wantArea ? l * w : 2 * (l + w)}`, accept: [], hint: wantArea ? `${l} × ${w}` : `2(${l} + ${w})` }],
    finalAnswer: { value: `${wantArea ? l * w : 2 * (l + w)}`, unit: wantArea ? "sq ft" : "ft" }, solutionNarrative: `${wantArea ? `${l} × ${w} = ${l * w}` : `2(${l} + ${w}) = ${2 * (l + w)}`}.`,
  };
};
generators["triangle-area-v1"] = (rng, idx) => {
  const b = rng.int(2, 20), h = rng.int(2, 18), area = round1(0.5 * b * h);
  return {
    id: `gen.triangle-area-v1.${idx}`, generated: true, concepts: ["triangle-parallelogram-trapezoid"], difficulty: 1, context: "abstract",
    prompt: `A triangle has base ${b} and height ${h}. Find its area.`,
    steps: [{ instruction: "Area = ½ × base × height.", answer: `${area}`, accept: [], hint: `0.5 × ${b} × ${h}.` }],
    finalAnswer: { value: `${area}`, unit: "" }, solutionNarrative: `½ × ${b} × ${h} = ${area}.`,
  };
};
generators["trapezoid-area-v1"] = (rng, idx) => {
  const b1 = rng.int(3, 12), b2 = rng.int(3, 12), h = rng.int(2, 12), area = round1(0.5 * (b1 + b2) * h);
  return {
    id: `gen.trapezoid-area-v1.${idx}`, generated: true, concepts: ["triangle-parallelogram-trapezoid"], difficulty: 2, context: "abstract",
    prompt: `A trapezoid has parallel sides ${b1} and ${b2} and height ${h}. Find its area.`,
    steps: [{ instruction: "Area = ½ × (b₁ + b₂) × height.", answer: `${area}`, accept: [], hint: `0.5 × (${b1} + ${b2}) × ${h}.` }],
    finalAnswer: { value: `${area}`, unit: "" }, solutionNarrative: `½ × (${b1} + ${b2}) × ${h} = ${area}.`,
  };
};
generators["circle-area-circ-v1"] = (rng, idx) => {
  const r = rng.int(2, 12), wantArea = rng.int(0, 1) === 0;
  const ans = wantArea ? round1(3.14 * r * r) : round1(2 * 3.14 * r);
  return {
    id: `gen.circle-area-circ-v1.${idx}`, generated: true, concepts: ["circle-circumference-area"], difficulty: 2, context: "abstract",
    prompt: `A circle has radius ${r}. Find its ${wantArea ? "area" : "circumference"}. (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: wantArea ? "Area = π r²." : "Circumference = 2π r.", answer: `${ans}`, accept: [], hint: wantArea ? `3.14 × ${r}²` : `2 × 3.14 × ${r}` }],
    finalAnswer: { value: `${ans}`, unit: "" }, solutionNarrative: wantArea ? `3.14 × ${r}² = ${ans}.` : `2 × 3.14 × ${r} = ${ans}.`,
  };
};
generators["fencing-cost-v1"] = (rng, idx) => {
  const l = rng.int(5, 30), w = rng.int(5, 30), price = rng.int(3, 15), perim = 2 * (l + w);
  return {
    id: `gen.fencing-cost-v1.${idx}`, generated: true, concepts: ["composite-and-applied"], difficulty: 2, context: "applied",
    prompt: `A ${l} ft by ${w} ft yard needs fencing at \\$${price} per foot. What is the total cost?`,
    steps: [{ instruction: "Cost = perimeter × price per foot.", answer: `${perim * price}`, accept: [], hint: `Perimeter = 2(${l} + ${w}) = ${perim} ft.` }],
    finalAnswer: { value: `${perim * price}`, unit: "dollars" }, solutionNarrative: `${perim} ft × \\$${price} = \\$${perim * price}.`,
  };
};

// --- Geometry: Triangles -----------------------------------------------------
generators["tri-angle-sum-v1"] = (rng, idx) => {
  const a = rng.int(30, 80), b = rng.int(30, 80);
  return {
    id: `gen.tri-angle-sum-v1.${idx}`, generated: true, concepts: ["angle-sum"], difficulty: 1, context: "abstract",
    prompt: `A triangle has two angles of $${a}°$ and $${b}°$. Find the third angle (degrees).`,
    steps: [{ instruction: "The interior angles of a triangle sum to 180°.", answer: `${180 - a - b}`, accept: [], hint: `180 − ${a} − ${b}.` }],
    finalAnswer: { value: `${180 - a - b}`, unit: "degrees" }, solutionNarrative: `180 − ${a} − ${b} = ${180 - a - b}°.`,
  };
};
generators["tri-exterior-v1"] = (rng, idx) => {
  const a = rng.int(30, 80), b = rng.int(30, 80);
  return {
    id: `gen.tri-exterior-v1.${idx}`, generated: true, concepts: ["angle-sum"], difficulty: 2, context: "abstract",
    prompt: `An exterior angle of a triangle equals the sum of the two remote interior angles. If those interior angles are $${a}°$ and $${b}°$, find the exterior angle (degrees).`,
    steps: [{ instruction: "Add the two remote interior angles.", answer: `${a + b}`, accept: [], hint: `${a} + ${b}.` }],
    finalAnswer: { value: `${a + b}`, unit: "degrees" }, solutionNarrative: `${a} + ${b} = ${a + b}°.`,
  };
};
generators["tri-classify-angles-v1"] = (rng, idx) => {
  const t = rng.pick(["right", "obtuse", "acute"]);
  let angles;
  if (t === "right") { const x = rng.int(25, 65); angles = [90, x, 90 - x]; }
  else if (t === "obtuse") { const o = rng.int(95, 140), a = rng.int(20, 180 - o - 15); angles = [o, a, 180 - o - a]; }
  else { const a = rng.int(55, 85), b = rng.int(55, 85); angles = [a, b, 180 - a - b]; }
  return {
    id: `gen.tri-classify-angles-v1.${idx}`, generated: true, concepts: ["triangle-types"], difficulty: 1, context: "abstract",
    prompt: `A triangle has angles $${angles[0]}°$, $${angles[1]}°$, and $${angles[2]}°$. Classify it as acute, right, or obtuse.`,
    steps: [{ instruction: "Look at the largest angle.", answer: t, accept: [`${t} triangle`], hint: "Largest angle = 90° is right, > 90° is obtuse, all < 90° is acute." }],
    finalAnswer: { value: t, unit: "" }, solutionNarrative: `The largest angle determines it: ${t}.`,
  };
};
generators["tri-classify-sides-v1"] = (rng, idx) => {
  const t = rng.pick(["equilateral", "isosceles", "scalene"]);
  let s;
  if (t === "equilateral") { const a = rng.int(3, 12); s = [a, a, a]; }
  else if (t === "isosceles") { const a = rng.int(5, 12); let b = rng.int(2, 2 * a - 1); if (b === a) b = a - 1; s = [a, a, b]; }
  else { s = rng.pick([[4, 5, 6], [5, 6, 7], [6, 7, 8], [7, 8, 10], [5, 7, 9], [6, 8, 9]]); }
  return {
    id: `gen.tri-classify-sides-v1.${idx}`, generated: true, concepts: ["triangle-types"], difficulty: 2, context: "abstract",
    prompt: `A triangle has sides ${s[0]}, ${s[1]}, and ${s[2]}. Classify it as equilateral, isosceles, or scalene.`,
    steps: [{ instruction: "Count how many sides are equal.", answer: t, accept: [`${t} triangle`], hint: "All three equal = equilateral; exactly two equal = isosceles; none equal = scalene." }],
    finalAnswer: { value: t, unit: "" }, solutionNarrative: `By its equal sides it is ${t}.`,
  };
};
generators["tri-inequality-v1"] = (rng, idx) => {
  const sides = [rng.int(2, 12), rng.int(2, 12), rng.int(2, 14)].sort((x, y) => x - y);
  const can = sides[0] + sides[1] > sides[2];
  return {
    id: `gen.tri-inequality-v1.${idx}`, generated: true, concepts: ["triangle-inequality"], difficulty: 1, context: "abstract",
    prompt: `Can segments of length ${sides[0]}, ${sides[1]}, and ${sides[2]} form a triangle? (yes or no)`,
    steps: [{ instruction: "Check whether the two shortest sides sum to more than the longest.", answer: can ? "yes" : "no", accept: [], hint: `Is ${sides[0]} + ${sides[1]} > ${sides[2]}?` }],
    finalAnswer: { value: can ? "yes" : "no", unit: "" }, solutionNarrative: `${sides[0]} + ${sides[1]} = ${sides[0] + sides[1]}, which is ${can ? "greater than" : "not greater than"} ${sides[2]}, so ${can ? "yes" : "no"}.`,
  };
};
generators["tri-perimeter-v1"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.tri-perimeter-v1.${idx}`, generated: true, concepts: ["perimeter-and-basic-area"], difficulty: 1, context: "applied",
    prompt: `A triangular garden has sides ${a} ft, ${b} ft, and ${c} ft. What is its perimeter?`,
    steps: [{ instruction: "Add the three side lengths.", answer: `${a + b + c}`, accept: [], hint: `${a} + ${b} + ${c}.` }],
    finalAnswer: { value: `${a + b + c}`, unit: "feet" }, solutionNarrative: `${a} + ${b} + ${c} = ${a + b + c} ft.`,
  };
};
generators["tri-area-basic-v1"] = (rng, idx) => {
  const b = rng.int(3, 20), h = rng.int(2, 16), area = round1(0.5 * b * h);
  return {
    id: `gen.tri-area-basic-v1.${idx}`, generated: true, concepts: ["perimeter-and-basic-area"], difficulty: 2, context: "abstract",
    prompt: `A triangle has base ${b} and height ${h}. Find its area.`,
    steps: [{ instruction: "Area = ½ × base × height.", answer: `${area}`, accept: [], hint: `0.5 × ${b} × ${h}.` }],
    finalAnswer: { value: `${area}`, unit: "" }, solutionNarrative: `½ × ${b} × ${h} = ${area}.`,
  };
};

// --- Geometry: Right-Triangle Trigonometry -----------------------------------
const d2r = (deg) => (deg * Math.PI) / 180;
const RIGHT_TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
generators["trig-ratio-v1"] = (rng, idx) => {
  const [o, a, h] = rng.pick(RIGHT_TRIPLES);
  const [name, num, den, lbl] = rng.pick([["sine", o, h, "opposite/hypotenuse"], ["cosine", a, h, "adjacent/hypotenuse"], ["tangent", o, a, "opposite/adjacent"]]);
  return {
    id: `gen.trig-ratio-v1.${idx}`, generated: true, concepts: ["trig-ratios"], difficulty: 1, context: "abstract",
    prompt: `In a right triangle, the side opposite angle $\\theta$ is ${o}, the adjacent side is ${a}, and the hypotenuse is ${h}. Find $\\${name === "sine" ? "sin" : name === "cosine" ? "cos" : "tan"}\\theta$ as a fraction.`,
    steps: [{ instruction: `${name[0].toUpperCase() + name.slice(1)} = ${lbl}.`, answer: frac(num, den), accept: [`${num}/${den}`], hint: `$\\frac{${num}}{${den}}$, then reduce if possible.` }],
    finalAnswer: { value: frac(num, den), unit: "" }, solutionNarrative: `${lbl} = $\\frac{${num}}{${den}} = ${frac(num, den)}$.`,
  };
};
generators["trig-find-side-v1"] = (rng, idx) => {
  const theta = rng.int(20, 70), H = rng.int(8, 30);
  const opp = round1(H * Math.sin(d2r(theta)));
  return {
    id: `gen.trig-find-side-v1.${idx}`, generated: true, concepts: ["find-missing-side"], difficulty: 2, context: "abstract",
    prompt: `A right triangle has hypotenuse ${H} and an angle of $${theta}°$. Find the side opposite that angle. (Round to 1 decimal place.)`,
    steps: [{ instruction: "opposite = hypotenuse × sin(angle).", answer: `${opp}`, accept: [], hint: `${H} × sin(${theta}°).` }],
    finalAnswer: { value: `${opp}`, unit: "" }, solutionNarrative: `${H} × sin(${theta}°) ≈ ${opp}.`,
  };
};
generators["trig-find-angle-v1"] = (rng, idx) => {
  const opp = rng.int(2, 12), adj = rng.int(2, 12);
  const ang = Math.round((Math.atan(opp / adj) * 180) / Math.PI);
  return {
    id: `gen.trig-find-angle-v1.${idx}`, generated: true, concepts: ["find-missing-angle"], difficulty: 3, context: "abstract",
    prompt: `A right triangle has the side opposite angle $\\theta$ equal to ${opp} and the adjacent side equal to ${adj}. Find $\\theta$. (Round to the nearest degree.)`,
    steps: [{ instruction: "θ = arctan(opposite / adjacent).", answer: `${ang}`, accept: [], hint: `$\\tan^{-1}(${opp}/${adj})$ in degrees.` }],
    finalAnswer: { value: `${ang}`, unit: "degrees" }, solutionNarrative: `$\\tan^{-1}(${opp}/${adj}) ≈ ${ang}°$.`,
  };
};
generators["trig-elevation-v1"] = (rng, idx) => {
  const theta = rng.int(20, 60), d = rng.int(10, 60);
  const height = round1(d * Math.tan(d2r(theta)));
  return {
    id: `gen.trig-elevation-v1.${idx}`, generated: true, concepts: ["angles-of-elevation-depression"], difficulty: 2, context: "applied",
    prompt: `From ${d} ft away, the angle of elevation to the top of a tree is $${theta}°$. How tall is the tree? (Round to 1 decimal place.)`,
    steps: [{ instruction: "height = distance × tan(angle of elevation).", answer: `${height}`, accept: [], hint: `${d} × tan(${theta}°).` }],
    finalAnswer: { value: `${height}`, unit: "feet" }, solutionNarrative: `${d} × tan(${theta}°) ≈ ${height} ft.`,
  };
};

// --- Geometry: Surface Area & Volume -----------------------------------------
generators["box-volume-v1"] = (rng, idx) => {
  const l = rng.int(2, 12), w = rng.int(2, 12), h = rng.int(2, 12);
  return {
    id: `gen.box-volume-v1.${idx}`, generated: true, concepts: ["volume-prisms"], difficulty: 1, context: "applied",
    prompt: `A box is ${l} by ${w} by ${h}. Find its volume.`,
    steps: [{ instruction: "Volume = length × width × height.", answer: `${l * w * h}`, accept: [], hint: `${l} × ${w} × ${h}.` }],
    finalAnswer: { value: `${l * w * h}`, unit: "cubic units" }, solutionNarrative: `${l} × ${w} × ${h} = ${l * w * h}.`,
  };
};
generators["cylinder-volume-v1"] = (rng, idx) => {
  const r = rng.int(2, 10), h = rng.int(2, 15), v = round1(3.14 * r * r * h);
  return {
    id: `gen.cylinder-volume-v1.${idx}`, generated: true, concepts: ["volume-cylinders-cones-spheres"], difficulty: 2, context: "applied",
    prompt: `A cylinder has radius ${r} and height ${h}. Find its volume. (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "Volume = π r² h.", answer: `${v}`, accept: [], hint: `3.14 × ${r}² × ${h}.` }],
    finalAnswer: { value: `${v}`, unit: "cubic units" }, solutionNarrative: `3.14 × ${r}² × ${h} ≈ ${v}.`,
  };
};
generators["cone-sphere-volume-v1"] = (rng, idx) => {
  if (rng.int(0, 1) === 0) {
    const r = rng.int(2, 9), h = rng.int(3, 15), v = round1((1 / 3) * 3.14 * r * r * h);
    return {
      id: `gen.cone-sphere-volume-v1.${idx}`, generated: true, concepts: ["volume-cylinders-cones-spheres"], difficulty: 3, context: "applied",
      prompt: `A cone has radius ${r} and height ${h}. Find its volume. (π ≈ 3.14, round to 1 decimal.)`,
      steps: [{ instruction: "Volume = ⅓ π r² h.", answer: `${v}`, accept: [], hint: `(1/3) × 3.14 × ${r}² × ${h}.` }],
      finalAnswer: { value: `${v}`, unit: "cubic units" }, solutionNarrative: `⅓ × 3.14 × ${r}² × ${h} ≈ ${v}.`,
    };
  }
  const r = rng.int(2, 8), v = round1((4 / 3) * 3.14 * r * r * r);
  return {
    id: `gen.cone-sphere-volume-v1.${idx}`, generated: true, concepts: ["volume-cylinders-cones-spheres"], difficulty: 3, context: "applied",
    prompt: `A sphere has radius ${r}. Find its volume. (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "Volume = (4/3) π r³.", answer: `${v}`, accept: [], hint: `(4/3) × 3.14 × ${r}³.` }],
    finalAnswer: { value: `${v}`, unit: "cubic units" }, solutionNarrative: `(4/3) × 3.14 × ${r}³ ≈ ${v}.`,
  };
};
generators["box-surface-v1"] = (rng, idx) => {
  const l = rng.int(2, 12), w = rng.int(2, 12), h = rng.int(2, 12);
  const sa = 2 * (l * w + l * h + w * h);
  return {
    id: `gen.box-surface-v1.${idx}`, generated: true, concepts: ["surface-area"], difficulty: 2, context: "abstract",
    prompt: `A rectangular box is ${l} by ${w} by ${h}. Find its surface area.`,
    steps: [{ instruction: "Surface area = 2(lw + lh + wh).", answer: `${sa}`, accept: [], hint: `2(${l}×${w} + ${l}×${h} + ${w}×${h}).` }],
    finalAnswer: { value: `${sa}`, unit: "square units" }, solutionNarrative: `2(${l * w} + ${l * h} + ${w * h}) = ${sa}.`,
  };
};
generators["cylinder-surface-v1"] = (rng, idx) => {
  const r = rng.int(2, 9), h = rng.int(2, 14), sa = round1(2 * 3.14 * r * r + 2 * 3.14 * r * h);
  return {
    id: `gen.cylinder-surface-v1.${idx}`, generated: true, concepts: ["surface-area"], difficulty: 3, context: "abstract",
    prompt: `A cylinder has radius ${r} and height ${h}. Find its total surface area. (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "Surface area = 2π r² + 2π r h.", answer: `${sa}`, accept: [], hint: `2×3.14×${r}² + 2×3.14×${r}×${h}.` }],
    finalAnswer: { value: `${sa}`, unit: "square units" }, solutionNarrative: `2π r² + 2π r h ≈ ${sa}.`,
  };
};
generators["tank-fill-v1"] = (rng, idx) => {
  const l = rng.int(2, 8), w = rng.int(2, 8), h = rng.int(2, 8), gal = round1(l * w * h * 7.48);
  return {
    id: `gen.tank-fill-v1.${idx}`, generated: true, concepts: ["volume-applied"], difficulty: 2, context: "applied",
    prompt: `A rectangular tank is ${l} ft by ${w} ft by ${h} ft. How many gallons does it hold? (1 cubic foot ≈ 7.48 gallons; round to 1 decimal.)`,
    steps: [
      { instruction: "First find the volume in cubic feet.", answer: `${l * w * h}`, accept: [], hint: `${l} × ${w} × ${h}.` },
      { instruction: "Multiply the cubic feet by 7.48 gallons.", answer: `${gal}`, accept: [], hint: `${l * w * h} × 7.48.` },
    ],
    finalAnswer: { value: `${gal}`, unit: "gallons" }, solutionNarrative: `${l * w * h} ft³ × 7.48 ≈ ${gal} gallons.`,
  };
};

// --- Algebra 2: Functions ----------------------------------------------------
generators["func-eval-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 5), c = nz(rng, -6, 6), v = rng.int(-4, 5);
  const val = a * v * v + b * v + c;
  return {
    id: `gen.func-eval-v1.${idx}`, generated: true, concepts: ["function-notation"], difficulty: 1, context: "abstract",
    prompt: `If $f(x) = ${cf(a)}x^2 ${signed(b)}x ${signed(c)}$, find $f(${v})$.`,
    steps: [{ instruction: `Substitute $x = ${v}$.`, answer: `${val}`, accept: [], hint: `${a}(${v})² ${signed(b)}(${v}) ${signed(c)}.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$f(${v}) = ${val}$.`,
  };
};
generators["func-compose-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 5), c = rng.int(1, 4), d = nz(rng, -5, 5);
  // f(x)=ax+b, g(x)=cx+d, f(g(x)) = a c x + (a d + b)
  return {
    id: `gen.func-compose-v1.${idx}`, generated: true, concepts: ["composition"], difficulty: 2, context: "abstract",
    prompt: `Given $f(x) = ${a}x ${signed(b)}$ and $g(x) = ${c}x ${signed(d)}$, find $f(g(x))$ (simplified).`,
    steps: [{ instruction: "Substitute $g(x)$ into $f$ and simplify.", answer: `${a * c}x ${signed(a * d + b)}`, accept: [], hint: `$f(g(x)) = ${a}(${c}x ${signed(d)}) ${signed(b)}$.` }],
    finalAnswer: { value: `${a * c}x ${signed(a * d + b)}`, unit: "" }, solutionNarrative: `$f(g(x)) = ${a * c}x ${signed(a * d + b)}$.`,
  };
};
generators["func-inverse-v1"] = (rng, idx) => {
  const a = rng.int(2, 6), b = nz(rng, -8, 8);
  return {
    id: `gen.func-inverse-v1.${idx}`, generated: true, concepts: ["inverse-functions"], difficulty: 2, context: "abstract",
    prompt: `Find the inverse of $f(x) = ${a}x ${signed(b)}$. Write it as an expression in $x$.`,
    steps: [{ instruction: "Swap $x$ and $y$ and solve for $y$.", answer: `(x ${signed(-b)})/${a}`, accept: [], hint: `From $x = ${a}y ${signed(b)}$, solve for $y$.` }],
    finalAnswer: { value: `(x ${signed(-b)})/${a}`, unit: "" }, solutionNarrative: `$f^{-1}(x) = \\frac{x ${signed(-b)}}{${a}}$.`,
  };
};
generators["func-domain-v1"] = (rng, idx) => {
  const k = nz(rng, -6, 6);
  return {
    id: `gen.func-domain-v1.${idx}`, generated: true, concepts: ["domain-and-range"], difficulty: 1, context: "abstract",
    prompt: `What is the domain of $f(x) = \\sqrt{x ${signed(-k)}}$? Write it as an inequality.`,
    steps: [{ instruction: "The expression under the square root must be ≥ 0.", answer: `x >= ${k}`, accept: [`${k} <= x`], hint: `Set $x ${signed(-k)} \\ge 0$.` }],
    finalAnswer: { value: `x >= ${k}`, unit: "" }, solutionNarrative: `Need $x ${signed(-k)} \\ge 0$, so $x \\ge ${k}$.`,
  };
};

// --- Algebra 2: Radicals (uses the grader's radical numeric evaluation) -------
generators["root-eval-v1"] = (rng, idx) => {
  const k = rng.int(2, 15);
  return {
    id: `gen.root-eval-v1.${idx}`, generated: true, concepts: ["evaluate-roots"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $\\sqrt{${k * k}}$`,
    steps: [{ instruction: "What number squared gives the radicand?", answer: `${k}`, accept: [], hint: `${k}² = ${k * k}.` }],
    finalAnswer: { value: `${k}`, unit: "" }, solutionNarrative: `$\\sqrt{${k * k}} = ${k}$.`,
  };
};
generators["simplify-radical-v1"] = (rng, idx) => {
  const a = rng.int(2, 6), b = rng.pick([2, 3, 5, 6, 7, 10]), n = a * a * b;
  return {
    id: `gen.simplify-radical-v1.${idx}`, generated: true, concepts: ["simplify-radicals"], difficulty: 2, context: "abstract",
    prompt: `Simplify the radical: $\\sqrt{${n}}$`,
    steps: [{ instruction: "Pull out the largest perfect-square factor. Write as $a\\sqrt{b}$.", answer: `${a}\\sqrt{${b}}`, accept: [`${a}sqrt(${b})`, `sqrt(${n})`], hint: `$${n} = ${a * a} \\times ${b}$, and $\\sqrt{${a * a}} = ${a}$.` }],
    finalAnswer: { value: `${a}\\sqrt{${b}}`, unit: "" }, solutionNarrative: `$\\sqrt{${n}} = ${a}\\sqrt{${b}}$.`,
  };
};
generators["solve-radical-eq-v1"] = (rng, idx) => {
  const k = rng.int(2, 9), c = nz(rng, -8, 8), x = k * k + c;
  return {
    id: `gen.solve-radical-eq-v1.${idx}`, generated: true, concepts: ["solve-radical-equations"], difficulty: 2, context: "abstract",
    prompt: `Solve: $\\sqrt{x ${signed(-c)}} = ${k}$`,
    steps: [{ instruction: "Square both sides, then solve for $x$.", answer: `${x}`, accept: [`x=${x}`], hint: `$x ${signed(-c)} = ${k}^2 = ${k * k}$.` }],
    finalAnswer: { value: `${x}`, unit: "" }, solutionNarrative: `Squaring gives $x ${signed(-c)} = ${k * k}$, so $x = ${x}$.`,
  };
};
generators["radical-area-v1"] = (rng, idx) => {
  const s = rng.int(3, 20);
  return {
    id: `gen.radical-area-v1.${idx}`, generated: true, concepts: ["radical-applications"], difficulty: 1, context: "applied",
    prompt: `A square garden has area ${s * s} sq ft. How long is each side?`,
    steps: [{ instruction: "Side length = √(area).", answer: `${s}`, accept: [], hint: `$\\sqrt{${s * s}}$.` }],
    finalAnswer: { value: `${s}`, unit: "feet" }, solutionNarrative: `$\\sqrt{${s * s}} = ${s}$ ft.`,
  };
};

// --- Algebra 2: Rational Expressions -----------------------------------------
generators["excluded-value-v1"] = (rng, idx) => {
  const c = nz(rng, -9, 9), a = rng.int(1, 5), b = nz(rng, -6, 6);
  return {
    id: `gen.excluded-value-v1.${idx}`, generated: true, concepts: ["excluded-values"], difficulty: 1, context: "abstract",
    prompt: `For what value of $x$ is $\\dfrac{${a}x ${signed(b)}}{x ${signed(-c)}}$ undefined?`,
    steps: [{ instruction: "The expression is undefined where the denominator is zero.", answer: `${c}`, accept: [`x=${c}`], hint: `Set $x ${signed(-c)} = 0$.` }],
    finalAnswer: { value: `${c}`, unit: "" }, solutionNarrative: `The denominator is 0 when $x = ${c}$.`,
  };
};
generators["eval-rational-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = nz(rng, -6, 6), d = nz(rng, -5, 5), v = rng.int(-4, 6);
  const den = v + d;
  if (den === 0) return generators["eval-rational-v1"](rng, idx + 1); // avoid /0
  const num = a * v + b, val = round2(num / den);
  return {
    id: `gen.eval-rational-v1.${idx}`, generated: true, concepts: ["evaluate-rational"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\dfrac{${a}x ${signed(b)}}{x ${signed(d)}}$ at $x = ${v}$. (Round to 2 decimals if needed.)`,
    steps: [{ instruction: `Substitute $x = ${v}$ into numerator and denominator.`, answer: `${val}`, accept: [], hint: `$\\frac{${num}}{${den}}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$\\frac{${num}}{${den}} = ${val}$.`,
  };
};
generators["solve-rational-eq-v1"] = (rng, idx) => {
  const x = rng.int(2, 12), q = rng.int(2, 6), p = q * x; // p/x = q  ->  x = p/q
  return {
    id: `gen.solve-rational-eq-v1.${idx}`, generated: true, concepts: ["solve-rational-equations"], difficulty: 2, context: "abstract",
    prompt: `Solve: $\\dfrac{${p}}{x} = ${q}$`,
    steps: [{ instruction: "Multiply both sides by $x$, then solve.", answer: `${x}`, accept: [`x=${x}`], hint: `$${p} = ${q}x$, so $x = ${p}/${q}$.` }],
    finalAnswer: { value: `${x}`, unit: "" }, solutionNarrative: `$${p} = ${q}x$, so $x = ${x}$.`,
  };
};

// --- Algebra 2: Exponential Functions ----------------------------------------
generators["exp-fn-eval-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = rng.int(2, 4), x = rng.int(0, 4);
  return {
    id: `gen.exp-fn-eval-v1.${idx}`, generated: true, concepts: ["evaluate-exponential"], difficulty: 1, context: "abstract",
    prompt: `If $f(x) = ${a} \\cdot ${b}^x$, find $f(${x})$.`,
    steps: [{ instruction: `Compute $${b}^${x}$, then multiply by ${a}.`, answer: `${a * b ** x}`, accept: [], hint: `$${b}^${x} = ${b ** x}$.` }],
    finalAnswer: { value: `${a * b ** x}`, unit: "" }, solutionNarrative: `$${a} \\cdot ${b ** x} = ${a * b ** x}$.`,
  };
};
generators["exp-doubling-v1"] = (rng, idx) => {
  const P = rng.int(1, 9) * 100, D = rng.pick([2, 3, 4, 5]), periods = rng.int(1, 4), T = D * periods;
  return {
    id: `gen.exp-doubling-v1.${idx}`, generated: true, concepts: ["growth-and-decay"], difficulty: 2, context: "applied",
    prompt: `A population starts at ${P} and doubles every ${D} years. What is the population after ${T} years?`,
    steps: [{ instruction: `It doubles ${periods} times. Multiply ${P} by $2^${periods}$.`, answer: `${P * 2 ** periods}`, accept: [], hint: `${T} ÷ ${D} = ${periods} doublings.` }],
    finalAnswer: { value: `${P * 2 ** periods}`, unit: "" }, solutionNarrative: `$${P} \\times 2^${periods} = ${P * 2 ** periods}$.`,
  };
};
generators["compound-interest-v1"] = (rng, idx) => {
  const P = rng.int(1, 9) * 1000, r = rng.pick([2, 3, 4, 5]), t = rng.int(2, 6);
  const A = round2(P * Math.pow(1 + r / 100, t));
  return {
    id: `gen.compound-interest-v1.${idx}`, generated: true, concepts: ["compound-interest"], difficulty: 2, context: "applied",
    prompt: `\\$${P} is invested at ${r}% interest compounded annually. What is the balance after ${t} years? (nearest cent)`,
    steps: [{ instruction: `Use $A = P(1 + r)^t$ with $r = ${r / 100}$.`, answer: `${A}`, accept: [], hint: `$${P}(1 + ${r / 100})^{${t}}$.` }],
    finalAnswer: { value: `${A}`, unit: "dollars" }, solutionNarrative: `$${P}(1.0${r})^{${t}} ≈ ${A}$.`,
  };
};
generators["exp-equation-v1"] = (rng, idx) => {
  const b = rng.int(2, 5), k = rng.int(2, 5);
  return {
    id: `gen.exp-equation-v1.${idx}`, generated: true, concepts: ["exponential-equations"], difficulty: 1, context: "abstract",
    prompt: `Solve for $x$: $${b}^x = ${b ** k}$`,
    steps: [{ instruction: "Write the right side as a power of the same base, then match exponents.", answer: `${k}`, accept: [`x=${k}`], hint: `$${b ** k} = ${b}^{?}$.` }],
    finalAnswer: { value: `${k}`, unit: "" }, solutionNarrative: `$${b ** k} = ${b}^${k}$, so $x = ${k}$.`,
  };
};

// --- Algebra 2: Logarithms ---------------------------------------------------
generators["log-eval-v1"] = (rng, idx) => {
  const b = rng.int(2, 5), k = rng.int(1, 4);
  return {
    id: `gen.log-eval-v1.${idx}`, generated: true, concepts: ["log-definition"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $\\log_{${b}}(${b ** k})$`,
    steps: [{ instruction: `Ask: ${b} to what power gives ${b ** k}?`, answer: `${k}`, accept: [], hint: `$${b}^? = ${b ** k}$.` }],
    finalAnswer: { value: `${k}`, unit: "" }, solutionNarrative: `$${b}^${k} = ${b ** k}$, so the log is ${k}.`,
  };
};
generators["log-convert-v1"] = (rng, idx) => {
  const b = rng.int(2, 6), k = rng.int(2, 4);
  return {
    id: `gen.log-convert-v1.${idx}`, generated: true, concepts: ["log-definition"], difficulty: 1, context: "abstract",
    prompt: `Rewrite in logarithmic form and find the value: since $${b}^${k} = ${b ** k}$, what is $\\log_{${b}}(${b ** k})$?`,
    steps: [{ instruction: "The exponent is the logarithm.", answer: `${k}`, accept: [], hint: `$\\log_${b}(${b ** k}) = ${k}$.` }],
    finalAnswer: { value: `${k}`, unit: "" }, solutionNarrative: `$\\log_${b}(${b ** k}) = ${k}$.`,
  };
};
generators["log-property-v1"] = (rng, idx) => {
  const m = rng.int(1, 6), n = rng.int(1, 6);
  return {
    id: `gen.log-property-v1.${idx}`, generated: true, concepts: ["log-properties"], difficulty: 2, context: "abstract",
    prompt: `Given $\\log_b M = ${m}$ and $\\log_b N = ${n}$, find $\\log_b(MN)$.`,
    steps: [{ instruction: "The log of a product is the sum of the logs.", answer: `${m + n}`, accept: [], hint: `$\\log_b(MN) = \\log_b M + \\log_b N$.` }],
    finalAnswer: { value: `${m + n}`, unit: "" }, solutionNarrative: `$${m} + ${n} = ${m + n}$.`,
  };
};
generators["log-solve-v1"] = (rng, idx) => {
  const b = rng.int(2, 5), k = rng.int(2, 4);
  return {
    id: `gen.log-solve-v1.${idx}`, generated: true, concepts: ["solve-with-logs"], difficulty: 2, context: "abstract",
    prompt: `Solve for $x$: $\\log_{${b}}(x) = ${k}$`,
    steps: [{ instruction: "Rewrite in exponential form.", answer: `${b ** k}`, accept: [`x=${b ** k}`], hint: `$x = ${b}^${k}$.` }],
    finalAnswer: { value: `${b ** k}`, unit: "" }, solutionNarrative: `$x = ${b}^${k} = ${b ** k}$.`,
  };
};

// --- Algebra 2: Sequences & Series -------------------------------------------
generators["arith-term-v1"] = (rng, idx) => {
  const a1 = nz(rng, -8, 12), d = nz(rng, -6, 7), n = rng.int(5, 20), an = a1 + (n - 1) * d;
  return {
    id: `gen.arith-term-v1.${idx}`, generated: true, concepts: ["arithmetic-sequences"], difficulty: 1, context: "abstract",
    prompt: `An arithmetic sequence has first term ${a1} and common difference ${d}. Find the ${n}th term.`,
    steps: [{ instruction: "Use $a_n = a_1 + (n-1)d$.", answer: `${an}`, accept: [], hint: `${a1} + (${n} − 1)(${d}).` }],
    finalAnswer: { value: `${an}`, unit: "" }, solutionNarrative: `$${a1} + ${n - 1}(${d}) = ${an}$.`,
  };
};
generators["geom-term-v1"] = (rng, idx) => {
  const a1 = rng.int(1, 6), r = rng.int(2, 3), n = rng.int(3, 7), an = a1 * r ** (n - 1);
  return {
    id: `gen.geom-term-v1.${idx}`, generated: true, concepts: ["geometric-sequences"], difficulty: 2, context: "abstract",
    prompt: `A geometric sequence has first term ${a1} and common ratio ${r}. Find the ${n}th term.`,
    steps: [{ instruction: "Use $a_n = a_1 \\cdot r^{n-1}$.", answer: `${an}`, accept: [], hint: `${a1} × ${r}^${n - 1}.` }],
    finalAnswer: { value: `${an}`, unit: "" }, solutionNarrative: `$${a1} \\cdot ${r}^${n - 1} = ${an}$.`,
  };
};
generators["arith-sum-v1"] = (rng, idx) => {
  const a1 = rng.int(1, 10), d = rng.int(1, 6), n = rng.int(4, 12), an = a1 + (n - 1) * d, sum = n * (a1 + an) / 2;
  return {
    id: `gen.arith-sum-v1.${idx}`, generated: true, concepts: ["arithmetic-series"], difficulty: 2, context: "abstract",
    prompt: `Find the sum of the first ${n} terms of an arithmetic series with first term ${a1} and common difference ${d}.`,
    steps: [{ instruction: "Find the last term, then use $S_n = \\frac{n}{2}(a_1 + a_n)$.", answer: `${sum}`, accept: [], hint: `$a_${n} = ${an}$; sum $= \\frac{${n}}{2}(${a1} + ${an})$.` }],
    finalAnswer: { value: `${sum}`, unit: "" }, solutionNarrative: `$\\frac{${n}}{2}(${a1} + ${an}) = ${sum}$.`,
  };
};
generators["geom-inf-sum-v1"] = (rng, idx) => {
  const a1 = rng.int(2, 12) * 2, denom = rng.pick([2, 3, 4]); // r = 1/denom, |r| < 1
  const sum = round2(a1 / (1 - 1 / denom));
  return {
    id: `gen.geom-inf-sum-v1.${idx}`, generated: true, concepts: ["geometric-series"], difficulty: 2, context: "abstract",
    prompt: `Find the sum of the infinite geometric series with first term ${a1} and ratio $r = \\frac{1}{${denom}}$.`,
    steps: [{ instruction: "Since $|r| < 1$, use $S = \\dfrac{a_1}{1 - r}$.", answer: `${sum}`, accept: [], hint: `$\\frac{${a1}}{1 - \\frac{1}{${denom}}}$.` }],
    finalAnswer: { value: `${sum}`, unit: "" }, solutionNarrative: `$S = \\frac{${a1}}{1 - 1/${denom}} = ${sum}$.`,
  };
};

// --- Calculus 1: Limits & Continuity -----------------------------------------
generators["limit-sub-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 5), c = nz(rng, -6, 6), x = rng.int(-3, 4);
  const val = a * x * x + b * x + c;
  return {
    id: `gen.limit-sub-v1.${idx}`, generated: true, concepts: ["evaluate-limits"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $\\displaystyle\\lim_{x \\to ${x}} (${cf(a)}x^2 ${signed(b)}x ${signed(c)})$`,
    steps: [{ instruction: "The function is continuous, so substitute directly.", answer: `${val}`, accept: [], hint: `Plug in $x = ${x}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `Direct substitution gives ${val}.`,
  };
};
generators["limit-factor-v1"] = (rng, idx) => {
  const r = nz(rng, -5, 5), s = nz(rng, -5, 5);
  return {
    id: `gen.limit-factor-v1.${idx}`, generated: true, concepts: ["evaluate-limits"], difficulty: 2, context: "abstract",
    prompt: `Evaluate: $\\displaystyle\\lim_{x \\to ${r}} \\frac{(x ${signed(-r)})(x ${signed(-s)})}{x ${signed(-r)}}$`,
    steps: [{ instruction: "Cancel the common factor, then substitute.", answer: `${r - s}`, accept: [], hint: `It simplifies to $x ${signed(-s)}$; evaluate at $x = ${r}$.` }],
    finalAnswer: { value: `${r - s}`, unit: "" }, solutionNarrative: `Cancelling gives $x ${signed(-s)}$; at $x=${r}$ that's ${r - s}.`,
  };
};
generators["limit-infinity-v1"] = (rng, idx) => {
  const a = rng.int(1, 6), b = rng.int(1, 6), b2 = nz(rng, -5, 5), c2 = nz(rng, -5, 5);
  return {
    id: `gen.limit-infinity-v1.${idx}`, generated: true, concepts: ["one-sided-and-infinite"], difficulty: 2, context: "abstract",
    prompt: `Evaluate: $\\displaystyle\\lim_{x \\to \\infty} \\frac{${a}x^2 ${signed(b2)}x}{${b}x^2 ${signed(c2)}}$`,
    steps: [{ instruction: "Same degree top and bottom — take the ratio of leading coefficients.", answer: frac(a, b), accept: [`${a}/${b}`], hint: `$\\frac{${a}}{${b}}$.` }],
    finalAnswer: { value: frac(a, b), unit: "" }, solutionNarrative: `Ratio of leading coefficients: $\\frac{${a}}{${b}} = ${frac(a, b)}$.`,
  };
};
generators["continuity-hole-v1"] = (rng, idx) => {
  const c = rng.int(2, 8);
  return {
    id: `gen.continuity-hole-v1.${idx}`, generated: true, concepts: ["continuity"], difficulty: 2, context: "abstract",
    prompt: `$f(x) = \\dfrac{x^2 - ${c * c}}{x - ${c}}$ has a hole at $x = ${c}$. What value would make $f$ continuous there?`,
    steps: [{ instruction: "Simplify and evaluate the limit at the hole.", answer: `${2 * c}`, accept: [], hint: `It simplifies to $x + ${c}$; at $x = ${c}$ that's ${2 * c}.` }],
    finalAnswer: { value: `${2 * c}`, unit: "" }, solutionNarrative: `The simplified form $x + ${c}$ gives ${2 * c} at $x = ${c}$.`,
  };
};
generators["limit-diffquotient-v1"] = (rng, idx) => {
  const a = rng.int(-4, 5);
  return {
    id: `gen.limit-diffquotient-v1.${idx}`, generated: true, concepts: ["limits-applied"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = x^2$, evaluate $\\displaystyle\\lim_{h \\to 0} \\frac{f(${a}+h) - f(${a})}{h}$ (the instantaneous rate at $x = ${a}$).`,
    steps: [{ instruction: "This limit is $f'(${a})$. For $x^2$, $f'(x) = 2x$.", answer: `${2 * a}`, accept: [], hint: `$f'(x) = 2x$, so at $x = ${a}$ it's ${2 * a}.` }],
    finalAnswer: { value: `${2 * a}`, unit: "" }, solutionNarrative: `The difference quotient limit is $f'(${a}) = ${2 * a}$.`,
  };
};

// --- Calculus 1: The Derivative ----------------------------------------------
generators["deriv-from-def-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = nz(rng, -6, 6), c = nz(rng, -6, 6);
  return {
    id: `gen.deriv-from-def-v1.${idx}`, generated: true, concepts: ["limit-definition"], difficulty: 1, context: "abstract",
    prompt: `Find $f'(x)$ for $f(x) = ${cf(a)}x^2 ${signed(b)}x ${signed(c)}$.`,
    steps: [{ instruction: "Differentiate term by term.", answer: `${2 * a}x ${signed(b)}`, accept: [], hint: `The derivative of $x^2$ is $2x$; constants vanish.` }],
    finalAnswer: { value: `${2 * a}x ${signed(b)}`, unit: "" }, solutionNarrative: `$f'(x) = ${2 * a}x ${signed(b)}$.`,
  };
};
generators["slope-at-point-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = nz(rng, -6, 6), c = nz(rng, -6, 6), p = rng.int(-3, 4);
  const m = 2 * a * p + b;
  return {
    id: `gen.slope-at-point-v1.${idx}`, generated: true, concepts: ["slope-and-tangent"], difficulty: 2, context: "abstract",
    prompt: `Find the slope of the tangent to $f(x) = ${cf(a)}x^2 ${signed(b)}x ${signed(c)}$ at $x = ${p}$.`,
    steps: [{ instruction: "Compute $f'(x)$, then evaluate at the point.", answer: `${m}`, accept: [], hint: `$f'(x) = ${2 * a}x ${signed(b)}$; plug in $x = ${p}$.` }],
    finalAnswer: { value: `${m}`, unit: "" }, solutionNarrative: `$f'(${p}) = ${m}$.`,
  };
};
generators["avg-velocity-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 6), t1 = rng.int(0, 3), t2 = t1 + rng.int(1, 4);
  const s1 = a * t1 * t1 + b * t1, s2 = a * t2 * t2 + b * t2, avg = (s2 - s1) / (t2 - t1);
  return {
    id: `gen.avg-velocity-v1.${idx}`, generated: true, concepts: ["average-vs-instantaneous"], difficulty: 2, context: "applied",
    prompt: `A particle's position is $s(t) = ${cf(a)}t^2 ${signed(b)}t$. Find its average velocity over $[${t1}, ${t2}]$.`,
    steps: [{ instruction: "Average velocity = (s(t₂) − s(t₁)) / (t₂ − t₁).", answer: `${avg}`, accept: [], hint: `$s(${t2}) = ${s2}$, $s(${t1}) = ${s1}$.` }],
    finalAnswer: { value: `${avg}`, unit: "" }, solutionNarrative: `$(${s2} − ${s1})/(${t2} − ${t1}) = ${avg}$.`,
  };
};
generators["marginal-cost-v1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(2, 12), c = rng.int(10, 80), q = rng.int(2, 10);
  const mc = 2 * a * q + b;
  return {
    id: `gen.marginal-cost-v1.${idx}`, generated: true, concepts: ["interpret-derivative"], difficulty: 1, context: "applied",
    prompt: `A cost function is $C(x) = ${cf(a)}x^2 + ${b}x + ${c}$ dollars. Find the marginal cost $C'(x)$ at $x = ${q}$ units.`,
    steps: [{ instruction: "Marginal cost is $C'(x)$ evaluated at the quantity.", answer: `${mc}`, accept: [], hint: `$C'(x) = ${2 * a}x + ${b}$; plug in ${q}.` }],
    finalAnswer: { value: `${mc}`, unit: "dollars per unit" }, solutionNarrative: `$C'(${q}) = ${mc}$ dollars per unit.`,
  };
};

// --- Calculus 1: Differentiation Rules ---------------------------------------
generators["power-rule-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 5), c = nz(rng, -6, 6), d = nz(rng, -6, 6);
  return {
    id: `gen.power-rule-v1.${idx}`, generated: true, concepts: ["power-rule"], difficulty: 1, context: "abstract",
    prompt: `Differentiate: $f(x) = ${cf(a)}x^3 ${signed(b)}x^2 ${signed(c)}x ${signed(d)}$.`,
    steps: [{ instruction: "Apply the power rule to each term.", answer: `${3 * a}x^2 ${signed(2 * b)}x ${signed(c)}`, accept: [], hint: `Bring down the exponent and reduce it by 1.` }],
    finalAnswer: { value: `${3 * a}x^2 ${signed(2 * b)}x ${signed(c)}`, unit: "" }, solutionNarrative: `$f'(x) = ${3 * a}x^2 ${signed(2 * b)}x ${signed(c)}$.`,
  };
};
generators["product-eval-v1"] = (rng, idx) => {
  const a = nz(rng, -4, 4), b = nz(rng, -5, 5), p = rng.int(-2, 3);
  // f = (x + a)(x^2 + b); f' = (x^2+b) + (x+a)(2x) = 3x^2 + 2a x + b
  const fp = 3 * p * p + 2 * a * p + b;
  return {
    id: `gen.product-eval-v1.${idx}`, generated: true, concepts: ["product-rule"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = (x ${signed(a)})(x^2 ${signed(b)})$. Find $f'(${p})$ using the product rule.`,
    steps: [{ instruction: "Apply the product rule, then evaluate at the point.", answer: `${fp}`, accept: [], hint: `$f'(x) = (x^2 ${signed(b)}) + (x ${signed(a)})(2x)$.` }],
    finalAnswer: { value: `${fp}`, unit: "" }, solutionNarrative: `$f'(${p}) = ${fp}$.`,
  };
};
generators["quotient-eval-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -5, 5), c = rng.int(1, 4), d = nz(rng, -5, 5), p = rng.int(0, 4);
  const den = c * p + d;
  if (den === 0) return generators["quotient-eval-v1"](rng, idx + 1);
  const fp = round2((a * (c * p + d) - c * (a * p + b)) / (den * den));
  return {
    id: `gen.quotient-eval-v1.${idx}`, generated: true, concepts: ["quotient-rule"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = \\dfrac{${cf(a)}x ${signed(b)}}{${cf(c)}x ${signed(d)}}$. Find $f'(${p})$. (Round to 2 decimals if needed.)`,
    steps: [{ instruction: "Use the quotient rule, then evaluate at the point.", answer: `${fp}`, accept: [], hint: `$f'(x) = \\frac{(${a})(${cf(c)}x ${signed(d)}) - (${c})(${cf(a)}x ${signed(b)})}{(${cf(c)}x ${signed(d)})^2}$.` }],
    finalAnswer: { value: `${fp}`, unit: "" }, solutionNarrative: `$f'(${p}) = ${fp}$.`,
  };
};
generators["chain-eval-v1"] = (rng, idx) => {
  const a = nz(rng, -4, 4), n = rng.int(2, 4), p = rng.int(-2, 3);
  // f = (x^2 + a)^n; f' = n(x^2+a)^(n-1) * 2x
  const fp = n * Math.pow(p * p + a, n - 1) * 2 * p;
  return {
    id: `gen.chain-eval-v1.${idx}`, generated: true, concepts: ["chain-rule"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = (x^2 ${signed(a)})^${n}$. Find $f'(${p})$ using the chain rule.`,
    steps: [{ instruction: "Differentiate the outer power, then multiply by the inner derivative $2x$.", answer: `${fp}`, accept: [], hint: `$f'(x) = ${n}(x^2 ${signed(a)})^${n - 1} \\cdot 2x$.` }],
    finalAnswer: { value: `${fp}`, unit: "" }, solutionNarrative: `$f'(${p}) = ${fp}$.`,
  };
};

// --- Calculus 1: Analyzing Functions -----------------------------------------
generators["critical-quadratic-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), k = nz(rng, -5, 5), b = -2 * a * k, c = nz(rng, -6, 6);
  return {
    id: `gen.critical-quadratic-v1.${idx}`, generated: true, concepts: ["critical-points"], difficulty: 1, context: "abstract",
    prompt: `Find the critical point of $f(x) = ${a}x^2 ${signed(b)}x ${signed(c)}$ (where $f'(x) = 0$).`,
    steps: [{ instruction: "Set $f'(x) = 0$ and solve.", answer: `${k}`, accept: [`x=${k}`], hint: `$f'(x) = ${2 * a}x ${signed(b)} = 0$.` }],
    finalAnswer: { value: `${k}`, unit: "" }, solutionNarrative: `$f'(x) = 0$ at $x = ${k}$.`,
  };
};
generators["increasing-decreasing-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = nz(rng, -6, 6), c = nz(rng, -6, 6), p = nz(rng, -4, 4);
  const slope = 2 * a * p + b, inc = slope > 0;
  return {
    id: `gen.increasing-decreasing-v1.${idx}`, generated: true, concepts: ["increasing-decreasing"], difficulty: 2, context: "abstract",
    prompt: `Is $f(x) = ${a}x^2 ${signed(b)}x ${signed(c)}$ increasing or decreasing at $x = ${p}$?`,
    steps: [{ instruction: "Check the sign of $f'$ at the point.", answer: inc ? "increasing" : "decreasing", accept: [], hint: `$f'(${p}) = ${slope}$.` }],
    finalAnswer: { value: inc ? "increasing" : "decreasing", unit: "" }, solutionNarrative: `$f'(${p}) = ${slope}$, so the function is ${inc ? "increasing" : "decreasing"}.`,
  };
};
generators["concavity-v1"] = (rng, idx) => {
  const b = nz(rng, -5, 5), p = nz(rng, -4, 4), fpp = 6 * p + 2 * b, up = fpp > 0;
  return {
    id: `gen.concavity-v1.${idx}`, generated: true, concepts: ["concavity-inflection"], difficulty: 2, context: "abstract",
    prompt: `Is $f(x) = x^3 ${signed(b)}x^2$ concave up or concave down at $x = ${p}$?`,
    steps: [{ instruction: "Check the sign of $f''$ at the point.", answer: up ? "concave up" : "concave down", accept: [up ? "up" : "down"], hint: `$f''(x) = 6x ${signed(2 * b)}$; at $x = ${p}$ it's ${fpp}.` }],
    finalAnswer: { value: up ? "concave up" : "concave down", unit: "" }, solutionNarrative: `$f''(${p}) = ${fpp}$, so concave ${up ? "up" : "down"}.`,
  };
};
generators["extrema-quadratic-v1"] = (rng, idx) => {
  const sign = rng.int(0, 1) === 0 ? 1 : -1, a = sign * rng.int(1, 4), k = nz(rng, -4, 4), b = -2 * a * k, c = nz(rng, -5, 8);
  const val = a * k * k + b * k + c, isMin = a > 0;
  return {
    id: `gen.extrema-quadratic-v1.${idx}`, generated: true, concepts: ["extrema-classification"], difficulty: 2, context: "abstract",
    prompt: `The function $f(x) = ${cf(a)}x^2 ${signed(b)}x ${signed(c)}$ has one extremum.`,
    steps: [
      { instruction: "Is it a minimum or a maximum?", answer: isMin ? "minimum" : "maximum", accept: [isMin ? "min" : "max"], hint: `The leading coefficient is ${a > 0 ? "positive" : "negative"}.` },
      { instruction: `Find the extreme value (the $y$-value at $x = ${k}$).`, answer: `${val}`, accept: [], hint: `Evaluate $f(${k})$.` },
    ],
    finalAnswer: { value: `${isMin ? "min" : "max"} = ${val}`, unit: "" }, solutionNarrative: `It's a ${isMin ? "minimum" : "maximum"} of ${val} at $x = ${k}$.`,
  };
};

// --- Calculus 1: Related Rates -----------------------------------------------
generators["circle-area-rate-v1"] = (rng, idx) => {
  const r = rng.int(2, 10), drdt = rng.int(1, 5), dadt = round1(2 * 3.14 * r * drdt);
  return {
    id: `gen.circle-area-rate-v1.${idx}`, generated: true, concepts: ["expanding-shrinking"], difficulty: 2, context: "applied",
    prompt: `A circular ripple's radius grows at ${drdt} ft/s. How fast is its area growing when $r = ${r}$ ft? (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "$dA/dt = 2π r \\, dr/dt$.", answer: `${dadt}`, accept: [], hint: `2 × 3.14 × ${r} × ${drdt}.` }],
    finalAnswer: { value: `${dadt}`, unit: "sq ft per s" }, solutionNarrative: `$2π(${r})(${drdt}) ≈ ${dadt}$ sq ft/s.`,
  };
};
generators["sphere-volume-rate-v1"] = (rng, idx) => {
  const r = rng.int(2, 8), drdt = rng.int(1, 4), dvdt = round1(4 * 3.14 * r * r * drdt);
  return {
    id: `gen.sphere-volume-rate-v1.${idx}`, generated: true, concepts: ["expanding-shrinking"], difficulty: 3, context: "applied",
    prompt: `A balloon's radius grows at ${drdt} cm/s. How fast is its volume growing when $r = ${r}$ cm? (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "$dV/dt = 4π r^2 \\, dr/dt$.", answer: `${dvdt}`, accept: [], hint: `4 × 3.14 × ${r}² × ${drdt}.` }],
    finalAnswer: { value: `${dvdt}`, unit: "cubic cm per s" }, solutionNarrative: `$4π(${r})^2(${drdt}) ≈ ${dvdt}$ cm³/s.`,
  };
};
generators["ladder-rate-v1"] = (rng, idx) => {
  const [x, y, L] = rng.pick(TRIPLES), dxdt = rng.int(1, 3);
  const dydt = round2(-(x / y) * dxdt);
  return {
    id: `gen.ladder-rate-v1.${idx}`, generated: true, concepts: ["ladder-and-distance"], difficulty: 2, context: "applied",
    prompt: `A ${L} ft ladder's base slides away from a wall at ${dxdt} ft/s. When the base is ${x} ft out (top ${y} ft up), how fast is the top sliding down? (Give a negative rate, round to 2 decimals.)`,
    steps: [{ instruction: "From $x^2 + y^2 = L^2$: $dy/dt = -(x/y)\\,dx/dt$.", answer: `${dydt}`, accept: [], hint: `$-(${x}/${y})(${dxdt})$.` }],
    finalAnswer: { value: `${dydt}`, unit: "ft per s" }, solutionNarrative: `$dy/dt = -(${x}/${y})(${dxdt}) = ${dydt}$ ft/s.`,
  };
};

// --- Calculus 1: Optimization ------------------------------------------------
generators["max-rect-area-v1"] = (rng, idx) => {
  const P = rng.int(4, 25) * 4, side = P / 4, area = side * side;
  return {
    id: `gen.max-rect-area-v1.${idx}`, generated: true, concepts: ["geometry-optimization"], difficulty: 2, context: "applied",
    prompt: `You have ${P} ft of fencing for a rectangular pen. What is the maximum area you can enclose?`,
    steps: [{ instruction: "Maximum area occurs for a square (side = perimeter/4).", answer: `${area}`, accept: [], hint: `Each side is ${P}/4 = ${side} ft.` }],
    finalAnswer: { value: `${area}`, unit: "sq ft" }, solutionNarrative: `A ${side}×${side} square gives ${area} sq ft.`,
  };
};
generators["max-profit-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), xstar = rng.int(3, 15), b = 2 * a * xstar, c = rng.int(0, 50);
  const profit = -a * xstar * xstar + b * xstar - c; // P = -a x^2 + b x - c, max at x*=b/(2a)
  return {
    id: `gen.max-profit-v1.${idx}`, generated: true, concepts: ["business-optimization"], difficulty: 2, context: "applied",
    prompt: `A profit function is $P(x) = -${a}x^2 + ${b}x - ${c}$ (dollars, $x$ in hundreds of units). How many hundreds maximize profit?`,
    steps: [
      { instruction: "Set $P'(x) = 0$ and solve.", answer: `${xstar}`, accept: [], hint: `$P'(x) = -${2 * a}x + ${b} = 0$.` },
      { instruction: "What is the maximum profit?", answer: `${profit}`, accept: [], hint: `Evaluate $P(${xstar})$.` },
    ],
    finalAnswer: { value: `${profit}`, unit: "dollars" }, solutionNarrative: `Max at $x = ${xstar}$, giving profit ${profit}.`,
  };
};
generators["min-fence-cost-v1"] = (rng, idx) => {
  const side = rng.int(4, 20), area = side * side, price = rng.int(3, 12), cost = 4 * side * price;
  return {
    id: `gen.min-fence-cost-v1.${idx}`, generated: true, concepts: ["geometry-optimization"], difficulty: 3, context: "applied",
    prompt: `A square plot must have area ${area} sq ft. Fencing costs \\$${price}/ft. What is the (minimum) cost to fence its perimeter?`,
    steps: [
      { instruction: "Find the side length (√area), then the perimeter.", answer: `${4 * side}`, accept: [], hint: `Side = ${side} ft; perimeter = 4 × ${side}.` },
      { instruction: "Multiply the perimeter by the price per foot.", answer: `${cost}`, accept: [], hint: `${4 * side} × ${price}.` },
    ],
    finalAnswer: { value: `${cost}`, unit: "dollars" }, solutionNarrative: `Perimeter ${4 * side} ft × \\$${price} = \\$${cost}.`,
  };
};

// --- Calculus 2: Antiderivatives ---------------------------------------------
const E2 = 2.718; // value students are told to use, so rounded answers agree

generators["antideriv-power-v1"] = (rng, idx) => {
  // F = a x^3 + b x^2 + c x ;  f = F' = 3a x^2 + 2b x + c
  const a = rng.int(1, 4), b = nz(rng, -4, 4), c = nz(rng, -6, 6);
  return {
    id: `gen.antideriv-power-v1.${idx}`, generated: true, concepts: ["power-rule-integration"], difficulty: 1, context: "abstract",
    prompt: `Find the indefinite integral: $\\displaystyle\\int (${3 * a}x^2 ${signed(2 * b)}x ${signed(c)})\\,dx$. (Include $+ C$.)`,
    steps: [{ instruction: "Reverse the power rule on each term and add $+ C$.", answer: `${a}x^3 ${signed(b)}x^2 ${signed(c)}x + C`, accept: [], hint: "Raise each exponent by 1 and divide by the new exponent." }],
    finalAnswer: { value: `${a}x^3 ${signed(b)}x^2 ${signed(c)}x + C`, unit: "" }, solutionNarrative: `$${a}x^3 ${signed(b)}x^2 ${signed(c)}x + C$.`,
  };
};
generators["antideriv-rules-v1"] = (rng, idx) => {
  // F = a x^4 + b x^2 ;  f = 4a x^3 + 2b x
  const a = rng.int(1, 3), b = nz(rng, -5, 5);
  return {
    id: `gen.antideriv-rules-v1.${idx}`, generated: true, concepts: ["antiderivative-rules"], difficulty: 2, context: "abstract",
    prompt: `Find: $\\displaystyle\\int (${4 * a}x^3 ${signed(2 * b)}x)\\,dx$. (Include $+ C$.)`,
    steps: [{ instruction: "Integrate term by term, add $+ C$.", answer: `${a}x^4 ${signed(b)}x^2 + C`, accept: [], hint: `$\\int x^3 dx = x^4/4$.` }],
    finalAnswer: { value: `${a}x^4 ${signed(b)}x^2 + C`, unit: "" }, solutionNarrative: `$${a}x^4 ${signed(b)}x^2 + C$.`,
  };
};
generators["ivp-v1"] = (rng, idx) => {
  // f' = 2a x + b ; f = a x^2 + b x + C ; given f(x0)=y0 find f(x1)
  const a = rng.int(1, 4), b = nz(rng, -5, 5), x0 = rng.int(0, 3), y0 = rng.int(-5, 10), x1 = x0 + rng.int(1, 4);
  const C = y0 - a * x0 * x0 - b * x0, val = a * x1 * x1 + b * x1 + C;
  return {
    id: `gen.ivp-v1.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 2, context: "abstract",
    prompt: `If $f'(x) = ${2 * a}x ${signed(b)}$ and $f(${x0}) = ${y0}$, find $f(${x1})$.`,
    steps: [{ instruction: "Integrate to get $f(x) = a x^2 + b x + C$, use the condition to find $C$, then evaluate.", answer: `${val}`, accept: [], hint: `$f(x) = ${a}x^2 ${signed(b)}x + C$; solve for $C$ using $f(${x0}) = ${y0}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$C = ${C}$, so $f(${x1}) = ${val}$.`,
  };
};
generators["antideriv-app-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = rng.int(1, 8), s0 = rng.int(0, 10), T = rng.int(2, 6);
  // v(t) = 2a t + b ; s(t) = a t^2 + b t + s0
  const sT = a * T * T + b * T + s0;
  return {
    id: `gen.antideriv-app-v1.${idx}`, generated: true, concepts: ["antiderivative-applications"], difficulty: 2, context: "applied",
    prompt: `An object has velocity $v(t) = ${2 * a}t + ${b}$ and starts at position ${s0}. Find its position at $t = ${T}$.`,
    steps: [{ instruction: "Integrate velocity to get position, using the starting position as $+ C$.", answer: `${sT}`, accept: [], hint: `$s(t) = ${a}t^2 + ${b}t + ${s0}$.` }],
    finalAnswer: { value: `${sT}`, unit: "" }, solutionNarrative: `$s(${T}) = ${sT}$.`,
  };
};

// --- Calculus 2: Definite Integrals ------------------------------------------
generators["riemann-v1"] = (rng, idx) => {
  const k = rng.int(1, 5), n = rng.int(3, 6), sum = k * n * (n + 1) / 2;
  return {
    id: `gen.riemann-v1.${idx}`, generated: true, concepts: ["riemann-sums"], difficulty: 1, context: "abstract",
    prompt: `Estimate the area under $f(x) = ${k}x$ on $[0, ${n}]$ using ${n} rectangles of width 1 and right endpoints.`,
    steps: [{ instruction: "Add $f(1) + f(2) + \\dots + f(${n})$.", answer: `${sum}`, accept: [], hint: `${k}(1 + 2 + … + ${n}) = ${k} × ${n * (n + 1) / 2}.` }],
    finalAnswer: { value: `${sum}`, unit: "" }, solutionNarrative: `Right sum $= ${k}\\cdot\\frac{${n}(${n}+1)}{2} = ${sum}$.`,
  };
};
generators["ftc-eval-v1"] = (rng, idx) => {
  const p = rng.int(1, 3), q = nz(rng, -3, 3), r = nz(rng, -4, 4), a = rng.int(0, 2), b = a + rng.int(1, 3);
  const F = (x) => p * x ** 3 + q * x ** 2 + r * x;
  const val = F(b) - F(a);
  return {
    id: `gen.ftc-eval-v1.${idx}`, generated: true, concepts: ["ftc-evaluate"], difficulty: 1, context: "abstract",
    prompt: `Evaluate: $\\displaystyle\\int_{${a}}^{${b}} (${3 * p}x^2 ${signed(2 * q)}x ${signed(r)})\\,dx$`,
    steps: [{ instruction: "Find the antiderivative, then evaluate top minus bottom.", answer: `${val}`, accept: [], hint: `Antiderivative is $${p}x^3 ${signed(q)}x^2 ${signed(r)}x$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$F(${b}) - F(${a}) = ${val}$.`,
  };
};
generators["area-under-v1"] = (rng, idx) => {
  const m = rng.int(1, 3), k = 3 * m, b = rng.int(2, 5), area = m * b ** 3;
  return {
    id: `gen.area-under-v1.${idx}`, generated: true, concepts: ["area-under-curve"], difficulty: 2, context: "abstract",
    prompt: `Find the exact area under $f(x) = ${k}x^2$ from $x = 0$ to $x = ${b}$.`,
    steps: [{ instruction: "Integrate and evaluate.", answer: `${area}`, accept: [], hint: `$\\int ${k}x^2 dx = ${m}x^3$; evaluate at ${b}.` }],
    finalAnswer: { value: `${area}`, unit: "" }, solutionNarrative: `$${m}(${b})^3 = ${area}$.`,
  };
};
generators["net-change-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(2, 10), T = rng.int(2, 6), total = a * T * T + b * T;
  return {
    id: `gen.net-change-v1.${idx}`, generated: true, concepts: ["net-change"], difficulty: 2, context: "applied",
    prompt: `Water flows into a tank at rate $r(t) = ${2 * a}t + ${b}$ liters/min. How much water enters during the first ${T} minutes?`,
    steps: [{ instruction: "Integrate the rate over $[0, ${T}]$.", answer: `${total}`, accept: [], hint: `$\\int_0^{${T}} (${2 * a}t + ${b})\\,dt = ${a}t^2 + ${b}t$ evaluated at ${T}.` }],
    finalAnswer: { value: `${total}`, unit: "liters" }, solutionNarrative: `$${a}(${T})^2 + ${b}(${T}) = ${total}$ liters.`,
  };
};

// --- Calculus 2: Substitution ------------------------------------------------
generators["choosing-u-v1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = nz(rng, -4, 6), n = rng.int(3, 6);
  return {
    id: `gen.choosing-u-v1.${idx}`, generated: true, concepts: ["choosing-u"], difficulty: 1, context: "abstract",
    prompt: `For $\\displaystyle\\int (${a}x ${signed(b)})^${n}\\,dx$, what substitution $u$ should you use? (Write the expression.)`,
    steps: [{ instruction: "Let $u$ be the inside of the power.", answer: `${a}x ${signed(b)}`, accept: [], hint: "The inner function is what's raised to the power." }],
    finalAnswer: { value: `${a}x ${signed(b)}`, unit: "" }, solutionNarrative: `$u = ${a}x ${signed(b)}$.`,
  };
};
generators["sub-definite-v1"] = (rng, idx) => {
  const b = rng.int(1, 3), n = rng.int(1, 3);
  // ∫_0^b 2x (x^2+1)^n dx = [(b^2+1)^(n+1) - 1] / (n+1)
  const val = (Math.pow(b * b + 1, n + 1) - 1) / (n + 1);
  return {
    id: `gen.sub-definite-v1.${idx}`, generated: true, concepts: ["definite-substitution"], difficulty: 2, context: "abstract",
    prompt: `Evaluate: $\\displaystyle\\int_0^{${b}} 2x(x^2 + 1)^${n}\\,dx$`,
    steps: [{ instruction: "Let $u = x^2 + 1$ (so $du = 2x\\,dx$) and change limits.", answer: `${val}`, accept: [], hint: `$\\int_1^{${b * b + 1}} u^${n}\\,du = \\frac{u^${n + 1}}{${n + 1}}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `With $u = x^2+1$: $\\frac{(${b * b + 1})^${n + 1} - 1}{${n + 1}} = ${val}$.`,
  };
};
generators["sub-applied-v1"] = (rng, idx) => {
  const a = rng.int(2, 4), b = rng.int(1, 3);
  // ∫_0^b 3x^2 (x^3)' ... keep simple: ∫_0^b a*2x(x^2)^? ; use ∫_0^b 2ax(x^2+0)... let's do ∫_0^b 2x*a dx style -> just a numeric accumulation
  const total = a * b * b; // ∫_0^b 2a x dx = a x^2 |_0^b = a b^2
  return {
    id: `gen.sub-applied-v1.${idx}`, generated: true, concepts: ["substitution-applications"], difficulty: 2, context: "applied",
    prompt: `A particle's velocity is $v(t) = ${2 * a}t$. Using integration, find the distance traveled from $t = 0$ to $t = ${b}$.`,
    steps: [{ instruction: "Integrate the velocity over the interval.", answer: `${total}`, accept: [], hint: `$\\int_0^{${b}} ${2 * a}t\\,dt = ${a}t^2$ at ${b}.` }],
    finalAnswer: { value: `${total}`, unit: "" }, solutionNarrative: `$${a}(${b})^2 = ${total}$.`,
  };
};

// --- Calculus 2: Integration by Parts (numeric, e ≈ 2.718) -------------------
generators["parts-xex-v1"] = (rng, idx) => {
  const b = rng.int(1, 3), val = round2((b - 1) * Math.pow(E2, b) + 1);
  return {
    id: `gen.parts-xex-v1.${idx}`, generated: true, concepts: ["polynomial-times-exponential"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${b}} x e^x\\,dx$ using integration by parts. (Use $e ≈ 2.718$, round to 2 decimals.)`,
    steps: [{ instruction: "With $u = x$, $dv = e^x dx$: the integral is $(x-1)e^x$ evaluated on the interval.", answer: `${val}`, accept: [], hint: `$[(x-1)e^x]_0^{${b}} = (${b}-1)e^{${b}} + 1$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$(${b}-1)e^{${b}} + 1 ≈ ${val}$.`,
  };
};
generators["parts-lnx-v1"] = (rng, idx) => {
  const b = rng.int(2, 6), val = round2(b * Math.log(b) - b + 1);
  return {
    id: `gen.parts-lnx-v1.${idx}`, generated: true, concepts: ["logarithmic-integrals"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_1^{${b}} \\ln x\\,dx$ using integration by parts. (Round to 2 decimals.)`,
    steps: [{ instruction: "The antiderivative of $\\ln x$ is $x\\ln x - x$. Evaluate on $[1, ${b}]$.", answer: `${val}`, accept: [], hint: `$[x\\ln x - x]_1^{${b}} = ${b}\\ln ${b} - ${b} + 1$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$${b}\\ln ${b} - ${b} + 1 ≈ ${val}$.`,
  };
};
generators["parts-formula-v1"] = (rng, idx) => {
  const b = rng.int(1, 4), val = round2((b - 1) * Math.pow(E2, b) + 1);
  return {
    id: `gen.parts-formula-v1.${idx}`, generated: true, concepts: ["parts-formula"], difficulty: 2, context: "abstract",
    prompt: `Using $\\int u\\,dv = uv - \\int v\\,du$, evaluate $\\displaystyle\\int_0^{${b}} x e^x\\,dx$. (Use $e ≈ 2.718$, round to 2 decimals.)`,
    steps: [{ instruction: "Choose $u = x$, $dv = e^x dx$; apply the formula.", answer: `${val}`, accept: [], hint: `Result is $(${b}-1)e^{${b}} + 1$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$(${b}-1)e^{${b}} + 1 ≈ ${val}$.`,
  };
};

// --- Calculus 2: Applications of Integration ---------------------------------
generators["area-between-v1"] = (rng, idx) => {
  const b = rng.int(2, 5), m = rng.int(2, 6);
  // between y = m x (upper) and y = x^2 ... keep clean: area between y=mx and y=x^2 from 0 to m = ∫_0^m (mx - x^2) = m*m^2/2 - m^3/3 = m^3/6
  const area = round2(m ** 3 / 6);
  return {
    id: `gen.area-between-v1.${idx}`, generated: true, concepts: ["area-between-curves"], difficulty: 2, context: "abstract",
    prompt: `Find the area between $y = ${m}x$ and $y = x^2$ (they meet at $x = 0$ and $x = ${m}$).`,
    steps: [{ instruction: "Integrate (upper − lower) over $[0, ${m}]$.", answer: `${area}`, accept: [], hint: `$\\int_0^{${m}} (${m}x - x^2)\\,dx$.` }],
    finalAnswer: { value: `${area}`, unit: "" }, solutionNarrative: `$\\int_0^{${m}} (${m}x - x^2)\\,dx = ${area}$.`,
  };
};
generators["volume-rev-v1"] = (rng, idx) => {
  const b = rng.int(2, 6), vol = round1(3.14 * b * b / 2);
  return {
    id: `gen.volume-rev-v1.${idx}`, generated: true, concepts: ["volume-of-revolution"], difficulty: 2, context: "abstract",
    prompt: `The region under $y = \\sqrt{x}$ from $x = 0$ to $x = ${b}$ is revolved about the x-axis. Find the volume. (π ≈ 3.14, round to 1 decimal.)`,
    steps: [{ instruction: "Disk method: $V = \\pi\\int_0^{${b}} (\\sqrt{x})^2\\,dx = \\pi\\int_0^{${b}} x\\,dx$.", answer: `${vol}`, accept: [], hint: `$\\pi \\cdot \\frac{${b}^2}{2}$.` }],
    finalAnswer: { value: `${vol}`, unit: "" }, solutionNarrative: `$\\pi \\cdot \\frac{${b * b}}{2} ≈ ${vol}$.`,
  };
};
generators["avg-value-v1"] = (rng, idx) => {
  const k = rng.int(1, 4), b = rng.int(2, 6), avg = round2((k * b ** 3 / 3) / b);
  return {
    id: `gen.avg-value-v1.${idx}`, generated: true, concepts: ["average-value"], difficulty: 2, context: "abstract",
    prompt: `Find the average value of $f(x) = ${3 * k}x^2$ on $[0, ${b}]$.`,
    steps: [{ instruction: "Average $= \\frac{1}{b-a}\\int_a^b f\\,dx$.", answer: `${avg}`, accept: [], hint: `$\\frac{1}{${b}}\\int_0^{${b}} ${3 * k}x^2\\,dx = \\frac{${k}(${b})^3}{${b}}$.` }],
    finalAnswer: { value: `${avg}`, unit: "" }, solutionNarrative: `Average $= ${avg}$.`,
  };
};

// --- Calculus 2: Series & Convergence ----------------------------------------
generators["geom-series-sum-v1"] = (rng, idx) => {
  const a = rng.int(2, 12) * 3, denom = rng.pick([2, 3]), sum = round2(a / (1 - 1 / denom));
  return {
    id: `gen.geom-series-sum-v1.${idx}`, generated: true, concepts: ["geometric-series"], difficulty: 1, context: "abstract",
    prompt: `Find the sum of the infinite geometric series with first term ${a} and ratio $\\frac{1}{${denom}}$.`,
    steps: [{ instruction: "$S = \\frac{a}{1 - r}$ since $|r| < 1$.", answer: `${sum}`, accept: [], hint: `$\\frac{${a}}{1 - 1/${denom}}$.` }],
    finalAnswer: { value: `${sum}`, unit: "" }, solutionNarrative: `$S = ${sum}$.`,
  };
};
generators["geom-converge-v1"] = (rng, idx) => {
  const conv = rng.int(0, 1) === 0;
  const r = conv ? `\\frac{1}{${rng.pick([2, 3, 4])}}` : `${rng.pick([2, 3])}`;
  return {
    id: `gen.geom-converge-v1.${idx}`, generated: true, concepts: ["convergence-tests"], difficulty: 2, context: "abstract",
    prompt: `Does the geometric series with ratio $r = ${r}$ converge or diverge?`,
    steps: [{ instruction: "A geometric series converges exactly when $|r| < 1$.", answer: conv ? "converges" : "diverges", accept: [], hint: "Compare $|r|$ to 1." }],
    finalAnswer: { value: conv ? "converges" : "diverges", unit: "" }, solutionNarrative: `Since $|r| ${conv ? "<" : ">"} 1$, it ${conv ? "converges" : "diverges"}.`,
  };
};
generators["pseries-v1"] = (rng, idx) => {
  const conv = rng.int(0, 1) === 0;
  const p = conv ? rng.pick([2, 3]) : rng.pick([1]);
  return {
    id: `gen.pseries-v1.${idx}`, generated: true, concepts: ["p-series-and-harmonic"], difficulty: 2, context: "abstract",
    prompt: `Does the p-series $\\displaystyle\\sum \\frac{1}{n^{${p}}}$ converge or diverge?`,
    steps: [{ instruction: "A p-series converges exactly when $p > 1$.", answer: conv ? "converges" : "diverges", accept: [], hint: `Is $${p} > 1$? (The harmonic series $p=1$ diverges.)` }],
    finalAnswer: { value: conv ? "converges" : "diverges", unit: "" }, solutionNarrative: `$p = ${p}$, so it ${conv ? "converges" : "diverges"}.`,
  };
};
generators["repeating-decimal-v1"] = (rng, idx) => {
  const d = rng.int(1, 8);
  return {
    id: `gen.repeating-decimal-v1.${idx}`, generated: true, concepts: ["series-applications"], difficulty: 2, context: "applied",
    prompt: `Write the repeating decimal $0.\\overline{${d}}$ (i.e. $0.${d}${d}${d}\\ldots$) as a fraction using an infinite geometric series.`,
    steps: [{ instruction: "It's a geometric series with $a = ${d}/10$, $r = 1/10$; sum $= a/(1-r)$.", answer: frac(d, 9), accept: [`${d}/9`], hint: `$\\frac{${d}/10}{1 - 1/10} = \\frac{${d}}{9}$.` }],
    finalAnswer: { value: frac(d, 9), unit: "" }, solutionNarrative: `$0.\\overline{${d}} = ${frac(d, 9)}$.`,
  };
};

// --- Calculus 3: Vectors in Space --------------------------------------------
const INT_MAG3 = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [2, 6, 9], [6, 6, 7], [3, 4, 12], [4, 4, 7], [2, 10, 11], [1, 12, 12]];
const INT_MAG3_VAL = { "1,2,2": 3, "2,3,6": 7, "1,4,8": 9, "2,6,9": 11, "6,6,7": 11, "3,4,12": 13, "4,4,7": 9, "2,10,11": 15, "1,12,12": 17 };
generators["vec-components-v1"] = (rng, idx) => {
  const p = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)], q = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const v = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
  return {
    id: `gen.vec-components-v1.${idx}`, generated: true, concepts: ["vector-components"], difficulty: 1, context: "abstract",
    prompt: `Find the vector from $P(${p.join(", ")})$ to $Q(${q.join(", ")})$ in component form.`,
    steps: [{ instruction: "Subtract: $Q - P$ component by component.", answer: `<${v.join(", ")}>`, accept: [`(${v.join(", ")})`], hint: "Head minus tail." }],
    finalAnswer: { value: `<${v.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${v.join(", ")} \\rangle$.`,
  };
};
generators["vec-magnitude-v1"] = (rng, idx) => {
  const v = rng.pick(INT_MAG3), mag = INT_MAG3_VAL[v.join(",")];
  return {
    id: `gen.vec-magnitude-v1.${idx}`, generated: true, concepts: ["magnitude-and-unit"], difficulty: 1, context: "abstract",
    prompt: `Find the magnitude of $\\vec{v} = \\langle ${v.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Magnitude = $\\sqrt{x^2 + y^2 + z^2}$.", answer: `${mag}`, accept: [], hint: `$\\sqrt{${v[0]}^2 + ${v[1]}^2 + ${v[2]}^2} = \\sqrt{${v[0] ** 2 + v[1] ** 2 + v[2] ** 2}}$.` }],
    finalAnswer: { value: `${mag}`, unit: "" }, solutionNarrative: `$|\\vec{v}| = ${mag}$.`,
  };
};
generators["vec-operations-v1"] = (rng, idx) => {
  const s = rng.int(2, 4), t = rng.int(2, 4), u = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)], w = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
  const r = [s * u[0] + t * w[0], s * u[1] + t * w[1], s * u[2] + t * w[2]];
  return {
    id: `gen.vec-operations-v1.${idx}`, generated: true, concepts: ["vector-operations"], difficulty: 2, context: "abstract",
    prompt: `If $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ and $\\vec{w} = \\langle ${w.join(", ")} \\rangle$, find $${s}\\vec{u} + ${t}\\vec{w}$.`,
    steps: [{ instruction: "Scale each vector, then add component by component.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: `${s}⟨${u.join(",")}⟩ + ${t}⟨${w.join(",")}⟩.` }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};

// --- Calculus 3: Dot & Cross Products ----------------------------------------
generators["dot-product-v1"] = (rng, idx) => {
  const u = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)], w = [rng.int(-5, 5), rng.int(-5, 5), rng.int(-5, 5)];
  const dot = u[0] * w[0] + u[1] * w[1] + u[2] * w[2];
  return {
    id: `gen.dot-product-v1.${idx}`, generated: true, concepts: ["dot-product"], difficulty: 1, context: "abstract",
    prompt: `Find $\\vec{u} \\cdot \\vec{w}$ for $\\vec{u} = \\langle ${u.join(", ")} \\rangle$, $\\vec{w} = \\langle ${w.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Multiply matching components and add.", answer: `${dot}`, accept: [], hint: `${u[0]}·${w[0]} + ${u[1]}·${w[1]} + ${u[2]}·${w[2]}.` }],
    finalAnswer: { value: `${dot}`, unit: "" }, solutionNarrative: `$\\vec{u}\\cdot\\vec{w} = ${dot}$.`,
  };
};
generators["cross-product-v1"] = (rng, idx) => {
  const u = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)], w = [rng.int(-4, 4), rng.int(-4, 4), rng.int(-4, 4)];
  const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  return {
    id: `gen.cross-product-v1.${idx}`, generated: true, concepts: ["cross-product"], difficulty: 2, context: "abstract",
    prompt: `Find $\\vec{u} \\times \\vec{w}$ for $\\vec{u} = \\langle ${u.join(", ")} \\rangle$, $\\vec{w} = \\langle ${w.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Use the determinant formula for the cross product.", answer: `<${c.join(", ")}>`, accept: [`(${c.join(", ")})`], hint: `$\\langle u_2 w_3 - u_3 w_2,\\ u_3 w_1 - u_1 w_3,\\ u_1 w_2 - u_2 w_1 \\rangle$.` }],
    finalAnswer: { value: `<${c.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${c.join(", ")} \\rangle$.`,
  };
};
generators["dot-work-v1"] = (rng, idx) => {
  const F = [rng.int(1, 8), rng.int(1, 8), rng.int(0, 6)], d = [rng.int(1, 6), rng.int(1, 6), rng.int(0, 5)];
  const W = F[0] * d[0] + F[1] * d[1] + F[2] * d[2];
  return {
    id: `gen.dot-work-v1.${idx}`, generated: true, concepts: ["products-applied"], difficulty: 2, context: "applied",
    prompt: `A force $\\vec{F} = \\langle ${F.join(", ")} \\rangle$ N moves an object along displacement $\\vec{d} = \\langle ${d.join(", ")} \\rangle$ m. Find the work done ($W = \\vec{F}\\cdot\\vec{d}$).`,
    steps: [{ instruction: "Work is the dot product of force and displacement.", answer: `${W}`, accept: [], hint: "Multiply matching components and add." }],
    finalAnswer: { value: `${W}`, unit: "joules" }, solutionNarrative: `$W = ${W}$ J.`,
  };
};

// --- Calculus 3: Partial Derivatives -----------------------------------------
generators["first-partials-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4);
  // f = a x^2 y + b y^3 ; f_x = 2a x y
  return {
    id: `gen.first-partials-v1.${idx}`, generated: true, concepts: ["first-partials"], difficulty: 1, context: "abstract",
    prompt: `For $f(x, y) = ${a}x^2 y + ${b}y^3$, find $f_x$ (the partial with respect to $x$).`,
    steps: [{ instruction: "Differentiate treating $y$ as a constant.", answer: `${2 * a}xy`, accept: [], hint: `The $y^3$ term has no $x$, so it drops out.` }],
    finalAnswer: { value: `${2 * a}xy`, unit: "" }, solutionNarrative: `$f_x = ${2 * a}xy$.`,
  };
};
generators["eval-partial-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4), p = rng.int(-3, 4), q = rng.int(-3, 4);
  // f = a x^2 + b x y ; f_x = 2a x + b y
  const val = 2 * a * p + b * q;
  return {
    id: `gen.eval-partial-v1.${idx}`, generated: true, concepts: ["evaluate-partials"], difficulty: 2, context: "abstract",
    prompt: `For $f(x, y) = ${a}x^2 + ${b}xy$, find $f_x$ at $(${p}, ${q})$.`,
    steps: [{ instruction: "Find $f_x$, then substitute the point.", answer: `${val}`, accept: [], hint: `$f_x = ${2 * a}x + ${b}y$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$f_x(${p}, ${q}) = ${val}$.`,
  };
};
generators["second-partial-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4);
  // f = a x^2 y + b x y^2 ; f_x = 2a x y + b y^2 ; f_xy = 2a x + 2b y
  return {
    id: `gen.second-partial-v1.${idx}`, generated: true, concepts: ["second-partials"], difficulty: 2, context: "abstract",
    prompt: `For $f(x, y) = ${a}x^2 y + ${b}x y^2$, find the mixed partial $f_{xy}$.`,
    steps: [{ instruction: "Differentiate $f$ with respect to $x$, then with respect to $y$.", answer: `${2 * a}x + ${2 * b}y`, accept: [], hint: `$f_x = ${2 * a}xy + ${b}y^2$; now differentiate in $y$.` }],
    finalAnswer: { value: `${2 * a}x + ${2 * b}y`, unit: "" }, solutionNarrative: `$f_{xy} = ${2 * a}x + ${2 * b}y$.`,
  };
};

// --- Calculus 3: Gradient & Directional Derivatives --------------------------
generators["gradient-v1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4), c = nz(rng, -3, 3), p = rng.int(-3, 4), q = rng.int(-3, 4);
  // f = a x^2 + b y^2 + c x y ; ∇f = <2a x + c y, 2b y + c x>
  const gx = 2 * a * p + c * q, gy = 2 * b * q + c * p;
  return {
    id: `gen.gradient-v1.${idx}`, generated: true, concepts: ["gradient-vector"], difficulty: 1, context: "abstract",
    prompt: `For $f(x, y) = ${a}x^2 + ${b}y^2 ${signed(c)}xy$, find $\\nabla f$ at $(${p}, ${q})$ (as a vector).`,
    steps: [{ instruction: "Compute $\\langle f_x, f_y \\rangle$, then evaluate at the point.", answer: `<${gx}, ${gy}>`, accept: [`(${gx}, ${gy})`], hint: `$f_x = ${2 * a}x ${signed(c)}y$, $f_y = ${2 * b}y ${signed(c)}x$.` }],
    finalAnswer: { value: `<${gx}, ${gy}>`, unit: "" }, solutionNarrative: `$\\nabla f(${p}, ${q}) = \\langle ${gx}, ${gy} \\rangle$.`,
  };
};
generators["directional-v1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3), p = rng.int(1, 4), q = rng.int(1, 4);
  // f = a x^2 + b y^2 ; ∇f at (p,q) = <2a p, 2b q> ; unit u = <3/5, 4/5>
  const gx = 2 * a * p, gy = 2 * b * q, du = round2(gx * 0.6 + gy * 0.8);
  return {
    id: `gen.directional-v1.${idx}`, generated: true, concepts: ["directional-derivative"], difficulty: 2, context: "abstract",
    prompt: `For $f(x, y) = ${a}x^2 + ${b}y^2$, find the directional derivative at $(${p}, ${q})$ in the direction of the unit vector $\\langle \\tfrac{3}{5}, \\tfrac{4}{5} \\rangle$.`,
    steps: [{ instruction: "Compute $\\nabla f$ at the point, then dot with the unit vector.", answer: `${du}`, accept: [], hint: `$\\nabla f = \\langle ${gx}, ${gy} \\rangle$; dot with $\\langle 0.6, 0.8 \\rangle$.` }],
    finalAnswer: { value: `${du}`, unit: "" }, solutionNarrative: `$\\langle ${gx}, ${gy} \\rangle \\cdot \\langle 0.6, 0.8 \\rangle = ${du}$.`,
  };
};
generators["max-rate-v1"] = (rng, idx) => {
  const v = rng.pick([[3, 4], [6, 8], [5, 12], [8, 15], [9, 12]]);
  const mag = Math.round(Math.sqrt(v[0] ** 2 + v[1] ** 2));
  return {
    id: `gen.max-rate-v1.${idx}`, generated: true, concepts: ["max-rate-and-direction"], difficulty: 2, context: "abstract",
    prompt: `At a point, $\\nabla f = \\langle ${v[0]}, ${v[1]} \\rangle$. What is the maximum rate of increase of $f$ there?`,
    steps: [{ instruction: "The maximum rate equals the magnitude of the gradient.", answer: `${mag}`, accept: [], hint: `$|\\nabla f| = \\sqrt{${v[0]}^2 + ${v[1]}^2}$.` }],
    finalAnswer: { value: `${mag}`, unit: "" }, solutionNarrative: `$|\\nabla f| = ${mag}$.`,
  };
};

// --- Calculus 3: Multivariable Optimization ----------------------------------
generators["critical-point-2d-v1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 3), xc = nz(rng, -4, 4), yc = nz(rng, -4, 4);
  // f = a x^2 + b y^2 + d x + e y ; f_x = 2a x + d = 0 -> x = -d/2a ; set d = -2a xc, e = -2b yc
  return {
    id: `gen.critical-point-2d-v1.${idx}`, generated: true, concepts: ["critical-points"], difficulty: 1, context: "abstract",
    prompt: `Find the critical point of $f(x, y) = ${a}x^2 + ${b}y^2 ${signed(-2 * a * xc)}x ${signed(-2 * b * yc)}y$ (as an ordered pair).`,
    steps: [{ instruction: "Set $f_x = 0$ and $f_y = 0$ and solve.", answer: `(${xc}, ${yc})`, accept: [], hint: `$f_x = ${2 * a}x ${signed(-2 * a * xc)} = 0$, $f_y = ${2 * b}y ${signed(-2 * b * yc)} = 0$.` }],
    finalAnswer: { value: `(${xc}, ${yc})`, unit: "" }, solutionNarrative: `Critical point $(${xc}, ${yc})$.`,
  };
};
generators["second-deriv-test-v1"] = (rng, idx) => {
  const a = nz(rng, -3, 3), b = nz(rng, -3, 3), c = nz(rng, -3, 3);
  // f_xx = 2a, f_yy = 2b, f_xy = c ; D = 4ab - c^2
  const D = 4 * a * b - c * c;
  const cls = D < 0 ? "saddle point" : a > 0 ? "minimum" : "maximum";
  return {
    id: `gen.second-deriv-test-v1.${idx}`, generated: true, concepts: ["second-derivative-test"], difficulty: 2, context: "abstract",
    prompt: `At a critical point, $f_{xx} = ${2 * a}$, $f_{yy} = ${2 * b}$, $f_{xy} = ${c}$. Use the second-derivative test.`,
    steps: [
      { instruction: "Compute $D = f_{xx}f_{yy} - (f_{xy})^2$.", answer: `${D}`, accept: [], hint: `$(${2 * a})(${2 * b}) - (${c})^2$.` },
      { instruction: "Classify: minimum, maximum, or saddle point?", answer: cls, accept: cls === "saddle point" ? ["saddle"] : [cls.slice(0, 3)], hint: "D < 0 → saddle; D > 0 with $f_{xx}>0$ → min, $f_{xx}<0$ → max." },
    ],
    finalAnswer: { value: cls, unit: "" }, solutionNarrative: `$D = ${D}$, so it's a ${cls}.`,
  };
};
generators["lagrange-v1"] = (rng, idx) => {
  const S = rng.int(3, 15) * 2; // maximize xy s.t. x+y=S, max at x=y=S/2, value (S/2)^2
  return {
    id: `gen.lagrange-v1.${idx}`, generated: true, concepts: ["lagrange-multipliers"], difficulty: 3, context: "applied",
    prompt: `Using Lagrange multipliers, maximize $f(x, y) = xy$ subject to $x + y = ${S}$. What is the maximum value?`,
    steps: [{ instruction: "The maximum occurs where $x = y$. Find that point, then evaluate $xy$.", answer: `${(S / 2) * (S / 2)}`, accept: [], hint: `$x = y = ${S / 2}$, so $xy = ${S / 2}^2$.` }],
    finalAnswer: { value: `${(S / 2) * (S / 2)}`, unit: "" }, solutionNarrative: `Max at $(${S / 2}, ${S / 2})$: $xy = ${(S / 2) ** 2}$.`,
  };
};

// --- Calculus 3: Multiple Integrals ------------------------------------------
generators["double-rect-v1"] = (rng, idx) => {
  const A = rng.int(2, 4) * 2, B = rng.int(2, 4) * 2, val = (A * A / 2) * (B * B / 2);
  return {
    id: `gen.double-rect-v1.${idx}`, generated: true, concepts: ["double-integrals-rectangular"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${A}}\\!\\int_0^{${B}} xy \\,dy\\,dx$.`,
    steps: [{ instruction: "Integrate in $y$, then in $x$.", answer: `${val}`, accept: [], hint: `$\\int_0^{${A}} x \\cdot \\frac{${B}^2}{2}\\,dx = \\frac{${A}^2}{2}\\cdot\\frac{${B}^2}{2}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$\\frac{${A}^2}{2}\\cdot\\frac{${B}^2}{2} = ${val}$.`,
  };
};
generators["double-general-v1"] = (rng, idx) => {
  const A = rng.int(1, 3) * 3, val = A ** 3 / 3;
  return {
    id: `gen.double-general-v1.${idx}`, generated: true, concepts: ["double-integrals-general"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${A}}\\!\\int_0^{x} 2y \\,dy\\,dx$ (a triangular region).`,
    steps: [{ instruction: "Inner integral gives $x^2$; then integrate in $x$.", answer: `${val}`, accept: [], hint: `$\\int_0^{${A}} x^2\\,dx = \\frac{${A}^3}{3}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$\\frac{${A}^3}{3} = ${val}$.`,
  };
};
generators["triple-box-v1"] = (rng, idx) => {
  const A = rng.int(2, 5), B = rng.int(2, 5), C = rng.int(2, 5), k = rng.int(1, 4), val = k * A * B * C;
  return {
    id: `gen.triple-box-v1.${idx}`, generated: true, concepts: ["triple-integrals"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_0^{${A}}\\!\\int_0^{${B}}\\!\\int_0^{${C}} ${k}\\,dz\\,dy\\,dx$.`,
    steps: [{ instruction: "Integrating a constant over a box multiplies it by the box's volume.", answer: `${val}`, accept: [], hint: `${k} × ${A} × ${B} × ${C}.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `${k}·${A}·${B}·${C} = ${val}.`,
  };
};
generators["integral-volume-v1"] = (rng, idx) => {
  const A = rng.int(2, 5), B = rng.int(2, 5), h = rng.int(2, 8), val = h * A * B;
  return {
    id: `gen.integral-volume-v1.${idx}`, generated: true, concepts: ["integral-applications"], difficulty: 2, context: "applied",
    prompt: `Find the volume of the solid under the plane $z = ${h}$ over the rectangle $[0, ${A}] \\times [0, ${B}]$.`,
    steps: [{ instruction: "Volume = $\\iint z\\,dA$ = height × base area.", answer: `${val}`, accept: [], hint: `${h} × ${A} × ${B}.` }],
    finalAnswer: { value: `${val}`, unit: "cubic units" }, solutionNarrative: `${h}·${A}·${B} = ${val}.`,
  };
};

// --- Differential Equations: Introduction ------------------------------------
generators["de-classify-v1"] = (rng, idx) => {
  const opt = rng.pick([
    { de: "\\frac{dy}{dx} + ${a}y = ${b}x", order: 1, lin: "linear" },
    { de: "y'' + ${a}y' + ${b}y = 0", order: 2, lin: "linear" },
    { de: "\\frac{dy}{dx} + ${a}y^2 = ${b}", order: 1, lin: "nonlinear" },
    { de: "y'' + ${a}(y')^2 + y = 0", order: 2, lin: "nonlinear" },
  ]);
  const a = rng.int(2, 6), b = rng.int(1, 7);
  const de = opt.de.replace("${a}", a).replace("${b}", b);
  return {
    id: `gen.de-classify-v1.${idx}`, generated: true, concepts: ["classify-order-linearity"], difficulty: 1, context: "abstract",
    prompt: `For the differential equation $${de}$:`,
    steps: [
      { instruction: "What is its order?", answer: `${opt.order}`, accept: [], hint: "The order is the highest derivative present." },
      { instruction: "Is it linear or nonlinear?", answer: opt.lin, accept: [], hint: "Nonlinear if the unknown or its derivatives appear squared, multiplied together, etc." },
    ],
    finalAnswer: { value: `order ${opt.order}, ${opt.lin}`, unit: "" }, solutionNarrative: `Order ${opt.order}, ${opt.lin}.`,
  };
};
generators["de-slope-v1"] = (rng, idx) => {
  const a = nz(rng, -4, 4), b = nz(rng, -4, 4), x = rng.int(-3, 4), y = rng.int(-3, 4);
  return {
    id: `gen.de-slope-v1.${idx}`, generated: true, concepts: ["slope-fields"], difficulty: 1, context: "abstract",
    prompt: `For $\\frac{dy}{dx} = ${a}x ${signed(b)}y$, find the slope of the solution curve at the point $(${x}, ${y})$.`,
    steps: [{ instruction: "Substitute the point into the right-hand side.", answer: `${a * x + b * y}`, accept: [], hint: `${a}(${x}) ${signed(b)}(${y}).` }],
    finalAnswer: { value: `${a * x + b * y}`, unit: "" }, solutionNarrative: `Slope $= ${a * x + b * y}$.`,
  };
};
generators["de-separable-v1"] = (rng, idx) => {
  const sep = rng.int(0, 1) === 0;
  const a = rng.int(2, 5), b = rng.int(2, 5);
  const rhs = sep ? `${a}xy` : `${a}x + ${b}y`;
  return {
    id: `gen.de-separable-v1.${idx}`, generated: true, concepts: ["separable-recognition"], difficulty: 2, context: "abstract",
    prompt: `Is $\\frac{dy}{dx} = ${rhs}$ separable? (yes or no)`,
    steps: [{ instruction: "Separable means it factors as (function of $x$)(function of $y$).", answer: sep ? "yes" : "no", accept: [], hint: sep ? "Factor out the pieces." : "A sum of $x$ and $y$ terms doesn't factor that way." }],
    finalAnswer: { value: sep ? "yes" : "no", unit: "" }, solutionNarrative: sep ? `Yes: $\\frac{dy}{dx} = ${a}x \\cdot y$.` : "No — it's a sum, not a product.",
  };
};

// --- Differential Equations: Separable ---------------------------------------
generators["de-exp-model-v1"] = (rng, idx) => {
  const k = rng.int(1, 2), t = rng.int(1, 2), y0 = rng.int(2, 9) * 10;
  const val = round2(y0 * Math.pow(E2, k * t));
  return {
    id: `gen.de-exp-model-v1.${idx}`, generated: true, concepts: ["exponential-model"], difficulty: 2, context: "applied",
    prompt: `Solve $\\frac{dy}{dt} = ${k}y$ with $y(0) = ${y0}$, then find $y(${t})$. (Use $e ≈ 2.718$, round to 2 decimals.)`,
    steps: [{ instruction: "The solution is $y = y_0 e^{kt}$.", answer: `${val}`, accept: [], hint: `$${y0}\\,e^{${k * t}}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y(${t}) = ${y0}e^{${k * t}} ≈ ${val}$.`,
  };
};
generators["de-sep-integrate-v1"] = (rng, idx) => {
  const a = rng.int(1, 5), y0 = rng.int(0, 8), X = rng.int(1, 4);
  // dy/dx = 2a x ; y = a x^2 + C ; y(0)=y0 -> C=y0 ; y(X)=a X^2 + y0
  const val = a * X * X + y0;
  return {
    id: `gen.de-sep-integrate-v1.${idx}`, generated: true, concepts: ["separate-and-integrate"], difficulty: 1, context: "abstract",
    prompt: `Solve $\\frac{dy}{dx} = ${2 * a}x$ with $y(0) = ${y0}$, then find $y(${X})$.`,
    steps: [{ instruction: "Integrate both sides and apply the initial condition.", answer: `${val}`, accept: [], hint: `$y = ${a}x^2 + ${y0}$.` }],
    finalAnswer: { value: `${val}`, unit: "" }, solutionNarrative: `$y(${X}) = ${a}(${X})^2 + ${y0} = ${val}$.`,
  };
};

// --- Differential Equations: Growth, Decay, Cooling --------------------------
generators["de-doubling-v1"] = (rng, idx) => {
  const P = rng.int(1, 9) * 100, D = rng.pick([2, 3, 4]), k = rng.int(1, 4);
  return {
    id: `gen.de-doubling-v1.${idx}`, generated: true, concepts: ["exponential-growth"], difficulty: 1, context: "applied",
    prompt: `A culture of ${P} bacteria doubles every ${D} hours. How many after ${D * k} hours?`,
    steps: [{ instruction: `It doubles ${k} times.`, answer: `${P * 2 ** k}`, accept: [], hint: `$${P} \\times 2^${k}$.` }],
    finalAnswer: { value: `${P * 2 ** k}`, unit: "" }, solutionNarrative: `$${P}\\cdot 2^${k} = ${P * 2 ** k}$.`,
  };
};
generators["de-halflife-v1"] = (rng, idx) => {
  const A = rng.int(1, 8) * 80, H = rng.pick([4, 5, 8, 10]), k = rng.int(1, 4);
  return {
    id: `gen.de-halflife-v1.${idx}`, generated: true, concepts: ["radioactive-decay"], difficulty: 2, context: "applied",
    prompt: `A ${A} mg sample has a half-life of ${H} years. How much remains after ${H * k} years?`,
    steps: [{ instruction: `It halves ${k} times.`, answer: `${A / 2 ** k}`, accept: [], hint: `$${A} / 2^${k}$.` }],
    finalAnswer: { value: `${A / 2 ** k}`, unit: "mg" }, solutionNarrative: `$${A}/2^${k} = ${A / 2 ** k}$ mg.`,
  };
};
generators["de-cooling-v1"] = (rng, idx) => {
  const Ts = rng.int(15, 25), T0 = Ts + rng.int(40, 70), k = rng.pick([0.05, 0.1, 0.2]), t = rng.int(2, 8);
  const val = round2(Ts + (T0 - Ts) * Math.pow(E2, -k * t));
  return {
    id: `gen.de-cooling-v1.${idx}`, generated: true, concepts: ["newtons-cooling"], difficulty: 2, context: "applied",
    prompt: `An object at ${T0}° cools in ${Ts}° surroundings with $T = T_s + (T_0 - T_s)e^{-${k}t}$. Find its temperature after ${t} min. (Use $e ≈ 2.718$, round to 2 decimals.)`,
    steps: [{ instruction: "Substitute into Newton's law of cooling.", answer: `${val}`, accept: [], hint: `$${Ts} + ${T0 - Ts}e^{-${round2(k * t)}}$.` }],
    finalAnswer: { value: `${val}`, unit: "degrees" }, solutionNarrative: `$T(${t}) ≈ ${val}°$.`,
  };
};
generators["de-logistic-v1"] = (rng, idx) => {
  const K = rng.int(2, 12) * 100;
  return {
    id: `gen.de-logistic-v1.${idx}`, generated: true, concepts: ["limiting-and-logistic"], difficulty: 2, context: "applied",
    prompt: `A population follows $\\frac{dP}{dt} = 0.4P\\left(1 - \\frac{P}{${K}}\\right)$. What is the carrying capacity (the value $P$ approaches)?`,
    steps: [{ instruction: "The carrying capacity is where the growth rate is zero (besides $P=0$).", answer: `${K}`, accept: [], hint: "It's the constant in the $(1 - P/K)$ factor." }],
    finalAnswer: { value: `${K}`, unit: "" }, solutionNarrative: `The carrying capacity is ${K}.`,
  };
};

// --- Differential Equations: Second-Order Linear -----------------------------
generators["de-char-eq-v1"] = (rng, idx) => {
  const r1 = nz(rng, -6, 6), r2 = nz(rng, -6, 6), b = -(r1 + r2), c = r1 * r2;
  return {
    id: `gen.de-char-eq-v1.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 2, context: "abstract",
    prompt: `Find the roots of the characteristic equation for $y'' ${signed(b)}y' ${signed(c)}y = 0$.`,
    steps: [{ instruction: "Write $r^2 ${signed(b)}r ${signed(c)} = 0$ and solve.", form: "solutions", answer: `r = ${r1} or r = ${r2}`, accept: [`${r1}, ${r2}`], hint: "Factor the quadratic in $r$." }],
    finalAnswer: { value: `r = ${r1}, ${r2}`, unit: "" }, solutionNarrative: `Roots $r = ${r1}, ${r2}$.`,
  };
};
generators["de-classify-roots-v1"] = (rng, idx) => {
  const type = rng.pick(["real distinct", "repeated", "complex"]);
  let b, c;
  if (type === "real distinct") { const r1 = nz(rng, -5, 5), r2 = nz(rng, -5, 5) + (rng.int(0, 1) ? 1 : -1); b = -(r1 + r2); c = r1 * r2; }
  else if (type === "repeated") { const r = nz(rng, -5, 5); b = -2 * r; c = r * r; }
  else { b = nz(rng, -4, 4); c = b * b / 4 + rng.int(1, 5); } // discriminant negative
  const D = b * b - 4 * c;
  return {
    id: `gen.de-classify-roots-v1.${idx}`, generated: true, concepts: ["classify-roots"], difficulty: 2, context: "abstract",
    prompt: `For $y'' ${signed(b)}y' ${signed(c)}y = 0$, classify the roots (real distinct, repeated, or complex).`,
    steps: [{ instruction: "Check the sign of the discriminant $b^2 - 4c$.", answer: type, accept: [], hint: `$b^2 - 4c = ${D}$; positive → real distinct, zero → repeated, negative → complex.` }],
    finalAnswer: { value: type, unit: "" }, solutionNarrative: `Discriminant ${D}, so ${type} roots.`,
  };
};
generators["de-oscillation-v1"] = (rng, idx) => {
  const w = rng.int(2, 9), m = rng.int(1, 5), k = w * w * m; // omega = sqrt(k/m)
  return {
    id: `gen.de-oscillation-v1.${idx}`, generated: true, concepts: ["oscillation-applied"], difficulty: 2, context: "applied",
    prompt: `A spring-mass system $m y'' + k y = 0$ has $m = ${m}$ and $k = ${k}$. Find the natural (angular) frequency $\\omega = \\sqrt{k/m}$.`,
    steps: [{ instruction: "Compute $\\sqrt{k/m}$.", answer: `${w}`, accept: [], hint: `$\\sqrt{${k}/${m}} = \\sqrt{${k / m}}$.` }],
    finalAnswer: { value: `${w}`, unit: "rad per s" }, solutionNarrative: `$\\omega = \\sqrt{${k}/${m}} = ${w}$.`,
  };
};

// --- Differential Equations: Numerical Methods (Euler) -----------------------
generators["euler-1step-v1"] = (rng, idx) => {
  const a = rng.int(1, 3), b = nz(rng, -3, 3), x0 = rng.int(0, 3), y0 = rng.int(0, 6), h = rng.pick([0.1, 0.5, 1]);
  // y' = a x + b y ; one Euler step
  const y1 = round2(y0 + h * (a * x0 + b * y0));
  return {
    id: `gen.euler-1step-v1.${idx}`, generated: true, concepts: ["eulers-method-single-step"], difficulty: 1, context: "abstract",
    prompt: `Use one step of Euler's method on $y' = ${a}x ${signed(b)}y$ from $(${x0}, ${y0})$ with step size $h = ${h}$. Find $y_1$.`,
    steps: [{ instruction: "$y_1 = y_0 + h \\cdot f(x_0, y_0)$.", answer: `${y1}`, accept: [], hint: `$f(${x0}, ${y0}) = ${a * x0 + b * y0}$; then $${y0} + ${h}(${a * x0 + b * y0})$.` }],
    finalAnswer: { value: `${y1}`, unit: "" }, solutionNarrative: `$y_1 = ${y1}$.`,
  };
};
generators["euler-2step-v1"] = (rng, idx) => {
  const a = rng.int(1, 3), x0 = rng.int(0, 2), y0 = rng.int(1, 6), h = 1;
  // y' = a x  (independent of y) ; two steps
  const y1 = y0 + h * (a * x0), y2 = round2(y1 + h * (a * (x0 + h)));
  return {
    id: `gen.euler-2step-v1.${idx}`, generated: true, concepts: ["eulers-method-multi-step"], difficulty: 2, context: "abstract",
    prompt: `Apply two steps of Euler's method to $y' = ${a}x$ from $(${x0}, ${y0})$ with $h = 1$. Find $y_2$.`,
    steps: [{ instruction: "Take two steps: $y_1 = y_0 + h f(x_0)$, then $y_2 = y_1 + h f(x_1)$.", answer: `${y2}`, accept: [], hint: `$y_1 = ${y1}$ at $x = ${x0 + 1}$; then add $${a}(${x0 + 1})$.` }],
    finalAnswer: { value: `${y2}`, unit: "" }, solutionNarrative: `$y_2 = ${y2}$.`,
  };
};

// --- Differential Equations: Linear First-Order ------------------------------
generators["de-standard-form-v1"] = (rng, idx) => {
  const P = rng.int(2, 8), Q = rng.int(1, 9);
  return {
    id: `gen.de-standard-form-v1.${idx}`, generated: true, concepts: ["standard-form"], difficulty: 1, context: "abstract",
    prompt: `The equation $y' + ${P}y = ${Q}$ is in standard form $y' + P(x)y = Q(x)$. What is $P(x)$?`,
    steps: [{ instruction: "Read off the coefficient of $y$.", answer: `${P}`, accept: [], hint: `It's the number multiplying $y$.` }],
    finalAnswer: { value: `${P}`, unit: "" }, solutionNarrative: `$P(x) = ${P}$.`,
  };
};
generators["de-mixing-steady-v1"] = (rng, idx) => {
  const c = rng.int(2, 10), V = rng.int(20, 200);
  return {
    id: `gen.de-mixing-steady-v1.${idx}`, generated: true, concepts: ["mixing-problems"], difficulty: 2, context: "applied",
    prompt: `Brine containing ${c} g/L of salt flows into a well-mixed ${V} L tank (inflow rate = outflow rate). What is the steady-state amount of salt in the tank?`,
    steps: [{ instruction: "At steady state the tank's concentration matches the inflow: amount = concentration × volume.", answer: `${c * V}`, accept: [], hint: `${c} g/L × ${V} L.` }],
    finalAnswer: { value: `${c * V}`, unit: "grams" }, solutionNarrative: `Steady state: ${c} × ${V} = ${c * V} g.`,
  };
};
generators["de-rc-charge-v1"] = (rng, idx) => {
  const C = rng.int(2, 9), V = rng.int(5, 24);
  return {
    id: `gen.de-rc-charge-v1.${idx}`, generated: true, concepts: ["circuits-and-applied"], difficulty: 2, context: "applied",
    prompt: `An RC circuit satisfies $R\\frac{dQ}{dt} + \\frac{Q}{C} = V$. It charges to a steady-state charge $Q = CV$. With $C = ${C}$ F and $V = ${V}$ V, find the final charge.`,
    steps: [{ instruction: "Steady-state charge is $Q = CV$.", answer: `${C * V}`, accept: [], hint: `${C} × ${V}.` }],
    finalAnswer: { value: `${C * V}`, unit: "coulombs" }, solutionNarrative: `$Q = ${C} \\times ${V} = ${C * V}$ C.`,
  };
};

// --- Matrix Algebra ----------------------------------------------------------
const mat2 = (m) => `[[${m[0][0]}, ${m[0][1]}], [${m[1][0]}, ${m[1][1]}]]`;
const rand2x2 = (rng, lo = -6, hi = 6) => [[rng.int(lo, hi), rng.int(lo, hi)], [rng.int(lo, hi), rng.int(lo, hi)]];

generators["mat-add-v1"] = (rng, idx) => {
  const A = rand2x2(rng), B = rand2x2(rng);
  const S = [[A[0][0] + B[0][0], A[0][1] + B[0][1]], [A[1][0] + B[1][0], A[1][1] + B[1][1]]];
  return {
    id: `gen.mat-add-v1.${idx}`, generated: true, concepts: ["matrix-addition"], difficulty: 1, context: "abstract",
    prompt: `Add: $${mat2(A)} + ${mat2(B)}$. (Write your answer as [[a, b], [c, d]].)`,
    steps: [{ instruction: "Add entry by entry.", answer: mat2(S), accept: [], hint: "Add the numbers in matching positions." }],
    finalAnswer: { value: mat2(S), unit: "" }, solutionNarrative: `${mat2(S)}.`,
  };
};
generators["mat-scalar-v1"] = (rng, idx) => {
  const k = rng.int(2, 5), A = rand2x2(rng, -5, 5);
  const S = [[k * A[0][0], k * A[0][1]], [k * A[1][0], k * A[1][1]]];
  return {
    id: `gen.mat-scalar-v1.${idx}`, generated: true, concepts: ["scalar-multiplication"], difficulty: 1, context: "abstract",
    prompt: `Compute $${k} \\cdot ${mat2(A)}$. (Answer as [[a, b], [c, d]].)`,
    steps: [{ instruction: "Multiply every entry by the scalar.", answer: mat2(S), accept: [], hint: `Each entry times ${k}.` }],
    finalAnswer: { value: mat2(S), unit: "" }, solutionNarrative: `${mat2(S)}.`,
  };
};
generators["mat-dimensions-v1"] = (rng, idx) => {
  const r = rng.int(2, 4), c = rng.int(2, 4);
  return {
    id: `gen.mat-dimensions-v1.${idx}`, generated: true, concepts: ["matrix-dimensions"], difficulty: 1, context: "abstract",
    prompt: `A matrix has ${r} rows and ${c} columns.`,
    steps: [
      { instruction: "How many entries does it have in total?", answer: `${r * c}`, accept: [], hint: `rows × columns.` },
      { instruction: "Is it square? (yes/no)", answer: r === c ? "yes" : "no", accept: [], hint: "Square means rows = columns." },
    ],
    finalAnswer: { value: `${r}×${c}`, unit: "" }, solutionNarrative: `${r}×${c}: ${r * c} entries, ${r === c ? "square" : "not square"}.`,
  };
};
generators["mat-mult-v1"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 4), B = rand2x2(rng, -4, 4);
  const P = [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
  return {
    id: `gen.mat-mult-v1.${idx}`, generated: true, concepts: ["compute-product"], difficulty: 2, context: "abstract",
    prompt: `Multiply: $${mat2(A)}${mat2(B)}$. (Answer as [[a, b], [c, d]].)`,
    steps: [{ instruction: "Each entry is a row of the first times a column of the second.", answer: mat2(P), accept: [], hint: "Row · column dot products." }],
    finalAnswer: { value: mat2(P), unit: "" }, solutionNarrative: `${mat2(P)}.`,
  };
};
generators["mat-defined-v1"] = (rng, idx) => {
  const m = rng.int(2, 4), n = rng.int(2, 4), p = rng.int(2, 4), q = rng.int(2, 4);
  const ok = n === p;
  return {
    id: `gen.mat-defined-v1.${idx}`, generated: true, concepts: ["when-defined"], difficulty: 1, context: "abstract",
    prompt: `Is the product of a ${m}×${n} matrix and a ${p}×${q} matrix defined? (yes/no)`,
    steps: [{ instruction: "The product is defined when the inner dimensions match.", answer: ok ? "yes" : "no", accept: [], hint: `Inner dimensions are ${n} and ${p}.` }],
    finalAnswer: { value: ok ? "yes" : "no", unit: "" }, solutionNarrative: ok ? `Yes (inner dims match); result is ${m}×${q}.` : `No: ${n} ≠ ${p}.`,
  };
};
generators["det2-v1"] = (rng, idx) => {
  const A = rand2x2(rng, -7, 7), det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return {
    id: `gen.det2-v1.${idx}`, generated: true, concepts: ["determinant-2x2"], difficulty: 1, context: "abstract",
    prompt: `Find the determinant of $${mat2(A)}$.`,
    steps: [{ instruction: "$\\det = ad - bc$.", answer: `${det}`, accept: [], hint: `(${A[0][0]})(${A[1][1]}) − (${A[0][1]})(${A[1][0]}).` }],
    finalAnswer: { value: `${det}`, unit: "" }, solutionNarrative: `$\\det = ${det}$.`,
  };
};
generators["det3-v1"] = (rng, idx) => {
  const M = [[rng.int(-3, 4), rng.int(-3, 4), rng.int(-3, 4)], [rng.int(-3, 4), rng.int(-3, 4), rng.int(-3, 4)], [rng.int(-3, 4), rng.int(-3, 4), rng.int(-3, 4)]];
  const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  return {
    id: `gen.det3-v1.${idx}`, generated: true, concepts: ["determinant-3x3"], difficulty: 2, context: "abstract",
    prompt: `Find the determinant of $\\begin{bmatrix} ${M[0].join(" & ")} \\\\ ${M[1].join(" & ")} \\\\ ${M[2].join(" & ")} \\end{bmatrix}$.`,
    steps: [{ instruction: "Expand along the first row using cofactors.", answer: `${det}`, accept: [], hint: "det = a(ei−fh) − b(di−fg) + c(dh−eg)." }],
    finalAnswer: { value: `${det}`, unit: "" }, solutionNarrative: `$\\det = ${det}$.`,
  };
};
generators["det-invertible-v1"] = (rng, idx) => {
  const singular = rng.int(0, 1) === 0;
  let A;
  if (singular) { const a = rng.int(1, 4), b = rng.int(1, 4), k = rng.int(2, 3); A = [[a, b], [k * a, k * b]]; } // det 0
  else { A = rand2x2(rng, 1, 5); if (A[0][0] * A[1][1] - A[0][1] * A[1][0] === 0) A[0][0] += 1; }
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return {
    id: `gen.det-invertible-v1.${idx}`, generated: true, concepts: ["determinant-and-invertibility"], difficulty: 2, context: "abstract",
    prompt: `Is $${mat2(A)}$ invertible? (yes/no)`,
    steps: [
      { instruction: "Compute the determinant.", answer: `${det}`, accept: [], hint: "$ad - bc$." },
      { instruction: "Invertible? (yes/no)", answer: det !== 0 ? "yes" : "no", accept: [], hint: "Invertible exactly when the determinant is nonzero." },
    ],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det = ${det}, so ${det !== 0 ? "invertible" : "singular"}.`,
  };
};
generators["inverse-2x2-v1"] = (rng, idx) => {
  const b = rng.int(1, 4), c = rng.int(1, 4), A = [[1, b], [c, 1 + b * c]]; // det = 1
  const inv = [[1 + b * c, -b], [-c, 1]];
  return {
    id: `gen.inverse-2x2-v1.${idx}`, generated: true, concepts: ["inverse-2x2"], difficulty: 2, context: "abstract",
    prompt: `Find the inverse of $${mat2(A)}$ (its determinant is 1). Answer as [[a, b], [c, d]].`,
    steps: [{ instruction: "For a 2×2 with det 1, the inverse is [[d, −b], [−c, a]].", answer: mat2(inv), accept: [], hint: "Swap the diagonal, negate the off-diagonal." }],
    finalAnswer: { value: mat2(inv), unit: "" }, solutionNarrative: `${mat2(inv)}.`,
  };
};
generators["solve-system-2x2-v1"] = (rng, idx) => {
  const x = nz(rng, -6, 6), y = nz(rng, -6, 6), a = rng.int(1, 4), b = nz(rng, -4, 4), c = nz(rng, -4, 4), d = rng.int(1, 4);
  if (a * d - b * c === 0) return generators["solve-system-2x2-v1"](rng, idx + 1);
  const e = a * x + b * y, f = c * x + d * y;
  return {
    id: `gen.solve-system-2x2-v1.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 2, context: "abstract",
    prompt: `Solve the system $\\begin{cases} ${a}x ${signed(b)}y = ${e} \\\\ ${c}x ${signed(d)}y = ${f} \\end{cases}$ (answer as an ordered pair).`,
    steps: [{ instruction: "Use elimination or substitution.", answer: `(${x}, ${y})`, accept: [`x=${x}, y=${y}`], hint: "Eliminate one variable." }],
    finalAnswer: { value: `(${x}, ${y})`, unit: "" }, solutionNarrative: `$(${x}, ${y})$.`,
  };
};
generators["transform-apply-v1"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 4), v = [rng.int(-5, 5), rng.int(-5, 5)];
  const r = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
  return {
    id: `gen.transform-apply-v1.${idx}`, generated: true, concepts: ["apply-transformation"], difficulty: 1, context: "abstract",
    prompt: `Apply the transformation $${mat2(A)}$ to the vector $\\langle ${v.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Multiply the matrix by the vector.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Each output = row · vector." }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};
generators["rotation-v1"] = (rng, idx) => {
  const x = nz(rng, -6, 6), y = nz(rng, -6, 6), deg = rng.pick([90, 180, 270]);
  const r = deg === 90 ? [-y, x] : deg === 180 ? [-x, -y] : [y, -x];
  return {
    id: `gen.rotation-v1.${idx}`, generated: true, concepts: ["rotation-reflection-scaling"], difficulty: 2, context: "applied",
    prompt: `Rotate the point $(${x}, ${y})$ by $${deg}°$ counterclockwise about the origin.`,
    steps: [{ instruction: `Use the ${deg}° rotation rule.`, answer: `(${r.join(", ")})`, accept: [`<${r.join(", ")}>`], hint: deg === 90 ? "$(x, y) \\to (-y, x)$." : deg === 180 ? "$(x, y) \\to (-x, -y)$." : "$(x, y) \\to (y, -x)$." }],
    finalAnswer: { value: `(${r.join(", ")})`, unit: "" }, solutionNarrative: `$(${r.join(", ")})$.`,
  };
};

generators["invertibility-test-v1"] = (rng, idx) => {
  const singular = rng.int(0, 1) === 0;
  let A;
  if (singular) { const a = rng.int(1, 4), b = rng.int(1, 4), k = rng.int(2, 3); A = [[a, b], [k * a, k * b]]; }
  else { A = [[1, rng.int(1, 4)], [rng.int(1, 4), rng.int(3, 8)]]; if (A[0][0] * A[1][1] - A[0][1] * A[1][0] === 0) A[1][1] += 1; }
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return {
    id: `gen.invertibility-test-v1.${idx}`, generated: true, concepts: ["invertibility-test"], difficulty: 1, context: "abstract",
    prompt: `Is the matrix $${mat2(A)}$ invertible? (yes/no)`,
    steps: [{ instruction: "A 2×2 matrix is invertible exactly when its determinant is nonzero.", answer: det !== 0 ? "yes" : "no", accept: [], hint: `det $= ${det}$.` }],
    finalAnswer: { value: det !== 0 ? "yes" : "no", unit: "" }, solutionNarrative: `det = ${det}, so ${det !== 0 ? "invertible" : "not invertible"}.`,
  };
};
generators["solve-with-inverse-v1"] = (rng, idx) => {
  const b = rng.int(1, 3), c = rng.int(1, 3), A = [[1, b], [c, 1 + b * c]]; // det 1
  const x = nz(rng, -5, 5), y = nz(rng, -5, 5);
  const e = A[0][0] * x + A[0][1] * y, f = A[1][0] * x + A[1][1] * y; // b-vector = A·x
  return {
    id: `gen.solve-with-inverse-v1.${idx}`, generated: true, concepts: ["solve-with-inverse"], difficulty: 2, context: "abstract",
    prompt: `Solve $A\\vec{x} = \\vec{b}$ where $A = ${mat2(A)}$ and $\\vec{b} = \\langle ${e}, ${f} \\rangle$, using $\\vec{x} = A^{-1}\\vec{b}$. (Answer as an ordered pair.)`,
    steps: [{ instruction: "Multiply $A^{-1}$ by $\\vec{b}$ (the inverse is [[d, −b], [−c, a]] since det = 1).", answer: `(${x}, ${y})`, accept: [`<${x}, ${y}>`], hint: `$A^{-1} = ${mat2([[1 + b * c, -b], [-c, 1]])}$.` }],
    finalAnswer: { value: `(${x}, ${y})`, unit: "" }, solutionNarrative: `$\\vec{x} = (${x}, ${y})$.`,
  };
};

// --- Linear Algebra ----------------------------------------------------------
const MAG2 = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]];
generators["lin-comb-v1"] = (rng, idx) => {
  const s = nz(rng, -3, 4), t = nz(rng, -3, 4), u = [rng.int(-4, 4), rng.int(-4, 4)], v = [rng.int(-4, 4), rng.int(-4, 4)];
  const r = [s * u[0] + t * v[0], s * u[1] + t * v[1]];
  return {
    id: `gen.lin-comb-v1.${idx}`, generated: true, concepts: ["linear-combinations"], difficulty: 1, context: "abstract",
    prompt: `Compute $${s}\\langle ${u.join(", ")} \\rangle ${signed(t)}\\langle ${v.join(", ")} \\rangle$.`,
    steps: [{ instruction: "Scale each vector and add.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Component by component." }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};
generators["span-membership-v1"] = (rng, idx) => {
  const v = [rng.int(1, 4), rng.int(1, 4)], inSpan = rng.int(0, 1) === 0;
  const u = inSpan ? [rng.int(2, 3) * v[0], 0].map((_, i) => rng.int(2, 3) * v[i]) : [v[0] + 1, v[1] + nz(rng, -2, 2)];
  const k = inSpan ? u[0] / v[0] : null;
  const uu = inSpan ? [k * v[0], k * v[1]] : [v[0] * 2 + 1, v[1] * 2];
  return {
    id: `gen.span-membership-v1.${idx}`, generated: true, concepts: ["span-membership"], difficulty: 1, context: "abstract",
    prompt: `Is $\\langle ${uu.join(", ")} \\rangle$ in the span of $\\langle ${v.join(", ")} \\rangle$? (i.e. is it a scalar multiple?) (yes/no)`,
    steps: [{ instruction: "Check whether one vector is a constant multiple of the other.", answer: inSpan ? "yes" : "no", accept: [], hint: "Divide matching components — are the ratios equal?" }],
    finalAnswer: { value: inSpan ? "yes" : "no", unit: "" }, solutionNarrative: inSpan ? `Yes, it's ${k}× the vector.` : "No, the component ratios differ.",
  };
};
generators["indep-det-v1"] = (rng, idx) => {
  const dep = rng.int(0, 1) === 0;
  const u = [rng.int(1, 4), rng.int(1, 4)];
  const v = dep ? [rng.int(2, 3) * u[0], rng.int(2, 3) * u[0] / u[0] * u[1]].map((_, i) => 2 * u[i]) : [rng.int(1, 4), rng.int(1, 4) + 1];
  const vv = dep ? [2 * u[0], 2 * u[1]] : [u[1] + 1, u[0]];
  const det = u[0] * vv[1] - u[1] * vv[0];
  return {
    id: `gen.indep-det-v1.${idx}`, generated: true, concepts: ["determinant-method"], difficulty: 2, context: "abstract",
    prompt: `Are $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${vv.join(", ")} \\rangle$ linearly independent? (Use the determinant.)`,
    steps: [
      { instruction: "Compute the determinant of the matrix with these as columns.", answer: `${det}`, accept: [], hint: `$u_1 v_2 - u_2 v_1$.` },
      { instruction: "Independent or dependent?", answer: det !== 0 ? "independent" : "dependent", accept: [], hint: "Nonzero determinant → independent." },
    ],
    finalAnswer: { value: det !== 0 ? "independent" : "dependent", unit: "" }, solutionNarrative: `det = ${det}, so ${det !== 0 ? "independent" : "dependent"}.`,
  };
};
generators["rank-nullity-v1"] = (rng, idx) => {
  const n = rng.int(3, 6), r = rng.int(1, n - 1);
  return {
    id: `gen.rank-nullity-v1.${idx}`, generated: true, concepts: ["dimension-and-rank"], difficulty: 2, context: "abstract",
    prompt: `A matrix has ${n} columns and rank ${r}. By the rank–nullity theorem, what is the dimension of its null space (the nullity)?`,
    steps: [{ instruction: "Nullity = (number of columns) − rank.", answer: `${n - r}`, accept: [], hint: `${n} − ${r}.` }],
    finalAnswer: { value: `${n - r}`, unit: "" }, solutionNarrative: `Nullity $= ${n} - ${r} = ${n - r}$.`,
  };
};
generators["basis-count-v1"] = (rng, idx) => {
  const n = rng.int(2, 6);
  return {
    id: `gen.basis-count-v1.${idx}`, generated: true, concepts: ["basis-test"], difficulty: 1, context: "abstract",
    prompt: `How many vectors are in a basis for $\\mathbb{R}^{${n}}$?`,
    steps: [{ instruction: "A basis for $\\mathbb{R}^n$ has exactly $n$ vectors.", answer: `${n}`, accept: [], hint: "It equals the dimension of the space." }],
    finalAnswer: { value: `${n}`, unit: "" }, solutionNarrative: `$\\dim \\mathbb{R}^{${n}} = ${n}$.`,
  };
};
generators["apply-T-v1"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 4), v = [rng.int(-5, 5), rng.int(-5, 5)];
  const r = [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
  return {
    id: `gen.apply-T-v1.${idx}`, generated: true, concepts: ["apply-and-compose"], difficulty: 1, context: "abstract",
    prompt: `A linear transformation has matrix $${mat2(A)}$. Find $T(\\langle ${v.join(", ")} \\rangle)$.`,
    steps: [{ instruction: "Multiply the matrix by the vector.", answer: `<${r.join(", ")}>`, accept: [`(${r.join(", ")})`], hint: "Each output entry is a row · the vector." }],
    finalAnswer: { value: `<${r.join(", ")}>`, unit: "" }, solutionNarrative: `$\\langle ${r.join(", ")} \\rangle$.`,
  };
};
generators["find-eigenvalues-v1"] = (rng, idx) => {
  const l1 = nz(rng, -5, 6), l2 = nz(rng, -5, 6), k = rng.int(1, 4);
  const A = [[l1, k], [0, l2]]; // triangular -> eigenvalues on the diagonal
  return {
    id: `gen.find-eigenvalues-v1.${idx}`, generated: true, concepts: ["find-eigenvalues"], difficulty: 2, context: "abstract",
    prompt: `Find the eigenvalues of $${mat2(A)}$.`,
    steps: [{ instruction: "For a triangular matrix the eigenvalues are the diagonal entries.", form: "solutions", answer: `lambda = ${l1} or lambda = ${l2}`, accept: [`${l1}, ${l2}`], hint: "Read them off the main diagonal." }],
    finalAnswer: { value: `${l1}, ${l2}`, unit: "" }, solutionNarrative: `Eigenvalues $${l1}$ and $${l2}$.`,
  };
};
generators["char-equation-v1"] = (rng, idx) => {
  const A = rand2x2(rng, -4, 5), tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return {
    id: `gen.char-equation-v1.${idx}`, generated: true, concepts: ["characteristic-equation"], difficulty: 2, context: "abstract",
    prompt: `The characteristic equation of a 2×2 matrix is $\\lambda^2 - (\\text{tr})\\lambda + \\det = 0$. For $${mat2(A)}$:`,
    steps: [
      { instruction: "What is the trace?", answer: `${tr}`, accept: [], hint: "Sum of the diagonal entries." },
      { instruction: "What is the determinant?", answer: `${det}`, accept: [], hint: "$ad - bc$." },
    ],
    finalAnswer: { value: `tr ${tr}, det ${det}`, unit: "" }, solutionNarrative: `$\\lambda^2 - ${tr}\\lambda + ${det} = 0$.`,
  };
};
generators["orthogonality-test-v1"] = (rng, idx) => {
  const orth = rng.int(0, 1) === 0, u = [rng.int(1, 5), rng.int(1, 5)];
  const v = orth ? [-u[1], u[0]] : [rng.int(1, 5), rng.int(1, 5)];
  const dot = u[0] * v[0] + u[1] * v[1];
  return {
    id: `gen.orthogonality-test-v1.${idx}`, generated: true, concepts: ["orthogonality-test"], difficulty: 1, context: "abstract",
    prompt: `Are $\\langle ${u.join(", ")} \\rangle$ and $\\langle ${v.join(", ")} \\rangle$ orthogonal? (yes/no)`,
    steps: [{ instruction: "Vectors are orthogonal when their dot product is 0.", answer: dot === 0 ? "yes" : "no", accept: [], hint: `Dot product $= ${dot}$.` }],
    finalAnswer: { value: dot === 0 ? "yes" : "no", unit: "" }, solutionNarrative: `Dot product ${dot}, so ${dot === 0 ? "orthogonal" : "not orthogonal"}.`,
  };
};
generators["normalize-v1"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2);
  const sa = rng.int(0, 1) ? a : -a, sb = rng.int(0, 1) ? b : -b;
  return {
    id: `gen.normalize-v1.${idx}`, generated: true, concepts: ["orthonormal-and-normalize"], difficulty: 2, context: "abstract",
    prompt: `Find the unit vector in the direction of $\\langle ${sa}, ${sb} \\rangle$. (Use fractions.)`,
    steps: [{ instruction: "Divide each component by the magnitude.", answer: `<${frac(sa, mag)}, ${frac(sb, mag)}>`, accept: [`(${frac(sa, mag)}, ${frac(sb, mag)})`], hint: `The magnitude is ${mag}.` }],
    finalAnswer: { value: `<${frac(sa, mag)}, ${frac(sb, mag)}>`, unit: "" }, solutionNarrative: `$\\langle ${frac(sa, mag)}, ${frac(sb, mag)} \\rangle$.`,
  };
};
generators["projection-scalar-v1"] = (rng, idx) => {
  const [a, b, mag] = rng.pick(MAG2), u = [rng.int(-5, 6), rng.int(-5, 6)];
  const comp = round2((u[0] * a + u[1] * b) / mag);
  return {
    id: `gen.projection-scalar-v1.${idx}`, generated: true, concepts: ["projections"], difficulty: 2, context: "abstract",
    prompt: `Find the scalar projection (component) of $\\vec{u} = \\langle ${u.join(", ")} \\rangle$ onto $\\vec{v} = \\langle ${a}, ${b} \\rangle$. (Round to 2 decimals.)`,
    steps: [{ instruction: "Scalar projection $= \\dfrac{\\vec{u}\\cdot\\vec{v}}{|\\vec{v}|}$.", answer: `${comp}`, accept: [], hint: `$\\vec{u}\\cdot\\vec{v} = ${u[0] * a + u[1] * b}$, $|\\vec{v}| = ${mag}$.` }],
    finalAnswer: { value: `${comp}`, unit: "" }, solutionNarrative: `$\\frac{${u[0] * a + u[1] * b}}{${mag}} = ${comp}$.`,
  };
};

// Simplify a rational expression by factoring and cancelling (grader now compares
// rational functions, so it accepts both the simplified and original forms).
generators["simplify-rational-v1"] = (rng, idx) => {
  let p, q;
  do { p = nz(rng, -5, 5); q = nz(rng, -5, 5); } while (p + q === 0);
  const b = p + q, c = p * q;
  return {
    id: `gen.simplify-rational-v1.${idx}`, generated: true, concepts: ["simplify-rational"], difficulty: 2, context: "abstract",
    prompt: `Simplify: $\\dfrac{x^2 ${signed(b)}x ${signed(c)}}{x ${signed(p)}}$`,
    steps: [{ instruction: "Factor the numerator and cancel the common factor.", answer: `x ${signed(q)}`, accept: [], hint: `The numerator factors as $(x ${signed(p)})(x ${signed(q)})$.` }],
    finalAnswer: { value: `x ${signed(q)}`, unit: "" }, solutionNarrative: `$(x ${signed(p)})(x ${signed(q)})/(x ${signed(p)}) = x ${signed(q)}$.`,
  };
};

// Merge the coverage-fill packs into the registry. Placed after all inline
// generator definitions so a name collision would favor an explicit definition
// here (there are none — fill packs use the def-*/laf-* prefixes).
Object.assign(generators, deFill, linAlgFill,
  algGraphFill, calc1Fill, geoFill, deFill2, linAlgFill2, trigFill, trig2Fill,
  geoProofFill, calc3ProofFill, crypto1Fill, crypto2Fill, crypto3Fill, crypto4Fill,
  discreteFill, statsFill,
  alg2Fill, trig3Fill, calc1bFill, calc2Fill, calc3vFill, lapGsFill, stats2Fill);

export function hasGenerator(template) {
  return Object.prototype.hasOwnProperty.call(generators, template);
}

export function generate(template, rng, idx) {
  if (!hasGenerator(template)) return null;
  return generators[template](rng, idx);
}
