// progress-store.js
// Versioned localStorage persistence for learner progress.
// Stores per-concept mastery state keyed by topic id. Exportable/importable
// so a learner isn't locked to one browser (no backend in v1).

const STORAGE_KEY = "mathgym.progress";
const SCHEMA_VERSION = 1;

function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, topics: {} };
}

const isPlainObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const validConcept = (c) => isPlainObject(c) && typeof c.proficiency === "number" && Array.isArray(c.recent);

// Return a store whose shape downstream code can trust — `topics` is always a
// plain object, and any topic state that isn't a well-formed concept map is
// dropped rather than left to crash getTopicState/initState/grade later. This
// is what guards against a hand-edited or maliciously-crafted imported file.
function sanitizeStore(data) {
  if (!isPlainObject(data) || !isPlainObject(data.topics)) return emptyStore();
  const topics = {};
  for (const [id, st] of Object.entries(data.topics)) {
    if (!isPlainObject(st) || !isPlainObject(st.concepts)) continue;
    const concepts = Object.values(st.concepts);
    if (concepts.length && !concepts.every(validConcept)) continue;
    topics[id] = st;
  }
  return { schemaVersion: SCHEMA_VERSION, topics };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw);
    if (!isPlainObject(data) || data.schemaVersion !== SCHEMA_VERSION) {
      // Future migrations branch here. For now, start fresh on mismatch.
      return emptyStore();
    }
    return sanitizeStore(data);
  } catch {
    return emptyStore();
  }
}

function save(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or blocked (private mode); progress is best-effort in v1.
  }
}

export function getTopicState(topicId) {
  const store = load();
  return store.topics[topicId] || null;
}

export function setTopicState(topicId, state) {
  const store = load();
  store.topics[topicId] = state;
  save(store);
}

export function isTopicMastered(topicId) {
  const state = getTopicState(topicId);
  return !!(state && state.topicMastered);
}

export function resetTopic(topicId) {
  const store = load();
  delete store.topics[topicId];
  save(store);
}

export function resetAll() {
  save(emptyStore());
}

export function exportProgress() {
  return JSON.stringify(load(), null, 2);
}

export function importProgress(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Incompatible progress file version.");
  }
  save(data);
}
