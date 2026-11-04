// Oracles for the game-theory generators (js/gen-gt1-fill.js, js/gen-gt2-fill.js).
// Every check re-derives the answer from the payoff table printed in the
// prompt (or the tree plot's leaf labels) by brute force: best responses,
// pure Nash equilibria, strict dominance, indifference, backward induction.

// ---------------------------------------------------------------------------
// parsing
// ---------------------------------------------------------------------------

// Bimatrix table: "| **Top** | 1, 5 | 3, 4 |". Returns { rows, cols, pay } with
// pay[r][c] = [rowPayoff, colPayoff].
function parseBimatrix(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  const cells = (l) => l.split("|").slice(1, -1).map((s) => s.trim());
  const head = cells(lines[0]);
  const cols = head.slice(1);
  const rows = [], pay = [];
  for (const l of lines.slice(1)) {
    if (/^\|\s*-/.test(l)) continue;
    const cs = cells(l);
    rows.push(cs[0].replace(/\*/g, "").trim());
    pay.push(cs.slice(1).map((c) => c.split(",").map((x) => Number(x.trim()))));
  }
  if (rows.length !== 2 || cols.length !== 2) throw new Error("expected a 2x2 bimatrix");
  for (const r of pay) for (const c of r) if (c.length !== 2 || c.some(Number.isNaN)) throw new Error("bad cell");
  return { rows, cols, pay };
}

// Zero-sum matrix: "| Up | 3 | -1 |" (row player's payoff only).
function parseZeroSum(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("|"));
  const cells = (l) => l.split("|").slice(1, -1).map((s) => s.trim());
  const cols = cells(lines[0]).slice(1);
  const rows = [], M = [];
  for (const l of lines.slice(1)) {
    const cs = cells(l);
    rows.push(cs[0]);
    M.push(cs.slice(1).map(Number));
  }
  if (M.flat().some(Number.isNaN)) throw new Error("bad zero-sum entry");
  return { rows, cols, M };
}

// Tree plot leaves: node ids LA/LB/RA/RB with labels "(u1,u2)".
function parseTree(plot) {
  const leaf = {};
  for (const n of plot.nodes) {
    const m = String(n.label || "").match(/\((-?\d+),\s*(-?\d+)\)/);
    if (m) leaf[n.id] = [Number(m[1]), Number(m[2])];
  }
  for (const k of ["LA", "LB", "RA", "RB"]) if (!leaf[k]) throw new Error(`missing leaf ${k}`);
  return leaf;
}

// Numeric value of "a/b", "-3", "0.4286".
function num(s) {
  const t = String(s).trim();
  const m = t.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  return Number(t);
}
const close = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------------------
// game-theory brute force
// ---------------------------------------------------------------------------

// Weak (>=) pure Nash equilibria by checking every unilateral deviation.
function pureNashAll(pay) {
  const out = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
    const rowOk = pay[r][c][0] >= pay[1 - r][c][0];
    const colOk = pay[r][c][1] >= pay[r][1 - c][1];
    if (rowOk && colOk) out.push([r, c]);
  }
  return out;
}
// Index of the strictly dominated strategy for Row / Column, or -1.
function rowDominated(pay) {
  for (let r = 0; r < 2; r++) if (pay[1 - r][0][0] > pay[r][0][0] && pay[1 - r][1][0] > pay[r][1][0]) return r;
  return -1;
}
function colDominated(pay) {
  for (let c = 0; c < 2; c++) if (pay[0][1 - c][1] > pay[0][c][1] && pay[1][1 - c][1] > pay[1][c][1]) return c;
  return -1;
}
// p = P(Row plays row 0) making Column indifferent; q = P(Column plays col 0)
// making Row indifferent. Solved from the two expected-payoff lines.
function mixP(pay) {
  // p*u(0,0) + (1-p)*u(1,0) = p*u(0,1) + (1-p)*u(1,1)  (Column's payoffs)
  const a = pay[0][0][1], b = pay[1][0][1], c = pay[0][1][1], d = pay[1][1][1];
  const den = (a - b) - (c - d);
  return den === 0 ? null : (d - b) / den;
}
function mixQ(pay) {
  const a = pay[0][0][0], b = pay[0][1][0], c = pay[1][0][0], d = pay[1][1][0];
  const den = (a - b) - (c - d);
  return den === 0 ? null : (d - b) / den;
}

