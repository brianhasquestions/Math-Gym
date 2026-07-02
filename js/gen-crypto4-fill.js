// gen-crypto4-fill.js
// Parametric generators for the Cryptography capstone topic:
//   content/cryptography/crypto-weaknesses.json  (cr4-*)
// "How Cryptography Breaks: Attacks and Misuse" — the MATH of why real
// deployments fail: keystream/nonce reuse, ECB structure leakage, ECDSA nonce
// reuse (the PS3 break), and textbook-RSA misuse (small-e cube root, shared
// prime via gcd).
//
// Self-contained: exports a `fill` map of template-name -> generator fn,
// matching the registry shape in js/generator.js (merged via Object.assign).
// Deterministic from the passed rng. Every value is computed by construction —
// the secret (key / nonce / private scalar / prime) is chosen FIRST and the
// attacker's inputs are built backward from it, so each recovered answer is
// exactly the planted secret and self-checks against the real grader.
//
// One generator per concept per difficulty tier (12 total):
//   keystream-reuse   : cr4-ksr-d1 / -d2 / -d3
//   ecb-patterns      : cr4-ecb-d1 / -d2 / -d3
//   ecdsa-nonce-reuse : cr4-ecdsa-d1 / -d2 / -d3
//   rsa-misuse        : cr4-rsa-d1 / -d2 / -d3

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const egcd = (a, b) => { if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; };
const modinv = (a, m) => { a = ((a % m) + m) % m; const [g, x] = egcd(a, m); return g !== 1 ? null : ((x % m) + m) % m; };
const mod = (a, m) => (((a % m) + m) % m);
const bin8 = (n) => n.toString(2).padStart(8, "0");
const bin4 = (n) => n.toString(2).padStart(4, "0");

export const fill = {};

// ============================================================================
// keystream-reuse : two-time pad / nonce reuse.  C1 = M1^K, C2 = M2^K, so
// C1^C2 = M1^M2 (the key cancels); a crib M1 then recovers K and M2.
// ============================================================================

// d1 — 4-bit nibbles: recover the reused key from one known plaintext.
fill["cr4-ksr-d1"] = (rng, idx) => {
  const K = rng.int(1, 15);
  let M1 = rng.int(1, 15), M2 = rng.int(1, 15);
  if (M2 === M1) M2 = M2 ^ 1 || 2;               // keep the two messages distinct
  const C1 = M1 ^ K, C2 = M2 ^ K;
  const xC = C1 ^ C2;                             // = M1 ^ M2
  return {
    id: `gen.cr4-ksr-d1.${idx}`, generated: true, concepts: ["keystream-reuse"], difficulty: 1, context: "applied",
    prompt: `A stream cipher reused its keystream nibble $K$ on two messages: $C_1 = M_1 \\oplus K = ${C1}$ and $C_2 = M_2 \\oplus K = ${C2}$ (4-bit values). You know the first message was $M_1 = ${M1}$. Recover the key. (All answers in decimal.)`,
    steps: [
      { instruction: `Compute $C_1 \\oplus C_2 = ${C1} \\oplus ${C2}$. (This equals $M_1 \\oplus M_2$ — the key cancels.)`, answer: `${xC}`, accept: [bin4(xC)], hint: `$${bin4(C1)} \\oplus ${bin4(C2)}$, column by column.` },
      { instruction: `Recover the key: $K = C_1 \\oplus M_1 = ${C1} \\oplus ${M1}$.`, answer: `${K}`, accept: [bin4(K)], hint: `$${bin4(C1)} \\oplus ${bin4(M1)}$.` },
    ],
    finalAnswer: { value: `${K}`, unit: "" },
    solutionNarrative: `Reusing one keystream makes $C_1 \\oplus C_2 = ${xC} = M_1 \\oplus M_2$. A single known message then peels off the key: $K = ${C1} \\oplus ${M1} = ${K}$.`,
  };
};

