import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const requestedRoot = process.argv[2] || ".";
const port = Number(process.argv[3] || process.env.PORT || 5173);
const root = resolve(process.cwd(), requestedRoot);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = normalize(decoded).replace(/^([/\\])+/, "");
  const candidate = resolve(root, normalized);
  return candidate.startsWith(root) ? candidate : null;
}

function serveFile(file, response) {
  response.writeHead(200, {
    "Content-Type": mime[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache"
  });
  createReadStream(file).pipe(response);
}

const server = http.createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const file = safePath(request.url);
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (existsSync(file) && statSync(file).isFile()) {
    serveFile(file, response);
    return;
  }

  const publicFile = resolve(root, "public", request.url.split("?")[0].replace(/^\/+/, ""));
  if (publicFile.startsWith(resolve(root, "public")) && existsSync(publicFile) && statSync(publicFile).isFile()) {
    serveFile(publicFile, response);
    return;
  }

  const index = join(root, "index.html");
  if (existsSync(index)) {
    serveFile(index, response);
    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(port, () => {
  console.log(`Serving ${root}`);
  console.log(`http://localhost:${port}`);
});
