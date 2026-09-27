import { createHandwritingPad } from "../components/handwriting-pad.js";
import { speakMandarin } from "../lib/audio.js";
import { isAnswerCorrect } from "../lib/answer.js";
import { filterLessons } from "../lib/lessons.js";
import { getRecognizer } from "../lib/recognizer.js";
import { loadProgress, recordAttempt, saveProgress } from "../lib/progress.js";

export function renderDictation(container, allLessons, locationUrl, navigate) {
  const params = new URL(locationUrl).searchParams;
  let mode = params.get("mode") === "handwriting" ? "handwriting" : "keyboard";
  const reviewOnly = params.get("review") === "1";
  const category = params.get("category") || "all";
  const difficulty = params.get("difficulty") || "all";

  let lessons = filterLessons(allLessons, { category, difficulty });
  if (reviewOnly) {
    const mistakeSet = new Set(loadProgress().mistakeIds);
    lessons = lessons.filter((lesson) => mistakeSet.has(lesson.id));
  }

  if (!lessons.length) {
    container.innerHTML = `
      <h1>${reviewOnly ? "Review" : "Dictation"}</h1>
      <section class="panel">
        <p>No questions match this practice set.</p>
        <a class="button" href="${reviewOnly ? "/review" : "/practice"}" data-route>Go back</a>
      </section>
    `;
    return;
  }

  let index = 0;
  let submitted = false;
  let handwrittenAnswer = "";
  let pad = null;
  let recognitionToken = 0;

  container.innerHTML = `
    <div class="practice-shell">
      <div class="practice-head">
        <div>
          <p class="muted">${reviewOnly ? "Mistake review" : "Dictation practice"}</p>
          <h1 id="question-title">Question</h1>
          <p class="progress-line" id="question-progress"></p>
        </div>
        <div class="mode-tabs" aria-label="Answer mode">
          <button type="button" data-mode="keyboard">Keyboard</button>
          <button type="button" data-mode="handwriting">Handwriting</button>
        </div>
      </div>

      <section class="panel audio-panel">
        <button type="button" class="audio-button" id="play-audio">🔊 Play Mandarin audio</button>
        <p class="muted" id="audio-state">Uses your browser's zh-CN speech voice.</p>
      </section>

      <section class="panel" id="answer-panel"></section>

      <section class="panel feedback" id="feedback" hidden></section>

      <div class="button-row">
        <button type="button" id="check-answer">Check answer</button>
        <button type="button" class="secondary" id="next-question" hidden>Next</button>
        <a class="button ghost" href="${reviewOnly ? "/review" : "/practice"}" data-route>Exit</a>
      </div>
    </div>
  `;

  const title = container.querySelector("#question-title");
  const progressText = container.querySelector("#question-progress");
  const answerPanel = container.querySelector("#answer-panel");
  const feedback = container.querySelector("#feedback");
  const checkButton = container.querySelector("#check-answer");
  const nextButton = container.querySelector("#next-question");
  const playButton = container.querySelector("#play-audio");
  const audioState = container.querySelector("#audio-state");
  const modeButtons = [...container.querySelectorAll("[data-mode]")];

  function lesson() {
    return lessons[index];
  }

  function setMode(nextMode) {
    mode = nextMode === "handwriting" ? "handwriting" : "keyboard";
    submitted = false;
    handwrittenAnswer = "";
    feedback.hidden = true;
    nextButton.hidden = true;
    checkButton.hidden = false;
    modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    });
    renderAnswerPanel();
  }

  function renderQuestion() {
    submitted = false;
    handwrittenAnswer = "";
    feedback.hidden = true;
    nextButton.hidden = true;
    checkButton.hidden = false;
    title.textContent = `Question ${index + 1}`;
    progressText.textContent = `${index + 1} / ${lessons.length} · ${lesson().category} · difficulty ${lesson().difficulty}`;
    renderAnswerPanel();
  }

  function renderAnswerPanel() {
    pad?.destroy?.();
    pad = null;
    recognitionToken += 1;

    if (mode === "keyboard") {
      answerPanel.innerHTML = `
        <h2>Your answer</h2>
        <label for="keyboard-answer" class="muted">Type the Chinese characters you hear.</label>
        <input id="keyboard-answer" class="answer-input" lang="zh-Hans" autocomplete="off" spellcheck="false" />
      `;
      queueMicrotask(() => answerPanel.querySelector("#keyboard-answer")?.focus());
      return;
    }

    answerPanel.innerHTML = `
      <h2>Write your answer</h2>
      <p class="muted">Draw one character at a time. Recognize it, then choose a candidate.</p>
      <div class="handwriting-layout">
        <div id="dictation-pad"></div>
        <div>
          <h3>Current answer</h3>
          <div class="answer-preview" id="hand-answer">${handwrittenAnswer || "—"}</div>
          <div class="button-row">
            <button type="button" class="secondary" id="recognize-char">Recognize character</button>
            <button type="button" class="ghost" id="remove-char">Remove last</button>
            <button type="button" class="ghost" id="clear-answer">Clear answer</button>
          </div>
          <p class="recognizer-state" id="recognizer-state">Loading recognizer…</p>
          <div class="candidates" id="candidate-list"></div>
        </div>
      </div>
    `;

    pad = createHandwritingPad();
    answerPanel.querySelector("#dictation-pad").append(pad.element);
    const recognizerState = answerPanel.querySelector("#recognizer-state");
    const candidateList = answerPanel.querySelector("#candidate-list");
    const answerPreview = answerPanel.querySelector("#hand-answer");
    const recognizer = getRecognizer();

    recognizer.init()
      .then(() => { recognizerState.textContent = "Recognizer ready."; })
      .catch((error) => {
        recognizerState.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
      });

    answerPanel.querySelector("#recognize-char").addEventListener("click", async (event) => {
      const strokes = pad.getStrokes();
      if (!strokes.length) {
        recognizerState.textContent = "Draw a character first.";
        return;
      }
      const ownToken = ++recognitionToken;
      event.currentTarget.disabled = true;
      candidateList.innerHTML = "";
      recognizerState.textContent = "Recognizing…";

      try {
        const matches = await recognizer.recognize(strokes, 8);
        if (ownToken !== recognitionToken) return;
        candidateList.innerHTML = matches
          .map((match) => `<button type="button" class="candidate" data-char="${match.hanzi}">${match.hanzi}</button>`)
          .join("");
        recognizerState.textContent = matches.length ? "Choose the intended character." : "No candidate found. Redraw and try again.";
      } catch (error) {
        recognizerState.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
      } finally {
        event.currentTarget.disabled = false;
      }
    });

    candidateList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-char]");
      if (!button) return;
      handwrittenAnswer += button.dataset.char;
      answerPreview.textContent = handwrittenAnswer;
      candidateList.innerHTML = "";
      recognizerState.textContent = "Character added. Draw the next one.";
      pad.clear();
    });

    answerPanel.querySelector("#remove-char").addEventListener("click", () => {
      handwrittenAnswer = Array.from(handwrittenAnswer).slice(0, -1).join("");
      answerPreview.textContent = handwrittenAnswer || "—";
    });

    answerPanel.querySelector("#clear-answer").addEventListener("click", () => {
      handwrittenAnswer = "";
      answerPreview.textContent = "—";
      candidateList.innerHTML = "";
      pad.clear();
    });
  }

  function currentAnswer() {
    return mode === "keyboard"
      ? answerPanel.querySelector("#keyboard-answer")?.value ?? ""
      : handwrittenAnswer;
  }

  playButton.addEventListener("click", async () => {
    playButton.disabled = true;
    audioState.textContent = "Playing…";
    try {
      await speakMandarin(lesson().chinese);
      audioState.textContent = "Ready. Replay as often as needed.";
    } catch (error) {
      audioState.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
    } finally {
      playButton.disabled = false;
    }
  });

  checkButton.addEventListener("click", () => {
    if (submitted) return;
    const userAnswer = currentAnswer();
    if (!userAnswer.trim()) {
      feedback.hidden = false;
      feedback.className = "panel feedback incorrect";
      feedback.innerHTML = `<strong>Enter an answer first.</strong>`;
      return;
    }

    submitted = true;
    const correct = isAnswerCorrect(userAnswer, lesson().answer);
    const updated = recordAttempt(loadProgress(), {
      id: lesson().id,
      correct,
      mode
    });
    saveProgress(updated);

    feedback.hidden = false;
    feedback.className = `panel feedback ${correct ? "correct" : "incorrect"}`;
    feedback.innerHTML = `
      <strong>${correct ? "✅ Correct" : "❌ Incorrect"}</strong>
      ${correct ? "" : `<p>Your answer: <span lang="zh-Hans">${escapeHtml(userAnswer)}</span></p>`}
      <div class="hanzi" lang="zh-Hans">${lesson().chinese}</div>
      <div>${escapeHtml(lesson().pinyin)}</div>
      <div class="muted">${escapeHtml(lesson().translation)}</div>
    `;

    checkButton.hidden = true;
    nextButton.hidden = false;
  });

  nextButton.addEventListener("click", () => {
    index += 1;
    if (index >= lessons.length) {
      if (reviewOnly) {
        navigate("/review");
      } else {
        index = 0;
        renderQuestion();
      }
      return;
    }
    renderQuestion();
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  setMode(mode);
  renderQuestion();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