// d2 — full bytes: recover K, then the second message M2.
fill["cr4-ksr-d2"] = (rng, idx) => {
  const K = rng.int(1, 255);
  let M1 = rng.int(1, 255), M2 = rng.int(1, 255);
  if (M2 === M1) M2 = M2 ^ 1;
  const C1 = M1 ^ K, C2 = M2 ^ K;
  const xC = C1 ^ C2;
  return {
    id: `gen.cr4-ksr-d2.${idx}`, generated: true, concepts: ["keystream-reuse"], difficulty: 2, context: "applied",
    prompt: `AES-CTR was run twice with the SAME nonce, so both messages were XORed with the same keystream byte $K$: $C_1 = ${C1}$ and $C_2 = ${C2}$. A predictable header reveals $M_1 = ${M1}$. Recover the key byte and the second message. (Decimal.)`,
    steps: [
      { instruction: `Compute $C_1 \\oplus C_2 = ${C1} \\oplus ${C2}$ (which is $M_1 \\oplus M_2$).`, answer: `${xC}`, accept: [bin8(xC)], hint: `$${bin8(C1)} \\oplus ${bin8(C2)}$.` },
      { instruction: `Recover the key: $K = C_1 \\oplus M_1 = ${C1} \\oplus ${M1}$.`, answer: `${K}`, accept: [bin8(K)], hint: `$${bin8(C1)} \\oplus ${bin8(M1)}$.` },
      { instruction: `Recover the second message: $M_2 = C_2 \\oplus K = ${C2} \\oplus ${K}$.`, answer: `${M2}`, accept: [bin8(M2)], hint: `Also equals $M_1 \\oplus (C_1 \\oplus C_2) = ${M1} \\oplus ${xC}$.` },
    ],
    finalAnswer: { value: `${M2}`, unit: "" },
    solutionNarrative: `The reused keystream cancels: $C_1 \\oplus C_2 = ${xC}$. Then $K = ${C1} \\oplus ${M1} = ${K}$ and $M_2 = ${C2} \\oplus ${K} = ${M2}$. Nonce reuse turns CTR/GCM into a broken two-time pad.`,
  };
};

// d3 — recover K and M2, then reason about the GCM wear-out bound (2^36 - 32).
fill["cr4-ksr-d3"] = (rng, idx) => {
  const K = rng.int(1, 255);
  let M1 = rng.int(1, 255), M2 = rng.int(1, 255);
  if (M2 === M1) M2 = M2 ^ 1;
  const C1 = M1 ^ K, C2 = M2 ^ K;
  const xC = C1 ^ C2;
  return {
    id: `gen.cr4-ksr-d3.${idx}`, generated: true, concepts: ["keystream-reuse"], difficulty: 3, context: "applied",
    prompt: `Two AES-GCM ciphertexts share a nonce: $C_1 = ${C1}$, $C_2 = ${C2}$; a known header gives $M_1 = ${M1}$. Break the pair, then recall GCM's separate SAFETY limit: at most $2^{36}-32$ bytes may be encrypted under one key/nonce pair. (Decimal.)`,
    steps: [
      { instruction: `Cancel the keystream: $C_1 \\oplus C_2 = ${C1} \\oplus ${C2}$.`, answer: `${xC}`, accept: [bin8(xC)], hint: `This is $M_1 \\oplus M_2$; the shared keystream drops out.` },
      { instruction: `Recover the second message directly: $M_2 = M_1 \\oplus (C_1 \\oplus C_2) = ${M1} \\oplus ${xC}$.`, answer: `${M2}`, accept: [bin8(M2)], hint: `$${bin8(M1)} \\oplus ${bin8(xC)}$.` },
      { instruction: `Recover the keystream byte $K = C_1 \\oplus M_1 = ${C1} \\oplus ${M1}$.`, answer: `${K}`, accept: [bin8(K)], hint: `Once $M_1$ is known, $C_1 \\oplus M_1$ strips the mask.` },
      { instruction: `The wear-out limit is $2^{36} - 32$ bytes. Compute that number.`, answer: `68719476704`, accept: [], hint: `$2^{36} = 68719476736$; subtract 32.` },
    ],
    finalAnswer: { value: `${M2}`, unit: "" },
    solutionNarrative: `$C_1 \\oplus C_2 = ${xC} = M_1 \\oplus M_2$, so $M_2 = ${M1} \\oplus ${xC} = ${M2}$ and $K = ${C1} \\oplus ${M1} = ${K}$. Even with UNIQUE nonces, GCM still wears out at $2^{36}-32 = 68719476704$ bytes per key/nonce pair — see Soatok, "Comparison of Symmetric Encryption Methods".`,
  };
};

// ============================================================================
// ecb-patterns : ECB encrypts each block independently, so identical plaintext
// blocks become identical ciphertext blocks — structure leaks (the "ECB
// penguin"). We count distinct blocks, repeats, and how many blocks leak.
// ============================================================================

