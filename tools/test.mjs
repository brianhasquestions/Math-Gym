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

// ---------------------------------------------------------------- report
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
