export function createHandwritingPad({ onChange } = {}) {
  const root = document.createElement("div");
  root.className = "handwriting-pad";
  root.innerHTML = `
    <div class="canvas-wrap">
      <canvas class="handwriting-canvas" aria-label="Handwriting canvas"></canvas>
    </div>
    <div class="pad-controls">
      <button type="button" class="secondary" data-action="undo">Undo stroke</button>
      <button type="button" class="ghost" data-action="clear">Clear</button>
    </div>
  `;

  const canvas = root.querySelector("canvas");
  const context = canvas.getContext("2d");
  let strokes = [];
  let activeStroke = null;
  let activePointerId = null;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      redraw();
    }
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return [
      Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      Math.max(0, Math.min(rect.height, event.clientY - rect.top))
    ];
  }

  function drawStroke(stroke) {
    if (!stroke || stroke.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(rect.width, 1);
    const scaleY = canvas.height / Math.max(rect.height, 1);

    context.lineWidth = 7 * Math.max(scaleX, scaleY);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111";
    context.beginPath();

    stroke.forEach(([x, y], index) => {
      const px = x * scaleX;
      const py = y * scaleY;
      if (index === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    });

    if (stroke.length === 1) {
      const [x, y] = stroke[0];
      context.lineTo((x + 0.01) * scaleX, (y + 0.01) * scaleY);
    }

    context.stroke();
  }

  function redraw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(drawStroke);
    if (activeStroke) drawStroke(activeStroke);
  }

  function emit() {
    onChange?.(getStrokes());
  }

  function pointerDown(event) {
    if (activePointerId !== null) return;
    event.preventDefault();
    activePointerId = event.pointerId;
    canvas.setPointerCapture?.(event.pointerId);
    activeStroke = [canvasPoint(event)];
    redraw();
  }

  function pointerMove(event) {
    if (event.pointerId !== activePointerId || !activeStroke) return;
    event.preventDefault();
    activeStroke.push(canvasPoint(event));
    redraw();
  }

  function pointerUp(event) {
    if (event.pointerId !== activePointerId || !activeStroke) return;
    event.preventDefault();
    activeStroke.push(canvasPoint(event));
    if (activeStroke.length > 1) strokes.push(activeStroke);
    activeStroke = null;
    activePointerId = null;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch {}
    redraw();
    emit();
  }

  function clear() {
    strokes = [];
    activeStroke = null;
    activePointerId = null;
    redraw();
    emit();
  }

  function undo() {
    strokes.pop();
    redraw();
    emit();
  }

  function getStrokes() {
    return strokes.map((stroke) => stroke.map(([x, y]) => [x, y]));
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  root.querySelector('[data-action="clear"]').addEventListener("click", clear);
  root.querySelector('[data-action="undo"]').addEventListener("click", undo);

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(canvas);
  queueMicrotask(resizeCanvas);

  return {
    element: root,
    clear,
    undo,
    getStrokes,
    destroy() {
      resizeObserver.disconnect();
    }
  };
}
