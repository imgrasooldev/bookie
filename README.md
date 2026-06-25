# Bookie

Multi-vertical transport booking platform for Pakistan — **bus** tickets, **city rides**, **picnic & party** charters, and **corporate** transport. Inspired by Bookme / Sastaticket.

> Full architecture & roadmap: [`docs/PLAN.md`](docs/PLAN.md)

## Monorepo layout

```
bookie/
├── apps/
│   ├── web/      # Next.js 16 customer site (TypeScript, Tailwind v4)   ✅ built
│   ├── admin/    # React + Vite operator/admin console                   ✅ built
│   ├── api/      # Node + Express + MongoDB backend                      ✅ built + smoke-tested
│   └── mobile/   # Flutter app (Android · iOS · Huawei)                  ✅ built + analyze/test pass
├── docs/         # PLAN.md and design notes
```

## Build order (all three scaffolded & verified)
1. **Web** — Next.js customer site, builds clean (`apps/web`)
2. **Backend** — Express + MongoDB REST API, 13-check smoke test passes (`apps/api`)
3. **Flutter** — Android/iOS/Huawei app, analyze + widget test pass (`apps/mobile`)

Each layer talks to the next through a single data seam (`api.ts` / `api.dart`)
so flipping from mock data to the live backend needs no UI changes.

## Run the web app

```bash
cd apps/web
npm install      # already installed during scaffold
npm run dev      # http://localhost:3000
```

The web app reads mock data by default. To point it at the live backend, set
`NEXT_PUBLIC_USE_MOCK=false` and `NEXT_PUBLIC_API_URL=http://localhost:4000` —
no code change, because the data shapes match.

## Run the admin console

```bash
cd apps/admin
npm install
npm run dev      # http://localhost:5174
```

## Stack
- **Web:** Next.js 16, React 19, TypeScript, Tailwind v4
- **Backend (planned):** Node, Express, MongoDB (Mongoose), Redis, JWT/OTP auth
- **Mobile (planned):** Flutter with GMS/HMS flavors for Huawei support
- **Payments (planned):** JazzCash, Easypaisa, cards (via Safepay/PayFast), cash
