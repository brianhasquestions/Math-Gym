// gen-calc13b-fill.js
// Parametric generators for two wave-14 curriculum-gap topics:
//   calculus-3.polar-cylindrical-spherical   (prefix c3q-)
//   calculus-1.mean-value-theorem            (prefix c1m-)
// One template per (concept, difficulty) tier — 12 per topic, 24 total.
// Self-contained: no imports. Every answer is computed in-pack from the SAME
// randomized numbers shown in the prompt. All final integral values are numbers
// or pi/sqrt numeric expressions the grader's evalNumeric can verify.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

// Reduced fraction string: frac(8, 2) -> "4", frac(9, 2) -> "9/2".
const frac = (n, d) => {
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  if (d < 0) { n = -n; d = -d; }
  return d === 1 ? `${n}` : `${n}/${d}`;
};

// pi-expression answer + accepted variants for (num/den) * pi, reduced.
// piExpr(8, 2) -> { ans: "4*pi", accepts: ["4pi", "12.5664"] }
const piExpr = (num, den) => {
  const g = gcd(num, den) || 1;
  num /= g; den /= g;
  const ans = den === 1 ? `${num}*pi` : `${num}*pi/${den}`;
  const compact = den === 1 ? `${num}pi` : `${num}pi/${den}`;
  const dec = ((num / den) * Math.PI).toFixed(4);
  return { ans, accepts: [compact, dec], tex: den === 1 ? `${num}\\pi` : `\\tfrac{${num}\\pi}{${den}}` };
};

// ===========================================================================
export const fill = {};

// ===========================================================================
// calculus-3.polar-cylindrical-spherical
// Concepts: polar-double-integrals, converting-coordinates,
//           cylindrical-integrals, spherical-integrals
// ===========================================================================

// --- polar-double-integrals ---

// d1: area of a disk r <= R via the polar double integral.
fill["c3q-polar-1"] = (rng, idx) => {
  const R = rng.int(2, 6);
  const inner = frac(R * R, 2);
  const total = piExpr(R * R, 1);
  return {
    id: `gen.c3q-polar-1.${idx}`, generated: true, concepts: ["polar-double-integrals"], difficulty: 1, context: "abstract",
    prompt: `Compute the area of the disk $r \\le ${R}$ using $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${R}} r\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `Do the inner integral $\\int_0^{${R}} r\\,dr$.`, answer: inner, accept: [(R * R / 2).toString()], hint: `$\\tfrac{r^2}{2}$ evaluated from 0 to ${R}.` },
      { instruction: `Multiply by the $\\theta$-integral $\\int_0^{2\\pi} d\\theta = 2\\pi$. (Type it like ${R * R}pi.)`, answer: total.ans, accept: total.accepts, hint: `$\\tfrac{${R * R}}{2} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `Inner: $\\int_0^{${R}} r\\,dr = ${inner}$; times $2\\pi$ gives $${total.tex}$ — the familiar $\\pi R^2$.`,
  };
};

// d2: area of an annulus a <= r <= b.
fill["c3q-polar-2"] = (rng, idx) => {
  let a, b;
  do { a = rng.int(1, 4); b = rng.int(2, 5); } while (b <= a);
  const innerVal = (b * b - a * a);
  const inner = frac(innerVal, 2);
  const total = piExpr(innerVal, 1);
  return {
    id: `gen.c3q-polar-2.${idx}`, generated: true, concepts: ["polar-double-integrals"], difficulty: 2, context: "abstract",
    prompt: `Find the area of the annulus $${a} \\le r \\le ${b}$ via $\\displaystyle\\int_0^{2\\pi}\\!\\int_{${a}}^{${b}} r\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `Inner integral: $\\int_{${a}}^{${b}} r\\,dr = \\tfrac{r^2}{2}\\big|_{${a}}^{${b}}$.`, answer: inner, accept: [(innerVal / 2).toString()], hint: `$\\tfrac{${b * b}}{2} - \\tfrac{${a * a}}{2}$.` },
      { instruction: `Multiply by $2\\pi$. (Type it like ${innerVal}pi.)`, answer: total.ans, accept: total.accepts, hint: `$${inner} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `$\\int_{${a}}^{${b}} r\\,dr = ${inner}$, so the area is $${total.tex} = \\pi(${b}^2 - ${a}^2)$.`,
  };
};

// d3: volume under the paraboloid z = a^2 - r^2 over the disk r <= a.
fill["c3q-polar-3"] = (rng, idx) => {
  const a = rng.pick([2, 3, 4]);
  const aa = a * a, a4 = aa * aa;
  const integrand = `${aa}r - r^3`;
  const innerVal = frac(a4, 4);
  const total = piExpr(a4, 2);
  return {
    id: `gen.c3q-polar-3.${idx}`, generated: true, concepts: ["polar-double-integrals"], difficulty: 3, context: "abstract",
    prompt: `Find the volume under the paraboloid $z = ${aa} - r^2$ over the disk $r \\le ${a}$: $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${a}} (${aa} - r^2)\\,r\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `Expand the inner integrand $(${aa} - r^2)\\,r$ as a polynomial in $r$.`, answer: integrand, accept: [`${aa}*r - r^3`, `-r^3 + ${aa}r`], hint: `Distribute the Jacobian factor $r$.` },
      { instruction: `Compute the inner integral $\\int_0^{${a}} (${aa}r - r^3)\\,dr$.`, answer: innerVal, accept: [(a4 / 4).toString()], hint: `$\\tfrac{${aa}r^2}{2} - \\tfrac{r^4}{4}$ from 0 to ${a} is $\\tfrac{${a4}}{2} - \\tfrac{${a4}}{4}$.` },
      { instruction: `Multiply by $2\\pi$. (Type it like 8pi.)`, answer: total.ans, accept: total.accepts, hint: `$${innerVal} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `The integrand times the Jacobian is $${aa}r - r^3$; its integral over $[0, ${a}]$ is $${innerVal}$, and the $\\theta$-lap contributes $2\\pi$, giving $${total.tex}$.`,
  };
};

