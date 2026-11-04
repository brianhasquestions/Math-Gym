// Unit tests for the MathGym engine: grader, mastery model, progress store,
// and plot renderer. Dependency-free; run with `node tools/test.mjs`. Exits
// non-zero on any failure so CI can gate on it. This complements validate.mjs
// (which checks CONTENT); this file checks the ENGINE the content runs on.
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const imp = (rel) => import(pathToFileURL(path.join(REPO, rel)).href);

// Minimal in-memory localStorage so progress-store (browser code) runs in Node.
globalThis.localStorage = (() => {
  let m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => (m = new Map()),
  };
})();

const { checkStep } = await imp("js/problem-engine.js");
const { ProblemSource } = await imp("js/problem-engine.js");
const mastery = await imp("js/mastery-model.js");
const store = await imp("js/progress-store.js");
const { plotToSvg } = await imp("js/plot.js");
const { renderMarkdown } = await imp("js/renderer.js");

let pass = 0, fail = 0;
const eq = (desc, got, want) => {
  if (got === want) { pass++; return; }
  fail++; console.log(`FAIL: ${desc}\n      got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};
const ok = (desc, cond) => eq(desc, !!cond, true);
const group = (name) => console.log(`\n# ${name}`);

// ---------------------------------------------------------------- grader
group("grader: accepts equivalent forms");
eq("fraction == decimal", checkStep({ answer: "1/2" }, "0.5"), true);
eq("factored == expanded", checkStep({ answer: "(x-2)(x-3)" }, "x^2-5x+6"), true);
eq("term reorder", checkStep({ answer: "19 + 4x" }, "4x + 19"), true);
eq("side swap", checkStep({ answer: "40 = 4x" }, "4x = 40"), true);
eq("tuple named==bare", checkStep({ answer: "(4, 2)" }, "x=4, y=2"), true);
eq("inequality flip", checkStep({ answer: "x > 3" }, "3 < x"), true);
eq("radical value", checkStep({ answer: "sqrt(50)" }, "5sqrt2"), true);
eq("multivariable product xy", checkStep({ answer: "xy+2" }, "y*x+2"), true);
eq("x^(2) == x^2", checkStep({ answer: "x^2+1" }, "x^(2)+1"), true);
eq("rounded decimal for pi form", checkStep({ answer: "16pi" }, "50.27"), true);
eq("paren solution set", checkStep({ form: "solutions", answer: "x=2 or x=-3" }, "(2, -3)"), true);

group("grader: rejects wrong / gamed answers");
eq("empty", checkStep({ answer: "5" }, ""), false);
eq("garbage", checkStep({ answer: "5" }, "=,()"), false);
eq("wrong number", checkStep({ answer: "7" }, "8"), false);
eq("factored gate: expanded", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "x^2-5x+6"), false);
eq("factored gate: paren-wrapped expanded", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(x^2-5x+6)"), false);
eq("function name not a product", checkStep({ answer: "4sin(pi*t/6)+6" }, "sin(4pi*t/6)+6"), false);
eq("function anagram rejected", checkStep({ answer: "4sin(pi*t/6)+6" }, "4nis(pi*t/6)+6"), false);
eq("wrong variable rejected", checkStep({ answer: "x = 7" }, "y=7"), false);
eq("integer not loosened to radical", checkStep({ answer: "16pi" }, "7"), false);
eq("wrong roots", checkStep({ form: "solutions", answer: "x=2 or x=-3" }, "(2, 3)"), false);

group("grader: factored gate still accepts real factorings");
eq("factored accepted", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(x-3)(x-2)"), true);
eq("gcf factored accepted", checkStep({ form: "factored", answer: "2x(3x+4)" }, "2x(3x+4)"), true);
eq("constant-times-paren accepted", checkStep({ form: "factored", answer: "2(x+3)" }, "2(x + 3)"), true);
eq("squared factor accepted", checkStep({ form: "factored", answer: "(x+3)^2" }, "(x+3)^2"), true);
eq("factored equation accepted", checkStep({ form: "factored", answer: "(2u - 1)(u - 1) = 0" }, "(2u-1)(u-1)=0"), true);

group("grader: factored gate rejects trivial ±1 wrappers");
eq("1(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "1(x^2-5x+6)"), false);
eq("(1)(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(1)(x^2-5x+6)"), false);
eq("(...)*1 rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(x^2-5x+6)*1"), false);
eq("-1(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "-1(-x^2+5x-6)"), false);
eq("1(...)=0 equation rejected", checkStep({ form: "factored", answer: "(2u-1)(u-1)=0" }, "1(2u^2-3u+1)=0"), false);
eq("1 times a REAL factoring still ok", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "1(x-2)(x-3)"), true);

group("grader: numeric formats and tolerance");
eq("thousands separator accepted", checkStep({ answer: "1000" }, "1,000"), true);
eq("grouped decimal accepted", checkStep({ answer: "431676.38" }, "431,676.38"), true);
eq("tuple still a tuple", checkStep({ answer: "(1, 0)" }, "1,0"), true);
eq("non-grouped comma not a number", checkStep({ answer: "1234" }, "12,34"), false);
eq("user cannot under-round a decimal answer", checkStep({ answer: "7.25" }, "7.3"), false);
eq("rounding an exact fraction still ok", checkStep({ answer: "1/3" }, "0.33"), true);
eq("more precision than the answer still ok", checkStep({ answer: "0.67" }, "0.667"), true);

group("grader: polynomial blowup guard (pMul like-term merging + caps)");
{
  const t0 = Date.now();
  const r = checkStep({ answer: "x+1" }, "(x+1)^8(x+1)^8(x+1)^8(x+1)^8");
  const ms = Date.now() - t0;
  eq("huge power product rejected", r, false);
  ok(`…and fast (${ms}ms < 500ms)`, ms < 500);
  eq("merged expansion still equates", checkStep({ answer: "(x+1)^2" }, "x^2+2x+1"), true);
}

// ---------------------------------------------------------------- mastery model
group("mastery model: config is self-consistent");
eq("validateConfig empty", mastery.validateConfig().length, 0);

group("mastery model: initState prunes orphans + stale focus");
{
  const stale = mastery.initState("t1", ["a", "b"], null);
  stale.focusConceptId = "a";
  stale.concepts.a.proficiency = 0.5;
  // Simulate a content update that removed concept "a" and renamed to "c".
  const fresh = mastery.initState("t1", ["b", "c"], stale);
  ok("orphan 'a' pruned", !fresh.concepts.a);
  ok("new concept 'c' added", !!fresh.concepts.c);
  ok("stale focus cleared", fresh.focusConceptId === null);
  ok("kept concept 'b' survives", !!fresh.concepts.b);
}

group("mastery model: grade transitions");
{
  const st = mastery.initState("t2", ["k"], null);
  const clean = mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0 });
  ok("clean correct raises proficiency", clean.proficiencyAfter > clean.proficiencyBefore);
  ok("clean correct advances streak", st.concepts.k.consecutiveCorrect === 1);
}
{
  const st = mastery.initState("t3", ["k"], null);
  const before = st.concepts.k.proficiency;
  mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 3 });
  ok("struggled correct does NOT advance clean streak", st.concepts.k.consecutiveCorrect === 0);
  ok("struggled correct gains less than a clean one", st.concepts.k.proficiency - before < mastery.CONFIG.gainBase * 1);
}
{
  const st = mastery.initState("t4", ["k"], null);
  st.concepts.k.proficiency = 0.5; st.concepts.k.currentDifficulty = 2;
  mastery.grade(st, { correct: false, hintsUsed: 0, conceptId: "k", wrongs: 1 });
  ok("wrong drops proficiency", st.concepts.k.proficiency < 0.5);
  ok("wrong drops a difficulty tier", st.concepts.k.currentDifficulty === 1);
}
{
  // A clean run to mastery: bar + clean streak at top tier.
  const st = mastery.initState("t5", ["k"], null);
  for (let i = 0; i < 12; i++) mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0 });
  ok("clean grinding reaches mastery", st.concepts.k.mastered);
  ok("topicMastered true when all concepts mastered", st.topicMastered);
}

