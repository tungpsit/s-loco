import { describe, expect, test } from 'bun:test'
import { adminUpdateVendorSchema, createVendorSchema } from '@S-Loco/shared/validators'
import { calculateServicePricing, withServicePricing } from '../src/services/pricing'

describe('vendor app discount validation', () => {
  test('defaults to allowing 5 percent app discount within 8 percent commission', () => {
    const parsed = createVendorSchema.parse({
      owner_id: '11111111-1111-4111-8111-111111111111',
      name: 'Vendor',
      slug: 'vendor',
    })

    expect(parsed.app_discount_percent).toBeUndefined()
  })

  test('rejects app discount greater than commission', () => {
    expect(() =>
      adminUpdateVendorSchema.parse({
        commission_rate: '3.00',
        app_discount_percent: '5.00',
      }),
    ).toThrow()
  })
})

describe('service pricing', () => {
  test('applies vendor discount then app discount and reports both layers', () => {
    const pricing = calculateServicePricing({
      originalPrice: '100000',
      discountPrice: '80000',
      discountPercent: '20.00',
      commissionRate: '8.00',
      appDiscountPercent: '5.00',
    })

    expect(pricing.vendor_price).toBe('80000')
    expect(pricing.final_price).toBe('76000')
    expect(pricing.vendor_discount_percent).toBe('20.00')
    expect(pricing.app_discount_percent).toBe('5.00')
    expect(pricing.platform_margin_percent).toBe('3.00')
    expect(pricing.display_discount_percent).toBe('24.00')
  })

  test('attaches normalized pricing to service rows', () => {
    const row = withServicePricing({
      service: { originalPrice: '100000', discountPrice: '90000', discountPercent: '10.00' },
      vendor: { commissionRate: '8.00', appDiscountPercent: '5.00' },
    })

    expect(row.service.pricing.final_price).toBe('85500')
    expect(row.service.pricing.app_discount_percent).toBe('5.00')
  })

  test('exposes reservation app discount from vendor config', () => {
    const pricing = calculateServicePricing({
      originalPrice: '500000',
      commissionRate: '10.00',
      appDiscountPercent: '6.00',
    })

    expect(pricing.app_discount_percent).toBe('6.00')
    expect(pricing.platform_margin_percent).toBe('4.00')
  })
})
