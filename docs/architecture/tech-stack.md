# Tech Stack – S-Loco

> Lựa chọn công nghệ và lý do

---

## 1. Tổng quan

S-Loco xây dựng trên stack **TypeScript end-to-end** với Bun runtime, giúp thống nhất ngôn ngữ giữa frontend và backend, giảm context-switching và tận dụng tối đa hệ sinh thái npm.

---

## 2. Stack chi tiết

### 2.1. Frontend — Mobile App

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Framework** | React Native + Expo SDK 52+ | Cross-platform iOS & Android từ 1 codebase. Expo cung cấp OTA update, EAS Build, push notification tích hợp |
| **Navigation** | Expo Router (file-based) | Routing tương tự Next.js, hỗ trợ deep linking, typed routes |
| **State Management** | Zustand + TanStack Query | Zustand cho client state (lightweight, ít boilerplate). TanStack Query cho server state (cache, refetch, optimistic updates) |
| **UI Components** | React Native Paper / Tamagui | MD3 components, dark mode, theming. Tamagui cho hiệu năng tối ưu trên cả web và native |
| **Forms** | React Hook Form + Zod | Validation type-safe, performance tối ưu (uncontrolled inputs) |
| **QR Code** | expo-camera + expo-barcode-scanner | Quét QR cho voucher redemption |
| **Maps** | react-native-maps | Hiển thị vị trí vendor, gợi ý gần đây |
| **PWA** | Expo Web export | Cùng codebase, xuất ra PWA cho truy cập nhanh không cài đặt |

### 2.2. Frontend — Vendor App

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Framework** | React Native + Expo | Cùng stack với mobile app, chia sẻ `packages/shared` |
| **QR Scanner** | expo-camera | Vendor quét QR voucher của khách |
| **Notifications** | expo-notifications + FCM | Nhận thông báo đơn mới real-time |

### 2.3. Frontend — Admin Dashboard

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | SSR cho SEO (trang tin tức), RSC cho hiệu năng, API routes cho BFF layer |
| **UI Library** | shadcn/ui + Tailwind CSS v4 | Components đẹp, accessible, customizable. Tailwind v4 CSS-first config |
| **Charts** | Recharts / Tremor | Dashboard doanh thu, thống kê vendor |
| **Tables** | TanStack Table | Bảng dữ liệu phức tạp: sorting, filtering, pagination |
| **Forms** | React Hook Form + Zod | Consistent với mobile app |
| **Rich Text Editor** | Tiptap | Soạn tin tức, mô tả dịch vụ |

### 2.4. Backend — API Server

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Runtime** | Bun 1.x | Nhanh hơn Node.js ~3x cho HTTP, native TypeScript, tích hợp bundler & test runner |
| **Framework** | Hono | Ultra-lightweight (14KB), Web Standard APIs, middleware ecosystem, hỗ trợ Bun native |
| **Validation** | Zod | Schema validation type-safe, chia sẻ types giữa frontend & backend |
| **ORM** | Drizzle ORM | Type-safe SQL, zero overhead, migration system, PostgreSQL-first |
| **Auth** | Custom JWT (jose library) | Lightweight, kiểm soát hoàn toàn token structure, refresh rotation |
| **API Documentation** | Scalar + OpenAPI 3.1 | Auto-generate từ Zod schemas, interactive docs |

### 2.5. Database & Storage

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Primary Database** | PostgreSQL 16 | ACID, JSONB cho flexible data, full-text search tiếng Việt, trigger cho audit |
| **Cache / Session** | Redis 7 (Valkey) | Session store, OTP cache, rate limiting counters, voucher state cache |
| **Message Queue** | BullMQ (Redis-backed) | Job queue cho settlement, notifications, scheduled tasks. Dashboard UI có sẵn |
| **Object Storage** | Cloudflare R2 / RustFS | S3-compatible, lưu hình vendor, QR code, media. R2 miễn phí egress |
| **Search** (phase 2) | Meilisearch | Full-text search tiếng Việt tối ưu, faceted search cho dịch vụ |

### 2.6. AI & Machine Learning

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Itinerary Generation** | OpenAI GPT-4o-mini / Gemini 2.0 Flash | Chi phí thấp (~$0.15/1M input tokens), đủ mạnh cho structured output |
| **Prompt Framework** | Vercel AI SDK | Streaming, structured output, provider-agnostic (dễ switch OpenAI ↔ Gemini) |
| **Embedding** (phase 2) | OpenAI text-embedding-3-small | Tìm dịch vụ tương tự, recommendation engine |

### 2.7. Payment Integration

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **VNPay** | VNPay Payment API v2 | Phổ biến nhất Việt Nam, hỗ trợ QR, thẻ nội địa/quốc tế |
| **Momo** | Momo Business API | Ví điện tử phổ biến, UX tốt trên mobile |
| **SePay** | SePay API | QR chuyển khoản cá nhân, phù hợp vendor nhỏ |

