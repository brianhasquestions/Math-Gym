// problem-engine.js
// Serves problems for a target concept + difficulty and checks answers
// (per-step, with tolerant equivalence). Prefers parametric generators for
// variety, falls back to authored seed problems. Stateless apart from a small
// "recently served" guard so the same item doesn't repeat back-to-back.

import { generate, makeRng } from "./generator.js";

// --- Answer equivalence -----------------------------------------------------
//
// We deliberately do NOT do full symbolic algebra (ROADMAP §5.3 / §13). Instead
// we apply *structural* normalization that removes cosmetic differences a
// learner shouldn't be penalized for, while still preserving step pedagogy:
//   - whitespace / glyph / case differences
//   - term reordering within a side ("19 + 4x" == "4x + 19")
//   - which side of "=" things sit on ("40 = 4x" == "4x = 40")
//   - ordered-pair / tuple answers ("(4, 2)" == "x=4, y=2")
//   - numeric tolerance ("x = 7" == "7")
// Crucially it does NOT simplify across "=" (so "4x = 40" does NOT match the
// un-transformed "4x + 19 = 59"), which keeps intermediate steps meaningful.

function normalize(s) {
  let t = String(s);
  // A mixed number "1 1/3" / "-2 3/4" is one quantity. Convert it BEFORE
  // whitespace collapses, or it became "11/3" (and "8 1/4" matched 81/4).
  const mixed = t.match(/^\s*(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)\s*$/);
  if (mixed) {
    const [, sg, w, n, d] = mixed;
    if (Number(d) !== 0) t = `${sg}${Number(w) * Number(d) + Number(n)}/${d}`;
  }
  return t
    // Digits separated only by whitespace ("2 3") are not one number; keep
    // them apart so they can't merge into "23".
    .replace(/(\d)\s+(?=\d)/g, "$1#")
    // Degree marks are units, not part of the value: 55°, 55^\circ, 55 degrees.
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, "")
    .replace(/°/g, "")
    .replace(/(\d|\))\s*(?:degrees|degree|deg)\b/gi, "$1")
    // Subscripts: c_1, v_{2} -> c1, v2 (the polynomial engine reads letter+digits as one symbol).
    .replace(/([a-zA-Z])_\{?(\d+)\}?/g, "$1$2")
    // Plus-minus: \pm, +/- -> a single ± marker (expanded by parseSolutionSet).
    .replace(/\\pm|\+\/-/g, "±")
    // Infinity spellings: \infty, ∞, infinity -> inf.
    .replace(/\\infty|∞|infinity/gi, "inf")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\\cdot|\\times/g, "*") // latex multiplication -> *
    .replace(/[×·]/g, "*")          // unicode multiplication -> *
    .replace(/[\u2212\u2013\u2014]/g, "-")         // unicode minus variants -> hyphen
    .replace(/\\leq|\\le|≤|⩽/g, "<=")    // unicode/latex inequalities
    .replace(/\\geq|\\ge|≥|⩾/g, ">=")
    .replace(/\\sqrt|√/g, "sqrt")   // radicals -> sqrt
    .replace(/\\pi|π/g, "pi")       // pi
    .replace(/\\,|\\!/g, "")         // stray latex spacing
    .replace(/\\%/g, "%")
    .replace(/[{}$]/g, "")           // stray latex/markup ( x^{2} -> x^2, sqrt{2} -> sqrt2 )
    .replace(/%$/, "");              // a trailing percent sign is a unit (see checkStep for the /100 reading)
}

// Parse a number that may be an integer, decimal, or fraction a/b. -> Number|null.
function parseNum(s) {
  let t = String(s).trim().replace(/^\+(?=[\d.])/, ""); // "+3" is 3
  // Digit-grouping commas ("431,676.38") count as one number only when the
  // WHOLE string is a grouped numeral: "1,2" stays a tuple, "12,34" is neither.
  if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(t)) t = t.replace(/,/g, "");
  const frac = t.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? null : parseFloat(frac[1]) / d;
  }
  if (/^-?\d*\.?\d+$/.test(t)) return parseFloat(t);
  // Scientific notation as calculators print it: 1.08e9, 2.5e-4.
  if (/^-?\d*\.?\d+e[+-]?\d+$/.test(t)) return parseFloat(t);
  return null;
}

const gcdInt = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

// Significant figures in a plainly-written number ("0.030" -> 2, "50.27" -> 4).
function sigFigs(s) {
  const m = String(s).match(/^-?(\d*)\.?(\d*)$/);
  if (!m) return 0;
  const digits = (m[1] + m[2]).replace(/^0+/, "");
  return digits.length;
}

// Absolute tolerance floor for comparing a value against `c`. 1e-6 for
// ordinary magnitudes, but RELATIVE for tiny ones: a flat 1e-6 accepted "0"
// for machine epsilon 2^-20 (~9.5e-7).
function absFloor(c) {
  const a = Math.abs(c);
  return a >= 1 ? 1e-6 : Math.max(1e-12, 1e-6 * a);
}

// --- Polynomial engine ------------------------------------------------------
// A polynomial is an array of terms { c: coeff, v: { varName: power, ... } }.
// We parse expressions over + - * / ^ () and one-or-more single-letter variables,
// expand fully, and emit a canonical string. This makes factored and expanded
// forms compare equal ((x-2)(x-3) == x^2-5x+6) and handles fractional coefficients.

const pNeg = (A) => A.map((t) => ({ c: -t.c, v: t.v }));
const pScale = (A, k) => A.map((t) => ({ c: t.c * k, v: t.v }));