// Build a block sequence from labels with a controlled repeat structure.
function ecbStats(labels) {
  const counts = new Map();
  labels.forEach((b) => counts.set(b, (counts.get(b) || 0) + 1));
  const distinct = counts.size;
  const repeatedGroups = [...counts.values()].filter((v) => v > 1).length;
  const leaked = [...counts.values()].filter((v) => v > 1).reduce((s, v) => s + v, 0);
  return { N: labels.length, distinct, repeatedGroups, leaked };
}

// d1 — short block stream with one repeated block.
fill["cr4-ecb-d1"] = (rng, idx) => {
  // Two identical blocks A plus two distinct singles; shuffle positions a little.
  const arrangements = [
    ["A", "B", "A", "C"], ["A", "B", "C", "A"], ["B", "A", "C", "A"], ["A", "A", "B", "C"],
  ];
  const labels = rng.pick(arrangements);
  const st = ecbStats(labels);
  const disp = labels.map((l, i) => `${["c1", "c2", "c3", "c4"][i]}=${l === "A" ? "9F" : l === "B" ? "3C" : "D1"}`);
  return {
    id: `gen.cr4-ecb-d1.${idx}`, generated: true, concepts: ["ecb-patterns"], difficulty: 1, context: "applied",
    prompt: `In ECB mode, equal plaintext blocks encrypt to equal ciphertext blocks. A ${st.N}-block message produced these ciphertext blocks: ${disp.join(", ")}. (Blocks with the same hex value came from the same plaintext.)`,
    steps: [
      { instruction: `How many DISTINCT ciphertext block values appear?`, answer: `${st.distinct}`, accept: [], hint: `Count the different hex values.` },
      { instruction: `The value 9F appears twice, so how many of the ${st.N} blocks are proven identical to another? (Count both copies.)`, answer: `2`, accept: [], hint: `Two blocks share the value 9F.` },
    ],
    finalAnswer: { value: `2`, unit: "blocks" },
    solutionNarrative: `The repeated value 9F betrays two identical plaintext blocks — ${st.distinct} distinct values across ${st.N} blocks. ECB never hides where a message repeats itself.`,
  };
};

// d2 — larger stream, two repeated groups; count leaked blocks.
fill["cr4-ecb-d2"] = (rng, idx) => {
  const arrangements = [
    ["P", "Q", "P", "Q", "R", "P"], ["P", "P", "Q", "R", "Q", "P"], ["Q", "P", "R", "P", "Q", "P"],
  ];
  const labels = rng.pick(arrangements);
  const st = ecbStats(labels);           // N=6, distinct=3, leaked=5 (P thrice + Q twice), R once
  const hex = { P: "A1", Q: "7E", R: "C4" };
  const disp = labels.map((l) => hex[l]).join(" ");
  return {
    id: `gen.cr4-ecb-d2.${idx}`, generated: true, concepts: ["ecb-patterns"], difficulty: 2, context: "applied",
    prompt: `An image encrypted with AES in ECB mode gives this ${st.N}-block ciphertext stream (by block value): ${disp}. Identical values mean identical plaintext blocks. Analyze the leak.`,
    steps: [
      { instruction: `How many DISTINCT block values are there?`, answer: `${st.distinct}`, accept: [], hint: `Count the different hex values in the stream.` },
      { instruction: `A1 appears 3 times and 7E appears 2 times. How many blocks in total belong to a repeated group? (Add those copies: 3 + 2.)`, answer: `${st.leaked}`, accept: [], hint: `3 copies of A1 plus 2 copies of 7E.` },
      { instruction: `How many blocks are UNIQUE (appear exactly once), and therefore leak no repeat? (Only C4.)`, answer: `1`, accept: [], hint: `${st.N} total minus ${st.leaked} in repeated groups.` },
    ],
    finalAnswer: { value: `${st.leaked}`, unit: "blocks" },
    solutionNarrative: `${st.distinct} distinct values; A1 (×3) and 7E (×2) put ${st.leaked} of the ${st.N} blocks into visible repeat groups, with only C4 unique. This is exactly why the "ECB penguin" is still recognizable after encryption.`,
  };
};