// Checks shared by the mixed-strategy templates: the game has no pure NE and
// the stated probability equals the indifference solution, strictly in (0,1).
function mixedGameIssues(pay) {
  if (pureNashAll(pay).length) return `game has a pure NE ${JSON.stringify(pureNashAll(pay))}`;
  const p = mixP(pay), q = mixQ(pay);
  if (p === null || q === null) return "indifference equation degenerate";
  if (!(p > 0 && p < 1 && q > 0 && q < 1)) return `mix not interior p=${p} q=${q}`;
  return null;
}
function checkNum(step, expected, label, checkStep) {
  if (!close(num(step.answer), expected)) return `${label}: answer ${step.answer}, expected ${expected}`;
  if (!checkStep(step, String(Math.round(expected * 1e4) / 1e4))) return `${label}: 4dp decimal ${expected} rejected`;
  return null;
}

// Variety guard: the old symmetric mixing template forced every probability to
// 1/2. Track answers across draws; by seed 100 there must be several values.
const seen = {};
function variety(name, value, seed) {
  (seen[name] ||= new Set()).add(Math.round(value * 1e6));
  if (seed === 100 && seen[name].size < 3) return `only ${seen[name].size} distinct mixing probabilities in 100 draws`;
  return null;
}

// ---------------------------------------------------------------------------
// oracles
// ---------------------------------------------------------------------------

const indiffQ = (name, kicker) => (p, { checkStep, seed }) => {
  const { pay } = parseBimatrix(p.prompt);
  const bad = mixedGameIssues(pay);
  if (bad) return bad;
  if (kicker) {
    // "The Kicker scores more often when the Keeper dives the wrong way."
    if (!(pay[1][0][0] > pay[0][0][0] && pay[0][1][0] > pay[1][1][0])) return "kicker does not prefer to mismatch the keeper";
    if (!(pay[0][0][1] > pay[0][1][1] && pay[1][1][1] > pay[1][0][1])) return "keeper does not prefer to match the kicker";
  }
  const q = mixQ(pay);
  return checkNum(p.steps[0], q, "q", checkStep)
    || (p.steps[1] ? checkNum(p.steps[1], 1 - q, "1-q", checkStep) : null)
    || variety(name, q, seed);
};

