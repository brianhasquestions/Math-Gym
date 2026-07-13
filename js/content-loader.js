// content-loader.js
// Loads the manifest and individual topic files. Pure fetch + light validation;
// no DOM. Caches results so repeat navigations don't re-fetch.

const cache = new Map();

// The cache holds the PROMISE, not the resolved value, so concurrent callers
// (e.g. subjectMap's Promise.all fan-out) share one in-flight fetch instead of
// double-fetching. A failed load is evicted so a later retry can succeed.
function getJSON(path) {
  if (!cache.has(path)) {
    const p = (async () => {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to load ${path} (${res.status})`);
      return res.json();
    })();
    p.catch(() => cache.delete(path));
    cache.set(path, p);
  }
  return cache.get(path);
}

export async function loadManifest() {
  return getJSON("content/manifest.json");
}

export async function loadTopic(topicId) {
  const manifest = await loadManifest();
  let entry = null;
  for (const subject of manifest.subjects) {
    const t = subject.topics.find((tp) => tp.id === topicId);
    if (t) { entry = t; break; }
  }
  if (!entry) throw new Error(`Topic not found in manifest: ${topicId}`);
  const topic = await getJSON(entry.file);
  validateTopic(topic);
  return topic;
}

// Minimal structural validation — catches authoring mistakes early.
function validateTopic(topic) {
  if (!topic.id) throw new Error("Topic missing id");
  if (!Array.isArray(topic.keyConcepts) || topic.keyConcepts.length === 0)
    throw new Error(`Topic ${topic.id} has no keyConcepts`);
  if (!Array.isArray(topic.problems))
    throw new Error(`Topic ${topic.id} has no problems array`);
  const known = new Set(topic.keyConcepts.map((c) => c.id));
  for (const p of topic.problems) {
    for (const c of p.concepts || []) {
      if (!known.has(c))
        throw new Error(`Problem ${p.id} references unknown concept "${c}"`);
    }
    if (!Array.isArray(p.steps) || p.steps.length === 0)
      throw new Error(`Problem ${p.id} has no steps`);
  }
}

export function conceptIds(topic) {
  return topic.keyConcepts.map((c) => c.id);
}

export function conceptById(topic, id) {
  return topic.keyConcepts.find((c) => c.id === id) || null;
}