// d3 — penguin arithmetic: a flat region of identical plaintext blocks.
fill["cr4-ecb-d3"] = (rng, idx) => {
  const total = rng.pick([12, 16, 20, 24]);        // total blocks in the image
  const flat = rng.int(4, total - 3);              // identical background blocks
  const rest = total - flat;                       // varied foreground blocks, all distinct
  const distinct = 1 + rest;                       // one background value + rest distinct
  return {
    id: `gen.cr4-ecb-d3.${idx}`, generated: true, concepts: ["ecb-patterns"], difficulty: 3, context: "applied",
    prompt: `A ${total}-block bitmap has a flat background: ${flat} of its blocks are byte-identical (same solid color), and the remaining ${rest} foreground blocks are all different from each other and from the background. It is encrypted with AES-ECB.`,
    steps: [
      { instruction: `The ${flat} identical background blocks all encrypt to the SAME ciphertext value. How many distinct ciphertext values does the full image have in total?`, answer: `${distinct}`, accept: [], hint: `One value for the whole background, plus ${rest} distinct foreground values.` },
      { instruction: `How many of the ${total} ciphertext blocks are visibly part of the background repeat group?`, answer: `${flat}`, accept: [], hint: `Exactly the identical background blocks.` },
      { instruction: `A secure (randomized) mode would make all ${total} blocks look distinct. How many MORE distinct values would that be than ECB gives here? (${total} minus your first answer.)`, answer: `${total - distinct}`, accept: [], hint: `$${total} - ${distinct}$.` },
    ],
    finalAnswer: { value: `${distinct}`, unit: "distinct blocks" },
    solutionNarrative: `ECB collapses the ${flat}-block background to a single repeated ciphertext value, giving only ${distinct} distinct blocks instead of ${total}. The outline of the image survives encryption — the failure is structural, not a math bug in AES.`,
  };
};

// ============================================================================
// ecdsa-nonce-reuse : two signatures (r, s1), (r, s2) sharing the nonce k on
// message hashes z1, z2 recover the private key.  s = k^-1 (z + r d) mod n, so
//   k = (z1 - z2) / (s1 - s2) mod n,   d = (s1 k - z1) / r mod n.
// Construction: pick n, d, k, r, z1, z2 first; derive s1, s2; recovery returns
// exactly the planted d.  (The Sony PS3 break.)
// ============================================================================

function ecdsaCase(rng, tier) {
  // small prime "order" n; keep everything invertible and s1 != s2
  const pools = { 1: [11, 13], 2: [17, 19], 3: [23, 29] };
  for (let tries = 0; tries < 200; tries++) {
    const n = rng.pick(pools[tier]);
    const d = rng.int(2, n - 2);
    const k = rng.int(2, n - 2);
    const r = rng.int(2, n - 2);
    const z1 = rng.int(1, n - 1);
    let z2 = rng.int(1, n - 1);
    if (z2 === z1) continue;
    const kinv = modinv(k, n);
    if (kinv == null) continue;
    const s1 = mod(kinv * mod(z1 + r * d, n), n);
    const s2 = mod(kinv * mod(z2 + r * d, n), n);
    if (s1 === 0 || s2 === 0 || s1 === s2) continue;
    const sdiff = mod(s1 - s2, n), zdiff = mod(z1 - z2, n);
    const sdinv = modinv(sdiff, n), rinv = modinv(r, n);
    if (sdinv == null || rinv == null) continue;
    const kRec = mod(zdiff * sdinv, n);
    const dRec = mod(mod(s1 * kRec - z1, n) * rinv, n);
    if (kRec !== k || dRec !== d) continue;       // safety: must reconstruct the planted secret
    return { n, d, k, r, z1, z2, s1, s2, sdiff, zdiff, kRec, dRec };
  }
  // deterministic fallback (verified by /tmp compute): n=11,d=3,k=4,r=5,z1=6,z2=2
  return { n: 11, d: 3, k: 4, r: 5, z1: 6, z2: 2, s1: 8, s2: 7, sdiff: 1, zdiff: 4, kRec: 4, dRec: 3 };
}

