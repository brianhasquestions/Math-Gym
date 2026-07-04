// gen-advstat3-fill.js
// Parametric generators for the Advanced Statistics subject, topics
//   advanced-statistics.t-inference
//   advanced-statistics.two-sample-inference
//   advanced-statistics.chi-square-tests
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats2-fill.js). Template prefix: as3-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every statistic is computed
// in integer arithmetic scaled by 10/100/1000, so printed decimals are exact
// strings and answers always self-check. All critical values are supplied in
// the prompt, and every engineered statistic keeps a margin >= 0.1 from its
// critical value so rounding can never flip a decision.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const d10 = (v) => `${v / 10}`;
const d100 = (v) => `${v / 100}`;
const d1000 = (v) => `${v / 1000}`;
// Trailing-zero accept variant for a thousandths-valued answer ("6.09" -> "6.090").
const acc3 = (t) => {
  const fixed = (t / 1000).toFixed(3);
  return fixed === `${t / 1000}` ? [] : [fixed];
};
// t critical values by df. one = one-tailed alpha=0.05 (also the 90% CI t*),
// two = two-tailed alpha=0.05 (the 95% CI t*), n99 = 99% CI t*. *T = thousandths.
const T = {
  3:  { one: "2.353", oneT: 2353, two: "3.182", twoT: 3182, n99: "5.841", n99T: 5841 },
  8:  { one: "1.860", oneT: 1860, two: "2.306", twoT: 2306, n99: "3.355", n99T: 3355 },
  24: { one: "1.711", oneT: 1711, two: "2.064", twoT: 2064, n99: "2.797", n99T: 2797 },
  35: { one: "1.690", oneT: 1690, two: "2.030", twoT: 2030, n99: "2.724", n99T: 2724 },
  99: { one: "1.660", oneT: 1660, two: "1.984", twoT: 1984, n99: "2.626", n99T: 2626 },
};
// Perfect-square sample sizes for t work: [sqrt(n), n] with df = n-1 in T.
const TROOTS = [[5, 25], [6, 36], [10, 100]];
const TROOTS_TEST = [[3, 9], [5, 25], [6, 36], [10, 100]];
// df 8 for n=9 is in T; all TROOTS_TEST dfs (8, 24, 35, 99) are covered.

export const fill = {};

// ===========================================================================
// TOPIC 1: advanced-statistics.t-inference
//   concepts: why-t-and-df, t-confidence-intervals, one-sample-t-test, paired-t
// ===========================================================================

// --- why-t-and-df ---
fill["as3-t-why-1"] = (rng, idx) => {
  const [, n] = rng.pick(TROOTS_TEST);
  const s = rng.int(4, 30);
  return {
    id: `gen.as3-t-why-1.${idx}`, generated: true, concepts: ["why-t-and-df"], difficulty: 1, context: "abstract",
    prompt: `You want a confidence interval for a mean from a sample of $n = ${n}$ values. The population standard deviation $\\sigma$ is UNKNOWN, so you must use the sample standard deviation $s = ${s}$ in its place.`,
    steps: [
      { instruction: `Because $s$ estimates $\\sigma$ (adding extra uncertainty), which distribution supplies the critical value? Type 't' or 'z'.`, answer: "t", accept: ["t-distribution", "student's t"], hint: `Unknown $\\sigma$ + sample $s$ is exactly the t-distribution's job.` },
      { instruction: `How many degrees of freedom? ($\\mathrm{df} = n - 1$.)`, answer: `${n - 1}`, accept: [], hint: `$${n} - 1$.` },
    ],
    finalAnswer: { value: `${n - 1}`, unit: "df" },
    solutionNarrative: `With $\\sigma$ unknown and estimated by $s$, the sampling distribution of $\\frac{\\bar{x}-\\mu}{s/\\sqrt{n}}$ is Student's t with $\\mathrm{df} = n - 1 = ${n - 1}$, not the normal.`,
  };
};
fill["as3-t-why-2"] = (rng, idx) => {
  const tFirst = rng.pick([true, false]);
  const [, n] = rng.pick(TROOTS_TEST);
  const tScen = `a startup times $n = ${n}$ of its own deliveries and computes the sample standard deviation $s$ from those times`;
  const zScen = `a national testing agency knows from decades of records that its exam scores have $\\sigma = 15$ exactly`;
  const A = tFirst ? tScen : zScen, B = tFirst ? zScen : tScen;
  const aAns = tFirst ? "t" : "z", bAns = tFirst ? "z" : "t";
  return {
    id: `gen.as3-t-why-2.${idx}`, generated: true, concepts: ["why-t-and-df"], difficulty: 2, context: "applied",
    prompt: `Two teams build confidence intervals for a mean. Team A: ${A}. Team B: ${B}. Decide which distribution each should use.`,
    steps: [
      { instruction: `Team A should use which distribution? Type 't' or 'z'.`, answer: aAns, accept: aAns === "t" ? ["t-distribution", "student's t"] : ["z-distribution", "normal", "standard normal"], hint: `Ask: is $\\sigma$ truly known, or estimated by $s$?` },
      { instruction: `Team B should use which distribution? Type 't' or 'z'.`, answer: bAns, accept: bAns === "t" ? ["t-distribution", "student's t"] : ["z-distribution", "normal", "standard normal"], hint: `The other case.` },
      { instruction: `For the team using t, how many degrees of freedom? ($\\mathrm{df} = n - 1$.)`, answer: `${n - 1}`, accept: [], hint: `Their sample size is $${n}$.` },
    ],
    finalAnswer: { value: `${n - 1}`, unit: "df" },
    solutionNarrative: `Known $\\sigma$ $\\to$ z; estimated $s$ $\\to$ t with $\\mathrm{df} = n - 1 = ${n - 1}$. The t's heavier tails pay for the extra uncertainty of estimating the spread.`,
  };
};
fill["as3-t-why-3"] = (rng, idx) => {
  const [, n] = rng.pick(TROOTS);
  const df = n - 1;
  return {
    id: `gen.as3-t-why-3.${idx}`, generated: true, concepts: ["why-t-and-df"], difficulty: 3, context: "abstract",
    prompt: `At 95% confidence the normal critical value is $z^* = 1.960$, while the t critical value with $\\mathrm{df} = ${df}$ is $t^* = ${T[df].two}$ (from the table). Reason about what the t-distribution's heavier tails do to inference.`,
    steps: [
      { instruction: `Compared with the z interval on the same data, the t interval comes out wider or narrower? Type 'wider' or 'narrower'.`, answer: "wider", accept: ["wider interval"], hint: `$t^* = ${T[df].two} > 1.960 = z^*$, and width scales with the critical value.` },
      { instruction: `As the sample size grows, does $t^*$ move closer to or further from 1.960? Type 'closer' or 'further'.`, answer: "closer", accept: ["closer to"], hint: `With more data, $s$ pins down $\\sigma$ and t converges to z.` },
      { instruction: `A new sample of $n = ${n + 11}$ would use how many degrees of freedom?`, answer: `${n + 10}`, accept: [], hint: `$\\mathrm{df} = n - 1$.` },
    ],
    finalAnswer: { value: "wider", unit: "" },
    solutionNarrative: `Since $t^* = ${T[df].two}$ exceeds $z^* = 1.960$, the t interval is wider — the honest price of estimating $\\sigma$ with $s$. As df grows, $t^* \\to z^*$ and the penalty vanishes.`,
  };
};

