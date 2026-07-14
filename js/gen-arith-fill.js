// gen-arith-fill.js
// Generator pack for the Mental Arithmetic subject (templates prefixed ari-).
// Two topics, three skills each, every skill covered at all three tiers, so
// the tables trainer never repeats a memorizable item:
//   arithmetic.addition-tables:       sums-within-10, crossing-ten, two-digit-mental
//   arithmetic.multiplication-tables: tables-2-5, tables-6-9, tables-10-12
// Self-contained: exports a `fill` map of template-name -> (rng, idx) => problem,
// matching js/generator.js's registry shape. Deterministic: all numbers come
// from the passed rng, and every template returns a FIXED difficulty + concepts
// list so single-probe tier detection is reliable. Problems are single-step on
// purpose — these are rapid-fire fact drills, not multi-step derivations.

export const fill = {};

// Small phrasing pools so consecutive drills don't read identically.
const ADD_ASK = ["Compute", "What is", "Add:", "Find the sum:"];
const MUL_ASK = ["Compute", "What is", "Multiply:", "Find the product:"];

// ============================================================================
// arithmetic.addition-tables
// ============================================================================

// --- sums-within-10 d1: small addends, sum <= 10 ----------------------------
fill["ari-sums10-d1"] = (rng, idx) => {
  const a = rng.int(1, 5), b = rng.int(1, Math.min(5, 10 - a));
  const ask = rng.pick(ADD_ASK);
  return {
    id: `gen.ari-sums10-d1.${idx}`, generated: true, concepts: ["sums-within-10"], difficulty: 1, context: "abstract",
    prompt: `${ask} $${a} + ${b}$`,
    steps: [{ instruction: "Give the sum.", answer: `${a + b}`, accept: [], hint: `Count on from ${Math.max(a, b)}.` }],
    finalAnswer: { value: `${a + b}`, unit: "" },
    solutionNarrative: `$${a} + ${b} = ${a + b}$. Start at ${Math.max(a, b)} and count on ${Math.min(a, b)}.`,
  };
};

// --- sums-within-10 d2: bigger addends, sums 6..10 --------------------------
fill["ari-sums10-d2"] = (rng, idx) => {
  const a = rng.int(2, 8), b = rng.int(Math.max(1, 6 - a), 10 - a); // sum lands in 6..10
  const applied = rng.pick([true, false]);
  const thing = rng.pick(["apples", "stickers", "marbles", "coins", "cards"]);
  const prompt = applied
    ? `You have ${a} ${thing} and pick up ${b} more. How many ${thing} do you have now?`
    : `${rng.pick(ADD_ASK)} $${a} + ${b}$`;
  return {
    id: `gen.ari-sums10-d2.${idx}`, generated: true, concepts: ["sums-within-10"], difficulty: 2, context: applied ? "applied" : "abstract",
    prompt,
    steps: [{ instruction: "Give the sum.", answer: `${a + b}`, accept: [], hint: `Start from the bigger number, ${Math.max(a, b)}, and count on.` }],
    finalAnswer: { value: `${a + b}`, unit: applied ? thing : "" },
    solutionNarrative: `$${a} + ${b} = ${a + b}$. Adding is the same in either order, so start from ${Math.max(a, b)} and add ${Math.min(a, b)}.`,
  };
};

