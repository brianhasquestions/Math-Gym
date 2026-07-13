// gen-nt3-fill.js
// Parametric generators for number-theory.orders-and-primitive-roots.
// One template per (concept, difficulty) tier — 12 total. Self-contained pack:
// no imports; exports a `fill` map of template-name -> generator fn, matching
// the pack pattern of gen-nt2-fill.js. Every answer is computed in-pack from
// the SAME numbers shown in the prompt (orders, totients, and powers are all
// recomputed by the helpers below — nothing hardcoded). Moduli stay <= 50 so
// everything is hand-computable.

// ---------------------------------------------------------------------------
// Number-theory helpers (all in-pack, small inputs)
// ---------------------------------------------------------------------------
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };

const factorize = (n) => {
  const f = new Map();
  let m = n;
  for (let p = 2; p * p <= m; p++) {
    while (m % p === 0) { f.set(p, (f.get(p) || 0) + 1); m /= p; }
  }
  if (m > 1) f.set(m, (f.get(m) || 0) + 1);
  return f;
};

const totient = (n) => {
  let result = 1;
  for (const [p, e] of factorize(n)) result *= (p - 1) * p ** (e - 1);
  return result;
};

const numDivisors = (n) => {
  let d = 1;
  for (const [, e] of factorize(n)) d *= (e + 1);
  return d;
};

const divisorsOf = (n) => {
  const ds = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) ds.push(d);
  return ds;
};

const powMod = (base, exp, mod) => {
  let r = 1; base %= mod;
  while (exp > 0) {
    if (exp & 1) r = (r * base) % mod;
    base = (base * base) % mod;
    exp >>= 1;
  }
  return r;
};

// Multiplicative order of a mod n; requires gcd(a, n) = 1.
const ordOf = (a, n) => {
  let x = a % n, k = 1;
  while (x !== 1) { x = (x * a) % n; k++; if (k > n) return 0; /* unreachable for units */ }
  return k;
};

// Does n have a primitive root? (brute force: any unit of order phi(n))
const hasPrimitiveRoot = (n) => {
  const phi = totient(n);
  for (let a = 1; a < n; a++) if (gcd(a, n) === 1 && ordOf(a, n) === phi) return true;
  return false;
};

// First few powers of a mod n as a display string "a, a^2, ..." up to count.
const powerList = (a, n, count) => {
  const vals = [];
  let x = 1;
  for (let i = 1; i <= count; i++) { x = (x * a) % n; vals.push(x); }
  return vals;
};

// ===========================================================================
export const fill = {};

// ===========================================================================
// concept: multiplicative-order
// ===========================================================================