group("mastery model: credit capped at served difficulty");
{
  const st = mastery.initState("t6", ["k"], null);
  st.concepts.k.currentDifficulty = 3;
  st.concepts.k.proficiency = 0.9;
  // An easy problem substituted at the top tier must not feed the mastery streak.
  mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0, difficulty: 1 });
  eq("easy problem earns no top-tier streak", st.concepts.k.consecutiveTopClean, 0);
  ok("…and only tier-1 gain", st.concepts.k.proficiency <= 0.9 + mastery.CONFIG.gainBase + 1e-9);
  mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0, difficulty: 3 });
  eq("full-tier problem does count", st.concepts.k.consecutiveTopClean, 1);
}

group("mastery model: spaced-repetition review lifecycle");
{
  const DAY = 24 * 60 * 60 * 1000;
  const t0 = 1000000;
  const st = mastery.initState("t7", ["k"], null);
  for (let i = 0; i < 12; i++) mastery.grade(st, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0, now: t0 });
  ok("mastered", st.topicMastered);
  eq("first review scheduled on the bottom rung", st.nextReviewAt, t0 + mastery.CONFIG.reviewIntervalsDays[0] * DAY);
  ok("not due immediately", !mastery.reviewStatus(st, t0 + DAY).due);
  ok("due once the interval passes", mastery.reviewStatus(st, st.nextReviewAt + 1).due);

  // A clean review holds mastery and climbs the ladder.
  const held = mastery.applyReviewResult(st, { conceptId: "k", correct: true, hintsUsed: 0, wrongs: 0, now: t0 + 4 * DAY });
  ok("clean review holds", held.held && st.concepts.k.mastered && st.topicMastered);
  mastery.finishReview(st, true, t0 + 4 * DAY);
  eq("ladder climbs", st.reviewLevel, 1);
  eq("next interval is the second rung", st.nextReviewAt, t0 + 4 * DAY + mastery.CONFIG.reviewIntervalsDays[1] * DAY);

  // A lapse revokes mastery and sends the concept back to training.
  const lapse = mastery.applyReviewResult(st, { conceptId: "k", correct: false, hintsUsed: 1, wrongs: 2, now: t0 + 12 * DAY });
  ok("lapse revokes concept mastery", !lapse.held && !st.concepts.k.mastered);
  ok("lapse revokes topic mastery", !st.topicMastered);
  ok("proficiency knocked down", st.concepts.k.proficiency <= mastery.CONFIG.reviewLapseProficiency);
  eq("tier knocked down a rung", st.concepts.k.currentDifficulty, mastery.CONFIG.topDifficulty - 1);
  mastery.finishReview(st, false, t0 + 12 * DAY);
  eq("ladder resets on lapse", st.reviewLevel, 0);
  eq("no review scheduled while unmastered", st.nextReviewAt, null);

  // Legacy states (mastered before this feature) get a review backfilled.
  const legacy = { topicId: "t8", concepts: { k: { id: "k", proficiency: 1, recent: [], currentDifficulty: 3, attempts: 9, consecutiveCorrect: 0, consecutiveTopClean: 3, consecutiveWrong: 0, hintsUsed: 0, mastered: true, mustProveClean: false } }, topicMastered: true, totalAnswered: 9, focusConceptId: null };
  const rehydrated = mastery.initState("t8", ["k"], legacy);
  ok("legacy mastered state gets a review scheduled", Number.isFinite(rehydrated.nextReviewAt));
}

