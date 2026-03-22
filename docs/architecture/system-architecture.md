# System Architecture – S-Local

> Super-app du lịch bản địa tại Sầm Sơn

---

## 1. Context Diagram (C4 Level 1)

Hệ thống S-Local tương tác với 3 nhóm tác nhân chính và nhiều hệ thống bên ngoài.

```mermaid
C4Context
    title S-Local — System Context

    Person(tourist, "Khách du lịch", "Tìm kiếm, đặt dịch vụ, mua voucher, nhận gợi ý AI")
    Person(vendor, "Nhà cung cấp", "Quản lý dịch vụ, nhận đơn, quét QR, đối soát")
    Person(admin, "Admin S-Local", "Quản trị vendor, đơn hàng, nội dung, đối soát")

    System(slocal, "S-Local Platform", "Siêu ứng dụng du lịch bản địa — đặt dịch vụ, voucher, combo, AI lịch trình")

    System_Ext(payment, "Payment Gateways", "VNPay, Momo, SePay — xử lý thanh toán")
    System_Ext(ai, "AI Services", "OpenAI / Gemini — tạo lịch trình, gợi ý")
    System_Ext(push, "Push Notification", "Firebase Cloud Messaging")
    System_Ext(sms, "SMS/OTP", "Gửi OTP xác thực, thông báo")
    System_Ext(cdn, "CDN / Object Storage", "Lưu trữ media, hình ảnh vendor")

    Rel(tourist, slocal, "Dùng app/PWA")
    Rel(vendor, slocal, "Dùng vendor app")
    Rel(admin, slocal, "Dùng admin web")
    Rel(slocal, payment, "Tạo giao dịch, webhook")
    Rel(slocal, ai, "Gọi API tạo lịch trình")
    Rel(slocal, push, "Gửi push notification")
    Rel(slocal, sms, "Gửi OTP, thông báo")
    Rel(slocal, cdn, "Upload/serve media")
```

---

## 2. Container Diagram (C4 Level 2)

```mermaid
C4Container
    title S-Local — Container Diagram

    Person(tourist, "Khách du lịch")
    Person(vendor, "Nhà cung cấp")
    Person(admin, "Admin")

    System_Boundary(slocal, "S-Local Platform") {
        Container(mobile, "Mobile App", "React Native / Expo", "iOS & Android — khách du lịch")
        Container(pwa, "PWA", "React Native Web", "Truy cập nhanh không cần cài đặt")
        Container(vendorApp, "Vendor App", "React Native / Expo", "Quản lý đơn, quét QR")
        Container(adminWeb, "Admin Dashboard", "Next.js 15", "Quản trị toàn hệ thống")
        Container(apiGw, "API Gateway", "Node.js + Hono", "Routing, auth, rate limiting")
        Container(authSvc, "Auth Service", "Node.js", "Đăng nhập, JWT, OTP, RBAC")
        Container(bookingSvc, "Booking & Voucher Service", "Node.js", "Đặt dịch vụ, voucher lifecycle")
        Container(vendorSvc, "Vendor Service", "Node.js", "Quản lý vendor, dịch vụ, danh mục")
        Container(paymentSvc, "Payment Service", "Node.js", "Thanh toán, webhook, hoàn tiền")
        Container(settleSvc, "Settlement Service", "Node.js", "Đối soát, giải ngân")
        Container(contentSvc, "Content Service", "Node.js", "Tin tức, sự kiện, thời tiết")
        Container(aiSvc, "AI Itinerary Service", "Node.js", "Tạo lịch trình cá nhân hóa")
        Container(notifySvc, "Notification Service", "Node.js", "Push, email, SMS")
        Container(db, "PostgreSQL 16", "Database", "Dữ liệu chính")
        Container(redis, "Redis", "Cache & Queue", "Session, cache, BullMQ jobs")
        Container(storage, "Object Storage", "S3-compatible", "Media, QR code")
    }

    System_Ext(payment, "Payment Gateways")
    System_Ext(ai, "AI APIs")
    System_Ext(push, "FCM")

    Rel(tourist, mobile, "Sử dụng")
    Rel(tourist, pwa, "Sử dụng")
    Rel(vendor, vendorApp, "Sử dụng")
    Rel(admin, adminWeb, "Sử dụng")
    Rel(mobile, apiGw, "HTTPS/REST")
    Rel(pwa, apiGw, "HTTPS/REST")
    Rel(vendorApp, apiGw, "HTTPS/REST")
    Rel(adminWeb, apiGw, "HTTPS/REST")
    Rel(apiGw, authSvc, "Internal")
    Rel(apiGw, bookingSvc, "Internal")
    Rel(apiGw, vendorSvc, "Internal")
    Rel(apiGw, paymentSvc, "Internal")
    Rel(apiGw, settleSvc, "Internal")
    Rel(apiGw, contentSvc, "Internal")
    Rel(apiGw, aiSvc, "Internal")
    Rel(apiGw, notifySvc, "Internal")
    Rel(bookingSvc, db, "SQL")
    Rel(vendorSvc, db, "SQL")
    Rel(paymentSvc, db, "SQL")
    Rel(settleSvc, db, "SQL")
    Rel(contentSvc, db, "SQL")
    Rel(authSvc, db, "SQL")
    Rel(authSvc, redis, "Session/OTP")
    Rel(bookingSvc, redis, "Cache/Queue")
    Rel(settleSvc, redis, "BullMQ jobs")
    Rel(notifySvc, redis, "BullMQ jobs")
    Rel(paymentSvc, payment, "API/Webhook")
    Rel(aiSvc, ai, "API")
    Rel(notifySvc, push, "Push")
    Rel(vendorSvc, storage, "Media upload")
```