// d1: small prime modulus, base of small order — walk the powers to 1.
fill["nt3-order-1"] = (rng, idx) => {
  // (p, a) pairs chosen so the order is <= 5 (hand-walkable). Order is COMPUTED.
  const [p, a] = rng.pick([[7, 2], [7, 4], [5, 4], [11, 10], [13, 5], [13, 8], [11, 3], [13, 3]]);
  const k = ordOf(a, p);
  const sq = (a * a) % p;
  const powers = powerList(a, p, k);
  return {
    id: `gen.nt3-order-1.${idx}`, generated: true, concepts: ["multiplicative-order"], difficulty: 1, context: "abstract",
    prompt: `Find the multiplicative order of $${a}$ mod $${p}$ — the smallest $k \\geq 1$ with $${a}^k \\equiv 1 \\pmod{${p}}$.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${sq}`, accept: [], hint: `$${a * a} \\bmod ${p}$.` },
      { instruction: `Keep multiplying by $${a}$ and reducing until you hit $1$. What is $\\mathrm{ord}_{${p}}(${a})$?`, answer: `${k}`, accept: [`k=${k}`], hint: `The powers run $${powers.join(", ")}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `The powers of $${a}$ mod $${p}$ run $${powers.join(", ")}$ — the first return to $1$ is at exponent $${k}$, so $\\mathrm{ord}_{${p}}(${a}) = ${k}$.`,
  };
};

// d2: composite modulus — phi first, then the order.
fill["nt3-order-2"] = (rng, idx) => {
  const n = rng.pick([9, 10, 14, 15]);
  let a;
  do { a = rng.int(2, n - 2); } while (gcd(a, n) !== 1);
  const phi = totient(n);
  const k = ordOf(a, n);
  const sq = (a * a) % n;
  const powers = powerList(a, n, k);
  return {
    id: `gen.nt3-order-2.${idx}`, generated: true, concepts: ["multiplicative-order"], difficulty: 2, context: "abstract",
    prompt: `Find $\\mathrm{ord}_{${n}}(${a})$. (Note $\\gcd(${a}, ${n}) = 1$, so the order exists.)`,
    steps: [
      { instruction: `Compute $\\varphi(${n})$ — the order must divide it.`, answer: `${phi}`, accept: [], hint: `Count the integers in $1..${n}$ coprime to $${n}$, or use the product formula.` },
      { instruction: `Compute $${a}^2 \\bmod ${n}$.`, answer: `${sq}`, accept: [], hint: `$${a * a} \\bmod ${n}$.` },
      { instruction: `Continue the powers until $1$ appears. What is $\\mathrm{ord}_{${n}}(${a})$?`, answer: `${k}`, accept: [`k=${k}`], hint: `The powers run $${powers.join(", ")}$ — and $${k}$ divides $\\varphi(${n}) = ${phi}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$\\varphi(${n}) = ${phi}$ and the powers of $${a}$ mod $${n}$ run $${powers.join(", ")}$, so $\\mathrm{ord}_{${n}}(${a}) = ${k}$ — a divisor of $${phi}$, as Lagrange requires.`,
  };
};

// d3: the gcd guard — one base without an order, one with.
fill["nt3-order-3"] = (rng, idx) => {
  const n = rng.pick([12, 15, 16, 18, 20]);
  let bad;
  do { bad = rng.int(2, n - 2); } while (gcd(bad, n) === 1);
  let good;
  do { good = rng.int(2, n - 2); } while (gcd(good, n) !== 1);
  const g = gcd(bad, n);
  const k = ordOf(good, n);
  const powers = powerList(good, n, k);
  return {
    id: `gen.nt3-order-3.${idx}`, generated: true, concepts: ["multiplicative-order"], difficulty: 3, context: "abstract",
    prompt: `Working mod $${n}$: decide which of $${bad}$ and $${good}$ has a multiplicative order, and find the order that exists.`,
    steps: [
      { instruction: `Compute $\\gcd(${bad}, ${n})$.`, answer: `${g}`, accept: [], hint: `Run the Euclidean algorithm on $(${bad}, ${n})$.` },
      { instruction: `Can $${bad}^k \\equiv 1 \\pmod{${n}}$ for some $k \\geq 1$? (yes/no)`, answer: "no", accept: ["n"], hint: `Every power of $${bad}$ keeps the common factor $${g}$; numbers $\\equiv 1$ mod $${n}$ are coprime to $${n}$.` },
      { instruction: `Now the unit: $\\gcd(${good}, ${n}) = 1$. Compute $\\mathrm{ord}_{${n}}(${good})$.`, answer: `${k}`, accept: [`k=${k}`], hint: `The powers run $${powers.join(", ")}$.` },
    ],
    finalAnswer: { value: `ord_${n}(${bad}) undefined; ord_${n}(${good}) = ${k}`, unit: "" },
    solutionNarrative: `$\\gcd(${bad}, ${n}) = ${g} > 1$, so $${bad}$ has no order mod $${n}$. For the unit $${good}$, the powers run $${powers.join(", ")}$, giving $\\mathrm{ord}_{${n}}(${good}) = ${k}$.`,
  };
};

// ===========================================================================
// concept: order-divides-phi
// ===========================================================================

// d1: phi(p) and its divisors = the only candidate orders.
fill["nt3-orddiv-1"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17, 19]);
  const phi = p - 1;
  const nd = numDivisors(phi);
  const ds = divisorsOf(phi);
  // a non-divisor of phi in range 2..phi-1, computed (exists for all picks)
  let nonDiv = 4;
  for (let c = 2; c < phi; c++) if (phi % c !== 0) { nonDiv = c; break; }
  return {
    id: `gen.nt3-orddiv-1.${idx}`, generated: true, concepts: ["order-divides-phi"], difficulty: 1, context: "abstract",
    prompt: `Orders mod $${p}$ can only be divisors of $\\varphi(${p})$ (Lagrange). List the possibilities.`,
    steps: [
      { instruction: `Compute $\\varphi(${p})$.`, answer: `${phi}`, accept: [], hint: `$${p}$ is prime, so $\\varphi(${p}) = ${p} - 1$.` },
      { instruction: `How many divisors does $${phi}$ have? (These are the only possible orders.)`, answer: `${nd}`, accept: [], hint: `The divisors are $${ds.join(", ")}$.` },
      { instruction: `Can any element mod $${p}$ have order $${nonDiv}$? (yes/no)`, answer: "no", accept: ["n"], hint: `$${nonDiv}$ does not divide $${phi}$.` },
    ],
    finalAnswer: { value: `${nd} possible orders: ${ds.join(", ")}`, unit: "" },
    solutionNarrative: `$\\varphi(${p}) = ${phi}$ has $${nd}$ divisors ($${ds.join(", ")}$) — the only possible orders. $${nonDiv} \\nmid ${phi}$, so order $${nonDiv}$ is impossible.`,
  };
};

// d2: compute an order, then verify the Lagrange quotient is an integer.
fill["nt3-orddiv-2"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13]);
  let a;
  do { a = rng.int(2, p - 2); } while (ordOf(a, p) < 2);
  const phi = p - 1;
  const k = ordOf(a, p);
  const q = phi / k;
  const powers = powerList(a, p, k);
  return {
    id: `gen.nt3-orddiv-2.${idx}`, generated: true, concepts: ["order-divides-phi"], difficulty: 2, context: "abstract",
    prompt: `Compute $\\mathrm{ord}_{${p}}(${a})$ and verify Lagrange: the order divides $\\varphi(${p})$.`,
    steps: [
      { instruction: `Compute $\\varphi(${p})$.`, answer: `${phi}`, accept: [], hint: `$${p}$ is prime.` },
      { instruction: `Find $\\mathrm{ord}_{${p}}(${a})$ by listing powers until $1$ appears.`, answer: `${k}`, accept: [`k=${k}`], hint: `The powers run $${powers.join(", ")}$.` },
      { instruction: `Lagrange check: $\\varphi(${p}) / \\mathrm{ord}_{${p}}(${a}) = ${phi} / ${k} = $ ? (It must be a whole number.)`, answer: `${q}`, accept: [], hint: `If it were not whole, Lagrange's theorem would be violated.` },
    ],
    finalAnswer: { value: `ord = ${k}, and ${phi}/${k} = ${q}`, unit: "" },
    solutionNarrative: `The powers of $${a}$ mod $${p}$ run $${powers.join(", ")}$, so the order is $${k}$; indeed $${k} \\mid ${phi}$ with quotient $${q}$.`,
  };
};

