// gen-gt2-fill.js
// Parametric generators for three Game Theory topics:
//   game-theory.zero-sum-and-minimax
//   game-theory.sequential-games
//   game-theory.repeated-games
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like the other gen-*-fill packs). Template prefix: gt2-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact.
//
// GRADER NOTES (see js/problem-engine.js):
//  - Strategy / action / yes-no answers are MENU (word) answers with descriptive
//    labels ("Up"/"Down", "Cooperate"/"Defect", "credible"/"not credible",
//    "yes"/"no"). A bare digit would collapse to the polynomial 0, so we never
//    grade an action as a digit. Multi-word labels are fine: normalize() strips
//    the space so "not credible" -> "notcredible" is still a single word token.
//  - Values / payoffs / thresholds / discounted sums are plain numbers or
//    fractions; fractions and decimals cross-grade, numeric tol 1e-6.
//  - Every matrix / tree / threshold is built from CHOSEN integer payoffs and the
//    answer is computed from those SAME entries, so drawings never desync.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const yn = (b) => (b ? "yes" : "no");

// Format a signed integer for inline prose / matrices.
const sgn = (n) => (n >= 0 ? `${n}` : `${n}`);

// Greatest common divisor for reducing fractions.
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };

// Reduce p/q to a "a/b" string (q assumed positive). Returns "0" / integer when it divides.
const fracStr = (p, q) => {
  if (q < 0) { p = -p; q = -q; }
  const g = gcd(p, q);
  const a = p / g, b = q / g;
  return b === 1 ? `${a}` : `${a}/${b}`;
};

// Build a plot.js "graph" spec from a {id: [x, y]} position map + edge list.
const graphPlot = (pos, edges, caption, extra) => ({
  type: "graph",
  nodes: Object.keys(pos).map((id) => Object.assign({ id, x: pos[id][0], y: pos[id][1] }, (extra && extra[id]) || {})),
  edges,
  caption,
});

export const fill = {};

// ===========================================================================
// TOPIC 1: game-theory.zero-sum-and-minimax
// Concepts: zero-sum-payoffs, maximin-and-minimax, saddle-points, mixed-value-2x2
// ===========================================================================

// A zero-sum matrix is stored as row-major payoffs to the ROW player (column
// player receives the negative). Row player MAXIMIZES; column player MINIMIZES.
// Helpers operate on the row player's payoff matrix M[i][j].
const rowMaximin = (M) => {
  // each row's worst (min) entry; row player picks the largest of these
  const rowMins = M.map((row) => Math.min(...row));
  const val = Math.max(...rowMins);
  return { rowMins, val, row: rowMins.indexOf(val) };
};
const colMinimax = (M) => {
  const n = M.length, m = M[0].length;
  const colMaxes = [];
  for (let j = 0; j < m; j++) { let mx = -Infinity; for (let i = 0; i < n; i++) mx = Math.max(mx, M[i][j]); colMaxes.push(mx); }
  const val = Math.min(...colMaxes);
  return { colMaxes, val, col: colMaxes.indexOf(val) };
};
// Unique-saddle test: maximin == minimax AND the achieving row/col are unique.
const saddleInfo = (M) => {
  const rmm = rowMaximin(M), cmm = colMinimax(M);
  const hasSaddle = rmm.val === cmm.val;
  // count how many rowMins hit the maximin value and how many colMaxes hit minimax
  const rowTies = rmm.rowMins.filter((v) => v === rmm.val).length;
  const colTies = cmm.colMaxes.filter((v) => v === cmm.val).length;
  return { rmm, cmm, hasSaddle, unique: hasSaddle && rowTies === 1 && colTies === 1, value: hasSaddle ? rmm.val : null };
};

const ROW_LABELS = ["Up", "Down", "Middle"];
const COL_LABELS = ["Left", "Right", "Center"];

// Pretty 2-row / 2-col (or 3x3) payoff table as inline text for the prompt.
const matrixText = (M, rowLabels, colLabels) => {
  const header = `Columns are the column player's choices; entries are the ROW player's payoff (column player gets the negative).`;
  const lines = [];
  lines.push(`| | ${colLabels.slice(0, M[0].length).join(" | ")} |`);
  for (let i = 0; i < M.length; i++) lines.push(`| ${rowLabels[i]} | ${M[i].map(sgn).join(" | ")} |`);
  return header + "\n\n" + lines.join("\n");
};

// Draw a 2xN or Nx2 zero-sum matrix without a saddle for the mixed-value formula.
// For a 2x2 with entries [[a,b],[c,d]] and NO saddle, the value is
//   v = (ad - bc) / (a + d - b - c),  and the row player plays Up with prob
//   p = (d - c) / (a + d - b - c).
const mixed2x2 = (a, b, c, d) => {
  const denom = a + d - b - c;
  return { denom, value: [a * d - b * c, denom], pUp: [d - c, denom] };
};

// Generate a 2x2 zero-sum game guaranteed to have NO saddle point, with a
// non-degenerate mixing probability strictly in (0,1) and denom != 0.
const noSaddle2x2 = (rng) => {
  for (let tries = 0; tries < 200; tries++) {
    const a = rng.int(-4, 6), b = rng.int(-4, 6), c = rng.int(-4, 6), d = rng.int(-4, 6);
    const M = [[a, b], [c, d]];
    const info = saddleInfo(M);
    if (info.hasSaddle) continue;
    const mx = mixed2x2(a, b, c, d);
    if (mx.denom === 0) continue;
    const p = (d - c) / mx.denom;
    if (p <= 0 || p >= 1) continue; // proper mixing only
    return { a, b, c, d, M, mx, p };
  }
  // deterministic fallback known to have no saddle: matching-pennies-like
  const a = 2, b = -1, c = -1, d = 1;
  const M = [[a, b], [c, d]];
  return { a, b, c, d, M, mx: mixed2x2(a, b, c, d), p: (d - c) / (a + d - b - c) };
};

// Generate a matrix (2x2 or 3x3) that HAS a unique saddle point.
const withSaddle = (rng, size) => {
  for (let tries = 0; tries < 400; tries++) {
    const M = [];
    for (let i = 0; i < size; i++) { const r = []; for (let j = 0; j < size; j++) r.push(rng.int(-3, 7)); M.push(r); }
    const info = saddleInfo(M);
    if (info.unique) return { M, info };
  }
  // fallback with an obvious saddle at (0,0): 5 is row-min of row0 and col-max of col0
  const M = size === 2 ? [[5, 8], [1, 3]] : [[5, 8, 9], [1, 3, 2], [4, 6, 0]];
  return { M, info: saddleInfo(M) };
};

// --- zero-sum-payoffs ---
fill["gt2-zerosum-1"] = (rng, idx) => {
  // Read one entry, and its meaning for the column player (negative).
  const a = rng.int(1, 6), b = rng.int(-5, -1), c = rng.int(-5, -1), d = rng.int(1, 6);
  const M = [[a, b], [c, d]];
  return {
    id: `gen.gt2-zerosum-1.${idx}`, generated: true, concepts: ["zero-sum-payoffs"], difficulty: 1, context: "abstract",
    prompt: `A zero-sum game payoff matrix (entries are the ROW player's payoff; the column player receives the negative):\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nRead values straight off the table.`,
    steps: [
      { instruction: `If the row player plays Up and the column player plays Left, what is the ROW player's payoff? (A number.)`, answer: `${a}`, accept: [], hint: "Top-left entry." },
      { instruction: `In that same cell, what does the COLUMN player receive? (Zero-sum: the negative of the row payoff.)`, answer: `${-a}`, accept: [], hint: `The two payoffs sum to 0, so it is $-(${a})$.` },
      { instruction: `If the row player plays Down and the column player plays Right, what is the ROW player's payoff?`, answer: `${d}`, accept: [], hint: "Bottom-right entry." },
    ],
    finalAnswer: { value: `${d}`, unit: "" },
    solutionNarrative: `In a zero-sum game one matrix says everything: the (Up, Left) cell pays the row player ${a}, so the column player gets $-(${a}) = ${-a}$. The (Down, Right) cell pays the row player ${d}. Whatever one side wins, the other loses.`,
  };
};
fill["gt2-zerosum-2"] = (rng, idx) => {
  const { M } = withSaddle(rng, 2);
  const [[a, b], [c, d]] = M;
  // Row player compares own choices; best response reasoning off the raw matrix.
  return {
    id: `gen.gt2-zerosum-2.${idx}`, generated: true, concepts: ["zero-sum-payoffs"], difficulty: 2, context: "abstract",
    prompt: `A zero-sum game, entries = ROW player's payoff:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nThe row player wants the LARGEST payoff; the column player wants it as SMALL as possible.`,
    steps: [
      { instruction: `Suppose the column player is committed to Left. The row player then chooses the row with the larger Left-column entry. Which action does the row player pick — "Up" or "Down"?`, answer: a >= c ? "Up" : "Down", accept: a >= c ? ["up"] : ["down"], hint: `Compare the two Left-column entries ${a} and ${c}.` },
      { instruction: `And the row player's payoff from that best response to Left? (A number.)`, answer: `${Math.max(a, c)}`, accept: [], hint: `The larger of ${a} and ${c}.` },
      { instruction: `Now suppose the column player is committed to Right. Which action does the row player pick — "Up" or "Down"?`, answer: b >= d ? "Up" : "Down", accept: b >= d ? ["up"] : ["down"], hint: `Compare the two Right-column entries ${b} and ${d}.` },
    ],
    finalAnswer: { value: b >= d ? "Up" : "Down", unit: "" },
    solutionNarrative: `The row player always answers a fixed column by taking the larger entry in that column. Against Left, ${a} vs ${c} favors ${a >= c ? "Up" : "Down"}; against Right, ${b} vs ${d} favors ${b >= d ? "Up" : "Down"}. Best responses are read straight off the single zero-sum matrix.`,
  };
};
fill["gt2-zerosum-3"] = (rng, idx) => {
  const { M } = withSaddle(rng, 3);
  const total = M.flat();
  const maxEntry = Math.max(...total), minEntry = Math.min(...total);
  // locate the best cell for row (global max) and worst (global min)
  return {
    id: `gen.gt2-zerosum-3.${idx}`, generated: true, concepts: ["zero-sum-payoffs"], difficulty: 3, context: "applied",
    prompt: `Two rival firms set a price move; the table is Firm R's profit change in \\$M (zero-sum: Firm C's change is the negative). Rows are R's moves, columns are C's moves.\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}`,
    steps: [
      { instruction: `What is the single BEST (largest) outcome anywhere in the table for Firm R? (A number.)`, answer: `${maxEntry}`, accept: [], hint: "Scan every entry for the maximum." },
      { instruction: `In that best-for-R cell, what is Firm C's profit change? (Negative of R's.)`, answer: `${-maxEntry}`, accept: [], hint: `Zero-sum: $-(${maxEntry})$.` },
      { instruction: `What is the WORST (smallest) outcome anywhere in the table for Firm R?`, answer: `${minEntry}`, accept: [], hint: "Scan for the minimum entry." },
      { instruction: `Firm R cannot simply pick the cell with its best outcome. Whose choice controls which COLUMN is played — "Firm R" or "Firm C"? (Answer with the firm.)`, answer: "Firm C", accept: ["firmc", "c", "firm c"], hint: "R controls the row; the opponent controls the column." },
    ],
    finalAnswer: { value: `${minEntry}`, unit: "" },
    solutionNarrative: `R's best possible cell pays ${maxEntry} (C loses ${maxEntry}); R's worst pays ${minEntry}. But R only picks the row — Firm C picks the column — so R cannot guarantee its best cell. That tension is exactly what maximin resolves.`,
  };
};

