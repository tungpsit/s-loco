# API Design – S-Local

> RESTful API contracts, conventions, and endpoint catalog

---

## 1. General Conventions

### 1.1. Base URL

```
Production:  https://api.s-local.vn/v1
Staging:     https://api-staging.s-local.vn/v1
Development: http://localhost:3000/v1
```

### 1.2. Authentication

- **Mechanism:** Bearer JWT
- **Header:** `Authorization: Bearer <access_token>`
- **Access Token TTL:** 15 phút
- **Refresh Token TTL:** 30 ngày (stored in `httpOnly` cookie for web, secure storage for mobile)
- **Refresh Rotation:** Mỗi lần refresh, cả access + refresh token đều đổi mới (one-time use)

### 1.3. Request Format

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>        # correlation ID (auto-generated nếu thiếu)
Accept-Language: vi          # vi | en
```

### 1.4. Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "request_id": "..."
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VOUCHER_ALREADY_REDEEMED",
    "message": "Voucher này đã được sử dụng",
    "details": [
      {
        "field": "voucher_code",
        "message": "Voucher VCH-12345 đã được quét ngày 2025-01-15"
      }
    ]
  },
  "meta": {
    "request_id": "..."
  }
}
```

### 1.5. Pagination

- Cursor-based cho feeds (notifications, reviews): `?cursor=<id>&limit=20`
- Offset-based cho admin listings: `?page=1&per_page=20`

### 1.6. Filtering & Sorting

```
GET /v1/services?category_id=xxx&min_price=100000&max_price=500000&sort=price&order=asc
```

| Parameter | Format | Default |
|---|---|---|
| `sort` | field name | `created_at` |
| `order` | `asc` / `desc` | `desc` |
| `search` | free text | — |
| `status` | enum value | — |

### 1.7. Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| Auth (OTP) | 5 requests | 1 phút / số điện thoại |
| Auth (login) | 10 requests | 1 phút / IP |
| AI Itinerary | 5 requests | 1 giờ / user |
| General API | 100 requests | 1 phút / user |
| Webhook (incoming) | 1000 requests | 1 phút / IP |

Headers trả về:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706000000
```

### 1.8. Versioning

- URL-based: `/v1/`, `/v2/`
- Header-based deprecation notice: `Sunset: Sat, 01 Jan 2026 00:00:00 GMT`

---

## 2. Endpoint Catalog

### 2.1. Auth — `/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/otp/send` | Public | Gửi OTP đến SĐT |
| `POST` | `/auth/otp/verify` | Public | Xác thực OTP, trả JWT |
| `POST` | `/auth/login` | Public | Đăng nhập bằng email + password (admin/vendor) |
| `POST` | `/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/auth/logout` | Bearer | Hủy refresh token |
| `GET` | `/auth/me` | Bearer | Lấy thông tin user hiện tại |
| `PATCH` | `/auth/me` | Bearer | Cập nhật profile |

<details>
<summary>Request/Response: POST /auth/otp/send</summary>

```json
// Request
{ "phone": "+84901234567" }

// Response 200
{
  "success": true,
  "data": {
    "expires_in": 300,
    "retry_after": 60
  }
}
```
</details>

---

### 2.2. Vendors — `/v1/vendors`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/vendors` | Public | Danh sách vendor (có filter) |
| `GET` | `/vendors/:id` | Public | Chi tiết vendor |
| `GET` | `/vendors/:id/services` | Public | Dịch vụ của vendor |
| `GET` | `/vendors/:id/reviews` | Public | Đánh giá vendor |
| `POST` | `/vendors` | Bearer (admin) | Tạo vendor mới |
| `PATCH` | `/vendors/:id` | Bearer (owner/admin) | Cập nhật vendor |
| `PATCH` | `/vendors/:id/status` | Bearer (admin) | Duyệt / tạm ngưng vendor |

<details>
<summary>Request/Response: GET /vendors?category_id=xxx</summary>

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Nhà hàng Biển Xanh",
      "slug": "nha-hang-bien-xanh",
      "category": { "id": "uuid", "name": "Ẩm thực" },
      "address": "123 Đường Hồ Xuân Hương",
      "rating_avg": 4.5,
      "review_count": 128,
      "logo_url": "https://...",
      "cover_url": "https://...",
      "distance_km": 1.2
    }
  ],
  "pagination": { "page": 1, "per_page": 20, "total": 45 }
}
```
</details>

---

### 2.3. Services & Categories — `/v1/services`, `/v1/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | Public | Tất cả danh mục dịch vụ |
| `GET` | `/services` | Public | Dịch vụ (filter: category, price, rating) |
| `GET` | `/services/:id` | Public | Chi tiết dịch vụ |
| `POST` | `/services` | Bearer (vendor) | Tạo dịch vụ mới |
| `PATCH` | `/services/:id` | Bearer (vendor/admin) | Cập nhật dịch vụ |
| `DELETE` | `/services/:id` | Bearer (vendor/admin) | Soft delete dịch vụ |
| `GET` | `/services/:id/reviews` | Public | Đánh giá dịch vụ |

