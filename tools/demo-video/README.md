# Demo video tooling

Two standalone subprojects (own `package.json`, own `node_modules` —
not wired into the app's build):

- `capture/` — Playwright drives the real app and records each flow as
  a `.webm` clip.
- `remotion/` — imports the clips and renders the final video, with
  React-driven caption overlays.

## 1. Capture clips

```bash
cd tools/demo-video/capture
npm install
npx playwright install chromium   # first time only

# in another terminal, from the repo root:
npm run dev

DEMO_BASE_URL=http://localhost:3000 \
TEST_USER_EMAIL=... TEST_USER_PASSWORD=... \
npm run capture
```

Clips land in `capture/clips/*.webm`. Copy (or symlink) the ones you
want into `remotion/public/clips/` before rendering.

Only `flows/login.spec.ts` exists so far. Add one file per flow under
`flows/`, following the same pattern: open a recorded context via
`recordedContext(browser)`, drive the page, `save("<clip-name>")`.

## 2. Render the video

```bash
cd tools/demo-video/remotion
npm install
npm run preview   # Remotion Studio, for iterating on overlays/timing
npm run render    # -> out/demo.mp4
```

`src/Root.tsx` registers one composition (`DemoFlow`) wired to the
`login` clip. `durationInFrames` there is a placeholder — set it to
match the actual clip length once captured (`ffprobe clip.webm` or
check `page.video()` in the capture script). Add one `<Composition>`
per flow, or extend `DemoFlow` to sequence multiple clips.
