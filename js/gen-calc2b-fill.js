// gen-calc2b-fill.js
// Self-contained generator pack for calculus-2.parametric-polar-calculus
// (templates prefixed c2p-). One generator per (concept, difficulty) — 12 total.
// Exports a `fill` map of template-name -> generator fn matching the shape used
// by js/generator.js (same pattern as gen-calc2-fill.js). Deterministic from the
// passed rng only; no imports from generator.js.
//
// Grader-safety notes (verified against js/problem-engine.js):
//   - All symbolic answers are POLYNOMIALS in one variable (t or x) or
//     polynomial equations — these grade via the polynomial engine.
//   - Polar areas are single numeric-pi values ("9pi/4") — evalNumeric grades
//     them; bare "9pi/4" was tested and self-checks.
//   - Horizontal-tangent t-value sets use form:"solutions" with INTEGER roots
//     (parseSolutionSet cannot evaluate pi-expressions).
//   - Arc-length families are engineered so the integrand is a perfect square:
//       lines: (a)^2 + (c)^2 = h^2 with (a,c,h) a Pythagorean triple;
//       x = t, y = (2/3)t^{3/2}: integrand 1 + t, limits k^2 - 1 (exact);
//       x = a(t - t^3/3), y = a t^2: integrand a^2(1 - t^2)^2 + (2at)^2
//         = a^2(1 + t^2)^2 (verified: 1 - 2t^2 + t^4 + 4t^2 = (1+t^2)^2).
//   - Slope evaluation points always have dx/dt != 0.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
// Reduced fraction string, sign on the numerator: frac(-2, 6) -> "-1/3".
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  if (n === 0) return "0";
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Round v to k decimals, avoiding "-0.00"; returns string.
const rnd = (v, k) => {
  let s = v.toFixed(k);
  if (parseFloat(s) === 0) s = (0).toFixed(k);
  return s;
};
// "px + q" display string (p or q may be 0, not both shown when 0).
const lin = (p, q, v = "x") => {
  let s = "";
  if (p !== 0) s = p === 1 ? v : p === -1 ? `-${v}` : `${p}${v}`;
  if (q !== 0) s += s === "" ? `${q}` : q > 0 ? ` + ${q}` : ` - ${-q}`;
  return s === "" ? "0" : s;
};
// General polynomial display from [[coef, power], ...] (descending powers).
const disp = (terms, v = "t") => {
  let s = "";
  for (const [c, p] of terms) {
    if (c === 0) continue;
    const mag = Math.abs(c);
    const suf = p === 0 ? "" : p === 1 ? v : `${v}^${p}`;
    const body = `${mag === 1 && suf ? "" : mag}${suf}`;
    s += s === "" ? `${c < 0 ? "-" : ""}${body}` : `${c < 0 ? " - " : " + "}${body}`;
  }
  return s === "" ? "0" : s;
};
// Reduced "n pi / d" string: piFrac(4, 2) -> "2pi", piFrac(9, 4) -> "9pi/4".
const piFrac = (n, d) => {
  const g = gcd(n, d) || 1; n /= g; d /= g;
  const top = n === 1 ? "pi" : `${n}pi`;
  return d === 1 ? top : `${top}/${d}`;
};
// Generous accepts for a pi-multiple answer: starred form + rounded decimal.
const piAccepts = (n, d) => {
  const g = gcd(n, d) || 1; const nn = n / g, dd = d / g;
  const starred = dd === 1 ? `${nn}*pi` : `${nn}*pi/${dd}`;
  return [starred, rnd((nn / dd) * Math.PI, 2)];
};

export const fill = {};

// ============================================================================
// Concept: parametric-curves
// ============================================================================