// d3: the a^2 ≡ -1 trick — order exactly 4, plus the Lagrange quotient.
fill["nt3-orddiv-3"] = (rng, idx) => {
  // primes p ≡ 1 (mod 4) and an a <= p/2 with a^2 ≡ -1, found by search.
  const p = rng.pick([13, 17, 29, 37, 41]);
  const roots = [];
  for (let x = 2; x <= (p - 1) / 2; x++) if ((x * x) % p === p - 1) roots.push(x);
  const a = rng.pick(roots);
  const k = ordOf(a, p); // always 4 — computed, not assumed
  const q = (p - 1) / k;
  return {
    id: `gen.nt3-orddiv-3.${idx}`, generated: true, concepts: ["order-divides-phi"], difficulty: 3, context: "abstract",
    prompt: `Find $\\mathrm{ord}_{${p}}(${a})$ using successive squaring and the divisor rule.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${(a * a) % p}`, accept: ["-1"], hint: `$${a * a} = ${Math.floor((a * a) / p)} \\cdot ${p} + ${(a * a) % p}$; note the value is $\\equiv -1$.` },
      { instruction: `Square that: $${a}^4 \\bmod ${p} = $ ?`, answer: `${powMod(a, 4, p)}`, accept: [], hint: `$(-1)^2 = 1$.` },
      { instruction: `Since $${a}^1, ${a}^2 \\not\\equiv 1$, what is $\\mathrm{ord}_{${p}}(${a})$?`, answer: `${k}`, accept: [], hint: `$a^2 \\equiv -1$ always forces order exactly $4$.` },
      { instruction: `Lagrange check: $\\varphi(${p}) / ${k} = ${p - 1} / ${k} = $ ?`, answer: `${q}`, accept: [], hint: `$${p}$ is prime, so $\\varphi(${p}) = ${p - 1}$.` },
    ],
    finalAnswer: { value: `${k}`, unit: "" },
    solutionNarrative: `$${a}^2 \\equiv -1 \\pmod{${p}}$ forces $${a}^4 \\equiv 1$ and rules out orders $1$ and $2$, so $\\mathrm{ord}_{${p}}(${a}) = 4$, which divides $\\varphi(${p}) = ${p - 1}$ with quotient $${q}$.`,
  };
};

