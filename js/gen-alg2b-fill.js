// gen-alg2b-fill.js
// Parametric generators for algebra-2.conic-sections:
//   a2c-circles-*, a2c-parabolas-*, a2c-ellipses-*, a2c-hyperbolas-*
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry. Template prefix: a2c-.
// Every generator has a FIXED difficulty + concept so tier coverage is exact,
// and every answer is computed from the SAME parameters used in the prompt.
//
// Numbers are engineered BACKWARD so answers are always clean:
//  - circles: pick center (h, k) and radius r, then expand to the general form;
//    completing the square lands exactly back on (h, k, r).
//  - ellipses: (a, b, c) drawn from Pythagorean triples with c^2 = a^2 - b^2.
//  - hyperbolas: (a, b, c) drawn from Pythagorean triples with c^2 = a^2 + b^2.
//  - parabolas: p chosen first, the displayed equation built from 4p.
//
// Grader notes honored (js/problem-engine.js):
//  - Equations grade per-side by polynomial equivalence with side-swap, so
//    "(x - 3)^2 + (y + 2)^2 = 25" self-checks and term-order variants match
//    automatically; accepts still list the swapped order for clarity.
//  - Coordinates are asked as ordered pairs "(a, b)" (parseTuple) with the
//    format stated in the instruction, or as separate numeric steps.
//  - Menu answers (orientation, which-conic) enumerate options verbatim in the
//    instruction and carry generous accepts.
//  - Asymptote slopes are fractions ("4/3"), which parseNum grades numerically.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const rnd = (x, p) => { const f = Math.pow(10, p); return `${Math.round(x * f) / f}`; };
// Nonzero integer in [lo, hi].
const nz = (rng, lo, hi) => { let v = 0; while (v === 0) v = rng.int(lo, hi); return v; };
// "(x - h)^2" with the sign folded in; s = 0 gives a bare "x^2".
const shiftSq = (v, s) => (s === 0 ? `${v}^2` : `(${v} ${s > 0 ? "-" : "+"} ${Math.abs(s)})^2`);
// " + 6x" / " - 4y" / " - 12" trailing term (empty when c = 0).
const lineTerm = (c, v) => {
  if (c === 0) return "";
  const abs = Math.abs(c);
  const coefStr = v && abs === 1 ? "" : `${abs}`;
  return ` ${c > 0 ? "+" : "-"} ${coefStr}${v}`;
};
// Leading coefficient for x^2 / y^2 terms.
const cf = (c) => (c === 1 ? "" : c === -1 ? "-" : `${c}`);
// General-form conic string "Ax^2 + Cy^2 + Dx + Ey + F = 0" (A assumed nonzero).
const generalForm = (A, C, D, E, F) =>
  `${cf(A)}x^2${C !== 0 ? ` ${C > 0 ? "+" : "-"} ${Math.abs(C) === 1 ? "" : Math.abs(C)}y^2` : ""}${lineTerm(D, "x")}${lineTerm(E, "y")}${lineTerm(F, "")} = 0`;
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
// --- conic tracing as sampled dots -----------------------------------------
// plot.js's curve-fn evaluator currently returns NaN for any expression with
// an explicit binary + - * / (a self-capture bug in compileFn's expr/term
// closures), so branch curves like "sqrt(25 - x*x)" render empty. We trace
// conics with small `points` instead — reliable regardless of that bug.
const f2 = (v) => Math.round(v * 100) / 100;
const ellipsePts = (h, k, rx, ry, n = 40) => Array.from({ length: n }, (_, i) => {
  const t = (2 * Math.PI * i) / n;
  return { x: f2(h + rx * Math.cos(t)), y: f2(k + ry * Math.sin(t)), r: 1.6 };
});
const parabolaPts = (n4p, xm, n = 31) => Array.from({ length: n }, (_, i) => {
  const x = -xm + (2 * xm * i) / (n - 1);
  return { x: f2(x), y: f2((x * x) / n4p), r: 1.6 };
});
// Both branches of a centered hyperbola; u runs along the conjugate axis and
// v = a*sqrt(1 + u^2/b^2) along the transverse axis.
const hyperbolaPts = (a, b, horiz, m, n = 17) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = -m + (2 * m * i) / (n - 1);
    const v = a * Math.sqrt(1 + (u * u) / (b * b));
    if (horiz) out.push({ x: f2(v), y: f2(u), r: 1.6 }, { x: f2(-v), y: f2(u), r: 1.6 });
    else out.push({ x: f2(u), y: f2(v), r: 1.6 }, { x: f2(u), y: f2(-v), r: 1.6 });
  }
  return out;
};
// Pythagorean triples [leg, leg, hyp] — both leg orders included so either can
// play the role of a (ellipse: a = hyp of (b, c); hyperbola: c = hyp of (a, b)).
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [8, 15, 17], [15, 8, 17]];

