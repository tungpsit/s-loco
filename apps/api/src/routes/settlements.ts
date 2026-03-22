import { Hono } from 'hono'
import { runSettlementBatch } from '../jobs/settlement-batch'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as settlementSvc from '../services/settlement.service'
import { SettlementError } from '../services/settlement.service'
import { getVendorByOwnerId } from '../services/vendor.service'

const settlementRoutes = new Hono()
settlementRoutes.use('*', authMiddleware())

// ─── GET /settlements — vendor's settlement history ────
settlementRoutes.get(
  '/',
  requireRole('vendor_owner'),
  async (c) => {
    const userId = c.get('userId')!
    const vendorList = await getVendorByOwnerId(userId)
    if (!vendorList.length) return c.json({ success: true, data: { items: [], total: 0 } })
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await settlementSvc.listSettlementsByVendor(vendorList[0]!.id, { page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── GET /settlements/all — admin list all ────
settlementRoutes.get(
  '/all',
  requireRole('admin'),
  async (c) => {
    const status = c.req.query('status') || undefined
    const page = Number(c.req.query('page') || 1)
    const limit = Number(c.req.query('limit') || 20)
    const result = await settlementSvc.listAllSettlements({ status, page, limit })
    return c.json({ success: true, data: result })
  },
)

// ─── GET /settlements/reconciliation — admin ────
settlementRoutes.get(
  '/reconciliation',
  requireRole('admin'),
  async (c) => {
    const startStr = c.req.query('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endStr = c.req.query('end') || new Date().toISOString()
    const result = await settlementSvc.getReconciliationReport(new Date(startStr), new Date(endStr))
    return c.json({ success: true, data: result })
  },
)

// ─── POST /settlements/:id/approve — admin ────
settlementRoutes.post(
  '/:id/approve',
  requireRole('admin'),
  async (c) => {
    try {
      const adminId = c.get('userId')!
      const result = await settlementSvc.approveSettlement(c.req.param('id'), adminId)
      return c.json({ success: true, data: { settlement: result } })
    } catch (err) {
      if (err instanceof SettlementError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      throw err
    }
  },
)

// ─── POST /settlements/:id/disburse — admin ────
settlementRoutes.post(
  '/:id/disburse',
  requireRole('admin'),
  async (c) => {
    try {
      const result = await settlementSvc.disburseSettlement(c.req.param('id'))
      return c.json({ success: true, data: { settlement: result } })
    } catch (err) {
      if (err instanceof SettlementError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
      throw err
    }
  },
)

// ─── POST /settlements/batch — admin trigger batch ────
settlementRoutes.post(
  '/batch',
  requireRole('admin'),
  async (c) => {
    const days = Number(c.req.query('days') || 3)
    const result = await runSettlementBatch(days)
    return c.json({ success: true, data: result })
  },
)

export default settlementRoutes
