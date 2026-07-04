// gen-fin2-fill.js
// Parametric generators for three Financial Mathematics topics:
//   financial-mathematics.bonds-and-yields
//     fm2-bond-pricing-*, fm2-premium-par-discount-*, fm2-current-yield-ytm-*, fm2-rate-sensitivity-*
//   financial-mathematics.npv-and-irr
//     fm2-net-present-value-*, fm2-accept-reject-*, fm2-irr-*, fm2-comparing-projects-*
//   financial-mathematics.depreciation-and-inflation
//     fm2-straight-line-*, fm2-declining-balance-*, fm2-inflation-real-*, fm2-fisher-rate-*
//
// Self-contained pack: exports a `fill` map of template-name -> generator fn,
// matching the shape used by js/generator.js's registry. Template prefix: fm2-.
// Every generator is deterministic from the passed rng and has a FIXED
// difficulty + concept so tier coverage is exact. Every numeric answer is
// computed in the generator from the SAME parameters shown in the prompt, so
// prompt and answer never desync.
//
// Grader notes honored throughout (js/problem-engine.js):
//  - Money answers are emitted as exact two-decimal strings ("973.27") and the
//    instruction says to round to the nearest cent, no $ or commas. The sum of
//    displayed rounded parts is used as the primary answer so intermediate
//    steps are internally consistent.
//  - Rate/percent answers state "as a percent (a number, no % sign)" and match
//    the number shown; the decimal form is added to accept[] only where it
//    self-checks (extractNumber compares by value).
//  - Menu answers (premium/par/discount, accept/reject, up/down, which project)
//    are exact strings enumerated verbatim in the instruction, with generous
//    accept[] variants and NO digits inside the menu strings.
//  - (1+r)^t is written with ^ in hints; all arithmetic is done in JS here.

// ---------------------------------------------------------------------------
// shared helpers
// ---------------------------------------------------------------------------
// Round to the cent as a fixed 2-decimal string.
const money = (x) => (Math.round(x * 100) / 100).toFixed(2);
// Round to p decimals as a number (for annuity factors etc.); returns a string.
const rnd = (x, p) => `${Math.round(x * Math.pow(10, p)) / Math.pow(10, p)}`;
// Round to p decimals, keep as Number.
const rN = (x, p) => Math.round(x * Math.pow(10, p)) / Math.pow(10, p);
// Percent string from a decimal rate, rounded to p decimals.
const pct = (dec, p) => `${Math.round(dec * 100 * Math.pow(10, p)) / Math.pow(10, p)}`;
// Ordinary-annuity present-value factor (1 - (1+r)^-n)/r.
const annFactor = (r, n) => (1 - Math.pow(1 + r, -n)) / r;

export const fill = {};

// ===========================================================================
// TOPIC 1: financial-mathematics.bonds-and-yields
//   concepts: bond-pricing, premium-par-discount,
//             current-yield-and-ytm, interest-rate-sensitivity
// ===========================================================================

