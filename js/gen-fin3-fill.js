// gen-fin3-fill.js
// Parametric generators for the wave-14 Financial Mathematics topic:
//   financial-mathematics.perpetuities
// One template per (concept, difficulty) tier — 12 total. Self-contained: no
// imports from generator.js. Exports a `fill` map of template-name -> generator
// fn, matching the pack pattern of gen-nt2-fill.js. Every answer is COMPUTED
// in-pack from the SAME numbers shown in the prompt. All rate arithmetic is
// done in integer percent (iP, gP, sP) so no float dust ever reaches an answer.

// ---------------------------------------------------------------------------
// Helpers (all in-pack)
// ---------------------------------------------------------------------------

// House money format: integers stay bare ("10000"), otherwise 2 decimals.
const money = (x) => {
  const r = Math.round(x * 100) / 100;
  return Number.isInteger(r) ? `${r}` : r.toFixed(2);
};
const moneyAccepts = (x) => {
  const r = Math.round(x * 100) / 100;
  return Number.isInteger(r) ? [`${r}.00`] : [`${r.toFixed(2)}0`];
};

// Rate as decimal string from integer percent (5 -> "0.05", 50 bp -> use /100).
const rateStr = (P) => `${P / 100}`;

// Is x clean to 2 decimal places (guards graded dollar answers)?
const clean2 = (x) => Math.abs(x * 100 - Math.round(x * 100)) < 1e-7;

// Group digits for display in prose ($12{,}500$ style is avoided; plain).
const disp = (x) => money(x);

// ===========================================================================
export const fill = {};

// ===========================================================================
// financial-mathematics.perpetuities
// Concepts: level-perpetuity, perpetuity-due-and-deferred, growing-perpetuity,
//           perpetuity-applications
// ===========================================================================

// --- level-perpetuity ---

