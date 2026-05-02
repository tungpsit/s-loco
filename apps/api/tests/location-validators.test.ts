import {
  createVendorSchema,
  serviceFilterSchema,
  updateVendorSchema,
} from '@S-Loco/shared/validators'
import { describe, expect, test } from 'bun:test'

describe('location validators', () => {
  test('vendor schemas accept valid latitude and longitude strings', () => {
    const created = createVendorSchema.parse({
      owner_id: '00000000-0000-4000-8000-000000000001',
      name: 'Nhà hàng gần biển',
      slug: 'nha-hang-gan-bien',
      latitude: '19.7451234',
      longitude: '105.9012345',
    })
    const updated = updateVendorSchema.parse({
      latitude: '19.7451234',
      longitude: '105.9012345',
    })

    expect(created.latitude).toBe('19.7451234')
    expect(created.longitude).toBe('105.9012345')
    expect(updated.latitude).toBe('19.7451234')
    expect(updated.longitude).toBe('105.9012345')
  })

  test('vendor schemas reject latitude and longitude outside earth bounds', () => {
    expect(() => updateVendorSchema.parse({ latitude: '91', longitude: '105.9' })).toThrow()
    expect(() => updateVendorSchema.parse({ latitude: '19.75', longitude: '181' })).toThrow()
  })

  test('service filters accept origin coordinates and distance sorting', () => {
    const parsed = serviceFilterSchema.parse({
      origin_latitude: '19.745',
      origin_longitude: '105.901',
      max_distance: '2.5',
      sort: 'distance_asc',
    })

    expect(parsed.origin_latitude).toBe(19.745)
    expect(parsed.origin_longitude).toBe(105.901)
    expect(parsed.max_distance).toBe(2.5)
    expect(parsed.sort).toBe('distance_asc')
  })
})
