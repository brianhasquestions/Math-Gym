// gen-crypto2-fill.js
// Parametric generators for the Cryptography public-key core topics:
//   content/cryptography/modular-exponentiation.json  (cr2-sqmul-*, cr2-fermat-*, cr2-totient-*, cr2-dh-*)
//   content/cryptography/rsa.json                     (cr2-keygen-*, cr2-encrypt-*, cr2-decrypt-*, cr2-whyworks-*)
// Self-contained: exports a `fill` map of template-name -> generator fn, matching
// the registry shape in js/generator.js (merged via Object.assign). Deterministic
// from the passed rng. All moduli stay < 10000 so plain Number square-and-multiply
// is exact (intermediate squares < 10^8, far below 2^53).

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const modpow = (b, e, n) => { let r = 1; b %= n; while (e > 0) { if (e & 1) r = (r * b) % n; b = (b * b) % n; e = Math.floor(e / 2); } return r; };
const modinv = (a, m) => { let [r0, r1] = [a % m, m], [s0, s1] = [1, 0]; while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; } return ((s0 % m) + m) % m; };

export const fill = {};

// ============================================================================
// modular-exponentiation.json — square-and-multiply
// ============================================================================

fill["cr2-sqmul-d1"] = (rng, idx) => {
  const p = rng.pick([11, 13, 17, 19]);
  const a = rng.int(2, p - 2);
  const s1 = modpow(a, 2, p), s2 = modpow(a, 4, p);
  return {
    id: `gen.cr2-sqmul-d1.${idx}`, generated: true, concepts: ["square-and-multiply"], difficulty: 1, context: "abstract",
    prompt: `Compute $${a}^4 \\bmod ${p}$ by repeated squaring — two squarings, reducing mod ${p} each time.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${s1}`, accept: [], hint: `$${a}^2 = ${a * a}$; subtract multiples of ${p}.` },
      { instruction: `Square the result: $${a}^4 \\equiv ${s1}^2 \\pmod{${p}}$. What is that?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${p}.` },
    ],
    finalAnswer: { value: `${s2}`, unit: "" },
    solutionNarrative: `$${a}^2 \\equiv ${s1}$ and $${a}^4 \\equiv ${s1}^2 \\equiv ${s2} \\pmod{${p}}$. Reducing after each squaring keeps the numbers small.`,
  };
};

fill["cr2-sqmul-d2"] = (rng, idx) => {
  const p = rng.pick([11, 13, 17, 19, 23]);
  const a = rng.int(2, Math.min(9, p - 2));
  const s1 = modpow(a, 2, p), s2 = modpow(a, 4, p), s3 = modpow(a, 8, p);
  return {
    id: `gen.cr2-sqmul-d2.${idx}`, generated: true, concepts: ["square-and-multiply"], difficulty: 2, context: "abstract",
    prompt: `Compute $${a}^8 \\bmod ${p}$ with three squarings, reducing mod ${p} after each.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${s1}`, accept: [], hint: `$${a}^2 = ${a * a}$; reduce mod ${p}.` },
      { instruction: `Square: $${a}^4 \\equiv ${s1}^2 \\pmod{${p}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${p}.` },
      { instruction: `Square once more: $${a}^8 \\equiv ${s2}^2 \\pmod{${p}}$. What is it?`, answer: `${s3}`, accept: [], hint: `$${s2}^2 = ${s2 * s2}$; reduce mod ${p}.` },
    ],
    finalAnswer: { value: `${s3}`, unit: "" },
    solutionNarrative: `Squaring chain mod ${p}: $${a}^2 \\equiv ${s1}$, $${a}^4 \\equiv ${s2}$, $${a}^8 \\equiv ${s3}$. Eight naive multiplications collapsed into three squarings.`,
  };
};

fill["cr2-sqmul-d3"] = (rng, idx) => {
  const p = rng.pick([17, 19, 23, 29]);
  const a = rng.int(2, 7);
  const e = rng.pick([11, 13]); // 11 = 8+2+1, 13 = 8+4+1
  const s1 = modpow(a, 2, p), s2 = modpow(a, 4, p), s3 = modpow(a, 8, p);
  const mid = e === 13 ? s2 : s1;
  const midPow = e === 13 ? 4 : 2;
  const ans = modpow(a, e, p);
  const decomp = e === 13 ? "8 + 4 + 1" : "8 + 2 + 1";
  return {
    id: `gen.cr2-sqmul-d3.${idx}`, generated: true, concepts: ["square-and-multiply"], difficulty: 3, context: "abstract",
    prompt: `Compute $${a}^{${e}} \\bmod ${p}$ by full square-and-multiply. Note $${e} = ${decomp}$, so $${a}^{${e}} = ${a}^{8} \\cdot ${a}^{${midPow}} \\cdot ${a}$.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${s1}`, accept: [], hint: `$${a}^2 = ${a * a}$; reduce mod ${p}.` },
      { instruction: `Square: $${a}^4 \\equiv ${s1}^2 \\pmod{${p}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${p}.` },
      { instruction: `Square again: $${a}^8 \\equiv ${s2}^2 \\pmod{${p}}$. What is it?`, answer: `${s3}`, accept: [], hint: `$${s2}^2 = ${s2 * s2}$; reduce mod ${p}.` },
      { instruction: `Combine: $${a}^{${e}} \\equiv ${s3} \\cdot ${mid} \\cdot ${a} \\pmod{${p}}$. What is the result?`, answer: `${ans}`, accept: [], hint: `Multiply step by step, reducing mod ${p} whenever the product grows: $${s3} \\cdot ${mid} = ${s3 * mid}$ first.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "" },
    solutionNarrative: `$${e} = ${decomp}$, so $${a}^{${e}} = ${a}^8 \\cdot ${a}^{${midPow}} \\cdot ${a} \\equiv ${s3} \\cdot ${mid} \\cdot ${a} \\equiv ${ans} \\pmod{${p}}$.`,
  };
};

// ============================================================================
// modular-exponentiation.json — Fermat's little theorem
// ============================================================================

fill["cr2-fermat-d1"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  const a = rng.int(2, p - 2);
  return {
    id: `gen.cr2-fermat-d1.${idx}`, generated: true, concepts: ["fermats-little-theorem"], difficulty: 1, context: "abstract",
    prompt: `Use Fermat's little theorem to evaluate $${a}^{${p - 1}} \\bmod ${p}$ without computing the power.`,
    steps: [
      { instruction: `Fermat: $a^{p-1} \\equiv 1 \\pmod p$ for prime $p$ with $p \\nmid a$. Here $p = ${p}$: what is $p - 1$?`, answer: `${p - 1}`, accept: [], hint: `Subtract 1 from the prime.` },
      { instruction: `The exponent is exactly $p - 1$, so what is $${a}^{${p - 1}} \\bmod ${p}$?`, answer: "1", accept: [], hint: `That's the theorem's whole promise: the answer is 1.` },
    ],
    finalAnswer: { value: "1", unit: "" },
    solutionNarrative: `${p} is prime and does not divide ${a}, so Fermat gives $${a}^{${p - 1}} \\equiv 1 \\pmod{${p}}$ instantly.`,
  };
};

