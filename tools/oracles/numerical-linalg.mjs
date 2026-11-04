// Oracles for numerical-methods (nm1-*, nm2-*) and linear-algebra dynamics
// (laf2-dynamics-d3) generators. Each recomputes the answer from the prompt
// text alone: bracket signs, significant figures and cancellation, solutions
// of the parsed linear system, the partial-pivoting choice, and eigenvalues
// of the parsed 2x2 matrix.

// Parse "$$3x - y + 2z = 7$$" lines into rows of coefficients plus the RHS.
// Unit coefficients are displayed bare ("x", "- y").
const parseSystem = (prompt, vars) => {
  const rows = [];
  for (const m of prompt.matchAll(/\$\$([^$]+)\$\$/g)) {
    const [lhs, rhs] = m[1].split("=");
    if (rhs === undefined) return null;
    const coef = Object.fromEntries(vars.map((v) => [v, 0]));
    const terms = lhs.replace(/\s+/g, "").match(/[+-]?\d*[a-z]/g) || [];
    for (const t of terms) {
      const v = t.slice(-1), c = t.slice(0, -1);
      if (!(v in coef)) return null;
      coef[v] += c === "" || c === "+" ? 1 : c === "-" ? -1 : Number(c);
    }
    rows.push([...vars.map((v) => coef[v]), Number(rhs.trim())]);
  }
  return rows.length === vars.length ? rows : null;
};

const det2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const det3 = (m) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

// Cramer's rule on an n x (n+1) augmented system (n = 2 or 3).
const solve = (aug) => {
  const n = aug.length;
  const A = aug.map((r) => r.slice(0, n)), b = aug.map((r) => r[n]);
  const det = n === 2 ? det2 : det3;
  const D = det(A);
  if (D === 0) return { D, x: null };
  const x = [];
  for (let j = 0; j < n; j++) x.push(det(A.map((r, i) => r.map((v, k) => (k === j ? b[i] : v)))) / D);
  return { D, x };
};

const tupleOf = (s) => {
  const m = String(s).match(/^<(.*)>$/);
  return m ? m[1].split(",").map((t) => Number(t.trim())) : null;
};
const sameTuple = (a, b) => a && b && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-9);

// Significant digits of a positive decimal string: drop the point and the
// leading zeros (trailing zeros after the point are significant).
const sigDigits = (s) => s.replace(".", "").replace(/^0+/, "");

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

