import { registerAs } from '@nestjs/config'
import { notificationEnvSchema } from './env.validation.js'

export const appConfig = registerAs('app', () => {
  const env = notificationEnvSchema.parse(process.env)

  return {
    port: env.NOTIFICATION_PORT,
  }
})
