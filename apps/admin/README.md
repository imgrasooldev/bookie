# Bookie — Admin / Operator Console

React + Vite + TypeScript + Tailwind v4 dashboard for managing the Bookie
marketplace: operators, trips/inventory and bookings.

## Run

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build
```

## Pages
- **Dashboard** — KPI tiles, bookings-trend chart, revenue by vertical, recent bookings
- **Operators** — vendor list with status, rating and active-trip counts
- **Trips & Inventory** — listings table + a working "Add trip" slide-over form
- **Bookings** — all bookings with status filters and payment-method indicators

## Data
Currently mock data in `src/data.ts` (shapes mirror `apps/api`). When the admin
endpoints exist, swap the imports for fetch calls — the component code stays the
same. Routing uses `HashRouter` so it works on static hosting without server
rewrites.
