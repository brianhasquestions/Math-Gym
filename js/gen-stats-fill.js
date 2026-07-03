// gen-stats-fill.js
// Parametric generators for the Statistics subject, topics
//   statistics.descriptive-statistics
//   statistics.probability-basics
//   statistics.conditional-probability
//   statistics.random-variables
//   statistics.normal-and-sampling
//   statistics.data-displays
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-discrete-fill.js). Template prefix: stat-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every statistic emitted is
// computed in the generator itself so answers always self-check.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
// Reduced fraction "n/d" (or "n" when the denominator is 1). Requires d != 0.
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  return d === 1 ? `${n}` : `${n}/${d}`;
};
// Round to `p` decimals and return a plain string (no trailing zeros beyond need).
const rnd = (x, p) => {
  const f = Math.pow(10, p);
  return `${Math.round(x * f) / f}`;
};
// Sum / mean of an integer (or number) array.
const sum = (a) => a.reduce((s, v) => s + v, 0);
const mean = (a) => sum(a) / a.length;
// Population and sample variance (exact where the data are chosen to make them so).
const popVar = (a) => { const m = mean(a); return sum(a.map((v) => (v - m) * (v - m))) / a.length; };
const sampVar = (a) => { const m = mean(a); return sum(a.map((v) => (v - m) * (v - m))) / (a.length - 1); };
// Median of a sorted array (numeric).
const medianSorted = (a) => {
  const n = a.length, mid = Math.floor(n / 2);
  return n % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
};
// A number is "clean" if it prints with <= p decimals exactly.
const isClean = (x, p) => Math.abs(x * Math.pow(10, p) - Math.round(x * Math.pow(10, p))) < 1e-9;
const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const comb = (n, k) => Math.round(fact(n) / (fact(k) * fact(n - k)));
// Format a signed decimal already-rounded string is fine; helper for lists.
const listStr = (a) => a.join(",");

export const fill = {};

// ===========================================================================
// TOPIC 1: statistics.descriptive-statistics
//   concepts: measures-of-center, measures-of-spread,
//             outliers-and-resistance, weighted-and-grouped
// ===========================================================================

