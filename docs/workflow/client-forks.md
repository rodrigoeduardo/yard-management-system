# Client Forks — duplicate and sync guide

This is the operational contract for running a private, per-client instance of this repo
("yms"), per [ADR 0001](../adr/0001-generic-yms-with-private-client-forks.md). GitHub cannot
fork a private repo into the same account, so each client instance is a **manual duplicate with
full history**, kept in sync by on-demand merges from yms as `upstream`.

The first consumer of this guide is the `patio` client repo.

## Duplicate procedure

Run once, when standing up a new client instance. This is an account-level, human action — no
automation.

1. Bare-clone yms (captures full history, all branches, all tags):

   ```bash
   git clone --bare git@github.com:rodrigoeduardo/yard-management-system.git yms-bare
   ```

2. Create the new private repo on GitHub (e.g. `patio`), empty, no initial commit.

3. Push the full history into it:

   ```bash
   cd yms-bare
   git push --mirror git@github.com:rodrigoeduardo/patio.git
   cd ..
   rm -rf yms-bare
   ```

4. Make a normal working clone of the new client repo:

   ```bash
   git clone git@github.com:rodrigoeduardo/patio.git
   cd patio
   ```

5. Add yms as the `upstream` remote, so future updates can be pulled in:

   ```bash
   git remote add upstream git@github.com:rodrigoeduardo/yard-management-system.git
   git remote -v
   # origin    git@github.com:rodrigoeduardo/patio.git (fetch/push)
   # upstream  git@github.com:rodrigoeduardo/yard-management-system.git (fetch/push)
   ```

From this point, `origin` is the client repo (push freely) and `upstream` is yms (fetch/merge
only — never push to it from a client repo).

## Sync flow

Updates are **manual and on-demand**, never automated (deliberately, per ADR 0001 — no GitHub
Actions sync job). Run this whenever the client repo needs to catch up with yms:

```bash
git fetch upstream
git merge upstream/main
```

Run this on a dedicated sync branch first if the merge is likely to be nontrivial (see "Working on
a sync branch" below), then open a PR into the client's `main` for review before landing it, same
as any other change.

### What happens after `git merge upstream/main`

The merge command above either succeeds cleanly or stops with conflicts — handle each case, then
push.

- **Fast-forward.** If the client's `main` (or sync branch) has no commits of its own since the
  last sync, Git just moves the branch pointer forward — no new merge commit, no conflicts
  possible. This is the common case for a client repo with no direct commits to `main` outside of
  merges from upstream.
- **Real merge, no conflicts.** If the client branch has its own commits (client-specific files,
  config changes) that don't overlap with what changed upstream, Git creates a merge commit
  automatically. Nothing further to resolve, but review the merge commit's diff before pushing —
  a clean auto-merge can still combine changes in a way that's syntactically fine but semantically
  wrong (e.g. a config file merged line-by-line when it should have been reconciled as a whole).
- **Conflicts.** Git stops mid-merge and leaves the working tree with conflict markers. Resolve
  each file per "On conflicts" below, then:

  ```bash
  git add <resolved files>
  git commit   # completes the merge commit; Git pre-fills a merge commit message
  ```

  Do not `git merge --abort` and try to hand-edit around the conflict instead — resolve it in the
  merge itself so the merge commit records how upstream and client history were reconciled.

Either way, the merge (or fast-forward) only updates the local branch. Push it to `origin` (the
client repo) to actually land it — merging locally and forgetting to push is the most common way
a sync silently doesn't happen:

```bash
git push origin <branch>
```

#### Working on a sync branch

For anything beyond a trivial fast-forward, don't run the sync directly on `main`:

```bash
git checkout -b sync/upstream-YYYY-MM-DD
git fetch upstream
git merge upstream/main
# resolve conflicts if any, as above
git push origin sync/upstream-YYYY-MM-DD
```

Then open a PR from that branch into the client's `main`, same review process as any other
change. This gives conflict resolutions (and any semantic issues in an automatic merge) a review
pass before they land, and keeps `main` deployable if a sync turns out to need more work than
expected.

### On conflicts

- **Favor the config-first structure.** If a conflict is between a shared core file (yms side)
  and a client customization, the resolution should preserve the shared file's shape and push
  the client-specific bit back out into its own config/data/dedicated file — not fight the merge
  by hand-editing shared logic. See "Config-first customization rules" below; a conflict here is
  usually a sign the customization wasn't isolated correctly and should be fixed at the source.
- **Escalate structural conflicts back to yms as issues.** If the conflict reveals that yms
  itself doesn't offer a clean extension point for something every client will eventually need
  (e.g. a shared file that inherently can't be edited without touching client-specific logic),
  don't just resolve it locally and move on — file an issue on yms describing the gap. The fix
  belongs upstream so every client benefits and future merges stay clean.
- Trivial conflicts (e.g. both sides touched unrelated lines in the same file) resolve normally
  and don't need an upstream issue.

## Config-first customization rules

The whole point of keeping full shared history is that upstream merges stay cheap. That only
holds if client-specific changes avoid touching the same lines yms touches. In order of
preference:

1. **Env vars.** Anything that varies by client and is a simple value (branding strings, feature
   flags, external service IDs, contact links) goes in environment configuration, not code.
2. **Config files / data.** Anything more structured (e.g. seed data, lookup tables) goes in a
   config or data file the client repo owns and yms doesn't touch.
3. **Isolated client code, only if unavoidable.** If a client genuinely needs custom logic that
   config can't express, put it in dedicated files that exist only in the client repo (new
   files, not edits to shared ones) and wire them through an extension point (e.g. an import, a
   strategy/plugin registration) rather than editing the shared implementation inline.
4. **Shared core files are edited in yms only.** Never patch a file that yms owns directly in a
   client repo, even for a "small" client-specific tweak. Every such edit is a future merge
   conflict, forever, on every sync. If a shared file needs to change to make a client
   customization possible, that change is a yms issue (see "On conflicts" above), not a client
   patch.

Rule of thumb: after a customization, ask whether the *next* `git merge upstream/main` will touch
any line you just wrote. If yes, move it to a dedicated file or a config value instead.

## Fork-safety rule

Migrations and other shared artifacts flow from yms into every client repo on every merge.
Anything demo- or client-specific that ships in a shared artifact **must be inert by default** —
it must not activate in a client repo just because the artifact was merged in.

This is the invariant from [ADR 0001](../adr/0001-generic-yms-with-private-client-forks.md), and
the concrete pattern to follow is the nightly demo reset job from
[ADR 0003](../adr/0003-nightly-demo-reset.md): the reset *function* is defined in a migration
(shared, merges into every client repo), but the pg_cron *schedule* that actually activates it is
applied only on the demo Supabase project, as a documented manual step — never inside the
migration itself. A client repo that merges the migration gets the dormant function and nothing
else; nothing runs unless a human explicitly turns it on for that project.

When adding anything demo- or client-specific to a shared artifact, apply the same shape:

- Define the capability (function, flag-gated code path, migration) so it's safe to merge
  everywhere.
- Activate it only through an explicit, out-of-band step scoped to the one environment that needs
  it (an env var unset by default, a manual scheduling step, a flag flipped only in that
  project's config) — never something that turns on merely because the merge happened.
