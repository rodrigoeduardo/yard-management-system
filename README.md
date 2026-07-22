This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project's values.

**`SUPABASE_DB_URL` must use the Supabase "Shared Pooler" connection string** (Supabase
dashboard → Database settings → Connection string → Shared Pooler), not the direct
`db.<project-ref>.supabase.co` host. The direct host is **IPv6-only** and unreachable from many
networks/sandboxes (including CI and some local setups), which breaks `drizzle-kit migrate` and
anything else that opens a direct Postgres connection. See `.env.example` for the expected format.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Testing

- `npm test` — fast unit + component tests, no DB required.
- `npm run test:integration` — DB-touching tests. Requires the local Supabase stack
  (Docker required): run `npm run test:integration:setup` once per session (starts
  `supabase start` if needed, applies Drizzle migrations, seeds a fixed local test
  auth user, and writes the connection details to gitignored `.env.test.local`),
  then `npm run test:integration`. This never touches the remote/production Supabase
  project. `npm run supabase:stop` tears the local stack down when you're done.
- `npm run test:all` — everything above in one run.

### Demo dataset

`npm run seed:demo` (or `npx tsx scripts/seed-demo-dataset.ts`) seeds a fixed,
realistic PT-BR demo dataset against the database `SUPABASE_DB_URL` points
at — several materials, open loads with items (typically 15-18, varying
weights), removals spanning items from multiple loads, and one finished
load (renders green in Estoque). It's idempotent: re-running it against the
same database never duplicates rows or errors, so it's safe to run against a
fresh local Supabase stack (after `npm run test:integration:setup`) or a
shared dev database alike. See `scripts/seed-demo-dataset.ts` and
`docs/adr/0003-nightly-demo-reset.md` (the nightly demo reset job reuses the
same script).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
