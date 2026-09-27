import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "..");
const bestEffort = process.argv.includes("--best-effort");
const verifyOnly = process.argv.includes("--verify");

const assets = [
  {
    name: "hanzi_lookup.js",
    url: "https://raw.githubusercontent.com/gugray/hanzi_lookup/master/web_demo/hanzi_lookup.js",
    dest: "public/recognizer/hanzi_lookup.js",
    minBytes: 3000
  },
  {
    name: "hanzi_lookup_bg.wasm",
    url: "https://raw.githubusercontent.com/gugray/hanzi_lookup/master/web_demo/hanzi_lookup_bg.wasm",
    dest: "public/recognizer/hanzi_lookup_bg.wasm",
    minBytes: 10000
  },
  {
    name: "hanzi_lookup LGPL license",
    url: "https://raw.githubusercontent.com/gugray/hanzi_lookup/master/LICENSE",
    dest: "THIRD_PARTY_LICENSES/hanzi_lookup-LGPL-3.0.txt",
    minBytes: 1000
  },
  {
    name: "Hanzi stroke data APL license",
    url: "https://raw.githubusercontent.com/gugray/hanzi_lookup/master/LICENSE-APL",
    dest: "THIRD_PARTY_LICENSES/hanzi_lookup-data-APL.txt",
    minBytes: 1000
  }
];

async function isValid(asset) {
  try {
    const info = await stat(resolve(root, asset.dest));
    return info.size >= asset.minBytes;
  } catch {
    return false;
  }
}

async function download(asset) {
  const response = await fetch(asset.url, {
    headers: { "user-agent": "hanzi-dictation-setup/1.0" },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) {
    throw new Error(`${asset.name}: HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < asset.minBytes) {
    throw new Error(`${asset.name}: downloaded file is unexpectedly small (${bytes.byteLength} bytes)`);
  }
  const target = resolve(root, asset.dest);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  console.log(`Downloaded ${asset.name} -> ${asset.dest}`);
}

const missing = [];
for (const asset of assets) {
  if (!(await isValid(asset))) missing.push(asset);
}

if (verifyOnly) {
  if (missing.length) {
    console.error("Missing or invalid recognizer assets:");
    missing.forEach((asset) => console.error(`- ${asset.dest}`));
    process.exit(1);
  }
  console.log("Recognizer assets are present.");
  process.exit(0);
}

if (!missing.length) {
  console.log("Recognizer assets already present.");
  process.exit(0);
}

let failed = false;
for (const asset of missing) {
  try {
    await download(asset);
  } catch (error) {
    failed = true;
    console.error(`Asset setup failed: ${error.message}`);
    if (!bestEffort) break;
  }
}

if (failed && !bestEffort) {
  console.error(
    "\nCould not finish recognizer setup. Check your internet connection and run `npm run setup` again."
  );
  process.exit(1);
}

if (failed && bestEffort) {
  console.warn(
    "\nContinuing because --best-effort was used. The site still builds, but handwriting recognition will show an error until `npm run setup` succeeds."
  );
}