// --- t-confidence-intervals ---
fill["as3-t-ci-1"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS);
  const df = n - 1;
  const k = rng.int(2, 5);
  const s = sq * k;                       // SE = k exactly
  const mT = T[df].twoT * k;              // margin in thousandths, exact
  return {
    id: `gen.as3-t-ci-1.${idx}`, generated: true, concepts: ["t-confidence-intervals"], difficulty: 1, context: "abstract",
    prompt: `A sample of $n = ${n}$ values ($\\sigma$ unknown) has sample standard deviation $s = ${s}$. For a 95% t confidence interval with $\\mathrm{df} = ${df}$, the critical value is $t^* = ${T[df].two}$. Find the margin of error $m = t^* \\cdot \\dfrac{s}{\\sqrt{n}}$.`,
    steps: [
      { instruction: `Degrees of freedom: $\\mathrm{df} = n - 1$. (Give a whole number.)`, answer: `${df}`, accept: [], hint: `$${n} - 1$.` },
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Margin of error: $m = ${T[df].two} \\times ${k}$. Give the exact value.`, answer: d1000(mT), accept: acc3(mT), hint: `$${T[df].two} \\times ${k}$.` },
    ],
    finalAnswer: { value: d1000(mT), unit: "" },
    solutionNarrative: `$\\mathrm{df} = ${df}$, $\\mathrm{SE} = \\frac{${s}}{${sq}} = ${k}$, so $m = ${T[df].two} \\times ${k} = ${d1000(mT)}$. Note $t^* = ${T[df].two}$ is a bit larger than the z value 1.960 — the t penalty for estimating $\\sigma$.`,
  };
};
fill["as3-t-ci-2"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS);
  const df = n - 1;
  const k = rng.int(1, 4);
  const s = sq * k;
  const xbar = rng.int(60, 200);
  const mT = T[df].twoT * k;
  const loT = xbar * 1000 - mT, hiT = xbar * 1000 + mT;
  return {
    id: `gen.as3-t-ci-2.${idx}`, generated: true, concepts: ["t-confidence-intervals"], difficulty: 2, context: "applied",
    prompt: `A quality lab measures $n = ${n}$ parts: $\\bar{x} = ${xbar}$, $s = ${s}$ ($\\sigma$ unknown). Build the 95% t confidence interval $\\bar{x} \\pm t^* \\dfrac{s}{\\sqrt{n}}$, where $t^* = ${T[df].two}$ for $\\mathrm{df} = ${df}$. Give exact values.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Margin of error: $${T[df].two} \\times ${k}$. Give the exact value.`, answer: d1000(mT), accept: acc3(mT), hint: `Multiply out.` },
      { instruction: `Lower bound: $${xbar} - ${d1000(mT)}$. Give the exact value.`, answer: d1000(loT), accept: acc3(loT), hint: `Center minus margin.` },
      { instruction: `Upper bound: $${xbar} + ${d1000(mT)}$. Give the exact value.`, answer: d1000(hiT), accept: acc3(hiT), hint: `Center plus margin.` },
    ],
    finalAnswer: { value: `(${d1000(loT)}, ${d1000(hiT)})`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, margin $= ${T[df].two}(${k}) = ${d1000(mT)}$, so the 95% CI is $(${d1000(loT)}, ${d1000(hiT)})$.`,
  };
};
fill["as3-t-ci-3"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS);
  const df = n - 1;
  const level = rng.pick([90, 99]);
  const tStr = level === 90 ? T[df].one : T[df].n99;
  const tT = level === 90 ? T[df].oneT : T[df].n99T;
  const k = rng.int(1, 3);
  const s = sq * k;
  const xbar = rng.int(50, 150);
  const mT = tT * k;
  const loT = xbar * 1000 - mT, hiT = xbar * 1000 + mT;
  return {
    id: `gen.as3-t-ci-3.${idx}`, generated: true, concepts: ["t-confidence-intervals"], difficulty: 3, context: "applied",
    prompt: `A clinic samples $n = ${n}$ patients: $\\bar{x} = ${xbar}$, $s = ${s}$. Build a ${level}% t confidence interval. From the t-table with $\\mathrm{df} = ${df}$: 90% $\\to t^* = ${T[df].one}$, 95% $\\to t^* = ${T[df].two}$, 99% $\\to t^* = ${T[df].n99}$. Give exact values.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Which $t^*$ matches ${level}% confidence? (Give the number from the table.)`, answer: tStr, accept: [], hint: `Read the ${level}% entry.` },
      { instruction: `Margin of error: $${tStr} \\times ${k}$. Give the exact value.`, answer: d1000(mT), accept: acc3(mT), hint: `Multiply out.` },
      { instruction: `Lower bound: $${xbar} - ${d1000(mT)}$. Give the exact value.`, answer: d1000(loT), accept: acc3(loT), hint: `Center minus margin.` },
      { instruction: `Upper bound: $${xbar} + ${d1000(mT)}$. Give the exact value.`, answer: d1000(hiT), accept: acc3(hiT), hint: `Center plus margin.` },
    ],
    finalAnswer: { value: `(${d1000(loT)}, ${d1000(hiT)})`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$; at ${level}% with $\\mathrm{df} = ${df}$, $t^* = ${tStr}$, so the margin is $${d1000(mT)}$ and the interval is $(${d1000(loT)}, ${d1000(hiT)})$.`,
  };
};

// --- one-sample-t-test ---
fill["as3-t-test-1"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS_TEST);
  const k = rng.int(2, 5);
  const s = sq * k;                        // SE = k
  const tInt = rng.pick([-3, -2, -1, 1, 2, 3]);
  const mu0 = rng.int(50, 150);
  const xbar = mu0 + tInt * k;
  return {
    id: `gen.as3-t-test-1.${idx}`, generated: true, concepts: ["one-sample-t-test"], difficulty: 1, context: "abstract",
    prompt: `Test $H_0: \\mu = ${mu0}$ with a sample of $n = ${n}$: $\\bar{x} = ${xbar}$, sample standard deviation $s = ${s}$ ($\\sigma$ unknown). Compute $t = \\dfrac{\\bar{x} - \\mu_0}{s/\\sqrt{n}}$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Numerator: $\\bar{x} - \\mu_0 = ${xbar} - ${mu0}$. (Give a number.)`, answer: `${tInt * k}`, accept: [], hint: `Watch the sign.` },
      { instruction: `Divide: $t = \\dfrac{${tInt * k}}{${k}}$. (Give a number.)`, answer: `${tInt}`, accept: [], hint: `$${tInt * k} / ${k}$.` },
    ],
    finalAnswer: { value: `${tInt}`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, so $t = \\frac{${xbar} - ${mu0}}{${k}} = ${tInt}$. It reads exactly like a z statistic, but its yardstick is the t-distribution with $\\mathrm{df} = ${n - 1}$.`,
  };
};
fill["as3-t-test-2"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS_TEST);
  const df = n - 1;
  const se = rng.pick([5, 10]);
  const s = sq * se;
  // magnitudes in tenths, all >= 0.1 away from every one-tailed t* in T
  const mag = rng.pick([8, 12, 15, 25, 30]);
  const left = rng.pick([true, false]);
  const tT = left ? -mag : mag;
  const diffT = (tT * se);                 // in tenths (t tenths * se) -> value/10
  const mu0 = rng.int(100, 400);
  const xbarT = mu0 * 10 + diffT;          // tenths
  const crit = T[df].one;
  const reject = mag * 100 > T[df].oneT;   // compare in same scale (tenths*100 vs thousandths)
  return {
    id: `gen.as3-t-test-2.${idx}`, generated: true, concepts: ["one-sample-t-test"], difficulty: 2, context: "applied",
    prompt: `A ${left ? "consumer group suspects a claimed mean of" : "plant auditor suspects the mean has risen above"} $\\mu_0 = ${mu0}$${left ? " is too high, testing $H_a: \\mu < " + mu0 + "$ (LEFT-tailed)" : ", testing $H_a: \\mu > " + mu0 + "$ (RIGHT-tailed)"} at $\\alpha = 0.05$. A sample of $n = ${n}$ gives $\\bar{x} = ${d10(xbarT)}$, $s = ${s}$. The critical value for $\\mathrm{df} = ${df}$ is $t^* = ${left ? "-" : ""}${crit}$: reject when $t ${left ? "<" : ">"} ${left ? "-" : ""}${crit}$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${se}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Numerator: $${d10(xbarT)} - ${mu0}$. (Give a number.)`, answer: d10(diffT), accept: [], hint: `Keep the sign.` },
      { instruction: `Divide: $t = \\dfrac{${d10(diffT)}}{${se}}$. (Give a decimal.)`, answer: d10(tT), accept: [], hint: `$${d10(diffT)} / ${se}$.` },
      { instruction: `Is $${d10(tT)} ${left ? "<" : ">"} ${left ? "-" : ""}${crit}$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${se}$ and $t = ${d10(tT)}$. Since $${d10(tT)}$ ${reject ? "lands beyond" : "does not reach"} the critical value $${left ? "-" : ""}${crit}$ (df $= ${df}$), we ${reject ? "reject $H_0$" : "fail to reject $H_0$"}.`,
  };
};
fill["as3-t-test-3"] = (rng, idx) => {
  const [sq, n] = rng.pick(TROOTS_TEST);
  const df = n - 1;
  const se = rng.pick([5, 10]);
  const s = sq * se;
  // magnitudes in tenths, all >= 0.1 away from every two-tailed t* in T
  const mag = rng.pick([8, 12, 15, 25, 30]);
  const sign = rng.pick([1, -1]);
  const tT = sign * mag;
  const diffT = tT * se;
  const mu0 = rng.int(100, 400);
  const xbarT = mu0 * 10 + diffT;
  const crit = T[df].two;
  const reject = mag * 100 > T[df].twoT;
  return {
    id: `gen.as3-t-test-3.${idx}`, generated: true, concepts: ["one-sample-t-test"], difficulty: 3, context: "applied",
    prompt: `A regulator tests whether a process mean has CHANGED from its specification $\\mu_0 = ${mu0}$ (TWO-tailed, $\\alpha = 0.05$). A sample of $n = ${n}$ gives $\\bar{x} = ${d10(xbarT)}$, $s = ${s}$. With $\\mathrm{df} = ${df}$ the critical values are $\\pm ${crit}$: reject when $|t| > ${crit}$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${s}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${se}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Test statistic: $t = \\dfrac{${d10(xbarT)} - ${mu0}}{${se}}$. (Give a decimal.)`, answer: d10(tT), accept: [], hint: `Numerator is $${d10(diffT)}$.` },
      { instruction: `Compute $|t|$. (Give a decimal.)`, answer: d10(mag), accept: [], hint: `Drop the sign.` },
      { instruction: `Is $${d10(mag)} > ${crit}$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Outside $\\pm ${crit}$ means significant.` },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$t = ${d10(tT)}$, so $|t| = ${d10(mag)}$ ${reject ? ">" : "\\le"} ${crit}$ (df $= ${df}$): we ${reject ? "reject $H_0$ — the process has drifted" : "fail to reject $H_0$ — the drift is within sampling noise"}.`,
  };
};

// --- paired-t ---
const DEV_PERMS = [[-3, 1, 1, 1], [1, -3, 1, 1], [1, 1, -3, 1], [1, 1, 1, -3]];
fill["as3-t-paired-1"] = (rng, idx) => {
  const scen = rng.pick([
    { item: "typing speeds (words/min) before and after a training course", b: [38, 44, 41, 47] },
    { item: "reaction times (ms, lower is better) before and after practice — here we still take After − Before", b: [280, 265, 291, 274] },
    { item: "quiz scores before and after a review session", b: [61, 70, 66, 73] },
  ]);
  const dbar = rng.pick([2, 3]);
  const devs = rng.pick(DEV_PERMS);
  const d = devs.map((v) => dbar + v);
  const after = scen.b.map((v, i) => v + d[i]);
  return {
    id: `gen.as3-t-paired-1.${idx}`, generated: true, concepts: ["paired-t"], difficulty: 1, context: "applied",
    prompt: `Four subjects are measured twice — ${scen.item}. Before: ${scen.b.join(", ")}. After: ${after.join(", ")}. Paired data are analyzed through the DIFFERENCES $d_i = \\text{After} - \\text{Before}$.`,
    steps: [
      { instruction: `Difference for subject 1: $${after[0]} - ${scen.b[0]}$. (Give a number.)`, answer: `${d[0]}`, accept: [], hint: `After minus Before.` },
      { instruction: `Difference for subject 2: $${after[1]} - ${scen.b[1]}$. (Give a number.)`, answer: `${d[1]}`, accept: [], hint: `Keep the sign.` },
      { instruction: `All four differences are $${d.join(", ")}$. Sum them. (Give a number.)`, answer: `${4 * dbar}`, accept: [], hint: `Add the four values.` },
      { instruction: `Mean difference: $\\bar{d} = \\dfrac{${4 * dbar}}{4}$. (Give a number.)`, answer: `${dbar}`, accept: [], hint: `Divide by $n = 4$.` },
    ],
    finalAnswer: { value: `${dbar}`, unit: "" },
    solutionNarrative: `The differences are $${d.join(", ")}$, which sum to $${4 * dbar}$, so $\\bar{d} = ${dbar}$. Pairing removed the subject-to-subject level and left only the change.`,
  };
};
fill["as3-t-paired-2"] = (rng, idx) => {
  const c = rng.pick([1, 2]);
  const dbar = rng.int(2, 4);
  const devs = rng.pick(DEV_PERMS).map((v) => v * c);
  const d = devs.map((v) => dbar + v);
  const ss = 12 * c * c;                    // sum of squared deviations
  const s2 = 4 * c * c;                     // ss / 3
  const sd = 2 * c;
  return {
    id: `gen.as3-t-paired-2.${idx}`, generated: true, concepts: ["paired-t"], difficulty: 2, context: "applied",
    prompt: `A paired study on $n = 4$ subjects yields the differences (After − Before): $${d.join(", ")}$. Compute the summary statistics a paired t-test needs.`,
    steps: [
      { instruction: `Mean difference: $\\bar{d} = \\dfrac{${d.reduce((a, b) => a + b, 0)}}{4}$. (Give a number.)`, answer: `${dbar}`, accept: [], hint: `The differences sum to $${4 * dbar}$.` },
      { instruction: `The deviations $d_i - \\bar{d}$ are $${devs.join(", ")}$ (they sum to 0). Sum their SQUARES. (Give a number.)`, answer: `${ss}`, accept: [], hint: `$(${devs.join(")^2 + (")})^2$.` },
      { instruction: `Sample variance of the differences: $s_d^2 = \\dfrac{${ss}}{n - 1} = \\dfrac{${ss}}{3}$. (Give a number.)`, answer: `${s2}`, accept: [], hint: `Divide by $n - 1 = 3$, not by 4.` },
      { instruction: `Standard deviation: $s_d = \\sqrt{${s2}}$. (Give a number.)`, answer: `${sd}`, accept: [`sqrt(${s2})`], hint: `$${sd}^2 = ${s2}$.` },
      { instruction: `Standard error of $\\bar{d}$: $\\dfrac{${sd}}{\\sqrt{4}}$. (Give a number.)`, answer: `${c}`, accept: [], hint: `$\\sqrt{4} = 2$.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `$\\bar{d} = ${dbar}$; the squared deviations total $${ss}$, so $s_d^2 = ${s2}$, $s_d = ${sd}$, and $\\mathrm{SE} = \\frac{${sd}}{2} = ${c}$. From here the paired t is just a one-sample t on the differences.`,
  };
};
fill["as3-t-paired-3"] = (rng, idx) => {
  // (c, dbar) chosen so t = dbar/c keeps a margin >= 0.1 from the df=3 critical values.
  const scen = rng.pick([
    { c: 1, dbar: 3, two: false, reject: true },   // t = 3   vs 2.353
    { c: 2, dbar: 5, two: false, reject: true },   // t = 2.5 vs 2.353
    { c: 1, dbar: 2, two: false, reject: false },  // t = 2   vs 2.353
    { c: 2, dbar: 3, two: false, reject: false },  // t = 1.5 vs 2.353
    { c: 2, dbar: 7, two: true,  reject: true },   // t = 3.5 vs 3.182
  ]);
  const devs = rng.pick(DEV_PERMS).map((v) => v * scen.c);
  const d = devs.map((v) => scen.dbar + v);
  const sd = 2 * scen.c;
  const tVal = d10((scen.dbar * 10) / scen.c);
  const crit = scen.two ? "3.182" : "2.353";
  return {
    id: `gen.as3-t-paired-3.${idx}`, generated: true, concepts: ["paired-t"], difficulty: 3, context: "applied",
    prompt: `A sleep clinic measures hours slept for 4 patients before and after treatment; the differences (After − Before) are $${d.join(", ")}$, with mean $\\bar{d} = ${scen.dbar}$ and standard deviation $s_d = ${sd}$. Test ${scen.two ? "$H_a: \\mu_d \\ne 0$ (TWO-tailed): with $\\mathrm{df} = 3$ the critical values are $\\pm 3.182$, reject when $|t| > 3.182$" : "$H_a: \\mu_d > 0$ (RIGHT-tailed): with $\\mathrm{df} = 3$ the critical value is $t^* = 2.353$, reject when $t > 2.353$"} at $\\alpha = 0.05$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{s_d}{\\sqrt{n}} = \\dfrac{${sd}}{\\sqrt{4}}$. (Give a number.)`, answer: `${scen.c}`, accept: [], hint: `$\\sqrt{4} = 2$.` },
      { instruction: `Test statistic: $t = \\dfrac{\\bar{d}}{\\mathrm{SE}} = \\dfrac{${scen.dbar}}{${scen.c}}$. (Give a number.)`, answer: tVal, accept: [], hint: `Divide.` },
      { instruction: `Is $${tVal} ${scen.two ? "> 3.182 \\text{ in absolute value}" : "> 2.353"}$? Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare with $${crit}$.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\frac{${sd}}{2} = ${scen.c}$ and $t = \\frac{${scen.dbar}}{${scen.c}} = ${tVal}$. Against the df-3 critical value $${crit}$ we ${scen.reject ? "reject $H_0$: the treatment shifted sleep" : "fail to reject $H_0$: the change is within noise for so few patients"}.`,
  };
};

