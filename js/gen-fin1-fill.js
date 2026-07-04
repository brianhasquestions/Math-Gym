// gen-fin1-fill.js
// Parametric generators for the first four Financial Mathematics topics:
//   financial-mathematics.simple-and-compound-interest
//     fm1-simple-interest-*, fm1-compound-interest-*,
//     fm1-compounding-ear-*, fm1-continuous-*
//   financial-mathematics.present-and-future-value
//     fm1-future-value-*, fm1-present-value-*,
//     fm1-solve-rate-time-*, fm1-compare-cashflows-*
//   financial-mathematics.annuities
//     fm1-fv-ordinary-*, fm1-pv-ordinary-*,
//     fm1-annuity-due-*, fm1-sinking-fund-*
//   financial-mathematics.loans-and-amortization
//     fm1-loan-payment-*, fm1-amortization-*,
//     fm1-total-cost-*, fm1-extra-payment-*
//
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry. Template prefix: fm1-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every answer is computed in
// the generator from the SAME numbers shown in the prompt, so prompt and key
// never desync.
//
// Grader notes honored throughout (js/problem-engine.js):
//  - Money answers are the EXACT rounded-to-the-cent decimal string (e.g.
//    "1276.28"). We add ONLY variants that self-check under checkStep: the
//    trailing-zero form ("1276.28"->"1276.280") and, where a value ends flush
//    at the cent, harmless equivalents. Commas are NEVER emitted (the number
//    parser rejects "1,276.28" unless it is literally the answer string).
//  - Rates are emitted as a percent rounded to 2 decimals in ONE canonical
//    form per step; the decimal form is added to accept only when it self-checks.
//  - The (1+i)^n factors are written with ^ so evalNumeric verifies them; the
//    generator computes the identical value with Math.pow and rounds the same
//    way, so the plain decimal the student enters matches to the cent.
//  - Guards: rate/period i is always > 0 in annuity/loan formulas (no /0),
//    n >= 1, balances stay positive, and no payment ever rounds to 0.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
// Money string: fixed to exactly 2 decimals, e.g. 1276.2 -> "1276.20".
const money = (x) => round2(x).toFixed(2);
// Percent string rounded to `p` decimals (default 2), e.g. 6.1678 -> "6.17".
const pct = (x, p = 2) => {
  const f = Math.pow(10, p);
  return `${Math.round((x + Number.EPSILON) * f) / f}`;
};
// Trailing-zero accept variant of a money string ("1276.28" -> "1276.280").
const moneyAccepts = (s) => [`${s}0`, `$${s}`];

export const fill = {};

// ===========================================================================
// TOPIC 1: financial-mathematics.simple-and-compound-interest
//   concepts: simple-interest, compound-interest,
//             compounding-frequency-and-ear, continuous-compounding
// ===========================================================================

// --- simple-interest  I = Prt ---
fill["fm1-simple-interest-1"] = (rng, idx) => {
  const P = rng.int(5, 40) * 100;      // 500..4000
  const rp = rng.int(2, 9);            // percent
  const t = rng.int(2, 6);             // years
  const r = rp / 100;
  const I = round2(P * r * t);
  return {
    id: `gen.fm1-simple-interest-1.${idx}`, generated: true, concepts: ["simple-interest"], difficulty: 1, context: "applied",
    prompt: `You deposit \\$${P} in an account paying **${rp}% simple interest** per year. How much **interest** does it earn in ${t} years? Use $I = Prt$. Enter the interest as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Write the annual rate ${rp}% as a decimal.`, answer: `${r}`, accept: [], hint: `Divide the percent by 100: ${rp}/100.` },
      { instruction: `Compute the interest $I = Prt = ${P} \\cdot ${r} \\cdot ${t}$. Enter a number rounded to the nearest cent.`, answer: money(I), accept: moneyAccepts(money(I)), hint: `Multiply principal, rate, and time straight through.` },
    ],
    finalAnswer: { value: money(I), unit: "dollars" },
    solutionNarrative: `Simple interest is a flat $I = Prt = ${P}(${r})(${t}) = \\$${money(I)}$ — the rate applies only to the original principal, never to prior interest.`,
  };
};
fill["fm1-simple-interest-2"] = (rng, idx) => {
  const P = rng.int(6, 30) * 100;
  const rp = rng.int(3, 8);
  const t = rng.int(2, 5);
  const r = rp / 100;
  const I = round2(P * r * t);
  const A = round2(P + I);
  return {
    id: `gen.fm1-simple-interest-2.${idx}`, generated: true, concepts: ["simple-interest"], difficulty: 2, context: "applied",
    prompt: `A \\$${P} loan charges **${rp}% simple interest** per year for ${t} years. Find the **total amount owed** (principal plus interest). Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the interest $I = Prt = ${P} \\cdot ${r} \\cdot ${t}$. Enter a number rounded to the nearest cent.`, answer: money(I), accept: moneyAccepts(money(I)), hint: `$${P} \\times ${r} \\times ${t}$.` },
      { instruction: `Add the interest to the principal: $A = P + I$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)), hint: `$${P} + ${money(I)}$.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `Interest is $Prt = ${P}(${r})(${t}) = \\$${money(I)}$, so the total owed is $P + I = \\$${money(A)}$.`,
  };
};
fill["fm1-simple-interest-3"] = (rng, idx) => {
  // Solve for the rate: given P, t, and interest I, find r (percent).
  const P = rng.int(8, 40) * 100;
  const rp = rng.int(3, 9);
  const t = rng.int(2, 5);
  const r = rp / 100;
  const I = round2(P * r * t);
  return {
    id: `gen.fm1-simple-interest-3.${idx}`, generated: true, concepts: ["simple-interest"], difficulty: 3, context: "applied",
    prompt: `A \\$${P} deposit earned \\$${money(I)} in **simple interest** over ${t} years. What **annual rate** was paid? Solve $I = Prt$ for $r$. Enter the rate as a percent rounded to 2 decimals (e.g. 6.17).`,
    steps: [
      { instruction: `Rearrange to $r = \\dfrac{I}{Pt}$ and compute the decimal rate: $\\dfrac{${money(I)}}{${P} \\cdot ${t}}$. Enter as a decimal (e.g. 0.05).`, answer: `${r}`, accept: [], hint: `Divide the interest by (principal times time).` },
      { instruction: `Convert that decimal to a percent. Enter as a percent rounded to 2 decimals.`, answer: pct(rp), accept: [`${rp}`, `${rp}.0`, `${rp}.00`], hint: `Multiply the decimal by 100.` },
    ],
    finalAnswer: { value: pct(rp), unit: "percent" },
    solutionNarrative: `Solving $I = Prt$ for the rate: $r = \\dfrac{I}{Pt} = \\dfrac{${money(I)}}{${P}\\cdot ${t}} = ${r}$, i.e. ${pct(rp)}% per year.`,
  };
};

// --- compound-interest  A = P(1 + r/n)^(nt) ---
fill["fm1-compound-interest-1"] = (rng, idx) => {
  const P = rng.int(5, 40) * 100;
  const rp = rng.int(3, 8);
  const t = rng.int(2, 6);
  const r = rp / 100;
  const factor = 1 + r; // annual, n=1
  const A = round2(P * Math.pow(factor, t));
  return {
    id: `gen.fm1-compound-interest-1.${idx}`, generated: true, concepts: ["compound-interest"], difficulty: 1, context: "applied",
    prompt: `You invest \\$${P} at **${rp}% annual interest, compounded annually** ($n = 1$), for ${t} years. Use $A = P(1 + r/n)^{nt}$. Enter the final amount as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the annual growth factor $1 + r/n = 1 + ${r}/1$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Add the decimal rate to 1.` },
      { instruction: `Compute $A = ${P} \\cdot ${factor}^{${t}}$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)), hint: `Raise ${factor} to the power ${t}, then multiply by ${P}.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `$A = ${P}(${factor})^{${t}} = \\$${money(A)}$. Each year's interest is added to the balance, so the next year's interest is computed on the larger amount.`,
  };
};
fill["fm1-compound-interest-2"] = (rng, idx) => {
  const P = rng.int(10, 40) * 100;
  const rp = rng.pick([3, 6, 9, 12]); // divisible by 12 for clean monthly rate
  const t = rng.int(2, 5);
  const r = rp / 100;
  const n = 12;
  const factor = 1 + r / n;
  const nt = n * t;
  const A = round2(P * Math.pow(factor, nt));
  return {
    id: `gen.fm1-compound-interest-2.${idx}`, generated: true, concepts: ["compound-interest"], difficulty: 2, context: "applied",
    prompt: `You invest \\$${P} at **${rp}% annual interest, compounded monthly** ($n = 12$), for ${t} years. Use $A = P(1 + r/n)^{nt}$. Enter the final amount as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly factor $1 + r/n = 1 + ${r}/12$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Divide the annual rate ${r} by 12, then add 1.` },
      { instruction: `Find the exponent $nt = 12 \\times ${t}$. Enter a whole number.`, answer: `${nt}`, accept: [], hint: `Compoundings per year times years.` },
      { instruction: `Compute $A = ${P} \\cdot ${factor}^{${nt}}$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)), hint: `Raise the monthly factor to the ${nt} power, then multiply by ${P}.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `The monthly factor is $1 + ${r}/12 = ${factor}$ over $nt = ${nt}$ months: $A = ${P}(${factor})^{${nt}} = \\$${money(A)}$. Watch the rate-per-period vs. annual rate distinction — you divide by 12.`,
  };
};
fill["fm1-compound-interest-3"] = (rng, idx) => {
  const P = rng.int(10, 40) * 100;
  const rp = rng.pick([4, 8, 12]); // divisible by 4 for clean quarterly rate
  const t = rng.int(3, 6);
  const r = rp / 100;
  const n = 4;
  const factor = 1 + r / n;
  const nt = n * t;
  const A = round2(P * Math.pow(factor, nt));
  const I = round2(A - P);
  return {
    id: `gen.fm1-compound-interest-3.${idx}`, generated: true, concepts: ["compound-interest"], difficulty: 3, context: "applied",
    prompt: `You invest \\$${P} at **${rp}% annual interest, compounded quarterly** ($n = 4$), for ${t} years. Find the final amount **and** the interest earned. Use $A = P(1 + r/n)^{nt}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the quarterly factor $1 + ${r}/4$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Divide ${r} by 4, add 1.` },
      { instruction: `Find the exponent $nt = 4 \\times ${t}$. Enter a whole number.`, answer: `${nt}`, accept: [], hint: `Quarters in ${t} years.` },
      { instruction: `Compute $A = ${P} \\cdot ${factor}^{${nt}}$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)), hint: `Raise the factor to the ${nt} power, then multiply by ${P}.` },
      { instruction: `Find the interest earned, $A - P$. Enter a number rounded to the nearest cent.`, answer: money(I), accept: moneyAccepts(money(I)), hint: `$${money(A)} - ${P}$.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `$A = ${P}(${factor})^{${nt}} = \\$${money(A)}$, so the interest is $A - P = \\$${money(I)}$.`,
  };
};

