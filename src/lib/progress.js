export const PROGRESS_KEY = "hanzi-dictation.progress.v1";

export function createEmptyProgress() {
  return {
    version: 1,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    byMode: {
      keyboard: 0,
      handwriting: 0
    },
    completedIds: [],
    mistakeIds: [],
    history: []
  };
}

function uniqueStrings(values) {
  return [...new Set(Array.isArray(values) ? values.filter((v) => typeof v === "string") : [])];
}

export function sanitizeProgress(value) {
  const empty = createEmptyProgress();
  if (!value || typeof value !== "object") return empty;

  const attempted = Number.isFinite(value.attempted) && value.attempted >= 0 ? Math.floor(value.attempted) : 0;
  const correct = Number.isFinite(value.correct) && value.correct >= 0 ? Math.floor(value.correct) : 0;
  const incorrect = Number.isFinite(value.incorrect) && value.incorrect >= 0 ? Math.floor(value.incorrect) : 0;

  return {
    version: 1,
    attempted,
    correct: Math.min(correct, attempted),
    incorrect: Math.min(incorrect, attempted),
    byMode: {
      keyboard: Number.isFinite(value.byMode?.keyboard) ? Math.max(0, Math.floor(value.byMode.keyboard)) : 0,
      handwriting: Number.isFinite(value.byMode?.handwriting) ? Math.max(0, Math.floor(value.byMode.handwriting)) : 0
    },
    completedIds: uniqueStrings(value.completedIds),
    mistakeIds: uniqueStrings(value.mistakeIds),
    history: Array.isArray(value.history)
      ? value.history
          .filter((item) => item && typeof item.id === "string")
          .slice(-200)
      : []
  };
}

export function loadProgress(storage = globalThis.localStorage) {
  if (!storage) return createEmptyProgress();
  try {
    const raw = storage.getItem(PROGRESS_KEY);
    if (!raw) return createEmptyProgress();
    return sanitizeProgress(JSON.parse(raw));
  } catch {
    try { storage.removeItem(PROGRESS_KEY); } catch {}
    return createEmptyProgress();
  }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  const safe = sanitizeProgress(progress);
  if (storage) storage.setItem(PROGRESS_KEY, JSON.stringify(safe));
  return safe;
}

export function recordAttempt(progress, { id, correct, mode }) {
  const next = sanitizeProgress(progress);
  const completed = new Set(next.completedIds);
  const mistakes = new Set(next.mistakeIds);

  next.attempted += 1;
  if (correct) {
    next.correct += 1;
    completed.add(id);
    mistakes.delete(id);
  } else {
    next.incorrect += 1;
    mistakes.add(id);
  }

  if (mode === "handwriting" || mode === "keyboard") {
    next.byMode[mode] += 1;
  }

  next.completedIds = [...completed];
  next.mistakeIds = [...mistakes];
  next.history = [
    ...next.history,
    {
      id,
      correct: Boolean(correct),
      mode: mode === "handwriting" ? "handwriting" : "keyboard",
      at: new Date().toISOString()
    }
  ].slice(-200);

  return next;
}

export function getAccuracy(progress) {
  const safe = sanitizeProgress(progress);
  return safe.attempted ? Math.round((safe.correct / safe.attempted) * 100) : 0;
}
