// gen-calc2-fill.js
// Self-contained generator pack for three Calculus 2 topics:
//   - calculus-2.partial-fractions    (templates prefixed c2f-decompose-*, c2f-pf-*)
//   - calculus-2.improper-integrals   (templates prefixed c2f-improper-*)
//   - calculus-2.taylor-series        (templates prefixed c2f-taylor-*, c2f-maclaurin-*)
// One generator per (concept, difficulty) — 36 total. Exports a `fill` map of
// template-name -> generator fn matching the shape used by js/generator.js
// (same pattern as gen-calc1-fill.js). Deterministic from the passed rng only;
// no imports from generator.js.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string, sign carried on the numerator: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Linear factor as a plain/LaTeX-safe string: fac(1) -> "x - 1", fac(-2) -> "x + 2", fac(0) -> "x".
const fac = (r) => (r === 0 ? "x" : r > 0 ? `x - ${r}` : `x + ${-r}`);
// "px + q" display string (p or q may be 0, not both).
const lin = (p, q, v = "x") => {
  let s = "";
  if (p !== 0) s = p === 1 ? v : p === -1 ? `-${v}` : `${p}${v}`;
  if (q !== 0) s += s === "" ? `${q}` : q > 0 ? ` + ${q}` : ` - ${-q}`;
  return s === "" ? "0" : s;
};
// "x^2 + sx + t" display string.
const quad = (s, t) => {
  let out = "x^2";
  if (s !== 0) out += s > 0 ? ` + ${s === 1 ? "" : s}x` : ` - ${s === -1 ? "" : -s}x`;
  if (t !== 0) out += t > 0 ? ` + ${t}` : ` - ${-t}`;
  return out;
};
// Coefficient prefix that hides 1/-1: coef(1) -> "", coef(-3) -> "-3".
const coef = (k) => (k === 1 ? "" : k === -1 ? "-" : `${k}`);
// Partial-fraction sum "A/(x - r1) + B/(x - r2)" with the second sign folded in.
const pf2 = (A, r1, B, r2) => `${A}/(${fac(r1)}) ${B >= 0 ? "+" : "-"} ${Math.abs(B)}/(${fac(r2)})`;
// Log antiderivative "A ln|x-r1| + B ln|x-r2| + C" with generous variants.
const logTerm = (k, r) => `${coef(k)}ln|${fac(r)}|`;
const logTermP = (k, r) => `${coef(k)}ln(${fac(r)})`;
const logAnti = (A, r1, B, r2) => {
  const t2 = `${coef(Math.abs(B))}ln|${fac(r2)}|`;
  return `${logTerm(A, r1)} ${B >= 0 ? "+" : "-"} ${t2} + C`;
};
const logAntiP = (A, r1, B, r2) => {
  const t2 = `${coef(Math.abs(B))}ln(${fac(r2)})`;
  return `${logTermP(A, r1)} ${B >= 0 ? "+" : "-"} ${t2} + C`;
};
// Round v to k decimals, avoiding "-0.00"; returns string.
const rnd = (v, k) => {
  let s = v.toFixed(k);
  if (parseFloat(s) === 0) s = (0).toFixed(k);
  return s;
};
// Neighboring rounded strings for generous accepts.
const nbrs = (v, k) => {
  const step = Math.pow(10, -k);
  return [rnd(v + step, k), rnd(v - step, k), rnd(v, k + 1)];
};

export const fill = {};

// ============================================================================
// Topic A: calculus-2.partial-fractions
// ============================================================================

// --- decompose-distinct-linear ----------------------------------------------

// d1: factored denominator given; cover-up finds A and B.
fill["c2f-decompose-linear-1"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-3, 3); r2 = rng.int(-3, 3);
    A = rng.int(-4, 4); B = rng.int(-4, 4);
  } while (r1 === r2 || A === 0 || B === 0);
  const p = A + B, q = -(A * r2 + B * r1);
  const num = lin(p, q);
  return {
    id: `gen.c2f-decompose-linear-1.${idx}`, generated: true, concepts: ["decompose-distinct-linear"], difficulty: 1, context: "abstract",
    prompt: `Decompose $\\dfrac{${num}}{(${fac(r1)})(${fac(r2)})} = \\dfrac{A}{${fac(r1)}} + \\dfrac{B}{${fac(r2)}}$. Find the constants $A$ and $B$.`,
    steps: [
      { instruction: `Clear denominators to get $${num} = A(${fac(r2)}) + B(${fac(r1)})$. Substitute $x = ${r1}$ to find $A$.`, answer: `${A}`, accept: [`A=${A}`, `A = ${A}`], hint: `At $x = ${r1}$ the $B$ term vanishes: $${p * r1 + q} = A(${r1 - r2})$.` },
      { instruction: `Substitute $x = ${r2}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`, `B = ${B}`], hint: `At $x = ${r2}$ the $A$ term vanishes: $${p * r2 + q} = B(${r2 - r1})$.` },
      { instruction: `Write the full decomposition. (Type it like ${pf2(A, r1, B, r2)}.)`, answer: pf2(A, r1, B, r2), accept: [pf2(A, r1, B, r2).replace(/\s+/g, ""), `${B >= 0 ? "" : "-"}${Math.abs(B)}/(${fac(r2)}) ${A >= 0 ? "+" : "-"} ${Math.abs(A)}/(${fac(r1)})`], hint: `Place $A = ${A}$ over $${fac(r1)}$ and $B = ${B}$ over $${fac(r2)}$.` },
    ],
    finalAnswer: { value: pf2(A, r1, B, r2), unit: "" },
    solutionNarrative: `Cover-up at $x = ${r1}$ gives $A = ${A}$; at $x = ${r2}$ it gives $B = ${B}$. So the fraction splits as $\\frac{${A}}{${fac(r1)}} ${B >= 0 ? "+" : "-"} \\frac{${Math.abs(B)}}{${fac(r2)}}$.`,
  };
};

// d2: denominator arrives expanded — factor first, then cover-up.
fill["c2f-decompose-linear-2"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-4, 4); r2 = rng.int(-4, 4);
    A = rng.int(-4, 4); B = rng.int(-4, 4);
  } while (r1 <= r2 || A === 0 || B === 0);
  const p = A + B, q = -(A * r2 + B * r1);
  const num = lin(p, q);
  const den = quad(-(r1 + r2), r1 * r2);
  return {
    id: `gen.c2f-decompose-linear-2.${idx}`, generated: true, concepts: ["decompose-distinct-linear"], difficulty: 2, context: "abstract",
    prompt: `Decompose $\\dfrac{${num}}{${den}}$ into partial fractions.`,
    steps: [
      { instruction: "Factor the denominator into two linear factors.", answer: `(${fac(r1)})(${fac(r2)})`, accept: [`(${fac(r2)})(${fac(r1)})`], form: "factored", hint: `Find two numbers that multiply to ${r1 * r2} and sum to ${r1 + r2}: they are ${r1} and ${r2}, giving roots $x = ${r1}$ and $x = ${r2}$.` },
      { instruction: `With $\\dfrac{${num}}{(${fac(r1)})(${fac(r2)})} = \\dfrac{A}{${fac(r1)}} + \\dfrac{B}{${fac(r2)}}$, substitute $x = ${r1}$ to find $A$.`, answer: `${A}`, accept: [`A=${A}`], hint: `$${num.replace(/x/g, `(${r1})`)} = A(${r1 - r2})$.` },
      { instruction: `Substitute $x = ${r2}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`], hint: `$${num.replace(/x/g, `(${r2})`)} = B(${r2 - r1})$.` },
    ],
    finalAnswer: { value: `A = ${A}, B = ${B}`, unit: "" },
    solutionNarrative: `$${den} = (${fac(r1)})(${fac(r2)})$. Cover-up gives $A = ${A}$ and $B = ${B}$.`,
  };
};

