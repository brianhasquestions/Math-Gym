// gen-advstat2-fill.js
// Parametric generators for the Advanced Statistics subject, topics
//   advanced-statistics.joint-covariance
//   advanced-statistics.estimators-sampling
//   advanced-statistics.bayesian-inference
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats2-fill.js). Template prefix: as2-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. All probabilities are built
// BACKWARD from integer counts / curated fraction pools, and every answer is
// computed in exact integer (fraction) arithmetic so it always self-checks.

// ---------------------------------------------------------------------------
// shared helpers: exact fraction arithmetic
// ---------------------------------------------------------------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
// Reduced fraction {n, d} with d > 0.
const F = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(Math.abs(n), d) || 1;
  return { n: n / g, d: d / g };
};
const fmul = (a, b) => F(a.n * b.n, a.d * b.d);
const fadd = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const fsub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const fdiv = (a, b) => F(a.n * b.d, a.d * b.n);
const fone = F(1, 1);
// Fraction -> answer string ("3/10", "2", "-1/20").
const fs = (a) => (a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`);
// Exact decimal strings from integer numerators over powers of ten.
const d10 = (v) => `${v / 10}`;
const d1000 = (v) => `${v / 1000}`;
// Perfect-square sample sizes: [sqrt(n), n].
const ROOTS = [[5, 25], [6, 36], [8, 64], [10, 100]];
// Phi values (thousandths) handed to the student in every CLT prompt.
const PHI = { 10: 841, 15: 933, 20: 977 };

// Exact moments of a small joint table: values xv[], yv[], integer counts
// cnt[i][j] (row i = xv[i], col j = yv[j]). Everything returned as fractions.
const covTable = (xv, yv, cnt) => {
  let N = 0, sx = 0, sy = 0, sxy = 0;
  for (let i = 0; i < xv.length; i++) {
    for (let j = 0; j < yv.length; j++) {
      const c = cnt[i][j];
      N += c; sx += c * xv[i]; sy += c * yv[j]; sxy += c * xv[i] * yv[j];
    }
  }
  const EX = F(sx, N), EY = F(sy, N), EXY = F(sxy, N);
  return { N, EX, EY, EXY, cov: fsub(EXY, fmul(EX, EY)) };
};

// Markdown 2x2 count table (rows = X, cols = Y).
const md22 = (xl, yl, c) =>
  `|  | ${yl[0]} | ${yl[1]} |\n|---|---|---|\n| ${xl[0]} | ${c[0][0]} | ${c[0][1]} |\n| ${xl[1]} | ${c[1][0]} | ${c[1][1]} |`;
const md32 = (xl, yl, c) =>
  `|  | ${yl[0]} | ${yl[1]} |\n|---|---|---|\n| ${xl[0]} | ${c[0][0]} | ${c[0][1]} |\n| ${xl[1]} | ${c[1][0]} | ${c[1][1]} |\n| ${xl[2]} | ${c[2][0]} | ${c[2][1]} |`;
const md33 = (xl, yl, c) =>
  `|  | ${yl[0]} | ${yl[1]} | ${yl[2]} |\n|---|---|---|---|\n| ${xl[0]} | ${c[0][0]} | ${c[0][1]} | ${c[0][2]} |\n| ${xl[1]} | ${c[1][0]} | ${c[1][1]} | ${c[1][2]} |\n| ${xl[2]} | ${c[2][0]} | ${c[2][1]} | ${c[2][2]} |`;

export const fill = {};

// ===========================================================================
// TOPIC 1: advanced-statistics.joint-covariance
//   concepts: joint-tables, conditional-from-joint, covariance,
//             correlation-and-independence
// ===========================================================================

const JT_CTX = [
  { thing: "customers", rows: ["No coffee", "Coffee"], cols: ["No tea", "Tea"], rname: "orders coffee", cname: "orders tea" },
  { thing: "households", rows: ["No car", "Car"], cols: ["No bike", "Bike"], rname: "owns a car", cname: "owns a bike" },
  { thing: "students", rows: ["No laptop", "Laptop"], cols: ["No tablet", "Tablet"], rname: "brings a laptop", cname: "brings a tablet" },
  { thing: "subscribers", rows: ["No sports", "Sports"], cols: ["No news", "News"], rname: "watches sports", cname: "watches news" },
];

// --- joint-tables ---
fill["as2-joint-tables-1"] = (rng, idx) => {
  const ctx = rng.pick(JT_CTX);
  const a = rng.int(2, 9), b = rng.int(2, 9), c = rng.int(2, 9), d = rng.int(2, 9);
  const N = a + b + c + d;
  const both = F(d, N), marg = F(c + d, N);
  return {
    id: `gen.as2-joint-tables-1.${idx}`, generated: true, concepts: ["joint-tables"], difficulty: 1, context: "applied",
    prompt: `A survey of ${ctx.thing} produced this joint table of COUNTS:\n\n${md22(ctx.rows, ctx.cols, [[a, b], [c, d]])}\n\nRead joint and marginal probabilities from the table. Give fractions in lowest terms.`,
    steps: [
      { instruction: `How many ${ctx.thing} were surveyed in total? (Give a number.)`, answer: `${N}`, accept: [], hint: `Add all four cells: $${a}+${b}+${c}+${d}$.` },
      { instruction: `What is the probability a random one of them ${ctx.rname} AND ${ctx.cname}? Give a fraction in lowest terms.`, answer: fs(both), accept: [`${d}/${N}`], hint: `The "${ctx.rows[1]}" & "${ctx.cols[1]}" cell over the total.` },
      { instruction: `What is the MARGINAL probability that one ${ctx.rname} (regardless of the other product)? Give a fraction in lowest terms.`, answer: fs(marg), accept: [`${c + d}/${N}`], hint: `Sum the "${ctx.rows[1]}" row: $${c} + ${d}$, then divide by ${N}.` },
    ],
    finalAnswer: { value: fs(marg), unit: "" },
    solutionNarrative: `The table holds ${N} ${ctx.thing}. The joint probability is the single cell $\\frac{${d}}{${N}} = ${fs(both)}$, while the marginal sums the whole row: $\\frac{${c + d}}{${N}} = ${fs(marg)}$. Marginals live in the margins — row and column totals over the grand total.`,
  };
};
fill["as2-joint-tables-2"] = (rng, idx) => {
  const a = rng.int(3, 6), b = rng.int(3, 6), c = rng.int(3, 6);
  const m = 20 - a - b - c; // >= 2 by construction
  const given = F(a + b + c, 20), miss = F(m, 20), marg = F(c + m, 20);
  return {
    id: `gen.as2-joint-tables-2.${idx}`, generated: true, concepts: ["joint-tables"], difficulty: 2, context: "abstract",
    prompt: `Random variables $X$ and $Y$ each take values 0 or 1, with joint PROBABILITIES:\n\n|  | $Y=0$ | $Y=1$ |\n|---|---|---|\n| $X=0$ | $${a}/20$ | $${b}/20$ |\n| $X=1$ | $${c}/20$ | ? |\n\nAll four probabilities must sum to 1. Find the missing cell, then a marginal. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Add the three given probabilities. Give the sum as a fraction in lowest terms.`, answer: fs(given), accept: [`${a + b + c}/20`], hint: `$\\frac{${a}}{20} + \\frac{${b}}{20} + \\frac{${c}}{20}$.` },
      { instruction: `The cells must total 1, so $P(X=1, Y=1) = 1 - ${fs(given)}$. Give it as a fraction in lowest terms.`, answer: fs(miss), accept: [`${m}/20`], hint: `$\\frac{20 - ${a + b + c}}{20}$.` },
      { instruction: `Compute the marginal $P(X=1)$ by summing the $X=1$ row. Give a fraction in lowest terms.`, answer: fs(marg), accept: [`${c + m}/20`], hint: `$\\frac{${c}}{20} + \\frac{${m}}{20}$.` },
    ],
    finalAnswer: { value: fs(marg), unit: "" },
    solutionNarrative: `The three known cells sum to ${fs(given)}, forcing the missing cell to $1 - ${fs(given)} = ${fs(miss)}$. The marginal $P(X=1)$ adds its row: $\\frac{${c}}{20} + \\frac{${m}}{20} = ${fs(marg)}$. A joint table is a complete budget of probability — it must spend exactly 1.`,
  };
};
fill["as2-joint-tables-3"] = (rng, idx) => {
  const c = [0, 1, 2].map(() => [0, 1, 2].map(() => rng.int(1, 4)));
  const N = c.flat().reduce((s, v) => s + v, 0);
  const row2 = c[2][0] + c[2][1] + c[2][2];
  const diag = c[0][0] + c[1][1] + c[2][2];
  const col0 = c[0][0] + c[1][0] + c[2][0];
  const pRow = F(row2, N), pDiag = F(diag, N), pCol = F(col0, N);
  return {
    id: `gen.as2-joint-tables-3.${idx}`, generated: true, concepts: ["joint-tables"], difficulty: 3, context: "applied",
    prompt: `A café logs each customer's drinks ($X$) and snacks ($Y$), both 0, 1, or 2. Counts:\n\n${md33(["$X=0$", "$X=1$", "$X=2$"], ["$Y=0$", "$Y=1$", "$Y=2$"], c)}\n\nCompute probabilities of joint EVENTS (sums of cells). Give fractions in lowest terms.`,
    steps: [
      { instruction: `How many customers in total? (Give a number.)`, answer: `${N}`, accept: [], hint: `Add all nine cells.` },
      { instruction: `Marginal: $P(X = 2)$. Give a fraction in lowest terms.`, answer: fs(pRow), accept: [`${row2}/${N}`], hint: `Sum the $X=2$ row: $${c[2][0]}+${c[2][1]}+${c[2][2]} = ${row2}$.` },
      { instruction: `Event probability: $P(X = Y)$, i.e. the diagonal cells. Give a fraction in lowest terms.`, answer: fs(pDiag), accept: [`${diag}/${N}`], hint: `Add the cells where the row and column values match: $${c[0][0]}+${c[1][1]}+${c[2][2]}$.` },
      { instruction: `Marginal: $P(Y = 0)$. Give a fraction in lowest terms.`, answer: fs(pCol), accept: [`${col0}/${N}`], hint: `Sum the $Y=0$ column: $${c[0][0]}+${c[1][0]}+${c[2][0]}$.` },
    ],
    finalAnswer: { value: fs(pDiag), unit: "" },
    solutionNarrative: `With ${N} customers, $P(X=2) = ${fs(pRow)}$ (row sum), $P(X=Y) = \\frac{${diag}}{${N}} = ${fs(pDiag)}$ (diagonal), and $P(Y=0) = ${fs(pCol)}$ (column sum). Any event is just a set of cells — add them.`,
  };
};