// --- compounding-frequency-and-ear  EAR = (1 + r/n)^n - 1 ---
fill["fm1-compounding-ear-1"] = (rng, idx) => {
  const rp = rng.pick([6, 12]); // clean monthly
  const r = rp / 100;
  const n = 12;
  const ear = Math.pow(1 + r / n, n) - 1;
  const earPct = pct(ear * 100);
  return {
    id: `gen.fm1-compounding-ear-1.${idx}`, generated: true, concepts: ["compounding-frequency-and-ear"], difficulty: 1, context: "applied",
    prompt: `A savings account advertises a **${rp}% nominal annual rate, compounded monthly**. Find its **effective annual rate (EAR)** using $\\text{EAR} = (1 + r/n)^n - 1$. Enter as a percent rounded to 2 decimals (e.g. 6.17).`,
    steps: [
      { instruction: `Find the monthly factor $1 + r/n = 1 + ${r}/12$. Enter as a decimal.`, answer: `${1 + r / n}`, accept: [], hint: `Divide ${r} by 12, add 1.` },
      { instruction: `Compute $(1 + ${r}/12)^{12} - 1$, then convert to a percent. Enter as a percent rounded to 2 decimals.`, answer: earPct, accept: [`${(1 + r / n)}^12 - 1`], hint: `Raise the monthly factor to the 12th power, subtract 1, multiply by 100.` },
    ],
    finalAnswer: { value: earPct, unit: "percent" },
    solutionNarrative: `$\\text{EAR} = (1 + ${r}/12)^{12} - 1 \\approx ${(ear).toFixed(6)}$, i.e. ${earPct}% — slightly above the ${rp}% nominal rate because interest compounds monthly.`,
  };
};
fill["fm1-compounding-ear-2"] = (rng, idx) => {
  const rp = rng.pick([4, 8, 12]); // clean quarterly
  const r = rp / 100;
  const n = 4;
  const ear = Math.pow(1 + r / n, n) - 1;
  const earPct = pct(ear * 100);
  return {
    id: `gen.fm1-compounding-ear-2.${idx}`, generated: true, concepts: ["compounding-frequency-and-ear"], difficulty: 2, context: "applied",
    prompt: `A card charges a **${rp}% nominal annual rate, compounded quarterly** ($n = 4$). Find the **effective annual rate** with $\\text{EAR} = (1 + r/n)^n - 1$. Enter as a percent rounded to 2 decimals (e.g. 6.17).`,
    steps: [
      { instruction: `Find the quarterly factor $1 + ${r}/4$. Enter as a decimal.`, answer: `${1 + r / n}`, accept: [], hint: `Divide ${r} by 4, add 1.` },
      { instruction: `Compute $(1 + ${r}/4)^{4} - 1$ and convert to a percent. Enter as a percent rounded to 2 decimals.`, answer: earPct, accept: [`${(1 + r / n)}^4 - 1`], hint: `Fourth power of the quarterly factor, minus 1, times 100.` },
    ],
    finalAnswer: { value: earPct, unit: "percent" },
    solutionNarrative: `$\\text{EAR} = (1 + ${r}/4)^{4} - 1 \\approx ${(ear).toFixed(6)} = ${earPct}\\%$. Quarterly compounding lifts the effective rate above the ${rp}% nominal figure.`,
  };
};
fill["fm1-compounding-ear-3"] = (rng, idx) => {
  // Compare two frequencies of the same nominal rate; which EAR is higher (menu) + numeric.
  const rp = rng.pick([6, 12]);
  const r = rp / 100;
  const earM = Math.pow(1 + r / 12, 12) - 1;   // monthly
  const earD = Math.pow(1 + r / 365, 365) - 1; // daily
  const earMPct = pct(earM * 100);
  const earDPct = pct(earD * 100);
  return {
    id: `gen.fm1-compounding-ear-3.${idx}`, generated: true, concepts: ["compounding-frequency-and-ear"], difficulty: 3, context: "applied",
    prompt: `Two banks both quote a **${rp}% nominal annual rate**, but Bank M compounds **monthly** and Bank D compounds **daily** ($n = 365$). Compute each effective annual rate and decide which is higher. Enter percents rounded to 2 decimals (e.g. 6.17).`,
    steps: [
      { instruction: `Bank M: compute $(1 + ${r}/12)^{12} - 1$ as a percent. Enter as a percent rounded to 2 decimals.`, answer: earMPct, accept: [], hint: `Monthly: 12th power of $1 + ${r}/12$.` },
      { instruction: `Bank D: compute $(1 + ${r}/365)^{365} - 1$ as a percent. Enter as a percent rounded to 2 decimals.`, answer: earDPct, accept: [], hint: `Daily: 365th power of $1 + ${r}/365$.` },
      { instruction: `Which bank's effective rate is higher — the one compounding more often or less often? Answer 'more often' or 'less often'.`, answer: "more often", accept: ["more", "daily", "more frequently", "greater frequency"], hint: `More frequent compounding always gives a (slightly) higher effective rate.` },
    ],
    finalAnswer: { value: earDPct, unit: "percent" },
    solutionNarrative: `Monthly EAR is ${earMPct}% and daily EAR is ${earDPct}%. More frequent compounding wins — daily edges out monthly, though the gap shrinks as $n$ grows toward the continuous limit.`,
  };
};

// --- continuous-compounding  A = P e^(rt) ---
fill["fm1-continuous-1"] = (rng, idx) => {
  const P = rng.int(5, 40) * 100;
  const rp = rng.int(3, 8);
  const t = rng.int(2, 6);
  const r = rp / 100;
  const A = round2(P * Math.exp(r * t));
  const exponent = round2(r * t); // rt
  return {
    id: `gen.fm1-continuous-1.${idx}`, generated: true, concepts: ["continuous-compounding"], difficulty: 1, context: "applied",
    prompt: `You invest \\$${P} at **${rp}% annual interest, compounded continuously**, for ${t} years. Use $A = Pe^{rt}$. Enter the final amount as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the exponent $rt = ${r} \\times ${t}$. Enter as a decimal.`, answer: `${exponent}`, accept: [], hint: `Multiply the decimal rate by the years.` },
      { instruction: `Compute $A = ${P} \\cdot e^{${exponent}}$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)).concat([`${P}*e^${exponent}`, `${P}*e^(${exponent})`]), hint: `Use $e \\approx 2.71828$: raise $e$ to the ${exponent} power, then multiply by ${P}.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `$A = ${P}e^{${r}\\cdot ${t}} = ${P}e^{${exponent}} = \\$${money(A)}$ — the ceiling that ordinary compounding approaches as it compounds ever more often.`,
  };
};
fill["fm1-continuous-2"] = (rng, idx) => {
  const P = rng.int(10, 40) * 100;
  const rp = rng.int(4, 9);
  const t = rng.int(3, 7);
  const r = rp / 100;
  const A = round2(P * Math.exp(r * t));
  const I = round2(A - P);
  const exponent = round2(r * t);
  return {
    id: `gen.fm1-continuous-2.${idx}`, generated: true, concepts: ["continuous-compounding"], difficulty: 2, context: "applied",
    prompt: `\\$${P} grows at **${rp}% compounded continuously** for ${t} years. Find the final amount **and** the interest earned. Use $A = Pe^{rt}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the exponent $rt = ${r} \\times ${t}$. Enter as a decimal.`, answer: `${exponent}`, accept: [], hint: `Rate times time.` },
      { instruction: `Compute $A = ${P} \\cdot e^{${exponent}}$. Enter a number rounded to the nearest cent.`, answer: money(A), accept: moneyAccepts(money(A)).concat([`${P}*e^(${exponent})`]), hint: `Raise $e$ to ${exponent}, then multiply by ${P}.` },
      { instruction: `Find the interest, $A - P$. Enter a number rounded to the nearest cent.`, answer: money(I), accept: moneyAccepts(money(I)), hint: `$${money(A)} - ${P}$.` },
    ],
    finalAnswer: { value: money(A), unit: "dollars" },
    solutionNarrative: `$A = ${P}e^{${exponent}} = \\$${money(A)}$, so the interest is $A - P = \\$${money(I)}$.`,
  };
};
fill["fm1-continuous-3"] = (rng, idx) => {
  // Compare continuous vs annual for same P, r, t: difference in dollars.
  const P = rng.int(10, 40) * 100;
  const rp = rng.int(4, 9);
  const t = rng.int(3, 6);
  const r = rp / 100;
  const Acont = round2(P * Math.exp(r * t));
  const Aann = round2(P * Math.pow(1 + r, t));
  const diff = round2(Acont - Aann);
  const exponent = round2(r * t);
  return {
    id: `gen.fm1-continuous-3.${idx}`, generated: true, concepts: ["continuous-compounding"], difficulty: 3, context: "applied",
    prompt: `\\$${P} is offered at **${rp}% for ${t} years** either **compounded annually** or **compounded continuously**. Find each ending balance and the difference. Use $A = P(1+r)^t$ and $A = Pe^{rt}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Annual: compute $A = ${P} \\cdot ${1 + r}^{${t}}$. Enter a number rounded to the nearest cent.`, answer: money(Aann), accept: moneyAccepts(money(Aann)), hint: `Raise $1 + ${r} = ${1 + r}$ to the ${t} power, times ${P}.` },
      { instruction: `Continuous: compute $A = ${P} \\cdot e^{${exponent}}$. Enter a number rounded to the nearest cent.`, answer: money(Acont), accept: moneyAccepts(money(Acont)).concat([`${P}*e^(${exponent})`]), hint: `Raise $e$ to $rt = ${exponent}$, times ${P}.` },
      { instruction: `Find how much MORE continuous compounding earns (continuous minus annual). Enter a number rounded to the nearest cent.`, answer: money(diff), accept: moneyAccepts(money(diff)), hint: `$${money(Acont)} - ${money(Aann)}$.` },
    ],
    finalAnswer: { value: money(diff), unit: "dollars" },
    solutionNarrative: `Annual gives $${money(Aann)}$ and continuous gives $${money(Acont)}$, a difference of $\\$${money(diff)}$ — the extra squeezed out by compounding infinitely often.`,
  };
};

