# Bookie — System Architecture & Documentation

End-to-end reference for the whole platform: the **API**, the **customer web app**, the
**admin + operator console**, and the **mobile app**. Bookie is an **intercity per-seat
transport marketplace** for Pakistan covering **Bus, Car, and HiAce**.

- [1. High-level shape](#1-high-level-shape)
- [2. Data model](#2-data-model)
- [3. API reference](#3-api-reference)
- [4. Core flows](#4-core-flows)
- [5. Customer web app](#5-customer-web-app)
- [6. Admin & operator console](#6-admin--operator-console)
- [7. Mobile app](#7-mobile-app)
- [8. Payments](#8-payments)
- [9. Auth & OTP](#9-auth--otp)
- [10. Notifications](#10-notifications)
- [11. Environment & configuration](#11-environment--configuration)
- [12. Deploy & CI/CD](#12-deploy--cicd)

---

## 1. High-level shape

```
                       ┌─────────────────────────────┐
   Customer web  ─────▶│                             │
   (Next.js)           │                             │
                       │   API  (Express + Mongo)    │──▶ MongoDB Atlas
   Mobile app   ─────▶ │   https://bookie-api.fly.dev│
   (Flutter)           │                             │──▶ Payment gateways
                       │                             │    (JazzCash/Easypaisa/Safepay)
   Admin console ─────▶│                             │──▶ SMS/WhatsApp/Email/FCM
   (Vite SPA)          └─────────────────────────────┘    (provider seams)
```

Three audiences, three front-ends, one API:

| Audience | App | Auth | Notes |
|---|---|---|---|
| **Customer** | web + mobile | phone OTP (or password); guest checkout | search → book → pay → e-ticket |
| **Operator** | admin console | operator login (`/operator/login`) | own listings, bookings, manifest, delays |
| **Super-admin** | admin console | staff login + RBAC roles | operators, cities/terminals, verticals, approvals |

All three verticals (Bus/Car/HiAce) are **route-based and per-seat**: search by
`origin → destination → date`, then pick exact seats off a date-aware seat map.

---

## 2. Data model

Mongoose models in `apps/api/src/models`:

| Model | Purpose |
|---|---|
| **Trip** | A listing. `serviceType` (BUS/CAR/HIACE/…), `originCode`/`destinationCode`, `price`, `priceUnit` (`per_seat`), `seatsAvailable`, `routeStops[]` (multi-stop with cumulative fares), `businessSeats[]`, operator, vehicle, amenities, `approved`/`status`. |
| **SeatInventory** | **Date-aware** seat state — one doc per `(trip, date)` holding `bookedSeats[]` + holds. This is what makes a seat booked for *one* departure date, not all of them. Holds/confirms are atomic Mongo updates. |
| **Booking** | A reservation: `bookingNo`, `customer?`, `trip`, `serviceType`, `originCode`/`destinationCode`, `date`, `seats[]`, `passengers[]` (name/gender/cnic/seatLabel), `contact{}`, `status`, `fare{}`, `payment{method,status,transactionRef}`. |
| **Transaction** | Payment ledger — one row per attempt. `gateway`, `gatewayRef` (idempotency anchor), `amount`, `status`, `formPost` (hosted-checkout form), `raw`. |
| **User** | Customer/staff. `phone` (primary identity), `passwordHash`, `roles[]`, `phoneVerified`, profile, **wallet** (`walletBalance` + `walletTx[]`), saved `travellers[]`, `deviceTokens[]`, `notifPrefs`. |
| **OtpChallenge** | Short-lived phone-verification code (bcrypt-hashed, single-use, 5-min TTL, attempt-locked). |
| **Operator** | A vendor (name, rating, logo color). Trips belong to operators. |
| **Vehicle** | Operator's fleet + media (photos/videos) and seat layout. |
| **City** | `code` + `name`; embeds **terminals** (boarding/drop-off `adda` points). |
| **Review** | Per-booking rating + comment; rolls up to the trip's average rating. |
| **Notification** | In-app feed item + per-channel delivery results. |
| **Setting** | Singleton: `enabledVerticals[]` (which verticals the marketplace shows). |
| **Role** | RBAC role for admin staff (permission set). |

**Booking status:** `PENDING → AWAITING_PAYMENT → CONFIRMED` (or `CANCELLED`, `QUOTE_REQUESTED`).
**Payment status:** `INITIATED → PENDING (cash) → SUCCESS` (or `FAILED`, `REFUNDED`).

---

## 3. API reference

Base URL: `https://bookie-api.fly.dev` (local `http://localhost:4000`).
Auth is a **Bearer JWT** (`Authorization: Bearer <token>`). Bodies are JSON; validation via Zod.

### Catalog — `/` (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/verticals` | enabled verticals (+ flavor) |
| GET | `/cities` | cities + terminals |
| GET | `/routes/popular` | popular routes for the home page |
| GET | `/trips?serviceType=CAR&originId=khi&destinationId=hyd&date=…` | **search** (per-seat, date-aware) |
| GET | `/trips/:id` | trip detail (+ booked seats for the date) |
| GET | `/trips/:id/reviews` | reviews for a listing |

### Auth — `/auth`
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, phone, email?, password }` → JWT |
| POST | `/auth/login` | `{ identifier, password }` → JWT |
| GET | `/auth/me` | current user |
| POST | `/auth/otp/request` | `{ phone }` → SMS code (returns `devCode` until an SMS provider is set) |
| POST | `/auth/otp/verify` | `{ phone, code, name? }` → JWT (creates account on first use) |

### Bookings — `/bookings`
| Method | Path | Notes |
|---|---|---|
| POST | `/bookings/hold` | place a temporary seat hold |
| POST | `/bookings` | create a booking (→ `AWAITING_PAYMENT`) or quote request |
| GET | `/bookings/mine` | my bookings (auth) |
| GET | `/bookings/lookup?ref=&phone=` | **guest** e-ticket retrieval (PII-guarded) |
| GET | `/bookings/:id` | booking / e-ticket detail |
| POST | `/bookings/:id/cancel` | cancel (releases seats; refund gating by payment) |
| POST | `/bookings/:id/review` | leave a rating + comment |
| GET | `/bookings/:id/review` | my review for a booking |

### Payments — `/payments`
| Method | Path | Notes |
|---|---|---|
| GET | `/payments/methods` | configured gateways + cash-at-terminal |
| POST | `/payments/initiate` | `{ bookingId, gateway? }` → checkout URL |
| POST | `/payments/cash` | reserve now, pay cash at terminal (→ CONFIRMED, payment PENDING) |
| POST | `/payments/cash/:bookingId/collect` | operator marks cash collected |
| GET | `/payments/redirect/:gateway/:txn` | auto-submit form → hosted checkout |
| GET·POST | `/payments/return/:gateway/:txn` | provider return → settle → `/pay/result` |
| POST | `/payments/webhook/:gateway` | server-to-server settlement (signature-verified) |
| POST | `/payments/mock/complete` | sandbox: complete a mock payment |
| GET | `/payments/:id` | poll a transaction's status |

### Account — `/account` (auth)
Profile (`/`, `/profile`, `/password`, `/notif-prefs`), **wallet** (`/wallet`),
**travellers** (`/travellers`, `/travellers/:id`), **notifications** (`/notifications`,
`/notifications/read`), and push (`/device-token`).

### Operator — `/operator`
Self-service vendor portal: `/register`, `/login`, `/me`, **trips** CRUD
(`/trips`, `/trips/:id`, `/trips/:id/delay`), **vehicles** + media
(`/vehicles`, `/vehicles/:id/media`), **bookings** (`/bookings`),
**stats** (`/stats`), and **manifest** (`/manifest`).

### Super-admin — `/sa` (staff + RBAC)
Operators (`/operators`, `/operators/:id`, `/operators/:id/password`),
listings approvals (`/listings`, `/listings/:id`), `/overview`,
cities + terminals (`/cities`, `/cities/:id/terminals/:code`),
**verticals toggle** (`/verticals`), and team/roles (`/roles`, `/team`, `/permissions`).

### Admin catalog — `/admin/*`
`/admin/trips`, `/admin/bookings`, `/admin/stats` (+ `PATCH`/`DELETE /trips/:id`).

---

## 4. Core flows

### Search → book → pay (customer)
```
search (origin→dest→date)  →  GET /trips
pick a listing             →  GET /trips/:id  (date-aware booked seats)
pick seats + booker info   →  POST /bookings   → booking AWAITING_PAYMENT
choose payment method      →  GET /payments/methods
  • online gateway         →  POST /payments/initiate → hosted checkout → webhook/return → CONFIRMED
  • cash at terminal       →  POST /payments/cash → CONFIRMED (payment PENDING)
confirmation               →  e-ticket with scannable QR (GET /bookings/:id)
```
**Guest checkout** is supported end-to-end; guests retrieve the e-ticket via
`/bookings/lookup?ref=&phone=`, and can create an account afterward (the booking links by phone).

### Seat integrity
`SeatInventory` is keyed per `(trip, date)`. Holds and confirms are atomic updates, so the
same seat can be free on one date and taken on another, and two customers can't grab the
same seat for the same departure.

### Operator lifecycle
Operator registers/logs in → creates listings (held until **super-admin approval**) → manages
inventory, prices, business seats, and **delay notifications** → views the **passenger manifest**
per departure and reconciles **cash** bookings.

---

## 5. Customer web app

`apps/web` — **Next.js 16** (App Router, Turbopack, standalone output), React 19, Tailwind v4.

**Key routes**
- `/` home — hero + `SearchPanel` (From/To/date/passengers, swap), popular routes
- `/search` results list with filters
- `/booking/[id]` — `BookingForm`: 2-step bus flow (seats → travellers & pay) and the
  per-vehicle seat maps (car shows driver-right/front/back)
- `/ticket/[id]` e-ticket (print, cancel, QR) · `/ticket` guest lookup
- `/pay/result` — return page for hosted-checkout gateways
- `/login`, `/signup` — **OTP-first** login with a password fallback
- `/account/*` — profile, bookings, wallet

**Payments:** `RealPaymentDialog` runs the **create-then-pay** flow — reserve the booking,
load `/payments/methods`, then settle (mock), redirect (JazzCash/Easypaisa/Safepay), or reserve
cash. Data seam in `src/lib/*` (`api.ts`, `bookings.ts`, `payments.ts`, `auth.ts`).

---

## 6. Admin & operator console

`apps/admin` — **Vite + React + react-router (HashRouter)**, Tailwind v4. One SPA serves
**two roles**:

**Operator pages** (`/`, scoped to the logged-in vendor)
- **Dashboard** — KPIs, bookings trend, revenue, recent bookings
- **Trips & Inventory** — listings + add/edit (price, seats, business seats, route stops)
- **Bookings** — vendor's bookings, status + payment indicators
- **Manifest** — passenger list per departure
- **Fleet / Schedules** — vehicles, media, timings
- **Delay** trigger — push a delay notification to a trip's passengers

**Super-admin pages** (`/admin/*`)
- **Overview** — marketplace-wide KPIs
- **Operators** — vendors, status, reset password
- **Approvals** — approve/suspend listings
- **Cities** — cities + terminals (`adda` points)
- **Services** (`AdminVerticals`) — **enable/disable verticals** (keeps marketplace to Bus/Car/HiAce)
- **Team / Roles** — staff accounts + RBAC

Talks to `/operator/*`, `/sa/*`, and `/admin/*` via `src/api.ts`. HashRouter so it works on
static hosting (nginx) with no server rewrites.

---

## 7. Mobile app

`apps/mobile` — **Flutter**, `flutter_bloc` + `get_it` (DI in `core/di/injector.dart`) + `dio`.

**Features** (`lib/features/`)
- `splash`, `onboarding`
- `auth` — **OTP login** (phone → SMS code → in; account auto-created) with password fallback
- `trips` — search (From/To/date), results, trip detail, seat picker
- `bookings` — booking page, **seat_picker** (per-vehicle: bus grid / car driver-right layout / HiAce van),
  **payment_page** (live `/payments/methods`: gateway / cash), ticket page + reviews
- `account` — profile, bookings, wallet

**Data layer** (`lib/data/`) — `models/api_models.dart`, repositories (`auth_repository`,
`booking_repository`, …) over `core/network/api_client.dart`. API base + mock toggle in
`lib/config.dart` (`prodApiUrl = https://bookie-api.fly.dev`).

**Build & install**
```bash
flutter pub get
flutter analyze
flutter build apk --release        # build/app/outputs/flutter-apk/app-release.apk
./install-to-phone.ps1             # one-command build + install to a connected device
```
**Huawei-ready:** no GMS hard dependency; FCM push is behind a seam, so it builds for AppGallery
as-is. CI/CD intentionally **excludes** mobile (it ships manually while in development).

---

## 8. Payments

One interface, multiple providers (`apps/api/src/lib/payments.ts`):

| Gateway | Activates when | Flow |
|---|---|---|
| **mock** | always (sandbox) | settles instantly via `/payments/mock/complete` |
| **JazzCash** | `JAZZCASH_MERCHANT_ID` + `JAZZCASH_PASSWORD` + `JAZZCASH_INTEGRITY_SALT` | hosted POST-redirect, **HMAC-SHA256** secure hash, signature-verified return/webhook |
| **Easypaisa** | `EASYPAISA_STORE_ID` + `EASYPAISA_HASH_KEY` | hosted POST-redirect (Easypay) |
| **Safepay** | `SAFEPAY_API_KEY` + `SAFEPAY_WEBHOOK_SECRET` | hosted checkout (cards + wallets) |
| **cash** | always | reserve now → `CONFIRMED`, payment `PENDING`; operator collects at counter |

`GET /payments/methods` returns whatever's configured, so the clients render the screen
dynamically. Webhooks are **idempotent** (keyed on `gateway`+`gatewayRef`). Hosted gateways use
`/payments/redirect/:gateway/:txn` (auto-submitting form) and return to `/payments/return/...`,
which settles and bounces the browser to the web `/pay/result` page. The exact provider field
shapes are marked `SEAM` in `payments.ts` — confirm them against your merchant kit.

---

## 9. Auth & OTP

- **Primary:** phone **OTP** (the PK norm). `POST /auth/otp/request` issues a bcrypt-hashed,
  single-use, 5-minute code (`OtpChallenge`); `POST /auth/otp/verify` signs in and **creates the
  account on first use**.
- **Fallback:** email/mobile + password (`/auth/register`, `/auth/login`).
- **SMS delivery** rides the same seam as notifications. With no provider configured the code is
  returned as `devCode` (self-gating — the moment a gateway is set, the code is sent and never
  returned). Auth endpoints are rate-limited.
- **JWT** carries `sub` + `roles`; `requireAuth`/`optionalAuth`/role middleware guard routes.

---

## 10. Notifications

`apps/api/src/lib/notify.ts` fans one message across every reachable channel and records
per-channel results; the in-app copy is a stored `Notification` (the customer's feed).

| Channel | Provider seam |
|---|---|
| in-app | always on (stored doc) |
| SMS | `SMS_GATEWAY_URL` (generic) or `TWILIO_*` |
| WhatsApp | `WHATSAPP_TOKEN` (Cloud API) |
| email | `SENDGRID_API_KEY` |
| push | Firebase (`lib/fcm.ts`) |

Triggers today: **booking confirmation** (on payment success / cash reserve) and **delay
notifications** (operator-initiated). With no credentials a channel logs a `STUB` and reports it,
so the whole flow is testable; drop in the provider call and it goes live with no other changes.

---

## 11. Environment & configuration

**API** (`apps/api/.env`)
| Var | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection (non-SRV multi-host form if local SRV DNS is blocked) |
| `JWT_SECRET` | token signing |
| `CORS_ORIGIN` | allowed web/admin origins |
| `PUBLIC_API_URL` | this API's public URL (gateway redirect/return links) |
| `WEB_URL` | customer web URL (payment result redirect) |
| `JAZZCASH_*` / `EASYPAISA_*` / `SAFEPAY_*` | payment gateways (optional) |
| `SMS_GATEWAY_URL`/`SMS_GATEWAY_KEY`/`SMS_SENDER_ID` or `TWILIO_*` | SMS / OTP delivery (optional) |
| `WHATSAPP_TOKEN`, `SENDGRID_API_KEY` | other notification channels (optional) |

**Web** (`apps/web`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_MOCK`, `allowedDevOrigins` (LAN dev).
**Admin** (`apps/admin`): `VITE_API_URL`.
**Mobile** (`apps/mobile/lib/config.dart`): `prodApiUrl`, `useMock`.

---

## 12. Deploy & CI/CD

Three Fly.io apps — `bookie-api`, `bookie-web`, `bookie-admin` — each with its own
`Dockerfile` + `fly.toml`. Full walkthrough in [`DEPLOY-FLY.md`](DEPLOY-FLY.md).

```bash
cd apps/api && fly deploy --remote-only      # likewise web, admin
fly secrets set KEY=value -a bookie-api      # configure providers without code changes
```

**CI/CD** — `.github/workflows/deploy.yml`: a push to `main` deploys whichever of
`api`/`web`/`admin` changed (via `dorny/paths-filter`). **Mobile is excluded** and ships
manually while in development.
