// gen-gt1-fill.js
// Parametric generators for the Game Theory subject, topics
//   game-theory.strategic-form-and-dominance
//   game-theory.pure-nash-equilibrium
//   game-theory.mixed-strategies
//   game-theory.classic-games
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-stats2-fill.js). Template prefix: gt1-.
//
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every payoff matrix is built
// from chosen integer payoffs, and every dominance / best-response / Nash /
// mixing answer is COMPUTED from those same entries in-pack, so the drawn table
// and the graded answer can never desync.
//
// GRADER NOTES (js/problem-engine.js):
//   - Strategy answers are MENU/exact-string: we use word labels ("Top",
//     "Bottom", "Left", "Right", "Cooperate", ...) — never bare digits, which
//     the polynomial engine would collapse to 0 and cross-collide.
//   - Yes/no answers use "yes"/"no" with accepts.
//   - Counts are plain integers; probabilities/payoffs are plain numbers or
//     fractions (a/b == decimal cross-grades). Mixing probabilities are guarded
//     to lie strictly in (0,1).

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------

// A 2x2 game has Row strategies (R0,R1) and Column strategies (C0,C1). Payoffs
// are stored as pay[r][c] = [rowPayoff, colPayoff]. We render a markdown table
// with cells "a, b" (Row's payoff first, Column's second) — the universal
// bimatrix convention.
function bimatrixTable(rowLabels, colLabels, pay) {
  const head = `| Row \\ Col | ${colLabels[0]} | ${colLabels[1]} |`;
  const sep = `|---|---|---|`;
  const r0 = `| **${rowLabels[0]}** | ${pay[0][0][0]}, ${pay[0][0][1]} | ${pay[0][1][0]}, ${pay[0][1][1]} |`;
  const r1 = `| **${rowLabels[1]}** | ${pay[1][0][0]}, ${pay[1][0][1]} | ${pay[1][1][0]}, ${pay[1][1][1]} |`;
  return `${head}\n${sep}\n${r0}\n${r1}`;
}

// Distinct integer payoffs in a small range, to avoid accidental ties.
function distinctInts(rng, n, lo, hi) {
  const seen = new Set();
  const out = [];
  let guard = 0;
  while (out.length < n && guard++ < 500) {
    const v = rng.int(lo, hi);
    if (!seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

// gcd / fraction reducer for exact mixed-strategy probabilities.
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function frac(num, den) {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(num, den);
  return { n: num / g, d: den / g };
}
// A probability p = num/den in lowest terms, as a display string and decimal.
function probStr(num, den) {
  const f = frac(num, den);
  return f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`;
}
function probDec(num, den) { return num / den; }

// Round to p decimals -> plain string.
const rnd = (x, p) => { const f = Math.pow(10, p); return `${Math.round(x * f) / f}`; };

// Row's best response (which row index) to a fixed column c: argmax of row payoff.
// Returns -1 on a tie (caller must guard).
function rowBestResponse(pay, c) {
  const a = pay[0][c][0], b = pay[1][c][0];
  if (a === b) return -1;
  return a > b ? 0 : 1;
}
// Column's best response (which column index) to a fixed row r.
function colBestResponse(pay, r) {
  const a = pay[r][0][1], b = pay[r][1][1];
  if (a === b) return -1;
  return a > b ? 0 : 1;
}
// Does Row strictly dominate: is one row always strictly better than the other?
// Returns { dom, dominated } as indices, or null if neither strictly dominates.
function rowDominance(pay) {
  const r0beatsBoth = pay[0][0][0] > pay[1][0][0] && pay[0][1][0] > pay[1][1][0];
  const r1beatsBoth = pay[1][0][0] > pay[0][0][0] && pay[1][1][0] > pay[0][1][0];
  if (r0beatsBoth) return { dom: 0, dominated: 1 };
  if (r1beatsBoth) return { dom: 1, dominated: 0 };
  return null;
}
function colDominance(pay) {
  const c0beatsBoth = pay[0][0][1] > pay[0][1][1] && pay[1][0][1] > pay[1][1][1];
  const c1beatsBoth = pay[0][1][1] > pay[0][0][1] && pay[1][1][1] > pay[1][0][1];
  if (c0beatsBoth) return { dom: 0, dominated: 1 };
  if (c1beatsBoth) return { dom: 1, dominated: 0 };
  return null;
}
// All pure Nash equilibria as list of [r, c] where each player best-responds.
// Requires no best-response ties (caller guards ties out).
function pureNash(pay) {
  const out = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    if (rowBestResponse(pay, c) === r && colBestResponse(pay, r) === c) out.push([r, c]);
  }
  return out;
}

// Label sets used across games (word labels, never digits).
const RC_LABELS = { row: ["Top", "Bottom"], col: ["Left", "Right"] };

// yes/no accepts.
const YES = ["y"];
const NO = ["n"];

export const fill = {};

// ===========================================================================
// TOPIC 1: game-theory.strategic-form-and-dominance
//   concepts: payoff-matrices, strictly-dominant-and-dominated,
//             iterated-elimination, best-response
// ===========================================================================

// --- payoff-matrices: read a payoff from the table (numeric) ---
fill["gt1-payoff-1"] = (rng, idx) => {
  const vals = distinctInts(rng, 8, 0, 9);
  const pay = [
    [[vals[0], vals[1]], [vals[2], vals[3]]],
    [[vals[4], vals[5]], [vals[6], vals[7]]],
  ];
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const r = rng.int(0, 1), c = rng.int(0, 1);
  const player = rng.pick(["Row", "Column"]);
  const val = player === "Row" ? pay[r][c][0] : pay[r][c][1];
  return {
    id: `gen.gt1-payoff-1.${idx}`, generated: true, concepts: ["payoff-matrices"], difficulty: 1, context: "abstract",
    prompt: `In the game below, each cell lists **Row's payoff first, then Column's** ($a, b$).\n\n${bimatrixTable(rl, cl, pay)}\n\nWhat payoff does **${player}** get at the outcome (**${rl[r]}**, **${cl[c]}**)?`,
    steps: [
      { instruction: `Read the cell in row **${rl[r]}**, column **${cl[c]}**, and take ${player === "Row" ? "the FIRST number (Row's payoff)" : "the SECOND number (Column's payoff)"}. (Give a number.)`, answer: `${val}`, accept: [], hint: `The cell shows "${pay[r][c][0]}, ${pay[r][c][1]}"; ${player} is the ${player === "Row" ? "first" : "second"} entry.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `At (${rl[r]}, ${cl[c]}) the cell is "${pay[r][c][0]}, ${pay[r][c][1]}". ${player}'s payoff is the ${player === "Row" ? "first" : "second"} entry, ${val}.`,
  };
};
fill["gt1-payoff-2"] = (rng, idx) => {
  const vals = distinctInts(rng, 8, 0, 9);
  const pay = [
    [[vals[0], vals[1]], [vals[2], vals[3]]],
    [[vals[4], vals[5]], [vals[6], vals[7]]],
  ];
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Two reads plus which player did better at a chosen cell.
  const r = rng.int(0, 1), c = rng.int(0, 1);
  const rowP = pay[r][c][0], colP = pay[r][c][1];
  const better = rowP === colP ? "tie" : (rowP > colP ? "Row" : "Column");
  const betterAns = better === "tie" ? "tie" : better.toLowerCase();
  return {
    id: `gen.gt1-payoff-2.${idx}`, generated: true, concepts: ["payoff-matrices"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}\n\nExamine the outcome (**${rl[r]}**, **${cl[c]}**).`,
    steps: [
      { instruction: `Row's payoff at (${rl[r]}, ${cl[c]}). (Give a number.)`, answer: `${rowP}`, accept: [], hint: `First entry of the cell.` },
      { instruction: `Column's payoff at (${rl[r]}, ${cl[c]}). (Give a number.)`, answer: `${colP}`, accept: [], hint: `Second entry of the cell.` },
      { instruction: `Who does better at this outcome — type 'Row', 'Column', or 'tie'.`, answer: betterAns, accept: better === "tie" ? [] : [better], hint: `Compare ${rowP} and ${colP}.` },
    ],
    finalAnswer: { value: betterAns, unit: "" },
    solutionNarrative: `At (${rl[r]}, ${cl[c]}) Row gets ${rowP} and Column gets ${colP}, so ${better === "tie" ? "the two payoffs tie" : better + " does better"}.`,
  };
};
fill["gt1-payoff-3"] = (rng, idx) => {
  const vals = distinctInts(rng, 8, 0, 12);
  const pay = [
    [[vals[0], vals[1]], [vals[2], vals[3]]],
    [[vals[4], vals[5]], [vals[6], vals[7]]],
  ];
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Total (social) payoff at a cell, and which cell maximizes the sum.
  const r = rng.int(0, 1), c = rng.int(0, 1);
  const cellSum = pay[r][c][0] + pay[r][c][1];
  const sums = [[pay[0][0][0] + pay[0][0][1], "0,0"], [pay[0][1][0] + pay[0][1][1], "0,1"], [pay[1][0][0] + pay[1][0][1], "1,0"], [pay[1][1][0] + pay[1][1][1], "1,1"]];
  let best = sums[0];
  for (const s of sums) if (s[0] > best[0]) best = s;
  const tieOnMax = sums.filter((s) => s[0] === best[0]).length > 1;
  if (tieOnMax) { return fill["gt1-payoff-3"](rng, idx); } // guard: unique social optimum
  const [br, bc] = best[1].split(",").map(Number);
  const bestCell = `(${rl[br]}, ${cl[bc]})`;
  const opts = `(Top, Left), (Top, Right), (Bottom, Left), (Bottom, Right)`;
  return {
    id: `gen.gt1-payoff-3.${idx}`, generated: true, concepts: ["payoff-matrices"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). The **total (social) payoff** of an outcome is the sum of the two players' payoffs.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Total payoff at (${rl[r]}, ${cl[c]}): add the two numbers in that cell. (Give a number.)`, answer: `${cellSum}`, accept: [], hint: `${pay[r][c][0]} + ${pay[r][c][1]}.` },
      { instruction: `Which outcome maximizes the total payoff? Choose one: ${opts}.`, answer: bestCell, accept: [`${rl[br]}, ${cl[bc]}`, `${rl[br]} ${cl[bc]}`], hint: `Add the two numbers in each of the four cells and pick the biggest sum.` },
    ],
    finalAnswer: { value: bestCell, unit: "" },
    solutionNarrative: `The four cell sums are ${sums.map((s) => s[0]).join(", ")}; the largest is ${best[0]} at ${bestCell}, the socially efficient outcome (which need not be an equilibrium).`,
  };
};