// d1: evaluate (x(t), y(t)) at a point — separate numeric x/y steps.
fill["c2p-param-curves-1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(-4, 4), c = rng.int(1, 3), d = rng.int(-4, 4);
  const t0 = rng.int(1, 3);
  const x0 = a * t0 + b, y0 = c * t0 * t0 + d;
  const xs = lin(a, b, "t"), ys = disp([[c, 2], [d, 0]]);
  return {
    id: `gen.c2p-param-curves-1.${idx}`, generated: true, concepts: ["parametric-curves"], difficulty: 1, context: "abstract",
    prompt: `A point moves along the parametric curve $x(t) = ${xs}$, $y(t) = ${ys}$. Find its position at $t = ${t0}$.`,
    steps: [
      { instruction: `Compute $x(${t0})$ by substituting $t = ${t0}$ into $x(t) = ${xs}$.`, answer: `${x0}`, accept: [`x=${x0}`], hint: `$${a}(${t0}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)}$.` },
      { instruction: `Compute $y(${t0})$ by substituting $t = ${t0}$ into $y(t) = ${ys}$.`, answer: `${y0}`, accept: [`y=${y0}`], hint: `$${c === 1 ? "" : c}(${t0})^2 ${d >= 0 ? "+" : "-"} ${Math.abs(d)}$ — square first, then scale and shift.` },
      { instruction: "Write the position as an ordered pair $(x, y)$.", answer: `(${x0}, ${y0})`, accept: [`${x0}, ${y0}`, `(${x0},${y0})`], hint: "The x-value you found first, then the y-value." },
    ],
    finalAnswer: { value: `(${x0}, ${y0})`, unit: "" },
    solutionNarrative: `Each coordinate has its own formula in $t$: $x(${t0}) = ${x0}$ and $y(${t0}) = ${y0}$, so the point is at $(${x0}, ${y0})$.`,
  };
};

// d2: eliminate the parameter for a LINEAR pair (x = t + a, y = bt + c).
fill["c2p-param-curves-2"] = (rng, idx) => {
  let a, b, c;
  do {
    a = rng.int(-4, 4); b = rng.int(-4, 4); c = rng.int(-5, 5);
  } while (a === 0 || b === 0 || b === 1);
  const tSolved = lin(1, -a, "x");
  const yEq = lin(b, c - a * b, "x");
  return {
    id: `gen.c2p-param-curves-2.${idx}`, generated: true, concepts: ["parametric-curves"], difficulty: 2, context: "abstract",
    prompt: `Eliminate the parameter from $x = ${lin(1, a, "t")}$, $y = ${lin(b, c, "t")}$ to get a Cartesian equation for the curve.`,
    steps: [
      { instruction: `Solve the $x$-equation for $t$. (Type it like t = ${tSolved}.)`, answer: `t = ${tSolved}`, accept: [tSolved], hint: `Subtract ${a >= 0 ? a : `(${a})`} from both sides of $x = ${lin(1, a, "t")}$.` },
      { instruction: `Substitute that expression for $t$ into $y = ${lin(b, c, "t")}$ and simplify. Write the result as y = ...`, answer: `y = ${yEq}`, accept: [yEq, `y = ${b}(${tSolved}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}`], hint: `$y = ${b}(${tSolved}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$ — distribute and combine constants.` },
    ],
    finalAnswer: { value: `y = ${yEq}`, unit: "" },
    solutionNarrative: `From the $x$-equation, $t = ${tSolved}$; substituting into the $y$-equation gives the line $y = ${yEq}$.`,
  };
};