// --- sums-within-10 d3: missing addend or three addends ---------------------
fill["ari-sums10-d3"] = (rng, idx) => {
  if (rng.pick(["missing", "three"]) === "missing") {
    const total = rng.int(7, 10), a = rng.int(2, total - 2), b = total - a;
    return {
      id: `gen.ari-sums10-d3.${idx}`, generated: true, concepts: ["sums-within-10"], difficulty: 3, context: "abstract",
      prompt: `Fill in the blank: $${a} + \\underline{\\;\\;} = ${total}$`,
      steps: [{ instruction: "What number completes the sum?", answer: `${b}`, accept: [], hint: `How far is it from ${a} up to ${total}?` }],
      finalAnswer: { value: `${b}`, unit: "" },
      solutionNarrative: `From ${a} up to ${total} is ${b}, so $${a} + ${b} = ${total}$. A missing addend is a subtraction in disguise: $${total} - ${a} = ${b}$.`,
    };
  }
  const a = rng.int(1, 4), b = rng.int(1, 4), c = rng.int(1, Math.min(4, 10 - a - b < 1 ? 1 : 10 - a - b));
  return {
    id: `gen.ari-sums10-d3.${idx}`, generated: true, concepts: ["sums-within-10"], difficulty: 3, context: "abstract",
    prompt: `${rng.pick(ADD_ASK)} $${a} + ${b} + ${c}$`,
    steps: [{ instruction: "Add all three.", answer: `${a + b + c}`, accept: [], hint: `Group an easy pair first, e.g. $${a} + ${b} = ${a + b}$.` }],
    finalAnswer: { value: `${a + b + c}`, unit: "" },
    solutionNarrative: `Group a friendly pair: $${a} + ${b} = ${a + b}$, then $${a + b} + ${c} = ${a + b + c}$.`,
  };
};

// --- crossing-ten d1: 9 + n (the easiest make-a-ten) ------------------------
fill["ari-cross10-d1"] = (rng, idx) => {
  const n = rng.int(2, 9);
  const flip = rng.pick([true, false]);
  const [a, b] = flip ? [n, 9] : [9, n];
  return {
    id: `gen.ari-cross10-d1.${idx}`, generated: true, concepts: ["crossing-ten"], difficulty: 1, context: "abstract",
    prompt: `${rng.pick(ADD_ASK)} $${a} + ${b}$`,
    steps: [{ instruction: "Give the sum.", answer: `${a + b}`, accept: [], hint: `Move 1 over: $9 + ${n} = 10 + ${n - 1}$.` }],
    finalAnswer: { value: `${a + b}`, unit: "" },
    solutionNarrative: `Make a ten: take 1 from ${n} to turn 9 into 10, leaving ${n - 1}. So $${a} + ${b} = 10 + ${n - 1} = ${9 + n}$.`,
  };
};

// --- crossing-ten d2: 6..8 + 6..9, sum > 10 ---------------------------------
fill["ari-cross10-d2"] = (rng, idx) => {
  const a = rng.int(6, 8), b = rng.int(Math.max(6, 11 - a), 9); // guarantee a+b >= 11
  const need = 10 - a;
  return {
    id: `gen.ari-cross10-d2.${idx}`, generated: true, concepts: ["crossing-ten"], difficulty: 2, context: "abstract",
    prompt: `${rng.pick(ADD_ASK)} $${a} + ${b}$`,
    steps: [{ instruction: "Give the sum.", answer: `${a + b}`, accept: [], hint: `Make a ten: $${a}$ needs $${need}$ more, and $${b} = ${need} + ${b - need}$.` }],
    finalAnswer: { value: `${a + b}`, unit: "" },
    solutionNarrative: `Make a ten: split $${b}$ as $${need} + ${b - need}$. Then $${a} + ${need} = 10$ and $10 + ${b - need} = ${a + b}$.`,
  };
};