// --- strictly-dominant-and-dominated: identify a dominant/dominated strategy ---
fill["gt1-dominance-1"] = (rng, idx) => {
  // Build a game where ROW has a strict dominant strategy.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, dom;
  let guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 9);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    dom = rowDominance(pay);
    guard++;
  } while (!dom && guard < 200);
  if (!dom) { // fallback construct
    pay = [[[5, 1], [4, 2]], [[3, 3], [1, 0]]]; dom = rowDominance(pay);
  }
  const domLabel = rl[dom.dom], domdLabel = rl[dom.dominated];
  return {
    id: `gen.gt1-dominance-1.${idx}`, generated: true, concepts: ["strictly-dominant-and-dominated"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). A strategy **strictly dominates** another if it earns Row a strictly higher payoff no matter what Column does.\n\n${bimatrixTable(rl, cl, pay)}\n\nFocus on **Row**'s two strategies, **${rl[0]}** and **${rl[1]}**.`,
    steps: [
      { instruction: `Compare Row's payoffs against Column playing ${cl[0]}: is ${rl[dom.dom]} (${pay[dom.dom][0][0]}) better than ${rl[dom.dominated]} (${pay[dom.dominated][0][0]})? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `${pay[dom.dom][0][0]} vs ${pay[dom.dominated][0][0]}.` },
      { instruction: `Which of Row's strategies is strictly dominant? Choose: ${rl[0]} or ${rl[1]}.`, answer: domLabel, accept: [], hint: `The one that wins in BOTH columns.` },
      { instruction: `Which of Row's strategies is strictly dominated? Choose: ${rl[0]} or ${rl[1]}.`, answer: domdLabel, accept: [], hint: `The loser in both columns.` },
    ],
    finalAnswer: { value: domLabel, unit: "" },
    solutionNarrative: `Row earns more with ${domLabel} whether Column plays ${cl[0]} (${pay[dom.dom][0][0]} > ${pay[dom.dominated][0][0]}) or ${cl[1]} (${pay[dom.dom][1][0]} > ${pay[dom.dominated][1][0]}), so ${domLabel} strictly dominates ${domdLabel}.`,
  };
};
fill["gt1-dominance-2"] = (rng, idx) => {
  // Column has a strict dominant strategy; identify it.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, dom, guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 9);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    dom = colDominance(pay);
    guard++;
  } while (!dom && guard < 200);
  if (!dom) { pay = [[[1, 5], [2, 4]], [[3, 3], [0, 1]]]; dom = colDominance(pay); }
  const domLabel = cl[dom.dom], domdLabel = cl[dom.dominated];
  return {
    id: `gen.gt1-dominance-2.${idx}`, generated: true, concepts: ["strictly-dominant-and-dominated"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Now analyze **Column** (the second number in each cell). Column strictly dominates when it earns Column a higher payoff in **every row**.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `In row ${rl[0]}, Column's payoffs are ${cl[0]}: ${pay[0][0][1]} vs ${cl[1]}: ${pay[0][1][1]}. Which is larger? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[dom.dom], accept: [], hint: `Compare the second entries in row ${rl[0]}.` },
      { instruction: `In row ${rl[1]}, Column's payoffs are ${cl[0]}: ${pay[1][0][1]} vs ${cl[1]}: ${pay[1][1][1]}. Which is larger? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[dom.dom], accept: [], hint: `Compare the second entries in row ${rl[1]}.` },
      { instruction: `Which Column strategy is strictly dominant? Choose ${cl[0]} or ${cl[1]}.`, answer: domLabel, accept: [], hint: `It won in both rows.` },
    ],
    finalAnswer: { value: domLabel, unit: "" },
    solutionNarrative: `${domLabel} gives Column the higher payoff in both rows (${pay[0][dom.dom][1]} > ${pay[0][dom.dominated][1]} and ${pay[1][dom.dom][1]} > ${pay[1][dom.dominated][1]}), so ${domLabel} strictly dominates ${domdLabel}.`,
  };
};
fill["gt1-dominance-3"] = (rng, idx) => {
  // A game where ONE player has a dominant strategy and the other doesn't;
  // ask learner to determine, for each player, whether a dominant strategy exists.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, rdom, cdom, guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 9);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    rdom = rowDominance(pay); cdom = colDominance(pay);
    guard++;
  } while (!(rdom && !cdom) && guard < 300);
  if (!(rdom && !cdom)) { pay = [[[5, 3], [4, 1]], [[2, 0], [1, 2]]]; rdom = rowDominance(pay); cdom = colDominance(pay); }
  return {
    id: `gen.gt1-dominance-3.${idx}`, generated: true, concepts: ["strictly-dominant-and-dominated"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Determine which players — if any — have a strictly dominant strategy.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Does **Row** have a strictly dominant strategy? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Check whether one of Row's rows beats the other in BOTH columns.` },
      { instruction: `Which one? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[rdom.dom], accept: [], hint: `The row that wins in both columns.` },
      { instruction: `Does **Column** have a strictly dominant strategy? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Check the second entries; Column's best column changes between rows.` },
    ],
    finalAnswer: { value: rl[rdom.dom], unit: "" },
    solutionNarrative: `Row's ${rl[rdom.dom]} beats ${rl[rdom.dominated]} in both columns, so Row has a dominant strategy. Column's best reply flips between rows, so Column has no strictly dominant strategy — a common asymmetric case.`,
  };
};

// --- iterated-elimination (IESDS): which strategies survive; the surviving profile ---
fill["gt1-iesds-1"] = (rng, idx) => {
  // Build a game solvable by IESDS in one round each: Row dominant, then given
  // Row's survivor Column has a unique best response.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, rdom, guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 9);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    rdom = rowDominance(pay);
    guard++;
  } while (!rdom && guard < 300);
  if (!rdom) { pay = [[[5, 1], [4, 3]], [[3, 2], [1, 4]]]; rdom = rowDominance(pay); }
  const survRow = rdom.dom;
  const colBest = colBestResponse(pay, survRow);
  if (colBest === -1) { return fill["gt1-iesds-1"](rng, idx); } // guard tie
  const profile = `(${rl[survRow]}, ${cl[colBest]})`;
  return {
    id: `gen.gt1-iesds-1.${idx}`, generated: true, concepts: ["iterated-elimination"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Solve by **iterated elimination of strictly dominated strategies (IESDS)**: delete a strictly dominated strategy, then re-examine the smaller game.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row's ${rl[rdom.dominated]} is strictly dominated — eliminate it. Which Row strategy survives? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[survRow], accept: [], hint: `Keep the row that dominates.` },
      { instruction: `With only ${rl[survRow]} left, Column now picks its best reply in that row. Choose ${cl[0]} or ${cl[1]}.`, answer: cl[colBest], accept: [], hint: `Compare Column's payoffs ${pay[survRow][0][1]} vs ${pay[survRow][1][1]} in row ${rl[survRow]}.` },
    ],
    finalAnswer: { value: profile, unit: "" },
    solutionNarrative: `Eliminating Row's dominated ${rl[rdom.dominated]} leaves ${rl[survRow]}; Column then best-responds with ${cl[colBest]} (${pay[survRow][colBest][1]} > ${pay[survRow][1 - colBest][1]}). The surviving profile is ${profile}.`,
  };
};
fill["gt1-iesds-2"] = (rng, idx) => {
  // Column dominant first, then Row best-responds. Ask surviving profile.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, cdom, guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 9);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    cdom = colDominance(pay);
    guard++;
  } while (!cdom && guard < 300);
  if (!cdom) { pay = [[[1, 5], [3, 4]], [[2, 3], [4, 1]]]; cdom = colDominance(pay); }
  const survCol = cdom.dom;
  const rowBest = rowBestResponse(pay, survCol);
  if (rowBest === -1) { return fill["gt1-iesds-2"](rng, idx); }
  const profile = `(${rl[rowBest]}, ${cl[survCol]})`;
  return {
    id: `gen.gt1-iesds-2.${idx}`, generated: true, concepts: ["iterated-elimination"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Solve by IESDS.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Which player has a strictly dominated strategy to remove first? Type 'Row' or 'Column'.`, answer: "Column", accept: ["col"], hint: `Look at the second entries — Column's ${cl[cdom.dominated]} loses in both rows.` },
      { instruction: `Eliminate Column's ${cl[cdom.dominated]}. Which Column strategy survives? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[survCol], accept: [], hint: `Keep the dominant column.` },
      { instruction: `Now Row best-responds within column ${cl[survCol]}. Choose ${rl[0]} or ${rl[1]}.`, answer: rl[rowBest], accept: [], hint: `Compare Row's payoffs ${pay[0][survCol][0]} vs ${pay[1][survCol][0]}.` },
    ],
    finalAnswer: { value: profile, unit: "" },
    solutionNarrative: `Column's ${cl[cdom.dominated]} is strictly dominated; removing it leaves ${cl[survCol]}. Row then best-responds with ${rl[rowBest]}. Surviving profile: ${profile}.`,
  };
};
fill["gt1-iesds-3"] = (rng, idx) => {
  // Two rounds: Row dominant, then in reduced game Column dominant -> unique profile.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, rdom, guard = 0;
  do {
    const v = distinctInts(rng, 8, 0, 12);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    rdom = rowDominance(pay);
    guard++;
    if (rdom) {
      const cb = colBestResponse(pay, rdom.dom);
      if (cb === -1) rdom = null;
    }
  } while (!rdom && guard < 400);
  if (!rdom) { pay = [[[6, 2], [5, 4]], [[3, 1], [1, 3]]]; rdom = rowDominance(pay); }
  const survRow = rdom.dom;
  const survCol = colBestResponse(pay, survRow);
  const profile = `(${rl[survRow]}, ${cl[survCol]})`;
  const rowPayoff = pay[survRow][survCol][0], colPayoff = pay[survRow][survCol][1];
  return {
    id: `gen.gt1-iesds-3.${idx}`, generated: true, concepts: ["iterated-elimination"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Fully solve by IESDS and read off the payoffs of the surviving outcome.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Round 1 — Row's dominated strategy is removed. Which Row strategy survives? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[survRow], accept: [], hint: `Row's ${rl[survRow]} beats ${rl[rdom.dominated]} in both columns.` },
      { instruction: `Round 2 — in the single surviving row, which Column strategy is best? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[survCol], accept: [], hint: `Compare Column's payoffs in row ${rl[survRow]}.` },
      { instruction: `At the surviving profile ${profile}, what is Row's payoff? (Give a number.)`, answer: `${rowPayoff}`, accept: [], hint: `Read the first number in that cell.` },
    ],
    finalAnswer: { value: profile, unit: "" },
    solutionNarrative: `IESDS keeps Row's ${rl[survRow]}, then Column's ${cl[survCol]}, giving the unique profile ${profile} with payoffs (${rowPayoff}, ${colPayoff}).`,
  };
};