// Like-term merging keeps products compact. Without it term counts multiply
// RAW: (x+1)^8 is 256 terms, and each juxtaposed factor multiplies again, so
// a ~36-character input could freeze the tab for minutes (checkStep runs
// synchronously on every "Check" click). The caps turn pathological inputs
// into a thrown RangeError, which the parse entry points convert to null
// ("not a polynomial") instead of a hung UI thread.
const MAX_POLY_TERMS = 2000;
function pCompact(A) {
  const map = new Map();
  for (const t of A) {
    const k = monoKey(t.v);
    const cur = map.get(k);
    if (cur) cur.c += t.c;
    else map.set(k, { c: t.c, v: t.v });
  }
  return [...map.values()];
}
function pMul(A, B) {
  if (A.length * B.length > 250000) throw new RangeError("polynomial too large");
  const out = [];
  for (const a of A) for (const b of B) {
    const v = { ...a.v };
    for (const k in b.v) v[k] = (v[k] || 0) + b.v[k];
    out.push({ c: a.c * b.c, v });
  }
  const merged = pCompact(out);
  if (merged.length > MAX_POLY_TERMS) throw new RangeError("polynomial too large");
  return merged;
}
function pPow(A, n) { let r = [{ c: 1, v: {} }]; for (let i = 0; i < n; i++) r = pMul(r, A); return r; }
function asConst(A) { // numeric value if A has no variables, else null
  let c = 0;
  for (const t of A) { if (Object.keys(t.v).some((k) => t.v[k] !== 0)) return null; c += t.c; }
  return c;
}

// Function names must NOT be read as products of single-letter variables, or
// "sin(4x)" would canonicalize to s*i*n*4*x and compare equal to "4sin(x)":
// two different functions. When a letter run spells a known function, we bail
// out of polynomial parsing entirely so the answer falls back to exact/accept
// matching (symbolic trig/log is unverifiable here by design; see checkStep).
const POLY_FUNCS = new Set([
  "sin", "cos", "tan", "sec", "csc", "cot",
  "sinh", "cosh", "tanh", "exp", "ln", "log", "sqrt", "abs",
  "arcsin", "arccos", "arctan", "asin", "acos", "atan",
]);

const GREEK = ["lambda", "theta", "alpha", "gamma", "sigma", "omega", "delta", "beta", "phi", "rho", "tau", "mu"];

function tokenizePoly(s) {
  const toks = [];
  for (let i = 0; i < s.length; ) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) { let j = i + 1; while (j < s.length && /[0-9.]/.test(s[j])) j++; toks.push({ t: "num", v: s.slice(i, j) }); i = j; }
    else if (/[a-z]/.test(ch)) {
      let j = i + 1; while (j < s.length && /[a-z]/.test(s[j])) j++;
      const run = s.slice(i, j);
      // A function name ANYWHERE in the run ("rsin(4theta)", "2xcos") means this
      // is not a polynomial: reading "rsin" as r*s*i*n let the angle multiplier
      // fold into the coefficient ("4rsin(2theta)" == "8rsin(theta)").
      for (const f of POLY_FUNCS) if (run.includes(f)) return null;
      // Split the run into symbols: Greek names (lambda, theta, …) are one
      // symbol each, every other letter is its own variable (xy = x*y). Four or
      // more loose letters in a row is a WORD ("angle", "side"), not a product:
      // "angle-angle" parsed as 0 and matched any other zero.
      const syms = [];
      let loose = 0;
      for (let k = 0; k < run.length; ) {
        const g = GREEK.find((n) => run.startsWith(n, k));
        if (g) { syms.push(g); k += g.length; loose = 0; }
        else { syms.push(run[k]); k++; if (++loose >= 4) return null; }
      }
      // A symbol immediately followed by digits is ONE subscripted symbol
      // (v1, w3, c2): reading "v2w3" as 6vw let "0" pass for v2w3 - v3w2.
      if (j < s.length && /[0-9]/.test(s[j])) {
        let d = j; while (d < s.length && /[0-9]/.test(s[d])) d++;
        syms[syms.length - 1] += s.slice(j, d);
        j = d;
      }
      for (const v of syms) toks.push({ t: "var", v });
      i = j;
    }
    else if ("+-*/^()".includes(ch)) { toks.push({ t: ch }); i++; }
    else return null; // unknown char (',', '=', etc.) -> not a polynomial expression
  }
  return toks;
}

function parsePoly(s) {
  const toks = tokenizePoly(s);
  if (!toks || toks.length === 0) return null;
  let pos = 0;
  const peek = () => toks[pos];
  const eat = (t) => (toks[pos] && toks[pos].t === t ? toks[pos++] : null);

  function parseExpr() {
    let sign = 1;
    if (peek() && peek().t === "+") pos++;
    else if (peek() && peek().t === "-") { pos++; sign = -1; }
    let acc = parseTermP();
    if (acc === null) return null;
    if (sign === -1) acc = pNeg(acc);
    while (peek() && (peek().t === "+" || peek().t === "-")) {
      const op = toks[pos++].t;
      const rhs = parseTermP();
      if (rhs === null) return null;
      acc = op === "+" ? acc.concat(rhs) : acc.concat(pNeg(rhs));
    }
    return acc;
  }
  function parseTermP() {
    let acc = parseFactorP();
    if (acc === null) return null;
    while (peek()) {
      const p = peek();
      if (p.t === "*") { pos++; const f = parseFactorP(); if (f === null) return null; acc = pMul(acc, f); }
      else if (p.t === "/") {
        pos++; const f = parseFactorP(); if (f === null) return null;
        const d = asConst(f); if (d === null || Math.abs(d) < 1e-12) return null; // only divide by constants
        acc = pScale(acc, 1 / d);
      } else if (p.t === "num" || p.t === "var" || p.t === "(") { // implicit multiplication
        const f = parseFactorP(); if (f === null) return null; acc = pMul(acc, f);
      } else break;
    }
    return acc;
  }
  function parseFactorP() {
    let base = parseBaseP();
    if (base === null) return null;
    if (peek() && peek().t === "^") {
      pos++;
      const eBase = parseBaseP();           // a bare number OR a parenthesized one: x^2 and x^(2)
      if (eBase === null) return null;
      const n = asConst(eBase);
      if (n === null || !Number.isInteger(n) || n < 0 || n > 8) return null;
      base = pPow(base, n);
    }
    return base;
  }
  function parseBaseP() {
    const p = peek();
    if (!p) return null;
    if (p.t === "(") { pos++; const e = parseExpr(); if (e === null) return null; return eat(")") ? e : null; }
    if (p.t === "num") { pos++; const val = parseNum(p.v); return val === null ? null : [{ c: val, v: {} }]; }
    if (p.t === "var") { pos++; return [{ c: 1, v: { [p.v]: 1 } }]; }
    // Unary minus negates the whole power: "2*-x^2" is -2x^2, not 2x^2.
    if (p.t === "-") { pos++; const b = parseFactorP(); return b === null ? null : pNeg(b); }
    if (p.t === "+") { pos++; return parseFactorP(); }
    return null;
  }

  // A term-count blowup inside pMul/pPow throws; treat it as "not a polynomial".
  let result;
  try { result = parseExpr(); } catch { return null; }
  return result !== null && pos === toks.length ? result : null;
}