// --- crossing-ten d3: missing addend in the teens ---------------------------
fill["ari-cross10-d3"] = (rng, idx) => {
  const a = rng.int(5, 9), b = rng.int(Math.max(4, 12 - a), 9); // sum 12..18
  const total = a + b;
  const applied = rng.pick([true, false]);
  const ctx = rng.pick(["points", "tickets", "shells", "beads"]);
  const prompt = applied
    ? `You need ${total} ${ctx} and already have ${a}. How many more do you need?`
    : `Fill in the blank: $\\underline{\\;\\;} + ${a} = ${total}$`;
  return {
    id: `gen.ari-cross10-d3.${idx}`, generated: true, concepts: ["crossing-ten"], difficulty: 3, context: applied ? "applied" : "abstract",
    prompt,
    steps: [{ instruction: "What number makes the total?", answer: `${b}`, accept: [], hint: `Go up to ten first: ${a} needs ${10 - a} to reach 10, then ${total - 10} more.` }],
    finalAnswer: { value: `${b}`, unit: applied ? ctx : "" },
    solutionNarrative: `Bridge through ten: from ${a} up to 10 is ${10 - a}, and from 10 up to ${total} is ${total - 10}. Together that's $${10 - a} + ${total - 10} = ${b}$.`,
  };
};

// --- two-digit-mental d1: two-digit + one-digit, no carry -------------------
fill["ari-twodigit-d1"] = (rng, idx) => {
  const tens = rng.int(2, 8), ones = rng.int(1, 5), add = rng.int(1, 9 - ones); // no carry
  const a = tens * 10 + ones;
  return {
    id: `gen.ari-twodigit-d1.${idx}`, generated: true, concepts: ["two-digit-mental"], difficulty: 1, context: "abstract",
    prompt: `${rng.pick(ADD_ASK)} $${a} + ${add}$`,
    steps: [{ instruction: "Give the sum.", answer: `${a + add}`, accept: [], hint: `Only the ones digit changes: $${ones} + ${add} = ${ones + add}$.` }],
    finalAnswer: { value: `${a + add}`, unit: "" },
    solutionNarrative: `The tens stay put: $${ones} + ${add} = ${ones + add}$, so $${a} + ${add} = ${a + add}$.`,
  };
};

// --- two-digit-mental d2: carry over the ten, or add whole tens -------------
fill["ari-twodigit-d2"] = (rng, idx) => {
  if (rng.pick(["carry", "tens"]) === "carry") {
    const tens = rng.int(2, 7), ones = rng.int(5, 9), add = rng.int(11 - ones, 9); // forces a carry
    const a = tens * 10 + ones;
    return {
      id: `gen.ari-twodigit-d2.${idx}`, generated: true, concepts: ["two-digit-mental"], difficulty: 2, context: "abstract",
      prompt: `${rng.pick(ADD_ASK)} $${a} + ${add}$`,
      steps: [{ instruction: "Give the sum.", answer: `${a + add}`, accept: [], hint: `Bridge the ten: $${a} + ${10 - ones} = ${(tens + 1) * 10}$, then add ${add - (10 - ones)} more.` }],
      finalAnswer: { value: `${a + add}`, unit: "" },
      solutionNarrative: `Bridge to the next ten: $${a} + ${10 - ones} = ${(tens + 1) * 10}$, and the remaining $${add - (10 - ones)}$ gives $${a + add}$.`,
    };
  }
  const a = rng.int(2, 6) * 10 + rng.int(1, 9), add = rng.int(2, 5) * 10;
  return {
    id: `gen.ari-twodigit-d2.${idx}`, generated: true, concepts: ["two-digit-mental"], difficulty: 2, context: "abstract",
    prompt: `${rng.pick(ADD_ASK)} $${a} + ${add}$`,
    steps: [{ instruction: "Give the sum.", answer: `${a + add}`, accept: [], hint: "Only the tens digit changes." }],
    finalAnswer: { value: `${a + add}`, unit: "" },
    solutionNarrative: `Adding whole tens leaves the ones alone: $${a} + ${add} = ${a + add}$.`,
  };
};

