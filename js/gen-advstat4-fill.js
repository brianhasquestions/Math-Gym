// gen-advstat4-fill.js
// Parametric generators for the Advanced Statistics subject, topics
//   advanced-statistics.anova
//   advanced-statistics.regression-inference
//   advanced-statistics.experimental-design
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats2-fill.js). Template prefix: as4-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every statistic emitted is
// computed in the generator itself in integer arithmetic (scaled by
// 10/100/1000/100000 where decimals appear), so printed values are exact
// strings and answers always self-check.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const sum = (a) => a.reduce((s, v) => s + v, 0);
const d10 = (v) => `${v / 10}`;
const d100 = (v) => `${v / 100}`;
const d1000 = (v) => `${v / 1000}`;
const d100k = (v) => `${v / 100000}`;

// ===========================================================================
// TOPIC 1: advanced-statistics.anova
//   concepts: anova-setup, sums-of-squares, f-statistic, anova-decision
// ===========================================================================

// Within-group deviation patterns (3 observations per group, sum 0), with the
// exact sum of squared deviations attached.
const WPATS = {
  2: [[-1, 0, 1], [1, 0, -1], [0, 1, -1], [-1, 1, 0]],
  6: [[-2, 1, 1], [1, -2, 1], [1, 1, -2], [2, -1, -1], [-1, 2, -1], [-1, -1, 2]],
  8: [[-2, 0, 2], [2, 0, -2], [0, -2, 2], [0, 2, -2]],
};
// Multisets of within-group SS values whose total is divisible by 6
// (so MSW = SSW/6 is a whole number). Guarantees SSW > 0.
const SSW_COMBOS = {
  6: [[2, 2, 2]],
  12: [[2, 2, 8], [2, 8, 2], [8, 2, 2]],
  18: [[6, 6, 6], [2, 8, 8], [8, 2, 8], [8, 8, 2]],
  24: [[8, 8, 8]],
};
// Group-mean deviation patterns (3 groups, sum 0 so the grand mean is the base).
// ssb = 3 * sum(dm^2) for equal group sizes n = 3.
const BPATS = [
  { dm: [-1, 0, 1], ssb: 6 },
  { dm: [-2, 0, 2], ssb: 24 },
  { dm: [-2, 1, 1], ssb: 18 },
  { dm: [-1, -1, 2], ssb: 18 },
  { dm: [-3, 0, 3], ssb: 54 },
  { dm: [-3, 1, 2], ssb: 42 },
];
// Complete, pre-verified ANOVA parameter sets for k = 3, n = 3 (df 2 and 6).
// All F values are exact and sit at least 0.6 away from the quoted critical
// values F* = 5.14 (alpha 0.05) and F* = 10.92 (alpha 0.01).
const FPOOL = [
  { ssb: 24, dm: [-2, 0, 2], ssw: 6, msb: "12", msw: "1", F: "12", f: 12 },
  { ssb: 24, dm: [-2, 0, 2], ssw: 12, msb: "12", msw: "2", F: "6", f: 6 },
  { ssb: 24, dm: [0, -2, 2], ssw: 24, msb: "12", msw: "4", F: "3", f: 3 },
  { ssb: 18, dm: [-2, 1, 1], ssw: 12, msb: "9", msw: "2", F: "4.5", f: 4.5 },
  { ssb: 18, dm: [-1, -1, 2], ssw: 6, msb: "9", msw: "1", F: "9", f: 9 },
  { ssb: 54, dm: [-3, 0, 3], ssw: 18, msb: "27", msw: "3", F: "9", f: 9 },
  { ssb: 42, dm: [-3, 1, 2], ssw: 18, msb: "21", msw: "3", F: "7", f: 7 },
  { ssb: 6, dm: [-1, 0, 1], ssw: 12, msb: "3", msw: "2", F: "1.5", f: 1.5 },
  { ssb: 6, dm: [-1, 1, 0], ssw: 24, msb: "3", msw: "4", F: "0.75", f: 0.75 },
];
const ANOVA_CRIT = [
  { alpha: "0.05", fstar: 5.14, fstarS: "5.14" },
  { alpha: "0.01", fstar: 10.92, fstarS: "10.92" },
];
const ANOVA_CTX = [
  { thing: "fertilizer", groups: "three fertilizer blends tested on equal garden plots", y: "plot yield" },
  { thing: "diet", groups: "three feed mixtures given to matched groups of lambs", y: "weight gain" },
  { thing: "teaching method", groups: "three lesson formats used with matched study groups", y: "quiz score" },
  { thing: "coating", groups: "three protective coatings applied to sets of steel samples", y: "corrosion score" },
];
// Build a 3x3 dataset from a base grand mean, mean deviations, and within
// patterns whose SS values are given by the combo.
function anovaData(rng, dm, combo) {
  const g = rng.int(10, 30);
  const means = dm.map((d) => g + d);
  const pats = combo.map((ss) => rng.pick(WPATS[ss]));
  const obs = means.map((m, i) => pats[i].map((e) => m + e));
  return { g, means, pats, obs, ssParts: combo.slice() };
}
const rows = (obs) => obs.map((r, i) => `${["A", "B", "C"][i]}: ${r.join(", ")}`).join("; ");

export const fill = {};

