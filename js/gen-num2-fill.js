// gen-num2-fill.js
// Self-contained generator pack for three Numerical Methods topics:
//   - numerical-methods.numerical-integration   (prefix nm2-riemann-*, nm2-trapezoidal-*, nm2-simpson-*, nm2-intcompare-*)
//   - numerical-methods.linear-systems          (prefix nm2-gauss-*, nm2-pivot-*, nm2-lu-*, nm2-cond-*)
//   - numerical-methods.numerical-odes           (prefix nm2-euler-*, nm2-heun-*, nm2-rk4-*, nm2-odestab-*)
// One generator per (concept, difficulty) — 36 total. Exports a `fill` map of
// template-name -> generator fn matching the shape used by js/generator.js.
// Deterministic from the passed rng only; no imports from generator.js.
//
// ROUNDING DISCIPLINE: every rounded decimal answer is produced by the SAME
// integer-scaled computation the learner is shown, so the generator's stored
// answer is byte-identical to the intended rounded string (grader tol is 1e-6).

// Round v to k decimals, avoiding "-0.00"; returns string.
const rnd = (v, k) => {
  let s = v.toFixed(k);
  if (parseFloat(s) === 0) s = (0).toFixed(k);
  return s;
};
// Trailing-zero / extra-decimal accept variants for a rounded decimal answer.
const nbrs = (v, k) => {
  const base = rnd(v, k);
  const out = [rnd(v, k + 1)];
  // plain-integer spelling if it rounds to a whole number
  if (parseFloat(base) === Math.round(parseFloat(base))) out.push(`${Math.round(parseFloat(base))}`);
  return out;
};
// Signed "+ x" / "- x" fragment for building expressions.
const sgn = (x) => (x >= 0 ? `+ ${x}` : `- ${-x}`);

export const fill = {};

// ============================================================================
// Topic A: numerical-methods.numerical-integration
// Concepts: riemann-and-midpoint, trapezoidal-rule, simpsons-rule,
//           integration-error-and-comparison
// ============================================================================

// f(x) = a x^2 + c, sampled on integer-ish grids so every height is exact.
// Antiderivative F(x) = a x^3/3 + c x.

// --- riemann-and-midpoint ----------------------------------------------------

// d1: left/right Riemann sum, f(x)=x^2 on [0, n], width 1.
fill["nm2-riemann-1"] = (rng, idx) => {
  const n = rng.int(2, 4);          // number of slices == b, dx = 1
  const side = rng.pick(["left", "right"]);
  // heights at 0..n
  const h = [];
  for (let i = 0; i <= n; i++) h.push(i * i);
  const used = side === "left" ? h.slice(0, n) : h.slice(1, n + 1);
  const sum = used.reduce((a, b) => a + b, 0); // dx = 1
  const listStr = used.join(" + ");
  return {
    id: `gen.nm2-riemann-1.${idx}`, generated: true, concepts: ["riemann-and-midpoint"], difficulty: 1, context: "abstract",
    prompt: `Estimate $\\displaystyle\\int_0^{${n}} x^2\\,dx$ with a **${side}** Riemann sum using $n = ${n}$ rectangles of width $\\Delta x = 1$.`,
    steps: [
      { instruction: `The ${side} edges are $x = ${side === "left" ? [...Array(n).keys()].join(", ") : [...Array(n).keys()].map((k) => k + 1).join(", ")}$. Evaluate $f(x) = x^2$ at each and add the heights: $${listStr}$.`, answer: `${sum}`, accept: [], hint: `Square each edge and sum: $${listStr}$.` },
      { instruction: `Multiply the height sum by $\\Delta x = 1$ to get the estimate.`, answer: `${sum}`, accept: [], hint: `$${sum} \\times 1$.` },
    ],
    finalAnswer: { value: `${sum}`, unit: "" },
    solutionNarrative: `The ${side} sum uses heights $${listStr} = ${sum}$; times $\\Delta x = 1$ the estimate is $${sum}$.`,
  };
};

// d2: midpoint rule, f(x)=x^2 on [0, n], width 1, midpoints 0.5,1.5,...
fill["nm2-riemann-2"] = (rng, idx) => {
  const n = rng.int(2, 4);
  // midpoints m_i = i + 0.5 for i=0..n-1 ; heights (i+0.5)^2 = (2i+1)^2/4
  let scaled = 0;                     // sum of (2i+1)^2, exact integer
  const mids = [];
  for (let i = 0; i < n; i++) { scaled += (2 * i + 1) * (2 * i + 1); mids.push(rnd(i + 0.5, 1)); }
  const sum = scaled / 4;             // sum of squared midpoints
  return {
    id: `gen.nm2-riemann-2.${idx}`, generated: true, concepts: ["riemann-and-midpoint"], difficulty: 2, context: "abstract",
    prompt: `Estimate $\\displaystyle\\int_0^{${n}} x^2\\,dx$ with the **midpoint rule**, $n = ${n}$ rectangles of width $\\Delta x = 1$.`,
    steps: [
      { instruction: `The midpoints are $x = ${mids.join(", ")}$. Add the heights $\\sum (\\text{midpoint})^2$.`, answer: rnd(sum, 2), accept: nbrs(sum, 2), hint: `Square each midpoint (e.g. $0.5^2 = 0.25$) and add.` },
      { instruction: `Multiply the height sum by $\\Delta x = 1$ for the midpoint estimate. Round to 2 decimals.`, answer: rnd(sum, 2), accept: nbrs(sum, 2), hint: `$${rnd(sum, 2)} \\times 1$.` },
    ],
    finalAnswer: { value: rnd(sum, 2), unit: "" },
    solutionNarrative: `Midpoint heights sum to $${rnd(sum, 2)}$; times $\\Delta x = 1$ gives $${rnd(sum, 2)}$ — closer to the exact $${rnd(n * n * n / 3, 3)}$ than a one-sided sum.`,
  };
};

