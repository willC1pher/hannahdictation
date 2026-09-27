import { getAccuracy, loadProgress } from "../lib/progress.js";

export function renderProgress(container, lessons) {
  const progress = loadProgress();
  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const recentMistakes = [...progress.history]
    .reverse()
    .filter((item) => !item.correct)
    .map((item) => byId.get(item.id))
    .filter(Boolean)
    .filter((lesson, index, all) => all.findIndex((x) => x.id === lesson.id) === index)
    .slice(0, 8);

  container.innerHTML = `
    <h1>Progress</h1>
    <p class="muted">Stored only in this browser using localStorage.</p>

    <section class="stat-grid">
      <div class="stat"><span>Attempted</span><strong>${progress.attempted}</strong></div>
      <div class="stat"><span>Correct</span><strong>${progress.correct}</strong></div>
      <div class="stat"><span>Incorrect</span><strong>${progress.incorrect}</strong></div>
      <div class="stat"><span>Accuracy</span><strong>${getAccuracy(progress)}%</strong></div>
      <div class="stat"><span>Keyboard</span><strong>${progress.byMode.keyboard}</strong></div>
      <div class="stat"><span>Handwriting</span><strong>${progress.byMode.handwriting}</strong></div>
    </section>

    <section class="panel" style="margin-top:1rem">
      <h2>Current mistake list</h2>
      <p>${progress.mistakeIds.length} question(s) waiting for review.</p>
      ${recentMistakes.length
        ? `<ul class="simple-list">${recentMistakes.map((lesson) => `<li>${lesson.chinese} — ${lesson.translation}</li>`).join("")}</ul>`
        : `<p class="muted">No recent mistakes yet.</p>`}
      <div class="button-row">
        <a class="button" href="/review" data-route>Review mistakes</a>
      </div>
    </section>
  `;
}
