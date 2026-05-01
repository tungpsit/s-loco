export type PricingInput = {
  originalPrice: string | number
  discountPrice?: string | number | null
  discountPercent?: string | number | null
  commissionRate?: string | number | null
  appDiscountPercent?: string | number | null
}

export type ServicePricing = {
  original_price: string
  vendor_price: string
  final_price: string
  vendor_discount_percent: string
  app_discount_percent: string
  display_discount_percent: string
  platform_margin_percent: string
}

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

function percent(value: string | number | null | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatPercent(value: number): string {
  return value.toFixed(2)
}

export function calculateServicePricing(input: PricingInput): ServicePricing {
  const original = money(input.originalPrice)
  const vendorPrice = input.discountPrice ? money(input.discountPrice) : original
  const appDiscount = percent(input.appDiscountPercent, 5)
  const commission = percent(input.commissionRate, 8)
  const finalPrice = Math.round(vendorPrice * (1 - appDiscount / 100))
  const vendorDiscount = input.discountPercent
    ? percent(input.discountPercent, 0)
    : original > 0
      ? ((original - vendorPrice) / original) * 100
      : 0
  const displayDiscount = original > 0 ? ((original - finalPrice) / original) * 100 : 0

  return {
    original_price: String(original),
    vendor_price: String(vendorPrice),
    final_price: String(finalPrice),
    vendor_discount_percent: formatPercent(vendorDiscount),
    app_discount_percent: formatPercent(appDiscount),
    display_discount_percent: formatPercent(displayDiscount),
    platform_margin_percent: formatPercent(Math.max(commission - appDiscount, 0)),
  }
}

export function withServicePricing<T extends { service: any; vendor: any }>(row: T): T {
  return {
    ...row,
    service: {
      ...row.service,
      pricing: calculateServicePricing({
        originalPrice: row.service.originalPrice,
        discountPrice: row.service.discountPrice,
        discountPercent: row.service.discountPercent,
        commissionRate: row.vendor.commissionRate,
        appDiscountPercent: row.vendor.appDiscountPercent,
      }),
    },
  }
}
