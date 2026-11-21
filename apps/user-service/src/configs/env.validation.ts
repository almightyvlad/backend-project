import { z } from 'zod'
import ms, { type StringValue } from 'ms'
import {
  jwtAccessExpiresInSchema,
  jwtAccessSecretSchema,
  logLevelSchema,
} from '@app/common'

export const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().min(1),

  MINIO_ROOT_USER: z.string().min(1),
  MINIO_ROOT_PASSWORD: z.string().min(8),
  MINIO_API_PORT: z.coerce.number().int().min(1).max(65535),
  MINIO_CONSOLE_PORT: z.coerce.number().int().min(1).max(65535),
  MINIO_ENDPOINT: z.string().url(),
  MINIO_REGION: z.string().min(1),
  MINIO_BUCKET: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().min(1).max(65535),

  JWT_ACCESS_SECRET: jwtAccessSecretSchema,
  JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresInSchema,

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .min(1)
    .refine(
      (value) => {
        const duration = ms(value as StringValue)
        return typeof duration === 'number' && duration > 0
      },
      {
        message: 'JWT_REFRESH_EXPIRES_IN must be a valid positive duration',
      },
    ),

  LOG_LEVEL: logLevelSchema,
  AVATAR_CLEANUP_CRON: z.string().min(1).default('0 3 * * *'),
  AVATAR_CLEANUP_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
})
