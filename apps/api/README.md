# @bookie/api

Bookie backend — **Express + MongoDB (Mongoose, ESM)** REST API. Serves the JSON shapes the
web/mobile/admin clients consume. Full reference: [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md).

## Run

```bash
cp .env.example .env          # set MONGO_URI (Atlas) + JWT_SECRET
npm install
npm run seed                  # demo cities/operators/trips
npx tsx src/data/seedHiace.ts # enable Bus/Car/HiAce + seed intercity car/HiAce routes
npm run dev                   # http://localhost:4000
```

No MongoDB handy? `npm run smoke` boots an in-memory mongod and exercises the routes.

## Endpoint groups

| Mount | Audience | What |
|---|---|---|
| `/` (catalog) | public | health, verticals, cities, popular routes, **trip search** + detail + reviews |
| `/auth` | public | register, login, **OTP request/verify**, me |
| `/bookings` | customer/guest | hold, create, mine, **guest lookup**, detail, cancel, review |
| `/payments` | customer | methods, initiate, **cash**, redirect/return, webhook, mock, status |
| `/account` | customer | profile, **wallet**, travellers, notifications, device-token |
| `/operator` | operator | login, trips CRUD, vehicles+media, bookings, stats, **manifest**, delay |
| `/sa` | super-admin | operators, listing approvals, cities/terminals, **verticals toggle**, team/roles |
| `/admin/*` | staff | admin trips/bookings/stats |

See the [API reference](../../docs/ARCHITECTURE.md#3-api-reference) for every path.

## Key behaviours
- **Per-seat, date-aware inventory** — `SeatInventory` per `(trip, date)` with atomic holds/confirms.
- **Payments** — one gateway interface; JazzCash/Easypaisa/Safepay activate on env, cash + mock always on. Idempotent, signature-verified webhooks. (`src/lib/payments.ts`)
- **OTP login** — bcrypt-hashed, single-use, 5-min codes (`OtpChallenge`); account created on first verify.
- **Notifications** — multi-channel fan-out with provider seams (SMS/WhatsApp/email/FCM), in-app feed always on. (`src/lib/notify.ts`)

## Environment
`MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `PUBLIC_API_URL`, `WEB_URL`, plus optional
`JAZZCASH_*` / `EASYPAISA_*` / `SAFEPAY_*` (payments) and `SMS_GATEWAY_URL` or `TWILIO_*`
(SMS/OTP). See [Environment](../../docs/ARCHITECTURE.md#11-environment--configuration).

## Deploy
`fly deploy --remote-only` (app `bookie-api`). Configure providers with `fly secrets set …` —
no code changes needed. See [`docs/DEPLOY-FLY.md`](../../docs/DEPLOY-FLY.md).
