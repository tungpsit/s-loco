import { describe, expect, test } from 'bun:test'
import {
  getManualRefundCompleteStatus,
  getPendingPaymentPollDecision,
  getRefundCompletionStatus,
} from '../src/services/payment.service'

describe('payment policy helpers', () => {
  test('SePay refund completion is manual processing, not automatic money refund', () => {
    expect(getRefundCompletionStatus('sepay')).toEqual({
      refundStatus: 'manual_processing',
      paymentStatus: 'success',
      message: 'Yêu cầu hoàn tiền SePay đã được ghi nhận và cần vận hành xử lý thủ công.',
    })
  })

  test('non-SePay successful gateway refund may complete payment refund state', () => {
    expect(getRefundCompletionStatus('vnpay')).toEqual({
      refundStatus: 'completed',
      paymentStatus: 'refunded',
      message: 'Yêu cầu hoàn tiền đã được xử lý.',
    })
  })

  test('admin completion of manual refund is idempotent', () => {
    expect(getManualRefundCompleteStatus('manual_processing')).toEqual({
      refundStatus: 'completed',
      message: 'Refund đã được đánh dấu hoàn tất.',
    })
    expect(getManualRefundCompleteStatus('completed')).toEqual({
      refundStatus: 'completed',
      message: 'Refund đã hoàn tất trước đó.',
    })
  })

  test('admin completion rejects failed refund states', () => {
    expect(() => getManualRefundCompleteStatus('failed')).toThrow('Refund không ở trạng thái có thể hoàn tất.')
  })

  test('pending payment polling only expires stale payments after configured cutoff', () => {
    const now = new Date('2026-05-06T00:00:00.000Z')
    expect(getPendingPaymentPollDecision(new Date('2026-05-05T23:20:01.000Z'), now)).toBe('keep_pending')
    expect(getPendingPaymentPollDecision(new Date('2026-05-05T23:20:00.000Z'), now)).toBe('expire')
  })
})
