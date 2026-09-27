# Hanzi Dictation

A browser-first Mandarin learning MVP that combines **dictation** and **handwritten Chinese character recognition**.

The project is intentionally simple and functionality-first. A learner can hear Mandarin, type the answer, or draw each Hanzi and select recognition candidates before submitting.

## 1. Project overview

Main learning flow:

```text
Mandarin speech
      ↓
keyboard OR handwriting
      ↓
handwriting -> Web Worker -> hanzi_lookup WASM -> candidates
      ↓
build answer
      ↓
normalize + compare
      ↓
feedback + local progress + mistake review
```

The app is designed to deploy as a static single-page application on **Cloudflare Pages**.

## 2. Features

- 80 starter Mandarin dictation items
- Keyboard dictation
- Handwriting + dictation in the same exercise
- Standalone handwriting playground
- Pointer Events: mouse, touch, and stylus
- Undo the latest stroke
- Clear canvas
- Real Hanzi candidate recognition through `hanzi_lookup` WebAssembly
- Multi-character handwritten answers
- Browser Mandarin speech synthesis (`zh-CN`)
- Unicode-aware answer normalization
- Persistent progress using localStorage
- Mistake review
- Responsive layout
- No account required
- No paid API required
- No server/database required for this MVP

## 3. Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla ES modules + HTML/CSS |
| Build | Small Node.js copy build, no framework dependency |
| Handwriting canvas | Canvas + Pointer Events |
| Recognition | `gugray/hanzi_lookup` WebAssembly |
| Background work | Web Worker |
| Dictation audio | Web Speech / Speech Synthesis, `zh-CN` |
| Lesson data | Static JSON |
| Progress | localStorage |
| Backend | Not required for MVP |
| Database | Not required for MVP |
| Hosting | Cloudflare Pages |

### Why no React/Vite?

The original requirements allowed the implementation to choose the simplest reliable solution. The first release has no server state and no complex component ecosystem, so this repository uses native browser modules instead of adding a framework dependency.

That keeps the MVP easier to inspect, cheaper to run, and less likely to break because of package version changes. The architecture can be migrated to React later without changing the lesson format, answer rules, progress format, or recognition worker.

## 4. Architecture

```text
Cloudflare Pages
└── Static site
    ├── index.html
    ├── src/
    │   ├── app/router
    │   ├── pages
    │   ├── handwriting canvas
    │   └── browser services
    ├── data/lessons.json
    └── recognizer/
        ├── worker.js
        ├── hanzi_lookup.js
        └── hanzi_lookup_bg.wasm

Browser
├── SpeechSynthesis -> Mandarin dictation
├── Canvas -> recorded strokes
├── Web Worker -> hanzi_lookup WASM -> candidate Hanzi
└── localStorage -> progress + mistakes
```

There is no backend call during normal practice.

## 5. Folder structure

```text
hanzi-dictation/
├── index.html
├── package.json
├── .node-version
├── public/
│   ├── _headers
│   ├── data/
│   │   └── lessons.json
│   └── recognizer/
│       ├── worker.js
│       ├── hanzi_lookup.js          # downloaded by setup
│       └── hanzi_lookup_bg.wasm     # downloaded by setup
├── src/
│   ├── app.js
│   ├── styles.css
│   ├── components/
│   │   └── handwriting-pad.js
│   ├── lib/
│   │   ├── answer.js
│   │   ├── audio.js
│   │   ├── lessons.js
│   │   ├── progress.js
│   │   └── recognizer.js
│   └── pages/
│       ├── dictation.js
│       ├── handwriting.js
│       ├── home.js
│       ├── practice.js
│       ├── progress.js
│       └── review.js
├── scripts/
│   ├── build.mjs
│   ├── dev-server.mjs
│   └── setup-assets.mjs
├── tests/
├── THIRD_PARTY_LICENSES/
├── THIRD_PARTY_NOTICES.md
└── README.md
```

## 6. Prerequisites

Required:

- Node.js 20 or newer
- npm
- Git

For deployment:

- GitHub account
- Cloudflare account

The repo includes `.node-version` with Node.js 22.

## 7. Installation

Clone your repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd hanzi-dictation
npm install
```

`npm install` has no npm package dependencies, but its `postinstall` script **attempts to download the two real handwriting-recognition runtime files and their licenses** from the upstream `hanzi_lookup` repository.

If that network request was blocked or interrupted, run:

```bash
npm run setup
```

Then confirm:

```bash
npm run verify:assets
```

Expected result:

```text
Recognizer assets are present.
```

## 8. Running locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Useful routes:

```text
/
 /practice
 /dictation?mode=keyboard
 /dictation?mode=handwriting
 /handwriting
 /review
 /progress