// ===========================================================================
// concept: primitive-roots
// ===========================================================================

// d1: count the primitive roots of a prime: phi(phi(p)).
fill["nt3-proot-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13, 19, 23]);
  const phi = p - 1;
  const count = totient(phi);
  return {
    id: `gen.nt3-proot-1.${idx}`, generated: true, concepts: ["primitive-roots"], difficulty: 1, context: "abstract",
    prompt: `How many primitive roots does the prime $${p}$ have?`,
    steps: [
      { instruction: `Compute $\\varphi(${p})$ — the order a primitive root must have.`, answer: `${phi}`, accept: [], hint: `$${p} - 1$.` },
      { instruction: `The count of primitive roots is $\\varphi(\\varphi(${p})) = \\varphi(${phi}) = $ ?`, answer: `${count}`, accept: [], hint: `Factor $${phi}$ and apply the totient product formula.` },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: `A prime $p$ has $\\varphi(p-1)$ primitive roots; here $\\varphi(${phi}) = ${count}$.`,
  };
};

// d2: safe primes p = 2q+1 — test whether a is a primitive root with two powers.
fill["nt3-proot-2"] = (rng, idx) => {
  const p = rng.pick([7, 11]); // p - 1 = 2q with q prime: orders are 1, 2, q, 2q
  const q = (p - 1) / 2;
  let a;
  do { a = rng.int(2, p - 2); } while (false);
  const sq = (a * a) % p;
  const half = powMod(a, q, p);
  const isPR = ordOf(a, p) === p - 1;
  return {
    id: `gen.nt3-proot-2.${idx}`, generated: true, concepts: ["primitive-roots"], difficulty: 2, context: "abstract",
    prompt: `Is $${a}$ a primitive root mod $${p}$? Since $\\varphi(${p}) = ${p - 1} = 2 \\cdot ${q}$, the only possible orders are $1, 2, ${q}, ${p - 1}$ — so it suffices to check $${a}^2$ and $${a}^{${q}}$.`,
    steps: [
      { instruction: `Compute $${a}^2 \\bmod ${p}$.`, answer: `${sq}`, accept: [], hint: `$${a * a} \\bmod ${p}$.` },
      { instruction: `Compute $${a}^{${q}} \\bmod ${p}$.`, answer: `${half}`, accept: half === p - 1 ? ["-1"] : [], hint: `Use $${a}^2$ from the last step and keep multiplying by $${a}$, reducing mod $${p}$.` },
      { instruction: `The order is $${p - 1}$ exactly when NEITHER of those powers is $1$. Is $${a}$ a primitive root mod $${p}$? (yes/no)`, answer: isPR ? "yes" : "no", accept: isPR ? ["y"] : ["n"], hint: `Order candidates were $1, 2, ${q}, ${p - 1}$.` },
    ],
    finalAnswer: { value: isPR ? "yes" : "no", unit: "" },
    solutionNarrative: isPR
      ? `$${a}^2 \\equiv ${sq}$ and $${a}^{${q}} \\equiv ${half}$, neither of which is $1$, so no proper divisor of $${p - 1}$ is the order: $\\mathrm{ord}_{${p}}(${a}) = ${p - 1}$ and $${a}$ IS a primitive root.`
      : `One of the proper-divisor powers hit $1$ ($${a}^2 \\equiv ${sq}$, $${a}^{${q}} \\equiv ${half}$), so the order is smaller than $${p - 1}$: $${a}$ is NOT a primitive root.`,
  };
};

// d3: does n have a primitive root at all, and how many?
fill["nt3-proot-3"] = (rng, idx) => {
  const n = rng.pick([8, 9, 10, 12, 14, 15, 18, 22, 25, 27]);
  const phi = totient(n);
  const exists = hasPrimitiveRoot(n);
  const count = exists ? totient(phi) : 0;
  return {
    id: `gen.nt3-proot-3.${idx}`, generated: true, concepts: ["primitive-roots"], difficulty: 3, context: "abstract",
    prompt: `Does $${n}$ have a primitive root? Recall primitive roots exist exactly for $n = 1, 2, 4, p^k, 2p^k$ with $p$ an odd prime.`,
    steps: [
      { instruction: `Compute $\\varphi(${n})$.`, answer: `${phi}`, accept: [], hint: `Use the product formula on the factorization of $${n}$.` },
      { instruction: `Is $${n}$ of the form $1, 2, 4, p^k$, or $2p^k$ ($p$ an odd prime)? So: does $${n}$ have a primitive root? (yes/no)`, answer: exists ? "yes" : "no", accept: exists ? ["y"] : ["n"], hint: `Factor $${n}$ and compare against the list.` },
      { instruction: `How many primitive roots does $${n}$ have? (If none exist, answer 0; otherwise $\\varphi(\\varphi(${n}))$.)`, answer: `${count}`, accept: count === 0 ? ["zero", "none"] : [], hint: exists ? `$\\varphi(${phi})$.` : `No primitive roots at all.` },
    ],
    finalAnswer: { value: `${count}`, unit: "" },
    solutionNarrative: exists
      ? `$${n}$ IS on Gauss's list, so primitive roots exist, and there are $\\varphi(\\varphi(${n})) = \\varphi(${phi}) = ${count}$ of them.`
      : `$${n}$ is NOT of the form $1, 2, 4, p^k, 2p^k$, so no element reaches order $\\varphi(${n}) = ${phi}$: there are $0$ primitive roots.`,
  };
};

// ===========================================================================
// concept: discrete-log-index
// ===========================================================================

// d1: Fermat reduction — a^(p-1) ≡ 1, then peel one extra factor.
fill["nt3-dlog-1"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11, 13]);
  let a;
  do { a = rng.int(2, p - 1); } while (a % p === 0);
  const k = rng.int(2, 4);
  const bigExp = k * (p - 1) + 1;
  return {
    id: `gen.nt3-dlog-1.${idx}`, generated: true, concepts: ["discrete-log-index"], difficulty: 1, context: "abstract",
    prompt: `Use Fermat's little theorem to compute $${a}^{${bigExp}} \\bmod ${p}$.`,
    steps: [
      { instruction: `Fermat: $${a}^{${p - 1}} \\bmod ${p} = $ ?`, answer: "1", accept: [], hint: `$a^{p-1} \\equiv 1$ for a prime $p$ with $p \\nmid a$.` },
      { instruction: `Now $${bigExp} = ${k} \\cdot ${p - 1} + 1$, so $${a}^{${bigExp}} = (${a}^{${p - 1}})^{${k}} \\cdot ${a} \\bmod ${p} = $ ?`, answer: `${a}`, accept: [], hint: `$1^{${k}} \\cdot ${a}$.` },
    ],
    finalAnswer: { value: `${a}`, unit: "" },
    solutionNarrative: `Fermat gives $${a}^{${p - 1}} \\equiv 1 \\pmod{${p}}$, so $${a}^{${bigExp}} = (${a}^{${p - 1}})^{${k}} \\cdot ${a} \\equiv ${a}$.`,
  };
};