// d1 — recover the shared nonce k.
fill["cr4-ecdsa-d1"] = (rng, idx) => {
  const c = ecdsaCase(rng, 1);
  return {
    id: `gen.cr4-ecdsa-d1.${idx}`, generated: true, concepts: ["ecdsa-nonce-reuse"], difficulty: 1, context: "applied",
    prompt: `Two ECDSA signatures (order $n = ${c.n}$) reused the same nonce $k$, so they share $r = ${c.r}$: $(r, s_1) = (${c.r}, ${c.s1})$ on hash $z_1 = ${c.z1}$, and $(r, s_2) = (${c.r}, ${c.s2})$ on hash $z_2 = ${c.z2}$. Recover the nonce $k = (z_1 - z_2)(s_1 - s_2)^{-1} \\bmod ${c.n}$.`,
    steps: [
      { instruction: `Compute $z_1 - z_2 \\bmod ${c.n}$ (i.e. $${c.z1} - ${c.z2}$).`, answer: `${c.zdiff}`, accept: [], hint: `Reduce the difference into $0..${c.n - 1}$.` },
      { instruction: `Compute $s_1 - s_2 \\bmod ${c.n}$ (i.e. $${c.s1} - ${c.s2}$).`, answer: `${c.sdiff}`, accept: [], hint: `Add ${c.n} if the difference is negative.` },
      { instruction: `Recover $k = (z_1 - z_2)(s_1 - s_2)^{-1} = ${c.zdiff} \\cdot ${c.sdiff}^{-1} \\bmod ${c.n}$.`, answer: `${c.k}`, accept: [], hint: `Find the inverse of ${c.sdiff} mod ${c.n}, then multiply by ${c.zdiff}.` },
    ],
    finalAnswer: { value: `${c.k}`, unit: "" },
    solutionNarrative: `Because $s = k^{-1}(z + rd)$, the difference $s_1 - s_2 = k^{-1}(z_1 - z_2)$, so $k = (z_1 - z_2)/(s_1 - s_2) = ${c.k} \\bmod ${c.n}$. Reused nonces hand the attacker $k$ for free.`,
  };
};

// d2 — recover k, then the private key d.
fill["cr4-ecdsa-d2"] = (rng, idx) => {
  const c = ecdsaCase(rng, 2);
  const rinv = modinv(c.r, c.n);
  const skz = mod(c.s1 * c.k - c.z1, c.n);
  return {
    id: `gen.cr4-ecdsa-d2.${idx}`, generated: true, concepts: ["ecdsa-nonce-reuse"], difficulty: 2, context: "applied",
    prompt: `An ECDSA signer (order $n = ${c.n}$) reused a nonce across two signatures sharing $r = ${c.r}$: $s_1 = ${c.s1}$ on $z_1 = ${c.z1}$, $s_2 = ${c.s2}$ on $z_2 = ${c.z2}$. Recover the nonce, then the PRIVATE key $d$.`,
    steps: [
      { instruction: `Recover the nonce $k = (z_1 - z_2)(s_1 - s_2)^{-1} \\bmod ${c.n}$. (Here $z_1 - z_2 \\equiv ${c.zdiff}$, $s_1 - s_2 \\equiv ${c.sdiff}$.)`, answer: `${c.k}`, accept: [], hint: `Invert ${c.sdiff} mod ${c.n}, multiply by ${c.zdiff}.` },
      { instruction: `Compute $s_1 k - z_1 \\bmod ${c.n}$ (i.e. $${c.s1}\\cdot${c.k} - ${c.z1}$).`, answer: `${skz}`, accept: [], hint: `$${c.s1 * c.k} - ${c.z1} = ${c.s1 * c.k - c.z1}$, then reduce mod ${c.n}.` },
      { instruction: `Recover the private key $d = (s_1 k - z_1) \\cdot r^{-1} = ${skz} \\cdot ${c.r}^{-1} \\bmod ${c.n}$.`, answer: `${c.d}`, accept: [], hint: `$r^{-1} = ${rinv} \\bmod ${c.n}$; multiply.` },
    ],
    finalAnswer: { value: `${c.d}`, unit: "" },
    solutionNarrative: `From $s_1 = k^{-1}(z_1 + rd)$ we get $d = (s_1 k - z_1)/r = ${c.d} \\bmod ${c.n}$. This is exactly the Sony PS3 break — reused nonces exposed the master signing key. See Soatok, "Guidance for Choosing an Elliptic Curve Signature Algorithm in 2022".`,
  };
};