```

## 9. Running tests

```bash
npm test
```

Tests cover:

- answer normalization
- answer correctness
- lesson validation
- lesson filtering
- progress persistence
- mistake tracking
- removal from mistake review after a later correct answer

## 10. Building

```bash
npm run build
```

The build output is:

```text
dist/
```

Preview it locally:

```bash
npm run preview
```

Then open:

```text
http://localhost:4173
```

## 11. Handwriting recognition

This project uses:

- `gugray/hanzi_lookup`
- Rust/WebAssembly runtime
- `hanzi_lookup.js`
- `hanzi_lookup_bg.wasm`

Upstream:

https://github.com/gugray/hanzi_lookup

The upstream project documents that its recognizer accepts an array of strokes. Each stroke is an array of two-dimensional points.

This app records strokes like:

```js
[
  [[22, 31], [24, 35], [29, 42]],
  [[85, 16], [84, 26], [81, 39]]
]
```

Processing:

```text
Canvas Pointer Events
        ↓
arrays of [x, y] points
        ↓
/recognizer/worker.js
        ↓
hanzi_lookup WASM
        ↓
top 8 candidates
        ↓
user selects intended Hanzi
```

Recognition runs in a worker so the expensive matching does not block the main UI thread.

### Recognizer files

After setup:

```text
public/recognizer/hanzi_lookup.js
public/recognizer/hanzi_lookup_bg.wasm
```

Do not rename them unless you also update:

```text
src/lib/recognizer.js
public/recognizer/worker.js
```

## 12. Dictation data

The starter lesson database is:

```text
public/data/lessons.json
```

There are 80 entries across:

- greetings
- numbers
- time
- family
- food
- school
- transportation
- daily activities

Example:

```json
{
  "id": "greeting-001",
  "chinese": "你好",
  "answer": "你好",
  "pinyin": "nǐ hǎo",
  "translation": "Hello",
  "difficulty": 1,
  "category": "greetings",
  "audio": {
    "type": "speechSynthesis",
    "lang": "zh-CN",
    "text": "你好"
  }
}
```

### Adding a question

Add another object with a unique `id`.

Required fields:

```text
id
chinese
answer
pinyin
translation
difficulty
category
audio
```

Then run:

```bash
npm test
```

The lesson validation test will catch malformed records.

## 13. Audio

This MVP intentionally does **not** hotlink random MP3 files.

It uses the browser's Speech Synthesis API:

```text
SpeechSynthesisUtterance
lang = zh-CN
```

Advantages:

- no paid API
- no API key
- no CORS problem
- no redistributed audio license problem
- no server required

Limitation:

The exact Chinese voice is provided by the learner's operating system/browser. Voice quality can therefore vary.

To replace TTS later, isolate the new implementation in:

```text
src/lib/audio.js
```

The lesson schema already contains an `audio` field, so it can later hold local MP3 paths.

## 14. Chinese character data

Character recognition data is embedded inside the upstream `hanzi_lookup` WASM binary.

According to the upstream documentation, its stroke data is derived from Make Me a Hanzi data and contains thousands of characters.

See:

https://github.com/gugray/hanzi_lookup

Licenses are documented in `THIRD_PARTY_NOTICES.md` and downloaded into `THIRD_PARTY_LICENSES/`.

No proprietary Hanzii database is used.

## 15. Progress storage

Progress is stored in:

```text
localStorage
```

Key:

```text
hanzi-dictation.progress.v1
```

It stores:

- attempted count
- correct count
- incorrect count
- keyboard attempts
- handwriting attempts
- completed question IDs
- mistake IDs
- up to 200 recent attempt records

Invalid/corrupted JSON is handled by resetting to an empty progress object rather than crashing the page.

## 16. Database

> This MVP does not require a database. User progress is stored locally in the browser.

This is intentional.

A database would only be necessary when adding features such as:

- accounts
- cross-device sync
- shared/custom decks
- teacher dashboards
- cloud history

Cloudflare D1 is a reasonable future option.

## 17. GitHub

Create an empty GitHub repository first.

Then from this project folder:

```bash
git init
git add .
git commit -m "Initial Hanzi dictation implementation"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

Important:

Run `npm run setup` before your first commit if you want the WASM runtime checked into your repository.

Checking the runtime into your repo is recommended for maximum deployment reliability, as long as you keep the included third-party license notices.

## 18. Cloudflare Pages deployment

Cloudflare still supports Git-connected Pages deployments.

