// gen-nt1-fill.js
// Parametric generators for the FOUNDATIONAL Number Theory topics
//   number-theory.divisibility-and-primes
//   number-theory.gcd-lcm-and-bezout
//   number-theory.congruences-and-crt
//   number-theory.diophantine-equations
// One template per (concept, difficulty 1/2/3) => 48 generators, prefix "nt1-".
// Self-contained: exports a `fill` map template-name -> generator fn (same pack
// pattern as gen-crypto1-fill.js). No imports from generator.js. Every answer is
// computed IN-PACK from the same numbers shown, using the helpers below (own gcd,
// extended Euclid, CRT, factorization). Deterministic from the passed rng.

// ---------------------------------------------------------------------------
// Number-theory helpers (all pure, all in-pack)
// ---------------------------------------------------------------------------
const mod = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

// Extended Euclid: returns {g, s, t} with a*s + b*t = g. This is THE canonical
// output we grade Bezout / Diophantine coefficients against.
function extgcd(a, b) {
  let old_r = a, r = b, old_s = 1, s = 0, old_t = 0, t = 1;
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
    [old_t, t] = [t, old_t - q * t];
  }
  return { g: old_r, s: old_s, t: old_t }; // a*old_s + b*old_t = old_r
}

// Modular inverse of a mod n in [0, n), or null if gcd(a,n) != 1.
function modInverse(a, n) {
  const { g, s } = extgcd(mod(a, n), n);
  if (g !== 1) return null;
  return mod(s, n);
}

const isPrime = (n) => {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
};

const smallestFactor = (n) => {
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return d;
  return n;
};

// Prime factorization as an array of {p, e}, ascending prime.
function factorize(n) {
  const out = [];
  let m = n;
  for (let d = 2; d * d <= m; d++) {
    if (m % d === 0) {
      let e = 0;
      while (m % d === 0) { m /= d; e++; }
      out.push({ p: d, e });
    }
  }
  if (m > 1) out.push({ p: m, e: 1 });
  return out;
}

// Number of divisors from the exponent list: product of (e_i + 1).
const numDivisors = (facs) => facs.reduce((acc, f) => acc * (f.e + 1), 1);

// Render a factorization array as LaTeX "2^{3} \cdot 3 \cdot 5".
function facLatex(facs) {
  return facs.map((f) => (f.e === 1 ? `${f.p}` : `${f.p}^{${f.e}}`)).join(" \\cdot ");
}

// Count primes <= n (simple sieve).
function primesUpTo(n) {
  const sieve = new Array(n + 1).fill(true);
  sieve[0] = sieve[1] = false;
  for (let i = 2; i * i <= n; i++) if (sieve[i]) for (let j = i * i; j <= n; j += i) sieve[j] = false;
  const out = [];
  for (let i = 2; i <= n; i++) if (sieve[i]) out.push(i);
  return out;
}

// CRT for two congruences x ≡ a1 (m1), x ≡ a2 (m2), coprime moduli.
// Returns smallest nonnegative solution mod m1*m2.
function crt2(a1, m1, a2, m2) {
  const M = m1 * m2;
  const inv = modInverse(m1, m2); // (m1)^{-1} mod m2
  // x = a1 + m1 * ((a2 - a1) * inv mod m2)
  const t = mod((a2 - a1) * inv, m2);
  return mod(a1 + m1 * t, M);
}

const signStr = (v) => (v < 0 ? `(${v})` : `${v}`);

export const fill = {};

// ===========================================================================
// TOPIC 1 — number-theory.divisibility-and-primes
//   concepts: divisibility-rules, primes-and-sieve, prime-factorization,
//             fundamental-theorem
// ===========================================================================

// --- divisibility-rules ---

fill["nt1-divisibility-1"] = (rng, idx) => {
  const divisor = rng.pick([2, 3, 5, 9, 10]);
  const q = rng.int(4, 40), r = rng.int(1, divisor - 1);
  const n = q * divisor + r;
  const divides = false; // built with a nonzero remainder
  return {
    id: `gen.nt1-divisibility-1.${idx}`, generated: true, concepts: ["divisibility-rules"], difficulty: 1, context: "abstract",
    prompt: `Use the division algorithm to divide ${n} by ${divisor}: write $${n} = q \\cdot ${divisor} + r$ with $0 \\le r < ${divisor}$.`,
    steps: [
      { instruction: `What is the quotient $q$ (the largest whole number of ${divisor}s in ${n})?`, answer: `${q}`, accept: [], hint: `$${divisor} \\cdot ${q} = ${q * divisor}$, and $${divisor} \\cdot ${q + 1} = ${(q + 1) * divisor}$ overshoots.` },
      { instruction: `What is the remainder $r = ${n} - ${divisor} \\cdot ${q}$?`, answer: `${r}`, accept: [], hint: `$${n} - ${q * divisor}$.` },
      { instruction: `Does ${divisor} divide ${n} exactly? Type 'yes' or 'no'.`, answer: divides ? "yes" : "no", accept: [divides ? "y" : "n"], hint: `${divisor} divides ${n} exactly only when the remainder is 0.` },
    ],
    finalAnswer: { value: `r = ${r}`, unit: "" },
    solutionNarrative: `$${n} = ${q} \\cdot ${divisor} + ${r}$, so the remainder is ${r} (nonzero), and ${divisor} does not divide ${n}.`,
  };
};

fill["nt1-divisibility-2"] = (rng, idx) => {
  // Apply a divisibility rule (3 or 9 via digit sum, 11 via alternating sum).
  const rule = rng.pick([3, 9, 11]);
  const makeMultiple = rng.int(0, 1) === 1;
  let n;
  if (makeMultiple) { n = rule * rng.int(30, 300); }
  else { do { n = rng.int(100, 3000); } while (n % rule === 0); }
  const divides = n % rule === 0;
  const digits = String(n).split("").map(Number);
  const digitSum = digits.reduce((a, b) => a + b, 0);
  const altSum = digits.reduce((a, d, i) => a + (i % 2 === 0 ? d : -d), 0);
  const testVal = rule === 11 ? altSum : digitSum;
  const testName = rule === 11 ? "alternating digit sum (from the left, + - + - ...)" : "digit sum";
  return {
    id: `gen.nt1-divisibility-2.${idx}`, generated: true, concepts: ["divisibility-rules"], difficulty: 2, context: "abstract",
    prompt: `Test whether ${n} is divisible by ${rule} using the ${testName} rule.`,
    steps: [
      { instruction: `Compute the ${testName} of ${n} (digits ${digits.join(", ")}).`, answer: `${testVal}`, accept: [], hint: rule === 11 ? `Alternate signs: $${digits.map((d, i) => (i === 0 ? `${d}` : (i % 2 ? `- ${d}` : `+ ${d}`))).join(" ")}$.` : `Add the digits: $${digits.join(" + ")}$.` },
      { instruction: `Is that value (${testVal}) divisible by ${rule}? Type 'yes' or 'no'.`, answer: divides ? "yes" : "no", accept: [divides ? "y" : "n"], hint: `${rule} divides ${n} exactly when it divides the ${testName}.` },
      { instruction: `Therefore, is ${n} divisible by ${rule}? Type 'yes' or 'no'.`, answer: divides ? "yes" : "no", accept: [divides ? "y" : "n"], hint: `The rule transfers divisibility from the ${testName} to ${n} itself.` },
    ],
    finalAnswer: { value: divides ? "yes" : "no", unit: "" },
    solutionNarrative: `The ${testName} of ${n} is ${testVal}; ${divides ? `${rule} divides ${testVal}, so ${rule} divides ${n}` : `${rule} does not divide ${testVal}, so ${rule} does not divide ${n}`}.`,
  };
};

fill["nt1-divisibility-3"] = (rng, idx) => {
  // Division algorithm with a larger divisor, plus a negative-dividend twist.
  const divisor = rng.int(6, 19);
  const q = rng.int(5, 30), r = rng.int(1, divisor - 1);
  const n = q * divisor + r;
  // Negative dividend: -n = -(q+1)*divisor + (divisor - r)
  const negQ = -(q + 1), negR = divisor - r;
  return {
    id: `gen.nt1-divisibility-3.${idx}`, generated: true, concepts: ["divisibility-rules"], difficulty: 3, context: "abstract",
    prompt: `The division algorithm requires $0 \\le r < ${divisor}$ even for negatives. Find the quotient and remainder when $-${n}$ is divided by ${divisor}.`,
    steps: [
      { instruction: `First divide the positive ${n} by ${divisor}: remainder $r$ = ?`, answer: `${r}`, accept: [], hint: `$${n} = ${q} \\cdot ${divisor} + ${r}$.` },
      { instruction: `For $-${n}$, the remainder must stay in $0..${divisor - 1}$. Compute it as $${divisor} - ${r}$.`, answer: `${negR}`, accept: [], hint: `A negative dividend borrows one more multiple of ${divisor}, leaving remainder $${divisor} - ${r} = ${negR}$.` },
      { instruction: `What is the quotient $q$ so that $-${n} = q \\cdot ${divisor} + ${negR}$?`, answer: `${negQ}`, accept: [], hint: `$${negQ} \\cdot ${divisor} + ${negR} = ${negQ * divisor + negR} = -${n}$.` },
    ],
    finalAnswer: { value: `q = ${negQ}, r = ${negR}`, unit: "" },
    solutionNarrative: `$-${n} = ${negQ} \\cdot ${divisor} + ${negR}$ with $0 \\le ${negR} < ${divisor}$ — the remainder is always taken nonnegative, so quotient ${negQ} and remainder ${negR}.`,
  };
};

// --- primes-and-sieve ---

