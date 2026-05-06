# S-Loco Vendor iOS Native

Native iOS vendor app written in Swift and SwiftUI.

## Scope

- Email/password login against `POST /api/v1/auth/login`
- Bearer token persistence in Keychain
- Vendor dashboard from `GET /api/v1/dashboard/vendor`
- Vendor voucher list from `GET /api/v1/vouchers/vendor`
- Service management from `GET/POST/PATCH/DELETE /api/v1/services`
- QR camera scanning with AVFoundation plus verify/redeem/complete API calls
- Settlement history from `GET /api/v1/settlements`

API environments are selected by build setting while keeping the same `PRODUCT_BUNDLE_IDENTIFIER`: `Debug` defaults to `http://localhost:3000/api/v1`, `Release` defaults to `https://api.sloco.vn/api/v1`, and staging can be built with `Config/Staging.xcconfig` using `https://api-staging.sloco.vn/api/v1`.

## Run

Open `SLocalVendor.xcodeproj` in Xcode and run the `SLocalVendor` scheme on an iOS simulator.

If `xcodebuild` is used from the terminal, ensure the active developer directory points to Xcode:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```