function monoKey(v) {
  const ks = Object.keys(v).filter((k) => v[k] !== 0).sort();
  return ks.map((k) => (v[k] === 1 ? k : `${k}^${v[k]}`)).join("*");
}
function polyToString(A) {
  const map = {};
  for (const t of A) {
    if (Math.abs(t.c) < 1e-9) continue;
    const k = monoKey(t.v);
    map[k] = (map[k] || 0) + t.c;
  }
  const keys = Object.keys(map).filter((k) => Math.abs(map[k]) > 1e-9).sort();
  if (keys.length === 0) return "0";
  return keys.map((k) => `${Math.round(map[k] * 1e6) / 1e6}{${k}}`).join("+");
}

// Pure-word answers (none/true/false/infinite/...) must NOT go through the
// polynomial engine (letters would be read as variables, and anagrams collide).
const isWord = (s) => /^[a-z]{2,}$/.test(s);

function polyCanonExpr(expr) {
  if (expr === "" || isWord(expr)) return null;
  const p = parsePoly(expr);
  return p === null ? null : polyToString(p);
}


// Canonicalize a full answer: an equation (side-swap invariant, but never moving
// terms across "=") or a bare expression.
function canonEquation(normalized) {
  if (isWord(normalized)) return null;
  if (normalized.includes("=")) {
    const parts = normalized.split("=");
    if (parts.length !== 2 || parts.some((p) => p === "")) return null;
    // A side the polynomial engine can't read (it holds sin/cos/ln) is kept
    // verbatim, so "2rcos(theta) = r^2" still side-swaps to "r^2 = 2rcos(theta)".
    const side = (p) => { const k = polyCanonExpr(p); return k !== null ? k : isWord(p) ? null : `~${p}`; };
    const a = side(parts[0]), b = side(parts[1]);
    if (a === null || b === null) return null;
    if (a.startsWith("~") && b.startsWith("~")) return null; // nothing algebraic to compare
    return [a, b].sort().join("="); // sort sides => swap-invariant
  }
  return polyCanonExpr(normalized);
}

// Parse an ordered pair / tuple: "(4, 2)", "4,2", "x=4,y=2", "(1/2, 3)".
// Parse an ORDERED tuple / vector of 2+ components: "(4, 2)", "4,2", "x=4,y=2",
// "<1, 2, 3>", "[2, -1, 5]", "(1/2, 3)". Named components are ordered
// alphabetically (x,y,z,...). Returns a number array (length >= 2), or null.
function parseTuple(normalized) {
  const s = normalized.replace(/[()<>[\]]/g, "");
  if (!s.includes(",")) return null;
  const parts = s.split(",");
  if (parts.length < 2) return null;
  const named = {};
  const bare = [];
  let anyNamed = false;
  for (const p of parts) {
    // Named components: x=4, c1=-3 (subscripted names sort c1 < c2).
    const m = p.match(/^([a-z][0-9]*)=(.+)$/);
    if (m) { anyNamed = true; const n = parseNum(m[2]); if (n === null) return null; named[m[1]] = { n, raw: m[2] }; }
    else { const n = parseNum(p); if (n === null) return null; bare.push({ n, raw: p }); }
  }
  let comps;
  if (anyNamed) {
    if (bare.length > 0) return null; // mixed named/bare is ambiguous
    comps = Object.keys(named).sort().map((k) => named[k]);
  } else comps = bare;
  const out = comps.map((c) => c.n);
  out.raw = comps.map((c) => c.raw); // as written, for rounding-grain tolerance
  return out;
}

// Do a learner value `u` (written as uRaw) and an expected value `c` (written
// as cRaw) agree? Tolerance is the larger of:
//   - a magnitude-aware floor (absFloor),
//   - the rounding grain of the EXPECTED value when it is a plain decimal
//     ("7.25" -> ±0.005, so more precise learner input passes),
//   - the learner's own rounding grain, but only when the expected value is an
//     exact form (1/3, 16pi) AND the learner wrote at least 2 significant
//     figures: "0.33" for 1/3 passes, "0.0" for 1/36 or "0.7" for 2/3 do not,
//   - a 1e-12 relative slack for float noise (NOT 1e-9: that accepted
//     1080000001 for 1080000000).
function valuesAgree(u, c, uRaw, cRaw) {
  const cIsPlain = /^-?\d*\.?\d+$/.test(String(cRaw));
  const learnerGrain = !cIsPlain && sigFigs(uRaw) >= 2 ? decimalTol(uRaw) : 0;
  const tol = Math.max(absFloor(c), decimalTol(cRaw), learnerGrain, 1e-12 * Math.abs(c));
  return Math.abs(u - c) <= tol;
}

// Canonicalize a linear/polynomial inequality so direction-flips compare equal:
// "x > 3" == "3 < x", "2x <= 6" == "6 >= 2x". Strictness (< vs <=) must match.
// We move everything to one side (L - R), then pick a sign-canonical form so the
// representation is unique regardless of which side the variable sat on.
function canonInequality(normalized) {
  // Each SIDE is canonicalized on its own: terms are never moved across the
  // inequality sign. (Canonicalizing L − R made "x + 1 >= 4" and even the
  // un-solved prompt "x + 4 >= 7" equal to the answer "x >= 3".) Only the
  // direction flip is normalized: "x > 3" == "3 < x", and a compound chain
  // "-10 < 2x < 8" == "8 > 2x > -10". Strictness (< vs <=) must match.
  const parts = normalized.split(/(<=|>=|<|>)/);
  if (parts.length < 3 || parts.length % 2 === 0) return null;
  const sides = [], ops = [];
  for (let k = 0; k < parts.length; k++) {
    if (k % 2 === 1) { ops.push(parts[k]); continue; }
    const c = polyCanonExpr(parts[k]);
    if (c === null) return null;
    sides.push(c);
  }
  const flip = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };
  const fwd = sides.map((sd, k) => (k < ops.length ? `${sd}${ops[k]}` : sd)).join("");
  const rs = [...sides].reverse(), rops = [...ops].reverse().map((o) => flip[o]);
  const rev = rs.map((sd, k) => (k < rops.length ? `${sd}${rops[k]}` : sd)).join("");
  return fwd < rev ? fwd : rev;
}

