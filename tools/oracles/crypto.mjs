// Oracles for the cryptography packs that teach attacks and modes:
// gen-crypto4-fill.js (cr4-, "How Cryptography Breaks") and
// gen-crypto5-fill.js (cr5-, AES modes of operation).
//
// Every oracle re-reads the givens from the PROMPT and recomputes each step by
// brute force (cipher inverses by table, ECDSA (k, d) and GCM (H, S) by
// exhaustive search, error propagation by simulating a flipped bit through a
// real permutation). Each also asserts that the grader rejects nearby wrong
// answers: off by one, off by the modulus, a decimal that spells the answer in
// binary, and the other menu words.

const md = (a, n) => ((a % n) + n) % n;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const isPrime = (x) => { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; };
const inv = (a, p) => { for (let x = 1; x < p; x++) if (md(a * x, p) === 1) return x; return null; };
const num = (s, re) => { const m = s.match(re); if (!m) throw new Error(`unparsed ${re}`); return m.slice(1).map(Number); };

const MODES = ["ECB", "CBC", "CFB", "OFB", "CTR", "GCM", "CCM", "SIV", "XTS"];
const WORDS = ["yes", "no", "encryption", "decryption", "first", "second"];

// Compare every step answer with the expected list, then probe wrong answers.
function check(p, exp, { checkStep }) {
  const ans = p.steps.map((s) => s.answer);
  if (exp.length !== ans.length || exp.some((v, k) => String(v) !== ans[k])) return `answers ${ans.join("|")}, want ${exp.join("|")}`;
  for (const s of p.steps) {
    const a = Number(s.answer);
    const wrong = Number.isFinite(a) ? [a + 1, a - 1, a + 11, a + 16, a + 17, Number(a.toString(2))]
      : MODES.includes(s.answer) ? MODES : WORDS;
    for (const w of wrong) if (String(w) !== s.answer && checkStep(s, String(w))) return `wrong answer '${w}' accepted for '${s.answer}'`;
  }
  return null;
}
const guard = (fn) => (p, ctx) => { try { return fn(p, ctx); } catch (e) { return e.message; } };