// d3: eliminate the parameter for a QUADRATIC pair (x = t + a, y = t^2 + bt + c).
fill["c2p-param-curves-3"] = (rng, idx) => {
  let a, b, c;
  do {
    a = rng.int(-3, 3); b = rng.int(-3, 3); c = rng.int(-4, 4);
  } while (a === 0);
  const t0 = rng.int(1, 2);
  const px = t0 + a, py = t0 * t0 + b * t0 + c;
  const P = b - 2 * a, Q = a * a - a * b + c;
  const tSolved = lin(1, -a, "x");
  const yEq = disp([[1, 2], [P, 1], [Q, 0]], "x");
  return {
    id: `gen.c2p-param-curves-3.${idx}`, generated: true, concepts: ["parametric-curves"], difficulty: 3, context: "abstract",
    prompt: `Consider the parametric curve $x = ${lin(1, a, "t")}$, $y = ${disp([[1, 2], [b, 1], [c, 0]])}$. First locate one point on it, then eliminate the parameter.`,
    steps: [
      { instruction: `Find the point $(x, y)$ at $t = ${t0}$.`, answer: `(${px}, ${py})`, accept: [`${px}, ${py}`, `(${px},${py})`], hint: `$x = ${t0} ${a >= 0 ? "+" : "-"} ${Math.abs(a)}$ and $y = ${t0}^2 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}(${t0}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$.` },
      { instruction: `Solve the $x$-equation for $t$. (Type it like t = ${tSolved}.)`, answer: `t = ${tSolved}`, accept: [tSolved], hint: `Move the constant to the other side.` },
      { instruction: `Substitute into the $y$-equation and expand fully. Write the result as y = ... (a polynomial in $x$).`, answer: `y = ${yEq}`, accept: [yEq, `y = (${tSolved})^2 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}(${tSolved}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}`], hint: `$y = (${tSolved})^2 ${b >= 0 ? "+" : "-"} ${Math.abs(b)}(${tSolved}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$ — expand the square, then collect like terms.` },
    ],
    finalAnswer: { value: `y = ${yEq}`, unit: "" },
    solutionNarrative: `At $t = ${t0}$ the point is $(${px}, ${py})$. Since $t = ${tSolved}$, substituting gives $y = ${yEq}$ — a parabola. (Check: $x = ${px}$ gives $y = ${py}$.)`,
  };
};

// ============================================================================
// Concept: parametric-slope
// ============================================================================

// d1: dy/dx = (dy/dt)/(dx/dt) evaluated at a specific t (fraction).
fill["c2p-param-slope-1"] = (rng, idx) => {
  let a, c, d, t0;
  do {
    a = rng.int(2, 4); c = rng.int(-3, 3); d = rng.int(-3, 3); t0 = rng.int(1, 3);
  } while (2 * t0 + c === 0);
  const num = 2 * t0 + c;
  const slope = frac(num, a);
  const ys = disp([[1, 2], [c, 1], [d, 0]]);
  return {
    id: `gen.c2p-param-slope-1.${idx}`, generated: true, concepts: ["parametric-slope"], difficulty: 1, context: "abstract",
    prompt: `Find the slope $\\dfrac{dy}{dx}$ of the parametric curve $x = ${lin(a, rng.int(-3, 3), "t")}$, $y = ${ys}$ at $t = ${t0}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{dx}{dt}$ (a constant here).`, answer: `${a}`, accept: [], hint: `The derivative of $${a}t$ plus a constant is just $${a}$.` },
      { instruction: `Compute $\\dfrac{dy}{dt}$ as a function of $t$.`, answer: disp([[2, 1], [c, 0]]), accept: [], hint: `Power rule on $t^2$, then the linear and constant terms.` },
      { instruction: `Evaluate $\\dfrac{dy}{dx} = \\dfrac{dy/dt}{dx/dt}$ at $t = ${t0}$. Give a fraction or decimal.`, answer: slope, accept: [rnd(num / a, 2)], hint: `$\\dfrac{2(${t0}) ${c >= 0 ? "+" : "-"} ${Math.abs(c)}}{${a}}$.` },
    ],
    finalAnswer: { value: slope, unit: "" },
    solutionNarrative: `$dy/dt = ${disp([[2, 1], [c, 0]])}$ and $dx/dt = ${a}$, so at $t = ${t0}$ the slope is $\\frac{${num}}{${a}} = ${slope}$.`,
  };
};

