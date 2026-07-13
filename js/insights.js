// insights.js — cross-topic intelligence (ROADMAP Phase 5).
//
// Pure logic over two data sources we already have:
//   1. the prerequisite graph, authored as `prerequisites: [topicId,...]` in each
//      topic file (edges may cross subjects, e.g. algebra-2 → algebra.factoring), and
//   2. the learner's stored per-topic mastery state (progress-store).
//
// It answers three questions the app then surfaces:
//   • "What does this topic build on, and have I mastered it?"  (prereq gate)
//   • "Where should I pick up in this subject?"                 (recommended next)
//   • "Which skills are weakest across this whole subject?"     (diagnostic)
//
// No DOM here — pages import these and render. Topic files are fetched via the
// cached content-loader, so repeat calls in a page are cheap.

import { loadManifest, loadTopic } from "./content-loader.js";
import { getTopicState } from "./progress-store.js";
import { topicProgress, reviewStatus } from "./mastery-model.js";

// ---- Topic status (no fetch — reads stored progress only) -----------------
// Returns a stable shape whether or not the learner has ever touched the topic.
export function topicStatus(topicId) {
  const st = getTopicState(topicId);
  if (!st) {
    return { state: "not-started", started: false, mastered: false, progress: 0, answered: 0, dueForReview: false, nextReviewAt: null };
  }
  const mastered = !!st.topicMastered;
  const rs = reviewStatus(st);
  return {
    state: mastered ? "mastered" : "in-progress",
    started: true,
    mastered,
    progress: topicProgress(st),
    answered: st.totalAnswered || 0,
    dueForReview: rs.due,
    nextReviewAt: rs.nextReviewAt,
  };
}

// Direct prerequisites for a topic (topic ids). Needs the topic file.
export async function prerequisitesOf(topicId) {
  const t = await loadTopic(topicId);
  return Array.isArray(t.prerequisites) ? t.prerequisites : [];
}

// Direct prerequisites the learner has NOT yet mastered, resolved to
// { id, title, mastered, progress }. `title` falls back to the raw id if the
// prereq isn't in the manifest (defensive against a bad edge).
export async function unmetPrerequisites(topicId) {
  const pres = await prerequisitesOf(topicId);
  if (!pres.length) return [];
  const titles = await topicTitleMap();
  return pres
    .map((id) => {
      const s = topicStatus(id);
      return { id, title: titles.get(id) || id, mastered: s.mastered, progress: s.progress };
    })
    .filter((p) => !p.mastered);
}

// A topic is "ready" when every direct prerequisite is mastered (or it has none).
export async function isReady(topicId) {
  return (await unmetPrerequisites(topicId)).length === 0;
}

// ---- Manifest helpers ------------------------------------------------------
// id -> title across ALL subjects, so cross-subject prereq edges resolve.
let _titleMap = null;
export async function topicTitleMap() {
  if (_titleMap) return _titleMap;
  const man = await loadManifest();
  const m = new Map();
  for (const s of man.subjects) for (const t of s.topics || []) m.set(t.id, t.title);
  _titleMap = m;
  return m;
}

function findSubject(manifest, subjectId) {
  return manifest.subjects.find((s) => s.id === subjectId) || null;
}