// ===========================================================================
// TOPIC 2: financial-mathematics.present-and-future-value
//   concepts: future-value, present-value,
//             solving-for-rate-or-time, comparing-cash-flows
// ===========================================================================

// --- future-value  FV = PV(1 + i)^n ---
fill["fm1-future-value-1"] = (rng, idx) => {
  const PV = rng.int(5, 40) * 100;
  const ip = rng.int(3, 8);
  const n = rng.int(2, 6);
  const i = ip / 100;
  const factor = 1 + i;
  const FV = round2(PV * Math.pow(factor, n));
  return {
    id: `gen.fm1-future-value-1.${idx}`, generated: true, concepts: ["future-value"], difficulty: 1, context: "applied",
    prompt: `A single sum of \\$${PV} grows at **${ip}% per year** for ${n} years. Find its **future value** with $FV = PV(1 + i)^n$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the growth factor $1 + i = 1 + ${i}$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Add the decimal rate to 1.` },
      { instruction: `Compute $FV = ${PV} \\cdot ${factor}^{${n}}$. Enter a number rounded to the nearest cent.`, answer: money(FV), accept: moneyAccepts(money(FV)), hint: `Raise ${factor} to the ${n} power, then multiply by ${PV}.` },
    ],
    finalAnswer: { value: money(FV), unit: "dollars" },
    solutionNarrative: `$FV = ${PV}(${factor})^{${n}} = \\$${money(FV)}$ — the same single sum carried forward ${n} years at ${ip}%.`,
  };
};
fill["fm1-future-value-2"] = (rng, idx) => {
  const PV = rng.int(10, 40) * 100;
  const ip = rng.pick([3, 6, 12]);
  const n = rng.int(2, 4);
  const i = ip / 100;
  const per = i / 12;
  const factor = 1 + per;
  const months = 12 * n;
  const FV = round2(PV * Math.pow(factor, months));
  return {
    id: `gen.fm1-future-value-2.${idx}`, generated: true, concepts: ["future-value"], difficulty: 2, context: "applied",
    prompt: `\\$${PV} is invested at **${ip}% per year, compounded monthly**, for ${n} years. Find its future value. The per-period rate is $i = ${ip}\\%/12$ and the number of periods is $n = 12 \\times ${n}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate factor $1 + ${i}/12$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Divide ${i} by 12, add 1.` },
      { instruction: `Find the number of periods $n = 12 \\times ${n}$. Enter a whole number.`, answer: `${months}`, accept: [], hint: `Months in ${n} years.` },
      { instruction: `Compute $FV = ${PV} \\cdot ${factor}^{${months}}$. Enter a number rounded to the nearest cent.`, answer: money(FV), accept: moneyAccepts(money(FV)), hint: `Raise the monthly factor to ${months}, times ${PV}.` },
    ],
    finalAnswer: { value: money(FV), unit: "dollars" },
    solutionNarrative: `Per-period rate $${per}$ over $${months}$ months: $FV = ${PV}(${factor})^{${months}} = \\$${money(FV)}$. Always convert the annual rate to a per-period rate first.`,
  };
};
fill["fm1-future-value-3"] = (rng, idx) => {
  const PV = rng.int(10, 40) * 100;
  const ip = rng.int(4, 9);
  const n1 = rng.int(3, 5), n2 = n1 + rng.int(3, 6);
  const i = ip / 100;
  const factor = 1 + i;
  const FV1 = round2(PV * Math.pow(factor, n1));
  const FV2 = round2(PV * Math.pow(factor, n2));
  const extra = round2(FV2 - FV1);
  return {
    id: `gen.fm1-future-value-3.${idx}`, generated: true, concepts: ["future-value"], difficulty: 3, context: "applied",
    prompt: `\\$${PV} grows at **${ip}% per year**. Compare leaving it invested ${n1} years versus ${n2} years, and find how much MORE the longer horizon yields. Use $FV = PV(1 + i)^n$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the ${n1}-year value $FV = ${PV} \\cdot ${factor}^{${n1}}$. Enter a number rounded to the nearest cent.`, answer: money(FV1), accept: moneyAccepts(money(FV1)), hint: `${factor} to the ${n1} power, times ${PV}.` },
      { instruction: `Compute the ${n2}-year value $FV = ${PV} \\cdot ${factor}^{${n2}}$. Enter a number rounded to the nearest cent.`, answer: money(FV2), accept: moneyAccepts(money(FV2)), hint: `${factor} to the ${n2} power, times ${PV}.` },
      { instruction: `Find the extra earned by waiting (longer minus shorter). Enter a number rounded to the nearest cent.`, answer: money(extra), accept: moneyAccepts(money(extra)), hint: `$${money(FV2)} - ${money(FV1)}$.` },
    ],
    finalAnswer: { value: money(extra), unit: "dollars" },
    solutionNarrative: `After ${n1} years: $${money(FV1)}$; after ${n2} years: $${money(FV2)}$. The extra ${n2 - n1} years add $\\$${money(extra)}$ — time is the biggest lever in compounding.`,
  };
};

// --- present-value  PV = FV/(1 + i)^n ---
fill["fm1-present-value-1"] = (rng, idx) => {
  const ip = rng.int(3, 8);
  const n = rng.int(2, 6);
  const i = ip / 100;
  const factor = 1 + i;
  const PV = rng.int(8, 40) * 100;
  const FV = round2(PV * Math.pow(factor, n)); // build FV from a round PV so answer is clean-ish
  const PVcalc = round2(FV / Math.pow(factor, n));
  return {
    id: `gen.fm1-present-value-1.${idx}`, generated: true, concepts: ["present-value"], difficulty: 1, context: "applied",
    prompt: `You are promised \\$${money(FV)} in ${n} years. If money is worth **${ip}% per year**, what is that promise worth **today**? Use $PV = \\dfrac{FV}{(1 + i)^n}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the discount factor $(1 + i)^n = ${factor}^{${n}}$. Enter as a decimal (round to 6 places).`, answer: `${Math.pow(factor, n).toFixed(6)}`, accept: [`${factor}^${n}`, `${factor}^(${n})`], hint: `Raise ${factor} to the ${n} power.` },
      { instruction: `Divide the future value by that factor: $PV = ${money(FV)} / ${factor}^{${n}}$. Enter a number rounded to the nearest cent.`, answer: money(PVcalc), accept: moneyAccepts(money(PVcalc)), hint: `Discounting divides; it undoes the growth.` },
    ],
    finalAnswer: { value: money(PVcalc), unit: "dollars" },
    solutionNarrative: `$PV = \\dfrac{${money(FV)}}{(${factor})^{${n}}} = \\$${money(PVcalc)}$ — the amount that, invested today at ${ip}%, grows to $${money(FV)}$ in ${n} years.`,
  };
};
fill["fm1-present-value-2"] = (rng, idx) => {
  const ip = rng.int(4, 9);
  const n = rng.int(3, 7);
  const i = ip / 100;
  const factor = 1 + i;
  const FV = rng.int(50, 200) * 100; // a round target like $8000
  const PV = round2(FV / Math.pow(factor, n));
  return {
    id: `gen.fm1-present-value-2.${idx}`, generated: true, concepts: ["present-value"], difficulty: 2, context: "applied",
    prompt: `How much must you deposit **today** at **${ip}% per year** to have \\$${FV} in ${n} years? This is the present value $PV = \\dfrac{FV}{(1 + i)^n}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the growth factor $1 + i$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Add ${i} to 1.` },
      { instruction: `Compute $PV = ${FV} / ${factor}^{${n}}$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(money(PV)), hint: `Divide ${FV} by ${factor} raised to the ${n} power.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$PV = \\dfrac{${FV}}{(${factor})^{${n}}} = \\$${money(PV)}$. A dollar in the future is worth less than a dollar today, and discounting measures exactly how much less.`,
  };
};
fill["fm1-present-value-3"] = (rng, idx) => {
  // PV with monthly discounting.
  const ip = rng.pick([6, 12]);
  const n = rng.int(2, 4);
  const i = ip / 100;
  const per = i / 12;
  const factor = 1 + per;
  const months = 12 * n;
  const FV = rng.int(50, 200) * 100;
  const PV = round2(FV / Math.pow(factor, months));
  return {
    id: `gen.fm1-present-value-3.${idx}`, generated: true, concepts: ["present-value"], difficulty: 3, context: "applied",
    prompt: `You need \\$${FV} in ${n} years. Money earns **${ip}% per year compounded monthly**. What single deposit **today** funds it? Discount with the per-period rate $i = ${ip}\\%/12$ over $${months}$ months. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly factor $1 + ${i}/12$. Enter as a decimal.`, answer: `${factor}`, accept: [], hint: `Divide ${i} by 12, add 1.` },
      { instruction: `Find the number of periods $n = 12 \\times ${n}$. Enter a whole number.`, answer: `${months}`, accept: [], hint: `Months in ${n} years.` },
      { instruction: `Compute $PV = ${FV} / ${factor}^{${months}}$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(money(PV)), hint: `Divide ${FV} by the monthly factor raised to ${months}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `Discounting monthly: $PV = \\dfrac{${FV}}{(${factor})^{${months}}} = \\$${money(PV)}$. More frequent compounding means a slightly smaller deposit funds the same goal.`,
  };
};

// --- solving-for-rate-or-time ---
fill["fm1-solve-rate-time-1"] = (rng, idx) => {
  // Solve for rate: FV = PV(1+i)^n, given all but i, find i as percent.
  const PV = rng.int(10, 40) * 100;
  const ip = rng.int(3, 9);
  const n = rng.int(2, 5);
  const i = ip / 100;
  const FV = round2(PV * Math.pow(1 + i, n));
  const ratio = round2(FV / PV);
  return {
    id: `gen.fm1-solve-rate-time-1.${idx}`, generated: true, concepts: ["solving-for-rate-or-time"], difficulty: 1, context: "applied",
    prompt: `\\$${PV} grew to \\$${money(FV)} in ${n} years with annual compounding. Find the **annual rate**. Solve $FV = PV(1+i)^n$ for $i$: $i = (FV/PV)^{1/n} - 1$. Enter the rate as a percent rounded to 2 decimals (e.g. 6.17).`,
    steps: [
      { instruction: `Find the ratio $FV/PV = ${money(FV)}/${PV}$. Enter as a decimal (round to 6 places).`, answer: `${ratio}`, accept: [`${money(FV)}/${PV}`], hint: `Divide the future value by the present value.` },
      { instruction: `Take the $n$th root and subtract 1: $i = (FV/PV)^{1/${n}} - 1$, then convert to a percent. Enter as a percent rounded to 2 decimals.`, answer: pct(ip), accept: [`${ip}`, `${ip}.0`, `${ip}.00`], hint: `A $1/${n}$ power is the ${n}th root; subtract 1 and multiply by 100.` },
    ],
    finalAnswer: { value: pct(ip), unit: "percent" },
    solutionNarrative: `$i = (${money(FV)}/${PV})^{1/${n}} - 1 = ${i}$, i.e. ${pct(ip)}% per year — the rate is recovered from the growth multiple.`,
  };
};
fill["fm1-solve-rate-time-2"] = (rng, idx) => {
  // Solve for time via logs: n = ln(FV/PV) / ln(1+i). Choose values giving whole-ish n.
  const PV = rng.int(10, 40) * 100;
  const ip = rng.int(4, 9);
  const n = rng.int(3, 8);
  const i = ip / 100;
  const FV = round2(PV * Math.pow(1 + i, n));
  const ratio = round2(FV / PV);
  const nCalc = Math.log(FV / PV) / Math.log(1 + i);
  const nStr = nCalc.toFixed(2);
  return {
    id: `gen.fm1-solve-rate-time-2.${idx}`, generated: true, concepts: ["solving-for-rate-or-time"], difficulty: 2, context: "applied",
    prompt: `At **${ip}% per year**, how long until \\$${PV} grows to \\$${money(FV)}? Solve $FV = PV(1+i)^n$ for $n$ using logs: $n = \\dfrac{\\ln(FV/PV)}{\\ln(1+i)}$. Enter the number of years rounded to 2 decimals.`,
    steps: [
      { instruction: `Find the growth multiple $FV/PV = ${money(FV)}/${PV}$. Enter as a decimal (round to 4 places).`, answer: `${ratio}`, accept: [`${money(FV)}/${PV}`], hint: `Divide the target by the start.` },
      { instruction: `Compute $n = \\ln(${ratio}) / \\ln(${1 + i})$ (use a calculator's ln). Enter the number of years rounded to 2 decimals.`, answer: nStr, accept: [`${n}`, `${n}.0`, `${n}.00`], hint: `Take natural logs of the ratio and of $1 + i = ${1 + i}$, then divide.` },
    ],
    finalAnswer: { value: nStr, unit: "years" },
    solutionNarrative: `$n = \\dfrac{\\ln(${ratio})}{\\ln(${1 + i})} = ${nStr}$ years. Logs are the tool for pulling an unknown exponent down out of the compounding formula.`,
  };
};
fill["fm1-solve-rate-time-3"] = (rng, idx) => {
  // Doubling time (rule-of-72 style) via logs: n = ln 2 / ln(1+i).
  const ip = rng.int(3, 9);
  const i = ip / 100;
  const nCalc = Math.log(2) / Math.log(1 + i);
  const nStr = nCalc.toFixed(2);
  const rule72 = round2(72 / ip);
  return {
    id: `gen.fm1-solve-rate-time-3.${idx}`, generated: true, concepts: ["solving-for-rate-or-time"], difficulty: 3, context: "applied",
    prompt: `At **${ip}% per year**, how long does it take an investment to **double**? Solve $2 = (1+i)^n$ for $n$ using logs: $n = \\dfrac{\\ln 2}{\\ln(1+i)}$. Then compare with the Rule of 72 estimate $72/${ip}$. Enter values rounded to 2 decimals.`,
    steps: [
      { instruction: `Compute the exact doubling time $n = \\ln 2 / \\ln(${1 + i})$. Enter the number of years rounded to 2 decimals.`, answer: nStr, accept: [], hint: `$\\ln 2 \\approx 0.6931$; divide by $\\ln(${1 + i})$.` },
      { instruction: `Compute the Rule of 72 estimate $72 / ${ip}$. Enter a number rounded to 2 decimals.`, answer: `${rule72}`, accept: [`72/${ip}`], hint: `Just divide 72 by the percent rate.` },
    ],
    finalAnswer: { value: nStr, unit: "years" },
    solutionNarrative: `Exactly, $n = \\dfrac{\\ln 2}{\\ln(${1 + i})} = ${nStr}$ years; the Rule of 72 estimates $72/${ip} = ${rule72}$ — a quick mental check that stays close for ordinary rates.`,
  };
};

