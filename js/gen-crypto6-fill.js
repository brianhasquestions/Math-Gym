// gen-crypto6-fill.js
// Parametric generators for content/cryptography/hashes-macs-signatures.json
// (cr6-*): hash properties, the birthday bound, Merkle-Damgard and length
// extension, HMAC, toy RSA signatures, and Schnorr / EdDSA-style nonces.
//
// Every computation uses toy numbers a learner can do by hand:
//   * toy hash        h(x) = (x^2 + c) mod p          (collides x with p - x)
//   * toy compression f(h, m) = (h + m)^2 mod p       (chained Merkle-Damgard style)
//   * toy RSA         n = pq with two-digit moduli, s = m^d, verify s^e
//   * toy Schnorr     subgroup of order q in Z_p^*, p = 23 or 47
// The toys are insecure on purpose; what matters is that their STRUCTURE
// (chaining, keyed passes, multiplicativity, nonce algebra) matches the real thing.
//
// Self-contained pack: exports `fill` (template name -> fn(rng, idx)), merged
// into js/generator.js via Object.assign. Every answer is computed here from the
// drawn givens. Menu answers are words or acronyms (preimage, collision, yes,
// inner, private, PSS, ECDSA, ...), never digits or hyphenated words.
//
// One generator per concept per difficulty tier (18 total):
//   hash-properties : cr6-hp-d1 / -d2 / -d3
//   birthday-bound  : cr6-bday-d1 / -d2 / -d3
//   merkle-damgard  : cr6-md-d1 / -d2 / -d3
//   hmac            : cr6-hmac-d1 / -d2 / -d3
//   rsa-signatures  : cr6-rsa-d1 / -d2 / -d3
//   signature-nonces: cr6-sch-d1 / -d2 / -d3

const mod = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const egcd = (a, b) => { if (b === 0) return [a, 1, 0]; const [g, x, y] = egcd(b, a % b); return [g, y, x - Math.floor(a / b) * y]; };
const modinv = (a, m) => { a = mod(a, m); const [g, x] = egcd(a, m); return g !== 1 ? null : mod(x, m); };
const powmod = (b, e, m) => { let r = 1 % m, x = mod(b, m); while (e > 0) { if (e & 1) r = (r * x) % m; x = (x * x) % m; e = Math.floor(e / 2); } return r; };
const bin8 = (n) => n.toString(2).padStart(8, "0");
const xorHint8 = (x, y) => `$${bin8(x)} \\oplus ${bin8(y)} = ${bin8(x ^ y)}$.`;

// Square-and-multiply hint for b^e mod m.
function powHint(b, e, m) {
  const parts = [], used = [];
  let x = mod(b, m);
  for (let i = 1; i <= e; i *= 2) { parts.push(`${b}^{${i}} \\equiv ${x}`); if (e & i) used.push(i); x = (x * x) % m; }
  return `Square repeatedly mod ${m}: $${parts.join(",\\ ")}$. Then multiply the powers for $${e} = ${used.reverse().join(" + ")}$, reducing mod ${m} as you go.`;
}

export const fill = {};

// ============================================================================
// hash-properties : toy hash h(x) = (x^2 + c) mod p
// ============================================================================

function toyHash(rng) {
  const p = rng.pick([11, 13, 17, 19, 23]), c = rng.int(1, p - 1);
  const h = (x) => mod(x * x + c, p);
  return {
    p, c, h,
    tex: `h(x) = (x^2 + ${c}) \\bmod ${p}`,
    hint: (x) => `$${x}^2 + ${c} = ${x * x + c}$, and $${x * x + c} \\bmod ${p} = ${h(x)}$.`,
  };
}
const HP_MENU = "preimage, second preimage, or collision";
// Keyword per property: ANY (preimage), DIFFERENT (second preimage), BOTH (collision).
const HP_SCEN = [
  { prop: "preimage", text: "An attacker steals a table of unsalted password digests and, for one digest, wants ANY input at all that hashes to it" },
  { prop: "preimage", text: "A lottery commits to its winning number by publishing only a digest; an attacker wants ANY input that produces that published digest" },
  { prop: "second preimage", text: "An attacker is handed one specific signed contract and must produce a DIFFERENT contract with the same digest as that one" },
  { prop: "second preimage", text: "A vendor publishes the digest of its installer; an attacker wants a DIFFERENT, malicious installer whose digest matches that installer's" },
  { prop: "collision", text: "An attacker may choose BOTH inputs freely and only needs some pair with equal digests, such as a harmless certificate request and an evil twin prepared together" },
  { prop: "collision", text: "An attacker crafts BOTH a benign and a malicious document at once, aiming only for the two to share a digest so a signature on one also covers the other" },
];

fill["cr6-hp-d1"] = (rng, idx) => {
  const H = toyHash(rng);
  const x = rng.int(2, H.p - 1);
  const s = rng.pick(HP_SCEN);
  return {
    id: `gen.cr6-hp-d1.${idx}`, generated: true, concepts: ["hash-properties"], difficulty: 1, context: "applied",
    prompt: `A toy hash is $${H.tex}$ (inputs are whole numbers $1$ to $${H.p - 1}$). Separately, consider this attack goal: ${s.text}.`,
    steps: [
      { instruction: `Compute the toy digest $h(${x})$.`, answer: `${H.h(x)}`, accept: [], hint: H.hint(x) },
      { instruction: `Which property does the attack goal target? (${HP_MENU})`, answer: s.prop, accept: [], hint: `Preimage: only a digest is given. Second preimage: one specific input is given and you need another. Collision: you pick both inputs.` },
      { instruction: `For an ideal $n$-bit hash, which of the three attacks is generically cheapest? (${HP_MENU})`, answer: "collision", accept: [], hint: `Freedom to choose both inputs lets the birthday paradox work for you: about $2^{n/2}$ tries instead of $2^n$.` },
    ],
    finalAnswer: { value: s.prop, unit: "" },
    solutionNarrative: `$h(${x}) = ${H.h(x)}$. The scenario is a ${s.prop} attack. Generic costs for an ideal $n$-bit hash are about $2^n$ for preimages and second preimages, but only about $2^{n/2}$ for collisions, which is why collision resistance sets a hash's security level.`,
  };
};

