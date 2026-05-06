/**
 * Webhook Retry Queue — exponential backoff via Redis sorted set.
 *
 * Flow:
 *   1. processWebhook() fails (e.g. DB error) → enqueueRetry()
 *   2. processRetryQueue() (cron job, every 30s) → pops due items, retries
 *   3. If retry fails again → re-queue with longer delay (exponential backoff)
 *   4. After MAX_RETRIES (5) → dead-letter, log alert
 *
 * Redis keys:
 *   webhook:retry:queue  — ZSET(score=next_retry_timestamp, member=JSON payload)
 */

import { redis } from '../lib/redis'
import { processWebhook } from './payment.service'

// ─── Config ───────────────────────────────────────────────────────────────────
const RETRY_DELAYS_MS = [
  30_000, // Retry 1: 30 seconds
  120_000, // Retry 2: 2 minutes
  300_000, // Retry 3: 5 minutes
  900_000, // Retry 4: 15 minutes
  3600_000, // Retry 5: 1 hour
]
const MAX_RETRIES = 5
const QUEUE_KEY = 'webhook:retry:queue'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RetryEntry {
  gateway: string
  payload: Record<string, unknown>
  signature: string
  retryCount: number
  firstFailedAt: string
  lastError?: string
}

// ─── Enqueue ─────────────────────────────────────────────────────────────────
export async function enqueueWebhookRetry(
  gateway: string,
  payload: Record<string, unknown>,
  signature: string,
  errorMessage: string,
): Promise<void> {
  const entry: RetryEntry = {
    gateway,
    payload,
    signature,
    retryCount: 0,
    firstFailedAt: new Date().toISOString(),
    lastError: errorMessage,
  }

  const delay = RETRY_DELAYS_MS[0] ?? 30_000
  const score = Date.now() + delay

  await redis.zadd(QUEUE_KEY, score, JSON.stringify(entry))
  console.log(`[WebhookRetry] Enqueued ${gateway} for retry in ${delay / 1000}s`)
}

// ─── Dequeue & Process ────────────────────────────────────────────────────────
export async function processRetryQueue(): Promise<{ processed: number; failed: number }> {
  const now = Date.now()
  const results = await redis.zrangebyscore(QUEUE_KEY, 0, now)

  if (results.length === 0) return { processed: 0, failed: 0 }

  let processed = 0
  let failed = 0

  for (const raw of results) {
    let entry: RetryEntry
    try {
      entry = JSON.parse(raw) as RetryEntry
    } catch {
      // Corrupt entry — remove and skip
      await redis.zrem(QUEUE_KEY, raw)
      continue
    }

    // Remove first (idempotent — best-effort before processing)
    await redis.zrem(QUEUE_KEY, raw)

    const nextRetryCount = entry.retryCount + 1

    try {
      await processWebhook(entry.gateway, entry.payload, entry.signature)
      processed++
      console.log(`[WebhookRetry] ✅ ${entry.gateway} succeeded on retry ${nextRetryCount}`)
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)

      if (nextRetryCount >= MAX_RETRIES) {
        // Dead-letter: log critical alert, stop retrying
        console.error(
          `[WebhookRetry] 💀 ${entry.gateway} FAILED permanently after ${MAX_RETRIES} retries. ` +
            `First failure: ${entry.firstFailedAt}. Last error: ${msg}`,
        )
        // TODO: send alert to admin (Slack/email) — wire to notification service
        continue
      }

      // Re-queue with exponential backoff
      const delay =
        RETRY_DELAYS_MS[nextRetryCount] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 30_000
      const updated: RetryEntry = {
        ...entry,
        retryCount: nextRetryCount,
        lastError: msg,
      }
      await redis.zadd(QUEUE_KEY, Date.now() + delay, JSON.stringify(updated))
      console.warn(
        `[WebhookRetry] ⏳ ${entry.gateway} retry ${nextRetryCount} failed (${msg}). ` +
          `Re-queued for +${delay / 1000}s`,
      )
    }
  }

  return { processed, failed }
}

// ─── Queue size (monitoring) ──────────────────────────────────────────────────
export async function getRetryQueueSize(): Promise<number> {
  return Number(await redis.zcard(QUEUE_KEY))
}

// ─── Clear queue (dev/admin) ──────────────────────────────────────────────────
export async function clearRetryQueue(): Promise<void> {
  await redis.del(QUEUE_KEY)
}
