# bookie_mobile

Bookie Flutter app — **Android, iOS, Huawei-ready**. The customer client: search intercity
**Bus / Car / HiAce** by route, pick seats, pay, and manage bookings over the same API the web
app uses. Full context: [`docs/ARCHITECTURE.md §7`](../../docs/ARCHITECTURE.md#7-mobile-app).

## Run

```bash
flutter pub get
flutter run            # pick a device/emulator
flutter analyze        # static checks
```

API base URL + mock toggle live in `lib/config.dart` (`prodApiUrl = https://bookie-api.fly.dev`).
Android emulator reaches a local API at `http://10.0.2.2:4000`.

## Build & install

```bash
flutter build apk --release        # build/app/outputs/flutter-apk/app-release.apk
./install-to-phone.ps1             # one-command build + install to a connected device
```

## Structure
```
lib/
├── config.dart                 # API base URL + useMock
├── core/
│   ├── di/injector.dart        # get_it service locator
│   ├── network/api_client.dart # dio client + error mapping
│   └── theme / widgets / util
├── data/
│   ├── models/api_models.dart  # Trip, Ticket, PaymentSession, PayMethod, …
│   └── repositories/           # auth_repository, booking_repository, …
└── features/
    ├── splash · onboarding
    ├── auth/                   # OTP login (phone → code) + password fallback
    ├── trips/                  # search (From/To/date) · results · detail · seat picker
    ├── bookings/               # booking · seat_picker · payment_page · ticket · review
    └── account/                # profile · bookings · wallet
```

## State & data
`flutter_bloc` for state (e.g. `AuthBloc`, `BookingBloc`), `get_it` for DI, `dio` for HTTP.
Repositories are the single seam to the API; flip `useMock` for offline/demo data.

## Highlights
- **OTP login** — phone → SMS code → in; account created on first use (password fallback available).
- **Per-vehicle seat maps** — bus 2+2 grid, **car** driver-right (RHD) + front + back, HiAce van.
- **Payments** — `payment_page` loads `/payments/methods` live: gateway hosted checkout, mock, or cash-at-terminal.

## Huawei (HMS)
No hard Google Play Services dependency; FCM push is behind a seam, so the release APK builds for
**AppGallery** as-is. A GMS/HMS flavor split is only needed once platform-specific services
(push/maps/location) diverge.

> CI/CD intentionally **excludes** mobile — it ships manually while in development.