---

## 3. Core Service Boundaries

| Service | Trách nhiệm | Dependencies |
|---|---|---|
| **Auth Service** | Đăng ký, đăng nhập (OTP/mật khẩu), JWT, refresh token, RBAC | Redis (OTP/session), DB (users) |
| **Booking & Voucher Service** | Tạo đơn hàng, quản lý voucher lifecycle (state machine), combo, QR code | DB, Redis (cache), Payment Service |
| **Vendor Service** | CRUD vendor, dịch vụ, danh mục, media, onboard, rating/review | DB, Object Storage |
| **Payment Service** | Tạo giao dịch, xử lý webhook, hoàn tiền, retry logic | Payment Gateways, DB |
| **Settlement Service** | Đối soát, tính toán hoa hồng, giải ngân (ngay / theo chu kỳ) | DB, Redis (BullMQ) |
| **Content Service** | CRUD tin tức, sự kiện, thời tiết cache | DB, External weather API |
| **AI Itinerary Service** | Nhận input (ngân sách, thời gian, sở thích), gọi AI, trả lịch trình | AI APIs, Vendor Service (danh sách dịch vụ) |
| **Notification Service** | Push notification, SMS, in-app notification | FCM, SMS provider, Redis (BullMQ) |

---

## 4. Data Flow: Voucher Purchase & Redemption

```mermaid
sequenceDiagram
    participant T as Khách du lịch
    participant App as Mobile App
    participant API as API Gateway
    participant Book as Booking Service
    participant Pay as Payment Service
    participant PG as Payment Gateway
    participant N as Notification Service
    participant V as Vendor App
    participant Settle as Settlement Service

    T->>App: 1. Chọn dịch vụ & cấu hình
    App->>API: 2. POST /orders
    API->>Book: 3. Tạo order + voucher (CREATED)
    Book-->>API: 4. Order ID + payment URL
    API-->>App: 5. Redirect thanh toán

    App->>PG: 6. Thanh toán
    PG-->>Pay: 7. Webhook: payment success
    Pay->>Book: 8. Cập nhật voucher → PAID
    Book->>N: 9. Gửi thông báo
    N-->>App: 10. Push: "Voucher đã sẵn sàng"
    N-->>V: 11. Push: "Có đơn mới"

    T->>App: 12. Mở voucher → hiển thị QR
    V->>App: 13. Quét QR
    App->>API: 14. POST /qr/redeem
    API->>Book: 15. Voucher → REDEEMED

    V->>V: 16. Cung cấp dịch vụ
    V->>API: 17. POST /vouchers/:id/complete
    API->>Book: 18. Voucher → COMPLETED
    Book->>Settle: 19. Enqueue settlement job
    Settle->>Settle: 20. Tính toán hoa hồng
    Settle->>PG: 21. Giải ngân cho vendor
    Settle->>Book: 22. Voucher → SETTLED
```

---

## 5. Data Flow: Vendor Settlement

