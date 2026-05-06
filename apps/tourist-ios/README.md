# S-Loco Tourist iOS Native

Native iOS tourist app written in SwiftUI.

## Scope

- Tourist home feed from `GET /api/v1/services` and `GET /api/v1/vendors`
- Browse/search for services and local vendors
- OTP login against `POST /api/v1/auth/otp/send` and `POST /api/v1/auth/otp/verify`
- Bearer token persistence in Keychain
- Create orders with `POST /api/v1/orders`
- Voucher list from `GET /api/v1/vouchers`
- QR voucher display with CoreImage
- AI itinerary request via `POST /api/v1/itinerary`

API environments are selected by build setting while keeping the same `PRODUCT_BUNDLE_IDENTIFIER`: `Debug` defaults to `http://localhost:3000/api/v1`, `Release` defaults to `https://api.sloco.vn/api/v1`, and staging can be built with `Config/Staging.xcconfig` using `https://api-staging.sloco.vn/api/v1`.

## Run

Open `SLocalTourist.xcodeproj` in Xcode and run the `SLocalTourist` scheme on an iOS simulator.

From the terminal:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild -project SLocalTourist.xcodeproj -scheme SLocalTourist -destination 'platform=iOS Simulator,name=iPhone 17' build
```
