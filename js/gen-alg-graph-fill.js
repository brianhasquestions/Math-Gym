// gen-alg-graph-fill.js
// Parametric generators for the algebra.graphing-linear-equations topic,
// covering every keyConcept at difficulty 1, 2, AND 3 so the adaptive engine
// always has fresh problems at every tier. Self-contained pack: exports a
// `fill` map of template-name -> (rng, idx) => problem, matching the shape
// used by js/generator.js's `generators` map (same pattern as gen-de-fill.js
// and gen-linalg-fill.js). No imports from generator.js — own helper copies.

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const nz = (rng, lo, hi) => { const v = rng.int(lo, hi); return v === 0 ? hi : v; };
const frac = (n, d) => { if (d < 0) { n = -n; d = -d; } if (n === 0) return "0"; const g = gcd(n, d) || 1; n /= g; d /= g; return d === 1 ? `${n}` : `${n}/${d}`; };
// Format y = mx + b nicely: handles m = 1/-1 and negative b.
const xterm = (m) => (m === 1 ? "x" : m === -1 ? "-x" : `${m}x`);
const fmtLine = (m, b) => (b === 0 ? `y = ${xterm(m)}` : `y = ${xterm(m)} ${b < 0 ? "-" : "+"} ${Math.abs(b)}`);
const squash = (s) => s.replace(/ /g, "");
const pair = (x, y) => `(${x}, ${y})`;
const QUAD_ACCEPT = { 1: ["I", "one", "first", "quadrant 1"], 2: ["II", "two", "second", "quadrant 2"], 3: ["III", "three", "third", "quadrant 3"], 4: ["IV", "four", "fourth", "quadrant 4"] };

export const fill = {};

// ============================================================================
// plot-points
// ============================================================================

const MAP_PLACES = ["library", "café", "pharmacy", "bakery", "hardware store", "bus stop"];

// d1: plot a described point (both coordinates positive), name its quadrant.
fill["agr-plot-points-d1"] = (rng, idx) => {
  const place = rng.pick(MAP_PLACES);
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  return {
    id: `gen.agr-plot-points-d1.${idx}`, generated: true, concepts: ["plot-points"], difficulty: 1, context: "applied",
    prompt: `On a city map, city hall sits at the origin $(0, 0)$. The ${place} is ${a} blocks east and ${b} blocks north. (East is the positive $x$ direction, north is positive $y$.)`,
    steps: [
      { instruction: `Write the ${place}'s location as an ordered pair $(x, y)$.`, answer: pair(a, b), accept: [`(${a},${b})`], hint: "East gives the x-coordinate, north gives the y-coordinate." },
      { instruction: "Which quadrant of the coordinate plane is that point in? (Give the quadrant number, 1–4.)", answer: "1", accept: QUAD_ACCEPT[1], hint: "Both coordinates are positive — upper right." },
    ],
    finalAnswer: { value: pair(a, b), unit: "" },
    solutionNarrative: `East is $x$ and north is $y$, so the ${place} is at $(${a}, ${b})$. Both coordinates are positive, so it is in quadrant I.`,
  };
};

// d2: signed coordinates from a left/right + up/down description, plus quadrant.
fill["agr-plot-points-d2"] = (rng, idx) => {
  const q = rng.pick([2, 3, 4]);
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const x = q === 4 ? a : -a;
  const y = q === 2 ? b : -b;
  const dirx = x < 0 ? "left" : "right";
  const diry = y < 0 ? "down" : "up";
  return {
    id: `gen.agr-plot-points-d2.${idx}`, generated: true, concepts: ["plot-points"], difficulty: 2, context: "abstract",
    prompt: `Starting at the origin, a point is plotted ${a} units ${dirx} and ${b} units ${diry}.`,
    steps: [
      { instruction: "Write the point as an ordered pair $(x, y)$. Mind the signs.", answer: pair(x, y), accept: [`(${x},${y})`], hint: `Left is negative $x$, right is positive $x$; down is negative $y$, up is positive $y$.` },
      { instruction: "Which quadrant is the point in? (Give the quadrant number.)", answer: `${q}`, accept: QUAD_ACCEPT[q], hint: "Quadrants are numbered I–IV counterclockwise from the upper right." },
    ],
    finalAnswer: { value: pair(x, y), unit: "" },
    solutionNarrative: `${a} units ${dirx} gives $x = ${x}$ and ${b} units ${diry} gives $y = ${y}$, so the point is $(${x}, ${y})$, in quadrant ${["", "I", "II", "III", "IV"][q]}.`,
  };
};

