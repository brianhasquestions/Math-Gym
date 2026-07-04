// gen-advstat1-fill.js
// Parametric generators for the Advanced Statistics subject, topics
//   advanced-statistics.discrete-distributions
//   advanced-statistics.poisson-exponential
//   advanced-statistics.continuous-random-variables
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats2-fill.js). Template prefix: as1-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. All decimals are produced
// from integer arithmetic over powers of ten, so printed strings are exact and
// answers always self-check. Any transcendental constant a student needs
// (e^{-lambda}) is GIVEN in the prompt from the table below.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const rnd = (x, p) => {
  const f = Math.pow(10, p);
  return `${Math.round(x * f) / f}`;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Reduced fraction string: frac(8,12) -> "2/3", frac(6,3) -> "2".
const frac = (n, d) => {
  if (n === 0) return "0";
  const s = n * d < 0 ? -1 : 1;
  n = Math.abs(n); d = Math.abs(d);
  const g = gcd(n, d);
  n /= g; d /= g;
  return d === 1 ? `${s * n}` : `${s < 0 ? "-" : ""}${n}/${d}`;
};
const choose = (n, k) => {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
};
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
// Exact decimal string for an integer count of 10^-p units: dec(1536, 4) -> "0.1536".
const dec = (units, p) => `${units / Math.pow(10, p)}`;
// e^{-lambda} to 4 decimals, stored in ten-thousandths so products stay integers.
// These GIVEN values are quoted verbatim in every prompt that needs them.
const EXP = {
  "0.5": 6065, "1": 3679, "1.5": 2231, "2": 1353,
  "2.5": 821, "3": 498, "4": 183, "5": 67, "6": 25,
};
const expStr = (lt) => dec(EXP[`${lt}`], 4);

export const fill = {};

// ===========================================================================
// TOPIC 1: advanced-statistics.discrete-distributions
//   concepts: binomial-setting, binomial-probabilities,
//             binomial-mean-sd, geometric-distribution
// ===========================================================================

