# retromynd — the future was always retro

Retro arcade + marketplace + RetroPass, originally built on Mocha and migrated to run
on **Cloudflare** (Worker + D1 + R2). React 19 + Vite 7 frontend, Hono Worker backend.

## Quick start

```bash
npm install
node scripts/download-assets.mjs   # fetch images (run where the Mocha CDN is reachable)
cp .env.example .dev.vars          # then fill in the secrets
npm run dev                        # http://localhost:5173
```

Build: `npm run build` · Deploy: `npx wrangler deploy`

## Migrating / deploying

The full migration notes and the step-by-step deploy runbook (Google OAuth, D1 import,
secrets, custom domain `retromynd.com`, Stripe webhooks) are in **[MIGRATION.md](./MIGRATION.md)**.

## Layout

- `src/react-app/` — React app (pages, ~50 arcade games, components, contexts)
- `src/react-app/auth/` — self-hosted auth (replaces Mocha's users-service client)
- `src/worker/index.ts` — the Hono Worker API
- `src/worker/auth.ts` — Google OAuth + session JWT (replaces Mocha's users-service backend)
- `migrations/` — `users` table + seed
- `migration/` — reference data from the Mocha export (DB dump, asset list, users.json)
- `scripts/` — asset download + DB import helpers
