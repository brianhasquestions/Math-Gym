// gen-crypto7-fill.js
// Parametric generators for content/cryptography/discrete-log-and-rsa-attacks.json
// (cr7-*): the real algorithms behind "discrete logs and RSA are hard", run on
// toy sizes a learner can do by hand (or with a basic calculator).
//
// Self-contained pack: exports `fill` (template name -> fn(rng, idx)), merged
// into js/generator.js via Object.assign. Every answer is computed here from
// the drawn givens. Menu answers are words (yes/no, first/second), never digits.
//
// Degenerate draws are rejected and redrawn: non-coprime moduli, generators
// that are not primitive roots (so logs are unique), trivial logs (x = 0, 1 or
// a giant step that matches at once), RSA messages that never wrap (so the
// broadcast attack would be a plain cube root), Pollard rho walks whose gcd
// jumps straight to n, and CRT solutions equal to one of the given residues.
//
// One generator per concept per difficulty tier (21 total):
//   baby-step-giant-step : cr7-bsgs-d1 / -d2 / -d3
//   pollard-rho          : cr7-rho-d1 / -d2 / -d3
//   pohlig-hellman       : cr7-ph-d1 / -d2 / -d3
//   chinese-remainder    : cr7-crt-d1 / -d2 / -d3
//   rsa-crt              : cr7-rcrt-d1 / -d2 / -d3
//   hastad-broadcast     : cr7-hastad-d1 / -d2 / -d3
//   fermat-factoring     : cr7-fermat-d1 / -d2 / -d3