// d3: larger coefficients, full pipeline ending in the decomposition string.
fill["c2f-decompose-linear-3"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-5, 5); r2 = rng.int(-5, 5);
    A = rng.int(-6, 6); B = rng.int(-6, 6);
  } while (r1 <= r2 || A === 0 || B === 0 || Math.abs(A) < 2 || Math.abs(B) < 2);
  const p = A + B, q = -(A * r2 + B * r1);
  const num = lin(p, q);
  const den = quad(-(r1 + r2), r1 * r2);
  const dec = pf2(A, r1, B, r2);
  return {
    id: `gen.c2f-decompose-linear-3.${idx}`, generated: true, concepts: ["decompose-distinct-linear"], difficulty: 3, context: "abstract",
    prompt: `Fully decompose $\\dfrac{${num}}{${den}}$: factor the denominator, find both constants, and write the result.`,
    steps: [
      { instruction: "Factor the denominator.", answer: `(${fac(r1)})(${fac(r2)})`, accept: [`(${fac(r2)})(${fac(r1)})`], form: "factored", hint: `The roots are $x = ${r1}$ and $x = ${r2}$.` },
      { instruction: `Use the cover-up method at $x = ${r1}$ to find $A$ (the constant over $${fac(r1)}$).`, answer: `${A}`, accept: [`A=${A}`], hint: `Cover $(${fac(r1)})$ and evaluate the rest at $x = ${r1}$: $\\dfrac{${p * r1 + q}}{${r1 - r2}}$.` },
      { instruction: `Use the cover-up method at $x = ${r2}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`], hint: `Cover $(${fac(r2)})$ and evaluate at $x = ${r2}$: $\\dfrac{${p * r2 + q}}{${r2 - r1}}$.` },
      { instruction: `Write the full decomposition. (Type it like ${dec}.)`, answer: dec, accept: [dec.replace(/\s+/g, ""), `${B >= 0 ? "" : "-"}${Math.abs(B)}/(${fac(r2)}) ${A >= 0 ? "+" : "-"} ${Math.abs(A)}/(${fac(r1)})`], hint: `$A = ${A}$ over the first factor, $B = ${B}$ over the second.` },
    ],
    finalAnswer: { value: dec, unit: "" },
    solutionNarrative: `Factor: $(${fac(r1)})(${fac(r2)})$. Cover-up: $A = ${A}$, $B = ${B}$, so the fraction is $\\frac{${A}}{${fac(r1)}} ${B >= 0 ? "+" : "-"} \\frac{${Math.abs(B)}}{${fac(r2)}}$.`,
  };
};

// --- decompose-repeated-and-improper ----------------------------------------

// d1: repeated linear factor (px+q)/(x-r)^2 = A/(x-r) + B/(x-r)^2.
fill["c2f-decompose-repeated-1"] = (rng, idx) => {
  let p, q, r, B;
  do {
    p = rng.int(1, 5); r = rng.int(-3, 3); q = rng.int(-6, 6);
    B = p * r + q;
  } while (r === 0 || B === 0);
  const num = lin(p, q);
  return {
    id: `gen.c2f-decompose-repeated-1.${idx}`, generated: true, concepts: ["decompose-repeated-and-improper"], difficulty: 1, context: "abstract",
    prompt: `Decompose $\\dfrac{${num}}{(${fac(r)})^2} = \\dfrac{A}{${fac(r)}} + \\dfrac{B}{(${fac(r)})^2}$. Find $A$ and $B$.`,
    steps: [
      { instruction: `Clear denominators: $${num} = A(${fac(r)}) + B$. Compare the coefficients of $x$ to find $A$.`, answer: `${p}`, accept: [`A=${p}`], hint: `The only $x$ on the right comes from $A\\,x$, so $A$ equals the $x$-coefficient of the numerator.` },
      { instruction: `Substitute $x = ${r}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`], hint: `At $x = ${r}$ the $A$ term vanishes: $B = ${p}(${r}) ${q >= 0 ? "+" : "-"} ${Math.abs(q)}$.` },
    ],
    finalAnswer: { value: `A = ${p}, B = ${B}`, unit: "" },
    solutionNarrative: `From $${num} = A(${fac(r)}) + B$: matching $x$-coefficients gives $A = ${p}$; setting $x = ${r}$ gives $B = ${B}$.`,
  };
};

// d2: improper fraction — divide first: (x^2 + bx + c)/(x - r).
fill["c2f-decompose-repeated-2"] = (rng, idx) => {
  let b, c, r, rem;
  do {
    b = rng.int(-5, 5); c = rng.int(-8, 8); r = rng.int(-3, 3);
    rem = r * r + b * r + c;
  } while (r === 0 || rem === 0 || b + r === 0);
  const num = quad(b, c);
  const quot = lin(1, b + r);
  const rewrite = `${quot} ${rem >= 0 ? "+" : "-"} ${Math.abs(rem)}/(${fac(r)})`;
  return {
    id: `gen.c2f-decompose-repeated-2.${idx}`, generated: true, concepts: ["decompose-repeated-and-improper"], difficulty: 2, context: "abstract",
    prompt: `The fraction $\\dfrac{${num}}{${fac(r)}}$ is improper (the top's degree isn't below the bottom's). Divide first, then write it as polynomial + proper fraction.`,
    steps: [
      { instruction: `Divide $${num}$ by $${fac(r)}$. What is the quotient?`, answer: quot, accept: [quot.replace(/\s+/g, "")], hint: `$x^2 \\div x = x$; then $(${b} ${r >= 0 ? "+" : "-"} ${Math.abs(r)})x \\div x = ${b + r}$.` },
      { instruction: "What is the remainder?", answer: `${rem}`, accept: [], hint: `Evaluate the numerator at $x = ${r}$ (remainder theorem): $${r}^2 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}(${r}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$.` },
      { instruction: `Write the rewritten form. (Type it like ${rewrite}.)`, answer: rewrite, accept: [rewrite.replace(/\s+/g, ""), `(${quot}) ${rem >= 0 ? "+" : "-"} ${Math.abs(rem)}/(${fac(r)})`], hint: "quotient + remainder/(divisor)." },
    ],
    finalAnswer: { value: rewrite, unit: "" },
    solutionNarrative: `Long division gives quotient $${quot}$ and remainder $${rem}$, so $\\dfrac{${num}}{${fac(r)}} = ${quot} ${rem >= 0 ? "+" : "-"} \\dfrac{${Math.abs(rem)}}{${fac(r)}}$.`,
  };
};

// d3: improper over a factored quadratic — divide (quotient 1), then decompose.
fill["c2f-decompose-repeated-3"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-3, 3); r2 = rng.int(-3, 3);
    A = rng.int(-4, 4); B = rng.int(-4, 4);
  } while (r1 <= r2 || A === 0 || B === 0);
  // numerator = (x-r1)(x-r2) + A(x-r2) + B(x-r1)
  const nb = A + B - r1 - r2;
  const nc = r1 * r2 - A * r2 - B * r1;
  const num = quad(nb, nc);
  return {
    id: `gen.c2f-decompose-repeated-3.${idx}`, generated: true, concepts: ["decompose-repeated-and-improper"], difficulty: 3, context: "abstract",
    prompt: `Write $\\dfrac{${num}}{(${fac(r1)})(${fac(r2)})}$ as (polynomial) $+ \\dfrac{A}{${fac(r1)}} + \\dfrac{B}{${fac(r2)}}$. The degrees match, so divide first.`,
    steps: [
      { instruction: "Numerator and denominator are both degree 2, so the quotient is a constant. What is it?", answer: "1", accept: [], hint: "The leading terms are both $x^2$, so the quotient is $x^2/x^2 = 1$." },
      { instruction: `Subtracting $1 \\cdot (${fac(r1)})(${fac(r2)})$ from the numerator leaves the remainder $${lin(A + B, -(A * r2 + B * r1))}$. Substitute $x = ${r1}$ into $${lin(A + B, -(A * r2 + B * r1))} = A(${fac(r2)}) + B(${fac(r1)})$ to find $A$.`, answer: `${A}`, accept: [`A=${A}`], hint: `At $x = ${r1}$: $${(A + B) * r1 - (A * r2 + B * r1)} = A(${r1 - r2})$.` },
      { instruction: `Substitute $x = ${r2}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`], hint: `At $x = ${r2}$: $${(A + B) * r2 - (A * r2 + B * r1)} = B(${r2 - r1})$.` },
    ],
    finalAnswer: { value: `1 + ${pf2(A, r1, B, r2)}`, unit: "" },
    solutionNarrative: `Division peels off the constant 1; the remaining proper fraction splits with $A = ${A}$ and $B = ${B}$: altogether $1 ${A >= 0 ? "+" : "-"} \\frac{${Math.abs(A)}}{${fac(r1)}} ${B >= 0 ? "+" : "-"} \\frac{${Math.abs(B)}}{${fac(r2)}}$.`,
  };
};

// --- integrate-with-partial-fractions ---------------------------------------

