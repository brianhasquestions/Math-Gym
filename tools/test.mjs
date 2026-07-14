// Unit tests for the MathGym engine — grader, mastery model, progress store,
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
group("grader — accepts equivalent forms");
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

group("grader — rejects wrong / gamed answers");
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

group("grader — factored gate still accepts real factorings");
eq("factored accepted", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(x-3)(x-2)"), true);
eq("gcf factored accepted", checkStep({ form: "factored", answer: "2x(3x+4)" }, "2x(3x+4)"), true);
eq("constant-times-paren accepted", checkStep({ form: "factored", answer: "2(x+3)" }, "2(x + 3)"), true);
eq("squared factor accepted", checkStep({ form: "factored", answer: "(x+3)^2" }, "(x+3)^2"), true);
eq("factored equation accepted", checkStep({ form: "factored", answer: "(2u - 1)(u - 1) = 0" }, "(2u-1)(u-1)=0"), true);

group("grader — factored gate rejects trivial ±1 wrappers");
eq("1(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "1(x^2-5x+6)"), false);
eq("(1)(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(1)(x^2-5x+6)"), false);
eq("(...)*1 rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "(x^2-5x+6)*1"), false);
eq("-1(...) rejected", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "-1(-x^2+5x-6)"), false);
eq("1(...)=0 equation rejected", checkStep({ form: "factored", answer: "(2u-1)(u-1)=0" }, "1(2u^2-3u+1)=0"), false);
eq("1 times a REAL factoring still ok", checkStep({ form: "factored", answer: "(x-2)(x-3)" }, "1(x-2)(x-3)"), true);

group("grader — numeric formats and tolerance");
eq("thousands separator accepted", checkStep({ answer: "1000" }, "1,000"), true);
eq("grouped decimal accepted", checkStep({ answer: "431676.38" }, "431,676.38"), true);
eq("tuple still a tuple", checkStep({ answer: "(1, 0)" }, "1,0"), true);
eq("non-grouped comma not a number", checkStep({ answer: "1234" }, "12,34"), false);
eq("user cannot under-round a decimal answer", checkStep({ answer: "7.25" }, "7.3"), false);
eq("rounding an exact fraction still ok", checkStep({ answer: "1/3" }, "0.33"), true);
eq("more precision than the answer still ok", checkStep({ answer: "0.67" }, "0.667"), true);

group("grader — polynomial blowup guard (pMul like-term merging + caps)");
{
  const t0 = Date.now();
  const r = checkStep({ answer: "x+1" }, "(x+1)^8(x+1)^8(x+1)^8(x+1)^8");
  const ms = Date.now() - t0;
  eq("huge power product rejected", r, false);
  ok(`…and fast (${ms}ms < 500ms)`, ms < 500);
  eq("merged expansion still equates", checkStep({ answer: "(x+1)^2" }, "x^2+2x+1"), true);
}

// ---------------------------------------------------------------- mastery model
group("mastery model — config is self-consistent");
eq("validateConfig empty", mastery.validateConfig().length, 0);

group("mastery model — initState prunes orphans + stale focus");
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

group("mastery model — grade transitions");
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

group("mastery model — credit capped at served difficulty");
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

group("mastery model — spaced-repetition review lifecycle");
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
group("generator — unit coefficients stripped, prose and currency intact");
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
group("progress store — sanitizes bad data");
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
group("ProblemSource — serves and varies");
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
group("plot renderer — robust");
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

group("plot renderer — binary operators in fn (compileFn self-capture regression)");
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
group("markdown renderer — tables (payoff matrices, data tables)");
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

// ---------------------------------------------------------------- report
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
