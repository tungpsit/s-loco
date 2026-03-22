import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as comboSvc from '../services/combo.service'
import { ComboError } from '../services/combo.service'
import { getVendorByOwnerId } from '../services/vendor.service'

const comboRoutes = new Hono()

comboRoutes.get('/', async (c) => {
  const vendorId = c.req.query('vendor_id') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await comboSvc.listCombos({ vendor_id: vendorId, page, limit })
  return c.json({ success: true, data: result })
})

comboRoutes.post('/', authMiddleware(), requireRole('vendor_owner'), async (c) => {
  try {
    const userId = c.get('userId')!
    const vendorList = await getVendorByOwnerId(userId)
    if (!vendorList.length) return c.json({ success: false, error: { code: 'NO_VENDOR', message: 'Bạn chưa có cửa hàng.' } }, 400)
    const body = await c.req.json()
    const result = await comboSvc.createCombo(vendorList[0]!.id, body)
    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    if (err instanceof ComboError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    throw err
  }
})

comboRoutes.post('/:id/purchase', authMiddleware(), async (c) => {
  try {
    const userId = c.get('userId')!
    const body = await c.req.json() as { quantity?: number }
    const result = await comboSvc.purchaseCombo(c.req.param('id'), userId, body.quantity || 1)
    return c.json({ success: true, data: result }, 201)
  } catch (err) {
    if (err instanceof ComboError) return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    throw err
  }
})

export default comboRoutes