// d3 — full recovery and contrast with Ed25519's deterministic nonces.
fill["cr4-ecdsa-d3"] = (rng, idx) => {
  const c = ecdsaCase(rng, 3);
  const rinv = modinv(c.r, c.n);
  const skz = mod(c.s1 * c.k - c.z1, c.n);
  return {
    id: `gen.cr4-ecdsa-d3.${idx}`, generated: true, concepts: ["ecdsa-nonce-reuse"], difficulty: 3, context: "applied",
    prompt: `Full ECDSA key recovery (order $n = ${c.n}$). Two signatures reuse the nonce, sharing $r = ${c.r}$: $s_1 = ${c.s1}$ on $z_1 = ${c.z1}$, $s_2 = ${c.s2}$ on $z_2 = ${c.z2}$. Recover $k$ and $d$, then note the fix.`,
    steps: [
      { instruction: `Compute the differences mod ${c.n}: give $z_1 - z_2$.`, answer: `${c.zdiff}`, accept: [], hint: `$${c.z1} - ${c.z2}$, reduced into $0..${c.n - 1}$.` },
      { instruction: `Give $s_1 - s_2 \\bmod ${c.n}$.`, answer: `${c.sdiff}`, accept: [], hint: `Add ${c.n} if negative.` },
      { instruction: `Recover $k = (z_1 - z_2)(s_1 - s_2)^{-1} \\bmod ${c.n}$.`, answer: `${c.k}`, accept: [], hint: `Invert ${c.sdiff} mod ${c.n}, multiply by ${c.zdiff}.` },
      { instruction: `Recover the private key $d = (s_1 k - z_1) r^{-1} \\bmod ${c.n}$. (Note $s_1 k - z_1 \\equiv ${skz}$, $r^{-1} \\equiv ${rinv}$.)`, answer: `${c.d}`, accept: [], hint: `$${skz} \\cdot ${rinv} \\bmod ${c.n}$.` },
      { instruction: `Ed25519 derives $k$ deterministically from the key and message, so two signatures on different messages CANNOT share a nonce. Under Ed25519, how many private keys does this reuse attack recover? (A number.)`, answer: `0`, accept: ["none", "zero"], hint: `Deterministic nonces make the reuse condition impossible.` },
    ],
    finalAnswer: { value: `${c.d}`, unit: "" },
    solutionNarrative: `$k = ${c.k}$ and $d = (s_1 k - z_1)/r = ${c.d} \\bmod ${c.n}$ — total compromise from one repeated nonce. Ed25519's deterministic nonces make this recover 0 keys, which is why Soatok's ECC guidance recommends it over ECDSA.`,
  };
};

// ============================================================================
// rsa-misuse : textbook-RSA failures.
//   (a) small-e (e=3) no padding, small m: c = m^3 unreduced, so m = cbrt(c).
//   (b) shared prime: gcd(n1, n2) recovers the common factor (Euclid).
// ============================================================================

// d1 — small-e cube root recovery (m = 2..6, so m^3 < any real n).
fill["cr4-rsa-d1"] = (rng, idx) => {
  const m = rng.int(2, 6);
  const c = m * m * m;
  return {
    id: `gen.cr4-rsa-d1.${idx}`, generated: true, concepts: ["rsa-misuse"], difficulty: 1, context: "applied",
    prompt: `A system uses textbook RSA with public exponent $e = 3$ and NO padding. A small message $m$ was encrypted as $c = m^3 \\bmod n$, but $m$ was so small that $m^3 < n$ — so no wraparound happened and $c = ${c}$ exactly. Recover $m$.`,
    steps: [
      { instruction: `Since $c = m^3$ was never reduced, recover $m$ as the integer cube root of $c = ${c}$. What is $m$?`, answer: `${m}`, accept: [], hint: `What integer cubed gives ${c}? ($${m - 1}^3 = ${(m - 1) ** 3}$, $${m}^3 = ${c}$.)` },
    ],
    finalAnswer: { value: `${m}`, unit: "" },
    solutionNarrative: `With $e = 3$, no padding, and $m^3 < n$, the ciphertext is a plain cube: $m = \\sqrt[3]{${c}} = ${m}$. Padding (OAEP) exists precisely to stop this — see Soatok, "How To Learn Cryptography as a Programmer".`,
  };
};