// ---------------------------------------------------------------- cr4
const ksr = (tier) => guard((p, ctx) => {
  const [C1] = num(p.prompt, /C_1 = (?:M_1 \\oplus K = )?(\d+)/), [C2] = num(p.prompt, /C_2 = (?:M_2 \\oplus K = )?(\d+)/), [M1] = num(p.prompt, /M_1 = (\d+)/);
  const K = C1 ^ M1, M2 = C2 ^ K, x = C1 ^ C2;
  if (M1 === M2) return "the two messages are equal";
  return check(p, tier === 1 ? [x, K] : tier === 2 ? [x, K, M2] : [x, M2, K, 2 ** 36 - 32], ctx);
});
const ecbCounts = (p) => {
  const m = p.prompt.match(/blocks: (.*?)\. \(/) || p.prompt.match(/\(by block value\): (.*?)\. Identical/);
  if (!m) throw new Error("unparsed block list");
  const cnt = {};
  for (const b of m[1].split(/[ ,]+/).map((t) => t.replace(/^c\d+=/, "")).filter(Boolean)) cnt[b] = (cnt[b] || 0) + 1;
  return Object.values(cnt);
};
const ecdsa = (tier) => guard((p, ctx) => {
  const P = p.prompt;
  const [n] = num(P, /n = (\d+)/), [r] = num(P, /r = (\d+)/), [z1] = num(P, /z_1 = (\d+)/), [z2] = num(P, /z_2 = (\d+)/);
  const [s1] = num(P, /s_1(?:\) = \(\d+,|\s*=) ?(\d+)/), [s2] = num(P, /s_2(?:\) = \(\d+,|\s*=) ?(\d+)/);
  const sols = [];
  for (let k = 1; k < n; k++) for (let d = 1; d < n; d++) if (md(s1 * k, n) === md(z1 + r * d, n) && md(s2 * k, n) === md(z2 + r * d, n)) sols.push([k, d]);
  if (sols.length !== 1) return `${sols.length} (k, d) pairs fit the signatures`;
  const [k, d] = sols[0], zd = md(z1 - z2, n), sd = md(s1 - s2, n);
  return check(p, tier === 1 ? [zd, sd, k] : tier === 2 ? [k, md(s1 * k - z1, n), d] : [zd, sd, k, d, 0], ctx);
});
const sharedPrime = (tier) => guard((p, ctx) => {
  const [n1] = num(p.prompt, /n_1 = (\d+)/), [n2] = num(p.prompt, /n_2 = (\d+)/);
  const q = gcd(n1, n2), q1 = n1 / q, q2 = n2 / q;
  if (!isPrime(q) || !isPrime(q1) || !isPrime(q2) || q1 === q2) return `moduli ${n1}, ${n2} do not share exactly one prime`;
  if (tier === 2) return check(p, [n2 % n1, q, q1], ctx);
  const [e] = num(p.prompt, /exponent \$e = (\d+)/), phi = (q - 1) * (q1 - 1);
  if (gcd(e, phi) !== 1) return `e = ${e} not coprime to phi = ${phi}`;
  const d = inv(e, phi);
  if (d === e) return "d equals e";
  return check(p, [q, q1, phi, d], ctx);
});

// ---------------------------------------------------------------- cr5
// The toy cipher, read from the prompt: E(x) = (ax + b) mod 16, or its inverse D.
function cipher(P) {
  let a, b;
  if (/E\(x\) = \(/.test(P)) [a, b] = num(P, /E\(x\) = \((\d+)x \+ (\d+)\)/);
  else { const [ai, bb] = num(P, /D\(y\) = (\d+)\(y - (\d+)\)/); b = bb; a = inv(ai, 16); }
  const E = (x) => md(a * x + b, 16), Dt = {};
  for (let x = 0; x < 16; x++) Dt[E(x)] = x;
  if (Object.keys(Dt).length !== 16) throw new Error("toy cipher is not a permutation");
  return { E, D: (y) => Dt[y] };
}
// Simulate one flipped ciphertext bit through a real 8-bit permutation.
function errorProfile(mode, N, j) {
  const perm = [...Array(256).keys()].sort((a, b) => ((a * 167 + 13) % 256) - ((b * 167 + 13) % 256));
  const E = (x) => perm[x], Dt = {}; perm.forEach((v, x) => (Dt[v] = x));
  const pt = [...Array(N)].map((_, k) => (k * 37 + 11) % 256), iv = 99, ctr = (k) => E((200 + k) % 256);
  const c = []; let prev = iv;
  for (let k = 0; k < N; k++) {
    if (mode === "ECB") c.push(E(pt[k]));
    else if (mode === "CBC") { prev = E(pt[k] ^ prev); c.push(prev); }
    else if (mode === "CFB") { prev = pt[k] ^ E(prev); c.push(prev); }
    else if (mode === "CTR") c.push(pt[k] ^ ctr(k));
    else if (mode === "OFB") { prev = E(prev); c.push(pt[k] ^ prev); }
  }
  c[j - 1] ^= 4;
  let o = iv, affected = 0, garbled = 0;
  for (let k = 0; k < N; k++) {
    const cp = k ? c[k - 1] : iv;
    let q;
    if (mode === "ECB") q = Dt[c[k]]; else if (mode === "CBC") q = Dt[c[k]] ^ cp;
    else if (mode === "CFB") q = c[k] ^ E(cp); else if (mode === "CTR") q = c[k] ^ ctr(k);
    else { o = E(o); q = c[k] ^ o; }
    if (q !== pt[k]) { affected++; if ((q ^ pt[k]) !== 4) garbled++; }
  }
  return [affected, garbled];
}
const SCENARIO_KEYS = { "full-disk": "XTS", "tls 1.3": "GCM", "accidentally repeat": "SIV", "cbc-mac": "CCM", "single block": "ECB", "chains each plaintext": "CBC", "parallel stream cipher": "CTR", "encrypted over and over": "OFB", "each previous ciphertext block": "CFB" };
const modeOf = (txt) => { const m = Object.entries(SCENARIO_KEYS).filter(([k]) => txt.toLowerCase().includes(k)).map(([, v]) => v); if (m.length !== 1) throw new Error(`scenario matches ${m.length} modes`); return m[0]; };
const AUTH = (m) => (["GCM", "CCM", "SIV"].includes(m) ? "yes" : "no");
// Brute-force the toy GHASH secrets from two same-nonce (message, tag) pairs.
function ghashSecrets(P) {
  const [pp] = num(P, /mathbb\{Z\}_\{(\d+)\}/);
  const [a1, a2] = num(P, /A (?:is \$|\$= )\((\d+), (\d+)\)/), [TA] = num(P, /with tag \$(\d+)\$/);
  const [b1, b2] = num(P, /B (?:is \$|\$= )\((\d+), (\d+)\)/), [TB] = num(P, /B [^]*?with tag \$(\d+)\$/);
  if (a1 !== b1 || a2 === b2) throw new Error("messages must differ only in block 2");
  const sols = [];
  for (let H = 0; H < pp; H++) for (let S = 0; S < pp; S++) if (md(a1 * H * H + a2 * H + S, pp) === TA && md(b1 * H * H + b2 * H + S, pp) === TB) sols.push([H, S]);
  if (sols.length !== 1) throw new Error(`${sols.length} (H, S) pairs fit the tags`);
  return { pp, a1, a2, b2, TA, TB, H: sols[0][0], S: sols[0][1] };
}

export const oracles = {
  "cr4-ksr-d1": ksr(1), "cr4-ksr-d2": ksr(2), "cr4-ksr-d3": ksr(3),
  "cr4-ecb-d1": guard((p, ctx) => {
    const v = ecbCounts(p), rep = v.filter((c) => c > 1);
    return rep.length !== 1 ? "need exactly one repeated value" : check(p, [v.length, rep[0]], ctx);
  }),
  "cr4-ecb-d2": guard((p, ctx) => {
    const v = ecbCounts(p), rep = v.filter((c) => c > 1);
    return rep.length !== 2 ? "need exactly two repeated values" : check(p, [v.length, rep[0] + rep[1], v.filter((c) => c === 1).length], ctx);
  }),
  "cr4-ecb-d3": guard((p, ctx) => {
    const [total] = num(p.prompt, /A (\d+)-block/), [flat] = num(p.prompt, /: (\d+) of its blocks/);
    const distinct = 1 + total - flat;
    return check(p, [distinct, flat, total - distinct], ctx);
  }),
  "cr4-ecdsa-d1": ecdsa(1), "cr4-ecdsa-d2": ecdsa(2), "cr4-ecdsa-d3": ecdsa(3),
  "cr4-rsa-d1": guard((p, ctx) => {
    const [c] = num(p.prompt, /c = (\d+)\$ exactly/), m = Math.round(Math.cbrt(c));
    return m ** 3 !== c ? `${c} is not a cube` : check(p, [m], ctx);
  }),
  "cr4-rsa-d2": sharedPrime(2), "cr4-rsa-d3": sharedPrime(3),

  "cr5-cbc-d1": guard((p, ctx) => {
    const C = cipher(p.prompt), [x, y, z] = num(p.prompt, /P = \((\d+), (\d+), (\d+)\)/);
    if (x !== z || x === y) return "block 3 must repeat block 1 only";
    return check(p, [C.E(x), C.E(y), C.E(z), new Set([C.E(x), C.E(y)]).size], ctx);
  }),
  "cr5-cbc-d2": guard((p, ctx) => {
    const C = cipher(p.prompt), [p1, p2] = num(p.prompt, /P = \((\d+), (\d+)\)/), [iv] = num(p.prompt, /IV = (\d+)/), c1 = C.E(p1 ^ iv);
    return check(p, [p1 ^ iv, c1, p2 ^ c1, C.E(p2 ^ c1)], ctx);
  }),
  "cr5-cbc-d3": guard((p, ctx) => {
    const C = cipher(p.prompt), [iv] = num(p.prompt, /IV = (\d+)/), [c1, c2] = num(p.prompt, /C = \((\d+), (\d+)\)/);
    return check(p, [C.D(c1), C.D(c1) ^ iv, C.D(c2), C.D(c2) ^ c1, "yes"], ctx);
  }),
  "cr5-str-d1": guard((p, ctx) => {
    const C = cipher(p.prompt), [p1, p2] = num(p.prompt, /P = \((\d+), (\d+)\)/), [k1] = num(p.prompt, /ctr\}_1 = (\d+)/), [k2] = num(p.prompt, /ctr\}_2 = (\d+)/);
    return check(p, [C.E(k1), p1 ^ C.E(k1), C.E(k2), p2 ^ C.E(k2)], ctx);
  }),
  "cr5-str-d2": guard((p, ctx) => {
    const C = cipher(p.prompt), [p1, p2] = num(p.prompt, /P = \((\d+), (\d+)\)/), [iv] = num(p.prompt, /IV = (\d+)\$\./), o1 = C.E(iv), o2 = C.E(o1);
    return check(p, [o1, p1 ^ o1, o2, p2 ^ o2, "encryption"], ctx);
  }),
  "cr5-str-d3": guard((p, ctx) => {
    const C = cipher(p.prompt), [iv] = num(p.prompt, /receive \$IV = (\d+)/), [c1, c2] = num(p.prompt, /C = \((\d+), (\d+)\)/);
    return check(p, [C.E(iv), c1 ^ C.E(iv), C.E(c1), c2 ^ C.E(c1), "no"], ctx);
  }),
  "cr5-prop-d1": guard((p, ctx) => {
    const [N] = num(p.prompt, /A (\d+)-block/), [j] = num(p.prompt, /block \$C_(\d+)\$/), mode = p.prompt.match(/in (\w+) mode/)[1];
    return check(p, errorProfile(mode, N, j), ctx);
  }),
  "cr5-prop-d2": guard((p, ctx) => {
    const T = { ECB: ["yes", "yes", "yes", "no"], CBC: ["no", "yes", "yes", "no"], CFB: ["no", "yes", "no", "yes"], OFB: ["no", "no", "no", "yes"], CTR: ["yes", "yes", "no", "yes"] };
    return check(p, T[p.prompt.match(/AES in (\w+) mode/)[1]], ctx);
  }),
  "cr5-prop-d3": guard((p, ctx) => {
    const [L] = num(p.prompt, /A (\d+)-byte/), pad = 16 - (L % 16);
    return check(p, [pad, pad, 16 + L + pad, 12 + L + 16], ctx);
  }),
  "cr5-mal-d1": guard((p, ctx) => {
    const [X] = num(p.prompt, /\(ASCII (\d+)\); its/), [Y] = num(p.prompt, /'.' \(ASCII (\d+)\) instead/), [C] = num(p.prompt, /byte is \$C = (\d+)/);
    return check(p, [X ^ Y, C ^ X ^ Y, "no"], ctx);
  }),
  "cr5-mal-d2": guard((p, ctx) => {
    const [c1] = num(p.prompt, /C_1 = (\d+)/), [p2] = num(p.prompt, /knows \$P_2 = (\d+)/), [t] = num(p.prompt, /decrypt \$P_2 = (\d+)/);
    return check(p, [p2 ^ t, c1 ^ p2 ^ t, t, "first"], ctx);
  }),
  "cr5-mal-d3": guard((p, ctx) => {
    const [cp] = num(p.prompt, /\(really (\d+)\)/), [g] = num(p.prompt, /valid at \$g = (\d+)/);
    const I = [...Array(256).keys()].find((i) => (i ^ g) === 1), pt = I ^ cp;
    if (pt < 2 || pt > 16) return `original last byte ${pt} is not a multi-byte PKCS#7 pad`;
    return check(p, [I, pt, I ^ 2, 4096], ctx);
  }),
  "cr5-gcm-d1": guard((p, ctx) => {
    const [pp] = num(p.prompt, /mathbb\{Z\}_\{(\d+)\}/), [c1, c2] = num(p.prompt, /\(c_1, c_2\) = \((\d+), (\d+)\)/), [H] = num(p.prompt, /H = (\d+)\$ and/), [S] = num(p.prompt, /S = (\d+)\$ \(/);
    return check(p, [md(H * H, pp), md(c1 * H * H, pp), md(c2 * H, pp), md(c1 * H * H + c2 * H + S, pp)], ctx);
  }),
  "cr5-gcm-d2": guard((p, ctx) => {
    const g = ghashSecrets(p.prompt), dc = md(g.a2 - g.b2, g.pp);
    return check(p, [md(g.TA - g.TB, g.pp), dc, inv(dc, g.pp), g.H], ctx);
  }),
  "cr5-gcm-d3": guard((p, ctx) => {
    const g = ghashSecrets(p.prompt), [n1, n2] = num(p.prompt, /message C \$= \((\d+), (\d+)\)/);
    if (n2 === g.a2 || n2 === g.b2) return "message C repeats a captured message";
    return check(p, [g.H, g.S, md(n1 * g.H * g.H + n2 * g.H + g.S, g.pp), "no"], ctx);
  }),
  "cr5-pick-d1": guard((p, ctx) => { const m = modeOf(p.prompt); return check(p, [m, AUTH(m)], ctx); }),
  "cr5-pick-d2": guard((p, ctx) => {
    const [A, B] = p.prompt.split("**B:**"), ma = modeOf(A), mb = modeOf(B);
    return check(p, [ma, mb, AUTH(ma)], ctx);
  }),
  "cr5-pick-d3": guard((p, ctx) => {
    const m = modeOf(p.prompt.split("(2)")[0]), [servers] = num(p.prompt, /\(2\)[^]*?(\d+) servers/);
    return check(p, [m, 32 - Math.log2(servers), "yes"], ctx);
  }),
};