// --- best-response: a player's best response to a fixed opponent action ---
fill["gt1-br-1"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 8, 0, 9);
  const pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
  const oppCol = rng.int(0, 1);
  const br = rowBestResponse(pay, oppCol);
  if (br === -1) { return fill["gt1-br-1"](rng, idx); }
  return {
    id: `gen.gt1-br-1.${idx}`, generated: true, concepts: ["best-response"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Suppose **Column has committed to ${cl[oppCol]}**.\n\n${bimatrixTable(rl, cl, pay)}\n\nWhat is Row's best response?`,
    steps: [
      { instruction: `Row's payoffs in column ${cl[oppCol]} are ${rl[0]}: ${pay[0][oppCol][0]} and ${rl[1]}: ${pay[1][oppCol][0]}. Which row is best? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[br], accept: [], hint: `Pick the row with the larger FIRST number in column ${cl[oppCol]}.` },
    ],
    finalAnswer: { value: rl[br], unit: "" },
    solutionNarrative: `Against ${cl[oppCol]}, Row compares ${pay[0][oppCol][0]} (${rl[0]}) with ${pay[1][oppCol][0]} (${rl[1]}); the best response is ${rl[br]}.`,
  };
};
fill["gt1-br-2"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 8, 0, 9);
  const pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
  const oppRow = rng.int(0, 1);
  const br = colBestResponse(pay, oppRow);
  if (br === -1) { return fill["gt1-br-2"](rng, idx); }
  return {
    id: `gen.gt1-br-2.${idx}`, generated: true, concepts: ["best-response"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Suppose **Row has committed to ${rl[oppRow]}**.\n\n${bimatrixTable(rl, cl, pay)}\n\nFind Column's best response (use the SECOND number in each cell).`,
    steps: [
      { instruction: `Column's payoffs in row ${rl[oppRow]} are ${cl[0]}: ${pay[oppRow][0][1]} and ${cl[1]}: ${pay[oppRow][1][1]}. Which column is best? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[br], accept: [], hint: `Larger SECOND number in row ${rl[oppRow]}.` },
      { instruction: `What payoff does Column earn from that best response? (Give a number.)`, answer: `${pay[oppRow][br][1]}`, accept: [], hint: `The second entry of the chosen cell.` },
    ],
    finalAnswer: { value: cl[br], unit: "" },
    solutionNarrative: `In row ${rl[oppRow]}, Column compares ${pay[oppRow][0][1]} (${cl[0]}) with ${pay[oppRow][1][1]} (${cl[1]}); best response is ${cl[br]}, earning ${pay[oppRow][br][1]}.`,
  };
};
fill["gt1-br-3"] = (rng, idx) => {
  // Best responses for BOTH of Row's opponent-actions (the full best-response
  // correspondence for Row), then whether it's constant (a dominant strategy).
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 8, 0, 9);
  const pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
  const brL = rowBestResponse(pay, 0), brR = rowBestResponse(pay, 1);
  if (brL === -1 || brR === -1) { return fill["gt1-br-3"](rng, idx); }
  const constant = brL === brR;
  return {
    id: `gen.gt1-br-3.${idx}`, generated: true, concepts: ["best-response"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Map out **Row's best response to each of Column's actions**.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row's best response if Column plays ${cl[0]}? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[brL], accept: [], hint: `Compare ${pay[0][0][0]} and ${pay[1][0][0]}.` },
      { instruction: `Row's best response if Column plays ${cl[1]}? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[brR], accept: [], hint: `Compare ${pay[0][1][0]} and ${pay[1][1][0]}.` },
      { instruction: `Since Row's best response is ${constant ? "the SAME" : "DIFFERENT"} against both of Column's actions, does Row have a strictly dominant strategy? Type 'yes' or 'no'.`, answer: constant ? "yes" : "no", accept: constant ? YES : NO, hint: `A dominant strategy is best no matter what the opponent does.` },
    ],
    finalAnswer: { value: rl[brL], unit: "" },
    solutionNarrative: `Row best-responds with ${rl[brL]} to ${cl[0]} and ${rl[brR]} to ${cl[1]}. ${constant ? `Same reply both times ⇒ ${rl[brL]} is dominant.` : `The reply changes ⇒ no dominant strategy; best response depends on Column.`}`,
  };
};

// ===========================================================================
// TOPIC 2: game-theory.pure-nash-equilibrium
//   concepts: best-response-analysis, finding-pure-nash,
//             coordination-and-anticoordination, no-pure-equilibrium
// ===========================================================================

// Build a generic 2x2 with no best-response ties (so Nash structure is clean).
function cleanGame(rng, lo = 0, hi = 9) {
  let pay, guard = 0;
  do {
    const v = distinctInts(rng, 8, lo, hi);
    pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
    guard++;
  } while ((rowBestResponse(pay, 0) === -1 || rowBestResponse(pay, 1) === -1 ||
            colBestResponse(pay, 0) === -1 || colBestResponse(pay, 1) === -1) && guard < 300);
  return pay;
}

// --- best-response-analysis: mark best responses ---
fill["gt1-bra-1"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pay = cleanGame(rng);
  const brToLeft = rowBestResponse(pay, 0);
  const brToRight = rowBestResponse(pay, 1);
  return {
    id: `gen.gt1-bra-1.${idx}`, generated: true, concepts: ["best-response-analysis"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Underline Row's best responses by finding, in each column, the row Row prefers.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Column ${cl[0]}: Row's best response? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[brToLeft], accept: [], hint: `Larger first entry in column ${cl[0]}.` },
      { instruction: `Column ${cl[1]}: Row's best response? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[brToRight], accept: [], hint: `Larger first entry in column ${cl[1]}.` },
    ],
    finalAnswer: { value: rl[brToLeft], unit: "" },
    solutionNarrative: `Marking Row's best replies: ${rl[brToLeft]} to ${cl[0]}, ${rl[brToRight]} to ${cl[1]}. Doing the same for Column then reveals the Nash equilibria as cells where both marks coincide.`,
  };
};
fill["gt1-bra-2"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pay = cleanGame(rng);
  const cbTop = colBestResponse(pay, 0);
  const cbBottom = colBestResponse(pay, 1);
  return {
    id: `gen.gt1-bra-2.${idx}`, generated: true, concepts: ["best-response-analysis"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Find **Column's** best response in each row (use the second number).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row ${rl[0]}: Column's best response? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[cbTop], accept: [], hint: `Larger second entry in row ${rl[0]}.` },
      { instruction: `Row ${rl[1]}: Column's best response? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[cbBottom], accept: [], hint: `Larger second entry in row ${rl[1]}.` },
    ],
    finalAnswer: { value: cl[cbTop], unit: "" },
    solutionNarrative: `Column best-responds with ${cl[cbTop]} to ${rl[0]} and ${cl[cbBottom]} to ${rl[1]}. Overlaying these with Row's best responses locates every pure Nash equilibrium.`,
  };
};
fill["gt1-bra-3"] = (rng, idx) => {
  // Full best-response overlay: ask a specific cell whether it is mutual BR.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pay = cleanGame(rng);
  const eqs = pureNash(pay);
  const r = rng.int(0, 1), c = rng.int(0, 1);
  const rowBR = rowBestResponse(pay, c) === r;
  const colBR = colBestResponse(pay, r) === c;
  const isEq = rowBR && colBR;
  return {
    id: `gen.gt1-bra-3.${idx}`, generated: true, concepts: ["best-response-analysis"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). A cell is a **Nash equilibrium** exactly when it is a mutual best response.\n\n${bimatrixTable(rl, cl, pay)}\n\nExamine the cell (**${rl[r]}**, **${cl[c]}**).`,
    steps: [
      { instruction: `Is ${rl[r]} Row's best response to ${cl[c]}? Type 'yes' or 'no'.`, answer: rowBR ? "yes" : "no", accept: rowBR ? YES : NO, hint: `In column ${cl[c]}, compare ${pay[0][c][0]} and ${pay[1][c][0]}.` },
      { instruction: `Is ${cl[c]} Column's best response to ${rl[r]}? Type 'yes' or 'no'.`, answer: colBR ? "yes" : "no", accept: colBR ? YES : NO, hint: `In row ${rl[r]}, compare ${pay[r][0][1]} and ${pay[r][1][1]}.` },
      { instruction: `Is (${rl[r]}, ${cl[c]}) a Nash equilibrium? Type 'yes' or 'no'.`, answer: isEq ? "yes" : "no", accept: isEq ? YES : NO, hint: `Only if BOTH players are best-responding.` },
    ],
    finalAnswer: { value: isEq ? "yes" : "no", unit: "" },
    solutionNarrative: `${rl[r]} is${rowBR ? "" : " not"} Row's best reply to ${cl[c]}, and ${cl[c]} is${colBR ? "" : " not"} Column's best reply to ${rl[r]}, so the cell is${isEq ? "" : " not"} a Nash equilibrium. (This game has ${eqs.length} pure Nash equilibri${eqs.length === 1 ? "um" : "a"}.)`,
  };
};

// --- finding-pure-nash: identify Nash profile(s), grade each player separately + count ---
fill["gt1-findnash-1"] = (rng, idx) => {
  // Guarantee a unique pure Nash equilibrium.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, eqs, guard = 0;
  do { pay = cleanGame(rng); eqs = pureNash(pay); guard++; } while (eqs.length !== 1 && guard < 300);
  if (eqs.length !== 1) { pay = [[[4, 4], [1, 3]], [[3, 1], [2, 2]]]; eqs = pureNash(pay); }
  const [er, ec] = eqs[0];
  return {
    id: `gen.gt1-findnash-1.${idx}`, generated: true, concepts: ["finding-pure-nash"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Find the pure-strategy Nash equilibrium (a cell where neither player wants to deviate).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `At the equilibrium, what does **Row** play? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[er], accept: [], hint: `Find the cell where each is best-responding, then read Row's strategy.` },
      { instruction: `At the equilibrium, what does **Column** play? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[ec], accept: [], hint: `Read Column's strategy at that same cell.` },
      { instruction: `How many pure-strategy Nash equilibria does this game have? (Give an integer.)`, answer: "1", accept: [], hint: `Count the mutual-best-response cells.` },
    ],
    finalAnswer: { value: `(${rl[er]}, ${cl[ec]})`, unit: "" },
    solutionNarrative: `The unique mutual-best-response cell is (${rl[er]}, ${cl[ec]}) with payoffs (${pay[er][ec][0]}, ${pay[er][ec][1]}); it is the sole pure Nash equilibrium.`,
  };
};
fill["gt1-findnash-2"] = (rng, idx) => {
  // Two pure Nash equilibria (coordination-style but on generic payoffs).
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, eqs, guard = 0;
  do { pay = cleanGame(rng); eqs = pureNash(pay); guard++; } while (eqs.length !== 2 && guard < 400);
  if (eqs.length !== 2) { pay = [[[3, 2], [0, 0]], [[1, 1], [2, 3]]]; eqs = pureNash(pay); }
  const sorted = eqs.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const [e1, e2] = sorted;
  return {
    id: `gen.gt1-findnash-2.${idx}`, generated: true, concepts: ["finding-pure-nash"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Find ALL pure-strategy Nash equilibria.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `How many pure-strategy Nash equilibria are there? (Give an integer.)`, answer: "2", accept: [], hint: `Overlay both players' best responses and count the coincidences.` },
      { instruction: `First equilibrium (the one with Row playing ${rl[e1[0]]}): what does Column play? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[e1[1]], accept: [], hint: `At (${rl[e1[0]]}, ?), find the mutual best response.` },
      { instruction: `Second equilibrium (Row playing ${rl[e2[0]]}): what does Column play? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[e2[1]], accept: [], hint: `At (${rl[e2[0]]}, ?), find the mutual best response.` },
    ],
    finalAnswer: { value: `(${rl[e1[0]]}, ${cl[e1[1]]}) and (${rl[e2[0]]}, ${cl[e2[1]]})`, unit: "" },
    solutionNarrative: `Both (${rl[e1[0]]}, ${cl[e1[1]]}) and (${rl[e2[0]]}, ${cl[e2[1]]}) are mutual best responses, so the game has two pure Nash equilibria — typical of coordination games.`,
  };
};
fill["gt1-findnash-3"] = (rng, idx) => {
  // Unique Nash from a game that also has a dominant strategy — connect ideas.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  let pay, eqs, rdom, guard = 0;
  do { pay = cleanGame(rng); eqs = pureNash(pay); rdom = rowDominance(pay); guard++; }
  while (!(eqs.length === 1 && rdom) && guard < 500);
  if (!(eqs.length === 1 && rdom)) { pay = [[[5, 2], [4, 4]], [[2, 1], [1, 3]]]; eqs = pureNash(pay); rdom = rowDominance(pay); }
  const [er, ec] = eqs[0];
  return {
    id: `gen.gt1-findnash-3.${idx}`, generated: true, concepts: ["finding-pure-nash"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row has a strictly dominant strategy. Which? Choose ${rl[0]} or ${rl[1]}.`, answer: rl[rdom.dom], accept: [], hint: `It beats the other row in both columns.` },
      { instruction: `Given Row will play ${rl[rdom.dom]}, Column best-responds with? Choose ${cl[0]} or ${cl[1]}.`, answer: cl[ec], accept: [], hint: `In row ${rl[rdom.dom]}, larger second entry.` },
      { instruction: `How many pure Nash equilibria does the game have? (Give an integer.)`, answer: "1", accept: [], hint: `A dominant strategy pins down a unique equilibrium here.` },
    ],
    finalAnswer: { value: `(${rl[er]}, ${cl[ec]})`, unit: "" },
    solutionNarrative: `Row's dominant ${rl[rdom.dom]} forces the equilibrium; Column replies ${cl[ec]}, giving the unique Nash equilibrium (${rl[er]}, ${cl[ec]}). A dominant-strategy equilibrium is automatically a Nash equilibrium.`,
  };
};

// --- coordination-and-anticoordination: coordination games; count equilibria ---
fill["gt1-coord-1"] = (rng, idx) => {
  // Pure coordination: both prefer to match. Two equilibria on the diagonal.
  const rl = ["A", "B"], cl = ["A", "B"];
  const hi = rng.int(3, 6), lo = rng.int(0, 2);
  // match -> (hi, hi) with possibly different diagonal values; mismatch -> (lo, lo).
  const d0 = rng.int(3, 6), d1 = rng.int(3, 6);
  const pay = [
    [[d0, d0], [lo, lo]],
    [[lo, lo], [d1, d1]],
  ];
  return {
    id: `gen.gt1-coord-1.${idx}`, generated: true, concepts: ["coordination-and-anticoordination"], difficulty: 1, context: "applied",
    prompt: `Two firms choose a technology standard, **A** or **B**. They earn well only if they **match**; mismatching wastes effort. Each cell is (Firm Row's payoff, Firm Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `If Column picks A, is Row's best response also A? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `${pay[0][0][0]} (match A) vs ${pay[1][0][0]} (mismatch).` },
      { instruction: `How many pure Nash equilibria (matching outcomes) are there? (Give an integer.)`, answer: "2", accept: [], hint: `Both (A, A) and (B, B) are self-reinforcing.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `Matching pays (${pay[0][0][0]},${pay[0][0][1]}) or (${pay[1][1][0]},${pay[1][1][1]}); mismatching pays ${lo}. Both (A, A) and (B, B) are Nash equilibria, so coordination has two equilibria — the puzzle is which one they land on.`,
  };
};
fill["gt1-coord-2"] = (rng, idx) => {
  // Battle of the Sexes flavor: two equilibria, players disagree on which.
  const rl = ["Opera", "Boxing"], cl = ["Opera", "Boxing"];
  const big = rng.int(2, 3), small = 1;
  // Row prefers Opera, Column prefers Boxing; both prefer being together.
  const pay = [
    [[big + 1, small + 1], [0, 0]],
    [[0, 0], [small + 1, big + 1]],
  ];
  return {
    id: `gen.gt1-coord-2.${idx}`, generated: true, concepts: ["coordination-and-anticoordination"], difficulty: 2, context: "applied",
    prompt: `**Battle of the Sexes.** A couple wants a night out **together**, but Row prefers Opera and Column prefers Boxing. Being apart is worst for both. Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is (Opera, Opera) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Would either deviate to being alone (payoff 0)?` },
      { instruction: `Is (Boxing, Boxing) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Check unilateral deviations again.` },
      { instruction: `How many pure Nash equilibria in total? (Give an integer.)`, answer: "2", accept: [], hint: `Count the together-outcomes that survive.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `Both (Opera, Opera) and (Boxing, Boxing) are Nash — neither wants to be alone (payoff 0). The two equilibria differ in who gets their favorite; this conflict over which equilibrium is the essence of coordination-with-conflict.`,
  };
};
fill["gt1-coord-3"] = (rng, idx) => {
  // Anti-coordination (Hawk-Dove / Chicken flavor): two equilibria OFF-diagonal.
  const rl = ["Swerve", "Straight"], cl = ["Swerve", "Straight"];
  // Chicken payoffs: both straight = crash (worst). One straight one swerve:
  // straight wins, swerve loses face. Both swerve: mild.
  const pay = [
    [[3, 3], [2, 4]],
    [[4, 2], [1, 1]],
  ];
  const eqs = pureNash(pay); // should be the two off-diagonal
  return {
    id: `gen.gt1-coord-3.${idx}`, generated: true, concepts: ["coordination-and-anticoordination"], difficulty: 3, context: "applied",
    prompt: `**Chicken.** Two drivers speed at each other. Each may **Swerve** or go **Straight**. Both straight = crash (worst); if exactly one goes straight, that driver "wins". Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is (Swerve, Straight) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Row swerves, Column goes straight — would either change?` },
      { instruction: `Is (Straight, Straight) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `From a crash, either driver would rather have swerved.` },
      { instruction: `How many pure Nash equilibria does Chicken have? (Give an integer.)`, answer: "2", accept: [], hint: `The two "one swerves, one doesn't" outcomes.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `The pure equilibria are the two off-diagonal cells (Swerve, Straight) and (Straight, Swerve): each player wants to do the OPPOSITE of the other. Unlike coordination, anti-coordination equilibria sit off the diagonal.`,
  };
};

// --- no-pure-equilibrium: recognize when none exists (yes/no) ---
fill["gt1-nopure-1"] = (rng, idx) => {
  // Matching Pennies style: no pure Nash.
  const rl = ["Heads", "Tails"], cl = ["Heads", "Tails"];
  // Row wants match, Column wants mismatch.
  const pay = [
    [[1, -1], [-1, 1]],
    [[-1, 1], [1, -1]],
  ];
  return {
    id: `gen.gt1-nopure-1.${idx}`, generated: true, concepts: ["no-pure-equilibrium"], difficulty: 1, context: "applied",
    prompt: `**Matching Pennies.** Row wins by **matching**, Column wins by **mismatching** (zero-sum: one's +1 is the other's −1). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Start at (Heads, Heads). Row is happy (matched), but would Column want to switch to Tails? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Column prefers a mismatch.` },
      { instruction: `Does this game have any pure-strategy Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Someone always wants to deviate — chase the cycle.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `From any cell, one player wants to move: if they match, Column flips; if they mismatch, Row flips. The best responses chase each other in a cycle, so there is NO pure Nash equilibrium (only a mixed one).`,
  };
};
fill["gt1-nopure-2"] = (rng, idx) => {
  // Generic: decide yes/no whether a game has a pure Nash; here randomly with/without.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const cyclic = rng.int(0, 1) === 0;
  let pay;
  if (cyclic) {
    // no pure NE: Row wants to match column index, Column wants to mismatch.
    pay = [[[3, 1], [1, 3]], [[1, 3], [3, 1]]];
    // scramble a bit to vary numbers while preserving the cycle structure
    const a = rng.int(2, 5), b = rng.int(0, 1);
    pay = [[[a, b], [b, a]], [[b, a], [a, b]]];
  } else {
    // has a pure NE
    pay = cleanGame(rng);
    if (pureNash(pay).length === 0) pay = [[[4, 4], [1, 2]], [[2, 1], [3, 3]]];
  }
  const eqs = pureNash(pay);
  const has = eqs.length > 0;
  return {
    id: `gen.gt1-nopure-2.${idx}`, generated: true, concepts: ["no-pure-equilibrium"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Determine whether a pure-strategy Nash equilibrium exists.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Check each cell for a profitable deviation. Does a pure Nash equilibrium exist? Type 'yes' or 'no'.`, answer: has ? "yes" : "no", accept: has ? YES : NO, hint: `A pure NE is a cell where NEITHER player can gain by switching alone.` },
      { instruction: `How many pure Nash equilibria are there? (Give an integer.)`, answer: `${eqs.length}`, accept: [], hint: `Count the mutual-best-response cells (may be 0).` },
    ],
    finalAnswer: { value: has ? "yes" : "no", unit: "" },
    solutionNarrative: has
      ? `There ${eqs.length === 1 ? "is 1 cell" : `are ${eqs.length} cells`} with no profitable unilateral deviation, so a pure Nash equilibrium exists.`
      : `Every cell has a player who wants to deviate; best responses cycle, so NO pure Nash equilibrium exists (a mixed equilibrium still does, by Nash's theorem).`,
  };
};
fill["gt1-nopure-3"] = (rng, idx) => {
  // Zero-sum with no pure NE, verify by checking all four cells' deviations, then
  // note existence of mixed equilibrium.
  const rl = ["Attack Left", "Attack Right"], cl = ["Defend Left", "Defend Right"];
  // Attacker wins by mismatching defender; defender wins by matching. No pure NE.
  const w = rng.int(2, 5);
  const pay = [
    [[0, w], [w, 0]],
    [[w, 0], [0, w]],
  ];
  return {
    id: `gen.gt1-nopure-3.${idx}`, generated: true, concepts: ["no-pure-equilibrium"], difficulty: 3, context: "applied",
    prompt: `A penalty-kick style duel. The **Attacker** (Row) wins by going where the **Defender** (Column) does NOT; the Defender wins by matching. Each cell is (Attacker's payoff, Defender's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is (Attack Left, Defend Left) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `The Attacker (payoff 0) would switch to exploit the gap.` },
      { instruction: `Does any pure-strategy Nash equilibrium exist? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Predictability is fatal for whoever is being predicted.` },
      { instruction: `Nash proved every finite game has at least one equilibrium — in what kind of strategies must it be here? Type 'pure' or 'mixed'.`, answer: "mixed", accept: [], hint: `Randomize to stay unpredictable.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `Any pure choice can be predicted and beaten, so no pure Nash equilibrium exists. The equilibrium is in MIXED strategies — each side randomizes 50/50 to remain unexploitable, exactly what real penalty takers do.`,
  };
};

// ===========================================================================
// TOPIC 3: game-theory.mixed-strategies
//   concepts: expected-payoff, indifference-principle,
//             mixed-nash-2x2, value-under-mixing
// ===========================================================================

// Mixing helper: given a 2x2 zero-sum-ish or general game, compute the mixed NE
// where the OTHER player is made indifferent. For Row's mix (p on Top), Column
// is indifferent when p*colTL + (1-p)*colBL = p*colTR + (1-p)*colBR.
// Solve p = (colBR - colBL) / (colTL - colBL - colTR + colBR).
function rowMixMakesColIndifferent(pay) {
  const A = pay[0][0][1], B = pay[0][1][1], C = pay[1][0][1], D = pay[1][1][1];
  const denom = A - C - B + D;
  if (denom === 0) return null;
  const num = D - C;
  const f = frac(num, denom);
  return f; // p = probability Row plays Top
}
// Column's mix (q on Left) makes Row indifferent:
// q*rowTL + (1-q)*rowTR = q*rowBL + (1-q)*rowBR
// q = (rowBR - rowTR) / (rowTL - rowTR - rowBL + rowBR).
function colMixMakesRowIndifferent(pay) {
  const A = pay[0][0][0], B = pay[0][1][0], C = pay[1][0][0], D = pay[1][1][0];
  const denom = A - B - C + D;
  if (denom === 0) return null;
  const num = D - B;
  const f = frac(num, denom);
  return f; // q = probability Column plays Left
}

// Build a 2x2 with a proper interior mixed equilibrium (both mixing in (0,1))
// and no pure NE (so mixing is THE equilibrium). We use the anti-coordination /
// matching structure and verify both p and q lie strictly in (0,1).
function mixingGame(rng) {
  let pay, p, q, guard = 0;
  do {
    // Random payoffs but structured so best responses cycle: use a "match vs
    // mismatch" template with random distinct values.
    const v = distinctInts(rng, 4, 1, 8);
    const [a, b, c, d] = v;
    // Row prefers to match column; Column prefers to mismatch -> cyclic.
    pay = [
      [[a, b], [c, d]],
      [[c, d], [a, b]],
    ];
    // Ensure no pure NE and non-degenerate mixes.
    p = rowMixMakesColIndifferent(pay);
    q = colMixMakesRowIndifferent(pay);
    guard++;
  } while ((!p || !q || pureNash(pay).length > 0 ||
            p.n <= 0 || p.n >= p.d || q.n <= 0 || q.n >= q.d) && guard < 400);
  if (guard >= 400) {
    pay = [[[2, 1], [0, 4]], [[0, 4], [2, 1]]];
    p = rowMixMakesColIndifferent(pay); q = colMixMakesRowIndifferent(pay);
  }
  return { pay, p, q };
}

// --- expected-payoff: a player's expected payoff vs a mixed opponent (numeric) ---
fill["gt1-exppay-1"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 4, 0, 8);
  const pay = [[[v[0], 0], [v[1], 0]], [[v[2], 0], [v[3], 0]]];
  // Column mixes: Left w.p. q = a/b (clean), ask Row's expected payoff from a fixed row.
  const qOpts = [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3]];
  const [qn, qd] = rng.pick(qOpts);
  const rowChoice = rng.int(0, 1);
  // E = q*pay[row][0][0] + (1-q)*pay[row][1][0]
  const eNum = qn * pay[rowChoice][0][0] + (qd - qn) * pay[rowChoice][1][0];
  const eDen = qd;
  const eStr = probStr(eNum, eDen);
  const eDec = rnd(eNum / eDen, 4);
  return {
    id: `gen.gt1-exppay-1.${idx}`, generated: true, concepts: ["expected-payoff"], difficulty: 1, context: "abstract",
    prompt: `Each cell shows **Row's payoff** (Column's omitted). Column plays a mixed strategy: **${cl[0]}** with probability $${probStr(qn, qd)}$ and **${cl[1]}** with probability $${probStr(qd - qn, qd)}$.\n\n${bimatrixTable(rl, cl, pay)}\n\nSuppose Row plays **${rl[rowChoice]}**.`,
    steps: [
      { instruction: `Row's expected payoff $= ${probStr(qn, qd)}\\cdot ${pay[rowChoice][0][0]} + ${probStr(qd - qn, qd)}\\cdot ${pay[rowChoice][1][0]}$. Give a fraction or decimal.`, answer: eStr, accept: eStr === eDec ? [] : [eDec, `${eNum}/${eDen}`], hint: `Weight each payoff by Column's probability and add.` },
    ],
    finalAnswer: { value: eStr, unit: "" },
    solutionNarrative: `Playing ${rl[rowChoice]}, Row expects $${probStr(qn, qd)}(${pay[rowChoice][0][0]}) + ${probStr(qd - qn, qd)}(${pay[rowChoice][1][0]}) = ${eStr}$.`,
  };
};
fill["gt1-exppay-2"] = (rng, idx) => {
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 4, 0, 9);
  const pay = [[[v[0], 0], [v[1], 0]], [[v[2], 0], [v[3], 0]]];
  const qOpts = [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [2, 5]];
  const [qn, qd] = rng.pick(qOpts);
  // Compare both rows' expected payoffs; which is better?
  const eTop = frac(qn * pay[0][0][0] + (qd - qn) * pay[0][1][0], qd);
  const eBot = frac(qn * pay[1][0][0] + (qd - qn) * pay[1][1][0], qd);
  const topBetter = eTop.n / eTop.d > eBot.n / eBot.d;
  const tie = eTop.n / eTop.d === eBot.n / eBot.d;
  if (tie) { return fill["gt1-exppay-2"](rng, idx); }
  const betterLabel = topBetter ? rl[0] : rl[1];
  const eTopStr = probStr(qn * pay[0][0][0] + (qd - qn) * pay[0][1][0], qd);
  const eBotStr = probStr(qn * pay[1][0][0] + (qd - qn) * pay[1][1][0], qd);
  return {
    id: `gen.gt1-exppay-2.${idx}`, generated: true, concepts: ["expected-payoff"], difficulty: 2, context: "abstract",
    prompt: `Each cell shows Row's payoff. Column plays **${cl[0]}** with probability $${probStr(qn, qd)}$, **${cl[1]}** with probability $${probStr(qd - qn, qd)}$.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Expected payoff to Row from ${rl[0]}: $${probStr(qn, qd)}(${pay[0][0][0]}) + ${probStr(qd - qn, qd)}(${pay[0][1][0]})$. Give a fraction or decimal.`, answer: eTopStr, accept: [rnd(eTop.n / eTop.d, 4)], hint: `Weight and add.` },
      { instruction: `Expected payoff to Row from ${rl[1]}: $${probStr(qn, qd)}(${pay[1][0][0]}) + ${probStr(qd - qn, qd)}(${pay[1][1][0]})$. Give a fraction or decimal.`, answer: eBotStr, accept: [rnd(eBot.n / eBot.d, 4)], hint: `Weight and add.` },
      { instruction: `Which row is Row's better response to this mix? Choose ${rl[0]} or ${rl[1]}.`, answer: betterLabel, accept: [], hint: `Pick the larger expected payoff.` },
    ],
    finalAnswer: { value: betterLabel, unit: "" },
    solutionNarrative: `Row's expected payoffs are ${eTopStr} (${rl[0]}) and ${eBotStr} (${rl[1]}); ${betterLabel} is the better response to Column's mix.`,
  };
};
fill["gt1-exppay-3"] = (rng, idx) => {
  // Full payoff, expected payoff vs a general mix, decimal rounding.
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const v = distinctInts(rng, 8, 0, 9);
  const pay = [[[v[0], v[1]], [v[2], v[3]]], [[v[4], v[5]], [v[6], v[7]]]];
  const qOpts = [[3, 10], [7, 10], [4, 10], [1, 5], [2, 5]];
  const [qn, qd] = rng.pick(qOpts);
  const rowChoice = rng.int(0, 1);
  const eNum = qn * pay[rowChoice][0][0] + (qd - qn) * pay[rowChoice][1][0];
  const eDen = qd;
  const eDec = rnd(eNum / eDen, 4);
  const eStr = probStr(eNum, eDen);
  return {
    id: `gen.gt1-exppay-3.${idx}`, generated: true, concepts: ["expected-payoff"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Column mixes: **${cl[0]}** with probability $${probStr(qn, qd)}$, **${cl[1]}** with probability $${probStr(qd - qn, qd)}$. Row plays **${rl[rowChoice]}**.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row's payoff if Column plays ${cl[0]}. (Give a number.)`, answer: `${pay[rowChoice][0][0]}`, accept: [], hint: `First entry, row ${rl[rowChoice]}, column ${cl[0]}.` },
      { instruction: `Row's payoff if Column plays ${cl[1]}. (Give a number.)`, answer: `${pay[rowChoice][1][0]}`, accept: [], hint: `First entry, row ${rl[rowChoice]}, column ${cl[1]}.` },
      { instruction: `Expected payoff $= ${probStr(qn, qd)}(${pay[rowChoice][0][0]}) + ${probStr(qd - qn, qd)}(${pay[rowChoice][1][0]})$. Give a fraction or a decimal rounded to 4 places.`, answer: eDec, accept: eStr === eDec ? [] : [eStr, `${eNum}/${eDen}`], hint: `Weight by the probabilities and add.` },
    ],
    finalAnswer: { value: eDec, unit: "" },
    solutionNarrative: `Row's expected payoff from ${rl[rowChoice]} is $${probStr(qn, qd)}(${pay[rowChoice][0][0]}) + ${probStr(qd - qn, qd)}(${pay[rowChoice][1][0]}) = ${eDec}$.`,
  };
};