export const fill = {};

// ===========================================================================
// concept: circles-and-completing-square
// ===========================================================================
fill["a2c-circles-1"] = (rng, idx) => {
  const h = nz(rng, -8, 8), k = nz(rng, -8, 8), r = rng.int(2, 9);
  const eq = `${shiftSq("x", h)} + ${shiftSq("y", k)} = ${r * r}`;
  return {
    id: `gen.a2c-circles-1.${idx}`, generated: true, concepts: ["circles-and-completing-square"], difficulty: 1, context: "abstract",
    prompt: `A circle has equation $${eq}$. Read off its center and radius from the standard form $(x - h)^2 + (y - k)^2 = r^2$.`,
    steps: [
      { instruction: `What is the x-coordinate of the center? (Give a number — watch the sign inside the parenthesis.)`, answer: `${h}`, accept: [], hint: `Standard form has $(x - h)$: the term $${shiftSq("x", h).replace("^2", "")}$ means $h = ${h}$.` },
      { instruction: `What is the y-coordinate of the center? (Give a number.)`, answer: `${k}`, accept: [], hint: `The term $${shiftSq("y", k).replace("^2", "")}$ means $k = ${k}$ — the sign flips coming out of the parenthesis.` },
      { instruction: `The right side is $r^2 = ${r * r}$. What is the radius $r$? (Give a number.)`, answer: `${r}`, accept: [], hint: `$\\sqrt{${r * r}} = ${r}$ — the equation shows $r^2$, not $r$.` },
    ],
    finalAnswer: { value: `center (${h}, ${k}), radius ${r}`, unit: "" },
    solutionNarrative: `Match against $(x - h)^2 + (y - k)^2 = r^2$: the center is $(${h}, ${k})$ (signs flip out of the parentheses) and $r = \\sqrt{${r * r}} = ${r}$.`,
    plot: {
      type: "cartesian", xRange: [h - r - 2, h + r + 2], yRange: [k - r - 2, k + r + 2], grid: true,
      points: [...ellipsePts(h, k, r, r), { x: h, y: k, label: `(${h}, ${k})`, color: "warn" }],
      caption: `The circle ${eq}: center (${h}, ${k}), radius ${r}`,
    },
  };
};
fill["a2c-circles-2"] = (rng, idx) => {
  let h, k, r;
  do { h = nz(rng, -6, 6); k = nz(rng, -6, 6); r = rng.int(2, 8); } while (h * h + k * k - r * r === 0);
  const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
  const gen = generalForm(1, 1, D, E, F);
  const std = `${shiftSq("x", h)} + ${shiftSq("y", k)} = ${r * r}`;
  const stdSwap = `${shiftSq("y", k)} + ${shiftSq("x", h)} = ${r * r}`;
  return {
    id: `gen.a2c-circles-2.${idx}`, generated: true, concepts: ["circles-and-completing-square"], difficulty: 2, context: "abstract",
    prompt: `The equation $${gen}$ describes a circle in general form. Complete the square in $x$ and in $y$ to find its center and radius.`,
    steps: [
      { instruction: `Group the $x$ terms: $x^2 ${D > 0 ? "+" : "-"} ${Math.abs(D)}x$. Half the coefficient of $x$, sign-flipped, gives the center's x-coordinate $h$. What is $h$? (Give a number.)`, answer: `${h}`, accept: [], hint: `$h = -\\tfrac{${D}}{2} = ${h}$, and you will add $h^2 = ${h * h}$ inside the square.` },
      { instruction: `Do the same for the $y$ terms: what is the center's y-coordinate $k$? (Give a number.)`, answer: `${k}`, accept: [], hint: `$k = -\\tfrac{${E}}{2} = ${k}$, adding $k^2 = ${k * k}$ to complete the square.` },
      { instruction: `Move the constant across and add both completing-the-square numbers to the right side: $${-F} + ${h * h} + ${k * k} = ${r * r} = r^2$. What is the radius $r$? (Give a number.)`, answer: `${r}`, accept: [], hint: `$\\sqrt{${r * r}} = ${r}$.` },
      { instruction: `Write the standard-form equation (like (x - 1)^2 + (y + 2)^2 = 9).`, answer: std, accept: [stdSwap], hint: `Center $(${h}, ${k})$ and $r^2 = ${r * r}$: signs inside the parentheses are the OPPOSITE of the center's coordinates.` },
    ],
    finalAnswer: { value: std, unit: "" },
    solutionNarrative: `Half of $${D}$ is $${-h}$, so $h = ${h}$ (add $${h * h}$); half of $${E}$ gives $k = ${k}$ (add $${k * k}$). The right side becomes $${-F} + ${h * h} + ${k * k} = ${r * r}$, so $r = ${r}$ and the circle is $${std}$.`,
  };
};
fill["a2c-circles-3"] = (rng, idx) => {
  let h, k, r;
  do { h = nz(rng, -5, 5); k = nz(rng, -5, 5); r = rng.int(2, 7); } while (h * h + k * k - r * r === 0);
  const A = rng.pick([2, 3]);
  const D = -2 * h, E = -2 * k, F = h * h + k * k - r * r;
  const gen = generalForm(A, A, A * D, A * E, A * F);
  const divided = generalForm(1, 1, D, E, F);
  return {
    id: `gen.a2c-circles-3.${idx}`, generated: true, concepts: ["circles-and-completing-square"], difficulty: 3, context: "abstract",
    prompt: `The equation $${gen}$ describes a circle, but the squared terms carry a coefficient of ${A}. Divide through first, then complete the square to find the center and radius.`,
    steps: [
      { instruction: `Divide every term by ${A} and write the resulting equation (still equal to 0).`, answer: divided, accept: [], hint: `Each coefficient shrinks by a factor of ${A}: $${gen.replace(" = 0", "")}$ becomes $${divided.replace(" = 0", "")}$.` },
      { instruction: `Complete the square in $x$: what is the center's x-coordinate $h$? (Give a number.)`, answer: `${h}`, accept: [], hint: `Half of $${D}$, sign-flipped: $h = ${h}$.` },
      { instruction: `Complete the square in $y$: what is the center's y-coordinate $k$? (Give a number.)`, answer: `${k}`, accept: [], hint: `Half of $${E}$, sign-flipped: $k = ${k}$.` },
      { instruction: `The right side becomes $${-F} + ${h * h} + ${k * k} = ${r * r}$. What is the radius $r$? (Give a number.)`, answer: `${r}`, accept: [], hint: `$r = \\sqrt{${r * r}} = ${r}$ — remember the equation shows $r^2$.` },
    ],
    finalAnswer: { value: `center (${h}, ${k}), radius ${r}`, unit: "" },
    solutionNarrative: `Divide by ${A} first: $${divided}$. Completing both squares gives $${shiftSq("x", h)} + ${shiftSq("y", k)} = ${r * r}$ — center $(${h}, ${k})$, radius $${r}$. Forgetting to divide first is the classic error: it corrupts both the center and the radius.`,
  };
};

