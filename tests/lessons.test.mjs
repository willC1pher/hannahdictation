import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateLessonCollection, filterLessons } from "../src/lib/lessons.js";

const lessons = JSON.parse(
  await readFile(new URL("../public/data/lessons.json", import.meta.url), "utf8")
);

test("starter lesson database contains at least 50 items", () => {
  assert.ok(lessons.length >= 50);
});

test("all starter lesson records validate", () => {
  assert.equal(validateLessonCollection(lessons), true);
});

test("category filtering works", () => {
  const food = filterLessons(lessons, { category: "food", difficulty: "all" });
  assert.ok(food.length > 0);
  assert.ok(food.every((lesson) => lesson.category === "food"));
});

test("difficulty filtering works", () => {
  const levelOne = filterLessons(lessons, { category: "all", difficulty: "1" });
  assert.ok(levelOne.length > 0);
  assert.ok(levelOne.every((lesson) => lesson.difficulty === 1));
});