---

### 2.4. Combos — `/v1/combos`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/combos` | Public | Danh sách combo đang active |
| `GET` | `/combos/:id` | Public | Chi tiết combo + dịch vụ bao gồm |
| `POST` | `/combos` | Bearer (vendor) | Tạo combo |
| `PATCH` | `/combos/:id` | Bearer (vendor/admin) | Cập nhật combo |
| `DELETE` | `/combos/:id` | Bearer (vendor/admin) | Soft delete |

---

### 2.5. Orders & Vouchers — `/v1/orders`, `/v1/vouchers`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/orders` | Bearer (tourist) | Tạo đơn hàng mới |
| `GET` | `/orders` | Bearer | Danh sách đơn (tourist: của mình, vendor: nhận được, admin: tất cả) |
| `GET` | `/orders/:id` | Bearer | Chi tiết đơn + vouchers |
| `POST` | `/orders/:id/cancel` | Bearer (tourist) | Hủy đơn (nếu chưa thanh toán) |
| `GET` | `/vouchers` | Bearer | Danh sách voucher |
| `GET` | `/vouchers/:id` | Bearer | Chi tiết voucher + QR data |
| `POST` | `/vouchers/:id/complete` | Bearer (vendor) | Đánh dấu hoàn thành |

<details>
<summary>Request/Response: POST /orders</summary>

```json
// Request
{
  "vendor_id": "uuid",
  "items": [
    {
      "service_id": "uuid",
      "quantity": 2,
      "options": { "size": "L" }
    },
    {
      "combo_id": "uuid",
      "quantity": 1
    }
  ],
  "payment_gateway": "vnpay",
  "note": "Ghi chú cho vendor"
}

// Response 201
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "SL-20250715-0042",
      "total_amount": 750000,
      "status": "created"
    },
    "payment": {
      "payment_url": "https://vnpay.vn/...",
      "expires_at": "2025-07-15T10:30:00Z"
    }
  }
}
```
</details>

---

### 2.6. QR Operations — `/v1/qr`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/qr/redeem` | Bearer (vendor) | Quét QR và redeem voucher |
| `GET` | `/qr/verify/:token` | Bearer (vendor) | Kiểm tra QR hợp lệ (không redeem) |

<details>
<summary>Request/Response: POST /qr/redeem</summary>

```json
// Request
{ "qr_token": "eyJhbGciOiJIUzI1NiJ9..." }

// Response 200
{
  "success": true,
  "data": {
    "voucher": {
      "id": "uuid",
      "voucher_code": "VCH-A1B2C",
      "service_name": "Massage toàn thân 60 phút",
      "customer_name": "Nguyễn Văn A",
      "status": "redeemed",
      "redeemed_at": "2025-07-15T14:30:00Z"
    }
  }
}

// Error 400 — already redeemed
{
  "success": false,
  "error": {
    "code": "VOUCHER_ALREADY_REDEEMED",
    "message": "Voucher này đã được sử dụng lúc 14:30 ngày 15/07/2025"
  }
}
```
</details>

---

### 2.7. Payments — `/v1/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/payments/webhook/vnpay` | Webhook (IP whitelist + signature) | VNPay IPN callback |
| `POST` | `/payments/webhook/momo` | Webhook (signature) | Momo callback |
| `POST` | `/payments/webhook/sepay` | Webhook (signature) | SePay callback |
| `GET` | `/payments/:id` | Bearer | Chi tiết payment |
| `POST` | `/payments/:id/refund` | Bearer (admin) | Yêu cầu hoàn tiền |

---

### 2.8. Settlements — `/v1/settlements`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/settlements` | Bearer (vendor/admin) | Danh sách đối soát |
| `GET` | `/settlements/:id` | Bearer (vendor/admin) | Chi tiết đợt đối soát |
| `GET` | `/settlements/summary` | Bearer (vendor) | Tổng doanh thu, hoa hồng, đã rút |
| `POST` | `/settlements/:id/approve` | Bearer (admin) | Duyệt đợt đối soát |

---

### 2.9. Content — `/v1/content`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/news` | Public | Tin tức (paginated) |
| `GET` | `/content/news/:slug` | Public | Chi tiết tin tức |
| `POST` | `/content/news` | Bearer (admin) | Tạo tin tức |
| `PATCH` | `/content/news/:id` | Bearer (admin) | Cập nhật tin tức |
| `GET` | `/content/events` | Public | Sự kiện sắp tới |
| `GET` | `/content/weather` | Public | Thời tiết Sầm Sơn (cached) |