// --- conditional-from-joint ---
fill["as2-cond-joint-1"] = (rng, idx) => {
  const ctx = rng.pick(JT_CTX);
  const a = rng.int(2, 8), b = rng.int(2, 8), c = rng.int(2, 8), d = rng.int(2, 8);
  const colTot = b + d;
  const cond = F(d, colTot);
  return {
    id: `gen.as2-cond-joint-1.${idx}`, generated: true, concepts: ["conditional-from-joint"], difficulty: 1, context: "applied",
    prompt: `A survey of ${ctx.thing} gave these COUNTS:\n\n${md22(ctx.rows, ctx.cols, [[a, b], [c, d]])}\n\nGiven that one of them ${ctx.cname}, what is the probability they also ${ctx.rname}? Conditioning restricts you to ONE column.`,
    steps: [
      { instruction: `How many ${ctx.thing} are in the "${ctx.cols[1]}" column? (Give a number.)`, answer: `${colTot}`, accept: [], hint: `$${b} + ${d}$ — the condition shrinks the world to this column.` },
      { instruction: `Of those, how many also ${ctx.rname}? Then give $P(\\text{${ctx.rows[1]}} \\mid \\text{${ctx.cols[1]}})$ as a fraction in lowest terms.`, answer: fs(cond), accept: [`${d}/${colTot}`], hint: `Cell $${d}$ over the column total $${colTot}$.` },
    ],
    finalAnswer: { value: fs(cond), unit: "" },
    solutionNarrative: `Conditioning on "${ctx.cols[1]}" throws away the other column: the reduced world has ${colTot} ${ctx.thing}, of whom ${d} also ${ctx.rname}. So the conditional probability is $\\frac{${d}}{${colTot}} = ${fs(cond)}$ — cell over column total, not cell over grand total.`,
  };
};
fill["as2-cond-joint-2"] = (rng, idx) => {
  const a = rng.int(3, 6), b = rng.int(3, 6), c = rng.int(3, 6);
  const d = 20 - a - b - c; // >= 2
  const margX1 = F(c + d, 20);
  const cond1 = F(d, c + d), cond0 = F(c, c + d);
  return {
    id: `gen.as2-cond-joint-2.${idx}`, generated: true, concepts: ["conditional-from-joint"], difficulty: 2, context: "abstract",
    prompt: `$X$ and $Y$ have the joint distribution:\n\n|  | $Y=0$ | $Y=1$ |\n|---|---|---|\n| $X=0$ | $${a}/20$ | $${b}/20$ |\n| $X=1$ | $${c}/20$ | $${d}/20$ |\n\nCompute $P(Y=1 \\mid X=1) = \\dfrac{P(X=1, Y=1)}{P(X=1)}$. Give fractions in lowest terms.`,
    steps: [
      { instruction: `First the denominator: the marginal $P(X=1)$. Give a fraction in lowest terms.`, answer: fs(margX1), accept: [`${c + d}/20`], hint: `Sum the $X=1$ row: $\\frac{${c}}{20} + \\frac{${d}}{20}$.` },
      { instruction: `Now divide: $P(Y=1 \\mid X=1) = \\dfrac{${d}/20}{${fs(margX1)}}$. Give a fraction in lowest terms.`, answer: fs(cond1), accept: [`${d}/${c + d}`], hint: `The 20s cancel: $\\frac{${d}}{${c + d}}$.` },
      { instruction: `Conditionals given the same event must sum to 1: $P(Y=0 \\mid X=1) = 1 - ${fs(cond1)}$. Give a fraction in lowest terms.`, answer: fs(cond0), accept: [`${c}/${c + d}`], hint: `$\\frac{${c}}{${c + d}}$.` },
    ],
    finalAnswer: { value: fs(cond1), unit: "" },
    solutionNarrative: `$P(X=1) = ${fs(margX1)}$, so $P(Y=1 \\mid X=1) = \\frac{${d}/20}{${fs(margX1)}} = ${fs(cond1)}$, and its complement within the row is $${fs(cond0)}$. Conditioning renormalizes one row of the table into a distribution of its own.`,
  };
};
fill["as2-cond-joint-3"] = (rng, idx) => {
  const y1 = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 6)];
  const y0 = [rng.int(2, 6), rng.int(2, 6), rng.int(2, 6)];
  const tot = y1[0] + y1[1] + y1[2];
  const p2 = F(y1[2], tot), p12 = F(y1[1] + y1[2], tot);
  const cnt = [[y0[0], y1[0]], [y0[1], y1[1]], [y0[2], y1[2]]];
  return {
    id: `gen.as2-cond-joint-3.${idx}`, generated: true, concepts: ["conditional-from-joint"], difficulty: 3, context: "applied",
    prompt: `An app tracks purchases per user ($X$: 0, 1, or 2) and whether the user is a subscriber ($Y=1$) or not ($Y=0$). Counts:\n\n${md32(["$X=0$", "$X=1$", "$X=2$"], ["$Y=0$", "$Y=1$"], cnt)}\n\nAnalyze the SUBSCRIBER column. Give fractions in lowest terms.`,
    steps: [
      { instruction: `How many subscribers ($Y=1$) are there in total? (Give a number.)`, answer: `${tot}`, accept: [], hint: `Sum the $Y=1$ column: $${y1[0]}+${y1[1]}+${y1[2]}$.` },
      { instruction: `Compute $P(X=2 \\mid Y=1)$. Give a fraction in lowest terms.`, answer: fs(p2), accept: [`${y1[2]}/${tot}`], hint: `The $X=2$, $Y=1$ cell over the column total.` },
      { instruction: `Compute $P(X \\ge 1 \\mid Y=1)$. Give a fraction in lowest terms.`, answer: fs(p12), accept: [`${y1[1] + y1[2]}/${tot}`], hint: `Add the $X=1$ and $X=2$ cells of the subscriber column: $${y1[1]} + ${y1[2]}$.` },
    ],
    finalAnswer: { value: fs(p12), unit: "" },
    solutionNarrative: `Among the ${tot} subscribers, $P(X=2 \\mid Y=1) = ${fs(p2)}$ and $P(X \\ge 1 \\mid Y=1) = \\frac{${y1[1] + y1[2]}}{${tot}} = ${fs(p12)}$. The condition picks the column; events then group cells within it.`,
  };
};

// --- covariance ---
// Curated 0/1 x 0/1 count tables over N = 10 with clean covariances.
const COV1 = [
  [[4, 2], [1, 3]], // cov 1/10
  [[2, 3], [1, 4]], // cov 1/20
  [[3, 1], [2, 4]], // cov 1/10
  [[1, 4], [3, 2]], // cov -1/10
  [[4, 1], [2, 3]], // cov 1/10
  [[2, 4], [3, 1]], // cov -1/10
];
fill["as2-covariance-1"] = (rng, idx) => {
  const cnt = rng.pick(COV1);
  const { EX, EY, EXY, cov } = covTable([0, 1], [0, 1], cnt);
  return {
    id: `gen.as2-covariance-1.${idx}`, generated: true, concepts: ["covariance"], difficulty: 1, context: "abstract",
    prompt: `$X$ and $Y$ each take values 0 or 1. Out of 10 equally likely observations, the counts are:\n\n${md22(["$X=0$", "$X=1$"], ["$Y=0$", "$Y=1$"], cnt)}\n\nCompute $\\mathrm{Cov}(X, Y) = E[XY] - E[X]\\,E[Y]$. Give fractions in lowest terms.`,
    steps: [
      { instruction: `$E[X] = P(X=1)$ for a 0/1 variable. Give it as a fraction in lowest terms.`, answer: fs(EX), accept: [`${cnt[1][0] + cnt[1][1]}/10`], hint: `The $X=1$ row holds $${cnt[1][0]} + ${cnt[1][1]}$ of the 10 observations.` },
      { instruction: `$E[Y] = P(Y=1)$. Give it as a fraction in lowest terms.`, answer: fs(EY), accept: [`${cnt[0][1] + cnt[1][1]}/10`], hint: `Sum the $Y=1$ column.` },
      { instruction: `$E[XY] = P(X=1, Y=1)$, since the product is 1 only in that cell. Give it as a fraction.`, answer: fs(EXY), accept: [`${cnt[1][1]}/10`], hint: `The bottom-right cell over 10.` },
      { instruction: `$\\mathrm{Cov}(X,Y) = ${fs(EXY)} - ${fs(EX)} \\cdot ${fs(EY)}$. Give a fraction in lowest terms (sign included).`, answer: fs(cov), accept: [], hint: `Multiply the marginal means first, then subtract from $E[XY]$.` },
    ],
    finalAnswer: { value: fs(cov), unit: "" },
    solutionNarrative: `$E[X] = ${fs(EX)}$, $E[Y] = ${fs(EY)}$, $E[XY] = ${fs(EXY)}$, so $\\mathrm{Cov} = ${fs(EXY)} - ${fs(fmul(EX, EY))} = ${fs(cov)}$. ${cov.n > 0 ? "Positive: the two happen together more often than independence would predict." : "Negative: the two avoid each other relative to independence."}`,
  };
};
// Curated 3x2 tables (X in 0..2, Y in 0/1) over N = 10.
const COV2 = [
  [[2, 1], [2, 3], [1, 1]], // cov 1/20
  [[3, 1], [1, 2], [2, 1]], // cov 1/25
  [[2, 2], [2, 1], [1, 2]], // cov 1/20
  [[3, 2], [2, 1], [1, 1]], // cov 1/50
  [[1, 3], [1, 2], [2, 1]], // cov -7/50
];
fill["as2-covariance-2"] = (rng, idx) => {
  const cnt = rng.pick(COV2);
  const { EX, EY, EXY, cov } = covTable([0, 1, 2], [0, 1], cnt);
  const exyCells = `1 \\cdot ${cnt[1][1]} + 2 \\cdot ${cnt[2][1]}`;
  return {
    id: `gen.as2-covariance-2.${idx}`, generated: true, concepts: ["covariance"], difficulty: 2, context: "applied",
    prompt: `A kiosk records items bought ($X$: 0, 1, or 2) and whether a coupon was used ($Y$: 0 or 1) for 10 equally likely transactions:\n\n${md32(["$X=0$", "$X=1$", "$X=2$"], ["$Y=0$", "$Y=1$"], cnt)}\n\nCompute $\\mathrm{Cov}(X, Y) = E[XY] - E[X]E[Y]$. Give fractions in lowest terms.`,
    steps: [
      { instruction: `$E[X] = \\sum x \\cdot P(X=x)$. Give it as a fraction in lowest terms.`, answer: fs(EX), accept: [], hint: `$\\frac{0 \\cdot ${cnt[0][0] + cnt[0][1]} + 1 \\cdot ${cnt[1][0] + cnt[1][1]} + 2 \\cdot ${cnt[2][0] + cnt[2][1]}}{10}$.` },
      { instruction: `$E[Y] = P(Y=1)$. Give it as a fraction in lowest terms.`, answer: fs(EY), accept: [`${cnt[0][1] + cnt[1][1] + cnt[2][1]}/10`], hint: `Sum the coupon column.` },
      { instruction: `$E[XY]$: only cells with $x \\ge 1$ AND $y = 1$ contribute. Compute $\\dfrac{${exyCells}}{10}$ as a fraction in lowest terms.`, answer: fs(EXY), accept: [`${cnt[1][1] + 2 * cnt[2][1]}/10`], hint: `Weight each contributing cell by $x \\cdot y$.` },
      { instruction: `$\\mathrm{Cov}(X,Y) = ${fs(EXY)} - ${fs(EX)} \\cdot ${fs(EY)}$. Give a fraction in lowest terms (sign included).`, answer: fs(cov), accept: [], hint: `$E[X]E[Y] = ${fs(fmul(EX, EY))}$.` },
    ],
    finalAnswer: { value: fs(cov), unit: "" },
    solutionNarrative: `$E[X] = ${fs(EX)}$, $E[Y] = ${fs(EY)}$, and $E[XY] = ${fs(EXY)}$, giving $\\mathrm{Cov} = ${fs(cov)}$. ${cov.n > 0 ? "Coupon use travels with larger purchases here." : "Coupon use runs against larger purchases here."}`,
  };
};
// Curated general-value tables over N = 10 (all cov = ±1/5 by construction).
const COV3 = [
  { xv: [1, 2], yv: [1, 3], cnt: [[3, 2], [1, 4]] },
  { xv: [1, 2], yv: [1, 3], cnt: [[2, 3], [4, 1]] },
  { xv: [0, 2], yv: [1, 2], cnt: [[1, 4], [3, 2]] },
  { xv: [1, 3], yv: [1, 2], cnt: [[3, 1], [2, 4]] },
  { xv: [1, 2], yv: [2, 4], cnt: [[4, 1], [2, 3]] },
];
fill["as2-covariance-3"] = (rng, idx) => {
  const t = rng.pick(COV3);
  const { EX, EY, EXY, cov } = covTable(t.xv, t.yv, t.cnt);
  const prods = [];
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) prods.push(`${t.xv[i]} \\cdot ${t.yv[j]} \\cdot ${t.cnt[i][j]}`);
  return {
    id: `gen.as2-covariance-3.${idx}`, generated: true, concepts: ["covariance"], difficulty: 3, context: "applied",
    prompt: `Two assets' daily returns (in percent) take values $X \\in \\{${t.xv.join(", ")}\\}$ and $Y \\in \\{${t.yv.join(", ")}\\}$. Over 10 equally likely days:\n\n${md22([`$X=${t.xv[0]}$`, `$X=${t.xv[1]}$`], [`$Y=${t.yv[0]}$`, `$Y=${t.yv[1]}$`], t.cnt)}\n\nCompute the covariance of the returns. Give fractions in lowest terms (or exact decimals).`,
    steps: [
      { instruction: `$E[X] = \\dfrac{${t.xv[0]} \\cdot ${t.cnt[0][0] + t.cnt[0][1]} + ${t.xv[1]} \\cdot ${t.cnt[1][0] + t.cnt[1][1]}}{10}$. Give a fraction in lowest terms.`, answer: fs(EX), accept: [], hint: `Row totals are ${t.cnt[0][0] + t.cnt[0][1]} and ${t.cnt[1][0] + t.cnt[1][1]}.` },
      { instruction: `$E[Y] = \\dfrac{${t.yv[0]} \\cdot ${t.cnt[0][0] + t.cnt[1][0]} + ${t.yv[1]} \\cdot ${t.cnt[0][1] + t.cnt[1][1]}}{10}$. Give a fraction in lowest terms.`, answer: fs(EY), accept: [], hint: `Column totals are ${t.cnt[0][0] + t.cnt[1][0]} and ${t.cnt[0][1] + t.cnt[1][1]}.` },
      { instruction: `$E[XY] = \\dfrac{${prods.join(" + ")}}{10}$. Give a fraction in lowest terms.`, answer: fs(EXY), accept: [], hint: `Each cell contributes $x \\cdot y \\cdot \\text{count}$.` },
      { instruction: `$\\mathrm{Cov}(X,Y) = ${fs(EXY)} - ${fs(EX)} \\cdot ${fs(EY)}$. Give a fraction in lowest terms (sign included).`, answer: fs(cov), accept: [], hint: `$E[X]E[Y] = ${fs(fmul(EX, EY))}$.` },
    ],
    finalAnswer: { value: fs(cov), unit: "" },
    solutionNarrative: `$E[X] = ${fs(EX)}$, $E[Y] = ${fs(EY)}$, $E[XY] = ${fs(EXY)}$, so $\\mathrm{Cov} = ${fs(cov)}$. ${cov.n > 0 ? "The assets tend to move together — holding both gives less diversification." : "The assets tend to move oppositely — a natural hedge."}`,
  };
};

