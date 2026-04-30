import { z } from 'zod'

export const createReservationSchema = z.object({
  service_id: z.string().uuid('ID dịch vụ không hợp lệ'),
  party_size: z.coerce.number().int().min(1).max(100),
  requested_time: z.coerce.date(),
  customer_note: z.string().max(500).optional(),
})
export type CreateReservationInput = z.infer<typeof createReservationSchema>

export const reservationRejectSchema = z.object({
  reason: z.string().max(500).optional(),
})
export type ReservationRejectInput = z.infer<typeof reservationRejectSchema>
