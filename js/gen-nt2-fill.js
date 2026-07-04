// gen-nt2-fill.js
// Parametric generators for the second half of the Number Theory subject:
//   number-theory.arithmetic-functions
//   number-theory.quadratic-residues
//   number-theory.continued-fractions
// One template per (concept, difficulty) tier — 12 per topic, 36 total — so the
// adaptive engine can serve fresh problems at every level. Self-contained: no
// imports from generator.js. Exports a `fill` map of template-name -> generator
// fn, matching the pack pattern of gen-crypto1-fill.js. Every answer is computed
// in-pack from the SAME numbers shown, using the small helpers below.

// ---------------------------------------------------------------------------
// Number-theory helpers (all in-pack, small inputs)
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

// Prime factorization as a Map(prime -> exponent).
const factorize = (n) => {
  const f = new Map();
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % p === 0) { f.set(p, (f.get(p) || 0) + 1); m /= p; }
  }
  if (m > 1) f.set(m, (f.get(m) || 0) + 1);
  return f;
};

const isPrime = (n) => {
  if (n < 2) return false;
  for (let p = 2; p * p <= n; p++) if (n % p === 0) return false;
  return true;
};

// Euler's totient from the prime factorization.
const totient = (n) => {
  let result = 1;
  for (const [p, e] of factorize(n)) result *= (p - 1) * p ** (e - 1);
  return result;
};

// Number of divisors d(n) = product of (e_i + 1).
const numDivisors = (n) => {
  let d = 1;
  for (const [, e] of factorize(n)) d *= (e + 1);
  return d;
};

// Sum of divisors sigma(n) = product of (p^(e+1) - 1)/(p - 1).
const sigmaDivisors = (n) => {
  let s = 1;
  for (const [p, e] of factorize(n)) s *= (p ** (e + 1) - 1) / (p - 1);
  return s;
};

// Fast modular exponentiation, small numbers.
const powMod = (base, exp, mod) => {
  let r = 1; base %= mod;
  while (exp > 0) {
    if (exp & 1) r = (r * base) % mod;
    base = (base * base) % mod;
    exp >>= 1;
  }
  return r;
};

// Legendre symbol (a/p) via Euler's criterion, p an odd prime, p does not divide a.
const legendre = (a, p) => {
  const r = powMod(((a % p) + p) % p, (p - 1) / 2, p);
  return r === p - 1 ? -1 : r; // p-1 represents -1
};

// Quadratic residues mod p (nonzero), sorted ascending.
const quadraticResidues = (p) => {
  const set = new Set();
  for (let x = 1; x < p; x++) set.add((x * x) % p);
  return [...set].sort((u, v) => u - v);
};

// Continued-fraction expansion of p/q -> [a0, a1, ...] (Euclidean quotients).
const cfExpand = (p, q) => {
  const a = [];
  while (q !== 0) {
    a.push(Math.floor(p / q));
    [p, q] = [q, p - Math.floor(p / q) * q];
  }
  return a;
};

// Convergents p_k/q_k for a term list; returns arrays of length terms.length.
const cfConvergents = (a) => {
  const ps = [], qs = [];
  for (let k = 0; k < a.length; k++) {
    if (k === 0) { ps.push(a[0]); qs.push(1); }
    else if (k === 1) { ps.push(a[1] * a[0] + 1); qs.push(a[1]); }
    else { ps.push(a[k] * ps[k - 1] + ps[k - 2]); qs.push(a[k] * qs[k - 1] + qs[k - 2]); }
  }
  return { ps, qs };
};

const ODD_PRIMES = [3, 5, 7, 11, 13, 17, 19, 23];

// ===========================================================================
export const fill = {};

// ===========================================================================
// number-theory.arithmetic-functions
// Concepts: euler-totient, divisor-functions, multiplicativity,
//           perfect-and-special-numbers
// ===========================================================================

// --- euler-totient ---

// d1: prime and prime power.
fill["nt2-totient-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13, 17, 19]);
  const phiP = p - 1;
  return {
    id: `gen.nt2-totient-1.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 1, context: "abstract",
    prompt: `Compute Euler's totient $\\varphi(${p})$.`,
    steps: [
      { instruction: `Is ${p} prime? For a prime $p$, every one of $1, \\dots, p-1$ is coprime to it. What is $\\varphi(${p})$?`, answer: `${phiP}`, accept: [], hint: `$\\varphi(p) = p - 1$ for a prime, so $${p} - 1$.` },
    ],
    finalAnswer: { value: `${phiP}`, unit: "" },
    solutionNarrative: `$${p}$ is prime, so $\\varphi(${p}) = ${p} - 1 = ${phiP}$.`,
  };
};

// d2: prime power p^k via phi(p^k) = p^k - p^(k-1).
fill["nt2-totient-2"] = (rng, idx) => {
  const p = rng.pick([2, 3, 5]);
  const k = rng.int(2, p === 2 ? 5 : 3);
  const n = p ** k, lower = p ** (k - 1), phi = n - lower;
  return {
    id: `gen.nt2-totient-2.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\varphi(${n})$, where $${n} = ${p}^{${k}}$.`,
    steps: [
      { instruction: `Use the prime-power formula $\\varphi(p^k) = p^k - p^{k-1}$. Here $p^{k-1} = ${p}^{${k - 1}} = $ ?`, answer: `${lower}`, accept: [], hint: `$${p}^{${k - 1}}$.` },
      { instruction: `Subtract: $\\varphi(${n}) = ${n} - ${lower} = $ ?`, answer: `${phi}`, accept: [], hint: `Strike out the multiples of ${p}; exactly $${lower}$ of them lie in $1..${n}$.` },
    ],
    finalAnswer: { value: `${phi}`, unit: "" },
    solutionNarrative: `$\\varphi(${p}^{${k}}) = ${p}^{${k}} - ${p}^{${k - 1}} = ${n} - ${lower} = ${phi}$: exactly the $${lower}$ multiples of ${p} fail to be coprime.`,
  };
};

// d3: general n via full factorization and product formula.
fill["nt2-totient-3"] = (rng, idx) => {
  const primes = [[2, 3], [2, 5], [3, 5], [2, 7], [3, 7], [2, 11], [5, 7]];
  const [p, q] = rng.pick(primes);
  const ep = rng.int(1, 2), eq = 1;
  const n = p ** ep * q ** eq;
  const phiP = (p - 1) * p ** (ep - 1), phiQ = (q - 1);
  const phi = phiP * phiQ;
  return {
    id: `gen.nt2-totient-3.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\varphi(${n})$ from its prime factorization using $\\varphi(n) = n\\prod_{p\\mid n}\\left(1 - \\tfrac{1}{p}\\right)$.`,
    steps: [
      { instruction: `Factor ${n} into prime powers. Its distinct primes are ${p} and ${q}. What is $\\varphi(${p}^{${ep}}) = ${p}^{${ep}} - ${p}^{${ep - 1}}$?`, answer: `${phiP}`, accept: [], hint: `Prime-power formula: $${p}^{${ep}} - ${p}^{${ep - 1}}$.` },
      { instruction: `What is $\\varphi(${q}) = ${q} - 1$?`, answer: `${phiQ}`, accept: [], hint: `${q} is prime.` },
      { instruction: `Multiply (totient is multiplicative on coprime parts): $\\varphi(${n}) = ${phiP} \\cdot ${phiQ} = $ ?`, answer: `${phi}`, accept: [], hint: `$${phiP} \\times ${phiQ}$.` },
    ],
    finalAnswer: { value: `${phi}`, unit: "" },
    solutionNarrative: `$${n} = ${p}^{${ep}} \\cdot ${q}$, so $\\varphi(${n}) = \\varphi(${p}^{${ep}})\\,\\varphi(${q}) = ${phiP} \\cdot ${phiQ} = ${phi}$.`,
  };
};

// --- divisor-functions ---