// ---------------------------------------------------------------- generator display + rounding
group("generator: unit coefficients stripped, prose and currency intact");
{
  const { generate, makeRng } = await imp("js/generator.js");
  // eval-rational-v1 draws a=1 often; its prompt must never show "1x".
  let coefLeak = false, roundingBad = null;
  for (let s = 1; s <= 300; s++) {
    const p = generate("eval-rational-v1", makeRng(s), s);
    if (/(?<![0-9.])1x/.test(p.prompt)) coefLeak = true;
    // The answer must be the hint fraction rounded HALF AWAY FROM ZERO
    // (plain Math.round turned -0.375 into -0.37 and failed correct answers).
    const m = p.steps[0].hint.match(/frac\{(-?\d+)\}\{(-?\d+)\}/);
    const v = Number(m[1]) / Number(m[2]);
    const expected = Math.sign(v) * Math.round(Math.abs(v) * 100) / 100;
    if (Number(p.steps[0].answer) !== expected) roundingBad = `${m[1]}/${m[2]} -> ${p.steps[0].answer}, want ${expected}`;
  }
  ok("no '1x' coefficient rendering (300 seeds)", !coefLeak);
  eq("half-away-from-zero rounding (300 seeds)", roundingBad, null);
  const known = generate("eval-rational-v1", makeRng(7), 7);
  eq("regression: -3/8 rounds to -0.38, not -0.37", known.steps[0].answer, "-0.38");
  ok("…and the exact fraction is accepted", checkStep(known.steps[0], "-3/8"));
  // Prose digits must survive the math-span cleanup: this discrete-math
  // template's hint says "Count the 1s" outside math delimiters.
  const dm = generate("dm-log-tt-d2", makeRng(3), 3);
  ok("prose '1s' untouched by cleanup", /Count the 1s/.test(dm.steps.map((x) => x.hint || "").join(" ")));
  // Escaped currency dollars must not be eaten or mispaired as math delimiters
  // (this applied template mixes "\$" prose amounts with real $...$ math).
  const fin = generate("a2l-eval-rational-d3", makeRng(3), 3);
  ok("escaped currency '\\$' survives cleanup", fin.prompt.includes("\\$"));
  ok("…with no NUL placeholder leaking", !fin.prompt.includes(String.fromCharCode(0)));
}

