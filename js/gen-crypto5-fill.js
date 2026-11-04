// gen-crypto5-fill.js
// Parametric generators for content/cryptography/aes-modes.json (cr5-*):
// AES modes of operation, done by hand on a TOY block cipher.
//
// The toy cipher is a keyed permutation of 4-bit blocks (0..15):
//   E(x) = (a*x + b) mod 16,  D(y) = a^-1 * (y - b) mod 16,  a odd.
// It is wildly insecure, but it is a permutation, so every mode's plumbing
// (chaining, counters, feedback, error propagation, malleability) behaves
// exactly as it does with real AES on 128-bit blocks. Byte-level problems
// (bit flipping, padding oracles) use plain decimal bytes. The GCM problems
// use a toy GHASH over Z_p (real GHASH lives in GF(2^128)); the algebra of the
// forbidden attack is the same.
//
// Self-contained pack: exports `fill` (template name -> fn(rng, idx)), merged
// into js/generator.js via Object.assign. Every answer is computed here from
// the drawn givens; menu answers are mode acronyms or yes/no words, never digits.
//
// One generator per concept per difficulty tier (18 total):
//   ecb-cbc         : cr5-cbc-d1 / -d2 / -d3
//   stream-modes    : cr5-str-d1 / -d2 / -d3
//   mode-properties : cr5-prop-d1 / -d2 / -d3
//   malleability    : cr5-mal-d1 / -d2 / -d3
//   gcm-forbidden   : cr5-gcm-d1 / -d2 / -d3
//   choosing-a-mode : cr5-pick-d1 / -d2 / -d3

const mod = (a, n) => ((a % n) + n) % n;
const egcd = (a, b) => { if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; };
const modinv = (a, m) => { a = mod(a, m); const [g, x] = egcd(a, m); return g !== 1 ? null : mod(x, m); };
const bin4 = (n) => n.toString(2).padStart(4, "0");
const bin8 = (n) => n.toString(2).padStart(8, "0");

// --- toy 4-bit block cipher -------------------------------------------------
function toyCipher(rng) {
  const a = rng.pick([3, 5, 7, 9, 11, 13]);
  const b = rng.int(1, 15);
  const ainv = modinv(a, 16);
  const E = (x) => mod(a * x + b, 16);
  const D = (y) => mod(ainv * (y - b), 16);
  return {
    a, b, ainv, E, D,
    eTex: `E(x) = (${a}x + ${b}) \\bmod 16`,
    dTex: `D(y) = ${ainv}(y - ${b}) \\bmod 16`,
    eHint: (x) => `$${a} \\cdot ${x} + ${b} = ${a * x + b}$, and $${a * x + b} \\bmod 16 = ${E(x)}$.`,
    dHint: (y) => `$${ainv}(${y} - ${b}) = ${ainv * (y - b)}$, and $${ainv * (y - b)} \\bmod 16 = ${D(y)}$.`,
  };
}
const xorHint = (x, y) => `$${bin4(x)} \\oplus ${bin4(y)} = ${bin4(x ^ y)}$.`;
const xorHint8 = (x, y) => `$${bin8(x)} \\oplus ${bin8(y)} = ${bin8(x ^ y)}$.`;
const TOY_NOTE = "(4-bit blocks, values $0$ to $15$, all answers in decimal)";

export const fill = {};

// ============================================================================
// ecb-cbc
// ============================================================================

// d1: ECB on three blocks where block 3 repeats block 1.
fill["cr5-cbc-d1"] = (rng, idx) => {
  const T = toyCipher(rng);
  const p1 = rng.int(0, 15);
  let p2 = rng.int(0, 15); if (p2 === p1) p2 = (p1 + 5) % 16;
  const c1 = T.E(p1), c2 = T.E(p2);
  return {
    id: `gen.cr5-cbc-d1.${idx}`, generated: true, concepts: ["ecb-cbc"], difficulty: 1, context: "abstract",
    prompt: `A toy block cipher encrypts one block with $${T.eTex}$ ${TOY_NOTE}. Encrypt the message $P = (${p1}, ${p2}, ${p1})$ in ECB mode, where every block is encrypted on its own: $C_i = E(P_i)$.`,
    steps: [
      { instruction: `Compute $C_1 = E(${p1})$.`, answer: `${c1}`, accept: [], hint: T.eHint(p1) },
      { instruction: `Compute $C_2 = E(${p2})$.`, answer: `${c2}`, accept: [], hint: T.eHint(p2) },
      { instruction: `Compute $C_3 = E(${p1})$.`, answer: `${c1}`, accept: [], hint: `Same input as block 1, same key, no chaining.` },
      { instruction: `How many DISTINCT ciphertext values does $(C_1, C_2, C_3)$ contain?`, answer: `2`, accept: [], hint: `Block 3 repeats block 1.` },
    ],
    finalAnswer: { value: `${c1}`, unit: "" },
    solutionNarrative: `ECB gives $C = (${c1}, ${c2}, ${c1})$. The repeated plaintext block shows up as a repeated ciphertext block, which is exactly the pattern leak behind the ECB penguin.`,
  };
};

