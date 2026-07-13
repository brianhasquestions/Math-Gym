// gen-calc2-pool-fill.js
// Thin-pool fill pack for five Calculus 2 topics (prefix c2l-). Each template
// covers one (concept, difficulty) pool that previously had only one or two
// seed problems and no generator, so repeat practice re-served the same problems:
//   - calculus-2.antiderivatives              (8 templates)
//   - calculus-2.applications-of-integration  (9 templates)
//   - calculus-2.definite-integrals           (8 templates)
//   - calculus-2.integration-by-parts         (9 templates)
//   - calculus-2.integration-by-substitution  (9 templates)
//   - calculus-2.series-and-convergence       (6 templates)
// 49 total. Self-contained: exports a `fill` map of template-name ->
// (rng, idx) => problem, matching js/generator.js's shape. Deterministic
// concept/difficulty per template; answers built answer-first so every draw
// grades cleanly.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Round v to k decimals avoiding "-0.00"; returns string.
const rnd = (v, k) => {
  let s = v.toFixed(k);
  if (parseFloat(s) === 0) s = (0).toFixed(k);
  return s;
};
// Neighboring rounded strings for generous accepts on decimal answers.
const nbrs = (v, k) => {
  const step = Math.pow(10, -k);
  return [rnd(v + step, k), rnd(v - step, k), rnd(v, k + 1)];
};
// |k| x^p as a display string (magnitude only; sign handled by polyJoin).
const tmag = (k, p, v = "x") => {
  const mag = Math.abs(k);
  if (p === 0) return `${mag}`;
  const vp = p === 1 ? v : `${v}^${p}`;
  return mag === 1 ? vp : `${mag}${vp}`;
};
// Signed sum of terms [{k, p}] -> "5x^4 - 9x^2 + 4x - 7" (zero terms skipped).
const polyJoin = (terms, v = "x") => {
  let s = "";
  for (const { k, p } of terms) {
    if (k === 0) continue;
    const piece = tmag(k, p, v);
    s += s === "" ? (k < 0 ? `-${piece}` : piece) : (k < 0 ? ` - ${piece}` : ` + ${piece}`);
  }
  return s === "" ? "0" : s;
};
// Antiderivative term of k x^p: magnitude string like "2x^3/3" or "3x^2".
const antiMag = (k, p, v = "x") => {
  const d = p + 1;
  const n = Math.abs(k);
  const g = gcd(n, d) || 1;
  const nn = n / g, dd = d / g;
  const vp = d === 1 ? v : `${v}^${d}`;
  if (dd === 1) return nn === 1 ? vp : `${nn}${vp}`;
  return nn === 1 ? `${vp}/${dd}` : `${nn}${vp}/${dd}`;
};
// Full antiderivative of terms [{k, p}], + C optional.
const antiJoin = (terms, v = "x", plusC = true) => {
  let s = "";
  for (const { k, p } of terms) {
    if (k === 0) continue;
    const piece = antiMag(k, p, v);
    s += s === "" ? (k < 0 ? `-${piece}` : piece) : (k < 0 ? ` - ${piece}` : ` + ${piece}`);
  }
  return plusC ? `${s} + C` : s;
};

export const fill = {};

// ============================================================================
// Topic: calculus-2.antiderivatives
// ============================================================================

// --- power-rule-integration d3: 4-term polynomial, integrate term by term ----
fill["c2l-power-rule-d3"] = (rng, idx) => {
  const p1 = rng.int(1, 3);            // leading coef = 5*p1 on x^4
  const q = rng.int(1, 3) * rng.pick([1, -1]);  // 3q on x^2
  const r = rng.int(1, 2) * rng.pick([1, -1]);  // 2r on x
  const d0 = rng.int(2, 9) * rng.pick([1, -1]); // constant
  const terms = [{ k: 5 * p1, p: 4 }, { k: 3 * q, p: 2 }, { k: 2 * r, p: 1 }, { k: d0, p: 0 }];
  const integrand = polyJoin(terms);
  const anti = antiJoin(terms);
  const lead = antiMag(5 * p1, 4);
  return {
    id: `gen.c2l-power-rule-d3.${idx}`, generated: true, concepts: ["power-rule-integration"], difficulty: 3, context: "abstract",
    prompt: `Find $\\int (${integrand})\\,dx$. Include $+ C$.`,
    steps: [
      { instruction: `Integrate the leading term: $\\int ${tmag(5 * p1, 4)}\\,dx$ (no $+ C$ yet).`, answer: lead, accept: [`${lead} + C`], hint: `Raise the exponent to 5 and divide: $\\frac{${5 * p1}}{5}x^5$.` },
      { instruction: `What is the coefficient of $x^3$ in the antiderivative? Give a number or fraction.`, answer: frac(3 * q, 3), accept: [`${3 * q}/3`], hint: `$\\int ${3 * q < 0 ? "(" : ""}${3 * q}x^2${3 * q < 0 ? ")" : ""}\\,dx$ divides the coefficient by 3.` },
      { instruction: "Now write the full antiderivative. Include $+ C$.", answer: anti, accept: [], hint: `Term by term: each $ax^n$ becomes $\\frac{a}{n+1}x^{n+1}$; the constant ${d0 < 0 ? `$${d0}$` : `$${d0}$`} becomes ${d0 < 0 ? `$${d0}x$` : `$${d0}x$`}.` },
    ],
    finalAnswer: { value: anti, unit: "" },
    solutionNarrative: `Integrate term by term: $\\int (${integrand})\\,dx = ${anti.replace(" + C", "")} + C$. Differentiating hands back $${integrand}$. ✓`,
  };
};

// --- power-rule-integration d2: 3-term polynomial, integer coefficients ------
fill["c2l-power-rule-d2"] = (rng, idx) => {
  let a, b, c;
  do {
    a = rng.int(1, 3);
    b = rng.int(1, 3);
    c = rng.int(2, 6);
  } while (a === 1 && b === 2 && c === 2); // ∫(4x^3 + 6x^2 + 2)dx is the existing seed
  const terms = [{ k: 4 * a, p: 3 }, { k: 3 * b, p: 2 }, { k: c, p: 0 }];
  const integrand = polyJoin(terms);
  const anti = antiJoin(terms);
  const lead = antiMag(4 * a, 3);
  return {
    id: `gen.c2l-power-rule-d2.${idx}`, generated: true, concepts: ["power-rule-integration"], difficulty: 2, context: "abstract",
    prompt: `Find $\\int (${integrand})\\,dx$. Include $+ C$.`,
    steps: [
      { instruction: `Integrate the leading term: $\\int ${tmag(4 * a, 3)}\\,dx$ (no $+ C$ yet).`, answer: lead, accept: [`${lead} + C`], hint: `Raise the exponent to 4 and divide: $\\frac{${4 * a}}{4}x^4 = ${lead}$.` },
      { instruction: "Now integrate term by term and write the full antiderivative. Include $+ C$.", answer: anti, accept: [], hint: `$\\int ${3 * b}x^2\\,dx = ${tmag(b, 3)}$ and $\\int ${c}\\,dx = ${tmag(c, 1)}$.` },
    ],
    finalAnswer: { value: anti, unit: "" },
    solutionNarrative: `Term by term: $\\int ${tmag(4 * a, 3)}\\,dx = ${tmag(a, 4)}$, $\\int ${tmag(3 * b, 2)}\\,dx = ${tmag(b, 3)}$, $\\int ${c}\\,dx = ${tmag(c, 1)}$. Together: $${anti.replace(" + C", "")} + C$.`,
  };
};