// ===========================================================================
// TOPIC 2: advanced-statistics.two-sample-inference
//   concepts: two-sample-setup, difference-of-means,
//             difference-of-proportions, two-sample-intervals
// ===========================================================================

// Pythagorean SE configs: s1^2/n1 + s2^2/n2 is a perfect square.
const MEANCFG = [
  { s1: 15, n1: 25, v1: 9,  s2: 24, n2: 36, v2: 16, se: 5 },
  { s1: 12, n1: 16, v1: 9,  s2: 20, n2: 25, v2: 16, se: 5 },
  { s1: 30, n1: 25, v1: 36, s2: 40, n2: 25, v2: 64, se: 10 },
  { s1: 24, n1: 16, v1: 36, s2: 48, n2: 36, v2: 64, se: 10 },
];

// --- two-sample-setup ---
fill["as3-ts-setup-1"] = (rng, idx) => {
  const scen = rng.pick([
    { desc: "An A/B test shows the old checkout page to one random group of visitors and the new page to a DIFFERENT random group", ans: "independent", acc: ["independent samples", "two independent samples"] },
    { desc: "A trainer weighs the SAME 20 clients before and after a 6-week program", ans: "paired", acc: ["paired samples", "matched pairs", "dependent"] },
    { desc: "A hospital compares recovery days for patients randomly assigned to drug A versus patients randomly assigned to drug B", ans: "independent", acc: ["independent samples", "two independent samples"] },
    { desc: "A tire lab mounts brand X on the left side and brand Y on the right side of the SAME 12 cars", ans: "paired", acc: ["paired samples", "matched pairs", "dependent"] },
  ]);
  return {
    id: `gen.as3-ts-setup-1.${idx}`, generated: true, concepts: ["two-sample-setup"], difficulty: 1, context: "applied",
    prompt: `${scen.desc}. Classify the design.`,
    steps: [
      { instruction: `Are the two samples independent or paired? Type 'independent' or 'paired'.`, answer: scen.ans, accept: scen.acc, hint: `Paired = the same (or matched) units measured twice; independent = separate groups.` },
      { instruction: `Under the no-difference null hypothesis, $\\mu_1 - \\mu_2$ equals what number?`, answer: "0", accept: ["zero"], hint: `"No difference" in symbols.` },
    ],
    finalAnswer: { value: scen.ans, unit: "" },
    solutionNarrative: `${scen.desc} — that is a ${scen.ans} design. Either way, the null hypothesis says the difference is 0.`,
  };
};
fill["as3-ts-setup-2"] = (rng, idx) => {
  const scen = rng.pick([
    { claim: "the new page converts BETTER than the old (group 1 = new)", op: ">", tail: "right-tailed", tacc: ["right tailed", "right"] },
    { claim: "the treatment group heals FASTER, i.e. fewer recovery days (group 1 = treatment)", op: "<", tail: "left-tailed", tacc: ["left tailed", "left"] },
    { claim: "the two suppliers' part weights DIFFER (either direction)", op: "!=", tail: "two-tailed", tacc: ["two tailed", "two-sided", "two"] },
  ]);
  return {
    id: `gen.as3-ts-setup-2.${idx}`, generated: true, concepts: ["two-sample-setup"], difficulty: 2, context: "applied",
    prompt: `A two-sample test compares group 1 to group 2. The researchers suspect ${scen.claim}. Let $d = \\mu_1 - \\mu_2$. Set up the test.`,
    steps: [
      { instruction: `State $H_0$: what number does $d$ equal under the null?`, answer: "0", accept: ["zero", "d = 0"], hint: `The null is always "no difference".` },
      ...(scen.op === "!=" ? [] : [
        { instruction: `State $H_a$ as an inequality in $d$ (e.g. d > 0).`, answer: `d ${scen.op} 0`, accept: [`d${scen.op}0`, `0 ${scen.op === ">" ? "<" : ">"} d`], hint: `"${scen.claim}" points the inequality.` },
      ]),
      { instruction: `Is this test left-tailed, right-tailed, or two-tailed? Type one.`, answer: scen.tail, accept: scen.tacc, hint: `Follow the direction of the suspicion.` },
    ],
    finalAnswer: { value: scen.tail, unit: "" },
    solutionNarrative: `$H_0: \\mu_1 - \\mu_2 = 0$; the suspicion "${scen.claim}" makes the test ${scen.tail}.`,
  };
};
fill["as3-ts-setup-3"] = (rng, idx) => {
  const scen = rng.pick([
    { desc: "A researcher measures the SAME 30 stores' sales in June and again in July after a promotion, then runs a two-independent-samples test on the two lists", correct: "paired" },
    { desc: "A clinic records blood pressure for the SAME patients on and off medication, then compares the two columns as if they were separate groups", correct: "paired" },
  ]);
  return {
    id: `gen.as3-ts-setup-3.${idx}`, generated: true, concepts: ["two-sample-setup"], difficulty: 3, context: "applied",
    prompt: `${scen.desc}. This is a classic analysis mistake.`,
    steps: [
      { instruction: `Which design is this really? Type 'paired' or 'independent'.`, answer: scen.correct, accept: ["paired samples", "matched pairs", "dependent"], hint: `The same units appear in both measurement sets.` },
      { instruction: `The correct analysis runs a one-sample t-test on the ___. Type 'differences' or 'group means'.`, answer: "differences", accept: ["the differences", "difference scores"], hint: `Pair up each unit's two values first.` },
      { instruction: `Ignoring the pairing usually makes the standard error too LARGE or too SMALL? Type 'large' or 'small'.`, answer: "large", accept: ["larger", "too large"], hint: `Pairing subtracts away the unit-to-unit variation; ignoring it leaves that variation in.` },
    ],
    finalAnswer: { value: "paired", unit: "" },
    solutionNarrative: `The same units are measured twice, so the design is paired. Analyzing the differences removes unit-to-unit spread; treating the columns as independent inflates the SE and can hide a real effect.`,
  };
};