// d2: horizontal tangents — dy/dt = 3t^2 - 3m^2 = 0 gives INTEGER roots t = ±m.
fill["c2p-param-slope-2"] = (rng, idx) => {
  const m = rng.int(1, 3);
  const a = rng.int(2, 4);
  const c = rng.int(-4, 4);
  const k = 3 * m * m;
  const ys = c === 0 ? `t^3 - ${k}t` : `t^3 - ${k}t ${c > 0 ? "+" : "-"} ${Math.abs(c)}`;
  return {
    id: `gen.c2p-param-slope-2.${idx}`, generated: true, concepts: ["parametric-slope"], difficulty: 2, context: "abstract",
    prompt: `Find all values of $t$ where the parametric curve $x = ${a}t$, $y = ${ys}$ has a horizontal tangent line.`,
    steps: [
      { instruction: `Compute $\\dfrac{dy}{dt}$.`, answer: `3t^2 - ${k}`, accept: [`3(t^2 - ${m * m})`], hint: `Power rule term by term; the constant drops out.` },
      { instruction: `A horizontal tangent needs $\\dfrac{dy}{dt} = 0$ (with $dx/dt \\neq 0$). Solve $3t^2 - ${k} = 0$ for ALL values of $t$.`, answer: `t = -${m}, t = ${m}`, accept: [`-${m}, ${m}`, `${m}, -${m}`, `t = ${m}, t = -${m}`], form: "solutions", hint: `$t^2 = ${m * m}$ has two roots — don't forget the negative one.` },
      { instruction: `Confirm the tangent really is horizontal there: what is $\\dfrac{dx}{dt}$ (a nonzero constant)?`, answer: `${a}`, accept: [], hint: `$x = ${a}t$ differentiates to a constant.` },
    ],
    finalAnswer: { value: `t = -${m}, t = ${m}`, unit: "" },
    solutionNarrative: `$dy/dt = 3t^2 - ${k} = 0$ at $t = \\pm ${m}$, and $dx/dt = ${a} \\neq 0$ everywhere, so the curve has horizontal tangents at $t = -${m}$ and $t = ${m}$.`,
  };
};

// d3: tangent line at a point — x = t^2 + c, y = t^3 + d at even t0, so the
// slope 3t0/2 is an integer and the tangent line is an integer polynomial.
fill["c2p-param-slope-3"] = (rng, idx) => {
  const t0 = rng.pick([-2, 2, 4]);
  const c = rng.int(-3, 3), d = rng.int(-3, 3);
  const x0 = t0 * t0 + c, y0 = t0 * t0 * t0 + d;
  const dy0 = 3 * t0 * t0, dx0 = 2 * t0;
  const m = (3 * t0) / 2; // integer since t0 is even
  const k = y0 - m * x0;
  const tan = lin(m, k, "x");
  return {
    id: `gen.c2p-param-slope-3.${idx}`, generated: true, concepts: ["parametric-slope"], difficulty: 3, context: "abstract",
    prompt: `Find the equation of the tangent line to the curve $x = ${disp([[1, 2], [c, 0]])}$, $y = ${disp([[1, 3], [d, 0]])}$ at $t = ${t0}$.`,
    steps: [
      { instruction: `Find the point of tangency $(x, y)$ at $t = ${t0}$.`, answer: `(${x0}, ${y0})`, accept: [`${x0}, ${y0}`, `(${x0},${y0})`], hint: `$x = (${t0})^2 ${c >= 0 ? "+" : "-"} ${Math.abs(c)}$, $y = (${t0})^3 ${d >= 0 ? "+" : "-"} ${Math.abs(d)}$.` },
      { instruction: `Evaluate $\\dfrac{dy}{dt}$ at $t = ${t0}$.`, answer: `${dy0}`, accept: [], hint: `$dy/dt = 3t^2$, so $3(${t0})^2$.` },
      { instruction: `Evaluate $\\dfrac{dx}{dt}$ at $t = ${t0}$.`, answer: `${dx0}`, accept: [], hint: `$dx/dt = 2t$ — nonzero here, so the slope is defined.` },
      { instruction: `Compute the slope $\\dfrac{dy}{dx} = \\dfrac{dy/dt}{dx/dt}$ at $t = ${t0}$.`, answer: `${m}`, accept: [frac(dy0, dx0)], hint: `$\\dfrac{${dy0}}{${dx0}}$ reduces to an integer.` },
      { instruction: `Write the tangent line in the form y = mx + b, using the point $(${x0}, ${y0})$.`, answer: `y = ${tan}`, accept: [tan, `y = ${m}(${lin(1, -x0, "x")}) ${y0 >= 0 ? "+" : "-"} ${Math.abs(y0)}`], hint: `Point–slope: $y = ${m}(x ${x0 >= 0 ? "-" : "+"} ${Math.abs(x0)}) ${y0 >= 0 ? "+" : "-"} ${Math.abs(y0)}$, then expand.` },
    ],
    finalAnswer: { value: `y = ${tan}`, unit: "" },
    solutionNarrative: `The point is $(${x0}, ${y0})$; the slope is $\\frac{3(${t0})^2}{2(${t0})} = ${m}$. Point–slope form expands to $y = ${tan}$.`,
  };
};