// --- correlation-and-independence ---
// Curated N=20 binary tables: {cnt, indep} where indep tables satisfy
// n11/N = (row1/N)(col1/N) EXACTLY, dependent ones are bumped off it.
const IND_POOL = [
  { cnt: [[6, 4], [6, 4]], indep: true },   // 4/20 = (10/20)(8/20)
  { cnt: [[9, 6], [3, 2]], indep: true },   // 2/20 = (5/20)(8/20)
  { cnt: [[4, 4], [6, 6]], indep: true },   // 6/20 = (12/20)(10/20)
  { cnt: [[8, 2], [4, 6]], indep: false },  // 6/20 vs 1/5
  { cnt: [[10, 5], [2, 3]], indep: false }, // 3/20 vs 1/10
  { cnt: [[3, 7], [7, 3]], indep: false },  // 3/20 vs 1/4
];
fill["as2-corr-indep-1"] = (rng, idx) => {
  const t = rng.pick(IND_POOL);
  const c = t.cnt;
  const p11 = F(c[1][1], 20);
  const px = F(c[1][0] + c[1][1], 20), py = F(c[0][1] + c[1][1], 20);
  const prod = fmul(px, py);
  const verdict = t.indep ? "independent" : "not independent";
  return {
    id: `gen.as2-corr-indep-1.${idx}`, generated: true, concepts: ["correlation-and-independence"], difficulty: 1, context: "abstract",
    prompt: `$X$ and $Y$ are 0/1 variables with these counts over 20 equally likely outcomes:\n\n${md22(["$X=0$", "$X=1$"], ["$Y=0$", "$Y=1$"], c)}\n\nTest independence: compare $P(X=1, Y=1)$ with $P(X=1) \\cdot P(Y=1)$.`,
    steps: [
      { instruction: `Compute $P(X=1, Y=1)$. Give a fraction in lowest terms.`, answer: fs(p11), accept: [`${c[1][1]}/20`], hint: `The bottom-right cell over 20.` },
      { instruction: `Compute the product $P(X=1) \\cdot P(Y=1)$. Give a fraction in lowest terms.`, answer: fs(prod), accept: [], hint: `$P(X=1) = ${fs(px)}$ (row sum) and $P(Y=1) = ${fs(py)}$ (column sum).` },
      { instruction: `The joint ${t.indep ? "equals" : "does NOT equal"} the product. Are $X$ and $Y$ independent? Type 'independent' or 'not independent'.`, answer: verdict, accept: t.indep ? [] : ["dependent"], hint: `Independence means the joint EXACTLY equals the product of marginals.` },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `$P(X=1,Y=1) = ${fs(p11)}$ while $P(X=1)P(Y=1) = ${fs(px)} \\cdot ${fs(py)} = ${fs(prod)}$. ${t.indep ? "They match, so the variables are independent — the table factors perfectly into its margins." : "They differ, so the variables are NOT independent — the table cannot be rebuilt from its margins alone."}`,
  };
};
// sigma table for clean sqrt: variance fraction -> sigma fraction.
const RHO_POOL = [
  { vx: F(1, 4), sx: F(1, 2), vy: F(4, 25), sy: F(2, 5), covs: [F(1, 10), F(-1, 10), F(1, 20), F(-1, 20)] },
  { vx: F(9, 100), sx: F(3, 10), vy: F(1, 4), sy: F(1, 2), covs: [F(3, 40), F(-3, 40), F(3, 100)] },
  { vx: F(4, 25), sx: F(2, 5), vy: F(9, 25), sy: F(3, 5), covs: [F(3, 25), F(-3, 25)] },
];
fill["as2-corr-indep-2"] = (rng, idx) => {
  const t = rng.pick(RHO_POOL);
  const cov = rng.pick(t.covs);
  const prod = fmul(t.sx, t.sy);
  const rho = fdiv(cov, prod);
  return {
    id: `gen.as2-corr-indep-2.${idx}`, generated: true, concepts: ["correlation-and-independence"], difficulty: 2, context: "abstract",
    prompt: `Random variables have $\\mathrm{Var}(X) = ${fs(t.vx)}$, $\\mathrm{Var}(Y) = ${fs(t.vy)}$, and $\\mathrm{Cov}(X, Y) = ${fs(cov)}$. Compute the correlation $\\rho = \\dfrac{\\mathrm{Cov}(X,Y)}{\\sigma_X \\sigma_Y}$. Give fractions in lowest terms.`,
    steps: [
      { instruction: `$\\sigma_X = \\sqrt{${fs(t.vx)}}$. Give a fraction in lowest terms.`, answer: fs(t.sx), accept: [`sqrt(${fs(t.vx)})`], hint: `Both numerator and denominator are perfect squares.` },
      { instruction: `$\\sigma_Y = \\sqrt{${fs(t.vy)}}$. Give a fraction in lowest terms.`, answer: fs(t.sy), accept: [`sqrt(${fs(t.vy)})`], hint: `Take the square root of top and bottom.` },
      { instruction: `Compute the product $\\sigma_X \\sigma_Y$. Give a fraction in lowest terms.`, answer: fs(prod), accept: [], hint: `$${fs(t.sx)} \\cdot ${fs(t.sy)}$.` },
      { instruction: `$\\rho = \\dfrac{${fs(cov)}}{${fs(prod)}}$. Give a fraction in lowest terms (sign included).`, answer: fs(rho), accept: [], hint: `Dividing by a fraction multiplies by its reciprocal.` },
    ],
    finalAnswer: { value: fs(rho), unit: "" },
    solutionNarrative: `$\\sigma_X = ${fs(t.sx)}$, $\\sigma_Y = ${fs(t.sy)}$, so $\\rho = \\frac{${fs(cov)}}{${fs(prod)}} = ${fs(rho)}$: covariance rescaled into the universal $[-1, 1]$ ruler. The sign is inherited from the covariance; the magnitude now compares across datasets.`,
  };
};
// Bump construction: N=20, X=1 count r, Y=1 count c, n11 = rc/20 + b.
const SIGMA20 = { 4: F(2, 5), 10: F(1, 2), 16: F(2, 5) };
const VAR20 = { 4: F(4, 25), 10: F(1, 4), 16: F(4, 25) };
const BUMP_POOL = [
  { r: 10, c: 16, b: 1 }, { r: 10, c: 16, b: -1 },
  { r: 10, c: 10, b: 2 }, { r: 10, c: 10, b: -2 },
  { r: 4, c: 10, b: 1 },
];
fill["as2-corr-indep-3"] = (rng, idx) => {
  const t = rng.pick(BUMP_POOL);
  const n11 = (t.r * t.c) / 20 + t.b;
  const cnt = [[20 - t.r - t.c + n11, t.c - n11], [t.r - n11, n11]];
  const exy = F(n11, 20), ex = F(t.r, 20), ey = F(t.c, 20);
  const cov = fsub(exy, fmul(ex, ey));
  const sx = SIGMA20[t.r], sy = SIGMA20[t.c];
  const prod = fmul(sx, sy);
  const rho = fdiv(cov, prod);
  return {
    id: `gen.as2-corr-indep-3.${idx}`, generated: true, concepts: ["correlation-and-independence"], difficulty: 3, context: "applied",
    prompt: `A store tracks whether a visitor uses the app ($X$) and whether they buy ($Y$), both 0/1, over 20 equally likely visits:\n\n${md22(["$X=0$", "$X=1$"], ["$Y=0$", "$Y=1$"], cnt)}\n\nThe marginals give $E[X] = ${fs(ex)}$, $E[Y] = ${fs(ey)}$, $\\mathrm{Var}(X) = ${fs(VAR20[t.r])}$, and $\\mathrm{Var}(Y) = ${fs(VAR20[t.c])}$. Compute the correlation and judge independence. Give fractions in lowest terms.`,
    steps: [
      { instruction: `$E[XY] = P(X=1, Y=1)$. Give a fraction in lowest terms.`, answer: fs(exy), accept: [`${n11}/20`], hint: `The bottom-right cell over 20.` },
      { instruction: `$\\mathrm{Cov}(X,Y) = ${fs(exy)} - ${fs(ex)} \\cdot ${fs(ey)}$. Give a fraction in lowest terms (sign included).`, answer: fs(cov), accept: [], hint: `$E[X]E[Y] = ${fs(fmul(ex, ey))}$.` },
      { instruction: `$\\sigma_X \\sigma_Y = \\sqrt{${fs(VAR20[t.r])}} \\cdot \\sqrt{${fs(VAR20[t.c])}}$. Give a fraction in lowest terms.`, answer: fs(prod), accept: [], hint: `$\\sigma_X = ${fs(sx)}$ and $\\sigma_Y = ${fs(sy)}$ — both variances are perfect squares.` },
      { instruction: `$\\rho = \\dfrac{${fs(cov)}}{${fs(prod)}}$. Give a fraction in lowest terms (sign included).`, answer: fs(rho), accept: [], hint: `Multiply by the reciprocal of $${fs(prod)}$.` },
      { instruction: `Since $\\rho \\ne 0$, are $X$ and $Y$ independent? Type 'independent' or 'not independent'.`, answer: "not independent", accept: ["dependent"], hint: `Any nonzero correlation rules out independence.` },
    ],
    finalAnswer: { value: fs(rho), unit: "" },
    solutionNarrative: `$E[XY] = ${fs(exy)}$ gives $\\mathrm{Cov} = ${fs(cov)}$, and dividing by $\\sigma_X \\sigma_Y = ${fs(prod)}$ yields $\\rho = ${fs(rho)}$. Nonzero correlation certifies dependence (the converse is NOT true: $\\rho = 0$ alone does not prove independence).`,
  };
};

// ===========================================================================
// TOPIC 2: advanced-statistics.estimators-sampling
//   concepts: point-estimators, bias-and-mse, standard-errors, clt-applications
// ===========================================================================

// --- point-estimators ---
const SVP = [
  { desc: "the average battery life of the 40 sampled phones", ans: "statistic" },
  { desc: "the true mean battery life across ALL phones the factory makes", ans: "parameter" },
  { desc: "the proportion of the 200 polled voters who support the measure", ans: "statistic" },
  { desc: "the true proportion of ALL voters who support the measure", ans: "parameter" },
  { desc: "the sample variance computed from this week's 25 quality checks", ans: "statistic" },
  { desc: "the true standard deviation of the entire production process", ans: "parameter" },
];
fill["as2-point-est-1"] = (rng, idx) => {
  const s = rng.pick(SVP);
  const x = rng.pick([4, 5, 8, 10, 12, 15]);
  const ph = F(x, 20);
  return {
    id: `gen.as2-point-est-1.${idx}`, generated: true, concepts: ["point-estimators"], difficulty: 1, context: "applied",
    prompt: `A quantity computed from a SAMPLE is a statistic; a fixed (usually unknown) property of the POPULATION is a parameter. Then compute a point estimate: in a sample of 20 customers, ${x} would recommend the store.`,
    steps: [
      { instruction: `Classify: "${s.desc}". Type 'statistic' or 'parameter'.`, answer: s.ans, accept: [], hint: `Computed from sampled data $\\to$ statistic; a fact about the whole population $\\to$ parameter.` },
      { instruction: `Compute the sample proportion $\\hat{p} = \\dfrac{${x}}{20}$. Give a fraction in lowest terms.`, answer: fs(ph), accept: [`${x}/20`], hint: `Successes over sample size, then reduce.` },
    ],
    finalAnswer: { value: fs(ph), unit: "" },
    solutionNarrative: `"${s.desc}" is a ${s.ans}. The point estimate is $\\hat{p} = \\frac{${x}}{20} = ${fs(ph)}$ — a statistic used to estimate the unknown population proportion $p$.`,
  };
};
const DEV2 = [
  { devs: [-2, -1, 0, 1, 2], ssd: 10 },
  { devs: [-3, -1, 0, 1, 3], ssd: 20 },
  { devs: [-4, -2, 0, 2, 4], ssd: 40 },
  { devs: [-3, -2, 0, 2, 3], ssd: 26 },
];
fill["as2-point-est-2"] = (rng, idx) => {
  const t = rng.pick(DEV2);
  const m = rng.int(10, 30);
  const vals = t.devs.map((d) => m + d);
  const s2 = `${t.ssd / 4}`;
  return {
    id: `gen.as2-point-est-2.${idx}`, generated: true, concepts: ["point-estimators"], difficulty: 2, context: "applied",
    prompt: `Five sampled delivery times (minutes): $${vals.join(",\\ ")}$. Compute the two workhorse point estimators: the sample mean $\\bar{x}$ and the sample variance $s^2 = \\dfrac{\\sum (x_i - \\bar{x})^2}{n - 1}$.`,
    steps: [
      { instruction: `Sum the five values. (Give a number.)`, answer: `${5 * m}`, accept: [], hint: `$${vals.join(" + ")}$.` },
      { instruction: `Sample mean $\\bar{x} = \\dfrac{${5 * m}}{5}$. (Give a number.)`, answer: `${m}`, accept: [], hint: `Divide by $n = 5$.` },
      { instruction: `Sum of squared deviations $\\sum (x_i - \\bar{x})^2$: the deviations are $${t.devs.join(",\\ ")}$. (Give a number.)`, answer: `${t.ssd}`, accept: [], hint: `Square each deviation and add: $${t.devs.map((d) => `${d * d}`).join(" + ")}$.` },
      { instruction: `Sample variance $s^2 = \\dfrac{${t.ssd}}{4}$ (divide by $n - 1 = 4$, not 5). Give the exact value.`, answer: s2, accept: [`${t.ssd}/4`], hint: `The $n-1$ denominator is what makes $s^2$ unbiased.` },
    ],
    finalAnswer: { value: s2, unit: "" },
    solutionNarrative: `$\\bar{x} = ${m}$, the squared deviations sum to ${t.ssd}, and dividing by $n - 1 = 4$ gives $s^2 = ${s2}$. Dividing by $n$ instead would systematically underestimate the true variance.`,
  };
};
const DEV3 = [
  { devs: [-2, -2, 0, 2, 2], ssd: 16, s2: 4, s: 2 },
  { devs: [-4, -4, 0, 4, 4], ssd: 64, s2: 16, s: 4 },
  { devs: [-3, -3, 0, 3, 3], ssd: 36, s2: 9, s: 3 },
  { devs: [-1, -1, 0, 1, 1], ssd: 4, s2: 1, s: 1 },
];
fill["as2-point-est-3"] = (rng, idx) => {
  const t = rng.pick(DEV3);
  const m = rng.int(10, 25);
  const vals = t.devs.map((d) => m + d);
  return {
    id: `gen.as2-point-est-3.${idx}`, generated: true, concepts: ["point-estimators"], difficulty: 3, context: "applied",
    prompt: `Five sampled wait times (minutes): $${vals.join(",\\ ")}$. Compute $\\bar{x}$, $s^2$, and the sample standard deviation $s$, then classify what you built.`,
    steps: [
      { instruction: `Sample mean $\\bar{x}$. (Give a number.)`, answer: `${m}`, accept: [], hint: `The sum is $${5 * m}$; divide by 5.` },
      { instruction: `Sum of squared deviations $\\sum (x_i - \\bar{x})^2$. (Give a number.)`, answer: `${t.ssd}`, accept: [], hint: `Deviations: $${t.devs.join(",\\ ")}$; square and add.` },
      { instruction: `Sample variance $s^2 = \\dfrac{${t.ssd}}{4}$. (Give a number.)`, answer: `${t.s2}`, accept: [`${t.ssd}/4`], hint: `Divide by $n - 1 = 4$.` },
      { instruction: `Sample standard deviation $s = \\sqrt{${t.s2}}$. (Give a number.)`, answer: `${t.s}`, accept: [`sqrt(${t.s2})`], hint: `$${t.s}^2 = ${t.s2}$.` },
      { instruction: `Is $s^2$, computed from this sample, a statistic or a parameter? Type 'statistic' or 'parameter'.`, answer: "statistic", accept: [], hint: `It was computed from sampled data to ESTIMATE the population parameter $\\sigma^2$.` },
    ],
    finalAnswer: { value: `${t.s}`, unit: "minutes" },
    solutionNarrative: `$\\bar{x} = ${m}$, $\\sum(x_i - \\bar{x})^2 = ${t.ssd}$, so $s^2 = ${t.s2}$ and $s = ${t.s}$. All three are statistics — sample-based estimates of the population parameters $\\mu$, $\\sigma^2$, $\\sigma$.`,
  };
};

// --- bias-and-mse ---
const BIAS1 = [
  { ev: 52, th: 50 }, { ev: 47, th: 50 }, { ev: 103, th: 100 },
  { ev: 100, th: 100 }, { ev: 9, th: 10 }, { ev: 75, th: 75 },
];
fill["as2-bias-mse-1"] = (rng, idx) => {
  const t = rng.pick(BIAS1);
  const bias = t.ev - t.th;
  const verdict = bias === 0 ? "unbiased" : "biased";
  return {
    id: `gen.as2-bias-mse-1.${idx}`, generated: true, concepts: ["bias-and-mse"], difficulty: 1, context: "abstract",
    prompt: `An estimator $\\hat{\\theta}$ has expected value $E[\\hat{\\theta}] = ${t.ev}$, while the true parameter value is $\\theta = ${t.th}$. Evaluate its bias.`,
    steps: [
      { instruction: `Bias $= E[\\hat{\\theta}] - \\theta = ${t.ev} - ${t.th}$. (Give a number, sign included.)`, answer: `${bias}`, accept: [], hint: `Expected value of the estimator minus the truth.` },
      { instruction: `Is this estimator unbiased or biased? Type 'unbiased' or 'biased'.`, answer: verdict, accept: [], hint: `Unbiased means the bias is exactly 0.` },
    ],
    finalAnswer: { value: verdict, unit: "" },
    solutionNarrative: `Bias $= ${t.ev} - ${t.th} = ${bias}$, so the estimator is ${verdict}. ${bias === 0 ? "On average, across repeated samples, it hits the target exactly." : `On average it ${bias > 0 ? "overshoots" : "undershoots"} the truth by ${Math.abs(bias)}.`}`,
  };
};
fill["as2-bias-mse-2"] = (rng, idx) => {
  const v = rng.pick([4, 9, 16, 25]);
  const c = rng.pick([-3, -2, -1, 1, 2, 3]);
  const mse = v + c * c;
  return {
    id: `gen.as2-bias-mse-2.${idx}`, generated: true, concepts: ["bias-and-mse"], difficulty: 2, context: "abstract",
    prompt: `An estimator satisfies $E[\\hat{\\theta}] = \\theta ${c < 0 ? "-" : "+"} ${Math.abs(c)}$ and $\\mathrm{Var}(\\hat{\\theta}) = ${v}$. Compute its mean squared error, $\\mathrm{MSE} = \\mathrm{Var}(\\hat{\\theta}) + \\mathrm{bias}^2$.`,
    steps: [
      { instruction: `Read off the bias $E[\\hat{\\theta}] - \\theta$. (Give a number, sign included.)`, answer: `${c}`, accept: [], hint: `Whatever is added to $\\theta$ in the expected value.` },
      { instruction: `Square it: $\\mathrm{bias}^2$. (Give a number.)`, answer: `${c * c}`, accept: [], hint: `$(${c})^2$ — the sign disappears.` },
      { instruction: `$\\mathrm{MSE} = ${v} + ${c * c}$. (Give a number.)`, answer: `${mse}`, accept: [], hint: `Variance plus squared bias.` },
    ],
    finalAnswer: { value: `${mse}`, unit: "" },
    solutionNarrative: `Bias $= ${c}$, so $\\mathrm{MSE} = ${v} + ${c * c} = ${mse}$. MSE charges an estimator for BOTH its noise (variance) and its systematic offset (bias squared) in one number.`,
  };
};
const MSE3 = [
  { vA: 10, vB: 5, c: 2 },  // A: 10, B: 9  -> B
  { vA: 8, vB: 6, c: 2 },   // A: 8,  B: 10 -> A
  { vA: 16, vB: 9, c: 2 },  // A: 16, B: 13 -> B
  { vA: 6, vB: 3, c: 2 },   // A: 6,  B: 7  -> A
  { vA: 12, vB: 4, c: 2 },  // A: 12, B: 8  -> B
  { vA: 9, vB: 8, c: 3 },   // A: 9,  B: 17 -> A
];
fill["as2-bias-mse-3"] = (rng, idx) => {
  const t = rng.pick(MSE3);
  const mA = t.vA, mB = t.vB + t.c * t.c;
  const winner = mA < mB ? "estimator A" : "estimator B";
  return {
    id: `gen.as2-bias-mse-3.${idx}`, generated: true, concepts: ["bias-and-mse"], difficulty: 3, context: "applied",
    prompt: `Two estimators of the same parameter: estimator A is UNBIASED with $\\mathrm{Var} = ${t.vA}$; estimator B has bias $${t.c}$ but smaller variance $\\mathrm{Var} = ${t.vB}$. Compare them by MSE $= \\mathrm{Var} + \\mathrm{bias}^2$.`,
    steps: [
      { instruction: `MSE of estimator A $= ${t.vA} + 0^2$. (Give a number.)`, answer: `${mA}`, accept: [], hint: `Unbiased means the bias term contributes nothing.` },
      { instruction: `MSE of estimator B $= ${t.vB} + ${t.c}^2$. (Give a number.)`, answer: `${mB}`, accept: [], hint: `$${t.c}^2 = ${t.c * t.c}$.` },
      { instruction: `Which has the SMALLER mean squared error? Type 'estimator A' or 'estimator B'.`, answer: winner, accept: [winner === "estimator A" ? "a" : "b"], hint: `Compare $${mA}$ with $${mB}$.` },
    ],
    finalAnswer: { value: winner, unit: "" },
    solutionNarrative: `$\\mathrm{MSE}_A = ${mA}$ and $\\mathrm{MSE}_B = ${t.vB} + ${t.c * t.c} = ${mB}$, so ${winner} wins. ${mB < mA ? "A little bias can be a good trade if it buys a large variance reduction — the classic bias-variance tradeoff." : "Here the bias costs more than the variance reduction saves — unbiasedness wins this round."}`,
  };
};

// --- standard-errors ---
fill["as2-se-1"] = (rng, idx) => {
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(2, 6);
  const sigma = sq * k;
  return {
    id: `gen.as2-se-1.${idx}`, generated: true, concepts: ["standard-errors"], difficulty: 1, context: "abstract",
    prompt: `A population has standard deviation $\\sigma = ${sigma}$. You draw a sample of $n = ${n}$. Find the standard error of the sample mean, $\\mathrm{SE} = \\dfrac{\\sigma}{\\sqrt{n}}$.`,
    steps: [
      { instruction: `Compute $\\sqrt{${n}}$. (Give a whole number.)`, answer: `${sq}`, accept: [`sqrt(${n})`], hint: `$${sq}^2 = ${n}$.` },
      { instruction: `Divide: $\\mathrm{SE} = \\dfrac{${sigma}}{${sq}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$${sigma} / ${sq}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\mathrm{SE} = \\frac{${sigma}}{\\sqrt{${n}}} = \\frac{${sigma}}{${sq}} = ${k}$: averaging ${n} independent values divides the individual noise by $\\sqrt{n} = ${sq}$.`,
  };
};
const SE_PROPS = [
  { pH: 50, n: 100, seT: 50 }, { pH: 20, n: 100, seT: 40 }, { pH: 80, n: 100, seT: 40 },
  { pH: 90, n: 100, seT: 30 }, { pH: 10, n: 100, seT: 30 }, { pH: 50, n: 400, seT: 25 },
  { pH: 20, n: 400, seT: 20 }, { pH: 80, n: 400, seT: 20 },
];
fill["as2-se-2"] = (rng, idx) => {
  const c = rng.pick(SE_PROPS);
  const qH = 100 - c.pH;
  const pq = (c.pH * qH) / 10000;
  const varU = c.seT * c.seT;
  return {
    id: `gen.as2-se-2.${idx}`, generated: true, concepts: ["standard-errors"], difficulty: 2, context: "applied",
    prompt: `A poll of $n = ${c.n}$ voters gives sample proportion $\\hat{p} = ${c.pH / 100}$. Find the standard error of $\\hat{p}$: $\\mathrm{SE} = \\sqrt{\\dfrac{\\hat{p}(1 - \\hat{p})}{n}}$.`,
    steps: [
      { instruction: `Compute $\\hat{p}(1 - \\hat{p}) = ${c.pH / 100} \\times ${qH / 100}$. (Give a decimal.)`, answer: `${pq}`, accept: [], hint: `$1 - ${c.pH / 100} = ${qH / 100}$.` },
      { instruction: `Divide by $n$: $\\dfrac{${pq}}{${c.n}}$. (Give a decimal.)`, answer: `${varU / 1e6}`, accept: [], hint: `Move the decimal point ${c.n === 100 ? "two" : "between four and five"} places — the result is $${varU / 1e6}$... check by multiplying back.` },
      { instruction: `Take the square root. (Give a decimal.)`, answer: d1000(c.seT), accept: [`sqrt(${varU / 1e6})`], hint: `$${d1000(c.seT)}^2 = ${varU / 1e6}$.` },
    ],
    finalAnswer: { value: d1000(c.seT), unit: "" },
    solutionNarrative: `$\\hat{p}(1-\\hat{p}) = ${pq}$, divided by ${c.n} gives $${varU / 1e6}$, whose square root is $\\mathrm{SE} = ${d1000(c.seT)}$. This SE is the yardstick for the poll's margin of error.`,
  };
};
fill["as2-se-3"] = (rng, idx) => {
  const m = rng.pick([2, 3, 4]);
  const k = rng.pick([5, 6, 8, 10]);
  const sigma = m * k;
  return {
    id: `gen.as2-se-3.${idx}`, generated: true, concepts: ["standard-errors"], difficulty: 3, context: "applied",
    prompt: `A lab needs the standard error of a sample mean to be $\\mathrm{SE} = ${m}$, and the population standard deviation is $\\sigma = ${sigma}$. Solve $\\dfrac{\\sigma}{\\sqrt{n}} = ${m}$ for the required $n$, then reason about scaling.`,
    steps: [
      { instruction: `Rearrange: $\\sqrt{n} = \\dfrac{\\sigma}{\\mathrm{SE}} = \\dfrac{${sigma}}{${m}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `Divide $\\sigma$ by the target SE.` },
      { instruction: `Square it: $n = ${k}^2$. (Give a whole number.)`, answer: `${k * k}`, accept: [], hint: `$${k} \\times ${k}$.` },
      { instruction: `If the lab later QUADRUPLES $n$, the SE gets multiplied by what factor? (Give a fraction or decimal.)`, answer: "1/2", accept: ["0.5", "half"], hint: `$\\sqrt{4n} = 2\\sqrt{n}$, and $\\sqrt{n}$ sits in the denominator.` },
    ],
    finalAnswer: { value: `${k * k}`, unit: "" },
    solutionNarrative: `$\\sqrt{n} = ${sigma}/${m} = ${k}$, so $n = ${k * k}$. Because precision improves only with $\\sqrt{n}$, quadrupling the sample merely halves the SE — accuracy is bought at a steep quadratic price.`,
  };
};

// --- clt-applications ---
fill["as2-clt-1"] = (rng, idx) => {
  const zT = rng.pick([10, 20]);
  const phi = PHI[zT];
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.int(2, 5);
  const sigma = sq * k;
  const mu = rng.int(50, 150);
  const x = mu + (zT / 10) * k;
  return {
    id: `gen.as2-clt-1.${idx}`, generated: true, concepts: ["clt-applications"], difficulty: 1, context: "applied",
    prompt: `Weights have mean $\\mu = ${mu}$ g and standard deviation $\\sigma = ${sigma}$ g. By the CLT, the mean of $n = ${n}$ items is approximately normal. You are given $P(Z < ${d10(zT)}) = ${d1000(phi)}$. Find $P(\\bar{X} < ${x})$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${sigma}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Standardize: $z = \\dfrac{${x} - ${mu}}{${k}}$. (Give a number.)`, answer: d10(zT), accept: [], hint: `Difference over the STANDARD ERROR, not over $\\sigma$.` },
      { instruction: `So $P(\\bar{X} < ${x}) = P(Z < ${d10(zT)})$. Give the probability from the value provided.`, answer: d1000(phi), accept: [], hint: `Read it straight from the given $P(Z < ${d10(zT)})$.` },
    ],
    finalAnswer: { value: d1000(phi), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, so $z = \\frac{${x} - ${mu}}{${k}} = ${d10(zT)}$ and $P(\\bar{X} < ${x}) = ${d1000(phi)}$. The sample mean uses the SHRUNKEN yardstick $\\sigma/\\sqrt{n}$.`,
  };
};
fill["as2-clt-2"] = (rng, idx) => {
  const zT = rng.pick([10, 15, 20]);
  const phi = PHI[zT];
  const tail = 1000 - phi;
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.pick([2, 4]);
  const sigma = sq * k;
  const mu = rng.int(50, 200);
  const x = mu + (zT * k) / 10; // integer because k is even and zT a multiple of 5
  return {
    id: `gen.as2-clt-2.${idx}`, generated: true, concepts: ["clt-applications"], difficulty: 2, context: "applied",
    prompt: `Daily output has mean $\\mu = ${mu}$ units, $\\sigma = ${sigma}$. Over $n = ${n}$ days the average output $\\bar{X}$ is approximately normal (CLT). You are given $P(Z < ${d10(zT)}) = ${d1000(phi)}$. Find the probability the average EXCEEDS ${x} units, $P(\\bar{X} > ${x})$.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${sigma}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Standardize: $z = \\dfrac{${x} - ${mu}}{${k}}$. (Give a decimal.)`, answer: d10(zT), accept: [], hint: `$${x} - ${mu} = ${(zT * k) / 10}$, then divide by ${k}.` },
      { instruction: `Tail probability: $P(\\bar{X} > ${x}) = 1 - P(Z < ${d10(zT)}) = 1 - ${d1000(phi)}$. (Give a decimal.)`, answer: d1000(tail), accept: [], hint: `Subtract the given value from 1.` },
    ],
    finalAnswer: { value: d1000(tail), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$, $z = ${d10(zT)}$, so $P(\\bar{X} > ${x}) = 1 - ${d1000(phi)} = ${d1000(tail)}$. "Greater than" always means one minus the table value.`,
  };
};
fill["as2-clt-3"] = (rng, idx) => {
  const zT = rng.pick([10, 15, 20]);
  const phi = PHI[zT];
  const mid = 2 * phi - 1000;
  const [sq, n] = rng.pick(ROOTS);
  const k = rng.pick([2, 4]);
  const sigma = sq * k;
  const mu = rng.int(100, 300);
  const h = (zT * k) / 10; // integer half-width
  return {
    id: `gen.as2-clt-3.${idx}`, generated: true, concepts: ["clt-applications"], difficulty: 3, context: "applied",
    prompt: `Fill weights have $\\mu = ${mu}$ g, $\\sigma = ${sigma}$ g. A batch is accepted when the mean of $n = ${n}$ sampled bottles lands between ${mu - h} and ${mu + h} g. You are given $P(Z < ${d10(zT)}) = ${d1000(phi)}$. Find $P(${mu - h} < \\bar{X} < ${mu + h})$ using the symmetry of the normal curve.`,
    steps: [
      { instruction: `Standard error: $\\dfrac{${sigma}}{\\sqrt{${n}}}$. (Give a whole number.)`, answer: `${k}`, accept: [], hint: `$\\sqrt{${n}} = ${sq}$.` },
      { instruction: `Standardize the UPPER bound: $z = \\dfrac{${mu + h} - ${mu}}{${k}}$. (Give a decimal.)`, answer: d10(zT), accept: [], hint: `The lower bound gives $-${d10(zT)}$ by symmetry.` },
      { instruction: `The central probability is $P(-z < Z < z) = 2\\,P(Z < ${d10(zT)}) - 1 = 2(${d1000(phi)}) - 1$. (Give a decimal.)`, answer: d1000(mid), accept: [], hint: `Double the given value, subtract 1.` },
    ],
    finalAnswer: { value: d1000(mid), unit: "" },
    solutionNarrative: `$\\mathrm{SE} = ${k}$ makes the bounds $z = \\pm ${d10(zT)}$, so the acceptance probability is $2(${d1000(phi)}) - 1 = ${d1000(mid)}$. Central intervals fold the two symmetric tails into one formula.`,
  };
};

// ===========================================================================
// TOPIC 3: advanced-statistics.bayesian-inference
//   concepts: prior-to-posterior, sequential-updating,
//             bayes-factors-and-odds, bayesian-vs-frequentist
// ===========================================================================

// Generic two-hypothesis posterior: all fractions.
const post2 = (pa, la, lb) => {
  const ja = fmul(pa, la);
  const jb = fmul(fsub(fone, pa), lb);
  const tot = fadd(ja, jb);
  return { ja, jb, tot, post: fdiv(ja, tot) };
};

// --- prior-to-posterior ---
const PP1 = [
  { pa: F(1, 2), la: F(3, 4), lb: F(1, 4) },
  { pa: F(1, 2), la: F(2, 3), lb: F(1, 3) },
  { pa: F(1, 4), la: F(1, 2), lb: F(1, 4) },
  { pa: F(1, 3), la: F(3, 4), lb: F(1, 2) },
  { pa: F(1, 2), la: F(1, 10), lb: F(3, 10) },
];
fill["as2-prior-post-1"] = (rng, idx) => {
  const t = rng.pick(PP1);
  const { ja, jb, tot, post } = post2(t.pa, t.la, t.lb);
  return {
    id: `gen.as2-prior-post-1.${idx}`, generated: true, concepts: ["prior-to-posterior"], difficulty: 1, context: "applied",
    prompt: `A part came from machine A with prior probability $${fs(t.pa)}$, otherwise from machine B. A defect of this type occurs with probability $${fs(t.la)}$ on machine A and $${fs(t.lb)}$ on machine B. The part IS defective. Update: find the posterior probability it came from machine A. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Joint for A: $P(A) \\cdot P(\\text{defect} \\mid A) = ${fs(t.pa)} \\times ${fs(t.la)}$. Give a fraction in lowest terms.`, answer: fs(ja), accept: [], hint: `Prior times likelihood.` },
      { instruction: `Joint for B: $P(B) \\cdot P(\\text{defect} \\mid B) = ${fs(fsub(fone, t.pa))} \\times ${fs(t.lb)}$. Give a fraction in lowest terms.`, answer: fs(jb), accept: [], hint: `$P(B) = 1 - ${fs(t.pa)}$.` },
      { instruction: `Total evidence: $P(\\text{defect}) = ${fs(ja)} + ${fs(jb)}$. Give a fraction in lowest terms.`, answer: fs(tot), accept: [], hint: `Add the two joint terms (law of total probability).` },
      { instruction: `Posterior: $P(A \\mid \\text{defect}) = \\dfrac{${fs(ja)}}{${fs(tot)}}$. Give a fraction in lowest terms.`, answer: fs(post), accept: [], hint: `A's share of the total evidence.` },
    ],
    finalAnswer: { value: fs(post), unit: "" },
    solutionNarrative: `Joints: A contributes ${fs(ja)}, B contributes ${fs(jb)}, total ${fs(tot)}. The posterior is A's share: $${fs(post)}$ — moved ${post.n * t.pa.d > t.pa.n * post.d ? "up" : "down"} from the prior $${fs(t.pa)}$ because the defect is ${t.la.n * t.lb.d > t.lb.n * t.la.d ? "more" : "less"} typical of machine A.`,
  };
};
fill["as2-prior-post-2"] = (rng, idx) => {
  const prev = rng.pick([F(1, 10), F(1, 20)]);
  const sens = rng.pick([F(9, 10), F(4, 5)]);
  const fpr = rng.pick([F(1, 10), F(1, 5)]);
  const D = 1000 / prev.d * prev.n;
  const H = 1000 - D;
  const TP = (D * sens.n) / sens.d;
  const FP = (H * fpr.n) / fpr.d;
  const post = F(TP, TP + FP);
  return {
    id: `gen.as2-prior-post-2.${idx}`, generated: true, concepts: ["prior-to-posterior"], difficulty: 2, context: "applied",
    prompt: `A condition affects $${fs(prev)}$ of a population. A screening test detects it with probability $${fs(sens)}$ (sensitivity) but also flags healthy people with probability $${fs(fpr)}$ (false-positive rate). Work with NATURAL FREQUENCIES: imagine 1000 people, all tested. A person tests positive — find the posterior probability they have the condition.`,
    steps: [
      { instruction: `Of the 1000 people, how many have the condition? (Give a number.)`, answer: `${D}`, accept: [], hint: `$1000 \\times ${fs(prev)}$.` },
      { instruction: `TRUE positives: how many of those ${D} test positive? (Give a number.)`, answer: `${TP}`, accept: [], hint: `$${D} \\times ${fs(sens)}$.` },
      { instruction: `FALSE positives: how many of the ${H} healthy people test positive? (Give a number.)`, answer: `${FP}`, accept: [], hint: `$${H} \\times ${fs(fpr)}$.` },
      { instruction: `Posterior: $P(\\text{condition} \\mid +) = \\dfrac{${TP}}{${TP} + ${FP}}$. Give a fraction in lowest terms.`, answer: fs(post), accept: [`${TP}/${TP + FP}`], hint: `True positives over ALL positives.` },
    ],
    finalAnswer: { value: fs(post), unit: "" },
    solutionNarrative: `Among 1000 people: ${D} sick (${TP} test positive) and ${H} healthy (${FP} falsely positive). Of the ${TP + FP} positives, only ${TP} are real: posterior $= ${fs(post)}$. The prior (base rate) does heavy lifting — ignoring it is base-rate neglect.`,
  };
};
const PP3 = [
  { pri: [F(1, 3), F(1, 3), F(1, 3)], lik: [F(3, 4), F(1, 4), F(1, 2)], ask: 0 },
  { pri: [F(1, 2), F(1, 4), F(1, 4)], lik: [F(1, 5), F(2, 5), F(4, 5)], ask: 2 },
  { pri: [F(1, 3), F(1, 3), F(1, 3)], lik: [F(4, 5), F(1, 5), F(2, 5)], ask: 0 },
  { pri: [F(1, 2), F(1, 3), F(1, 6)], lik: [F(1, 4), F(1, 2), F(1, 2)], ask: 1 },
];
fill["as2-prior-post-3"] = (rng, idx) => {
  const t = rng.pick(PP3);
  const names = ["A", "B", "C"];
  const joints = t.pri.map((p, i) => fmul(p, t.lik[i]));
  const tot = fadd(fadd(joints[0], joints[1]), joints[2]);
  const post = fdiv(joints[t.ask], tot);
  return {
    id: `gen.as2-prior-post-3.${idx}`, generated: true, concepts: ["prior-to-posterior"], difficulty: 3, context: "applied",
    prompt: `Three suppliers provide parts with prior probabilities $P(A) = ${fs(t.pri[0])}$, $P(B) = ${fs(t.pri[1])}$, $P(C) = ${fs(t.pri[2])}$. A flaw of this kind occurs with probability $${fs(t.lik[0])}$ for A, $${fs(t.lik[1])}$ for B, and $${fs(t.lik[2])}$ for C. A part shows the flaw. Build the full Bayes table and find the posterior probability it came from supplier ${names[t.ask]}. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Joint for A: $${fs(t.pri[0])} \\times ${fs(t.lik[0])}$. Give a fraction in lowest terms.`, answer: fs(joints[0]), accept: [], hint: `Prior times likelihood.` },
      { instruction: `Joint for B: $${fs(t.pri[1])} \\times ${fs(t.lik[1])}$. Give a fraction in lowest terms.`, answer: fs(joints[1]), accept: [], hint: `Prior times likelihood.` },
      { instruction: `Joint for C: $${fs(t.pri[2])} \\times ${fs(t.lik[2])}$. Give a fraction in lowest terms.`, answer: fs(joints[2]), accept: [], hint: `Prior times likelihood.` },
      { instruction: `Total evidence: add the three joints. Give a fraction in lowest terms.`, answer: fs(tot), accept: [], hint: `$${fs(joints[0])} + ${fs(joints[1])} + ${fs(joints[2])}$.` },
      { instruction: `Posterior for ${names[t.ask]}: $\\dfrac{${fs(joints[t.ask])}}{${fs(tot)}}$. Give a fraction in lowest terms.`, answer: fs(post), accept: [], hint: `That supplier's joint over the total.` },
    ],
    finalAnswer: { value: fs(post), unit: "" },
    solutionNarrative: `The Bayes table gives joints ${fs(joints[0])}, ${fs(joints[1])}, ${fs(joints[2])} (total ${fs(tot)}), so $P(${names[t.ask]} \\mid \\text{flaw}) = ${fs(post)}$. Normalizing the joint column is the whole of Bayes' theorem.`,
  };
};

// --- sequential-updating ---
const SEQ1 = [
  { pa: F(1, 2), la: F(1, 2), lb: fone, biased: "double-headed (always heads)" },
  { pa: F(2, 3), la: F(1, 2), lb: fone, biased: "double-headed (always heads)" },
  { pa: F(1, 2), la: F(1, 2), lb: F(3, 4), biased: "biased toward heads with $P(H) = 3/4$" },
];
fill["as2-seq-update-1"] = (rng, idx) => {
  const t = rng.pick(SEQ1);
  const r1 = post2(t.pa, t.la, t.lb);
  const r2 = post2(r1.post, t.la, t.lb);
  return {
    id: `gen.as2-seq-update-1.${idx}`, generated: true, concepts: ["sequential-updating"], difficulty: 1, context: "applied",
    prompt: `A drawer holds two coins: one FAIR ($P(H) = ${fs(t.la)}$) and one ${t.biased} ($P(H) = ${fs(t.lb)}$). You grab one; the prior probability it is the fair coin is $${fs(t.pa)}$. You flip it twice and see HEADS both times. Update after EACH flip. Give fractions in lowest terms.`,
    steps: [
      { instruction: `After the first head: $P(\\text{fair} \\mid H) = \\dfrac{${fs(t.pa)} \\cdot ${fs(t.la)}}{${fs(t.pa)} \\cdot ${fs(t.la)} + ${fs(fsub(fone, t.pa))} \\cdot ${fs(t.lb)}}$. Give a fraction in lowest terms.`, answer: fs(r1.post), accept: [], hint: `Joints: fair $${fs(r1.ja)}$, other $${fs(r1.jb)}$.` },
      { instruction: `Now use $${fs(r1.post)}$ as the NEW prior and update on the second head. Give the new posterior as a fraction in lowest terms.`, answer: fs(r2.post), accept: [], hint: `Joints: $${fs(r1.post)} \\cdot ${fs(t.la)} = ${fs(r2.ja)}$ versus $${fs(fsub(fone, r1.post))} \\cdot ${fs(t.lb)} = ${fs(r2.jb)}$.` },
    ],
    finalAnswer: { value: fs(r2.post), unit: "" },
    solutionNarrative: `First head: posterior for fair drops to ${fs(r1.post)}. Feeding that back as the prior, the second head drops it to ${fs(r2.post)}. Yesterday's posterior is today's prior — evidence compounds one observation at a time.`,
  };
};
const SEQ2 = [
  { pa: F(1, 2), l1s: F(3, 4), l1h: F(1, 4), l2s: F(2, 3), l2h: F(1, 3) },
  { pa: F(1, 2), l1s: F(2, 3), l1h: F(1, 3), l2s: F(3, 5), l2h: F(2, 5) },
  { pa: F(1, 3), l1s: F(3, 4), l1h: F(1, 4), l2s: F(3, 4), l2h: F(1, 4) },
];
fill["as2-seq-update-2"] = (rng, idx) => {
  const t = rng.pick(SEQ2);
  const r1 = post2(t.pa, t.l1s, t.l1h);
  const r2 = post2(r1.post, t.l2s, t.l2h);
  return {
    id: `gen.as2-seq-update-2.${idx}`, generated: true, concepts: ["sequential-updating"], difficulty: 2, context: "applied",
    prompt: `A spam filter starts with prior $P(\\text{spam}) = ${fs(t.pa)}$ for an incoming email. Word 1 appears in spam with probability $${fs(t.l1s)}$ and in legitimate mail with probability $${fs(t.l1h)}$. Word 2 (independently) appears with probabilities $${fs(t.l2s)}$ (spam) and $${fs(t.l2h)}$ (legitimate). The email contains BOTH words. Update twice. Give fractions in lowest terms.`,
    steps: [
      { instruction: `After word 1: $P(\\text{spam} \\mid w_1) = \\dfrac{${fs(t.pa)} \\cdot ${fs(t.l1s)}}{${fs(t.pa)} \\cdot ${fs(t.l1s)} + ${fs(fsub(fone, t.pa))} \\cdot ${fs(t.l1h)}}$. Give a fraction in lowest terms.`, answer: fs(r1.post), accept: [], hint: `Joints: $${fs(r1.ja)}$ versus $${fs(r1.jb)}$.` },
      { instruction: `Use $${fs(r1.post)}$ as the new prior and update on word 2. Give the final posterior as a fraction in lowest terms.`, answer: fs(r2.post), accept: [], hint: `Joints: $${fs(r1.post)} \\cdot ${fs(t.l2s)} = ${fs(r2.ja)}$ versus $${fs(fsub(fone, r1.post))} \\cdot ${fs(t.l2h)} = ${fs(r2.jb)}$.` },
    ],
    finalAnswer: { value: fs(r2.post), unit: "" },
    solutionNarrative: `Word 1 lifts the spam probability from ${fs(t.pa)} to ${fs(r1.post)}; word 2 lifts it again to ${fs(r2.post)}. Real Bayesian spam filters chain hundreds of such updates — each word's evidence multiplies in.`,
  };
};
const SEQ3 = [
  { prev: F(1, 10), s1: F(9, 10), f1: F(1, 5), s2: F(4, 5), f2: F(1, 10) },
  { prev: F(1, 5), s1: F(3, 4), f1: F(1, 4), s2: F(3, 4), f2: F(1, 4) },
  { prev: F(1, 20), s1: F(4, 5), f1: F(1, 10), s2: F(9, 10), f2: F(1, 5) },
];
fill["as2-seq-update-3"] = (rng, idx) => {
  const t = rng.pick(SEQ3);
  const r1 = post2(t.prev, t.s1, t.f1);
  const r2 = post2(r1.post, t.s2, t.f2);
  return {
    id: `gen.as2-seq-update-3.${idx}`, generated: true, concepts: ["sequential-updating"], difficulty: 3, context: "applied",
    prompt: `A condition has prevalence $${fs(t.prev)}$. Test 1 has sensitivity $${fs(t.s1)}$ and false-positive rate $${fs(t.f1)}$. Test 2 (independent given the true state) has sensitivity $${fs(t.s2)}$ and false-positive rate $${fs(t.f2)}$. A patient tests POSITIVE on both, taken one after the other. Chain the updates. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Joint for "condition and positive on test 1": $${fs(t.prev)} \\times ${fs(t.s1)}$. Give a fraction in lowest terms.`, answer: fs(r1.ja), accept: [], hint: `Prior times sensitivity.` },
      { instruction: `Posterior after test 1: $\\dfrac{${fs(r1.ja)}}{${fs(r1.ja)} + ${fs(r1.jb)}}$ (the second term is $${fs(fsub(fone, t.prev))} \\times ${fs(t.f1)}$). Give a fraction in lowest terms.`, answer: fs(r1.post), accept: [], hint: `True-positive share of all positives.` },
      { instruction: `Now the prior is $${fs(r1.post)}$. Update on the second positive: $\\dfrac{${fs(r1.post)} \\cdot ${fs(t.s2)}}{${fs(r1.post)} \\cdot ${fs(t.s2)} + ${fs(fsub(fone, r1.post))} \\cdot ${fs(t.f2)}}$. Give a fraction in lowest terms.`, answer: fs(r2.post), accept: [], hint: `Joints: $${fs(r2.ja)}$ versus $${fs(r2.jb)}$.` },
    ],
    finalAnswer: { value: fs(r2.post), unit: "" },
    solutionNarrative: `Test 1 raises the probability from ${fs(t.prev)} to ${fs(r1.post)}; the second independent positive raises it to ${fs(r2.post)}. This is exactly why screening protocols confirm with a second test before treating — posteriors compound.`,
  };
};

