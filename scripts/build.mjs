import { cp, mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(resolve(root, "index.html"), resolve(dist, "index.html"));
await cp(resolve(root, "src"), resolve(dist, "src"), { recursive: true });
await cp(resolve(root, "public"), dist, { recursive: true });

const checks = [
  "index.html",
  "src/app.js",
  "data/lessons.json",
  "recognizer/worker.js"
];

for (const file of checks) {
  await stat(resolve(dist, file));
}

console.log("Build complete: dist/");