// --- difference-of-means ---
fill["as3-ts-means-1"] = (rng, idx) => {
  const c = rng.pick(MEANCFG);
  return {
    id: `gen.as3-ts-means-1.${idx}`, generated: true, concepts: ["difference-of-means"], difficulty: 1, context: "abstract",
    prompt: `Two independent samples: group 1 has $s_1 = ${c.s1}$, $n_1 = ${c.n1}$; group 2 has $s_2 = ${c.s2}$, $n_2 = ${c.n2}$. Find the standard error of $\\bar{x}_1 - \\bar{x}_2$: $\\mathrm{SE} = \\sqrt{\\dfrac{s_1^2}{n_1} + \\dfrac{s_2^2}{n_2}}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{s_1^2}{n_1} = \\dfrac{${c.s1}^2}{${c.n1}}$. (Give a whole number.)`, answer: `${c.v1}`, accept: [`${c.s1 * c.s1}/${c.n1}`], hint: `$${c.s1}^2 = ${c.s1 * c.s1}$.` },
      { instruction: `Compute $\\dfrac{s_2^2}{n_2} = \\dfrac{${c.s2}^2}{${c.n2}}$. (Give a whole number.)`, answer: `${c.v2}`, accept: [`${c.s2 * c.s2}/${c.n2}`], hint: `$${c.s2}^2 = ${c.s2 * c.s2}$.` },
      { instruction: `Add them. (Give a whole number.)`, answer: `${c.v1 + c.v2}`, accept: [], hint: `$${c.v1} + ${c.v2}$.` },
      { instruction: `Take the square root for the SE. (Give a whole number.)`, answer: `${c.se}`, accept: [`sqrt(${c.v1 + c.v2})`], hint: `$${c.se}^2 = ${c.v1 + c.v2}$.` },
    ],
    finalAnswer: { value: `${c.se}`, unit: "" },
    solutionNarrative: `Variances add for a difference: $\\frac{${c.s1 * c.s1}}{${c.n1}} + \\frac{${c.s2 * c.s2}}{${c.n2}} = ${c.v1} + ${c.v2} = ${c.v1 + c.v2}$, so $\\mathrm{SE} = ${c.se}$. Never add standard deviations — add variances.`,
  };
};
fill["as3-ts-means-2"] = (rng, idx) => {
  const c = rng.pick(MEANCFG);
  const tT = rng.pick([12, 18, 22, 28, -12, -18, -22, -28]); // t in tenths
  const diff = (tT * c.se) / 10;             // integer by construction
  const xbar2 = rng.int(100, 300);
  const xbar1 = xbar2 + diff;
  return {
    id: `gen.as3-ts-means-2.${idx}`, generated: true, concepts: ["difference-of-means"], difficulty: 2, context: "applied",
    prompt: `Two factory lines are compared: line 1 gives $\\bar{x}_1 = ${xbar1}$, $s_1 = ${c.s1}$, $n_1 = ${c.n1}$; line 2 gives $\\bar{x}_2 = ${xbar2}$, $s_2 = ${c.s2}$, $n_2 = ${c.n2}$. Test $H_0: \\mu_1 - \\mu_2 = 0$ by computing $t = \\dfrac{\\bar{x}_1 - \\bar{x}_2}{\\sqrt{s_1^2/n_1 + s_2^2/n_2}}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{s_1^2}{n_1} + \\dfrac{s_2^2}{n_2} = \\dfrac{${c.s1 * c.s1}}{${c.n1}} + \\dfrac{${c.s2 * c.s2}}{${c.n2}}$. (Give a whole number.)`, answer: `${c.v1 + c.v2}`, accept: [], hint: `$${c.v1} + ${c.v2}$.` },
      { instruction: `Standard error: the square root of that. (Give a whole number.)`, answer: `${c.se}`, accept: [`sqrt(${c.v1 + c.v2})`], hint: `$${c.se}^2 = ${c.v1 + c.v2}$.` },
      { instruction: `Numerator: $\\bar{x}_1 - \\bar{x}_2 = ${xbar1} - ${xbar2}$. (Give a number.)`, answer: `${diff}`, accept: [], hint: `Keep the sign.` },
      { instruction: `Divide: $t = \\dfrac{${diff}}{${c.se}}$. (Give a decimal.)`, answer: d10(tT), accept: [], hint: `$${diff} / ${c.se}$.` },
    ],
    finalAnswer: { value: d10(tT), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\sqrt{${c.v1} + ${c.v2}} = ${c.se}$ and the observed gap is $${diff}$, so $t = ${d10(tT)}$: the gap sits $${Math.abs(tT) / 10}$ standard errors from zero.`,
  };
};
fill["as3-ts-means-3"] = (rng, idx) => {
  // (tT, tail, crit) pairs all keep a margin >= 0.1 from the critical value.
  const scen = rng.pick([
    { tT: 22,  tail: "right", crit: "1.645", reject: true },
    { tT: 12,  tail: "right", crit: "1.645", reject: false },
    { tT: -18, tail: "left",  crit: "1.645", reject: true },
    { tT: 22,  tail: "two",   crit: "1.960", reject: true },
    { tT: -12, tail: "two",   crit: "1.960", reject: false },
    { tT: 28,  tail: "two",   crit: "2.576", reject: true },
  ]);
  const c = rng.pick(MEANCFG);
  const diff = (scen.tT * c.se) / 10;
  const xbar2 = rng.int(100, 300);
  const xbar1 = xbar2 + diff;
  const absT = Math.abs(scen.tT);
  const ruleTxt = scen.tail === "two" ? `reject when $|t| > ${scen.crit}$ (TWO-tailed)` : scen.tail === "right" ? `reject when $t > ${scen.crit}$ (RIGHT-tailed)` : `reject when $t < -${scen.crit}$ (LEFT-tailed)`;
  const cmp = scen.tail === "two" ? `Is $${d10(absT)} > ${scen.crit}$?` : scen.tail === "right" ? `Is $${d10(scen.tT)} > ${scen.crit}$?` : `Is $${d10(scen.tT)} < -${scen.crit}$?`;
  return {
    id: `gen.as3-ts-means-3.${idx}`, generated: true, concepts: ["difference-of-means"], difficulty: 3, context: "applied",
    prompt: `A trial compares treatment (group 1: $\\bar{x}_1 = ${xbar1}$, $s_1 = ${c.s1}$, $n_1 = ${c.n1}$) with control (group 2: $\\bar{x}_2 = ${xbar2}$, $s_2 = ${c.s2}$, $n_2 = ${c.n2}$). The samples are large enough to use the given critical value: ${ruleTxt} at $\\alpha = ${scen.crit === "2.576" ? "0.01" : scen.tail === "two" ? "0.05" : "0.05"}$.`,
    steps: [
      { instruction: `Standard error: $\\sqrt{\\dfrac{${c.s1 * c.s1}}{${c.n1}} + \\dfrac{${c.s2 * c.s2}}{${c.n2}}}$. (Give a whole number.)`, answer: `${c.se}`, accept: [`sqrt(${c.v1 + c.v2})`], hint: `$${c.v1} + ${c.v2} = ${c.v1 + c.v2}$.` },
      { instruction: `Test statistic: $t = \\dfrac{${xbar1} - ${xbar2}}{${c.se}}$. (Give a decimal.)`, answer: d10(scen.tT), accept: [], hint: `The numerator is $${diff}$.` },
      ...(scen.tail === "two" ? [{ instruction: `Compute $|t|$. (Give a decimal.)`, answer: d10(absT), accept: [], hint: `Drop the sign.` }] : []),
      { instruction: `${cmp} Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${c.se}$, $t = ${d10(scen.tT)}$. Against the rule "${ruleTxt}" we ${scen.reject ? "reject $H_0$ — the groups genuinely differ" : "fail to reject $H_0$ — the gap is within sampling noise"}.`,
  };
};

// --- difference-of-proportions ---
// Configs: n1 = n2 = 200, so 1/n1 + 1/n2 = 0.01 exactly. pooled p-hat in
// hundredths; SE = sqrt(pq * 0.01) exact in hundredths. x1 - x2 = 200 * diff.
const PROPCFG = [
  { pH: 50, seH: 5, x1: 110, x2: 90,  zT: 20 },   // diff 0.10, z = 2
  { pH: 50, seH: 5, x1: 106, x2: 94,  zT: 12 },   // diff 0.06, z = 1.2
  { pH: 50, seH: 5, x1: 109, x2: 91,  zT: 18 },   // diff 0.09, z = 1.8
  { pH: 50, seH: 5, x1: 86,  x2: 114, zT: -28 },  // diff -0.14, z = -2.8
  { pH: 20, seH: 4, x1: 48,  x2: 32,  zT: 20 },   // diff 0.08, z = 2
  { pH: 20, seH: 4, x1: 34,  x2: 46,  zT: -15 },  // diff -0.06, z = -1.5
];
const p3 = (x) => `${x / 200}`;   // x/200 as an exact decimal string
fill["as3-ts-props-1"] = (rng, idx) => {
  const c = rng.pick(PROPCFG);
  return {
    id: `gen.as3-ts-props-1.${idx}`, generated: true, concepts: ["difference-of-proportions"], difficulty: 1, context: "applied",
    prompt: `An A/B test: variant 1 converts ${c.x1} of $n_1 = 200$ visitors; variant 2 converts ${c.x2} of $n_2 = 200$. Compute the two sample proportions and the POOLED proportion $\\hat{p} = \\dfrac{x_1 + x_2}{n_1 + n_2}$ used under $H_0: p_1 = p_2$.`,
    steps: [
      { instruction: `$\\hat{p}_1 = \\dfrac{${c.x1}}{200}$. (Give a decimal.)`, answer: p3(c.x1), accept: [`${c.x1}/200`], hint: `Divide.` },
      { instruction: `$\\hat{p}_2 = \\dfrac{${c.x2}}{200}$. (Give a decimal.)`, answer: p3(c.x2), accept: [`${c.x2}/200`], hint: `Divide.` },
      { instruction: `Pooled: $\\hat{p} = \\dfrac{${c.x1} + ${c.x2}}{400}$. (Give a decimal.)`, answer: d100(c.pH), accept: [`${c.x1 + c.x2}/400`], hint: `$${c.x1} + ${c.x2} = ${c.x1 + c.x2}$.` },
    ],
    finalAnswer: { value: d100(c.pH), unit: "" },
    solutionNarrative: `$\\hat{p}_1 = ${p3(c.x1)}$, $\\hat{p}_2 = ${p3(c.x2)}$, and pooling all successes over all trials gives $\\hat{p} = ${d100(c.pH)}$ — the single rate the null hypothesis believes in.`,
  };
};
fill["as3-ts-props-2"] = (rng, idx) => {
  const c = rng.pick(PROPCFG);
  const q = d100(100 - c.pH);
  const pqU = c.pH * (100 - c.pH);          // pq in ten-thousandths
  return {
    id: `gen.as3-ts-props-2.${idx}`, generated: true, concepts: ["difference-of-proportions"], difficulty: 2, context: "applied",
    prompt: `Continuing a two-proportion test with $n_1 = n_2 = 200$ and pooled $\\hat{p} = ${d100(c.pH)}$: find the standard error $\\mathrm{SE} = \\sqrt{\\hat{p}(1-\\hat{p})\\left(\\dfrac{1}{n_1} + \\dfrac{1}{n_2}\\right)}$.`,
    steps: [
      { instruction: `Compute $\\hat{p}(1-\\hat{p}) = ${d100(c.pH)} \\times ${q}$. (Give a decimal.)`, answer: `${pqU / 10000}`, accept: [], hint: `$1 - ${d100(c.pH)} = ${q}$.` },
      { instruction: `Compute $\\dfrac{1}{200} + \\dfrac{1}{200}$. (Give a decimal.)`, answer: "0.01", accept: ["1/100", "0.010"], hint: `$0.005 + 0.005$.` },
      { instruction: `Multiply: $${pqU / 10000} \\times 0.01$. (Give a decimal.)`, answer: `${pqU / 1000000}`, accept: [], hint: `Move the decimal two places.` },
      { instruction: `Square root for the SE. (Give a decimal.)`, answer: d100(c.seH), accept: [`sqrt(${pqU / 1000000})`, `0.0${c.seH}0`], hint: `$${d100(c.seH)}^2 = ${pqU / 1000000}$.` },
    ],
    finalAnswer: { value: d100(c.seH), unit: "" },
    solutionNarrative: `$\\hat{p}(1-\\hat{p}) = ${pqU / 10000}$ and $\\frac{1}{200}+\\frac{1}{200} = 0.01$, so the variance is $${pqU / 1000000}$ and $\\mathrm{SE} = ${d100(c.seH)}$. The SE uses the POOLED rate because $H_0$ says both groups share it.`,
  };
};
fill["as3-ts-props-3"] = (rng, idx) => {
  // Each entry pins statistic, tail, and critical value with margin >= 0.1.
  const scen = rng.pick([
    { c: PROPCFG[0], tail: "right", crit: "1.645", reject: true },   // z = 2
    { c: PROPCFG[1], tail: "right", crit: "1.645", reject: false },  // z = 1.2
    { c: PROPCFG[2], tail: "two",   crit: "1.960", reject: false },  // z = 1.8
    { c: PROPCFG[3], tail: "two",   crit: "1.960", reject: true },   // z = -2.8
    { c: PROPCFG[4], tail: "two",   crit: "2.576", reject: false },  // z = 2
    { c: PROPCFG[5], tail: "left",  crit: "1.645", reject: false },  // z = -1.5
  ]);
  const c = scen.c;
  const diffT = c.zT * c.seH;                // in thousandths
  const absT = Math.abs(c.zT);
  const ruleTxt = scen.tail === "two" ? `reject when $|z| > ${scen.crit}$ (TWO-tailed)` : scen.tail === "right" ? `reject when $z > ${scen.crit}$ (RIGHT-tailed)` : `reject when $z < -${scen.crit}$ (LEFT-tailed)`;
  const cmp = scen.tail === "two" ? `Is $${d10(absT)} > ${scen.crit}$?` : scen.tail === "right" ? `Is $${d10(c.zT)} > ${scen.crit}$?` : `Is $${d10(c.zT)} < -${scen.crit}$?`;
  return {
    id: `gen.as3-ts-props-3.${idx}`, generated: true, concepts: ["difference-of-proportions"], difficulty: 3, context: "applied",
    prompt: `A two-proportion z-test: $\\hat{p}_1 = ${p3(c.x1)}$ and $\\hat{p}_2 = ${p3(c.x2)}$ (each from $n = 200$), and the pooled standard error works out to $\\mathrm{SE} = ${d100(c.seH)}$. Decision rule: ${ruleTxt}.`,
    steps: [
      { instruction: `Numerator: $\\hat{p}_1 - \\hat{p}_2 = ${p3(c.x1)} - ${p3(c.x2)}$. (Give a decimal.)`, answer: d1000(diffT), accept: [], hint: `Keep the sign.` },
      { instruction: `Test statistic: $z = \\dfrac{${d1000(diffT)}}{${d100(c.seH)}}$. (Give a decimal.)`, answer: d10(c.zT), accept: [], hint: `Divide.` },
      ...(scen.tail === "two" ? [{ instruction: `Compute $|z|$. (Give a decimal.)`, answer: d10(absT), accept: [], hint: `Drop the sign.` }] : []),
      { instruction: `${cmp} Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$z = \\frac{${d1000(diffT)}}{${d100(c.seH)}} = ${d10(c.zT)}$. Under the rule "${ruleTxt}" we ${scen.reject ? "reject $H_0$: the conversion rates differ" : "fail to reject $H_0$: the observed gap is compatible with equal rates"}.`,
  };
};

// --- two-sample-intervals ---
fill["as3-ts-ci-1"] = (rng, idx) => {
  const diff = rng.int(8, 40);
  const m = rng.int(3, 7);
  return {
    id: `gen.as3-ts-ci-1.${idx}`, generated: true, concepts: ["two-sample-intervals"], difficulty: 1, context: "abstract",
    prompt: `Two groups give $\\bar{x}_1 - \\bar{x}_2 = ${diff}$ with margin of error $m = ${m}$. Build the confidence interval for $\\mu_1 - \\mu_2$ by finding its endpoints, then interpret.`,
    steps: [
      { instruction: `Lower bound: $${diff} - ${m}$. (Give a number.)`, answer: `${diff - m}`, accept: [], hint: `Subtract the margin.` },
      { instruction: `Upper bound: $${diff} + ${m}$. (Give a number.)`, answer: `${diff + m}`, accept: [], hint: `Add the margin.` },
      { instruction: `Does the interval contain 0? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Both endpoints are positive.` },
    ],
    finalAnswer: { value: `(${diff - m}, ${diff + m})`, unit: "" },
    solutionNarrative: `The interval is $(${diff - m}, ${diff + m})$. Zero is outside it, so every plausible value of $\\mu_1 - \\mu_2$ is positive — the same verdict a two-tailed test would give.`,
  };
};
fill["as3-ts-ci-2"] = (rng, idx) => {
  const c = rng.pick(MEANCFG);
  const conf = rng.pick([
    { level: 90, z: "1.645", zT: 1645 },
    { level: 95, z: "1.960", zT: 1960 },
    { level: 99, z: "2.576", zT: 2576 },
  ]);
  const diff = rng.int(15, 45);
  const mT = conf.zT * c.se;                 // thousandths
  const loT = diff * 1000 - mT, hiT = diff * 1000 + mT;
  return {
    id: `gen.as3-ts-ci-2.${idx}`, generated: true, concepts: ["two-sample-intervals"], difficulty: 2, context: "applied",
    prompt: `Two production lines: $\\bar{x}_1 - \\bar{x}_2 = ${diff}$, with $s_1 = ${c.s1}$, $n_1 = ${c.n1}$, $s_2 = ${c.s2}$, $n_2 = ${c.n2}$. Build a ${conf.level}% confidence interval for $\\mu_1 - \\mu_2$ using $z^* = ${conf.z}$ (large-sample). Give exact values.`,
    steps: [
      { instruction: `Standard error: $\\sqrt{\\dfrac{${c.s1 * c.s1}}{${c.n1}} + \\dfrac{${c.s2 * c.s2}}{${c.n2}}}$. (Give a whole number.)`, answer: `${c.se}`, accept: [`sqrt(${c.v1 + c.v2})`], hint: `$${c.v1} + ${c.v2} = ${c.v1 + c.v2}$.` },
      { instruction: `Margin of error: $${conf.z} \\times ${c.se}$. Give the exact value.`, answer: d1000(mT), accept: acc3(mT), hint: `Multiply.` },
      { instruction: `Lower bound: $${diff} - ${d1000(mT)}$. Give the exact value.`, answer: d1000(loT), accept: acc3(loT), hint: `Center minus margin.` },
      { instruction: `Upper bound: $${diff} + ${d1000(mT)}$. Give the exact value.`, answer: d1000(hiT), accept: acc3(hiT), hint: `Center plus margin.` },
    ],
    finalAnswer: { value: `(${d1000(loT)}, ${d1000(hiT)})`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${c.se}$, margin $= ${conf.z}(${c.se}) = ${d1000(mT)}$, so the ${conf.level}% CI for the difference is $(${d1000(loT)}, ${d1000(hiT)})$.`,
  };
};
fill["as3-ts-ci-3"] = (rng, idx) => {
  // p-hat values in hundredths; SE in hundredths; margin exact in hundred-thousandths.
  const c = rng.pick([
    { p1H: 55, p2H: 45, seH: 5, z: "1.960", zT: 1960 },  // margin 0.098
    { p1H: 62, p2H: 48, seH: 5, z: "1.960", zT: 1960 },  // diff 0.14
    { p1H: 24, p2H: 16, seH: 4, z: "1.645", zT: 1645 },  // margin 0.0658
    { p1H: 30, p2H: 22, seH: 3, z: "2.576", zT: 2576 },  // margin 0.07728
    { p1H: 52, p2H: 40, seH: 4, z: "1.960", zT: 1960 },  // margin 0.0784
  ]);
  const diffH = c.p1H - c.p2H;                      // hundredths
  const mHK = c.zT * c.seH;                         // hundred-thousandths (1e-5)
  const loHK = diffH * 1000 - mHK, hiHK = diffH * 1000 + mHK;
  const f5 = (v) => `${v / 100000}`;
  const containsZero = loHK < 0 && hiHK > 0;
  return {
    id: `gen.as3-ts-ci-3.${idx}`, generated: true, concepts: ["two-sample-intervals"], difficulty: 3, context: "applied",
    prompt: `An election poll finds candidate support $\\hat{p}_1 = ${d100(c.p1H)}$ in region 1 and $\\hat{p}_2 = ${d100(c.p2H)}$ in region 2; the standard error of the difference works out to $\\mathrm{SE} = ${d100(c.seH)}$. Build a confidence interval for $p_1 - p_2$ using $z^* = ${c.z}$. Give exact values.`,
    steps: [
      { instruction: `Point estimate: $\\hat{p}_1 - \\hat{p}_2 = ${d100(c.p1H)} - ${d100(c.p2H)}$. (Give a decimal.)`, answer: d100(diffH), accept: [], hint: `Subtract.` },
      { instruction: `Margin of error: $${c.z} \\times ${d100(c.seH)}$. Give the exact value.`, answer: f5(mHK), accept: [], hint: `Multiply.` },
      { instruction: `Lower bound: $${d100(diffH)} - ${f5(mHK)}$. Give the exact value.`, answer: f5(loHK), accept: [], hint: `Center minus margin.` },
      { instruction: `Upper bound: $${d100(diffH)} + ${f5(mHK)}$. Give the exact value.`, answer: f5(hiHK), accept: [], hint: `Center plus margin.` },
      { instruction: `Does the interval contain 0? Type 'yes' or 'no'.`, answer: containsZero ? "yes" : "no", accept: [], hint: `Check the signs of the endpoints.` },
    ],
    finalAnswer: { value: `(${f5(loHK)}, ${f5(hiHK)})`, unit: "" },
    solutionNarrative: `Estimate $${d100(diffH)}$, margin $${c.z}(${d100(c.seH)}) = ${f5(mHK)}$, interval $(${f5(loHK)}, ${f5(hiHK)})$. ${containsZero ? "Zero is inside, so the regions may not truly differ." : "Zero is outside, so region 1's lead is statistically real at this confidence level."}`,
  };
};