// --- maximin-and-minimax ---
fill["gt2-maximin-1"] = (rng, idx) => {
  const { M } = withSaddle(rng, 2);
  const rmm = rowMaximin(M);
  return {
    id: `gen.gt2-maximin-1.${idx}`, generated: true, concepts: ["maximin-and-minimax"], difficulty: 1, context: "abstract",
    prompt: `A zero-sum game, entries = ROW player's payoff:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nThe row player reasons pessimistically: for each of its rows, assume the column player will drive the payoff to that row's WORST (smallest) value.`,
    steps: [
      { instruction: `Row Up's worst-case (minimum) payoff? (A number.)`, answer: `${Math.min(...M[0])}`, accept: [], hint: `The smaller of Up's entries.` },
      { instruction: `Row Down's worst-case (minimum) payoff?`, answer: `${Math.min(...M[1])}`, accept: [], hint: `The smaller of Down's entries.` },
      { instruction: `The row player's MAXIMIN is the LARGER of those two worst-cases. What is it? (A number.)`, answer: `${rmm.val}`, accept: [], hint: `The best guaranteed floor: max of the two row-minimums.` },
    ],
    finalAnswer: { value: `${rmm.val}`, unit: "" },
    solutionNarrative: `Row minimums are ${Math.min(...M[0])} (Up) and ${Math.min(...M[1])} (Down); the maximin is the larger, ${rmm.val}. Maximin is the payoff the row player can guarantee no matter what the column player does.`,
  };
};
fill["gt2-maximin-2"] = (rng, idx) => {
  const { M } = withSaddle(rng, 2);
  const cmm = colMinimax(M);
  return {
    id: `gen.gt2-maximin-2.${idx}`, generated: true, concepts: ["maximin-and-minimax"], difficulty: 2, context: "abstract",
    prompt: `A zero-sum game, entries = ROW player's payoff:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nThe column player pays out these entries, so it reasons about its own worst case: for each COLUMN, the row player will push the payoff to that column's LARGEST value.`,
    steps: [
      { instruction: `Column Left's worst-case for the column player (its MAXIMUM entry)? (A number.)`, answer: `${Math.max(M[0][0], M[1][0])}`, accept: [], hint: `The larger of the Left column's entries.` },
      { instruction: `Column Right's worst-case (its MAXIMUM entry)?`, answer: `${Math.max(M[0][1], M[1][1])}`, accept: [], hint: `The larger of the Right column's entries.` },
      { instruction: `The column player's MINIMAX is the SMALLER of those two column-maximums. What is it?`, answer: `${cmm.val}`, accept: [], hint: `Minimize the maximum loss: min of the two column-maximums.` },
    ],
    finalAnswer: { value: `${cmm.val}`, unit: "" },
    solutionNarrative: `Column maximums are ${Math.max(M[0][0], M[1][0])} (Left) and ${Math.max(M[0][1], M[1][1])} (Right); the minimax is the smaller, ${cmm.val}. That is the most the column player can be forced to give up if it plays its safest column.`,
  };
};
fill["gt2-maximin-3"] = (rng, idx) => {
  const { M, info } = withSaddle(rng, 3);
  const rmm = info.rmm, cmm = info.cmm;
  return {
    id: `gen.gt2-maximin-3.${idx}`, generated: true, concepts: ["maximin-and-minimax"], difficulty: 3, context: "applied",
    prompt: `A 3x3 zero-sum game (entries = ROW player's payoff):\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nCompute the row player's maximin and the column player's minimax.`,
    steps: [
      { instruction: `List each row's minimum, then take the LARGEST. What is the maximin value?`, answer: `${rmm.val}`, accept: [], hint: `Row minimums: ${M.map((r) => Math.min(...r)).join(", ")}; take the max.` },
      { instruction: `Which row achieves the maximin — "Up", "Down", or "Middle"?`, answer: ROW_LABELS[rmm.row], accept: [ROW_LABELS[rmm.row].toLowerCase()], hint: `The row whose minimum equals ${rmm.val}.` },
      { instruction: `List each column's maximum, then take the SMALLEST. What is the minimax value?`, answer: `${cmm.val}`, accept: [], hint: `Column maximums, then take the min.` },
      { instruction: `Do maximin and minimax coincide here? Type 'yes' or 'no'.`, answer: yn(rmm.val === cmm.val), accept: [], hint: `Compare ${rmm.val} and ${cmm.val}.` },
    ],
    finalAnswer: { value: `${cmm.val}`, unit: "" },
    solutionNarrative: `Maximin $= ${rmm.val}$ (row ${ROW_LABELS[rmm.row]}), minimax $= ${cmm.val}$. They ${rmm.val === cmm.val ? "coincide, which signals a pure-strategy saddle point" : "differ, so no pure saddle exists and the value requires mixing"}.`,
  };
};

// --- saddle-points ---
fill["gt2-saddle-1"] = (rng, idx) => {
  const { M, info } = withSaddle(rng, 2);
  return {
    id: `gen.gt2-saddle-1.${idx}`, generated: true, concepts: ["saddle-points"], difficulty: 1, context: "abstract",
    prompt: `A zero-sum game, entries = ROW player's payoff:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nA saddle point (pure value) exists exactly when the row's maximin equals the column's minimax.`,
    steps: [
      { instruction: `The maximin here is ${info.rmm.val} and the minimax is ${info.cmm.val}. Is there a saddle point? Type 'yes' or 'no'.`, answer: yn(info.hasSaddle), accept: [], hint: `Equal maximin and minimax means yes.` },
      { instruction: `What is the game's value (the common payoff at the saddle)? (A number.)`, answer: `${info.value}`, accept: [], hint: `It equals the shared maximin/minimax, ${info.value}.` },
    ],
    finalAnswer: { value: `${info.value}`, unit: "" },
    solutionNarrative: `Maximin $= ${info.rmm.val} =$ minimax, so a saddle point exists and the value of the game is ${info.value}. At the saddle neither player can improve by switching alone.`,
  };
};
fill["gt2-saddle-2"] = (rng, idx) => {
  // Randomly choose a game that HAS a saddle or does NOT, so the yes/no varies.
  const has = rng.int(0, 1) === 1;
  let M, info;
  if (has) { const w = withSaddle(rng, 2); M = w.M; info = w.info; }
  else { const ns = noSaddle2x2(rng); M = ns.M; info = saddleInfo(M); }
  return {
    id: `gen.gt2-saddle-2.${idx}`, generated: true, concepts: ["saddle-points"], difficulty: 2, context: "abstract",
    prompt: `A zero-sum game, entries = ROW player's payoff:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nDecide whether a pure-strategy saddle point exists by comparing maximin and minimax.`,
    steps: [
      { instruction: `Compute the maximin (max of the row minimums). (A number.)`, answer: `${info.rmm.val}`, accept: [], hint: `Row minimums: ${M.map((r) => Math.min(...r)).join(", ")}.` },
      { instruction: `Compute the minimax (min of the column maximums).`, answer: `${info.cmm.val}`, accept: [], hint: `Column maximums: ${[Math.max(M[0][0], M[1][0]), Math.max(M[0][1], M[1][1])].join(", ")}.` },
      { instruction: `Is there a saddle point? Type 'yes' or 'no'.`, answer: yn(info.hasSaddle), accept: [], hint: `Only if the two values are equal.` },
    ],
    finalAnswer: { value: yn(info.hasSaddle), unit: "" },
    solutionNarrative: info.hasSaddle
      ? `Maximin $= ${info.rmm.val}$ equals minimax $= ${info.cmm.val}$, so a saddle point exists and the game has pure value ${info.value}.`
      : `Maximin $= ${info.rmm.val}$ is strictly below minimax $= ${info.cmm.val}$, so NO pure saddle exists — the players must mix.`,
  };
};
fill["gt2-saddle-3"] = (rng, idx) => {
  const { M, info } = withSaddle(rng, 3);
  const r = info.rmm.row, c = info.cmm.col;
  return {
    id: `gen.gt2-saddle-3.${idx}`, generated: true, concepts: ["saddle-points"], difficulty: 3, context: "applied",
    prompt: `A 3x3 zero-sum battle (entries = ROW commander's payoff):\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nFind the saddle point and name the cell as a (row, column) pair of actions.`,
    steps: [
      { instruction: `Is there a saddle point (does maximin equal minimax)? Type 'yes' or 'no'.`, answer: yn(info.hasSaddle), accept: [], hint: `Maximin ${info.rmm.val} vs minimax ${info.cmm.val}.` },
      { instruction: `What is the value of the game? (A number.)`, answer: `${info.value}`, accept: [], hint: `The shared maximin/minimax value.` },
      { instruction: `Which ROW is the saddle in — "Up", "Down", or "Middle"?`, answer: ROW_LABELS[r], accept: [ROW_LABELS[r].toLowerCase()], hint: `The maximin-achieving row.` },
      { instruction: `Which COLUMN is the saddle in — "Left", "Right", or "Center"?`, answer: COL_LABELS[c], accept: [COL_LABELS[c].toLowerCase()], hint: `The minimax-achieving column.` },
    ],
    finalAnswer: { value: `${info.value}`, unit: "" },
    solutionNarrative: `Maximin $=$ minimax $= ${info.value}$, so the saddle is real. It sits at (${ROW_LABELS[r]}, ${COL_LABELS[c]}): that entry is simultaneously the smallest in its row and the largest in its column, so neither commander gains by deviating alone.`,
  };
};

