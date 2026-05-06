import { giftByPhoneSchema, redeemVoucherSchema, selfRedeemSchema } from '@S-Loco/shared/validators'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { autoConfirmExpired } from '../jobs/auto-confirm'
import { authMiddleware, requireRole } from '../middleware/auth'
import * as giftSvc from '../services/gift.service'
import * as qrSvc from '../services/qr.service'
import { RefundError, requestPartialRefund } from '../services/refund.service'
import * as voucherSvc from '../services/voucher.service'
import { VoucherError } from '../services/voucher.service'
import { StateError } from '../services/voucher-state'

const voucherRoutes = new Hono<{ Variables: { userId: string | null; userRole: string | null } }>()

// All voucher routes require authentication
voucherRoutes.use('*', authMiddleware())

// ─── GET /vouchers — user's vouchers ────
voucherRoutes.get('/', async (c) => {
  const userId = c.get('userId')!
  const status = c.req.query('status') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await voucherSvc.listVouchersByUser(userId, { status, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /vouchers/vendor — vendor-owned voucher list ────
voucherRoutes.get('/vendor', requireRole('vendor_owner'), async (c) => {
  const userId = c.get('userId')!
  const { getVendorByOwnerId } = await import('../services/vendor.service')
  const vendorList = await getVendorByOwnerId(userId)
  const vendorIds = vendorList.map((vendor) => vendor.id)
  const status = c.req.query('status') || undefined
  const page = Number(c.req.query('page') || 1)
  const limit = Number(c.req.query('limit') || 20)
  const result = await voucherSvc.listVouchersByVendorIds(vendorIds, { status, page, limit })
  return c.json({ success: true, data: result })
})

// ─── GET /vouchers/vendor/:id — vendor-owned voucher detail ────
voucherRoutes.get('/vendor/:id', requireRole('vendor_owner'), async (c) => {
  try {
    const userId = c.get('userId')!
    const { getVendorByOwnerId } = await import('../services/vendor.service')
    const vendorList = await getVendorByOwnerId(userId)
    const vendorIds = vendorList.map((vendor) => vendor.id)
    const result = await voucherSvc.getVoucherDetailForVendor(c.req.param('id')!, vendorIds)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof VoucherError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── GET /vouchers/:id — voucher detail with QR ────
voucherRoutes.get('/:id', async (c) => {
  try {
    const voucherId = c.req.param('id')
    const userId = c.get('userId')!
    const result = await voucherSvc.getVoucherDetail(voucherId, userId)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof VoucherError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 404)
    }
    throw err
  }
})

// ─── POST /vouchers/redeem — vendor redeems (scans tourist QR) ────
voucherRoutes.post(
  '/redeem',
  requireRole('vendor_owner'),
  zValidator('json', redeemVoucherSchema),
  async (c) => {
    try {
      const { qr_token } = c.req.valid('json')
      // Vendor needs their vendor_id — get from their owned vendors
      const userId = c.get('userId')!
      const { getVendorByOwnerId } = await import('../services/vendor.service')
      const vendorList = await getVendorByOwnerId(userId)
      if (!vendorList.length) {
        return c.json(
          { success: false, error: { code: 'NO_VENDOR', message: 'Bạn chưa có cửa hàng.' } },
          400,
        )
      }
      // Try redeem against each vendor the owner has
      let redeemed = null
      let lastError: any = null
      for (const vendor of vendorList) {
        try {
          redeemed = await qrSvc.redeemByQr(qr_token, vendor.id)
          break
        } catch (err) {
          lastError = err
        }
      }
      if (!redeemed) {
        if (lastError instanceof VoucherError || lastError instanceof StateError) {
          const status = lastError.code === 'ALREADY_REDEEMED' ? 409 : 400
          return c.json(
            { success: false, error: { code: lastError.code, message: lastError.message } },
            status,
          )
        }
        throw lastError
      }
      return c.json({ success: true, data: { voucher: redeemed } })
    } catch (err) {
      if (err instanceof VoucherError || err instanceof StateError) {
        const status = err instanceof VoucherError && err.code === 'ALREADY_REDEEMED' ? 409 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── POST /vouchers/verify — verify QR without redeeming (QRSN-04) ───
voucherRoutes.post(
  '/verify',
  requireRole('vendor_owner'),
  zValidator('json', redeemVoucherSchema),
  async (c) => {
    try {
      const { qr_token } = c.req.valid('json')
      const preview = await qrSvc.previewVoucher(qr_token)
      return c.json({ success: true, data: { voucher: preview } })
    } catch (err) {
      if (err instanceof VoucherError) {
        const status = err.code === 'NOT_FOUND' ? 404 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── POST /vouchers/self-redeem — tourist self-redeems ────
voucherRoutes.post('/self-redeem', zValidator('json', selfRedeemSchema), async (c) => {
  try {
    const userId = c.get('userId')!
    const { voucher_id, vendor_id } = c.req.valid('json')
    const result = await qrSvc.selfRedeem(voucher_id, userId, vendor_id)
    return c.json({ success: true, data: { voucher: result } })
  } catch (err) {
    if (err instanceof VoucherError || err instanceof StateError) {
      const status = err instanceof VoucherError && err.code === 'ALREADY_REDEEMED' ? 409 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── POST /vouchers/:id/preview — vendor checks QR without redeeming ────
voucherRoutes.post('/:id/preview', requireRole('vendor_owner'), async (c) => {
  try {
    const qrToken = c.req.header('x-qr-token')
    if (!qrToken)
      return c.json(
        { success: false, error: { code: 'MISSING_TOKEN', message: 'Thiếu QR token.' } },
        400,
      )
    const result = await qrSvc.previewVoucher(qrToken)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof VoucherError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── POST /vouchers/:id/complete — vendor confirms completion ────
voucherRoutes.post('/:id/complete', requireRole('vendor_owner'), async (c) => {
  try {
    const voucherId = c.req.param('id')
    const userId = c.get('userId')!
    const { getVendorByOwnerId } = await import('../services/vendor.service')
    const vendorList = await getVendorByOwnerId(userId)
    const vendorIds = vendorList.map((v) => v.id)

    let completed = null
    for (const vendorId of vendorIds) {
      try {
        completed = await qrSvc.confirmCompletion(voucherId!, vendorId)
        break
      } catch {
        /* try next vendor */
      }
    }
    if (!completed) {
      return c.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Voucher không tồn tại hoặc bạn không có quyền.' },
        },
        404,
      )
    }
    return c.json({ success: true, data: { voucher: completed } })
  } catch (err) {
    if (err instanceof VoucherError || err instanceof StateError) {
      return c.json({ success: false, error: { code: err.code, message: err.message } }, 400)
    }
    throw err
  }
})

// ─── POST /vouchers/:id/gift/phone — gift voucher by phone ────
voucherRoutes.post(
  '/:id/gift/phone',
  requireRole('tourist'),
  zValidator('json', giftByPhoneSchema),
  async (c) => {
    try {
      const voucherId = c.req.param('id')
      const senderId = c.get('userId')!
      const { recipient_phone, message } = c.req.valid('json')
      const result = await giftSvc.giftByPhone({
        voucherId,
        senderId,
        recipientPhone: recipient_phone,
        message,
      })
      return c.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof giftSvc.GiftError) {
        const status = err.code === 'NOT_FOUND' ? 404 : 400
        return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
      }
      throw err
    }
  },
)

// ─── POST /vouchers/:id/gift/link — create one-time gift link ────
voucherRoutes.post('/:id/gift/link', requireRole('tourist'), async (c) => {
  try {
    const voucherId = c.req.param('id')
    if (!voucherId) {
      return c.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Voucher ID không hợp lệ.' },
        },
        400,
      )
    }

    const senderId = c.get('userId')
    if (!senderId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        401,
      )
    }

    const result = await giftSvc.createGiftLink({ voucherId, senderId })
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof giftSvc.GiftError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

// ─── POST /vouchers/auto-confirm — trigger auto-confirm (admin/cron) ────
voucherRoutes.post('/auto-confirm', requireRole('admin'), async (c) => {
  const result = await autoConfirmExpired()
  return c.json({ success: true, data: result })
})

// ---- POST /vouchers/:id/refund — partial refund (single voucher) ────
voucherRoutes.post('/:id/refund', requireRole('tourist'), async (c) => {
  try {
    const voucherId = c.req.param('id')
    if (!voucherId) {
      return c.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Voucher ID không hợp lệ.' },
        },
        400,
      )
    }

    const userId = c.get('userId')
    if (!userId) {
      return c.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        401,
      )
    }

    const body = (await c.req.json()) as { reason?: string }
    const result = await requestPartialRefund(voucherId, userId, body.reason)
    return c.json({ success: true, data: result })
  } catch (err) {
    if (err instanceof RefundError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400
      return c.json({ success: false, error: { code: err.code, message: err.message } }, status)
    }
    throw err
  }
})

export default voucherRoutes
