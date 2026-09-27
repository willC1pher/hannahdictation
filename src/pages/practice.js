import { filterLessons, uniqueCategories } from "../lib/lessons.js";

export function renderPractice(container, lessons, navigate) {
  const categories = uniqueCategories(lessons);
  container.innerHTML = `
    <h1>Practice</h1>
    <p class="muted">Choose a subset, then pick keyboard or handwriting input.</p>

    <section class="panel">
      <div class="filters">
        <label>
          Category<br />
          <select id="category-filter">
            <option value="all">All categories</option>
            ${categories.map((category) => `<option value="${category}">${category}</option>`).join("")}
          </select>
        </label>
        <label>
          Difficulty<br />
          <select id="difficulty-filter">
            <option value="all">All levels</option>
            <option value="1">1 — Easy</option>
            <option value="2">2 — Medium</option>
            <option value="3">3 — Harder</option>
          </select>
        </label>
      </div>
      <p id="practice-count" class="muted"></p>
      <div class="button-row">
        <button type="button" data-start="keyboard">Start with keyboard</button>
        <button type="button" class="secondary" data-start="handwriting">Start with handwriting</button>
      </div>
    </section>
  `;

  const categorySelect = container.querySelector("#category-filter");
  const difficultySelect = container.querySelector("#difficulty-filter");
  const count = container.querySelector("#practice-count");

  function currentLessons() {
    return filterLessons(lessons, {
      category: categorySelect.value,
      difficulty: difficultySelect.value
    });
  }

  function refreshCount() {
    count.textContent = `${currentLessons().length} questions available.`;
  }

  categorySelect.addEventListener("change", refreshCount);
  difficultySelect.addEventListener("change", refreshCount);
  refreshCount();

  container.querySelectorAll("[data-start]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.start;
      const params = new URLSearchParams({
        mode,
        category: categorySelect.value,
        difficulty: difficultySelect.value
      });
      navigate(`/dictation?${params}`);
    });
  });
}