// ===========================================================================
// TOPIC 3: advanced-statistics.chi-square-tests
//   concepts: expected-counts, gof-statistic, independence-tests,
//             conditions-and-interpretation
// ===========================================================================

// --- expected-counts ---
fill["as3-chi-exp-1"] = (rng, idx) => {
  const c = rng.pick([
    { n: 100, ps: ["0.5", "0.3", "0.2"], es: [50, 30, 20] },
    { n: 200, ps: ["0.5", "0.3", "0.2"], es: [100, 60, 40] },
    { n: 200, ps: ["0.4", "0.4", "0.2"], es: [80, 80, 40] },
    { n: 300, ps: ["0.5", "0.3", "0.2"], es: [150, 90, 60] },
  ]);
  return {
    id: `gen.as3-chi-exp-1.${idx}`, generated: true, concepts: ["expected-counts"], difficulty: 1, context: "applied",
    prompt: `A company claims its support tickets split into three categories with probabilities ${c.ps.join(", ")}. In a sample of $n = ${c.n}$ tickets, find the EXPECTED count for each category: $E_i = n \\cdot p_i$.`,
    steps: [
      { instruction: `$E_1 = ${c.n} \\times ${c.ps[0]}$. (Give a whole number.)`, answer: `${c.es[0]}`, accept: [], hint: `Multiply.` },
      { instruction: `$E_2 = ${c.n} \\times ${c.ps[1]}$. (Give a whole number.)`, answer: `${c.es[1]}`, accept: [], hint: `Multiply.` },
      { instruction: `$E_3 = ${c.n} \\times ${c.ps[2]}$. (Give a whole number.)`, answer: `${c.es[2]}`, accept: [], hint: `The three expecteds must total $${c.n}$.` },
    ],
    finalAnswer: { value: `${c.es.join(", ")}`, unit: "" },
    solutionNarrative: `$E_i = n p_i$ gives $${c.es.join(", ")}$ — note they sum to $${c.n}$, a built-in sanity check. Expected counts may be decimals in general; only the OBSERVED counts must be whole.`,
  };
};
fill["as3-chi-exp-2"] = (rng, idx) => {
  const r1 = rng.pick([60, 80, 100, 120, 140]);
  const c1 = rng.pick([40, 50, 100]);
  const r2 = 200 - r1, c2 = 200 - c1;
  const e11 = (r1 * c1) / 200, e12 = (r1 * c2) / 200, e21 = (r2 * c1) / 200;
  return {
    id: `gen.as3-chi-exp-2.${idx}`, generated: true, concepts: ["expected-counts"], difficulty: 2, context: "applied",
    prompt: `A survey of 200 people is cross-tabulated by group (rows: ${r1} in group A, ${r2} in group B) and answer (columns: ${c1} yes, ${c2} no). Under independence, each expected count is $E = \\dfrac{\\text{row total} \\times \\text{column total}}{\\text{grand total}}$.`,
    steps: [
      { instruction: `Expected count for (A, yes): $\\dfrac{${r1} \\times ${c1}}{200}$. (Give a whole number.)`, answer: `${e11}`, accept: [`${r1 * c1}/200`], hint: `$${r1} \\times ${c1} = ${r1 * c1}$.` },
      { instruction: `Expected count for (A, no): $\\dfrac{${r1} \\times ${c2}}{200}$. (Give a whole number.)`, answer: `${e12}`, accept: [`${r1 * c2}/200`], hint: `The two row-A expecteds must total $${r1}$.` },
      { instruction: `Expected count for (B, yes): $\\dfrac{${r2} \\times ${c1}}{200}$. (Give a whole number.)`, answer: `${e21}`, accept: [`${r2 * c1}/200`], hint: `The two "yes" expecteds must total $${c1}$.` },
    ],
    finalAnswer: { value: `${e11}`, unit: "" },
    solutionNarrative: `Row and column totals fix the expecteds: $E_{A,\\text{yes}} = ${e11}$, $E_{A,\\text{no}} = ${e12}$, $E_{B,\\text{yes}} = ${e21}$ (and $E_{B,\\text{no}} = ${200 - r1 - c1 + e11}$). Independence means each cell gets its row's share of each column.`,
  };
};
fill["as3-chi-exp-3"] = (rng, idx) => {
  // Rows and columns ascending, so E11 is the smallest expected count.
  const c = rng.pick([
    { total: 40,  r1: 10, c1: 8,  met: false },  // E11 = 2
    { total: 40,  r1: 20, c1: 10, met: true },   // E11 = 5
    { total: 100, r1: 30, c1: 10, met: false },  // E11 = 3
    { total: 200, r1: 40, c1: 50, met: true },   // E11 = 10
    { total: 50,  r1: 10, c1: 15, met: false },  // E11 = 3
  ]);
  const r2 = c.total - c.r1, c2 = c.total - c.c1;
  const e11 = (c.r1 * c.c1) / c.total;
  const e22 = (r2 * c2) / c.total;
  return {
    id: `gen.as3-chi-exp-3.${idx}`, generated: true, concepts: ["expected-counts"], difficulty: 3, context: "applied",
    prompt: `A small clinical study cross-tabulates ${c.total} patients: rows ${c.r1}/${r2} (treated/untreated), columns ${c.c1}/${c2} (improved/not). Before running a chi-square test of independence, compute the expected counts and check the smallest one.`,
    steps: [
      { instruction: `Expected count for (treated, improved): $\\dfrac{${c.r1} \\times ${c.c1}}{${c.total}}$. (Give a number.)`, answer: `${e11}`, accept: [`${c.r1 * c.c1}/${c.total}`], hint: `Row total times column total over grand total.` },
      { instruction: `Expected count for (untreated, not improved): $\\dfrac{${r2} \\times ${c2}}{${c.total}}$. (Give a number.)`, answer: `${e22}`, accept: [`${r2 * c2}/${c.total}`], hint: `Same recipe.` },
      { instruction: `The smallest expected count in the table is the one from the smallest row and column. What is it? (Give a number.)`, answer: `${e11}`, accept: [], hint: `Row ${c.r1} and column ${c.c1} are the smallest margins.` },
      { instruction: `The rule of thumb requires every expected count to be at least 5. Is the condition met? Type 'yes' or 'no'.`, answer: c.met ? "yes" : "no", accept: [], hint: `Compare $${e11}$ with 5.` },
    ],
    finalAnswer: { value: c.met ? "yes" : "no", unit: "" },
    solutionNarrative: `$E_{11} = ${e11}$ is the smallest expected count. ${c.met ? "All expecteds are at least 5, so the chi-square approximation is trustworthy." : "Since it is below 5, the chi-square approximation is unreliable — combine categories or collect more data."}`,
  };
};

