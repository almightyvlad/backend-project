import { z } from 'zod'
import ms, { type StringValue } from 'ms'

export const logLevelSchema = z
  .enum(['error', 'warn', 'info', 'debug'])
  .default('info')

export const kafkaBrokersSchema = z
  .string()
  .min(1)
  .default('localhost:9092')
  .transform((value) =>
    value
      .split(',')
      .map((broker) => broker.trim())
      .filter((broker) => broker.length > 0),
  )
  .refine((brokers) => brokers.length > 0, {
    message: 'KAFKA_BROKERS must contain at least one broker',
  })

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