const mod = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const egcd = (a, b) => { if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; };
const modinv = (a, m) => { a = mod(a, m); const [g, x] = egcd(a, m); return g !== 1 ? null : mod(x, m); };
const powmod = (b, e, m) => { let r = 1 % m; b = mod(b, m); while (e > 0) { if (e % 2 === 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; };
const isPrime = (x) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
const primesIn = (lo, hi) => { const out = []; for (let x = lo; x <= hi; x++) if (isPrime(x)) out.push(x); return out; };
const primeFactors = (n) => { const out = []; for (let d = 2; d * d <= n; d++) if (n % d === 0) { out.push(d); while (n % d === 0) n /= d; } if (n > 1) out.push(n); return out; };
const factorTex = (n) => { const parts = []; for (const q of primeFactors(n)) { let k = 0; while (n % q === 0) { n /= q; k++; } parts.push(k > 1 ? `${q}^{${k}}` : `${q}`); } return parts.join(" \\cdot "); };
const isPrimRoot = (g, p) => primeFactors(p - 1).every((q) => powmod(g, (p - 1) / q, p) !== 1);
const primRoots = (p) => { const out = []; for (let g = 2; g < p - 1; g++) if (isPrimRoot(g, p)) out.push(g); return out; };
const ceilSqrt = (n) => { let m = Math.floor(Math.sqrt(n)); while (m * m < n) m++; while (m > 0 && (m - 1) * (m - 1) >= n) m--; return m; };
const isqrt = (n) => { let r = Math.floor(Math.sqrt(n)); while (r * r > n) r--; while ((r + 1) * (r + 1) <= n) r++; return r; };
const isSquare = (n) => n >= 0 && isqrt(n) ** 2 === n;
const icbrt = (n) => { let r = Math.round(Math.cbrt(n)); while (r ** 3 > n) r--; while ((r + 1) ** 3 <= n) r++; return r; };
const isCube = (n) => icbrt(n) ** 3 === n;
// x = a1 (mod m1), x = a2 (mod m2), coprime moduli: lift x = a1 + m1 t.
const crt2 = (a1, m1, a2, m2) => { const inv = modinv(m1, m2); const t = mod((a2 - a1) * inv, m2); return { inv, t, x: a1 + m1 * t }; };
const SEP = ", ";

// --- hint helpers ------------------------------------------------------------
function invHint(a, m) {
  const r = mod(a, m), v = modinv(r, m);
  const pre = r !== a ? `$${a} \\equiv ${r} \\pmod{${m}}$, and ` : "";
  return `${pre}$${r} \\cdot ${v} = ${r * v} = ${Math.floor((r * v) / m)} \\cdot ${m} + 1$, so the inverse is $${v}$.`;
}
function powHint(b, e, m) {
  const r = powmod(b, e, m);
  if (e <= 3 && b ** e < 1e7) return `$${b}^{${e}} = ${b ** e}$, and $${b ** e} \\bmod ${m} = ${r}$.`;
  const sq = []; let v = mod(b, m);
  for (let k = 1; k <= e; k *= 2) { sq.push(`$${b}^{${k}} \\equiv ${v}$`); v = (v * v) % m; }
  const bits = []; for (let k = 1; k <= e; k *= 2) if (Math.floor(e / k) % 2 === 1) bits.push(k);
  return `Square-and-multiply mod ${m}: ${sq.join(SEP)}. Since $${e} = ${bits.reverse().join(" + ")}$, multiply those powers: $${b}^{${e}} \\equiv ${r} \\pmod{${m}}$.`;
}

export const fill = {};

// ============================================================================
// baby-step-giant-step
// ============================================================================

const BSGS_HOW = `Use $m = \\lceil \\sqrt{p - 1} \\rceil$. Baby steps: the table $g^j \\bmod p$ for $0 \\le j < m$. Giant steps: $\\gamma_i = h \\cdot (g^{-m})^i \\bmod p$ for $i = 0, 1, 2, \\dots$, until some $\\gamma_i$ is in the table; then $x = im + j$.`;

function bsgsDraw(rng, primes, iMin, iMax) {
  for (let t = 0; t < 1000; t++) {
    const p = rng.pick(primes), g = rng.pick(primRoots(p)), m = ceilSqrt(p - 1);
    const x = rng.int(2, p - 2), i = Math.floor(x / m), j = x % m;
    if (i < iMin || i > iMax || j === 0) continue;
    const h = powmod(g, x, p), gm = powmod(g, m, p), gim = modinv(gm, p);
    const giants = []; let y = h;
    for (let k = 0; k <= i; k++) { giants.push(y); y = (y * gim) % p; }
    const baby = []; for (let k = 0; k < m; k++) baby.push(powmod(g, k, p));
    return { p, g, m, x, i, j, h, gm, gim, giants, baby };
  }
  throw new Error("cr7 bsgs: no draw");
}
const babyList = (B) => B.baby.map((v, k) => `$${B.g}^{${k}} \\equiv ${v}$`).join(SEP);
const giantList = (B) => B.giants.map((v, k) => `$\\gamma_{${k}} = ${v}$`).join(SEP);
const bsgsSteps = (B) => ({
  m: { instruction: `Compute $m = \\lceil \\sqrt{${B.p - 1}} \\rceil$.`, answer: `${B.m}`, accept: [], hint: `$${B.m - 1}^2 = ${(B.m - 1) ** 2} < ${B.p - 1} \\le ${B.m ** 2} = ${B.m}^2$.` },
  gim: { instruction: `Compute the giant-step multiplier $g^{-m} = ${B.g}^{-${B.m}} \\bmod ${B.p}$: first $${B.g}^{${B.m}} \\bmod ${B.p}$, then its inverse.`, answer: `${B.gim}`, accept: [], hint: `$${B.g}^{${B.m}} \\equiv ${B.gm} \\pmod{${B.p}}$. Then ${invHint(B.gm, B.p)}` },
  x: { instruction: `So $x = im + j = ${B.i} \\cdot ${B.m} + ${B.j}$. What is $x$?`, answer: `${B.x}`, accept: [], hint: `Check: $${B.g}^{${B.x}} \\bmod ${B.p}$ should be $${B.h}$.` },
});
const bsgsNarr = (B) => `With $m = ${B.m}$ the baby table is ${B.baby.join(SEP)} (for $j = 0$ to $${B.m - 1}$), and the giant steps run ${B.giants.join(SEP)}. The first giant step in the table is $\\gamma_{${B.i}} = ${B.giants[B.i]} = ${B.g}^{${B.j}}$, so $h \\cdot g^{-${B.i * B.m}} = g^{${B.j}}$ and $x = ${B.i} \\cdot ${B.m} + ${B.j} = ${B.x}$. That took ${B.m} baby steps and ${B.i + 1} giant steps instead of up to ${B.p - 2} trial exponents.`;

fill["cr7-bsgs-d1"] = (rng, idx) => {
  const B = bsgsDraw(rng, [11, 13, 17, 19, 23, 29], 1, 1), S = bsgsSteps(B);
  return {
    id: `gen.cr7-bsgs-d1.${idx}`, generated: true, concepts: ["baby-step-giant-step"], difficulty: 1, context: "abstract",
    prompt: `Solve $${B.g}^x \\equiv ${B.h} \\pmod{${B.p}}$ for $x$ with baby-step giant-step. ($${B.g}$ is a primitive root mod $${B.p}$, so $x$ is unique in $0 \\le x < ${B.p - 1}$.) ${BSGS_HOW}`,
    steps: [
      S.m, S.gim,
      { instruction: `$h = ${B.h}$ itself (the giant step $\\gamma_0$) is not in the table. Compute $\\gamma_1 = ${B.h} \\cdot ${B.gim} \\bmod ${B.p}$.`, answer: `${B.giants[1]}`, accept: [], hint: `$${B.h} \\cdot ${B.gim} = ${B.h * B.gim}$, and $${B.h * B.gim} \\bmod ${B.p} = ${B.giants[1]}$.` },
      { instruction: `Build the baby-step table $${B.g}^0, ${B.g}^1, \\dots, ${B.g}^{${B.m - 1}} \\bmod ${B.p}$. Which $j$ has $${B.g}^j \\equiv \\gamma_1$?`, answer: `${B.j}`, accept: [], hint: `The table: ${babyList(B)}.` },
      S.x,
    ],
    finalAnswer: { value: `${B.x}`, unit: "" },
    solutionNarrative: bsgsNarr(B),
  };
};

fill["cr7-bsgs-d2"] = (rng, idx) => {
  const B = bsgsDraw(rng, [31, 37, 41, 43, 47, 53, 59, 61], 2, 3), S = bsgsSteps(B);
  return {
    id: `gen.cr7-bsgs-d2.${idx}`, generated: true, concepts: ["baby-step-giant-step"], difficulty: 2, context: "abstract",
    prompt: `Solve $${B.g}^x \\equiv ${B.h} \\pmod{${B.p}}$ with baby-step giant-step. ($${B.g}$ is a primitive root mod $${B.p}$.) ${BSGS_HOW}`,
    steps: [
      S.m, S.gim,
      { instruction: `Build the baby-step table, then walk the giant steps $\\gamma_0 = ${B.h}, \\gamma_1, \\gamma_2, \\dots$. At which $i$ does a giant step FIRST land in the table?`, answer: `${B.i}`, accept: [], hint: `Table: ${babyList(B)}. Giant steps: ${giantList(B)}.` },
      { instruction: `Which baby step $j$ does it match (the $j$ with $${B.g}^j \\equiv \\gamma_i$)?`, answer: `${B.j}`, accept: [], hint: `$\\gamma_{${B.i}} = ${B.giants[B.i]}$; find it in the table.` },
      S.x,
    ],
    finalAnswer: { value: `${B.x}`, unit: "" },
    solutionNarrative: bsgsNarr(B),
  };
};

fill["cr7-bsgs-d3"] = (rng, idx) => {
  const B = bsgsDraw(rng, [67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113], 2, 8), S = bsgsSteps(B);
  const bits = rng.pick([160, 224, 256, 384, 512]);
  return {
    id: `gen.cr7-bsgs-d3.${idx}`, generated: true, concepts: ["baby-step-giant-step"], difficulty: 3, context: "abstract",
    prompt: `Solve $${B.g}^x \\equiv ${B.h} \\pmod{${B.p}}$ with baby-step giant-step. ($${B.g}$ is a primitive root mod $${B.p}$.) ${BSGS_HOW} Then scale it up: a well-chosen elliptic-curve group has prime order about $2^{${bits}}$.`,
    steps: [
      S.m, S.gim,
      { instruction: `At which giant step $i$ is there FIRST a match with the baby table?`, answer: `${B.i}`, accept: [], hint: `Table: ${babyList(B)}. Giant steps: ${giantList(B)}.` },
      { instruction: `Which baby step $j$ matches?`, answer: `${B.j}`, accept: [], hint: `$\\gamma_{${B.i}} = ${B.giants[B.i]}$.` },
      S.x,
      { instruction: `For the group of order about $2^{${bits}}$, BSGS must store a table of about $\\sqrt{2^{${bits}}}$ entries. Give the exponent $k$ in $2^k$.`, answer: `${bits / 2}`, accept: [], hint: `$\\sqrt{2^{${bits}}} = 2^{${bits}/2}$.` },
    ],
    finalAnswer: { value: `${B.x}`, unit: "" },
    solutionNarrative: `${bsgsNarr(B)} At real size the same square root is the whole story: a $2^{${bits}}$-order group needs about $2^{${bits / 2}}$ steps AND $2^{${bits / 2}}$ stored table entries, which is far beyond any computer. Shoup proved in 1997 that no generic algorithm can beat that square root, which is why such a group gives about ${bits / 2}-bit security.`,
  };
};

// ============================================================================
// pollard-rho (factoring version; the discrete-log version is in the lecture)
// ============================================================================

const rhoHow = (c) => `Pollard rho walks $x_{k+1} = x_k^2 + ${c} \\bmod n$ from $x_0 = 2$. Floyd's cycle test compares the tortoise $x_i$ with the hare $x_{2i}$: for $i = 1, 2, 3, \\dots$ compute $\\gcd(|x_{2i} - x_i|, n)$ and stop as soon as it is bigger than 1.`;

function rhoDraw(rng, primes, Ks) {
  const K = Math.max(...Ks);
  for (let t = 0; t < 4000; t++) {
    const p = rng.pick(primes), q = rng.pick(primes);
    if (p >= q) continue;
    const n = p * q, c = rng.pick([1, 1, 2, 3, 5]);
    const xs = [2];
    for (let k = 1; k <= 2 * K + 2; k++) xs.push((xs[k - 1] * xs[k - 1] + c) % n);
    const gs = [null]; let found = 0;
    for (let i = 1; i <= K; i++) { const g = gcd(xs[2 * i] - xs[i], n); gs.push(g); if (g > 1) { found = i; break; } }
    if (!Ks.includes(found) || gs[found] === n) continue;
    const d = gs[found];
    return { p, q, n, c, xs, gs, i: found, d, other: n / d };
  }
  throw new Error("cr7 rho: no draw");
}
const sqStep = (R, k) => ({ instruction: `Compute $x_{${k}} = x_{${k - 1}}^2 + ${R.c} \\bmod ${R.n}$.`, answer: `${R.xs[k]}`, accept: [], hint: `$${R.xs[k - 1]}^2 + ${R.c} = ${R.xs[k - 1] ** 2 + R.c}$, and $${R.xs[k - 1] ** 2 + R.c} \\bmod ${R.n} = ${R.xs[k]}$.` });
const gcdStep = (R, i) => {
  const a = R.xs[2 * i], b = R.xs[i], diff = Math.abs(a - b);
  return { instruction: `Floyd test at $i = ${i}$: compute $\\gcd(|x_{${2 * i}} - x_{${i}}|, ${R.n}) = \\gcd(${diff}, ${R.n})$.`, answer: `${R.gs[i]}`, accept: [], hint: `$|${a} - ${b}| = ${diff}$. Run Euclid on $${diff}$ and $${R.n}$.` };
};
const rhoNarr = (R) => `The walk is ${R.xs.slice(0, 2 * R.i + 1).join(SEP)}. At $i = ${R.i}$, $\\gcd(|x_{${2 * R.i}} - x_{${R.i}}|, ${R.n}) = ${R.d}$, so $${R.n} = ${R.d} \\cdot ${R.other}$. Why it works: reduced mod the hidden prime $${R.d}$, the walk takes only about $\\sqrt{${R.d}}$ steps to repeat, and once $x_{2i} \\equiv x_i \\pmod{${R.d}}$ their difference is a multiple of $${R.d}$ that gcd can pull out, even though the walk mod $${R.n}$ has not repeated.`;

fill["cr7-rho-d1"] = (rng, idx) => {
  const R = rhoDraw(rng, primesIn(7, 31), [2]);
  return {
    id: `gen.cr7-rho-d1.${idx}`, generated: true, concepts: ["pollard-rho"], difficulty: 1, context: "abstract",
    prompt: `Factor $n = ${R.n}$ with Pollard rho. ${rhoHow(R.c)}`,
    steps: [
      sqStep(R, 1), sqStep(R, 2), gcdStep(R, 1), sqStep(R, 3), sqStep(R, 4), gcdStep(R, 2),
      { instruction: `That gcd is a prime factor of $${R.n}$. What is the other factor?`, answer: `${R.other}`, accept: [], hint: `$${R.n} / ${R.d}$.` },
    ],
    finalAnswer: { value: `${R.d}`, unit: "" },
    solutionNarrative: rhoNarr(R),
  };
};

fill["cr7-rho-d2"] = (rng, idx) => {
  const R = rhoDraw(rng, primesIn(11, 47), [3]);
  return {
    id: `gen.cr7-rho-d2.${idx}`, generated: true, concepts: ["pollard-rho"], difficulty: 2, context: "abstract",
    prompt: `Factor $n = ${R.n}$ with Pollard rho. ${rhoHow(R.c)} The walk so far: $x_1 = ${R.xs[1]}$, $x_2 = ${R.xs[2]}$, and the test at $i = 1$ gave $\\gcd = 1$.`,
    steps: [
      sqStep(R, 3), sqStep(R, 4), gcdStep(R, 2), sqStep(R, 5), sqStep(R, 6), gcdStep(R, 3),
      { instruction: `What is the other factor of $${R.n}$?`, answer: `${R.other}`, accept: [], hint: `$${R.n} / ${R.d}$.` },
    ],
    finalAnswer: { value: `${R.d}`, unit: "" },
    solutionNarrative: rhoNarr(R),
  };
};

fill["cr7-rho-d3"] = (rng, idx) => {
  const R = rhoDraw(rng, primesIn(23, 97), [3, 4, 5, 6]);
  const bits = rng.pick([160, 224, 256, 384]);
  const shown = R.xs.slice(0, 2 * R.i + 3).map((v, k) => `$x_{${k}} = ${v}$`).join(SEP);
  return {
    id: `gen.cr7-rho-d3.${idx}`, generated: true, concepts: ["pollard-rho"], difficulty: 3, context: "abstract",
    prompt: `Factor $n = ${R.n}$ with Pollard rho. ${rhoHow(R.c)} The walk is already computed: ${shown}. Then compare with discrete logs: the rho method for discrete logs uses the same birthday-collision idea in a group of prime order about $2^{${bits}}$.`,
    steps: [
      { instruction: `At which $i$ does the Floyd test FIRST give a gcd bigger than 1?`, answer: `${R.i}`, accept: [], hint: `Test $i = 1, 2, \\dots$: ${R.gs.slice(1).map((g, k) => `$\\gcd(|x_{${2 * k + 2}} - x_{${k + 1}}|, n) = ${g}$`).join(SEP)}.` },
      { instruction: `What prime factor does that gcd reveal?`, answer: `${R.d}`, accept: [], hint: `It is the gcd itself.` },
      { instruction: `What is the other factor?`, answer: `${R.other}`, accept: [], hint: `$${R.n} / ${R.d}$.` },
      { instruction: `Rho for discrete logs needs about $\\sqrt{2^{${bits}}}$ group operations. Give the exponent $k$ in $2^k$.`, answer: `${bits / 2}`, accept: [], hint: `Square root halves the exponent.` },
      { instruction: `Does rho need to store a big table the way baby-step giant-step does? (yes or no)`, answer: `no`, accept: [], hint: `Floyd keeps just two walkers, the tortoise and the hare.` },
    ],
    finalAnswer: { value: `${R.d}`, unit: "" },
    solutionNarrative: `${rhoNarr(R)} For discrete logs, rho walks through elements $g^a h^b$ until two coincide, which gives a linear equation for $x$. It costs about $2^{${bits / 2}}$ steps, the same square root as BSGS, but with almost no memory, which is why it is the practical generic attack and why a $2^{${bits}}$-order curve is rated at about ${bits / 2}-bit security.`,
  };
};

// ============================================================================
// pohlig-hellman
// ============================================================================

// Primes whose p - 1 has small odd prime factors (3, 5 or 7).
const PH_PRIMES = [31, 37, 41, 43, 61, 71, 73, 97, 101, 113];
// p - 1 squarefree with three prime factors.
const PH_FULL = [31, 43, 71];
const SAFE = [83, 107, 167, 179, 227, 263, 347, 359, 383, 467, 479, 503, 563, 587];
const SMOOTH = [97, 113, 127, 151, 181, 193, 197, 211, 241, 251, 257, 271, 281, 337, 401, 421, 433, 449, 487, 491, 541, 577];

fill["cr7-ph-d1"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const p = rng.pick(PH_PRIMES), qs = primeFactors(p - 1).filter((q) => q > 2 && q <= 7);
    if (!qs.length) continue;
    const q = rng.pick(qs), g = rng.pick(primRoots(p)), x = rng.int(2, p - 2);
    if (x % q === 0) continue;
    const e = (p - 1) / q, h = powmod(g, x, p), gq = powmod(g, e, p), hq = powmod(h, e, p);
    const table = []; for (let k = 0; k < q; k++) table.push(`$${gq}^{${k}} \\equiv ${powmod(gq, k, p)}$`);
    return {
      id: `gen.cr7-ph-d1.${idx}`, generated: true, concepts: ["pohlig-hellman"], difficulty: 1, context: "abstract",
      prompt: `A Diffie–Hellman group uses $p = ${p}$ with primitive root $g = ${g}$. An eavesdropper sees $h = g^x \\equiv ${h} \\pmod{${p}}$. Since $${q}$ divides $p - 1 = ${p - 1}$, raising both sides to the power $(p - 1)/${q}$ drops into the subgroup of order $${q}$, where $x \\bmod ${q}$ can be found by trying at most $${q}$ values.`,
      steps: [
        { instruction: `Compute the exponent $(p - 1)/${q}$.`, answer: `${e}`, accept: [], hint: `$${p - 1} / ${q}$.` },
        { instruction: `Compute $g_${q} = ${g}^{${e}} \\bmod ${p}$.`, answer: `${gq}`, accept: [], hint: powHint(g, e, p) },
        { instruction: `Compute $h_${q} = ${h}^{${e}} \\bmod ${p}$.`, answer: `${hq}`, accept: [], hint: powHint(h, e, p) },
        { instruction: `Find $k$ in $0 \\le k < ${q}$ with $g_${q}^k \\equiv h_${q}$. That $k$ is $x \\bmod ${q}$.`, answer: `${x % q}`, accept: [], hint: `Powers of $g_${q}$: ${table.join(SEP)}.` },
      ],
      finalAnswer: { value: `${x % q}`, unit: "" },
      solutionNarrative: `$h^{(p-1)/${q}} = (g^{(p-1)/${q}})^x$, so $h_${q} = g_${q}^{\\,x}$, and $g_${q} = ${gq}$ has order $${q}$, so only $x \\bmod ${q}$ matters: $${gq}^{${x % q}} \\equiv ${hq}$ gives $x \\equiv ${x % q} \\pmod{${q}}$. (The full secret is $x = ${x}$, and $${x} \\bmod ${q} = ${x % q}$.) Repeat for every prime factor of $p - 1$, glue the residues with CRT, and the discrete log falls: that is Pohlig–Hellman.`,
    };
  }
  throw new Error("cr7 ph-d1: no draw");
};

fill["cr7-ph-d2"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const p = rng.pick(PH_FULL), g = rng.pick(primRoots(p)), x = rng.int(2, p - 2);
    const qs = primeFactors(p - 1), h = powmod(g, x, p);
    const res = qs.map((q) => x % q);
    if (new Set(res).size === 1) continue; // x residues all equal is a giveaway
    const proj = qs.map((q) => { const e = (p - 1) / q; return { q, e, gq: powmod(g, e, p), hq: powmod(h, e, p) }; });
    const projTex = proj.map((P) => `for $q = ${P.q}$: $g^{${P.e}} \\equiv ${P.gq}$ and $h^{${P.e}} \\equiv ${P.hq}$`).join("; ");
    const steps = proj.map((P) => {
      const tbl = []; for (let k = 0; k < P.q; k++) tbl.push(`$${P.gq}^{${k}} \\equiv ${powmod(P.gq, k, p)}$`);
      return { instruction: `Find $x \\bmod ${P.q}$: the $k$ in $0 \\le k < ${P.q}$ with $${P.gq}^k \\equiv ${P.hq} \\pmod{${p}}$.`, answer: `${x % P.q}`, accept: [], hint: `Powers: ${tbl.join(SEP)}.` };
    });
    const [q1, q2, q3] = qs, c12 = crt2(x % q1, q1, x % q2, q2);
    steps.push({ instruction: `Combine with the Chinese Remainder Theorem: find $x$ in $0 \\le x < ${p - 1}$ with $x \\equiv ${x % q1} \\pmod{${q1}}$, $x \\equiv ${x % q2} \\pmod{${q2}}$, $x \\equiv ${x % q3} \\pmod{${q3}}$.`, answer: `${x}`, accept: [], hint: `The first two give $x \\equiv ${c12.x} \\pmod{${q1 * q2}}$; then try $${c12.x}, ${c12.x + q1 * q2}, \\dots$ against the third.` });
    return {
      id: `gen.cr7-ph-d2.${idx}`, generated: true, concepts: ["pohlig-hellman"], difficulty: 2, context: "abstract",
      prompt: `Diffie–Hellman with $p = ${p}$, where $p - 1 = ${factorTex(p - 1)}$, and primitive root $g = ${g}$. You see $h = g^x \\equiv ${h} \\pmod{${p}}$. Pohlig–Hellman raises $g$ and $h$ to $(p-1)/q$ for each prime $q$ dividing $p - 1$. The projections, computed for you: ${projTex}.`,
      steps,
      finalAnswer: { value: `${x}`, unit: "" },
      solutionNarrative: `The three small logs give $x \\equiv ${res.join(", ")}$ modulo $${qs.join(", ")}$, and CRT glues them into $x = ${x}$. Check: $${g}^{${x}} \\bmod ${p} = ${h}$. Every step happened in a subgroup of size at most $${Math.max(...qs)}$, so the work was set by the largest prime factor of $p - 1$, not by $p$.`,
    };
  }
  throw new Error("cr7 ph-d2: no draw");
};

