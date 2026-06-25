# Run Bookie on real data (end-to-end)

By default the web app uses bundled mock data so it runs with zero setup. This
guide connects it to the live backend + a real MongoDB. The data shapes are
identical, so **no UI changes are needed** — you only flip two env vars.

## 1. Start MongoDB

**Option A — Docker (one command):**
```bash
docker compose up -d            # starts mongo on localhost:27017
```

**Option B — MongoDB Atlas (free tier, no local install):**
1. Create a free cluster at https://www.mongodb.com/atlas
2. Add a database user + allow your IP
3. Copy the connection string (looks like `mongodb+srv://…/bookie`)

## 2. Start the API

```bash
cd apps/api
cp .env.example .env
# set MONGO_URI to your local or Atlas string, e.g.:
#   MONGO_URI=mongodb://localhost:27017/bookie
npm install
npm run seed                    # loads cities, operators & all 10 categories
npm run dev                     # http://localhost:4000
```

Sanity check: `curl http://localhost:4000/verticals` → 10 categories.
(No DB handy? `npm run smoke` runs the full suite against an in-memory Mongo.)

## 3. Point the web app at the API

```bash
cd apps/web
# .env.local
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev                     # http://localhost:3000
```

That's it — search, trip details and bookings now come from MongoDB through the
API. Switch back to mock anytime by removing those two env vars.

## What's wired vs. still mock
| Area | Live via API | Notes |
|---|---|---|
| Categories, search, trip detail | ✅ | all 10 verticals seeded |
| **Signup / login (web pages)** | ✅ | real accounts in MongoDB; JWT stored client-side |
| Register / login / `GET /auth/me` | ✅ | login accepts email **or** phone |
| **Booking → payment** | ✅ | checkout `POST /bookings`, linked to the user |
| Wallet, travellers, payment methods, notifications | ⛔ mock | portal demo data — add `/account/*` endpoints next |
| Payments (Easypaisa/JazzCash settlement) | ⛔ | payment UI is simulated; needs merchant credentials (PLAN §4.2) |

The web auth + booking clients are **env-aware**: in mock mode they use a local
store / simulation, and in live mode (`NEXT_PUBLIC_USE_MOCK=false`) they call the
backend — falling back gracefully if the API is unreachable.

Demo account (seeded): **demo@bookie.pk** (or **03001234567**) / **123456**.
