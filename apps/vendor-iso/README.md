# S-Loco Vendor iOS Native

Native iOS vendor app written in Swift and SwiftUI.

## Scope

- Email/password login against `POST /api/v1/auth/login`
- Bearer token persistence in Keychain
- Vendor dashboard from `GET /api/v1/dashboard/vendor`
- Vendor voucher list from `GET /api/v1/vouchers/vendor`
- QR camera scanning with AVFoundation plus verify/redeem/complete API calls
- Settlement history from `GET /api/v1/settlements`

The default API base URL is `http://localhost:3000/api/v1` for iOS Simulator.

## Run

Open `SLocalVendor.xcodeproj` in Xcode and run the `SLocalVendor` scheme on an iOS simulator.

If `xcodebuild` is used from the terminal, ensure the active developer directory points to Xcode:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```
