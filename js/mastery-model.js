// mastery-model.js
// The adaptive mastery engine. Tracks proficiency PER KEY CONCEPT (not per
// topic) so we can drill the exact weakness. Decides which concept/difficulty to
// serve next, and when a topic is truly mastered. All thresholds live in CONFIG
// so the difficulty curve can be tuned without touching logic (ROADMAP §6.5).

export const CONFIG = {
  windowSize: 8,            // rolling window of recent results per concept
  masteryProficiency: 0.85, // proficiency bar
  masteryConsecutiveTop: 3, // clean correct answers in a row at top difficulty
  topDifficulty: 3,
  startDifficulty: 1,
  escalateAfter: 2,         // consecutive clean corrects at a tier -> bump up
  microLessonAfter: 2,      // consecutive wrongs on a concept -> show micro-lesson
  showSolutionAfter: 3,     // consecutive wrongs on a concept -> reveal solution
  gainBase: 0.10,           // proficiency gain scales with difficulty
  hintGainPenalty: 0.5,     // multiplier applied to gain when hints were used
  wrongPenalty: 0.12,       // proficiency lost on a miss
  // Post-mastery review (spaced repetition): a mastered topic comes due for a
  // retention check on this escalating day ladder — each fully-held review
  // climbs a rung, any lapse sends the concept back into normal training.
  reviewIntervalsDays: [3, 7, 14, 30, 60],
  reviewLapseProficiency: 0.6, // where a lapsed concept's proficiency falls back to
};

const DAY_MS = 24 * 60 * 60 * 1000;

function freshConcept(id) {
  return {
    id,
    proficiency: 0,
    recent: [],            // booleans, capped at windowSize
    currentDifficulty: CONFIG.startDifficulty,
    attempts: 0,
    consecutiveCorrect: 0,     // clean corrects at current tier (for escalation)
    consecutiveTopClean: 0,    // clean corrects at TOP tier (for mastery)
    consecutiveWrong: 0,
    hintsUsed: 0,
    mastered: false,
    // §6.4 guardrail: set true once the learner has been shown a full worked
    // solution for this concept. While true, progress is frozen until they solve
    // a FRESH problem with no hints — proving the lesson actually landed.
    mustProveClean: false,
  };
}

// Build or rehydrate per-topic state for the given key-concept ids.
export function initState(topicId, conceptIds, existing) {
  const state = existing && existing.topicId === topicId
    ? existing
    : { topicId, concepts: {}, topicMastered: false, totalAnswered: 0, focusConceptId: null };
  for (const id of conceptIds) {
    if (!state.concepts[id]) state.concepts[id] = freshConcept(id);
  }
  // Drop any concept the topic no longer defines (renamed/removed since this
  // progress was saved). Otherwise an orphan keeps topicMastered permanently
  // false, and a focus lock on a vanished concept dead-ends the trainer.
  const live = new Set(conceptIds);
  for (const id of Object.keys(state.concepts)) {
    if (!live.has(id)) delete state.concepts[id];
  }
  if (state.focusConceptId && !live.has(state.focusConceptId)) state.focusConceptId = null;
  // Remember the authored skill order so we drill them one at a time, in order.
  state.conceptOrder = conceptIds.slice();
  // Topics mastered before review scheduling existed get their first retention
  // check scheduled from now.
  if (state.topicMastered && state.nextReviewAt == null) scheduleNextReview(state);
  return state;
}

// Pick the concept to drill — BLOCKED practice: stay on the current focus skill
// until it's mastered, then advance to the next unmastered skill in topic order.
// (We deliberately do NOT hop to the weakest skill after every problem; the
// learner grinds one skill to mastery before the next opens up.)
export function selectConcept(state) {
  const order = state.conceptOrder && state.conceptOrder.length
    ? state.conceptOrder
    : Object.keys(state.concepts);

  // Keep drilling the current focus skill while it's still unmastered.
  const focus = state.focusConceptId && state.concepts[state.focusConceptId];
  if (focus && !focus.mastered) return focus;

  // Otherwise lock onto the next unmastered skill, in authored order.
  for (const id of order) {
    const c = state.concepts[id];
    if (c && !c.mastered) { state.focusConceptId = id; return c; }
  }
  return null; // every skill mastered
}

