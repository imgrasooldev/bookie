# Bookie

**Intercity transport booking platform for Pakistan** — book **bus**, **car**, and
**HiAce** seats by route (from → to → date), pick exact seats, and pay by JazzCash,
Easypaisa, card, or cash-at-terminal. Inspired by Bookme / Sastaticket.

> 📐 Full system documentation: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
> 🚀 Deploy guide: [`docs/DEPLOY-FLY.md`](docs/DEPLOY-FLY.md) · ▶️ Run locally: [`docs/RUN-LIVE.md`](docs/RUN-LIVE.md)

## Live

| App | URL | Stack |
|---|---|---|
| Customer web | https://bookie-web.fly.dev | Next.js 16 |
| Admin / operator console | https://bookie-admin.fly.dev | Vite + React SPA |
| API | https://bookie-api.fly.dev | Express + MongoDB |
| Mobile | Android APK (`apps/mobile`) | Flutter |

## Monorepo layout

```
bookie/
├── apps/
│   ├── web/      # Next.js 16 — customer site (search, book, pay, e-ticket, account)
│   ├── admin/    # Vite + React SPA — operator console + super-admin console
│   ├── api/      # Node + Express + MongoDB (Mongoose) REST API
│   └── mobile/   # Flutter app (Android · iOS · Huawei-ready)
├── docs/         # ARCHITECTURE, DEPLOY-FLY, RUN-LIVE, PLAN
└── .github/workflows/deploy.yml   # CI/CD: push to main → deploy api/web/admin
```

Every client talks to the API through a single data seam (`lib/api.ts` on web/admin,
`core/network` + repositories on mobile), so flipping from mock data to the live
backend is a config change, not a rewrite.

## The three verticals

All three are **per-seat, intercity, route-based** (origin → destination → date),
and share one seat-reservation flow with date-aware inventory and atomic holds.

| Vertical | Vehicle | Seat map |
|---|---|---|
| **Bus** | 30–50 seater | 2 + 2 grid |
| **Car** | 4-seater | driver (right, RHD) + front + back row |
| **HiAce** | 12–14 seater | van grid |

Other verticals (flights, trains, hotels, tours…) exist in the data model but are
**disabled** via the admin "Services" toggle — the marketplace is scoped to Bus/Car/HiAce.

## Quick start (local)

```bash
# 1) API  (needs a MongoDB URI in apps/api/.env)
cd apps/api && npm install && npm run seed && npm run dev      # :4000

# 2) Customer web
cd apps/web && npm install && npm run dev                      # :3000

# 3) Admin / operator console
cd apps/admin && npm install && npm run dev                    # :5174

# 4) Mobile
cd apps/mobile && flutter pub get && flutter run
```

See [`docs/RUN-LIVE.md`](docs/RUN-LIVE.md) for wiring the clients to the live API and LAN testing.

## Stack

- **Web:** Next.js 16 (App Router, Turbopack, standalone output), React 19, TypeScript, Tailwind v4
- **Admin:** Vite + React + react-router (HashRouter), Tailwind v4
- **API:** Node, Express, MongoDB Atlas (Mongoose, ESM), JWT auth, Zod validation
- **Mobile:** Flutter, flutter_bloc, get_it, dio
- **Payments:** JazzCash, Easypaisa, Safepay (cards/wallets), cash-at-terminal — behind one gateway interface
- **Notifications:** in-app feed + SMS / WhatsApp / email / FCM push (provider seams)
- **Hosting:** Fly.io (3 apps) · GitHub Actions CI/CD
