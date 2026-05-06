# S-Loco Tourist Android Native

Native tourist/customer Android app written in Kotlin and Jetpack Compose.

## Scope

- Blue-first Klook-inspired tourist UI
- Home service discovery from `GET /api/v1/services`
- Browse/search with service/vendor tabs
- Service detail and order creation
- OTP login and persisted bearer token
- Checkout, order lookup, vouchers, voucher QR display
- Profile, weather/content shell, AI itinerary request screen

API environments are selected by Gradle product flavor while keeping the same `applicationId`: `local` uses `http://127.0.0.1:3000/api/v1`, `staging` uses `https://api-staging.sloco.vn/api/v1`, and `production` uses `https://api.sloco.vn/api/v1`.

## Run

Open this folder in Android Studio or run:

```bash
gradle :app:assembleDebug
```