// --- comparing-cash-flows (menu + numeric) ---
fill["fm1-compare-cashflows-1"] = (rng, idx) => {
  // Offer A: cash now. Offer B: more cash in n years. Discount B to today.
  const ip = rng.int(4, 9);
  const i = ip / 100;
  const n = rng.int(2, 5);
  const now = rng.int(20, 40) * 100;                 // e.g. $3000 today
  const futMultiplier = 1 + rng.int(15, 40) / 100;   // 1.15..1.40
  const later = round2(now * futMultiplier);         // nominal larger future amount
  const pvLater = round2(later / Math.pow(1 + i, n));
  const better = pvLater > now ? "Offer B" : "Offer A";
  return {
    id: `gen.fm1-compare-cashflows-1.${idx}`, generated: true, concepts: ["comparing-cash-flows"], difficulty: 1, context: "applied",
    prompt: `Offer A pays \\$${now} **today**. Offer B pays \\$${money(later)} in ${n} years. Money is worth **${ip}% per year**. Which is worth more **today**? Discount Offer B to the present with $PV = FV/(1+i)^n$. Enter money as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the present value of Offer B: $PV = ${money(later)} / ${1 + i}^{${n}}$. Enter a number rounded to the nearest cent.`, answer: money(pvLater), accept: moneyAccepts(money(pvLater)), hint: `Divide by $(1 + ${i})^{${n}}$.` },
      { instruction: `Compare Offer A's \\$${now} today with Offer B's present value. Which offer is worth more today? Answer 'Offer A' or 'Offer B'.`, answer: better, accept: better === "Offer A" ? ["A", "offer a", "the first offer"] : ["B", "offer b", "the second offer"], hint: `The larger present value wins.` },
    ],
    finalAnswer: { value: better, unit: "" },
    solutionNarrative: `Offer B's present value is $${money(pvLater)}$ versus Offer A's flat $${now}$, so ${better} is the better deal today. Never compare cash at different times without discounting first.`,
  };
};
fill["fm1-compare-cashflows-2"] = (rng, idx) => {
  // Compare two future lump sums, both discounted to today.
  const ip = rng.int(4, 8);
  const i = ip / 100;
  const nA = rng.int(2, 3), nB = rng.int(4, 6);
  const amtA = rng.int(30, 50) * 100;
  const amtB = round2(amtA * (1 + rng.int(20, 45) / 100));
  const pvA = round2(amtA / Math.pow(1 + i, nA));
  const pvB = round2(amtB / Math.pow(1 + i, nB));
  const better = pvA > pvB ? "Offer A" : "Offer B";
  return {
    id: `gen.fm1-compare-cashflows-2.${idx}`, generated: true, concepts: ["comparing-cash-flows"], difficulty: 2, context: "applied",
    prompt: `Offer A pays \\$${amtA} in ${nA} years; Offer B pays \\$${money(amtB)} in ${nB} years. At **${ip}% per year**, which is worth more **today**? Discount each with $PV = FV/(1+i)^n$. Enter money as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Present value of Offer A: $${amtA} / ${1 + i}^{${nA}}$. Enter a number rounded to the nearest cent.`, answer: money(pvA), accept: moneyAccepts(money(pvA)), hint: `Discount ${nA} years.` },
      { instruction: `Present value of Offer B: $${money(amtB)} / ${1 + i}^{${nB}}$. Enter a number rounded to the nearest cent.`, answer: money(pvB), accept: moneyAccepts(money(pvB)), hint: `Discount ${nB} years.` },
      { instruction: `Which present value is larger? Answer 'Offer A' or 'Offer B'.`, answer: better, accept: better === "Offer A" ? ["A", "offer a"] : ["B", "offer b"], hint: `Bigger present value wins.` },
    ],
    finalAnswer: { value: better, unit: "" },
    solutionNarrative: `Offer A is worth $${money(pvA)}$ today and Offer B $${money(pvB)}$, so ${better} wins. A bigger nominal amount far in the future can still lose to a smaller amount sooner.`,
  };
};
fill["fm1-compare-cashflows-3"] = (rng, idx) => {
  // Lump sum now vs two future payments; sum the PVs of the future stream.
  const ip = rng.int(4, 8);
  const i = ip / 100;
  const now = rng.int(40, 70) * 100;
  const p1 = rng.int(20, 35) * 100, n1 = rng.int(1, 2);
  const p2 = rng.int(20, 35) * 100, n2 = rng.int(3, 4);
  const pv1 = round2(p1 / Math.pow(1 + i, n1));
  const pv2 = round2(p2 / Math.pow(1 + i, n2));
  const totalPV = round2(pv1 + pv2);
  const better = totalPV > now ? "the installment plan" : "the lump sum";
  return {
    id: `gen.fm1-compare-cashflows-3.${idx}`, generated: true, concepts: ["comparing-cash-flows"], difficulty: 3, context: "applied",
    prompt: `You can take a **lump sum of \\$${now} today**, or an **installment plan** of \\$${p1} in ${n1} year(s) and \\$${p2} in ${n2} years. At **${ip}% per year**, which is worth more today? Discount each installment and add. Enter money as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Present value of the first installment: $${p1} / ${1 + i}^{${n1}}$. Enter a number rounded to the nearest cent.`, answer: money(pv1), accept: moneyAccepts(money(pv1)), hint: `Discount \\$${p1} back ${n1} year(s).` },
      { instruction: `Present value of the second installment: $${p2} / ${1 + i}^{${n2}}$. Enter a number rounded to the nearest cent.`, answer: money(pv2), accept: moneyAccepts(money(pv2)), hint: `Discount \\$${p2} back ${n2} years.` },
      { instruction: `Add the two present values for the plan's total worth today. Enter a number rounded to the nearest cent.`, answer: money(totalPV), accept: moneyAccepts(money(totalPV)), hint: `$${money(pv1)} + ${money(pv2)}$.` },
      { instruction: `Which is worth more today? Answer 'the lump sum' or 'the installment plan'.`, answer: better, accept: better === "the lump sum" ? ["lump sum", "lump", "the lump-sum"] : ["installment plan", "installments", "the plan"], hint: `Compare the total present value with the lump sum.` },
    ],
    finalAnswer: { value: better, unit: "" },
    solutionNarrative: `The installments are worth $${money(pv1)} + ${money(pv2)} = ${money(totalPV)}$ today, versus the lump sum of $${now}$, so ${better} wins. A cash-flow stream is compared by summing the present value of each piece.`,
  };
};