// d1: PV = C/i with clean numbers.
fill["fm3-level-1"] = (rng, idx) => {
  const iP = rng.pick([4, 5, 8, 10]);
  const k = rng.int(3, 12);
  const C = iP * 10 * k;      // C = i * PV exactly
  const PV = 1000 * k;
  return {
    id: `gen.fm3-level-1.${idx}`, generated: true, concepts: ["level-perpetuity"], difficulty: 1, context: "applied",
    prompt: `An investment promises \\$${C} at the end of every year, forever, when money is worth ${iP}\\% per year. Find its present value with $PV = \\dfrac{C}{i}$. Enter as a number, no $ or commas.`,
    steps: [
      { instruction: `Write the rate $i$ as a decimal.`, answer: rateStr(iP), accept: [], hint: `${iP}% as a decimal.` },
      { instruction: `Compute $PV = \\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Dividing by ${rateStr(iP)} is multiplying by ${100 / iP}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$PV = \\dfrac{${C}}{${rateStr(iP)}} = \\$${disp(PV)}$ — a finite price for an infinite stream, because distant payments are worth almost nothing today.`,
  };
};

// d2: monthly perpetuity — convert the annual rate first.
fill["fm3-level-2"] = (rng, idx) => {
  const annualP = rng.pick([6, 12]);          // monthly rate 0.005 or 0.01
  const im = annualP / 1200;                  // exact in binary-safe integers: 6/1200, 12/1200
  const k = rng.int(5, 30);
  const C = annualP === 6 ? 5 * k : 10 * k;   // C = im * PV exactly
  const PV = 1000 * k;
  return {
    id: `gen.fm3-level-2.${idx}`, generated: true, concepts: ["level-perpetuity"], difficulty: 2, context: "applied",
    prompt: `A trust pays \\$${C} at the end of every month, forever. Money is worth ${annualP}\\% per year, compounded monthly. Find the present value: use the MONTHLY rate $i = ${annualP}\\%/12$ in $PV = C/i$. Enter as a number, no $ or commas.`,
    steps: [
      { instruction: `Find the monthly rate $i = ${rateStr(annualP)}/12$. Enter as a decimal.`, answer: `${im}`, accept: [`${annualP / 100}/12`], hint: `Divide the annual decimal rate by 12.` },
      { instruction: `Compute $PV = \\dfrac{${C}}{${im}}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Dividing by ${im} is multiplying by ${Math.round(1 / im)}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `With the monthly rate $i = ${im}$, $PV = \\dfrac{${C}}{${im}} = \\$${disp(PV)}$. Using the annual rate here is the classic period-mismatch mistake.`,
  };
};

// d3: endowment — PV, first-year interest, principal intact.
fill["fm3-level-3"] = (rng, idx) => {
  const iP = rng.pick([4, 5, 8]);
  const k = rng.int(10, 60);
  const C = iP * 10 * k;
  const PV = 1000 * k;
  return {
    id: `gen.fm3-level-3.${idx}`, generated: true, concepts: ["level-perpetuity"], difficulty: 3, context: "applied",
    prompt: `A donor wants to endow a \\$${C}-per-year prize forever, with the fund earning ${iP}\\% per year and the prize paid from interest at the end of each year. Find the required endowment, the interest earned in year one, and the fund balance after the first prize is paid. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Required endowment $PV = \\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Level perpetuity: $C/i$.` },
      { instruction: `Interest earned in year one: $PV \\times ${rateStr(iP)}$. Enter a number.`, answer: money(C), accept: moneyAccepts(C), hint: `It exactly equals the prize — that is the whole design.` },
      { instruction: `Balance after paying the \\$${C} prize: $${disp(PV)} + ${disp(C)} - ${disp(C)}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Interest in, prize out: the principal never shrinks.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$PV = ${disp(PV)}$; year-one interest is $PV \\cdot i = \\$${disp(C)}$, which funds the prize exactly, leaving the principal untouched — a perpetuity is self-sustaining by construction.`,
  };
};

// --- perpetuity-due-and-deferred ---

// d1: perpetuity-due = ordinary * (1 + i) = PV + C.
fill["fm3-due-1"] = (rng, idx) => {
  const iP = rng.pick([4, 5, 8]);
  const k = rng.int(3, 15);
  const C = iP * 10 * k;
  const PV0 = 1000 * k;
  const due = PV0 + C; // (C/i)(1+i) = C/i + C exactly
  return {
    id: `gen.fm3-due-1.${idx}`, generated: true, concepts: ["perpetuity-due-and-deferred"], difficulty: 1, context: "applied",
    prompt: `A ground lease pays \\$${C} at the BEGINNING of each year, forever, at ${iP}\\% per year. Compute the ordinary perpetuity value first, then multiply by $(1 + i)$ for the perpetuity-due. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Ordinary value: $\\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PV0), accept: moneyAccepts(PV0), hint: `End-of-year version first.` },
      { instruction: `Multiply by $(1 + ${rateStr(iP)})$. Enter a number.`, answer: money(due), accept: moneyAccepts(due), hint: `$${disp(PV0)} \\times ${1 + iP / 100}$ — equivalently the ordinary value plus one payment.` },
    ],
    finalAnswer: { value: money(due), unit: "dollars" },
    solutionNarrative: `Ordinary $PV = \\$${disp(PV0)}$; paid up front, the stream is worth $${disp(PV0)} \\times ${1 + iP / 100} = \\$${disp(due)}$ — exactly one extra payment of \\$${C}, since the first one arrives today undiscounted.`,
  };
};

// d2: deferred perpetuity — discount C/i back m years with a STATED factor.
fill["fm3-due-2"] = (rng, idx) => {
  let iP, m, k, Fint;
  do {
    iP = rng.pick([5, 6, 8]);
    m = rng.int(2, 5);
    k = rng.int(4, 20);
    Fint = Math.round(1e6 / Math.pow(1 + iP / 100, m)); // (1+i)^-m in millionths
  } while ((k * Fint) % 10 === 5); // avoid a round-half at the 3rd decimal
  const C = iP * 10 * k;
  const PV0 = 1000 * k;
  const F = (Fint / 1e6).toFixed(6);
  const PV = Math.round((k * Fint) / 10) / 100; // = PV0 * F, rounded to cents exactly
  return {
    id: `gen.fm3-due-2.${idx}`, generated: true, concepts: ["perpetuity-due-and-deferred"], difficulty: 2, context: "applied",
    prompt: `A pension of \\$${C} per year (end of year) starts ${m} years from now and then runs forever, at ${iP}\\% per year. Value the perpetuity as of year ${m}, then discount back using the given factor $(1 + ${rateStr(iP)})^{-${m}} = ${F}$. Enter each as a number rounded to the nearest cent, no $ or commas.`,
    steps: [
      { instruction: `Value at year ${m} (just before payments begin): $\\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PV0), accept: moneyAccepts(PV0), hint: `A standard perpetuity, seen from year ${m}.` },
      { instruction: `Discount to today: $${disp(PV0)} \\times ${F}$. Enter a number rounded to the nearest cent.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Multiply by the stated discount factor.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `At year ${m} the stream is worth $\\dfrac{${C}}{${rateStr(iP)}} = \\$${disp(PV0)}$; discounting ${m} years at ${iP}\\% gives $${disp(PV0)} \\times ${F} = \\$${money(PV)}$ today.`,
  };
};

// d3: ordinary vs due — the difference is exactly one payment.
fill["fm3-due-3"] = (rng, idx) => {
  const iP = rng.pick([4, 5, 8, 10]);
  const k = rng.int(5, 20);
  const C = iP * 10 * k;
  const PV0 = 1000 * k;
  const due = PV0 + C;
  return {
    id: `gen.fm3-due-3.${idx}`, generated: true, concepts: ["perpetuity-due-and-deferred"], difficulty: 3, context: "applied",
    prompt: `Two contracts each pay \\$${C} per year forever at ${iP}\\% per year: contract X pays at the end of each year, contract Y at the beginning. Find both values and the premium Y commands over X. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Value of X (ordinary): $\\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PV0), accept: moneyAccepts(PV0), hint: `$C/i$.` },
      { instruction: `Value of Y (due): multiply by $(1 + ${rateStr(iP)})$. Enter a number.`, answer: money(due), accept: moneyAccepts(due), hint: `$${disp(PV0)} \\times ${1 + iP / 100}$.` },
      { instruction: `Premium $= Y - X$. Enter a number.`, answer: money(C), accept: moneyAccepts(C), hint: `It equals one full payment.` },
    ],
    finalAnswer: { value: money(C), unit: "dollars" },
    solutionNarrative: `X is worth \\$${disp(PV0)} and Y is worth \\$${disp(due)}. The gap is exactly \\$${C} — the first payment of Y arrives today and is not discounted at all, while every later payment matches X one-for-one.`,
  };
};

// --- growing-perpetuity ---

// d1: PV = C/(i - g), clean spread.
fill["fm3-grow-1"] = (rng, idx) => {
  const gP = rng.pick([1, 2, 3]);
  const sP = rng.pick([2, 4, 5]); // i - g
  const iP = gP + sP;             // i > g guaranteed by construction
  const k = rng.int(2, 9);
  const C = sP * 100 * k;         // C = (i-g) * PV exactly
  const PV = 10000 * k;
  return {
    id: `gen.fm3-grow-1.${idx}`, generated: true, concepts: ["growing-perpetuity"], difficulty: 1, context: "applied",
    prompt: `A stock will pay a dividend of \\$${C} one year from now, growing ${gP}\\% per year forever. The required return is ${iP}\\% per year. Find the value with the growing-perpetuity formula $PV = \\dfrac{C}{i - g}$ (valid because $i > g$). Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Compute the spread $i - g = ${rateStr(iP)} - ${rateStr(gP)}$. Enter as a decimal.`, answer: rateStr(sP), accept: [], hint: `Subtract the decimals.` },
      { instruction: `Compute $PV = \\dfrac{${C}}{${rateStr(sP)}}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Dividing by ${rateStr(sP)} is multiplying by ${100 / sP}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$PV = \\dfrac{${C}}{${rateStr(iP)} - ${rateStr(gP)}} = \\dfrac{${C}}{${rateStr(sP)}} = \\$${disp(PV)}$. Growth makes the stream more valuable, so only the SPREAD $i - g$ discounts it.`,
  };
};

// d2: last payment just made — grow it one step first.
fill["fm3-grow-2"] = (rng, idx) => {
  const gP = rng.pick([2, 5, 10]);
  const sP = rng.pick([4, 5]);
  const iP = gP + sP;
  const k = rng.int(5, 20);
  const C0 = 100 * k;
  const C1 = k * (100 + gP);                 // C0 * (1+g), exact integer
  const PV = C1 * (sP === 4 ? 25 : 20);      // C1 / (s/100), exact integer
  return {
    id: `gen.fm3-grow-2.${idx}`, generated: true, concepts: ["growing-perpetuity"], difficulty: 2, context: "applied",
    prompt: `A company JUST PAID a dividend of \\$${C0}. Dividends grow ${gP}\\% per year forever and the required return is ${iP}\\% per year. The formula $PV = \\dfrac{C_1}{i - g}$ needs NEXT year's payment $C_1$, not the one already paid. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Grow the payment one step: $C_1 = ${C0} \\times (1 + ${rateStr(gP)})$. Enter a number.`, answer: money(C1), accept: moneyAccepts(C1), hint: `$${C0} \\times ${1 + gP / 100}$.` },
      { instruction: `Compute the spread $i - g$. Enter as a decimal.`, answer: rateStr(sP), accept: [], hint: `$${rateStr(iP)} - ${rateStr(gP)}$.` },
      { instruction: `$PV = \\dfrac{${disp(C1)}}{${rateStr(sP)}}$. Enter a number.`, answer: money(PV), accept: moneyAccepts(PV), hint: `Dividing by ${rateStr(sP)} is multiplying by ${100 / sP}.` },
    ],
    finalAnswer: { value: money(PV), unit: "dollars" },
    solutionNarrative: `$C_1 = ${C0}(1 + ${rateStr(gP)}) = \\$${disp(C1)}$, so $PV = \\dfrac{${disp(C1)}}{${rateStr(sP)}} = \\$${disp(PV)}$. Forgetting to grow the just-paid dividend is the single most common error with this formula.`,
  };
};

// d3: implied required return — i = C/PV + g.
fill["fm3-grow-3"] = (rng, idx) => {
  const gP = rng.pick([1, 2, 3]);
  const sP = rng.pick([2, 4, 5]);
  const iP = gP + sP;
  const k = rng.int(2, 9);
  const C = sP * 100 * k;
  const PV = 10000 * k;
  return {
    id: `gen.fm3-grow-3.${idx}`, generated: true, concepts: ["growing-perpetuity"], difficulty: 3, context: "applied",
    prompt: `A growing perpetuity sells for \\$${PV} today. Its next payment (one year out) is \\$${C}, and payments grow ${gP}\\% per year forever. What annual return $i$ does the price imply? Rearrange $PV = \\dfrac{C}{i - g}$ to $i = \\dfrac{C}{PV} + g$.`,
    steps: [
      { instruction: `Compute the yield component $\\dfrac{C}{PV} = \\dfrac{${C}}{${PV}}$. Enter as a decimal.`, answer: rateStr(sP), accept: [`${C}/${PV}`], hint: `This recovers the spread $i - g$.` },
      { instruction: `Add the growth rate: $i = ${rateStr(sP)} + ${rateStr(gP)}$. Enter $i$ as a percent number (e.g. enter 7 for 7%).`, answer: `${iP}`, accept: [], hint: `Convert the decimal sum to percent.` },
    ],
    finalAnswer: { value: `${iP}`, unit: "percent" },
    solutionNarrative: `$\\dfrac{C}{PV} = ${rateStr(sP)}$ and $i = ${rateStr(sP)} + ${rateStr(gP)} = ${rateStr(iP)}$, i.e. ${iP}\\%: the buyer earns a ${sP}\\% cash yield plus ${gP}\\% growth. Note $i > g$ holds, as the formula requires.`,
  };
};

// --- perpetuity-applications ---

// d1: preferred stock price = dividend / required return.
fill["fm3-app-1"] = (rng, idx) => {
  const P = rng.pick([25, 50, 80, 100]);
  const iP = rng.pick([4, 5, 8]);
  const D = Math.round(P * iP) / 100; // clean to cents for all combos
  return {
    id: `gen.fm3-app-1.${idx}`, generated: true, concepts: ["perpetuity-applications"], difficulty: 1, context: "applied",
    prompt: `A preferred share pays a fixed dividend of \\$${money(D)} per year, forever. Investors require ${iP}\\% per year. Price the share as a level perpetuity. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Write the required return $i$ as a decimal.`, answer: rateStr(iP), accept: [], hint: `${iP}% as a decimal.` },
      { instruction: `Price $= \\dfrac{${money(D)}}{${rateStr(iP)}}$. Enter a number.`, answer: money(P), accept: moneyAccepts(P), hint: `Dividend over required return.` },
    ],
    finalAnswer: { value: money(P), unit: "dollars" },
    solutionNarrative: `Price $= \\dfrac{${money(D)}}{${rateStr(iP)}} = \\$${disp(P)}$ — preferred stock is the textbook real-world perpetuity: a fixed dividend with no maturity date.`,
  };
};