// --- measures-of-center ---
fill["stat-desc-center-d1"] = (rng, idx) => {
  // Mean of 5 small integers, forced to divide evenly.
  let data;
  do {
    data = Array.from({ length: 5 }, () => rng.int(1, 12));
  } while (sum(data) % 5 !== 0);
  const s = sum(data), m = s / 5;
  const shown = data.slice();
  return {
    id: `gen.stat-desc-center-d1.${idx}`, generated: true, concepts: ["measures-of-center"], difficulty: 1, context: "abstract",
    prompt: `Find the mean of the data set $\\{${shown.join(", ")}\\}$.`,
    steps: [
      { instruction: `Add all five values. (Give a whole number.)`, answer: `${s}`, accept: [], hint: `${shown.join(" + ")}.` },
      { instruction: `Divide the sum by the count $n = 5$ to get the mean. (Give a whole number.)`, answer: `${m}`, accept: [], hint: `$${s} / 5$.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `The mean is $\\bar{x} = \\frac{${shown.join("+")}}{5} = \\frac{${s}}{5} = ${m}$ — the balance point of the data.`,
  };
};
fill["stat-desc-center-d2"] = (rng, idx) => {
  // Median and mode of a set with a clear single mode, odd count (n=7).
  const modeVal = rng.int(2, 9);
  // three copies of modeVal + four distinct others (none repeated, none == modeVal)
  const others = new Set();
  while (others.size < 4) { const v = rng.int(1, 15); if (v !== modeVal) others.add(v); }
  const data = [modeVal, modeVal, modeVal, ...others];
  const sorted = data.slice().sort((a, b) => a - b);
  const med = sorted[3];
  return {
    id: `gen.stat-desc-center-d2.${idx}`, generated: true, concepts: ["measures-of-center"], difficulty: 2, context: "abstract",
    prompt: `For the data set $\\{${data.join(", ")}\\}$ ($n = 7$), find the mode (the most frequent value) and the median.`,
    steps: [
      { instruction: "Which value appears most often (the mode)? (Give a number.)", answer: `${modeVal}`, accept: [], hint: `One value occurs three times.` },
      { instruction: "Sort the data, then give the middle (4th) value — the median. (Give a number.)", answer: `${med}`, accept: [], hint: `Sorted: $${sorted.join(", ")}$.` },
    ],
    finalAnswer: { value: `${modeVal}`, unit: "" },
    solutionNarrative: `The value ${modeVal} occurs three times, more than any other, so the mode is ${modeVal}. Sorted the data is $${sorted.join(", ")}$, whose middle (4th) value is the median ${med}.`,
  };
};
fill["stat-desc-center-d3"] = (rng, idx) => {
  // Skew: four modest incomes plus one large outlier. Mean vs median, pick median.
  const base = [rng.int(8, 14), rng.int(8, 14), rng.int(8, 14), rng.int(8, 14)].sort((a, b) => a - b);
  // make an outlier large enough to inflate the mean, and force divisibility by 5
  let outlier = rng.int(40, 70);
  while ((sum(base) + outlier) % 5 !== 0) outlier++;
  const data = [...base, outlier];
  const sorted = data.slice().sort((a, b) => a - b);
  const s = sum(data), m = s / 5, med = sorted[2];
  return {
    id: `gen.stat-desc-center-d3.${idx}`, generated: true, concepts: ["measures-of-center"], difficulty: 3, context: "applied",
    prompt: `Five households report incomes (in thousands of dollars): $\\{${data.join(", ")}\\}$. Compute the mean and the median, then decide which better represents a typical household.`,
    steps: [
      { instruction: `Compute the mean: the sum is ${s}, divided by $n = 5$. (Give a whole number in thousands.)`, answer: `${m}`, accept: [], hint: `$${s} / 5$.` },
      { instruction: "Find the median (the middle value of the sorted data). (Give a number in thousands.)", answer: `${med}`, accept: [], hint: `Sorted: $${sorted.join(", ")}$ — the 3rd value.` },
      { instruction: "Which statistic better represents a typical household — the one that resists the large value? Answer: mean or median.", answer: "median", accept: [], hint: `One value, ${outlier}, drags the mean far above what most households earn.` },
    ],
    finalAnswer: { value: "median", unit: "" },
    solutionNarrative: `The mean is $${s}/5 = ${m}$, but four of the five households earn ${base[3]} or less — the mean is inflated by the outlier ${outlier}. The median ${med} sits among the actual data, the honest summary under right skew.`,
  };
};

// --- measures-of-spread ---
fill["stat-desc-spread-d1"] = (rng, idx) => {
  // Range of 5 sorted-ish integers; also easy sample SD with clean answer.
  const lo = rng.int(2, 12), gap = rng.int(8, 20);
  const hi = lo + gap;
  const mids = [rng.int(lo + 1, hi - 1), rng.int(lo + 1, hi - 1), rng.int(lo + 1, hi - 1)];
  const data = [lo, ...mids, hi].sort((a, b) => a - b);
  return {
    id: `gen.stat-desc-spread-d1.${idx}`, generated: true, concepts: ["measures-of-spread"], difficulty: 1, context: "abstract",
    prompt: `Find the range of the data set $\\{${data.join(", ")}\\}$.`,
    steps: [
      { instruction: "Identify the maximum and minimum, then compute range $=$ max $-$ min. (Give a whole number.)", answer: `${hi - lo}`, accept: [], hint: `$${hi} - ${lo}$.` },
    ],
    finalAnswer: { value: `${hi - lo}`, unit: "" },
    solutionNarrative: `The range is the largest minus the smallest value: $${hi} - ${lo} = ${hi - lo}$.`,
  };
};
fill["stat-desc-spread-d2"] = (rng, idx) => {
  // Sample SD of a symmetric 3-point set {m-d, m, m+d}: mean m, ss = 2d^2,
  // s^2 = d^2, s = d (exact integer). Guarantees a clean answer.
  const d = rng.int(1, 6), m = rng.int(d + 2, 15);
  const data = [m - d, m, m + d];
  const ss = 2 * d * d, s2 = ss / 2, s = d;
  return {
    id: `gen.stat-desc-spread-d2.${idx}`, generated: true, concepts: ["measures-of-spread"], difficulty: 2, context: "abstract",
    prompt: `Find the sample standard deviation of $\\{${data.join(", ")}\\}$.`,
    steps: [
      { instruction: "Compute the mean of the three values. (Give a whole number.)", answer: `${m}`, accept: [], hint: `$(${data.join("+")})/3$.` },
      { instruction: `Compute the sum of squared deviations from the mean: $(${data[0]}-${m})^2 + (${data[1]}-${m})^2 + (${data[2]}-${m})^2$. (Give a whole number.)`, answer: `${ss}`, accept: [], hint: `$${d * d} + 0 + ${d * d}$.` },
      { instruction: "Divide by $n - 1 = 2$ to get the sample variance $s^2$. (Give a whole number.)", answer: `${s2}`, accept: [], hint: `$${ss} / 2$.` },
      { instruction: "Take the square root to get the sample standard deviation $s$. (Give a whole number.)", answer: `${s}`, accept: [`sqrt(${s2})`], hint: `$\\sqrt{${s2}}$.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `Mean ${m}; squared deviations $${d * d}, 0, ${d * d}$ sum to ${ss}; sample variance $s^2 = ${ss}/2 = ${s2}$; so $s = \\sqrt{${s2}} = ${s}$.`,
  };
};
fill["stat-desc-spread-d3"] = (rng, idx) => {
  // Population vs sample SD of an evenly-spaced 5-point set {a, a+g, ..., a+4g}.
  // Deviations (in units of g): -2,-1,0,1,2 -> ss = g^2*(4+1+0+1+4)=10 g^2.
  // popVar = 2 g^2, sampVar = 2.5 g^2. Choose g so both roots are 2-dec clean-ish;
  // we just report rounded-to-2 values and verify with sqrt() accepts.
  const g = rng.int(1, 4), a = rng.int(1, 6);
  const data = [a, a + g, a + 2 * g, a + 3 * g, a + 4 * g];
  const m = a + 2 * g;
  const ss = 10 * g * g;
  const popV = ss / 5, sampV = ss / 4;
  const popSD = Math.sqrt(popV), sampSD = Math.sqrt(sampV);
  return {
    id: `gen.stat-desc-spread-d3.${idx}`, generated: true, concepts: ["measures-of-spread"], difficulty: 3, context: "abstract",
    prompt: `For the data $\\{${data.join(", ")}\\}$, compute BOTH the population standard deviation (divide by $n$) and the sample standard deviation (divide by $n - 1$). Round each to 2 decimals.`,
    steps: [
      { instruction: "Compute the mean. (Give a whole number.)", answer: `${m}`, accept: [], hint: `The middle value of an evenly-spaced set.` },
      { instruction: `Sum the squared deviations from the mean. (Give a whole number.)`, answer: `${ss}`, accept: [], hint: `Deviations are $-${2 * g}, -${g}, 0, ${g}, ${2 * g}$.` },
      { instruction: `Population variance divides by $n = 5$: compute $${ss}/5$, then take its square root for the population SD (round to 2 decimals).`, answer: `${rnd(popSD, 2)}`, accept: [`sqrt(${popV})`], hint: `$${ss}/5 = ${popV}$, and $\\sqrt{${popV}} \\approx ${rnd(popSD, 2)}$.` },
      { instruction: `Sample variance divides by $n - 1 = 4$: compute $${ss}/4$, then take its square root for the sample SD (round to 2 decimals).`, answer: `${rnd(sampSD, 2)}`, accept: [`sqrt(${sampV})`], hint: `$${ss}/4 = ${sampV}$, and $\\sqrt{${sampV}} \\approx ${rnd(sampSD, 2)}$.` },
    ],
    finalAnswer: { value: `${rnd(sampSD, 2)}`, unit: "" },
    solutionNarrative: `Squared deviations sum to ${ss}. Population SD $= \\sqrt{${ss}/5} = \\sqrt{${popV}} \\approx ${rnd(popSD, 2)}$; sample SD $= \\sqrt{${ss}/4} = \\sqrt{${sampV}} \\approx ${rnd(sampSD, 2)}$. Dividing by the smaller $n-1$ makes the sample SD larger — Bessel's correction.`,
  };
};

// --- outliers-and-resistance ---
fill["stat-desc-out-d1"] = (rng, idx) => {
  const q1 = rng.int(10, 40), iqr = rng.int(5, 25), q3 = q1 + iqr;
  return {
    id: `gen.stat-desc-out-d1.${idx}`, generated: true, concepts: ["outliers-and-resistance"], difficulty: 1, context: "abstract",
    prompt: `A data set has $Q_1 = ${q1}$ and $Q_3 = ${q3}$. Compute the interquartile range (IQR).`,
    steps: [
      { instruction: "IQR $= Q_3 - Q_1$. Compute it. (Give a whole number.)", answer: `${iqr}`, accept: [], hint: `$${q3} - ${q1}$.` },
    ],
    finalAnswer: { value: `${iqr}`, unit: "" },
    solutionNarrative: `The IQR is the spread of the middle half: $Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}$. Unlike the range, it ignores the extreme tails, so outliers don't affect it.`,
  };
};
fill["stat-desc-out-d2"] = (rng, idx) => {
  // Upper fence with an even IQR so 1.5*IQR is clean.
  const q1 = rng.int(20, 50);
  const iqr = 2 * rng.int(5, 15); // even -> 1.5*iqr integer
  const q3 = q1 + iqr;
  const half = 1.5 * iqr, fence = q3 + half;
  return {
    id: `gen.stat-desc-out-d2.${idx}`, generated: true, concepts: ["outliers-and-resistance"], difficulty: 2, context: "abstract",
    prompt: `A data set has $Q_1 = ${q1}$ and $Q_3 = ${q3}$. Using the 1.5·IQR rule, find the upper fence above which a value is flagged as an outlier.`,
    steps: [
      { instruction: "Compute the IQR $= Q_3 - Q_1$. (Give a whole number.)", answer: `${iqr}`, accept: [], hint: `$${q3} - ${q1}$.` },
      { instruction: "Compute $1.5 \\times \\text{IQR}$. (Give a number.)", answer: `${half}`, accept: [], hint: `$1.5 \\times ${iqr}$.` },
      { instruction: "Upper fence $= Q_3 + 1.5\\,\\text{IQR}$. Compute it. (Give a whole number.)", answer: `${fence}`, accept: [], hint: `$${q3} + ${half}$.` },
    ],
    finalAnswer: { value: `${fence}`, unit: "" },
    solutionNarrative: `IQR $= ${iqr}$, so $1.5\\,\\text{IQR} = ${half}$ and the upper fence is $Q_3 + ${half} = ${fence}$. Any value above ${fence} is flagged as a high outlier.`,
  };
};
fill["stat-desc-out-d3"] = (rng, idx) => {
  // 8-value sorted set, median-of-halves quartiles, test whether the max is an outlier.
  // lower half 4 values, upper half 4 values; make the max a genuine outlier.
  const b = [rng.int(2, 6), rng.int(7, 10), rng.int(11, 13), rng.int(14, 16), rng.int(17, 19), rng.int(20, 22)];
  // ensure strictly increasing
  b.sort((x, y) => x - y);
  const base7 = b.slice(0, 7); // seven moderate values
  // Actually build 8 sorted values: 7 moderate + 1 big outlier.
  const moderate = [];
  let cur = rng.int(2, 5);
  for (let i = 0; i < 7; i++) { moderate.push(cur); cur += rng.int(1, 3); }
  // quartiles by median-of-halves on n=8: lower half = first 4, upper half = last 4.
  // Choose outlier so it clearly exceeds the fence.
  const lowerVals = moderate.slice(0, 4);
  const q1 = (lowerVals[1] + lowerVals[2]) / 2;
  // upper half will be moderate[4], moderate[5], moderate[6], outlier
  let outlier = moderate[6] + rng.int(15, 30);
  const upperVals = [moderate[4], moderate[5], moderate[6], outlier];
  const q3 = (upperVals[1] + upperVals[2]) / 2;
  const iqr = q3 - q1;
  const fence = q3 + 1.5 * iqr;
  const data = [...moderate, outlier];
  const isOut = outlier > fence;
  return {
    id: `gen.stat-desc-out-d3.${idx}`, generated: true, concepts: ["outliers-and-resistance"], difficulty: 3, context: "applied",
    prompt: `Server response times (ms) for eight requests are $\\{${data.join(", ")}\\}$ (already sorted). Use the 1.5·IQR rule to decide whether ${outlier} is an outlier. With $n = 8$, the lower half is the smallest 4 values and the upper half is the largest 4.`,
    steps: [
      { instruction: `$Q_1$ is the median of the lower half $\\{${lowerVals.join(", ")}\\}$: average the two middle values. (Give a number.)`, answer: `${q1}`, accept: [], hint: `$(${lowerVals[1]} + ${lowerVals[2]})/2$.` },
      { instruction: `$Q_3$ is the median of the upper half $\\{${upperVals.join(", ")}\\}$: average the two middle values. (Give a number.)`, answer: `${q3}`, accept: [], hint: `$(${upperVals[1]} + ${upperVals[2]})/2$.` },
      { instruction: "Compute the IQR $= Q_3 - Q_1$. (Give a number.)", answer: `${iqr}`, accept: [], hint: `$${q3} - ${q1}$.` },
      { instruction: `Compute the upper fence $Q_3 + 1.5\\,\\text{IQR}$, then answer: is ${outlier} above it, making it an outlier? Answer yes or no.`, answer: "yes", accept: [], hint: `Upper fence $= ${q3} + 1.5(${iqr}) = ${fence}$; ${outlier} exceeds it.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$Q_1 = ${q1}$, $Q_3 = ${q3}$, IQR $= ${iqr}$, so the upper fence is $${q3} + 1.5(${iqr}) = ${fence}$. Since $${outlier} > ${fence}$, the ${outlier} ms request is a genuine outlier${isOut ? "" : ""}.`,
  };
};

// --- weighted-and-grouped ---
fill["stat-desc-wt-d1"] = (rng, idx) => {
  // Two-weight weighted mean with weights that make a clean product.
  // weights 0.w1 / 0.w2 summing to 1, scores multiples that give integer result.
  const w1 = rng.int(2, 8) / 10, w2 = Math.round((1 - w1) * 10) / 10;
  // pick scores that are multiples of 10 so contributions are clean
  const s1 = 10 * rng.int(6, 9), s2 = 10 * rng.int(6, 9);
  const c1 = w1 * s1, c2 = w2 * s2;
  const total = Math.round((c1 + c2) * 100) / 100;
  return {
    id: `gen.stat-desc-wt-d1.${idx}`, generated: true, concepts: ["weighted-and-grouped"], difficulty: 1, context: "applied",
    prompt: `A grade is ${Math.round(w1 * 100)}% exam and ${Math.round(w2 * 100)}% homework. A student scores ${s1} on the exam and ${s2} on homework. Compute the weighted mean grade.`,
    steps: [
      { instruction: `Multiply each score by its weight and add: $${w1} \\times ${s1} + ${w2} \\times ${s2}$. (Give a number.)`, answer: `${total}`, accept: [], hint: `$${c1} + ${c2}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "" },
    solutionNarrative: `The weights sum to 1, so the weighted mean is $${w1}(${s1}) + ${w2}(${s2}) = ${c1} + ${c2} = ${total}$.`,
  };
};
fill["stat-desc-wt-d2"] = (rng, idx) => {
  // Three-weight weighted mean, weights 0.40/0.35/0.25-style summing to 1.
  // Pick weights from a small clean pool.
  const wsets = [
    [0.4, 0.35, 0.25], [0.5, 0.3, 0.2], [0.6, 0.25, 0.15], [0.4, 0.4, 0.2], [0.45, 0.35, 0.2],
  ];
  const [wa, wb, wc] = rng.pick(wsets);
  const a = rng.int(70, 98), b = rng.int(65, 95), c = rng.int(75, 99);
  const ca = Math.round(wa * a * 100) / 100, cb = Math.round(wb * b * 100) / 100, cc = Math.round(wc * c * 100) / 100;
  const totalRaw = wa * a + wb * b + wc * c;
  const total = Math.round(totalRaw * 100) / 100;
  return {
    id: `gen.stat-desc-wt-d2.${idx}`, generated: true, concepts: ["weighted-and-grouped"], difficulty: 2, context: "applied",
    prompt: `A course weights exams ${wa}, homework ${wb}, and a project ${wc}. A student scores ${a}, ${b}, and ${c} respectively. Compute the weighted mean grade (round to 2 decimals).`,
    steps: [
      { instruction: `Exam contribution: $${wa} \\times ${a}$. (Give a number.)`, answer: `${ca}`, accept: [], hint: `$${wa} \\times ${a}$.` },
      { instruction: `Homework contribution: $${wb} \\times ${b}$. (Give a number.)`, answer: `${cb}`, accept: [], hint: `$${wb} \\times ${b}$.` },
      { instruction: `Project contribution: $${wc} \\times ${c}$. (Give a number.)`, answer: `${cc}`, accept: [], hint: `$${wc} \\times ${c}$.` },
      { instruction: "Add the three contributions for the weighted mean (round to 2 decimals). (Give a number.)", answer: `${total}`, accept: [], hint: `$${ca} + ${cb} + ${cc}$.` },
    ],
    finalAnswer: { value: `${total}`, unit: "" },
    solutionNarrative: `The weights sum to 1, so the weighted mean is $${wa}(${a}) + ${wb}(${b}) + ${wc}(${c}) = ${ca} + ${cb} + ${cc} = ${total}$.`,
  };
};
fill["stat-desc-wt-d3"] = (rng, idx) => {
  // Frequency-table mean. Values 1..4 with random small frequencies.
  const vals = [1, 2, 3, 4];
  const freqs = [rng.int(1, 5), rng.int(1, 5), rng.int(1, 5), rng.int(1, 5)];
  const wsum = sum(vals.map((v, i) => v * freqs[i]));
  const total = sum(freqs);
  const meanRaw = wsum / total;
  // report exact fraction plus rounded decimal accept
  const fr = frac(wsum, total);
  const isInt = Number.isInteger(meanRaw);
  const dec = rnd(meanRaw, 2);
  return {
    id: `gen.stat-desc-wt-d3.${idx}`, generated: true, concepts: ["weighted-and-grouped"], difficulty: 3, context: "abstract",
    prompt: `A frequency table lists the values ${vals.join(", ")} occurring with frequencies ${freqs.join(", ")}. Compute the mean of the data described by the table. Give the exact value (a whole number or a fraction like a/b in lowest terms).`,
    steps: [
      { instruction: `Compute the weighted sum $\\sum (\\text{value} \\times \\text{frequency}) = ${vals.map((v, i) => `${v}(${freqs[i]})`).join(" + ")}$. (Give a whole number.)`, answer: `${wsum}`, accept: [], hint: `$${vals.map((v, i) => v * freqs[i]).join(" + ")}$.` },
      { instruction: `Compute the total count $\\sum \\text{frequency} = ${freqs.join(" + ")}$. (Give a whole number.)`, answer: `${total}`, accept: [], hint: `Add the frequencies.` },
      { instruction: `Divide the weighted sum by the total count for the mean. Give it as a whole number or a fraction a/b in lowest terms.`, answer: fr, accept: isInt ? [] : [dec], hint: `$${wsum} / ${total}$.` },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `Treating each frequency as a weight, the mean is $\\frac{${vals.map((v, i) => `${v}(${freqs[i]})`).join("+")}}{${freqs.join("+")}} = \\frac{${wsum}}{${total}} = ${fr}$.`,
  };
};

// ===========================================================================
// TOPIC 2: statistics.probability-basics
//   concepts: sample-spaces-and-events, addition-rule,
//             complement-rule, multiplication-independent
// ===========================================================================

// --- sample-spaces-and-events ---
fill["stat-prob-ss-d1"] = (rng, idx) => {
  // P(favorable) on a single die: even, odd, >k, <k, etc. Keep the count clean.
  const variants = [
    { desc: "an even number (2, 4, 6)", cnt: 3 },
    { desc: "an odd number (1, 3, 5)", cnt: 3 },
    { desc: "a number greater than 4 (i.e. 5 or 6)", cnt: 2 },
    { desc: "a number less than 3 (i.e. 1 or 2)", cnt: 2 },
    { desc: "a number 4 or higher (4, 5, 6)", cnt: 3 },
  ];
  const v = rng.pick(variants);
  const fr = frac(v.cnt, 6);
  return {
    id: `gen.stat-prob-ss-d1.${idx}`, generated: true, concepts: ["sample-spaces-and-events"], difficulty: 1, context: "abstract",
    prompt: `A fair six-sided die is rolled once. What is the probability of rolling ${v.desc}? Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: "How many outcomes are in the sample space $S = \\{1,2,3,4,5,6\\}$? (Give a number.)", answer: "6", accept: [], hint: "Count the faces of the die." },
      { instruction: `How many favorable outcomes are there? (Give a number.)`, answer: `${v.cnt}`, accept: [], hint: "List the outcomes that qualify." },
      { instruction: `Compute the probability $\\frac{${v.cnt}}{6}$ as a fraction in lowest terms.`, answer: fr, accept: [rnd(v.cnt / 6, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `The sample space has 6 equally likely outcomes and ${v.cnt} are favorable, so the probability is $\\frac{${v.cnt}}{6} = ${fr}$.`,
  };
};
fill["stat-prob-ss-d2"] = (rng, idx) => {
  // One card from a 52 deck: king/queen/etc (rank -> 4/52) or suit (13/52) or color (26/52).
  const variants = [
    { desc: "a queen", cnt: 4 },
    { desc: "a jack", cnt: 4 },
    { desc: "a heart", cnt: 13 },
    { desc: "a spade", cnt: 13 },
    { desc: "a red card", cnt: 26 },
    { desc: "a face card (J, Q, or K)", cnt: 12 },
  ];
  const v = rng.pick(variants);
  const fr = frac(v.cnt, 52);
  return {
    id: `gen.stat-prob-ss-d2.${idx}`, generated: true, concepts: ["sample-spaces-and-events"], difficulty: 2, context: "applied",
    prompt: `One card is drawn from a standard 52-card deck. What is the probability it is ${v.desc}? Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: "How many cards are in the deck (the sample space)? (Give a number.)", answer: "52", accept: [], hint: "A standard deck size." },
      { instruction: `How many favorable cards are there? (Give a number.)`, answer: `${v.cnt}`, accept: [], hint: "Count the matching cards." },
      { instruction: `Compute $\\frac{${v.cnt}}{52}$ in lowest terms.`, answer: fr, accept: [rnd(v.cnt / 52, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `There are ${v.cnt} favorable cards among 52 equally likely cards: $\\frac{${v.cnt}}{52} = ${fr}$.`,
  };
};
fill["stat-prob-ss-d3"] = (rng, idx) => {
  // Two dice, sum = target. Count ordered pairs. Choose a target with a clean-ish count.
  const target = rng.pick([5, 6, 7, 8, 9]);
  let cnt = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) cnt++;
  const fr = frac(cnt, 36);
  const pairs = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) pairs.push(`(${a},${b})`);
  return {
    id: `gen.stat-prob-ss-d3.${idx}`, generated: true, concepts: ["sample-spaces-and-events"], difficulty: 3, context: "abstract",
    prompt: `Two fair dice are rolled and their values are added. What is the probability the sum equals ${target}? Give your answer as a fraction in lowest terms. (The 36 ordered outcomes are equally likely.)`,
    steps: [
      { instruction: "How many equally likely ordered outcomes are there for two dice? Compute $6 \\cdot 6$. (Give a number.)", answer: "36", accept: [], hint: "Product rule: 6 choices for each die." },
      { instruction: `List and count the ordered pairs summing to ${target}: ${pairs.join(",")}. How many are there? (Give a number.)`, answer: `${cnt}`, accept: [], hint: "Count the listed pairs; a double like (k,k) is one outcome." },
      { instruction: `Compute $\\frac{${cnt}}{36}$ in lowest terms.`, answer: fr, accept: [rnd(cnt / 36, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `Of the $6 \\cdot 6 = 36$ equally likely ordered rolls, ${cnt} sum to ${target}, so $P = \\frac{${cnt}}{36} = ${fr}$.`,
  };
};

// --- addition-rule ---
fill["stat-prob-add-d1"] = (rng, idx) => {
  // Mutually exclusive die outcomes: P(a or b) = 2/6 = 1/3.
  let a = rng.int(1, 6), b = rng.int(1, 6);
  while (b === a) b = rng.int(1, 6);
  const fr = frac(2, 6);
  return {
    id: `gen.stat-prob-add-d1.${idx}`, generated: true, concepts: ["addition-rule"], difficulty: 1, context: "abstract",
    prompt: `A fair die is rolled once. What is the probability of rolling a ${a} or a ${b}? These outcomes are mutually exclusive (a single roll can't be both). Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `Are rolling a ${a} and rolling a ${b} mutually exclusive on one die? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "One die shows only one face." },
      { instruction: "Since they're mutually exclusive, add: $\\frac{1}{6} + \\frac{1}{6}$. Give the sum as a fraction in lowest terms.", answer: fr, accept: [rnd(2 / 6, 3)], hint: "$\\frac{2}{6}$ reduces." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `Mutually exclusive events have no overlap, so $P(${a}) + P(${b}) = \\frac{1}{6} + \\frac{1}{6} = \\frac{2}{6} = ${fr}$.`,
  };
};
fill["stat-prob-add-d2"] = (rng, idx) => {
  // Card: suit OR rank, subtract overlap of 1. e.g. heart or king.
  const suits = [{ n: "heart", c: 13 }, { n: "spade", c: 13 }, { n: "diamond", c: 13 }, { n: "club", c: 13 }];
  const ranks = [{ n: "king", c: 4 }, { n: "queen", c: 4 }, { n: "jack", c: 4 }, { n: "ace", c: 4 }];
  const s = rng.pick(suits), r = rng.pick(ranks);
  const overlap = 1; // exactly one card is that suit AND that rank
  const num = s.c + r.c - overlap;
  const fr = frac(num, 52);
  return {
    id: `gen.stat-prob-add-d2.${idx}`, generated: true, concepts: ["addition-rule"], difficulty: 2, context: "applied",
    prompt: `One card is drawn from a 52-card deck. What is the probability it is a ${s.n} OR a ${r.n}? Use the addition rule and subtract the overlap. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `How many ${s.n}s are there? (Give a number.)`, answer: `${s.c}`, accept: [], hint: "One suit." },
      { instruction: `How many ${r.n}s are there? (Give a number.)`, answer: `${r.c}`, accept: [], hint: "One per suit." },
      { instruction: `How many cards are BOTH a ${s.n} and a ${r.n} (the overlap)? (Give a number.)`, answer: `${overlap}`, accept: [], hint: `The ${r.n} of ${s.n}s.` },
      { instruction: `Apply the addition rule: $\\frac{${s.c} + ${r.c} - ${overlap}}{52} = \\frac{${num}}{52}$. Give it in lowest terms.`, answer: fr, accept: [rnd(num / 52, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `$P = \\frac{${s.c}}{52} + \\frac{${r.c}}{52} - \\frac{${overlap}}{52} = \\frac{${num}}{52} = ${fr}$. The subtracted card is the ${r.n} of ${s.n}s.`,
  };
};
fill["stat-prob-add-d3"] = (rng, idx) => {
  // Mutually exclusive decimal probabilities: raffle prizes.
  const p1 = rng.int(3, 12) / 100, p2 = rng.int(8, 20) / 100;
  const sumP = Math.round((p1 + p2) * 100) / 100;
  return {
    id: `gen.stat-prob-add-d3.${idx}`, generated: true, concepts: ["addition-rule"], difficulty: 3, context: "applied",
    prompt: `In a raffle the events are mutually exclusive: winning first prize has probability ${p1} and winning second prize has probability ${p2} (you can't win both). What is the probability of winning first OR second prize? Give your answer as a decimal.`,
    steps: [
      { instruction: "Can you win both first and second prize? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "The prizes are mutually exclusive." },
      { instruction: `Since the events are mutually exclusive, add the probabilities: $${p1} + ${p2}$. (Give a decimal.)`, answer: `${sumP}`, accept: [], hint: "No overlap to subtract." },
    ],
    finalAnswer: { value: `${sumP}`, unit: "" },
    solutionNarrative: `With no overlap, the addition rule is plain addition: $${p1} + ${p2} = ${sumP}$. Mutually exclusive events are the one case where you never subtract.`,
  };
};

// --- complement-rule ---
fill["stat-prob-comp-d1"] = (rng, idx) => {
  // P(not k) on a die = 5/6.
  const k = rng.int(1, 6);
  const fr = frac(5, 6);
  return {
    id: `gen.stat-prob-comp-d1.${idx}`, generated: true, concepts: ["complement-rule"], difficulty: 1, context: "abstract",
    prompt: `A fair die is rolled once. What is the probability of NOT rolling a ${k}? Use the complement rule. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `What is $P(\\text{rolling a ${k}})$ as a fraction?`, answer: "1/6", accept: [rnd(1 / 6, 3)], hint: "One favorable face of six." },
      { instruction: "Apply the complement rule: $1 - \\frac{1}{6}$. Give the result as a fraction in lowest terms.", answer: fr, accept: [rnd(5 / 6, 3)], hint: "$\\frac{6}{6} - \\frac{1}{6}$." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `$P(\\text{not }${k}) = 1 - P(${k}) = 1 - \\frac{1}{6} = ${fr}$.`,
  };
};
fill["stat-prob-comp-d2"] = (rng, idx) => {
  // At least one k in two dice = 1 - (5/6)^2 = 11/36. Generalize k face.
  const k = rng.int(1, 6);
  const noOne = frac(25, 36), atLeast = frac(11, 36);
  return {
    id: `gen.stat-prob-comp-d2.${idx}`, generated: true, concepts: ["complement-rule"], difficulty: 2, context: "abstract",
    prompt: `Two fair dice are rolled. What is the probability of getting AT LEAST ONE ${k}? Use the complement rule (the opposite is 'no ${k} on either die'). Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `The chance a single die is NOT a ${k} is $\\frac{5}{6}$. For two independent dice, the chance NEITHER is a ${k} is $\\left(\\frac{5}{6}\\right)^2 = \\frac{25}{36}$. Enter $\\frac{25}{36}$.`, answer: noOne, accept: [rnd(25 / 36, 3)], hint: "$5 \\cdot 5 = 25$ over $6 \\cdot 6 = 36$." },
      { instruction: "Apply the complement rule: $1 - \\frac{25}{36}$. Give the result as a fraction.", answer: atLeast, accept: [rnd(11 / 36, 3)], hint: "$\\frac{36}{36} - \\frac{25}{36}$." },
    ],
    finalAnswer: { value: atLeast, unit: "" },
    solutionNarrative: `'At least one ${k}' is the complement of 'no ${k} at all': $1 - \\left(\\frac{5}{6}\\right)^2 = 1 - \\frac{25}{36} = ${atLeast}$.`,
  };
};
fill["stat-prob-comp-d3"] = (rng, idx) => {
  // At least one head in n coin flips = 1 - (1/2)^n. n in {2,3,4}.
  const n = rng.int(2, 4);
  const denom = Math.pow(2, n);
  const allTails = frac(1, denom), atLeast = frac(denom - 1, denom);
  return {
    id: `gen.stat-prob-comp-d3.${idx}`, generated: true, concepts: ["complement-rule"], difficulty: 3, context: "abstract",
    prompt: `A fair coin is flipped ${n} times. What is the probability of getting AT LEAST ONE head? Use the complement rule. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `The opposite of 'at least one head' is 'all ${n} flips are tails'. What is $P(\\text{all tails}) = \\left(\\frac{1}{2}\\right)^${n}$? Give it as a fraction.`, answer: allTails, accept: [rnd(1 / denom, 3)], hint: `$\\frac{1}{${denom}}$.` },
      { instruction: `Apply the complement rule: $1 - \\frac{1}{${denom}}$. Give the result as a fraction in lowest terms.`, answer: atLeast, accept: [rnd((denom - 1) / denom, 3)], hint: `$\\frac{${denom}}{${denom}} - \\frac{1}{${denom}}$.` },
    ],
    finalAnswer: { value: atLeast, unit: "" },
    solutionNarrative: `Only 1 of the ${denom} equally likely outcomes is all tails, so $P(\\text{at least one head}) = 1 - \\frac{1}{${denom}} = ${atLeast}$.`,
  };
};

// --- multiplication-independent ---
fill["stat-prob-mult-d1"] = (rng, idx) => {
  // Both coins heads = 1/4. Vary phrasing: both heads / both tails.
  const face = rng.pick(["heads", "tails"]);
  return {
    id: `gen.stat-prob-mult-d1.${idx}`, generated: true, concepts: ["multiplication-independent"], difficulty: 1, context: "abstract",
    prompt: `Two fair coins are flipped. What is the probability that BOTH land ${face}? The flips are independent. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `What is the probability a single fair coin lands ${face}? Give it as a fraction.`, answer: "1/2", accept: ["0.5"], hint: "Heads or tails, equally likely." },
      { instruction: "For independent events, multiply: $\\frac{1}{2} \\cdot \\frac{1}{2}$. Give the product as a fraction.", answer: "1/4", accept: ["0.25"], hint: "Multiply numerators and denominators." },
    ],
    finalAnswer: { value: "1/4", unit: "" },
    solutionNarrative: `Independent events multiply: $P = \\frac{1}{2} \\cdot \\frac{1}{2} = \\frac{1}{4}$.`,
  };
};
fill["stat-prob-mult-d2"] = (rng, idx) => {
  // die event AND coin event, both 1/2 -> 1/4, OR mix probabilities.
  const dieEv = rng.pick([{ d: "an even number", p: "1/2" }, { d: "an odd number", p: "1/2" }, { d: "a number greater than 4", p: "1/3" }]);
  const coin = rng.pick(["heads", "tails"]);
  // compute product exactly
  const dp = dieEv.p === "1/2" ? 1 / 2 : 1 / 3;
  const prod = dp * 0.5;
  const fr = dieEv.p === "1/2" ? "1/4" : "1/6";
  return {
    id: `gen.stat-prob-mult-d2.${idx}`, generated: true, concepts: ["multiplication-independent"], difficulty: 2, context: "applied",
    prompt: `A fair die is rolled and a fair coin is flipped. What is the probability of getting ${dieEv.d} on the die AND ${coin} on the coin? These are independent. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `What is $P(${dieEv.d}\\text{ on the die})$ as a fraction in lowest terms?`, answer: dieEv.p, accept: [rnd(dp, 3)], hint: "Count favorable die faces over six." },
      { instruction: `What is $P(${coin}\\text{ on the coin})$ as a fraction?`, answer: "1/2", accept: ["0.5"], hint: "Fair coin." },
      { instruction: `The die and coin are independent, so multiply: $${dieEv.p} \\cdot \\frac{1}{2}$. Give the product as a fraction.`, answer: fr, accept: [rnd(prod, 3)], hint: "Separate mechanisms are independent." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `The die and coin share no mechanism, so $P = ${dieEv.p} \\cdot \\frac{1}{2} = ${fr}$.`,
  };
};
fill["stat-prob-mult-d3"] = (rng, idx) => {
  // Three independent components each working with prob p; P(all work) = p^3.
  const p = rng.pick([0.9, 0.95, 0.98, 0.99, 0.8]);
  const p2 = Math.round(p * p * 1e6) / 1e6;
  const p3 = Math.round(p * p * p * 1e6) / 1e6;
  const p3round = rnd(p3, 3);
  return {
    id: `gen.stat-prob-mult-d3.${idx}`, generated: true, concepts: ["multiplication-independent"], difficulty: 3, context: "applied",
    prompt: `A server has three independent components, each of which works with probability ${p}. What is the probability that ALL three work? Give your answer as a decimal rounded to 3 places.`,
    steps: [
      { instruction: "What is the probability a single component works? (Give a decimal.)", answer: `${p}`, accept: [], hint: "Stated directly." },
      { instruction: `For two independent components, multiply: $${p} \\cdot ${p} = ${p}^2$. (Give a decimal.)`, answer: `${p2}`, accept: [], hint: `$${p} \\cdot ${p}$.` },
      { instruction: `Multiply once more by ${p} to get $${p}^3$, rounded to 3 decimal places.`, answer: p3round, accept: [`${p3}`], hint: `$${p2} \\cdot ${p}$.` },
    ],
    finalAnswer: { value: p3round, unit: "" },
    solutionNarrative: `Independent survival probabilities multiply: $${p}^3 = ${p3} \\approx ${p3round}$. Series systems get less reliable as you add parts.`,
  };
};

// ===========================================================================
// TOPIC 3: statistics.conditional-probability
//   concepts: conditional-probability, general-multiplication,
//             independence-test, bayes-theorem
// ===========================================================================

// --- conditional-probability ---
fill["stat-cond-cp-d1"] = (rng, idx) => {
  // P(A | B) on a die via reduced sample space. Condition = even/odd/>3; A = >k.
  const conds = [
    { label: "even", set: [2, 4, 6] },
    { label: "odd", set: [1, 3, 5] },
    { label: "greater than 3", set: [4, 5, 6] },
  ];
  const c = rng.pick(conds);
  const thr = rng.pick([2, 3, 4]);
  const fav = c.set.filter((x) => x > thr);
  // guarantee a non-degenerate, non-full favorable count
  if (fav.length === 0 || fav.length === c.set.length) {
    // fall back to a guaranteed-clean instance: even, >3 -> {4,6}/{2,4,6}=2/3
    const set = [2, 4, 6], f = [4, 6];
    const fr = frac(f.length, set.length);
    return {
      id: `gen.stat-cond-cp-d1.${idx}`, generated: true, concepts: ["conditional-probability"], difficulty: 1, context: "abstract",
      prompt: `A fair die is rolled. Given that the result is even, what is the probability it is greater than 3? Use the reduced sample space. Give your answer as a fraction in lowest terms.`,
      steps: [
        { instruction: "Conditioning on 'even' reduces the sample space to $\\{2,4,6\\}$. How many outcomes are in this reduced space? (Give a number.)", answer: "3", accept: [], hint: "Count the even faces." },
        { instruction: "Within $\\{2,4,6\\}$, how many are greater than 3? (Give a number.)", answer: "2", accept: [], hint: "4 and 6." },
        { instruction: `Compute $\\frac{2}{3}$. Give it as a fraction in lowest terms.`, answer: fr, accept: [rnd(2 / 3, 3)], hint: "Favorable over the reduced total." },
      ],
      finalAnswer: { value: fr, unit: "" },
      solutionNarrative: `Conditioning on 'even' shrinks the world to $\\{2,4,6\\}$; two of those three exceed 3, so the answer is $\\frac{2}{3}$.`,
    };
  }
  const fr = frac(fav.length, c.set.length);
  return {
    id: `gen.stat-cond-cp-d1.${idx}`, generated: true, concepts: ["conditional-probability"], difficulty: 1, context: "abstract",
    prompt: `A fair die is rolled. Given that the result is ${c.label}, what is the probability it is greater than ${thr}? Use the reduced sample space. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `Conditioning on '${c.label}' reduces the sample space to $\\{${c.set.join(",")}\\}$. How many outcomes are in this reduced space? (Give a number.)`, answer: `${c.set.length}`, accept: [], hint: "Count the qualifying faces." },
      { instruction: `Within $\\{${c.set.join(",")}\\}$, how many are greater than ${thr}? (Give a number.)`, answer: `${fav.length}`, accept: [], hint: `They are ${fav.join(", ")}.` },
      { instruction: `Compute $\\frac{${fav.length}}{${c.set.length}}$. Give it as a fraction in lowest terms.`, answer: fr, accept: [rnd(fav.length / c.set.length, 3)], hint: "Favorable over the reduced total." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `Conditioning on '${c.label}' shrinks the world to $\\{${c.set.join(",")}\\}$; ${fav.length} of those ${c.set.length} exceed ${thr}, so $P = \\frac{${fav.length}}{${c.set.length}} = ${fr}$.`,
  };
};
fill["stat-cond-cp-d2"] = (rng, idx) => {
  // P(A|B) = P(A and B)/P(B) with decimals chosen to divide cleanly.
  // pick joint and condition so joint/cond is a clean 1- or 2-decimal number.
  const cond = rng.int(2, 6) / 10; // 0.2..0.6
  const q = rng.pick([0.3, 0.4, 0.5, 0.6]); // desired ratio
  const joint = Math.round(cond * q * 100) / 100;
  const res = Math.round((joint / cond) * 100) / 100;
  return {
    id: `gen.stat-cond-cp-d2.${idx}`, generated: true, concepts: ["conditional-probability"], difficulty: 2, context: "applied",
    prompt: `In a class, $P(\\text{plays soccer and tennis}) = ${joint}$ and $P(\\text{plays tennis}) = ${cond}$. Given a student plays tennis, what is the probability they also play soccer? Use $P(A \\mid B) = \\frac{P(A \\text{ and } B)}{P(B)}$. Give your answer as a decimal.`,
    steps: [
      { instruction: "Identify the numerator $P(\\text{soccer and tennis})$. (Give a decimal.)", answer: `${joint}`, accept: [], hint: "The joint probability of both." },
      { instruction: "Identify the denominator $P(\\text{tennis})$, the condition. (Give a decimal.)", answer: `${cond}`, accept: [], hint: "The event you are conditioning on." },
      { instruction: `Compute $\\frac{${joint}}{${cond}}$. (Give a decimal.)`, answer: `${res}`, accept: [frac(Math.round(joint * 100), Math.round(cond * 100))], hint: `$${joint} / ${cond}$.` },
    ],
    finalAnswer: { value: `${res}`, unit: "" },
    solutionNarrative: `The conditional formula gives $\\frac{${joint}}{${cond}} = ${res}$: among tennis players, that fraction also play soccer.`,
  };
};
fill["stat-cond-cp-d3"] = (rng, idx) => {
  // Reduced space on a 52-deck: given color (26), prob of a suit (13) -> 1/2,
  // or given face(12), prob king(4) -> 1/3, or given red(26) prob heart(13)->1/2.
  const variants = [
    { cond: "black (spades or clubs)", condCnt: 26, favLabel: "a spade", favCnt: 13 },
    { cond: "red (hearts or diamonds)", condCnt: 26, favLabel: "a heart", favCnt: 13 },
    { cond: "a face card (J, Q, K)", condCnt: 12, favLabel: "a king", favCnt: 4 },
    { cond: "a face card (J, Q, K)", condCnt: 12, favLabel: "a queen", favCnt: 4 },
  ];
  const v = rng.pick(variants);
  const fr = frac(v.favCnt, v.condCnt);
  return {
    id: `gen.stat-cond-cp-d3.${idx}`, generated: true, concepts: ["conditional-probability"], difficulty: 3, context: "applied",
    prompt: `One card is drawn from a 52-card deck. Given that it is ${v.cond}, what is the probability it is ${v.favLabel}? Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `How many cards match the condition '${v.cond}'? This is the reduced sample space. (Give a number.)`, answer: `${v.condCnt}`, accept: [], hint: "Count the conditioning cards." },
      { instruction: `Of those, how many are ${v.favLabel}? (Give a number.)`, answer: `${v.favCnt}`, accept: [], hint: "Count the favorable cards within the condition." },
      { instruction: `Compute $\\frac{${v.favCnt}}{${v.condCnt}}$ in lowest terms.`, answer: fr, accept: [rnd(v.favCnt / v.condCnt, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `Given the condition, the sample space is ${v.condCnt} cards; ${v.favCnt} are ${v.favLabel}, so $P = \\frac{${v.favCnt}}{${v.condCnt}} = ${fr}$.`,
  };
};

// --- general-multiplication ---
fill["stat-cond-gm-d1"] = (rng, idx) => {
  // Two of same rank from a deck without replacement: 4/52 * 3/51.
  const rank = rng.pick(["aces", "kings", "queens", "jacks"]);
  // 4/52 = 1/13; 3/51 = 1/17; product 1/221.
  return {
    id: `gen.stat-cond-gm-d1.${idx}`, generated: true, concepts: ["general-multiplication"], difficulty: 1, context: "abstract",
    prompt: `Two cards are drawn from a 52-card deck WITHOUT replacement. What is the probability that BOTH are ${rank}? Use $P(A \\text{ and } B) = P(A)\\,P(B \\mid A)$. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `What is the probability the FIRST card is one of the ${rank}, as a fraction in lowest terms?`, answer: "1/13", accept: ["4/52", "0.077"], hint: "4 of that rank out of 52 cards." },
      { instruction: `Given the first was, what is the probability the SECOND is too? (3 remain among 51 cards.) Give it as a fraction in lowest terms.`, answer: "1/17", accept: ["3/51", "0.059"], hint: "$\\frac{3}{51}$." },
      { instruction: "Multiply: $\\frac{4}{52} \\cdot \\frac{3}{51} = \\frac{12}{2652}$. Give the product in lowest terms.", answer: "1/221", accept: ["0.0045"], hint: "$\\frac{1}{13} \\cdot \\frac{1}{17}$." },
    ],
    finalAnswer: { value: "1/221", unit: "" },
    solutionNarrative: `Without replacement the draws are dependent: $P = \\frac{4}{52} \\cdot \\frac{3}{51} = \\frac{1}{221}$.`,
  };
};
fill["stat-cond-gm-d2"] = (rng, idx) => {
  // Urn: r red, b blue, draw 2 without replacement, both red = r/(r+b) * (r-1)/(r+b-1).
  const r = rng.int(4, 7), b = rng.int(2, 5);
  const tot = r + b;
  const n1 = r, d1 = tot, n2 = r - 1, d2 = tot - 1;
  const num = n1 * n2, den = d1 * d2;
  const fr = frac(num, den);
  const fr1 = frac(n1, d1), fr2 = frac(n2, d2);
  return {
    id: `gen.stat-cond-gm-d2.${idx}`, generated: true, concepts: ["general-multiplication"], difficulty: 2, context: "applied",
    prompt: `An urn holds ${r} red and ${b} blue marbles. Two are drawn WITHOUT replacement. What is the probability BOTH are red? Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `What is the probability the first marble is red? There are ${r} red of ${tot} total. Give it as a fraction in lowest terms.`, answer: fr1, accept: [rnd(n1 / d1, 3)], hint: "Reds over total." },
      { instruction: `Given the first was red, what is the probability the second is red? (${r - 1} red remain among ${tot - 1} marbles.) Give it as a fraction in lowest terms.`, answer: fr2, accept: [rnd(n2 / d2, 3)], hint: "One red and one marble are gone." },
      { instruction: `Multiply: $\\frac{${n1}}{${d1}} \\cdot \\frac{${n2}}{${d2}} = \\frac{${num}}{${den}}$. Give the product in lowest terms.`, answer: fr, accept: [rnd(num / den, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `$P(\\text{two red}) = \\frac{${n1}}{${d1}} \\cdot \\frac{${n2}}{${d2}} = \\frac{${num}}{${den}} = ${fr}$. The second factor shrinks because removing a red changes the composition.`,
  };
};
fill["stat-cond-gm-d3"] = (rng, idx) => {
  // Box of items, some defective, draw 2 without replacement, both defective.
  const tot = rng.int(8, 12), def = rng.int(2, 4);
  const n1 = def, d1 = tot, n2 = def - 1, d2 = tot - 1;
  const num = n1 * n2, den = d1 * d2;
  const fr = frac(num, den);
  const fr1 = frac(n1, d1), fr2 = frac(n2, d2);
  return {
    id: `gen.stat-cond-gm-d3.${idx}`, generated: true, concepts: ["general-multiplication"], difficulty: 3, context: "applied",
    prompt: `A box has ${tot} fuses, ${def} of them defective. Two fuses are drawn WITHOUT replacement. What is the probability BOTH are defective? Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `Probability the first fuse is defective? ${def} defective of ${tot}. Give it as a fraction in lowest terms.`, answer: fr1, accept: [rnd(n1 / d1, 3)], hint: "Defectives over total." },
      { instruction: `Given the first was defective, probability the second is defective? (${def - 1} defective remain among ${tot - 1} fuses.) Give it as a fraction in lowest terms.`, answer: fr2, accept: [rnd(n2 / d2, 3)], hint: "One defective and one fuse gone." },
      { instruction: `Multiply: $\\frac{${n1}}{${d1}} \\cdot \\frac{${n2}}{${d2}} = \\frac{${num}}{${den}}$. Give the product in lowest terms.`, answer: fr, accept: [rnd(num / den, 3)], hint: "Reduce the fraction." },
    ],
    finalAnswer: { value: fr, unit: "" },
    solutionNarrative: `$P(\\text{both defective}) = \\frac{${n1}}{${d1}} \\cdot \\frac{${n2}}{${d2}} = \\frac{${num}}{${den}} = ${fr}$.`,
  };
};

// --- independence-test ---
fill["stat-cond-ind-d1"] = (rng, idx) => {
  // Die: A=even, B=>3. P(A)=1/2, P(A|B)=2/3 -> dependent. Fixed dependent case.
  return {
    id: `gen.stat-cond-ind-d1.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 1, context: "abstract",
    prompt: `A fair die is rolled. Let A = 'even' and B = 'greater than 3'. Test whether A and B are independent by comparing $P(A \\mid B)$ with $P(A)$. Answer 'independent' or 'dependent'.`,
    steps: [
      { instruction: "What is $P(A) = P(\\text{even})$ as a fraction in lowest terms?", answer: "1/2", accept: ["0.5"], hint: "Three even faces of six." },
      { instruction: "Condition on B = $\\{4,5,6\\}$. Of those, the even ones are $\\{4,6\\}$. Compute $P(A \\mid B) = \\frac{2}{3}$ as a fraction.", answer: "2/3", accept: ["0.667"], hint: "Two even outcomes among three." },
      { instruction: "Since $\\frac{2}{3} \\ne \\frac{1}{2}$, are A and B independent or dependent? Type 'independent' or 'dependent'.", answer: "dependent", accept: [], hint: "Conditioning changed the probability." },
    ],
    finalAnswer: { value: "dependent", unit: "" },
    solutionNarrative: `$P(A) = \\frac{1}{2}$ but $P(A \\mid B) = \\frac{2}{3}$; the two differ, so 'even' and 'greater than 3' are dependent.`,
  };
};
fill["stat-cond-ind-d2"] = (rng, idx) => {
  // Independent case: coin vs die. P(A|B)=P(A)=1/2 -> independent.
  const face = rng.pick(["heads", "tails"]);
  const dieN = rng.int(1, 6);
  return {
    id: `gen.stat-cond-ind-d2.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 2, context: "abstract",
    prompt: `A fair die is rolled and a fair coin is flipped. Let A = 'coin shows ${face}' and B = 'die shows ${dieN}'. Test whether A and B are independent by comparing $P(A \\mid B)$ with $P(A)$. Answer 'independent' or 'dependent'.`,
    steps: [
      { instruction: `What is $P(A) = P(\\text{${face}})$ as a fraction?`, answer: "1/2", accept: ["0.5"], hint: "Fair coin." },
      { instruction: `Does knowing the die shows ${dieN} change the coin's chance of ${face}? So $P(A \\mid B)$ equals what fraction?`, answer: "1/2", accept: ["0.5"], hint: "The coin doesn't know the die's result." },
      { instruction: "Since $P(A \\mid B) = P(A)$, are A and B independent or dependent? Type 'independent' or 'dependent'.", answer: "independent", accept: [], hint: "Conditioning changed nothing." },
    ],
    finalAnswer: { value: "independent", unit: "" },
    solutionNarrative: `$P(A \\mid B) = \\frac{1}{2} = P(A)$: the coin and die share no mechanism, so they are independent.`,
  };
};
fill["stat-cond-ind-d3"] = (rng, idx) => {
  // Compare P(both) with P(car)*P(bike). Randomly independent or dependent.
  const pc = rng.int(4, 7) / 10, pb = rng.int(4, 6) / 10;
  const prod = Math.round(pc * pb * 100) / 100;
  const makeIndep = rng.int(0, 1) === 1;
  // Valid joint range so all four Venn regions stay in [0,1].
  const lo = Math.max(0, Math.round((pc + pb - 1) * 100) / 100);
  const hi = Math.round(Math.min(pc, pb) * 100) / 100;
  let both = prod;
  if (!makeIndep) {
    // Nudge the joint away from the product but keep it a valid overlap.
    const up = Math.round((prod + 0.1) * 100) / 100;
    const down = Math.round((prod - 0.1) * 100) / 100;
    if (up <= hi) both = up;
    else if (down >= lo) both = down;
    // else: no room to differ -> stays == prod, correctly treated as independent below.
  }
  const isIndep = Math.abs(both - prod) < 1e-9;
  const match = isIndep ? "yes" : "no";
  const verdict = isIndep ? "independent" : "dependent";
  return {
    id: `gen.stat-cond-ind-d3.${idx}`, generated: true, concepts: ["independence-test"], difficulty: 3, context: "applied",
    prompt: `Among surveyed people, $P(\\text{owns a car}) = ${pc}$, $P(\\text{owns a bike}) = ${pb}$, and $P(\\text{owns both}) = ${both}$. Test whether car ownership and bike ownership are independent by comparing $P(\\text{both})$ with $P(\\text{car}) \\cdot P(\\text{bike})$. Answer 'independent' or 'dependent'.`,
    steps: [
      { instruction: `Compute the product $P(\\text{car}) \\cdot P(\\text{bike}) = ${pc} \\cdot ${pb}$. (Give a decimal.)`, answer: `${prod}`, accept: [], hint: "Multiply the two." },
      { instruction: `Compare with $P(\\text{both}) = ${both}$. Do they match? Type 'yes' or 'no'.`, answer: match, accept: [], hint: `$${prod}$ versus $${both}$.` },
      { instruction: `Since $P(\\text{both}) ${isIndep ? "=" : "\\ne"} P(\\text{car})P(\\text{bike})$, are the two events independent or dependent? Type 'independent' or 'dependent'.`, answer: verdict, accept: [], hint: "Independent exactly when the joint equals the product of marginals." },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$P(\\text{car})P(\\text{bike}) = ${pc} \\cdot ${pb} = ${prod}$ and $P(\\text{both}) = ${both}$, so the events are ${verdict}.`,
  };
};

// --- bayes-theorem ---
// Helper: Bayes posterior P(D|+) from prevalence, sensitivity, fp-rate.
// Returns exact decimals for terms and a reduced fraction for the posterior.
const bayesPack = (prev, sens, fpr) => {
  const tp = Math.round(prev * sens * 1e6) / 1e6;              // P(+|D)P(D)
  const fp = Math.round((1 - prev) * fpr * 1e6) / 1e6;         // P(+|Dc)P(Dc)
  const tot = Math.round((tp + fp) * 1e6) / 1e6;               // P(+)
  // exact fraction posterior via integer scaling by 1e6
  const tpI = Math.round(tp * 1e6), totI = Math.round(tot * 1e6);
  const postFrac = frac(tpI, totI);
  const postDec = tp / tot;
  return { tp, fp, tot, postFrac, postDec };
};
fill["stat-cond-bayes-d1"] = (rng, idx) => {
  // Conceptual: false-positive rate from specificity; are the two conditionals same? no.
  const spec = rng.pick([0.9, 0.95, 0.98, 0.99]);
  const fpr = Math.round((1 - spec) * 100) / 100;
  return {
    id: `gen.stat-cond-bayes-d1.${idx}`, generated: true, concepts: ["bayes-theorem"], difficulty: 1, context: "applied",
    prompt: `A test's advertised accuracy is its sensitivity: $P(\\text{positive} \\mid \\text{disease}) = 0.99$. Bayes' theorem is needed because a patient wants the REVERSED conditional. With specificity ${spec}, work out the false-positive rate and confirm the two conditionals differ.`,
    steps: [
      { instruction: `A test with specificity ${spec} has what false-positive rate $P(\\text{positive} \\mid \\text{no disease}) = 1 - ${spec}$? (Give a decimal.)`, answer: `${fpr}`, accept: [], hint: "Specificity is the true-negative rate; subtract from 1." },
      { instruction: "The patient needs $P(\\text{disease} \\mid \\text{positive})$, not $P(\\text{positive} \\mid \\text{disease})$. Are these two conditionals the same quantity? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "Bayes reverses the conditioning; the values differ." },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `A specificity of ${spec} means a false-positive rate of ${fpr}, and sensitivity $P(+ \\mid D)$ differs from the patient's target $P(D \\mid +)$ — Bayes reverses the arrow.`,
  };
};
fill["stat-cond-bayes-d2"] = (rng, idx) => {
  // Bayes with a clean fraction posterior. Use prevalence/sens/fpr from a curated pool
  // engineered so P(D|+) reduces to a tidy fraction.
  const pool = [
    { prev: 0.05, sens: 0.95, fpr: 0.10 },  // 0.0475 / 0.1425 = 1/3
    { prev: 0.10, sens: 0.80, fpr: 0.10 },  // 0.08 / 0.17 = 8/17
    { prev: 0.20, sens: 0.90, fpr: 0.10 },  // 0.18 / (0.18+0.08)=0.18/0.26=9/13
    { prev: 0.50, sens: 0.90, fpr: 0.10 },  // 0.45 / 0.50 = 9/10
    { prev: 0.10, sens: 0.90, fpr: 0.20 },  // 0.09 / (0.09+0.18)=0.09/0.27=1/3
  ];
  const { prev, sens, fpr } = rng.pick(pool);
  const B = bayesPack(prev, sens, fpr);
  const prevC = Math.round((1 - prev) * 100) / 100;
  return {
    id: `gen.stat-cond-bayes-d2.${idx}`, generated: true, concepts: ["bayes-theorem"], difficulty: 2, context: "applied",
    prompt: `A disease has prevalence $P(D) = ${prev}$. A test has sensitivity $P(+ \\mid D) = ${sens}$ and false-positive rate $P(+ \\mid D^c) = ${fpr}$. Compute $P(D \\mid +)$ with Bayes' theorem. Give your answer as a fraction in lowest terms.`,
    steps: [
      { instruction: `True-positive term: $${sens} \\cdot ${prev}$. (Give a decimal.)`, answer: `${B.tp}`, accept: [], hint: `$${sens} \\cdot ${prev}$.` },
      { instruction: `False-positive term: $${fpr} \\cdot ${prevC}$ (since $P(D^c) = ${prevC}$). (Give a decimal.)`, answer: `${B.fp}`, accept: [], hint: `$${fpr} \\cdot ${prevC}$.` },
      { instruction: `Total $P(+) = ${B.tp} + ${B.fp}$. (Give a decimal.)`, answer: `${B.tot}`, accept: [], hint: "Add them." },
      { instruction: `Bayes: $P(D \\mid +) = \\frac{${B.tp}}{${B.tot}}$. Give it as a fraction in lowest terms.`, answer: B.postFrac, accept: [rnd(B.postDec, 3)], hint: "Reduce the ratio." },
    ],
    finalAnswer: { value: B.postFrac, unit: "" },
    solutionNarrative: `$P(D \\mid +) = \\frac{${sens} \\cdot ${prev}}{${sens} \\cdot ${prev} + ${fpr} \\cdot ${prevC}} = \\frac{${B.tp}}{${B.tot}} = ${B.postFrac}$. The base rate governs the result.`,
  };
};
fill["stat-cond-bayes-d3"] = (rng, idx) => {
  // The flagship rare-disease example (or spam variant), 3-decimal decimal answer.
  const pool = [
    { kind: "disease", prev: 0.01, sens: 0.99, fpr: 0.05, aName: "D", pName: "+" }, // 0.0099/0.0594 = 1/6 ~ 0.167
    { kind: "disease", prev: 0.02, sens: 0.98, fpr: 0.05, aName: "D", pName: "+" }, // 0.0196/(0.0196+0.049)=0.0196/0.0686
    { kind: "spam", prev: 0.10, sens: 0.80, fpr: 0.10, aName: "spam", pName: "word" }, // 0.08/0.17
  ];
  const c = rng.pick(pool);
  const B = bayesPack(c.prev, c.sens, c.fpr);
  const prevC = Math.round((1 - c.prev) * 100) / 100;
  const dec3 = rnd(B.postDec, 3);
  if (c.kind === "spam") {
    return {
      id: `gen.stat-cond-bayes-d3.${idx}`, generated: true, concepts: ["bayes-theorem"], difficulty: 3, context: "applied",
      prompt: `A spam filter: base rate $P(\\text{spam}) = ${c.prev}$. A word appears in $P(\\text{word} \\mid \\text{spam}) = ${c.sens}$ of spam and $P(\\text{word} \\mid \\text{ham}) = ${c.fpr}$ of legitimate mail. An email contains the word. Compute $P(\\text{spam} \\mid \\text{word})$ with Bayes' theorem. Give your answer as a decimal rounded to 3 places.`,
      steps: [
        { instruction: `Spam term: $${c.sens} \\cdot ${c.prev}$. (Give a decimal.)`, answer: `${B.tp}`, accept: [], hint: `$${c.sens} \\cdot ${c.prev}$.` },
        { instruction: `Ham term: $${c.fpr} \\cdot ${prevC}$. (Give a decimal.)`, answer: `${B.fp}`, accept: [], hint: `$P(\\text{ham}) = ${prevC}$.` },
        { instruction: `Total $P(\\text{word}) = ${B.tp} + ${B.fp}$. (Give a decimal.)`, answer: `${B.tot}`, accept: [], hint: "Add the two terms." },
        { instruction: `Bayes: $P(\\text{spam} \\mid \\text{word}) = \\frac{${B.tp}}{${B.tot}}$, rounded to 3 decimals.`, answer: dec3, accept: [B.postFrac], hint: "Divide." },
      ],
      finalAnswer: { value: dec3, unit: "" },
      solutionNarrative: `$P(\\text{spam} \\mid \\text{word}) = \\frac{${B.tp}}{${B.tot}} = ${B.postFrac} \\approx ${dec3}$. One suggestive word only lifts the posterior partway because most mail is ham.`,
    };
  }
  return {
    id: `gen.stat-cond-bayes-d3.${idx}`, generated: true, concepts: ["bayes-theorem"], difficulty: 3, context: "applied",
    prompt: `A disease has prevalence $P(D) = ${c.prev}$. A test has sensitivity $P(+ \\mid D) = ${c.sens}$ and false-positive rate $P(+ \\mid D^c) = ${c.fpr}$. You test positive. Compute $P(D \\mid +)$ using Bayes' theorem. Give your answer as a decimal rounded to 3 places.`,
    steps: [
      { instruction: `Compute the true-positive term $P(+ \\mid D)\\,P(D) = ${c.sens} \\cdot ${c.prev}$. (Give a decimal.)`, answer: `${B.tp}`, accept: [], hint: `$${c.sens} \\cdot ${c.prev}$.` },
      { instruction: `Compute the false-positive term $P(+ \\mid D^c)\\,P(D^c) = ${c.fpr} \\cdot ${prevC}$. (Give a decimal.)`, answer: `${B.fp}`, accept: [], hint: `$${c.fpr} \\cdot ${prevC}$.` },
      { instruction: `Total probability of a positive: $P(+) = ${B.tp} + ${B.fp}$. (Give a decimal.)`, answer: `${B.tot}`, accept: [], hint: "Add the two terms." },
      { instruction: `Bayes: $P(D \\mid +) = \\frac{${B.tp}}{${B.tot}}$, rounded to 3 decimal places.`, answer: dec3, accept: [B.postFrac], hint: "Divide the true-positive term by the total." },
    ],
    finalAnswer: { value: dec3, unit: "" },
    solutionNarrative: `$P(D \\mid +) = \\frac{${c.sens} \\cdot ${c.prev}}{${c.sens} \\cdot ${c.prev} + ${c.fpr} \\cdot ${prevC}} = \\frac{${B.tp}}{${B.tot}} = ${B.postFrac} \\approx ${dec3}$. The rare base rate lets false positives dominate.`,
  };
};

// ===========================================================================
// TOPIC 4: statistics.random-variables
//   concepts: expected-value, variance-of-rv,
//             binomial-distribution, decisions-with-ev
// ===========================================================================

// --- expected-value ---
fill["stat-rv-ev-d1"] = (rng, idx) => {
  // Two-value RV, each prob 0.5. E[X] = (a+b)/2, forced even so E is clean.
  let a = rng.int(0, 8), b = rng.int(0, 8);
  if ((a + b) % 2 !== 0) b = b + 1 <= 9 ? b + 1 : b - 1;
  const t1 = a * 0.5, t2 = b * 0.5, ev = (a + b) / 2;
  return {
    id: `gen.stat-rv-ev-d1.${idx}`, generated: true, concepts: ["expected-value"], difficulty: 1, context: "abstract",
    prompt: `A random variable $X$ takes value ${a} with probability $0.5$ and value ${b} with probability $0.5$. Find its expected value $E[X]$.`,
    steps: [
      { instruction: `Weight the first value: $${a} \\times 0.5$.`, answer: `${t1}`, accept: [], hint: "Half of the first value." },
      { instruction: `Weight the second value: $${b} \\times 0.5$.`, answer: `${t2}`, accept: [], hint: "Half of the second value." },
      { instruction: "Add the weighted values to get $E[X]$.", answer: `${ev}`, accept: [], hint: `$${t1} + ${t2}$.` },
    ],
    finalAnswer: { value: `${ev}`, unit: "" },
    solutionNarrative: `$E[X] = ${a}(0.5) + ${b}(0.5) = ${t1} + ${t2} = ${ev}$.`,
  };
};
fill["stat-rv-ev-d2"] = (rng, idx) => {
  // Three-value distribution with probs summing to 1 (tenths).
  const p1 = rng.int(1, 4) / 10, p2 = rng.int(1, 4) / 10;
  const p3 = Math.round((1 - p1 - p2) * 10) / 10;
  const x1 = 1, x2 = 2, x3 = 3;
  const t1 = Math.round(x1 * p1 * 100) / 100, t2 = Math.round(x2 * p2 * 100) / 100, t3 = Math.round(x3 * p3 * 100) / 100;
  const ev = Math.round((t1 + t2 + t3) * 100) / 100;
  return {
    id: `gen.stat-rv-ev-d2.${idx}`, generated: true, concepts: ["expected-value"], difficulty: 2, context: "abstract",
    prompt: `A random variable $X$ has the distribution $P(1) = ${p1}$, $P(2) = ${p2}$, $P(3) = ${p3}$. Find $E[X]$.`,
    steps: [
      { instruction: `Compute the weighted term for $x = 1$: $1 \\times ${p1}$.`, answer: `${t1}`, accept: [], hint: `$1 \\times ${p1}$.` },
      { instruction: `Compute the weighted term for $x = 2$: $2 \\times ${p2}$.`, answer: `${t2}`, accept: [], hint: `$2 \\times ${p2}$.` },
      { instruction: `Compute the weighted term for $x = 3$: $3 \\times ${p3}$.`, answer: `${t3}`, accept: [], hint: `$3 \\times ${p3}$.` },
      { instruction: "Add the three terms to get $E[X]$.", answer: `${ev}`, accept: [], hint: `$${t1} + ${t2} + ${t3}$.` },
    ],
    finalAnswer: { value: `${ev}`, unit: "" },
    solutionNarrative: `$E[X] = 1(${p1}) + 2(${p2}) + 3(${p3}) = ${t1} + ${t2} + ${t3} = ${ev}$.`,
  };
};
fill["stat-rv-ev-d3"] = (rng, idx) => {
  // Payout game with mixed signs, probs summing to 1.
  const p1 = rng.int(1, 3) / 10, p2 = rng.int(1, 3) / 10;
  const p3 = Math.round((1 - p1 - p2) * 10) / 10;
  const w1 = rng.int(3, 8), w2 = rng.int(1, 4), loss = -rng.int(2, 6);
  const t1 = Math.round(w1 * p1 * 100) / 100, t2 = Math.round(w2 * p2 * 100) / 100, t3 = Math.round(loss * p3 * 100) / 100;
  const ev = Math.round((t1 + t2 + t3) * 100) / 100;
  return {
    id: `gen.stat-rv-ev-d3.${idx}`, generated: true, concepts: ["expected-value"], difficulty: 3, context: "abstract",
    prompt: `A game pays $+${w1}$ with probability $${p1}$, pays $+${w2}$ with probability $${p2}$, and pays $${loss}$ with probability $${p3}$. Find the expected payout $E[X]$.`,
    steps: [
      { instruction: `Weighted term for $+${w1}$: $${w1} \\times ${p1}$.`, answer: `${t1}`, accept: [], hint: `$${w1} \\times ${p1}$.` },
      { instruction: `Weighted term for $+${w2}$: $${w2} \\times ${p2}$.`, answer: `${t2}`, accept: [], hint: `$${w2} \\times ${p2}$.` },
      { instruction: `Weighted term for $${loss}$: $${loss} \\times ${p3}$.`, answer: `${t3}`, accept: [], hint: `$${loss} \\times ${p3}$.` },
      { instruction: "Add all three terms to get $E[X]$.", answer: `${ev}`, accept: [], hint: `$${t1} + ${t2} + (${t3})$.` },
    ],
    finalAnswer: { value: `${ev}`, unit: "" },
    solutionNarrative: `$E[X] = ${w1}(${p1}) + ${w2}(${p2}) + (${loss})(${p3}) = ${t1} + ${t2} + (${t3}) = ${ev}$.`,
  };
};

// --- variance-of-rv ---
fill["stat-rv-var-d1"] = (rng, idx) => {
  // Two-value symmetric RV {mu-d, mu+d}, each 0.5. Var = d^2. Given mean.
  const d = rng.int(1, 4), mu = rng.int(d + 1, 8);
  const lo = mu - d, hi = mu + d, sq = d * d;
  return {
    id: `gen.stat-rv-var-d1.${idx}`, generated: true, concepts: ["variance-of-rv"], difficulty: 1, context: "abstract",
    prompt: `A random variable $X$ takes value ${lo} with probability $0.5$ and value ${hi} with probability $0.5$. Its mean is $\\mu = ${mu}$. Find the variance $\\mathrm{Var}(X)$.`,
    steps: [
      { instruction: `Squared deviation of the value ${lo}: $(${lo} - ${mu})^2$.`, answer: `${sq}`, accept: [], hint: `$(${lo - mu})^2 = ${sq}$.` },
      { instruction: `Squared deviation of the value ${hi}: $(${hi} - ${mu})^2$.`, answer: `${sq}`, accept: [], hint: `$(${hi - mu})^2 = ${sq}$.` },
      { instruction: `Weight and add: $0.5 \\times ${sq} + 0.5 \\times ${sq}$.`, answer: `${sq}`, accept: [], hint: "The average of two equal numbers." },
    ],
    finalAnswer: { value: `${sq}`, unit: "" },
    solutionNarrative: `$\\mathrm{Var}(X) = 0.5(${lo}-${mu})^2 + 0.5(${hi}-${mu})^2 = 0.5(${sq}) + 0.5(${sq}) = ${sq}$.`,
  };
};
fill["stat-rv-var-d2"] = (rng, idx) => {
  // Two-value {0, k}, each 0.5. mean k/2, var (k/2)^2, sd k/2. Choose k even.
  const k = 2 * rng.int(1, 4);
  const mu = k / 2, sq = mu * mu, variance = sq, sd = mu;
  return {
    id: `gen.stat-rv-var-d2.${idx}`, generated: true, concepts: ["variance-of-rv"], difficulty: 2, context: "abstract",
    prompt: `A random variable $X$ takes value 0 with probability $0.5$ and value ${k} with probability $0.5$. Find first the mean, then the variance, then the standard deviation.`,
    steps: [
      { instruction: `Mean: $0 \\times 0.5 + ${k} \\times 0.5$.`, answer: `${mu}`, accept: [], hint: `Halfway between 0 and ${k}.` },
      { instruction: `Squared deviation of 0: $(0 - ${mu})^2$.`, answer: `${sq}`, accept: [], hint: `$(-${mu})^2 = ${sq}$.` },
      { instruction: `Squared deviation of ${k}: $(${k} - ${mu})^2$.`, answer: `${sq}`, accept: [], hint: `$(${mu})^2 = ${sq}$.` },
      { instruction: `Variance: $0.5 \\times ${sq} + 0.5 \\times ${sq}$.`, answer: `${variance}`, accept: [], hint: "The average of two equal numbers." },
      { instruction: `Standard deviation: $\\sqrt{${variance}}$.`, answer: `${sd}`, accept: [`sqrt(${variance})`], hint: `What squares to ${variance}?` },
    ],
    finalAnswer: { value: `${sd}`, unit: "" },
    solutionNarrative: `$\\mu = ${mu}$; $\\mathrm{Var}(X) = ${variance}$; $\\sigma = \\sqrt{${variance}} = ${sd}$.`,
  };
};
fill["stat-rv-var-d3"] = (rng, idx) => {
  // Three-value distribution; compute mean then variance (report to 2 decimals but
  // choose values so results are exact to <= 3 decimals). Use x in {0,1,4}, probs tenths.
  // Ranges guarantee p4 = 1 - p0 - p1 lands in [0.1, 0.5] (never <= 0).
  const p0 = rng.int(3, 5) / 10, p1 = rng.int(2, 3) / 10;
  const p4 = Math.round((1 - p0 - p1) * 10) / 10;
  const xs = [0, 1, 4], ps = [p0, p1, p4];
  const mu = Math.round((0 * p0 + 1 * p1 + 4 * p4) * 100) / 100;
  const term0 = Math.round(p0 * (0 - mu) * (0 - mu) * 1e6) / 1e6;
  const term1 = Math.round(p1 * (1 - mu) * (1 - mu) * 1e6) / 1e6;
  const term4 = Math.round(p4 * (4 - mu) * (4 - mu) * 1e6) / 1e6;
  const variance = Math.round((term0 + term1 + term4) * 1e6) / 1e6;
  return {
    id: `gen.stat-rv-var-d3.${idx}`, generated: true, concepts: ["variance-of-rv"], difficulty: 3, context: "abstract",
    prompt: `A random variable $X$ has $P(0) = ${p0}$, $P(1) = ${p1}$, $P(4) = ${p4}$. Find the mean, then the variance.`,
    steps: [
      { instruction: `Mean: $0(${p0}) + 1(${p1}) + 4(${p4})$.`, answer: `${mu}`, accept: [], hint: `$0 + ${p1} + ${Math.round(4 * p4 * 100) / 100}$.` },
      { instruction: `Weighted squared deviation of 0: $${p0} \\times (0 - ${mu})^2$.`, answer: `${term0}`, accept: [], hint: `$(${-mu})^2 = ${Math.round(mu * mu * 1e6) / 1e6}$, then times $${p0}$.` },
      { instruction: `Weighted squared deviation of 1: $${p1} \\times (1 - ${mu})^2$.`, answer: `${term1}`, accept: [], hint: `$(${Math.round((1 - mu) * 1e6) / 1e6})^2$, then times $${p1}$.` },
      { instruction: `Weighted squared deviation of 4: $${p4} \\times (4 - ${mu})^2$.`, answer: `${term4}`, accept: [], hint: `$(${Math.round((4 - mu) * 1e6) / 1e6})^2$, then times $${p4}$.` },
      { instruction: "Add the three weighted terms to get the variance.", answer: `${variance}`, accept: [], hint: `$${term0} + ${term1} + ${term4}$.` },
    ],
    finalAnswer: { value: `${variance}`, unit: "" },
    solutionNarrative: `$\\mu = ${mu}$; $\\mathrm{Var}(X) = ${term0} + ${term1} + ${term4} = ${variance}$. The far-off value 4 dominates the spread.`,
  };
};

// --- binomial-distribution ---
fill["stat-rv-binom-d1"] = (rng, idx) => {
  // n=3, p=0.5, P(X=k). exact decimals.
  const n = 3, k = rng.int(1, 2);
  const c = comb(n, k);
  const pk = Math.pow(0.5, n); // since p=1-p=0.5, p^k(1-p)^(n-k)=0.5^n
  const prob = Math.round(c * pk * 1e6) / 1e6;
  return {
    id: `gen.stat-rv-binom-d1.${idx}`, generated: true, concepts: ["binomial-distribution"], difficulty: 1, context: "abstract",
    prompt: `Flip a fair coin 3 times. The number of heads $X$ is binomial with $n = 3$, $p = 0.5$. Find $P(X = ${k})$ using $P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}$.`,
    steps: [
      { instruction: `Count the arrangements: $\\binom{3}{${k}}$.`, answer: `${c}`, accept: [], hint: `Ways to choose ${k} of 3 positions.` },
      { instruction: `Compute $p^k (1-p)^{n-k} = (0.5)^${k} (0.5)^${n - k}$.`, answer: `${pk}`, accept: [], hint: `$(0.5)^3 = 0.125$.` },
      { instruction: `Multiply: $${c} \\times ${pk}$.`, answer: `${prob}`, accept: [], hint: `$${c} \\times ${pk}$.` },
    ],
    finalAnswer: { value: `${prob}`, unit: "" },
    solutionNarrative: `$P(X=${k}) = \\binom{3}{${k}}(0.5)^${k}(0.5)^${n - k} = ${c} \\cdot ${pk} = ${prob}$.`,
  };
};
fill["stat-rv-binom-d2"] = (rng, idx) => {
  // n=5, p in {0.2,0.3}, P(X=1). Round to 4 decimals.
  const n = 5, k = 1;
  const p = rng.pick([0.2, 0.3]);
  const q = Math.round((1 - p) * 10) / 10;
  const c = comb(n, k); // 5
  const qpow = Math.round(Math.pow(q, n - k) * 1e6) / 1e6; // q^4
  const prob = c * p * Math.pow(q, n - k);
  const probR = rnd(prob, 4);
  const qpowR = rnd(Math.pow(q, n - k), 4);
  return {
    id: `gen.stat-rv-binom-d2.${idx}`, generated: true, concepts: ["binomial-distribution"], difficulty: 2, context: "abstract",
    prompt: `For a binomial with $n = 5$ and $p = ${p}$, find $P(X = 1)$ using $P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}$. Round to 4 decimals.`,
    steps: [
      { instruction: "Compute $\\binom{5}{1}$.", answer: `${c}`, accept: [], hint: "Choosing 1 of 5." },
      { instruction: `Compute $p^1 = (${p})^1$.`, answer: `${p}`, accept: [], hint: "Just $p$." },
      { instruction: `Compute $(1-p)^{4} = (${q})^4$. Round to 4 decimals.`, answer: qpowR, accept: [`${qpow}`], hint: `$${q}^2$, then square that.` },
      { instruction: `Multiply $5 \\times ${p} \\times ${qpowR}$. Round to 4 decimals.`, answer: probR, accept: [], hint: `$5 \\times ${p} = ${Math.round(5 * p * 100) / 100}$, times $${qpowR}$.` },
    ],
    finalAnswer: { value: probR, unit: "" },
    solutionNarrative: `$P(X=1) = \\binom{5}{1}(${p})^1(${q})^4 = 5(${p})(${qpowR}) = ${probR}$.`,
  };
};
fill["stat-rv-binom-d3"] = (rng, idx) => {
  // Expected count E[X]=np (clean), OR P(X>=1)=1-q^n. Use E[X]=np applied.
  const variants = [
    { n: 40, p: 0.05 }, { n: 50, p: 0.02 }, { n: 20, p: 0.1 }, { n: 30, p: 0.1 }, { n: 60, p: 0.05 },
  ];
  const v = rng.pick(variants);
  const ev = Math.round(v.n * v.p * 100) / 100;
  return {
    id: `gen.stat-rv-binom-d3.${idx}`, generated: true, concepts: ["binomial-distribution"], difficulty: 3, context: "applied",
    prompt: `A factory line produces items each defective with probability $p = ${v.p}$, independently. In a box of $n = ${v.n}$ items, the number of defects is binomial. Find the expected number of defects using $E[X] = np$.`,
    steps: [
      { instruction: `Identify $n$ and multiply by $p$: $${v.n} \\times ${v.p}$. (Give a number.)`, answer: `${ev}`, accept: [], hint: `$${Math.round(v.p * 100)}\\%$ of ${v.n}.` },
      { instruction: "So on average how many defects per box?", answer: `${ev}`, accept: [], hint: "It equals $np$." },
    ],
    finalAnswer: { value: `${ev}`, unit: "defects" },
    solutionNarrative: `$E[X] = np = ${v.n}(${v.p}) = ${ev}$ defects per box on average.`,
  };
};

// --- decisions-with-ev ---
fill["stat-rv-dec-d1"] = (rng, idx) => {
  // Symmetric coin-flip bet +w/-w -> E=0, classify fair.
  const w = rng.int(2, 9);
  return {
    id: `gen.stat-rv-dec-d1.${idx}`, generated: true, concepts: ["decisions-with-ev"], difficulty: 1, context: "applied",
    prompt: `A coin-flip bet pays $+\\$${w}$ with probability $0.5$ and $-\\$${w}$ with probability $0.5$. Find the expected value and classify the bet as fair, favorable, or unfavorable.`,
    steps: [
      { instruction: `Expected value: $${w}(0.5) + (-${w})(0.5)$.`, answer: "0", accept: [], hint: "The two terms cancel." },
      { instruction: "With $E[X] = 0$, is the bet fair, favorable, or unfavorable? Give the single word.", answer: "fair", accept: [], hint: "$E[X] = 0$ has a name." },
    ],
    finalAnswer: { value: "0", unit: "dollars" },
    solutionNarrative: `$E[X] = ${w}(0.5) - ${w}(0.5) = 0$, so the bet is fair.`,
  };
};
fill["stat-rv-dec-d2"] = (rng, idx) => {
  // Warranty vs expected repair. Expected cost = cost*p; compare to warranty price.
  const repair = 100 * rng.int(2, 6), p = rng.int(3, 8) / 100;
  const exp = Math.round(repair * p * 100) / 100;
  const warranty = rng.int(Math.max(5, Math.round(exp) - 8), Math.round(exp) + 15);
  const worth = warranty < exp ? "yes" : "no";
  return {
    id: `gen.stat-rv-dec-d2.${idx}`, generated: true, concepts: ["decisions-with-ev"], difficulty: 2, context: "applied",
    prompt: `You may pay \\$${warranty} for an extended warranty. Without it, a repair costing \\$${repair} happens with probability $${p}$; otherwise you pay nothing. Compare your expected repair cost to the warranty price to decide whether to buy (on expected value alone).`,
    steps: [
      { instruction: `Expected repair cost without the warranty: $${repair} \\times ${p}$. (Give a number.)`, answer: `${exp}`, accept: [], hint: `$${Math.round(p * 100)}\\%$ of \\$${repair}.` },
      { instruction: `The warranty costs \\$${warranty}. On pure expected value, is buying it worth it? Answer 'yes' or 'no'.`, answer: worth, accept: [], hint: `Compare \\$${warranty} to the \\$${exp} expected cost.` },
    ],
    finalAnswer: { value: `${exp}`, unit: "dollars" },
    solutionNarrative: `Expected repair cost is $${repair}(${p}) = \\$${exp}$; the warranty costs \\$${warranty}, so on expected value alone the answer is '${worth}'.`,
  };
};
fill["stat-rv-dec-d3"] = (rng, idx) => {
  // Lottery ticket net EV. return average r, cost 1 -> net r-1. Classify.
  const ret = rng.int(30, 80) / 100; // average prize per $1 ticket
  const net = Math.round((ret - 1) * 100) / 100;
  return {
    id: `gen.stat-rv-dec-d3.${idx}`, generated: true, concepts: ["decisions-with-ev"], difficulty: 3, context: "applied",
    prompt: `A \\$1 lottery ticket returns an average of \\$${ret} in prizes. Find the net expected value per ticket (winnings minus cost), and decide whether the bet is favorable.`,
    steps: [
      { instruction: `Net expected value: $${ret} - 1$.`, answer: `${net}`, accept: [], hint: "Average prize minus the \\$1 cost." },
      { instruction: "Is the bet favorable to the player? Answer 'yes' or 'no'.", answer: "no", accept: [], hint: "A negative $E[X]$ favors the house." },
    ],
    finalAnswer: { value: `${net}`, unit: "dollars" },
    solutionNarrative: `$E[X] = ${ret} - 1 = \\$${net}$ per ticket. It is negative, so the bet is unfavorable.`,
  };
};

// ===========================================================================
// TOPIC 5: statistics.normal-and-sampling
//   concepts: zscores, empirical-rule, normal-probabilities, sampling-and-clt
// ===========================================================================

// --- zscores ---
fill["stat-norm-z-d1"] = (rng, idx) => {
  // z = (x-mu)/sigma, forced to divide evenly to a clean integer/half.
  const sigma = rng.pick([5, 8, 10, 12, 15, 20]);
  const zInt = rng.pick([1, 2, 3, -1, -2]);
  const mu = rng.int(20, 80), x = mu + zInt * sigma;
  const numer = x - mu;
  return {
    id: `gen.stat-norm-z-d1.${idx}`, generated: true, concepts: ["zscores"], difficulty: 1, context: "abstract",
    prompt: `A distribution has mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Find the z-score of the value $x = ${x}$ using $z = \\dfrac{x - \\mu}{\\sigma}$.`,
    steps: [
      { instruction: `Compute the numerator $x - \\mu = ${x} - ${mu}$.`, answer: `${numer}`, accept: [], hint: `$${x} - ${mu}$.` },
      { instruction: `Divide by $\\sigma = ${sigma}$.`, answer: `${zInt}`, accept: [], hint: `$${numer} / ${sigma}$.` },
    ],
    finalAnswer: { value: `${zInt}`, unit: "" },
    solutionNarrative: `$z = \\tfrac{${x} - ${mu}}{${sigma}} = \\tfrac{${numer}}{${sigma}} = ${zInt}$.`,
  };
};
fill["stat-norm-z-d2"] = (rng, idx) => {
  // Applied z-score with a possibly decimal answer; sigma=100 style keeps it clean.
  const cases = [
    { ctx: "SAT section scores", mu: 500, sigma: 100 },
    { ctx: "a standardized exam", mu: 60, sigma: 8 },
    { ctx: "IQ scores", mu: 100, sigma: 15 },
  ];
  const c = rng.pick(cases);
  const zChoices = [0.5, 1.2, 1.5, -0.5, -1.5, 2, -2];
  let z = rng.pick(zChoices);
  let x = c.mu + z * c.sigma;
  // ensure x integer-ish; if not, snap z so x is integer
  if (!Number.isInteger(x)) { x = Math.round(x); z = (x - c.mu) / c.sigma; }
  const numer = x - c.mu;
  const zR = rnd(z, 2);
  const sign = z >= 0 ? "above" : "below";
  return {
    id: `gen.stat-norm-z-d2.${idx}`, generated: true, concepts: ["zscores"], difficulty: 2, context: "applied",
    prompt: `${c.ctx} have mean $\\mu = ${c.mu}$ and standard deviation $\\sigma = ${c.sigma}$. Find the z-score of a ${x}, then interpret its sign.`,
    steps: [
      { instruction: `Numerator: $${x} - ${c.mu}$.`, answer: `${numer}`, accept: [], hint: `$${x} - ${c.mu}$.` },
      { instruction: `Divide by $${c.sigma}$ to get the z-score.`, answer: zR, accept: [], hint: `$${numer} / ${c.sigma}$.` },
      { instruction: "Is this z-score above or below the mean? Give one word.", answer: sign, accept: [], hint: "Positive means to the right of center." },
    ],
    finalAnswer: { value: zR, unit: "" },
    solutionNarrative: `$z = \\tfrac{${x} - ${c.mu}}{${c.sigma}} = ${zR}$, so the ${x} is ${Math.abs(z)} standard deviations ${sign} the mean.`,
  };
};
fill["stat-norm-z-d3"] = (rng, idx) => {
  // Inverse: x = mu + z*sigma.
  const cases = [
    { ctx: "IQ scores", mu: 100, sigma: 15 },
    { ctx: "SAT section scores", mu: 500, sigma: 100 },
    { ctx: "a manufacturing measurement", mu: 50, sigma: 4 },
  ];
  const c = rng.pick(cases);
  const z = rng.pick([1, 2, 3, -1, -2, 1.5]);
  const zsig = Math.round(z * c.sigma * 100) / 100;
  const x = Math.round((c.mu + zsig) * 100) / 100;
  return {
    id: `gen.stat-norm-z-d3.${idx}`, generated: true, concepts: ["zscores"], difficulty: 3, context: "applied",
    prompt: `${c.ctx} have mean $\\mu = ${c.mu}$ and standard deviation $\\sigma = ${c.sigma}$. A percentile corresponds to a z-score of $z = ${z}$. Use the inverse formula $x = \\mu + z\\sigma$ to find the raw score.`,
    steps: [
      { instruction: `Compute $z\\sigma = ${z} \\times ${c.sigma}$.`, answer: `${zsig}`, accept: [], hint: `$${z} \\times ${c.sigma}$.` },
      { instruction: `Add the mean: $x = ${c.mu} + ${zsig}$.`, answer: `${x}`, accept: [], hint: "$\\mu + z\\sigma$." },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `$x = \\mu + z\\sigma = ${c.mu} + ${z}(${c.sigma}) = ${x}$.`,
  };
};

// --- empirical-rule ---
fill["stat-norm-emp-d1"] = (rng, idx) => {
  // Recall a 68-95-99.7 value, or its half.
  const variants = [
    { q: "within $\\pm 1$ standard deviation", ans: "68", unit: "percent" },
    { q: "within $\\pm 2$ standard deviations", ans: "95", unit: "percent" },
    { q: "within $\\pm 3$ standard deviations", ans: "99.7", unit: "percent" },
    { q: "between the mean and $+1\\sigma$ (half of the 68%)", ans: "34", unit: "percent" },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.stat-norm-emp-d1.${idx}`, generated: true, concepts: ["empirical-rule"], difficulty: 1, context: "abstract",
    prompt: `For a normal distribution, the empirical rule (68-95-99.7) gives fixed percentages. What percentage of values lies ${v.q}?`,
    steps: [
      { instruction: `Recall the 68-95-99.7 rule. Give the percentage ${v.q} (a number only).`, answer: v.ans, accept: [], hint: "Use the memorized rule (or halve it by symmetry)." },
    ],
    finalAnswer: { value: v.ans, unit: v.unit },
    solutionNarrative: `By the empirical rule, about ${v.ans}% of values lie ${v.q}.`,
  };
};
fill["stat-norm-emp-d2"] = (rng, idx) => {
  // +-2 sigma interval for a named normal.
  const cases = [
    { ctx: "Adult IQ", mu: 100, sigma: 15 },
    { ctx: "SAT scores", mu: 500, sigma: 100 },
    { ctx: "Adult heights (in)", mu: 69, sigma: 3 },
  ];
  const c = rng.pick(cases);
  const lo = c.mu - 2 * c.sigma, hi = c.mu + 2 * c.sigma;
  return {
    id: `gen.stat-norm-emp-d2.${idx}`, generated: true, concepts: ["empirical-rule"], difficulty: 2, context: "applied",
    prompt: `${c.ctx} is normal with $\\mu = ${c.mu}$, $\\sigma = ${c.sigma}$. By the empirical rule, about $95\\%$ of values fall within $\\pm 2\\sigma$. Find the interval that captures that middle $95\\%$.`,
    steps: [
      { instruction: `Lower bound: $\\mu - 2\\sigma = ${c.mu} - 2(${c.sigma})$.`, answer: `${lo}`, accept: [], hint: `$${c.mu} - ${2 * c.sigma}$.` },
      { instruction: `Upper bound: $\\mu + 2\\sigma = ${c.mu} + 2(${c.sigma})$.`, answer: `${hi}`, accept: [], hint: `$${c.mu} + ${2 * c.sigma}$.` },
    ],
    finalAnswer: { value: `${hi}`, unit: "" },
    solutionNarrative: `$\\pm 2\\sigma$ spans $${c.mu} \\pm ${2 * c.sigma}$, i.e. ${lo} to ${hi} — the range holding about $95\\%$.`,
  };
};
fill["stat-norm-emp-d3"] = (rng, idx) => {
  // Tail beyond +/- k sigma using empirical rule. k in {1,2}.
  const cases = [
    { ctx: "Heights", mu: 69, sigma: 3 },
    { ctx: "IQ scores", mu: 100, sigma: 15 },
    { ctx: "Test scores", mu: 70, sigma: 10 },
  ];
  const c = rng.pick(cases);
  const k = rng.pick([1, 2]);
  const val = c.mu + k * c.sigma;
  const inside = k === 1 ? 68 : 95;
  const tail = (100 - inside) / 2; // 16 or 2.5
  return {
    id: `gen.stat-norm-emp-d3.${idx}`, generated: true, concepts: ["empirical-rule"], difficulty: 3, context: "applied",
    prompt: `${c.ctx} are normal with $\\mu = ${c.mu}$, $\\sigma = ${c.sigma}$. Using the empirical rule, what percentage of values are GREATER than ${val}? (Note $${val} = \\mu + ${k}\\sigma$.)`,
    steps: [
      { instruction: `How many standard deviations above the mean is ${val}? Compute $\\tfrac{${val} - ${c.mu}}{${c.sigma}}$.`, answer: `${k}`, accept: [], hint: `$${k * c.sigma} / ${c.sigma}$.` },
      { instruction: `About $${inside}\\%$ lie within $\\pm ${k}\\sigma$, leaving $${100 - inside}\\%$ in the two tails. The upper tail is half of that. Give the percentage above $+${k}\\sigma$.`, answer: `${tail}`, accept: [], hint: `Half of the leftover $${100 - inside}\\%$.` },
    ],
    finalAnswer: { value: `${tail}`, unit: "percent" },
    solutionNarrative: `${val} is $+${k}\\sigma$. Outside $\\pm ${k}\\sigma$ is $${100 - inside}\\%$, split evenly, so about $${tail}\\%$ exceed ${val}.`,
  };
};

// --- normal-probabilities ---
fill["stat-norm-prob-d1"] = (rng, idx) => {
  // Percentile below +1sigma = 50+34 = 84, or below -1sigma = 16.
  const dir = rng.pick(["above", "below"]);
  const ans = dir === "above" ? 84 : 16;
  const desc = dir === "above" ? "$+1\\sigma$" : "$-1\\sigma$";
  const combo = dir === "above" ? "$50 + 34$" : "$50 - 34$";
  return {
    id: `gen.stat-norm-prob-d1.${idx}`, generated: true, concepts: ["normal-probabilities"], difficulty: 1, context: "abstract",
    prompt: `In a normal distribution, $50\\%$ of values lie below the mean and about $34\\%$ lie between the mean and $\\pm 1\\sigma$. What percentage of values lies BELOW ${desc} (the percentile of $z = ${dir === "above" ? "1" : "-1"}$)?`,
    steps: [
      { instruction: `Combine the areas: ${combo}.`, answer: `${ans}`, accept: [], hint: dir === "above" ? "Add the below-mean 50% and the 34% band." : "Subtract the 34% band from the below-mean 50%." },
    ],
    finalAnswer: { value: `${ans}`, unit: "percent" },
    solutionNarrative: `Below ${desc} is ${combo} $= ${ans}\\%$, so $z = ${dir === "above" ? "1" : "-1"}$ marks the ${ans}th percentile.`,
  };
};
fill["stat-norm-prob-d2"] = (rng, idx) => {
  // Given P(Z<z)=area, find P(Z>z)=1-area.
  const pairs = [
    { z: 1.5, area: 0.933 }, { z: 1.0, area: 0.841 }, { z: 2.0, area: 0.977 }, { z: 0.5, area: 0.691 },
  ];
  const p = rng.pick(pairs);
  const tail = Math.round((1 - p.area) * 1000) / 1000;
  return {
    id: `gen.stat-norm-prob-d2.${idx}`, generated: true, concepts: ["normal-probabilities"], difficulty: 2, context: "abstract",
    prompt: `You are given the area $P(Z < ${p.z}) = ${p.area}$ for the standard normal. Find $P(Z > ${p.z})$, the probability a value exceeds $z = ${p.z}$.`,
    steps: [
      { instruction: `The total area is 1. Compute $1 - ${p.area}$.`, answer: `${tail}`, accept: [], hint: "Subtract the given area from 1." },
    ],
    finalAnswer: { value: `${tail}`, unit: "" },
    solutionNarrative: `$P(Z > ${p.z}) = 1 - P(Z < ${p.z}) = 1 - ${p.area} = ${tail}$.`,
  };
};
fill["stat-norm-prob-d3"] = (rng, idx) => {
  // Middle band P(-z<Z<z) = area - (1-area) using a supplied area, applied.
  const pairs = [
    { z: 1.5, area: 0.933 }, { z: 1.0, area: 0.841 }, { z: 2.0, area: 0.977 },
  ];
  const p = rng.pick(pairs);
  const mu = 500, sigma = 100;
  const hi = mu + p.z * sigma, lo = mu - p.z * sigma;
  const tail = Math.round((1 - p.area) * 1000) / 1000;
  const band = Math.round((p.area - tail) * 1000) / 1000;
  return {
    id: `gen.stat-norm-prob-d3.${idx}`, generated: true, concepts: ["normal-probabilities"], difficulty: 3, context: "applied",
    prompt: `SAT scores are normal with $\\mu = ${mu}$, $\\sigma = ${sigma}$. You are given $P(Z < ${p.z}) = ${p.area}$. Find the probability a score falls between ${lo} and ${hi}. (Note $${hi} = \\mu + ${p.z}\\sigma$ and $${lo} = \\mu - ${p.z}\\sigma$.)`,
    steps: [
      { instruction: `Standardize ${hi}: $z = \\tfrac{${hi} - ${mu}}{${sigma}}$.`, answer: `${p.z}`, accept: [], hint: `$${p.z * sigma} / ${sigma}$.` },
      { instruction: `Find the upper tail $P(Z > ${p.z}) = 1 - ${p.area}$.`, answer: `${tail}`, accept: [], hint: `$1 - ${p.area}$.` },
      { instruction: `Now the middle band: $${p.area} - ${tail}$.`, answer: `${band}`, accept: [], hint: `$${p.area} - ${tail}$.` },
    ],
    finalAnswer: { value: `${band}`, unit: "" },
    solutionNarrative: `Both bounds standardize to $z = \\pm ${p.z}$. With $P(Z < ${p.z}) = ${p.area}$ the upper tail is ${tail}, so $P(-${p.z} < Z < ${p.z}) = ${p.area} - ${tail} = ${band}$.`,
  };
};

// --- sampling-and-clt ---
fill["stat-norm-clt-d1"] = (rng, idx) => {
  // SE = sigma/sqrt(n) with n a perfect square, sigma divisible by sqrt(n).
  const root = rng.pick([5, 6, 8, 10, 12]);
  const n = root * root;
  const se = rng.int(1, 5);
  const sigma = se * root;
  return {
    id: `gen.stat-norm-clt-d1.${idx}`, generated: true, concepts: ["sampling-and-clt"], difficulty: 1, context: "abstract",
    prompt: `A population has standard deviation $\\sigma = ${sigma}$. You take samples of size $n = ${n}$. Find the standard error of the sample mean, $\\mathrm{SE} = \\dfrac{\\sigma}{\\sqrt{n}}$.`,
    steps: [
      { instruction: `Compute $\\sqrt{n} = \\sqrt{${n}}$.`, answer: `${root}`, accept: [`sqrt(${n})`], hint: `$${root}^2 = ${n}$.` },
      { instruction: `Divide: $\\tfrac{${sigma}}{${root}}$.`, answer: `${se}`, accept: [], hint: `$${sigma} / ${root}$.` },
    ],
    finalAnswer: { value: `${se}`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\tfrac{${sigma}}{\\sqrt{${n}}} = \\tfrac{${sigma}}{${root}} = ${se}$.`,
  };
};
fill["stat-norm-clt-d2"] = (rng, idx) => {
  // Applied SE with a machine/bottle context.
  const root = rng.pick([4, 6, 7, 9]);
  const n = root * root;
  const se = rng.int(1, 4);
  const sigma = se * root;
  const mu = rng.pick([500, 250, 100]);
  return {
    id: `gen.stat-norm-clt-d2.${idx}`, generated: true, concepts: ["sampling-and-clt"], difficulty: 2, context: "applied",
    prompt: `A machine fills bottles with mean $\\mu = ${mu}$ mL and standard deviation $\\sigma = ${sigma}$ mL. A quality tech averages $n = ${n}$ bottles. Find the standard error of that sample mean.`,
    steps: [
      { instruction: `Compute $\\sqrt{n} = \\sqrt{${n}}$.`, answer: `${root}`, accept: [`sqrt(${n})`], hint: `$\\sqrt{${n}} = ${root}$.` },
      { instruction: `Divide: $\\tfrac{${sigma}}{${root}}$.`, answer: `${se}`, accept: [], hint: `$${sigma} / ${root}$.` },
    ],
    finalAnswer: { value: `${se}`, unit: "mL" },
    solutionNarrative: `$\\mathrm{SE} = \\tfrac{${sigma}}{\\sqrt{${n}}} = \\tfrac{${sigma}}{${root}} = ${se}$ mL.`,
  };
};
fill["stat-norm-clt-d3"] = (rng, idx) => {
  // Polling SE = 1/(2 sqrt(n)) with n perfect square; margin = 2*SE.
  const root = rng.pick([50, 25, 20, 100]);
  const n = root * root;
  const se = Math.round((1 / (2 * root)) * 1e6) / 1e6;
  const moe = Math.round(2 * se * 1e6) / 1e6;
  return {
    id: `gen.stat-norm-clt-d3.${idx}`, generated: true, concepts: ["sampling-and-clt"], difficulty: 3, context: "applied",
    prompt: `A pollster's sample proportion has standard error $\\mathrm{SE} = \\tfrac{1}{2\\sqrt{n}}$. With $n = ${n}$ respondents, find the SE, then the margin of error (about $2 \\times \\mathrm{SE}$), as decimals.`,
    steps: [
      { instruction: `Compute $\\sqrt{n} = \\sqrt{${n}}$.`, answer: `${root}`, accept: [`sqrt(${n})`], hint: `$${root}^2 = ${n}$.` },
      { instruction: `Standard error: $\\tfrac{1}{2 \\times ${root}}$.`, answer: `${se}`, accept: [frac(1, 2 * root)], hint: `$\\tfrac{1}{${2 * root}}$.` },
      { instruction: `Margin of error: $2 \\times ${se}$.`, answer: `${moe}`, accept: [], hint: "Twice the SE." },
    ],
    finalAnswer: { value: `${moe}`, unit: "" },
    solutionNarrative: `$\\sqrt{${n}} = ${root}$, so $\\mathrm{SE} = \\tfrac{1}{${2 * root}} = ${se}$ and the margin of error is $2(${se}) = ${moe}$.`,
  };
};

// ===========================================================================
// TOPIC 6: statistics.data-displays
//   concepts: histograms-and-shape, quartiles-and-boxplots,
//             percentiles, comparing-distributions
// ===========================================================================

// --- histograms-and-shape ---
fill["stat-disp-shape-d1"] = (rng, idx) => {
  const variants = [
    { desc: "most of its bars piled up on the LEFT, with a long thin tail stretching to the RIGHT toward high values", ans: "right", tail: "high (right)" },
    { desc: "most of its bars piled up on the RIGHT, with a long thin tail stretching to the LEFT toward low values", ans: "left", tail: "low (left)" },
    { desc: "a mirror image about its center — the left half looks just like the right half, with a single central peak", ans: "symmetric", tail: "neither" },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.stat-disp-shape-d1.${idx}`, generated: true, concepts: ["histograms-and-shape"], difficulty: 1, context: "abstract",
    prompt: `A histogram has ${v.desc}. What is the shape of this distribution? Answer: left, right, or symmetric.`,
    steps: [
      { instruction: "Name the shape. Answer: left, right, or symmetric.", answer: v.ans, accept: [], hint: v.ans === "symmetric" ? "Neither tail is longer." : "Skew is named for the direction the long tail points." },
    ],
    finalAnswer: { value: v.ans, unit: "" },
    solutionNarrative: `The tail points toward ${v.tail} values, so the distribution is ${v.ans}${v.ans === "symmetric" ? "" : "-skewed"}.`,
  };
};
fill["stat-disp-shape-d2"] = (rng, idx) => {
  // mean vs median -> skew direction.
  const meanV = rng.int(40, 80);
  const gap = rng.int(5, 15);
  const higherMean = rng.int(0, 1) === 1;
  const medianV = higherMean ? meanV - gap : meanV + gap;
  const cmp = meanV > medianV ? "greater" : "less";
  const skew = meanV > medianV ? "right" : "left";
  const tail = meanV > medianV ? "high" : "low";
  return {
    id: `gen.stat-disp-shape-d2.${idx}`, generated: true, concepts: ["histograms-and-shape"], difficulty: 2, context: "abstract",
    prompt: `For a data set, the mean is ${meanV} and the median is ${medianV}. A skewed distribution has its mean pulled toward the tail. Which way is this distribution skewed? Answer: left, right, or symmetric.`,
    steps: [
      { instruction: "Is the mean greater than or less than the median here? Answer: greater or less.", answer: cmp, accept: [], hint: `$${meanV}$ vs $${medianV}$.` },
      { instruction: `The mean is dragged toward the tail. Since the mean sits ${cmp === "greater" ? "above" : "below"} the median, the tail points toward the ${tail} values. Name the skew. Answer: left, right, or symmetric.`, answer: skew, accept: [], hint: `Mean ${cmp === "greater" ? "above" : "below"} median means the tail points ${skew}.` },
    ],
    finalAnswer: { value: skew, unit: "" },
    solutionNarrative: `The mean (${meanV}) is ${cmp} than the median (${medianV}), so the mean is pulled toward ${tail} values — the tail points ${skew}. The distribution is skewed ${skew}.`,
  };
};
fill["stat-disp-shape-d3"] = (rng, idx) => {
  // Count modes: bimodal commute times.
  const p1 = rng.int(10, 20), p2 = rng.int(40, 55);
  return {
    id: `gen.stat-disp-shape-d3.${idx}`, generated: true, concepts: ["histograms-and-shape"], difficulty: 3, context: "applied",
    prompt: `A histogram of daily commute times shows two distinct, well-separated peaks — a cluster near ${p1} minutes and another near ${p2} minutes — suggesting two kinds of commuters mixed together. How many modes does this distribution have? (Give a number.)`,
    steps: [
      { instruction: "Count the number of distinct peaks in the histogram. (Give a number.)", answer: "2", accept: [], hint: `One cluster near ${p1} min and one near ${p2} min.` },
      { instruction: "A distribution with exactly two peaks is called bimodal. Confirm the number of peaks. (Give a number.)", answer: "2", accept: [], hint: "Bimodal means two modes." },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `Two distinct peaks make the distribution bimodal — usually a sign of two subpopulations mixed in one chart.`,
  };
};

// --- quartiles-and-boxplots ---
// Build an odd-length sorted set and compute five-number summary by median-of-halves.
fill["stat-disp-box-d1"] = (rng, idx) => {
  // n=5 sorted set; median excluded; Q1 avg of two lower, Q3 avg of two upper.
  let a = rng.int(1, 4);
  const data = [];
  for (let i = 0; i < 5; i++) { data.push(a); a += rng.int(1, 3); }
  const [d0, d1, d2, d3, d4] = data;
  const med = d2, q1 = (d0 + d1) / 2, q3 = (d3 + d4) / 2;
  const summary = `${d0},${q1},${med},${q3},${d4}`;
  return {
    id: `gen.stat-disp-box-d1.${idx}`, generated: true, concepts: ["quartiles-and-boxplots"], difficulty: 1, context: "abstract",
    prompt: `Give the five-number summary of the data $\\{${data.join(", ")}\\}$ (already sorted, $n = 5$). Use the median-of-halves method: exclude the median from each half. Report as five values in order: min, Q1, median, Q3, max (comma-separated).`,
    steps: [
      { instruction: "The median is the middle (3rd) value. What is it? (Give a number.)", answer: `${med}`, accept: [], hint: "The 3rd of five sorted values." },
      { instruction: `The lower half is $\\{${d0}, ${d1}\\}$; its median is Q1 $= (${d0}+${d1})/2$. (Give a number.)`, answer: `${q1}`, accept: [], hint: `Average of ${d0} and ${d1}.` },
      { instruction: `The upper half is $\\{${d3}, ${d4}\\}$; its median is Q3 $= (${d3}+${d4})/2$. (Give a number.)`, answer: `${q3}`, accept: [], hint: `Average of ${d3} and ${d4}.` },
      { instruction: "Now write the full five-number summary: min, Q1, median, Q3, max (comma-separated, in that order).", answer: summary, accept: [], hint: `Min ${d0}, Q1 ${q1}, median ${med}, Q3 ${q3}, max ${d4}.` },
    ],
    finalAnswer: { value: summary, unit: "" },
    solutionNarrative: `Median ${med}; lower half $\\{${d0},${d1}\\}$ gives Q1 $= ${q1}$; upper half $\\{${d3},${d4}\\}$ gives Q3 $= ${q3}$. Five-number summary: $${d0}, ${q1}, ${med}, ${q3}, ${d4}$.`,
  };
};
fill["stat-disp-box-d2"] = (rng, idx) => {
  // n=7 sorted; median excluded; Q1 = middle of lower 3, Q3 = middle of upper 3.
  let a = rng.int(2, 6);
  const data = [];
  for (let i = 0; i < 7; i++) { data.push(a); a += rng.int(1, 4); }
  const med = data[3], q1 = data[1], q3 = data[5];
  const summary = `${data[0]},${q1},${med},${q3},${data[6]}`;
  return {
    id: `gen.stat-disp-box-d2.${idx}`, generated: true, concepts: ["quartiles-and-boxplots"], difficulty: 2, context: "abstract",
    prompt: `For the sorted data $\\{${data.join(", ")}\\}$ ($n = 7$, odd), find the quartiles by the median-of-halves method (exclude the median from each half), then the five-number summary.`,
    steps: [
      { instruction: "The median is the middle (4th) value. What is it? (Give a number.)", answer: `${med}`, accept: [], hint: "The 4th of seven sorted values." },
      { instruction: `Excluding the median, the lower half is $\\{${data[0]}, ${data[1]}, ${data[2]}\\}$; Q1 is its median. (Give a number.)`, answer: `${q1}`, accept: [], hint: `The middle of $${data[0]}, ${data[1]}, ${data[2]}$.` },
      { instruction: `The upper half is $\\{${data[4]}, ${data[5]}, ${data[6]}\\}$; Q3 is its median. (Give a number.)`, answer: `${q3}`, accept: [], hint: `The middle of $${data[4]}, ${data[5]}, ${data[6]}$.` },
      { instruction: "State the five-number summary: min, Q1, median, Q3, max (comma-separated).", answer: summary, accept: [], hint: `Min ${data[0]}, max ${data[6]}, plus the three you found.` },
    ],
    finalAnswer: { value: summary, unit: "" },
    solutionNarrative: `Median ${med}; lower half gives Q1 $= ${q1}$; upper half gives Q3 $= ${q3}$. Five-number summary: $${data[0]}, ${q1}, ${med}, ${q3}, ${data[6]}$.`,
  };
};
fill["stat-disp-box-d3"] = (rng, idx) => {
  // n=8 even; lower half = first 4, upper half = last 4; median avg of 4th,5th.
  let a = rng.int(1, 4);
  const data = [];
  for (let i = 0; i < 8; i++) { data.push(a); a += rng.int(1, 4); }
  const med = (data[3] + data[4]) / 2;
  const q1 = (data[1] + data[2]) / 2;
  const q3 = (data[5] + data[6]) / 2;
  const summary = `${data[0]},${q1},${med},${q3},${data[7]}`;
  return {
    id: `gen.stat-disp-box-d3.${idx}`, generated: true, concepts: ["quartiles-and-boxplots"], difficulty: 3, context: "abstract",
    prompt: `For the sorted data $\\{${data.join(", ")}\\}$ ($n = 8$, even), find the five-number summary. With an even count, the lower half is the smallest 4 values and the upper half is the largest 4.`,
    steps: [
      { instruction: `The median is the average of the two middle (4th and 5th) values, $${data[3]}$ and $${data[4]}$. Compute it. (Give a number.)`, answer: `${med}`, accept: [], hint: `$(${data[3]} + ${data[4]})/2$.` },
      { instruction: `Q1 is the median of the lower half $\\{${data[0]}, ${data[1]}, ${data[2]}, ${data[3]}\\}$: average the two middle values $${data[1]}$ and $${data[2]}$. (Give a number.)`, answer: `${q1}`, accept: [], hint: `$(${data[1]} + ${data[2]})/2$.` },
      { instruction: `Q3 is the median of the upper half $\\{${data[4]}, ${data[5]}, ${data[6]}, ${data[7]}\\}$: average $${data[5]}$ and $${data[6]}$. (Give a number.)`, answer: `${q3}`, accept: [], hint: `$(${data[5]} + ${data[6]})/2$.` },
      { instruction: "State the five-number summary: min, Q1, median, Q3, max (comma-separated).", answer: summary, accept: [], hint: `Min ${data[0]}, max ${data[7]}, plus your Q1, median, Q3.` },
    ],
    finalAnswer: { value: summary, unit: "" },
    solutionNarrative: `Median $(${data[3]}+${data[4]})/2 = ${med}$; lower half gives Q1 $= ${q1}$; upper half gives Q3 $= ${q3}$. Five-number summary: $${data[0]}, ${q1}, ${med}, ${q3}, ${data[7]}$.`,
  };
};

// --- percentiles ---
fill["stat-disp-pct-d1"] = (rng, idx) => {
  // percentile rank = below/n * 100, with n making it clean.
  const n = rng.pick([10, 20, 25, 50]);
  const below = rng.int(1, n - 1);
  const rank = Math.round((below / n) * 100 * 100) / 100;
  return {
    id: `gen.stat-disp-pct-d1.${idx}`, generated: true, concepts: ["percentiles"], difficulty: 1, context: "abstract",
    prompt: `Among ${n} sorted values, exactly ${below} values fall below yours. Using percentile rank $= \\frac{\\#\\text{ below}}{n} \\times 100$, what is your percentile rank?`,
    steps: [
      { instruction: `Compute $\\frac{${below}}{${n}} \\times 100$. (Give a number.)`, answer: `${rank}`, accept: [], hint: `$${below}/${n} = ${Math.round((below / n) * 1000) / 1000}$, times 100.` },
    ],
    finalAnswer: { value: `${rank}`, unit: "" },
    solutionNarrative: `Percentile rank $= \\frac{${below}}{${n}} \\times 100 = ${rank}$.`,
  };
};
fill["stat-disp-pct-d2"] = (rng, idx) => {
  // percentile rank in a class, or p50 via averaging two middle values.
  const n = rng.pick([20, 25, 40, 50]);
  const below = rng.int(Math.floor(n / 4), Math.floor(3 * n / 4));
  const rank = Math.round((below / n) * 100 * 100) / 100;
  return {
    id: `gen.stat-disp-pct-d2.${idx}`, generated: true, concepts: ["percentiles"], difficulty: 2, context: "applied",
    prompt: `A class of ${n} test scores is sorted. Your score has exactly ${below} classmates' scores below it. Using percentile rank $= \\frac{\\#\\text{ below}}{n} \\times 100$, find your percentile rank.`,
    steps: [
      { instruction: "How many scores are below yours? (Give a number.)", answer: `${below}`, accept: [], hint: "Stated in the problem." },
      { instruction: `Compute the percentile rank $\\frac{${below}}{${n}} \\times 100$. (Give a number.)`, answer: `${rank}`, accept: [], hint: `$${below}/${n} = ${Math.round((below / n) * 1000) / 1000}$.` },
    ],
    finalAnswer: { value: `${rank}`, unit: "" },
    solutionNarrative: `Percentile rank $= \\frac{${below}}{${n}} \\times 100 = ${rank}$: you outscore that fraction of the class.`,
  };
};
fill["stat-disp-pct-d3"] = (rng, idx) => {
  // Nearest-rank p-th percentile of a sorted list of latencies.
  const n = 10;
  // build a sorted latency-like list
  const data = [];
  let cur = rng.int(8, 15);
  for (let i = 0; i < n; i++) { data.push(cur); cur += rng.int(3, 40) + i * rng.int(2, 20); }
  const p = rng.pick([90, 95]);
  const raw = (p / 100) * n;                    // e.g. 9 or 9.5
  const pos = Math.ceil(raw);                    // 9 or 10
  const val = data[pos - 1];
  const rawStr = `${Math.round(raw * 100) / 100}`;
  return {
    id: `gen.stat-disp-pct-d3.${idx}`, generated: true, concepts: ["percentiles"], difficulty: 3, context: "applied",
    prompt: `Ten request latencies (ms), sorted, are $\\{${data.join(", ")}\\}$. Find the p${p} latency using the nearest-rank method: the value at sorted position $\\lceil \\frac{p}{100} \\times n \\rceil$.`,
    steps: [
      { instruction: `Compute the raw position $\\frac{${p}}{100} \\times 10$. (Give a number.)`, answer: rawStr, accept: [], hint: `$${p / 100} \\times 10$.` },
      { instruction: `Round UP to the nearest whole number (the ceiling) to get the sorted position. (Give a number.)`, answer: `${pos}`, accept: [], hint: `$\\lceil ${rawStr} \\rceil = ${pos}$.` },
      { instruction: `Read the value at sorted position ${pos} (the ${pos}th value). (Give a number in ms.)`, answer: `${val}`, accept: [], hint: `Count to the ${pos}th value in the sorted list.` },
    ],
    finalAnswer: { value: `${val}`, unit: "ms" },
    solutionNarrative: `Position $\\lceil ${p / 100} \\times 10 \\rceil = \\lceil ${rawStr} \\rceil = ${pos}$, so p${p} is the ${pos}th sorted value, ${val} ms.`,
  };
};

// --- comparing-distributions ---
fill["stat-disp-cmp-d1"] = (rng, idx) => {
  // Two medians, which center is higher.
  let ma = rng.int(30, 60), mb = rng.int(30, 70);
  while (ma === mb) mb = rng.int(30, 70);
  const ans = mb > ma ? "b" : "a";
  return {
    id: `gen.stat-disp-cmp-d1.${idx}`, generated: true, concepts: ["comparing-distributions"], difficulty: 1, context: "abstract",
    prompt: `Data set A has median ${ma}; data set B has median ${mb}. Comparing only their centers, which data set is typically higher? Answer: a or b.`,
    steps: [
      { instruction: `Compare the two medians: which is larger, A's ${ma} or B's ${mb}? Answer: a or b.`, answer: ans, accept: [], hint: `$${Math.max(ma, mb)} > ${Math.min(ma, mb)}$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `${ans.toUpperCase()}'s median (${ans === "a" ? ma : mb}) is larger, so by center, data set ${ans.toUpperCase()} runs typically higher.`,
  };
};
fill["stat-disp-cmp-d2"] = (rng, idx) => {
  // Same median, different IQR -> which more consistent (smaller IQR).
  const med = rng.int(60, 80);
  const iqrA = rng.int(4, 8), iqrB = iqrA + rng.int(6, 15);
  return {
    id: `gen.stat-disp-cmp-d2.${idx}`, generated: true, concepts: ["comparing-distributions"], difficulty: 2, context: "abstract",
    prompt: `Two data sets have the SAME median of ${med}. Set A has IQR ${iqrA}; set B has IQR ${iqrB}. Since their centers match, which set is MORE consistent (smaller spread)? Answer: a or b.`,
    steps: [
      { instruction: `Compare the two IQRs: which is smaller, A's ${iqrA} or B's ${iqrB}? Answer: a or b.`, answer: "a", accept: [], hint: "Smaller IQR means less spread." },
      { instruction: "The set with the smaller IQR is more consistent. Which set is more consistent? Answer: a or b.", answer: "a", accept: [], hint: `A has IQR ${iqrA}, the smaller spread.` },
    ],
    finalAnswer: { value: "a", unit: "" },
    solutionNarrative: `Both sets center at ${med}, but A's IQR (${iqrA}) is smaller than B's (${iqrB}), so A is the more consistent distribution.`,
  };
};
fill["stat-disp-cmp-d3"] = (rng, idx) => {
  // Compare spread by range on two 5-value server sets with equal median.
  const med = rng.int(70, 76);
  const dA = rng.int(2, 5), dB = rng.int(8, 16);
  const A = [med - 2 * dA, med - dA, med, med + dA, med + 2 * dA];
  const B = [med - 2 * dB, med - dB, med, med + dB, med + 2 * dB];
  const rangeA = A[4] - A[0], rangeB = B[4] - B[0];
  return {
    id: `gen.stat-disp-cmp-d3.${idx}`, generated: true, concepts: ["comparing-distributions"], difficulty: 3, context: "applied",
    prompt: `Two servers are benchmarked. Server A's response times (ms) are $\\{${A.join(", ")}\\}$; Server B's are $\\{${B.join(", ")}\\}$. Compare their spread using the range to decide which server is more predictable.`,
    steps: [
      { instruction: "Compute Server A's range (max $-$ min). (Give a number.)", answer: `${rangeA}`, accept: [], hint: `$${A[4]} - ${A[0]}$.` },
      { instruction: "Compute Server B's range (max $-$ min). (Give a number.)", answer: `${rangeB}`, accept: [], hint: `$${B[4]} - ${B[0]}$.` },
      { instruction: "The smaller range is more predictable. Which server is more predictable? Answer: a or b.", answer: "a", accept: [], hint: `A's range ${rangeA} is much smaller than B's ${rangeB}.` },
    ],
    finalAnswer: { value: "a", unit: "" },
    solutionNarrative: `Both servers share the same median, but Server A's range (${rangeA} ms) is far tighter than Server B's (${rangeB} ms) — Server A delivers more predictable latency.`,
  };
};
