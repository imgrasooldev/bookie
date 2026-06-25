# @bookie/api

Bookie backend — Express + MongoDB (Mongoose) REST API. Serves the same JSON
shapes the web/mobile clients expect, over the generic `Trip` / `Booking` model
from [`docs/PLAN.md`](../../docs/PLAN.md).

## Run

```bash
cp .env.example .env          # set MONGO_URI (local or Atlas)
npm install
npm run seed                  # load demo cities/operators/trips
npm run dev                   # http://localhost:4000
```

No MongoDB handy? Run the full end-to-end smoke test against an in-memory DB:

```bash
npm run smoke                 # boots in-memory mongod, exercises every route
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET  | `/health` | liveness |
| GET  | `/verticals` | the 4 booking verticals |
| GET  | `/cities` | seeded cities |
| GET  | `/trips?serviceType=BUS&originId=lhe&destinationId=isb` | search |
| GET  | `/trips/:id` | trip detail |
| POST | `/auth/register` | `{ name, phone, password }` → JWT |
| POST | `/auth/login` | `{ phone, password }` → JWT |
| GET  | `/auth/me` | current user (bearer token) |
| POST | `/auth/otp/request` | stub (wire an SMS gateway) |
| POST | `/bookings` | create booking / quote request |
| GET  | `/bookings/mine` | auth required |
| GET  | `/bookings/:id` | booking detail |

## Connect the web app
In `apps/web/src/lib/api.ts` set `USE_MOCK = false` and
`NEXT_PUBLIC_API_URL=http://localhost:4000`. Response shapes already match, so
no UI changes are needed.

## Still to build (see PLAN.md)
- Redis seat-locking (prevent double-booking) and live seat-map over WebSocket
- Payment gateway integration (JazzCash / Easypaisa / Safepay) with webhooks
- Operator & admin endpoints, settlements, e-ticket (PDF/QR) generation