// --- indifference-principle: set opponent indifferent -> solve mixing prob p ---
fill["gt1-indiff-1"] = (rng, idx) => {
  const { pay, p } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Solve for Column's mixing q that makes ROW indifferent (present the algebra).
  const q = colMixMakesRowIndifferent(pay);
  const A = pay[0][0][0], B = pay[0][1][0], C = pay[1][0][0], D = pay[1][1][0];
  const qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-indiff-1.${idx}`, generated: true, concepts: ["indifference-principle"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). In a mixed equilibrium, Column chooses **${cl[0]}** with probability $q$ so that **Row is indifferent** between ${rl[0]} and ${rl[1]}.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Row's expected payoff from ${rl[0]} is $${A}q + ${B}(1-q)$ and from ${rl[1]} is $${C}q + ${D}(1-q)$. Set them equal and solve for $q$. Give a fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `Solve $${A}q + ${B}(1-q) = ${C}q + ${D}(1-q)$ for $q$.` },
    ],
    finalAnswer: { value: qStr, unit: "" },
    solutionNarrative: `Setting Row's two expected payoffs equal gives $q = ${qStr}$: at this Column mix, Row is indifferent and therefore willing to randomize.`,
  };
};
fill["gt1-indiff-2"] = (rng, idx) => {
  const { pay, p } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Solve for Row's mix p making COLUMN indifferent, showing the linear equation.
  const A = pay[0][0][1], B = pay[1][0][1], C = pay[0][1][1], D = pay[1][1][1];
  // Column indifferent: p*A + (1-p)*B = p*C + (1-p)*D
  const pStr = probStr(p.n, p.d);
  return {
    id: `gen.gt1-indiff-2.${idx}`, generated: true, concepts: ["indifference-principle"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Row plays **${rl[0]}** with probability $p$. Find the $p$ that makes **Column indifferent** between ${cl[0]} and ${cl[1]}.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Column's expected payoff from ${cl[0]} is $${A}p + ${B}(1-p)$; from ${cl[1]} it is $${C}p + ${D}(1-p)$. Set equal and solve for $p$. Give a fraction or decimal in (0,1).`, answer: pStr, accept: [rnd(p.n / p.d, 4), `${p.n}/${p.d}`], hint: `Solve $${A}p + ${B}(1-p) = ${C}p + ${D}(1-p)$.` },
      { instruction: `Then Row plays ${rl[1]} with probability $1-p$. Give that probability.`, answer: probStr(p.d - p.n, p.d), accept: [rnd((p.d - p.n) / p.d, 4)], hint: `Subtract $p$ from 1.` },
    ],
    finalAnswer: { value: pStr, unit: "" },
    solutionNarrative: `Column is indifferent when $p = ${pStr}$, so Row plays ${rl[0]} with probability ${pStr} and ${rl[1]} with probability ${probStr(p.d - p.n, p.d)}.`,
  };
};
fill["gt1-indiff-3"] = (rng, idx) => {
  // Applied: penalty kicks. Solve keeper's mix to make kicker indifferent.
  const { pay, p } = mixingGame(rng);
  const rl = ["Kick Left", "Kick Right"], cl = ["Dive Left", "Dive Right"];
  const q = colMixMakesRowIndifferent(pay);
  const A = pay[0][0][0], B = pay[0][1][0], C = pay[1][0][0], D = pay[1][1][0];
  const qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-indiff-3.${idx}`, generated: true, concepts: ["indifference-principle"], difficulty: 3, context: "applied",
    prompt: `**Penalty kick.** The Kicker (Row) scores more often when the Keeper dives the wrong way. The Keeper (Column) dives **Left** with probability $q$. Choose $q$ to make the Kicker **indifferent** between kicking Left and Right (the Keeper's equilibrium mix). Each cell is (Kicker's scoring payoff, Keeper's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Kicker's expected payoff from Kick Left: $${A}q + ${B}(1-q)$. Kicker's from Kick Right: $${C}q + ${D}(1-q)$. Set equal, solve for $q$. Fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `Equate the two lines in $q$ and isolate $q$.` },
      { instruction: `The Keeper dives Right with probability $1-q$. Give it.`, answer: probStr(q.d - q.n, q.d), accept: [rnd((q.d - q.n) / q.d, 4)], hint: `$1 - q$.` },
    ],
    finalAnswer: { value: qStr, unit: "" },
    solutionNarrative: `Making the Kicker indifferent pins the Keeper's dive-Left probability at $q = ${qStr}$. This is exactly how goalkeepers must randomize to be unexploitable.`,
  };
};