fill["cr7-ph-d3"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const ps = rng.pick(SAFE), pm = rng.pick(SMOOTH);
    if (!isPrime((ps - 1) / 2)) continue;
    const safeFirst = rng.int(0, 1) === 1;
    const [p1, p2] = safeFirst ? [ps, pm] : [pm, ps];
    const big1 = Math.max(...primeFactors(p1 - 1)), big2 = Math.max(...primeFactors(p2 - 1));
    const g = rng.pick(primRoots(ps).filter((r) => r < 20));
    if (!g) continue;
    const x = rng.int(2, ps - 2), h = powmod(g, x, ps), e = (ps - 1) / 2, leg = powmod(h, e, ps);
    const si = safeFirst ? 1 : 2;
    return {
      id: `gen.cr7-ph-d3.${idx}`, generated: true, concepts: ["pohlig-hellman"], difficulty: 3, context: "applied",
      prompt: `Two candidate Diffie–Hellman primes: the first is $p_1 = ${p1}$ and the second is $p_2 = ${p2}$. Pohlig–Hellman makes a discrete log mod $p$ cost about as much as one in a subgroup whose size is the LARGEST prime factor of $p - 1$. Separately, for $p_${si} = ${ps}$ with primitive root $g = ${g}$, an eavesdropper sees $h = g^x \\equiv ${h} \\pmod{${ps}}$.`,
      steps: [
        { instruction: `What is the largest prime factor of $p_1 - 1 = ${p1 - 1}$?`, answer: `${big1}`, accept: [], hint: `$${p1 - 1} = ${factorTex(p1 - 1)}$.` },
        { instruction: `What is the largest prime factor of $p_2 - 1 = ${p2 - 1}$?`, answer: `${big2}`, accept: [], hint: `$${p2 - 1} = ${factorTex(p2 - 1)}$.` },
        { instruction: `Which prime makes Pohlig–Hellman least helpful to the attacker? (first or second)`, answer: safeFirst ? "first" : "second", accept: [], hint: `Pick the one whose $p - 1$ has the bigger largest prime factor.` },
        { instruction: `Even a safe prime leaks one bit in the full group. Compute $h^{(p-1)/2} = ${h}^{${e}} \\bmod ${ps}$.`, answer: `${leg}`, accept: [], hint: `${powHint(h, e, ps)} It must be $1$ or $${ps - 1}$, because it lands in the subgroup of order 2.` },
        { instruction: `So what is $x \\bmod 2$?`, answer: `${x % 2}`, accept: [], hint: `$h^{(p-1)/2} = (g^{(p-1)/2})^x = (-1)^x$, so $1$ means $x$ is even and $p - 1$ means $x$ is odd.` },
      ],
      finalAnswer: { value: safeFirst ? "first" : "second", unit: "" },
      solutionNarrative: `$p_1 - 1 = ${factorTex(p1 - 1)}$ and $p_2 - 1 = ${factorTex(p2 - 1)}$. The ${safeFirst ? "first" : "second"} is a safe prime, $p = 2q + 1$ with $q = ${(ps - 1) / 2}$ prime, so Pohlig–Hellman can only split off a factor of 2 and the attacker is left with a log in a group of prime order $${(ps - 1) / 2}$. The other has $p - 1$ built from primes no bigger than $${Math.min(big1, big2)}$, so its discrete logs fall to a handful of tiny searches plus CRT. The order-2 piece still leaks: $h^{${e}} \\equiv ${leg}$, so $x$ is ${x % 2 ? "odd" : "even"} (here $x = ${x}$). That is why protocols work in the subgroup of prime order $q$ (for example by using $g = 4$ or another square), and why real groups make that prime $q$ large: at least 224 to 256 bits in DSA-style groups, and nearly the full size of $p$ in a safe-prime group.`,
    };
  }
  throw new Error("cr7 ph-d3: no draw");
};

