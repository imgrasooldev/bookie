# Bookie — Customer Web App

**Next.js 16** (App Router, Turbopack, standalone output), React 19, TypeScript, Tailwind v4.
The customer-facing site: search intercity **Bus / Car / HiAce**, pick seats, pay, and manage
bookings. Full context: [`docs/ARCHITECTURE.md §5`](../../docs/ARCHITECTURE.md#5-customer-web-app).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (standalone)
```

Reads mock data by default. For the live backend set `NEXT_PUBLIC_USE_MOCK=false` and
`NEXT_PUBLIC_API_URL=http://localhost:4000` (or the deployed API). See
[`docs/RUN-LIVE.md`](../../docs/RUN-LIVE.md). For LAN/phone testing, add your IP to
`allowedDevOrigins` in `next.config.ts`.

## Routes
- `/` — hero + `SearchPanel` (From / To / date / passengers + swap) + popular routes
- `/search` — results with filters
- `/booking/[id]` — `BookingForm`: 2-step bus flow (seats → travellers & pay) + per-vehicle seat maps (car shows driver-right/front/back)
- `/ticket/[id]` — e-ticket (print, cancel, scannable QR) · `/ticket` — guest lookup
- `/pay/result` — hosted-checkout return page
- `/login`, `/signup` — **OTP-first** login with password fallback
- `/account/*` — profile, bookings, wallet

## Data & payments
Single data seam in `src/lib/` — `api.ts` (catalog), `bookings.ts`, `auth.ts`, `payments.ts`.
Checkout uses **create-then-pay**: `RealPaymentDialog` reserves the booking, loads
`/payments/methods`, then settles (mock), redirects (JazzCash/Easypaisa/Safepay), or reserves
cash-at-terminal. Guest checkout is supported end-to-end.

## Deploy
`fly deploy --remote-only` (app `bookie-web`). See [`docs/DEPLOY-FLY.md`](../../docs/DEPLOY-FLY.md).