// d3: fourth vertex of an axis-aligned rectangle + its dimensions.
fill["agr-plot-points-d3"] = (rng, idx) => {
  const x1 = rng.int(-5, 2);
  const w = rng.int(2, 7);
  const y1 = rng.int(-5, 2);
  let h = rng.int(2, 7);
  if (h === w) h = h === 7 ? 6 : h + 1; // avoid a square so width/height are distinct answers
  const x2 = x1 + w, y2 = y1 + h;
  return {
    id: `gen.agr-plot-points-d3.${idx}`, generated: true, concepts: ["plot-points"], difficulty: 3, context: "abstract",
    prompt: `Three corners of a rectangle (sides parallel to the axes) are plotted at $(${x1}, ${y1})$, $(${x2}, ${y1})$, and $(${x2}, ${y2})$.`,
    steps: [
      { instruction: "Write the fourth corner as an ordered pair.", answer: pair(x1, y2), accept: [`(${x1},${y2})`], hint: `It must share its x-coordinate with $(${x1}, ${y1})$ and its y-coordinate with $(${x2}, ${y2})$.` },
      { instruction: "How wide is the rectangle (horizontal side length)?", answer: `${w}`, accept: [], hint: `Subtract the two distinct x-coordinates: $${x2} - (${x1})$.` },
      { instruction: "How tall is the rectangle (vertical side length)?", answer: `${h}`, accept: [], hint: `Subtract the two distinct y-coordinates: $${y2} - (${y1})$.` },
    ],
    finalAnswer: { value: pair(x1, y2), unit: "" },
    solutionNarrative: `The missing corner lines up vertically with $(${x1}, ${y1})$ and horizontally with $(${x2}, ${y2})$: it is $(${x1}, ${y2})$. Width $= ${x2} - (${x1}) = ${w}$, height $= ${y2} - (${y1}) = ${h}$.`,
  };
};

// ============================================================================
// slope-from-points
// ============================================================================

// d1: positive integer slope from two friendly points.
fill["agr-slope-two-points-d1"] = (rng, idx) => {
  const x1 = rng.int(0, 4);
  const dx = rng.int(2, 4);
  const y1 = rng.int(0, 6);
  const m = rng.int(2, 6);
  const x2 = x1 + dx, y2 = y1 + m * dx;
  return {
    id: `gen.agr-slope-two-points-d1.${idx}`, generated: true, concepts: ["slope-from-points"], difficulty: 1, context: "abstract",
    prompt: `Find the slope of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    steps: [
      { instruction: "Compute the rise, $y_2 - y_1$.", answer: `${m * dx}`, accept: [], hint: `$${y2} - ${y1}$.` },
      { instruction: "Compute the run, $x_2 - x_1$.", answer: `${dx}`, accept: [], hint: `$${x2} - ${x1}$.` },
      { instruction: "Divide rise by run to get the slope $m$.", answer: `${m}`, accept: [`${m * dx}/${dx}`, `m=${m}`], hint: `$m = ${m * dx}/${dx}$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `Rise $= ${y2} - ${y1} = ${m * dx}$, run $= ${x2} - ${x1} = ${dx}$, so $m = ${m * dx}/${dx} = ${m}$.`,
  };
};