// ============================================================================
// chinese-remainder
// ============================================================================

const congTex = (a, m) => `$x \\equiv ${a} \\pmod{${m}}$`;
function coprimeSet(rng, k, lo, hi, minProd, maxProd) {
  for (let t = 0; t < 2000; t++) {
    const ms = []; for (let i = 0; i < k; i++) ms.push(rng.int(lo, hi));
    let ok = true;
    for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) if (gcd(ms[i], ms[j]) !== 1) ok = false;
    const M = ms.reduce((a, b) => a * b, 1);
    if (ok && M >= minProd && M <= maxProd) return ms;
  }
  throw new Error("cr7 crt: no coprime set");
}

fill["cr7-crt-d1"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const [m1, m2] = coprimeSet(rng, 2, 3, 13, 20, 160);
    if (m1 % m2 === 1) continue; // inverse would be a trivial 1
    const a1 = rng.int(1, m1 - 1), a2 = rng.int(0, m2 - 1);
    const S = crt2(a1, m1, a2, m2);
    if (S.x < 2 || S.x === a1 || S.x === a2) continue;
    return {
      id: `gen.cr7-crt-d1.${idx}`, generated: true, concepts: ["chinese-remainder"], difficulty: 1, context: "abstract",
      prompt: `Solve ${congTex(a1, m1)} and ${congTex(a2, m2)} for $0 \\le x < ${m1 * m2}$. Lift method: write $x = ${a1} + ${m1}t$, then solve $${a1} + ${m1}t \\equiv ${a2} \\pmod{${m2}}$ for $t$.`,
      steps: [
        { instruction: `Compute $${m1}^{-1} \\bmod ${m2}$.`, answer: `${S.inv}`, accept: [], hint: invHint(m1, m2) },
        { instruction: `Solve for $t = (${a2} - ${a1}) \\cdot ${S.inv} \\bmod ${m2}$.`, answer: `${S.t}`, accept: [], hint: `$(${a2 - a1}) \\cdot ${S.inv} = ${(a2 - a1) * S.inv}$, and that is $${S.t}$ mod $${m2}$.` },
        { instruction: `So $x = ${a1} + ${m1} \\cdot ${S.t}$. What is $x$?`, answer: `${S.x}`, accept: [], hint: `Check: $${S.x} \\bmod ${m1} = ${S.x % m1}$ and $${S.x} \\bmod ${m2} = ${S.x % m2}$.` },
      ],
      finalAnswer: { value: `${S.x}`, unit: "" },
      solutionNarrative: `$x = ${a1} + ${m1}t$ already satisfies the first congruence for every $t$. The second needs $${m1}t \\equiv ${a2 - a1} \\pmod{${m2}}$, so $t \\equiv ${S.t}$ and $x = ${S.x}$. Because $\\gcd(${m1}, ${m2}) = 1$, this is the ONLY solution in $0 \\le x < ${m1 * m2}$: that uniqueness is the Chinese Remainder Theorem.`,
    };
  }
  throw new Error("cr7 crt-d1: no draw");
};