// d3: applied midpoint sum of a velocity a*t (m/s), giving distance.
fill["nm2-riemann-3"] = (rng, idx) => {
  const a = rng.int(2, 5);           // v(t) = a t
  const n = rng.int(2, 4);           // slices on [0, n], dx = 1
  // midpoint distance = dx * sum a*(i+0.5), i=0..n-1 ; sum(i+0.5)= n^2/2
  const scaledMid = a * (n * n);     // 2 * sum a*(i+0.5)  (since sum(2i+1)=n^2)
  const dist = scaledMid / 2;
  const ctx = rng.pick([
    { what: "A drone accelerates from rest", u: "meters" },
    { what: "A cart rolls down a ramp", u: "meters" },
    { what: "A train pulls out of a station", u: "meters" },
  ]);
  const midTerms = [];
  for (let i = 0; i < n; i++) midTerms.push(`${a}(${rnd(i + 0.5, 1)})`);
  return {
    id: `gen.nm2-riemann-3.${idx}`, generated: true, concepts: ["riemann-and-midpoint"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} with velocity $v(t) = ${a}t$ m/s. Estimate the distance traveled on $[0, ${n}]$ s using the midpoint rule with $\\Delta t = 1$ (distance $= \\int_0^{${n}} v\\,dt$).`,
    steps: [
      { instruction: `The midpoints are $t = ${[...Array(n).keys()].map((i) => rnd(i + 0.5, 1)).join(", ")}$. Add the velocities there: $${midTerms.join(" + ")}$.`, answer: `${dist}`, accept: nbrs(dist, 0), hint: `Each velocity is $${a}t$ at the midpoint; sum them.` },
      { instruction: `Multiply by $\\Delta t = 1$ for the estimated distance.`, answer: `${dist}`, accept: nbrs(dist, 0), hint: `$${dist} \\times 1$.` },
    ],
    finalAnswer: { value: `${dist}`, unit: ctx.u },
    solutionNarrative: `Midpoint velocities sum to $${dist}$ m/s·(count); times $\\Delta t = 1$ the estimated distance is $${dist}$ ${ctx.u} — exact here because $v$ is linear.`,
  };
};

// --- trapezoidal-rule --------------------------------------------------------

// d1: single trapezoid over [a,b], f(x)=x^2.
fill["nm2-trapezoidal-1"] = (rng, idx) => {
  const a = rng.int(0, 2);
  const b = a + rng.int(1, 3);
  const fa = a * a, fb = b * b, w = b - a;
  // T = (w/2)(fa+fb)  ; keep integer-scaled
  const scaled = w * (fa + fb);      // 2T
  const T = scaled / 2;
  return {
    id: `gen.nm2-trapezoidal-1.${idx}`, generated: true, concepts: ["trapezoidal-rule"], difficulty: 1, context: "abstract",
    prompt: `Use a **single** trapezoid to estimate $\\displaystyle\\int_{${a}}^{${b}} x^2\\,dx$. The trapezoidal rule is $T = \\dfrac{b-a}{2}\\,[\\,f(a) + f(b)\\,]$.`,
    steps: [
      { instruction: `Evaluate the two endpoint heights $f(${a})$ and $f(${b})$, then add them.`, answer: `${fa + fb}`, accept: [], hint: `$${a}^2 = ${fa}$ and $${b}^2 = ${fb}$; add.` },
      { instruction: `Apply $T = \\dfrac{${w}}{2}(${fa + fb})$. Compute it${T === Math.round(T) ? "" : " (round to 2 decimals)"}.`, answer: T === Math.round(T) ? `${T}` : rnd(T, 2), accept: T === Math.round(T) ? [] : nbrs(T, 2), hint: `$\\dfrac{${w}}{2} \\times ${fa + fb}$.` },
    ],
    finalAnswer: { value: T === Math.round(T) ? `${T}` : rnd(T, 2), unit: "" },
    solutionNarrative: `Heights $${fa} + ${fb} = ${fa + fb}$; $T = \\frac{${w}}{2}(${fa + fb}) = ${T === Math.round(T) ? T : rnd(T, 2)}$.`,
  };
};

// d2: composite trapezoid, f(x)=x^2 on [0, n], n subintervals width 1.
fill["nm2-trapezoidal-2"] = (rng, idx) => {
  const n = rng.int(3, 5);           // subintervals, dx = 1, interval [0,n]
  // T = dx[ (f0+fn)/2 + sum_{i=1}^{n-1} f_i ]
  let interior = 0;
  for (let i = 1; i < n; i++) interior += i * i;
  const f0 = 0, fn = n * n;
  const scaled = (f0 + fn) + 2 * interior; // = 2T (dx=1)
  const T = scaled / 2;
  return {
    id: `gen.nm2-trapezoidal-2.${idx}`, generated: true, concepts: ["trapezoidal-rule"], difficulty: 2, context: "abstract",
    prompt: `Use the **composite** trapezoidal rule with $n = ${n}$ subintervals ($\\Delta x = 1$) to estimate $\\displaystyle\\int_0^{${n}} x^2\\,dx$. Formula: $T = \\Delta x\\left[\\tfrac{f_0 + f_n}{2} + \\sum_{i=1}^{n-1} f_i\\right]$.`,
    steps: [
      { instruction: `Add the interior heights $f_1 + \\dots + f_{${n - 1}} = ${[...Array(n - 1).keys()].map((i) => `${(i + 1) * (i + 1)}`).join(" + ")}$.`, answer: `${interior}`, accept: [], hint: `Square $1, 2, \\dots, ${n - 1}$ and add.` },
      { instruction: `The two endpoints average to $\\tfrac{f_0 + f_n}{2} = \\tfrac{0 + ${fn}}{2}$. What is that?`, answer: rnd(fn / 2, 1), accept: fn % 2 === 0 ? [`${fn / 2}`] : nbrs(fn / 2, 1), hint: `$\\tfrac{${fn}}{2}$.` },
      { instruction: `Add the endpoint-average to the interior sum and multiply by $\\Delta x = 1$. Round to 1 decimal.`, answer: rnd(T, 1), accept: nbrs(T, 1), hint: `$(${rnd(fn / 2, 1)} + ${interior}) \\times 1$.` },
    ],
    finalAnswer: { value: rnd(T, 1), unit: "" },
    solutionNarrative: `Interior $= ${interior}$, endpoint-average $= ${rnd(fn / 2, 1)}$; $T = ${rnd(T, 1)}$. The exact value is $${rnd(n * n * n / 3, 3)}$ — trapezoids slightly overestimate a concave-up curve.`,
  };
};

// d3: applied composite trapezoid on tabulated data (flow rate).
fill["nm2-trapezoidal-3"] = (rng, idx) => {
  const n = rng.int(3, 4);           // subintervals width dx
  const dx = 2;                      // hours
  // rate samples r_i = base + slope*i (linear-ish but we treat as data)
  const base = rng.int(2, 6);
  const slope = rng.int(1, 4);
  const r = [];
  for (let i = 0; i <= n; i++) r.push(base + slope * i);
  let interior = 0;
  for (let i = 1; i < n; i++) interior += r[i];
  const scaled = dx * ((r[0] + r[n]) + 2 * interior); // 2T
  const T = scaled / 2;
  const ctx = rng.pick([
    { what: "Water flows into a reservoir", ru: "m³/hr", u: "m³" },
    { what: "A pipeline delivers oil", ru: "barrels/hr", u: "barrels" },
    { what: "A turbine generates power", ru: "kW", u: "kWh" },
  ]);
  return {
    id: `gen.nm2-trapezoidal-3.${idx}`, generated: true, concepts: ["trapezoidal-rule"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} at these measured rates (${ctx.ru}), one every $\\Delta t = ${dx}$ hr: $${r.join(", ")}$. Use the composite trapezoidal rule over ${n} intervals to estimate the total (${ctx.u}).`,
    steps: [
      { instruction: `Add the interior readings (all but the first and last): $${r.slice(1, n).join(" + ")}$.`, answer: `${interior}`, accept: [], hint: `Sum the middle ${n - 1} value(s).` },
      { instruction: `Apply $T = \\dfrac{\\Delta t}{2}\\big[(r_0 + r_{${n}}) + 2(\\text{interior})\\big] = \\dfrac{${dx}}{2}\\big[(${r[0]} + ${r[n]}) + 2(${interior})\\big]$. Compute it.`, answer: `${T}`, accept: nbrs(T, 0), hint: `Inside the bracket: $${r[0] + r[n]} + ${2 * interior} = ${(r[0] + r[n]) + 2 * interior}$, times $\\tfrac{${dx}}{2}$.` },
    ],
    finalAnswer: { value: `${T}`, unit: ctx.u },
    solutionNarrative: `Interior sum $= ${interior}$; $T = \\frac{${dx}}{2}[(${r[0]}+${r[n]}) + 2(${interior})] = ${T}$ ${ctx.u}.`,
  };
};

// --- simpsons-rule -----------------------------------------------------------

// d1: Simpson on n=2, f(x)=x^2 (exact for quadratics), interval [0, b], b even.
fill["nm2-simpson-1"] = (rng, idx) => {
  const half = rng.int(1, 3);
  const b = 2 * half;                // even upper limit, n = 2, h = half
  const h = half;
  const f0 = 0, f1 = h * h, f2 = b * b;
  // S = h/3 (f0 + 4 f1 + f2)
  const scaled = f0 + 4 * f1 + f2;   // times h/3
  const S = h * scaled / 3;
  return {
    id: `gen.nm2-simpson-1.${idx}`, generated: true, concepts: ["simpsons-rule"], difficulty: 1, context: "abstract",
    prompt: `Use **Simpson's rule** with $n = 2$ to estimate $\\displaystyle\\int_0^{${b}} x^2\\,dx$. Here $h = ${h}$ and $S = \\dfrac{h}{3}\\big(f_0 + 4f_1 + f_2\\big)$.`,
    steps: [
      { instruction: `Evaluate $f_0 = f(0)$, $f_1 = f(${h})$, $f_2 = f(${b})$, then form $f_0 + 4f_1 + f_2$.`, answer: `${scaled}`, accept: [], hint: `$0 + 4(${f1}) + ${f2}$.` },
      { instruction: `Multiply by $\\dfrac{h}{3} = \\dfrac{${h}}{3}$. Compute $S$${S === Math.round(S) ? "" : " (round to 3 decimals)"}.`, answer: S === Math.round(S) ? `${S}` : rnd(S, 3), accept: S === Math.round(S) ? [] : nbrs(S, 3), hint: `$\\dfrac{${h}}{3} \\times ${scaled}$.` },
    ],
    finalAnswer: { value: S === Math.round(S) ? `${S}` : rnd(S, 3), unit: "" },
    solutionNarrative: `$f_0 + 4f_1 + f_2 = ${scaled}$; $S = \\frac{${h}}{3}(${scaled}) = ${S === Math.round(S) ? S : rnd(S, 3)}$ — exact for $x^2$, since Simpson is exact on quadratics.`,
  };
};

// d2: composite Simpson n=4, f(x)=x^2 on [0,4], h=1.
fill["nm2-simpson-2"] = (rng, idx) => {
  const scale = rng.int(1, 3);       // f(x) = scale * x^2 on [0,4], h=1, n=4
  const xs = [0, 1, 2, 3, 4];
  const f = xs.map((x) => scale * x * x);
  // S = h/3 (f0 + 4f1 + 2f2 + 4f3 + f4), h=1
  const combo = f[0] + 4 * f[1] + 2 * f[2] + 4 * f[3] + f[4];
  const S = combo / 3;
  return {
    id: `gen.nm2-simpson-2.${idx}`, generated: true, concepts: ["simpsons-rule"], difficulty: 2, context: "abstract",
    prompt: `Use **composite Simpson's rule** with $n = 4$ ($h = 1$) to estimate $\\displaystyle\\int_0^{4} ${scale === 1 ? "" : scale}x^2\\,dx$. Pattern of weights: $1, 4, 2, 4, 1$.`,
    steps: [
      { instruction: `With $f = [${f.join(", ")}]$, form the weighted sum $f_0 + 4f_1 + 2f_2 + 4f_3 + f_4$.`, answer: `${combo}`, accept: [], hint: `$${f[0]} + 4(${f[1]}) + 2(${f[2]}) + 4(${f[3]}) + ${f[4]}$.` },
      { instruction: `Multiply by $\\dfrac{h}{3} = \\dfrac{1}{3}$. Round to 3 decimals.`, answer: rnd(S, 3), accept: nbrs(S, 3), hint: `$\\dfrac{${combo}}{3}$.` },
    ],
    finalAnswer: { value: rnd(S, 3), unit: "" },
    solutionNarrative: `Weighted sum $= ${combo}$; $S = \\frac{1}{3}(${combo}) = ${rnd(S, 3)}$. This matches the exact $\\int_0^4 ${scale === 1 ? "" : scale}x^2 dx = ${rnd(scale * 64 / 3, 3)}$ because Simpson integrates quadratics exactly.`,
  };
};