// ============================================================================
// Concept: parametric-arc-length
// ============================================================================

// d1: straight line — (dx/dt, dy/dt) is a Pythagorean pair, so the speed is a
// whole number and the length is speed × time.
fill["c2p-arc-length-1"] = (rng, idx) => {
  const [a, c, h] = rng.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13]]);
  const s = rng.pick([1, -1]);
  const b = rng.int(-5, 5), d = rng.int(-5, 5);
  const T = rng.int(2, 5);
  const sum = a * a + c * c;
  return {
    id: `gen.c2p-arc-length-1.${idx}`, generated: true, concepts: ["parametric-arc-length"], difficulty: 1, context: "abstract",
    prompt: `Find the length of the parametric line $x = ${lin(a, b, "t")}$, $y = ${lin(s * c, d, "t")}$ for $0 \\le t \\le ${T}$, using $L = \\displaystyle\\int_0^{${T}} \\sqrt{\\left(\\tfrac{dx}{dt}\\right)^2 + \\left(\\tfrac{dy}{dt}\\right)^2}\\,dt$.`,
    steps: [
      { instruction: `Compute $\\left(\\dfrac{dx}{dt}\\right)^2 + \\left(\\dfrac{dy}{dt}\\right)^2$ (a constant here).`, answer: `${sum}`, accept: [`${a}^2 + ${s * c}^2`], hint: `$dx/dt = ${a}$ and $dy/dt = ${s * c}$; square each and add — squaring kills the sign.` },
      { instruction: `Take the square root to get the integrand (the speed).`, answer: `${h}`, accept: [`sqrt(${sum})`], hint: `$${sum} = ${h}^2$ — a Pythagorean triple.` },
      { instruction: `Integrate the constant speed from $0$ to $${T}$ to get the length.`, answer: `${h * T}`, accept: [], hint: `$\\int_0^{${T}} ${h}\\,dt = ${h} \\cdot ${T}$.` },
    ],
    finalAnswer: { value: `${h * T}`, unit: "" },
    solutionNarrative: `The velocity components are constant: $\\sqrt{${a}^2 + ${c}^2} = ${h}$, so the point moves at constant speed $${h}$ and covers $${h} \\times ${T} = ${h * T}$ units of arc length.`,
  };
};