fill["cr6-hp-d2"] = (rng, idx) => {
  const H = toyHash(rng);
  const x = rng.int(1, H.p - 1), x2 = H.p - x;
  return {
    id: `gen.cr6-hp-d2.${idx}`, generated: true, concepts: ["hash-properties"], difficulty: 2, context: "abstract",
    prompt: `Toy hash $${H.tex}$ on inputs $1$ to $${H.p - 1}$. You are given the input $x = ${x}$ and must find a second preimage: a DIFFERENT input $x'$ in the same range with $h(x') = h(x)$.`,
    steps: [
      { instruction: `Compute $h(${x})$.`, answer: `${H.h(x)}`, accept: [], hint: H.hint(x) },
      { instruction: `Find the second preimage $x'$. (Hint: squaring cannot tell $x$ from $-x$.)`, answer: `${x2}`, accept: [], hint: `$-${x} \\equiv ${H.p} - ${x} = ${x2} \\pmod{${H.p}}$, and $${x2}^2 + ${H.c} = ${x2 * x2 + H.c} \\equiv ${H.h(x2)}$.` },
      { instruction: `Is this toy hash second-preimage resistant? (yes or no)`, answer: "no", accept: [], hint: `You just found a second preimage with one subtraction.` },
    ],
    finalAnswer: { value: `${x2}`, unit: "" },
    solutionNarrative: `$h(${x}) = h(${x2}) = ${H.h(x)}$, because $(p - x)^2 \\equiv x^2 \\pmod p$. The toy hash has algebraic structure an attacker can invert. A real hash such as SHA-256 is designed so that no shortcut is known and finding a second preimage takes about $2^{256}$ tries.`,
  };
};

fill["cr6-hp-d3"] = (rng, idx) => {
  const H = toyHash(rng);
  const x0 = rng.int(1, H.p - 1), y = H.h(x0), t = mod(y - H.c, H.p);
  const lo = Math.min(x0, H.p - x0), hi = Math.max(x0, H.p - x0);
  return {
    id: `gen.cr6-hp-d3.${idx}`, generated: true, concepts: ["hash-properties"], difficulty: 3, context: "abstract",
    prompt: `Toy hash $${H.tex}$ on inputs $1$ to $${H.p - 1}$. You see only the digest $y = ${y}$. Find every preimage: all inputs $x$ in range with $h(x) = ${y}$.`,
    steps: [
      { instruction: `Undo the constant: compute $y - ${H.c} \\bmod ${H.p}$, the value $x^2$ must have.`, answer: `${t}`, accept: [], hint: `$${y} - ${H.c} = ${y - H.c}$; add ${H.p} if negative.` },
      { instruction: `Find the SMALLER input $x$ with $x^2 \\equiv ${t} \\pmod{${H.p}}$.`, answer: `${lo}`, accept: [], hint: `Square $1, 2, 3, \\dots$ mod ${H.p} until you hit ${t}.` },
      { instruction: `Find the LARGER input with $x^2 \\equiv ${t} \\pmod{${H.p}}$.`, answer: `${hi}`, accept: [], hint: `It is ${H.p} minus the smaller one.` },
      { instruction: `Is this toy hash preimage resistant? (yes or no)`, answer: "no", accept: [], hint: `A short search (or a modular square root) inverted it.` },
    ],
    finalAnswer: { value: `${lo}`, unit: "" },
    solutionNarrative: `$x^2 \\equiv ${t} \\pmod{${H.p}}$ has the two roots ${lo} and ${hi}, and both hash to ${y}. With only ${H.p - 1} possible inputs, brute force alone breaks preimage resistance; a real 256-bit hash has no algebra to undo and a search space of $2^{256}$.`,
  };
};

// ============================================================================
// birthday-bound
// ============================================================================

const HASHES = [
  { n: 128, name: "MD5" }, { n: 160, name: "SHA-1" }, { n: 224, name: "SHA-224" },
  { n: 256, name: "SHA-256" }, { n: 384, name: "SHA-384" }, { n: 512, name: "SHA-512" },
];

fill["cr6-bday-d1"] = (rng, idx) => {
  const H = rng.pick(HASHES), r = rng.pick([30, 35, 40, 45]);
  const half = H.n / 2, secs = half - r;
  return {
    id: `gen.cr6-bday-d1.${idx}`, generated: true, concepts: ["birthday-bound"], difficulty: 1, context: "applied",
    prompt: `${H.name} has a ${H.n}-bit output. Treat it as an ideal hash (ignore any known cryptanalysis) and count generic brute-force work. An attacker's cluster computes $2^{${r}}$ hashes per second.`,
    steps: [
      { instruction: `A preimage search takes about $2^n$ tries. Give the exponent $n$.`, answer: `${H.n}`, accept: [], hint: `Each try hits a given ${H.n}-bit digest with probability $2^{-${H.n}}$.` },
      { instruction: `A collision search takes about $2^{n/2}$ tries (the birthday bound). Give that exponent.`, answer: `${half}`, accept: [], hint: `$${H.n} / 2$.` },
      { instruction: `At $2^{${r}}$ hashes per second, the collision search takes about $2^t$ seconds. Give $t$.`, answer: `${secs}`, accept: [], hint: `$2^{${half}} / 2^{${r}} = 2^{${half} - ${r}}$.` },
    ],
    finalAnswer: { value: `${half}`, unit: "" },
    solutionNarrative: `Preimages cost about $2^{${H.n}}$ and collisions about $2^{${half}}$, so ${H.name} offers at most ${half}-bit collision security; at $2^{${r}}$ hashes per second that is $2^{${secs}}$ seconds. ${H.n <= 160 ? `(In reality ${H.name} collisions are far cheaper than this, because cryptanalysis broke it; generic bounds are only an upper limit on security.)` : `This is why ${H.name} is described as having ${half}-bit security: the collision bound, not the preimage bound, sets the level.`}`,
  };
};