// ===========================================================================
// TOPIC 3: financial-mathematics.annuities
//   concepts: fv-ordinary-annuity, pv-ordinary-annuity,
//             annuity-due, sinking-funds-and-savings
// ===========================================================================
// Guard: the per-period rate i is ALWAYS > 0 here, so the [((1+i)^n - 1)/i]
// and [(1 - (1+i)^-n)/i] factors never divide by zero.

// --- fv-ordinary-annuity  FV = PMT * [((1+i)^n - 1)/i] ---
fill["fm1-fv-ordinary-1"] = (rng, idx) => {
  const PMT = rng.int(1, 10) * 100;   // 100..1000
  const ip = rng.int(3, 8);
  const n = rng.int(3, 8);
  const i = ip / 100;
  const fvFactor = (Math.pow(1 + i, n) - 1) / i;
  const FV = round2(PMT * fvFactor);
  return {
    id: `gen.fm1-fv-ordinary-1.${idx}`, generated: true, concepts: ["fv-ordinary-annuity"], difficulty: 1, context: "applied",
    prompt: `You deposit \\$${PMT} at the **end of each year** into an account earning **${ip}% per year** for ${n} years. Find the **future value** with $FV = PMT \\cdot \\dfrac{(1+i)^n - 1}{i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Write the per-period rate $i$ as a decimal.`, answer: `${i}`, accept: [], hint: `${ip}% as a decimal.` },
      { instruction: `Compute the annuity factor $\\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter as a decimal (round to 6 places).`, answer: `${fvFactor.toFixed(6)}`, accept: [`((1+${i})^${n}-1)/${i}`], hint: `Raise $1 + ${i}$ to the ${n} power, subtract 1, divide by ${i}.` },
      { instruction: `Multiply by the payment: $FV = ${PMT} \\cdot (\\text{factor})$. Enter a number rounded to the nearest cent.`, answer: money(FV), accept: moneyAccepts(money(FV)), hint: `$${PMT}$ times the factor above.` },
    ],
    finalAnswer: { value: money(FV), unit: "dollars" },
    solutionNarrative: `$FV = ${PMT}\\cdot \\dfrac{(1+${i})^{${n}} - 1}{${i}} = \\$${money(FV)}$ — a geometric series of ${n} deposits, each growing until the end.`,
  };
};
fill["fm1-fv-ordinary-2"] = (rng, idx) => {
  const PMT = rng.int(1, 6) * 50;   // 50..300
  const ip = rng.pick([6, 12]);
  const n = rng.int(2, 4);
  const i = ip / 100 / 12;
  const periods = 12 * n;
  const fvFactor = (Math.pow(1 + i, periods) - 1) / i;
  const FV = round2(PMT * fvFactor);
  return {
    id: `gen.fm1-fv-ordinary-2.${idx}`, generated: true, concepts: ["fv-ordinary-annuity"], difficulty: 2, context: "applied",
    prompt: `You contribute \\$${PMT} at the **end of each month** to a fund earning **${ip}% per year, compounded monthly**, for ${n} years. Find the future value. Use per-period rate $i = ${ip}\\%/12$ and $n = 12 \\times ${n}$ periods in $FV = PMT \\cdot \\dfrac{(1+i)^n - 1}{i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate $i = ${ip / 100}/12$. Enter as a decimal (round to 6 places).`, answer: `${i.toFixed(6)}`, accept: [`${ip / 100}/12`], hint: `Divide the annual decimal rate by 12.` },
      { instruction: `Find the number of periods $n = 12 \\times ${n}$. Enter a whole number.`, answer: `${periods}`, accept: [], hint: `Months in ${n} years.` },
      { instruction: `Compute $FV = ${PMT} \\cdot \\dfrac{(1+${ip / 100}/12)^{${periods}} - 1}{${ip / 100}/12}$. Enter a number rounded to the nearest cent.`, answer: money(FV), accept: moneyAccepts(money(FV)), hint: `Build the annuity factor with the monthly rate, then multiply by ${PMT}.` },
    ],
    finalAnswer: { value: money(FV), unit: "dollars" },
    solutionNarrative: `With a monthly rate $${i.toFixed(6)}$ over $${periods}$ deposits, $FV = ${PMT}\\cdot \\dfrac{(1+i)^{${periods}} - 1}{i} = \\$${money(FV)}$.`,
  };
};
fill["fm1-fv-ordinary-3"] = (rng, idx) => {
  const PMT = rng.int(2, 12) * 100;
  const ip = rng.int(4, 9);
  const n = rng.int(10, 25);
  const i = ip / 100;
  const fvFactor = (Math.pow(1 + i, n) - 1) / i;
  const FV = round2(PMT * fvFactor);
  const contributed = PMT * n;
  const growth = round2(FV - contributed);
  return {
    id: `gen.fm1-fv-ordinary-3.${idx}`, generated: true, concepts: ["fv-ordinary-annuity"], difficulty: 3, context: "applied",
    prompt: `You save \\$${PMT} at the **end of each year** at **${ip}% per year** for ${n} years (a retirement contribution). Find the future value, then how much of it is **investment growth** (beyond what you contributed). Use $FV = PMT \\cdot \\dfrac{(1+i)^n - 1}{i}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the future value $FV = ${PMT} \\cdot \\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(FV), accept: moneyAccepts(money(FV)), hint: `Annuity factor times the payment.` },
      { instruction: `Find the total you contributed: $${PMT} \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(contributed), accept: moneyAccepts(money(contributed)), hint: `Payment times number of deposits.` },
      { instruction: `Subtract contributions from the future value to get the growth. Enter a number rounded to the nearest cent.`, answer: money(growth), accept: moneyAccepts(money(growth)), hint: `$${money(FV)} - ${money(contributed)}$.` },
    ],
    finalAnswer: { value: money(FV), unit: "dollars" },
    solutionNarrative: `$FV = \\$${money(FV)}$ on total contributions of $\\$${money(contributed)}$, so $\\$${money(growth)}$ is pure investment growth — the payoff of decades of compounding.`,
  };
};

