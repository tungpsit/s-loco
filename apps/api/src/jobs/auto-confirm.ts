import { getDb, schema } from '../db'
import { and, eq, lt } from 'drizzle-orm'

const { vouchers } = schema

/**
 * Auto-confirm job: REDEEMED vouchers older than 24h → COMPLETED
 * Called by a cron scheduler or manually via API.
 */
export async function autoConfirmExpired() {
  const db = getDb()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h ago

  const updated = await db
    .update(vouchers)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(vouchers.status, 'redeemed'), lt(vouchers.redeemedAt!, cutoff)))
    .returning({ id: vouchers.id })

  console.log(`[AutoConfirm] ${updated.length} voucher(s) auto-completed`)
  return { confirmed: updated.length, ids: updated.map((v) => v.id) }
}