fill["cr6-bday-d2"] = (rng, idx) => {
  const N = rng.pick([100, 200, 250, 400, 500, 1000]), k = rng.int(8, 45);
  const pairs = (k * (k - 1)) / 2, exp = pairs / N;
  // Graded as an exact reduced fraction: a short decimal answer like 0.3 would
  // widen the grader's tolerance enough to pass 0.32 or 0.3125.
  const g = gcd(pairs, N), frac = N / g === 1 ? `${pairs / g}` : `${pairs / g}/${N / g}`;
  let kmin = 2; while ((kmin * (kmin - 1)) / 2 < N) kmin++;
  return {
    id: `gen.cr6-bday-d2.${idx}`, generated: true, concepts: ["birthday-bound"], difficulty: 2, context: "abstract",
    prompt: `A toy checksum has $N = ${N}$ equally likely outputs. You hash $k = ${k}$ different random inputs. Every pair of inputs collides with probability $1/N$.`,
    steps: [
      { instruction: `How many pairs of inputs are there? ($\\binom{k}{2} = k(k-1)/2$)`, answer: `${pairs}`, accept: [], hint: `$${k} \\cdot ${k - 1} / 2$.` },
      { instruction: `Expected number of colliding pairs, $\\binom{k}{2} / N$? Give it as an exact fraction in lowest terms.`, answer: frac, accept: [], hint: `$${pairs} / ${N}$, reduced.` },
      { instruction: `What is the smallest $k$ for which $\\binom{k}{2} \\ge N$, so you expect at least one collision?`, answer: `${kmin}`, accept: [], hint: `Try $k$ near $\\sqrt{2N} \\approx ${Math.sqrt(2 * N).toFixed(1)}$.` },
    ],
    finalAnswer: { value: frac, unit: "" },
    solutionNarrative: `${k} inputs make ${pairs} pairs, so about $${pairs}/${N} = ${exp}$ colliding pairs are expected. The pair count grows like $k^2/2$, so collisions show up after only about $\\sqrt{2N}$ inputs (here ${kmin}), not $N$. For an $n$-bit hash, $N = 2^n$ and $\\sqrt{N} = 2^{n/2}$: the birthday bound.`,
  };
};

fill["cr6-bday-d3"] = (rng, idx) => {
  const t = rng.pick([64, 80, 96, 128, 160]);
  let b = rng.pick([56, 64, 72, 80, 90, 100]);
  while (b === t / 2 || b === t) b = rng.pick([56, 64, 72, 80, 90, 100]);
  const s = rng.pick([80, 96, 112, 128, 192, 256]);
  const col = b > t / 2 ? "yes" : "no", pre = b > t ? "yes" : "no";
  return {
    id: `gen.cr6-bday-d3.${idx}`, generated: true, concepts: ["birthday-bound"], difficulty: 3, context: "applied",
    prompt: `Design review. (1) A protocol truncates SHA-256 to ${t} bits to save space. An attacker can afford about $2^{${b}}$ hash computations. Treat the truncated hash as ideal. (2) Separately, a designer wants ${s}-bit security against collisions.`,
    steps: [
      { instruction: `For (1), a collision on the ${t}-bit tag takes about $2^x$ tries. Give $x$.`, answer: `${t / 2}`, accept: [], hint: `Birthday bound: half the output length.` },
      { instruction: `Can the attacker afford a collision? (yes or no)`, answer: col, accept: [], hint: `Compare $2^{${b}}$ with $2^{${t / 2}}$.` },
      { instruction: `A preimage on the ${t}-bit tag takes about $2^y$ tries. Give $y$.`, answer: `${t}`, accept: [], hint: `No birthday trick for preimages.` },
      { instruction: `Can the attacker afford a preimage? (yes or no)`, answer: pre, accept: [], hint: `Compare $2^{${b}}$ with $2^{${t}}$.` },
      { instruction: `For (2), what is the minimum output length in bits?`, answer: `${2 * s}`, accept: [], hint: `Collisions cost $2^{n/2}$, so you need $n/2 \\ge ${s}$.` },
    ],
    finalAnswer: { value: `${2 * s}`, unit: "bits" },
    solutionNarrative: `A ${t}-bit tag gives only ${t / 2}-bit collision security, so a $2^{${b}}$ budget ${col === "yes" ? "is enough to find a collision" : "falls short of a collision"} and ${pre === "yes" ? "even reaches" : "is far from"} a preimage ($2^{${t}}$). For ${s}-bit collision security you need at least ${2 * s} output bits, which is why SHA-256 is called a 128-bit-secure hash.`,
  };
};

// ============================================================================
// merkle-damgard : toy compression f(h, m) = (h + m)^2 mod p, length extension
// ============================================================================

function toyMD(rng) {
  const p = rng.pick([23, 29, 31, 37, 41, 43, 47]);
  const IV = rng.int(1, p - 1);
  const f = (h, m) => mod((h + m) * (h + m), p);
  return {
    p, IV, f,
    tex: `f(h, m) = (h + m)^2 \\bmod ${p}`,
    hint: (h, m) => `$(${h} + ${m})^2 = ${(h + m) ** 2}$, and $${(h + m) ** 2} \\bmod ${p} = ${f(h, m)}$.`,
  };
}
const MD_NOTE = "(This toy skips the final length padding; a real attack includes that padding as glue between the old message and the new block.)";