// ---------------------------------------------------------------- progress store
group("progress store: sanitizes bad data");
{
  localStorage.clear();
  localStorage.setItem("mathgym.progress", "{ not json");
  eq("malformed JSON -> empty (no throw)", store.getTopicState("x"), null);

  localStorage.setItem("mathgym.progress", JSON.stringify({ schemaVersion: 1 })); // no topics
  eq("missing topics -> null lookups don't crash", store.getTopicState("x"), null);

  // A crafted topic with a malformed concept must be dropped, not served.
  localStorage.setItem("mathgym.progress", JSON.stringify({
    schemaVersion: 1, topics: { good: { concepts: { a: { proficiency: 0.5, recent: [] } } }, bad: { concepts: { a: {} } } },
  }));
  ok("well-formed topic survives", !!store.getTopicState("good"));
  ok("malformed topic dropped", store.getTopicState("bad") === null);
}
{
  localStorage.clear();
  ok("import rejects wrong version", (() => { try { store.importProgress(JSON.stringify({ schemaVersion: 999 })); return false; } catch { return true; } })());
}
{
  // A truncated import (concept missing currentDifficulty) must be backfilled,
  // or grade() computes gainBase * undefined = NaN proficiency FOREVER.
  localStorage.clear();
  store.importProgress(JSON.stringify({
    schemaVersion: 1,
    topics: { t: { concepts: { k: { proficiency: 0.9, recent: [] } }, totalAnswered: "5" } },
  }));
  const st = store.getTopicState("t");
  eq("missing currentDifficulty backfilled", st.concepts.k.currentDifficulty, 1);
  eq("string totalAnswered coerced", st.totalAnswered, 0);
  const live = mastery.initState("t", ["k"], st);
  mastery.grade(live, { correct: true, hintsUsed: 0, conceptId: "k", wrongs: 0 });
  ok("grade on imported state stays finite", Number.isFinite(live.concepts.k.proficiency));
}

// ---------------------------------------------------------------- ProblemSource
group("ProblemSource: serves and varies");
{
  const topic = { id: "seedtopic", problems: [
    { id: "p1", concepts: ["k"], difficulty: 1, steps: [{ instruction: "x", answer: "1" }], finalAnswer: { value: "1" } },
    { id: "p2", concepts: ["k"], difficulty: 1, steps: [{ instruction: "x", answer: "2" }], finalAnswer: { value: "2" } },
  ], generators: [] };
  const src = new ProblemSource(topic);
  ok("serves a seed for concept/difficulty", !!src.next("k", 1));
  ok("seedBase is randomized (not the old fixed formula)", src.seedBase !== ("seedtopic".length * 7919 + 13));
}

// ---------------------------------------------------------------- plot renderer
group("plot renderer: robust");
ok("cartesian renders a figure", plotToSvg({ curves: [{ fn: "x^2" }] }).startsWith("<figure"));
ok("graph renders a figure", plotToSvg({ type: "graph", nodes: [{ id: "A", x: 0, y: 0 }, { id: "B", x: 1, y: 1 }], edges: [["A", "B"]] }).startsWith("<figure"));
ok("zero-span range does not emit NaN", !plotToSvg({ xRange: [2, 2], yRange: [0, 0], curves: [{ fn: "x" }] }).includes("NaN"));
ok("caption becomes aria-label", plotToSvg({ curves: [{ fn: "x" }], caption: "hi" }).includes('aria-label="hi"'));
ok("bad spec degrades, never throws", typeof plotToSvg(null) === "string");
// A quote in a content-authored caption must not break out of the attribute.
ok("caption quotes escaped (no attribute injection)",
  !plotToSvg({ curves: [{ fn: "x" }], caption: 'a" onmouseover="alert(1)' }).includes('onmouseover="'));
ok("string width cannot inject attributes",
  !plotToSvg({ width: '440" onload="alert(1)', curves: [{ fn: "x" }] }).includes("onload"));

