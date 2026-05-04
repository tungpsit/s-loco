import { describe, expect, test } from 'bun:test'
import { createServiceSchema, updateServiceSchema } from '@S-Loco/shared/validators'
import {
  artifactTypeForProductType,
  fulfillmentTypeForProductType,
  normalizeProductType,
  productTypeForFulfillmentType,
  productTypeLabel,
  settlementDirectionForProductType,
} from '../src/services/product-types'

describe('product type taxonomy', () => {
  test('maps legacy fulfillment types to explicit product types', () => {
    expect(productTypeForFulfillmentType('reservation')).toBe('coupon')
    expect(productTypeForFulfillmentType('fixed_price')).toBe('voucher')
    expect(productTypeForFulfillmentType(null)).toBe('voucher')
  })

  test('maps product types to compatible fulfillment and artifact types', () => {
    expect(fulfillmentTypeForProductType('coupon')).toBe('reservation')
    expect(fulfillmentTypeForProductType('voucher')).toBe('fixed_price')
    expect(fulfillmentTypeForProductType('ticket')).toBe('fixed_price')
    expect(artifactTypeForProductType('coupon')).toBeNull()
    expect(artifactTypeForProductType('voucher')).toBe('voucher')
    expect(artifactTypeForProductType('ticket')).toBe('ticket')
  })

  test('normalizes missing product type from fulfillment type fallback', () => {
    expect(normalizeProductType({ productType: undefined, fulfillmentType: 'reservation' })).toBe('coupon')
    expect(normalizeProductType({ productType: null, fulfillmentType: 'fixed_price' })).toBe('voucher')
    expect(normalizeProductType({ productType: 'ticket', fulfillmentType: 'reservation' })).toBe('ticket')
  })

  test('returns Vietnamese labels for app display', () => {
    expect(productTypeLabel('coupon')).toBe('Mã giảm giá')
    expect(productTypeLabel('voucher')).toBe('Voucher')
    expect(productTypeLabel('ticket')).toBe('Vé')
  })

  test('maps product types to settlement cash-flow direction', () => {
    expect(settlementDirectionForProductType('coupon')).toBe('vendor_pays_sloco')
    expect(settlementDirectionForProductType('voucher')).toBe('sloco_pays_vendor')
    expect(settlementDirectionForProductType('ticket')).toBe('sloco_pays_vendor')
  })
})

describe('service validators product type support', () => {
  test('accepts creating coupon, voucher, and ticket services', () => {
    for (const productType of ['coupon', 'voucher', 'ticket'] as const) {
      const parsed = createServiceSchema.parse({
        name: `Demo ${productType}`,
        slug: `demo-${productType}`,
        category_id: '11111111-1111-4111-8111-111111111111',
        product_type: productType,
        original_price: productType === 'coupon' ? '0' : '100000',
        reservation_discount_percent: productType === 'coupon' ? '5.00' : undefined,
      })

      expect(parsed.product_type).toBe(productType)
    }
  })

  test('derives legacy fulfillment type from product type when provided', () => {
    expect(createServiceSchema.parse({
      name: 'Coupon nhà hàng',
      slug: 'coupon-nha-hang',
      category_id: '11111111-1111-4111-8111-111111111111',
      product_type: 'coupon',
      original_price: '0',
      reservation_discount_percent: '5.00',
    }).fulfillment_type).toBe('reservation')

    expect(updateServiceSchema.parse({ product_type: 'ticket' }).fulfillment_type).toBe('fixed_price')
  })
})