// d2: cap rate — rate from NOI/price, then revalue at a different cap rate.
fill["fm3-app-2"] = (rng, idx) => {
  let k, r1P, r2P, price, NOI, v2;
  do {
    k = rng.int(2, 6);
    r1P = rng.pick([4, 5, 6, 8]);
    do { r2P = rng.pick([4, 5, 6, 8]); } while (r2P === r1P);
    price = 100000 * k;
    NOI = price * r1P / 100;      // integer
    v2 = NOI / (r2P / 100);
  } while (!Number.isInteger(v2));
  return {
    id: `gen.fm3-app-2.${idx}`, generated: true, concepts: ["perpetuity-applications"], difficulty: 2, context: "applied",
    prompt: `A rental building sells for \\$${price} and produces a net operating income (NOI) of \\$${NOI} per year. Its cap rate is $\\text{NOI}/\\text{price}$ — exactly the perpetuity rate $i = C/PV$. Find the cap rate, then what the building would fetch if the market cap rate moved to ${r2P}\\%.`,
    steps: [
      { instruction: `Cap rate $= \\dfrac{${NOI}}{${price}}$. Enter as a percent number (e.g. enter 6 for 6%).`, answer: `${r1P}`, accept: [], hint: `Divide, then multiply by 100.` },
      { instruction: `Revalue at a ${r2P}\\% cap rate: $\\dfrac{${NOI}}{${rateStr(r2P)}}$. Enter a number, no $ or commas.`, answer: money(v2), accept: moneyAccepts(v2), hint: `Same income, new perpetuity rate.` },
    ],
    finalAnswer: { value: money(v2), unit: "dollars" },
    solutionNarrative: `Cap rate $= ${NOI}/${price} = ${r1P}\\%$. At a ${r2P}\\% cap rate the same \\$${NOI} income is worth $\\dfrac{${NOI}}{${rateStr(r2P)}} = \\$${disp(v2)}$ — ${r2P < r1P ? "lower rates inflate" : "higher rates deflate"} property values, exactly as $C/i$ predicts.`,
  };
};

