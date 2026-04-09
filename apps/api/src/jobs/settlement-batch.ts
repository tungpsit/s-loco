import { getDb, schema } from '../db'
import { and, eq, sql } from 'drizzle-orm'
import { createSettlementBatch } from '../services/settlement.service'

const { vouchers } = schema

/**
 * Settlement batch job: finds all vendors with COMPLETED vouchers
 * and creates settlement batches for the period.
 * Run via cron or admin trigger.
 */
export async function runSettlementBatch(periodDays = 3) {
  const db = getDb()
  const periodEnd = new Date()
  const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

  // Find vendors with completed unsettled vouchers
  const vendorRows = await db
    .selectDistinct({ vendorId: vouchers.vendorId })
    .from(vouchers)
    .where(
      and(
        eq(vouchers.status, 'completed'),
        sql`${vouchers.completedAt} >= ${periodStart}`,
        sql`${vouchers.completedAt} <= ${periodEnd}`,
      ),
    )

  const results = []
  for (const row of vendorRows) {
    const settlement = await createSettlementBatch(row.vendorId, periodStart, periodEnd)
    if (settlement) results.push(settlement)
  }

  console.log(
    `[SettlementBatch] Created ${results.length} settlement(s) for period ${periodStart.toISOString()} → ${periodEnd.toISOString()}`,
  )
  return { created: results.length, settlements: results }
}