// d1: decomposition given — just integrate each log term.
fill["c2f-pf-integrate-1"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-3, 3); r2 = rng.int(-3, 3);
    A = rng.int(2, 5); B = rng.pick([-4, -3, -2, 2, 3, 4]);
  } while (r1 === r2);
  const ans = logAnti(A, r1, B, r2);
  return {
    id: `gen.c2f-pf-integrate-1.${idx}`, generated: true, concepts: ["integrate-with-partial-fractions"], difficulty: 1, context: "abstract",
    prompt: `Integrate the already-decomposed expression $\\displaystyle\\int \\left( \\frac{${A}}{${fac(r1)}} ${B >= 0 ? "+" : "-"} \\frac{${Math.abs(B)}}{${fac(r2)}} \\right) dx$.`,
    steps: [
      { instruction: `Integrate the first term $\\displaystyle\\int \\frac{${A}}{${fac(r1)}}\\,dx$. (Type it like ${logTerm(A, r1)}.)`, answer: logTerm(A, r1), accept: [logTermP(A, r1), `${logTerm(A, r1)} + C`, `${logTermP(A, r1)} + C`], hint: `$\\int \\frac{k}{x - a}\\,dx = k\\ln|x - a| + C$.` },
      { instruction: `Now write the full antiderivative. (Type it like ${ans}.)`, answer: ans, accept: [logAntiP(A, r1, B, r2), ans.replace(" + C", ""), logAntiP(A, r1, B, r2).replace(" + C", ""), ans.replace(/\s+/g, "")], hint: "Each constant-over-linear term integrates to (constant)·ln|linear|; add + C once." },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Each term is $\\frac{k}{x-a}$, integrating to $k\\ln|x-a|$: the answer is $${A}\\ln|${fac(r1)}| ${B >= 0 ? "+" : "-"} ${Math.abs(B)}\\ln|${fac(r2)}| + C$.`,
  };
};

// d2: full pipeline — decompose, then integrate.
fill["c2f-pf-integrate-2"] = (rng, idx) => {
  let r1, r2, A, B;
  do {
    r1 = rng.int(-3, 3); r2 = rng.int(-3, 3);
    A = rng.int(-4, 4); B = rng.int(-4, 4);
  } while (r1 <= r2 || A === 0 || B === 0);
  const p = A + B, q = -(A * r2 + B * r1);
  const num = lin(p, q);
  const ans = logAnti(A, r1, B, r2);
  return {
    id: `gen.c2f-pf-integrate-2.${idx}`, generated: true, concepts: ["integrate-with-partial-fractions"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int \\frac{${num}}{(${fac(r1)})(${fac(r2)})}\\,dx$ by partial fractions.`,
    steps: [
      { instruction: `Decompose: with $\\dfrac{A}{${fac(r1)}} + \\dfrac{B}{${fac(r2)}}$, substitute $x = ${r1}$ to find $A$.`, answer: `${A}`, accept: [`A=${A}`], hint: `$${p * r1 + q} = A(${r1 - r2})$.` },
      { instruction: `Substitute $x = ${r2}$ to find $B$.`, answer: `${B}`, accept: [`B=${B}`], hint: `$${p * r2 + q} = B(${r2 - r1})$.` },
      { instruction: `Integrate the decomposition. (Type it like ${ans}.)`, answer: ans, accept: [logAntiP(A, r1, B, r2), ans.replace(" + C", ""), logAntiP(A, r1, B, r2).replace(" + C", ""), ans.replace(/\s+/g, "")], hint: `$\\int \\frac{k}{x-a}dx = k\\ln|x-a| + C$ applied to each piece.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Cover-up gives $A = ${A}$, $B = ${B}$; integrating term by term yields $${A}\\ln|${fac(r1)}| ${B >= 0 ? "+" : "-"} ${Math.abs(B)}\\ln|${fac(r2)}| + C$.`,
  };
};

// d3: repeated factor — a log term plus a negative-power term.
fill["c2f-pf-integrate-3"] = (rng, idx) => {
  let p, q, r, B;
  do {
    p = rng.int(2, 5); r = rng.int(-3, 3); q = rng.int(-6, 6);
    B = p * r + q;
  } while (r === 0 || B === 0);
  const num = lin(p, q);
  const ans = `${coef(p)}ln|${fac(r)}| ${B > 0 ? "-" : "+"} ${Math.abs(B)}/(${fac(r)}) + C`;
  const ansP = `${coef(p)}ln(${fac(r)}) ${B > 0 ? "-" : "+"} ${Math.abs(B)}/(${fac(r)}) + C`;
  return {
    id: `gen.c2f-pf-integrate-3.${idx}`, generated: true, concepts: ["integrate-with-partial-fractions"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int \\frac{${num}}{(${fac(r)})^2}\\,dx$. Decompose as $\\dfrac{A}{${fac(r)}} + \\dfrac{B}{(${fac(r)})^2}$ first.`,
    steps: [
      { instruction: `From $${num} = A(${fac(r)}) + B$, find $A$ by matching $x$-coefficients.`, answer: `${p}`, accept: [`A=${p}`], hint: "The $x$-coefficient on the right is $A$." },
      { instruction: `Find $B$ by substituting $x = ${r}$.`, answer: `${B}`, accept: [`B=${B}`], hint: `$B = ${p}(${r}) ${q >= 0 ? "+" : "-"} ${Math.abs(q)}$.` },
      { instruction: `Integrate: $\\int \\frac{${p}}{${fac(r)}}dx$ gives a log; $\\int \\frac{${B}}{(${fac(r)})^2}dx = -\\frac{${B}}{${fac(r)}}$ (power rule, no log!). Write the full antiderivative. (Type it like ${ans}.)`, answer: ans, accept: [ansP, ans.replace(" + C", ""), ansP.replace(" + C", ""), ans.replace(/\s+/g, "")], hint: `The squared term integrates by the power rule: $\\int (x-a)^{-2}dx = -(x-a)^{-1}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$A = ${p}$, $B = ${B}$. The first piece gives $${p}\\ln|${fac(r)}|$; the squared piece gives $${B > 0 ? "-" : "+"}\\frac{${Math.abs(B)}}{${fac(r)}}$ by the power rule. Add $+C$.`,
  };
};

// --- definite-integrals-and-applications ------------------------------------

// d1: single log term over a doubling interval — value is A ln 2.
fill["c2f-pf-definite-1"] = (rng, idx) => {
  const A = rng.int(2, 6);
  const k = rng.int(1, 4);
  const val = A * Math.log(2);
  const ans = rnd(val, 2);
  return {
    id: `gen.c2f-pf-definite-1.${idx}`, generated: true, concepts: ["definite-integrals-and-applications"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{${k}}^{${2 * k}} \\frac{${A}}{x}\\,dx$. Use $\\ln 2 \\approx 0.6931$.`,
    steps: [
      { instruction: `The antiderivative is $${A}\\ln|x|$, so the value is $${A}(\\ln ${2 * k} - \\ln ${k}) = ${A}\\ln(\\tfrac{${2 * k}}{${k}})$. The log of what number appears?`, answer: "2", accept: [], hint: `$\\ln b - \\ln a = \\ln(b/a)$, and $\\tfrac{${2 * k}}{${k}} = 2$.` },
      { instruction: `Compute $${A}\\ln 2$ using $\\ln 2 \\approx 0.6931$. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `$${A} \\times 0.6931$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$\\int_{${k}}^{${2 * k}} \\frac{${A}}{x}dx = ${A}\\ln\\frac{${2 * k}}{${k}} = ${A}\\ln 2 \\approx ${ans}$.`,
  };
};

// d2: two-term decomposition over [1, 2] — A ln 2 + B ln(3/2).
fill["c2f-pf-definite-2"] = (rng, idx) => {
  let A, B, val;
  do {
    A = rng.int(1, 5); B = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    val = A * Math.log(2) + B * Math.log(1.5);
  } while (Math.abs(val) < 0.05);
  const t1 = A * Math.log(2), t2 = B * Math.log(1.5);
  return {
    id: `gen.c2f-pf-definite-2.${idx}`, generated: true, concepts: ["definite-integrals-and-applications"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{1}^{2} \\left( \\frac{${A}}{x} ${B >= 0 ? "+" : "-"} \\frac{${Math.abs(B)}}{x + 1} \\right) dx$. Use $\\ln 2 \\approx 0.6931$ and $\\ln 3 \\approx 1.0986$.`,
    steps: [
      { instruction: `The $\\tfrac{${A}}{x}$ term contributes $${A}(\\ln 2 - \\ln 1) = ${A}\\ln 2$. Compute it; round to 3 decimal places.`, answer: rnd(t1, 3), accept: nbrs(t1, 3), hint: `$${A} \\times 0.6931$ (and $\\ln 1 = 0$).` },
      { instruction: `The second term contributes $${B}(\\ln 3 - \\ln 2) = ${B}\\ln\\tfrac{3}{2}$. Compute it; round to 3 decimal places.`, answer: rnd(t2, 3), accept: nbrs(t2, 3), hint: `$\\ln\\tfrac{3}{2} = 1.0986 - 0.6931 = 0.4055$, times $${B}$.` },
      { instruction: "Add the two contributions. Round to 2 decimal places.", answer: rnd(val, 2), accept: nbrs(val, 2), hint: `$${rnd(t1, 3)} ${t2 >= 0 ? "+" : "-"} ${rnd(Math.abs(t2), 3)}$.` },
    ],
    finalAnswer: { value: rnd(val, 2), unit: "" },
    solutionNarrative: `$\\big[${A}\\ln|x| ${B >= 0 ? "+" : "-"} ${Math.abs(B)}\\ln|x+1|\\big]_1^2 = ${A}\\ln 2 ${B >= 0 ? "+" : "-"} ${Math.abs(B)}\\ln\\tfrac{3}{2} \\approx ${rnd(val, 2)}$.`,
  };
};

// d3: applied — accumulate a rate c/((t+1)(t+2)) over [0, 2].
fill["c2f-pf-definite-3"] = (rng, idx) => {
  const c = rng.int(2, 8);
  const val = c * (Math.log(3) - Math.log(2));
  const ctx = rng.pick([
    { what: "A pollutant enters a lake", rate: "kg per day", t: "days", total: "total mass added" },
    { what: "A drug is absorbed into the bloodstream", rate: "mg per hour", t: "hours", total: "total amount absorbed" },
    { what: "Data flows into an archive", rate: "GB per hour", t: "hours", total: "total data stored" },
  ]);
  return {
    id: `gen.c2f-pf-definite-3.${idx}`, generated: true, concepts: ["definite-integrals-and-applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} at a rate $r(t) = \\dfrac{${c}}{(t + 1)(t + 2)}$ ${ctx.rate} after $t$ ${ctx.t}. Find the ${ctx.total} from $t = 0$ to $t = 2$: $\\displaystyle\\int_0^2 \\frac{${c}}{(t+1)(t+2)}\\,dt$. Use $\\ln 2 \\approx 0.6931$ and $\\ln 3 \\approx 1.0986$.`,
    steps: [
      { instruction: `Decompose $\\dfrac{${c}}{(t+1)(t+2)} = \\dfrac{A}{t+1} + \\dfrac{B}{t+2}$. Substitute $t = -1$ to find $A$.`, answer: `${c}`, accept: [`A=${c}`], hint: `$${c} = A(-1 + 2)$.` },
      { instruction: `Substitute $t = -2$ to find $B$.`, answer: `${-c}`, accept: [`B=${-c}`], hint: `$${c} = B(-2 + 1)$.` },
      { instruction: `So the integral is $\\big[${c}\\ln(t+1) - ${c}\\ln(t+2)\\big]_0^2 = ${c}(\\ln 3 - \\ln 1) - ${c}(\\ln 4 - \\ln 2) = ${c}(\\ln 3 - \\ln 2)$. Compute it; round to 2 decimal places.`, answer: rnd(val, 2), accept: nbrs(val, 2), hint: `$${c} \\times (1.0986 - 0.6931) = ${c} \\times 0.4055$.` },
    ],
    finalAnswer: { value: rnd(val, 2), unit: ctx.rate.replace(" per day", "").replace(" per hour", "") },
    solutionNarrative: `$A = ${c}$, $B = ${-c}$; the integral telescopes to $${c}\\ln\\tfrac{3}{2} \\approx ${rnd(val, 2)}$.`,
  };
};

// ============================================================================
// Topic B: calculus-2.improper-integrals
// ============================================================================

// --- infinite-limits-of-integration -----------------------------------------

// d1: the model case ∫_1^∞ 1/x^p, p >= 2.
fill["c2f-improper-infinite-1"] = (rng, idx) => {
  const p = rng.int(2, 4);
  const val = frac(1, p - 1);
  return {
    id: `gen.c2f-improper-infinite-1.${idx}`, generated: true, concepts: ["infinite-limits-of-integration"], difficulty: 1, context: "abstract",
    prompt: `Evaluate the improper integral $\\displaystyle\\int_{1}^{\\infty} \\frac{1}{x^{${p}}}\\,dx$ by replacing $\\infty$ with $b$ and letting $b \\to \\infty$.`,
    steps: [
      { instruction: `The antiderivative gives $\\displaystyle\\lim_{b\\to\\infty}\\left[ \\frac{-1}{${p - 1}x^{${p - 1}}} \\right]_1^b$. What is $\\displaystyle\\lim_{b\\to\\infty} \\frac{1}{b^{${p - 1}}}$?`, answer: "0", accept: [], hint: "A positive power of $b$ in the denominator crushes the fraction to 0." },
      { instruction: "Since the limit is finite, does the integral converge or diverge?", answer: "converges", accept: ["convergent"], hint: "A finite limiting value means convergence." },
      { instruction: "Compute the value of the integral.", answer: val, accept: [rnd(1 / (p - 1), 3)], hint: `$0 - \\left(\\frac{-1}{${p - 1}}\\right) = \\frac{1}{${p - 1}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$\\int_1^b x^{-${p}}dx = \\frac{1}{${p - 1}}\\left(1 - \\frac{1}{b^{${p - 1}}}\\right) \\to \\frac{1}{${p - 1}}$ as $b \\to \\infty$: the integral converges to $${val}$.`,
  };
};

// d2: exponential tail ∫_0^∞ c e^{-kx} dx with c a multiple of k.
fill["c2f-improper-infinite-2"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const m = rng.int(1, 3);
  const c = k * m;
  const anti = `-${m}e^(-${k}x)`;
  return {
    id: `gen.c2f-improper-infinite-2.${idx}`, generated: true, concepts: ["infinite-limits-of-integration"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{0}^{\\infty} ${c}e^{-${k}x}\\,dx$.`,
    steps: [
      { instruction: `Find the antiderivative of $${c}e^{-${k}x}$. (Type it like ${anti}.)`, answer: anti, accept: [`-${m}e^{-${k}x}`, `-${m}*e^(-${k}x)`, `-${m}e^-${k}x`, `${anti} + C`], hint: `$\\int e^{-${k}x}dx = -\\tfrac{1}{${k}}e^{-${k}x}$, and $${c} \\cdot \\tfrac{1}{${k}} = ${m}$.` },
      { instruction: `What is $\\displaystyle\\lim_{b\\to\\infty} e^{-${k}b}$?`, answer: "0", accept: [], hint: "A decaying exponential dies to 0." },
      { instruction: `Evaluate $\\displaystyle\\lim_{b\\to\\infty}\\big[-${m}e^{-${k}x}\\big]_0^b$.`, answer: `${m}`, accept: [], hint: `$0 - (-${m}e^{0}) = ${m}$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `The antiderivative is $-${m}e^{-${k}x}$; as $b\\to\\infty$ the top end vanishes, leaving $0 - (-${m}) = ${m}$.`,
  };
};

// d3: shifted lower bound ∫_a^∞ 2m/x^3 dx = m/a^2.
fill["c2f-improper-infinite-3"] = (rng, idx) => {
  const a = rng.int(2, 4);
  const m = rng.int(1, 4);
  const c = 2 * m;
  const val = frac(m, a * a);
  return {
    id: `gen.c2f-improper-infinite-3.${idx}`, generated: true, concepts: ["infinite-limits-of-integration"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{${a}}^{\\infty} \\frac{${c}}{x^{3}}\\,dx$.`,
    steps: [
      { instruction: `Find the antiderivative of $\\dfrac{${c}}{x^3}$. (Type it like -${m}/x^2.)`, answer: `-${m}/x^2`, accept: [`-${m}/(x^2)`, `-(${m}/x^2)`, `-${m}/x^2 + C`], hint: `$\\int ${c}x^{-3}dx = \\frac{${c}}{-2}x^{-2} = -\\frac{${m}}{x^2}$.` },
      { instruction: `What is $\\displaystyle\\lim_{b\\to\\infty} \\frac{${m}}{b^2}$?`, answer: "0", accept: [], hint: "The denominator grows without bound." },
      { instruction: `Evaluate $\\displaystyle\\lim_{b\\to\\infty}\\left[-\\frac{${m}}{x^2}\\right]_{${a}}^{b}$. Give a fraction or decimal.`, answer: val, accept: [`${m}/${a * a}`, rnd(m / (a * a), 4)], hint: `$0 - \\left(-\\frac{${m}}{${a}^2}\\right) = \\frac{${m}}{${a * a}}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `The antiderivative $-\\frac{${m}}{x^2}$ vanishes at $\\infty$, so the value is $\\frac{${m}}{${a}^2} = ${val}$.`,
  };
};

// --- discontinuous-integrands -------------------------------------------------

// d1: ∫_0^{s^2} 1/sqrt(x) dx — blow-up at the lower endpoint.
fill["c2f-improper-discont-1"] = (rng, idx) => {
  const s = rng.int(2, 5);
  const b = s * s;
  return {
    id: `gen.c2f-improper-discont-1.${idx}`, generated: true, concepts: ["discontinuous-integrands"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{0}^{${b}} \\frac{1}{\\sqrt{x}}\\,dx$. The integrand blows up somewhere in the interval — handle it with a limit.`,
    steps: [
      { instruction: "At what $x$-value is the integrand discontinuous (infinite)?", answer: "0", accept: ["x=0", "x = 0"], hint: "$\\frac{1}{\\sqrt{x}}$ blows up where the denominator is 0." },
      { instruction: `The antiderivative is $2\\sqrt{x}$. Evaluate $\\displaystyle\\lim_{t\\to 0^+}\\big[2\\sqrt{x}\\big]_t^{${b}}$.`, answer: `${2 * s}`, accept: [`2sqrt(${b})`, `2sqrt${b}`], hint: `$2\\sqrt{${b}} - 2\\sqrt{t} \\to 2 \\cdot ${s} - 0$.` },
    ],
    finalAnswer: { value: `${2 * s}`, unit: "" },
    solutionNarrative: `The blow-up is at $x = 0$; with antiderivative $2\\sqrt{x}$, the limit gives $2\\sqrt{${b}} = ${2 * s}$ — finite, so the integral converges.`,
  };
};

// d2: blow-up at the UPPER endpoint: ∫_0^b 1/sqrt(b - x) dx = 2 sqrt(b).
fill["c2f-improper-discont-2"] = (rng, idx) => {
  const s = rng.int(2, 4);
  const b = s * s;
  return {
    id: `gen.c2f-improper-discont-2.${idx}`, generated: true, concepts: ["discontinuous-integrands"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\displaystyle\\int_{0}^{${b}} \\frac{1}{\\sqrt{${b} - x}}\\,dx$.`,
    steps: [
      { instruction: "At what $x$-value is the integrand discontinuous?", answer: `${b}`, accept: [`x=${b}`, `x = ${b}`], hint: `The denominator $\\sqrt{${b} - x}$ hits 0 when $x = ${b}$ — the UPPER endpoint this time.` },
      { instruction: "Does the integral converge or diverge? (The antiderivative $-2\\sqrt{" + b + " - x}$ stays finite as $x \\to " + b + "^-$.)", answer: "converges", accept: ["convergent"], hint: "The limit of the antiderivative exists and is finite." },
      { instruction: `Evaluate $\\displaystyle\\lim_{t\\to ${b}^-}\\big[-2\\sqrt{${b} - x}\\big]_0^{t}$.`, answer: `${2 * s}`, accept: [`2sqrt(${b})`], hint: `$0 - (-2\\sqrt{${b}}) = 2 \\cdot ${s}$.` },
    ],
    finalAnswer: { value: `${2 * s}`, unit: "" },
    solutionNarrative: `The discontinuity sits at the upper endpoint $x = ${b}$. The limit of $-2\\sqrt{${b}-x}$ gives $0 + 2\\sqrt{${b}} = ${2 * s}$.`,
  };
};

// d3: divergent endpoint blow-up ∫_0^a 1/x^p, p >= 1, plus the general rule.
fill["c2f-improper-discont-3"] = (rng, idx) => {
  const p = rng.pick([1, 2, 3]);
  const a = rng.int(1, 4);
  const integrand = p === 1 ? "\\frac{1}{x}" : `\\frac{1}{x^{${p}}}`;
  return {
    id: `gen.c2f-improper-discont-3.${idx}`, generated: true, concepts: ["discontinuous-integrands"], difficulty: 3, context: "abstract",
    prompt: `Determine whether $\\displaystyle\\int_{0}^{${a}} ${integrand}\\,dx$ converges, and state the general rule for $\\int_0^1 x^{-p}dx$.`,
    steps: [
      { instruction: "Where is the integrand discontinuous?", answer: "0", accept: ["x=0", "x = 0"], hint: "The denominator vanishes at $x = 0$." },
      { instruction: p === 1 ? "As $t \\to 0^+$, $\\ln t \\to -\\infty$, so the limit of $[\\ln x]_t^{" + a + "}$ is infinite. Converge or diverge?" : `As $t \\to 0^+$, $\\dfrac{1}{t^{${p - 1}}} \\to \\infty$, so the limit of the antiderivative is infinite. Converge or diverge?`, answer: "diverges", accept: ["divergent"], hint: "An infinite limit means the area is unbounded: divergence." },
      { instruction: "Near 0, $\\int_0^1 x^{-p}dx$ converges exactly when the exponent satisfies which inequality? (Type it like p < 1.)", answer: "p < 1", accept: ["p<1", "1 > p", "1>p"], hint: "Near 0 the rule FLIPS relative to the at-infinity rule: small exponents are safe." },
    ],
    finalAnswer: { value: "diverges", unit: "" },
    solutionNarrative: `With $p = ${p} \\geq 1$, the area near $x = 0$ is unbounded — the integral diverges. Endpoint blow-ups converge only for $p < 1$.`,
  };
};

// --- convergence-p-test --------------------------------------------------------

// d1: classify ∫_1^∞ 1/x^p by comparing p to 1.
fill["c2f-improper-ptest-1"] = (rng, idx) => {
  const pick = rng.pick([
    { pS: "2", conv: true }, { pS: "3", conv: true }, { pS: "4", conv: true },
    { pS: "1", conv: false }, { pS: "1/2", conv: false }, { pS: "2/3", conv: false },
  ]);
  const word = pick.conv ? "converges" : "diverges";
  return {
    id: `gen.c2f-improper-ptest-1.${idx}`, generated: true, concepts: ["convergence-p-test"], difficulty: 1, context: "abstract",
    prompt: `Use the p-test to classify $\\displaystyle\\int_{1}^{\\infty} \\frac{1}{x^{${pick.pS}}}\\,dx$ as convergent or divergent.`,
    steps: [
      { instruction: `For $\\int_1^\\infty x^{-p}dx$, convergence requires $p$ to be greater than what number?`, answer: "1", accept: [], hint: "The boundary case $p = 1$ (the $\\tfrac{1}{x}$ integral) already diverges." },
      { instruction: `Here $p = ${pick.pS}$. Does the integral converge or diverge?`, answer: word, accept: [word === "converges" ? "convergent" : "divergent"], hint: `Compare $${pick.pS}$ to 1.` },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `The p-test at infinity: converges iff $p > 1$. With $p = ${pick.pS}$, the integral ${word}.`,
  };
};

// d2: classify AND evaluate: ∫_1^∞ 1/x^p = 1/(p-1) for integer p >= 2.
fill["c2f-improper-ptest-2"] = (rng, idx) => {
  const p = rng.int(2, 5);
  const val = frac(1, p - 1);
  return {
    id: `gen.c2f-improper-ptest-2.${idx}`, generated: true, concepts: ["convergence-p-test"], difficulty: 2, context: "abstract",
    prompt: `Classify $\\displaystyle\\int_{1}^{\\infty} \\frac{1}{x^{${p}}}\\,dx$ with the p-test, then compute its exact value.`,
    steps: [
      { instruction: `Is $p = ${p}$ greater than 1? Converge or diverge?`, answer: "converges", accept: ["convergent"], hint: "$p > 1$ means convergence at infinity." },
      { instruction: `Use the formula $\\displaystyle\\int_1^\\infty x^{-p}dx = \\frac{1}{p - 1}$ to find the value. Give a fraction.`, answer: val, accept: [rnd(1 / (p - 1), 3)], hint: `$\\frac{1}{${p} - 1}$.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `$p = ${p} > 1$: converges, with value $\\frac{1}{p-1} = ${val}$.`,
  };
};

// d3: the FLIPPED rule near 0: ∫_0^1 x^{-p} = 1/(1-p) for p < 1.
fill["c2f-improper-ptest-3"] = (rng, idx) => {
  const pick = rng.pick([
    { pS: "1/2", num: 1, den: 2 }, { pS: "1/3", num: 1, den: 3 },
    { pS: "1/4", num: 1, den: 4 }, { pS: "2/3", num: 2, den: 3 },
  ]);
  const val = frac(pick.den, pick.den - pick.num); // 1/(1 - num/den) = den/(den-num)
  return {
    id: `gen.c2f-improper-ptest-3.${idx}`, generated: true, concepts: ["convergence-p-test"], difficulty: 3, context: "abstract",
    prompt: `Classify and evaluate $\\displaystyle\\int_{0}^{1} \\frac{1}{x^{${pick.pS}}}\\,dx$. Careful: the blow-up is at $x = 0$, where the p-rule flips.`,
    steps: [
      { instruction: `Near 0, $\\int_0^1 x^{-p}dx$ converges exactly when $p < 1$. Here $p = ${pick.pS}$. Converge or diverge?`, answer: "converges", accept: ["convergent"], hint: `$${pick.pS} < 1$, and near 0 SMALL exponents are the safe ones.` },
      { instruction: `The value is $\\dfrac{1}{1 - p}$. Compute it for $p = ${pick.pS}$. Give a fraction.`, answer: val, accept: [rnd(pick.den / (pick.den - pick.num), 3)], hint: `$\\dfrac{1}{1 - ${pick.pS}}$ — invert the leftover fraction.` },
    ],
    finalAnswer: { value: val, unit: "" },
    solutionNarrative: `At an endpoint blow-up the test flips: $p = ${pick.pS} < 1$ converges, with value $\\frac{1}{1 - ${pick.pS}} = ${val}$.`,
  };
};

// --- comparison-and-applications ----------------------------------------------

// d1: squeeze 1/(x^2 + k) under 1/x^2.
fill["c2f-improper-compare-1"] = (rng, idx) => {
  const k = rng.int(1, 9);
  return {
    id: `gen.c2f-improper-compare-1.${idx}`, generated: true, concepts: ["comparison-and-applications"], difficulty: 1, context: "abstract",
    prompt: `Use comparison to decide whether $\\displaystyle\\int_{1}^{\\infty} \\frac{1}{x^{2} + ${k}}\\,dx$ converges. (No need to evaluate it.)`,
    steps: [
      { instruction: `For $x \\geq 1$, which is larger: $\\dfrac{1}{x^2 + ${k}}$ or $\\dfrac{1}{x^2}$? (Type the larger one.)`, answer: "1/x^2", accept: [`1/(x^2)`, "1/x^2 is larger", "the second"], hint: "A BIGGER denominator makes a SMALLER fraction." },
      { instruction: "Does $\\displaystyle\\int_1^\\infty \\frac{1}{x^2}dx$ converge or diverge?", answer: "converges", accept: ["convergent"], hint: "p-test with $p = 2 > 1$." },
      { instruction: "Our integrand is squeezed below a convergent one. Conclusion for the original integral?", answer: "converges", accept: ["convergent"], hint: "Smaller than finite is finite: comparison test." },
    ],
    finalAnswer: { value: "converges", unit: "" },
    solutionNarrative: `$0 \\leq \\frac{1}{x^2+${k}} \\leq \\frac{1}{x^2}$ on $[1,\\infty)$ and $\\int_1^\\infty x^{-2}dx$ converges, so the original converges by comparison.`,
  };
};

// d2: bound an oscillating numerator: (c + sin x)/x^2 <= (c+1)/x^2.
fill["c2f-improper-compare-2"] = (rng, idx) => {
  const c = rng.int(1, 3);
  return {
    id: `gen.c2f-improper-compare-2.${idx}`, generated: true, concepts: ["comparison-and-applications"], difficulty: 2, context: "abstract",
    prompt: `Show that $\\displaystyle\\int_{1}^{\\infty} \\frac{${c} + \\sin x}{x^{2}}\\,dx$ converges by comparison.`,
    steps: [
      { instruction: `Since $\\sin x \\leq 1$, the numerator is at most what number?`, answer: `${c + 1}`, accept: [], hint: `$${c} + \\sin x \\leq ${c} + 1$.` },
      { instruction: `So the integrand is at most $\\dfrac{${c + 1}}{x^2}$. What is $\\displaystyle\\int_1^\\infty \\frac{${c + 1}}{x^2}dx$?`, answer: `${c + 1}`, accept: [], hint: `$\\int_1^\\infty x^{-2}dx = 1$, times $${c + 1}$.` },
      { instruction: "The integrand is nonnegative and bounded by a convergent integral. Conclusion?", answer: "converges", accept: ["convergent"], hint: "Comparison: below finite means finite." },
    ],
    finalAnswer: { value: "converges", unit: "" },
    solutionNarrative: `$0 \\leq \\frac{${c}+\\sin x}{x^2} \\leq \\frac{${c + 1}}{x^2}$, and the bound integrates to $${c + 1}$ — finite. The original converges by comparison.`,
  };
};

// d3: applied — total accumulated quantity ∫_0^∞ C e^{-kt} dt = C/k.
fill["c2f-improper-compare-3"] = (rng, idx) => {
  const k = rng.int(2, 5);
  const C = rng.int(2, 9);
  const val = frac(C, k);
  const ctx = rng.pick([
    { what: "A patient's bloodstream absorbs a drug", rate: "mg per hour", unit: "mg", total: "total amount ever absorbed" },
    { what: "A leaking tank releases contaminant", rate: "liters per day", unit: "liters", total: "total volume ever leaked" },
    { what: "A cooling machine part radiates heat", rate: "joules per second", unit: "joules", total: "total energy ever radiated" },
  ]);
  return {
    id: `gen.c2f-improper-compare-3.${idx}`, generated: true, concepts: ["comparison-and-applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} at a rate $r(t) = ${C}e^{-${k}t}$ ${ctx.rate} at time $t$. Even over infinite time, the ${ctx.total} is finite: compute $\\displaystyle\\int_0^\\infty ${C}e^{-${k}t}\\,dt$.`,
    steps: [
      { instruction: `The antiderivative is $-\\tfrac{${C}}{${k}}e^{-${k}t}$. What is $\\displaystyle\\lim_{b\\to\\infty} e^{-${k}b}$?`, answer: "0", accept: [], hint: "Exponential decay dies to 0." },
      { instruction: `Evaluate the improper integral. Give a fraction or decimal.`, answer: val, accept: [`${C}/${k}`, rnd(C / k, 3)], hint: `$0 - \\left(-\\tfrac{${C}}{${k}}\\right) = \\tfrac{${C}}{${k}}$.` },
    ],
    finalAnswer: { value: val, unit: ctx.unit },
    solutionNarrative: `$\\int_0^\\infty ${C}e^{-${k}t}dt = \\left[-\\tfrac{${C}}{${k}}e^{-${k}t}\\right]_0^\\infty = \\tfrac{${C}}{${k}} = ${val}$ ${ctx.unit} — an infinite process with a finite total.`,
  };
};

// ============================================================================
// Topic C: calculus-2.taylor-series
// ============================================================================

// --- taylor-polynomials --------------------------------------------------------

// d1: T_2 for c e^x at 0 — all derivatives equal c.
fill["c2f-taylor-poly-1"] = (rng, idx) => {
  const c = rng.int(2, 5);
  const t2 = `${c} + ${c}x + ${frac(c, 2)}x^2`;
  return {
    id: `gen.c2f-taylor-poly-1.${idx}`, generated: true, concepts: ["taylor-polynomials"], difficulty: 1, context: "abstract",
    prompt: `Build the degree-2 Taylor polynomial $T_2(x)$ of $f(x) = ${c}e^{x}$ centered at $x = 0$, using $T_2(x) = f(0) + f'(0)x + \\tfrac{f''(0)}{2}x^2$.`,
    steps: [
      { instruction: "Find $f(0)$.", answer: `${c}`, accept: [], hint: `$e^0 = 1$, so $f(0) = ${c}$.` },
      { instruction: "Find $f''(0)$.", answer: `${c}`, accept: [], hint: `Every derivative of $${c}e^x$ is $${c}e^x$, which is $${c}$ at 0.` },
      { instruction: `Assemble $T_2(x)$. (Type it like ${t2}.)`, answer: t2, accept: [`${c}+${c}x+${c / 2}x^2`, `${c} + ${c}x + (${frac(c, 2)})x^2`], hint: `Coefficients: $f(0) = ${c}$, $f'(0) = ${c}$, $\\tfrac{f''(0)}{2} = ${frac(c, 2)}$.` },
    ],
    finalAnswer: { value: t2, unit: "" },
    solutionNarrative: `All derivatives of $${c}e^x$ equal $${c}$ at 0, so $T_2(x) = ${c} + ${c}x + ${frac(c, 2)}x^2$.`,
  };
};

// d2: T_3 for e^{kx} at 0 — chain rule powers of k.
fill["c2f-taylor-poly-2"] = (rng, idx) => {
  const k = rng.int(2, 3);
  const t3 = `1 + ${k}x + ${frac(k * k, 2)}x^2 + ${frac(k ** 3, 6)}x^3`;
  return {
    id: `gen.c2f-taylor-poly-2.${idx}`, generated: true, concepts: ["taylor-polynomials"], difficulty: 2, context: "abstract",
    prompt: `Build the degree-3 Taylor polynomial $T_3(x)$ of $f(x) = e^{${k}x}$ at $x = 0$: $T_3(x) = f(0) + f'(0)x + \\tfrac{f''(0)}{2}x^2 + \\tfrac{f'''(0)}{6}x^3$.`,
    steps: [
      { instruction: "Find $f'(0)$.", answer: `${k}`, accept: [], hint: `$f'(x) = ${k}e^{${k}x}$, and $e^0 = 1$.` },
      { instruction: "Find $f''(0)$.", answer: `${k * k}`, accept: [], hint: `Each derivative multiplies by another ${k}: $f''(x) = ${k * k}e^{${k}x}$.` },
      { instruction: "Find $f'''(0)$.", answer: `${k ** 3}`, accept: [], hint: `$${k}^3 = ${k ** 3}$.` },
      { instruction: `Assemble $T_3(x)$, dividing each $f^{(n)}(0)$ by $n!$. (Type it like ${t3}.)`, answer: t3, accept: [t3.replace(/\s+/g, ""), `1 + ${k}x + (${frac(k * k, 2)})x^2 + (${frac(k ** 3, 6)})x^3`], hint: `Coefficients: $1$, $${k}$, $\\tfrac{${k * k}}{2}$, $\\tfrac{${k ** 3}}{6}$.` },
    ],
    finalAnswer: { value: t3, unit: "" },
    solutionNarrative: `$f^{(n)}(0) = ${k}^n$, so $T_3(x) = 1 + ${k}x + ${frac(k * k, 2)}x^2 + ${frac(k ** 3, 6)}x^3$.`,
  };
};

// d3: centered at a = 1: T_3 of c ln x.
fill["c2f-taylor-poly-3"] = (rng, idx) => {
  const c = rng.pick([2, 3, 4, 6]);
  const t3 = `${c}(x - 1) - ${frac(c, 2)}(x - 1)^2 + ${frac(c, 3)}(x - 1)^3`;
  return {
    id: `gen.c2f-taylor-poly-3.${idx}`, generated: true, concepts: ["taylor-polynomials"], difficulty: 3, context: "abstract",
    prompt: `Build the degree-3 Taylor polynomial of $f(x) = ${c}\\ln x$ centered at $a = 1$. Recall $T_3(x) = f(1) + f'(1)(x-1) + \\tfrac{f''(1)}{2}(x-1)^2 + \\tfrac{f'''(1)}{6}(x-1)^3$.`,
    steps: [
      { instruction: "Find $f(1)$.", answer: "0", accept: [], hint: "$\\ln 1 = 0$." },
      { instruction: "With $f'(x) = " + c + "/x$, find $f'(1)$.", answer: `${c}`, accept: [], hint: `$\\tfrac{${c}}{1} = ${c}$.` },
      { instruction: `With $f''(x) = -${c}/x^2$, find $f''(1)$.`, answer: `${-c}`, accept: [], hint: `$-\\tfrac{${c}}{1} = ${-c}$.` },
      { instruction: `With $f'''(x) = ${2 * c}/x^3$, $f'''(1) = ${2 * c}$. Assemble $T_3(x)$ in powers of $(x - 1)$. (Type it like ${t3}.)`, answer: t3, accept: [t3.replace(/\s+/g, ""), `${c}(x-1) - (${frac(c, 2)})(x-1)^2 + (${frac(c, 3)})(x-1)^3`], hint: `Coefficients: $${c}$, $\\tfrac{${-c}}{2} = -${frac(c, 2)}$, $\\tfrac{${2 * c}}{6} = ${frac(c, 3)}$.` },
    ],
    finalAnswer: { value: t3, unit: "" },
    solutionNarrative: `$f(1) = 0$, $f'(1) = ${c}$, $f''(1) = ${-c}$, $f'''(1) = ${2 * c}$, giving $T_3(x) = ${c}(x-1) - ${frac(c, 2)}(x-1)^2 + ${frac(c, 3)}(x-1)^3$.`,
  };
};

// --- maclaurin-coefficients ----------------------------------------------------

// d1: read a coefficient off e^x = sum x^n/n!.
fill["c2f-maclaurin-coef-1"] = (rng, idx) => {
  const m = rng.int(3, 5);
  const factorials = { 3: 6, 4: 24, 5: 120 };
  const f = factorials[m];
  return {
    id: `gen.c2f-maclaurin-coef-1.${idx}`, generated: true, concepts: ["maclaurin-coefficients"], difficulty: 1, context: "abstract",
    prompt: `Using the known series $e^{x} = \\sum_{n=0}^{\\infty} \\dfrac{x^n}{n!}$, find the coefficient of $x^{${m}}$ in the Maclaurin series of $e^x$.`,
    steps: [
      { instruction: `Compute $${m}!$.`, answer: `${f}`, accept: [], hint: `$${m}! = ${Array.from({ length: m }, (_, i) => m - i).join(" \\cdot ")}$.` },
      { instruction: `So the coefficient of $x^{${m}}$ is $\\dfrac{1}{${m}!}$. Give it as a fraction.`, answer: `1/${f}`, accept: [rnd(1 / f, 4)], hint: `The general term is $\\tfrac{x^n}{n!}$ with $n = ${m}$.` },
    ],
    finalAnswer: { value: `1/${f}`, unit: "" },
    solutionNarrative: `The $x^{${m}}$ term of $e^x$ is $\\frac{x^{${m}}}{${m}!}$, so the coefficient is $\\frac{1}{${f}}$.`,
  };
};

// d2: geometric series 1/(1 - kx) = sum (kx)^n; coefficient of x^m is k^m.
fill["c2f-maclaurin-coef-2"] = (rng, idx) => {
  const k = rng.int(2, 3);
  const m = rng.int(2, 4);
  return {
    id: `gen.c2f-maclaurin-coef-2.${idx}`, generated: true, concepts: ["maclaurin-coefficients"], difficulty: 2, context: "abstract",
    prompt: `Using the geometric series $\\dfrac{1}{1 - u} = \\sum_{n=0}^{\\infty} u^n$, find the coefficient of $x^{${m}}$ in the Maclaurin series of $\\dfrac{1}{1 - ${k}x}$.`,
    steps: [
      { instruction: `Substitute $u = ${k}x$: the general term is $(${k}x)^n$. What is the $n = ${m}$ term? (Type it like ${k ** m}x^${m}.)`, answer: `${k ** m}x^${m}`, accept: [`${k}^${m}x^${m}`, `(${k}x)^${m}`], hint: `$(${k}x)^{${m}} = ${k}^{${m}}x^{${m}}$.` },
      { instruction: `So the coefficient of $x^{${m}}$ is?`, answer: `${k ** m}`, accept: [`${k}^${m}`], hint: `$${k}^{${m}} = ${k ** m}$.` },
    ],
    finalAnswer: { value: `${k ** m}`, unit: "" },
    solutionNarrative: `$\\frac{1}{1-${k}x} = \\sum (${k}x)^n$, so the $x^{${m}}$ coefficient is $${k}^{${m}} = ${k ** m}$.`,
  };
};

// d3: e^{kx}: coefficient k^m/m!, and recover f^(m)(0) from it.
fill["c2f-maclaurin-coef-3"] = (rng, idx) => {
  const k = rng.int(2, 3);
  const m = rng.int(2, 4);
  const factorials = { 2: 2, 3: 6, 4: 24 };
  const f = factorials[m];
  const cm = frac(k ** m, f);
  return {
    id: `gen.c2f-maclaurin-coef-3.${idx}`, generated: true, concepts: ["maclaurin-coefficients"], difficulty: 3, context: "abstract",
    prompt: `For $f(x) = e^{${k}x}$: find the coefficient of $x^{${m}}$ in its Maclaurin series, and use the coefficient formula $c_n = \\dfrac{f^{(n)}(0)}{n!}$ to confirm $f^{(${m})}(0)$.`,
    steps: [
      { instruction: `Each derivative multiplies by ${k}, so $f^{(${m})}(0) = ${k}^{${m}}$. Compute it.`, answer: `${k ** m}`, accept: [`${k}^${m}`], hint: `$${k}^{${m}} = ${k ** m}$.` },
      { instruction: `The coefficient of $x^{${m}}$ is $c_{${m}} = \\dfrac{f^{(${m})}(0)}{${m}!} = \\dfrac{${k ** m}}{${f}}$. Give it as a reduced fraction.`, answer: cm, accept: [`${k ** m}/${f}`, rnd(k ** m / f, 4)], hint: `Reduce $\\tfrac{${k ** m}}{${f}}$.` },
      { instruction: `Check the other direction: multiplying $c_{${m}}$ back by $${m}!$ recovers what value of $f^{(${m})}(0)$?`, answer: `${k ** m}`, accept: [], hint: `$c_n \\cdot n! = f^{(n)}(0)$ always.` },
    ],
    finalAnswer: { value: cm, unit: "" },
    solutionNarrative: `$f^{(${m})}(0) = ${k ** m}$ and $c_{${m}} = \\frac{${k ** m}}{${f}} = ${cm}$; the coefficient and the derivative convert via $n!$.`,
  };
};

// --- series-approximation ------------------------------------------------------

// d1: approximate e^t with 1 + t + t^2/2 at t = j/10 (exact 3-decimal arithmetic).
fill["c2f-taylor-approx-1"] = (rng, idx) => {
  const j = rng.int(1, 5);
  const t = j / 10;
  const sq = t * t / 2;
  const approx = 1 + t + sq;
  return {
    id: `gen.c2f-taylor-approx-1.${idx}`, generated: true, concepts: ["series-approximation"], difficulty: 1, context: "abstract",
    prompt: `Use the Taylor polynomial $T_2(x) = 1 + x + \\tfrac{x^2}{2}$ for $e^x$ to approximate $e^{${t}}$ (no calculator exponentials needed).`,
    steps: [
      { instruction: `Compute the quadratic term $\\tfrac{(${t})^2}{2}$.`, answer: rnd(sq, 3), accept: [`${sq}`, rnd(sq, 4)], hint: `$${t}^2 = ${rnd(t * t, 2)}$, halved.` },
      { instruction: `Add up $1 + ${t} + ${rnd(sq, 3)}$.`, answer: rnd(approx, 3), accept: [`${approx}`, rnd(approx, 2), rnd(approx, 4)], hint: "Just add the three terms." },
    ],
    finalAnswer: { value: rnd(approx, 3), unit: "" },
    solutionNarrative: `$T_2(${t}) = 1 + ${t} + ${rnd(sq, 3)} = ${rnd(approx, 3)}$ — already within about $\\tfrac{${t}^3}{6}$ of the true $e^{${t}}$.`,
  };
};

// d2: approximate sin t with t - t^3/6, rounding stated.
fill["c2f-taylor-approx-2"] = (rng, idx) => {
  const j = rng.int(2, 6);
  const t = j / 10;
  const cube = t ** 3 / 6;
  const approx = t - cube;
  const a1 = rnd(approx, 4);
  const a2 = rnd(t - parseFloat(rnd(cube, 4)), 4); // via the rounded intermediate
  return {
    id: `gen.c2f-taylor-approx-2.${idx}`, generated: true, concepts: ["series-approximation"], difficulty: 2, context: "abstract",
    prompt: `Use $T_3(x) = x - \\tfrac{x^3}{6}$ for $\\sin x$ to approximate $\\sin(${t})$ (radians). Round to 4 decimal places.`,
    steps: [
      { instruction: `Compute the correction term $\\tfrac{(${t})^3}{6}$. Round to 4 decimal places.`, answer: rnd(cube, 4), accept: nbrs(cube, 4), hint: `$${t}^3 = ${rnd(t ** 3, 4)}$, divided by 6.` },
      { instruction: `Compute the approximation $${t} - ${rnd(cube, 4)}$. Round to 4 decimal places.`, answer: a1, accept: a1 === a2 ? nbrs(approx, 4) : [a2, ...nbrs(approx, 4)], hint: "Subtract the correction from the angle itself." },
    ],
    finalAnswer: { value: a1, unit: "" },
    solutionNarrative: `$\\sin(${t}) \\approx ${t} - \\tfrac{${t}^3}{6} = ${a1}$; the true value differs only in the 5th decimal (next term is $\\tfrac{${t}^5}{120}$).`,
  };
};

// d3: approximate cos t with 1 - t^2/2 and BOUND the error by the next term t^4/24.
fill["c2f-taylor-approx-3"] = (rng, idx) => {
  const j = rng.int(3, 8);
  const t = j / 10;
  const approx = 1 - t * t / 2;
  const bound = t ** 4 / 24;
  return {
    id: `gen.c2f-taylor-approx-3.${idx}`, generated: true, concepts: ["series-approximation"], difficulty: 3, context: "abstract",
    prompt: `Approximate $\\cos(${t})$ with $T_2(x) = 1 - \\tfrac{x^2}{2}$, and bound the error by the size of the first omitted term, $\\tfrac{x^4}{24}$.`,
    steps: [
      { instruction: `Compute $1 - \\tfrac{(${t})^2}{2}$. Round to 4 decimal places.`, answer: rnd(approx, 4), accept: nbrs(approx, 4), hint: `$${t}^2 = ${rnd(t * t, 2)}$; halve it and subtract from 1.` },
      { instruction: `Compute the error bound $\\tfrac{(${t})^4}{24}$. Round to 4 decimal places.`, answer: rnd(bound, 4), accept: nbrs(bound, 4), hint: `$${t}^4 = ${rnd(t ** 4, 4)}$, divided by 24.` },
      { instruction: "The omitted term $+\\tfrac{x^4}{24}$ is positive, so is the estimate $1 - \\tfrac{x^2}{2}$ an overestimate or an underestimate of $\\cos(" + t + ")$?", answer: "underestimate", accept: ["under", "too low", "an underestimate"], hint: "Adding the next (positive) term would RAISE the estimate toward the truth." },
    ],
    finalAnswer: { value: rnd(approx, 4), unit: "" },
    solutionNarrative: `$T_2(${t}) = ${rnd(approx, 4)}$ with error at most $\\tfrac{${t}^4}{24} \\approx ${rnd(bound, 4)}$; since the omitted term is positive, the estimate is an underestimate.`,
  };
};

// --- radius-and-interval ---------------------------------------------------------

// d1: sum (x/k)^n — ratio test gives R = k.
fill["c2f-taylor-radius-1"] = (rng, idx) => {
  const k = rng.int(2, 6);
  return {
    id: `gen.c2f-taylor-radius-1.${idx}`, generated: true, concepts: ["radius-and-interval"], difficulty: 1, context: "abstract",
    prompt: `Find the radius of convergence of the power series $\\sum_{n=0}^{\\infty} \\dfrac{x^n}{${k}^n}$.`,
    steps: [
      { instruction: `The ratio test gives $L = \\left|\\dfrac{x^{n+1}/${k}^{n+1}}{x^n/${k}^n}\\right| = \\dfrac{|x|}{${k}}$. The series converges when $L < 1$, i.e. when $|x|$ is less than what number?`, answer: `${k}`, accept: [], hint: `Solve $\\tfrac{|x|}{${k}} < 1$.` },
      { instruction: "So the radius of convergence is $R = $ ?", answer: `${k}`, accept: [`R=${k}`, `R = ${k}`], hint: "The radius is exactly that bound on $|x|$." },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `The ratio simplifies to $\\tfrac{|x|}{${k}}$, so convergence needs $|x| < ${k}$: $R = ${k}$.`,
  };
};

// d2: centered series sum (x-a)^n / k^n — radius k, interval (a-k, a+k).
fill["c2f-taylor-radius-2"] = (rng, idx) => {
  let a, k;
  do { a = rng.int(-3, 3); k = rng.int(2, 5); } while (a === 0);
  const lo = a - k, hi = a + k;
  return {
    id: `gen.c2f-taylor-radius-2.${idx}`, generated: true, concepts: ["radius-and-interval"], difficulty: 2, context: "abstract",
    prompt: `Find the radius and (open) interval of convergence of $\\sum_{n=0}^{\\infty} \\dfrac{(x ${a > 0 ? "-" : "+"} ${Math.abs(a)})^n}{${k}^n}$.`,
    steps: [
      { instruction: `The ratio test gives $L = \\dfrac{|x ${a > 0 ? "-" : "+"} ${Math.abs(a)}|}{${k}}$. What is the radius of convergence $R$?`, answer: `${k}`, accept: [`R=${k}`], hint: `$L < 1$ means $|x ${a > 0 ? "-" : "+"} ${Math.abs(a)}| < ${k}$.` },
      { instruction: `The series is centered at $x = ${a}$. Give the open interval of convergence as (left, right).`, answer: `(${lo}, ${hi})`, accept: [`${lo}, ${hi}`, `(${lo},${hi})`], hint: `Center $${a}$ minus and plus the radius $${k}$.` },
    ],
    finalAnswer: { value: `(${lo}, ${hi})`, unit: "" },
    solutionNarrative: `$R = ${k}$ around the center $${a}$: the series converges for $${lo} < x < ${hi}$.`,
  };
};

// d3: factorial denominator sum (kx)^n / n! — ratio limit 0, infinite radius.
fill["c2f-taylor-radius-3"] = (rng, idx) => {
  const k = rng.int(2, 5);
  return {
    id: `gen.c2f-taylor-radius-3.${idx}`, generated: true, concepts: ["radius-and-interval"], difficulty: 3, context: "abstract",
    prompt: `Find the radius of convergence of $\\sum_{n=0}^{\\infty} \\dfrac{${k}^n x^n}{n!}$ (the series for $e^{${k}x}$).`,
    steps: [
      { instruction: `The ratio test gives $L = \\lim_{n\\to\\infty} \\dfrac{${k}|x|}{n + 1}$. For any FIXED $x$, what is this limit?`, answer: "0", accept: [], hint: "The factorial's growth puts $n + 1$ in the denominator, which swamps the fixed numerator." },
      { instruction: `Since $L = 0 < 1$ for every $x$, the radius of convergence is: (type infinite)`, answer: "infinite", accept: ["infinity", "inf", "r=infinity", "r = infinity"], hint: "Convergence for all $x$ means an infinite radius." },
    ],
    finalAnswer: { value: "infinite", unit: "" },
    solutionNarrative: `The factorial beats the geometric factor: $L = 0$ for every $x$, so the series converges everywhere — infinite radius.`,
  };
};
