# Architecture

Stack decisions with rationale. These are commitments unless a spec change goes through the board (see `docs/workflow/board-protocol.md`).

- **Frontend/Fullstack**: Next.js (App Router) — required.
- **API**: no separate backend. Server Actions for the main-flow mutations (add load, remove item); REST Route Handlers (`app/api/...`) only for endpoints that may need external consumption in the future.
- **Database**: Postgres via Supabase. Relational is mandatory — item removal is an ACID multi-table transaction that can span different loads; NoSQL was ruled out for this reason.
- **Auth**: Supabase Auth + Row Level Security in Postgres. Self-service signup is invite-code gated (see `docs/specs/business-rules.md#registration-auth`) — there is no public open registration. All auth code is retained even when a deployment runs as a public demo: a `DEMO_MODE` env flag (off by default) gates demo behavior — the server auto-establishes a session as a single seeded demo user, `/login` and `/register` redirect into the app, a persistent demo banner is shown, and the dataset resets nightly (see [ADR 0002](../adr/0002-demo-mode-flag.md), [ADR 0003](../adr/0003-nightly-demo-reset.md); behavior details in `docs/specs/business-rules.md#demo-mode`).
- **Audit**: `audit_log` table populated by Postgres triggers (AFTER INSERT/UPDATE/DELETE) on the load, item, and removal tables.
- **ORM**: Drizzle (Prisma acceptable fallback if Drizzle blocks — decision to be settled by the first database task).
- **QR codes**: generation with the `qrcode` lib (one UUID per item); scanning via `html5-qrcode` or `@zxing/browser` directly in the browser (no native app). Printing via a dedicated route with CSS `@page { size: 100mm 50mm; margin: 0 }`, one tag per label, targeting the Elgin L42 Pro Full label printer.
- **Removal receipt**: printable/shareable comprovante de remoção, server-rendered at `/removals/<id>/receipt` (same dedicated-print-route pattern as the QR codes page — browser print dialog, no PDF generation library). The attached Pedido image lives in the private `removal-pedidos` Storage bucket, so the route resolves a short-lived signed URL server-side to render it rather than relying on a public bucket.
- **Validation**: Zod in Server Actions.
- **UI**: shadcn/ui + TanStack Table for the stock and removal tables.
- **Deploy**: Vercel (Hobby for dev/staging; Pro required in production due to commercial use — alternative: VPS with Coolify to cut cost).
