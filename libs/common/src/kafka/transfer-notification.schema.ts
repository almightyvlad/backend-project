import { z } from 'zod'

const positiveUserIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .refine((value) => Number.isSafeInteger(Number(value)), {
    message: 'User id must be a positive integer',
  })
  .transform((value) => Number(value))

export const transferNotificationSchema = z.object({
  eventId: z.string().min(1),
  fromUserId: positiveUserIdSchema,
  toUserId: positiveUserIdSchema,
  amount: z.string().min(1),
  occurredAt: z.string().min(1),
})

export type ParsedTransferNotification = z.infer<
  typeof transferNotificationSchema
>