// --- mixed-nash-2x2: both players' equilibrium mixing probabilities ---
fill["gt1-mixnash-1"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pStr = probStr(p.n, p.d), qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-mixnash-1.${idx}`, generated: true, concepts: ["mixed-nash-2x2"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). This game has no pure Nash equilibrium; find the **mixed** one. Let $p$ = probability Row plays ${rl[0]}, and $q$ = probability Column plays ${cl[0]}.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Find $p$ (makes Column indifferent). Fraction or decimal in (0,1).`, answer: pStr, accept: [rnd(p.n / p.d, 4), `${p.n}/${p.d}`], hint: `Equate Column's two expected payoffs in $p$.` },
      { instruction: `Find $q$ (makes Row indifferent). Fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `Equate Row's two expected payoffs in $q$.` },
    ],
    finalAnswer: { value: `p = ${pStr}, q = ${qStr}`, unit: "" },
    solutionNarrative: `The mixed Nash equilibrium is $p = ${pStr}$ (Row's mix) and $q = ${qStr}$ (Column's mix). Each player randomizes to keep the OTHER indifferent — a hallmark of mixed equilibria.`,
  };
};
fill["gt1-mixnash-2"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pStr = probStr(p.n, p.d), qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-mixnash-2.${idx}`, generated: true, concepts: ["mixed-nash-2x2"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Find the mixed Nash equilibrium. $p$ = prob Row plays ${rl[0]}; $q$ = prob Column plays ${cl[0]}.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Solve for $p$ (Column indifferent). Fraction or decimal in (0,1).`, answer: pStr, accept: [rnd(p.n / p.d, 4), `${p.n}/${p.d}`], hint: `Set Column's two expected payoffs equal.` },
      { instruction: `Row plays ${rl[1]} with probability $1-p$. Give it.`, answer: probStr(p.d - p.n, p.d), accept: [rnd((p.d - p.n) / p.d, 4)], hint: `$1 - p$.` },
      { instruction: `Solve for $q$ (Row indifferent). Fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `Set Row's two expected payoffs equal.` },
    ],
    finalAnswer: { value: `p = ${pStr}, q = ${qStr}`, unit: "" },
    solutionNarrative: `Row mixes $(${pStr}, ${probStr(p.d - p.n, p.d)})$ over $(${rl[0]}, ${rl[1]})$ and Column mixes with $q = ${qStr}$ on ${cl[0]}. Together these form the unique mixed Nash equilibrium.`,
  };
};
fill["gt1-mixnash-3"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  const pStr = probStr(p.n, p.d), qStr = probStr(q.n, q.d);
  // Also confirm no pure NE as part of the reasoning.
  return {
    id: `gen.gt1-mixnash-3.${idx}`, generated: true, concepts: ["mixed-nash-2x2"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). $p$ = prob Row plays ${rl[0]}; $q$ = prob Column plays ${cl[0]}.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Does this game have a pure-strategy Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Best responses cycle here.` },
      { instruction: `Solve for the equilibrium $p$. Fraction or decimal in (0,1).`, answer: pStr, accept: [rnd(p.n / p.d, 4), `${p.n}/${p.d}`], hint: `Make Column indifferent.` },
      { instruction: `Solve for the equilibrium $q$. Fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `Make Row indifferent.` },
    ],
    finalAnswer: { value: `p = ${pStr}, q = ${qStr}`, unit: "" },
    solutionNarrative: `No pure equilibrium exists, but Nash's theorem guarantees a mixed one: $p = ${pStr}$, $q = ${qStr}$. Each player's mix is designed to make the opponent indifferent.`,
  };
};