// --- pv-ordinary-annuity  PV = PMT * [(1 - (1+i)^-n)/i] ---
fill["fm1-pv-ordinary-1"] = (rng, idx) => {
  const PMT = rng.int(2, 10) * 100;
  const ip = rng.int(3, 8);
  const n = rng.int(3, 8);
  const i = ip / 100;
  const pvFactor = (1 - Math.pow(1 + i, -n)) / i;
  const PV = round2(PMT * pvFactor);
  return {
    id: `gen.fm1-pv-ordinary-1.${idx}`, generated: true, concepts: ["pv-ordinary-annuity"], difficulty: 1, context: "applied",
    prompt: `An investment will pay you \\$${PMT} at the **end of each year** for ${n} years. At **${ip}% per year**, what is that income stream worth **today**? Use $PV = PMT \\cdot \\dfrac{1 - (1+i)^{-n}}{i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Write the per-period rate $i$ as a decimal.`, answer: `${i}`, accept: [], hint: `${ip}% as a decimal.` },
      { instruction: `Compute the present-value factor $\\dfrac{1 - (1+${i})^{-${n}}}{${i}}$. Enter as a decimal (round to 6 places).`, answer: `${pvFactor.toFixed(6)}`, accept: [`(1-(1+${i})^(-${n}))/${i}`], hint: `$(1+i)^{-n}$ is 1 divided by $(1+i)^n$.` },
      { instruction: `Multiply by the payment: $PV = ${PMT} \\cdot (\\text{factor})$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(money(PV)), hint: `$${PMT}$ times the factor.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$PV = ${PMT}\\cdot \\dfrac{1 - (1+${i})^{-${n}}}{${i}} = \\$${money(PV)}$ — the lump sum today equivalent to ${n} yearly payments of $${PMT}$.`,
  };
};
fill["fm1-pv-ordinary-2"] = (rng, idx) => {
  const PMT = rng.int(3, 12) * 100;
  const ip = rng.int(4, 9);
  const n = rng.int(5, 12);
  const i = ip / 100;
  const pvFactor = (1 - Math.pow(1 + i, -n)) / i;
  const PV = round2(PMT * pvFactor);
  return {
    id: `gen.fm1-pv-ordinary-2.${idx}`, generated: true, concepts: ["pv-ordinary-annuity"], difficulty: 2, context: "applied",
    prompt: `A lottery pays \\$${PMT} at the **end of each year** for ${n} years. Money is worth **${ip}% per year**. Find the **cash value today** (the present value of the payments). Use $PV = PMT \\cdot \\dfrac{1 - (1+i)^{-n}}{i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute $(1+${i})^{-${n}}$. Enter as a decimal (round to 6 places).`, answer: `${Math.pow(1 + i, -n).toFixed(6)}`, accept: [`(1+${i})^(-${n})`, `1/(1+${i})^${n}`], hint: `Reciprocal of $(1+${i})^{${n}}$.` },
      { instruction: `Compute $PV = ${PMT} \\cdot \\dfrac{1 - (1+${i})^{-${n}}}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(money(PV)), hint: `Subtract from 1, divide by ${i}, times ${PMT}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `The stream's present value is $PV = ${PMT}\\cdot \\dfrac{1 - (1+${i})^{-${n}}}{${i}} = \\$${money(PV)}$ — far below the $${PMT * n}$ nominal total, because later payments are discounted.`,
  };
};
fill["fm1-pv-ordinary-3"] = (rng, idx) => {
  // Nominal total vs present value: how much the time value "costs".
  const PMT = rng.int(5, 15) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(8, 15);
  const i = ip / 100;
  const pvFactor = (1 - Math.pow(1 + i, -n)) / i;
  const PV = round2(PMT * pvFactor);
  const nominal = PMT * n;
  const gap = round2(nominal - PV);
  return {
    id: `gen.fm1-pv-ordinary-3.${idx}`, generated: true, concepts: ["pv-ordinary-annuity"], difficulty: 3, context: "applied",
    prompt: `A pension pays \\$${PMT} at the **end of each year** for ${n} years at **${ip}% per year**. Find its present value, the nominal total of all payments, and the gap between them (what discounting removes). Use $PV = PMT \\cdot \\dfrac{1 - (1+i)^{-n}}{i}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the present value $PV = ${PMT} \\cdot \\dfrac{1 - (1+${i})^{-${n}}}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(money(PV)), hint: `Annuity present-value factor times the payment.` },
      { instruction: `Find the nominal total paid: $${PMT} \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(nominal), accept: moneyAccepts(money(nominal)), hint: `Payment times number of payments.` },
      { instruction: `Subtract the present value from the nominal total. Enter a number rounded to the nearest cent.`, answer: money(gap), accept: moneyAccepts(money(gap)), hint: `$${money(nominal)} - ${money(PV)}$.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `Present value $\\$${money(PV)}$ against a nominal $\\$${money(nominal)}$ leaves a $\\$${money(gap)}$ gap — that is the cost of waiting, exactly the time value of money.`,
  };
};

// --- annuity-due  (multiply the ordinary result by (1 + i)) ---
fill["fm1-annuity-due-1"] = (rng, idx) => {
  const PMT = rng.int(1, 10) * 100;
  const ip = rng.int(3, 8);
  const n = rng.int(3, 8);
  const i = ip / 100;
  const ord = PMT * (Math.pow(1 + i, n) - 1) / i;
  const ordR = round2(ord);
  const due = round2(ord * (1 + i));
  return {
    id: `gen.fm1-annuity-due-1.${idx}`, generated: true, concepts: ["annuity-due"], difficulty: 1, context: "applied",
    prompt: `You deposit \\$${PMT} at the **beginning of each year** (an annuity **due**) at **${ip}% per year** for ${n} years. Find the future value. Compute the ordinary-annuity future value, then multiply by $(1 + i)$ because each deposit earns one extra period. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Ordinary-annuity future value: $${PMT} \\cdot \\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(ordR), accept: moneyAccepts(money(ordR)), hint: `The end-of-period version first.` },
      { instruction: `Multiply by $(1 + i) = ${1 + i}$ for the annuity-due adjustment. Enter a number rounded to the nearest cent.`, answer: money(due), accept: moneyAccepts(money(due)), hint: `$${money(ordR)} \\times ${1 + i}$.` },
    ],
    finalAnswer: { value: money(due), unit: "dollars" },
    solutionNarrative: `Ordinary FV is $\\$${money(ordR)}$; paying at the START of each period gives every deposit one more period of growth, so multiply by $(1+${i})$: $\\$${money(due)}$.`,
  };
};
fill["fm1-annuity-due-2"] = (rng, idx) => {
  const PMT = rng.int(2, 10) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(4, 10);
  const i = ip / 100;
  const ord = PMT * (1 - Math.pow(1 + i, -n)) / i;
  const ordR = round2(ord);
  const due = round2(ord * (1 + i));
  return {
    id: `gen.fm1-annuity-due-2.${idx}`, generated: true, concepts: ["annuity-due"], difficulty: 2, context: "applied",
    prompt: `Rent of \\$${PMT} is paid at the **beginning of each year** for ${n} years. At **${ip}% per year**, find the present value of this annuity **due**. Compute the ordinary present value, then multiply by $(1 + i)$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Ordinary present value: $${PMT} \\cdot \\dfrac{1 - (1+${i})^{-${n}}}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(ordR), accept: moneyAccepts(money(ordR)), hint: `End-of-period present value first.` },
      { instruction: `Multiply by $(1 + i) = ${1 + i}$ for the due adjustment. Enter a number rounded to the nearest cent.`, answer: money(due), accept: moneyAccepts(money(due)), hint: `$${money(ordR)} \\times ${1 + i}$.` },
    ],
    finalAnswer: { value: money(due), unit: "dollars" },
    solutionNarrative: `Ordinary PV is $\\$${money(ordR)}$; because payments come at the start of each period, multiply by $(1+${i})$ to get the annuity-due value $\\$${money(due)}$.`,
  };
};
fill["fm1-annuity-due-3"] = (rng, idx) => {
  // Compare due vs ordinary FV: the extra earned from paying early.
  const PMT = rng.int(3, 12) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(6, 15);
  const i = ip / 100;
  const ord = PMT * (Math.pow(1 + i, n) - 1) / i;
  const ordR = round2(ord);
  const due = round2(ord * (1 + i));
  const extra = round2(due - ordR);
  return {
    id: `gen.fm1-annuity-due-3.${idx}`, generated: true, concepts: ["annuity-due"], difficulty: 3, context: "applied",
    prompt: `Saving \\$${PMT} a year at **${ip}%** for ${n} years, compare paying at the **end** of each year (ordinary) versus the **beginning** (due), and find how much MORE the annuity due accumulates. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Ordinary future value: $${PMT} \\cdot \\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(ordR), accept: moneyAccepts(money(ordR)), hint: `End-of-year deposits.` },
      { instruction: `Annuity-due future value: multiply the ordinary value by $(1 + ${i})$. Enter a number rounded to the nearest cent.`, answer: money(due), accept: moneyAccepts(money(due)), hint: `$${money(ordR)} \\times ${1 + i}$.` },
      { instruction: `Find the extra accumulated by paying early (due minus ordinary). Enter a number rounded to the nearest cent.`, answer: money(extra), accept: moneyAccepts(money(extra)), hint: `$${money(due)} - ${money(ordR)}$.` },
    ],
    finalAnswer: { value: money(extra), unit: "dollars" },
    solutionNarrative: `Ordinary gives $\\$${money(ordR)}$ and the due gives $\\$${money(due)}$, so starting each year's deposit early adds $\\$${money(extra)}$ — one extra period of growth on every contribution.`,
  };
};

// --- sinking-funds-and-savings  (solve for PMT to reach a goal) ---
fill["fm1-sinking-fund-1"] = (rng, idx) => {
  // Solve FV = PMT * [((1+i)^n - 1)/i] for PMT.
  const goal = rng.int(50, 200) * 100;  // 5000..20000
  const ip = rng.int(3, 8);
  const n = rng.int(3, 8);
  const i = ip / 100;
  const factor = (Math.pow(1 + i, n) - 1) / i;
  const PMT = round2(goal / factor);
  return {
    id: `gen.fm1-sinking-fund-1.${idx}`, generated: true, concepts: ["sinking-funds-and-savings"], difficulty: 1, context: "applied",
    prompt: `You want \\$${goal} in ${n} years by depositing an equal amount at the **end of each year** into an account earning **${ip}% per year**. Solve $FV = PMT \\cdot \\dfrac{(1+i)^n - 1}{i}$ for the **payment** $PMT$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the annuity factor $\\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter as a decimal (round to 6 places).`, answer: `${factor.toFixed(6)}`, accept: [`((1+${i})^${n}-1)/${i}`], hint: `Same factor as future value, before multiplying by PMT.` },
      { instruction: `Divide the goal by the factor: $PMT = ${goal} / (\\text{factor})$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Rearranged formula: the goal divided by the factor.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `$PMT = \\dfrac{${goal}}{(1+${i})^{${n}} - 1)/${i}} = \\$${money(PMT)}$ per year — the sinking-fund deposit that reaches the goal.`,
  };
};
fill["fm1-sinking-fund-2"] = (rng, idx) => {
  const goal = rng.int(100, 300) * 100;
  const ip = rng.pick([6, 12]);
  const n = rng.int(2, 4);
  const i = ip / 100 / 12;
  const periods = 12 * n;
  const factor = (Math.pow(1 + i, periods) - 1) / i;
  const PMT = round2(goal / factor);
  return {
    id: `gen.fm1-sinking-fund-2.${idx}`, generated: true, concepts: ["sinking-funds-and-savings"], difficulty: 2, context: "applied",
    prompt: `You want \\$${goal} in ${n} years for a down payment, saving at the **end of each month** in a fund earning **${ip}% per year, compounded monthly**. Find the required **monthly** deposit. Use $i = ${ip}\\%/12$, $n = 12 \\times ${n}$, and $PMT = \\dfrac{FV}{(1+i)^n - 1)/i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate $i = ${ip / 100}/12$. Enter as a decimal (round to 6 places).`, answer: `${i.toFixed(6)}`, accept: [`${ip / 100}/12`], hint: `Annual decimal rate over 12.` },
      { instruction: `Find the number of periods $n = 12 \\times ${n}$. Enter a whole number.`, answer: `${periods}`, accept: [], hint: `Months in ${n} years.` },
      { instruction: `Compute $PMT = ${goal} / \\dfrac{(1+i)^{${periods}} - 1}{i}$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Divide the goal by the monthly annuity factor.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `The required monthly deposit is $PMT = \\$${money(PMT)}$, from dividing the $\\$${goal}$ goal by the ${periods}-period annuity factor at the monthly rate.`,
  };
};
fill["fm1-sinking-fund-3"] = (rng, idx) => {
  // Solve for PMT, then find total deposited and interest contributed.
  const goal = rng.int(150, 400) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(10, 20);
  const i = ip / 100;
  const factor = (Math.pow(1 + i, n) - 1) / i;
  const PMT = round2(goal / factor);
  const deposited = round2(PMT * n);
  const interest = round2(goal - deposited);
  return {
    id: `gen.fm1-sinking-fund-3.${idx}`, generated: true, concepts: ["sinking-funds-and-savings"], difficulty: 3, context: "applied",
    prompt: `To have \\$${goal} in ${n} years you deposit equally at the **end of each year** at **${ip}% per year**. Find the annual deposit, the total you actually deposit, and how much of the goal is interest. Use $PMT = \\dfrac{FV}{(1+i)^n - 1)/i}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the deposit $PMT = ${goal} / \\dfrac{(1+${i})^{${n}} - 1}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Goal divided by the annuity factor.` },
      { instruction: `Find the total deposited: $PMT \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(deposited), accept: moneyAccepts(money(deposited)), hint: `Payment times the number of deposits.` },
      { instruction: `Subtract the total deposited from the \\$${goal} goal to find the interest earned. Enter a number rounded to the nearest cent.`, answer: money(interest), accept: moneyAccepts(money(interest)), hint: `$${goal} - ${money(deposited)}$.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `Depositing $\\$${money(PMT)}$ a year totals $\\$${money(deposited)}$ out of pocket; the remaining $\\$${money(interest)}$ of the $\\$${goal}$ goal comes from interest.`,
  };
};

// ===========================================================================
// TOPIC 4: financial-mathematics.loans-and-amortization
//   concepts: loan-payment, amortization-schedule,
//             total-interest-and-cost, extra-payments-and-comparison
// ===========================================================================
// Guard: i > 0 throughout, so PMT = PV*i / (1 - (1+i)^-n) never divides by zero.