// d3: composite Simpson n=4 on a cubic-ish table, general data.
fill["nm2-simpson-3"] = (rng, idx) => {
  // 5 tabulated readings, h given; concept: apply weights to data.
  const h = rng.pick([0.5, 1, 2]);
  const f = [rng.int(1, 4), rng.int(3, 7), rng.int(5, 9), rng.int(3, 7), rng.int(1, 4)];
  const combo = f[0] + 4 * f[1] + 2 * f[2] + 4 * f[3] + f[4];
  // S = h/3 * combo ; keep exact via integer combo scaled by h
  const S = h * combo / 3;
  const ctx = rng.pick([
    { what: "sensor logs a signal", u: "" },
    { what: "a probe records concentration", u: "" },
    { what: "an accelerometer reads force", u: "" },
  ]);
  return {
    id: `gen.nm2-simpson-3.${idx}`, generated: true, concepts: ["simpsons-rule"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.what} at 5 equally spaced points ($h = ${h}$): $f = [${f.join(", ")}]$. Estimate $\\int f$ with composite Simpson's rule ($n = 4$, weights $1,4,2,4,1$).`,
    steps: [
      { instruction: `Form the weighted sum $f_0 + 4f_1 + 2f_2 + 4f_3 + f_4$.`, answer: `${combo}`, accept: [], hint: `$${f[0]} + 4(${f[1]}) + 2(${f[2]}) + 4(${f[3]}) + ${f[4]}$.` },
      { instruction: `Multiply by $\\dfrac{h}{3} = \\dfrac{${h}}{3}$. Round to 4 decimals.`, answer: rnd(S, 4), accept: nbrs(S, 4), hint: `$\\dfrac{${h}}{3} \\times ${combo}$.` },
    ],
    finalAnswer: { value: rnd(S, 4), unit: ctx.u },
    solutionNarrative: `Weighted sum $= ${combo}$; $S = \\frac{${h}}{3}(${combo}) = ${rnd(S, 4)}$.`,
  };
};

// --- integration-error-and-comparison ---------------------------------------

// d1: which rule is more accurate (menu).
fill["nm2-intcompare-1"] = (rng, idx) => {
  const pair = rng.pick([
    { a: "the trapezoidal rule", b: "Simpson's rule", better: "Simpson's rule", why: "fits parabolas through triples of points, matching curvature that straight-line trapezoids miss" },
    { a: "a left Riemann sum", b: "the midpoint rule", better: "the midpoint rule", why: "the midpoint's over- and under-shoots on each slice partly cancel, unlike a one-sided sum" },
    { a: "the trapezoidal rule", b: "a right Riemann sum", better: "the trapezoidal rule", why: "averaging both endpoints beats using just one" },
  ]);
  return {
    id: `gen.nm2-intcompare-1.${idx}`, generated: true, concepts: ["integration-error-and-comparison"], difficulty: 1, context: "abstract",
    prompt: `For a smooth curve on the same grid, which is generally **more accurate**: ${pair.a} or ${pair.b}? (Type the rule name exactly as written.)`,
    steps: [
      { instruction: `Type the more accurate rule: "${pair.a}" or "${pair.b}".`, answer: pair.better, accept: [pair.better.replace(/^the /, ""), pair.better.replace(/^a /, "")], hint: `The winner ${pair.why}.` },
    ],
    finalAnswer: { value: pair.better, unit: "" },
    solutionNarrative: `${pair.better} is more accurate: it ${pair.why}.`,
  };
};

// d2: compute the error of trapezoid vs exact for x^2 (numeric).
fill["nm2-intcompare-2"] = (rng, idx) => {
  const b = rng.int(2, 4);
  // single trapezoid T = b/2(0 + b^2) = b^3/2 ; exact = b^3/3
  const scaledT = b * b * b;         // 2T
  const T = scaledT / 2;
  const exact = b * b * b / 3;
  const errVal = Math.abs(T - exact);
  return {
    id: `gen.nm2-intcompare-2.${idx}`, generated: true, concepts: ["integration-error-and-comparison"], difficulty: 2, context: "abstract",
    prompt: `The single-trapezoid estimate of $\\displaystyle\\int_0^{${b}} x^2\\,dx$ is $T = ${rnd(T, 2)}$; the exact value is $\\dfrac{${b}^3}{3} = ${rnd(exact, 4)}$. Find the error $|T - \\text{exact}|$ (round to 4 decimals).`,
    steps: [
      { instruction: `Subtract: $|${rnd(T, 2)} - ${rnd(exact, 4)}|$. Round to 4 decimals.`, answer: rnd(errVal, 4), accept: nbrs(errVal, 4), hint: `Trapezoids overshoot a concave-up curve, so $T > \\text{exact}$.` },
    ],
    finalAnswer: { value: rnd(errVal, 4), unit: "" },
    solutionNarrative: `Error $= |${rnd(T, 2)} - ${rnd(exact, 4)}| = ${rnd(errVal, 4)}$. The trapezoid overestimates because $x^2$ is concave up.`,
  };
};

// d3: error-order reasoning — halving h and the factor (menu + numeric).
fill["nm2-intcompare-3"] = (rng, idx) => {
  const rule = rng.pick([
    { name: "the trapezoidal rule", order: 2, factor: 4 },
    { name: "Simpson's rule", order: 4, factor: 16 },
  ]);
  const startErr = rng.int(2, 8) * (rule.order === 4 ? 0.0016 : 0.02);
  const newErr = startErr / rule.factor;
  return {
    id: `gen.nm2-intcompare-3.${idx}`, generated: true, concepts: ["integration-error-and-comparison"], difficulty: 3, context: "abstract",
    prompt: `The error of ${rule.name} scales like $h^{${rule.order}}$. If the current error is about $${rnd(startErr, 4)}$ and you **halve** the step size $h$, estimate the new error.`,
    steps: [
      { instruction: `Halving $h$ multiplies the error by $\\left(\\tfrac{1}{2}\\right)^{${rule.order}} = \\tfrac{1}{${rule.factor}}$. By what factor does the error shrink? (Type the number ${rule.factor}.)`, answer: `${rule.factor}`, accept: [], hint: `$2^{${rule.order}} = ${rule.factor}$.` },
      { instruction: `Divide the current error by ${rule.factor}: $\\dfrac{${rnd(startErr, 4)}}{${rule.factor}}$. Round to 5 decimals.`, answer: rnd(newErr, 5), accept: nbrs(newErr, 5), hint: `$${rnd(startErr, 4)} / ${rule.factor}$.` },
    ],
    finalAnswer: { value: rnd(newErr, 5), unit: "" },
    solutionNarrative: `Error $\\propto h^{${rule.order}}$, so halving $h$ divides the error by $${rule.factor}$: $${rnd(startErr, 4)}/${rule.factor} = ${rnd(newErr, 5)}$. Simpson's higher order makes it shrink far faster than the trapezoidal rule.`,
  };
};

// ============================================================================
// Topic B: numerical-methods.linear-systems
// Concepts: gaussian-elimination, partial-pivoting, lu-decomposition,
//           condition-and-stability
// ============================================================================

// --- gaussian-elimination ----------------------------------------------------

// Build a 2x2 system with an integer solution; forward-eliminate, back-substitute.
// d1: 2x2, first pivot = 1 (clean multiplier).
fill["nm2-gauss-1"] = (rng, idx) => {
  // a11 = 1 to keep multiplier integer
  const x = rng.int(1, 5), y = rng.int(-4, 4);
  const a11 = 1, a12 = rng.int(1, 4);
  let a21 = rng.int(2, 4), a22 = rng.int(1, 4);
  const b1 = a11 * x + a12 * y;
  const b2 = a21 * x + a22 * y;
  const m = a21 / a11;               // integer since a11=1
  // Row2' = Row2 - m*Row1 : new a22, new b2
  const na22 = a22 - m * a12;
  const nb2 = b2 - m * b1;
  return {
    id: `gen.nm2-gauss-1.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 1, context: "abstract",
    prompt: `Solve the system by Gaussian elimination:\n$$${a11}x ${sgn(a12)}y = ${b1}$$\n$$${a21}x ${sgn(a22)}y = ${b2}$$`,
    steps: [
      { instruction: `The first pivot is $${a11}$. The multiplier for row 2 is $m = ${a21}/${a11} = ${m}$. Row2 $\\to$ Row2 $- ${m}\\cdot$Row1 zeros the $x$-entry and gives a new $y$-coefficient $a_{22}' = ${a22} - ${m}(${a12})$. What is it?`, answer: `${na22}`, accept: [], hint: `$${a22} - ${m * a12}$.` },
      { instruction: `The new right-hand side is $b_2' = ${b2} - ${m}(${b1})$. Compute it.`, answer: `${nb2}`, accept: [], hint: `$${b2} - ${m * b1}$.` },
      { instruction: `Back-substitute: $y = ${nb2}/${na22}$. Find $y$.`, answer: `${y}`, accept: [`y=${y}`], hint: `$${nb2} \\div ${na22}$.` },
      { instruction: `Now solve the first equation for $x$: $${a11}x ${sgn(a12)}(${y}) = ${b1}$. Give the solution as a vector $\\langle x, y\\rangle$.`, answer: `<${x}, ${y}>`, accept: [`(${x}, ${y})`, `x=${x}, y=${y}`], hint: `$x = ${b1} ${a12 * y >= 0 ? "- " + a12 * y : "+ " + -a12 * y}$.` },
    ],
    finalAnswer: { value: `<${x}, ${y}>`, unit: "" },
    solutionNarrative: `Eliminate to get $a_{22}' = ${na22}$, $b_2' = ${nb2}$, so $y = ${y}$; back-substitution gives $x = ${x}$. Solution $\\langle ${x}, ${y}\\rangle$.`,
  };
};

