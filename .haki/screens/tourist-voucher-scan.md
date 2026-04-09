# Screen: Tourist Voucher Self-Redeem (Scan)

**App:** Tourist (Mobile)
**File:** `apps/mobile/app/voucher/[id]/scan.tsx`
**Phase:** 3 (Orders, Vouchers & QR)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Tourist quét QR của vendor để tự đổi voucher của mình (`paid → redeemed`).

**Ai dùng:** Tourist đã thanh toán voucher (chỉ hiện khi `voucher.status === 'paid'`)

**Entry point:** Từ Voucher Detail (tap "📷 Tự đổi voucher").

**Route chain:**
```
/app/voucher/[id].tsx
  → /app/voucher/[id]/scan.tsx  ← THIS SCREEN
```

---

## 2. Wireframe

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────────┐│
│  │      CAMERA VIEW (full screen)    ││
│  │  ┌────────────────────────┐      ││
│  │  │                        │      ││
│  │  │    [  SCAN FRAME  ]   │      ││  ← primaryFixed border
│  │  │                        │      ││
│  │  └────────────────────────┘      ││
│  │                                  ││
│  │  "Đưa mã QR của cửa hàng      ││
│  │   vào khung để quét"            ││
│  └──────────────────────────────────┘│
│                                          │
│  ┌──────────────────────────────────┐│
│  │    [  Đổi voucher  ]             ││  ← disabled until scanned
│  │         [ Hủy ]                  ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘

OR (no camera permission):

┌──────────────────────────────────────┐
│                                        │
│              📷                        │
│        Cần quyền camera               │
│                                        │
│  Để quét mã QR của cửa hàng...      │
│                                        │
│     [ Cho phép camera ]              │
└──────────────────────────────────────┘
```

---

## 3. Permission Flow

```mermaid
flowchart TD
    Init["App Start"]
    PermCheck{"permission?"}
    Loading["ActivityIndicator"]
    NoPerm["Permission Card"]
    Camera["CameraView active"]
    Scanned["Alert: confirm vendor"]
    Redeeming["redeeming = true"]
    Success["Alert: Thành công"]
    Error["Alert: Lỗi"]

    Init --> PermCheck
    PermCheck -->|"null"| Loading
    PermCheck -->|"granted"| Camera
    PermCheck -->|"!granted"| NoPerm
    NoPerm -->|"requestPermission"| PermCheck
    Camera -->|"onBarcodeScanned"| Scanned
    Scanned -->|"Đổi voucher"| Redeeming
    Redeeming -->|"success"| Success
    Redeeming -->|"error"| Error
    Success -->|"OK"| router.back()
```

---

## 4. QR Scan Behavior

**Library:** `expo-camera` (`CameraView`)
**Facing:** `back`
**Event:** `onBarcodeScanned`

**Triggered when:** QR code detected in camera frame

**Flow after scan:**
1. `setScanned(true)` — prevent re-trigger
2. `setVendorId(data)` — store scanned vendor ID
3. `Alert.alert('Đã quét', `Mã cửa hàng: ${data}`)` — confirm with user
4. Options: "Hủy" → `setScanned(false)` | "Đổi voucher" → `handleRedeem(data)`

**⚠️ Note:** `data` is used directly as `vendorId` string — QR format must be the raw vendor ID (no parsing/extraction).

---

## 5. Self-Redeem Flow

```typescript
async function handleRedeem(scannedVendorId?: string) {
  const vId = scannedVendorId ?? vendorId
  if (!vId) {
    Alert.alert('Lỗi', 'Vui lòng quét mã QR của cửa hàng.')
    return
  }
  setRedeeming(true)
  try {
    await vouchersApi.selfRedeem(voucherId, vId)
    Alert.alert('Thành công', 'Voucher đã được đổi thành công!', [
      { text: 'OK', onPress: () => router.back() }
    ])
  } catch (e: any) {
    Alert.alert('Lỗi', e.message ?? 'Không thể đổi voucher.')
  } finally {
    setRedeeming(false)
  }
}
```

**API:** `POST /vouchers/self-redeem`
**Params:** `{ voucher_id, vendor_id }`
**Success:** `voucher.status` → `redeemed`

---

## 6. Component Inventory

### `ScanScreen` (`voucher/[id]/scan.tsx`)

**Params:** `id: string` — voucher ID
**Camera:** `CameraView` with `onBarcodeScanned`

**State:**
| State | Type | Purpose |
|-------|------|---------|
| `permission` | `PermissionResponse \| null` | Camera permission status |
| `scanned` | `boolean` | QR already scanned (prevents re-trigger) |
| `vendorId` | `string \| null` | Scanned vendor ID |
| `redeeming` | `boolean` | Redemption in progress |

**Screens (3 states):**
1. **Loading** — `permission === null` → ActivityIndicator
2. **No permission** — `!permission.granted` → permission card + "Cho phép camera"
3. **Camera active** — permission granted → CameraView + scan frame + bottom buttons

**Bottom buttons:**
- Redeem: primary button, disabled until `vendorId` set
- Cancel: text button → `router.back()`

---

## 7. Design Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#005E97` | Redeem button |
| `primaryFixed` | `#90E0EF` | Scan frame border |
| `surface` | `#F4F7FB` | Permission card background |
| `white` | `#FFFFFF` | Hint text |
| `outline` | `#6B7694` | Cancel button text |
| `#000` | black | Container background |
| `rgba(0,0,0,0.8)` | black 80% | Bottom overlay |

### Scan Frame

- Size: 240×240px
- Border: 3px solid `primaryFixed`
- Radius: 20px

---

## 8. API Integration

### Self Redeem

**Endpoint:** `POST /vouchers/self-redeem`
**Body:** `{ voucher_id: string, vendor_id: string }`
**Response:** `{ voucher: VoucherDetail }`

---

## 9. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| QR format assumption | 🔴 Unclear | `data` used as raw vendorId — no extraction/parsing |
| No "manual" vendor entry | ⚠️ UX | If camera fails, no way to enter vendor code manually |
| Cancel on success | ⚠️ UX | "OK" → `router.back()` but voucher detail won't auto-refresh — needs cache invalidation |
| Double redemption guard | ✅ API-level | Backend should handle idempotency |
| No camera preview off option | ⚠️ UX | After scan + confirm, camera stays active |

---

## 10. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
