/**
 * Webhook Retry Queue Cron Job
 * Run every 30 seconds:  bun run apps/api/src/jobs/webhook-retry-cron.ts
 *
 * Or wire into the existing cron scheduler (e.g. bun run --watch or systemd timer).
 */

import { processRetryQueue } from '../services/webhook-retry.service'

async function main() {
  console.log('[WebhookRetryCron] Starting retry queue processing...')
  const { processed, failed } = await processRetryQueue()
  if (processed > 0 || failed > 0) {
    console.log(`[WebhookRetryCron] Done: ${processed} ok, ${failed} failed`)
  }
}

main().catch((err) => {
  console.error('[WebhookRetryCron] Fatal error:', err)
  process.exit(1)
})
