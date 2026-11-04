// Oracles for statistics (descriptive, random variables), Calculus 1/3
// sign tests, and the slope-field direction question. Each recomputes the
// answer from the prompt text only.

const num = (s) => Number(s);
const near = (a, b) => Math.abs(a - b) < 1e-9;
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Parse a polynomial in x like "3x^2 - 6x + 6" or "x^3 + 3x^2" into {power: coef}.
function parsePoly(src) {
  const s = src.replace(/\s+/g, "").replace(/\{|\}/g, "");
  const terms = s.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== s) throw new Error(`cannot parse polynomial "${src}"`);
  const poly = {};
  for (const t of terms) {
    const m = t.match(/^([+-]?)(\d*)(x(?:\^(\d+))?)?$/);
    if (!m || (!m[2] && !m[3])) throw new Error(`bad term "${t}" in "${src}"`);
    const sign = m[1] === "-" ? -1 : 1;
    const coef = sign * (m[2] === "" ? 1 : Number(m[2]));
    const pow = m[3] ? (m[4] ? Number(m[4]) : 1) : 0;
    poly[pow] = (poly[pow] || 0) + coef;
  }
  return poly;
}
const derivAt = (poly, x, order) => {
  let v = 0;
  for (const [k, c] of Object.entries(poly)) {
    let n = Number(k), f = c;
    for (let i = 0; i < order; i++) { f *= n - i; }
    if (n - order >= 0) v += f * x ** (n - order);
  }
  return v;
};
const rejects = (checkStep, step, wrong) => checkStep(step, wrong) ? `grader accepts the wrong answer "${wrong}"` : null;