// --- mixed-value-2x2 ---
fill["gt2-mixedval-1"] = (rng, idx) => {
  // Classic matching-pennies style with parametrized win/loss to keep it tier-1 simple.
  const w = rng.int(1, 4);
  // [[ w, -w],[ -w, w]] : symmetric, no saddle, value 0, p = 1/2
  const M = [[w, -w], [-w, w]];
  return {
    id: `gen.gt2-mixedval-1.${idx}`, generated: true, concepts: ["mixed-value-2x2"], difficulty: 1, context: "abstract",
    prompt: `A symmetric 2x2 zero-sum game (entries = ROW player's payoff):\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nThis is a matching-pennies-type game with no saddle point.`,
    steps: [
      { instruction: `Does this game have a pure saddle point? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Maximin $= ${-w}$ is below minimax $= ${w}$.` },
      { instruction: `By symmetry the row player mixes Up and Down with equal probability. What probability does it put on Up? (A fraction or decimal.)`, answer: "1/2", accept: ["0.5"], hint: "Equal weight on each of the two rows." },
      { instruction: `What is the value of this symmetric game? (A number.)`, answer: "0", accept: [], hint: "Wins and losses cancel by symmetry." },
    ],
    finalAnswer: { value: "0", unit: "" },
    solutionNarrative: `With payoffs $\\pm${w}$ arranged symmetrically there is no saddle, so both players mix 50/50. The value is 0 — a fair game, exactly like matching pennies.`,
  };
};
fill["gt2-mixedval-2"] = (rng, idx) => {
  const { a, b, c, d, M, mx, p } = noSaddle2x2(rng);
  const valStr = fracStr(mx.value[0], mx.value[1]);
  const pStr = fracStr(mx.pUp[0], mx.pUp[1]);
  return {
    id: `gen.gt2-mixedval-2.${idx}`, generated: true, concepts: ["mixed-value-2x2"], difficulty: 2, context: "abstract",
    prompt: `A 2x2 zero-sum game with NO saddle point (entries = ROW player's payoff), with $a=${a}$ (Up,Left), $b=${b}$ (Up,Right), $c=${c}$ (Down,Left), $d=${d}$ (Down,Right):\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nUse the standard 2x2 formulas: value $v = \\dfrac{ad-bc}{a+d-b-c}$ and $P(\\text{Up}) = \\dfrac{d-c}{a+d-b-c}$.`,
    steps: [
      { instruction: `Compute the common denominator $a+d-b-c$. (A number.)`, answer: `${mx.denom}`, accept: [], hint: `$${a}+${d}-(${b})-(${c})$.` },
      { instruction: `Compute the value $v = (ad-bc)/(a+d-b-c)$. (A fraction or decimal.)`, answer: valStr, accept: [`${mx.value[0]}/${mx.value[1]}`, `${(mx.value[0] / mx.value[1]).toFixed(6)}`], hint: `Numerator $= ${a}\\cdot${d}-(${b})(${c}) = ${a * d - b * c}$.` },
      { instruction: `Compute $P(\\text{Up}) = (d-c)/(a+d-b-c)$. (A fraction or decimal.)`, answer: pStr, accept: [`${mx.pUp[0]}/${mx.pUp[1]}`, `${(mx.pUp[0] / mx.pUp[1]).toFixed(6)}`], hint: `$(${d}-(${c}))/${mx.denom}$.` },
    ],
    finalAnswer: { value: valStr, unit: "" },
    solutionNarrative: `Denominator $= ${a}+${d}-(${b})-(${c}) = ${mx.denom}$. Value $v = (${a * d}-${b * c})/${mx.denom} = ${valStr}$, and the row player plays Up with probability $(${d}-${c})/${mx.denom} = ${pStr}$. No pure saddle means the value is achieved only by mixing.`,
  };
};
fill["gt2-mixedval-3"] = (rng, idx) => {
  const { a, b, c, d, M, mx, p } = noSaddle2x2(rng);
  const valStr = fracStr(mx.value[0], mx.value[1]);
  const pUpStr = fracStr(mx.pUp[0], mx.pUp[1]);
  const pDownStr = fracStr(mx.denom - mx.pUp[0], mx.denom); // 1 - p
  return {
    id: `gen.gt2-mixedval-3.${idx}`, generated: true, concepts: ["mixed-value-2x2"], difficulty: 3, context: "applied",
    prompt: `A penalty-kick-style 2x2 zero-sum game with NO saddle (entries = kicker's expected payoff), $a=${a}$, $b=${b}$, $c=${c}$, $d=${d}$ in the (Up,Left),(Up,Right),(Down,Left),(Down,Right) cells:\n\n${matrixText(M, ROW_LABELS, COL_LABELS)}\n\nFind the value and the kicker's optimal mixing.`,
    steps: [
      { instruction: `First confirm there is no saddle: is maximin strictly less than minimax? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Maximin ${saddleInfo(M).rmm.val} vs minimax ${saddleInfo(M).cmm.val}.` },
      { instruction: `Compute the denominator $a+d-b-c$. (A number.)`, answer: `${mx.denom}`, accept: [], hint: `$${a}+${d}-(${b})-(${c})$.` },
      { instruction: `Compute the value $v = (ad-bc)/(a+d-b-c)$. (A fraction or decimal.)`, answer: valStr, accept: [`${mx.value[0]}/${mx.value[1]}`, `${(mx.value[0] / mx.value[1]).toFixed(6)}`], hint: `$(${a * d}-${b * c})/${mx.denom}$.` },
      { instruction: `Compute $P(\\text{Up})=(d-c)/(a+d-b-c)$, then $P(\\text{Down})=1-P(\\text{Up})$. Give $P(\\text{Down})$. (A fraction or decimal.)`, answer: pDownStr, accept: [`${mx.denom - mx.pUp[0]}/${mx.denom}`, `${(1 - mx.pUp[0] / mx.denom).toFixed(6)}`], hint: `$1 - ${pUpStr}$.` },
    ],
    finalAnswer: { value: valStr, unit: "" },
    solutionNarrative: `No saddle (maximin $<$ minimax), so mixing is required. Denominator $= ${mx.denom}$; value $= ${valStr}$; $P(\\text{Up}) = ${pUpStr}$ so $P(\\text{Down}) = ${pDownStr}$. Like a real penalty taker, the optimal kicker randomizes to stay unpredictable.`,
  };
};

// ===========================================================================
// TOPIC 2: game-theory.sequential-games
// Concepts: extensive-form, backward-induction, subgame-perfection,
//           first-mover-and-commitment
// ===========================================================================

// A small two-stage tree: Player 1 chooses L or R at the root; at each of the
// two resulting nodes Player 2 chooses a or b, reaching one of four leaves.
// Leaf payoffs are pairs [u1, u2]. We store them and fold by backward induction.
//   root --L--> n1 --a--> leaf LA ; --b--> leaf LB
//   root --R--> n2 --a--> leaf RA ; --b--> leaf RB
const buildTree = (rng) => {
  // choose distinct payoffs so no ties at any decision node
  const mk = () => [rng.int(0, 6), rng.int(0, 6)];
  let LA, LB, RA, RB;
  for (let t = 0; t < 200; t++) {
    LA = mk(); LB = mk(); RA = mk(); RB = mk();
    // Player 2 at n1 compares LA[1] vs LB[1]; at n2 compares RA[1] vs RB[1]; need no ties
    if (LA[1] === LB[1] || RA[1] === RB[1]) continue;
    // Player 1 compares the two resulting u1's; need no tie
    const p2AtN1 = LA[1] > LB[1] ? "a" : "b";
    const p2AtN2 = RA[1] > RB[1] ? "a" : "b";
    const u1IfL = p2AtN1 === "a" ? LA[0] : LB[0];
    const u1IfR = p2AtN2 === "a" ? RA[0] : RB[0];
    if (u1IfL === u1IfR) continue;
    return { LA, LB, RA, RB, p2AtN1, p2AtN2, u1IfL, u1IfR };
  }
  // fallback: hand-picked no-tie tree
  LA = [3, 1]; LB = [1, 4]; RA = [2, 5]; RB = [4, 2];
  return {
    LA, LB, RA, RB,
    p2AtN1: LA[1] > LB[1] ? "a" : "b",
    p2AtN2: RA[1] > RB[1] ? "a" : "b",
    u1IfL: (LA[1] > LB[1] ? LA : LB)[0],
    u1IfR: (RA[1] > RB[1] ? RA : RB)[0],
  };
};

const fold = (T) => {
  const rootChoice = T.u1IfL > T.u1IfR ? "L" : "R";
  const outcome = rootChoice === "L"
    ? (T.p2AtN1 === "a" ? T.LA : T.LB)
    : (T.p2AtN2 === "a" ? T.RA : T.RB);
  const p2Choice = rootChoice === "L" ? T.p2AtN1 : T.p2AtN2;
  return { rootChoice, p2Choice, outcome };
};

