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
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\\cdot|\\times/g, "*") // latex multiplication -> *
    .replace(/[×·]/g, "*")          // unicode multiplication -> *
    .replace(/[−–—]/g, "-")         // unicode minus variants -> hyphen
    .replace(/\\leq|\\le|≤|⩽/g, "<=")    // unicode/latex inequalities
    .replace(/\\geq|\\ge|≥|⩾/g, ">=")
    .replace(/\\sqrt|√/g, "sqrt")   // radicals -> sqrt
    .replace(/\\pi|π/g, "pi")       // pi
    .replace(/\\,|\\!/g, "")         // stray latex spacing
    .replace(/[{}$]/g, "");          // stray latex/markup ( x^{2} -> x^2, sqrt{2} -> sqrt2 )
}

// Parse a number that may be an integer, decimal, or fraction a/b. -> Number|null.
function parseNum(s) {
  const t = String(s).trim();
  const frac = t.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? null : parseFloat(frac[1]) / d;
  }
  if (/^-?\d*\.?\d+$/.test(t)) return parseFloat(t);
  return null;
}

// --- Polynomial engine ------------------------------------------------------
// A polynomial is an array of terms { c: coeff, v: { varName: power, ... } }.
// We parse expressions over + - * / ^ () and one-or-more single-letter variables,
// expand fully, and emit a canonical string. This makes factored and expanded
// forms compare equal ((x-2)(x-3) == x^2-5x+6) and handles fractional coefficients.

const pNeg = (A) => A.map((t) => ({ c: -t.c, v: t.v }));
const pScale = (A, k) => A.map((t) => ({ c: t.c * k, v: t.v }));
function pMul(A, B) {
  const out = [];
  for (const a of A) for (const b of B) {
    const v = { ...a.v };
    for (const k in b.v) v[k] = (v[k] || 0) + b.v[k];
    out.push({ c: a.c * b.c, v });
  }
  return out;
}
function pPow(A, n) { let r = [{ c: 1, v: {} }]; for (let i = 0; i < n; i++) r = pMul(r, A); return r; }
function asConst(A) { // numeric value if A has no variables, else null
  let c = 0;
  for (const t of A) { if (Object.keys(t.v).some((k) => t.v[k] !== 0)) return null; c += t.c; }
  return c;
}

function tokenizePoly(s) {
  const toks = [];
  for (let i = 0; i < s.length; ) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) { let j = i + 1; while (j < s.length && /[0-9.]/.test(s[j])) j++; toks.push({ t: "num", v: s.slice(i, j) }); i = j; }
    else if (/[a-z]/.test(ch)) { toks.push({ t: "var", v: ch }); i++; }
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
      const e = peek();
      if (!e || e.t !== "num") return null;
      pos++;
      const n = parseFloat(e.v);
      if (!Number.isInteger(n) || n < 0 || n > 8) return null;
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
    if (p.t === "-") { pos++; const b = parseBaseP(); return b === null ? null : pNeg(b); }
    if (p.t === "+") { pos++; return parseBaseP(); }
    return null;
  }

  const result = parseExpr();
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

// Split a single rational expression P/Q into numerator and denominator
// polynomials (a bare polynomial is P/1). Handles ONE top-level division; the
// numerator/denominator may themselves be any polynomials (incl. a variable
// denominator, which the plain polynomial parser rejects). Returns {num, den}
// term arrays or null. Two rationals are then compared by cross-multiplication.
function rationalParts(normalized) {
  if (/[=,<>]/.test(normalized)) return null; // not a single rational expression
  let depth = 0, slash = -1;
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "/" && depth === 0) { slash = i; break; }
  }
  const numS = slash === -1 ? normalized : normalized.slice(0, slash);
  const denS = slash === -1 ? "1" : normalized.slice(slash + 1);
  const num = parsePoly(numS), den = parsePoly(denS);
  if (num === null || den === null || polyToString(den) === "0") return null;
  return { num, den };
}