export const oracles = {
  // f(t) = a t^2 - target on [lo, hi]: endpoint values, and a genuine sign
  // change (the narrative asserts f(lo) < 0 < f(hi) and the answer is "yes").
  "nm1-signchange-3": (p) => {
    const m = p.prompt.match(/f\(t\) = (\d+)t\^2 - (\d+)\$.*\$\[(\d+), (\d+)\]\$/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const [a, target, lo, hi] = m.slice(1).map(Number);
    const flo = a * lo * lo - target, fhi = a * hi * hi - target;
    if (Number(p.steps[0].answer) !== flo) return `f(${lo}) = ${flo}, answer ${p.steps[0].answer}`;
    if (Number(p.steps[1].answer) !== fhi) return `f(${hi}) = ${fhi}, answer ${p.steps[1].answer}`;
    const want = flo * fhi < 0 ? "yes" : "no";
    if (p.steps[2].answer !== want) return `f values ${flo}, ${fhi} but answer ${p.steps[2].answer}`;
    if (!(flo < 0 && fhi > 0)) return `no increasing sign change on [${lo}, ${hi}]: ${flo}, ${fhi}`;
    return null;
  },

  // f(x) = x^2 - N on [lo, hi]: endpoint values and product; the narrative
  // claims the product is negative, so it must be.
  "nm1-signchange-2": (p) => {
    const m = p.prompt.match(/f\(x\) = x\^2 - (\d+)\$ on \$\[(-?\d+), (-?\d+)\]\$/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const [N, lo, hi] = m.slice(1).map(Number);
    const flo = lo * lo - N, fhi = hi * hi - N;
    const got = p.steps.map((s) => Number(s.answer));
    if (got[0] !== flo || got[1] !== fhi || got[2] !== flo * fhi) return `answers ${got} vs ${flo}, ${fhi}, ${flo * fhi}`;
    if (flo * fhi >= 0) return `no sign change: product ${flo * fhi}`;
    return null;
  },

  // Catastrophic cancellation: stated sig-fig count matches the operands, the
  // difference is exact, and digits retained = sig digits of the difference
  // = (stated count) - (shared leading digits stated in the instruction).
  "nm1-float-3": (p, { checkStep }) => {
    const m = p.prompt.match(/Two (\d+)-significant-figure values are \$a = ([\d.]+)\$ and \$b = ([\d.]+)\$/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const n = Number(m[1]), as = m[2], bs = m[3];
    const da = sigDigits(as), db = sigDigits(bs);
    if (da.length !== n || db.length !== n) return `stated ${n} sig figs, operands have ${da.length} and ${db.length}`;
    const dec = (as.split(".")[1] || "").length;
    if ((bs.split(".")[1] || "").length !== dec) return "operands have different decimal places";
    const ia = Number(as.replace(".", "")), ib = Number(bs.replace(".", ""));
    const di = ia - ib;
    if (di <= 0) return "a <= b";
    const diff = (di / 10 ** dec).toFixed(dec);
    if (Math.abs(Number(p.steps[0].answer) - Number(diff)) > 1e-12) return `a - b = ${diff}, answer ${p.steps[0].answer}`;
    for (const w of ["0", "0.0000", ((di + 1) / 10 ** dec).toFixed(dec), ((di - 1) / 10 ** dec).toFixed(dec)]) {
      if (Number(w) !== Number(diff) && checkStep(p.steps[0], w)) return `wrong difference ${w} accepted (true ${diff})`;
    }
    if (!checkStep(p.steps[0], diff)) return `true difference ${diff} rejected`;
    let shared = 0;
    while (shared < n && da[shared] === db[shared]) shared++;
    const k = p.steps[1].instruction.match(/first (\d+) significant digits/);
    if (!k || Number(k[1]) !== shared) return `instruction says ${k && k[1]} shared digits, operands share ${shared}`;
    const retained = String(di).length;
    if (Number(p.steps[1].answer) !== retained) return `difference ${diff} keeps ${retained} sig digits, answer ${p.steps[1].answer}`;
    if (n - shared !== retained) return `${n} - ${shared} != ${retained} retained digits`;
    return null;
  },

  // 2x2 system: nonsingular, the reported y and <x, y> solve it, and the
  // eliminated pivot is nonzero.
  "nm2-gauss-1": (p) => {
    const aug = parseSystem(p.prompt, ["x", "y"]);
    if (!aug) return `unparsed prompt: ${p.prompt}`;
    const { D, x } = solve(aug);
    if (D === 0) return `singular system (det 0): ${JSON.stringify(aug)}`;
    if (Number(p.steps[0].answer) === 0) return "eliminated pivot a22' is 0";
    if (Math.abs(Number(p.steps[2].answer) - x[1]) > 1e-9) return `y = ${x[1]}, answer ${p.steps[2].answer}`;
    if (!sameTuple(tupleOf(p.steps[3].answer), x)) return `solution ${x}, answer ${p.steps[3].answer}`;
    return null;
  },

  // 3x3 system: nonsingular, second pivot (after eliminating x) nonzero so
  // elimination needs no swap, and the reported <x, y, z> solves it.
  "nm2-gauss-3": (p) => {
    const aug = parseSystem(p.prompt, ["x", "y", "z"]);
    if (!aug) return `unparsed prompt: ${p.prompt}`;
    const { D, x } = solve(aug);
    if (D === 0) return `singular system (det 0): ${JSON.stringify(aug)}`;
    const piv2 = aug[1][1] - (aug[1][0] / aug[0][0]) * aug[0][1];
    if (piv2 === 0) return "second pivot is 0 (needs a row swap)";
    if (!sameTuple(tupleOf(p.steps[2].answer), x)) return `solution ${x}, answer ${p.steps[2].answer}`;
    return null;
  },

  // Partial pivoting swaps exactly when the entry below is larger in magnitude.
  "nm2-pivot-1": (p, { checkStep }) => {
    const m = p.prompt.match(/current pivot entry is \$(-?\d+)\$ and the entry below it is \$(-?\d+)\$/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const [top, bot] = m.slice(1).map(Number);
    const want = Math.abs(bot) > Math.abs(top) ? "yes" : "no";
    if (p.steps[0].answer !== want) return `pivot ${top}, below ${bot}: answer ${p.steps[0].answer}, want ${want}`;
    if (checkStep(p.steps[0], want === "yes" ? "no" : "yes")) return "opposite answer accepted";
    return null;
  },

  // Leslie-style 2x2: nonnegative entries, a unique dominant eigenvalue that
  // is positive, named by the answer, with a positive eigenvector.
  "laf2-dynamics-d3": (p, { checkStep }) => {
    const m = p.prompt.match(/A = \[\[(-?\d+), (-?\d+)\], \[(-?\d+), (-?\d+)\]\]/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const [a, b, c, d] = m.slice(1).map(Number);
    if ([a, b, c, d].some((v) => v < 0)) return `negative matrix entry: ${m[0]}`;
    const tr = a + d, dt = a * d - b * c, disc = tr * tr - 4 * dt;
    if (disc < 0) return "complex eigenvalues";
    const r = Math.sqrt(disc);
    const l1 = (tr + r) / 2, l2 = (tr - r) / 2;
    const ls = [l1, l2].sort((u, v) => Math.abs(v) - Math.abs(u));
    if (Math.abs(Math.abs(ls[0]) - Math.abs(ls[1])) < 1e-9) return `no unique dominant eigenvalue: ${l1}, ${l2}`;
    const dom = ls[0];
    if (dom <= 0) return `dominant eigenvalue ${dom} is not positive`;
    if (!checkStep(p.steps[0], `${l1}, ${l2}`)) return `true eigenvalues ${l1}, ${l2} rejected`;
    if (Math.abs(Number(p.steps[1].answer) - dom) > 1e-9) return `dominant eigenvalue ${dom}, answer ${p.steps[1].answer}`;
    const v = tupleOf(p.steps[2].answer);
    if (!v || v.length !== 2 || v.some((t) => !(t > 0) || !Number.isInteger(t))) return `eigenvector ${p.steps[2].answer} not positive integers`;
    if (gcd(v[0], v[1]) !== 1) return `eigenvector ${p.steps[2].answer} not smallest`;
    if (a * v[0] + b * v[1] !== dom * v[0] || c * v[0] + d * v[1] !== dom * v[1]) return `${p.steps[2].answer} is not an eigenvector for ${dom}`;
    return null;
  },
};
