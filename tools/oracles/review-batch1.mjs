// Oracles for the generators fixed in math-review batch 1 (avg-value,
// span weights, Diophantine smallest-x, characteristic-root labels).
// Each recomputes the answer from the prompt text alone.

export const oracles = {
  // f(x) = c x^2 on [0, b]: average = (1/b) * c b^3 / 3 = c b^2 / 3.
  "avg-value-v1": (p) => {
    const m = p.prompt.match(/= (\d+)x\^2\$ on \$\[0, (\d+)\]/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const [c, b] = [Number(m[1]), Number(m[2])];
    const want = (c * b * b) / 3;
    return Math.abs(Number(p.steps[0].answer) - want) < 1e-9 ? null : `answer ${p.steps[0].answer}, want ${want}`;
  },

  // b = c1 v1 + c2 v2: solve the 2x2 system by Cramer's rule.
  "laf-span-membership-d2": (p, { checkStep }) => {
    const v = [...p.prompt.matchAll(/\\langle (-?\d+), (-?\d+) \\rangle/g)].map((m) => [Number(m[1]), Number(m[2])]);
    if (v.length !== 3) return "unparsed prompt";
    const [b, v1, v2] = v;
    const det = v1[0] * v2[1] - v2[0] * v1[1];
    if (det === 0) return "dependent vectors";
    const c1 = (b[0] * v2[1] - v2[0] * b[1]) / det, c2 = (v1[0] * b[1] - b[0] * v1[1]) / det;
    if (!checkStep(p.steps[0], `${c1}, ${c2}`)) return `true weights (${c1}, ${c2}) rejected`;
    if (checkStep(p.steps[0], `${c1}`)) return "a lone c1 is accepted";
    return null;
  },

  // ax + by = c: the reported (x, y) must solve it, with x the smallest positive x.
  "nt1-general-3": (p) => {
    const m = p.prompt.match(/\$(\d+)x \+ (\d+)y = (\d+)\$/);
    if (!m) return "unparsed prompt";
    const [a, b, c] = m.slice(1).map(Number);
    const x = Number(p.steps[0].answer), y = Number(p.steps[p.steps.length - 1].answer);
    if (a * x + b * y !== c) return `(${x}, ${y}) does not solve ${a}x+${b}y=${c}`;
    for (let t = 1; t < x; t++) if ((c - a * t) % b === 0) return `smaller positive x exists: ${t}`;
    return null;
  },

  // y'' + b y' + c y = 0: classify by the sign of b^2 - 4c, from the prompt.
  "de-classify-roots-v1": (p) => {
    // Either term may be absent (coefficient 0) and a coefficient of 1 is
    // displayed bare ("+ y'", "- y").
    const m = p.prompt.match(/y'' (?:([+-]) (\d*)y' )?(?:([+-]) (\d*)y )?= 0/);
    if (!m) return `unparsed prompt: ${p.prompt}`;
    const coef = (sign, digits) => (sign === undefined ? 0 : (sign === "-" ? -1 : 1) * (digits === "" ? 1 : Number(digits)));
    const b = coef(m[1], m[2]), c = coef(m[3], m[4]);
    const D = b * b - 4 * c;
    const want = D > 0 ? "real distinct" : D === 0 ? "repeated" : "complex";
    return p.steps[0].answer === want ? null : `D=${D} labeled ${p.steps[0].answer}`;
  },
};