fill["cr7-crt-d2"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const [m1, m2, m3] = coprimeSet(rng, 3, 3, 11, 60, 700);
    const a1 = rng.int(1, m1 - 1), a2 = rng.int(0, m2 - 1), a3 = rng.int(0, m3 - 1);
    const S12 = crt2(a1, m1, a2, m2), M12 = m1 * m2;
    if (M12 % m3 === 1) continue;
    const S = crt2(S12.x, M12, a3, m3);
    if (S.x < 2 || S12.x === a1 || S.x === S12.x) continue;
    return {
      id: `gen.cr7-crt-d2.${idx}`, generated: true, concepts: ["chinese-remainder"], difficulty: 2, context: "abstract",
      prompt: `Solve the system ${congTex(a1, m1)}, ${congTex(a2, m2)}, ${congTex(a3, m3)} for $0 \\le x < ${M12 * m3}$. Combine two congruences at a time.`,
      steps: [
        { instruction: `Combine the first two: find $x_{12}$ with $0 \\le x_{12} < ${M12}$.`, answer: `${S12.x}`, accept: [], hint: `Write $x = ${a1} + ${m1}t$; then $t \\equiv (${a2} - ${a1}) \\cdot ${S12.inv} \\equiv ${S12.t} \\pmod{${m2}}$ (since $${m1}^{-1} \\equiv ${S12.inv}$), so $x_{12} = ${S12.x}$.` },
        { instruction: `Now solve $x = ${S12.x} + ${M12}s \\equiv ${a3} \\pmod{${m3}}$. First compute $${M12}^{-1} \\bmod ${m3}$.`, answer: `${S.inv}`, accept: [], hint: invHint(M12, m3) },
        { instruction: `Compute $s = (${a3} - ${S12.x}) \\cdot ${S.inv} \\bmod ${m3}$.`, answer: `${S.t}`, accept: [], hint: `$(${a3 - S12.x}) \\cdot ${S.inv} = ${(a3 - S12.x) * S.inv}$, which is $${S.t}$ mod $${m3}$.` },
        { instruction: `So $x = ${S12.x} + ${M12} \\cdot ${S.t}$. What is $x$?`, answer: `${S.x}`, accept: [], hint: `Check all three: $${S.x} \\bmod ${m1} = ${S.x % m1}$, $${S.x} \\bmod ${m2} = ${S.x % m2}$, $${S.x} \\bmod ${m3} = ${S.x % m3}$.` },
      ],
      finalAnswer: { value: `${S.x}`, unit: "" },
      solutionNarrative: `The first two congruences collapse to $x \\equiv ${S12.x} \\pmod{${M12}}$; folding in the third gives $x = ${S.x}$, unique mod $${M12 * m3}$. Pairwise coprime moduli are essential: they are what make each inverse exist.`,
    };
  }
  throw new Error("cr7 crt-d2: no draw");
};

const CRT_CTX = [
  ["A marching band lines up", "musicians"],
  ["A warehouse stacks crates", "crates"],
  ["A teacher splits a class into teams", "students"],
  ["A collector sorts coins into stacks", "coins"],
];
fill["cr7-crt-d3"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const ms = coprimeSet(rng, 3, 3, 13, 100, 1000), M = ms[0] * ms[1] * ms[2];
    const x = rng.int(14, M - 1), as = ms.map((m) => x % m);
    const Ms = ms.map((m) => M / m), ys = ms.map((m, i) => modinv(Ms[i], m));
    if (ys.some((y) => y === 1)) continue; // keep every inverse a real computation
    const [ctx, noun] = rng.pick(CRT_CTX);
    const rows = ms.map((m, i) => `groups of ${m} leave ${as[i]} over`).join(", ");
    const yStep = (i) => ({ instruction: `$M_${i + 1} = M / ${ms[i]} = ${Ms[i]}$. Compute $y_${i + 1} = M_${i + 1}^{-1} \\bmod ${ms[i]}$.`, answer: `${ys[i]}`, accept: [], hint: invHint(Ms[i], ms[i]) });
    const terms = ms.map((m, i) => `${as[i]} \\cdot ${Ms[i]} \\cdot ${ys[i]}`).join(" + ");
    const sum = ms.reduce((s, m, i) => s + as[i] * Ms[i] * ys[i], 0);
    return {
      id: `gen.cr7-crt-d3.${idx}`, generated: true, concepts: ["chinese-remainder"], difficulty: 3, context: "applied",
      prompt: `${ctx}: ${rows}. There are fewer than ${M} ${noun}. How many are there? Use the CRT formula: $M = m_1 m_2 m_3$, $M_i = M / m_i$, $y_i = M_i^{-1} \\bmod m_i$, and $x = \\sum a_i M_i y_i \\bmod M$.`,
      steps: [
        { instruction: `Compute $M = ${ms.join(" \\cdot ")}$.`, answer: `${M}`, accept: [], hint: `Multiply the three moduli.` },
        yStep(0), yStep(1), yStep(2),
        { instruction: `Compute $x = (${terms}) \\bmod ${M}$.`, answer: `${x}`, accept: [], hint: `The sum is $${sum}$, and $${sum} \\bmod ${M} = ${x}$.` },
      ],
      finalAnswer: { value: `${x}`, unit: noun },
      solutionNarrative: `Each term $a_i M_i y_i$ is $\\equiv a_i$ mod its own $m_i$ (because $M_i y_i \\equiv 1$) and $\\equiv 0$ mod the other two (because $M_i$ contains them). The sum $${sum}$ therefore hits all three remainders, and reducing mod $${M}$ gives the unique answer, ${x} ${noun}.`,
    };
  }
  throw new Error("cr7 crt-d3: no draw");
};

// ============================================================================
// rsa-crt
// ============================================================================

function rsaKey(rng, primes, es) {
  for (let t = 0; t < 2000; t++) {
    const p = rng.pick(primes), q = rng.pick(primes);
    if (p === q) continue;
    const phi = (p - 1) * (q - 1), e = rng.pick(es);
    if (gcd(e, phi) !== 1) continue;
    const d = modinv(e, phi);
    if (d === e || d < 5) continue;
    return { p, q, n: p * q, phi, e, d, dp: d % (p - 1), dq: d % (q - 1) };
  }
  throw new Error("cr7 rsa: no key");
}
function rsaMsg(rng, K) {
  for (let t = 0; t < 1000; t++) {
    const m = rng.int(2, K.n - 2);
    if (gcd(m, K.n) !== 1) continue;
    const c = powmod(m, K.e, K.n);
    if (c === m) continue;
    return { m, c };
  }
  throw new Error("cr7 rsa: no message");
}

fill["cr7-rcrt-d1"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const K = rsaKey(rng, primesIn(11, 47), [3, 5, 7, 11, 13, 17]);
    if (K.dp < 2 || K.dq < 2) continue;
    const { m, c } = rsaMsg(rng, K), mp = powmod(c, K.dp, K.p), mq = powmod(c, K.dq, K.q);
    return {
      id: `gen.cr7-rcrt-d1.${idx}`, generated: true, concepts: ["rsa-crt"], difficulty: 1, context: "abstract",
      prompt: `RSA private key: $p = ${K.p}$, $q = ${K.q}$, $n = ${K.n}$, $d = ${K.d}$. Decrypt $c = ${c}$ the fast way: by Fermat, mod $p$ the exponent $d$ only matters mod $p - 1$, and mod $q$ only mod $q - 1$. So compute $m_p = c^{d_p} \\bmod p$ and $m_q = c^{d_q} \\bmod q$ with $d_p = d \\bmod (p - 1)$ and $d_q = d \\bmod (q - 1)$.`,
      steps: [
        { instruction: `Compute $d_p = ${K.d} \\bmod ${K.p - 1}$.`, answer: `${K.dp}`, accept: [], hint: `$${K.d} = ${Math.floor(K.d / (K.p - 1))} \\cdot ${K.p - 1} + ${K.dp}$.` },
        { instruction: `Compute $d_q = ${K.d} \\bmod ${K.q - 1}$.`, answer: `${K.dq}`, accept: [], hint: `$${K.d} = ${Math.floor(K.d / (K.q - 1))} \\cdot ${K.q - 1} + ${K.dq}$.` },
        { instruction: `Compute $m_p = ${c}^{${K.dp}} \\bmod ${K.p}$ (reduce $c$ mod $${K.p}$ first).`, answer: `${mp}`, accept: [], hint: powHint(c % K.p, K.dp, K.p) },
        { instruction: `Compute $m_q = ${c}^{${K.dq}} \\bmod ${K.q}$.`, answer: `${mq}`, accept: [], hint: powHint(c % K.q, K.dq, K.q) },
      ],
      finalAnswer: { value: `${mp}`, unit: "" },
      solutionNarrative: `$d_p = ${K.dp}$ and $d_q = ${K.dq}$, so $m \\equiv ${mp} \\pmod{${K.p}}$ and $m \\equiv ${mq} \\pmod{${K.q}}$. The CRT glues those into the plaintext $m = ${m}$ (check: $${m} \\bmod ${K.p} = ${m % K.p}$, $${m} \\bmod ${K.q} = ${m % K.q}$). Two half-size exponentiations with half-size exponents replace one full-size one, which is why real RSA decrypts roughly three to four times faster with CRT.`,
    };
  }
  throw new Error("cr7 rcrt-d1: no draw");
};