// Parse an UNORDERED solution set: "x=2 or x=-3", "2, -3", "{2,-3}", "x=4"
// (a single/double root). Returns a numerically-sorted array, or null.
function parseSolutionSet(normalized) {
  // Separators: commas, "or", "and" ("6 and -6").
  let s = normalized.replace(/[{}()[\]]/g, "").replace(/or|and/g, ",");
  const parts = s.split(",").filter((p) => p !== "");
  if (parts.length === 0) return null;
  const nums = [];
  for (let p of parts) {
    p = p.replace(/^[a-z]+[0-9]*=/, ""); // strip "x=", "r=", "lambda=", etc.
    // "±6" / "x=±6" is the pair {6, -6}.
    if (p.startsWith("±")) {
      const n = parseNum(p.slice(1));
      if (n === null) return null;
      nums.push({ v: n, raw: p.slice(1) }, { v: -n, raw: "-" + p.slice(1) });
      continue;
    }
    const n = parseNum(p);
    if (n === null) return null;
    nums.push({ v: n, raw: p });
  }
  // A solution SET: a double root is one solution. Generators that draw
  // r1 === r2 emit "x = -4 or x = -4"; the learner's "x = -4" / "-4" is the
  // correct set and must match (it used to fail on the length check).
  nums.sort((a, b) => a.v - b.v);
  return nums.filter((x, i) => i === 0 || Math.abs(x.v - nums[i - 1].v) > 1e-9);
}

const UNIT_SUFFIX_RE = /(?<=[\d.])(?:cm|mm|km|m|in|ft|yd|mi|kg|g|mg|lb|lbs|oz|ml|l|sec|seconds?|s|min|minutes?|hrs?|hours?|h|days?|weeks?|months?|years?|yrs?|units?|dollars?|cents?|mph|kph|cells|people|cars|items?|sq(?:uare)?(?:cm|m|ft|in|units?))(?:\^?[23]|²|³)?$/;

// Pull a single number (and any leading variable name) out of answers like
// "x = 7", "7", "x=-3.5", "1/2". Returns { n, v } where v is the variable letter
// group if one was written (else null), so callers can require variables to
// agree: "y=7" must not satisfy a step whose answer is "x=7".
function extractNumber(s, learnerInput = false) {
  let t = normalize(s);
  // "1x = 5" is "x = 5" (a unit coefficient generators used to print), and a
  // bare number in parentheses is just that number: "(-5)/12".
  t = t.replace(/^1([a-z]+[0-9]*=)/, "$1").replace(/=1([a-z]+[0-9]*)$/, "=$1")
    .replace(/\((-?\d*\.?\d+)\)/g, "$1");
  // A unit after a number is a label, not part of the value: "12 cm", "0kg",
  // "3.5 hours", "40 m^2". (Only a closed list, since "5x" must stay an expression,
  // and only for LEARNER input: an answer "5s" may be a Laplace-domain term.)
  if (learnerInput) t = t.replace(UNIT_SUFFIX_RE, "");
  // "7 = x" is the same statement as "x = 7".
  const swapped = t.match(/^([^=]+)=([a-z]+[0-9]*)$/);
  if (swapped && parseNum(swapped[1]) !== null) return { n: parseNum(swapped[1]), v: swapped[2] };
  const m = t.match(/^([a-z]+[0-9]*=)?(.+)$/); // optional "x=", "lambda=", "c1=", etc.
  if (!m) return null;
  const n = parseNum(m[2]);
  if (n === null) return null;
  return { n, v: m[1] ? m[1].slice(0, -1) : null };
}

// Evaluate a constant arithmetic expression to a Number, supporting sqrt, pi, e,
// + - * / ^ and parentheses (and implicit multiplication). Returns null if the
// expression contains a free variable or can't be evaluated. This lets exact
// forms compare by value: "5sqrt2" == "sqrt(50)" == "7.0710678", "16pi" == "50.27".
function evalNumeric(normalized) {
  return evalExpr(normalized, null);
}

// Tokenize an arithmetic expression for evaluation. Letter runs become pi, e,
// sqrt, or (when `allowVars`) variable symbols split the same way the
// polynomial engine splits them (Greek names whole, other letters singly,
// trailing digits as a subscript). Returns tokens or null.
function exprTokens(normalized, allowVars) {
  const toks = [];
  for (let i = 0; i < normalized.length; ) {
    const ch = normalized[i];
    if (/[0-9.]/.test(ch)) { let j = i + 1; while (j < normalized.length && /[0-9.]/.test(normalized[j])) j++; toks.push({ t: "num", v: normalized.slice(i, j) }); i = j; }
    else if (/[a-z]/.test(ch)) {
      let j = i + 1; while (j < normalized.length && /[a-z]/.test(normalized[j])) j++;
      const w = normalized.slice(i, j);
      if (w === "pi") toks.push({ t: "const", v: Math.PI });
      else if (w === "e") toks.push({ t: "const", v: Math.E });
      else if (w === "sqrt") toks.push({ t: "sqrt" });
      else {
        if (!allowVars) return null; // a free variable (or unsupported function)
        for (const f of POLY_FUNCS) if (w.includes(f)) return null;
        const syms = [];
        let loose = 0;
        for (let k = 0; k < w.length; ) {
          const g = GREEK.find((n) => w.startsWith(n, k));
          if (g) { syms.push(g); k += g.length; loose = 0; }
          else { syms.push(w[k]); k++; if (++loose >= 4) return null; }
        }
        if (j < normalized.length && /[0-9]/.test(normalized[j])) {
          let d = j; while (d < normalized.length && /[0-9]/.test(normalized[d])) d++;
          syms[syms.length - 1] += normalized.slice(j, d);
          j = d;
        }
        for (const v of syms) toks.push({ t: "var", v });
      }
      i = j;
    } else if ("+-*/^()".includes(ch)) { toks.push({ t: ch }); i++; }
    else return null;
  }
  return toks.length ? toks : null;
}