// --- bayes-factors-and-odds ---
const ODDS_P = [F(1, 4), F(1, 3), F(1, 5), F(2, 5)];
fill["as2-bayes-odds-1"] = (rng, idx) => {
  const p = rng.pick(ODDS_P);
  const lr = rng.pick([2, 3, 4, 6]);
  const odds = F(p.n, p.d - p.n);
  const po = fmul(odds, F(lr, 1));
  const prob = F(po.n, po.n + po.d);
  return {
    id: `gen.as2-bayes-odds-1.${idx}`, generated: true, concepts: ["bayes-factors-and-odds"], difficulty: 1, context: "abstract",
    prompt: `A hypothesis has prior probability $P(H) = ${fs(p)}$. Evidence arrives with likelihood ratio (Bayes factor) $\\mathrm{LR} = ${lr}$. Use the odds form of Bayes: posterior odds $=$ prior odds $\\times$ LR. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Prior odds $= \\dfrac{P(H)}{1 - P(H)} = \\dfrac{${fs(p)}}{${fs(fsub(fone, p))}}$. Give a fraction in lowest terms.`, answer: fs(odds), accept: [], hint: `${p.n} parts for, ${p.d - p.n} parts against.` },
      { instruction: `Posterior odds $= ${fs(odds)} \\times ${lr}$. Give a fraction in lowest terms (a whole number counts).`, answer: fs(po), accept: [], hint: `Multiply the numerator by ${lr}, then reduce.` },
      { instruction: `Convert back: $P(H \\mid E) = \\dfrac{\\text{odds}}{1 + \\text{odds}} = \\dfrac{${fs(po)}}{1 + ${fs(po)}}$. Give a fraction in lowest terms.`, answer: fs(prob), accept: [], hint: `Odds $a/b$ mean probability $\\frac{a}{a+b}$.` },
    ],
    finalAnswer: { value: fs(prob), unit: "" },
    solutionNarrative: `Prior odds ${fs(odds)}, times LR ${lr}, gives posterior odds ${fs(po)}, i.e. probability ${fs(prob)}. In odds form, Bayes' theorem is a single multiplication.`,
  };
};
const LR2 = [
  { s: F(9, 10), f: F(1, 10), lr: 9 },
  { s: F(3, 4), f: F(1, 4), lr: 3 },
  { s: F(4, 5), f: F(1, 5), lr: 4 },
  { s: F(3, 5), f: F(1, 10), lr: 6 },
];
fill["as2-bayes-odds-2"] = (rng, idx) => {
  const t = rng.pick(LR2);
  const prev = rng.pick([F(1, 10), F(1, 4), F(1, 5)]);
  const odds = F(prev.n, prev.d - prev.n);
  const po = fmul(odds, F(t.lr, 1));
  const prob = F(po.n, po.n + po.d);
  return {
    id: `gen.as2-bayes-odds-2.${idx}`, generated: true, concepts: ["bayes-factors-and-odds"], difficulty: 2, context: "applied",
    prompt: `A diagnostic test has sensitivity $${fs(t.s)}$ and false-positive rate $${fs(t.f)}$. The condition's prevalence is $${fs(prev)}$. A patient tests positive. Work in odds. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Likelihood ratio: $\\mathrm{LR} = \\dfrac{P(+ \\mid \\text{sick})}{P(+ \\mid \\text{healthy})} = \\dfrac{${fs(t.s)}}{${fs(t.f)}}$. (Give a whole number.)`, answer: `${t.lr}`, accept: [], hint: `Divide the two fractions.` },
      { instruction: `Prior odds of being sick: $\\dfrac{${fs(prev)}}{${fs(fsub(fone, prev))}}$. Give a fraction in lowest terms.`, answer: fs(odds), accept: [], hint: `${prev.n} sick for every ${prev.d - prev.n} healthy.` },
      { instruction: `Posterior odds $= ${fs(odds)} \\times ${t.lr}$. Give a fraction in lowest terms (a whole number counts).`, answer: fs(po), accept: [], hint: `One multiplication.` },
      { instruction: `Posterior probability $= \\dfrac{${fs(po)}}{1 + ${fs(po)}}$. Give a fraction in lowest terms.`, answer: fs(prob), accept: [], hint: `Odds $a/b$ $\\to$ probability $\\frac{a}{a+b}$.` },
    ],
    finalAnswer: { value: fs(prob), unit: "" },
    solutionNarrative: `LR $= ${t.lr}$, prior odds ${fs(odds)}, so posterior odds $= ${fs(po)}$ and the posterior probability is ${fs(prob)}. A strong test can still leave a modest posterior when the prior odds are long.`,
  };
};
fill["as2-bayes-odds-3"] = (rng, idx) => {
  const lr1 = rng.pick([2, 3, 4]);
  const lr2 = rng.pick([3, 4, 6]);
  const prev = rng.pick([F(1, 10), F(1, 5)]);
  const odds = F(prev.n, prev.d - prev.n);
  const lrTot = lr1 * lr2;
  const po = fmul(odds, F(lrTot, 1));
  const prob = F(po.n, po.n + po.d);
  return {
    id: `gen.as2-bayes-odds-3.${idx}`, generated: true, concepts: ["bayes-factors-and-odds"], difficulty: 3, context: "applied",
    prompt: `Two INDEPENDENT pieces of evidence support a hypothesis with likelihood ratios $\\mathrm{LR}_1 = ${lr1}$ and $\\mathrm{LR}_2 = ${lr2}$. The prior probability is $${fs(prev)}$. In odds form, independent Bayes factors MULTIPLY. Give fractions in lowest terms.`,
    steps: [
      { instruction: `Combined likelihood ratio: $\\mathrm{LR}_1 \\times \\mathrm{LR}_2$. (Give a whole number.)`, answer: `${lrTot}`, accept: [], hint: `$${lr1} \\times ${lr2}$.` },
      { instruction: `Prior odds: $\\dfrac{${fs(prev)}}{${fs(fsub(fone, prev))}}$. Give a fraction in lowest terms.`, answer: fs(odds), accept: [], hint: `${prev.n} for, ${prev.d - prev.n} against.` },
      { instruction: `Posterior odds $= ${fs(odds)} \\times ${lrTot}$. Give a fraction in lowest terms (a whole number counts).`, answer: fs(po), accept: [], hint: `Multiply and reduce.` },
      { instruction: `Posterior probability $= \\dfrac{${fs(po)}}{1 + ${fs(po)}}$. Give a fraction in lowest terms.`, answer: fs(prob), accept: [], hint: `Odds $a/b$ $\\to$ $\\frac{a}{a+b}$.` },
    ],
    finalAnswer: { value: fs(prob), unit: "" },
    solutionNarrative: `The evidence combines into LR $= ${lrTot}$; posterior odds $= ${fs(po)}$, probability ${fs(prob)}. Multiplying Bayes factors is how forensic and diagnostic evidence stacks — as long as the pieces are truly independent.`,
  };
};

