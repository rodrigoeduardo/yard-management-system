import { renameSync } from "node:fs";
import path from "node:path";
import type { Browser, BrowserContext, Page } from "@playwright/test";

export const CLIPS_DIR = path.resolve(import.meta.dirname, "../clips");

// Playwright names recorded videos with an internal hash; this opens a
// context with recording on and gives back a save(name) that renames the
// finished file to something the Remotion side can reference directly.
export async function recordedContext(
  browser: Browser,
): Promise<{
  context: BrowserContext;
  page: Page;
  save: (clipName: string) => Promise<void>;
}> {
  const context = await browser.newContext({
    recordVideo: { dir: CLIPS_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  const save = async (clipName: string) => {
    const video = page.video();
    await context.close();
    if (!video) throw new Error("no video recorded for this context");
    renameSync(await video.path(), path.join(CLIPS_DIR, `${clipName}.webm`));
  };

  return { context, page, save };
}