// Evaluate an expression with operator precedence. `env` maps variable
// symbols to numbers (null = constants only). Returns a finite Number or null.
function evalExpr(normalized, env) {
  const toks = exprTokens(normalized, env !== null);
  if (!toks) return null;
  let pos = 0;
  const peek = () => toks[pos];
  function expr() {
    let sign = 1;
    if (peek() && peek().t === "+") pos++;
    else if (peek() && peek().t === "-") { pos++; sign = -1; }
    let acc = term(); if (acc === null) return null; acc *= sign;
    while (peek() && (peek().t === "+" || peek().t === "-")) {
      const op = toks[pos++].t; const r = term(); if (r === null) return null;
      acc = op === "+" ? acc + r : acc - r;
    }
    return acc;
  }
  function term() {
    let acc = factor(); if (acc === null) return null;
    while (peek()) {
      const p = peek();
      if (p.t === "*") { pos++; const f = factor(); if (f === null) return null; acc *= f; }
      else if (p.t === "/") { pos++; const f = factor(); if (f === null || f === 0) return null; acc /= f; }
      else if (p.t === "num" || p.t === "const" || p.t === "(" || p.t === "sqrt" || p.t === "var") { const f = factor(); if (f === null) return null; acc *= f; }
      else break;
    }
    return acc;
  }
  function factor() {
    let b = base(); if (b === null) return null;
    if (peek() && peek().t === "^") { pos++; const e = factor(); if (e === null) return null; b = Math.pow(b, e); }
    return b;
  }
  function base() {
    const p = peek(); if (!p) return null;
    if (p.t === "sqrt") { pos++; const b = factor(); return b === null || b < 0 ? null : Math.sqrt(b); }
    if (p.t === "(") { pos++; const e = expr(); if (e === null || !peek() || peek().t !== ")") return null; pos++; return e; }
    if (p.t === "num") { pos++; return parseNum(p.v); }
    if (p.t === "const") { pos++; return p.v; }
    if (p.t === "var") { pos++; return env && Object.prototype.hasOwnProperty.call(env, p.v) ? env[p.v] : null; }
    // A unary minus negates the whole power: "3*-2^2" is 3*(-(2^2)) = -12, not 12.
    if (p.t === "-") { pos++; const b = factor(); return b === null ? null : -b; }
    if (p.t === "+") { pos++; return factor(); }
    return null;
  }
  const r = expr();
  return r !== null && pos === toks.length && isFinite(r) ? r : null;
}

// Symbols (variables) an expression uses, or null if it can't be tokenized.
function exprSymbols(normalized) {
  const toks = exprTokens(normalized, true);
  return toks ? new Set(toks.filter((t) => t.t === "var").map((t) => t.v)) : null;
}

// Are two expressions in the SAME variables identical as functions? Evaluated
// at fixed, deliberately "unround" sample points (deterministic, so grading is
// reproducible), skipping points where either side is undefined (a removable
// hole like (x^2-1)/(x-1) at x = 1 never lands on one). This replaces
// cross-multiplying a single top-level "/" split, which ignored precedence:
// "1/4 * 2" was read as 1/(4*2), so the wrong answer 1/8 matched.
const SAMPLE_PTS = [1.3719, 2.9137, 0.5311, 3.2903, 1.8357, 2.4473, 0.7741];
function sameFunction(u, c) {
  const su = exprSymbols(u), sc = exprSymbols(c);
  if (!su || !sc || su.size === 0 || su.size > 4) return false;
  if (su.size !== sc.size || [...su].some((v) => !sc.has(v))) return false;
  const vars = [...su];
  let compared = 0;
  for (let k = 0; k < SAMPLE_PTS.length; k++) {
    const env = {};
    vars.forEach((v, i) => { env[v] = SAMPLE_PTS[(k + 3 * i) % SAMPLE_PTS.length] + 0.113 * i; });
    const a = evalExpr(u, env), b = evalExpr(c, env);
    if (a === null || b === null) continue;
    if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) return false;
    compared++;
  }
  return compared >= 3;
}