// d2: x = t, y = (2/3)t^{3/2} — integrand 1 + t; limits k^2 - 1 make the
// antiderivative (2/3)(1+t)^{3/2} evaluate to perfect cubes.
fill["c2p-arc-length-2"] = (rng, idx) => {
  const j = rng.pick([1, 1, 1, 2]);
  const k = rng.int(j + 1, 5);
  const t1 = j * j - 1, t2 = k * k - 1;
  const Lnum = 2 * (k * k * k - j * j * j);
  const L = frac(Lnum, 3);
  return {
    id: `gen.c2p-arc-length-2.${idx}`, generated: true, concepts: ["parametric-arc-length"], difficulty: 2, context: "abstract",
    prompt: `Find the arc length of $x = t$, $y = \\dfrac{2}{3}t^{3/2}$ for $${t1} \\le t \\le ${t2}$.`,
    steps: [
      { instruction: `Compute $\\left(\\dfrac{dx}{dt}\\right)^2 + \\left(\\dfrac{dy}{dt}\\right)^2$ as a function of $t$.`, answer: `1 + t`, accept: [`t + 1`], hint: `$dx/dt = 1$ and $dy/dt = t^{1/2}$, whose square is just $t$.` },
      { instruction: `So $L = \\displaystyle\\int_{${t1}}^{${t2}} \\sqrt{1 + t}\\,dt$ with antiderivative $\\tfrac{2}{3}(1+t)^{3/2}$. Evaluate $(1 + t)^{3/2}$ at the UPPER limit $t = ${t2}$.`, answer: `${k * k * k}`, accept: [`${k}^3`], hint: `$1 + ${t2} = ${k * k} = ${k}^2$, and $(${k}^2)^{3/2} = ${k}^3$.` },
      { instruction: `Evaluate $(1 + t)^{3/2}$ at the LOWER limit $t = ${t1}$.`, answer: `${j * j * j}`, accept: [`${j}^3`], hint: `$1 + ${t1} = ${j * j}$, and $(${j * j})^{3/2} = ${j * j * j}$.` },
      { instruction: `Compute $L = \\dfrac{2}{3}\\left(${k * k * k} - ${j * j * j}\\right)$. Give a fraction or decimal.`, answer: L, accept: [rnd(Lnum / 3, 2)], hint: `Multiply the difference by $\\tfrac{2}{3}$.` },
    ],
    finalAnswer: { value: L, unit: "" },
    solutionNarrative: `The integrand simplifies to $\\sqrt{1+t}$ exactly, and the limits were chosen so $1 + t$ is a perfect square at both ends: $L = \\tfrac{2}{3}(${k}^3 - ${j}^3) = ${L}$.`,
  };
};

// d3: x = a(t - t^3/3), y = a t^2 — integrand a^2(1+t^2)^2, a perfect square.
fill["c2p-arc-length-3"] = (rng, idx) => {
  const a = rng.pick([1, 3]);
  const T = rng.int(1, 3);
  const e = rng.int(-3, 3);
  const xs = a === 1 ? "t - \\dfrac{t^3}{3}" : "3t - t^3";
  const ys = disp([[a, 2], [e, 0]]);
  const dxAns = a === 1 ? "1 - t^2" : "3 - 3t^2";
  const sumAns = disp([[a * a, 4], [2 * a * a, 2], [a * a, 0]]);
  const sqrtAns = a === 1 ? "1 + t^2" : "3 + 3t^2";
  const Lnum = a * (3 * T + T * T * T);
  const L = frac(Lnum, 3);
  return {
    id: `gen.c2p-arc-length-3.${idx}`, generated: true, concepts: ["parametric-arc-length"], difficulty: 3, context: "abstract",
    prompt: `Find the arc length of $x = ${xs}$, $y = ${ys}$ for $0 \\le t \\le ${T}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{dx}{dt}$.`, answer: dxAns, accept: [a === 1 ? "-(t^2 - 1)" : `3(1 - t^2)`], hint: `Differentiate term by term: the cubic term's derivative is $${a}t^2$ with a minus sign.` },
      { instruction: `Compute $\\dfrac{dy}{dt}$.`, answer: `${2 * a}t`, accept: [], hint: `Power rule on $${a === 1 ? "" : a}t^2$; the constant drops out.` },
      { instruction: `Expand $\\left(\\dfrac{dx}{dt}\\right)^2 + \\left(\\dfrac{dy}{dt}\\right)^2$ fully as a polynomial in $t$.`, answer: sumAns, accept: [`${a * a === 1 ? "" : a * a}(1 + t^2)^2`, `(${sqrtAns})^2`], hint: `$(${dxAns})^2 + (${2 * a}t)^2$ — the cross terms combine: $-2t^2 + 4t^2 = +2t^2$ (times $${a * a}$).` },
      { instruction: `That polynomial is a perfect square. Write its square root (valid for all $t$).`, answer: sqrtAns, accept: [a === 1 ? "(1 + t^2)" : "3(1 + t^2)"], hint: `$${sumAns} = (${sqrtAns})^2$.` },
      { instruction: `Integrate: $L = \\displaystyle\\int_0^{${T}} \\left(${sqrtAns}\\right)dt$. Give a fraction or decimal.`, answer: L, accept: [rnd(Lnum / 3, 2)], hint: `$\\left[${a}t + ${a === 1 ? "\\tfrac{t^3}{3}" : "t^3"}\\right]_0^{${T}}$.` },
    ],
    finalAnswer: { value: L, unit: "" },
    solutionNarrative: `This curve is engineered so the integrand collapses: $(${dxAns})^2 + (${2 * a}t)^2 = ${a * a === 1 ? "" : a * a}(1 + t^2)^2$, so $L = \\int_0^{${T}} (${sqrtAns})\\,dt = ${L}$ — no numerical approximation needed.`,
  };
};