// Canonicalize a full answer: an equation (side-swap invariant, but never moving
// terms across "=") or a bare expression.
function canonEquation(normalized) {
  if (isWord(normalized)) return null;
  if (normalized.includes("=")) {
    const parts = normalized.split("=");
    if (parts.length !== 2) return null;
    const a = polyCanonExpr(parts[0]);
    const b = polyCanonExpr(parts[1]);
    if (a === null || b === null) return null;
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
    const m = p.match(/^([a-z])=(.+)$/);
    if (m) { anyNamed = true; const n = parseNum(m[2]); if (n === null) return null; named[m[1]] = n; }
    else { const n = parseNum(p); if (n === null) return null; bare.push(n); }
  }
  if (anyNamed) {
    if (bare.length > 0) return null; // mixed named/bare is ambiguous
    return Object.keys(named).sort().map((k) => named[k]);
  }
  return bare;
}

// Canonicalize a linear/polynomial inequality so direction-flips compare equal:
// "x > 3" == "3 < x", "2x <= 6" == "6 >= 2x". Strictness (< vs <=) must match.
// We move everything to one side (L - R), then pick a sign-canonical form so the
// representation is unique regardless of which side the variable sat on.
function canonInequality(normalized) {
  const m = normalized.match(/^(.*?)(<=|>=|<|>)(.*)$/);
  if (!m) return null;
  const [, L, op, R] = m;
  const lp = parsePoly(L), rp = parsePoly(R);
  if (!lp || !rp) return null;
  const E = lp.concat(pNeg(rp));            // L - R
  const sE = polyToString(E), sEn = polyToString(pNeg(E));
  const strict = op === "<" || op === ">";
  // ">" / ">=" mean E > 0; "<" / "<=" mean E < 0. Keep a sign label, flip on negate.
  let positive = op === ">" || op === ">=";
  let str = sE;
  if (sEn < sE) { str = sEn; positive = !positive; } // negate E -> flip direction
  return `${str}|${positive ? "gt" : "lt"}|${strict ? "s" : "n"}`;
}

// Parse an UNORDERED solution set: "x=2 or x=-3", "2, -3", "{2,-3}", "x=4"
// (a single/double root). Returns a numerically-sorted array, or null.
function parseSolutionSet(normalized) {
  let s = normalized.replace(/[{}]/g, "").replace(/or/g, ",");
  const parts = s.split(",").filter((p) => p !== "");
  if (parts.length === 0) return null;
  const nums = [];
  for (let p of parts) {
    p = p.replace(/^[a-z]+=/, ""); // strip "x=", "r=", "lambda=", etc.
    const n = parseNum(p);
    if (n === null) return null;
    nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

// Pull a single number out of answers like "x = 7", "7", "x=-3.5", "1/2".
function extractNumber(s) {
  const t = normalize(s);
  const m = t.match(/^(?:[a-z]+=)?(.+)$/); // optional "x=", "lambda=", etc.
  return m ? parseNum(m[1]) : null;
}

// Evaluate a constant arithmetic expression to a Number, supporting sqrt, pi, e,
// + - * / ^ and parentheses (and implicit multiplication). Returns null if the
// expression contains a free variable or can't be evaluated. This lets exact
// forms compare by value: "5sqrt2" == "sqrt(50)" == "7.0710678", "16pi" == "50.27".
function evalNumeric(normalized) {
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
      else return null; // a free variable (or unsupported function)
      i = j;
    } else if ("+-*/^()".includes(ch)) { toks.push({ t: ch }); i++; }
    else return null;
  }
  if (toks.length === 0) return null;
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
      else if (p.t === "num" || p.t === "const" || p.t === "(" || p.t === "sqrt") { const f = factor(); if (f === null) return null; acc *= f; }
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
    if (p.t === "-") { pos++; const b = base(); return b === null ? null : -b; }
    if (p.t === "+") { pos++; return base(); }
    return null;
  }
  const r = expr();
  return r !== null && pos === toks.length && isFinite(r) ? r : null;
}