// d2: CBC encryption of two blocks.
fill["cr5-cbc-d2"] = (rng, idx) => {
  const T = toyCipher(rng);
  const iv = rng.int(1, 15);
  const p1 = rng.int(0, 15);
  const p2 = rng.int(0, 1) ? p1 : rng.int(0, 15);
  const x1 = p1 ^ iv, c1 = T.E(x1), x2 = p2 ^ c1, c2 = T.E(x2);
  const same = p1 === p2;
  return {
    id: `gen.cr5-cbc-d2.${idx}`, generated: true, concepts: ["ecb-cbc"], difficulty: 2, context: "abstract",
    prompt: `Toy block cipher: $${T.eTex}$ ${TOY_NOTE}. Encrypt $P = (${p1}, ${p2})$ in CBC mode with $IV = ${iv}$: $C_1 = E(P_1 \\oplus IV)$ and $C_2 = E(P_2 \\oplus C_1)$.`,
    steps: [
      { instruction: `Compute $P_1 \\oplus IV = ${p1} \\oplus ${iv}$.`, answer: `${x1}`, accept: [], hint: xorHint(p1, iv) },
      { instruction: `Compute $C_1 = E(${x1})$.`, answer: `${c1}`, accept: [], hint: T.eHint(x1) },
      { instruction: `Chain: compute $P_2 \\oplus C_1 = ${p2} \\oplus ${c1}$.`, answer: `${x2}`, accept: [], hint: xorHint(p2, c1) },
      { instruction: `Compute $C_2 = E(${x2})$.`, answer: `${c2}`, accept: [], hint: T.eHint(x2) },
    ],
    finalAnswer: { value: `${c2}`, unit: "" },
    solutionNarrative: `CBC gives $C = (${c1}, ${c2})$. ${same ? (c1 === c2 ? `Here the two equal plaintext blocks happened to collide anyway (a 1-in-16 chance on 4-bit toy blocks; negligible on 128-bit AES blocks).` : `The two plaintext blocks were equal, yet the ciphertext blocks differ, because each block is first mixed with the previous ciphertext.`) : `Each block is mixed with the previous ciphertext before encryption, so equal plaintext blocks would not produce equal ciphertext.`}`,
  };
};

// d3: CBC decryption of two blocks.
fill["cr5-cbc-d3"] = (rng, idx) => {
  const T = toyCipher(rng);
  const iv = rng.int(1, 15), p1 = rng.int(0, 15), p2 = rng.int(0, 15);
  const c1 = T.E(p1 ^ iv), c2 = T.E(p2 ^ c1);
  const d1 = T.D(c1), d2 = T.D(c2);
  return {
    id: `gen.cr5-cbc-d3.${idx}`, generated: true, concepts: ["ecb-cbc"], difficulty: 3, context: "abstract",
    prompt: `Toy block cipher with inverse $${T.dTex}$ ${TOY_NOTE}. Decrypt the CBC ciphertext $IV = ${iv}$, $C = (${c1}, ${c2})$ using $P_i = D(C_i) \\oplus C_{i-1}$, with $C_0 = IV$.`,
    steps: [
      { instruction: `Compute $D(C_1) = D(${c1})$.`, answer: `${d1}`, accept: [], hint: T.dHint(c1) },
      { instruction: `Compute $P_1 = D(C_1) \\oplus IV = ${d1} \\oplus ${iv}$.`, answer: `${p1}`, accept: [], hint: xorHint(d1, iv) },
      { instruction: `Compute $D(C_2) = D(${c2})$.`, answer: `${d2}`, accept: [], hint: T.dHint(c2) },
      { instruction: `Compute $P_2 = D(C_2) \\oplus C_1 = ${d2} \\oplus ${c1}$.`, answer: `${p2}`, accept: [], hint: xorHint(d2, c1) },
      { instruction: `CBC decryption needs only ciphertext blocks you already have. Can the decryption of a long message run in parallel? (yes or no)`, answer: `yes`, accept: [], hint: `$P_i$ depends only on $C_i$ and $C_{i-1}$, which are all known up front.` },
    ],
    finalAnswer: { value: `${p2}`, unit: "" },
    solutionNarrative: `$P_1 = ${d1} \\oplus ${iv} = ${p1}$ and $P_2 = ${d2} \\oplus ${c1} = ${p2}$. Encryption is strictly sequential (each block needs the previous ciphertext), but decryption parallelizes, since every $C_{i-1}$ is already on hand.`,
  };
};

// ============================================================================
// stream-modes : CTR, OFB, CFB
// ============================================================================

// d1: CTR mode, two blocks.
fill["cr5-str-d1"] = (rng, idx) => {
  const T = toyCipher(rng);
  const ctr = rng.int(0, 14), p1 = rng.int(0, 15), p2 = rng.int(0, 15);
  const s1 = T.E(ctr), s2 = T.E(ctr + 1), c1 = p1 ^ s1, c2 = p2 ^ s2;
  return {
    id: `gen.cr5-str-d1.${idx}`, generated: true, concepts: ["stream-modes"], difficulty: 1, context: "abstract",
    prompt: `Toy block cipher $${T.eTex}$ ${TOY_NOTE}. In CTR mode the cipher encrypts a counter to make keystream, $S_i = E(\\text{ctr}_i)$, and $C_i = P_i \\oplus S_i$. Encrypt $P = (${p1}, ${p2})$ with counter blocks $\\text{ctr}_1 = ${ctr}$ and $\\text{ctr}_2 = ${ctr + 1}$.`,
    steps: [
      { instruction: `Keystream block 1: $S_1 = E(${ctr})$.`, answer: `${s1}`, accept: [], hint: T.eHint(ctr) },
      { instruction: `$C_1 = P_1 \\oplus S_1 = ${p1} \\oplus ${s1}$.`, answer: `${c1}`, accept: [], hint: xorHint(p1, s1) },
      { instruction: `Keystream block 2: $S_2 = E(${ctr + 1})$.`, answer: `${s2}`, accept: [], hint: T.eHint(ctr + 1) },
      { instruction: `$C_2 = P_2 \\oplus S_2 = ${p2} \\oplus ${s2}$.`, answer: `${c2}`, accept: [], hint: xorHint(p2, s2) },
    ],
    finalAnswer: { value: `${c2}`, unit: "" },
    solutionNarrative: `$S = (${s1}, ${s2})$ and $C = (${c1}, ${c2})$. Neither keystream block depends on the message, so all of them can be computed in parallel (or in advance), and decryption is the same XOR.`,
  };
};