fill["nt1-sieve-1"] = (rng, idx) => {
  const PRIMES = [23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  const COMPOS = [{ n: 51, f: 3 }, { n: 57, f: 3 }, { n: 69, f: 3 }, { n: 77, f: 7 }, { n: 87, f: 3 }, { n: 91, f: 7 }, { n: 93, f: 3 }, { n: 95, f: 5 }, { n: 49, f: 7 }, { n: 55, f: 5 }];
  const prime = rng.int(0, 1) === 1;
  const item = prime ? { n: rng.pick(PRIMES), f: null } : rng.pick(COMPOS);
  const n = item.n;
  const maxTest = Math.floor(Math.sqrt(n));
  const testPrimes = [2, 3, 5, 7].filter((p) => p <= maxTest);
  const steps = prime
    ? [
        { instruction: `You only trial-divide by primes up to $\\sqrt{${n}}$. List gives ${testPrimes.join(", ")}. Does any of them divide ${n}? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: `Check evenness, digit-sum for 3, last digit for 5, and divide by 7.` },
        { instruction: `So is ${n} prime or composite? Type 'prime' or 'composite'.`, answer: "prime", accept: ["p"], hint: `No prime up to $\\sqrt{n}$ divides it.` },
      ]
    : [
        { instruction: `Find a prime factor of ${n} (try the small primes ${testPrimes.join(", ")}).`, answer: `${item.f}`, accept: [], hint: item.f === 3 ? `The digit sum of ${n} is a multiple of 3.` : item.f === 5 ? `${n} ends in 0 or 5.` : `$7 \\cdot ${n / item.f} = ${n}$.` },
        { instruction: `So is ${n} prime or composite? Type 'prime' or 'composite'.`, answer: "composite", accept: ["c"], hint: `It has a divisor other than 1 and itself.` },
      ];
  return {
    id: `gen.nt1-sieve-1.${idx}`, generated: true, concepts: ["primes-and-sieve"], difficulty: 1, context: "abstract",
    prompt: `Is ${n} prime? Trial-divide by primes up to $\\sqrt{${n}}$.`,
    steps,
    finalAnswer: { value: prime ? "prime" : "composite", unit: "" },
    solutionNarrative: prime
      ? `No prime up to $\\sqrt{${n}} \\approx ${maxTest}$ divides ${n}, so ${n} is prime.`
      : `$${n} = ${item.f} \\cdot ${n / item.f}$, so ${n} is composite.`,
  };
};

fill["nt1-sieve-2"] = (rng, idx) => {
  const N = rng.pick([20, 25, 30, 40, 50]);
  const primes = primesUpTo(N);
  const count = primes.length;
  return {
    id: `gen.nt1-sieve-2.${idx}`, generated: true, concepts: ["primes-and-sieve"], difficulty: 2, context: "abstract",
    prompt: `Use the Sieve of Eratosthenes to count the primes up to ${N}.`,
    steps: [
      { instruction: `After sieving, the largest prime you must sieve WITH (cross out multiples of) is the largest prime $\\le \\sqrt{${N}}$. What is it?`, answer: `${primes.filter((p) => p * p <= N).slice(-1)[0]}`, accept: [], hint: `$\\sqrt{${N}} \\approx ${Math.sqrt(N).toFixed(1)}$; sieve with primes up to there (2, 3, 5, ...).` },
      { instruction: `How many primes are there in total up to ${N}?`, answer: `${count}`, accept: [], hint: `The survivors are ${primes.join(", ")}.` },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: `Sieving up to ${N} leaves ${primes.join(", ")} — that is ${count} primes.`,
  };
};

fill["nt1-sieve-3"] = (rng, idx) => {
  // Composite that looks prime; verify via sqrt bound and a factor.
  const items = [
    { n: 143, f: 11, c: 13 }, { n: 187, f: 11, c: 17 }, { n: 221, f: 13, c: 17 },
    { n: 209, f: 11, c: 19 }, { n: 247, f: 13, c: 19 }, { n: 253, f: 11, c: 23 },
    { n: 133, f: 7, c: 19 }, { n: 161, f: 7, c: 23 }, { n: 203, f: 7, c: 29 },
  ];
  const item = rng.pick(items);
  const maxTest = Math.floor(Math.sqrt(item.n));
  return {
    id: `gen.nt1-sieve-3.${idx}`, generated: true, concepts: ["primes-and-sieve"], difficulty: 3, context: "abstract",
    prompt: `${item.n} looks prime but isn't. To be sure, you must trial-divide by every prime up to $\\sqrt{${item.n}}$. Find its factorization.`,
    steps: [
      { instruction: `What is the largest integer $\\le \\sqrt{${item.n}}$ (the trial-division bound)?`, answer: `${maxTest}`, accept: [], hint: `$${maxTest}^2 = ${maxTest * maxTest} \\le ${item.n} < ${(maxTest + 1) ** 2} = ${(maxTest + 1) ** 2}$.` },
      { instruction: `Its smallest prime factor is ${item.f}. Compute the cofactor $${item.n} \\div ${item.f}$.`, answer: `${item.c}`, accept: [], hint: `$${item.f} \\cdot ${item.c} = ${item.n}$.` },
      { instruction: `So is ${item.n} prime or composite? Type 'prime' or 'composite'.`, answer: "composite", accept: ["c"], hint: `It equals $${item.f} \\cdot ${item.c}$.` },
    ],
    finalAnswer: { value: "composite", unit: "" },
    solutionNarrative: `$${item.n} = ${item.f} \\cdot ${item.c}$. Because both factors exceed 10, ${item.n} slips past a careless check — but trial division up to $\\sqrt{${item.n}} \\approx ${maxTest}$ catches ${item.f}.`,
  };
};

// --- prime-factorization ---
// NOTE: form:"factored" cannot gate a PURE-NUMBER factorization (the grader's
// isFactoredForm requires a variable), so we grade factorization as unambiguous
// NUMERIC decomposition steps: peel each prime, then report exponents/counts.

fill["nt1-primefact-1"] = (rng, idx) => {
  const a = rng.int(1, 3);          // power of 2
  const odd = rng.pick([3, 5, 7, 9, 15, 21, 25, 27, 35]);
  const n = 2 ** a * odd;
  const facs = factorize(n);
  const total = facs.reduce((s, f) => s + f.e, 0);
  return {
    id: `gen.nt1-primefact-1.${idx}`, generated: true, concepts: ["prime-factorization"], difficulty: 1, context: "abstract",
    prompt: `Find the prime factorization of ${n} by peeling off small primes. (Report it as prime powers, e.g. $2^{3} \\cdot 3 \\cdot 5$.)`,
    steps: [
      { instruction: `How many times does 2 divide ${n}? (Halve until odd.)`, answer: `${a}`, accept: [], hint: `$${n}${a >= 1 ? ` \\to ${n / 2}` : ""}${a >= 2 ? ` \\to ${n / 4}` : ""}${a >= 3 ? ` \\to ${n / 8}` : ""}$ — stop at the odd number ${odd}.` },
      { instruction: `What odd number remains after removing all the 2s ($${n} \\div ${2 ** a}$)?`, answer: `${odd}`, accept: [], hint: `Divide out $2^{${a}} = ${2 ** a}$.` },
      { instruction: `Counting with multiplicity, how many prime factors does ${n} have in total?`, answer: `${total}`, accept: [], hint: `$${n} = ${facLatex(facs)}$ — add up all the exponents.` },
    ],
    finalAnswer: { value: `${n} = ${facs.map((f) => (f.e === 1 ? `${f.p}` : `${f.p}^${f.e}`)).join(" * ")}`, unit: "" },
    solutionNarrative: `$${n} = ${facLatex(facs)}$, with ${total} prime factors counted with multiplicity. Unique factorization guarantees no other prime decomposition exists.`,
  };
};

fill["nt1-primefact-2"] = (rng, idx) => {
  // Two/three distinct primes, mixed exponents.
  const P = rng.pick([2, 3, 5, 7]);
  const Q = rng.pick([3, 5, 7, 11].filter((x) => x !== P));
  const ep = rng.int(1, 3), eq = rng.int(1, 2);
  const n = P ** ep * Q ** eq;
  const facs = factorize(n);
  const distinct = facs.length;
  const total = facs.reduce((s, f) => s + f.e, 0);
  return {
    id: `gen.nt1-primefact-2.${idx}`, generated: true, concepts: ["prime-factorization"], difficulty: 2, context: "abstract",
    prompt: `Factor ${n} into primes using a factor tree, then report the exponents.`,
    steps: [
      { instruction: `What is the exponent of ${P} in the factorization of ${n}? (How many times does ${P} divide it?)`, answer: `${ep}`, accept: [], hint: `Divide ${n} by ${P} repeatedly.` },
      { instruction: `What is the exponent of ${Q} in the factorization of ${n}?`, answer: `${eq}`, accept: [], hint: `Divide the remaining part by ${Q} repeatedly.` },
      { instruction: `How many DISTINCT primes divide ${n}?`, answer: `${distinct}`, accept: [], hint: `$${n} = ${facLatex(facs)}$.` },
    ],
    finalAnswer: { value: `${n} = ${facs.map((f) => (f.e === 1 ? `${f.p}` : `${f.p}^${f.e}`)).join(" * ")}`, unit: "" },
    solutionNarrative: `$${n} = ${facLatex(facs)}$: ${distinct} distinct primes, ${total} prime factors with multiplicity.`,
  };
};

fill["nt1-primefact-3"] = (rng, idx) => {
  // Larger n with three prime powers.
  const P = 2, ep = rng.int(1, 4);
  const Q = rng.pick([3, 5]), eq = rng.int(1, 2);
  const R = rng.pick([7, 11, 13].filter((x) => x !== Q));
  const n = P ** ep * Q ** eq * R;
  const facs = factorize(n);
  const total = facs.reduce((s, f) => s + f.e, 0);
  const ndiv = numDivisors(facs);
  return {
    id: `gen.nt1-primefact-3.${idx}`, generated: true, concepts: ["prime-factorization"], difficulty: 3, context: "abstract",
    prompt: `Fully factor ${n}, then use the exponents to count how many positive divisors it has.`,
    steps: [
      { instruction: `Exponent of 2 in ${n}?`, answer: `${ep}`, accept: [], hint: `Halve ${n} until odd.` },
      { instruction: `After removing the 2s you have ${n / 2 ** ep}. Its two odd prime factors are ${Q} and ${R}. What is the exponent of ${Q}?`, answer: `${eq}`, accept: [], hint: `Divide ${n / 2 ** ep} by ${Q} until it no longer divides.` },
      { instruction: `Total prime factors with multiplicity?`, answer: `${total}`, accept: [], hint: `Add the exponents in $${facLatex(facs)}$.` },
      { instruction: `Number of positive divisors = product of (each exponent + 1). Compute it.`, answer: `${ndiv}`, accept: [], hint: `$${facs.map((f) => `(${f.e}+1)`).join(" \\cdot ")} = ${facs.map((f) => f.e + 1).join(" \\cdot ")}$.` },
    ],
    finalAnswer: { value: `${ndiv}`, unit: "" },
    solutionNarrative: `$${n} = ${facLatex(facs)}$; the divisor count is $${facs.map((f) => `(${f.e}+1)`).join("")} = ${ndiv}$.`,
  };
};

// --- fundamental-theorem ---

fill["nt1-fundthm-1"] = (rng, idx) => {
  // Divisor count from a given factorization.
  const P = rng.pick([2, 3, 5]), Q = rng.pick([3, 5, 7].filter((x) => x !== P));
  const ep = rng.int(1, 3), eq = rng.int(1, 2);
  const n = P ** ep * Q ** eq;
  const ndiv = (ep + 1) * (eq + 1);
  return {
    id: `gen.nt1-fundthm-1.${idx}`, generated: true, concepts: ["fundamental-theorem"], difficulty: 1, context: "abstract",
    prompt: `Given that $${n} = ${P}^{${ep}} \\cdot ${Q}^{${eq}}$, count its positive divisors using the exponent formula $(e_1+1)(e_2+1)\\cdots$.`,
    steps: [
      { instruction: `Add 1 to the first exponent: $${ep} + 1 = $ ?`, answer: `${ep + 1}`, accept: [], hint: `The exponent of ${P} is ${ep}.` },
      { instruction: `Add 1 to the second exponent: $${eq} + 1 = $ ?`, answer: `${eq + 1}`, accept: [], hint: `The exponent of ${Q} is ${eq}.` },
      { instruction: `Multiply: number of divisors $= ${ep + 1} \\cdot ${eq + 1} = $ ?`, answer: `${ndiv}`, accept: [], hint: `Each divisor picks a power of ${P} (0..${ep}) and a power of ${Q} (0..${eq}).` },
    ],
    finalAnswer: { value: `${ndiv}`, unit: "" },
    solutionNarrative: `$(${ep}+1)(${eq}+1) = ${ndiv}$ divisors — one for each independent choice of prime-power exponents.`,
  };
};

fill["nt1-fundthm-2"] = (rng, idx) => {
  // Uniqueness: is a claimed factorization valid / are two numbers' shared prime factors used.
  const facs = [
    { p: 2, e: rng.int(1, 3) }, { p: 3, e: rng.int(1, 2) }, { p: rng.pick([5, 7]), e: 1 },
  ];
  const n = facs.reduce((acc, f) => acc * f.p ** f.e, 1);
  const total = facs.reduce((s, f) => s + f.e, 0);
  const ndiv = numDivisors(facs);
  return {
    id: `gen.nt1-fundthm-2.${idx}`, generated: true, concepts: ["fundamental-theorem"], difficulty: 2, context: "abstract",
    prompt: `The Fundamental Theorem of Arithmetic says ${n} has EXACTLY ONE prime factorization: $${facLatex(facs)}$. Use it to answer two counting questions.`,
    steps: [
      { instruction: `How many prime factors does ${n} have, counted with multiplicity?`, answer: `${total}`, accept: [], hint: `Add the exponents: $${facs.map((f) => f.e).join(" + ")}$.` },
      { instruction: `How many DISTINCT prime factors does ${n} have?`, answer: `${facs.length}`, accept: [], hint: `Count the distinct bases in $${facLatex(facs)}$.` },
      { instruction: `How many positive divisors does ${n} have? (Use $(e_i+1)$ product.)`, answer: `${ndiv}`, accept: [], hint: `$${facs.map((f) => `(${f.e}+1)`).join("")} = ${ndiv}$.` },
    ],
    finalAnswer: { value: `${ndiv}`, unit: "" },
    solutionNarrative: `Uniqueness makes these counts well-defined: ${total} factors with multiplicity, ${facs.length} distinct, and $${facs.map((f) => `(${f.e}+1)`).join("")} = ${ndiv}$ divisors.`,
  };
};

fill["nt1-fundthm-3"] = (rng, idx) => {
  // Perfect square test / divisor count parity, or is n a perfect square (all exps even).
  const P = 2, Q = rng.pick([3, 5]);
  const square = rng.int(0, 1) === 1;
  const ep = square ? rng.pick([2, 4]) : rng.pick([1, 3]);
  const eq = square ? 2 : rng.pick([1, 2]);
  // ensure "square" means all exponents even
  const eqUse = square ? 2 : eq;
  const facs = [{ p: P, e: ep }, { p: Q, e: eqUse }];
  const n = P ** ep * Q ** eqUse;
  const isSquare = ep % 2 === 0 && eqUse % 2 === 0;
  const ndiv = numDivisors(facs);
  return {
    id: `gen.nt1-fundthm-3.${idx}`, generated: true, concepts: ["fundamental-theorem"], difficulty: 3, context: "abstract",
    prompt: `Given $${n} = ${facLatex(facs)}$, decide whether ${n} is a perfect square — a number is a perfect square exactly when every exponent in its prime factorization is even.`,
    steps: [
      { instruction: `Number of positive divisors of ${n} (product of $(e_i+1)$)?`, answer: `${ndiv}`, accept: [], hint: `$(${ep}+1)(${eqUse}+1)$.` },
      { instruction: `Are all exponents (${ep} and ${eqUse}) even? Type 'yes' or 'no'.`, answer: isSquare ? "yes" : "no", accept: [isSquare ? "y" : "n"], hint: `Check each exponent for evenness.` },
      { instruction: `So is ${n} a perfect square? Type 'yes' or 'no'.`, answer: isSquare ? "yes" : "no", accept: [isSquare ? "y" : "n"], hint: `All-even exponents $\\iff$ perfect square (its divisor count is then odd).` },
    ],
    finalAnswer: { value: isSquare ? "yes" : "no", unit: "" },
    solutionNarrative: isSquare
      ? `Every exponent in $${facLatex(facs)}$ is even, so ${n} $= (${P ** (ep / 2) * Q ** (eqUse / 2)})^2$ is a perfect square (and its divisor count ${ndiv} is odd).`
      : `An exponent in $${facLatex(facs)}$ is odd, so ${n} is not a perfect square (its divisor count ${ndiv} is even).`,
  };
};

// ===========================================================================
// TOPIC 2 — number-theory.gcd-lcm-and-bezout
//   concepts: euclidean-algorithm, lcm-and-gcd-product, bezout-coefficients,
//             coprime-and-applications
// ===========================================================================

// --- euclidean-algorithm ---

fill["nt1-euclid-1"] = (rng, idx) => {
  const g = rng.int(2, 9);
  const q2 = rng.int(2, 4), b = q2 * g;
  const q1 = rng.int(1, 3), a = q1 * b + g;
  return {
    id: `gen.nt1-euclid-1.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 1, context: "abstract",
    prompt: `Run the Euclidean algorithm to find $\\gcd(${a}, ${b})$, writing the remainder sequence.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: remainder $r$? ($${a} = ${q1} \\cdot ${b} + r$)`, answer: `${g}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${g}: remainder?`, answer: "0", accept: [], hint: `$${g} \\cdot ${q2} = ${b}$ exactly.` },
      { instruction: `The last NONZERO remainder is the gcd. So $\\gcd(${a}, ${b}) = $ ?`, answer: `${g}`, accept: [], hint: "Look one line up." },
    ],
    finalAnswer: { value: `${g}`, unit: "" },
    solutionNarrative: `$${a} = ${q1} \\cdot ${b} + ${g}$; $${b} = ${q2} \\cdot ${g} + 0$. Remainder sequence $${g} \\to 0$, so $\\gcd = ${g}$.`,
  };
};

fill["nt1-euclid-2"] = (rng, idx) => {
  const r2 = rng.int(2, 7);
  const q3 = rng.int(2, 4), r1 = q3 * r2;
  const q2 = rng.int(1, 3), b = q2 * r1 + r2;
  const q1 = rng.int(1, 3), a = q1 * b + r1;
  return {
    id: `gen.nt1-euclid-2.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 2, context: "abstract",
    prompt: `Find $\\gcd(${a}, ${b})$ with the Euclidean algorithm. Track the full remainder sequence.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: remainder? ($${b} \\cdot ${q1} = ${q1 * b}$)`, answer: `${r1}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${r1}: remainder? ($${r1} \\cdot ${q2} = ${q2 * r1}$)`, answer: `${r2}`, accept: [], hint: `$${b} - ${q2 * r1}$.` },
      { instruction: `Divide ${r1} by ${r2}: remainder?`, answer: "0", accept: [], hint: `$${r2} \\cdot ${q3} = ${r1}$ exactly.` },
      { instruction: `So $\\gcd(${a}, ${b}) = $ ? (last nonzero remainder)`, answer: `${r2}`, accept: [], hint: `Remainder sequence: $${r1} \\to ${r2} \\to 0$.` },
    ],
    finalAnswer: { value: `${r2}`, unit: "" },
    solutionNarrative: `$${a} = ${q1} \\cdot ${b} + ${r1}$; $${b} = ${q2} \\cdot ${r1} + ${r2}$; $${r1} = ${q3} \\cdot ${r2} + 0$. So $\\gcd = ${r2}$.`,
  };
};