// d2: 2x2 general pivot, ask for the REF matrix (row-echelon of the coeff+rhs).
fill["nm2-gauss-2"] = (rng, idx) => {
  // pick a11 dividing a21 to keep an integer multiplier and integer REF
  const a11 = rng.pick([2, 3]);
  const k = rng.int(1, 3);
  const a21 = a11 * k;               // multiplier m = k (integer)
  const x = rng.int(1, 4), y = rng.int(1, 4);
  const a12 = rng.int(1, 4), a22 = a12 * k + rng.int(1, 3); // ensure na22 != 0
  const b1 = a11 * x + a12 * y;
  const b2 = a21 * x + a22 * y;
  const na22 = a22 - k * a12;
  const nb2 = b2 - k * b1;
  return {
    id: `gen.nm2-gauss-2.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 2, context: "abstract",
    prompt: `Forward-eliminate the augmented matrix $\\left[\\begin{array}{cc|c} ${a11} & ${a12} & ${b1} \\\\ ${a21} & ${a22} & ${b2} \\end{array}\\right]$ to row-echelon form (leave the pivot row unchanged), then read off the solution.`,
    steps: [
      { instruction: `The multiplier is $m = ${a21}/${a11} = ${k}$. Applying Row2 $\\to$ Row2 $- ${k}\\cdot$Row1 produces the REF matrix. Enter it as $[[${a11}, ${a12}, ${b1}], [0, a_{22}', b_2']]$ with your computed entries.`, answer: `[[${a11}, ${a12}, ${b1}], [0, ${na22}, ${nb2}]]`, accept: [], hint: `$a_{22}' = ${a22} - ${k}(${a12}) = ${na22}$, $b_2' = ${b2} - ${k}(${b1}) = ${nb2}$.` },
      { instruction: `Back-substitute: $y = ${nb2}/${na22}$. Find $y$.`, answer: `${y}`, accept: [`y=${y}`], hint: `$${nb2}\\div${na22}$.` },
      { instruction: `Solve for $x$ and give the solution vector $\\langle x, y\\rangle$.`, answer: `<${x}, ${y}>`, accept: [`(${x}, ${y})`, `x=${x}, y=${y}`], hint: `Substitute $y = ${y}$ into the first row.` },
    ],
    finalAnswer: { value: `<${x}, ${y}>`, unit: "" },
    solutionNarrative: `REF is $[[${a11}, ${a12}, ${b1}], [0, ${na22}, ${nb2}]]$; back-substitution gives $y = ${y}$, $x = ${x}$.`,
  };
};

// d3: 3x3 with a11=1 and clean integer multipliers, ordered solution vector.
fill["nm2-gauss-3"] = (rng, idx) => {
  const x = rng.int(1, 3), y = rng.int(-2, 3), z = rng.int(1, 3);
  // Upper-triangular-friendly construction. Use small integer coefficients,
  // first pivot 1.
  const A = [
    [1, rng.int(1, 2), rng.int(1, 2)],
    [rng.int(1, 3), rng.int(2, 4), rng.int(1, 3)],
    [rng.int(1, 3), rng.int(1, 3), rng.int(2, 4)],
  ];
  const b = [
    A[0][0] * x + A[0][1] * y + A[0][2] * z,
    A[1][0] * x + A[1][1] * y + A[1][2] * z,
    A[2][0] * x + A[2][1] * y + A[2][2] * z,
  ];
  // First elimination column (pivot a11 = 1 -> integer multipliers)
  const m21 = A[1][0], m31 = A[2][0];
  const r1 = [A[1][1] - m21 * A[0][1], A[1][2] - m21 * A[0][2], b[1] - m21 * b[0]];
  const r2 = [A[2][1] - m31 * A[0][1], A[2][2] - m31 * A[0][2], b[2] - m31 * b[0]];
  return {
    id: `gen.nm2-gauss-3.${idx}`, generated: true, concepts: ["gaussian-elimination"], difficulty: 3, context: "abstract",
    prompt: `Solve the $3\\times 3$ system by Gaussian elimination:\n$$${A[0][0]}x ${sgn(A[0][1])}y ${sgn(A[0][2])}z = ${b[0]}$$\n$$${A[1][0]}x ${sgn(A[1][1])}y ${sgn(A[1][2])}z = ${b[1]}$$\n$$${A[2][0]}x ${sgn(A[2][1])}y ${sgn(A[2][2])}z = ${b[2]}$$`,
    steps: [
      { instruction: `Pivot $a_{11} = 1$. Eliminate $x$ from row 2 using $m_{21} = ${m21}$: the new $y$-coefficient is $${A[1][1]} - ${m21}(${A[0][1]})$. What is it?`, answer: `${r1[0]}`, accept: [], hint: `$${A[1][1]} - ${m21 * A[0][1]}$.` },
      { instruction: `Eliminate $x$ from row 3 using $m_{31} = ${m31}$: the new $y$-coefficient is $${A[2][1]} - ${m31}(${A[0][1]})$. What is it?`, answer: `${r2[0]}`, accept: [], hint: `$${A[2][1]} - ${m31 * A[0][1]}$.` },
      { instruction: `After completing elimination and back-substitution, give the full solution as $\\langle x, y, z\\rangle$.`, answer: `<${x}, ${y}, ${z}>`, accept: [`(${x}, ${y}, ${z})`, `x=${x}, y=${y}, z=${z}`], hint: `Back-substitute $z$, then $y$, then $x$.` },
    ],
    finalAnswer: { value: `<${x}, ${y}, ${z}>`, unit: "" },
    solutionNarrative: `Forward elimination with pivot 1 gives integer multipliers $m_{21} = ${m21}$, $m_{31} = ${m31}$; back-substitution yields $\\langle ${x}, ${y}, ${z}\\rangle$.`,
  };
};

// --- partial-pivoting --------------------------------------------------------

// d1: menu — is a swap needed? (zero or tiny pivot).
fill["nm2-pivot-1"] = (rng, idx) => {
  const scen = rng.pick([
    { top: 0, bot: 3, need: "yes", why: "the top pivot is exactly 0, so you cannot divide by it — you must swap in a nonzero row" },
    { top: 2, bot: 5, need: "no", why: "the top pivot is a healthy nonzero number, so no swap is required" },
    { top: 0, bot: 4, need: "yes", why: "a zero pivot forces a row swap before elimination can proceed" },
    { top: 6, bot: 1, need: "no", why: "the current pivot is already the larger entry, so it is fine to keep" },
  ]);
  return {
    id: `gen.nm2-pivot-1.${idx}`, generated: true, concepts: ["partial-pivoting"], difficulty: 1, context: "abstract",
    prompt: `In the pivot column the current pivot entry is $${scen.top}$ and the entry below it is $${scen.bot}$. Does partial pivoting require a row **swap**? (Type "yes" or "no".)`,
    steps: [
      { instruction: `Type "yes" or "no".`, answer: scen.need, accept: [], hint: scen.why + "." },
    ],
    finalAnswer: { value: scen.need, unit: "" },
    solutionNarrative: `Answer: ${scen.need} — ${scen.why}.`,
  };
};

// d2: numeric — pick the pivot row (largest |entry|) and give its index.
fill["nm2-pivot-2"] = (rng, idx) => {
  // three entries in a pivot column; partial pivoting picks the largest magnitude
  let e = [rng.int(-6, 6), rng.int(-6, 6), rng.int(-6, 6)];
  // ensure a unique max magnitude
  while (new Set(e.map((v) => Math.abs(v))).size < 3 || Math.max(...e.map(Math.abs)) === 0) e = [rng.int(-6, 6), rng.int(-6, 6), rng.int(-6, 6)];
  const mags = e.map(Math.abs);
  const maxMag = Math.max(...mags);
  const rowIdx = mags.indexOf(maxMag) + 1; // 1-based
  return {
    id: `gen.nm2-pivot-2.${idx}`, generated: true, concepts: ["partial-pivoting"], difficulty: 2, context: "abstract",
    prompt: `Partial pivoting always moves the entry of **largest absolute value** into the pivot position. In a pivot column the three entries (rows 1, 2, 3) are $${e[0]}, ${e[1]}, ${e[2]}$. Which row should become the pivot row?`,
    steps: [
      { instruction: `Compare absolute values $|${e[0]}| = ${mags[0]}$, $|${e[1]}| = ${mags[1]}$, $|${e[2]}| = ${mags[2]}$. What is the largest magnitude?`, answer: `${maxMag}`, accept: [], hint: `Take the biggest of $${mags.join(", ")}$.` },
      { instruction: `Give the (1-based) row number holding that largest-magnitude entry.`, answer: `${rowIdx}`, accept: [], hint: `The entry $${e[rowIdx - 1]}$ has the largest size.` },
    ],
    finalAnswer: { value: `${rowIdx}`, unit: "" },
    solutionNarrative: `The largest magnitude is $${maxMag}$ (row ${rowIdx}), so partial pivoting swaps that row up to be the pivot row — this keeps multipliers $\\le 1$ and limits round-off growth.`,
  };
};

// d3: menu + numeric — swap needed, then compute post-swap multiplier.
fill["nm2-pivot-3"] = (rng, idx) => {
  // pivot col: top small, below large; swap, then multiplier = smaller/larger
  const big = rng.int(4, 8);
  const small = rng.int(1, 3);
  // after swapping big to top, multiplier for the other row = small/big
  const mult = small / big;
  return {
    id: `gen.nm2-pivot-3.${idx}`, generated: true, concepts: ["partial-pivoting"], difficulty: 3, context: "abstract",
    prompt: `A pivot column has $${small}$ on top and $${big}$ below. Without pivoting the multiplier would be $${big}/${small} = ${rnd(big / small, 4)}$ — larger than 1, which amplifies round-off. Apply partial pivoting.`,
    steps: [
      { instruction: `Should you swap the rows so the larger entry $${big}$ is the pivot? (Type "yes" or "no".)`, answer: "yes", accept: [], hint: `Partial pivoting always brings the largest-magnitude entry to the pivot.` },
      { instruction: `After swapping, the multiplier for the other row is $${small}/${big}$. Compute it (round to 4 decimals).`, answer: rnd(mult, 4), accept: nbrs(mult, 4), hint: `$${small} \\div ${big}$ — now a number $\\le 1$.` },
    ],
    finalAnswer: { value: rnd(mult, 4), unit: "" },
    solutionNarrative: `Swap $${big}$ to the pivot; the multiplier becomes $${small}/${big} = ${rnd(mult, 4)} \\le 1$, so round-off no longer grows during elimination.`,
  };
};

// --- lu-decomposition --------------------------------------------------------

// d1: 2x2 LU (Doolittle: unit lower). Find l21 and the U entries.
fill["nm2-lu-1"] = (rng, idx) => {
  const a11 = rng.pick([2, 3, 4]);
  const k = rng.int(1, 3);
  const a21 = a11 * k;               // l21 = k integer
  const a12 = rng.int(1, 4);
  const a22 = a12 * k + rng.int(1, 3); // ensures u22 != 0
  const l21 = a21 / a11;             // = k
  const u22 = a22 - l21 * a12;
  return {
    id: `gen.nm2-lu-1.${idx}`, generated: true, concepts: ["lu-decomposition"], difficulty: 1, context: "abstract",
    prompt: `Find the LU decomposition ($L$ unit-lower-triangular, Doolittle) of $A = \\left[\\begin{array}{cc} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{array}\\right]$.`,
    steps: [
      { instruction: `The multiplier $\\ell_{21} = a_{21}/a_{11} = ${a21}/${a11}$. Compute it.`, answer: `${l21}`, accept: [], hint: `$${a21} \\div ${a11}$.` },
      { instruction: `Then $u_{22} = a_{22} - \\ell_{21}\\,a_{12} = ${a22} - ${l21}(${a12})$. Compute it.`, answer: `${u22}`, accept: [], hint: `$${a22} - ${l21 * a12}$.` },
      { instruction: `Write $U$ as a matrix $[[${a11}, ${a12}], [0, u_{22}]]$ with your value of $u_{22}$.`, answer: `[[${a11}, ${a12}], [0, ${u22}]]`, accept: [], hint: `$U$ keeps row 1 of $A$ and has $0$ then $u_{22}$ in row 2.` },
    ],
    finalAnswer: { value: `[[${a11}, ${a12}], [0, ${u22}]]`, unit: "" },
    solutionNarrative: `$\\ell_{21} = ${l21}$ and $u_{22} = ${u22}$, so $L = [[1,0],[${l21},1]]$ and $U = [[${a11}, ${a12}], [0, ${u22}]]$.`,
  };
};

// d2: 2x2 LU, ask for the L matrix explicitly.
fill["nm2-lu-2"] = (rng, idx) => {
  const a11 = rng.pick([2, 4]);
  const k = rng.int(1, 3);
  const a21 = a11 * k;
  const a12 = rng.int(1, 5);
  const a22 = a12 * k + rng.int(1, 4);
  const l21 = a21 / a11;
  const u22 = a22 - l21 * a12;
  return {
    id: `gen.nm2-lu-2.${idx}`, generated: true, concepts: ["lu-decomposition"], difficulty: 2, context: "abstract",
    prompt: `Decompose $A = \\left[\\begin{array}{cc} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{array}\\right]$ into $L$ (unit lower) and $U$ (upper).`,
    steps: [
      { instruction: `Find $\\ell_{21} = ${a21}/${a11}$.`, answer: `${l21}`, accept: [], hint: `$${a21}\\div${a11}$.` },
      { instruction: `Find $u_{22} = ${a22} - ${l21}(${a12})$.`, answer: `${u22}`, accept: [], hint: `$${a22} - ${l21 * a12}$.` },
      { instruction: `Write $L$ as a matrix $[[1, 0], [\\ell_{21}, 1]]$ with your $\\ell_{21}$.`, answer: `[[1, 0], [${l21}, 1]]`, accept: [], hint: `$L$ has 1's on the diagonal, $\\ell_{21}$ below.` },
    ],
    finalAnswer: { value: `L = [[1, 0], [${l21}, 1]], U = [[${a11}, ${a12}], [0, ${u22}]]`, unit: "" },
    solutionNarrative: `$\\ell_{21} = ${l21}$, $u_{22} = ${u22}$: $L = [[1,0],[${l21},1]]$, $U = [[${a11},${a12}],[0,${u22}]]$, and $LU = A$.`,
  };
};

