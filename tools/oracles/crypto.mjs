// Oracles for the cryptography packs that teach attacks and modes:
// gen-crypto4-fill.js (cr4-, "How Cryptography Breaks"),
// gen-crypto5-fill.js (cr5-, AES modes of operation),
// gen-crypto6-fill.js (cr6-, hashes, MACs and signatures) and
// gen-crypto7-fill.js (cr7-, discrete-log and RSA attacks).
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

// ---------------------------------------------------------------- cr6
// Hashes, MACs and signatures. Powers are recomputed by repeated
// multiplication, RSA keys by trial factoring, Schnorr secrets by brute-force
// discrete logs, and every yes/no verdict by simulating both sides.
const W6 = ["yes", "no", "preimage", "second preimage", "collision", "inner", "outer", "public", "private", "PSS", "OAEP", "ECDSA", "EdDSA"];
const pw = (b, e, m) => { let r = 1 % m; for (let i = 0; i < e; i++) r = (r * b) % m; return r; };
// Like check(), with this pack's menu words and optional extra wrong answers per step.
function check6(p, exp, { checkStep }, extra = []) {
  const ans = p.steps.map((s) => s.answer);
  if (exp.length !== ans.length || exp.some((v, k) => String(v) !== ans[k])) return `answers ${ans.join("|")}, want ${exp.join("|")}`;
  for (const [k, s] of p.steps.entries()) {
    const a = Number(s.answer);
    const wrong = (Number.isFinite(a) ? [a + 1, a - 1, a + 11, a + 16, a + 17, Number(a.toString(2))] : W6).concat(extra[k] || []);
    for (const w of wrong) if (String(w) !== s.answer && checkStep(s, String(w))) return `wrong answer '${w}' accepted for '${s.answer}'`;
  }
  return null;
}
const toyHashOf = (P) => { const [c, pp] = num(P, /h\(x\) = \(x\^2 \+ (\d+)\) \\bmod (\d+)/); return { c, pp, h: (x) => md(x * x + c, pp) }; };
const toyF = (P) => {
  const [pp] = num(P, /f\(h, m\) = \(h \+ m\)\^2 \\bmod (\d+)/), [IV] = num(P, /IV = (\d+)/);
  return { pp, IV, f: (h, m) => md((h + m) * (h + m), pp) };
};
const factor = (n) => { for (let q = 2; q * q <= n; q++) if (n % q === 0) return [q, n / q]; throw new Error(`${n} is prime`); };
const rsaD = (n, e) => {
  const [a, b] = factor(n);
  if (!isPrime(a) || !isPrime(b) || a === b) throw new Error(`${n} is not a product of two distinct primes`);
  const d = inv(e, (a - 1) * (b - 1));
  if (d === null) throw new Error(`e = ${e} not invertible`);
  return d;
};
const dlog = (g, y, p) => { for (let x = 0; x < p; x++) if (pw(g, x, p) === y) return x; throw new Error(`no log of ${y}`); };
const group = (P) => {
  const [pp] = num(P, /\$p = (\d+)\$/), [q] = num(P, /\$q = (\d+)\$/), [g] = num(P, /\$g = (\d+)\$/);
  if (!isPrime(pp) || !isPrime(q) || g === 1 || pw(g, q, pp) !== 1) throw new Error(`g = ${g} does not have order ${q} mod ${pp}`);
  return { pp, q, g };
};

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
  "cr6-hp-d1": guard((p, ctx) => {
    const H = toyHashOf(p.prompt), [x] = num(p.steps[0].instruction, /h\((\d+)\)/);
    const kw = { ANY: "preimage", DIFFERENT: "second preimage", BOTH: "collision" };
    const hits = Object.keys(kw).filter((w) => p.prompt.includes(w));
    if (hits.length !== 1) return `scenario matches ${hits.length} properties`;
    return check6(p, [H.h(x), kw[hits[0]], "collision"], ctx);
  }),
  "cr6-hp-d2": guard((p, ctx) => {
    const H = toyHashOf(p.prompt), [x] = num(p.prompt, /input \$x = (\d+)\$/);
    const sec = [...Array(H.pp).keys()].filter((v) => v >= 1 && v !== x && H.h(v) === H.h(x));
    if (sec.length !== 1) return `${sec.length} second preimages`;
    return check6(p, [H.h(x), sec[0], "no"], ctx, [[], [x]]);
  }),
  "cr6-hp-d3": guard((p, ctx) => {
    const H = toyHashOf(p.prompt), [y] = num(p.prompt, /digest \$y = (\d+)\$/);
    const pre = [...Array(H.pp).keys()].filter((v) => v >= 1 && H.h(v) === y);
    if (pre.length !== 2) return `${pre.length} preimages`;
    return check6(p, [md(y - H.c, H.pp), pre[0], pre[1], "no"], ctx, [[y - H.c + H.pp, y], [pre[1]], [pre[0]]]);
  }),
  "cr6-bday-d1": guard((p, ctx) => {
    const [n] = num(p.prompt, /a (\d+)-bit output/), [r] = num(p.prompt, /computes \$2\^\{(\d+)\}\$ hashes/);
    return check6(p, [n, n / 2, n / 2 - r], ctx, [[n / 2], [n], [n - r, r - n / 2]]);
  }),
  "cr6-bday-d2": guard((p, ctx) => {
    const [N] = num(p.prompt, /\$N = (\d+)\$/), [k] = num(p.prompt, /\$k = (\d+)\$/);
    let pairs = 0; for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) pairs++;
    let kmin = 1, cnt = 0; while (cnt < N) { cnt += kmin; kmin++; } // adding the kmin-th input adds kmin - 1 pairs
    let a = pairs, b = N; for (let f = 2; f <= b; f++) while (a % f === 0 && b % f === 0) { a /= f; b /= f; }
    const v = pairs / N, near = [v + 0.01, v - 0.01, v + 0.05, v * 1.04, (k * k) / 2 / N, k / N];
    // A correct rounding of v (2+ significant figures) is accepted by design, so only probe non-roundings.
    const rounding = (w) => { const dp = (String(w).split(".")[1] || "").length; return Number(v.toFixed(dp)) === w; };
    return check6(p, [pairs, b === 1 ? a : `${a}/${b}`, kmin], ctx, [[k * k], near.filter((w) => !rounding(w)), [N, Math.round(Math.sqrt(N))]]);
  }),
  "cr6-bday-d3": guard((p, ctx) => {
    const [t] = num(p.prompt, /SHA-256 to (\d+) bits/), [b] = num(p.prompt, /about \$2\^\{(\d+)\}\$ hash/), [s] = num(p.prompt, /wants (\d+)-bit security/);
    if (b === t / 2 || b === t) return "budget sits exactly on a bound";
    return check6(p, [t / 2, b > t / 2 ? "yes" : "no", t, b > t ? "yes" : "no", 2 * s], ctx, [[t], [], [t / 2], [], [s]]);
  }),
  "cr6-md-d1": guard((p, ctx) => {
    const T = toyF(p.prompt), [m1, m2] = num(p.prompt, /\(m_1, m_2\) = \((\d+), (\d+)\)/), h1 = T.f(T.IV, m1);
    return check6(p, [h1, T.f(h1, m2), "yes"], ctx);
  }),
  "cr6-md-d2": guard((p, ctx) => {
    const T = toyF(p.prompt), [m] = num(p.prompt, /block \$m = (\d+)\$/), [t] = num(p.prompt, /tag \$t = (\d+)\$/), [x] = num(p.prompt, /\$x = (\d+)\$/);
    const keys = [...Array(T.pp).keys()].filter((k) => k >= 1 && T.f(T.f(T.IV, k), m) === t);
    if (!keys.length) return "no key block produces the stated tag";
    for (const k of keys) if (T.f(T.f(T.f(T.IV, k), m), x) !== T.f(t, x)) return "forgery does not verify";
    return check6(p, [T.f(t, x), "no", "yes"], ctx, [[t]]);
  }),
  "cr6-md-d3": guard((p, ctx) => {
    const T = toyF(p.prompt), [k] = num(p.prompt, /key \$k = (\d+)\$/), [m] = num(p.prompt, /message is \$m = (\d+)\$/), [x] = num(p.prompt, /append \$x = (\d+)\$/);
    const h1 = T.f(T.IV, k), t = T.f(h1, m), forged = T.f(t, x), server = [k, m, x].reduce((h, blk) => T.f(h, blk), T.IV);
    return check6(p, [h1, t, forged, server === forged ? "yes" : "no"], ctx);
  }),
  "cr6-hmac-d1": guard((p, ctx) => {
    const [K] = num(p.prompt, /key \$K = (\d+)\$/);
    if (parseInt("36", 16) !== 54 || parseInt("5C", 16) !== 92) return "pad constants";
    return check6(p, [K ^ 0x36, K ^ 0x5c, "inner", 2], ctx, [[K ^ 0x5c], [K ^ 0x36], [], [1, 3]]);
  }),
  "cr6-hmac-d2": guard((p, ctx) => {
    const T = toyF(p.prompt), [ki] = num(p.prompt, /k_\{in\} = (\d+)\$/), [ko] = num(p.prompt, /k_\{out\} = (\d+)\$/), [m] = num(p.prompt, /message \$m = (\d+)\$/);
    const inner = T.f(T.f(T.IV, ki), m), o1 = T.f(T.IV, ko);
    return check6(p, [T.f(T.IV, ki), inner, o1, T.f(o1, inner)], ctx, [[], [], [], [T.f(inner, ko)]]);
  }),
  "cr6-hmac-d3": guard((p, ctx) => {
    const T = toyF(p.prompt), [ko] = num(p.prompt, /k_\{out\} = (\d+)\$/), [inner] = num(p.prompt, /\\\|\\, m\) = (\d+)\$/), [tag] = num(p.prompt, /tag is \$t = [^$]*= (\d+)\$/), [x] = num(p.prompt, /append \$x = (\d+)\$/);
    const o1 = T.f(T.IV, ko);
    if (T.f(o1, inner) !== tag) return "published tag does not match the inner digest";
    const guess = T.f(tag, x), inner2 = T.f(inner, x), real = T.f(o1, inner2);
    if (guess === real) return "degenerate: the length-extension guess happens to be right";
    return check6(p, [guess, inner2, o1, real, "no"], ctx, [[], [], [], [guess]]);
  }),
  "cr6-rsa-d1": guard((p, ctx) => {
    const [n, e] = num(p.prompt, /\(n, e\) = \((\d+), (\d+)\)/), [m] = num(p.prompt, /message \$m = (\d+)\$/), [s] = num(p.prompt, /signature \$s = (\d+)\$/);
    rsaD(n, e);
    const v = pw(s, e, n);
    return check6(p, [v, v === m ? "yes" : "no"], ctx);
  }),
  "cr6-rsa-d2": guard((p, ctx) => {
    const [n] = num(p.prompt, /\$n = (\d+) =/), [e] = num(p.prompt, /exponent \$e = (\d+)\$/), [d] = num(p.prompt, /exponent \$d = (\d+)\$/), [m] = num(p.prompt, /message \$m = (\d+)\$/);
    rsaD(n, e);
    if ([...Array(n).keys()].some((u) => pw(pw(u, d, n), e, n) !== u)) return `d = ${d} is not a private exponent for e = ${e}`;
    const s = pw(m, d, n);
    if (s === m) return "message is a fixed point";
    return check6(p, [s, pw(s, e, n), "private"], ctx, [[pw(m, e, n)]]);
  }),
  "cr6-rsa-d3": guard((p, ctx) => {
    const [n, e] = num(p.prompt, /\(n, e\) = \((\d+), (\d+)\)/), [s1, m1] = num(p.prompt, /\$s_1 = (\d+)\$ on \$m_1 = (\d+)\$/), [s2, m2] = num(p.prompt, /\$s_2 = (\d+)\$ on \$m_2 = (\d+)\$/);
    const d = rsaD(n, e);
    if (pw(m1, d, n) !== s1 || pw(m2, d, n) !== s2) return "given signatures are not genuine";
    const m3 = (m1 * m2) % n, s3 = (s1 * s2) % n;
    if ([1, m1, m2].includes(m3)) return "forged message repeats a known one";
    if (pw(s3, e, n) !== m3) return "forgery does not verify";
    return check6(p, [m3, s3, m3, "PSS"], ctx, [[m1 + m2], [s1 + s2]]);
  }),
  "cr6-sch-d1": guard((p, ctx) => {
    const G = group(p.prompt), [x] = num(p.prompt, /private key is \$x = (\d+)\$/), [k] = num(p.prompt, /nonce is \$k = (\d+)\$/), [e] = num(p.prompt, /gives \$e = (\d+)\$/);
    return check6(p, [pw(G.g, k, G.pp), md(x * e, G.q), md(k + x * e, G.q)], ctx, [[], [], [md(k + x * e, G.pp)]]);
  }),
  "cr6-sch-d2": guard((p, ctx) => {
    const G = group(p.prompt), [y] = num(p.prompt, /Public key \$y = (\d+)\$/), [e] = num(p.prompt, /hashes to \$e = (\d+)\$/), [r, s] = num(p.prompt, /\(r, s\) = \((\d+), (\d+)\)/);
    const x = dlog(G.g, y, G.pp), k = dlog(G.g, r, G.pp), honest = md(k + x * e, G.q) === s;
    const gs = pw(G.g, s, G.pp), ye = pw(y, e, G.pp), rhs = md(r * ye, G.pp);
    if ((gs === rhs) !== honest) return "verification equation disagrees with the signing equation";
    return check6(p, [gs, ye, rhs, honest ? "yes" : "no"], ctx);
  }),
  "cr6-sch-d3": guard((p, ctx) => {
    const [q] = num(p.prompt, /order \$q = (\d+)\$/), [z] = num(p.prompt, /nonce key \$z = (\d+)\$/), [x] = num(p.prompt, /private key \$x = (\d+)\$/);
    const [hA] = num(p.prompt, /\$h_A = (\d+)\$/), [eA] = num(p.prompt, /\$e_A = (\d+)\$/), [hB] = num(p.prompt, /\$h_B = (\d+)\$/);
    const nonce = (h) => md(z * h + 1, q), seen = new Set();
    for (let h = 1; h < q; h++) seen.add(nonce(h));
    const clash = seen.size < q - 1 ? "yes" : "no";
    if (!nonce(hA) || !nonce(hB)) return "zero nonce";
    return check6(p, [nonce(hA), md(nonce(hA) + x * eA, q), nonce(hB), clash, "ECDSA"], ctx);
  }),
};

