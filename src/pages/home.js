export function renderHome(container) {
  container.innerHTML = `
    <section class="hero">
      <p class="muted">Mandarin practice</p>
      <h1>Listen, write, and recognize Hanzi.</h1>
      <p>
        Practice Chinese dictation with a keyboard or draw each character by hand.
        Your progress stays in this browser; no account is required.
      </p>
      <div class="actions">
        <a class="button" href="/dictation?mode=handwriting" data-route>Dictation + Handwriting</a>
        <a class="button secondary" href="/dictation?mode=keyboard" data-route>Keyboard Dictation</a>
      </div>
    </section>

    <section class="card-grid">
      <article class="card">
        <h2>✍ Handwriting</h2>
        <p>Draw one Hanzi and get recognition candidates from a local WebAssembly model.</p>
        <a href="/handwriting" data-route>Open playground →</a>
      </article>
      <article class="card">
        <h2>🔊 Dictation</h2>
        <p>Hear Mandarin through the browser's Chinese speech voice and submit your answer.</p>
        <a href="/practice" data-route>Choose practice →</a>
      </article>
      <article class="card">
        <h2>↻ Review</h2>
        <p>Questions you miss are automatically added to a review list.</p>
        <a href="/review" data-route>Review mistakes →</a>
      </article>
      <article class="card">
        <h2>📈 Progress</h2>
        <p>See attempts, accuracy, answer modes, and recent activity.</p>
        <a href="/progress" data-route>View progress →</a>
      </article>
    </section>
  `;
}