fill["cr2-fermat-d2"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13]);
  const a = rng.int(2, Math.min(6, p - 2));
  const r = rng.int(2, 4);
  const k = rng.int(5, 12);
  const E = k * (p - 1) + r;
  const ans = modpow(a, r, p);
  return {
    id: `gen.cr2-fermat-d2.${idx}`, generated: true, concepts: ["fermats-little-theorem"], difficulty: 2, context: "abstract",
    prompt: `Evaluate $${a}^{${E}} \\bmod ${p}$ by reducing the EXPONENT first (Fermat), then computing a small power.`,
    steps: [
      { instruction: `Exponents reduce mod $p - 1 = ${p - 1}$. What is $${E} \\bmod ${p - 1}$?`, answer: `${r}`, accept: [], hint: `$${E} = ${k} \\times ${p - 1} + ${r}$.` },
      { instruction: `Now evaluate the small power: what is $${a}^{${r}} \\bmod ${p}$?`, answer: `${ans}`, accept: [], hint: `$${a}^{${r}} = ${Math.pow(a, r)}$; reduce mod ${p}.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "" },
    solutionNarrative: `$${E} \\equiv ${r} \\pmod{${p - 1}}$, so $${a}^{${E}} \\equiv ${a}^{${r}} \\equiv ${ans} \\pmod{${p}}$ — the giant exponent collapses via $a^{${p - 1}} \\equiv 1$.`,
  };
};

fill["cr2-fermat-d3"] = (rng, idx) => {
  const p = rng.pick([11, 13, 17]);
  const a = rng.int(2, 5);
  const r = rng.pick([5, 6, 7]); // needs only a^4, a^2, a factors
  const k = rng.int(50, 400);
  const E = k * (p - 1) + r;
  const s1 = modpow(a, 2, p), s2 = modpow(a, 4, p);
  const ans = modpow(a, r, p);
  const parts = r === 5 ? `${a}^4 \\cdot ${a}` : r === 6 ? `${a}^4 \\cdot ${a}^2` : `${a}^4 \\cdot ${a}^2 \\cdot ${a}`;
  const partVals = r === 5 ? `${s2} \\cdot ${a}` : r === 6 ? `${s2} \\cdot ${s1}` : `${s2} \\cdot ${s1} \\cdot ${a}`;
  return {
    id: `gen.cr2-fermat-d3.${idx}`, generated: true, concepts: ["fermats-little-theorem"], difficulty: 3, context: "abstract",
    prompt: `Evaluate $${a}^{${E}} \\bmod ${p}$: reduce the exponent with Fermat, then finish with square-and-multiply ($${r} = ${r === 5 ? "4 + 1" : r === 6 ? "4 + 2" : "4 + 2 + 1"}$).`,
    steps: [
      { instruction: `Reduce the exponent mod $p - 1 = ${p - 1}$: what is $${E} \\bmod ${p - 1}$?`, answer: `${r}`, accept: [], hint: `$${E} = ${k} \\times ${p - 1} + ${r}$.` },
      { instruction: `Build the squares: what is $${a}^2 \\bmod ${p}$?`, answer: `${s1}`, accept: [], hint: `$${a}^2 = ${a * a}$; reduce mod ${p}.` },
      { instruction: `Square: $${a}^4 \\equiv ${s1}^2 \\pmod{${p}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${p}.` },
      { instruction: `Combine: $${a}^{${r}} = ${parts} \\equiv ${partVals} \\pmod{${p}}$. What is the final answer?`, answer: `${ans}`, accept: [], hint: `Multiply the listed residues, reducing mod ${p} as you go.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "" },
    solutionNarrative: `$${E} \\equiv ${r} \\pmod{${p - 1}}$ by Fermat, and square-and-multiply gives $${a}^{${r}} \\equiv ${ans} \\pmod{${p}}$.`,
  };
};

// ============================================================================
// modular-exponentiation.json — Euler totient
// ============================================================================

fill["cr2-totient-d1"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17, 19]);
  const q = rng.pick([3, 5]);
  return {
    id: `gen.cr2-totient-d1.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 1, context: "abstract",
    prompt: `Compute the totients $\\varphi(${p})$, $\\varphi(${q})$, and $\\varphi(${p * q})$.`,
    steps: [
      { instruction: `${p} is prime. What is $\\varphi(${p})$?`, answer: `${p - 1}`, accept: [], hint: `For a prime $p$, $\\varphi(p) = p - 1$.` },
      { instruction: `${q} is prime. What is $\\varphi(${q})$?`, answer: `${q - 1}`, accept: [], hint: `Same rule: subtract 1.` },
      { instruction: `Now $${p * q} = ${p} \\times ${q}$. Using $\\varphi(pq) = (p-1)(q-1)$, what is $\\varphi(${p * q})$?`, answer: `${(p - 1) * (q - 1)}`, accept: [], hint: `$${p - 1} \\times ${q - 1}$.` },
    ],
    finalAnswer: { value: `${(p - 1) * (q - 1)}`, unit: "" },
    solutionNarrative: `$\\varphi(${p}) = ${p - 1}$, $\\varphi(${q}) = ${q - 1}$, and for the product of distinct primes $\\varphi(${p * q}) = ${p - 1} \\times ${q - 1} = ${(p - 1) * (q - 1)}$.`,
  };
};

fill["cr2-totient-d2"] = (rng, idx) => {
  const b = rng.pick([2, 3, 5]);
  const k = b === 5 ? 2 : rng.pick([2, 3]);
  const pk = Math.pow(b, k), pk1 = Math.pow(b, k - 1);
  return {
    id: `gen.cr2-totient-d2.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\varphi(${pk})$ using the prime-power formula $\\varphi(p^k) = p^k - p^{k-1}$, given $${pk} = ${b}^{${k}}$.`,
    steps: [
      { instruction: `What is $p^{k-1} = ${b}^{${k - 1}}$?`, answer: `${pk1}`, accept: [], hint: `One factor of ${b} fewer than ${pk}.` },
      { instruction: `Subtract: $\\varphi(${pk}) = ${pk} - ${pk1} = {?}$`, answer: `${pk - pk1}`, accept: [], hint: `Exactly the ${pk1} multiples of ${b} in $1..${pk}$ fail to be coprime.` },
    ],
    finalAnswer: { value: `${pk - pk1}`, unit: "" },
    solutionNarrative: `$\\varphi(${b}^{${k}}) = ${pk} - ${pk1} = ${pk - pk1}$: strike out the multiples of ${b} and count what survives.`,
  };
};

fill["cr2-totient-d3"] = (rng, idx) => {
  const pool = [
    { n: 15, p: 3, q: 5 }, { n: 21, p: 3, q: 7 }, { n: 33, p: 3, q: 11 }, { n: 35, p: 5, q: 7 },
  ];
  const { n, p, q } = rng.pick(pool);
  const phi = (p - 1) * (q - 1);
  let a = rng.int(2, 8);
  while (gcd(a, n) !== 1) a++;
  const r = rng.int(2, 4);
  const k = rng.int(3, 9);
  const E = k * phi + r;
  const ans = modpow(a, r, n);
  return {
    id: `gen.cr2-totient-d3.${idx}`, generated: true, concepts: ["euler-totient"], difficulty: 3, context: "abstract",
    prompt: `Use Euler's theorem to evaluate $${a}^{${E}} \\bmod ${n}$. (Here $\\gcd(${a}, ${n}) = 1$, so the theorem applies.)`,
    steps: [
      { instruction: `$${n} = ${p} \\times ${q}$. What is $\\varphi(${n})$?`, answer: `${phi}`, accept: [], hint: `$(${p} - 1)(${q} - 1) = ${p - 1} \\times ${q - 1}$.` },
      { instruction: `Euler: exponents reduce mod $\\varphi(${n}) = ${phi}$. What is $${E} \\bmod ${phi}$?`, answer: `${r}`, accept: [], hint: `$${E} = ${k} \\times ${phi} + ${r}$.` },
      { instruction: `Finish: what is $${a}^{${r}} \\bmod ${n}$?`, answer: `${ans}`, accept: [], hint: `$${a}^{${r}} = ${Math.pow(a, r)}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "" },
    solutionNarrative: `$\\varphi(${n}) = ${phi}$, the exponent reduces to ${r}, and $${a}^{${r}} \\equiv ${ans} \\pmod{${n}}$. Exponent-reduction mod $\\varphi(n)$ is exactly the move RSA is built on.`,
  };
};

// ============================================================================
// modular-exponentiation.json — Diffie–Hellman
// ============================================================================

const DH_POOL = [
  { p: 23, g: 5 }, { p: 17, g: 3 }, { p: 19, g: 2 }, { p: 13, g: 2 },
];

fill["cr2-dh-d1"] = (rng, idx) => {
  const { p, g } = rng.pick(DH_POOL);
  const a = rng.pick([3, 4]);
  const s1 = modpow(g, 2, p);
  const A = modpow(g, a, p);
  const secondStep = a === 4
    ? { instruction: `Square it: $A = ${g}^4 \\equiv ${s1}^2 \\pmod{${p}}$. What is Alice's public value $A$?`, answer: `${A}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${p}.` }
    : { instruction: `Multiply by $${g}$: $A = ${g}^3 \\equiv ${s1} \\cdot ${g} \\pmod{${p}}$. What is Alice's public value $A$?`, answer: `${A}`, accept: [], hint: `$${s1} \\cdot ${g} = ${s1 * g}$; reduce mod ${p}.` };
  return {
    id: `gen.cr2-dh-d1.${idx}`, generated: true, concepts: ["diffie-hellman"], difficulty: 1, context: "applied",
    prompt: `Diffie–Hellman with public parameters $p = ${p}$, $g = ${g}$. Alice's secret exponent is $a = ${a}$. Compute her public value $A = ${g}^{${a}} \\bmod ${p}$.`,
    steps: [
      { instruction: `Compute $${g}^2 \\bmod ${p}$.`, answer: `${s1}`, accept: [], hint: `$${g}^2 = ${g * g}$; reduce mod ${p}.` },
      secondStep,
    ],
    finalAnswer: { value: `${A}`, unit: "" },
    solutionNarrative: `$${g}^2 \\equiv ${s1} \\pmod{${p}}$, and $${g}^{${a}} \\equiv ${A} \\pmod{${p}}$. Alice sends $A = ${A}$ openly — recovering $a$ from it is a discrete log.`,
  };
};

fill["cr2-dh-d2"] = (rng, idx) => {
  const { p, g } = rng.pick(DH_POOL);
  const a = rng.int(3, 6);
  let b = rng.int(3, 6);
  if (b === a) b = b === 6 ? 3 : b + 1;
  const A = modpow(g, a, p);
  const B = modpow(g, b, p);
  const s = modpow(B, a, p);
  return {
    id: `gen.cr2-dh-d2.${idx}`, generated: true, concepts: ["diffie-hellman"], difficulty: 2, context: "applied",
    prompt: `A full Diffie–Hellman exchange with $p = ${p}$, $g = ${g}$. Alice's secret is $a = ${a}$; Bob's secret is $b = ${b}$. Compute both public values and the shared secret.`,
    steps: [
      { instruction: `Alice's public value: $A = ${g}^{${a}} \\bmod ${p}$. (Square-and-multiply: $${g}^2 \\equiv ${modpow(g, 2, p)}$, then keep going.)`, answer: `${A}`, accept: [], hint: `$${g}^4 \\equiv ${modpow(g, 4, p)} \\pmod{${p}}$; build $${g}^{${a}}$ from the squares.` },
      { instruction: `Bob's public value: $B = ${g}^{${b}} \\bmod ${p}$.`, answer: `${B}`, accept: [], hint: `Same squaring chain, exponent ${b}: $${g}^2 \\equiv ${modpow(g, 2, p)}$, $${g}^4 \\equiv ${modpow(g, 4, p)} \\pmod{${p}}$.` },
      { instruction: `Alice computes the shared secret $s = B^a = ${B}^{${a}} \\bmod ${p}$. What is $s$?`, answer: `${s}`, accept: [], hint: `$${B}^2 \\equiv ${modpow(B, 2, p)}$ and $${B}^4 \\equiv ${modpow(B, 4, p)} \\pmod{${p}}$; combine for exponent ${a}.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$A = ${A}$, $B = ${B}$, and both sides land on $s = g^{ab} = ${s} \\pmod{${p}}$ — Bob's check: $A^{${b}} = ${A}^{${b}} \\equiv ${modpow(A, b, p)}$.`,
  };
};

fill["cr2-dh-d3"] = (rng, idx) => {
  const { p, g } = rng.pick(DH_POOL);
  const a = rng.int(3, 5);
  const A = modpow(g, a, p);
  const steps = [];
  for (let k = 2; k <= a; k++) {
    const v = modpow(g, k, p);
    steps.push({
      instruction: `Try exponent ${k}: what is $${g}^{${k}} \\bmod ${p}$?`,
      answer: `${v}`, accept: [],
      hint: k === a ? `This one matches the intercepted $A = ${A}$.` : `Not $${A}$ yet — keep going.`,
    });
  }
  steps.push({ instruction: `So Alice's secret exponent $a$ is:`, answer: `${a}`, accept: [], hint: `The exponent whose power first matched $A = ${A}$.` });
  return {
    id: `gen.cr2-dh-d3.${idx}`, generated: true, concepts: ["diffie-hellman"], difficulty: 3, context: "applied",
    prompt: `You're the eavesdropper on a Diffie–Hellman exchange with $p = ${p}$, $g = ${g}$. You intercepted Alice's public value $A = ${A}$. Recover her secret exponent $a$ the only known way: brute-force the discrete log, one exponent at a time. ($${g}^1 = ${g}$ is not a match.)`,
    steps,
    finalAnswer: { value: `${a}`, unit: "" },
    solutionNarrative: `Successive powers of ${g} mod ${p} first hit $${A}$ at exponent ${a}, so $a = ${a}$. Forward exponentiation took two squarings; going backward meant checking every exponent — at 2048-bit sizes that brute force outlives the universe, and THAT asymmetry is the security.`,
  };
};

// ============================================================================
// rsa.json — key generation
// ============================================================================

fill["cr2-keygen-d1"] = (rng, idx) => {
  const pool = [
    { p: 3, q: 11, e: 3 }, { p: 5, q: 7, e: 5 }, { p: 3, q: 7, e: 5 }, { p: 5, q: 11, e: 3 },
  ];
  const { p, q, e } = rng.pick(pool);
  const n = p * q, phi = (p - 1) * (q - 1);
  return {
    id: `gen.cr2-keygen-d1.${idx}`, generated: true, concepts: ["rsa-keygen"], difficulty: 1, context: "applied",
    prompt: `Start building an RSA key from the primes $p = ${p}$ and $q = ${q}$, with proposed public exponent $e = ${e}$.`,
    steps: [
      { instruction: `Compute the public modulus $n = pq$.`, answer: `${n}`, accept: [], hint: `$${p} \\times ${q}$.` },
      { instruction: `Compute the secret $\\varphi(n) = (p-1)(q-1)$.`, answer: `${phi}`, accept: [], hint: `$${p - 1} \\times ${q - 1}$.` },
      { instruction: `Check $e = ${e}$ is valid: what is $\\gcd(${e}, ${phi})$?`, answer: "1", accept: [], hint: `List the prime factors of ${phi} — ${e} is not among them.` },
    ],
    finalAnswer: { value: "1", unit: "" },
    solutionNarrative: `$n = ${n}$, $\\varphi(n) = ${phi}$, and $\\gcd(${e}, ${phi}) = 1$, so $e = ${e}$ is a legal public exponent. (The private $d$ comes from the extended Euclidean algorithm next.)`,
  };
};

fill["cr2-keygen-d2"] = (rng, idx) => {
  const pool = [
    { p: 3, q: 11, e: 3 }, { p: 5, q: 11, e: 3 }, { p: 5, q: 7, e: 5 }, { p: 7, q: 11, e: 7 },
  ];
  const { p, q, e } = rng.pick(pool);
  const n = p * q, phi = (p - 1) * (q - 1);
  const d = modinv(e, phi);
  return {
    id: `gen.cr2-keygen-d2.${idx}`, generated: true, concepts: ["rsa-keygen"], difficulty: 2, context: "applied",
    prompt: `Generate a full RSA key from $p = ${p}$, $q = ${q}$ with public exponent $e = ${e}$ (already checked coprime), and verify it.`,
    steps: [
      { instruction: `Compute $n = pq$.`, answer: `${n}`, accept: [], hint: `$${p} \\times ${q}$.` },
      { instruction: `Compute $\\varphi(n) = (p-1)(q-1)$.`, answer: `${phi}`, accept: [], hint: `$${p - 1} \\times ${q - 1}$.` },
      { instruction: `Find the private exponent $d = ${e}^{-1} \\bmod ${phi}$: which $d$ makes $${e}d$ equal 1 more than a multiple of ${phi}?`, answer: `${d}`, accept: [], hint: `$${e} \\times ${d} = ${e * d} = ${(e * d - 1) / phi} \\times ${phi} + 1$.` },
      { instruction: `Verify: what is $${e} \\times ${d} \\bmod ${phi}$?`, answer: "1", accept: [], hint: `$${e * d} - ${e * d - 1} = 1$ after removing multiples of ${phi}.` },
    ],
    finalAnswer: { value: `${d}`, unit: "" },
    solutionNarrative: `$n = ${n}$, $\\varphi = ${phi}$, and $d = ${d}$ since $${e} \\cdot ${d} = ${e * d} \\equiv 1 \\pmod{${phi}}$. Public key $(${n}, ${e})$; private key $${d}$.`,
  };
};

fill["cr2-keygen-d3"] = (rng, idx) => {
  const pool = [
    { p: 11, q: 13, e: 7 }, { p: 7, q: 13, e: 5 }, { p: 7, q: 17, e: 5 }, { p: 11, q: 17, e: 3 },
  ];
  const { p, q, e } = rng.pick(pool);
  const n = p * q, phi = (p - 1) * (q - 1);
  const d = modinv(e, phi);
  return {
    id: `gen.cr2-keygen-d3.${idx}`, generated: true, concepts: ["rsa-keygen"], difficulty: 3, context: "applied",
    prompt: `Generate an RSA key at the top of our toy range: $p = ${p}$, $q = ${q}$, proposed $e = ${e}$. Work every stage as a number.`,
    steps: [
      { instruction: `Compute $n = pq$.`, answer: `${n}`, accept: [], hint: `$${p} \\times ${q}$.` },
      { instruction: `Compute $\\varphi(n) = (p-1)(q-1)$.`, answer: `${phi}`, accept: [], hint: `$${p - 1} \\times ${q - 1}$.` },
      { instruction: `Validity: what is $\\gcd(${e}, ${phi})$?`, answer: "1", accept: [], hint: `Factor ${phi} into primes — ${e} does not appear.` },
      { instruction: `Find $d = ${e}^{-1} \\bmod ${phi}$ (extended Euclid, or scan multiples of ${e} for one that is 1 more than a multiple of ${phi}).`, answer: `${d}`, accept: [], hint: `$${e} \\times ${d} = ${e * d} = ${(e * d - 1) / phi} \\times ${phi} + 1$.` },
      { instruction: `Confirm the key: what is $${e} \\times ${d} \\bmod ${phi}$?`, answer: "1", accept: [], hint: `$${e * d} = ${(e * d - 1) / phi} \\times ${phi} + 1$.` },
    ],
    finalAnswer: { value: `${d}`, unit: "" },
    solutionNarrative: `$n = ${n}$, $\\varphi = ${phi}$, $\\gcd(${e}, ${phi}) = 1$, and $d = ${d}$ because $${e} \\cdot ${d} = ${e * d} \\equiv 1 \\pmod{${phi}}$. Publish $(${n}, ${e})$; guard $${d}$.`,
  };
};

// ============================================================================
// rsa.json — encryption
// ============================================================================

fill["cr2-encrypt-d1"] = (rng, idx) => {
  const { n } = rng.pick([{ n: 33 }, { n: 55 }]); // e = 3 valid for both (phi 20, 40)
  const m = rng.int(2, 5);
  const s1 = (m * m) % n;
  const c = modpow(m, 3, n);
  return {
    id: `gen.cr2-encrypt-d1.${idx}`, generated: true, concepts: ["rsa-encrypt"], difficulty: 1, context: "applied",
    prompt: `Encrypt the message $m = ${m}$ with the RSA public key $(n, e) = (${n}, 3)$.`,
    steps: [
      { instruction: `Compute $m^2 \\bmod ${n}$: what is $${m}^2 \\bmod ${n}$?`, answer: `${s1}`, accept: [], hint: `$${m}^2 = ${m * m}$; reduce mod ${n} if needed.` },
      { instruction: `Multiply by $m$ once more: $c = ${m}^3 \\equiv ${s1} \\cdot ${m} \\pmod{${n}}$. What is the ciphertext $c$?`, answer: `${c}`, accept: [], hint: `$${s1} \\cdot ${m} = ${s1 * m}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `$c = ${m}^3 \\equiv ${c} \\pmod{${n}}$. Encryption used only public information — that's the point of a public key.`,
  };
};

fill["cr2-encrypt-d2"] = (rng, idx) => {
  const { n } = rng.pick([{ n: 35 }, { n: 65 }]); // e = 5 valid (phi 24, 48)
  const m = rng.int(2, 6);
  const s1 = modpow(m, 2, n), s2 = modpow(m, 4, n);
  const c = modpow(m, 5, n);
  return {
    id: `gen.cr2-encrypt-d2.${idx}`, generated: true, concepts: ["rsa-encrypt"], difficulty: 2, context: "applied",
    prompt: `Encrypt $m = ${m}$ with the public key $(n, e) = (${n}, 5)$ using square-and-multiply ($5 = 4 + 1$).`,
    steps: [
      { instruction: `Compute $${m}^2 \\bmod ${n}$.`, answer: `${s1}`, accept: [], hint: `$${m}^2 = ${m * m}$; reduce mod ${n}.` },
      { instruction: `Square: $${m}^4 \\equiv ${s1}^2 \\pmod{${n}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${n}.` },
      { instruction: `Combine: $c = ${m}^5 = ${m}^4 \\cdot ${m} \\equiv ${s2} \\cdot ${m} \\pmod{${n}}$. What is $c$?`, answer: `${c}`, accept: [], hint: `$${s2} \\cdot ${m} = ${s2 * m}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `Squares: $${m}^2 \\equiv ${s1}$, $${m}^4 \\equiv ${s2}$; then $c = ${s2} \\cdot ${m} \\equiv ${c} \\pmod{${n}}$.`,
  };
};

fill["cr2-encrypt-d3"] = (rng, idx) => {
  const { n } = rng.pick([{ n: 143 }, { n: 85 }, { n: 133 }]); // e = 7 valid (phi 120, 64, 108)
  const m = rng.int(2, 6);
  const s1 = modpow(m, 2, n), s2 = modpow(m, 4, n);
  const t = (s2 * s1) % n;
  const c = modpow(m, 7, n);
  return {
    id: `gen.cr2-encrypt-d3.${idx}`, generated: true, concepts: ["rsa-encrypt"], difficulty: 3, context: "applied",
    prompt: `Encrypt $m = ${m}$ with the public key $(n, e) = (${n}, 7)$ by full square-and-multiply ($7 = 4 + 2 + 1$).`,
    steps: [
      { instruction: `Compute $${m}^2 \\bmod ${n}$.`, answer: `${s1}`, accept: [], hint: `$${m}^2 = ${m * m}$; reduce mod ${n} if needed.` },
      { instruction: `Square: $${m}^4 \\equiv ${s1}^2 \\pmod{${n}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${n}.` },
      { instruction: `Combine the squares: $${m}^4 \\cdot ${m}^2 \\equiv ${s2} \\cdot ${s1} \\pmod{${n}}$. What is that?`, answer: `${t}`, accept: [], hint: `$${s2} \\cdot ${s1} = ${s2 * s1}$; reduce mod ${n}.` },
      { instruction: `Multiply by the last factor $${m}$: $c = ${t} \\cdot ${m} \\bmod ${n}$. What is the ciphertext $c$?`, answer: `${c}`, accept: [], hint: `$${t} \\cdot ${m} = ${t * m}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${c}`, unit: "" },
    solutionNarrative: `$${m}^7 = ${m}^4 \\cdot ${m}^2 \\cdot ${m} \\equiv ${s2} \\cdot ${s1} \\cdot ${m} \\equiv ${c} \\pmod{${n}}$. Ciphertext $c = ${c}$.`,
  };
};

// ============================================================================
// rsa.json — decryption (keys chosen so d is small: 3, 5, or 7)
// ============================================================================

const pickMessage = (rng, n, e) => {
  // avoid fixed points (c == m) so decryption feels like decryption
  let m = rng.int(2, 6);
  for (let tries = 0; tries < 8 && modpow(m, e, n) === m; tries++) m = (m % 6) + 2;
  return m;
};

fill["cr2-decrypt-d1"] = (rng, idx) => {
  const { n, phi } = rng.pick([{ n: 33, phi: 20 }, { n: 55, phi: 40 }]);
  const d = 3, e = modinv(d, phi);
  const m = pickMessage(rng, n, e);
  const c = modpow(m, e, n);
  const s1 = modpow(c, 2, n);
  return {
    id: `gen.cr2-decrypt-d1.${idx}`, generated: true, concepts: ["rsa-decrypt"], difficulty: 1, context: "applied",
    prompt: `Your RSA private key for $n = ${n}$ is $d = 3$. The ciphertext $c = ${c}$ arrives. Decrypt it: $m = ${c}^3 \\bmod ${n}$.`,
    steps: [
      { instruction: `Compute $c^2 \\bmod ${n}$: what is $${c}^2 \\bmod ${n}$?`, answer: `${s1}`, accept: [], hint: `$${c}^2 = ${c * c}$; subtract multiples of ${n}.` },
      { instruction: `Multiply by $c$: $m = ${c}^3 \\equiv ${s1} \\cdot ${c} \\pmod{${n}}$. What is the message $m$?`, answer: `${m}`, accept: [], hint: `$${s1} \\cdot ${c} = ${s1 * c}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$m = ${c}^3 \\equiv ${m} \\pmod{${n}}$. (The sender encrypted $m = ${m}$ with the matching public exponent $e = ${e}$ — the round trip closes because $3 \\cdot ${e} \\equiv 1 \\pmod{${phi}}$.)`,
  };
};

fill["cr2-decrypt-d2"] = (rng, idx) => {
  const { n, phi } = rng.pick([{ n: 35, phi: 24 }, { n: 85, phi: 64 }]);
  const d = 5, e = modinv(d, phi);
  const m = pickMessage(rng, n, e);
  const c = modpow(m, e, n);
  const s1 = modpow(c, 2, n), s2 = modpow(c, 4, n);
  return {
    id: `gen.cr2-decrypt-d2.${idx}`, generated: true, concepts: ["rsa-decrypt"], difficulty: 2, context: "applied",
    prompt: `Your private key for $n = ${n}$ is $d = 5$. The ciphertext $c = ${c}$ arrives. Decrypt with square-and-multiply: $m = ${c}^5 \\bmod ${n}$, where $5 = 4 + 1$.`,
    steps: [
      { instruction: `Compute $${c}^2 \\bmod ${n}$.`, answer: `${s1}`, accept: [], hint: `$${c}^2 = ${c * c}$; reduce mod ${n}.` },
      { instruction: `Square: $${c}^4 \\equiv ${s1}^2 \\pmod{${n}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${n}.` },
      { instruction: `Combine: $m = ${c}^5 = ${c}^4 \\cdot ${c} \\equiv ${s2} \\cdot ${c} \\pmod{${n}}$. What is the message $m$?`, answer: `${m}`, accept: [], hint: `$${s2} \\cdot ${c} = ${s2 * c}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$${c}^2 \\equiv ${s1}$, $${c}^4 \\equiv ${s2}$, and $${s2} \\cdot ${c} \\equiv ${m} \\pmod{${n}}$: the message was $m = ${m}$, exactly what the sender encrypted with $e = ${e}$.`,
  };
};

fill["cr2-decrypt-d3"] = (rng, idx) => {
  const { n, phi } = rng.pick([{ n: 33, phi: 20 }, { n: 65, phi: 48 }]);
  const d = 7, e = modinv(d, phi);
  const m = pickMessage(rng, n, e);
  const c = modpow(m, e, n);
  const s1 = modpow(c, 2, n), s2 = modpow(c, 4, n);
  const t = (s2 * s1) % n;
  return {
    id: `gen.cr2-decrypt-d3.${idx}`, generated: true, concepts: ["rsa-decrypt"], difficulty: 3, context: "applied",
    prompt: `Your private key for $n = ${n}$ is $d = 7$. The ciphertext $c = ${c}$ arrives (sent with the matching public exponent $e = ${e}$). Decrypt by full square-and-multiply: $m = ${c}^7 \\bmod ${n}$, with $7 = 4 + 2 + 1$.`,
    steps: [
      { instruction: `Compute $${c}^2 \\bmod ${n}$.`, answer: `${s1}`, accept: [], hint: `$${c}^2 = ${c * c}$; subtract multiples of ${n}.` },
      { instruction: `Square: $${c}^4 \\equiv ${s1}^2 \\pmod{${n}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${n}.` },
      { instruction: `Combine the squares: $${c}^4 \\cdot ${c}^2 \\equiv ${s2} \\cdot ${s1} \\pmod{${n}}$. What is that?`, answer: `${t}`, accept: [], hint: `$${s2} \\cdot ${s1} = ${s2 * s1}$; reduce mod ${n}.` },
      { instruction: `Final multiply: $m = ${t} \\cdot ${c} \\bmod ${n}$. What message comes out?`, answer: `${m}`, accept: [], hint: `$${t} \\cdot ${c} = ${t * c}$; reduce mod ${n}.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `$${c}^7 = ${c}^4 \\cdot ${c}^2 \\cdot ${c} \\equiv ${s2} \\cdot ${s1} \\cdot ${c} \\equiv ${m} \\pmod{${n}}$. The original $m = ${m}$ returns because $${e} \\cdot 7 \\equiv 1 \\pmod{${phi}}$.`,
  };
};

// ============================================================================
// rsa.json — why RSA works / how it breaks
// ============================================================================

fill["cr2-whyworks-d1"] = (rng, idx) => {
  const pool = [
    { phi: 20, e: 3, d: 7 }, { phi: 24, e: 5, d: 5 }, { phi: 40, e: 3, d: 27 }, { phi: 60, e: 7, d: 43 }, { phi: 48, e: 7, d: 7 },
  ];
  const { phi, e, d } = rng.pick(pool);
  return {
    id: `gen.cr2-whyworks-d1.${idx}`, generated: true, concepts: ["why-rsa-works"], difficulty: 1, context: "abstract",
    prompt: `A key pair claims $e = ${e}$, $d = ${d}$ for $\\varphi(n) = ${phi}$. Verify the defining RSA property $ed \\equiv 1 \\pmod{\\varphi(n)}$.`,
    steps: [
      { instruction: `Compute the product $e \\cdot d = ${e} \\times ${d}$.`, answer: `${e * d}`, accept: [], hint: `Just multiply.` },
      { instruction: `Reduce: what is $${e * d} \\bmod ${phi}$?`, answer: "1", accept: [], hint: `$${e * d} = ${(e * d - 1) / phi} \\times ${phi} + 1$.` },
    ],
    finalAnswer: { value: "1", unit: "" },
    solutionNarrative: `$${e} \\cdot ${d} = ${e * d} \\equiv 1 \\pmod{${phi}}$ — so $m^{ed} = m^{k\\varphi + 1} \\equiv m$ by Euler's theorem, and decryption is guaranteed to undo encryption.`,
  };
};

fill["cr2-whyworks-d2"] = (rng, idx) => {
  const n = 35, e = 5, d = 5, phi = 24; // 5*5 = 25 ≡ 1 (mod 24)
  const m = pickMessage(rng, n, e);
  const c = modpow(m, e, n);
  const s1 = modpow(c, 2, n), s2 = modpow(c, 4, n);
  return {
    id: `gen.cr2-whyworks-d2.${idx}`, generated: true, concepts: ["why-rsa-works"], difficulty: 2, context: "applied",
    prompt: `Prove decrypt-of-encrypt returns the message, on a concrete case. Key: $n = ${n}$, $e = ${e}$, $d = ${d}$ (valid since $\\varphi(${n}) = ${phi}$ and $${e} \\cdot ${d} = 25 \\equiv 1 \\bmod ${phi}$). Encrypt $m = ${m}$, then decrypt.`,
    steps: [
      { instruction: `Encrypt: $c = ${m}^{${e}} \\bmod ${n}$. What is $c$? (Squares: $${m}^2 \\equiv ${modpow(m, 2, n)}$, $${m}^4 \\equiv ${modpow(m, 4, n)} \\pmod{${n}}$.)`, answer: `${c}`, accept: [], hint: `$c = ${m}^4 \\cdot ${m} \\equiv ${modpow(m, 4, n)} \\cdot ${m} \\pmod{${n}}$.` },
      { instruction: `Begin decrypting: compute $${c}^2 \\bmod ${n}$.`, answer: `${s1}`, accept: [], hint: `$${c}^2 = ${c * c}$; reduce mod ${n}.` },
      { instruction: `Square: $${c}^4 \\equiv ${s1}^2 \\pmod{${n}}$. What is it?`, answer: `${s2}`, accept: [], hint: `$${s1}^2 = ${s1 * s1}$; reduce mod ${n}.` },
      { instruction: `Combine: $${c}^{${d}} = ${c}^4 \\cdot ${c} \\equiv ${s2} \\cdot ${c} \\pmod{${n}}$. What comes out?`, answer: `${m}`, accept: [], hint: `$${s2} \\cdot ${c} = ${s2 * c}$; reduce mod ${n} — it should be the message you started with.` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `Encrypt: $${m}^{${e}} \\equiv ${c}$. Decrypt: $${c}^{${d}} \\equiv ${m} \\pmod{${n}}$ — the original returns, because $m^{25} = (m^{24}) \\cdot m \\equiv m$ by Euler.`,
  };
};

fill["cr2-whyworks-d3"] = (rng, idx) => {
  const pool = [
    { n: 91, p: 7, q: 13, e: 5 }, { n: 77, p: 7, q: 11, e: 7 }, { n: 143, p: 11, q: 13, e: 7 }, { n: 65, p: 5, q: 13, e: 11 },
  ];
  const { n, p, q, e } = rng.pick(pool);
  const phi = (p - 1) * (q - 1);
  const d = modinv(e, phi);
  return {
    id: `gen.cr2-whyworks-d3.${idx}`, generated: true, concepts: ["why-rsa-works"], difficulty: 3, context: "applied",
    prompt: `Play the attacker. An RSA public key is $(n, e) = (${n}, ${e})$. Factor the modulus and recover the private key — the attack that 2048-bit keys exist to prevent.`,
    steps: [
      { instruction: `Factor $n = ${n}$: what is its smaller prime factor?`, answer: `${p}`, accept: [], hint: `Trial-divide by small primes in order.` },
      { instruction: `What is the other prime factor?`, answer: `${q}`, accept: [], hint: `$${n} / ${p}$.` },
      { instruction: `Compute the 'secret' $\\varphi(${n}) = (${p}-1)(${q}-1)$.`, answer: `${phi}`, accept: [], hint: `$${p - 1} \\times ${q - 1}$.` },
      { instruction: `Recover the private key: find $d = ${e}^{-1} \\bmod ${phi}$.`, answer: `${d}`, accept: [], hint: `$${e} \\times ${d} = ${e * d} = ${(e * d - 1) / phi} \\times ${phi} + 1$.` },
    ],
    finalAnswer: { value: `${d}`, unit: "" },
    solutionNarrative: `$${n} = ${p} \\times ${q}$, so $\\varphi = ${phi}$ and $d = ${d}$. Factoring $n$ handed over the private key in four steps — RSA's entire security is that nobody can do this to a 2048-bit modulus.`,
  };
};