// ---------------------------------------------------------------- cr7
// gen-crypto7-fill.js (cr7-, discrete-log and RSA attacks). Everything is
// brute force: logs by trying every exponent, factors by trial division,
// inverses by search, CRT solutions by scanning the whole range, Håstad
// messages by trying every m. The prompt's own claims (primitive root, first
// Fermat a works, every ciphertext wrapped, ...) are re-checked too.
const pw7 = (b, e, m) => { let r = 1 % m; b = md(b, m); for (let k = 0; k < e; k++) r = (r * b) % m; return r; };
const ord = (g, p) => { let v = g % p; for (let k = 1; k < p; k++) { if (v === 1) return k; v = (v * g) % p; } return 0; };
const dlog7 = (g, h, p) => { let v = 1; for (let x = 0; x < p - 1; x++) { if (v === h) return x; v = (v * g) % p; } throw new Error(`${h} is not a power of ${g} mod ${p}`); };
const trialFactor = (n) => { for (let d = 2; d * d <= n; d++) if (n % d === 0) return [d, n / d]; return [n, 1]; };
const bigPrime = (n) => { let best = 1; for (let d = 2; d <= n; d++) if (n % d === 0 && isPrime(d)) best = d; return best; };
const cube = (n) => { for (let r = 0; r * r * r <= n; r++) if (r * r * r === n) return true; return false; };
const allNum = (s, re) => [...s.matchAll(re)].map((m) => m.slice(1).map(Number));
const cong = (P) => allNum(P, /x \\equiv (\d+) \\pmod\{(\d+)\}/g);
const scan = (pairs, M) => { const xs = []; for (let x = 0; x < M; x++) if (pairs.every(([a, m]) => x % m === a)) xs.push(x); if (xs.length !== 1) throw new Error(`${xs.length} CRT solutions`); return xs[0]; };