// A tree plot: root at left, P2 nodes in the middle, four leaves on the right.
const treePlot = (T, caption) => {
  const pos = {
    Root: [0, 3],
    N1: [2, 4.5], N2: [2, 1.5],
    LA: [4, 5.4], LB: [4, 3.6], RA: [4, 2.4], RB: [4, 0.6],
  };
  const leafLabel = (nm, pr) => `${nm}(${pr[0]},${pr[1]})`;
  const extra = {
    Root: { color: "accent", label: "P1" },
    N1: { color: "warn", label: "P2" }, N2: { color: "warn", label: "P2" },
    LA: { label: leafLabel("", T.LA) }, LB: { label: leafLabel("", T.LB) },
    RA: { label: leafLabel("", T.RA) }, RB: { label: leafLabel("", T.RB) },
  };
  const edges = [
    { from: "Root", to: "N1", directed: true, label: "L" },
    { from: "Root", to: "N2", directed: true, label: "R" },
    { from: "N1", to: "LA", directed: true, label: "a" },
    { from: "N1", to: "LB", directed: true, label: "b" },
    { from: "N2", to: "RA", directed: true, label: "a" },
    { from: "N2", to: "RB", directed: true, label: "b" },
  ];
  return graphPlot(pos, edges, caption, extra);
};

