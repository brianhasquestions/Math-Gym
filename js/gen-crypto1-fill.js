// gen-crypto1-fill.js
// Parametric generators for the Cryptography FOUNDATION topics
// (cryptography.modular-arithmetic and cryptography.gcd-euclid), one template
// per concept per difficulty tier so the adaptive engine can serve fresh
// problems at every level. Self-contained: exports a `fill` map of
// template-name -> generator fn, matching the shape used by js/generator.js's
// `generators` map (same pack pattern as gen-de-fill.js). Deterministic from
// the passed rng; givens are derived from chosen answers (pick the remainder /
// gcd / inverse first, build the problem around it).

const mod = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const modInverse = (a, n) => { for (let x = 1; x < n; x++) if (mod(a * x, n) === 1) return x; return null; };
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const fill = {};

// ============================================================================
// cryptography.modular-arithmetic
// ============================================================================

// --- compute-mod ---

fill["cr1-mod-d1"] = (rng, idx) => {
  const n = rng.int(5, 12), q = rng.int(3, 9), r = rng.int(1, n - 1);
  const a = q * n + r;
  return {
    id: `gen.cr1-mod-d1.${idx}`, generated: true, concepts: ["compute-mod"], difficulty: 1, context: "abstract",
    prompt: `Compute $${a} \\bmod ${n}$.`,
    steps: [
      { instruction: `What is the largest multiple of ${n} that is at most ${a}?`, answer: `${q * n}`, accept: [`${q}*${n}`], hint: `$${n} \\cdot ${q} = ${q * n}$, while $${n} \\cdot ${q + 1} = ${(q + 1) * n}$ is too big.` },
      { instruction: `Subtract to get the remainder: $${a} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${a} - ${q * n}$.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} = ${q} \\cdot ${n} + ${r}$, so $${a} \\bmod ${n} = ${r}$.`,
  };
};

fill["cr1-mod-d2"] = (rng, idx) => {
  const n = rng.int(5, 12), r = rng.int(1, n - 1), k = rng.int(1, 4);
  const a = r - k * n; // negative by construction (r < n <= k*n)
  return {
    id: `gen.cr1-mod-d2.${idx}`, generated: true, concepts: ["compute-mod"], difficulty: 2, context: "abstract",
    prompt: `Compute $${a} \\bmod ${n}$. (The answer must land in the range $0$ to $${n - 1}$ — decryption produces negatives like this all the time.)`,
    steps: [
      { instruction: `How many times must you add ${n} to ${a} to land in the range $0..${n - 1}$?`, answer: `${k}`, accept: [], hint: `Each addition of ${n} keeps the residue the same; count until you are no longer negative.` },
      { instruction: `So $${a} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${a} + ${k} \\cdot ${n} = ${r}$.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `Adding ${n} a total of ${k} times: $${a} + ${k * n} = ${r}$, which lies in $0..${n - 1}$. So $${a} \\bmod ${n} = ${r}$.`,
  };
};

fill["cr1-mod-d3"] = (rng, idx) => {
  const n = rng.int(5, 12);
  const ra = rng.int(0, n - 1);
  const congruent = rng.int(0, 1) === 1;
  const rb = congruent ? ra : mod(ra + rng.int(1, n - 1), n);
  const a = ra + rng.int(2, 6) * n;
  const b = rb + rng.int(1, 5) * n;
  const yn = congruent ? "yes" : "no";
  return {
    id: `gen.cr1-mod-d3.${idx}`, generated: true, concepts: ["compute-mod"], difficulty: 3, context: "abstract",
    prompt: `Is $${a} \\equiv ${b} \\pmod{${n}}$? Decide by reducing both sides.`,
    steps: [
      { instruction: `Compute $${a} \\bmod ${n}$.`, answer: `${ra}`, accept: [], hint: `Find the largest multiple of ${n} inside ${a} and subtract.` },
      { instruction: `Compute $${b} \\bmod ${n}$.`, answer: `${rb}`, accept: [], hint: `Find the largest multiple of ${n} inside ${b} and subtract.` },
      { instruction: `Do they leave the same remainder — is $${a} \\equiv ${b} \\pmod{${n}}$? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: "Congruent means equal remainders mod the modulus." },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: `$${a} \\bmod ${n} = ${ra}$ and $${b} \\bmod ${n} = ${rb}$ — ${congruent ? "equal residues, so yes, congruent" : "different residues, so no, not congruent"}.`,
  };
};

// --- modular-add-mult ---

fill["cr1-modops-d1"] = (rng, idx) => {
  const n = rng.int(5, 12);
  const a = rng.int(n + 1, 4 * n), b = rng.int(n + 1, 4 * n);
  const s = a + b, r = mod(s, n);
  return {
    id: `gen.cr1-modops-d1.${idx}`, generated: true, concepts: ["modular-add-mult"], difficulty: 1, context: "abstract",
    prompt: `Compute $(${a} + ${b}) \\bmod ${n}$.`,
    steps: [
      { instruction: `Add first: $${a} + ${b} = $ ?`, answer: `${s}`, accept: [], hint: "Plain addition." },
      { instruction: `Now reduce: $${s} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `Subtract the largest multiple of ${n} that fits in ${s}.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} + ${b} = ${s}$, and $${s} \\bmod ${n} = ${r}$.`,
  };
};

fill["cr1-modops-d2"] = (rng, idx) => {
  const n = rng.int(5, 11);
  const a = rng.int(n + 1, 5 * n), b = rng.int(n + 1, 5 * n);
  const ra = mod(a, n), rb = mod(b, n), p = ra * rb, r = mod(p, n);
  return {
    id: `gen.cr1-modops-d2.${idx}`, generated: true, concepts: ["modular-add-mult"], difficulty: 2, context: "abstract",
    prompt: `Compute $(${a} \\cdot ${b}) \\bmod ${n}$ using reduce-as-you-go — never multiply the big numbers directly.`,
    steps: [
      { instruction: `Compute $${a} \\bmod ${n}$.`, answer: `${ra}`, accept: [], hint: `Largest multiple of ${n} in ${a}, then subtract.` },
      { instruction: `Compute $${b} \\bmod ${n}$.`, answer: `${rb}`, accept: [], hint: `Largest multiple of ${n} in ${b}, then subtract.` },
      { instruction: `Multiply the residues: $${ra} \\cdot ${rb} = $ ?`, answer: `${p}`, accept: [], hint: "Small numbers now." },
      { instruction: `Reduce: $${p} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `Subtract the largest multiple of ${n} in ${p}.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} \\equiv ${ra}$ and $${b} \\equiv ${rb} \\pmod{${n}}$; $${ra} \\cdot ${rb} = ${p} \\equiv ${r} \\pmod{${n}}$. Reduce-as-you-go is the trick that keeps 2048-bit RSA arithmetic small enough to run.`,
  };
};

fill["cr1-modops-d3"] = (rng, idx) => {
  const a = rng.pick([3, 5, 7, 9, 11, 15, 17, 19, 21, 25]); // coprime to 26
  const b = rng.int(1, 25);
  const x = rng.int(0, 25);
  const raw = a * x + b;
  const y = mod(raw, 26);
  const plain = LETTERS[x], cipher = LETTERS[y];
  return {
    id: `gen.cr1-modops-d3.${idx}`, generated: true, concepts: ["modular-add-mult"], difficulty: 3, context: "applied",
    prompt: `An affine cipher uses $E(x) = (${a}x + ${b}) \\bmod 26$ with $A=0, \\dots, Z=25$. Encrypt the letter ${plain}.`,
    steps: [
      { instruction: `What is the numeric position of ${plain}? ($A = 0$)`, answer: `${x}`, accept: [], hint: `${plain} is letter number ${x + 1} of the alphabet, so its position starting from 0 is ${x}.` },
      { instruction: `Compute the raw value $${a} \\cdot ${x} + ${b}$.`, answer: `${raw}`, accept: [], hint: `$${a * x} + ${b}$.` },
      { instruction: `Reduce: $${raw} \\bmod 26 = $ ?`, answer: `${y}`, accept: [], hint: `Subtract the largest multiple of 26 that fits in ${raw}.` },
      { instruction: `Which letter has position ${y}? Type the letter.`, answer: cipher, accept: [], hint: `Count from $A = 0$.` },
    ],
    finalAnswer: { value: cipher, unit: "" },
    solutionNarrative: `${plain} is position ${x}; $${a} \\cdot ${x} + ${b} = ${raw}$, and $${raw} \\bmod 26 = ${y}$, the letter ${cipher}. So ${plain} encrypts to ${cipher}.`,
  };
};

// --- modular-inverse ---

fill["cr1-modinv-d1"] = (rng, idx) => {
  const n = rng.pick([7, 9, 10, 11, 13]);
  let a; do { a = rng.int(2, n - 1); } while (gcd(a, n) !== 1);
  const inv = modInverse(a, n);
  const p = a * inv;
  return {
    id: `gen.cr1-modinv-d1.${idx}`, generated: true, concepts: ["modular-inverse"], difficulty: 1, context: "abstract",
    prompt: `Is ${inv} the inverse of ${a} mod ${n}? (That is: does $${a} \\cdot ${inv} \\equiv 1 \\pmod{${n}}$?)`,
    steps: [
      { instruction: `Compute $${a} \\cdot ${inv}$.`, answer: `${p}`, accept: [], hint: "Just multiply." },
      { instruction: `Reduce: $${p} \\bmod ${n} = $ ?`, answer: "1", accept: [], hint: `Subtract the largest multiple of ${n} in ${p}.` },
      { instruction: `Did the product reduce to 1 — is ${inv} the inverse of ${a} mod ${n}? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: "An inverse is exactly a number whose product with $a$ reduces to 1." },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$${a} \\cdot ${inv} = ${p} \\equiv 1 \\pmod{${n}}$, so yes — multiplying by ${inv} undoes multiplying by ${a} in mod-${n} arithmetic.`,
  };
};

fill["cr1-modinv-d2"] = (rng, idx) => {
  const n = rng.pick([7, 8, 9, 10, 11, 12, 13]);
  let a; do { a = rng.int(2, n - 2); } while (gcd(a, n) !== 1);
  const inv = modInverse(a, n);
  const p = a * inv;
  return {
    id: `gen.cr1-modinv-d2.${idx}`, generated: true, concepts: ["modular-inverse"], difficulty: 2, context: "abstract",
    prompt: `Find $${a}^{-1} \\bmod ${n}$ — the number $x$ in $1..${n - 1}$ with $${a}x \\equiv 1 \\pmod{${n}}$ — by testing candidates.`,
    steps: [
      { instruction: `For $x$ to be the inverse, $${a}x \\bmod ${n}$ must equal what?`, answer: "1", accept: [], hint: "That is the definition of a modular inverse." },
      { instruction: `Test $x = 1, 2, 3, \\dots$ in turn: which $x$ works?`, answer: `${inv}`, accept: [`x=${inv}`], hint: `Multiply ${a} by each candidate and reduce mod ${n} until you hit 1.` },
      { instruction: `Verify: $${a} \\cdot ${inv} \\bmod ${n} = $ ?`, answer: "1", accept: [], hint: `$${a} \\cdot ${inv} = ${p}$; now reduce.` },
    ],
    finalAnswer: { value: `${inv}`, unit: "" },
    solutionNarrative: `Testing candidates: $${a} \\cdot ${inv} = ${p} \\equiv 1 \\pmod{${n}}$, so $${a}^{-1} \\bmod ${n} = ${inv}$.`,
  };
};

fill["cr1-modinv-d3"] = (rng, idx) => {
  const exists = rng.int(0, 1) === 1;
  const n = rng.pick(exists ? [9, 10, 11, 12, 13, 14] : [8, 9, 10, 12, 14, 15]);
  let a;
  if (exists) { do { a = rng.int(2, n - 2); } while (gcd(a, n) !== 1); }
  else { do { a = rng.int(2, n - 1); } while (gcd(a, n) === 1); }
  const g = gcd(a, n);
  const inv = exists ? modInverse(a, n) : null;
  return {
    id: `gen.cr1-modinv-d3.${idx}`, generated: true, concepts: ["modular-inverse"], difficulty: 3, context: "abstract",
    prompt: `Does ${a} have an inverse mod ${n}? Decide, and give the inverse or type 'none'.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${n})$.`, answer: `${g}`, accept: [], hint: "What is the largest number dividing both?" },
      { instruction: `An inverse exists only when the gcd is 1. Does $${a}^{-1} \\bmod ${n}$ exist? Type 'yes' or 'no'.`, answer: exists ? "yes" : "no", accept: [exists ? "y" : "n"], hint: `The gcd is ${g}.` },
      exists
        ? { instruction: `Find it by testing: $${a}^{-1} \\bmod ${n} = $ ?`, answer: `${inv}`, accept: [], hint: `Test $x = 1, 2, \\dots$ until $${a}x \\bmod ${n} = 1$.` }
        : { instruction: `So what is $${a}^{-1} \\bmod ${n}$? Type 'none'.`, answer: "none", accept: ["no inverse", "does not exist", "dne"], hint: `Every product $${a}x$ is divisible by ${g}, so $${a}x \\bmod ${n}$ can never equal 1.` },
    ],
    finalAnswer: { value: exists ? `${inv}` : "none", unit: "" },
    solutionNarrative: exists
      ? `$\\gcd(${a}, ${n}) = 1$, so an inverse exists; testing gives $${a} \\cdot ${inv} = ${a * inv} \\equiv 1 \\pmod{${n}}$.`
      : `$\\gcd(${a}, ${n}) = ${g} \\ne 1$, so no inverse exists — every multiple of ${a} stays divisible by ${g} mod ${n} and can never reduce to 1.`,
  };
};

// --- mod-in-the-wild ---

fill["cr1-modwild-d1"] = (rng, idx) => {
  const di = rng.int(0, 6);
  const k = rng.int(8, 60);
  const shift = k % 7;
  const nd = (di + k) % 7;
  const today = DAYS[di], then = DAYS[nd];
  return {
    id: `gen.cr1-modwild-d1.${idx}`, generated: true, concepts: ["mod-in-the-wild"], difficulty: 1, context: "applied",
    prompt: `Today is ${today}. A password expires in ${k} days. What day of the week does it expire?`,
    steps: [
      { instruction: `Days of the week cycle mod 7. Compute $${k} \\bmod 7$.`, answer: `${shift}`, accept: [], hint: `Subtract the largest multiple of 7 that fits in ${k}.` },
      { instruction: `Count ${shift} day${shift === 1 ? "" : "s"} forward from ${today}. What day is it? Type the day name.`, answer: then, accept: [then.slice(0, 3)], hint: "Full weeks wrap away; only the remainder moves the weekday." },
    ],
    finalAnswer: { value: then, unit: "" },
    solutionNarrative: `$${k} \\bmod 7 = ${shift}$, so the expiry lands ${shift} weekday${shift === 1 ? "" : "s"} after ${today}: ${then}.`,
  };
};

fill["cr1-modwild-d2"] = (rng, idx) => {
  const n = rng.pick([7, 8, 12, 16]);
  const q = rng.int(50, 400), r = rng.int(0, n - 1);
  const h = q * n + r;
  return {
    id: `gen.cr1-modwild-d2.${idx}`, generated: true, concepts: ["mod-in-the-wild"], difficulty: 2, context: "applied",
    prompt: `A hash table has ${n} buckets. A key hashes to the value ${h}. Which bucket index ($0..${n - 1}$) stores it? (Index $=$ hash $\\bmod$ ${n}.)`,
    steps: [
      { instruction: `What is the largest multiple of ${n} that is at most ${h}?`, answer: `${q * n}`, accept: [`${q}*${n}`], hint: `$${n} \\cdot ${q} = ${q * n}$.` },
      { instruction: `So the bucket index is $${h} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${h} - ${q * n}$.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${h} = ${q} \\cdot ${n} + ${r}$, so the key lands in bucket ${r}. Hash tables, shard routers, and load balancers do this reduction on every single lookup.`,
  };
};

fill["cr1-modwild-d3"] = (rng, idx) => {
  const d = [rng.int(0, 9), rng.int(0, 9), rng.int(0, 9), rng.int(0, 9), rng.int(0, 9)];
  const odd = d[0] + d[2] + d[4];
  const even = d[1] + d[3];
  const tripled = 3 * odd;
  const total = tripled + even;
  const m = total % 10;
  const check = (10 - m) % 10;
  const code = d.join("-");
  return {
    id: `gen.cr1-modwild-d3.${idx}`, generated: true, concepts: ["mod-in-the-wild"], difficulty: 3, context: "applied",
    prompt: `A warehouse uses a scaled-down UPC checksum on 6-digit codes. The first five digits are ${code}. Rule: triple the sum of the digits in odd positions (1st, 3rd, 5th), add the digits in even positions (2nd, 4th), and pick the check digit that makes the grand total divisible by 10.`,
    steps: [
      { instruction: `Sum the odd-position digits: $${d[0]} + ${d[2]} + ${d[4]}$.`, answer: `${odd}`, accept: [], hint: "Positions 1, 3, 5." },
      { instruction: `Triple it: $3 \\cdot ${odd} = $ ?`, answer: `${tripled}`, accept: [], hint: "Odd positions carry weight 3." },
      { instruction: `Add the even-position digits: $${tripled} + ${d[1]} + ${d[3]} = $ ?`, answer: `${total}`, accept: [], hint: `The even-position digits are ${d[1]} and ${d[3]}.` },
      { instruction: `Reduce: $${total} \\bmod 10 = $ ?`, answer: `${m}`, accept: [], hint: `The last digit of ${total}.` },
      { instruction: `Check digit $= (10 - ${m}) \\bmod 10 = $ ?`, answer: `${check}`, accept: [], hint: `It must top the total up to a multiple of 10: $${total} + ${check} = ${total + check}$.` },
    ],
    finalAnswer: { value: `${check}`, unit: "" },
    solutionNarrative: `Odd sum ${odd}, tripled to ${tripled}; plus even digits gives ${total}; $${total} \\equiv ${m} \\pmod{10}$, so the check digit is ${check} (total ${total + check} is a multiple of 10). Real 12-digit UPCs use exactly this rule, just longer.`,
  };
};

// ============================================================================
// cryptography.gcd-euclid
// ============================================================================

// --- primes-and-coprimality ---

const PRIME_ITEMS = [
  { n: 23, prime: true }, { n: 29, prime: true }, { n: 31, prime: true }, { n: 37, prime: true },
  { n: 41, prime: true }, { n: 43, prime: true }, { n: 47, prime: true }, { n: 53, prime: true },
  { n: 59, prime: true }, { n: 61, prime: true },
  { n: 21, f: 3 }, { n: 27, f: 3 }, { n: 33, f: 3 }, { n: 39, f: 3 }, { n: 49, f: 7 },
  { n: 51, f: 3 }, { n: 57, f: 3 }, { n: 63, f: 3 }, { n: 77, f: 7 }, { n: 91, f: 7 },
];

fill["cr1-prime-d1"] = (rng, idx) => {
  const item = rng.pick(PRIME_ITEMS);
  const n = item.n;
  const testPrimes = [2, 3, 5, 7].filter((p) => p * p <= n);
  const maxTest = testPrimes[testPrimes.length - 1];
  const steps = item.prime
    ? [
        { instruction: `You only need to trial-divide by primes up to $\\sqrt{${n}}$. What is the largest prime you must test?`, answer: `${maxTest}`, accept: [], hint: `$\\sqrt{${n}}$ is less than ${maxTest + (maxTest === 7 ? 1 : 2)}, so the primes to test are ${testPrimes.join(", ")}.` },
        { instruction: `Does any of ${testPrimes.join(", ")} divide ${n}? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: "Check evenness, the digit-sum rule for 3, the last digit for 5, and divide by 7 if needed." },
        { instruction: `So is ${n} prime? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `If no prime up to $\\sqrt{n}$ divides $n$, then $n$ is prime.` },
      ]
    : [
        { instruction: `Find the smallest prime factor of ${n}.`, answer: `${item.f}`, accept: [], hint: item.f === 3 ? `The digit sum of ${n} is a multiple of 3.` : `Try 7: does $7$ divide ${n}?` },
        { instruction: `Compute the cofactor: $${n} \\div ${item.f} = $ ?`, answer: `${n / item.f}`, accept: [], hint: `$${item.f} \\cdot ${n / item.f} = ${n}$.` },
        { instruction: `So is ${n} prime? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: "It has a divisor other than 1 and itself." },
      ];
  return {
    id: `gen.cr1-prime-d1.${idx}`, generated: true, concepts: ["primes-and-coprimality"], difficulty: 1, context: "abstract",
    prompt: `Is ${n} prime? Test it.`,
    steps,
    finalAnswer: { value: item.prime ? "yes" : "no", unit: "" },
    solutionNarrative: item.prime
      ? `No prime up to $\\sqrt{${n}}$ divides ${n}, so ${n} is prime.`
      : `$${n} = ${item.f} \\cdot ${n / item.f}$, so ${n} is composite.`,
  };
};

fill["cr1-prime-d2"] = (rng, idx) => {
  const a = rng.int(1, 3); // exponent of 2
  const M_OPTS = [
    { m: 9, factors: "3 \\cdot 3", count: 2 }, { m: 15, factors: "3 \\cdot 5", count: 2 },
    { m: 21, factors: "3 \\cdot 7", count: 2 }, { m: 25, factors: "5 \\cdot 5", count: 2 },
    { m: 27, factors: "3 \\cdot 3 \\cdot 3", count: 3 }, { m: 33, factors: "3 \\cdot 11", count: 2 },
    { m: 35, factors: "5 \\cdot 7", count: 2 },
  ];
  const opt = rng.pick(M_OPTS);
  const n = 2 ** a * opt.m;
  const totalCount = a + opt.count;
  return {
    id: `gen.cr1-prime-d2.${idx}`, generated: true, concepts: ["primes-and-coprimality"], difficulty: 2, context: "abstract",
    prompt: `Find the prime factorization of ${n} by peeling off small primes.`,
    steps: [
      { instruction: `Divide out the 2s: how many times does 2 divide ${n}?`, answer: `${a}`, accept: [], hint: `Halve repeatedly: ${n}${a >= 1 ? ` \\to ${n / 2}` : ""}${a >= 2 ? ` \\to ${n / 4}` : ""}${a >= 3 ? ` \\to ${n / 8}` : ""} — stop when the result is odd.` },
      { instruction: `What odd number remains after removing all the 2s?`, answer: `${opt.m}`, accept: [], hint: `$${n} \\div ${2 ** a}$.` },
      { instruction: `Factor ${opt.m} into primes ($${opt.m} = ${opt.factors}$). In total, how many prime factors does ${n} have, counted with multiplicity?`, answer: `${totalCount}`, accept: [], hint: `${a} factor${a === 1 ? "" : "s"} of 2 plus ${opt.count} odd prime factor${opt.count === 1 ? "" : "s"}.` },
    ],
    finalAnswer: { value: `${n} = 2^${a} * ${opt.m}`, unit: "" },
    solutionNarrative: `$${n} = 2^{${a}} \\cdot ${opt.factors}$ — ${totalCount} prime factors with multiplicity. Unique factorization guarantees this is the only way it breaks down.`,
  };
};

const COPRIME_PAIRS = [[4, 9], [5, 8], [7, 10], [9, 16], [8, 15], [5, 12], [7, 12], [11, 14], [9, 14], [10, 13]];

fill["cr1-prime-d3"] = (rng, idx) => {
  const g = rng.pick([1, 1, 2, 3, 4, 5, 6, 7]);
  const [p, q] = rng.pick(COPRIME_PAIRS);
  const a = g * p, b = g * q;
  const coprime = g === 1;
  const yn = coprime ? "yes" : "no";
  return {
    id: `gen.cr1-prime-d3.${idx}`, generated: true, concepts: ["primes-and-coprimality"], difficulty: 3, context: "applied",
    prompt: `A cipher design requires two parameters to be coprime. Are ${a} and ${b} coprime?`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$ (factor both, or run Euclid: $${Math.max(a, b)} = q \\cdot ${Math.min(a, b)} + r$, ...).`, answer: `${g}`, accept: [], hint: `What is the largest number dividing both ${a} and ${b}?` },
      { instruction: `Coprime means $\\gcd = 1$. Are ${a} and ${b} coprime? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `The gcd is ${g}.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: `$${a} = ${g} \\cdot ${p}$ and $${b} = ${g} \\cdot ${q}$ with $\\gcd(${p}, ${q}) = 1$, so $\\gcd(${a}, ${b}) = ${g}$ — ${coprime ? "coprime" : "NOT coprime"}.`,
  };
};

// --- euclidean-algorithm ---
// All built backwards from the chosen gcd so every remainder is a clean step.

fill["cr1-euclid-d1"] = (rng, idx) => {
  const g = rng.int(3, 9);
  const q2 = rng.int(2, 4), b = q2 * g;
  const q1 = rng.int(1, 3), a = q1 * b + g;
  return {
    id: `gen.cr1-euclid-d1.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 1, context: "abstract",
    prompt: `Run the Euclidean algorithm to find $\\gcd(${a}, ${b})$. Each line divides and keeps the remainder.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: what is the remainder? ($${a} = ${q1} \\cdot ${b} + r$)`, answer: `${g}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${g}: what is the remainder?`, answer: "0", accept: [], hint: `$${g} \\cdot ${q2} = ${b}$ exactly.` },
      { instruction: `The remainder hit 0. What is the last NONZERO remainder — the gcd?`, answer: `${g}`, accept: [], hint: "Look one line up." },
    ],
    finalAnswer: { value: `${g}`, unit: "" },
    solutionNarrative: `$${a} = ${q1} \\cdot ${b} + ${g}$; $${b} = ${q2} \\cdot ${g} + 0$. The last nonzero remainder is ${g}, so $\\gcd(${a}, ${b}) = ${g}$.`,
  };
};

fill["cr1-euclid-d2"] = (rng, idx) => {
  const r2 = rng.int(2, 6);
  const q3 = rng.int(2, 4), r1 = q3 * r2;
  const q2 = rng.int(1, 3), b = q2 * r1 + r2;
  const q1 = rng.int(1, 3), a = q1 * b + r1;
  return {
    id: `gen.cr1-euclid-d2.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 2, context: "abstract",
    prompt: `Find $\\gcd(${a}, ${b})$ with the Euclidean algorithm.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: what is the remainder? ($${b} \\cdot ${q1} = ${q1 * b}$)`, answer: `${r1}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${r1}: what is the remainder? ($${r1} \\cdot ${q2} = ${q2 * r1}$)`, answer: `${r2}`, accept: [], hint: `$${b} - ${q2 * r1}$.` },
      { instruction: `Divide ${r1} by ${r2}: what is the remainder?`, answer: "0", accept: [], hint: `$${r2} \\cdot ${q3} = ${r1}$ exactly.` },
      { instruction: `So $\\gcd(${a}, ${b}) = $ ?`, answer: `${r2}`, accept: [], hint: "The last nonzero remainder." },
    ],
    finalAnswer: { value: `${r2}`, unit: "" },
    solutionNarrative: `$${a} = ${q1} \\cdot ${b} + ${r1}$; $${b} = ${q2} \\cdot ${r1} + ${r2}$; $${r1} = ${q3} \\cdot ${r2} + 0$. So $\\gcd = ${r2}$ — no factoring required.`,
  };
};

fill["cr1-euclid-d3"] = (rng, idx) => {
  const r3 = rng.int(2, 5);
  const q4 = rng.int(2, 3), r2 = q4 * r3;
  const q3 = rng.int(1, 3), r1 = q3 * r2 + r3;
  const q2 = rng.int(1, 3), b = q2 * r1 + r2;
  const q1 = rng.int(1, 3), a = q1 * b + r1;
  return {
    id: `gen.cr1-euclid-d3.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 3, context: "abstract",
    prompt: `Find $\\gcd(${a}, ${b})$ — four divisions of the Euclidean cascade. Track each remainder carefully.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: what is the remainder? ($${b} \\cdot ${q1} = ${q1 * b}$)`, answer: `${r1}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${r1}: what is the remainder? ($${r1} \\cdot ${q2} = ${q2 * r1}$)`, answer: `${r2}`, accept: [], hint: `$${b} - ${q2 * r1}$.` },
      { instruction: `Divide ${r1} by ${r2}: what is the remainder? ($${r2} \\cdot ${q3} = ${q3 * r2}$)`, answer: `${r3}`, accept: [], hint: `$${r1} - ${q3 * r2}$.` },
      { instruction: `Divide ${r2} by ${r3}: what is the remainder?`, answer: "0", accept: [], hint: `$${r3} \\cdot ${q4} = ${r2}$ exactly.` },
      { instruction: `So $\\gcd(${a}, ${b}) = $ ?`, answer: `${r3}`, accept: [], hint: "The last nonzero remainder." },
    ],
    finalAnswer: { value: `${r3}`, unit: "" },
    solutionNarrative: `The remainder cascade runs $${r1} \\to ${r2} \\to ${r3} \\to 0$, so $\\gcd(${a}, ${b}) = ${r3}$. The same cascade on 617-digit numbers finishes in a few thousand divisions.`,
  };
};

// --- extended-euclid ---

const BEZOUT_PAIRS = [
  // [a, b, x, y] with a*x + b*y = 1
  [5, 3, -1, 2], [7, 4, -1, 2], [8, 5, 2, -3], [9, 7, -3, 4], [11, 4, -1, 3],
  [13, 5, 2, -5], [12, 7, 3, -5], [15, 4, -1, 4], [17, 5, 3, -10],
];

fill["cr1-exteuclid-d1"] = (rng, idx) => {
  const [a, b, x, y] = rng.pick(BEZOUT_PAIRS);
  return {
    id: `gen.cr1-exteuclid-d1.${idx}`, generated: true, concepts: ["extended-euclid"], difficulty: 1, context: "abstract",
    prompt: `Bézout's identity claims integers $x, y$ exist with $${a}x + ${b}y = \\gcd(${a}, ${b})$. Verify that $x = ${x}$, $y = ${y}$ works.`,
    steps: [
      { instruction: `Compute $${a} \\cdot ${x < 0 ? `(${x})` : x}$.`, answer: `${a * x}`, accept: [], hint: "Keep the sign." },
      { instruction: `Compute $${b} \\cdot ${y < 0 ? `(${y})` : y}$.`, answer: `${b * y}`, accept: [], hint: "Keep the sign." },
      { instruction: `Add them: $${a * x} + ${b * y < 0 ? `(${b * y})` : b * y} = $ ?`, answer: "1", accept: [], hint: "The combination should equal the gcd." },
      { instruction: `${a} and ${b} are coprime, so $\\gcd(${a}, ${b}) = $ ?`, answer: "1", accept: [], hint: "They share no prime factor." },
    ],
    finalAnswer: { value: "1", unit: "" },
    solutionNarrative: `$${a} \\cdot ${x} + ${b} \\cdot ${y} = ${a * x} + ${b * y} = 1 = \\gcd(${a}, ${b})$. Bézout coefficients aren't unique, but extended Euclid always produces one valid pair.`,
  };
};

fill["cr1-exteuclid-d2"] = (rng, idx) => {
  const r = rng.int(2, 6);
  const q2 = rng.int(2, 4), b = q2 * r;
  const q1 = rng.int(1, 3), a = q1 * b + r;
  return {
    id: `gen.cr1-exteuclid-d2.${idx}`, generated: true, concepts: ["extended-euclid"], difficulty: 2, context: "abstract",
    prompt: `Express $\\gcd(${a}, ${b})$ as a combination $${a}x + ${b}y$. The Euclidean division is short here — one back-substitution does it.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: what is the remainder? (This remainder is the gcd, since ${b} is a multiple of it.)`, answer: `${r}`, accept: [], hint: `$${a} - ${q1} \\cdot ${b}$.` },
      { instruction: `The division says $${a} = q \\cdot ${b} + ${r}$. What is the quotient $q$?`, answer: `${q1}`, accept: [], hint: `How many whole times does ${b} fit into ${a}?` },
      { instruction: `Rearrange: $${r} = ${a} - ${q1} \\cdot ${b} = ${a} \\cdot 1 + ${b} \\cdot y$. What is $y$?`, answer: `${-q1}`, accept: [], hint: `Moving $${q1} \\cdot ${b}$ across gives a negative coefficient.` },
      { instruction: `Verify: $${a} \\cdot 1 + ${b} \\cdot (${-q1}) = $ ?`, answer: `${r}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
    ],
    finalAnswer: { value: `x = 1, y = ${-q1}`, unit: "" },
    solutionNarrative: `$${a} = ${q1} \\cdot ${b} + ${r}$ and ${b} is a multiple of ${r}, so $\\gcd = ${r}$. Rearranging the division: $${r} = ${a} \\cdot 1 + ${b} \\cdot (${-q1})$ — Bézout coefficients $x = 1$, $y = ${-q1}$.`,
  };
};

fill["cr1-exteuclid-d3"] = (rng, idx) => {
  const n = rng.pick([20, 24, 26, 40]);
  let a; do { a = rng.int(3, n - 3); } while (gcd(a, n) !== 1);
  const inv = modInverse(a, n);
  const p = a * inv;
  const k = (p - 1) / n;
  return {
    id: `gen.cr1-exteuclid-d3.${idx}`, generated: true, concepts: ["extended-euclid"], difficulty: 3, context: "applied",
    prompt: `Toy RSA key generation: the public exponent is $e = ${a}$ and $\\varphi = ${n}$. The private key is $d = e^{-1} \\bmod \\varphi$ — found with extended Euclid (run the divisions, then back-substitute; or test candidates and confirm).`,
    steps: [
      { instruction: `First the safety check: $\\gcd(${a}, ${n}) = $ ? (It must be 1 or no key exists.)`, answer: "1", accept: [], hint: `Run Euclid: keep dividing and taking remainders until 0; the last nonzero remainder is the gcd.` },
      { instruction: `Find $d$ with $${a}d \\equiv 1 \\pmod{${n}}$, giving your answer in the range $0..${n - 1}$.`, answer: `${inv}`, accept: [`d=${inv}`, `${inv - n}`], hint: `Back-substitution yields some coefficient $x$ with $${a}x + ${n}y = 1$; if $x$ is negative, add ${n}.` },
      { instruction: `Check the key: $${a} \\cdot ${inv} = $ ?`, answer: `${p}`, accept: [], hint: "Multiply them out." },
      { instruction: `And $${p} \\bmod ${n} = $ ?`, answer: "1", accept: [], hint: `$${k} \\cdot ${n} = ${k * n}$.` },
    ],
    finalAnswer: { value: `${inv}`, unit: "" },
    solutionNarrative: `$\\gcd(${a}, ${n}) = 1$, so the key exists. Extended Euclid gives $d = ${inv}$: check $${a} \\cdot ${inv} = ${p} = ${k} \\cdot ${n} + 1 \\equiv 1 \\pmod{${n}}$. This is byte-for-byte what OpenSSL does with 2048-bit numbers.`,
  };
};

// --- gcd-in-crypto ---

const REDUCE_PAIRS = [[1, 2], [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7], [4, 7], [5, 8]];

fill["cr1-gcdcrypto-d1"] = (rng, idx) => {
  const g = rng.int(2, 8);
  const [p, q] = rng.pick(REDUCE_PAIRS);
  const num = g * p, den = g * q;
  return {
    id: `gen.cr1-gcdcrypto-d1.${idx}`, generated: true, concepts: ["gcd-in-crypto"], difficulty: 1, context: "applied",
    prompt: `A cipher wheel advances ${num} positions out of every ${den}. As a fraction of a full turn, reduce $\\frac{${num}}{${den}}$ to lowest terms.`,
    steps: [
      { instruction: `Compute $\\gcd(${num}, ${den})$.`, answer: `${g}`, accept: [], hint: `Run Euclid, or spot the largest common divisor directly.` },
      { instruction: `Divide the numerator by the gcd: $${num} \\div ${g} = $ ?`, answer: `${p}`, accept: [], hint: "One division." },
      { instruction: `Divide the denominator by the gcd: $${den} \\div ${g} = $ ?`, answer: `${q}`, accept: [], hint: "One division." },
    ],
    finalAnswer: { value: `${p}/${q}`, unit: "" },
    solutionNarrative: `$\\gcd(${num}, ${den}) = ${g}$, so $\\frac{${num}}{${den}} = \\frac{${p}}{${q}}$ — lowest terms in a single gcd.`,
  };
};

const PQ_PAIRS = [[3, 5], [3, 7], [3, 11], [5, 7], [3, 13], [5, 11]];

fill["cr1-gcdcrypto-d2"] = (rng, idx) => {
  const [pp, qq] = rng.pick(PQ_PAIRS);
  const phi = (pp - 1) * (qq - 1);
  const valid = rng.int(0, 1) === 1;
  let e;
  if (valid) { do { e = rng.int(3, phi - 1); } while (gcd(e, phi) !== 1); }
  else { do { e = rng.int(3, phi - 1); } while (gcd(e, phi) === 1); }
  const g = gcd(e, phi);
  const yn = valid ? "yes" : "no";
  return {
    id: `gen.cr1-gcdcrypto-d2.${idx}`, generated: true, concepts: ["gcd-in-crypto"], difficulty: 2, context: "applied",
    prompt: `Toy RSA key check. With primes $p = ${pp}$ and $q = ${qq}$, we get $\\varphi(n) = (p-1)(q-1)$. Is $e = ${e}$ a valid public exponent? (Valid means $\\gcd(e, \\varphi) = 1$, so the private key $d = e^{-1}$ exists.)`,
    steps: [
      { instruction: `Compute $\\varphi = (${pp} - 1)(${qq} - 1)$.`, answer: `${phi}`, accept: [], hint: `$${pp - 1} \\cdot ${qq - 1}$.` },
      { instruction: `Compute $\\gcd(${e}, ${phi})$.`, answer: `${g}`, accept: [], hint: "Run Euclid or compare prime factors." },
      { instruction: `Is $e = ${e}$ a valid exponent? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `The gcd is ${g}; an inverse mod $\\varphi$ exists exactly when the gcd is 1.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: valid
      ? `$\\varphi = ${phi}$ and $\\gcd(${e}, ${phi}) = 1$, so $e = ${e}$ is legal — its inverse $d$ exists and the key pair can be built.`
      : `$\\varphi = ${phi}$ but $\\gcd(${e}, ${phi}) = ${g} \\ne 1$, so $e = ${e}$ has NO inverse mod ${phi} — key generation must pick a different $e$.`,
  };
};

const GEAR_PAIRS = [[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 6], [4, 7], [3, 7], [5, 7]];

fill["cr1-gcdcrypto-d3"] = (rng, idx) => {
  const g = rng.int(2, 6);
  const [p, q] = rng.pick(GEAR_PAIRS);
  const a = g * p, b = g * q;
  const l = g * p * q;
  return {
    id: `gen.cr1-gcdcrypto-d3.${idx}`, generated: true, concepts: ["gcd-in-crypto"], difficulty: 3, context: "applied",
    prompt: `Two meshed cipher-machine rotors have ${a} and ${b} teeth, with painted marks currently aligned. The marks realign after $\\mathrm{lcm}(${a}, ${b})$ teeth have passed. Find when — and how many full turns each rotor makes.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `Run Euclid: $${Math.max(a, b)} \\bmod ${Math.min(a, b)}$, and so on.` },
      { instruction: `Compute $\\mathrm{lcm}(${a}, ${b}) = \\dfrac{${a} \\cdot ${b}}{\\gcd}$.`, answer: `${l}`, accept: [], hint: `$${a * b} \\div ${g}$.` },
      { instruction: `How many full turns does the ${a}-tooth rotor make in ${l} teeth?`, answer: `${q}`, accept: [], hint: `$${l} \\div ${a}$.` },
      { instruction: `And the ${b}-tooth rotor?`, answer: `${p}`, accept: [], hint: `$${l} \\div ${b}$.` },
    ],
    finalAnswer: { value: `${l}`, unit: "teeth" },
    solutionNarrative: `$\\gcd(${a}, ${b}) = ${g}$, so $\\mathrm{lcm} = \\frac{${a} \\cdot ${b}}{${g}} = ${l}$: the marks realign after ${l} teeth — ${q} turns of the ${a}-tooth rotor and ${p} of the ${b}-tooth one. Rotor-cycle alignment like this is what made Enigma's period structure attackable.`,
  };
};