fill["cr6-md-d1"] = (rng, idx) => {
  const T = toyMD(rng);
  const m1 = rng.int(1, T.p - 1), m2 = rng.int(1, T.p - 1);
  const h1 = T.f(T.IV, m1), h2 = T.f(h1, m2);
  return {
    id: `gen.cr6-md-d1.${idx}`, generated: true, concepts: ["merkle-damgard"], difficulty: 1, context: "abstract",
    prompt: `A toy Merkle-Damgård hash uses the compression function $${T.tex}$ and starts from $h_0 = IV = ${T.IV}$. Each block updates the chaining value, $h_i = f(h_{i-1}, m_i)$, and the digest is the last $h_i$. Hash the two-block message $(m_1, m_2) = (${m1}, ${m2})$.`,
    steps: [
      { instruction: `Compute $h_1 = f(${T.IV}, ${m1})$.`, answer: `${h1}`, accept: [], hint: T.hint(T.IV, m1) },
      { instruction: `Compute the digest $h_2 = f(h_1, ${m2})$.`, answer: `${h2}`, accept: [], hint: T.hint(h1, m2) },
      { instruction: `Someone who knows only the digest $h_2$ (not $m_1$ or $m_2$) appends a block $m_3$. Can they compute the digest of $(m_1, m_2, m_3)$? (yes or no)`, answer: "yes", accept: [], hint: `The next step is $f(h_2, m_3)$: it needs only the chaining value and the new block.` },
    ],
    finalAnswer: { value: `${h2}`, unit: "" },
    solutionNarrative: `$h_1 = ${h1}$ and $h_2 = ${h2}$. The digest IS the internal state after the last block, so anyone holding it can keep hashing more blocks. That is harmless for a plain hash and fatal for a MAC built as $H(k \\,\\|\\, m)$.`,
  };
};

fill["cr6-md-d2"] = (rng, idx) => {
  const T = toyMD(rng);
  const k = rng.int(1, T.p - 1), m = rng.int(1, T.p - 1), x = rng.int(1, T.p - 1);
  const t = T.f(T.f(T.IV, k), m), forged = T.f(t, x);
  return {
    id: `gen.cr6-md-d2.${idx}`, generated: true, concepts: ["merkle-damgard"], difficulty: 2, context: "applied",
    prompt: `A server authenticates messages with the naive MAC $\\text{tag} = H(k \\,\\|\\, m)$, where $k$ is one secret key block and $H$ is the toy Merkle-Damgård hash with $${T.tex}$ and $IV = ${T.IV}$. You see the message block $m = ${m}$ and its tag $t = ${t}$. You want a valid tag for the longer message $m \\,\\|\\, x$ with $x = ${x}$. ${MD_NOTE}`,
    steps: [
      { instruction: `Forge the tag: continue the chain from $t$, computing $f(t, x) = f(${t}, ${x})$.`, answer: `${forged}`, accept: [], hint: T.hint(t, x) },
      { instruction: `Did the forgery need the key $k$? (yes or no)`, answer: "no", accept: [], hint: `The tag already is the chaining value after $k$ and $m$.` },
      { instruction: `Would the same attack work if $H$ were SHA-256 used as $H(k \\,\\|\\, m)$? (yes or no)`, answer: "yes", accept: [], hint: `SHA-256 is a Merkle-Damgård hash whose digest is its full internal state.` },
    ],
    finalAnswer: { value: `${forged}`, unit: "" },
    solutionNarrative: `The server's tag for $k \\,\\|\\, m \\,\\|\\, x$ is $f(t, x) = ${forged}$, which you computed without the key. This is the length-extension attack. It works on MD5, SHA-1, SHA-256 and SHA-512; SHA-3, BLAKE2 and the truncated SHA-512/256 resist it, and HMAC defeats it for any of them.`,
  };
};

fill["cr6-md-d3"] = (rng, idx) => {
  const T = toyMD(rng);
  const k = rng.int(1, T.p - 1), m = rng.int(1, T.p - 1), x = rng.int(1, T.p - 1);
  const h1 = T.f(T.IV, k), t = T.f(h1, m), forged = T.f(t, x);
  return {
    id: `gen.cr6-md-d3.${idx}`, generated: true, concepts: ["merkle-damgard"], difficulty: 3, context: "applied",
    prompt: `Naive MAC $\\text{tag} = H(k \\,\\|\\, m)$ with the toy Merkle-Damgård hash: $${T.tex}$, $IV = ${T.IV}$, one key block and one message block. To check the attack end to end, you are shown the key $k = ${k}$. The message is $m = ${m}$, and the attacker will append $x = ${x}$. ${MD_NOTE}`,
    steps: [
      { instruction: `Server side: $h_1 = f(IV, k) = f(${T.IV}, ${k})$.`, answer: `${h1}`, accept: [], hint: T.hint(T.IV, k) },
      { instruction: `Server side: the published tag $t = f(h_1, m) = f(${h1}, ${m})$.`, answer: `${t}`, accept: [], hint: T.hint(h1, m) },
      { instruction: `Attacker side (knows only $t$ and $x$): forged tag $f(t, x) = f(${t}, ${x})$.`, answer: `${forged}`, accept: [], hint: T.hint(t, x) },
      { instruction: `The server verifies $m \\,\\|\\, x$ by hashing $k \\,\\|\\, m \\,\\|\\, x$ from scratch. Does it accept the forged tag? (yes or no)`, answer: "yes", accept: [], hint: `From scratch it computes $f(f(f(IV, k), m), x)$, and $f(f(IV, k), m)$ is $t$.` },
    ],
    finalAnswer: { value: `${forged}`, unit: "" },
    solutionNarrative: `$h_1 = ${h1}$, $t = ${t}$, and the forgery $f(${t}, ${x}) = ${forged}$ equals the server's own computation of $H(k \\,\\|\\, m \\,\\|\\, x)$, so it verifies. The attacker never saw $k$. In the real attack the appended data also carries the padding of the original message, which the attacker can compute from its length.`,
  };
};

