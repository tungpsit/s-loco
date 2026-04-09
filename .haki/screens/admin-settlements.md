# Screen: Admin Settlements (Đối soát)

**App:** Admin (Web — Next.js)
**File:** `apps/admin/src/app/dashboard/settlements/page.tsx`
**Phase:** 5 (Settlement, Notifications & Dashboards)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Admin chạy batch settlement, xem/approve/reject/disburse các đợt thanh toán vendor. Xuất báo cáo CSV.

**Ai dùng:** Admin đã đăng nhập

**Entry point:** Sidebar "Đối soát".

**Route chain:**
```
/dashboard/settlements/page.tsx  ← THIS SCREEN
```

---

## 2. Wireframe

```
┌──────────────────────────────────────────────────────────────────┐
│  Quản lý thanh toán                         Duyệt và giải ngân   │
│                                                cho vendor        │
│  ┌─────────────────────────┐  ┌───────────────────────────────┐  │
│  │ [⟳ Chạy batch mới]     │  │ [↓ Xuất báo cáo]            │  │
│  └─────────────────────────┘  └───────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│  │ Tổng giá trị│ │ Hoa hồng 8% │ │ Chờ duyệt   │ │ Đã giải  │ │
│  │ 15.000.000₫ │ │ 1.200.000₫  │ │ 3            │ │ ngân     │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Mã    Vendor    Kỳ         Tổng    Hoa hồng  Thực nhận │   │
│  │ STL-  Hải Sản  01–07/04  5M₫   400K₫    4.6M₫        │   │
│  │ XXXX  Hương     01–07/04  3M₫   240K₫    2.76M₫       │   │
│  │       Biển                                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Empty state:  📁 Chưa có giao dịch                             │
│                Nhấn "Chạy batch mới" để tạo đợt thanh toán     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Actions

### Batch Run

```typescript
batchMut = useMutation({
  mutationFn: settlementApi.runBatch,
  onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settlements'] }),
})
```

### CSV Export

```typescript
fetch('/api/v1/settlements/export', {
  headers: { Authorization: 'Bearer ' + token }
})
.then(res => res.blob())
.then(blob => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'bao-cao-thanh-toan.csv'
  a.click()
})
```

### Per-row Actions

| Status | Available Actions |
|--------|------------------|
| `pending` | **Duyệt** + **Từ chối** |
| `approved` | **Giải ngân** |
| `disbursed` | ✅ Hoàn tất (read-only) |

---

## 4. Stats Grid

| Card | Icon | Value | Calculation | Accent |
|------|------|-------|-------------|--------|
| Tổng giá trị | wallet SVG | `settlements.reduce(s, b => s + Number(b.totalAmount\|\|0), 0)` | sum totalAmount | `bg-primary/10 text-primary` |
| Hoa hồng (8%) | chart SVG | `settlements.reduce(s, b => s + Number(b.commissionAmount\|\|0), 0)` | sum commissionAmount | `bg-tertiary/10 text-tertiary` |
| Chờ duyệt | clock SVG | `settlements.filter(s => s.status === 'pending').length` | count pending | `bg-amber-100 text-amber-700` |
| Đã giải ngân | check SVG | `settlements.reduce(s, b => b.status === 'disbursed' ? s + Number(b.netAmount\|\|0) : s, 0)` | sum netAmount where disbursed | `bg-emerald-100 text-emerald-700` |

---

## 5. Data Normalization

```typescript
function normalise(raw: any[]): any[] {
  return raw.map((r) => {
    if (r.settlement) {
      return { ...r.settlement, vendorName: r.vendor?.name || 'Không rõ' }
    }
    return r
  })
}
```

**Note:** API returns `{ settlement, vendor }[]` — `normalise()` flattens to flat settlement objects with `vendorName`.

---

## 6. Settlement Table Columns

| Column | Path | Notes |
|--------|------|-------|
| Mã | `id` → `STL-{shortId}` | `shortId = id.slice(0, 8).toUpperCase()` |
| Vendor | `vendorName` | First char avatar circle |
| Kỳ | `periodStart` – `periodEnd` | `dd/MM` format |
| Tổng | `totalAmount` | right-aligned, formatted |
| Hoa hồng | `commissionAmount` | red text |
| Thực nhận | `netAmount` | bold, primary color |
| Voucher | `voucherCount` | count |
| Trạng thái | `status` | Badge |
| Thao tác | — | Action buttons |

---

## 7. Status Badge

| Status | Label | Style |
|--------|-------|-------|
| `pending` | Chờ duyệt | `bg-amber-50 text-amber-700 ring-amber-200` |
| `approved` | Đã duyệt | `bg-blue-50 text-blue-700 ring-blue-200` |
| `disbursed` | Đã giải ngân | `bg-emerald-50 text-emerald-700 ring-emerald-200` |
| `rejected` | Từ chối | `bg-red-50 text-red-700 ring-red-200` |

---

## 8. API Integration

### List Settlements

**Endpoint:** `GET /settlements` (via `settlementApi.list()`)
**Query key:** `['admin-settlements']`

### Approve

**Endpoint:** `PATCH /settlements/:id/approve`

### Reject

**Endpoint:** `PATCH /settlements/:id/reject`

### Disburse

**Endpoint:** `PATCH /settlements/:id/disburse`

### Run Batch

**Endpoint:** `POST /settlements/batch` (via `settlementApi.runBatch()`)

### Export

**Endpoint:** `GET /settlements/export`
**Returns:** CSV file

---

## 9. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#005E97` | Stats accent, approved badge |
| `tertiary` | `#3F3D99` | Commission stats |
| `error` | `#BA1A1A` | Commission amounts, rejected badge |
| `surface-low` | `#EDF1F8` | Table header bg |
| `surface` | `#F4F7FB` | Page bg |

---

## 10. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| Batch without date range | 🔴 UX | "Chạy batch mới" has no UI to specify period — fires with backend defaults |
| No settlement detail page | 🔴 Missing | Can't see breakdown of vouchers per settlement |
| Batch run has no confirmation dialog | ⚠️ UX | Confirms via React Query mutation with no pre-check |
| Export requires token handling | ⚠️ Bug risk | Direct `fetch` with `localStorage.getItem` works but inconsistent with other API calls |
| `voucherCount` may not be in response | ⚠️ Missing | If API doesn't return `voucherCount`, shows `—` |
| Disbursed amount summed only after status check | ⚠️ UX | `b.status === 'disbursed'` may miss cases where `disbursed` has variants |
| No "reject with reason" | ⚠️ UX | Reject button doesn't prompt for reason — just fires |

---

## 11. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |
