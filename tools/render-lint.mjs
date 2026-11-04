// Render lint: push every learner-visible string: lectures, microLessons,
// worked examples, seed prompts/instructions/hints/narratives, and a sample of
// every generator's output: through the REAL renderer + vendored KaTeX and
// fail on anything a student would see broken. validate.mjs can't catch these
// (it only checks that answers self-grade).
//
// Usage: node tools/render-lint.mjs [--seeds N] [--subject id] [--verbose]
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { REPO } from "./harness.mjs";

// The vendored KaTeX is a UMD bundle; package.json says "type":"module", so
// Node would load it as ESM. Evaluate it CommonJS-style instead.
{
  const mod = { exports: {} };
  new Function("module", "exports", readFileSync(path.join(REPO, "vendor/katex/katex.min.js"), "utf8"))(mod, mod.exports);
  globalThis.katex = mod.exports.default || mod.exports;
}
const { renderMarkdown } = await import(pathToFileURL(path.join(REPO, "js/renderer.js")).href);
const { generate, makeRng } = await import(pathToFileURL(path.join(REPO, "js/generator.js")).href);

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const SEEDS = Number(opt("--seeds", 25));
const SUBJECT = opt("--subject", null);
const VERBOSE = args.includes("--verbose");

// Count $ delimiters that are not escaped (an odd number of preceding
// backslashes escapes it). An odd total means a span never closes.
function unescapedDollars(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "$") continue;
    let bs = 0;
    for (let k = i - 1; k >= 0 && s[k] === "\\"; k--) bs++;
    if (bs % 2 === 0) n++;
  }
  return n;
}

const CHECKS = [
  ["katex-error", (s, html) => html.includes("katex-error")],
  // ```plot fences are JSON for the SVG plotter, not prose: skip them.
  ["unpaired $", (s) => unescapedDollars(s.replace(/^```[\s\S]*?^```\s*$/gm, "")) % 2 === 1],
  // A decoded "\\frac" is a JSON double-escape: KaTeX reads "\\" as a line
  // break and prints the command name as letters.
  ["double-escaped LaTeX", (s) => /\\\\(?:frac|dfrac|lim|sqrt|cdot|times|langle|rangle|int|sum|le|ge|ne|pi|theta|lambda|vec|mathbb|text|left|right|infty|to|quad|Rightarrow)(?![a-zA-Z])/.test(s)],
  ["template placeholder", (s) => /\$\{[^}]*\}/.test(s)],
  ["NaN / [object]", (s) => /\bNaN\b|\[object /.test(s)],
  // Binary float noise: 12+ decimals ending in a long 0-run after a nonzero
  // digit, or a long 9-run ("0.060000000000000005", "62.99999999999999").
  ["float noise", (s) => /\d\.(?=\d{12})\d*?(?:[1-9]0{6,}[1-9]\d{0,2}|9{6,}\d{0,3})(?!\d)/.test(s)],
  ["pipe rows not rendered as table", (s, html) => /\n\s*\|.*\|\s*\n\s*\|.*\|/.test(s) && !html.includes("<table")],
];

const problems = new Map(); // check -> [where]
let strings = 0;
function lint(where, s) {
  if (typeof s !== "string" || !s) return;
  strings++;
  let html = "";
  try { html = renderMarkdown(s); } catch (e) { html = `katex-error THROW ${e.message}`; }
  for (const [name, fn] of CHECKS) {
    if (fn(s, html)) {
      if (!problems.has(name)) problems.set(name, []);
      problems.get(name).push(`${where} :: ${s.replace(/\s+/g, " ").slice(0, 110)}`);
    }
  }
}
function lintProblem(where, p) {
  lint(`${where} prompt`, p.prompt);
  lint(`${where} narrative`, p.solutionNarrative);
  (p.steps || []).forEach((st, i) => {
    lint(`${where} step${i + 1} instruction`, st.instruction);
    lint(`${where} step${i + 1} hint`, st.hint);
  });
}

const manifest = JSON.parse(readFileSync(path.join(REPO, "content/manifest.json"), "utf8"));
for (const subject of manifest.subjects) {
  if (SUBJECT && subject.id !== SUBJECT) continue;
  for (const t of subject.topics) {
    const topic = JSON.parse(readFileSync(path.join(REPO, t.file), "utf8"));
    lint(`${t.id} lecture`, topic.lecture && topic.lecture.body);
    for (const c of topic.keyConcepts || []) lint(`${t.id} microLesson ${c.id}`, c.microLesson);
    const app = topic.application || {};
    for (const [k, v] of Object.entries(app)) {
      if (typeof v === "string") lint(`${t.id} application.${k}`, v);
      else if (v && typeof v === "object") for (const [k2, v2] of Object.entries(v)) lint(`${t.id} application.${k}.${k2}`, v2);
    }
    for (const p of topic.problems || []) lintProblem(p.id, p);
    for (const g of topic.generators || []) {
      for (let s = 1; s <= SEEDS; s++) {
        const p = generate(g, makeRng(s * 104729 + 7), s);
        if (p) lintProblem(`${t.id}:${g}#${s}`, p);
      }
    }
  }
}

// Collapse generator repeats: report each template once with a count.
let total = 0;
for (const [name, list] of problems) {
  const grouped = new Map();
  for (const w of list) {
    const key = w.replace(/#\d+/, "").split(" :: ")[0];
    if (!grouped.has(key)) grouped.set(key, { first: w, n: 0 });
    grouped.get(key).n++;
  }
  total += grouped.size;
  console.log(`\n## ${name}: ${grouped.size} distinct location(s), ${list.length} hit(s)`);
  const rows = [...grouped.values()];
  for (const r of VERBOSE ? rows : rows.slice(0, 25)) console.log(`  (${r.n}x) ${r.first}`);
  if (!VERBOSE && rows.length > 25) console.log(`  … ${rows.length - 25} more (use --verbose)`);
}
console.log(`\n${strings} strings rendered, ${total} distinct problem location(s).`);
process.exit(total ? 1 : 0);