// ============================================================================
// hmac : ipad/opad, toy HMAC, why the outer pass stops length extension
// ============================================================================

fill["cr6-hmac-d1"] = (rng, idx) => {
  const K = rng.int(1, 255);
  const ki = K ^ 54, ko = K ^ 92;
  return {
    id: `gen.cr6-hmac-d1.${idx}`, generated: true, concepts: ["hmac"], difficulty: 1, context: "abstract",
    prompt: `HMAC computes $\\text{HMAC}(K, m) = H\\big((K \\oplus \\text{opad}) \\,\\|\\, H((K \\oplus \\text{ipad}) \\,\\|\\, m)\\big)$, where ipad is the byte $0x36 = 54$ and opad is the byte $0x5C = 92$, each repeated to the hash's block size. Take a one-byte toy key $K = ${K}$ (all answers in decimal).`,
    steps: [
      { instruction: `Compute the inner key byte $K \\oplus 54$.`, answer: `${ki}`, accept: [], hint: xorHint8(K, 54) },
      { instruction: `Compute the outer key byte $K \\oplus 92$.`, answer: `${ko}`, accept: [], hint: xorHint8(K, 92) },
      { instruction: `Which pass hashes the message itself: the inner or the outer? (inner or outer)`, answer: "inner", accept: [], hint: `The outer pass hashes only the outer key and the inner digest.` },
      { instruction: `How many calls to the full hash function $H$ does one HMAC make?`, answer: "2", accept: [], hint: `Count the $H$ symbols in the formula.` },
    ],
    finalAnswer: { value: `${ki}`, unit: "" },
    solutionNarrative: `$K \\oplus 54 = ${ki}$ and $K \\oplus 92 = ${ko}$: two different keys derived from one. The inner pass hashes the message; the outer pass hashes that short digest under the second key, so the published tag is never the inner chaining state an attacker could extend.`,
  };
};

function toyHmac(rng) {
  const T = toyMD(rng);
  const kin = rng.int(1, T.p - 1);
  let kout = rng.int(1, T.p - 1); if (kout === kin) kout = (kin % (T.p - 1)) + 1;
  return { ...T, kin, kout };
}

fill["cr6-hmac-d2"] = (rng, idx) => {
  const T = toyHmac(rng);
  const m = rng.int(1, T.p - 1);
  const a1 = T.f(T.IV, T.kin), inner = T.f(a1, m), o1 = T.f(T.IV, T.kout), tag = T.f(o1, inner);
  return {
    id: `gen.cr6-hmac-d2.${idx}`, generated: true, concepts: ["hmac"], difficulty: 2, context: "abstract",
    prompt: `Toy HMAC over the toy Merkle-Damgård hash $H$ with $${T.tex}$ and $IV = ${T.IV}$. The inner key block is $k_{in} = ${T.kin}$ and the outer key block is $k_{out} = ${T.kout}$ (standing in for $K \\oplus \\text{ipad}$ and $K \\oplus \\text{opad}$). Compute $\\text{tag} = H(k_{out} \\,\\|\\, H(k_{in} \\,\\|\\, m))$ for the one-block message $m = ${m}$.`,
    steps: [
      { instruction: `Inner pass, block 1: $f(IV, k_{in}) = f(${T.IV}, ${T.kin})$.`, answer: `${a1}`, accept: [], hint: T.hint(T.IV, T.kin) },
      { instruction: `Inner digest: $f(${a1}, m) = f(${a1}, ${m})$.`, answer: `${inner}`, accept: [], hint: T.hint(a1, m) },
      { instruction: `Outer pass, block 1: $f(IV, k_{out}) = f(${T.IV}, ${T.kout})$.`, answer: `${o1}`, accept: [], hint: T.hint(T.IV, T.kout) },
      { instruction: `Tag: $f(${o1}, \\text{inner digest}) = f(${o1}, ${inner})$.`, answer: `${tag}`, accept: [], hint: T.hint(o1, inner) },
    ],
    finalAnswer: { value: `${tag}`, unit: "" },
    solutionNarrative: `Inner digest ${inner}, outer chain ${o1}, tag ${tag}. Four compression calls for a one-block message: HMAC costs two extra blocks of hashing, which is nothing next to the protection the outer keyed pass buys.`,
  };
};

