import { z } from 'zod'
import ms, { type StringValue } from 'ms'

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).refine((value) => {
    const duration = ms(value as StringValue)
    return typeof duration === 'number' && duration > 0
  },
    { message: 'JWT_ACCESS_EXPIRES_IN must be a valid positive duration' }
  ),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).refine((value) => {
    const duration = ms(value as StringValue)
    return typeof duration === 'number' && duration > 0
  },
    { message: 'JWT_REFRESH_EXPIRES_IN must be a valid positive duration' }),
})