// d3: 3x3 LU, first column of L (l21, l31) and one U entry.
fill["nm2-lu-3"] = (rng, idx) => {
  const a11 = rng.pick([2, 3]);
  const k2 = rng.int(1, 3), k3 = rng.int(1, 3);
  const a21 = a11 * k2, a31 = a11 * k3;
  const a12 = rng.int(1, 3), a13 = rng.int(1, 3);
  const a22 = a12 * k2 + rng.int(1, 3);
  const a23 = a13 * k2 + rng.int(0, 3);
  const a32 = a12 * k3 + rng.int(1, 3);
  const l21 = a21 / a11, l31 = a31 / a11;
  const u22 = a22 - l21 * a12;       // = int
  return {
    id: `gen.nm2-lu-3.${idx}`, generated: true, concepts: ["lu-decomposition"], difficulty: 3, context: "abstract",
    prompt: `For $A = \\left[\\begin{array}{ccc} ${a11} & ${a12} & ${a13} \\\\ ${a21} & ${a22} & ${a23} \\\\ ${a31} & ${a32} & \\cdot \\end{array}\\right]$, find the first-column multipliers of $L$ and the $(2,2)$ entry of $U$.`,
    steps: [
      { instruction: `$\\ell_{21} = a_{21}/a_{11} = ${a21}/${a11}$.`, answer: `${l21}`, accept: [], hint: `$${a21}\\div${a11}$.` },
      { instruction: `$\\ell_{31} = a_{31}/a_{11} = ${a31}/${a11}$.`, answer: `${l31}`, accept: [], hint: `$${a31}\\div${a11}$.` },
      { instruction: `$u_{22} = a_{22} - \\ell_{21}\\,a_{12} = ${a22} - ${l21}(${a12})$.`, answer: `${u22}`, accept: [], hint: `$${a22} - ${l21 * a12}$.` },
    ],
    finalAnswer: { value: `l21 = ${l21}, l31 = ${l31}, u22 = ${u22}`, unit: "" },
    solutionNarrative: `First-column multipliers $\\ell_{21} = ${l21}$, $\\ell_{31} = ${l31}$; after eliminating column 1, $u_{22} = ${u22}$.`,
  };
};

// --- condition-and-stability -------------------------------------------------

// d1: menu — ill-conditioned means sensitive.
fill["nm2-cond-1"] = (rng, idx) => {
  const q = rng.pick([
    { prompt: "A system is called **ill-conditioned** when a tiny change in the data causes a ___ change in the solution.", ans: "large", accept: ["big", "huge"] },
    { prompt: "A **well-conditioned** system's solution is ___ to small changes in the data.", ans: "insensitive", accept: ["stable", "robust"] },
    { prompt: "A large condition number signals that the answer may be ___ (untrustworthy) even if the arithmetic is exact.", ans: "unreliable", accept: ["inaccurate", "untrustworthy", "sensitive"] },
  ]);
  return {
    id: `gen.nm2-cond-1.${idx}`, generated: true, concepts: ["condition-and-stability"], difficulty: 1, context: "abstract",
    prompt: q.prompt + " (Type one word.)",
    steps: [
      { instruction: "Type the word that completes the sentence.", answer: q.ans, accept: q.accept, hint: "Ill-conditioning is about sensitivity to small data changes." },
    ],
    finalAnswer: { value: q.ans, unit: "" },
    solutionNarrative: `Ill-conditioned systems amplify small data errors into large solution errors — the completing word is "${q.ans}".`,
  };
};

// d2: numeric — compute a residual r = b - A x_approx for a 1-row check.
fill["nm2-cond-2"] = (rng, idx) => {
  // single equation residual: a1*xa + a2*ya vs b
  const a1 = rng.int(1, 4), a2 = rng.int(1, 4);
  const xa = rng.int(1, 5), ya = rng.int(1, 5);
  const bTrue = a1 * xa + a2 * ya;
  const b = bTrue + rng.pick([-2, -1, 1, 2]); // introduce a residual
  const resid = b - (a1 * xa + a2 * ya);
  return {
    id: `gen.nm2-cond-2.${idx}`, generated: true, concepts: ["condition-and-stability"], difficulty: 2, context: "abstract",
    prompt: `A candidate solution $x = ${xa}, y = ${ya}$ is proposed for the equation $${a1}x + ${a2}y = ${b}$. The **residual** measures how far off it is: $r = b - (${a1}x + ${a2}y)$.`,
    steps: [
      { instruction: `Compute $${a1}x + ${a2}y$ at the candidate: $${a1}(${xa}) + ${a2}(${ya})$.`, answer: `${a1 * xa + a2 * ya}`, accept: [], hint: `$${a1 * xa} + ${a2 * ya}$.` },
      { instruction: `Compute the residual $r = ${b} - ${a1 * xa + a2 * ya}$.`, answer: `${resid}`, accept: [], hint: `Subtract the computed value from $b$.` },
    ],
    finalAnswer: { value: `${resid}`, unit: "" },
    solutionNarrative: `The candidate gives $${a1 * xa + a2 * ya}$, so the residual is $r = ${b} - ${a1 * xa + a2 * ya} = ${resid}$. A small residual doesn't guarantee accuracy for an ill-conditioned system.`,
  };
};

