import test from "node:test";
import assert from "node:assert/strict";
import {
  PROGRESS_KEY,
  createEmptyProgress,
  getAccuracy,
  loadProgress,
  recordAttempt,
  saveProgress
} from "../src/lib/progress.js";

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key)
  };
}

test("incorrect answers enter the mistake list", () => {
  const next = recordAttempt(createEmptyProgress(), {
    id: "greeting-001",
    correct: false,
    mode: "keyboard"
  });
  assert.deepEqual(next.mistakeIds, ["greeting-001"]);
  assert.equal(next.incorrect, 1);
});

test("one later correct answer removes a question from mistakes", () => {
  let progress = recordAttempt(createEmptyProgress(), {
    id: "greeting-001",
    correct: false,
    mode: "keyboard"
  });
  progress = recordAttempt(progress, {
    id: "greeting-001",
    correct: true,
    mode: "handwriting"
  });
  assert.deepEqual(progress.mistakeIds, []);
  assert.ok(progress.completedIds.includes("greeting-001"));
  assert.equal(progress.byMode.handwriting, 1);
});

test("progress round-trips through storage", () => {
  const storage = fakeStorage();
  const progress = recordAttempt(createEmptyProgress(), {
    id: "food-001",
    correct: true,
    mode: "keyboard"
  });
  saveProgress(progress, storage);
  const loaded = loadProgress(storage);
  assert.equal(loaded.attempted, 1);
  assert.equal(loaded.correct, 1);
  assert.equal(getAccuracy(loaded), 100);
});

test("invalid stored JSON recovers safely", () => {
  const storage = fakeStorage({ [PROGRESS_KEY]: "{bad json" });
  const loaded = loadProgress(storage);
  assert.equal(loaded.attempted, 0);
});