group("plot renderer: binary operators in fn (compileFn self-capture regression)");
{
  // The parser builds each binary node as a closure over its left operand. It
  // once captured the reassigned variable instead of a snapshot, so ANY fn
  // with an explicit + - * / recursed into itself, evaluated to NaN, and the
  // curve silently rendered as an empty <path d="">.
  const drawsCurve = (fn) => !plotToSvg({ xRange: [-6, 6], yRange: [-6, 6], curves: [{ fn }] }).includes('d=""');
  ok('"x + 1" draws a curve', drawsCurve("x + 1"));
  ok('"x^3-3*x" draws a curve', drawsCurve("x^3-3*x"));
  ok('"3*sin(2*x)+1" draws a curve', drawsCurve("3*sin(2*x)+1"));
  ok('"exp(0.4*x)" draws a curve', drawsCurve("exp(0.4*x)"));
  ok('"sqrt(25 - x^2)" draws a curve', drawsCurve("sqrt(25 - x^2)"));
  ok('"x/2 - 1" draws a curve', drawsCurve("x/2 - 1"));
}

// ---------------------------------------------------------------- markdown tables
group("markdown renderer: tables (payoff matrices, data tables)");
{
  const md = [
    "| Row \\ Col | Left | Right |",
    "|---|---|---|",
    "| Top | 4, 0 | 3, 9 |",
    "| Bottom | 5, 2 | 8, 6 |",
  ].join("\n");
  const html = renderMarkdown(md);
  ok("emits a <table>", html.includes("<table"));
  ok("has header cells", (html.match(/<th>/g) || []).length === 3);
  ok("has data cells", (html.match(/<td>/g) || []).length === 6);
  ok("does not leak raw pipes into a paragraph", !/<p>[^<]*\|/.test(html));
  const mixed = renderMarkdown("Consider the game.\n\n| A | B |\n|---|---|\n| 1 | 2 |");
  ok("prose before a table still becomes a paragraph", mixed.includes("<p>Consider the game.</p>"));
  ok("plain prose (no table) is untouched", !renderMarkdown("just words").includes("<table"));
}

// ---------------------------------------------------------------- 2026-11 math review regressions
group("grader: solution sets treat a double root as one solution");
eq("double root: bare value", checkStep({ form: "solutions", answer: "x = -4 or x = -4" }, "-4"), true);
eq("double root: x = value", checkStep({ form: "solutions", answer: "x = -4 or x = -4" }, "x = -4"), true);
eq("double root: wrong sign still rejected", checkStep({ form: "solutions", answer: "x = -4 or x = -4" }, "4"), false);
eq("two roots: one root alone still rejected", checkStep({ form: "solutions", answer: "x = 2 or x = -3" }, "x = 2"), false);