// d2 — shared prime via gcd; recover the common prime factor.
fill["cr4-rsa-d2"] = (rng, idx) => {
  const p = rng.pick([5, 7, 11]);
  const others = [13, 17, 19, 23].filter((x) => x !== p);
  let q1 = rng.pick(others), q2 = rng.pick(others.filter((x) => x !== q1));
  const n1 = p * q1, n2 = p * q2;
  return {
    id: `gen.cr4-rsa-d2.${idx}`, generated: true, concepts: ["rsa-misuse"], difficulty: 2, context: "applied",
    prompt: `Two RSA public moduli were generated with a weak random source and accidentally SHARE a prime factor: $n_1 = ${n1}$ and $n_2 = ${n2}$. Anyone can factor BOTH with one gcd. Recover the shared prime $p = \\gcd(n_1, n_2)$.`,
    steps: [
      { instruction: `Run the Euclidean algorithm: compute $n_2 \\bmod n_1$ (i.e. $${n2} \\bmod ${n1}$). ${n2 > n1 ? "" : "(If $n_2 < n_1$, this is just $n_2$.)"}`, answer: `${mod(n2, n1)}`, accept: [], hint: `$${n2} - ${Math.floor(n2 / n1)} \\cdot ${n1} = ${mod(n2, n1)}$.` },
      { instruction: `Continue Euclid to the gcd: what is $\\gcd(${n1}, ${n2})$?`, answer: `${p}`, accept: [], hint: `The shared prime divides both moduli.` },
      { instruction: `Factor $n_1 = ${n1}$ using the recovered prime: what is the OTHER factor, $q_1 = n_1 / p$?`, answer: `${q1}`, accept: [], hint: `$${n1} / ${p}$.` },
    ],
    finalAnswer: { value: `${p}`, unit: "" },
    solutionNarrative: `$\\gcd(${n1}, ${n2}) = ${p}$ instantly factors both keys: $n_1 = ${p} \\times ${q1}$. Real scans of the internet found thousands of live keys sharing primes this way — a randomness failure, not a break of RSA's math.`,
  };
};

// d3 — shared prime -> full private-key recovery.
fill["cr4-rsa-d3"] = (rng, idx) => {
  const p = rng.pick([7, 11, 13]);
  const others = [17, 19, 23, 29].filter((x) => x !== p);
  let q1 = rng.pick(others), q2 = rng.pick(others.filter((x) => x !== q1));
  const n1 = p * q1, n2 = p * q2;
  const phi = (p - 1) * (q1 - 1);
  // choose e coprime to phi from a small candidate set
  const eCand = [5, 7, 11, 13, 17, 19].filter((e) => gcd(e, phi) === 1);
  const e = eCand[idx % eCand.length] ?? 7;
  const d = modinv(e, phi);
  return {
    id: `gen.cr4-rsa-d3.${idx}`, generated: true, concepts: ["rsa-misuse"], difficulty: 3, context: "applied",
    prompt: `Two RSA moduli share a prime: $n_1 = ${n1}$, $n_2 = ${n2}$. The first key publishes exponent $e = ${e}$. Recover the shared prime, then the full PRIVATE key $d$ for $n_1$.`,
    steps: [
      { instruction: `Compute the shared prime $p = \\gcd(${n1}, ${n2})$.`, answer: `${p}`, accept: [], hint: `Euclid on the two moduli; the common prime pops out.` },
      { instruction: `Factor $n_1$: the other prime is $q_1 = ${n1} / ${p}$. What is $q_1$?`, answer: `${q1}`, accept: [], hint: `$${n1} / ${p} = ${q1}$.` },
      { instruction: `Compute the secret $\\varphi(n_1) = (p-1)(q_1-1) = ${p - 1} \\cdot ${q1 - 1}$.`, answer: `${phi}`, accept: [], hint: `$${p - 1} \\times ${q1 - 1}$.` },
      { instruction: `Recover the private key $d = e^{-1} \\bmod \\varphi = ${e}^{-1} \\bmod ${phi}$.`, answer: `${d}`, accept: [], hint: `Find $d$ with $${e}d \\equiv 1 \\pmod{${phi}}$.` },
    ],
    finalAnswer: { value: `${d}`, unit: "" },
    solutionNarrative: `One gcd factors $n_1 = ${p} \\times ${q1}$, giving $\\varphi = ${phi}$ and $d = ${e}^{-1} \\bmod ${phi} = ${d}$ — the whole private key. Don't roll your own RSA: use vetted libraries with OAEP. See Soatok, "Cryptography Engineering Has An Intrinsic Duty of Care".`,
  };
};