fill["cr6-hmac-d3"] = (rng, idx) => {
  for (let tries = 0; tries < 200; tries++) {
    const T = toyHmac(rng);
    const m = rng.int(1, T.p - 1), x = rng.int(1, T.p - 1);
    const inner = T.f(T.f(T.IV, T.kin), m), o1 = T.f(T.IV, T.kout), tag = T.f(o1, inner);
    const guess = T.f(tag, x), inner2 = T.f(inner, x), real = T.f(o1, inner2);
    if (guess === real) continue;
    return {
      id: `gen.cr6-hmac-d3.${idx}`, generated: true, concepts: ["hmac"], difficulty: 3, context: "applied",
      prompt: `Toy HMAC with the toy hash $${T.tex}$, $IV = ${T.IV}$ and outer key block $k_{out} = ${T.kout}$. For the message $m = ${m}$ the server's inner digest is $H(k_{in} \\,\\|\\, m) = ${inner}$ and the published tag is $t = H(k_{out} \\,\\|\\, ${inner}) = ${tag}$. An attacker tries length extension: they append $x = ${x}$ and submit $f(t, x)$ as the tag for $m \\,\\|\\, x$.`,
      steps: [
        { instruction: `Attacker's guess: $f(t, x) = f(${tag}, ${x})$.`, answer: `${guess}`, accept: [], hint: T.hint(tag, x) },
        { instruction: `Server, new inner digest for $m \\,\\|\\, x$: $f(${inner}, ${x})$.`, answer: `${inner2}`, accept: [], hint: T.hint(inner, x) },
        { instruction: `Server, outer chain: $f(IV, k_{out}) = f(${T.IV}, ${T.kout})$.`, answer: `${o1}`, accept: [], hint: T.hint(T.IV, T.kout) },
        { instruction: `Server, real tag: $f(${o1}, ${inner2})$.`, answer: `${real}`, accept: [], hint: T.hint(o1, inner2) },
        { instruction: `Does the attacker's guess match the real tag? (yes or no)`, answer: "no", accept: [], hint: `Compare ${guess} with ${real}.` },
      ],
      finalAnswer: { value: `${real}`, unit: "" },
      solutionNarrative: `The guess ${guess} is $H(k_{out} \\,\\|\\, ${inner} \\,\\|\\, ${x})$, a hash of the wrong thing. The real tag ${real} needs the new INNER digest pushed through the outer keyed pass, and the attacker knows neither the inner digest nor $k_{out}$. Extending the outer hash gets them nowhere, which is exactly why HMAC uses two keyed passes.`,
    };
  }
  throw new Error("cr6-hmac-d3: no non-colliding draw");
};

// ============================================================================
// rsa-signatures : toy RSA sign/verify, multiplicative forgery, PSS
// ============================================================================

const RSA_KEYS = (() => {
  const P = [3, 5, 7, 11, 13, 17, 23], out = [];
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const p = P[i], q = P[j], n = p * q, phi = (p - 1) * (q - 1);
    for (let e = 3; e <= 15; e += 2) {
      if (gcd(e, phi) !== 1) continue;
      const d = modinv(e, phi);
      if (d !== e) out.push({ p, q, n, phi, e, d });
    }
  }
  return out;
})();
const unitsOf = (n) => [...Array(n).keys()].filter((m) => m >= 2 && m <= n - 2 && gcd(m, n) === 1);

fill["cr6-rsa-d1"] = (rng, idx) => {
  const key = rng.pick(RSA_KEYS.filter((k) => k.e === 3 && k.n >= 30 && k.n <= 100));
  const U = unitsOf(key.n);
  let m, s;
  do { m = rng.pick(U); s = powmod(m, key.d, key.n); } while (s === m);
  const valid = rng.int(1, 3) !== 1;
  if (!valid) { do { s = rng.pick(U); } while (powmod(s, 3, key.n) === m); }
  const v = powmod(s, 3, key.n), s2 = (s * s) % key.n;
  return {
    id: `gen.cr6-rsa-d1.${idx}`, generated: true, concepts: ["rsa-signatures"], difficulty: 1, context: "abstract",
    prompt: `Toy RSA signatures. The public key is $(n, e) = (${key.n}, 3)$. A signature $s$ on message $m$ is valid when $s^e \\bmod n = m$. You receive the message $m = ${m}$ with claimed signature $s = ${s}$.`,
    steps: [
      { instruction: `Compute $s^3 \\bmod ${key.n} = ${s}^3 \\bmod ${key.n}$.`, answer: `${v}`, accept: [], hint: `$${s}^2 = ${s * s} \\equiv ${s2}$, then $${s2} \\cdot ${s} = ${s2 * s} \\equiv ${v} \\pmod{${key.n}}$.` },
      { instruction: `Is the signature valid for $m = ${m}$? (yes or no)`, answer: valid ? "yes" : "no", accept: [], hint: `Compare ${v} with ${m}.` },
    ],
    finalAnswer: { value: valid ? "yes" : "no", unit: "" },
    solutionNarrative: `$${s}^3 \\equiv ${v} \\pmod{${key.n}}$, which ${valid ? "matches" : `does not match $m = ${m}$`}, so the signature is ${valid ? "valid" : "invalid"}. Verification needs only the public key, which is the point of a signature: anyone can check it, but only the holder of $d$ can produce it.`,
  };
};

