// gen-calc3s-fill.js
// Self-contained generator pack for calculus-3.stokes-divergence (template
// prefix c3s-). One generator per concept per difficulty tier
// (4 concepts x 3 tiers = 12). Exports a `fill` map of template-name ->
// generator fn, matching the shape used by js/generator.js's `generators`
// map (same pattern as gen-calc3v-fill.js).
//
// Grading notes baked into the answers (verified against the real checkStep):
// - Vector/tuple answers <a, b, c> only cross-grade when every entry is a
//   plain number, so all generated vector answers are EVALUATED at a point
//   (or are constant vectors) — numeric entries only.
// - Curl COMPONENTS as polynomials ("2z", "4y") are asked as separate scalar
//   steps, which grade via full polynomial equivalence.
// - "36pi" and "36*pi" both evaluate via evalNumeric; both forms are listed.
// - Menu answers (irrotational/incompressible/neither) are exact strings with
//   the options enumerated verbatim in the instruction.
// - Degenerate configs are excluded BY CONSTRUCTION: divergences built from
//   positive coefficients (nonzero except the INTENTIONAL incompressible
//   branch), boxes/rectangles with positive side lengths, Stokes integrands
//   guarded against the accidental root q*a = p, and every slanted-surface
//   pair (a, b) re-verified at module load so 1 + a^2 + b^2 is a perfect
//   square EXACTLY (a failing entry is dropped and can never ship).

const V = (...xs) => `<${xs.join(", ")}>`;
const Pn = (...xs) => `(${xs.join(", ")})`;
const Vt = (xs) => `\\langle ${xs.join(", ")} \\rangle`; // LaTeX tuple for prompts

// Coefficient formatting: cf(1)="", cf(-1)="-", cf(3)="3".
const cf = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);

// Slanted-surface slope pairs [a, b, s] with 1 + a^2 + b^2 = s^2 EXACTLY,
// programmatically re-verified so the dS factor sqrt(1+a^2+b^2) = s is exact.
const SURF_PAIRS = [
  [2, 2, 3],
  [4, 8, 9],
  [8, 4, 9],
].filter(([a, b, s]) => 1 + a * a + b * b === s * s);

export const fill = {};

// ============================================================================
// concept: divergence-and-curl
// ============================================================================

// d1: F = <a x, b y, c z> — constant divergence, zero curl, classify.
fill["c3s-div-curl-1"] = (rng, idx) => {
  const a = rng.int(1, 4), b = rng.int(1, 4), c = rng.int(1, 4);
  const k = a + b + c; // >= 3: divergence never zero, so 'irrotational' is unambiguous
  return {
    id: `gen.c3s-div-curl-1.${idx}`, generated: true, concepts: ["divergence-and-curl"], difficulty: 1, context: "abstract",
    prompt: `For the field $\\vec{F} = \\langle ${cf(a)}x,\\; ${cf(b)}y,\\; ${cf(c)}z \\rangle$, compute the divergence and the curl, and classify the field.`,
    steps: [
      { instruction: `Compute $\\partial P/\\partial x$ for $P = ${cf(a)}x$.`, answer: `${a}`, accept: [], hint: `Differentiate $${cf(a)}x$ with respect to $x$.` },
      { instruction: "Compute $\\operatorname{div}\\vec{F} = P_x + Q_y + R_z$.", answer: `${k}`, accept: [], hint: `$${a} + ${b} + ${c}$.` },
      { instruction: "Compute $\\operatorname{curl}\\vec{F}$ as a numeric vector. (Every cross-partial, like $\\partial P/\\partial y$, is zero here.)", answer: V(0, 0, 0), accept: [Pn(0, 0, 0)], hint: "Each component of the curl is a difference of cross-partials, and each of them vanishes." },
      { instruction: `The curl is $\\vec{0}$ everywhere but $\\operatorname{div}\\vec{F} = ${k} \\neq 0$. Classify the field: type 'irrotational', 'incompressible', or 'neither'.`, answer: "irrotational", accept: ["curl-free", "curl free"], hint: "Zero curl everywhere means irrotational; incompressible would require zero divergence." },
    ],
    finalAnswer: { value: "irrotational", unit: "" },
    solutionNarrative: `$\\operatorname{div}\\vec{F} = ${a} + ${b} + ${c} = ${k}$ and every cross-partial vanishes, so $\\operatorname{curl}\\vec{F} = \\vec{0}$: the field is irrotational (but not incompressible, since the divergence is ${k}, not 0).`,
  };
};