// d3: menu — a small residual does NOT guarantee a good solution.
fill["nm2-cond-3"] = (rng, idx) => {
  const q = rng.pick([
    { prompt: "For an **ill-conditioned** system, a very small residual guarantees the computed solution is close to the true one.", ans: "false", accept: ["f", "no"] },
    { prompt: "For an ill-conditioned system, two very different solutions can BOTH produce small residuals.", ans: "true", accept: ["t", "yes"] },
    { prompt: "Increasing the condition number generally makes a solution MORE sensitive to round-off error.", ans: "true", accept: ["t", "yes"] },
    { prompt: "Partial pivoting improves numerical stability but cannot fix an inherently ill-conditioned matrix.", ans: "true", accept: ["t", "yes"] },
  ]);
  return {
    id: `gen.nm2-cond-3.${idx}`, generated: true, concepts: ["condition-and-stability"], difficulty: 3, context: "abstract",
    prompt: q.prompt + ' (Type "true" or "false".)',
    steps: [
      { instruction: 'Type "true" or "false".', answer: q.ans, accept: q.accept, hint: "Conditioning is a property of the matrix; residual size and pivoting are separate issues." },
    ],
    finalAnswer: { value: q.ans, unit: "" },
    solutionNarrative: `The statement is ${q.ans}. Conditioning is intrinsic to the matrix: a small residual and a stable algorithm still cannot rescue an ill-conditioned problem.`,
  };
};

// ============================================================================
// Topic C: numerical-methods.numerical-odes
// Concepts: euler-method, improved-euler-heun, runge-kutta-4,
//           stability-and-step-size
// ============================================================================
// All f(x,y) are given in the prompt; every slope evaluates to a number.

// --- euler-method ------------------------------------------------------------

// d1: one Euler step of y' = a x + b y, integer arithmetic.
fill["nm2-euler-1"] = (rng, idx) => {
  const a = rng.int(0, 2), b = rng.int(1, 2);
  const x0 = rng.int(0, 2), y0 = rng.int(1, 4);
  const hNum = rng.pick([1, 2, 5]);  // h in tenths: 0.1,0.2,0.5
  const h = hNum / 10;
  const slope = a * x0 + b * y0;
  // y1 = y0 + h*slope ; integer-scaled
  const y1scaled = y0 * 10 + hNum * slope; // = 10*y1
  const y1 = y1scaled / 10;
  return {
    id: `gen.nm2-euler-1.${idx}`, generated: true, concepts: ["euler-method"], difficulty: 1, context: "abstract",
    prompt: `Given $y' = ${a === 0 ? "" : a === 1 ? "x + " : a + "x + "}${b}y$ with $y(${x0}) = ${y0}$ and step $h = ${rnd(h, 1)}$, take one Euler step to estimate $y(${rnd(x0 + h, 1)})$.`,
    steps: [
      { instruction: `Compute the slope $f(${x0}, ${y0}) = ${a === 0 ? "" : a + "(" + x0 + ") + "}${b}(${y0})$.`, answer: `${slope}`, accept: [], hint: `${a === 0 ? "" : a * x0 + " + "}${b * y0}.` },
      { instruction: `Apply $y_1 = y_0 + h\\,f = ${y0} + ${rnd(h, 1)}(${slope})$. Round to 2 decimals.`, answer: rnd(y1, 2), accept: nbrs(y1, 2), hint: `$${y0} + ${rnd(h * slope, 2)}$.` },
    ],
    finalAnswer: { value: rnd(y1, 2), unit: "" },
    solutionNarrative: `Slope $= ${slope}$; $y_1 = ${y0} + ${rnd(h, 1)}(${slope}) = ${rnd(y1, 2)}$.`,
  };
};

// d2: two Euler steps of y' = a y (or a x + b y), tracking both.
fill["nm2-euler-2"] = (rng, idx) => {
  const b = rng.int(1, 2);
  const x0 = 0, y0 = rng.int(1, 3);
  const hNum = rng.pick([2, 5]);     // 0.2 or 0.5
  const h = hNum / 10;
  const a = rng.int(0, 2);
  const s1 = a * x0 + b * y0;
  const y1 = (y0 * 10 + hNum * s1) / 10;
  const x1 = (x0 * 10 + hNum) / 10;
  const s2 = a * x1 + b * y1;
  const y2 = (y1 * 100 + hNum * Math.round(s2 * 10)) / 100; // keep 2-dp arithmetic exact-ish
  // recompute y2 cleanly
  const y2clean = y1 + h * s2;
  return {
    id: `gen.nm2-euler-2.${idx}`, generated: true, concepts: ["euler-method"], difficulty: 2, context: "abstract",
    prompt: `Given $y' = ${a === 0 ? "" : a + "x + "}${b}y$ with $y(0) = ${y0}$ and $h = ${rnd(h, 1)}$, take **two** Euler steps to estimate $y(${rnd(2 * h, 1)})$.`,
    steps: [
      { instruction: `Step 1 at $(0, ${y0})$: slope $= ${s1}$, so $y_1 = ${y0} + ${rnd(h, 1)}(${s1})$. Round to 2 decimals.`, answer: rnd(y1, 2), accept: nbrs(y1, 2), hint: `$${y0} + ${rnd(h * s1, 2)}$.` },
      { instruction: `Step 2 at $(${rnd(x1, 1)}, ${rnd(y1, 2)})$: slope $= ${rnd(s2, 2)}$, so $y_2 = ${rnd(y1, 2)} + ${rnd(h, 1)}(${rnd(s2, 2)})$. Round to 2 decimals.`, answer: rnd(y2clean, 2), accept: nbrs(y2clean, 2), hint: `$${rnd(y1, 2)} + ${rnd(h * s2, 2)}$.` },
    ],
    finalAnswer: { value: rnd(y2clean, 2), unit: "" },
    solutionNarrative: `Step 1: $y_1 = ${rnd(y1, 2)}$. Step 2: slope $= ${rnd(s2, 2)}$, $y_2 = ${rnd(y2clean, 2)}$.`,
  };
};

// d3: applied one/two-step Euler (cooling / growth), h chosen for clean numbers.
fill["nm2-euler-3"] = (rng, idx) => {
  const ctx = rng.pick([
    { what: "A capacitor discharges", eq: "-0.5y", k: -0.5, u: "volts", y0: rng.int(6, 10) },
    { what: "A population grows", eq: "0.2y", k: 0.2, u: "thousand", y0: rng.int(4, 9) },
    { what: "A tank drains", eq: "-0.4y", k: -0.4, u: "liters", y0: rng.int(5, 10) },
  ]);
  const y0 = ctx.y0;
  const h = 1;
  const s1 = ctx.k * y0;
  const y1 = y0 + h * s1;
  const s2 = ctx.k * y1;
  const y2 = y1 + h * s2;
  return {
    id: `gen.nm2-euler-3.${idx}`, generated: true, concepts: ["euler-method"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} following $y' = ${ctx.eq}$ (${ctx.u}), starting at $y(0) = ${y0}$. Use two Euler steps with $h = 1$ to estimate $y(2)$.`,
    steps: [
      { instruction: `Step 1: slope $= ${ctx.eq.replace("y", "(" + y0 + ")")} = ${rnd(s1, 2)}$, so $y_1 = ${y0} + 1(${rnd(s1, 2)})$. Round to 2 decimals.`, answer: rnd(y1, 2), accept: nbrs(y1, 2), hint: `$${y0} ${s1 >= 0 ? "+" : "-"} ${rnd(Math.abs(s1), 2)}$.` },
      { instruction: `Step 2: slope $= ${ctx.eq.replace("y", "(" + rnd(y1, 2) + ")")} = ${rnd(s2, 3)}$, so $y_2 = ${rnd(y1, 2)} + 1(${rnd(s2, 3)})$. Round to 2 decimals.`, answer: rnd(y2, 2), accept: nbrs(y2, 2), hint: `$${rnd(y1, 2)} ${s2 >= 0 ? "+" : "-"} ${rnd(Math.abs(s2), 3)}$.` },
    ],
    finalAnswer: { value: rnd(y2, 2), unit: ctx.u },
    solutionNarrative: `Step 1: $y_1 = ${rnd(y1, 2)}$. Step 2: $y_2 = ${rnd(y2, 2)}$ ${ctx.u} after 2 steps.`,
  };
};

// --- improved-euler-heun -----------------------------------------------------

// One Heun step: predictor yp = y0 + h f(x0,y0); corrector y1 = y0 + h/2 (f0 + f(x0+h, yp)).

