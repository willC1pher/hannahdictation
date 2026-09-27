# Third-party notices

## hanzi_lookup

- Purpose: browser-side Chinese handwriting recognition
- Project: https://github.com/gugray/hanzi_lookup
- Code license: GNU LGPL
- Stroke data license: Arphic Public License (APL)
- Runtime files used: `hanzi_lookup.js` and `hanzi_lookup_bg.wasm`
- Setup: downloaded by `scripts/setup-assets.mjs`

The project setup script also downloads the upstream license texts into `THIRD_PARTY_LICENSES/`.

## Dictation audio

This MVP does not redistribute third-party audio. It uses the browser's Web Speech / Speech Synthesis implementation with `zh-CN` language selection. The actual installed voice depends on the user's browser and operating system.