// --- loan-payment  PMT = PV * i / (1 - (1+i)^-n) ---
fill["fm1-loan-payment-1"] = (rng, idx) => {
  const PV = rng.int(20, 80) * 100;   // 2000..8000
  const ip = rng.int(4, 9);
  const n = rng.int(2, 5);            // years, annual payments
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  return {
    id: `gen.fm1-loan-payment-1.${idx}`, generated: true, concepts: ["loan-payment"], difficulty: 1, context: "applied",
    prompt: `You borrow \\$${PV} at **${ip}% per year** and repay it with equal payments at the **end of each year** for ${n} years. Find the annual payment with $PMT = \\dfrac{PV \\cdot i}{1 - (1+i)^{-n}}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Write the per-period rate $i$ as a decimal.`, answer: `${i}`, accept: [], hint: `${ip}% as a decimal.` },
      { instruction: `Compute $PMT = \\dfrac{${PV} \\cdot ${i}}{1 - (1+${i})^{-${n}}}$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Numerator $${PV}\\cdot${i}$; denominator $1 - (1+${i})^{-${n}}$.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `$PMT = \\dfrac{${PV}(${i})}{1 - (1+${i})^{-${n}}} = \\$${money(PMT)}$ per year — the level payment that exactly pays off the loan (present value of the annuity equals the amount borrowed).`,
  };
};
fill["fm1-loan-payment-2"] = (rng, idx) => {
  const PV = rng.int(100, 300) * 100; // 10000..30000, a car loan
  const ip = rng.pick([6, 12]);
  const years = rng.int(3, 5);
  const i = ip / 100 / 12;
  const n = 12 * years;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  return {
    id: `gen.fm1-loan-payment-2.${idx}`, generated: true, concepts: ["loan-payment"], difficulty: 2, context: "applied",
    prompt: `A \\$${PV} car loan is at **${ip}% per year, compounded monthly**, for ${years} years. Find the **monthly** payment. Use $i = ${ip}\\%/12$, $n = 12 \\times ${years}$, and $PMT = \\dfrac{PV \\cdot i}{1 - (1+i)^{-n}}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate $i = ${ip / 100}/12$. Enter as a decimal (round to 6 places).`, answer: `${i.toFixed(6)}`, accept: [`${ip / 100}/12`], hint: `Annual decimal rate over 12.` },
      { instruction: `Find the number of payments $n = 12 \\times ${years}$. Enter a whole number.`, answer: `${n}`, accept: [], hint: `Months in ${years} years.` },
      { instruction: `Compute $PMT = \\dfrac{${PV} \\cdot i}{1 - (1+i)^{-${n}}}$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Use the monthly rate in both the numerator and the exponent.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `Monthly rate $${i.toFixed(6)}$ over $${n}$ months gives $PMT = \\$${money(PMT)}$ — the standard car-loan payment formula.`,
  };
};
fill["fm1-loan-payment-3"] = (rng, idx) => {
  // Mortgage-style, plus total-of-payments as a sanity extension.
  const PV = rng.int(150, 300) * 1000; // 150000..300000
  const ip = rng.pick([6, 12]);
  const years = rng.pick([15, 30]);
  const i = ip / 100 / 12;
  const n = 12 * years;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const totalPaid = round2(PMT * n);
  return {
    id: `gen.fm1-loan-payment-3.${idx}`, generated: true, concepts: ["loan-payment"], difficulty: 3, context: "applied",
    prompt: `A \\$${PV} mortgage is at **${ip}% per year, compounded monthly**, over ${years} years. Find the monthly payment, then the total of all payments. Use $PMT = \\dfrac{PV \\cdot i}{1 - (1+i)^{-n}}$ with $i = ${ip}\\%/12$ and $n = 12 \\times ${years}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate $i = ${ip / 100}/12$. Enter as a decimal (round to 6 places).`, answer: `${i.toFixed(6)}`, accept: [`${ip / 100}/12`], hint: `Annual decimal rate over 12.` },
      { instruction: `Compute the monthly payment $PMT = \\dfrac{${PV} \\cdot i}{1 - (1+i)^{-${n}}}$. Enter a number rounded to the nearest cent.`, answer: money(PMT), accept: moneyAccepts(money(PMT)), hint: `Standard mortgage formula with the monthly rate.` },
      { instruction: `Find the total paid over the life of the loan: $PMT \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(totalPaid), accept: moneyAccepts(money(totalPaid)), hint: `Monthly payment times the number of payments.` },
    ],
    finalAnswer: { value: money(PMT), unit: "dollars" },
    solutionNarrative: `The payment is $\\$${money(PMT)}$/month; over $${n}$ months you repay $\\$${money(totalPaid)}$ — dramatically more than the $\\$${PV}$ borrowed, all of the excess being interest.`,
  };
};

// --- amortization-schedule (interest vs principal split; balance after k) ---
fill["fm1-amortization-1"] = (rng, idx) => {
  const PV = rng.int(20, 80) * 100;
  const ip = rng.int(4, 9);
  const n = rng.int(3, 6);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const interest1 = round2(PV * i);
  const principal1 = round2(PMT - interest1);
  const balance1 = round2(PV - principal1);
  return {
    id: `gen.fm1-amortization-1.${idx}`, generated: true, concepts: ["amortization-schedule"], difficulty: 1, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year** has an annual payment of \\$${money(PMT)}. Break the **first payment** into interest and principal, and find the balance after it. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Interest in payment 1 is the rate times the current balance: $${PV} \\cdot ${i}$. Enter a number rounded to the nearest cent.`, answer: money(interest1), accept: moneyAccepts(money(interest1)), hint: `Interest is charged on the outstanding balance.` },
      { instruction: `Principal in payment 1 is the payment minus the interest: $${money(PMT)} - ${money(interest1)}$. Enter a number rounded to the nearest cent.`, answer: money(principal1), accept: moneyAccepts(money(principal1)), hint: `Whatever is left of the payment reduces the balance.` },
      { instruction: `New balance: $${PV} - (\\text{principal})$. Enter a number rounded to the nearest cent.`, answer: money(balance1), accept: moneyAccepts(money(balance1)), hint: `Subtract the principal portion from the starting balance.` },
    ],
    finalAnswer: { value: money(balance1), unit: "dollars" },
    solutionNarrative: `Payment 1: interest $= ${PV}(${i}) = \\$${money(interest1)}$, principal $= \\$${money(principal1)}$, new balance $= \\$${money(balance1)}$. Early payments are mostly interest.`,
  };
};
fill["fm1-amortization-2"] = (rng, idx) => {
  // Two-period walk: payment 1 and payment 2 split.
  const PV = rng.int(30, 90) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(4, 7);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const int1 = round2(PV * i);
  const prin1 = round2(PMT - int1);
  const bal1 = round2(PV - prin1);
  const int2 = round2(bal1 * i);
  const prin2 = round2(PMT - int2);
  const bal2 = round2(bal1 - prin2);
  return {
    id: `gen.fm1-amortization-2.${idx}`, generated: true, concepts: ["amortization-schedule"], difficulty: 2, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year** has annual payment \\$${money(PMT)}. Walk two rows of the amortization schedule: find the balance after payment 1, then the interest and principal of payment 2. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Balance after payment 1: interest $${PV}\\cdot${i}$, principal $= PMT - $ interest, then subtract. Enter the new balance rounded to the nearest cent.`, answer: money(bal1), accept: moneyAccepts(money(bal1)), hint: `Interest $${money(int1)}$, principal $${money(prin1)}$, balance $${PV} - ${money(prin1)}$.` },
      { instruction: `Interest in payment 2 uses the NEW balance: $${money(bal1)} \\cdot ${i}$. Enter a number rounded to the nearest cent.`, answer: money(int2), accept: moneyAccepts(money(int2)), hint: `Interest always uses the current outstanding balance.` },
      { instruction: `Principal in payment 2: $${money(PMT)} - ${money(int2)}$. Enter a number rounded to the nearest cent.`, answer: money(prin2), accept: moneyAccepts(money(prin2)), hint: `Payment minus its interest portion.` },
    ],
    finalAnswer: { value: money(prin2), unit: "dollars" },
    solutionNarrative: `After payment 1 the balance is $\\$${money(bal1)}$. Payment 2's interest is $\\$${money(int2)}$ (less than payment 1's, because the balance shrank) and its principal $\\$${money(prin2)}$ (more) — the classic amortization shift from interest toward principal.`,
  };
};
fill["fm1-amortization-3"] = (rng, idx) => {
  // Balance after k payments via B_k = PV(1+i)^k - PMT*[((1+i)^k - 1)/i].
  const PV = rng.int(50, 120) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(8, 12);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const k = rng.int(2, 5);
  const bal = round2(PV * Math.pow(1 + i, k) - PMT * (Math.pow(1 + i, k) - 1) / i);
  return {
    id: `gen.fm1-amortization-3.${idx}`, generated: true, concepts: ["amortization-schedule"], difficulty: 3, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year** over ${n} years has annual payment \\$${money(PMT)}. Find the outstanding **balance after ${k} payments** using $B_k = PV(1+i)^k - PMT \\cdot \\dfrac{(1+i)^k - 1}{i}$. Enter a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Compute the grown principal $${PV} \\cdot (1+${i})^{${k}}$. Enter a number rounded to the nearest cent.`, answer: money(round2(PV * Math.pow(1 + i, k))), accept: moneyAccepts(money(round2(PV * Math.pow(1 + i, k)))), hint: `The original balance compounded ${k} periods.` },
      { instruction: `Compute the accumulated payments $${money(PMT)} \\cdot \\dfrac{(1+${i})^{${k}} - 1}{${i}}$. Enter a number rounded to the nearest cent.`, answer: money(round2(PMT * (Math.pow(1 + i, k) - 1) / i)), accept: moneyAccepts(money(round2(PMT * (Math.pow(1 + i, k) - 1) / i))), hint: `Future value of the ${k} payments made so far.` },
      { instruction: `Subtract to get the balance $B_{${k}}$. Enter a number rounded to the nearest cent.`, answer: money(bal), accept: moneyAccepts(money(bal)), hint: `Grown principal minus accumulated payments.` },
    ],
    finalAnswer: { value: money(bal), unit: "dollars" },
    solutionNarrative: `$B_{${k}} = ${PV}(1+${i})^{${k}} - ${money(PMT)}\\cdot \\dfrac{(1+${i})^{${k}} - 1}{${i}} = \\$${money(bal)}$ — the balance still owed after ${k} of ${n} payments.`,
  };
};