### 2.8. Infrastructure & DevOps

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Containerization** | Docker + Docker Compose | Môi trường dev nhất quán, deployment reproducible |
| **CI/CD** | GitHub Actions | Tích hợp sẵn với GitHub, matrix testing, caching |
| **Hosting** (option A) | VPS (Hetzner / DigitalOcean) | Chi phí thấp giai đoạn đầu, kiểm soát hoàn toàn |
| **Hosting** (option B) | Railway / Render | PaaS, auto-deploy từ Git, scaling dễ dàng |
| **CDN** | Cloudflare | Free tier mạnh, caching, DDoS protection, Workers cho edge logic |
| **DNS** | Cloudflare DNS | Fast DNS, tích hợp CDN |
| **SSL** | Cloudflare (auto) / Let's Encrypt | TLS tự động |

### 2.9. Monitoring & Observability

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Logging** | Pino (structured JSON) | Nhanh nhất cho Node.js/Bun, JSON output cho log aggregation |
| **Log Aggregation** | Better Stack (Logtail) / Grafana Loki | Tìm kiếm log, alerting. Better Stack có free tier tốt |
| **Error Tracking** | Sentry | Auto-capture errors, source maps, performance monitoring |
| **Uptime** | Better Uptime / UptimeRobot | Health check endpoints, alerting khi downtime |
| **APM** (phase 2) | Grafana + Prometheus | Metrics chi tiết, custom dashboards |

### 2.10. Developer Experience

| Thành phần | Công nghệ | Rationale |
|---|---|---|
| **Package Manager** | Bun | Nhanh nhất, lockfile binary, workspace support |
| **Monorepo** | Bun workspaces + Turborepo | Task caching, parallel builds, dependency graph |
| **Linting** | Biome | All-in-one linter + formatter, nhanh hơn ESLint 35x |
| **Type Checking** | TypeScript 5.x (strict) | End-to-end type safety |
| **Git Hooks** | Lefthook | Pre-commit lint, pre-push type check |
| **Environment** | dotenv + Zod validation | Type-safe env vars, fail fast nếu thiếu config |

---

## 3. Decision Records

### DR-1: Bun thay vì Node.js

**Quyết định:** Dùng Bun làm runtime chính.

**Lý do:** Bun nhanh hơn Node.js ~3x cho HTTP serving, native TypeScript (không cần transpile), tích hợp package manager + bundler + test runner. Giảm toolchain complexity.

**Rủi ro:** Ecosystem chưa mature bằng Node.js. **Mitigation:** Bun tương thích ~99% npm packages. Fallback về Node.js nếu gặp issue cụ thể.

### DR-2: Hono thay vì Express/NestJS

**Quyết định:** Dùng Hono làm API framework.

**Lý do:** Ultra-lightweight (14KB), Web Standard APIs (portable giữa Bun/Deno/Cloudflare Workers), middleware ecosystem đủ dùng, TypeScript-first, Zod OpenAPI integration.

**Rủi ro:** Ít convention hơn NestJS. **Mitigation:** Tự thiết kế service layer architecture rõ ràng, document pattern cho team.

### DR-3: Drizzle ORM thay vì Prisma

**Quyết định:** Dùng Drizzle ORM.

**Lý do:** Type-safe SQL queries (không phải DSL mới), zero runtime overhead, migration system tốt, hỗ trợ PostgreSQL advanced features (JSONB, array, enum). Bun-compatible không cần binary engine.

**Rủi ro:** Ít auto-generated helpers hơn Prisma. **Mitigation:** Viết utility functions cho common patterns.

### DR-4: Zustand + TanStack Query thay vì Redux

**Quyết định:** Zustand cho client state, TanStack Query cho server state.

**Lý do:** Tách biệt rõ ràng client state vs server state. Zustand minimal boilerplate (~10 lines cho store). TanStack Query xử lý cache, background refetch, optimistic updates tốt hơn Redux Toolkit Query.

### DR-5: PostgreSQL thay vì MongoDB

**Quyết định:** Dùng PostgreSQL làm primary database.

**Lý do:** ACID transactions cần thiết cho payment/voucher. JSONB cho flexibility khi cần. Full-text search tiếng Việt với `unaccent` extension. Mature ecosystem, dễ tìm DBA.

---

## 4. Version Matrix

| Dependency | Min Version | Ghi chú |
|---|---|---|
| Bun | 1.1+ | Runtime |
| TypeScript | 5.5+ | Strict mode |
| React Native | 0.76+ | New Architecture |
| Expo SDK | 52+ | File-based routing |
| Next.js | 15+ | App Router, RSC |
| Hono | 4+ | Web Standard |
| PostgreSQL | 16+ | JSONB, logical replication |
| Redis | 7+ | ACL, Functions |
| Drizzle ORM | 0.36+ | PostgreSQL driver |
| Node.js (fallback) | 22+ | LTS, nếu cần fallback từ Bun |