// d2: tiny discrete log — find x with g^x ≡ h for a primitive root g.
fill["nt3-dlog-2"] = (rng, idx) => {
  const [p, g] = rng.pick([[7, 3], [11, 2], [13, 2]]); // g = smallest primitive root (verified below)
  const x = rng.int(2, Math.min(6, p - 2));
  const h = powMod(g, x, p);
  const p2 = powMod(g, 2, p);
  const p3 = powMod(g, 3, p);
  const powers = powerList(g, p, x);
  return {
    id: `gen.nt3-dlog-2.${idx}`, generated: true, concepts: ["discrete-log-index"], difficulty: 2, context: "abstract",
    prompt: `$${g}$ is a primitive root mod $${p}$. Find the index (discrete log) of $${h}$: the smallest $x \\geq 1$ with $${g}^x \\equiv ${h} \\pmod{${p}}$.`,
    steps: [
      { instruction: `Compute $${g}^2 \\bmod ${p}$.`, answer: `${p2}`, accept: [], hint: `$${g * g} \\bmod ${p}$.` },
      { instruction: `Compute $${g}^3 \\bmod ${p}$.`, answer: `${p3}`, accept: [], hint: `Multiply the previous value by $${g}$ and reduce.` },
      { instruction: `Continue listing powers until $${h}$ appears. The index $x = $ ?`, answer: `${x}`, accept: [`x=${x}`], hint: `The powers run $${powers.join(", ")}$.` },
    ],
    finalAnswer: { value: `${x}`, unit: "" },
    solutionNarrative: `Powers of $${g}$ mod $${p}$: $${powers.join(", ")}$ — the value $${h}$ first appears at exponent $${x}$, so the index of $${h}$ is $${x}$ (unique in $1..${p - 1}$ because $${g}$ is a primitive root).`,
  };
};