// Is the input written as a product of factors (not an expanded sum)? Used to
// enforce `form: "factored"` steps: the polynomial engine treats (x-2)(x-3) and
// x^2-5x+6 as equal, so without this gate a "factor this" step would accept the
// un-factored original. A factored form has a parenthesized factor and no
// additive operator at paren-depth 0 (a single leading sign is allowed).
function isFactoredForm(normalized) {
  // Peel off any parens that wrap the WHOLE expression, so a wrapped expanded
  // form like "(x^2-5x+6)" is judged on its contents (and rejected) rather than
  // passing the gate on the strength of its outer parentheses alone.
  let s = normalized;
  while (s.length >= 2 && s[0] === "(" && s[s.length - 1] === ")") {
    let depth = 0, wrapsWhole = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") depth++;
      else if (s[i] === ")") { depth--; if (depth === 0 && i < s.length - 1) { wrapsWhole = false; break; } }
    }
    if (!wrapsWhole) break;
    s = s.slice(1, -1);
  }
  if (!s.includes("(") || !/[a-z]/.test(s)) return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if ((ch === "+" || ch === "-") && depth === 0 && i !== 0) return false;
  }
  // Product shape confirmed: now reject "factorizations" that are really the
  // whole expression scaled by ±1, e.g. "1(x^2-5x+6)", "(1)(x^2-5x+6)", or
  // "(x^2-5x+6)*1": peeling off a unit coefficient is not factoring. Walk the
  // top-level factor units and demand either two non-constant factors or one
  // non-constant factor with a genuine (non-±1, non-zero) constant, as in
  // "2(x+3)". Equations ("(2u-1)(u-1) = 0") are judged side by side, so a
  // trailing "= 0" can't launder a trivial 1(...) wrapper either.
  const sideIsFactored = (side) => {
    let i = 0;
    if (side[0] === "+" || side[0] === "-") i = 1;
    let nonConst = 0, scaled = false;
    while (i < side.length) {
      if (side[i] === "*" || side[i] === "/") { i++; continue; }
      let unit;
      if (side[i] === "(") {
        let d = 0, j = i;
        do { if (side[j] === "(") d++; else if (side[j] === ")") d--; j++; } while (j < side.length && d > 0);
        if (d !== 0) return false;
        unit = side.slice(i, j); i = j;
      } else {
        let j = i;
        while (j < side.length && /[a-z0-9.]/.test(side[j])) j++;
        if (j === i) return false; // unexpected top-level char
        unit = side.slice(i, j); i = j;
      }
      let exp = 1;
      if (side[i] === "^") {
        let j = i + 1;
        if (side[j] === "(") { while (j < side.length && side[j] !== ")") j++; j++; }
        else while (j < side.length && /[0-9.]/.test(side[j])) j++;
        exp = Number(side.slice(i + 1, j).replace(/[()]/g, ""));
        if (!Number.isFinite(exp)) return false;
        i = j;
      }
      if (/[a-z]/.test(unit)) nonConst += exp >= 2 ? 2 : 1;
      else {
        const val = parseNum(unit.replace(/[()]/g, ""));
        if (val === null || Math.abs(val) !== 1) scaled = true;
      }
    }
    return nonConst >= 2 || (nonConst >= 1 && scaled);
  };
  return s.split("=").some(sideIsFactored);
}

// Top-level factor units of one side of a product ("2x(3x+4)^2" -> 2x, (3x+4)^2)
// as [{ unit, exp }], or null if the side is not a plain product.
function factorUnits(side) {
  const out = [];
  let i = 0;
  if (side[0] === "+" || side[0] === "-") i = 1;
  while (i < side.length) {
    if (side[i] === "*") { i++; continue; }
    let unit;
    if (side[i] === "(") {
      let d = 0, j = i;
      do { if (side[j] === "(") d++; else if (side[j] === ")") d--; j++; } while (j < side.length && d > 0);
      if (d !== 0) return null;
      unit = side.slice(i + 1, j - 1); i = j;
    } else {
      let j = i;
      while (j < side.length && /[a-z0-9.]/.test(side[j])) j++;
      if (j === i) return null;
      unit = side.slice(i, j); i = j;
    }
    let exp = 1;
    if (side[i] === "^") {
      let j = i + 1;
      if (side[j] === "(") { while (j < side.length && side[j] !== ")") j++; j++; }
      else while (j < side.length && /[0-9]/.test(side[j])) j++;
      exp = Number(side.slice(i + 1, j).replace(/[()]/g, ""));
      if (!Number.isInteger(exp) || exp < 1) return null;
      i = j;
    }
    out.push({ unit, exp });
  }
  return out;
}

// Multi-term factors of a factored side, with multiplicity, each flagged
// primitive (integer content 1 and no variable common to every term).
function multiTermFactors(side) {
  const units = factorUnits(side);
  if (!units) return null;
  const res = [];
  for (const { unit, exp } of units) {
    const p = parsePoly(unit);
    if (!p) return null;
    const terms = pCompact(p).filter((t) => Math.abs(t.c) > 1e-9);
    if (terms.length < 2) continue; // a constant or monomial factor
    let primitive = true;
    if (terms.every((t) => Number.isInteger(t.c))) {
      if (terms.reduce((g, t) => gcdInt(g, t.c), 0) > 1) primitive = false;
    }
    const vars = new Set(terms.flatMap((t) => Object.keys(t.v).filter((k) => t.v[k] > 0)));
    for (const v of vars) if (terms.every((t) => (t.v[v] || 0) > 0)) primitive = false;
    for (let k = 0; k < exp; k++) res.push(primitive);
  }
  return res;
}

// "Factor completely": the learner must have at least as many multi-term
// factors as the answer, and, when the answer's factors are all primitive, 
// no learner factor may still hide a common factor. Catches "x(6x+8)" and
// "2(3x^2+4x)" for 2x(3x+4), and "(6x-9)(2x+3)" for 3(2x-3)(2x+3).
function factoredAsCompletely(u, answer) {
  const a = normalize(answer);
  const sideOf = (s) => s.split("=").find((sd) => /[a-z]/.test(sd) && sd.includes("("));
  const as = sideOf(a), us = sideOf(u);
  if (!as || !us) return true;
  const af = multiTermFactors(as), uf = multiTermFactors(us);
  if (!af || !uf) return true; // can't judge: leave it to equivalence
  if (uf.length < af.length) return false;
  if (af.every(Boolean) && !uf.every(Boolean)) return false;
  return true;
}

// Half-a-unit-in-the-last-place tolerance for a plainly-written decimal (e.g.
// "50.27" -> 0.005). Returns 0 for non-decimal inputs (integers, expressions),
// which keeps exact answers exact: "7" must not match 7.07.
function decimalTol(s) {
  const m = String(s).match(/^-?\d+\.(\d+)$/);
  return m ? 0.5 * Math.pow(10, -m[1].length) : 0;
}

// --- Has the learner actually done the step? --------------------------------
// The equivalence engine evaluates and expands everything, so on its own it
// accepts the problem typed back ("7*8" for 56, "(x^2)^3" for x^6, the
// un-simplified previous line of a proof). These gates refuse input that is
// structurally MORE complex than the expected answer.

