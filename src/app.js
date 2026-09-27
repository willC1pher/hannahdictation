import { validateLessonCollection } from "./lib/lessons.js";
import { renderHome } from "./pages/home.js";
import { renderPractice } from "./pages/practice.js";
import { renderDictation } from "./pages/dictation.js";
import { renderHandwriting } from "./pages/handwriting.js";
import { renderReview } from "./pages/review.js";
import { renderProgress } from "./pages/progress.js";

const app = document.querySelector("#app");
let lessons = [];

async function loadLessons() {
  const response = await fetch("/data/lessons.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load lesson data (${response.status}).`);
  const data = await response.json();
  if (!validateLessonCollection(data)) throw new Error("Lesson data is invalid.");
  return data;
}

function navigate(href) {
  history.pushState({}, "", href);
  route();
}

function route() {
  const path = window.location.pathname;
  app.innerHTML = "";

  if (path === "/") {
    renderHome(app);
  } else if (path === "/practice") {
    renderPractice(app, lessons, navigate);
  } else if (path === "/dictation") {
    renderDictation(app, lessons, window.location.href, navigate);
  } else if (path === "/handwriting") {
    renderHandwriting(app);
  } else if (path === "/review") {
    renderReview(app, lessons, navigate);
  } else if (path === "/progress") {
    renderProgress(app, lessons);
  } else {
    app.innerHTML = `
      <section class="panel">
        <h1>Page not found</h1>
        <p>The requested page does not exist.</p>
        <a class="button" href="/" data-route>Go home</a>
      </section>
    `;
  }

  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "auto" });
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-route]");
  if (!link || link.target || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;
  event.preventDefault();
  navigate(url.pathname + url.search + url.hash);
});

window.addEventListener("popstate", route);

try {
  lessons = await loadLessons();
  route();
} catch (error) {
  app.innerHTML = `
    <section class="panel">
      <h1>Application data failed to load</h1>
      <p class="error">${escapeHtml(error.message)}</p>
      <p>Check that <code>/data/lessons.json</code> exists and then reload the page.</p>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}