group("grader holes from the 2026-11 review: wrong answers must be REJECTED");
// G1: precedence. "1/4 * 2" was split at the first "/" and read as 1/(4*2).
eq("G1 1/4*2 accept does not admit 1/8", checkStep({ answer: "2 * 1/4", accept: ["1/4 * 2"] }, "1/8"), false);
eq("G1 (x+1)/2 is not x+1/2", checkStep({ answer: "(x+1)/2" }, "x+1/2"), false);
eq("G1 1/(x+2) is not 1/2+x", checkStep({ answer: "1/(x+2)" }, "1/2+x"), false);
eq("G1 x/3 - 2 is not x", checkStep({ answer: "x/3 - 2" }, "x"), false);
eq("G1 x^2 + x^2/2 is not x^2", checkStep({ answer: "x^2 + x^2/2" }, "x^2"), false);
eq("G1 rational equivalence still works", checkStep({ answer: "(x^2-1)/(x-1)" }, "x+1"), true);
eq("G1 -x/y == (-x)/y", checkStep({ answer: "-x/y" }, "(-x)/y"), true);
// G2: typing the problem back is not doing it.
eq("G2 7*8 is not an answer for 56", checkStep({ answer: "56" }, "7*8"), false);
eq("G2 4+1 is not an answer for 5", checkStep({ answer: "5" }, "4+1"), false);
eq("G2 (x^2)^3 is not simplified x^6", checkStep({ instruction: "Simplify.", answer: "x^6" }, "(x^2)^3"), false);
eq("G2 x^5*x^2 is not x^7", checkStep({ answer: "x^7" }, "x^5*x^2"), false);
eq("G2 uncombined like terms rejected", checkStep({ instruction: "Combine like terms.", answer: "3x + 8 = 26" }, "8x - 3 - 5x + 11 = 26"), false);
eq("G2 3x+12-12 is not 3x = 33", checkStep({ instruction: "Subtract 12 from both sides.", answer: "3x = 33" }, "3x+12-12=45-12"), false);
eq("G2 undistributed line rejected on a distribute step", checkStep({ instruction: "Distribute the 2.", answer: "2x + 14 = 40" }, "2(x+7)=40"), false);
eq("G2 unreduced fraction rejected on a lowest-terms step", checkStep({ instruction: "Give a fraction in lowest terms.", answer: "1/3" }, "3/9"), false);
eq("G2 exact forms still fine: 16pi for 50.27", checkStep({ answer: "50.27" }, "16pi"), true);
eq("G2 setup steps take any faithful transcription", checkStep({ instruction: "Write an equation for the perimeter.", answer: "2x + 6 = 34" }, "x + x + 6 = 34"), true);
eq("G2 expanding a factored answer is fine", checkStep({ answer: "(x+1)^2" }, "x^2+2x+1"), true);
// G3: subscripted variables are single symbols.
eq("G3 v2w3 - v3w2 does not accept 0", checkStep({ answer: "v2w3 - v3w2" }, "0"), false);
eq("G3 -v1 + v2 = 0 does not accept v = 0", checkStep({ answer: "-v1 + v2 = 0" }, "v = 0"), false);
eq("G3 c_1 == c1", checkStep({ answer: "c1 + c2" }, "c_1 + c_2"), true);
// G4: inequalities never move terms across the sign.
eq("G4 x + 1 >= 4 is not x >= 3", checkStep({ answer: "x >= 3" }, "x + 1 >= 4"), false);
eq("G4 direction flip still equal", checkStep({ answer: "x >= 3" }, "3 <= x"), true);
eq("G4 strictness still matters", checkStep({ answer: "x > 3" }, "x >= 3"), false);
eq("G4 reversed compound inequality", checkStep({ answer: "-2 < x < 5" }, "5 > x > -2"), true);
// G5/G6: words and function names are not polynomials.
eq("G5 hyphenated menu words don't collide", checkStep({ answer: "SSS", accept: ["side-side-side"] }, "angle-angle-side"), false);
eq("G5 'angle-angle' does not equal 0", checkStep({ answer: "AA", accept: ["angle-angle"] }, "0"), false);
eq("G6 rsin(2theta) is not 2rsin(theta)", checkStep({ answer: "r^2 = 8rsin(theta)" }, "r^2 = 4rsin(2theta)"), false);
eq("G6 equations with functions still side-swap", checkStep({ answer: "r^2 = 2rcos(theta)" }, "2rcos(theta) = r^2"), true);
eq("lambda polynomials still compare", checkStep({ answer: "lambda^2 - 5lambda + 6" }, "(lambda-2)(lambda-3)"), true);
// G7: factor completely.
eq("G7 x(6x+8) is not complete for 2x(3x+4)", checkStep({ form: "factored", answer: "2x(3x+4)" }, "x(6x+8)"), false);
eq("G7 2(3x^2+4x) is not complete", checkStep({ form: "factored", answer: "2x(3x+4)" }, "2(3x^2+4x)"), false);
eq("G7 (6x-9)(2x+3) is not complete for 3(2x-3)(2x+3)", checkStep({ form: "factored", answer: "3(2x-3)(2x+3)" }, "(6x-9)(2x+3)"), false);
eq("G7 a complete factoring in another order passes", checkStep({ form: "factored", answer: "2x(3x+4)" }, "(3x+4)(2x)"), true);
// G8: tolerance.
eq("G8 '0.0' is not 1/36", checkStep({ answer: "1/36" }, "0.0"), false);
eq("G8 '0.7' is not 2/3 (1 significant figure)", checkStep({ answer: "2/3" }, "0.7"), false);
eq("G8 '0.67' still fine for 2/3", checkStep({ answer: "2/3" }, "0.67"), true);
eq("G8 0 is not machine epsilon", checkStep({ answer: "0.00000095" }, "0"), false);
eq("G8 off-by-one on a big integer rejected", checkStep({ answer: "1080000000" }, "1080000001"), false);
eq("G8 rounded tuple for an exact tuple", checkStep({ answer: "(6, 1/3)" }, "(6.00, 0.33)"), true);
// G9: mixed numbers and spaced digits.
eq("G9 8 1/4 is not 81/4", checkStep({ answer: "81/4" }, "8 1/4"), false);
eq("G9 1 1/3 is 4/3", checkStep({ answer: "4/3" }, "1 1/3"), true);
eq("G9 '2 3' is not 23", checkStep({ answer: "23" }, "2 3"), false);
// Precedence: unary minus binds looser than ^.
eq("-2^2 after * is -(2^2)", checkStep({ answer: "12" }, "3*-2^2"), false);