const bsgs7 = (tier) => guard((p, ctx) => {
  const [g, h, P] = num(p.prompt, /Solve \$(\d+)\^x \\equiv (\d+) \\pmod\{(\d+)\}/);
  if (!isPrime(P) || ord(g, P) !== P - 1) return `${g} is not a primitive root mod ${P}`;
  const x = dlog7(g, h, P);
  let m = 1; while (m * m < P - 1) m++;
  const gim = inv(pw7(g, m, P), P), i = Math.floor(x / m), j = x % m;
  if (x < m || j === 0) return `degenerate log x = ${x} for m = ${m}`;
  if (tier === 1) return i !== 1 ? `match at i = ${i}, not 1` : check(p, [m, gim, md(h * gim, P), j, x], ctx);
  if (tier === 2) return check(p, [m, gim, i, j, x], ctx);
  const [bits] = num(p.prompt, /order about \$2\^\{(\d+)\}\$/);
  return check(p, [m, gim, i, j, x, bits / 2], ctx);
});

const rho7 = (tier) => guard((p, ctx) => {
  const [n] = num(p.prompt, /Factor \$n = (\d+)\$/), [c] = num(p.prompt, /x_k\^2 \+ (\d+) \\bmod n/);
  const [f1, f2] = trialFactor(n);
  if (f2 === 1 || !isPrime(f1) || !isPrime(f2)) return `${n} is not a product of two primes`;
  const xs = [2]; for (let k = 1; k <= 20; k++) xs.push((xs[k - 1] * xs[k - 1] + c) % n);
  const G = (i) => gcd(Math.abs(xs[2 * i] - xs[i]), n);
  let i = 1; while (i <= 9 && G(i) === 1) i++;
  const d = G(i);
  if (d === 1 || d === n) return `Floyd gives gcd ${d} at i = ${i}`;
  if (tier === 1) return i !== 2 ? `factor found at i = ${i}` : check(p, [xs[1], xs[2], 1, xs[3], xs[4], d, n / d], ctx);
  if (tier === 2) {
    const [a1] = num(p.prompt, /\$x_1 = (\d+)\$/), [a2] = num(p.prompt, /\$x_2 = (\d+)\$/);
    if (a1 !== xs[1] || a2 !== xs[2]) return "prompt's x_1, x_2 are wrong";
    return i !== 3 ? `factor found at i = ${i}` : check(p, [xs[3], xs[4], 1, xs[5], xs[6], d, n / d], ctx);
  }
  for (const [k, v] of allNum(p.prompt, /\$x_\{(\d+)\} = (\d+)\$/g)) if (xs[k] !== v) return `prompt's x_${k} = ${v}, really ${xs[k]}`;
  const [bits] = num(p.prompt, /order about \$2\^\{(\d+)\}\$/);
  return check(p, [i, d, n / d, bits / 2, "no"], ctx);
});