// --- gof-statistic ---
// dev sets engineered so each (O-E)^2/E term is exact in tenths.
const GOF3 = [
  { E: 20, devs: [4, -2, -2],  termsT: [8, 2, 2] },        // chi2 = 1.2
  { E: 20, devs: [8, -6, -2],  termsT: [32, 18, 2] },      // chi2 = 5.2
  { E: 20, devs: [6, -4, -2],  termsT: [18, 8, 2] },       // chi2 = 2.8
  { E: 25, devs: [10, -5, -5], termsT: [40, 10, 10] },     // chi2 = 6
  { E: 40, devs: [8, -4, -4],  termsT: [16, 4, 4] },       // chi2 = 2.4
  { E: 50, devs: [10, -5, -5], termsT: [20, 5, 5] },       // chi2 = 3
];
const GOF4 = [
  { E: 25, devs: [5, -5, 5, -5],   termsT: [10, 10, 10, 10] },  // chi2 = 4
  { E: 25, devs: [10, -5, -5, 0],  termsT: [40, 10, 10, 0] },   // chi2 = 6
  { E: 25, devs: [10, -10, 5, -5], termsT: [40, 40, 10, 10] },  // chi2 = 10
  { E: 20, devs: [4, -4, 2, -2],   termsT: [8, 8, 2, 2] },      // chi2 = 2
  { E: 50, devs: [10, -10, 5, -5], termsT: [20, 20, 5, 5] },    // chi2 = 5
];
const sumT = (a) => a.reduce((s, v) => s + v, 0);
fill["as3-chi-gof-1"] = (rng, idx) => {
  const c = rng.pick(GOF3);
  const O = c.devs.map((d) => c.E + d);
  const n = 3 * c.E;
  const chiT = sumT(c.termsT);
  return {
    id: `gen.as3-chi-gof-1.${idx}`, generated: true, concepts: ["gof-statistic"], difficulty: 1, context: "applied",
    prompt: `A spinner is claimed to land on its 3 regions equally often. In $n = ${n}$ spins the observed counts are $${O.join(", ")}$, while each expected count is $E = ${c.E}$. Compute $\\chi^2 = \\sum \\dfrac{(O - E)^2}{E}$.`,
    steps: [
      { instruction: `Term 1: $\\dfrac{(${O[0]} - ${c.E})^2}{${c.E}}$. (Give a decimal.)`, answer: d10(c.termsT[0]), accept: [], hint: `$(${c.devs[0]})^2 = ${c.devs[0] * c.devs[0]}$, then divide by ${c.E}.` },
      { instruction: `Term 2: $\\dfrac{(${O[1]} - ${c.E})^2}{${c.E}}$. (Give a decimal.)`, answer: d10(c.termsT[1]), accept: [], hint: `Deviations are squared, so the sign vanishes.` },
      { instruction: `Term 3: $\\dfrac{(${O[2]} - ${c.E})^2}{${c.E}}$. (Give a decimal.)`, answer: d10(c.termsT[2]), accept: [], hint: `Same recipe.` },
      { instruction: `Sum the three terms for $\\chi^2$. (Give a decimal.)`, answer: d10(chiT), accept: [], hint: `$${c.termsT.map(d10).join(" + ")}$.` },
      { instruction: `Degrees of freedom: $k - 1$ for $k = 3$ categories. (Give a whole number.)`, answer: "2", accept: [], hint: `One constraint: the counts must total $n$.` },
    ],
    finalAnswer: { value: d10(chiT), unit: "" },
    solutionNarrative: `The terms are $${c.termsT.map(d10).join(", ")}$, so $\\chi^2 = ${d10(chiT)}$ with $\\mathrm{df} = 2$. Each term measures one category's squared surprise, in units of its expected count.`,
  };
};
fill["as3-chi-gof-2"] = (rng, idx) => {
  const c = rng.pick(GOF4);
  const O = c.devs.map((d) => c.E + d);
  const n = 4 * c.E;
  const chiT = sumT(c.termsT);
  return {
    id: `gen.as3-chi-gof-2.${idx}`, generated: true, concepts: ["gof-statistic"], difficulty: 2, context: "applied",
    prompt: `A store claims its four checkout lanes are used equally. Among $n = ${n}$ customers the observed counts are $${O.join(", ")}$; each expected count is $E = ${c.E}$. Compute the goodness-of-fit statistic.`,
    steps: [
      { instruction: `Term 1: $\\dfrac{(${O[0]} - ${c.E})^2}{${c.E}}$. (Give a decimal.)`, answer: d10(c.termsT[0]), accept: [], hint: `$(${c.devs[0]})^2 / ${c.E}$.` },
      { instruction: `Term 2: $\\dfrac{(${O[1]} - ${c.E})^2}{${c.E}}$. (Give a decimal.)`, answer: d10(c.termsT[1]), accept: [], hint: `$(${c.devs[1]})^2 / ${c.E}$.` },
      { instruction: `Terms 3 and 4 work out to $${d10(c.termsT[2])}$ and $${d10(c.termsT[3])}$. Sum ALL FOUR terms for $\\chi^2$. (Give a decimal.)`, answer: d10(chiT), accept: [], hint: `$${c.termsT.map(d10).join(" + ")}$.` },
      { instruction: `Degrees of freedom: $k - 1$. (Give a whole number.)`, answer: "3", accept: [], hint: `$k = 4$ lanes.` },
    ],
    finalAnswer: { value: d10(chiT), unit: "" },
    solutionNarrative: `$\\chi^2 = ${c.termsT.map(d10).join(" + ")} = ${d10(chiT)}$ with $\\mathrm{df} = 3$. Note the deviations sum to zero, but the SQUARED terms all push $\\chi^2$ upward — chi-square only ever accumulates surprise.`,
  };
};
fill["as3-chi-gof-3"] = (rng, idx) => {
  // chi2 values keep a margin >= 0.2 from the df=3 critical values 7.815 / 11.345.
  const scen = rng.pick([
    { g: GOF4[0], alpha: "0.05", crit: "7.815",  reject: false },  // 4
    { g: GOF4[1], alpha: "0.05", crit: "7.815",  reject: false },  // 6
    { g: GOF4[2], alpha: "0.05", crit: "7.815",  reject: true },   // 10
    { g: GOF4[2], alpha: "0.01", crit: "11.345", reject: false },  // 10
    { g: GOF4[4], alpha: "0.05", crit: "7.815",  reject: false },  // 5
  ]);
  const c = scen.g;
  const O = c.devs.map((d) => c.E + d);
  const n = 4 * c.E;
  const chiT = sumT(c.termsT);
  return {
    id: `gen.as3-chi-gof-3.${idx}`, generated: true, concepts: ["gof-statistic"], difficulty: 3, context: "applied",
    prompt: `A genetics model predicts four phenotypes in equal proportions. Among $n = ${n}$ offspring the observed counts are $${O.join(", ")}$ (each expected count $E = ${c.E}$). Test the model at $\\alpha = ${scen.alpha}$: with $\\mathrm{df} = 3$ the critical value is $\\chi^{2*} = ${scen.crit}$, reject when $\\chi^2 > ${scen.crit}$.`,
    steps: [
      { instruction: `The four terms $\\dfrac{(O-E)^2}{E}$ are $${c.termsT.map(d10).join(", ")}$. Sum them for $\\chi^2$. (Give a decimal.)`, answer: d10(chiT), accept: [], hint: `Add the four values.` },
      { instruction: `Degrees of freedom: $k - 1$. (Give a whole number.)`, answer: "3", accept: [], hint: `$k = 4$ phenotypes.` },
      { instruction: `Is $${d10(chiT)} > ${scen.crit}$? Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Chi-square tests reject only in the RIGHT tail.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\chi^2 = ${d10(chiT)}$ against the df-3 critical value $${scen.crit}$ at $\\alpha = ${scen.alpha}$: we ${scen.reject ? "reject the model — the observed split is too far from equal proportions" : "fail to reject — the observed wobble is consistent with the model"}.`,
  };
};

// --- independence-tests ---
fill["as3-chi-ind-1"] = (rng, idx) => {
  // Hardcoded (dims, chi2, crit) with margins >= 0.5 from the critical value.
  const scen = rng.pick([
    { r: 2, c: 2, df: 1, crit: "3.841",  chi: "2.1",  reject: false },
    { r: 2, c: 2, df: 1, crit: "3.841",  chi: "5.3",  reject: true },
    { r: 2, c: 3, df: 2, crit: "5.991",  chi: "4.8",  reject: false },
    { r: 2, c: 3, df: 2, crit: "5.991",  chi: "7.2",  reject: true },
    { r: 3, c: 3, df: 4, crit: "9.488",  chi: "8.1",  reject: false },
    { r: 3, c: 4, df: 6, crit: "12.592", chi: "14.1", reject: true },
  ]);
  return {
    id: `gen.as3-chi-ind-1.${idx}`, generated: true, concepts: ["independence-tests"], difficulty: 1, context: "abstract",
    prompt: `A chi-square test of independence uses a ${scen.r}×${scen.c} table. The computed statistic is $\\chi^2 = ${scen.chi}$, and at $\\alpha = 0.05$ the critical value for the correct df is $${scen.crit}$: reject when $\\chi^2 > ${scen.crit}$.`,
    steps: [
      { instruction: `Degrees of freedom: $(r-1)(c-1) = (${scen.r}-1)(${scen.c}-1)$. (Give a whole number.)`, answer: `${scen.df}`, accept: [], hint: `Multiply.` },
      { instruction: `Is $${scen.chi} > ${scen.crit}$? Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare the two numbers.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\mathrm{df} = (${scen.r}-1)(${scen.c}-1) = ${scen.df}$, and $\\chi^2 = ${scen.chi}$ ${scen.reject ? ">" : "\\le"} ${scen.crit}$: ${scen.reject ? "reject independence — the variables are associated" : "fail to reject — the table is compatible with independence"}.`,
  };
};
fill["as3-chi-ind-2"] = (rng, idx) => {
  // 2x2, rows 100/100. Cols (2a, 2b) -> expecteds a (col 1) and b (col 2).
  const c = rng.pick([
    { a: 50, b: 50, d: 5 },   // terms 0.5/0.5, chi2 = 2
    { a: 50, b: 50, d: 10 },  // terms 2/2,     chi2 = 8
    { a: 50, b: 50, d: 15 },  // terms 4.5/4.5, chi2 = 18
    { a: 20, b: 80, d: 4 },   // terms 0.8/0.2, chi2 = 2
    { a: 20, b: 80, d: 6 },   // terms 1.8/0.45 -> use tenths-safe: 1.8, 0.45 (hundredths)
    { a: 20, b: 80, d: 8 },   // terms 3.2/0.8, chi2 = 8
  ]);
  const t1H = (c.d * c.d * 100) / c.a;      // term (O11-E11)^2/E11 in hundredths
  const t2H = (c.d * c.d * 100) / c.b;
  const chiH = 2 * (t1H + t2H);
  const O = [c.a + c.d, c.b - c.d, c.a - c.d, c.b + c.d];
  return {
    id: `gen.as3-chi-ind-2.${idx}`, generated: true, concepts: ["independence-tests"], difficulty: 2, context: "applied",
    prompt: `200 customers (100 in each of two age groups) are asked yes/no. Observed counts — group 1: ${O[0]} yes, ${O[1]} no; group 2: ${O[2]} yes, ${O[3]} no. Column totals are ${2 * c.a} yes and ${2 * c.b} no. Run the chi-square computation.`,
    steps: [
      { instruction: `Expected count for (group 1, yes): $\\dfrac{100 \\times ${2 * c.a}}{200}$. (Give a whole number.)`, answer: `${c.a}`, accept: [], hint: `Row total 100 times column total over 200.` },
      { instruction: `Term for that cell: $\\dfrac{(${O[0]} - ${c.a})^2}{${c.a}}$. (Give a decimal.)`, answer: d100(t1H), accept: [], hint: `$(${c.d})^2 = ${c.d * c.d}$.` },
      { instruction: `Term for (group 1, no), where $E = ${c.b}$: $\\dfrac{(${O[1]} - ${c.b})^2}{${c.b}}$. (Give a decimal.)`, answer: d100(t2H), accept: [], hint: `Same deviation, different expected.` },
      { instruction: `By symmetry, group 2's two terms repeat these. Total $\\chi^2 = 2 \\times (${d100(t1H)} + ${d100(t2H)})$. (Give a decimal.)`, answer: d100(chiH), accept: [], hint: `Double the sum.` },
      { instruction: `Degrees of freedom for a 2×2 table: $(2-1)(2-1)$. (Give a whole number.)`, answer: "1", accept: [], hint: `$(r-1)(c-1)$.` },
    ],
    finalAnswer: { value: d100(chiH), unit: "" },
    solutionNarrative: `All four expecteds come from row×column/total; every deviation is $\\pm ${c.d}$, giving $\\chi^2 = ${d100(chiH)}$ with $\\mathrm{df} = 1$. In a 2×2 table one deviation determines all four — that is why df is 1.`,
  };
};
fill["as3-chi-ind-3"] = (rng, idx) => {
  // 2x3, rows 100/100, cols (2e1, 2e1, 2e3); deviations +/-d on the first two
  // columns only. chi2 = 4*d^2/e1 (in tenths, exact). Margin >= 0.2 vs 5.991.
  const scen = rng.pick([
    { e1: 20, e3: 60, d: 5, reject: false },  // chi2 = 5
    { e1: 20, e3: 60, d: 6, reject: true },   // chi2 = 7.2
    { e1: 20, e3: 60, d: 8, reject: true },   // chi2 = 12.8
    { e1: 30, e3: 40, d: 6, reject: false },  // chi2 = 4.8
    { e1: 30, e3: 40, d: 9, reject: true },   // chi2 = 10.8
  ]);
  const termT = (scen.d * scen.d * 10) / scen.e1;   // per-cell term in tenths
  const chiT = 4 * termT;
  const O1 = [scen.e1 + scen.d, scen.e1 - scen.d, scen.e3];
  const O2 = [scen.e1 - scen.d, scen.e1 + scen.d, scen.e3];
  return {
    id: `gen.as3-chi-ind-3.${idx}`, generated: true, concepts: ["independence-tests"], difficulty: 3, context: "applied",
    prompt: `200 voters (100 urban, 100 rural) pick one of three candidates. Observed — urban: $${O1.join(", ")}$; rural: $${O2.join(", ")}$. Column totals: $${2 * scen.e1}, ${2 * scen.e1}, ${2 * scen.e3}$, so the expected counts per row are $${scen.e1}, ${scen.e1}, ${scen.e3}$. Test independence at $\\alpha = 0.05$: with the correct df the critical value is $5.991$, reject when $\\chi^2 > 5.991$.`,
    steps: [
      { instruction: `Degrees of freedom: $(2-1)(3-1)$. (Give a whole number.)`, answer: "2", accept: [], hint: `$(r-1)(c-1)$.` },
      { instruction: `Term for (urban, candidate 1): $\\dfrac{(${O1[0]} - ${scen.e1})^2}{${scen.e1}}$. (Give a decimal.)`, answer: d10(termT), accept: [], hint: `$(${scen.d})^2 = ${scen.d * scen.d}$.` },
      { instruction: `The third column matches its expected exactly (term 0), and the other three off-cells each repeat $${d10(termT)}$. Total $\\chi^2 = 4 \\times ${d10(termT)}$. (Give a decimal.)`, answer: d10(chiT), accept: [], hint: `Four equal nonzero terms.` },
      { instruction: `Is $${d10(chiT)} > 5.991$? Type 'yes' or 'no'.`, answer: scen.reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: scen.reject ? "reject" : "fail to reject", accept: scen.reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value $\\to$ reject.` },
    ],
    finalAnswer: { value: scen.reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$\\mathrm{df} = 2$ and $\\chi^2 = ${d10(chiT)}$. Since $${d10(chiT)}$ ${scen.reject ? "> 5.991, voting preference is ASSOCIATED with location" : "\\le 5.991, the data are compatible with independence"}.`,
  };
};

// --- conditions-and-interpretation ---
fill["as3-chi-cond-1"] = (rng, idx) => {
  const scen = rng.pick([
    "A blog reports category PERCENTAGES (34%, 41%, 25%) from a survey and runs a chi-square test directly on the numbers 34, 41, 25 without knowing the sample size",
    "An analyst converts observed counts to percentages before computing chi-square 'to make groups comparable'",
  ]);
  return {
    id: `gen.as3-chi-cond-1.${idx}`, generated: true, concepts: ["conditions-and-interpretation"], difficulty: 1, context: "applied",
    prompt: `${scen}. Diagnose the setup.`,
    steps: [
      { instruction: `Chi-square must be computed from raw ___. Type 'counts' or 'percentages'.`, answer: "counts", accept: ["raw counts", "count", "frequencies"], hint: `The statistic's size depends on $n$; percentages throw $n$ away.` },
      { instruction: `The rule of thumb requires every EXPECTED count to be at least what number?`, answer: "5", accept: ["five"], hint: `The classic threshold for the chi-square approximation.` },
    ],
    finalAnswer: { value: "counts", unit: "" },
    solutionNarrative: `Chi-square needs raw counts: 34%, 41%, 25% from $n = 40$ and from $n = 4000$ carry totally different evidence, but the percentages look identical. And every expected count should be at least 5 for the approximation to hold.`,
  };
};
fill["as3-chi-cond-2"] = (rng, idx) => {
  const c = rng.pick([
    { n: 60,  p: "0.05", E: 3, met: false, minN: 100 },
    { n: 200, p: "0.02", E: 4, met: false, minN: 250 },
    { n: 300, p: "0.02", E: 6, met: true,  minN: 250 },
    { n: 40,  p: "0.1",  E: 4, met: false, minN: 50 },
    { n: 120, p: "0.05", E: 6, met: true,  minN: 100 },
  ]);
  return {
    id: `gen.as3-chi-cond-2.${idx}`, generated: true, concepts: ["conditions-and-interpretation"], difficulty: 2, context: "applied",
    prompt: `A goodness-of-fit test has a rare category with claimed probability $p = ${c.p}$, and the planned sample size is $n = ${c.n}$. Check the expected-count condition for that category.`,
    steps: [
      { instruction: `Expected count: $E = ${c.n} \\times ${c.p}$. (Give a number.)`, answer: `${c.E}`, accept: [], hint: `Multiply.` },
      { instruction: `Every expected count must be at least 5. Is the condition met? Type 'yes' or 'no'.`, answer: c.met ? "yes" : "no", accept: [], hint: `Compare $${c.E}$ with 5.` },
      { instruction: `What is the SMALLEST sample size for which this category's expected count reaches 5? (Solve $n \\times ${c.p} = 5$.)`, answer: `${c.minN}`, accept: [], hint: `$n = 5 / ${c.p}$.` },
    ],
    finalAnswer: { value: `${c.minN}`, unit: "" },
    solutionNarrative: `$E = ${c.E}$, which ${c.met ? "meets" : "fails"} the at-least-5 rule; the category needs $n \\ge ${c.minN}$ to reach an expected count of 5. Rare categories, not small totals, are what break chi-square.`,
  };
};
fill["as3-chi-cond-3"] = (rng, idx) => {
  const scen = rng.pick([
    { pair: "screen-time bracket and sleep quality", conf: "age (younger people both use screens more and sleep differently)" },
    { pair: "coffee consumption and heart symptoms", conf: "smoking (smokers drink more coffee and have more symptoms)" },
    { pair: "newsletter subscription and purchase behavior", conf: "income (higher-income users both subscribe and buy more)" },
  ]);
  return {
    id: `gen.as3-chi-cond-3.${idx}`, generated: true, concepts: ["conditions-and-interpretation"], difficulty: 3, context: "applied",
    prompt: `A chi-square test of independence between ${scen.pair} REJECTS the null hypothesis at $\\alpha = 0.05$. Interpret the verdict precisely.`,
    steps: [
      { instruction: `Rejecting independence means the two variables are ___. Type 'associated' or 'independent'.`, answer: "associated", accept: ["dependent", "related", "association"], hint: `Rejecting "no relationship" leaves "some relationship".` },
      { instruction: `Does this prove that one variable CAUSES the other? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `A lurking variable such as ${scen.conf} could drive both.` },
      { instruction: `If instead the test had FAILED to reject, would that prove the variables are independent? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Absence of evidence is not evidence of absence.` },
    ],
    finalAnswer: { value: "associated", unit: "" },
    solutionNarrative: `Rejection says the variables are associated — the observed table is too lopsided for pure chance. It does NOT establish causation (${scen.conf} could explain the link), and failing to reject would not have proven independence either.`,
  };
};