fill["nt1-euclid-3"] = (rng, idx) => {
  const r3 = rng.int(2, 6);
  const q4 = rng.int(2, 3), r2 = q4 * r3;
  const q3 = rng.int(1, 3), r1 = q3 * r2 + r3;
  const q2 = rng.int(1, 3), b = q2 * r1 + r2;
  const q1 = rng.int(1, 3), a = q1 * b + r1;
  return {
    id: `gen.nt1-euclid-3.${idx}`, generated: true, concepts: ["euclidean-algorithm"], difficulty: 3, context: "abstract",
    prompt: `Find $\\gcd(${a}, ${b})$ — a four-division Euclidean cascade. Write every remainder.`,
    steps: [
      { instruction: `Divide ${a} by ${b}: remainder? ($${b} \\cdot ${q1} = ${q1 * b}$)`, answer: `${r1}`, accept: [], hint: `$${a} - ${q1 * b}$.` },
      { instruction: `Divide ${b} by ${r1}: remainder? ($${r1} \\cdot ${q2} = ${q2 * r1}$)`, answer: `${r2}`, accept: [], hint: `$${b} - ${q2 * r1}$.` },
      { instruction: `Divide ${r1} by ${r2}: remainder? ($${r2} \\cdot ${q3} = ${q3 * r2}$)`, answer: `${r3}`, accept: [], hint: `$${r1} - ${q3 * r2}$.` },
      { instruction: `Divide ${r2} by ${r3}: remainder?`, answer: "0", accept: [], hint: `$${r3} \\cdot ${q4} = ${r2}$ exactly.` },
      { instruction: `So $\\gcd(${a}, ${b}) = $ ?`, answer: `${r3}`, accept: [], hint: `Sequence $${r1} \\to ${r2} \\to ${r3} \\to 0$.` },
    ],
    finalAnswer: { value: `${r3}`, unit: "" },
    solutionNarrative: `Remainder cascade $${r1} \\to ${r2} \\to ${r3} \\to 0$, so $\\gcd(${a}, ${b}) = ${r3}$.`,
  };
};

// --- lcm-and-gcd-product ---

fill["nt1-lcm-1"] = (rng, idx) => {
  const g = rng.int(2, 8);
  const [p, q] = rng.pick([[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 6]]);
  const a = g * p, b = g * q;
  const l = lcm(a, b);
  return {
    id: `gen.nt1-lcm-1.${idx}`, generated: true, concepts: ["lcm-and-gcd-product"], difficulty: 1, context: "abstract",
    prompt: `Compute $\\mathrm{lcm}(${a}, ${b})$ using $\\mathrm{lcm}(a,b) = \\dfrac{a \\cdot b}{\\gcd(a,b)}$.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `The largest common divisor of ${a} and ${b}.` },
      { instruction: `Compute the product $${a} \\cdot ${b}$.`, answer: `${a * b}`, accept: [], hint: "Multiply." },
      { instruction: `Divide: $\\mathrm{lcm} = ${a * b} \\div ${g} = $ ?`, answer: `${l}`, accept: [], hint: "One division finishes it." },
    ],
    finalAnswer: { value: `${l}`, unit: "" },
    solutionNarrative: `$\\gcd = ${g}$, so $\\mathrm{lcm} = \\frac{${a} \\cdot ${b}}{${g}} = ${l}$.`,
  };
};

fill["nt1-lcm-2"] = (rng, idx) => {
  // Given gcd, find lcm, or vice versa, using a*b = gcd*lcm.
  const g = rng.int(2, 12);
  const [p, q] = rng.pick([[3, 5], [4, 5], [5, 7], [4, 7], [5, 9], [7, 9]]);
  const a = g * p, b = g * q;
  const l = lcm(a, b);
  return {
    id: `gen.nt1-lcm-2.${idx}`, generated: true, concepts: ["lcm-and-gcd-product"], difficulty: 2, context: "abstract",
    prompt: `The identity $a \\cdot b = \\gcd(a,b) \\cdot \\mathrm{lcm}(a,b)$ ties the two together. Given $${a}$ and $${b}$, find both.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$ (they share the factor ${g}).`, answer: `${g}`, accept: [], hint: `$${a} = ${g} \\cdot ${p}$, $${b} = ${g} \\cdot ${q}$, and $\\gcd(${p}, ${q}) = 1$.` },
      { instruction: `Compute $${a} \\cdot ${b}$.`, answer: `${a * b}`, accept: [], hint: "The product equals gcd times lcm." },
      { instruction: `Solve for $\\mathrm{lcm} = ${a * b} \\div ${g}$.`, answer: `${l}`, accept: [], hint: `$\\mathrm{lcm} = \\frac{a b}{\\gcd}$.` },
    ],
    finalAnswer: { value: `${l}`, unit: "" },
    solutionNarrative: `$\\gcd = ${g}$ and $${a} \\cdot ${b} = ${a * b}$, so $\\mathrm{lcm} = ${a * b}/${g} = ${l}$. Check: $${g} \\cdot ${l} = ${g * l} = ${a * b}$.`,
  };
};

fill["nt1-lcm-3"] = (rng, idx) => {
  // Applied cycle-alignment.
  const g = rng.int(2, 6);
  const [p, q] = rng.pick([[3, 4], [3, 5], [4, 5], [5, 6], [4, 7], [5, 7]]);
  const a = g * p, b = g * q;
  const l = lcm(a, b);
  const CTX = rng.pick([
    { who: "Two buses", unit: "minutes", verb: "leave the depot together" },
    { who: "Two blinking lights", unit: "seconds", verb: "flash together" },
    { who: "Two gears", unit: "teeth", verb: "align their painted marks" },
  ]);
  return {
    id: `gen.nt1-lcm-3.${idx}`, generated: true, concepts: ["lcm-and-gcd-product"], difficulty: 3, context: "applied",
    prompt: `${CTX.who} have periods of ${a} and ${b} ${CTX.unit}. Starting aligned, they next ${CTX.verb} after $\\mathrm{lcm}(${a}, ${b})$ ${CTX.unit}. Find it and how many periods each completes.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: "Largest common divisor." },
      { instruction: `Compute $\\mathrm{lcm}(${a}, ${b}) = \\dfrac{${a} \\cdot ${b}}{${g}}$.`, answer: `${l}`, accept: [], hint: `$${a * b} \\div ${g}$.` },
      { instruction: `How many ${a}-${CTX.unit} periods fit in ${l} ${CTX.unit}?`, answer: `${l / a}`, accept: [], hint: `$${l} \\div ${a}$.` },
      { instruction: `How many ${b}-${CTX.unit} periods fit in ${l} ${CTX.unit}?`, answer: `${l / b}`, accept: [], hint: `$${l} \\div ${b}$.` },
    ],
    finalAnswer: { value: `${l}`, unit: CTX.unit },
    solutionNarrative: `$\\gcd = ${g}$, so $\\mathrm{lcm} = ${l}$: they re-align after ${l} ${CTX.unit} — ${l / a} and ${l / b} periods respectively.`,
  };
};

