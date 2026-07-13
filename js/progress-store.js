// progress-store.js
// Versioned localStorage persistence for learner progress.
// Stores per-concept mastery state keyed by topic id. Exportable/importable
// so a learner isn't locked to one browser (no backend in v1).

import { CONFIG } from "./mastery-model.js";

const STORAGE_KEY = "mathgym.progress";
const SCHEMA_VERSION = 1;

function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, topics: {} };
}

const isPlainObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const validConcept = (c) => isPlainObject(c) && typeof c.proficiency === "number" && Array.isArray(c.recent);

const numOr = (v, fallback) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const count = (v) => Math.max(0, Math.round(numOr(v, 0)));

// Coerce one stored concept into the exact shape grade() assumes. A field that
// is missing or the wrong type (hand-edited file, truncated import) must never
// reach the model: `gainBase * undefined` is NaN, and a NaN proficiency
// persists forever and silently makes the topic unmasterable.
function sanitizeConcept(id, c) {
  return {
    id: typeof c.id === "string" ? c.id : id,
    proficiency: Math.min(1, Math.max(0, numOr(c.proficiency, 0))),
    recent: c.recent.slice(-32).map(Boolean),
    currentDifficulty: Math.min(CONFIG.topDifficulty, Math.max(1, Math.round(numOr(c.currentDifficulty, 1)))),
    attempts: count(c.attempts),
    consecutiveCorrect: count(c.consecutiveCorrect),
    consecutiveTopClean: count(c.consecutiveTopClean),
    consecutiveWrong: count(c.consecutiveWrong),
    hintsUsed: count(c.hintsUsed),
    mastered: c.mastered === true,
    mustProveClean: c.mustProveClean === true,
  };
}

// Return a store whose shape downstream code can trust — `topics` is always a
// plain object, any topic state that isn't a well-formed concept map is
// dropped, and every surviving field is coerced to its expected type. This is
// what guards against a hand-edited or maliciously-crafted imported file.
function sanitizeStore(data) {
  if (!isPlainObject(data) || !isPlainObject(data.topics)) return emptyStore();
  const topics = {};
  for (const [id, st] of Object.entries(data.topics)) {
    if (!isPlainObject(st) || !isPlainObject(st.concepts)) continue;
    if (!Object.values(st.concepts).every(validConcept)) continue;
    const concepts = {};
    for (const [cid, c] of Object.entries(st.concepts)) concepts[cid] = sanitizeConcept(cid, c);
    topics[id] = {
      ...st,
      topicId: typeof st.topicId === "string" ? st.topicId : id,
      concepts,
      topicMastered: st.topicMastered === true,
      totalAnswered: count(st.totalAnswered),
      focusConceptId: typeof st.focusConceptId === "string" ? st.focusConceptId : null,
      conceptOrder: Array.isArray(st.conceptOrder) ? st.conceptOrder.filter((x) => typeof x === "string") : [],
      reviewLevel: count(st.reviewLevel),
      nextReviewAt: numOr(st.nextReviewAt, null),
      lastPracticed: numOr(st.lastPracticed, null),
    };
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
  // Sanitize BEFORE persisting — imported files are untrusted input.
  save(sanitizeStore(data));
}