// --- value-under-mixing: equilibrium expected payoff (numeric) ---
fill["gt1-value-1"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Row's equilibrium value = expected payoff when Column plays q (Row indifferent,
  // so use either row): use Top row: q*rowTL + (1-q)*rowTR.
  const A = pay[0][0][0], B = pay[0][1][0];
  const valNum = q.n * A + (q.d - q.n) * B;
  const valDen = q.d;
  const valStr = probStr(valNum, valDen);
  const valDec = rnd(valNum / valDen, 4);
  const qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-value-1.${idx}`, generated: true, concepts: ["value-under-mixing"], difficulty: 1, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). At the mixed equilibrium Column plays ${cl[0]} with probability $q = ${qStr}$. Since Row is indifferent, Row's equilibrium value equals the expected payoff of EITHER row.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Compute Row's value using ${rl[0]}: $${qStr}(${A}) + ${probStr(q.d - q.n, q.d)}(${B})$. Fraction or decimal.`, answer: valStr, accept: valStr === valDec ? [] : [valDec, `${valNum}/${valDen}`], hint: `Weight ${rl[0]}'s two payoffs by $q$ and $1-q$.` },
    ],
    finalAnswer: { value: valStr, unit: "" },
    solutionNarrative: `Row's equilibrium value is $${qStr}(${A}) + ${probStr(q.d - q.n, q.d)}(${B}) = ${valStr}$ — the guaranteed expected payoff of the mixed equilibrium.`,
  };
};
fill["gt1-value-2"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Compute the equilibrium value both ways to confirm indifference.
  const A = pay[0][0][0], B = pay[0][1][0], C = pay[1][0][0], D = pay[1][1][0];
  const vTopNum = q.n * A + (q.d - q.n) * B;
  const vBotNum = q.n * C + (q.d - q.n) * D;
  const valStr = probStr(vTopNum, q.d);
  const qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-value-2.${idx}`, generated: true, concepts: ["value-under-mixing"], difficulty: 2, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Column's equilibrium mix is $q = ${qStr}$ on ${cl[0]}. Verify Row's indifference by computing BOTH rows' expected payoffs.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Expected payoff of ${rl[0]}: $${qStr}(${A}) + ${probStr(q.d - q.n, q.d)}(${B})$. Fraction or decimal.`, answer: valStr, accept: [rnd(vTopNum / q.d, 4), `${vTopNum}/${q.d}`], hint: `Weight and add.` },
      { instruction: `Expected payoff of ${rl[1]}: $${qStr}(${C}) + ${probStr(q.d - q.n, q.d)}(${D})$. It should EQUAL the previous value. Fraction or decimal.`, answer: probStr(vBotNum, q.d), accept: [rnd(vBotNum / q.d, 4), `${vBotNum}/${q.d}`], hint: `Indifference means these two match.` },
    ],
    finalAnswer: { value: valStr, unit: "" },
    solutionNarrative: `Both rows return ${valStr} against Column's $q = ${qStr}$ — that equality IS Row's indifference, and the common number is Row's equilibrium value.`,
  };
};
fill["gt1-value-3"] = (rng, idx) => {
  const { pay, p, q } = mixingGame(rng);
  const rl = RC_LABELS.row, cl = RC_LABELS.col;
  // Column's equilibrium value using p (Column indifferent): p*colTL + (1-p)*colBL.
  const A = pay[0][0][1], B = pay[1][0][1]; // colTL, colBL
  const cValNum = p.n * A + (p.d - p.n) * B;
  const cValStr = probStr(cValNum, p.d);
  const cValDec = rnd(cValNum / p.d, 4);
  const pStr = probStr(p.n, p.d);
  return {
    id: `gen.gt1-value-3.${idx}`, generated: true, concepts: ["value-under-mixing"], difficulty: 3, context: "abstract",
    prompt: `Each cell is (Row's payoff, Column's payoff). Row's equilibrium mix is $p = ${pStr}$ on ${rl[0]}. Compute **Column's** equilibrium value (expected Column payoff when facing Row's mix, using column ${cl[0]}).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Column's payoff if it plays ${cl[0]}, given Row's mix: $${pStr}(${A}) + ${probStr(p.d - p.n, p.d)}(${B})$. Fraction or decimal rounded to 4 places.`, answer: cValDec, accept: cValStr === cValDec ? [] : [cValStr, `${cValNum}/${p.d}`], hint: `Weight column ${cl[0]}'s two payoffs by Row's $p$ and $1-p$.` },
    ],
    finalAnswer: { value: cValDec, unit: "" },
    solutionNarrative: `Facing Row's mix $p = ${pStr}$, Column's expected payoff (either column, by indifference) is $${pStr}(${A}) + ${probStr(p.d - p.n, p.d)}(${B}) = ${cValDec}$ — Column's value of the game.`,
  };
};

