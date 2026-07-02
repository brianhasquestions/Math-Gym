// progress-store.js
// Versioned localStorage persistence for learner progress.
// Stores per-concept mastery state keyed by topic id. Exportable/importable
// so a learner isn't locked to one browser (no backend in v1).

const STORAGE_KEY = "mathgym.progress";
const SCHEMA_VERSION = 1;

function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, topics: {} };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const data = JSON.parse(raw);
    if (data.schemaVersion !== SCHEMA_VERSION) {
      // Future migrations branch here. For now, start fresh on mismatch.
      return emptyStore();
    }
    return data;
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