// --- bezout-coefficients ---
// Pin the NON-UNIQUE coefficients to the canonical extended-Euclid output (s, t).

fill["nt1-bezout-1"] = (rng, idx) => {
  // Verify a given Bezout pair (coprime a, b), no back-substitution needed.
  const PAIRS = [[5, 3], [7, 4], [8, 5], [9, 7], [11, 4], [7, 5], [9, 5], [8, 3]];
  const [a, b] = rng.pick(PAIRS);
  const { s, t } = extgcd(a, b); // a*s + b*t = 1
  return {
    id: `gen.nt1-bezout-1.${idx}`, generated: true, concepts: ["bezout-coefficients"], difficulty: 1, context: "abstract",
    prompt: `The extended Euclidean algorithm gives Bézout coefficients $s = ${s}$, $t = ${t}$ for $\\gcd(${a}, ${b}) = 1$. Verify that $${a}s + ${b}t = 1$.`,
    steps: [
      { instruction: `Compute $${a} \\cdot ${signStr(s)}$.`, answer: `${a * s}`, accept: [], hint: "Keep the sign." },
      { instruction: `Compute $${b} \\cdot ${signStr(t)}$.`, answer: `${b * t}`, accept: [], hint: "Keep the sign." },
      { instruction: `Add: $${a * s} + ${signStr(b * t)} = $ ?`, answer: "1", accept: [], hint: "The combination equals the gcd." },
    ],
    finalAnswer: { value: `1`, unit: "" },
    solutionNarrative: `$${a}(${s}) + ${b}(${t}) = ${a * s} + ${b * t} = 1 = \\gcd(${a}, ${b})$. These are the coefficients from the extended Euclidean algorithm.`,
  };
};

fill["nt1-bezout-2"] = (rng, idx) => {
  // Find s and t via a short extended-Euclid (two divisions), grade separately.
  const r = rng.int(2, 6);
  const q2 = rng.int(2, 3), b = q2 * r + 1; // ensure gcd small; recompute properly below
  // Build coprime pair via canonical: pick coprime a,b directly for clean extgcd
  const PAIRS = [[17, 5], [19, 7], [23, 8], [13, 8], [21, 5], [26, 7], [15, 4], [11, 9]];
  const [A, B] = rng.pick(PAIRS);
  const eg = extgcd(A, B); // A*s + B*t = 1
  const s = eg.s, t = eg.t;
  return {
    id: `gen.nt1-bezout-2.${idx}`, generated: true, concepts: ["bezout-coefficients"], difficulty: 2, context: "abstract",
    prompt: `Use the extended Euclidean algorithm to find integers $s, t$ with $${A}s + ${B}t = \\gcd(${A}, ${B}) = 1$. Report the coefficients the algorithm produces.`,
    steps: [
      { instruction: `Run Euclid forward to confirm $\\gcd(${A}, ${B}) = $ ?`, answer: "1", accept: [], hint: "Divide and take remainders until 0; the last nonzero remainder is the gcd." },
      { instruction: `Back-substitute. The coefficient $s$ on ${A} (the extended-Euclid output) is?`, answer: `${s}`, accept: [], hint: `Track how each remainder is written as a combination of ${A} and ${B}.` },
      { instruction: `And the coefficient $t$ on ${B} is?`, answer: `${t}`, accept: [], hint: `From $${A} \\cdot ${signStr(s)} + ${B} \\cdot t = 1$, solve for $t$.` },
      { instruction: `Check: $${A} \\cdot ${signStr(s)} + ${B} \\cdot ${signStr(t)} = $ ?`, answer: "1", accept: [], hint: `$${A * s} + ${signStr(B * t)}$.` },
    ],
    finalAnswer: { value: `s = ${s}, t = ${t}`, unit: "" },
    solutionNarrative: `Extended Euclid yields $s = ${s}$, $t = ${t}$: $${A}(${s}) + ${B}(${t}) = ${A * s} + ${B * t} = 1$. (Other Bézout pairs exist, but this is the algorithm's canonical output.)`,
  };
};

fill["nt1-bezout-3"] = (rng, idx) => {
  // Bezout -> modular inverse (application flavor).
  const n = rng.pick([20, 24, 26, 40, 30, 33]);
  let a; do { a = rng.int(3, n - 3); } while (gcd(a, n) !== 1);
  const eg = extgcd(a, n); // a*s + n*t = 1
  const s = eg.s, t = eg.t;
  const inv = mod(s, n);
  return {
    id: `gen.nt1-bezout-3.${idx}`, generated: true, concepts: ["bezout-coefficients"], difficulty: 3, context: "applied",
    prompt: `Extended Euclid on $${a}$ and $${n}$ gives $${a}s + ${n}t = 1$. The coefficient $s$ is exactly the modular inverse $${a}^{-1} \\bmod ${n}$ once reduced. Find $s$, $t$, and the inverse.`,
    steps: [
      { instruction: `The extended-Euclid coefficient $s$ on ${a} is?`, answer: `${s}`, accept: [], hint: `It satisfies $${a} \\cdot s \\equiv 1 \\pmod{${n}}$.` },
      { instruction: `The coefficient $t$ on ${n} is?`, answer: `${t}`, accept: [], hint: `$${a} \\cdot ${signStr(s)} + ${n} \\cdot t = 1$.` },
      { instruction: `Reduce $s$ into the range $0..${n - 1}$ to get $${a}^{-1} \\bmod ${n}$.`, answer: `${inv}`, accept: [], hint: s < 0 ? `Add ${n}: $${s} + ${n} = ${inv}$.` : `$s = ${s}$ is already in range.` },
      { instruction: `Check: $${a} \\cdot ${inv} \\bmod ${n} = $ ?`, answer: "1", accept: [], hint: `$${a} \\cdot ${inv} = ${a * inv}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${inv}`, unit: "" },
    solutionNarrative: `$${a}(${s}) + ${n}(${t}) = 1$, so $${a}^{-1} \\equiv ${s} \\equiv ${inv} \\pmod{${n}}$. Check: $${a} \\cdot ${inv} = ${a * inv} \\equiv 1$.`,
  };
};

// --- coprime-and-applications ---

fill["nt1-coprime-1"] = (rng, idx) => {
  const coprime = rng.int(0, 1) === 1;
  let a, b;
  if (coprime) {
    const P = rng.pick([[4, 9], [5, 8], [7, 10], [9, 16], [8, 15], [7, 12], [11, 14]]);
    [a, b] = P;
  } else {
    const g = rng.int(2, 6);
    const [p, q] = rng.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]);
    a = g * p; b = g * q;
  }
  const g = gcd(a, b);
  const yn = coprime ? "yes" : "no";
  return {
    id: `gen.nt1-coprime-1.${idx}`, generated: true, concepts: ["coprime-and-applications"], difficulty: 1, context: "abstract",
    prompt: `Are ${a} and ${b} coprime? (Coprime means $\\gcd = 1$.) Answer 'yes' or 'no'.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `The largest number dividing both ${a} and ${b}.` },
      { instruction: `Is $\\gcd(${a}, ${b}) = 1$ — are they coprime? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `The gcd is ${g}.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: `$\\gcd(${a}, ${b}) = ${g}$, so they are ${coprime ? "coprime" : "NOT coprime"}.`,
  };
};

fill["nt1-coprime-2"] = (rng, idx) => {
  // Count integers coprime to a small n in a range (mini-totient flavor), numeric.
  const n = rng.pick([6, 8, 9, 10, 12, 15]);
  let cnt = 0;
  for (let k = 1; k <= n; k++) if (gcd(k, n) === 1) cnt++;
  const example = [];
  for (let k = 1; k <= n && example.length < 20; k++) if (gcd(k, n) === 1) example.push(k);
  return {
    id: `gen.nt1-coprime-2.${idx}`, generated: true, concepts: ["coprime-and-applications"], difficulty: 2, context: "abstract",
    prompt: `How many integers from 1 to ${n} are coprime to ${n}? (Count the $k$ with $\\gcd(k, ${n}) = 1$.)`,
    steps: [
      { instruction: `List the numbers $1 \\le k \\le ${n}$ sharing NO factor with ${n}, then count them. How many are there?`, answer: `${cnt}`, accept: [], hint: `The coprime residues are ${example.join(", ")}.` },
    ],
    finalAnswer: { value: `${cnt}`, unit: "" },
    solutionNarrative: `The integers coprime to ${n} up to ${n} are ${example.join(", ")} — that is ${cnt} of them (this count is Euler's totient $\\varphi(${n}) = ${cnt}$).`,
  };
};

