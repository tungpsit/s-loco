#!/usr/bin/env bash
set -euo pipefail

# S-Loco Development Stack Startup Script
# Starts: Postgres, Redis, API, Admin Dashboard

echo "🚀 Starting S-Loco development stack..."

# Add bun to PATH
export PATH="$HOME/.bun/bin:$PATH"

# Check prerequisites
command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL not found"; exit 1; }
command -v redis-cli >/dev/null 2>&1 || { echo "❌ Redis not found"; exit 1; }
command -v bun >/dev/null 2>&1 || { echo "❌ Bun not found"; exit 1; }

# Start services
echo "📦 Starting PostgreSQL..."
brew services start postgresql@16 2>/dev/null || true

echo "📦 Starting Redis..."
brew services start redis 2>/dev/null || true

sleep 2

# Check services
echo "🔍 Checking services..."
redis-cli ping >/dev/null 2>&1 && echo "  ✅ Redis OK" || { echo "  ❌ Redis failed"; exit 1; }
psql -d sloco -c "SELECT 1" >/dev/null 2>&1 && echo "  ✅ PostgreSQL OK" || { echo "  ❌ PostgreSQL failed"; exit 1; }

# Start API
echo "🌐 Starting API (port 3000)..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"
cd apps/api
bun run dev > /tmp/sloco_api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/sloco_api.pid
cd "$PROJECT_ROOT"

sleep 4

# Check API
curl -sS http://localhost:3000/health >/dev/null 2>&1 && echo "  ✅ API OK" || { echo "  ❌ API failed"; exit 1; }

# Start Admin
echo "🖥️  Starting Admin Dashboard (port 3001)..."
cd apps/admin
bun run dev > /tmp/sloco_admin.log 2>&1 &
ADMIN_PID=$!
echo $ADMIN_PID > /tmp/sloco_admin.pid
cd ../..

sleep 4

echo ""
echo "✅ S-Loco stack is running!"
echo ""
echo "📍 Services:"
echo "   API:    http://localhost:3000"
echo "   Admin:  http://localhost:3001"
echo "   Docs:   http://localhost:3000/docs"
echo ""
echo "📝 Logs:"
echo "   API:    tail -f /tmp/sloco_api.log"
echo "   Admin:  tail -f /tmp/sloco_admin.log"
echo ""
echo "🛑 To stop: ./scripts/stop.sh"