// --- anova-setup ---
fill["as4-anova-setup-1"] = (rng, idx) => {
  const k = rng.int(3, 6);
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-setup-1.${idx}`, generated: true, concepts: ["anova-setup"], difficulty: 1, context: "applied",
    prompt: `A researcher compares the mean ${ctx.y} across ${k} groups (${k} versions of the ${ctx.thing}). She considers running a separate two-sample t-test on every pair of groups, each at the same significance level.`,
    steps: [
      { instruction: `Running many separate t-tests lets the false alarms pile up across tests. Which error becomes more likely overall? Type 'Type I' or 'Type II'.`, answer: "Type I", accept: ["type 1", "I", "1"], hint: `Each test carries its own $\\alpha$ chance of a false alarm; many tests, many chances.` },
      { instruction: `ANOVA replaces all those pairwise tests with ONE test. Its alternative hypothesis says: type 'all means differ' or 'at least one mean differs'.`, answer: "at least one mean differs", accept: ["at least one differs", "at least one mean is different", "at least one is different"], hint: `Rejecting only takes one group breaking away from the others.` },
      { instruction: `With $k = ${k}$ groups, the between-groups degrees of freedom are $k - 1$. (Give a number.)`, answer: `${k - 1}`, accept: [], hint: `Subtract one from the number of groups.` },
    ],
    finalAnswer: { value: `${k - 1}`, unit: "" },
    solutionNarrative: `Many pairwise t-tests inflate the overall Type I error rate. One-way ANOVA tests $H_0$: all means equal against $H_a$: at least one mean differs, in a single test with $df_{between} = k - 1 = ${k - 1}$.`,
  };
};
fill["as4-anova-setup-2"] = (rng, idx) => {
  const k = rng.int(3, 6);
  const n = rng.int(4, 8);
  const N = k * n;
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-setup-2.${idx}`, generated: true, concepts: ["anova-setup"], difficulty: 2, context: "applied",
    prompt: `A one-way ANOVA compares mean ${ctx.y} across $k = ${k}$ groups with $n = ${n}$ observations in each group. Work out the degrees of freedom.`,
    steps: [
      { instruction: `Total sample size: $N = k \\times n = ${k} \\times ${n}$. (Give a number.)`, answer: `${N}`, accept: [], hint: `Groups times observations per group.` },
      { instruction: `Between-groups degrees of freedom: $df_B = k - 1$. (Give a number.)`, answer: `${k - 1}`, accept: [], hint: `One less than the number of groups.` },
      { instruction: `Within-groups degrees of freedom: $df_W = N - k$. (Give a number.)`, answer: `${N - k}`, accept: [], hint: `$${N} - ${k}$.` },
    ],
    finalAnswer: { value: `${N - k}`, unit: "" },
    solutionNarrative: `$N = ${N}$, $df_B = k - 1 = ${k - 1}$, $df_W = N - k = ${N - k}$. Check: they add to $N - 1 = ${N - 1}$, the total degrees of freedom.`,
  };
};
fill["as4-anova-setup-3"] = (rng, idx) => {
  const k = rng.int(3, 5);
  const n = rng.int(4, 7);
  const N = k * n;
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-setup-3.${idx}`, generated: true, concepts: ["anova-setup"], difficulty: 3, context: "applied",
    prompt: `An agronomist runs a one-way ANOVA on ${ctx.y} for $k = ${k}$ versions of a ${ctx.thing}, with $n = ${n}$ plots per version. State the hypotheses and the full degrees-of-freedom bookkeeping.`,
    steps: [
      { instruction: `The null hypothesis $H_0$ says: type 'all group means are equal' or 'at least one mean differs'.`, answer: "all group means are equal", accept: ["all means are equal", "the group means are all equal", "all equal"], hint: `$H_0$ is the boring default — no treatment effect at all.` },
      { instruction: `The alternative $H_a$ says: type 'all group means are equal' or 'at least one mean differs'.`, answer: "at least one mean differs", accept: ["at least one differs", "at least one mean is different"], hint: `The opposite of "all equal" is not "all different".` },
      { instruction: `Between-groups degrees of freedom: $k - 1$. (Give a number.)`, answer: `${k - 1}`, accept: [], hint: `One less than the number of groups.` },
      { instruction: `Within-groups degrees of freedom: $N - k$ with $N = ${N}$. (Give a number.)`, answer: `${N - k}`, accept: [], hint: `$${N} - ${k}$.` },
      { instruction: `Total degrees of freedom: $N - 1$. (Give a number.)`, answer: `${N - 1}`, accept: [], hint: `They must satisfy $df_B + df_W = df_{total}$.` },
    ],
    finalAnswer: { value: `${N - 1}`, unit: "" },
    solutionNarrative: `$H_0$: all group means are equal; $H_a$: at least one mean differs. $df_B = ${k - 1}$, $df_W = ${N - k}$, and they add to $df_{total} = N - 1 = ${N - 1}$.`,
  };
};

// --- sums-of-squares ---
fill["as4-anova-ss-1"] = (rng, idx) => {
  const pat = rng.pick(BPATS);
  const g = rng.int(10, 30);
  const means = pat.dm.map((d) => g + d);
  const devSq = sum(pat.dm.map((d) => d * d));
  return {
    id: `gen.as4-anova-ss-1.${idx}`, generated: true, concepts: ["sums-of-squares"], difficulty: 1, context: "abstract",
    prompt: `Three groups of $n = 3$ observations each have group means $\\bar{x}_A = ${means[0]}$, $\\bar{x}_B = ${means[1]}$, $\\bar{x}_C = ${means[2]}$. Compute the between-groups sum of squares $SSB = n \\sum (\\bar{x}_i - \\bar{x})^2$.`,
    steps: [
      { instruction: `Grand mean: $\\bar{x} = \\dfrac{${means[0]} + ${means[1]} + ${means[2]}}{3}$. (Give a whole number.)`, answer: `${g}`, accept: [], hint: `Equal group sizes, so average the three means.` },
      { instruction: `Sum the squared deviations of the group means: $(${pat.dm[0]})^2 + (${pat.dm[1]})^2 + (${pat.dm[2]})^2$. (Give a number.)`, answer: `${devSq}`, accept: [], hint: `The deviations are $${pat.dm.join(", ")}$.` },
      { instruction: `Multiply by the group size: $SSB = 3 \\times ${devSq}$. (Give a number.)`, answer: `${pat.ssb}`, accept: [], hint: `Each group mean speaks for ${3} observations.` },
    ],
    finalAnswer: { value: `${pat.ssb}`, unit: "" },
    solutionNarrative: `Grand mean $${g}$; mean deviations $${pat.dm.join(", ")}$ square-sum to $${devSq}$, so $SSB = 3 \\times ${devSq} = ${pat.ssb}$.`,
  };
};
fill["as4-anova-ss-2"] = (rng, idx) => {
  const pat = rng.pick(BPATS);
  const target = rng.pick([6, 12, 18]);
  const combo = rng.pick(SSW_COMBOS[target]);
  const d = anovaData(rng, pat.dm, combo);
  const ctx = rng.pick(ANOVA_CTX);
  const cDevs = d.pats[2].join(", ");
  return {
    id: `gen.as4-anova-ss-2.${idx}`, generated: true, concepts: ["sums-of-squares"], difficulty: 2, context: "applied",
    prompt: `Measured ${ctx.y} for ${ctx.groups} — ${rows(d.obs)}. Find the group means and the within-groups sum of squares $SSW$.`,
    steps: [
      { instruction: `Mean of group A: $\\dfrac{${d.obs[0].join(" + ")}}{3}$. (Give a whole number.)`, answer: `${d.means[0]}`, accept: [], hint: `Add the three values and divide by three.` },
      { instruction: `Mean of group B. (Give a whole number.)`, answer: `${d.means[1]}`, accept: [], hint: `$(${d.obs[1].join("+")})/3$.` },
      { instruction: `Mean of group C. (Give a whole number.)`, answer: `${d.means[2]}`, accept: [], hint: `$(${d.obs[2].join("+")})/3$.` },
      { instruction: `Group A's squared deviations from ITS OWN mean sum to ${d.ssParts[0]}, and group B's sum to ${d.ssParts[1]}. Group C's deviations are $${cDevs}$. Add group C's squared deviations to get its contribution, then total everything: $SSW = ?$ (Give a number.)`, answer: `${target}`, accept: [], hint: `Group C contributes $${d.ssParts[2]}$; then $${d.ssParts[0]} + ${d.ssParts[1]} + ${d.ssParts[2]}$.` },
    ],
    finalAnswer: { value: `${target}`, unit: "" },
    solutionNarrative: `Group means: $${d.means.join(", ")}$. Within-group squared deviations contribute $${d.ssParts.join(" + ")} = ${target}$, so $SSW = ${target}$ — the noise left over after each group explains its own center.`,
  };
};
fill["as4-anova-ss-3"] = (rng, idx) => {
  const pat = rng.pick(BPATS.filter((p) => p.ssb <= 24));
  const target = rng.pick([6, 12, 18]);
  const combo = rng.pick(SSW_COMBOS[target]);
  const d = anovaData(rng, pat.dm, combo);
  const ctx = rng.pick(ANOVA_CTX);
  const devSq = sum(pat.dm.map((v) => v * v));
  return {
    id: `gen.as4-anova-ss-3.${idx}`, generated: true, concepts: ["sums-of-squares"], difficulty: 3, context: "applied",
    prompt: `A trial of ${ctx.groups} records ${ctx.y} — ${rows(d.obs)}. The group means are $${d.means[0]}$, $${d.means[1]}$, and $${d.means[2]}$. Build both ANOVA sums of squares.`,
    steps: [
      { instruction: `Grand mean of all nine observations. (Give a whole number.)`, answer: `${d.g}`, accept: [], hint: `With equal group sizes, average the three group means.` },
      { instruction: `Between: $SSB = 3\\left[(${d.means[0]} - ${d.g})^2 + (${d.means[1]} - ${d.g})^2 + (${d.means[2]} - ${d.g})^2\\right]$. (Give a number.)`, answer: `${pat.ssb}`, accept: [], hint: `The mean deviations are $${pat.dm.join(", ")}$; their squares sum to $${devSq}$.` },
      { instruction: `Group A's squared deviations from its own mean sum to ${d.ssParts[0]}; group B's sum to ${d.ssParts[1]}. Compute group C's contribution. (Give a number.)`, answer: `${d.ssParts[2]}`, accept: [], hint: `Group C's deviations are $${d.pats[2].join(", ")}$.` },
      { instruction: `Total within: $SSW = ${d.ssParts[0]} + ${d.ssParts[1]} + ${d.ssParts[2]}$. (Give a number.)`, answer: `${target}`, accept: [], hint: `Add the three contributions.` },
    ],
    finalAnswer: { value: `${target}`, unit: "" },
    solutionNarrative: `Grand mean $${d.g}$. $SSB = 3 \\times ${devSq} = ${pat.ssb}$ measures spread BETWEEN group means; $SSW = ${d.ssParts.join(" + ")} = ${target}$ measures noise WITHIN groups.`,
  };
};

// --- f-statistic ---
fill["as4-anova-f-1"] = (rng, idx) => {
  const c = rng.pick(FPOOL);
  return {
    id: `gen.as4-anova-f-1.${idx}`, generated: true, concepts: ["f-statistic"], difficulty: 1, context: "abstract",
    prompt: `A one-way ANOVA on ${3} groups of ${3} observations gives $SSB = ${c.ssb}$ and $SSW = ${c.ssw}$, with $df_B = 2$ and $df_W = 6$. Compute the F statistic.`,
    steps: [
      { instruction: `Mean square between: $MSB = \\dfrac{SSB}{df_B} = \\dfrac{${c.ssb}}{2}$. (Give a number.)`, answer: c.msb, accept: [], hint: `Divide by the between df.` },
      { instruction: `Mean square within: $MSW = \\dfrac{SSW}{df_W} = \\dfrac{${c.ssw}}{6}$. (Give a number.)`, answer: c.msw, accept: [], hint: `Divide by the within df.` },
      { instruction: `$F = \\dfrac{MSB}{MSW} = \\dfrac{${c.msb}}{${c.msw}}$. (Give a number.)`, answer: c.F, accept: [], hint: `Signal over noise.` },
    ],
    finalAnswer: { value: c.F, unit: "" },
    solutionNarrative: `$MSB = ${c.msb}$, $MSW = ${c.msw}$, so $F = ${c.F}$ — the between-group signal is ${c.F} times the within-group noise.`,
  };
};
fill["as4-anova-f-2"] = (rng, idx) => {
  const pool = [
    { k: 4, n: 4, ssb: 36, ssw: 24, msb: "12", msw: "2", F: "6" },
    { k: 4, n: 4, ssb: 24, ssw: 48, msb: "8", msw: "4", F: "2" },
    { k: 3, n: 5, ssb: 30, ssw: 60, msb: "15", msw: "5", F: "3" },
    { k: 5, n: 4, ssb: 48, ssw: 45, msb: "12", msw: "3", F: "4" },
    { k: 4, n: 6, ssb: 27, ssw: 40, msb: "9", msw: "2", F: "4.5" },
    { k: 3, n: 7, ssb: 44, ssw: 36, msb: "22", msw: "2", F: "11" },
  ];
  const c = rng.pick(pool);
  const N = c.k * c.n;
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-f-2.${idx}`, generated: true, concepts: ["f-statistic"], difficulty: 2, context: "applied",
    prompt: `An experiment on ${ctx.y} uses $k = ${c.k}$ groups with $n = ${c.n}$ observations each, and finds $SSB = ${c.ssb}$, $SSW = ${c.ssw}$. Build the full F statistic, degrees of freedom first.`,
    steps: [
      { instruction: `Between df: $k - 1$. (Give a number.)`, answer: `${c.k - 1}`, accept: [], hint: `One less than the number of groups.` },
      { instruction: `Within df: $N - k$ with $N = ${N}$. (Give a number.)`, answer: `${N - c.k}`, accept: [], hint: `$${N} - ${c.k}$.` },
      { instruction: `$MSB = \\dfrac{${c.ssb}}{${c.k - 1}}$. (Give a number.)`, answer: c.msb, accept: [], hint: `SSB over its df.` },
      { instruction: `$MSW = \\dfrac{${c.ssw}}{${N - c.k}}$. (Give a number.)`, answer: c.msw, accept: [], hint: `SSW over its df.` },
      { instruction: `$F = \\dfrac{MSB}{MSW}$. (Give a number.)`, answer: c.F, accept: [], hint: `$${c.msb} / ${c.msw}$.` },
    ],
    finalAnswer: { value: c.F, unit: "" },
    solutionNarrative: `$df_B = ${c.k - 1}$, $df_W = ${N - c.k}$; $MSB = ${c.msb}$, $MSW = ${c.msw}$, so $F = ${c.F}$.`,
  };
};
fill["as4-anova-f-3"] = (rng, idx) => {
  const c = rng.pick(FPOOL);
  const g = rng.int(12, 28);
  const means = c.dm.map((d) => g + d);
  const devSq = sum(c.dm.map((v) => v * v));
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-f-3.${idx}`, generated: true, concepts: ["f-statistic"], difficulty: 3, context: "applied",
    prompt: `A trial of ${ctx.groups} (three groups, $n = 3$ each) reports group means $${means.join(", ")}$ for ${ctx.y}, and a within-groups sum of squares $SSW = ${c.ssw}$. Assemble the F statistic from scratch ($df_B = 2$, $df_W = 6$).`,
    steps: [
      { instruction: `Grand mean. (Give a whole number.)`, answer: `${g}`, accept: [], hint: `Average the three group means (equal sizes).` },
      { instruction: `$SSB = 3\\sum(\\bar{x}_i - \\bar{x})^2$. (Give a number.)`, answer: `${c.ssb}`, accept: [], hint: `Mean deviations $${c.dm.join(", ")}$ square-sum to $${devSq}$; multiply by the group size.` },
      { instruction: `$MSB = \\dfrac{${c.ssb}}{2}$. (Give a number.)`, answer: c.msb, accept: [], hint: `SSB over between df.` },
      { instruction: `$MSW = \\dfrac{${c.ssw}}{6}$. (Give a number.)`, answer: c.msw, accept: [], hint: `SSW over within df.` },
      { instruction: `$F = \\dfrac{${c.msb}}{${c.msw}}$. (Give a number.)`, answer: c.F, accept: [], hint: `Divide the mean squares.` },
    ],
    finalAnswer: { value: c.F, unit: "" },
    solutionNarrative: `Grand mean $${g}$, $SSB = ${c.ssb}$, so $MSB = ${c.msb}$ against $MSW = ${c.msw}$: $F = ${c.F}$.`,
  };
};

// --- anova-decision ---
fill["as4-anova-decide-1"] = (rng, idx) => {
  const c = rng.pick(FPOOL);
  const crit = ANOVA_CRIT[0];
  const reject = c.f > crit.fstar;
  return {
    id: `gen.as4-anova-decide-1.${idx}`, generated: true, concepts: ["anova-decision"], difficulty: 1, context: "abstract",
    prompt: `A one-way ANOVA with $df_B = 2$ and $df_W = 6$ gives $F = ${c.F}$. At $\\alpha = ${crit.alpha}$ the critical value is $F^* = ${crit.fstarS}$: reject $H_0$ when $F > F^*$. Decide.`,
    steps: [
      { instruction: `Is $${c.F} > ${crit.fstarS}$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare the two numbers.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Beyond the critical value means significant.` },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$F = ${c.F}$ ${reject ? ">" : "\\le"} ${crit.fstarS}$, so we ${reject ? "reject $H_0$: at least one group mean differs" : "fail to reject $H_0$: the group differences are within noise"}.`,
  };
};
fill["as4-anova-decide-2"] = (rng, idx) => {
  const c = rng.pick(FPOOL);
  const crit = rng.pick(ANOVA_CRIT);
  const reject = c.f > crit.fstar;
  const interp = reject
    ? { q: `Does rejecting prove that EVERY pair of group means differs? Type 'yes' or 'no'.`, a: "no", h: `Rejection only says the means are not ALL equal.` }
    : { q: `Does failing to reject PROVE that all the group means are equal? Type 'yes' or 'no'.`, a: "no", h: `Absence of evidence is not evidence of absence.` };
  return {
    id: `gen.as4-anova-decide-2.${idx}`, generated: true, concepts: ["anova-decision"], difficulty: 2, context: "applied",
    prompt: `An ANOVA table reports $MSB = ${c.msb}$ and $MSW = ${c.msw}$ ($df_B = 2$, $df_W = 6$). At $\\alpha = ${crit.alpha}$ the critical value is $F^* = ${crit.fstarS}$. Finish the test.`,
    steps: [
      { instruction: `$F = \\dfrac{${c.msb}}{${c.msw}}$. (Give a number.)`, answer: c.F, accept: [], hint: `Mean square between over mean square within.` },
      { instruction: `Is $${c.F} > ${crit.fstarS}$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare with the critical value.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Reject only when $F$ beats $F^*$.` },
      { instruction: interp.q, answer: interp.a, accept: [], hint: interp.h },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$F = ${c.F}$ ${reject ? ">" : "\\le"} F^* = ${crit.fstarS}$: ${reject ? "reject $H_0$. But rejection says only that at least one mean differs — not that every pair does" : "fail to reject $H_0$. That is a shrug, not a proof that the means are equal"}.`,
  };
};
fill["as4-anova-decide-3"] = (rng, idx) => {
  const c = rng.pick(FPOOL.filter((e) => e.f > 5.8)); // clear rejections at alpha = 0.05
  const crit = ANOVA_CRIT[0];
  const ctx = rng.pick(ANOVA_CTX);
  return {
    id: `gen.as4-anova-decide-3.${idx}`, generated: true, concepts: ["anova-decision"], difficulty: 3, context: "applied",
    prompt: `Comparing ${ctx.groups}, a one-way ANOVA gives $F = ${c.F}$ with $df_B = 2$, $df_W = 6$. At $\\alpha = ${crit.alpha}$, $F^* = ${crit.fstarS}$. Decide, then say precisely what the decision does and does not tell you.`,
    steps: [
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: "reject", accept: ["reject the null"], hint: `$${c.F} > ${crit.fstarS}$.` },
      { instruction: `What does rejection support? Type 'all means differ' or 'at least one mean differs'.`, answer: "at least one mean differs", accept: ["at least one differs", "at least one mean is different"], hint: `The alternative hypothesis is deliberately modest.` },
      { instruction: `Does the ANOVA by itself tell you WHICH group is the odd one out? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `That takes follow-up pairwise comparisons.` },
    ],
    finalAnswer: { value: "at least one mean differs", unit: "" },
    solutionNarrative: `$F = ${c.F} > ${crit.fstarS}$: reject $H_0$. That establishes only that at least one mean differs; identifying WHICH group requires follow-up comparisons (with their own multiple-testing protection).`,
  };
};

