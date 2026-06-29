# Bookie — Admin & Operator Console

**Vite + React + TypeScript + Tailwind v4** SPA. One app serves **two roles**: vendor-facing
**operator** pages and platform-wide **super-admin** pages. Full context:
[`docs/ARCHITECTURE.md §6`](../../docs/ARCHITECTURE.md#6-admin--operator-console).

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build
```

Set `VITE_API_URL` to point at the API (defaults to localhost:4000). Routing uses
`HashRouter`, so it deploys to static hosting (nginx) with no server rewrites.

## Operator pages (scoped to the logged-in vendor)
- **Dashboard** — KPI tiles, bookings trend, revenue, recent bookings
- **Trips & Inventory** — listings + add/edit (price, seats, **business seats**, route stops)
- **Bookings** — vendor's bookings with status + payment indicators
- **Manifest** — passenger list per departure (for boarding + **cash reconciliation**)
- **Fleet / Schedules** — vehicles, media, timings
- **Delay** — push a delay notification to a trip's passengers

## Super-admin pages (`/admin/*`, staff + RBAC)
- **Overview** — marketplace-wide KPIs
- **Operators** — vendors, status, reset password
- **Approvals** — approve / suspend listings
- **Cities** — cities + **terminals** (boarding/drop-off `adda` points)
- **Services** — **enable/disable verticals** (keeps the marketplace to Bus/Car/HiAce)
- **Team / Roles** — staff accounts + role-based permissions

## Data
Talks to `/operator/*`, `/sa/*`, and `/admin/*` through `src/api.ts` (shapes in `src/data.ts`).

## Deploy
`fly deploy --remote-only` (app `bookie-admin`, served by nginx). See
[`docs/DEPLOY-FLY.md`](../../docs/DEPLOY-FLY.md).
