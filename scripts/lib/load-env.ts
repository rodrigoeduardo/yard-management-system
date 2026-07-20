/**
 * Loads `.env.local` for scripts, Vitest setup files, and `drizzle.config.ts`.
 *
 * `.env.local` is gitignored, so it never exists inside a `git worktree add`
 * checkout (e.g. `.claude/worktrees/*` used by autonomous agents). When it's
 * missing in `cwd`, fall back to the main checkout's `.env.local` via
 * `git rev-parse --git-common-dir` (a worktree's common dir is always
 * `<main checkout>/.git`). No secrets are copied into the worktree; the file
 * is read from its original location.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { config } from "dotenv";

export function loadEnv(): void {
  const cwdEnvPath = join(process.cwd(), ".env.local");
  if (existsSync(cwdEnvPath)) {
    config({ path: cwdEnvPath });
    return;
  }

  let gitCommonDir: string;
  try {
    gitCommonDir = execFileSync(
      "git",
      ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();
  } catch {
    return;
  }

  const gitCommonDirAbs = isAbsolute(gitCommonDir)
    ? gitCommonDir
    : resolve(process.cwd(), gitCommonDir);
  const mainRoot = dirname(gitCommonDirAbs);
  config({ path: join(mainRoot, ".env.local") });
}