// ===========================================================================
// TOPIC 2: advanced-statistics.regression-inference
//   concepts: model-and-residual-sd, slope-inference,
//             r-squared-interpretation, prediction-vs-confidence
// ===========================================================================

// Residual patterns for x = 1..6 with sum(e) = 0 and sum(e*x) = 0, so the
// least-squares fit of y = a + b x + e is EXACTLY the generating line.
// Each pattern is a shape; multiply by k. SSE = 4k^2, so s_e = k exactly
// (df = n - 2 = 4).
const EPATS = [
  [0, 1, -1, -1, 1, 0],
  [1, -1, -1, 1, 0, 0],
  [0, 0, 1, -1, -1, 1],
  [1, -1, 0, 0, -1, 1],
  [1, 0, -1, -1, 0, 1],
];
function regData(rng, kChoices) {
  const a = rng.int(2, 8);
  const b = rng.int(1, 4);
  const k = rng.pick(kChoices);
  const shape = rng.pick(EPATS);
  const e = shape.map((v) => v * k);
  const xs = [1, 2, 3, 4, 5, 6];
  const ys = xs.map((x, i) => a + b * x + e[i]);
  // pick a target x whose residual is nonzero
  const nz = xs.filter((x, i) => e[i] !== 0);
  const xt = rng.pick(nz);
  const it = xt - 1;
  return { a, b, k, e, xs, ys, xt, it, sse: 4 * k * k };
}
const REG_CTX = [
  { x: "hours of practice", y: "typing speed", unit: "words per minute" },
  { x: "weekly ad spend", y: "weekly sales", unit: "units" },
  { x: "fertilizer dose", y: "plant height", unit: "cm" },
  { x: "study hours", y: "exam score", unit: "points" },
];