fill["nt1-coprime-3"] = (rng, idx) => {
  // Small combination puzzle: make an amount from two coprime coin values.
  const combos = [
    { a: 3, b: 5, target: 11, x: 2, y: 1 }, { a: 3, b: 5, target: 13, x: 1, y: 2 },
    { a: 4, b: 7, target: 15, x: 2, y: 1 }, { a: 5, b: 8, target: 21, x: 1, y: 2 },
    { a: 3, b: 7, target: 17, x: 1, y: 2 }, { a: 4, b: 9, target: 17, x: 2, y: 1 },
    { a: 5, b: 7, target: 24, x: 2, y: 2 }, { a: 3, b: 8, target: 25, x: 3, y: 2 },
  ];
  const c = rng.pick(combos);
  return {
    id: `gen.nt1-coprime-3.${idx}`, generated: true, concepts: ["coprime-and-applications"], difficulty: 3, context: "applied",
    prompt: `A vending machine takes only ${c.a}-cent and ${c.b}-cent tokens. Because $\\gcd(${c.a}, ${c.b}) = 1$, every large amount is reachable. Make exactly ${c.target} cents using $x$ tokens of ${c.a} and $y$ tokens of ${c.b}.`,
    steps: [
      { instruction: `Confirm the values are coprime: $\\gcd(${c.a}, ${c.b}) = $ ?`, answer: "1", accept: [], hint: "Coprimality is what guarantees a combination exists." },
      { instruction: `How many ${c.a}-cent tokens ($x$) give the solution $${c.a}x + ${c.b}y = ${c.target}$?`, answer: `${c.x}`, accept: [], hint: `Try small $x$: $${c.a} \\cdot ${c.x} + ${c.b} \\cdot ${c.y} = ${c.a * c.x + c.b * c.y}$.` },
      { instruction: `And how many ${c.b}-cent tokens ($y$)?`, answer: `${c.y}`, accept: [], hint: `$${c.target} - ${c.a * c.x} = ${c.b * c.y} = ${c.b} \\cdot ${c.y}$.` },
    ],
    finalAnswer: { value: `x = ${c.x}, y = ${c.y}`, unit: "" },
    solutionNarrative: `$${c.a} \\cdot ${c.x} + ${c.b} \\cdot ${c.y} = ${c.a * c.x + c.b * c.y} = ${c.target}$. Coprime coin values can reach every sufficiently large amount (a Frobenius/Chicken McNugget setup).`,
  };
};

// ===========================================================================
// TOPIC 3 — number-theory.congruences-and-crt
//   concepts: modular-basics, linear-congruences, inverse-mod, crt-systems
// ===========================================================================

// --- modular-basics ---