// d2: OFB mode, two blocks, plus which direction of the cipher decryption uses.
fill["cr5-str-d2"] = (rng, idx) => {
  const T = toyCipher(rng);
  const iv = rng.int(0, 15), p1 = rng.int(0, 15), p2 = rng.int(0, 15);
  const o1 = T.E(iv), o2 = T.E(o1), c1 = p1 ^ o1, c2 = p2 ^ o2;
  return {
    id: `gen.cr5-str-d2.${idx}`, generated: true, concepts: ["stream-modes"], difficulty: 2, context: "abstract",
    prompt: `Toy block cipher $${T.eTex}$ ${TOY_NOTE}. OFB mode feeds the cipher's own output back in: $O_1 = E(IV)$, $O_2 = E(O_1)$, and $C_i = P_i \\oplus O_i$. Encrypt $P = (${p1}, ${p2})$ with $IV = ${iv}$.`,
    steps: [
      { instruction: `$O_1 = E(${iv})$.`, answer: `${o1}`, accept: [], hint: T.eHint(iv) },
      { instruction: `$C_1 = ${p1} \\oplus ${o1}$.`, answer: `${c1}`, accept: [], hint: xorHint(p1, o1) },
      { instruction: `$O_2 = E(O_1) = E(${o1})$.`, answer: `${o2}`, accept: [], hint: T.eHint(o1) },
      { instruction: `$C_2 = ${p2} \\oplus ${o2}$.`, answer: `${c2}`, accept: [], hint: xorHint(p2, o2) },
      { instruction: `To DECRYPT OFB, the receiver regenerates the same $O_i$. Does that use the block cipher's encryption or decryption direction? (encryption or decryption)`, answer: `encryption`, accept: ["encrypt", "E"], hint: `$O_1 = E(IV)$ on both sides; only the XOR is undone.` },
    ],
    finalAnswer: { value: `${c2}`, unit: "" },
    solutionNarrative: `$O = (${o1}, ${o2})$, so $C = (${c1}, ${c2})$. Like CTR, OFB only ever calls $E$; decryption XORs the same keystream back off. Unlike CTR, each $O_i$ needs the previous one, so the keystream is sequential.`,
  };
};

// d3: CFB decryption (full-block CFB).
fill["cr5-str-d3"] = (rng, idx) => {
  const T = toyCipher(rng);
  const iv = rng.int(0, 15), p1 = rng.int(0, 15), p2 = rng.int(0, 15);
  const k1 = T.E(iv), c1 = p1 ^ k1, k2 = T.E(c1), c2 = p2 ^ k2;
  return {
    id: `gen.cr5-str-d3.${idx}`, generated: true, concepts: ["stream-modes"], difficulty: 3, context: "abstract",
    prompt: `Toy block cipher $${T.eTex}$ ${TOY_NOTE}. Full-block CFB encrypts the previous CIPHERTEXT block to get the next keystream block: $C_i = P_i \\oplus E(C_{i-1})$ with $C_0 = IV$. You receive $IV = ${iv}$ and $C = (${c1}, ${c2})$. Decrypt.`,
    steps: [
      { instruction: `Keystream for block 1: $E(IV) = E(${iv})$.`, answer: `${k1}`, accept: [], hint: T.eHint(iv) },
      { instruction: `$P_1 = C_1 \\oplus E(IV) = ${c1} \\oplus ${k1}$.`, answer: `${p1}`, accept: [], hint: xorHint(c1, k1) },
      { instruction: `Keystream for block 2: $E(C_1) = E(${c1})$.`, answer: `${k2}`, accept: [], hint: T.eHint(c1) },
      { instruction: `$P_2 = C_2 \\oplus E(C_1) = ${c2} \\oplus ${k2}$.`, answer: `${p2}`, accept: [], hint: xorHint(c2, k2) },
      { instruction: `Did CFB decryption ever need the inverse cipher $D$? (yes or no)`, answer: `no`, accept: [], hint: `Every keystream block came from $E$ of something you already had.` },
    ],
    finalAnswer: { value: `${p2}`, unit: "" },
    solutionNarrative: `$P_1 = ${c1} \\oplus ${k1} = ${p1}$ and $P_2 = ${c2} \\oplus ${k2} = ${p2}$. CFB, OFB and CTR all use only the forward cipher, so hardware that can only encrypt is enough. CFB decryption parallelizes (all $C_{i-1}$ are known) even though CFB encryption does not.`,
  };
};

// ============================================================================
// mode-properties : error propagation, parallelism/padding, lengths on the wire
// ============================================================================

// Error propagation when ONE BIT of ciphertext block C_j (of N) flips in transit.
// affected = plaintext blocks that come out wrong; garbled = blocks that are
// completely scrambled (as opposed to having exactly the flipped bit wrong).
function errorProfile(mode, j, N) {
  const last = j === N;
  switch (mode) {
    case "ECB": return { affected: 1, garbled: 1, why: `ECB decrypts $C_${j}$ alone, so only $P_${j}$ is scrambled.` };
    case "CTR": return { affected: 1, garbled: 0, why: `CTR XORs keystream, so exactly the same bit of $P_${j}$ flips and nothing else changes.` };
    case "OFB": return { affected: 1, garbled: 0, why: `OFB's keystream never depends on ciphertext, so exactly one bit of $P_${j}$ flips.` };
    case "CBC": return last
      ? { affected: 1, garbled: 1, why: `$P_${j} = D(C_${j}) \\oplus C_${j - 1}$ is scrambled; there is no next block to disturb.` }
      : { affected: 2, garbled: 1, why: `$P_${j} = D(C_${j}) \\oplus C_${j - 1}$ is scrambled, and $P_${j + 1} = D(C_${j + 1}) \\oplus C_${j}$ gets exactly the flipped bit.` };
    case "CFB": return last
      ? { affected: 1, garbled: 0, why: `$P_${j} = C_${j} \\oplus E(C_${j - 1})$ gets exactly the flipped bit; there is no next block.` }
      : { affected: 2, garbled: 1, why: `$P_${j}$ gets exactly the flipped bit, and $P_${j + 1} = C_${j + 1} \\oplus E(C_${j})$ is scrambled because $E$ sees the damaged $C_${j}$.` };
  }
  throw new Error("mode " + mode);
}

