import { loadProgress } from "../lib/progress.js";

export function renderReview(container, lessons, navigate) {
  const progress = loadProgress();
  const mistakeSet = new Set(progress.mistakeIds);
  const mistakes = lessons.filter((lesson) => mistakeSet.has(lesson.id));

  if (!mistakes.length) {
    container.innerHTML = `
      <h1>Review Mistakes</h1>
      <section class="panel">
        <h2>Nothing to review</h2>
        <p class="muted">Incorrect answers appear here. A question leaves the list after you answer it correctly once.</p>
        <a class="button" href="/practice" data-route>Start practice</a>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <h1>Review Mistakes</h1>
    <p class="muted">${mistakes.length} question(s) are currently in your review list.</p>
    <section class="panel">
      <ul class="simple-list">
        ${mistakes.slice(0, 20).map((lesson) => `<li>${lesson.chinese} — ${lesson.translation}</li>`).join("")}
      </ul>
      <div class="button-row">
        <button type="button" data-mode="keyboard">Review with keyboard</button>
        <button type="button" class="secondary" data-mode="handwriting">Review with handwriting</button>
      </div>
    </section>
  `;

  container.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      navigate(`/dictation?review=1&mode=${button.dataset.mode}`);
    });
  });
}
