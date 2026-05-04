export const PRODUCT_TYPES = ['coupon', 'voucher', 'ticket'] as const
export type ProductType = (typeof PRODUCT_TYPES)[number]

export const ARTIFACT_TYPES = ['voucher', 'ticket'] as const
export type ArtifactType = (typeof ARTIFACT_TYPES)[number]

export const SETTLEMENT_DIRECTIONS = ['sloco_pays_vendor', 'vendor_pays_sloco'] as const
export type SettlementDirection = (typeof SETTLEMENT_DIRECTIONS)[number]

export type LegacyFulfillmentType = 'fixed_price' | 'reservation' | null | undefined

export function productTypeForFulfillmentType(fulfillmentType: LegacyFulfillmentType): ProductType {
  return fulfillmentType === 'reservation' ? 'coupon' : 'voucher'
}

export function fulfillmentTypeForProductType(productType: ProductType): 'fixed_price' | 'reservation' {
  return productType === 'coupon' ? 'reservation' : 'fixed_price'
}

export function artifactTypeForProductType(productType: ProductType): ArtifactType | null {
  if (productType === 'ticket') return 'ticket'
  if (productType === 'voucher') return 'voucher'
  return null
}

export function normalizeProductType(input: {
  productType?: ProductType | null
  fulfillmentType?: LegacyFulfillmentType
}): ProductType {
  return input.productType ?? productTypeForFulfillmentType(input.fulfillmentType)
}

export function productTypeLabel(productType: ProductType): string {
  if (productType === 'coupon') return 'Mã giảm giá'
  if (productType === 'ticket') return 'Vé'
  return 'Voucher'
}

export function settlementDirectionForProductType(productType: ProductType): SettlementDirection {
  return productType === 'coupon' ? 'vendor_pays_sloco' : 'sloco_pays_vendor'
}