fill["cr5-prop-d1"] = (rng, idx) => {
  const mode = rng.pick(["ECB", "CBC", "CTR", "CBC", "CFB", "OFB"]);
  const N = rng.int(4, 8), j = rng.int(2, N - 1);
  const e = errorProfile(mode, j, N);
  return {
    id: `gen.cr5-prop-d1.${idx}`, generated: true, concepts: ["mode-properties"], difficulty: 1, context: "applied",
    prompt: `A ${N}-block message was encrypted with AES in ${mode} mode${mode === "CFB" ? " (full-block CFB)" : ""}. In transit, ONE bit of ciphertext block $C_${j}$ flips. The receiver decrypts everything.`,
    steps: [
      { instruction: `How many plaintext blocks come out wrong (in any way)?`, answer: `${e.affected}`, accept: [], hint: `Write the decryption formula for $P_${j}$ and $P_${j + 1}$ and see which ones mention $C_${j}$.` },
      { instruction: `How many of those blocks are completely scrambled (rather than having just that one bit flipped)?`, answer: `${e.garbled}`, accept: [], hint: `A block is scrambled when the damaged bits pass through the block cipher; it gets a clean one-bit flip when they only pass through an XOR.` },
    ],
    finalAnswer: { value: `${e.affected}`, unit: "blocks" },
    solutionNarrative: `${e.why} Note that a clean bit flip is not a feature: it is exactly the malleability an attacker exploits.`,
  };
};

const PROPS = {
  //        enc parallel, dec parallel, needs padding, only forward cipher E
  ECB: { encPar: "yes", decPar: "yes", pad: "yes", fwd: "no" },
  CBC: { encPar: "no", decPar: "yes", pad: "yes", fwd: "no" },
  CFB: { encPar: "no", decPar: "yes", pad: "no", fwd: "yes" },
  OFB: { encPar: "no", decPar: "no", pad: "no", fwd: "yes" },
  CTR: { encPar: "yes", decPar: "yes", pad: "no", fwd: "yes" },
};
const PROP_WHY = {
  ECB: "Every block is independent, so everything parallelizes, but whole blocks are required (padding) and decryption needs $D$.",
  CBC: "Encryption waits on each previous ciphertext block; decryption has every $C_{i-1}$ up front. Whole blocks are required, and decryption needs $D$.",
  CFB: "Encryption waits on each previous ciphertext block, decryption does not. The keystream is XORed, so a short last block is simply truncated, and only $E$ is used.",
  OFB: "Each keystream block is $E$ of the previous one, so neither direction parallelizes (though the keystream can be precomputed). XOR means no padding and only $E$.",
  CTR: "Counter blocks are known in advance, so both directions parallelize; XOR means no padding and only $E$.",
};

fill["cr5-prop-d2"] = (rng, idx) => {
  const mode = rng.pick(Object.keys(PROPS));
  const P = PROPS[mode];
  return {
    id: `gen.cr5-prop-d2.${idx}`, generated: true, concepts: ["mode-properties"], difficulty: 2, context: "abstract",
    prompt: `Consider AES in ${mode} mode${mode === "CFB" ? " (full-block CFB)" : ""} on a long message. Answer each question with yes or no.`,
    steps: [
      { instruction: `Can the AES calls for ENCRYPTION all run in parallel?`, answer: P.encPar, accept: [], hint: `Does block $i$'s cipher input depend on block $i-1$'s output?` },
      { instruction: `Can the AES calls for DECRYPTION all run in parallel?`, answer: P.decPar, accept: [], hint: `During decryption, the whole ciphertext is already known.` },
      { instruction: `Does the plaintext have to be padded to a whole number of blocks?`, answer: P.pad, accept: [], hint: `Modes that XOR a keystream can just cut the last keystream block short.` },
      { instruction: `Does the mode get by with only the forward cipher $E$ (never calling $D$)?`, answer: P.fwd, accept: [], hint: `Look at whether plaintext ever passes through the block cipher itself.` },
    ],
    finalAnswer: { value: P.encPar, unit: "" },
    solutionNarrative: `${mode}: ${PROP_WHY[mode]}`,
  };
};

// d3: bytes on the wire for CBC (PKCS#7 + IV) versus GCM (nonce + tag).
fill["cr5-prop-d3"] = (rng, idx) => {
  const L = rng.int(1, 6) === 1 ? 16 * rng.int(1, 5) : rng.int(5, 90);
  const pad = 16 - (L % 16);
  const cbcTotal = 16 + L + pad, gcmTotal = 12 + L + 16;
  return {
    id: `gen.cr5-prop-d3.${idx}`, generated: true, concepts: ["mode-properties"], difficulty: 3, context: "applied",
    prompt: `A ${L}-byte message is encrypted two ways with AES (16-byte blocks). Option A is CBC with PKCS#7 padding and a 16-byte random IV sent in front. Option B is GCM with a 12-byte nonce sent in front and a 16-byte tag at the end. PKCS#7 always adds between 1 and 16 bytes, each equal to the number of bytes added.`,
    steps: [
      { instruction: `How many padding bytes does PKCS#7 add to a ${L}-byte message?`, answer: `${pad}`, accept: [], hint: `Pad up to the next multiple of 16. If the length is already a multiple of 16, a whole extra block of 16 is added (so the receiver can always strip it).` },
      { instruction: `What is the value (in decimal) of each padding byte?`, answer: `${pad}`, accept: [], hint: `PKCS#7 writes the pad length into every pad byte.` },
      { instruction: `Option A: total bytes sent (IV + padded ciphertext)?`, answer: `${cbcTotal}`, accept: [], hint: `$16 + ${L} + ${pad}$.` },
      { instruction: `Option B: total bytes sent (nonce + ciphertext + tag)? GCM needs no padding.`, answer: `${gcmTotal}`, accept: [], hint: `$12 + ${L} + 16$.` },
    ],
    finalAnswer: { value: `${gcmTotal}`, unit: "bytes" },
    solutionNarrative: `PKCS#7 adds ${pad} byte${pad === 1 ? "" : "s"} of value ${pad}, so CBC sends $16 + ${L + pad} = ${cbcTotal}$ bytes. GCM is a counter mode, so ciphertext length equals plaintext length: $12 + ${L} + 16 = ${gcmTotal}$ bytes, and those 16 tag bytes buy authentication that CBC alone does not have.`,
  };
};

