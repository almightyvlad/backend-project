import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export const avatarCleanupConfig = registerAs('avatarCleanup', () => {
  const env = envSchema.parse(process.env)
  return {
    cron: env.AVATAR_CLEANUP_CRON,
    retentionDays: env.AVATAR_CLEANUP_RETENTION_DAYS,
  }
})