// d1: y' = a x + b y, small integers, h = 0.1 or 0.2.
fill["nm2-heun-1"] = (rng, idx) => {
  const a = rng.int(1, 2), b = rng.int(0, 1);
  const x0 = rng.int(0, 1), y0 = rng.int(1, 3);
  const hNum = rng.pick([2, 5]);     // 0.2 or 0.5
  const h = hNum / 10;
  const f0 = a * x0 + b * y0;
  const xp = x0 + h;
  const yp = y0 + h * f0;
  const f1 = a * xp + b * yp;
  const y1 = y0 + (h / 2) * (f0 + f1);
  return {
    id: `gen.nm2-heun-1.${idx}`, generated: true, concepts: ["improved-euler-heun"], difficulty: 1, context: "abstract",
    prompt: `Take one **Heun (improved Euler)** step for $y' = ${a}x${b === 0 ? "" : " + " + b + "y"}$ with $y(${x0}) = ${y0}$ and $h = ${rnd(h, 1)}$. Predictor: $y^* = y_0 + h f_0$; corrector: $y_1 = y_0 + \\tfrac{h}{2}(f_0 + f(x_0+h, y^*))$.`,
    steps: [
      { instruction: `Compute the starting slope $f_0 = ${a}(${x0})${b === 0 ? "" : " + " + b + "(" + y0 + ")"}$.`, answer: `${f0}`, accept: [], hint: `${a * x0}${b === 0 ? "" : " + " + b * y0}.` },
      { instruction: `Predictor $y^* = ${y0} + ${rnd(h, 1)}(${f0})$. Round to 3 decimals.`, answer: rnd(yp, 3), accept: nbrs(yp, 3), hint: `$${y0} + ${rnd(h * f0, 3)}$.` },
      { instruction: `End slope $f_1 = ${a}(${rnd(xp, 1)})${b === 0 ? "" : " + " + b + "(" + rnd(yp, 3) + ")"} = ${rnd(f1, 3)}$. Corrector $y_1 = ${y0} + \\tfrac{${rnd(h, 1)}}{2}(${f0} + ${rnd(f1, 3)})$. Round to 3 decimals.`, answer: rnd(y1, 3), accept: nbrs(y1, 3), hint: `Average the two slopes, then step.` },
    ],
    finalAnswer: { value: rnd(y1, 3), unit: "" },
    solutionNarrative: `$f_0 = ${f0}$, predictor $y^* = ${rnd(yp, 3)}$, end slope $f_1 = ${rnd(f1, 3)}$; corrector $y_1 = ${rnd(y1, 3)}$ — closer to the true curve than plain Euler.`,
  };
};

// d2: y' = x + y style, show the slope-averaging clearly.
fill["nm2-heun-2"] = (rng, idx) => {
  const x0 = 0, y0 = rng.int(1, 3);
  const hNum = rng.pick([2, 5]);
  const h = hNum / 10;
  const f = (x, y) => x + y;
  const f0 = f(x0, y0);
  const yp = y0 + h * f0;
  const f1 = f(x0 + h, yp);
  const y1 = y0 + (h / 2) * (f0 + f1);
  return {
    id: `gen.nm2-heun-2.${idx}`, generated: true, concepts: ["improved-euler-heun"], difficulty: 2, context: "abstract",
    prompt: `Use Heun's method (one step) for $y' = x + y$, $y(0) = ${y0}$, $h = ${rnd(h, 1)}$.`,
    steps: [
      { instruction: `Starting slope $f_0 = f(0, ${y0}) = 0 + ${y0}$.`, answer: `${f0}`, accept: [], hint: `$x + y$ at the start.` },
      { instruction: `Predictor (Euler) $y^* = ${y0} + ${rnd(h, 1)}(${f0})$. Round to 3 decimals.`, answer: rnd(yp, 3), accept: nbrs(yp, 3), hint: `$${y0} + ${rnd(h * f0, 3)}$.` },
      { instruction: `End slope $f_1 = f(${rnd(h, 1)}, ${rnd(yp, 3)}) = ${rnd(h, 1)} + ${rnd(yp, 3)} = ${rnd(f1, 3)}$. Corrector $y_1 = ${y0} + \\tfrac{${rnd(h, 1)}}{2}(${f0} + ${rnd(f1, 3)})$. Round to 3 decimals.`, answer: rnd(y1, 3), accept: nbrs(y1, 3), hint: `Average slopes $\\tfrac{${f0} + ${rnd(f1, 3)}}{2}$, times $h$, add to $y_0$.` },
    ],
    finalAnswer: { value: rnd(y1, 3), unit: "" },
    solutionNarrative: `$f_0 = ${f0}$, $y^* = ${rnd(yp, 3)}$, $f_1 = ${rnd(f1, 3)}$; corrector gives $y_1 = ${rnd(y1, 3)}$.`,
  };
};

// d3: applied Heun step (cooling), compare against Euler in narrative.
fill["nm2-heun-3"] = (rng, idx) => {
  const k = rng.pick([0.1, 0.2]);
  const env = rng.int(15, 25);
  const T0 = env + rng.int(30, 50);
  const h = 1;
  const f = (T) => -k * (T - env);
  const f0 = f(T0);
  const Tp = T0 + h * f0;
  const f1 = f(Tp);
  const T1 = T0 + (h / 2) * (f0 + f1);
  return {
    id: `gen.nm2-heun-3.${idx}`, generated: true, concepts: ["improved-euler-heun"], difficulty: 3, context: "applied",
    prompt: `An object cools by Newton's law $T' = -${k}(T - ${env})$, starting at $T(0) = ${T0}$°. Take one Heun step with $h = 1$ to estimate $T(1)$.`,
    steps: [
      { instruction: `Starting slope $f_0 = -${k}(${T0} - ${env}) = ${rnd(f0, 3)}$. Predictor $T^* = ${T0} + 1(${rnd(f0, 3)})$. Round to 3 decimals.`, answer: rnd(Tp, 3), accept: nbrs(Tp, 3), hint: `$${T0} ${f0 >= 0 ? "+" : "-"} ${rnd(Math.abs(f0), 3)}$.` },
      { instruction: `End slope $f_1 = -${k}(${rnd(Tp, 3)} - ${env}) = ${rnd(f1, 4)}$. Corrector $T_1 = ${T0} + \\tfrac{1}{2}(${rnd(f0, 3)} + ${rnd(f1, 4)})$. Round to 3 decimals.`, answer: rnd(T1, 3), accept: nbrs(T1, 3), hint: `Average the two slopes and add to $T_0$.` },
    ],
    finalAnswer: { value: rnd(T1, 3), unit: "degrees" },
    solutionNarrative: `Predictor $T^* = ${rnd(Tp, 3)}$, corrector $T_1 = ${rnd(T1, 3)}$° — Heun's slope averaging corrects Euler's overshoot on the flattening cooling curve.`,
  };
};

// --- runge-kutta-4 -----------------------------------------------------------

// One RK4 step: k1=f(x,y); k2=f(x+h/2, y+h/2 k1); k3=f(x+h/2, y+h/2 k2);
// k4=f(x+h, y+h k3); y1 = y0 + h/6 (k1 + 2k2 + 2k3 + k4).

// d1: y' = a y (constant coeff), h chosen clean.
fill["nm2-rk4-1"] = (rng, idx) => {
  const a = rng.pick([1, 2]);
  const y0 = rng.int(1, 3);
  const h = rng.pick([0.1, 0.2]);
  const f = (x, y) => a * y;
  const k1 = f(0, y0);
  const k2 = f(0 + h / 2, y0 + (h / 2) * k1);
  const k3 = f(0 + h / 2, y0 + (h / 2) * k2);
  const k4 = f(0 + h, y0 + h * k3);
  const y1 = y0 + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return {
    id: `gen.nm2-rk4-1.${idx}`, generated: true, concepts: ["runge-kutta-4"], difficulty: 1, context: "abstract",
    prompt: `Take one **RK4** step for $y' = ${a}y$, $y(0) = ${y0}$, $h = ${rnd(h, 1)}$. Slopes: $k_1 = f(x_0,y_0)$; $k_2 = f(x_0+\\tfrac h2, y_0+\\tfrac h2 k_1)$; $k_3 = f(x_0+\\tfrac h2, y_0+\\tfrac h2 k_2)$; $k_4 = f(x_0+h, y_0+h k_3)$.`,
    steps: [
      { instruction: `$k_1 = ${a}(${y0})$.`, answer: `${k1}`, accept: [], hint: `$${a} \\times ${y0}$.` },
      { instruction: `$k_2 = ${a}\\,(y_0 + \\tfrac{h}{2}k_1) = ${a}(${y0} + ${rnd(h / 2, 3)}\\cdot${k1})$. Round to 4 decimals.`, answer: rnd(k2, 4), accept: nbrs(k2, 4), hint: `$${a}(${rnd(y0 + (h / 2) * k1, 4)})$.` },
      { instruction: `$k_3 = ${a}(${y0} + ${rnd(h / 2, 3)}\\cdot${rnd(k2, 4)}) = ${rnd(k3, 4)}$, $k_4 = ${a}(${y0} + ${rnd(h, 1)}\\cdot${rnd(k3, 4)}) = ${rnd(k4, 4)}$. Now $y_1 = ${y0} + \\tfrac{${rnd(h, 1)}}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. Round to 4 decimals.`, answer: rnd(y1, 4), accept: nbrs(y1, 4), hint: `Weighted average: $\\tfrac{k_1 + 2k_2 + 2k_3 + k_4}{6}$ times $h$.` },
    ],
    finalAnswer: { value: rnd(y1, 4), unit: "" },
    solutionNarrative: `$k_1 = ${k1}$, $k_2 = ${rnd(k2, 4)}$, $k_3 = ${rnd(k3, 4)}$, $k_4 = ${rnd(k4, 4)}$; $y_1 = ${rnd(y1, 4)}$ — RK4's four-slope blend is far more accurate than one Euler step.`,
  };
};