// --- two-digit-mental d3: two-digit + two-digit with carry ------------------
fill["ari-twodigit-d3"] = (rng, idx) => {
  const aT = rng.int(2, 5), aO = rng.int(4, 9);
  const bT = rng.int(1, 4), bO = rng.int(11 - aO, 9); // ones always carry
  const a = aT * 10 + aO, b = bT * 10 + bO;
  const applied = rng.pick([true, false]);
  const ctx = rng.pick(["pages read", "minutes practiced", "steps climbed"]);
  const prompt = applied
    ? `Yesterday: ${a} ${ctx}. Today: ${b}. What's the two-day total?`
    : `${rng.pick(ADD_ASK)} $${a} + ${b}$ (in your head — add tens, then ones).`;
  const compensate = bO === 9 || bO === 8;
  const hint = compensate
    ? `Compensate: $${b}$ is $${(bT + 1) * 10} - ${(bT + 1) * 10 - b}$, so add $${(bT + 1) * 10}$ and take back ${(bT + 1) * 10 - b}.`
    : `Add tens first: $${a} + ${bT * 10} = ${a + bT * 10}$, then the ${bO} ones.`;
  return {
    id: `gen.ari-twodigit-d3.${idx}`, generated: true, concepts: ["two-digit-mental"], difficulty: 3, context: applied ? "applied" : "abstract",
    prompt,
    steps: [{ instruction: "Give the total.", answer: `${a + b}`, accept: [], hint }],
    finalAnswer: { value: `${a + b}`, unit: "" },
    solutionNarrative: `Tens first: $${a} + ${bT * 10} = ${a + bT * 10}$. Then the ones: $${a + bT * 10} + ${bO} = ${a + b}$.`,
  };
};

// ============================================================================
// arithmetic.multiplication-tables
// ============================================================================

// --- tables-2-5 d1: the 2s and 5s -------------------------------------------
fill["ari-t25-d1"] = (rng, idx) => {
  const t = rng.pick([2, 5]), n = rng.int(2, 9);
  const flip = rng.pick([true, false]);
  const [a, b] = flip ? [n, t] : [t, n];
  const hint = t === 2 ? `Double it: $${n} + ${n}$.` : `Skip-count by fives: every answer ends in 0 or 5.`;
  return {
    id: `gen.ari-t25-d1.${idx}`, generated: true, concepts: ["tables-2-5"], difficulty: 1, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: t === 2
      ? `Times 2 is doubling: $${n} + ${n} = ${2 * n}$.`
      : `Count by fives ${n} times: $5 \\times ${n} = ${5 * n}$ — it ends in ${(5 * n) % 10 === 0 ? "0" : "5"}, like every multiple of 5.`,
  };
};

// --- tables-2-5 d2: the 3s and 4s -------------------------------------------
fill["ari-t25-d2"] = (rng, idx) => {
  const t = rng.pick([3, 4]), n = rng.int(3, 9);
  const flip = rng.pick([true, false]);
  const [a, b] = flip ? [n, t] : [t, n];
  const hint = t === 4 ? `Double twice: $${n} \\to ${2 * n} \\to ${4 * n}$.` : `Triple it: $${n} + ${n} + ${n}$, or $2\\times${n}$ plus one more ${n}.`;
  return {
    id: `gen.ari-t25-d2.${idx}`, generated: true, concepts: ["tables-2-5"], difficulty: 2, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: t === 4
      ? `Times 4 is double-double: $${n} \\to ${2 * n} \\to ${4 * n}$.`
      : `Times 3 is double plus one more: $2 \\times ${n} = ${2 * n}$, then $${2 * n} + ${n} = ${3 * n}$.`,
  };
};

