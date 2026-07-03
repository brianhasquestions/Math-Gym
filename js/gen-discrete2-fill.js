// gen-discrete2-fill.js
// Parametric generators for the Discrete Math topic
//   discrete-math.relations-and-functions
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-discrete-fill.js). Template prefix: dm2-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const yn = (b) => (b ? "yes" : "no");

// --- relation toolkit (a relation is an array of [a, b] pairs) --------------
const has = (R, a, b) => R.some(([x, y]) => x === a && y === b);
const addPair = (R, a, b) => { if (!has(R, a, b)) R.push([a, b]); };
const sortPairs = (R) => R.slice().sort(([a, b], [c, d]) => (a - c) || (b - d));
const isReflexive = (S, R) => S.every((a) => has(R, a, a));
const missingDiag = (S, R) => S.filter((a) => !has(R, a, a)).length;
const isSymmetric = (R) => R.every(([a, b]) => has(R, b, a));
// Distinct pairs (a, d) forced by a chain (a, b), (b, d) but absent from R.
const transMissing = (R) => {
  const miss = [];
  for (const [a, b] of R) for (const [c, d] of R) {
    if (b === c && !has(R, a, d) && !miss.some(([x, y]) => x === a && y === d)) miss.push([a, d]);
  }
  return miss;
};
const isTransitive = (R) => transMissing(R).length === 0;
const pairsTex = (R) => `\\{${sortPairs(R).map(([a, b]) => `(${a},${b})`).join(",\\ ")}\\}`;

const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const falling = (n, m) => { let r = 1; for (let i = 0; i < m; i++) r *= (n - i); return r; };

// k distinct random integers from [lo, hi] (unsorted, rng-order).
const distinct = (rng, k, lo, hi) => {
  const out = [];
  while (out.length < k) { const v = rng.int(lo, hi); if (!out.includes(v)) out.push(v); }
  return out;
};

// Format the linear inverse (x - b)/a with clean signs.
const invTex = (a, b) => (b >= 0 ? `(x - ${b})/${a}` : `(x + ${-b})/${a}`);
const linTex = (a, b) => (b >= 0 ? `${a}x + ${b}` : `${a}x - ${-b}`);

export const fill = {};

// ===========================================================================
// concept: relation-properties
// ===========================================================================

fill["dm2-rel-props-1"] = (rng, idx) => {
  const S = [1, 2, 3];
  // Diagonal: keep 0..2 of the 3 diagonal pairs, so at least one is missing.
  const keep = rng.int(0, 2);
  const diag = distinct(rng, keep, 1, 3);
  const R = diag.map((a) => [a, a]);
  // One off-diagonal pair, with a 50% chance of its mirror image.
  const [a, b] = distinct(rng, 2, 1, 3);
  addPair(R, a, b);
  if (rng.int(0, 1) === 1) addPair(R, b, a);
  const miss = missingDiag(S, R);
  const sym = isSymmetric(R);
  return {
    id: `gen.dm2-rel-props-1.${idx}`, generated: true, concepts: ["relation-properties"], difficulty: 1, context: "abstract",
    prompt: `Let $R = ${pairsTex(R)}$ be a relation on the set $S = \\{1, 2, 3\\}$.`,
    steps: [
      { instruction: "Is $R$ reflexive — is $(x, x) \\in R$ for EVERY element $x$ of $S$? Type 'yes' or 'no'.", answer: yn(isReflexive(S, R)), accept: [], hint: "Check all three diagonal pairs $(1,1), (2,2), (3,3)$ against the list; one absence sinks reflexivity." },
      { instruction: "Is $R$ symmetric — does $(x, y) \\in R$ always force $(y, x) \\in R$? Type 'yes' or 'no'.", answer: yn(sym), accept: [], hint: sym ? "Every listed pair has its reversal in the list (diagonal pairs are their own reversals)." : `The pair $(${a},${b})$ is in $R$ — is its reversal $(${b},${a})$?` },
      { instruction: "How many ordered pairs must be ADDED to $R$ to make it reflexive? (Give a whole number.)", answer: `${miss}`, accept: [], hint: "Count the elements $x$ of $S$ whose diagonal pair $(x, x)$ is missing." },
    ],
    finalAnswer: { value: `${miss}`, unit: "pairs" },
    solutionNarrative: `Reflexivity needs all three diagonal pairs and ${miss === 3 ? "none are" : `only ${3 - miss} ${3 - miss === 1 ? "is" : "are"}`} present, so $R$ is not reflexive and needs ${miss} more pair${miss === 1 ? "" : "s"}. Symmetry: ${sym ? "every pair's reversal is present (a diagonal pair mirrors to itself), so $R$ IS symmetric" : `$(${a},${b}) \\in R$ but $(${b},${a}) \\notin R$, so $R$ is NOT symmetric — one unreturned pair is all it takes`}.`,
  };
};