const ph7 = (tier) => guard((p, ctx) => {
  const P = p.prompt;
  if (tier === 3) {
    const [p1] = num(P, /the first is \$p_1 = (\d+)\$/), [p2] = num(P, /the second is \$p_2 = (\d+)\$/);
    const [g] = num(P, /primitive root \$g = (\d+)\$/), [h, ps] = num(P, /\\equiv (\d+) \\pmod\{(\d+)\}/);
    const b1 = bigPrime(p1 - 1), b2 = bigPrime(p2 - 1), safe = b1 > b2 ? p1 : p2;
    if (b1 === b2 || safe !== ps || 2 * bigPrime(ps - 1) + 1 !== ps) return "the named prime is not the safe one";
    if (ord(g, ps) !== ps - 1) return `${g} is not a primitive root mod ${ps}`;
    return check(p, [b1, b2, safe === p1 ? "first" : "second", pw7(h, (ps - 1) / 2, ps), dlog7(g, h, ps) % 2], ctx);
  }
  const [pp] = num(P, /\$p = (\d+)\$/), [g] = num(P, /primitive root \$g = (\d+)\$/), [h] = num(P, /\\equiv (\d+) \\pmod/);
  if (ord(g, pp) !== pp - 1) return `${g} is not a primitive root mod ${pp}`;
  const x = dlog7(g, h, pp);
  if (x < 2) return `trivial log ${x}`;
  if (tier === 1) {
    const [q] = num(P, /power \$\(p - 1\)\/(\d+)\$/), e = (pp - 1) / q;
    if (!isPrime(q) || !Number.isInteger(e) || x % q === 0) return `bad subgroup q = ${q} (x = ${x})`;
    return check(p, [e, pw7(g, e, pp), pw7(h, e, pp), x % q], ctx);
  }
  const qs = []; for (let q = 2; q < pp; q++) if ((pp - 1) % q === 0 && isPrime(q)) qs.push(q);
  return check(p, [...qs.map((q) => x % q), x], ctx);
});

