# S-Loco — Siêu ứng dụng du lịch bản địa Sầm Sơn

**S-Loco** là nền tảng kết nối khách du lịch với nhà cung cấp dịch vụ địa phương tại Sầm Sơn thông qua hệ thống voucher điện tử.

## Tech Stack

- **Runtime:** Bun 1.x
- **API:** Hono + TypeScript
- **Database:** PostgreSQL 16 + Drizzle ORM
- **Cache/Queue:** Redis 7 + BullMQ
- **Mobile:** Native Android + native iOS
- **Admin:** Next.js 15 + shadcn/ui + Tailwind CSS v4
- **Payments:** VNPay + Momo + SePay

## Quick Start

```bash
# 1. Clone and install
bun install

# 2. Copy and configure environment
cp .env.example .env

# 3. Start infrastructure
docker compose up -d

# 4. Run migrations
bun run db:migrate

# 5. Seed demo data (optional)
bun run db:seed

# 6. Start API
bun run --filter api dev

# 7. Start admin dashboard
bun run --filter admin dev

# 8. Open native mobile apps
open apps/tourist-ios/SLocalTourist.xcodeproj
gradle -p apps/tourist-android :app:installDebug
```

**Default Credentials:**
- Admin: `admin@sloco.vn` / `admin123`
- API: `http://localhost:3000`
- Admin Dashboard: `http://localhost:3001`

## Project Structure

```
apps/
├── api/          # Hono API server
├── tourist-ios/  # Native iOS tourist app
├── tourist-android/ # Native Android tourist app
├── vendor-ios/   # Native iOS vendor app
├── vendor-android/ # Native Android vendor app
└── admin/        # Next.js 15 (Admin dashboard)
packages/
├── db/           # Drizzle ORM schema + migrations
├── shared/       # Shared types, errors, constants
└── validators/   # Zod validation schemas
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Contracts](docs/api-contract.md)
- [Deployment Guide](docs/architecture/deployment-guide.md)
- [Database Schema](packages/db/drizzle/migrations/)
- [Design System](DESIGN.md)

## Testing

```bash
# Unit + integration tests
bun test

# Lint & format check
bun run lint
bun run biome ci
```

## License

Proprietary — S-Loco © 2026
