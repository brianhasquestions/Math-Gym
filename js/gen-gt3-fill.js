// gen-gt3-fill.js
// Parametric generators for the Game Theory subject, topics
//   game-theory.bargaining-and-cooperative
//   game-theory.auctions-and-mechanisms
//   game-theory.evolutionary-and-applications
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// merged into the registry like the other gen-*-fill.js packs. Prefix: gt3-.
// Every generator is deterministic from the passed rng, has a FIXED difficulty
// and concept (so tier coverage is exact), and computes every numeric answer
// in-pack from the SAME parameters shown to the learner, so answers self-check.
//
// Engineering guarantees for clean answers:
//   * Bargaining: pie/disagreement chosen so surplus is even -> half-surplus is
//     an integer; Nash shares are integers.
//   * Shapley: singleton values 0, pair values are multiples of 6, grand-coalition
//     chosen so phi_i = (1/3)v(N) + (1/6)[v(ij)+v(ik)-2 v(jk)] are positive integers
//     summing to v(N). Verified against a brute-force 6-ordering computation.
//   * Auctions: second-price prices/surpluses are integers; first-price uses
//     n in {2,4,5} so (n-1)/n and its product with v are exact fractions/integers.
//   * Cournot: (a-c) in {3,6,9,12,18} (divisible by 3) so q=(a-c)/3 is an integer.
//   * Hawk-Dove: (V,C) chosen so V/C simplifies to a listed fraction/decimal.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
// Menu-answer strings are always descriptive words (never bare digits), per the
// grader rules (a bare digit collapses to polynomial 0).

// Brute-force 3-player Shapley from a v(S) table keyed by sorted-index strings.
function shapley3(v) {
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const key = (s) => s.slice().sort().join("");
  const phi = [0, 0, 0];
  for (const p of perms) {
    let prev = [];
    for (const i of p) {
      const m = (v[key(prev.concat(i))] || 0) - (v[key(prev)] || 0);
      phi[i] += m;
      prev = prev.concat(i);
    }
  }
  return phi.map((x) => x / 6);
}

// Clean asymmetric 3-player Shapley families (singletons 0). Verified integer.
// Fields: p01,p02,p12 pair values; gr grand value; s = [phi1,phi2,phi3].
const SHAP3 = [
  { p01: 60, p02: 60, p12: 30, gr: 90, s: [40, 25, 25] },
  { p01: 40, p02: 50, p12: 30, gr: 90, s: [35, 25, 30] },
  { p01: 24, p02: 18, p12: 12, gr: 48, s: [19, 16, 13] },
  { p01: 30, p02: 30, p12: 30, gr: 60, s: [20, 20, 20] },
  { p01: 12, p02: 12, p12: 6, gr: 30, s: [12, 9, 9] },
  { p01: 36, p02: 24, p12: 18, gr: 60, s: [24, 21, 15] },
];
// Sanity: assert each SHAP3 entry actually yields its listed Shapley vector.
for (const e of SHAP3) {
  const v = { "": 0, 0: 0, 1: 0, 2: 0, "01": e.p01, "02": e.p02, "12": e.p12, "012": e.gr };
  const s = shapley3(v);
  if (s.some((x, i) => x !== e.s[i])) throw new Error(`SHAP3 table wrong for ${JSON.stringify(e)}: got ${s}`);
}

export const fill = {};

// ===========================================================================
// TOPIC 1: game-theory.bargaining-and-cooperative
//   concepts: bargaining-basics, nash-bargaining-solution,
//             coalitions-and-characteristic-function, shapley-value
// ===========================================================================