// Defensive check that the tuning knobs are internally consistent. Returns an
// array of problem strings (empty == valid). Call from tests / dev boot.
export function validateConfig(cfg = CONFIG) {
  const errs = [];
  if (!(cfg.masteryProficiency > 0 && cfg.masteryProficiency <= 1))
    errs.push("masteryProficiency must be in (0, 1]");
  if (cfg.topDifficulty < cfg.startDifficulty)
    errs.push("topDifficulty must be >= startDifficulty");
  if (cfg.masteryConsecutiveTop < 1) errs.push("masteryConsecutiveTop must be >= 1");
  if (cfg.windowSize < 1) errs.push("windowSize must be >= 1");
  if (cfg.microLessonAfter > cfg.showSolutionAfter)
    errs.push("microLessonAfter should be <= showSolutionAfter");
  if (!Array.isArray(cfg.reviewIntervalsDays) || cfg.reviewIntervalsDays.length === 0 ||
      !cfg.reviewIntervalsDays.every((d, i, a) => d > 0 && (i === 0 || d >= a[i - 1])))
    errs.push("reviewIntervalsDays must be a non-empty, positive, non-decreasing ladder");
  if (!(cfg.reviewLapseProficiency >= 0 && cfg.reviewLapseProficiency < cfg.masteryProficiency))
    errs.push("reviewLapseProficiency must be in [0, masteryProficiency)");
  return errs;
}

// Apply the result of one problem attempt to a concept's state.
// result = { correct: bool, hintsUsed: int, conceptId: string,
//            difficulty?: int (of the problem actually served), now?: ms }
// Returns a summary describing what changed and what UI should react to.
export function grade(state, result) {
  const c = state.concepts[result.conceptId];
  if (!c) return { error: "unknown concept" };
  const now = Number.isFinite(result.now) ? result.now : Date.now();
  // Credit is capped at the difficulty of the problem actually SERVED — if a
  // thin pool substitutes an easier problem (relaxed fallback), it can't earn
  // top-tier gain, count toward the mastery streak, or drive escalation.
  const served = Number.isFinite(result.difficulty)
    ? Math.max(1, Math.min(c.currentDifficulty, result.difficulty))
    : c.currentDifficulty;

  // "Clean" = solved with no hints AND no wrong attempts on the way. Wrong
  // attempts are counted explicitly (result.wrongs) so within-problem struggle
  // reduces credit and can't count toward a mastery streak, independent of the
  // UI's auto-hint behavior.
  const struggled = (result.wrongs || 0) > 0;
  const clean = result.hintsUsed === 0 && !struggled;
  c.attempts += 1;
  state.totalAnswered += 1;
  c.recent.push(result.correct);
  if (c.recent.length > CONFIG.windowSize) c.recent.shift();

  const summary = {
    conceptId: c.id,
    correct: result.correct,
    masteredNow: false,
    difficultyChanged: 0,
    showMicroLesson: false,
    showSolution: false,
    proficiencyBefore: c.proficiency,
  };

  if (result.correct && c.mustProveClean && !clean) {
    // They saw the full solution and now leaned on hints again — not proof.
    // Freeze all progress (no gain, streaks reset) until they do one unaided.
    c.consecutiveWrong = 0;
    c.consecutiveCorrect = 0;
    c.consecutiveTopClean = 0;
    c.hintsUsed += result.hintsUsed;
    summary.stillProving = true;
  } else if (result.correct) {
    c.consecutiveWrong = 0;
    if (c.mustProveClean && clean) {
      // Fresh problem solved unaided — the lesson landed. Resume normal progress.
      c.mustProveClean = false;
      summary.provedIt = true;
    }
    let gain = CONFIG.gainBase * served;
    if (!clean) {
      gain *= CONFIG.hintGainPenalty;
      c.hintsUsed += result.hintsUsed;
    }
    c.proficiency = Math.min(1, c.proficiency + gain);

    if (clean) {
      if (served >= c.currentDifficulty) c.consecutiveCorrect += 1;
      if (served >= CONFIG.topDifficulty) c.consecutiveTopClean += 1;
    } else {
      // A hinted correct breaks the "clean streak" required for mastery.
      c.consecutiveCorrect = 0;
      c.consecutiveTopClean = 0;
    }

    // Escalate difficulty when consistently clean at this tier.
    if (
      c.currentDifficulty < CONFIG.topDifficulty &&
      c.consecutiveCorrect >= CONFIG.escalateAfter
    ) {
      c.currentDifficulty += 1;
      c.consecutiveCorrect = 0;
      summary.difficultyChanged = 1;
    }
  } else {
    c.consecutiveCorrect = 0;
    c.consecutiveTopClean = 0;
    c.consecutiveWrong += 1;
    c.hintsUsed += result.hintsUsed;
    c.proficiency = Math.max(0, c.proficiency - CONFIG.wrongPenalty);
    // Drop a tier so we rebuild confidence on the failing sub-skill.
    if (c.currentDifficulty > 1) {
      c.currentDifficulty -= 1;
      summary.difficultyChanged = -1;
    }
    if (c.consecutiveWrong >= CONFIG.showSolutionAfter) {
      summary.showSolution = true;
      c.mustProveClean = true; // must now prove the lesson landed, unaided
    } else if (c.consecutiveWrong >= CONFIG.microLessonAfter) {
      summary.showMicroLesson = true;
    }
  }

  summary.mustProveClean = c.mustProveClean;

  // Mastery check: proficiency bar AND a clean streak at the top tier.
  if (
    !c.mastered &&
    c.proficiency >= CONFIG.masteryProficiency &&
    c.consecutiveTopClean >= CONFIG.masteryConsecutiveTop
  ) {
    c.mastered = true;
    summary.masteredNow = true;
  }

  // Topic is mastered only when EVERY concept is. One weak concept blocks it.
  const wasMastered = state.topicMastered;
  state.topicMastered = Object.values(state.concepts).every((x) => x.mastered);
  // Freshly (re-)mastered: start the spaced-repetition ladder from the bottom.
  if (state.topicMastered && !wasMastered) {
    state.reviewLevel = 0;
    scheduleNextReview(state, now);
  }
  state.lastPracticed = now;
  summary.topicMastered = state.topicMastered;
  summary.proficiencyAfter = c.proficiency;
  return summary;
}

