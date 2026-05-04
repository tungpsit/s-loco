# S-Loco Store Publish Readiness

Last updated: 2026-05-04

This document is the source of truth for Apple App Store Connect and Google Play Console review preparation for the S-Loco mobile apps.

## Public URLs

Use the final production domain before submission. Current app defaults point to these public paths:

| Purpose | URL |
| --- | --- |
| Privacy Policy | `https://sloco.vn/privacy` |
| Terms of Service | `https://sloco.vn/terms` |
| Support | `https://sloco.vn/support` |
| Account/Data Deletion | `https://sloco.vn/delete-account` |
| Production API | `https://api.sloco.vn/api/v1` |

## App inventory

| App | Bundle/package ID | Sensitive permissions | SDKs/services | Account data | Store notes |
| --- | --- | --- | --- | --- | --- |
| Tourist iOS | `vn.sloco.tourist` | Push notifications only. Camera is intentionally not declared until tourist-side QR scanning ships. | Firebase Messaging, Firebase Analytics, S-Loco API, Open-Meteo weather fallback. | OTP phone login, access/refresh tokens in Keychain, voucher/order/reservation history. | App Privacy must disclose contact info/user identifiers, purchases/orders, app activity if analytics remains enabled, diagnostics/device identifiers collected by Firebase. |
| Tourist Android | `vn.sloco.tourist` | `POST_NOTIFICATIONS`. Camera is intentionally removed until tourist-side QR scanning ships. | Firebase Messaging, S-Loco API, Open-Meteo weather fallback, ZXing QR generation. | OTP phone login, access/refresh tokens in app-private preferences excluded from backup, voucher/order/reservation history. | Data Safety must disclose account/contact info, purchases/orders, app activity/device IDs for Firebase as applicable. |
| Vendor iOS | `vn.sloco.vendor` | Camera for voucher QR scanning, location while in use for saving store coordinates, push notifications. | Firebase Messaging, Firebase Analytics, S-Loco API, OpenStreetMap/Leaflet map display. | Email/password login, access/refresh tokens in Keychain, vendor profile/services/orders/settlements. | App Privacy must disclose contact info/user identifiers, location for app functionality, purchases/financial transaction records, app activity if analytics remains enabled, diagnostics/device identifiers collected by Firebase. |
| Vendor Android | `vn.sloco.vendor` | Approximate/fine location for saving store coordinates, `POST_NOTIFICATIONS`. Camera is not declared because QR redemption is token entry in the current Android app. | Firebase Messaging, S-Loco API, OpenStreetMap/Leaflet map display. | Email/password login, access/refresh tokens in app-private preferences excluded from backup, vendor profile/services/orders/settlements. | Data Safety must disclose location, account/contact info, financial/order data, device IDs for Firebase as applicable. |

## Required App Store Connect entries

- Privacy Policy URL: `https://sloco.vn/privacy`.
- App Review notes: provide demo Tourist and Vendor accounts, explain voucher/payment flow status, and provide support contact.
- App Privacy labels must match the inventory above and Firebase SDK behavior.
- If Sign in with Apple becomes a login option requirement later, add it only if third-party/social login is added. Current login is OTP/email-password, so it is not required.
- Account deletion: in-app Settings link opens `https://sloco.vn/delete-account` where users can initiate deletion.
- Push notifications: iOS targets include `aps-environment`; production archive still requires valid Apple Developer Team, APNs key/cert, provisioning profile, and Firebase APNs configuration.

## Required Google Play Console entries

- Privacy policy URL: `https://sloco.vn/privacy`.
- Data deletion URL: `https://sloco.vn/delete-account`.
- Data Safety form: match the app inventory and Firebase behavior.
- App access: provide reviewer credentials for restricted Tourist/Vendor flows.
- Ads declaration: mark as no ads unless an ad SDK is added.
- Content rating and target audience: complete separately in Play Console.
- Sensitive permissions: location only for Vendor Android; notifications for both Android apps; camera not requested by Tourist Android.

## Release artifacts still needed outside the repository

- Production API deployed at the configured HTTPS URL.
- Apple Developer Team ID and production provisioning profiles.
- Android upload keystore or Play App Signing setup. Release builds read signing credentials from environment variables and do not commit keystores:
  - Tourist Android: `SLOCO_TOURIST_UPLOAD_KEYSTORE`, `SLOCO_TOURIST_UPLOAD_KEYSTORE_PASSWORD`, `SLOCO_TOURIST_UPLOAD_KEY_ALIAS`, `SLOCO_TOURIST_UPLOAD_KEY_PASSWORD`.
  - Vendor Android: `SLOCO_VENDOR_UPLOAD_KEYSTORE`, `SLOCO_VENDOR_UPLOAD_KEYSTORE_PASSWORD`, `SLOCO_VENDOR_UPLOAD_KEY_ALIAS`, `SLOCO_VENDOR_UPLOAD_KEY_PASSWORD`.
- Production Firebase configuration for all apps:
  - `apps/tourist-ios/SLocalTourist/GoogleService-Info.plist`
  - `apps/vendor-ios/SLocalVendor/GoogleService-Info.plist`
  - `apps/tourist-android/app/google-services.json`
  - `apps/vendor-android/app/google-services.json`
- Final store screenshots, app descriptions, content rating answers, reviewer credentials, and support contact.

## Manual review checklist

- Fresh install each app.
- Confirm production API uses HTTPS and no local/emulator URL appears in release UI or logs.
- Confirm Privacy, Terms, Support, and Delete Account links open from each app.
- Confirm Tourist apps do not request camera permission.
- Confirm Vendor iOS camera prompt appears only when QR scanning is used.
- Confirm Vendor location prompt appears only when saving store coordinates.
- Confirm notification permission is user-initiated/contextual and denial does not block core app usage.
- Confirm checkout/payment copy is not presented as a working live gateway unless the backend payment initiation flow is enabled.
