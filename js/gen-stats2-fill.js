// gen-stats2-fill.js
// Parametric generators for the Statistics subject, topics
//   statistics.confidence-intervals
//   statistics.hypothesis-testing
//   statistics.regression-correlation
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats-fill.js). Template prefix: st2-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every statistic emitted is
// computed in the generator itself, in integer arithmetic scaled by 10/100/1000,
// so printed decimals are exact strings and answers always self-check.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
// Round to `p` decimals and return a plain string (no trailing zeros beyond need).
const rnd = (x, p) => {
  const f = Math.pow(10, p);
  return `${Math.round(x * f) / f}`;
};
const sum = (a) => a.reduce((s, v) => s + v, 0);
// Exact decimal strings from integer numerators over a power-of-ten denominator.
const d10 = (v) => `${v / 10}`;
const d100 = (v) => `${v / 100}`;
const d1000 = (v) => `${v / 1000}`;
// Perfect-square sample sizes: [sqrt(n), n].
const ROOTS = [[5, 25], [6, 36], [8, 64], [10, 100]];
// Critical values. zT is z* in thousandths so products stay integers.
const CONF = [
  { level: 90, z: "1.645", zT: 1645 },
  { level: 95, z: "1.960", zT: 1960 },
  { level: 99, z: "2.576", zT: 2576 },
];
// Clean proportion setups: p-hat in hundredths, SE in thousandths
// (SE = sqrt(p(1-p)/n) exactly). All have pq/n a perfect square.
const PROPS = [
  { pH: 50, n: 100, seT: 50 },  // sqrt(0.25/100)  = 0.05
  { pH: 20, n: 100, seT: 40 },  // sqrt(0.16/100)  = 0.04
  { pH: 80, n: 100, seT: 40 },
  { pH: 90, n: 100, seT: 30 },  // sqrt(0.09/100)  = 0.03
  { pH: 10, n: 100, seT: 30 },
  { pH: 50, n: 400, seT: 25 },  // sqrt(0.25/400)  = 0.025
  { pH: 20, n: 400, seT: 20 },  // sqrt(0.16/400)  = 0.02
  { pH: 80, n: 400, seT: 20 },
];
// Regression toolkit: x deviations fixed at (-3,-1,1,3), so Sxx = 20. Each dy
// pattern also has Syy = 20, making r = Sxy/20 exact.
const DX = [-3, -1, 1, 3];
const DYS = [
  { dy: [-3, 1, -1, 3], sxy: 16 },   // r = 0.8
  { dy: [-1, -3, 3, 1], sxy: 12 },   // r = 0.6
  { dy: [3, -1, 1, -3], sxy: -16 },  // r = -0.8
  { dy: [1, 3, -3, -1], sxy: -12 },  // r = -0.6
];
// Format a regression line y = a + bx with signs handled (a, b exact decimals).
const lineEq = (aStr, bStr) => {
  const neg = bStr.startsWith("-");
  const bAbs = neg ? bStr.slice(1) : bStr;
  const bTxt = bAbs === "1" ? "" : bAbs;
  return `y = ${aStr} ${neg ? "-" : "+"} ${bTxt}x`;
};

export const fill = {};

// ===========================================================================
// TOPIC 1: statistics.confidence-intervals
//   concepts: standard-error-and-margin, ci-for-a-mean,
//             ci-for-a-proportion, interpretation-and-sample-size
// ===========================================================================

