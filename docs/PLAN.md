# Transport Booking Platform — Technical Plan & Architecture

> ⚠️ **Historical design doc.** For how the platform actually works today, see
> [`ARCHITECTURE.md`](ARCHITECTURE.md). Current scope is narrowed to **intercity per-seat
> Bus / Car / HiAce** (other verticals exist in the model but are disabled via the admin
> Services toggle); car/HiAce are now **route-based per-seat** (not intra-city rides).

> A multi-vertical transport booking marketplace for Pakistan (à la Bookme / Sastaticket).
> Verticals: **Bus (intercity ticketing)**, **Intra-city car/ride**, **Picnic & party booking**, **Corporate event transport**.
> Targets: **Web (customer)**, **Admin/Operator panel**, **Mobile (Android, iOS, Huawei)**.

---

## 1. Product Vision & Scope

A single platform where:
- **Customers** search trips/timings, compare operators & fares, pick seats/vehicles, book, pay, get e-tickets, track rides, rate, and manage bookings.
- **Operators/Vendors** (bus companies, fleet owners, charter providers) list inventory, manage schedules/seats/pricing, accept charter requests, see bookings & settlements.
- **Drivers** see assigned trips, update status, and (for rides) share live location.
- **Admins** manage the whole marketplace: vendors, commissions, payments, disputes, content, promotions, reports.

### The "all-verticals, thin" idea
Instead of building four separate products, we model **one generic Booking** over a generic **Service/Listing** that has a `serviceType`. Each vertical is a *flavor* of the same core:

| Vertical | serviceType | Inventory model | Booking flow |
|---|---|---|---|
| Bus intercity | `SCHEDULED_SEAT` | Route + dated schedule + seat map | Pick seats → pay → e-ticket |
| Intra-city car | `ON_DEMAND_RIDE` / `SCHEDULED_RIDE` | Vehicle + driver availability | Set pickup/drop → fare estimate → match/assign → live track |
| Picnic / party | `CHARTER` | Vehicle/package, request-based | Request quote → operator confirms price → pay → confirmed |
| Corporate transport | `CHARTER` / `CONTRACT` | Vehicle/package, often recurring | Request/RFQ → contract/quote → schedule → invoice |

This keeps **one search, one cart, one payment, one bookings list, one ratings system** while letting each vertical add its specifics.

---

## 2. High-Level Architecture

```
                         ┌─────────────────────────────────────────┐
                         │              CLIENTS                      │
                         │                                           │
  Customer Web (Next.js) │  Admin/Operator Web (React)  │  Flutter  │
  SEO + bookings         │  dashboards                  │  App      │
                         │                              │ (Android/ │
                         │                              │  iOS/HMS) │
                         └───────────────┬───────────────────────────┘
                                         │ HTTPS / WSS
                         ┌───────────────▼───────────────┐
                         │        API GATEWAY / BFF        │
                         │   Node + Express, REST + WS     │
                         │   JWT auth, rate limit, validation
                         └───────────────┬─────────────────┘
            ┌──────────────┬─────────────┼──────────────┬───────────────┐
            ▼              ▼             ▼              ▼               ▼
       Auth/Users     Catalog &      Booking &      Payments       Notifications
       (JWT/OTP)      Search         Inventory      (PSP, webhooks)  (push/SMS/email)
            │          (routes,      (seat-lock,        │               │
            │          schedules,    orders, state)     │               │
            │          pricing)          │              │               │
            └──────────────┴─────────────┼──────────────┴───────────────┘
                                         ▼
        ┌──────────────┬─────────────────┬──────────────┬──────────────┐
        │  MongoDB     │     Redis       │  Object store │   Message    │
        │  (Atlas)     │  cache + seat   │  (S3 / R2)    │   queue      │
        │  primary DB  │  locks + WS     │  images/tickets│  (BullMQ)   │
        └──────────────┴─────────────────┴──────────────┴──────────────┘
```

**Style:** Start as a **modular monolith** (one Node service, clean module boundaries) — far cheaper and faster than microservices for an early-stage product. Split out services later only if scale demands it (e.g. payments, notifications, live-tracking).

### Why these choices
- **Next.js for customer web** — booking sites live or die on Google ranking (Bookme/Sastaticket get huge organic traffic). Next.js gives SSR/SSG for SEO-critical pages (routes, "Lahore to Islamabad bus", fares). Still React → fits MERN.
- **React (Vite) for Admin/Operator** — no SEO needed, fast SPA dashboards.
- **Flutter for mobile** — single codebase for Android, iOS **and Huawei (HMS)**. This is the decisive reason: Huawei has no Google Play Services, and Flutter handles HMS far better than React Native.
- **Node + Express backend** — MERN, shared TypeScript types with frontends, huge ecosystem for payments/queues.
- **MongoDB** — flexible schema suits the multi-vertical generic model (booking subdocuments differ per type). Use **Mongoose discriminators** for service/booking types.
- **Redis** — essential for **seat locking** (prevent double-booking), caching search, session/OTP, and Socket.io scaling.

---

