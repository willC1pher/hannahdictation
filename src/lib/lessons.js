export function validateLesson(lesson) {
  if (!lesson || typeof lesson !== "object") return false;
  const requiredStrings = ["id", "chinese", "answer", "pinyin", "translation", "category"];
  if (!requiredStrings.every((key) => typeof lesson[key] === "string" && lesson[key].trim())) {
    return false;
  }
  if (!Number.isInteger(lesson.difficulty) || lesson.difficulty < 1) return false;
  if (!lesson.audio || typeof lesson.audio !== "object") return false;
  if (lesson.audio.type !== "speechSynthesis") return false;
  return typeof lesson.audio.lang === "string" && typeof lesson.audio.text === "string";
}

export function validateLessonCollection(lessons) {
  return Array.isArray(lessons) && lessons.length > 0 && lessons.every(validateLesson);
}

export function filterLessons(lessons, { category = "all", difficulty = "all" } = {}) {
  return lessons.filter((lesson) => {
    const categoryOk = category === "all" || lesson.category === category;
    const difficultyOk = difficulty === "all" || lesson.difficulty === Number(difficulty);
    return categoryOk && difficultyOk;
  });
}

export function uniqueCategories(lessons) {
  return [...new Set(lessons.map((lesson) => lesson.category))].sort();
}