group("grader: natural notation now ACCEPTED");
eq("degree sign", checkStep({ answer: "55" }, "55°"), true);
eq("^\\circ", checkStep({ answer: "55" }, "55^\\circ"), true);
eq("'degrees' word", checkStep({ answer: "55" }, "55 degrees"), true);
eq("degrees in a solution set", checkStep({ form: "solutions", answer: "x = 30 or x = 150" }, "30°, 150°"), true);
eq("percent sign on a percent answer", checkStep({ answer: "5.21" }, "5.21%"), true);
eq("percent for a proportion answer", checkStep({ answer: "0.0521" }, "5.21%"), true);
eq("± in a solution set", checkStep({ form: "solutions", answer: "x = 6 or x = -6" }, "x = ±6"), true);
eq("'and' in a solution set", checkStep({ form: "solutions", answer: "x = 6 or x = -6" }, "6 and -6"), true);
eq("7 = x for x = 7", checkStep({ answer: "x = 7" }, "7 = x"), true);
eq("1x = 5 for x = 5", checkStep({ answer: "x = 5" }, "1x = 5"), true);
eq("+3 for 3", checkStep({ answer: "3" }, "+3"), true);
eq("units after a number", checkStep({ answer: "12" }, "12 cm"), true);
eq("units don't make 5x a number", checkStep({ answer: "5" }, "5x"), false);
eq("scientific notation", checkStep({ answer: "1080000000" }, "1.08e9"), true);
eq("reject the null hypothesis", checkStep({ answer: "reject" }, "reject the null hypothesis"), true);
eq("fail to reject H0", checkStep({ answer: "fail to reject" }, "fail to reject H_0"), true);
eq("decision words don't cross", checkStep({ answer: "reject" }, "fail to reject the null"), false);
eq("infinity spellings", checkStep({ answer: "inf/inf" }, "∞/∞"), true);
eq("bare RHS for a y = answer", checkStep({ answer: "y = 2x + 1" }, "2x + 1"), true);
eq("y = for a bare-expression answer", checkStep({ answer: "x - 6" }, "y = x - 6"), true);
eq("bare RHS still has to be right", checkStep({ answer: "y = 2x + 1" }, "2x - 1"), false);

group("generator: display cleanup keeps meaningful 1s (81f77a6 regression)");
{
  const { generate, makeRng } = await imp("js/generator.js");
  // The unit-coefficient strip once ate any "1" before a backslash, so the
  // standard basis rendered as <0,> and data sets lost their last value.
  const basis = generate("laf-coordinates-d1", makeRng(3), 3).prompt;
  ok("basis vector keeps its 1 (\\langle 0,1\\rangle)", /\\langle 0,\s*1\s*\\rangle/.test(basis));
  let dataBad = null;
  for (let s = 1; s <= 400 && !dataBad; s++) {
    const p = generate("stat-desc-center-d1", makeRng(s), s);
    const m = p.prompt.match(/\\\{([^}]*)\\\}/);
    if (!m) continue;
    const vals = m[1].split(",").map((v) => v.trim());
    if (vals.some((v) => v === "")) dataBad = p.prompt;
    else {
      const sum = vals.reduce((a, v) => a + Number(v), 0);
      if (String(sum) !== String(p.steps[0].answer)) dataBad = `${p.prompt} -> ${p.steps[0].answer}`;
    }
  }
  eq("data set shown == data set graded (400 seeds)", dataBad, null);
  // Answers are cleaned for display too ("x^2 - 1x - 20" -> "x^2 - x - 20"),
  // and the original spelling is still accepted.
  let leak = null;
  for (let s = 1; s <= 200 && !leak; s++) {
    const p = generate("poly-foil-v1", makeRng(s), s);
    for (const st of p.steps) if (/(?<![0-9.a-z])1x/.test(st.answer)) leak = st.answer;
  }
  eq("no '1x' in revealed answers (poly-foil-v1, 200 seeds)", leak, null);
  // Float noise never reaches the learner.
  let noise = null;
  for (let s = 1; s <= 200 && !noise; s++) {
    const p = generate("fm2-bond-pricing-2", makeRng(s), s);
    const txt = [p.prompt, ...p.steps.map((x) => x.instruction + " " + (x.hint || ""))].join(" ");
    if (/\d\.\d*(?:0{8,}[1-9]|9{8,})/.test(txt)) noise = txt.slice(0, 120);
  }
  eq("no float noise in fm2-bond-pricing-2 (200 seeds)", noise, null);
}

