let ready = false;

self.onmessage = async (event) => {
  const data = event.data || {};

  if (data.type === "init") {
    try {
      importScripts("/recognizer/hanzi_lookup.js");
      await self.wasm_bindgen(data.wasmUri);
      ready = true;
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({
        type: "error",
        phase: "init",
        message: error?.message || String(error)
      });
    }
    return;
  }

  if (data.type === "lookup") {
    if (!ready) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        message: "Recognizer is not ready."
      });
      return;
    }

    try {
      const json = self.wasm_bindgen.lookup(data.strokes, data.limit || 8);
      const matches = JSON.parse(json);
      self.postMessage({
        type: "result",
        requestId: data.requestId,
        matches
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        requestId: data.requestId,
        message: error?.message || String(error)
      });
    }
  }
};
