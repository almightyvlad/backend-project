import { z } from 'zod'
import {
  jwtAccessExpiresInSchema,
  jwtAccessSecretSchema,
  kafkaBrokersSchema,
  logLevelSchema,
} from '@app/common'

export const notificationEnvSchema = z.object({
  NOTIFICATION_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  KAFKA_BROKERS: kafkaBrokersSchema,
  JWT_ACCESS_SECRET: jwtAccessSecretSchema,
  JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresInSchema,
  LOG_LEVEL: logLevelSchema,
})
