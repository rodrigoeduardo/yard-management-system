# ADR 0002 — Demo mode via flag, auth code retained

Date: 2026-07-22 · Status: accepted

## Context

The generic yms deployment becomes a public demo: no login, every visitor navigates as one shared user, single Supabase free tier. But client forks (ADR 0001) need real auth. If yms deleted its auth code, every `git merge upstream/main` into a client repo would try to re-delete the client's auth — a permanent merge tax. The current Supabase project holds dev data only, so it can serve the demo; the first client gets its own project at go-live.

## Decision

- **All auth code stays** in yms (Supabase Auth, RLS, invite-gated registration, audit `user_id` capture).
- A `DEMO_MODE` env flag (off by default) switches the deployment into demo behavior:
  - the server transparently establishes a session as a single **seeded demo user** (credentials from env) — no login UI shown;
  - `/login` and `/register` redirect into the app;
  - a persistent PT-BR **demo banner** states: demonstration environment, shared data, nightly reset — with a CTA link (env-configured) back to the landing page / contact.
- With the flag unset, behavior is exactly today's authenticated app — client forks simply never set it.
- RLS and the audit trail keep functioning: the demo user is a real Supabase user, so `audit_log.user_id` is populated.

## Consequences

- Demo and client builds share identical source; the flag is the only divergence point.
- All demo visitors share one dataset and one audit identity — acceptable for a demo, mitigated by nightly reset (ADR 0003).
- Demo user provisioning (Supabase user + env credentials) is a deploy-time human step.