// d2: polynomial divergence + curl components as scalar polynomial steps,
// then the curl vector EVALUATED at a point (numeric entries only).
fill["c3s-div-curl-2"] = (rng, idx) => {
  const a = rng.int(1, 3), b = rng.int(1, 4), c = rng.int(1, 3);
  const x0 = rng.int(0, 2), y0 = rng.int(1, 3), z0 = rng.int(1, 3); // y0, z0 >= 1: curl at the point is never the zero vector
  // F = <a x^2, b x y, c y z>
  // div = 2a x + b x + c y = (2a+b) x + c y   (both coefficients >= 1)
  // curl = <R_y - Q_z, P_z - R_x, Q_x - P_y> = <c z, 0, b y>
  const dCoef = 2 * a + b;
  const divStr = `${dCoef}x + ${cf(c)}y`;
  const curlAt = [c * z0, 0, b * y0];
  return {
    id: `gen.c3s-div-curl-2.${idx}`, generated: true, concepts: ["divergence-and-curl"], difficulty: 2, context: "abstract",
    prompt: `For $\\vec{F} = \\langle ${cf(a)}x^2,\\; ${cf(b)}xy,\\; ${cf(c)}yz \\rangle$, compute $\\operatorname{div}\\vec{F}$ as a polynomial, the nonzero curl components, and $\\operatorname{curl}\\vec{F}$ evaluated at $(${x0}, ${y0}, ${z0})$.`,
    steps: [
      { instruction: "Compute $\\operatorname{div}\\vec{F} = P_x + Q_y + R_z$ as a polynomial in $x, y$.", answer: divStr, accept: [`${cf(c)}y + ${dCoef}x`], hint: `$P_x = ${2 * a}x$, $Q_y = ${cf(b)}x$, $R_z = ${cf(c)}y$; collect the $x$ terms.` },
      { instruction: `Compute the x-component of the curl, $R_y - Q_z$, for $R = ${cf(c)}yz$ and $Q = ${cf(b)}xy$.`, answer: `${cf(c)}z`, accept: [`${c}*z`], hint: `$R_y = ${cf(c)}z$ and $Q_z = 0$.` },
      { instruction: `Compute the z-component of the curl, $Q_x - P_y$, for $Q = ${cf(b)}xy$ and $P = ${cf(a)}x^2$.`, answer: `${cf(b)}y`, accept: [`${b}*y`], hint: `$Q_x = ${cf(b)}y$ and $P_y = 0$.` },
      { instruction: `The y-component $P_z - R_x$ is 0, so $\\operatorname{curl}\\vec{F} = \\langle ${cf(c)}z,\\; 0,\\; ${cf(b)}y \\rangle$. Evaluate it at $(${x0}, ${y0}, ${z0})$ as a numeric vector.`, answer: V(...curlAt), accept: [Pn(...curlAt)], hint: `Substitute $z = ${z0}$ and $y = ${y0}$: $\\langle ${c}(${z0}),\\; 0,\\; ${b}(${y0}) \\rangle$.` },
    ],
    finalAnswer: { value: V(...curlAt), unit: "" },
    solutionNarrative: `$\\operatorname{div}\\vec{F} = ${2 * a}x + ${cf(b)}x + ${cf(c)}y = ${divStr}$. The curl is $\\langle ${cf(c)}z, 0, ${cf(b)}y \\rangle$, which at $(${x0}, ${y0}, ${z0})$ evaluates to $${Vt(curlAt)}$.`,
  };
};

