# Demo video tooling

Two standalone subprojects (own `package.json`, own `node_modules` —
not wired into the app's build):

- `capture/` — Playwright drives the real app and records each flow as
  a `.webm` clip.
- `remotion/` — imports the clips and renders the final video, with
  React-driven caption overlays, sped up via `playbackRate`.

## 1. Capture clips

```bash
cd tools/demo-video/capture
npm install
npx playwright install chromium   # first time only

# in another terminal, from the repo root:
npm run dev
```

`login` and `load-intake` are independent and can run in any order.
`removal` depends on a QR captured by `load-intake`, so run in stages:

```bash
export DEMO_BASE_URL=http://localhost:3000
export TEST_USER_EMAIL=... TEST_USER_PASSWORD=...

npx playwright test flows/login.spec.ts flows/load-intake.spec.ts
npm run build-qr-feed   # turns the captured QR into clips/qr-feed.y4m
npx playwright test flows/removal.spec.ts flows/inventory.spec.ts
```

`removal.spec.ts` launches Chromium with
`--use-fake-device-for-media-stream --use-fake-ui-for-media-stream
--use-file-for-fake-video-capture=<qr-feed.y4m>`, so the real
`getUserMedia`/zxing scanner on `/removals/new` decodes the QR exactly
as it would from a physical camera — not a mocked scan result. Both
fake-device flags are required; without `--use-fake-ui-for-media-stream`
Chromium throws `NotSupportedError` on `getUserMedia` even with camera
permission pre-granted.

Clips land in `capture/clips/*.webm`. Copy the ones you want into
`remotion/public/clips/` before rendering.

Add a new flow: open a recorded context via `recordedContext(browser)`
(`flows/_util.ts`), drive the page, `save("<clip-name>")`.

## 2. Render the video

```bash
cd tools/demo-video/remotion
npm install
npm run preview   # Remotion Studio, for iterating on overlays/timing
npm run render    # -> out/demo.mp4
```

`src/Root.tsx`'s `CLIPS` array lists each clip's file, caption, and
real `durationInSeconds` — get that (and `fps`) by probing the capture
with `@remotion/renderer`'s `getVideoMetadata`:

```bash
node -e "require('@remotion/renderer').getVideoMetadata('public/clips/x.webm').then(console.log)"
```

`DemoFlow` sequences `CLIPS` back to back at `PLAYBACK_RATE` (both set
in `Root.tsx`). Update `durationInSeconds` whenever a clip is
re-captured — a stale value desyncs the caption timing and cuts the
clip early/late.