// --- bargaining-basics ---
fill["gt3-bargbasic-1"] = (rng, idx) => {
  const d1 = rng.int(1, 5) * 10, d2 = rng.int(1, 5) * 10;
  const surplus = rng.int(2, 6) * 10;
  const S = d1 + d2 + surplus;
  return {
    id: `gen.gt3-bargbasic-1.${idx}`, generated: true, concepts: ["bargaining-basics"], difficulty: 1, context: "applied",
    prompt: `Two parties can jointly claim a pie of size $S = ${S}$, but each could instead walk away with a guaranteed amount: the disagreement point is $(${d1}, ${d2})$. Find the negotiable **surplus**.`,
    steps: [
      { instruction: `Surplus $= S - d_1 - d_2 = ${S} - ${d1} - ${d2}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `Subtract both walk-away values from the pie.` },
    ],
    finalAnswer: { value: `${surplus}`, unit: "" },
    solutionNarrative: `Surplus $= ${S} - ${d1} - ${d2} = ${surplus}$. Only this is created by cooperating; the rest merely replaces each party's threat value.`,
  };
};
fill["gt3-bargbasic-2"] = (rng, idx) => {
  const d1 = rng.int(2, 8) * 10, d2 = rng.int(2, 8) * 10;
  const surplus = rng.int(2, 5) * 20; // even -> integer half
  const S = d1 + d2 + surplus;
  const half = surplus / 2;
  return {
    id: `gen.gt3-bargbasic-2.${idx}`, generated: true, concepts: ["bargaining-basics"], difficulty: 2, context: "applied",
    prompt: `A buyer and seller create a joint value $S = ${S}$ by trading. Their outside options are $(${d1}, ${d2})$. Find the surplus, then the fair (even) share of it each receives.`,
    steps: [
      { instruction: `Surplus $= ${S} - ${d1} - ${d2}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `Pie minus both outside options.` },
      { instruction: `Each party's fair share of the surplus (half of it): $${surplus}/2$. Give a number.`, answer: `${half}`, accept: [], hint: `Split the surplus evenly.` },
    ],
    finalAnswer: { value: `${half}`, unit: "" },
    solutionNarrative: `Surplus $= ${surplus}$, split evenly gives $${half}$ of gain to each party over its outside option.`,
  };
};
fill["gt3-bargbasic-3"] = (rng, idx) => {
  const d1 = rng.int(3, 9) * 10, d2 = rng.int(3, 9) * 10;
  const surplus = rng.int(3, 6) * 20;
  const S = d1 + d2 + surplus;
  const half = surplus / 2;
  const u1 = d1 + half;
  return {
    id: `gen.gt3-bargbasic-3.${idx}`, generated: true, concepts: ["bargaining-basics"], difficulty: 3, context: "applied",
    prompt: `Two firms bargain over a joint profit $S = ${S}$; their best alternatives are $(${d1}, ${d2})$. Compute the surplus, half-surplus, and firm 1's total share, and confirm firm 1's share exceeds its outside option.`,
    steps: [
      { instruction: `Surplus $= ${S} - ${d1} - ${d2}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `$S - d_1 - d_2$.` },
      { instruction: `Half-surplus $= ${surplus}/2$. Give a number.`, answer: `${half}`, accept: [], hint: `Divide by 2.` },
      { instruction: `Firm 1's total share $u_1 = d_1 + \\text{half} = ${d1} + ${half}$. Give a number.`, answer: `${u1}`, accept: [], hint: `Outside option plus half the surplus.` },
      { instruction: `Does firm 1's share $${u1}$ exceed its outside option $${d1}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `A cooperating party always beats walking away.` },
    ],
    finalAnswer: { value: `${u1}`, unit: "" },
    solutionNarrative: `Surplus $= ${surplus}$, half is $${half}$, so $u_1 = ${d1} + ${half} = ${u1}$, comfortably above the outside option $${d1}$.`,
  };
};

// --- nash-bargaining-solution ---
fill["gt3-nashbarg-1"] = (rng, idx) => {
  const d = rng.int(0, 4) * 10;
  const surplus = rng.int(2, 6) * 20;
  const S = 2 * d + surplus;
  const share = d + surplus / 2;
  return {
    id: `gen.gt3-nashbarg-1.${idx}`, generated: true, concepts: ["nash-bargaining-solution"], difficulty: 1, context: "abstract",
    prompt: `A pie of size $S = ${S}$ has the symmetric disagreement point $(${d}, ${d})$. Using $u_i = d_i + \\tfrac{S - d_1 - d_2}{2}$, find each player's Nash bargaining share.`,
    steps: [
      { instruction: `Share $= ${d} + (${S} - ${d} - ${d})/2$. Give a number.`, answer: `${share}`, accept: [], hint: `Surplus is $${surplus}$; add half of it to the threat value.` },
    ],
    finalAnswer: { value: `${share}`, unit: "" },
    solutionNarrative: `Surplus $= ${surplus}$; each share is $${d} + ${surplus / 2} = ${share}$. Symmetric threats give an even split of the pie.`,
  };
};
fill["gt3-nashbarg-2"] = (rng, idx) => {
  const d1 = rng.int(1, 5) * 20, d2 = rng.int(1, 5) * 20;
  const surplus = rng.int(2, 5) * 20;
  const S = d1 + d2 + surplus;
  const half = surplus / 2;
  const u1 = d1 + half, u2 = d2 + half;
  return {
    id: `gen.gt3-nashbarg-2.${idx}`, generated: true, concepts: ["nash-bargaining-solution"], difficulty: 2, context: "abstract",
    prompt: `Apply the Nash bargaining solution to a pie $S = ${S}$ with disagreement point $(${d1}, ${d2})$. Use $u_i = d_i + \\tfrac{S - d_1 - d_2}{2}$.`,
    steps: [
      { instruction: `Surplus $= ${S} - ${d1} - ${d2}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `$S - d_1 - d_2$.` },
      { instruction: `Half-surplus $= ${surplus}/2$. Give a number.`, answer: `${half}`, accept: [], hint: `Divide by 2.` },
      { instruction: `Player 1's share $u_1 = ${d1} + ${half}$. Give a number.`, answer: `${u1}`, accept: [], hint: `Threat plus half-surplus.` },
      { instruction: `Player 2's share $u_2 = ${d2} + ${half}$. Give a number.`, answer: `${u2}`, accept: [], hint: `Threat plus half-surplus.` },
    ],
    finalAnswer: { value: `(${u1}, ${u2})`, unit: "" },
    solutionNarrative: `Surplus $= ${surplus}$, half $= ${half}$. So $u_1 = ${u1}$ and $u_2 = ${u2}$, which sum to $${S}$. Equal gains, but the stronger threat earns more in total.`,
  };
};
fill["gt3-nashbarg-3"] = (rng, idx) => {
  const d1 = rng.int(2, 6) * 30, d2 = rng.int(2, 6) * 30;
  const surplus = rng.int(2, 5) * 40;
  const S = d1 + d2 + surplus;
  const half = surplus / 2;
  const u1 = d1 + half, u2 = d2 + half;
  return {
    id: `gen.gt3-nashbarg-3.${idx}`, generated: true, concepts: ["nash-bargaining-solution"], difficulty: 3, context: "applied",
    prompt: `Two partners split a venture worth $S = ${S}$; their best alternatives are $(${d1}, ${d2})$. Compute the full Nash bargaining outcome $(u_1, u_2)$ and confirm the shares recover the pie.`,
    steps: [
      { instruction: `Surplus $= ${S} - ${d1} - ${d2}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `$S - d_1 - d_2$.` },
      { instruction: `Half-surplus $= ${surplus}/2$. Give a number.`, answer: `${half}`, accept: [], hint: `Divide by 2.` },
      { instruction: `Partner 1's share $u_1 = ${d1} + ${half}$. Give a number.`, answer: `${u1}`, accept: [], hint: `Alternative plus half-surplus.` },
      { instruction: `Partner 2's share $u_2 = ${d2} + ${half}$. Give a number.`, answer: `${u2}`, accept: [], hint: `Alternative plus half-surplus.` },
      { instruction: `Do the shares sum to the pie $${S}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `$${u1} + ${u2}$.` },
    ],
    finalAnswer: { value: `(${u1}, ${u2})`, unit: "" },
    solutionNarrative: `Surplus $= ${surplus}$, half $= ${half}$. $u_1 = ${u1}$, $u_2 = ${u2}$, and $${u1} + ${u2} = ${S}$ recovers the whole venture value.`,
  };
};

// --- coalitions-and-characteristic-function ---
fill["gt3-coalition-1"] = (rng, idx) => {
  const v1 = rng.int(1, 6) * 5, v2 = rng.int(1, 6) * 5, syn = rng.int(1, 5) * 5;
  const v12 = v1 + v2 + syn;
  return {
    id: `gen.gt3-coalition-1.${idx}`, generated: true, concepts: ["coalitions-and-characteristic-function"], difficulty: 1, context: "abstract",
    prompt: `A cooperative game has $v(\\{1\\}) = ${v1}$, $v(\\{2\\}) = ${v2}$, and $v(\\{1,2\\}) = ${v12}$. How much **synergy** does the coalition $\\{1,2\\}$ create beyond the players acting alone?`,
    steps: [
      { instruction: `Synergy $= v(\\{1,2\\}) - v(\\{1\\}) - v(\\{2\\}) = ${v12} - ${v1} - ${v2}$. Give a number.`, answer: `${syn}`, accept: [], hint: `Coalition value minus both singletons.` },
    ],
    finalAnswer: { value: `${syn}`, unit: "" },
    solutionNarrative: `Synergy $= ${v12} - ${v1} - ${v2} = ${syn}$: the pair is worth this much more than the sum of its parts.`,
  };
};
fill["gt3-coalition-2"] = (rng, idx) => {
  const e = rng.pick(SHAP3);
  const table = `| $S$ | $v(S)$ |\n|---|---|\n| $\\{1\\}$ | 0 |\n| $\\{2\\}$ | 0 |\n| $\\{3\\}$ | 0 |\n| $\\{1,2\\}$ | ${e.p01} |\n| $\\{1,3\\}$ | ${e.p02} |\n| $\\{2,3\\}$ | ${e.p12} |\n| $\\{1,2,3\\}$ | ${e.gr} |`;
  return {
    id: `gen.gt3-coalition-2.${idx}`, generated: true, concepts: ["coalitions-and-characteristic-function"], difficulty: 2, context: "abstract",
    prompt: `A 3-player game has the value table below.\n\n${table}\n\nAnswer the coalition-value questions.`,
    steps: [
      { instruction: `What is $v(\\{1,3\\})$? Give a number.`, answer: `${e.p02}`, accept: [], hint: `Read the $\\{1,3\\}$ row.` },
      { instruction: `What is $v(\\{1,2,3\\})$, the grand coalition? Give a number.`, answer: `${e.gr}`, accept: [], hint: `All three players together.` },
      { instruction: `Synergy of pair $\\{2,3\\}$ (singletons are 0): $${e.p12} - 0 - 0$. Give a number.`, answer: `${e.p12}`, accept: [], hint: `Pair value minus its two zero singletons.` },
    ],
    finalAnswer: { value: `${e.gr}`, unit: "" },
    solutionNarrative: `From the table $v(\\{1,3\\}) = ${e.p02}$ and $v(N) = ${e.gr}$; the pair $\\{2,3\\}$ contributes all $${e.p12}$ as synergy since both singletons are 0.`,
  };
};
fill["gt3-coalition-3"] = (rng, idx) => {
  const e = rng.pick(SHAP3);
  const bestPair = Math.max(e.p01, e.p02, e.p12);
  const extra = e.gr - bestPair;
  const table = `| $S$ | $v(S)$ |\n|---|---|\n| singleton $\\{i\\}$ | 0 |\n| $\\{1,2\\}$ | ${e.p01} |\n| $\\{1,3\\}$ | ${e.p02} |\n| $\\{2,3\\}$ | ${e.p12} |\n| $\\{1,2,3\\}$ | ${e.gr} |`;
  return {
    id: `gen.gt3-coalition-3.${idx}`, generated: true, concepts: ["coalitions-and-characteristic-function"], difficulty: 3, context: "applied",
    prompt: `Three ventures can cooperate. Each alone earns 0; the value table is below (units of \\$M).\n\n${table}\n\nCheck superadditivity: does the grand coalition beat the best pair-plus-singleton split?`,
    steps: [
      { instruction: `Best pair-plus-singleton value = largest pair value + 0. The largest pair value is $${bestPair}$. Give that sum.`, answer: `${bestPair}`, accept: [], hint: `Add 0 for the leftover singleton.` },
      { instruction: `Is the grand coalition $v(N) = ${e.gr}$ at least that big? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Compare $${e.gr}$ with $${bestPair}$.` },
      { instruction: `Extra value from the grand coalition: $${e.gr} - ${bestPair}$. Give a number.`, answer: `${extra}`, accept: [], hint: `Grand value minus the best split.` },
    ],
    finalAnswer: { value: `${extra}`, unit: "" },
    solutionNarrative: `The best pair-plus-singleton split is $${bestPair} + 0 = ${bestPair}$, below $v(N) = ${e.gr}$, so merging all three adds $\\$${extra}$M — the game is superadditive.`,
  };
};

// --- shapley-value ---
fill["gt3-shapley-1"] = (rng, idx) => {
  // 2-player Shapley: own value + half the synergy.
  const v1 = rng.int(1, 5) * 4, v2 = rng.int(1, 5) * 4, syn = rng.int(1, 4) * 4;
  const v12 = v1 + v2 + syn;
  const phi1 = v1 + syn / 2;
  return {
    id: `gen.gt3-shapley-1.${idx}`, generated: true, concepts: ["shapley-value"], difficulty: 1, context: "abstract",
    prompt: `A 2-player game has $v(\\{1\\}) = ${v1}$, $v(\\{2\\}) = ${v2}$, $v(\\{1,2\\}) = ${v12}$. The Shapley value gives each player its own value plus half the shared synergy. Find player 1's Shapley value.`,
    steps: [
      { instruction: `Synergy $= ${v12} - ${v1} - ${v2}$. Give a number.`, answer: `${syn}`, accept: [], hint: `Joint value minus both solo values.` },
      { instruction: `Player 1's Shapley value $= ${v1} + \\tfrac12(${syn})$. Give a number.`, answer: `${phi1}`, accept: [], hint: `Own value plus half the synergy.` },
    ],
    finalAnswer: { value: `${phi1}`, unit: "" },
    solutionNarrative: `Synergy $= ${syn}$, so $\\varphi_1 = ${v1} + ${syn / 2} = ${phi1}$ (and $\\varphi_2 = ${v2 + syn / 2}$, summing to $${v12}$).`,
  };
};
fill["gt3-shapley-2"] = (rng, idx) => {
  // Symmetric 3-player: all pairs equal, phi = v(N)/3 (chosen divisible by 3).
  const each = rng.int(2, 8) * 5;            // per-player share
  const gr = 3 * each;
  const pair = rng.int(1, 2) * each;         // symmetric pair value (any works)
  return {
    id: `gen.gt3-shapley-2.${idx}`, generated: true, concepts: ["shapley-value"], difficulty: 2, context: "abstract",
    prompt: `A symmetric 3-player game has all singletons 0, all pairs $v(\\{i,j\\}) = ${pair}$, and $v(\\{1,2,3\\}) = ${gr}$. By symmetry the three Shapley values are equal and sum to $v(N)$. Find each player's Shapley value.`,
    steps: [
      { instruction: `Efficiency: equal shares summing to $v(N) = ${gr}$ means each is $${gr}/3$. Give a number.`, answer: `${each}`, accept: [], hint: `Divide the grand-coalition value by 3.` },
    ],
    finalAnswer: { value: `${each}`, unit: "" },
    solutionNarrative: `In a symmetric game every player has the same marginal contribution, so by efficiency each Shapley value is $v(N)/3 = ${gr}/3 = ${each}$.`,
  };
};
fill["gt3-shapley-3"] = (rng, idx) => {
  const e = rng.pick(SHAP3);
  const base = e.gr / 3; // guaranteed integer (gr divisible by 3 in SHAP3)
  const table = `| $S$ | $v(S)$ |\n|---|---|\n| singleton $\\{i\\}$ | 0 |\n| $\\{1,2\\}$ | ${e.p01} |\n| $\\{1,3\\}$ | ${e.p02} |\n| $\\{2,3\\}$ | ${e.p12} |\n| $\\{1,2,3\\}$ | ${e.gr} |`;
  // shortcut: phi_i = (1/3)v(N) + (1/6)[v(ij)+v(ik)-2 v(jk)]
  // player1: pairs 12,13 present, opposite pair 23; player2: 12,23 opp 13; player3: 13,23 opp 12
  return {
    id: `gen.gt3-shapley-3.${idx}`, generated: true, concepts: ["shapley-value"], difficulty: 3, context: "abstract",
    prompt: `Compute all three Shapley values for the game with singletons 0 and the table below, using $\\varphi_i = \\tfrac13 v(N) + \\tfrac16[v(ij) + v(ik) - 2\\,v(jk)]$, then verify they sum to $v(N)$.\n\n${table}`,
    steps: [
      { instruction: `Base term shared by all: $\\tfrac13 v(N) = \\tfrac13(${e.gr})$. Give a number.`, answer: `${base}`, accept: [], hint: `One-third of the grand-coalition value.` },
      { instruction: `Player 1: $${base} + \\tfrac16[${e.p01} + ${e.p02} - 2(${e.p12})]$. Give a number.`, answer: `${e.s[0]}`, accept: [], hint: `Player 1's pairs are $\\{1,2\\}$ and $\\{1,3\\}$; the opposite pair is $\\{2,3\\}$.` },
      { instruction: `Player 2: $${base} + \\tfrac16[${e.p01} + ${e.p12} - 2(${e.p02})]$. Give a number.`, answer: `${e.s[1]}`, accept: [], hint: `Player 2's pairs are $\\{1,2\\}$ and $\\{2,3\\}$; the opposite pair is $\\{1,3\\}$.` },
      { instruction: `Player 3: $${base} + \\tfrac16[${e.p02} + ${e.p12} - 2(${e.p01})]$. Give a number.`, answer: `${e.s[2]}`, accept: [], hint: `Player 3's pairs are $\\{1,3\\}$ and $\\{2,3\\}$; the opposite pair is $\\{1,2\\}$.` },
      { instruction: `Do the three values sum to $v(N) = ${e.gr}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `$${e.s[0]} + ${e.s[1]} + ${e.s[2]}$.` },
    ],
    finalAnswer: { value: `(${e.s[0]}, ${e.s[1]}, ${e.s[2]})`, unit: "" },
    solutionNarrative: `$\\varphi = (${e.s[0]}, ${e.s[1]}, ${e.s[2]})$, summing to $${e.gr} = v(N)$. Players pivotal to higher-value pairs earn more.`,
  };
};

// ===========================================================================
// TOPIC 2: game-theory.auctions-and-mechanisms
//   concepts: auction-formats, second-price-truthfulness,
//             first-price-bidding, expected-revenue-and-efficiency
// ===========================================================================

// --- auction-formats ---
fill["gt3-format-1"] = (rng, idx) => {
  const scen = rng.pick([
    { desc: "the highest bidder wins and pays the SECOND-highest bid", ans: "second-price", acc: ["second price", "vickrey"] },
    { desc: "the highest bidder wins and pays their OWN bid", ans: "first-price", acc: ["first price"] },
    { desc: "the price rises openly until only one bidder remains", ans: "English", acc: ["english", "ascending"] },
    { desc: "the price starts high and ticks DOWN until a bidder accepts", ans: "Dutch", acc: ["dutch", "descending"] },
  ]);
  return {
    id: `gen.gt3-format-1.${idx}`, generated: true, concepts: ["auction-formats"], difficulty: 1, context: "abstract",
    prompt: `Identify the auction format where ${scen.desc}. Choose exactly one of: first-price, second-price, English, Dutch.`,
    steps: [
      { instruction: `Name the format. Type one of: first-price, second-price, English, Dutch.`, answer: scen.ans, accept: scen.acc, hint: `Match the rule to its standard name.` },
    ],
    finalAnswer: { value: scen.ans, unit: "" },
    solutionNarrative: `The rule "${scen.desc}" defines the ${scen.ans} auction.`,
  };
};
fill["gt3-format-2"] = (rng, idx) => {
  const scen = rng.pick([
    { open: "ascending English", ans: "second-price", acc: ["second price", "vickrey"], why: "the winner pays roughly where the last rival dropped out — the second-highest value" },
    { open: "descending Dutch", ans: "first-price", acc: ["first price"], why: "a bidder commits to an accept-price before learning the outcome, exactly the sealed first-price problem" },
  ]);
  return {
    id: `gen.gt3-format-2.${idx}`, generated: true, concepts: ["auction-formats"], difficulty: 2, context: "abstract",
    prompt: `The open ${scen.open} auction is strategically equivalent to which SEALED-bid format? Choose exactly one of: first-price, second-price, English, Dutch.`,
    steps: [
      { instruction: `Name the equivalent sealed format. Type one of: first-price, second-price, English, Dutch.`, answer: scen.ans, accept: scen.acc, hint: scen.why + "." },
    ],
    finalAnswer: { value: scen.ans, unit: "" },
    solutionNarrative: `The ${scen.open} auction is equivalent to the ${scen.ans} sealed-bid auction because ${scen.why}.`,
  };
};
fill["gt3-format-3"] = (rng, idx) => {
  const scen = rng.pick([
    { open: "English (ascending)", pair: "second-price", pacc: ["second price", "vickrey"], commit: "no", cacc: [] },
    { open: "Dutch (descending)", pair: "first-price", pacc: ["first price"], commit: "yes", cacc: [] },
  ]);
  return {
    id: `gen.gt3-format-3.${idx}`, generated: true, concepts: ["auction-formats"], difficulty: 3, context: "abstract",
    prompt: `Analyze the ${scen.open} auction: give its sealed-bid equivalent, and state whether a bidder must commit to a price BEFORE knowing they've won.`,
    steps: [
      { instruction: `Sealed-bid equivalent. Type one of: first-price, second-price, English, Dutch.`, answer: scen.pair, accept: scen.pacc, hint: `Open ascending ~ second-price; open descending ~ first-price.` },
      { instruction: `Must the bidder commit to a price before knowing the outcome? Type 'yes' or 'no'.`, answer: scen.commit, accept: scen.cacc, hint: `Only the descending (Dutch) format forces early commitment.` },
    ],
    finalAnswer: { value: scen.pair, unit: "" },
    solutionNarrative: `The ${scen.open} auction is equivalent to the ${scen.pair} sealed-bid auction; early price commitment is required: ${scen.commit}.`,
  };
};

// --- second-price-truthfulness ---
// Distinct top-two values with a clear gap (no ties for the top two).
function twoTop(rng) {
  const win = rng.int(5, 10) * 10;
  const second = win - rng.int(1, 4) * 5; // strictly below the winner
  return { win, second };
}
fill["gt3-vickrey-1"] = (rng, idx) => {
  const { win, second } = twoTop(rng);
  const surplus = win - second;
  return {
    id: `gen.gt3-vickrey-1.${idx}`, generated: true, concepts: ["second-price-truthfulness"], difficulty: 1, context: "applied",
    prompt: `In a second-price auction your value is $\\$${win}$ and the highest competing bid is $\\$${second}$. Bidding truthfully, find your surplus if you win.`,
    steps: [
      { instruction: `You win ($${win} > ${second}$) and pay the second-highest bid $\\$${second}$. Surplus $= ${win} - ${second}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `Value minus the price paid.` },
    ],
    finalAnswer: { value: `${surplus}`, unit: "dollars" },
    solutionNarrative: `You pay the runner-up's $\\$${second}$, keeping surplus $${win} - ${second} = \\$${surplus}$.`,
  };
};
fill["gt3-vickrey-2"] = (rng, idx) => {
  const win = rng.int(5, 9) * 10;
  const second = win - rng.int(1, 3) * 10;
  const third = second - rng.int(1, 2) * 5;
  const surplus = win - second;
  return {
    id: `gen.gt3-vickrey-2.${idx}`, generated: true, concepts: ["second-price-truthfulness"], difficulty: 2, context: "applied",
    prompt: `Three bidders in a second-price auction have values $\\$${win}$, $\\$${second}$, and $\\$${third}$ and all bid truthfully. Find the price the winner pays and the winner's surplus.`,
    steps: [
      { instruction: `Winner is the highest bidder; the price is the second-highest bid. Give the price.`, answer: `${second}`, accept: [], hint: `Second-price rule: pay the runner-up's bid.` },
      { instruction: `Winner's surplus $= ${win} - ${second}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `Value minus price.` },
    ],
    finalAnswer: { value: `${surplus}`, unit: "dollars" },
    solutionNarrative: `The $\\$${win}$ bidder wins, pays the second-highest $\\$${second}$, and nets $${win} - ${second} = \\$${surplus}$; the seller collects $\\$${second}$.`,
  };
};
fill["gt3-vickrey-3"] = (rng, idx) => {
  const value = rng.int(5, 8) * 10;
  const rival = value + rng.int(1, 3) * 10; // rival strictly above your value
  const over = rival + rng.int(1, 2) * 10;  // your reckless overbid, above rival
  const loss = value - rival;               // negative
  return {
    id: `gen.gt3-vickrey-3.${idx}`, generated: true, concepts: ["second-price-truthfulness"], difficulty: 3, context: "applied",
    prompt: `In a second-price auction your value is $\\$${value}$. You are tempted to overbid $\\$${over}$ to be sure of winning. The highest rival bid is $\\$${rival}$. Analyze overbidding versus honest bidding.`,
    steps: [
      { instruction: `If you bid $\\$${over}$ (above the rival's $\\$${rival}$), do you win? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Highest bid wins.` },
      { instruction: `You then pay the second-highest bid $\\$${rival}$. Surplus $= ${value} - ${rival}$. Give a number.`, answer: `${loss}`, accept: [], hint: `You value it at $${value}$ but pay $${rival}$.` },
      { instruction: `Overbidding gave negative surplus. Would honest bidding (bid $\\$${value}$, lose, surplus 0) have been better? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Zero beats a loss.` },
    ],
    finalAnswer: { value: `${loss}`, unit: "dollars" },
    solutionNarrative: `Overbidding wins but forces payment of the rival's $\\$${rival}$, netting $${value} - ${rival} = \\$${loss}$. Honest bidding would have lost at zero surplus — strictly better, which is why truthfulness is dominant.`,
  };
};

// --- first-price-bidding ---
const FP_N = [
  { n: 2, frac: "1/2", dec: "0.5", num: 1, den: 2 },
  { n: 4, frac: "3/4", dec: "0.75", num: 3, den: 4 },
  { n: 5, frac: "4/5", dec: "0.8", num: 4, den: 5 },
];
fill["gt3-firstprice-1"] = (rng, idx) => {
  const c = rng.pick(FP_N);
  const v = c.den * rng.int(4, 12) * 5; // divisible by den -> integer bid
  const bid = (c.num * v) / c.den;
  return {
    id: `gen.gt3-firstprice-1.${idx}`, generated: true, concepts: ["first-price-bidding"], difficulty: 1, context: "abstract",
    prompt: `In a symmetric first-price auction with $n = ${c.n}$ risk-neutral bidders (values uniform on a common range), the equilibrium bid is $b(v) = \\tfrac{n-1}{n}\\,v$. Your value is $v = ${v}$. Find your equilibrium bid.`,
    steps: [
      { instruction: `Shading factor $\\tfrac{n-1}{n} = \\tfrac{${c.n - 1}}{${c.n}}$, then bid $\\tfrac{${c.num}}{${c.den}} \\times ${v}$. Give a number.`, answer: `${bid}`, accept: [], hint: `Multiply your value by the shade.` },
    ],
    finalAnswer: { value: `${bid}`, unit: "" },
    solutionNarrative: `$b(v) = \\tfrac{${c.num}}{${c.den}}(${v}) = ${bid}$ — you shade below your value, less so with more rivals.`,
  };
};
fill["gt3-firstprice-2"] = (rng, idx) => {
  const c = rng.pick(FP_N);
  const v = c.den * rng.int(5, 20) * 5;
  const bid = (c.num * v) / c.den;
  return {
    id: `gen.gt3-firstprice-2.${idx}`, generated: true, concepts: ["first-price-bidding"], difficulty: 2, context: "abstract",
    prompt: `A symmetric first-price auction has $n = ${c.n}$ risk-neutral bidders. Compute the equilibrium bid for a bidder with value $v = ${v}$ using $b(v) = \\tfrac{n-1}{n}\\,v$.`,
    steps: [
      { instruction: `Shading factor $\\tfrac{n-1}{n} = \\tfrac{${c.n - 1}}{${c.n}}$. Give it as a fraction or decimal.`, answer: c.frac, accept: [c.dec], hint: `$\\tfrac{${c.n} - 1}{${c.n}}$.` },
      { instruction: `Equilibrium bid $= \\tfrac{${c.num}}{${c.den}} \\times ${v}$. Give a number.`, answer: `${bid}`, accept: [], hint: `Value times the shade.` },
    ],
    finalAnswer: { value: `${bid}`, unit: "" },
    solutionNarrative: `The shade is $${c.frac}$, so $b(${v}) = ${bid}$.`,
  };
};
fill["gt3-firstprice-3"] = (rng, idx) => {
  const c = rng.pick(FP_N.slice(1)); // n=4 or 5 for a richer surplus step
  const v = c.den * rng.int(6, 24) * 5;
  const bid = (c.num * v) / c.den;
  const surplus = v - bid;
  return {
    id: `gen.gt3-firstprice-3.${idx}`, generated: true, concepts: ["first-price-bidding"], difficulty: 3, context: "applied",
    prompt: `A contractor bids in a symmetric first-price auction with $n = ${c.n}$ risk-neutral bidders (values uniform on a common range). Their value for the job is $\\$${v}$. Find the equilibrium bid and the surplus if they win at that bid.`,
    steps: [
      { instruction: `Shading factor $\\tfrac{n-1}{n} = \\tfrac{${c.n - 1}}{${c.n}}$. Give it as a fraction or decimal.`, answer: c.frac, accept: [c.dec], hint: `$\\tfrac{${c.n} - 1}{${c.n}}$.` },
      { instruction: `Equilibrium bid $= \\tfrac{${c.num}}{${c.den}} \\times ${v}$. Give a number.`, answer: `${bid}`, accept: [], hint: `Value times the shade.` },
      { instruction: `Surplus if they win $= ${v} - ${bid}$. Give a number.`, answer: `${surplus}`, accept: [], hint: `In a first-price auction you pay your own bid.` },
    ],
    finalAnswer: { value: `${surplus}`, unit: "dollars" },
    solutionNarrative: `Shade $${c.frac}$ gives bid $${bid}$; winning nets $${v} - ${bid} = \\$${surplus}$.`,
  };
};

// --- expected-revenue-and-efficiency ---
fill["gt3-revenue-1"] = (rng, idx) => {
  const win = rng.int(4, 9) * 10;
  const second = win - rng.int(1, 3) * 10;
  return {
    id: `gen.gt3-revenue-1.${idx}`, generated: true, concepts: ["expected-revenue-and-efficiency"], difficulty: 1, context: "applied",
    prompt: `Two bidders in a second-price auction have values $\\$${win}$ and $\\$${second}$ and bid truthfully. What is the seller's revenue?`,
    steps: [
      { instruction: `Revenue in a second-price auction is the second-highest bid. Give it.`, answer: `${second}`, accept: [], hint: `The winner pays the runner-up's value.` },
    ],
    finalAnswer: { value: `${second}`, unit: "dollars" },
    solutionNarrative: `The $\\$${win}$ bidder wins but pays the second-highest $\\$${second}$, so the seller collects $\\$${second}$.`,
  };
};
fill["gt3-revenue-2"] = (rng, idx) => {
  // n=2: first-price winner bids v/2. Keep win even so bid is integer.
  const win = rng.int(3, 9) * 20;          // even -> half integer
  const second = win - rng.int(1, 4) * 10;
  const fpBid = win / 2;
  return {
    id: `gen.gt3-revenue-2.${idx}`, generated: true, concepts: ["expected-revenue-and-efficiency"], difficulty: 2, context: "abstract",
    prompt: `A single-item auction has two bidders with values $\\$${win}$ and $\\$${second}$. Compare seller revenue under (a) a second-price auction with truthful bids, and (b) a first-price auction where each bids $\\tfrac12 v$ (the $n = 2$ equilibrium).`,
    steps: [
      { instruction: `Second-price revenue (the runner-up's value). Give a number.`, answer: `${second}`, accept: [], hint: `Winner pays the second-highest value.` },
      { instruction: `First-price winning bid: the $\\$${win}$ bidder bids $\\tfrac12 \\times ${win}$. Give a number.`, answer: `${fpBid}`, accept: [], hint: `Half of $${win}$.` },
      { instruction: `First-price revenue equals that winning bid. Give a number.`, answer: `${fpBid}`, accept: [], hint: `The winner pays their own bid.` },
    ],
    finalAnswer: { value: `${fpBid}`, unit: "dollars" },
    solutionNarrative: `Second-price collects $\\$${second}$; first-price collects the shaded winning bid $\\tfrac12(${win}) = \\$${fpBid}$. Single draws can differ — revenue equivalence holds only in expectation.`,
  };
};
fill["gt3-revenue-3"] = (rng, idx) => {
  return {
    id: `gen.gt3-revenue-3.${idx}`, generated: true, concepts: ["expected-revenue-and-efficiency"], difficulty: 3, context: "abstract",
    prompt: `Reason about the Revenue Equivalence Theorem. Under independent private values with risk-neutral, symmetric bidders, answer each part.`,
    steps: [
      { instruction: `Do first-price and second-price auctions yield the same EXPECTED revenue? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `That is the Revenue Equivalence Theorem.` },
      { instruction: `Do all four standard formats guarantee the highest-value bidder wins (efficiency)? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Each format is efficient.` },
      { instruction: `To raise revenue above the equivalence level, a seller adds a price floor. What is it called? Choose: reserve, second-price, English, Dutch.`, answer: "reserve", accept: ["reserve price"], hint: `A minimum acceptable price.` },
    ],
    finalAnswer: { value: "reserve", unit: "" },
    solutionNarrative: `The formats are revenue-equivalent in expectation and all efficient; a reserve price is the lever that actually lifts expected revenue.`,
  };
};

// ===========================================================================
// TOPIC 3: game-theory.evolutionary-and-applications
//   concepts: evolutionary-stable-strategy, replicator-intuition,
//             hawk-dove-polymorphism, cournot-oligopoly
// ===========================================================================

// --- evolutionary-stable-strategy ---
// 2x2 payoff M[row][col], row/col in {A=0,B=1}. Condition (i): E(A,A) > E(B,A).
fill["gt3-ess-1"] = (rng, idx) => {
  // Strictly dominant strategy -> guaranteed ESS. Randomize which is dominant.
  const dom = rng.pick(["A", "B"]);
  return {
    id: `gen.gt3-ess-1.${idx}`, generated: true, concepts: ["evolutionary-stable-strategy"], difficulty: 1, context: "abstract",
    prompt: `In a symmetric game, strategy ${dom} strictly dominates the other: ${dom} earns strictly more against every opponent. Is ${dom} an evolutionarily stable strategy (ESS)?`,
    steps: [
      { instruction: `A strictly dominant strategy is a strict best response to itself (condition (i) holds). Is ${dom} an ESS? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Strict dominance implies $E(${dom},${dom}) > E(\\text{other},${dom})$.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Strict dominance gives $E(${dom},${dom}) > E(\\text{other},${dom})$, so condition (i) holds and ${dom} is an ESS — no mutant can invade.`,
  };
};
fill["gt3-ess-2"] = (rng, idx) => {
  // Design so A is an ESS via condition (i): AA > BA. Others arbitrary distinct.
  const AA = rng.int(5, 9);
  const BA = rng.int(1, AA - 1); // strictly less than AA
  const AB = rng.int(1, 6), BB = rng.int(1, 6);
  const table = `| | opp A | opp B |\n|---|---|---|\n| **A** | ${AA} | ${AB} |\n| **B** | ${BA} | ${BB} |`;
  return {
    id: `gen.gt3-ess-2.${idx}`, generated: true, concepts: ["evolutionary-stable-strategy"], difficulty: 2, context: "abstract",
    prompt: `A symmetric 2×2 game has focal-player payoffs:\n\n${table}\n\nUse condition (i): $A$ is an ESS if $E(A,A) > E(B,A)$. Determine whether $A$ is an ESS.`,
    steps: [
      { instruction: `Read $E(A,A)$ (row A, column A). Give a number.`, answer: `${AA}`, accept: [], hint: `Focal A vs opponent A.` },
      { instruction: `Read $E(B,A)$ (row B, column A) — the B-mutant against the A-population. Give a number.`, answer: `${BA}`, accept: [], hint: `Focal B vs opponent A.` },
      { instruction: `Is $E(A,A) > E(B,A)$, i.e. $${AA} > ${BA}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Compare the two.` },
      { instruction: `So is $A$ an ESS? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Condition (i) holds.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$E(A,A) = ${AA} > ${BA} = E(B,A)$, so $A$ strictly beats a $B$-mutant against an all-$A$ population — condition (i) holds and $A$ is an ESS.`,
  };
};
fill["gt3-ess-3"] = (rng, idx) => {
  // Anti-coordination: AA < BA and BB < AB -> neither pure is ESS -> mixed.
  const AA = rng.int(1, 4), BA = AA + rng.int(1, 4);
  const BB = rng.int(1, 4), AB = BB + rng.int(1, 4);
  const table = `| | opp A | opp B |\n|---|---|---|\n| **A** | ${AA} | ${AB} |\n| **B** | ${BA} | ${BB} |`;
  return {
    id: `gen.gt3-ess-3.${idx}`, generated: true, concepts: ["evolutionary-stable-strategy"], difficulty: 3, context: "abstract",
    prompt: `A symmetric 2×2 game has focal-player payoffs:\n\n${table}\n\nCheck whether either pure strategy is an ESS using condition (i): $E(S,S) > E(T,S)$.`,
    steps: [
      { instruction: `Is $A$ an ESS? Compare $E(A,A) = ${AA}$ with $E(B,A) = ${BA}$: is $${AA} > ${BA}$? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `A B-mutant earns more against A-residents here.` },
      { instruction: `Is $B$ an ESS? Compare $E(B,B) = ${BB}$ with $E(A,B) = ${AB}$: is $${BB} > ${AB}$? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `An A-mutant earns more against B-residents here.` },
      { instruction: `Since neither pure strategy resists invasion, the stable outcome is a MIXED population. Type 'mixed'.`, answer: "mixed", accept: ["mixed strategy", "polymorphism", "polymorphic"], hint: `Anti-coordination gives an interior mixed ESS.` },
    ],
    finalAnswer: { value: "mixed", unit: "" },
    solutionNarrative: `Each pure strategy is invaded by the other ($${AA} < ${BA}$ and $${BB} < ${AB}$), so the ESS is a stable mix — a polymorphism, as in the costly Hawk–Dove game.`,
  };
};

// --- replicator-intuition ---
fill["gt3-replicator-1"] = (rng, idx) => {
  const fA = rng.int(6, 12), fB = rng.int(1, 5);
  const avg = rng.int(fB + 1, fA - 1); // strictly between so A>avg>B
  const grow = fA > avg ? "A" : "B";
  return {
    id: `gen.gt3-replicator-1.${idx}`, generated: true, concepts: ["replicator-intuition"], difficulty: 1, context: "abstract",
    prompt: `In a population, strategy A earns fitness $${fA}$ and strategy B earns fitness $${fB}$, while the population average fitness is $${avg}$. Under replicator dynamics, whose share is GROWING? Type 'A' or 'B'.`,
    steps: [
      { instruction: `The growing strategy earns ABOVE the average $${avg}$. Which is it? Type 'A' or 'B'.`, answer: grow, accept: [`strategy ${grow.toLowerCase()}`], hint: `Compare each fitness with the average.` },
    ],
    finalAnswer: { value: grow, unit: "" },
    solutionNarrative: `A's fitness $${fA}$ exceeds the average $${avg}$, so A grows; B's $${fB}$ is below average and shrinks.`,
  };
};
fill["gt3-replicator-2"] = (rng, idx) => {
  // Population xA of A (fitness fA), rest B (fitness fB). Choose so average is integer.
  const xNum = rng.pick([2, 4, 6, 8]); // tenths -> xA in {0.2,...,0.8}
  const xA = xNum / 10, xB = 1 - xA;
  const fA = rng.int(6, 12) * 5, fB = rng.int(1, 5) * 5;
  const avg = xA * fA + xB * fB;
  const avgStr = Number.isInteger(avg) ? `${avg}` : `${Math.round(avg * 100) / 100}`;
  const grow = fA > avg ? "A" : "B";
  return {
    id: `gen.gt3-replicator-2.${idx}`, generated: true, concepts: ["replicator-intuition"], difficulty: 2, context: "applied",
    prompt: `A population is ${xNum * 10}% strategy A (fitness $${fA}$) and ${(10 - xNum) * 10}% strategy B (fitness $${fB}$). Compute the average fitness, then decide whose share grows.`,
    steps: [
      { instruction: `Average fitness $= ${xA} \\times ${fA} + ${xB} \\times ${fB}$. Give a number.`, answer: avgStr, accept: [], hint: `Weight each fitness by its population share.` },
      { instruction: `Which strategy is growing (earns above the average)? Type 'A' or 'B'.`, answer: grow, accept: [`strategy ${grow.toLowerCase()}`], hint: `Compare $${fA}$ and $${fB}$ with the average.` },
    ],
    finalAnswer: { value: grow, unit: "" },
    solutionNarrative: `Average fitness is $${avgStr}$. Strategy ${grow} earns above it and grows; the other falls below and shrinks.`,
  };
};
fill["gt3-replicator-3"] = (rng, idx) => {
  const f = rng.int(4, 9);
  return {
    id: `gen.gt3-replicator-3.${idx}`, generated: true, concepts: ["replicator-intuition"], difficulty: 3, context: "abstract",
    prompt: `Under replicator dynamics a population stops changing when every surviving strategy earns exactly the average payoff. Answer the two parts.`,
    steps: [
      { instruction: `A rest point of the replicator dynamic corresponds to which classic equilibrium concept? Type 'Nash'.`, answer: "Nash", accept: ["nash equilibrium"], hint: `Evolution's fixed points coincide with it.` },
      { instruction: `If a strategy earns $${f}$ and the average is also $${f}$, is its share growing, shrinking, or stable? Type one word.`, answer: "stable", accept: ["constant", "unchanged"], hint: `Payoff equal to the average means zero growth.` },
    ],
    finalAnswer: { value: "stable", unit: "" },
    solutionNarrative: `Rest points are Nash equilibria; a strategy earning exactly the average $${f}$ has zero growth, so its share is stable.`,
  };
};

// --- hawk-dove-polymorphism ---
// (V,C) pairs where V/C reduces to a listed fraction/decimal, with C > V.
const HD = [
  { V: 2, C: 4, frac: "1/2", dec: "0.5" },
  { V: 3, C: 6, frac: "1/2", dec: "0.5" },
  { V: 4, C: 8, frac: "1/2", dec: "0.5" },
  { V: 4, C: 10, frac: "2/5", dec: "0.4" },
  { V: 2, C: 8, frac: "1/4", dec: "0.25" },
  { V: 6, C: 8, frac: "3/4", dec: "0.75" },
  { V: 2, C: 6, frac: "1/3", dec: "0.333" },
];
fill["gt3-hawkdove-1"] = (rng, idx) => {
  const c = rng.pick(HD.filter((h) => h.dec.length <= 4)); // avoid repeating-decimal at tier 1
  return {
    id: `gen.gt3-hawkdove-1.${idx}`, generated: true, concepts: ["hawk-dove-polymorphism"], difficulty: 1, context: "abstract",
    prompt: `In the Hawk–Dove game with resource value $V = ${c.V}$ and fight cost $C = ${c.C}$ (note $C > V$), the stable fraction of Hawks is $p^* = V/C$. Compute it.`,
    steps: [
      { instruction: `Compute $p^* = V/C = ${c.V}/${c.C}$. Give a fraction or decimal.`, answer: c.frac, accept: [c.dec, `${c.V}/${c.C}`], hint: `Divide value by cost.` },
    ],
    finalAnswer: { value: c.dec, unit: "" },
    solutionNarrative: `$p^* = ${c.V}/${c.C} = ${c.dec}$: this fraction of the population is Hawk, held in balance by frequency-dependent payoffs.`,
  };
};
fill["gt3-hawkdove-2"] = (rng, idx) => {
  const c = rng.pick(HD);
  return {
    id: `gen.gt3-hawkdove-2.${idx}`, generated: true, concepts: ["hawk-dove-polymorphism"], difficulty: 2, context: "applied",
    prompt: `Animals contest a resource worth $V = ${c.V}$; a lost fight costs $C = ${c.C}$. Since $C > V$, the population reaches a stable mix. Find the equilibrium fraction of Hawks $p^* = V/C$.`,
    steps: [
      { instruction: `Confirm a mix exists: is $C > V$, i.e. $${c.C} > ${c.V}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `The polymorphism needs costly fights.` },
      { instruction: `Compute $p^* = ${c.V}/${c.C}$. Give a fraction or decimal.`, answer: c.frac, accept: [c.dec, `${c.V}/${c.C}`], hint: `$V \\div C$.` },
    ],
    finalAnswer: { value: c.dec, unit: "" },
    solutionNarrative: `Since $C = ${c.C} > ${c.V} = V$, no pure strategy is stable and the Hawk fraction settles at $p^* = ${c.V}/${c.C} = ${c.dec}$.`,
  };
};
fill["gt3-hawkdove-3"] = (rng, idx) => {
  const c = rng.pick(HD);
  return {
    id: `gen.gt3-hawkdove-3.${idx}`, generated: true, concepts: ["hawk-dove-polymorphism"], difficulty: 3, context: "applied",
    prompt: `In a Hawk–Dove population with $V = ${c.V}$, $C = ${c.C}$, find the stable Hawk fraction $p^* = V/C$, then reason about the effect of raising the fight cost $C$.`,
    steps: [
      { instruction: `Stable Hawk fraction $p^* = ${c.V}/${c.C}$. Give a fraction or decimal.`, answer: c.frac, accept: [c.dec, `${c.V}/${c.C}`], hint: `Simplify $V/C$.` },
      { instruction: `If the fight cost $C$ increases (with $V$ fixed), does the Hawk fraction $V/C$ rise or fall? Type 'rise' or 'fall'.`, answer: "fall", accept: ["decrease", "falls"], hint: `A larger denominator shrinks the fraction.` },
    ],
    finalAnswer: { value: c.dec, unit: "" },
    solutionNarrative: `$p^* = ${c.V}/${c.C} = ${c.dec}$. Because $p^* = V/C$, a larger cost $C$ lowers the Hawk fraction — costlier fights sustain fewer aggressors.`,
  };
};

// --- cournot-oligopoly ---
// (a,c) with (a-c) in {3,6,9,12,18} so q=(a-c)/3 is a positive integer.
function cournotParams(rng) {
  const d = rng.pick([3, 6, 9, 12, 18]); // a - c
  const c = rng.pick([0, 1, 2, 3, 4, 5, 6]);
  const a = c + d;
  const q = d / 3, Q = 2 * q, P = a - Q, prof = (P - c) * q;
  return { a, c, d, q, Q, P, prof };
}
fill["gt3-cournot-1"] = (rng, idx) => {
  const { a, c, d, q } = cournotParams(rng);
  return {
    id: `gen.gt3-cournot-1.${idx}`, generated: true, concepts: ["cournot-oligopoly"], difficulty: 1, context: "abstract",
    prompt: `Two firms compete in Cournot quantities with inverse demand $P = a - Q$, $a = ${a}$, marginal cost $c = ${c}$. The symmetric equilibrium output per firm is $q = \\tfrac{a - c}{3}$. Find $q$.`,
    steps: [
      { instruction: `Compute $q = (a - c)/3 = (${a} - ${c})/3$. Give a number.`, answer: `${q}`, accept: [], hint: `$a - c = ${d}$, then divide by 3.` },
    ],
    finalAnswer: { value: `${q}`, unit: "" },
    solutionNarrative: `$q = (${a} - ${c})/3 = ${d}/3 = ${q}$ per firm.`,
  };
};
fill["gt3-cournot-2"] = (rng, idx) => {
  const { a, c, d, q, Q, P } = cournotParams(rng);
  return {
    id: `gen.gt3-cournot-2.${idx}`, generated: true, concepts: ["cournot-oligopoly"], difficulty: 2, context: "abstract",
    prompt: `Cournot duopoly with $P = a - Q$, $a = ${a}$, $c = ${c}$. Find each firm's equilibrium output, total output, and the market price.`,
    steps: [
      { instruction: `Per-firm output $q = (${a} - ${c})/3$. Give a number.`, answer: `${q}`, accept: [], hint: `$(a - c)/3$.` },
      { instruction: `Total output $Q = 2q = 2 \\times ${q}$. Give a number.`, answer: `${Q}`, accept: [], hint: `Two firms each make $${q}$.` },
      { instruction: `Price $P = a - Q = ${a} - ${Q}$. Give a number.`, answer: `${P}`, accept: [], hint: `Plug total output into demand.` },
    ],
    finalAnswer: { value: `${P}`, unit: "" },
    solutionNarrative: `$q = ${d}/3 = ${q}$ each, $Q = ${Q}$, and $P = ${a} - ${Q} = ${P}$. Output and price sit between monopoly and competition.`,
  };
};
fill["gt3-cournot-3"] = (rng, idx) => {
  const { a, c, d, q, Q, P, prof } = cournotParams(rng);
  return {
    id: `gen.gt3-cournot-3.${idx}`, generated: true, concepts: ["cournot-oligopoly"], difficulty: 3, context: "applied",
    prompt: `Two firms face inverse demand $P = ${a} - Q$ with marginal cost $c = ${c}$. Find each firm's Cournot output, the price, and each firm's profit.`,
    steps: [
      { instruction: `Per-firm output $q = (a - c)/3 = (${a} - ${c})/3$. Give a number.`, answer: `${q}`, accept: [], hint: `$(${a} - ${c})/3 = ${d}/3$.` },
      { instruction: `Total $Q = 2 \\times ${q}$, then price $P = ${a} - Q$. Give the price.`, answer: `${P}`, accept: [], hint: `$Q = ${Q}$, so $P = ${a} - ${Q}$.` },
      { instruction: `Each firm's profit $(P - c)\\,q = (${P} - ${c})(${q})$. Give a number.`, answer: `${prof}`, accept: [], hint: `Per-unit margin times output.` },
    ],
    finalAnswer: { value: `${prof}`, unit: "" },
    solutionNarrative: `$q = ${d}/3 = ${q}$, $Q = ${Q}$, $P = ${a} - ${Q} = ${P}$, and each firm earns $(${P} - ${c})(${q}) = ${prof}$.`,
  };
};