fill["cr6-rsa-d2"] = (rng, idx) => {
  const key = rng.pick(RSA_KEYS.filter((k) => k.n >= 30 && k.d <= 15));
  const U = unitsOf(key.n);
  let m, s;
  do { m = rng.pick(U); s = powmod(m, key.d, key.n); } while (s === m);
  return {
    id: `gen.cr6-rsa-d2.${idx}`, generated: true, concepts: ["rsa-signatures"], difficulty: 2, context: "abstract",
    prompt: `Toy RSA key: $n = ${key.n} = ${key.p} \\cdot ${key.q}$, public exponent $e = ${key.e}$, private exponent $d = ${key.d}$ (check: $${key.e} \\cdot ${key.d} = ${key.e * key.d} \\equiv 1 \\pmod{${key.phi}}$). Sign the message $m = ${m}$ with $s = m^d \\bmod n$, then verify it.`,
    steps: [
      { instruction: `Sign: $s = ${m}^{${key.d}} \\bmod ${key.n}$.`, answer: `${s}`, accept: [], hint: powHint(m, key.d, key.n) },
      { instruction: `Verify: $s^{${key.e}} \\bmod ${key.n} = ${s}^{${key.e}} \\bmod ${key.n}$.`, answer: `${m}`, accept: [], hint: powHint(s, key.e, key.n) },
      { instruction: `Which key did signing use? (public or private)`, answer: "private", accept: [], hint: `Signing uses $d$; verifying uses $e$.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `$s = ${m}^{${key.d}} \\equiv ${s}$ and $s^{${key.e}} \\equiv ${m} \\pmod{${key.n}}$, so verification recovers $m$. Signing is RSA decryption applied to the message, and verifying is RSA encryption applied to the signature. Real systems never sign $m$ raw: they hash it and encode it with a padding scheme such as PSS.`,
  };
};

fill["cr6-rsa-d3"] = (rng, idx) => {
  const key = rng.pick(RSA_KEYS.filter((k) => (k.e === 3 || k.e === 5) && k.n >= 30 && k.n <= 100));
  const U = unitsOf(key.n);
  let m1, m2, m3, s1, s2;
  do {
    m1 = rng.pick(U); m2 = rng.pick(U); m3 = (m1 * m2) % key.n;
    s1 = powmod(m1, key.d, key.n); s2 = powmod(m2, key.d, key.n);
  } while (m1 === m2 || m3 === 1 || m3 === m1 || m3 === m2 || s1 === m1 || s2 === m2);
  const s3 = (s1 * s2) % key.n, v = powmod(s3, key.e, key.n);
  return {
    id: `gen.cr6-rsa-d3.${idx}`, generated: true, concepts: ["rsa-signatures"], difficulty: 3, context: "applied",
    prompt: `Raw (textbook) RSA signatures with public key $(n, e) = (${key.n}, ${key.e})$. You hold two genuine signatures: $s_1 = ${s1}$ on $m_1 = ${m1}$ and $s_2 = ${s2}$ on $m_2 = ${m2}$. You never see the private key. Forge a signature on a third message using $(m_1 m_2)^d = m_1^d m_2^d$.`,
    steps: [
      { instruction: `The message you can forge: $m_3 = m_1 m_2 \\bmod ${key.n}$.`, answer: `${m3}`, accept: [], hint: `$${m1} \\cdot ${m2} = ${m1 * m2}$, then reduce mod ${key.n}.` },
      { instruction: `The forged signature: $s_3 = s_1 s_2 \\bmod ${key.n}$.`, answer: `${s3}`, accept: [], hint: `$${s1} \\cdot ${s2} = ${s1 * s2}$, then reduce mod ${key.n}.` },
      { instruction: `Verify it: $s_3^{${key.e}} \\bmod ${key.n}$.`, answer: `${v}`, accept: [], hint: powHint(s3, key.e, key.n) },
      { instruction: `Which padding scheme is designed for RSA signatures and blocks this algebra with a random salt and a hashed encoding? (PSS or OAEP)`, answer: "PSS", accept: ["RSA PSS", "RSASSA PSS"], hint: `OAEP is the padding for RSA encryption; the signature scheme is the Probabilistic Signature Scheme.` },
    ],
    finalAnswer: { value: `${s3}`, unit: "" },
    solutionNarrative: `$s_3 = ${s1} \\cdot ${s2} \\equiv ${s3}$ and $s_3^{${key.e}} \\equiv ${v} = m_3 \\pmod{${key.n}}$: a valid signature on ${m3} that the key holder never made. Raw RSA signatures are malleable because RSA is multiplicative. RSA-PSS signs a randomized, hashed encoding of the message, so products of encodings are not encodings of anything meaningful.`,
  };
};

// ============================================================================
// signature-nonces : toy Schnorr in the order-q subgroup of Z_p^*
// ============================================================================

const GROUPS = [{ p: 23, q: 11 }, { p: 47, q: 23 }];
function schnorrGroup(rng) {
  const G = rng.pick(GROUPS);
  const gens = [];
  for (let h = 2; h < G.p - 1; h++) { const g = (h * h) % G.p; if (g !== 1 && g <= 13 && !gens.includes(g)) gens.push(g); }
  const g = rng.pick(gens.sort((a, b) => a - b));
  return { ...G, g };
}
const groupTex = (S) => `$p = ${S.p}$, $q = ${S.q}$, $g = ${S.g}$ (so $g^{${S.q}} \\equiv 1 \\pmod{${S.p}}$)`;

fill["cr6-sch-d1"] = (rng, idx) => {
  const S = schnorrGroup(rng);
  const x = rng.int(2, S.q - 1);
  let k = rng.int(2, S.q - 1); if (k === x) k = (k % (S.q - 2)) + 2;
  const e = rng.int(1, S.q - 1);
  const r = powmod(S.g, k, S.p), xe = mod(x * e, S.q), s = mod(k + x * e, S.q);
  return {
    id: `gen.cr6-sch-d1.${idx}`, generated: true, concepts: ["signature-nonces"], difficulty: 1, context: "abstract",
    prompt: `Toy Schnorr signature with ${groupTex(S)}. The private key is $x = ${x}$. To sign, pick a secret nonce $k$, publish $r = g^k \\bmod p$, hash to get $e = H(r \\,\\|\\, m)$, and compute $s = (k + x e) \\bmod q$. Here the nonce is $k = ${k}$ and the hash gives $e = ${e}$.`,
    steps: [
      { instruction: `Compute $r = ${S.g}^{${k}} \\bmod ${S.p}$.`, answer: `${r}`, accept: [], hint: powHint(S.g, k, S.p) },
      { instruction: `Compute $x e \\bmod ${S.q} = ${x} \\cdot ${e} \\bmod ${S.q}$.`, answer: `${xe}`, accept: [], hint: `$${x} \\cdot ${e} = ${x * e}$, then reduce mod ${S.q}.` },
      { instruction: `Compute $s = (k + x e) \\bmod ${S.q}$.`, answer: `${s}`, accept: [], hint: `$${k} + ${xe} = ${k + xe}$, then reduce mod ${S.q}.` },
    ],
    finalAnswer: { value: `${s}`, unit: "" },
    solutionNarrative: `The signature is $(r, s) = (${r}, ${s})$. Exponents live mod $q = ${S.q}$ because $g$ has order ${S.q}. The nonce $k$ masks $x$ inside $s$: if $k$ ever leaks or repeats, $x$ falls out with one subtraction and one division.`,
  };
};

fill["cr6-sch-d2"] = (rng, idx) => {
  const S = schnorrGroup(rng);
  const x = rng.int(2, S.q - 1), k = rng.int(2, S.q - 1), e = rng.int(2, Math.min(9, S.q - 1));
  const y = powmod(S.g, x, S.p), r = powmod(S.g, k, S.p);
  let s = mod(k + x * e, S.q);
  const valid = rng.int(1, 3) !== 1;
  if (!valid) s = mod(s + rng.int(1, S.q - 1), S.q);
  const gs = powmod(S.g, s, S.p), ye = powmod(y, e, S.p), rhs = mod(r * ye, S.p);
  return {
    id: `gen.cr6-sch-d2.${idx}`, generated: true, concepts: ["signature-nonces"], difficulty: 2, context: "abstract",
    prompt: `Verify a toy Schnorr signature. Group: ${groupTex(S)}. Public key $y = ${y}$. The message hashes to $e = ${e}$ and the claimed signature is $(r, s) = (${r}, ${s})$. It is valid when $g^s \\equiv r \\cdot y^e \\pmod p$.`,
    steps: [
      { instruction: `Compute $g^s = ${S.g}^{${s}} \\bmod ${S.p}$.`, answer: `${gs}`, accept: [], hint: s === 0 ? `Anything to the power 0 is 1.` : powHint(S.g, s, S.p) },
      { instruction: `Compute $y^e = ${y}^{${e}} \\bmod ${S.p}$.`, answer: `${ye}`, accept: [], hint: powHint(y, e, S.p) },
      { instruction: `Compute $r \\cdot y^e \\bmod ${S.p}$.`, answer: `${rhs}`, accept: [], hint: `$${r} \\cdot ${ye} = ${r * ye}$, then reduce mod ${S.p}.` },
      { instruction: `Is the signature valid? (yes or no)`, answer: gs === rhs ? "yes" : "no", accept: [], hint: `Compare ${gs} with ${rhs}.` },
    ],
    finalAnswer: { value: gs === rhs ? "yes" : "no", unit: "" },
    solutionNarrative: `$g^s \\equiv ${gs}$ and $r y^e \\equiv ${rhs}$, so the signature is ${gs === rhs ? "valid" : "invalid"}. It works because $g^{k + xe} = g^k (g^x)^e = r y^e$: the verifier checks the algebra without ever learning $k$ or $x$.`,
  };
};

fill["cr6-sch-d3"] = (rng, idx) => {
  const S = schnorrGroup(rng);
  for (let tries = 0; tries < 200; tries++) {
    const z = rng.int(2, S.q - 1), x = rng.int(2, S.q - 1);
    const hA = rng.int(1, S.q - 1); let hB = rng.int(1, S.q - 1); if (hB === hA) continue;
    const eA = rng.int(1, S.q - 1);
    const kA = mod(z * hA + 1, S.q), kB = mod(z * hB + 1, S.q);
    if (kA === 0 || kB === 0) continue;
    const sA = mod(kA + x * eA, S.q);
    return {
      id: `gen.cr6-sch-d3.${idx}`, generated: true, concepts: ["signature-nonces"], difficulty: 3, context: "applied",
      prompt: `An EdDSA-style signer never asks a random number generator for its nonce. It derives it from a secret nonce key $z$ and the message: real Ed25519 uses $k = H(\\text{prefix} \\,\\|\\, m)$; this toy uses $k = (z \\cdot h + 1) \\bmod q$, where $h$ is the message's hash value. Schnorr group order $q = ${S.q}$, nonce key $z = ${z}$, private key $x = ${x}$. Message A has $h_A = ${hA}$ and challenge $e_A = ${eA}$; message B has $h_B = ${hB}$.`,
      steps: [
        { instruction: `Nonce for A: $k_A = (${z} \\cdot ${hA} + 1) \\bmod ${S.q}$.`, answer: `${kA}`, accept: [], hint: `$${z} \\cdot ${hA} + 1 = ${z * hA + 1}$, then reduce mod ${S.q}.` },
        { instruction: `Signature value for A: $s_A = (k_A + x e_A) \\bmod ${S.q}$.`, answer: `${sA}`, accept: [], hint: `$${kA} + ${x} \\cdot ${eA} = ${kA + x * eA}$, then reduce mod ${S.q}.` },
        { instruction: `Nonce for B: $k_B = (${z} \\cdot ${hB} + 1) \\bmod ${S.q}$.`, answer: `${kB}`, accept: [], hint: `$${z} \\cdot ${hB} + 1 = ${z * hB + 1}$, then reduce mod ${S.q}.` },
        { instruction: `Under this rule, can two messages with DIFFERENT hash values ever get the same nonce? (yes or no)`, answer: "no", accept: [], hint: `Equal nonces need $z(h_A - h_B) \\equiv 0 \\pmod{${S.q}}$, impossible for prime $q$ with $z \\not\\equiv 0$ and $h_A \\ne h_B$.` },
        { instruction: `Which scheme, as usually deployed, draws $k$ from a random number generator at signing time, so a weak generator can repeat it and leak the key? (ECDSA or EdDSA)`, answer: "ECDSA", accept: [], hint: `EdDSA (Ed25519) derives $k$ deterministically; classic ECDSA needs fresh randomness for every signature.` },
      ],
      finalAnswer: { value: `${sA}`, unit: "" },
      solutionNarrative: `$k_A = ${kA}$, $s_A = ${sA}$, $k_B = ${kB}$. Different messages get different nonces, and signing the same message twice repeats the same $k$ and the same signature, which leaks nothing new. A random-nonce scheme like ECDSA (or Schnorr with a bad generator) is only as strong as its generator: one repeated $k$ on two different messages reveals $x$. RFC 6979 retrofits deterministic nonces onto ECDSA for the same reason.`,
    };
  }
  throw new Error("cr6-sch-d3: no draw");
};
