// gen-crypto3-fill.js
// Parametric generators for the Cryptography subject, topics
//   cryptography.aes-finite-fields  (symmetric ciphers / GF(2^8))
//   cryptography.ecc                (elliptic curve cryptography)
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry (merged via
// Object.assign like gen-de-fill.js / gen-linalg-fill.js). Template prefix: cr3-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact.

// ---------------------------------------------------------------------------
// helpers: bits & GF(2^8)
// ---------------------------------------------------------------------------
const bin = (n) => n.toString(2);
const bin8 = (n) => n.toString(2).padStart(8, "0");
const xtime = (b) => { const t = b << 1; return t >= 256 ? t ^ 0x11b : t; };
// byte -> GF(2) polynomial string, descending powers, already mod-2 reduced.
const polyOf = (n) => {
  const t = [];
  for (let i = 7; i >= 0; i--) if (n & (1 << i)) t.push(i === 0 ? "1" : i === 1 ? "x" : `x^${i}`);
  return t.join(" + ") || "0";
};
const popcount = (n) => { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; };

// ---------------------------------------------------------------------------
// helpers: elliptic curves over small prime fields
// ---------------------------------------------------------------------------
const mod = (n, p) => ((n % p) + p) % p;
const minv = (n, p) => { n = mod(n, p); for (let i = 1; i < p; i++) if ((n * i) % p === 1) return i; return null; };
// chord addition detail (P != Q, x1 != x2)
const addDetail = (P, Q, p) => {
  const [x1, y1] = P, [x2, y2] = Q;
  const rawNum = y2 - y1, rawDen = x2 - x1;
  const num = mod(rawNum, p), den = mod(rawDen, p);
  const deninv = minv(den, p);
  const lam = mod(num * deninv, p);
  const x3 = mod(lam * lam - x1 - x2, p);
  const y3 = mod(lam * (x1 - x3) - y1, p);
  return { num, den, rawNum, rawDen, deninv, lam, x3, y3 };
};
// tangent doubling detail (y1 != 0)
const dblDetail = (P, a, p) => {
  const [x1, y1] = P;
  const rawNum = 3 * x1 * x1 + a, rawDen = 2 * y1;
  const num = mod(rawNum, p), den = mod(rawDen, p);
  const deninv = minv(den, p);
  const lam = mod(num * deninv, p);
  const x3 = mod(lam * lam - 2 * x1, p);
  const y3 = mod(lam * (x1 - x3) - y1, p);
  return { num, den, rawNum, rawDen, deninv, lam, x3, y3 };
};
const tup = (P) => `(${P[0]}, ${P[1]})`;

// Curated toy curves. `mult[k-1]` is kG; group order includes O.
// All tables machine-computed (brute force over the curve group).
const C11 = { a: 1, b: 6, p: 11, order: 13, mult: [[2, 7], [5, 2], [8, 3], [10, 2], [3, 6], [7, 9], [7, 2], [3, 5], [10, 9], [8, 8], [5, 9], [2, 4]] };
const C13 = { a: 3, b: 8, p: 13, order: 9, mult: [[1, 8], [2, 3], [9, 6], [12, 11], [12, 2], [9, 7], [2, 10], [1, 5]] };
const C17 = { a: 2, b: 2, p: 17, order: 19, mult: [[5, 1], [6, 3], [10, 6], [3, 1], [9, 16], [16, 13], [0, 6], [13, 7], [7, 6], [7, 11], [13, 10], [0, 11], [16, 4], [9, 1], [3, 16], [10, 11], [6, 14], [5, 16]] };
const C23pts = [[0, 1], [1, 7], [3, 10], [5, 4], [6, 4], [7, 11], [9, 7], [11, 3], [12, 4], [13, 7], [17, 3], [18, 3], [19, 5]]; // y != 0, on y^2 = x^3 + x + 1 mod 23
const curveEq = (c) => `y^2 \\equiv x^3 + ${c.a === 1 ? "" : c.a}x + ${c.b} \\pmod{${c.p}}`;
const multTable = (c, n) => c.mult.slice(0, n).map((P, i) => `${i + 1}G = ${tup(P)}`).join(", \\; ");

export const fill = {};

// ===========================================================================
// TOPIC A: cryptography.aes-finite-fields
// ===========================================================================

// --- xor-and-otp ---
fill["cr3-xor-d1"] = (rng, idx) => {
  let a = rng.int(3, 15), b = rng.int(3, 15);
  while (b === a) b = rng.int(3, 15);
  const x = a ^ b;
  return {
    id: `gen.cr3-xor-d1.${idx}`, generated: true, concepts: ["xor-and-otp"], difficulty: 1, context: "abstract",
    prompt: `Compute the bitwise XOR $${a} \\oplus ${b}$ of the 4-bit values ${a} and ${b}.`,
    steps: [
      { instruction: `Write ${a} in binary (4 bits).`, answer: a.toString(2).padStart(4, "0"), accept: [bin(a)], hint: `Split ${a} into powers of 2: 8, 4, 2, 1.` },
      { instruction: `Write ${b} in binary (4 bits).`, answer: b.toString(2).padStart(4, "0"), accept: [bin(b)], hint: `Split ${b} into powers of 2: 8, 4, 2, 1.` },
      { instruction: `XOR the two bit strings column by column (1 where the bits differ, 0 where they match) and give the result as a DECIMAL number.`, answer: `${x}`, accept: [x.toString(2).padStart(4, "0")], hint: "Each column is addition mod 2: 1+1 = 0 with no carry." },
    ],
    finalAnswer: { value: `${x}`, unit: "" }, solutionNarrative: `$${a} = ${a.toString(2).padStart(4, "0")}_2$ and $${b} = ${b.toString(2).padStart(4, "0")}_2$; XOR each column to get $${x.toString(2).padStart(4, "0")}_2 = ${x}$.`,
  };
};
fill["cr3-xor-d2"] = (rng, idx) => {
  const M = rng.int(65, 90);            // a letter byte
  const K = rng.int(100, 250);          // keystream byte
  const C = M ^ K;
  return {
    id: `gen.cr3-xor-d2.${idx}`, generated: true, concepts: ["xor-and-otp"], difficulty: 2, context: "applied",
    prompt: `A one-time pad encrypts one plaintext byte $M = ${M}$ with the key byte $K = ${K}$ by XOR: $C = M \\oplus K$. (In binary: $M = ${bin8(M)}$, $K = ${bin8(K)}$.)`,
    steps: [
      { instruction: "Compute the ciphertext byte $C = M \\oplus K$. Give a DECIMAL number.", answer: `${C}`, accept: [bin8(C)], hint: "XOR the two 8-bit strings column by column, then convert back to decimal." },
      { instruction: "The receiver computes $C \\oplus K$ to decrypt. What byte comes out? (Decimal.)", answer: `${M}`, accept: [bin8(M)], hint: "XOR with the same value twice cancels: $(M \\oplus K) \\oplus K = M$." },
    ],
    finalAnswer: { value: `${M}`, unit: "" }, solutionNarrative: `$C = ${M} \\oplus ${K} = ${C}$. Decryption is the same operation: $${C} \\oplus ${K} = ${M}$, because XOR-ing with $K$ twice cancels out.`,
  };
};
fill["cr3-xor-d3"] = (rng, idx) => {
  const M1 = rng.int(65, 90), K = rng.int(128, 255);
  let M2 = rng.int(65, 90);
  while (M2 === M1) M2 = rng.int(65, 90);
  const C1 = M1 ^ K, C2 = M2 ^ K, D = C1 ^ C2;
  return {
    id: `gen.cr3-xor-d3.${idx}`, generated: true, concepts: ["xor-and-otp"], difficulty: 3, context: "applied",
    prompt: `An operator reuses a one-time-pad key byte $K$ on two messages: $C_1 = M_1 \\oplus K = ${C1}$ and $C_2 = M_2 \\oplus K = ${C2}$. An analyst learns (from a predictable header) that $M_1 = ${M1}$. Recover the key and the second message. All answers in DECIMAL.`,
    steps: [
      { instruction: "First, XOR the two ciphertexts: $C_1 \\oplus C_2$. (The key cancels, leaving $M_1 \\oplus M_2$.)", answer: `${D}`, accept: [bin8(D)], hint: "$(M_1 \\oplus K) \\oplus (M_2 \\oplus K) = M_1 \\oplus M_2$ — the $K$'s cancel." },
      { instruction: "Recover the key: $K = C_1 \\oplus M_1$.", answer: `${K}`, accept: [bin8(K)], hint: `XOR $${C1}$ with the known plaintext $${M1}$.` },
      { instruction: "Recover the second message: $M_2 = C_2 \\oplus K$.", answer: `${M2}`, accept: [bin8(M2)], hint: `XOR $${C2}$ with the key you just found.` },
    ],
    finalAnswer: { value: `${M2}`, unit: "" }, solutionNarrative: `$C_1 \\oplus C_2 = ${D} = M_1 \\oplus M_2$ (key cancels). Then $K = ${C1} \\oplus ${M1} = ${K}$ and $M_2 = ${C2} \\oplus ${K} = ${M2}$. One known plaintext under a reused pad breaks everything.`,
  };
};

// --- bytes-as-polynomials ---
fill["cr3-b2p-d1"] = (rng, idx) => {
  let n = 0;
  while (popcount(n) < 3 || popcount(n) > 5) n = rng.int(19, 255);
  return {
    id: `gen.cr3-b2p-d1.${idx}`, generated: true, concepts: ["bytes-as-polynomials"], difficulty: 1, context: "abstract",
    prompt: `AES views the byte ${n} as an element of $GF(2^8)$: each bit becomes the coefficient of a power of $x$.`,
    steps: [
      { instruction: `Write ${n} in binary (8 bits).`, answer: bin8(n), accept: [bin(n)], hint: "Split into powers of 2: 128, 64, 32, 16, 8, 4, 2, 1." },
      { instruction: "Now write the byte as a polynomial in $x$: bit $i$ (counting from 0 on the right) contributes $x^i$.", answer: polyOf(n), accept: [], hint: "One term per 1-bit; e.g. bit 6 set contributes $x^6$, bit 0 contributes $1$." },
    ],
    finalAnswer: { value: polyOf(n), unit: "" }, solutionNarrative: `$${n} = ${bin8(n)}_2$, so the 1-bits give the polynomial $${polyOf(n)}$.`,
  };
};
fill["cr3-b2p-d2"] = (rng, idx) => {
  let n = 0;
  while (popcount(n) < 3 || popcount(n) > 5 || n < 128) n = rng.int(128, 255);
  let top = 7; while (!(n & (1 << top))) top--;
  return {
    id: `gen.cr3-b2p-d2.${idx}`, generated: true, concepts: ["bytes-as-polynomials"], difficulty: 2, context: "abstract",
    prompt: `A $GF(2^8)$ element is written as the polynomial $${polyOf(n)}$. Convert it back to a byte value.`,
    steps: [
      { instruction: `What is the decimal value of the leading term $x^{${top}}$ alone?`, answer: `${1 << top}`, accept: [`2^${top}`], hint: `$x^{${top}}$ stands for the bit worth $2^{${top}}$.` },
      { instruction: "Add up the decimal values of ALL the terms. What byte (decimal) does the polynomial represent?", answer: `${n}`, accept: [bin8(n)], hint: "Each term $x^i$ is worth $2^i$; the constant term 1 is worth 1." },
    ],
    finalAnswer: { value: `${n}`, unit: "" }, solutionNarrative: `Each $x^i$ is the bit worth $2^i$; the terms sum to ${n}.`,
  };
};
fill["cr3-b2p-d3"] = (rng, idx) => {
  let A = 0, B = 0;
  // require some overlapping bits so terms genuinely cancel, and a nonzero XOR
  while (popcount(A) < 3) A = rng.int(60, 255);
  while (popcount(B) < 3 || (A & B) === 0 || A === B) B = rng.int(60, 255);
  const S = A ^ B;
  const cancelled = A & B;
  return {
    id: `gen.cr3-b2p-d3.${idx}`, generated: true, concepts: ["bytes-as-polynomials"], difficulty: 3, context: "abstract",
    prompt: `In $GF(2^8)$, ADDITION of field elements is bitwise XOR — coefficients add mod 2, so matching terms cancel. Add the elements $A = ${A}$ ($${polyOf(A)}$) and $B = ${B}$ ($${polyOf(B)}$).`,
    steps: [
      { instruction: "How many terms cancel (appear in both polynomials)?", answer: `${popcount(cancelled)}`, accept: [], hint: "A term cancels when its bit is 1 in BOTH bytes, since $x^i + x^i = 2x^i \\equiv 0$ mod 2." },
      { instruction: "Compute the sum $A \\oplus B$ as a DECIMAL byte.", answer: `${S}`, accept: [bin8(S)], hint: `XOR the binary forms: $${bin8(A)} \\oplus ${bin8(B)}$.` },
      { instruction: "Write the sum as a (mod-2 reduced) polynomial in $x$.", answer: polyOf(S), accept: [], hint: "Convert your decimal answer's bits to powers of $x$." },
    ],
    finalAnswer: { value: `${S}`, unit: "" }, solutionNarrative: `Shared terms cancel (coefficients are mod 2), leaving $${polyOf(S)}$, i.e. the byte ${S}. Note ${A} + ${B} would be ${A + B} in ordinary arithmetic — field addition is NOT integer addition.`,
  };
};

// --- gf28-multiplication ---
fill["cr3-gf28-d1"] = (rng, idx) => {
  const b = rng.int(20, 127);
  return {
    id: `gen.cr3-gf28-d1.${idx}`, generated: true, concepts: ["gf28-multiplication"], difficulty: 1, context: "abstract",
    prompt: `Compute $\\texttt{xtime}(${b})$ — multiplication by $x$ in $GF(2^8)$. Rule: shift left one bit; if the result is 256 or more, XOR with 283 (the modulus byte pattern of $x^8+x^4+x^3+x+1$).`,
    steps: [
      { instruction: `First: is ${b} at least 128 (i.e. is bit 7 set, so the shift overflows)? Type 'yes' or 'no'.`, answer: "no", accept: [], hint: "128 is the threshold: below it, doubling stays inside one byte." },
      { instruction: `So no reduction is needed. What is $\\texttt{xtime}(${b})$? (Decimal.)`, answer: `${2 * b}`, accept: [bin8(2 * b)], hint: "Just double it." },
    ],
    finalAnswer: { value: `${2 * b}`, unit: "" }, solutionNarrative: `${b} < 128, so the left shift does not overflow: $\\texttt{xtime}(${b}) = ${2 * b}$.`,
  };
};
fill["cr3-gf28-d2"] = (rng, idx) => {
  const b = rng.int(128, 255);
  const raw = 2 * b, red = raw ^ 0x11b;
  return {
    id: `gen.cr3-gf28-d2.${idx}`, generated: true, concepts: ["gf28-multiplication"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\texttt{xtime}(${b})$ in $GF(2^8)$. Since $${b} \\ge 128$, the left shift overflows past $x^7$, so you must reduce by XOR-ing with 283 ($= 100011011_2$, the bit pattern of $x^8+x^4+x^3+x+1$).`,
    steps: [
      { instruction: `Shift first: what is $2 \\times ${b}$, before any reduction? (Decimal — it may exceed 255.)`, answer: `${raw}`, accept: [], hint: "Just double it; the 9-bit overflow is handled in the next step." },
      { instruction: `Now reduce: XOR your result with 283. What byte remains? (Decimal.)`, answer: `${red}`, accept: [bin8(red)], hint: `Write $${raw}$ and 283 in binary (9 bits each) and XOR column by column.` },
    ],
    finalAnswer: { value: `${red}`, unit: "" }, solutionNarrative: `$2 \\times ${b} = ${raw} \\ge 256$, so reduce: $${raw} \\oplus 283 = ${red}$. That XOR is exactly 'subtracting' the modulus polynomial $x^8+x^4+x^3+x+1$.`,
  };
};
fill["cr3-gf28-d3"] = (rng, idx) => {
  const b = rng.int(80, 255);
  const t = xtime(b), result = t ^ b;
  const overflow = b >= 128;
  const steps = [];
  if (overflow) {
    steps.push({ instruction: `Step 1 — $\\texttt{xtime}(${b})$: first shift. What is $2 \\times ${b}$ before reduction? (Decimal.)`, answer: `${2 * b}`, accept: [], hint: "Double it; reduction comes next." });
    steps.push({ instruction: `The shift overflowed ($\\ge 256$), so XOR with 283. What is $\\texttt{xtime}(${b})$? (Decimal.)`, answer: `${t}`, accept: [bin8(t)], hint: `$${2 * b} \\oplus 283$.` });
  } else {
    steps.push({ instruction: `Step 1 — compute $\\texttt{xtime}(${b})$. (${b} < 128, so no reduction is needed.) Decimal.`, answer: `${t}`, accept: [], hint: "Just double it." });
  }
  steps.push({ instruction: `Step 2 — since $3 = x + 1$, we have $3 \\cdot ${b} = \\texttt{xtime}(${b}) \\oplus ${b}$. Compute it. (Decimal.)`, answer: `${result}`, accept: [bin8(result)], hint: `XOR $${t}$ with $${b}$ bit by bit.` });
  return {
    id: `gen.cr3-gf28-d3.${idx}`, generated: true, concepts: ["gf28-multiplication"], difficulty: 3, context: "applied",
    prompt: `MixColumns multiplies state bytes by the constant 3 in $GF(2^8)$. Compute $3 \\cdot ${b}$ using the xtime trick: $3 \\cdot b = \\texttt{xtime}(b) \\oplus b$.`,
    steps,
    finalAnswer: { value: `${result}`, unit: "" }, solutionNarrative: `$\\texttt{xtime}(${b}) = ${t}$${overflow ? ` (after reducing $${2 * b} \\oplus 283$)` : ""}, then $3 \\cdot ${b} = ${t} \\oplus ${b} = ${result}$. This is exactly the per-byte arithmetic inside MixColumns.`,
  };
};

// --- aes-big-picture ---
fill["cr3-aes-d1"] = (rng, idx) => {
  const variants = [
    { bits: 128, rounds: 10 },
    { bits: 192, rounds: 12 },
    { bits: 256, rounds: 14 },
  ];
  const v = rng.pick(variants);
  return {
    id: `gen.cr3-aes-d1.${idx}`, generated: true, concepts: ["aes-big-picture"], difficulty: 1, context: "applied",
    prompt: `AES comes in three key sizes — 128, 192 and 256 bits — running 10, 12 and 14 rounds respectively. Each round applies SubBytes, ShiftRows, MixColumns and AddRoundKey.`,
    steps: [
      { instruction: `How many rounds does AES-${v.bits} run?`, answer: `${v.rounds}`, accept: [], hint: "128→10, 192→12, 256→14: two extra rounds per key-size step." },
      { instruction: "Which round step combines the round key with the state, using plain XOR? (SubBytes, ShiftRows, MixColumns, or AddRoundKey)", answer: "AddRoundKey", accept: [], hint: "The name says it: it's the only step that touches the key." },
    ],
    finalAnswer: { value: `${v.rounds}`, unit: "rounds" }, solutionNarrative: `AES-${v.bits} runs ${v.rounds} rounds; AddRoundKey is the XOR-the-key step (and the only key-dependent one).`,
  };
};
fill["cr3-aes-d2"] = (rng, idx) => {
  const pool = [
    { desc: "multiplies each state column by a fixed matrix, using $GF(2^8)$ multiplication by the constants 2 and 3", ans: "MixColumns" },
    { desc: "replaces each byte via an S-box built from INVERSION in $GF(2^8)$ — the only nonlinear step", ans: "SubBytes" },
    { desc: "is a pure permutation: it just rotates the bytes within each row, moving no values through any arithmetic", ans: "ShiftRows" },
    { desc: "XORs the round key into the state — bitwise addition in $GF(2)$", ans: "AddRoundKey" },
  ];
  const i = rng.int(0, 3);
  let j = rng.int(0, 3);
  while (j === i) j = rng.int(0, 3);
  return {
    id: `gen.cr3-aes-d2.${idx}`, generated: true, concepts: ["aes-big-picture"], difficulty: 2, context: "applied",
    prompt: `Match AES round steps to their math. The four steps are SubBytes, ShiftRows, MixColumns, AddRoundKey.`,
    steps: [
      { instruction: `Which step ${pool[i].desc}?`, answer: pool[i].ans, accept: [], hint: "SubBytes = S-box inversion; ShiftRows = permutation; MixColumns = matrix over $GF(2^8)$; AddRoundKey = XOR." },
      { instruction: `Which step ${pool[j].desc}?`, answer: pool[j].ans, accept: [], hint: "SubBytes = S-box inversion; ShiftRows = permutation; MixColumns = matrix over $GF(2^8)$; AddRoundKey = XOR." },
      { instruction: "Which of the four steps is the ONLY nonlinear one (the cipher would be linear algebra homework without it)?", answer: "SubBytes", accept: [], hint: "Field inversion $b \\mapsto b^{-1}$ is not a linear map." },
    ],
    finalAnswer: { value: "SubBytes", unit: "" }, solutionNarrative: `MixColumns is the $GF(2^8)$ matrix multiply, SubBytes the inversion-based S-box (the only nonlinearity), ShiftRows the permutation, AddRoundKey the key XOR.`,
  };
};
fill["cr3-aes-d3"] = (rng, idx) => {
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const pairs = [[256, 128], [192, 128], [256, 192], [128, 64]];
    const [a, b] = rng.pick(pairs);
    return {
      id: `gen.cr3-aes-d3.${idx}`, generated: true, concepts: ["aes-big-picture"], difficulty: 3, context: "applied",
      prompt: `Keyspace arithmetic: an exhaustive attack on a $${a}$-bit key tries up to $2^{${a}}$ keys; on a $${b}$-bit key, $2^{${b}}$.`,
      steps: [
        { instruction: `The ratio $2^{${a}} / 2^{${b}}$ is itself a power of two, $2^k$. What is $k$?`, answer: `${a - b}`, accept: [], hint: "Dividing powers subtracts exponents." },
        { instruction: `So going from a ${b}-bit key to a ${a}-bit key multiplies the attacker's work by $2^k$. If ADDING ONE bit doubles the keyspace, how many doublings is that?`, answer: `${a - b}`, accept: [], hint: "Each extra bit is one doubling." },
      ],
      finalAnswer: { value: `${a - b}`, unit: "" }, solutionNarrative: `$2^{${a}}/2^{${b}} = 2^{${a - b}}$: ${a - b} extra bits means ${a - b} doublings of the search space.`,
    };
  }
  if (kind === 1) {
    const n = rng.pick([128, 192, 256]);
    return {
      id: `gen.cr3-aes-d3.${idx}`, generated: true, concepts: ["aes-big-picture"], difficulty: 3, context: "applied",
      prompt: `Grover's quantum search algorithm finds a $2^n$-key brute-force target in about $\\sqrt{2^n} = 2^{n/2}$ steps. Consider AES-${n}.`,
      steps: [
        { instruction: `Against a quantum attacker running Grover, AES-${n}'s effective security drops to $2^k$ steps. What is $k$?`, answer: `${n / 2}`, accept: [], hint: "$\\sqrt{2^n} = 2^{n/2}$: halve the exponent." },
        { instruction: `Is $2^{${n / 2}}$ still considered computationally infeasible today (the usual bar is $2^{128}$ or more)? Type 'yes' or 'no'.`, answer: n / 2 >= 128 ? "yes" : "no", accept: [], hint: "Compare the exponent to 128." },
      ],
      finalAnswer: { value: `${n / 2}`, unit: "" }, solutionNarrative: `Grover halves the exponent: AES-${n} gives $2^{${n / 2}}$ post-quantum. ${n / 2 >= 128 ? "That clears the $2^{128}$ bar — which is exactly why AES-256 is called post-quantum comfortable." : "That is below the $2^{128}$ bar, which is why AES-128 is the variant people worry about long-term."}`,
    };
  }
  const pairs = [[128, 128], [128, 64], [192, 64], [64, 64]];
  const [a, b] = rng.pick(pairs);
  return {
    id: `gen.cr3-aes-d3.${idx}`, generated: true, concepts: ["aes-big-picture"], difficulty: 3, context: "applied",
    prompt: `Two independent secrets of $${a}$ and $${b}$ bits are combined into one key (their bits concatenated). An attacker must guess both.`,
    steps: [
      { instruction: `The total keyspace is $2^{${a}} \\cdot 2^{${b}} = 2^k$. What is $k$?`, answer: `${a + b}`, accept: [], hint: "Multiplying powers adds exponents." },
    ],
    finalAnswer: { value: `${a + b}`, unit: "" }, solutionNarrative: `$2^{${a}} \\cdot 2^{${b}} = 2^{${a + b}}$ — independent choices multiply, exponents add.`,
  };
};

