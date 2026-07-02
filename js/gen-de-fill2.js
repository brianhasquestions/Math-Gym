// gen-de-fill2.js
// Parametric generators for differential-equations.nonhomogeneous-second-order.
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape merged into js/generator.js's registry (same pattern as
// js/gen-de-fill.js). Prefix: def2- (def- is taken by gen-de-fill.js).
// Every generator picks clean roots/coefficients FIRST and derives the
// equation from them, so all answers are exact integers, fractions, or
// solution sets by construction.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const signed = (n) => (n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`);
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
const expT = (r) => (r === 1 ? "t" : r === -1 ? "-t" : `${r}t`); // exponent string for e^{rt}
const compact = (s) => s.replace(/\s+/g, "");

export const fill = {};

// ============================================================================
// complementary-solution — solve the homogeneous part via the char. equation
// ============================================================================

fill["def2-complementary-solution-d1"] = (rng, idx) => {
  const r1 = rng.int(1, 5);
  let r2 = -rng.int(1, 5);
  if (r2 === -r1) r2 -= 1; // keep the y' term (b != 0)
  const b = -(r1 + r2), c = r1 * r2, F = rng.int(2, 9);
  const charEq = `r^2 ${signed(b)}r ${signed(c)} = 0`;
  return {
    id: `gen.def2-complementary-solution-d1.${idx}`, generated: true, concepts: ["complementary-solution"], difficulty: 1, context: "abstract",
    prompt: `The equation $y'' ${signed(b)}y' ${signed(c)}y = ${F}$ is nonhomogeneous. Find the roots that build its complementary solution $y_c$.`,
    steps: [
      { instruction: "The complementary solution solves the homogeneous part: set the right side to 0. Write the characteristic equation.", answer: charEq, accept: [compact(charEq)], hint: `Drop the forcing term ${F}, then $y'' \\to r^2$, $y' \\to r$, $y \\to 1$.` },
      { instruction: "Factor and solve for both roots. Separate them with 'or' or a comma.", form: "solutions", answer: `r = ${r1} or r = ${r2}`, accept: [`${r1}, ${r2}`, `${r2}, ${r1}`], hint: `$(r ${signed(-r1)})(r ${signed(-r2)}) = 0$.` },
    ],
    finalAnswer: { value: `r = ${r1}, r = ${r2}`, unit: "" },
    solutionNarrative: `The homogeneous part gives $${charEq}$, so $r = ${r1}$ or $r = ${r2}$. The forcing ${F} plays no role in $y_c$.`,
  };
};