// --- standard-error-and-margin ---
fill["st2-margin-1"] = (rng, idx) => {
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(2, 6);
  const s = sq * k; // SE = k exactly
  return {
    id: `gen.st2-margin-1.${idx}`, generated: true, concepts: ["standard-error-and-margin"], difficulty: 1, context: "abstract",
    prompt: `A sample of $n = ${n}$ values has sample standard deviation $s = ${s}$. Find the standard error of the sample mean, $\\mathrm{SE} = \\dfrac{s}{\\sqrt{n}}$.`,
    steps: [
      { instruction: `Compute $\\sqrt{n} = \\sqrt{${n}}$. (Give a whole number.)`, answer: `${sq}`, accept: [`sqrt(${n})`], hint: `$${sq}^2 = ${n}$.` },
      { instruction: `Divide: $\\mathrm{SE} = \\dfrac{${s}}{${sq}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$${s} / ${sq}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\frac{s}{\\sqrt{n}} = \\frac{${s}}{\\sqrt{${n}}} = \\frac{${s}}{${sq}} = ${k}$. Averaging ${n} values shrinks the noise by a factor of ${sq}.`,
  };
};
fill["st2-margin-2"] = (rng, idx) => {
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(1, 4);
  const s = sq * k;                 // SE = k
  const mH = 196 * k;               // margin in hundredths: 1.96 * k
  const m = d100(mH);
  return {
    id: `gen.st2-margin-2.${idx}`, generated: true, concepts: ["standard-error-and-margin"], difficulty: 2, context: "applied",
    prompt: `A quality team samples $n = ${n}$ parts; the sample standard deviation is $s = ${s}$. For a 95% confidence interval, $z^* = 1.960$. Find the standard error, then the margin of error $m = z^* \\cdot \\mathrm{SE}$.`,
    steps: [
      { instruction: `Standard error: $\\mathrm{SE} = \\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$, then $${s}/${sq}$.` },
      { instruction: `Margin of error: $m = 1.96 \\times ${k}$. Give the exact value.`, answer: m, accept: [], hint: `$1.96 \\times ${k}$.` },
    ],
    finalAnswer: { value: m, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\frac{${s}}{${sq}} = ${k}$, so the margin of error is $m = 1.96 \\times ${k} = ${m}$ — the radius of the 95% interval.`,
  };
};
fill["st2-margin-3"] = (rng, idx) => {
  const conf = rng.pick([CONF[0], CONF[2]]); // 90% or 99%
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(2, 5);
  const s = sq * k;                 // SE = k
  const mT = conf.zT * k;           // margin in thousandths, exact
  const m = d1000(mT);
  return {
    id: `gen.st2-margin-3.${idx}`, generated: true, concepts: ["standard-error-and-margin"], difficulty: 3, context: "applied",
    prompt: `Battery lifetimes are sampled: $n = ${n}$, sample standard deviation $s = ${s}$ hours. Build the margin of error for a ${conf.level}% confidence interval. Use the table: 90% $\\to z^* = 1.645$, 95% $\\to z^* = 1.960$, 99% $\\to z^* = 2.576$.`,
    steps: [
      { instruction: `Standard error: $\\mathrm{SE} = \\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Which $z^*$ matches ${conf.level}% confidence? (Give the number from the table.)`, answer: conf.z, accept: [], hint: `Read the ${conf.level}% row.` },
      { instruction: `Margin of error: $m = ${conf.z} \\times ${k}$. Give the exact value.`, answer: m, accept: [], hint: `$${conf.z} \\times ${k}$.` },
    ],
    finalAnswer: { value: m, unit: "hours" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$; at ${conf.level}% confidence $z^* = ${conf.z}$, so $m = ${conf.z} \\times ${k} = ${m}$ hours. Higher confidence means a larger $z^*$ and a wider interval.`,
  };
};

// --- ci-for-a-mean ---
fill["st2-cimean-1"] = (rng, idx) => {
  const xbar = rng.int(40, 120);
  const m = rng.int(2, 9);
  return {
    id: `gen.st2-cimean-1.${idx}`, generated: true, concepts: ["ci-for-a-mean"], difficulty: 1, context: "abstract",
    prompt: `A sample gives $\\bar{x} = ${xbar}$ with margin of error $m = ${m}$. Build the confidence interval $\\bar{x} \\pm m$ by finding its two endpoints.`,
    steps: [
      { instruction: `Lower bound: $${xbar} - ${m}$. (Give a number.)`, answer: `${xbar - m}`, accept: [], hint: `Subtract the margin.` },
      { instruction: `Upper bound: $${xbar} + ${m}$. (Give a number.)`, answer: `${xbar + m}`, accept: [], hint: `Add the margin.` },
    ],
    finalAnswer: { value: `(${xbar - m}, ${xbar + m})`, unit: "" },
    solutionNarrative: `The interval is centered at $\\bar{x} = ${xbar}$ with radius ${m}: $(${xbar - m}, ${xbar + m})$.`,
  };
};
fill["st2-cimean-2"] = (rng, idx) => {
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(1, 3);
  const s = sq * k;
  const mH = 196 * k;
  const xbar = rng.int(50, 200);
  const loH = xbar * 100 - mH, hiH = xbar * 100 + mH;
  return {
    id: `gen.st2-cimean-2.${idx}`, generated: true, concepts: ["ci-for-a-mean"], difficulty: 2, context: "applied",
    prompt: `A machine fills bags; a sample of $n = ${n}$ bags has mean $\\bar{x} = ${xbar}$ g and standard deviation $s = ${s}$ g. Build a 95% confidence interval for the true mean weight ($z^* = 1.960$). Give exact values.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Margin of error: $1.96 \\times ${k}$. Give the exact value.`, answer: d100(mH), accept: [], hint: `$1.96 \\times ${k}$.` },
      { instruction: `Lower bound: $${xbar} - ${d100(mH)}$. Give the exact value.`, answer: d100(loH), accept: [], hint: `Subtract the margin from $\\bar{x}$.` },
      { instruction: `Upper bound: $${xbar} + ${d100(mH)}$. Give the exact value.`, answer: d100(hiH), accept: [], hint: `Add the margin to $\\bar{x}$.` },
    ],
    finalAnswer: { value: `(${d100(loH)}, ${d100(hiH)})`, unit: "g" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, margin $= 1.96(${k}) = ${d100(mH)}$, so the 95% CI is $${xbar} \\pm ${d100(mH)} = (${d100(loH)}, ${d100(hiH)})$ grams.`,
  };
};
fill["st2-cimean-3"] = (rng, idx) => {
  const conf = rng.pick([CONF[0], CONF[2]]);
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(1, 3);
  const s = sq * k;
  const mT = conf.zT * k;
  const xbar = rng.int(60, 150);
  const loT = xbar * 1000 - mT, hiT = xbar * 1000 + mT;
  return {
    id: `gen.st2-cimean-3.${idx}`, generated: true, concepts: ["ci-for-a-mean"], difficulty: 3, context: "applied",
    prompt: `A clinic samples $n = ${n}$ patients: mean systolic pressure $\\bar{x} = ${xbar}$ with $s = ${s}$. Build a ${conf.level}% confidence interval for the population mean. Use: 90% $\\to z^* = 1.645$, 95% $\\to z^* = 1.960$, 99% $\\to z^* = 2.576$. Give exact values.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Margin of error: $${conf.z} \\times ${k}$. Give the exact value.`, answer: d1000(mT), accept: [], hint: `${conf.level}% confidence uses $z^* = ${conf.z}$.` },
      { instruction: `Lower bound: $${xbar} - ${d1000(mT)}$. Give the exact value.`, answer: d1000(loT), accept: [], hint: `Center minus margin.` },
      { instruction: `Upper bound: $${xbar} + ${d1000(mT)}$. Give the exact value.`, answer: d1000(hiT), accept: [], hint: `Center plus margin.` },
    ],
    finalAnswer: { value: `(${d1000(loT)}, ${d1000(hiT)})`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$; at ${conf.level}% the margin is $${conf.z}(${k}) = ${d1000(mT)}$, giving $(${d1000(loT)}, ${d1000(hiT)})$.`,
  };
};

// --- ci-for-a-proportion ---
fill["st2-ciprop-1"] = (rng, idx) => {
  const c = rng.pick(PROPS);
  const x = (c.pH * c.n) / 100;
  const qH = 100 - c.pH;
  const varU = c.seT * c.seT; // in millionths
  return {
    id: `gen.st2-ciprop-1.${idx}`, generated: true, concepts: ["ci-for-a-proportion"], difficulty: 1, context: "applied",
    prompt: `In a survey, ${x} of $n = ${c.n}$ respondents said yes. Find the sample proportion and its standard error $\\mathrm{SE} = \\sqrt{\\dfrac{\\hat{p}(1-\\hat{p})}{n}}$.`,
    steps: [
      { instruction: `Sample proportion: $\\hat{p} = \\dfrac{${x}}{${c.n}}$. (Give a decimal.)`, answer: d100(c.pH), accept: [`${x}/${c.n}`], hint: `Divide successes by sample size.` },
      { instruction: `Compute $\\hat{p}(1-\\hat{p}) = ${d100(c.pH)} \\times ${d100(qH)}$. (Give a decimal.)`, answer: `${(c.pH * qH) / 10000}`, accept: [], hint: `$1 - ${d100(c.pH)} = ${d100(qH)}$.` },
      { instruction: `Divide by $n$: $\\dfrac{${(c.pH * qH) / 10000}}{${c.n}}$. (Give a decimal.)`, answer: `${varU / 1e6}`, accept: [], hint: `Move the decimal point.` },
      { instruction: `Take the square root for the SE. (Give a decimal.)`, answer: d1000(c.seT), accept: [`sqrt(${varU / 1e6})`], hint: `$${d1000(c.seT)}^2 = ${varU / 1e6}$.` },
    ],
    finalAnswer: { value: d1000(c.seT), unit: "" },
    solutionNarrative: `$\\hat{p} = ${d100(c.pH)}$; $\\hat{p}(1-\\hat{p})/n = ${varU / 1e6}$, whose square root is $\\mathrm{SE} = ${d1000(c.seT)}$.`,
  };
};
fill["st2-ciprop-2"] = (rng, idx) => {
  const c = rng.pick(PROPS);
  const x = (c.pH * c.n) / 100;
  const mU = 1960 * c.seT;          // margin in millionths, exact
  const m = `${mU / 1e6}`;
  const pctT = mU / 10000;          // margin in percentage points (exact)
  return {
    id: `gen.st2-ciprop-2.${idx}`, generated: true, concepts: ["ci-for-a-proportion"], difficulty: 2, context: "applied",
    prompt: `A poll finds ${x} of $n = ${c.n}$ voters favor a measure, so $\\hat{p} = ${d100(c.pH)}$ and $\\mathrm{SE} = \\sqrt{\\hat{p}(1-\\hat{p})/n} = ${d1000(c.seT)}$. Find the 95% margin of error ($z^* = 1.960$), then express it in percentage points.`,
    steps: [
      { instruction: `Margin of error: $1.96 \\times ${d1000(c.seT)}$. Give the exact value.`, answer: m, accept: [], hint: `$1.96 \\times ${d1000(c.seT)}$.` },
      { instruction: `Convert to percentage points: multiply by 100. (Give a number.)`, answer: `${pctT}`, accept: [], hint: `Move the decimal two places.` },
    ],
    finalAnswer: { value: m, unit: "" },
    solutionNarrative: `$m = 1.96 \\times ${d1000(c.seT)} = ${m}$, i.e. about $\\pm ${pctT}$ percentage points — the "margin of error" a news report would quote.`,
  };
};
fill["st2-ciprop-3"] = (rng, idx) => {
  const conf = rng.pick(CONF);
  const c = rng.pick(PROPS);
  const x = (c.pH * c.n) / 100;
  const exactU = conf.zT * c.seT;                 // millionths
  const mT = Math.round(exactU / 1000);           // rounded to 3 decimals (thousandths)
  const loT = c.pH * 10 - mT, hiT = c.pH * 10 + mT;
  return {
    id: `gen.st2-ciprop-3.${idx}`, generated: true, concepts: ["ci-for-a-proportion"], difficulty: 3, context: "applied",
    prompt: `${x} of $n = ${c.n}$ sampled parts pass inspection. Build a ${conf.level}% confidence interval for the true pass rate. Use: 90% $\\to z^* = 1.645$, 95% $\\to z^* = 1.960$, 99% $\\to z^* = 2.576$.`,
    steps: [
      { instruction: `Sample proportion: $\\hat{p} = \\dfrac{${x}}{${c.n}}$. (Give a decimal.)`, answer: d100(c.pH), accept: [`${x}/${c.n}`], hint: `Successes over sample size.` },
      { instruction: `Standard error: $\\sqrt{\\dfrac{${d100(c.pH)} \\times ${d100(100 - c.pH)}}{${c.n}}}$. (Give a decimal.)`, answer: d1000(c.seT), accept: [`sqrt(${(c.seT * c.seT) / 1e6})`], hint: `The quotient inside is $${(c.seT * c.seT) / 1e6}$.` },
      { instruction: `Margin of error: $${conf.z} \\times ${d1000(c.seT)}$, rounded to 3 decimal places.`, answer: d1000(mT), accept: [`${exactU / 1e6}`], hint: `Multiply, then round.` },
      { instruction: `Lower bound, using your rounded margin: $${d100(c.pH)} - ${d1000(mT)}$. (Give a decimal.)`, answer: d1000(loT), accept: [], hint: `Center minus margin.` },
      { instruction: `Upper bound: $${d100(c.pH)} + ${d1000(mT)}$. (Give a decimal.)`, answer: d1000(hiT), accept: [], hint: `Center plus margin.` },
    ],
    finalAnswer: { value: `(${d1000(loT)}, ${d1000(hiT)})`, unit: "" },
    solutionNarrative: `$\\hat{p} = ${d100(c.pH)}$, $\\mathrm{SE} = ${d1000(c.seT)}$, margin $= ${conf.z} \\times ${d1000(c.seT)} \\approx ${d1000(mT)}$, so the ${conf.level}% CI is $(${d1000(loT)}, ${d1000(hiT)})$.`,
  };
};

// --- interpretation-and-sample-size ---
fill["st2-interp-1"] = (rng, idx) => {
  const conf = rng.pick(CONF);
  const lo = rng.int(10, 40), w = rng.int(2, 8);
  return {
    id: `gen.st2-interp-1.${idx}`, generated: true, concepts: ["interpretation-and-sample-size"], difficulty: 1, context: "abstract",
    prompt: `A ${conf.level}% confidence interval for $\\mu$ comes out to $(${lo}, ${lo + w})$. Interpret the confidence level correctly.`,
    steps: [
      { instruction: `If we repeated the whole sampling procedure many times, what percent of the resulting intervals would capture the true $\\mu$? (Give a number.)`, answer: `${conf.level}`, accept: [`${conf.level}%`], hint: `That's what "${conf.level}% confidence" promises.` },
      { instruction: `Is it correct to say "$\\mu$ has a ${conf.level}% probability of being inside $(${lo}, ${lo + w})$"? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `$\\mu$ is a fixed number; it's the interval that varies from sample to sample.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `Confidence describes the PROCEDURE: ${conf.level}% of intervals built this way capture $\\mu$. Any single interval either contains $\\mu$ or it doesn't — there is no ${conf.level}% probability about this specific one.`,
  };
};
fill["st2-interp-2"] = (rng, idx) => {
  // n = (z* sigma / m)^2, engineered so z*·(sigma/m) is exact.
  const pool = [
    { zT: 1960, z: "1.96", k: 5 },   // 9.8   -> 96.04    -> 97
    { zT: 1960, z: "1.96", k: 10 },  // 19.6  -> 384.16   -> 385
    { zT: 1645, z: "1.645", k: 4 },  // 6.58  -> 43.2964  -> 44
    { zT: 1645, z: "1.645", k: 8 },  // 13.16 -> 173.1856 -> 174
    { zT: 2576, z: "2.576", k: 5 },  // 12.88 -> 165.8944 -> 166
  ];
  const c = rng.pick(pool);
  const mTarget = rng.pick([2, 3, 4]);
  const sigma = c.k * mTarget;                 // sigma/m = k exactly
  const vT = c.zT * c.k;                       // z*·k in thousandths
  const sq = (vT * vT) / 1e6;                  // exact square
  const nReq = Math.ceil(sq - 1e-9);
  return {
    id: `gen.st2-interp-2.${idx}`, generated: true, concepts: ["interpretation-and-sample-size"], difficulty: 2, context: "applied",
    prompt: `You want to estimate a mean to within a margin of error $m = ${mTarget}$ using $z^* = ${c.z}$, and the population standard deviation is about $\\sigma = ${sigma}$. Use $n = \\left(\\dfrac{z^* \\sigma}{m}\\right)^2$, rounding UP to a whole number of subjects.`,
    steps: [
      { instruction: `Compute $\\dfrac{z^* \\sigma}{m} = \\dfrac{${c.z} \\times ${sigma}}{${mTarget}}$. Give the exact value.`, answer: d1000(vT), accept: [], hint: `$\\sigma / m = ${c.k}$, then times $${c.z}$.` },
      { instruction: `Square it: $(${d1000(vT)})^2$. Give the exact value.`, answer: `${sq}`, accept: [], hint: `Multiply the number by itself.` },
      { instruction: `Sample sizes round UP. Give the required whole number $n$.`, answer: `${nReq}`, accept: [], hint: `Any fraction of a subject forces the next whole number.` },
    ],
    finalAnswer: { value: `${nReq}`, unit: "subjects" },
    solutionNarrative: `$\\frac{z^*\\sigma}{m} = ${d1000(vT)}$, squared gives $${sq}$, so you need $n = ${nReq}$ (always round up — rounding down would miss the target margin).`,
  };
};
fill["st2-interp-3"] = (rng, idx) => {
  const from = rng.pick([90, 95]);
  const to = from === 90 ? rng.pick([95, 99]) : 99;
  return {
    id: `gen.st2-interp-3.${idx}`, generated: true, concepts: ["interpretation-and-sample-size"], difficulty: 3, context: "abstract",
    prompt: `Reason about how a confidence interval reacts to design changes (same data unless stated).`,
    steps: [
      { instruction: `Raising the confidence level from ${from}% to ${to}% makes the interval wider or narrower? Type 'wider' or 'narrower'.`, answer: "wider", accept: [], hint: `More confidence demands a larger $z^*$.` },
      { instruction: `Increasing the sample size $n$ (same confidence) makes the margin of error larger or smaller? Type 'larger' or 'smaller'.`, answer: "smaller", accept: [], hint: `$\\mathrm{SE} = \\sigma/\\sqrt{n}$ shrinks as $n$ grows.` },
      { instruction: `Quadrupling $n$ multiplies the margin of error by what factor? (Give a fraction or decimal.)`, answer: "1/2", accept: ["0.5", "half"], hint: `$\\sqrt{4n} = 2\\sqrt{n}$.` },
    ],
    finalAnswer: { value: "1/2", unit: "" },
    solutionNarrative: `Confidence up $\\Rightarrow$ wider; $n$ up $\\Rightarrow$ margin down; and because of the square root, quadrupling $n$ only halves the margin — precision is expensive.`,
  };
};

// ===========================================================================
// TOPIC 2: statistics.hypothesis-testing
//   concepts: hypotheses-and-tails, test-statistics,
//             decisions-and-critical-values, errors-and-significance
// ===========================================================================

// --- hypotheses-and-tails ---
fill["st2-hyp-1"] = (rng, idx) => {
  const scen = rng.pick([
    { ctx: "A bottling plant claims its machines fill a mean of", unit: "mL", change: "the mean has CHANGED", tail: "two-tailed", taccept: ["two tailed", "two-sided", "two"] },
    { ctx: "A battery maker claims a mean lifetime of", unit: "charge cycles", change: "the mean has INCREASED", tail: "right-tailed", taccept: ["right tailed", "right", "upper-tailed"] },
    { ctx: "A call center claims a mean hold time of", unit: "seconds", change: "the mean has DECREASED", tail: "left-tailed", taccept: ["left tailed", "left", "lower-tailed"] },
  ]);
  const mu0 = rng.int(20, 90) * 10;
  return {
    id: `gen.st2-hyp-1.${idx}`, generated: true, concepts: ["hypotheses-and-tails"], difficulty: 1, context: "applied",
    prompt: `${scen.ctx} ${mu0} ${scen.unit}. An auditor suspects ${scen.change}. Set up the test.`,
    steps: [
      { instruction: `State the null hypothesis $H_0$ using 'mu' for the population mean (e.g. mu = 10).`, answer: `mu = ${mu0}`, accept: [`${mu0}`], hint: `$H_0$ always asserts the claimed value with equality.` },
      { instruction: `Is this test left-tailed, right-tailed, or two-tailed? Type one of those three.`, answer: scen.tail, accept: scen.taccept, hint: `Match the suspicion's direction: increase $\\to$ right, decrease $\\to$ left, change $\\to$ both.` },
    ],
    finalAnswer: { value: scen.tail, unit: "" },
    solutionNarrative: `$H_0: \\mu = ${mu0}$ (the claim), and the suspicion "${scen.change.toLowerCase()}" makes the alternative ${scen.tail}.`,
  };
};
fill["st2-hyp-2"] = (rng, idx) => {
  const scen = rng.pick([
    { p0T: 5, desc: "half of its users open the app daily", change: "the true rate is HIGHER", op: ">", tail: "right-tailed", taccept: ["right tailed", "right"] },
    { p0T: 3, desc: "30% of customers return an item", change: "the true rate is LOWER", op: "<", tail: "left-tailed", taccept: ["left tailed", "left"] },
    { p0T: 2, desc: "20% of emails get a reply", change: "the true rate is HIGHER", op: ">", tail: "right-tailed", taccept: ["right tailed", "right"] },
    { p0T: 4, desc: "40% of visitors click the banner", change: "the true rate is LOWER", op: "<", tail: "left-tailed", taccept: ["left tailed", "left"] },
  ]);
  const p0 = d10(scen.p0T);
  return {
    id: `gen.st2-hyp-2.${idx}`, generated: true, concepts: ["hypotheses-and-tails"], difficulty: 2, context: "applied",
    prompt: `A company claims ${scen.desc} (proportion $p = ${p0}$). An analyst suspects ${scen.change}. Set up the hypotheses using 'p' for the population proportion.`,
    steps: [
      { instruction: `State $H_0$ (e.g. p = 0.5).`, answer: `p = ${p0}`, accept: [`${p0}`], hint: `Equality at the claimed value.` },
      { instruction: `State the alternative $H_a$ as an inequality (e.g. p > 0.5).`, answer: `p ${scen.op} ${p0}`, accept: [`p${scen.op}${p0}`], hint: `"${scen.change}" points the inequality.` },
      { instruction: `Is this test left-tailed, right-tailed, or two-tailed? Type one.`, answer: scen.tail, accept: scen.taccept, hint: `The tail follows the direction of $H_a$.` },
    ],
    finalAnswer: { value: scen.tail, unit: "" },
    solutionNarrative: `$H_0: p = ${p0}$, $H_a: p ${scen.op} ${p0}$, a ${scen.tail} test — the rejection region sits on the side $H_a$ points to.`,
  };
};
fill["st2-hyp-3"] = (rng, idx) => {
  const scen = rng.pick([
    { claim: "at least", op: "<", tail: "left-tailed", taccept: ["left tailed", "left"], item: "a laptop battery lasts", unit: "hours" },
    { claim: "at most", op: ">", tail: "right-tailed", taccept: ["right tailed", "right"], item: "a delivery takes", unit: "minutes" },
  ]);
  const mu0 = scen.claim === "at least" ? rng.int(6, 14) : rng.int(20, 45);
  const alphaPct = rng.pick([1, 5, 10]);
  const alpha = `${alphaPct / 100}`;
  return {
    id: `gen.st2-hyp-3.${idx}`, generated: true, concepts: ["hypotheses-and-tails"], difficulty: 3, context: "applied",
    prompt: `A manufacturer claims ${scen.item} ${scen.claim} ${mu0} ${scen.unit} on average. A consumer group tests whether the claim FAILS, at a significance level of ${alphaPct}%. Set up the test. (The burden of proof sits on the alternative: $H_a$ is what the group is trying to show.)`,
    steps: [
      { instruction: `State $H_a$ as an inequality using 'mu' (e.g. mu < 10).`, answer: `mu ${scen.op} ${mu0}`, accept: [`mu${scen.op}${mu0}`], hint: `"${scen.claim} ${mu0}" fails in the ${scen.op === "<" ? "downward" : "upward"} direction.` },
      { instruction: `Is this test left-tailed, right-tailed, or two-tailed? Type one.`, answer: scen.tail, accept: scen.taccept, hint: `Follow the direction of $H_a$.` },
      { instruction: `Write the significance level $\\alpha$ as a decimal.`, answer: alpha, accept: [`${alphaPct}%`], hint: `${alphaPct}% as a decimal.` },
    ],
    finalAnswer: { value: scen.tail, unit: "" },
    solutionNarrative: `The claim "${scen.claim} ${mu0}" is violated when $\\mu ${scen.op} ${mu0}$, so $H_a: \\mu ${scen.op} ${mu0}$ — a ${scen.tail} test at $\\alpha = ${alpha}$.`,
  };
};

// --- test-statistics ---
fill["st2-teststat-1"] = (rng, idx) => {
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(2, 5);
  const sigma = sq * k;                       // SE = k
  const zInt = rng.pick([-3, -2, -1, 1, 2, 3]);
  const mu0 = rng.int(50, 150);
  const xbar = mu0 + zInt * k;
  return {
    id: `gen.st2-teststat-1.${idx}`, generated: true, concepts: ["test-statistics"], difficulty: 1, context: "abstract",
    prompt: `Test $H_0: \\mu = ${mu0}$ with a sample of $n = ${n}$: $\\bar{x} = ${xbar}$, population $\\sigma = ${sigma}$. Compute $z = \\dfrac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${sigma}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Numerator: $\\bar{x} - \\mu_0 = ${xbar} - ${mu0}$. (Give a number.)`, answer: `${zInt * k}`, accept: [], hint: `Watch the sign.` },
      { instruction: `Divide: $z = \\dfrac{${zInt * k}}{${k}}$. (Give a number.)`, answer: `${zInt}`, accept: [], hint: `$${zInt * k} / ${k}$.` },
    ],
    finalAnswer: { value: `${zInt}`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, so $z = \\frac{${xbar} - ${mu0}}{${k}} = ${zInt}$: the sample mean sits ${Math.abs(zInt)} standard error${Math.abs(zInt) === 1 ? "" : "s"} ${zInt > 0 ? "above" : "below"} the claimed mean.`,
  };
};
fill["st2-teststat-2"] = (rng, idx) => {
  const se = rng.pick([5, 10]);
  const [sq, n] = rng.pick(ROOTS);
  const sigma = sq * se;
  const zT = rng.pick([12, 14, 16, 18, 22, 24, -12, -14, -16, -18, -22]); // z in tenths (even)
  const diff = (zT * se) / 10;               // integer by construction
  const mu0 = rng.int(100, 400);
  const xbar = mu0 + diff;
  return {
    id: `gen.st2-teststat-2.${idx}`, generated: true, concepts: ["test-statistics"], difficulty: 2, context: "applied",
    prompt: `A cereal box line claims $\\mu = ${mu0}$ g. A sample of $n = ${n}$ boxes gives $\\bar{x} = ${xbar}$ g; the process has $\\sigma = ${sigma}$ g. Compute the test statistic $z = \\dfrac{\\bar{x} - \\mu_0}{\\sigma/\\sqrt{n}}$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${sigma}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${se}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Numerator: $${xbar} - ${mu0}$. (Give a number.)`, answer: `${diff}`, accept: [], hint: `Keep the sign.` },
      { instruction: `Divide: $z = \\dfrac{${diff}}{${se}}$. (Give a decimal.)`, answer: d10(zT), accept: [], hint: `$${diff} / ${se}$.` },
    ],
    finalAnswer: { value: d10(zT), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${se}$ and $\\bar{x} - \\mu_0 = ${diff}$, so $z = ${d10(zT)}$. ${Math.abs(zT) >= 20 ? "That is far into the tail — strong evidence against the claim." : "Whether that is extreme enough depends on the critical value."}`,
  };
};
fill["st2-teststat-3"] = (rng, idx) => {
  // Each pool entry lists only z values whose product with seT stays an
  // integer number of thousandths, so p-hat prints as an exact 3-decimal.
  const pool = [
    { p0H: 50, n: 100, seT: 50, zs: [-25, -20, -15, 15, 20, 25] },
    { p0H: 20, n: 100, seT: 40, zs: [-20, -15, 15, 20, 25] },
    { p0H: 80, n: 100, seT: 40, zs: [-25, -20, -15, 15, 20] },
    { p0H: 90, n: 100, seT: 30, zs: [-25, -20, -15, 15, 20] },
    { p0H: 50, n: 400, seT: 25, zs: [-20, 20] },
  ];
  const c = rng.pick(pool);
  const zTen = rng.pick(c.zs);                       // z in tenths (e.g. 15 -> 1.5)
  const diffT = (zTen * c.seT) / 10;                 // thousandths, integer by construction
  const phT = c.p0H * 10 + diffT;                    // p-hat in thousandths
  const varU = c.seT * c.seT;
  return {
    id: `gen.st2-teststat-3.${idx}`, generated: true, concepts: ["test-statistics"], difficulty: 3, context: "applied",
    prompt: `Test $H_0: p = ${d100(c.p0H)}$ for a proportion. A sample of $n = ${c.n}$ gives $\\hat{p} = ${d1000(phT)}$. Compute $z = \\dfrac{\\hat{p} - p_0}{\\sqrt{p_0(1-p_0)/n}}$ (note: the SE uses $p_0$, not $\\hat{p}$).`,
    steps: [
      { instruction: `Compute $\\dfrac{p_0(1-p_0)}{n} = \\dfrac{${d100(c.p0H)} \\times ${d100(100 - c.p0H)}}{${c.n}}$. (Give a decimal.)`, answer: `${varU / 1e6}`, accept: [], hint: `$${d100(c.p0H)} \\times ${d100(100 - c.p0H)} = ${(c.p0H * (100 - c.p0H)) / 10000}$, then divide by ${c.n}.` },
      { instruction: `Standard error: the square root of that. (Give a decimal.)`, answer: d1000(c.seT), accept: [`sqrt(${varU / 1e6})`], hint: `$${d1000(c.seT)}^2 = ${varU / 1e6}$.` },
      { instruction: `Numerator: $\\hat{p} - p_0 = ${d1000(phT)} - ${d100(c.p0H)}$. (Give a decimal.)`, answer: d1000(diffT), accept: [], hint: `Keep the sign.` },
      { instruction: `Divide: $z = \\dfrac{${d1000(diffT)}}{${d1000(c.seT)}}$. (Give a decimal.)`, answer: d10(zTen), accept: [], hint: `$${d1000(diffT)} / ${d1000(c.seT)}$.` },
    ],
    finalAnswer: { value: d10(zTen), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\sqrt{${varU / 1e6}} = ${d1000(c.seT)}$ and $\\hat{p} - p_0 = ${d1000(diffT)}$, so $z = ${d10(zTen)}$.`,
  };
};

// --- decisions-and-critical-values ---
fill["st2-decide-1"] = (rng, idx) => {
  const z = rng.pick([2.1, 1.9, 2.8, 0.8, 1.2, -0.5]);
  const reject = z > 1.645;
  return {
    id: `gen.st2-decide-1.${idx}`, generated: true, concepts: ["decisions-and-critical-values"], difficulty: 1, context: "abstract",
    prompt: `A RIGHT-tailed test at $\\alpha = 0.05$ has critical value $z^* = 1.645$: reject $H_0$ when $z > 1.645$. Your test statistic is $z = ${z}$. Decide.`,
    steps: [
      { instruction: `Is $${z} > 1.645$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare the two numbers.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject; otherwise $\\to$ fail to reject.` },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$z = ${z}$ ${reject ? ">" : "\\le"} 1.645$, so we ${reject ? "reject $H_0$ — the result is statistically significant at the 5% level" : "fail to reject $H_0$ — the data are compatible with the null"}.`,
  };
};
fill["st2-decide-2"] = (rng, idx) => {
  const z = rng.pick([-2.31, 2.5, -1.2, 1.47, -2.8, 0.9]);
  const absZ = Math.abs(z);
  const reject = absZ > 1.96;
  return {
    id: `gen.st2-decide-2.${idx}`, generated: true, concepts: ["decisions-and-critical-values"], difficulty: 2, context: "applied",
    prompt: `An A/B test is TWO-tailed at $\\alpha = 0.05$, so the critical values are $\\pm 1.96$: reject $H_0$ when $|z| > 1.96$. The computed statistic is $z = ${z}$. Decide.`,
    steps: [
      { instruction: `Compute $|z|$. (Give a number.)`, answer: `${absZ}`, accept: [], hint: `Drop the sign.` },
      { instruction: `Is $${absZ} > 1.96$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Outside $\\pm 1.96$ means significant.` },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$|z| = ${absZ}$ ${reject ? "> 1.96, so the difference between variants is statistically significant: reject $H_0$" : "\\le 1.96, so the observed difference is within normal sampling noise: fail to reject $H_0$"}.`,
  };
};
fill["st2-decide-3"] = (rng, idx) => {
  const c = rng.pick([
    { alpha: "0.05", pv: "0.032", reject: true },
    { alpha: "0.05", pv: "0.003", reject: true },
    { alpha: "0.05", pv: "0.21", reject: false },
    { alpha: "0.05", pv: "0.062", reject: false },
    { alpha: "0.01", pv: "0.032", reject: false },
    { alpha: "0.01", pv: "0.004", reject: true },
    { alpha: "0.1", pv: "0.062", reject: true },
  ]);
  return {
    id: `gen.st2-decide-3.${idx}`, generated: true, concepts: ["decisions-and-critical-values"], difficulty: 3, context: "applied",
    prompt: `A clinical trial reports a p-value of ${c.pv} for its primary endpoint, tested at significance level $\\alpha = ${c.alpha}$. Make the decision using the p-value rule.`,
    steps: [
      { instruction: `We reject $H_0$ when the p-value is ___ than $\\alpha$. Type 'less' or 'greater'.`, answer: "less", accept: ["smaller", "less than"], hint: `A small p-value means the data would be rare under $H_0$.` },
      { instruction: `Is $${c.pv} < ${c.alpha}$? Type 'yes' or 'no'.`, answer: c.reject ? "yes" : "no", accept: [], hint: `Compare the two decimals carefully.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: c.reject ? "reject" : "fail to reject", accept: c.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `p-value below $\\alpha$ $\\to$ reject.` },
    ],
    finalAnswer: { value: c.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `p-value $= ${c.pv}$ ${c.reject ? "<" : "\\ge"} $\\alpha = ${c.alpha}$, so we ${c.reject ? "reject $H_0$: the result is significant at this level" : "fail to reject $H_0$: the evidence isn't strong enough at this level"}. Note the same p-value can flip decisions when $\\alpha$ changes — which is why $\\alpha$ must be chosen BEFORE looking at the data.`,
  };
};

// --- errors-and-significance ---
fill["st2-error-1"] = (rng, idx) => {
  const alphaPct = rng.pick([1, 5, 10]);
  const alpha = `${alphaPct / 100}`;
  return {
    id: `gen.st2-error-1.${idx}`, generated: true, concepts: ["errors-and-significance"], difficulty: 1, context: "abstract",
    prompt: `A test is run at significance level $\\alpha = ${alpha}$. Identify the error types and what $\\alpha$ controls.`,
    steps: [
      { instruction: `Rejecting $H_0$ when $H_0$ is actually TRUE is which error? Type 'Type I' or 'Type II'.`, answer: "Type I", accept: ["type 1", "I", "1"], hint: `A false alarm.` },
      { instruction: `What is the probability of a Type I error for this test? (Give a decimal.)`, answer: alpha, accept: [`${alphaPct}%`], hint: `That is exactly what $\\alpha$ means.` },
    ],
    finalAnswer: { value: alpha, unit: "" },
    solutionNarrative: `Rejecting a true null is a Type I error (false alarm), and its probability is the significance level itself: $P(\\text{Type I}) = \\alpha = ${alpha}$.`,
  };
};
fill["st2-error-2"] = (rng, idx) => {
  const scen = rng.pick([
    { setting: "A medical screening test", h0: "the patient does NOT have the disease", e1: "telling a healthy patient they have the disease", e2: "missing the disease in a patient who has it" },
    { setting: "A smoke alarm", h0: "there is no fire", e1: "the alarm sounding when there is no fire", e2: "the alarm staying silent during a real fire" },
    { setting: "A spam filter", h0: "the email is legitimate", e1: "sending a legitimate email to the spam folder", e2: "letting a spam email into the inbox" },
    { setting: "Factory quality control", h0: "the batch meets specification", e1: "scrapping a batch that actually meets spec", e2: "shipping a batch that is actually defective" },
  ]);
  return {
    id: `gen.st2-error-2.${idx}`, generated: true, concepts: ["errors-and-significance"], difficulty: 2, context: "applied",
    prompt: `${scen.setting}: take $H_0$ to be "${scen.h0}". Classify each mistake. (Type I = rejecting a true $H_0$; Type II = failing to reject a false $H_0$.)`,
    steps: [
      { instruction: `"${scen.e1}" is which error? Type 'Type I' or 'Type II'.`, answer: "Type I", accept: ["type 1", "I", "1"], hint: `$H_0$ was true, but we rejected it — a false alarm.` },
      { instruction: `"${scen.e2}" is which error? Type 'Type I' or 'Type II'.`, answer: "Type II", accept: ["type 2", "II", "2"], hint: `$H_0$ was false, but we failed to reject it — a miss.` },
    ],
    finalAnswer: { value: "Type II", unit: "" },
    solutionNarrative: `With $H_0$ = "${scen.h0}": ${scen.e1} rejects a true null (Type I), while ${scen.e2} fails to reject a false null (Type II). Which error is worse depends on the stakes — that is what should drive the choice of $\\alpha$.`,
  };
};
fill["st2-error-3"] = (rng, idx) => {
  const fromPct = 5, toPct = rng.pick([1, 1, 2]);
  return {
    id: `gen.st2-error-3.${idx}`, generated: true, concepts: ["errors-and-significance"], difficulty: 3, context: "abstract",
    prompt: `A team tightens its significance level from $\\alpha = 0.0${fromPct}$ to $\\alpha = 0.0${toPct}$ (same sample size). Reason about the consequences.`,
    steps: [
      { instruction: `Type I errors become MORE or LESS likely? Type 'more' or 'less'.`, answer: "less", accept: ["less likely", "lower"], hint: `$P(\\text{Type I}) = \\alpha$, which just went down.` },
      { instruction: `With everything else fixed, Type II errors become MORE or LESS likely? Type 'more' or 'less'.`, answer: "more", accept: ["more likely", "higher"], hint: `A stricter bar for rejecting makes misses easier.` },
      { instruction: `Which error probability do you control DIRECTLY by choosing $\\alpha$? Type 'Type I' or 'Type II'.`, answer: "Type I", accept: ["type 1", "I", "1"], hint: `$\\alpha$ IS that probability.` },
    ],
    finalAnswer: { value: "Type I", unit: "" },
    solutionNarrative: `Lowering $\\alpha$ directly lowers the Type I (false alarm) rate but, with the same data, raises the Type II (miss) rate. The only way to reduce both at once is more data.`,
  };
};

// ===========================================================================
// TOPIC 3: statistics.regression-correlation
//   concepts: scatterplots-and-direction, correlation-coefficient,
//             least-squares-line, prediction-and-residuals
// ===========================================================================

// --- scatterplots-and-direction ---
fill["st2-scatter-1"] = (rng, idx) => {
  const scen = rng.pick([
    { desc: "hours studied vs. exam score: scores rise steadily as study hours rise", dir: "positive" },
    { desc: "car age vs. resale value: value falls steadily as age rises", dir: "negative" },
    { desc: "outdoor temperature vs. heating bill: bills fall as temperature rises", dir: "negative" },
    { desc: "height vs. shoe size: size rises with height", dir: "positive" },
  ]);
  const spread = rng.pick([
    { desc: "the points hug a straight line tightly", strength: "strong" },
    { desc: "the points form only a loose, fuzzy cloud around the trend", strength: "weak" },
  ]);
  return {
    id: `gen.st2-scatter-1.${idx}`, generated: true, concepts: ["scatterplots-and-direction"], difficulty: 1, context: "applied",
    prompt: `A scatterplot shows ${scen.desc}, and ${spread.desc}. Describe the association.`,
    steps: [
      { instruction: `Direction: type 'positive' or 'negative'.`, answer: scen.dir, accept: [], hint: `Do the variables move together or in opposite directions?` },
      { instruction: `Strength: type 'strong' or 'weak'.`, answer: spread.strength, accept: [], hint: `Tight cluster = strong; loose cloud = weak.` },
    ],
    finalAnswer: { value: `${spread.strength} ${scen.dir}`, unit: "" },
    solutionNarrative: `The variables move ${scen.dir === "positive" ? "together" : "in opposite directions"} (${scen.dir}), and since ${spread.desc}, the association is ${spread.strength}.`,
  };
};
fill["st2-scatter-2"] = (rng, idx) => {
  const r1 = rng.pick([-0.92, -0.85, 0.88, 0.95, -0.9]);
  const r2 = rng.pick([0.55, -0.48, 0.62, 0.35, 0.4]);
  const absR1 = Math.abs(r1);
  return {
    id: `gen.st2-scatter-2.${idx}`, generated: true, concepts: ["scatterplots-and-direction"], difficulty: 2, context: "abstract",
    prompt: `Two studies report correlations $r = ${r1}$ and $r = ${r2}$. Strength is judged by $|r|$, not the sign.`,
    steps: [
      { instruction: `Compute $|${r1}|$. (Give a number.)`, answer: `${absR1}`, accept: [], hint: `Drop the sign.` },
      { instruction: `Which $r$ indicates the STRONGER linear relationship? Type its value (with sign).`, answer: `${r1}`, accept: [], hint: `Compare $${absR1}$ with $${Math.abs(r2)}$.` },
      { instruction: `What is the direction of that stronger relationship? Type 'positive' or 'negative'.`, answer: r1 > 0 ? "positive" : "negative", accept: [], hint: `The sign of $r$ gives the direction.` },
    ],
    finalAnswer: { value: `${r1}`, unit: "" },
    solutionNarrative: `$|${r1}| = ${absR1} > ${Math.abs(r2)} = |${r2}|$, so $r = ${r1}$ is the stronger relationship, and its sign makes it ${r1 > 0 ? "positive" : "negative"}. A correlation of $-0.9$ is every bit as strong as $+0.9$.`,
  };
};
fill["st2-scatter-3"] = (rng, idx) => {
  const scen = rng.pick([
    { a: "monthly ice cream sales", b: "drowning incidents", lurk: "summer weather", r: "0.88" },
    { a: "the number of firefighters sent to a fire", b: "the damage cost", lurk: "the size of the fire", r: "0.91" },
    { a: "children's shoe size", b: "reading ability", lurk: "age", r: "0.7" },
    { a: "city ice-scraper sales", b: "hot chocolate sales", lurk: "cold weather", r: "0.82" },
  ]);
  return {
    id: `gen.st2-scatter-3.${idx}`, generated: true, concepts: ["scatterplots-and-direction"], difficulty: 3, context: "applied",
    prompt: `Across many observations, ${scen.a} and ${scen.b} correlate strongly: $r = ${scen.r}$. Reason carefully about what this does and does not show.`,
    steps: [
      { instruction: `What is the direction of the association? Type 'positive' or 'negative'.`, answer: "positive", accept: [], hint: `Look at the sign of $r$.` },
      { instruction: `Does this correlation PROVE that ${scen.a} causes ${scen.b}? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Correlation is not causation.` },
      { instruction: `Is "${scen.lurk} drives both variables" a plausible alternative explanation? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `A lurking variable can create correlation with no causal link between the pair.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `The association is positive and strong, but $r$ says nothing about WHY: ${scen.lurk} plausibly drives both ${scen.a} and ${scen.b}. Correlation alone never proves causation — that takes a controlled experiment.`,
  };
};

// --- correlation-coefficient ---
fill["st2-corr-1"] = (rng, idx) => {
  const sxy = rng.pick([16, 12, 8, -16, -12, -8]);
  const rT = sxy / 20;
  return {
    id: `gen.st2-corr-1.${idx}`, generated: true, concepts: ["correlation-coefficient"], difficulty: 1, context: "abstract",
    prompt: `For a small dataset, the summary sums are $S_{xy} = \\sum(x-\\bar{x})(y-\\bar{y}) = ${sxy}$, $S_{xx} = \\sum(x-\\bar{x})^2 = 20$, and $S_{yy} = \\sum(y-\\bar{y})^2 = 20$. Compute $r = \\dfrac{S_{xy}}{\\sqrt{S_{xx} S_{yy}}}$.`,
    steps: [
      { instruction: `Compute $S_{xx} \\cdot S_{yy} = 20 \\times 20$. (Give a number.)`, answer: "400", accept: [], hint: `Multiply the two sums.` },
      { instruction: `Take the square root. (Give a number.)`, answer: "20", accept: ["sqrt(400)"], hint: `$20^2 = 400$.` },
      { instruction: `Divide: $r = \\dfrac{${sxy}}{20}$. (Give a decimal.)`, answer: `${rT}`, accept: [`${sxy}/20`], hint: `Keep the sign of $S_{xy}$.` },
    ],
    finalAnswer: { value: `${rT}`, unit: "" },
    solutionNarrative: `$r = \\frac{${sxy}}{\\sqrt{20 \\cdot 20}} = \\frac{${sxy}}{20} = ${rT}$. The sign comes entirely from $S_{xy}$: ${sxy > 0 ? "positive products dominate, so the association is positive" : "negative products dominate, so the association is negative"}.`,
  };
};
fill["st2-corr-2"] = (rng, idx) => {
  const pat = rng.pick(DYS);
  const x0 = rng.int(4, 10), y0 = rng.int(12, 30);
  const xs = DX.map((d) => x0 + d), ys = pat.dy.map((d) => y0 + d);
  // self-check: recompute all sums from the data
  const sxy = sum(DX.map((d, i) => d * pat.dy[i]));
  const rT = sxy / 20;
  const prods = DX.map((d, i) => `(${d})(${pat.dy[i]})`).join(" + ");
  return {
    id: `gen.st2-corr-2.${idx}`, generated: true, concepts: ["correlation-coefficient"], difficulty: 2, context: "abstract",
    prompt: `Compute the correlation of the dataset $x: ${xs.join(", ")}$ and $y: ${ys.join(", ")}$ (paired in order). You may use the facts $\\sum(x-\\bar{x})^2 = 20$ and $\\sum(y-\\bar{y})^2 = 20$.`,
    steps: [
      { instruction: `Compute $\\bar{x}$, the mean of the $x$ values. (Give a whole number.)`, answer: `${x0}`, accept: [], hint: `$(${xs.join("+")})/4$.` },
      { instruction: `Compute $\\bar{y}$. (Give a whole number.)`, answer: `${y0}`, accept: [], hint: `$(${ys.join("+")})/4$.` },
      { instruction: `Compute $S_{xy} = \\sum(x-\\bar{x})(y-\\bar{y})$. The deviation pairs multiply as $${prods}$. (Give a number.)`, answer: `${sxy}`, accept: [], hint: `Add the four products, signs included.` },
      { instruction: `Compute $r = \\dfrac{S_{xy}}{\\sqrt{20 \\times 20}} = \\dfrac{${sxy}}{20}$. (Give a decimal.)`, answer: `${rT}`, accept: [`${sxy}/20`], hint: `Divide by 20.` },
    ],
    finalAnswer: { value: `${rT}`, unit: "" },
    solutionNarrative: `Means are $\\bar{x} = ${x0}$, $\\bar{y} = ${y0}$. The cross products sum to $S_{xy} = ${sxy}$, so $r = \\frac{${sxy}}{20} = ${rT}$.`,
  };
};
fill["st2-corr-3"] = (rng, idx) => {
  const pat = rng.pick(DYS);
  const x0 = rng.int(4, 10), y0 = rng.int(15, 40);
  const xs = DX.map((d) => x0 + d), ys = pat.dy.map((d) => y0 + d);
  const sxy = sum(DX.map((d, i) => d * pat.dy[i]));
  const rT = sxy / 20;
  const absR = Math.abs(rT);
  const strength = absR >= 0.8 ? "strong" : "moderate";
  return {
    id: `gen.st2-corr-3.${idx}`, generated: true, concepts: ["correlation-coefficient"], difficulty: 3, context: "applied",
    prompt: `Weekly ad spend ($x$, hundreds of dollars) and sales ($y$, units) for four weeks: $x: ${xs.join(", ")}$; $y: ${ys.join(", ")}$. Using $\\sum(x-\\bar{x})^2 = \\sum(y-\\bar{y})^2 = 20$, compute and interpret $r$. (Interpretation scale: $|r| \\ge 0.8$ strong; $0.5 \\le |r| < 0.8$ moderate; $|r| < 0.5$ weak.)`,
    steps: [
      { instruction: `Compute $S_{xy} = \\sum(x-\\bar{x})(y-\\bar{y})$ with $\\bar{x} = ${x0}$, $\\bar{y} = ${y0}$. (Give a number.)`, answer: `${sxy}`, accept: [], hint: `Deviations of $x$: $${DX.join(", ")}$; of $y$: $${pat.dy.join(", ")}$.` },
      { instruction: `Compute $r = \\dfrac{${sxy}}{\\sqrt{20 \\times 20}}$. (Give a decimal.)`, answer: `${rT}`, accept: [`${sxy}/20`], hint: `$\\sqrt{400} = 20$.` },
      { instruction: `Direction: type 'positive' or 'negative'.`, answer: rT > 0 ? "positive" : "negative", accept: [], hint: `The sign of $r$.` },
      { instruction: `Strength on the given scale: type 'strong', 'moderate', or 'weak'.`, answer: strength, accept: [], hint: `$|r| = ${absR}$ — compare with 0.8 and 0.5.` },
    ],
    finalAnswer: { value: `${rT}`, unit: "" },
    solutionNarrative: `$S_{xy} = ${sxy}$ gives $r = ${rT}$: a ${strength} ${rT > 0 ? "positive" : "negative"} linear association between ad spend and sales${rT > 0 ? "" : " (more spend, fewer sales — worth investigating!)"}.`,
  };
};

// --- least-squares-line ---
fill["st2-line-1"] = (rng, idx) => {
  const bT = rng.pick([8, 6, 15, 20, -4, -6]); // slope in tenths
  const xm = rng.int(3, 9);
  let ym = rng.int(10, 40);
  if (ym * 10 === bT * xm) ym += 1; // keep the intercept nonzero
  const bXmT = bT * xm;                        // b * xbar in tenths
  const aT = ym * 10 - bXmT;                   // intercept in tenths
  const bS = d10(bT), aS = d10(aT);
  const eq = lineEq(aS, bS);
  return {
    id: `gen.st2-line-1.${idx}`, generated: true, concepts: ["least-squares-line"], difficulty: 1, context: "abstract",
    prompt: `A least-squares line has slope $b = ${bS}$ and must pass through the point of means $(\\bar{x}, \\bar{y}) = (${xm}, ${ym})$. Find the intercept $a = \\bar{y} - b\\bar{x}$ and write the line. (Write $\\hat{y}$ as plain $y$.)`,
    steps: [
      { instruction: `Compute $b\\bar{x} = ${bS} \\times ${xm}$. (Give a number.)`, answer: d10(bXmT), accept: [], hint: `Multiply slope by $\\bar{x}$.` },
      { instruction: `Intercept: $a = ${ym} - (${d10(bXmT)})$. (Give a number.)`, answer: aS, accept: [], hint: `$\\bar{y}$ minus the product.` },
      { instruction: `Write the regression equation (e.g. y = 2 + 3x).`, answer: eq, accept: [`y = ${bS}x + ${aS}`, `${aS} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x`], hint: `$y = a + bx$ with your $a$ and $b$.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `$a = ${ym} - ${bS}(${xm}) = ${aS}$, so the line is $\\hat{y} = ${aS} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x$. Every least-squares line passes through $(\\bar{x}, \\bar{y})$.`,
  };
};
fill["st2-line-2"] = (rng, idx) => {
  const pool = [
    { r: "0.8", sy: 5, sx: 2, bT: 20 },
    { r: "0.6", sy: 10, sx: 3, bT: 20 },
    { r: "0.9", sy: 4, sx: 3, bT: 12 },
    { r: "-0.8", sy: 5, sx: 4, bT: -10 },
    { r: "0.5", sy: 6, sx: 2, bT: 15 },
    { r: "-0.6", sy: 5, sx: 3, bT: -10 },
  ];
  const c = rng.pick(pool);
  const xm = rng.int(3, 8);
  let ym = rng.int(20, 60);
  if (ym * 10 === c.bT * xm) ym += 1;
  const bXmT = c.bT * xm;
  const aT = ym * 10 - bXmT;
  const bS = d10(c.bT), aS = d10(aT);
  const eq = lineEq(aS, bS);
  return {
    id: `gen.st2-line-2.${idx}`, generated: true, concepts: ["least-squares-line"], difficulty: 2, context: "applied",
    prompt: `A dataset has $r = ${c.r}$, standard deviations $s_x = ${c.sx}$ and $s_y = ${c.sy}$, and means $\\bar{x} = ${xm}$, $\\bar{y} = ${ym}$. Build the least-squares line using $b = r\\dfrac{s_y}{s_x}$ and $a = \\bar{y} - b\\bar{x}$. (Write $\\hat{y}$ as plain $y$.)`,
    steps: [
      { instruction: `Slope: $b = ${c.r} \\times \\dfrac{${c.sy}}{${c.sx}}$. (Give a decimal.)`, answer: bS, accept: [], hint: `$s_y/s_x = ${rnd(c.sy / c.sx, 4)}$, then times $r$.` },
      { instruction: `Compute $b\\bar{x} = ${bS} \\times ${xm}$. (Give a number.)`, answer: d10(bXmT), accept: [], hint: `Slope times $\\bar{x}$.` },
      { instruction: `Intercept: $a = ${ym} - (${d10(bXmT)})$. (Give a number.)`, answer: aS, accept: [], hint: `$\\bar{y} - b\\bar{x}$.` },
      { instruction: `Write the regression equation (e.g. y = 2 + 3x).`, answer: eq, accept: [`y = ${bS}x + ${aS}`], hint: `$y = a + bx$.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `$b = ${c.r} \\cdot \\frac{${c.sy}}{${c.sx}} = ${bS}$ and $a = ${ym} - ${bS}(${xm}) = ${aS}$: $\\hat{y} = ${aS} ${c.bT < 0 ? "-" : "+"} ${d10(Math.abs(c.bT))}x$. The slope inherits its sign from $r$.`,
  };
};
fill["st2-line-3"] = (rng, idx) => {
  const sxy = rng.pick([16, 12, -16, -12, 8]);
  const bT = sxy / 2;                          // b = sxy/20 in tenths
  const xm = rng.int(3, 8);
  let ym = rng.int(15, 45);
  if (ym * 10 === bT * xm) ym += 1;
  const bXmT = bT * xm;
  const aT = ym * 10 - bXmT;
  const bS = d10(bT), aS = d10(aT);
  const eq = lineEq(aS, bS);
  return {
    id: `gen.st2-line-3.${idx}`, generated: true, concepts: ["least-squares-line"], difficulty: 3, context: "applied",
    prompt: `Fertilizer dose ($x$) and crop yield ($y$) give summary sums $S_{xy} = ${sxy}$ and $S_{xx} = 20$, with means $\\bar{x} = ${xm}$, $\\bar{y} = ${ym}$. Build the least-squares line ($b = S_{xy}/S_{xx}$, $a = \\bar{y} - b\\bar{x}$) and interpret the slope. (Write $\\hat{y}$ as plain $y$.)`,
    steps: [
      { instruction: `Slope: $b = \\dfrac{${sxy}}{20}$. (Give a decimal.)`, answer: bS, accept: [`${sxy}/20`], hint: `Divide, keeping the sign.` },
      { instruction: `Intercept: $a = ${ym} - (${bS})(${xm})$. (Give a number.)`, answer: aS, accept: [], hint: `$b\\bar{x} = ${d10(bXmT)}$.` },
      { instruction: `Write the regression equation (e.g. y = 2 + 3x).`, answer: eq, accept: [`y = ${bS}x + ${aS}`], hint: `$y = a + bx$.` },
      { instruction: `For each 1-unit increase in $x$, the predicted $y$ changes by how much? (Give a number, sign included.)`, answer: bS, accept: [], hint: `That is exactly what the slope means.` },
    ],
    finalAnswer: { value: eq, unit: "" },
    solutionNarrative: `$b = \\frac{${sxy}}{20} = ${bS}$, $a = ${ym} - ${bS}(${xm}) = ${aS}$, so $\\hat{y} = ${aS} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x$: each extra unit of fertilizer ${bT > 0 ? "adds" : "removes"} ${d10(Math.abs(bT))} units of predicted yield.`,
  };
};

// --- prediction-and-residuals ---
fill["st2-pred-1"] = (rng, idx) => {
  const bT = rng.pick([5, 8, 15, 20, -5, -10]); // slope in tenths
  const a = rng.int(10, 40);
  const xstar = rng.int(2, 12);
  const bxT = bT * xstar;
  const yhatT = a * 10 + bxT;
  return {
    id: `gen.st2-pred-1.${idx}`, generated: true, concepts: ["prediction-and-residuals"], difficulty: 1, context: "abstract",
    prompt: `A regression line is $\\hat{y} = ${a} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x$. Predict $\\hat{y}$ at $x = ${xstar}$.`,
    steps: [
      { instruction: `Compute the slope term: $${d10(bT)} \\times ${xstar}$. (Give a number.)`, answer: d10(bxT), accept: [], hint: `Multiply, keeping the sign.` },
      { instruction: `Add the intercept: $${a} + (${d10(bxT)})$. (Give a number.)`, answer: d10(yhatT), accept: [], hint: `Intercept plus slope term.` },
    ],
    finalAnswer: { value: d10(yhatT), unit: "" },
    solutionNarrative: `$\\hat{y} = ${a} + (${d10(bT)})(${xstar}) = ${d10(yhatT)}$ — plug in and evaluate.`,
  };
};
fill["st2-pred-2"] = (rng, idx) => {
  const bT = rng.pick([8, 15, 20, -10, -20]);
  // Keep predicted sales positive even for the steepest negative slope.
  const a = bT < 0 ? rng.int(35, 70) : rng.int(15, 50);
  const xstar = rng.int(2, 10);
  const yhatT = a * 10 + bT * xstar;
  const resT = rng.pick([12, 25, 30, -8, -15, -25]);
  const yObsT = yhatT + resT;
  const above = resT > 0;
  return {
    id: `gen.st2-pred-2.${idx}`, generated: true, concepts: ["prediction-and-residuals"], difficulty: 2, context: "applied",
    prompt: `A café's model for daily sales is $\\hat{y} = ${a} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x$, where $x$ is the temperature shortfall index. On a day with $x = ${xstar}$, actual sales were $y = ${d10(yObsT)}$. Find the residual $y - \\hat{y}$.`,
    steps: [
      { instruction: `Predicted value: $\\hat{y} = ${a} + (${d10(bT)})(${xstar})$. (Give a number.)`, answer: d10(yhatT), accept: [], hint: `Evaluate the line at $x = ${xstar}$.` },
      { instruction: `Residual: $y - \\hat{y} = ${d10(yObsT)} - ${d10(yhatT)}$. (Give a number, sign included.)`, answer: d10(resT), accept: [], hint: `Observed minus predicted.` },
      { instruction: `Does the actual point sit ABOVE or BELOW the line? Type 'above' or 'below'.`, answer: above ? "above" : "below", accept: [], hint: `Positive residual = above; negative = below.` },
    ],
    finalAnswer: { value: d10(resT), unit: "" },
    solutionNarrative: `$\\hat{y} = ${d10(yhatT)}$, so the residual is $${d10(yObsT)} - ${d10(yhatT)} = ${d10(resT)}$: the day landed ${above ? "above" : "below"} the line by ${d10(Math.abs(resT))}.`,
  };
};
fill["st2-pred-3"] = (rng, idx) => {
  const bT = rng.pick([8, 6, 15]); // positive slopes: a growth model
  const a = rng.int(10, 40);
  const xlo = 2, xhi = rng.pick([10, 12]);
  const xstar = xhi + rng.int(8, 20);
  const yhatT = a * 10 + bT * xstar;
  return {
    id: `gen.st2-pred-3.${idx}`, generated: true, concepts: ["prediction-and-residuals"], difficulty: 3, context: "applied",
    prompt: `A growth model $\\hat{y} = ${a} ${bT < 0 ? "-" : "+"} ${d10(Math.abs(bT))}x$ was fitted to data collected only for $x$ between ${xlo} and ${xhi}. A manager asks for a prediction at $x = ${xstar}$.`,
    steps: [
      { instruction: `Mechanically, what does the line give at $x = ${xstar}$? Compute $${a} + (${d10(bT)})(${xstar})$. (Give a number.)`, answer: d10(yhatT), accept: [], hint: `Plug in and evaluate.` },
      { instruction: `Is predicting at $x = ${xstar}$ interpolation or extrapolation? Type one.`, answer: "extrapolation", accept: ["extrapolating"], hint: `Compare $${xstar}$ with the data range $[${xlo}, ${xhi}]$.` },
      { instruction: `Should this prediction be trusted as much as one inside $[${xlo}, ${xhi}]$? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `The line was never tested out there — the pattern may bend.` },
    ],
    finalAnswer: { value: "extrapolation", unit: "" },
    solutionNarrative: `The line dutifully outputs ${d10(yhatT)}, but $x = ${xstar}$ lies far outside the observed range $[${xlo}, ${xhi}]$ — this is extrapolation, and the linear pattern has no evidence behind it out there.`,
  };
};
