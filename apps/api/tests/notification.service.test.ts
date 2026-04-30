import { describe, expect, test } from 'bun:test'
import { buildOrderPaidNotifications } from '../src/services/notification.service'

describe('notification service', () => {
  test('builds payment success and unique vendor new order notifications', () => {
    const notifications = buildOrderPaidNotifications('customer-1', 'order-1234567890', [
      'vendor-owner-1',
      'vendor-owner-1',
      'vendor-owner-2',
    ])

    expect(notifications).toEqual([
      {
        userId: 'customer-1',
        type: 'payment_success',
        title: 'Thanh toán thành công!',
        body: 'Đơn hàng #order-12 đã được thanh toán. Voucher đã sẵn sàng.',
        data: { orderId: 'order-1234567890' },
      },
      {
        userId: 'vendor-owner-1',
        type: 'vendor_new_order',
        title: 'Đơn hàng mới!',
        body: 'Bạn có đơn hàng mới #order-12.',
        data: { orderId: 'order-1234567890' },
      },
      {
        userId: 'vendor-owner-2',
        type: 'vendor_new_order',
        title: 'Đơn hàng mới!',
        body: 'Bạn có đơn hàng mới #order-12.',
        data: { orderId: 'order-1234567890' },
      },
    ])
  })
})
