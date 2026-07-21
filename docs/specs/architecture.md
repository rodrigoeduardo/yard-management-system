# Architecture

Stack decisions with rationale. These are commitments unless a spec change goes through the board (see `docs/workflow/board-protocol.md`).

- **Frontend/Fullstack**: Next.js (App Router) — required.
- **API**: no separate backend. Server Actions for the main-flow mutations (add load, remove item); REST Route Handlers (`app/api/...`) only for endpoints that may need external consumption in the future.
- **Database**: Postgres via Supabase. Relational is mandatory — item removal is an ACID multi-table transaction that can span different loads; NoSQL was ruled out for this reason.
- **Auth**: Supabase Auth + Row Level Security in Postgres. Self-service signup is invite-code gated (see `docs/specs/business-rules.md#registration-auth`) — there is no public open registration.
- **Audit**: `audit_log` table populated by Postgres triggers (AFTER INSERT/UPDATE/DELETE) on the load, item, and removal tables.
- **ORM**: Drizzle (Prisma acceptable fallback if Drizzle blocks — decision to be settled by the first database task).
- **QR codes**: generation with the `qrcode` lib (one UUID per item); scanning via `html5-qrcode` or `@zxing/browser` directly in the browser (no native app). Printing via a dedicated route with CSS `@page { size: 100mm 50mm; margin: 0 }`, one tag per label, targeting the Elgin L42 Pro Full label printer.
- **Validation**: Zod in Server Actions.
- **UI**: shadcn/ui + TanStack Table for the stock and removal tables.
- **Deploy**: Vercel (Hobby for dev/staging; Pro required in production due to commercial use — alternative: VPS with Coolify to cut cost).