fill["cr7-rcrt-d2"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const K = rsaKey(rng, primesIn(11, 47), [3, 5, 7, 11, 13, 17]);
    if (K.dp < 2 || K.dq < 2) continue;
    const { m, c } = rsaMsg(rng, K), mp = powmod(c, K.dp, K.p), mq = powmod(c, K.dq, K.q);
    const qinv = modinv(K.q, K.p), h = mod(qinv * (mp - mq), K.p);
    if (qinv === 1) continue;
    return {
      id: `gen.cr7-rcrt-d2.${idx}`, generated: true, concepts: ["rsa-crt"], difficulty: 2, context: "abstract",
      prompt: `RSA-CRT private key: $p = ${K.p}$, $q = ${K.q}$, $d_p = ${K.dp}$, $d_q = ${K.dq}$ (public $n = ${K.n}$, $e = ${K.e}$). Decrypt $c = ${c}$ with Garner's recombination: $m_p = c^{d_p} \\bmod p$, $m_q = c^{d_q} \\bmod q$, $q_{\\text{inv}} = q^{-1} \\bmod p$, $h = q_{\\text{inv}} (m_p - m_q) \\bmod p$, and $m = m_q + hq$.`,
      steps: [
        { instruction: `Compute $m_p = ${c}^{${K.dp}} \\bmod ${K.p}$.`, answer: `${mp}`, accept: [], hint: powHint(c % K.p, K.dp, K.p) },
        { instruction: `Compute $m_q = ${c}^{${K.dq}} \\bmod ${K.q}$.`, answer: `${mq}`, accept: [], hint: powHint(c % K.q, K.dq, K.q) },
        { instruction: `Compute $q_{\\text{inv}} = ${K.q}^{-1} \\bmod ${K.p}$.`, answer: `${qinv}`, accept: [], hint: invHint(K.q, K.p) },
        { instruction: `Compute $h = ${qinv} \\cdot (${mp} - ${mq}) \\bmod ${K.p}$ (as a residue from $0$ to $${K.p - 1}$).`, answer: `${h}`, accept: [], hint: `$${qinv} \\cdot (${mp - mq}) = ${qinv * (mp - mq)}$, which is $${h}$ mod $${K.p}$.` },
        { instruction: `Compute $m = ${mq} + ${h} \\cdot ${K.q}$.`, answer: `${m}`, accept: [], hint: `Check: $${m}^{${K.e}} \\bmod ${K.n}$ should give back $c = ${c}$.` },
      ],
      finalAnswer: { value: `${m}`, unit: "" },
      solutionNarrative: `$m_p = ${mp}$, $m_q = ${mq}$, $q_{\\text{inv}} = ${qinv}$, $h = ${h}$, so $m = ${mq} + ${h} \\cdot ${K.q} = ${m}$. The formula is just the CRT lift: $m_q + hq$ is automatically $\\equiv m_q \\pmod q$, and $h$ is chosen so it is also $\\equiv m_p \\pmod p$. Real RSA private keys store exactly $p, q, d_p, d_q, q_{\\text{inv}}$ for this computation.`,
    };
  }
  throw new Error("cr7 rcrt-d2: no draw");
};

fill["cr7-rcrt-d3"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const K = rsaKey(rng, primesIn(11, 47), [3, 5, 7]);
    const { m } = rsaMsg(rng, K);
    const s = powmod(m, K.d, K.n), sp = s % K.p, sq = s % K.q;
    const spBad = mod(sp + rng.int(1, K.p - 1), K.p);
    const sf = crt2(sq, K.q, spBad, K.p).x; // correct mod q, wrong mod p
    const v = powmod(sf, K.e, K.n), D = mod(v - m, K.n), g = gcd(D, K.n);
    if (g !== K.q || sf === s) continue;
    return {
      id: `gen.cr7-rcrt-d3.${idx}`, generated: true, concepts: ["rsa-crt"], difficulty: 3, context: "applied",
      prompt: `A smart card signs with RSA-CRT. Public key: $n = ${K.n}$, $e = ${K.e}$. It signs the message $m = ${m}$, but a voltage glitch corrupts the mod-$p$ half of the computation, so it outputs the faulty signature $s' = ${sf}$ (right mod $q$, wrong mod $p$). You know only $n$, $e$, $m$ and $s'$.`,
      steps: [
        { instruction: `Compute $v = s'^{\\,e} \\bmod n = ${sf}^{${K.e}} \\bmod ${K.n}$.`, answer: `${v}`, accept: [], hint: powHint(sf, K.e, K.n) },
        { instruction: `Compute $D = (v - m) \\bmod n$, as a residue from $0$ to $${K.n - 1}$.`, answer: `${D}`, accept: [], hint: `$${v} - ${m} = ${v - m}$${v - m < 0 ? `; add $${K.n}$` : ""}.` },
        { instruction: `Compute $\\gcd(D, n) = \\gcd(${D}, ${K.n})$.`, answer: `${g}`, accept: [], hint: `$s'^{\\,e} \\equiv m \\pmod q$ but not mod $p$, so $D$ is a multiple of $q$ and not of $p$. Run Euclid.` },
        { instruction: `What is the other prime factor of $n$?`, answer: `${K.p}`, accept: [], hint: `$${K.n} / ${g}$.` },
        { instruction: `Would checking $s'^{\\,e} \\equiv m \\pmod n$ before releasing the signature have stopped this leak? (yes or no)`, answer: `yes`, accept: [], hint: `The faulty signature fails that check, so it would never leave the card.` },
      ],
      finalAnswer: { value: `${K.p}`, unit: "" },
      solutionNarrative: `$v = ${v}$, $D = ${D}$, and $\\gcd(${D}, ${K.n}) = ${g}$, so $n = ${K.p} \\cdot ${K.q}$ and the private key is gone. This is the Bellcore fault attack (Boneh, DeMillo and Lipton, 1997): ONE faulty RSA-CRT signature factors $n$. The standard defence is to verify every signature (or re-check the CRT halves) before output, which is why vetted libraries do exactly that.`,
    };
  }
  throw new Error("cr7 rcrt-d3: no draw");
};

// ============================================================================
// hastad-broadcast (e = 3, textbook RSA, no padding)
// ============================================================================

// Primes p = 2 (mod 3), so e = 3 is a valid RSA exponent for n = pq.
const P2 = [5, 11, 17, 23, 29, 41, 47, 53, 59, 71, 83, 89];
function hastadModuli(rng, k, lo, hi) {
  const cands = [];
  for (const p of P2) for (const q of P2) if (p < q && p * q >= lo && p * q <= hi) cands.push([p, q]);
  for (let t = 0; t < 5000; t++) {
    const used = new Set(), ns = [];
    for (let i = 0; i < k; i++) {
      const [p, q] = rng.pick(cands);
      if (used.has(p) || used.has(q)) break;
      used.add(p); used.add(q); ns.push(p * q);
    }
    if (ns.length === k) return ns;
  }
  throw new Error("cr7 hastad: no moduli");
}
// m with gcd(m, n_i) = 1, m < every n_i, and m^3 in (lower, upper).
function hastadMsg(rng, ns, lower, upper) {
  const lo = icbrt(lower) + 1, hi = Math.min(Math.min(...ns) - 1, icbrt(upper - 1));
  if (lo > hi) return null;
  for (let t = 0; t < 200; t++) {
    const m = rng.int(lo, hi);
    if (m ** 3 <= lower || m ** 3 >= upper || ns.some((n) => gcd(m, n) !== 1)) continue;
    const cs = ns.map((n) => powmod(m, 3, n));
    if (cs.some((c) => isCube(c))) continue; // every single ciphertext must have wrapped
    return { m, cs };
  }
  return null;
}
const ctTex = (ns, cs) => ns.map((n, i) => `$n_${i + 1} = ${n}$, $c_${i + 1} = ${cs[i]}$`).join("; ");