// --- total-interest-and-cost  (sum paid - principal) ---
fill["fm1-total-cost-1"] = (rng, idx) => {
  const PV = rng.int(20, 80) * 100;
  const ip = rng.int(4, 9);
  const n = rng.int(2, 5);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const total = round2(PMT * n);
  const interest = round2(total - PV);
  return {
    id: `gen.fm1-total-cost-1.${idx}`, generated: true, concepts: ["total-interest-and-cost"], difficulty: 1, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year** is repaid with ${n} annual payments of \\$${money(PMT)}. Find the **total paid** and the **total interest**. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Total paid: $${money(PMT)} \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(total), accept: moneyAccepts(money(total)), hint: `Payment times number of payments.` },
      { instruction: `Total interest: total paid minus the amount borrowed, $${money(total)} - ${PV}$. Enter a number rounded to the nearest cent.`, answer: money(interest), accept: moneyAccepts(money(interest)), hint: `Everything above the principal is interest.` },
    ],
    finalAnswer: { value: money(interest), unit: "dollars" },
    solutionNarrative: `You repay $${money(PMT)} \\times ${n} = \\$${money(total)}$, so the interest is $\\$${money(total)} - \\$${PV} = \\$${money(interest)}$.`,
  };
};
fill["fm1-total-cost-2"] = (rng, idx) => {
  const PV = rng.int(100, 300) * 100;
  const ip = rng.pick([6, 12]);
  const years = rng.int(3, 5);
  const i = ip / 100 / 12;
  const n = 12 * years;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const total = round2(PMT * n);
  const interest = round2(total - PV);
  return {
    id: `gen.fm1-total-cost-2.${idx}`, generated: true, concepts: ["total-interest-and-cost"], difficulty: 2, context: "applied",
    prompt: `A \\$${PV} car loan at **${ip}% per year** for ${years} years has a monthly payment of \\$${money(PMT)}. Find the total paid over the ${n} months and the total interest. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Total paid: $${money(PMT)} \\times ${n}$. Enter a number rounded to the nearest cent.`, answer: money(total), accept: moneyAccepts(money(total)), hint: `Monthly payment times ${n} months.` },
      { instruction: `Total interest: $${money(total)} - ${PV}$. Enter a number rounded to the nearest cent.`, answer: money(interest), accept: moneyAccepts(money(interest)), hint: `Total paid minus the amount financed.` },
    ],
    finalAnswer: { value: money(interest), unit: "dollars" },
    solutionNarrative: `Over ${n} months you pay $\\$${money(total)}$; subtracting the $\\$${PV}$ borrowed leaves $\\$${money(interest)}$ in interest.`,
  };
};
fill["fm1-total-cost-3"] = (rng, idx) => {
  // Compare total interest at two terms (shorter vs longer) for same loan.
  const PV = rng.int(100, 250) * 100;
  const ip = rng.pick([6, 12]);
  const i = ip / 100 / 12;
  const yShort = 3, yLong = 5;
  const nS = 12 * yShort, nL = 12 * yLong;
  const pmtS = round2(PV * i / (1 - Math.pow(1 + i, -nS)));
  const pmtL = round2(PV * i / (1 - Math.pow(1 + i, -nL)));
  const intS = round2(pmtS * nS - PV);
  const intL = round2(pmtL * nL - PV);
  const extra = round2(intL - intS);
  return {
    id: `gen.fm1-total-cost-3.${idx}`, generated: true, concepts: ["total-interest-and-cost"], difficulty: 3, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year (monthly)** can be repaid over ${yShort} years or ${yLong} years. The payments are \\$${money(pmtS)}/mo and \\$${money(pmtL)}/mo. Find the total interest for each term and how much MORE the longer term costs. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `${yShort}-year total interest: $${money(pmtS)} \\times ${nS} - ${PV}$. Enter a number rounded to the nearest cent.`, answer: money(intS), accept: moneyAccepts(money(intS)), hint: `Total of the ${nS} payments, minus principal.` },
      { instruction: `${yLong}-year total interest: $${money(pmtL)} \\times ${nL} - ${PV}$. Enter a number rounded to the nearest cent.`, answer: money(intL), accept: moneyAccepts(money(intL)), hint: `Total of the ${nL} payments, minus principal.` },
      { instruction: `Extra interest from choosing the longer term (longer minus shorter). Enter a number rounded to the nearest cent.`, answer: money(extra), accept: moneyAccepts(money(extra)), hint: `$${money(intL)} - ${money(intS)}$.` },
    ],
    finalAnswer: { value: money(extra), unit: "dollars" },
    solutionNarrative: `The ${yShort}-year term costs $\\$${money(intS)}$ in interest and the ${yLong}-year term $\\$${money(intL)}$ — the lower payment comes at $\\$${money(extra)}$ more interest. A longer term trades monthly relief for total cost.`,
  };
};

// --- extra-payments-and-comparison (menu + numeric) ---
fill["fm1-extra-payment-1"] = (rng, idx) => {
  // Add a fixed extra to the required payment; which finishes sooner? + interest-portion numeric.
  const PV = rng.int(30, 90) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(4, 7);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const interest1 = round2(PV * i);
  return {
    id: `gen.fm1-extra-payment-1.${idx}`, generated: true, concepts: ["extra-payments-and-comparison"], difficulty: 1, context: "applied",
    prompt: `On a \\$${PV} loan at **${ip}% per year** the required annual payment is \\$${money(PMT)}. You decide to pay EXTRA each year. First find the interest in the first payment, then decide the effect of paying extra. Enter money as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Interest in payment 1: $${PV} \\cdot ${i}$. Enter a number rounded to the nearest cent.`, answer: money(interest1), accept: moneyAccepts(money(interest1)), hint: `Rate times the starting balance.` },
      { instruction: `Every extra dollar goes straight to principal. Does paying extra make the loan finish sooner or later? Answer 'sooner' or 'later'.`, answer: "sooner", accept: ["earlier", "faster", "shorter"], hint: `More principal paid now means less balance to charge interest on later.` },
    ],
    finalAnswer: { value: "sooner", unit: "" },
    solutionNarrative: `Payment 1's interest is $\\$${money(interest1)}$; anything paid above the required $\\$${money(PMT)}$ reduces principal directly, so the loan is paid off sooner and total interest drops.`,
  };
};
fill["fm1-extra-payment-2"] = (rng, idx) => {
  // Compare monthly payment at two different terms; which has the smaller payment?
  const PV = rng.int(100, 250) * 100;
  const ip = rng.pick([6, 12]);
  const i = ip / 100 / 12;
  const yShort = 3, yLong = 6;
  const nS = 12 * yShort, nL = 12 * yLong;
  const pmtS = round2(PV * i / (1 - Math.pow(1 + i, -nS)));
  const pmtL = round2(PV * i / (1 - Math.pow(1 + i, -nL)));
  const diff = round2(pmtS - pmtL);
  return {
    id: `gen.fm1-extra-payment-2.${idx}`, generated: true, concepts: ["extra-payments-and-comparison"], difficulty: 2, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year (monthly)** can run ${yShort} years or ${yLong} years, with payments \\$${money(pmtS)}/mo and \\$${money(pmtL)}/mo. Find how much lower the longer-term monthly payment is, then decide which term a borrower who wants the smallest monthly payment should choose. Enter money as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `How much smaller is the ${yLong}-year monthly payment? $${money(pmtS)} - ${money(pmtL)}$. Enter a number rounded to the nearest cent.`, answer: money(diff), accept: moneyAccepts(money(diff)), hint: `Shorter-term payment minus longer-term payment.` },
      { instruction: `For the smallest monthly payment, which term should the borrower pick — the shorter or the longer? Answer 'the shorter term' or 'the longer term'.`, answer: "the longer term", accept: ["longer term", "longer", "the longer one"], hint: `Spreading the loan over more payments lowers each one.` },
    ],
    finalAnswer: { value: "the longer term", unit: "" },
    solutionNarrative: `The longer term's payment is $\\$${money(diff)}$ lower each month, so a borrower minimizing the monthly payment picks the longer term — at the cost, as always, of more total interest.`,
  };
};
fill["fm1-extra-payment-3"] = (rng, idx) => {
  // Extra payment reduces balance; compute balance after 1 payment with and without extra, and interest saved next period.
  const PV = rng.int(50, 120) * 100;
  const ip = rng.int(4, 8);
  const n = rng.int(6, 10);
  const i = ip / 100;
  const PMT = round2(PV * i / (1 - Math.pow(1 + i, -n)));
  const extra = rng.int(3, 10) * 100;
  const int1 = round2(PV * i);
  const prin1 = round2(PMT - int1);
  const balNoExtra = round2(PV - prin1);
  const balExtra = round2(PV - prin1 - extra);
  const int2NoExtra = round2(balNoExtra * i);
  const int2Extra = round2(balExtra * i);
  const saved = round2(int2NoExtra - int2Extra);
  return {
    id: `gen.fm1-extra-payment-3.${idx}`, generated: true, concepts: ["extra-payments-and-comparison"], difficulty: 3, context: "applied",
    prompt: `A \\$${PV} loan at **${ip}% per year** has annual payment \\$${money(PMT)}. In year 1 you add an EXTRA \\$${extra} to principal. Find the balance after payment 1 without the extra, the balance WITH the extra, and how much interest that saves in year 2. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Balance after the normal payment 1 (interest $${money(int1)}$, principal $${money(prin1)}$): $${PV} - ${money(prin1)}$. Enter a number rounded to the nearest cent.`, answer: money(balNoExtra), accept: moneyAccepts(money(balNoExtra)), hint: `Starting balance minus the principal portion.` },
      { instruction: `Balance WITH the extra \\$${extra}: subtract it too. Enter a number rounded to the nearest cent.`, answer: money(balExtra), accept: moneyAccepts(money(balExtra)), hint: `$${money(balNoExtra)} - ${extra}$.` },
      { instruction: `Year-2 interest is saved on that smaller balance: $${extra} \\cdot ${i}$. Enter a number rounded to the nearest cent.`, answer: money(saved), accept: moneyAccepts(money(saved)), hint: `The extra principal avoids a year of interest: extra times the rate.` },
    ],
    finalAnswer: { value: money(saved), unit: "dollars" },
    solutionNarrative: `Without the extra the balance is $\\$${money(balNoExtra)}$; the extra $\\$${extra}$ drops it to $\\$${money(balExtra)}$, saving $${extra}(${i}) = \\$${money(saved)}$ of interest the very next year — and more every year after.`,
  };
};