// --- tables-2-5 d3: missing factor / applied groups -------------------------
fill["ari-t25-d3"] = (rng, idx) => {
  const t = rng.int(2, 5), n = rng.int(4, 9);
  if (rng.pick(["missing", "applied"]) === "missing") {
    return {
      id: `gen.ari-t25-d3.${idx}`, generated: true, concepts: ["tables-2-5"], difficulty: 3, context: "abstract",
      prompt: `Fill in the blank: $${t} \\times \\underline{\\;\\;} = ${t * n}$`,
      steps: [{ instruction: "What factor completes it?", answer: `${n}`, accept: [], hint: `How many ${t}s make ${t * n}? Skip-count by ${t}.` }],
      finalAnswer: { value: `${n}`, unit: "" },
      solutionNarrative: `Ask "how many ${t}s in ${t * n}?" — that's division in disguise: $${t * n} \\div ${t} = ${n}$.`,
    };
  }
  const thing = rng.pick(["packs of gum with", "boxes of crayons with", "bags of apples with", "rows of chairs with"]);
  return {
    id: `gen.ari-t25-d3.${idx}`, generated: true, concepts: ["tables-2-5"], difficulty: 3, context: "applied",
    prompt: `There are ${n} ${thing} ${t} in each. How many in total?`,
    steps: [{ instruction: "Give the total.", answer: `${t * n}`, accept: [], hint: `${n} groups of ${t} is $${n} \\times ${t}$.` }],
    finalAnswer: { value: `${t * n}`, unit: "" },
    solutionNarrative: `${n} equal groups of ${t} means $${n} \\times ${t} = ${t * n}$.`,
  };
};

// --- tables-6-9 d1: 6..9 times a small factor --------------------------------
fill["ari-t69-d1"] = (rng, idx) => {
  const t = rng.int(6, 9), n = rng.int(2, 5);
  const flip = rng.pick([true, false]);
  const [a, b] = flip ? [n, t] : [t, n];
  return {
    id: `gen.ari-t69-d1.${idx}`, generated: true, concepts: ["tables-6-9"], difficulty: 1, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint: `Same as $${n} \\times ${t}$ — use the smaller table you already know.` }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: `Order doesn't matter: $${t} \\times ${n} = ${n} \\times ${t} = ${t * n}$. Half the big tables are already in the small ones.`,
  };
};

// --- tables-6-9 d2: the hard core, 6..9 × 6..9 -------------------------------
fill["ari-t69-d2"] = (rng, idx) => {
  const a = rng.int(6, 9), b = rng.int(6, 9);
  const hint = a === 9 || b === 9
    ? `Nines trick: $9 \\times n = 10n - n$.`
    : `Break one factor up: $${a} \\times ${b} = ${a} \\times 5 + ${a} \\times ${b - 5}$.`;
  return {
    id: `gen.ari-t69-d2.${idx}`, generated: true, concepts: ["tables-6-9"], difficulty: 2, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: (a === 9 || b === 9)
      ? `Use the nines shortcut: $9 \\times ${a === 9 ? b : a} = ${10 * (a === 9 ? b : a)} - ${a === 9 ? b : a} = ${a * b}$.`
      : `Split through 5: $${a} \\times 5 = ${a * 5}$ and $${a} \\times ${b - 5} = ${a * (b - 5)}$; together $${a * 5} + ${a * (b - 5)} = ${a * b}$.`,
  };
};

// --- tables-6-9 d3: missing factor -------------------------------------------
fill["ari-t69-d3"] = (rng, idx) => {
  const t = rng.int(6, 9), n = rng.int(4, 9);
  const applied = rng.pick([true, false]);
  const ctx = rng.pick(["teams of", "rows of", "vans seating", "groups of"]);
  const prompt = applied
    ? `${t * n} people split into ${ctx} ${t}. How many ${ctx.split(" ")[0]} are there?`
    : `Fill in the blank: $${t} \\times \\underline{\\;\\;} = ${t * n}$`;
  return {
    id: `gen.ari-t69-d3.${idx}`, generated: true, concepts: ["tables-6-9"], difficulty: 3, context: applied ? "applied" : "abstract",
    prompt,
    steps: [{ instruction: "What is the missing factor?", answer: `${n}`, accept: [], hint: `Which entry of the ${t}s table equals ${t * n}?` }],
    finalAnswer: { value: `${n}`, unit: "" },
    solutionNarrative: `A missing factor is a division: $${t * n} \\div ${t} = ${n}$, because $${t} \\times ${n} = ${t * n}$.`,
  };
};