// ============================================================================
// Concept: polar-area
// ============================================================================

// d1: circle r = a over a full/half/quarter sweep — A = (1/2) a^2 Δθ.
fill["c2p-polar-area-1"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const portion = rng.pick([
    { label: "the full circle, $0 \\le \\theta \\le 2\\pi$", dth: "2pi", dthAcc: ["2*pi", "6.28"], den: 1 },
    { label: "the upper half, $0 \\le \\theta \\le \\pi$", dth: "pi", dthAcc: ["3.14"], den: 2 },
    { label: "the first-quadrant quarter, $0 \\le \\theta \\le \\pi/2$", dth: "pi/2", dthAcc: ["pi/2", "1.57"], den: 4 },
  ]);
  const A = piFrac(a * a, portion.den);
  return {
    id: `gen.c2p-polar-area-1.${idx}`, generated: true, concepts: ["polar-area"], difficulty: 1, context: "abstract",
    prompt: `Use $A = \\dfrac{1}{2}\\displaystyle\\int r^2\\,d\\theta$ to find the area swept by the circle $r = ${a}$ over ${portion.label}.`,
    steps: [
      { instruction: `What is $r^2$ (a constant here)?`, answer: `${a * a}`, accept: [`${a}^2`], hint: `$r = ${a}$ for every $\\theta$.` },
      { instruction: `How wide is the $\\theta$-interval? (Type it like ${portion.dth}.)`, answer: portion.dth, accept: portion.dthAcc, hint: `Upper limit minus lower limit.` },
      { instruction: `Compute $A = \\dfrac{1}{2} \\cdot ${a * a} \\cdot \\Delta\\theta$. (Type it like ${A}.)`, answer: A, accept: piAccepts(a * a, portion.den), hint: `Half of $${a * a}$ times the sweep angle.` },
    ],
    finalAnswer: { value: A, unit: "" },
    solutionNarrative: `A constant radius makes the integral a sector formula: $A = \\tfrac{1}{2}r^2\\Delta\\theta = \\tfrac{1}{2}(${a * a})\\Delta\\theta = ${A}$. (For the full sweep this is the familiar $\\pi r^2$.)`,
  };
};