As of September 2026, Cloudflare's Pages documentation lists this flow:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Create application
→ Pages
→ Import an existing Git repository
→ select GitHub repository
```

Use:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | repository root |
| Build command | `npm run build` |
| Build output directory | `dist` |

This project pins Node 22 through:

```text
.node-version
```

No environment variables are required.

Cloudflare's Pages V3 build image currently provides Node.js 22 by default, but keeping `.node-version` makes the build reproducible.

### Important 2026 note

Cloudflare currently recommends **Workers** for many new applications because Workers has a broader feature set.

This project still uses **Pages** because that is the requested target, and Pages remains supported for Git-connected static React/SPA-style deployments.

### SPA routing

Cloudflare Pages treats a project without a top-level `404.html` as a single-page application and falls back unmatched paths to `/`.

Therefore routes such as:

```text
/handwriting
/progress
/review
```

continue to work after browser refresh.

## 19. Updating production

Make changes locally, test, then:

```bash
npm test
npm run build

git add .
git commit -m "Describe your change"
git push
```

Cloudflare Pages automatically starts a new build for the pushed `main` commit.

## 20. Troubleshooting

### Handwriting says the recognizer cannot load

Check:

```bash
npm run verify:assets
```

If files are missing:

```bash
npm run setup
```

Then restart the local server.

Required files:

```text
public/recognizer/hanzi_lookup.js
public/recognizer/hanzi_lookup_bg.wasm
```

### `npm run setup` cannot reach GitHub

Your network, proxy, school firewall, VPN, or DNS may block `raw.githubusercontent.com`.

Open the upstream repository in a browser and confirm GitHub is reachable:

https://github.com/gugray/hanzi_lookup

Then retry:

```bash
npm run setup
```

### Blank page

Open browser developer tools and check the Console and Network tabs.

Also run:

```bash
npm test
npm run build
npm run preview
```

### Refreshing `/handwriting` returns 404 on another host

Cloudflare Pages automatically supports SPA fallback for this structure.

If you move the project to another static host, configure that host to rewrite unknown application routes to:

```text
/index.html
```

### WASM MIME type error

The local development server included in this repository serves `.wasm` as:

```text
application/wasm
```

Cloudflare serves WASM static assets correctly.

If you use a different local web server, configure the same MIME type.

### Web Worker import error

Verify these URLs return files instead of HTML:

```text
/recognizer/worker.js
/recognizer/hanzi_lookup.js
/recognizer/hanzi_lookup_bg.wasm
```

### Audio does not play

Audio requires:

- a modern browser with `speechSynthesis`
- a user click before playback
- preferably an installed Chinese voice

Try Chrome, Edge, or Safari and check that your operating system has a Mandarin/Chinese speech voice installed.

### Touch drawing does not work

Use a modern browser supporting Pointer Events.

The canvas sets:

```css
touch-action: none;
```

so drawing gestures are not interpreted as scrolling.

### Cloudflare build fails

Check locally:

```bash
npm test
npm run build
```

Then confirm Pages settings:

```text
Build command: npm run build
Build output directory: dist
```

### localStorage data appears corrupted

The app automatically recovers from invalid JSON.

To manually reset only this app's progress, run in the browser console:

```js
localStorage.removeItem("hanzi-dictation.progress.v1");
location.reload();
```

## 21. Known limitations

- Speech quality depends on the browser/OS Chinese voice.
- The MVP does not have login or cross-device sync.
- Progress is lost if the user clears site storage.
- Recognition is single-character-at-a-time; the composed answer can contain multiple characters.
- Recognition quality depends on handwriting and stroke structure.
- The UI is intentionally functional rather than highly polished.
- Simplified Chinese is the primary target in the starter data.
- The setup script currently references the upstream `master` branch. For a long-lived production product, vendor a reviewed release/commit and keep the matching license files.

## 22. Future improvements

Good next steps after the MVP works reliably:

- React migration if the UI grows substantially
- Cloudflare D1 accounts and sync
- spaced repetition
- HSK level packs
- custom decks
- recorded human audio
- TTS provider abstraction
- pronunciation grading
- traditional Chinese
- pinyin input mode
- sentence segmentation
- better mobile drawing UX
- offline/PWA support
- teacher dashboard
- AI-generated exercises

## Third-party resources and licenses

| Resource | Purpose | Source | License |
|---|---|---|---|
| hanzi_lookup | Chinese handwriting matching | https://github.com/gugray/hanzi_lookup | GNU LGPL |
| hanzi_lookup embedded stroke data | recognition reference data | same upstream project | Arphic Public License |
| Browser Speech Synthesis | dictation speech | user's browser/OS | browser/OS component; no bundled audio |

See `THIRD_PARTY_NOTICES.md`.

## Current Cloudflare references

The deployment choices in this README were checked against Cloudflare's current documentation in September 2026:

- React on Pages: https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- Build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Build image / Node versions: https://developers.cloudflare.com/pages/configuration/build-image/
- SPA behavior: https://developers.cloudflare.com/pages/configuration/serving-pages/
- Pages overview: https://developers.cloudflare.com/pages/