// d3: classify — irrotational (gradient), incompressible (div = 0, the
// intentional zero case), or neither. Curl here is a CONSTANT vector, asked
// numerically.
fill["c3s-div-curl-3"] = (rng, idx) => {
  const branch = rng.pick(["irrotational", "incompressible", "neither"]);
  const a = rng.int(1, 3), b = rng.int(1, 3), c = rng.int(1, 3);
  if (branch === "irrotational") {
    // F = grad(a x^2 + c xy + b y^2 + e z^2) = <2a x + c y, c x + 2b y, 2e z>
    const e = rng.int(1, 3);
    const k = 2 * a + 2 * b + 2 * e; // >= 6, never zero
    return {
      id: `gen.c3s-div-curl-3.${idx}`, generated: true, concepts: ["divergence-and-curl"], difficulty: 3, context: "abstract",
      prompt: `Classify the field $\\vec{F} = \\langle ${2 * a}x + ${cf(c)}y,\\; ${cf(c)}x + ${2 * b}y,\\; ${2 * e}z \\rangle$ as irrotational, incompressible, or neither, by computing its curl and divergence.`,
      steps: [
        { instruction: `Compute the z-component of the curl, $Q_x - P_y$, for $Q = ${cf(c)}x + ${2 * b}y$ and $P = ${2 * a}x + ${cf(c)}y$.`, answer: "0", accept: [], hint: `$Q_x = ${c}$ and $P_y = ${c}$ — they cancel.` },
        { instruction: "The x- and y-components also vanish. Give $\\operatorname{curl}\\vec{F}$ as a numeric vector.", answer: V(0, 0, 0), accept: [Pn(0, 0, 0)], hint: "All three components are differences of matching cross-partials." },
        { instruction: "Compute $\\operatorname{div}\\vec{F} = P_x + Q_y + R_z$.", answer: `${k}`, accept: [], hint: `$${2 * a} + ${2 * b} + ${2 * e}$.` },
        { instruction: "Classify the field: type 'irrotational', 'incompressible', or 'neither'.", answer: "irrotational", accept: ["curl-free", "curl free"], hint: `Curl $\\vec{0}$ everywhere, divergence ${k} \\neq 0$.` },
      ],
      finalAnswer: { value: "irrotational", unit: "" },
      solutionNarrative: `$\\operatorname{curl}\\vec{F} = \\vec{0}$ (this field is the gradient of $${cf(a)}x^2 + ${cf(c)}xy + ${cf(b)}y^2 + ${cf(e)}z^2$) but $\\operatorname{div}\\vec{F} = ${k} \\neq 0$, so the field is irrotational and not incompressible.`,
    };
  }
  // F = <a y + d x, b z, c x>, with d = 0 for the incompressible branch.
  const d = branch === "neither" ? rng.int(1, 4) : 0;
  const Ptxt = d === 0 ? `${cf(a)}y` : `${cf(a)}y + ${cf(d)}x`;
  const curl = [-b, -c, -a]; // constant, never the zero vector
  const label = branch;
  return {
    id: `gen.c3s-div-curl-3.${idx}`, generated: true, concepts: ["divergence-and-curl"], difficulty: 3, context: "abstract",
    prompt: `Classify the field $\\vec{F} = \\langle ${Ptxt},\\; ${cf(b)}z,\\; ${cf(c)}x \\rangle$ as irrotational, incompressible, or neither, by computing its divergence and curl.`,
    steps: [
      { instruction: "Compute $\\operatorname{div}\\vec{F} = P_x + Q_y + R_z$.", answer: `${d}`, accept: [], hint: d === 0 ? "Each component is missing its own variable, so every partial in the sum is 0." : `Only $P = ${Ptxt}$ contributes: $P_x = ${d}$.` },
      { instruction: `Compute the x-component of the curl, $R_y - Q_z$, for $R = ${cf(c)}x$ and $Q = ${cf(b)}z$.`, answer: `${-b}`, accept: [], hint: `$R_y = 0$ and $Q_z = ${b}$.` },
      { instruction: `The other components work the same way. Give $\\operatorname{curl}\\vec{F}$ as a numeric vector.`, answer: V(...curl), accept: [Pn(...curl)], hint: `$\\langle R_y - Q_z,\\; P_z - R_x,\\; Q_x - P_y \\rangle = \\langle 0 - ${b},\\; 0 - ${c},\\; 0 - ${a} \\rangle$.` },
      { instruction: "Classify the field: type 'irrotational', 'incompressible', or 'neither'.", answer: label, accept: label === "incompressible" ? ["divergence-free", "divergence free", "source-free"] : ["none"], hint: label === "incompressible" ? "The divergence is 0 everywhere but the curl is not $\\vec{0}$." : `The divergence is ${d} \\neq 0$ AND the curl is not $\\vec{0}$.` },
    ],
    finalAnswer: { value: label, unit: "" },
    solutionNarrative: label === "incompressible"
      ? `$\\operatorname{div}\\vec{F} = 0$ everywhere — the field is incompressible — but $\\operatorname{curl}\\vec{F} = ${Vt(curl)} \\neq \\vec{0}$, so it is not irrotational.`
      : `$\\operatorname{div}\\vec{F} = ${d} \\neq 0$ and $\\operatorname{curl}\\vec{F} = ${Vt(curl)} \\neq \\vec{0}$: the field is neither irrotational nor incompressible.`,
  };
};