// d2: applied steady rate — slope of a real-world data line.
const RATE_CTX = [
  { thing: "A hiker's trail log", yname: "miles from the trailhead", xname: "hours", unit: "miles per hour", lo: 2, hi: 4 },
  { thing: "A freelancer's invoice tracker", yname: "dollars billed", xname: "hours", unit: "dollars per hour", lo: 20, hi: 60 },
  { thing: "A bamboo growth chart", yname: "centimeters tall", xname: "weeks", unit: "centimeters per week", lo: 5, hi: 12 },
  { thing: "A road-trip odometer log", yname: "miles driven", xname: "hours", unit: "miles per hour", lo: 45, hi: 65 },
];
fill["agr-slope-two-points-d2"] = (rng, idx) => {
  const ctx = rng.pick(RATE_CTX);
  const r = rng.int(ctx.lo, ctx.hi);
  const t1 = rng.int(1, 3);
  const dt = rng.int(2, 4);
  const y1 = rng.int(2, 9) * (ctx.hi > 20 ? 5 : 1);
  const t2 = t1 + dt, y2 = y1 + r * dt;
  return {
    id: `gen.agr-slope-two-points-d2.${idx}`, generated: true, concepts: ["slope-from-points"], difficulty: 2, context: "applied",
    prompt: `${ctx.thing} records points $(\\text{${ctx.xname}}, \\text{${ctx.yname}})$: at ${t1} ${ctx.xname} the reading is ${y1}, and at ${t2} ${ctx.xname} it is ${y2}, changing at a steady rate.`,
    steps: [
      { instruction: `By how much did the ${ctx.yname} reading change between the two points?`, answer: `${r * dt}`, accept: [], hint: `$${y2} - ${y1}$.` },
      { instruction: `Over how many ${ctx.xname} did that change happen?`, answer: `${dt}`, accept: [], hint: `$${t2} - ${t1}$.` },
      { instruction: `The slope of this line is the rate. What is it, in ${ctx.unit}?`, answer: `${r}`, accept: [`${r * dt}/${dt}`, `m=${r}`], hint: "Slope = rise/run = change in reading ÷ change in time." },
    ],
    finalAnswer: { value: `${r}`, unit: ctx.unit },
    solutionNarrative: `Rise $= ${y2} - ${y1} = ${r * dt}$; run $= ${t2} - ${t1} = ${dt}$; slope $= ${r * dt}/${dt} = ${r}$ ${ctx.unit}. On this graph, the slope is the rate.`,
  };
};