// d3: growing endowment — cost with growth vs level, and the premium.
fill["fm3-app-3"] = (rng, idx) => {
  let gP, sP, iP, k, C, PVgrow, PVlevel;
  do {
    gP = rng.pick([1, 2, 3]);
    sP = rng.pick([2, 4, 5]);
    iP = gP + sP;
    k = rng.int(2, 9);
    C = sP * 100 * k;
    PVgrow = 10000 * k;          // C / (s/100), exact
    PVlevel = C / (iP / 100);
  } while (!clean2(PVlevel));
  const extra = Math.round((PVgrow - PVlevel) * 100) / 100;
  return {
    id: `gen.fm3-app-3.${idx}`, generated: true, concepts: ["perpetuity-applications"], difficulty: 3, context: "applied",
    prompt: `A university wants a scholarship paying \\$${C} next year and growing ${gP}\\% per year forever to keep up with costs; the endowment earns ${iP}\\% per year. Find the endowment needed WITH growth, the endowment for a level (non-growing) \\$${C} scholarship, and the extra cost of inflation-proofing. Enter each as a number, no $ or commas.`,
    steps: [
      { instruction: `Growing version: $PV = \\dfrac{${C}}{${rateStr(iP)} - ${rateStr(gP)}}$. Enter a number.`, answer: money(PVgrow), accept: moneyAccepts(PVgrow), hint: `The spread is $${rateStr(sP)}$.` },
      { instruction: `Level version: $PV = \\dfrac{${C}}{${rateStr(iP)}}$. Enter a number.`, answer: money(PVlevel), accept: moneyAccepts(PVlevel), hint: `Plain $C/i$.` },
      { instruction: `Extra cost of growth: subtract the level cost from the growing cost. Enter a number.`, answer: money(extra), accept: moneyAccepts(extra), hint: `$${disp(PVgrow)} - ${disp(PVlevel)}$.` },
    ],
    finalAnswer: { value: money(PVgrow), unit: "dollars" },
    solutionNarrative: `With growth the fund must be $\\dfrac{${C}}{${rateStr(sP)}} = \\$${disp(PVgrow)}$; a level scholarship needs only $\\$${disp(PVlevel)}$. Inflation-proofing costs an extra \\$${disp(extra)} because growth eats ${gP} of the ${iP} points of return.`,
  };
};
