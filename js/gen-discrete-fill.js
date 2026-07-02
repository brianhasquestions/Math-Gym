// gen-discrete-fill.js
// Parametric generators for the Discrete Math subject, topics
//   discrete-math.logic-and-propositions
//   discrete-math.sets-and-set-operations
//   discrete-math.counting-principles
//   discrete-math.graph-theory-basics   (emits "plot" graph specs, see js/plot.js)
//   discrete-math.recursion-and-induction
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-crypto3-fill.js). Template prefix: dm-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const tf = (b) => (b ? "true" : "false");
const yn = (b) => (b ? "yes" : "no");

// `size` distinct random integers in [lo, hi], sorted ascending.
const randSet = (rng, size, lo, hi) => {
  const s = new Set();
  while (s.size < size) s.add(rng.int(lo, hi));
  return [...s].sort((a, b) => a - b);
};
const setTex = (arr) => `\\{${arr.join(", ")}\\}`;
const listAns = (arr) => arr.join(", ");

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const comb = (n, k) => Math.round(fact(n) / (fact(k) * fact(n - k)));

// --- tiny undirected-graph toolkit (for the graph-theory generators) --------
const degreeMap = (ids, edges) => {
  const d = {};
  ids.forEach((v) => (d[v] = 0));
  for (const [a, b] of edges) { d[a]++; d[b]++; }
  return d;
};
const oddCount = (ids, edges) => {
  const d = degreeMap(ids, edges);
  return ids.filter((v) => d[v] % 2 === 1).length;
};
const adjacency = (ids, edges) => {
  const adj = {};
  ids.forEach((v) => (adj[v] = []));
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  return adj;
};
const componentCount = (ids, edges) => {
  const adj = adjacency(ids, edges);
  const seen = new Set();
  let n = 0;
  for (const v of ids) {
    if (seen.has(v)) continue;
    n++;
    const q = [v];
    seen.add(v);
    while (q.length) for (const w of adj[q.shift()]) if (!seen.has(w)) { seen.add(w); q.push(w); }
  }
  return n;
};
const bfsDist = (ids, edges, s, t) => {
  const adj = adjacency(ids, edges);
  const dist = { [s]: 0 };
  const q = [s];
  while (q.length) {
    const v = q.shift();
    if (v === t) return dist[v];
    for (const w of adj[v]) if (!(w in dist)) { dist[w] = dist[v] + 1; q.push(w); }
  }
  return -1;
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
// TOPIC 1: discrete-math.logic-and-propositions
// ===========================================================================

// --- propositions-and-connectives ---
fill["dm-log-conn-d1"] = (rng, idx) => {
  const p = rng.int(0, 1) === 1, q = rng.int(0, 1) === 1;
  return {
    id: `gen.dm-log-conn-d1.${idx}`, generated: true, concepts: ["propositions-and-connectives"], difficulty: 1, context: "abstract",
    prompt: `Let $p$ be ${tf(p)} and $q$ be ${tf(q)}. Evaluate each compound statement. (Type 'true' or 'false' for each step.)`,
    steps: [
      { instruction: "Evaluate $p \\land q$. Type 'true' or 'false'.", answer: tf(p && q), accept: [], hint: "AND needs *both* parts true." },
      { instruction: "Evaluate $p \\lor q$.", answer: tf(p || q), accept: [], hint: "OR needs at least one true part." },
      { instruction: "Evaluate $\\lnot q$.", answer: tf(!q), accept: [], hint: `NOT flips the value of $q$, which is ${tf(q)}.` },
    ],
    finalAnswer: { value: tf(!q), unit: "" },
    solutionNarrative: `With $p = ${p ? "T" : "F"}$, $q = ${q ? "T" : "F"}$: $p \\land q$ is ${tf(p && q)} (both needed), $p \\lor q$ is ${tf(p || q)} (one suffices), and $\\lnot q$ flips ${tf(q)} to ${tf(!q)}.`,
  };
};
fill["dm-log-conn-d2"] = (rng, idx) => {
  const p = rng.int(0, 1) === 1, q = rng.int(0, 1) === 1, r = rng.int(0, 1) === 1;
  const variants = [
    { tex: "(p \\lor q) \\land \\lnot r", i1tex: "p \\lor q", i1: p || q, i2tex: "\\lnot r", i2: !r, whole: (p || q) && !r, combine: "\\land" },
    { tex: "(p \\land q) \\lor \\lnot r", i1tex: "p \\land q", i1: p && q, i2tex: "\\lnot r", i2: !r, whole: (p && q) || !r, combine: "\\lor" },
    { tex: "\\lnot p \\land (q \\lor r)", i1tex: "\\lnot p", i1: !p, i2tex: "q \\lor r", i2: q || r, whole: !p && (q || r), combine: "\\land" },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.dm-log-conn-d2.${idx}`, generated: true, concepts: ["propositions-and-connectives"], difficulty: 2, context: "abstract",
    prompt: `Let $p$ be ${tf(p)}, $q$ be ${tf(q)}, and $r$ be ${tf(r)}. Evaluate $${v.tex}$ inside-out. (Type 'true' or 'false' for each step.)`,
    steps: [
      { instruction: `Evaluate $${v.i1tex}$ first.`, answer: tf(v.i1), accept: [], hint: "Substitute the given truth values." },
      { instruction: `Evaluate $${v.i2tex}$.`, answer: tf(v.i2), accept: [], hint: "One connective at a time." },
      { instruction: `Combine: $${v.tex}$ is ${tf(v.i1)} $${v.combine}$ ${tf(v.i2)}. Final value?`, answer: tf(v.whole), accept: [], hint: v.combine === "\\land" ? "AND is true only if both operands are true." : "OR is true if at least one operand is true." },
    ],
    finalAnswer: { value: tf(v.whole), unit: "" },
    solutionNarrative: `$${v.i1tex} = ${v.i1 ? "T" : "F"}$ and $${v.i2tex} = ${v.i2 ? "T" : "F"}$, so $${v.tex}$ is ${tf(v.whole)}. Evaluate compound statements inside-out, exactly like arithmetic with parentheses.`,
  };
};
fill["dm-log-conn-d3"] = (rng, idx) => {
  const x = rng.pick([0, 0, 2, 4, 5]); // zero more often: the interesting case
  const m = rng.int(1, 6);
  const y = x === 0 ? rng.int(6, 20) : x * m;
  const p = x !== 0;
  const second = p ? m > 2 : false; // y/x > 2 only ever evaluated when x != 0
  const whole = p && second;
  return {
    id: `gen.dm-log-conn-d3.${idx}`, generated: true, concepts: ["propositions-and-connectives"], difficulty: 3, context: "applied",
    prompt: `A program runs \`if (x != 0 && y / x > 2)\` with $x = ${x}$ and $y = ${y}$. Like most languages, this one short-circuits: in $p \\land q$, if $p$ is false it never evaluates $q$ at all.`,
    steps: [
      { instruction: "Evaluate the first operand $p$: is $x \\ne 0$ true or false?", answer: tf(p), accept: [], hint: `$x$ is ${x}.` },
      { instruction: "Given short-circuiting, does the program evaluate the second operand $y / x > 2$ at all? Type 'yes' or 'no'.", answer: yn(p), accept: [], hint: p ? "The first operand is true, so the AND must look at the second one." : "False AND anything is already false, so evaluation stops." },
      { instruction: "What is the value of the whole condition? Type 'true' or 'false'.", answer: tf(whole), accept: [], hint: p ? `$y / x = ${y / x}$ — compare it to 2.` : "$F \\land q$ is false for every $q$." },
      { instruction: "If the language evaluated BOTH operands eagerly instead, would this line divide by zero? Type 'yes' or 'no'.", answer: yn(x === 0), accept: [], hint: `$y / x$ with $x = ${x}$.` },
    ],
    finalAnswer: { value: tf(whole), unit: "" },
    solutionNarrative: x === 0
      ? `$x \\ne 0$ is false, so short-circuit AND stops immediately: the condition is false and $y/x$ is never computed. The operand order is load-bearing — $F \\land q \\equiv F$ is exactly what makes the guard safe.`
      : `$x \\ne 0$ is true, so the second operand IS evaluated: $y/x = ${y / x}$, and $${y / x} > 2$ is ${tf(second)}, making the whole condition ${tf(whole)}. No division by zero either way — but only because the guard runs first.`,
  };
};

// --- truth-tables ---
fill["dm-log-tt-d1"] = (rng, idx) => {
  const n1 = rng.int(2, 4), n2 = rng.int(5, 7);
  return {
    id: `gen.dm-log-tt-d1.${idx}`, generated: true, concepts: ["truth-tables"], difficulty: 1, context: "abstract",
    prompt: `A truth table needs one row per combination of truth values, and each of the $n$ variables independently takes 2 values — so there are $2^n$ rows.`,
    steps: [
      { instruction: `How many rows does a truth table with ${n1} variables have? (Give a number.)`, answer: `${2 ** n1}`, accept: [], hint: `$2^{${n1}}$.` },
      { instruction: `How many rows for ${n2} variables?`, answer: `${2 ** n2}`, accept: [], hint: `$2^{${n2}}$ — keep doubling.` },
      { instruction: "Adding ONE more variable multiplies the row count by what factor?", answer: "2", accept: [], hint: "The new variable is true in half the rows and false in the other half." },
    ],
    finalAnswer: { value: `${2 ** n2}`, unit: "rows" },
    solutionNarrative: `Rows double with each extra variable: $2^{${n1}} = ${2 ** n1}$ and $2^{${n2}} = ${2 ** n2}$. Exponential growth is why brute-force table checking works for small $n$ and needs SAT solvers for large $n$.`,
  };
};
fill["dm-log-tt-d2"] = (rng, idx) => {
  const conns = [
    { tex: "p \\land q", col: [1, 0, 0, 0], hint: "AND is true only in the row where both inputs are true." },
    { tex: "p \\lor q", col: [1, 1, 1, 0], hint: "OR fails only when both inputs are false." },
    { tex: "p \\to q", col: [1, 0, 1, 1], hint: "An implication is false ONLY in the true-hypothesis, false-conclusion row." },
    { tex: "p \\oplus q", col: [0, 1, 1, 0], hint: "XOR is true exactly when the inputs differ." },
  ];
  const i = rng.int(0, 3);
  let j = rng.int(0, 3);
  while (j === i) j = rng.int(0, 3);
  const a = conns[i], b = conns[j];
  const cnt = a.col.reduce((s, v) => s + v, 0);
  return {
    id: `gen.dm-log-tt-d2.${idx}`, generated: true, concepts: ["truth-tables"], difficulty: 2, context: "abstract",
    prompt: `Build truth-table columns, with rows in the standard order $(p, q) = $ TT, TF, FT, FF. Use 1 for true and 0 for false, as an ordered comma list (e.g. 1,0,1,1).`,
    steps: [
      { instruction: `Give the column for $${a.tex}$.`, answer: a.col.join(","), accept: [], hint: a.hint },
      { instruction: `In how many of the 4 rows is $${a.tex}$ true? (Whole number.)`, answer: `${cnt}`, accept: [], hint: "Count the 1s in your column." },
      { instruction: `Now give the column for $${b.tex}$.`, answer: b.col.join(","), accept: [], hint: b.hint },
    ],
    finalAnswer: { value: b.col.join(","), unit: "" },
    solutionNarrative: `Row order TT, TF, FT, FF: $${a.tex}$ gives ${a.col.join(",")} (true in ${cnt} row${cnt === 1 ? "" : "s"}) and $${b.tex}$ gives ${b.col.join(",")}. Columns like these are the fingerprint of a connective — two formulas are equivalent exactly when their columns match.`,
  };
};
fill["dm-log-tt-d3"] = (rng, idx) => {
  const pool = [
    { tex: "(p \\lor q) \\land \\lnot r", fn: (p, q, r) => (p || q) && !r },
    { tex: "(p \\land q) \\lor r", fn: (p, q, r) => (p && q) || r },
    { tex: "\\lnot p \\lor (q \\land r)", fn: (p, q, r) => !p || (q && r) },
    { tex: "(p \\to q) \\land r", fn: (p, q, r) => (!p || q) && r },
  ];
  const f = rng.pick(pool);
  let cnt = 0;
  for (const p of [true, false]) for (const q of [true, false]) for (const r of [true, false]) if (f.fn(p, q, r)) cnt++;
  return {
    id: `gen.dm-log-tt-d3.${idx}`, generated: true, concepts: ["truth-tables"], difficulty: 3, context: "abstract",
    prompt: `Run the full truth-table analysis of $${f.tex}$ over the variables $p, q, r$.`,
    steps: [
      { instruction: "How many rows does the table have? (Whole number.)", answer: "8", accept: [], hint: "$2^3$." },
      { instruction: `In how many of those rows is $${f.tex}$ true?`, answer: `${cnt}`, accept: [], hint: "Work through the 8 combinations systematically: TTT, TTF, TFT, TFF, FTT, FTF, FFT, FFF." },
      { instruction: "Is the formula a tautology (true in EVERY row)? Type 'yes' or 'no'.", answer: yn(cnt === 8), accept: [], hint: `Compare your count to 8.` },
      { instruction: "Is it satisfiable (true in AT LEAST one row)? Type 'yes' or 'no'.", answer: yn(cnt > 0), accept: [], hint: "Satisfiable just needs one true row." },
    ],
    finalAnswer: { value: `${cnt}`, unit: "rows" },
    solutionNarrative: `Enumerating all $2^3 = 8$ assignments, $${f.tex}$ is true in ${cnt} of them — so it is ${cnt === 8 ? "a tautology" : "not a tautology"} and ${cnt > 0 ? "satisfiable" : "unsatisfiable"}. Counting satisfying rows is exactly what a SAT solver does at industrial scale.`,
  };
};

// --- implication-and-contrapositive ---
fill["dm-log-imp-d1"] = (rng, idx) => {
  const p = rng.int(0, 1) === 1, q = rng.int(0, 1) === 1;
  const imp = !p || q, conv = !q || p;
  return {
    id: `gen.dm-log-imp-d1.${idx}`, generated: true, concepts: ["implication-and-contrapositive"], difficulty: 1, context: "abstract",
    prompt: `Let $p$ be ${tf(p)} and $q$ be ${tf(q)}. Remember: $p \\to q$ is false ONLY when $p$ is true and $q$ is false. (Type 'true' or 'false' for each step.)`,
    steps: [
      { instruction: "Evaluate $p \\to q$.", answer: tf(imp), accept: [], hint: "Check whether this is the one forbidden row: true hypothesis, false conclusion." },
      { instruction: "Evaluate the converse $q \\to p$.", answer: tf(conv), accept: [], hint: "Same rule with the roles swapped: false only if $q$ is true and $p$ is false." },
      { instruction: "Evaluate $\\lnot p \\lor q$ — the OR form of the implication.", answer: tf(imp), accept: [], hint: "$p \\to q$ and $\\lnot p \\lor q$ always agree." },
    ],
    finalAnswer: { value: tf(imp), unit: "" },
    solutionNarrative: `With $p = ${p ? "T" : "F"}$, $q = ${q ? "T" : "F"}$: $p \\to q$ is ${tf(imp)} and the converse $q \\to p$ is ${tf(conv)} — ${imp === conv ? "they happen to agree here, but they are NOT equivalent in general" : "they disagree, proof that an implication and its converse are different statements"}. And $\\lnot p \\lor q = ${tf(imp)}$, matching $p \\to q$ as always.`,
  };
};
fill["dm-log-imp-d2"] = (rng, idx) => {
  const scen = rng.pick([
    { name: "tollens",
      setup: "the CI pipeline guarantees: if the build passes ($p$), the artifact is uploaded ($q$). You check the registry: NO artifact was uploaded ($q$ is false)",
      s1: { i: "Suppose the build HAD passed ($p$ true). Given the guarantee $p \\to q$, what would $q$ have to be? Type 'true' or 'false'.", a: "true", h: "A true implication with a true hypothesis forces a true conclusion." },
      s2: { i: "That contradicts what you observed. So what was $p$ — did the build pass? Type 'true' or 'false'.", a: "false", h: "This is modus tollens: $p \\to q$ with $\\lnot q$ forces $\\lnot p$." },
      final: "false",
      narr: "Modus tollens: from $p \\to q$ and $\\lnot q$, conclude $\\lnot p$. If the build had passed, the artifact would exist; it doesn't, so the build failed. This is reasoning along the contrapositive $\\lnot q \\to \\lnot p$." },
    { name: "ponens",
      setup: "the CI pipeline guarantees: if the build passes ($p$), the artifact is uploaded ($q$). You watch the dashboard: the build PASSED ($p$ is true)",
      s1: { i: "Could $p \\to q$ hold with $p$ true and $q$ false? Type 'yes' or 'no'.", a: "no", h: "True hypothesis with false conclusion is the one row where an implication fails." },
      s2: { i: "So what is $q$ — was the artifact uploaded? Type 'true' or 'false'.", a: "true", h: "This is modus ponens: $p \\to q$ with $p$ forces $q$." },
      final: "true",
      narr: "Modus ponens: from $p \\to q$ and $p$, conclude $q$. The build passed, so the artifact must be there — the only escape would be the T→F row, which the guarantee rules out." },
    { name: "affirming",
      setup: "the CI pipeline guarantees: if the build passes ($p$), the artifact is uploaded ($q$). You check the registry: the artifact IS there ($q$ is true)",
      s1: { i: "Does $p \\to q$ with $q$ true FORCE $p$ to be true? Type 'yes' or 'no'.", a: "no", h: "The rows FT and TT both satisfy the implication with $q$ true — an upload could have another cause (e.g. a manual push)." },
      s2: { i: "Concluding $p$ from $p \\to q$ and $q$ is a classic fallacy: it silently uses the CONVERSE $q \\to p$. Is the converse equivalent to the original implication? Type 'yes' or 'no'.", a: "no", h: "Only the contrapositive $\\lnot q \\to \\lnot p$ is equivalent to $p \\to q$." },
      final: "no",
      narr: "Affirming the consequent: $p \\to q$ plus $q$ tells you nothing about $p$, because the implication also holds when $p$ is false. Only the contrapositive is a safe reversal — the converse is a different (and here unjustified) claim." },
  ]);
  return {
    id: `gen.dm-log-imp-d2.${idx}`, generated: true, concepts: ["implication-and-contrapositive"], difficulty: 2, context: "applied",
    prompt: `Reason it out: ${scen.setup}.`,
    steps: [
      { instruction: scen.s1.i, answer: scen.s1.a, accept: [], hint: scen.s1.h },
      { instruction: scen.s2.i, answer: scen.s2.a, accept: [], hint: scen.s2.h },
    ],
    finalAnswer: { value: scen.final, unit: "" },
    solutionNarrative: scen.narr,
  };
};
fill["dm-log-imp-d3"] = (rng, idx) => {
  const p = rng.int(0, 1) === 1, q = rng.int(0, 1) === 1;
  const imp = !p || q, conv = !q || p;
  const ctp = q || !p; // ¬q → ¬p  ==  q ∨ ¬p  (always equals imp; kept explicit for readability)
  return {
    id: `gen.dm-log-imp-d3.${idx}`, generated: true, concepts: ["implication-and-contrapositive"], difficulty: 3, context: "abstract",
    prompt: `Let $p$ be ${tf(p)} and $q$ be ${tf(q)}. Evaluate the implication $p \\to q$ and its three relatives. (Type 'true' or 'false' unless asked otherwise.)`,
    steps: [
      { instruction: "Evaluate the original $p \\to q$.", answer: tf(imp), accept: [], hint: "False only in the T→F case." },
      { instruction: "Evaluate the converse $q \\to p$.", answer: tf(conv), accept: [], hint: "Swap hypothesis and conclusion, then apply the same rule." },
      { instruction: "Evaluate the contrapositive $\\lnot q \\to \\lnot p$.", answer: tf(ctp), accept: [], hint: `$\\lnot q$ is ${tf(!q)} and $\\lnot p$ is ${tf(!p)}.` },
      { instruction: "Which relative is ALWAYS equivalent to the original implication — the 'converse' or the 'contrapositive'? (One word.)", answer: "contrapositive", accept: [], hint: "Your step values already show one match; it is no accident — negate both parts AND swap them." },
    ],
    finalAnswer: { value: "contrapositive", unit: "" },
    solutionNarrative: `$p \\to q$ is ${tf(imp)} and the contrapositive $\\lnot q \\to \\lnot p$ is ${tf(ctp)} — always equal, which is why proofs may freely swap them. The converse $q \\to p$ (${tf(conv)} here) is an independent claim: ${imp === conv ? "it happens to agree at this assignment, but fails at others" : "it disagrees at this very assignment"}.`,
  };
};

// --- demorgan-and-equivalence ---
fill["dm-log-dem-d1"] = (rng, idx) => {
  const p = rng.int(0, 1) === 1, q = rng.int(0, 1) === 1;
  const inner = p && q, neg = !inner, dem = !p || !q;
  return {
    id: `gen.dm-log-dem-d1.${idx}`, generated: true, concepts: ["demorgan-and-equivalence"], difficulty: 1, context: "abstract",
    prompt: `Let $p$ be ${tf(p)} and $q$ be ${tf(q)}. De Morgan's law says $\\lnot(p \\land q) \\equiv \\lnot p \\lor \\lnot q$ — verify it at this assignment. (Type 'true' or 'false' for each step.)`,
    steps: [
      { instruction: "Evaluate $p \\land q$.", answer: tf(inner), accept: [], hint: "AND needs both parts true." },
      { instruction: "Evaluate $\\lnot(p \\land q)$.", answer: tf(neg), accept: [], hint: "Flip your previous answer." },
      { instruction: "Now evaluate $\\lnot p \\lor \\lnot q$ directly.", answer: tf(dem), accept: [], hint: `$\\lnot p$ is ${tf(!p)} and $\\lnot q$ is ${tf(!q)}.` },
      { instruction: "Do the two sides agree, as De Morgan promises? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Compare your last two answers." },
    ],
    finalAnswer: { value: tf(neg), unit: "" },
    solutionNarrative: `$p \\land q = ${tf(inner)}$, so $\\lnot(p \\land q) = ${tf(neg)}$; and $\\lnot p \\lor \\lnot q = ${tf(!p)} \\lor ${tf(!q)} = ${tf(dem)}$. The two sides match — negating an AND turns it into an OR of negations.`,
  };
};
fill["dm-log-dem-d2"] = (rng, idx) => {
  const x = rng.int(0, 12), y = rng.int(0, 12);
  const a = x > 5, b = y < 10;
  const inner = a && b, neg = !inner;
  return {
    id: `gen.dm-log-dem-d2.${idx}`, generated: true, concepts: ["demorgan-and-equivalence"], difficulty: 2, context: "applied",
    prompt: `Your code contains \`if (!(x > 5 && y < 10))\` with $x = ${x}$ and $y = ${y}$. A reviewer asks you to push the negation inside with De Morgan. (Type 'true' or 'false' for each step.)`,
    steps: [
      { instruction: "Evaluate $x > 5$.", answer: tf(a), accept: [], hint: `Compare ${x} with 5.` },
      { instruction: "Evaluate $y < 10$.", answer: tf(b), accept: [], hint: `Compare ${y} with 10.` },
      { instruction: "Evaluate the original condition $\\lnot(x > 5 \\land y < 10)$.", answer: tf(neg), accept: [], hint: "AND the two comparisons, then negate." },
      { instruction: "De Morgan rewrites it as $x \\le 5 \\lor y \\ge 10$ — note each comparison flips too. Evaluate the rewrite.", answer: tf(!a || !b), accept: [], hint: "Negating $x > 5$ gives $x \\le 5$, NOT $x < 5$." },
    ],
    finalAnswer: { value: tf(neg), unit: "" },
    solutionNarrative: `$x > 5$ is ${tf(a)} and $y < 10$ is ${tf(b)}, so the original evaluates to ${tf(neg)} — and so does the rewrite \`x <= 5 || y >= 10\`, at every input, not just this one. The classic bug is flipping && to || while forgetting to negate the comparisons.`,
  };
};
fill["dm-log-dem-d3"] = (rng, idx) => {
  const rows = [];
  for (const p of [true, false]) for (const q of [true, false]) rows.push([p, q]);
  const cnt = (fn) => rows.filter(([p, q]) => fn(p, q)).length;
  const pair = rng.pick([
    { texA: "\\lnot(p \\land q)", fnA: (p, q) => !(p && q), texB: "\\lnot p \\lor \\lnot q", fnB: (p, q) => !p || !q, texBad: "\\lnot p \\land \\lnot q", fnBad: (p, q) => !p && !q },
    { texA: "\\lnot(p \\lor q)", fnA: (p, q) => !(p || q), texB: "\\lnot p \\land \\lnot q", fnB: (p, q) => !p && !q, texBad: "\\lnot p \\lor \\lnot q", fnBad: (p, q) => !p || !q },
  ]);
  const cA = cnt(pair.fnA), cB = cnt(pair.fnB), cBad = cnt(pair.fnBad);
  return {
    id: `gen.dm-log-dem-d3.${idx}`, generated: true, concepts: ["demorgan-and-equivalence"], difficulty: 3, context: "abstract",
    prompt: `Prove an equivalence the brute-force way: compare truth-table columns over the 4 rows $(p, q) = $ TT, TF, FT, FF.`,
    steps: [
      { instruction: `In how many of the 4 rows is $${pair.texA}$ true? (Whole number.)`, answer: `${cA}`, accept: [], hint: "Evaluate the inner connective in each row, then negate." },
      { instruction: `In how many rows is $${pair.texB}$ true?`, answer: `${cB}`, accept: [], hint: "Negate each variable first, then combine." },
      { instruction: `The counts match — but equivalence needs the SAME rows, and indeed they agree row by row. Is $${pair.texA} \\equiv ${pair.texB}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "This is De Morgan's law, verified by exhaustion." },
      { instruction: `A teammate claims $${pair.texA} \\equiv ${pair.texBad}$ instead. In how many rows is $${pair.texBad}$ true?`, answer: `${cBad}`, accept: [], hint: "Careful: this is the WRONG De Morgan — the connective flipped but the count differs." },
      { instruction: "So is the teammate's version equivalent to the original? Type 'yes' or 'no'.", answer: "no", accept: [], hint: `${cA} true rows versus ${cBad} — different columns cannot be the same formula.` },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `$${pair.texA}$ is true in ${cA} rows, matching $${pair.texB}$ row for row — De Morgan, proved by checking all $2^2 = 4$ cases. The tempting-but-wrong $${pair.texBad}$ is true in ${cBad} rows, so it is NOT equivalent: negation flips the connective ($\\land \\leftrightarrow \\lor$), it never leaves it alone.`,
  };
};

// ===========================================================================
// TOPIC 2: discrete-math.sets-and-set-operations
// ===========================================================================

// Build two overlapping sets from disjoint parts so every region is nonempty.
const twoSets = (rng, nShared, nOnlyA, nOnlyB) => {
  const all = randSet(rng, nShared + nOnlyA + nOnlyB, 1, 20);
  // rng-stable partition: the sorted pool is split by index
  const shared = all.slice(0, nShared);
  const onlyA = all.slice(nShared, nShared + nOnlyA);
  const onlyB = all.slice(nShared + nOnlyA);
  const A = [...shared, ...onlyA].sort((a, b) => a - b);
  const B = [...shared, ...onlyB].sort((a, b) => a - b);
  return { A, B, shared: shared.slice().sort((a, b) => a - b), onlyA: onlyA.slice().sort((a, b) => a - b), onlyB: onlyB.slice().sort((a, b) => a - b) };
};

// --- membership-and-subsets ---
fill["dm-set-mem-d1"] = (rng, idx) => {
  const A = randSet(rng, 5, 1, 15);
  const inA = rng.int(0, 1) === 1;
  let x;
  if (inA) x = rng.pick(A);
  else { x = rng.int(1, 15); while (A.includes(x)) x = rng.int(1, 15); }
  return {
    id: `gen.dm-set-mem-d1.${idx}`, generated: true, concepts: ["membership-and-subsets"], difficulty: 1, context: "abstract",
    prompt: `Let $A = ${setTex(A)}$.`,
    steps: [
      { instruction: "How many elements does $A$ have — what is $|A|$? (Whole number.)", answer: `${A.length}`, accept: [], hint: "Count the listed elements." },
      { instruction: `Is $${x} \\in A$? Type 'yes' or 'no'.`, answer: yn(inA), accept: [], hint: `Scan the list for ${x}.` },
      { instruction: "Is the empty set $\\emptyset$ a subset of $A$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "A subset relation fails only if some element of the left set is missing from the right — and $\\emptyset$ has no elements to fail with." },
    ],
    finalAnswer: { value: yn(inA), unit: "" },
    solutionNarrative: `$|A| = ${A.length}$, and ${x} ${inA ? "appears in" : "does not appear in"} the list, so $${x} ${inA ? "\\in" : "\\notin"} A$. The empty set is a subset of EVERY set — vacuously, since it has no element that could be missing.`,
  };
};
fill["dm-set-mem-d2"] = (rng, idx) => {
  const B = randSet(rng, 6, 1, 18);
  const isSub = rng.int(0, 1) === 1;
  let A;
  if (isSub) {
    const picks = randSet(rng, 3, 0, 5); // 3 distinct indices into B
    A = picks.map((i) => B[i]).sort((a, b) => a - b);
  } else {
    const picks = randSet(rng, 2, 0, 5);
    let out = rng.int(1, 18);
    while (B.includes(out)) out = rng.int(1, 18);
    A = [...picks.map((i) => B[i]), out].sort((a, b) => a - b);
  }
  return {
    id: `gen.dm-set-mem-d2.${idx}`, generated: true, concepts: ["membership-and-subsets"], difficulty: 2, context: "abstract",
    prompt: `Let $A = ${setTex(A)}$ and $B = ${setTex(B)}$.`,
    steps: [
      { instruction: "Is $A \\subseteq B$ — is every element of $A$ also in $B$? Type 'yes' or 'no'.", answer: yn(isSub), accept: [], hint: "Check the elements of $A$ one by one against $B$; a single miss sinks the subset claim." },
      { instruction: "Is $B \\subseteq A$? Type 'yes' or 'no'.", answer: "no", accept: [], hint: `$B$ has ${B.length} elements and $A$ only ${A.length} — a bigger set never fits inside a smaller one.` },
      { instruction: "Could $A = B$ ever hold when $|A| \\ne |B|$? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "Equal sets are subsets of each other, so they must have the same size." },
    ],
    finalAnswer: { value: yn(isSub), unit: "" },
    solutionNarrative: isSub
      ? `Every element of $A$ appears in $B$, so $A \\subseteq B$. The reverse fails on size alone: $|B| = ${B.length} > ${A.length} = |A|$. Set equality would need containment BOTH ways.`
      : `$A \\not\\subseteq B$: the element ${A.find((v) => !B.includes(v))} of $A$ is missing from $B$ — one miss is all it takes. And $B \\not\\subseteq A$ by size ($${B.length} > ${A.length}$).`,
  };
};
fill["dm-set-mem-d3"] = (rng, idx) => {
  const C = randSet(rng, 7, 1, 20);
  const bIdx = randSet(rng, 5, 0, 6);
  const B = bIdx.map((i) => C[i]).sort((a, b) => a - b);
  const aIdx = randSet(rng, 3, 0, 4);
  const A = aIdx.map((i) => B[i]).sort((a, b) => a - b);
  return {
    id: `gen.dm-set-mem-d3.${idx}`, generated: true, concepts: ["membership-and-subsets"], difficulty: 3, context: "applied",
    prompt: `Access control uses nested permission sets: admins $A = ${setTex(A)}$, builders $B = ${setTex(B)}$, and all users $C = ${setTex(C)}$ (each number is a user id).`,
    steps: [
      { instruction: "Is $A \\subseteq B$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Check each admin id against the builder list." },
      { instruction: "Is $B \\subseteq C$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Check each builder id against the user list." },
      { instruction: "Subset relations chain: since $A \\subseteq B$ and $B \\subseteq C$, is $A \\subseteq C$ guaranteed — with no further checking? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "This is transitivity: every element of $A$ sits in $B$, hence in $C$." },
      { instruction: "How many users are in $C$ but NOT in $A$ — i.e. what is $|C \\setminus A|$? (Whole number.)", answer: `${C.length - A.length}`, accept: [], hint: `Since $A \\subseteq C$, just subtract: $|C| - |A| = ${C.length} - ${A.length}$.` },
    ],
    finalAnswer: { value: `${C.length - A.length}`, unit: "users" },
    solutionNarrative: `$A \\subseteq B \\subseteq C$ holds by direct check, and transitivity then gives $A \\subseteq C$ for free — the whole point of arranging permissions as a chain. Because $A \\subseteq C$, the difference count is exactly $|C| - |A| = ${C.length} - ${A.length} = ${C.length - A.length}$ (that subtraction shortcut is only valid for nested sets).`,
  };
};

// --- union-intersection-difference ---
fill["dm-set-ops-d1"] = (rng, idx) => {
  const { A, B, shared } = twoSets(rng, 2, 2, 2);
  const union = [...new Set([...A, ...B])].sort((a, b) => a - b);
  return {
    id: `gen.dm-set-ops-d1.${idx}`, generated: true, concepts: ["union-intersection-difference"], difficulty: 1, context: "abstract",
    prompt: `Let $A = ${setTex(A)}$ and $B = ${setTex(B)}$.`,
    steps: [
      { instruction: "List the elements of $A \\cap B$ — the elements in BOTH sets. (Comma-separated, any order.)", answer: listAns(shared), accept: [], form: "solutions", hint: "Walk through $A$ and keep only what also appears in $B$." },
      { instruction: "What is $|A \\cup B|$ — how many DISTINCT elements appear in $A$ or $B$ (or both)? (Whole number.)", answer: `${union.length}`, accept: [], hint: "Merge the lists but count each shared element only once." },
      { instruction: "List the elements of $A \\cup B$. (Comma-separated, any order.)", answer: listAns(union), accept: [], form: "solutions", hint: "Everything from both lists, duplicates written once." },
    ],
    finalAnswer: { value: `${union.length}`, unit: "elements" },
    solutionNarrative: `$A \\cap B = ${setTex(shared)}$ (the overlap) and $A \\cup B = ${setTex(union)}$, so $|A \\cup B| = ${union.length}$ — note $${A.length} + ${B.length} - ${shared.length} = ${union.length}$: the merge double-counts the overlap unless you subtract it.`,
  };
};
fill["dm-set-ops-d2"] = (rng, idx) => {
  const { A, B, shared, onlyA, onlyB } = twoSets(rng, 2, 2, 2);
  const sym = [...onlyA, ...onlyB].sort((a, b) => a - b);
  return {
    id: `gen.dm-set-ops-d2.${idx}`, generated: true, concepts: ["union-intersection-difference"], difficulty: 2, context: "abstract",
    prompt: `Let $A = ${setTex(A)}$ and $B = ${setTex(B)}$. Careful: set difference is NOT symmetric.`,
    steps: [
      { instruction: "List the elements of $A \\setminus B$ — in $A$ but not in $B$. (Comma-separated, any order.)", answer: listAns(onlyA), accept: [], form: "solutions", hint: "Start from $A$ and delete anything that also appears in $B$." },
      { instruction: "List the elements of $B \\setminus A$.", answer: listAns(onlyB), accept: [], form: "solutions", hint: "Start from $B$ this time." },
      { instruction: "How many elements are in exactly ONE of the two sets (the symmetric difference)? (Whole number.)", answer: `${sym.length}`, accept: [], hint: "Combine your two difference lists." },
    ],
    finalAnswer: { value: `${sym.length}`, unit: "elements" },
    solutionNarrative: `$A \\setminus B = ${setTex(onlyA)}$ and $B \\setminus A = ${setTex(onlyB)}$ — different sets, which is why order matters in a difference. Together they form the symmetric difference, ${setTex(sym)}, with ${sym.length} elements; the overlap $${setTex(shared)}$ belongs to neither difference.`,
  };
};
fill["dm-set-ops-d3"] = (rng, idx) => {
  const { A, B, shared, onlyA, onlyB } = twoSets(rng, 2, 3, 2);
  const union = [...new Set([...A, ...B])].sort((a, b) => a - b);
  return {
    id: `gen.dm-set-ops-d3.${idx}`, generated: true, concepts: ["union-intersection-difference"], difficulty: 3, context: "applied",
    prompt: `Two deploys are compared by the ids of the servers they touched: yesterday's deploy touched $A = ${setTex(A)}$, today's touched $B = ${setTex(B)}$.`,
    steps: [
      { instruction: "Which servers were touched by BOTH deploys? (Comma-separated ids, any order.)", answer: listAns(shared), accept: [], form: "solutions", hint: "That's $A \\cap B$." },
      { instruction: "Which servers did ONLY yesterday's deploy touch? (Comma-separated, any order.)", answer: listAns(onlyA), accept: [], form: "solutions", hint: "That's $A \\setminus B$." },
      { instruction: "The audit wants every server touched at least once. How many servers is that? (Whole number.)", answer: `${union.length}`, accept: [], hint: "That's $|A \\cup B|$ — merge and deduplicate." },
      { instruction: "A rollback must revisit servers whose state DIVERGED — touched by exactly one deploy. How many? (Whole number.)", answer: `${onlyA.length + onlyB.length}`, accept: [], hint: "Symmetric difference: $|A \\setminus B| + |B \\setminus A|$." },
    ],
    finalAnswer: { value: `${onlyA.length + onlyB.length}`, unit: "servers" },
    solutionNarrative: `Both deploys: $A \\cap B = ${setTex(shared)}$. Only yesterday: $A \\setminus B = ${setTex(onlyA)}$; only today: $B \\setminus A = ${setTex(onlyB)}$. The audit set is $A \\cup B$ with ${union.length} servers; the divergent set is the symmetric difference with $${onlyA.length} + ${onlyB.length} = ${onlyA.length + onlyB.length}$ servers. Every ops diff/rollback question is one of these four operators.`,
  };
};

// --- cardinality-inclusion-exclusion ---
fill["dm-set-ie-d1"] = (rng, idx) => {
  const i = rng.int(3, 9);
  const a = i + rng.int(4, 15), b = i + rng.int(4, 15);
  return {
    id: `gen.dm-set-ie-d1.${idx}`, generated: true, concepts: ["cardinality-inclusion-exclusion"], difficulty: 1, context: "abstract",
    prompt: `Two sets satisfy $|A| = ${a}$, $|B| = ${b}$, and $|A \\cap B| = ${i}$. Find $|A \\cup B|$.`,
    steps: [
      { instruction: `First add the sizes: $|A| + |B|$. (Whole number.)`, answer: `${a + b}`, accept: [], hint: `${a} + ${b}.` },
      { instruction: "That sum counts the overlap twice. Apply inclusion-exclusion: $|A \\cup B| = |A| + |B| - |A \\cap B|$.", answer: `${a + b - i}`, accept: [], hint: `Subtract ${i} from your sum.` },
    ],
    finalAnswer: { value: `${a + b - i}`, unit: "" },
    solutionNarrative: `$|A \\cup B| = ${a} + ${b} - ${i} = ${a + b - i}$. The ${i} shared elements got counted once as members of $A$ and again as members of $B$; subtracting the intersection removes the double count.`,
  };
};
fill["dm-set-ie-d2"] = (rng, idx) => {
  const i = rng.int(4, 12);
  const a = i + rng.int(5, 20), b = i + rng.int(5, 20);
  const u = a + b - i;
  return {
    id: `gen.dm-set-ie-d2.${idx}`, generated: true, concepts: ["cardinality-inclusion-exclusion"], difficulty: 2, context: "applied",
    prompt: `A survey of ${u} developers found ${a} use Python and ${b} use JavaScript, and every developer surveyed uses at least one of the two.`,
    steps: [
      { instruction: "Compute $|A| + |B|$ — the two counts naively added. (Whole number.)", answer: `${a + b}`, accept: [], hint: `${a} + ${b}.` },
      { instruction: `That exceeds the ${u} people surveyed. How many developers use BOTH languages? (Solve $|A \\cap B| = |A| + |B| - |A \\cup B|$.)`, answer: `${i}`, accept: [], hint: `${a + b} - ${u}.` },
      { instruction: "How many use Python but NOT JavaScript?", answer: `${a - i}`, accept: [], hint: `$|A| - |A \\cap B| = ${a} - ${i}$.` },
    ],
    finalAnswer: { value: `${i}`, unit: "developers" },
    solutionNarrative: `Adding the counts gives ${a + b}, but only ${u} people exist — the excess $${a + b} - ${u} = ${i}$ is exactly the double-counted both-languages group. Then Python-only is $${a} - ${i} = ${a - i}$. Inclusion-exclusion run backwards is the standard way to expose an overlap.`,
  };
};
fill["dm-set-ie-d3"] = (rng, idx) => {
  // Build three sets from explicit Venn regions so every count is consistent.
  const rA = rng.int(2, 8), rB = rng.int(2, 8), rC = rng.int(2, 8);
  const rAB = rng.int(1, 5), rAC = rng.int(1, 5), rBC = rng.int(1, 5), rABC = rng.int(1, 4);
  const nA = rA + rAB + rAC + rABC, nB = rB + rAB + rBC + rABC, nC = rC + rAC + rBC + rABC;
  const nAB = rAB + rABC, nAC = rAC + rABC, nBC = rBC + rABC;
  const total = rA + rB + rC + rAB + rAC + rBC + rABC;
  return {
    id: `gen.dm-set-ie-d3.${idx}`, generated: true, concepts: ["cardinality-inclusion-exclusion"], difficulty: 3, context: "applied",
    prompt: `A bug tracker labels issues with up to three tags. The counts: $|A| = ${nA}$ (backend), $|B| = ${nB}$ (frontend), $|C| = ${nC}$ (security); pairwise $|A \\cap B| = ${nAB}$, $|A \\cap C| = ${nAC}$, $|B \\cap C| = ${nBC}$; and $|A \\cap B \\cap C| = ${rABC}$. Every issue has at least one tag. How many issues are there?`,
    steps: [
      { instruction: "Add the three single-set sizes: $|A| + |B| + |C|$. (Whole number.)", answer: `${nA + nB + nC}`, accept: [], hint: `${nA} + ${nB} + ${nC}.` },
      { instruction: "Add the three pairwise intersections: $|A \\cap B| + |A \\cap C| + |B \\cap C|$.", answer: `${nAB + nAC + nBC}`, accept: [], hint: `${nAB} + ${nAC} + ${nBC}.` },
      { instruction: "Inclusion-exclusion: $|A \\cup B \\cup C| = \\text{singles} - \\text{pairs} + |A \\cap B \\cap C|$. How many issues?", answer: `${total}`, accept: [], hint: `${nA + nB + nC} - ${nAB + nAC + nBC} + ${rABC}.` },
    ],
    finalAnswer: { value: `${total}`, unit: "issues" },
    solutionNarrative: `$|A \\cup B \\cup C| = ${nA + nB + nC} - ${nAB + nAC + nBC} + ${rABC} = ${total}$. The pattern: adding singles double-counts pairs, subtracting pairs over-corrects the triple region (it gets added 3 times then removed 3 times), so the triple intersection goes back in once.`,
  };
};

// --- power-sets-and-products ---
fill["dm-set-pp-d1"] = (rng, idx) => {
  const n = rng.int(3, 6);
  const A = randSet(rng, n, 1, 12);
  return {
    id: `gen.dm-set-pp-d1.${idx}`, generated: true, concepts: ["power-sets-and-products"], difficulty: 1, context: "abstract",
    prompt: `Let $A = ${setTex(A)}$, so $|A| = ${n}$. The power set $\\mathcal{P}(A)$ is the set of ALL subsets of $A$.`,
    steps: [
      { instruction: `Each element is independently in or out of a subset. How many subsets does $A$ have — what is $|\\mathcal{P}(A)|$? (Whole number.)`, answer: `${2 ** n}`, accept: [], hint: `$2^{${n}}$: two choices per element.` },
      { instruction: "Is the empty set $\\emptyset$ one of those subsets? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "It's the subset where every element chose 'out'." },
      { instruction: `Is $A$ itself one of them? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "Every element chose 'in'. Subset does not mean proper subset." },
    ],
    finalAnswer: { value: `${2 ** n}`, unit: "subsets" },
    solutionNarrative: `Each of the ${n} elements makes an independent in/out choice, so $|\\mathcal{P}(A)| = 2^{${n}} = ${2 ** n}$ — including the two extremes $\\emptyset$ (all out) and $A$ itself (all in).`,
  };
};
fill["dm-set-pp-d2"] = (rng, idx) => {
  const m = rng.int(3, 6), n = rng.int(3, 7);
  return {
    id: `gen.dm-set-pp-d2.${idx}`, generated: true, concepts: ["power-sets-and-products"], difficulty: 2, context: "abstract",
    prompt: `Let $|A| = ${m}$ and $|B| = ${n}$. The Cartesian product $A \\times B$ is the set of ordered pairs $(a, b)$ with $a \\in A$, $b \\in B$.`,
    steps: [
      { instruction: "How many ordered pairs are in $A \\times B$? (Whole number.)", answer: `${m * n}`, accept: [], hint: `${m} choices for the first slot times ${n} for the second.` },
      { instruction: `Fix one particular $a_0 \\in A$. How many pairs in $A \\times B$ have $a_0$ as their first coordinate?`, answer: `${n}`, accept: [], hint: "The second coordinate still ranges over all of $B$." },
      { instruction: `Is $|B \\times A|$ the same NUMBER as $|A \\times B|$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `$${n} \\cdot ${m} = ${m} \\cdot ${n}$ — though the SETS differ, since pairs are ordered.` },
    ],
    finalAnswer: { value: `${m * n}`, unit: "pairs" },
    solutionNarrative: `$|A \\times B| = ${m} \\cdot ${n} = ${m * n}$ — the product rule in set clothing. Each fixed first coordinate contributes a full row of ${n} pairs. $B \\times A$ has the same size but different elements: $(a, b) \\ne (b, a)$.`,
  };
};
fill["dm-set-pp-d3"] = (rng, idx) => {
  const n = rng.int(4, 7);
  return {
    id: `gen.dm-set-pp-d3.${idx}`, generated: true, concepts: ["power-sets-and-products"], difficulty: 3, context: "applied",
    prompt: `A service has ${n} independent feature flags; a *configuration* is a choice of ON/OFF for each flag — i.e. a subset of the flag set (the flags that are ON).`,
    steps: [
      { instruction: `How many distinct configurations exist? (Whole number.)`, answer: `${2 ** n}`, accept: [], hint: `Configurations = subsets of a ${n}-set = $2^{${n}}$.` },
      { instruction: "How many configurations have at least one flag ON?", answer: `${2 ** n - 1}`, accept: [], hint: "All of them except the all-OFF configuration." },
      { instruction: `The flag \`beta-ui\` is one of the ${n}. How many configurations have \`beta-ui\` ON?`, answer: `${2 ** (n - 1)}`, accept: [], hint: `Fix that flag ON; the other ${n - 1} flags still choose freely: $2^{${n - 1}}$.` },
      { instruction: "QA wants to test every configuration, at 1 minute each. Adding one MORE flag multiplies the testing time by what factor?", answer: "2", accept: [], hint: "Same doubling as truth-table rows." },
    ],
    finalAnswer: { value: `${2 ** (n - 1)}`, unit: "configurations" },
    solutionNarrative: `Configurations are subsets: $2^{${n}} = ${2 ** n}$ total, ${2 ** n - 1} excluding all-OFF, and fixing one flag ON leaves $2^{${n - 1}} = ${2 ** (n - 1)}$ free choices for the rest. Each new flag doubles the space — the practical reason full-matrix flag testing dies fast.`,
  };
};

// ===========================================================================
// TOPIC 3: discrete-math.counting-principles
// ===========================================================================

// --- product-and-sum-rules ---
fill["dm-cnt-prod-d1"] = (rng, idx) => {
  const s = rng.int(3, 6), p = rng.int(2, 5), h = rng.int(2, 4);
  return {
    id: `gen.dm-cnt-prod-d1.${idx}`, generated: true, concepts: ["product-and-sum-rules"], difficulty: 1, context: "applied",
    prompt: `You own ${s} shirts, ${p} pairs of pants, and ${h} pairs of shoes. An outfit is one of each.`,
    steps: [
      { instruction: "How many shirt-and-pants combinations are there? (Whole number.)", answer: `${s * p}`, accept: [], hint: `Each of the ${s} shirts pairs with each of the ${p} pants: multiply.` },
      { instruction: "Now add the shoes: how many complete outfits?", answer: `${s * p * h}`, accept: [], hint: `Multiply your previous answer by ${h}.` },
    ],
    finalAnswer: { value: `${s * p * h}`, unit: "outfits" },
    solutionNarrative: `Independent choices multiply: $${s} \\cdot ${p} \\cdot ${h} = ${s * p * h}$ outfits. That is the product rule — each stage multiplies the count, regardless of what the earlier stages picked.`,
  };
};
fill["dm-cnt-prod-d2"] = (rng, idx) => {
  const L = rng.int(3, 5);
  let noRep = 1;
  for (let i = 0; i < L; i++) noRep *= 10 - i;
  return {
    id: `gen.dm-cnt-prod-d2.${idx}`, generated: true, concepts: ["product-and-sum-rules"], difficulty: 2, context: "applied",
    prompt: `A PIN code has ${L} digits, each from 0–9.`,
    steps: [
      { instruction: `How many ${L}-digit PINs exist if digits MAY repeat? (Whole number.)`, answer: `${10 ** L}`, accept: [], hint: `10 choices per position: $10^{${L}}$.` },
      { instruction: "How many exist if all digits must be DIFFERENT?", answer: `${noRep}`, accept: [], hint: `The choices shrink: $${Array.from({ length: L }, (_, i) => 10 - i).join(" \\cdot ")}$.` },
      { instruction: "Which constraint gives an attacker fewer PINs to try — 'repeats allowed' or 'all different'? (Type one of the two phrases.)", answer: "all different", accept: [], hint: "Compare your two counts." },
    ],
    finalAnswer: { value: `${noRep}`, unit: "PINs" },
    solutionNarrative: `With repeats each slot has 10 options: $10^{${L}} = ${10 ** L}$. Forbidding repeats shrinks each successive slot: $${Array.from({ length: L }, (_, i) => 10 - i).join(" \\cdot ")} = ${noRep}$. Constraints always cut the space — a 'no repeated digits' policy actually HELPS a brute-force attacker.`,
  };
};
fill["dm-cnt-prod-d3"] = (rng, idx) => {
  const a = rng.int(3, 6), c = rng.int(2, 4), b = rng.int(2, 5), d = rng.int(2, 4);
  return {
    id: `gen.dm-cnt-prod-d3.${idx}`, generated: true, concepts: ["product-and-sum-rules"], difficulty: 3, context: "applied",
    prompt: `A laptop configurator offers brand X in ${a} models, each in ${c} colors — or brand Y in ${b} models, each in ${d} colors. You buy exactly one laptop.`,
    steps: [
      { instruction: "How many distinct brand-X laptops are there? (Whole number.)", answer: `${a * c}`, accept: [], hint: `Model and color are independent choices: $${a} \\cdot ${c}$.` },
      { instruction: "How many distinct brand-Y laptops?", answer: `${b * d}`, accept: [], hint: `$${b} \\cdot ${d}$.` },
      { instruction: "The two brand catalogs don't overlap. How many laptops can you choose from in total?", answer: `${a * c + b * d}`, accept: [], hint: "Mutually exclusive alternatives ADD (sum rule); stages within one alternative MULTIPLY (product rule)." },
    ],
    finalAnswer: { value: `${a * c + b * d}`, unit: "laptops" },
    solutionNarrative: `Within a brand the choices multiply ($${a} \\cdot ${c} = ${a * c}$ and $${b} \\cdot ${d} = ${b * d}$); across mutually exclusive brands they add: $${a * c} + ${b * d} = ${a * c + b * d}$. Knowing when to multiply and when to add IS counting — 'and' multiplies, 'or' (exclusive) adds.`,
  };
};

// --- permutations ---
fill["dm-cnt-perm-d1"] = (rng, idx) => {
  const n = rng.int(4, 6);
  return {
    id: `gen.dm-cnt-perm-d1.${idx}`, generated: true, concepts: ["permutations"], difficulty: 1, context: "applied",
    prompt: `You arrange ${n} distinct books on a shelf. Order matters — this is a permutation count.`,
    steps: [
      { instruction: "How many choices for the FIRST (leftmost) position? (Whole number.)", answer: `${n}`, accept: [], hint: "Any of the books can go first." },
      { instruction: "After placing it, how many choices remain for the second position?", answer: `${n - 1}`, accept: [], hint: "One book is used up." },
      { instruction: `Continue the pattern down to 1. How many arrangements in total — what is $${n}!$?`, answer: `${fact(n)}`, accept: [], hint: `$${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")}$.` },
    ],
    finalAnswer: { value: `${fact(n)}`, unit: "arrangements" },
    solutionNarrative: `Each position has one fewer option than the last: $${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")} = ${fact(n)}$. The shrinking-choices product is the signature of permutations.`,
  };
};
fill["dm-cnt-perm-d2"] = (rng, idx) => {
  const n = rng.int(6, 10);
  const ans = n * (n - 1) * (n - 2);
  return {
    id: `gen.dm-cnt-perm-d2.${idx}`, generated: true, concepts: ["permutations"], difficulty: 2, context: "applied",
    prompt: `${n} runners compete; gold, silver, and bronze are distinct prizes. Count the possible podiums — this is $P(${n}, 3)$, an arrangement of 3 out of ${n}.`,
    steps: [
      { instruction: "How many candidates for gold? (Whole number.)", answer: `${n}`, accept: [], hint: "Anyone can win." },
      { instruction: "Gold decided — how many ways to then fill silver AND bronze? (One number: the product of the two remaining choices.)", answer: `${(n - 1) * (n - 2)}`, accept: [], hint: `$${n - 1} \\cdot ${n - 2}$.` },
      { instruction: `So how many podiums in total — $P(${n}, 3) = ${n} \\cdot ${n - 1} \\cdot ${n - 2}$?`, answer: `${ans}`, accept: [], hint: "Multiply your two answers." },
    ],
    finalAnswer: { value: `${ans}`, unit: "podiums" },
    solutionNarrative: `$P(${n}, 3) = ${n} \\cdot ${n - 1} \\cdot ${n - 2} = ${ans}$ — a truncated factorial: $\\frac{${n}!}{(${n} - 3)!}$. Because the medals differ, the SAME three runners in a different order is a different podium; that is what separates permutations from combinations.`,
  };
};
fill["dm-cnt-perm-d3"] = (rng, idx) => {
  const n = rng.int(5, 7);
  return {
    id: `gen.dm-cnt-perm-d3.${idx}`, generated: true, concepts: ["permutations"], difficulty: 3, context: "applied",
    prompt: `${n} people line up for a photo, but the photographer insists that Ana stands at one of the two ENDS of the row.`,
    steps: [
      { instruction: `Ignore the constraint first: how many ways can ${n} people line up — what is $${n}!$? (Whole number.)`, answer: `${fact(n)}`, accept: [], hint: `$${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")}$.` },
      { instruction: "Now the constraint. How many positions may Ana take?", answer: "2", accept: [], hint: "Leftmost or rightmost." },
      { instruction: `With Ana placed, how many ways to arrange the other ${n - 1} people — what is $${n - 1}!$?`, answer: `${fact(n - 1)}`, accept: [], hint: `$${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" \\cdot ")}$.` },
      { instruction: "So how many valid lineups satisfy the photographer?", answer: `${2 * fact(n - 1)}`, accept: [], hint: `$2 \\cdot ${fact(n - 1)}$.` },
    ],
    finalAnswer: { value: `${2 * fact(n - 1)}`, unit: "lineups" },
    solutionNarrative: `Place the constrained person first: 2 end positions, then $${n - 1}!$ = ${fact(n - 1)} arrangements of the rest, giving $2 \\cdot ${fact(n - 1)} = ${2 * fact(n - 1)}$ — that is $\\frac{2}{${n}}$ of the unconstrained $${n}! = ${fact(n)}$, exactly the probability that a random lineup puts Ana at an end. Handle constraints FIRST, then count the free choices.`,
  };
};

// --- combinations ---
fill["dm-cnt-comb-d1"] = (rng, idx) => {
  const n = rng.int(5, 9);
  return {
    id: `gen.dm-cnt-comb-d1.${idx}`, generated: true, concepts: ["combinations"], difficulty: 1, context: "applied",
    prompt: `${n} people at a meetup all shake hands with each other exactly once. A handshake is an UNORDERED pair — this is $\\binom{${n}}{2}$.`,
    steps: [
      { instruction: `Count ordered pairs first: each of the ${n} people shakes ${n - 1} hands. What is $${n} \\cdot ${n - 1}$? (Whole number.)`, answer: `${n * (n - 1)}`, accept: [], hint: "Straight multiplication." },
      { instruction: "Each handshake got counted twice (once per participant). How many handshakes really happen?", answer: `${(n * (n - 1)) / 2}`, accept: [], hint: "Halve it." },
    ],
    finalAnswer: { value: `${(n * (n - 1)) / 2}`, unit: "handshakes" },
    solutionNarrative: `$\\binom{${n}}{2} = \\frac{${n} \\cdot ${n - 1}}{2} = ${(n * (n - 1)) / 2}$. The divide-by-2 kills the double count from ordering — Ana-shakes-Ben and Ben-shakes-Ana are the same handshake. Count ordered, then divide by the orderings: that is every combination formula in one sentence.`,
  };
};
fill["dm-cnt-comb-d2"] = (rng, idx) => {
  const n = rng.int(7, 10);
  const num = n * (n - 1) * (n - 2);
  return {
    id: `gen.dm-cnt-comb-d2.${idx}`, generated: true, concepts: ["combinations"], difficulty: 2, context: "applied",
    prompt: `A team of ${n} engineers must send 3 (interchangeable) people to on-call duty. Order does not matter — count $\\binom{${n}}{3}$.`,
    steps: [
      { instruction: `Ordered selections first: $P(${n}, 3) = ${n} \\cdot ${n - 1} \\cdot ${n - 2}$. (Whole number.)`, answer: `${num}`, accept: [], hint: "Three shrinking choices, multiplied." },
      { instruction: "How many orderings does one particular trio have — what is $3!$?", answer: "6", accept: [], hint: "$3 \\cdot 2 \\cdot 1$." },
      { instruction: `So how many distinct trios — $\\binom{${n}}{3} = \\frac{${num}}{6}$?`, answer: `${num / 6}`, accept: [], hint: "Divide your first answer by your second." },
    ],
    finalAnswer: { value: `${num / 6}`, unit: "trios" },
    solutionNarrative: `$\\binom{${n}}{3} = \\frac{${n} \\cdot ${n - 1} \\cdot ${n - 2}}{3!} = \\frac{${num}}{6} = ${num / 6}$. Every unordered trio was counted $3! = 6$ times among the ordered selections; dividing by the redundancy converts permutations into combinations.`,
  };
};
fill["dm-cnt-comb-d3"] = (rng, idx) => {
  const f = rng.int(4, 6), b = rng.int(4, 6);
  const cf = comb(f, 2), cb = comb(b, 2);
  return {
    id: `gen.dm-cnt-comb-d3.${idx}`, generated: true, concepts: ["combinations"], difficulty: 3, context: "applied",
    prompt: `A review rotation needs 2 frontend reviewers chosen from ${f} frontend engineers AND 2 backend reviewers chosen from ${b} backend engineers.`,
    steps: [
      { instruction: `How many ways to pick the frontend pair — $\\binom{${f}}{2}$? (Whole number.)`, answer: `${cf}`, accept: [], hint: `$\\frac{${f} \\cdot ${f - 1}}{2}$.` },
      { instruction: `How many ways to pick the backend pair — $\\binom{${b}}{2}$?`, answer: `${cb}`, accept: [], hint: `$\\frac{${b} \\cdot ${b - 1}}{2}$.` },
      { instruction: "The two picks are independent. How many complete review panels?", answer: `${cf * cb}`, accept: [], hint: "Product rule on top of the two combination counts." },
    ],
    finalAnswer: { value: `${cf * cb}`, unit: "panels" },
    solutionNarrative: `$\\binom{${f}}{2} = ${cf}$ frontend pairs and $\\binom{${b}}{2} = ${cb}$ backend pairs, independent, so $${cf} \\cdot ${cb} = ${cf * cb}$ panels. Real counting problems layer the rules: combinations inside each pool, the product rule across pools.`,
  };
};

// --- pigeonhole-principle ---
fill["dm-cnt-pig-d1"] = (rng, idx) => {
  const c = rng.int(3, 8);
  return {
    id: `gen.dm-cnt-pig-d1.${idx}`, generated: true, concepts: ["pigeonhole-principle"], difficulty: 1, context: "applied",
    prompt: `A drawer holds loose socks in ${c} colors, thoroughly mixed. You pull socks out in the dark and want a GUARANTEED matching pair.`,
    steps: [
      { instruction: `What is the largest number of socks you could pull WITHOUT getting a pair? (Whole number.)`, answer: `${c}`, accept: [], hint: `Worst case: one sock of each of the ${c} colors.` },
      { instruction: "So how many pulls GUARANTEE a matching pair?", answer: `${c + 1}`, accept: [], hint: "One more than the worst case — the next sock must repeat some color." },
    ],
    finalAnswer: { value: `${c + 1}`, unit: "socks" },
    solutionNarrative: `With ${c} colors as pigeonholes, ${c} socks might all differ, but the $${c + 1}$-th sock must land in an occupied hole: ${c + 1} pulls guarantee a pair. Pigeonhole arguments always run this way — construct the worst case, then add one.`,
  };
};
fill["dm-cnt-pig-d2"] = (rng, idx) => {
  const c = rng.int(3, 6), k = rng.int(3, 5);
  return {
    id: `gen.dm-cnt-pig-d2.${idx}`, generated: true, concepts: ["pigeonhole-principle"], difficulty: 2, context: "applied",
    prompt: `A bag holds marbles in ${c} colors. You draw blindly and want ${k} marbles of the SAME color, guaranteed.`,
    steps: [
      { instruction: `Worst case first: how many marbles can you draw with NO color reaching ${k}? (Whole number.)`, answer: `${c * (k - 1)}`, accept: [], hint: `Every color stuck at ${k - 1}: that's $${c} \\cdot ${k - 1}$.` },
      { instruction: `So how many draws guarantee ${k} of one color?`, answer: `${c * (k - 1) + 1}`, accept: [], hint: "Worst case plus one." },
    ],
    finalAnswer: { value: `${c * (k - 1) + 1}`, unit: "marbles" },
    solutionNarrative: `The adversary keeps every color at ${k - 1}: $${c} \\cdot ${k - 1} = ${c * (k - 1)}$ draws with no color hitting ${k}. Draw number $${c * (k - 1) + 1}$ pushes some color to ${k}. The general pattern: $c(k-1) + 1$ draws force $k$ in one of $c$ holes.`,
  };
};
fill["dm-cnt-pig-d3"] = (rng, idx) => {
  const N = rng.int(30, 90);
  const guaranteed = Math.ceil(N / 12);
  const k = rng.int(3, 5);
  return {
    id: `gen.dm-cnt-pig-d3.${idx}`, generated: true, concepts: ["pigeonhole-principle"], difficulty: 3, context: "applied",
    prompt: `${N} employees work at a company; birthdays fall in 12 months (the pigeonholes).`,
    steps: [
      { instruction: `Compute $${N} / 12$ rounded UP — the generalized pigeonhole bound $\\lceil N/12 \\rceil$. (Whole number.)`, answer: `${guaranteed}`, accept: [], hint: `$${N} / 12 \\approx ${(N / 12).toFixed(2)}$, then round up.` },
      { instruction: `So SOME month is guaranteed to contain at least how many birthdays?`, answer: `${guaranteed}`, accept: [], hint: `If every month had fewer, the total would fall short of ${N}.` },
      { instruction: `Separate question: how many employees would you need to GUARANTEE ${k} birthdays in some month?`, answer: `${12 * (k - 1) + 1}`, accept: [], hint: `Worst case fills every month to ${k - 1}: $12 \\cdot ${k - 1}$, then add 1.` },
    ],
    finalAnswer: { value: `${guaranteed}`, unit: "birthdays" },
    solutionNarrative: `If every month held at most ${guaranteed - 1} birthdays, the total would be at most $12 \\cdot ${guaranteed - 1} = ${12 * (guaranteed - 1)} < ${N}$ — contradiction, so some month has at least $\\lceil ${N}/12 \\rceil = ${guaranteed}$. And forcing ${k} in one month needs $12 \\cdot ${k - 1} + 1 = ${12 * (k - 1) + 1}$ people: the worst case levels every month at ${k - 1} first.`,
  };
};

// ===========================================================================
// TOPIC 4: discrete-math.graph-theory-basics
// Every on-figure generator emits a "plot" field using plot.js's "graph" spec,
// keeping the graph-reading format of the seed problems.
// ===========================================================================

const pickIdx = (rng, n, k) => { const s = new Set(); while (s.size < k) s.add(rng.int(0, n - 1)); return [...s].sort((a, b) => a - b); };
const edgeName = ([a, b]) => `${a}–${b}`;

// --- vertices-edges-degree ---
fill["dm-gr-deg-d1"] = (rng, idx) => {
  const pos = { A: [0, 2], B: [2, 3], C: [2, 1], D: [4, 2], E: [6, 2] };
  const ids = Object.keys(pos);
  const pool = [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "D"], ["D", "E"], ["B", "E"], ["C", "E"]];
  const edges = pickIdx(rng, pool.length, 5).map((i) => pool[i]);
  const d = degreeMap(ids, edges);
  const v = ids.reduce((best, u) => (d[u] > d[best] ? u : best), ids[0]); // a busiest vertex
  return {
    id: `gen.dm-gr-deg-d1.${idx}`, generated: true, concepts: ["vertices-edges-degree"], difficulty: 1, context: "abstract",
    prompt: `Read the graph in the figure: vertices $A$ through $E$ with the edges drawn.`,
    plot: graphPlot(pos, edges, "A graph on 5 vertices"),
    steps: [
      { instruction: "How many edges does the graph have? (Give a whole number.)", answer: "5", accept: [], hint: `Count the line segments: ${edges.map(edgeName).join(", ")}.` },
      { instruction: `What is the degree of vertex $${v}$ — how many edges touch it?`, answer: `${d[v]}`, accept: [], hint: `Follow each segment out of ${v} and count.` },
      { instruction: "By the handshake lemma the degrees sum to $2|E|$. What is the sum of all five degrees?", answer: "10", accept: [], hint: "Twice the edge count." },
    ],
    finalAnswer: { value: "10", unit: "" },
    solutionNarrative: `The 5 edges are ${edges.map(edgeName).join(", ")}. Degrees: ${ids.map((u) => `$\\deg(${u}) = ${d[u]}$`).join(", ")}, summing to $10 = 2 \\cdot 5$ — the handshake lemma checks out.`,
  };
};
fill["dm-gr-deg-d2"] = (rng, idx) => {
  const pos = { A: [0, 3], B: [0, 1], C: [1.5, 2], D: [3, 2], E: [4.5, 3], F: [4.5, 1] };
  const ids = Object.keys(pos);
  const pool = [["A", "B"], ["A", "C"], ["B", "C"], ["C", "D"], ["D", "E"], ["D", "F"], ["E", "F"], ["A", "D"], ["C", "F"], ["B", "D"]];
  const edges = pickIdx(rng, pool.length, 7).map((i) => pool[i]);
  const d = degreeMap(ids, edges);
  const odd = oddCount(ids, edges);
  return {
    id: `gen.dm-gr-deg-d2.${idx}`, generated: true, concepts: ["vertices-edges-degree"], difficulty: 2, context: "abstract",
    prompt: `The figure shows a graph on 6 vertices. Use the handshake lemma to audit it.`,
    plot: graphPlot(pos, edges, "A graph on 6 vertices"),
    steps: [
      { instruction: "Count the edges in the figure. (Whole number.)", answer: "7", accept: [], hint: "Trace each segment once, systematically left to right." },
      { instruction: "Without adding the degrees one by one, what must the degree sum be?", answer: "14", accept: [], hint: "Handshake lemma: exactly $2|E|$." },
      { instruction: "How many vertices have ODD degree? (Whole number.)", answer: `${odd}`, accept: [], hint: `Degrees are ${ids.map((u) => `${u}:${d[u]}`).join(", ")}.` },
    ],
    finalAnswer: { value: `${odd}`, unit: "odd vertices" },
    solutionNarrative: `$|E| = 7$, so the degree sum is $2 \\cdot 7 = 14$ before counting anything vertex by vertex. Checking: ${ids.map((u) => `$\\deg(${u}) = ${d[u]}$`).join(", ")} — sum 14, with ${odd} odd-degree vertices (${odd === 0 ? "none" : ids.filter((u) => d[u] % 2 === 1).join(", ")}). The odd count is even, as the handshake lemma demands.`,
  };
};
fill["dm-gr-deg-d3"] = (rng, idx) => {
  const n1 = rng.pick([4, 6]), d1 = rng.int(3, 5), n2 = rng.pick([2, 4]), d2 = rng.int(2, 4);
  const sum = n1 * d1 + n2 * d2;
  const oddClaim = rng.pick([3, 5, 7]);
  return {
    id: `gen.dm-gr-deg-d3.${idx}`, generated: true, concepts: ["vertices-edges-degree"], difficulty: 3, context: "applied",
    prompt: `A data center has ${n1 + n2} servers. ${n1} of them are core servers, each cabled to exactly ${d1} others; the remaining ${n2} are edge servers, each cabled to exactly ${d2} others. No pair of servers has more than one cable.`,
    steps: [
      { instruction: `Compute the total degree sum: $${n1} \\cdot ${d1} + ${n2} \\cdot ${d2}$.`, answer: `${sum}`, accept: [], hint: `$${n1 * d1} + ${n2 * d2}$.` },
      { instruction: "The handshake lemma says cables $= \\frac{\\text{degree sum}}{2}$. How many cables are there?", answer: `${sum / 2}`, accept: [], hint: `Halve ${sum}.` },
      { instruction: `A colleague claims a different rack has exactly ${oddClaim} machines of odd degree and the rest even. Is that possible for any graph? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: "The degree sum must be even, so odd-degree vertices come in pairs." },
    ],
    finalAnswer: { value: `${sum / 2}`, unit: "cables" },
    solutionNarrative: `Degree sum $= ${n1} \\cdot ${d1} + ${n2} \\cdot ${d2} = ${sum}$, so there are $${sum} / 2 = ${sum / 2}$ cables. The colleague's claim is impossible: since $\\sum \\deg(v) = 2|E|$ is even, the number of odd-degree vertices in any graph is even — never ${oddClaim}.`,
  };
};

// --- paths-cycles-connectivity ---
fill["dm-gr-path-d1"] = (rng, idx) => {
  const pos = { A: [1, 3], B: [0, 1], C: [2, 1], D: [4, 3], E: [5, 1] };
  const ids = Object.keys(pos);
  const variants = [
    { edges: [["A", "B"], ["B", "C"], ["A", "C"], ["D", "E"]], cap: "A triangle plus a separate pair" },
    { edges: [["A", "B"], ["B", "C"], ["D", "E"]], cap: "A path of three vertices plus a separate pair" },
    { edges: [["A", "B"], ["C", "D"], ["C", "E"], ["D", "E"]], cap: "A pair plus a triangle" },
    { edges: [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"]], cap: "A path through all five vertices" },
  ];
  const v = rng.pick(variants);
  const comps = componentCount(ids, v.edges);
  return {
    id: `gen.dm-gr-path-d1.${idx}`, generated: true, concepts: ["paths-cycles-connectivity"], difficulty: 1, context: "abstract",
    prompt: `Look at the graph in the figure: vertices $A$ through $E$.`,
    plot: graphPlot(pos, v.edges, "A graph on 5 vertices"),
    steps: [
      { instruction: "How many edges does the graph have? (Whole number.)", answer: `${v.edges.length}`, accept: [], hint: "Count the drawn segments." },
      { instruction: "How many connected components does it have — separate islands with no edges between them?", answer: `${comps}`, accept: [], hint: "Group the vertices you can walk between; each group is one component." },
      { instruction: "Is the graph connected? Type 'yes' or 'no'.", answer: yn(comps === 1), accept: [], hint: "Connected means ONE component — a path between every pair." },
    ],
    finalAnswer: { value: `${comps}`, unit: comps === 1 ? "component" : "components" },
    solutionNarrative: comps === 1
      ? `Every vertex reaches every other, so the graph is a single connected component — connected.`
      : `The graph splits into ${comps} connected components with no edge between them, so it is not connected: no walk of any length crosses between islands.`,
  };
};
fill["dm-gr-path-d2"] = (rng, idx) => {
  const pos = { A: [2, 4], B: [4, 3], C: [3.5, 1], D: [0.5, 1], E: [0, 3] };
  const ids = Object.keys(pos);
  const cycle = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"], ["E", "A"]];
  const chords = [["A", "C"], ["B", "D"], ["C", "E"], ["D", "A"], ["E", "B"]];
  const chord = rng.pick(chords);
  const edges = [...cycle, chord];
  // Query a pair that is NOT directly joined (distance >= 2 after adding the chord).
  const pairs = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    if (bfsDist(ids, edges, ids[i], ids[j]) >= 2) pairs.push([ids[i], ids[j]]);
  }
  const [s, t] = rng.pick(pairs);
  const dist = bfsDist(ids, edges, s, t);
  return {
    id: `gen.dm-gr-path-d2.${idx}`, generated: true, concepts: ["paths-cycles-connectivity"], difficulty: 2, context: "abstract",
    prompt: `The figure shows the 5-cycle $A\\text{–}B\\text{–}C\\text{–}D\\text{–}E\\text{–}A$ with one extra chord $${chord[0]}\\text{–}${chord[1]}$.`,
    plot: graphPlot(pos, edges, `A pentagon with the chord ${edgeName(chord)}`),
    steps: [
      { instruction: `How many edges does the shortest path from $${s}$ to $${t}$ use? (Whole number.)`, answer: `${dist}`, accept: [], hint: "Try routes around the pentagon AND through the chord; take the fewest hops." },
      { instruction: "What is the length (number of edges) of the shortest cycle in this graph?", answer: "3", accept: [], hint: `The chord ${edgeName(chord)} closes a triangle with two cycle edges.` },
      { instruction: "Is the graph connected? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "It contains the full 5-cycle, which already links everything." },
    ],
    finalAnswer: { value: `${dist}`, unit: "" },
    solutionNarrative: `The shortest $${s} \\to ${t}$ route takes ${dist} edges. Any chord of a pentagon joins two vertices that sit 2 apart on the cycle, so it always closes a triangle — a cycle of length 3, beating the original 5-cycle. The graph stays connected: adding edges never disconnects anything.`,
  };
};
fill["dm-gr-path-d3"] = (rng, idx) => {
  const pos = { L: [0, 2], U: [0, 0], C: [2, 1], A: [4, 2], T: [4, 0] };
  const base = [["L", "C"], ["U", "C"], ["C", "A"], ["C", "T"]];
  const extras = [];
  if (rng.int(0, 1) === 1) extras.push(["U", "T"]);
  if (rng.int(0, 1) === 1) extras.push(["L", "A"]);
  const edges = [...base, ...extras];
  const inT = edges.filter(([, b]) => b === "T").length;
  // upstream of T: reverse reachability
  const up = new Set(["T"]);
  const q = ["T"];
  while (q.length) {
    const v = q.shift();
    for (const [a, b] of edges) if (b === v && !up.has(a)) { up.add(a); q.push(a); }
  }
  const nUp = up.size - 1;
  return {
    id: `gen.dm-gr-path-d3.${idx}`, generated: true, concepts: ["paths-cycles-connectivity"], difficulty: 3, context: "applied",
    prompt: `The figure shows a build-system dependency graph: an arrow $X \\to Y$ means package $X$ must be built before package $Y$. The packages are $L$ (lib), $U$ (utils), $C$ (core), $A$ (api), and $T$ (cli tool).`,
    plot: { type: "graph", nodes: Object.keys(pos).map((id) => ({ id, x: pos[id][0], y: pos[id][1] })), edges: edges.map(([a, b]) => ({ from: a, to: b, directed: true })), caption: "Dependency graph: an arrow X to Y means X builds before Y" },
    steps: [
      { instruction: "How many arrows point directly INTO $T$ — its direct dependencies? (Whole number.)", answer: `${inT}`, accept: [], hint: "Follow arrowheads landing on T." },
      { instruction: "Counting all upstream packages (direct and indirect), how many packages must be built before $T$?", answer: `${nUp}`, accept: [], hint: "Direct dependencies first — then whatever THEY need, and so on." },
      { instruction: "A build order exists only if the graph has no directed cycle. Does this graph contain a cycle? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "Try to follow arrows and return to your start — every arrow moves left-to-right." },
    ],
    finalAnswer: { value: `${nUp}`, unit: "packages" },
    solutionNarrative: `$T$ has ${inT} direct ${inT === 1 ? "dependency" : "dependencies"}, but transitively it needs ${nUp}: $C$ pulls in both $L$ and $U$. No directed cycle exists (all arrows point rightward), so a valid build order exists, e.g. $L, U, C, A, T$. This reachability reading is exactly how build tools and git answer 'what does this depend on?'`,
  };
};

// --- euler-paths-and-circuits ---
fill["dm-gr-eul-d1"] = (rng, idx) => {
  const pos = { A: [0, 0], B: [0, 2], C: [2, 2], D: [2, 0] };
  const ids = Object.keys(pos);
  const diag = rng.pick([["A", "C"], ["B", "D"]]);
  const edges = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"], diag];
  const d = degreeMap(ids, edges);
  const v = diag[rng.int(0, 1)];
  return {
    id: `gen.dm-gr-eul-d1.${idx}`, generated: true, concepts: ["euler-paths-and-circuits"], difficulty: 1, context: "abstract",
    prompt: `The figure shows a square $A\\text{–}B\\text{–}C\\text{–}D$ with the diagonal $${diag[0]}\\text{–}${diag[1]}$. Can you trace every edge exactly once without lifting your pen?`,
    plot: graphPlot(pos, edges, "A square with one diagonal"),
    steps: [
      { instruction: `What is the degree of vertex $${v}$? (Whole number.)`, answer: `${d[v]}`, accept: [], hint: `Count the edges at ${v}, including the diagonal.` },
      { instruction: "How many vertices of the graph have ODD degree?", answer: "2", accept: [], hint: "Degrees are 3, 2, 3, 2 — the diagonal's endpoints are the odd ones." },
      { instruction: "The graph is connected. Does it have an Euler path — a route using every edge exactly once? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Euler's theorem: connected with exactly 0 or 2 odd vertices." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `The diagonal's endpoints $${diag[0]}$ and $${diag[1]}$ have degree 3; the other two corners have degree 2. Exactly 2 odd vertices in a connected graph means an Euler path exists — and it must start at one odd vertex and end at the other. No Euler circuit, though: that needs zero odd vertices.`,
  };
};
fill["dm-gr-eul-d2"] = (rng, idx) => {
  const v = rng.pick([
    { degs: [3, 3, 3, 5], verdict: false, tag: "the original Königsberg layout" },
    { degs: [3, 3, 3, 3], verdict: false, tag: "a fully symmetric four-way layout" },
    { degs: [2, 3, 3, 4], verdict: true, tag: "a layout after one bridge was demolished" },
    { degs: [2, 4, 4, 4], verdict: true, tag: "a layout rebuilt for parades" },
    { degs: [3, 3, 4, 4], verdict: true, tag: "a two-island layout" },
  ]);
  const sum = v.degs.reduce((a, b) => a + b, 0);
  const odd = v.degs.filter((x) => x % 2 === 1).length;
  return {
    id: `gen.dm-gr-eul-d2.${idx}`, generated: true, concepts: ["euler-paths-and-circuits"], difficulty: 2, context: "applied",
    prompt: `A river city has four land masses joined by bridges — ${v.tag} — giving a connected graph whose vertices have degrees $${v.degs.join(", ")}$. Settle its bridge-walk puzzle the way Euler did in 1736.`,
    steps: [
      { instruction: `Add up the four degrees: $${v.degs.join(" + ")}$.`, answer: `${sum}`, accept: [], hint: "Straight addition." },
      { instruction: "By the handshake lemma, how many bridges (edges) does that degree sum confirm?", answer: `${sum / 2}`, accept: [], hint: "Edges are half the degree sum." },
      { instruction: "How many of the four land masses have ODD degree?", answer: `${odd}`, accept: [], hint: `Check each of ${v.degs.join(", ")} for oddness.` },
      { instruction: "Can any walk cross every bridge exactly once? Type 'yes' or 'no'.", answer: yn(v.verdict), accept: [], hint: "An Euler path tolerates at most 2 odd vertices (0 or 2)." },
    ],
    finalAnswer: { value: yn(v.verdict), unit: "" },
    solutionNarrative: `Degree sum $${v.degs.join(" + ")} = ${sum} = 2 \\cdot ${sum / 2}$ — consistent with ${sum / 2} bridges. ${odd} land masses have odd degree, and Euler's theorem allows an every-edge-once walk only with 0 or 2 odd vertices: ${v.verdict ? `with ${odd === 0 ? "none" : "exactly 2"} odd, the walk exists${odd === 0 ? " and can even return home (an Euler circuit)" : ", running odd vertex to odd vertex"}.` : `with ${odd} odd vertices the stroll is impossible — the answer Euler delivered without trying a single route.`}`,
  };
};
fill["dm-gr-eul-d3"] = (rng, idx) => {
  const pos = { A: [0, 2], B: [2, 2], C: [4, 2], D: [0, 0], E: [2, 0], F: [4, 0] };
  const ids = Object.keys(pos);
  const variants = [
    [["A", "B"], ["B", "C"], ["A", "D"], ["B", "E"], ["C", "F"], ["D", "E"], ["E", "F"]],
    [["A", "B"], ["B", "C"], ["A", "D"], ["C", "F"], ["D", "E"], ["E", "F"], ["A", "E"]],
    [["A", "B"], ["B", "C"], ["A", "D"], ["B", "E"], ["C", "F"], ["D", "E"], ["E", "F"], ["B", "F"]],
  ];
  const edges = rng.pick(variants);
  const d = degreeMap(ids, edges);
  const oddV = ids.filter((u) => d[u] % 2 === 1); // curated: always exactly two
  const start = oddV[rng.int(0, 1)];
  const end = oddV.find((u) => u !== start);
  return {
    id: `gen.dm-gr-eul-d3.${idx}`, generated: true, concepts: ["euler-paths-and-circuits"], difficulty: 3, context: "applied",
    prompt: `A snowplow must clear every street of the neighborhood in the figure exactly once (intersections $A$–$F$, streets as edges). Plan the route with Euler's theorem.`,
    plot: graphPlot(pos, edges, `Street network: 6 intersections, ${edges.length} streets`),
    steps: [
      { instruction: "How many intersections have an ODD number of streets meeting there? (Whole number.)", answer: "2", accept: [], hint: `Degrees: ${ids.map((u) => `${u}:${d[u]}`).join(", ")}.` },
      { instruction: "The network is connected. Can the plow drive every street exactly once? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Exactly 2 odd intersections is one of Euler's allowed counts." },
      { instruction: `If the plow starts at intersection $${start}$, at which intersection must the route end? Answer with the single letter.`, answer: end.toLowerCase(), accept: [], hint: "An Euler path runs between the two odd-degree vertices." },
      { instruction: "Could the plow instead run a route that ends back where it STARTED (an Euler circuit)? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "A circuit needs ZERO odd intersections." },
    ],
    finalAnswer: { value: end.toLowerCase(), unit: "" },
    solutionNarrative: `Degrees: ${ids.map((u) => `$${u}$:${d[u]}`).join(", ")} (sum $${ids.reduce((s, u) => s + d[u], 0)} = 2 \\cdot ${edges.length}$, checking out). Exactly two odd intersections, $${oddV[0]}$ and $${oddV[1]}$, so an Euler route exists and must run from one to the other: starting at $${start}$ it must end at $${end}$. No circuit is possible — that would need zero odd vertices. This is the route-inspection problem every plow and mail truck solves.`,
  };
};

// --- trees ---
fill["dm-gr-tree-d1"] = (rng, idx) => {
  const pos = { R: [3, 3], A: [1.5, 2], B: [4.5, 2], C: [0.5, 1], D: [2, 1], E: [3.5, 1], F: [5.5, 1] };
  const ids = Object.keys(pos);
  const edges = [["R", "A"], ["R", "B"]];
  for (const leaf of ["C", "D", "E", "F"]) edges.push([rng.pick(["A", "B"]), leaf]);
  const d = degreeMap(ids, edges);
  const leaves = ids.filter((u) => d[u] === 1);
  return {
    id: `gen.dm-gr-tree-d1.${idx}`, generated: true, concepts: ["trees"], difficulty: 1, context: "abstract",
    prompt: `The figure shows a tree rooted at $R$. Read off its anatomy.`,
    plot: graphPlot(pos, edges, "A tree with root R at the top", { R: { color: "success" } }),
    steps: [
      { instruction: "How many vertices does the tree have? (Whole number.)", answer: "7", accept: [], hint: "Count every circle, including R." },
      { instruction: "How many edges does it have? For a tree this must be $|V| - 1$.", answer: "6", accept: [], hint: "7 vertices minus 1." },
      { instruction: "How many leaves (degree-1 vertices) does it have?", answer: `${leaves.length}`, accept: [], hint: "A leaf touches exactly one edge — check the bottom row AND the middle row." },
    ],
    finalAnswer: { value: `${leaves.length}`, unit: "leaves" },
    solutionNarrative: `The tree has $|V| = 7$ vertices and $|E| = 6 = 7 - 1$ edges, exactly the tree budget. The leaves are ${leaves.map((u) => `$${u}$`).join(", ")} (each degree 1) — ${leaves.length} of them. ${leaves.includes("A") || leaves.includes("B") ? "Note a middle-row vertex with no children is a leaf too, even though it sits above the bottom row." : "Every bottom-row vertex is a leaf, while both middle vertices have children."}`,
  };
};
fill["dm-gr-tree-d2"] = (rng, idx) => {
  const pos = { R: [2.5, 3], A: [1, 2], B: [4, 2], C: [0.5, 1], D: [2, 1], E: [3.5, 1] };
  const ids = Object.keys(pos);
  const treeEdges = [["R", "A"], ["R", "B"]];
  const parents = {};
  for (const leaf of ["C", "D", "E"]) { const p = rng.pick(["A", "B"]); parents[leaf] = p; treeEdges.push([p, leaf]); }
  const isTree = rng.int(0, 1) === 1;
  let edges = treeEdges, cycLen = 0, extra = null;
  if (!isTree) {
    extra = rng.pick([["A", "B"], ["C", "D"], ["C", "E"], ["D", "E"]]);
    cycLen = bfsDist(ids, treeEdges, extra[0], extra[1]) + 1;
    edges = [...treeEdges, extra];
  }
  const steps = [
    { instruction: "How many edges does the graph have? (Whole number.)", answer: `${edges.length}`, accept: [], hint: "Count the drawn segments." },
    { instruction: "A tree on 6 vertices must have exactly how many edges?", answer: "5", accept: [], hint: "$|E| = |V| - 1$." },
    { instruction: "So: is this graph a tree? Type 'yes' or 'no'.", answer: yn(isTree), accept: [], hint: isTree ? "Right on budget, connected, and no cycle in sight." : "One edge over budget means a cycle is hiding somewhere." },
  ];
  if (!isTree) steps.push({ instruction: "What is the length (number of edges) of the cycle it contains?", answer: `${cycLen}`, accept: [], hint: `Start at ${extra[0]}, walk the tree to ${extra[1]}, then close the loop with the edge ${edgeName(extra)}.` });
  return {
    id: `gen.dm-gr-tree-d2.${idx}`, generated: true, concepts: ["trees"], difficulty: 2, context: "abstract",
    prompt: `Is the graph in the figure a tree? Convict or acquit it with edge counting${isTree ? "" : ", then find the witness"}.`,
    plot: graphPlot(pos, edges, "A connected graph on 6 vertices"),
    steps,
    finalAnswer: { value: yn(isTree), unit: "" },
    solutionNarrative: isTree
      ? `Connected, 6 vertices, and exactly $6 - 1 = 5$ edges — the precise tree budget, and indeed no cycle exists. Removing any edge would disconnect it; adding any edge would create a cycle. Verdict: tree.`
      : `The graph is connected with 6 vertices but ${edges.length} edges — one more than the tree budget of $6 - 1 = 5$ — so it cannot be a tree. The witness is the cycle through ${edgeName(extra)}, of length ${cycLen}. Delete any one cycle edge and the rest is a spanning tree.`,
  };
};
fill["dm-gr-tree-d3"] = (rng, idx) => {
  const n = rng.int(5, 8);
  const m = n - 1 + rng.int(2, 4);
  return {
    id: `gen.dm-gr-tree-d3.${idx}`, generated: true, concepts: ["trees"], difficulty: 3, context: "applied",
    prompt: `A company's network connects ${n} offices with ${m} fiber links. Leadership wants to cut costs down to a spanning tree — every office still reachable, zero redundant links.`,
    steps: [
      { instruction: `A spanning tree of a ${n}-vertex network keeps how many links? (Whole number.)`, answer: `${n - 1}`, accept: [], hint: "Trees always have $|V| - 1$ edges." },
      { instruction: `How many of the ${m} links can be cut?`, answer: `${m - (n - 1)}`, accept: [], hint: `$${m} - ${n - 1}$.` },
      { instruction: "After the cuts, exactly how many distinct paths connect any given pair of offices?", answer: "1", accept: [], hint: "That's the defining property of a tree: a second path would close a cycle." },
      { instruction: "If ONE link of the resulting tree then fails, does the network stay connected? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "A tree has no spare edges — every link is a bridge." },
    ],
    finalAnswer: { value: `${m - (n - 1)}`, unit: "links" },
    solutionNarrative: `Any spanning tree on ${n} offices has exactly $${n} - 1 = ${n - 1}$ links, so $${m} - ${n - 1} = ${m - (n - 1)}$ links are redundant and can be cut. The result has exactly one path per office pair — cheap, but fragile: every remaining link is a single point of failure, which is why real designs keep some redundancy and let the spanning-tree protocol disable it in software.`,
  };
};

// ===========================================================================
// TOPIC 5: discrete-math.recursion-and-induction
// ===========================================================================

// --- evaluating-recurrences ---
fill["dm-rec-unroll-d1"] = (rng, idx) => {
  const c = rng.int(1, 5), d = rng.int(2, 6);
  const a2 = c + d, a3 = a2 + d, a4 = a3 + d;
  return {
    id: `gen.dm-rec-unroll-d1.${idx}`, generated: true, concepts: ["evaluating-recurrences"], difficulty: 1, context: "abstract",
    prompt: `A sequence is defined by $a(1) = ${c}$ and $a(n) = a(n-1) + ${d}$ for $n \\ge 2$. Unroll it one term at a time.`,
    steps: [
      { instruction: `Compute $a(2) = a(1) + ${d}$. (Give an integer.)`, answer: `${a2}`, accept: [], hint: `$${c} + ${d}$.` },
      { instruction: "Compute $a(3)$.", answer: `${a3}`, accept: [], hint: `$${a2} + ${d}$.` },
      { instruction: "Compute $a(4)$.", answer: `${a4}`, accept: [], hint: `$${a3} + ${d}$.` },
    ],
    finalAnswer: { value: `${a4}`, unit: "" },
    solutionNarrative: `Each term adds ${d} to the previous: $${c}, ${a2}, ${a3}, ${a4}$. A recurrence is a ladder — to know $a(4)$ you climb from the base case, one rung at a time.`,
  };
};
fill["dm-rec-unroll-d2"] = (rng, idx) => {
  const m = rng.pick([2, 3]), k = rng.pick([1, 2]), a1 = rng.int(1, 4);
  const a2 = m * a1 + k, a3 = m * a2 + k, a4 = m * a3 + k;
  return {
    id: `gen.dm-rec-unroll-d2.${idx}`, generated: true, concepts: ["evaluating-recurrences"], difficulty: 2, context: "abstract",
    prompt: `A sequence is defined by $a(1) = ${a1}$ and $a(n) = ${m}\\,a(n-1) + ${k}$. Unroll it.`,
    steps: [
      { instruction: `Compute $a(2) = ${m} \\cdot a(1) + ${k}$. (Give an integer.)`, answer: `${a2}`, accept: [], hint: `$${m} \\cdot ${a1} + ${k}$.` },
      { instruction: "Compute $a(3)$.", answer: `${a3}`, accept: [], hint: `$${m} \\cdot ${a2} + ${k}$.` },
      { instruction: "Compute $a(4)$.", answer: `${a4}`, accept: [], hint: `$${m} \\cdot ${a3} + ${k}$.` },
    ],
    finalAnswer: { value: `${a4}`, unit: "" },
    solutionNarrative: `Multiply by ${m}, add ${k}, repeat: $${a1}, ${a2}, ${a3}, ${a4}$. The multiply step makes this grow geometrically — compare how much faster it climbs than an add-only recurrence.`,
  };
};
fill["dm-rec-unroll-d3"] = (rng, idx) => {
  const f1 = rng.int(1, 4), f2 = rng.int(1, 4);
  const f3 = f1 + f2, f4 = f2 + f3, f5 = f3 + f4, f6 = f4 + f5;
  return {
    id: `gen.dm-rec-unroll-d3.${idx}`, generated: true, concepts: ["evaluating-recurrences"], difficulty: 3, context: "abstract",
    prompt: `A Fibonacci-style sequence uses TWO previous terms: $f(1) = ${f1}$, $f(2) = ${f2}$, and $f(n) = f(n-1) + f(n-2)$ for $n \\ge 3$.`,
    steps: [
      { instruction: "Compute $f(3)$. (Give an integer.)", answer: `${f3}`, accept: [], hint: `$${f2} + ${f1}$.` },
      { instruction: "Compute $f(4)$.", answer: `${f4}`, accept: [], hint: `$${f3} + ${f2}$.` },
      { instruction: "Compute $f(5)$ and $f(6)$, as a comma-separated list in order (e.g. 10,16).", answer: `${f5},${f6}`, accept: [], hint: `$${f4} + ${f3}$, then $${f5} + ${f4}$.` },
      { instruction: "To compute $f(6)$ directly from the definition, how many base cases did the recurrence need? (Whole number.)", answer: "2", accept: [], hint: "A two-term recurrence can't start from a single value." },
    ],
    finalAnswer: { value: `${f6}`, unit: "" },
    solutionNarrative: `$${f1}, ${f2}, ${f3}, ${f4}, ${f5}, ${f6}$ — each term is the sum of the two before it. A recurrence that reaches back $k$ terms needs $k$ base cases; forget one and the whole ladder is unanchored (the classic off-by-one in recursive code).`,
  };
};

// --- closed-forms ---
fill["dm-rec-cf-d1"] = (rng, idx) => {
  const a1 = rng.int(2, 8), d = rng.int(2, 6), N = rng.pick([10, 12, 20]);
  const closed = a1 + (N - 1) * d;
  return {
    id: `gen.dm-rec-cf-d1.${idx}`, generated: true, concepts: ["closed-forms"], difficulty: 1, context: "abstract",
    prompt: `The recurrence $a(1) = ${a1}$, $a(n) = a(n-1) + ${d}$ adds ${d} at every step, so it has the closed form $a(n) = ${a1} + ${d}(n - 1)$ — no ladder needed.`,
    steps: [
      { instruction: "Warm up on the ladder: compute $a(2)$ from the recurrence. (Give an integer.)", answer: `${a1 + d}`, accept: [], hint: `$${a1} + ${d}$.` },
      { instruction: `Check the closed form agrees at $n = 2$: evaluate $${a1} + ${d}(2 - 1)$.`, answer: `${a1 + d}`, accept: [], hint: "Same number two ways." },
      { instruction: `Now skip the ladder entirely: evaluate the closed form at $n = ${N}$.`, answer: `${closed}`, accept: [], hint: `$${a1} + ${d} \\cdot ${N - 1}$.` },
    ],
    finalAnswer: { value: `${closed}`, unit: "" },
    solutionNarrative: `After $n - 1$ steps of adding ${d}, the total added is $${d}(n-1)$, so $a(n) = ${a1} + ${d}(n-1)$ and $a(${N}) = ${a1} + ${d} \\cdot ${N - 1} = ${closed}$. The closed form replaces ${N - 1} additions with one multiplication — that is its entire job.`,
  };
};
fill["dm-rec-cf-d2"] = (rng, idx) => {
  const a1 = rng.int(2, 5), r = rng.pick([2, 3]);
  const N = r === 2 ? rng.pick([6, 7, 8]) : rng.pick([5, 6]);
  const closed = a1 * r ** (N - 1);
  return {
    id: `gen.dm-rec-cf-d2.${idx}`, generated: true, concepts: ["closed-forms"], difficulty: 2, context: "applied",
    prompt: `A cell culture starts at ${a1} million cells and multiplies by ${r} each day: $a(1) = ${a1}$, $a(n) = ${r}\\,a(n-1)$ (in millions). The closed form is $a(n) = ${a1} \\cdot ${r}^{n-1}$.`,
    steps: [
      { instruction: "Compute $a(2)$ from the recurrence. (Give an integer.)", answer: `${a1 * r}`, accept: [], hint: `$${r} \\cdot ${a1}$.` },
      { instruction: "Compute $a(3)$.", answer: `${a1 * r * r}`, accept: [], hint: `Multiply by ${r} again.` },
      { instruction: `Now jump ahead with the closed form: compute $a(${N}) = ${a1} \\cdot ${r}^{${N - 1}}$.`, answer: `${closed}`, accept: [], hint: `$${r}^{${N - 1}} = ${r ** (N - 1)}$, then times ${a1}.` },
    ],
    finalAnswer: { value: `${closed}`, unit: "million cells" },
    solutionNarrative: `Multiplying by ${r} for $n - 1$ days stacks into a power: $a(n) = ${a1} \\cdot ${r}^{n-1}$, so $a(${N}) = ${a1} \\cdot ${r ** (N - 1)} = ${closed}$ million. Repeated addition rolls up into multiplication; repeated multiplication rolls up into a power — the two most common closed-form patterns.`,
  };
};
fill["dm-rec-cf-d3"] = (rng, idx) => {
  const v = rng.pick([
    { name: "Tower of Hanoi moves", rec: "h(1) = 1,\\; h(n) = 2h(n-1) + 1", cf: (n) => 2 ** n - 1, cfTex: "2^n - 1", step: (prev) => 2 * prev + 1, base: 1 },
    { name: "triangular numbers", rec: "s(1) = 1,\\; s(n) = s(n-1) + n", cf: (n) => (n * (n + 1)) / 2, cfTex: "\\frac{n(n+1)}{2}", step: (prev, n) => prev + n, base: 1 },
    { name: "doubling with a head start", rec: "a(1) = 3,\\; a(n) = 2a(n-1)", cf: (n) => 3 * 2 ** (n - 1), cfTex: "3 \\cdot 2^{n-1}", step: (prev) => 2 * prev, base: 3 },
  ]);
  const N = rng.int(4, 6);
  let val = v.base;
  for (let n = 2; n <= N; n++) val = v.step(val, n);
  const cfVal = v.cf(N);
  return {
    id: `gen.dm-rec-cf-d3.${idx}`, generated: true, concepts: ["closed-forms"], difficulty: 3, context: "abstract",
    prompt: `A claimed closed form for the ${v.name} recurrence $${v.rec}$ is $${v.cfTex}$. Verify the claim at $n = ${N}$ by computing BOTH sides.`,
    steps: [
      { instruction: `Climb the ladder: unroll the recurrence up to $n = ${N}$. What value does it give? (Give an integer.)`, answer: `${val}`, accept: [], hint: `Start at ${v.base} and apply the rule ${N - 1} times.` },
      { instruction: `Now evaluate the closed form $${v.cfTex}$ at $n = ${N}$.`, answer: `${cfVal}`, accept: [], hint: "Plug in and simplify." },
      { instruction: "Do the two values match? Type 'yes' or 'no'.", answer: yn(val === cfVal), accept: [], hint: "Compare your two answers." },
      { instruction: "Does agreement at ONE value of $n$ PROVE the closed form for all $n$? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "A spot-check is evidence, not proof — proof is induction's job." },
    ],
    finalAnswer: { value: `${cfVal}`, unit: "" },
    solutionNarrative: `Both routes give ${cfVal} at $n = ${N}$: the ladder from the base case and the direct formula $${v.cfTex}$. But a spot-check only rules formulas out, it never rules them in — to promote the pattern to a theorem you verify the base case and show the recurrence preserves the formula: induction.`,
  };
};

// --- induction-structure ---
fill["dm-rec-ind-d1"] = (rng, idx) => {
  const v = rng.pick([
    { claim: "1 + 2 + \\cdots + n = \\frac{n(n+1)}{2}", lhsAt: (n) => Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a + b, 0), rhsAt: (n) => (n * (n + 1)) / 2, lhsDesc: (n) => (n === 1 ? "just the single term 1" : `$${Array.from({ length: n }, (_, i) => i + 1).join(" + ")}$`) },
    { claim: "1 + 3 + 5 + \\cdots + (2n-1) = n^2", lhsAt: (n) => Array.from({ length: n }, (_, i) => 2 * i + 1).reduce((a, b) => a + b, 0), rhsAt: (n) => n * n, lhsDesc: (n) => (n === 1 ? "just the single term 1" : `$${Array.from({ length: n }, (_, i) => 2 * i + 1).join(" + ")}$`) },
    { claim: "2^0 + 2^1 + \\cdots + 2^{n-1} = 2^n - 1", lhsAt: (n) => 2 ** n - 1, rhsAt: (n) => 2 ** n - 1, lhsDesc: (n) => (n === 1 ? "just the single term $2^0 = 1$" : `$${Array.from({ length: n }, (_, i) => 2 ** i).join(" + ")}$`) },
  ]);
  const n2 = rng.int(3, 5);
  return {
    id: `gen.dm-rec-ind-d1.${idx}`, generated: true, concepts: ["induction-structure"], difficulty: 1, context: "abstract",
    prompt: `An induction proof of $${v.claim}$ starts at the BASE CASE. Check it — and one more value for confidence.`,
    steps: [
      { instruction: "Base case $n = 1$: what is the left side (the sum with one term)? (Give an integer.)", answer: `${v.lhsAt(1)}`, accept: [], hint: `The sum is ${v.lhsDesc(1)}.` },
      { instruction: "And the right side at $n = 1$?", answer: `${v.rhsAt(1)}`, accept: [], hint: "Plug $n = 1$ into the formula." },
      { instruction: `Spot-check $n = ${n2}$: what is the left side now?`, answer: `${v.lhsAt(n2)}`, accept: [], hint: `Add up ${v.lhsDesc(n2)}.` },
      { instruction: `And the right side at $n = ${n2}$? (It should match.)`, answer: `${v.rhsAt(n2)}`, accept: [], hint: "Plug in and simplify." },
    ],
    finalAnswer: { value: `${v.rhsAt(n2)}`, unit: "" },
    solutionNarrative: `Base case: both sides equal ${v.lhsAt(1)} at $n = 1$ — the anchor of the proof. At $n = ${n2}$ both sides give ${v.rhsAt(n2)}, more evidence. The base case plus the inductive step ('true at $k$ implies true at $k+1$') covers every $n$, like dominoes.`,
  };
};
fill["dm-rec-ind-d2"] = (rng, idx) => {
  const k = rng.int(5, 9);
  const Sk = (k * (k + 1)) / 2;
  const Sk1 = Sk + (k + 1);
  return {
    id: `gen.dm-rec-ind-d2.${idx}`, generated: true, concepts: ["induction-structure"], difficulty: 2, context: "abstract",
    prompt: `The INDUCTIVE STEP for $1 + 2 + \\cdots + n = \\frac{n(n+1)}{2}$: assume the formula holds at $n = ${k}$ (the induction hypothesis), then push to $n = ${k + 1}$.`,
    steps: [
      { instruction: `Use the hypothesis: what is $S(${k}) = \\frac{${k} \\cdot ${k + 1}}{2}$? (Give an integer.)`, answer: `${Sk}`, accept: [], hint: `$\\frac{${k * (k + 1)}}{2}$.` },
      { instruction: `The next sum just adds one term: $S(${k + 1}) = S(${k}) + ${k + 1}$. Compute it.`, answer: `${Sk1}`, accept: [], hint: `$${Sk} + ${k + 1}$.` },
      { instruction: `Now check the formula at $n = ${k + 1}$ directly: $\\frac{${k + 1} \\cdot ${k + 2}}{2}$.`, answer: `${((k + 1) * (k + 2)) / 2}`, accept: [], hint: `$\\frac{${(k + 1) * (k + 2)}}{2}$.` },
      { instruction: "Do the two routes agree — did the hypothesis at $k$ deliver the formula at $k + 1$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "Compare your last two answers." },
    ],
    finalAnswer: { value: `${Sk1}`, unit: "" },
    solutionNarrative: `Assuming $S(${k}) = ${Sk}$, adding the next term gives $${Sk} + ${k + 1} = ${Sk1}$ — exactly $\\frac{${k + 1} \\cdot ${k + 2}}{2}$. That is one domino knocking over the next; with the base case anchoring $n = 1$, the formula holds for every $n$. (The numbers here illustrate the step; the real proof does the same algebra with a symbolic $k$.)`,
  };
};
fill["dm-rec-ind-d3"] = (rng, idx) => {
  const n = rng.int(3, 7);
  const val = n ** 3 - n;
  const k = rng.int(3, 6);
  const diff = 3 * k * k + 3 * k; // (k+1)^3 - (k+1) - (k^3 - k)
  return {
    id: `gen.dm-rec-ind-d3.${idx}`, generated: true, concepts: ["induction-structure"], difficulty: 3, context: "abstract",
    prompt: `Claim: $n^3 - n$ is divisible by 3 for every positive integer $n$. Probe the claim, then examine the inductive step's engine.`,
    steps: [
      { instruction: `Compute $${n}^3 - ${n}$. (Give an integer.)`, answer: `${val}`, accept: [], hint: `$${n ** 3} - ${n}$.` },
      { instruction: "Divide it by 3 — the result should be a whole number.", answer: `${val / 3}`, accept: [], hint: `$${val} / 3$.` },
      { instruction: `The inductive step studies the JUMP: $(k+1)^3 - (k+1)$ minus $(k^3 - k)$ simplifies to $3k^2 + 3k$. Evaluate that jump at $k = ${k}$.`, answer: `${diff}`, accept: [], hint: `$3 \\cdot ${k * k} + 3 \\cdot ${k}$.` },
      { instruction: "The jump $3k^2 + 3k = 3(k^2 + k)$ is ALWAYS a multiple of 3. If the claim holds at $k$, must it hold at $k + 1$? Type 'yes' or 'no'.", answer: "yes", accept: [], hint: "A multiple of 3 plus a multiple of 3 is a multiple of 3." },
    ],
    finalAnswer: { value: `${val / 3}`, unit: "" },
    solutionNarrative: `$${n}^3 - ${n} = ${val} = 3 \\cdot ${val / 3}$ — divisible, as claimed. The inductive engine: the jump from $k$ to $k+1$ is $3k^2 + 3k = 3(k^2+k)$, always a multiple of 3, so divisibility at $k$ forces it at $k+1$; with the base case $1^3 - 1 = 0 = 3 \\cdot 0$, induction covers every $n$. Divisibility proofs ride on the jump being a visible multiple.`,
  };
};

// --- recursive-counting ---
fill["dm-rec-cnt-d1"] = (rng, idx) => {
  const N = rng.pick([5, 6, 7]);
  const f = [0, 1, 2];
  for (let n = 3; n <= N; n++) f[n] = f[n - 1] + f[n - 2];
  return {
    id: `gen.dm-rec-cnt-d1.${idx}`, generated: true, concepts: ["recursive-counting"], difficulty: 1, context: "applied",
    prompt: `You climb a staircase of ${N} steps taking 1 or 2 steps at a time. The number of ways $f(n)$ satisfies $f(n) = f(n-1) + f(n-2)$ — the last move was a 1-step (from stair $n-1$) or a 2-step (from stair $n-2$) — with $f(1) = 1$, $f(2) = 2$.`,
    steps: [
      { instruction: "Compute $f(3) = f(2) + f(1)$. (Give an integer.)", answer: `${f[3]}`, accept: [], hint: "$2 + 1$." },
      { instruction: "Compute $f(4)$.", answer: `${f[4]}`, accept: [], hint: `$${f[3]} + ${f[2]}$.` },
      ...(N >= 5 ? [{ instruction: "Compute $f(5)$.", answer: `${f[5]}`, accept: [], hint: `$${f[4]} + ${f[3]}$.` }] : []),
      ...(N >= 6 ? [{ instruction: "Compute $f(6)$.", answer: `${f[6]}`, accept: [], hint: `$${f[5]} + ${f[4]}$.` }] : []),
      ...(N >= 7 ? [{ instruction: "Compute $f(7)$.", answer: `${f[7]}`, accept: [], hint: `$${f[6]} + ${f[5]}$.` }] : []),
    ],
    finalAnswer: { value: `${f[N]}`, unit: "ways" },
    solutionNarrative: `Climbing the ladder: $${f.slice(1, N + 1).join(", ")}$ — so ${f[N]} ways up ${N} steps. The recurrence works because every route ends in a 1-step or a 2-step, splitting the count cleanly into the two smaller problems (it's the Fibonacci pattern in disguise).`,
  };
};
fill["dm-rec-cnt-d2"] = (rng, idx) => {
  const N = rng.pick([5, 6, 7]);
  const b = [0, 2, 3];
  for (let n = 3; n <= N; n++) b[n] = b[n - 1] + b[n - 2];
  return {
    id: `gen.dm-rec-cnt-d2.${idx}`, generated: true, concepts: ["recursive-counting"], difficulty: 2, context: "applied",
    prompt: `Count the binary strings of length ${N} with no two consecutive 1s. The count $b(n)$ satisfies $b(n) = b(n-1) + b(n-2)$: a valid string ends in 0 (put it after any valid string of length $n-1$) or in 01 (after any valid string of length $n-2$). Base cases: $b(1) = 2$, $b(2) = 3$.`,
    steps: [
      { instruction: "Compute $b(3) = b(2) + b(1)$. (Give an integer.)", answer: `${b[3]}`, accept: [], hint: "$3 + 2$." },
      { instruction: "Compute $b(4)$.", answer: `${b[4]}`, accept: [], hint: `$${b[3]} + ${b[2]}$.` },
      ...(N >= 5 ? [{ instruction: "Compute $b(5)$.", answer: `${b[5]}`, accept: [], hint: `$${b[4]} + ${b[3]}$.` }] : []),
      ...(N >= 6 ? [{ instruction: "Compute $b(6)$.", answer: `${b[6]}`, accept: [], hint: `$${b[5]} + ${b[4]}$.` }] : []),
      ...(N >= 7 ? [{ instruction: "Compute $b(7)$.", answer: `${b[7]}`, accept: [], hint: `$${b[6]} + ${b[5]}$.` }] : []),
      { instruction: `Out of all $2^{${N}} = ${2 ** N}$ binary strings of length ${N}, how many DO contain two consecutive 1s?`, answer: `${2 ** N - b[N]}`, accept: [], hint: `Total minus valid: $${2 ** N} - ${b[N]}$.` },
    ],
    finalAnswer: { value: `${b[N]}`, unit: "strings" },
    solutionNarrative: `$b$: $${b.slice(1, N + 1).join(", ")}$, so ${b[N]} valid strings of length ${N} (and $${2 ** N} - ${b[N]} = ${2 ** N - b[N]}$ invalid ones). Classify by the last character and the problem splits into smaller copies of itself — the standard way recurrences count structured strings.`,
  };
};
fill["dm-rec-cnt-d3"] = (rng, idx) => {
  const N = rng.pick([4, 5, 6]);
  const L = [1];
  for (let n = 1; n <= N; n++) L[n] = L[n - 1] + n;
  return {
    id: `gen.dm-rec-cnt-d3.${idx}`, generated: true, concepts: ["recursive-counting"], difficulty: 3, context: "applied",
    prompt: `Pizza-cutting: $L(n)$, the maximum number of regions ${N} straight cuts can divide a disk into, satisfies $L(0) = 1$ and $L(n) = L(n-1) + n$ — the $n$-th cut crosses all $n-1$ earlier cuts, adding $n$ new regions.`,
    steps: [
      { instruction: "Compute $L(1) = L(0) + 1$. (Give an integer.)", answer: `${L[1]}`, accept: [], hint: "$1 + 1$." },
      { instruction: "Compute $L(2)$.", answer: `${L[2]}`, accept: [], hint: `$${L[1]} + 2$.` },
      { instruction: "Compute $L(3)$.", answer: `${L[3]}`, accept: [], hint: `$${L[2]} + 3$.` },
      ...(N >= 4 ? [{ instruction: "Compute $L(4)$.", answer: `${L[4]}`, accept: [], hint: `$${L[3]} + 4$.` }] : []),
      ...(N >= 5 ? [{ instruction: "Compute $L(5)$.", answer: `${L[5]}`, accept: [], hint: `$${L[4]} + 5$.` }] : []),
      ...(N >= 6 ? [{ instruction: "Compute $L(6)$.", answer: `${L[6]}`, accept: [], hint: `$${L[5]} + 6$.` }] : []),
      { instruction: `Sanity-check with the closed form $L(n) = 1 + \\frac{n(n+1)}{2}$ at $n = ${N}$.`, answer: `${1 + (N * (N + 1)) / 2}`, accept: [], hint: `$1 + \\frac{${N * (N + 1)}}{2}$.` },
    ],
    finalAnswer: { value: `${L[N]}`, unit: "regions" },
    solutionNarrative: `$L$: $${L.slice(0, N + 1).join(", ")}$ — ${L[N]} regions from ${N} cuts. The added term grows each time ($+1, +2, \\ldots, +${N}$), and those increments sum to the triangular numbers, giving the closed form $1 + \\frac{n(n+1)}{2}$, which indeed yields ${1 + (N * (N + 1)) / 2} at $n = ${N}$. Count what the LAST move adds, and the recurrence writes itself.`,
  };
};

// ===========================================================================
// TOPIC 6: discrete-math.proof-techniques
// ===========================================================================

// --- direct-proof ---
fill["dm-proof-dir-d1"] = (rng, idx) => {
  const o1 = 2 * rng.int(2, 9) + 1, o2 = 2 * rng.int(2, 9) + 1, e1 = 2 * rng.int(2, 9);
  const v = rng.pick([
    {
      claim: "the sum of two odd integers is even",
      algebra: "Write the odds as $2a+1$ and $2b+1$. Their sum is $(2a+1) + (2b+1) = 2a + 2b + 2 = 2(a+b+1)$ — two times an integer. Is the sum even or odd? (Answer: even or odd)",
      parity: "even", parityHint: "Anything of the form $2 \\times (\\text{integer})$ is even by definition.",
      check: `Sanity-check the general proof with one case: compute $${o1} + ${o2}$. (Give a number.)`,
      checkA: `${o1 + o2}`, checkH: `$${o1} + ${o2}$.`,
      narr: `Direct proof: $(2a+1) + (2b+1) = 2(a+b+1)$, two times an integer — even. The spot check $${o1} + ${o2} = ${o1 + o2}$ illustrates what the algebra already proved for every pair of odds at once.`,
    },
    {
      claim: "the sum of an even integer and an odd integer is odd",
      algebra: "Write them as $2a$ and $2b+1$. The sum is $2a + 2b + 1 = 2(a+b) + 1$ — two times an integer plus one. Is the sum even or odd? (Answer: even or odd)",
      parity: "odd", parityHint: "The form $2m + 1$ is the definition of odd.",
      check: `Sanity-check the general proof with one case: compute $${e1} + ${o1}$. (Give a number.)`,
      checkA: `${e1 + o1}`, checkH: `$${e1} + ${o1}$.`,
      narr: `Direct proof: $2a + (2b+1) = 2(a+b) + 1$, which has the odd form $2m+1$. The check $${e1} + ${o1} = ${e1 + o1}$ (odd) illustrates the already-proved general fact.`,
    },
    {
      claim: "the product of an even integer and ANY integer is even",
      algebra: "Write the even one as $2a$ and the other as $b$. The product is $2a \\cdot b = 2(ab)$ — two times an integer. Is the product even or odd? (Answer: even or odd)",
      parity: "even", parityHint: "$2 \\times (\\text{integer})$ is even, whatever $b$ is.",
      check: `Sanity-check the general proof with one case: compute $${e1} \\cdot ${o1}$. (Give a number.)`,
      checkA: `${e1 * o1}`, checkH: `$${e1} \\times ${o1}$.`,
      narr: `Direct proof: $2a \\cdot b = 2(ab)$, two times an integer — even, no matter the parity of $b$. The check $${e1} \\cdot ${o1} = ${e1 * o1}$ agrees.`,
    },
  ]);
  return {
    id: `gen.dm-proof-dir-d1.${idx}`, generated: true, concepts: ["direct-proof"], difficulty: 1, context: "abstract",
    prompt: `Claim: ${v.claim}. Prove it.`,
    steps: [
      { instruction: "The hypothesis translates straight into algebra and computes forward to the conclusion. Which technique fits best? (Answer with one of: direct, contrapositive, contradiction, counterexample)", answer: "direct", accept: ["direct proof"], hint: "No negation, no assumption-for-contradiction — unfold the definitions and compute forward." },
      { instruction: v.algebra, answer: v.parity, accept: [], hint: v.parityHint },
      { instruction: v.check, answer: v.checkA, accept: [], hint: v.checkH },
    ],
    finalAnswer: { value: v.parity, unit: "" },
    solutionNarrative: v.narr,
  };
};
fill["dm-proof-dir-d2"] = (rng, idx) => {
  const c = rng.int(3, 7);
  return {
    id: `gen.dm-proof-dir-d2.${idx}`, generated: true, concepts: ["direct-proof"], difficulty: 2, context: "abstract",
    prompt: `Claim: if $n$ is even, then $n^2 + ${c}n$ is even. Prove it directly.`,
    steps: [
      { instruction: `Write $n$ as an even number: $n = 2k$. Expand $n^2 + ${c}n$ in terms of $k$.`, answer: `4k^2+${2 * c}k`, accept: [], hint: `$(2k)^2 + ${c} \\cdot 2k$.` },
      { instruction: `To exhibit the even form, rewrite $4k^2 + ${2 * c}k$ as $2m$. What is $m$ in terms of $k$?`, answer: `2k^2+${c}k`, accept: [], hint: "Pull one factor of 2 out of both terms." },
      { instruction: `$n^2 + ${c}n = 2(2k^2 + ${c}k)$ is two times an integer. Is it even or odd? (Answer: even or odd)`, answer: "even", accept: [], hint: "$2 \\times (\\text{integer})$ is the definition of even." },
    ],
    finalAnswer: { value: "even", unit: "" },
    solutionNarrative: `Let $n = 2k$. Then $n^2 + ${c}n = 4k^2 + ${2 * c}k = 2(2k^2 + ${c}k)$ — two times an integer, hence even. Exhibiting the form $2(\\text{integer})$ is the finishing move of every parity proof.`,
  };
};
fill["dm-proof-dir-d3"] = (rng, idx) => {
  const c = rng.pick([3, 5, 7]);
  const h = (c - 1) / 2;
  const s = rng.int(2, 9);
  const mid = s + h;
  const terms = Array.from({ length: c }, (_, i) => s + i);
  return {
    id: `gen.dm-proof-dir-d3.${idx}`, generated: true, concepts: ["direct-proof"], difficulty: 3, context: "applied",
    prompt: `A metrics dashboard smooths a counter by summing ${c} consecutive readings, then dividing by ${c} — silently assuming the claim: the sum of ANY ${c} consecutive integers is divisible by ${c}. Prove the claim before it ships.`,
    steps: [
      { instruction: "The claim computes forward from its hypothesis with no negations in sight. Which technique fits best? (Answer with one of: direct, contrapositive, contradiction, counterexample)", answer: "direct", accept: ["direct proof"], hint: "Unfold what 'consecutive' means into algebra and compute." },
      { instruction: `Name the MIDDLE integer $n$, so the ${c} consecutive integers run from $n - ${h}$ to $n + ${h}$. Each pair $(n-j) + (n+j)$ collapses to $2n$. What is the total sum, in terms of $n$?`, answer: `${c}n`, accept: [], hint: `The ${h} pairs give $${2 * h}n$, plus the middle $n$ itself.` },
      { instruction: `The sum is $${c}n = ${c} \\cdot (\\text{integer})$ — divisible by ${c}, proved. Spot-check: compute $${terms.join(" + ")}$. (Give a number.)`, answer: `${c * mid}`, accept: [], hint: `The middle reading is ${mid}, and the proof says the sum is $${c} \\cdot ${mid}$.` },
      { instruction: `Divide by ${c} — the quotient should be a whole number. What is it?`, answer: `${mid}`, accept: [], hint: `$${c * mid} / ${c}$.` },
    ],
    finalAnswer: { value: `${c * mid}`, unit: "" },
    solutionNarrative: `Center the run on its middle integer $n$: offsets cancel in pairs, so the sum is exactly $${c}n$ — divisible by ${c} for EVERY run, no case checking needed. The spot check agrees: $${terms.join(" + ")} = ${c * mid} = ${c} \\cdot ${mid}$. Choosing the symmetric representation is what made the direct proof one line.`,
  };
};

// --- contrapositive-proof ---
fill["dm-proof-ctp-d1"] = (rng, idx) => {
  const v = rng.pick([
    { rule: "if a commit touches the payments module, CI runs the full test suite",
      mirror: "If the full suite did NOT run, the commit did not touch payments",
      swapOnly: "If the full suite ran, the commit touched payments",
      why: "The full suite also runs on a nightly schedule — the converse has other causes." },
    { rule: "if the disk is full, the writer logs a DISK_FULL error",
      mirror: "If no DISK_FULL error was logged, the disk is not full",
      swapOnly: "If a DISK_FULL error was logged, the disk is full",
      why: "A flaky driver can emit the same error early — the converse is an unproven extra claim." },
    { rule: "if a request has no auth token, the gateway rejects it",
      mirror: "If a request was NOT rejected, it had an auth token",
      swapOnly: "If a request was rejected, it had no auth token",
      why: "Requests get rejected for many reasons (rate limits, bad routes) — the converse does not follow." },
  ]);
  return {
    id: `gen.dm-proof-ctp-d1.${idx}`, generated: true, concepts: ["contrapositive-proof"], difficulty: 1, context: "applied",
    prompt: `A system spec guarantees: '${v.rule}.'`,
    steps: [
      { instruction: `'${v.mirror}' swaps and negates both parts of the spec. Which form is it? (Answer with one of: converse, inverse, contrapositive)`, answer: "contrapositive", accept: ["the contrapositive"], hint: "Swap AND negate = contrapositive." },
      { instruction: "Is that form guaranteed to have the same truth value as the original spec? (yes/no)", answer: "yes", accept: ["equivalent"], hint: "$p \\to q \\equiv \\lnot q \\to \\lnot p$ — the truth-table columns match in every row." },
      { instruction: `'${v.swapOnly}' merely swaps the parts. Which form is that? (Answer with one of: converse, inverse, contrapositive)`, answer: "converse", accept: ["the converse"], hint: "Swap only, no negation." },
      { instruction: "Can you rely on the converse without further proof? (yes/no)", answer: "no", accept: [], hint: v.why },
    ],
    finalAnswer: { value: "contrapositive", unit: "" },
    solutionNarrative: `'${v.mirror}' is the contrapositive — swap and negate — so the spec guarantees it for free. '${v.swapOnly}' is the converse (swap only), an independent claim: ${v.why}`,
  };
};
fill["dm-proof-ctp-d2"] = (rng, idx) => {
  const a = rng.pick([3, 5, 7]);
  const b = rng.pick([1, 3, 5, 7, 9]);
  const s = a + b; // odd + odd = even, so s/2 is an integer
  return {
    id: `gen.dm-proof-ctp-d2.${idx}`, generated: true, concepts: ["contrapositive-proof"], difficulty: 2, context: "abstract",
    prompt: `Claim: if $${a}n + ${b}$ is odd, then $n$ is even. The hypothesis '$${a}n + ${b}$ is odd' is clumsy raw material — flip the statement.`,
    steps: [
      { instruction: "The negated conclusion ('$n$ is odd') is far nicer to compute with than the original hypothesis. Which technique fits best? (Answer with one of: direct, contrapositive, contradiction, counterexample)", answer: "contrapositive", accept: ["the contrapositive", "contrapositive proof"], hint: "When the negations are simpler than the originals, prove the mirror image." },
      { instruction: `Contrapositive: 'if $n$ is odd, then $${a}n + ${b}$ is even.' Write $n = 2k+1$ and express $${a}n + ${b}$ in terms of $k$.`, answer: `${2 * a}k+${s}`, accept: [], hint: `$${a}(2k+1) + ${b} = ${2 * a}k + ${a} + ${b}$.` },
      { instruction: `$${2 * a}k + ${s} = 2(${a}k + ${s / 2})$ — two times an integer. When $n$ is odd, is $${a}n + ${b}$ even or odd? (Answer: even or odd)`, answer: "even", accept: [], hint: "The form $2m$ is the definition of even." },
      { instruction: "The contrapositive is proved. Does that prove the original claim too? (yes/no)", answer: "yes", accept: ["equivalent"], hint: "$p \\to q \\equiv \\lnot q \\to \\lnot p$: proving either proves both." },
    ],
    finalAnswer: { value: "even", unit: "" },
    solutionNarrative: `Contrapositive: if $n = 2k+1$, then $${a}n + ${b} = ${2 * a}k + ${s} = 2(${a}k + ${s / 2})$ — even. So an odd $n$ can never make $${a}n + ${b}$ odd, which is exactly the original claim in mirror form, and the mirror is equivalent to the original.`,
  };
};
fill["dm-proof-ctp-d3"] = (rng, idx) => {
  const m = rng.pick([3, 4, 5, 6, 7]);
  const t = rng.int(2, 5);
  const n = m * t;
  return {
    id: `gen.dm-proof-ctp-d3.${idx}`, generated: true, concepts: ["contrapositive-proof"], difficulty: 3, context: "abstract",
    prompt: `Claim: if $n^2$ is NOT divisible by ${m * m}, then $n$ is NOT divisible by ${m}. Head-on, 'not divisible' is miserable raw material — prove the contrapositive instead.`,
    steps: [
      { instruction: `The contrapositive reads: 'if $n$ IS divisible by ${m}, then $n^2$ IS divisible by ${m * m}.' Is that formed by swapping AND negating both parts? (yes/no)`, answer: "yes", accept: [], hint: "Negating 'not divisible' gives 'divisible' on both sides, then the parts swap." },
      { instruction: `Prove it: write $n = ${m}q$ and expand $n^2$ in terms of $q$.`, answer: `${m * m}q^2`, accept: [], hint: `$(${m}q)^2 = ${m}q \\cdot ${m}q$.` },
      { instruction: `$n^2 = ${m * m}(q^2)$ — visibly divisible by ${m * m}. Spot-check at $n = ${n}$: compute $n^2$. (Give a number.)`, answer: `${n * n}`, accept: [], hint: `$${n} \\times ${n}$.` },
      { instruction: `Divide $${n * n}$ by ${m * m} — the quotient should be a whole number. What is it?`, answer: `${t * t}`, accept: [], hint: `It should equal $q^2$ with $q = ${t}$.` },
      { instruction: "The contrapositive is proved for every $n$. Does the original 'not divisible' claim come free? (yes/no)", answer: "yes", accept: ["equivalent"], hint: "$p \\to q \\equiv \\lnot q \\to \\lnot p$." },
    ],
    finalAnswer: { value: `${t * t}`, unit: "" },
    solutionNarrative: `Contrapositive: $n = ${m}q$ gives $n^2 = ${m * m}q^2$, divisible by ${m * m} — one line. The spot check: $${n}^2 = ${n * n} = ${m * m} \\cdot ${t * t}$. Since the contrapositive is equivalent to the original, the awkward 'not divisible' claim is proved without ever touching a negation.`,
  };
};

// --- proof-by-contradiction ---
fill["dm-proof-con-d1"] = (rng, idx) => {
  const m = rng.int(2, 9);
  const t = rng.int(3, 9);
  const N = m * t;
  return {
    id: `gen.dm-proof-con-d1.${idx}`, generated: true, concepts: ["proof-by-contradiction"], difficulty: 1, context: "abstract",
    prompt: `Claim: there is no largest multiple of ${m}. Prove it.`,
    steps: [
      { instruction: "The claim says something does NOT exist. Which technique starts by assuming the claim is false and derives an impossibility? (Answer with one of: direct, contrapositive, contradiction, counterexample)", answer: "contradiction", accept: ["proof by contradiction", "a contradiction"], hint: "Non-existence claims are contradiction's home turf: assume the thing exists and break something." },
      { instruction: `Assume some integer $N$ is the largest multiple of ${m}. Is $N + ${m}$ also a multiple of ${m}? (yes/no)`, answer: "yes", accept: ["yes it is"], hint: `If $N = ${m}q$, then $N + ${m} = ${m}(q+1)$.` },
      { instruction: `For instance, if $N$ were $${N}$, compute $N + ${m}$. (Give a number.)`, answer: `${N + m}`, accept: [], hint: `$${N} + ${m}$.` },
      { instruction: `$N + ${m}$ is a LARGER multiple of ${m}, so $N$ was never the largest — the assumption destroys itself. Can a largest multiple of ${m} exist? (yes/no)`, answer: "no", accept: ["it cannot"], hint: "The assumption was the only illegal input, so the assumption is false." },
    ],
    finalAnswer: { value: "no", unit: "" },
    solutionNarrative: `Assume a largest multiple $N = ${m}q$ exists. Then $N + ${m} = ${m}(q+1)$ is a strictly larger multiple of ${m} — contradiction. The anatomy never changes: assume the negation, derive the impossible, conclude the claim.`,
  };
};
fill["dm-proof-con-d2"] = (rng, idx) => {
  const v = rng.pick([
    { list: [2, 3], N: 7 },
    { list: [2, 3, 5], N: 31 },
    { list: [2, 3, 5, 7, 11], N: 2311 },
  ]);
  const prod = v.N - 1;
  const listTex = v.list.join(" \\cdot ");
  return {
    id: `gen.dm-proof-con-d2.${idx}`, generated: true, concepts: ["proof-by-contradiction"], difficulty: 2, context: "abstract",
    prompt: `A toy version of Euclid's argument. Assume, for contradiction, that ${v.list.join(", ")} are ALL the primes that exist. Build the number $N = ${listTex} + 1$ and hunt for the impossibility.`,
    steps: [
      { instruction: `Compute $N = ${listTex} + 1$. (Give a number.)`, answer: `${v.N}`, accept: [], hint: `$${listTex} = ${prod}$.` },
      { instruction: "What remainder does $N$ leave when divided by any prime on the list? (Give a number.)", answer: "1", accept: ["one"], hint: `${prod} is divisible by each listed prime; $N$ is one more.` },
      { instruction: "Every integer above 1 has a prime factor, yet no listed prime divides $N$. Was the list of primes complete after all? (yes/no)", answer: "no", accept: ["incomplete"], hint: "Some prime OFF the list must divide $N$ — contradicting 'ALL the primes'." },
    ],
    finalAnswer: { value: `${v.N}`, unit: "" },
    solutionNarrative: `$N = ${prod} + 1 = ${v.N}$ leaves remainder 1 on division by every listed prime, so none of them divides it. But every integer above 1 has a prime factor — so a prime outside the 'complete' list exists. Contradiction: no finite list holds all the primes.`,
  };
};
fill["dm-proof-con-d3"] = (rng, idx) => {
  const p = rng.pick([3, 5, 7]);
  return {
    id: `gen.dm-proof-con-d3.${idx}`, generated: true, concepts: ["proof-by-contradiction"], difficulty: 3, context: "abstract",
    prompt: `Prove $\\sqrt{${p}}$ is irrational. Assume the opposite — $\\sqrt{${p}} = a/b$, a fraction in lowest terms, so $a$ and $b$ share no common factor. Squaring both sides gives $a^2 = ${p}b^2$. (Take as a lemma: if $a^2$ is divisible by ${p}, so is $a$.)`,
    steps: [
      { instruction: `$a^2 = ${p}b^2$ is ${p} times an integer. Is $a^2$ divisible by ${p}? (yes/no)`, answer: "yes", accept: ["divisible"], hint: `It equals $${p} \\times b^2$.` },
      { instruction: `The lemma then forces $a$ itself to be divisible by ${p}. Write $a = ${p}k$ and expand $a^2$ in terms of $k$.`, answer: `${p * p}k^2`, accept: [], hint: `$(${p}k)^2 = ${p}k \\cdot ${p}k$.` },
      { instruction: `Substitute into $a^2 = ${p}b^2$: then $${p * p}k^2 = ${p}b^2$. Solve: $b^2$ equals what in terms of $k$?`, answer: `${p}k^2`, accept: [], hint: `Divide both sides of $${p * p}k^2 = ${p}b^2$ by ${p}.` },
      { instruction: `So $b^2$ — and by the lemma $b$ — is divisible by ${p} too. Both parts of a lowest-terms fraction share the factor ${p}: impossible. Is $\\sqrt{${p}}$ rational or irrational? (Answer: rational or irrational)`, answer: "irrational", accept: ["it is irrational"], hint: `The assumption '$\\sqrt{${p}}$ is rational' was the only step that could be wrong.` },
    ],
    finalAnswer: { value: "irrational", unit: "" },
    solutionNarrative: `From $a^2 = ${p}b^2$: $a^2$ is divisible by ${p}, so $a = ${p}k$; substituting, $${p * p}k^2 = ${p}b^2$ gives $b^2 = ${p}k^2$, forcing $b$ divisible by ${p} as well. A lowest-terms fraction with both parts divisible by ${p} cannot exist — so $\\sqrt{${p}}$ is irrational, by the same engine that handles $\\sqrt{2}$.`,
  };
};

// --- counterexamples-and-quantifiers ---
fill["dm-proof-cex-d1"] = (rng, idx) => {
  const c = rng.pick([3, 5, 7, 9]);
  const m = rng.pick([3, 5, 7]);
  const t = rng.pick([3, 5]);
  const v = rng.pick([
    { claim: "'$n^2$ is even for every integer $n$'",
      testI: `Test the claim at $n = ${c}$: compute $${c}^2$. (Give a number.)`,
      testA: `${c * c}`, testH: `$${c} \\times ${c}$.`,
      narrHead: `$${c}^2 = ${c * c}$ is odd` },
    { claim: `'every multiple of ${m} is even'`,
      testI: `Test the claim at the multiple $${m} \\cdot ${t}$: compute it. (Give a number.)`,
      testA: `${m * t}`, testH: `$${m} \\times ${t}$.`,
      narrHead: `$${m} \\cdot ${t} = ${m * t}$ is a multiple of ${m}, and it is odd` },
  ]);
  return {
    id: `gen.dm-proof-cex-d1.${idx}`, generated: true, concepts: ["counterexamples-and-quantifiers"], difficulty: 1, context: "abstract",
    prompt: `Universal claim: ${v.claim}. A 'for all' claim dies from a single failure — hunt one.`,
    steps: [
      { instruction: v.testI, answer: v.testA, accept: [], hint: v.testH },
      { instruction: `Is $${v.testA}$ even or odd? (Answer: even or odd)`, answer: "odd", accept: ["it is odd"], hint: "An odd number times an odd number is odd." },
      { instruction: "That number satisfies the claim's hypothesis but breaks its conclusion. What role does it play? (Answer with one of: witness, counterexample)", answer: "counterexample", accept: ["a counterexample"], hint: "One counterexample kills a $\\forall$ claim; a witness would PROVE an $\\exists$ claim." },
      { instruction: "One counterexample is enough. Is the universal claim true or false? (Answer: true or false)", answer: "false", accept: ["the claim is false"], hint: "A 'for all' with one exception is simply false." },
    ],
    finalAnswer: { value: "false", unit: "" },
    solutionNarrative: `${v.narrHead} — a counterexample, and one is all it takes: the universal claim is false. (The asymmetry runs the other way for existential claims, where one example — a witness — proves the claim outright.)`,
  };
};
fill["dm-proof-cex-d2"] = (rng, idx) => {
  const v = rng.pick([
    { a: 2, goodTex: "$n = 1, 2, 3$ give 3, 5, 7 — all prime", failN: 4, val: 9, f: 3 },
    { a: 4, goodTex: "$n = 1$ gives 5 — prime", failN: 2, val: 9, f: 3 },
    { a: 6, goodTex: "$n = 1, 2, 3$ give 7, 13, 19 — all prime", failN: 4, val: 25, f: 5 },
    { a: 10, goodTex: "$n = 1$ gives 11 — prime", failN: 2, val: 21, f: 3 },
  ]);
  return {
    id: `gen.dm-proof-cex-d2.${idx}`, generated: true, concepts: ["counterexamples-and-quantifiers"], difficulty: 2, context: "abstract",
    prompt: `Claim: '$${v.a}n + 1$ is prime for every positive integer $n$.' It starts strong: ${v.goodTex}.`,
    steps: [
      { instruction: `Evaluate $${v.a}n + 1$ at $n = ${v.failN}$. (Give a number.)`, answer: `${v.val}`, accept: [], hint: `$${v.a} \\cdot ${v.failN} + 1$.` },
      { instruction: `${v.val} factors as $${v.f} \\times k$. Find $k$. (Give a number.)`, answer: `${v.val / v.f}`, accept: [], hint: `$${v.val} \\div ${v.f}$.` },
      { instruction: `So ${v.val} is composite and the claim fails. What is the smallest positive integer $n$ that is a counterexample? (Give a number.)`, answer: `${v.failN}`, accept: [`n=${v.failN}`], hint: `Every smaller $n$ gave a prime; $n = ${v.failN}$ is the first failure.` },
      { instruction: "Do the earlier confirming values rescue the universal claim? (yes/no)", answer: "no", accept: ["no they do not"], hint: "A $\\forall$ claim with one exception is false — confirmations count for nothing." },
    ],
    finalAnswer: { value: `${v.failN}`, unit: "" },
    solutionNarrative: `$${v.a} \\cdot ${v.failN} + 1 = ${v.val} = ${v.f} \\times ${v.val / v.f}$ is composite, so $n = ${v.failN}$ is the smallest counterexample and the claim is false. The early primes were evidence, not proof — one exception ends a 'for all'.`,
  };
};
fill["dm-proof-cex-d3"] = (rng, idx) => {
  const v = rng.pick([
    { L: 6, p: 7 },
    { L: 12, p: 13 },
    { L: 16, p: 17 },
  ]);
  const sq = v.p * v.p;
  return {
    id: `gen.dm-proof-cex-d3.${idx}`, generated: true, concepts: ["counterexamples-and-quantifiers"], difficulty: 3, context: "applied",
    prompt: `A function \`isPrime(n)\` tests divisibility by the integers 2 through ${v.L} only, and its author claims it is 'correct for all n — it passed hundreds of random tests.' Find the smallest input that fools it.`,
    steps: [
      { instruction: `The cheapest way to fool trial division up to ${v.L} is a composite whose smallest prime factor exceeds ${v.L}. What is the smallest prime greater than ${v.L}? (Give a number.)`, answer: `${v.p}`, accept: [], hint: `Check the integers just above ${v.L} one by one.` },
      { instruction: `Square it: compute $${v.p} \\times ${v.p}$. (Give a number.)`, answer: `${sq}`, accept: [], hint: `$${v.p}^2$.` },
      { instruction: `Does any integer from 2 through ${v.L} divide ${sq}? (yes/no)`, answer: "no", accept: ["none"], hint: `${sq}'s only divisors are 1, ${v.p}, and ${sq}.` },
      { instruction: `So \`isPrime(${sq})\` returns true. Is ${sq} actually prime? (yes/no)`, answer: "no", accept: ["composite", "not prime"], hint: `$${sq} = ${v.p} \\times ${v.p}$.` },
      { instruction: `Every composite below ${sq} has a prime factor at most its square root, hence at most ${v.L} — so ${sq} is the SMALLEST counterexample. Did the passing tests prove the author's universal claim? (yes/no)`, answer: "no", accept: ["no they did not"], hint: "Passing tests never prove a $\\forall$; the one failing input disproves it." },
    ],
    finalAnswer: { value: `${sq}`, unit: "" },
    solutionNarrative: `$${sq} = ${v.p}^2$ has no divisor between 2 and ${v.L}, so the function wrongly reports it prime — a concrete counterexample to 'correct for all n', and the smallest one: any composite below ${sq} has a prime factor less than ${v.p}, i.e. at most ${v.L}, and gets caught. Testing hunts counterexamples; only proof certifies the hunt must fail.`,
  };
};