// ============================================================================
// malleability : bit flipping in CTR and CBC, the CBC padding oracle
// ============================================================================

// d1: CTR bit flip on one ASCII digit.
fill["cr5-mal-d1"] = (rng, idx) => {
  const x = rng.int(1, 9);
  let y = rng.int(1, 9); if (y === x) y = (x % 9) + 1;
  const X = 48 + x, Y = 48 + y;
  const S = rng.int(1, 255), C = X ^ S;
  const mask = X ^ Y, C2 = C ^ mask;
  return {
    id: `gen.cr5-mal-d1.${idx}`, generated: true, concepts: ["malleability"], difficulty: 1, context: "applied",
    prompt: `A bank message "PAY ${x}00" is encrypted with AES-CTR and no authentication. The attacker knows the digit's position and that it is the character '${x}' (ASCII ${X}); its ciphertext byte is $C = ${C}$. The attacker wants it to decrypt to '${y}' (ASCII ${Y}) instead. In CTR, $P = C \\oplus S$, so XORing a mask into $C$ XORs the same mask into $P$.`,
    steps: [
      { instruction: `Compute the mask $${X} \\oplus ${Y}$ (old character XOR new character).`, answer: `${mask}`, accept: [], hint: xorHint8(X, Y) },
      { instruction: `Compute the forged ciphertext byte $C' = C \\oplus \\text{mask} = ${C} \\oplus ${mask}$.`, answer: `${C2}`, accept: [], hint: xorHint8(C, mask) },
      { instruction: `Without a MAC or tag, does the receiver have any way to notice the change? (yes or no)`, answer: `no`, accept: [], hint: `CTR decrypts any byte string to some plaintext.` },
    ],
    finalAnswer: { value: `${C2}`, unit: "" },
    solutionNarrative: `The receiver computes $C' \\oplus S = (X \\oplus S \\oplus X \\oplus Y) \\oplus S = Y$, so "PAY ${x}00" silently becomes "PAY ${y}00". The attacker never learned the key or keystream. Encryption without authentication is malleable; use an AEAD mode (GCM, CCM, SIV) or encrypt-then-MAC.`,
  };
};

// d2: CBC bit flip: change P2 by editing C1 (toy 4-bit cipher, so the side effect is visible).
fill["cr5-mal-d2"] = (rng, idx) => {
  const T = toyCipher(rng);
  const iv = rng.int(0, 15), p1 = rng.int(0, 15), p2 = rng.int(0, 15);
  let target = rng.int(0, 15); if (target === p2) target = (p2 + 3) % 16;
  const c1 = T.E(p1 ^ iv), c2 = T.E(p2 ^ c1);
  const mask = p2 ^ target, c1f = c1 ^ mask;
  const p1f = T.D(c1f) ^ iv;
  return {
    id: `gen.cr5-mal-d2.${idx}`, generated: true, concepts: ["malleability"], difficulty: 2, context: "abstract",
    prompt: `CBC decryption computes $P_2 = D(C_2) \\oplus C_1$. An attacker sees $C_1 = ${c1}$, $C_2 = ${c2}$ ${TOY_NOTE} and knows $P_2 = ${p2}$. They want the receiver to decrypt $P_2 = ${target}$ instead, by editing only $C_1$.`,
    steps: [
      { instruction: `Mask needed: $${p2} \\oplus ${target}$.`, answer: `${mask}`, accept: [], hint: xorHint(p2, target) },
      { instruction: `Forged first block: $C_1' = C_1 \\oplus \\text{mask} = ${c1} \\oplus ${mask}$.`, answer: `${c1f}`, accept: [], hint: xorHint(c1, mask) },
      { instruction: `The receiver now gets $P_2' = D(C_2) \\oplus C_1'$. What value is that?`, answer: `${target}`, accept: [], hint: `$D(C_2) = P_2 \\oplus C_1$, so $P_2' = P_2 \\oplus C_1 \\oplus C_1'$.` },
      { instruction: `Which plaintext block is scrambled as a side effect: the first or the second? (first or second)`, answer: `first`, accept: [], hint: `$P_1 = D(C_1') \\oplus IV$, and $D$ of an edited block is unpredictable.` },
    ],
    finalAnswer: { value: `${c1f}`, unit: "" },
    solutionNarrative: `XORing ${mask} into $C_1$ XORs ${mask} into $P_2$, giving ${target}, while $P_1$ becomes $D(${c1f}) \\oplus IV$${p1f === p1 ? `, which on this tiny 4-bit toy happens to equal the old value (with real 128-bit blocks it is random junk)` : ` (here ${p1f} instead of ${p1}: junk)`}. Attackers aim that junk block at a field nobody checks.`,
  };
};