fill["nt1-modbasic-1"] = (rng, idx) => {
  const n = rng.int(5, 12), q = rng.int(3, 9), r = rng.int(0, n - 1);
  const a = q * n + r;
  return {
    id: `gen.nt1-modbasic-1.${idx}`, generated: true, concepts: ["modular-basics"], difficulty: 1, context: "abstract",
    prompt: `Reduce $${a} \\bmod ${n}$ to its least nonnegative residue (a value in $0..${n - 1}$).`,
    steps: [
      { instruction: `Largest multiple of ${n} that is $\\le ${a}$?`, answer: `${q * n}`, accept: [`${q}*${n}`], hint: `$${n} \\cdot ${q} = ${q * n}$.` },
      { instruction: `Subtract: $${a} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${a} - ${q * n}$.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} = ${q} \\cdot ${n} + ${r}$, so $${a} \\bmod ${n} = ${r}$.`,
  };
};

fill["nt1-modbasic-2"] = (rng, idx) => {
  // Negative reduction to least nonnegative residue.
  const n = rng.int(5, 12), r = rng.int(1, n - 1), k = rng.int(2, 5);
  const a = r - k * n;
  return {
    id: `gen.nt1-modbasic-2.${idx}`, generated: true, concepts: ["modular-basics"], difficulty: 2, context: "abstract",
    prompt: `Find the least nonnegative residue of $${a} \\bmod ${n}$ (the answer must lie in $0..${n - 1}$).`,
    steps: [
      { instruction: `How many times must you add ${n} to $${a}$ to land in $0..${n - 1}$?`, answer: `${k}`, accept: [], hint: `Each $+${n}$ keeps the residue but raises the value.` },
      { instruction: `So $${a} \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${a} + ${k} \\cdot ${n} = ${r}$.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} + ${k * n} = ${r}$ lands in range, so $${a} \\bmod ${n} = ${r}$.`,
  };
};

fill["nt1-modbasic-3"] = (rng, idx) => {
  // Solve a ≡ ? : congruence-class arithmetic with a product/sum reduced.
  const n = rng.int(6, 13);
  const a = rng.int(n + 1, 6 * n), b = rng.int(n + 1, 6 * n);
  const ra = mod(a, n), rb = mod(b, n), prod = ra * rb, r = mod(prod, n);
  return {
    id: `gen.nt1-modbasic-3.${idx}`, generated: true, concepts: ["modular-basics"], difficulty: 3, context: "abstract",
    prompt: `Solve for the least nonnegative residue: $${a} \\cdot ${b} \\equiv x \\pmod{${n}}$. Reduce as you go.`,
    steps: [
      { instruction: `Reduce first factor: $${a} \\bmod ${n} = $ ?`, answer: `${ra}`, accept: [], hint: `Subtract the largest multiple of ${n}.` },
      { instruction: `Reduce second factor: $${b} \\bmod ${n} = $ ?`, answer: `${rb}`, accept: [], hint: `Subtract the largest multiple of ${n}.` },
      { instruction: `Multiply the residues and reduce: $(${ra} \\cdot ${rb}) \\bmod ${n} = $ ?`, answer: `${r}`, accept: [], hint: `$${ra} \\cdot ${rb} = ${prod}$, then reduce.` },
    ],
    finalAnswer: { value: `${r}`, unit: "" },
    solutionNarrative: `$${a} \\equiv ${ra}$, $${b} \\equiv ${rb} \\pmod{${n}}$; $${ra} \\cdot ${rb} = ${prod} \\equiv ${r} \\pmod{${n}}$.`,
  };
};

// --- linear-congruences ---

fill["nt1-lincong-1"] = (rng, idx) => {
  // Simple solvable ax ≡ b with a=1-ish or a invertible small; residue answer.
  const n = rng.pick([5, 7, 9, 11, 13]);
  let a; do { a = rng.int(2, n - 1); } while (gcd(a, n) !== 1);
  const x = rng.int(1, n - 1);
  const b = mod(a * x, n);
  return {
    id: `gen.nt1-lincong-1.${idx}`, generated: true, concepts: ["linear-congruences"], difficulty: 1, context: "abstract",
    prompt: `Solve $${a}x \\equiv ${b} \\pmod{${n}}$ for the least nonnegative residue $x$ in $0..${n - 1}$. (Here $\\gcd(${a}, ${n}) = 1$, so exactly one solution exists.)`,
    steps: [
      { instruction: `Does a solution exist? Since $\\gcd(${a}, ${n}) = 1$ divides ${b}, type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `A solution exists iff $\\gcd(a, m) \\mid b$; here the gcd is 1.` },
      { instruction: `Test $x = 0, 1, 2, \\dots$: which residue satisfies $${a}x \\equiv ${b} \\pmod{${n}}$?`, answer: `${x}`, accept: [`x=${x}`], hint: `$${a} \\cdot ${x} = ${a * x} \\equiv ${b} \\pmod{${n}}$.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `$\\gcd(${a}, ${n}) = 1$ so there is a unique solution; $${a} \\cdot ${x} = ${a * x} \\equiv ${b} \\pmod{${n}}$, so $x = ${x}$.`,
  };
};

fill["nt1-lincong-2"] = (rng, idx) => {
  // Solvability menu: gcd(a,m) | b or not.
  const solvable = rng.int(0, 1) === 1;
  const m = rng.pick([6, 8, 9, 10, 12, 15]);
  let a; do { a = rng.int(2, m - 1); } while (gcd(a, m) === 1); // non-coprime to make it interesting
  const g = gcd(a, m);
  let b;
  if (solvable) { b = mod(g * rng.int(1, 4), m); }        // g | b
  else { do { b = rng.int(1, m - 1); } while (b % g === 0); } // g does not divide b
  const yn = solvable ? "yes" : "no";
  return {
    id: `gen.nt1-lincong-2.${idx}`, generated: true, concepts: ["linear-congruences"], difficulty: 2, context: "abstract",
    prompt: `Does $${a}x \\equiv ${b} \\pmod{${m}}$ have a solution? A linear congruence $ax \\equiv b \\pmod m$ is solvable exactly when $\\gcd(a, m) \\mid b$.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${m})$.`, answer: `${g}`, accept: [], hint: `The largest common divisor.` },
      { instruction: `Does ${g} divide ${b}? Type 'yes' or 'no'.`, answer: b % g === 0 ? "yes" : "no", accept: [b % g === 0 ? "y" : "n"], hint: `Is $${b} / ${g}$ a whole number?` },
      { instruction: `So is the congruence solvable? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `Solvable iff $\\gcd(a,m) \\mid b$.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: solvable
      ? `$\\gcd(${a}, ${m}) = ${g}$ divides ${b}, so the congruence is solvable (with ${g} solutions mod ${m}).`
      : `$\\gcd(${a}, ${m}) = ${g}$ does NOT divide ${b}, so there is NO solution.`,
  };
};

fill["nt1-lincong-3"] = (rng, idx) => {
  // Solvable non-coprime: reduce and solve, giving smallest residue.
  const g = rng.pick([2, 3]);
  const m0 = rng.pick([5, 7, 9, 11]);
  const m = g * m0;
  let a0; do { a0 = rng.int(2, m0 - 1); } while (gcd(a0, m0) !== 1);
  const a = g * a0;
  const x = rng.int(1, m0 - 1);
  const b = mod(a * x, m); // g | b automatically since a is multiple of g
  return {
    id: `gen.nt1-lincong-3.${idx}`, generated: true, concepts: ["linear-congruences"], difficulty: 3, context: "abstract",
    prompt: `Solve $${a}x \\equiv ${b} \\pmod{${m}}$. Here $\\gcd(${a}, ${m}) = ${g}$ divides ${b}, so divide everything by ${g} and solve the reduced congruence; give the smallest nonnegative solution.`,
    steps: [
      { instruction: `Confirm solvability: $\\gcd(${a}, ${m}) = $ ? (and it must divide ${b})`, answer: `${g}`, accept: [], hint: `Both ${a} and ${m} are multiples of ${g}.` },
      { instruction: `Divide through by ${g}: the reduced congruence is $${a0}x \\equiv ${b / g} \\pmod{${m0}}$. Solve it for $x$ in $0..${m0 - 1}$.`, answer: `${x}`, accept: [`x=${x}`], hint: `$${a0} \\cdot ${x} = ${a0 * x} \\equiv ${b / g} \\pmod{${m0}}$.` },
      { instruction: `Verify in the original: $${a} \\cdot ${x} \\bmod ${m} = $ ?`, answer: `${mod(a * x, m)}`, accept: [], hint: `$${a} \\cdot ${x} = ${a * x}$; reduce mod ${m}.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Divide by $\\gcd = ${g}$: $${a0}x \\equiv ${b / g} \\pmod{${m0}}$ gives $x = ${x}$. The smallest nonnegative solution mod ${m} is ${x}.`,
  };
};

// --- inverse-mod ---

fill["nt1-inverse-1"] = (rng, idx) => {
  const n = rng.pick([5, 7, 9, 11]);
  let a; do { a = rng.int(2, n - 1); } while (gcd(a, n) !== 1);
  const inv = modInverse(a, n);
  return {
    id: `gen.nt1-inverse-1.${idx}`, generated: true, concepts: ["inverse-mod"], difficulty: 1, context: "abstract",
    prompt: `Find $${a}^{-1} \\bmod ${n}$ — the residue $x$ in $0..${n - 1}$ with $${a}x \\equiv 1 \\pmod{${n}}$ — by testing candidates.`,
    steps: [
      { instruction: `The inverse $x$ must make $${a}x \\bmod ${n}$ equal to what?`, answer: "1", accept: [], hint: "That is the definition of a modular inverse." },
      { instruction: `Test $x = 1, 2, 3, \\dots$: which one works?`, answer: `${inv}`, accept: [`x=${inv}`], hint: `$${a} \\cdot ${inv} = ${a * inv} \\equiv 1 \\pmod{${n}}$.` },
    ],
    finalAnswer: { value: `${inv}`, unit: "" },
    solutionNarrative: `$${a} \\cdot ${inv} = ${a * inv} \\equiv 1 \\pmod{${n}}$, so $${a}^{-1} \\bmod ${n} = ${inv}$.`,
  };
};

fill["nt1-inverse-2"] = (rng, idx) => {
  const n = rng.pick([7, 8, 9, 11, 12, 13]);
  let a; do { a = rng.int(3, n - 2); } while (gcd(a, n) !== 1);
  const inv = modInverse(a, n);
  return {
    id: `gen.nt1-inverse-2.${idx}`, generated: true, concepts: ["inverse-mod"], difficulty: 2, context: "abstract",
    prompt: `Compute $${a}^{-1} \\bmod ${n}$ using the extended Euclidean algorithm, giving the answer in $0..${n - 1}$.`,
    steps: [
      { instruction: `First check invertibility: $\\gcd(${a}, ${n}) = $ ?`, answer: "1", accept: [], hint: "An inverse exists iff the gcd is 1." },
      { instruction: `Find the residue $x$ with $${a}x \\equiv 1 \\pmod{${n}}$.`, answer: `${inv}`, accept: [`x=${inv}`], hint: `Extended Euclid gives $${a} \\cdot ${inv} + ${n}k = 1$; reduce into range.` },
      { instruction: `Verify: $${a} \\cdot ${inv} \\bmod ${n} = $ ?`, answer: "1", accept: [], hint: `$${a} \\cdot ${inv} = ${a * inv}$.` },
    ],
    finalAnswer: { value: `${inv}`, unit: "" },
    solutionNarrative: `$\\gcd(${a}, ${n}) = 1$ so the inverse exists; $${a} \\cdot ${inv} = ${a * inv} \\equiv 1 \\pmod{${n}}$, giving $${a}^{-1} = ${inv}$.`,
  };
};

fill["nt1-inverse-3"] = (rng, idx) => {
  // Does inverse exist? decide + give it or 'none'.
  const exists = rng.int(0, 1) === 1;
  const n = rng.pick(exists ? [9, 10, 11, 13, 14] : [8, 9, 10, 12, 14, 15]);
  let a;
  if (exists) { do { a = rng.int(2, n - 2); } while (gcd(a, n) !== 1); }
  else { do { a = rng.int(2, n - 1); } while (gcd(a, n) === 1); }
  const g = gcd(a, n);
  const inv = exists ? modInverse(a, n) : null;
  return {
    id: `gen.nt1-inverse-3.${idx}`, generated: true, concepts: ["inverse-mod"], difficulty: 3, context: "abstract",
    prompt: `Does $${a}$ have an inverse mod ${n}? Decide, and give the inverse (in $0..${n - 1}$) or type 'none'.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${n})$.`, answer: `${g}`, accept: [], hint: "Largest common divisor." },
      { instruction: `An inverse exists only when the gcd is 1. Does $${a}^{-1} \\bmod ${n}$ exist? Type 'yes' or 'no'.`, answer: exists ? "yes" : "no", accept: [exists ? "y" : "n"], hint: `The gcd is ${g}.` },
      exists
        ? { instruction: `Find it: $${a}^{-1} \\bmod ${n} = $ ?`, answer: `${inv}`, accept: [`x=${inv}`], hint: `Test until $${a}x \\equiv 1$.` }
        : { instruction: `So what is $${a}^{-1} \\bmod ${n}$? Type 'none'.`, answer: "none", accept: ["no inverse", "does not exist", "dne"], hint: `Every multiple of ${a} stays divisible by ${g} mod ${n}.` },
    ],
    finalAnswer: { value: exists ? `${inv}` : "none", unit: "" },
    solutionNarrative: exists
      ? `$\\gcd(${a}, ${n}) = 1$; testing gives $${a} \\cdot ${inv} = ${a * inv} \\equiv 1 \\pmod{${n}}$.`
      : `$\\gcd(${a}, ${n}) = ${g} \\ne 1$, so no inverse exists.`,
  };
};

// --- crt-systems ---

fill["nt1-crt-1"] = (rng, idx) => {
  // Small coprime moduli, one CRT solve.
  const PAIRS = [[3, 5], [3, 4], [4, 5], [3, 7], [5, 7], [2, 5], [2, 7]];
  const [m, n2] = rng.pick(PAIRS);
  const a = rng.int(0, m - 1), b = rng.int(0, n2 - 1);
  const x = crt2(a, m, b, n2);
  const M = m * n2;
  return {
    id: `gen.nt1-crt-1.${idx}`, generated: true, concepts: ["crt-systems"], difficulty: 1, context: "abstract",
    prompt: `Solve the system $x \\equiv ${a} \\pmod{${m}}$ and $x \\equiv ${b} \\pmod{${n2}}$ for the smallest nonnegative $x$. (The moduli are coprime, so a unique solution exists mod ${M}.)`,
    steps: [
      { instruction: `Are the moduli ${m} and ${n2} coprime? (Required for a unique CRT solution.) Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `$\\gcd(${m}, ${n2}) = 1$.` },
      { instruction: `Search $x = ${a}, ${a + m}, ${a + 2 * m}, \\dots$ (all $\\equiv ${a} \\bmod ${m}$) for one that is $\\equiv ${b} \\bmod ${n2}$. Smallest such $x$?`, answer: `${x}`, accept: [], hint: `Check each candidate's residue mod ${n2} until it equals ${b}.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `$x = ${x}$ satisfies $${x} \\bmod ${m} = ${a}$ and $${x} \\bmod ${n2} = ${b}$; it is unique mod ${M}.`,
  };
};

fill["nt1-crt-2"] = (rng, idx) => {
  const PAIRS = [[4, 7], [5, 8], [3, 8], [5, 9], [4, 9], [7, 9], [5, 11], [3, 11]];
  const [m, n2] = rng.pick(PAIRS);
  const a = rng.int(0, m - 1), b = rng.int(0, n2 - 1);
  const x = crt2(a, m, b, n2);
  const M = m * n2;
  const inv = modInverse(m, n2);
  const tstep = mod((b - a) * inv, n2);
  return {
    id: `gen.nt1-crt-2.${idx}`, generated: true, concepts: ["crt-systems"], difficulty: 2, context: "abstract",
    prompt: `Solve $x \\equiv ${a} \\pmod{${m}}$, $x \\equiv ${b} \\pmod{${n2}}$ by CRT construction. Write $x = ${a} + ${m}t$ and solve for $t$ mod ${n2}.`,
    steps: [
      { instruction: `Substitute into the second congruence: $${a} + ${m}t \\equiv ${b} \\pmod{${n2}}$, i.e. $${m}t \\equiv ${mod(b - a, n2)} \\pmod{${n2}}$. Since $${m}^{-1} \\equiv ${inv} \\pmod{${n2}}$, find $t$ in $0..${n2 - 1}$.`, answer: `${tstep}`, accept: [`t=${tstep}`], hint: `$t \\equiv ${inv} \\cdot ${mod(b - a, n2)} \\pmod{${n2}}$.` },
      { instruction: `Now compute $x = ${a} + ${m} \\cdot ${tstep}$ and reduce mod ${M} to the smallest nonnegative value.`, answer: `${x}`, accept: [], hint: `$${a} + ${m * tstep} = ${a + m * tstep}$, then mod ${M}.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `$t = ${tstep}$ gives $x = ${a} + ${m} \\cdot ${tstep} = ${a + m * tstep} \\equiv ${x} \\pmod{${M}}$ — unique mod ${M}.`,
  };
};

fill["nt1-crt-3"] = (rng, idx) => {
  // Three-modulus CRT (calendar-flavored), or a non-coprime guard teaching moment.
  const teachFail = rng.int(0, 3) === 0;
  if (teachFail) {
    // Non-coprime moduli: no solution unless residues agree mod gcd. Build a NO case.
    const g = 2;
    const m = rng.pick([4, 6, 8]), n2 = rng.pick([6, 10, 14].filter((x) => x % g === 0));
    // choose residues that disagree mod g
    let a, b;
    do { a = rng.int(0, m - 1); b = rng.int(0, n2 - 1); } while (mod(a, g) === mod(b, g));
    return {
      id: `gen.nt1-crt-3.${idx}`, generated: true, concepts: ["crt-systems"], difficulty: 3, context: "abstract",
      prompt: `A CRT PITFALL. Solve $x \\equiv ${a} \\pmod{${m}}$, $x \\equiv ${b} \\pmod{${n2}}$ — but note the moduli are NOT coprime. Check for consistency first.`,
      steps: [
        { instruction: `Compute $\\gcd(${m}, ${n2})$.`, answer: `${gcd(m, n2)}`, accept: [], hint: "The moduli share a factor — plain CRT does not apply directly." },
        { instruction: `A solution exists only if the two residues agree mod the gcd. Is $${a} \\equiv ${b} \\pmod{${gcd(m, n2)}}$? Type 'yes' or 'no'.`, answer: mod(a, gcd(m, n2)) === mod(b, gcd(m, n2)) ? "yes" : "no", accept: [mod(a, gcd(m, n2)) === mod(b, gcd(m, n2)) ? "y" : "n"], hint: `Compare $${a} \\bmod ${gcd(m, n2)}$ and $${b} \\bmod ${gcd(m, n2)}$.` },
        { instruction: `So does the system have a solution? Type 'yes' or 'no'.`, answer: "no", accept: ["n"], hint: "Disagreement mod the gcd means the two congruences contradict each other." },
      ],
      finalAnswer: { value: "no", unit: "" },
      solutionNarrative: `$\\gcd(${m}, ${n2}) = ${gcd(m, n2)}$, but $${a} \\not\\equiv ${b} \\pmod{${gcd(m, n2)}}$, so the congruences are inconsistent — NO solution. Non-coprime CRT requires the residues to match mod the gcd.`,
    };
  }
  const TRIP = [[3, 5, 7], [2, 3, 5], [3, 4, 5], [4, 5, 7]];
  const [m1, m2, m3] = rng.pick(TRIP);
  const a1 = rng.int(0, m1 - 1), a2 = rng.int(0, m2 - 1), a3 = rng.int(0, m3 - 1);
  const x12 = crt2(a1, m1, a2, m2);
  const x = crt2(x12, m1 * m2, a3, m3);
  const M = m1 * m2 * m3;
  return {
    id: `gen.nt1-crt-3.${idx}`, generated: true, concepts: ["crt-systems"], difficulty: 3, context: "abstract",
    prompt: `Solve the three-congruence system $x \\equiv ${a1} \\pmod{${m1}}$, $x \\equiv ${a2} \\pmod{${m2}}$, $x \\equiv ${a3} \\pmod{${m3}}$ (pairwise coprime moduli) for the smallest nonnegative $x$.`,
    steps: [
      { instruction: `Solve the first two: find $x \\bmod ${m1 * m2}$ satisfying $\\equiv ${a1} \\pmod{${m1}}$ and $\\equiv ${a2} \\pmod{${m2}}$.`, answer: `${x12}`, accept: [], hint: `Merge into modulus ${m1 * m2}.` },
      { instruction: `Now merge with the third: solve $x \\equiv ${x12} \\pmod{${m1 * m2}}$, $x \\equiv ${a3} \\pmod{${m3}}$ for the smallest nonnegative $x$ mod ${M}.`, answer: `${x}`, accept: [], hint: `Search $${x12}, ${x12 + m1 * m2}, \\dots$ for the one $\\equiv ${a3} \\bmod ${m3}$.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Merging pairwise: first two give $x \\equiv ${x12} \\pmod{${m1 * m2}}$, then all three give $x = ${x}$ (unique mod ${M}).`,
  };
};

// ===========================================================================
// TOPIC 4 — number-theory.diophantine-equations
//   concepts: linear-diophantine-solvability, particular-solution,
//             general-solution, pythagorean-triples
// ===========================================================================

// --- linear-diophantine-solvability ---

fill["nt1-diophsolv-1"] = (rng, idx) => {
  const solvable = rng.int(0, 1) === 1;
  const g = rng.int(2, 7);
  const [p, q] = rng.pick([[2, 3], [3, 4], [3, 5], [4, 5], [2, 5], [5, 6]]);
  const a = g * p, b = g * q;
  let c;
  if (solvable) c = g * rng.int(2, 9);
  else { do { c = rng.int(g + 1, 9 * g); } while (c % g === 0); }
  const yn = c % g === 0 ? "yes" : "no";
  return {
    id: `gen.nt1-diophsolv-1.${idx}`, generated: true, concepts: ["linear-diophantine-solvability"], difficulty: 1, context: "abstract",
    prompt: `Does $${a}x + ${b}y = ${c}$ have an integer solution? A linear Diophantine equation $ax + by = c$ is solvable exactly when $\\gcd(a, b) \\mid c$.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `$${a} = ${g} \\cdot ${p}$, $${b} = ${g} \\cdot ${q}$.` },
      { instruction: `Does ${g} divide ${c}? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `Is $${c} / ${g}$ a whole number?` },
      { instruction: `So is the equation solvable in integers? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `Solvable iff $\\gcd(a,b) \\mid c$.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: yn === "yes"
      ? `$\\gcd(${a}, ${b}) = ${g}$ divides ${c}, so integer solutions exist.`
      : `$\\gcd(${a}, ${b}) = ${g}$ does not divide ${c}, so there is NO integer solution.`,
  };
};

fill["nt1-diophsolv-2"] = (rng, idx) => {
  // gcd computation (via Euclid) then divisibility check, larger numbers.
  const g = rng.int(2, 9);
  const [p, q] = rng.pick([[3, 5], [4, 7], [5, 7], [4, 9], [5, 8], [7, 8]]);
  const a = g * p, b = g * q;
  const c = g * rng.int(3, 12);
  return {
    id: `gen.nt1-diophsolv-2.${idx}`, generated: true, concepts: ["linear-diophantine-solvability"], difficulty: 2, context: "abstract",
    prompt: `For $${a}x + ${b}y = ${c}$, determine solvability and, if solvable, how many times $\\gcd(${a},${b})$ divides ${c}.`,
    steps: [
      { instruction: `Run Euclid to find $\\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `$\\gcd(${a}, ${b}) = ${g}$ since both are ${g} times coprime numbers.` },
      { instruction: `Is the equation solvable? ($\\gcd \\mid c$?) Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `$${c} = ${g} \\cdot ${c / g}$.` },
      { instruction: `Divide out the gcd: $${c} \\div ${g} = $ ? (This is the right-hand side of the reduced equation.)`, answer: `${c / g}`, accept: [], hint: `$${c} / ${g}$.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$\\gcd(${a}, ${b}) = ${g}$ divides ${c}, so the equation is solvable; dividing through gives $${p}x + ${q}y = ${c / g}$ with coprime coefficients.`,
  };
};

fill["nt1-diophsolv-3"] = (rng, idx) => {
  // Decide solvability with a "no" case that looks plausible, larger, plus count of solutions statement.
  const solvable = rng.int(0, 1) === 1;
  const PAIRS = [[6, 10], [6, 15], [8, 12], [9, 12], [10, 15], [8, 20], [12, 18]];
  const [a, b] = rng.pick(PAIRS);
  const g = gcd(a, b);
  let c;
  if (solvable) c = g * rng.int(3, 10);
  else { do { c = rng.int(g + 1, 12 * g); } while (c % g === 0); }
  const yn = c % g === 0 ? "yes" : "no";
  return {
    id: `gen.nt1-diophsolv-3.${idx}`, generated: true, concepts: ["linear-diophantine-solvability"], difficulty: 3, context: "abstract",
    prompt: `A common trap: $${a}x + ${b}y = ${c}$ with non-coprime coefficients. Decide whether ANY integer solution exists.`,
    steps: [
      { instruction: `Compute $\\gcd(${a}, ${b})$ (run Euclid).`, answer: `${g}`, accept: [], hint: `Both ${a} and ${b} are even/share factors — find the largest.` },
      { instruction: `Compute $${c} \\bmod ${g}$ (the remainder when ${c} is divided by ${g}).`, answer: `${c % g}`, accept: [], hint: `A solution exists iff this remainder is 0.` },
      { instruction: `So does $${a}x + ${b}y = ${c}$ have an integer solution? Type 'yes' or 'no'.`, answer: yn, accept: [yn[0]], hint: `Zero remainder means solvable; nonzero means impossible.` },
    ],
    finalAnswer: { value: yn, unit: "" },
    solutionNarrative: yn === "yes"
      ? `$\\gcd(${a}, ${b}) = ${g}$ and $${c} \\bmod ${g} = 0$, so the equation is solvable.`
      : `$\\gcd(${a}, ${b}) = ${g}$ but $${c} \\bmod ${g} = ${c % g} \\ne 0$: the left side is always a multiple of ${g}, so it can never equal ${c}. No solution.`,
  };
};

// --- particular-solution ---
// Build a from coprime coefficients so extgcd gives a clean particular solution.

function diophParticular(a, b, c) {
  const { g, s, t } = extgcd(a, b); // a*s + b*t = g
  if (c % g !== 0) return null;
  const k = c / g;
  return { g, x0: s * k, y0: t * k };
}

fill["nt1-particular-1"] = (rng, idx) => {
  // Small coprime a,b; find one solution by inspection, grade x and y separately.
  const combos = [
    { a: 2, b: 3, c: 12, x: 3, y: 2 }, { a: 3, b: 5, c: 19, x: 3, y: 2 },
    { a: 2, b: 5, c: 16, x: 3, y: 2 }, { a: 3, b: 4, c: 18, x: 2, y: 3 },
    { a: 5, b: 3, c: 21, x: 3, y: 2 }, { a: 4, b: 3, c: 22, x: 4, y: 2 },
  ];
  const c = rng.pick(combos);
  return {
    id: `gen.nt1-particular-1.${idx}`, generated: true, concepts: ["particular-solution"], difficulty: 1, context: "abstract",
    prompt: `Find ONE integer solution $(x, y)$ of $${c.a}x + ${c.b}y = ${c.c}$ by inspection.`,
    steps: [
      { instruction: `Pick $x = ${c.x}$. Then $${c.b}y = ${c.c} - ${c.a} \\cdot ${c.x} = ${c.c - c.a * c.x}$. Solve for $y$.`, answer: `${c.y}`, accept: [`y=${c.y}`], hint: `$${c.c - c.a * c.x} \\div ${c.b}$.` },
      { instruction: `State the $x$-value of this solution.`, answer: `${c.x}`, accept: [`x=${c.x}`], hint: `You chose $x = ${c.x}$.` },
    ],
    finalAnswer: { value: `x = ${c.x}, y = ${c.y}`, unit: "" },
    solutionNarrative: `$${c.a} \\cdot ${c.x} + ${c.b} \\cdot ${c.y} = ${c.a * c.x + c.b * c.y} = ${c.c}$, so $(x, y) = (${c.x}, ${c.y})$ is a particular solution.`,
  };
};

fill["nt1-particular-2"] = (rng, idx) => {
  // Use extended Euclid to build a particular solution; grade x0 and y0 separately.
  const PAIRS = [[7, 5], [8, 3], [9, 4], [11, 3], [7, 4], [5, 8]];
  const [a, b] = rng.pick(PAIRS);
  const c = gcd(a, b) * rng.int(2, 5); // multiple of gcd (=1 here) -> any small c
  const sol = diophParticular(a, b, c);
  return {
    id: `gen.nt1-particular-2.${idx}`, generated: true, concepts: ["particular-solution"], difficulty: 2, context: "abstract",
    prompt: `Use the extended Euclidean algorithm to find a particular solution of $${a}x + ${b}y = ${c}$. Report the $x$ and $y$ the method produces.`,
    steps: [
      { instruction: `Extended Euclid gives $${a} s + ${b} t = 1$; scaling by ${c} gives $x_0 = ${c} s$. What is $x_0$?`, answer: `${sol.x0}`, accept: [`x=${sol.x0}`], hint: `Find the Bézout $s$, then multiply by ${c}.` },
      { instruction: `And $y_0 = ${c} t$. What is $y_0$?`, answer: `${sol.y0}`, accept: [`y=${sol.y0}`], hint: `$${a} \\cdot ${signStr(sol.x0)} + ${b} \\cdot y_0 = ${c}$.` },
      { instruction: `Check: $${a} \\cdot ${signStr(sol.x0)} + ${b} \\cdot ${signStr(sol.y0)} = $ ?`, answer: `${c}`, accept: [], hint: `$${a * sol.x0} + ${signStr(b * sol.y0)}$.` },
    ],
    finalAnswer: { value: `x = ${sol.x0}, y = ${sol.y0}`, unit: "" },
    solutionNarrative: `Extended Euclid then scaling by ${c} gives $(x_0, y_0) = (${sol.x0}, ${sol.y0})$: $${a}(${sol.x0}) + ${b}(${sol.y0}) = ${c}$.`,
  };
};

fill["nt1-particular-3"] = (rng, idx) => {
  // Non-coprime but solvable; reduce then particular solution; grade x and y.
  const g = rng.pick([2, 3]);
  const PAIRS = [[3, 5], [4, 5], [5, 7], [4, 7], [3, 7]];
  const [p, q] = rng.pick(PAIRS);
  const a = g * p, b = g * q;
  const c = g * rng.int(3, 8);
  const sol = diophParticular(a, b, c);
  return {
    id: `gen.nt1-particular-3.${idx}`, generated: true, concepts: ["particular-solution"], difficulty: 3, context: "abstract",
    prompt: `Find a particular integer solution of $${a}x + ${b}y = ${c}$. First divide through by $\\gcd(${a}, ${b}) = ${g}$, then apply extended Euclid.`,
    steps: [
      { instruction: `Confirm $\\gcd(${a}, ${b}) = ${g}$ divides ${c}: compute $${c} \\div ${g}$.`, answer: `${c / g}`, accept: [], hint: `The reduced equation is $${p}x + ${q}y = ${c / g}$.` },
      { instruction: `Solve the reduced equation. What $x$ does extended Euclid give? (This $x$ also solves the original.)`, answer: `${sol.x0}`, accept: [`x=${sol.x0}`], hint: `$${p}x + ${q}y = ${c / g}$.` },
      { instruction: `What is the corresponding $y$?`, answer: `${sol.y0}`, accept: [`y=${sol.y0}`], hint: `$${a} \\cdot ${signStr(sol.x0)} + ${b} \\cdot y = ${c}$.` },
    ],
    finalAnswer: { value: `x = ${sol.x0}, y = ${sol.y0}`, unit: "" },
    solutionNarrative: `Divide by ${g}: $${p}x + ${q}y = ${c / g}$; extended Euclid gives $(x, y) = (${sol.x0}, ${sol.y0})$, and $${a}(${sol.x0}) + ${b}(${sol.y0}) = ${c}$.`,
  };
};

// --- general-solution ---
// Grade the two increments b/g and a/g as separate numeric steps.

fill["nt1-general-1"] = (rng, idx) => {
  // Coprime case (g=1): increments are b and a.
  const combos = [
    { a: 2, b: 3, c: 12, x0: 3, y0: 2 }, { a: 3, b: 5, c: 19, x0: 3, y0: 2 },
    { a: 3, b: 4, c: 18, x0: 2, y0: 3 }, { a: 5, b: 3, c: 21, x0: 3, y0: 2 },
  ];
  const c = rng.pick(combos);
  const g = 1;
  return {
    id: `gen.nt1-general-1.${idx}`, generated: true, concepts: ["general-solution"], difficulty: 1, context: "abstract",
    prompt: `Given the particular solution $(x_0, y_0) = (${c.x0}, ${c.y0})$ of $${c.a}x + ${c.b}y = ${c.c}$, the general solution is $x = ${c.x0} + \\frac{${c.b}}{g}t$, $y = ${c.y0} - \\frac{${c.a}}{g}t$ where $g = \\gcd(${c.a}, ${c.b})$. Find the two increments.`,
    steps: [
      { instruction: `Compute $g = \\gcd(${c.a}, ${c.b})$.`, answer: `${g}`, accept: [], hint: `${c.a} and ${c.b} are coprime.` },
      { instruction: `The increment on $x$ is $${c.b} / g$. Compute it.`, answer: `${c.b / g}`, accept: [], hint: `$${c.b} \\div ${g}$.` },
      { instruction: `The increment on $y$ is $${c.a} / g$ (subtracted). Compute it.`, answer: `${c.a / g}`, accept: [], hint: `$${c.a} \\div ${g}$.` },
    ],
    finalAnswer: { value: `x = ${c.x0} + ${c.b / g}t, y = ${c.y0} - ${c.a / g}t`, unit: "" },
    solutionNarrative: `With $g = 1$, the general solution is $x = ${c.x0} + ${c.b / g}t$, $y = ${c.y0} - ${c.a / g}t$ for all integers $t$.`,
  };
};

fill["nt1-general-2"] = (rng, idx) => {
  // Non-coprime g>1: increments are b/g and a/g. Provide a particular solution.
  const g = rng.pick([2, 3]);
  const [p, q] = rng.pick([[3, 5], [4, 5], [5, 7], [3, 7]]);
  const a = g * p, b = g * q;
  const c = g * rng.int(3, 8);
  const sol = diophParticular(a, b, c);
  return {
    id: `gen.nt1-general-2.${idx}`, generated: true, concepts: ["general-solution"], difficulty: 2, context: "abstract",
    prompt: `The equation $${a}x + ${b}y = ${c}$ has particular solution $(${sol.x0}, ${sol.y0})$. Its general solution is $x = ${sol.x0} + \\frac{${b}}{g}t$, $y = ${sol.y0} - \\frac{${a}}{g}t$. Find $g$ and the two increments.`,
    steps: [
      { instruction: `Compute $g = \\gcd(${a}, ${b})$.`, answer: `${g}`, accept: [], hint: `Both are multiples of ${g}.` },
      { instruction: `Increment on $x$: $${b} / ${g} = $ ?`, answer: `${b / g}`, accept: [], hint: `$${b} \\div ${g}$.` },
      { instruction: `Increment on $y$: $${a} / ${g} = $ ?`, answer: `${a / g}`, accept: [], hint: `$${a} \\div ${g}$.` },
    ],
    finalAnswer: { value: `x = ${sol.x0} + ${b / g}t, y = ${sol.y0} - ${a / g}t`, unit: "" },
    solutionNarrative: `$g = ${g}$, so the general solution is $x = ${sol.x0} + ${b / g}t$, $y = ${sol.y0} - ${a / g}t$. Using $b/g$ and $a/g$ (not $b$ and $a$) is the classic pitfall.`,
  };
};

fill["nt1-general-3"] = (rng, idx) => {
  // Find a solution meeting a constraint (smallest positive x) using increments.
  const combos = [
    { a: 5, b: 3, c: 40, x0: 8, y0: 0 }, { a: 4, b: 7, c: 50, x0: 12, y0: 2 },
    { a: 3, b: 7, c: 40, x0: 11, y0: 1 }, { a: 5, b: 8, c: 60, x0: 12, y0: 0 },
  ];
  const c = rng.pick(combos);
  const g = gcd(c.a, c.b);
  const incX = c.b / g, incY = c.a / g;
  // Smallest positive x: reduce x0 mod incX
  let x = mod(c.x0, incX); if (x === 0) x = incX;
  // find t: x = x0 + incX*t -> t = (x - x0)/incX
  const t = (x - c.x0) / incX;
  const y = c.y0 - incY * t;
  return {
    id: `gen.nt1-general-3.${idx}`, generated: true, concepts: ["general-solution"], difficulty: 3, context: "applied",
    prompt: `Using the general solution of $${c.a}x + ${c.b}y = ${c.c}$ (particular $(x_0,y_0) = (${c.x0}, ${c.y0})$; increments $x \\mathbin{+}= ${incX}$, $y \\mathbin{-}= ${incY}$ per step $t$), find the solution with the SMALLEST positive $x$.`,
    steps: [
      { instruction: `The $x$-values run $\\dots, ${c.x0} - ${incX}, ${c.x0}, ${c.x0} + ${incX}, \\dots$ (step ${incX}). What is the smallest POSITIVE $x$?`, answer: `${x}`, accept: [], hint: `Reduce ${c.x0} modulo ${incX} (taking the value in $1..${incX}$).` },
      { instruction: `The corresponding $y$ (from $${c.a}x + ${c.b}y = ${c.c}$): compute it.`, answer: `${y}`, accept: [`y=${y}`], hint: `$y = (${c.c} - ${c.a} \\cdot ${x}) / ${c.b}$.` },
    ],
    finalAnswer: { value: `x = ${x}, y = ${y}`, unit: "" },
    solutionNarrative: `Stepping by the increment ${incX} in $x$, the smallest positive $x$ is ${x}, giving $y = ${y}$: $${c.a} \\cdot ${x} + ${c.b} \\cdot ${y} = ${c.a * x + c.b * y} = ${c.c}$.`,
  };
};

// --- pythagorean-triples ---

fill["nt1-pythag-1"] = (rng, idx) => {
  // Verify a triple.
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29]];
  const [a, b, c] = rng.pick(TRIPLES);
  return {
    id: `gen.nt1-pythag-1.${idx}`, generated: true, concepts: ["pythagorean-triples"], difficulty: 1, context: "abstract",
    prompt: `Verify that $(${a}, ${b}, ${c})$ is a Pythagorean triple by checking $a^2 + b^2 = c^2$.`,
    steps: [
      { instruction: `Compute $${a}^2 + ${b}^2$.`, answer: `${a * a + b * b}`, accept: [], hint: `$${a * a} + ${b * b}$.` },
      { instruction: `Compute $${c}^2$.`, answer: `${c * c}`, accept: [], hint: `$${c} \\cdot ${c}$.` },
      { instruction: `Are they equal — is it a Pythagorean triple? Type 'yes' or 'no'.`, answer: "yes", accept: ["y"], hint: `Both should be ${c * c}.` },
    ],
    finalAnswer: { value: "yes", unit: "" },
    solutionNarrative: `$${a}^2 + ${b}^2 = ${a * a + b * b} = ${c * c} = ${c}^2$, so $(${a}, ${b}, ${c})$ is a Pythagorean triple.`,
  };
};

fill["nt1-pythag-2"] = (rng, idx) => {
  // Generate from m, n: a = m^2 - n^2, b = 2mn, c = m^2 + n^2.
  const m = rng.int(2, 5);
  const n = rng.int(1, m - 1);
  const a = m * m - n * n, b = 2 * m * n, c = m * m + n * n;
  return {
    id: `gen.nt1-pythag-2.${idx}`, generated: true, concepts: ["pythagorean-triples"], difficulty: 2, context: "abstract",
    prompt: `Euclid's formula builds a Pythagorean triple from $m = ${m}$, $n = ${n}$: $a = m^2 - n^2$, $b = 2mn$, $c = m^2 + n^2$. Compute the triple.`,
    steps: [
      { instruction: `Compute $a = ${m}^2 - ${n}^2$.`, answer: `${a}`, accept: [], hint: `$${m * m} - ${n * n}$.` },
      { instruction: `Compute $b = 2 \\cdot ${m} \\cdot ${n}$.`, answer: `${b}`, accept: [], hint: `$2mn$.` },
      { instruction: `Compute $c = ${m}^2 + ${n}^2$.`, answer: `${c}`, accept: [], hint: `$${m * m} + ${n * n}$.` },
    ],
    finalAnswer: { value: `(${a}, ${b}, ${c})`, unit: "" },
    solutionNarrative: `Euclid's formula gives $(${a}, ${b}, ${c})$, and indeed $${a}^2 + ${b}^2 = ${a * a + b * b} = ${c * c} = ${c}^2$.`,
  };
};

fill["nt1-pythag-3"] = (rng, idx) => {
  // Given one leg, find m,n or complete the triple / test primitivity.
  const m = rng.int(3, 6);
  const n = rng.int(1, m - 1);
  const a = m * m - n * n, b = 2 * m * n, c = m * m + n * n;
  const primitive = gcd(a, b) === 1;
  return {
    id: `gen.nt1-pythag-3.${idx}`, generated: true, concepts: ["pythagorean-triples"], difficulty: 3, context: "abstract",
    prompt: `From $m = ${m}$, $n = ${n}$ build the triple, verify it, and decide whether it is PRIMITIVE (a triple is primitive when its three entries share no common factor).`,
    steps: [
      { instruction: `Compute $c = ${m}^2 + ${n}^2$ (the hypotenuse).`, answer: `${c}`, accept: [], hint: `$${m * m} + ${n * n}$.` },
      { instruction: `Verify: $a^2 + b^2$ where $a = ${a}$, $b = ${b}$ equals $c^2$. Compute $${a}^2 + ${b}^2$.`, answer: `${a * a + b * b}`, accept: [], hint: `Should equal $${c}^2 = ${c * c}$.` },
      { instruction: `Compute $\\gcd(${a}, ${b})$ to test primitivity.`, answer: `${gcd(a, b)}`, accept: [], hint: `Primitive means this gcd is 1.` },
      { instruction: `Is $(${a}, ${b}, ${c})$ primitive? Type 'yes' or 'no'.`, answer: primitive ? "yes" : "no", accept: [primitive ? "y" : "n"], hint: `Primitive iff the entries share no common factor (equivalently $m, n$ coprime and not both odd).` },
    ],
    finalAnswer: { value: primitive ? "yes" : "no", unit: "" },
    solutionNarrative: `$(${a}, ${b}, ${c})$ with $${a}^2 + ${b}^2 = ${c * c} = ${c}^2$. $\\gcd(${a}, ${b}) = ${gcd(a, b)}$, so it is ${primitive ? "primitive" : "NOT primitive (a scaled copy of a smaller triple)"}.`,
  };
};