// --- converting-coordinates ---

// d1: circle x^2 + y^2 = k^2 -> r = k, plus the enclosed area.
fill["c3q-convert-1"] = (rng, idx) => {
  const k = rng.int(2, 9);
  const area = piExpr(k * k, 1);
  return {
    id: `gen.c3q-convert-1.${idx}`, generated: true, concepts: ["converting-coordinates"], difficulty: 1, context: "abstract",
    prompt: `Convert the circle $x^2 + y^2 = ${k * k}$ to a polar equation, then give the area it encloses.`,
    steps: [
      { instruction: `Use $x^2 + y^2 = r^2$: solve $r^2 = ${k * k}$ for $r$ (radii are nonnegative).`, answer: `r = ${k}`, accept: [`${k}`, `r=${k}`], hint: `Take the positive square root.` },
      { instruction: `The enclosed disk $r \\le ${k}$ has area $\\pi r^2$. (Type it like ${k * k}pi.)`, answer: area.ans, accept: area.accepts, hint: `$\\pi \\cdot ${k}^2$.` },
    ],
    finalAnswer: { value: `r = ${k}`, unit: "" },
    solutionNarrative: `$x^2 + y^2 = r^2$ turns the circle into $r = ${k}$, a constant-$r$ curve; the disk inside has area $${area.tex}$.`,
  };
};

// d2: convert a Cartesian point (+-a, +-a) to polar (r, theta in degrees).
fill["c3q-convert-2"] = (rng, idx) => {
  const a = rng.int(2, 6);
  const quad = rng.pick([
    { sx: 1, sy: 1, deg: 45, desc: "first" },
    { sx: -1, sy: 1, deg: 135, desc: "second" },
    { sx: -1, sy: -1, deg: 225, desc: "third" },
    { sx: 1, sy: -1, deg: 315, desc: "fourth" },
  ]);
  const x = quad.sx * a, y = quad.sy * a;
  const rDec = (a * Math.SQRT2).toFixed(4);
  return {
    id: `gen.c3q-convert-2.${idx}`, generated: true, concepts: ["converting-coordinates"], difficulty: 2, context: "abstract",
    prompt: `Convert the Cartesian point $(${x}, ${y})$ to polar coordinates $(r, \\theta)$ with $\\theta$ in degrees, $0 \\le \\theta < 360$.`,
    steps: [
      { instruction: `Compute $r = \\sqrt{x^2 + y^2}$. (Type it like ${a}*sqrt(2).)`, answer: `${a}*sqrt(2)`, accept: [`sqrt(${2 * a * a})`, rDec], hint: `$\\sqrt{${a * a} + ${a * a}} = \\sqrt{${2 * a * a}}$.` },
      { instruction: `The point lies on the line $y = ${quad.sx * quad.sy === 1 ? "x" : "-x"}$ in the ${quad.desc} quadrant. What is $\\theta$ in degrees?`, answer: `${quad.deg}`, accept: [], hint: `The reference angle is $45^\\circ$; place it in the ${quad.desc} quadrant.` },
    ],
    finalAnswer: { value: `(${a}sqrt(2), ${quad.deg} degrees)`, unit: "" },
    solutionNarrative: `$r = \\sqrt{${2 * a * a}} = ${a}\\sqrt{2}$ and the ${quad.desc}-quadrant angle on the diagonal is $\\theta = ${quad.deg}^\\circ$.`,
  };
};