// Split one side at its top-level binary + / - into additive terms.
function topTerms(side) {
  const terms = [];
  let depth = 0, start = 0;
  for (let i = 0; i < side.length; i++) {
    const ch = side[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if ((ch === "+" || ch === "-") && depth === 0 && i > 0 && !"+-*/^(".includes(side[i - 1])) {
      terms.push(side.slice(start, i)); start = i;
    }
  }
  terms.push(side.slice(start));
  return terms.filter((t) => t !== "" && t !== "+" && t !== "-");
}

// Does one side show work left undone? Like terms not combined (8x - 5x,
// "+12 - 12"), or a variable repeated inside a single product (x^5*x^2).
function sideUnsimplified(side) {
  const keys = new Set();
  for (const term of topTerms(side)) {
    if (term.includes("(")) continue; // grouped terms are judged by the grouping rules
    const toks = tokenizePoly(term.replace(/^[+-]/, ""));
    if (!toks) return false;
    const seen = new Set();
    for (const tk of toks) {
      if (tk.t !== "var") continue;
      if (seen.has(tk.v)) return true;
      seen.add(tk.v);
    }
    const p = parsePoly(term);
    if (!p) return false;
    const live = pCompact(p).filter((t) => Math.abs(t.c) > 1e-9);
    if (live.length !== 1) continue;
    const k = monoKey(live[0].v);
    if (keys.has(k)) return true;
    keys.add(k);
  }
  return false;
}

// Steps that ask the learner to WRITE/SET UP something accept any faithful
// transcription ("x + x + 6 = 34"); only steps that ask for work to be done
// are held to the answer's simplification level.
const SETUP_STEP_RE = /^\s*(write|set up|translate|express|form|state)\b|\b(write|set up) (an?|the) (equation|expression|integrand|sum|product|inequality)/i;
// Steps whose whole point is removing grouping / powers of groups.
const UNGROUP_STEP_RE = /simplif|expand|distribut|multiply out|clear|remove the paren|combine|foil|exponent/i;

// Is the learner's (equivalent) input an unworked restatement of the answer?
//  - like terms left uncombined / a variable repeated inside one product
//    (8x - 3 - 5x + 11 for 3x + 8; 3x + 12 - 12 for 3x; x^5*x^2 for x^7),
//    unless the expected answer is itself such a setup form;
//  - on simplify/expand/distribute steps, grouping the answer doesn't have
//    (2(x+7)=40 for 2x+14=40; (x^2)^3 for x^6). Elsewhere a factored form of
//    an expanded answer (5(x+6) for 5x+30) is a fine answer.
function looksUnworked(u, c, instruction) {
  if (SETUP_STEP_RE.test(instruction || "")) return false;
  // Parens around a bare number or a sum-free product aren't grouping:
  // "x^(2)", "3(x) + 3(4)", "(2x)+1". (Kept when raised to a power.)
  const strip = (s) => s.replace(/\((-?[^()+\-]*)\)(?!\^)/g, "$1");
  const us = strip(u), cs = strip(c);
  const sides = (s) => s.split(/<=|>=|=|<|>/).filter((x) => x !== "");
  const candSetup = sides(cs.replace(/[()]/g, "")).some(sideUnsimplified);
  if (!candSetup && sides(us).some(sideUnsimplified)) return true;
  if (UNGROUP_STEP_RE.test(instruction || "")) {
    if (us.includes("(") && !cs.includes("(")) return true;
    if (/\)\^/.test(us) && !/\)\^/.test(cs)) return true;
  }
  return false;
}

// Exact numeric forms a learner may legitimately give for a decimal answer:
// 16pi for 50.27, 5sqrt2 for 7.07, e^2, 1.08*10^9.
const EXACT_FORM_RE = /pi|sqrt|(?<![a-z])e(?![a-z])|\*10\^-?\d+$/;

