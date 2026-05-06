import { describe, expect, test } from 'bun:test'
import {
  buildSePayCheckoutFields,
  getSePayCheckoutActionUrl,
  parseSePayIpn,
  signSePayFields,
  signSePayIpnFields,
  verifySePayIpn,
} from '../src/gateways/sepay'

describe('SePay gateway helpers', () => {
  test('signSePayFields signs documented checkout fields in stable order', () => {
    const fields = {
      merchant: 'MERCHANT_1',
      currency: 'VND',
      order_amount: '100000',
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_description: 'Thanh toan don hang DH123',
      order_invoice_number: 'DH123',
      success_url: 'https://example.com/order/DH123?payment=success',
      error_url: 'https://example.com/order/DH123?payment=error',
      cancel_url: 'https://example.com/order/DH123?payment=cancel',
    }

    const signature = signSePayFields(fields, 'SECRET_1')

    expect(signature).toBe('7HGf37leeKLYIZUjZDJH7lZakNQkvsqFFbW5Bj5X4CI=')
  })

  test('buildSePayCheckoutFields returns signed BANK_TRANSFER checkout fields', () => {
    const fields = buildSePayCheckoutFields({
      merchantId: 'MERCHANT_1',
      secretKey: 'SECRET_1',
      invoiceNumber: 'SL-ORDER-1',
      amount: 120000,
      description: 'S-Loco #ORDER-1',
      successUrl: 'https://api.example.com/api/v1/payments/return?payment=success',
      errorUrl: 'https://api.example.com/api/v1/payments/return?payment=error',
      cancelUrl: 'https://api.example.com/api/v1/payments/return?payment=cancel',
    })

    expect(fields).toMatchObject({
      merchant: 'MERCHANT_1',
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_amount: '120000',
      currency: 'VND',
      order_invoice_number: 'SL-ORDER-1',
      order_description: 'S-Loco #ORDER-1',
    })
    expect(fields.signature).toBe(signSePayFields(fields, 'SECRET_1'))
  })

  test('parseSePayIpn normalizes ORDER_PAID payload', () => {
    const parsed = parseSePayIpn({
      notification_type: 'ORDER_PAID',
      order: {
        order_invoice_number: 'SL-abc123',
        order_amount: '100000.00',
        order_status: 'CAPTURED',
      },
      transaction: {
        transaction_id: 'sepay-txn-1',
        transaction_amount: '100000',
        transaction_status: 'APPROVED',
      },
    })

    expect(parsed).toEqual({
      transactionId: 'SL-abc123',
      orderId: 'SL-abc123',
      amount: 100000,
      success: true,
      rawData: expect.any(Object),
    })
  })

  test('parseSePayIpn treats non-paid notifications as failed', () => {
    const parsed = parseSePayIpn({
      notification_type: 'ORDER_FAILED',
      order: { order_invoice_number: 'SL-abc123', order_amount: '100000.00' },
      transaction: { transaction_amount: '100000', transaction_status: 'DECLINED' },
    })

    expect(parsed.success).toBe(false)
    expect(parsed.transactionId).toBe('SL-abc123')
    expect(parsed.amount).toBe(100000)
  })

  test('parseSePayIpn accepts flat SePay IPN payload variants', () => {
    const parsed = parseSePayIpn({
      notification_type: 'ORDER_PAID',
      order_invoice_number: 'SL-flat-1',
      order_amount: '200000',
      order_status: 'CAPTURED',
      transaction_amount: '200000',
      transaction_status: 'APPROVED',
    })

    expect(parsed.success).toBe(true)
    expect(parsed.transactionId).toBe('SL-flat-1')
    expect(parsed.amount).toBe(200000)
  })

  test('verifySePayIpn accepts documented payload shape without optional signature', () => {
    expect(verifySePayIpn({
      notification_type: 'ORDER_PAID',
      order: { order_invoice_number: 'SL-abc123', order_amount: '100000.00' },
      transaction: { transaction_amount: '100000' },
    }, '')).toBe(true)
  })

  test('verifySePayIpn verifies signature when SePay sends one', () => {
    const payload = {
      notification_type: 'ORDER_PAID',
      order: { order_invoice_number: 'SL-abc123', order_amount: '100000.00' },
      transaction: { transaction_amount: '100000' },
    }
    const signature = signSePayIpnFields({
      notification_type: 'ORDER_PAID',
      order_invoice_number: 'SL-abc123',
      amount: '100000',
    }, 'SECRET_1')

    expect(verifySePayIpn(payload, signature, 'SECRET_1')).toBe(true)
    expect(verifySePayIpn(payload, 'bad-signature', 'SECRET_1')).toBe(false)
  })

  test('getSePayCheckoutActionUrl selects sandbox and production URLs', () => {
    expect(getSePayCheckoutActionUrl('sandbox')).toBe('https://pay-sandbox.sepay.vn/v1/checkout/init')
    expect(getSePayCheckoutActionUrl('production')).toBe('https://pay.sepay.vn/v1/checkout/init')
  })
})
