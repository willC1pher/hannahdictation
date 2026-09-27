import { createHandwritingPad } from "../components/handwriting-pad.js";
import { getRecognizer } from "../lib/recognizer.js";

export async function renderHandwriting(container) {
  container.innerHTML = `
    <h1>Handwriting Playground</h1>
    <p class="muted">Draw one Chinese character, then run recognition. Mouse, pen, and touch are supported.</p>
    <div class="handwriting-layout">
      <section class="panel" id="pad-slot"></section>
      <section class="panel">
        <h2>Recognition</h2>
        <p class="recognizer-state" id="recognizer-state">Loading recognition model…</p>
        <div class="button-row">
          <button type="button" id="recognize-button">Recognize</button>
        </div>
        <div class="candidates" id="candidate-list" aria-live="polite"></div>
        <p id="selected-character" class="muted"></p>
      </section>
    </div>
  `;

  const pad = createHandwritingPad();
  container.querySelector("#pad-slot").prepend(pad.element);

  const state = container.querySelector("#recognizer-state");
  const candidates = container.querySelector("#candidate-list");
  const selected = container.querySelector("#selected-character");
  const recognizeButton = container.querySelector("#recognize-button");
  const recognizer = getRecognizer();

  try {
    await recognizer.init();
    state.textContent = "Recognizer ready.";
  } catch (error) {
    state.innerHTML = `<span class="error">${escapeHtml(error.message)}</span> See README troubleshooting if the WASM asset is missing.`;
  }

  recognizeButton.addEventListener("click", async () => {
    const strokes = pad.getStrokes();
    if (!strokes.length) {
      state.textContent = "Draw a character first.";
      return;
    }

    state.textContent = "Recognizing…";
    candidates.innerHTML = "";
    recognizeButton.disabled = true;

    try {
      const matches = await recognizer.recognize(strokes, 8);
      state.textContent = matches.length ? "Select a candidate." : "No candidates found. Try drawing again.";
      candidates.innerHTML = matches
        .map((match) => `<button type="button" class="candidate" data-char="${match.hanzi}" title="score ${Number(match.score).toFixed(2)}">${match.hanzi}</button>`)
        .join("");
    } catch (error) {
      state.innerHTML = `<span class="error">${escapeHtml(error.message)}</span>`;
    } finally {
      recognizeButton.disabled = false;
    }
  });

  candidates.addEventListener("click", (event) => {
    const button = event.target.closest("[data-char]");
    if (!button) return;
    selected.textContent = `Selected: ${button.dataset.char}`;
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