```mermaid
flowchart TD
    A["Voucher COMPLETED"] --> B{Hình thức giải ngân?}
    B -->|Rút ngay| C["Tạo settlement job ngay"]
    B -->|Theo chu kỳ| D["Gom vào batch lần kế (3 ngày)"]
    C --> E["Tính toán: vendor_amount = customer_paid - commission"]
    D --> E
    E --> F["Tạo payout request"]
    F --> G["Chuyển khoản cho vendor"]
    G --> H{Thành công?}
    H -->|Có| I["Voucher → SETTLED"]
    H -->|Không| J["Retry sau 1 giờ (tối đa 3 lần)"]
    J --> G
```

---

## 6. Data Flow: AI Itinerary Generation

```mermaid
sequenceDiagram
    participant T as Khách du lịch
    participant App as Mobile App
    participant API as API Gateway
    participant AI as AI Itinerary Service
    participant LLM as OpenAI / Gemini
    participant VS as Vendor Service

    T->>App: Nhập: thời gian, ngân sách, sở thích
    App->>API: POST /ai/itinerary
    API->>AI: Forward request
    AI->>VS: Lấy danh sách dịch vụ phù hợp
    VS-->>AI: Danh sách dịch vụ + giá + rating
    AI->>LLM: Prompt: tạo lịch trình tối ưu
    LLM-->>AI: Lịch trình đề xuất (structured JSON)
    AI->>AI: Map lại với dịch vụ thực trên nền tảng
    AI-->>API: Lịch trình + danh sách voucher gợi ý
    API-->>App: Hiển thị lịch trình
    T->>App: Chọn "Đặt tất cả" hoặc chọn từng dịch vụ
```

---

## 7. Integration Points

| Hệ thống | Giao thức | Mục đích | Ghi chú |
|---|---|---|---|
| **VNPay** | HTTPS (redirect + IPN callback) | Thanh toán thẻ, QR code ngân hàng | IPN phải verify `vnp_SecureHash` |
| **Momo** | HTTPS (redirect + webhook) | Ví Momo | Verify HMAC-SHA256 signature |
| **SePay** | HTTPS (QR cá nhân + webhook) | QR chuyển khoản cá nhân | Giám sát tài khoản ngân hàng |
| **OpenAI / Gemini** | HTTPS REST API | Tạo lịch trình AI | Rate limit, fallback giữa providers |
| **Firebase Cloud Messaging** | HTTPS + SDK | Push notification | Topic-based cho vendor, token-based cho khách |
| **SMS Provider** | HTTPS API | OTP xác thực, thông báo | Rate limit OTP: 5 req/phút/số |
| **Weather API** | HTTPS REST | Dữ liệu thời tiết Sầm Sơn | Cache 30 phút |

---

## 8. Monorepo Structure (đề xuất)

```
s-local/
├── apps/
│   ├── mobile/          # React Native / Expo (khách du lịch)
│   ├── vendor/          # React Native / Expo (vendor)
│   ├── admin/           # Next.js 15 (admin dashboard)
│   └── api/             # API server (Hono)
├── packages/
│   ├── shared/          # Types, utils, constants dùng chung
│   ├── db/              # Drizzle ORM schema, migrations
│   ├── validators/      # Zod schemas cho request/response
│   └── ui/              # Shared UI components (nếu cần)
├── services/
│   ├── auth/            # Auth Service logic
│   ├── booking/         # Booking & Voucher Service logic
│   ├── vendor/          # Vendor Service logic
│   ├── payment/         # Payment Service logic
│   ├── settlement/      # Settlement Service logic
│   ├── content/         # Content Service logic
│   ├── ai/              # AI Itinerary Service logic
│   └── notification/    # Notification Service logic
├── docs/                # Tài liệu này
├── docker-compose.yml
├── bun.lockb
└── package.json
```

---

## 9. Cross-cutting Concerns

| Concern | Approach |
|---|---|
| **Logging** | Structured JSON logs (pino), correlation ID per request |
| **Error Handling** | Centralized error handler, typed error codes, localized messages (vi/en) |
| **Caching** | Redis — session, OTP, voucher state, service listings (TTL-based) |
| **Idempotency** | Idempotency key cho payment/settlement requests |
| **Rate Limiting** | Token bucket tại API Gateway (Redis-backed) |
| **Health Checks** | `/health` endpoint per service — DB, Redis, external deps |
| **Correlation/Tracing** | `X-Request-ID` header propagated across services |