// ============================================================================
// concept: surface-integrals
// ============================================================================

// d1: flat horizontal rectangle in the plane z = c; integrand k z is constant
// on the surface and dS = dA.
fill["c3s-surface-1"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(2, 4), c = rng.int(1, 5), k = rng.int(1, 3);
  const val = k * c, area = a * b, total = val * area;
  const fTxt = `${cf(k)}z`;
  return {
    id: `gen.c3s-surface-1.${idx}`, generated: true, concepts: ["surface-integrals"], difficulty: 1, context: "abstract",
    prompt: `Compute the scalar surface integral $\\displaystyle\\iint_S ${fTxt}\\, dS$, where $S$ is the flat rectangle $0 \\le x \\le ${a}$, $0 \\le y \\le ${b}$ in the plane $z = ${c}$.`,
    steps: [
      { instruction: `On the surface, $z = ${c}$. What constant does the integrand $${fTxt}$ equal there?`, answer: `${val}`, accept: [], hint: `Substitute $z = ${c}$ into $${fTxt}$.` },
      { instruction: "The surface is flat and horizontal, so $dS = dA$. Compute the area of the rectangle.", answer: `${area}`, accept: [], hint: `$${a} \\times ${b}$.` },
      { instruction: "Compute the surface integral (constant × area).", answer: `${total}`, accept: [], hint: `$${val} \\times ${area}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "" },
    solutionNarrative: `On $z = ${c}$ the integrand is the constant ${val} and $dS = dA$, so the integral is $${val} \\times ${area} = ${total}$.`,
  };
};

// d2: slanted graph surface z = a x + b y with an EXACT dS factor; constant
// integrand.
fill["c3s-surface-2"] = (rng, idx) => {
  const [sa, sb, s] = rng.pick(SURF_PAIRS);
  const p = rng.int(1, 4), q = rng.int(1, 3), k = rng.int(2, 6);
  const area = p * q, total = k * s * area;
  return {
    id: `gen.c3s-surface-2.${idx}`, generated: true, concepts: ["surface-integrals"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\displaystyle\\iint_S ${k}\\, dS$, where $S$ is the part of the plane $z = ${cf(sa)}x + ${cf(sb)}y$ above the rectangle $R = [0, ${p}] \\times [0, ${q}]$.`,
    steps: [
      { instruction: `For a graph surface $z = ax + by$, $dS = \\sqrt{1 + a^2 + b^2}\\, dA$. Compute $1 + ${sa}^2 + ${sb}^2$.`, answer: `${s * s}`, accept: [], hint: `$1 + ${sa * sa} + ${sb * sb}$.` },
      { instruction: `Compute the $dS$ factor $\\sqrt{${s * s}}$.`, answer: `${s}`, accept: [], hint: `$${s * s}$ is a perfect square.` },
      { instruction: `Compute $\\displaystyle\\iint_S ${k}\\, dS = ${k} \\cdot ${s} \\cdot \\text{Area}(R)$.`, answer: `${total}`, accept: [], hint: `Area of $R$ is $${p} \\times ${q} = ${area}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "" },
    solutionNarrative: `$dS = \\sqrt{1 + ${sa * sa} + ${sb * sb}}\\, dA = ${s}\\, dA$ — exact by construction — so the integral is $${k} \\times ${s} \\times ${area} = ${total}$.`,
  };
};

// d3: slanted graph surface, non-constant integrand m x; p is even so the
// inner double integral is an integer.
fill["c3s-surface-3"] = (rng, idx) => {
  const [sa, sb, s] = rng.pick(SURF_PAIRS);
  const p = rng.pick([2, 4]), q = rng.int(1, 3), m = rng.int(1, 4);
  const inner = (m * p * p * q) / 2; // integer since p is even
  const total = s * inner;
  const fTxt = `${cf(m)}x`;
  return {
    id: `gen.c3s-surface-3.${idx}`, generated: true, concepts: ["surface-integrals"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\displaystyle\\iint_S ${fTxt}\\, dS$, where $S$ is the part of the plane $z = ${cf(sa)}x + ${cf(sb)}y$ above the rectangle $R = [0, ${p}] \\times [0, ${q}]$.`,
    steps: [
      { instruction: `Compute $1 + ${sa}^2 + ${sb}^2$ for the $dS$ factor.`, answer: `${s * s}`, accept: [], hint: `$1 + ${sa * sa} + ${sb * sb}$.` },
      { instruction: `Compute the $dS$ factor $\\sqrt{${s * s}}$.`, answer: `${s}`, accept: [], hint: `$${s * s}$ is a perfect square, engineered so $dS$ is exact.` },
      { instruction: `Compute the plain double integral $\\displaystyle\\iint_R ${fTxt}\\, dA$ over the rectangle.`, answer: `${inner}`, accept: [], hint: `$\\int_0^{${p}} ${cf(m)}x\\, dx = ${(m * p * p) / 2}$, then multiply by the height ${q}.` },
      { instruction: `Multiply by the $dS$ factor to finish: $\\displaystyle\\iint_S ${fTxt}\\, dS = ${s} \\cdot ${inner}$.`, answer: `${total}`, accept: [], hint: `$${s} \\times ${inner}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "" },
    solutionNarrative: `$dS = ${s}\\, dA$ exactly, and $\\iint_R ${cf(m)}x\\, dA = ${(m * p * p) / 2} \\cdot ${q} = ${inner}$, so the surface integral is $${s} \\times ${inner} = ${total}$.`,
  };
};

// ============================================================================
// concept: divergence-theorem
// ============================================================================

// d1: closed box, constant divergence — flux = div × volume.
fill["c3s-div-thm-1"] = (rng, idx) => {
  const p = rng.int(1, 3), q = rng.int(1, 3), w = rng.int(1, 3);
  const k = p + q + w; // >= 3, never zero
  const a = rng.int(1, 4), b = rng.int(1, 3), h = rng.int(1, 3); // all >= 1: no zero-volume box
  const vol = a * b * h, flux = k * vol;
  return {
    id: `gen.c3s-div-thm-1.${idx}`, generated: true, concepts: ["divergence-theorem"], difficulty: 1, context: "abstract",
    prompt: `Use the divergence theorem to compute the outward flux of $\\vec{F} = \\langle ${cf(p)}x,\\; ${cf(q)}y,\\; ${cf(w)}z \\rangle$ through the closed surface of the box $[0, ${a}] \\times [0, ${b}] \\times [0, ${h}]$.`,
    steps: [
      { instruction: "Compute $\\operatorname{div}\\vec{F} = P_x + Q_y + R_z$.", answer: `${k}`, accept: [], hint: `$${p} + ${q} + ${w}$.` },
      { instruction: "Compute the volume of the box.", answer: `${vol}`, accept: [], hint: `$${a} \\times ${b} \\times ${h}$.` },
      { instruction: `The divergence is constant, so flux $= ${k} \\times \\text{Volume}$. Compute it.`, answer: `${flux}`, accept: [], hint: `$${k} \\times ${vol}$.` },
    ],
    finalAnswer: { value: `${flux}`, unit: "" },
    solutionNarrative: `$\\operatorname{div}\\vec{F} = ${p} + ${q} + ${w} = ${k}$, a constant, so the outward flux is $${k} \\times ${vol} = ${flux}$ — one multiplication instead of six face integrals.`,
  };
};

// d2: sphere, constant divergence — flux = div × (4/3)πR³, exact multiple of π.
fill["c3s-div-thm-2"] = (rng, idx) => {
  const p = rng.int(1, 3), q = rng.int(1, 3), w = rng.int(1, 3);
  const k = p + q + w;
  const R = rng.pick([3, 6]);
  const volPi = (4 * R * R * R) / 3; // 36 or 288 — integer by construction
  const fluxPi = k * volPi;
  const volDec = `${Math.round(volPi * Math.PI * 100) / 100}`;
  const fluxDec = `${Math.round(fluxPi * Math.PI * 100) / 100}`;
  return {
    id: `gen.c3s-div-thm-2.${idx}`, generated: true, concepts: ["divergence-theorem"], difficulty: 2, context: "abstract",
    prompt: `Use the divergence theorem to compute the outward flux of $\\vec{F} = \\langle ${cf(p)}x,\\; ${cf(q)}y,\\; ${cf(w)}z \\rangle$ through the sphere of radius ${R} centered at the origin. Give exact answers (multiples of $\\pi$).`,
    steps: [
      { instruction: "Compute $\\operatorname{div}\\vec{F}$.", answer: `${k}`, accept: [], hint: `$${p} + ${q} + ${w}$.` },
      { instruction: `Compute the volume of the ball, $\\tfrac{4}{3}\\pi (${R})^3$ (exact, in terms of $\\pi$).`, answer: `${volPi}pi`, accept: [`${volPi}*pi`, volDec], hint: `$\\tfrac{4}{3} \\times ${R * R * R} = ${volPi}$.` },
      { instruction: "Compute the flux (exact, in terms of $\\pi$).", answer: `${fluxPi}pi`, accept: [`${fluxPi}*pi`, fluxDec], hint: `$${k} \\times ${volPi}\\pi$.` },
    ],
    finalAnswer: { value: `${fluxPi}pi`, unit: "" },
    solutionNarrative: `$\\operatorname{div}\\vec{F} = ${k}$, constant, so the flux is $${k} \\times \\tfrac{4}{3}\\pi(${R})^3 = ${fluxPi}\\pi \\approx ${fluxDec}$.`,
  };
};

// d3: closed box, LINEAR divergence — genuine triple integral, exact integers.
fill["c3s-div-thm-3"] = (rng, idx) => {
  const c = rng.int(1, 3), d = rng.int(1, 3), e = rng.int(1, 3);
  const a = rng.int(2, 4), b = rng.int(1, 3), h = rng.int(1, 3);
  // F = <c x^2, d y, e z>  =>  div = 2c x + (d + e); both pieces nonzero
  const de = d + e;
  const inner = c * a * a + de * a; // ∫0^a (2c x + de) dx — positive, never zero
  const flux = inner * b * h;
  return {
    id: `gen.c3s-div-thm-3.${idx}`, generated: true, concepts: ["divergence-theorem"], difficulty: 3, context: "abstract",
    prompt: `Use the divergence theorem to compute the outward flux of $\\vec{F} = \\langle ${cf(c)}x^2,\\; ${cf(d)}y,\\; ${cf(e)}z \\rangle$ through the closed surface of the box $[0, ${a}] \\times [0, ${b}] \\times [0, ${h}]$.`,
    steps: [
      { instruction: "Compute $\\operatorname{div}\\vec{F}$ as a polynomial in $x$.", answer: `${2 * c}x + ${de}`, accept: [`${de} + ${2 * c}x`], hint: `$P_x = ${2 * c}x$, $Q_y = ${d}$, $R_z = ${e}$.` },
      { instruction: `The integrand only involves $x$, so integrate it first: compute $\\displaystyle\\int_0^{${a}} (${2 * c}x + ${de})\\, dx$.`, answer: `${inner}`, accept: [], hint: `$\\left[${cf(c)}x^2 + ${de}x\\right]_0^{${a}} = ${c * a * a} + ${de * a}$.` },
      { instruction: `Multiply by the remaining cross-section $${b} \\times ${h}$ to finish the triple integral.`, answer: `${flux}`, accept: [], hint: `$${inner} \\times ${b * h}$.` },
    ],
    finalAnswer: { value: `${flux}`, unit: "" },
    solutionNarrative: `$\\operatorname{div}\\vec{F} = ${2 * c}x + ${de}$. Over the box, $\\iiint (${2 * c}x + ${de})\\, dV = \\left(${c * a * a} + ${de * a}\\right) \\times ${b} \\times ${h} = ${flux}$.`,
  };
};

// ============================================================================
// concept: stokes-theorem
// ============================================================================

// d1: rectangle in the plane z = c, oriented upward; constant curl·k.
fill["c3s-stokes-1"] = (rng, idx) => {
  const p = rng.int(1, 4);
  let q = rng.int(2, 6);
  if (q === p) q = p + 2; // curl·k must be nonzero
  const a = rng.int(2, 5), b = rng.int(2, 4), zc = rng.int(1, 4);
  const k = q - p, circ = k * a * b;
  return {
    id: `gen.c3s-stokes-1.${idx}`, generated: true, concepts: ["stokes-theorem"], difficulty: 1, context: "abstract",
    prompt: `Use Stokes' theorem to compute the circulation $\\oint_C \\vec{F} \\cdot d\\vec{r}$ of $\\vec{F} = \\langle ${cf(p)}y,\\; ${cf(q)}x,\\; 0 \\rangle$ around the boundary of the rectangle $[0, ${a}] \\times [0, ${b}]$ in the plane $z = ${zc}$, oriented counterclockwise seen from above (upward normal).`,
    steps: [
      { instruction: `Compute $\\partial Q/\\partial x$ for $Q = ${cf(q)}x$.`, answer: `${q}`, accept: [], hint: `Differentiate $${cf(q)}x$.` },
      { instruction: `Compute $\\partial P/\\partial y$ for $P = ${cf(p)}y$.`, answer: `${p}`, accept: [], hint: `Differentiate $${cf(p)}y$.` },
      { instruction: "With the upward normal, only $(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = Q_x - P_y$ matters. Compute it.", answer: `${k}`, accept: [], hint: `$${q} - ${p}$.` },
      { instruction: `The integrand is constant, so circulation $= ${k} \\times \\text{Area}$. Compute it.`, answer: `${circ}`, accept: [], hint: `Area of the rectangle is $${a} \\times ${b} = ${a * b}$.` },
    ],
    finalAnswer: { value: `${circ}`, unit: "" },
    solutionNarrative: `$(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = ${q} - ${p} = ${k}$, a constant, so the circulation is $${k} \\times ${a * b} = ${circ}$ — exactly Green's theorem lifted to the plane $z = ${zc}$.`,
  };
};

// d2: disk in the plane z = c, upward normal; answer an exact multiple of π.
fill["c3s-stokes-2"] = (rng, idx) => {
  const p = rng.int(1, 4), R = rng.int(1, 4), zc = rng.int(1, 3), m = rng.int(1, 4);
  // F = <-p y, p x, m z>: curl·k = 2p (the m z term contributes nothing).
  const areaPi = R * R, circPi = 2 * p * R * R;
  const circDec = `${Math.round(circPi * Math.PI * 100) / 100}`;
  return {
    id: `gen.c3s-stokes-2.${idx}`, generated: true, concepts: ["stokes-theorem"], difficulty: 2, context: "abstract",
    prompt: `Use Stokes' theorem to compute the circulation of $\\vec{F} = \\langle -${cf(p)}y,\\; ${cf(p)}x,\\; ${cf(m)}z \\rangle$ around the circle of radius ${R} centered on the z-axis in the plane $z = ${zc}$, oriented counterclockwise seen from above. Give exact answers (multiples of $\\pi$).`,
    steps: [
      { instruction: `Compute $(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = Q_x - P_y$ for $Q = ${cf(p)}x$ and $P = -${cf(p)}y$. (The $${cf(m)}z$ component does not affect this.)`, answer: `${2 * p}`, accept: [], hint: `$${p} - (-${p})$.` },
      { instruction: "Compute the area of the disk (exact, in terms of $\\pi$).", answer: `${areaPi}pi`, accept: [`${areaPi}*pi`], hint: `$\\pi R^2$ with $R = ${R}$.` },
      { instruction: "Compute the circulation (exact, in terms of $\\pi$).", answer: `${circPi}pi`, accept: [`${circPi}*pi`, circDec], hint: `$${2 * p} \\times ${areaPi}\\pi$.` },
    ],
    finalAnswer: { value: `${circPi}pi`, unit: "" },
    solutionNarrative: `$(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = ${2 * p}$, constant, so the circulation is $${2 * p} \\times \\pi(${R})^2 = ${circPi}\\pi \\approx ${circDec}$. The vertical component $${cf(m)}z$ never mattered: it has no effect on $Q_x - P_y$.`,
  };
};

// d3: rectangle in the plane z = c with a LINEAR curl·k — genuine double
// integral; guarded against the accidental zero total.
fill["c3s-stokes-3"] = (rng, idx) => {
  const q = rng.int(1, 3);
  let p = rng.int(1, 4);
  const a = rng.int(2, 4), b = rng.int(2, 4), zc = rng.int(1, 3);
  if (q * a === p) p += 1; // total = a b (q a - p): keep q a != p so it is nonzero
  // F = <p y, q x^2, 0>: curl·k = 2q x - p
  const innerA = 2 * q * b, innerB = p * b;
  const circ = q * a * a * b - p * a * b; // nonzero by the guard above
  return {
    id: `gen.c3s-stokes-3.${idx}`, generated: true, concepts: ["stokes-theorem"], difficulty: 3, context: "abstract",
    prompt: `Use Stokes' theorem with a NON-constant integrand: compute the circulation of $\\vec{F} = \\langle ${cf(p)}y,\\; ${cf(q)}x^2,\\; 0 \\rangle$ around the boundary of the rectangle $[0, ${a}] \\times [0, ${b}]$ in the plane $z = ${zc}$, oriented counterclockwise seen from above.`,
    steps: [
      { instruction: "Compute $(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = Q_x - P_y$ as a polynomial in $x$.", answer: `${2 * q}x - ${p}`, accept: [`${2 * q}*x - ${p}`, `-${p} + ${2 * q}x`], hint: `$Q_x = ${2 * q}x$ and $P_y = ${p}$.` },
      { instruction: `Integrate over $y$ first: the inner integral $\\displaystyle\\int_0^{${b}} (${2 * q}x - ${p})\\, dy$ equals what function of $x$?`, answer: `${innerA}x - ${innerB}`, accept: [`${innerA}*x - ${innerB}`, `${b}(${2 * q}x - ${p})`], hint: `The integrand has no $y$, so multiply by the height ${b}.` },
      { instruction: `Compute $\\displaystyle\\int_0^{${a}} (${innerA}x - ${innerB})\\, dx$.`, answer: `${circ}`, accept: [], hint: `$\\left[${q * b}x^2 - ${innerB}x\\right]_0^{${a}} = ${q * b * a * a} - ${innerB * a}$.` },
    ],
    finalAnswer: { value: `${circ}`, unit: "" },
    solutionNarrative: `$(\\operatorname{curl}\\vec{F}) \\cdot \\vec{k} = ${2 * q}x - ${p}$. Over the rectangle: $\\int_0^{${a}}\\int_0^{${b}} (${2 * q}x - ${p})\\, dy\\, dx = \\int_0^{${a}} ${b}(${2 * q}x - ${p})\\, dx = ${q * b * a * a} - ${p * a * b} = ${circ}$.`,
  };
};