fill["dm2-rel-props-2"] = (rng, idx) => {
  const S = [1, 2, 3, 4];
  const dk = rng.int(2, 4); // 2..4 diagonal pairs: reflexive iff dk = 4
  const diag = distinct(rng, dk, 1, 4);
  const R = diag.map((a) => [a, a]);
  // Two off-diagonal pairs, each with a 50% chance of its mirror.
  for (let t = 0; t < 2; t++) {
    const [a, b] = distinct(rng, 2, 1, 4);
    addPair(R, a, b);
    if (rng.int(0, 1) === 1) addPair(R, b, a);
  }
  const refl = isReflexive(S, R), sym = isSymmetric(R), trans = isTransitive(R);
  const count = (refl ? 1 : 0) + (sym ? 1 : 0) + (trans ? 1 : 0);
  const missTr = transMissing(R);
  const badPair = R.find(([a, b]) => !has(R, b, a));
  return {
    id: `gen.dm2-rel-props-2.${idx}`, generated: true, concepts: ["relation-properties"], difficulty: 2, context: "abstract",
    prompt: `Let $R = ${pairsTex(R)}$ be a relation on $S = \\{1, 2, 3, 4\\}$. Test it against all three properties.`,
    steps: [
      { instruction: "Is $R$ reflexive? Type 'yes' or 'no'.", answer: yn(refl), accept: [], hint: refl ? "All four diagonal pairs $(x, x)$ are in the list." : "Find an element $x$ of $S$ with $(x, x)$ missing." },
      { instruction: "Is $R$ symmetric? Type 'yes' or 'no'.", answer: yn(sym), accept: [], hint: sym ? "Reverse each listed pair — the reversal is always in the list." : `Look at $(${badPair ? badPair[0] : "?"},${badPair ? badPair[1] : "?"})$: is its reversal listed?` },
      { instruction: "Is $R$ transitive — do $(x, y) \\in R$ and $(y, z) \\in R$ always force $(x, z) \\in R$? Type 'yes' or 'no'.", answer: yn(trans), accept: [], hint: trans ? "Chase every chain $(x, y), (y, z)$ — the shortcut $(x, z)$ is always present." : `Chase chains through a shared middle element: one of them lands on a missing shortcut${missTr.length ? ` (the chain ending at $(${missTr[0][0]},${missTr[0][1]})$)` : ""}.` },
      { instruction: "How many of the three properties (reflexive, symmetric, transitive) does $R$ satisfy? (Give a number from 0 to 3.)", answer: `${count}`, accept: [], hint: "Tally your three yes/no verdicts." },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: `Reflexive: ${yn(refl)} (${refl ? "all four" : "not all"} diagonal pairs present). Symmetric: ${yn(sym)}${sym ? "" : ` — $(${badPair[0]},${badPair[1]})$ has no reversal`}. Transitive: ${yn(trans)}${trans ? "" : ` — the shortcut $(${missTr[0][0]},${missTr[0][1]})$ demanded by a chain is missing`}. That makes ${count} of 3. Each property is a separate universal claim; each is settled by exhaustive checking on a finite relation.`,
  };
};

fill["dm2-rel-props-3"] = (rng, idx) => {
  const S = [1, 2, 3, 4];
  const perm = distinct(rng, 4, 1, 4);
  const [a, b, c, d] = perm; // distinct
  const R = [[a, b], [b, c]];
  const longer = rng.int(0, 1) === 1;
  if (longer) addPair(R, c, d); // extends the chain, so one round of patching won't finish
  const e = rng.int(1, 4);
  addPair(R, e, e); // one diagonal pair for flavor
  const miss = transMissing(R);
  const R2 = R.concat(miss.map((p) => p.slice()));
  const trans2 = isTransitive(R2);
  const diagMiss = missingDiag(S, R);
  return {
    id: `gen.dm2-rel-props-3.${idx}`, generated: true, concepts: ["relation-properties"], difficulty: 3, context: "abstract",
    prompt: `Let $R = ${pairsTex(R)}$ be a relation on $S = \\{1, 2, 3, 4\\}$. Transitivity fails through CHAINS — repair it and see whether one repair round is enough.`,
    steps: [
      { instruction: "Is $R$ transitive? Type 'yes' or 'no'.", answer: "no", accept: [], hint: `The chain $(${a},${b}), (${b},${c})$ demands the shortcut $(${a},${c})$ — is it there?` },
      { instruction: "Count the DISTINCT missing shortcuts: pairs $(x, z) \\notin R$ for which some $y$ has $(x, y) \\in R$ and $(y, z) \\in R$. (Whole number.)", answer: `${miss.length}`, accept: [], hint: "March through every pair of links that share a middle element and note each absent $(x, z)$ once." },
      { instruction: "Add all of those missing pairs to $R$ at once. Is the enlarged relation transitive NOW? Type 'yes' or 'no'.", answer: yn(trans2), accept: [], hint: trans2 ? "Re-check the chains, including ones through the freshly added pairs." : "The new pairs create NEW chains — check whether those demand yet more shortcuts." },
      { instruction: "Separately: how many ordered pairs would have to be added to the ORIGINAL $R$ to make it reflexive? (Whole number.)", answer: `${diagMiss}`, accept: [], hint: "Count the elements of $S$ whose diagonal pair is absent from the original list." },
    ],
    finalAnswer: { value: `${miss.length}`, unit: "pairs" },
    solutionNarrative: `The chain $(${a},${b}), (${b},${c})$ has no shortcut $(${a},${c})$, so $R$ is not transitive; in total ${miss.length} shortcut${miss.length === 1 ? " is" : "s are"} missing: $${pairsTex(miss)}$. Adding them ${trans2 ? "closes every chain — the result is transitive" : `creates new chains (e.g. through $(${a},${c})$ and onward), which demand further shortcuts — transitive closure can take several rounds`}. Reflexivity is independent: ${diagMiss} of the four diagonal pairs are missing.`,
  };
};

// ===========================================================================
// concept: equivalence-relations
// ===========================================================================

fill["dm2-equiv-1"] = (rng, idx) => {
  const n = rng.pick([3, 4, 5, 6, 7]);
  const x = rng.int(20, 99);
  const r = x % n;
  const k = rng.int(2, 5);
  const same = rng.int(0, 1) === 1;
  const y = same ? x + k * n : x + k * n + 1;
  return {
    id: `gen.dm2-equiv-1.${idx}`, generated: true, concepts: ["equivalence-relations"], difficulty: 1, context: "abstract",
    prompt: `Congruence mod ${n} ($x \\equiv y \\pmod{${n}}$ when $x$ and $y$ leave the same remainder on division by ${n}) is an equivalence relation on the integers.`,
    steps: [
      { instruction: `Which equivalence class does ${x} belong to — what is the remainder of ${x} on division by ${n}? (Give a number from 0 to ${n - 1}.)`, answer: `${r}`, accept: [], hint: `$${x} = ${n} \\cdot ${Math.floor(x / n)} + ${r}$.` },
      { instruction: `How many distinct equivalence classes does congruence mod ${n} have? (Whole number.)`, answer: `${n}`, accept: [], hint: `One class per possible remainder: $0, 1, \\ldots, ${n - 1}$.` },
      { instruction: `Is $${y} \\equiv ${x} \\pmod{${n}}$ — do they land in the same class? Type 'yes' or 'no'.`, answer: yn(same), accept: [], hint: `${y} leaves remainder ${y % n}; compare it with ${r}.` },
    ],
    finalAnswer: { value: yn(same), unit: "" },
    solutionNarrative: `$${x} = ${n} \\cdot ${Math.floor(x / n)} + ${r}$, so ${x} lives in class ${r} of the ${n} classes $\\{0, 1, \\ldots, ${n - 1}\\}$. And ${y} leaves remainder ${y % n}, so the two numbers are ${same ? "in the SAME class — congruent" : "in DIFFERENT classes — not congruent"}. The classes partition the integers: every integer is in exactly one.`,
  };
};

fill["dm2-equiv-2"] = (rng, idx) => {
  const blocksPool = [
    [[1, 2], [3, 4]],
    [[1, 2, 3], [4]],
    [[1], [2, 3, 4]],
    [[1, 3], [2, 4]],
    [[1, 4], [2], [3]],
  ];
  const blocks = rng.pick(blocksPool);
  let R = [];
  for (const blk of blocks) for (const a of blk) for (const b of blk) addPair(R, a, b);
  const variant = rng.int(0, 2); // 0 intact, 1 drop a diagonal pair, 2 drop one half of a mirror pair
  let dropped = null;
  if (variant === 1) {
    const a = rng.int(1, 4);
    dropped = [a, a];
  } else if (variant === 2) {
    const off = R.filter(([a, b]) => a !== b);
    dropped = off.length ? off[rng.int(0, off.length - 1)] : null;
  }
  if (dropped) R = R.filter(([a, b]) => !(a === dropped[0] && b === dropped[1]));
  const S = [1, 2, 3, 4];
  const refl = isReflexive(S, R), sym = isSymmetric(R), trans = isTransitive(R);
  const isEq = refl && sym && trans;
  return {
    id: `gen.dm2-equiv-2.${idx}`, generated: true, concepts: ["equivalence-relations"], difficulty: 2, context: "abstract",
    prompt: `Let $R = ${pairsTex(R)}$ be a relation on $S = \\{1, 2, 3, 4\\}$. Decide whether $R$ is an equivalence relation by testing all three requirements.`,
    steps: [
      { instruction: "Is $R$ reflexive? Type 'yes' or 'no'.", answer: yn(refl), accept: [], hint: refl ? "All four diagonal pairs are listed." : "One of $(1,1), (2,2), (3,3), (4,4)$ is missing." },
      { instruction: "Is $R$ symmetric? Type 'yes' or 'no'.", answer: yn(sym), accept: [], hint: sym ? "Each listed pair's reversal is also listed." : "Some pair appears without its reversal — scan for the unreturned one." },
      { instruction: "Is $R$ transitive? Type 'yes' or 'no'.", answer: yn(trans), accept: [], hint: trans ? "Every chain's shortcut is present — pairs never cross between groups." : "Follow a chain through a shared middle element to a missing shortcut." },
      { instruction: "Verdict: is $R$ an 'equivalence relation' or 'not an equivalence relation'? (Type one of those two phrases.)", answer: isEq ? "equivalence relation" : "not an equivalence relation", accept: isEq ? ["equivalence"] : ["not equivalence", "not an equivalence"], hint: "Equivalence needs ALL THREE properties; one failure disqualifies." },
    ],
    finalAnswer: { value: isEq ? "equivalence relation" : "not an equivalence relation", unit: "" },
    solutionNarrative: isEq
      ? `All three checks pass — $R$ is an equivalence relation. In fact $R$ relates $x$ to $y$ exactly when they share a group in the partition $${blocks.map((b) => `\\{${b.join(",")}\\}`).join(", ")}$ of $S$: every equivalence relation is a partition worn as a set of pairs.`
      : `The relation fails ${refl ? "" : "reflexivity"}${!refl && (!sym || !trans) ? " and " : ""}${sym ? "" : "symmetry"}${!sym && !trans ? " and " : ""}${trans ? "" : "transitivity"}, so it is NOT an equivalence relation — it was built from the partition $${blocks.map((b) => `\\{${b.join(",")}\\}`).join(", ")}$ but the pair $(${dropped[0]},${dropped[1]})$ was deleted, and a single missing pair breaks the structure.`,
  };
};

fill["dm2-equiv-3"] = (rng, idx) => {
  const n = rng.int(5, 9);
  const a = rng.int(10, 60);
  const r = a % n;
  const M = rng.int(40, 90);
  let count = 0, largest = 0;
  for (let x = 1; x <= M; x++) if (x % n === r) { count++; largest = x; }
  return {
    id: `gen.dm2-equiv-3.${idx}`, generated: true, concepts: ["equivalence-relations"], difficulty: 3, context: "applied",
    prompt: `A scheduler assigns job ids to worker queues by id mod ${n} — the queues are exactly the equivalence classes of congruence mod ${n}. Job ${a} just arrived, and ids $1$ through ${M} are live.`,
    steps: [
      { instruction: `Which queue does job ${a} land in — what is ${a} mod ${n}? (Give a number from 0 to ${n - 1}.)`, answer: `${r}`, accept: [], hint: `$${a} = ${n} \\cdot ${Math.floor(a / n)} + ${r}$.` },
      { instruction: `How many queues (equivalence classes) does the system have in total? (Whole number.)`, answer: `${n}`, accept: [], hint: `One per remainder: $0$ through ${n - 1}.` },
      { instruction: `How many of the live ids $1, 2, \\ldots, ${M}$ share job ${a}'s queue? (Whole number.)`, answer: `${count}`, accept: [], hint: `Count the integers in $[1, ${M}]$ with remainder ${r}: they march upward in steps of ${n}.` },
      { instruction: `What is the LARGEST live id in that queue? (Whole number.)`, answer: `${largest}`, accept: [], hint: `Start from ${M} and walk down to the first id with remainder ${r}.` },
    ],
    finalAnswer: { value: `${count}`, unit: "ids" },
    solutionNarrative: `Job ${a} has remainder ${r}, one of the ${n} classes. Within $\\{1, \\ldots, ${M}\\}$ the class members step by ${n} up to ${largest}, giving ${count} ids. Mod-$n$ bucketing is used precisely because congruence is an equivalence relation: every id lands in exactly one queue, and the queues cover everything.`,
  };
};

// ===========================================================================
// concept: functions-and-counting
// ===========================================================================

fill["dm2-func-count-1"] = (rng, idx) => {
  const inj = rng.int(0, 1) === 1;
  let vals;
  if (inj) vals = distinct(rng, 3, 1, 4);
  else {
    const v = rng.int(1, 4), w = rng.int(1, 4);
    const pos = rng.int(0, 2); // where the duplicate sits
    vals = pos === 0 ? [v, v, w] : pos === 1 ? [v, w, v] : [w, v, v];
  }
  const isInj = new Set(vals).size === 3;
  const cls = isInj ? "injective" : "neither";
  const dupVal = vals.find((v, i) => vals.indexOf(v) !== i);
  return {
    id: `gen.dm2-func-count-1.${idx}`, generated: true, concepts: ["functions-and-counting"], difficulty: 1, context: "abstract",
    prompt: `Define $f: \\{1, 2, 3\\} \\to \\{1, 2, 3, 4\\}$ by $f(1) = ${vals[0]}$, $f(2) = ${vals[1]}$, $f(3) = ${vals[2]}$.`,
    steps: [
      { instruction: "Is $f$ injective — do different inputs always get different outputs? Type 'yes' or 'no'.", answer: yn(isInj), accept: [], hint: isInj ? "Compare the three output values pairwise: all distinct." : `Two inputs share the output ${dupVal}.` },
      { instruction: "Is $f$ surjective — is every element of the codomain $\\{1, 2, 3, 4\\}$ hit by some input? Type 'yes' or 'no'.", answer: "no", accept: [], hint: "Three inputs can hit at most three of the four targets — someone in the codomain is always missed." },
      { instruction: "Classify $f$: type 'injective', 'surjective', 'bijective', or 'neither'.", answer: cls, accept: [], hint: "Bijective needs both properties; here surjectivity already failed." },
    ],
    finalAnswer: { value: cls, unit: "" },
    solutionNarrative: `Outputs ${vals.join(", ")}: ${isInj ? "all distinct, so $f$ is injective" : `the value ${dupVal} repeats, so $f$ is not injective`}. Surjective is impossible — 3 inputs cannot cover 4 targets — so $f$ is ${cls === "injective" ? "injective (only)" : "neither injective nor surjective"}.`,
  };
};

fill["dm2-func-count-2"] = (rng, idx) => {
  const m = rng.int(2, 3);
  const n = rng.int(m + 1, 6);
  const total = n ** m;
  const inj = falling(n, m);
  return {
    id: `gen.dm2-func-count-2.${idx}`, generated: true, concepts: ["functions-and-counting"], difficulty: 2, context: "abstract",
    prompt: `Let $|A| = ${m}$ and $|B| = ${n}$. Count the functions from $A$ to $B$ — each of the ${m} inputs independently picks one of the ${n} outputs.`,
    steps: [
      { instruction: `How many functions $f: A \\to B$ are there in total? (Whole number: $${n}^{${m}}$.)`, answer: `${total}`, accept: [], hint: `Each of the ${m} inputs has ${n} choices: multiply.` },
      { instruction: `How many of them are INJECTIVE? (Whole number: outputs must be used at most once, so choices shrink.)`, answer: `${inj}`, accept: [], hint: `$${Array.from({ length: m }, (_, i) => n - i).join(" \\cdot ")}$: the first input has ${n} options, each later input one fewer.` },
      { instruction: `Now flip the sizes: how many injective functions are there from a ${n + 1}-element set to $B$ (still $|B| = ${n}$)? (Whole number.)`, answer: "0", accept: ["none", "zero"], hint: `${n + 1} inputs cannot get distinct outputs from only ${n} targets — pigeonhole.` },
    ],
    finalAnswer: { value: `${inj}`, unit: "" },
    solutionNarrative: `Total: $${n}^{${m}} = ${total}$ (independent choices multiply). Injective: $${Array.from({ length: m }, (_, i) => n - i).join(" \\cdot ")} = ${inj}$ — the falling factorial, since used outputs are retired. With ${n + 1} inputs and ${n} outputs, injectivity is impossible: the count is 0 by pigeonhole.`,
  };
};

fill["dm2-func-count-3"] = (rng, idx) => {
  const n = rng.pick([3, 4]);
  const perm = rng.int(0, 1) === 1;
  let vals;
  if (perm) vals = distinct(rng, n, 1, n); // a random permutation of 1..n
  else {
    vals = distinct(rng, n, 1, n);
    const i = rng.int(0, n - 1);
    let j = rng.int(0, n - 1);
    while (j === i) j = rng.int(0, n - 1);
    vals[i] = vals[j]; // force a collision
  }
  const isInj = new Set(vals).size === n;
  const isSur = Array.from({ length: n }, (_, i) => i + 1).every((v) => vals.includes(v));
  const cls = isInj && isSur ? "bijective" : "neither";
  const missed = Array.from({ length: n }, (_, i) => i + 1).find((v) => !vals.includes(v));
  const domain = Array.from({ length: n }, (_, i) => i + 1);
  return {
    id: `gen.dm2-func-count-3.${idx}`, generated: true, concepts: ["functions-and-counting"], difficulty: 3, context: "abstract",
    prompt: `Define $g: \\{${domain.join(", ")}\\} \\to \\{${domain.join(", ")}\\}$ by ${domain.map((d, i) => `$g(${d}) = ${vals[i]}$`).join(", ")}. Note the domain and codomain have the SAME size.`,
    steps: [
      { instruction: "Is $g$ injective? Type 'yes' or 'no'.", answer: yn(isInj), accept: [], hint: isInj ? "The output list has no repeats." : "Scan the output list for a repeated value." },
      { instruction: "Is $g$ surjective? Type 'yes' or 'no'.", answer: yn(isSur), accept: [], hint: isSur ? "Every codomain element appears among the outputs." : `The codomain element ${missed} is never hit.` },
      { instruction: "Classify $g$: type 'injective', 'surjective', 'bijective', or 'neither'.", answer: cls, accept: [], hint: "For finite sets of EQUAL size, injective and surjective stand or fall together — so the only options here are 'bijective' or 'neither'." },
      { instruction: `How many bijections are there from a ${n}-element set to itself? (Whole number: $${n}!$.)`, answer: `${fact(n)}`, accept: [], hint: `$${Array.from({ length: n }, (_, i) => n - i).join(" \\cdot ")}$.` },
    ],
    finalAnswer: { value: `${fact(n)}`, unit: "" },
    solutionNarrative: `Outputs ${vals.join(", ")}: ${isInj ? "no repeats and full coverage, so $g$ is a bijection (a permutation)" : `a repeat means not injective, and with equal finite sizes that forces a missed target too (${missed} here) — so $g$ is neither`}. The pigeonhole principle makes injective $\\Leftrightarrow$ surjective when $|A| = |B|$ is finite. Bijections of an ${n}-set number $${n}! = ${fact(n)}$.`,
  };
};

// ===========================================================================
// concept: composition-and-inverse
// ===========================================================================

fill["dm2-comp-inv-1"] = (rng, idx) => {
  const a = rng.int(2, 4), b = rng.int(1, 6);
  const c = rng.int(2, 4), d = rng.int(1, 6);
  const k = rng.int(1, 4);
  const gk = c * k + d;
  const fgk = a * gk + b;
  const poly = `${a * c}x + ${a * d + b}`;
  return {
    id: `gen.dm2-comp-inv-1.${idx}`, generated: true, concepts: ["composition-and-inverse"], difficulty: 1, context: "abstract",
    prompt: `Let $f(x) = ${linTex(a, b)}$ and $g(x) = ${linTex(c, d)}$. Composition applies the INNER function first: $(f \\circ g)(x) = f(g(x))$.`,
    steps: [
      { instruction: `Evaluate the inner function: $g(${k}) = {}$? (Give a number.)`, answer: `${gk}`, accept: [], hint: `$${c} \\cdot ${k} + ${d}$.` },
      { instruction: `Now the outer: $(f \\circ g)(${k}) = f(${gk}) = {}$? (Give a number.)`, answer: `${fgk}`, accept: [], hint: `$${a} \\cdot ${gk} + ${b}$.` },
      { instruction: `Find the general formula $(f \\circ g)(x)$ as an expression in $x$ (of the form $px + q$).`, answer: poly, accept: [`y = ${poly}`, `${a}(${c}x + ${d}) + ${b}`], hint: `Substitute: $f(${c}x + ${d}) = ${a}(${c}x + ${d}) + ${b}$, then expand.` },
    ],
    finalAnswer: { value: poly, unit: "" },
    solutionNarrative: `$g(${k}) = ${gk}$ and $f(${gk}) = ${fgk}$. In general $(f \\circ g)(x) = ${a}(${c}x + ${d}) + ${b} = ${poly}$ — check it at $x = ${k}$: $${a * c} \\cdot ${k} + ${a * d + b} = ${fgk}$. ✓`,
  };
};

fill["dm2-comp-inv-2"] = (rng, idx) => {
  const a = rng.int(2, 5), b = rng.int(1, 9);
  const k = rng.int(1, 5);
  const fk = a * k + b;
  const inv = invTex(a, b);
  return {
    id: `gen.dm2-comp-inv-2.${idx}`, generated: true, concepts: ["composition-and-inverse"], difficulty: 2, context: "abstract",
    prompt: `Let $f(x) = ${linTex(a, b)}$. Because $a = ${a} \\ne 0$, $f$ is a bijection on the reals, so it has an inverse — the function that UNDOES $f$.`,
    steps: [
      { instruction: `First a forward value: $f(${k}) = {}$? (Give a number.)`, answer: `${fk}`, accept: [], hint: `$${a} \\cdot ${k} + ${b}$.` },
      { instruction: `Solve $y = ${linTex(a, b)}$ for $x$, then swap the letters: give $f^{-1}(x)$ as an expression in $x$.`, answer: inv, accept: [`x/${a} - ${b}/${a}`, `(x - (${b}))/${a}`], hint: `Undo in reverse order: subtract ${b}, THEN divide by ${a} — the whole numerator gets divided.` },
      { instruction: `Verify the undo: $f^{-1}(${fk}) = {}$? (Give a number.)`, answer: `${k}`, accept: [], hint: `$(${fk} - ${b}) / ${a}$ — you should land back on the input you started with.` },
    ],
    finalAnswer: { value: inv, unit: "" },
    solutionNarrative: `$f(${k}) = ${fk}$. Solving $y = ${linTex(a, b)}$: subtract ${b}, divide by ${a}, giving $f^{-1}(x) = ${inv}$. The round trip confirms it: $f^{-1}(${fk}) = (${fk} - ${b})/${a} = ${k}$, the original input. Composition with the inverse is the identity: $f^{-1} \\circ f = \\mathrm{id}$.`,
  };
};

fill["dm2-comp-inv-3"] = (rng, idx) => {
  const a = rng.int(2, 4), b = rng.int(1, 6);
  const c = rng.int(2, 4);
  let d = rng.int(1, 6);
  while (a * d + b === c * b + d) d = rng.int(1, 6); // f∘g and g∘f must differ
  const m = rng.int(1, 4);
  const fg = `${a * c}x + ${a * d + b}`;
  const gf = `${a * c}x + ${c * b + d}`;
  const val = a * c * m + a * d + b;
  return {
    id: `gen.dm2-comp-inv-3.${idx}`, generated: true, concepts: ["composition-and-inverse"], difficulty: 3, context: "abstract",
    prompt: `Let $f(x) = ${linTex(a, b)}$ and $g(x) = ${linTex(c, d)}$. Compose them BOTH ways and compare — order matters in composition.`,
    steps: [
      { instruction: `Find $(f \\circ g)(x) = f(g(x))$ as an expression in $x$ (form $px + q$).`, answer: fg, accept: [`y = ${fg}`, `${a}(${c}x + ${d}) + ${b}`], hint: `$g$ goes INSIDE $f$: expand $${a}(${c}x + ${d}) + ${b}$.` },
      { instruction: `Now the other order: $(g \\circ f)(x) = g(f(x))$ as an expression in $x$.`, answer: gf, accept: [`y = ${gf}`, `${c}(${a}x + ${b}) + ${d}`], hint: `This time $f$ goes inside $g$: expand $${c}(${a}x + ${b}) + ${d}$.` },
      { instruction: `Are $f \\circ g$ and $g \\circ f$ the same function? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: `Both have slope ${a * c}, but compare the constant terms: ${a * d + b} versus ${c * b + d}.` },
      { instruction: `Evaluate $(f \\circ g)(${m})$. (Give a number.)`, answer: `${val}`, accept: [], hint: `$${a * c} \\cdot ${m} + ${a * d + b}$.` },
    ],
    finalAnswer: { value: `${val}`, unit: "" },
    solutionNarrative: `$(f \\circ g)(x) = ${a}(${c}x + ${d}) + ${b} = ${fg}$ while $(g \\circ f)(x) = ${c}(${a}x + ${b}) + ${d} = ${gf}$: same slope $${a * c}$, different constants (${a * d + b} vs ${c * b + d}), so composition is NOT commutative. At $x = ${m}$: $(f \\circ g)(${m}) = ${val}$.`,
  };
};
