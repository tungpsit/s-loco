import { Hono } from 'hono'
import { runSettlementBatch } from '../jobs/settlement-batch'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as settlementSvc from '../services/settlement.service'
import { SettlementError } from '../services/settlement.service'
import { getVendorByOwnerId } from '../services/vendor.service'

const settlementRoutes = new Hono<{
  Variables: { userId: string | null; userRole: string | null }
}>()
settlementRoutes.use('*', authMiddleware())

// ─── GET /settlements — vendor's settlement history ────
settlementRoutes.get('/', requireRole('vendor_owner'), async (c) => {
  const userId = c.get('userId')!
  const vendorList = await getVendorByOwnerId(userId)
  if (!vendorList.length) return c.json({ success: true, data: { items: [], total: 0 } })
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await settlementSvc.listSettlementsByVendor(vendorList[0]!.id, { page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /settlements/admin — admin list all ────
settlementRoutes.get('/admin', requireRole('admin'), async (c) => {
  const status = c.req.query('status') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await settlementSvc.listAllSettlements({ status, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /settlements/reconciliation — admin ────
settlementRoutes.get('/reconciliation', requireRole('admin'), async (c) => {
  const startStr =
    c.req.query('start') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const endStr = c.req.query('end') || new Date().toISOString()
  const result = await settlementSvc.getReconciliationReport(new Date(startStr), new Date(endStr))
  return c.json({ success: true, data: result })
})

// ─── POST /settlements/:id/approve — admin ────
settlementRoutes.post('/:id/approve', requireRole('admin'), async (c) => {
  try {
    const adminId = c.get('userId')!
    const result = await settlementSvc.approveSettlement(c.req.param('id')!, adminId)
    return c.json({ success: true, data: { settlement: result } })
  } catch (err) {
    if (err instanceof SettlementError)
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    throw err
  }
})

// ─── POST /settlements/:id/reject — admin ────
settlementRoutes.post('/:id/reject', requireRole('admin'), async (c) => {
  try {
    const result = await settlementSvc.rejectSettlement(c.req.param('id')!)
    return c.json({ success: true, data: { settlement: result } })
  } catch (err) {
    if (err instanceof SettlementError)
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    throw err
  }
})

// ─── POST /settlements/:id/disburse — admin ────
settlementRoutes.post('/:id/disburse', requireRole('admin'), async (c) => {
  try {
    const result = await settlementSvc.disburseSettlement(c.req.param('id')!)
    return c.json({ success: true, data: { settlement: result } })
  } catch (err) {
    if (err instanceof SettlementError)
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    throw err
  }
})

// ─── POST /settlements/batch — admin trigger batch ────
settlementRoutes.post('/batch', requireRole('admin'), async (c) => {
  const days = Number(c.req.query('days') || 3)
  const result = await runSettlementBatch(days)
  return c.json({ success: true, data: result })
})
// ─── GET /settlements/export — download CSV report ────
settlementRoutes.get('/export', requireRole('admin'), async (c) => {
  const result = await settlementSvc.listAllSettlements({ page: 1, limit: 1000 })
  const items = result.items

  const sep = ','
  const q = (v: string) => '"' + v.replace(/"/g, '""') + '"'
  const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('vi-VN') : '')
  const fmtMoney = (n: any) => Number(n || 0).toLocaleString('vi-VN')

  const header = [
    'Mã thanh toán',
    'Vendor',
    'Kỳ bắt đầu',
    'Kỳ kết thúc',
    'Tổng giá trị',
    'Hoa hồng',
    'Thực nhận',
    'Số voucher',
    'Trạng thái',
  ]
    .map(q)
    .join(sep)

  const statusMap: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    disbursed: 'Đã giải ngân',
    rejected: 'Từ chối',
  }

  const rows = items.map((row: any) => {
    const s = row.settlement || row
    const vendorName = row.vendor?.name || ''
    return [
      q('STL-' + (s.id || '').slice(0, 8).toUpperCase()),
      q(vendorName),
      q(fmtDate(s.periodStart)),
      q(fmtDate(s.periodEnd)),
      q(fmtMoney(s.totalAmount)),
      q(fmtMoney(s.commissionAmount)),
      q(fmtMoney(s.netAmount)),
      String(s.voucherCount ?? 0),
      q(statusMap[s.status] || s.status),
    ].join(sep)
  })

  const bom = '\uFEFF'
  const csv = bom + [header, ...rows].join('\r\n')

  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yyyy = now.getFullYear()
  const filename = `bao-cao-thanh-toan-${dd}-${mm}-${yyyy}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})

export default settlementRoutes