// d2: y' = x + y, h=0.2.
fill["nm2-rk4-2"] = (rng, idx) => {
  const y0 = rng.int(1, 2);
  const h = 0.2;
  const f = (x, y) => x + y;
  const k1 = f(0, y0);
  const k2 = f(h / 2, y0 + (h / 2) * k1);
  const k3 = f(h / 2, y0 + (h / 2) * k2);
  const k4 = f(h, y0 + h * k3);
  const y1 = y0 + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return {
    id: `gen.nm2-rk4-2.${idx}`, generated: true, concepts: ["runge-kutta-4"], difficulty: 2, context: "abstract",
    prompt: `Compute one RK4 step for $y' = x + y$, $y(0) = ${y0}$, $h = 0.2$.`,
    steps: [
      { instruction: `$k_1 = f(0, ${y0}) = 0 + ${y0}$.`, answer: `${k1}`, accept: [], hint: `$x + y$ at the start.` },
      { instruction: `$k_2 = f(0.1, ${y0} + 0.1\\cdot${k1}) = 0.1 + ${rnd(y0 + 0.1 * k1, 3)}$. Round to 3 decimals.`, answer: rnd(k2, 3), accept: nbrs(k2, 3), hint: `$0.1 + ${rnd(y0 + 0.1 * k1, 3)}$.` },
      { instruction: `$k_3 = f(0.1, ${y0} + 0.1\\cdot${rnd(k2, 3)}) = ${rnd(k3, 3)}$, $k_4 = f(0.2, ${y0} + 0.2\\cdot${rnd(k3, 3)}) = ${rnd(k4, 3)}$. Then $y_1 = ${y0} + \\tfrac{0.2}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. Round to 4 decimals.`, answer: rnd(y1, 4), accept: nbrs(y1, 4), hint: `$\\tfrac{0.2}{6} \\approx 0.03333$ times the weighted slope sum.` },
    ],
    finalAnswer: { value: rnd(y1, 4), unit: "" },
    solutionNarrative: `$k_1 = ${k1}$, $k_2 = ${rnd(k2, 3)}$, $k_3 = ${rnd(k3, 3)}$, $k_4 = ${rnd(k4, 3)}$; $y_1 = ${rnd(y1, 4)}$.`,
  };
};

// d3: applied RK4 step (orbital / drag-like linear f), h=0.1.
fill["nm2-rk4-3"] = (rng, idx) => {
  const ctx = rng.pick([
    { what: "A satellite's radial speed", eq: "10 - 0.5v", g: (x, v) => 10 - 0.5 * v, u: "m/s", y0: rng.int(2, 6) },
    { what: "A charging circuit's current", eq: "5 - v", g: (x, v) => 5 - v, u: "A", y0: rng.int(1, 3) },
    { what: "A falling probe's velocity", eq: "9.8 - 0.4v", g: (x, v) => 9.8 - 0.4 * v, u: "m/s", y0: rng.int(1, 4) },
  ]);
  const y0 = ctx.y0, h = 0.1;
  const f = ctx.g;
  const k1 = f(0, y0);
  const k2 = f(h / 2, y0 + (h / 2) * k1);
  const k3 = f(h / 2, y0 + (h / 2) * k2);
  const k4 = f(h, y0 + h * k3);
  const y1 = y0 + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  return {
    id: `gen.nm2-rk4-3.${idx}`, generated: true, concepts: ["runge-kutta-4"], difficulty: 3, context: "applied",
    prompt: `${ctx.what} obeys $v' = ${ctx.eq}$ (${ctx.u}), $v(0) = ${y0}$. Take one RK4 step with $h = 0.1$ to estimate $v(0.1)$.`,
    steps: [
      { instruction: `$k_1 = ${ctx.eq.replace("v", "(" + y0 + ")")} = ${rnd(k1, 4)}$.`, answer: rnd(k1, 4), accept: nbrs(k1, 4), hint: `Evaluate $v'$ at $v = ${y0}$.` },
      { instruction: `$k_2 = f(0.05, ${y0} + 0.05\\cdot${rnd(k1, 4)}) = ${rnd(k2, 4)}$ and $k_3 = ${rnd(k3, 4)}$. Compute $k_4 = ${ctx.eq.replace("v", "(" + rnd(y0 + h * k3, 4) + ")")}$. Round to 4 decimals.`, answer: rnd(k4, 4), accept: nbrs(k4, 4), hint: `Evaluate $v'$ at $v = ${rnd(y0 + h * k3, 4)}$.` },
      { instruction: `Combine: $v_1 = ${y0} + \\tfrac{0.1}{6}(${rnd(k1, 4)} + 2(${rnd(k2, 4)}) + 2(${rnd(k3, 4)}) + ${rnd(k4, 4)})$. Round to 4 decimals.`, answer: rnd(y1, 4), accept: nbrs(y1, 4), hint: `$\\tfrac{0.1}{6}$ times the weighted slope sum, added to $${y0}$.` },
    ],
    finalAnswer: { value: rnd(y1, 4), unit: ctx.u },
    solutionNarrative: `$k_1 = ${rnd(k1, 4)}$, $k_2 = ${rnd(k2, 4)}$, $k_3 = ${rnd(k3, 4)}$, $k_4 = ${rnd(k4, 4)}$; $v_1 = ${rnd(y1, 4)}$ ${ctx.u}.`,
  };
};

// --- stability-and-step-size -------------------------------------------------

// d1: menu — local vs global error.
fill["nm2-odestab-1"] = (rng, idx) => {
  const q = rng.pick([
    { prompt: "The error made in a **single** step of a method is called the ___ error.", ans: "local", accept: ["local truncation", "local truncation error"] },
    { prompt: "The **accumulated** error after many steps, from the start to the final point, is the ___ error.", ans: "global", accept: ["global truncation", "global truncation error"] },
  ]);
  return {
    id: `gen.nm2-odestab-1.${idx}`, generated: true, concepts: ["stability-and-step-size"], difficulty: 1, context: "abstract",
    prompt: q.prompt + " (Type one word: local or global.)",
    steps: [
      { instruction: 'Type "local" or "global".', answer: q.ans, accept: q.accept, hint: "Single step = local; accumulated over all steps = global." },
    ],
    finalAnswer: { value: q.ans, unit: "" },
    solutionNarrative: `Per-step error is local; the total accumulated error is global. Answer: ${q.ans}.`,
  };
};

// d2: numeric — halving h and the error factor for a given order method.
fill["nm2-odestab-2"] = (rng, idx) => {
  const method = rng.pick([
    { name: "Euler's method", order: 1, factor: 2 },
    { name: "Heun's method", order: 2, factor: 4 },
    { name: "RK4", order: 4, factor: 16 },
  ]);
  const startErr = rng.int(2, 9) * 0.01;
  const newErr = startErr / method.factor;
  return {
    id: `gen.nm2-odestab-2.${idx}`, generated: true, concepts: ["stability-and-step-size"], difficulty: 2, context: "abstract",
    prompt: `${method.name} has global error of order $h^{${method.order}}$. Its current error is about $${rnd(startErr, 2)}$. Estimate the error after you **halve** the step size.`,
    steps: [
      { instruction: `Halving $h$ scales the error by $\\left(\\tfrac12\\right)^{${method.order}} = \\tfrac{1}{${method.factor}}$. By what factor does the error shrink? (Type ${method.factor}.)`, answer: `${method.factor}`, accept: [], hint: `$2^{${method.order}} = ${method.factor}$.` },
      { instruction: `Compute the new error $${rnd(startErr, 2)} / ${method.factor}$. Round to 4 decimals.`, answer: rnd(newErr, 4), accept: nbrs(newErr, 4), hint: `Divide by ${method.factor}.` },
    ],
    finalAnswer: { value: rnd(newErr, 4), unit: "" },
    solutionNarrative: `Global error $\\propto h^{${method.order}}$: halving $h$ divides it by $${method.factor}$, giving $${rnd(startErr, 2)}/${method.factor} = ${rnd(newErr, 4)}$. Higher-order methods reward a finer step far more.`,
  };
};

// d3: menu + numeric — compare Euler vs RK4 error shrink, plus a menu.
fill["nm2-odestab-3"] = (rng, idx) => {
  // Given Euler error and the fact RK4 is order 4, which shrinks faster (menu),
  // and compute RK4 factor for halving.
  const eulerErr = rng.int(3, 9) * 0.01;
  const rk4New = eulerErr / 16;
  return {
    id: `gen.nm2-odestab-3.${idx}`, generated: true, concepts: ["stability-and-step-size"], difficulty: 3, context: "abstract",
    prompt: `Two methods run on the same problem: Euler (order 1) and RK4 (order 4). Both start with error $${rnd(eulerErr, 2)}$ and you halve $h$.`,
    steps: [
      { instruction: `Which method's error shrinks **more** when $h$ is halved: "Euler" or "RK4"?`, answer: "RK4", accept: ["rk4", "runge-kutta-4", "runge-kutta"], hint: `Higher order ⇒ steeper error reduction.` },
      { instruction: `RK4 error scales by $\\tfrac{1}{16}$. Compute its new error $${rnd(eulerErr, 2)}/16$. Round to 5 decimals.`, answer: rnd(rk4New, 5), accept: nbrs(rk4New, 5), hint: `$${rnd(eulerErr, 2)} \\div 16$.` },
    ],
    finalAnswer: { value: rnd(rk4New, 5), unit: "" },
    solutionNarrative: `RK4 (order 4) shrinks error by $16\\times$ per halving vs Euler's $2\\times$: its new error is $${rnd(eulerErr, 2)}/16 = ${rnd(rk4New, 5)}$.`,
  };
};