## 3. Core Domain Model (MongoDB / Mongoose)

Sketches — fields trimmed for clarity. TypeScript-style.

```ts
// ---------- Identity ----------
User {
  _id, name, phone (unique, OTP-verified), email?, passwordHash?,
  roles: ['customer' | 'operator_admin' | 'driver' | 'admin' | 'support'],
  operatorId?,          // if staff/driver of an operator
  wallet: { balance, currency: 'PKR' },
  status, createdAt
}

Operator {                // vendor: bus company / fleet / charter provider
  _id, name, type: ['BUS' | 'CAR' | 'CHARTER'],
  kyc: { docs[], status },
  commissionRate,         // platform cut
  payout: { bankAccount, schedule },
  rating, status
}

Vehicle {
  _id, operatorId, type: ['BUS'|'COACH'|'HIACE'|'CAR'|'SUV'],
  registrationNo, capacity, amenities[], seatMapId?, photos[]
}

SeatMap {                 // reusable layout: rows/cols, aisle, seat labels
  _id, name, layout: [[ {label, type, x, y} ]]
}

Driver {                  // a User with role driver + extra
  _id, userId, operatorId, licenseNo, currentLocation?, status
}

// ---------- Catalog / Inventory ----------
Location { _id, city, terminal/area, geo: {lat,lng}, type }

Route {                   // for SCHEDULED_SEAT (bus)
  _id, operatorId, origin: LocationRef, destination: LocationRef,
  stops: [{ location, order, etaOffsetMin }], distanceKm
}

Schedule {                // a dated, runnable instance of a Route
  _id, routeId, vehicleId, seatMapId,
  departureAt, arrivalAt, recurrence?,    // generate daily instances
  basePrice, currency: 'PKR',
  status: ['SCHEDULED'|'DEPARTED'|'COMPLETED'|'CANCELLED']
}

Service {                 // GENERIC listing — discriminated by serviceType
  _id, operatorId,
  serviceType: 'SCHEDULED_SEAT' | 'ON_DEMAND_RIDE' | 'SCHEDULED_RIDE' | 'CHARTER',
  title, description, photos[], amenities[],
  pricing: { model: 'PER_SEAT'|'PER_KM'|'FIXED'|'QUOTE', base, perKm?, perHour? },
  // type-specific refs:
  scheduleId?,            // SCHEDULED_SEAT
  vehicleId?,             // CHARTER / RIDE
  serviceArea?,           // RIDE (city/polygon)
  status, rating
}

// ---------- Booking (the heart) ----------
Booking {
  _id, bookingNo (human ref), customerId, operatorId,
  serviceType,            // mirrors Service
  serviceId, scheduleId?,
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'IN_PROGRESS'
        | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'QUOTE_REQUESTED' | 'QUOTED',
  passengers: [{ name, phone, cnic?, seatLabel? }],
  // seat-based:
  seats?: [String],
  // ride-based:
  pickup?: {geo, address}, dropoff?: {geo, address}, scheduledAt?, driverId?,
  // charter/corporate:
  quote?: { requestedAt, amount, validUntil, notes },
  fare: { subtotal, fees, discount, total, currency: 'PKR', couponCode? },
  payment: { status, method, transactionId },
  ticketUrl?,             // generated PDF/QR
  timeline: [{ status, at, by }],
  createdAt
}

// ---------- Payments ----------
Transaction {
  _id, bookingId, customerId, gateway: 'JAZZCASH'|'EASYPAISA'|'CARD'|'WALLET'|'CASH',
  amount, currency, status: 'INITIATED'|'SUCCESS'|'FAILED'|'REFUNDED',
  gatewayRef, idempotencyKey, raw, createdAt
}

Settlement { _id, operatorId, period, gross, commission, net, payoutStatus }

// ---------- Engagement ----------
Coupon { code, type:'PERCENT'|'FLAT', value, caps, validity, usageLimits }
Review { bookingId, customerId, operatorId, rating, comment, createdAt }
Notification { userId, channel, template, payload, status }
```

### Seat double-booking — the critical concurrency problem
1. Customer selects seats → backend places a **Redis lock** per `scheduleId:seatLabel` with TTL (e.g. 7 min).
2. Lock acquired only if seat not already locked/sold (atomic `SET NX`).
3. On payment success → seats written to `Booking.seats` and marked sold; locks released.
4. On timeout/abandon → locks auto-expire, seats freed.
5. WebSocket pushes seat-map updates so other users see live availability.

---

## 4. Key Subsystems

### 4.1 Search & timings
- Indexed queries on `origin/destination/date` for bus; geo `$near` for rides.
- Cache hot routes in Redis. Filters: time, price, operator, amenities, seat type.
- SEO landing pages per city-pair on the Next.js side, fed by the same API.

### 4.2 Payments (Pakistan) — see `docs/payments.md` summary below
- **JazzCash** and **Easypaisa** (mobile wallets — dominant in PK), **debit/credit cards**, **bank (1Link/RAAST)**, and **cash/COD**.
- Use an aggregator to reduce integration load: **Safepay** or **PayFast (APPS)** cover cards + wallets behind one API. Keep a **gateway abstraction layer** so we can add/swap providers.
- Hard requirements: **webhook verification**, **idempotency keys**, reconciliation, refunds, and a ledger.

