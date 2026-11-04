// Generator oracles: INDEPENDENT recomputation of generated answers.
//
// validate.mjs only proves an answer grades correct against itself, so a
// generator that computes the wrong answer (or draws a degenerate case where
// its stated answer is false) passes CI. Each module in tools/oracles/ exports
//
//   export const oracles = {
//     "template-name": (problem, ctx) => null | "what is wrong",
//   };
//
// where the oracle re-derives the answer from the PROMPT (never by calling
// the generator's own helpers) and returns a message on any mismatch.
// `ctx.checkStep` is the real grader, for asserting that a correct
// alternative answer is accepted or a wrong one rejected.
//
// Usage: node tools/oracles.mjs [--seeds N] [--only name-substring]
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { REPO } from "./harness.mjs";

const { generate, makeRng, hasGenerator } = await import(pathToFileURL(path.join(REPO, "js/generator.js")).href);
const { checkStep } = await import(pathToFileURL(path.join(REPO, "js/problem-engine.js")).href);

const args = process.argv.slice(2);
const SEEDS = Number(args.includes("--seeds") ? args[args.indexOf("--seeds") + 1] : 300);
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const dir = path.join(REPO, "tools/oracles");
const all = {};
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mjs")).sort()) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  for (const [name, fn] of Object.entries(mod.oracles || {})) {
    if (all[name]) throw new Error(`oracle for ${name} defined twice (${f})`);
    all[name] = { fn, file: f };
  }
}

let failed = 0, checked = 0;
for (const [name, { fn, file }] of Object.entries(all)) {
  if (ONLY && !name.includes(ONLY)) continue;
  if (!hasGenerator(name)) { console.log(`FAIL ${name} (${file}): no such generator`); failed++; continue; }
  const bad = [];
  for (let s = 1; s <= SEEDS; s++) {
    // Seeds deliberately differ from validate.mjs's fixed 30.
    const p = generate(name, makeRng(s * 2654435761 % 4294967291 + 11), s);
    checked++;
    let msg;
    try { msg = fn(p, { checkStep, seed: s }); } catch (e) { msg = `oracle threw: ${e.message}`; }
    if (msg) bad.push(`seed ${s}: ${msg}`);
  }
  if (bad.length) {
    failed++;
    console.log(`FAIL ${name} (${file}): ${bad.length}/${SEEDS} draws`);
    for (const b of bad.slice(0, 3)) console.log(`     ${b}`);
  }
}
console.log(`\n${Object.keys(all).length} oracles, ${checked} generated problems checked, ${failed} failing.`);
process.exit(failed ? 1 : 0);
