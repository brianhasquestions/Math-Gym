// MathGym content validation harness (rebuilt 2026-07-01).
// Imports the REAL grader/generators from the repo and validates topic files.
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

// Repo root = parent of this tools/ directory, so the harness works wherever
// the repo lives.
export const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const engine = await import(pathToFileURL(path.join(REPO, "js/problem-engine.js")).href);
const gen = await import(pathToFileURL(path.join(REPO, "js/generator.js")).href);
const { checkStep, ProblemSource } = engine;
const { generate, hasGenerator, makeRng } = gen;

export function validateTopic(filePath, opts = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  let topic;
  try {
    topic = JSON.parse(readFileSync(filePath, "utf8"));
  } catch (e) {
    return { errors: [`JSON parse failed: ${e.message}`], warnings, topic: null };
  }

  // --- metadata ---
  for (const f of ["id", "subject", "title"]) if (!topic[f]) err(`missing metadata field '${f}'`);
  const concepts = topic.keyConcepts || [];
  if (concepts.length === 0) err("no keyConcepts");
  const conceptIds = new Set();
  for (const c of concepts) {
    if (!c.id || !c.label) err(`keyConcept missing id/label: ${JSON.stringify(c).slice(0, 60)}`);
    if (!c.microLesson || c.microLesson.trim().length < 20) err(`concept '${c.id}' missing/thin microLesson`);
    conceptIds.add(c.id);
  }
  if (!topic.lecture || !(topic.lecture.body || "").trim()) err("missing lecture body");
  if (!topic.application || !topic.application.workedExample) err("missing application/workedExample");

  // --- seed problems ---
  const problems = topic.problems || [];
  if (problems.length < 12) warn(`only ${problems.length} seed problems (target >= 15)`);
  const seenIds = new Set();
  for (const p of problems) {
    const pid = p.id || "(no id)";
    if (seenIds.has(pid)) err(`duplicate problem id ${pid}`);
    seenIds.add(pid);
    if (![1, 2, 3].includes(p.difficulty)) err(`${pid}: bad difficulty ${p.difficulty}`);
    if (!p.concepts || p.concepts.length === 0) err(`${pid}: no concepts`);
    for (const c of p.concepts || []) if (!conceptIds.has(c)) err(`${pid}: unknown concept '${c}'`);
    if (!p.steps || p.steps.length === 0) err(`${pid}: no steps`);
    if (!p.finalAnswer) err(`${pid}: no finalAnswer`);
    for (let i = 0; i < (p.steps || []).length; i++) {
      const s = p.steps[i];
      if (!s.instruction) err(`${pid} step ${i + 1}: no instruction`);
      if (s.answer == null || String(s.answer).trim() === "") { err(`${pid} step ${i + 1}: empty answer`); continue; }
      if (!checkStep(s, s.answer)) err(`${pid} step ${i + 1}: answer '${s.answer}' does NOT self-check`);
      for (const a of s.accept || []) {
        if (!checkStep(s, a)) err(`${pid} step ${i + 1}: accept variant '${a}' does NOT pass`);
      }
    }
  }

  // --- generators ---
  const templates = topic.generators || [];
  const extraGens = opts.extraGens || null; // { name: fn } merged pack for pre-wiring self-tests
  const canGen = (t) => (extraGens && extraGens[t]) || hasGenerator(t);
  const runGen = (t, rng, idx) => (extraGens && extraGens[t]) ? extraGens[t](rng, idx) : generate(t, rng, idx);
  if (!opts.skipGens) {
    for (const t of templates) {
      if (!canGen(t)) { err(`generator '${t}' has no backing function`); continue; }
      for (let i = 1; i <= 30; i++) {
        let p;
        try { p = runGen(t, makeRng(i * 7919 + 3), i); } catch (e) { err(`generator '${t}' threw (seed ${i}): ${e.message}`); break; }
        if (!p) { err(`generator '${t}' returned null (seed ${i})`); break; }
        if (![1, 2, 3].includes(p.difficulty)) { err(`generator '${t}': bad difficulty ${p.difficulty}`); break; }
        if (!p.concepts || !p.concepts.every((c) => conceptIds.has(c))) { err(`generator '${t}': concept(s) ${p.concepts} not in topic`); break; }
        if (!p.steps || p.steps.length === 0) { err(`generator '${t}': no steps (seed ${i})`); break; }
        let bad = false;
        for (let j = 0; j < p.steps.length; j++) {
          const s = p.steps[j];
          if (!checkStep(s, s.answer)) { err(`generator '${t}' seed ${i} step ${j + 1}: answer '${s.answer}' does NOT self-check`); bad = true; break; }
          for (const a of s.accept || []) {
            if (!checkStep(s, a)) { err(`generator '${t}' seed ${i} step ${j + 1}: accept '${a}' fails`); bad = true; break; }
          }
          if (bad) break;
        }
        if (bad) break;
      }
    }
  }

  // --- servability at every tier (masterability requires tier 3) ---
  if (!opts.skipGens && !extraGens) {
    for (const cid of conceptIds) {
      for (const d of [1, 2, 3]) {
        const src = new ProblemSource(topic);
        const p = src.next(cid, d);
        if (!p) err(`concept '${cid}' NOT servable at difficulty ${d}`);
        else if (p.difficulty !== d) warn(`concept '${cid}' tier ${d}: served via relaxed fallback (got tier ${p.difficulty})`);
      }
    }
  } else if (extraGens) {
    // Pre-wiring approximation: exact-tier pool from seeds + pack probes.
    for (const cid of conceptIds) {
      for (const d of [1, 2, 3]) {
        const seedHit = problems.some((p) => p.difficulty === d && (p.concepts || []).includes(cid));
        const genHit = templates.some((t) => {
          if (!canGen(t)) return false;
          try { const probe = runGen(t, makeRng(1), -1); return probe && probe.difficulty === d && probe.concepts.includes(cid); }
          catch { return false; }
        });
        if (!seedHit && !genHit) warn(`concept '${cid}' has no exact tier-${d} source`);
      }
    }
  }

  return { errors, warnings, topic };
}