// d3: one byte of a CBC padding-oracle attack.
fill["cr5-mal-d3"] = (rng, idx) => {
  const I = rng.int(0, 255);            // last byte of D(C_n), the secret intermediate
  const P = rng.int(2, 16);             // real last plaintext byte (a valid pad value)
  const cprev = I ^ P;                  // last byte of the real previous ciphertext block
  const g = I ^ 1;                      // the guess the oracle accepts
  const next = I ^ 2;
  return {
    id: `gen.cr5-mal-d3.${idx}`, generated: true, concepts: ["malleability"], difficulty: 3, context: "applied",
    prompt: `Padding oracle on CBC with PKCS#7. The server reports whether padding is valid. The attacker replaces the last byte of the previous ciphertext block (really ${cprev}) with guesses $g = 0, 1, \\dots, 255$ and sends it with the target block. The server computes last plaintext byte $= I \\oplus g$, where $I$ is the last byte of $D(C_n)$. Padding is valid when that byte is $1$. The oracle says valid at $g = ${g}$ (assume this is the 1-byte pad, not a longer one).`,
    steps: [
      { instruction: `Recover the intermediate byte: $I = g \\oplus 1 = ${g} \\oplus 1$.`, answer: `${I}`, accept: [], hint: `$I \\oplus g = 1$, so $I = g \\oplus 1$.` },
      { instruction: `Recover the real plaintext byte: $P = I \\oplus ${cprev}$ (the original previous-block byte).`, answer: `${P}`, accept: [], hint: xorHint8(I, cprev) },
      { instruction: `To attack the next byte, the attacker needs the last byte to decrypt to $2$. What should they set the last byte to? ($I \\oplus 2$)`, answer: `${next}`, accept: [], hint: xorHint8(I, 2) },
      { instruction: `Worst case, how many oracle queries does recovering a full 16-byte block take? (256 guesses per byte)`, answer: `4096`, accept: [], hint: `$16 \\times 256$.` },
    ],
    finalAnswer: { value: `${P}`, unit: "" },
    solutionNarrative: `$I = ${g} \\oplus 1 = ${I}$ and $P = ${I} \\oplus ${cprev} = ${P}$. Setting the last byte to $${I} \\oplus 2 = ${next}$ lines up the next round. At most $16 \\times 256 = 4096$ queries per block reveal the plaintext without the key, which is why CBC must be authenticated (encrypt-then-MAC) or replaced by an AEAD mode.`,
  };
};

// ============================================================================
// gcm-forbidden : toy GHASH tag  T = c1*H^2 + c2*H + S (mod p)
// ============================================================================

function ghCase(rng) {
  const p = rng.pick([11, 13, 17, 19, 23]);
  const H = rng.int(2, p - 1), S = rng.int(1, p - 1);
  const c1 = rng.int(1, p - 1), c2 = rng.int(1, p - 1);
  const tag = (a, b) => mod(a * H * H + b * H + S, p);
  return { p, H, S, c1, c2, tag };
}

fill["cr5-gcm-d1"] = (rng, idx) => {
  const g = ghCase(rng);
  const H2 = mod(g.H * g.H, g.p), t1 = mod(g.c1 * H2, g.p), t2 = mod(g.c2 * g.H, g.p), T = g.tag(g.c1, g.c2);
  return {
    id: `gen.cr5-gcm-d1.${idx}`, generated: true, concepts: ["gcm-forbidden"], difficulty: 1, context: "abstract",
    prompt: `Toy GCM tag. Real GCM evaluates a polynomial in a secret hash key $H$ over $GF(2^{128})$; this toy uses $\\mathbb{Z}_{${g.p}}$. For ciphertext blocks $(c_1, c_2) = (${g.c1}, ${g.c2})$, hash key $H = ${g.H}$ and mask $S = ${g.S}$ (in GCM, $S = E_K(\\text{nonce block})$), the tag is $T = c_1 H^2 + c_2 H + S \\bmod ${g.p}$.`,
    steps: [
      { instruction: `Compute $H^2 \\bmod ${g.p}$.`, answer: `${H2}`, accept: [], hint: `$${g.H}^2 = ${g.H * g.H}$.` },
      { instruction: `Compute $c_1 H^2 \\bmod ${g.p}$.`, answer: `${t1}`, accept: [], hint: `$${g.c1} \\cdot ${H2} = ${g.c1 * H2}$.` },
      { instruction: `Compute $c_2 H \\bmod ${g.p}$.`, answer: `${t2}`, accept: [], hint: `$${g.c2} \\cdot ${g.H} = ${g.c2 * g.H}$.` },
      { instruction: `Compute the tag $T = c_1 H^2 + c_2 H + S \\bmod ${g.p}$.`, answer: `${T}`, accept: [], hint: `$${t1} + ${t2} + ${g.S} = ${t1 + t2 + g.S}$.` },
    ],
    finalAnswer: { value: `${T}`, unit: "" },
    solutionNarrative: `$T = ${t1} + ${t2} + ${g.S} \\equiv ${T} \\pmod{${g.p}}$. Without $H$ and $S$ an attacker cannot predict the tag, so any edit to $c_1$ or $c_2$ is caught. Real GHASH also folds in the associated data and a length block, but the structure is the same.`,
  };
};

// Two messages under the SAME nonce, differing only in block 2 -> recover H.
function forbidden(rng) {
  for (let t = 0; t < 100; t++) {
    const g = ghCase(rng);
    let c2b = rng.int(1, g.p - 1); if (c2b === g.c2) continue;
    const T1 = g.tag(g.c1, g.c2), T2 = g.tag(g.c1, c2b);
    const dT = mod(T1 - T2, g.p), dc = mod(g.c2 - c2b, g.p), inv = modinv(dc, g.p);
    const H = mod(dT * inv, g.p);
    if (H !== g.H) continue;
    return { ...g, c2b, T1, T2, dT, dc, inv };
  }
  throw new Error("forbidden case");
}