export const oracles = {
  "stat-desc-out-d3": (p, { checkStep }) => {
    const m = p.prompt.match(/\\\{([^}]*)\\\}/);
    if (!m) return "no data set in prompt";
    const data = m[1].split(",").map((x) => num(x.trim())).sort((a, b) => a - b);
    if (data.length !== 8) return `expected 8 values, got ${data.length}`;
    // Median-of-halves quartiles (the course's method): n = 8 splits 4 / 4.
    const q1 = median(data.slice(0, 4)), q3 = median(data.slice(4));
    const iqr = q3 - q1, fence = q3 + 1.5 * iqr, max = data[7];
    const tested = num(p.prompt.match(/whether (-?[\d.]+) is an outlier/)[1]);
    if (tested !== max) return `tested value ${tested} is not the maximum ${max}`;
    const want = max > fence ? "yes" : "no";
    const [s1, s2, s3, s4] = p.steps;
    if (!near(num(s1.answer), q1)) return `Q1 ${s1.answer}, expected ${q1}`;
    if (!near(num(s2.answer), q3)) return `Q3 ${s2.answer}, expected ${q3}`;
    if (!near(num(s3.answer), iqr)) return `IQR ${s3.answer}, expected ${iqr}`;
    if (s4.answer !== want) return `says "${s4.answer}" but max ${max} vs fence ${fence} gives "${want}"`;
    if (p.finalAnswer.value !== want) return `finalAnswer "${p.finalAnswer.value}", expected "${want}"`;
    return rejects(checkStep, s4, want === "yes" ? "no" : "yes");
  },

  "stat-rv-ev-d1": (p) => {
    const m = p.prompt.match(/takes value (-?\d+) with probability \$0\.5\$ and value (-?\d+) with probability \$0\.5\$/);
    if (!m) return "cannot parse distribution";
    const a = num(m[1]), b = num(m[2]);
    if (a === b) return `degenerate distribution: both values are ${a}`;
    const ev = 0.5 * a + 0.5 * b;
    const last = p.steps[p.steps.length - 1];
    if (!near(num(last.answer), ev)) return `E[X] ${last.answer}, expected ${ev}`;
    if (!near(num(p.finalAnswer.value), ev)) return `finalAnswer ${p.finalAnswer.value}, expected ${ev}`;
    return null;
  },

  "stat-rv-dec-d2": (p, { checkStep }) => {
    const w = p.prompt.match(/pay \\\$(\d+(?:\.\d+)?) for an extended warranty/);
    const r = p.prompt.match(/repair costing \\\$(\d+(?:\.\d+)?) happens with probability \$([\d.]+)\$/);
    if (!w || !r) return "cannot parse warranty/repair";
    const warranty = num(w[1]), exp = Math.round(num(r[1]) * num(r[2]) * 100) / 100;
    if (near(warranty, exp)) return `tie: warranty ${warranty} equals expected cost ${exp}, no definite answer`;
    const want = warranty < exp ? "yes" : "no";
    if (!near(num(p.steps[0].answer), exp)) return `expected cost ${p.steps[0].answer}, expected ${exp}`;
    if (p.steps[1].answer !== want) return `says "${p.steps[1].answer}", expected "${want}" (warranty ${warranty} vs ${exp})`;
    return rejects(checkStep, p.steps[1], want === "yes" ? "no" : "yes");
  },

  "increasing-decreasing-v1": (p, { checkStep }) => {
    const m = p.prompt.match(/\$f\(x\) = ([^$]+)\$ increasing or decreasing at \$x = (-?\d+)\$/);
    if (!m) return "cannot parse prompt";
    const fp = derivAt(parsePoly(m[1]), num(m[2]), 1);
    if (fp === 0) return `f'(${m[2]}) = 0: neither increasing nor decreasing`;
    const want = fp > 0 ? "increasing" : "decreasing";
    if (p.steps[0].answer !== want) return `says ${p.steps[0].answer}, f'(${m[2]}) = ${fp}`;
    return rejects(checkStep, p.steps[0], fp > 0 ? "decreasing" : "increasing");
  },

  "concavity-v1": (p, { checkStep }) => {
    const m = p.prompt.match(/\$f\(x\) = ([^$]+)\$ concave up or concave down at \$x = (-?\d+)\$/);
    if (!m) return "cannot parse prompt";
    const fpp = derivAt(parsePoly(m[1]), num(m[2]), 2);
    if (fpp === 0) return `f''(${m[2]}) = 0: concavity test inconclusive`;
    const want = fpp > 0 ? "concave up" : "concave down";
    if (p.steps[0].answer !== want) return `says ${p.steps[0].answer}, f''(${m[2]}) = ${fpp}`;
    return rejects(checkStep, p.steps[0], fpp > 0 ? "concave down" : "concave up");
  },

  "second-deriv-test-v1": (p, { checkStep }) => {
    const m = p.prompt.match(/f_\{xx\} = (-?\d+)\$, \$f_\{yy\} = (-?\d+)\$, \$f_\{xy\} = (-?\d+)\$/);
    if (!m) return "cannot parse prompt";
    const fxx = num(m[1]), fyy = num(m[2]), fxy = num(m[3]);
    const D = fxx * fyy - fxy * fxy;
    if (D === 0) return `D = 0: second-derivative test inconclusive`;
    const want = D < 0 ? "saddle point" : fxx > 0 ? "minimum" : "maximum";
    if (num(p.steps[0].answer) !== D) return `D ${p.steps[0].answer}, expected ${D}`;
    if (p.steps[1].answer !== want) return `says ${p.steps[1].answer}, expected ${want} (D = ${D}, fxx = ${fxx})`;
    for (const wrong of ["minimum", "maximum", "saddle point"].filter((x) => x !== want)) {
      const r = rejects(checkStep, p.steps[1], wrong);
      if (r) return r;
    }
    return null;
  },

  "def-slope-fields-d2": (p, { checkStep }) => {
    const m = p.prompt.match(/\\frac\{dy\}\{dx\} = (-?\d*)x\^2 - y\$, a solution curve passes through \$\((-?\d+), (-?\d+)\)\$/);
    if (!m) return "cannot parse prompt";
    const a = m[1] === "" ? 1 : m[1] === "-" ? -1 : num(m[1]);
    const x = num(m[2]), y = num(m[3]);
    const slope = a * x * x - y;
    if (slope === 0) return `slope 0 at (${x}, ${y}): neither increasing nor decreasing`;
    if (num(p.steps[0].answer) !== slope) return `slope ${p.steps[0].answer}, expected ${slope}`;
    const want = slope > 0 ? "increasing" : "decreasing";
    if (p.steps[1].answer !== want) return `says ${p.steps[1].answer}, slope ${slope}`;
    return rejects(checkStep, p.steps[1], slope > 0 ? "decreasing" : "increasing");
  },
};