fill["def2-complementary-solution-d2"] = (rng, idx) => {
  const r = -rng.int(1, 5);
  const b = -2 * r, c = r * r, F = rng.int(2, 9);
  const charEq = `r^2 + ${b}r + ${c} = 0`;
  return {
    id: `gen.def2-complementary-solution-d2.${idx}`, generated: true, concepts: ["complementary-solution"], difficulty: 2, context: "abstract",
    prompt: `Find the complementary-solution root(s) for $y'' + ${b}y' + ${c}y = ${F}$.`,
    steps: [
      { instruction: "Write the characteristic equation of the homogeneous part.", answer: charEq, accept: [compact(charEq)], hint: `Set the right side to 0, then $y'' \\to r^2$, $y' \\to r$, $y \\to 1$.` },
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=1$, $b=${b}$, $c=${c}$).`, answer: "0", accept: [], hint: `$${b}^2 - 4(1)(${c}) = ${b * b} - ${4 * c}$.` },
      { instruction: "The discriminant is zero, so there is one repeated root. Find it.", form: "solutions", answer: `r = ${r}`, accept: [`${r}`], hint: `$(r ${signed(-r)})^2 = 0$.` },
    ],
    finalAnswer: { value: `r = ${r} (repeated)`, unit: "" },
    solutionNarrative: `$${charEq} = (r ${signed(-r)})^2$, so $r = ${r}$ is a repeated (double) root; $y_c = (C_1 + C_2 t)e^{${expT(r)}}$.`,
  };
};

fill["def2-complementary-solution-d3"] = (rng, idx) => {
  const al = -rng.int(1, 3), be = rng.int(1, 3);
  const b = -2 * al, c = al * al + be * be, F = rng.int(2, 9);
  const D = b * b - 4 * c; // = -4*be^2
  const charEq = `r^2 + ${b}r + ${c} = 0`;
  return {
    id: `gen.def2-complementary-solution-d3.${idx}`, generated: true, concepts: ["complementary-solution"], difficulty: 3, context: "applied",
    prompt: `A driven series RLC circuit gives $q'' + ${b}q' + ${c}q = ${F}$ for the charge $q$. Find the (complex) roots of the complementary solution.`,
    steps: [
      { instruction: "Write the characteristic equation of the homogeneous part.", answer: charEq, accept: [compact(charEq)], hint: `Zero out the source term ${F}, then $q'' \\to r^2$, $q' \\to r$, $q \\to 1$.` },
      { instruction: `Compute the discriminant $b^2 - 4ac$ (here $a=1$, $b=${b}$, $c=${c}$).`, answer: `${D}`, accept: [], hint: `$${b}^2 - 4(1)(${c}) = ${b * b} - ${4 * c}$.` },
      { instruction: "Apply the quadratic formula to find both complex roots.", form: "solutions", answer: `r = ${al} + ${be}i or r = ${al} - ${be}i`, accept: [`${al}+${be}i, ${al}-${be}i`, `${al}-${be}i, ${al}+${be}i`], hint: `$r = \\dfrac{-${b} \\pm \\sqrt{${D}}}{2} = ${al} \\pm ${be}i$.` },
    ],
    finalAnswer: { value: `r = ${al} + ${be}i, r = ${al} - ${be}i`, unit: "" },
    solutionNarrative: `$${charEq}$ has discriminant $${D}$, so $r = ${al} \\pm ${be}i$: the circuit's own response is a decaying oscillation beneath the driven steady state.`,
  };
};

// ============================================================================
// particular-form — choose the shape of y_p from the forcing term
// ============================================================================

