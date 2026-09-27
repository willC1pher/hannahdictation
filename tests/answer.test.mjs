import test from "node:test";
import assert from "node:assert/strict";
import { isAnswerCorrect, normalizeAnswer } from "../src/lib/answer.js";

test("normalizeAnswer trims and removes whitespace", () => {
  assert.equal(normalizeAnswer(" 你 好 \n"), "你好");
});

test("normalizeAnswer applies Unicode NFKC normalization", () => {
  assert.equal(normalizeAnswer("１２３"), "123");
});

test("answer checking accepts equivalent normalized text", () => {
  assert.equal(isAnswerCorrect(" 你 好 ", "你好"), true);
});

test("answer checking rejects a genuinely different character", () => {
  assert.equal(isAnswerCorrect("你号", "你好"), false);
});