// ===========================================================================
// TOPIC 4: game-theory.classic-games
//   concepts: prisoners-dilemma, coordination-games,
//             anti-coordination, matching-pennies-and-zero-sum
// ===========================================================================

// --- prisoners-dilemma: dominant strategies, (Defect,Defect), Pareto ---
fill["gt1-pd-1"] = (rng, idx) => {
  const rl = ["Cooperate", "Defect"], cl = ["Cooperate", "Defect"];
  // Standard PD ordering: T > R > P > S. Build with random gaps.
  const P = rng.int(1, 3);            // punishment (mutual defect)
  const R = P + rng.int(1, 3);        // reward (mutual cooperate)
  const T = R + rng.int(1, 3);        // temptation
  const S = 0;                        // sucker
  // pay[coop/defect][coop/defect] = [rowP, colP]
  const pay = [
    [[R, R], [S, T]],
    [[T, S], [P, P]],
  ];
  return {
    id: `gen.gt1-pd-1.${idx}`, generated: true, concepts: ["prisoners-dilemma"], difficulty: 1, context: "applied",
    prompt: `**Prisoner's Dilemma.** Two suspects each choose **Cooperate** (stay silent) or **Defect** (confess). Each cell is (Row's payoff, Column's payoff); higher is better.\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `If Column Cooperates, Row compares Cooperate (${R}) vs Defect (${T}). Row's best response? Choose Cooperate or Defect.`, answer: "Defect", accept: [], hint: `${T} > ${R}.` },
      { instruction: `Each player's strictly dominant strategy is? Choose Cooperate or Defect.`, answer: "Defect", accept: [], hint: `Defect beats Cooperate in BOTH columns.` },
    ],
    finalAnswer: { value: "Defect", unit: "" },
    solutionNarrative: `Because $T > R$ and $P > S$, Defect strictly dominates for both players. The dominant-strategy equilibrium is (Defect, Defect) at (${P}, ${P}) — worse for both than mutual cooperation (${R}, ${R}).`,
  };
};
fill["gt1-pd-2"] = (rng, idx) => {
  const rl = ["Cooperate", "Defect"], cl = ["Cooperate", "Defect"];
  const P = rng.int(1, 3), R = 0, S = 0, T = 0; // placeholder overwritten below
  const Pp = rng.int(1, 3);
  const Rr = Pp + rng.int(1, 3);
  const Tt = Rr + rng.int(1, 3);
  const Ss = 0;
  const pay = [
    [[Rr, Rr], [Ss, Tt]],
    [[Tt, Ss], [Pp, Pp]],
  ];
  return {
    id: `gen.gt1-pd-2.${idx}`, generated: true, concepts: ["prisoners-dilemma"], difficulty: 2, context: "applied",
    prompt: `**Prisoner's Dilemma.** Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `What is the Nash-equilibrium outcome? Enter Row's strategy: Cooperate or Defect.`, answer: "Defect", accept: [], hint: `Both play their dominant strategy.` },
      { instruction: `At (Defect, Defect), each earns ${Pp}. At (Cooperate, Cooperate) each would earn ${Rr}. Which mutual outcome is better for both? Type 'Cooperate' or 'Defect'.`, answer: "Cooperate", accept: [], hint: `Compare ${Rr} with ${Pp}.` },
      { instruction: `How much MORE would each earn under mutual cooperation than under the equilibrium? (Give a number.)`, answer: `${Rr - Pp}`, accept: [], hint: `${Rr} − ${Pp}.` },
    ],
    finalAnswer: { value: "Defect", unit: "" },
    solutionNarrative: `The equilibrium (Defect, Defect) pays ${Pp} each, yet (Cooperate, Cooperate) pays ${Rr} each — a Pareto improvement of ${Rr - Pp} per player that rational self-interest throws away. That gap is the dilemma.`,
  };
};
fill["gt1-pd-3"] = (rng, idx) => {
  // Applied duopoly: price high (cooperate) vs low (defect).
  const rl = ["Price High", "Price Low"], cl = ["Price High", "Price Low"];
  const Pp = rng.int(2, 4);
  const Rr = Pp + rng.int(2, 4);
  const Tt = Rr + rng.int(1, 3);
  const Ss = rng.int(0, 1);
  const pay = [
    [[Rr, Rr], [Ss, Tt]],
    [[Tt, Ss], [Pp, Pp]],
  ];
  return {
    id: `gen.gt1-pd-3.${idx}`, generated: true, concepts: ["prisoners-dilemma"], difficulty: 3, context: "applied",
    prompt: `**Price war (a Prisoner's Dilemma).** Two firms choose **Price High** (collude) or **Price Low** (compete). Payoffs are profits (Row's, Column's).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is "Price Low" a strictly dominant strategy for each firm? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Compare Price Low vs Price High in each column: ${Tt}>${Rr} and ${Pp}>${Ss}.` },
      { instruction: `Nash-equilibrium outcome — enter Row's strategy: Price High or Price Low.`, answer: "Price Low", accept: ["low"], hint: `Both defect to the low price.` },
      { instruction: `Collusive profit per firm is ${Rr}; equilibrium profit is ${Pp}. How much profit does each firm LOSE by competing? (Give a number.)`, answer: `${Rr - Pp}`, accept: [], hint: `${Rr} − ${Pp}.` },
    ],
    finalAnswer: { value: "Price Low", unit: "" },
    solutionNarrative: `Price Low dominates, so the equilibrium is (Price Low, Price Low) at ${Pp} each — below the ${Rr} of collusion. Competition destroys ${Rr - Pp} of profit per firm, which is exactly why cartels are unstable (and why antitrust relies on it).`,
  };
};