// --- binomial-setting ---
fill["as1-binomial-setting-1"] = (rng, idx) => {
  const ch = rng.pick([2, 4, 5]);
  const n = rng.pick([8, 10, 12, 20]);
  const p = dec(Math.round(10000 / ch), 4); // 0.5, 0.25, 0.2
  return {
    id: `gen.as1-binomial-setting-1.${idx}`, generated: true, concepts: ["binomial-setting"], difficulty: 1, context: "applied",
    prompt: `A quiz has ${n} multiple-choice questions with ${ch} choices each, and a student guesses every answer at random. Let $X$ be the number of correct answers. Identify the binomial parameters.`,
    steps: [
      { instruction: `How many trials $n$ are there?`, answer: `${n}`, accept: [], hint: `One trial per question.` },
      { instruction: `What is the success probability $p$ per trial? (Give a decimal.)`, answer: p, accept: [`1/${ch}`], hint: `One correct choice out of ${ch}.` },
      { instruction: `Binary, independent, fixed number, same $p$ — does $X$ follow a binomial distribution? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Random guessing satisfies all four BINS conditions.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Each question is a binary trial, guesses are independent, $n = ${n}$ is fixed, and $p = ${p}$ never changes — $X$ is Binomial(${n}, ${p}).`,
  };
};
fill["as1-binomial-setting-2"] = (rng, idx) => {
  const scen = rng.pick([
    { desc: "You draw 6 cards from a shuffled deck WITHOUT replacement and count the red cards", fails: "independence", faccept: ["same-probability", "independent"], binom: "no", why: "each card drawn changes the deck, so the trials are not independent" },
    { desc: "You roll a fair die repeatedly UNTIL the first 6 appears and count the rolls needed", fails: "fixed-number", faccept: ["fixed number", "n"], binom: "no", why: "there is no fixed number of trials — the experiment stops when a 6 lands" },
    { desc: "You flip a fair coin 20 times and count the heads", fails: "none", faccept: [], binom: "yes", why: "binary, independent, fixed 20 flips, constant p = 0.5 — all four conditions hold" },
    { desc: "A machine's defect rate drifts upward as it heats through the day; you count defects among 30 consecutive parts", fails: "same-probability", faccept: ["same probability", "constant-p"], binom: "no", why: "the success probability changes from trial to trial as the machine heats" },
  ]);
  return {
    id: `gen.as1-binomial-setting-2.${idx}`, generated: true, concepts: ["binomial-setting"], difficulty: 2, context: "applied",
    prompt: `${scen.desc}. Decide whether this count is binomial.`,
    steps: [
      { instruction: `Which BINS condition fails? Type 'independence', 'fixed-number', 'same-probability', or 'none'.`, answer: scen.fails, accept: scen.faccept, hint: `Check the four conditions one at a time.` },
      { instruction: `So is the count binomial? Type 'yes' or 'no'.`, answer: scen.binom, accept: [], hint: `All four conditions must hold.` },
    ],
    finalAnswer: { value: scen.binom, unit: "" },
    solutionNarrative: `Here ${scen.why}, so the count is ${scen.binom === "yes" ? "" : "NOT "}binomial.`,
  };
};
fill["as1-binomial-setting-3"] = (rng, idx) => {
  const n = rng.pick([20, 30, 40, 50]);
  const pwT = rng.pick([8, 9]); // works with prob 0.8 / 0.9
  const pT = 10 - pwT;          // failure prob in tenths
  const mu = (n * pT) / 10;     // integer by construction
  return {
    id: `gen.as1-binomial-setting-3.${idx}`, generated: true, concepts: ["binomial-setting"], difficulty: 3, context: "applied",
    prompt: `A rack holds ${n} drives; each drive independently survives the year with probability ${dec(pwT, 1)}. Let $X$ be the number of drives that FAIL. Set up the binomial model for $X$.`,
    steps: [
      { instruction: `Counting a failure as the model's 'success', what is $p$? (Give a decimal.)`, answer: dec(pT, 1), accept: [`${pT}/10`], hint: `$1 - ${dec(pwT, 1)}$.` },
      { instruction: `How many trials $n$?`, answer: `${n}`, accept: [], hint: `One trial per drive.` },
      { instruction: `Expected failures: $\\mu = np = ${n} \\times ${dec(pT, 1)}$.`, answer: `${mu}`, accept: [], hint: `Multiply.` },
      { instruction: `Is $X$ binomial? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Binary, independent, fixed ${n}, same $p$.` },
    ],
    finalAnswer: { value: `${mu}`, unit: "drives" },
    solutionNarrative: `"Success" is whatever you count — here a failure with $p = ${dec(pT, 1)}$. $X$ is Binomial(${n}, ${dec(pT, 1)}) with mean $np = ${mu}$ failed drives.`,
  };
};

// --- binomial-probabilities ---
fill["as1-binomial-prob-1"] = (rng, idx) => {
  const [n, k] = rng.pick([[3, 1], [3, 2], [4, 1], [4, 2], [4, 3], [5, 2], [5, 3]]);
  const c = choose(n, k);
  const pow = Math.pow(2, n);
  return {
    id: `gen.as1-binomial-prob-1.${idx}`, generated: true, concepts: ["binomial-probabilities"], difficulty: 1, context: "abstract",
    prompt: `A fair coin is flipped ${n} times. Find $P(X = ${k})$, the probability of exactly ${k} heads, using $P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$.`,
    steps: [
      { instruction: `Compute $\\binom{${n}}{${k}}$.`, answer: `${c}`, accept: [], hint: `Count the ways to place ${k} heads among ${n} flips.` },
      { instruction: `Compute $(0.5)^{${k}} (0.5)^{${n - k}} = (0.5)^{${n}}$. (Fraction or decimal.)`, answer: frac(1, pow), accept: [`${1 / pow}`], hint: `Half, ${n} times: $1/${pow}$.` },
      { instruction: `Multiply: $${c} \\times ${frac(1, pow)}$. (Fraction or decimal.)`, answer: frac(c, pow), accept: [`${c / pow}`], hint: `$${c}/${pow}$.` },
    ],
    finalAnswer: { value: frac(c, pow), unit: "" },
    solutionNarrative: `$P(X = ${k}) = \\binom{${n}}{${k}}(0.5)^{${n}} = ${c} \\times \\tfrac{1}{${pow}} = ${frac(c, pow)} = ${c / pow}$.`,
  };
};
fill["as1-binomial-prob-2"] = (rng, idx) => {
  const pT = rng.pick([1, 2, 3, 4]); // p in tenths
  const k = rng.pick([1, 2, 3]);
  const n = 4;
  const qT = 10 - pT;
  const c = choose(n, k);
  const pPow = Math.pow(pT, k);            // p^k in 10^-k units
  const qPow = Math.pow(qT, n - k);        // q^(n-k) in 10^-(n-k) units
  const total = c * pPow * qPow;           // in 10^-4 units
  const scen = rng.pick([
    { item: "parts", event: "defective", ctx: "Four parts come off a line" },
    { item: "seeds", event: "failing to sprout", ctx: "Four seeds are planted" },
    { item: "shipments", event: "arriving late", ctx: "Four shipments go out" },
  ]);
  return {
    id: `gen.as1-binomial-prob-2.${idx}`, generated: true, concepts: ["binomial-probabilities"], difficulty: 2, context: "applied",
    prompt: `${scen.ctx}; each is independently ${scen.event} with probability $p = ${dec(pT, 1)}$. Find the probability of exactly ${k} ${scen.event === "defective" ? "defective " + scen.item : scen.item + " " + scen.event}.`,
    steps: [
      { instruction: `Compute $\\binom{4}{${k}}$.`, answer: `${c}`, accept: [], hint: `$\\frac{4!}{${k}!\\,${n - k}!}$.` },
      { instruction: `Compute $(${dec(pT, 1)})^{${k}}$. Give the exact value.`, answer: dec(pPow, k), accept: [], hint: `Multiply ${dec(pT, 1)} by itself ${k} time${k === 1 ? "" : "s"}.` },
      { instruction: `Compute $(${dec(qT, 1)})^{${n - k}}$. Give the exact value.`, answer: dec(qPow, n - k), accept: [], hint: `$1 - p = ${dec(qT, 1)}$, raised to the ${n - k}.` },
      { instruction: `Multiply all three: $${c} \\times ${dec(pPow, k)} \\times ${dec(qPow, n - k)}$. Give the exact value.`, answer: dec(total, 4), accept: [], hint: `The product has at most 4 decimal places.` },
    ],
    finalAnswer: { value: dec(total, 4), unit: "" },
    solutionNarrative: `$P(X = ${k}) = \\binom{4}{${k}}(${dec(pT, 1)})^{${k}}(${dec(qT, 1)})^{${n - k}} = ${c} \\times ${dec(pPow, k)} \\times ${dec(qPow, n - k)} = ${dec(total, 4)}$.`,
  };
};
fill["as1-binomial-prob-3"] = (rng, idx) => {
  const pT = rng.pick([1, 2, 3]);  // defect prob in tenths
  const n = rng.pick([5, 6]);
  const qT = 10 - pT;
  // q^n rounded to 4 decimals, computed in integer units.
  const exact = Math.pow(qT, n);                       // in 10^-n units
  const r = Math.round(exact / Math.pow(10, n - 4));   // rounded to 10^-4 units
  return {
    id: `gen.as1-binomial-prob-3.${idx}`, generated: true, concepts: ["binomial-probabilities"], difficulty: 3, context: "applied",
    prompt: `An inspector samples ${n} components; each is independently defective with probability $p = ${dec(pT, 1)}$. The lot is rejected if ANY defect appears. Find the probability the lot passes ($X = 0$) and the probability it is rejected ($X \\ge 1$).`,
    steps: [
      { instruction: `What is $q = 1 - p$?`, answer: dec(qT, 1), accept: [], hint: `The per-component clean probability.` },
      { instruction: `Probability all ${n} are clean: $P(X = 0) = (${dec(qT, 1)})^{${n}}$, rounded to 4 decimal places.`, answer: dec(r, 4), accept: [dec(exact, n)], hint: `Multiply ${dec(qT, 1)} by itself ${n} times, then round.` },
      { instruction: `Using your rounded value: $P(X \\ge 1) = 1 - ${dec(r, 4)}$.`, answer: dec(10000 - r, 4), accept: [], hint: `The complement of zero defects.` },
    ],
    finalAnswer: { value: dec(10000 - r, 4), unit: "" },
    solutionNarrative: `$P(X = 0) = (${dec(qT, 1)})^{${n}} \\approx ${dec(r, 4)}$, so $P(X \\ge 1) = 1 - ${dec(r, 4)} = ${dec(10000 - r, 4)}$ — the one-subtraction shortcut for "at least one".`,
  };
};

// --- binomial-mean-sd ---
fill["as1-binomial-meansd-1"] = (rng, idx) => {
  const n = rng.pick([20, 30, 50, 100, 200]);
  const pT = rng.int(1, 5);
  const mu = (n * pT) / 10; // integer: n is a multiple of 10
  return {
    id: `gen.as1-binomial-meansd-1.${idx}`, generated: true, concepts: ["binomial-mean-sd"], difficulty: 1, context: "applied",
    prompt: `A newsletter is sent to ${n} subscribers; each independently opens it with probability $p = ${dec(pT, 1)}$. Find the expected number of opens.`,
    steps: [
      { instruction: `What is $1 - p$? (Give a decimal.)`, answer: dec(10 - pT, 1), accept: [], hint: `The probability of not opening.` },
      { instruction: `Expected opens: $\\mu = np = ${n} \\times ${dec(pT, 1)}$.`, answer: `${mu}`, accept: [], hint: `Multiply.` },
    ],
    finalAnswer: { value: `${mu}`, unit: "opens" },
    solutionNarrative: `$\\mu = np = ${n}(${dec(pT, 1)}) = ${mu}$ opens on average.`,
  };
};
fill["as1-binomial-meansd-2"] = (rng, idx) => {
  // Engineered so np is an integer and np(1-p) is a perfect square.
  const c = rng.pick([
    { n: 25, p: "0.2", mu: 5, v: 4, sd: 2 },
    { n: 25, p: "0.8", mu: 20, v: 4, sd: 2 },
    { n: 36, p: "0.5", mu: 18, v: 9, sd: 3 },
    { n: 64, p: "0.5", mu: 32, v: 16, sd: 4 },
    { n: 100, p: "0.5", mu: 50, v: 25, sd: 5 },
    { n: 100, p: "0.2", mu: 20, v: 16, sd: 4 },
    { n: 100, p: "0.8", mu: 80, v: 16, sd: 4 },
    { n: 100, p: "0.9", mu: 90, v: 9, sd: 3 },
    { n: 100, p: "0.1", mu: 10, v: 9, sd: 3 },
    { n: 48, p: "0.25", mu: 12, v: 9, sd: 3 },
    { n: 48, p: "0.75", mu: 36, v: 9, sd: 3 },
    { n: 400, p: "0.5", mu: 200, v: 100, sd: 10 },
  ]);
  const q = rnd(1 - parseFloat(c.p), 2);
  return {
    id: `gen.as1-binomial-meansd-2.${idx}`, generated: true, concepts: ["binomial-mean-sd"], difficulty: 2, context: "abstract",
    prompt: `A binomial variable has $n = ${c.n}$ trials with success probability $p = ${c.p}$. Find its mean and standard deviation.`,
    steps: [
      { instruction: `Mean: $\\mu = np = ${c.n} \\times ${c.p}$.`, answer: `${c.mu}`, accept: [], hint: `Multiply.` },
      { instruction: `Variance: $np(1-p) = ${c.n} \\times ${c.p} \\times ${q}$.`, answer: `${c.v}`, accept: [], hint: `$\\mu \\times ${q}$.` },
      { instruction: `Standard deviation: $\\sigma = \\sqrt{${c.v}}$.`, answer: `${c.sd}`, accept: [`sqrt(${c.v})`], hint: `$${c.sd}^2 = ${c.v}$.` },
    ],
    finalAnswer: { value: `${c.sd}`, unit: "" },
    solutionNarrative: `$\\mu = ${c.mu}$ and $\\sigma = \\sqrt{${c.n}(${c.p})(${q})} = \\sqrt{${c.v}} = ${c.sd}$.`,
  };
};
fill["as1-binomial-meansd-3"] = (rng, idx) => {
  // Variance is an exact decimal; sigma is rounded to 2 places.
  const c = rng.pick([
    { n: 50, p: "0.2", q: "0.8", mu: 10, v: 8 },
    { n: 40, p: "0.5", q: "0.5", mu: 20, v: 10 },
    { n: 60, p: "0.5", q: "0.5", mu: 30, v: 15 },
    { n: 50, p: "0.4", q: "0.6", mu: 20, v: 12 },
    { n: 80, p: "0.1", q: "0.9", mu: 8, v: 7.2 },
    { n: 90, p: "0.3", q: "0.7", mu: 27, v: 18.9 },
  ]);
  const sd = rnd(Math.sqrt(c.v), 2);
  return {
    id: `gen.as1-binomial-meansd-3.${idx}`, generated: true, concepts: ["binomial-mean-sd"], difficulty: 3, context: "applied",
    prompt: `An email campaign goes to $n = ${c.n}$ recipients, each independently clicking with probability $p = ${c.p}$. Find the mean and standard deviation of the click count; round $\\sigma$ to 2 decimal places.`,
    steps: [
      { instruction: `Mean: $\\mu = np$.`, answer: `${c.mu}`, accept: [], hint: `$${c.n} \\times ${c.p}$.` },
      { instruction: `Variance: $np(1-p) = ${c.n} \\times ${c.p} \\times ${c.q}$. Give the exact value.`, answer: `${c.v}`, accept: [], hint: `$${c.mu} \\times ${c.q}$.` },
      { instruction: `Standard deviation, rounded to 2 decimal places: $\\sigma = \\sqrt{${c.v}}$.`, answer: sd, accept: [`sqrt(${c.v})`], hint: `Take the square root, then round.` },
    ],
    finalAnswer: { value: sd, unit: "clicks" },
    solutionNarrative: `$\\mu = ${c.mu}$, variance $= ${c.v}$, so $\\sigma = \\sqrt{${c.v}} \\approx ${sd}$ clicks.`,
  };
};

// --- geometric-distribution ---
fill["as1-geometric-1"] = (rng, idx) => {
  const pT = rng.int(1, 5);
  const qT = 10 - pT;
  return {
    id: `gen.as1-geometric-1.${idx}`, generated: true, concepts: ["geometric-distribution"], difficulty: 1, context: "applied",
    prompt: `A salesperson closes each cold call independently with probability $p = ${dec(pT, 1)}$. Let $X$ be the call on which the FIRST sale happens.`,
    steps: [
      { instruction: `Compute $P(X = 1) = p$.`, answer: dec(pT, 1), accept: [], hint: `Success on the very first call.` },
      { instruction: `What is the failure probability $q = 1 - p$?`, answer: dec(qT, 1), accept: [], hint: `$1 - ${dec(pT, 1)}$.` },
      { instruction: `Compute $P(X = 2) = q \\cdot p = ${dec(qT, 1)} \\times ${dec(pT, 1)}$. Give the exact value.`, answer: dec(qT * pT, 2), accept: [], hint: `One failure, then one success.` },
    ],
    finalAnswer: { value: dec(qT * pT, 2), unit: "" },
    solutionNarrative: `$P(X = 1) = ${dec(pT, 1)}$ and $P(X = 2) = (${dec(qT, 1)})(${dec(pT, 1)}) = ${dec(qT * pT, 2)}$.`,
  };
};
fill["as1-geometric-2"] = (rng, idx) => {
  const pT = rng.pick([1, 2, 4, 5]);
  const k = rng.pick([3, 4]);
  const qT = 10 - pT;
  const qPow = Math.pow(qT, k - 1);          // in 10^-(k-1) units
  const prob = qPow * pT;                    // in 10^-k units
  const ev = `${10 / pT}`;                   // 10, 5, 2.5, 2
  return {
    id: `gen.as1-geometric-2.${idx}`, generated: true, concepts: ["geometric-distribution"], difficulty: 2, context: "applied",
    prompt: `A free-throw shooter succeeds independently with probability $p = ${dec(pT, 1)}$ per attempt. Find the probability the FIRST success comes on attempt ${k}, and the expected number of attempts.`,
    steps: [
      { instruction: `Compute $q^{${k - 1}} = (${dec(qT, 1)})^{${k - 1}}$. Give the exact value.`, answer: dec(qPow, k - 1), accept: [], hint: `${k - 1} misses in a row.` },
      { instruction: `Compute $P(X = ${k}) = q^{${k - 1}} p = ${dec(qPow, k - 1)} \\times ${dec(pT, 1)}$. Give the exact value.`, answer: dec(prob, k), accept: [], hint: `Multiply by the success probability.` },
      { instruction: `Expected attempts: $E[X] = \\dfrac{1}{p} = \\dfrac{1}{${dec(pT, 1)}}$.`, answer: ev, accept: [`10/${pT}`], hint: `One over the success probability.` },
    ],
    finalAnswer: { value: dec(prob, k), unit: "" },
    solutionNarrative: `$P(X = ${k}) = (${dec(qT, 1)})^{${k - 1}}(${dec(pT, 1)}) = ${dec(prob, k)}$, and on average the first success takes $1/${dec(pT, 1)} = ${ev}$ attempts.`,
  };
};
fill["as1-geometric-3"] = (rng, idx) => {
  const pT = rng.pick([1, 2, 3, 5]);
  const k = rng.pick([2, 3, 4]);
  const qT = 10 - pT;
  const qPow = Math.pow(qT, k);              // in 10^-k units
  const ev = frac(10, pT);                   // 10, 5, 10/3, 2
  return {
    id: `gen.as1-geometric-3.${idx}`, generated: true, concepts: ["geometric-distribution"], difficulty: 3, context: "applied",
    prompt: `Parts on a line are independently defective with probability $p = ${dec(pT, 1)}$. An inspector waits for the first defect.`,
    steps: [
      { instruction: `Probability the first ${k} parts are ALL clean: $P(X > ${k}) = q^{${k}} = (${dec(qT, 1)})^{${k}}$. Give the exact value.`, answer: dec(qPow, k), accept: [], hint: `Multiply ${dec(qT, 1)} by itself ${k} times.` },
      { instruction: `Given the first ${k} parts were clean, what is the probability the next part is defective? (The geometric is memoryless.)`, answer: dec(pT, 1), accept: [`${pT}/10`], hint: `The past does not change $p$.` },
      { instruction: `On average, how many parts until the first defect? $E[X] = 1/p$. (Fraction or decimal.)`, answer: ev, accept: [], hint: `$1/${dec(pT, 1)}$.` },
    ],
    finalAnswer: { value: ev, unit: "parts" },
    solutionNarrative: `$P(X > ${k}) = (${dec(qT, 1)})^{${k}} = ${dec(qPow, k)}$; by memorylessness the next part is defective with probability exactly ${dec(pT, 1)}; and the mean wait is $1/p = ${ev}$ parts.`,
  };
};

// ===========================================================================
// TOPIC 2: advanced-statistics.poisson-exponential
//   concepts: poisson-setting-and-mean, poisson-probabilities,
//             exponential-waiting, poisson-approximation-and-applications
// ===========================================================================

// --- poisson-setting-and-mean ---
fill["as1-poisson-setting-1"] = (rng, idx) => {
  const lam = rng.int(2, 9);
  const scen = rng.pick([
    { desc: "A website logs errors", unit: "errors" },
    { desc: "A cafe serves walk-in customers", unit: "customers" },
    { desc: "A toll booth passes cars", unit: "cars" },
  ]);
  return {
    id: `gen.as1-poisson-setting-1.${idx}`, generated: true, concepts: ["poisson-setting-and-mean"], difficulty: 1, context: "applied",
    prompt: `${scen.desc} at a steady average of ${lam} per hour, one at a time and independently. Let $X$ be the count in one hour.`,
    steps: [
      { instruction: `What is the mean of $X$?`, answer: `${lam}`, accept: [], hint: `$\\lambda$ is the average count for the window.` },
      { instruction: `What is the variance of $X$?`, answer: `${lam}`, accept: [], hint: `For a Poisson, variance $= \\lambda$.` },
      { instruction: `For a Poisson distribution the mean and variance are ___. Type 'equal' or 'different'.`, answer: "equal", accept: [], hint: `Both are $\\lambda$.` },
    ],
    finalAnswer: { value: `${lam}`, unit: scen.unit },
    solutionNarrative: `$X$ is Poisson with $\\lambda = ${lam}$: mean $= ${lam}$ and variance $= ${lam}$, the Poisson's signature equality.`,
  };
};
fill["as1-poisson-setting-2"] = (rng, idx) => {
  const c = rng.pick([
    { rate: 6, t: 20, lam: 2 },
    { rate: 4, t: 30, lam: 2 },
    { rate: 12, t: 15, lam: 3 },
    { rate: 8, t: 45, lam: 6 },
    { rate: 2, t: 90, lam: 3 },
    { rate: 6, t: 40, lam: 4 },
  ]);
  const f = frac(c.t, 60);
  return {
    id: `gen.as1-poisson-setting-2.${idx}`, generated: true, concepts: ["poisson-setting-and-mean"], difficulty: 2, context: "applied",
    prompt: `Calls arrive at a switchboard at ${c.rate} per hour. Find $\\lambda$ for a ${c.t}-minute window.`,
    steps: [
      { instruction: `What fraction of an hour is ${c.t} minutes? (Give a fraction.)`, answer: f, accept: [`${c.t}/60`], hint: `$${c.t}/60$, reduced.` },
      { instruction: `Rescale: $\\lambda = ${c.rate} \\times ${f}$.`, answer: `${c.lam}`, accept: [], hint: `Rates scale linearly with the window.` },
      { instruction: `What is the variance of the ${c.t}-minute count?`, answer: `${c.lam}`, accept: [], hint: `Variance equals the rescaled $\\lambda$.` },
    ],
    finalAnswer: { value: `${c.lam}`, unit: "calls" },
    solutionNarrative: `${c.t} minutes is $${f}$ of an hour, so $\\lambda = ${c.rate} \\times ${f} = ${c.lam}$, and the variance of the count is also ${c.lam}.`,
  };
};
fill["as1-poisson-setting-3"] = (rng, idx) => {
  const c = rng.pick([
    { l1: 3, l2: 5, t: 15, lam: 2 },
    { l1: 2, l2: 4, t: 30, lam: 3 },
    { l1: 4, l2: 8, t: 15, lam: 3 },
    { l1: 3, l2: 6, t: 20, lam: 3 },
    { l1: 2, l2: 6, t: 15, lam: 2 },
    { l1: 4, l2: 5, t: 20, lam: 3 },
  ]);
  const sum = c.l1 + c.l2;
  return {
    id: `gen.as1-poisson-setting-3.${idx}`, generated: true, concepts: ["poisson-setting-and-mean"], difficulty: 3, context: "applied",
    prompt: `A support inbox receives emails at ${c.l1} per hour and chat requests at ${c.l2} per hour, independently. Consider the combined stream of messages.`,
    steps: [
      { instruction: `What is the combined rate per hour? (Independent Poisson streams add.)`, answer: `${sum}`, accept: [], hint: `$${c.l1} + ${c.l2}$.` },
      { instruction: `Are the counts in two DISJOINT time intervals independent for a Poisson stream? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Non-overlapping windows share no events.` },
      { instruction: `Find $\\lambda$ for a ${c.t}-minute window of the combined stream.`, answer: `${c.lam}`, accept: [], hint: `$${sum} \\times \\tfrac{${c.t}}{60}$.` },
    ],
    finalAnswer: { value: `${c.lam}`, unit: "messages" },
    solutionNarrative: `Independent Poisson streams merge at rate $${c.l1} + ${c.l2} = ${sum}$ per hour; a ${c.t}-minute window has $\\lambda = ${sum} \\times ${frac(c.t, 60)} = ${c.lam}$.`,
  };
};

// --- poisson-probabilities ---
fill["as1-poisson-prob-1"] = (rng, idx) => {
  const lam = rng.pick([1, 2, 3]);
  const E = EXP[`${lam}`];
  return {
    id: `gen.as1-poisson-prob-1.${idx}`, generated: true, concepts: ["poisson-probabilities"], difficulty: 1, context: "applied",
    prompt: `Tickets arrive at $\\lambda = ${lam}$ per hour (use $e^{-${lam}} \\approx ${expStr(lam)}$). Find $P(X = 0)$ and $P(X = 1)$ for one hour.`,
    steps: [
      { instruction: `Compute $P(X = 0) = e^{-\\lambda}$. (Use the given value.)`, answer: expStr(lam), accept: [], hint: `Read $e^{-${lam}}$ from the prompt.` },
      { instruction: `Compute $P(X = 1) = \\lambda e^{-\\lambda} = ${lam} \\times ${expStr(lam)}$. Give the exact value.`, answer: dec(lam * E, 4), accept: [], hint: `Multiply the given value by ${lam}.` },
    ],
    finalAnswer: { value: dec(lam * E, 4), unit: "" },
    solutionNarrative: `$P(X = 0) = e^{-${lam}} \\approx ${expStr(lam)}$ and $P(X = 1) = ${lam}e^{-${lam}} \\approx ${dec(lam * E, 4)}$.`,
  };
};
fill["as1-poisson-prob-2"] = (rng, idx) => {
  const [lam, k] = rng.pick([[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3]]);
  const E = EXP[`${lam}`];
  const pow = Math.pow(lam, k);
  const f = fact(k);
  const prob = (E * pow) / f; // integer in 10^-4 units for these pools
  return {
    id: `gen.as1-poisson-prob-2.${idx}`, generated: true, concepts: ["poisson-probabilities"], difficulty: 2, context: "applied",
    prompt: `A help desk receives $\\lambda = ${lam}$ tickets per hour (use $e^{-${lam}} \\approx ${expStr(lam)}$). Find the probability of exactly ${k} tickets in the next hour, rounded to 4 decimal places.`,
    steps: [
      { instruction: `Compute $\\lambda^{${k}} = ${lam}^{${k}}$.`, answer: `${pow}`, accept: [], hint: `Multiply ${lam} by itself ${k} times.` },
      { instruction: `Compute $${k}!$.`, answer: `${f}`, accept: [], hint: `${k === 2 ? "$2 \\times 1$" : "$3 \\times 2 \\times 1$"}.` },
      { instruction: `Assemble and round to 4 decimal places: $P(X = ${k}) = ${expStr(lam)} \\times \\dfrac{${pow}}{${f}}$.`, answer: dec(prob, 4), accept: [], hint: `Multiply the given $e^{-${lam}}$ by $${pow}/${f}$.` },
    ],
    finalAnswer: { value: dec(prob, 4), unit: "" },
    solutionNarrative: `$P(X = ${k}) = e^{-${lam}} \\cdot \\tfrac{${lam}^{${k}}}{${k}!} = ${expStr(lam)} \\times \\tfrac{${pow}}{${f}} = ${dec(prob, 4)}$.`,
  };
};
fill["as1-poisson-prob-3"] = (rng, idx) => {
  const lam = rng.pick([1, 2, 3, 4]);
  const E = EXP[`${lam}`];
  const p1 = lam * E;          // P(X=1) in 10^-4 units, exact
  const sum = E + p1;          // P(X<=1)
  return {
    id: `gen.as1-poisson-prob-3.${idx}`, generated: true, concepts: ["poisson-probabilities"], difficulty: 3, context: "applied",
    prompt: `Requests hit a server at $\\lambda = ${lam}$ per second (use $e^{-${lam}} \\approx ${expStr(lam)}$). Find $P(X \\le 1)$ and $P(X \\ge 2)$ for a one-second window.`,
    steps: [
      { instruction: `Compute $P(X = 0)$. (Use the given value.)`, answer: expStr(lam), accept: [], hint: `$e^{-${lam}}$.` },
      { instruction: `Compute $P(X = 1) = ${lam} \\times ${expStr(lam)}$.`, answer: dec(p1, 4), accept: [], hint: `$\\lambda e^{-\\lambda}$.` },
      { instruction: `Add your two values: $P(X \\le 1)$.`, answer: dec(sum, 4), accept: [], hint: `$${expStr(lam)} + ${dec(p1, 4)}$.` },
      { instruction: `Complement: $P(X \\ge 2) = 1 - ${dec(sum, 4)}$.`, answer: dec(10000 - sum, 4), accept: [], hint: `Everything else.` },
    ],
    finalAnswer: { value: dec(10000 - sum, 4), unit: "" },
    solutionNarrative: `$P(X \\le 1) = e^{-${lam}}(1 + ${lam}) = ${dec(sum, 4)}$, so $P(X \\ge 2) = ${dec(10000 - sum, 4)}$.`,
  };
};

// --- exponential-waiting ---
fill["as1-exponential-1"] = (rng, idx) => {
  const c = rng.pick([
    { lam: "0.5", t: 2, lt: 1 },
    { lam: "0.5", t: 4, lt: 2 },
    { lam: "0.5", t: 6, lt: 3 },
    { lam: "1", t: 3, lt: 3 },
    { lam: "1", t: 2, lt: 2 },
    { lam: "2", t: 1, lt: 2 },
    { lam: "2", t: 2, lt: 4 },
    { lam: "0.25", t: 8, lt: 2 },
  ]);
  return {
    id: `gen.as1-exponential-1.${idx}`, generated: true, concepts: ["exponential-waiting"], difficulty: 1, context: "applied",
    prompt: `Customers arrive at $\\lambda = ${c.lam}$ per minute (use $e^{-${c.lt}} \\approx ${expStr(c.lt)}$). Find the probability the NEXT customer takes more than ${c.t} minutes: $P(T > t) = e^{-\\lambda t}$.`,
    steps: [
      { instruction: `Compute the exponent product $\\lambda t = ${c.lam} \\times ${c.t}$.`, answer: `${c.lt}`, accept: [], hint: `Rate times time.` },
      { instruction: `So $P(T > ${c.t}) = e^{-${c.lt}} \\approx$ ? (Use the given value.)`, answer: expStr(c.lt), accept: [], hint: `Read it from the prompt.` },
    ],
    finalAnswer: { value: expStr(c.lt), unit: "" },
    solutionNarrative: `$P(T > ${c.t}) = e^{-${c.lam} \\times ${c.t}} = e^{-${c.lt}} \\approx ${expStr(c.lt)}$.`,
  };
};
fill["as1-exponential-2"] = (rng, idx) => {
  const c = rng.pick([
    { lam: "0.5", mean: "2", t: 4, lt: 2 },
    { lam: "0.5", mean: "2", t: 2, lt: 1 },
    { lam: "0.2", mean: "5", t: 5, lt: 1 },
    { lam: "0.2", mean: "5", t: 10, lt: 2 },
    { lam: "0.25", mean: "4", t: 8, lt: 2 },
    { lam: "0.25", mean: "4", t: 4, lt: 1 },
    { lam: "2", mean: "0.5", t: 1, lt: 2 },
    { lam: "2", mean: "0.5", t: 2, lt: 4 },
  ]);
  const E = EXP[`${c.lt}`];
  return {
    id: `gen.as1-exponential-2.${idx}`, generated: true, concepts: ["exponential-waiting"], difficulty: 2, context: "applied",
    prompt: `Buses pass a stop at $\\lambda = ${c.lam}$ per minute (use $e^{-${c.lt}} \\approx ${expStr(c.lt)}$). Find the mean wait, then $P(T > ${c.t})$ and $P(T \\le ${c.t})$.`,
    steps: [
      { instruction: `Mean wait: $E[T] = \\dfrac{1}{\\lambda} = \\dfrac{1}{${c.lam}}$.`, answer: c.mean, accept: [], hint: `One over the rate.` },
      { instruction: `Exponent: $\\lambda t = ${c.lam} \\times ${c.t}$.`, answer: `${c.lt}`, accept: [], hint: `Rate times time.` },
      { instruction: `$P(T > ${c.t}) = e^{-${c.lt}} \\approx$ ? (Use the given value.)`, answer: expStr(c.lt), accept: [], hint: `Given in the prompt.` },
      { instruction: `$P(T \\le ${c.t}) = 1 - ${expStr(c.lt)}$.`, answer: dec(10000 - E, 4), accept: [], hint: `Complement.` },
    ],
    finalAnswer: { value: dec(10000 - E, 4), unit: "" },
    solutionNarrative: `Mean wait $= 1/${c.lam} = ${c.mean}$ minutes; $P(T > ${c.t}) = e^{-${c.lt}} \\approx ${expStr(c.lt)}$, so $P(T \\le ${c.t}) = ${dec(10000 - E, 4)}$.`,
  };
};
fill["as1-exponential-3"] = (rng, idx) => {
  const c = rng.pick([
    { lam: "0.5", s: 6, t: 2, lt: 1 },
    { lam: "0.5", s: 4, t: 4, lt: 2 },
    { lam: "0.5", s: 10, t: 3, lt: 1.5 },
    { lam: "1", s: 2, t: 3, lt: 3 },
    { lam: "1", s: 5, t: 1, lt: 1 },
    { lam: "2", s: 3, t: 1, lt: 2 },
  ]);
  return {
    id: `gen.as1-exponential-3.${idx}`, generated: true, concepts: ["exponential-waiting"], difficulty: 3, context: "applied",
    prompt: `Taxis pass at $\\lambda = ${c.lam}$ per minute (use $e^{-${c.lt}} \\approx ${expStr(c.lt)}$). You have ALREADY waited ${c.s} minutes with no taxi. Find the probability you wait more than ${c.t} ADDITIONAL minutes.`,
    steps: [
      { instruction: `Does the ${c.s} minutes already waited change the distribution of the remaining wait? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `The exponential is memoryless.` },
      { instruction: `Exponent for the additional wait: $\\lambda t = ${c.lam} \\times ${c.t}$.`, answer: `${c.lt}`, accept: [], hint: `Only the additional time matters.` },
      { instruction: `$P(T > ${c.t}) = e^{-${c.lt}} \\approx$ ? (Use the given value.)`, answer: expStr(c.lt), accept: [], hint: `Given in the prompt.` },
    ],
    finalAnswer: { value: expStr(c.lt), unit: "" },
    solutionNarrative: `By memorylessness, $P(T > ${c.s} + ${c.t} \\mid T > ${c.s}) = P(T > ${c.t}) = e^{-${c.lt}} \\approx ${expStr(c.lt)}$.`,
  };
};

// --- poisson-approximation-and-applications ---
fill["as1-poisson-approx-1"] = (rng, idx) => {
  const n = rng.pick([100, 200, 500, 1000]);
  const lam = rng.pick([1, 2, 3, 4, 5]);
  const p = `${lam / n}`; // exact decimal string (n is a power-of-ten multiple)
  return {
    id: `gen.as1-poisson-approx-1.${idx}`, generated: true, concepts: ["poisson-approximation-and-applications"], difficulty: 1, context: "applied",
    prompt: `A courier handles $n = ${n}$ packages a day; each is independently lost with probability $p = ${p}$. Set up the Poisson approximation for the number lost.`,
    steps: [
      { instruction: `Compute $\\lambda = np = ${n} \\times ${p}$.`, answer: `${lam}`, accept: [], hint: `Multiply.` },
      { instruction: `The Poisson approximation works when $n$ is large and $p$ is ___. Type 'small' or 'large'.`, answer: "small", accept: [], hint: `Rare events, many chances.` },
    ],
    finalAnswer: { value: `${lam}`, unit: "" },
    solutionNarrative: `With $n = ${n}$ large and $p = ${p}$ small, the count is approximately Poisson with $\\lambda = np = ${lam}$.`,
  };
};
fill["as1-poisson-approx-2"] = (rng, idx) => {
  const lam = rng.pick([1, 2, 3]);
  const n = rng.pick([100, 200, 500]);
  const p = `${lam / n}`;
  const E = EXP[`${lam}`];
  return {
    id: `gen.as1-poisson-approx-2.${idx}`, generated: true, concepts: ["poisson-approximation-and-applications"], difficulty: 2, context: "applied",
    prompt: `A batch has $n = ${n}$ doses; each independently fails a purity check with probability $p = ${p}$ (use $e^{-${lam}} \\approx ${expStr(lam)}$). Approximate the probability that NO dose fails, and that at least one fails.`,
    steps: [
      { instruction: `Compute $\\lambda = np = ${n} \\times ${p}$.`, answer: `${lam}`, accept: [], hint: `$np$.` },
      { instruction: `$P(X = 0) \\approx e^{-\\lambda} =$ ? (Use the given value.)`, answer: expStr(lam), accept: [], hint: `The zero term of the Poisson.` },
      { instruction: `$P(X \\ge 1) = 1 - ${expStr(lam)}$.`, answer: dec(10000 - E, 4), accept: [], hint: `Complement of none.` },
    ],
    finalAnswer: { value: dec(10000 - E, 4), unit: "" },
    solutionNarrative: `$\\lambda = ${lam}$, so $P(X = 0) \\approx e^{-${lam}} = ${expStr(lam)}$ and $P(X \\ge 1) \\approx ${dec(10000 - E, 4)}$.`,
  };
};
fill["as1-poisson-approx-3"] = (rng, idx) => {
  const lam = rng.pick([1, 2, 3, 4]);
  const n = rng.pick([500, 1000]);
  const p = `${lam / n}`;
  const E = EXP[`${lam}`];
  const half = `${(lam * lam) / 2}`;                 // lambda^2 / 2 (exact: .5, 2, 4.5, 8)
  const prob = rnd((E / 10000) * ((lam * lam) / 2), 4);
  return {
    id: `gen.as1-poisson-approx-3.${idx}`, generated: true, concepts: ["poisson-approximation-and-applications"], difficulty: 3, context: "applied",
    prompt: `A data center runs $n = ${n}$ drives; each independently fails in a given month with probability $p = ${p}$ (use $e^{-${lam}} \\approx ${expStr(lam)}$). Approximate the probability of exactly 2 failures this month, rounded to 4 decimal places.`,
    steps: [
      { instruction: `Compute $\\lambda = np = ${n} \\times ${p}$.`, answer: `${lam}`, accept: [], hint: `$np$.` },
      { instruction: `Compute $\\dfrac{\\lambda^2}{2!} = \\dfrac{${lam * lam}}{2}$. (Give a decimal or fraction.)`, answer: half, accept: [`${lam * lam}/2`], hint: `Square, then halve.` },
      { instruction: `Assemble and round to 4 decimal places: $P(X = 2) \\approx ${expStr(lam)} \\times ${half}$.`, answer: prob, accept: [], hint: `Multiply the given $e^{-${lam}}$ by ${half}.` },
    ],
    finalAnswer: { value: prob, unit: "" },
    solutionNarrative: `$\\lambda = ${lam}$; $P(X = 2) \\approx e^{-${lam}} \\cdot \\tfrac{${lam}^2}{2!} = ${expStr(lam)} \\times ${half} \\approx ${prob}$.`,
  };
};

// ===========================================================================
// TOPIC 3: advanced-statistics.continuous-random-variables
//   concepts: density-basics, probabilities-from-densities,
//             uniform-distribution, expected-value-continuous
// ===========================================================================

// --- density-basics ---
fill["as1-density-basics-1"] = (rng, idx) => {
  const c = rng.pick([1, 2, 3, 4]);
  const area = frac(c * c, 2);
  const k = frac(2, c * c);
  return {
    id: `gen.as1-density-basics-1.${idx}`, generated: true, concepts: ["density-basics"], difficulty: 1, context: "abstract",
    prompt: `Find the constant $k$ so that $f(x) = kx$ on $[0, ${c}]$ (zero elsewhere) is a valid probability density.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x\\,dx$. (Give a fraction or number.)`, answer: area, accept: [`${c * c}/2`], hint: `$\\frac{x^2}{2}$ evaluated from 0 to ${c}.` },
      { instruction: `Solve $k \\cdot ${area} = 1$ for $k$. (Give a fraction or decimal.)`, answer: k, accept: [], hint: `$k$ is the reciprocal of the integral.` },
    ],
    finalAnswer: { value: k, unit: "" },
    solutionNarrative: `$\\int_0^{${c}} kx\\,dx = ${area}\\,k$, and setting the area to 1 gives $k = ${k}$.`,
  };
};
fill["as1-density-basics-2"] = (rng, idx) => {
  const c = rng.pick([1, 2, 3]);
  const area = frac(c * c * c, 3);
  const k = frac(3, c * c * c);
  return {
    id: `gen.as1-density-basics-2.${idx}`, generated: true, concepts: ["density-basics"], difficulty: 2, context: "abstract",
    prompt: `Find the constant $k$ so that $f(x) = kx^2$ on $[0, ${c}]$ (zero elsewhere) is a valid probability density.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x^2\\,dx$. (Give a fraction or number.)`, answer: area, accept: [`${c * c * c}/3`], hint: `$\\frac{x^3}{3}$ from 0 to ${c}.` },
      { instruction: `Solve $k \\cdot ${area} = 1$ for $k$. (Give a fraction or decimal.)`, answer: k, accept: [], hint: `The total area must equal 1.` },
      { instruction: `Besides total area 1, a density must never be ___. Type 'negative' or 'positive'.`, answer: "negative", accept: [], hint: `Axiom 1: $f(x) \\ge 0$.` },
    ],
    finalAnswer: { value: k, unit: "" },
    solutionNarrative: `$\\int_0^{${c}} kx^2\\,dx = ${area}\\,k = 1$ gives $k = ${k}$, and $${k}x^2 \\ge 0$ on the interval, so both axioms hold.`,
  };
};
fill["as1-density-basics-3"] = (rng, idx) => {
  const [m, c] = rng.pick([[1, 2], [1, 3], [2, 2], [2, 3], [3, 1], [3, 2]]);
  const cp = Math.pow(c, m + 1);
  const area = frac(cp, m + 1);
  const k = frac(m + 1, cp);
  const fDesc = m === 1 ? "kx" : `kx^${m}`;
  return {
    id: `gen.as1-density-basics-3.${idx}`, generated: true, concepts: ["density-basics"], difficulty: 3, context: "abstract",
    prompt: `Find the constant $k$ so that $f(x) = ${fDesc}$ on $[0, ${c}]$ (zero elsewhere) is a valid probability density.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x^{${m}}\\,dx$. (Give a fraction or number.)`, answer: area, accept: [`${cp}/${m + 1}`], hint: `$\\frac{x^{${m + 1}}}{${m + 1}}$ from 0 to ${c}.` },
      { instruction: `What must the TOTAL area under a density equal? (Give a number.)`, answer: "1", accept: [], hint: `Axiom 2.` },
      { instruction: `Solve $k \\cdot ${area} = 1$. (Give a fraction or decimal.)`, answer: k, accept: [], hint: `Reciprocal of the integral.` },
    ],
    finalAnswer: { value: k, unit: "" },
    solutionNarrative: `$\\int_0^{${c}} kx^{${m}}\\,dx = ${area}\\,k = 1$, so $k = ${k}$.`,
  };
};

// --- probabilities-from-densities ---
fill["as1-density-prob-1"] = (rng, idx) => {
  const c = rng.pick([2, 3]);
  const pairs = c === 2 ? [[0, 1], [1, 2]] : [[0, 1], [1, 2], [2, 3], [0, 2], [1, 3]];
  const [a, b] = rng.pick(pairs);
  const den = c * c;
  const fDesc = c === 2 ? "\\dfrac{x}{2}" : "\\dfrac{2x}{9}";
  const cdfDesc = c === 2 ? "\\dfrac{x^2}{4}" : "\\dfrac{x^2}{9}";
  return {
    id: `gen.as1-density-prob-1.${idx}`, generated: true, concepts: ["probabilities-from-densities"], difficulty: 1, context: "abstract",
    prompt: `Let $f(x) = ${fDesc}$ on $[0, ${c}]$, with CDF $F(x) = ${cdfDesc}$. Find $P(${a} < X < ${b}) = F(${b}) - F(${a})$.`,
    steps: [
      { instruction: `Compute $F(${b}) = \\dfrac{${b}^2}{${den}}$. (Give a fraction or number.)`, answer: frac(b * b, den), accept: [`${b * b}/${den}`], hint: `Square ${b}, then divide by ${den}.` },
      { instruction: `Compute $F(${a}) = \\dfrac{${a}^2}{${den}}$. (Give a fraction or number.)`, answer: frac(a * a, den), accept: a === 0 ? [] : [`${a * a}/${den}`], hint: `Square ${a}, then divide by ${den}.` },
      { instruction: `Subtract: $P(${a} < X < ${b})$. (Give a fraction.)`, answer: frac(b * b - a * a, den), accept: [`${b * b - a * a}/${den}`], hint: `$F(${b}) - F(${a})$.` },
    ],
    finalAnswer: { value: frac(b * b - a * a, den), unit: "" },
    solutionNarrative: `$P(${a} < X < ${b}) = F(${b}) - F(${a}) = ${frac(b * b, den)} - ${frac(a * a, den)} = ${frac(b * b - a * a, den)}$.`,
  };
};
fill["as1-density-prob-2"] = (rng, idx) => {
  const c = rng.pick([2, 3]);
  const pairs = c === 2 ? [[0, 1], [1, 2]] : [[0, 1], [1, 2], [2, 3], [0, 2]];
  const [a, b] = rng.pick(pairs);
  const den = c * c * c;
  const fDesc = c === 2 ? "\\dfrac{3x^2}{8}" : "\\dfrac{x^2}{9}";
  const cdfDesc = c === 2 ? "\\dfrac{x^3}{8}" : "\\dfrac{x^3}{27}";
  return {
    id: `gen.as1-density-prob-2.${idx}`, generated: true, concepts: ["probabilities-from-densities"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = ${fDesc}$ on $[0, ${c}]$, with CDF $F(x) = ${cdfDesc}$. Find $P(${a} < X < ${b})$.`,
    steps: [
      { instruction: `Compute $F(${b}) = \\dfrac{${b}^3}{${den}}$. (Give a fraction or number.)`, answer: frac(b * b * b, den), accept: [`${b * b * b}/${den}`], hint: `Cube ${b}.` },
      { instruction: `Compute $F(${a}) = \\dfrac{${a}^3}{${den}}$. (Give a fraction or number.)`, answer: frac(a * a * a, den), accept: a === 0 ? [] : [`${a * a * a}/${den}`], hint: `Cube ${a}.` },
      { instruction: `Subtract: $P(${a} < X < ${b})$. (Give a fraction.)`, answer: frac(b * b * b - a * a * a, den), accept: [`${b * b * b - a * a * a}/${den}`], hint: `$F(${b}) - F(${a})$.` },
    ],
    finalAnswer: { value: frac(b * b * b - a * a * a, den), unit: "" },
    solutionNarrative: `$P(${a} < X < ${b}) = F(${b}) - F(${a}) = ${frac(b * b * b, den)} - ${frac(a * a * a, den)} = ${frac(b * b * b - a * a * a, den)}$.`,
  };
};
fill["as1-density-prob-3"] = (rng, idx) => {
  const [m, c] = rng.pick([[1, 2], [1, 3], [2, 2], [2, 3]]);
  const a = rng.int(1, c - 1);
  const den = Math.pow(c, m + 1);
  const aPow = Math.pow(a, m + 1);
  const cdfDesc = `\\dfrac{x^{${m + 1}}}{${den}}`;
  return {
    id: `gen.as1-density-prob-3.${idx}`, generated: true, concepts: ["probabilities-from-densities"], difficulty: 3, context: "abstract",
    prompt: `A continuous variable on $[0, ${c}]$ has CDF $F(x) = ${cdfDesc}$. Find $P(X > ${a})$ and $P(X = ${a})$.`,
    steps: [
      { instruction: `Compute $F(${a}) = \\dfrac{${a}^{${m + 1}}}{${den}}$. (Give a fraction.)`, answer: frac(aPow, den), accept: [`${aPow}/${den}`], hint: `Raise ${a} to the ${m + 1}, divide by ${den}.` },
      { instruction: `Complement: $P(X > ${a}) = 1 - F(${a})$. (Give a fraction.)`, answer: frac(den - aPow, den), accept: [`${den - aPow}/${den}`], hint: `$1 - ${frac(aPow, den)}$.` },
      { instruction: `What is $P(X = ${a})$ exactly, for this continuous variable? (Give a number.)`, answer: "0", accept: [], hint: `A single point has zero area.` },
    ],
    finalAnswer: { value: frac(den - aPow, den), unit: "" },
    solutionNarrative: `$P(X > ${a}) = 1 - F(${a}) = ${frac(den - aPow, den)}$, while $P(X = ${a}) = 0$: single points carry no area.`,
  };
};

// --- uniform-distribution ---
fill["as1-uniform-1"] = (rng, idx) => {
  const a = rng.pick([0, 2, 5]);
  const w = rng.pick([4, 5, 8, 10]);
  const b = a + w;
  const lo = a + 1;
  const len = rng.int(1, w - 2);
  const hi = lo + len;
  const mean = `${(a + b) / 2}`;
  return {
    id: `gen.as1-uniform-1.${idx}`, generated: true, concepts: ["uniform-distribution"], difficulty: 1, context: "applied",
    prompt: `A random number generator outputs values uniformly on $[${a}, ${b}]$. Find the density height, $P(${lo} < X < ${hi})$, and the mean.`,
    steps: [
      { instruction: `Density height: $\\dfrac{1}{b - a} = \\dfrac{1}{${w}}$. (Give a fraction or decimal.)`, answer: frac(1, w), accept: [`${1 / w}`], hint: `One over the interval length.` },
      { instruction: `Compute $P(${lo} < X < ${hi}) = \\dfrac{${hi} - ${lo}}{${w}}$. (Give a fraction.)`, answer: frac(len, w), accept: [`${len}/${w}`], hint: `Sub-interval length over total length.` },
      { instruction: `Mean: $\\dfrac{${a} + ${b}}{2}$.`, answer: mean, accept: [], hint: `The midpoint.` },
    ],
    finalAnswer: { value: frac(len, w), unit: "" },
    solutionNarrative: `Height $${frac(1, w)}$, $P(${lo} < X < ${hi}) = ${frac(len, w)}$, and the mean is the midpoint ${mean}.`,
  };
};
fill["as1-uniform-2"] = (rng, idx) => {
  const w = rng.pick([2, 4, 6, 12]);
  const a = rng.pick([0, 1, 3, 5]);
  const b = a + w;
  const mean = `${(a + b) / 2}`;
  const variance = frac(w * w, 12);
  return {
    id: `gen.as1-uniform-2.${idx}`, generated: true, concepts: ["uniform-distribution"], difficulty: 2, context: "abstract",
    prompt: `Let $X$ be uniform on $[${a}, ${b}]$. Find its mean and variance, using $\\mathrm{Var}(X) = \\dfrac{(b-a)^2}{12}$.`,
    steps: [
      { instruction: `Mean: $\\dfrac{${a} + ${b}}{2}$.`, answer: mean, accept: [], hint: `Midpoint of the interval.` },
      { instruction: `Compute $(b - a)^2 = (${b} - ${a})^2$.`, answer: `${w * w}`, accept: [], hint: `$${w}^2$.` },
      { instruction: `Variance: $\\dfrac{${w * w}}{12}$. (Give a fraction or number.)`, answer: variance, accept: [`${w * w}/12`], hint: `Divide by 12, then reduce.` },
    ],
    finalAnswer: { value: variance, unit: "" },
    solutionNarrative: `Mean $= ${mean}$ (the midpoint) and $\\mathrm{Var}(X) = \\tfrac{${w * w}}{12} = ${variance}$.`,
  };
};
fill["as1-uniform-3"] = (rng, idx) => {
  const T = rng.pick([10, 12, 15, 20]);
  const w = rng.int(1, T - 1);
  const mean = `${T / 2}`;
  return {
    id: `gen.as1-uniform-3.${idx}`, generated: true, concepts: ["uniform-distribution"], difficulty: 3, context: "applied",
    prompt: `A bus arrives at a uniformly random moment in the next ${T} minutes, so your wait $W$ is uniform on $[0, ${T}]$.`,
    steps: [
      { instruction: `Compute $P(W \\le ${w}) = \\dfrac{${w}}{${T}}$. (Give a fraction.)`, answer: frac(w, T), accept: [`${w}/${T}`], hint: `Length fraction of the window.` },
      { instruction: `Compute $P(W > ${w}) = \\dfrac{${T} - ${w}}{${T}}$. (Give a fraction.)`, answer: frac(T - w, T), accept: [`${T - w}/${T}`], hint: `The remaining ${T - w} of ${T} minutes.` },
      { instruction: `Mean wait: $\\dfrac{0 + ${T}}{2}$.`, answer: mean, accept: [], hint: `Midpoint.` },
    ],
    finalAnswer: { value: mean, unit: "minutes" },
    solutionNarrative: `Uniform waits are pure geometry: $P(W \\le ${w}) = ${frac(w, T)}$, $P(W > ${w}) = ${frac(T - w, T)}$, and the mean wait is ${mean} minutes.`,
  };
};

// --- expected-value-continuous ---
fill["as1-ev-continuous-1"] = (rng, idx) => {
  const c = rng.pick([1, 2, 3]);
  const fDesc = c === 1 ? "2x" : c === 2 ? "\\dfrac{x}{2}" : "\\dfrac{2x}{9}";
  const kDesc = c === 1 ? "2" : c === 2 ? "\\dfrac{1}{2}" : "\\dfrac{2}{9}";
  const inner = frac(c * c * c, 3);
  const ev = frac(2 * c, 3);
  return {
    id: `gen.as1-ev-continuous-1.${idx}`, generated: true, concepts: ["expected-value-continuous"], difficulty: 1, context: "abstract",
    prompt: `Let $f(x) = ${fDesc}$ on $[0, ${c}]$. Find $E[X] = \\displaystyle\\int_0^{${c}} x \\cdot ${fDesc}\\,dx$.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x^2\\,dx$. (Give a fraction or number.)`, answer: inner, accept: [`${c * c * c}/3`], hint: `$\\frac{x^3}{3}$ from 0 to ${c}.` },
      { instruction: `Multiply by $${kDesc}$: $E[X]$. (Give a fraction.)`, answer: ev, accept: [`${2 * c}/3`], hint: `The coefficient of $x$ in the density scales the integral.` },
    ],
    finalAnswer: { value: ev, unit: "" },
    solutionNarrative: `$E[X] = ${kDesc} \\int_0^{${c}} x^2\\,dx = ${kDesc} \\cdot ${inner} = ${ev}$ — past the midpoint $${frac(c, 2)}$ because the density rises.`,
  };
};
fill["as1-ev-continuous-2"] = (rng, idx) => {
  const c = rng.pick([1, 2, 3, 4]);
  const den = c * c * c;
  const fDesc = c === 1 ? "3x^2" : `\\dfrac{3x^2}{${den}}`;
  const kDesc = c === 1 ? "3" : `\\dfrac{3}{${den}}`;
  const inner = frac(Math.pow(c, 4), 4);
  const ev = frac(3 * c, 4);
  return {
    id: `gen.as1-ev-continuous-2.${idx}`, generated: true, concepts: ["expected-value-continuous"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = ${fDesc}$ on $[0, ${c}]$. Find $E[X] = \\displaystyle\\int_0^{${c}} x \\cdot ${fDesc}\\,dx$.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x^3\\,dx$. (Give a fraction or number.)`, answer: inner, accept: [`${Math.pow(c, 4)}/4`], hint: `$\\frac{x^4}{4}$ from 0 to ${c}.` },
      { instruction: `Multiply by $${kDesc}$: $E[X]$. (Give a fraction.)`, answer: ev, accept: [`${3 * c}/4`], hint: `Scale by the density's constant.` },
    ],
    finalAnswer: { value: ev, unit: "" },
    solutionNarrative: `$E[X] = ${kDesc} \\int_0^{${c}} x^3\\,dx = ${kDesc} \\cdot ${inner} = ${ev}$.`,
  };
};
fill["as1-ev-continuous-3"] = (rng, idx) => {
  const [m, c] = rng.pick([[1, 2], [1, 4], [2, 2], [2, 4], [3, 2], [3, 4]]);
  const den = Math.pow(c, m + 1);
  const g = gcd(m + 1, den);
  const kDesc = den / g === 1 ? `${(m + 1) / g}` : `\\dfrac{${(m + 1) / g}}{${den / g}}`;
  const inner = frac(Math.pow(c, m + 2), m + 2);
  const ev = frac((m + 1) * c, m + 2);
  const mid = `${c / 2}`;
  return {
    id: `gen.as1-ev-continuous-3.${idx}`, generated: true, concepts: ["expected-value-continuous"], difficulty: 3, context: "abstract",
    prompt: `Let $f(x) = ${kDesc}\\,x^{${m}}$ on $[0, ${c}]$. Find $E[X]$ and compare it to the interval midpoint.`,
    steps: [
      { instruction: `Compute $\\displaystyle\\int_0^{${c}} x^{${m + 1}}\\,dx$. (Give a fraction or number.)`, answer: inner, accept: [`${Math.pow(c, m + 2)}/${m + 2}`], hint: `$\\frac{x^{${m + 2}}}{${m + 2}}$ from 0 to ${c}.` },
      { instruction: `Multiply by $${kDesc}$: $E[X]$. (Give a fraction.)`, answer: ev, accept: [`${(m + 1) * c}/${m + 2}`], hint: `Scale by the density's constant.` },
      { instruction: `The interval midpoint is ${mid}. Is $E[X]$ 'greater' or 'less' than the midpoint? Type one.`, answer: "greater", accept: [], hint: `The density piles weight toward ${c}.` },
    ],
    finalAnswer: { value: ev, unit: "" },
    solutionNarrative: `$E[X] = ${kDesc} \\cdot ${inner} = ${ev}$, which exceeds the midpoint ${mid} — a rising density always pulls the mean right of center.`,
  };
};