// d3: convert and evaluate a Cartesian integral of (x^2+y^2) over a disk.
fill["c3q-convert-3"] = (rng, idx) => {
  const R = rng.pick([1, 2, 3]);
  const R4 = R ** 4;
  const innerVal = frac(R4, 4);
  const total = piExpr(R4, 2);
  return {
    id: `gen.c3q-convert-3.${idx}`, generated: true, concepts: ["converting-coordinates"], difficulty: 3, context: "abstract",
    prompt: `Convert $\\displaystyle\\iint_{x^2 + y^2 \\le ${R * R}} (x^2 + y^2)\\,dA$ to polar coordinates and evaluate it.`,
    steps: [
      { instruction: `Rewrite the integrand $x^2 + y^2$ in polar (a power of $r$).`, answer: "r^2", accept: ["r*r"], hint: `That is the dictionary identity itself.` },
      { instruction: `Append the Jacobian: the full inner integrand $r^2 \\cdot r$ is what power of $r$?`, answer: "r^3", accept: [], hint: `Integrand times the area-element factor $r$.` },
      { instruction: `Compute $\\int_0^{${R}} r^3\\,dr$.`, answer: innerVal, accept: [(R4 / 4).toString()], hint: `$\\tfrac{r^4}{4}\\big|_0^{${R}}$.` },
      { instruction: `Multiply by $2\\pi$. (Type it like 8pi.)`, answer: total.ans, accept: total.accepts, hint: `$${innerVal} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `The integrand becomes $r^2$, the Jacobian adds one more $r$, and $2\\pi\\int_0^{${R}} r^3\\,dr = 2\\pi \\cdot ${innerVal} = ${total.tex}$.`,
  };
};

// --- cylindrical-integrals ---

// d1: volume of a cylinder r <= R, 0 <= z <= h.
fill["c3q-cyl-1"] = (rng, idx) => {
  const R = rng.int(2, 4), h = rng.int(2, 6);
  const rInt = frac(h * R * R, 2);
  const total = piExpr(R * R * h, 1);
  return {
    id: `gen.c3q-cyl-1.${idx}`, generated: true, concepts: ["cylindrical-integrals"], difficulty: 1, context: "abstract",
    prompt: `Compute the volume of the cylinder $r \\le ${R}$, $0 \\le z \\le ${h}$ via $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${R}}\\!\\int_0^{${h}} r\\,dz\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `The inner $z$-integral gives $\\int_0^{${h}} r\\,dz = ${h}r$. Now compute $\\int_0^{${R}} ${h}r\\,dr$.`, answer: rInt, accept: [(h * R * R / 2).toString()], hint: `$\\tfrac{${h}r^2}{2}\\big|_0^{${R}}$.` },
      { instruction: `Multiply by $2\\pi$. (Type it like ${R * R * h}pi.)`, answer: total.ans, accept: total.accepts, hint: `$${rInt} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `Layer by layer: $${h}r$, then $${rInt}$, then $${total.tex}$ — matching $\\pi R^2 h = \\pi \\cdot ${R * R} \\cdot ${h}$.`,
  };
};

// d2: solid inside r <= R below the cone z = c*r.
fill["c3q-cyl-2"] = (rng, idx) => {
  const R = rng.pick([2, 3]), c = rng.int(1, 3);
  const zInt = c === 1 ? "r^2" : `${c}r^2`;
  const rIntVal = frac(c * R ** 3, 3);
  const total = piExpr(2 * c * R ** 3, 3);
  return {
    id: `gen.c3q-cyl-2.${idx}`, generated: true, concepts: ["cylindrical-integrals"], difficulty: 2, context: "abstract",
    prompt: `Find the volume of the solid inside $r \\le ${R}$ bounded below by $z = 0$ and above by the cone $z = ${c === 1 ? "" : c}r$: $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${R}}\\!\\int_0^{${c === 1 ? "" : c}r} r\\,dz\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `Do the $z$-integral $\\int_0^{${c === 1 ? "" : c}r} r\\,dz$ (a term in $r$).`, answer: zInt, accept: c === 1 ? ["r*r"] : [`${c}*r^2`], hint: `The integrand $r$ is constant in $z$; the interval has length $${c === 1 ? "" : c}r$.` },
      { instruction: `Compute $\\int_0^{${R}} ${zInt}\\,dr$.`, answer: rIntVal, accept: [String(c * R ** 3 / 3)], hint: `$\\tfrac{${c}r^3}{3}\\big|_0^{${R}}$.` },
      { instruction: `Multiply by $2\\pi$. (Type it like 18pi.)`, answer: total.ans, accept: total.accepts, hint: `$${rIntVal} \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `The $z$-layer contributes a factor $${c === 1 ? "" : c}r$, making the integrand $${zInt}$; then $\\int_0^{${R}} ${zInt}\\,dr = ${rIntVal}$ and the volume is $${total.tex}$.`,
  };
};

// d3: mass of a cylinder with density z (denser near the top).
fill["c3q-cyl-3"] = (rng, idx) => {
  const R = rng.int(2, 3), h = rng.pick([2, 4]);
  const zFac = frac(h * h, 2);
  const rFac = frac(R * R, 2);
  const total = piExpr(h * h * R * R, 2);
  return {
    id: `gen.c3q-cyl-3.${idx}`, generated: true, concepts: ["cylindrical-integrals"], difficulty: 3, context: "applied",
    prompt: `A cylindrical tank ($r \\le ${R}$, $0 \\le z \\le ${h}$, meters) holds sediment of density $\\delta = z$ kg/m³. Compute its total mass $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${R}}\\!\\int_0^{${h}} z\\,r\\,dz\\,dr\\,d\\theta$.`,
    steps: [
      { instruction: `Compute the $z$-factor $\\int_0^{${h}} z\\,dz$.`, answer: zFac, accept: [(h * h / 2).toString()], hint: `$\\tfrac{z^2}{2}\\big|_0^{${h}}$.` },
      { instruction: `Compute the $r$-factor $\\int_0^{${R}} r\\,dr$.`, answer: rFac, accept: [(R * R / 2).toString()], hint: `$\\tfrac{r^2}{2}\\big|_0^{${R}}$.` },
      { instruction: `Multiply the three factors: $${zFac} \\cdot ${rFac} \\cdot 2\\pi$. (Type it like 18pi.)`, answer: total.ans, accept: total.accepts, hint: `Constant bounds let the triple integral factor into a product.` },
    ],
    finalAnswer: { value: total.ans, unit: "kg" },
    solutionNarrative: `The bounds are constants, so the integral factors: $${zFac} \\cdot ${rFac} \\cdot 2\\pi = ${total.tex}$ kg.`,
  };
};

// --- spherical-integrals ---

// d1: volume of a ball of radius a.
fill["c3q-sph-1"] = (rng, idx) => {
  const a = rng.pick([1, 2, 3]);
  const rhoFac = frac(a ** 3, 3);
  const total = piExpr(4 * a ** 3, 3);
  return {
    id: `gen.c3q-sph-1.${idx}`, generated: true, concepts: ["spherical-integrals"], difficulty: 1, context: "abstract",
    prompt: `Compute the volume of the ball $\\rho \\le ${a}$ via $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{\\pi}\\!\\int_0^{${a}} \\rho^2 \\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$.`,
    steps: [
      { instruction: `Compute the $\\rho$-factor $\\int_0^{${a}} \\rho^2\\,d\\rho$.`, answer: rhoFac, accept: [(a ** 3 / 3).toFixed(4)], hint: `$\\tfrac{\\rho^3}{3}\\big|_0^{${a}}$.` },
      { instruction: `Compute the $\\varphi$-factor $\\int_0^{\\pi} \\sin\\varphi\\,d\\varphi$.`, answer: "2", accept: [], hint: `$-\\cos\\varphi\\big|_0^{\\pi} = 1 - (-1)$.` },
      { instruction: `Multiply the three factors: $${rhoFac} \\cdot 2 \\cdot 2\\pi$. (Type it like 36pi.)`, answer: total.ans, accept: total.accepts, hint: `Constant bounds — the triple integral is a product.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `$${rhoFac} \\cdot 2 \\cdot 2\\pi = ${total.tex}$, which is exactly $\\tfrac{4}{3}\\pi \\cdot ${a}^3$.`,
  };
};

