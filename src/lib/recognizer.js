let singleton;

export class HanziRecognizer {
  constructor() {
    this.worker = null;
    this.state = "idle";
    this.pending = new Map();
    this.requestId = 0;
    this.initPromise = null;
  }

  init() {
    if (this.initPromise) return this.initPromise;
    this.state = "loading";

    this.initPromise = new Promise((resolve, reject) => {
      let settled = false;
      try {
        this.worker = new Worker("/recognizer/worker.js");
      } catch (error) {
        this.state = "error";
        reject(error);
        return;
      }

      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.state = "error";
        reject(new Error("Handwriting recognizer timed out while loading."));
      }, 12000);

      this.worker.addEventListener("message", (event) => {
        const data = event.data || {};

        if (data.type === "ready") {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            this.state = "ready";
            resolve();
          }
          return;
        }

        if (data.type === "result") {
          const pending = this.pending.get(data.requestId);
          if (pending) {
            this.pending.delete(data.requestId);
            pending.resolve(data.matches || []);
          }
          return;
        }

        if (data.type === "error") {
          if (!settled && data.phase === "init") {
            settled = true;
            clearTimeout(timeout);
            this.state = "error";
            reject(new Error(data.message || "Recognizer failed to load."));
            return;
          }
          const pending = this.pending.get(data.requestId);
          if (pending) {
            this.pending.delete(data.requestId);
            pending.reject(new Error(data.message || "Recognition failed."));
          }
        }
      });

      this.worker.addEventListener("error", (event) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this.state = "error";
          reject(new Error(event.message || "Recognizer worker failed."));
        }
      });

      this.worker.postMessage({
        type: "init",
        wasmUri: "/recognizer/hanzi_lookup_bg.wasm"
      });
    });

    return this.initPromise;
  }

  async recognize(strokes, limit = 8) {
    if (!Array.isArray(strokes) || strokes.length === 0) return [];
    await this.init();

    const requestId = ++this.requestId;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker.postMessage({
        type: "lookup",
        requestId,
        strokes,
        limit
      });
    });
  }
}

export function getRecognizer() {
  singleton ??= new HanziRecognizer();
  return singleton;
}