// Plain-language hypothesis-test decisions. "reject" / "fail to reject" are the
// stored answers; learners naturally add "the null (hypothesis)" / "H0".
function decisionWord(u) {
  const m = u.match(/^(donot|dont|don't|failto|fail|doesnot)?reject(the)?(null(hypothesis)?|h0|ho|nullh0)?$/);
  if (!m) return null;
  return m[1] ? "failtoreject" : "reject";
}

// Compare a learner's answer to a step. Returns true if acceptable.
export function checkStep(step, userAnswer) {
  if (checkStepCore(step, userAnswer)) return true;
  // "y = 2x + 1" and "2x + 1" name the same function. Accept the bare right
  // side for a "y = …" answer, and a "y = …" / "f(x) = …" learner answer for a
  // bare-expression answer.
  const u = normalize(userAnswer);
  const FN_LHS = /^(y|f\(x\)|g\(x\)|h\(x\)|p\(x\))=(.+)$/;
  if (step.form !== "solutions") {
    const lm = u.match(FN_LHS);
    const cands = [step.answer, ...(step.accept || [])].map(normalize);
    if (lm && cands.some((c) => !c.includes("=")) && checkStepCore(step, lm[2])) return true;
    if (!u.includes("=")) {
      for (const c of cands) {
        const cm = c.match(FN_LHS);
        if (cm && checkStepCore({ ...step, answer: cm[2], accept: [] }, userAnswer)) return true;
      }
    }
  }
  // "5.21%" may mean 5.21 (a percent-valued answer, handled by normalize,
  // which drops the sign) OR the proportion 0.0521. Try the latter too.
  const pct = String(userAnswer).trim().match(/^(.*?)\s*\\?%$/);
  if (pct) {
    const n = extractNumber(pct[1]);
    if (n && !n.v) return checkStepCore(step, String(Math.round((n.n / 100) * 1e12) / 1e12));
  }
  return false;
}

function checkStepCore(step, userAnswer) {
  const u = normalize(userAnswer);
  if (u === "") return false;
  // Factored-form steps must actually be factored, and as completely as the
  // answer (not "x(6x+8)" for 2x(3x+4)).
  if (step.form === "factored" && !isFactoredForm(u)) return false;
  if (step.form === "factored" && !factoredAsCompletely(u, step.answer)) return false;

  const candidates = [step.answer, ...(step.accept || [])];

  // Solution-set steps: compare as an UNORDERED set of roots (order-independent).
  if (step.form === "solutions") {
    const uSet = parseSolutionSet(u);
    for (const cand of candidates) {
      if (normalize(cand) === u) return true;
      const cSet = parseSolutionSet(normalize(cand));
      if (uSet && cSet && uSet.length === cSet.length &&
          uSet.every((x, i) => valuesAgree(x.v, cSet[i].v, x.raw, cSet[i].raw))) return true;
    }
    return false;
  }

  const uCanon = canonEquation(u);
  const uTuple = parseTuple(u);
  const uNum = extractNumber(userAnswer, true);
  const uIneq = canonInequality(u);
  const uVal = evalNumeric(u);
  const uRhs = u.replace(/^[a-z]+[0-9]*=/, "").replace(/=[a-z]+[0-9]*$/, "");
  // A numeric learner answer is "plain" (a numeral, fraction or x = numeral)
  // or an exact form (16pi); anything else is unworked arithmetic.
  const uPlain = uNum !== null;
  const uExactForm = EXACT_FORM_RE.test(u);
  // "Lowest terms" steps: an unreduced fraction (3/9 for 1/3) is not done.
  const fr = uRhs.match(/^(-?\d+)\/(-?\d+)$/);
  const unreduced = !!fr && /lowest terms|simplest form|simplif|reduce/i.test(step.instruction || "") &&
    gcdInt(Number(fr[1]), Number(fr[2])) > 1;

  for (const cand of candidates) {
    const c = normalize(cand);
    if (c === u) return true;                                 // exact (normalized): always honored
    if (unreduced) continue;
    const dw = decisionWord(u);
    if (dw !== null && (c === "reject" || c === "failtoreject")) { if (dw === c) return true; continue; }
    const cNum = extractNumber(cand);
    // Numeric answer, non-numeral input: "7*8", "4+1", "(8+12+16)/3"; the
    // learner restated the arithmetic instead of doing it.
    if (cNum !== null && !uPlain && !uExactForm) continue;
    const unworked = cNum === null && looksUnworked(u, c, step.instruction);
    const cCanon = canonEquation(c);
    if (!unworked && uCanon !== null && cCanon !== null && uCanon === cCanon) return true; // structural / algebraic
    if (!unworked && uIneq !== null && canonInequality(c) === uIneq) return true;          // inequality (direction-aware)
    const cTuple = parseTuple(c);
    if (uTuple && cTuple && uTuple.length === cTuple.length &&
        uTuple.every((v, i) => valuesAgree(v, cTuple[i], uTuple.raw[i], cTuple.raw[i]))) return true;
    // Numbers must agree AND, if BOTH sides name a variable, name the same one
    // (so "y=7" doesn't satisfy a step whose answer is "x=7").
    if (uNum !== null && cNum !== null &&
        valuesAgree(uNum.n, cNum.n, uRhs, c.replace(/^[a-z]+[0-9]*=/, "")) &&
        (!uNum.v || !cNum.v || uNum.v === cNum.v)) return true;
    const cVal = evalNumeric(c);                                              // radical / pi / e value
    if (uVal !== null && cVal !== null && valuesAgree(uVal, cVal, u, c)) return true;
    // Rational expressions (a fraction on either side): identical as functions?
    if (!unworked && (u.includes("/") || c.includes("/")) && sameFunction(u, c)) return true;
  }
  return false;
}

// --- Problem selection ------------------------------------------------------

export class ProblemSource {
  constructor(topic) {
    this.topic = topic;
    this.seeds = topic.problems || [];
    this.templates = topic.generators || [];
    this.genCounter = 0;
    this.lastId = null;
    this.lastPrompt = null;
    // Randomize the per-session seed base so two sessions (or reloads) that walk
    // the same difficulty path don't replay the identical "random" sequence:
    // and a problem missed earlier isn't re-served as the fresh prove-it problem.
    // Falls back to a content-derived base if Math.random is somehow unavailable.
    this.seedBase = (Math.floor(Math.random() * 0x7fffffff) || (topic.id || "t").length * 7919 + 13);
    // Probe each generator ONCE (a fixed seed is deterministic) and index the
    // templates by concept|difficulty, instead of re-generating every template
    // on every next() call.
    this.genIndex = new Map();
    for (const t of this.templates) {
      const probe = this.safeGenerate(t, makeRng(1), -1);
      if (!probe) continue;
      for (const cid of probe.concepts || []) {
        const key = `${cid}|${probe.difficulty}`;
        if (!this.genIndex.has(key)) this.genIndex.set(key, []);
        this.genIndex.get(key).push(t);
      }
    }
  }

  // Generate defensively: a buggy generator must never crash a live session.
  safeGenerate(template, rng, idx) {
    try { return generate(template, rng, idx); }
    catch { return null; }
  }

  // Return the next problem for a concept at a difficulty.
  next(conceptId, difficulty) {
    // 1) Try a generator that matches concept + difficulty (preferred: variety).
    const gens = this.genIndex.get(`${conceptId}|${difficulty}`) || [];
    if (gens.length > 0) {
      const template = gens[this.genCounter % gens.length];
      // Generate, retrying a few times if it lands on the exact same prompt as
      // the previous problem (parametric generators can occasionally collide).
      let problem = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        this.genCounter += 1;
        const rng = makeRng(this.seedBase + this.genCounter * 104729);
        const cand = this.safeGenerate(template, rng, this.genCounter);
        if (!cand) break;
        problem = cand;
        if (cand.prompt !== this.lastPrompt) break;
      }
      if (problem) { this.lastId = problem.id; this.lastPrompt = problem.prompt; return problem; }
    }

    // 2) Fall back to seed problems matching concept + difficulty.
    let pool = this.seeds.filter(
      (p) => p.difficulty === difficulty && (p.concepts || []).includes(conceptId)
    );
    // Relax difficulty if nothing at exact tier.
    if (pool.length === 0) {
      pool = this.seeds.filter((p) => (p.concepts || []).includes(conceptId));
    }
    if (pool.length === 0) return null;

    // Avoid immediate repeat when possible.
    let choice = pool[this.genCounter % pool.length];
    if (pool.length > 1 && choice.id === this.lastId) {
      choice = pool[(this.genCounter + 1) % pool.length];
    }
    this.genCounter += 1;
    this.lastId = choice.id;
    this.lastPrompt = choice.prompt;
    return choice;
  }
}