// --- bayesian-vs-frequentist ---
const BF1 = [
  { claim: "There is a ninety-five percent probability that the true mean lies in this interval, given the data and my prior" },
  { claim: "Given everything observed so far and the prior, the parameter lies in this range with ninety-five percent probability" },
];
fill["as2-bayes-freq-1"] = (rng, idx) => {
  const t = rng.pick(BF1);
  return {
    id: `gen.as2-bayes-freq-1.${idx}`, generated: true, concepts: ["bayesian-vs-frequentist"], difficulty: 1, context: "abstract",
    prompt: `An analyst says: "${t.claim}." Identify which framework licenses this statement.`,
    steps: [
      { instruction: `Which interval permits a direct probability statement about the parameter itself? Type 'credible interval' or 'confidence interval'.`, answer: "credible interval", accept: ["credible"], hint: `Bayesian intervals treat the parameter as random; frequentist confidence describes the PROCEDURE.` },
      { instruction: `In the frequentist framework, is the true parameter treated as fixed or random? Type 'fixed' or 'random'.`, answer: "fixed", accept: [], hint: `To a frequentist, only the DATA (and hence the interval) vary from sample to sample.` },
    ],
    finalAnswer: { value: "credible interval", unit: "" },
    solutionNarrative: `Only a Bayesian CREDIBLE interval supports "the parameter is in here with probability such-and-such" — because Bayesians put a distribution on the parameter. Frequentists hold the parameter fixed, so a 95% CONFIDENCE interval promises only that 95% of intervals built this way would capture it.`,
  };
};
const BF2 = [
  {
    sB: "Given the observed data and the prior, the probability the new drug beats placebo is ninety-three percent",
    sF: "If the drug truly had no effect, data this extreme would occur in fewer than five percent of repeated trials",
  },
  {
    sB: "After seeing the data, the probability the conversion rate exceeds the old one is ninety percent, given our prior",
    sF: "In repeated samples, ninety-five percent of intervals constructed this way would capture the true rate",
  },
];
fill["as2-bayes-freq-2"] = (rng, idx) => {
  const t = rng.pick(BF2);
  const first = rng.pick([true, false]);
  const s1 = first ? t.sB : t.sF, a1 = first ? "bayesian" : "frequentist";
  const s2 = first ? t.sF : t.sB, a2 = first ? "frequentist" : "bayesian";
  return {
    id: `gen.as2-bayes-freq-2.${idx}`, generated: true, concepts: ["bayesian-vs-frequentist"], difficulty: 2, context: "applied",
    prompt: `Two analysts summarize the same study. Classify each statement's framework.`,
    steps: [
      { instruction: `Statement 1: "${s1}." Type 'bayesian' or 'frequentist'.`, answer: a1, accept: [], hint: `Probability ABOUT the hypothesis/parameter (given data and prior) is Bayesian; long-run frequency over repeated trials is frequentist.` },
      { instruction: `Statement 2: "${s2}." Type 'bayesian' or 'frequentist'.`, answer: a2, accept: [], hint: `The other one of the pair.` },
      { instruction: `Does the Bayesian conclusion depend on the choice of prior? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `The posterior is prior times likelihood, renormalized.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Probability statements about the parameter given the data are Bayesian; statements about how the procedure behaves over hypothetical repetitions are frequentist. And yes — a Bayesian posterior always inherits some influence from the prior, which shrinks as data accumulate.`,
  };
};
const LOSS3 = [
  { pP: 20, D: 50, c: 20 },   // ship: 10 < 20
  { pP: 20, D: 200, c: 20 },  // recall: 40 > 20
  { pP: 10, D: 300, c: 25 },  // recall: 30 > 25
  { pP: 25, D: 60, c: 30 },   // ship: 15 < 30
  { pP: 10, D: 100, c: 15 },  // ship: 10 < 15
];
fill["as2-bayes-freq-3"] = (rng, idx) => {
  const t = rng.pick(LOSS3);
  const elShip = (t.pP * t.D) / 100;
  const decision = elShip < t.c ? "ship" : "recall";
  return {
    id: `gen.as2-bayes-freq-3.${idx}`, generated: true, concepts: ["bayesian-vs-frequentist"], difficulty: 3, context: "applied",
    prompt: `A Bayesian decision: after testing, the posterior probability a batch is defective is $${t.pP / 100}$. The loss table (in thousands of dollars):\n\n| Action | Batch defective | Batch fine |\n|---|---|---|\n| Recall | ${t.c} | ${t.c} |\n| Ship | ${t.D} | 0 |\n\nChoose the action with the SMALLER expected loss.`,
    steps: [
      { instruction: `Expected loss of RECALL: it costs ${t.c} in either state. (Give a number.)`, answer: `${t.c}`, accept: [], hint: `$${t.pP / 100} \\cdot ${t.c} + ${(100 - t.pP) / 100} \\cdot ${t.c} = ${t.c}$.` },
      { instruction: `Expected loss of SHIP: $${t.pP / 100} \\cdot ${t.D} + ${(100 - t.pP) / 100} \\cdot 0$. (Give a number.)`, answer: `${elShip}`, accept: [], hint: `Posterior probability times the loss if defective.` },
      { instruction: `Which action minimizes expected loss? Type 'recall' or 'ship'.`, answer: decision, accept: [], hint: `Compare $${t.c}$ with $${elShip}$.` },
    ],
    finalAnswer: { value: decision, unit: "" },
    solutionNarrative: `Expected losses: recall $${t.c}$, ship $${elShip}$. The Bayesian decision rule picks the minimum: ${decision}. This is the payoff of a posterior — it plugs directly into decisions, which a p-value alone cannot do.`,
  };
};
