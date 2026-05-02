# S-Loco Vendor Android Native

Native Android vendor app written in Kotlin and Jetpack Compose.

## Scope

- Email/password login against `POST /api/v1/auth/login`
- Bearer token persistence with `SharedPreferences`
- Vendor dashboard from `GET /api/v1/dashboard/vendor`
- Vendor voucher list from `GET /api/v1/vouchers/vendor`
- Service management from `GET/POST/PATCH/DELETE /api/v1/services`
- QR token verify/redeem/complete flow through the real voucher endpoints
- Settlement history from `GET /api/v1/settlements`

The default API base URL is `http://10.0.2.2:3000/api/v1` for Android Emulator.

## Run

Open this folder in Android Studio, or run:

```bash
gradle :app:installDebug
```

A JDK, Android SDK, and Gradle are required.
