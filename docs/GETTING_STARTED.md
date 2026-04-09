# Getting Started — S-Loco Development

> Local development environment setup guide.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | 1.x | [bun.sh](https://bun.sh) |
| Docker + Docker Compose | latest | [docker.com](https://docker.com) |
| Node.js | 20+ | Only for admin app Docker builds |

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd s-local
bun install
```

### 2. Environment variables

```bash
cp .env.example .env
# Edit .env and fill in your secrets
# For local dev, defaults in .env.example are sufficient
```

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
```

Verify services are healthy:

```bash
docker compose ps
```

### 4. Database

```bash
# Run Drizzle migrations
bun run db:migrate

# Seed demo data (optional)
bun run db:seed
```

### 5. Start development servers

```bash
# API (Hono on Bun)
bun run --filter api dev

# Admin dashboard (Next.js)
bun run --filter admin dev

# Tourist mobile app (Expo)
cd apps/mobile && bun run dev

# Vendor mobile app (Expo)
cd apps/vendor && bun run dev
```

## Service URLs

| Service | URL |
|---------|-----|
| API | `http://localhost:3000` |
| API Health | `http://localhost:3000/health` |
| Admin Dashboard | `http://localhost:3001` |
| Mobile (Expo) | `exp://localhost:8081` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@sloco.vn` | `admin123` |

## Testing

```bash
# Unit + integration tests
bun test

# Lint check (Biome)
bun run lint

# Type check
bun run biome ci
```

## Docker Compose

For a full stack in Docker:

```bash
docker compose up --build
```

The `api` and `admin` services start after `postgres` and `redis` are healthy.

## Troubleshooting

**Port already in use:**
```bash
# Check what's using port 3000
lsof -i :3000
docker compose down
```

**Database migration fails:**
```bash
# Check DATABASE_URL in .env matches docker compose
# Verify postgres container is running
docker compose ps postgres
```

**Bun command not found:**
```bash
curl -fsSL https://bun.sh/install | bash
```

## Next Steps

- Read [Architecture Overview](docs/ARCHITECTURE.md)
- Review [API Contracts](docs/api-contract.md)
- See [Deployment Guide](docs/architecture/deployment-guide.md) for production setup