const crt7 = (tier) => guard((p, ctx) => {
  if (tier === 3) {
    const pairs = allNum(p.prompt, /groups of (\d+) leave (\d+) over/g).map(([m, a]) => [a, m]);
    const ms = pairs.map(([, m]) => m), M = ms.reduce((a, b) => a * b, 1);
    const [cap] = num(p.prompt, /fewer than (\d+) /);
    if (cap !== M) return `cap ${cap} is not M = ${M}`;
    return check(p, [M, ...ms.map((m) => inv(M / m, m)), scan(pairs, M)], ctx);
  }
  const C = cong(p.prompt);
  if (tier === 1) {
    const [[a1, m1], [a2, m2]] = C, x = scan(C, m1 * m2);
    if (x === a1 || x === a2) return `x = ${x} repeats a residue`;
    return check(p, [inv(m1, m2), (x - a1) / m1, x], ctx);
  }
  const [[a1, m1], [, m2], [, m3]] = C, x12 = scan(C.slice(0, 2), m1 * m2), x = scan(C, m1 * m2 * m3);
  if (x12 === a1) return "first combination is trivial";
  return check(p, [x12, inv(m1 * m2, m3), (x - x12) / (m1 * m2), x], ctx);
});

const rcrt7 = (tier) => guard((p, ctx) => {
  const P = p.prompt;
  if (tier === 3) {
    const [n] = num(P, /\$n = (\d+)\$/), [e] = num(P, /\$e = (\d+)\$/), [m] = num(P, /message \$m = (\d+)\$/), [sf] = num(P, /s' = (\d+)\$/);
    const v = pw7(sf, e, n), D = md(v - m, n), g = gcd(D, n);
    if (g === 1 || g === n || !isPrime(g) || !isPrime(n / g)) return `gcd ${g} does not split ${n}`;
    return check(p, [v, D, g, n / g, "yes"], ctx);
  }
  const [pp] = num(P, /\$p = (\d+)\$/), [q] = num(P, /\$q = (\d+)\$/), [c] = num(P, /Decrypt \$c = (\d+)\$/);
  if (tier === 1) {
    const [d] = num(P, /\$d = (\d+)\$/), dp = d % (pp - 1), dq = d % (q - 1), m = pw7(c, d, pp * q);
    if (pw7(c, dp, pp) !== m % pp || pw7(c, dq, q) !== m % q) return "CRT halves disagree with c^d mod n";
    return check(p, [dp, dq, m % pp, m % q], ctx);
  }
  const [n] = num(P, /\$n = (\d+)\$/), [e] = num(P, /\$e = (\d+)\$/), [dp] = num(P, /\$d_p = (\d+)\$/), [dq] = num(P, /\$d_q = (\d+)\$/);
  const ms = []; for (let m = 0; m < n; m++) if (pw7(m, e, n) === c) ms.push(m);
  if (ms.length !== 1 || n !== pp * q) return `${ms.length} plaintexts encrypt to c`;
  const m = ms[0];
  if (pw7(c, dp, pp) !== m % pp || pw7(c, dq, q) !== m % q) return "d_p or d_q is wrong";
  return check(p, [m % pp, m % q, inv(q, pp), (m - (m % q)) / q, m], ctx);
});

const hastad7 = (tier) => guard((p, ctx) => {
  const pairs = allNum(p.prompt, /\$n_(\d) = (\d+)\$, \$c_\d = (\d+)\$/g).map(([, n, c]) => [n, c]);
  const ns = pairs.map(([n]) => n), ms = [];
  for (let m = 2; m < Math.min(...ns); m++) if (pairs.every(([n, c]) => (m * m * m) % n === c)) ms.push(m);
  if (ms.length !== 1) return `${ms.length} messages fit the ciphertexts`;
  const m = ms[0], m3 = m * m * m;
  if (pairs.some(([n, c]) => m3 < n || cube(c))) return "some ciphertext did not wrap";
  if (tier === 1) {
    const [[n1, c1], [n2]] = pairs;
    if (m3 >= n1 * n2) return "m^3 exceeds n1 n2";
    return check(p, [inv(n1, n2), (m3 - c1) / n1, m3, m], ctx);
  }
  const n12 = ns[0] * ns[1], x12 = m3 % n12;
  if (m3 < Math.max(ns[0] * ns[1], ns[0] * ns[2], ns[1] * ns[2])) return "two ciphertexts would suffice";
  if (tier === 2) return check(p, [x12, cube(x12) ? "yes" : "no", m3, m], ctx);
  const [E] = num(p.steps.map((s) => s.instruction).join(" "), /when \$e = (\d+)\$\?/);
  return check(p, [x12, m3, m, E, "no"], ctx);
});

const fermat7 = (tier) => guard((p, ctx) => {
  const [n] = num(p.prompt, /\$n = (\d+)\$/), [pp, q] = trialFactor(n);
  if (q === 1 || !isPrime(pp) || !isPrime(q)) return `${n} is not a product of two primes`;
  let a0 = 1; while (a0 * a0 < n) a0++;
  let a = a0; while (!Number.isInteger(Math.sqrt(a * a - n))) a++;
  const b = Math.sqrt(a * a - n);
  if (a - b !== pp || a + b !== q) return "Fermat's first square does not give the factors";
  if (tier === 1) return a !== a0 ? "the first a does not work" : check(p, [a0, a0 * a0 - n, b, pp, q], ctx);
  if (tier === 2) return a === a0 ? "the first a already works" : check(p, [a0, a, b, pp, q], ctx);
  const [e] = num(p.prompt, /\$e = (\d+)\$/), phi = (pp - 1) * (q - 1);
  return check(p, [a, pp, q, phi, inv(e, phi)], ctx);
});

Object.assign(oracles, {
  "cr7-bsgs-d1": bsgs7(1), "cr7-bsgs-d2": bsgs7(2), "cr7-bsgs-d3": bsgs7(3),
  "cr7-rho-d1": rho7(1), "cr7-rho-d2": rho7(2), "cr7-rho-d3": rho7(3),
  "cr7-ph-d1": ph7(1), "cr7-ph-d2": ph7(2), "cr7-ph-d3": ph7(3),
  "cr7-crt-d1": crt7(1), "cr7-crt-d2": crt7(2), "cr7-crt-d3": crt7(3),
  "cr7-rcrt-d1": rcrt7(1), "cr7-rcrt-d2": rcrt7(2), "cr7-rcrt-d3": rcrt7(3),
  "cr7-hastad-d1": hastad7(1), "cr7-hastad-d2": hastad7(2), "cr7-hastad-d3": hastad7(3),
  "cr7-fermat-d1": fermat7(1), "cr7-fermat-d2": fermat7(2), "cr7-fermat-d3": fermat7(3),
});