// --- antiderivative-rules d1: pull a constant out front -----------------------
fill["c2l-antideriv-rules-d1"] = (rng, idx) => {
  let n, m;
  do {
    n = rng.int(2, 4);
    m = rng.int(2, 5);
  } while (n === 2 && m === 2); // ∫6x^2 dx is the existing seed problem
  const K = m * (n + 1);
  const ans = `${m}x^${n + 1} + C`;
  return {
    id: `gen.c2l-antideriv-rules-d1.${idx}`, generated: true, concepts: ["antiderivative-rules"], difficulty: 1, context: "abstract",
    prompt: `Find $\\int ${K}x^{${n}}\\,dx$. Include $+ C$.`,
    steps: [
      { instruction: `Pull the constant ${K} out front and integrate $x^${n}$, giving $${K} \\cdot \\frac{x^${n + 1}}{${n + 1}}$. What number multiplies $x^${n + 1}$?`, answer: `${m}`, accept: [`${K}/${n + 1}`], hint: `$${K} \\div ${n + 1}$.` },
      { instruction: "Write the antiderivative. Include $+ C$.", answer: ans, accept: [], hint: `$${m}x^${n + 1} + C$ — check by differentiating: it returns $${K}x^${n}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$${K}\\int x^${n}\\,dx = ${K} \\cdot \\frac{x^${n + 1}}{${n + 1}} + C = ${m}x^${n + 1} + C$. Differentiating gives $${K}x^${n}$. ✓`,
  };
};

// --- antiderivative-rules d3: expand a product, then integrate ---------------
fill["c2l-antideriv-rules-d3"] = (rng, idx) => {
  let a1, b1, b2, B;
  do {
    a1 = rng.int(2, 4);
    b1 = rng.int(1, 3) * rng.pick([1, -1]);
    b2 = rng.int(1, 4) * rng.pick([1, -1]);
    B = a1 * b2 + b1;
  } while (B === 0);
  const A = a1, Cc = b1 * b2;
  const expanded = polyJoin([{ k: A, p: 2 }, { k: B, p: 1 }, { k: Cc, p: 0 }]);
  const anti = antiJoin([{ k: A, p: 2 }, { k: B, p: 1 }, { k: Cc, p: 0 }]);
  const f1 = polyJoin([{ k: a1, p: 1 }, { k: b1, p: 0 }]);
  const f2 = polyJoin([{ k: 1, p: 1 }, { k: b2, p: 0 }]);
  return {
    id: `gen.c2l-antideriv-rules-d3.${idx}`, generated: true, concepts: ["antiderivative-rules"], difficulty: 3, context: "abstract",
    prompt: `Rewrite and integrate $\\int (${f1})(${f2})\\,dx$. There is no product rule for integrals — expand first. Include $+ C$.`,
    steps: [
      { instruction: "Expand the product into a sum of power terms.", answer: expanded, accept: [], hint: `$(${f1})(${f2}) = ${a1}x \\cdot x ${b2 >= 0 ? "+" : "-"} ${Math.abs(b2 * a1)}x ${b1 >= 0 ? "+" : "-"} ${Math.abs(b1)}x ${Cc >= 0 ? "+" : "-"} ${Math.abs(Cc)}$; combine the $x$ terms.` },
      { instruction: "Integrate the expanded polynomial term by term. Include $+ C$.", answer: anti, accept: [], hint: `$\\int ${A}x^2 = ${antiMag(A, 2)}$, $\\int ${Math.abs(B)}x = ${antiMag(Math.abs(B), 1)}$, $\\int ${Math.abs(Cc)} = ${tmag(Math.abs(Cc), 1)}$ — keep each sign.` },
      { instruction: `Check your work: what is the derivative of the $x^2$ term of your antiderivative?`, answer: polyJoin([{ k: B, p: 1 }]), accept: [`${B}x`], hint: `The $x^2$ term is $${antiMag(B, 1)}$ with sign ${B < 0 ? "minus" : "plus"}; its derivative should be the middle term of the expansion.` },
    ],
    finalAnswer: { value: anti, unit: "" },
    solutionNarrative: `Expand: $(${f1})(${f2}) = ${expanded}$. Integrate term by term: $${anti.replace(" + C", "")} + C$. Differentiating returns the expanded integrand. ✓`,
  };
};

// --- initial-value-problems d1: find C from a known point --------------------
fill["c2l-ivp-d1"] = (rng, idx) => {
  let a, y0;
  do {
    a = rng.int(1, 4);
    y0 = rng.int(2, 9);
  } while (a === 1 && y0 === 5); // F' = 2x, F(0) = 5 is the existing seed

  const gen = a === 1 ? "x^2" : `${a}x^2`;
  return {
    id: `gen.c2l-ivp-d1.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 1, context: "abstract",
    prompt: `$F'(x) = ${2 * a}x$ and $F(0) = ${y0}$. The general antiderivative is $F(x) = ${gen} + C$. Find the specific $F(x)$.`,
    steps: [
      { instruction: `Substitute $x = 0$, $F = ${y0}$ into $${gen} + C$ and solve for $C$.`, answer: `${y0}`, accept: [`C = ${y0}`, `C=${y0}`], hint: `$${a === 1 ? "" : a}(0)^2 + C = ${y0}$ — the squared term vanishes.` },
      { instruction: "Write the specific function $F(x)$.", answer: `${gen} + ${y0}`, accept: [], hint: `Put your value of $C$ back into $${gen} + C$.` },
    ],
    finalAnswer: { value: `${gen} + ${y0}`, unit: "" },
    solutionNarrative: `At $x = 0$ every $x$ term vanishes, so $C = ${y0}$ and $F(x) = ${gen} + ${y0}$.`,
  };
};

// --- initial-value-problems d3: integrate, solve for C, evaluate elsewhere ---
fill["c2l-ivp-d3"] = (rng, idx) => {
  const a = rng.int(1, 2);
  const b = rng.int(1, 2) * rng.pick([1, -1]);
  const c = rng.int(1, 4);
  let C = rng.int(2, 8);
  if (a === 1 && b === -2 && c === 1 && C === 5) C = 6; // avoid the seed's exact IVP
  const x1 = rng.int(1, 2);
  const x2 = x1 === 1 ? rng.pick([0, 2]) : rng.pick([0, 1]);
  const F = (x) => a * x ** 3 + b * x ** 2 + c * x + C;
  const y1 = F(x1);
  const deriv = polyJoin([{ k: 3 * a, p: 2 }, { k: 2 * b, p: 1 }, { k: c, p: 0 }]);
  const anti = `${polyJoin([{ k: a, p: 3 }, { k: b, p: 2 }, { k: c, p: 1 }])} + C`;
  return {
    id: `gen.c2l-ivp-d3.${idx}`, generated: true, concepts: ["initial-value-problems"], difficulty: 3, context: "abstract",
    prompt: `$F'(x) = ${deriv}$ and $F(${x1}) = ${y1}$. Find $F(x)$, then evaluate $F(${x2})$.`,
    steps: [
      { instruction: `Integrate $${deriv}$. Include $+ C$.`, answer: anti, accept: [], hint: `$\\int ${3 * a}x^2 = ${tmag(a, 3)}$, $\\int ${Math.abs(2 * b)}x = ${tmag(Math.abs(b), 2)}$, $\\int ${c} = ${tmag(c, 1)}$.` },
      { instruction: `Substitute $x = ${x1}$, $F = ${y1}$ and solve for $C$.`, answer: `${C}`, accept: [`C = ${C}`, `C=${C}`], hint: `$${a * x1 ** 3 + b * x1 ** 2 + c * x1} + C = ${y1}$.` },
      { instruction: `Evaluate $F(${x2})$ using the constant you found.`, answer: `${F(x2)}`, accept: [`F(${x2}) = ${F(x2)}`], hint: x2 === 0 ? "At $x = 0$ only the constant survives." : `$${a}(${x2})^3 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}(${x2})^2 ${c >= 0 ? "+" : "-"} ${Math.abs(c)}(${x2}) + ${C}$.` },
    ],
    finalAnswer: { value: `${F(x2)}`, unit: "" },
    solutionNarrative: `Integrating gives $${anti}$. From $F(${x1}) = ${y1}$: $C = ${C}$. Then $F(${x2}) = ${F(x2)}$.`,
  };
};

// --- antiderivative-applications d1: recover a quantity from a linear rate ---
const APP_CTX_D1 = [
  { who: "A drone climbs", rate: "velocity", fn: "v", varn: "t", q: "height", qfn: "h", unit: "meters", start: "the ground (height $0$)" },
  { who: "A cyclist rides from a marker", rate: "velocity", fn: "v", varn: "t", q: "position", qfn: "s", unit: "meters", start: "the marker (position $0$)" },
  { who: "A pump fills an empty tank", rate: "flow rate", fn: "R", varn: "t", q: "volume", qfn: "V", unit: "liters", start: "empty (volume $0$)" },
];
fill["c2l-antideriv-apps-d1"] = (rng, idx) => {
  const ctx = rng.pick(APP_CTX_D1);
  let k, T;
  do {
    k = rng.int(2, 5);
    T = rng.int(2, 4);
  } while (k === 2 && T === 3); // v = 4t over [0,3] is the existing seed
  const total = k * T * T;
  const v = ctx.varn;
  return {
    id: `gen.c2l-antideriv-apps-d1.${idx}`, generated: true, concepts: ["antiderivative-applications"], difficulty: 1, context: "applied",
    prompt: `${ctx.who} with ${ctx.rate} $${ctx.fn}(${v}) = ${2 * k}${v}$ ${ctx.unit} per ${ctx.unit === "liters" ? "minute" : "second"}, starting from ${ctx.start}. The ${ctx.q} is the antiderivative of the ${ctx.rate}. What is the ${ctx.q} after ${T} ${ctx.unit === "liters" ? "minutes" : "seconds"}?`,
    steps: [
      { instruction: `Integrate $${ctx.fn}(${v}) = ${2 * k}${v}$ to get the ${ctx.q} function. Include $+ C$.`, answer: `${k}${v}^2 + C`, accept: [], hint: `$\\int ${2 * k}${v}\\,d${v} = ${k}${v}^2 + C$.` },
      { instruction: `The start value is $0$, so ${ctx.qfn}$(0) = 0$. Find $C$.`, answer: "0", accept: ["C = 0", "C=0"], hint: `$${k}(0)^2 + C = 0$.` },
      { instruction: `Evaluate the ${ctx.q} at ${ctx.varn} $= ${T}$ (${ctx.unit}).`, answer: `${total}`, accept: [`${total} ${ctx.unit}`], hint: `$${k}(${T})^2 = ${k} \\cdot ${T * T}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: ctx.unit },
    solutionNarrative: `${ctx.qfn}$(${v}) = \\int ${2 * k}${v}\\,d${v} = ${k}${v}^2 + C$; the zero start gives $C = 0$, so at $${v} = ${T}$ the ${ctx.q} is $${k}(${T})^2 = ${total}$ ${ctx.unit}.`,
  };
};

// --- antiderivative-applications d3: acceleration + initial velocity ---------
const APP_CTX_D3 = [
  { who: "A maglev test cart" },
  { who: "A subway train" },
  { who: "A speedboat" },
];
fill["c2l-antideriv-apps-d3"] = (rng, idx) => {
  const ctx = rng.pick(APP_CTX_D3);
  const k = rng.int(1, 3);
  const c0 = rng.int(2, 8);
  const v0 = rng.int(2, 9);
  const T = rng.pick([2, 3]);
  const vAtT = 3 * k * T * T + c0 * T + v0;
  const accel = polyJoin([{ k: 6 * k, p: 1 }, { k: c0, p: 0 }], "t");
  const anti = antiJoin([{ k: 6 * k, p: 1 }, { k: c0, p: 0 }], "t");
  return {
    id: `gen.c2l-antideriv-apps-d3.${idx}`, generated: true, concepts: ["antiderivative-applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.who} accelerates at $a(t) = ${accel}$ m/s². Its initial velocity is $v(0) = ${v0}$ m/s. Integrate acceleration to get velocity, then find the velocity at $t = ${T}$ seconds.`,
    steps: [
      { instruction: `Integrate $a(t) = ${accel}$ to get velocity $v(t)$. Include $+ C$.`, answer: anti, accept: [], hint: `$\\int ${6 * k}t\\,dt = ${tmag(3 * k, 2, "t")}$ and $\\int ${c0}\\,dt = ${tmag(c0, 1, "t")}$.` },
      { instruction: `Use $v(0) = ${v0}$ to find $C$.`, answer: `${v0}`, accept: [`C = ${v0}`, `C=${v0}`], hint: `At $t = 0$ every $t$ term vanishes.` },
      { instruction: `Evaluate $v(${T})$ (m/s).`, answer: `${vAtT}`, accept: [`${vAtT} m/s`], hint: `$${3 * k}(${T})^2 + ${c0}(${T}) + ${v0} = ${3 * k * T * T} + ${c0 * T} + ${v0}$.` },
    ],
    finalAnswer: { value: `${vAtT}`, unit: "m/s" },
    solutionNarrative: `$v(t) = \\int (${accel})\\,dt = ${anti.replace(" + C", "")} + C$. With $v(0) = ${v0}$, $C = ${v0}$. Then $v(${T}) = ${3 * k * T * T} + ${c0 * T} + ${v0} = ${vAtT}$ m/s.`,
  };
};

// ============================================================================
// Topic: calculus-2.applications-of-integration
// ============================================================================

// --- area-between-curves d3: region enclosed by y = x^2 and y = bx -----------
fill["c2l-area-between-d3"] = (rng, idx) => {
  const b = rng.pick([2, 3, 4, 6]);
  const area = frac(b ** 3, 6);
  const areaDec = rnd(b ** 3 / 6, 2);
  return {
    id: `gen.c2l-area-between-d3.${idx}`, generated: true, concepts: ["area-between-curves"], difficulty: 3, context: "applied",
    prompt: `A gasket profile is the region enclosed between the parabola $y = x^2$ and the line $y = ${b}x$ (units in cm). Find where the curves cross, then compute the enclosed area.`,
    steps: [
      { instruction: `Solve $x^2 = ${b}x$ for the two crossing $x$-values. Enter the larger one (the smaller is $0$).`, answer: `${b}`, accept: [`x = ${b}`, `x=${b}`], hint: `$x^2 - ${b}x = x(x - ${b}) = 0$.` },
      { instruction: `On $[0, ${b}]$ the line rides above the parabola. Write the integrand top minus bottom, simplified.`, answer: `${b}x - x^2`, accept: [`-x^2 + ${b}x`], hint: `Test a point like $x = 1$: $${b}(1) = ${b}$ beats $1^2 = 1$.` },
      { instruction: `Evaluate $\\int_0^{${b}} (${b}x - x^2)\\,dx$. Give a fraction or decimal.`, answer: area, accept: [`${b ** 3}/6`, areaDec], hint: `Antiderivative $\\frac{${b}x^2}{2} - \\frac{x^3}{3}$; at $x = ${b}$: $\\frac{${b ** 3}}{2} - \\frac{${b ** 3}}{3} = \\frac{${b ** 3}}{6}$.` },
    ],
    finalAnswer: { value: area, unit: "cm^2" },
    solutionNarrative: `The curves cross at $x = 0$ and $x = ${b}$. $\\int_0^{${b}} (${b}x - x^2)\\,dx = \\left[\\frac{${b}x^2}{2} - \\frac{x^3}{3}\\right]_0^{${b}} = \\frac{${b ** 3}}{6} = ${area}\\ \\text{cm}^2$.`,
  };
};

// --- volume-of-revolution d3: washer between y = x + a and y = x -------------
fill["c2l-volume-rev-d3"] = (rng, idx) => {
  let a, L;
  do {
    a = rng.int(1, 3);
    L = rng.int(2, 4);
  } while (a === 2 && L === 2); // outer x+2, inner x on [0,2] is the existing seed
  const I = a * L * L + a * a * L;   // ∫0^L (2ax + a^2) dx
  const vol = rnd(I * 3.14, 2);
  const integrand = polyJoin([{ k: 2 * a, p: 1 }, { k: a * a, p: 0 }]);
  return {
    id: `gen.c2l-volume-rev-d3.${idx}`, generated: true, concepts: ["volume-of-revolution"], difficulty: 3, context: "applied",
    prompt: `A drilled bushing is made by revolving the region between outer curve $y = x + ${a}$ and inner curve $y = x$ from $x = 0$ to $x = ${L}$ (cm) around the $x$-axis (a washer at each slice). Use $\\pi \\approx 3.14$. Find its volume, rounded to two decimals.`,
    steps: [
      { instruction: `Write the washer integrand $R^2 - r^2$ where $R = x + ${a}$ and $r = x$, simplified.`, answer: integrand, accept: [`${a * a} + ${2 * a}x`], hint: `$(x + ${a})^2 - x^2 = x^2 + ${2 * a}x + ${a * a} - x^2$.` },
      { instruction: `Evaluate $\\int_0^{${L}} (${integrand})\\,dx$ (without $\\pi$).`, answer: `${I}`, accept: [], hint: `Antiderivative $${a}x^2 + ${a * a}x$; at $x = ${L}$: $${a * L * L} + ${a * a * L}$.` },
      { instruction: `Multiply by $\\pi \\approx 3.14$ to get the volume.`, answer: vol, accept: nbrs(I * 3.14, 2), hint: `$${I} \\times 3.14$.` },
    ],
    finalAnswer: { value: vol, unit: "cm^3" },
    solutionNarrative: `$V = \\pi \\int_0^{${L}} ((x + ${a})^2 - x^2)\\,dx = \\pi \\int_0^{${L}} (${integrand})\\,dx = ${I}\\pi \\approx ${vol}\\ \\text{cm}^3$.`,
  };
};

// --- average-value d3: falling quantity c - 3m t^2 over [0, T] ---------------
const AVG_CTX = [
  { what: "The concentration of a chemical in a reactor", unit: "mg/L", tunit: "hours", sym: "C" },
  { what: "The temperature above baseline in a curing oven", unit: "degrees C", tunit: "hours", sym: "T" },
  { what: "The signal strength on a fading channel", unit: "millivolts", tunit: "seconds", sym: "S" },
];
fill["c2l-avg-value-d3"] = (rng, idx) => {
  const ctx = rng.pick(AVG_CTX);
  const m = rng.int(1, 2);
  const T = rng.int(2, 3);
  const c = 3 * m * T * T + rng.pick([3, 6, 9, 12]);
  const total = c * T - m * T ** 3;
  const avg = c - m * T * T;
  const anti = `${c}t - ${tmag(m, 3, "t")}`;
  return {
    id: `gen.c2l-avg-value-d3.${idx}`, generated: true, concepts: ["average-value"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} (${ctx.unit}) over a ${T}-${ctx.tunit.replace(/s$/, "")} run is $f(t) = ${c} - ${3 * m}t^2$ for $0 \\le t \\le ${T}$. Find the average value of $f$ over the run.`,
    steps: [
      { instruction: `Write the antiderivative of $${c} - ${3 * m}t^2$.`, answer: anti, accept: [`${anti} + C`], hint: `$\\int ${c}\\,dt = ${c}t$ and $\\int ${3 * m}t^2\\,dt = ${tmag(m, 3, "t")}$.` },
      { instruction: `Evaluate the total $\\int_0^{${T}} (${c} - ${3 * m}t^2)\\,dt$.`, answer: `${total}`, accept: [], hint: `At $t = ${T}$: $${c * T} - ${m * T ** 3}$; the lower limit contributes $0$.` },
      { instruction: `Divide by the interval width $${T}$ to get the average value (${ctx.unit}).`, answer: `${avg}`, accept: [], hint: `$${total} \\div ${T}$.` },
    ],
    finalAnswer: { value: `${avg}`, unit: ctx.unit },
    solutionNarrative: `$\\int_0^{${T}} (${c} - ${3 * m}t^2)\\,dt = [${anti}]_0^{${T}} = ${total}$. Average $= \\frac{${total}}{${T}} = ${avg}$ ${ctx.unit} — the constant level that would give the same total.`,
  };
};

// --- accumulation-and-work d3: work over an interval NOT starting at 0 -------
const WORK_CTX = [
  { what: "A hydraulic ram pushes with force", over: "as it extends", unit: "joules" },
  { what: "A winch drags a sled against a force", over: "along the track", unit: "joules" },
  { what: "A press compacts material with force", over: "through the stroke", unit: "joules" },
];
fill["c2l-accum-work-d3"] = (rng, idx) => {
  const ctx = rng.pick(WORK_CTX);
  const a = rng.int(1, 2);
  const b = rng.int(1, 4);
  const x1 = rng.int(1, 2);
  const x2 = x1 + 2;
  const F2 = a * x2 ** 3 + b * x2 ** 2;
  const F1 = a * x1 ** 3 + b * x1 ** 2;
  const W = F2 - F1;
  const force = polyJoin([{ k: 3 * a, p: 2 }, { k: 2 * b, p: 1 }]);
  const anti = polyJoin([{ k: a, p: 3 }, { k: b, p: 2 }]);
  return {
    id: `gen.c2l-accum-work-d3.${idx}`, generated: true, concepts: ["accumulation-and-work"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} $F(x) = ${force}$ newtons ${ctx.over} from $x = ${x1}$ to $x = ${x2}$ meters. The work done is $W = \\int_{${x1}}^{${x2}} (${force})\\,dx$. Find it. (Careful: the lower limit is not 0 this time.)`,
    steps: [
      { instruction: `Write the antiderivative of $${force}$.`, answer: anti, accept: [`${anti} + C`], hint: `$\\int ${3 * a}x^2 = ${tmag(a, 3)}$ and $\\int ${2 * b}x = ${tmag(b, 2)}$.` },
      { instruction: `Evaluate the antiderivative at the upper limit $x = ${x2}$.`, answer: `${F2}`, accept: [], hint: `$${a}(${x2})^3 + ${b}(${x2})^2 = ${a * x2 ** 3} + ${b * x2 ** 2}$.` },
      { instruction: `Evaluate it at the lower limit $x = ${x1}$.`, answer: `${F1}`, accept: [], hint: `$${a}(${x1})^3 + ${b}(${x1})^2 = ${a * x1 ** 3} + ${b * x1 ** 2}$.` },
      { instruction: `Subtract to get the work (${ctx.unit}).`, answer: `${W}`, accept: [`${W} ${ctx.unit}`], hint: `$${F2} - ${F1}$.` },
    ],
    finalAnswer: { value: `${W}`, unit: ctx.unit },
    solutionNarrative: `$W = [${anti}]_{${x1}}^{${x2}} = ${F2} - ${F1} = ${W}$ ${ctx.unit}. A nonzero lower limit means the lower evaluation genuinely subtracts.`,
  };
};

// --- area-between-curves d1: two horizontal lines over a strip ---------------
fill["c2l-area-between-d1"] = (rng, idx) => {
  let top, bot, L;
  do {
    top = rng.int(5, 9);
    bot = rng.int(1, 4);
    L = rng.int(3, 6);
  } while (top === 6 && bot === 2 && L === 5); // the existing seed's plate
  const h = top - bot;
  const area = h * L;
  return {
    id: `gen.c2l-area-between-d1.${idx}`, generated: true, concepts: ["area-between-curves"], difficulty: 1, context: "applied",
    prompt: `A flat metal strip fills the region between the line $y = ${top}$ (top) and the line $y = ${bot}$ (bottom) from $x = 0$ to $x = ${L}$ (units in cm). What is its cross-sectional area?`,
    steps: [
      { instruction: "Write the integrand top minus bottom.", answer: `${h}`, accept: [`${top} - ${bot}`, `${top}-${bot}`], hint: `$${top} - ${bot}$.` },
      { instruction: `Evaluate $\\int_0^{${L}} ${h}\\,dx$.`, answer: `${area}`, accept: [`${area} cm^2`], hint: `A constant integrand just multiplies by the width: $${h} \\times ${L}$.` },
    ],
    finalAnswer: { value: `${area}`, unit: "cm^2" },
    solutionNarrative: `The gap between the lines is constant: $${top} - ${bot} = ${h}$. So the area is $\\int_0^{${L}} ${h}\\,dx = ${h} \\times ${L} = ${area}$ cm².`,
  };
};

// --- volume-of-revolution d1: constant radius disks ---------------------------
const VOL_CTX_D1 = [
  { what: "A solid roller" },
  { what: "A steel pin" },
  { what: "A round dowel" },
];
fill["c2l-volume-rev-d1"] = (rng, idx) => {
  const ctx = rng.pick(VOL_CTX_D1);
  let R, L;
  do {
    R = rng.int(2, 4);
    L = rng.int(2, 6);
  } while ((R === 2 && L === 5) || (R === 3 && L === 2)); // the two existing seeds
  const I = R * R * L;
  const vol = rnd(I * 3.14, 2);
  return {
    id: `gen.c2l-volume-rev-d1.${idx}`, generated: true, concepts: ["volume-of-revolution"], difficulty: 1, context: "applied",
    prompt: `${ctx.what} is made by revolving the region under $y = ${R}$ from $x = 0$ to $x = ${L}$ (cm) around the $x$-axis. Use $\\pi \\approx 3.14$. Find its volume, rounded to two decimals.`,
    steps: [
      { instruction: `Each disk has radius ${R}. Evaluate $\\int_0^{${L}} ${R}^2\\,dx$ (the integral part, without $\\pi$).`, answer: `${I}`, accept: [], hint: `$${R * R} \\times ${L}$.` },
      { instruction: `Multiply by $\\pi \\approx 3.14$ to get the volume.`, answer: vol, accept: nbrs(I * 3.14, 2), hint: `$${I} \\times 3.14$.` },
    ],
    finalAnswer: { value: vol, unit: "cm^3" },
    solutionNarrative: `$V = \\pi \\int_0^{${L}} ${R}^2\\,dx = \\pi \\cdot ${I} \\approx ${vol}$ cm³ — the familiar cylinder volume $\\pi r^2 h$.`,
  };
};

// --- average-value d1: linear function over a window --------------------------
const AVG_CTX_D1 = [
  { what: "the temperature in a greenhouse", unit: "degrees C" },
  { what: "the depth of water in a filling pool", unit: "cm" },
  { what: "the load on a web server", unit: "percent" },
];
fill["c2l-avg-value-d1"] = (rng, idx) => {
  const ctx = rng.pick(AVG_CTX_D1);
  const m = rng.int(1, 3);
  const c = rng.int(5, 12);
  const T = rng.pick([2, 4, 5]);
  const total = m * T * T + c * T;
  const avg = m * T + c;
  return {
    id: `gen.c2l-avg-value-d1.${idx}`, generated: true, concepts: ["average-value"], difficulty: 1, context: "applied",
    prompt: `Over a ${T}-hour window, ${ctx.what} (${ctx.unit}) is modeled by $f(t) = ${2 * m}t + ${c}$ for $0 \\le t \\le ${T}$. What is the average value of $f$ over the window?`,
    steps: [
      { instruction: `Evaluate the total $\\int_0^{${T}} (${2 * m}t + ${c})\\,dt$.`, answer: `${total}`, accept: [], hint: `Antiderivative $${m}t^2 + ${c}t$; at $t = ${T}$: $${m * T * T} + ${c * T}$.` },
      { instruction: `Divide by the interval width $${T} - 0$ to get the average (${ctx.unit}).`, answer: `${avg}`, accept: [], hint: `$${total} \\div ${T}$.` },
    ],
    finalAnswer: { value: `${avg}`, unit: ctx.unit },
    solutionNarrative: `$\\int_0^{${T}} (${2 * m}t + ${c})\\,dt = [${m}t^2 + ${c}t]_0^{${T}} = ${total}$. Average $= \\frac{${total}}{${T}} = ${avg}$ ${ctx.unit}.`,
  };
};

// --- accumulation-and-work d1: constant inflow rate ---------------------------
const ACCUM_CTX_D1 = [
  { what: "Water flows into a barrel", rate: "liters per minute", t: "minutes", unit: "liters", q: "How many liters enter" },
  { what: "A conveyor delivers gravel", rate: "kg per minute", t: "minutes", unit: "kg", q: "How many kilograms arrive" },
  { what: "A vent releases gas", rate: "cubic meters per minute", t: "minutes", unit: "cubic meters", q: "How much gas escapes" },
];
fill["c2l-accum-work-d1"] = (rng, idx) => {
  const ctx = rng.pick(ACCUM_CTX_D1);
  let c, T;
  do {
    c = rng.int(3, 9);
    T = rng.int(4, 9);
  } while (c === 5 && T === 8); // r = 5 over [0,8] is the existing seed
  const total = c * T;
  return {
    id: `gen.c2l-accum-work-d1.${idx}`, generated: true, concepts: ["accumulation-and-work"], difficulty: 1, context: "applied",
    prompt: `${ctx.what} at a constant rate of $r(t) = ${c}$ ${ctx.rate}. ${ctx.q} during the first ${T} ${ctx.t}?`,
    steps: [
      { instruction: `Write the antiderivative of the constant rate $${c}$.`, answer: `${c}t`, accept: [`${c}t + C`], hint: `$\\int ${c}\\,dt = ${c}t$.` },
      { instruction: `Evaluate $\\int_0^{${T}} ${c}\\,dt$ for the total (${ctx.unit}).`, answer: `${total}`, accept: [`${total} ${ctx.unit}`], hint: `$${c} \\times ${T} - ${c} \\times 0$.` },
    ],
    finalAnswer: { value: `${total}`, unit: ctx.unit },
    solutionNarrative: `A constant rate accumulates linearly: $\\int_0^{${T}} ${c}\\,dt = [${c}t]_0^{${T}} = ${total}$ ${ctx.unit}.`,
  };
};

// --- accumulation-and-work d2: linear spring-style force ----------------------
const WORK_CTX_D2 = [
  { what: "Stretching a spring requires a force", act: "stretching it" },
  { what: "Compressing a strut requires a force", act: "compressing it" },
  { what: "Drawing a bowstring requires a force", act: "drawing it" },
];
fill["c2l-accum-work-d2"] = (rng, idx) => {
  const ctx = rng.pick(WORK_CTX_D2);
  let k, L;
  do {
    k = rng.int(2, 5);
    L = rng.int(2, 5);
  } while (k === 3 && L === 4); // F = 6x over [0,4] is the existing seed
  const W = k * L * L;
  return {
    id: `gen.c2l-accum-work-d2.${idx}`, generated: true, concepts: ["accumulation-and-work"], difficulty: 2, context: "applied",
    prompt: `${ctx.what} $F(x) = ${2 * k}x$ newtons at displacement $x$ meters. How much work is done ${ctx.act} from $x = 0$ to $x = ${L}$ m?`,
    steps: [
      { instruction: `Write the antiderivative of $${2 * k}x$.`, answer: `${k}x^2`, accept: [`${k}x^2 + C`], hint: `$\\frac{${2 * k}x^2}{2} = ${k}x^2$.` },
      { instruction: `Evaluate $\\int_0^{${L}} ${2 * k}x\\,dx$ for the work (joules).`, answer: `${W}`, accept: [`${W} joules`], hint: `$${k}(${L})^2 = ${k} \\times ${L * L}$.` },
    ],
    finalAnswer: { value: `${W}`, unit: "joules" },
    solutionNarrative: `$W = \\int_0^{${L}} ${2 * k}x\\,dx = [${k}x^2]_0^{${L}} = ${k}(${L})^2 = ${W}$ joules.`,
  };
};

// ============================================================================
// Topic: calculus-2.definite-integrals
// ============================================================================

// --- riemann-sums d3: midpoint sum from logged speeds + over/under call ------
const RIEMANN_CTX = [
  { who: "a drone's climb speed", unit: "meters" },
  { who: "a maglev cart's speed", unit: "meters" },
  { who: "a test rocket's speed", unit: "meters" },
];
fill["c2l-riemann-d3"] = (rng, idx) => {
  const ctx = rng.pick(RIEMANN_CTX);
  const a = rng.int(2, 3); // a = 1 would clone the existing seed (v = t^2)
  const sum = 35 * a;   // a(1 + 9 + 25)
  const est = 70 * a;
  const exact = 72 * a;
  const fn = a === 1 ? "t^2" : `${a}t^2`;
  return {
    id: `gen.c2l-riemann-d3.${idx}`, generated: true, concepts: ["riemann-sums"], difficulty: 3, context: "applied",
    prompt: `A sensor logs ${ctx.who} (m/s) over a 6-second run; the speed follows $v(t) = ${fn}$. Estimate the distance with a **midpoint** Riemann sum using $n = 3$ rectangles of width $\\Delta t = 2$, taking the midpoint speeds $v(1) = ${a}$, $v(3) = ${9 * a}$, $v(5) = ${25 * a}$.`,
    steps: [
      { instruction: `Add the three midpoint speeds $v(1) + v(3) + v(5)$.`, answer: `${sum}`, accept: [], hint: `$${a} + ${9 * a} + ${25 * a}$.` },
      { instruction: `Multiply the speed-sum by the rectangle width $\\Delta t = 2$ to estimate the distance.`, answer: `${est}`, accept: [], hint: `$${sum} \\times 2$.` },
      { instruction: `The exact distance is $\\int_0^6 ${fn}\\,dt = ${exact}$ m. Is the midpoint estimate an overestimate or an underestimate here?`, answer: "underestimate", accept: ["under", "an underestimate", "underestimates"], hint: `Compare $${est}$ to $${exact}$ — for a curve bending upward, midpoint rectangles miss a little area.` },
    ],
    finalAnswer: { value: `${est}`, unit: ctx.unit },
    solutionNarrative: `Midpoint speeds $${a}, ${9 * a}, ${25 * a}$ sum to $${sum}$; times width 2 gives $${est}$ m. The exact integral is $${exact}$ m, so the midpoint sum slightly underestimates this upward-bending curve.`,
  };
};

// --- ftc-evaluate d3: negative lower limit, sign care -------------------------
fill["c2l-ftc-evaluate-d3"] = (rng, idx) => {
  let a, b;
  do {
    a = rng.int(1, 2);
    b = rng.int(1, 5);
  } while (5 * a === b || (a === 1 && b === 3)); // nonzero result; (1,3) is the existing seed
  const F2 = 16 * a - 4 * b;
  const Fm1 = a - b;
  const val = F2 - Fm1;
  const integrand = polyJoin([{ k: 4 * a, p: 3 }, { k: -2 * b, p: 1 }]);
  const anti = polyJoin([{ k: a, p: 4 }, { k: -b, p: 2 }]);
  return {
    id: `gen.c2l-ftc-evaluate-d3.${idx}`, generated: true, concepts: ["ftc-evaluate"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int_{-1}^{2} (${integrand})\\,dx$.`,
    steps: [
      { instruction: `Find an antiderivative $F(x)$ of $${integrand}$.`, answer: anti, accept: [`${anti} + C`], hint: `Antiderivative of $${4 * a}x^3$ is $${tmag(a, 4)}$; of $-${2 * b}x$ is $-${tmag(b, 2)}$.` },
      { instruction: "Evaluate $F(2)$.", answer: `${F2}`, accept: [], hint: `$${a}(2)^4 - ${b}(2)^2 = ${16 * a} - ${4 * b}$.` },
      { instruction: "Evaluate $F(-1)$. Mind the even powers.", answer: `${Fm1}`, accept: [], hint: `$${a}(-1)^4 - ${b}(-1)^2 = ${a} - ${b}$.` },
      { instruction: "Compute $F(2) - F(-1)$.", answer: `${val}`, accept: [], hint: `$${F2} - (${Fm1})$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$F(x) = ${anti}$. $F(2) = ${F2}$ and $F(-1) = ${Fm1}$, so the integral is $${F2} - (${Fm1}) = ${val}$.`,
  };
};

// --- area-under-curve d3: nonzero lower limit, downward parabola -------------
fill["c2l-area-under-d3"] = (rng, idx) => {
  const m = rng.int(1, 2);
  const L = rng.int(2, 3);
  const c = 3 * m * L * L + rng.int(1, 6);
  const FL = c * L - m * L ** 3;
  const F1 = c - m;
  const area = FL - F1;
  const anti = `${c}x - ${tmag(m, 3)}`;
  return {
    id: `gen.c2l-area-under-d3.${idx}`, generated: true, concepts: ["area-under-curve"], difficulty: 3, context: "abstract",
    prompt: `Find the exact area under $f(x) = ${c} - ${3 * m}x^2$ from $x = 1$ to $x = ${L}$. (The function stays positive on this interval — but the lower limit is not 0, so both evaluations count.)`,
    steps: [
      { instruction: `Find an antiderivative of $${c} - ${3 * m}x^2$.`, answer: anti, accept: [`${anti} + C`], hint: `Antiderivative of $${c}$ is $${c}x$; of $-${3 * m}x^2$ is $-${tmag(m, 3)}$.` },
      { instruction: `Evaluate $F(${L})$.`, answer: `${FL}`, accept: [], hint: `$${c}(${L}) - ${m}(${L})^3 = ${c * L} - ${m * L ** 3}$.` },
      { instruction: "Evaluate $F(1)$.", answer: `${F1}`, accept: [], hint: `$${c} - ${m}$.` },
      { instruction: `Compute the area $F(${L}) - F(1)$.`, answer: `${area}`, accept: [], hint: `$${FL} - ${F1}$.` },
    ],
    finalAnswer: { value: `${area}`, unit: "square units" },
    solutionNarrative: `$F(x) = ${anti}$; $F(${L}) = ${FL}$ and $F(1) = ${F1}$, so the area is $${FL} - ${F1} = ${area}$.`,
  };
};

// --- net-change d1: distance from a linear velocity ---------------------------
const NET_CTX_D1 = [
  { who: "A car", verb: "travel", unit: "meters" },
  { who: "A cyclist", verb: "travel", unit: "meters" },
  { who: "An elevator", verb: "rise", unit: "meters" },
];
fill["c2l-net-change-d1"] = (rng, idx) => {
  const ctx = rng.pick(NET_CTX_D1);
  let k, T;
  do {
    k = rng.int(2, 6);
    T = rng.int(3, 5);
  } while (k === 3 && T === 4); // v = 6t over [0,4] is the existing seed
  const dist = k * T * T;
  return {
    id: `gen.c2l-net-change-d1.${idx}`, generated: true, concepts: ["net-change"], difficulty: 1, context: "applied",
    prompt: `${ctx.who} moves with velocity $v(t) = ${2 * k}t$ meters per second. How far does it ${ctx.verb} from $t = 0$ to $t = ${T}$ seconds? (Distance $= \\int_0^{${T}} ${2 * k}t\\,dt$.)`,
    steps: [
      { instruction: `Find an antiderivative of $${2 * k}t$.`, answer: `${k}t^2`, accept: [`${k}t^2 + C`], hint: `Antiderivative of $${2 * k}t$ is $${k}t^2$.` },
      { instruction: `Evaluate $\\left[${k}t^2\\right]_0^{${T}} = ${k}(${T}^2) - ${k}(0^2)$.`, answer: `${dist}`, accept: [], hint: `$${k} \\times ${T * T} - 0$.` },
    ],
    finalAnswer: { value: `${dist}`, unit: ctx.unit },
    solutionNarrative: `$\\int_0^{${T}} ${2 * k}t\\,dt = \\left[${k}t^2\\right]_0^{${T}} = ${dist} - 0 = ${dist}$ ${ctx.unit}.`,
  };
};

// --- net-change d3: rate that turns negative, interval [1, 4] -----------------
const NET_CTX_D3 = [
  { what: "A reservoir's net inflow rate", unit: "thousand liters", per: "per hour" },
  { what: "A warehouse's net stocking rate", unit: "hundred crates", per: "per day" },
  { what: "A battery bank's net charging rate", unit: "kilowatt-hours", per: "per hour" },
];
fill["c2l-net-change-d3"] = (rng, idx) => {
  const ctx = rng.pick(NET_CTX_D3);
  const m = 1;
  const k = rng.int(5, 7);
  const F4 = 16 * k - 64 * m;
  const F1 = k - m;
  const net = F4 - F1;
  const rate = polyJoin([{ k: 2 * k, p: 1 }, { k: -3 * m, p: 2 }], "t");
  const anti = polyJoin([{ k, p: 2 }, { k: -m, p: 3 }], "t");
  return {
    id: `gen.c2l-net-change-d3.${idx}`, generated: true, concepts: ["net-change"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} is $r(t) = ${rate}$ ${ctx.unit} ${ctx.per} (positive early, then negative as outflow takes over) for $t$ from 1 to 4. The net change is $\\int_1^4 (${rate})\\,dt$. Find it.`,
    steps: [
      { instruction: `Find an antiderivative of $${rate}$.`, answer: anti, accept: [`${anti} + C`], hint: `Antiderivative of $${2 * k}t$ is $${k}t^2$; of $-3t^2$ is $-t^3$.` },
      { instruction: "Evaluate $F(4)$.", answer: `${F4}`, accept: [], hint: `$${k}(16) - 4^3 = ${16 * k} - 64$.` },
      { instruction: "Evaluate $F(1)$.", answer: `${F1}`, accept: [], hint: `$${k}(1) - 1^3 = ${k} - 1$.` },
      { instruction: `Compute $F(4) - F(1)$ (${ctx.unit}).`, answer: `${net}`, accept: [], hint: `$${F4} - ${F1}$.` },
    ],
    finalAnswer: { value: `${net}`, unit: ctx.unit },
    solutionNarrative: `$F(t) = ${anti}$; $F(4) = ${F4}$, $F(1) = ${F1}$, so the net change is $${F4} - ${F1} = ${net}$ ${ctx.unit} — the losses late in the window partly cancel the early gains.`,
  };
};

// --- riemann-sums d2: left sum from logged linear speeds ----------------------
const RIEMANN_CTX_D2 = [
  { who: "A bike's speed" },
  { who: "A jogger's speed" },
  { who: "A delivery rover's speed" },
];
fill["c2l-riemann-d2"] = (rng, idx) => {
  const ctx = rng.pick(RIEMANN_CTX_D2);
  const a = rng.int(2, 4); // a = 1 would clone the existing seed (v = t + 1)
  const b = rng.int(1, 5);
  const vals = [b, a + b, 2 * a + b, 3 * a + b];
  const sum = 6 * a + 4 * b;
  return {
    id: `gen.c2l-riemann-d2.${idx}`, generated: true, concepts: ["riemann-sums"], difficulty: 2, context: "applied",
    prompt: `${ctx.who} (m/s) is recorded at the start of each 1-second interval over 4 seconds following $v(t) = ${a}t + ${b}$: $v(0) = ${vals[0]}$, $v(1) = ${vals[1]}$, $v(2) = ${vals[2]}$, $v(3) = ${vals[3]}$. Estimate the distance with a **left** Riemann sum ($\\Delta t = 1$).`,
    steps: [
      { instruction: `Add the four left-edge speeds $v(0) + v(1) + v(2) + v(3)$.`, answer: `${sum}`, accept: [], hint: `$${vals[0]} + ${vals[1]} + ${vals[2]} + ${vals[3]}$.` },
      { instruction: `Multiply the speed-sum by $\\Delta t = 1$ to estimate the distance.`, answer: `${sum}`, accept: [`${sum} meters`, `${sum} m`], hint: `$${sum} \\times 1$.` },
    ],
    finalAnswer: { value: `${sum}`, unit: "meters" },
    solutionNarrative: `Left-edge speeds $${vals.join(", ")}$ sum to $${sum}$; times width 1 gives $${sum}$ m. (The exact distance $\\int_0^4 (${a}t + ${b})\\,dt = ${8 * a + 4 * b}$ m is a bit more — left sums undercount an increasing speed.)`,
  };
};

// --- ftc-evaluate d2: lower limit 1, standard FTC chain ------------------------
fill["c2l-ftc-evaluate-d2"] = (rng, idx) => {
  let a, b, L;
  do {
    a = rng.int(1, 2);
    b = rng.int(2, 5);
    L = rng.pick([2, 3]);
  } while (a === 1 && b === 2 && L === 3); // ∫_1^3 (3x^2 + 2)dx is the existing seed
  const FL = a * L ** 3 + b * L;
  const F1 = a + b;
  const val = FL - F1;
  const integrand = polyJoin([{ k: 3 * a, p: 2 }, { k: b, p: 0 }]);
  const anti = polyJoin([{ k: a, p: 3 }, { k: b, p: 1 }]);
  return {
    id: `gen.c2l-ftc-evaluate-d2.${idx}`, generated: true, concepts: ["ftc-evaluate"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\int_1^{${L}} (${integrand})\\,dx$.`,
    steps: [
      { instruction: `Find an antiderivative $F(x)$ of $${integrand}$.`, answer: anti, accept: [`${anti} + C`], hint: `$\\int ${3 * a}x^2\\,dx = ${tmag(a, 3)}$ and $\\int ${b}\\,dx = ${tmag(b, 1)}$.` },
      { instruction: `Evaluate $F(${L})$.`, answer: `${FL}`, accept: [], hint: `$${a}(${L})^3 + ${b}(${L}) = ${a * L ** 3} + ${b * L}$.` },
      { instruction: "Evaluate $F(1)$.", answer: `${F1}`, accept: [], hint: `$${a} + ${b}$.` },
      { instruction: `Compute $F(${L}) - F(1)$.`, answer: `${val}`, accept: [], hint: `$${FL} - ${F1}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$F(x) = ${anti}$. $F(${L}) = ${FL}$ and $F(1) = ${F1}$, so the integral is $${FL} - ${F1} = ${val}$.`,
  };
};

// --- area-under-curve d1: line through the origin ------------------------------
fill["c2l-area-under-d1"] = (rng, idx) => {
  let k, L;
  do {
    k = rng.int(2, 5);
    L = rng.int(2, 4);
  } while (k === 2 && L === 2); // area under 4x on [0,2] is the existing seed
  const area = k * L * L;
  return {
    id: `gen.c2l-area-under-d1.${idx}`, generated: true, concepts: ["area-under-curve"], difficulty: 1, context: "abstract",
    prompt: `Find the exact area under $f(x) = ${2 * k}x$ from $x = 0$ to $x = ${L}$.`,
    steps: [
      { instruction: `Find an antiderivative of $${2 * k}x$.`, answer: `${k}x^2`, accept: [`${k}x^2 + C`], hint: `$\\frac{${2 * k}x^2}{2} = ${k}x^2$.` },
      { instruction: `Evaluate $\\left[${k}x^2\\right]_0^{${L}} = ${k}(${L}^2) - ${k}(0^2)$.`, answer: `${area}`, accept: [], hint: `$${k} \\times ${L * L} - 0$.` },
    ],
    finalAnswer: { value: `${area}`, unit: "square units" },
    solutionNarrative: `$\\int_0^{${L}} ${2 * k}x\\,dx = \\left[${k}x^2\\right]_0^{${L}} = ${area} - 0 = ${area}$ square units.`,
  };
};

// ============================================================================
// Topic: calculus-2.integration-by-parts
// ============================================================================

const EPOW = { 1: "2.718", 2: "7.389", 3: "20.09", 4: "54.60" };
const LNV = { 2: "0.6931", 3: "1.0986", 4: "1.3863", 5: "1.6094" };

// --- parts-formula d1: LIATE choice + evaluate with given antiderivative -----
fill["c2l-parts-formula-d1"] = (rng, idx) => {
  let b, c;
  do {
    b = rng.pick([1, 2]);
    c = rng.pick([1, 2, 3]);
  } while (b === 1 && c === 1); // ∫_0^1 x e^x dx is the existing seed
  const eb = parseFloat(EPOW[b]);
  const val = c * ((b - 1) * eb + 1);
  const ans = rnd(val, 2);
  const cs = c === 1 ? "" : `${c}`;
  return {
    id: `gen.c2l-parts-formula-d1.${idx}`, generated: true, concepts: ["parts-formula"], difficulty: 1, context: "abstract",
    prompt: `Set up integration by parts for $\\int_0^{${b}} ${cs}x\\,e^x\\,dx$ and evaluate it. Use $e${b === 1 ? "" : `^${b}`} \\approx ${EPOW[b]}$.`,
    steps: [
      { instruction: `By the LIATE rule, which factor of $x\\,e^x$ should you call $u$? (Type the factor; the constant ${c === 1 ? "1" : c} just rides along.)`, answer: "x", accept: ["u = x", "u=x"], hint: "Algebraic (A) comes before Exponential (E), so $u$ is the algebraic factor." },
      { instruction: `With $u = x$ and $dv = e^x\\,dx$, the antiderivative is $${cs}(x-1)e^x$. Evaluate $\\big[${cs}(x-1)e^x\\big]_0^{${b}}$. Round to 2 decimal places.`, answer: ans, accept: [...nbrs(val, 2), ...(val === Math.round(val) ? [`${Math.round(val)}`, rnd(val, 1)] : [])], hint: `At $x=${b}$: $${c}(${b - 1})(${EPOW[b]})$. At $x=0$: $${c}(-1)(1) = ${-c}$. Subtract.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Choose $u = x$, $dv = e^x dx$, giving antiderivative $${cs}(x-1)e^x$. From 0 to ${b}: $${rnd(c * (b - 1) * eb, 2)} - (${-c}) = ${ans}$.`,
  };
};

// --- polynomial-times-exponential d1: [(x-1)e^x] from 1 to b ------------------
fill["c2l-poly-exp-d1"] = (rng, idx) => {
  const b = rng.pick([2, 4]); // b = 3 would clone the existing seed (∫_1^3 x e^x dx)
  const eb = parseFloat(EPOW[b]);
  const val = (b - 1) * eb;
  const ans = rnd(val, 2);
  return {
    id: `gen.c2l-poly-exp-d1.${idx}`, generated: true, concepts: ["polynomial-times-exponential"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\int_1^{${b}} x\\,e^x\\,dx$. Use $e^${b} \\approx ${EPOW[b]}$.`,
    steps: [
      { instruction: "The antiderivative of $x\\,e^x$ is $(x-1)e^x$. What is its value at the lower limit $x = 1$?", answer: "0", accept: [], hint: "$(1-1)e^1 = 0 \\cdot e$." },
      { instruction: `Evaluate $\\big[(x-1)e^x\\big]_1^{${b}}$. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `At $x=${b}$: $(${b - 1})(${EPOW[b]}) = ${rnd(val, 2)}$; subtract the 0 from the lower limit.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Antiderivative $(x-1)e^x$. At ${b}: $${b - 1} \\cdot e^${b} \\approx ${ans}$; at 1: $0$. Result $\\approx ${ans}$.`,
  };
};

// --- logarithmic-integrals d1: ∫_1^b ln x dx ---------------------------------
fill["c2l-log-integrals-d1"] = (rng, idx) => {
  const b = rng.pick([3, 4, 5]); // b = 2 would clone the existing seed (∫_1^2 ln x dx)
  const lnb = parseFloat(LNV[b]);
  const val = b * lnb - b + 1;
  const ans = rnd(val, 2);
  return {
    id: `gen.c2l-log-integrals-d1.${idx}`, generated: true, concepts: ["logarithmic-integrals"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\int_1^{${b}} \\ln x\\,dx$ using parts (with $u = \\ln x$, $dv = dx$ the antiderivative is $x\\ln x - x$). Use $\\ln ${b} \\approx ${LNV[b]}$.`,
    steps: [
      { instruction: "What is the value of $x\\ln x - x$ at the lower limit $x = 1$?", answer: "-1", accept: [], hint: "$1 \\cdot \\ln 1 - 1 = 0 - 1$." },
      { instruction: `Evaluate $\\big[x\\ln x - x\\big]_1^{${b}}$. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `At $x=${b}$: $${b}(${LNV[b]}) - ${b} = ${rnd(b * lnb - b, 4)}$. Subtract $-1$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Antiderivative $x\\ln x - x$. From 1 to ${b}: $${rnd(b * lnb - b, 4)} - (-1) = ${ans}$.`,
  };
};

// --- logarithmic-integrals d3: ∫_1^b kx ln x dx (parts with u = ln x) --------
fill["c2l-log-integrals-d3"] = (rng, idx) => {
  const b = rng.pick([2, 3]);
  const k = rng.pick([2, 4]);
  const lnb = parseFloat(LNV[b]);
  // antiderivative of kx ln x: (k/2)x^2 ln x - (k/4)x^2
  const c2 = k / 2, c4 = k / 4;
  const val = c2 * b * b * lnb - c4 * b * b + c4;
  const ans = rnd(val, 2);
  const vAns = c2 === 1 ? "x^2/2" : `${tmag(c2, 2)}`;
  const antiTex = k === 2 ? "x^2\\ln x - \\tfrac{x^2}{2}" : "2x^2\\ln x - x^2";
  return {
    id: `gen.c2l-log-integrals-d3.${idx}`, generated: true, concepts: ["logarithmic-integrals"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int_1^{${b}} ${k}x\\,\\ln x\\,dx$ using parts. Use $\\ln ${b} \\approx ${LNV[b]}$.`,
    steps: [
      { instruction: "By LIATE, which factor is $u$? (Type the factor.)", answer: "ln x", accept: ["lnx", "ln(x)"], hint: "Logarithmic (L) comes first, so $u = \\ln x$." },
      { instruction: `With $dv = ${k}x\\,dx$, find $v$ (integrate $${k}x$).`, answer: k === 2 ? "x^2" : "2x^2", accept: [k === 2 ? "x^2 + C" : "2x^2 + C"], hint: `$\\int ${k}x\\,dx = ${k === 2 ? "x^2" : "2x^2"}$.` },
      { instruction: `Applying parts gives antiderivative $${antiTex}$. Evaluate it from 1 to ${b}. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `At $x=${b}$: $${rnd(c2 * b * b, 2)}(${LNV[b]}) - ${rnd(c4 * b * b, 2)}$. At $x=1$: $0 - ${rnd(c4, 2)}$. Subtract.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `With $u = \\ln x$, $v = ${k === 2 ? "x^2" : "2x^2"}$ (halved into the formula), the antiderivative is $${antiTex}$. From 1 to ${b} it evaluates to $\\approx ${ans}$.`,
  };
};

// --- parts-applications d1: work from a force c·x·e^x over [0, 1] ------------
const PARTS_APP_CTX = [
  { what: "A variable force", form: "pushes a probe along a rail", unit: "joules", q: "work done" },
  { what: "An actuator force", form: "drives a piston along its bore", unit: "joules", q: "work done" },
  { what: "A magnetic force", form: "pulls a slider along a track", unit: "joules", q: "work done" },
];
fill["c2l-parts-apps-d1"] = (rng, idx) => {
  const ctx = rng.pick(PARTS_APP_CTX);
  const c = rng.int(2, 6);
  return {
    id: `gen.c2l-parts-apps-d1.${idx}`, generated: true, concepts: ["parts-applications"], difficulty: 1, context: "applied",
    prompt: `${ctx.what} $F(x) = ${c}x\\,e^x$ newtons ${ctx.form} from $x = 0$ to $x = 1$ meters. The ${ctx.q} is $W = ${c}\\int_0^1 x\\,e^x\\,dx$, and the antiderivative of $x\\,e^x$ is $(x-1)e^x$. Find the work.`,
    steps: [
      { instruction: "What is $(x-1)e^x$ at the upper limit $x = 1$?", answer: "0", accept: [], hint: "$(1-1)e^1 = 0$." },
      { instruction: `At $x = 0$ it is $-1$, so $\\int_0^1 x\\,e^x\\,dx = 0 - (-1) = 1$. Multiply by ${c} for the work (${ctx.unit}).`, answer: `${c}`, accept: [`${c} ${ctx.unit}`, `${c}.00`], hint: `$${c} \\times 1$.` },
    ],
    finalAnswer: { value: `${c}`, unit: ctx.unit },
    solutionNarrative: `$\\int_0^1 x e^x dx = [(x-1)e^x]_0^1 = 0 - (-1) = 1$, so $W = ${c} \\times 1 = ${c}$ ${ctx.unit}.`,
  };
};

// --- parts-applications d3: average value of c·t·e^{-t} over [0, 2] ----------
const PARTS_AVG_CTX = [
  { what: "A decaying signal has value", unit: "", noun: "signal" },
  { what: "A drug's absorption rate is", unit: "mg per hour", noun: "rate" },
  { what: "An eddy-current braking force is", unit: "newtons", noun: "force" },
];
fill["c2l-parts-apps-d3"] = (rng, idx) => {
  const ctx = rng.pick(PARTS_AVG_CTX);
  const c = rng.pick([2, 3, 4, 6]);
  const base = 1 - 3 * 0.1353;      // ∫_0^2 t e^{-t} dt with e^{-2} ≈ 0.1353
  const total = c * base;
  const avg = total / 2;
  const ansBase = rnd(base, 2);
  const ansTotal = rnd(total, 2);
  const ansAvg = rnd(avg, 2);
  return {
    id: `gen.c2l-parts-apps-d3.${idx}`, generated: true, concepts: ["parts-applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} $f(t) = ${c}t\\,e^{-t}$ ${ctx.unit ? `(${ctx.unit}) ` : ""}over the interval $[0, 2]$. Its average value is $\\bar{f} = \\tfrac{1}{2}\\int_0^2 ${c}t\\,e^{-t}\\,dt$. Find the average. Use $e^{-2} \\approx 0.1353$.`,
    steps: [
      { instruction: `First find $\\int_0^2 t\\,e^{-t}\\,dt$ using the parts antiderivative $-(t+1)e^{-t}$. Round to 2 decimal places.`, answer: ansBase, accept: nbrs(base, 2), hint: `At $t=2$: $-(3)(0.1353) = -0.4059$. At $t=0$: $-1$. Subtract: $-0.4059 - (-1)$.` },
      { instruction: `Multiply by the constant ${c} to get $\\int_0^2 ${c}t\\,e^{-t}\\,dt$. Round to 2 decimal places.`, answer: ansTotal, accept: nbrs(total, 2), hint: `$${c} \\times ${rnd(base, 4)}$.` },
      { instruction: `Divide by the interval length 2 for the average value. Round to 2 decimal places.`, answer: ansAvg, accept: nbrs(avg, 2), hint: `$${rnd(total, 4)} \\div 2$.` },
    ],
    finalAnswer: { value: ansAvg, unit: ctx.unit },
    solutionNarrative: `$\\int_0^2 t e^{-t} dt = [-(t+1)e^{-t}]_0^2 \\approx ${rnd(base, 4)}$. Times ${c}: $\\approx ${ansTotal}$; divided by 2: average $\\approx ${ansAvg}$.`,
  };
};

// --- parts-formula d3: x sin x over [0, π] -------------------------------------
fill["c2l-parts-formula-d3"] = (rng, idx) => {
  const c = rng.int(1, 3);
  const cs = c === 1 ? "" : `${c}`;
  const val = c * 3.14;
  const ans = rnd(val, 2);
  return {
    id: `gen.c2l-parts-formula-d3.${idx}`, generated: true, concepts: ["parts-formula"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int_0^{\\pi} ${cs}x\\,\\sin x\\,dx$ using integration by parts. Use $\\pi \\approx 3.14$.`,
    steps: [
      { instruction: "By LIATE, which factor is $u$? (Type the factor.)", answer: "x", accept: ["u = x", "u=x"], hint: "Algebraic (A) beats Trig (T), so $u = x$." },
      { instruction: `With $u = x$ and $dv = \\sin x\\,dx$, the antiderivative is $${cs}(\\sin x - x\\cos x)$. What is its value at the lower limit $x = 0$?`, answer: "0", accept: [], hint: "$\\sin 0 = 0$ and $0 \\cdot \\cos 0 = 0$." },
      { instruction: `Evaluate $\\big[${cs}(\\sin x - x\\cos x)\\big]_0^{\\pi}$. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `At $x = \\pi$: $\\sin\\pi - \\pi\\cos\\pi = 0 - \\pi(-1) = \\pi$, so the bracket is $${c} \\cdot 3.14$. Subtract the 0 from the lower limit.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `With $u = x$, $dv = \\sin x\\,dx$, the antiderivative is $${cs}(\\sin x - x\\cos x)$. Since $\\cos\\pi = -1$, at $\\pi$ it equals $${c}\\pi \\approx ${ans}$; at 0 it is 0. Result $\\approx ${ans}$.`,
  };
};

// --- polynomial-times-exponential d3: c x^2 e^x needs parts twice --------------
fill["c2l-poly-exp-d3"] = (rng, idx) => {
  const c = rng.pick([2, 3, 4]); // c = 1 over [0,1] is the existing seed
  const e2 = parseFloat(EPOW[2]);
  const base = 2 * e2 - 2;       // ∫_0^2 x^2 e^x dx
  const val = c * base;
  const ansBase = rnd(base, 2);
  const ans = rnd(val, 2);
  return {
    id: `gen.c2l-poly-exp-d3.${idx}`, generated: true, concepts: ["polynomial-times-exponential"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int_0^2 ${c}x^2\\,e^x\\,dx$. This requires applying parts twice. Use $e^2 \\approx ${EPOW[2]}$.`,
    steps: [
      { instruction: "After applying parts twice, the antiderivative of $x^2 e^x$ is $(x^2 - 2x + 2)e^x$. Confirm the bracket polynomial by typing it.", answer: "x^2 - 2x + 2", accept: ["x^2-2x+2"], hint: "First pass gives $x^2 e^x - 2\\int x e^x dx$; the inner integral is $(x-1)e^x$, so combine." },
      { instruction: `Evaluate $\\big[(x^2 - 2x + 2)e^x\\big]_0^2$ using $e^2 \\approx ${EPOW[2]}$. Round to 2 decimal places.`, answer: ansBase, accept: nbrs(base, 2), hint: `At $x=2$: $(4 - 4 + 2)(${EPOW[2]}) = ${rnd(2 * e2, 3)}$. At $x=0$: $(2)(1) = 2$. Subtract.` },
      { instruction: `Multiply by the constant ${c} out front. Round to 2 decimal places.`, answer: ans, accept: nbrs(val, 2), hint: `$${c} \\times ${rnd(base, 4)}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `Two passes give antiderivative $(x^2-2x+2)e^x$; from 0 to 2 it is $2e^2 - 2 \\approx ${ansBase}$. Times ${c}: $\\approx ${ans}$.`,
  };
};

// --- parts-applications d2: scaled t e^{-t} total over [0, 1] ------------------
const PARTS_APP_CTX_D2 = [
  { lead: "A startup earns income at a rate of", rate: "thousand dollars per year (already discounted)", span: "The present value of the first year is", q: "present value", unit: "thousand dollars", varn: "t" },
  { lead: "A damping force is", rate: "newtons", span: "As a slider moves from $x = 0$ to $x = 1$ meters, the work done is", q: "work", unit: "joules", varn: "x" },
  { lead: "A transmitter radiates power", rate: "watts", span: "Over the first second, the energy delivered is", q: "energy", unit: "joules", varn: "t" },
];
fill["c2l-parts-apps-d2"] = (rng, idx) => {
  const ctx = rng.pick(PARTS_APP_CTX_D2);
  const c = rng.int(2, 6);
  const v = ctx.varn;
  const base = 1 - 2 * 0.3679;   // ∫_0^1 t e^{-t} dt with e^{-1} ≈ 0.3679
  const total = c * base;
  const ansBase = rnd(base, 2);
  const ans = rnd(total, 2);
  return {
    id: `gen.c2l-parts-apps-d2.${idx}`, generated: true, concepts: ["parts-applications"], difficulty: 2, context: "applied",
    prompt: `${ctx.lead} $f(${v}) = ${c}${v}\\,e^{-${v}}$ ${ctx.rate}. ${ctx.span} $${c}\\int_0^1 ${v}\\,e^{-${v}}\\,d${v}$. With $u = ${v}$ and $dv = e^{-${v}}\\,d${v}$, the antiderivative of $${v}\\,e^{-${v}}$ is $-(${v}+1)e^{-${v}}$. Find the ${ctx.q}. Use $e^{-1} \\approx 0.3679$.`,
    steps: [
      { instruction: `Evaluate $\\big[-(${v}+1)e^{-${v}}\\big]_0^1$. Round to 2 decimal places.`, answer: ansBase, accept: nbrs(base, 2), hint: `At $${v}=1$: $-(2)(0.3679) = -0.7358$. At $${v}=0$: $-(1)(1) = -1$. Subtract: $-0.7358 - (-1)$.` },
      { instruction: `Multiply by the constant ${c} for the ${ctx.q} (${ctx.unit}). Round to 2 decimal places.`, answer: ans, accept: nbrs(total, 2), hint: `$${c} \\times ${rnd(base, 4)}$.` },
    ],
    finalAnswer: { value: ans, unit: ctx.unit },
    solutionNarrative: `$\\int_0^1 ${v} e^{-${v}} d${v} = [-(${v}+1)e^{-${v}}]_0^1 = -0.7358 - (-1) = ${rnd(base, 4)}$. Times ${c}: $\\approx ${ans}$ ${ctx.unit}.`,
  };
};

// ============================================================================
// Topic: calculus-2.integration-by-substitution
// ============================================================================

// --- choosing-u d3: balance a constant on an applied rate ---------------------
const CHOOSE_CTX = [
  { what: "A sensor reports a data rate", unit: "MB per second" },
  { what: "A pipeline meter reads a flow", unit: "liters per second" },
  { what: "A telescope logs a photon rate", unit: "counts per second" },
];
fill["c2l-choosing-u-d3"] = (rng, idx) => {
  const ctx = rng.pick(CHOOSE_CTX);
  let a, b0, kk, n;
  do {
    a = rng.int(2, 4);            // u = a t^2 + b0, du = 2a t dt
    b0 = rng.int(1, 5);
    kk = rng.int(2, 3);           // outer coefficient c = 2a * kk
    n = rng.pick([4, 5, 6]);
  } while (a === 2 && b0 === 3 && kk === 2 && n === 6); // 8t(2t^2+3)^6 is the existing seed
  const c = 2 * a * kk;
  return {
    id: `gen.c2l-choosing-u-d3.${idx}`, generated: true, concepts: ["choosing-u"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} $r(t) = ${c}t\\,(${a}t^2+${b0})^{${n}}$ ${ctx.unit}. To integrate it by substitution, set $u = ${a}t^2 + ${b0}$. Find $\\frac{du}{dt}$, then the constant $k$ with $${c}t\\,dt = k\\,du$, then the rewritten integrand.`,
    steps: [
      { instruction: `Compute $\\frac{du}{dt}$ for $u = ${a}t^2 + ${b0}$.`, answer: `${2 * a}t`, accept: [], hint: `Differentiate $${a}t^2 + ${b0}$ with respect to $t$.` },
      { instruction: `Since $du = ${2 * a}t\\,dt$, solve for the constant $k$ in $${c}t\\,dt = k\\,du$.`, answer: `${kk}`, accept: [`k = ${kk}`, `k=${kk}`], hint: `$${c}t\\,dt$ is how many times $${2 * a}t\\,dt$?` },
      { instruction: `In the rewritten integral $${kk}\\int u^{?}\\,du$, what power of $u$ appears?`, answer: `${n}`, accept: [`u^${n}`], hint: `The power on the parenthesis carries straight over to $u$.` },
    ],
    finalAnswer: { value: `du = ${2 * a}t dt, k = ${kk}`, unit: "" },
    solutionNarrative: `$\\frac{du}{dt} = ${2 * a}t$, so $du = ${2 * a}t\\,dt$ and $${c}t\\,dt = ${kk}\\,du$. The integral becomes $${kk}\\int u^{${n}}\\,du$ — no $t$ survives, so the choice of $u$ was right.`,
  };
};

// --- indefinite-substitution d2: ∫ x (x^2+b)^m dx with a half to balance ------
fill["c2l-indef-sub-d2"] = (rng, idx) => {
  const b = rng.pick([2, 3, 5, 6]);
  const m = rng.pick([2, 3]);
  const d = 2 * (m + 1); // 6 or 8
  const uAns = `u^${m + 1}/${d} + C`;
  const xAns = `(x^2+${b})^${m + 1}/${d} + C`;
  return {
    id: `gen.c2l-indef-sub-d2.${idx}`, generated: true, concepts: ["indefinite-substitution"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\int x\\,(x^2+${b})^{${m}}\\,dx$ using $u = x^2 + ${b}$. Note $du = 2x\\,dx$, so $x\\,dx = \\tfrac{1}{2}\\,du$. Give the antiderivative in $x$ (include + C).`,
    steps: [
      { instruction: `After substituting, the integral becomes $\\tfrac{1}{2}\\int u^{${m}}\\,du$. Integrate it (in $u$, include + C).`, answer: uAns, accept: [`(1/${d})u^${m + 1} + C`, `u^${m + 1} / ${d} + C`], hint: `$\\int u^{${m}}\\,du = \\frac{u^{${m + 1}}}{${m + 1}}$; then multiply by $\\frac{1}{2}$.` },
      { instruction: `Back-substitute $u = x^2 + ${b}$.`, answer: xAns, accept: [`(1/${d})(x^2+${b})^${m + 1} + C`, `(x^2 + ${b})^${m + 1} / ${d} + C`], hint: `Replace $u$ with $x^2 + ${b}$.` },
    ],
    finalAnswer: { value: xAns, unit: "" },
    solutionNarrative: `$\\frac{1}{2}\\int u^{${m}}\\,du = \\frac{1}{2}\\cdot\\frac{u^{${m + 1}}}{${m + 1}} + C = \\frac{u^{${m + 1}}}{${d}} + C = \\frac{(x^2+${b})^{${m + 1}}}{${d}} + C$.`,
  };
};

// --- indefinite-substitution d3: constant balances away completely ------------
fill["c2l-indef-sub-d3"] = (rng, idx) => {
  let m, b;
  do {
    m = rng.pick([2, 3]);
    b = rng.int(2, 7);
  } while (m === 3 && b === 2); // 12x^2(x^3+2)^3 is the existing seed
  const K = 3 * (m + 1);          // 9 or 12
  const xAns = `(x^3+${b})^${m + 1} + C`;
  return {
    id: `gen.c2l-indef-sub-d3.${idx}`, generated: true, concepts: ["indefinite-substitution"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int ${K}x^2\\,(x^3+${b})^{${m}}\\,dx$ using $u = x^3 + ${b}$. Give the antiderivative in $x$ (include + C).`,
    steps: [
      { instruction: `Compute $\\frac{du}{dx}$ for $u = x^3 + ${b}$.`, answer: "3x^2", accept: [], hint: `Differentiate $x^3 + ${b}$.` },
      { instruction: `Since $du = 3x^2\\,dx$, solve for the constant $c$ in $${K}x^2\\,dx = c\\,du$.`, answer: `${m + 1}`, accept: [`c = ${m + 1}`, `c=${m + 1}`], hint: `$${K} \\div 3$.` },
      { instruction: `Integrate $${m + 1}\\int u^{${m}}\\,du$ and back-substitute $u = x^3 + ${b}$ (include + C).`, answer: xAns, accept: [`(x^3 + ${b})^${m + 1} + C`], hint: `$${m + 1}\\cdot\\frac{u^{${m + 1}}}{${m + 1}} = u^{${m + 1}}$ — the constant cancels the denominator exactly.` },
    ],
    finalAnswer: { value: xAns, unit: "" },
    solutionNarrative: `$du = 3x^2\\,dx$, so $${K}x^2\\,dx = ${m + 1}\\,du$. Then $${m + 1}\\int u^{${m}}\\,du = u^{${m + 1}} + C = (x^3+${b})^{${m + 1}} + C$.`,
  };
};

// --- definite-substitution d3: change limits, telescoping cubes ---------------
fill["c2l-def-sub-d3"] = (rng, idx) => {
  const b = rng.int(1, 3);
  const hi = b + 4;
  const val = hi ** 3 - b ** 3;
  return {
    id: `gen.c2l-def-sub-d3.${idx}`, generated: true, concepts: ["definite-substitution"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\int_0^2 6x\\,(x^2+${b})^{2}\\,dx$ using $u = x^2 + ${b}$ and changing the limits.`,
    steps: [
      { instruction: `With $du = 2x\\,dx$, solve for the constant $k$ in $6x\\,dx = k\\,du$.`, answer: "3", accept: ["k = 3", "k=3"], hint: "$6x\\,dx$ is three times $2x\\,dx$." },
      { instruction: `Find the new lower limit: evaluate $u = x^2 + ${b}$ at $x = 0$.`, answer: `${b}`, accept: [], hint: `Plug $x = 0$ into $x^2 + ${b}$.` },
      { instruction: `Find the new upper limit: evaluate $u = x^2 + ${b}$ at $x = 2$.`, answer: `${hi}`, accept: [], hint: `$4 + ${b}$.` },
      { instruction: `Evaluate $3\\int_{${b}}^{${hi}} u^2\\,du$. Give the numeric value.`, answer: `${val}`, accept: [], hint: `$3\\big[\\frac{u^3}{3}\\big]_{${b}}^{${hi}} = \\big[u^3\\big]_{${b}}^{${hi}} = ${hi ** 3} - ${b ** 3}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$6x\\,dx = 3\\,du$ and the limits become ${b} and ${hi}: $3\\int_{${b}}^{${hi}} u^2\\,du = \\big[u^3\\big]_{${b}}^{${hi}} = ${hi ** 3} - ${b ** 3} = ${val}$.`,
  };
};

// --- substitution-applications d1: clean accumulated total --------------------
const SUB_APP_CTX_D1 = [
  { what: "Water flows into a tank", rate: "liters per minute", t: "minutes", unit: "liters", q: "How many liters enter" },
  { what: "Pollutant drifts into a pond", rate: "kg per day", t: "days", unit: "kg", q: "How much accumulates" },
  { what: "Data streams into an archive", rate: "GB per hour", t: "hours", unit: "GB", q: "How much is stored" },
];
fill["c2l-sub-apps-d1"] = (rng, idx) => {
  const ctx = rng.pick(SUB_APP_CTX_D1);
  const b = rng.int(1, 4);
  const hi = b + 4;
  const val = 8 + 4 * b;   // (hi^2 - b^2)/2
  return {
    id: `gen.c2l-sub-apps-d1.${idx}`, generated: true, concepts: ["substitution-applications"], difficulty: 1, context: "applied",
    prompt: `${ctx.what} at a rate $r(t) = 2t\\,(t^2+${b})$ ${ctx.rate}. ${ctx.q} during the first 2 ${ctx.t}? Compute $\\int_0^2 2t\\,(t^2+${b})\\,dt$ with $u = t^2 + ${b}$.`,
    steps: [
      { instruction: `Find the new limits: evaluate $u = t^2 + ${b}$ at $t = 0$ and $t = 2$. Enter the upper limit (at $t = 2$).`, answer: `${hi}`, accept: [], hint: `At $t=0$, $u=${b}$; at $t=2$, $u = 4 + ${b}$.` },
      { instruction: `With $du = 2t\\,dt$, evaluate $\\int_{${b}}^{${hi}} u\\,du$. Give the numeric value (${ctx.unit}).`, answer: `${val}`, accept: [`${val} ${ctx.unit}`], hint: `$\\big[\\frac{u^2}{2}\\big]_{${b}}^{${hi}} = \\frac{${hi * hi} - ${b * b}}{2}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: `Since $2t\\,dt = du$, the integral is $\\int_{${b}}^{${hi}} u\\,du = \\frac{${hi * hi} - ${b * b}}{2} = ${val}$ ${ctx.unit}.`,
  };
};

// --- substitution-applications d3: balance a constant AND change limits ------
const SUB_APP_CTX_D3 = [
  { what: "A factory's marginal cost of the $x$-th batch is", rate: "dollars per batch", range: "going from 0 to 2 batches", unit: "dollars", q: "total added cost" },
  { what: "A borehole pump's power draw at depth $x$ is", rate: "kilowatt-hours per meter", range: "drilling from 0 to 2 meters", unit: "kilowatt-hours", q: "total energy used" },
  { what: "A composter's gas output on day $x$ is", rate: "liters per day", range: "over days 0 to 2", unit: "liters", q: "total gas produced" },
];
fill["c2l-sub-apps-d3"] = (rng, idx) => {
  let c, b;
  do {
    c = rng.pick([2, 4, 5]);
    b = rng.pick([2, 4, 6, 8]);
  } while (c === 5 && b === 8); // avoid cloning the seed problem
  const K = 3 * c;
  const hi = 8 + b;
  const val = c * (32 + 8 * b);  // c/2 * (hi^2 - b^2)
  const ctx = rng.pick(SUB_APP_CTX_D3);
  return {
    id: `gen.c2l-sub-apps-d3.${idx}`, generated: true, concepts: ["substitution-applications"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} $C'(x) = ${K}x^2\\,(x^3+${b})$ ${ctx.rate}. Find the ${ctx.q} ${ctx.range}: compute $\\int_0^2 ${K}x^2\\,(x^3+${b})\\,dx$ using $u = x^3 + ${b}$.`,
    steps: [
      { instruction: `Compute $\\frac{du}{dx}$ for $u = x^3 + ${b}$.`, answer: "3x^2", accept: [], hint: `Differentiate $x^3 + ${b}$.` },
      { instruction: `Since $du = 3x^2\\,dx$, then $${K}x^2\\,dx = ${c}\\,du$. Find the new limits and enter the upper limit (at $x = 2$).`, answer: `${hi}`, accept: [], hint: `At $x = 2$, $u = 8 + ${b}$.` },
      { instruction: `Evaluate $${c}\\int_{${b}}^{${hi}} u\\,du$. Give the numeric value (${ctx.unit}).`, answer: `${val}`, accept: [`${val} ${ctx.unit}`], hint: `$${c}\\big[\\frac{u^2}{2}\\big]_{${b}}^{${hi}} = \\frac{${c}}{2}(${hi * hi} - ${b * b})$.` },
    ],
    finalAnswer: { value: `${val}`, unit: ctx.unit },
    solutionNarrative: `$${K}x^2\\,dx = ${c}\\,du$, limits ${b} to ${hi}: $${c}\\int_{${b}}^{${hi}} u\\,du = \\frac{${c}}{2}(${hi * hi} - ${b * b}) = ${val}$ ${ctx.unit}.`,
  };
};

// --- choosing-u d2: pick u, compute du, balance a half -------------------------
fill["c2l-choosing-u-d2"] = (rng, idx) => {
  const b = rng.int(2, 9) * rng.pick([1, -1]);
  const n = rng.int(3, 6);
  const bs = b < 0 ? `- ${-b}` : `+ ${b}`;
  const u = `x^2 ${bs}`;
  return {
    id: `gen.c2l-choosing-u-d2.${idx}`, generated: true, concepts: ["choosing-u"], difficulty: 2, context: "abstract",
    prompt: `For $\\int x\\,(x^2 ${bs})^{${n}}\\,dx$, find $u$, then find the constant $k$ so that $x\\,dx = k\\,du$.`,
    steps: [
      { instruction: "Choose the inner function $u$. Enter it as an expression in $x$.", answer: u, accept: [`x^2${b < 0 ? "-" : "+"}${Math.abs(b)}`], hint: "Take $u$ to be the base of the power — the inside of the parentheses." },
      { instruction: "Compute $\\frac{du}{dx}$.", answer: "2x", accept: [], hint: `Differentiate $x^2 ${bs}$; the constant drops out.` },
      { instruction: `Since $du = 2x\\,dx$, solve for the constant $k$ in $x\\,dx = k\\,du$.`, answer: "1/2", accept: ["0.5"], hint: "$x\\,dx$ is half of $2x\\,dx$." },
    ],
    finalAnswer: { value: `u = ${u}, k = 1/2`, unit: "" },
    solutionNarrative: `$u = x^2 ${bs}$ gives $du = 2x\\,dx$, so $x\\,dx = \\tfrac{1}{2}\\,du$ — the integral becomes $\\tfrac{1}{2}\\int u^{${n}}\\,du$ with no $x$ left over.`,
  };
};

// --- indefinite-substitution d1: du matches exactly ----------------------------
fill["c2l-indef-sub-d1"] = (rng, idx) => {
  const b = rng.int(2, 7);
  const m = rng.pick([2, 3]);
  const d = m + 1;
  const uAns = `u^${d}/${d} + C`;
  const xAns = `(x^3+${b})^${d}/${d} + C`;
  return {
    id: `gen.c2l-indef-sub-d1.${idx}`, generated: true, concepts: ["indefinite-substitution"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\int 3x^2\\,(x^3+${b})^{${m}}\\,dx$ using $u = x^3 + ${b}$. Note $du = 3x^2\\,dx$ matches exactly. Give the antiderivative in terms of $x$ (include + C).`,
    steps: [
      { instruction: `With $du = 3x^2\\,dx$, the integral becomes $\\int u^{${m}}\\,du$. Integrate it (in $u$, include + C).`, answer: uAns, accept: [`(1/${d})u^${d} + C`, `u^${d} / ${d} + C`], hint: `Power rule: $\\int u^{${m}}\\,du = \\frac{u^{${d}}}{${d}}$.` },
      { instruction: `Back-substitute $u = x^3 + ${b}$ to write the answer in $x$.`, answer: xAns, accept: [`(1/${d})(x^3+${b})^${d} + C`, `(x^3 + ${b})^${d} / ${d} + C`], hint: `Replace $u$ with $x^3 + ${b}$.` },
    ],
    finalAnswer: { value: xAns, unit: "" },
    solutionNarrative: `Since $du = 3x^2\\,dx$, $\\int 3x^2 (x^3+${b})^{${m}}\\,dx = \\int u^{${m}}\\,du = \\frac{u^{${d}}}{${d}} + C = \\frac{(x^3+${b})^{${d}}}{${d}} + C$.`,
  };
};

// --- definite-substitution d1: du matches, change the limits -------------------
fill["c2l-def-sub-d1"] = (rng, idx) => {
  const b = rng.int(2, 6); // b = 1 would sit too close to the existing seed's x^2 + 1
  const hi = b + 4;
  const val = 8 + 4 * b;   // (hi^2 - b^2)/2
  return {
    id: `gen.c2l-def-sub-d1.${idx}`, generated: true, concepts: ["definite-substitution"], difficulty: 1, context: "abstract",
    prompt: `Evaluate $\\int_0^2 2x\\,(x^2+${b})\\,dx$ using $u = x^2 + ${b}$ and changing the limits. (Here $du = 2x\\,dx$ matches exactly.)`,
    steps: [
      { instruction: `Find the new lower limit: evaluate $u = x^2 + ${b}$ at $x = 0$.`, answer: `${b}`, accept: [], hint: `Plug $x = 0$ into $x^2 + ${b}$.` },
      { instruction: `Find the new upper limit: evaluate $u = x^2 + ${b}$ at $x = 2$.`, answer: `${hi}`, accept: [], hint: `$4 + ${b}$.` },
      { instruction: `Evaluate $\\int_{${b}}^{${hi}} u\\,du$. Give the numeric value.`, answer: `${val}`, accept: [], hint: `$\\big[\\frac{u^2}{2}\\big]_{${b}}^{${hi}} = \\frac{${hi * hi} - ${b * b}}{2}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `With $u = x^2 + ${b}$ the limits become ${b} and ${hi}: $\\int_{${b}}^{${hi}} u\\,du = \\frac{${hi * hi} - ${b * b}}{2} = ${val}$.`,
  };
};

// ============================================================================
// Topic: calculus-2.series-and-convergence
// ============================================================================

// --- convergence-tests d1: nth-term test, terms -> c ≠ 0 ----------------------
fill["c2l-conv-tests-d1"] = (rng, idx) => {
  let c, k;
  do {
    c = rng.int(1, 3);
    k = rng.int(1, 6);
  } while (c === 1 && k === 1); // Σ n/(n+1) is the existing seed
  const num = c === 1 ? "n" : `${c}n`;
  return {
    id: `gen.c2l-conv-tests-d1.${idx}`, generated: true, concepts: ["convergence-tests"], difficulty: 1, context: "abstract",
    prompt: `Apply the nth-term (divergence) test to $\\sum_{n=1}^{\\infty} \\dfrac{${num}}{n + ${k}}$.`,
    steps: [
      { instruction: `What value do the terms $\\dfrac{${num}}{n+${k}}$ approach as $n \\to \\infty$?`, answer: `${c}`, accept: [], hint: `For huge $n$, $\\dfrac{${num}}{n+${k}}$ is nearly $\\dfrac{${num}}{n} = ${c}$.` },
      { instruction: `Since the terms do not approach 0, does the series converge or diverge?`, answer: "diverges", accept: ["divergent"], hint: "The nth-term test condemns any series whose terms don't go to 0." },
    ],
    finalAnswer: { value: "diverges", unit: "" },
    solutionNarrative: `The terms $\\dfrac{${num}}{n+${k}} \\to ${c} \\neq 0$, so by the nth-term (divergence) test the series diverges.`,
  };
};

// --- convergence-tests d3: ratio test, factorial vs. power --------------------
fill["c2l-conv-tests-d3"] = (rng, idx) => {
  const kind = rng.pick(["conv", "div"]);
  const base = { id: `gen.c2l-conv-tests-d3.${idx}`, generated: true, concepts: ["convergence-tests"], difficulty: 3, context: "abstract" };
  if (kind === "conv") {
    const c = rng.int(3, 5);
    return { ...base,
      prompt: `Use the ratio test on $\\sum_{n=1}^{\\infty} \\dfrac{${c}^n}{n!}$.`,
      steps: [
        { instruction: `Simplify the ratio $\\dfrac{a_{n+1}}{a_n} = \\dfrac{${c}^{n+1}/(n+1)!}{${c}^n/n!}$.`, answer: `${c}/(n+1)`, accept: [`${c}/(n + 1)`], hint: `$\\dfrac{${c}^{n+1}}{${c}^n} = ${c}$ and $\\dfrac{n!}{(n+1)!} = \\dfrac{1}{n+1}$.` },
        { instruction: "Find the limit $L$ as $n \\to \\infty$.", answer: "0", accept: [], hint: `$\\dfrac{${c}}{n+1} \\to 0$.` },
        { instruction: "Since $L < 1$, does the series converge or diverge?", answer: "converges", accept: ["convergent"], hint: "$L < 1$ means convergence — the factorial in the denominator wins." },
      ],
      finalAnswer: { value: "converges", unit: "" },
      solutionNarrative: `The ratio simplifies to $\\dfrac{${c}}{n+1}$, with limit $L = 0 < 1$: the factorial outgrows the power, so the series converges.`,
    };
  }
  const c = rng.int(2, 4);
  return { ...base,
    prompt: `Use the ratio test on $\\sum_{n=1}^{\\infty} \\dfrac{n!}{${c}^n}$. (Careful — the factorial is on TOP this time.)`,
    steps: [
      { instruction: `Simplify the ratio $\\dfrac{a_{n+1}}{a_n} = \\dfrac{(n+1)!/${c}^{n+1}}{n!/${c}^n}$.`, answer: `(n+1)/${c}`, accept: [`(n + 1)/${c}`], hint: `$\\dfrac{(n+1)!}{n!} = n+1$ and $\\dfrac{${c}^n}{${c}^{n+1}} = \\dfrac{1}{${c}}$.` },
      { instruction: `What happens to $\\dfrac{n+1}{${c}}$ as $n \\to \\infty$? (Type a number, or 'infinity'.)`, answer: "infinity", accept: ["infinite", "unbounded", "does not exist", "dne"], hint: "The numerator grows without bound while the denominator stays fixed." },
      { instruction: "Since $L > 1$ (in fact infinite), does the series converge or diverge?", answer: "diverges", accept: ["divergent"], hint: "Ratio test: $L > 1$ means divergence — the factorial on top swamps the power." },
    ],
    finalAnswer: { value: "diverges", unit: "" },
    solutionNarrative: `The ratio is $\\dfrac{n+1}{${c}} \\to \\infty > 1$, so by the ratio test the series diverges — factorials beat exponentials.`,
  };
};

// --- p-series-and-harmonic d1: read off p, compare to 1 -----------------------
// p = 3 is excluded: it would clone the existing seed problem.
const PSERIES_D1 = [
  { pS: "2", conv: true }, { pS: "4", conv: true }, { pS: "5", conv: true }, { pS: "6", conv: true },
  { pS: "1", conv: false }, { pS: "1/2", conv: false },
];
fill["c2l-pseries-d1"] = (rng, idx) => {
  const pick = rng.pick(PSERIES_D1);
  const word = pick.conv ? "converges" : "diverges";
  const tex = pick.pS === "1" ? "\\dfrac{1}{n}" : pick.pS === "1/2" ? "\\dfrac{1}{n^{1/2}}" : `\\dfrac{1}{n^{${pick.pS}}}`;
  return {
    id: `gen.c2l-pseries-d1.${idx}`, generated: true, concepts: ["p-series-and-harmonic"], difficulty: 1, context: "abstract",
    prompt: `Consider the p-series $\\sum_{n=1}^{\\infty} ${tex}$.`,
    steps: [
      { instruction: "Identify the value of $p$.", answer: pick.pS, accept: pick.pS === "1/2" ? ["0.5"] : [], hint: "The exponent on $n$ in the denominator is $p$." },
      { instruction: `Compare $p$ to 1: does the series converge or diverge?`, answer: word, accept: [word === "converges" ? "convergent" : "divergent"], hint: "A p-series converges exactly when $p > 1$." },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `Here $p = ${pick.pS}$, which is ${pick.conv ? "greater than" : "not greater than"} 1, so the p-series ${word}.`,
  };
};

// --- p-series-and-harmonic d3: rewrite a disguised power first ----------------
const PSERIES_D3 = [
  { tex: "\\dfrac{1}{n\\sqrt{n}}", p: "3/2", dec: "1.5", conv: true, why: "$n \\cdot n^{1/2} = n^{3/2}$" },
  { tex: "\\dfrac{\\sqrt{n}}{n^2}", p: "3/2", dec: "1.5", conv: true, why: "$\\dfrac{n^{1/2}}{n^2} = \\dfrac{1}{n^{3/2}}$" },
  { tex: "\\dfrac{n}{n^3}", p: "2", dec: "2", conv: true, why: "$\\dfrac{n}{n^3} = \\dfrac{1}{n^2}$" },
  { tex: "\\dfrac{1}{\\sqrt[3]{n}}", p: "1/3", dec: "0.333", conv: false, why: "$\\sqrt[3]{n} = n^{1/3}$" },
  { tex: "\\dfrac{\\sqrt{n}}{n}", p: "1/2", dec: "0.5", conv: false, why: "$\\dfrac{n^{1/2}}{n} = \\dfrac{1}{n^{1/2}}$" },
];
fill["c2l-pseries-d3"] = (rng, idx) => {
  const pick = rng.pick(PSERIES_D3);
  const word = pick.conv ? "converges" : "diverges";
  return {
    id: `gen.c2l-pseries-d3.${idx}`, generated: true, concepts: ["p-series-and-harmonic"], difficulty: 3, context: "abstract",
    prompt: `Classify $\\sum_{n=1}^{\\infty} ${pick.tex}$ as convergent or divergent by first writing it as a p-series $\\sum \\dfrac{1}{n^p}$.`,
    steps: [
      { instruction: `Rewrite $${pick.tex}$ as $\\dfrac{1}{n^p}$ and state $p$.`, answer: pick.p, accept: [pick.dec], hint: `${pick.why}.` },
      { instruction: "Is $p$ greater than 1? (yes/no)", answer: pick.conv ? "yes" : "no", accept: [], hint: `Compare $${pick.p}$ to 1.` },
      { instruction: "So does the series converge or diverge?", answer: word, accept: [word === "converges" ? "convergent" : "divergent"], hint: "A p-series converges exactly when $p > 1$ — the harmonic case $p = 1$ already diverges." },
    ],
    finalAnswer: { value: word, unit: "" },
    solutionNarrative: `${pick.why}, so $p = ${pick.p}$. Since $p ${pick.conv ? ">" : "\\leq"} 1$, the series ${word}.`,
  };
};

// --- series-applications d1: repeating decimal to a fraction ------------------
fill["c2l-series-apps-d1"] = (rng, idx) => {
  const d = rng.pick([1, 2, 3, 4, 5, 7, 8]); // 6 is the seed problem's digit
  const S = frac(d, 9);
  return {
    id: `gen.c2l-series-apps-d1.${idx}`, generated: true, concepts: ["series-applications"], difficulty: 1, context: "applied",
    prompt: `Write the repeating decimal $0.${d}${d}${d}${d}\\ldots$ as a geometric series and find its exact fractional value. The series is $0.${d} + 0.0${d} + 0.00${d} + \\cdots$.`,
    steps: [
      { instruction: "Identify the first term $a$ and ratio $r$ of the series.", answer: `a = 0.${d}, r = 0.1`, accept: [`0.${d}, 0.1`, `a=0.${d}, r=0.1`], hint: "Each term is one-tenth of the previous: $r = 0.1$." },
      { instruction: "Compute $S = \\dfrac{a}{1 - r}$ as a fraction.", answer: S, accept: [`${d}/9`], hint: `$S = \\dfrac{0.${d}}{1 - 0.1} = \\dfrac{0.${d}}{0.9}$.` },
    ],
    finalAnswer: { value: S, unit: "" },
    solutionNarrative: `With $a = 0.${d}$ and $r = 0.1$, $S = \\dfrac{0.${d}}{0.9} = \\dfrac{${d}}{9}${S === `${d}/9` ? "" : ` = \\dfrac{${S.replace("/", "}{")}}`}$, so $0.${d}${d}${d}${d}\\ldots = ${S.includes("/") ? `\\tfrac{${S.replace("/", "}{")}}` : S}$.`,
  };
};

// --- series-applications d3: bouncing ball total distance ----------------------
fill["c2l-series-apps-d3"] = (rng, idx) => {
  const H = rng.pick([8, 12, 16, 20]); // 10 m is the existing seed's drop height
  const pct = rng.pick([50, 75]);
  const r = pct / 100;
  const first = H * r;          // first rebound height (integer for these H)
  const a = 2 * first;          // first up-and-down rebound term
  const reb = a / (1 - r);      // 2H (r = 0.5) or 6H (r = 0.75) — integer
  const total = H + reb;
  const second = first * r;
  const rs = r === 0.5 ? "0.5" : "0.75";
  return {
    id: `gen.c2l-series-apps-d3.${idx}`, generated: true, concepts: ["series-applications"], difficulty: 3, context: "applied",
    prompt: `A ball is dropped from ${H} meters. Each bounce returns it to ${pct}% of its previous height. The total vertical distance traveled is the drop (${H} m) plus each rebound counted twice (up and down): $${H} + 2(${first}) + 2(${second}) + \cdots$. Find the total distance.`,
    steps: [
      { instruction: `The rebound distances form a geometric series $2(${first}) + 2(${second}) + \cdots = ${a} + ${2 * second} + \cdots$. Find its first term $a$ and ratio $r$.`, answer: `a = ${a}, r = ${rs}`, accept: [`${a}, ${rs}`, `a=${a}, r=${rs}`], hint: `First rebound up-and-down is $2 \times ${first} = ${a}$; each rebound is ${pct}% of the last, so $r = ${rs}$.` },
      { instruction: `Sum the rebound series with $S = \dfrac{a}{1 - r}$.`, answer: `${reb}`, accept: [], hint: `$S = \dfrac{${a}}{1 - ${rs}} = \dfrac{${a}}{${1 - r}}$.` },
      { instruction: `Add the initial ${H} m drop to get the total distance.`, answer: `${total}`, accept: [`${total} meters`, `${total} m`], hint: `Total = ${H} + (rebound sum).` },
    ],
    finalAnswer: { value: `${total}`, unit: "meters" },
    solutionNarrative: `The rebounds sum to $\dfrac{${a}}{1 - ${rs}} = ${reb}$ m. Adding the initial ${H} m drop gives $${total}$ meters of total travel.`,
  };
};
