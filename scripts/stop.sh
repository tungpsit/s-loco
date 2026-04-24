#!/usr/bin/env bash
set -euo pipefail

echo "🛑 Stopping S-Loco development stack..."

# Stop API
if [ -f /tmp/sloco_api.pid ]; then
  API_PID=$(cat /tmp/sloco_api.pid)
  kill $API_PID 2>/dev/null && echo "  ✅ API stopped" || echo "  ⚠️  API not running"
  rm /tmp/sloco_api.pid
fi

# Stop Admin
if [ -f /tmp/sloco_admin.pid ]; then
  ADMIN_PID=$(cat /tmp/sloco_admin.pid)
  kill $ADMIN_PID 2>/dev/null && echo "  ✅ Admin stopped" || echo "  ⚠️  Admin not running"
  rm /tmp/sloco_admin.pid
fi

# Kill any remaining bun processes
pkill -f "bun.*s-loco" 2>/dev/null || true

echo "✅ Stack stopped"