export const oracles = {
  "gt1-iesds-2": (p, { checkStep }) => {
    const { rows, cols, pay } = parseBimatrix(p.prompt);
    const rd = rowDominated(pay), cd = colDominated(pay);
    if (cd < 0) return "Column has no strictly dominated strategy";
    if (rd >= 0) return `Row also has a strictly dominated strategy (${rows[rd]})`;
    if (normalize(p.steps[0].answer) !== "column") return `step 1 answer ${p.steps[0].answer}`;
    if (checkStep(p.steps[0], "Row")) return "Row accepted for step 1";
    const surv = 1 - cd;
    if (p.steps[1].answer !== cols[surv]) return `surviving column ${p.steps[1].answer}, expected ${cols[surv]}`;
    if (pay[0][surv][0] === pay[1][surv][0]) return "Row tie in surviving column";
    const br = pay[0][surv][0] > pay[1][surv][0] ? 0 : 1;
    if (p.steps[2].answer !== rows[br]) return `Row reply ${p.steps[2].answer}, expected ${rows[br]}`;
    if (p.finalAnswer.value !== `(${rows[br]}, ${cols[surv]})`) return `final ${p.finalAnswer.value}`;
    return null;
  },

  "gt1-anti-2": (p, { checkStep }) => {
    const { rows, cols, pay } = parseBimatrix(p.prompt);
    const ne = pureNashAll(pay);
    const isNE = (r, c) => ne.some(([a, b]) => a === r && b === c);
    const sw = rows.indexOf("Swerve"), st = rows.indexOf("Straight");
    const csw = cols.indexOf("Swerve"), cst = cols.indexOf("Straight");
    const yn = (b) => (b ? "yes" : "no");
    if (p.steps[0].answer !== yn(isNE(st, cst))) return `(Straight, Straight) NE? keyed ${p.steps[0].answer}`;
    if (p.steps[1].answer !== yn(isNE(sw, cst))) return `(Swerve, Straight) NE? keyed ${p.steps[1].answer}`;
    if (Number(p.steps[2].answer) !== ne.length) return `NE count keyed ${p.steps[2].answer}, actual ${ne.length} ${JSON.stringify(ne)}`;
    if (!checkStep(p.steps[2], String(ne.length))) return "correct count rejected";
    return null;
  },

  "gt1-indiff-1": indiffQ("gt1-indiff-1", false),
  "gt1-indiff-3": indiffQ("gt1-indiff-3", true),
  "gt1-indiff-2": (p, { checkStep, seed }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const pp = mixP(pay);
    return checkNum(p.steps[0], pp, "p", checkStep) || checkNum(p.steps[1], 1 - pp, "1-p", checkStep) || variety("gt1-indiff-2", pp, seed);
  },

  "gt1-mixnash-1": (p, { checkStep, seed }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const pp = mixP(pay), q = mixQ(pay);
    return checkNum(p.steps[0], pp, "p", checkStep) || checkNum(p.steps[1], q, "q", checkStep) || variety("gt1-mixnash-1", pp * 7 + q, seed);
  },
  "gt1-mixnash-2": (p, { checkStep, seed }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const pp = mixP(pay), q = mixQ(pay);
    return checkNum(p.steps[0], pp, "p", checkStep) || checkNum(p.steps[1], 1 - pp, "1-p", checkStep)
      || checkNum(p.steps[2], q, "q", checkStep) || variety("gt1-mixnash-2", pp * 7 + q, seed);
  },
  "gt1-mixnash-3": (p, { checkStep, seed }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    if (p.steps[0].answer !== "no") return `pure NE? keyed ${p.steps[0].answer}`;
    const pp = mixP(pay), q = mixQ(pay);
    return checkNum(p.steps[1], pp, "p", checkStep) || checkNum(p.steps[2], q, "q", checkStep) || variety("gt1-mixnash-3", pp * 7 + q, seed);
  },

  // The value-under-mixing templates share mixingGame; check them too.
  "gt1-value-1": (p, { checkStep }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const q = mixQ(pay);
    const stated = p.prompt.match(/\$q = (-?\d+(?:\/\d+)?)\$/);
    if (!stated || !close(num(stated[1]), q)) return `stated q ${stated && stated[1]}, equilibrium q ${q}`;
    return checkNum(p.steps[0], q * pay[0][0][0] + (1 - q) * pay[0][1][0], "value", checkStep);
  },
  "gt1-value-2": (p, { checkStep }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const q = mixQ(pay);
    const v0 = q * pay[0][0][0] + (1 - q) * pay[0][1][0], v1 = q * pay[1][0][0] + (1 - q) * pay[1][1][0];
    if (!close(v0, v1)) return "rows not indifferent at stated q";
    return checkNum(p.steps[0], v0, "top value", checkStep) || checkNum(p.steps[1], v1, "bottom value", checkStep);
  },
  "gt1-value-3": (p, { checkStep }) => {
    const { pay } = parseBimatrix(p.prompt);
    const bad = mixedGameIssues(pay);
    if (bad) return bad;
    const pp = mixP(pay);
    const stated = p.prompt.match(/\$p = (-?\d+(?:\/\d+)?)\$/);
    if (!stated || !close(num(stated[1]), pp)) return `stated p ${stated && stated[1]}, equilibrium p ${pp}`;
    const v = pp * pay[0][0][1] + (1 - pp) * pay[1][0][1];
    if (Math.abs(num(p.steps[0].answer) - v) > 6e-5) return `Column value keyed ${p.steps[0].answer}, expected ${v}`;
    return null;
  },

  "gt2-zerosum-2": (p, { checkStep }) => {
    const { rows, M } = parseZeroSum(p.prompt);
    const br = (j) => {
      if (M[0][j] === M[1][j]) return null;
      return M[0][j] > M[1][j] ? 0 : 1;
    };
    const bl = br(0), brt = br(1);
    if (bl === null) return `tie in Left column (${M[0][0]} = ${M[1][0]})`;
    if (brt === null) return `tie in Right column (${M[0][1]} = ${M[1][1]})`;
    if (p.steps[0].answer !== rows[bl]) return `BR to Left keyed ${p.steps[0].answer}, expected ${rows[bl]}`;
    if (checkStep(p.steps[0], rows[1 - bl])) return "wrong BR to Left accepted";
    if (Number(p.steps[1].answer) !== M[bl][0]) return `payoff keyed ${p.steps[1].answer}, expected ${M[bl][0]}`;
    if (p.steps[2].answer !== rows[brt]) return `BR to Right keyed ${p.steps[2].answer}, expected ${rows[brt]}`;
    if (checkStep(p.steps[2], rows[1 - brt])) return "wrong BR to Right accepted";
    return null;
  },

  "gt2-firstmover-3": (p, { checkStep }) => {
    const L = parseTree(p.plot);
    // Firm 1 leads: Firm 2 best-responds at each node, Firm 1 picks the branch.
    const reply = (x, y) => (L[x][1] === L[y][1] ? null : L[x][1] > L[y][1] ? L[x] : L[y]);
    const atL = reply("LA", "LB"), atR = reply("RA", "RB");
    if (!atL || !atR) return "Firm 2 tie when following";
    if (atL[0] === atR[0]) return "Firm 1 tie when leading";
    const lead1 = atL[0] > atR[0] ? "L" : "R";
    const leadPay = (lead1 === "L" ? atL : atR)[0];
    // Firm 2 leads: Firm 2 commits to a or b, Firm 1 then picks L or R.
    const f1Reply = (act) => {
      const l = L["L" + act], r = L["R" + act];
      return l[0] === r[0] ? null : l[0] > r[0] ? l : r;
    };
    const ifA = f1Reply("A"), ifB = f1Reply("B");
    if (!ifA || !ifB) return "Firm 1 tie when following";
    if (ifA[1] === ifB[1]) return "Firm 2 tie when leading";
    const followPay = (ifA[1] > ifB[1] ? ifA : ifB)[0];
    const diff = leadPay - followPay;
    if (p.steps[0].answer !== lead1) return `leader branch keyed ${p.steps[0].answer}, expected ${lead1}`;
    if (Number(p.steps[1].answer) !== leadPay) return `leader payoff keyed ${p.steps[1].answer}, expected ${leadPay}`;
    if (p.steps[2].answer !== (diff > 0 ? "yes" : "no")) return `better off leading keyed ${p.steps[2].answer}, lead ${leadPay} follow ${followPay}`;
    if (Number(p.steps[3].answer) !== diff) return `difference keyed ${p.steps[3].answer}, expected ${diff}`;
    if (!checkStep(p.steps[3], String(diff))) return "correct difference rejected";
    if (Number(p.finalAnswer.value) !== diff) return `final ${p.finalAnswer.value}`;
    return null;
  },
};

function normalize(s) { return String(s).trim().toLowerCase(); }