fill["cr5-gcm-d2"] = (rng, idx) => {
  const f = forbidden(rng);
  return {
    id: `gen.cr5-gcm-d2.${idx}`, generated: true, concepts: ["gcm-forbidden"], difficulty: 2, context: "applied",
    prompt: `The forbidden attack, toy version over $\\mathbb{Z}_{${f.p}}$. Tags are $T = c_1 H^2 + c_2 H + S$. A buggy server REUSED a nonce, so two messages share both $H$ and $S$. Message A is $(${f.c1}, ${f.c2})$ with tag $${f.T1}$; message B is $(${f.c1}, ${f.c2b})$ with tag $${f.T2}$. Subtracting cancels $S$ and the $c_1$ term: $T_A - T_B = (c_2^A - c_2^B) H$.`,
    steps: [
      { instruction: `Compute $T_A - T_B \\bmod ${f.p}$.`, answer: `${f.dT}`, accept: [], hint: `$${f.T1} - ${f.T2}$, then add ${f.p} if negative.` },
      { instruction: `Compute $c_2^A - c_2^B \\bmod ${f.p}$.`, answer: `${f.dc}`, accept: [], hint: `$${f.c2} - ${f.c2b}$, then add ${f.p} if negative.` },
      { instruction: `Find $(c_2^A - c_2^B)^{-1} \\bmod ${f.p}$.`, answer: `${f.inv}`, accept: [], hint: `Find $x$ with $${f.dc}x \\equiv 1 \\pmod{${f.p}}$.` },
      { instruction: `Recover the hash key $H = (T_A - T_B)(c_2^A - c_2^B)^{-1} \\bmod ${f.p}$.`, answer: `${f.H}`, accept: [], hint: `$${f.dT} \\cdot ${f.inv} = ${f.dT * f.inv}$.` },
    ],
    finalAnswer: { value: `${f.H}`, unit: "" },
    solutionNarrative: `$H = ${f.dT} \\cdot ${f.inv} \\equiv ${f.H} \\pmod{${f.p}}$. In real GCM the difference is a polynomial in $H$ over $GF(2^{128})$ and the attacker finds its roots, but the lesson is identical: one repeated nonce leaks the authentication key.`,
  };
};

fill["cr5-gcm-d3"] = (rng, idx) => {
  const f = forbidden(rng);
  let c2n = rng.int(1, f.p - 1); if (c2n === f.c2 || c2n === f.c2b) c2n = mod(f.c2 + f.c2b, f.p) || 1;
  if (c2n === f.c2 || c2n === f.c2b) c2n = [...Array(f.p - 1).keys()].map((v) => v + 1).find((v) => v !== f.c2 && v !== f.c2b);
  const S = mod(f.T1 - f.c1 * f.H * f.H - f.c2 * f.H, f.p);
  const Tn = mod(f.T1 + (c2n - f.c2) * f.H, f.p);
  return {
    id: `gen.cr5-gcm-d3.${idx}`, generated: true, concepts: ["gcm-forbidden"], difficulty: 3, context: "applied",
    prompt: `Toy forbidden attack over $\\mathbb{Z}_{${f.p}}$ with tags $T = c_1 H^2 + c_2 H + S$. Under one REUSED nonce you capture message A $= (${f.c1}, ${f.c2})$ with tag $${f.T1}$ and message B $= (${f.c1}, ${f.c2b})$ with tag $${f.T2}$. Recover the secrets, then forge a valid tag for message C $= (${f.c1}, ${c2n})$ under the same nonce.`,
    steps: [
      { instruction: `Recover $H = (T_A - T_B)(c_2^A - c_2^B)^{-1} \\bmod ${f.p}$.`, answer: `${f.H}`, accept: [], hint: `$T_A - T_B \\equiv ${f.dT}$ and $c_2^A - c_2^B \\equiv ${f.dc}$, whose inverse is ${f.inv}.` },
      { instruction: `Recover the mask $S = T_A - c_1 H^2 - c_2^A H \\bmod ${f.p}$.`, answer: `${S}`, accept: [], hint: `$${f.T1} - ${f.c1} \\cdot ${f.H * f.H} - ${f.c2} \\cdot ${f.H} = ${f.T1 - f.c1 * f.H * f.H - f.c2 * f.H}$, then reduce.` },
      { instruction: `Forge the tag for C: $T_C = c_1 H^2 + ${c2n} H + S \\bmod ${f.p}$ (equivalently $T_A + (${c2n} - ${f.c2})H$).`, answer: `${Tn}`, accept: [], hint: `$${f.T1} + (${c2n - f.c2}) \\cdot ${f.H} = ${f.T1 + (c2n - f.c2) * f.H}$, then reduce mod ${f.p}.` },
      { instruction: `Did the forgery need the AES key itself? (yes or no)`, answer: `no`, accept: [], hint: `You only used $H$ and $S$, both leaked by the nonce reuse.` },
    ],
    finalAnswer: { value: `${Tn}`, unit: "" },
    solutionNarrative: `$H = ${f.H}$, $S = ${S}$, and the forged tag is $T_C = ${Tn}$. The server will accept message C as authentic. This is Joux's forbidden attack: after a nonce repeats, GCM loses not just confidentiality for those messages but authenticity, because $H$ is fixed for the whole key. Nonce-misuse-resistant modes (AES-GCM-SIV, AES-SIV) exist for systems that cannot guarantee unique nonces.`,
  };
};

// ============================================================================
// choosing-a-mode : scenario -> mode, plus authentication facts
// ============================================================================