fill["cr7-hastad-d1"] = (rng, idx) => {
  for (let t = 0; t < 2000; t++) {
    const ns = hastadModuli(rng, 2, 30, 300), [n1, n2] = ns;
    const M = hastadMsg(rng, ns, Math.max(n1, n2), n1 * n2);
    if (!M) continue;
    const [c1, c2] = M.cs, S = crt2(c1, n1, c2, n2);
    if (S.inv === 1) continue;
    return {
      id: `gen.cr7-hastad-d1.${idx}`, generated: true, concepts: ["hastad-broadcast"], difficulty: 1, context: "abstract",
      prompt: `Textbook RSA with $e = 3$ and no padding. The same message $m$ went to two people: ${ctTex(ns, M.cs)}. Each ciphertext wrapped ($m^3 > n_i$, so neither $c_i$ is a perfect cube), but it happens that $m^3 < n_1 n_2 = ${n1 * n2}$. So the CRT value $C$ with $C \\equiv c_1 \\pmod{n_1}$, $C \\equiv c_2 \\pmod{n_2}$, $0 \\le C < n_1 n_2$, is exactly $m^3$. Lift: $C = c_1 + n_1 t$.`,
      steps: [
        { instruction: `Compute $n_1^{-1} \\bmod n_2 = ${n1}^{-1} \\bmod ${n2}$.`, answer: `${S.inv}`, accept: [], hint: invHint(n1, n2) },
        { instruction: `Compute $t = (c_2 - c_1) \\cdot ${S.inv} \\bmod ${n2}$.`, answer: `${S.t}`, accept: [], hint: `$(${c2} - ${c1}) \\cdot ${S.inv} = ${(c2 - c1) * S.inv}$, which is $${S.t}$ mod $${n2}$.` },
        { instruction: `Compute $C = ${c1} + ${n1} \\cdot ${S.t}$.`, answer: `${S.x}`, accept: [], hint: `Check: $${S.x} \\bmod ${n1} = ${S.x % n1}$ and $${S.x} \\bmod ${n2} = ${S.x % n2}$.` },
        { instruction: `Take the ordinary integer cube root: $m = \\sqrt[3]{${S.x}}$.`, answer: `${M.m}`, accept: [], hint: `$${M.m}^3 = ${M.m ** 3}$.` },
      ],
      finalAnswer: { value: `${M.m}`, unit: "" },
      solutionNarrative: `CRT gives $C = ${S.x}$, a perfect cube: $${M.m}^3 = ${M.m ** 3}$, so $m = ${M.m}$. Neither ciphertext alone revealed anything, but together they pin down $m^3$ as an integer, and integer cube roots are easy. No factoring happened.`,
    };
  }
  throw new Error("cr7 hastad-d1: no draw");
};

function hastad3(rng) {
  for (let t = 0; t < 4000; t++) {
    const ns = hastadModuli(rng, 3, 60, 400), [n1, n2, n3] = ns;
    const pairMax = Math.max(n1 * n2, n1 * n3, n2 * n3);
    const M = hastadMsg(rng, ns, pairMax, n1 * n2 * n3);
    if (!M) continue;
    const [c1, c2, c3] = M.cs, S12 = crt2(c1, n1, c2, n2), S = crt2(S12.x, n1 * n2, c3, n3);
    if (isCube(S12.x) || S.x !== M.m ** 3) continue;
    return { ns, cs: M.cs, m: M.m, x12: S12.x, S12, S, N: n1 * n2 * n3 };
  }
  throw new Error("cr7 hastad3: no draw");
}
const h3Prompt = (H) => `Textbook RSA with $e = 3$ and no padding. The same message $m$ went to three people with pairwise coprime moduli: ${ctTex(H.ns, H.cs)}. Since $m < n_i$ for each $i$, $m^3 < n_1 n_2 n_3 = ${H.N}$, so the CRT value $C$ ($C \\equiv c_i \\pmod{n_i}$, $0 \\le C < n_1 n_2 n_3$) is exactly $m^3$.`;
const x12Step = (H) => ({ instruction: `Combine the first two: find $x_{12}$ with $x_{12} \\equiv c_1 \\pmod{n_1}$, $x_{12} \\equiv c_2 \\pmod{n_2}$, $0 \\le x_{12} < ${H.ns[0] * H.ns[1]}$.`, answer: `${H.x12}`, accept: [], hint: `$x_{12} = ${H.cs[0]} + ${H.ns[0]}t$ with $t \\equiv (${H.cs[1]} - ${H.cs[0]}) \\cdot ${H.S12.inv} \\equiv ${H.S12.t} \\pmod{${H.ns[1]}}$ (since $${H.ns[0]}^{-1} \\equiv ${H.S12.inv} \\pmod{${H.ns[1]}}$).` });
const CStep = (H) => ({ instruction: `Fold in the third: find $C$ with $C \\equiv x_{12} \\pmod{${H.ns[0] * H.ns[1]}}$ and $C \\equiv c_3 \\pmod{n_3}$, $0 \\le C < ${H.N}$.`, answer: `${H.S.x}`, accept: [], hint: `$C = ${H.x12} + ${H.ns[0] * H.ns[1]}s$ with $s \\equiv (${H.cs[2]} - ${H.x12}) \\cdot ${H.S.inv} \\equiv ${H.S.t} \\pmod{${H.ns[2]}}$ (since $${H.ns[0] * H.ns[1]}^{-1} \\equiv ${H.S.inv} \\pmod{${H.ns[2]}}$).` });
const mStep = (H) => ({ instruction: `Take the integer cube root: $m = \\sqrt[3]{C}$.`, answer: `${H.m}`, accept: [], hint: `$${H.m}^3 = ${H.m ** 3}$.` });

fill["cr7-hastad-d2"] = (rng, idx) => {
  const H = hastad3(rng);
  return {
    id: `gen.cr7-hastad-d2.${idx}`, generated: true, concepts: ["hastad-broadcast"], difficulty: 2, context: "abstract",
    prompt: h3Prompt(H),
    steps: [
      x12Step(H),
      { instruction: `Is $x_{12} = ${H.x12}$ a perfect cube? (yes or no)`, answer: `no`, accept: [], hint: `$${icbrt(H.x12)}^3 = ${icbrt(H.x12) ** 3}$ and $${icbrt(H.x12) + 1}^3 = ${(icbrt(H.x12) + 1) ** 3}$. Here $m^3$ is bigger than $n_1 n_2$, so two ciphertexts only give $m^3 \\bmod n_1 n_2$.` },
      CStep(H), mStep(H),
    ],
    finalAnswer: { value: `${H.m}`, unit: "" },
    solutionNarrative: `Two ciphertexts give $x_{12} = ${H.x12} = m^3 \\bmod ${H.ns[0] * H.ns[1]}$, which is not a cube because $m^3$ wrapped past $n_1 n_2$. The third modulus pushes the CRT range to $${H.N} > m^3$, so $C = ${H.S.x} = ${H.m}^3$ and $m = ${H.m}$. This is Håstad's broadcast attack.`,
  };
};

