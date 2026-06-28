# Deploying Bookie to Fly.io

Three services deploy independently (the Flutter app ships to the app stores, not Fly):

| Service | Dir | Fly app (rename as needed) | Notes |
|---|---|---|---|
| API | `apps/api` | `bookie-api` | Node/Express, connects to MongoDB Atlas |
| Customer web | `apps/web` | `bookie-web` | Next.js standalone |
| Admin/operator | `apps/admin` | `bookie-admin` | Vite static SPA via nginx |

> Fly app names are **globally unique**. If `bookie-api` is taken, pick your own (e.g. `bookie-api-imran`) and update: that app's `fly.toml` `app =`, the `NEXT_PUBLIC_API_URL`/`VITE_API_URL` build args in the web & admin `fly.toml`, and the API's `CORS_ORIGIN`.

## 0. One-time setup

```bash
# install flyctl (Windows PowerShell): iwr https://fly.io/install.ps1 -useb | iex
fly auth login
```

## 1. Deploy the API first (everything points at it)

```bash
cd apps/api
fly apps create bookie-api

# secrets (NOT committed). Generate a strong JWT secret:
#   openssl rand -hex 32
fly secrets set -a bookie-api \
  MONGO_URI="mongodb+srv://<user>:<NEW_PASSWORD>@bookiecluster.f0cn0jb.mongodb.net/bookie?retryWrites=true&w=majority" \
  JWT_SECRET="<paste 64-char hex>" \
  CORS_ORIGIN="https://bookie-web.fly.dev,https://bookie-admin.fly.dev"

fly deploy
fly status        # confirm it's running → https://bookie-api.fly.dev
curl https://bookie-api.fly.dev/health
```

On Fly the normal `mongodb+srv://` string works (SRV DNS resolves there) — you don't need the multi-host workaround from local `.env`.

**MongoDB Atlas — allow Fly to connect:** Atlas → Network Access → add `0.0.0.0/0` (Fly machines have dynamic egress IPs). Keep the DB user password strong since it's open to the internet, or use Fly static egress IPs / PrivateLink for a tighter allowlist.

## 2. Deploy the web app

The API URL is baked in at **build time** (it's a `NEXT_PUBLIC_*` value), already set in `apps/web/fly.toml` → `[build.args]`. If your API app name differs, edit it there first.

```bash
cd apps/web
fly apps create bookie-web
fly deploy
# → https://bookie-web.fly.dev
```

## 3. Deploy the admin console

```bash
cd apps/admin
fly apps create bookie-admin
fly deploy
# → https://bookie-admin.fly.dev
```

## 4. Tie CORS to the real domains

If you used different app names, update the API's allowlist and it restarts:

```bash
fly secrets set -a bookie-api CORS_ORIGIN="https://<your-web>.fly.dev,https://<your-admin>.fly.dev"
```

## 5. Mobile app (release build)

`apps/mobile/lib/config.dart` currently targets your LAN for dev. For a store build, point it at the deployed API — set `lanHost = null` and change `apiBaseUrl` to return `https://bookie-api.fly.dev`, then `flutter build apk` / `flutter build appbundle`.

---

## Must-do before/around go-live
- **Rotate the Atlas DB password** — it has lived in `.env` in plaintext. Set the new one only via `fly secrets`, never in a committed file.
- **Rotate `JWT_SECRET`** to a strong random value (don't ship `dev-secret-change-me-in-prod`).
- **`NEXT_PUBLIC_API_URL` / `VITE_API_URL` are build-time** — if the API URL changes, you must redeploy web & admin (a runtime env change won't take).
- **Uploads are ephemeral** — vehicle media written to `apps/api/uploads` is lost on redeploy. Attach a Fly volume (`fly volumes create bookie_uploads -a bookie-api`, then add a `[mounts] source="bookie_uploads" destination="/app/uploads"` to `apps/api/fly.toml`) or move to S3/R2.
- **Cold starts** — `min_machines_running = 0` scales to zero (cheapest). Set it to `1` on the API for a snappier first request.
- **Payments are not real yet** — the booking flow doesn't collect money. Integrate a PSP (Safepay/PayFast) before taking real bookings.