// ===========================================================================
// TOPIC B: cryptography.ecc
// ===========================================================================

// --- curve-membership ---
const membershipGen = (rng, idx, c, diff, tpl) => {
  // half the time serve a true curve point, half a random candidate
  let x, y;
  if (rng.int(0, 1) === 0) { const P = rng.pick(c.mult); x = P[0]; y = P[1]; }
  else { x = rng.int(0, c.p - 1); y = rng.int(1, c.p - 1); }
  const lhs = mod(y * y, c.p), rhs = mod(x * x * x + c.a * x + c.b, c.p);
  const on = lhs === rhs;
  return {
    id: `gen.${tpl}.${idx}`, generated: true, concepts: ["curve-membership"], difficulty: diff, context: "abstract",
    prompt: `Is the point $(${x}, ${y})$ on the elliptic curve $${curveEq(c)}$?`,
    steps: [
      { instruction: `Compute the left side: $y^2 = ${y}^2 \\bmod ${c.p}$. (Give a value from 0 to ${c.p - 1}.)`, answer: `${lhs}`, accept: [], hint: `Square ${y}, then take the remainder on division by ${c.p}.` },
      { instruction: `Compute the right side: $x^3 + ${c.a === 1 ? "" : c.a}x + ${c.b} = ${x}^3 + ${c.a === 1 ? "" : c.a + " \\cdot "}${x} + ${c.b} \\bmod ${c.p}$.`, answer: `${rhs}`, accept: [], hint: `Cube ${x}, add ${c.a === 1 ? "" : c.a + " times "}${x} and ${c.b}, then reduce mod ${c.p}.` },
      { instruction: "Do the two sides match — is the point on the curve? Type 'yes' or 'no'.", answer: on ? "yes" : "no", accept: [], hint: "The point is on the curve exactly when both sides give the same residue." },
    ],
    finalAnswer: { value: on ? "yes" : "no", unit: "" }, solutionNarrative: `$y^2 \\equiv ${lhs}$ and $x^3 + ${c.a}x + ${c.b} \\equiv ${rhs} \\pmod{${c.p}}$ — ${on ? "equal, so the point IS on the curve." : "not equal, so the point is NOT on the curve."}`,
  };
};
fill["cr3-ecc-mem-d1"] = (rng, idx) => membershipGen(rng, idx, C11, 1, "cr3-ecc-mem-d1");
fill["cr3-ecc-mem-d2"] = (rng, idx) => membershipGen(rng, idx, C17, 2, "cr3-ecc-mem-d2");
fill["cr3-ecc-mem-d3"] = (rng, idx) => {
  const P = rng.pick(C23pts);
  const [x, y] = P;
  const rhs = mod(x * x * x + x + 1, 23);
  const other = 23 - y;
  return {
    id: `gen.cr3-ecc-mem-d3.${idx}`, generated: true, concepts: ["curve-membership"], difficulty: 3, context: "abstract",
    prompt: `On the curve $y^2 \\equiv x^3 + x + 1 \\pmod{23}$, consider the vertical line $x = ${x}$.`,
    steps: [
      { instruction: `Compute the right side at $x = ${x}$: $x^3 + x + 1 \\bmod 23$. (0 to 22.)`, answer: `${rhs}`, accept: [], hint: `${x}^3 + ${x} + 1, then reduce mod 23.` },
      { instruction: `Check: is $y = ${y}$ a solution of $y^2 \\equiv ${rhs} \\pmod{23}$? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: `Square ${y} and reduce mod 23.` },
      { instruction: `Square roots mod a prime come in pairs $y$ and $p - y$. What is the OTHER $y$-value on the curve at $x = ${x}$?`, answer: `${other}`, accept: [], hint: `Compute $23 - ${y}$.` },
    ],
    finalAnswer: { value: `${other}`, unit: "" }, solutionNarrative: `RHS $\\equiv ${rhs}$; both $y = ${y}$ and $y = ${other}$ square to it, since $(23-y)^2 \\equiv y^2$. Curve points off the x-axis always come in mirror pairs — that mirror is exactly the negative of a point.`,
  };
};

// --- point-addition ---
const chordPick = (rng, c) => {
  // pick i != j with i + j != order (avoids P + (-P) = O and equal x-coords)
  const n = c.mult.length;
  let i = rng.int(1, n), j = rng.int(1, n);
  while (j === i || i + j === c.order) j = rng.int(1, n);
  return [c.mult[i - 1], c.mult[j - 1], c.mult[((i + j) % c.order) - 1]];
};
fill["cr3-ecc-add-d1"] = (rng, idx) => {
  const c = C11;
  const [P, Q] = chordPick(rng, c);
  const d = addDetail(P, Q, c.p);
  return {
    id: `gen.cr3-ecc-add-d1.${idx}`, generated: true, concepts: ["point-addition"], difficulty: 1, context: "abstract",
    prompt: `Add the points $P = ${tup(P)}$ and $Q = ${tup(Q)}$ on $${curveEq(c)}$. The slope is $\\lambda = (y_2 - y_1)(x_2 - x_1)^{-1} \\bmod 11$. Helpful fact: $${d.den}^{-1} \\equiv ${d.deninv} \\pmod{11}$, because $${d.den} \\cdot ${d.deninv} \\equiv 1$.`,
    steps: [
      { instruction: `Compute the numerator $y_2 - y_1 \\bmod 11$. (0 to 10.)`, answer: `${d.num}`, accept: d.rawNum !== d.num ? [`${d.rawNum}`] : [], hint: `${Q[1]} - ${P[1]}, then add 11 if negative.` },
      { instruction: `Compute the slope $\\lambda = (y_2 - y_1) \\cdot ${d.deninv} \\bmod 11$.`, answer: `${d.lam}`, accept: [], hint: `Multiply ${d.num} by the given inverse ${d.deninv}, reduce mod 11.` },
      { instruction: `Compute $x_3 = \\lambda^2 - x_1 - x_2 \\bmod 11$.`, answer: `${d.x3}`, accept: [], hint: `${d.lam}^2 - ${P[0]} - ${Q[0]}, then reduce into 0..10.` },
      { instruction: `Compute $y_3 = \\lambda(x_1 - x_3) - y_1 \\bmod 11$.`, answer: `${d.y3}`, accept: [], hint: `${d.lam}(${P[0]} - ${d.x3}) - ${P[1]}, then reduce into 0..10.` },
      { instruction: `State the sum $P + Q$ as a point $(x_3, y_3)$.`, answer: `(${d.x3}, ${d.y3})`, accept: [], hint: "Combine your last two answers." },
    ],
    finalAnswer: { value: `(${d.x3}, ${d.y3})`, unit: "" }, solutionNarrative: `$\\lambda = ${d.num} \\cdot ${d.deninv} \\equiv ${d.lam}$, so $x_3 \\equiv ${d.lam}^2 - ${P[0]} - ${Q[0]} \\equiv ${d.x3}$ and $y_3 \\equiv ${d.lam}(${P[0]} - ${d.x3}) - ${P[1]} \\equiv ${d.y3} \\pmod{11}$.`,
  };
};
const addGenFull = (rng, idx, c, diff, tpl) => {
  const [P, Q] = chordPick(rng, c);
  const d = addDetail(P, Q, c.p);
  return {
    id: `gen.${tpl}.${idx}`, generated: true, concepts: ["point-addition"], difficulty: diff, context: "abstract",
    prompt: `Add $P = ${tup(P)}$ and $Q = ${tup(Q)}$ on $${curveEq(c)}$, computing the modular inverse yourself. All residues from 0 to ${c.p - 1}.`,
    steps: [
      { instruction: `Numerator: $y_2 - y_1 \\bmod ${c.p}$.`, answer: `${d.num}`, accept: d.rawNum !== d.num ? [`${d.rawNum}`] : [], hint: `${Q[1]} - ${P[1]}, adding ${c.p} if negative.` },
      { instruction: `Denominator: $x_2 - x_1 \\bmod ${c.p}$.`, answer: `${d.den}`, accept: d.rawDen !== d.den ? [`${d.rawDen}`] : [], hint: `${Q[0]} - ${P[0]}, adding ${c.p} if negative.` },
      { instruction: `Find the inverse: which value $v$ in 1..${c.p - 1} satisfies $${d.den} \\cdot v \\equiv 1 \\pmod{${c.p}}$?`, answer: `${d.deninv}`, accept: [], hint: `Try multiples: ${d.den}·1, ${d.den}·2, ... until one is $\\equiv 1$ mod ${c.p} (or use the extended Euclidean algorithm).` },
      { instruction: `Slope: $\\lambda = ${d.num} \\cdot ${d.deninv} \\bmod ${c.p}$.`, answer: `${d.lam}`, accept: [], hint: "Multiply and reduce." },
      { instruction: `$x_3 = \\lambda^2 - x_1 - x_2 \\bmod ${c.p}$.`, answer: `${d.x3}`, accept: [], hint: `${d.lam}^2 - ${P[0]} - ${Q[0]}, reduced.` },
      { instruction: `$y_3 = \\lambda(x_1 - x_3) - y_1 \\bmod ${c.p}$.`, answer: `${d.y3}`, accept: [], hint: `${d.lam}(${P[0]} - ${d.x3}) - ${P[1]}, reduced.` },
      { instruction: `State $P + Q$ as a point.`, answer: `(${d.x3}, ${d.y3})`, accept: [], hint: "Combine $x_3$ and $y_3$." },
    ],
    finalAnswer: { value: `(${d.x3}, ${d.y3})`, unit: "" }, solutionNarrative: `$\\lambda = ${d.num}/${d.den} \\equiv ${d.num} \\cdot ${d.deninv} \\equiv ${d.lam}$; then $x_3 = ${d.x3}$, $y_3 = ${d.y3}$: $P + Q = (${d.x3}, ${d.y3})$.`,
  };
};
fill["cr3-ecc-add-d2"] = (rng, idx) => addGenFull(rng, idx, C13, 2, "cr3-ecc-add-d2");
fill["cr3-ecc-add-d3"] = (rng, idx) => addGenFull(rng, idx, C17, 3, "cr3-ecc-add-d3");

// --- point-doubling-and-multiples ---
fill["cr3-ecc-dbl-d1"] = (rng, idx) => {
  const c = C11;
  const P = rng.pick(c.mult);
  const d = dblDetail(P, c.a, c.p);
  return {
    id: `gen.cr3-ecc-dbl-d1.${idx}`, generated: true, concepts: ["point-doubling-and-multiples"], difficulty: 1, context: "abstract",
    prompt: `Double the point $P = ${tup(P)}$ on $${curveEq(c)}$. The tangent slope is $\\lambda = (3x_1^2 + 1)(2y_1)^{-1} \\bmod 11$. Helpful fact: $${d.den}^{-1} \\equiv ${d.deninv} \\pmod{11}$.`,
    steps: [
      { instruction: `Numerator: $3x_1^2 + 1 = 3 \\cdot ${P[0]}^2 + 1 \\bmod 11$. (0 to 10.)`, answer: `${d.num}`, accept: d.rawNum !== d.num ? [`${d.rawNum}`] : [], hint: `Compute $3 \\cdot ${P[0] * P[0]} + 1$, then reduce mod 11.` },
      { instruction: `Slope: $\\lambda = ${d.num} \\cdot ${d.deninv} \\bmod 11$.`, answer: `${d.lam}`, accept: [], hint: "Multiply by the given inverse and reduce." },
      { instruction: `$x_3 = \\lambda^2 - 2x_1 \\bmod 11$.`, answer: `${d.x3}`, accept: [], hint: `${d.lam}^2 - ${2 * P[0]}, reduced into 0..10.` },
      { instruction: `$y_3 = \\lambda(x_1 - x_3) - y_1 \\bmod 11$.`, answer: `${d.y3}`, accept: [], hint: `${d.lam}(${P[0]} - ${d.x3}) - ${P[1]}, reduced.` },
      { instruction: `State $2P$ as a point.`, answer: `(${d.x3}, ${d.y3})`, accept: [], hint: "Combine $x_3$ and $y_3$." },
    ],
    finalAnswer: { value: `(${d.x3}, ${d.y3})`, unit: "" }, solutionNarrative: `$\\lambda = ${d.num} \\cdot ${d.deninv} \\equiv ${d.lam}$, $x_3 = ${d.x3}$, $y_3 = ${d.y3}$: $2P = (${d.x3}, ${d.y3})$.`,
  };
};
fill["cr3-ecc-dbl-d2"] = (rng, idx) => {
  const c = C17;
  const P = rng.pick(c.mult);
  const d = dblDetail(P, c.a, c.p);
  return {
    id: `gen.cr3-ecc-dbl-d2.${idx}`, generated: true, concepts: ["point-doubling-and-multiples"], difficulty: 2, context: "abstract",
    prompt: `Double $P = ${tup(P)}$ on $${curveEq(c)}$, computing the inverse yourself. Tangent slope: $\\lambda = (3x_1^2 + 2)(2y_1)^{-1} \\bmod 17$.`,
    steps: [
      { instruction: `Numerator: $3x_1^2 + 2 \\bmod 17$.`, answer: `${d.num}`, accept: [], hint: `$3 \\cdot ${P[0] * P[0]} + 2$, reduced mod 17.` },
      { instruction: `Denominator: $2y_1 \\bmod 17$.`, answer: `${d.den}`, accept: [], hint: `$2 \\cdot ${P[1]}$, reduced.` },
      { instruction: `Inverse: find $v$ with $${d.den} \\cdot v \\equiv 1 \\pmod{17}$.`, answer: `${d.deninv}`, accept: [], hint: "Trial multiples or extended Euclid." },
      { instruction: `Slope $\\lambda = ${d.num} \\cdot ${d.deninv} \\bmod 17$.`, answer: `${d.lam}`, accept: [], hint: "Multiply and reduce." },
      { instruction: `$x_3 = \\lambda^2 - 2x_1 \\bmod 17$.`, answer: `${d.x3}`, accept: [], hint: `${d.lam}^2 - ${2 * P[0]}, reduced.` },
      { instruction: `$y_3 = \\lambda(x_1 - x_3) - y_1 \\bmod 17$.`, answer: `${d.y3}`, accept: [], hint: `${d.lam}(${P[0]} - ${d.x3}) - ${P[1]}, reduced.` },
      { instruction: `State $2P$ as a point.`, answer: `(${d.x3}, ${d.y3})`, accept: [], hint: "Combine $x_3$ and $y_3$." },
    ],
    finalAnswer: { value: `(${d.x3}, ${d.y3})`, unit: "" }, solutionNarrative: `$\\lambda = ${d.num} \\cdot ${d.deninv} \\equiv ${d.lam} \\pmod{17}$; $2P = (${d.x3}, ${d.y3})$.`,
  };
};
fill["cr3-ecc-dbl-d3"] = (rng, idx) => {
  const c = C11;
  const k = rng.int(1, 12);
  const P = c.mult[k - 1];
  const P2 = c.mult[(2 * k) % 13 - 1];
  const P3 = c.mult[(3 * k) % 13 - 1];
  const d1 = dblDetail(P, c.a, c.p);
  const d2 = addDetail(P2, P, c.p); // 2P + P, chord (x-coords always differ here)
  return {
    id: `gen.cr3-ecc-dbl-d3.${idx}`, generated: true, concepts: ["point-doubling-and-multiples"], difficulty: 3, context: "abstract",
    prompt: `On $${curveEq(c)}$, compute $2P$ and then $3P = 2P + P$ for $P = ${tup(P)}$. (Doubling uses the tangent slope $(3x_1^2+1)(2y_1)^{-1}$; the second step uses the chord slope.)`,
    steps: [
      { instruction: `Tangent slope at $P$: $\\lambda = (3 \\cdot ${P[0]}^2 + 1)(2 \\cdot ${P[1]})^{-1} \\bmod 11$.`, answer: `${d1.lam}`, accept: [], hint: `Numerator ${d1.num}, denominator ${d1.den}; find the inverse of ${d1.den} mod 11 by trial.` },
      { instruction: `Compute $2P$ as a point: $x_3 = \\lambda^2 - 2x_1$, $y_3 = \\lambda(x_1 - x_3) - y_1$, both mod 11.`, answer: tup(P2), accept: [], hint: `$\\lambda = ${d1.lam}$: $x_3 = ${d1.lam}^2 - ${2 * P[0]} \\bmod 11$, then $y_3$.` },
      { instruction: `Now the chord slope from $2P = ${tup(P2)}$ to $P = ${tup(P)}$: $\\lambda = (y_P - y_{2P})(x_P - x_{2P})^{-1} \\bmod 11$.`, answer: `${d2.lam}`, accept: [], hint: `Numerator ${d2.num}, denominator ${d2.den}; invert ${d2.den} mod 11.` },
      { instruction: `Compute $3P = 2P + P$ as a point.`, answer: tup(P3), accept: [], hint: `$x_3 = ${d2.lam}^2 - ${P2[0]} - ${P[0]} \\bmod 11$, then $y_3 = ${d2.lam}(${P2[0]} - x_3) - ${P2[1]} \\bmod 11$.` },
    ],
    finalAnswer: { value: tup(P3), unit: "" }, solutionNarrative: `$2P = ${tup(P2)}$ via the tangent ($\\lambda = ${d1.lam}$); then the chord from $2P$ to $P$ has $\\lambda = ${d2.lam}$, giving $3P = ${tup(P3)}$. Repeating this walk IS scalar multiplication.`,
  };
};

// --- ecdh-and-keysizes ---
fill["cr3-ecdh-d1"] = (rng, idx) => {
  // NIST comparable-strength table: (security, ECC bits, RSA bits)
  const rows = [[128, 256, 3072], [192, 384, 7680], [256, 512, 15360]];
  const r = rng.pick(rows);
  const ratio = r[2] / r[1];
  return {
    id: `gen.cr3-ecdh-d1.${idx}`, generated: true, concepts: ["ecdh-and-keysizes"], difficulty: 1, context: "applied",
    prompt: `Standards bodies rate a ${r[1]}-bit elliptic-curve key and a ${r[2]}-bit RSA key as equally strong (both give about ${r[0]} bits of security).`,
    steps: [
      { instruction: `How many times longer is the RSA key than the ECC key? (Compute $${r[2]} / ${r[1]}$.)`, answer: `${ratio}`, accept: [`${r[2]}/${r[1]}`], hint: "Straight division." },
      { instruction: `An ECC key of $n$ bits gives about $n/2$ bits of security (the best generic attack takes $2^{n/2}$ steps). How many bits of security does a ${r[1]}-bit ECC key give?`, answer: `${r[0]}`, accept: [], hint: `Halve ${r[1]}.` },
    ],
    finalAnswer: { value: `${ratio}`, unit: "" }, solutionNarrative: `$${r[2]}/${r[1]} = ${ratio}$ — the RSA key is ${ratio}× longer for the same ${r[0]}-bit strength, because sub-exponential attacks exist for factoring but not for elliptic-curve discrete logs.`,
  };
};
fill["cr3-ecdh-d2"] = (rng, idx) => {
  const c = C11;
  let a = rng.int(2, 6), b = rng.int(2, 6);
  while (b === a) b = rng.int(2, 6);
  const A = c.mult[a - 1], B = c.mult[b - 1];
  const s = (a * b) % 13;
  const S = c.mult[s - 1];
  return {
    id: `gen.cr3-ecdh-d2.${idx}`, generated: true, concepts: ["ecdh-and-keysizes"], difficulty: 2, context: "applied",
    prompt: `Toy ECDH on $${curveEq(c)}$ with generator $G = (2, 7)$ of order 13. Multiples of $G$: $${multTable(c, 12)}$. Alice picks secret $a = ${a}$; Bob picks secret $b = ${b}$.`,
    steps: [
      { instruction: `Alice sends $A = ${a}G$. Which point is that? (Use the table.)`, answer: tup(A), accept: [], hint: `Look up ${a}G.` },
      { instruction: `Bob sends $B = ${b}G$. Which point?`, answer: tup(B), accept: [], hint: `Look up ${b}G.` },
      { instruction: `Alice computes $aB = ${a} \\cdot ${b}G = (ab)G$. First: $ab \\bmod 13$?`, answer: `${s}`, accept: a * b < 13 ? [] : [`${a * b}`], hint: `${a} \\cdot ${b} = ${a * b}; the group has order 13, so reduce mod 13.` },
      { instruction: `So the shared secret point is $${s}G$. Which point is it?`, answer: tup(S), accept: [], hint: `Look up ${s}G — Bob gets the same point from $bA$.` },
    ],
    finalAnswer: { value: tup(S), unit: "" }, solutionNarrative: `$A = ${tup(A)}$, $B = ${tup(B)}$; both sides land on $(ab)G = ${s}G = ${tup(S)}$. An eavesdropper sees $A$ and $B$ but must solve a discrete log to find $a$ or $b$.`,
  };
};
fill["cr3-ecdh-d3"] = (rng, idx) => {
  const c = C17;
  let a = rng.int(2, 9), b = rng.int(2, 9);
  while (b === a) b = rng.int(2, 9);
  const A = c.mult[a - 1], B = c.mult[b - 1];
  const s = (a * b) % 19;
  const S = c.mult[s - 1];
  return {
    id: `gen.cr3-ecdh-d3.${idx}`, generated: true, concepts: ["ecdh-and-keysizes"], difficulty: 3, context: "applied",
    prompt: `ECDH on $${curveEq(c)}$, generator $G = (5, 1)$ of order 19. Multiples: $${multTable(c, 18)}$. Alice's secret: $a = ${a}$. Bob's secret: $b = ${b}$. Work the whole handshake.`,
    steps: [
      { instruction: `Alice's public point $A = ${a}G$?`, answer: tup(A), accept: [], hint: `Table lookup at ${a}G.` },
      { instruction: `Bob's public point $B = ${b}G$?`, answer: tup(B), accept: [], hint: `Table lookup at ${b}G.` },
      { instruction: `Alice computes $aB = (ab)G$. Reduce the scalar: $${a} \\cdot ${b} \\bmod 19$?`, answer: `${s}`, accept: a * b < 19 ? [] : [`${a * b}`], hint: `${a * b} mod 19.` },
      { instruction: `Shared secret point $(ab)G$?`, answer: tup(S), accept: [], hint: `Look up ${s}G.` },
      { instruction: `Bob computes $bA = (ba)G$ instead. Does he get the SAME point? Type 'yes' or 'no'.`, answer: "yes", accept: [], hint: "Scalar multiplication commutes: $a(bG) = b(aG) = (ab)G$." },
    ],
    finalAnswer: { value: tup(S), unit: "" }, solutionNarrative: `$A = ${tup(A)}$, $B = ${tup(B)}$, and both parties compute $(ab)G = ${s}G = ${tup(S)}$. Only $A$ and $B$ cross the wire; recovering $a$ from $A = aG$ is the elliptic-curve discrete-log problem.`,
  };
};