// Is the input written as a product of factors (not an expanded sum)? Used to
// enforce `form: "factored"` steps: the polynomial engine treats (x-2)(x-3) and
// x^2-5x+6 as equal, so without this gate a "factor this" step would accept the
// un-factored original. A factored form has a parenthesized factor and no
// additive operator at paren-depth 0 (a single leading sign is allowed).
function isFactoredForm(normalized) {
  if (!normalized.includes("(") || !/[a-z]/.test(normalized)) return false;
  let depth = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if ((ch === "+" || ch === "-") && depth === 0 && i !== 0) return false;
  }
  return true;
}

// Compare a learner's answer to a step. Returns true if acceptable.
export function checkStep(step, userAnswer) {
  const u = normalize(userAnswer);
  if (u === "") return false;
  // Factored-form steps must actually be factored, not the expanded equivalent.
  if (step.form === "factored" && !isFactoredForm(u)) return false;

  const candidates = [step.answer, ...(step.accept || [])];

  // Solution-set steps: compare as an UNORDERED set of roots (order-independent).
  if (step.form === "solutions") {
    const uSet = parseSolutionSet(u);
    for (const cand of candidates) {
      if (normalize(cand) === u) return true;
      const cSet = parseSolutionSet(normalize(cand));
      if (uSet && cSet && uSet.length === cSet.length &&
          uSet.every((v, i) => Math.abs(v - cSet[i]) < 1e-6)) return true;
    }
    return false;
  }

  const uCanon = canonEquation(u);
  const uTuple = parseTuple(u);
  const uNum = extractNumber(userAnswer);
  const uIneq = canonInequality(u);
  const uVal = evalNumeric(u);
  const uRat = rationalParts(u);

  for (const cand of candidates) {
    const c = normalize(cand);
    if (c === u) return true;                                 // exact (normalized)
    const cCanon = canonEquation(c);
    if (uCanon !== null && cCanon !== null && uCanon === cCanon) return true; // structural / algebraic
    if (uIneq !== null && canonInequality(c) === uIneq) return true;          // inequality (direction-aware)
    const cTuple = parseTuple(c);
    if (uTuple && cTuple && uTuple.length === cTuple.length &&
        uTuple.every((v, i) => Math.abs(v - cTuple[i]) < 1e-6)) return true;
    const cNum = extractNumber(cand);
    if (uNum !== null && cNum !== null && Math.abs(uNum - cNum) < 1e-6) return true;
    const cVal = evalNumeric(c);                                              // radical / pi / e value
    if (uVal !== null && cVal !== null && Math.abs(uVal - cVal) < 1e-6) return true;
    // Rational-expression equality via cross-multiplication (only when a fraction
    // is involved; bare polynomials are already handled by the canon path above).
    if (uRat && (u.includes("/") || c.includes("/"))) {
      const cRat = rationalParts(c);
      if (cRat && polyToString(pMul(uRat.num, cRat.den)) === polyToString(pMul(cRat.num, uRat.den))) return true;
    }
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
    // A per-session seed base derived from content length (no Date.* allowed in
    // some contexts; here we use a fixed base offset by counter for variety).
    this.seedBase = (topic.id || "t").length * 7919 + 13;
  }

  // Generate defensively: a buggy generator must never crash a live session.
  safeGenerate(template, rng, idx) {
    try { return generate(template, rng, idx); }
    catch { return null; }
  }

  // Return the next problem for a concept at a difficulty.
  next(conceptId, difficulty) {
    // 1) Try a generator that matches concept + difficulty (preferred: variety).
    const gens = this.templates.filter((t) => {
      const probe = this.safeGenerate(t, makeRng(1), -1);
      return probe && probe.difficulty === difficulty && probe.concepts.includes(conceptId);
    });
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