// --- coordination-games: Stag Hunt / BoS, equilibria ---
fill["gt1-coordg-1"] = (rng, idx) => {
  // Stag Hunt: (Stag,Stag) payoff-dominant, (Hare,Hare) risk-dominant.
  const rl = ["Stag", "Hare"], cl = ["Stag", "Hare"];
  const stag = rng.int(4, 6), hare = rng.int(2, 3);
  const pay = [
    [[stag, stag], [0, hare]],
    [[hare, 0], [hare, hare]],
  ];
  return {
    id: `gen.gt1-coordg-1.${idx}`, generated: true, concepts: ["coordination-games"], difficulty: 1, context: "applied",
    prompt: `**Stag Hunt.** Two hunters can jointly hunt a **Stag** (big shared reward, but only if BOTH commit) or individually catch a **Hare** (small but safe). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is (Stag, Stag) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `${stag} vs deviating to Hare (${hare}) — nobody gains by switching.` },
      { instruction: `Is (Hare, Hare) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `If the other hunts Hare, Stag alone earns 0.` },
      { instruction: `How many pure Nash equilibria? (Give an integer.)`, answer: "2", accept: [], hint: `Both diagonal outcomes are self-enforcing.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `Both (Stag, Stag) — the payoff-dominant equilibrium at ${stag} each — and (Hare, Hare) — the safe, risk-dominant one at ${hare} each — are Nash. Coordination games turn on trust: which equilibrium do players expect?`,
  };
};
fill["gt1-coordg-2"] = (rng, idx) => {
  // Battle of the Sexes, identify each equilibrium's players.
  const rl = ["Ballet", "Football"], cl = ["Ballet", "Football"];
  const big = rng.int(2, 3), small = 1;
  const pay = [
    [[big + 1, small + 1], [0, 0]],
    [[0, 0], [small + 1, big + 1]],
  ];
  return {
    id: `gen.gt1-coordg-2.${idx}`, generated: true, concepts: ["coordination-games"], difficulty: 2, context: "applied",
    prompt: `**Battle of the Sexes.** A couple wants to be together; Row prefers Ballet, Column prefers Football. Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `At the equilibrium Row prefers, both attend which event? Type 'Ballet' or 'Football'.`, answer: "Ballet", accept: [], hint: `Row's favorite equilibrium gives Row ${big + 1}.` },
      { instruction: `At the equilibrium Column prefers, both attend which event? Type 'Ballet' or 'Football'.`, answer: "Football", accept: [], hint: `Column's favorite gives Column ${big + 1}.` },
      { instruction: `Total number of pure Nash equilibria? (Give an integer.)`, answer: "2", accept: [], hint: `Both "together" outcomes qualify.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `(Ballet, Ballet) and (Football, Football) are both Nash — being together beats the (0,0) of being apart. The players agree they want to coordinate but disagree on which equilibrium, the signature of Battle of the Sexes.`,
  };
};
fill["gt1-coordg-3"] = (rng, idx) => {
  // Stag Hunt with payoff- vs risk-dominance reasoning.
  const rl = ["Stag", "Hare"], cl = ["Stag", "Hare"];
  const stag = rng.int(5, 8), hare = rng.int(2, 4);
  const pay = [
    [[stag, stag], [0, hare]],
    [[hare, 0], [hare, hare]],
  ];
  return {
    id: `gen.gt1-coordg-3.${idx}`, generated: true, concepts: ["coordination-games"], difficulty: 3, context: "applied",
    prompt: `**Stag Hunt** (trust and risk). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Which equilibrium gives BOTH players the highest payoff (payoff-dominant)? Type 'Stag' or 'Hare'.`, answer: "Stag", accept: [], hint: `${stag} each vs ${hare} each.` },
      { instruction: `Which single strategy guarantees at least ${hare} no matter what the other does (the safe, risk-dominant choice)? Type 'Stag' or 'Hare'.`, answer: "Hare", accept: [], hint: `Stag risks earning 0 if the partner defects.` },
      { instruction: `How many pure Nash equilibria are there? (Give an integer.)`, answer: "2", accept: [], hint: `Both diagonal cells.` },
    ],
    finalAnswer: { value: "Stag", unit: "" },
    solutionNarrative: `(Stag, Stag) is payoff-dominant (${stag} each) but risky; Hare is risk-dominant, guaranteeing ${hare}. Whether players reach the better equilibrium depends on trust — the deep lesson of coordination.`,
  };
};

// --- anti-coordination: Chicken / Hawk-Dove ---
fill["gt1-anti-1"] = (rng, idx) => {
  const rl = ["Hawk", "Dove"], cl = ["Hawk", "Dove"];
  // Hawk-Dove: V = resource value, C = fight cost, C > V. Hawk vs Hawk: (V-C)/2.
  const V = rng.pick([4, 6]); const C = V + rng.pick([2, 4]);
  const hh = (V - C) / 2; // negative
  const pay = [
    [[hh, hh], [V, 0]],
    [[0, V], [V / 2, V / 2]],
  ];
  return {
    id: `gen.gt1-anti-1.${idx}`, generated: true, concepts: ["anti-coordination"], difficulty: 1, context: "applied",
    prompt: `**Hawk-Dove.** Two animals contest a resource worth $V = ${V}$. Fighting (Hawk vs Hawk) costs $C = ${C}$, so each earns $(V-C)/2 = ${hh}$. A Hawk facing a Dove takes it all ($${V}$); two Doves share ($${V / 2}$ each). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `If Column plays Hawk, is Row's best response Dove? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Dove earns 0, but Hawk earns ${hh} (a loss) — 0 is better.` },
      { instruction: `If Column plays Dove, is Row's best response Hawk? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Hawk takes ${V} vs sharing ${V / 2}.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Each animal wants to do the OPPOSITE of its rival: play Hawk against a Dove, Dove against a Hawk. That anti-coordination gives two pure equilibria, (Hawk, Dove) and (Dove, Hawk).`,
  };
};
fill["gt1-anti-2"] = (rng, idx) => {
  const rl = ["Swerve", "Straight"], cl = ["Swerve", "Straight"];
  const crash = rng.pick([-2, -4, -6]);
  const win = rng.int(2, 4);
  const both = rng.int(1, 2);
  const pay = [
    [[both, both], [0, win]],
    [[win, 0], [crash, crash]],
  ];
  const eqs = pureNash(pay);
  return {
    id: `gen.gt1-anti-2.${idx}`, generated: true, concepts: ["anti-coordination"], difficulty: 2, context: "applied",
    prompt: `**Chicken.** Two drivers race head-on. **Straight** vs a swerving rival wins ($${win}$); both **Straight** crash ($${crash}$ each); both Swerve is mild ($${both}$ each). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is (Straight, Straight) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `From a crash (${crash}), either would rather have swerved (0).` },
      { instruction: `Is (Swerve, Straight) a Nash equilibrium? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Row swerving gets 0 (deviating to Straight crashes); Column straight gets ${win}.` },
      { instruction: `How many pure Nash equilibria does Chicken have? (Give an integer.)`, answer: "2", accept: [], hint: `The two off-diagonal outcomes.` },
    ],
    finalAnswer: { value: "2", unit: "" },
    solutionNarrative: `The equilibria are the two off-diagonal cells: exactly one driver yields. Anti-coordination rewards being different — and the mutual-Straight crash shows why brinkmanship is dangerous.`,
  };
};
fill["gt1-anti-3"] = (rng, idx) => {
  const rl = ["Hawk", "Dove"], cl = ["Hawk", "Dove"];
  const V = rng.pick([4, 6, 8]); const C = V + rng.pick([2, 4, 6]);
  const hh = (V - C) / 2;
  const pay = [
    [[hh, hh], [V, 0]],
    [[0, V], [V / 2, V / 2]],
  ];
  return {
    id: `gen.gt1-anti-3.${idx}`, generated: true, concepts: ["anti-coordination"], difficulty: 3, context: "applied",
    prompt: `**Hawk-Dove.** $V = ${V}$, $C = ${C}$; Hawk-Hawk yields $(V-C)/2 = ${hh}$ each. Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `List a pure Nash equilibrium — Row's strategy at the equilibrium where Row is aggressive. Type 'Hawk' or 'Dove'.`, answer: "Hawk", accept: [], hint: `(Hawk, Dove): Row Hawk takes ${V}.` },
      { instruction: `At that (Hawk, Dove) equilibrium, what is Row's payoff? (Give a number.)`, answer: `${V}`, accept: [], hint: `A Hawk facing a Dove takes the whole resource.` },
      { instruction: `How many pure Nash equilibria are there? (Give an integer.)`, answer: "2", accept: [], hint: `(Hawk, Dove) and (Dove, Hawk).` },
    ],
    finalAnswer: { value: `${V}`, unit: "" },
    solutionNarrative: `The pure equilibria are (Hawk, Dove) and (Dove, Hawk); the Hawk takes $V = ${V}$ while the Dove gets 0. In biology the stable population mixes the two, matching the mixed equilibrium — a founding idea of evolutionary game theory.`,
  };
};

// --- matching-pennies-and-zero-sum: no pure NE, 1/2-1/2 mixed ---
fill["gt1-mp-1"] = (rng, idx) => {
  const rl = ["Heads", "Tails"], cl = ["Heads", "Tails"];
  const pay = [
    [[1, -1], [-1, 1]],
    [[-1, 1], [1, -1]],
  ];
  return {
    id: `gen.gt1-mp-1.${idx}`, generated: true, concepts: ["matching-pennies-and-zero-sum"], difficulty: 1, context: "applied",
    prompt: `**Matching Pennies** (zero-sum). Row wins (+1) on a match, Column wins (+1) on a mismatch. Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Does this game have a pure Nash equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Someone always wants to switch.` },
      { instruction: `In the mixed equilibrium, with what probability does Row play Heads? Give a fraction or decimal.`, answer: "1/2", accept: ["0.5"], hint: `By symmetry the two options are equally likely.` },
    ],
    finalAnswer: { value: "1/2", unit: "" },
    solutionNarrative: `No pure equilibrium exists; the unique equilibrium is mixed, each player choosing Heads and Tails with probability $1/2$. Any bias would be exploited by the opponent.`,
  };
};
fill["gt1-mp-2"] = (rng, idx) => {
  const rl = ["Heads", "Tails"], cl = ["Heads", "Tails"];
  const w = rng.int(1, 4);
  const pay = [
    [[w, -w], [-w, w]],
    [[-w, w], [w, -w]],
  ];
  return {
    id: `gen.gt1-mp-2.${idx}`, generated: true, concepts: ["matching-pennies-and-zero-sum"], difficulty: 2, context: "applied",
    prompt: `A symmetric zero-sum matching game with stakes $${w}$. Row wins $+${w}$ on a match, Column wins $+${w}$ on a mismatch. Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Is the sum of the two players' payoffs zero in every cell? Type 'yes' or 'no'.`, answer: "yes", accept: YES, hint: `Add the two numbers in each cell.` },
      { instruction: `Equilibrium probability that Row plays Heads? Fraction or decimal.`, answer: "1/2", accept: ["0.5"], hint: `Symmetry forces 50/50.` },
      { instruction: `Row's expected payoff at the equilibrium (a fair game). (Give a number.)`, answer: "0", accept: [], hint: `Wins and losses cancel by symmetry.` },
    ],
    finalAnswer: { value: "1/2", unit: "" },
    solutionNarrative: `Every cell sums to 0 (zero-sum). The equilibrium mix is $1/2$–$1/2$ for both, giving each an expected payoff of 0 — the value of a symmetric zero-sum game.`,
  };
};
fill["gt1-mp-3"] = (rng, idx) => {
  // Asymmetric-payoff matching pennies where the equilibrium mix is NOT 1/2 but
  // still clean. Row payoff: match pays differently by side. Solve via indifference.
  const rl = ["Heads", "Tails"], cl = ["Heads", "Tails"];
  // Column's payoffs (mismatch wins). To make Row indifferent we set Column's mix.
  // Use a clean asymmetric structure: Row payoffs a on (H,H), b on (T,T), -c off.
  // Keep it simple and guarantee interior mix by construction.
  const a = rng.pick([2, 3, 4]);
  // pay so that q (prob Column Heads) making Row indifferent is a/(a+1)?  Build directly:
  // Row: (H,H)=a, (H,T)=0, (T,H)=0, (T,T)=1. Column zero-sum: negate.
  const pay = [
    [[a, -a], [0, 0]],
    [[0, 0], [1, -1]],
  ];
  // Row indifferent: q*a + (1-q)*0 = q*0 + (1-q)*1 -> q*a = 1-q -> q = 1/(a+1).
  const q = frac(1, a + 1);
  const qStr = probStr(q.n, q.d);
  return {
    id: `gen.gt1-mp-3.${idx}`, generated: true, concepts: ["matching-pennies-and-zero-sum"], difficulty: 3, context: "abstract",
    prompt: `A zero-sum "matching" game with asymmetric stakes. Row scores $${a}$ on (Heads, Heads) and $1$ on (Tails, Tails), and $0$ otherwise; Column's payoff is the negative (zero-sum). Each cell is (Row's payoff, Column's payoff).\n\n${bimatrixTable(rl, cl, pay)}`,
    steps: [
      { instruction: `Does a pure Nash equilibrium exist? Type 'yes' or 'no'.`, answer: "no", accept: NO, hint: `Row wants to match, Column to mismatch — a cycle.` },
      { instruction: `Let $q$ = prob Column plays Heads. Row is indifferent when $${a}q = 1-q$. Solve for $q$. Fraction or decimal in (0,1).`, answer: qStr, accept: [rnd(q.n / q.d, 4), `${q.n}/${q.d}`], hint: `$${a}q = 1 - q \\Rightarrow q(${a}+1) = 1$.` },
      { instruction: `Because the (Heads,Heads) win of ${a} is larger, does Column play Heads with probability MORE or LESS than 1/2? Type 'more' or 'less'.`, answer: q.n / q.d > 0.5 ? "more" : "less", accept: [], hint: `Compare $${qStr}$ with $1/2$.` },
    ],
    finalAnswer: { value: qStr, unit: "" },
    solutionNarrative: `No pure equilibrium; solving $${a}q = 1-q$ gives $q = ${qStr}$. Asymmetric stakes tilt the equilibrium mix away from 50/50 — the bigger payoff is defended MORE rarely so the opponent stays indifferent.`,
  };
};
