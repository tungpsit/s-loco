# S-Loco

## What This Is

S-Loco là siêu ứng dụng du lịch bản địa tại Sầm Sơn — nền tảng kết nối khách du lịch với nhà cung cấp dịch vụ địa phương (nhà hàng, khách sạn, spa, xe điện, giải trí) thông qua hệ thống voucher điện tử. Khách mua voucher trên app, mang đến cơ sở quét QR sử dụng, hệ thống tự động đối soát và giải ngân cho vendor.

## Core Value

Khách du lịch có thể tìm, đặt và thanh toán dịch vụ địa phương tại Sầm Sơn trong một ứng dụng duy nhất — nhận voucher điện tử, quét QR tại cơ sở, và được đảm bảo giá minh bạch.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hệ thống đăng ký/đăng nhập đa role (tourist, vendor, admin)
- [ ] Tourist đăng nhập bằng OTP qua số điện thoại
- [ ] Vendor/admin đăng nhập bằng email + password
- [ ] Tourist tìm kiếm, duyệt danh mục dịch vụ (ẩm thực, lưu trú, spa, xe điện, giải trí)
- [ ] Tourist xem chi tiết vendor và dịch vụ
- [ ] Tourist tạo đơn hàng (chọn dịch vụ, cấu hình, thanh toán) → nhận voucher
- [ ] Hệ thống voucher lifecycle đầy đủ (CREATED → PAID → REDEEMED → COMPLETED → SETTLED)
- [ ] QR hai chiều: vendor quét khách HOẶC khách quét vendor
- [ ] Tích hợp thanh toán (VNPay / Momo / SePay)
- [ ] Vendor nhận đơn, quét QR, xác nhận hoàn thành dịch vụ
- [ ] Hệ thống đối soát và giải ngân (rút ngay hoặc theo chu kỳ 3 ngày)
- [ ] Admin quản lý vendor, dịch vụ, đơn hàng, thanh toán, đối soát
- [ ] Combo dịch vụ (gói nhiều dịch vụ, giá ưu đãi)
- [ ] Tin tức, sự kiện, thời tiết địa phương
- [ ] AI tạo lịch trình cá nhân hóa (dựa trên ngân sách, thời gian, sở thích)
- [ ] Hệ thống thông báo (push notification cho đơn mới, cập nhật voucher)
- [ ] Tourist đánh giá, review vendor/dịch vụ sau khi hoàn thành

### Out of Scope

- Meilisearch full-text search — phase 2, dùng PostgreSQL LIKE/tsvector cho v1
- PostGIS geospatial — phase 2, dùng lat/lng filter đơn giản cho v1
- Embedding/recommendation engine — phase 2
- Grafana + Prometheus APM — phase 2
- Mobile app native build cho App Store/Google Play — v1 tập trung PWA + dev builds
- Real-time chat giữa tourist và vendor — không cần cho v1
- Loyalty/membership program — phase tương lai

## Context

**Thị trường:** Du lịch Sầm Sơn — thị trường phân tán, thiếu minh bạch, khách khó tìm vendor uy tín. S-Loco giải quyết bằng cách tạo hệ sinh thái kiểm duyệt với giá minh bạch.

**Mô hình kinh doanh:** Voucher Pre-pay & Hold. Vendor chiết khấu 8% → khách giảm 5% → S-Loco giữ 3% hoa hồng.

**Target users:**
- B2C: Khách du lịch gia đình, cặp đôi, nhóm bạn đi ngắn ngày
- B2B: Nhà hàng, khách sạn, homestay, spa, xe điện, quán cà phê, khu vui chơi

**Điều kiện khởi động:** 20-30 vendor ban đầu, đội ngũ vận hành hỗ trợ giai đoạn đầu.

**Existing documentation:** Đã có tài liệu kiến trúc chi tiết trong `docs/architecture/` bao gồm tech stack, API design, database design, system architecture, monitoring guide, security design, deployment guide.

## Constraints

- **Tech Stack**: TypeScript end-to-end, Bun runtime, Hono backend, Drizzle ORM, PostgreSQL 16, Redis 7 — đã quyết định (xem `docs/architecture/tech-stack.md`)
- **Frontend Tourist**: React Native + Expo SDK 52+ (file-based routing) — cross-platform iOS, Android, PWA
- **Frontend Vendor**: React Native + Expo (shared codebase với tourist app)
- **Frontend Admin**: Next.js 15 App Router + shadcn/ui + Tailwind CSS v4
- **API Design**: RESTful with Zod validation, JWT auth — đã thiết kế đầy đủ (xem `docs/architecture/api-design.md`)
- **Database**: Schema 15+ tables đã thiết kế — voucher state machine, audit trail, partition strategy (xem `docs/architecture/database-design.md`)
- **Architecture**: Monorepo (Bun workspaces + Turborepo), service-oriented modules — đã thiết kế (xem `docs/architecture/system-architecture.md`)
- **Payment**: VNPay + Momo + SePay — integrate 3 gateway
- **Language**: Code và comments bằng English, UI bằng Vietnamese (i18n-ready)
- **Cost**: Optimize cho chi phí thấp giai đoạn đầu (VPS hosting, free tier services)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bun thay vì Node.js | 3x faster HTTP, native TS, integrated toolchain | — Pending |
| Hono thay vì Express/NestJS | Ultra-lightweight (14KB), Web Standard APIs | — Pending |
| Drizzle ORM thay vì Prisma | Type-safe SQL, zero overhead, Bun-compatible | — Pending |
| Zustand + TanStack Query thay vì Redux | Clear separation client/server state, minimal boilerplate | — Pending |
| PostgreSQL thay vì MongoDB | ACID cho payment/voucher, JSONB flexibility, full-text search tiếng Việt | — Pending |
| Voucher Pre-pay & Hold model | Giảm no-show, bảo vệ khách, đơn giản cho vendor | — Pending |
| OTP phone login cho tourist | Phổ biến tại Việt Nam, dễ dùng, không cần nhớ password | — Pending |
| Monorepo structure | Shared types/validators, consistent tooling, atomic commits | — Pending |

---
*Last updated: 2026-03-22 after initialization*