group("generator: answers recomputed independently (review P0s)");
{
  const { generate, makeRng } = await imp("js/generator.js");
  // avg-value-v1: f = (3k)x^2 on [0,b] has average k*b^2 (was off by 3x).
  let avgBad = null;
  for (let s = 1; s <= 100 && !avgBad; s++) {
    const p = generate("avg-value-v1", makeRng(s), s);
    const [, c, b] = p.prompt.match(/= (\d+)x\^2\$ on \$\[0, (\d+)\]/).map(Number);
    if (Number(p.steps[0].answer) !== (c / 3) * b * b) avgBad = `${p.prompt} -> ${p.steps[0].answer}`;
  }
  eq("avg-value-v1 = k b^2 (100 seeds)", avgBad, null);
  // laf-span-membership-d2 asks for BOTH weights; the pair must grade.
  const span = generate("laf-span-membership-d2", makeRng(1), 1).steps[0];
  const [c1, c2] = span.answer.split(",").map((v) => v.trim());
  ok("span weights: full pair accepted", checkStep(span, `${c1}, ${c2}`) && checkStep(span, `c1 = ${c1}, c2 = ${c2}`));
  ok("span weights: c1 alone rejected", !checkStep(span, c1));
  // nt1-general-3: the reported (x, y) must satisfy the stated equation.
  let dioBad = null;
  for (let s = 1; s <= 200 && !dioBad; s++) {
    const p = generate("nt1-general-3", makeRng(s), s);
    const [, a, b, c] = p.prompt.match(/\$(\d+)x \+ (\d+)y = (\d+)\$/).map(Number);
    const x = Number(p.steps[0].answer), y = Number(p.steps[p.steps.length - 1].answer);
    if (a * x + b * y !== c) dioBad = `${a}x+${b}y=${c} with (${x}, ${y})`;
  }
  eq("nt1-general-3 solutions satisfy the equation (200 seeds)", dioBad, null);
  // de-classify-roots-v1: label must match the discriminant's sign.
  let rootsBad = null;
  for (let s = 1; s <= 300 && !rootsBad; s++) {
    const p = generate("de-classify-roots-v1", makeRng(s), s);
    const D = Number(p.steps[0].hint.match(/= (-?\d+)/)[1]);
    const want = D > 0 ? "real distinct" : D === 0 ? "repeated" : "complex";
    if (p.steps[0].answer !== want) rootsBad = `${p.prompt} D=${D} -> ${p.steps[0].answer}`;
  }
  eq("de-classify-roots-v1 label matches discriminant (300 seeds)", rootsBad, null);
}

group("markdown renderer: review regressions");
{
  const mod = { exports: {} };
  const { readFileSync } = await import("node:fs");
  new Function("module", "exports", readFileSync(path.join(REPO, "vendor/katex/katex.min.js"), "utf8"))(mod, mod.exports);
  const prevKatex = globalThis.katex;
  globalThis.katex = mod.exports.default || mod.exports;
  const noSep = renderMarkdown("Payoffs:\n\n| | Left | Right |\n| Up | 3 | -1 |\n| Down | -2 | 4 |");
  ok("pipe table without a |---| separator still renders as a table", noSep.includes("<table") && (noSep.match(/<td>/g) || []).length === 6);
  const cur = renderMarkdown("Each costs $9.00 \\div 12 = \\$0.75$ per unit.");
  ok("escaped \\$ inside math does not close the span",
    !cur.includes("katex-error") && (cur.match(/class="katex"/g) || []).length === 1 && /per unit\.<\/p>$/.test(cur));
  const inlineDisplay = renderMarkdown("$$a^2 + b^2$$ (note the plus sign)");
  ok("$$…$$ followed by prose on one line renders cleanly", !inlineDisplay.includes("katex-error") && inlineDisplay.includes("note the plus sign"));
  const link = renderMarkdown('See Soatok\'s ["Comparison"](https://soatok.blog/2020/07/12/x/) post.');
  ok("[text](https://…) renders as a link", link.includes('<a href="https://soatok.blog/2020/07/12/x/"') && link.includes('>"Comparison"</a>') && !link.includes("]("));
  const evil = renderMarkdown('[x](javascript:alert(1)) [y](https://a.b/" onmouseover="z)');
  ok("non-http links and quote-injection stay plain text", !evil.includes("<a ") && !evil.includes("onmouseover=\"z\""));
  globalThis.katex = prevKatex;
}

// ---------------------------------------------------------------- report
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