// d3: reduce a huge exponent using the order.
fill["nt3-dlog-3"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13, 17]);
  let a, d;
  do { a = rng.int(2, p - 2); d = ordOf(a, p); } while (d < 3);
  const q = rng.int(3, 9);
  const r = rng.int(1, d - 1);
  const N = q * d + r;
  const ans = powMod(a, r, p);
  return {
    id: `gen.nt3-dlog-3.${idx}`, generated: true, concepts: ["discrete-log-index"], difficulty: 3, context: "abstract",
    prompt: `Given that $\\mathrm{ord}_{${p}}(${a}) = ${d}$, compute $${a}^{${N}} \\bmod ${p}$.`,
    steps: [
      { instruction: `Only the exponent mod the order matters. Compute $${N} \\bmod ${d}$.`, answer: `${r}`, accept: [], hint: `$${N} = ${q} \\cdot ${d} + ${r}$.` },
      { instruction: `So $${a}^{${N}} \\equiv ${a}^{${r}} \\pmod{${p}}$. Compute $${a}^{${r}} \\bmod ${p}$.`, answer: `${ans}`, accept: [], hint: `Multiply out $${a}^{${r}}$ and reduce mod $${p}$.` },
    ],
    finalAnswer: { value: `${ans}`, unit: "" },
    solutionNarrative: `Since $${a}^{${d}} \\equiv 1 \\pmod{${p}}$, exponents reduce mod $${d}$: $${N} \\equiv ${r}$, and $${a}^{${r}} \\equiv ${ans} \\pmod{${p}}$.`,
  };
};