// ===========================================================================
// concept: parabolas-focus-directrix
// ===========================================================================
fill["a2c-parabolas-1"] = (rng, idx) => {
  const a = rng.pick([1, 2, 3, -1, -2, -3]);
  const h = nz(rng, -6, 6), k = nz(rng, -6, 6);
  const eq = `y = ${cf(a)}${shiftSq("x", h)}${lineTerm(k, "")}`;
  const dir = a > 0 ? "up" : "down";
  return {
    id: `gen.a2c-parabolas-1.${idx}`, generated: true, concepts: ["parabolas-focus-directrix"], difficulty: 1, context: "abstract",
    prompt: `A parabola has vertex form $${eq}$. Identify its vertex and which way it opens.`,
    steps: [
      { instruction: `Give the vertex as an ordered pair (a, b).`, answer: `(${h}, ${k})`, accept: [], hint: `Vertex form is $y = a(x - h)^2 + k$ with vertex $(h, k)$ — flip the sign inside the parenthesis, keep the constant's sign.` },
      { instruction: `The leading coefficient is $${a}$. Does the parabola open up or down? (Answer 'up' or 'down'.)`, answer: dir, accept: [a > 0 ? "upward" : "downward", a > 0 ? "opens up" : "opens down"], hint: `Positive $a$ opens up; negative $a$ opens down.` },
      { instruction: `Write the equation of the axis of symmetry (a vertical line, like x = 2).`, answer: `x = ${h}`, accept: [], hint: `The axis passes through the vertex: $x = ${h}$.` },
    ],
    finalAnswer: { value: `(${h}, ${k})`, unit: "" },
    solutionNarrative: `Matching $y = a(x - h)^2 + k$: the vertex is $(${h}, ${k})$, the parabola opens ${dir} since $a = ${a}$ is ${a > 0 ? "positive" : "negative"}, and the axis of symmetry is $x = ${h}$.`,
  };
};
fill["a2c-parabolas-2"] = (rng, idx) => {
  const p = rng.pick([1, 2, 3, 4, -1, -2, -3, -4]);
  const N = 4 * p;
  const xm = 4 * Math.abs(p) + 2;
  const yEdge = f2((xm - 1) * (xm - 1) / Math.abs(N) + 1); // curve height at the sampled edge, padded
  return {
    id: `gen.a2c-parabolas-2.${idx}`, generated: true, concepts: ["parabolas-focus-directrix"], difficulty: 2, context: "abstract",
    prompt: `The parabola $x^2 = ${N}y$ has its vertex at the origin. Use the form $x^2 = 4py$ to find its focus and directrix.`,
    steps: [
      { instruction: `Match $x^2 = ${N}y$ to $x^2 = 4py$: what is $p$? (Give a number — keep its sign.)`, answer: `${p}`, accept: [], hint: `$4p = ${N}$, so $p = ${N}/4 = ${p}$.` },
      { instruction: `The focus sits at $(0, p)$, inside the curve. Give the focus as an ordered pair (a, b).`, answer: `(0, ${p})`, accept: [], hint: `${p > 0 ? "The parabola opens up, so the focus is above the vertex" : "The parabola opens down, so the focus is below the vertex"}: $(0, ${p})$.` },
      { instruction: `The directrix is the horizontal line $y = -p$, on the opposite side of the vertex. Write its equation (like y = 3).`, answer: `y = ${-p}`, accept: [], hint: `Opposite side from the focus: $y = ${-p}$.` },
    ],
    finalAnswer: { value: `focus (0, ${p}), directrix y = ${-p}`, unit: "" },
    solutionNarrative: `$4p = ${N}$ gives $p = ${p}$: the focus is $(0, ${p})$ and the directrix is $y = ${-p}$. Every point of the parabola is equidistant from that focus and that line.`,
    plot: {
      type: "cartesian", xRange: [-xm, xm], yRange: p > 0 ? [-Math.abs(p) - 2, yEdge] : [-yEdge, Math.abs(p) + 2], grid: true,
      segments: [{ from: [-xm + 1, -p], to: [xm - 1, -p], dashed: true, color: "dim", label: `y = ${-p}` }],
      points: [...parabolaPts(N, xm - 1), { x: 0, y: p, label: `focus (0, ${p})`, color: "warn" }],
      caption: `x^2 = ${N}y: focus (0, ${p}), directrix y = ${-p}`,
    },
  };
};
fill["a2c-parabolas-3"] = (rng, idx) => {
  const p = rng.pick([1, 2, 3, -1, -2, -3]);
  const h = nz(rng, -5, 5), k = nz(rng, -5, 5);
  const aStr = p > 0 ? `\\frac{1}{${4 * p}}` : `-\\frac{1}{${-4 * p}}`;
  const eq = `y = ${aStr}${shiftSq("x", h)}${lineTerm(k, "")}`;
  return {
    id: `gen.a2c-parabolas-3.${idx}`, generated: true, concepts: ["parabolas-focus-directrix"], difficulty: 3, context: "abstract",
    prompt: `The parabola $${eq}$ is in vertex form $y = \\frac{1}{4p}(x - h)^2 + k$, where $p$ is the focal distance. Find its vertex, focus, and directrix.`,
    steps: [
      { instruction: `Give the vertex as an ordered pair (a, b).`, answer: `(${h}, ${k})`, accept: [], hint: `Vertex form: flip the sign inside $(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})$, keep the constant $${k}$ as is.` },
      { instruction: `The leading coefficient equals $\\frac{1}{4p}$. What is $p$? (Give a number — keep its sign.)`, answer: `${p}`, accept: [], hint: `$\\frac{1}{4p} = ${p > 0 ? `\\frac{1}{${4 * p}}` : `-\\frac{1}{${-4 * p}}`}$, so $4p = ${4 * p}$ and $p = ${p}$.` },
      { instruction: `The focus is $p$ units ${p > 0 ? "above" : "below"} the vertex (vertical parabola). Give the focus as an ordered pair (a, b).`, answer: `(${h}, ${k + p})`, accept: [], hint: `Same x as the vertex; $y = ${k} + (${p}) = ${k + p}$.` },
      { instruction: `The directrix is the horizontal line $p$ units on the OTHER side of the vertex. Write its equation (like y = 3).`, answer: `y = ${k - p}`, accept: [], hint: `$y = ${k} - (${p}) = ${k - p}$.` },
    ],
    finalAnswer: { value: `focus (${h}, ${k + p}), directrix y = ${k - p}`, unit: "" },
    solutionNarrative: `The vertex is $(${h}, ${k})$ and $\\frac{1}{4p} = ${p > 0 ? `\\frac{1}{${4 * p}}` : `-\\frac{1}{${-4 * p}}`}$ gives $p = ${p}$. The focus sits at $(${h}, ${k + p})$ and the directrix is $y = ${k - p}$ — vertex exactly halfway between them.`,
  };
};