fill["cr7-hastad-d3"] = (rng, idx) => {
  const H = hastad3(rng), E = rng.pick([5, 7, 17]);
  return {
    id: `gen.cr7-hastad-d3.${idx}`, generated: true, concepts: ["hastad-broadcast"], difficulty: 3, context: "applied",
    prompt: h3Prompt(H),
    steps: [
      x12Step(H), CStep(H), mStep(H),
      { instruction: `The attack needs $n_1 n_2 \\cdots n_k > m^e$. If $m$ is nearly as large as each modulus, how many ciphertexts of the same message does the attacker need when $e = ${E}$?`, answer: `${E}`, accept: [], hint: `Each modulus is only a little bigger than $m$, so you need about one modulus per factor of $m$ in $m^e$.` },
      { instruction: `Suppose each ciphertext had used OAEP, with fresh random padding every time. Would the CRT result still be a perfect cube $m^3$? (yes or no)`, answer: `no`, accept: [], hint: `With random padding the three people received three DIFFERENT padded numbers, so there is no single $m^3$ to recover.` },
    ],
    finalAnswer: { value: `${H.m}`, unit: "" },
    solutionNarrative: `CRT gives $C = ${H.S.x} = ${H.m}^3$, so $m = ${H.m}$. In general the attacker needs about $e$ ciphertexts (here $e = ${E}$ would need ${E}), which is one reason $e = 65537$ became the default. The real fix is padding: OAEP randomizes every encryption, so the recipients get unrelated numbers and the CRT result is meaningless. (Håstad also showed that a fixed, known padding per recipient, such as appending a user ID, does NOT help once the attacker has enough ciphertexts.)`,
  };
};

// ============================================================================
// fermat-factoring
// ============================================================================

function fermatDraw(rng, lo, hi, gapMax, itMin, itMax) {
  const ps = primesIn(lo, hi);
  for (let t = 0; t < 4000; t++) {
    const p = rng.pick(ps), qs = ps.filter((q) => q > p && q - p <= gapMax);
    if (!qs.length) continue;
    const q = rng.pick(qs), n = p * q, a0 = ceilSqrt(n);
    if (a0 * a0 === n) continue;
    let a = a0; while (!isSquare(a * a - n)) a++;
    const iters = a - a0 + 1;
    if (iters < itMin || iters > itMax) continue;
    return { p, q, n, a0, a, b: isqrt(a * a - n), iters };
  }
  throw new Error("cr7 fermat: no draw");
}
const FERMAT_HOW = `Fermat's method: look for $a \\ge \\sqrt{n}$ with $a^2 - n = b^2$ a perfect square; then $n = a^2 - b^2 = (a - b)(a + b)$. Start at $a = \\lceil \\sqrt{n} \\rceil$ and step $a$ up by 1.`;
const tryList = (F) => { const out = []; for (let a = F.a0; a <= F.a; a++) out.push(`$${a}^2 - ${F.n} = ${a * a - F.n}$${a === F.a ? ` $= ${F.b}^2$` : ""}`); return out.join(SEP); };

fill["cr7-fermat-d1"] = (rng, idx) => {
  const F = fermatDraw(rng, 31, 199, 20, 1, 1);
  return {
    id: `gen.cr7-fermat-d1.${idx}`, generated: true, concepts: ["fermat-factoring"], difficulty: 1, context: "abstract",
    prompt: `Factor $n = ${F.n}$, a product of two primes that are close together. ${FERMAT_HOW} For this $n$ the very first $a$ works.`,
    steps: [
      { instruction: `Compute $a = \\lceil \\sqrt{${F.n}} \\rceil$.`, answer: `${F.a0}`, accept: [], hint: `$${F.a0 - 1}^2 = ${(F.a0 - 1) ** 2} < ${F.n} < ${F.a0 ** 2} = ${F.a0}^2$.` },
      { instruction: `Compute $a^2 - n$.`, answer: `${F.a0 * F.a0 - F.n}`, accept: [], hint: `$${F.a0 * F.a0} - ${F.n}$.` },
      { instruction: `That is $b^2$. What is $b$?`, answer: `${F.b}`, accept: [], hint: `$${F.b}^2 = ${F.b * F.b}$.` },
      { instruction: `What is the smaller prime factor, $a - b$?`, answer: `${F.p}`, accept: [], hint: `$${F.a} - ${F.b}$.` },
      { instruction: `What is the larger prime factor, $a + b$?`, answer: `${F.q}`, accept: [], hint: `$${F.a} + ${F.b}$; check that the product is $${F.n}$.` },
    ],
    finalAnswer: { value: `${F.p}`, unit: "" },
    solutionNarrative: `$a = ${F.a}$, $a^2 - n = ${F.b * F.b} = ${F.b}^2$, so $${F.n} = (${F.a} - ${F.b})(${F.a} + ${F.b}) = ${F.p} \\cdot ${F.q}$. When $p$ and $q$ are close, $a = (p + q)/2$ sits just above $\\sqrt n$ and $b = (q - p)/2$ is small, so the search ends almost at once.`,
  };
};

fill["cr7-fermat-d2"] = (rng, idx) => {
  const F = fermatDraw(rng, 101, 499, 150, 2, 4);
  return {
    id: `gen.cr7-fermat-d2.${idx}`, generated: true, concepts: ["fermat-factoring"], difficulty: 2, context: "abstract",
    prompt: `Factor $n = ${F.n}$ (a product of two fairly close primes). ${FERMAT_HOW}`,
    steps: [
      { instruction: `Compute the starting value $a = \\lceil \\sqrt{${F.n}} \\rceil$.`, answer: `${F.a0}`, accept: [], hint: `$\\sqrt{${F.n}} \\approx ${Math.sqrt(F.n).toFixed(2)}$.` },
      { instruction: `Step $a$ up until $a^2 - n$ is a perfect square. Which $a$ works first?`, answer: `${F.a}`, accept: [], hint: tryList(F) + "." },
      { instruction: `What is $b = \\sqrt{a^2 - n}$?`, answer: `${F.b}`, accept: [], hint: `$${F.a}^2 - ${F.n} = ${F.b * F.b}$.` },
      { instruction: `What is the smaller factor $a - b$?`, answer: `${F.p}`, accept: [], hint: `$${F.a} - ${F.b}$.` },
      { instruction: `What is the larger factor $a + b$?`, answer: `${F.q}`, accept: [], hint: `$${F.a} + ${F.b}$.` },
    ],
    finalAnswer: { value: `${F.p}`, unit: "" },
    solutionNarrative: `Trying ${tryList(F)} gives $a = ${F.a}$ and $b = ${F.b}$, so $${F.n} = ${F.p} \\cdot ${F.q}$ after ${F.iters} tries. The number of tries grows roughly like $(q - p)^2 / (8\\sqrt n)$, so it is tiny when the primes are close and hopeless when they are far apart.`,
  };
};

fill["cr7-fermat-d3"] = (rng, idx) => {
  for (let t = 0; t < 1000; t++) {
    const F = fermatDraw(rng, 41, 151, 16, 1, 2);
    const phi = (F.p - 1) * (F.q - 1), e = rng.pick([3, 5, 7, 11, 13, 17]);
    if (gcd(e, phi) !== 1) continue;
    const d = modinv(e, phi);
    if (d === e) continue;
    return {
      id: `gen.cr7-fermat-d3.${idx}`, generated: true, concepts: ["fermat-factoring"], difficulty: 3, context: "applied",
      prompt: `A buggy RSA key generator picked a random prime $p$ and then searched upward from it for $q$, so the two primes are close. Public key: $n = ${F.n}$, $e = ${e}$. ${FERMAT_HOW} Then rebuild the private key.`,
      steps: [
        { instruction: `Which $a$ first makes $a^2 - n$ a perfect square?`, answer: `${F.a}`, accept: [], hint: tryList(F) + "." },
        { instruction: `What is the smaller prime $p = a - b$?`, answer: `${F.p}`, accept: [], hint: `$b = ${F.b}$.` },
        { instruction: `What is the larger prime $q = a + b$?`, answer: `${F.q}`, accept: [], hint: `$${F.a} + ${F.b}$.` },
        { instruction: `Compute $\\varphi(n) = (p - 1)(q - 1)$.`, answer: `${phi}`, accept: [], hint: `$${F.p - 1} \\cdot ${F.q - 1}$.` },
        { instruction: `Compute the private exponent $d = e^{-1} \\bmod \\varphi(n)$.`, answer: `${d}`, accept: [], hint: invHint(e, phi) },
      ],
      finalAnswer: { value: `${d}`, unit: "" },
      solutionNarrative: `$a = ${F.a}$, $b = ${F.b}$, so $n = ${F.p} \\cdot ${F.q}$, $\\varphi = ${phi}$ and $d = ${d}$. This is not hypothetical: in 2022 Hanno Böck found printers whose RSA keys were generated this way (CVE-2022-26320) and factored them with Fermat's method in seconds. FIPS 186 key generation requires $|p - q| > 2^{\\text{bits}/2 - 100}$ for exactly this reason.`,
    };
  }
  throw new Error("cr7 fermat-d3: no draw");
};