### 4.3 Live tracking (rides)
- Driver app emits location over WebSocket → server → customer app. Store last-known in Redis. Use Flutter `geolocator` + map (Google Maps on GMS, **Petal/Huawei Maps on HMS**).

### 4.4 Notifications (cross-platform incl. Huawei)
- Abstraction over: **FCM** (Android GMS + iOS), **APNs** (iOS), **Huawei Push Kit** (HMS), **SMS** (e.g. local SMS gateway / Twilio), **WhatsApp** (optional), **Email**.
- One `NotificationService.send(userId, template, data)` picks channels by device token type.

### 4.5 E-tickets
- Generate PDF + QR (booking ref) on confirmation; store in object storage; deliver via app + SMS/email link. QR scanned by operator for boarding.

---

## 5. Huawei / Cross-platform mobile strategy

Flutter app with a **flavor/abstraction layer** for Google vs Huawei services:

| Concern | Google (GMS) | Huawei (HMS) |
|---|---|---|
| Push | Firebase Cloud Messaging | Huawei Push Kit |
| Maps | google_maps_flutter | huawei_map / Petal Maps |
| Location | fused location | HMS Location Kit |
| In-app pay | (use local PSP) | (use local PSP) |
| Distribution | Play Store | AppGallery |

Build via Flutter **flavors** (`gms`, `hms`) selecting the right plugin at compile time. One codebase, two build outputs (+ iOS).

---

## 6. Phased Roadmap

> Principle: **one backend, ship value vertically.** Get the bus vertical fully working end-to-end before widening — it exercises the hardest mechanics (seats, payments, tickets) that the generic model reuses.

**Phase 0 — Foundations (1–2 wks)**
Monorepo, TypeScript shared types, CI/CD, MongoDB Atlas + Redis, auth (phone OTP + JWT), base API skeleton, design system.

**Phase 1 — Core booking backend + Customer Web (4–6 wks)**
Generic Service/Booking model; bus vertical full path: search → seat selection → seat-lock → checkout → **one payment method (JazzCash or Safepay)** → e-ticket → my-bookings. Next.js customer site.

**Phase 2 — Admin & Operator panel (3–4 wks)**
React dashboard: vendor onboarding/KYC, routes & schedules, seat maps, pricing, bookings, refunds, commissions, reports.

**Phase 3 — Flutter mobile app (4–6 wks)**
Customer app mirroring web for bus vertical; push notifications; GMS build first, then **HMS build + AppGallery**.

**Phase 4 — Other verticals (4–6 wks)**
Intra-city ride (fare estimate, driver assignment, live tracking, driver app) + Charter/corporate (quote/RFQ flow). All reuse core Booking.

**Phase 5 — Scale & polish (ongoing)**
More payment methods, wallet, promos/referrals, ratings, settlements/payouts, analytics, performance, observability, security hardening.

---

## 7. Team & Effort (rough)

For an MVP through Phase 3 (~3–4 months):
- 1 Backend (Node/Mongo) · 1 Frontend (Next/React) · 1 Flutter dev · 0.5 Designer/PM · QA part-time.
- Solo + AI (you + me) is possible but expect 6–9 months for the same scope.

---

## 8. Risks & Decisions to Watch
- **Payments**: PSP onboarding (Safepay/PayFast/JazzCash) needs a registered business + KYC — start the paperwork early; it's the long pole.
- **Two-sided cold start**: need real operators with real inventory or the marketplace is empty. Consider seeding 1–2 bus operators first.
- **Seat-lock concurrency** and **payment webhook reliability** are where most booking bugs live — budget test time.
- **Huawei**: keep the GMS/HMS abstraction from day one; retrofitting it later is painful.
- **Generic model risk**: don't over-abstract. Build bus concretely, extract the generic parts once a 2nd vertical confirms the shape.

---

## 9. Proposed Repo Structure (monorepo)

```
transport-booking-platform/
├── apps/
│   ├── api/            # Node + Express backend (modular monolith)
│   ├── web/            # Next.js customer site (SSR/SEO)
│   ├── admin/          # React (Vite) admin + operator panel
│   └── mobile/         # Flutter app (gms/hms flavors)
├── packages/
│   ├── shared-types/   # shared TS types / API contracts
│   └── ui/             # shared web UI components
├── docs/               # architecture, data-model, payments, runbooks
└── infra/              # docker, CI, deploy configs
```

---

## 10. Immediate Next Steps (pick after reviewing this plan)
1. Scaffold the monorepo (`apps/api` + `apps/web`) with auth + the generic Booking model.
2. Implement the **bus vertical happy path** end-to-end with seat-locking.
3. Wire **one** payment method (recommend Safepay sandbox or JazzCash sandbox).
4. Stand up the operator panel to enter routes/schedules so there's real inventory.
```