// --- tables-10-12 d1: 10s and 11s --------------------------------------------
fill["ari-t1012-d1"] = (rng, idx) => {
  const t = rng.pick([10, 11]), n = rng.int(2, 9);
  const flip = rng.pick([true, false]);
  const [a, b] = flip ? [n, t] : [t, n];
  const hint = t === 10 ? "Append a zero." : `Elevens repeat the digit: $11 \\times ${n} = ${n}${n}$.`;
  return {
    id: `gen.ari-t1012-d1.${idx}`, generated: true, concepts: ["tables-10-12"], difficulty: 1, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: t === 10
      ? `Times 10 shifts the digit up a place: $${n} \\times 10 = ${10 * n}$.`
      : `Single digits repeat under 11: $11 \\times ${n} = ${11 * n}$.`,
  };
};

// --- tables-10-12 d2: the 12s (and 11 × 10..12) ------------------------------
fill["ari-t1012-d2"] = (rng, idx) => {
  const kind = rng.pick(["twelve", "elevenBig"]);
  const [a, b] = kind === "twelve" ? [12, rng.int(3, 12)] : [11, rng.int(10, 12)];
  const hint = kind === "twelve"
    ? `Split 12 as 10 + 2: $10 \\times ${b} + 2 \\times ${b}$.`
    : `Split 11 as 10 + 1: $10 \\times ${b} + ${b}$.`;
  return {
    id: `gen.ari-t1012-d2.${idx}`, generated: true, concepts: ["tables-10-12"], difficulty: 2, context: "abstract",
    prompt: `${rng.pick(MUL_ASK)} $${a} \\times ${b}$`,
    steps: [{ instruction: "Give the product.", answer: `${a * b}`, accept: [], hint }],
    finalAnswer: { value: `${a * b}`, unit: "" },
    solutionNarrative: `Split off the ten: $${a} \\times ${b} = 10 \\times ${b} + ${a - 10} \\times ${b} = ${10 * b} + ${(a - 10) * b} = ${a * b}$.`,
  };
};

// --- tables-10-12 d3: missing factor / dozens applied ------------------------
fill["ari-t1012-d3"] = (rng, idx) => {
  const t = rng.pick([11, 12]), n = rng.int(4, 12);
  if (rng.pick(["missing", "applied"]) === "missing") {
    return {
      id: `gen.ari-t1012-d3.${idx}`, generated: true, concepts: ["tables-10-12"], difficulty: 3, context: "abstract",
      prompt: `Fill in the blank: $${t} \\times \\underline{\\;\\;} = ${t * n}$`,
      steps: [{ instruction: "What is the missing factor?", answer: `${n}`, accept: [], hint: `Try $10 \\times n$ first — it gets you most of the way to ${t * n}.` }],
      finalAnswer: { value: `${n}`, unit: "" },
      solutionNarrative: `$${t} \\times ${n} = ${10 * n} + ${(t - 10) * n} = ${t * n}$, so the missing factor is ${n} ($${t * n} \\div ${t} = ${n}$).`,
    };
  }
  const thing = rng.pick(["eggs", "muffins", "donuts", "pencils"]);
  return {
    id: `gen.ari-t1012-d3.${idx}`, generated: true, concepts: ["tables-10-12"], difficulty: 3, context: "applied",
    prompt: `A dozen is 12. How many ${thing} are in ${n} dozen?`,
    steps: [{ instruction: "Give the total.", answer: `${12 * n}`, accept: [], hint: `$12 \\times ${n} = 10 \\times ${n} + 2 \\times ${n}$.` }],
    finalAnswer: { value: `${12 * n}`, unit: thing },
    solutionNarrative: `$12 \\times ${n} = ${10 * n} + ${2 * n} = ${12 * n}$ ${thing}. Dozens are the 12s table in the wild.`,
  };
};
