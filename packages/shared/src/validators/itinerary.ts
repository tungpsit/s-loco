import { z } from 'zod'
import { latitudeNumberSchema, longitudeNumberSchema } from './common'

export const itineraryGenerateSchema = z.object({
  days: z.coerce.number().int().min(1).max(14).optional(),
  budget: z.coerce.number().min(0).optional(),
  preferences: z.array(z.string().min(1).max(100)).optional(),
  group_type: z.string().min(1).max(100).optional(),
  stay_location_label: z.string().trim().max(300).optional(),
  stay_latitude: latitudeNumberSchema.optional(),
  stay_longitude: longitudeNumberSchema.optional(),
  prefer_near_stay: z.boolean().optional(),
})
export type ItineraryGenerateInput = z.infer<typeof itineraryGenerateSchema>