// d2: circle r = 2a cos θ (or sin) — traced ONCE over the stated interval.
fill["c2p-polar-area-2"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const useCos = rng.pick([true, false]);
  const fn = useCos ? "\\cos" : "\\sin";
  const interval = useCos ? "-\\pi/2 \\le \\theta \\le \\pi/2" : "0 \\le \\theta \\le \\pi";
  const center = useCos ? `(${a}, 0)` : `(0, ${a})`;
  const centerAcc = useCos ? [`${a}, 0`, `(${a},0)`] : [`0, ${a}`, `(0,${a})`];
  const A = piFrac(a * a, 1);
  return {
    id: `gen.c2p-polar-area-2.${idx}`, generated: true, concepts: ["polar-area"], difficulty: 2, context: "abstract",
    prompt: `The polar curve $r = ${2 * a}${fn}\\theta$ is a circle, traced exactly once over $${interval}$. Find the enclosed area with $A = \\dfrac{1}{2}\\displaystyle\\int r^2\\,d\\theta$, and check it against geometry.`,
    steps: [
      { instruction: `The curve $r = 2a${fn}\\theta$ is a circle of radius $a$. What is the radius here?`, answer: `${a}`, accept: [], hint: `Half the coefficient: $${2 * a} = 2a$ gives $a = ${a}$.` },
      { instruction: `What is the circle's center $(x, y)$?`, answer: center, accept: centerAcc, hint: useCos ? `A cosine circle sits on the positive $x$-axis, tangent to the pole.` : `A sine circle sits on the positive $y$-axis, tangent to the pole.` },
      { instruction: `The key integral: what is $\\displaystyle\\int ${fn}^2\\theta\\,d\\theta$ over the stated interval? (Type it like pi/2.)`, answer: "pi/2", accept: ["1.57"], hint: `Over a half-period, $${fn}^2$ averages $\\tfrac{1}{2}$, and the interval has width $\\pi$: $\\tfrac{1}{2}\\pi$.` },
      { instruction: `So $A = \\dfrac{1}{2}(${2 * a})^2 \\cdot \\dfrac{\\pi}{2}$. Compute the area. (Type it like ${A}.)`, answer: A, accept: piAccepts(a * a, 1), hint: `$\\tfrac{1}{2} \\cdot ${4 * a * a} \\cdot \\tfrac{\\pi}{2} = ${a * a}\\pi$ — matching $\\pi r^2$ with $r = ${a}$.` },
    ],
    finalAnswer: { value: A, unit: "" },
    solutionNarrative: `$A = \\tfrac{1}{2}\\int ${2 * a === 2 ? "4" : (2 * a) * (2 * a)}${fn}^2\\theta\\,d\\theta = ${a * a}\\pi$, which agrees with $\\pi r^2$ for radius $${a}$. Integrating over all of $[0, 2\\pi]$ would trace the circle TWICE and double the answer — the classic polar-area trap.`,
  };
};

// d3: cardioid r = a(1 + cos θ) over [0, 2π] — A = 3πa²/2.
fill["c2p-polar-area-3"] = (rng, idx) => {
  const a = rng.int(1, 4);
  const A = piFrac(3 * a * a, 2);
  return {
    id: `gen.c2p-polar-area-3.${idx}`, generated: true, concepts: ["polar-area"], difficulty: 3, context: "abstract",
    prompt: `Find the area enclosed by the cardioid $r = ${a} + ${a}\\cos\\theta$ (one full trace, $0 \\le \\theta \\le 2\\pi$).`,
    steps: [
      { instruction: `You will need $\\displaystyle\\int_0^{2\\pi} \\cos^2\\theta\\,d\\theta$. What is it? (Type it like pi.)`, answer: "pi", accept: ["3.14"], hint: `$\\cos^2\\theta$ averages $\\tfrac{1}{2}$ over a full period, and the interval has width $2\\pi$.` },
      { instruction: `Expand $(1 + \\cos\\theta)^2 = 1 + 2\\cos\\theta + \\cos^2\\theta$ and integrate over $[0, 2\\pi]$: the middle term integrates to 0. What is $\\displaystyle\\int_0^{2\\pi} (1 + \\cos\\theta)^2\\,d\\theta$?`, answer: "3pi", accept: ["3*pi", "9.42"], hint: `$2\\pi + 0 + \\pi = 3\\pi$.` },
      { instruction: `Since $r^2 = ${a * a}(1 + \\cos\\theta)^2$, compute $A = \\dfrac{1}{2} \\cdot ${a * a} \\cdot 3\\pi$. (Type it like ${A}.)`, answer: A, accept: piAccepts(3 * a * a, 2), hint: `Half of $${3 * a * a}\\pi$.` },
    ],
    finalAnswer: { value: A, unit: "" },
    solutionNarrative: `Expanding $r^2$ gives three pieces: the constant contributes $2\\pi$, the $\\cos\\theta$ term contributes 0 over a full period, and $\\cos^2\\theta$ contributes $\\pi$. So $A = \\tfrac{1}{2}(${a * a})(3\\pi) = ${A}$ — the known cardioid area $\\tfrac{3\\pi a^2}{2}$ with $a = ${a}$.`,
  };
};