// --- bond-pricing (difficulty 1: par bond, coupon rate == market rate) ---
fill["fm2-bond-pricing-1"] = (rng, idx) => {
  const F = 1000;
  const rate = rng.pick([0.03, 0.04, 0.05]);           // coupon rate == market rate
  const n = rng.int(2, 4);
  const C = F * rate;                                    // whole-dollar coupon
  const r = rate;
  const af = annFactor(r, n);
  const coupPV = C * af;                                 // == F - facePV, sums to F
  const facePV = F / Math.pow(1 + r, n);
  const price = coupPV + facePV;                         // exactly 1000 for a par bond
  return {
    id: `gen.fm2-bond-pricing-1.${idx}`, generated: true, concepts: ["bond-pricing"], difficulty: 1, context: "applied",
    prompt: `A ${n}-year bond has face value \\$1,000 and an annual coupon of \\$${C} (coupon rate ${pct(rate, 2)}%). The market rate equals the coupon rate at ${pct(r, 2)}% per year. Price it with $C=${C}$, $r=${r}$, $n=${n}$.`,
    steps: [
      { instruction: `Compute the annuity factor $\\dfrac{1-(1+${r})^{-${n}}}{${r}}$ (round to 6 decimal places).`, answer: rnd(af, 6), accept: [], hint: `$(1+${r})^{-${n}} = ${rnd(Math.pow(1 + r, -n), 6)}$.` },
      { instruction: `Value the coupons: multiply the annuity factor by the \\$${C} coupon (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(coupPV), accept: [], hint: `$${C} \\times ${rnd(af, 6)}$.` },
      { instruction: `Value the face amount: $\\dfrac{1000}{(1+${r})^{${n}}}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(facePV), accept: [], hint: `$1000 / ${rnd(Math.pow(1 + r, n), 6)}$.` },
      { instruction: `Add the two parts for the price (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(price), accept: [money(rN(coupPV, 2) + rN(facePV, 2))], hint: `A par bond prices at face value.` },
    ],
    finalAnswer: { value: money(price), unit: "dollars" },
    solutionNarrative: `Coupons worth $${C}\\cdot${rnd(af, 6)} = \\$${money(coupPV)}$, face worth \\$${money(facePV)}$; the price is \\$${money(price)}$ — par, because the coupon rate equals the market rate.`,
  };
};

// --- bond-pricing (difficulty 2: discount bond, coupon < market) ---
fill["fm2-bond-pricing-2"] = (rng, idx) => {
  const F = 1000;
  const couponRate = rng.pick([0.04, 0.05]);
  const r = couponRate + rng.pick([0.01, 0.02]);        // market above coupon -> discount
  const n = rng.int(3, 5);
  const C = F * couponRate;
  const af = annFactor(r, n);
  const coupPV = C * af, facePV = F / Math.pow(1 + r, n);
  const price = rN(coupPV, 2) + rN(facePV, 2);
  return {
    id: `gen.fm2-bond-pricing-2.${idx}`, generated: true, concepts: ["bond-pricing"], difficulty: 2, context: "applied",
    prompt: `A ${n}-year bond has face value \\$1,000 and a ${pct(couponRate, 2)}% annual coupon (\\$${C} per year). The market rate is ${pct(r, 2)}% per year. Price it with $C=${C}$, $r=${r}$, $n=${n}$.`,
    steps: [
      { instruction: `Compute the annuity factor $\\dfrac{1-(1+${r})^{-${n}}}{${r}}$ (round to 6 decimal places).`, answer: rnd(af, 6), accept: [], hint: `$(1+${r})^{-${n}} = ${rnd(Math.pow(1 + r, -n), 6)}$.` },
      { instruction: `Value the coupons: $${C} \\times$ the annuity factor (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(coupPV), accept: [], hint: `$${C} \\times ${rnd(af, 6)}$.` },
      { instruction: `Value the face amount: $\\dfrac{1000}{(1+${r})^{${n}}}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(facePV), accept: [], hint: `$1000 / ${rnd(Math.pow(1 + r, n), 6)}$.` },
      { instruction: `Add the two parts for the price (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(price), accept: [money(coupPV + facePV)], hint: `A discount bond prices below \\$1,000.` },
    ],
    finalAnswer: { value: money(price), unit: "dollars" },
    solutionNarrative: `Coupons worth \\$${money(coupPV)}, face worth \\$${money(facePV)}; price \\$${money(price)} — a discount, since the ${pct(couponRate, 2)}% coupon is below the ${pct(r, 2)}% market rate.`,
  };
};

// --- bond-pricing (difficulty 3: premium bond, coupon > market) ---
fill["fm2-bond-pricing-3"] = (rng, idx) => {
  const F = 1000;
  const couponRate = rng.pick([0.06, 0.07, 0.08]);
  const r = couponRate - rng.pick([0.01, 0.02]);        // market below coupon -> premium
  const n = rng.int(3, 5);
  const C = F * couponRate;
  const af = annFactor(r, n);
  const coupPV = C * af, facePV = F / Math.pow(1 + r, n);
  const price = rN(coupPV, 2) + rN(facePV, 2);
  return {
    id: `gen.fm2-bond-pricing-3.${idx}`, generated: true, concepts: ["bond-pricing"], difficulty: 3, context: "applied",
    prompt: `A ${n}-year bond has face value \\$1,000 and a ${pct(couponRate, 2)}% annual coupon (\\$${C} per year). The market rate is ${pct(r, 2)}% per year. Price it with $C=${C}$, $r=${r}$, $n=${n}$.`,
    steps: [
      { instruction: `Compute the annuity factor $\\dfrac{1-(1+${r})^{-${n}}}{${r}}$ (round to 6 decimal places).`, answer: rnd(af, 6), accept: [], hint: `$(1+${r})^{-${n}} = ${rnd(Math.pow(1 + r, -n), 6)}$.` },
      { instruction: `Value the coupons: $${C} \\times$ the annuity factor (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(coupPV), accept: [], hint: `$${C} \\times ${rnd(af, 6)}$.` },
      { instruction: `Value the face amount: $\\dfrac{1000}{(1+${r})^{${n}}}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(facePV), accept: [], hint: `$1000 / ${rnd(Math.pow(1 + r, n), 6)}$.` },
      { instruction: `Add the two parts for the price (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(price), accept: [money(coupPV + facePV)], hint: `A premium bond prices above \\$1,000.` },
    ],
    finalAnswer: { value: money(price), unit: "dollars" },
    solutionNarrative: `Coupons worth \\$${money(coupPV)}, face worth \\$${money(facePV)}; price \\$${money(price)} — a premium, since the ${pct(couponRate, 2)}% coupon beats the ${pct(r, 2)}% market rate.`,
  };
};

// --- premium-par-discount (difficulty 1: coupon > market -> premium) ---
fill["fm2-premium-par-discount-1"] = (rng, idx) => {
  const market = rng.pick([3, 4, 5]);
  const coupon = market + rng.pick([1, 2]);             // strictly higher -> premium
  return {
    id: `gen.fm2-premium-par-discount-1.${idx}`, generated: true, concepts: ["premium-par-discount"], difficulty: 1, context: "applied",
    prompt: `A bond has a coupon rate of ${coupon}%. The current market rate is ${market}%. Does it sell at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`,
    steps: [
      { instruction: `Is the coupon rate higher than, equal to, or lower than the market rate? Answer exactly one of: higher, equal, lower.`, answer: "higher", accept: ["above", "greater"], hint: `Compare the two rates.` },
      { instruction: `A coupon rate higher than the market rate means the bond sells at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`, answer: "premium", accept: ["at a premium"], hint: `A richer-than-market coupon commands a price above face value.` },
    ],
    finalAnswer: { value: "premium", unit: "" },
    solutionNarrative: `The coupon rate (${coupon}%) exceeds the market rate (${market}%), so the bond sells above face value — at a premium.`,
  };
};

// --- premium-par-discount (difficulty 2: coupon < market -> discount) ---
fill["fm2-premium-par-discount-2"] = (rng, idx) => {
  const coupon = rng.pick([3, 3.5, 4]);
  const market = coupon + rng.pick([1, 1.5, 2]);        // strictly higher market -> discount
  return {
    id: `gen.fm2-premium-par-discount-2.${idx}`, generated: true, concepts: ["premium-par-discount"], difficulty: 2, context: "applied",
    prompt: `A bond has a coupon rate of ${coupon}%. The current market rate is ${market}%. Does it sell at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`,
    steps: [
      { instruction: `Compare the coupon rate to the market rate: is the coupon higher, equal, or lower? Answer exactly one of: higher, equal, lower.`, answer: "lower", accept: ["below", "less"], hint: `Compare the two rates.` },
      { instruction: `A coupon rate lower than the market rate means the bond sells at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`, answer: "discount", accept: ["at a discount"], hint: `An unattractive coupon must be priced below face value to sell.` },
    ],
    finalAnswer: { value: "discount", unit: "" },
    solutionNarrative: `The coupon rate (${coupon}%) is below the market rate (${market}%), so the bond trades at a discount.`,
  };
};

// --- premium-par-discount (difficulty 3: equal -> par) ---
fill["fm2-premium-par-discount-3"] = (rng, idx) => {
  const rate = rng.pick([4, 5, 6]);
  return {
    id: `gen.fm2-premium-par-discount-3.${idx}`, generated: true, concepts: ["premium-par-discount"], difficulty: 3, context: "applied",
    prompt: `A bond has a coupon rate of ${rate}%. Market rates move so that the current market rate is exactly ${rate}%. Does the bond sell at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`,
    steps: [
      { instruction: `Compare the coupon rate to the market rate: higher, equal, or lower? Answer exactly one of: higher, equal, lower.`, answer: "equal", accept: ["same", "equals"], hint: `Both rates are the same.` },
      { instruction: `When the coupon rate equals the market rate, the bond sells at a premium, at par, or at a discount? Answer exactly one of: premium, par, discount.`, answer: "par", accept: ["at par"], hint: `Equal rates mean the price equals the face value.` },
    ],
    finalAnswer: { value: "par", unit: "" },
    solutionNarrative: `When the coupon rate equals the market rate, there is no reason to price above or below face value — the bond trades at par.`,
  };
};

// --- current-yield-and-ytm (difficulty 1: clean current yield at par) ---
fill["fm2-current-yield-ytm-1"] = (rng, idx) => {
  const coupon = rng.pick([40, 50, 60, 80]);
  const price = 1000;
  const cyDec = coupon / price;
  return {
    id: `gen.fm2-current-yield-ytm-1.${idx}`, generated: true, concepts: ["current-yield-and-ytm"], difficulty: 1, context: "applied",
    prompt: `A bond pays an annual coupon of \\$${coupon} and currently trades at \\$${price}. Find its current yield, $\\text{CY} = \\dfrac{\\text{annual coupon}}{\\text{price}}$, as a percent.`,
    steps: [
      { instruction: `Divide the annual coupon by the price: $${coupon}/${price}$ (give the decimal).`, answer: rnd(cyDec, 4), accept: [], hint: `$${coupon} \\div ${price}$.` },
      { instruction: `Convert to a percent by multiplying by 100. Enter the current yield as a percent (a number, no % sign).`, answer: pct(cyDec, 2), accept: [rnd(cyDec, 4)], hint: `Multiply the decimal by 100.` },
    ],
    finalAnswer: { value: pct(cyDec, 2), unit: "percent" },
    solutionNarrative: `Current yield $= ${coupon}/${price} = ${rnd(cyDec, 4)} = ${pct(cyDec, 2)}\\%$; it equals the coupon rate because the bond trades at face value.`,
  };
};

// --- current-yield-and-ytm (difficulty 2: current yield off par) ---
fill["fm2-current-yield-ytm-2"] = (rng, idx) => {
  const coupon = rng.pick([40, 50, 60]);
  const price = rng.pick([920, 940, 960, 980, 1020, 1050]);
  const cyDec = coupon / price;
  return {
    id: `gen.fm2-current-yield-ytm-2.${idx}`, generated: true, concepts: ["current-yield-and-ytm"], difficulty: 2, context: "applied",
    prompt: `A bond pays an annual coupon of \\$${coupon} and currently trades at \\$${price}. Find its current yield as a percent (round to 2 decimal places).`,
    steps: [
      { instruction: `Divide the annual coupon by the price: $${coupon}/${price}$ (give the decimal, round to 6 places).`, answer: rnd(cyDec, 6), accept: [], hint: `$${coupon} \\div ${price}$.` },
      { instruction: `Multiply by 100 and round to 2 decimals. Enter the current yield as a percent (a number, no % sign).`, answer: pct(cyDec, 2), accept: [], hint: `$${rnd(cyDec, 6)} \\times 100$.` },
    ],
    finalAnswer: { value: pct(cyDec, 2), unit: "percent" },
    solutionNarrative: `Current yield $= ${coupon}/${price} = ${rnd(cyDec, 6)} = ${pct(cyDec, 2)}\\%$.`,
  };
};

// --- current-yield-and-ytm (difficulty 3: approximate YTM) ---
fill["fm2-current-yield-ytm-3"] = (rng, idx) => {
  const F = 1000;
  const coupon = rng.pick([40, 50, 60, 70]);
  const n = rng.pick([4, 5, 8, 10]);
  const disc = rng.pick([-120, -80, -60, 80, 100]);     // P - F, so P = F + disc
  const P = F + disc;
  const amort = (F - P) / n;                             // = -disc/n
  const numer = coupon + amort;
  const denom = (F + P) / 2;
  const ytmDec = numer / denom;
  return {
    id: `gen.fm2-current-yield-ytm-3.${idx}`, generated: true, concepts: ["current-yield-and-ytm"], difficulty: 3, context: "applied",
    prompt: `A bond has face value \\$1,000, an annual coupon of \\$${coupon}, price \\$${P}, and ${n} years to maturity. Approximate its yield to maturity using $\\text{YTM} \\approx \\dfrac{C + (F-P)/n}{(F+P)/2}$ with $C=${coupon}$, $F=1000$, $P=${P}$, $n=${n}$. Give the result as a percent (round to 2 decimal places).`,
    steps: [
      { instruction: `Compute the amortized gain/loss $(F-P)/n = (1000-${P})/${n}$ (give a number, watch the sign).`, answer: `${amort}`, accept: [], hint: `$(1000 - ${P}) = ${F - P}$, divided by ${n}$.` },
      { instruction: `Add it to the coupon for the numerator: $${coupon} + (${amort})$ (give a number).`, answer: `${numer}`, accept: [], hint: `$C + (F-P)/n$.` },
      { instruction: `Compute the denominator, the average of face and price: $(1000+${P})/2$ (give a number).`, answer: `${denom}`, accept: [], hint: `$${F + P} / 2$.` },
      { instruction: `Divide numerator by denominator, multiply by 100, and round to 2 decimals. Enter the YTM as a percent (a number, no % sign).`, answer: pct(ytmDec, 2), accept: [], hint: `$${numer} / ${denom} = ${rnd(ytmDec, 6)}$, times 100.` },
    ],
    finalAnswer: { value: pct(ytmDec, 2), unit: "percent" },
    solutionNarrative: `YTM $\\approx \\dfrac{${coupon} + (${amort})}{${denom}} = \\dfrac{${numer}}{${denom}} = ${rnd(ytmDec, 6)} = ${pct(ytmDec, 2)}\\%$.`,
  };
};

// --- interest-rate-sensitivity (difficulty 1: direction only) ---
fill["fm2-rate-sensitivity-1"] = (rng, idx) => {
  const down = rng.int(0, 1) === 0;                     // rates fall -> price up
  const dir = down ? "fall" : "rise";
  const priceDir = down ? "up" : "down";
  const priceOk = down ? ["rises", "increases", "higher"] : ["falls", "decreases", "lower"];
  return {
    id: `gen.fm2-rate-sensitivity-1.${idx}`, generated: true, concepts: ["interest-rate-sensitivity"], difficulty: 1, context: "applied",
    prompt: `You hold a bond with a fixed coupon. Market interest rates ${dir}. Does the price of your bond go up or down? Answer exactly one of: up, down.`,
    steps: [
      { instruction: `Bond prices and market rates move in opposite directions. Rates went ${down ? "down" : "up"}, so the price goes which way? Answer exactly one of: up, down.`, answer: priceDir, accept: priceOk, hint: `Prices move opposite to rates.` },
    ],
    finalAnswer: { value: priceDir, unit: "" },
    solutionNarrative: `Prices move opposite to rates: rates ${dir}, so the price goes ${priceDir}.`,
  };
};

// --- interest-rate-sensitivity (difficulty 2: re-price, rate rises -> discount) ---
fill["fm2-rate-sensitivity-2"] = (rng, idx) => {
  const F = 1000;
  const couponRate = rng.pick([0.04, 0.05]);
  const r = couponRate + rng.pick([0.02, 0.03]);        // new higher rate -> below par
  const n = rng.int(3, 4);
  const C = F * couponRate;
  const af = annFactor(r, n);
  const coupPV = C * af, facePV = F / Math.pow(1 + r, n);
  const price = coupPV + facePV;                         // true price
  return {
    id: `gen.fm2-rate-sensitivity-2.${idx}`, generated: true, concepts: ["interest-rate-sensitivity"], difficulty: 2, context: "applied",
    prompt: `A ${n}-year, \\$1,000 face-value bond with a ${pct(couponRate, 2)}% annual coupon (\\$${C}) was priced at par. Now the market rate rises to ${pct(r, 2)}%. Re-price it at $r=${r}$, $n=${n}$, $C=${C}$.`,
    steps: [
      { instruction: `Will the new price be above or below \\$1,000? Answer exactly one of: above, below.`, answer: "below", accept: ["under", "lower"], hint: `Rates rose above the coupon, so the price falls below face value.` },
      { instruction: `Compute the annuity factor $\\dfrac{1-(1+${r})^{-${n}}}{${r}}$ (round to 6 decimal places).`, answer: rnd(af, 6), accept: [], hint: `$(1+${r})^{-${n}} = ${rnd(Math.pow(1 + r, -n), 6)}$.` },
      { instruction: `Value the coupons: $${C} \\times$ the annuity factor (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(coupPV), accept: [], hint: `$${C} \\times ${rnd(af, 6)}$.` },
      { instruction: `Value the face: $\\dfrac{1000}{(1+${r})^{${n}}}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(facePV), accept: [], hint: `$1000 / ${rnd(Math.pow(1 + r, n), 6)}$.` },
      { instruction: `Add for the new price (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(price), accept: [money(rN(coupPV, 2) + rN(facePV, 2))], hint: `Sum the two present values.` },
    ],
    finalAnswer: { value: money(price), unit: "dollars" },
    solutionNarrative: `At ${pct(r, 2)}%: coupons \\$${money(coupPV)}, face \\$${money(facePV)}, price \\$${money(price)} — below par, confirming a rate rise pushes the price down.`,
  };
};

// --- interest-rate-sensitivity (difficulty 3: re-price, rate falls -> premium) ---
fill["fm2-rate-sensitivity-3"] = (rng, idx) => {
  const F = 1000;
  const couponRate = rng.pick([0.06, 0.07]);
  const r = couponRate - rng.pick([0.02, 0.03]);        // new lower rate -> above par
  const n = rng.int(3, 4);
  const C = F * couponRate;
  const af = annFactor(r, n);
  const coupPV = C * af, facePV = F / Math.pow(1 + r, n);
  const price = coupPV + facePV;
  return {
    id: `gen.fm2-rate-sensitivity-3.${idx}`, generated: true, concepts: ["interest-rate-sensitivity"], difficulty: 3, context: "applied",
    prompt: `A ${n}-year, \\$1,000 face-value bond with a ${pct(couponRate, 2)}% annual coupon (\\$${C}) is held when the market rate drops to ${pct(r, 2)}%. Re-price it at $r=${r}$, $n=${n}$, $C=${C}$.`,
    steps: [
      { instruction: `Will the new price be above or below \\$1,000? Answer exactly one of: above, below.`, answer: "above", accept: ["over", "higher"], hint: `The coupon now beats the market rate, so the price is a premium.` },
      { instruction: `Compute the annuity factor $\\dfrac{1-(1+${r})^{-${n}}}{${r}}$ (round to 6 decimal places).`, answer: rnd(af, 6), accept: [], hint: `$(1+${r})^{-${n}} = ${rnd(Math.pow(1 + r, -n), 6)}$.` },
      { instruction: `Value the coupons: $${C} \\times$ the annuity factor (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(coupPV), accept: [], hint: `$${C} \\times ${rnd(af, 6)}$.` },
      { instruction: `Value the face: $\\dfrac{1000}{(1+${r})^{${n}}}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(facePV), accept: [], hint: `$1000 / ${rnd(Math.pow(1 + r, n), 6)}$.` },
      { instruction: `Add for the new price (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(price), accept: [money(rN(coupPV, 2) + rN(facePV, 2))], hint: `Sum the two present values.` },
    ],
    finalAnswer: { value: money(price), unit: "dollars" },
    solutionNarrative: `At ${pct(r, 2)}%: coupons \\$${money(coupPV)}, face \\$${money(facePV)}, price \\$${money(price)} — a premium, confirming a rate drop lifts the price.`,
  };
};

// ===========================================================================
// TOPIC 2: financial-mathematics.npv-and-irr
//   concepts: net-present-value, accept-reject-rule,
//             internal-rate-of-return, comparing-projects
// ===========================================================================

// --- net-present-value (difficulty 1: single cash flow) ---
fill["fm2-net-present-value-1"] = (rng, idx) => {
  const C0 = rng.pick([800, 1000, 1200, 1500]);
  const r = rng.pick([0.05, 0.08, 0.10]);
  const cf1 = rng.pick([1100, 1200, 1300, 1400, 1600, 1800]);
  const pv1 = cf1 / (1 + r);
  const npv = rN(pv1, 2) - C0;
  return {
    id: `gen.fm2-net-present-value-1.${idx}`, generated: true, concepts: ["net-present-value"], difficulty: 1, context: "applied",
    prompt: `A project costs \\$${C0} today and returns a single \\$${cf1} one year from now. The required rate is ${pct(r, 2)}%. Find the NPV using $\\text{NPV} = \\dfrac{CF_1}{1+r} - C_0$.`,
    steps: [
      { instruction: `Discount the \\$${cf1} back one year: $${cf1}/(1+${r})$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv1), accept: [], hint: `$${cf1} \\div ${1 + r}$.` },
      { instruction: `Subtract the \\$${C0} initial cost for the NPV (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(npv), accept: [], hint: `$${money(pv1)} - ${C0}$.` },
    ],
    finalAnswer: { value: money(npv), unit: "dollars" },
    solutionNarrative: `The \\$${cf1} is worth $${cf1}/(1+${r}) = \\$${money(pv1)}$ today; minus the \\$${C0} cost, NPV $= \\$${money(npv)}$.`,
  };
};

// --- net-present-value (difficulty 2: two cash flows) ---
fill["fm2-net-present-value-2"] = (rng, idx) => {
  const C0 = rng.pick([1000, 1200, 1500]);
  const r = rng.pick([0.08, 0.10]);
  const cf1 = rng.pick([500, 600, 700, 800]);
  const cf2 = rng.pick([600, 700, 800, 900]);
  const pv1 = cf1 / (1 + r), pv2 = cf2 / Math.pow(1 + r, 2);
  const sumPV = rN(pv1, 2) + rN(pv2, 2);
  const npv = sumPV - C0;
  return {
    id: `gen.fm2-net-present-value-2.${idx}`, generated: true, concepts: ["net-present-value"], difficulty: 2, context: "applied",
    prompt: `A project costs \\$${C0} today and returns \\$${cf1} at the end of year 1 and \\$${cf2} at the end of year 2. The required rate is ${pct(r, 2)}%. Find the NPV.`,
    steps: [
      { instruction: `Present value of year 1: $${cf1}/(1+${r})$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv1), accept: [], hint: `$${cf1} \\div ${1 + r}$.` },
      { instruction: `Present value of year 2: $${cf2}/(1+${r})^2$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv2), accept: [], hint: `$${cf2} \\div ${rnd(Math.pow(1 + r, 2), 4)}$.` },
      { instruction: `Add the two present values (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(sumPV), accept: [money(pv1 + pv2)], hint: `$${money(pv1)} + ${money(pv2)}$.` },
      { instruction: `Subtract the \\$${C0} cost for the NPV (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(npv), accept: [money(pv1 + pv2 - C0)], hint: `$${money(sumPV)} - ${C0}$.` },
    ],
    finalAnswer: { value: money(npv), unit: "dollars" },
    solutionNarrative: `PVs are \\$${money(pv1)} and \\$${money(pv2)}, summing to \\$${money(sumPV)}. NPV $= ${money(sumPV)} - ${C0} = \\$${money(npv)}$.`,
  };
};

// --- net-present-value (difficulty 3: three cash flows) ---
fill["fm2-net-present-value-3"] = (rng, idx) => {
  const C0 = rng.pick([4000, 5000, 6000]);
  const r = rng.pick([0.10, 0.12]);
  const cf1 = rng.pick([1500, 2000, 2500]);
  const cf2 = rng.pick([2000, 2500, 3000]);
  const cf3 = rng.pick([2500, 3000, 3500]);
  const pv1 = cf1 / (1 + r), pv2 = cf2 / Math.pow(1 + r, 2), pv3 = cf3 / Math.pow(1 + r, 3);
  const sumPV = rN(pv1, 2) + rN(pv2, 2) + rN(pv3, 2);
  const npv = sumPV - C0;
  return {
    id: `gen.fm2-net-present-value-3.${idx}`, generated: true, concepts: ["net-present-value"], difficulty: 3, context: "applied",
    prompt: `A project costs \\$${C0} today and returns \\$${cf1}, \\$${cf2}, and \\$${cf3} at the ends of years 1, 2, and 3. The required rate is ${pct(r, 2)}%. Find the NPV.`,
    steps: [
      { instruction: `PV of year 1: $${cf1}/(1+${r})$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv1), accept: [], hint: `$${cf1} \\div ${1 + r}$.` },
      { instruction: `PV of year 2: $${cf2}/(1+${r})^2$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv2), accept: [], hint: `$${cf2} \\div ${rnd(Math.pow(1 + r, 2), 6)}$.` },
      { instruction: `PV of year 3: $${cf3}/(1+${r})^3$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(pv3), accept: [], hint: `$${cf3} \\div ${rnd(Math.pow(1 + r, 3), 6)}$.` },
      { instruction: `Sum the three present values (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(sumPV), accept: [money(pv1 + pv2 + pv3)], hint: `Add the three PVs.` },
      { instruction: `Subtract the \\$${C0} cost for the NPV (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(npv), accept: [money(pv1 + pv2 + pv3 - C0)], hint: `$${money(sumPV)} - ${C0}$.` },
    ],
    finalAnswer: { value: money(npv), unit: "dollars" },
    solutionNarrative: `The PVs are \\$${money(pv1)}, \\$${money(pv2)}, \\$${money(pv3)}, summing to \\$${money(sumPV)}. NPV $= ${money(sumPV)} - ${C0} = \\$${money(npv)}$.`,
  };
};

// --- accept-reject-rule (difficulty 1: NPV sign) ---
fill["fm2-accept-reject-1"] = (rng, idx) => {
  const positive = rng.int(0, 1) === 0;
  const npv = positive ? rng.pick([120, 300, 450, 800]) : -rng.pick([90, 120, 250, 400]);
  const sign = positive ? "positive" : "negative";
  const decision = positive ? "accept" : "reject";
  const signOk = positive ? ["above zero"] : ["below zero"];
  const decOk = positive ? ["yes"] : ["no"];
  return {
    id: `gen.fm2-accept-reject-1.${idx}`, generated: true, concepts: ["accept-reject-rule"], difficulty: 1, context: "applied",
    prompt: `A project has a net present value of \\$${npv}. Using the NPV rule, should you accept or reject it? Answer exactly one of: accept, reject.`,
    steps: [
      { instruction: `Is the NPV positive or negative? Answer exactly one of: positive, negative.`, answer: sign, accept: signOk, hint: `Compare the NPV to zero.` },
      { instruction: `The NPV rule accepts positive-NPV projects and rejects negative ones. Accept or reject? Answer exactly one of: accept, reject.`, answer: decision, accept: decOk, hint: `A ${sign} NPV means the project ${positive ? "adds" : "destroys"} value.` },
    ],
    finalAnswer: { value: decision, unit: "" },
    solutionNarrative: `NPV is \\$${npv}, which is ${sign}, so by the accept-reject rule you ${decision}.`,
  };
};

// --- accept-reject-rule (difficulty 2: level payback) ---
fill["fm2-accept-reject-2"] = (rng, idx) => {
  const annual = rng.pick([300, 400, 500, 600]);
  const years = rng.pick([2, 3, 4]);
  const C0 = annual * years;                             // clean integer payback
  const req = years + rng.pick([1, 2]);                  // within requirement
  return {
    id: `gen.fm2-accept-reject-2.${idx}`, generated: true, concepts: ["accept-reject-rule"], difficulty: 2, context: "applied",
    prompt: `A project costs \\$${C0} and returns level cash flows of \\$${annual} per year. Find the payback period (in years) using $\\text{payback} = C_0/(\\text{annual cash flow})$, then apply the accept-reject rule if the firm requires payback within ${req} years.`,
    steps: [
      { instruction: `Compute the payback period: $${C0}/${annual}$ (give a number of years).`, answer: `${years}`, accept: [`${years}.0`, `${years} years`], hint: `$${C0} \\div ${annual}$.` },
      { instruction: `Is ${years} years within the ${req}-year requirement? Answer exactly one of: yes, no.`, answer: "yes", accept: ["within"], hint: `Compare ${years} to ${req}.` },
      { instruction: `By the payback screen, accept or reject? Answer exactly one of: accept, reject.`, answer: "accept", accept: ["yes"], hint: `Recovering the cost inside the window passes the screen.` },
    ],
    finalAnswer: { value: `${years}`, unit: "years" },
    solutionNarrative: `Payback $= ${C0}/${annual} = ${years}$ years, inside the ${req}-year requirement, so it is accepted.`,
  };
};

// --- accept-reject-rule (difficulty 3: uneven payback, fractional year) ---
fill["fm2-accept-reject-3"] = (rng, idx) => {
  const annual = rng.pick([400, 500, 600]);
  const C0 = annual * 2 + annual / 2;                    // recovers 2.5 years worth
  const after2 = annual * 2;
  const remaining = C0 - after2;                         // = annual/2
  const frac = remaining / annual;                       // 0.5
  const payback = 2 + frac;                              // 2.5
  return {
    id: `gen.fm2-accept-reject-3.${idx}`, generated: true, concepts: ["accept-reject-rule"], difficulty: 3, context: "applied",
    prompt: `A project costs \\$${C0} and returns level cash flows of \\$${annual}, \\$${annual}, and \\$${annual}. Find the payback period by accumulating cash flows until they reach \\$${C0}.`,
    steps: [
      { instruction: `Cumulative cash flow after 2 years: $${annual} + ${annual}$ (give a number).`, answer: `${after2}`, accept: [], hint: `Add the first two years.` },
      { instruction: `How much more is needed after year 2 to reach \\$${C0}? (give a number).`, answer: `${remaining}`, accept: [], hint: `$${C0} - ${after2}$.` },
      { instruction: `What fraction of year 3 (which brings \\$${annual}) recovers the remaining \\$${remaining}? Give the decimal $${remaining}/${annual}$.`, answer: rnd(frac, 4), accept: ["1/2"], hint: `$${remaining} \\div ${annual}$.` },
      { instruction: `Add the whole years to the fraction: $2 + ${rnd(frac, 4)}$ (give the payback in years).`, answer: rnd(payback, 4), accept: [`${payback} years`], hint: `Two full years plus the fraction of the third.` },
    ],
    finalAnswer: { value: rnd(payback, 4), unit: "years" },
    solutionNarrative: `After 2 years \\$${after2} is recovered; the remaining \\$${remaining} is ${rnd(frac, 4)} of year 3, so payback $= ${rnd(payback, 4)}$ years.`,
  };
};

// --- internal-rate-of-return (difficulty 1: one-period exact) ---
fill["fm2-irr-1"] = (rng, idx) => {
  const C0 = rng.pick([500, 800, 1000, 1200]);
  const irr = rng.pick([0.10, 0.15, 0.20, 0.25]);
  const cf1 = Math.round(C0 * (1 + irr));               // integer return
  const ratio = cf1 / C0;
  const irrDec = ratio - 1;
  return {
    id: `gen.fm2-irr-1.${idx}`, generated: true, concepts: ["internal-rate-of-return"], difficulty: 1, context: "applied",
    prompt: `A project costs \\$${C0} today and returns \\$${cf1} in one year. Find its IRR using $\\text{IRR} = \\dfrac{CF_1}{C_0} - 1$, as a percent.`,
    steps: [
      { instruction: `Compute $CF_1/C_0 = ${cf1}/${C0}$ (give the decimal).`, answer: rnd(ratio, 6), accept: [], hint: `$${cf1} \\div ${C0}$.` },
      { instruction: `Subtract 1 to get the IRR as a decimal.`, answer: rnd(irrDec, 6), accept: [], hint: `$${rnd(ratio, 6)} - 1$.` },
      { instruction: `Convert to a percent. Enter the IRR as a percent (a number, no % sign).`, answer: pct(irrDec, 2), accept: [rnd(irrDec, 6)], hint: `Multiply the decimal by 100.` },
    ],
    finalAnswer: { value: pct(irrDec, 2), unit: "percent" },
    solutionNarrative: `$\\text{IRR} = ${cf1}/${C0} - 1 = ${rnd(irrDec, 6)} = ${pct(irrDec, 2)}\\%$.`,
  };
};

// --- internal-rate-of-return (difficulty 2: one-period exact, different framing) ---
fill["fm2-irr-2"] = (rng, idx) => {
  const C0 = rng.pick([1000, 2000, 2500, 4000]);
  const irr = rng.pick([0.12, 0.15, 0.18]);
  const cf1 = Math.round(C0 * (1 + irr));
  const ratio = cf1 / C0;
  const irrDec = ratio - 1;
  return {
    id: `gen.fm2-irr-2.${idx}`, generated: true, concepts: ["internal-rate-of-return"], difficulty: 2, context: "applied",
    prompt: `You invest \\$${C0} and receive \\$${cf1} one year later. Find the IRR as a percent using $\\text{IRR} = CF_1/C_0 - 1$.`,
    steps: [
      { instruction: `Compute $${cf1}/${C0}$ (give the decimal).`, answer: rnd(ratio, 6), accept: [], hint: `$${cf1} \\div ${C0}$.` },
      { instruction: `Subtract 1 (give the decimal).`, answer: rnd(irrDec, 6), accept: [], hint: `$${rnd(ratio, 6)} - 1$.` },
      { instruction: `Convert to a percent. Enter the IRR as a percent (a number, no % sign).`, answer: pct(irrDec, 2), accept: [rnd(irrDec, 6)], hint: `Multiply the decimal by 100.` },
    ],
    finalAnswer: { value: pct(irrDec, 2), unit: "percent" },
    solutionNarrative: `$\\text{IRR} = ${cf1}/${C0} - 1 = ${rnd(irrDec, 6)} = ${pct(irrDec, 2)}\\%$.`,
  };
};

// --- internal-rate-of-return (difficulty 3: interpolate between two NPVs) ---
fill["fm2-irr-3"] = (rng, idx) => {
  const r1 = rng.pick([6, 8, 10]);
  const gap = rng.pick([2, 4]);
  const r2 = r1 + gap;
  const npv1 = rng.pick([40, 50, 60, 80, 100]);          // positive at r1
  const npv2 = -rng.pick([20, 30, 40, 60]);              // negative at r2
  const denom = npv1 - npv2;
  const frac = npv1 / denom;
  const add = gap * frac;
  const irr = r1 + add;
  return {
    id: `gen.fm2-irr-3.${idx}`, generated: true, concepts: ["internal-rate-of-return"], difficulty: 3, context: "applied",
    prompt: `For a project, the NPV is $+\\$${npv1}$ at a discount rate of ${r1}% and $-\\$${-npv2}$ at ${r2}%. Interpolate to estimate the IRR (where NPV $= 0$) using $\\text{IRR} \\approx r_1 + (r_2-r_1)\\dfrac{\\text{NPV}_1}{\\text{NPV}_1 - \\text{NPV}_2}$. Give the IRR as a percent (round to 2 decimals).`,
    steps: [
      { instruction: `Compute the denominator $\\text{NPV}_1 - \\text{NPV}_2 = ${npv1} - (${npv2})$ (give a number).`, answer: `${denom}`, accept: [], hint: `$${npv1} + ${-npv2} = ${denom}$.` },
      { instruction: `Compute the fraction $\\text{NPV}_1/(\\text{NPV}_1 - \\text{NPV}_2) = ${npv1}/${denom}$ (give the decimal, round to 6 places).`, answer: rnd(frac, 6), accept: [], hint: `$${npv1} \\div ${denom}$.` },
      { instruction: `Multiply by the rate gap $(r_2 - r_1) = ${gap}$ percentage points: $${gap} \\times ${rnd(frac, 6)}$ (round to 4 decimals).`, answer: rnd(add, 4), accept: [], hint: `$${gap} \\times ${rnd(frac, 6)}$.` },
      { instruction: `Add to $r_1 = ${r1}$, round to 2 decimals. Enter the IRR as a percent (a number, no % sign).`, answer: pct(irr / 100, 2), accept: [], hint: `$${r1} + ${rnd(add, 4)}$.` },
    ],
    finalAnswer: { value: pct(irr / 100, 2), unit: "percent" },
    solutionNarrative: `NPV crosses zero between ${r1}% and ${r2}%. Interpolating: $${r1} + ${gap}\\cdot\\dfrac{${npv1}}{${denom}} = ${r1} + ${rnd(add, 4)} = ${pct(irr / 100, 2)}\\%$.`,
  };
};

// --- comparing-projects (difficulty 1: rank by NPV) ---
fill["fm2-comparing-projects-1"] = (rng, idx) => {
  const npvA = rng.pick([500, 700, 800, 900]);
  const npvB = npvA + rng.pick([200, 300, 400]);        // B strictly higher
  return {
    id: `gen.fm2-comparing-projects-1.${idx}`, generated: true, concepts: ["comparing-projects"], difficulty: 1, context: "applied",
    prompt: `You can fund only one project. Project A has an NPV of \\$${npvA}; Project B has an NPV of \\$${npvB}. Which should you choose? Answer exactly one of: A, B.`,
    steps: [
      { instruction: `Which project has the higher NPV? Answer exactly one of: A, B.`, answer: "B", accept: ["project b"], hint: `Compare the two NPVs.` },
      { instruction: `For mutually exclusive projects you take the higher NPV. Which do you choose? Answer exactly one of: A, B.`, answer: "B", accept: ["project b"], hint: `Higher NPV adds more value.` },
    ],
    finalAnswer: { value: "B", unit: "" },
    solutionNarrative: `Project B's NPV (\\$${npvB}) exceeds A's (\\$${npvA}), so you choose B.`,
  };
};

// --- comparing-projects (difficulty 2: compute and rank two one-period NPVs) ---
fill["fm2-comparing-projects-2"] = (rng, idx) => {
  const C0 = 1000;
  const r = rng.pick([0.05, 0.08]);
  const retA = rng.pick([1120, 1150, 1200]);
  const retB = retA - rng.pick([30, 50, 80]);           // B returns less -> lower NPV
  const npvA = rN(retA / (1 + r), 2) - C0;
  const npvB = rN(retB / (1 + r), 2) - C0;
  return {
    id: `gen.fm2-comparing-projects-2.${idx}`, generated: true, concepts: ["comparing-projects"], difficulty: 2, context: "applied",
    prompt: `Two independent one-year projects, each costing \\$1,000 at a ${pct(r, 2)}% required rate. Project A returns \\$${retA}; Project B returns \\$${retB}. Rank them by NPV.`,
    steps: [
      { instruction: `NPV of A: $${retA}/(1+${r}) - 1000$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(npvA), accept: [], hint: `$${retA}/(1+${r}) = ${money(retA / (1 + r))}$, minus 1000.` },
      { instruction: `NPV of B: $${retB}/(1+${r}) - 1000$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(npvB), accept: [], hint: `$${retB}/(1+${r}) = ${money(retB / (1 + r))}$, minus 1000.` },
      { instruction: `Which project has the higher NPV? Answer exactly one of: A, B.`, answer: "A", accept: ["project a"], hint: `A returns more, so its NPV is higher.` },
    ],
    finalAnswer: { value: "A", unit: "" },
    solutionNarrative: `NPV$_A = \\$${money(npvA)}$ and NPV$_B = \\$${money(npvB)}$, so A ranks higher.`,
  };
};

// --- comparing-projects (difficulty 3: NPV vs IRR conflict) ---
fill["fm2-comparing-projects-3"] = (rng, idx) => {
  // Small project: high IRR, low NPV. Large project: lower IRR, higher NPV.
  const smallC0 = rng.pick([100, 200]);
  const smallIrr = rng.pick([40, 50]);
  const largeC0 = rng.pick([1000, 2000]);
  const largeIrr = rng.pick([25, 30]);
  return {
    id: `gen.fm2-comparing-projects-3.${idx}`, generated: true, concepts: ["comparing-projects"], difficulty: 3, context: "applied",
    prompt: `Two mutually exclusive projects. Small: cost \\$${smallC0}, IRR ${smallIrr}%, but a low NPV. Large: cost \\$${largeC0}, IRR ${largeIrr}%, but a high NPV. IRR and NPV disagree on the ranking. Decide which to fund.`,
    steps: [
      { instruction: `Which project has the higher IRR? Answer exactly one of: small, large.`, answer: "small", accept: ["the small one"], hint: `Compare the two IRRs.` },
      { instruction: `Which project has the higher NPV? Answer exactly one of: small, large.`, answer: "large", accept: ["the large one"], hint: `The larger project adds more total dollars.` },
      { instruction: `When NPV and IRR conflict for mutually exclusive projects, you follow which measure? Answer exactly one of: NPV, IRR.`, answer: "NPV", accept: ["net present value"], hint: `Maximize dollars of value, not the percentage.` },
      { instruction: `So which project do you fund? Answer exactly one of: small, large.`, answer: "large", accept: ["the large one"], hint: `The higher-NPV project adds more total value.` },
    ],
    finalAnswer: { value: "large", unit: "" },
    solutionNarrative: `The small project wins on IRR (${smallIrr}% vs ${largeIrr}%) but the large project wins on NPV. For mutually exclusive projects you follow NPV, so you fund the large project.`,
  };
};

// ===========================================================================
// TOPIC 3: financial-mathematics.depreciation-and-inflation
//   concepts: straight-line-depreciation, declining-balance,
//             inflation-and-real-value, fisher-real-rate
// ===========================================================================

// --- straight-line-depreciation (difficulty 1: annual depreciation) ---
fill["fm2-straight-line-1"] = (rng, idx) => {
  const life = rng.pick([4, 5, 8]);
  const salvage = rng.pick([1000, 2000, 5000]);
  const deprec = rng.pick([1500, 2000, 2500, 3000]);    // per-year amount
  const cost = salvage + deprec * life;                 // integer cost
  const depreciable = cost - salvage;
  return {
    id: `gen.fm2-straight-line-1.${idx}`, generated: true, concepts: ["straight-line-depreciation"], difficulty: 1, context: "applied",
    prompt: `A machine costs \\$${cost}, has a salvage value of \\$${salvage}, and a useful life of ${life} years. Find the annual straight-line depreciation using $\\dfrac{\\text{cost} - \\text{salvage}}{\\text{life}}$.`,
    steps: [
      { instruction: `Compute the depreciable amount: cost minus salvage, $${cost} - ${salvage}$ (give a number).`, answer: `${depreciable}`, accept: [], hint: `$${cost} - ${salvage}$.` },
      { instruction: `Divide by the ${life}-year life for the annual depreciation (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(deprec), accept: [`${deprec}`], hint: `$${depreciable} \\div ${life}$.` },
    ],
    finalAnswer: { value: money(deprec), unit: "dollars per year" },
    solutionNarrative: `Depreciable amount $${cost} - ${salvage} = \\$${depreciable}$, over ${life} years: \\$${money(deprec)} per year.`,
  };
};

// --- straight-line-depreciation (difficulty 2: book value after k years) ---
fill["fm2-straight-line-2"] = (rng, idx) => {
  const life = rng.pick([5, 8, 10]);
  const salvage = rng.pick([1000, 2000]);
  const deprec = rng.pick([1500, 2000, 2500]);
  const cost = salvage + deprec * life;
  const k = rng.int(2, life - 1);
  const totalDep = deprec * k;
  const book = cost - totalDep;
  return {
    id: `gen.fm2-straight-line-2.${idx}`, generated: true, concepts: ["straight-line-depreciation"], difficulty: 2, context: "applied",
    prompt: `A \\$${cost} machine has a salvage value of \\$${salvage} and a ${life}-year life. Find its book value after ${k} years using straight-line depreciation.`,
    steps: [
      { instruction: `Annual depreciation: $(${cost} - ${salvage})/${life}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(deprec), accept: [`${deprec}`], hint: `$${cost - salvage} \\div ${life}$.` },
      { instruction: `Total depreciation over ${k} years: $${k} \\times ${deprec}$ (give a number).`, answer: `${totalDep}`, accept: [], hint: `$${k} \\times ${deprec}$.` },
      { instruction: `Book value: cost minus ${k} years of depreciation, $${cost} - ${totalDep}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(book), accept: [`${book}`], hint: `$${cost} - ${totalDep}$.` },
    ],
    finalAnswer: { value: money(book), unit: "dollars" },
    solutionNarrative: `Annual depreciation \\$${money(deprec)}; after ${k} years the book value is $${cost} - ${k}\\cdot${deprec} = \\$${money(book)}$.`,
  };
};

// --- straight-line-depreciation (difficulty 3: larger, later book value) ---
fill["fm2-straight-line-3"] = (rng, idx) => {
  const life = rng.pick([8, 10]);
  const salvage = rng.pick([3000, 5000]);
  const deprec = rng.pick([3000, 3500, 3750]);
  const cost = salvage + deprec * life;
  const k = rng.int(Math.ceil(life / 2), life - 1);
  const totalDep = deprec * k;
  const book = cost - totalDep;
  return {
    id: `gen.fm2-straight-line-3.${idx}`, generated: true, concepts: ["straight-line-depreciation"], difficulty: 3, context: "applied",
    prompt: `A vehicle costs \\$${cost}, has a salvage value of \\$${salvage}, and a ${life}-year life. Find its book value after ${k} years using straight-line depreciation.`,
    steps: [
      { instruction: `Annual depreciation: $(${cost} - ${salvage})/${life}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(deprec), accept: [`${deprec}`], hint: `$${cost - salvage} \\div ${life}$.` },
      { instruction: `Total depreciation over ${k} years: $${k} \\times ${deprec}$ (give a number).`, answer: `${totalDep}`, accept: [], hint: `$${k} \\times ${deprec}$.` },
      { instruction: `Book value: $${cost} - ${totalDep}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(book), accept: [`${book}`], hint: `$${cost} - ${totalDep}$.` },
    ],
    finalAnswer: { value: money(book), unit: "dollars" },
    solutionNarrative: `Annual depreciation \\$${money(deprec)}; after ${k} years the book value is $${cost} - ${k}\\cdot${deprec} = \\$${money(book)}$.`,
  };
};

// --- declining-balance (difficulty 1: rate + book value after 1 year) ---
fill["fm2-declining-balance-1"] = (rng, idx) => {
  const life = rng.pick([4, 5]);
  const cost = rng.pick([8000, 10000, 12000]);
  const d = 2 / life;
  const keep = 1 - d;
  const book1 = cost * keep;
  return {
    id: `gen.fm2-declining-balance-1.${idx}`, generated: true, concepts: ["declining-balance"], difficulty: 1, context: "applied",
    prompt: `A \\$${cost} asset has a ${life}-year life and is depreciated by the double-declining-balance method. Find the depreciation rate $d = 2/\\text{life}$ and the book value after 1 year.`,
    steps: [
      { instruction: `Compute the double-declining rate $d = 2/${life}$ (give the decimal).`, answer: rnd(d, 4), accept: [`2/${life}`], hint: `$2 \\div ${life}$.` },
      { instruction: `Each year keeps $(1 - d)$ of value. Compute $1 - ${rnd(d, 4)}$ (give the decimal).`, answer: rnd(keep, 4), accept: [], hint: `$1 - ${rnd(d, 4)}$.` },
      { instruction: `Book value after 1 year: $${cost} \\times ${rnd(keep, 4)}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(book1), accept: [], hint: `$${cost} \\times ${rnd(keep, 4)}$.` },
    ],
    finalAnswer: { value: money(book1), unit: "dollars" },
    solutionNarrative: `$d = 2/${life} = ${rnd(d, 4)}$, so each year keeps ${rnd(keep, 4)}; after 1 year the book value is $${cost}\\cdot${rnd(keep, 4)} = \\$${money(book1)}$.`,
  };
};

// --- declining-balance (difficulty 2: book value after k years) ---
fill["fm2-declining-balance-2"] = (rng, idx) => {
  const life = 5;                                        // d = 0.4, keep = 0.6
  const cost = rng.pick([15000, 20000, 25000]);
  const d = 2 / life, keep = 1 - d;                      // 0.6
  const k = rng.pick([2, 3]);
  const factor = Math.pow(keep, k);                      // 0.36 or 0.216
  const book = cost * factor;
  return {
    id: `gen.fm2-declining-balance-2.${idx}`, generated: true, concepts: ["declining-balance"], difficulty: 2, context: "applied",
    prompt: `A \\$${cost} asset with a ${life}-year life is depreciated by double-declining balance ($d = ${rnd(d, 4)}$). Find its book value after ${k} years using $\\text{book value} = \\text{cost}\\cdot(1-d)^k$.`,
    steps: [
      { instruction: `The yearly retention factor is $1 - ${rnd(d, 4)} = ${rnd(keep, 4)}$. Compute $${rnd(keep, 4)}^${k}$ (round to 4 decimal places).`, answer: rnd(factor, 4), accept: [], hint: `Multiply ${rnd(keep, 4)} by itself ${k} times.` },
      { instruction: `Book value after ${k} years: $${cost} \\times ${rnd(factor, 4)}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(book), accept: [], hint: `$${cost} \\times ${rnd(factor, 4)}$.` },
    ],
    finalAnswer: { value: money(book), unit: "dollars" },
    solutionNarrative: `$${rnd(keep, 4)}^${k} = ${rnd(factor, 4)}$, so the book value after ${k} years is $${cost}\\cdot${rnd(factor, 4)} = \\$${money(book)}$.`,
  };
};

// --- declining-balance (difficulty 3: book value + salvage floor check) ---
fill["fm2-declining-balance-3"] = (rng, idx) => {
  const life = 4;                                        // d = 0.5, keep = 0.5
  const cost = rng.pick([12000, 15000, 16000]);
  const salvage = rng.pick([1000, 1500]);
  const d = 2 / life, keep = 1 - d;                      // 0.5
  const k = 2;
  const factor = Math.pow(keep, k);                      // 0.25
  const book = cost * factor;
  const aboveSalvage = book > salvage;
  return {
    id: `gen.fm2-declining-balance-3.${idx}`, generated: true, concepts: ["declining-balance"], difficulty: 3, context: "applied",
    prompt: `A \\$${cost} machine with a ${life}-year life is depreciated by double-declining balance, with a salvage value of \\$${salvage}. Find the book value after ${k} years, and check it does not fall below salvage.`,
    steps: [
      { instruction: `Double-declining rate $d = 2/${life}$ (give the decimal).`, answer: rnd(d, 4), accept: ["1/2"], hint: `$2 \\div ${life}$.` },
      { instruction: `Yearly retention factor $1 - ${rnd(d, 4)}$ (give the decimal).`, answer: rnd(keep, 4), accept: [], hint: `$1 - ${rnd(d, 4)}$.` },
      { instruction: `Book value after ${k} years: $${cost} \\times ${rnd(keep, 4)}^${k} = ${cost} \\times ${rnd(factor, 4)}$ (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(book), accept: [], hint: `$${cost} \\times ${rnd(factor, 4)}$.` },
      { instruction: `Is \\$${money(book)} above the \\$${salvage} salvage floor? Answer exactly one of: yes, no.`, answer: aboveSalvage ? "yes" : "no", accept: aboveSalvage ? ["above"] : ["below"], hint: `Compare the book value to the salvage value.` },
    ],
    finalAnswer: { value: money(book), unit: "dollars" },
    solutionNarrative: `$d = 2/${life} = ${rnd(d, 4)}$, so book value after ${k} years is $${cost}\\cdot${rnd(factor, 4)} = \\$${money(book)}$, ${aboveSalvage ? "still above" : "below"} the \\$${salvage} salvage floor.`,
  };
};

// --- inflation-and-real-value (difficulty 1: future nominal cost, short horizon) ---
fill["fm2-inflation-real-1"] = (rng, idx) => {
  const P = rng.pick([50, 80, 100, 120]);
  const i = rng.pick([0.03, 0.04, 0.05]);
  const n = rng.pick([1, 2]);
  const factor = Math.pow(1 + i, n);
  const future = P * factor;
  return {
    id: `gen.fm2-inflation-real-1.${idx}`, generated: true, concepts: ["inflation-and-real-value"], difficulty: 1, context: "applied",
    prompt: `An item costs \\$${P} today. With inflation at ${pct(i, 2)}% per year, what will it cost in ${n} year${n > 1 ? "s" : ""}? Use $\\text{future cost} = P\\cdot(1+i)^n$ with $P=${P}$, $i=${i}$, $n=${n}$.`,
    steps: [
      { instruction: `Compute the inflation factor $(1+${i})^${n}$ (round to 4 decimal places).`, answer: rnd(factor, 4), accept: [], hint: `$${1 + i}$ raised to the ${n}.` },
      { instruction: `Multiply by \\$${P} for the future cost (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(future), accept: [], hint: `$${P} \\times ${rnd(factor, 4)}$.` },
    ],
    finalAnswer: { value: money(future), unit: "dollars" },
    solutionNarrative: `$${P}\\cdot(1+${i})^${n} = ${P}\\cdot${rnd(factor, 4)} = \\$${money(future)}$.`,
  };
};

// --- inflation-and-real-value (difficulty 2: real value / purchasing power) ---
fill["fm2-inflation-real-2"] = (rng, idx) => {
  const P = rng.pick([1000, 2000, 5000]);
  const i = rng.pick([0.03, 0.04]);
  const n = rng.pick([5, 8, 10]);
  const factor = Math.pow(1 + i, n);
  const real = P / factor;
  return {
    id: `gen.fm2-inflation-real-2.${idx}`, generated: true, concepts: ["inflation-and-real-value"], difficulty: 2, context: "applied",
    prompt: `You keep \\$${P} in cash for ${n} years while inflation runs ${pct(i, 2)}% per year. What is its real value (purchasing power in today's dollars)? Use $\\text{real value} = \\dfrac{${P}}{(1+i)^n}$.`,
    steps: [
      { instruction: `Compute the inflation factor $(1+${i})^${n}$ (round to 6 decimal places).`, answer: rnd(factor, 6), accept: [], hint: `Multiply ${1 + i} by itself ${n} times.` },
      { instruction: `Divide \\$${P} by that factor for the real value (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(real), accept: [], hint: `$${P} / ${rnd(factor, 6)}$.` },
    ],
    finalAnswer: { value: money(real), unit: "dollars" },
    solutionNarrative: `The nominal \\$${P} still reads \\$${P}, but $${P}/(1+${i})^${n} = \\$${money(real)}$ of today's purchasing power.`,
  };
};

// --- inflation-and-real-value (difficulty 3: inflate a future budget) ---
fill["fm2-inflation-real-3"] = (rng, idx) => {
  const P = rng.pick([40000, 50000, 60000]);
  const i = rng.pick([0.025, 0.03]);
  const n = rng.pick([15, 20, 25]);
  const factor = Math.pow(1 + i, n);
  const future = P * rN(factor, 6);
  return {
    id: `gen.fm2-inflation-real-3.${idx}`, generated: true, concepts: ["inflation-and-real-value"], difficulty: 3, context: "applied",
    prompt: `A retiree wants a \\$${P} annual budget in today's dollars. With inflation at ${pct(i, 2)}% per year, what will that same lifestyle cost in ${n} years (its future nominal cost)?`,
    steps: [
      { instruction: `Compute the inflation factor $(1+${i})^${n}$ (round to 6 decimal places).`, answer: rnd(factor, 6), accept: [], hint: `$${1 + i}$ raised to the ${n}.` },
      { instruction: `Multiply by \\$${P} for the future nominal cost (round to the nearest cent). Enter as a number rounded to the nearest cent, no $ or commas.`, answer: money(future), accept: [money(P * factor)], hint: `$${P} \\times ${rnd(factor, 6)}$.` },
    ],
    finalAnswer: { value: money(future), unit: "dollars" },
    solutionNarrative: `$${P}\\cdot(1+${i})^${n} = ${P}\\cdot${rnd(factor, 6)} = \\$${money(future)}$ — the budget balloons in raw dollars, the core reason plans must use real values.`,
  };
};

// --- fisher-real-rate (difficulty 1) ---
fill["fm2-fisher-rate-1"] = (rng, idx) => {
  const nom = rng.pick([0.05, 0.06]);
  const inf = rng.pick([0.02, 0.03, 0.04]).valueOf();
  const infl = inf < nom ? inf : 0.02;                  // ensure inflation below nominal
  const ratio = (1 + nom) / (1 + infl);
  const real = ratio - 1;
  return {
    id: `gen.fm2-fisher-rate-1.${idx}`, generated: true, concepts: ["fisher-real-rate"], difficulty: 1, context: "applied",
    prompt: `Your savings earn a nominal ${pct(nom, 2)}% while inflation is ${pct(infl, 2)}%. Find the real rate with the Fisher equation $r_{\\text{real}} = \\dfrac{1 + r_{\\text{nominal}}}{1 + i} - 1$. Give the real rate as a percent (round to 2 decimals).`,
    steps: [
      { instruction: `Form the ratio $\\dfrac{${1 + nom}}{${1 + infl}}$ (round to 6 decimal places).`, answer: rnd(ratio, 6), accept: [], hint: `$${1 + nom} \\div ${1 + infl}$.` },
      { instruction: `Subtract 1 (round to 6 decimal places).`, answer: rnd(real, 6), accept: [], hint: `$${rnd(ratio, 6)} - 1$.` },
      { instruction: `Convert to a percent and round to 2 decimals. Enter the real rate as a percent (a number, no % sign).`, answer: pct(real, 2), accept: [], hint: `$${rnd(real, 6)} \\times 100$.` },
    ],
    finalAnswer: { value: pct(real, 2), unit: "percent" },
    solutionNarrative: `$r_{\\text{real}} = \\dfrac{${1 + nom}}{${1 + infl}} - 1 = ${rnd(real, 6)} = ${pct(real, 2)}\\%$.`,
  };
};

// --- fisher-real-rate (difficulty 2) ---
fill["fm2-fisher-rate-2"] = (rng, idx) => {
  const nom = rng.pick([0.07, 0.08, 0.09]);
  const infl = rng.pick([0.03, 0.04]);
  const ratio = (1 + nom) / (1 + infl);
  const real = ratio - 1;
  return {
    id: `gen.fm2-fisher-rate-2.${idx}`, generated: true, concepts: ["fisher-real-rate"], difficulty: 2, context: "applied",
    prompt: `An investment earns a nominal ${pct(nom, 2)}% while inflation runs ${pct(infl, 2)}%. Find the real rate with the Fisher equation. Give it as a percent (round to 2 decimals).`,
    steps: [
      { instruction: `Form the ratio $\\dfrac{${1 + nom}}{${1 + infl}}$ (round to 6 decimal places).`, answer: rnd(ratio, 6), accept: [], hint: `$${1 + nom} \\div ${1 + infl}$.` },
      { instruction: `Subtract 1 (round to 6 decimal places).`, answer: rnd(real, 6), accept: [], hint: `$${rnd(ratio, 6)} - 1$.` },
      { instruction: `Convert to a percent, round to 2 decimals. Enter the real rate as a percent (a number, no % sign).`, answer: pct(real, 2), accept: [], hint: `$${rnd(real, 6)} \\times 100$.` },
    ],
    finalAnswer: { value: pct(real, 2), unit: "percent" },
    solutionNarrative: `$r_{\\text{real}} = \\dfrac{${1 + nom}}{${1 + infl}} - 1 = ${rnd(real, 6)} = ${pct(real, 2)}\\%$, below the simple $${pct(nom, 2)}\\% - ${pct(infl, 2)}\\%$ shortcut.`,
  };
};

// --- fisher-real-rate (difficulty 3: high inflation, shortcut drifts) ---
fill["fm2-fisher-rate-3"] = (rng, idx) => {
  const nom = rng.pick([0.11, 0.12, 0.13]);
  const infl = rng.pick([0.08, 0.09]);
  const ratio = (1 + nom) / (1 + infl);
  const real = ratio - 1;
  const shortcut = Math.round((nom - infl) * 100);
  return {
    id: `gen.fm2-fisher-rate-3.${idx}`, generated: true, concepts: ["fisher-real-rate"], difficulty: 3, context: "applied",
    prompt: `During high inflation, a bond pays a nominal ${pct(nom, 2)}% while inflation is ${pct(infl, 2)}%. The rough shortcut says ${shortcut}%, but find the exact Fisher real rate. Give it as a percent (round to 2 decimals).`,
    steps: [
      { instruction: `Form the ratio $\\dfrac{${1 + nom}}{${1 + infl}}$ (round to 6 decimal places).`, answer: rnd(ratio, 6), accept: [], hint: `$${1 + nom} \\div ${1 + infl}$.` },
      { instruction: `Subtract 1 (round to 6 decimal places).`, answer: rnd(real, 6), accept: [], hint: `$${rnd(ratio, 6)} - 1$.` },
      { instruction: `Convert to a percent, round to 2 decimals. Enter the real rate as a percent (a number, no % sign).`, answer: pct(real, 2), accept: [], hint: `$${rnd(real, 6)} \\times 100$.` },
    ],
    finalAnswer: { value: pct(real, 2), unit: "percent" },
    solutionNarrative: `$r_{\\text{real}} = \\dfrac{${1 + nom}}{${1 + infl}} - 1 = ${rnd(real, 6)} = ${pct(real, 2)}\\%$ — notably below the ${shortcut}% shortcut, since Fisher divides rather than subtracts.`,
  };
};