// ===========================================================================
// concept: ellipses
// ===========================================================================
fill["a2c-ellipses-1"] = (rng, idx) => {
  const [b, c, a] = rng.pick(TRIPLES); // a^2 = b^2 + c^2, so c^2 = a^2 - b^2 is perfect
  const horiz = rng.int(0, 1) === 1;
  const eq = horiz ? `\\dfrac{x^2}{${a * a}} + \\dfrac{y^2}{${b * b}} = 1` : `\\dfrac{x^2}{${b * b}} + \\dfrac{y^2}{${a * a}} = 1`;
  const orient = horiz ? "horizontal" : "vertical";
  const vertex = horiz ? `(${a}, 0)` : `(0, ${a})`;
  return {
    id: `gen.a2c-ellipses-1.${idx}`, generated: true, concepts: ["ellipses"], difficulty: 1, context: "abstract",
    prompt: `An ellipse centered at the origin has equation $${eq}$. Identify $a$, $b$, and the orientation of its major axis. Remember: $a^2$ is always the LARGER denominator.`,
    steps: [
      { instruction: `The larger denominator is $${a * a}$. What is the semi-major axis length $a$? (Give a number.)`, answer: `${a}`, accept: [], hint: `$a = \\sqrt{${a * a}} = ${a}$.` },
      { instruction: `The smaller denominator is $${b * b}$. What is the semi-minor axis length $b$? (Give a number.)`, answer: `${b}`, accept: [], hint: `$b = \\sqrt{${b * b}} = ${b}$.` },
      { instruction: `The larger denominator sits under the ${horiz ? "$x^2$" : "$y^2$"} term. Is the major axis horizontal or vertical? (Answer 'horizontal' or 'vertical'.)`, answer: orient, accept: [horiz ? "left-right" : "up-down"], hint: `The major axis runs along whichever variable carries $a^2$.` },
      { instruction: `The vertices are $a$ units from the center along the major axis. Give the vertex with a positive coordinate as an ordered pair (a, b).`, answer: vertex, accept: [], hint: `${horiz ? `Along the x-axis: $(${a}, 0)$` : `Along the y-axis: $(0, ${a})$`}.` },
    ],
    finalAnswer: { value: `a = ${a}, b = ${b}, ${orient}`, unit: "" },
    solutionNarrative: `The larger denominator $${a * a}$ gives $a = ${a}$ and sits under ${horiz ? "$x^2$" : "$y^2$"}, so the major axis is ${orient}; $b = ${b}$, and the vertices are at $${horiz ? `(\\pm${a}, 0)` : `(0, \\pm${a})`}$.`,
    plot: {
      type: "cartesian", xRange: [-a - 2, a + 2], yRange: [-a - 2, a + 2], grid: true,
      points: [
        ...ellipsePts(0, 0, horiz ? a : b, horiz ? b : a),
        ...(horiz
          ? [{ x: a, y: 0, label: `(${a}, 0)`, color: "success" }, { x: -a, y: 0, color: "success" }, { x: c, y: 0, label: "focus", color: "warn" }, { x: -c, y: 0, color: "warn" }]
          : [{ x: 0, y: a, label: `(0, ${a})`, color: "success" }, { x: 0, y: -a, color: "success" }, { x: 0, y: c, label: "focus", color: "warn" }, { x: 0, y: -c, color: "warn" }]),
      ],
      caption: `An ellipse with a = ${a}, b = ${b}: major axis ${orient}`,
    },
  };
};
fill["a2c-ellipses-2"] = (rng, idx) => {
  const [b, c, a] = rng.pick(TRIPLES); // c^2 = a^2 - b^2 perfect by construction
  const horiz = rng.int(0, 1) === 1;
  const eq = horiz ? `\\dfrac{x^2}{${a * a}} + \\dfrac{y^2}{${b * b}} = 1` : `\\dfrac{x^2}{${b * b}} + \\dfrac{y^2}{${a * a}} = 1`;
  const focus = horiz ? `(${c}, 0)` : `(0, ${c})`;
  return {
    id: `gen.a2c-ellipses-2.${idx}`, generated: true, concepts: ["ellipses"], difficulty: 2, context: "abstract",
    prompt: `Find the foci of the ellipse $${eq}$ using $c^2 = a^2 - b^2$ (for an ellipse, SUBTRACT — the foci are inside the curve, closer to the center than the vertices).`,
    steps: [
      { instruction: `What is $a^2$, the larger denominator? (Give a number.)`, answer: `${a * a}`, accept: [], hint: `Compare $${a * a}$ and $${b * b}$: the bigger one is $a^2$.` },
      { instruction: `Compute $c^2 = a^2 - b^2 = ${a * a} - ${b * b}$. (Give a number.)`, answer: `${c * c}`, accept: [], hint: `$${a * a} - ${b * b} = ${c * c}$.` },
      { instruction: `What is $c$? (Give a number.)`, answer: `${c}`, accept: [], hint: `$\\sqrt{${c * c}} = ${c}$.` },
      { instruction: `The foci lie on the ${horiz ? "major (x-) axis" : "major (y-) axis"}, $c$ units from the center. Give the focus with a positive coordinate as an ordered pair (a, b).`, answer: focus, accept: [], hint: `${horiz ? `The major axis is horizontal: $(${c}, 0)$` : `The major axis is vertical: $(0, ${c})$`}.` },
    ],
    finalAnswer: { value: horiz ? `(±${c}, 0)` : `(0, ±${c})`, unit: "" },
    solutionNarrative: `Here $a^2 = ${a * a}$ (the larger denominator, under ${horiz ? "$x^2$" : "$y^2$"}), so $c^2 = ${a * a} - ${b * b} = ${c * c}$ and $c = ${c}$: the foci are $${horiz ? `(\\pm${c}, 0)` : `(0, \\pm${c})`}$.`,
  };
};
fill["a2c-ellipses-3"] = (rng, idx) => {
  const [b, c, a] = rng.pick(TRIPLES); // b^2 = a^2 - c^2 perfect
  const h = nz(rng, -5, 5), k = nz(rng, -5, 5);
  const horiz = rng.int(0, 1) === 1;
  const v1 = horiz ? `(${h - a}, ${k})` : `(${h}, ${k - a})`;
  const v2 = horiz ? `(${h + a}, ${k})` : `(${h}, ${k + a})`;
  const f1 = horiz ? `(${h - c}, ${k})` : `(${h}, ${k - c})`;
  const f2 = horiz ? `(${h + c}, ${k})` : `(${h}, ${k + c})`;
  const xT = shiftSq("x", h), yT = shiftSq("y", k);
  const eq = horiz ? `${xT}/${a * a} + ${yT}/${b * b} = 1` : `${xT}/${b * b} + ${yT}/${a * a} = 1`;
  const eqSwap = horiz ? `${yT}/${b * b} + ${xT}/${a * a} = 1` : `${yT}/${a * a} + ${xT}/${b * b} = 1`;
  return {
    id: `gen.a2c-ellipses-3.${idx}`, generated: true, concepts: ["ellipses"], difficulty: 3, context: "abstract",
    prompt: `An ellipse has vertices at $${v1}$ and $${v2}$ and foci at $${f1}$ and $${f2}$. Write its standard-form equation.`,
    steps: [
      { instruction: `The center is the midpoint of the vertices. Give it as an ordered pair (a, b).`, answer: `(${h}, ${k})`, accept: [], hint: `Average the coordinates of $${v1}$ and $${v2}$.` },
      { instruction: `What is $a$, the distance from the center to a vertex? (Give a number.)`, answer: `${a}`, accept: [], hint: `From $(${h}, ${k})$ to $${v2}$ is $${a}$ units.` },
      { instruction: `What is $c$, the distance from the center to a focus? (Give a number.)`, answer: `${c}`, accept: [], hint: `From $(${h}, ${k})$ to $${f2}$ is $${c}$ units.` },
      { instruction: `Compute $b^2 = a^2 - c^2$. (Give a number.)`, answer: `${b * b}`, accept: [], hint: `$${a * a} - ${c * c} = ${b * b}$.` },
      { instruction: `Write the equation (like (x - 1)^2/25 + (y - 2)^2/16 = 1, with $a^2$ under the ${horiz ? "x" : "y"}-term since the major axis is ${horiz ? "horizontal" : "vertical"}).`, answer: eq, accept: [eqSwap], hint: `Center $(${h}, ${k})$; $a^2 = ${a * a}$ goes under ${horiz ? `$(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})^2$` : `$(y ${k > 0 ? "-" : "+"} ${Math.abs(k)})^2$`}, $b^2 = ${b * b}$ under the other.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `The center is the midpoint $(${h}, ${k})$; $a = ${a}$ (center to vertex) and $c = ${c}$ (center to focus) give $b^2 = ${a * a} - ${c * c} = ${b * b}$. The major axis is ${horiz ? "horizontal" : "vertical"}, so $a^2$ goes under the ${horiz ? "x" : "y"}-term: $${eq}$.`,
  };
};

// ===========================================================================
// concept: hyperbolas
// ===========================================================================
fill["a2c-hyperbolas-1"] = (rng, idx) => {
  const kind = rng.pick(["circle", "ellipse", "parabola", "hyperbola"]);
  const h = nz(rng, -4, 4), k = nz(rng, -4, 4);
  let A, C, D, E, F, why;
  if (kind === "circle") {
    A = rng.int(1, 3); C = A; const r = rng.int(1, 4);
    D = -2 * A * h; E = -2 * A * k; F = A * (h * h + k * k - r * r);
    why = "the $x^2$ and $y^2$ coefficients are EQUAL";
  } else if (kind === "ellipse") {
    A = rng.int(1, 3); C = A + rng.int(1, 4); const M = A * C;
    D = -2 * A * h; E = -2 * C * k; F = A * h * h + C * k * k - M;
    why = "the $x^2$ and $y^2$ coefficients have the SAME sign but DIFFERENT values";
  } else if (kind === "hyperbola") {
    A = rng.int(1, 3); C = -rng.int(1, 4); const M = A * (-C);
    D = -2 * A * h; E = -2 * C * k; F = A * h * h + C * k * k - M;
    why = "the $x^2$ and $y^2$ coefficients have OPPOSITE signs";
  } else { // parabola
    A = rng.int(1, 3); C = 0; const Ecoef = nz(rng, -4, 4);
    D = -2 * A * h; E = -Ecoef; F = A * h * h + Ecoef * k;
    why = "only ONE variable is squared";
  }
  const eq = generalForm(A, C, D, E, F);
  return {
    id: `gen.a2c-hyperbolas-1.${idx}`, generated: true, concepts: ["hyperbolas"], difficulty: 1, context: "abstract",
    prompt: `Classify the conic $${eq}$ by comparing the coefficients of the squared terms.`,
    steps: [
      { instruction: `What is the coefficient of $x^2$? (Give a number.)`, answer: `${A}`, accept: [], hint: `Read it straight off the $x^2$ term${A === 1 ? " — an invisible coefficient is 1" : ""}.` },
      { instruction: `What is the coefficient of $y^2$? (Give a number — use 0 if there is no $y^2$ term.)`, answer: `${C}`, accept: [], hint: C === 0 ? `There is no $y^2$ term at all.` : `Include its sign.` },
      { instruction: `Equal coefficients: circle. Same sign, different values: ellipse. Opposite signs: hyperbola. Only one square: parabola. Which is this? (Answer 'circle', 'ellipse', 'parabola', or 'hyperbola'.)`, answer: kind, accept: [], hint: `Here ${why}.` },
    ],
    finalAnswer: { value: kind, unit: "" },
    solutionNarrative: `The squared-term coefficients are $${A}$ and $${C}$: ${why}, so this is a ${kind}. No graphing needed — the classification lives entirely in those two coefficients.`,
  };
};
fill["a2c-hyperbolas-2"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES); // c^2 = a^2 + b^2 perfect
  const horiz = rng.int(0, 1) === 1;
  const eq = horiz ? `\\dfrac{x^2}{${a * a}} - \\dfrac{y^2}{${b * b}} = 1` : `\\dfrac{y^2}{${a * a}} - \\dfrac{x^2}{${b * b}} = 1`;
  const orient = horiz ? "horizontal" : "vertical";
  const vertex = horiz ? `(${a}, 0)` : `(0, ${a})`;
  const sNum = horiz ? b : a, sDen = horiz ? a : b;
  const g = gcd(sNum, sDen);
  const slope = `${sNum / g}/${sDen / g}`;
  const R = c + 2;
  return {
    id: `gen.a2c-hyperbolas-2.${idx}`, generated: true, concepts: ["hyperbolas"], difficulty: 2, context: "abstract",
    prompt: `Analyze the hyperbola $${eq}$: orientation, vertices, foci (via $c^2 = a^2 + b^2$ — for a hyperbola, ADD), and asymptote slopes.`,
    steps: [
      { instruction: `The POSITIVE term is the ${horiz ? "$x^2$" : "$y^2$"} term. Does the hyperbola open left-right (horizontal) or up-down (vertical)? (Answer 'horizontal' or 'vertical'.)`, answer: orient, accept: [horiz ? "left-right" : "up-down"], hint: `The hyperbola opens along the variable of the positive term.` },
      { instruction: `The vertices are $a = \\sqrt{${a * a}}$ units from the center along that axis. Give the vertex with a positive coordinate as an ordered pair (a, b).`, answer: vertex, accept: [], hint: `$a = ${a}$, along the ${horiz ? "x" : "y"}-axis.` },
      { instruction: `Compute $c^2 = a^2 + b^2 = ${a * a} + ${b * b}$. (Give a number.)`, answer: `${c * c}`, accept: [], hint: `For hyperbolas the foci are OUTSIDE the vertices, so $c^2$ is a sum, not a difference.` },
      { instruction: `What is $c$? (Give a number.)`, answer: `${c}`, accept: [], hint: `$\\sqrt{${c * c}} = ${c}$.` },
      { instruction: `The asymptotes are $y = \\pm\\frac{${horiz ? "b" : "a"}}{${horiz ? "a" : "b"}}x$. Give the positive slope as a fraction or decimal.`, answer: slope, accept: [rnd(sNum / sDen, 4)], hint: `${horiz ? `$b/a = ${b}/${a}$` : `$a/b = ${a}/${b}$`}${g > 1 ? `, which reduces to $${slope}$` : ""}.` },
    ],
    finalAnswer: { value: `vertices ${horiz ? `(±${a}, 0)` : `(0, ±${a})`}, foci ${horiz ? `(±${c}, 0)` : `(0, ±${c})`}, slopes ±${slope}`, unit: "" },
    solutionNarrative: `The positive ${horiz ? "$x^2$" : "$y^2$"} term makes it ${orient}: vertices $${horiz ? `(\\pm${a}, 0)` : `(0, \\pm${a})`}$, and $c^2 = ${a * a} + ${b * b} = ${c * c}$ puts the foci at $${horiz ? `(\\pm${c}, 0)` : `(0, \\pm${c})`}$. The asymptotes have slopes $\\pm${slope}$.`,
    plot: {
      type: "cartesian", xRange: [-R, R], yRange: [-R, R], grid: true,
      segments: [
        { from: [-R, -R * sNum / sDen], to: [R, R * sNum / sDen], dashed: true, color: "dim" },
        { from: [-R, R * sNum / sDen], to: [R, -R * sNum / sDen], dashed: true, color: "dim" },
      ],
      points: [
        ...hyperbolaPts(a, b, horiz, f2(Math.min(R, b * Math.sqrt((R * R) / (a * a) - 1)))),
        ...(horiz
          ? [{ x: a, y: 0, label: "vertex", color: "success" }, { x: -a, y: 0, color: "success" }, { x: c, y: 0, label: "focus", color: "warn" }, { x: -c, y: 0, color: "warn" }]
          : [{ x: 0, y: a, label: "vertex", color: "success" }, { x: 0, y: -a, color: "success" }, { x: 0, y: c, label: "focus", color: "warn" }, { x: 0, y: -c, color: "warn" }]),
      ],
      caption: `A ${orient} hyperbola with a = ${a}, b = ${b}: asymptote slopes ±${slope}`,
    },
  };
};
fill["a2c-hyperbolas-3"] = (rng, idx) => {
  const [a, b, c] = rng.pick(TRIPLES); // b^2 = c^2 - a^2 perfect
  const h = nz(rng, -5, 5), k = nz(rng, -5, 5);
  const horiz = rng.int(0, 1) === 1;
  const v1 = horiz ? `(${h - a}, ${k})` : `(${h}, ${k - a})`;
  const v2 = horiz ? `(${h + a}, ${k})` : `(${h}, ${k + a})`;
  const f1 = horiz ? `(${h - c}, ${k})` : `(${h}, ${k - c})`;
  const f2 = horiz ? `(${h + c}, ${k})` : `(${h}, ${k + c})`;
  const xT = shiftSq("x", h), yT = shiftSq("y", k);
  const eq = horiz ? `${xT}/${a * a} - ${yT}/${b * b} = 1` : `${yT}/${a * a} - ${xT}/${b * b} = 1`;
  const eqSwap = horiz ? `-${yT}/${b * b} + ${xT}/${a * a} = 1` : `-${xT}/${b * b} + ${yT}/${a * a} = 1`;
  return {
    id: `gen.a2c-hyperbolas-3.${idx}`, generated: true, concepts: ["hyperbolas"], difficulty: 3, context: "abstract",
    prompt: `A hyperbola has vertices at $${v1}$ and $${v2}$ and foci at $${f1}$ and $${f2}$. Write its standard-form equation.`,
    steps: [
      { instruction: `The center is the midpoint of the vertices. Give it as an ordered pair (a, b).`, answer: `(${h}, ${k})`, accept: [], hint: `Average the coordinates of $${v1}$ and $${v2}$.` },
      { instruction: `What is $a$, the distance from the center to a vertex? (Give a number.)`, answer: `${a}`, accept: [], hint: `From $(${h}, ${k})$ to $${v2}$.` },
      { instruction: `What is $c$, the distance from the center to a focus? (Give a number.)`, answer: `${c}`, accept: [], hint: `From $(${h}, ${k})$ to $${f2}$ — for a hyperbola $c > a$, the foci sit OUTSIDE the vertices.` },
      { instruction: `Compute $b^2 = c^2 - a^2$. (Give a number.)`, answer: `${b * b}`, accept: [], hint: `$${c * c} - ${a * a} = ${b * b}$ — for hyperbolas, $b^2$ comes from subtracting the other way around.` },
      { instruction: `The transverse axis is ${horiz ? "horizontal" : "vertical"}, so the ${horiz ? "x" : "y"}-term is positive. Write the equation (like (x - 1)^2/9 - (y - 2)^2/16 = 1).`, answer: eq, accept: [eqSwap], hint: `$a^2 = ${a * a}$ under the positive ${horiz ? `$(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})^2$` : `$(y ${k > 0 ? "-" : "+"} ${Math.abs(k)})^2$`} term; subtract the other term over $b^2 = ${b * b}$.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `The center is $(${h}, ${k})$; $a = ${a}$ and $c = ${c}$ give $b^2 = ${c * c} - ${a * a} = ${b * b}$. The vertices run ${horiz ? "horizontally" : "vertically"}, so the ${horiz ? "x" : "y"}-term is the positive one: $${eq}$.`,
  };
};