// ---- Post-mastery review (spaced repetition) --------------------------------
// Mastery decays if never revisited; these functions schedule retention checks
// on the CONFIG.reviewIntervalsDays ladder and demote skills that lapse.

export function scheduleNextReview(state, now = Date.now()) {
  const ladder = CONFIG.reviewIntervalsDays;
  const lvl = Math.min(state.reviewLevel || 0, ladder.length - 1);
  state.nextReviewAt = now + ladder[lvl] * DAY_MS;
}

// Is this (mastered) topic due for a retention check?
export function reviewStatus(state, now = Date.now()) {
  if (!state || !state.topicMastered) return { mastered: false, due: false, nextReviewAt: null, reviewLevel: 0 };
  const at = Number.isFinite(state.nextReviewAt) ? state.nextReviewAt : null;
  return { mastered: true, due: at !== null && now >= at, nextReviewAt: at, reviewLevel: state.reviewLevel || 0 };
}

// Apply one review-session problem. Only a CLEAN solve (no hints, no wrong
// attempts) holds the concept; anything else lapses it back into normal
// training — mastery revoked, tier knocked down a rung, proficiency capped —
// so retention is re-earned rather than assumed.
export function applyReviewResult(state, result) {
  const c = state.concepts[result.conceptId];
  if (!c) return { error: "unknown concept" };
  const now = Number.isFinite(result.now) ? result.now : Date.now();
  const clean = !!result.correct && result.hintsUsed === 0 && (result.wrongs || 0) === 0;
  c.attempts += 1;
  state.totalAnswered += 1;
  state.lastPracticed = now;
  if (clean) return { conceptId: c.id, held: true };
  c.mastered = false;
  c.proficiency = Math.min(c.proficiency, CONFIG.reviewLapseProficiency);
  c.consecutiveCorrect = 0;
  c.consecutiveTopClean = 0;
  c.currentDifficulty = Math.max(1, CONFIG.topDifficulty - 1);
  state.topicMastered = false;
  state.focusConceptId = c.id;
  return { conceptId: c.id, held: false };
}

// Close out a review pass. All held -> climb the interval ladder. Any lapse ->
// scheduling stops; re-mastering restarts the ladder from the bottom (grade()
// handles that on the mastered flip).
export function finishReview(state, allHeld, now = Date.now()) {
  if (allHeld) {
    state.reviewLevel = Math.min((state.reviewLevel || 0) + 1, CONFIG.reviewIntervalsDays.length - 1);
    scheduleNextReview(state, now);
  } else {
    state.reviewLevel = 0;
    state.nextReviewAt = null;
  }
}

// Honest 0..1 progress for a single concept's meter. It must NOT read 100%
// until the concept is actually mastered, so it blends proficiency with the
// two still-unmet mastery requirements (reaching the top tier and stacking a
// clean streak there). Reserved headroom keeps an un-mastered skill below full.
export function conceptProgress(c) {
  if (c.mastered) return 1;
  const prof = c.proficiency * 0.7;
  const tier = ((c.currentDifficulty - 1) / Math.max(1, CONFIG.topDifficulty - 1)) * 0.15;
  const streak = (Math.min(c.consecutiveTopClean, CONFIG.masteryConsecutiveTop) /
    CONFIG.masteryConsecutiveTop) * 0.15;
  return Math.min(0.97, prof + tier + streak);
}

// Overall topic progress 0..1 for the big mastery meter (honest average).
export function topicProgress(state) {
  const list = Object.values(state.concepts);
  if (list.length === 0) return 0;
  const sum = list.reduce((s, c) => s + conceptProgress(c), 0);
  return sum / list.length;
}