const AUTH = { ECB: "no", CBC: "no", CFB: "no", OFB: "no", CTR: "no", XTS: "no", GCM: "yes", CCM: "yes", SIV: "yes" };
const SCENARIOS = [
  { mode: "XTS", text: "full-disk encryption: each 512-byte sector must encrypt to exactly 512 bytes with no room for a nonce or tag, and the sector number serves as a tweak" },
  { mode: "GCM", text: "general-purpose authenticated encryption for network records, with unique per-record nonces from a counter and fast hardware AES (the default in TLS 1.3)" },
  { mode: "SIV", text: "authenticated encryption where nonces might accidentally repeat (many uncoordinated machines), and a repeat should leak only whether two messages are identical" },
  { mode: "CCM", text: "authenticated encryption on a small device that has only an AES encryption core, combining a CBC-MAC with counter mode (used by WPA2's CCMP and Bluetooth LE)" },
  { mode: "ECB", text: "the mode that is safe for at most a single block, because identical blocks always encrypt identically" },
  { mode: "CBC", text: "a legacy mode that chains each plaintext block with the previous ciphertext, needs an unpredictable IV and padding, and leaks plaintext through padding errors if left unauthenticated" },
  { mode: "CTR", text: "turning AES into a parallel stream cipher by encrypting a nonce and counter, with no authentication of its own" },
  { mode: "OFB", text: "a stream mode whose keystream is the IV encrypted over and over, each output feeding the next" },
  { mode: "CFB", text: "a stream mode that encrypts each previous ciphertext block to get the next keystream block" },
];
const MENU = "ECB, CBC, CFB, OFB, CTR, GCM, CCM, SIV, XTS";
const modeAccept = (m) => [`${m} mode`, `AES ${m}`];

function pickScenarios(rng, k, pool) {
  const out = [], avail = pool.slice();
  while (out.length < k) { const i = rng.int(0, avail.length - 1); out.push(avail.splice(i, 1)[0]); }
  return out;
}

fill["cr5-pick-d1"] = (rng, idx) => {
  const [s] = pickScenarios(rng, 1, SCENARIOS);
  return {
    id: `gen.cr5-pick-d1.${idx}`, generated: true, concepts: ["choosing-a-mode"], difficulty: 1, context: "applied",
    prompt: `Which AES mode fits this description? ${s.text[0].toUpperCase() + s.text.slice(1)}.`,
    steps: [
      { instruction: `Name the mode. (one of: ${MENU})`, answer: s.mode, accept: modeAccept(s.mode), hint: `Match the clue to the mode's structure: chaining, counter, feedback, tweak, or built-in tag.` },
      { instruction: `Does ${s.mode} on its own detect tampering (authenticate the ciphertext)? (yes or no)`, answer: AUTH[s.mode], accept: [], hint: `Only modes that output a tag (GCM, CCM, SIV) authenticate.` },
    ],
    finalAnswer: { value: s.mode, unit: "" },
    solutionNarrative: `${s.mode}. ${AUTH[s.mode] === "yes" ? "It is an AEAD mode: the tag catches any modified ciphertext." : "It does not authenticate, so pair it with a MAC (encrypt-then-MAC) or use an AEAD mode instead."}`,
  };
};

fill["cr5-pick-d2"] = (rng, idx) => {
  const [a, b] = pickScenarios(rng, 2, SCENARIOS);
  return {
    id: `gen.cr5-pick-d2.${idx}`, generated: true, concepts: ["choosing-a-mode"], difficulty: 2, context: "applied",
    prompt: `Match each description to an AES mode (${MENU}).\n\n**A:** ${a.text}.\n\n**B:** ${b.text}.`,
    steps: [
      { instruction: `Which mode is described in A?`, answer: a.mode, accept: modeAccept(a.mode), hint: `Look for the structural clue in A.` },
      { instruction: `Which mode is described in B?`, answer: b.mode, accept: modeAccept(b.mode), hint: `Look for the structural clue in B.` },
      { instruction: `Does the mode in A authenticate on its own? (yes or no)`, answer: AUTH[a.mode], accept: [], hint: `GCM, CCM and SIV output a tag; the others do not.` },
    ],
    finalAnswer: { value: a.mode, unit: "" },
    solutionNarrative: `A is ${a.mode} and B is ${b.mode}. Of the nine, only GCM, CCM and SIV authenticate; XTS and the classic five need an external MAC (or, for XTS, accept that disk sectors are unauthenticated).`,
  };
};

// d3: GCM nonce budget + misuse scenario.
fill["cr5-pick-d3"] = (rng, idx) => {
  const s = rng.pick(SCENARIOS.filter((x) => ["SIV", "GCM", "XTS", "CCM"].includes(x.mode)));
  const servers = rng.pick([2, 4, 8, 16]);
  const per = 2 ** 32 / servers, exp = 32 - Math.log2(servers);
  return {
    id: `gen.cr5-pick-d3.${idx}`, generated: true, concepts: ["choosing-a-mode"], difficulty: 3, context: "applied",
    prompt: `Design review. (1) A team needs: ${s.text}. (2) Elsewhere, ${servers} servers share ONE AES-GCM key and pick 96-bit nonces at random. NIST SP 800-38D caps random-nonce GCM at $2^{32}$ messages per key in total, so the chance of a repeated nonce stays negligible.`,
    steps: [
      { instruction: `For (1), which mode fits? (one of: ${MENU})`, answer: s.mode, accept: modeAccept(s.mode), hint: `Find the structural clue in the requirement.` },
      { instruction: `For (2), split the $2^{32}$ budget evenly: how many messages may each server encrypt? Give the exponent $n$ in $2^n$.`, answer: `${exp}`, accept: [], hint: `$2^{32} / ${servers} = 2^{32 - ${Math.log2(servers)}}$.` },
      { instruction: `If two of those messages ever DO share a nonce, can an attacker forge tags for that key? (yes or no)`, answer: `yes`, accept: [], hint: `The forbidden attack recovers $H$, which is fixed for the whole key.` },
    ],
    finalAnswer: { value: s.mode, unit: "" },
    solutionNarrative: `(1) is ${s.mode}. (2) Each server gets $2^{32}/${servers} = 2^{${exp}}$ = ${per.toLocaleString("en-US")} messages before the shared key must rotate. A single repeated nonce leaks $H$ and enables forgeries, which is why counter-based nonces or a misuse-resistant mode such as AES-GCM-SIV are preferred at scale.`,
  };
};
