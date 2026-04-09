# Screen: Tourist Order Detail

**App:** Tourist (Mobile)
**File:** `apps/mobile/app/order/[id].tsx`
**Phase:** 3 (Orders, Vouchers & QR)
**Status:** Implemented ✅

---

## 1. Tổng quan

**Mục đích:** Hiển thị chi tiết đơn hàng — trạng thái, danh sách dịch vụ, tổng tiền, vouchers đã tạo. Hỗ trợ hủy đơn nếu status = `created`.

**Ai dùng:** Tourist đã tạo đơn

**Entry point:** Từ Checkout (sau khi tạo order thành công).

**Route chain:**
```
/app/order/checkout.tsx
  → /app/order/[id].tsx  ← THIS SCREEN
  → /app/voucher/[id].tsx  (tap voucher row)
```

---

## 2. Wireframe

```
┌──────────────────────────────────────┐
│  ┌──────────────────────────────────┐ │
│  │ ● Đã thanh toán          ← border│ │
│  │ Mã đơn: ABC12345                 │ │
│  │ Ngày tạo: 09 tháng 4 năm 2026   │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ── Dịch vụ đã đặt ──               │
│  ┌──────────────────────────────────┐ │
│  │ Tên dịch vụ A        150.000₫ │ │
│  │ x2                                │ │
│  │ ───────────────────────────────│ │
│  │ Tên dịch vụ B        100.000₫ │ │
│  │ x1                                │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ── Ghi chú ── (if exists)          │
│  ┌──────────────────────────────────┐ │
│  │ Ghi chú của khách hàng...        │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ── Voucher ── (if vouchers exist)   │
│  ┌──────────────────────────────────┐ │
│  │ 🎫 Voucher A         →          │ │
│  │ 🎫 Voucher B         →          │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Tổng cộng           400.000₫  │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [       Hủy đơn       ]  ← if created│
│  [      Xem voucher     ]  ← if paid   │
└──────────────────────────────────────┘
```

---

## 3. Status Colors & Labels

| Status | Label | Border Color |
|--------|-------|-------------|
| `created` | Chờ thanh toán | `#F59E0B` (amber) |
| `paid` | Đã thanh toán | `#005E97` (primary) |
| `partially_refunded` | Hoàn tiền một phần | `#7C3AED` (violet) |
| `refunded` | Đã hoàn tiền | `#BA1A1A` (error) |
| `cancelled` | Đã hủy | `#6B7694` (outline) |

**Note:** `redeemed`, `completed`, `settled`, `expired` statuses are not defined in this screen's STATUS_LABELS — vouchers handle those states.

---

## 4. Action Buttons

| Condition | Button | Behavior |
|-----------|--------|---------|
| `status === 'created'` | Hủy đơn | `ordersApi.cancel(id)` → invalidate `['order', id]` |
| `status === 'paid'` | Xem voucher | `router.push('/order/[id]')` — **BUG**: self-navigates to same screen |

**⚠️ Bug on line 148:** `router.push('/order/${order.id}')` when `order.id` = current page — creates duplicate stack entry instead of navigating to voucher. Should be `router.push('/vouchers')` or first voucher.

---

## 5. Component Inventory

### `OrderDetailScreen` (`order/[id].tsx`)

**Params:** `id: string`
**Query key:** `['order', id]`

**Sections:**
1. Status card — left border color-coded, label + order ID (first 8 chars) + date
2. Items list — service name, qty × price, divider between items
3. Note — conditional, single line text
4. Vouchers list — conditional, tap → navigate to voucher detail
5. Total row
6. Action buttons — conditional based on status

**Cancel mutation:**
```typescript
useMutation({
  mutationFn: () => ordersApi.cancel(id!),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] })
})
```

---

## 6. API Integration

### Get Order

**Endpoint:** `GET /orders/:id`
**Query key:** `['order', id]`
**Response:**
```typescript
{
  order: {
    id: string
    status: string
    items: { service_name: string; quantity: number; price: number }[]
    note?: string
    vouchers?: { id: string; service_name: string }[]
    total_amount: number
    created_at: string
    updated_at?: string
  }
}
```

### Cancel Order

**Endpoint:** `POST /orders/:id/cancel`
**Triggered:** when user taps "Hủy đơn" (status = `created`)
**Side effect:** invalidates `['order', id]` cache → triggers re-render with new status

---

## 7. Gaps

| Issue | Severity | Notes |
|-------|----------|-------|
| "Xem voucher" bug | 🔴 Bug | Line 148: `router.push('/order/${order.id}')` navigates to self. Should go to vouchers or first voucher. |
| Status coverage | ⚠️ Incomplete | `redeemed`, `completed`, `settled`, `expired` not shown as status labels — no specific display for voucher lifecycle |
| No payment retry | ⚠️ UX | If `status === 'created'` (unpaid), no "Thanh toán ngay" button |
| Order ID display | ⚠️ UX | Shows `id.slice(0,8)` — could show full ID or a human-readable code |

---

## 8. Implementation Log

| Date | Change |
|------|--------|
| 2026-04-09 | Screen layout doc created |