// --- model-and-residual-sd ---
fill["as4-reg-resid-1"] = (rng, idx) => {
  const a = rng.int(3, 20);
  const b = rng.int(2, 5);
  const x0 = rng.int(2, 9);
  const r = rng.pick([-3, -2, -1, 1, 2, 3]);
  const yhat = a + b * x0;
  const y0 = yhat + r;
  return {
    id: `gen.as4-reg-resid-1.${idx}`, generated: true, concepts: ["model-and-residual-sd"], difficulty: 1, context: "abstract",
    prompt: `The linear model $y = \\alpha + \\beta x + \\varepsilon$ is estimated as $\\hat{y} = ${a} + ${b}x$. One data point is $(${x0}, ${y0})$. Find its residual.`,
    steps: [
      { instruction: `Predicted value at $x = ${x0}$: $\\hat{y} = ${a} + ${b} \\times ${x0}$. (Give a number.)`, answer: `${yhat}`, accept: [], hint: `Plug in and evaluate.` },
      { instruction: `Residual: $y - \\hat{y} = ${y0} - ${yhat}$. (Give a number, sign included.)`, answer: `${r}`, accept: [], hint: `Observed minus predicted.` },
      { instruction: `Does the point sit ABOVE or BELOW the fitted line? Type 'above' or 'below'.`, answer: r > 0 ? "above" : "below", accept: [], hint: `Positive residual means above.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$\\hat{y} = ${yhat}$, so the residual is $${y0} - ${yhat} = ${r}$: the point lies ${r > 0 ? "above" : "below"} the line — the part of $y$ the model did not explain.`,
  };
};
fill["as4-reg-resid-2"] = (rng, idx) => {
  const d = regData(rng, [1, 2]);
  const ctx = rng.pick(REG_CTX);
  const yhat = d.a + d.b * d.xt;
  const seSq = d.k * d.k;
  return {
    id: `gen.as4-reg-resid-2.${idx}`, generated: true, concepts: ["model-and-residual-sd"], difficulty: 2, context: "applied",
    prompt: `Data on ${ctx.x} ($x$) and ${ctx.y} ($y$): $x: ${d.xs.join(", ")}$; $y: ${d.ys.join(", ")}$. The least-squares line is exactly $\\hat{y} = ${d.a} + ${d.b}x$. Work toward the residual standard deviation.`,
    steps: [
      { instruction: `Predicted value at $x = ${d.xt}$. (Give a number.)`, answer: `${yhat}`, accept: [], hint: `$${d.a} + ${d.b} \\times ${d.xt}$.` },
      { instruction: `Residual at $x = ${d.xt}$: $${d.ys[d.it]} - ${yhat}$. (Give a number, sign included.)`, answer: `${d.e[d.it]}`, accept: [], hint: `Observed minus predicted.` },
      { instruction: `Computing all six residuals the same way gives $${d.e.join(", ")}$. Sum their squares to get $SSE$. (Give a number.)`, answer: `${d.sse}`, accept: [], hint: `Square each residual, then add.` },
      { instruction: `With $n = 6$, the residual variance is $s_e^2 = \\dfrac{SSE}{n - 2} = \\dfrac{${d.sse}}{4}$. (Give a number.)`, answer: `${seSq}`, accept: [], hint: `Divide by $n - 2$, not $n$.` },
    ],
    finalAnswer: { value: `${seSq}`, unit: "" },
    solutionNarrative: `The residual at $x = ${d.xt}$ is $${d.e[d.it]}$; the six residuals square-sum to $SSE = ${d.sse}$, so $s_e^2 = ${d.sse}/4 = ${seSq}$. We divide by $n - 2$ because the line already spent two degrees of freedom on $a$ and $b$.`,
  };
};
fill["as4-reg-resid-3"] = (rng, idx) => {
  const d = regData(rng, [2, 3]);
  const ctx = rng.pick(REG_CTX);
  const yhat = d.a + d.b * d.xt;
  const seSq = d.k * d.k;
  return {
    id: `gen.as4-reg-resid-3.${idx}`, generated: true, concepts: ["model-and-residual-sd"], difficulty: 3, context: "applied",
    prompt: `For ${ctx.x} ($x$) and ${ctx.y} ($y$, in ${ctx.unit}): $x: ${d.xs.join(", ")}$; $y: ${d.ys.join(", ")}$. The fitted model is $\\hat{y} = ${d.a} + ${d.b}x$. Compute the residual standard deviation $s_e$ and interpret it.`,
    steps: [
      { instruction: `Residual at $x = ${d.xt}$ (predicted first, then observed minus predicted). (Give a number, sign included.)`, answer: `${d.e[d.it]}`, accept: [], hint: `$\\hat{y} = ${yhat}$ there.` },
      { instruction: `All six residuals are $${d.e.join(", ")}$. Compute $SSE$. (Give a number.)`, answer: `${d.sse}`, accept: [], hint: `Sum of squared residuals.` },
      { instruction: `$s_e^2 = \\dfrac{SSE}{n - 2} = \\dfrac{${d.sse}}{4}$. (Give a number.)`, answer: `${seSq}`, accept: [], hint: `$n = 6$, so $n - 2 = 4$.` },
      { instruction: `$s_e = \\sqrt{${seSq}}$. (Give a number.)`, answer: `${d.k}`, accept: [`sqrt(${seSq})`], hint: `$${d.k}^2 = ${seSq}$.` },
      { instruction: `A LARGER $s_e$ would make predictions from this line more precise or less precise? Type 'more precise' or 'less precise'.`, answer: "less precise", accept: ["less"], hint: `$s_e$ is the typical size of the prediction errors.` },
    ],
    finalAnswer: { value: `${d.k}`, unit: ctx.unit },
    solutionNarrative: `$SSE = ${d.sse}$, $s_e^2 = ${seSq}$, so $s_e = ${d.k}$ ${ctx.unit}: predictions from this line typically miss by about ${d.k} ${ctx.unit}. Bigger $s_e$, blurrier predictions.`,
  };
};

// --- slope-inference ---
const TPOOL = [
  { tT: 25, seH: 20 }, { tT: 30, seH: 20 }, { tT: 40, seH: 25 },
  { tT: -30, seH: 40 }, { tT: 15, seH: 40 }, { tT: 50, seH: 20 }, { tT: -25, seH: 40 },
];
fill["as4-reg-slope-1"] = (rng, idx) => {
  const c = rng.pick(TPOOL);
  const n = rng.pick([8, 10, 12, 20]);
  const b = d1000(c.tT * c.seH);       // exact: t * SE
  const se = d100(c.seH);
  const t = d10(c.tT);
  const ctx = rng.pick(REG_CTX);
  return {
    id: `gen.as4-reg-slope-1.${idx}`, generated: true, concepts: ["slope-inference"], difficulty: 1, context: "applied",
    prompt: `A regression of ${ctx.y} on ${ctx.x} from $n = ${n}$ observations gives slope $b = ${b}$ with standard error $SE(b) = ${se}$. Compute the t statistic for testing $H_0: \\beta = 0$.`,
    steps: [
      { instruction: `Degrees of freedom: $n - 2$. (Give a number.)`, answer: `${n - 2}`, accept: [], hint: `A regression line spends two degrees of freedom.` },
      { instruction: `$t = \\dfrac{b}{SE(b)} = \\dfrac{${b}}{${se}}$. (Give a number.)`, answer: t, accept: [], hint: `How many standard errors is $b$ away from zero?` },
    ],
    finalAnswer: { value: t, unit: "" },
    solutionNarrative: `$df = ${n - 2}$ and $t = ${b}/${se} = ${t}$: the estimated slope sits ${Math.abs(c.tT / 10)} standard errors from zero.`,
  };
};
fill["as4-reg-slope-2"] = (rng, idx) => {
  const conf = rng.pick([
    { n: 6, df: 4, t: "2.776", tT: 2776 },
    { n: 10, df: 8, t: "2.306", tT: 2306 },
    { n: 12, df: 10, t: "2.228", tT: 2228 },
  ]);
  const seH = rng.pick([20, 25, 50]);
  const bT = rng.int(8, 30);                 // slope in tenths
  const mU = conf.tT * seH;                  // margin in hundred-thousandths, exact
  const loU = bT * 10000 - mU, hiU = bT * 10000 + mU;
  const ctx = rng.pick(REG_CTX);
  return {
    id: `gen.as4-reg-slope-2.${idx}`, generated: true, concepts: ["slope-inference"], difficulty: 2, context: "applied",
    prompt: `A regression of ${ctx.y} on ${ctx.x} from $n = ${conf.n}$ points gives $b = ${d10(bT)}$ with $SE(b) = ${d100(seH)}$. Build a 95% confidence interval for the true slope $\\beta$ using $t^* = ${conf.t}$ (for $df = n - 2 = ${conf.df}$). Give exact values.`,
    steps: [
      { instruction: `Margin of error: $t^* \\times SE(b) = ${conf.t} \\times ${d100(seH)}$. Give the exact value.`, answer: d100k(mU), accept: [], hint: `Multiply the two numbers.` },
      { instruction: `Lower bound: $${d10(bT)} - ${d100k(mU)}$. Give the exact value.`, answer: d100k(loU), accept: [], hint: `Slope minus margin.` },
      { instruction: `Upper bound: $${d10(bT)} + ${d100k(mU)}$. Give the exact value.`, answer: d100k(hiU), accept: [], hint: `Slope plus margin.` },
    ],
    finalAnswer: { value: `(${d100k(loU)}, ${d100k(hiU)})`, unit: "" },
    solutionNarrative: `Margin $= ${conf.t} \\times ${d100(seH)} = ${d100k(mU)}$, so the 95% CI for $\\beta$ is $(${d100k(loU)}, ${d100k(hiU)})$ — the range of slopes compatible with the data.`,
  };
};
fill["as4-reg-slope-3"] = (rng, idx) => {
  const conf = rng.pick([
    { n: 10, df: 8, t: "2.306", tstar: 2.306 },
    { n: 12, df: 10, t: "2.228", tstar: 2.228 },
  ]);
  const c = rng.pick([
    { tT: 30, seH: 20 }, { tT: 40, seH: 25 }, { tT: -30, seH: 40 },
    { tT: 15, seH: 40 }, { tT: -15, seH: 20 }, { tT: 50, seH: 20 },
  ]);
  const b = d1000(c.tT * c.seH);
  const se = d100(c.seH);
  const t = d10(c.tT);
  const absT = Math.abs(c.tT) / 10;
  const reject = absT > conf.tstar;
  const ctx = rng.pick(REG_CTX);
  const interp = reject
    ? { q: `Rejecting supports that the true slope $\\beta$ differs from zero — i.e. a real linear relationship. Type 'yes' or 'no': is that what this test result supports?`, a: "yes", h: `That is exactly what rejecting $H_0: \\beta = 0$ means.` }
    : { q: `Does failing to reject PROVE the true slope is exactly zero? Type 'yes' or 'no'.`, a: "no", h: `The data are merely compatible with a zero slope; a small sample proves nothing.` };
  return {
    id: `gen.as4-reg-slope-3.${idx}`, generated: true, concepts: ["slope-inference"], difficulty: 3, context: "applied",
    prompt: `Testing $H_0: \\beta = 0$ against $H_a: \\beta \\ne 0$ for the regression of ${ctx.y} on ${ctx.x}: $n = ${conf.n}$, $b = ${b}$, $SE(b) = ${se}$. The two-tailed critical value at $\\alpha = 0.05$ is $t^* = ${conf.t}$ ($df = ${conf.df}$): reject when $|t| > t^*$.`,
    steps: [
      { instruction: `$t = \\dfrac{${b}}{${se}}$. (Give a number.)`, answer: t, accept: [], hint: `Slope over its standard error.` },
      { instruction: `Is $|${t}| > ${conf.t}$? Type 'yes' or 'no'.`, answer: reject ? "yes" : "no", accept: [], hint: `Compare $${absT}$ with $${conf.t}$.` },
      { instruction: `Decision: type 'reject' or 'fail to reject'.`, answer: reject ? "reject" : "fail to reject", accept: reject ? ["reject the null"] : ["do not reject", "fail"], hint: `Two-tailed: only the size of $t$ matters.` },
      { instruction: interp.q, answer: interp.a, accept: [], hint: interp.h },
    ],
    finalAnswer: { value: reject ? "reject" : "fail to reject", unit: "" },
    solutionNarrative: `$t = ${t}$, $|t| = ${absT}$ ${reject ? ">" : "\\le"} ${conf.t}$: ${reject ? "reject $H_0$ — the data support a genuine linear relationship between the variables" : "fail to reject $H_0$ — but that does not prove the slope is zero, only that this sample could not distinguish it from zero"}.`,
  };
};

// --- r-squared-interpretation ---
const RSQ1 = [
  { sst: 100, sse: 25, ratio: "0.25", r2: "0.75", pct: "75" },
  { sst: 100, sse: 36, ratio: "0.36", r2: "0.64", pct: "64" },
  { sst: 50, sse: 10, ratio: "0.2", r2: "0.8", pct: "80" },
  { sst: 80, sse: 20, ratio: "0.25", r2: "0.75", pct: "75" },
  { sst: 200, sse: 80, ratio: "0.4", r2: "0.6", pct: "60" },
  { sst: 25, sse: 4, ratio: "0.16", r2: "0.84", pct: "84" },
  { sst: 500, sse: 125, ratio: "0.25", r2: "0.75", pct: "75" },
];
fill["as4-reg-rsq-1"] = (rng, idx) => {
  const c = rng.pick(RSQ1);
  return {
    id: `gen.as4-reg-rsq-1.${idx}`, generated: true, concepts: ["r-squared-interpretation"], difficulty: 1, context: "abstract",
    prompt: `A regression has total sum of squares $SST = ${c.sst}$ and residual sum of squares $SSE = ${c.sse}$. Compute $r^2 = 1 - \\dfrac{SSE}{SST}$.`,
    steps: [
      { instruction: `Compute $\\dfrac{SSE}{SST} = \\dfrac{${c.sse}}{${c.sst}}$. (Give a decimal.)`, answer: c.ratio, accept: [`${c.sse}/${c.sst}`], hint: `The unexplained fraction.` },
      { instruction: `$r^2 = 1 - ${c.ratio}$. (Give a decimal.)`, answer: c.r2, accept: [], hint: `What is left is explained.` },
      { instruction: `An $r^2$ closer to one means the line explains MORE or LESS of the variation in $y$? Type 'more' or 'less'.`, answer: "more", accept: [], hint: `$r^2$ is the explained fraction.` },
    ],
    finalAnswer: { value: c.r2, unit: "" },
    solutionNarrative: `$SSE/SST = ${c.ratio}$ is the unexplained fraction, so $r^2 = ${c.r2}$: the line accounts for ${c.pct}% of the variation in $y$.`,
  };
};
fill["as4-reg-rsq-2"] = (rng, idx) => {
  const pool = [
    { ssr: 60, sst: 80, r2: "0.75", pct: "75" },
    { ssr: 45, sst: 50, r2: "0.9", pct: "90" },
    { ssr: 120, sst: 200, r2: "0.6", pct: "60" },
    { ssr: 160, sst: 250, r2: "0.64", pct: "64" },
    { ssr: 21, sst: 25, r2: "0.84", pct: "84" },
    { ssr: 140, sst: 400, r2: "0.35", pct: "35" },
  ];
  const c = rng.pick(pool);
  const ctx = rng.pick(REG_CTX);
  return {
    id: `gen.as4-reg-rsq-2.${idx}`, generated: true, concepts: ["r-squared-interpretation"], difficulty: 2, context: "applied",
    prompt: `Regressing ${ctx.y} on ${ctx.x} gives regression (explained) sum of squares $SSR = ${c.ssr}$ and total sum of squares $SST = ${c.sst}$. Compute and interpret $r^2 = \\dfrac{SSR}{SST}$.`,
    steps: [
      { instruction: `$r^2 = \\dfrac{${c.ssr}}{${c.sst}}$. (Give a decimal.)`, answer: c.r2, accept: [`${c.ssr}/${c.sst}`], hint: `Explained over total.` },
      { instruction: `What percent of the variation in ${ctx.y} does the model explain? (Give a number.)`, answer: c.pct, accept: [`${c.pct}%`], hint: `Multiply $r^2$ by one hundred.` },
      { instruction: `Does this $r^2$ prove that ${ctx.x} CAUSES ${ctx.y}? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `$r^2$ measures fit, not mechanism.` },
    ],
    finalAnswer: { value: c.r2, unit: "" },
    solutionNarrative: `$r^2 = ${c.ssr}/${c.sst} = ${c.r2}$: the line explains ${c.pct}% of the variation in ${ctx.y}. A good fit is not a causal proof — a lurking variable could drive both.`,
  };
};
fill["as4-reg-rsq-3"] = (rng, idx) => {
  const c = rng.pick(RSQ1);
  const ssr = c.sst - c.sse;
  const unpct = `${100 - Number(c.pct)}`;
  const ctx = rng.pick(REG_CTX);
  return {
    id: `gen.as4-reg-rsq-3.${idx}`, generated: true, concepts: ["r-squared-interpretation"], difficulty: 3, context: "applied",
    prompt: `For a regression of ${ctx.y} on ${ctx.x}: $SST = ${c.sst}$ and $SSE = ${c.sse}$. Decompose the variation and interpret carefully.`,
    steps: [
      { instruction: `Explained sum of squares: $SSR = SST - SSE = ${c.sst} - ${c.sse}$. (Give a number.)`, answer: `${ssr}`, accept: [], hint: `Total splits into explained plus residual.` },
      { instruction: `$r^2 = \\dfrac{SSR}{SST}$. (Give a decimal.)`, answer: c.r2, accept: [`${ssr}/${c.sst}`], hint: `Explained over total.` },
      { instruction: `What percent of the variation is left UNEXPLAINED by the line? (Give a number.)`, answer: unpct, accept: [`${unpct}%`], hint: `One hundred percent minus the explained share.` },
      { instruction: `A colleague says the high $r^2$ shows ${ctx.x} causes ${ctx.y}. Is that a valid conclusion? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Correlation and fit never establish causation by themselves.` },
    ],
    finalAnswer: { value: c.r2, unit: "" },
    solutionNarrative: `$SSR = ${ssr}$, so $r^2 = ${c.r2}$: ${c.pct}% explained, ${unpct}% residual. And $r^2$ is silent about causation — only a randomized experiment can speak to that.`,
  };
};

// --- prediction-vs-confidence ---
fill["as4-reg-pred-1"] = (rng, idx) => {
  const ctx = rng.pick(REG_CTX);
  const a = rng.int(10, 40);
  const b = rng.int(2, 5);
  const xstar = rng.int(3, 9);
  const yhat = a + b * xstar;
  return {
    id: `gen.as4-reg-pred-1.${idx}`, generated: true, concepts: ["prediction-vs-confidence"], difficulty: 1, context: "applied",
    prompt: `A regression of ${ctx.y} on ${ctx.x} gives $\\hat{y} = ${a} + ${b}x$. At the same value $x^* = ${xstar}$, two intervals can be built: a confidence interval for the MEAN response, and a prediction interval for ONE new individual observation.`,
    steps: [
      { instruction: `Both intervals are centered at the same point estimate. Compute $\\hat{y} = ${a} + ${b} \\times ${xstar}$. (Give a number.)`, answer: `${yhat}`, accept: [], hint: `Plug in $x^*$.` },
      { instruction: `Which interval is WIDER? Type 'prediction interval' or 'confidence interval'.`, answer: "prediction interval", accept: ["prediction", "the prediction interval"], hint: `One individual carries all the scatter around the mean as extra uncertainty.` },
    ],
    finalAnswer: { value: "prediction interval", unit: "" },
    solutionNarrative: `Both intervals center at $\\hat{y} = ${yhat}$, but the prediction interval is always wider: it must cover the scatter of individual points around the mean response, not just the uncertainty in the mean itself.`,
  };
};
fill["as4-reg-pred-2"] = (rng, idx) => {
  const ctx = rng.pick(REG_CTX);
  const a = rng.int(10, 40);
  const bT = rng.pick([5, 8, 12, 15, 20, 25]);
  const xstar = rng.int(2, 10);
  const slopeT = bT * xstar;
  const yhatT = a * 10 + slopeT;
  return {
    id: `gen.as4-reg-pred-2.${idx}`, generated: true, concepts: ["prediction-vs-confidence"], difficulty: 2, context: "applied",
    prompt: `The fitted model for ${ctx.y} ($y$, in ${ctx.unit}) against ${ctx.x} ($x$) is $\\hat{y} = ${a} + ${d10(bT)}x$. A manager wants to forecast the outcome for ONE specific upcoming case with $x^* = ${xstar}$.`,
    steps: [
      { instruction: `Slope term: $${d10(bT)} \\times ${xstar}$. (Give a number.)`, answer: d10(slopeT), accept: [], hint: `Multiply slope by $x^*$.` },
      { instruction: `Point forecast: $\\hat{y} = ${a} + ${d10(slopeT)}$. (Give a number.)`, answer: d10(yhatT), accept: [], hint: `Add the intercept.` },
      { instruction: `To attach an interval to a forecast for ONE individual case, which interval is correct? Type 'prediction interval' or 'confidence interval'.`, answer: "prediction interval", accept: ["prediction", "the prediction interval"], hint: `Confidence intervals cover the MEAN response, not a single observation.` },
    ],
    finalAnswer: { value: d10(yhatT), unit: ctx.unit },
    solutionNarrative: `$\\hat{y} = ${a} + ${d10(bT)}(${xstar}) = ${d10(yhatT)}$ ${ctx.unit}. Because the target is a single new case, the honest interval is the (wider) prediction interval.`,
  };
};
fill["as4-reg-pred-3"] = (rng, idx) => {
  const ctx = rng.pick(REG_CTX);
  const a = rng.int(10, 30);
  const b = rng.int(2, 4);
  const lo = 2, hi = rng.pick([10, 12]);
  const xstar = hi + rng.int(10, 25);
  const yhat = a + b * xstar;
  return {
    id: `gen.as4-reg-pred-3.${idx}`, generated: true, concepts: ["prediction-vs-confidence"], difficulty: 3, context: "applied",
    prompt: `A model for ${ctx.y} against ${ctx.x}, $\\hat{y} = ${a} + ${b}x$, was fitted to data with $x$ only between ${lo} and ${hi}. A stakeholder requests a prediction at $x^* = ${xstar}$.`,
    steps: [
      { instruction: `Mechanically, the line outputs $${a} + ${b} \\times ${xstar}$. (Give a number.)`, answer: `${yhat}`, accept: [], hint: `Plug in and evaluate.` },
      { instruction: `Predicting at $x^* = ${xstar}$ is interpolation or extrapolation? Type one.`, answer: "extrapolation", accept: ["extrapolating"], hint: `Compare $${xstar}$ with the observed range $[${lo}, ${hi}]$.` },
      { instruction: `Should a prediction interval built here be trusted as much as one inside $[${lo}, ${hi}]$? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `The linear pattern was never observed out there — it may bend.` },
    ],
    finalAnswer: { value: "extrapolation", unit: "" },
    solutionNarrative: `The formula happily returns ${yhat}, but $x^* = ${xstar}$ sits far outside $[${lo}, ${hi}]$: this is extrapolation, and both the point forecast and any interval around it rest on an unverified assumption that the line keeps going straight.`,
  };
};

// ===========================================================================
// TOPIC 3: advanced-statistics.experimental-design
//   concepts: sampling-methods, bias-types,
//             experiments-vs-observation, randomization-and-blocking
// ===========================================================================

const SAMPLING_MENU = `Type 'simple random', 'stratified', 'cluster', 'systematic', or 'convenience'.`;
const SAMPLING_ACCEPT = {
  "simple random": ["simple random sample", "simple random sampling", "srs"],
  "stratified": ["stratified sampling", "stratified random sample", "stratified random sampling"],
  "cluster": ["cluster sampling", "cluster sample"],
  "systematic": ["systematic sampling", "systematic sample"],
  "convenience": ["convenience sampling", "convenience sample"],
};
// Each template has exactly one defensible answer; the distinguishing clause is
// baked into the wording (every-name-equally-likely / some-from-every-group /
// all-members-of-chosen-groups / every-kth-after-random-start / whoever-is-handy).
const SAMPLING_TEMPLATES = [
  { cat: "simple random", mk: (rng) => `A registrar loads all ${rng.int(2, 9) * 1000} student ID numbers into software that picks ${rng.int(50, 200)} of them completely at random, every ID equally likely and no grouping of any kind used` },
  { cat: "simple random", mk: (rng) => `An auditor writes each of the firm's ${rng.int(300, 900)} invoice numbers on identical slips, mixes them thoroughly in a drum, and draws ${rng.int(20, 60)} slips, with no attention to region, amount, or date` },
  { cat: "stratified", mk: (rng) => `A pollster splits the voter roll into urban, suburban, and rural residents, then draws a separate random sample FROM EACH of the three groups so every group is represented` },
  { cat: "stratified", mk: (rng) => `A dean divides the university into its ${rng.int(4, 8)} colleges and randomly selects students WITHIN EVERY college, so each college contributes members to the sample` },
  { cat: "cluster", mk: (rng) => `A health agency randomly picks ${rng.int(4, 9)} of a city's ${rng.int(30, 60)} neighborhoods and then interviews EVERY household in the chosen neighborhoods, visiting no other neighborhoods at all` },
  { cat: "cluster", mk: (rng) => `An airline randomly selects ${rng.int(3, 7)} of the day's ${rng.int(40, 90)} flights and surveys ALL passengers aboard those flights, leaving the remaining flights unsampled` },
  { cat: "systematic", mk: (rng) => `A factory inspector starts at a randomly chosen item and then pulls every ${rng.pick([10, 15, 20, 25])}th item off the conveyor for the rest of the shift` },
  { cat: "systematic", mk: (rng) => `A librarian picks a random starting shelf position and then examines every ${rng.pick([12, 20, 30])}th book in the catalog order` },
  { cat: "convenience", mk: (rng) => `A researcher stands by the entrance of one mall on a single afternoon and questions whoever happens to walk past and agrees to stop` },
  { cat: "convenience", mk: (rng) => `A student surveys only their own dorm-floor friends about campus dining because those people are easiest to reach` },
];
const pickTemplates = (rng, k) => {
  const shuffled = SAMPLING_TEMPLATES.slice();
  for (let i = shuffled.length - 1; i > 0; i--) { const j = rng.int(0, i); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const out = [];
  for (const t of shuffled) { if (!out.some((o) => o.cat === t.cat)) out.push(t); if (out.length === k) break; }
  return out;
};

// --- sampling-methods ---
fill["as4-des-sampling-1"] = (rng, idx) => {
  const t = pickTemplates(rng, 1)[0];
  const isSRS = t.cat === "simple random";
  return {
    id: `gen.as4-des-sampling-1.${idx}`, generated: true, concepts: ["sampling-methods"], difficulty: 1, context: "applied",
    prompt: `${t.mk(rng)}. Identify the sampling method.`,
    steps: [
      { instruction: `Which sampling method is this? ${SAMPLING_MENU}`, answer: t.cat, accept: SAMPLING_ACCEPT[t.cat], hint: `Look at HOW individuals end up in the sample: pure chance over the whole list, chance within groups, whole groups at once, a fixed counting rule, or mere ease of access.` },
      { instruction: `Under this method, does EVERY possible combination of individuals have an equal chance of being the sample? Type 'yes' or 'no'.`, answer: isSRS ? "yes" : "no", accept: [], hint: `Only a simple random sample makes every possible sample equally likely.` },
    ],
    finalAnswer: { value: t.cat, unit: "" },
    solutionNarrative: `The design is ${t.cat} sampling. ${isSRS ? "A simple random sample is the only method where every possible sample of that size is equally likely." : "Only a simple random sample gives every possible combination an equal chance; this method restricts which combinations can occur."}`,
  };
};
fill["as4-des-sampling-2"] = (rng, idx) => {
  const n = rng.pick([20, 25, 40, 50]);
  const k = rng.pick([8, 12, 15, 20]);
  const N = n * k;
  const thing = rng.pick(["parts coming off a production line", "names on an alphabetized customer list", "packages moving along a conveyor", "files in an archive, in date order"]);
  return {
    id: `gen.as4-des-sampling-2.${idx}`, generated: true, concepts: ["sampling-methods"], difficulty: 2, context: "applied",
    prompt: `A quality analyst wants a sample of $n = ${n}$ from $N = ${N}$ ${thing}. She chooses a random starting point and then takes every $k$th item, where $k = N/n$.`,
    steps: [
      { instruction: `Compute the sampling interval $k = \\dfrac{${N}}{${n}}$. (Give a number.)`, answer: `${k}`, accept: [], hint: `Population size over sample size.` },
      { instruction: `Which sampling method is this? ${SAMPLING_MENU}`, answer: "systematic", accept: SAMPLING_ACCEPT["systematic"], hint: `A fixed counting rule after a random start.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$k = ${N}/${n} = ${k}$: take every ${k}th item after a random start — systematic sampling. It spreads the sample evenly along the list, but a hidden cycle in the list matching $k$ would bias it.`,
  };
};
fill["as4-des-sampling-3"] = (rng, idx) => {
  const strat = rng.pick(SAMPLING_TEMPLATES.filter((t) => t.cat === "stratified"));
  const clus = rng.pick(SAMPLING_TEMPLATES.filter((t) => t.cat === "cluster"));
  const stratFirst = rng.int(0, 1) === 0;
  const first = stratFirst ? strat : clus, second = stratFirst ? clus : strat;
  return {
    id: `gen.as4-des-sampling-3.${idx}`, generated: true, concepts: ["sampling-methods"], difficulty: 3, context: "applied",
    prompt: `Two designs that both use groups — but in opposite ways. Design A: ${first.mk(rng)}. Design B: ${second.mk(rng)}. Classify each.`,
    steps: [
      { instruction: `Design A is which method? ${SAMPLING_MENU}`, answer: first.cat, accept: SAMPLING_ACCEPT[first.cat], hint: `Does it sample SOME members from EVERY group, or ALL members from SOME groups?` },
      { instruction: `Design B is which method? ${SAMPLING_MENU}`, answer: second.cat, accept: SAMPLING_ACCEPT[second.cat], hint: `The opposite of Design A.` },
      { instruction: `Stratified sampling takes: type 'some from every group' or 'all from some groups'.`, answer: "some from every group", accept: ["some members from every group", "some from each group"], hint: `Strata are all represented; clusters are wholly taken or wholly skipped.` },
    ],
    finalAnswer: { value: "some from every group", unit: "" },
    solutionNarrative: `Stratified sampling draws some members from EVERY group (guaranteeing representation); cluster sampling takes ALL members of a FEW randomly chosen groups (buying convenience at the cost of similarity within clusters).`,
  };
};

// --- bias-types ---
const BIAS_MENU = `Type 'undercoverage', 'nonresponse', 'response', or 'selection'.`;
const BIAS_ACCEPT = {
  undercoverage: ["undercoverage bias"],
  nonresponse: ["nonresponse bias", "non-response", "non response"],
  response: ["response bias", "wording bias"],
  selection: ["selection bias"],
};
const BIAS_TEMPLATES = [
  { cat: "undercoverage", mk: (rng) => `A telephone poll dials only landline numbers; the ${rng.int(20, 45)}% of households that have no landline at all never appear on the calling list and have NO chance of selection` },
  { cat: "undercoverage", mk: (rng) => `A city survey samples from the property-tax roll; renters are absent from that list entirely, so they cannot possibly be drawn` },
  { cat: "nonresponse", mk: (rng) => `Questionnaires go out to a properly drawn random sample of ${rng.int(3, 9) * 100} residents, but only a small share mail them back, and the people who bother to reply may differ from those who do not` },
  { cat: "nonresponse", mk: (rng) => `A well-designed random sample of customers is emailed a survey; most chosen customers simply never answer it, and the few who do tend to be the angriest` },
  { cat: "response", mk: (rng) => `A survey asks, "Do you agree that the city's reckless and wasteful stadium project should be stopped?" — wording that pushes respondents toward one answer` },
  { cat: "response", mk: (rng) => `In face-to-face interviews about exercise, respondents systematically overstate their weekly workouts to look good to the interviewer` },
  { cat: "selection", mk: (rng) => `An interviewer told to find ${rng.int(30, 80)} shoppers approaches only the people who look friendly and unhurried, personally deciding who gets asked` },
  { cat: "selection", mk: (rng) => `A talk show invites viewers to call in and vote on a policy question, so the sample consists of whoever feels strongly enough to volunteer themselves` },
];
fill["as4-des-bias-1"] = (rng, idx) => {
  const t = rng.pick(BIAS_TEMPLATES);
  return {
    id: `gen.as4-des-bias-1.${idx}`, generated: true, concepts: ["bias-types"], difficulty: 1, context: "applied",
    prompt: `${t.mk(rng)}. Name the bias.`,
    steps: [
      { instruction: `Which type of bias is this? ${BIAS_MENU}`, answer: t.cat, accept: BIAS_ACCEPT[t.cat], hint: `Ask where the distortion enters: the list (undercoverage), the silence of the chosen (nonresponse), the answers themselves (response), or who does the choosing (selection).` },
    ],
    finalAnswer: { value: t.cat, unit: "" },
    solutionNarrative: `This is ${t.cat} bias: ${{ undercoverage: "part of the population is missing from the sampling frame and can never be drawn", nonresponse: "properly chosen subjects fail to answer, and the answerers differ from the silent", response: "the answers themselves are distorted, by wording or by the urge to look good", selection: "inclusion is decided by a person or by self-selection instead of a random rule" }[t.cat]}.`,
  };
};
fill["as4-des-bias-2"] = (rng, idx) => {
  const shuffled = BIAS_TEMPLATES.slice();
  for (let i = shuffled.length - 1; i > 0; i--) { const j = rng.int(0, i); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const a = shuffled[0];
  const b = shuffled.find((t) => t.cat !== a.cat);
  return {
    id: `gen.as4-des-bias-2.${idx}`, generated: true, concepts: ["bias-types"], difficulty: 2, context: "applied",
    prompt: `Two flawed studies. Study A: ${a.mk(rng)}. Study B: ${b.mk(rng)}. Diagnose each.`,
    steps: [
      { instruction: `Study A suffers from which bias? ${BIAS_MENU}`, answer: a.cat, accept: BIAS_ACCEPT[a.cat], hint: `Frame, silence, answers, or chooser?` },
      { instruction: `Study B suffers from which bias? ${BIAS_MENU}`, answer: b.cat, accept: BIAS_ACCEPT[b.cat], hint: `It is a different flaw than Study A's.` },
    ],
    finalAnswer: { value: b.cat, unit: "" },
    solutionNarrative: `Study A shows ${a.cat} bias; Study B shows ${b.cat} bias. Naming the flaw precisely matters because each has a different fix — and some have no fix after the fact.`,
  };
};
fill["as4-des-bias-3"] = (rng, idx) => {
  const t = rng.pick(BIAS_TEMPLATES);
  return {
    id: `gen.as4-des-bias-3.${idx}`, generated: true, concepts: ["bias-types"], difficulty: 3, context: "applied",
    prompt: `${t.mk(rng)}. The study's defenders propose simply collecting far more data the same way.`,
    steps: [
      { instruction: `Which type of bias is this? ${BIAS_MENU}`, answer: t.cat, accept: BIAS_ACCEPT[t.cat], hint: `Where does the distortion enter the pipeline?` },
      { instruction: `Bias is a SYSTEMATIC error. Will a much larger sample collected the same way remove it? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `More of the same tilt is still tilted.` },
      { instruction: `Random sampling error shrinks as the sample grows. Does bias shrink the same way? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Bias is a fixed offset, not noise.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `This is ${t.cat} bias, a systematic tilt. Enlarging the sample shrinks random error but leaves the tilt untouched — a million tilted answers are just a very confident wrong answer. The fix is changing the DESIGN, not the size.`,
  };
};

// --- experiments-vs-observation ---
const DESIGN_SCEN = [
  { kind: "experiment", mk: (rng) => `Researchers take ${rng.int(60, 200)} volunteers with high blood pressure and use a random draw to ASSIGN each one to either the new drug or a placebo, then compare outcomes`, canCause: "yes" },
  { kind: "experiment", mk: (rng) => `An online retailer randomly ASSIGNS each incoming visitor to one of two checkout designs and records which design produces more completed purchases`, canCause: "yes" },
  { kind: "observational study", mk: (rng) => `Analysts examine existing medical records and compare heart-disease rates between people who already drink coffee daily and people who do not, assigning nothing`, canCause: "no" },
  { kind: "observational study", mk: (rng) => `A researcher surveys ${rng.int(300, 900)} adults about how much they exercise and how well they sleep, merely recording both variables as they are`, canCause: "no" },
];
fill["as4-des-causation-1"] = (rng, idx) => {
  const s = rng.pick(DESIGN_SCEN);
  return {
    id: `gen.as4-des-causation-1.${idx}`, generated: true, concepts: ["experiments-vs-observation"], difficulty: 1, context: "applied",
    prompt: `${s.mk(rng)}.`,
    steps: [
      { instruction: `Is this an experiment or an observational study? Type 'experiment' or 'observational study'.`, answer: s.kind, accept: s.kind === "experiment" ? ["an experiment", "randomized experiment"] : ["observational", "observation", "an observational study"], hint: `The test: did the researchers ASSIGN the treatment, or just record what was already happening?` },
      { instruction: `Can this design, by itself, support a cause-and-effect conclusion? Type 'yes' or 'no'.`, answer: s.canCause, accept: [], hint: `Random assignment is what rules out lurking variables.` },
    ],
    finalAnswer: { value: s.kind, unit: "" },
    solutionNarrative: `${s.kind === "experiment" ? "The researchers randomly assigned the treatment, so this is an experiment — and randomization balances lurking variables, licensing a causal conclusion." : "Nobody assigned anything; the groups formed themselves. Observational data can show association, but lurking variables block any causal claim."}`,
  };
};
const EXPL_SCEN = [
  { expl: "amount of fertilizer", resp: "tomato yield", story: (rng) => `A gardener varies the amount of fertilizer given to ${rng.int(12, 40)} tomato plants and measures each plant's yield` },
  { expl: "hours of sleep", resp: "reaction time", story: (rng) => `A lab controls how many hours of sleep ${rng.int(20, 60)} volunteers get and then measures their reaction time` },
  { expl: "daily vitamin dose", resp: "number of sick days", story: (rng) => `A clinic assigns different daily vitamin doses to ${rng.int(50, 150)} employees and tracks each employee's number of sick days` },
  { expl: "oven temperature", resp: "bread rise height", story: (rng) => `A baker bakes ${rng.int(15, 40)} loaves at different oven temperatures and measures the rise height of each loaf` },
];
fill["as4-des-causation-2"] = (rng, idx) => {
  const s = rng.pick(EXPL_SCEN);
  return {
    id: `gen.as4-des-causation-2.${idx}`, generated: true, concepts: ["experiments-vs-observation"], difficulty: 2, context: "applied",
    prompt: `${s.story(rng)}.`,
    steps: [
      { instruction: `Which is the explanatory variable? Type '${s.expl}' or '${s.resp}'.`, answer: s.expl, accept: [], hint: `The variable the researcher manipulates or thinks is the driver.` },
      { instruction: `Which is the response variable? Type '${s.expl}' or '${s.resp}'.`, answer: s.resp, accept: [], hint: `The measured outcome.` },
      { instruction: `In an experiment, the researcher deliberately changes the ___ variable. Type 'explanatory' or 'response'.`, answer: "explanatory", accept: ["the explanatory"], hint: `You set the input and watch the output.` },
    ],
    finalAnswer: { value: s.expl, unit: "" },
    solutionNarrative: `The explanatory variable is ${s.expl} (set by the researcher); the response is ${s.resp} (the measured outcome). Experiments manipulate the explanatory variable and watch the response.`,
  };
};
const CONF_SCEN = [
  { a: "drinking coffee", b: "heart disease", conf: "smoking", decoy: "coffee temperature", why: "smokers historically drank more coffee AND smoking damages the heart" },
  { a: "eating breakfast", b: "school grades", conf: "household routine and support", decoy: "cereal brand", why: "organized households produce both regular breakfasts and homework help" },
  { a: "owning a bicycle helmet", b: "fewer head injuries", conf: "cautious personality", decoy: "helmet color", why: "cautious people both buy helmets and ride more carefully" },
  { a: "taking music lessons", b: "higher math scores", conf: "family income", decoy: "instrument type", why: "wealthier families afford both lessons and academic support" },
];
fill["as4-des-causation-3"] = (rng, idx) => {
  const s = rng.pick(CONF_SCEN);
  const flip = rng.int(0, 1) === 0;
  const optA = flip ? s.conf : s.decoy, optB = flip ? s.decoy : s.conf;
  return {
    id: `gen.as4-des-causation-3.${idx}`, generated: true, concepts: ["experiments-vs-observation"], difficulty: 3, context: "applied",
    prompt: `An observational study finds that ${s.a} is associated with ${s.b}. Before anyone claims causation, consider confounding: a third variable that influences BOTH the explanatory and the response variable.`,
    steps: [
      { instruction: `Which is the more plausible confounder here? Type '${optA}' or '${optB}'.`, answer: s.conf, accept: [], hint: `A confounder must plausibly drive BOTH variables at once — ${s.why}.` },
      { instruction: `Does the observed association alone prove that ${s.a} causes ${s.b}? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `The confounder offers a rival explanation.` },
      { instruction: `Which design could settle the causal question? Type 'randomized experiment' or 'larger observational study'.`, answer: "randomized experiment", accept: ["a randomized experiment", "randomized controlled experiment", "an experiment"], hint: `Random assignment breaks the confounder's grip; more observational data just repeats the confounding.` },
    ],
    finalAnswer: { value: "randomized experiment", unit: "" },
    solutionNarrative: `${s.conf.charAt(0).toUpperCase() + s.conf.slice(1)} plausibly drives both ${s.a} and ${s.b} (${s.why}), so the association proves nothing causal. Only random assignment — a randomized experiment — severs the link to lurking variables.`,
  };
};

// --- randomization-and-blocking ---
const PRINCIPLES = [
  { desc: "comparing the treated group against a group receiving a placebo, so that outside influences act on both groups alike", ans: "control" },
  { desc: "letting chance decide which subject receives which treatment, so unknown differences spread evenly across groups", ans: "randomization" },
  { desc: "using enough subjects in each group that chance variation cannot masquerade as a treatment effect", ans: "replication" },
  { desc: "first grouping subjects who are similar on a known nuisance factor, then randomizing treatments separately inside each group", ans: "blocking" },
];
const PRIN_MENU = `Type 'control', 'randomization', 'replication', or 'blocking'.`;
fill["as4-des-random-1"] = (rng, idx) => {
  const shuffled = PRINCIPLES.slice();
  for (let i = shuffled.length - 1; i > 0; i--) { const j = rng.int(0, i); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const [p1, p2] = shuffled;
  return {
    id: `gen.as4-des-random-1.${idx}`, generated: true, concepts: ["randomization-and-blocking"], difficulty: 1, context: "abstract",
    prompt: `Match each description to the experimental-design principle it defines.`,
    steps: [
      { instruction: `"${p1.desc[0].toUpperCase() + p1.desc.slice(1)}" describes which principle? ${PRIN_MENU}`, answer: p1.ans, accept: [], hint: `The four pillars: a comparison group, chance assignment, enough subjects, and pre-grouping by a nuisance factor.` },
      { instruction: `"${p2.desc[0].toUpperCase() + p2.desc.slice(1)}" describes which principle? ${PRIN_MENU}`, answer: p2.ans, accept: [], hint: `A different pillar than the previous one.` },
    ],
    finalAnswer: { value: p2.ans, unit: "" },
    solutionNarrative: `The first description is ${p1.ans}; the second is ${p2.ans}. Control, randomization, replication, and blocking are the four pillars Fisher built experimental design on.`,
  };
};
fill["as4-des-random-2"] = (rng, idx) => {
  const g = rng.pick([3, 4, 5]);
  const per = rng.int(10, 30);
  const N = g * per;
  const a = rng.pick([2, 3, 4]);
  const b = rng.pick([2, 3]);
  const combos = a * b;
  const m = rng.int(4, 10);
  const N2 = combos * m;
  const f1 = rng.pick(["fertilizer type", "baking temperature", "drug dose"]);
  const f2 = rng.pick(["watering schedule", "baking time", "dosing frequency"]);
  return {
    id: `gen.as4-des-random-2.${idx}`, generated: true, concepts: ["randomization-and-blocking"], difficulty: 2, context: "applied",
    prompt: `Two design calculations. First: ${N} subjects are randomly divided EQUALLY among ${g} treatment groups. Second: a factorial experiment crosses ${a} levels of ${f1} with ${b} levels of ${f2}, and ${N2} units are split equally among the treatment combinations.`,
    steps: [
      { instruction: `Subjects per treatment group in the first design: $\\dfrac{${N}}{${g}}$. (Give a number.)`, answer: `${per}`, accept: [], hint: `Equal split.` },
      { instruction: `Number of treatment combinations in the factorial design: $${a} \\times ${b}$. (Give a number.)`, answer: `${combos}`, accept: [], hint: `Every level of one factor meets every level of the other.` },
      { instruction: `Units per treatment combination: $\\dfrac{${N2}}{${combos}}$. (Give a number.)`, answer: `${m}`, accept: [], hint: `Total units over combinations.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `${N}/${g} = ${per} subjects per group; the factorial crossing makes $${a} \\times ${b} = ${combos}$ treatment combinations, each getting ${N2}/${combos} = ${m} units.`,
  };
};
fill["as4-des-random-3"] = (rng, idx) => {
  const B = rng.pick([2, 3, 4]);
  const T = rng.pick([2, 3]);
  const m = rng.int(5, 12);
  const N = B * T * m;
  const blockName = rng.pick([
    { plural: "age brackets", why: "age is expected to affect the outcome" },
    { plural: "soil types", why: "soil fertility is expected to affect the outcome" },
    { plural: "experience levels", why: "prior experience is expected to affect the outcome" },
    { plural: "hospital sites", why: "site-to-site differences are expected to affect the outcome" },
  ]);
  return {
    id: `gen.as4-des-random-3.${idx}`, generated: true, concepts: ["randomization-and-blocking"], difficulty: 3, context: "applied",
    prompt: `A randomized block experiment sorts $N = ${N}$ subjects into ${B} blocks by ${blockName.plural} (${blockName.why}), splitting them equally. WITHIN each block, subjects are randomly assigned equally among ${T} treatments.`,
    steps: [
      { instruction: `Subjects per block: $\\dfrac{${N}}{${B}}$. (Give a number.)`, answer: `${T * m}`, accept: [], hint: `Equal blocks.` },
      { instruction: `Subjects per treatment WITHIN each block: $\\dfrac{${T * m}}{${T}}$. (Give a number.)`, answer: `${m}`, accept: [], hint: `Each block splits equally across the treatments.` },
      { instruction: `Blocking is done to: type 'reduce variation' or 'increase sample size'.`, answer: "reduce variation", accept: ["to reduce variation", "reduces variation", "reduce variation from a known factor"], hint: `Comparing treatments among similar subjects removes the block factor's noise from the comparison.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `Each block holds ${N}/${B} = ${T * m} subjects, and each treatment gets ${m} per block. Blocking removes the known nuisance factor's variation from the treatment comparison — "block what you can, randomize what you cannot."`,
  };
};
