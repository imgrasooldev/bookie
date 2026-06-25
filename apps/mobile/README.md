# bookie_mobile

Bookie Flutter app — **Android, iOS, and Huawei**. Mirrors the web customer flow
(multi-vertical search → results → seat/booking) over the same API shapes.

## Run

```bash
flutter pub get
flutter run            # pick a device/emulator/Chrome
flutter analyze        # static checks
flutter test           # widget smoke test
```

By default the app uses **bundled mock data** (`lib/mock_data.dart`) so it runs
with no backend. To hit the real API (`apps/api`):

1. Start the backend (`cd ../api && npm run dev`).
2. In `lib/config.dart` set `useMock = false`.
   - Android emulator reaches the host at `http://10.0.2.2:4000` (already handled).

## Structure
```
lib/
├── main.dart            # app entry + theme
├── config.dart          # API base URL + useMock toggle
├── theme.dart           # brand colors, Material 3 theme
├── models.dart          # Vertical / City / Operator / Trip (match the API)
├── api.dart             # data seam (mock or real API)
├── mock_data.dart       # bundled demo data
├── format.dart          # PKR currency, time, duration
├── screens/
│   ├── home_screen.dart     # hero + vertical tabs + search
│   ├── results_screen.dart  # trip list
│   └── booking_screen.dart  # seat picker / pax / payment / confirm
└── widgets/trip_card.dart
```

## Huawei (HMS) support
This app currently has **no Google Play Services dependencies** (no Firebase, no
Google Maps), so it builds and runs on Huawei devices and can ship to **AppGallery**
as-is:

```bash
flutter build apk --release      # works on both GMS and HMS devices
flutter build appbundle          # Play Store
flutter build ios                # iOS
```

The GMS/HMS **flavor split** (see [`docs/PLAN.md`](../../docs/PLAN.md) §5) only
becomes necessary when we add services that differ per platform:

| Concern | Google (GMS) | Huawei (HMS) |
|---|---|---|
| Push | Firebase Cloud Messaging | Huawei Push Kit |
| Maps | google_maps_flutter | huawei_map / Petal Maps |
| Location | fused location | HMS Location Kit |

At that point we introduce `gms` / `hms` build flavors that swap the plugin
implementation behind a shared interface, keeping one codebase.