// ---- Subject learning map (the diagnostic) --------------------------------
// Builds an ordered, status-annotated view of one subject plus a recommended
// next topic and the learner's weakest touched concepts across the subject.
export async function subjectMap(subjectId) {
  const manifest = await loadManifest();
  const subject = findSubject(manifest, subjectId);
  if (!subject) throw new Error(`Unknown subject: ${subjectId}`);
  const titles = await topicTitleMap();
  const inSubject = new Set((subject.topics || []).map((t) => t.id));

  // Pull each topic's prereqs (cached fetch) up front.
  const raw = await Promise.all(
    (subject.topics || []).map(async (t) => ({
      id: t.id,
      title: t.title,
      prereqs: await prerequisitesOf(t.id),
    }))
  );

  // Order topics so a prereq inside this subject always precedes its dependents.
  // Seeded by manifest order (already roughly pedagogical) for stable tie-breaks.
  const ordered = topoOrder(raw, inSubject);

  const topics = ordered.map((t) => {
    const status = topicStatus(t.id);
    const prereqs = t.prereqs.map((id) => {
      const s = topicStatus(id);
      return { id, title: titles.get(id) || id, mastered: s.mastered, inSubject: inSubject.has(id) };
    });
    const unmet = prereqs.filter((p) => !p.mastered);
    return { ...t, status, prereqs, unmet, ready: unmet.length === 0 };
  });

  // Recommend where to pick up: the earliest unmastered topic that's ready,
  // preferring one already in progress over a fresh start. If none are ready
  // (every unmastered topic is blocked), fall back to the earliest unmastered.
  const unmastered = topics.filter((t) => !t.status.mastered);
  const ready = unmastered.filter((t) => t.ready);
  const recommended =
    ready.find((t) => t.status.started) || ready[0] || unmastered[0] || null;
  const recommendedId = recommended ? recommended.id : null;
  for (const t of topics) t.recommended = t.id === recommendedId;

  const weakConcepts = await weakConceptsForSubject(subject);

  const mastered = topics.filter((t) => t.status.mastered).length;
  const inProgress = topics.filter((t) => t.status.state === "in-progress").length;
  return {
    subject: { id: subject.id, title: subject.title, blurb: subject.blurb || "" },
    topics,
    recommendedId,
    weakConcepts,
    summary: {
      total: topics.length,
      mastered,
      inProgress,
      notStarted: topics.length - mastered - inProgress,
    },
  };
}

// Kahn topological sort restricted to intra-subject edges. Cycles or external
// edges can't stall it: any node still pending once no zero-indegree node
// remains is emitted in seed order, so every topic appears exactly once.
function topoOrder(nodes, inSubject) {
  const seed = nodes.map((n) => n.id);
  const pos = new Map(seed.map((id, i) => [id, i]));
  const indeg = new Map(seed.map((id) => [id, 0]));
  const deps = new Map(seed.map((id) => [id, []])); // prereq -> dependents
  for (const n of nodes) {
    for (const p of n.prereqs) {
      if (!inSubject.has(p)) continue; // external prereqs don't affect ordering
      indeg.set(n.id, indeg.get(n.id) + 1);
      deps.get(p).push(n.id);
    }
  }
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out = [];
  const done = new Set();
  const ready = () =>
    seed
      .filter((id) => !done.has(id) && indeg.get(id) === 0)
      .sort((a, b) => pos.get(a) - pos.get(b));
  let frontier = ready();
  while (frontier.length) {
    const id = frontier[0];
    out.push(byId.get(id));
    done.add(id);
    for (const d of deps.get(id)) indeg.set(d, indeg.get(d) - 1);
    frontier = ready();
  }
  // Safety net: emit anything left (would only happen on a dependency cycle).
  for (const id of seed) if (!done.has(id)) out.push(byId.get(id));
  return out;
}

// Weakest touched concepts across a subject, for the diagnostic panel. Only
// concepts the learner has actually attempted and not yet mastered qualify.
async function weakConceptsForSubject(subject) {
  const rows = [];
  for (const t of subject.topics || []) {
    const st = getTopicState(t.id);
    if (!st || !st.concepts) continue;
    let topic = null; // lazy — only load the file if this topic has weak concepts
    for (const [cid, cs] of Object.entries(st.concepts)) {
      if (cs.mastered || (cs.attempts || 0) === 0) continue;
      if (!topic) topic = await loadTopic(t.id);
      const meta = topic.keyConcepts.find((k) => k.id === cid);
      rows.push({
        topicId: t.id,
        topicTitle: t.title,
        conceptId: cid,
        label: meta ? meta.label : cid,
        proficiency: cs.proficiency || 0,
      });
    }
  }
  rows.sort((a, b) => a.proficiency - b.proficiency);
  return rows.slice(0, 5);
}