// d3: mixed special cases — vertical (undefined), horizontal (0), or a
// negative fraction slope in lowest terms.
const FRAC_PAIRS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
fill["agr-slope-two-points-d3"] = (rng, idx) => {
  const kind = rng.pick(["vertical", "horizontal", "negfrac"]);
  const base = {
    id: `gen.agr-slope-two-points-d3.${idx}`, generated: true, concepts: ["slope-from-points"], difficulty: 3, context: "abstract",
  };
  if (kind === "vertical") {
    const c = nz(rng, -6, 6), ya = rng.int(-5, 2), yb = ya + rng.int(3, 8);
    return { ...base,
      prompt: `Find the slope of the line through $(${c}, ${ya})$ and $(${c}, ${yb})$.`,
      steps: [
        { instruction: "Compute the run, $x_2 - x_1$.", answer: "0", accept: [], hint: `$${c} - (${c})$.` },
        { instruction: "Is the line horizontal, vertical, or slanted?", answer: "vertical", accept: [], hint: "Both points share the same x-coordinate." },
        { instruction: "What is the slope? (Give a number, or type 'undefined'.)", answer: "undefined", accept: ["no slope", "dne", "none"], hint: "The slope formula would divide by a run of 0." },
      ],
      finalAnswer: { value: "undefined", unit: "" },
      solutionNarrative: `The run is $${c} - (${c}) = 0$, so the line is vertical and its slope is undefined — you cannot divide by zero.`,
    };
  }
  if (kind === "horizontal") {
    const c = nz(rng, -6, 6), xa = rng.int(-5, 2), xb = xa + rng.int(3, 8);
    return { ...base,
      prompt: `Find the slope of the line through $(${xa}, ${c})$ and $(${xb}, ${c})$.`,
      steps: [
        { instruction: "Compute the rise, $y_2 - y_1$.", answer: "0", accept: [], hint: `$${c} - (${c})$.` },
        { instruction: "Is the line horizontal, vertical, or slanted?", answer: "horizontal", accept: [], hint: "Both points share the same y-coordinate." },
        { instruction: "What is the slope?", answer: "0", accept: ["zero"], hint: `A rise of 0 over a run of ${xb - xa} is just $0$ — a real number, unlike a vertical line's slope.` },
      ],
      finalAnswer: { value: "0", unit: "" },
      solutionNarrative: `The rise is $0$ over a run of $${xb - xa}$, so the slope is $0$: the line is horizontal. (Zero slope and undefined slope are different things.)`,
    };
  }
  // negfrac: slope = -p/q in lowest terms, points crossing sign boundaries.
  const [p, q] = rng.pick(FRAC_PAIRS);
  const k = rng.pick([1, 2]);
  const x1 = rng.int(-4, 0), y1 = rng.int(1, 5);
  const x2 = x1 + q * k, y2 = y1 - p * k;
  const dec = (100 * p) % q === 0 ? `${-p / q}` : null;
  return { ...base,
    prompt: `Find the slope of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
    steps: [
      { instruction: "Compute the rise, $y_2 - y_1$.", answer: `${y2 - y1}`, accept: [], hint: `$${y2} - ${y1}$ — the line falls, so this is negative.` },
      { instruction: "Compute the run, $x_2 - x_1$.", answer: `${q * k}`, accept: [], hint: `$${x2} - (${x1})$.` },
      { instruction: "Write the slope as a fraction in lowest terms.", answer: frac(y2 - y1, q * k), accept: [`${y2 - y1}/${q * k}`, ...(dec ? [dec] : [])], hint: `$m = ${y2 - y1}/${q * k}$; reduce.` },
    ],
    finalAnswer: { value: frac(y2 - y1, q * k), unit: "" },
    solutionNarrative: `Rise $= ${y2} - ${y1} = ${y2 - y1}$; run $= ${x2} - (${x1}) = ${q * k}$; slope $= ${frac(y2 - y1, q * k)}$. The line drops ${p} for every ${q} it moves right.`,
  };
};

// ============================================================================
// slope-intercept-form
// ============================================================================

// d1: read m and b straight off an equation; name the crossing point.
fill["agr-slope-intercept-d1"] = (rng, idx) => {
  const m = nz(rng, -8, 8);
  const b = nz(rng, -9, 9);
  const line = fmtLine(m, b);
  return {
    id: `gen.agr-slope-intercept-d1.${idx}`, generated: true, concepts: ["slope-intercept-form"], difficulty: 1, context: "abstract",
    prompt: `Consider the line $${line}$.`,
    steps: [
      { instruction: "What is the slope of the line?", answer: `${m}`, accept: [`m=${m}`], hint: "In $y = mx + b$, the slope is the coefficient of $x$." },
      { instruction: "What is the y-intercept (as a number)?", answer: `${b}`, accept: [`b=${b}`], hint: "The constant term $b$ — mind the sign." },
      { instruction: "Write the point where the line crosses the y-axis as an ordered pair.", answer: pair(0, b), accept: [`(0,${b})`], hint: "The line crosses the y-axis where $x = 0$." },
    ],
    finalAnswer: { value: `slope ${m}, y-intercept ${b}`, unit: "" },
    solutionNarrative: `Matching $${line}$ against $y = mx + b$: slope $m = ${m}$ and y-intercept $b = ${b}$, so the line crosses the y-axis at $(0, ${b})$.`,
  };
};

// d2: applied — write the cost line from a rate plus a flat fee, then use it.
const FEE_CTX = [
  { who: "An electrician", fee: "service-call fee", per: "per hour of work", xIs: "hours", rlo: 9, rhi: 18, flo: 7, fhi: 19, scale: 5 },
  { who: "A moving company", fee: "truck fee", per: "per hour of labor", xIs: "hours", rlo: 8, rhi: 16, flo: 10, fhi: 24, scale: 5 },
  { who: "A ride service", fee: "pickup fee", per: "per mile", xIs: "miles", rlo: 2, rhi: 4, flo: 3, fhi: 6, scale: 1 },
  { who: "A tutoring service", fee: "registration fee", per: "per session", xIs: "sessions", rlo: 5, rhi: 12, flo: 4, fhi: 10, scale: 5 },
];
fill["agr-slope-intercept-d2"] = (rng, idx) => {
  const ctx = rng.pick(FEE_CTX);
  const rate = rng.int(ctx.rlo, ctx.rhi) * ctx.scale;
  const fee = rng.int(ctx.flo, ctx.fhi) * ctx.scale;
  const x0 = rng.int(2, 5);
  const total = rate * x0 + fee;
  return {
    id: `gen.agr-slope-intercept-d2.${idx}`, generated: true, concepts: ["slope-intercept-form"], difficulty: 2, context: "applied",
    prompt: `${ctx.who} charges a \\$${fee} ${ctx.fee} plus \\$${rate} ${ctx.per}. Let $y$ be the total cost for $x$ ${ctx.xIs}.`,
    steps: [
      { instruction: `What is the slope of this cost line (the rate ${ctx.per})?`, answer: `${rate}`, accept: [`m=${rate}`], hint: "The slope is how much the total grows per unit." },
      { instruction: "What is the y-intercept (the cost before anything happens)?", answer: `${fee}`, accept: [`b=${fee}`], hint: "The cost at $x = 0$." },
      { instruction: "Write the equation of the line in slope-intercept form.", answer: `y = ${rate}x + ${fee}`, accept: [`y=${rate}x+${fee}`, `y=${fee}+${rate}x`], hint: "$y = mx + b$ with your rate and fee." },
      { instruction: `Use the equation to find the total cost for ${x0} ${ctx.xIs}, in dollars.`, answer: `${total}`, accept: [`$${total}`, `y=${total}`], hint: `Substitute $x = ${x0}$: $${rate}(${x0}) + ${fee}$.` },
    ],
    finalAnswer: { value: `y = ${rate}x + ${fee}`, unit: "" },
    solutionNarrative: `The rate is the slope ($m = ${rate}$) and the flat fee is the starting value ($b = ${fee}$), so $y = ${rate}x + ${fee}$. At $x = ${x0}$: $${rate}(${x0}) + ${fee} = ${total}$ dollars.`,
  };
};

// d3: equation of the line through two points (integer slope by construction).
fill["agr-slope-intercept-d3"] = (rng, idx) => {
  const m = rng.pick([-4, -3, -2, 2, 3, 4]);
  const b = nz(rng, -8, 8);
  const x1 = rng.int(-3, 1);
  const dx = rng.int(2, 4);
  const x2 = x1 + dx;
  const y1 = m * x1 + b, y2 = m * x2 + b;
  const line = fmtLine(m, b);
  return {
    id: `gen.agr-slope-intercept-d3.${idx}`, generated: true, concepts: ["slope-intercept-form"], difficulty: 3, context: "abstract",
    prompt: `Write the equation of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$ in slope-intercept form.`,
    steps: [
      { instruction: "Compute the slope.", answer: `${m}`, accept: [`${y2 - y1}/${dx}`, `m=${m}`], hint: `$m = (${y2} - (${y1}))/(${x2} - (${x1}))$.` },
      { instruction: "Substitute one of the points into $y = mx + b$ and solve for $b$.", answer: `${b}`, accept: [`b=${b}`], hint: `Using $(${x1}, ${y1})$: $${y1} = ${m}(${x1}) + b$.` },
      { instruction: "Write the equation of the line.", answer: line, accept: [squash(line)], hint: "$y = mx + b$ with your values." },
    ],
    finalAnswer: { value: line, unit: "" },
    solutionNarrative: `Slope $= (${y2} - (${y1}))/(${x2} - (${x1})) = ${y2 - y1}/${dx} = ${m}$. Then $${y1} = ${m}(${x1}) + b$ gives $b = ${b}$, so the line is $${line}$. Check with the other point: $${m}(${x2}) ${b < 0 ? "-" : "+"} ${Math.abs(b)} = ${y2}$. ✓`,
  };
};

// ============================================================================
// intercepts-and-graphing
// ============================================================================

// d1: both intercepts of y = -kx + b with a clean x-intercept.
fill["agr-intercepts-d1"] = (rng, idx) => {
  const k = rng.int(2, 6);
  const xi = rng.int(2, 8);
  const b = k * xi;
  const line = fmtLine(-k, b);
  return {
    id: `gen.agr-intercepts-d1.${idx}`, generated: true, concepts: ["intercepts-and-graphing"], difficulty: 1, context: "abstract",
    prompt: `Find both intercepts of the line $${line}$.`,
    steps: [
      { instruction: "What is $y$ when $x = 0$ (the y-intercept)?", answer: `${b}`, accept: [`y=${b}`, `b=${b}`], hint: "Substitute $x = 0$; only the constant survives." },
      { instruction: "Set $y = 0$ and solve for $x$.", answer: `${xi}`, accept: [`x=${xi}`], hint: `$0 = -${k}x + ${b}$, so $${k}x = ${b}$.` },
      { instruction: "Write the x-intercept as an ordered pair.", answer: pair(xi, 0), accept: [`(${xi},0)`], hint: "It sits on the x-axis, so its y-coordinate is 0." },
    ],
    finalAnswer: { value: `(${xi}, 0) and (0, ${b})`, unit: "" },
    solutionNarrative: `At $x = 0$, $y = ${b}$: the y-intercept is $(0, ${b})$. Setting $y = 0$: $${k}x = ${b}$, so $x = ${xi}$ and the x-intercept is $(${xi}, 0)$. Those two points draw the whole line.`,
  };
};

// d2: intercepts of a standard-form line Ax + By = C with integer intercepts.
fill["agr-intercepts-d2"] = (rng, idx) => {
  const xi = rng.int(2, 6);
  let yi = rng.int(2, 6);
  if (yi === xi) yi = yi === 6 ? 5 : yi + 1; // distinct intercepts read better
  const g = gcd(xi, yi);
  const A = yi / g, B = xi / g, C = (xi * yi) / g;
  return {
    id: `gen.agr-intercepts-d2.${idx}`, generated: true, concepts: ["intercepts-and-graphing"], difficulty: 2, context: "abstract",
    prompt: `Find both intercepts of the line $${A}x + ${B}y = ${C}$ and use them to graph it.`,
    steps: [
      { instruction: "Set $x = 0$ and solve for $y$.", answer: `${yi}`, accept: [`y=${yi}`], hint: `$${B}y = ${C}$.` },
      { instruction: "Write the y-intercept as an ordered pair.", answer: pair(0, yi), accept: [`(0,${yi})`], hint: "On the y-axis, $x = 0$." },
      { instruction: "Set $y = 0$ and solve for $x$.", answer: `${xi}`, accept: [`x=${xi}`], hint: `$${A}x = ${C}$.` },
      { instruction: "Write the x-intercept as an ordered pair.", answer: pair(xi, 0), accept: [`(${xi},0)`], hint: "On the x-axis, $y = 0$." },
    ],
    finalAnswer: { value: `(${xi}, 0) and (0, ${yi})`, unit: "" },
    solutionNarrative: `With $x = 0$: $${B}y = ${C}$, so the y-intercept is $(0, ${yi})$. With $y = 0$: $${A}x = ${C}$, so the x-intercept is $(${xi}, 0)$. Plot both points and connect — two points make the line.`,
  };
};

// d3: applied draining/run-out model — interpret both intercepts and the slope.
const DRAIN_CTX = [
  { thing: "water tank", q: "volume", sym: "V", unit: "gallons", tunit: "minutes", verb: "drains" },
  { thing: "phone battery", q: "charge", sym: "B", unit: "percent", tunit: "hours", verb: "discharges" },
  { thing: "campaign fund", q: "balance", sym: "F", unit: "dollars", tunit: "weeks", verb: "is spent down" },
  { thing: "propane tank", q: "fuel level", sym: "P", unit: "pounds", tunit: "days", verb: "burns down" },
];
fill["agr-intercepts-d3"] = (rng, idx) => {
  const ctx = rng.pick(DRAIN_CTX);
  const r = rng.int(2, 9) * (ctx.unit === "dollars" ? 10 : 5);
  const T = rng.int(4, 12);
  const V0 = r * T;
  const S = ctx.sym;
  return {
    id: `gen.agr-intercepts-d3.${idx}`, generated: true, concepts: ["intercepts-and-graphing"], difficulty: 3, context: "applied",
    prompt: `A ${ctx.thing} ${ctx.verb} at a steady rate. Its ${ctx.q} after $t$ ${ctx.tunit} is $${S} = ${V0} - ${r}t$ (in ${ctx.unit}).`,
    steps: [
      { instruction: `What is the ${ctx.q} at $t = 0$ (the ${S}-intercept)?`, answer: `${V0}`, accept: [`${S}=${V0}`], hint: "Substitute $t = 0$ — that's the starting value." },
      { instruction: `Set $${S} = 0$ and solve: after how many ${ctx.tunit} does the ${ctx.thing} hit zero?`, answer: `${T}`, accept: [`t=${T}`], hint: `$${V0} - ${r}t = 0$, so $${r}t = ${V0}$.` },
      { instruction: `Write that run-out point as an ordered pair $(t, ${S})$.`, answer: pair(T, 0), accept: [`(${T},0)`], hint: "It is the t-intercept — the moment the quantity reaches zero." },
      { instruction: "What is the slope of this line, including its sign?", answer: `${-r}`, accept: [`m=${-r}`], hint: `The ${ctx.q} changes by how many ${ctx.unit} per ${ctx.tunit.replace(/s$/, "")}? Decreasing means negative.` },
    ],
    finalAnswer: { value: `${T}`, unit: ctx.tunit },
    solutionNarrative: `The intercepts tell the story: the ${ctx.thing} starts at $(0, ${V0})$ — ${V0} ${ctx.unit} — and empties at $(${T}, 0)$, since $${V0} - ${r}t = 0$ gives $t = ${T}$. The slope $-${r}$ is the drain rate in ${ctx.unit} per ${ctx.tunit.replace(/s$/, "")}.`,
  };
};