// --- extensive-form ---
fill["gt2-extform-1"] = (rng, idx) => {
  const T = buildTree(rng);
  return {
    id: `gen.gt2-extform-1.${idx}`, generated: true, concepts: ["extensive-form"], difficulty: 1, context: "abstract",
    prompt: `Read the game tree. Player 1 (P1) moves first (L or R); Player 2 (P2) then moves (a or b). Each leaf shows payoffs $(u_1, u_2)$.`,
    plot: treePlot(T, "P1 moves first (L/R), then P2 moves (a/b); leaves show (P1, P2) payoffs."),
    steps: [
      { instruction: `If P1 plays L and P2 plays a, what is P1's payoff $u_1$? (A number.)`, answer: `${T.LA[0]}`, accept: [], hint: `Follow L then a to leaf (${T.LA[0]},${T.LA[1]}).` },
      { instruction: `At that same leaf, what is P2's payoff $u_2$?`, answer: `${T.LA[1]}`, accept: [], hint: `Second number in the (${T.LA[0]},${T.LA[1]}) leaf.` },
      { instruction: `If P1 plays R and P2 plays b, what is P1's payoff $u_1$?`, answer: `${T.RB[0]}`, accept: [], hint: `Follow R then b to leaf (${T.RB[0]},${T.RB[1]}).` },
    ],
    finalAnswer: { value: `${T.RB[0]}`, unit: "" },
    solutionNarrative: `Reading leaves off the tree: (L,a) gives $(${T.LA[0]},${T.LA[1]})$ so $u_1=${T.LA[0]}$, $u_2=${T.LA[1]}$; (R,b) gives $(${T.RB[0]},${T.RB[1]})$ so $u_1=${T.RB[0]}$. Extensive form spells out who moves when and what each leaf pays.`,
  };
};
fill["gt2-extform-2"] = (rng, idx) => {
  const T = buildTree(rng);
  return {
    id: `gen.gt2-extform-2.${idx}`, generated: true, concepts: ["extensive-form"], difficulty: 2, context: "abstract",
    prompt: `Read the game tree (P1 moves L/R first, then P2 moves a/b; leaves are $(u_1,u_2)$). Focus on P2's incentives at each of its two decision nodes.`,
    plot: treePlot(T, "After L, P2 chooses between the two upper leaves; after R, between the two lower leaves."),
    steps: [
      { instruction: `Suppose P1 has played L. P2 compares its own payoff at leaf (L,a) versus (L,b). Which gives P2 more — "a" or "b"?`, answer: T.p2AtN1, accept: [], hint: `Compare P2 payoffs ${T.LA[1]} (a) and ${T.LB[1]} (b).` },
      { instruction: `Given that P2-best response after L, what payoff does P1 end up with? (A number.)`, answer: `${T.u1IfL}`, accept: [], hint: `P1 gets the $u_1$ of the leaf P2 selects.` },
      { instruction: `Now suppose P1 has played R. Which does P2 prefer — "a" or "b"?`, answer: T.p2AtN2, accept: [], hint: `Compare P2 payoffs ${T.RA[1]} (a) and ${T.RB[1]} (b).` },
    ],
    finalAnswer: { value: T.p2AtN2, unit: "" },
    solutionNarrative: `After L, P2 picks ${T.p2AtN1} (its payoff ${Math.max(T.LA[1], T.LB[1])} beats ${Math.min(T.LA[1], T.LB[1])}), leaving P1 with ${T.u1IfL}. After R, P2 picks ${T.p2AtN2}. P2's choice depends only on P2's own payoffs at that node — the heart of reading a tree.`,
  };
};
fill["gt2-extform-3"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  return {
    id: `gen.gt2-extform-3.${idx}`, generated: true, concepts: ["extensive-form"], difficulty: 3, context: "applied",
    prompt: `A market-entry tree: an Entrant (P1) chooses to Enter (L) or Stay Out (R). An Incumbent (P2) then chooses to Fight (a) or Accommodate (b). Leaves are $(u_{\\text{entrant}}, u_{\\text{incumbent}})$.`,
    plot: treePlot(T, "Entrant moves L/R, Incumbent moves a/b; leaves show (entrant, incumbent) payoffs."),
    steps: [
      { instruction: `List all four leaf payoff pairs by reading the tree. What is P1's payoff at leaf (R,a)? (A number.)`, answer: `${T.RA[0]}`, accept: [], hint: `Follow R then a.` },
      { instruction: `What is P2's payoff at leaf (L,b)?`, answer: `${T.LB[1]}`, accept: [], hint: `Follow L then b, take the second coordinate.` },
      { instruction: `Which leaf gives P2 (the incumbent) its single highest payoff anywhere in the tree? Give P2's payoff there. (A number.)`, answer: `${Math.max(T.LA[1], T.LB[1], T.RA[1], T.RB[1])}`, accept: [], hint: `Scan all four second-coordinates.` },
      { instruction: `Can P2 unilaterally guarantee that best-for-P2 leaf regardless of P1? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `P1 controls the first move, so P2 only chooses within the branch P1 selected.` },
    ],
    finalAnswer: { value: `${Math.max(T.LA[1], T.LB[1], T.RA[1], T.RB[1])}`, unit: "" },
    solutionNarrative: `Every leaf is read straight off the tree. P2's best possible payoff is ${Math.max(T.LA[1], T.LB[1], T.RA[1], T.RB[1])}, but P2 cannot force the branch that contains it — P1 moves first. Sequencing is exactly what backward induction exploits.`,
  };
};

// --- backward-induction ---
fill["gt2-backind-1"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  return {
    id: `gen.gt2-backind-1.${idx}`, generated: true, concepts: ["backward-induction"], difficulty: 1, context: "abstract",
    prompt: `Fold this tree by backward induction. P1 moves L/R, then P2 moves a/b; leaves are $(u_1,u_2)$. Start at P2's nodes (the last movers).`,
    plot: treePlot(T, "Solve last-mover-first: fix P2's best reply in each branch, then let P1 choose."),
    steps: [
      { instruction: `After L, P2 chooses its better leaf — "a" or "b"?`, answer: T.p2AtN1, accept: [], hint: `P2 payoffs: ${T.LA[1]} (a) vs ${T.LB[1]} (b).` },
      { instruction: `After R, P2 chooses "a" or "b"?`, answer: T.p2AtN2, accept: [], hint: `P2 payoffs: ${T.RA[1]} (a) vs ${T.RB[1]} (b).` },
      { instruction: `Anticipating those replies, P1 gets ${T.u1IfL} from L and ${T.u1IfR} from R. Does P1 play "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `P1 takes the larger of ${T.u1IfL} and ${T.u1IfR}.` },
    ],
    finalAnswer: { value: f.rootChoice, unit: "" },
    solutionNarrative: `Fold from the leaves: P2 plays ${T.p2AtN1} after L and ${T.p2AtN2} after R. That makes L worth ${T.u1IfL} and R worth ${T.u1IfR} to P1, so P1 plays ${f.rootChoice}. Backward induction always resolves the last movers first.`,
  };
};
fill["gt2-backind-2"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  return {
    id: `gen.gt2-backind-2.${idx}`, generated: true, concepts: ["backward-induction"], difficulty: 2, context: "abstract",
    prompt: `Solve this tree completely by backward induction and report the equilibrium OUTCOME payoffs. P1 moves L/R, P2 moves a/b; leaves are $(u_1,u_2)$.`,
    plot: treePlot(T, "Backward induction yields one path from root to a leaf — the equilibrium outcome."),
    steps: [
      { instruction: `What does P1 play at the root — "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `Compare P1's folded values ${T.u1IfL} (L) and ${T.u1IfR} (R).` },
      { instruction: `What does P2 play in the branch P1 chose — "a" or "b"?`, answer: f.p2Choice, accept: [], hint: `P2's best reply inside the chosen branch.` },
      { instruction: `What is P1's equilibrium payoff $u_1$? (A number.)`, answer: `${f.outcome[0]}`, accept: [], hint: `First coordinate of the reached leaf.` },
      { instruction: `What is P2's equilibrium payoff $u_2$?`, answer: `${f.outcome[1]}`, accept: [], hint: `Second coordinate of the reached leaf.` },
    ],
    finalAnswer: { value: `${f.outcome[0]}`, unit: "" },
    solutionNarrative: `Backward induction gives P1 = ${f.rootChoice}, then P2 = ${f.p2Choice}, reaching the leaf $(${f.outcome[0]}, ${f.outcome[1]})$. So the equilibrium outcome pays P1 ${f.outcome[0]} and P2 ${f.outcome[1]}.`,
  };
};
fill["gt2-backind-3"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  // P1's naive "best leaf" ignoring P2's incentives, to expose the trap.
  const bestLeafForP1 = [T.LA, T.LB, T.RA, T.RB].reduce((m, l) => (l[0] > m[0] ? l : m));
  const naiveBetter = bestLeafForP1[0] > f.outcome[0];
  return {
    id: `gen.gt2-backind-3.${idx}`, generated: true, concepts: ["backward-induction"], difficulty: 3, context: "applied",
    prompt: `An entry game as a tree: Entrant (P1) plays Enter (L) or Stay Out (R); Incumbent (P2) plays Fight (a) or Accommodate (b). Leaves are $(u_{\\text{entrant}}, u_{\\text{incumbent}})$. Solve by backward induction and beware wishful thinking.`,
    plot: treePlot(T, "Entrant vs Incumbent; solve last-mover-first."),
    steps: [
      { instruction: `After the Entrant plays Enter (L), does the Incumbent Fight (a) or Accommodate (b)?`, answer: T.p2AtN1, accept: [], hint: `Compare the Incumbent's payoffs ${T.LA[1]} (Fight) and ${T.LB[1]} (Accommodate).` },
      { instruction: `Given that, does the Entrant play "L" (Enter) or "R" (Stay Out)?`, answer: f.rootChoice, accept: [], hint: `Enter is worth ${T.u1IfL}, Stay Out ${T.u1IfR}.` },
      { instruction: `What equilibrium payoff does the Entrant (P1) actually receive? (A number.)`, answer: `${f.outcome[0]}`, accept: [], hint: `First coordinate of the folded leaf.` },
      { instruction: `The Entrant's single best leaf anywhere pays it ${bestLeafForP1[0]}. Can the Entrant guarantee that leaf just by wishing for it? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `That leaf may require the Incumbent to play against its own interest.` },
    ],
    finalAnswer: { value: `${f.outcome[0]}`, unit: "" },
    solutionNarrative: `Folding: the Incumbent plays ${T.p2AtN1} after Enter, so the Entrant plays ${f.rootChoice} and receives ${f.outcome[0]}. The Entrant's dream leaf pays ${bestLeafForP1[0]}, but ${naiveBetter ? "it is unreachable because the Incumbent would never cooperate to produce it" : "backward induction already delivers the reachable best"}. You cannot assume opponents play against their own interest.`,
  };
};

// --- subgame-perfection ---
fill["gt2-sgp-1"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  return {
    id: `gen.gt2-sgp-1.${idx}`, generated: true, concepts: ["subgame-perfection"], difficulty: 1, context: "abstract",
    prompt: `The subgame-perfect equilibrium (SPE) requires optimal play in EVERY subgame — including branches never reached. P1 moves L/R, P2 moves a/b; leaves $(u_1,u_2)$.`,
    plot: treePlot(T, "SPE specifies P2's move in BOTH branches, then P1's move."),
    steps: [
      { instruction: `In the SPE, what must P2 play after L — "a" or "b"?`, answer: T.p2AtN1, accept: [], hint: `P2's best reply after L.` },
      { instruction: `In the SPE, what must P2 play after R — "a" or "b"? (Even though this branch may be off-path, SPE still requires it.)`, answer: T.p2AtN2, accept: [], hint: `P2's best reply after R.` },
      { instruction: `Given both replies, does P1 play "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `P1 maximizes its folded payoff.` },
    ],
    finalAnswer: { value: f.rootChoice, unit: "" },
    solutionNarrative: `SPE = a full plan: P2 plays ${T.p2AtN1} after L and ${T.p2AtN2} after R, and P1 plays ${f.rootChoice}. Even the unreached branch must specify an optimal move — that is what makes an equilibrium "subgame perfect".`,
  };
};
fill["gt2-sgp-2"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  // The incumbent's "threat" is the action NOT chosen after entry (the aggressive one).
  const threatAction = T.p2AtN1 === "a" ? "b" : "a";
  // Is a threat to play threatAction credible? Only if it is P2's best reply, i.e. equals p2AtN1.
  const threatCredible = threatAction === T.p2AtN1; // always false by construction, but keep general
  return {
    id: `gen.gt2-sgp-2.${idx}`, generated: true, concepts: ["subgame-perfection"], difficulty: 2, context: "applied",
    prompt: `Entry game tree: Entrant plays Enter (L)/Stay Out (R); Incumbent plays Fight (a)/Accommodate (b). Leaves $(u_{\\text{entrant}}, u_{\\text{incumbent}})$. The Incumbent threatens to Fight if the Entrant enters.`,
    plot: treePlot(T, "Is the Incumbent's threat to Fight credible? Check its own payoffs after entry."),
    steps: [
      { instruction: `After the Entrant enters (L), which action actually maximizes the Incumbent's payoff — "a" or "b"?`, answer: T.p2AtN1, accept: [], hint: `Incumbent payoffs ${T.LA[1]} (a=Fight) vs ${T.LB[1]} (b=Accommodate).` },
      { instruction: `The Incumbent threatens action "${threatAction}". Is that threat credible (is it the Incumbent's best reply after entry)? Answer "credible" or "not credible".`, answer: threatAction === T.p2AtN1 ? "credible" : "not credible", accept: threatAction === T.p2AtN1 ? [] : ["notcredible"], hint: `A threat is credible only if carrying it out is actually optimal for the threatener.` },
      { instruction: `Does the subgame-perfect equilibrium include a non-credible threat? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `SPE prunes exactly the threats a player would not actually carry out.` },
    ],
    finalAnswer: { value: threatAction === T.p2AtN1 ? "credible" : "not credible", unit: "" },
    solutionNarrative: `After entry the Incumbent's best reply is ${T.p2AtN1} (payoff ${Math.max(T.LA[1], T.LB[1])}). The threatened "${threatAction}" is ${threatAction === T.p2AtN1 ? "credible" : "not credible"}, because it ${threatAction === T.p2AtN1 ? "is" : "is not"} the Incumbent's own best move. SPE ignores non-credible threats — that is precisely how it refines Nash equilibrium.`,
  };
};
fill["gt2-sgp-3"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  const threatAction = T.p2AtN1 === "a" ? "b" : "a";
  return {
    id: `gen.gt2-sgp-3.${idx}`, generated: true, concepts: ["subgame-perfection"], difficulty: 3, context: "applied",
    prompt: `Entry game: Entrant plays Enter (L)/Stay Out (R); Incumbent plays Fight (a)/Accommodate (b). Leaves $(u_{\\text{entrant}}, u_{\\text{incumbent}})$. Distinguish the subgame-perfect outcome from an equilibrium propped up by an empty threat.`,
    plot: treePlot(T, "Backward induction gives the SPE; a Nash equilibrium may rest on a non-credible threat."),
    steps: [
      { instruction: `Solve the last subgame: after Enter, does the Incumbent play "a" (Fight) or "b" (Accommodate)?`, answer: T.p2AtN1, accept: [], hint: `The Incumbent maximizes its own payoff after entry.` },
      { instruction: `Backward-induct to the root: does the Entrant play "L" (Enter) or "R" (Stay Out)?`, answer: f.rootChoice, accept: [], hint: `Enter is worth ${T.u1IfL}; Stay Out ${T.u1IfR}.` },
      { instruction: `What is the Entrant's subgame-perfect payoff? (A number.)`, answer: `${f.outcome[0]}`, accept: [], hint: `First coordinate of the folded leaf.` },
      { instruction: `Suppose the Incumbent instead loudly promises to Fight any entry (action "${threatAction}"). Is that promise credible? Answer "credible" or "not credible".`, answer: threatAction === T.p2AtN1 ? "credible" : "not credible", accept: threatAction === T.p2AtN1 ? [] : ["notcredible"], hint: `Would the Incumbent actually want to Fight once the Entrant is already in?` },
    ],
    finalAnswer: { value: `${f.outcome[0]}`, unit: "" },
    solutionNarrative: `The unique subgame-perfect path is ${f.rootChoice} then ${f.p2Choice}, paying the Entrant ${f.outcome[0]}. A promise to play "${threatAction}" is ${threatAction === T.p2AtN1 ? "credible" : "not credible"} because it ${threatAction === T.p2AtN1 ? "matches" : "contradicts"} the Incumbent's own post-entry incentive. Only subgame-perfection strips out such empty threats.`,
  };
};

// --- first-mover-and-commitment ---
// Sequential Stackelberg-style: leader commits to L or R; follower best-responds.
// Compare the leader's SPE payoff to what it would get if roles were reversed OR
// if the game were simultaneous (leader gets its maximin over follower replies).
fill["gt2-firstmover-1"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  // Follower's *guaranteed floor* for P1 if P1 could not move first: P1's smaller folded value.
  const commitValue = f.outcome[0];        // P1 moving first
  const noFirstFloor = Math.min(T.u1IfL, T.u1IfR); // if forced onto the worse branch
  const advantage = commitValue - noFirstFloor;
  return {
    id: `gen.gt2-firstmover-1.${idx}`, generated: true, concepts: ["first-mover-and-commitment"], difficulty: 1, context: "abstract",
    prompt: `In this tree P1 moves first (L/R), locking in a branch before P2 replies (a/b). Leaves $(u_1,u_2)$. Moving first lets P1 pick the better branch.`,
    plot: treePlot(T, "First mover P1 can select the branch with the higher folded payoff."),
    steps: [
      { instruction: `Folding, L is worth ${T.u1IfL} to P1 and R is worth ${T.u1IfR}. As first mover, does P1 choose "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `Pick the larger folded value.` },
      { instruction: `What payoff does P1 secure by moving first? (A number.)`, answer: `${commitValue}`, accept: [], hint: `The larger of ${T.u1IfL} and ${T.u1IfR}.` },
      { instruction: `Is moving first at least as good as being forced onto the other branch (worth ${noFirstFloor})? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `${commitValue} vs ${noFirstFloor}.` },
    ],
    finalAnswer: { value: `${commitValue}`, unit: "" },
    solutionNarrative: `By committing to ${f.rootChoice} first, P1 secures ${commitValue} — the better of its two folded branch values (${T.u1IfL} vs ${T.u1IfR}). The power to move first and commit is worth ${advantage >= 0 ? advantage : 0} here over being stuck on the worse branch.`,
  };
};
fill["gt2-firstmover-2"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  const commitValue = f.outcome[0];
  const worse = Math.min(T.u1IfL, T.u1IfR);
  const advantage = commitValue - worse;
  return {
    id: `gen.gt2-firstmover-2.${idx}`, generated: true, concepts: ["first-mover-and-commitment"], difficulty: 2, context: "applied",
    prompt: `Two firms decide capacity. As the LEADER, Firm 1 commits first (L/R); Firm 2 then best-responds (a/b). Leaves $(u_1,u_2)$ are profits. Quantify the value of committing first.`,
    plot: treePlot(T, "Leader commits; follower best-responds. Compare leader's payoff across its options."),
    steps: [
      { instruction: `As leader, which commitment does Firm 1 make — "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `Firm 1 anticipates Firm 2's reply and picks the branch worth more (${T.u1IfL} vs ${T.u1IfR}).` },
      { instruction: `What profit does Firm 1 earn from that commitment? (A number.)`, answer: `${commitValue}`, accept: [], hint: `The folded value of the chosen branch.` },
      { instruction: `Had Firm 1 been pushed onto the other branch it would earn ${worse}. What is the first-mover advantage (difference)? (A number.)`, answer: `${advantage}`, accept: [], hint: `$${commitValue} - ${worse}$.` },
    ],
    finalAnswer: { value: `${advantage}`, unit: "" },
    solutionNarrative: `Firm 1 commits to ${f.rootChoice} and earns ${commitValue}; the alternative branch would yield only ${worse}, so the first-mover advantage is $${commitValue}-${worse}=${advantage}$. A credible commitment shapes the follower's best reply in the leader's favor.`,
  };
};
fill["gt2-firstmover-3"] = (rng, idx) => {
  const T = buildTree(rng);
  const f = fold(T);
  // Also fold the tree with roles swapped: what if P1 were the FOLLOWER instead?
  // If P2 moved first, P2 would pick the branch maximizing P2's folded payoff.
  const p2IfL = (T.p2AtN1 === "a" ? T.LA : T.LB)[1];
  const p2IfR = (T.p2AtN2 === "a" ? T.RA : T.RB)[1];
  const p2Leads = p2IfL > p2IfR ? "L" : "R";
  const p1AsFollower = p2Leads === "L" ? (T.p2AtN1 === "a" ? T.LA : T.LB)[0] : (T.p2AtN2 === "a" ? T.RA : T.RB)[0];
  const leaderBetter = f.outcome[0] > p1AsFollower;
  return {
    id: `gen.gt2-firstmover-3.${idx}`, generated: true, concepts: ["first-mover-and-commitment"], difficulty: 3, context: "applied",
    prompt: `A commitment game. When Firm 1 LEADS it commits first (L/R) and Firm 2 replies (a/b). Compare Firm 1's payoff as leader to its payoff if Firm 2 led instead. Leaves $(u_1,u_2)$.`,
    plot: treePlot(T, "Who benefits from moving first? Compare the two leadership orders."),
    steps: [
      { instruction: `With Firm 1 leading, which branch does it commit to — "L" or "R"?`, answer: f.rootChoice, accept: [], hint: `Larger folded value: ${T.u1IfL} (L) vs ${T.u1IfR} (R).` },
      { instruction: `Firm 1's payoff as leader? (A number.)`, answer: `${f.outcome[0]}`, accept: [], hint: `Folded leaf's first coordinate.` },
      { instruction: `If instead Firm 2 led, it would choose the branch best for itself, leaving Firm 1 with ${p1AsFollower}. Is Firm 1 better off LEADING than following? Type 'yes' or 'no'.`, answer: yn(leaderBetter), accept: [], hint: `Compare ${f.outcome[0]} (leading) with ${p1AsFollower} (following).` },
      { instruction: `What is Firm 1's payoff difference between leading and following? (A number; leader minus follower.)`, answer: `${f.outcome[0] - p1AsFollower}`, accept: [], hint: `$${f.outcome[0]} - ${p1AsFollower}$.` },
    ],
    finalAnswer: { value: `${f.outcome[0] - p1AsFollower}`, unit: "" },
    solutionNarrative: `Leading, Firm 1 commits to ${f.rootChoice} and earns ${f.outcome[0]}. If Firm 2 led it would steer to the branch worth ${p1AsFollower} for Firm 1. The gap is $${f.outcome[0]}-${p1AsFollower}=${f.outcome[0] - p1AsFollower}$, so Firm 1 ${leaderBetter ? "enjoys a genuine first-mover advantage" : "does not gain (or even loses) by moving first — first-mover advantage is not automatic"}.`,
  };
};

// ===========================================================================
// TOPIC 3: game-theory.repeated-games
// Concepts: finite-repetition, discounting-and-present-value,
//           trigger-strategies, folk-theorem-intuition
// ===========================================================================

// A standard Prisoner's Dilemma stage game, parametrized:
//   payoffs (own): T > R > P > S  (temptation, reward, punishment, sucker)
// Cooperate,Cooperate -> R each; Defect,Defect -> P each;
// Defect vs Cooperate -> T for defector, S for cooperator.
const pdGame = (rng) => {
  const P = rng.int(0, 2);            // mutual defection payoff
  const R = P + rng.int(2, 4);        // mutual cooperation reward
  const T = R + rng.int(2, 4);        // temptation to defect
  const S = P - rng.int(1, 2);        // sucker payoff, below P
  return { T, R, P, S };
};

// Grim-trigger sustains cooperation iff  R/(1-δ) >= T + δ·P/(1-δ),
// i.e. δ >= (T - R) / (T - P).  Threshold in (0,1) when T>R>P.
const grimThreshold = (g) => [g.T - g.R, g.T - g.P]; // numerator, denominator

// --- finite-repetition ---
fill["gt2-finite-1"] = (rng, idx) => {
  const g = pdGame(rng);
  const n = rng.int(2, 6);
  return {
    id: `gen.gt2-finite-1.${idx}`, generated: true, concepts: ["finite-repetition"], difficulty: 1, context: "abstract",
    prompt: `A Prisoner's Dilemma is played a FIXED, known ${n} times. Stage payoffs (own): mutual cooperation $R=${g.R}$, mutual defection $P=${g.P}$, defect-on-cooperator temptation $T=${g.T}$, sucker $S=${g.S}$. Reason by backward induction from the LAST round.`,
    steps: [
      { instruction: `In the very last (round ${n}) there is no future to protect. Does a rational player "Cooperate" or "Defect"?`, answer: "Defect", accept: ["defect"], hint: `With no future, defecting dominates: $T=${g.T} > R=${g.R}$ and $P=${g.P} > S=${g.S}$.` },
      { instruction: `Knowing round ${n} is a sure mutual defection, what happens in round ${n - 1} — "Cooperate" or "Defect"?`, answer: "Defect", accept: ["defect"], hint: `The last round is already fixed, so round ${n - 1} is effectively the new "last" round.` },
      { instruction: `By this unraveling, in how many of the ${n} rounds do players cooperate? (A number.)`, answer: "0", accept: [], hint: `Backward induction collapses every round to defection.` },
    ],
    finalAnswer: { value: "0", unit: "rounds" },
    solutionNarrative: `The last round has no future, so both defect; that makes the second-to-last effectively last, and so on. The unraveling reaches round 1: cooperation is sustained in 0 of the ${n} rounds. A KNOWN finite horizon kills cooperation in the PD.`,
  };
};
fill["gt2-finite-2"] = (rng, idx) => {
  const g = pdGame(rng);
  const n = rng.int(3, 6);
  const totalDefect = n * g.P;
  return {
    id: `gen.gt2-finite-2.${idx}`, generated: true, concepts: ["finite-repetition"], difficulty: 2, context: "abstract",
    prompt: `The Prisoner's Dilemma above is repeated exactly ${n} times with $R=${g.R}$, $P=${g.P}$, $T=${g.T}$, $S=${g.S}$. Backward induction says both defect every round.`,
    steps: [
      { instruction: `What action is played in EVERY round of the subgame-perfect equilibrium — "Cooperate" or "Defect"?`, answer: "Defect", accept: ["defect"], hint: `Unraveling from the last round.` },
      { instruction: `What total payoff does each player get across all ${n} rounds? (A number — sum of the per-round $P$.)`, answer: `${totalDefect}`, accept: [], hint: `${n} rounds times $P=${g.P}$.` },
      { instruction: `Had both cooperated every round they'd each get ${n * g.R}. Is that MORE than the equilibrium total? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Compare ${n * g.R} with ${totalDefect}.` },
    ],
    finalAnswer: { value: `${totalDefect}`, unit: "" },
    solutionNarrative: `Every round is mutual defection, for a total of $${n} \\times ${g.P} = ${totalDefect}$ each. Full cooperation would have paid $${n} \\times ${g.R} = ${n * g.R}$ — strictly more — yet backward induction rules it out. This is the finite-horizon paradox.`,
  };
};
fill["gt2-finite-3"] = (rng, idx) => {
  const g = pdGame(rng);
  const n = rng.int(4, 7);
  return {
    id: `gen.gt2-finite-3.${idx}`, generated: true, concepts: ["finite-repetition"], difficulty: 3, context: "applied",
    prompt: `Two firms in a price war know they will interact exactly ${n} more quarters, then one exits for good. Each quarter is a Prisoner's Dilemma: cooperate = hold high prices ($R=${g.R}$), defect = undercut ($T=${g.T}$ against a cooperator), mutual undercut $P=${g.P}$, sucker $S=${g.S}$.`,
    steps: [
      { instruction: `Because the horizon is KNOWN and finite, what does backward induction predict for the final quarter — "Cooperate" or "Defect"?`, answer: "Defect", accept: ["defect"], hint: `No future quarter means nothing restrains defection.` },
      { instruction: `Does the unraveling stop before quarter 1, allowing SOME early cooperation? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Each fixed-defection round makes its predecessor the new last round.` },
      { instruction: `How many quarters of cooperation does the finite-horizon model predict? (A number.)`, answer: "0", accept: [], hint: `The unraveling reaches all the way to quarter 1.` },
      { instruction: `In reality firms often DO cooperate when the end date is uncertain. Is an UNKNOWN/indefinite horizon what breaks the unraveling? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Without a known last round, there is no place for backward induction to start.` },
    ],
    finalAnswer: { value: "0", unit: "quarters" },
    solutionNarrative: `A known ${n}-quarter horizon unravels completely: 0 quarters of cooperation. The escape hatch is uncertainty — if the firms never know which quarter is last, backward induction has no anchor, and (with enough patience) cooperation can be sustained. Finite-known and infinite/uncertain horizons behave oppositely.`,
  };
};

// --- discounting-and-present-value ---
fill["gt2-discount-1"] = (rng, idx) => {
  // δ chosen so 1/(1-δ) is clean: δ = 1/2, 2/3, 3/4, 4/5
  const opts = [[1, 2], [2, 3], [3, 4], [4, 5]];
  const [dn, dd] = rng.pick(opts);
  const u = rng.int(2, 8);
  // Σ δ^t u for t=0.. = u/(1-δ); 1-δ = (dd-dn)/dd, so sum = u*dd/(dd-dn)
  const sumNum = u * dd, sumDen = dd - dn;
  return {
    id: `gen.gt2-discount-1.${idx}`, generated: true, concepts: ["discounting-and-present-value"], difficulty: 1, context: "abstract",
    prompt: `A player receives a payoff of $${u}$ every period forever, starting now (period 0), discounted by $\\delta = ${fracStr(dn, dd)}$ per period. The present value is the geometric sum $\\sum_{t=0}^{\\infty} \\delta^t \\cdot ${u} = \\dfrac{${u}}{1-\\delta}$.`,
    steps: [
      { instruction: `Compute $1 - \\delta$. (A fraction or decimal.)`, answer: fracStr(dd - dn, dd), accept: [`${dd - dn}/${dd}`, `${((dd - dn) / dd).toFixed(6)}`], hint: `$1 - ${fracStr(dn, dd)}$.` },
      { instruction: `Compute the present value $\\dfrac{${u}}{1-\\delta}$. (A number or fraction.)`, answer: fracStr(sumNum, sumDen), accept: [`${sumNum}/${sumDen}`, `${(sumNum / sumDen).toFixed(6)}`], hint: `Divide ${u} by $1-\\delta = ${fracStr(dd - dn, dd)}$.` },
    ],
    finalAnswer: { value: fracStr(sumNum, sumDen), unit: "" },
    solutionNarrative: `$1-\\delta = ${fracStr(dd - dn, dd)}$, so the present value of $${u}$ forever is $\\dfrac{${u}}{1-\\delta} = ${fracStr(sumNum, sumDen)}$. The geometric formula $\\frac{u}{1-\\delta}$ collapses an infinite stream into one number.`,
  };
};
fill["gt2-discount-2"] = (rng, idx) => {
  const opts = [[1, 2], [2, 3], [3, 4], [4, 5]];
  const [dn, dd] = rng.pick(opts);
  const u = rng.int(2, 6);
  // Value of cooperating forever vs one-shot defection then punishment.
  // Coop forever: u/(1-δ). Here just ask for the discounted stream and a finite partial sum.
  // Finite 3-term partial: u(1 + δ + δ^2).
  // u(1 + dn/dd + dn^2/dd^2) = u( dd^2 + dn*dd + dn^2 ) / dd^2
  const pn = u * (dd * dd + dn * dd + dn * dn), pd = dd * dd;
  const sumNum = u * dd, sumDen = dd - dn;
  return {
    id: `gen.gt2-discount-2.${idx}`, generated: true, concepts: ["discounting-and-present-value"], difficulty: 2, context: "abstract",
    prompt: `A payoff of $${u}$ arrives each period with discount factor $\\delta = ${fracStr(dn, dd)}$. Compare a 3-period partial sum to the infinite present value.`,
    steps: [
      { instruction: `Compute the first three discounted terms $${u}(1 + \\delta + \\delta^2)$. (A fraction or decimal.)`, answer: fracStr(pn, pd), accept: [`${pn}/${pd}`, `${(pn / pd).toFixed(6)}`], hint: `$\\delta=${fracStr(dn, dd)}$, so $\\delta^2 = ${fracStr(dn * dn, dd * dd)}$.` },
      { instruction: `Now the infinite sum $\\dfrac{${u}}{1-\\delta}$. (A fraction or decimal.)`, answer: fracStr(sumNum, sumDen), accept: [`${sumNum}/${sumDen}`, `${(sumNum / sumDen).toFixed(6)}`], hint: `$1-\\delta=${fracStr(dd - dn, dd)}$.` },
      { instruction: `Is the infinite value LARGER than the 3-period partial sum? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Every extra period adds a positive discounted term.` },
    ],
    finalAnswer: { value: fracStr(sumNum, sumDen), unit: "" },
    solutionNarrative: `The 3-term partial sum is $${u}(1+${fracStr(dn, dd)}+${fracStr(dn * dn, dd * dd)}) = ${fracStr(pn, pd)}$, while the full stream is $\\frac{${u}}{1-\\delta} = ${fracStr(sumNum, sumDen)}$. The infinite tail (all periods from 3 on) is what makes the second larger.`,
  };
};
fill["gt2-discount-3"] = (rng, idx) => {
  const opts = [[1, 2], [2, 3], [3, 4], [4, 5]];
  const [dn, dd] = rng.pick(opts);
  const g = pdGame(rng);
  // Value of cooperating forever = R/(1-δ). Value of defecting once then P forever = T + δ P/(1-δ).
  const coopNum = g.R * dd, coopDen = dd - dn;                 // R/(1-δ)
  // defect value = T + δ P /(1-δ) = T + (dn/dd) P * dd/(dd-dn) = T + dn P/(dd-dn)
  const devNum = g.T * (dd - dn) + dn * g.P, devDen = dd - dn; // as single fraction over (dd-dn)
  const coopVal = coopNum / coopDen, devVal = devNum / devDen;
  const coopWins = coopVal >= devVal;
  return {
    id: `gen.gt2-discount-3.${idx}`, generated: true, concepts: ["discounting-and-present-value"], difficulty: 3, context: "applied",
    prompt: `In an infinitely repeated Prisoner's Dilemma ($R=${g.R}$, $T=${g.T}$, $P=${g.P}$) under grim trigger, a firm weighs cooperating forever against defecting once. Discount factor $\\delta = ${fracStr(dn, dd)}$. Present values: cooperate $= \\dfrac{R}{1-\\delta}$; defect-once $= T + \\dfrac{\\delta P}{1-\\delta}$.`,
    steps: [
      { instruction: `Value of cooperating forever, $\\dfrac{R}{1-\\delta}$. (A fraction or decimal.)`, answer: fracStr(coopNum, coopDen), accept: [`${coopNum}/${coopDen}`, `${coopVal.toFixed(6)}`], hint: `$1-\\delta=${fracStr(dd - dn, dd)}$, so divide $R=${g.R}$ by it.` },
      { instruction: `Value of defecting now then being punished forever, $T + \\dfrac{\\delta P}{1-\\delta}$. (A fraction or decimal.)`, answer: fracStr(devNum, devDen), accept: [`${devNum}/${devDen}`, `${devVal.toFixed(6)}`], hint: `$\\dfrac{\\delta P}{1-\\delta} = \\dfrac{${fracStr(dn, dd)}\\cdot${g.P}}{${fracStr(dd - dn, dd)}}$.` },
      { instruction: `Is cooperation worth at least as much as defecting (is it sustainable at this $\\delta$)? Type 'yes' or 'no'.`, answer: yn(coopWins), accept: [], hint: `Compare ${coopVal.toFixed(3)} and ${devVal.toFixed(3)}.` },
    ],
    finalAnswer: { value: fracStr(coopNum, coopDen), unit: "" },
    solutionNarrative: `Cooperate-forever is worth $${fracStr(coopNum, coopDen)} \\approx ${coopVal.toFixed(3)}$; defect-once is worth $${fracStr(devNum, devDen)} \\approx ${devVal.toFixed(3)}$. Cooperation ${coopWins ? "wins, so it is sustainable" : "loses, so at this impatience level the firm defects"} at $\\delta=${fracStr(dn, dd)}$. Patience (large $\\delta$) is what makes future punishment bite.`,
  };
};

// --- trigger-strategies ---
fill["gt2-trigger-1"] = (rng, idx) => {
  const g = pdGame(rng);
  const [tn, td] = grimThreshold(g);
  return {
    id: `gen.gt2-trigger-1.${idx}`, generated: true, concepts: ["trigger-strategies"], difficulty: 1, context: "abstract",
    prompt: `Under a GRIM-TRIGGER strategy in an infinitely repeated Prisoner's Dilemma, cooperation is sustainable when $\\delta \\ge \\dfrac{T-R}{T-P}$. Here $T=${g.T}$, $R=${g.R}$, $P=${g.P}$.`,
    steps: [
      { instruction: `Compute the numerator $T-R$. (A number.)`, answer: `${tn}`, accept: [], hint: `$${g.T}-${g.R}$.` },
      { instruction: `Compute the denominator $T-P$. (A number.)`, answer: `${td}`, accept: [], hint: `$${g.T}-${g.P}$.` },
      { instruction: `Compute the threshold $\\delta^* = \\dfrac{T-R}{T-P}$. (A fraction or decimal.)`, answer: fracStr(tn, td), accept: [`${tn}/${td}`, `${(tn / td).toFixed(6)}`], hint: `$${tn}/${td}$.` },
    ],
    finalAnswer: { value: fracStr(tn, td), unit: "" },
    solutionNarrative: `$\\delta^* = \\dfrac{T-R}{T-P} = \\dfrac{${tn}}{${td}} = ${fracStr(tn, td)}$. If the players discount the future by at least this much, grim trigger sustains cooperation; below it, the one-shot temptation wins.`,
  };
};
fill["gt2-trigger-2"] = (rng, idx) => {
  const g = pdGame(rng);
  const [tn, td] = grimThreshold(g);
  const thresh = tn / td;
  // Pick a δ and ask sustainability.
  const opts = [[1, 2], [2, 3], [3, 4], [4, 5], [1, 3], [1, 4], [3, 5]];
  const [dn, dd] = rng.pick(opts);
  const delta = dn / dd;
  const sustainable = delta >= thresh;
  return {
    id: `gen.gt2-trigger-2.${idx}`, generated: true, concepts: ["trigger-strategies"], difficulty: 2, context: "applied",
    prompt: `Two suppliers use grim trigger to hold a cartel price. Stage PD payoffs: $T=${g.T}$ (undercut a cooperator), $R=${g.R}$ (both hold), $P=${g.P}$ (both undercut). Cooperation needs $\\delta \\ge \\dfrac{T-R}{T-P}$. Their actual discount factor is $\\delta=${fracStr(dn, dd)}$.`,
    steps: [
      { instruction: `Compute the threshold $\\delta^* = \\dfrac{T-R}{T-P}$. (A fraction or decimal.)`, answer: fracStr(tn, td), accept: [`${tn}/${td}`, `${thresh.toFixed(6)}`], hint: `$(${g.T}-${g.R})/(${g.T}-${g.P})$.` },
      { instruction: `Is the firms' $\\delta=${fracStr(dn, dd)}$ at least the threshold? Type 'yes' or 'no'.`, answer: yn(sustainable), accept: [], hint: `Compare ${delta.toFixed(3)} with ${thresh.toFixed(3)}.` },
      { instruction: `So is the cartel (cooperation) sustainable under grim trigger? Type 'yes' or 'no'.`, answer: yn(sustainable), accept: [], hint: `Sustainable exactly when $\\delta \\ge \\delta^*$.` },
    ],
    finalAnswer: { value: yn(sustainable), unit: "" },
    solutionNarrative: `Threshold $\\delta^* = ${fracStr(tn, td)} \\approx ${thresh.toFixed(3)}$; the firms' $\\delta=${fracStr(dn, dd)} \\approx ${delta.toFixed(3)}$ is ${sustainable ? "at or above" : "below"} it, so the cartel ${sustainable ? "holds" : "collapses"}. Patient firms police each other with the threat of permanent price war.`,
  };
};
fill["gt2-trigger-3"] = (rng, idx) => {
  const g = pdGame(rng);
  const [tn, td] = grimThreshold(g);
  const thresh = tn / td;
  return {
    id: `gen.gt2-trigger-3.${idx}`, generated: true, concepts: ["trigger-strategies"], difficulty: 3, context: "applied",
    prompt: `Derive the grim-trigger condition from scratch for an infinitely repeated PD with $T=${g.T}$, $R=${g.R}$, $P=${g.P}$. Cooperation is an equilibrium when the value of cooperating forever, $\\dfrac{R}{1-\\delta}$, is at least the one-shot deviation value, $T + \\dfrac{\\delta P}{1-\\delta}$.`,
    steps: [
      { instruction: `Rearranging $\\dfrac{R}{1-\\delta} \\ge T + \\dfrac{\\delta P}{1-\\delta}$ gives $\\delta \\ge \\dfrac{T-R}{T-P}$. Compute $T-R$. (A number.)`, answer: `${tn}`, accept: [], hint: `$${g.T}-${g.R}$.` },
      { instruction: `Compute $T-P$. (A number.)`, answer: `${td}`, accept: [], hint: `$${g.T}-${g.P}$.` },
      { instruction: `State the critical discount factor $\\delta^*$. (A fraction or decimal.)`, answer: fracStr(tn, td), accept: [`${tn}/${td}`, `${thresh.toFixed(6)}`], hint: `$${tn}/${td}$.` },
      { instruction: `Is $\\delta^*$ strictly between 0 and 1 (a valid discount factor)? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `With $T>R>P$, both $T-R$ and $T-P$ are positive and $T-R<T-P$.` },
    ],
    finalAnswer: { value: fracStr(tn, td), unit: "" },
    solutionNarrative: `Cooperating forever beats a one-shot deviation exactly when $\\delta \\ge \\dfrac{T-R}{T-P} = \\dfrac{${tn}}{${td}} = ${fracStr(tn, td)}$. Since $0 < T-R < T-P$, the threshold lies strictly in $(0,1)$ — there is always SOME patience level that rescues cooperation.`,
  };
};

// --- folk-theorem-intuition ---
fill["gt2-folk-1"] = (rng, idx) => {
  const g = pdGame(rng);
  return {
    id: `gen.gt2-folk-1.${idx}`, generated: true, concepts: ["folk-theorem-intuition"], difficulty: 1, context: "abstract",
    prompt: `The Folk Theorem says: in an infinitely repeated game with patient players, ANY per-period payoff profile that gives each player MORE than their one-shot (minimax) guarantee can be sustained in equilibrium. In this PD the one-shot guarantee is mutual defection $P=${g.P}$; cooperation pays $R=${g.R}$.`,
    steps: [
      { instruction: `Is the cooperative payoff $R=${g.R}$ strictly above the minimax floor $P=${g.P}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `$${g.R} > ${g.P}$?` },
      { instruction: `By the Folk Theorem, can mutual cooperation be an equilibrium outcome when players are patient enough? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Any profile above the floor is sustainable for high $\\delta$.` },
      { instruction: `Could a payoff BELOW the minimax floor $P=${g.P}$ (say ${g.P - 1}) ever be forced on a rational player in equilibrium? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `A player can always guarantee at least its minimax value by deviating.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `Cooperation's $R=${g.R}$ sits above the minimax floor $P=${g.P}$, so the Folk Theorem makes it sustainable for patient players. Nothing below the floor is ever enforceable — each player can unilaterally secure its guarantee. The theorem explains why repetition permits a whole RANGE of outcomes, not just defection.`,
  };
};
fill["gt2-folk-2"] = (rng, idx) => {
  const g = pdGame(rng);
  const [tn, td] = grimThreshold(g);
  const thresh = tn / td;
  const opts = [[1, 2], [2, 3], [3, 4], [4, 5], [1, 3], [1, 4]];
  const [dn, dd] = rng.pick(opts);
  const delta = dn / dd;
  const sustainable = delta >= thresh;
  return {
    id: `gen.gt2-folk-2.${idx}`, generated: true, concepts: ["folk-theorem-intuition"], difficulty: 2, context: "applied",
    prompt: `A repeated PD models an arms race between two nations: restraint = cooperate ($R=${g.R}$), build weapons = defect ($T=${g.T}$ against a restrained rival, $P=${g.P}$ if both build). At discount factor $\\delta=${fracStr(dn, dd)}$, decide whether mutual restraint is a sustainable equilibrium.`,
    steps: [
      { instruction: `Is mutual restraint's payoff $R=${g.R}$ above the mutual-armament floor $P=${g.P}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Restraint pays more per period than an arms race.` },
      { instruction: `Compute the grim-trigger threshold $\\delta^* = \\dfrac{T-R}{T-P}$. (A fraction or decimal.)`, answer: fracStr(tn, td), accept: [`${tn}/${td}`, `${thresh.toFixed(6)}`], hint: `$(${g.T}-${g.R})/(${g.T}-${g.P})$.` },
      { instruction: `At $\\delta=${fracStr(dn, dd)}$, is restraint sustainable (is $\\delta \\ge \\delta^*$)? Type 'yes' or 'no'.`, answer: yn(sustainable), accept: [], hint: `Compare ${delta.toFixed(3)} to ${thresh.toFixed(3)}.` },
    ],
    finalAnswer: { value: yn(sustainable), unit: "" },
    solutionNarrative: `Restraint ($R=${g.R}$) beats the arms-race floor ($P=${g.P}$), so the Folk Theorem permits it — IF players are patient. Here $\\delta=${fracStr(dn, dd)} \\approx ${delta.toFixed(3)}$ is ${sustainable ? "at least" : "below"} the threshold $${fracStr(tn, td)} \\approx ${thresh.toFixed(3)}$, so restraint ${sustainable ? "is sustainable" : "collapses into an arms race"}. Patience, not preferences, decides.`,
  };
};
fill["gt2-folk-3"] = (rng, idx) => {
  const g = pdGame(rng);
  const [tn, td] = grimThreshold(g);
  const thresh = tn / td;
  // Ask: which candidate per-period payoffs are sustainable? Enumerate three payoff levels.
  // Sustainable iff strictly above P (minimax). Provide a value above, equal, below.
  const above = g.R;            // cooperation, sustainable
  const below = g.P - 1;        // below floor, never sustainable
  return {
    id: `gen.gt2-folk-3.${idx}`, generated: true, concepts: ["folk-theorem-intuition"], difficulty: 3, context: "applied",
    prompt: `A trade agreement is modeled as an infinitely repeated PD ($R=${g.R}$ mutual compliance, $P=${g.P}$ mutual cheating floor, $T=${g.T}$ one-sided cheat). The Folk Theorem characterizes which per-period payoffs can be equilibria: any payoff strictly above the minimax floor $P=${g.P}$, for patient enough players.`,
    steps: [
      { instruction: `Is a per-period payoff of ${above} (mutual compliance) above the floor and therefore Folk-Theorem sustainable? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `${above} vs floor ${g.P}.` },
      { instruction: `Is a per-period payoff of ${below} (below the floor) ever sustainable? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `No player accepts less than its minimax guarantee.` },
      { instruction: `Compute the patience threshold needed to sustain full compliance under grim trigger, $\\delta^* = \\dfrac{T-R}{T-P}$. (A fraction or decimal.)`, answer: fracStr(tn, td), accept: [`${tn}/${td}`, `${thresh.toFixed(6)}`], hint: `$(${g.T}-${g.R})/(${g.T}-${g.P})$.` },
      { instruction: `Does the Folk Theorem imply a UNIQUE equilibrium payoff, or a whole RANGE of them? Answer "unique" or "range".`, answer: "range", accept: [], hint: `Every profile above the floor qualifies — a continuum.` },
    ],
    finalAnswer: { value: fracStr(tn, td), unit: "" },
    solutionNarrative: `Compliance ($${above}$) is above the floor, so it is sustainable for patient players; anything below $P=${g.P}$ never is. Full compliance needs $\\delta \\ge ${fracStr(tn, td)} \\approx ${thresh.toFixed(3)}$. Crucially the Folk Theorem yields a RANGE of equilibria — repetition multiplies possibilities rather than pinning down one.`,
  };
};
