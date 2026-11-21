import { z } from 'zod'
import ms, { type StringValue } from 'ms'

export const logLevelSchema = z
  .enum(['error', 'warn', 'info', 'debug'])
  .default('info')

export const jwtAccessSecretSchema = z.string().min(1)

export const jwtAccessExpiresInSchema = z
  .string()
  .min(1)
  .refine(
    (value) => {
      const duration = ms(value as StringValue)
      return typeof duration === 'number' && duration > 0
    },
    {
      message: 'JWT_ACCESS_EXPIRES_IN must be a valid positive duration',
    },
  )
