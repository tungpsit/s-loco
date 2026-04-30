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

Default API base URL: `http://10.0.2.2:3000/api/v1` for Android Emulator.

## Run

Open this folder in Android Studio or run:

```bash
gradle :app:assembleDebug
```
