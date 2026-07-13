// Enumerate thin concept×difficulty pools: for each topic, for each
// keyConcept × difficulty 1-3, count seed problems and check generator
// coverage (probe each registered template across several seeds).
// Usage: node tools/thinpools.mjs [--max N] [--subject id]
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gen = await import(pathToFileURL(path.join(REPO, "js/generator.js")).href);
const { generate, makeRng } = gen;

const args = process.argv.slice(2);
const maxCount = args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : 1;
const subjFilter = args.includes("--subject") ? args[args.indexOf("--subject") + 1] : null;

const manifest = JSON.parse(readFileSync(path.join(REPO, "content/manifest.json"), "utf8"));

const rows = [];
let totalPools = 0;
for (const subject of manifest.subjects) {
  if (subjFilter && subject.id !== subjFilter) continue;
  for (const t of subject.topics) {
    const topic = JSON.parse(readFileSync(path.join(REPO, t.file), "utf8"));
    // Map: concept -> difficulty -> {seeds, genTemplates}
    const genCover = new Map(); // "concept|diff" -> Set(template)
    for (const tmpl of topic.generators || []) {
      for (let seed = 1; seed <= 8; seed++) {
        const p = generate(tmpl, makeRng(seed), -1);
        if (!p) continue;
        for (const c of p.concepts || []) {
          const key = `${c}|${p.difficulty}`;
          if (!genCover.has(key)) genCover.set(key, new Set());
          genCover.get(key).add(tmpl);
        }
      }
    }
    const seedCount = new Map();
    for (const p of topic.problems || []) {
      for (const c of p.concepts || []) {
        const key = `${c}|${p.difficulty}`;
        seedCount.set(key, (seedCount.get(key) || 0) + 1);
      }
    }
    for (const c of topic.keyConcepts || []) {
      for (const d of [1, 2, 3]) {
        totalPools++;
        const key = `${c.id}|${d}`;
        const seeds = seedCount.get(key) || 0;
        const gens = genCover.get(key)?.size || 0;
        if (gens === 0 && seeds <= maxCount) {
          rows.push({ subject: subject.id, topic: topic.id, concept: c.id, diff: d, seeds });
        }
      }
    }
  }
}

rows.sort((a, b) => b.diff - a.diff || a.subject.localeCompare(b.subject) || a.topic.localeCompare(b.topic));
const bySubj = {};
for (const r of rows) bySubj[r.subject] = (bySubj[r.subject] || 0) + 1;
console.log(`total pools: ${totalPools}, thin (seeds<=${maxCount}, no gen): ${rows.length}`);
console.log("by subject:", JSON.stringify(bySubj, null, 0));
console.log("by tier:", [3, 2, 1].map(d => `d${d}=${rows.filter(r => r.diff === d).length}`).join(" "));
for (const r of rows) console.log(`${r.diff} ${r.topic} ${r.concept} seeds=${r.seeds}`);