// d1: d(n) and sigma(n) for a small semiprime or prime.
fill["nt2-divfun-1"] = (rng, idx) => {
  const n = rng.pick([6, 10, 14, 15, 21, 22]);
  const d = numDivisors(n), s = sigmaDivisors(n);
  const [p, q] = [...factorize(n).keys()];
  return {
    id: `gen.nt2-divfun-1.${idx}`, generated: true, concepts: ["divisor-functions"], difficulty: 1, context: "abstract",
    prompt: `For $${n} = ${p} \\cdot ${q}$, compute the number of divisors $d(${n})$ and the sum of divisors $\\sigma(${n})$.`,
    steps: [
      { instruction: `Each exponent is 1, so $d(n) = (1+1)(1+1)$. What is $d(${n})$?`, answer: `${d}`, accept: [], hint: `A product of two distinct primes has divisors $1, ${p}, ${q}, ${n}$.` },
      { instruction: `Sum those divisors: $\\sigma(${n}) = 1 + ${p} + ${q} + ${n} = $ ?`, answer: `${s}`, accept: [], hint: `Add all four divisors.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$${n} = ${p} \\cdot ${q}$ has divisors $1, ${p}, ${q}, ${n}$, so $d(${n}) = ${d}$ and $\\sigma(${n}) = ${s}$.`,
  };
};

// d2: prime power p^k — d(n) = k+1, sigma via geometric sum.
fill["nt2-divfun-2"] = (rng, idx) => {
  const p = rng.pick([2, 3, 5]);
  const k = rng.int(2, p === 2 ? 4 : 3);
  const n = p ** k;
  const d = k + 1, s = sigmaDivisors(n);
  return {
    id: `gen.nt2-divfun-2.${idx}`, generated: true, concepts: ["divisor-functions"], difficulty: 2, context: "abstract",
    prompt: `For $${n} = ${p}^{${k}}$, compute $d(${n})$ and $\\sigma(${n})$.`,
    steps: [
      { instruction: `The exponent is ${k}, so $d(p^k) = k + 1$. What is $d(${n})$?`, answer: `${d}`, accept: [], hint: `The divisors are $${p}^0, ${p}^1, \\dots, ${p}^{${k}}$ — that is $${k} + 1$ of them.` },
      { instruction: `Use $\\sigma(p^k) = \\dfrac{p^{k+1} - 1}{p - 1}$. What is $\\sigma(${n})$?`, answer: `${s}`, accept: [], hint: `$\\dfrac{${p}^{${k + 1}} - 1}{${p} - 1} = \\dfrac{${p ** (k + 1) - 1}}{${p - 1}}$.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$d(${p}^{${k}}) = ${k} + 1 = ${d}$ and $\\sigma(${p}^{${k}}) = \\frac{${p}^{${k + 1}} - 1}{${p} - 1} = ${s}$.`,
  };
};

// d3: general n = p^a * q — combine per-prime factors.
fill["nt2-divfun-3"] = (rng, idx) => {
  const combos = [[2, 2, 3], [2, 3, 3], [2, 2, 5], [3, 2, 5], [2, 2, 7], [2, 3, 5]];
  const [p, a, q] = rng.pick(combos);
  const n = p ** a * q;
  const dP = a + 1, dQ = 2, d = dP * dQ;
  const sP = (p ** (a + 1) - 1) / (p - 1), sQ = q + 1, s = sP * sQ;
  return {
    id: `gen.nt2-divfun-3.${idx}`, generated: true, concepts: ["divisor-functions"], difficulty: 3, context: "abstract",
    prompt: `For $${n} = ${p}^{${a}} \\cdot ${q}$, compute $d(${n})$ and $\\sigma(${n})$ by multiplying the per-prime factors.`,
    steps: [
      { instruction: `$d$ is multiplicative: $d(${n}) = (${a}+1)(1+1)$. What is $d(${n})$?`, answer: `${d}`, accept: [], hint: `$${dP} \\cdot ${dQ}$: one factor per prime, using each exponent plus 1.` },
      { instruction: `Compute the ${p}-part of $\\sigma$: $\\sigma(${p}^{${a}}) = \\dfrac{${p}^{${a + 1}} - 1}{${p} - 1} = $ ?`, answer: `${sP}`, accept: [], hint: `Geometric sum $1 + ${p} + \\dots + ${p}^{${a}}$.` },
      { instruction: `The ${q}-part is $\\sigma(${q}) = ${q} + 1 = ${sQ}$. Multiply: $\\sigma(${n}) = ${sP} \\cdot ${sQ} = $ ?`, answer: `${s}`, accept: [], hint: `$\\sigma$ is multiplicative, so multiply the per-prime sums.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$${n} = ${p}^{${a}} \\cdot ${q}$, so $d(${n}) = ${dP} \\cdot ${dQ} = ${d}$ and $\\sigma(${n}) = ${sP} \\cdot ${sQ} = ${s}$.`,
  };
};

// --- multiplicativity ---

// d1: phi(mn) = phi(m)phi(n) for coprime m, n.
fill["nt2-mult-1"] = (rng, idx) => {
  const pairs = [[3, 5], [3, 4], [4, 5], [3, 8], [5, 8], [3, 7], [5, 7], [4, 9]];
  const [m, n] = rng.pick(pairs);
  const phiM = totient(m), phiN = totient(n), phiMN = phiM * phiN;
  return {
    id: `gen.nt2-mult-1.${idx}`, generated: true, concepts: ["multiplicativity"], difficulty: 1, context: "abstract",
    prompt: `Since $\\gcd(${m}, ${n}) = 1$, use $\\varphi(mn) = \\varphi(m)\\varphi(n)$ to compute $\\varphi(${m * n})$.`,
    steps: [
      { instruction: `What is $\\varphi(${m})$?`, answer: `${phiM}`, accept: [], hint: `Count the units mod ${m}.` },
      { instruction: `What is $\\varphi(${n})$?`, answer: `${phiN}`, accept: [], hint: `Count the units mod ${n}.` },
      { instruction: `Multiply: $\\varphi(${m * n}) = ${phiM} \\cdot ${phiN} = $ ?`, answer: `${phiMN}`, accept: [], hint: `Coprimality is what licenses this multiplication.` },
    ],
    finalAnswer: { value: `${phiMN}`, unit: "" },
    solutionNarrative: `$\\gcd(${m}, ${n}) = 1$, so $\\varphi(${m * n}) = \\varphi(${m})\\varphi(${n}) = ${phiM} \\cdot ${phiN} = ${phiMN}$.`,
  };
};

// d2: recognize whether a described function is multiplicative — menu.
fill["nt2-mult-2"] = (rng, idx) => {
  const items = [
    { label: "the totient $\\varphi(n)$", mult: true },
    { label: "the divisor count $d(n)$", mult: true },
    { label: "the divisor sum $\\sigma(n)$", mult: true },
    { label: "the constant function $f(n) = 5$", mult: false },
    { label: "the function $f(n) = n + 1$", mult: false },
    { label: "the identity $f(n) = n$", mult: true },
  ];
  const it = rng.pick(items);
  const ans = it.mult ? "multiplicative" : "not multiplicative";
  return {
    id: `gen.nt2-mult-2.${idx}`, generated: true, concepts: ["multiplicativity"], difficulty: 2, context: "abstract",
    prompt: `A function $f$ is (weakly) multiplicative when $f(mn) = f(m)f(n)$ for all coprime $m, n$. Is ${it.label} multiplicative?`,
    steps: [
      { instruction: `Decide. Type exactly 'multiplicative' or 'not multiplicative'.`, answer: ans, accept: it.mult ? [] : ["not-multiplicative"], hint: it.mult ? `Test coprime inputs like $2$ and $3$: the values factor across.` : `Test $f(1)$: a multiplicative function must have $f(1) = 1$.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: it.mult
      ? `${it.label} satisfies $f(mn) = f(m)f(n)$ for coprime $m, n$, so it is multiplicative.`
      : `${it.label} fails the test (a multiplicative function needs $f(1) = 1$ and $f(mn) = f(m)f(n)$), so it is not multiplicative.`,
  };
};

// d3: reconstruct phi(n) via multiplicativity across coprime factors of a larger n.
fill["nt2-mult-3"] = (rng, idx) => {
  const combos = [[8, 9], [8, 15], [9, 16], [16, 25], [9, 25], [8, 25], [16, 27]];
  const [m, n] = rng.pick(combos);
  const phiM = totient(m), phiN = totient(n), phiMN = phiM * phiN;
  const N = m * n;
  return {
    id: `gen.nt2-mult-3.${idx}`, generated: true, concepts: ["multiplicativity"], difficulty: 3, context: "abstract",
    prompt: `Compute $\\varphi(${N})$ by splitting into coprime prime-power blocks $${m}$ and $${n}$ (note $\\gcd(${m}, ${n}) = 1$).`,
    steps: [
      { instruction: `Confirm the split is coprime, then compute $\\varphi(${m})$ (a prime power).`, answer: `${phiM}`, accept: [], hint: `Use $\\varphi(p^k) = p^k - p^{k-1}$.` },
      { instruction: `Compute $\\varphi(${n})$ (the other prime power).`, answer: `${phiN}`, accept: [], hint: `Use $\\varphi(p^k) = p^k - p^{k-1}$ again.` },
      { instruction: `Multiply across the coprime blocks: $\\varphi(${N}) = ${phiM} \\cdot ${phiN} = $ ?`, answer: `${phiMN}`, accept: [], hint: `Multiplicativity turns one hard totient into a product of easy ones.` },
    ],
    finalAnswer: { value: `${phiMN}`, unit: "" },
    solutionNarrative: `$${N} = ${m} \\cdot ${n}$ with $\\gcd(${m}, ${n}) = 1$, so $\\varphi(${N}) = \\varphi(${m})\\varphi(${n}) = ${phiM} \\cdot ${phiN} = ${phiMN}$.`,
  };
};

// --- perfect-and-special-numbers ---

// d1: classify a small n as perfect/abundant/deficient — menu.
fill["nt2-perfect-1"] = (rng, idx) => {
  const n = rng.pick([6, 8, 10, 12, 14, 15, 16, 20, 28]);
  const s = sigmaDivisors(n), twoN = 2 * n;
  const cls = s === twoN ? "perfect" : s > twoN ? "abundant" : "deficient";
  return {
    id: `gen.nt2-perfect-1.${idx}`, generated: true, concepts: ["perfect-and-special-numbers"], difficulty: 1, context: "abstract",
    prompt: `Classify ${n} as perfect, abundant, or deficient by comparing $\\sigma(${n})$ to $2 \\cdot ${n} = ${twoN}$.`,
    steps: [
      { instruction: `Compute $\\sigma(${n})$ (sum of ALL divisors of ${n}, including ${n} itself).`, answer: `${s}`, accept: [], hint: `List every divisor of ${n} and add them.` },
      { instruction: `Compare with $2n = ${twoN}$. Type exactly 'perfect', 'abundant', or 'deficient'.`, answer: cls, accept: [], hint: `$\\sigma(n) = 2n$ is perfect, $> 2n$ abundant, $< 2n$ deficient.` },
    ],
    finalAnswer: { value: cls, unit: "" },
    solutionNarrative: `$\\sigma(${n}) = ${s}$ versus $2n = ${twoN}$: ${s === twoN ? "equal, so perfect" : s > twoN ? "greater, so abundant" : "less, so deficient"}.`,
  };
};

// d2: numeric — compute sigma(n) - 2n (the "abundance").
fill["nt2-perfect-2"] = (rng, idx) => {
  const n = rng.pick([12, 18, 20, 24, 6, 28, 8, 16, 27, 15]);
  const s = sigmaDivisors(n), twoN = 2 * n, ab = s - twoN;
  return {
    id: `gen.nt2-perfect-2.${idx}`, generated: true, concepts: ["perfect-and-special-numbers"], difficulty: 2, context: "abstract",
    prompt: `Compute the abundance $\\sigma(${n}) - 2 \\cdot ${n}$ (positive means abundant, zero perfect, negative deficient).`,
    steps: [
      { instruction: `Compute $\\sigma(${n})$.`, answer: `${s}`, accept: [], hint: `Sum every divisor of ${n}.` },
      { instruction: `Subtract $2n$: $${s} - ${twoN} = $ ?`, answer: `${ab}`, accept: [], hint: `$2 \\cdot ${n} = ${twoN}$.` },
    ],
    finalAnswer: { value: `${ab}`, unit: "" },
    solutionNarrative: `$\\sigma(${n}) = ${s}$ and $2n = ${twoN}$, so the abundance is $${s} - ${twoN} = ${ab}$ (${ab === 0 ? "perfect" : ab > 0 ? "abundant" : "deficient"}).`,
  };
};

// d3: verify a Euclid–Euler perfect number 2^(p-1)(2^p - 1).
fill["nt2-perfect-3"] = (rng, idx) => {
  const p = rng.pick([2, 3, 5]); // 2^p-1 prime -> 6, 28, 496
  const mersenne = 2 ** p - 1;
  const n = 2 ** (p - 1) * mersenne;
  const s = sigmaDivisors(n), twoN = 2 * n;
  return {
    id: `gen.nt2-perfect-3.${idx}`, generated: true, concepts: ["perfect-and-special-numbers"], difficulty: 3, context: "abstract",
    prompt: `Euclid's rule: if $2^p - 1$ is prime, then $2^{p-1}(2^p - 1)$ is perfect. Verify this for $p = ${p}$, giving $n = ${n}$.`,
    steps: [
      { instruction: `Compute the Mersenne prime $2^{${p}} - 1 = $ ?`, answer: `${mersenne}`, accept: [], hint: `$2^{${p}} = ${2 ** p}$.` },
      { instruction: `With $n = 2^{${p - 1}} \\cdot ${mersenne} = ${n}$, compute $\\sigma(${n})$.`, answer: `${s}`, accept: [], hint: `$\\sigma(2^{${p - 1}}) \\cdot \\sigma(${mersenne})$, using $\\sigma(2^{k}) = 2^{k+1}-1$ and $\\sigma(\\text{prime}) = \\text{prime}+1$.` },
      { instruction: `Compare to $2n = ${twoN}$. Is $n$ perfect? Type exactly 'perfect', 'abundant', or 'deficient'.`, answer: "perfect", accept: [], hint: `Euclid's rule guarantees $\\sigma(n) = 2n$.` },
    ],
    finalAnswer: { value: "perfect", unit: "" },
    solutionNarrative: `$2^{${p}} - 1 = ${mersenne}$ is prime, so $n = 2^{${p - 1}} \\cdot ${mersenne} = ${n}$ is perfect: $\\sigma(${n}) = ${s} = 2 \\cdot ${n}$.`,
  };
};

// ===========================================================================
// number-theory.quadratic-residues
// Concepts: qr-basics, legendre-symbol, eulers-criterion-and-properties,
//           reciprocity-light
// ===========================================================================

// --- qr-basics ---

// d1: is a specific a a QR mod p? — menu yes/no.
fill["nt2-qrbasic-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13]);
  const qrs = quadraticResidues(p);
  let a; do { a = rng.int(1, p - 1); } while (false && a === 0);
  const isQR = qrs.includes(a);
  const ans = isQR ? "yes" : "no";
  return {
    id: `gen.nt2-qrbasic-1.${idx}`, generated: true, concepts: ["qr-basics"], difficulty: 1, context: "abstract",
    prompt: `Is ${a} a quadratic residue mod ${p}? (That is: is there an $x$ with $x^2 \\equiv ${a} \\pmod{${p}}$?)`,
    steps: [
      { instruction: `The nonzero squares mod ${p} are $\\{${qrs.join(", ")}\\}$. Is ${a} in that list? Type 'yes' or 'no'.`, answer: ans, accept: [ans[0]], hint: `Square $1, 2, \\dots, ${p - 1}$ mod ${p} and see which residues appear.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `The QRs mod ${p} are $\\{${qrs.join(", ")}\\}$, so ${a} is ${isQR ? "" : "not "}a quadratic residue.`,
  };
};

// d2: count the QRs mod p (should be (p-1)/2) — numeric.
fill["nt2-qrbasic-2"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17, 19]);
  const qrs = quadraticResidues(p);
  const count = qrs.length;
  const sq = rng.int(2, p - 1);
  const val = (sq * sq) % p;
  return {
    id: `gen.nt2-qrbasic-2.${idx}`, generated: true, concepts: ["qr-basics"], difficulty: 2, context: "abstract",
    prompt: `Work with quadratic residues mod ${p}.`,
    steps: [
      { instruction: `Compute $${sq}^2 \\bmod ${p}$ — one specific quadratic residue.`, answer: `${val}`, accept: [], hint: `$${sq * sq} \\bmod ${p}$.` },
      { instruction: `Exactly half of the nonzero residues are QRs. How many nonzero quadratic residues are there mod ${p}? (i.e. $(p-1)/2$)`, answer: `${count}`, accept: [], hint: `$(${p} - 1)/2$.` },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: `$${sq}^2 \\equiv ${val} \\pmod{${p}}$, and there are $(p-1)/2 = ${count}$ nonzero QRs mod ${p}: $\\{${qrs.join(", ")}\\}$.`,
  };
};

// d3: find ALL square roots of a QR, or count QRs form:solutions style (grade count).
fill["nt2-qrbasic-3"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  // pick x, form a = x^2, the two roots are x and p-x.
  let x; do { x = rng.int(2, p - 2); } while (x === p - x);
  const a = (x * x) % p;
  const r1 = Math.min(x, p - x), r2 = Math.max(x, p - x);
  return {
    id: `gen.nt2-qrbasic-3.${idx}`, generated: true, concepts: ["qr-basics"], difficulty: 3, context: "abstract",
    prompt: `${a} is a quadratic residue mod ${p}. Find its two square roots (they come in a $\\pm$ pair, $x$ and $${p} - x$).`,
    steps: [
      { instruction: `Find the smaller root $x$ in $1..${(p - 1) / 2}$ with $x^2 \\equiv ${a} \\pmod{${p}}$.`, answer: `${r1}`, accept: [], hint: `Try $x = 1, 2, \\dots$ until $x^2 \\bmod ${p} = ${a}$.` },
      { instruction: `The other root is $${p} - ${r1} = $ ?`, answer: `${r2}`, accept: [], hint: `Roots pair up as $x$ and $p - x$.` },
    ],
    finalAnswer: { value: `${r1}`, unit: "" },
    solutionNarrative: `$${r1}^2 \\equiv ${a}$ and $${r2}^2 \\equiv ${a} \\pmod{${p}}$: the two square roots of ${a} are $${r1}$ and $${r2} = ${p} - ${r1}$.`,
  };
};

// --- legendre-symbol ---

// d1: Legendre symbol via Euler's criterion, small p — answer +1/-1.
fill["nt2-legendre-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13]);
  let a; do { a = rng.int(2, p - 1); } while (a % p === 0);
  const half = powMod(a, (p - 1) / 2, p);
  const sym = legendre(a, p);
  return {
    id: `gen.nt2-legendre-1.${idx}`, generated: true, concepts: ["legendre-symbol"], difficulty: 1, context: "abstract",
    prompt: `Compute the Legendre symbol $\\left(\\dfrac{${a}}{${p}}\\right)$ using Euler's criterion $a^{(p-1)/2} \\bmod p$ (answer is $+1$ or $-1$).`,
    steps: [
      { instruction: `The exponent is $(p-1)/2 = (${p}-1)/2 = $ ?`, answer: `${(p - 1) / 2}`, accept: [], hint: `Half of $${p} - 1$.` },
      { instruction: `Compute $${a}^{${(p - 1) / 2}} \\bmod ${p}$ (this is either $1$ or $${p - 1} \\equiv -1$).`, answer: `${half}`, accept: [], hint: `Square and reduce.` },
      { instruction: `Read off the symbol: $1$ means $+1$, and $${p - 1} \\equiv -1$ means $-1$. What is $\\left(\\dfrac{${a}}{${p}}\\right)$?`, answer: `${sym}`, accept: [], hint: `$${half}$ ${half === 1 ? "is $1$" : `$\\equiv -1$`}.` },
    ],
    finalAnswer: { value: `${sym}`, unit: "" },
    solutionNarrative: `$${a}^{${(p - 1) / 2}} \\equiv ${half} \\pmod{${p}}$, and $${half} ${half === 1 ? "= 1" : "\\equiv -1"}$, so $\\left(\\frac{${a}}{${p}}\\right) = ${sym}$.`,
  };
};

// d2: Legendre with a > p, reduce first.
fill["nt2-legendre-2"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  const base = rng.int(2, p - 1);
  const a = base + p * rng.int(1, 3); // a > p
  const red = a % p;
  const half = powMod(red, (p - 1) / 2, p);
  const sym = legendre(red, p);
  return {
    id: `gen.nt2-legendre-2.${idx}`, generated: true, concepts: ["legendre-symbol"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\left(\\dfrac{${a}}{${p}}\\right)$. Reduce $a$ mod $p$ first, then apply Euler's criterion.`,
    steps: [
      { instruction: `Reduce the top: $${a} \\bmod ${p} = $ ?`, answer: `${red}`, accept: [], hint: `The symbol depends only on $a \\bmod p$.` },
      { instruction: `Apply Euler's criterion: $${red}^{${(p - 1) / 2}} \\bmod ${p} = $ ?`, answer: `${half}`, accept: [], hint: `Square-and-multiply, reducing mod ${p}.` },
      { instruction: `So $\\left(\\dfrac{${a}}{${p}}\\right) = $ ? (Give $+1$ or $-1$; $${p - 1} \\equiv -1$.)`, answer: `${sym}`, accept: [], hint: `$${half}$ maps to ${sym}.` },
    ],
    finalAnswer: { value: `${sym}`, unit: "" },
    solutionNarrative: `$${a} \\equiv ${red} \\pmod{${p}}$, and $${red}^{${(p - 1) / 2}} \\equiv ${half} \\pmod{${p}}$, so $\\left(\\frac{${a}}{${p}}\\right) = ${sym}$.`,
  };
};

// d3: multiplicativity of Legendre symbol (ab/p) = (a/p)(b/p).
fill["nt2-legendre-3"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  let a, b;
  do { a = rng.int(2, p - 1); } while (a % p === 0);
  do { b = rng.int(2, p - 1); } while (b % p === 0 || b === a);
  const sa = legendre(a, p), sb = legendre(b, p);
  const prod = sa * sb;
  const ab = (a * b) % p;
  const sab = legendre(ab, p);
  return {
    id: `gen.nt2-legendre-3.${idx}`, generated: true, concepts: ["legendre-symbol"], difficulty: 3, context: "abstract",
    prompt: `Use multiplicativity $\\left(\\dfrac{ab}{p}\\right) = \\left(\\dfrac{a}{p}\\right)\\left(\\dfrac{b}{p}\\right)$ to find $\\left(\\dfrac{${a} \\cdot ${b}}{${p}}\\right)$.`,
    steps: [
      { instruction: `Compute $\\left(\\dfrac{${a}}{${p}}\\right)$ (via Euler's criterion, $+1$ or $-1$).`, answer: `${sa}`, accept: [], hint: `$${a}^{${(p - 1) / 2}} \\bmod ${p}$.` },
      { instruction: `Compute $\\left(\\dfrac{${b}}{${p}}\\right)$.`, answer: `${sb}`, accept: [], hint: `$${b}^{${(p - 1) / 2}} \\bmod ${p}$.` },
      { instruction: `Multiply the symbols: $${sa} \\cdot ${sb} = \\left(\\dfrac{${a} \\cdot ${b}}{${p}}\\right) = $ ?`, answer: `${prod}`, accept: [], hint: `A product of two $\\pm 1$ values.` },
    ],
    finalAnswer: { value: `${sab}`, unit: "" },
    solutionNarrative: `$\\left(\\frac{${a}}{${p}}\\right) = ${sa}$ and $\\left(\\frac{${b}}{${p}}\\right) = ${sb}$, so $\\left(\\frac{${a * b}}{${p}}\\right) = ${sa} \\cdot ${sb} = ${prod}$ (and directly $\\left(\\frac{${ab}}{${p}}\\right) = ${sab}$, agreeing).`,
  };
};

// --- eulers-criterion-and-properties ---

// d1: (-1/p) rule: +1 if p ≡ 1 mod 4, -1 if p ≡ 3 mod 4.
fill["nt2-euler-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13, 17, 19]);
  const r = p % 4;
  const sym = r === 1 ? 1 : -1;
  return {
    id: `gen.nt2-euler-1.${idx}`, generated: true, concepts: ["eulers-criterion-and-properties"], difficulty: 1, context: "abstract",
    prompt: `Is $-1$ a quadratic residue mod ${p}? Use the rule $\\left(\\dfrac{-1}{p}\\right) = +1$ iff $p \\equiv 1 \\pmod 4$.`,
    steps: [
      { instruction: `Compute $${p} \\bmod 4$.`, answer: `${r}`, accept: [], hint: `Remainder of ${p} on division by 4.` },
      { instruction: `So $\\left(\\dfrac{-1}{${p}}\\right) = $ ? (Give $+1$ or $-1$.)`, answer: `${sym}`, accept: [], hint: `$p \\equiv 1$ gives $+1$; $p \\equiv 3$ gives $-1$.` },
    ],
    finalAnswer: { value: `${sym}`, unit: "" },
    solutionNarrative: `$${p} \\equiv ${r} \\pmod 4$, so $\\left(\\frac{-1}{${p}}\\right) = ${sym}$ — $-1$ is ${sym === 1 ? "" : "not "}a QR mod ${p}.`,
  };
};

// d2: use Euler's criterion + multiplicativity to decide a QR question — menu.
fill["nt2-euler-2"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  let a; do { a = rng.int(2, p - 1); } while (a % p === 0);
  const half = powMod(a, (p - 1) / 2, p);
  const isQR = half === 1;
  const ans = isQR ? "residue" : "non-residue";
  return {
    id: `gen.nt2-euler-2.${idx}`, generated: true, concepts: ["eulers-criterion-and-properties"], difficulty: 2, context: "abstract",
    prompt: `Euler's criterion says $a^{(p-1)/2} \\equiv 1$ for a residue and $\\equiv -1$ for a non-residue. Classify ${a} mod ${p}.`,
    steps: [
      { instruction: `Compute $${a}^{${(p - 1) / 2}} \\bmod ${p}$.`, answer: `${half}`, accept: [], hint: `Either $1$ or $${p - 1}$.` },
      { instruction: `Is ${a} a quadratic residue or non-residue mod ${p}? Type exactly 'residue' or 'non-residue'.`, answer: ans, accept: ans === "non-residue" ? ["nonresidue"] : [], hint: `Result $1 \\Rightarrow$ residue; $-1 \\Rightarrow$ non-residue.` },
    ],
    finalAnswer: { value: ans, unit: "" },
    solutionNarrative: `$${a}^{${(p - 1) / 2}} \\equiv ${half} \\pmod{${p}}$, so ${a} is a ${ans} mod ${p}.`,
  };
};

// d3: (2/p) rule via p mod 8, plus multiplicativity to combine.
fill["nt2-euler-3"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17, 23]);
  const r8 = p % 8;
  const sym2 = (r8 === 1 || r8 === 7) ? 1 : -1;
  return {
    id: `gen.nt2-euler-3.${idx}`, generated: true, concepts: ["eulers-criterion-and-properties"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\left(\\dfrac{2}{${p}}\\right)$ using the supplementary law: $\\left(\\dfrac{2}{p}\\right) = +1$ iff $p \\equiv \\pm 1 \\pmod 8$.`,
    steps: [
      { instruction: `Compute $${p} \\bmod 8$.`, answer: `${r8}`, accept: [], hint: `Remainder of ${p} on division by 8.` },
      { instruction: `Is $${p} \\equiv \\pm 1 \\pmod 8$ (i.e. residue 1 or 7)? So $\\left(\\dfrac{2}{${p}}\\right) = $ ? (Give $+1$ or $-1$.)`, answer: `${sym2}`, accept: [], hint: `$r = 1$ or $7 \\Rightarrow +1$; $r = 3$ or $5 \\Rightarrow -1$.` },
    ],
    finalAnswer: { value: `${sym2}`, unit: "" },
    solutionNarrative: `$${p} \\equiv ${r8} \\pmod 8$, so $\\left(\\frac{2}{${p}}\\right) = ${sym2}$ (the value is $+1$ exactly when $p \\equiv \\pm 1 \\pmod 8$).`,
  };
};

// --- reciprocity-light ---

// d1: quadratic reciprocity between two small odd primes.
fill["nt2-recip-1"] = (rng, idx) => {
  // pick distinct odd primes p (the "bottom") and q (the "top")
  let p, q;
  do { p = rng.pick(ODD_PRIMES); q = rng.pick(ODD_PRIMES); } while (p === q);
  const symQP = legendre(q, p); // (q/p) directly, verified
  const flip = ((p - 1) / 2) * ((q - 1) / 2) % 2 === 1 ? -1 : 1;
  const symPQ = legendre(p, q);
  return {
    id: `gen.nt2-recip-1.${idx}`, generated: true, concepts: ["reciprocity-light"], difficulty: 1, context: "abstract",
    prompt: `Quadratic reciprocity relates $\\left(\\dfrac{${q}}{${p}}\\right)$ and $\\left(\\dfrac{${p}}{${q}}\\right)$: they are equal unless BOTH primes are $\\equiv 3 \\pmod 4$, in which case they differ by a sign. Evaluate $\\left(\\dfrac{${q}}{${p}}\\right)$.`,
    steps: [
      { instruction: `Evaluate $\\left(\\dfrac{${q}}{${p}}\\right)$ via Euler's criterion, $${q}^{${(p - 1) / 2}} \\bmod ${p}$. Answer $+1$ or $-1$.`, answer: `${symQP}`, accept: [], hint: `Reduce $${q} \\bmod ${p}$ first if helpful.` },
    ],
    finalAnswer: { value: `${symQP}`, unit: "" },
    solutionNarrative: `$\\left(\\frac{${q}}{${p}}\\right) = ${symQP}$. Reciprocity's sign factor is $(-1)^{\\frac{${p}-1}{2}\\cdot\\frac{${q}-1}{2}} = ${flip}$, linking this to $\\left(\\frac{${p}}{${q}}\\right) = ${symPQ}$.`,
  };
};

// d2: apply reciprocity to flip then evaluate the easier symbol.
fill["nt2-recip-2"] = (rng, idx) => {
  let p, q;
  do { p = rng.pick([11, 13, 17, 19, 23]); q = rng.pick([3, 5, 7]); } while (p === q);
  const flip = (((p - 1) / 2) * ((q - 1) / 2)) % 2 === 1 ? -1 : 1;
  const symFlipped = legendre(p % q, q); // (p/q) = (p mod q / q)
  const target = flip * symFlipped; // (q/p)
  const check = legendre(q, p);
  const pModQ = p % q;
  return {
    id: `gen.nt2-recip-2.${idx}`, generated: true, concepts: ["reciprocity-light"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $\\left(\\dfrac{${q}}{${p}}\\right)$ by flipping with quadratic reciprocity to the smaller modulus ${q}.`,
    steps: [
      { instruction: `Reciprocity sign: $(-1)^{\\frac{${p}-1}{2}\\cdot\\frac{${q}-1}{2}} = $ ? (This is $+1$ unless both $p, q \\equiv 3 \\bmod 4$.)`, answer: `${flip}`, accept: [], hint: `Check each of $${p}, ${q}$ mod 4.` },
      { instruction: `Now the flipped symbol $\\left(\\dfrac{${p}}{${q}}\\right) = \\left(\\dfrac{${pModQ}}{${q}}\\right)$ (reduce ${p} mod ${q}). Its value is:`, answer: `${symFlipped}`, accept: [], hint: `Evaluate $\\left(\\frac{${pModQ}}{${q}}\\right)$ with the small QRs mod ${q}.` },
      { instruction: `Combine: $\\left(\\dfrac{${q}}{${p}}\\right) = ${flip} \\cdot ${symFlipped} = $ ?`, answer: `${target}`, accept: [], hint: `Multiply the sign by the flipped symbol.` },
    ],
    finalAnswer: { value: `${target}`, unit: "" },
    solutionNarrative: `Reciprocity gives $\\left(\\frac{${q}}{${p}}\\right) = ${flip} \\cdot \\left(\\frac{${pModQ}}{${q}}\\right) = ${flip} \\cdot ${symFlipped} = ${target}$ (direct check: $\\left(\\frac{${q}}{${p}}\\right) = ${check}$).`,
  };
};

// d3: full reciprocity chain with a reduction and the (-1) or (2) supplement.
fill["nt2-recip-3"] = (rng, idx) => {
  let p, q;
  do { p = rng.pick([13, 17, 19, 23, 29, 31]); q = rng.pick([3, 5, 7, 11]); } while (p === q || p < q);
  const pModQ = p % q;
  const flip = (((p - 1) / 2) * ((q - 1) / 2)) % 2 === 1 ? -1 : 1;
  const symReduced = legendre(pModQ, q);
  const target = flip * symReduced;
  const direct = legendre(q, p);
  return {
    id: `gen.nt2-recip-3.${idx}`, generated: true, concepts: ["reciprocity-light"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $\\left(\\dfrac{${q}}{${p}}\\right)$ for the odd primes $${q}$ and $${p}$ using the full reciprocity workflow: flip, reduce, evaluate.`,
    steps: [
      { instruction: `Reciprocity sign factor $(-1)^{\\frac{${p}-1}{2}\\cdot\\frac{${q}-1}{2}} = $ ?`, answer: `${flip}`, accept: [], hint: `It is $-1$ only when both $${p} \\equiv 3$ and $${q} \\equiv 3 \\pmod 4$.` },
      { instruction: `Flip to $\\left(\\dfrac{${p}}{${q}}\\right)$ and reduce the top mod ${q}: $${p} \\bmod ${q} = $ ?`, answer: `${pModQ}`, accept: [], hint: `Now the symbol has a much smaller top.` },
      { instruction: `Evaluate $\\left(\\dfrac{${pModQ}}{${q}}\\right)$ (Euler's criterion mod ${q}, $+1$ or $-1$).`, answer: `${symReduced}`, accept: [], hint: `$${pModQ}^{${(q - 1) / 2}} \\bmod ${q}$.` },
      { instruction: `Assemble: $\\left(\\dfrac{${q}}{${p}}\\right) = ${flip} \\cdot ${symReduced} = $ ?`, answer: `${target}`, accept: [], hint: `Sign times the reduced symbol.` },
    ],
    finalAnswer: { value: `${target}`, unit: "" },
    solutionNarrative: `$\\left(\\frac{${q}}{${p}}\\right) = ${flip}\\left(\\frac{${p}}{${q}}\\right) = ${flip}\\left(\\frac{${pModQ}}{${q}}\\right) = ${flip} \\cdot ${symReduced} = ${target}$ (direct Euler check: $${direct}$).`,
  };
};

// ===========================================================================
// number-theory.continued-fractions
// Concepts: finite-continued-fractions, convergents, value-of-a-cf,
//           rational-approximation
// ===========================================================================

// Build a rational p/q whose CF has a chosen number of terms, by picking terms.
const buildRationalFromTerms = (terms) => {
  // Evaluate [a0; a1, ...] from the back.
  let num = terms[terms.length - 1], den = 1;
  for (let i = terms.length - 2; i >= 0; i--) {
    [num, den] = [terms[i] * num + den, num];
  }
  return { p: num, q: den };
};

// --- finite-continued-fractions ---

// d1: expand a 2-term CF p/q -> [a0; a1].
fill["nt2-cf-1"] = (rng, idx) => {
  const a0 = rng.int(1, 4), a1 = rng.int(2, 5);
  const { p, q } = buildRationalFromTerms([a0, a1]);
  const terms = cfExpand(p, q); // [a0, a1]
  return {
    id: `gen.nt2-cf-1.${idx}`, generated: true, concepts: ["finite-continued-fractions"], difficulty: 1, context: "abstract",
    prompt: `Expand $\\dfrac{${p}}{${q}}$ as a continued fraction $[a_0; a_1]$ using the Euclidean algorithm.`,
    steps: [
      { instruction: `Divide: what is $a_0 = \\lfloor ${p}/${q} \\rfloor$?`, answer: `${terms[0]}`, accept: [], hint: `Whole-number part of $${p} \\div ${q}$.` },
      { instruction: `The remainder gives $${p} = ${terms[0]} \\cdot ${q} + ${p - terms[0] * q}$; invert $\\dfrac{${q}}{${p - terms[0] * q}}$. What is $a_1$?`, answer: `${terms[1]}`, accept: [], hint: `$\\lfloor ${q}/${p - terms[0] * q} \\rfloor$, and here it divides exactly.` },
    ],
    finalAnswer: { value: `${terms[1]}`, unit: "" },
    solutionNarrative: `Euclid on $(${p}, ${q})$ gives quotients $${terms.join(", ")}$, so $\\frac{${p}}{${q}} = [${terms[0]}; ${terms[1]}]$.`,
  };
};

// d2: expand a 3-term CF, grade each term separately.
fill["nt2-cf-2"] = (rng, idx) => {
  const a0 = rng.int(1, 3), a1 = rng.int(1, 4), a2 = rng.int(2, 4);
  const { p, q } = buildRationalFromTerms([a0, a1, a2]);
  const terms = cfExpand(p, q);
  return {
    id: `gen.nt2-cf-2.${idx}`, generated: true, concepts: ["finite-continued-fractions"], difficulty: 2, context: "abstract",
    prompt: `Expand $\\dfrac{${p}}{${q}}$ as a continued fraction $[a_0; a_1, a_2]$ via repeated Euclidean division. Report each term.`,
    steps: [
      { instruction: `$a_0 = \\lfloor ${p}/${q} \\rfloor = $ ?`, answer: `${terms[0]}`, accept: [], hint: `Integer part of the quotient.` },
      { instruction: `$a_1$ (next quotient) $= $ ?`, answer: `${terms[1]}`, accept: [], hint: `Invert the remainder fraction and take the floor.` },
      { instruction: `$a_2$ (final quotient) $= $ ?`, answer: `${terms[2]}`, accept: [], hint: `The last nonzero step of the algorithm.` },
    ],
    finalAnswer: { value: `${terms[2]}`, unit: "" },
    solutionNarrative: `The Euclidean quotients of $(${p}, ${q})$ are $${terms.join(", ")}$, so $\\frac{${p}}{${q}} = [${terms[0]}; ${terms[1]}, ${terms[2]}]$.`,
  };
};

// d3: expand a 4-term CF, grade each term.
fill["nt2-cf-3"] = (rng, idx) => {
  const a0 = rng.int(1, 3), a1 = rng.int(1, 3), a2 = rng.int(1, 3), a3 = rng.int(2, 4);
  const { p, q } = buildRationalFromTerms([a0, a1, a2, a3]);
  const terms = cfExpand(p, q);
  return {
    id: `gen.nt2-cf-3.${idx}`, generated: true, concepts: ["finite-continued-fractions"], difficulty: 3, context: "abstract",
    prompt: `Expand $\\dfrac{${p}}{${q}}$ as a continued fraction $[a_0; a_1, a_2, a_3]$. Report all four terms.`,
    steps: [
      { instruction: `$a_0 = \\lfloor ${p}/${q} \\rfloor = $ ?`, answer: `${terms[0]}`, accept: [], hint: `Floor of the first division.` },
      { instruction: `$a_1 = $ ?`, answer: `${terms[1]}`, accept: [], hint: `Second Euclidean quotient.` },
      { instruction: `$a_2 = $ ?`, answer: `${terms[2]}`, accept: [], hint: `Third quotient.` },
      { instruction: `$a_3 = $ ?`, answer: `${terms[3]}`, accept: [], hint: `Final quotient (remainder hits 0 after it).` },
    ],
    finalAnswer: { value: `${terms[3]}`, unit: "" },
    solutionNarrative: `The Euclidean cascade on $(${p}, ${q})$ gives quotients $${terms.join(", ")}$, so $\\frac{${p}}{${q}} = [${terms[0]}; ${terms.slice(1).join(", ")}]$.`,
  };
};

// --- convergents ---

// d1: first convergent p0/q0 = a0/1 and second convergent.
fill["nt2-conv-1"] = (rng, idx) => {
  const a0 = rng.int(2, 5), a1 = rng.int(2, 4), a2 = rng.int(2, 4);
  const terms = [a0, a1, a2];
  const { ps, qs } = cfConvergents(terms);
  return {
    id: `gen.nt2-conv-1.${idx}`, generated: true, concepts: ["convergents"], difficulty: 1, context: "abstract",
    prompt: `Given the continued fraction $[${a0}; ${a1}, ${a2}]$, compute its first two convergents.`,
    steps: [
      { instruction: `The zeroth convergent is $\\dfrac{p_0}{q_0} = \\dfrac{a_0}{1}$. Give it as a fraction.`, answer: `${ps[0]}/${qs[0]}`, accept: [`${ps[0]}`], hint: `Just $a_0$ over 1.` },
      { instruction: `The first convergent is $\\dfrac{p_1}{q_1} = \\dfrac{a_1 a_0 + 1}{a_1}$. Give it as a fraction.`, answer: `${ps[1]}/${qs[1]}`, accept: [], hint: `$\\frac{${a1}\\cdot${a0} + 1}{${a1}} = \\frac{${ps[1]}}{${qs[1]}}$.` },
    ],
    finalAnswer: { value: `${ps[1]}/${qs[1]}`, unit: "" },
    solutionNarrative: `$\\frac{p_0}{q_0} = \\frac{${ps[0]}}{1}$ and $\\frac{p_1}{q_1} = \\frac{${a1}\\cdot${a0}+1}{${a1}} = \\frac{${ps[1]}}{${qs[1]}}$.`,
  };
};

// d2: compute the k=2 convergent using the recurrence.
fill["nt2-conv-2"] = (rng, idx) => {
  const a0 = rng.int(1, 3), a1 = rng.int(1, 3), a2 = rng.int(2, 4);
  const terms = [a0, a1, a2];
  const { ps, qs } = cfConvergents(terms);
  return {
    id: `gen.nt2-conv-2.${idx}`, generated: true, concepts: ["convergents"], difficulty: 2, context: "abstract",
    prompt: `For $[${a0}; ${a1}, ${a2}]$, use the recurrence $p_k = a_k p_{k-1} + p_{k-2}$, $q_k = a_k q_{k-1} + q_{k-2}$ to find the convergent $\\dfrac{p_2}{q_2}$.`,
    steps: [
      { instruction: `Numerator: $p_2 = ${a2} \\cdot ${ps[1]} + ${ps[0]} = $ ?`, answer: `${ps[2]}`, accept: [], hint: `$p_1 = ${ps[1]}$, $p_0 = ${ps[0]}$.` },
      { instruction: `Denominator: $q_2 = ${a2} \\cdot ${qs[1]} + ${qs[0]} = $ ?`, answer: `${qs[2]}`, accept: [], hint: `$q_1 = ${qs[1]}$, $q_0 = ${qs[0]}$.` },
      { instruction: `Write the convergent $\\dfrac{p_2}{q_2}$ as a fraction.`, answer: `${ps[2]}/${qs[2]}`, accept: [], hint: `$\\frac{${ps[2]}}{${qs[2]}}$.` },
    ],
    finalAnswer: { value: `${ps[2]}/${qs[2]}`, unit: "" },
    solutionNarrative: `$p_2 = ${a2}\\cdot${ps[1]}+${ps[0]} = ${ps[2]}$ and $q_2 = ${a2}\\cdot${qs[1]}+${qs[0]} = ${qs[2]}$, so $\\frac{p_2}{q_2} = \\frac{${ps[2]}}{${qs[2]}}$.`,
  };
};

// d3: 4-term CF, compute the 3rd convergent via recurrence.
fill["nt2-conv-3"] = (rng, idx) => {
  const a0 = rng.int(1, 3), a1 = rng.int(1, 3), a2 = rng.int(1, 3), a3 = rng.int(2, 4);
  const terms = [a0, a1, a2, a3];
  const { ps, qs } = cfConvergents(terms);
  return {
    id: `gen.nt2-conv-3.${idx}`, generated: true, concepts: ["convergents"], difficulty: 3, context: "abstract",
    prompt: `For $[${a0}; ${a1}, ${a2}, ${a3}]$, compute the third convergent $\\dfrac{p_3}{q_3}$ using the recurrence.`,
    steps: [
      { instruction: `First build $\\frac{p_2}{q_2}$: $p_2 = ${a2}\\cdot${ps[1]}+${ps[0]} = $ ?`, answer: `${ps[2]}`, accept: [], hint: `$p_1 = ${ps[1]}, p_0 = ${ps[0]}$.` },
      { instruction: `$q_2 = ${a2}\\cdot${qs[1]}+${qs[0]} = $ ?`, answer: `${qs[2]}`, accept: [], hint: `$q_1 = ${qs[1]}, q_0 = ${qs[0]}$.` },
      { instruction: `Now $p_3 = ${a3}\\cdot${ps[2]}+${ps[1]} = $ ?`, answer: `${ps[3]}`, accept: [], hint: `Use the $p_2$ you just found.` },
      { instruction: `And the convergent: $\\dfrac{p_3}{q_3}$ where $q_3 = ${a3}\\cdot${qs[2]}+${qs[1]} = ${qs[3]}$. Give the fraction $\\frac{p_3}{q_3}$.`, answer: `${ps[3]}/${qs[3]}`, accept: [], hint: `$\\frac{${ps[3]}}{${qs[3]}}$.` },
    ],
    finalAnswer: { value: `${ps[3]}/${qs[3]}`, unit: "" },
    solutionNarrative: `Recurrence gives $\\frac{p_2}{q_2} = \\frac{${ps[2]}}{${qs[2]}}$ then $\\frac{p_3}{q_3} = \\frac{${ps[3]}}{${qs[3]}}$.`,
  };
};

// --- value-of-a-cf ---

// d1: evaluate a 2-term CF [a0; a1] back to p/q.
fill["nt2-value-1"] = (rng, idx) => {
  const a0 = rng.int(1, 4), a1 = rng.int(2, 5);
  const { p, q } = buildRationalFromTerms([a0, a1]);
  return {
    id: `gen.nt2-value-1.${idx}`, generated: true, concepts: ["value-of-a-cf"], difficulty: 1, context: "abstract",
    prompt: `Evaluate the continued fraction $[${a0}; ${a1}] = ${a0} + \\dfrac{1}{${a1}}$ as a single fraction $\\dfrac{p}{q}$.`,
    steps: [
      { instruction: `Combine over a common denominator: $${a0} + \\dfrac{1}{${a1}} = $ ? (Give as a fraction.)`, answer: `${p}/${q}`, accept: [`${a0 * a1 + 1}/${a1}`], hint: `$\\frac{${a0}\\cdot${a1} + 1}{${a1}}$.` },
    ],
    finalAnswer: { value: `${p}/${q}`, unit: "" },
    solutionNarrative: `$[${a0}; ${a1}] = ${a0} + \\frac{1}{${a1}} = \\frac{${p}}{${q}}$.`,
  };
};

// d2: evaluate a 3-term CF from the back.
fill["nt2-value-2"] = (rng, idx) => {
  const a0 = rng.int(1, 3), a1 = rng.int(1, 3), a2 = rng.int(2, 4);
  const { p, q } = buildRationalFromTerms([a0, a1, a2]);
  const inner = buildRationalFromTerms([a1, a2]); // a1 + 1/a2
  return {
    id: `gen.nt2-value-2.${idx}`, generated: true, concepts: ["value-of-a-cf"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $[${a0}; ${a1}, ${a2}]$ back to a fraction $\\dfrac{p}{q}$, working from the innermost term outward.`,
    steps: [
      { instruction: `Innermost: $${a1} + \\dfrac{1}{${a2}} = $ ? (fraction)`, answer: `${inner.p}/${inner.q}`, accept: [`${a1 * a2 + 1}/${a2}`], hint: `$\\frac{${a1}\\cdot${a2}+1}{${a2}}$.` },
      { instruction: `Now $${a0} + \\dfrac{1}{${inner.p}/${inner.q}} = ${a0} + \\dfrac{${inner.q}}{${inner.p}} = $ ? (fraction)`, answer: `${p}/${q}`, accept: [], hint: `Invert $\\frac{${inner.p}}{${inner.q}}$ then add $${a0}$.` },
    ],
    finalAnswer: { value: `${p}/${q}`, unit: "" },
    solutionNarrative: `From the back: $${a1} + \\frac{1}{${a2}} = \\frac{${inner.p}}{${inner.q}}$, then $${a0} + \\frac{${inner.q}}{${inner.p}} = \\frac{${p}}{${q}}$.`,
  };
};

// d3: evaluate a 4-term CF from the back.
fill["nt2-value-3"] = (rng, idx) => {
  const a0 = rng.int(1, 2), a1 = rng.int(1, 3), a2 = rng.int(1, 3), a3 = rng.int(2, 4);
  const { p, q } = buildRationalFromTerms([a0, a1, a2, a3]);
  const inner2 = buildRationalFromTerms([a2, a3]); // a2 + 1/a3
  const inner1 = buildRationalFromTerms([a1, a2, a3]);
  return {
    id: `gen.nt2-value-3.${idx}`, generated: true, concepts: ["value-of-a-cf"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $[${a0}; ${a1}, ${a2}, ${a3}]$ to a single fraction $\\dfrac{p}{q}$, folding from the innermost term.`,
    steps: [
      { instruction: `Innermost: $${a2} + \\dfrac{1}{${a3}} = $ ? (fraction)`, answer: `${inner2.p}/${inner2.q}`, accept: [`${a2 * a3 + 1}/${a3}`], hint: `$\\frac{${a2}\\cdot${a3}+1}{${a3}}$.` },
      { instruction: `Next out: $${a1} + \\dfrac{${inner2.q}}{${inner2.p}} = $ ? (fraction)`, answer: `${inner1.p}/${inner1.q}`, accept: [], hint: `Invert $\\frac{${inner2.p}}{${inner2.q}}$ and add $${a1}$.` },
      { instruction: `Finally: $${a0} + \\dfrac{${inner1.q}}{${inner1.p}} = $ ? (fraction)`, answer: `${p}/${q}`, accept: [], hint: `Invert $\\frac{${inner1.p}}{${inner1.q}}$ and add $${a0}$.` },
    ],
    finalAnswer: { value: `${p}/${q}`, unit: "" },
    solutionNarrative: `Folding inward-out: $\\frac{${inner2.p}}{${inner2.q}} \\to \\frac{${inner1.p}}{${inner1.q}} \\to \\frac{${p}}{${q}}$, so $[${a0}; ${a1}, ${a2}, ${a3}] = \\frac{${p}}{${q}}$.`,
  };
};

// --- rational-approximation ---

// d1: use the first convergent as an approximation to a value.
fill["nt2-approx-1"] = (rng, idx) => {
  const a0 = rng.int(2, 4), a1 = rng.int(3, 7), a2 = rng.int(2, 4);
  const terms = [a0, a1, a2];
  const { ps, qs } = cfConvergents(terms);
  return {
    id: `gen.nt2-approx-1.${idx}`, generated: true, concepts: ["rational-approximation"], difficulty: 1, context: "abstract",
    prompt: `A value has continued fraction $[${a0}; ${a1}, ${a2}]$. Its FIRST convergent $\\dfrac{p_1}{q_1}$ is already a good rational approximation. Give it.`,
    steps: [
      { instruction: `Compute $\\dfrac{p_1}{q_1} = \\dfrac{${a1}\\cdot${a0}+1}{${a1}}$ as a fraction.`, answer: `${ps[1]}/${qs[1]}`, accept: [], hint: `$\\frac{${ps[1]}}{${qs[1]}}$.` },
    ],
    finalAnswer: { value: `${ps[1]}/${qs[1]}`, unit: "" },
    solutionNarrative: `The first convergent of $[${a0}; ${a1}, ${a2}]$ is $\\frac{${ps[1]}}{${qs[1]}}$ — a compact rational approximation to the full value.`,
  };
};

// d2: best rational approximation of a decimal value via early convergent + error.
fill["nt2-approx-2"] = (rng, idx) => {
  // Use a fixed set of famous approximations so the "value" is meaningful.
  const cases = [
    { name: "\\pi", terms: [3, 7], approx: [22, 7], val: Math.PI },
    { name: "\\pi", terms: [3, 7, 15], approx: [333, 106], val: Math.PI },
    { name: "e", terms: [2, 1, 2], approx: [8, 3], val: Math.E },
    { name: "\\sqrt{2}", terms: [1, 2, 2], approx: [7, 5], val: Math.SQRT2 },
  ];
  const c = rng.pick(cases);
  const { ps, qs } = cfConvergents(c.terms);
  const k = c.terms.length - 1;
  const num = ps[k], den = qs[k];
  return {
    id: `gen.nt2-approx-2.${idx}`, generated: true, concepts: ["rational-approximation"], difficulty: 2, context: "abstract",
    prompt: `The continued fraction of $${c.name}$ begins $[${c.terms[0]}; ${c.terms.slice(1).join(", ")}]$. Use the convergent from these terms as a rational approximation of $${c.name}$.`,
    steps: [
      { instruction: `Compute the convergent from the given terms as a fraction $\\dfrac{p}{q}$.`, answer: `${num}/${den}`, accept: [], hint: `Fold the terms with the convergent recurrence to get $\\frac{${num}}{${den}}$.` },
    ],
    finalAnswer: { value: `${num}/${den}`, unit: "" },
    solutionNarrative: `The convergent is $\\frac{${num}}{${den}} \\approx ${(num / den).toFixed(6)}$, close to $${c.name} \\approx ${c.val.toFixed(6)}$.`,
  };
};

// d3: convergent approximation of a rational plus the approximation error.
fill["nt2-approx-3"] = (rng, idx) => {
  // Build p/q with 3 terms; approximate by its 1st convergent, measure the error.
  const a0 = rng.int(1, 3), a1 = rng.int(2, 4), a2 = rng.int(2, 4);
  const terms = [a0, a1, a2];
  const { p, q } = buildRationalFromTerms(terms);
  const { ps, qs } = cfConvergents(terms);
  const cp = ps[1], cq = qs[1]; // 1st convergent
  // error = |p/q - cp/cq| = |p*cq - cp*q| / (q*cq)
  const errNum = Math.abs(p * cq - cp * q);
  const errDen = q * cq;
  return {
    id: `gen.nt2-approx-3.${idx}`, generated: true, concepts: ["rational-approximation"], difficulty: 3, context: "abstract",
    prompt: `The exact value is $\\dfrac{${p}}{${q}} = [${a0}; ${a1}, ${a2}]$. Approximate it by its first convergent $\\dfrac{${cp}}{${cq}}$, then find the approximation error.`,
    steps: [
      { instruction: `State the approximating convergent as a fraction.`, answer: `${cp}/${cq}`, accept: [], hint: `The $p_1/q_1$ convergent.` },
      { instruction: `The error is $\\left|\\dfrac{${p}}{${q}} - \\dfrac{${cp}}{${cq}}\\right| = \\dfrac{|${p}\\cdot${cq} - ${cp}\\cdot${q}|}{${q}\\cdot${cq}}$. Give it as a fraction $\\dfrac{${errNum}}{${errDen}}$.`, answer: `${errNum}/${errDen}`, accept: [], hint: `$\\frac{${errNum}}{${errDen}}$; convergent errors are always $\\frac{1}{q_k q_{k+1}}$-sized.` },
    ],
    finalAnswer: { value: `${errNum}/${errDen}`, unit: "" },
    solutionNarrative: `The first convergent $\\frac{${cp}}{${cq}}$ approximates $\\frac{${p}}{${q}}$ with error $\\frac{${errNum}}{${errDen}} \\approx ${(errNum / errDen).toFixed(5)}$.`,
  };
};
