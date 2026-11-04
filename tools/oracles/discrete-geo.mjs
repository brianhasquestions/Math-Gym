// Oracles for the number-theory sieve, graph-degree, transformation-ID and
// trig amplitude/midline generators. Each recomputes from the prompt alone.

const primeFactors = (n) => {
  const out = [];
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) { out.push(d); while (n % d === 0) n /= d; }
  }
  if (n > 1) out.push(n);
  return out;
};

// Havel-Hakimi: can this degree sequence be realised by a simple graph?
const isGraphical = (seq) => {
  const s = [...seq];
  while (true) {
    s.sort((a, b) => b - a);
    const d = s.shift();
    if (d === undefined || d === 0) return true;
    if (d > s.length) return false;
    for (let i = 0; i < d; i++) { s[i]--; if (s[i] < 0) return false; }
  }
};

const same = (a, b) => a[0] === b[0] && a[1] === b[1];

export const oracles = {
  // "Is n prime?": verdict by trial division; a factor step must accept the
  // smallest prime factor, and every prime factor unless it asks for the smallest.
  "nt1-sieve-1": (p, { checkStep }) => {
    const m = p.prompt.match(/^Is (\d+) prime\?/);
    if (!m) return "unparsed prompt";
    const n = Number(m[1]);
    const pf = primeFactors(n);
    const isPrime = pf.length === 1 && pf[0] === n;
    if (p.finalAnswer.value !== (isPrime ? "prime" : "composite")) return `${n}: final ${p.finalAnswer.value}`;
    if (isPrime) return null;
    const step = p.steps[0];
    if (!checkStep(step, String(pf[0]))) return `${n}: smallest prime factor ${pf[0]} rejected`;
    if (/smallest/.test(step.instruction)) {
      for (const f of pf.slice(1)) if (checkStep(step, String(f))) return `${n}: asks for smallest but accepts ${f}`;
    } else {
      for (const f of pf) if (!checkStep(step, String(f))) return `${n}: prime factor ${f} rejected for "${step.instruction}"`;
    }
    return null;
  },

  // n = f * c: bound, smallest factor, cofactor, and the narrative's claim.
  "nt1-sieve-3": (p, { checkStep }) => {
    const m = p.prompt.match(/^(\d+) looks prime/);
    if (!m) return "unparsed prompt";
    const n = Number(m[1]);
    const f = primeFactors(n)[0];
    if (f === n) return `${n} is prime`;
    const bound = Math.floor(Math.sqrt(n));
    if (!checkStep(p.steps[0], String(bound))) return `${n}: bound ${bound} rejected`;
    const fm = p.steps[1].instruction.match(/smallest prime factor is (\d+)/);
    if (!fm || Number(fm[1]) !== f) return `${n}: stated smallest factor ${fm && fm[1]}, true ${f}`;
    if (!checkStep(p.steps[1], String(n / f))) return `${n}: cofactor ${n / f} rejected`;
    if (/both factors exceed 10/.test(p.solutionNarrative) && f <= 10) return `${n}: narrative says both factors exceed 10, but ${f} does not`;
    return null;
  },

  // Data-center degree sequence must be graphical; cables = degree sum / 2.
  "dm-gr-deg-d3": (p, { checkStep }) => {
    const m = p.prompt.match(/has (\d+) servers\. (\d+) of them are core servers, each cabled to exactly (\d+) others; the remaining (\d+) are edge servers, each cabled to exactly (\d+) others/);
    if (!m) return "unparsed prompt";
    const [N, n1, d1, n2, d2] = m.slice(1).map(Number);
    if (n1 + n2 !== N) return `counts ${n1}+${n2} != ${N}`;
    const seq = [...Array(n1).fill(d1), ...Array(n2).fill(d2)];
    if (!isGraphical(seq)) return `degree sequence [${seq.join(",")}] is not graphical`;
    const sum = n1 * d1 + n2 * d2;
    if (!checkStep(p.steps[0], String(sum))) return `degree sum ${sum} rejected`;
    if (!checkStep(p.steps[1], String(sum / 2))) return `cables ${sum / 2} rejected`;
    return null;
  },

  // Exactly one candidate move (axis/diagonal reflections, quarter/half turns,
  // translations, dilations) may map both points, and it must be the answer.
  "geo2-compositions-3": (p, { checkStep }) => {
    const a = p.prompt.match(/A\((-?\d+), (-?\d+)\) \\to A'\((-?\d+), (-?\d+)\)/);
    const b = p.prompt.match(/B\((-?\d+), (-?\d+)\) \\to B'\((-?\d+), (-?\d+)\)/);
    if (!a || !b) return "unparsed prompt";
    const [A, A2, B, B2] = [[a[1], a[2]], [a[3], a[4]], [b[1], b[2]], [b[3], b[4]]].map((v) => v.map(Number));
    if (same(A, B)) return "pre-image points coincide";
    const cands = [
      ["reflection", "x-axis", ([x, y]) => [x, -y]],
      ["reflection", "y-axis", ([x, y]) => [-x, y]],
      ["reflection", "y = x", ([x, y]) => [y, x]],
      ["reflection", "y = -x", ([x, y]) => [-y, -x]],
      ["rotation", "90", ([x, y]) => [-y, x]],
      ["rotation", "180", ([x, y]) => [-x, -y]],
      ["rotation", "270", ([x, y]) => [y, -x]],
    ];
    const t = [A2[0] - A[0], A2[1] - A[1]];
    if (t[0] || t[1]) cands.push(["translation", `(${t})`, ([x, y]) => [x + t[0], y + t[1]]]);
    const k = A[0] !== 0 ? A2[0] / A[0] : A2[1] / A[1];
    if (k > 0 && k !== 1) cands.push(["dilation", `k=${k}`, ([x, y]) => [k * x, k * y]]);
    const hits = cands.filter(([, , f]) => same(f(A), A2) && same(f(B), B2));
    if (hits.length !== 1) return `${hits.length} moves fit: ${hits.map((h) => `${h[0]} ${h[1]}`).join("; ") || "none"}`;
    const [word, detail] = hits[0];
    if (p.finalAnswer.value !== word) return `final ${p.finalAnswer.value}, true ${word} ${detail}`;
    if (!checkStep(p.steps[p.steps.length - 1], word)) return `menu answer ${word} rejected`;
    if (word === "reflection") {
      if (!/axis/.test(detail)) return `diagonal reflection ${detail} not in the menu's scope`;
      const axis = detail[0], flipped = axis === "x" ? "y" : "x";
      if (!checkStep(p.steps[0], flipped)) return `flipped coordinate ${flipped} rejected`;
      if (!checkStep(p.steps[1], axis)) return `mirror axis ${axis} rejected`;
    }
    if (word === "rotation" && !checkStep(p.steps[0], detail)) return `angle ${detail} rejected`;
    if (word === "dilation" && !checkStep(p.steps[0], String(k))) return `scale ${k} rejected`;
    return null;
  },

  // Amplitude/midline from max/min; non-temperature quantities stay >= 1.
  "trg-amp-mid-d2": (p, { checkStep }) => {
    const m = p.prompt.match(/^(.*?) oscillates sinusoidally between a minimum of (-?\d+) and a maximum of (-?\d+)\./);
    if (!m) return "unparsed prompt";
    const ctx = m[1], lo = Number(m[2]), hi = Number(m[3]);
    if (hi <= lo) return `max ${hi} <= min ${lo}`;
    if (!/temperature/.test(ctx) && lo < 1) return `"${ctx}" has nonphysical minimum ${lo}`;
    const A = (hi - lo) / 2, D = (hi + lo) / 2;
    if (!checkStep(p.steps[0], String(A))) return `amplitude ${A} rejected`;
    if (!checkStep(p.steps[1], String(D))) return `midline ${D} rejected`;
    return null;
  },
};