fill["def2-particular-form-d1"] = (rng, idx) => {
  const r1 = rng.int(1, 4);
  let r2 = -rng.int(1, 4);
  if (r2 === -r1) r2 -= 1;
  let al = rng.int(1, 5);
  if (al === r1) al += 1;
  const b = -(r1 + r2), c = r1 * r2, k = rng.int(2, 9);
  return {
    id: `gen.def2-particular-form-d1.${idx}`, generated: true, concepts: ["particular-form"], difficulty: 1, context: "abstract",
    prompt: `For $y'' ${signed(b)}y' ${signed(c)}y = ${k}e^{${al}t}$, choose the correct form of the particular solution $y_p$.`,
    steps: [
      { instruction: `Find the roots of the homogeneous part $r^2 ${signed(b)}r ${signed(c)} = 0$.`, form: "solutions", answer: `r = ${r1} or r = ${r2}`, accept: [`${r1}, ${r2}`, `${r2}, ${r1}`], hint: `$(r ${signed(-r1)})(r ${signed(-r2)}) = 0$.` },
      { instruction: `Is the forcing exponent ${al} one of those roots? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: `Compare ${al} against ${r1} and ${r2}.` },
      { instruction: "No resonance, so use the plain exponential guess. Write the form of $y_p$ (use the letter A for the unknown coefficient).", answer: `Ae^(${al}t)`, accept: [`Ae^{${al}t}`, `A*e^(${al}t)`, `A e^{${al}t}`], hint: `An exponential forcing $ke^{${al}t}$ calls for $Ae^{${al}t}$.` },
    ],
    finalAnswer: { value: `Ae^(${al}t)`, unit: "" },
    solutionNarrative: `The roots are ${r1} and ${r2}; the forcing exponent ${al} is not a root, so the plain guess $y_p = Ae^{${al}t}$ works.`,
  };
};

fill["def2-particular-form-d2"] = (rng, idx) => {
  const w = rng.int(2, 5), k = rng.int(2, 12);
  const r1 = -rng.int(1, 4);
  let r2 = -rng.int(1, 4);
  if (r2 === r1) r2 -= 1;
  const b = -(r1 + r2), c = r1 * r2; // both positive: a damped system, real roots — no resonance possible
  return {
    id: `gen.def2-particular-form-d2.${idx}`, generated: true, concepts: ["particular-form"], difficulty: 2, context: "abstract",
    prompt: `For $y'' + ${b}y' + ${c}y = ${k}\\sin(${w}t)$, choose the form of the particular solution.`,
    steps: [
      { instruction: "Only sine appears in the forcing. Does $y_p$ still need a cosine term as well? Type 'yes' or 'no'.", answer: "yes", accept: ["y"], hint: "Differentiating sine produces cosine — the guess must be closed under differentiation." },
      { instruction: "Write the form of $y_p$ (use A and B for the unknown coefficients).", answer: `A cos(${w}t) + B sin(${w}t)`, accept: [`Acos(${w}t)+Bsin(${w}t)`, `A sin(${w}t) + B cos(${w}t)`, `Asin(${w}t)+Bcos(${w}t)`], hint: `Sinusoidal forcing at frequency ${w} calls for $A\\cos(${w}t) + B\\sin(${w}t)$.` },
    ],
    finalAnswer: { value: `A cos(${w}t) + B sin(${w}t)`, unit: "" },
    solutionNarrative: `Because derivatives swap sine and cosine, the guess needs both terms: $y_p = A\\cos(${w}t) + B\\sin(${w}t)$. The homogeneous roots (${r1} and ${r2}) are real, so there is no resonance with frequency ${w}.`,
  };
};

fill["def2-particular-form-d3"] = (rng, idx) => {
  const r1 = rng.int(1, 4);
  let r2 = -rng.int(1, 4);
  if (r2 === -r1) r2 -= 1;
  const b = -(r1 + r2), c = r1 * r2, k = rng.int(2, 9);
  return {
    id: `gen.def2-particular-form-d3.${idx}`, generated: true, concepts: ["particular-form"], difficulty: 3, context: "applied",
    prompt: `A forced system obeys $y'' ${signed(b)}y' ${signed(c)}y = ${k}e^{${r1}t}$ — the forcing matches part of the system's own natural response. Choose the form of $y_p$.`,
    steps: [
      { instruction: `Find the roots of the homogeneous part $r^2 ${signed(b)}r ${signed(c)} = 0$.`, form: "solutions", answer: `r = ${r1} or r = ${r2}`, accept: [`${r1}, ${r2}`, `${r2}, ${r1}`], hint: `$(r ${signed(-r1)})(r ${signed(-r2)}) = 0$.` },
      { instruction: `Is the forcing exponent ${r1} a root? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `The exponent ${r1} appears in your root list.` },
      { instruction: `The plain guess $Ae^{${r1}t}$ already solves the homogeneous equation, so it collapses to 0 when substituted. Multiply it by $t$ and write the corrected form of $y_p$.`, answer: `Ate^(${r1}t)`, accept: [`Ate^{${r1}t}`, `A*t*e^(${r1}t)`, `A t e^{${r1}t}`], hint: `The resonance bump: $t \\cdot Ae^{${r1}t}$.` },
    ],
    finalAnswer: { value: `Ate^(${r1}t)`, unit: "" },
    solutionNarrative: `The exponent ${r1} IS a characteristic root — resonance. The guess must be bumped by a factor of $t$: $y_p = Ate^{${r1}t}$.`,
  };
};

// ============================================================================
// undetermined-coefficients — substitute y_p and solve for A, B (numeric core)
// ============================================================================

fill["def2-undetermined-coefficients-d1"] = (rng, idx) => {
  const A = nz(rng, -6, 6), c = rng.int(2, 6), b = rng.int(1, 6);
  const k = c * A;
  return {
    id: `gen.def2-undetermined-coefficients-d1.${idx}`, generated: true, concepts: ["undetermined-coefficients"], difficulty: 1, context: "abstract",
    prompt: `Find the particular solution of $y'' + ${b}y' + ${c}y = ${k}$ using the guess $y_p = A$ (a constant).`,
    steps: [
      { instruction: "A constant has zero derivatives, so substituting $y_p = A$ leaves only the $y$-term. Write the resulting equation.", answer: `${c}A = ${k}`, accept: [`${c}A=${k}`], hint: `$y_p'' = 0$ and $y_p' = 0$, so only $${c}y_p = ${c}A$ survives on the left.` },
      { instruction: "Solve for $A$.", answer: `${A}`, accept: [`A = ${A}`, `A=${A}`], hint: `Divide ${k} by ${c}.` },
    ],
    finalAnswer: { value: `${A}`, unit: "" },
    solutionNarrative: `Substituting the constant guess kills both derivative terms, leaving $${c}A = ${k}$, so $A = ${A}$ and $y_p = ${A}$.`,
  };
};

fill["def2-undetermined-coefficients-d2"] = (rng, idx) => {
  const al = rng.int(1, 3), b = rng.int(1, 5), c = rng.int(1, 9);
  const D = al * al + b * al + c; // always positive — never a resonance
  const k = rng.int(2, 12);
  const Astr = frac(k, D);
  return {
    id: `gen.def2-undetermined-coefficients-d2.${idx}`, generated: true, concepts: ["undetermined-coefficients"], difficulty: 2, context: "abstract",
    prompt: `Find the coefficient $A$ in $y_p = Ae^{${al}t}$ for $y'' + ${b}y' + ${c}y = ${k}e^{${al}t}$.`,
    steps: [
      { instruction: `Substituting $Ae^{${al}t}$ multiplies it by the characteristic polynomial at ${al}. Compute $${al}^2 + ${b}(${al}) + ${c}$.`, answer: `${D}`, accept: [], hint: `$${al * al} + ${b * al} + ${c}$.` },
      { instruction: `So $${D}A = ${k}$. Solve for $A$ (fraction or decimal).`, answer: Astr, accept: [`A = ${Astr}`, `A=${Astr}`], hint: `Divide ${k} by ${D} and reduce.` },
    ],
    finalAnswer: { value: Astr, unit: "" },
    solutionNarrative: `Each derivative of $Ae^{${al}t}$ multiplies it by ${al}, so substitution gives $(${al}^2 + ${b}\\cdot${al} + ${c})A = ${D}A = ${k}$ and $A = ${Astr}$.`,
  };
};

fill["def2-undetermined-coefficients-d3"] = (rng, idx) => {
  const A = nz(rng, -4, 4), B = nz(rng, -4, 4), b = rng.int(1, 5), c = rng.int(2, 6);
  const p = c * A, q = b * A + c * B;
  const rhs = q === 0 ? `${p}t` : `${p}t ${signed(q)}`;
  return {
    id: `gen.def2-undetermined-coefficients-d3.${idx}`, generated: true, concepts: ["undetermined-coefficients"], difficulty: 3, context: "applied",
    prompt: `A motor ramps up its push: $y'' + ${b}y' + ${c}y = ${rhs}$. Using $y_p = At + B$ (so $y_p' = A$, $y_p'' = 0$), the left side becomes $${c}At + (${b}A + ${c}B)$. Find $A$ and $B$.`,
    steps: [
      { instruction: `Match the $t$-coefficients: $${c}A = ${p}$. Solve for $A$.`, answer: `${A}`, accept: [`A = ${A}`, `A=${A}`], hint: `Divide ${p} by ${c}.` },
      { instruction: `Match the constant terms: $${b}A + ${c}B = ${q}$. Solve for $B$.`, answer: `${B}`, accept: [`B = ${B}`, `B=${B}`], hint: `$${b}(${A}) + ${c}B = ${q}$, so $${c}B = ${q - b * A}$.` },
    ],
    finalAnswer: { value: `A = ${A}, B = ${B}`, unit: "" },
    solutionNarrative: `Matching $t$-terms: $${c}A = ${p}$, so $A = ${A}$. Matching constants: $${b}(${A}) + ${c}B = ${q}$ gives $B = ${B}$. So $y_p = ${A}t ${signed(B)}$.`,
  };
};

// ============================================================================
// general-solution-ivp — assemble y = y_c + y_p, then fit C1, C2 (2x2 system)
// ============================================================================

fill["def2-general-solution-ivp-d1"] = (rng, idx) => {
  const m1 = rng.int(1, 3);
  let m2 = rng.int(1, 3);
  if (m2 === m1) m2 += 1;
  const r1 = -m1, r2 = -m2;
  const A = rng.int(1, 6), C1 = nz(rng, -4, 4), C2 = nz(rng, -4, 4);
  const S = C1 + C2, y0 = S + A;
  const gen = `y = C1e^(${expT(r1)}) + C2e^(${expT(r2)}) + ${A}`;
  const genBrace = `y = C1e^{${expT(r1)}} + C2e^{${expT(r2)}} + ${A}`;
  return {
    id: `gen.def2-general-solution-ivp-d1.${idx}`, generated: true, concepts: ["general-solution-ivp"], difficulty: 1, context: "abstract",
    prompt: `A forced system has complementary roots $r = ${r1}$ and $r = ${r2}$ and particular solution $y_p = ${A}$. Assemble the general solution, then apply $y(0) = ${y0}$.`,
    steps: [
      { instruction: "Write the general solution $y = y_c + y_p$ using constants C1 and C2 (use e^( ) notation).", answer: gen, accept: [compact(gen), genBrace, gen.replace("y = ", ""), compact(gen.replace("y = ", ""))], hint: `One exponential per root, plus the particular constant ${A}.` },
      { instruction: `Apply $y(0) = ${y0}$ (note $e^0 = 1$): $C_1 + C_2 + ${A} = ${y0}$. What does $C_1 + C_2$ equal?`, answer: `${S}`, accept: [`C1 + C2 = ${S}`, `C1+C2=${S}`], hint: `Subtract the particular value ${A} from ${y0}.` },
    ],
    finalAnswer: { value: `C1 + C2 = ${S}`, unit: "" },
    solutionNarrative: `$${gen}$. At $t = 0$ every exponential equals 1, so $C_1 + C_2 + ${A} = ${y0}$, giving $C_1 + C_2 = ${S}$.`,
  };
};

fill["def2-general-solution-ivp-d2"] = (rng, idx) => {
  const r1 = rng.int(1, 3), r2 = -rng.int(1, 3); // distinct by sign
  const A = nz(rng, -5, 5), C1 = nz(rng, -4, 4), C2 = nz(rng, -4, 4);
  const S = C1 + C2, y0 = S + A, v0 = r1 * C1 + r2 * C2;
  return {
    id: `gen.def2-general-solution-ivp-d2.${idx}`, generated: true, concepts: ["general-solution-ivp"], difficulty: 2, context: "abstract",
    prompt: `The general solution of a forced equation is $y = C_1e^{${expT(r1)}} + C_2e^{${expT(r2)}} ${signed(A)}$, with $y(0) = ${y0}$ and $y'(0) = ${v0}$. Find $C_1$ and $C_2$.`,
    steps: [
      { instruction: `Apply $y(0) = ${y0}$ (note $e^0 = 1$, and the particular term contributes ${A}). What does $C_1 + C_2$ equal?`, answer: `${S}`, accept: [`C1 + C2 = ${S}`, `C1+C2=${S}`], hint: `$C_1 + C_2 ${signed(A)} = ${y0}$.` },
      { instruction: `Differentiate (the constant drops out) and apply $y'(0) = ${v0}$: $${r1}C_1 ${signed(r2)}C_2 = ${v0}$. Substitute $C_2 = ${S} - C_1$ and solve for $C_1$.`, answer: `${C1}`, accept: [`C1 = ${C1}`, `C1=${C1}`], hint: `$${r1}C_1 ${signed(r2)}(${S} - C_1) = ${v0}$ collapses to $${r1 - r2}C_1 = ${v0 - r2 * S}$.` },
      { instruction: "Now find $C_2$.", answer: `${C2}`, accept: [`C2 = ${C2}`, `C2=${C2}`], hint: `$C_2 = ${S} - C_1 = ${S} - (${C1})$.` },
    ],
    finalAnswer: { value: `C1 = ${C1}, C2 = ${C2}`, unit: "" },
    solutionNarrative: `$y(0)$ gives $C_1 + C_2 = ${S}$; $y'(0)$ gives $${r1}C_1 ${signed(r2)}C_2 = ${v0}$. Solving the 2×2 system: $C_1 = ${C1}$, $C_2 = ${C2}$.`,
  };
};

fill["def2-general-solution-ivp-d3"] = (rng, idx) => {
  const m = rng.int(2, 4); // roots -1 and -m
  const b = 1 + m, c = m;
  const al = rng.int(1, 2), A = rng.int(2, 3);
  const D = al * al + b * al + c, k = D * A;
  const C1 = nz(rng, -3, 3), C2 = nz(rng, -3, 3);
  const S = C1 + C2, y0 = S + A, v0 = -C1 - m * C2 + al * A;
  const gen = `y = C1e^(-t) + C2e^(${expT(-m)}) + ${A}e^(${expT(al)})`;
  const genBrace = `y = C1e^{-t} + C2e^{${expT(-m)}} + ${A}e^{${expT(al)}}`;
  return {
    id: `gen.def2-general-solution-ivp-d3.${idx}`, generated: true, concepts: ["general-solution-ivp"], difficulty: 3, context: "applied",
    prompt: `A forced spring-mass system obeys $y'' + ${b}y' + ${c}y = ${k}e^{${expT(al)}}$ with $y(0) = ${y0}$ and $y'(0) = ${v0}$. The complementary roots are $r = -1$ and $r = ${-m}$. Find the full solution.`,
    steps: [
      { instruction: `Find the particular coefficient: substituting $y_p = Ae^{${expT(al)}}$ gives $(${al}^2 + ${b}\\cdot${al} + ${c})A = ${k}$, i.e. $${D}A = ${k}$. Solve for $A$.`, answer: `${A}`, accept: [`A = ${A}`, `A=${A}`], hint: `Divide ${k} by ${D}.` },
      { instruction: "Write the general solution $y = y_c + y_p$ using constants C1 and C2 (use e^( ) notation).", answer: gen, accept: [compact(gen), genBrace, gen.replace("y = ", ""), compact(gen.replace("y = ", ""))], hint: `One exponential per root, plus $${A}e^{${expT(al)}}$ from the particular solution.` },
      { instruction: `Apply $y(0) = ${y0}$: $C_1 + C_2 + ${A} = ${y0}$. What does $C_1 + C_2$ equal?`, answer: `${S}`, accept: [`C1 + C2 = ${S}`, `C1+C2=${S}`], hint: `The particular term contributes $${A}e^0 = ${A}$.` },
      { instruction: `Differentiate and apply $y'(0) = ${v0}$: $-C_1 - ${m}C_2 + ${al * A} = ${v0}$. Substitute $C_1 = ${S} - C_2$ and solve for $C_2$.`, answer: `${C2}`, accept: [`C2 = ${C2}`, `C2=${C2}`], hint: `$-(${S} - C_2) - ${m}C_2 = ${v0 - al * A}$ collapses to $${1 - m}C_2 = ${v0 - al * A + S}$.` },
      { instruction: "Now find $C_1$.", answer: `${C1}`, accept: [`C1 = ${C1}`, `C1=${C1}`], hint: `$C_1 = ${S} - C_2 = ${S} - (${C2})$.` },
    ],
    finalAnswer: { value: `C1 = ${C1}, C2 = ${C2}`, unit: "" },
    solutionNarrative: `$${D}A = ${k}$ gives $A = ${A}$, so $${gen}$. Then $y(0) = ${y0}$ gives $C_1 + C_2 = ${S}$ and $y'(0) = ${v0}$ gives $C_2 = ${C2}$, $C_1 = ${C1}$. The transient decays; the driven term persists.`,
  };
};
