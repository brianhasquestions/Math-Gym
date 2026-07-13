// placement.js — a short diagnostic that samples one problem from a ladder of
// milestone topics, grades the learner's final answers, gives a head-start on
// the topics they clearly know, and recommends where to begin. It never wipes
// existing progress (head-start grades are merged onto any saved state).

import { loadManifest, loadTopic } from "./content-loader.js";
import { getTopicState, setTopicState } from "./progress-store.js";
import { initState, grade } from "./mastery-model.js";
import { checkStep } from "./problem-engine.js";
import { renderProseInto } from "./renderer.js";
import { el, showError } from "./app.js";

// A spread across the catalog, easy -> hard. Missing ids are skipped silently.
const MILESTONES = [
  "algebra.real-numbers",
  "algebra.linear-equations",
  "algebra.quadratic-equations",
  "algebra-2.functions",
  "geometry.pythagorean-theorem",
  "trigonometry.radians-and-unit-circle",
  "calculus-1.derivative-rates-of-change",
  "calculus-2.definite-integrals",
  "statistics.probability-basics",
  "cryptography.modular-arithmetic",
];

// Prefer a mid-difficulty seed with a short, cleanly-gradeable final answer.
function pickProblem(topic) {
  const probs = (topic.problems || []).filter((p) => p.finalAnswer && String(p.finalAnswer.value || "").trim());
  const rank = (p) => (p.difficulty === 2 ? 0 : p.difficulty === 1 ? 1 : 2) + (String(p.finalAnswer.value).length <= 14 ? 0 : 5);
  probs.sort((a, b) => rank(a) - rank(b));
  return probs[0] || null;
}

// A couple of clean corrects => a modest proficiency head-start (NOT mastery),
// merged onto any existing state so we never erase real progress.
function seedHeadStart(topic) {
  const conceptIds = (topic.keyConcepts || []).map((c) => c.id);
  if (!conceptIds.length) return;
  const st = initState(topic.id, conceptIds, getTopicState(topic.id));
  for (const cid of conceptIds) {
    grade(st, { correct: true, hintsUsed: 0, conceptId: cid, wrongs: 0 });
    grade(st, { correct: true, hintsUsed: 0, conceptId: cid, wrongs: 0 });
  }
  setTopicState(topic.id, st);
}

export async function runPlacement(root) {
  root.textContent = "";
  root.appendChild(el("h1", {}, "Placement quiz"));
  root.appendChild(el("p", { class: "lede" },
    "Answer as many as you can — one question from across the catalog, easy to hard. " +
    "Skip anything you haven't learned yet. We'll give you a head-start on what you already know."));

  let manifest;
  try { manifest = await loadManifest(); } catch (e) { showError(root, `Could not start the quiz: ${e.message}`); return; }
  const titleById = new Map(manifest.subjects.flatMap((s) => s.topics.map((t) => [t.id, { title: t.title, subject: s.title, subjectId: s.id }])));

  // Load each milestone topic + a representative problem.
  const items = [];
  for (const id of MILESTONES) {
    if (!titleById.has(id)) continue;
    let topic;
    try { topic = await loadTopic(id); } catch { continue; }
    const problem = pickProblem(topic);
    if (!problem) continue;
    items.push({ id, topic, problem, meta: titleById.get(id) });
  }
  if (!items.length) { showError(root, "No placement questions are available right now."); return; }

  const form = el("div", { class: "placement-form" });
  items.forEach((it, i) => {
    const q = el("section", { class: "card placement-q" });
    q.appendChild(el("div", { class: "placement-meta" }, `${i + 1}. ${it.meta.subject} — ${it.meta.title}`));
    const prompt = el("div", { class: "placement-prompt" });
    renderProseInto(prompt, it.problem.prompt);
    q.appendChild(prompt);
    const unit = it.problem.finalAnswer.unit ? ` (${it.problem.finalAnswer.unit})` : "";
    it.input = el("input", { class: "step-input", type: "text", autocomplete: "off", placeholder: `Your answer${unit}…`, "aria-label": `Answer for question ${i + 1}` });
    q.appendChild(el("div", { class: "placement-answer" }, it.input));
    form.appendChild(q);
  });
  root.appendChild(form);

  const submit = el("button", { class: "btn", style: "margin-top: var(--space-3)" }, "See my results");
  root.appendChild(submit);

  submit.addEventListener("click", () => {
    let correct = 0;
    let firstMissed = null;
    for (const it of items) {
      const val = it.input.value.trim();
      const fa = it.problem.finalAnswer;
      // Grade with the final step's `form` semantics (e.g. "solutions" for a
      // quadratic's root set) — without it, correct answers like "5, -1" for
      // "x = 5, x = -1" are rejected and the quiz places the learner too low.
      const steps = it.problem.steps || [];
      const lastForm = steps.length ? steps[steps.length - 1].form : undefined;
      const good = val !== "" && checkStep({ answer: fa.value, accept: fa.accept || [], form: lastForm }, val);
      if (good) { correct++; seedHeadStart(it.topic); }
      else if (!firstMissed) firstMissed = it;
    }
    showResults(root, items.length, correct, firstMissed);
  });
}

function showResults(root, total, correct, firstMissed) {
  root.textContent = "";
  root.appendChild(el("h1", {}, "Your placement"));
  const pct = Math.round((100 * correct) / total);
  const card = el("section", { class: "card" }, [
    el("div", { class: "dash-stats" }, [
      el("div", { class: "dash-stat" }, [el("div", { class: "dash-stat-num" }, `${correct} / ${total}`), el("div", { class: "dash-stat-label" }, "milestones cleared")]),
      el("div", { class: "dash-stat" }, [el("div", { class: "dash-stat-num" }, `${pct}%`), el("div", { class: "dash-stat-label" }, "of the ladder")]),
    ]),
    el("div", { class: "dash-bar" }, el("div", { class: "dash-bar-fill", style: `width:${pct}%` })),
  ]);
  root.appendChild(card);

  const rec = el("section", { class: "card", style: "margin-top: var(--space-3)" });
  rec.appendChild(el("h3", { style: "margin-top:0" }, "Where to start"));
  if (firstMissed) {
    rec.appendChild(el("p", {}, `You cleared everything up to ${firstMissed.meta.subject}. A good place to dig in is:`));
    rec.appendChild(el("a", { class: "btn", href: `topic.html?id=${encodeURIComponent(firstMissed.id)}` }, `Start: ${firstMissed.meta.title}`));
  } else {
    rec.appendChild(el("p", {}, "You cleared every milestone — impressive. Jump into any advanced subject, or pick a topic that looks new."));
  }
  rec.appendChild(el("p", { style: "margin-top: var(--space-3); color: var(--text-dim)" },
    "We've given the topics you nailed a head-start — you'll see it on the home dashboard."));
  const links = el("div", { style: "display:flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-2)" }, [
    el("a", { class: "btn secondary", href: "index.html" }, "Home & progress"),
  ]);
  rec.appendChild(links);
  root.appendChild(rec);
}
