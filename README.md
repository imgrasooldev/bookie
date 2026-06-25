# Bookie

Multi-vertical transport booking platform for Pakistan — **bus** tickets, **city rides**, **picnic & party** charters, and **corporate** transport. Inspired by Bookme / Sastaticket.

> Full architecture & roadmap: [`docs/PLAN.md`](docs/PLAN.md)

## Monorepo layout

```
bookie/
├── apps/
│   ├── web/      # Next.js 16 customer site (TypeScript, Tailwind v4)   ✅ scaffolded
│   ├── api/      # Node + Express + MongoDB backend                      ⏳ next
│   └── mobile/   # Flutter app (Android · iOS · Huawei)                  ⏳ after backend
├── docs/         # PLAN.md and design notes
```

## Build order
1. **Web** (customer-facing UI, mock data) — done
2. **Backend** (REST API + MongoDB, replaces mock data)
3. **Flutter** (mobile apps consuming the same API)

## Run the web app

```bash
cd apps/web
npm install      # already installed during scaffold
npm run dev      # http://localhost:3000
```

The web app currently reads mock data from `apps/web/src/lib/mock.ts`. When the
backend is ready, set `USE_MOCK = false` in `apps/web/src/lib/api.ts` (and
`NEXT_PUBLIC_API_URL`) — the UI is unchanged because the data shapes match.

## Stack
- **Web:** Next.js 16, React 19, TypeScript, Tailwind v4
- **Backend (planned):** Node, Express, MongoDB (Mongoose), Redis, JWT/OTP auth
- **Mobile (planned):** Flutter with GMS/HMS flavors for Huawei support
- **Payments (planned):** JazzCash, Easypaisa, cards (via Safepay/PayFast), cash
