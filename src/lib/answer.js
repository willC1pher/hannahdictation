export function normalizeAnswer(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, "");
}

export function isAnswerCorrect(userAnswer, expectedAnswer) {
  return normalizeAnswer(userAnswer) === normalizeAnswer(expectedAnswer);
}