---

### 2.10. AI Itinerary — `/v1/ai`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/ai/itinerary` | Bearer (tourist) | Tạo lịch trình AI |
| `GET` | `/ai/itinerary/:id` | Bearer (tourist) | Xem lịch trình đã tạo |
| `GET` | `/ai/itinerary` | Bearer (tourist) | Lịch sử lịch trình |

<details>
<summary>Request/Response: POST /ai/itinerary</summary>

```json
// Request
{
  "duration_days": 2,
  "budget": 3000000,
  "preferences": ["biển", "ẩm thực", "spa"],
  "travel_group": "couple",
  "start_date": "2025-08-01"
}

// Response 200 (streaming hoặc polling)
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ready",
    "plan": {
      "days": [
        {
          "day": 1,
          "date": "2025-08-01",
          "activities": [
            {
              "time_slot": "sáng",
              "activity": "Tắm biển FLC",
              "service_id": "uuid",
              "estimated_cost": 200000,
              "notes": "Nên đi sớm 6-8h sáng để tránh nắng"
            },
            {
              "time_slot": "trưa",
              "activity": "Ăn hải sản tại Nhà hàng Biển Xanh",
              "service_id": "uuid",
              "estimated_cost": 500000
            }
          ]
        }
      ],
      "total_estimated_cost": 2800000,
      "suggested_vouchers": [
        { "service_id": "uuid", "name": "Combo Spa + Ăn tối", "price": 450000 }
      ]
    }
  }
}
```
</details>

---

### 2.11. Reviews — `/v1/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/reviews` | Bearer (tourist) | Tạo đánh giá (sau khi voucher COMPLETED) |
| `PATCH` | `/reviews/:id` | Bearer (tourist/admin) | Sửa đánh giá |
| `DELETE` | `/reviews/:id` | Bearer (tourist/admin) | Xóa đánh giá |

---

### 2.12. Notifications — `/v1/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/notifications` | Bearer | Danh sách thông báo (cursor-based) |
| `PATCH` | `/notifications/:id/read` | Bearer | Đánh dấu đã đọc |
| `POST` | `/notifications/read-all` | Bearer | Đánh dấu tất cả đã đọc |
| `GET` | `/notifications/unread-count` | Bearer | Số thông báo chưa đọc |

---

### 2.13. Admin — `/v1/admin`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/dashboard` | Bearer (admin) | Thống kê tổng hợp |
| `GET` | `/admin/users` | Bearer (admin) | Danh sách users |
| `PATCH` | `/admin/users/:id/role` | Bearer (admin) | Đổi role user |
| `GET` | `/admin/vendors/pending` | Bearer (admin) | Vendor chờ duyệt |
| `GET` | `/admin/orders` | Bearer (admin) | Tất cả đơn hàng |
| `GET` | `/admin/revenue` | Bearer (admin) | Báo cáo doanh thu |

---

## 3. Error Code Reference

| Code | HTTP Status | Mô tả |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input không hợp lệ |
| `UNAUTHORIZED` | 401 | Chưa đăng nhập hoặc token hết hạn |
| `FORBIDDEN` | 403 | Không có quyền truy cập |
| `NOT_FOUND` | 404 | Resource không tồn tại |
| `CONFLICT` | 409 | Xung đột dữ liệu (duplicate) |
| `RATE_LIMITED` | 429 | Quá giới hạn request |
| `OTP_EXPIRED` | 400 | OTP đã hết hạn |
| `OTP_INVALID` | 400 | OTP sai |
| `OTP_TOO_MANY_ATTEMPTS` | 429 | Quá nhiều lần thử OTP |
| `VOUCHER_ALREADY_REDEEMED` | 400 | Voucher đã sử dụng |
| `VOUCHER_EXPIRED` | 400 | Voucher đã hết hạn |
| `VOUCHER_INVALID_STATUS` | 400 | Voucher không ở trạng thái hợp lệ |
| `ORDER_CANNOT_CANCEL` | 400 | Đơn không thể hủy (đã thanh toán) |
| `PAYMENT_FAILED` | 400 | Thanh toán thất bại |
| `PAYMENT_SIGNATURE_INVALID` | 400 | Signature webhook không hợp lệ |
| `VENDOR_NOT_ACTIVE` | 400 | Vendor chưa được duyệt |
| `SERVICE_UNAVAILABLE` | 400 | Dịch vụ tạm ngưng |
| `INSUFFICIENT_STOCK` | 400 | Hết slot / tồn kho |
| `AI_GENERATION_FAILED` | 500 | Lỗi tạo lịch trình AI |
| `INTERNAL_ERROR` | 500 | Lỗi hệ thống |