// d2: volume of a spherical shell a <= rho <= b.
fill["c3q-sph-2"] = (rng, idx) => {
  let a, b;
  do { a = rng.int(1, 3); b = rng.int(2, 4); } while (b <= a);
  const diff = b ** 3 - a ** 3;
  const rhoFac = frac(diff, 3);
  const total = piExpr(4 * diff, 3);
  return {
    id: `gen.c3q-sph-2.${idx}`, generated: true, concepts: ["spherical-integrals"], difficulty: 2, context: "abstract",
    prompt: `Find the volume of the spherical shell $${a} \\le \\rho \\le ${b}$.`,
    steps: [
      { instruction: `Compute the $\\rho$-factor $\\int_{${a}}^{${b}} \\rho^2\\,d\\rho$.`, answer: rhoFac, accept: [(diff / 3).toFixed(4)], hint: `$\\tfrac{${b ** 3}}{3} - \\tfrac{${a ** 3}}{3}$.` },
      { instruction: `Multiply by the $\\varphi$-factor 2 and the $\\theta$-factor $2\\pi$. (Type it like 28pi/3.)`, answer: total.ans, accept: total.accepts, hint: `$${rhoFac} \\cdot 2 \\cdot 2\\pi$.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `$${rhoFac} \\cdot 2 \\cdot 2\\pi = ${total.tex}$ — the difference of ball volumes $\\tfrac{4}{3}\\pi(${b}^3 - ${a}^3)$.`,
  };
};

// d3: ice-cream cone (rho <= a, phi <= pi/3) or hemisphere (phi <= pi/2).
fill["c3q-sph-3"] = (rng, idx) => {
  const a = rng.pick([1, 2, 3]);
  const cap = rng.pick([
    { tex: "\\pi/3", name: "ice-cream cone", cosTex: "\\cos\\tfrac{\\pi}{3} = \\tfrac{1}{2}", num: 1, den: 2 },
    { tex: "\\pi/2", name: "hemisphere", cosTex: "\\cos\\tfrac{\\pi}{2} = 0", num: 1, den: 1 },
  ]);
  const rhoFac = frac(a ** 3, 3);
  const phiFac = frac(cap.num, cap.den);
  const total = piExpr(2 * a ** 3 * cap.num, 3 * cap.den);
  return {
    id: `gen.c3q-sph-3.${idx}`, generated: true, concepts: ["spherical-integrals"], difficulty: 3, context: "abstract",
    prompt: `Find the volume of the ${cap.name} $\\rho \\le ${a}$, $0 \\le \\varphi \\le ${cap.tex}$: $\\displaystyle\\int_0^{2\\pi}\\!\\int_0^{${cap.tex}}\\!\\int_0^{${a}} \\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$.`,
    steps: [
      { instruction: `Compute the $\\rho$-factor $\\int_0^{${a}} \\rho^2\\,d\\rho$.`, answer: rhoFac, accept: [(a ** 3 / 3).toFixed(4)], hint: `$\\tfrac{\\rho^3}{3}\\big|_0^{${a}}$.` },
      { instruction: `Compute the $\\varphi$-factor $\\int_0^{${cap.tex}} \\sin\\varphi\\,d\\varphi = 1 - \\cos(${cap.tex})$.`, answer: phiFac, accept: [(cap.num / cap.den).toString()], hint: `$${cap.cosTex}$.` },
      { instruction: `Multiply the three factors: $${rhoFac} \\cdot ${phiFac} \\cdot 2\\pi$. (Type it like 8pi/3.)`, answer: total.ans, accept: total.accepts, hint: `Constant bounds — the integral is a product.` },
    ],
    finalAnswer: { value: total.ans, unit: "" },
    solutionNarrative: `The factors are $${rhoFac}$, $${phiFac}$, and $2\\pi$; their product is $${total.tex}$.`,
  };
};

// ===========================================================================
// calculus-1.mean-value-theorem
// Concepts: rolles-theorem, mvt-statement, finding-c, mvt-consequences
// ===========================================================================

// --- rolles-theorem ---

// d1: f = (x-a)(x-b) expanded, on [a,b]; c is the integer midpoint.
fill["c1m-rolles-1"] = (rng, idx) => {
  const a = rng.int(0, 2);
  const b = a + 2 * rng.int(1, 3); // even width -> integer c
  const S = a + b, P = a * b;
  const fTex = `x^2 - ${S}x${P === 0 ? "" : ` + ${P}`}`;
  const c = S / 2;
  return {
    id: `gen.c1m-rolles-1.${idx}`, generated: true, concepts: ["rolles-theorem"], difficulty: 1, context: "abstract",
    prompt: `Verify Rolle's theorem for $f(x) = ${fTex}$ on $[${a}, ${b}]$ (note $f(${a}) = f(${b}) = 0$) and find the guaranteed $c$.`,
    steps: [
      { instruction: `Check one endpoint: compute $f(${a})$.`, answer: "0", accept: [], hint: `$${a}^2 - ${S} \\cdot ${a}${P === 0 ? "" : ` + ${P}`}$.` },
      { instruction: `Compute $f'(x)$.`, answer: `2x - ${S}`, accept: [`2x-${S}`], hint: `Power rule term by term.` },
      { instruction: `Solve $f'(c) = 0$ for $c$.`, answer: `${c}`, accept: [`c=${c}`, `c = ${c}`], hint: `$2c = ${S}$.` },
    ],
    finalAnswer: { value: `c = ${c}`, unit: "" },
    solutionNarrative: `$f$ vanishes at both endpoints and is a smooth polynomial, so Rolle applies; $f'(x) = 2x - ${S} = 0$ at $c = ${c} \\in (${a}, ${b})$.`,
  };
};

// d2: symmetric quadratic with equal (nonzero) endpoint values.
fill["c1m-rolles-2"] = (rng, idx) => {
  const v = rng.int(1, 5), h = rng.int(1, 3), q = rng.int(1, 9);
  const lo = v - h, hi = v + h;
  const E = lo * lo - 2 * v * lo + q; // = h^2 - v^2 + q, equals f(hi) too
  return {
    id: `gen.c1m-rolles-2.${idx}`, generated: true, concepts: ["rolles-theorem"], difficulty: 2, context: "abstract",
    prompt: `For $f(x) = x^2 - ${2 * v}x + ${q}$ on $[${lo}, ${hi}]$, confirm the endpoint values match and find the $c$ from Rolle's theorem.`,
    steps: [
      { instruction: `Compute $f(${lo})$.`, answer: `${E}`, accept: [], hint: `$${lo}^2 - ${2 * v} \\cdot ${lo < 0 ? `(${lo})` : lo} + ${q}$.` },
      { instruction: `Compute $f(${hi})$.`, answer: `${E}`, accept: [], hint: `$${hi}^2 - ${2 * v} \\cdot ${hi} + ${q}$ — it matches $f(${lo})$.` },
      { instruction: `Solve $f'(c) = 2c - ${2 * v} = 0$.`, answer: `${v}`, accept: [`c=${v}`, `c = ${v}`], hint: `The vertex of the parabola.` },
    ],
    finalAnswer: { value: `c = ${v}`, unit: "" },
    solutionNarrative: `$f(${lo}) = f(${hi}) = ${E}$; Rolle applies and $f'(x) = 2x - ${2 * v}$ vanishes at $c = ${v}$, the midpoint of the interval.`,
  };
};

// d3: cubic f = x^3 - a^2 x on [0, a]; c = a/sqrt(3).
fill["c1m-rolles-3"] = (rng, idx) => {
  const a = rng.pick([2, 3, 4, 5]);
  const aa = a * a;
  const cDec = (a / Math.sqrt(3)).toFixed(4);
  return {
    id: `gen.c1m-rolles-3.${idx}`, generated: true, concepts: ["rolles-theorem"], difficulty: 3, context: "abstract",
    prompt: `Apply Rolle's theorem to $f(x) = x^3 - ${aa}x$ on $[0, ${a}]$ (note $f(0) = f(${a}) = 0$) and find the $c$ in $(0, ${a})$.`,
    steps: [
      { instruction: `Compute $f'(x)$.`, answer: `3x^2 - ${aa}`, accept: [`3x^2-${aa}`], hint: `Power rule on each term.` },
      { instruction: `Solve $3c^2 - ${aa} = 0$ for the positive root. (Type it like ${a}/sqrt(3).)`, answer: `${a}/sqrt(3)`, accept: [`${a}*sqrt(3)/3`, `sqrt(${aa}/3)`, cDec], hint: `$c^2 = \\tfrac{${aa}}{3}$; keep the root inside $(0, ${a})$.` },
    ],
    finalAnswer: { value: `c = ${a}/sqrt(3)`, unit: "" },
    solutionNarrative: `$f'(x) = 3x^2 - ${aa} = 0$ gives $c = \\pm\\tfrac{${a}}{\\sqrt{3}}$; only $c = \\tfrac{${a}}{\\sqrt{3}} \\approx ${cDec}$ lies in $(0, ${a})$.`,
  };
};

// --- mvt-statement ---

// d1: secant slope of f = x^2 + bx on [p, q].
fill["c1m-secant-1"] = (rng, idx) => {
  const b = rng.int(1, 5);
  const p = rng.int(0, 3);
  const q = p + rng.int(2, 4);
  const fp = p * p + b * p, fq = q * q + b * q;
  const slope = p + q + b; // (fq - fp)/(q - p) simplifies to p + q + b
  return {
    id: `gen.c1m-secant-1.${idx}`, generated: true, concepts: ["mvt-statement"], difficulty: 1, context: "abstract",
    prompt: `For $f(x) = x^2 + ${b}x$ on $[${p}, ${q}]$, compute the secant slope $\\dfrac{f(${q}) - f(${p})}{${q} - ${p}}$ that the MVT matches with some tangent slope.`,
    steps: [
      { instruction: `Compute $f(${p})$.`, answer: `${fp}`, accept: [], hint: `$${p}^2 + ${b} \\cdot ${p}$.` },
      { instruction: `Compute $f(${q})$.`, answer: `${fq}`, accept: [], hint: `$${q}^2 + ${b} \\cdot ${q}$.` },
      { instruction: `Divide the difference by the interval length: $\\dfrac{${fq} - ${fp}}{${q - p}}$.`, answer: `${slope}`, accept: [`${fq - fp}/${q - p}`], hint: `$\\tfrac{${fq - fp}}{${q - p}}$.` },
    ],
    finalAnswer: { value: `${slope}`, unit: "" },
    solutionNarrative: `$f(${p}) = ${fp}$ and $f(${q}) = ${fq}$, so the average rate of change is $\\tfrac{${fq - fp}}{${q - p}} = ${slope}$; the MVT promises a $c$ in $(${p}, ${q})$ with $f'(c) = ${slope}$.`,
  };
};

// d2: does the MVT apply to 1/(x - k) on [a, b]? k inside or outside.
fill["c1m-secant-2"] = (rng, idx) => {
  const a = rng.int(0, 3);
  const b = a + rng.int(2, 4);
  const inside = rng.pick([true, false]);
  const k = inside ? rng.int(a + 1, b - 1) : b + rng.int(1, 3);
  const ans = inside ? "no" : "yes";
  return {
    id: `gen.c1m-secant-2.${idx}`, generated: true, concepts: ["mvt-statement"], difficulty: 2, context: "abstract",
    prompt: `Does the MVT apply to $f(x) = \\dfrac{1}{x - ${k}}$ on $[${a}, ${b}]$?`,
    steps: [
      { instruction: `At which $x$-value is $f$ undefined?`, answer: `${k}`, accept: [`x=${k}`, `x = ${k}`], hint: `Zero denominator.` },
      { instruction: `That point lies ${inside ? "inside" : "outside"} $[${a}, ${b}]$. Does the MVT apply on this interval? Answer with one of: yes, no.`, answer: ans, accept: [ans === "yes" ? "Yes" : "No"], hint: inside ? `A discontinuity inside the interval voids the guarantee.` : `On $[${a}, ${b}]$ the function is continuous and differentiable throughout.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: inside
      ? `$f$ blows up at $x = ${k}$, which lies inside $[${a}, ${b}]$, so continuity fails and the MVT gives no guarantee.`
      : `The only trouble spot $x = ${k}$ lies outside $[${a}, ${b}]$, so $f$ is continuous and differentiable on the interval and the MVT applies.`,
  };
};

// d3: average velocity of s(t) = t^2 + bt on [0, T]; find the MVT instant.
fill["c1m-secant-3"] = (rng, idx) => {
  const T = rng.pick([2, 4, 6]);
  const b = rng.int(1, 6);
  const sT = T * T + b * T;
  const avg = T + b; // (sT - 0)/T
  const tStar = T / 2; // solve 2t + b = T + b
  return {
    id: `gen.c1m-secant-3.${idx}`, generated: true, concepts: ["mvt-statement"], difficulty: 3, context: "applied",
    prompt: `A particle's position is $s(t) = t^2 + ${b}t$ meters after $t$ seconds. Over $[0, ${T}]$, find its average velocity and the instant the MVT guarantees the instantaneous velocity equals it.`,
    steps: [
      { instruction: `Compute the average velocity $\\dfrac{s(${T}) - s(0)}{${T} - 0}$ in m/s.`, answer: `${avg}`, accept: [`${sT}/${T}`], hint: `$s(${T}) = ${sT}$ and $s(0) = 0$.` },
      { instruction: `Velocity is $s'(t) = 2t + ${b}$. Solve $2t + ${b} = ${avg}$ for the guaranteed instant $t$.`, answer: `${tStar}`, accept: [`t=${tStar}`, `t = ${tStar}`], hint: `Subtract ${b}, divide by 2.` },
    ],
    finalAnswer: { value: `t = ${tStar}`, unit: "s" },
    solutionNarrative: `Average velocity $= \\tfrac{${sT}}{${T}} = ${avg}$ m/s; setting $2t + ${b} = ${avg}$ gives $t = ${tStar}$ s — the midpoint of the interval, as always for quadratic position.`,
  };
};

// --- finding-c ---

// d1: f = x^2 on [a, b] with even width; c is the integer midpoint.
fill["c1m-findc-1"] = (rng, idx) => {
  const a = rng.int(0, 4);
  const b = a + 2 * rng.int(1, 3);
  const slope = a + b;
  const c = slope / 2;
  return {
    id: `gen.c1m-findc-1.${idx}`, generated: true, concepts: ["finding-c"], difficulty: 1, context: "abstract",
    prompt: `Find the $c$ guaranteed by the MVT for $f(x) = x^2$ on $[${a}, ${b}]$.`,
    steps: [
      { instruction: `Compute the secant slope $\\dfrac{f(${b}) - f(${a})}{${b} - ${a}}$.`, answer: `${slope}`, accept: [`${b * b - a * a}/${b - a}`], hint: `$\\tfrac{${b * b} - ${a * a}}{${b - a}}$.` },
      { instruction: `Solve $f'(c) = 2c = ${slope}$.`, answer: `${c}`, accept: [`c=${c}`, `c = ${c}`], hint: `For $x^2$, $c$ is always the midpoint of the interval.` },
    ],
    finalAnswer: { value: `c = ${c}`, unit: "" },
    solutionNarrative: `Secant slope $= \\tfrac{${b * b - a * a}}{${b - a}} = ${slope}$; $2c = ${slope}$ gives $c = ${c}$, the midpoint of $[${a}, ${b}]$.`,
  };
};

// d2: quadratic with a linear term: f = x^2 - bx + q on [p, p + 2w].
fill["c1m-findc-2"] = (rng, idx) => {
  const bb = rng.int(1, 5), q = rng.int(1, 9);
  const p = rng.int(0, 3), w = rng.int(1, 3);
  const hi = p + 2 * w;
  const slope = p + hi - bb; // secant slope of x^2 - bb x + q
  const c = p + w;
  const fp = p * p - bb * p + q, fhi = hi * hi - bb * hi + q;
  return {
    id: `gen.c1m-findc-2.${idx}`, generated: true, concepts: ["finding-c"], difficulty: 2, context: "abstract",
    prompt: `Find the MVT point for $f(x) = x^2 - ${bb}x + ${q}$ on $[${p}, ${hi}]$.`,
    steps: [
      { instruction: `Compute the secant slope $\\dfrac{f(${hi}) - f(${p})}{${hi} - ${p}}$.`, answer: `${slope}`, accept: [`${fhi - fp}/${hi - p}`], hint: `$f(${hi}) = ${fhi}$ and $f(${p}) = ${fp}$.` },
      { instruction: `Compute $f'(x)$.`, answer: `2x - ${bb}`, accept: [`2x-${bb}`], hint: `Power rule; the constant drops.` },
      { instruction: `Solve $2c - ${bb} = ${slope}$.`, answer: `${c}`, accept: [`c=${c}`, `c = ${c}`], hint: `Add ${bb}, divide by 2.` },
    ],
    finalAnswer: { value: `c = ${c}`, unit: "" },
    solutionNarrative: `Secant slope $\\tfrac{${fhi} - ${fp}}{${hi - p}} = ${slope}$; setting $2c - ${bb} = ${slope}$ gives $c = ${c}$ — the midpoint, as for every quadratic.`,
  };
};

// d3: f = x^3 on [0, b]; c = b/sqrt(3).
fill["c1m-findc-3"] = (rng, idx) => {
  const b = rng.int(2, 6);
  const slope = b * b; // (b^3 - 0)/b
  const cDec = (b / Math.sqrt(3)).toFixed(4);
  return {
    id: `gen.c1m-findc-3.${idx}`, generated: true, concepts: ["finding-c"], difficulty: 3, context: "abstract",
    prompt: `Find the $c$ guaranteed by the MVT for $f(x) = x^3$ on $[0, ${b}]$.`,
    steps: [
      { instruction: `Compute the secant slope $\\dfrac{f(${b}) - f(0)}{${b} - 0}$.`, answer: `${slope}`, accept: [`${b ** 3}/${b}`], hint: `$\\tfrac{${b ** 3}}{${b}}$.` },
      { instruction: `Solve $f'(c) = 3c^2 = ${slope}$ for the $c$ in $(0, ${b})$. (Type it like ${b}/sqrt(3).)`, answer: `${b}/sqrt(3)`, accept: [`${b}*sqrt(3)/3`, `sqrt(${slope}/3)`, cDec], hint: `$c^2 = \\tfrac{${slope}}{3}$; keep the positive root.` },
    ],
    finalAnswer: { value: `c = ${b}/sqrt(3)`, unit: "" },
    solutionNarrative: `The secant slope is $${slope}$; $3c^2 = ${slope}$ gives $c = \\tfrac{${b}}{\\sqrt{3}} \\approx ${cDec}$, inside $(0, ${b})$.`,
  };
};

// --- mvt-consequences ---

// d1: |f'| <= M on [a, b] bounds |f(b) - f(a)| by M(b - a).
fill["c1m-conseq-1"] = (rng, idx) => {
  const M = rng.int(2, 9);
  const a = rng.int(0, 4);
  const b = a + rng.int(2, 6);
  const w = b - a;
  const bound = M * w;
  return {
    id: `gen.c1m-conseq-1.${idx}`, generated: true, concepts: ["mvt-consequences"], difficulty: 1, context: "abstract",
    prompt: `Suppose $|f'(x)| \\le ${M}$ for all $x$ in $[${a}, ${b}]$. What is the largest possible value of $|f(${b}) - f(${a})|$?`,
    steps: [
      { instruction: `What is the interval length $${b} - ${a}$?`, answer: `${w}`, accept: [], hint: `Just subtract.` },
      { instruction: `By the MVT, $|f(${b}) - f(${a})| = |f'(c)| \\cdot ${w} \\le M(b - a)$. Compute the bound.`, answer: `${bound}`, accept: [`${M}*${w}`], hint: `$${M} \\times ${w}$.` },
    ],
    finalAnswer: { value: `${bound}`, unit: "" },
    solutionNarrative: `$|f(${b}) - f(${a})| = |f'(c)| \\cdot ${w} \\le ${M} \\cdot ${w} = ${bound}$: a rate capped at ${M} can move the value at most ${bound} over a length-${w} interval.`,
  };
};

// d2: speed-trap argument with a randomized limit above or below the average.
fill["c1m-conseq-2"] = (rng, idx) => {
  const v = 5 * rng.int(12, 18); // average speed, 60..90 in steps of 5
  const T = rng.pick([2, 3]);
  const D = v * T;
  const L = v + rng.pick([-10, -5, 5, 10]); // speed limit
  const over = v > L;
  const ans = over ? "yes" : "no";
  return {
    id: `gen.c1m-conseq-2.${idx}`, generated: true, concepts: ["mvt-consequences"], difficulty: 2, context: "applied",
    prompt: `A car passes toll booth A and reaches toll booth B, ${D} miles away, exactly ${T} hours later. The speed limit is ${L} mph. Use the MVT to decide whether the ticket proves the car broke the limit.`,
    steps: [
      { instruction: `Compute the average speed in mph.`, answer: `${v}`, accept: [`${D}/${T}`], hint: `Distance over time: $\\tfrac{${D}}{${T}}$.` },
      { instruction: `By the MVT, at some instant the speedometer read exactly ${v} mph. Does that prove the car exceeded the ${L} mph limit? Answer with one of: yes, no.`, answer: ans, accept: [over ? "Yes" : "No"], hint: `Compare ${v} to ${L}.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: over
      ? `Average speed $= ${v}$ mph; the MVT guarantees an instant at exactly ${v} mph, which exceeds ${L} — provable speeding without a radar gun.`
      : `Average speed $= ${v}$ mph, which is under the ${L} mph limit; the MVT only guarantees an instant at ${v} mph, so the ticket alone proves nothing.`,
  };
};

// d3: two-sided derivative bounds trap f(b) in an interval.
fill["c1m-conseq-3"] = (rng, idx) => {
  const m = rng.int(1, 4);
  const M = m + rng.int(1, 4);
  const v0 = rng.int(1, 9);
  const a = rng.int(0, 3);
  const b = a + rng.int(2, 6);
  const w = b - a;
  const lo = v0 + m * w, hi = v0 + M * w;
  return {
    id: `gen.c1m-conseq-3.${idx}`, generated: true, concepts: ["mvt-consequences"], difficulty: 3, context: "abstract",
    prompt: `Suppose $f(${a}) = ${v0}$ and $${m} \\le f'(x) \\le ${M}$ for all $x$ in $[${a}, ${b}]$. Find the smallest and largest possible values of $f(${b})$.`,
    steps: [
      { instruction: `What is the interval length $${b} - ${a}$?`, answer: `${w}`, accept: [], hint: `Just subtract.` },
      { instruction: `Using the lower rate bound: minimum $f(${b}) = ${v0} + ${m} \\cdot ${w} = $ ?`, answer: `${lo}`, accept: [], hint: `$${v0} + ${m * w}$.` },
      { instruction: `Using the upper rate bound: maximum $f(${b}) = ${v0} + ${M} \\cdot ${w} = $ ?`, answer: `${hi}`, accept: [], hint: `$${v0} + ${M * w}$.` },
    ],
    finalAnswer: { value: `${lo} <= f(${b}) <= ${hi}`, unit: "" },
    solutionNarrative: `The MVT gives $f(${b}) - f(${a}) = ${w} f'(c)$ with $f'(c) \\in [${m}, ${M}]$, so $f(${b}) \\in [${lo}, ${hi}]$.`,
  };
};
